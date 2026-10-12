// Bathurst, Australia: the circuit on the public roads round the hill above the town (6.2 km, anticlockwise, 172 m of height
// difference, up to 16 % on the climb), the walls close to the road on the climb and over the top of the hill, the asphalt run-offs, and
// the pit lane on the LEFT of the main straight (def.pit[0] < 0: Core.Track.pitAt gives sd -1 and measures its offsets towards that side). The player
// crashes, is sent in for repairs on the autopilot and stops in the box on the left; an AI car in for tyres keeps to the lane on the left;
// a whole race with pits and fuel: every car finishes.
//   node tests/bathurst.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded, SETUPS, makeRace, stepRace } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'bathurst'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d > T.len / 2 ? d - T.len : d; };

// 1. the track
let lo = 1e9, hi = -1e9, gmax = 0; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); gmax = Math.max(gmax, Math.abs(T.grade[i])); }
check('track: a circuit named after the place, ~6.2 km, 165-180 m of height difference, the climb up to ~16 %', def.name === 'Bathurst, Avstralija' && !def.open && T.len > 6150 && T.len < 6250 && hi - lo > 165 && hi - lo < 180 && gmax > 0.13 && gmax < 0.17,
  `${def.name}, ${Math.round(T.len)} m, ${(hi - lo).toFixed(1)} m, grade ${(gmax * 100).toFixed(1)} %`);
let left = 0; for (let i = 0; i < T.N; i++) left += T.k[i];
check('track: anticlockwise (it turns left in all: Turn 1 a left at the end of the main straight)', left < 0 && T.k[T.idx(T.startS + 264)] < 0, `sum of curvature ${left.toFixed(2)}`);
const iTop = T.idx(T.startS + 2800);
check('track: the walls 1.5 m past the road over the top of the hill', Math.abs(T.bl[iTop] - T.w - 1.5) < 0.2 && Math.abs(T.br[iTop] - T.w - 1.5) < 0.2, `left ${(T.bl[iTop] - T.w).toFixed(2)} m, right ${(T.br[iTop] - T.w).toFixed(2)} m`);

// 2. the pit lane on the left of the main straight
const p0 = T.pitAt(T.startS + 0), pIn = T.pitAt(T.startS - 214), pOut = T.pitAt(T.startS + 229);
check('pit lane: on the left (sd -1), behind the left wall along the straight, open to the road where it leaves and joins',
  p0 && p0.sd === -1 && !p0.gap && Math.abs(p0.o - 15) < 0.01 && Math.abs(p0.br - T.bl[T.idx(T.startS)]) < 0.01 && pIn && pIn.gap && pOut && pOut.gap && !T.pitAt(T.startS + 300) && !T.pitAt(T.startS - 300),
  `centre ${p0 && p0.o.toFixed(1)} m, wall ${p0 && p0.wall.toFixed(1)} m`);

// 3. the player crashes and is sent in for repairs on the autopilot (golden's crash set-up): in the lane on the left, stopped in the
// player's box, repaired, out again
{
  const S = SETUPS.crash, r = makeRace(C, 'bathurst', S.opts), P = r.player, N = Math.round(S.seconds(T) / DT);
  let inPit = false, sideOk = true, stopD = null, repaired = false;
  for (let k = 0; k < N; k++) {
    stepRace(C, r, k, S.drive);
    if (P.inPit) { inPit = true; if (P.q.d > -8) sideOk = false; }
    if (P.pitState === 'repair' && stopD == null) stopD = dS(P.q.s);
    if (P.pitState === 'done') repaired = true;
  }
  check('pit stop: the player drives into the lane on the left (always left of the road), stops at its box (~-60 m) and is repaired', inPit && sideOk && stopD != null && Math.abs(stopD - def.pit[3]) < 4 && repaired,
    `in the lane ${inPit}, always left ${sideOk}, stopped at ${stopD == null ? '-' : stopD.toFixed(1)} m, repaired ${repaired}`);
}

// 4. a whole race with fuel (each AI car in once, the lane on the left), every car at the finish
{
  const orig = Math.random;
  try {
    Math.random = seeded(7);
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, fuel: true, length: 'long' });
    r.start();
    const P = r.player, stops = new Map(); let t = 0, k = 0, right = 0;
    while (t < T.len * 3 / 10 + 240 && r.cars.some(c => !c.finished)) {
      Math.random = seeded(9000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT;
      for (const c of r.cars) { if (c.pitState === 'repair' && !stops.get(c)) stops.set(c, true); if (c.inPit && c.q.d > -8) right++; if (c.isPlayer && (c.stuckT > 3 || c.wrongT > 3)) r.rescue(c); }
    }
    const fin = r.cars.filter(c => c.finished).length;
    check('race with fuel: every car finishes; the cars that stop for fuel stop in the lane on the left', fin === r.cars.length && right === 0,
      `${fin}/${r.cars.length} finished, ${stops.size} stopped, ${right} steps in the lane right of the road`);
  } finally { Math.random = orig; }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
