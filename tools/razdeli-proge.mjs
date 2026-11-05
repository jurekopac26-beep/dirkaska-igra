// Razdelitev skupnih seznamov prog po progah (docs/razdelitev-prog.md): kar ima prava proga v skupnih seznamih, gre v njeno datoteko
// js/tracks/<id>.js, da se veje, ki dodajajo ali urejajo različne proge, ne srečajo v isti vrstici. Testne proge (test: true) ostanejo, kjer so.
//   node tools/razdeli-proge.mjs             premakne vnose pravih prog in poskrbi za vrstice, ki sezname ob nalaganju napolnijo iz datotek prog
//   node tools/razdeli-proge.mjs --check     samo preveri (tests/razdelitev.test.js): izhod 1, če bi orodje kaj spremenilo
//   ... --seznam | --proga                   ob razliki med vnosom v seznamu in poljem v datoteki proge obdrži seznam (npr. svež main ob
//                                            spajanju v vejo razdelitve) oz. datoteko proge (veja s starim seznamom ob spajanju svežega main)
// Seznami (SPECS): js/render.js THEMES + SPLIT -> look (look.split), js/game.js EN_NAME -> say, RAIN_P -> rainP, js/world.js CLOUD_TH -> cloudTh,
// ROAD_WEAR -> roadWear, GRASS_NAT -> grassNat, LAWN -> lawn, BB_CLASSIC -> bbClassic, js/world-zivali.js ZIV -> zivali. Vnosi gredo na začetek
// opisa proge (takoj za vrstico TRACK_DEFS.push(), v blok pod vrstico z oznako tega orodja); za vsakim seznamom je ustvarjena vrstica, ki ga
// napolni iz TRACK_DEFS. V js/world.js še sproščanje mrež zadnje gradnje: vrstice »if (THEME !== ...) API.X = null;« postanejo
// World.keep('X', tema) v datoteki sveta proge (pred World.ext.<tema> = ...) in ena skupna vrstica v build().
// Ponovni zagon ne spremeni ničesar. Spor ob spajanju v vrstici skupnega seznama: obdrži stran s starim seznamom (vsi vnosi), nato to orodje.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), CHECK = args.includes('--check'), PREFER = args.includes('--seznam') ? 'map' : args.includes('--proga') ? 'def' : null;
const files = new Map();   // path -> text (read once, written at the end)
const rd = (f) => { if (!files.has(f)) files.set(f, fs.readFileSync(path.join(REPO, f), 'utf8')); return files.get(f); };
const orig = new Map();
const put = (f, s) => { if (!orig.has(f)) orig.set(f, rd(f)); files.set(f, s); };
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
  for (const th of new Set([...look.keys(), ...split.keys()])) {
    const L = look.get(th), S = split.get(th);
    if (!L) fail(`${F}: ${th} ima SPLIT brez THEMES`);
    const val = S ? L.val.replace(/\s*\}$/, `, split: ${S.val} }`) : L.val, com = [L.com, S && S.com].filter(Boolean).join(' ');
    for (const f of byTheme.get(th) || fail(`tema ${th} ni zapisana v nobeni datoteki proge`)) addMove(f, 'look', val, com, `THEMES.${th}`);
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

/* ---- 4. the track files: a block at the top of the def (right after TRACK_DEFS.push() with what came from the lists ---- */
const FIELDS = [['look'], ['say', 'rainP'], ['cloudTh', 'roadWear', 'grassNat', 'lawn', 'bbClassic'], ['zivali']], ALL = FIELDS.flat();
const HEAD = `// ---- its own, once in the shared lists (${MARK}): look (render.js), say, rainP (game.js), cloudTh, roadWear, grassNat, lawn, bbClassic (world.js), zivali (world-zivali.js)`;
const diffs = [];
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
    diffs.push(`${f} ${field}: v seznamu ${mv.val.slice(0, 70)} … v datoteki proge ${JSON.stringify(cur).slice(0, 70)} …`);
    if (PREFER === 'map') { if (elsewhere) fail(`${f}: ${field} je v opisu proge drugje (ne v bloku): popravi ročno`); old.set(field, mv); }
  }
  const body = FIELDS.map(g => g.filter(k => old.has(k))).filter(g => g.length).map(g => {
    const one = g.length === 1 && old.get(g[0]).com;
    return ind + g.map(k => `${k}: ${old.get(k).val}`).join(', ') + ',' + (one ? `   // ${old.get(g[0]).com}` : '');
  });
  t = t.slice(0, L0) + (body.length ? [ind + HEAD, ...body].join('\n') + '\n' : '') + t.slice(L1);
  put(f, t);
}
if (diffs.length && !PREFER) { console.error('razdeli-proge: vnos v seznamu in polje v datoteki proge se razlikujeta (izberi --seznam ali --proga):\n  ' + diffs.join('\n  ')); process.exit(2); }

