// Tuzla, Turčija: the circuit on the hills above Tuzla on the Asian side of Istanbul (5.34 km, anticlockwise; docs/proge/tuzla.md).
// The layout at its real length, anticlockwise; its corners by plain descriptions in their order round the lap, each turning its way, the
// long left of Turn 8 one sweep with its four apexes (no straight bits between them: tools/tuzla/build.py, smooth_bend); the heights (Turn 3
// on the hill the highest, Turn 9 at the foot of the long drop the lowest, about 40 m apart, the drop the steepest; the main straight
// level); the pits on the left of the main straight; the wide run-offs; the scenery data (terrain, land cover, the eight grandstands named
// after the places round it, the buildings, the service roads; no names of the circuit); a whole AI race in the dry and in the rain.
//   node tests/tuzla.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'tuzla'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };
const kAt = (d) => -T.k[T.idx(T.startS + d)];   // (Track.k > 0: a right-hander; here + left)

// 1. the track: its name (a place and its country), a closed circuit of 2 laps, 5.34 km within 3 % (realKm 5.338), anticlockwise, not a
// test track nor one waiting for a choice; at least 250 degrees of turning a kilometre (the game's smoothed line: about 294)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: positive = anticlockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Tuzla, Turčija" (English "Tuzla, Turkey"), a closed circuit, 2 laps, 5.34 km within 3 % (realKm 5.338), anticlockwise, not a test track, at least 250 °/km of turning',
    def.name === 'Tuzla, Turčija' && def.en.name === 'Tuzla, Turkey' && !T.open && def.laps === 2 && Math.abs(T.len / 5338 - 1) < 0.03 && def.realKm === 5.338 && area > 0 && !def.test && !def.pending && perKm > 250,
    `${T.len.toFixed(1)} m (${((T.len / 5338 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; Turn 8 the long left: 180-240 degrees from
// 2.15 to 2.8 km, never tighter than a 70 m radius, turning left all the way from its first apex to its last; the tightest radius on the
// centre line (Turn 4), the nearest legs of the lap apart
{
  const want = { 'Spust v prvi levi': [1, 75], 'Dolgi desni v dolini': [-1, 35], 'Levi na vrhu': [1, 60], 'Ostri desni': [-1, 85], 'Dvojni levi': [1, 80], 'Desni na dnu': [-1, 95],
    'Levi po spustu': [1, 80], 'Desni na zadnjo ravnino': [-1, 35], 'Desni pregib': [-1, 25], 'Levi na koncu ravnine': [1, 125], 'Desni v šikani': [-1, 80], 'Levi na ciljno ravnino': [1, 90] };
  const order = ['Spust v prvi levi', 'Dolgi desni v dolini', 'Vzpon na hrib', 'Levi na vrhu', 'Ostri desni', 'Dvojni levi', 'Desni na dnu', 'Dolgi levi s štirimi temeni', 'Spust v dolino',
    'Levi po spustu', 'Desni na zadnjo ravnino', 'Desni pregib', 'Levi na koncu ravnine', 'Desni v šikani', 'Levi na ciljno ravnino', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 16 named places in their order round the lap (the drop into the first left ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: left into Turn 1, at the top, the double left, after the drop, at the end of the back straight and onto the main straight; right in the dip, the tight one, at the bottom, onto the back straight, the kink and the chicane\'s',
    cs.length === 12 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let t8 = 0, k8 = 0, l8 = 1e9; for (let d = 2150; d <= 2800; d += T.ds) { t8 += kAt(d) * T.ds; k8 = Math.max(k8, Math.abs(kAt(d))); } for (let d = 2240; d <= 2720; d += T.ds) l8 = Math.min(l8, kAt(d));
  check('Turn 8: the long left, 180-240° from 2.15 to 2.8 km, nowhere tighter than a 70 m radius, left all the way from its first apex to its last (no straight bits: radius under 600 m)',
    t8 * 180 / Math.PI > 180 && t8 * 180 / Math.PI < 240 && 1 / k8 >= 70 && l8 > 1 / 600, `${Math.round(t8 * 180 / Math.PI)}°, tightest radius ${(1 / k8).toFixed(0)} m, widest between the apexes ${(1 / l8).toFixed(0)} m`);
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 14 m radius (Turn 4); the legs of the lap at least 40 m apart', 1 / kmax >= 14 && legs >= 40, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 14 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 14 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: 35-45 m from the lowest (Turn 9 at the foot of the long drop, 3.1-3.4 km after the start line) to the highest (Turn 3 on
// the hill, 0.9-1.1 km); the steepest grade 8.5-10.5 % down the drop (2.85-3.15 km); the main straight level (the pits and the stands on
// their terrace: under 1 % from Turn 14 to the brakes of Turn 1)
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0, iG = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } if (Math.abs(T.grade[i]) > g) { g = Math.abs(T.grade[i]); iG = i; } }
  const dLo = dS(iLo * T.ds), dHi = dS(iHi * T.ds), dG = dS(iG * T.ds);
  let gm = 0; for (let d = -380; d <= 120; d += T.ds) gm = Math.max(gm, Math.abs(T.grade[T.idx(T.startS + d)]));
  check('heights: 35-45 m from the lowest (Turn 9, 3.1-3.4 km after the start line) to the highest (Turn 3, 0.9-1.1 km), the steepest grade 8.5-10.5 % down the drop (2.85-3.15 km), the main straight under 1 %',
    hi - lo > 35 && hi - lo < 45 && dLo > 3100 && dLo < 3400 && dHi > 900 && dHi < 1100 && g > 0.085 && g < 0.105 && T.grade[iG] < 0 && dG > 2850 && dG < 3150 && gm < 0.01,
    `${(hi - lo).toFixed(1)} m, lowest at ${Math.round(dLo)} m, highest at ${Math.round(dHi)} m, steepest ${(g * 100).toFixed(1)} % at ${Math.round(dG)} m, the main straight ${(gm * 100).toFixed(2)} %`);
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
// 5. the scenery data (tools/tuzla/build.py): terrain and land cover round the track, the eight grandstands (named after the places round
// it: the main one and the one outside Turn 1 roofed), the buildings, the service roads (OSM) outside the barriers; only place names
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const roofed = def.stands.filter(s => s[4]).map(s => s[7]).join();
  check('scenery: terrain and land cover 300 m and more round the whole track; 8 grandstands (TUZLA, AKFIRAT, ANADOLU, İSTANBUL, MARMARA, KOCAELİ, TÜRKİYE, ORHANLI), TUZLA and AKFIRAT roofed; 3 or more buildings',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.map(s => s[7]).join() === 'TUZLA,AKFIRAT,ANADOLU,İSTANBUL,MARMARA,KOCAELİ,TÜRKİYE,ORHANLI' && roofed === 'TUZLA,AKFIRAT' && sk.bld.length / 6 >= 3,
    `${sk.bld.length / 6} buildings, roofed ${roofed}`);
  let nr = 0, np = 0, inb = 0, short = 0; for (let k = 0; k < sk.svc.length;) { const m = sk.svc[k]; nr++; if (m < 2) short++;
    for (let q = 0; q < m; q++) { const qq = near(sk.svc[k + 1 + q * 2], sk.svc[k + 2 + q * 2]); np++; if (Math.abs(qq.lat) < (qq.lat > 0 ? T.br[qq.i] : T.bl[qq.i])) inb++; } k += 1 + m * 2; }
  check('scenery: 10 or more service roads (OSM), each of 2 points or more, their points outside the barriers (at most 2 % where they meet the run-offs)', nr >= 10 && !short && inb / np <= 0.02, `${nr} roads, ${np} points, ${inb} inside the barriers`);
  const words = JSON.stringify([def.name, def.desc, def.en, def.names, def.stands.map(s => s[7])]);
  check('names: only places and plain descriptions (no name of the circuit, its races or sponsors)', !/park|otodrom|formula|grand prix|\bgp\b|intercity/i.test(words));
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
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 3.5-5.5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 210 && d.win < 330, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 10-25 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.1 && w.win / d.win < 1.25, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
