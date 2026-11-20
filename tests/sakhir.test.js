// Sakhir, Bahrajn: the circuit in the desert of the south of the island of Bahrain (5.41 km, clockwise; docs/proge/sakhir.md).
// The layout at its real length, clockwise; its corners by plain descriptions in their order round the lap, each turning its way, the
// hairpin of Turn 1 the tightest, the tight left of Turn 10 evened out (OSM's few nodes made it tighter than the hairpin:
// tools/sakhir/build.py, smooth_bend); the heights (the desert's low hills: Turn 4 and the top of the climb to Turn 13 the highest, the
// main straight and the valley of Turn 8 the lowest, about 15 m apart); the pits on the right of the main straight; the wide run-offs; the
// scenery data (terrain, land cover, the eight grandstands named after the places of the island, the pit building, the tower, the
// buildings, the service roads, the floodlight masts, the palms, the ponds; no names of the circuit, its stands or sponsors); a whole AI
// race in the dry and in the rain.
//   node tests/sakhir.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'sakhir'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };
const kAt = (d) => -T.k[T.idx(T.startS + d)];   // (Track.k > 0: a right-hander; here + left)
const hAt = (d) => T.hy[T.idx(T.startS + d)];
const past = (x, z) => { const q = near(x, z); return Math.abs(q.lat) - (q.lat > 0 ? T.br[q.i] : T.bl[q.i]); };   // metres past the barrier on its side
const corners = (x, z, L, W, deg) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2]); };
const boxPast = (x, z, L, W, deg) => Math.min(...corners(x, z, L, W, deg).map(([cx, cz]) => past(cx, cz)));

