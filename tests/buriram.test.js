// Buriram, Tajska: the circuit among the rice fields of the plateau of north-east Thailand by the town of Buriram (4.54 km, clockwise;
// docs/proge/buriram.md). The layout at its real length, clockwise; its corners by plain descriptions in their order round the lap, each
// turning its way (the hairpin of Turn 3 and the tight right of Turn 12 the tightest); the heights (nearly level: the hairpin the lowest,
// about 12 m under the top of the infield, nowhere steeper than 3 %; the main straight level); the pits on the left of the main straight
// under the main grandstand; the wide run-offs; the scenery data (terrain, land cover, the pond and the wetlands of the infield, the six
// grandstands named after the places round it, the service roads; no names of the circuit); a whole AI race in the dry and in the rain.
//   node tests/buriram.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'buriram'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };

// 1. the track: its name (a place and its country), a closed circuit of 3 laps, 4.54 km within 3 % (realKm 4.554), clockwise, not a test
// track nor one waiting for a choice; at least 200 degrees of turning a kilometre (the game's smoothed line: about 240)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Buriram, Tajska" (English "Buriram, Thailand"), a closed circuit, 3 laps, 4.54 km within 3 % (realKm 4.554), clockwise, not a test track, at least 200 °/km of turning',
    def.name === 'Buriram, Tajska' && def.en.name === 'Buriram, Thailand' && !T.open && def.laps === 3 && Math.abs(T.len / 4554 - 1) < 0.03 && def.realKm === 4.554 && area < 0 && !def.test && !def.pending && perKm > 200,
    `${T.len.toFixed(1)} m (${((T.len / 4554 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place (the left kink of Turn 2 a few degrees); the
// tightest radius on the centre line (Turn 12), the nearest legs of the lap apart; the 12 corners' apexes on the road in their order
{
  const want = { 'Desni na koncu ravnine': [-1, 65], 'Hitri levi pregib': [1, 4], 'Lasnica': [-1, 110], 'Levi pred ribnikom': [1, 40], 'Ostri levi': [1, 95], 'Levi ob ribniku': [1, 55],
    'Desni proti severu': [-1, 55], 'Desni ob mokrišču': [-1, 60], 'Dolgi desni': [-1, 90], 'Levi na vzhodu': [1, 45], 'Desni pregib': [-1, 20], 'Ostri desni': [-1, 100] };
  const order = ['Desni na koncu ravnine', 'Hitri levi pregib', 'Lasnica', 'Ravnina proti jugu', 'Levi pred ribnikom', 'Ostri levi', 'Levi ob ribniku', 'Desni proti severu',
    'Desni ob mokrišču', 'Dolgi desni', 'Levi na vzhodu', 'Desni pregib', 'Ostri desni', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 14 named places in their order round the lap (the right at the end of the straight ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right at the end of the straight, the hairpin, heading north, by the wetland, the long one, the kink and the tight last one; left in the fast kink, before the pond, the tight one, round the pond and on the east side',
    cs.length === 12 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0, iK = 0; for (let i = 0; i < T.N; i++) if (Math.abs(T.k[i]) > kmax) { kmax = Math.abs(T.k[i]); iK = i; }
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 15 m radius (the tightest Turn 12, 4.2-4.3 km); the legs of the lap at least 40 m apart', 1 / kmax >= 15 && dS(iK * T.ds) > 4200 && dS(iK * T.ds) < 4300 && legs >= 40,
    `tightest radius ${(1 / kmax).toFixed(1)} m at ${Math.round(dS(iK * T.ds))} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 12 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 12 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: 9-15 m from the lowest (the hairpin of Turn 3, 1.2-1.45 km after the start line) to the highest (the infield, 1.9-2.4 km);
