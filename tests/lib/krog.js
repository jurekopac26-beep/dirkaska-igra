// Which tests a change needs on GitHub (.github/workflows/tests.yml, docs/krog-testov.md; the user's decision of 9. 11. 2026): the files a
// pull request (or a push to main) changes against its base sort it into one of three:
//   dokumenti  only documents (a .md anywhere, any file under docs/; not KODA_MD, a .md a test reads as data): only the documents' tests
//              (tests/run.js --dokumenti)
//   proge      only tracks: every file is a real track's own (below), or one of the shared files (SKUPNE) changed only in those tracks'
//              entries: the short round (tests/run.js --kratek: the related tests, and the tests over every track only on these tracks)
//   vse        anything else, every test (the full suites): the game's code, the tests, the tools, the workflows; a test track's file
//              (frozen, CLAUDE.md »Testne proge«), a track deleted, a new track not after all the others, any file not known here
// A track's own files: js/tracks/<id>.js, js/data/<id>.js, js/world-<theme>.js (a theme of real tracks only; with it the tracks of that
// theme and those whose world builds with it, World.ext.<theme>), tests/<id>[-x].test.js, tests/browser/<id>[-x].test.mjs, tools/<id>/**,
// a picture or a video of assets/ or maketa-menija/ with the id in its name (assets/tracks/<id>-rain.webp, assets/maps/corner-<id>.webm),
// a new flag (assets/flags/<country>.svg added). A variant of a changed track (def.variantOf) goes with it.
//   const { razvrsti } = require('./lib/krog.js'); razvrsti({ base, head, kodaMd }) -> { vrsta, proge, datoteke, zakaj }
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');

function gitIn(cwd) {
  return (...a) => {
    const r = spawnSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(`git ${a.join(' ')}: ${(r.stderr || '').trim() || 'exit ' + r.status}`);
    return r.stdout;
  };
}

// the tracks at a commit: every js/tracks/*.js run as index.html runs them, one after another into the same TRACK_DEFS, in its order (a
// variant's file reads its track's: js/tracks/pikesg.js), the files it has not got after them
function progeV(git, ref) {
  const out = {}, ctx = vm.createContext({ TRACK_DEFS: [] }), fs = git('ls-tree', '--name-only', '-z', ref, 'js/tracks/').split('\0').filter(f => /^js\/tracks\/[\w-]+\.js$/.test(f));
  let red = [];
  try { red = (git('show', `${ref}:index.html`).match(/js\/tracks\/[\w-]+\.js/g) || []).filter(f => fs.includes(f)); } catch (e) { /* no index.html */ }
  ctx.window = ctx;
  for (const f of [...new Set([...red, ...fs.sort()])]) {
    const n = ctx.TRACK_DEFS.length;
    try { vm.runInContext(git('show', `${ref}:${f}`), ctx, { timeout: 10000 }); } catch (e) { throw new Error(`${f} (${ref}): ${e.message}`); }
    for (const d of ctx.TRACK_DEFS.slice(n)) if (d && d.id) out[d.id] = { id: d.id, theme: d.theme || null, variantOf: d.variantOf || null, test: !!d.test, file: f };
  }
  return out;
}

// a key or a list's item of a track: the id, or the id and a slash (the references: 'spa/race/cs', 'spa/cs/rain')
const odProge = (k, P) => typeof k === 'string' && P.has(k.split('/')[0]);
// a table without the entries of the tracks of P: the keys of a track, the strings that are a track's id, the rows ([id, ...]) of a
// track; the keys sorted (the tables are read by id, their order is not the game's). star (only where a new country or flag may come):
// what the old table has not got is left out too (a key, a string in a list)
function brez(v, P, star) {
  if (Array.isArray(v)) {
    let a = v.filter(x => !odProge(x, P) && !(Array.isArray(x) && odProge(x[0], P)));
    if (star !== undefined) a = a.filter(x => typeof x !== 'string' || (Array.isArray(star) && star.includes(x)));
    return a.map(x => brez(x, P));
  }
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) {
      if (odProge(k, P)) continue;
      if (star !== undefined && !(star && typeof star === 'object' && !Array.isArray(star) && Object.prototype.hasOwnProperty.call(star, k))) continue;
      o[k] = brez(v[k], P, star !== undefined ? star[k] : undefined);
    }
    return o;
  }
  return v;
}
const J = (v) => JSON.stringify(v);
// what differs between two tables (their top keys, a few)
function razlika(a, b) {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) || Array.isArray(b)) return '';
  const ks = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => J(a[k]) !== J(b[k]));
  return ks.length ? ` (${ks.slice(0, 6).join(', ')}${ks.length > 6 ? ` … ${ks.length}` : ''})` : '';
}

