// I17 korak 4 (docs/hitro-nalaganje.md): js/tracks/glave.js, the heads of the real tracks whose full files are lazy (index.html:
// <link rel="x-lazy-script" data-lazy="proga-<id>">, Core.loadTrack). A head is the track's small fields as its file gives them (each
// field but functions and those over HEAD_MAX bytes of JSON: the road, the heights, the scenery), with `head: true` and `hd`, what the
// game reads of a built track without building it (the menus, a championship's km, the race weekend's estimate): hd.len (Track.len,
// m), hd.race (Track.raceLen), hd.qb (Track.qualiBack(), m), hd.nc (its corners, Track.corners.length); TRACK_ORDER is the
// order of every track in the menu (index.html's track scripts and lazy links, as they stand), which Core.TRACKS keeps.
// Frozen tracks (CLAUDE.md »Testne proge«: the test ones, those being decided and the ones frozen before their mark) keep their
// <script> and get no head. Run after a lazy track's file changed or a track was added; tests/glave-prog.test.js checks the file.
//   node tools/glave-prog.js            (writes js/tracks/glave.js)
//   node tools/glave-prog.js --check    (exit 1 if js/tracks/glave.js is not what this would write)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.env.GAME_ROOT ? path.resolve(process.env.GAME_ROOT) : path.resolve(__dirname, '..');
const HEAD_MAX = 3000;
// frozen before their mark (CLAUDE.md »Testne proge«); the test tracks' list and `test` / `pending` add to these
const FROZEN = ['suzuka', 'iroha', 'medvode'];
const OUT = 'js/tracks/glave.js';

// the track files of index.html in order (scripts and lazy links alike), without glave.js itself
function trackFiles(html) {
  return [...html.matchAll(/<(?:script\b[^>]*\bsrc|link\b[^>]*\brel="x-lazy-script"[^>]*\bhref)="(js\/tracks\/[^"?#]+)[^"]*"/g)].map(m => m[1]).filter(s => s !== OUT);
}
function defsOf(root) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), files = trackFiles(html), ctx = vm.createContext({});
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  return { files, defs: vm.runInContext('TRACK_DEFS', ctx).filter(d => !d.head) };
}
function frozen(root) {
  const t = JSON.parse(fs.readFileSync(path.join(root, 'tests/golden/testne-proge.json'), 'utf8')).proge;
  return new Set(FROZEN.concat(t));
}
const lazyOf = (d, fz) => !d.test && !d.pending && !fz.has(d.id);
function headOf(d) {
  const h = {};
  for (const k of Object.keys(d)) {
    const v = d[k];
    if (typeof v === 'function' || v === undefined) continue;
    const j = JSON.stringify(v);
    if (j === undefined || j.length > HEAD_MAX) continue;
    h[k] = v;
  }
  h.head = true;
  return h;
}
// what a built track gives (the game's Track, Core from tests/lib/core.js with every track file)
function hdOf(C, id) {
  const T = new C.Track(C.TRACKS.find(d => d.id === id)), r = (x) => Math.round(x * 1000) / 1000;
  return { len: r(T.len), race: r(T.raceLen), qb: r(T.qualiBack()), nc: T.corners.length };
}
function build(root) {
  const { defs } = defsOf(root), fz = frozen(root), seen = new Set(), order = [];
  const C = require('../tests/lib/core.js').loadCore(root);
  for (const d of defs) if (!seen.has(d.id)) { seen.add(d.id); order.push(d.id); }
  const heads = defs.filter((d, i) => lazyOf(d, fz) && defs.findIndex(x => x.id === d.id) === i).map(headOf);
  for (const h of heads) h.hd = hdOf(C, h.id);
  return '// Made by tools/glave-prog.js (node tools/glave-prog.js): do not edit. The heads of the lazy real tracks (I17 korak 4,\n' +
    '// docs/hitro-nalaganje.md): their small fields; the full file comes with Core.loadTrack(id). TRACK_ORDER: the order of the menu.\n' +
    'var TRACK_DEFS = TRACK_DEFS || [];\n' +
    'var TRACK_ORDER = ' + JSON.stringify(order) + ';\n' +
    heads.map(h => 'TRACK_DEFS.push(' + JSON.stringify(h) + ');\n').join('');
}
module.exports = { build, headOf, defsOf, frozen, lazyOf, trackFiles, HEAD_MAX, OUT, FROZEN };

if (require.main === module) {
  const out = build(ROOT), p = path.join(ROOT, OUT);
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    if (cur !== out) { console.log(OUT + ' is out of date: node tools/glave-prog.js'); process.exit(1); }
    console.log(OUT + ' OK');
  } else { fs.writeFileSync(p, out); console.log(OUT + ': ' + (out.length / 1024).toFixed(1) + ' kB'); }
}
