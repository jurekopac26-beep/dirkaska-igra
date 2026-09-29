// Suzuka in Core. The crossing on two levels (the figure of eight: the back straight on a bridge over the link from Degner to the
// Hairpin): the track finds the crossing (and no other track has one), narrows the barriers to the bridge's parapets and the underpass's
// walls, the two roads' corridors do not cut into each other there; cars and loose parts on the bridge and under it do not touch; a
// car keeps to its own level when it drives across, hits the parapet, is rescued or loses a panel there; a whole race never snaps a
// car from one level to the other. The pit lane: in after the Casio Triangle, out before the First Curve, a damaged car stops at its
// box, is repaired and rejoins (both physics). DRS: one zone on the start / finish straight, used by the cars that follow closely.
//   node tests/suzuka.test.js
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
{ const iu = Math.round(X.up), il = Math.round(X.lo);
  check('parapets on the bridge 3 m from the road, the underpass walls 3.4 m', Math.abs(T.bl[iu] - T.w - 3) < 0.05 && Math.abs(T.br[iu] - T.w - 3) < 0.05 && Math.abs(T.bl[il] - T.w - 3.4) < 0.05 && Math.abs(T.br[il] - T.w - 3.4) < 0.05,
    `bridge ${(T.bl[iu] - T.w).toFixed(2)} / ${(T.br[iu] - T.w).toFixed(2)} m, underpass ${(T.bl[il] - T.w).toFixed(2)} / ${(T.br[il] - T.w).toFixed(2)} m`);
  // (the old rule would have pinched both roads' barriers to the minimum wherever the other road passes within 80 m)
  let wide = 0; for (let d = 60; d <= 90; d += 2) { const a = T.idx(sLo + d), b = T.idx(sLo - d); if (Math.min(T.bl[a], T.br[a], T.bl[b], T.br[b]) > T.w + 3.4 + 0.5) wide++; }
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
check('into the parapet on the bridge: the car hits it and stays up on the bridge', hit > 3 && yMin > T.hy[Math.round(X.lo)] + 6 && dMax < T.w + 3.2,
  `impact ${hit.toFixed(1)} m/s, lowest ${yMin.toFixed(2)} m over the bridge (the road below ${T.hy[Math.round(X.lo)].toFixed(2)} m), ${dMax.toFixed(2)} m off the centre line`);

// 4. rescued right at the crossing: back on its own level
r = new C.Race(T, { numAI: 1, playerGrid: 1, laps: 2, phys: 'arcade', playerModel: C.MODELS[1], seed: 5 });
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

// 6. a whole race (13 cars, both physics): nobody's road height ever jumps from one level to the other
for (const phys of ['cs', 'arcade']) {
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

// 7. the pit lane: on the right from where the Casio Triangle's gravel ends to before the First Curve, beside the pit wall in between
const L = T.len, dd = (s) => { let d = s - T.startS; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; }, dz = (v) => (v > L / 2 ? v - L : v), PD = T.def.pit;   // (dd: a position s as metres from the start line; dz: a DRS line, already after the start line)
{ const t16 = dd(T.nearestIdx(...T.def.turns[15]) * ds), t1 = dd(T.nearestIdx(...T.def.turns[0]) * ds);
  let wallOk = 0, wallN = 0, grav = 0; for (let d = PD[1]; d <= PD[2]; d += 2) { const s = T.startS + d, p = T.pitAt(s), i = T.idx(s); if (T.gravR[i]) grav++; if (p && !p.gap) { wallN++; if (p.o - 3.5 >= p.wall + 0.5) wallOk++; } }
  check('the pit lane: in after the Casio Triangle and its gravel, out before the First Curve, the pit wall between it and the track', PD[1] > t16 + 120 && PD[2] < t1 - 150 && grav === 0 && wallN > 250 && wallOk === wallN,
    `lane ${PD[1]} .. ${PD[2]} m (Turn 16 at ${t16.toFixed(0)} m, Turn 1 at ${t1.toFixed(0)} m), ${wallN * 2} m of it behind the pit wall, gravel under it: ${grav}`); }
for (const phys of ['cs', 'arcade']) {
  Math.random = seeded(21);
  r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys, seed: 9, difficulty: 1, damage: 2 });
  r.start(); P = r.player; P.dmg = 0.6; P.lost = { bumperF: 1 };
  const ev = []; let t = 0, stopAt = null, hit = 0;
  while (t < 420 && !P.finished) {
    const d = dd(P.q.s);
    if (P.lap === 1 && !P.repairN && !P.inPit && d > -900 && d < PD[1] - 20) P.pitWant = true;   // (as a player would: turn in for the pits before the way in, at the end of lap 1)
    if (P.repairN && !P.inPit) P.pitWant = false;
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.pitEv) { ev.push(P.pitEv); if (P.pitEv === 'repair') stopAt = dd(P.q.s); P.pitEv = null; }
    if (P.inPit) hit = Math.max(hit, P.hitWall || 0);
  }
  const seq = ev.join('>');
  check(`pit stop (${phys}): in, stopped at its box, repaired, out again, finished, no knock in the lane`, /enter>box>repair>done>exit/.test(seq) && P.repairN === 1 && P.dmg === 0 && stopAt !== null && Math.abs(stopAt - PD[3]) < 4 && P.finished && hit < 2,
    `${seq}, stopped ${stopAt === null ? '-' : stopAt.toFixed(1)} m (its box at ${PD[3]} m), damage ${P.dmg}, finished ${!!P.finished} in ${t.toFixed(0)} s, hardest knock in the lane ${hit.toFixed(2)} m/s`);
}

// 8. DRS: one zone, detection before the Casio Triangle, open from the end of the Final Curve to 60 m before Turn 1; in a race the cars that
// cross the detection line within 1 s of the car in front open the flap (from lap 2 on), only in the zone
{ const Z = T.drs || [], z = Z[0] || {}, t16 = dd(T.nearestIdx(...T.def.turns[15]) * ds), t1 = dd(T.nearestIdx(...T.def.turns[0]) * ds);
  check('DRS: one zone on the start / finish straight', Z.length === 1 && Math.abs(dz(z.det) - (t16 - 50)) < 4 && dz(z.act) > -420 && dz(z.act) < -340 && Math.abs(dz(z.end) - (t1 - 60)) < 4,
    Z.map(q => `detection ${dz(q.det).toFixed(0)} m, open ${dz(q.act).toFixed(0)} m, closed ${dz(q.end).toFixed(0)} m`).join(' | ')); }
for (const phys of ['cs', 'arcade']) {
  Math.random = seeded(7);
  r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys, seed: 11, difficulty: 1 });
  r.start(); const z = T.drs[0], prev = new Map(); let t = 0, opens = 0, early = 0, outside = 0, longest = 0; const since = new Map();
  while (t < 420 && r.cars.some(c => !c.finished)) {
    C.aiControl(r.player, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) { const o = !!c.drs, d = dd(c.q.s);
      if (o && !prev.get(c)) { opens++; if (c.lap < 2) early++; since.set(c, t); }
      if (o && !(d >= dz(z.act) - 3 || d <= dz(z.end) + 3)) outside++;
      if (!o && prev.get(c)) longest = Math.max(longest, t - since.get(c));
      prev.set(c, o); }
  }
  check(`DRS in a race (${phys}): followers open the flap on the last lap, only in the zone, and keep it open down the straight`, opens >= 3 && early === 0 && outside === 0 && longest > 4,
    `${opens} openings (${early} on lap 1), ${outside} steps open outside the zone, longest ${longest.toFixed(1)} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
