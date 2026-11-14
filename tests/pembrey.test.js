// Pembrey, Wales: the circuit on the old airfield by the village of Pembrey on Carmarthen Bay (2.3 km, clockwise; docs/proge/pembrey.md).
// The layout at its real length, clockwise, flat; its corners by plain descriptions in their order round the lap, each turning its way;
// the heights (within 4 m all round); the pits on the right of the finish straight past the start line; the run-offs (wider than 3 m past
// the asphalt along most of the lap); the scenery data (terrain, land cover, the grandstands, the buildings and the marshals' huts, the
// hills on the horizon); a whole AI race in the dry and in the rain.
//   node tests/pembrey.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'pembrey'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };

// 1. the track: its name (a place and its country), a closed circuit of 6 laps, 2.3 km within 3 % (realKm 2.3), clockwise, not a test
// track nor one waiting for a choice; at least 280 degrees of turning a kilometre (the game's smoothed line: about 311)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Pembrey, Wales" (English the same), a closed circuit, 6 laps, 2.3 km within 3 % (realKm 2.3), clockwise, not a test track, at least 280 °/km of turning',
    def.name === 'Pembrey, Wales' && def.en.name === 'Pembrey, Wales' && !T.open && def.laps === 6 && Math.abs(T.len / 2300 - 1) < 0.03 && def.realKm === 2.3 && area < 0 && !def.test && !def.pending && perKm > 280,
    `${T.len.toFixed(1)} m (${((T.len / 2300 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms, aircraft or the circuit), in their order round the lap from the start
// line, each turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the tightest radius on the centre
// line (the north hairpin), the nearest legs of the lap apart
{
  const want = { 'Severna lasnica': [-1, 120], 'Hitri desni': [-1, 50], 'Dolgi levi': [1, 50], 'Levi pri depoju': [1, 40], 'Desni na vzhodu': [-1, 45], 'Vzhodna lasnica': [-1, 90],
    'Desni ob gozdu': [-1, 25], 'Dolgi desni': [-1, 40] };
  const order = ['Severna lasnica', 'Hitri desni', 'Dolgi levi', 'Levi pri depoju', 'Desni na vzhodu', 'Vzhodna lasnica', 'Dolga ravnina', 'Desni ob gozdu', 'Dolgi desni', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 10 named places in their order round the lap (the north hairpin ... the finish straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right at the north hairpin, the fast right, the east right, the east hairpin, the right by the woods and the long right; left at the long left and the left by the paddock',
    cs.length === 8 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 10 m radius (the north hairpin the tightest); the legs of the lap at least 30 m apart', 1 / kmax >= 10 && legs >= 30, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 10 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 10 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: an old airfield by the sea, flat as a table: within 4 m all round, the steepest grade under 3 %
{
  let lo = 1e9, hi = -1e9, g = 0; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i])); }
  check('heights: within 4 m all round, the steepest grade under 3 %', hi - lo < 4 && g < 0.03, `${(hi - lo).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 4. the pits: the lane on the right of the finish straight from before the start line to after it, the straight no tighter than a 250 m
// radius along the boxes, the 13 crews' boxes in the lane, the pit wall along it; the start line on the finish straight's sign side; the
// run-offs: the barriers more than 3 m past the asphalt along more than 80 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the right of the finish straight past the start line, the straight no tighter than a 250 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall along it',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 250 && dfs > T.len - 200 && nBox === 13 && def.pitRow[0] >= P[1] + P[4] && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 80 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.8 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/pembrey/build.py): terrain and land cover round the track, the grandstands (named after the village and the
// country in Welsh), the buildings and the marshals' huts (OSM); the horizon (def.far: rings of the highest ground round the circuit, the
// hill above the village to the east, 120 m and higher 3-6 km away)
{
  const sk = def.sk, b7 = sk.bld, F = def.far, bin = Buffer.from(F.b64, 'base64'), H = (k, a) => F.lo + bin[k * F.na + a] * F.step;
  const inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  let huts = 0; for (let k = 6; k < b7.length; k += 7) if (b7[k] === 4) huts++;
  check('scenery: terrain and land cover 300 m and more round the whole track; 2 grandstands (PEMBREY, CYMRU); 6 or more buildings, 3 or more of them the marshals\' huts',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.length === 2 && def.stands.map(s => s[7]).join() === 'PEMBREY,CYMRU' && b7.length % 7 === 0 && b7.length / 7 >= 6 && huts >= 3, `${b7.length / 7} buildings, ${huts} huts`);
  let east = 0; for (let k = 0; k < F.r.length; k++) if (F.r[k] >= 3000 && F.r[k] <= 6000) for (let a = 0; a < F.na; a++) { const az = a / F.na * 360; if (az >= 60 && az <= 120) east = Math.max(east, H(k, a)); }
  check('horizon: 10 rings of 180 directions out to 11.5 km, the hill to the east of the village 120 m and higher 3-6 km away',
    F.na === 180 && F.r.length === 10 && bin.length === F.na * F.r.length && F.r[F.r.length - 1] === 11500 && east >= 120, `the east ${east} m`);
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
