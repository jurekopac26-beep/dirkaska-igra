// Batangas, Filipini: the circuit on the plateau of Batangas province near Rosario (3.6 km, clockwise; docs/proge/batangas.md). The layout
// at its real length, clockwise; its 13 corners by plain descriptions in their order round the lap, each turning its way (the tight right
// in the west, Turn 8, the tightest); the heights (a plateau about 100 m above the sea: under 10 m from the lowest to the highest, the main
// straight a gentle even slope); the pits on the right of the main straight; the run-offs; the scenery data (terrain, land cover, the hills
// on the horizon, the five grandstands named after the places round it, the buildings and the service roads; no names of the circuit); a
// whole AI race in the dry and in the rain.
//   node tests/batangas.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'batangas'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };

// 1. the track: its name (a place and its country), a closed circuit of 3 laps, 3.62 km within 3 % (realKm 3.62), clockwise, not a test
// track nor one waiting for a choice; at least 350 degrees of turning a kilometre (the game's smoothed line: about 430)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Batangas, Filipini" (English "Batangas, Philippines"), a closed circuit, 3 laps, 3.62 km within 3 % (realKm 3.62), clockwise, not a test track, at least 350 °/km of turning',
    def.name === 'Batangas, Filipini' && def.en.name === 'Batangas, Philippines' && !T.open && def.laps === 3 && Math.abs(T.len / 3620 - 1) < 0.03 && def.realKm === 3.62 && area < 0 && !def.test && !def.pending && perKm > 350,
    `${T.len.toFixed(1)} m (${((T.len / 3620 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the tightest radius on the centre line (Turn 8,
// the tight right in the west), the nearest legs of the lap apart; the 13 apexes (the number boards) in their order
{
  const want = { 'Desni na koncu ravnine': [-1, 130], 'Dolgi desni': [-1, 100], 'Ostri levi': [1, 150], 'Desni za ostrim levim': [-1, 15], 'Trije levi': [1, 65],
    'Zahodni ostri desni': [-1, 100], 'Šikana': [1, 25], 'Desni za šikano': [-1, 18], 'Dvojni desni': [-1, 80] };
  const order = ['Desni na koncu ravnine', 'Dolgi desni', 'Ostri levi', 'Desni za ostrim levim', 'Trije levi', 'Ravnina proti zahodu', 'Zahodni ostri desni', 'Šikana', 'Desni za šikano',
    'Dvojni desni', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 11 named places in their order round the lap (the right at the end of the straight ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: 7 rights (the end of the straight, the long one, after the hairpin, the tight one in the west, after the chicane, the double one) and 2 lefts (the hairpin, the three lefts), the chicane\'s left first',
    cs.length === 9 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0, ik = 0; for (let i = 0; i < T.N; i++) if (Math.abs(T.k[i]) > kmax) { kmax = Math.abs(T.k[i]); ik = i; }
  const t8 = near(...def.turns[7]).d, dk = dS(ik * T.ds);
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: the tightest bend Turn 8 (the tight right in the west), no bend under a 12 m radius; the legs of the lap at least 17 m apart (the back straight beside the run from Turn 1: their barriers 1 m short of halfway, core.js)',
    1 / kmax >= 12 && Math.abs(dk - t8) < 40 && T.k[ik] > 0 && legs >= 17, `tightest radius ${(1 / kmax).toFixed(1)} m at ${Math.round(dk)} m (Turn 8 at ${Math.round(t8)} m), nearest legs ${legs.toFixed(1)} m`);
  check('track: the 13 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 13 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: a plateau about 100 m above the sea, 5-10 m from the lowest to the highest, nowhere steeper than 3 %; the main straight an
// even gentle slope (the pits and the big grandstand beside it: under 1.5 % from 200 m before the start line to 330 m after it)
{
  let lo = 1e9, hi = -1e9, g = 0; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i])); }
  let gm = 0; for (let d = -200; d <= 330; d += T.ds) gm = Math.max(gm, Math.abs(T.grade[T.idx(T.startS + d)]));
  check('heights: 5-10 m from the lowest to the highest, nowhere steeper than 3 %, the main straight under 1.5 %', hi - lo > 5 && hi - lo < 10 && g <= 0.03 && gm < 0.015,
    `${(hi - lo).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %, the main straight ${(gm * 100).toFixed(2)} %`);
}
// 4. the pits: the lane on the right of the main straight from before the start line to after it, the straight no tighter than a 300 m
// radius along the boxes, the 13 crews' boxes in the lane, the pit wall on the right along it; the start line on the main straight's sign
// side; the run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = def.pitRow[0]; d <= def.pitRow[1]; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the right of the main straight past the start line, the straight no tighter than a 300 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall on the right along it',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 300 && dfs > T.len - 400 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] - 100 && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.85 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/batangas/build.py): terrain and land cover round the track, the hills on the horizon, the five grandstands
// (named after the places round it: the main one roofed) behind the barrier (9 m or more from the centre line), the buildings and the
// service roads (OSM); only place names
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const names = 'BATANGAS,ROSARIO,LIPA,IBAAN,PADRE GARCIA', roofed = def.stands.filter(s => s[4]).map(s => s[7]).join();
  let farIn = 0; for (const [a, b, sd] of def.stands) for (let d = a; d <= b; d += 5) { const i = T.idx(T.startS + d); if ((sd > 0 ? T.br[i] : T.bl[i]) < 9) farIn++; }
  check('scenery: terrain and land cover 300 m and more round the whole track; 5 grandstands (' + names + '), BATANGAS roofed, each behind its barrier 9 m or more from the centre line; 15 buildings or more (OSM), no sea',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.map(s => s[7]).join() === names && roofed === 'BATANGAS' && !farIn && sk.bld.length / 6 >= 15 && !sk.sea, `${sk.bld.length / 6} buildings, roofed ${roofed}, ${farIn} stand places nearer`);
  check('scenery: the hills and the mountains on the horizon (def.far, 10 rings to 11.5 km)', def.far && def.far.r.length === 10 && def.far.r[9] === 11500);
  const ways = (S) => { let nr = 0, np = 0, inb = 0, short = 0; for (let k = 0; k < S.length;) { const m = S[k]; nr++; if (m < 2) short++;
    for (let q = 0; q < m; q++) { const qq = near(S[k + 1 + q * 2], S[k + 2 + q * 2]); np++; if (Math.abs(qq.lat) < (qq.lat > 0 ? T.br[qq.i] : T.bl[qq.i])) inb++; } k += 1 + m * 2; } return { nr, np, inb, short }; };
  const sv = ways(sk.svc);
  check('scenery: 3 or more service roads (OSM), each of 2 points or more, at most a quarter of their points inside the barriers (the marshals\' ways to the track: World draws the roads only past the barriers)',
    sv.nr >= 3 && !sv.short && sv.inb / sv.np <= 0.25, `${sv.nr} roads, ${sv.np} points, ${sv.inb} inside the barriers`);
  const words = JSON.stringify([def.name, def.desc, def.en, def.names, def.stands.map(s => s[7])]);
  check('names: only places and plain descriptions (no name of the circuit, its races or sponsors)', !/racing circuit|raceway|formula|grand prix|\bgp\b|superbike|karting|speedway/i.test(words));
}
// 6. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 10-25 % slower (a third less grip in the wet: docs/dez-sneg.md)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 900 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] && fin[0].finishTime, resc };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 2.5-4.5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 150 && d.win < 270, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 10-25 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.1 && w.win / d.win < 1.25, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
