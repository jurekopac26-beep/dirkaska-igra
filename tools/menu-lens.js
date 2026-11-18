// The menu's tables of the tracks, made from the game's own tracks (building every track in the menu would take seconds on a phone):
//   MENU.lens   the lengths (metres: an open road's race from its start to its finish, a circuit's lap): the order of the track list
//   MENU.profs  the heights along the run of every track without a route map in js/routes.js (its R.prof): the height graph of the
//               track step. { len, base, prof }: 121 heights (m, to 0.1) from the start line over len, above the start line; base: the
//               start line's real height (m above the sea), where it is known (BASE: as the track's file gives it; else def.alt[0])
//   MENU.shapes the shape of every real track from above for its card in the quick list (js/menu-izbor.js): the race's part of the road
//               (a circuit: its lap from the start line round to it again), the game's x east and z south (north up), simplified
//               (Douglas-Peucker, 0.4 % of its size), as x, y pairs in a box whose longer side is 200 (the mockup's shapeOf,
//               maketa-menija/izbira-proge/orodja/vse-proge.js)
//   MENU.ncorners the corners of every real track (the game's Track: the row's Corners, the quick list's facts, without building it)
//   Test tracks have no shape and no corners here (CLAUDE.md »Testne proge«: frozen, their entries in shared files too)
// Run after a track is added or its road changed; tests/menu-lens.test.js checks the tables against the game's tracks.
//   node tools/menu-lens.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('../tests/lib/core.js');
// the start line's height above the sea of the real tracks without a route map (their files: js/tracks/<id>.js, the heights' comment)
const BASE = { bathurst: 708, cpalace: 66.4, rio: 5.3, livorno: 3.8, silkeborg: 61.7, kagerod: 79.6, sosnova: 255.6, pembrey: 5.6, kildare: 90, bikernieki: 6.2, london: 6.0, zandvoort: 4.7, tuzla: 129.2, sepang: 39.1, lombok: 4.4, buriram: 176.3, sakhir: 7.8, lusail: 12.3, riohondo: 277.4, hakone: 97.3, zurich: 405.9 };
const C = loadCore(), lens = {}, profs = {};
global.window = global; require(path.join(ROOT, 'js', 'routes.js'));
const RT = global.ROUTES || {};
// the heights of a built track along its run: 121 samples from the start line (a circuit: round its lap), above the start line
function profOf(d, T) {
  const L = d.open ? T.raceLen : T.len, N = T.N, out = [];
  for (let k = 0; k <= 120; k++) {
    let s = T.startS + L * k / 120; if (!d.open) s = ((s % T.len) + T.len) % T.len;
    const f = Math.min(N - 1, s / T.ds), i = Math.min(N - 2, Math.floor(f)), h = T.hy[i] + (T.hy[i + 1] - T.hy[i]) * (f - i) - T.hy[T.startIdx];
    out.push(Math.round(h * 10) / 10 || 0);
  }
  return out;
}
// a track's shape from above for its card (x, y pairs, the longer side 200; see MENU.shapes above)
function shapeOf(T) {
  const N = T.N, a = T.startIdx, b = T.open ? T.finishIdx : T.startIdx + N, P = [];
  for (let i = a; i <= b; i++) { const k = i % N; P.push([T.px[k], T.pz[k]]); }
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const k = 200 / Math.max(x1 - x0, y1 - y0), Q = P.map(([x, y]) => [(x - x0) * k, (y - y0) * k]), keep = new Uint8Array(Q.length), st = [[0, Q.length - 1]];
  keep[0] = keep[Q.length - 1] = 1;
  while (st.length) {
    const [i, j] = st.pop(), [ax, ay] = Q[i], [bx, by] = Q[j], L = Math.hypot(bx - ax, by - ay); let m = -1, md = 0.8;
    for (let n = i + 1; n < j; n++) { const d = L > 1e-6 ? Math.abs((bx - ax) * (ay - Q[n][1]) - (ax - Q[n][0]) * (by - ay)) / L : Math.hypot(Q[n][0] - ax, Q[n][1] - ay); if (d > md) { md = d; m = n; } }
    if (m >= 0) { keep[m] = 1; st.push([i, m], [m, j]); }
  }
  const out = []; Q.forEach((q, i) => { if (keep[i]) out.push(Math.round(q[0]), Math.round(q[1])); });
  return out;
}
const shapes = {}, ncorners = {};
for (const d of C.TRACKS) {
  if (d.variantOf) continue;
  const T = new C.Track(d); lens[d.id] = Math.round(d.open ? T.raceLen : T.len);
  if (!RT[d.id]) { const base = BASE[d.id] != null ? BASE[d.id] : d.alt ? d.alt[0] : null; profs[d.id] = Object.assign({ len: lens[d.id] }, base != null ? { base } : {}, { prof: profOf(d, T) }); }
  if (!d.test) { shapes[d.id] = shapeOf(T); ncorners[d.id] = T.corners.length; }
}
const F = path.join(ROOT, 'js', 'menu-data.js');
let src = fs.readFileSync(F, 'utf8');
// (a table already there keeps the order of its tracks, a new track at its end: a run changes only what changed)
const put = (key, val, note) => {
  const re = new RegExp('^window\\.MENU\\.' + key + ' = (.*);$', 'm'), m = re.exec(src);
  let was = {}; try { was = m ? JSON.parse(m[1]) : {}; } catch (_) { was = {}; }
  const keys = Object.keys(was).filter(k => k in val).concat(Object.keys(val).filter(k => !(k in was))), out = {};
  for (const k of keys) out[k] = val[k];
  const line = 'window.MENU.' + key + ' = ' + JSON.stringify(out) + ';';
  src = m ? src.replace(re, () => line) : src.replace(/\s*$/, '\n') + '// ' + note + '\n' + line + '\n';
};
put('lens', lens, 'the lengths of the tracks in metres (tools/menu-lens.js): the order of the list');
put('profs', profs, 'the heights along the tracks without a route map (tools/menu-lens.js): the height graph');
put('shapes', shapes, 'the real tracks from above (tools/menu-lens.js): their cards in the quick list');
put('ncorners', ncorners, 'the corners of the real tracks (tools/menu-lens.js): the row\'s Corners, the quick list');
fs.writeFileSync(F, src);
console.log(Object.keys(lens).length + ' tracks; heights of ' + Object.keys(profs).join(', ') + '; shapes and corners of ' + Object.keys(shapes).length + ' real tracks');
