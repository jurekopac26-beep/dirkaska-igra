// Kågeröd, Švedska: the circuit in the woods by the Vege å river at Kågeröd in Skåne (2.1 km, clockwise; docs/proge/kagerod.md).
// The layout at its real length, clockwise, twisty; its corners by plain descriptions in their order round the lap, each turning its way;
// the heights (the straight by the river lowest, the hilltop hairpin 10-15 m higher); the pits on the right of the finish straight past the
// start line; the run-offs (wider than 3 m past the asphalt along most of the lap); the scenery data (terrain, land cover, the river under
// the circuit twice and along its finish straight, the barriers this side of it, the buildings); a whole AI race in the dry and in the rain.
//   node tests/kagerod.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'kagerod'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };

// 1. the track: its name (a place and its country), a closed circuit of 6 laps, 2.1 km within 3 % (realKm 2.1), clockwise, not a test
// track nor one waiting for a choice; twisty: at least 450 degrees of turning a kilometre (the game's smoothed line: about 566)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Kågeröd, Švedska" (English "Kågeröd, Sweden"), a closed circuit, 6 laps, 2.1 km within 3 % (realKm 2.1), clockwise, not a test track, at least 450 °/km of turning',
    def.name === 'Kågeröd, Švedska' && def.en.name === 'Kågeröd, Sweden' && !T.open && def.laps === 6 && Math.abs(T.len / 2100 - 1) < 0.03 && def.realKm === 2.1 && area < 0 && !def.test && !def.pending && perKm > 450,
    `${T.len.toFixed(1)} m (${((T.len / 2100 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms, the circuit or the castle by it), in their order round the lap from the
// start line, each turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the tightest radius on the
// centre line, the nearest legs of the lap apart (the hairpin's two legs on the hill)
{
  const want = { 'Dvojni desni': [-1, 90], 'Dolgi desni': [-1, 45], 'Hitri levi': [1, 35], 'Levi pod klancem': [1, 90], 'Lasnica na vrhu': [-1, 150], 'Levi na spustu': [1, 60],
    'Desni nad reko': [-1, 70], 'Gozdni ovinek': [-1, 110], 'Levi ob reki': [1, 80], 'Zadnji ovinek': [-1, 30] };
  const order = ['Dvojni desni', 'Dolgi desni', 'Hitri levi', 'Levi pod klancem', 'Klanec', 'Lasnica na vrhu', 'Levi na spustu', 'Desni nad reko', 'Gozdni ovinek', 'Levi ob reki', 'Zadnji ovinek', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 12 named places in their order round the lap (the double right ... the finish straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right at the double right, the long right, the hilltop hairpin, the right over the river, the forest corner and the last corner; left at the fast left, the left below the hill, the downhill left and the left by the river',
    cs.length === 10 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 15 m radius; the legs of the lap at least 25 m apart (the hairpin\'s two legs on the hill)', 1 / kmax >= 15 && legs >= 25, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 12 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 12 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: 10-15 m from the lowest (the finish straight by the river, 150-450 m after the start line) to the highest (by the hilltop
// hairpin, 1.15-1.3 km); the steepest grade under 8 %
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const dLo = dS(iLo * T.ds), dHi = dS(iHi * T.ds);
  check('heights: 10-15 m from the lowest (the straight, 150-450 m after the start line) to the highest (by the hilltop hairpin, 1.15-1.3 km), the steepest grade under 8 %',
    hi - lo > 10 && hi - lo < 15 && dLo > 150 && dLo < 450 && dHi > 1150 && dHi < 1300 && g < 0.08, `${(hi - lo).toFixed(1)} m, lowest at ${Math.round(dLo)} m, highest at ${Math.round(dHi)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 4. the pits: the lane on the right of the finish straight from before the start line to after it, the straight no tighter than a 250 m
// radius along the boxes, the 13 crews' boxes in the lane, the pit wall along it; the start line on the finish straight's sign side; the
// run-offs: the barriers more than 3 m past the asphalt along more than 80 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the right of the finish straight past the start line, the straight no tighter than a 250 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall along it',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 250 && dfs > T.len - 200 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 80 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.8 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/kagerod/build.py): terrain and land cover round the track, the grandstands (named after the village and the
// region), the river (OSM): under the circuit twice (the right over the river, the left by the river), along the finish straight on its left,
// the barriers this side of it (its middle at least 6 m past them where it runs by the circuit, away from the culverts); the buildings
{
  const sk = def.sk, rv = sk.river, pts = [];
  for (let k = 0; k + 3 < rv.length; k += 2) { const m = Math.max(1, Math.ceil(Math.hypot(rv[k + 2] - rv[k], rv[k + 3] - rv[k + 1]) / 3)); for (let q = 0; q < m; q++) pts.push([rv[k] + (rv[k + 2] - rv[k]) * q / m, rv[k + 1] + (rv[k + 3] - rv[k + 1]) * q / m]); }
  const q = pts.map(([x, z]) => near(x, z)), cross = [];
  for (let k = 1; k < q.length; k++) if (q[k].off < 40 && q[k - 1].off < 40 && Math.sign(q[k].lat) !== Math.sign(q[k - 1].lat)) cross.push(q[k].d);
  const nearX = (d) => cross.some(s => Math.min(Math.abs(d - s), T.len - Math.abs(d - s)) < 40);
  let clear = 1e9, alongL = 0; for (const c of q) { if (c.off > 40 || nearX(c.d)) continue; clear = Math.min(clear, Math.abs(c.lat) - (c.lat > 0 ? T.br[c.i] : T.bl[c.i])); if (c.lat < 0 && (c.d > T.len - 100 || c.d < 300)) alongL++; }
  const xr = def.names.find(c => c[0] === 'Desni nad reko'), xl = def.names.find(c => c[0] === 'Levi ob reki'), dxr = near(xr[1], xr[2]).d, dxl = near(xl[1], xl[2]).d;
  const inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  check('scenery: terrain and land cover 300 m and more round the whole track; 2 grandstands (KÅGERÖD, SKÅNE); 4 or more buildings',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.length === 2 && def.stands.map(s => s[7]).join() === 'KÅGERÖD,SKÅNE' && sk.bld.length / 6 >= 4, `${sk.bld.length / 6} buildings`);
  check('the river: under the circuit twice (by the right over the river and the left by the river), along the finish straight on its left (100 m before the start line to 300 m after it), its middle at least 6 m past the barriers where it runs by the circuit',
    cross.length === 2 && cross.some(d => Math.abs(d - dxr) < 50) && cross.some(d => Math.abs(d - dxl) < 50) && alongL >= 100 && clear >= 6,
    `under the road at ${cross.map(Math.round).join(' and ')} m, ${alongL} points along the straight, nearest ${clear.toFixed(1)} m past the barrier`);
}
// 6. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 10-25 % slower (a third less grip in the wet: docs/dez-sneg.md)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 420 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] && fin[0].finishTime, resc };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 1.5-3 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 90 && d.win < 180, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 10-25 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.1 && w.win / d.win < 1.25, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
