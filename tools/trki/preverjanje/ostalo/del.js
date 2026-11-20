// Independent check of 'predmeti-del-rinjenje' / 'predmeti-del-lezi': the speed a car loses in the loose parts' knocks, measured
// directly (the car's speed after Race._tlStep against its speed when Race.stepProps begins: only debrisHit is in between off the pit road)
'use strict';
const L = require('./lib.js'), { C, SIM, DT, KMH } = L;
const f = (x, d) => x.toFixed(d == null ? 1 : d);
function ctl(tid, part, state, kmh, id, donorId) {
  const T = L.track(tid), S = L.straight(T, 0.4), race = L.mkRace(T, id || 'rally'), P = race.player, v = kmh / KMH;
  L.put(P, T, S.i, 0, v, 0);
  const hx = Math.cos(P.h), hz = Math.sin(P.h), front = P.circles[P.circles.length - 1] + P.rad;
  let d = null;
  if (state === 'svoj') C.detachPart(P, part);
  else {
    let donor = P; if (donorId && donorId !== P.m.id) { donor = new C.Car(L.model(donorId), { phys: 'cs' }); donor.place(P.x, P.z, P.h); donor.y = P.y; }
    race.spawnDebris(donor, part); d = race.debris[race.debris.length - 1]; d.by = null; d.byT = 0;   // (a part in the car's way, not its own: DEB.own)
    const ahead = front + d.r * 0.7 + 1.0; d.x = P.x + hx * ahead; d.z = P.z + hz * ahead; d.q = null;
    d.y = T.yAt(T.query(d.x, d.z, S.i, {})) + d.h * 0.5 + 0.02; d.wx = d.wy = d.wz = 0; d.rx = d.rz = 0; d.vy = 0;
    if (state === 'lezi') { d.vx = d.vz = 0; d.rest = true; d.ground = true; }
    else if (state === 'drsi') { d.vx = hx * 6; d.vz = hz * 6; d.rest = false; d.ground = true; }
    else if (state === 'tik') { d.vx = hx * (v - 1); d.vz = hz * (v - 1); d.rest = false; d.ground = true; }
  }
  const H = L.hook(race, P); let vHit = 0, x0 = d ? d.x : 0, z0 = d ? d.z : 0, m = d ? d.m : 0;
  for (let k = 0; k < 6 / DT; k++) { const vb = L.sp(P); L.step(race); if (!d && race.debris.length) { d = race.debris[0]; m = d.m; } if (H.debN >= 1 && !vHit) vHit = vb; }
  return { part, m, state, kmh, n: H.debN, loss: H.deb * KMH, pct: vHit ? H.deb / vHit * 100 : 0, pot: d ? Math.hypot(d.x - x0, d.z - z0) : 0, M: P.m.mass };
}
function race(tid, setup, secs, t0, t1) {
  Math.random = SIM.seeded(7);
  const S = SIM.SETUPS[setup], r = SIM.makeRace(C, tid, (C2, tt, t) => S.opts(C2, tt, 'cs', t)), n = Math.round(secs / DT);
  // every car's speed after _tlStep and at the start of stepProps
  const cars = r.cars, vT = new Float64Array(cars.length), A = cars.map(() => ({ n: 0, loss: 0, v0: 0, k0: 0, k1: 0, wall: 0, all: 0, runs: [] }));
  const tl0 = r._tlStep.bind(r), sp0 = r.stepProps.bind(r); let K = 0;
  r._tlStep = function (dt, lv) { tl0(dt, lv); for (let j = 0; j < cars.length; j++) vT[j] = L.sp(cars[j]); };
  r.stepProps = function (dt) { for (let j = 0; j < cars.length; j++) { const c = cars[j]; if (c.inPit || c.pitG) continue; const dv = vT[j] - L.sp(c); if (dv > 1e-9) { const a = A[j];
    let run = a.runs[a.runs.length - 1]; if (!run || K - run.k1 > 60) { run = { k0: K, k1: K, n: 0, loss: 0, v0: a.vPrev, wall: 0, vEnd: 0 }; a.runs.push(run); } run.k1 = K; run.n++; run.loss += dv; } } sp0(dt); };
  for (let k = 1; k <= n; k++) { K = k; for (let j = 0; j < cars.length; j++) A[j].vPrev = L.sp(cars[j]); for (const c of cars) { c.hitDebris = 0; c.hitWall = 0; }
    SIM.stepRace(C, r, k, S.drive);
    for (let j = 0; j < cars.length; j++) { const run = A[j].runs[A[j].runs.length - 1]; if (run && k >= run.k0 && k - run.k1 <= 0) { run.vEnd = L.sp(cars[j]); if (cars[j].hitWall > 0) run.wall++; } } }
  const out = [];
  cars.forEach((c, j) => { for (const run of A[j].runs) if (run.n >= 3 || run.loss * KMH > 3) out.push({ tid, setup, car: c.isPlayer ? 'igralec' : c.m.id, M: c.m.mass, t0: run.k0 * DT, t1: run.k1 * DT, n: run.n, v0: run.v0 * KMH, vEnd: run.vEnd * KMH, lossDeb: run.loss * KMH, wallSteps: run.wall }); });
  return out;
}
const mode = process.argv[2] || 'ctl';
if (mode === 'ctl') {
  for (const part of ['mirrorL', 'fenderL', 'bumperF', 'hood']) for (const st of ['lezi', 'drsi', 'tik', 'svoj']) { const row = [60, 120, 200].map(kmh => ctl('spa', part, st, kmh));
    console.log(`${part} (m ${row[0].m}) ${st}: n ${row.map(r => r.n).join('/')}, izguba ${row.map(r => f(r.pct, 2)).join('/')} % (${row.map(r => f(r.loss, 1)).join('/')} km/h), premik dela ${row.map(r => f(r.pot, 1)).join('/')} m`); }
  for (const id of ['mravlja', 'kolibri', 'rally', 'titan']) if (L.model(id)) { const a = ctl('spa', 'hood', 'lezi', 120, id, 'rally'), b = ctl('spa', 'hood', 'drsi', 120, id, 'rally'); console.log(`${id} ${a.M} kg, pokrov rally: lezi ${f(a.pct, 2)} % (n ${a.n}), drsi ${f(b.pct, 2)} % (n ${b.n})`); }
} else {
  for (const [tid, setup] of [['spa', 'lm'], ['spa', 'formula'], ['bathurst', 'formula']]) for (const r of race(tid, setup, 60))
    console.log(`${r.tid} ${r.setup} ${r.car} ${r.M} kg: t ${f(r.t0, 2)}-${f(r.t1, 2)} s, korakov z izgubo ob delu ${r.n}, v0 ${f(r.v0, 0)} km/h -> ${f(r.vEnd, 0)} km/h, izguba samo v stikih z deli ${f(r.lossDeb, 1)} km/h, koraki z zidom ${r.wallSteps}`);
}
