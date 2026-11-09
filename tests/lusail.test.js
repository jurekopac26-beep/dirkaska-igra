// Lusail, Katar: the circuit in the flat coastal desert north of Doha by the new town of Lusail (5.41 km, clockwise; docs/proge/lusail.md).
// The layout at its real length, clockwise; its corners by plain descriptions in their order round the lap, each turning its way (the
// left hairpin of Turn 6 the tightest); the heights (all but level: about 4 m from the lowest round Turns 4-5 to the highest before the
// main straight, nowhere steeper than 2 %; the main straight under 1 %); the pits on the right of the main straight; the wide run-offs; the
// scenery data (terrain, land cover, the three grandstands named after places, the paddock building behind the pits, the buildings, the
// service roads and the palms of OSM; no names of the circuit); a whole AI race in the dry and in the rain.
//   node tests/lusail.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'lusail'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };

// 1. the track: its name (a place and its country), a closed circuit of 2 laps, 5.42 km within 3 % (realKm 5.419), clockwise, not a test
// track nor one waiting for a choice; at least 250 degrees of turning a kilometre (the game's smoothed line: about 285)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Lusail, Katar" (English "Lusail, Qatar"), a closed circuit, 2 laps, 5.42 km within 3 % (realKm 5.419), clockwise, not a test track, at least 250 °/km of turning',
    def.name === 'Lusail, Katar' && def.en.name === 'Lusail, Qatar' && !T.open && def.laps === 2 && Math.abs(T.len / 5419 - 1) < 0.03 && def.realKm === 5.419 && area < 0 && !def.test && !def.pending && perKm > 250,
    `${T.len.toFixed(1)} m (${((T.len / 5419 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place (the kinks and the long left a little: their
// turning is longer than 100 m); 16 corners, 10 right and 6 left; the tightest radius on the centre line (the hairpin of Turn 6), the
// nearest legs of the lap apart; the 16 corners' apexes on the road in their order
{
  const want = { 'Desni na koncu ravnine': [-1, 75], 'Levi proti severu': [1, 70], 'Hitri desni pregib': [-1, 30], 'Dvojni desni': [-1, 55], 'Desni proti jugu': [-1, 55], 'Lasnica': [1, 110],
    'Dolgi desni': [-1, 80], 'Levi pregib': [1, 12], 'Desni proti zahodu': [-1, 45], 'Ostri levi': [1, 80], 'Dolgi levi': [1, 10], 'Hitri desni': [-1, 35], 'Desni na vzhodu': [-1, 40],
    'Tretji hitri desni': [-1, 45], 'Levi pred zadnjim': [1, 50], 'Zadnji desni': [-1, 70] };
  const order = ['Desni na koncu ravnine', 'Levi proti severu', 'Hitri desni pregib', 'Dvojni desni', 'Desni proti jugu', 'Lasnica', 'Dolgi desni', 'Levi pregib', 'Desni proti zahodu',
    'Ostri levi', 'Dolgi levi', 'Hitri desni', 'Desni na vzhodu', 'Tretji hitri desni', 'Levi pred zadnjim', 'Zadnji desni', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 17 named places in their order round the lap (the right at the end of the straight ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]), right = cs.filter(c => want[c.nm][0] < 0).length;
  check('corners: each of the 16 turns its way (10 right, 6 left): right at the end of the straight, the fast kink, the double right and on to the south, the long one, to the west, the three fast ones and the last; left to the north, the hairpin, the kink, the tight one, the long one and the one before the last',
    cs.length === 16 && right === 10 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0, iK = 0; for (let i = 0; i < T.N; i++) if (Math.abs(T.k[i]) > kmax) { kmax = Math.abs(T.k[i]); iK = i; }
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 25 m radius (the tightest the hairpin, 1.85-2.0 km); the legs of the lap at least 40 m apart', 1 / kmax >= 25 && dS(iK * T.ds) > 1850 && dS(iK * T.ds) < 2000 && legs >= 40,
    `tightest radius ${(1 / kmax).toFixed(1)} m at ${Math.round(dS(iK * T.ds))} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 16 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 16 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: the flat coastal desert, 3-6 m from the lowest (round the double right of Turns 4-5, 1.2-1.6 km after the start line) to
