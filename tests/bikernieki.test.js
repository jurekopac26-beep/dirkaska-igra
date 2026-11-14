// Biķernieki, Latvija: the circuit in the Biķernieki forest park on the east side of Riga (3.65 km, clockwise; docs/proge/bikernieki.md).
// The layout at its real length, clockwise; its corners by plain descriptions in their order round the lap, each turning its way; the
// heights (the lake's hollow lowest, the dunes past the climb from the lake about 20 m higher, the drop off them the steepest); the pits
// on the left of the main straight past the start line; the run-offs (wider than 3 m past the asphalt along most of the lap); the scenery
// data (terrain, land cover, the grandstands, the lake Linezers on the left past the lakeside left, the ponds, the reedbeds, the
// buildings); a whole AI race in the dry and in the rain.
//   node tests/bikernieki.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'bikernieki'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };

// 1. the track: its name (a place and its country), a closed circuit of 4 laps, 3.65 km within 3 % (realKm 3.65), clockwise, not a test
// track nor one waiting for a choice; at least 200 degrees of turning a kilometre (the game's smoothed line: about 242)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Biķernieki, Latvija" (English "Biķernieki, Latvia"), a closed circuit, 4 laps, 3.65 km within 3 % (realKm 3.65), clockwise, not a test track, at least 200 °/km of turning',
    def.name === 'Biķernieki, Latvija' && def.en.name === 'Biķernieki, Latvia' && !T.open && def.laps === 4 && Math.abs(T.len / 3650 - 1) < 0.03 && def.realKm === 3.65 && area < 0 && !def.test && !def.pending && perKm > 200,
    `${T.len.toFixed(1)} m (${((T.len / 3650 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the tightest radius on the centre line (the
// hairpin), the nearest legs of the lap apart
{
  const want = { 'Desni pregib': [-1, 20], 'Lasnica': [-1, 110], 'Levi za lasnico': [1, 15], 'Desni v gozdu': [-1, 15], 'Spust k jezeru': [-1, 12], 'Levi ob jezeru': [1, 40],
    'Zahodni ovinek': [-1, 65], 'Severni ovinek': [-1, 45], 'Desni na klancu': [-1, 30], 'Levi na vrhu': [1, 40], 'Desni pred ravnino': [-1, 45], 'Levi na ravnino': [1, 45] };
  const order = ['Desni pregib', 'Lasnica', 'Levi za lasnico', 'Vzpon skozi gozd', 'Desni v gozdu', 'Spust k jezeru', 'Levi ob jezeru', 'Klanec od jezera', 'Zahodni ovinek',
    'Gozdna ravnina', 'Severni ovinek', 'Desni na klancu', 'Levi na vrhu', 'Spust', 'Desni pred ravnino', 'Levi na ravnino', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 17 named places in their order round the lap (the right kink ... the finish straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right at the kink, the hairpin, in the woods, down to the lake, the west and the north corner, on the climb and before the straight; left after the hairpin, by the lake, over the top and onto the straight',
    cs.length === 12 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 20 m radius (the hairpin); the legs of the lap at least 40 m apart', 1 / kmax >= 20 && legs >= 40, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 12 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 12 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: 17-25 m from the lowest (the lake's hollow, 1.15-1.45 km after the start line) to the highest (past the climb from the lake,
// 1.6-1.85 km); the steepest grade (the drop off the dunes, 2.85-3.1 km) 8-11.5 %
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0, iG = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } if (Math.abs(T.grade[i]) > g) { g = Math.abs(T.grade[i]); iG = i; } }
  const dLo = dS(iLo * T.ds), dHi = dS(iHi * T.ds), dG = dS(iG * T.ds);
  check('heights: 17-25 m from the lowest (the lake, 1.15-1.45 km after the start line) to the highest (past the climb from the lake, 1.6-1.85 km), the steepest grade 8-11.5 % on the drop (2.85-3.1 km)',
    hi - lo > 17 && hi - lo < 25 && dLo > 1150 && dLo < 1450 && dHi > 1600 && dHi < 1850 && g > 0.08 && g < 0.115 && dG > 2850 && dG < 3100,
    `${(hi - lo).toFixed(1)} m, lowest at ${Math.round(dLo)} m, highest at ${Math.round(dHi)} m, steepest ${(g * 100).toFixed(1)} % at ${Math.round(dG)} m`);
}
// 4. the pits: the lane on the left of the main straight from before the start line to after it, the straight no tighter than a 300 m
// radius along the boxes, the 13 crews' boxes in the lane, the pit wall on the left along it; the start line on the finish straight's sign
// side; the run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the left of the main straight past the start line, the straight no tighter than a 300 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall on the left along it',
    !!p0 && p0.t > 0.99 && P[0] < 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 300 && dfs > T.len - 200 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === -1),
    `lane ${P[1]} .. ${P[2]} m, ${-P[0]} m to the left, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.85 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/bikernieki/build.py): terrain and land cover round the track, the five grandstands (named after the places
// round it), the buildings, the lakes (OSM): Linezers on the left past the lakeside left (nearest 1.4-1.6 km after the start line), never
// under the road, at least 5 m past the barriers; the ponds in the forest, the reedbeds
{
  const sk = def.sk, L = sk.lakes.find(l => l[0] === 'Linezers');
  const inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  check('scenery: terrain and land cover 300 m and more round the whole track; 5 grandstands (MEŽCIEMS, BIĶERNIEKI, RĪGA, LATVIJA, VIDZEME); 8 or more buildings',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.map(s => s[7]).join() === 'MEŽCIEMS,BIĶERNIEKI,RĪGA,LATVIJA,VIDZEME' && sk.bld.length / 6 >= 8, `${sk.bld.length / 6} buildings`);
  let best = 1e9, bd = 0, side = 0, under = false;
  if (L) for (let k = 1; k + 1 < L.length; k += 2) { const q = near(L[k], L[k + 1]), e = Math.abs(q.lat) - (q.lat > 0 ? T.br[q.i] : T.bl[q.i]); if (Math.abs(q.lat) < T.w) under = true; if (e < best) { best = e; bd = q.d; side = Math.sign(q.lat); } }
  check('the lake Linezers: on the left by the lakeside left (nearest 1.4-1.6 km after the start line), at least 5 m past the barriers, never under the road; 4 more ponds and lakes, 2 reedbeds',
    !!L && side < 0 && bd > 1400 && bd < 1600 && best >= 5 && !under && sk.lakes.length >= 5 && (sk.reeds || []).length >= 2,
    `nearest ${best.toFixed(1)} m past the barrier at ${Math.round(bd)} m, ${sk.lakes.length} lakes, ${(sk.reeds || []).length} reedbeds`);
}
// 6. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 10-25 % slower (a third less grip in the wet: docs/dez-sneg.md)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 600 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] && fin[0].finishTime, resc };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 2.5-5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 150 && d.win < 300, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 10-25 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.1 && w.win / d.win < 1.25, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
