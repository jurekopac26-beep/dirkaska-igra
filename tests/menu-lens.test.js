// The menu's tables of the tracks (js/menu-data.js, made by tools/menu-lens.js): MENU.lens, the lengths (the track step's list goes from
// the shortest real track to the longest, then the test tracks, without building every track): every track of the game is in it with its
// length as the game measures it (an open road: the race from the start to the finish; a circuit: the lap), to the metre; no track that
// is not in the game. MENU.profs, the heights along the run for the height graph of every track without a route map in js/routes.js: as
// the game's road (121 heights from the start line, to 0.1 m), a real track's with its start line's height above the sea. MENU.shapes and
// MENU.ncorners, the quick list's cards and facts (js/menu-izbor.js): every real track's shape from above (from its start line to its
// finish, a circuit round to its start again; the longer side 200) and its corners as the game counts them; none for a test track.
// The flyovers (camera 2; js/routes.js fly, maketa-menija/orodja/routes.py --fly): a track with a flyover has its video and its first
// picture (assets/maps/fly-<id>.webm, .webp), and no flyover's file is left there without its flyover (a track need not have one).
// After a new track or a changed road: node tools/menu-lens.js
//   node tests/menu-lens.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
global.window = {};
require(path.join(ROOT, 'js', 'menu-data.js'));
const L = window.MENU.lens || {}, ids = C.TRACKS.filter(d => !d.variantOf).map(d => d.id);
const off = [], built = new Map();
for (const d of C.TRACKS) {
  if (d.variantOf) continue;
  const T = new C.Track(d), m = Math.round(d.open ? T.raceLen : T.len); built.set(d.id, T);
  if (L[d.id] !== m) off.push(d.id + ': ' + L[d.id] + ' (the game: ' + m + ')');
}
check(`every track of the game (${ids.length}) has its length in the menu's table, to the metre (node tools/menu-lens.js)`, !off.length, off.join(', '));
const extra = Object.keys(L).filter(id => !ids.includes(id));
check('no track in the table that is not in the game', !extra.length, extra.join(', '));

// the heights for the graph: every track without a route map, as its road is (the same samples as tools/menu-lens.js takes)
global.window.ROUTES = undefined; require(path.join(ROOT, 'js', 'routes.js'));
const RT = window.ROUTES || {}, P = window.MENU.profs || {}, need = C.TRACKS.filter(d => !d.variantOf && !RT[d.id]), poff = [];
for (const d of need) {
  const p = P[d.id], T = built.get(d.id), Lr = d.open ? T.raceLen : T.len;
  if (!p || p.prof.length !== 121 || p.len !== Math.round(Lr)) { poff.push(d.id + (p ? ': ' + p.prof.length + ' heights over ' + p.len + ' m' : ': none')); continue; }
  let worst = 0;
  for (let k = 0; k <= 120; k++) {
    let s = T.startS + Lr * k / 120; if (!d.open) s = ((s % T.len) + T.len) % T.len;
    const f = Math.min(T.N - 1, s / T.ds), i = Math.min(T.N - 2, Math.floor(f)), h = T.hy[i] + (T.hy[i + 1] - T.hy[i]) * (f - i) - T.hy[T.startIdx];
    worst = Math.max(worst, Math.abs(h - p.prof[k]));
  }
  if (worst > 0.06) poff.push(d.id + ': ' + worst.toFixed(2) + ' m off');
}
check(`every track without a route map (${need.map(d => d.id).join(', ')}) has its heights for the graph, as the game's road (node tools/menu-lens.js)`, need.length > 0 && !poff.length, poff.join(', '));
const nobase = need.filter(d => !d.test && !(P[d.id] && P[d.id].base > -500)).map(d => d.id);
check('every real one with its start line\'s height above the sea (the graph\'s heights, the head\'s top)', !nobase.length, nobase.join(', '));
const pextra = Object.keys(P).filter(id => !need.some(d => d.id === id));
check('no heights in the table for a track that has a route map, or is not in the game', !pextra.length, pextra.join(', '));

// the real tracks' shapes and corners (node tools/menu-lens.js): the start line first, the finish last (a circuit: its start again), the
// longer side 200 (the simplification may leave out the very corner of the box: at least 196), integers in the box; the corners as
// the game's Track counts them
const SH = window.MENU.shapes || {}, NC = window.MENU.ncorners || {}, reals = C.TRACKS.filter(d => !d.variantOf && !d.test), soff = [];
for (const d of reals) {
  const T = built.get(d.id), s = SH[d.id];
  if (NC[d.id] !== T.corners.length) soff.push(d.id + ': ' + NC[d.id] + ' corners (the game: ' + T.corners.length + ')');
  if (!Array.isArray(s) || s.length < 8 || s.length % 2 || s.length > 400 || s.some(v => !Number.isInteger(v) || v < 0 || v > 200)) { soff.push(d.id + ': shape ' + (Array.isArray(s) ? s.length / 2 + ' points' : 'none')); continue; }
  const N = T.N, a = T.startIdx, b = (d.open ? T.finishIdx : T.startIdx + N) % N;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = T.startIdx; i <= (d.open ? T.finishIdx : T.startIdx + N); i++) { const k = i % N; x0 = Math.min(x0, T.px[k]); x1 = Math.max(x1, T.px[k]); y0 = Math.min(y0, T.pz[k]); y1 = Math.max(y1, T.pz[k]); }
  const k = 200 / Math.max(x1 - x0, y1 - y0), at = (i) => [(T.px[i] - x0) * k, (T.pz[i] - y0) * k], n2 = s.length, far = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) > 1.5;
  let wx = 0, wy = 0; for (let i = 0; i < n2; i += 2) { wx = Math.max(wx, s[i]); wy = Math.max(wy, s[i + 1]); }
  if (far([s[0], s[1]], at(a)) || far([s[n2 - 2], s[n2 - 1]], at(b)) || Math.max(wx, wy) < 196) soff.push(d.id + ': its ends or its size not the road\'s');
}
check(`every real track (${reals.length}) has its shape from above and its corners for the quick list, as the game's road (node tools/menu-lens.js)`, !soff.length, soff.join(', '));
const sextra = [...Object.keys(SH), ...Object.keys(NC)].filter(id => !reals.some(d => d.id === id));
check('no shape or corners for a test track or a track that is not in the game (the test tracks are frozen)', !sextra.length, [...new Set(sextra)].join(', '));

// the flyovers: the menu offers camera 2 where the route has a flyover and plays assets/maps/fly-<id>.webm over its first picture
const maps = fs.readdirSync(path.join(ROOT, 'assets', 'maps')), flown = ids.filter(id => RT[id] && RT[id].fly), foff = [];
for (const id of flown) {
  const F = RT[id].fly;
  for (const e of ['webm', 'webp']) if (!maps.includes('fly-' + id + '.' + e)) foff.push('fly-' + id + '.' + e + ' is missing');
  if (!(Array.isArray(F.frames) && F.frames.length > 60 && F.fps > 0)) foff.push(id + ': no frames');
}
for (const f of maps) { const m = /^fly-(.+)\.(?:webm|webp)$/.exec(f); if (m && !flown.includes(m[1])) foff.push(f + ' without a flyover in js/routes.js'); }
check(`every flyover of js/routes.js (${flown.length} tracks) has its video and its first picture in assets/maps/, none there without its flyover`, flown.length > 0 && !foff.length, foff.join(', '));
console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
