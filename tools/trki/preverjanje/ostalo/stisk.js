// Independent check of 'predmeti-ograja-stisk' and 'predmeti-drog-cez-ograjo': a prop standing at the barrier, the car into it 20 deg to the barrier
// (Spa / Bathurst straight). Direct: the speed lost inside Race.stepProps; against the same run without the prop
'use strict';
const L = require('./lib.js'), { C, DT, KMH } = L;
const f = (x, d) => x.toFixed(d == null ? 1 : d);
function run(tid, kind, kmh, deg, withProp) {
  const T = L.track(tid), S = L.straight(T, 0.3), race = L.mkRace(T, 'rally'), P = race.player, a = deg * Math.PI / 180;
  L.put(P, T, S.i, 0, kmh / KMH, a);
  const hx = Math.cos(P.h), hz = Math.sin(P.h);
  race.setProps([{ kind, x: P.x, z: P.z, yaw: 0, col: 0, i: S.i }], null); const K = race.props[0].K; race.setProps([], null);
  // along the car's path: where a prop of radius rh stands 0.15 m off the barrier line
  let px = P.x, pz = P.z, q = {}, hint = S.i, found = false;
  for (let u = 0; u < 80; u += 0.05) { const x = P.x + hx * u, z = P.z + hz * u; q = T.query(x, z, hint, q); hint = q.i; const lim = (q.d > 0 ? q.br : q.bl); if (lim - Math.abs(q.d) <= K.rh + 0.15) { px = x; pz = z; found = true; break; } }
  if (!found) return null;
  const back = P.circles[P.circles.length - 1] + P.rad + K.rh + 4;   // the car put 4 m before touching it, on the same line
  P.x = P.px = px - hx * back; P.z = P.pz = pz - hz * back; P.q = T.query(P.x, P.z, hint, P.q); P.sPrev = P.q.s; P.dist = P.q.s - T.startS;
  if (withProp) race.setProps([{ kind, x: px, z: pz, yaw: P.h, col: 0, i: hint }], null);
  const H = L.hook(race, P), n = Math.round(3 / DT), v = new Float64Array(n + 1); let first = 0, firstWall = 0, over = 0, jump = 0, wallSteps = 0;
  const b = withProp ? race.props[0] : null;
  for (let k = 1; k <= n; k++) { const bx = b ? b.x : 0, bz = b ? b.z : 0, bvx = b ? b.vx : 0, bvz = b ? b.vz : 0;
    L.step(race); v[k] = L.sp(P); if (H.propN && !first) first = k; if (P.hitWall > 0) { wallSteps++; if (!firstWall) firstWall = k; }
    if (b && !b.dead) { const qq = T.query(b.x, b.z, b.qi, {}); over = Math.max(over, Math.abs(qq.d) + b.K.rh - (qq.d > 0 ? qq.br : qq.bl)); if (!b.sleep) jump = Math.max(jump, Math.hypot(b.x - bx, b.z - bz) - (Math.hypot(bvx, bvz) + Math.hypot(b.vx, b.vz)) * 0.5 * DT - 0.02); } }
  return { v, first, firstWall, n: H.propN, lossProp: H.prop * KMH, wallSteps, over, jump };
}
for (const tid of ['spa', 'bathurst']) for (const kind of (process.argv[2] ? process.argv[2].split(',') : ['cone', 'tyre', 'bale', 'barrel', 'mlamp', 'lamp'])) for (const kmh of [120, 200]) {
  const A = run(tid, kind, kmh, 20, true), B = run(tid, kind, kmh, 20, false); if (!A || !B) { console.log(tid, kind, 'ni mesta'); continue; }
  const k1 = Math.min(A.v.length - 1, (A.first || A.firstWall) + 120); let vminA = 1e9, vminB = 1e9, rel = 1e9; for (let k = 1; k < A.v.length; k++) { vminA = Math.min(vminA, A.v[k]); vminB = Math.min(vminB, B.v[k]); rel = Math.min(rel, A.v[k] / Math.max(0.01, B.v[k])); }
  console.log(`${tid} ${kind} ${kmh} km/h 20°: n ${A.n}, izguba v stepProps ${f(A.lossProp, 1)} km/h, 1 s po stiku ${f(A.v[k1] * KMH, 0)} proti ${f(B.v[k1] * KMH, 0)} km/h brez predmeta (razlika ${f((B.v[k1] - A.v[k1]) * KMH, 0)}), vmin ${f(vminA * KMH, 0)} proti ${f(vminB * KMH, 0)} km/h, najmanj ${f(rel * 100, 0)} % kontrole, koraki zidu ${A.wallSteps}/${B.wallSteps}, čez ograjo ${f(Math.max(0, A.over), 2)} m, skok ${f(Math.max(0, A.jump), 2)} m`);
}