// the highest (out of the last corner, 4.6-5.0 km); nowhere steeper than 2 %; the main straight under 1 % (from out of the last corner to the
// brakes of Turn 1)
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0, iG = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } if (Math.abs(T.grade[i]) > g) { g = Math.abs(T.grade[i]); iG = i; } }
  const dLo = dS(iLo * T.ds), dHi = dS(iHi * T.ds);
  let gm = 0; for (let d = -560; d <= 380; d += T.ds) gm = Math.max(gm, Math.abs(T.grade[T.idx(T.startS + d)]));
  check('heights: 3-6 m from the lowest (round Turns 4-5, 1.2-1.6 km after the start line) to the highest (out of the last corner, 4.6-5.0 km), nowhere steeper than 2 %, the main straight under 1 %',
    hi - lo > 3 && hi - lo < 6 && dLo > 1200 && dLo < 1600 && dHi > 4600 && dHi < 5000 && g < 0.02 && gm < 0.01,
    `${(hi - lo).toFixed(1)} m, lowest at ${Math.round(dLo)} m, highest at ${Math.round(dHi)} m, steepest ${(g * 100).toFixed(1)} % at ${Math.round(dS(iG * T.ds))} m, the main straight ${(gm * 100).toFixed(2)} %`);
}
// 4. the pits: the lane on the right of the main straight from before the start line to after it, the straight no tighter than a 150 m
// radius along the boxes (the last corner's exit at the lane's start), the 13 crews' boxes in the lane, the pit wall on the right along
// it; the start line on the main straight's sign side; the run-offs: the barriers more than 3 m past the asphalt along more than 90 % of
// the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the right of the main straight past the start line, the straight no tighter than a 150 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall on the right along it',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 150 && dfs > T.len - 400 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 90 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.9 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/lusail/build.py): terrain and land cover round the track; the three grandstands named after places (LUSAIL,
// the main one on the left of the main straight, roofed; DOHA after it; AL DAAYEN on the right at the north end), the buildings of OSM, the
// paddock building behind the pits (on their side, 40-60 m out, along the boxes), the service roads (OSM), most of their points outside
// the barriers (the world leaves out the bits where they meet the run-offs), the palms (OSM's lone trees and rows), none inside the
// barriers; only place names
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const roofed = def.stands.filter(s => s[4]).map(s => s[7]).join(), main = def.stands.find(s => s[7] === 'LUSAIL');
  check('scenery: terrain and land cover 300 m and more round the whole track; 3 grandstands (LUSAIL, DOHA, AL DAAYEN), LUSAIL roofed on the left of the main straight; 10 buildings or more',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.map(s => s[7]).join() === 'LUSAIL,DOHA,AL DAAYEN' && roofed === 'LUSAIL' && main[2] === -1 && main[0] < 0 && main[1] > 0 && sk.bld.length / 6 >= 10,
    `${sk.bld.length / 6} buildings, roofed ${roofed}`);
  const pb = sk.pitb, q = near(pb[0], pb[1]), P = def.pit, dq = q.d > T.len / 2 ? q.d - T.len : q.d;
  check('scenery: the paddock building behind the pits: on their side (the right), 40-60 m from the centre line, by the boxes, 300 m long or more',
    pb.length === 6 && q.lat > 40 && q.lat < 60 && dq > P[1] && dq < P[2] && pb[2] >= 300, `${Math.round(dq)} m, ${q.lat.toFixed(0)} m to the right, ${pb[2]} m long`);
  let nr = 0, np = 0, inb = 0, short = 0; for (let k = 0; k < sk.svc.length;) { const m = sk.svc[k]; nr++; if (m < 2) short++;
    for (let q = 0; q < m; q++) { const qq = near(sk.svc[k + 1 + q * 2], sk.svc[k + 2 + q * 2]); np++; if (Math.abs(qq.lat) < (qq.lat > 0 ? T.br[qq.i] : T.bl[qq.i])) inb++; } k += 1 + m * 2; }
  check('scenery: 30 or more service roads (OSM), each of 2 points or more, at least 80 % of their points outside the barriers', nr >= 30 && !short && inb / np <= 0.2, `${nr} roads, ${np} points, ${inb} inside the barriers`);
  let nt = 0, tin = 0; for (let k = 0; k + 1 < sk.tr.length; k += 2) { const qq = near(sk.tr[k], sk.tr[k + 1]); nt++; if (Math.abs(qq.lat) < (qq.lat > 0 ? T.br[qq.i] : T.bl[qq.i]) + 3) tin++; }
  check('scenery: 500 or more palms and lone trees (OSM), none inside the barriers nor within 3 m past them', nt >= 500 && !tin, `${nt} trees, ${tin} inside`);
  const words = JSON.stringify([def.name, def.desc, def.en, def.names, def.stands.map(s => s[7]), def.say]);
  check('names: only places and plain descriptions (no name of the circuit, its owners, races or sponsors)', !/losail|international|formula|grand prix|\bgp\b|superbike|motogp|airways|federation/i.test(words));
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
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 3.5-5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 210 && d.win < 300, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 3-15 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