// nowhere steeper than 3.5 % (the steepest down towards the hairpin, 0.95-1.3 km); the main straight level (the pits and the main
// grandstand: under 1 % from Turn 12 to the brakes of Turn 1)
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0, iG = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } if (Math.abs(T.grade[i]) > g) { g = Math.abs(T.grade[i]); iG = i; } }
  const dLo = dS(iLo * T.ds), dHi = dS(iHi * T.ds), dG = dS(iG * T.ds);
  let gm = 0; for (let d = -260; d <= 220; d += T.ds) gm = Math.max(gm, Math.abs(T.grade[T.idx(T.startS + d)]));
  check('heights: 9-15 m from the lowest (the hairpin, 1.2-1.45 km after the start line) to the highest (the infield, 1.9-2.4 km), nowhere steeper than 3.5 % (the steepest down to the hairpin, 0.95-1.3 km), the main straight under 1 %',
    hi - lo > 9 && hi - lo < 15 && dLo > 1200 && dLo < 1450 && dHi > 1900 && dHi < 2400 && g < 0.035 && T.grade[iG] < 0 && dG > 950 && dG < 1300 && gm < 0.01,
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
// 5. the scenery data (tools/buriram/build.py): terrain and land cover round the track; the pond on the inside of the lefts of Turns 4-6
// (in the pocket they wrap round, outside the lap's loop) and the three wetlands in the infield (inside the loop), all outside the barriers; the six grandstands named after the places round it (the one after
// Turn 1 roofed; the main grandstand over the pits is the world's own), the pits' building, the service roads (OSM), most of their points
// outside the barriers (the world leaves out the bits where they meet the run-offs); only place names
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const roofed = def.stands.filter(s => s[4]).map(s => s[7]).join();
  check('scenery: terrain and land cover 300 m and more round the whole track; 6 grandstands (ISAN, NANG RONG, PHANOM RUNG, SATUEK, KRASANG, KHORAT), ISAN roofed; the pits\' building',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.map(s => s[7]).join() === 'ISAN,NANG RONG,PHANOM RUNG,SATUEK,KRASANG,KHORAT' && roofed === 'ISAN' && sk.bld.length / 6 >= 1,
    `${sk.bld.length / 6} buildings, roofed ${roofed}`);
  const poly = (a, k0) => { const p = []; for (let k = k0; k + 1 < a.length; k += 2) p.push([a[k], a[k + 1]]); return p; };
  const inPoly = (p, x, z) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };
  const outside = (p) => p.every(([x, z]) => { const q = near(x, z); return Math.abs(q.lat) > (q.lat > 0 ? T.br[q.i] : T.bl[q.i]); });
  const mid = (p) => [p.reduce((a, q) => a + q[0], 0) / (p.length || 1), p.reduce((a, q) => a + q[1], 0) / (p.length || 1)];
  const loops = ([cx, cz]) => { let a = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; let d = Math.atan2(T.pz[j] - cz, T.px[j] - cx) - Math.atan2(T.pz[i] - cz, T.px[i] - cx); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; a += d; } return Math.round(Math.abs(a) / (2 * Math.PI)); };   // (1: inside the lap's loop)
  const pond = sk.lakes.length === 1 ? poly(sk.lakes[0], 1) : [], pc = mid(pond), pq = near(pc[0], pc[1]), wet = sk.wet.map(w => poly(w, 0));
  check('scenery: the pond on the inside of the lefts of Turns 4-6 (on their left, 2.2-2.8 km; outside the lap\'s loop), the three wetlands in the infield (inside the loop), all outside the barriers',
    pond.length >= 8 && inPoly(pond, pc[0], pc[1]) && pq.lat < 0 && pq.d > 2200 && pq.d < 2800 && loops(pc) === 0 && outside(pond) && wet.length === 3 && wet.every(w => w.length >= 4 && loops(mid(w)) === 1 && outside(w)),
    `the pond ${pond.length} points, by ${Math.round(pq.d)} m, ${Math.round(-pq.lat)} m left of the centre line; wetlands ${wet.map(w => w.length).join(', ')} points`);
  let nr = 0, np = 0, inb = 0, short = 0; for (let k = 0; k < sk.svc.length;) { const m = sk.svc[k]; nr++; if (m < 2) short++;
    for (let q = 0; q < m; q++) { const qq = near(sk.svc[k + 1 + q * 2], sk.svc[k + 2 + q * 2]); np++; if (Math.abs(qq.lat) < (qq.lat > 0 ? T.br[qq.i] : T.bl[qq.i])) inb++; } k += 1 + m * 2; }
  check('scenery: 20 or more service roads (OSM), each of 2 points or more, at least 80 % of their points outside the barriers', nr >= 20 && !short && inb / np <= 0.2, `${nr} roads, ${np} points, ${inb} inside the barriers`);
  const words = JSON.stringify([def.name, def.desc, def.en, def.names, def.stands.map(s => s[7]), def.say]);
  check('names: only places and plain descriptions (no name of the circuit, its owners, races or sponsors)', !/chang|united|international|arena|formula|grand prix|\bgp\b|superbike|motogp/i.test(words));
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
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 3-5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 180 && d.win < 300, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 3-15 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
