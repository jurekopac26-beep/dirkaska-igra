// Lombok, Indonezija: the circuit by the beaches of the south coast of Lombok near Kuta (4.31 km, clockwise; docs/proge/lombok.md).
// The layout at its real length, clockwise; its 17 corners by plain descriptions in their order round the lap, each turning its way (the
// tight right of Turn 16 the tightest); the heights (a coastal plain: under 5 m from the lowest to the highest, the main straight level);
// the pits on the left of the main straight; the wide run-offs; the scenery data (terrain, land cover, the sea to the south, the hills on
// the horizon, the ten grandstands named after the places round it, the service roads; no names of the circuit); a whole AI race in the
// dry and in the rain.
//   node tests/lombok.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'lombok'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };

// 1. the track: its name (a place and its country), a closed circuit of 3 laps, 4.31 km within 3 % (realKm 4.31), clockwise, not a test
// track nor one waiting for a choice; at least 250 degrees of turning a kilometre (the game's smoothed line: about 307)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Lombok, Indonezija" (English "Lombok, Indonesia"), a closed circuit, 3 laps, 4.31 km within 3 % (realKm 4.31), clockwise, not a test track, at least 250 °/km of turning',
    def.name === 'Lombok, Indonezija' && def.en.name === 'Lombok, Indonesia' && !T.open && def.laps === 3 && Math.abs(T.len / 4310 - 1) < 0.03 && def.realKm === 4.31 && area < 0 && !def.test && !def.pending && perKm > 250,
    `${T.len.toFixed(1)} m (${((T.len / 4310 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the tightest radius on the centre line (Turn 16,
// the tight right), the nearest legs of the lap apart; the 17 apexes (the number boards) in their order
{
  const want = { 'Desni na koncu ravnine': [-1, 85], 'Desni pred esom': [-1, 70], 'Dvojni levi': [1, 90], 'Desni pod hribom': [-1, 40], 'Hitri desni': [-1, 32], 'Desni proti zahodu': [-1, 38],
    'Levi ob tribunah': [1, 28], 'Desni ob morju': [-1, 95], 'Desni pod gričem': [-1, 52], 'Levi na sever': [1, 52], 'Levi proti zahodu': [1, 65], 'Desni na zahodni strani': [-1, 24],
    'Dolgi desni': [-1, 24], 'Ostri desni': [-1, 120], 'Zadnji levi': [1, 95] };
  const order = ['Desni na koncu ravnine', 'Desni pred esom', 'Dvojni levi', 'Desni pod hribom', 'Hitri desni', 'Desni proti zahodu', 'Levi ob tribunah', 'Ravnina proti morju', 'Desni ob morju',
    'Desni pod gričem', 'Levi na sever', 'Levi proti zahodu', 'Desni na zahodni strani', 'Dolgi desni', 'Ostri desni', 'Zadnji levi', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 17 named places in their order round the lap (the right at the end of the straight ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: 10 rights (the end of the straight, before the esses, under the hill, the fast one, to the west, by the sea, under the knoll, the west side, the long one, the tight one) and 5 lefts (the double left, by the stands, to the north, to the west, the last one)',
    cs.length === 15 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0, ik = 0; for (let i = 0; i < T.N; i++) if (Math.abs(T.k[i]) > kmax) { kmax = Math.abs(T.k[i]); ik = i; }
  const t16 = near(...def.turns[15]).d, dk = dS(ik * T.ds);
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: the tightest bend Turn 16 (the tight right), no bend under a 20 m radius; the legs of the lap at least 40 m apart', 1 / kmax >= 20 && Math.abs(dk - t16) < 40 && T.k[ik] > 0 && legs >= 40,
    `tightest radius ${(1 / kmax).toFixed(1)} m at ${Math.round(dk)} m (Turn 16 at ${Math.round(t16)} m), nearest legs ${legs.toFixed(1)} m`);
  check('track: the 17 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 17 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: a coastal plain only a few metres above the sea, 3-5 m from the lowest to the highest, nowhere steeper than 3 %; the main
// straight level (the pits and the big grandstands beside it: under 0.5 % from 330 m before the start line to 340 m after it)
{
  let lo = 1e9, hi = -1e9, g = 0; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i])); }
  let gm = 0; for (let d = -330; d <= 340; d += T.ds) gm = Math.max(gm, Math.abs(T.grade[T.idx(T.startS + d)]));
  check('heights: 3-5 m from the lowest to the highest, nowhere steeper than 3 %, the main straight under 0.5 %', hi - lo > 3 && hi - lo < 5 && g <= 0.03 && gm < 0.005,
    `${(hi - lo).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %, the main straight ${(gm * 100).toFixed(2)} %`);
}
// 4. the pits: the lane on the left of the main straight from before the start line to after it, the straight no tighter than a 300 m
// radius along the boxes, the 13 crews' boxes in the lane, the pit wall on the left along it; the start line on the main straight's sign
// side; the run-offs: the barriers more than 3 m past the asphalt along more than 90 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the left of the main straight past the start line, the straight no tighter than a 300 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall on the left along it',
    !!p0 && p0.t > 0.99 && P[0] < 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 300 && dfs > T.len - 400 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === -1),
    `lane ${P[1]} .. ${P[2]} m, ${-P[0]} m to the left, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 90 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.9 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/lombok/build.py): terrain and land cover round the track, the sea (its level the finish line's height below it,
// the terrain's sea cells under it all south of the circuit), the hills on the horizon, the ten grandstands (named after the places round
// it: the main one roofed) back from the road (the barrier in front of each moved out: def.wide), the building, the service roads and the dirt tracks (OSM);
// only place names
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const names = 'LOMBOK,KUTA,PRAYA,PUJUT,SEGER,SENGKOL,GERUPUK,MERESE,TANJUNG,RINJANI', roofed = def.stands.filter(s => s[4]).map(s => s[7]).join();
  let farIn = 0; for (const [a, b, sd] of def.stands) for (let d = a; d <= b; d += 5) { const i = T.idx(T.startS + d); if ((sd > 0 ? T.br[i] : T.bl[i]) < 17.5) farIn++; }
  check('scenery: terrain and land cover 300 m and more round the whole track; 10 grandstands (' + names + '), LOMBOK roofed, each with its barrier 17.5 m or more from the centre line (its front 20 m or more); 1 building',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.map(s => s[7]).join() === names && roofed === 'LOMBOK' && !farIn && sk.bld.length / 6 === 1, `${sk.bld.length / 6} buildings, roofed ${roofed}, ${farIn} stand places nearer`);
  const D = def.dem, bin = Buffer.from(D.b64, 'base64'); let nSea = 0, north = 0;
  for (let j = 0; j < D.nz; j++) for (let i = 0; i < D.nx; i++) if (D.lo + bin[j * D.nx + i] * D.step < sk.sea.y - 0.5) { nSea++; if (D.z0 + j * D.cell < sk.sea.z0) north++; }
  check('scenery: the sea at the finish line\'s height below it (4-5 m), the terrain\'s sea cells under it (1000 or more, none north of the plane\'s edge), the hills on the horizon (def.far, 10 rings to 11.5 km)',
    sk.sea.y < -4 && sk.sea.y > -5 && nSea >= 1000 && !north && def.far && def.far.r.length === 10 && def.far.r[9] === 11500, `sea ${sk.sea.y} m, ${nSea} cells under it, ${north} north of z ${sk.sea.z0}`);
  const ways = (S) => { let nr = 0, np = 0, inb = 0, short = 0; for (let k = 0; k < S.length;) { const m = S[k]; nr++; if (m < 2) short++;
    for (let q = 0; q < m; q++) { const qq = near(S[k + 1 + q * 2], S[k + 2 + q * 2]); np++; if (Math.abs(qq.lat) < (qq.lat > 0 ? T.br[qq.i] : T.bl[qq.i])) inb++; } k += 1 + m * 2; } return { nr, np, inb, short }; };
  const sv = ways(sk.svc), tr = ways(sk.trk);
  check('scenery: 20 or more service roads and 3 or more dirt tracks (OSM), each of 2 points or more, at most 6 % of their points inside the barriers (the marshals\' ways to the track, the perimeter road behind the moved-out barrier of the main straight: none of it drawn there, World draws the roads only past the barriers)',
    sv.nr >= 20 && tr.nr >= 3 && !sv.short && !tr.short && (sv.inb + tr.inb) / (sv.np + tr.np) <= 0.06, `${sv.nr} roads, ${tr.nr} tracks, ${sv.np + tr.np} points, ${sv.inb + tr.inb} inside the barriers`);
  const words = JSON.stringify([def.name, def.desc, def.en, def.names, def.stands.map(s => s[7])]);
  check('names: only places and plain descriptions (no name of the circuit, its area, its races or sponsors)', !/mandalika|pertamina|formula|grand prix|\bgp\b|motogp|superbike|sirkuit/i.test(words));
}
// 6. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 3-15 % slower
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
  check('race in the rain: all to the finish, no rescue, the winner 3-15 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