// The shared files a track adds itself to: (old text, new text, { P: the tracks, Pt: the tracks and their themes, zastave }) -> null (only
// the tracks' entries changed) or why not
// a JSON file (the references, the menu's corners, the menu mockup's tracks): without the tracks' keys and rows
function json(stara, nova, { P }) {
  let a, b;
  try { a = brez(JSON.parse(stara), P); b = brez(JSON.parse(nova), P); } catch (e) { return 'not JSON: ' + e.message; }
  return J(a) === J(b) ? null : 'other entries than the tracks\'' + razlika(a, b);
}
// a script's tables, each on its own line (window.ROUTES = {...}; const PLACES = {...};), read as JSON or as a literal, without the tracks'
// entries; nove: the tables a new country or flag may be added to (MENU.globe's outlines, SUBUNITS, FLAG_FILES); every other line the same
const TABELA = /^(\s*(?:(?:const|let|var)\s+)?([\w$.]+)\s*=\s*)([[{].*[\]}])\s*;\s*(\/\/.*)?$/;
function tabela(rhs) {
  try { return JSON.parse(rhs); } catch (e) { /* a literal */ }
  try { return vm.runInNewContext('(' + rhs + ')', Object.create(null), { timeout: 5000 }); } catch (e) { return undefined; }
}
function tabele(nove = []) {
  return (stara, nova, { P }) => {
    const prej = {};
    const beri = (txt, star) => txt.split('\n').map(l => {
      const m = TABELA.exec(l), v = m ? tabela(m[3]) : undefined;
      if (v === undefined) return l;
      if (!star) prej[m[2]] = v;
      return `${m[2]} = ${J(brez(v, P, nove.includes(m[2]) ? (star ? (star[m[2]] !== undefined ? star[m[2]] : null) : v) : undefined))}`;
    });
    const a = beri(stara), b = beri(nova, prej);
    if (a.length !== b.length) return 'lines added or removed';
    const i = a.findIndex((l, k) => l !== b[k]);
    return i < 0 ? null : `line ${i + 1} not only the tracks' entries` + (TABELA.test(nova.split('\n')[i] || '') ? ` (${(TABELA.exec(nova.split('\n')[i]) || [])[2]})` : '');
  };
}
// index.html, garaza.html: only the tracks' own script lines (js/tracks/<id>.js, js/data/<id>.js, js/world-<theme>.js); a new track's line
// after every other track's (Core.TRACKS keeps the scripts' order: the cars of the other tracks' races, races.test.js /car, go by it)
function strani(stara, nova, { Pt }) {
  const SKR = /^\s*<script src="js\/(?:tracks\/|data\/|world-)([\w-]+)\.js"><\/script>\s*$/, svoja = (l) => { const m = SKR.exec(l); return !!(m && Pt.has(m[1])); };
  const a = stara.split('\n').filter(l => !svoja(l)), b = nova.split('\n').filter(l => !svoja(l));
  if (a.join('\n') !== b.join('\n')) return 'other lines than the tracks\' scripts';
  const red = (t) => t.split('\n').map(l => (/^\s*<script src="js\/tracks\/([\w-]+)\.js"><\/script>/.exec(l) || [])[1]).filter(Boolean);
  const po = red(stara), pn = red(nova);
  return pn.slice(0, po.length).join() === po.join() ? null : 'a track\'s script not after all the others\' (the order of Core.TRACKS)';
}
// js/lang.js: only lines of new translations added (a new key each: an old one would change another track's or the game's words)
const VNOS = /'(?:[^'\\]|\\.)*'\s*:\s*'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"\s*:\s*"(?:[^"\\]|\\.)*"/g;
function prevodi(stara, nova) {
  const a = stara.split('\n'), b = nova.split('\n'), n = new Map();
  for (const l of a) n.set(l, (n.get(l) || 0) + 1);
  const dodane = [];
  for (const l of b) { if (n.get(l)) n.set(l, n.get(l) - 1); else dodane.push(l); }
  if ([...n.values()].some(v => v > 0)) return 'lines changed or removed';
  const kljuc = (e) => e.slice(0, e.search(/['"]\s*:/) + 1), stari = new Set((stara.match(VNOS) || []).map(kljuc)), novi = new Set();
  for (const l of dodane) {
    if (!l.trim()) continue;
    if (l.replace(VNOS, '').replace(/\/\/.*$/, '').replace(/[\s,]/g, '')) return 'a line added that is not only translations';
    for (const k of (l.match(VNOS) || []).map(kljuc)) { if (stari.has(k) || novi.has(k)) return `a translation that is there already: ${k}`; novi.add(k); }
  }
  return null;
}
// tests/run.js: only the tracks' tests in the suites' lists and their times (SECS)
function seznamTestov(stara, nova, { P }) {
  const cist = (t) => t.replace(/'((?:browser\/)?([a-z0-9]+)(?:-[\w-]+)?\.test\.m?js)'(\s*:\s*\d+)?/g, (m, f, id) => (P.has(id) ? '' : m))
    .replace(/\s+/g, ' ').replace(/ ?([,[\]{}:]) ?/g, '$1').replace(/,,+/g, ',').replace(/([[{]),/g, '$1').replace(/,([\]}])/g, '$1');
  return cist(stara) === cist(nova) ? null : 'other changes than the tracks\' tests in the lists';
}
// tests/lib/sim.js: only the tracks' crash times (CRASH_AT) and the comments
function crashAt(stara, nova, { P }) {
  const cist = (t) => t.split('\n').filter(l => !/^\s*\/\//.test(l))
    .map(l => (/^const CRASH_AT = /.test(l) ? l.replace(/(['"]?)([a-z0-9]+)(\/[\w-]+)?\1\s*:\s*-?[\d.]+/g, (m, q, id) => (P.has(id) ? '' : m)) : l))
    .join('\n').replace(/\s+/g, ' ').replace(/ ?([,[\]{}:]) ?/g, '$1').replace(/,,+/g, ',').replace(/([[{]),/g, '$1').replace(/,([\]}])/g, '$1');
  return cist(stara) === cist(nova) ? null : 'other changes than the tracks\' crash times (CRASH_AT) and comments';
}
const SKUPNE = {
  'index.html': strani, 'garaza.html': strani, 'js/lang.js': prevodi,
  'js/routes.js': tabele(), 'js/menu-data.js': tabele(['window.MENU.globe']), 'js/menu.js': tabele(['FLAG_FILES']), 'tools/menu-globe.mjs': tabele(['SUBUNITS']),
  'tests/golden/sim.json': json, 'tests/golden/races.json': json, 'tests/golden/world.json': json, 'tests/golden/perf.json': json,
  'tools/menu-corners.json': json, 'maketa-menija/orodja/proge_igra.json': json,
  'tests/run.js': seznamTestov, 'tests/lib/sim.js': crashAt,
};

// the change from base to head (commits; git diff, renames as a file gone and a new one)
function razvrsti({ base, head = 'HEAD', cwd = ROOT, kodaMd = [] } = {}) {
  const git = gitIn(cwd);
  const z = git('diff', '--no-renames', '--name-status', '-z', base, head).split('\0'), spr = [];
  for (let i = 0; i + 1 < z.length; i += 2) if (z[i]) spr.push({ st: z[i][0], f: z[i + 1] });
  const datoteke = spr.map(e => e.f), dok = (f) => (/\.md$/.test(f) || /^docs\//.test(f)) && !kodaMd.includes(f);
  const koda = spr.filter(e => !dok(e.f));
  if (!koda.length) return { vrsta: 'dokumenti', proge: [], datoteke, zakaj: [spr.length ? `only documents (${spr.length})` : 'no file changed'] };

  const H = progeV(git, head), B = progeV(git, base), V = Object.assign({}, B, H);
  const beri = (ref, f) => { try { return git('show', `${ref}:${f}`); } catch (e) { return null; } };
  const poTemi = (t) => Object.values(V).filter(d => d.theme === t).map(d => d.id);
  // the themes whose world builds with another's (World.ext.<theme> in js/world-<U>.js)
  const svetovi = git('ls-tree', '--name-only', '-z', head, 'js/').split('\0').map(f => (/^js\/world-([\w-]+)\.js$/.exec(f) || [])[1]).filter(Boolean);
  const uporabniki = (t) => svetovi.filter(u => u !== t && new RegExp(`World\\.ext\\.${t}\\b`).test(beri(head, `js/world-${u}.js`) || '')).flatMap(poTemi);
  const deli = (f) => f.split('/').slice(1).join('/').split(/[/\-_.]/).filter(Boolean);
  // whose a file is: { ids } (the tracks whose own it is), { ids, z } (the tracks of a world that builds with it as well), { zastava }, or null
  function lastnik(f, st) {
    let m;
    if ((m = /^js\/tracks\/([\w-]+)\.js$/.exec(f))) { const ids = Object.values(V).filter(d => d.file === f).map(d => d.id); return { ids: ids.length ? ids : [m[1]], proga: true }; }
    if ((m = /^js\/world-([\w-]+)\.js$/.exec(f))) { const ids = poTemi(m[1]); return ids.length ? { ids, z: uporabniki(m[1]) } : null; }
    if ((m = /^js\/data\/([\w-]+)\.js$/.exec(f))) { const ids = V[m[1]] ? [m[1]] : poTemi(m[1]); return ids.length ? { ids } : null; }
    if ((m = /^tests\/(?:browser\/)?([a-z0-9]+)(?:-[\w-]+)?\.test\.m?js$/.exec(f)) && V[m[1]]) return { ids: [m[1]] };
    if ((m = /^tools\/([\w-]+)\//.exec(f)) && V[m[1]]) return { ids: [m[1]] };
    if (/^assets\/flags\/[\w-]+\.svg$/.test(f) && st === 'A') return { zastava: path.basename(f, '.svg') };
    if (/^(assets|maketa-menija)\//.test(f) && !SKUPNE[f]) { const ids = [...new Set(deli(f).filter(p => V[p]))]; if (ids.length) return { ids }; }
    return null;
  }

  const P = new Set(), vse = [], skupne = [], zastave = [];
  for (const e of koda) {
    const o = lastnik(e.f, e.st);
    if (!o) { if (SKUPNE[e.f]) skupne.push(e); else vse.push(`${e.f}: shared code (not a track's own file)`); continue; }
    if (o.zastava) { zastave.push(o.zastava); continue; }
    const test = o.ids.filter(id => V[id].test || (B[id] && B[id].test));
    if (test.length) { vse.push(`${e.f}: a test track's (${test.join(', ')}; frozen, CLAUDE.md »Testne proge«)`); continue; }
    const gone = o.ids.filter(id => !H[id]);
    if (gone.length || (o.proga && e.st === 'D')) { vse.push(`${e.f}: the track ${(gone.length ? gone : o.ids).join(', ')} deleted`); continue; }
    for (const id of o.ids) P.add(id);
    for (const id of o.z || []) if (H[id] && !H[id].test) P.add(id);   // (a test track's world built with it: frozen, never tested, CLAUDE.md »Testne proge«)
  }
  for (const id of [...P]) for (const d of Object.values(H)) if (d.variantOf === id && !d.test) P.add(d.id);
  const Pt = new Set([...P, ...[...P].map(id => H[id].theme).filter(Boolean)]);
  for (const e of skupne) {
    if (e.st !== 'M') { vse.push(`${e.f}: a shared file ${e.st === 'A' ? 'added' : 'deleted'}`); continue; }
    const why = SKUPNE[e.f](beri(base, e.f) || '', beri(head, e.f) || '', { P, Pt, zastave });
    if (why) vse.push(`${e.f}: ${why}`);
  }
  if (!vse.length && !P.size) vse.push('no track of its own changed (only shared files or flags)');
  const proge = [...P].sort();
  if (vse.length) return { vrsta: 'vse', proge, datoteke, zakaj: vse };
  return { vrsta: 'proge', proge, datoteke, zakaj: [`only the tracks ${proge.join(', ')}: ${koda.length} file${koda.length === 1 ? '' : 's'} of code, ${spr.length - koda.length} document${spr.length - koda.length === 1 ? '' : 's'}`] };
}

module.exports = { razvrsti, SKUPNE, progeV, gitIn };
