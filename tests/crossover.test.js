// A crossing on two levels (Suzuka's figure of eight: the back straight on a bridge over the link from Degner to the Hairpin), Core
// only: the track finds the crossing (and no other track has one), narrows the barriers to the bridge's parapets and the underpass's
// walls, the two roads' corridors do not cut into each other there; cars and loose parts on the bridge and under it do not touch; a
// car keeps to its own level when it drives across, hits the parapet, is rescued or loses a panel there; a whole race never snaps a
// car from one level to the other.
//   node tests/crossover.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
Math.random = seeded(31);

// 1. the crossing: only Suzuka has one, at the real bridge, the back straight ~8 m over the lower road
const others = C.TRACKS.filter(d => d.id !== 'suzuka').map(d => [d.id, new C.Track(d).cross.length]).filter(([, k]) => k);
check('no other track has a crossing', !others.length, others.map(([id, k]) => id + ': ' + k).join(', '));
const T = new C.Track(C.TRACKS.find(d => d.id === 'suzuka')), X = T.cross[0], ds = T.ds, sLo = X ? X.lo * ds : 0, sUp = X ? X.up * ds : 0;
const dLo = ((sLo - T.startS) % T.len + T.len) % T.len, dUp = ((sUp - T.startS) % T.len + T.len) % T.len;
check('Suzuka: one crossing, the lower road after Degner, the bridge on the back straight before 130R', T.cross.length === 1 && dLo > 2250 && dLo < 2400 && dUp > 4600 && dUp < 4760 && Math.hypot(X.x + 883, X.z + 69) < 8,
  X ? `lower road ${dLo.toFixed(0)} m, bridge ${dUp.toFixed(0)} m after the start line, at (${X.x.toFixed(1)}, ${X.z.toFixed(1)})` : 'none');
check('the bridge 7.5-9 m over the lower road, the roads crossing at ~60 deg', X && X.dy > 7.5 && X.dy < 9 && X.sin > 0.8 && X.sin < 0.92,
  X ? `height gap ${X.dy.toFixed(2)} m, sin ${X.sin.toFixed(3)}` : '');
{ const iu = Math.round(X.up), il = Math.round(X.lo), wu = T.wa[iu], wl = T.wa[il];   // (from the asphalt's edge there: its own half width)
  check('parapets on the bridge 3 m from the road, the underpass walls 3.4 m', Math.abs(T.bl[iu] - wu - 3) < 0.05 && Math.abs(T.br[iu] - wu - 3) < 0.05 && Math.abs(T.bl[il] - wl - 3.4) < 0.05 && Math.abs(T.br[il] - wl - 3.4) < 0.05,
    `bridge ${(T.bl[iu] - wu).toFixed(2)} / ${(T.br[iu] - wu).toFixed(2)} m, underpass ${(T.bl[il] - wl).toFixed(2)} / ${(T.br[il] - wl).toFixed(2)} m`);
  // (the old rule would have pinched both roads' barriers to the minimum wherever the other road passes within 80 m)
  let wide = 0; for (let d = 60; d <= 90; d += 2) { const a = T.idx(sLo + d), b = T.idx(sLo - d); if (Math.min(T.bl[a] - T.wa[a], T.br[a] - T.wa[a], T.bl[b] - T.wa[b], T.br[b] - T.wa[b]) > 3.4 + 0.5) wide++; }
  check('away from the bridge the lower road has its normal run-off again', wide >= 12, `${wide} of 16 samples 60-90 m either side wider than the walls`); }

// 2. two cars at the very same spot, one on the bridge, one under it, both driving on: they never touch
const place = (r, c, s, v) => { const i = T.idx(s); c.place(T.px[i], T.pz[i], T.hd[i]); c.y = c.py = T.hy[i]; c.q = T.query(c.x, c.z, i, {}); c.sPrev = c.q.s; c.dist = s - T.startS; c.vx = Math.cos(c.h) * v; c.vz = Math.sin(c.h) * v; };
let r = new C.Race(T, { numAI: 1, playerGrid: 1, laps: 2, phys: 'cs', playerModel: C.MODELS[4], seed: 5, difficulty: 1 });
let P = r.player, A = r.cars.find(c => c !== P);
place(r, P, sUp, 30); place(r, A, sLo, 30); r.start();
let touch = 0, minGap = 1e9, yP = [1e9, -1e9], yA = [1e9, -1e9];
for (let k = 0; k < 2 / DT; k++) {
  C.aiControl(P, r, DT); r.step(DT);
  if (P.hitCar || A.hitCar) touch++; minGap = Math.min(minGap, Math.hypot(P.x - A.x, P.z - A.z));
  yP = [Math.min(yP[0], P.y), Math.max(yP[1], P.y)]; yA = [Math.min(yA[0], A.y), Math.max(yA[1], A.y)];
}
check('a car on the bridge and one under it do not touch (though they pass through the same spot)', touch === 0 && yP[0] > yA[1] + 6,
  `${touch} contacts, closest ${minGap.toFixed(2)} m apart, bridge ${yP[0].toFixed(1)}-${yP[1].toFixed(1)} m, below ${yA[0].toFixed(1)}-${yA[1].toFixed(1)} m`);

