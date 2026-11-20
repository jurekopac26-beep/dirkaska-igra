// Independent check of 'predmeti-ponovni-stik': the speed the car loses INSIDE Race.stepProps, summed (no control run), on a real
// track's straight (Spa, Bathurst), the prop at an offset; also with full throttle
'use strict';
const L = require('./lib.js'), { C, DT, KMH } = L;
function run(tid, kind, kmh, off, thr, id, share) {
  const T = L.track(tid), S = L.straight(T, share || 0.4), race = L.mkRace(T, id || 'rally'), P = race.player;
  L.put(P, T, S.i, 0, kmh / KMH, 0);
  const hx = Math.cos(P.h), hz = Math.sin(P.h), front = P.circles[P.circles.length - 1] + P.rad;
  race.setProps([{ kind, x: P.x + hx * (front + 3) - hz * off, z: P.z + hz * (front + 3) + hx * off, yaw: P.h, col: 0, i: S.i }], null);
  const b = race.props[0], K = b.K, H = L.hook(race, P), v0 = L.sp(P);
  let vHit = 0, vProp = 0, hMax = 0, y0 = b.y;
  for (let k = 0; k < 4 / DT; k++) {
    P.inThr = thr ? 1 : 0; P.inSteer = 0; P.inBrk = 0;
    const vb = L.sp(P); L.step(race);
    if (H.propN === 1 && !vHit) { vHit = vb; }
    for (const q of race.props) if (!q.dead && !q.sleep) { vProp = Math.max(vProp, Math.hypot(q.vx, q.vz)); hMax = Math.max(hMax, q.y - y0); }
  }
  return { tid, kind, m: K.m, kmh, off, thr: thr ? 1 : 0, n: H.propN, loss: H.prop * KMH, pct: vHit ? H.prop / vHit * 100 : 0, exp: 1.35 * K.m / (P.m.mass + K.m) * 100, vProp: vProp * KMH, vov: vHit ? vProp / vHit : 0, hMax };
}
const f = (x, d) => x.toFixed(d == null ? 1 : d);
const rows = [];
const mode = process.argv[2] || 'osnovno';
if (mode === 'osnovno') {
  for (const tid of ['spa', 'bathurst']) for (const kind of ['cone', 'tyre', 'crate', 'bale', 'bstack']) for (const kmh of [60, 120, 200]) rows.push(run(tid, kind, kmh, 0, 0));
  for (const kind of ['cone', 'bale']) for (const kmh of [120]) rows.push(run('spa', kind, kmh, 0, 1));
} else if (mode === 'zamik') {
  // an even spread of hits across the car's width: the mean a driver meets (the car's reach to each side: rad + rh)
  for (const kind of ['cone', 'tyre', 'bale', 'bstack']) for (const kmh of [60, 120, 200]) {
    const P0 = L.mkRace(L.track('spa'), 'rally').player, reach = P0.rad + 0.3; let sum = 0, cnt = 0, mx = 0, hit = 0, list = [];
    for (let u = -1.2; u <= 1.2001; u += 0.1) { const r = run('spa', kind, kmh, u, 0); if (r.n) { hit++; sum += r.pct; mx = Math.max(mx, r.pct); } cnt++; list.push(f(r.pct)); }
    console.log(`${kind} ${kmh} km/h, zamik -1,2..1,2 po 0,1 m: zadetih ${hit}/${cnt}, povp. zadetih ${f(sum / Math.max(1, hit), 2)} %, max ${f(mx)} %, prič. ${f(run('spa', kind, kmh, 0, 0).exp, 2)} % | ${list.join(' ')}`);
  }
}
for (const r of rows) console.log(`${r.tid} ${r.kind} ${r.m}kg ${r.kmh}km/h zamik ${r.off} plin ${r.thr}: n=${r.n} izguba v stepProps ${f(r.loss, 2)} km/h = ${f(r.pct, 2)} % (prič. <= ${f(r.exp, 2)} %), predmet max ${f(r.vProp, 0)} km/h (${f(r.vov, 2)} v), dvig ${f(r.hMax, 2)} m`);