// 1. the track: its name (a place and its country), a closed circuit of 2 laps, 5.41 km within 3 % (realKm 5.412), clockwise, not a test
// track nor one waiting for a choice; at least 230 degrees of turning a kilometre (the game's smoothed line: about 264)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Sakhir, Bahrajn" (English "Sakhir, Bahrain"), a closed circuit, 2 laps, 5.41 km within 3 % (realKm 5.412), clockwise, not a test track, at least 230 °/km of turning',
    def.name === 'Sakhir, Bahrajn' && def.en.name === 'Sakhir, Bahrain' && !T.open && def.laps === 2 && Math.abs(T.len / 5412 - 1) < 0.03 && def.realKm === 5.412 && area < 0 && !def.test && !def.pending && perKm > 230,
    `${T.len.toFixed(1)} m (${((T.len / 5412 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the hairpin of Turn 1 the tightest (12-14 m on
// the centre line), the tight left of Turn 10 no tighter than 14 m (evened out: smooth_bend), the nearest legs of the lap apart; the 15
// corners' apexes (def.turns) each on the road, in their order
{
  const want = { 'Desna lasnica': [-1, 110], 'Levi za lasnico': [1, 50], 'Hitri desni pregib': [-1, 20], 'Desni na vrhu': [-1, 90], 'Hitri levi': [1, 15], 'Desni v esih': [-1, 60],
    'Levi v dolino': [1, 45], 'Lasnica v dolini': [-1, 120], 'Dolgi levi': [1, 40], 'Ostri levi': [1, 105], 'Dolgi levi pod klancem': [1, 75], 'Hitri desni': [-1, 25],
    'Desni na vrhu klanca': [-1, 75], 'Desni na koncu ravnine': [-1, 75], 'Zadnji desni': [-1, 20] };
  const order = ['Desna lasnica', 'Levi za lasnico', 'Hitri desni pregib', 'Desni na vrhu', 'Hitri levi', 'Desni v esih', 'Levi v dolino', 'Lasnica v dolini', 'Dolgi levi', 'Ostri levi',
    'Dolgi levi pod klancem', 'Hitri desni', 'Desni na vrhu klanca', 'Desni na koncu ravnine', 'Zadnji desni', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 16 named places in their order round the lap (the right hairpin ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right into the hairpins, at the tops, in the esses, the kinks and the last two; left after the hairpin, the fast one, down into the valley, the long and the tight one and under the climb',
    cs.length === 15 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  const tight = (a, b) => { let k = 0; for (let d = a; d <= b; d += T.ds) k = Math.max(k, Math.abs(kAt(d))); return 1 / k; };
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  const r1 = tight(450, 650), r10 = tight(2450, 2650);
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: the hairpin of Turn 1 the tightest bend (12-14 m radius on the centre line), the tight left of Turn 10 no tighter than 14 m; the legs of the lap at least 40 m apart',
    1 / kmax >= 12 && r1 < 14 && Math.abs(r1 - 1 / kmax) < 0.01 && r10 >= 14 && legs >= 40, `tightest radius ${(1 / kmax).toFixed(1)} m, Turn 1 ${r1.toFixed(1)} m, Turn 10 ${r10.toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 15 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 15 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: 13-18 m from the lowest (the main straight) to the highest (Turn 4 on the hill, 1.25-1.45 km after the start line); the
// top of the climb to Turn 13 (3.7-4.0 km) within 1.5 m of it, the valley of Turn 8 (1.95-2.3 km) within 2 m of the lowest; the steepest
// grade 4-5.5 % down the esses (1.8-2.0 km), the climb to Turn 13 3.5-5 % (3.4-3.7 km); the main straight level (under 1 % from before
// the brakes of Turn 15 to after the start line)
{
  let lo = 1e9, hi = -1e9, iHi = 0, g = 0, iG = 0; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } if (Math.abs(T.grade[i]) > g) { g = Math.abs(T.grade[i]); iG = i; } }
  const dHi = dS(iHi * T.ds), dG = dS(iG * T.ds);
  let h13 = -1e9, h8 = 1e9, up = 0, dUp = 0; for (let d = 3700; d <= 4000; d += T.ds) h13 = Math.max(h13, hAt(d)); for (let d = 1950; d <= 2300; d += T.ds) h8 = Math.min(h8, hAt(d));
  for (let d = 0; d < T.len; d += T.ds) { const gr = T.grade[T.idx(T.startS + d)]; if (gr > up) { up = gr; dUp = d; } }
  let gm = 0; for (let d = -380; d <= 120; d += T.ds) gm = Math.max(gm, Math.abs(T.grade[T.idx(T.startS + d)]));
  check('heights: 13-18 m from the lowest (the main straight) to the highest (Turn 4, 1.25-1.45 km after the start line), the top of the climb to Turn 13 within 1.5 m of it, the valley of Turn 8 within 2 m of the lowest',
    hi - lo > 13 && hi - lo < 18 && dHi > 1250 && dHi < 1450 && hi - h13 < 1.5 && h8 - lo < 2 && hAt(0) - lo < 1,
    `${(hi - lo).toFixed(1)} m, highest at ${Math.round(dHi)} m, Turn 13 ${(hi - h13).toFixed(1)} m lower, Turn 8 ${(h8 - lo).toFixed(1)} m above the lowest, the start line ${(hAt(0) - lo).toFixed(1)} m`);
  check('heights: the steepest grade 4-5.5 % down the esses (1.8-2.0 km), the climb to Turn 13 3.5-5 % (3.4-3.7 km), the main straight under 1 %',
    g > 0.04 && g < 0.055 && T.grade[iG] < 0 && dG > 1800 && dG < 2000 && up > 0.035 && up < 0.05 && dUp > 3400 && dUp < 3700 && gm < 0.01,
    `steepest ${(g * 100).toFixed(1)} % at ${Math.round(dG)} m, steepest climb ${(up * 100).toFixed(1)} % at ${Math.round(dUp)} m, the main straight ${(gm * 100).toFixed(2)} %`);
}
// 4. the pits: the lane on the right of the main straight from before the start line to after it, the straight no tighter than a 300 m
// radius along the boxes, the 13 crews' boxes in the lane, the pit wall on the right along it; the start line on the main straight's sign
// side; the run-offs: the barriers more than 3 m past the asphalt along more than 90 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the right of the main straight past the start line, the straight no tighter than a 300 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall on the right along it',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 300 && dfs > T.len - 400 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 90 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.9 && min >= 2.4, `${(wide / all * 100).toFixed(1)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/sakhir/build.py): terrain and land cover round the track; the eight grandstands (OSM outlines, named after
// the places of the island), all under their tent roofs, behind the barriers, the main one on the left of the main straight across from the
// pits; the pit building behind the boxes and the tower in the paddock on the right; the buildings, the service roads, the circuit's other
// layouts with the drag strip, the floodlight masts, the palms and the ponds (OSM); only place names
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const S = sk.stands, sp = S.map(s => boxPast(s[0], s[1], s[2], s[3], s[4])), main = near(S[0][0], S[0][1]);
  check('scenery: terrain and land cover 300 m and more round the whole track; 8 grandstands (SAKHIR, AWALI, ZALLAQ, RIFFA, MANAMA, ISA TOWN, HAMAD TOWN, MUHARRAQ), all roofed, behind the barriers, SAKHIR on the left of the main straight with the deepest roof',
    inGrid(def.dem) && inGrid(def.lc) && S.map(s => s[8]).join() === 'SAKHIR,AWALI,ZALLAQ,RIFFA,MANAMA,ISA TOWN,HAMAD TOWN,MUHARRAQ' && S.every(s => s[7] > 0) && sp.every(p => p > -0.1)
      && main.lat < 0 && main.d < 100 && S[0][7] === Math.max(...S.map(s => s[7])),
    S.map((s, k) => `${s[8]} ${sp[k].toFixed(1)} m`).join(', '));
  const pb = sk.pitb, tw = sk.tower, pbq = near(pb[0], pb[1]), twq = near(tw[0], tw[1]);
  let bOut = 0; for (let k = 0; k < sk.bld.length; k += 6) if (boxPast(sk.bld[k], sk.bld[k + 1], sk.bld[k + 2], sk.bld[k + 3], sk.bld[k + 4]) >= 1) bOut++;
  check('scenery: the pit building behind the boxes on the right of the main straight, the tower in the paddock behind it, 30 or more buildings outside the barriers',
    pbq.lat > 0 && boxPast(pb[0], pb[1], pb[2], pb[3], pb[4]) > 10 && twq.lat > 0 && past(tw[0], tw[1]) - tw[2] > 10 && bOut >= 30,
    `pit building ${boxPast(pb[0], pb[1], pb[2], pb[3], pb[4]).toFixed(1)} m past the barrier, tower ${(past(tw[0], tw[1]) - tw[2]).toFixed(1)} m, ${bOut} of ${sk.bld.length / 6} buildings outside`);
  let nr = 0, np = 0, inb = 0, short = 0; for (let k = 0; k < sk.svc.length;) { const m = sk.svc[k]; nr++; if (m < 2) short++;
    for (let q = 0; q < m; q++) { if (past(sk.svc[k + 1 + q * 2], sk.svc[k + 2 + q * 2]) < 0) inb++; np++; } k += 1 + m * 2; }
  let na = 0, drag = 0; for (let k = 0; k < sk.alt.length;) { const m = sk.alt[k]; na++; if (m < 0) drag++; k += 1 + Math.abs(m) * 2; }
  check('scenery: 10 or more service roads (OSM), each of 2 points or more, at most 15 % of their points inside the barriers (where the game\'s run-offs are wider: the world leaves those bits out); the other layouts with the drag strip',
    nr >= 10 && !short && inb / np <= 0.15 && na >= 5 && drag >= 1, `${nr} roads, ${np} points, ${inb} inside the barriers; ${na} ways of the other layouts, ${drag} of the drag strip`);
  check('scenery: 100 or more floodlight masts, 200 or more palms, 3 ponds (OSM)', sk.mast.length / 2 >= 100 && sk.trees.length / 2 >= 200 && sk.lakes.length === 3,
    `${sk.mast.length / 2} masts, ${sk.trees.length / 2} palms, ${sk.lakes.length} ponds`);
  const words = JSON.stringify([def.name, def.desc, def.en, def.names, S.map(s => s[8])]);
  check('names: only places and plain descriptions (no name of the circuit, its stands, races or sponsors)', !/formula|grand prix|\bgp\b|batelco|gulf air|international|university|victory|first turn|tower/i.test(words));
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
