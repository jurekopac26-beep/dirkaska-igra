// p1: oblique hits on a real track through Race.step; inputs: nic / plin (throttle only) / stran (throttle + steer away at once) /
// stran03 (throttle, steer away 0.3 s after the hit: a human) / vanj (throttle + steer INTO the wall)
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
const args = process.argv.slice(2);
const TID = args[0] || 'bathurst', SIDE = +(args[1] || -1), FROM = +(args[2] || 400), TO = +(args[3] || 1250);
const T = L.track(TID), d0 = L.straight(T, SIDE, FROM, TO), i0 = T.idx(T.startS + d0);
const B = SIDE > 0 ? T.br[i0] : T.bl[i0];
console.log(`proga ${TID}, stran ${SIDE}, ${d0} m po startu, ograja ${B.toFixed(2)} m od sredine, pol sirine ${(T.wAt ? T.wAt(i0) : T.w).toFixed(2)} m`);

function run(o) {
  const race = L.mkRace(T, o.id || 'rally', o.phys || 'cs', o.raceOpts), c = race.player, th = o.th / D, v = o.kmh / 3.6;
  const reach = c.m.len / 2 * Math.sin(th) + c.m.wid / 2 * Math.cos(th), gap = o.gap != null ? o.gap : 0.6;
  const dd = SIDE * (B - gap - reach), h = T.hd[i0] + SIDE * th;
  L.put(c, T, T.px[i0] + T.nx[i0] * dd, T.pz[i0] + T.nz[i0] * dd, h, v);
  const rec = []; let k0 = -1; const n = Math.round((o.secs || 7) / DT);
  for (let k = 0; k < n; k++) {
    const t = k0 >= 0 ? (k - k0) * DT : -1;
    c.inThr = o.inp === 'nic' ? 0 : 1; c.inBrk = 0; c.inHand = 0; c.inSteer = 0;
    if (o.inp === 'stran' && k0 >= 0) c.inSteer = -SIDE;
    if (o.inp === 'stran03' && t >= 0.3) c.inSteer = -SIDE;
    if (o.inp === 'vanj') c.inSteer = SIDE;
    if ((o.inp === 'stran' || o.inp === 'stran03') && c.inSteer) { const he = SIDE * wrap(c.h - T.hd[c.q.i]); if (he < -0.12) c.inSteer = 0; }   // (straighten when 7 deg away from the wall)
    const pv = { vx: c.vx, vz: c.vz, w: c.w, h: c.h };
    race.step(DT);
    const i = c.q.i, mx = SIDE * T.nx[i], mz = SIDE * T.nz[i], tx = T.tx[i], tz = T.tz[i];
    const r = { t: 0, hit: c.hitWall, room: L.room(c, T, SIDE), sp: Math.hypot(c.vx, c.vz), vn: c.vx * mx + c.vz * mz, vt: c.vx * tx + c.vz * tz, w: c.w,
      he: SIDE * wrap(c.h - T.hd[i]), slip: wrap(Math.atan2(c.vz, c.vx) - c.h), dmg: c.dmg, psp: Math.hypot(pv.vx, pv.vz), pvn: pv.vx * mx + pv.vz * mz, pvt: pv.vx * tx + pv.vz * tz, xgl: c.xgl || 0 };
    r.touch = r.hit > 0 || r.room < 0.003;
    c.hitWall = 0; c.hitCar = 0; c.fxWall = 0;
    if (r.touch && k0 < 0) k0 = k;
    rec.push(r);
  }
  if (k0 < 0) return { miss: true };
  const a = rec[k0];
  let kL = -1; for (let k = k0, last = k0; k < rec.length; k++) { if (rec[k].touch) last = k; else if (k - last >= 30) { kL = last; break; } }
  const E = rec[kL >= 0 ? kL : rec.length - 1];
  let rav = null; for (let k = k0, runN = 0; k < rec.length; k++) { const r = rec[k], ok = !r.touch && Math.abs(r.w) < 0.052 && (r.sp < 0.5 || Math.abs(r.slip) < 0.052); runN = ok ? runN + 1 : 0; if (runN >= 30) { rav = (k - 29 - k0) * DT; break; } }
  let wPk = 0, tch = 0, hitMax = 0, hits = 0; for (let k = k0; k < rec.length; k++) { wPk = Math.max(wPk, Math.abs(rec[k].w)); if (rec[k].touch) tch++; hitMax = Math.max(hitMax, rec[k].hit); if (rec[k].hit > 2.5) hits++; }
  // nose parallel (within 2 deg) for good
  let par = null; for (let k = rec.length - 1; k >= k0; k--) { if (Math.abs(rec[k].he) > 0.035) { par = k + 1 < rec.length ? (k + 1 - k0) * DT : null; break; } if (k === k0) par = 0; }
  const at = (t) => rec[k0 + Math.round(t / DT)] || null;
  const f = (x, d = 0) => x == null ? '-' : x.toFixed(d);
  return { kot: o.th, kmh: o.kmh, fiz: o.phys || 'cs', vnos: o.inp, v0: f(a.psp * 3.6), kotV: f(Math.atan2(a.pvn, a.pvt) * D, 1), v1: f(a.sp * 3.6), vL: kL >= 0 ? f(E.sp * 3.6) : '-', 'vL/v0': kL >= 0 ? f(E.sp / a.psp, 2) : '-',
    v05: f(at(0.5) && at(0.5).sp * 3.6), v2: f(at(2) && at(2).sp * 3.6), eN1: f(-a.vn / a.pvn, 2), mu1: f((a.pvt - a.vt) / (a.pvn - a.vn), 2),
    izh: kL >= 0 ? f(Math.atan2(-E.vn, E.vt) * D, 1) : '-', noseL: f(E.he * D, 1), wPk: f(wPk * D), drs: (kL >= 0 ? '' : '>') + f(((kL >= 0 ? kL : rec.length - 1) - k0 + 1) * DT, 2), stik: f(tch * DT, 2), rav: f(rav, 2), par: f(par, 2),
    hit: f(hitMax, 1), ud: hits, sk: f(rec[rec.length - 1].dmg * 100), xgl: f(Math.max(...rec.map(r => r.xgl)), 2) };
}
const rows = [];
const want = args[4] || 'vse';
if (want === 'vse' || want === 'matrika') {
  for (const [th, kmh] of [[5, 60], [5, 120], [15, 60], [15, 120], [15, 200], [30, 60], [30, 120], [30, 200], [60, 60], [90, 60], [90, 120]]) for (const inp of ['nic', 'plin', 'stran', 'stran03']) rows.push(run({ th, kmh, inp }));
}
if (want === 'vse' || want === 'nova') {
  for (const [th, kmh] of [[5, 120], [15, 60], [15, 120], [30, 120], [30, 200]]) for (const inp of ['nic', 'plin', 'stran03']) rows.push(run({ th, kmh, inp, phys: 'nova' }));
}
if (want === 'titan') for (const [th, kmh] of [[5, 120], [15, 120], [30, 120]]) for (const inp of ['nic', 'plin', 'stran03']) rows.push(run({ th, kmh, inp, id: 'titan' }));
console.table(rows);
