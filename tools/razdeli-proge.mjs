// Razdelitev skupnih seznamov prog po progah (docs/razdelitev-prog.md): kar ima prava proga v skupnih seznamih, gre v njeno datoteko
// js/tracks/<id>.js, da se veje, ki dodajajo ali urejajo različne proge, ne srečajo v isti vrstici. Testne proge (test: true) ostanejo, kjer so.
//   node tools/razdeli-proge.mjs             premakne vnose pravih prog in poskrbi za vrstice, ki sezname ob nalaganju napolnijo iz datotek prog
//   node tools/razdeli-proge.mjs --check     samo preveri (tests/razdelitev.test.js): izhod 1, če bi orodje kaj spremenilo
//   ... --seznam | --proga                   ob razliki med vnosom v seznamu (delom v js/world-rbring.js) in datoteko proge (njenim delom
//                                            sveta) obdrži seznam oz. datoteko proge; brez izbire ob razliki ne spremeni ničesar (izhod 2)
//   ... --seznam=spa,rio --proga=bathurst    izbira le za naštete proge (id), druge po golem --seznam/--proga ali brez izbire
// Seznami (SPECS): js/render.js THEMES + SPLIT -> look (look.split), js/game.js EN_NAME -> say, RAIN_P -> rainP, js/world.js CLOUD_TH -> cloudTh,
// ROAD_WEAR -> roadWear, GRASS_NAT -> grassNat, LAWN -> lawn, BB_CLASSIC -> bbClassic, js/world-zivali.js ZIV -> zivali. Vnosi gredo na začetek
// opisa proge (takoj za vrstico TRACK_DEFS.push(), v blok pod vrstico z oznako tega orodja); za vsakim seznamom je ustvarjena vrstica, ki ga
// napolni iz TRACK_DEFS. V js/world.js še sproščanje mrež zadnje gradnje: vrstice »if (THEME !== ...) API.X = null;« postanejo
// World.keep('X', tema) v datoteki sveta proge (pred World.ext.<tema> = ...) in ena skupna vrstica v build(). Lastni deli Bathursta, Ria in
// Crystal Palace iz js/world-rbring.js gredo v js/world-bathurst.js, js/world-rio.js, js/world-cpalace.js (WSPLIT, korak 6).
// Ponovni zagon ne spremeni ničesar. Spor ob spajanju v vrstici skupnega seznama: obdrži stran s starim seznamom (vsi vnosi), nato to orodje
// (postopek v docs/razdelitev-prog.md); THEMES ali SPLIT sam (spoj obdrži eno polovico): druga polovica iz look v datoteki proge.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const REPO = process.env.RAZDELI_ROOT ? path.resolve(process.env.RAZDELI_ROOT) : path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');   // (RAZDELI_ROOT: a copy, tests/razdelitev.test.js)
const args = process.argv.slice(2), CHECK = args.includes('--check');
const bad = args.filter(a => !/^--(check|(seznam|proga)(=[\w,-]+)?)$/.test(a));
if (bad.length) { console.error(`razdeli-proge: ne poznam ${bad.join(' ')} (--check, --seznam[=id,…], --proga[=id,…])`); process.exit(2); }
const PICK = new Map(); let pickAll = null;   // (a track's choice on a difference: 'map' the list's, 'def' its file's)
for (const a of args) {
  const m = /^--(seznam|proga)(?:=(.*))?$/.exec(a); if (!m) continue;
  const v = m[1] === 'seznam' ? 'map' : 'def';
  if (m[2] == null) { if (pickAll && pickAll !== v) { console.error('razdeli-proge: --seznam in --proga hkrati brez naštetih prog'); process.exit(2); } pickAll = v; continue; }
  for (const id of m[2].split(',').filter(Boolean)) { if (PICK.has(id) && PICK.get(id) !== v) { console.error(`razdeli-proge: ${id} v --seznam in --proga`); process.exit(2); } PICK.set(id, v); }
}
const PREFER = (id) => PICK.get(id) || pickAll;   // (id: the track's, as in js/tracks/<id>.js, or a part's theme)
const idOf = (f) => path.basename(f, '.js');
const files = new Map();   // path -> text (read once, written at the end)
const rd = (f) => { if (!files.has(f)) files.set(f, fs.readFileSync(path.join(REPO, f), 'utf8')); return files.get(f); };
const orig = new Map();
const put = (f, s) => { if (!orig.has(f)) orig.set(f, files.has(f) || fs.existsSync(path.join(REPO, f)) ? rd(f) : null); files.set(f, s); };   // (orig null: a new file)
const lineAt = (s, i) => s.slice(0, i).split('\n').length;
const same = (a, b) => {   // deep equality of plain data, whatever realm (sandbox) made it
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return Number.isNaN(a) && Number.isNaN(b);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && same(a[k], b[k]));
};
const fail = (m) => { console.error('razdeli-proge: ' + m); process.exit(2); };

