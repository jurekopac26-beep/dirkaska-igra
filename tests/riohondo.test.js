// Termas de Río Hondo, Argentina: the circuit on the plain of the Gran Chaco by the reservoir (4.81 km, clockwise; docs/proge/riohondo.md).
// The layout at its real length, clockwise; its corners by plain descriptions in their order round the lap, each turning its way, the
// tight right of Turn 7 the tightest, the hairpin at the end of the long straight; the heights (the plain rising gently to the north-east:
// the hairpin the highest, Turns 1-2 by the lake the lowest, about 7 m apart, the long straight climbing to the hairpin); the pits on the
// left of the main straight; the wide run-offs; the scenery data (terrain, land cover, the two grandstands of Turns 1-2, the service
// roads, the lake behind the dam with its far water; no names of the circuit, its stands or sponsors); a whole AI race in the dry and in
// the rain.
//   node tests/riohondo.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'riohondo'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };
const kAt = (d) => -T.k[T.idx(T.startS + d)];   // (Track.k > 0: a right-hander; here + left)
const hAt = (d) => T.hy[T.idx(T.startS + d)];
const past = (x, z) => { const q = near(x, z); return Math.abs(q.lat) - (q.lat > 0 ? T.br[q.i] : T.bl[q.i]); };   // metres past the barrier on its side

