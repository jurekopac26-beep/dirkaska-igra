// Independent check of 'predmeti-tezki-prelahki' and 'predmeti-skozi-avto' on Spa's straight (Race.step): street furniture hit dead centre;
// the loss inside Race.stepProps, the steps the prop's centre spends inside the car's body box, its largest one-step move, how far it is pushed
'use strict';
const L = require('./lib.js'), { C, DT, KMH } = L;
const f = (x, d) => x.toFixed(d == null ? 1 : d);
function run(kind, kmh) {
  const T = L.track('spa'), S = L.straight(T, 0.4), race = L.mkRace(T, 'rally'), P = race.player;
  L.put(P, T, S.i, 0, kmh / KMH, 0);
  const hx = Math.cos(P.h), hz = Math.sin(P.h), front = P.circles[P.circles.length - 1] + P.rad;
  race.setProps([{ kind, x: P.x + hx * (front + 3), z: P.z + hz * (front + 3), yaw: P.h, col: 0, i: S.i }], null);
  const b = race.props[0], K = b.K, H = L.hook(race, P); const x0 = b.x, z0 = b.z, d0 = P.dmg || 0;
  let inside = 0, jump = 0, vHit = 0, vProp = 0, jumpIn = 0;
  for (let k = 0; k < 5 / DT; k++) {
    P.inThr = 0; P.inSteer = 0; P.inBrk = 0; const vb = L.sp(P), bx = b.x, bz = b.z, wasIn = (() => { const dx = b.x - P.x, dz = b.z - P.z, ch = Math.cos(P.h), sh = Math.sin(P.h); return Math.abs(dx * ch + dz * sh) < P.m.len / 2 && Math.abs(-dx * sh + dz * ch) < P.m.wid / 2; })();
    L.step(race); if (H.propN === 1 && !vHit) vHit = vb;
    const dx = b.x - P.x, dz = b.z - P.z, ch = Math.cos(P.h), sh = Math.sin(P.h), lx = dx * ch + dz * sh, lz = -dx * sh + dz * ch;
    if (!b.dead && Math.abs(lx) < P.m.len / 2 && Math.abs(lz) < P.m.wid / 2) inside++;
    const mv = Math.hypot(b.x - bx, b.z - bz); if (mv > jump) { jump = mv; jumpIn = wasIn ? 1 : 0; } vProp = Math.max(vProp, Math.hypot(b.vx, b.vz));
  }
  return { kind, m: K.m, kmh, n: H.propN, pct: vHit ? H.prop / vHit * 100 : 0, exp: 1.35 * K.m / (P.m.mass + K.m) * 100, inside, jump, jumpIn, vdt: kmh / KMH * DT, path: Math.hypot(b.x - x0, b.z - z0), vProp: vProp * KMH, dmg: ((P.dmg || 0) - d0) * 100, pm: P.m.mass * H.prop / Math.max(1e-9, K.m * vProp) };
}
for (const kind of (process.argv[2] || 'hydrant,bin,mailbox,barrel,meter,cabinet,tlight,lamp,tlpole,shelter').split(',')) for (const kmh of [15, 30, 60, 120, 200]) {
  let r; try { r = run(kind, kmh); } catch (e) { console.log(kind, 'napaka', e.message); break; }
  console.log(`${r.kind} ${r.m} kg ${kmh} km/h: stikov ${r.n}, izguba ${f(r.pct, 2)} % (pric. prost ${f(r.exp, 1)} %), predmet max ${f(r.vProp, 0)} km/h, gib. kol. avto/predmet ${f(r.pm, 2)}, koraki sredisca v obrisu avta ${r.inside}, najvecji premik v koraku ${f(r.jump, 2)} m (v dt = ${f(r.vdt, 2)} m; iz avta: ${r.jumpIn}), odrinjen ${f(r.path)} m, skoda ${f(r.dmg)} %`);
}