/* ---- a small scanner for the lists' literals: strings, comments, brackets (no regular expressions or templates in them) ---- */
const skipStr = (s, i) => { const q = s[i++]; while (i < s.length && s[i] !== q) { if (s[i] === '\\') i++; i++; } return i + 1; };
const isCom = (s, i) => s[i] === '/' && (s[i + 1] === '/' || s[i + 1] === '*');
const skipCom = (s, i) => { if (s[i + 1] === '/') { const e = s.indexOf('\n', i); return e < 0 ? s.length : e; } const e = s.indexOf('*/', i + 2); return e < 0 ? s.length : e + 2; };
const skipWs = (s, i) => { for (;;) { while (i < s.length && /\s/.test(s[i])) i++; if (isCom(s, i)) { i = skipCom(s, i); continue; } return i; } };
function exprEnd(s, i) {   // the first ',' or ';' or closing bracket at depth 0 from i
  let d = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'" || c === '`') { i = skipStr(s, i); continue; }
    if (isCom(s, i)) { i = skipCom(s, i); continue; }
    if ('([{'.includes(c)) d++;
    else if (')]}'.includes(c)) { if (d === 0) return i; d--; }
    else if ((c === ',' || c === ';') && d === 0) return i;
    i++;
  }
  return i;
}
function parseObj(s, open) {   // s[open] === '{': its entries { key, ks (the key's start), ve (the value's end), val }, close
  const ents = []; let i = open + 1;
  for (;;) {
    i = skipWs(s, i);
    if (s[i] === '}') return { open, close: i, ents };
    const ks = i; let key;
    if (s[i] === '"' || s[i] === "'") { const e = skipStr(s, i); key = s.slice(i + 1, e - 1); i = e; }
    else { const m = /^[A-Za-z_$][\w$]*/.exec(s.slice(i, i + 80)); if (!m) fail(`ključa ni v vrstici ${lineAt(s, i)}`); key = m[0]; i += key.length; }
    i = skipWs(s, i); if (s[i] !== ':') fail(`pričakovano »:« v vrstici ${lineAt(s, i)}`);
    const vs = skipWs(s, i + 1), e = exprEnd(s, vs); let ve = e; while (ve > vs && /\s/.test(s[ve - 1])) ve--;
    ents.push({ key, ks, ve, val: s.slice(vs, ve) });
    i = e; if (s[i] === ',') i++;
  }
}
const evalLit = (t, where) => { try { return vm.runInNewContext('(' + t + ')', Object.create(null)); } catch (e) { fail(`vrednost ni čisti podatek (${where}): ${t.slice(0, 80)}`); } };
const lineStart = (s, i) => s.lastIndexOf('\n', i - 1) + 1;
const lineEnd = (s, i) => { const e = s.indexOf('\n', i); return e < 0 ? s.length : e; };
const comOf = (rest) => { const m = /\/\/\s?(.*)$/.exec(rest); return m ? m[1].trim() : ''; };   // the // comment in the rest of a line

/* ---- the tracks: every js/tracks/*.js in index.html's order, run in a sandbox (the defs as the game has them), which file declares what ---- */
const pageScripts = () => [...rd('index.html').matchAll(/<script\b[^>]*\bsrc="([^"?#]+)[^"]*"/g)].map(m => m[1]);
const trackFiles = () => pageScripts().filter(f => /^js\/tracks\/[a-z0-9]+\.js$/.test(f));
function defsOf(texts) {   // file -> [def, ...] (texts: the files' current text)
  const ctx = vm.createContext({ console }), out = new Map();
  vm.runInContext('var TRACK_DEFS = [];', ctx);
  for (const f of trackFiles()) {
    const n0 = vm.runInContext('TRACK_DEFS.length', ctx);
    vm.runInContext(texts(f), ctx, { filename: f });
    out.set(f, vm.runInContext(`TRACK_DEFS.slice(${n0})`, ctx));
  }
  return out;
}
const TF = trackFiles(), D0 = defsOf(rd);
const byId = new Map(), byTheme = new Map();   // real tracks only: id -> file; theme -> files that declare it (theme: '...' in their text)
for (const f of TF) for (const d of D0.get(f)) {
  if (d.test) continue;
  byId.set(d.id, f);
  if (new RegExp(`\\btheme:\\s*'${d.theme}'`).test(rd(f))) { if (!byTheme.has(d.theme)) byTheme.set(d.theme, []); if (!byTheme.get(d.theme).includes(f)) byTheme.get(d.theme).push(f); }
}
const realTheme = new Set(); for (const ds of D0.values()) for (const d of ds) if (!d.test && d.theme) realTheme.add(d.theme);

/* ---- the lists ---- */
const DEFS = '(typeof TRACK_DEFS !== \'undefined\' ? TRACK_DEFS : [])';
const SPECS = [
  { file: 'js/game.js', name: 'EN_NAME', field: 'say', by: 'id' },
  { file: 'js/game.js', name: 'RAIN_P', field: 'rainP', by: 'id' },
  { file: 'js/world.js', name: 'CLOUD_TH', field: 'cloudTh', by: 'theme' },
  { file: 'js/world.js', name: 'ROAD_WEAR', field: 'roadWear', by: 'theme' },
  { file: 'js/world.js', name: 'GRASS_NAT', field: 'grassNat', by: 'theme' },
  { file: 'js/world.js', name: 'LAWN', field: 'lawn', by: 'theme' },
  { file: 'js/world.js', name: 'BB_CLASSIC', field: 'bbClassic', by: 'theme' },
  { file: 'js/world-zivali.js', name: 'ZIV', field: 'zivali', by: 'id' },
];
const MARK = 'tools/razdeli-proge.mjs';
const fill = (sp, ind) => `${ind}for (const d of ${DEFS}) if (d.${sp.field} != null && d.${sp.by} != null && ${sp.name}[d.${sp.by}] == null) ${sp.name}[d.${sp.by}] = d.${sp.field};   // (the real tracks' own: def.${sp.field} in js/tracks/<id>.js, ${MARK})`;
const fillLook = (ind) => `${ind}for (const d of ${DEFS}) if (d.look && d.theme && !THEMES[d.theme]) { THEMES[d.theme] = d.look; if (d.look.split) SPLIT[d.theme] = d.look.split; }   // (the real tracks' own: def.look in js/tracks/<id>.js, ${MARK}; and at the build, below, as before)`;

// what moves: file -> field -> { val (source text), com, from }
const moves = new Map();
const addMove = (f, field, val, com, from) => {
  if (!moves.has(f)) moves.set(f, new Map());
  const M = moves.get(f), o = M.get(field);
  if (o && !same(evalLit(o.val, from), evalLit(val, from))) fail(`${f}: dva različna vnosa za ${field} (${o.from}, ${from})`);
  if (!o) M.set(field, { val, com, from });
};
const targets = (sp, key) => {   // the files a list's key moves to ([] when it stays: a test track's, or no track's)
  if (sp.by === 'id') {
    const f = byId.get(key); if (!f) return [];
    const d = D0.get(f).find(x => x.id === key);
    if (d.variantOf) return null;   // (a variant, as pikesg: it takes its parent's, see below)
    return [f];
  }
  return realTheme.has(key) ? (byTheme.get(key) || fail(`tema ${key} prave proge ni zapisana v nobeni datoteki proge`)) : [];
};

// remove the entries rm (indexes into ents) from the literal at [open, close] of s: line by line, the line's other entries kept as they were
function removeEntries(s, P, rm, declInd) {
  const groups = [];   // runs of entries on the same lines (an entry's value may go on over more lines): { L, E, ks }
  P.ents.forEach((e, k) => {
    const L = lineStart(s, e.ks), E = lineEnd(s, e.ve), g = groups[groups.length - 1];
    if (g && L <= g.E) { g.ks.push(k); g.E = Math.max(g.E, E); } else groups.push({ L, E, ks: [k] });
  });
  const edits = [];   // [from, to, text]
  for (const { L, E, ks } of groups) {
    if (!ks.some(k => rm.has(k))) continue;
    const first = P.ents[ks[0]], last = P.ents[ks[ks.length - 1]];
    const pre = s.slice(L, first.ks), suf = s.slice(last.ve, E), keep = ks.filter(k => !rm.has(k)).map(k => s.slice(P.ents[k].ks, P.ents[k].ve));
    if (keep.length) edits.push([L, E, pre + keep.join(', ') + suf]);
    else if (!pre.trim() && !/[}\])]/.test(suf.replace(/\/\/.*$/, ''))) edits.push([L, Math.min(E + 1, s.length), '']);   // (a line of entries only: away)
    else if (!pre.trim()) edits.push([L, E, declInd + suf.replace(/^,?\s*/, '')]);   // (the last line, with the list's end: the end kept)
    else edits.push([L, E, pre.replace(/\s+$/, '') + suf.replace(/^,?\s*/, '')]);   // (a list on one line: { } left)
  }
  edits.sort((a, b) => b[0] - a[0]);
  for (const [a, b, t] of edits) s = s.slice(0, a) + t + s.slice(b);
  return s;
}
const declAt = (s, name) => {   // the list's literal: { open, decl (the declaration line's start), ind }
  const m = new RegExp(`\\b${name} = \\{`).exec(s); if (!m) return null;
  const open = m.index + m[0].length - 1, decl = lineStart(s, m.index);
  return { open, decl, ind: /^\s*/.exec(s.slice(decl))[0] };
};
const stmtEnd = (s, i) => { while (i < s.length && s[i] !== ';') { const e = exprEnd(s, i); i = e === i ? i + 1 : e; } return lineEnd(s, i); };   // the end of the line where the statement from i ends
function ensureLine(s, after, line) {   // the generated line right after position after's line, unless it is there already
  if (s.includes(line)) return s;
  const e = lineEnd(s, after); return s.slice(0, e) + '\n' + line + s.slice(e);
}
const dropOld = (s, re) => s.split('\n').filter(l => !(l.includes(MARK) && re.test(l))).join('\n');   // an older generated line of the same list
function fileLook(f) {   // a track file's look as text, as it is now: { base (without split), split, com } (its block's look: line, or one elsewhere in its def)
  const t = rd(f), p = t.indexOf('TRACK_DEFS.push('); if (p < 0) return null;
  const re = /^[ \t]*look:\s*\{/mg; re.lastIndex = p; const m = re.exec(t); if (!m) return null;
  const vs = m.index + m[0].length - 1, e = exprEnd(t, vs), val = t.slice(vs, e).trim(), P = parseObj(val, 0), k = P.ents.findIndex(x => x.key === 'split');
  return { base: k < 0 ? val : removeEntries(val, P, new Set([k]), ''), split: k < 0 ? null : P.ents[k].val, com: comOf(t.slice(e, lineEnd(t, e))) };
}
const noSplit = (o) => { if (!o || typeof o !== 'object') return o; const c = Object.assign({}, o); delete c.split; return c; };

/* ---- 1. the plain lists ---- */
for (const sp of SPECS) {
  let s = rd(sp.file); const A = declAt(s, sp.name); if (!A) fail(`${sp.file}: seznama ${sp.name} ni`);
  const P = parseObj(s, A.open), rm = new Set();
  P.ents.forEach((e, k) => {
    const T = targets(sp, e.key); if (T && !T.length) return;
    if (T === null) {   // a variant: its parent gives it the same through Object.assign (game.js / world-zivali.js read the def)
      const f = byId.get(e.key), d = D0.get(f).find(x => x.id === e.key), pe = P.ents.find(x => x.key === d.variantOf);
      if (!pe || !same(evalLit(pe.val, sp.name), evalLit(e.val, sp.name))) addMove(f, sp.field, e.val, '', `${sp.name}.${e.key}`);
      rm.add(k); return;
    }
    const alone = s.slice(lineStart(s, e.ks), e.ks).trim() === '' && !/^\s*,?\s*[A-Za-z_'"]/.test(s.slice(e.ve, lineEnd(s, e.ve)).replace(/^\s*,/, ',').replace(/^,/, ''));
    const com = alone ? comOf(s.slice(e.ve, lineEnd(s, e.ve))) : '';
    for (const f of T) addMove(f, sp.field, e.val, com, `${sp.name}.${e.key}`);
    rm.add(k);
  });
  if (rm.size) s = removeEntries(s, P, rm, A.ind);
  s = dropOld(s, new RegExp(`\\b${sp.name}\\[d\\.`));   // (the generated line again right after the list, wherever it was)
  const A2 = declAt(s, sp.name);
  put(sp.file, ensureLine(s, stmtEnd(s, parseObj(s, A2.open).close + 1) - 1, fill(sp, A2.ind)));
}

/* ---- 2. render.js: THEMES and SPLIT (the literals and the statements after them) -> look ---- */
{
  const F = 'js/render.js'; let s = rd(F);
  const look = new Map(), split = new Map();   // theme -> { val, com }
  for (const name of ['THEMES', 'SPLIT']) {
    const A = declAt(s, name); if (!A) fail(`${F}: seznama ${name} ni`);
    const P = parseObj(s, A.open), rm = new Set(), M = name === 'THEMES' ? look : split;
    P.ents.forEach((e, k) => {
      if (!realTheme.has(e.key)) return;
      const alone = s.slice(lineStart(s, e.ks), e.ks).trim() === '' && !/[A-Za-z_'"]\s*:/.test(s.slice(e.ve, lineEnd(s, e.ve)).replace(/\/\/.*$/, ''));
      M.set(e.key, { val: e.val, com: alone ? comOf(s.slice(e.ve, lineEnd(s, e.ve))) : '' }); rm.add(k);
    });
    if (rm.size) s = removeEntries(s, P, rm, A.ind);
  }
  // the statements THEMES.x = { ... }; SPLIT.x = [...]; (a line each)
  s = s.split('\n').filter(l => {
    const m = /^\s*(THEMES|SPLIT)\.([a-z0-9]+) = /.exec(l); if (!m || !realTheme.has(m[2])) return true;
    const v0 = m[0].length, e = exprEnd(l, v0); if (l[e] !== ';') fail(`${F}: ${m[1]}.${m[2]} ni v eni vrstici`);
    (m[1] === 'THEMES' ? look : split).set(m[2], { val: l.slice(v0, e).trim(), com: comOf(l.slice(e + 1)) }); return false;
  }).join('\n');
  // a half only (a merge with main keeps a branch's THEMES, where it changed it, and takes main's SPLIT without the real tracks', or the
  // other way round): the other half from the track's file, as it is there
  for (const th of new Set([...look.keys(), ...split.keys()])) {
    const L = look.get(th), S = split.get(th);
    for (const f of byTheme.get(th) || fail(`tema ${th} ni zapisana v nobeni datoteki proge`)) {
      const FL = fileLook(f);
      if (!L && !FL) fail(`${F}: ${th} ima SPLIT brez THEMES (in v ${f} ni look)`);
      const base = L ? L.val : FL.base, sp = S ? S.val : FL && FL.split;
      const com = L && S ? [L.com, S.com].filter(Boolean).join(' ') : (FL && FL.com) || (L || S).com;
      addMove(f, 'look', sp ? base.replace(/\s*\}$/, `, split: ${sp} }`) : base, com, L ? `THEMES.${th}` : `SPLIT.${th}`);
    }
  }
  s = dropOld(s, /\bTHEMES\[d\.theme\] = d\.look/);   // (the generated line again after both lists, wherever it was)
  const ends = ['THEMES', 'SPLIT'].map(n => stmtEnd(s, parseObj(s, declAt(s, n).open).close + 1));
  put(F, ensureLine(s, Math.max(...ends) - 1, fillLook(declAt(s, 'SPLIT').ind)));
}

/* ---- 3. world.js: the last build's grids -> World.keep(key, theme) in the world files ---- */
{
  const F = 'js/world.js'; let s = rd(F);
  const RE = /^(\s*)if \(((?:THEME !== '[a-z0-9]+'(?: && )?)+)\) (NR|API\.([A-Za-z0-9_]+)) = null;.*$/;
  const keep = [], lines = s.split('\n'); let at = -1, ind = '    ';
  const rest = lines.filter((l, k) => { const m = RE.exec(l); if (!m) return true; if (at < 0) { at = k; ind = m[1]; } for (const th of m[2].match(/'([a-z0-9]+)'/g).map(q => q.slice(1, -1))) keep.push([m[4] || 'NR', th]); return false; });
  const GEN = `${ind}for (const k in KEEP) if (!KEEP[k].includes(THEME)) { if (k === 'NR') NR = null; else API[k] = null; }   // free the last build's grids this world does not keep (World.keep(key, theme) in the world files: ${MARK})`;
  if (at >= 0) { if (!rest.includes(GEN)) rest.splice(at, 0, GEN); s = rest.join('\n'); }
  if (!s.includes(GEN)) fail(`${F}: ni vrstice World.keep v build()`);
  if (!/\bconst KEEP = \{\}/.test(s) || !/\bkeep: \(k, th\) =>/.test(s)) fail(`${F}: ni KEEP in World.keep (ročni del razdelitve, docs/razdelitev-prog.md)`);
  put(F, s);
  const worldFiles = pageScripts().filter(f => /^js\/world-[a-z0-9]+\.js$/.test(f));
  for (const [key, th] of keep) {
    const re = new RegExp(`^([ \\t]*)World\\.ext\\.${th}\\s*=`, 'm'), f = worldFiles.find(w => re.test(rd(w)));
    if (!f) fail(`World.ext.${th} ni v nobeni datoteki sveta (za World.keep('${key}', '${th}'))`);
    const t = rd(f), line = `World.keep('${key}', '${th}');`;
    if (t.includes(line)) continue;
    const m = re.exec(t), L = lineStart(t, m.index);
    put(f, t.slice(0, L) + `${m[1]}${line}   // (its grids kept between its builds; World.build frees the others': ${MARK})\n` + t.slice(L));
  }
}

/* ---- 6. a world file of several tracks split by track (WSPLIT): each track's own parts of js/world-rbring.js go to js/world-<theme>.js,
   loaded before it (index.html). A part file puts on World.api (API) what the shared builder and World use of it and its look (an entry of
   the builder's look table) on API.rbLook, which the table takes; its World.ext.<theme> calls the shared builder's. The chunks are the
   file's top-level statements, each with the comment right before it; a part's are those whose (first) name its pattern matches. A chunk
   already in the part file is replaced only when it is the same (else --seznam: the shared file's, --proga: the part file's). What the
   shared file reads of a part, or a branch from before the split put in its export, the part exports (never a let or var: World.api would
   hold its value at the load only, an error); a part's copy of a small helper of the shared file (W.copy) follows the shared file's ---- */
const WSPLIT = [{ file: 'js/world-rbring.js', look: 'RB_LOOK', builder: 'rbring', copy: ['sAtS'], parts: [
  { theme: 'bathurst', re: /^(BT_\w+|bt[A-Z]\w*|au[A-Z]\w*|_rM)$/ },
  { theme: 'rio', re: /^(RIO_\w+|rio[A-Z]\w*)$/ },
  { theme: 'cpalace', re: /^(CP_\w+|CPK|cp[A-Z]\w*)$/ },
] }];
function codeOnly(t) {   // t without its comments and its strings' text (a template's ${...} kept)
  let o = '', i = 0;
  while (i < t.length) {
    const c = t[i];
    if (c === '/' && t[i + 1] === '/') { const e = t.indexOf('\n', i); i = e < 0 ? t.length : e; continue; }
    if (c === '/' && t[i + 1] === '*') { const e = t.indexOf('*/', i + 2); i = e < 0 ? t.length : e + 2; o += ' '; continue; }
    if (c === "'" || c === '"') { i = skipStr(t, i); o += "''"; continue; }
    if (c === '`') {
      i++;
      while (i < t.length && t[i] !== '`') {
        if (t[i] === '\\') { i += 2; continue; }
        if (t[i] === '$' && t[i + 1] === '{') { let d = 1, j = i + 2; while (j < t.length && d) { if (t[j] === '{') d++; else if (t[j] === '}') d--; j++; } o += ' ' + t.slice(i + 2, j - 1) + ' '; i = j; continue; }
        i++;
      }
      i++; o += "''"; continue;
    }
    o += c; i++;
  }
  return o;
}
function idents(t) {   // the names a text reads or writes: not property names (after '.', but a '...' spread's) nor object keys (a name with ':' after '{' or ',')
  const c = codeOnly(t), out = new Set(), re = /[A-Za-z_$][\w$]*/g; let m;
  while ((m = re.exec(c))) {
    const a = m.index; if (a > 0 && /[\w$]/.test(c[a - 1])) continue;   // (in a number: 0x1f, 1e5)
    let p = a - 1; while (p >= 0 && /\s/.test(c[p])) p--;
    if (c[p] === '.' && !(c[p - 1] === '.' && c[p - 2] === '.')) continue;
    let q = a + m[0].length; while (q < c.length && /\s/.test(c[q])) q++;
    if (c[q] === ':' && (c[p] === '{' || c[p] === ',')) continue;
    out.add(m[0]);
  }
  return out;
}
const nameOf = (l) => {
  let m = /^  Object\.assign\(([\w$.]+)/.exec(l); if (m) return 'Object.assign(' + m[1];
  if ((m = /^  World\.keep\('(\w+)', '(\w+)'\)/.exec(l))) return `World.keep:${m[2]}:${m[1]}`;
  m = /^  (?:async )?(?:function\*? |const |let |var )?([A-Za-z_$][\w$.]*)/.exec(l); return m ? m[1] : '?';
};
function closeOf(s, i) {   // s[i] an opening bracket: the index of its closing one
  let d = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'" || c === '`') { i = skipStr(s, i); continue; }
    if (isCom(s, i)) { i = skipCom(s, i); continue; }
    if ('([{'.includes(c)) d++; else if (')]}'.includes(c) && --d === 0) return i;
    i++;
  }
  return s.length;
}
function topAt(s, ok) {   // the first index at depth 0 where ok(s, i), or -1
  for (let i = 0, d = 0; i < s.length;) {
    const c = s[i];
    if (c === '"' || c === "'" || c === '`') { i = skipStr(s, i); continue; }
    if (isCom(s, i)) { i = skipCom(s, i); continue; }
    if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; else if (d === 0 && ok(s, i)) return i;
    i++;
  }
  return -1;
}
function patNames(p) {   // the names a destructuring pattern ([...] or {...}) binds
  const out = [], obj = p[0] === '{', s = p.slice(1, closeOf(p, 0));
  for (let i = 0; i < s.length;) {
    const e = exprEnd(s, i); let el = s.slice(i, e).trim(); i = e + 1;
    if (!el) continue;   // (a hole)
    el = el.replace(/^\.\.\./, '');
    const eq = topAt(el, (t, k) => t[k] === '=' && !'=>'.includes(t[k + 1] || '#') && !'=!<>'.includes(t[k - 1] || '#')); if (eq >= 0) el = el.slice(0, eq).trim();   // (a default)
    const co = obj ? topAt(el, (t, k) => t[k] === ':') : -1; if (co >= 0) el = el.slice(co + 1).trim();   // (key: name)
    if (/^[[{]/.test(el)) out.push(...patNames(el)); else if (/^[A-Za-z_$][\w$]*$/.test(el)) out.push(el);
  }
  return out;
}
function declNames(t) {   // the top-level names a chunk declares (a function's, a class's, those of a const / let / var, destructured too)
  const c = codeOnly(t).replace(/^\s+/, ''); let m = /^(?:async\s+)?function\*?\s+([\w$]+)/.exec(c) || /^class\s+([\w$]+)/.exec(c); if (m) return [m[1]];
  if (!(m = /^(?:const|let|var)\s+/.exec(c))) return [];
  const out = []; let i = m[0].length;
  for (;;) {
    i = skipWs(c, i);
    if (c[i] === '[' || c[i] === '{') { const e = closeOf(c, i); out.push(...patNames(c.slice(i, e + 1))); i = exprEnd(c, e + 1); }
    else { const n = /^[A-Za-z_$][\w$]*/.exec(c.slice(i, i + 100)); if (!n) break; out.push(n[0]); i = exprEnd(c, i); }
    if (c[i] !== ',') break; i++;
  }
  return out;
}
function chunksOf(t) {   // { pre, chunks: [{ name, names, text }], post }: the IIFE's top-level statements with the comments right before them
  const L = t.split('\n'); let end = L.length;
  for (let k = L.length - 1; k >= 0; k--) if (/^\}\)\(\);/.test(L[k])) { end = k; break; }
  let inCom = false; const st = [];
  for (let k = 0; k < end; k++) {
    const l = L[k];
    if (inCom) { if (l.includes('*/')) inCom = false; continue; }
    if (/^  \/\*/.test(l)) { st.push({ k, kind: 'block' }); if (!l.includes('*/')) inCom = true; continue; }
    if (/^  \/\//.test(l)) { st.push({ k, kind: 'line' }); continue; }
    if (/^  [^\s})\]]/.test(l)) st.push({ k, kind: 'st' });
  }
  const from = [];
  st.forEach((x, n) => { if (x.kind !== 'st') return; let a = n; const kd = n > 0 ? st[n - 1].kind : 'st'; if (kd !== 'st') while (a > 0 && st[a - 1].kind === kd) a--; from.push([st[a].k, x.k]); });
  const chunks = from.map(([a, k], n) => { const text = L.slice(a, n + 1 < from.length ? from[n + 1][0] : end).join('\n'); return { name: nameOf(L[k]), text, names: declNames(L.slice(k, n + 1 < from.length ? from[n + 1][0] : end).join('\n')) }; });
  return { pre: L.slice(0, from.length ? from[0][0] : end).join('\n'), chunks, post: L.slice(end).join('\n') };
}
const joinChunks = (C) => C.pre + '\n' + C.chunks.map(c => c.text).join('\n') + '\n' + C.post;
// the chunks every world file starts with, by their code (comments and spaces aside): 'use strict', the guard, API and the helpers taken
// from it, World's build state (»let LOD, T, THEME;« or a part file's »let T;«) and the API.sync line that copies it in at each build
const SYNCED = ['LOD', 'T', 'THEME'];
const PRO = [/^'';$/, /^if \(typeof World === '' \|\| !World\.api\) return;$/, /^const API = World\.api;$/, /^const \{[\w$, ]*\} = API;$/, /^API\.sync\.push\(\(\) => \{ \(\{ [\w$, ]+ \} = API\); \}\);$/];
const isPro = (c) => { const k = codeOnly(c.text).replace(/\s+/g, ' ').trim(); return PRO.some(re => re.test(k)) || (/^let [\w$, ]+;$/.test(k) && c.names.every(n => SYNCED.includes(n))); };
const isApiDecl = (c) => c.name === 'const' && /^const \{[\w$, ]*\} = API;$/.test(codeOnly(c.text).replace(/\s+/g, ' ').trim());
const exportNames = (t, where) => {   // the names of a chunk »Object.assign(API, { a, b });«
  const m = /Object\.assign\(API, \{([^}]*)\}\)/.exec(codeOnly(t)), ns = m ? m[1].split(',').map(x => x.trim()).filter(Boolean) : null;
  if (!ns || ns.some(n => !/^[A-Za-z_$][\w$]*$/.test(n))) fail(`${where}: izvoz ni v obliki »Object.assign(API, { a, b });« (samo imena)`);
  return ns;
};
const setExports = (t, ns) => t.replace(/(Object\.assign\(API, \{)[^}]*\}/, (m, a) => `${a} ${ns.join(', ')} }`);
const isVar = (c) => /^(?:let|var)\b/.test(codeOnly(c.text).trim());   // (World.api would hold its value at the load only)
const notes = [];
const keepLine = (c) => c.text.split('\n').find(l => /^  World\.keep\(/.test(l));
const wdiffs = [];
for (const W of WSPLIT) {
  let S = chunksOf(rd(W.file));
  if (!declAt(joinChunks(S), W.look)) fail(`${W.file}: ni ${W.look}`);
  const srcTop = new Map(); for (const c of S.chunks) for (const n of c.names) srcTop.set(n, c);
  const preNames = (C) => C.chunks.filter(c => isApiDecl(c) && !c.text.includes(MARK)).flatMap(c => c.names);   // (World's helpers it takes from API)
  const helpers = preNames(S);
  let moved = 0;
  for (const P of W.parts) {
    const PF = `js/world-${P.theme}.js`, mine = (c) => c.names.length ? P.re.test(c.names[0]) : false;
    const own = S.chunks.filter(c => !isPro(c) && (mine(c) || c.name === `World.ext.${P.theme}` || new RegExp(`^World\\.keep:${P.theme}:`).test(c.name)));
    const txt = joinChunks(S), A = declAt(txt, W.look), LP = parseObj(txt, A.open), le = LP.ents.find(e => e.key === P.theme);
    if (!own.length && !le) continue;   // (split already)
    moved++;
    // the part file: as it is (when there), its body chunks merged with the shared file's
    const old = fs.existsSync(path.join(REPO, PF)) || files.has(PF) ? chunksOf(rd(PF)) : null;
    const body = old ? old.chunks.filter(c => !isPro(c) && !/^(API\.rbLook|Object\.assign\(API|World\.keep:|World\.ext\.)/.test(c.name)) : [];
    const exps = new Set(), keeps = [];
    if (old) for (const c of old.chunks) { if (c.name === 'Object.assign(API') for (const n of idents(c.text)) if (n !== 'Object' && n !== 'API') exps.add(n); if (/^World\.keep:/.test(c.name)) keeps.push(keepLine(c)); }
    let prevAt = -1;
    for (const c of own) {
      if (/^World\.keep:/.test(c.name)) { const l = keepLine(c); if (!keeps.includes(l)) keeps.push(l); continue; }
      if (c.name.startsWith('World.ext.')) continue;
      const k = body.findIndex(b => b.names[0] === c.names[0]);
      if (k < 0) { body.splice(prevAt + 1, 0, c); prevAt++; continue; }
      prevAt = k;
      if (body[k].text === c.text) continue;
      if (!PREFER(P.theme)) wdiffs.push(`${PF} ${c.names[0]}: v ${W.file} drugačen kot v ${PF}`);
      if (PREFER(P.theme) === 'map') body[k] = c;
    }
    // its look: the entry of the shared table (or the part file's, when it has one already)
    let look = le ? txt.slice(lineStart(txt, le.ks), lineEnd(txt, le.ve)) : null;
    const oldLook = old && old.chunks.find(c => c.name === 'API.rbLook');
    if (oldLook) {
      const o = oldLook.text, oa = o.indexOf('{', o.indexOf('Object.assign(')), OP = parseObj(o, o.indexOf('{', oa + 1)), oe = OP.ents.find(e => e.key === P.theme);
      const ol = oe ? o.slice(lineStart(o, oe.ks), lineEnd(o, oe.ve)) : null;
      if (look && ol && ol !== look) { if (!PREFER(P.theme)) wdiffs.push(`${PF} ${W.look}.${P.theme}: v ${W.file} drugačen kot v ${PF}`); if (PREFER(P.theme) !== 'map') look = ol; }
      else if (!look) look = ol;
    }
    // what it uses: World's helpers (as the shared file takes them), the build's track and theme, a copy of the shared file's small helpers
    const used = new Set(); for (const t of [...body.map(c => c.text), look || '']) for (const n of idents(t)) used.add(n);
    const defined = new Set(body.flatMap(c => c.names));
    for (const n of W.copy) if (used.has(n) && !defined.has(n) && srcTop.has(n)) { body.unshift(srcTop.get(n)); defined.add(n); for (const m of idents(srcTop.get(n).text)) used.add(m); }
    const bad = [...used].filter(n => srcTop.has(n) && !defined.has(n) && !mine(srcTop.get(n)) && !isPro(srcTop.get(n)) && !W.parts.some(Q => Q !== P && Q.re.test(n)) && n !== W.look);
    if (bad.length) fail(`${PF}: uporablja ${bad.join(', ')} iz ${W.file} (ni v API): razdeli ročno`);
    const other = [...used].filter(n => W.parts.some(Q => Q !== P && Q.re.test(n)) && srcTop.has(n));
    if (other.length) fail(`${PF}: uporablja dele drugih prog (${other.join(', ')})`);
    const hp = [...new Set([...helpers, ...(old ? preNames(old) : [])])].filter(n => used.has(n) && !defined.has(n)), sy = SYNCED.filter(n => used.has(n) && !defined.has(n));
    // what the shared file, World and the other worlds use of it: the names the shared file still reads, those it put on API for them
    const ex0 = S.chunks.find(c => c.name === 'Object.assign(API');
    // the shared file without them
    S.chunks = S.chunks.filter(c => !own.includes(c));
    if (le) { const t2 = joinChunks(S), A2 = declAt(t2, W.look), P2 = parseObj(t2, A2.open), k = P2.ents.findIndex(e => e.key === P.theme); S = chunksOf(removeEntries(t2, P2, new Set([k]), A2.ind)); }
    const rest = S.chunks.filter(c => c.name !== 'Object.assign(API' && !(c.name === 'const' && c.text.includes(MARK))), restUsed = new Set(rest.flatMap(c => [...idents(c.text)]));
    for (const n of defined) if (restUsed.has(n) || (ex0 && idents(ex0.text).has(n))) exps.add(n);
    for (const n of [...exps]) if (!defined.has(n) || W.copy.includes(n)) exps.delete(n);   // (a copy of a small helper stays its own)
    const ve = [...exps].filter(n => isVar(body.find(c => c.names.includes(n))));
    if (ve.length) fail(`${PF}: ${ve.join(', ')} (let ali var) bi šel v World.api, ki bi imel le vrednost ob nalaganju (${W.file}, World ali drugi svetovi ga berejo): razdeli ročno`);
    const def = [...D0.values()].flat().find(d => !d.test && d.theme === P.theme) || {};
    const head = ['/* =========================================================================',
      `   WORLD — ${def.name || P.theme} (theme '${P.theme}'): its own parts on the shared builder of ${W.file} (World.ext.${W.builder}), split out of it by`,
      `   ${MARK} (docs/razdelitev-prog.md) and loaded before it (index.html). What the builder, World and the other worlds use of them`,
      `   goes on World.api (API), its look (${W.look}.${P.theme}) on API.rbLook; World.ext.${P.theme} builds it with World.ext.${W.builder}.`,
      '   ========================================================================= */',
      '(function () {', '  \'use strict\';', '  if (typeof World === \'undefined\' || !World.api) return;', '  const API = World.api;'];
    if (hp.length) head.push(`  const { ${hp.join(', ')} } = API;`);
    if (sy.length) head.push(`  let ${sy.join(', ')};   // (World's, for the build under way)`, `  API.sync.push(() => { ({ ${sy.join(', ')} } = API); });`);
    const tail = [];
    if (look) tail.push(`  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (${W.look} in ${W.file} takes it: ${MARK})`, look, '  });');
    if (exps.size) tail.push(`  Object.assign(API, { ${[...defined].filter(n => exps.has(n)).join(', ')} });   // (what ${W.file}, World and the other worlds use: ${MARK})`);
    tail.push(...keeps, `  World.ext.${P.theme} = (scene, tex, opts) => World.ext.${W.builder}(scene, tex, opts);   // (the shared builder: ${W.file})`);
    put(PF, head.join('\n') + '\n' + body.map(c => c.text).join('\n') + '\n' + tail.join('\n') + '\n})();\n');
    const ex = S.chunks.find(c => c.name === 'Object.assign(API');
    if (ex) ex.text = setExports(ex.text, exportNames(ex.text, W.file).filter(n => !defined.has(n)));
    // index.html: the part's script before the shared file's
    let h = rd('index.html'); const tag = `<script src="${PF}"></script>`;
    if (!h.includes(tag)) { const w = `<script src="${W.file}"></script>`; if (!h.includes(w)) fail(`index.html: ni ${w}`); h = h.replace(w, tag + '\n' + w); put('index.html', h); }
  }
  // the part files as they are now: their copies of the shared file's small helpers (W.copy) as the shared file has them
  const parts = W.parts.map(P => `js/world-${P.theme}.js`).filter(f => files.has(f) || fs.existsSync(path.join(REPO, f)));
  const PC = new Map(parts.map(f => [f, chunksOf(rd(f))])), touched = new Set();
  for (const [f, C] of PC) for (const c of C.chunks) {
    const n = c.names.find(x => W.copy.includes(x)), src = n && srcTop.get(n);
    if (src && !isPro(c) && c.text !== src.text) { c.text = src.text; touched.add(f); notes.push(`${f}: kopija ${n} kot v ${W.file}`); }
  }
  // the shared file: the parts' names it reads (from API: the part files are loaded before it) and those a branch from before the split
  // put in its export, exported by their parts (in the order they declare them; not a let or var: API would hold its value at the load)
  const owner = new Map(); for (const [f, C] of PC) for (const c of C.chunks) if (!isPro(c)) for (const n of c.names) if (!W.copy.includes(n)) owner.set(n, { f, c });
  const gen = S.chunks.filter(c => c.text.includes(MARK) && (c.name === 'const' || c.name === `Object.assign(${W.look}`));
  S.chunks = S.chunks.filter(c => !gen.includes(c));
  const ownS = (n) => S.chunks.some(c => c.names.includes(n)), want = new Map();
  const wantIt = (n) => { const { f } = owner.get(n); if (!want.has(f)) want.set(f, []); if (!want.get(f).includes(n)) want.get(f).push(n); };
  const ex = S.chunks.find(c => c.name === 'Object.assign(API'), exOut = ex ? exportNames(ex.text, W.file).filter(n => owner.has(n) && !ownS(n)) : [];
  if (exOut.length) { exOut.forEach(wantIt); ex.text = setExports(ex.text, exportNames(ex.text, W.file).filter(n => !exOut.includes(n))); }
  const reads = new Set(S.chunks.filter(c => c.name !== 'Object.assign(API').flatMap(c => [...idents(c.text)]));
  const need = [...owner.keys()].filter(n => reads.has(n) && !ownS(n)); need.forEach(wantIt);
  for (const [f, ns] of want) {
    const ve = ns.filter(n => isVar(owner.get(n).c));
    if (ve.length) fail(`${W.file} bere ${ve.join(', ')} iz ${f} (let ali var: World.api bi imel le vrednost ob nalaganju): razdeli ročno`);
    const C = PC.get(f), x = C.chunks.find(c => c.name === 'Object.assign(API'), have = x ? exportNames(x.text, f) : [];
    if (ns.every(n => have.includes(n))) continue;
    const order = C.chunks.filter(c => !isPro(c)).flatMap(c => c.names), list = order.filter(n => have.includes(n) || ns.includes(n)).concat(have.filter(n => !order.includes(n)));
    if (x) x.text = setExports(x.text, list);
    else {
      const at = C.chunks.findIndex(c => /^(World\.keep:|World\.ext\.)/.test(c.name));
      C.chunks.splice(at < 0 ? C.chunks.length : at, 0, { name: 'Object.assign(API', names: [], text: `  Object.assign(API, { ${list.join(', ')} });   // (what ${W.file}, World and the other worlds use: ${MARK})` });
    }
    touched.add(f);
  }
  for (const f of touched) put(f, joinChunks(PC.get(f)));
  if (moved || gen.length || need.length || exOut.length) {
    const sync = S.chunks.findIndex(c => c.name === 'API.sync.push'), lk = S.chunks.findIndex(c => c.names.includes(W.look));
    if (sync < 0 || lk < 0) fail(`${W.file}: ni API.sync.push ali ${W.look}`);
    const tellParts = parts.join(', ');
    S.chunks.splice(lk + 1, 0, { name: `Object.assign(${W.look}`, names: [], text: `  Object.assign(${W.look}, API.rbLook);   // (the looks of the worlds whose parts are in files of their own: ${tellParts}; ${MARK})` });
    if (need.length) S.chunks.splice(S.chunks.findIndex(isApiDecl) + 1, 0, { name: 'const', names: need, text: `  const { ${need.join(', ')} } = API;   // (the own parts of the worlds on this builder, in ${tellParts}, loaded before this file: ${MARK})` });
    put(W.file, joinChunks(S));
  }
}
if (wdiffs.length) { console.error('razdeli-proge: del v skupni datoteki sveta in v datoteki proge se razlikuje (izberi --seznam ali --proga, za eno progo --seznam=<id>):\n  ' + wdiffs.join('\n  ')); process.exit(2); }

/* ---- 4. the track files: a block at the top of the def (right after TRACK_DEFS.push() with what came from the lists ---- */
const FIELDS =[['look'], ['say', 'rainP'], ['cloudTh', 'roadWear', 'grassNat', 'lawn', 'bbClassic'], ['zivali']], ALL = FIELDS.flat();
const HEAD = `// ---- its own, once in the shared lists (${MARK}): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)`;
const diffs = [], chosen = new Set();   // (chosen: field:file whose value --seznam or --proga chose)
const hasBlock = (f) => { const t = rd(f), p = t.indexOf('TRACK_DEFS.push('), L0 = p < 0 ? -1 : lineEnd(t, p) + 1; return L0 > 0 && t.slice(L0, lineEnd(t, L0)).includes(MARK); };
for (const f of new Set([...moves.keys(), ...TF.filter(hasBlock)])) {   // (the files with something new, and those with a block already: the block written again as this tool writes it)
  const M = moves.get(f) || new Map();
  let t = rd(f); const p = t.indexOf('TRACK_DEFS.push('); if (p < 0) fail(`${f}: ni TRACK_DEFS.push(`);
  const L0 = lineEnd(t, p) + 1, ind = /^\s*/.exec(t.slice(L0))[0];
  // the block already there: the head line and the lines of fields after it
  let L1 = L0, old = new Map();
  if (t.slice(L0, lineEnd(t, L0)).includes(MARK)) {
    L1 = lineEnd(t, L0) + 1;
    while (new RegExp(`^\\s*(${ALL.join('|')}):`).test(t.slice(L1, lineEnd(t, L1)))) {
      const line = t.slice(L1, lineEnd(t, L1)), q = '{' + line.replace(/\/\/.*$/, '') + '}', P = parseObj(q, 0);
      for (const e of P.ents) old.set(e.key, { val: e.val, com: P.ents.length === 1 ? comOf(line) : '' });
      L1 = lineEnd(t, L1) + 1;
    }
  }
  const def = D0.get(f).find(d => !d.test) || {};
  for (const [field, mv] of M) {
    const have = old.get(field), elsewhere = !have && def[field] !== undefined && !(def.variantOf && D0.get(byId.get(def.variantOf)).some(x => same(x[field], def[field])));
    const cur = have ? evalLit(have.val, f) : elsewhere ? def[field] : undefined, nv = evalLit(mv.val, mv.from);
    if (cur === undefined || same(cur, nv)) { if (!have && !elsewhere) old.set(field, mv); continue; }
    chosen.add(field + ':' + f);
    if (!PREFER(idOf(f))) {   // (look: which half, THEMES's or SPLIT's)
      const half = field !== 'look' ? null : same(noSplit(cur), noSplit(nv)) ? 'split' : same(cur.split, nv.split) ? 'base' : null;
      const js = (x) => String(JSON.stringify(x));
      const [what, a, b] = half === 'split' ? ['look.split', js(nv.split), js(cur.split)] : half === 'base' ? ['look (brez split)', js(noSplit(nv)), js(noSplit(cur))] : [field, mv.val, js(cur)];
      diffs.push(`${f} ${what}: v seznamu ${a.slice(0, 70)} … v datoteki proge ${b.slice(0, 70)} …`);
    }
    if (PREFER(idOf(f)) === 'map') { if (elsewhere) fail(`${f}: ${field} je v opisu proge drugje (ne v bloku): popravi ročno`); old.set(field, mv); }
  }
  const body = FIELDS.map(g => g.filter(k => old.has(k))).filter(g => g.length).map(g => {
    const one = g.length === 1 && old.get(g[0]).com;
    return ind + g.map(k => `${k}: ${old.get(k).val}`).join(', ') + ',' + (one ? `   // ${old.get(g[0]).com}` : '');
  });
  t = t.slice(0, L0) + (body.length ? [ind + HEAD, ...body].join('\n') + '\n' : '') + t.slice(L1);
  put(f, t);
}
if (diffs.length) { console.error('razdeli-proge: vnos v seznamu in polje v datoteki proge se razlikujeta (izberi --seznam ali --proga, za eno progo --seznam=<id>):\n  ' + diffs.join('\n  ')); process.exit(2); }

/* ---- 5. check: every track's own value as the game sees it, before and after (the lists filled from the defs) ---- */
{
  const D1 = defsOf((f) => files.get(f) || rd(f)), all0 = [...D0.values()].flat(), all = [...D1.values()].flat();   // (before: the lists as they were, filled from the defs as they were)
  const lit = (src, name) => { const A = declAt(src, name); return evalLit(src.slice(A.open, parseObj(src, A.open).close + 1), name); };
  const before = (f, name) => lit(orig.get(f) || files.get(f), name), after = (f, name) => lit(files.get(f), name);
  const fillIt = (M, field, by, ds) => { for (const d of ds) if (d[field] != null && d[by] != null && M[d[by]] == null) M[d[by]] = d[field]; return M; };
  const stmts = (src, name) => { const o = {}; for (const l of src.split('\n')) { const m = new RegExp(`^\\s*${name}\\.([a-z0-9]+) = `).exec(l); if (m) { const e = exprEnd(l, m[0].length); o[m[1]] = evalLit(l.slice(m[0].length, e), name); } } return o; };
  for (const sp of SPECS) {
    const B = fillIt(before(sp.file, sp.name), sp.field, sp.by, all0), A = fillIt(after(sp.file, sp.name), sp.field, sp.by, all);
    for (const [f, ds] of D1) for (const d of ds) { const k = d[sp.by]; if (chosen.has(sp.field + ':' + f)) continue; if (!same(B[k], A[k])) fail(`preverjanje: ${sp.name}.${k} ni več enak (${JSON.stringify(B[k])} -> ${JSON.stringify(A[k])}, ${d.id})`); }
  }
  const R0 = orig.get('js/render.js') || files.get('js/render.js'), R1 = files.get('js/render.js');
  const TB = Object.assign(lit(R0, 'THEMES'), stmts(R0, 'THEMES')), SB = Object.assign(lit(R0, 'SPLIT'), stmts(R0, 'SPLIT'));
  const TA = Object.assign(lit(R1, 'THEMES'), stmts(R1, 'THEMES')), SA = Object.assign(lit(R1, 'SPLIT'), stmts(R1, 'SPLIT'));
  const fillLk = (T, S, ds) => { for (const d of ds) if (d.look && d.theme && !T[d.theme]) { T[d.theme] = d.look; if (d.look.split) S[d.theme] = d.look.split; } };
  fillLk(TA, SA, all);
  for (const th of realTheme) {
    if ((byTheme.get(th) || []).some(f => chosen.has('look:' + f))) continue;
    // before: a half in the lists over the other half in the track's file (as step 2 takes them: a merge may bring one half only)
    const fl = (all0.find(d => d.theme === th && d.look) || {}).look, tb = TB[th] ? noSplit(TB[th]) : noSplit(fl), sb = Object.prototype.hasOwnProperty.call(SB, th) ? SB[th] : fl && fl.split;
    if (!same(tb || null, noSplit(TA[th]) || null) && tb) fail(`preverjanje: THEMES.${th} ni več enak`);
    if (!same(sb || null, SA[th] || null) && (sb || tb)) fail(`preverjanje: SPLIT.${th} ni več enak`);
  }
}

/* ---- write (or only tell) ---- */
const changed = [...files].filter(([f, t]) => orig.has(f) && orig.get(f) !== t).map(([f]) => f);
for (const n of notes) console.log('razdeli-proge: ' + n);
if (CHECK) {
  if (changed.length) { console.log('razdeli-proge: nastavitve ali deli sveta pravih prog so v skupnih datotekah, poženi node tools/razdeli-proge.mjs (' + changed.join(', ') + ')'); process.exit(1); }
  console.log('razdeli-proge: v redu (skupni seznami imajo le testne proge, deli sveta so v datotekah prog)');
} else {
  for (const f of changed) fs.writeFileSync(path.join(REPO, f), files.get(f));
  console.log(changed.length ? 'razdeli-proge: ' + changed.length + ' datotek: ' + changed.join(', ') : 'razdeli-proge: ni sprememb');
}
