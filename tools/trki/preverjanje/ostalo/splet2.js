// Independent check of the online deviations: two phones = two real Races on Spa (opts.remote), each steps only its own car; the friend's car
// is placed by MY OWN interpolation (not the measurer's cut-out netPlace): states every 50 ms, 30 ms on the wire, shown lag ms in the past
// (positions and speeds linear between the two states around now - lag; beyond the newest: on along its speed, 0.25 s at most).
// What a hit costs: against the same run with the other car out of the way (so drag is not counted).
'use strict';
const L = require('./lib.js'), { C, DT, KMH } = L;
const f = (x, d) => x.toFixed(d == null ? 1 : d);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function place(B, c, now, lag) {
  const t = now - lag; while (B.length > 2 && B[1].k <= t) B.shift();
  let a = B[0], b = B[1] && B[1].k > a.k ? B[1] : null; if (b && t >= b.k) { a = b; b = null; }
  const u = b ? Math.min(1, Math.max(0, (t - a.k) / (b.k - a.k))) : 0, ex = !b && t > a.k ? Math.min(0.25, (t - a.k) / 1000) : 0, I = (p) => b ? a[p] + (b[p] - a[p]) * u : a[p];
  c.x = c.px = I('x') + a.vx * ex; c.z = c.pz = I('z') + a.vz * ex; c.y = c.py = I('y'); c.h = c.ph = a.h + (b ? wrap(b.h - a.h) * u : 0) + a.w * ex; c.vx = I('vx'); c.vz = I('vz'); c.w = I('w');
}
const msg = (P, now) => ({ k: now, x: P.x, z: P.z, y: P.y, h: P.h, vx: P.vx, vz: P.vz, w: P.w });
// scene: sA/sB metres along the straight from the spot, dA/dB across, hA/hB heading off the road's, vA/vB km/h
function run(sc, lag, apart, ctl) {
  const T = L.track('spa'), S = L.straight(T, 0.35), i0 = S.i, per = Math.round(1 / T.ds * 1) || 1;
  const mk = (me) => L.mkRace(T, 'rally', lag ? { playerGrid: me, remote: { grid: 3 - me, model: L.model('rally'), id: me === 1 ? 'g1' : 'h' } } : { numAI: 0 });
  const idx = (s) => (i0 + Math.round(s / T.ds) + T.N) % T.N;
  const rA = mk(1), rB = lag ? mk(2) : null, A = rA.player; let B, GA = null, GB = null;
  if (lag) { B = rB.player; GA = rA.remotes[0]; GB = rB.remotes[0]; }
  else { B = new C.Car(L.model('rally'), { id: 2, phys: 'cs' }); rA.cars.push(B); }   // offline: both cars in one race
  const sB = sc.sB + (apart ? 0 : 0), dB = sc.dB + (apart ? 40 : 0);
  L.put(A, T, idx(sc.sA), sc.dA, sc.vA / KMH, sc.hA); L.put(B, T, idx(sB), apart ? sc.dB : sc.dB, sc.vB / KMH, sc.hB);
  // (the control: both real cars where they are, on the road; the ghosts far away and never placed: no contact on either phone)
  const tx = T.tx[i0], tz = T.tz[i0];
  const bufA = [], bufB = [], wire = []; let sendT = -1e9, t1 = null, nA = 0, nB = 0, gap = null, pre = null, end = null, turnA = 0, turnB = 0, ov = 0;
  if (lag) { for (const [buf, c] of [[bufA, B], [bufB, A]]) for (const back of [200, 100, 0]) { const m = msg(c, -back); m.x = c.x - c.vx * back / 1000; m.z = c.z - c.vz * back / 1000; buf.push(m); } place(bufA, GA, 0, lag); place(bufB, GB, 0, lag); }
  if (apart) { for (const g of [GA, GB]) { g.x = g.px = g.x + 1e4; g.vx = g.vz = 0; } }
  const h0A = A.h, h0B = B.h, hist = []; const init = new Map([[A, [A.x, A.z, A.h]], [B, [B.x, B.z, B.h]]]);
  for (let fr = 0; fr < 3.0 * 60; fr++) {
    for (let s = 0; s < 2; s++) {
      const t = (fr * 2 + s + 1) * DT;
      for (const c of [A, B]) { c.inThr = 0; c.inBrk = 0; c.hitCar = 0; let st = 0; if (ctl && t >= 0.4) { const q = init.get(c), h0 = q[2], e = (-Math.sin(h0) * c.x + Math.cos(h0) * c.z) - (-Math.sin(h0) * q[0] + Math.cos(h0) * q[1]), he = wrap(c.h - h0), vt = -Math.sin(h0) * c.vx + Math.cos(h0) * c.vz; st = Math.max(-1, Math.min(1, -(0.35 * e + 2.0 * he + 0.25 * vt / Math.max(5, L.sp(c))))); } c.inSteer = st; }
      const p = { a: A.vx * tx + A.vz * tz, b: B.vx * tx + B.vz * tz };
      rA.step(DT); if (rB) rB.step(DT); else if (apart) { /* B in rA already stepped */ }
      if (A.hitCar > 0) nA++; if (B.hitCar > 0) nB++;
      if ((A.hitCar > 0 || B.hitCar > 0) && t1 == null) { t1 = t; pre = p; gap = Math.hypot(B.x - A.x, B.z - A.z); }
      if (t1 != null) { turnA = Math.max(turnA, Math.abs(wrap(A.h - h0A))); turnB = Math.max(turnB, Math.abs(wrap(B.h - h0B))); }
      hist.push([A.vx * tx + A.vz * tz, B.vx * tx + B.vz * tz, A.h, B.h]);
    }
    if (!lag) continue;
    const now = (fr + 1) * 1000 / 60;
    if (now - sendT >= 50) { sendT = now; wire.push({ at: now + 30, to: 'B', m: msg(A, now) }); wire.push({ at: now + 30, to: 'A', m: msg(B, now) }); }
    while (wire.length && wire[0].at <= now) { const w = wire.shift(); (w.to === 'A' ? bufA : bufB).push(w.m); }
    if (!apart) { place(bufA, GA, now, lag); place(bufB, GB, now, lag); }
  }
  return { t1, nA, nB, gap, pre, hist, turnA: turnA * 180 / Math.PI, turnB: turnB * 180 / Math.PI };
}
const SC = {
  'zadaj 100 v 80': { sA: -12, dA: 0, hA: 0, vA: 100, sB: 0, dB: 0, hB: 0, vB: 80 },
  'zadaj 120 v 60': { sA: -16, dA: 0, hA: 0, vA: 120, sB: 0, dB: 0, hB: 0, vB: 60 },
  'celno 60 + 60': { sA: -10, dA: 0, hA: 0, vA: 60, sB: 10, dB: 0, hB: Math.PI, vB: 60 },
  'bok ob boku 100, 3 deg': { sA: 0, dA: 0, hA: 0, vA: 100, sB: 0.5, dB: 2.15, hB: -0.052, vB: 100 },
};
const nm = 'bok ob boku 100, 3 deg';
for (const lag of [100, 200]) for (const ctl of [false, true]) { const R = run(SC[nm], lag, false, ctl), K = run(SC[nm], lag, true, ctl);
  console.log(`${nm} lag ${lag} krmilnik ${ctl ? 'da (merilcev: drzi zacetno crto vsakega avta od 0,4 s)' : 'ne (brez rok)'}: prvi dotik ${R.t1 == null ? '-' : f(R.t1, 2) + ' s'}, koraki trka A ${R.nA} / B ${R.nB}, zasuk A ${f(R.turnA)} / B ${f(R.turnB)} deg; kontrola brez dotika: zasuk A ${f(K.turnA)} / B ${f(K.turnB)} deg (koraki ${K.nA}/${K.nB}), najvecji odklon smeri v kontroli A ${f(Math.max(...K.hist.map(h => Math.abs(wrap(h[2] - K.hist[0][2])))) * 180 / Math.PI)} / B ${f(Math.max(...K.hist.map(h => Math.abs(wrap(h[3] - K.hist[0][3])))) * 180 / Math.PI)} deg`); }