// 3. full throttle and full lock into the parapet on the bridge: the car bounces off it and stays on the bridge
r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, phys: 'cs', playerModel: C.MODELS[0], seed: 5 });
P = r.player; place(r, P, sUp - 40, 32); r.start();
let hit = 0, yMin = 1e9, dMax = 0;
for (let k = 0; k < 3 / DT; k++) { P.inThr = 1; P.inBrk = 0; P.inSteer = k * DT > 0.4 ? 1 : 0; P.digitalSteer = true; r.step(DT); hit = Math.max(hit, P.hitWall); if (Math.abs(P.q.s - sUp) < 30) { yMin = Math.min(yMin, P.y); dMax = Math.max(dMax, Math.abs(P.q.d)); } }
check('into the parapet on the bridge: the car hits it and stays up on the bridge', hit > 3 && yMin > T.hy[Math.round(X.lo)] + 6 && dMax < T.wa[Math.round(X.up)] + 3.2,
  `impact ${hit.toFixed(1)} m/s, lowest ${yMin.toFixed(2)} m over the bridge (the road below ${T.hy[Math.round(X.lo)].toFixed(2)} m), ${dMax.toFixed(2)} m off the centre line`);

// 4. rescued right at the crossing: back on its own level
r = new C.Race(T, { numAI: 1, playerGrid: 1, laps: 2, phys: 'cs', playerModel: C.MODELS[1], seed: 5 });
P = r.player; A = r.cars.find(c => c !== P); place(r, P, sUp, 0); place(r, A, sLo, 0); r.start();
r.rescue(P); r.rescue(A); r.step(DT);
check('rescued at the crossing: the car on the bridge stays on it, the one below stays below', Math.abs(P.q.s - sUp) < 12 && Math.abs(A.q.s - sLo) < 12 && P.y > A.y + 6,
  `bridge car at ${P.q.s.toFixed(0)} m (y ${P.y.toFixed(1)}), lower car at ${A.q.s.toFixed(0)} m (y ${A.y.toFixed(1)})`);

// 5. a panel lost on the bridge lands on the bridge
r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, phys: 'cs', playerModel: C.MODELS[0], seed: 5, damage: 2 });
P = r.player; place(r, P, sUp, 20); r.start();
r.spawnDebris(P, 'bumperR'); const deb = r.debris[r.debris.length - 1];
for (let k = 0; k < 2 / DT; k++) { P.inThr = 0; P.inBrk = 1; r.step(DT); }
check('a panel lost on the bridge lands on the bridge (not on the road below)', deb && Math.abs(deb.y - T.elevAt(deb.q.s).y) < 0.5 && deb.y > T.hy[Math.round(X.lo)] + 6,
  deb ? `the bumper at ${deb.y.toFixed(2)} m, the bridge ${T.elevAt(sUp).y.toFixed(2)} m, the road below ${T.hy[Math.round(X.lo)].toFixed(2)} m` : 'no debris');

// 6. a whole race (13 cars): nobody's road height ever jumps from one level to the other
for (const phys of ['cs']) {
  Math.random = seeded(7);
  r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys, seed: 11, difficulty: 1 });
  r.start();
  const prev = new Map(); let jumps = 0, maxJ = 0, under = 0, over = 0, t = 0;
  while (t < 420 && r.cars.some(c => !c.finished)) {
    C.aiControl(r.player, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) { const p = prev.get(c); if (p !== undefined && Math.abs(c.roadY - p) > 0.8) { jumps++; maxJ = Math.max(maxJ, Math.abs(c.roadY - p)); } prev.set(c, c.roadY);
      if (Math.abs(c.q.s - sLo) < 2) under++; if (Math.abs(c.q.s - sUp) < 2) over++; }
  }
  check(`a whole race (${phys}): every car drives under and over the bridge, nobody jumps levels, everybody finishes`, jumps === 0 && under > 0 && over > 0 && r.cars.every(c => c.finished),
    `${jumps} jumps (largest ${maxJ.toFixed(2)} m), ${under} / ${over} steps under / on the bridge, ${r.cars.filter(c => c.finished).length}/${r.cars.length} finished in ${t.toFixed(0)} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
