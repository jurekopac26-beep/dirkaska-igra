'use strict';
// avto, ki je že vozil in potem obstoji vzdolž ceste (yaw 0: ovira samo po stuckT) 160 m pred tekmecem: cv 1, 5, 6; jedro po GAME_ROOT
const W = (process.env.TRKI_F2 || '') + '';
const { loadCore } = require(W + '/tests/lib/core.js'); const { seeded } = require(W + '/tests/lib/sim.js');
const C = loadCore(); const DT = 1 / 120, D = 180 / Math.PI;
const test = (tx, fn) => { C.setTest(tx || null); try { return fn(); } finally { C.setTest(null); } };
const tracks = {}, trk = (id) => tracks[id] || (tracks[id] = new C.Track(C.TRACKS.find(x => x.id === id)));
const run = (tx, tid, yawDeg, never) => test(tx, () => { const orig = Math.random; Math.random = seeded(64); try {
  const T = trk(tid), r = new C.Race(T, { numAI: 1, playerGrid: 2, laps: 3, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); r.start();
  const P = r.player, c = r.cars.find(x => x !== P); let on = false, hit = 0, v25 = null, hz0 = 0, hzAt = null, pd = 0, X = 0, Z = 0, Hd = 0, past = false, st = 0, tOn = 0, tHz = null;
  for (let k = 1; k <= 60 / DT && !past; k++) {
    Math.random = seeded(1000 + k);
    if (!on && r.time > 9) { on = true; tOn = r.time; const i = T.idx(c.q.s + 160), d = T.rl[i]; X = T.px[i] + T.nx[i] * d; Z = T.pz[i] + T.nz[i] * d; Hd = T.hd[i] + yawDeg / D; pd = c.dist + 160; P.place(X, Z, Hd); T.query(X, Z, -1, P.q); }
    if (on) { if (!(hit > 0)) { P.x = X; P.z = Z; P.h = Hd; P.vx = P.vz = P.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; P.dist = pd; }
    else { C.aiControl(P, r, DT); if (c.aiHz || P.aiHz) hz0++; }
    c.hitCar = 0; r.step(DT);
    if (on) { P.dist = pd; const gap = pd - c.dist; if (c.aiHz && hzAt == null) { hzAt = gap; tHz = r.time - tOn; st = P.stuckT; }
      if (gap > 0) { if (c.hitCar > hit) hit = c.hitCar; if (v25 == null && gap <= 25) v25 = c.speed; } else past = true; }
  }
  return { v25, hit, hz0, hzAt, tHz, st, past, dmg: c.dmg || 0 };
} finally { Math.random = orig; } });
for (const tid of (process.env.TRACKS || 'spa,cusco').split(',')) for (const yaw of (process.env.YAW || '0').split(',').map(Number)) { const o = [1, 5, 6].map(cv => run({ cv }, tid, yaw));
  console.log(tid, 'yaw', yaw, o.map((q, i) => 'cv' + [1, 5, 6][i] + ' v25 ' + (q.v25 == null ? '-' : q.v25.toFixed(3)) + ' dotik ' + q.hit.toFixed(3) + ' viden ' + (q.hzAt == null ? '-' : q.hzAt.toFixed(3) + ' m po ' + q.tHz.toFixed(3) + ' s stuckT ' + q.st.toFixed(3)) + ' mimo ' + q.past + ' dmg ' + q.dmg.toFixed(4) + ' hz0 ' + q.hz0).join(' | ')); }