// 1. the track: its name (a place and its country), a closed circuit of 2 laps, 4.81 km within 3 % (realKm 4.806), clockwise, not a test
// track nor one waiting for a choice; at least 250 degrees of turning a kilometre (the game's line: about 286)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Termas de Río Hondo, Argentina" (the same in English), a closed circuit, 2 laps, 4.81 km within 3 % (realKm 4.806), clockwise, not a test track, at least 250 °/km of turning',
    def.name === 'Termas de Río Hondo, Argentina' && def.en.name === 'Termas de Río Hondo, Argentina' && !T.open && def.laps === 2 && Math.abs(T.len / 4806 - 1) < 0.03 && def.realKm === 4.806
      && area < 0 && !def.test && !def.pending && perKm > 250,
    `${T.len.toFixed(1)} m (${((T.len / 4806 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line; the 14
// corners' apexes (def.turns) each on the road, in their order, each 0-150 m after its name's place, each turning its way (+1 left, -1
// right) by at least the given angle within 70 m of its apex; the tight right of Turn 7 the tightest bend (22-28 m on the centre line),
// the hairpin at the end of the long straight 150 degrees and more; the nearest legs of the lap apart
{
  const want = [['Desni na koncu ravnine', -1, 65], ['Dolgi desni', -1, 75], ['Ostri levi', 1, 95], ['Desni na dolgo ravnino', -1, 40], ['Lasnica na koncu ravnine', -1, 140],
    ['Hitri levi', 1, 20], ['Ostri desni', -1, 85], ['Desni na vzhodu', -1, 50], ['Levi v notranjosti', 1, 70], ['Hitri desni', -1, 22], ['Dolgi levi', 1, 40],
    ['Desni pregib', -1, 20], ['Desni pred ciljem', -1, 125], ['Levi na ciljno ravnino', 1, 35]];
  const order = ['Desni na koncu ravnine', 'Dolgi desni', 'Ostri levi', 'Desni na dolgo ravnino', 'Dolga ravnina', 'Lasnica na koncu ravnine', 'Hitri levi', 'Ostri desni',
    'Desni na vzhodu', 'Levi v notranjosti', 'Hitri desni', 'Dolgi levi', 'Desni pregib', 'Desni pred ciljem', 'Levi na ciljno ravnino', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -70; d <= 70; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off }; });
  check('corners: the 16 named places in their order round the lap (the right at the end of the straight ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const ap = def.turns.map(([x, z]) => near(x, z)), named = want.map(([nm]) => at.find(c => c.nm === nm));
  check('track: the 14 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap, each 0-150 m after its name',
    def.turns.length === 14 && ap.every((q, k) => q.off < 6 && (k === 0 || q.d > ap[k - 1].d) && q.d - named[k].d >= 0 && q.d - named[k].d <= 150),
    ap.map((q, k) => `${k + 1}: ${Math.round(q.d)} m (+${Math.round(q.d - named[k].d)})`).join(', '));
  const deg = ap.map(q => turn(q.i * T.ds));
  check('corners: each turns its way: right at the end of the straights, in the long double right, at the hairpin, the tight right, in the east, the fast one, the kink and before the finish; left in the tight one, the fast one, in the infield, the long one and onto the main straight',
    deg.every((a, k) => Math.sign(a) === want[k][1] && Math.abs(a) >= want[k][2]), deg.map((a, k) => `${k + 1} ${a > 0 ? 'L' : 'R'} ${Math.abs(Math.round(a))}°`).join(', '));
  const tight = (a, b) => { let k = 0; for (let d = a; d <= b; d += T.ds) k = Math.max(k, Math.abs(kAt(d))); return 1 / k; };
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  const r7 = tight(ap[6].d - 40, ap[6].d + 40), r5 = tight(ap[4].d - 60, ap[4].d + 60);
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: the tight right of Turn 7 the tightest bend (22-28 m radius on the centre line), the hairpin at the end of the long straight 150° and more at a 30-45 m radius; the legs of the lap at least 40 m apart',
    1 / kmax >= 22 && r7 < 28 && Math.abs(r7 - 1 / kmax) < 0.01 && Math.abs(deg[4]) >= 150 && r5 >= 30 && r5 <= 45 && legs >= 40,
    `tightest radius ${(1 / kmax).toFixed(1)} m, Turn 7 ${r7.toFixed(1)} m, the hairpin ${Math.abs(Math.round(deg[4]))}° at ${r5.toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
}
// 3. the heights: 6-9 m from the lowest (Turns 1-2 by the lake, 0.15-0.6 km after the start line) to the highest (the hairpin at the end of
// the long straight, 2.05-2.3 km); the long straight climbing 5 m and more from Turn 4 to the hairpin; the steepest grade 1.5-3 %; the main
// straight level (under 0.5 % from the pit entry to past Turn 1's brakes), the start line within 1 m of the lowest
{
  let lo = 1e9, hi = -1e9, iHi = 0, iLo = 0, g = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const dHi = dS(iHi * T.ds), dLo = dS(iLo * T.ds), climb = hAt(2170) - hAt(1020);
  let gm = 0; for (let d = -200; d <= 240; d += T.ds) gm = Math.max(gm, Math.abs(T.grade[T.idx(T.startS + d)]));
  check('heights: 6-9 m from the lowest (Turns 1-2 by the lake, 0.15-0.6 km after the start line) to the highest (the hairpin, 2.05-2.3 km), the long straight climbing 5 m and more to it',
    hi - lo > 6 && hi - lo < 9 && dHi > 2050 && dHi < 2300 && dLo > 150 && dLo < 600 && climb > 5,
    `${(hi - lo).toFixed(1)} m, highest at ${Math.round(dHi)} m, lowest at ${Math.round(dLo)} m, the long straight ${climb.toFixed(1)} m up`);
  check('heights: the steepest grade 1.5-3 %, the main straight under 0.5 % (from the pit entry to past the start line), the start line within 1 m of the lowest',
    g > 0.015 && g < 0.03 && gm < 0.005 && hAt(0) - lo < 1, `steepest ${(g * 100).toFixed(1)} %, the main straight ${(gm * 100).toFixed(2)} %, the start line ${(hAt(0) - lo).toFixed(1)} m above the lowest`);
}
// 4. the pits: the lane on the left of the main straight from before the start line to after it, the straight no tighter than a 300 m
// radius along the boxes, the 13 crews' boxes in the lane, the pit wall on the left along it; the start line on the main straight's sign
// side; the run-offs: the barriers more than 3 m past the asphalt along more than 90 % of the lap (both sides; the pit wall is the nearest,
// 2.5 m), moved out on the outside of Turns 1-2 by the grandstands
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the left of the main straight past the start line, the straight no tighter than a 300 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall on the left along it',
    !!p0 && p0.t > 0.99 && P[0] < 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 300 && dfs > T.len - 400 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === -1),
    `lane ${P[1]} .. ${P[2]} m, ${-P[0]} m to the left, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  let wideT1 = 1e9; for (let d = 370; d <= 450; d += T.ds) wideT1 = Math.min(wideT1, T.bl[T.idx(T.startS + d)] - T.w);
  check('run-offs: the barriers more than 3 m past the asphalt along more than 90 % of the lap, nowhere nearer than the pit wall (2.5 m), 20 m and more on the outside of Turns 1-2 by the grandstands',
    wide / all > 0.9 && min >= 2.4 && wideT1 >= 20, `${(wide / all * 100).toFixed(1)} % past 3 m, nearest ${min.toFixed(1)} m, the outside of Turns 1-2 ${wideT1.toFixed(1)} m`);
}
// 5. the scenery data (tools/riohondo/build.py): terrain and land cover round the track; the two grandstands (OSM outlines, named after
// places of the province) on the outside of Turns 1-2, behind the barriers there; the service roads (OSM); the lake behind the dam: its
// level 4-7 m below the start line, its near water (16 m cells of the terrain) 300 m and more from the road, its far water (100 m cells)
// round it; the horizon; only place names (the boards in the world's file too)
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const S = def.stands, W = def.wide[0];
  check('scenery: terrain and land cover 300 m and more round the whole track; 2 grandstands (LAS TERMAS, SANTIAGO) on the left (outside) of Turns 1-2, where the barriers are moved out, SANTIAGO roofed',
    inGrid(def.dem) && inGrid(def.lc) && S.map(s => s[7]).join() === 'LAS TERMAS,SANTIAGO' && S.every(s => s[2] === -1 && s[0] >= W[0] && s[1] <= W[1]) && W[2] === -1 && S[1][4] === 1,
    S.map(s => `${s[7]} ${s[0]}-${s[1]} m`).join(', '));
  let nr = 0, np = 0, inb = 0, short = 0; for (let k = 0; k < sk.svc.length;) { const m = sk.svc[k]; nr++; if (m < 2) short++;
    for (let q = 0; q < m; q++) { if (past(sk.svc[k + 1 + q * 2], sk.svc[k + 2 + q * 2]) < 0) inb++; np++; } k += 1 + m * 2; }
  check('scenery: 4 or more service roads (OSM), each of 2 points or more, at most 15 % of their points inside the barriers (where the game\'s run-offs are wider: the world leaves those bits out)',
    nr >= 4 && !short && inb / np <= 0.15, `${nr} roads, ${np} points, ${inb} inside the barriers`);
  const L = sk.lake, cells = (r) => { let c = 0; for (let k = 0; k < r.length; k += 3) c += r[k + 2] - r[k + 1]; return c; };
  let dmin = 1e9; { const [x0, z0, c, r] = L.near; for (let k = 0; k < r.length; k += 3) for (let q = r[k + 1]; q < r[k + 2]; q++) { const x = x0 + (q + 0.5) * c, z = z0 + (r[k] + 0.5) * c, i = T.nearestIdx(x, z); dmin = Math.min(dmin, Math.hypot(T.px[i] - x, T.pz[i] - z)); } }
  check('scenery: the lake behind the dam 4-7 m below the start line, 1000 or more near water cells (16 m) 300 m and more from the road, 1000 or more far ones (100 m); the horizon from the start line\'s height above the sea',
    L.y < -4 && L.y > -7 && L.near[2] === 16 && cells(L.near[3]) >= 1000 && dmin >= 300 && L.far[2] === 100 && cells(L.far[3]) >= 1000 && def.far && def.far.base === 277.4,
    `level ${L.y} m, ${cells(L.near[3])} near cells, nearest ${dmin.toFixed(0)} m, ${cells(L.far[3])} far cells`);
  const wsrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'world-riohondo.js'), 'utf8'), ban = (wsrc.match(/const RH_BAN = \[[\s\S]*?\]\];/) || [''])[0];
  const words = JSON.stringify([def.name, def.desc, def.en, def.names, S.map(s => s[7]), ban]);
  check('names: only places and plain descriptions (no name of the circuit, its stands, races or sponsors), the boards of the world\'s file too',
    ban.includes('RÍO HONDO') && !/aut[oó]dromo|internacional|international|moto ?gp|grand prix|\bgp\b|formula|tc ?2000|turismo carretera|gobierno|provincial|circuito/i.test(words));
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
