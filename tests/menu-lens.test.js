// The menu's tables of the tracks (js/menu-data.js, made by tools/menu-lens.js): MENU.lens, the lengths (the track step's list goes from
// the shortest real track to the longest, then the test tracks, without building every track): every track of the game is in it with its
// length as the game measures it (an open road: the race from the start to the finish; a circuit: the lap), to the metre; no track that
// is not in the game. MENU.profs, the heights along the run for the height graph of every track without a route map in js/routes.js: as
// the game's road (121 heights from the start line, to 0.1 m), a real track's with its start line's height above the sea.
// After a new track or a changed road: node tools/menu-lens.js
//   node tests/menu-lens.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
global.window = {};
require(path.join(ROOT, 'js', 'menu-data.js'));
const L = window.MENU.lens || {}, ids = C.TRACKS.filter(d => !d.variantOf).map(d => d.id);
const off = [];
for (const d of C.TRACKS) {
  if (d.variantOf) continue;
  const T = new C.Track(d), m = Math.round(d.open ? T.raceLen : T.len);
  if (L[d.id] !== m) off.push(d.id + ': ' + L[d.id] + ' (the game: ' + m + ')');
}
check(`every track of the game (${ids.length}) has its length in the menu's table, to the metre (node tools/menu-lens.js)`, !off.length, off.join(', '));
const extra = Object.keys(L).filter(id => !ids.includes(id));
check('no track in the table that is not in the game', !extra.length, extra.join(', '));

// the heights for the graph: every track without a route map, as its road is (the same samples as tools/menu-lens.js takes)
global.window.ROUTES = undefined; require(path.join(ROOT, 'js', 'routes.js'));
const RT = window.ROUTES || {}, P = window.MENU.profs || {}, need = C.TRACKS.filter(d => !d.variantOf && !RT[d.id]), poff = [];
for (const d of need) {
  const p = P[d.id], T = new C.Track(d), Lr = d.open ? T.raceLen : T.len;
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
console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