/* ---- 5. check: every track's own value as the game sees it, before and after (the lists filled from the defs) ---- */
{
  const D1 = defsOf((f) => files.get(f) || rd(f)), all0 = [...D0.values()].flat(), all = [...D1.values()].flat();   // (before: the lists as they were, filled from the defs as they were)
  const lit = (src, name) => { const A = declAt(src, name); return evalLit(src.slice(A.open, parseObj(src, A.open).close + 1), name); };
  const before = (f, name) => lit(orig.get(f) || files.get(f), name), after = (f, name) => lit(files.get(f), name);
  const fillIt = (M, field, by, ds) => { for (const d of ds) if (d[field] != null && d[by] != null && M[d[by]] == null) M[d[by]] = d[field]; return M; };
  const stmts = (src, name) => { const o = {}; for (const l of src.split('\n')) { const m = new RegExp(`^\\s*${name}\\.([a-z0-9]+) = `).exec(l); if (m) { const e = exprEnd(l, m[0].length); o[m[1]] = evalLit(l.slice(m[0].length, e), name); } } return o; };
  for (const sp of SPECS) {
    const B = fillIt(before(sp.file, sp.name), sp.field, sp.by, all0), A = fillIt(after(sp.file, sp.name), sp.field, sp.by, all);
    for (const d of all) { const k = d[sp.by]; if (!same(B[k], A[k])) fail(`preverjanje: ${sp.name}.${k} ni več enak (${JSON.stringify(B[k])} -> ${JSON.stringify(A[k])}, ${d.id})`); }
  }
  const R0 = orig.get('js/render.js') || files.get('js/render.js'), R1 = files.get('js/render.js');
  const TB = Object.assign(lit(R0, 'THEMES'), stmts(R0, 'THEMES')), SB = Object.assign(lit(R0, 'SPLIT'), stmts(R0, 'SPLIT'));
  const TA = Object.assign(lit(R1, 'THEMES'), stmts(R1, 'THEMES')), SA = Object.assign(lit(R1, 'SPLIT'), stmts(R1, 'SPLIT'));
  const fillLk = (T, S, ds) => { for (const d of ds) if (d.look && d.theme && !T[d.theme]) { T[d.theme] = d.look; if (d.look.split) S[d.theme] = d.look.split; } };
  fillLk(TB, SB, all0); fillLk(TA, SA, all);
  for (const th of realTheme) {
    const strip = (o) => { if (!o) return o; const c = Object.assign({}, o); delete c.split; return c; };
    if (!same(strip(TB[th]) || null, strip(TA[th]) || null) && TB[th]) fail(`preverjanje: THEMES.${th} ni več enak`);
    if (!same(SB[th] || null, SA[th] || null) && (SB[th] || TB[th])) fail(`preverjanje: SPLIT.${th} ni več enak`);
  }
}

/* ---- write (or only tell) ---- */
const changed = [...files].filter(([f, t]) => orig.has(f) && orig.get(f) !== t).map(([f]) => f);
if (CHECK) {
  if (changed.length) { console.log('razdeli-proge: vnosi pravih prog so v skupnih seznamih, poženi node tools/razdeli-proge.mjs (' + changed.join(', ') + ')'); process.exit(1); }
  console.log('razdeli-proge: v redu (skupni seznami imajo le testne proge)');
} else {
  for (const f of changed) fs.writeFileSync(path.join(REPO, f), files.get(f));
  console.log(changed.length ? 'razdeli-proge: ' + changed.length + ' datotek: ' + changed.join(', ') : 'razdeli-proge: ni sprememb');
}
