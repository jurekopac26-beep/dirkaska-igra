// The flat-plane handling rig (from cs-handling.test.js): a car alone on an endless, flat test plane, driven by fixed inputs at
// the game's own steering rates, and the measurements made on it (steady cornering, turn-in and exit, pedal changes in a corner,
// 0-100 / 100-0 / top speed). Used by cs-handling.test.js (the Circuit Superstars signatures) and fleet.test.js (every vehicle
// inside its category's envelope).
//   const H = require('./lib/handling.js')(C);   H.steady('rally', 100, 1.0).ay ...   H.surf(5) (makadam) ... H.surf(0)
'use strict';

const DT = 1 / 120, G = 9.81, D = 180 / Math.PI;
const tauLaw = (v) => Math.min(0.6, Math.max(0.35, 0.45 * Math.pow(v / 27.78, 0.4)));   // drift attitude time constant vs speed (m/s)
const mean = (a, i0, i1) => { let s = 0, n = 0; for (let i = Math.max(0, i0); i < Math.min(a.length, i1); i++) { s += a[i]; n++; } return n ? s / n : NaN; };

module.exports = function handling(C) {
  // flat, endless test plane; its surface: asphalt, or planeSurf (2 grass, 5 makadam: Core's CSSURF index)
  let planeSurf = 0;
  const plane = { hasElev: false, def: {}, open: false,
    query(x, z, h, o) { o = o || {}; Object.assign(o, { i: 0, a: 0, s: x, d: z, tx: 1, tz: 0, nx: 0, nz: 1, x, z, bl: 1e9, br: 1e9 }); return o; },
    surface() { return planeSurf; } };
  const surf = (k) => { planeSurf = k; };
  // a model by id or the model itself (fleet tests hand in models that are not in MODELS)
  const modelOf = (id) => typeof id === 'string' ? C.MODELS.find(m => m.id === id) : id;

  function mkCar(id, o) {
    const M = modelOf(id);
    const c = new C.Car(M, { isPlayer: true, phys: 'cs', assist: o.assist != null ? o.assist : 2 });
    c.place(0, 0, 0); c.locked = false; c.q = { i: 0, s: 0, d: 0, tx: 1, tz: 0, nx: 0, nz: 1 };
    c.digitalSteer = !!o.digital;
    const v = (o.v || 0) / 3.6; c.vx = v; c.vz = 0;
    for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }   // a sensible gear
    c._thrI = 0.3; c._vT = v; c._t = 0; c._v = v; c._om = 0;
    return c;
  }
  // one step; steering moves at the game's own rate for the player (keys 6/s in, 10/s back; analogue 16/s); thr 'hold' keeps the start speed
  function step(c, I) {
    c.inSteer = I.st || 0; c.inBrk = I.brk || 0; c.inHand = 0;
    const v = Math.hypot(c.vx, c.vz);
    if (I.thr === 'hold') { const e = c._vT - v; c._thrI = Math.max(0, Math.min(1, c._thrI + e * 0.8 * DT)); c.inThr = Math.max(0, Math.min(1, c._thrI + 0.35 * e)); }
    else c.inThr = I.thr || 0;
    const back = Math.abs(c.inSteer) < Math.abs(c.steer) || c.inSteer * c.steer < 0, r = c.digitalSteer ? (back ? 10 : 6) : 16;
    c.steer += Math.max(-r * DT, Math.min(r * DT, c.inSteer - c.steer));
    const pvx = c.vx, pvz = c.vz;
    c.step(DT, plane);
    const v2 = Math.hypot(c.vx, c.vz);
    c._om = v2 > 1 ? (pvx * c.vz - pvz * c.vx) / (v2 * v2) / DT : 0; c._v = v2; c._t += DT;
  }
  const rec = () => ({ t: [], v: [], om: [], r: [], sl: [], thr: [] });
  const push = (R, c) => { R.t.push(c._t); R.v.push(c._v); R.om.push(c._om * D); R.r.push(c.w * D); R.sl.push(-(c.beta || 0) * D); R.thr.push(c.inThr); };

  // steady state: analogue steer s held, speed held with the throttle
  function steady(id, kmh, s) {
    const c = mkCar(id, { v: kmh }), R = rec();
    for (let i = 0; i < 5 / DT; i++) { step(c, { st: s, thr: 'hold' }); push(R, c); }
    const n = R.t.length, i0 = n - 120, om = mean(R.om, i0, n), sl = mean(R.sl, i0, n), v = mean(R.v, i0, n), sg = Math.sign(om) || 1;
    return { ay: Math.abs(om / D) * v / G, om: Math.abs(om), slip: sl * sg, tau: (sl * sg / D) / Math.abs(om / D), law: tauLaw(v), R: v / Math.abs(om / D) };
  }
  // key turn-in at full lock for 2.2 s, then release: rise times and how the car straightens itself
  function turnExit(id, kmh) {
    const c = mkCar(id, { v: kmh, digital: true }), R = rec();
    for (let i = 0; i < 0.3 / DT; i++) { step(c, { st: 0, thr: 'hold' }); push(R, c); }
    const iT = R.t.length;
    for (let i = 0; i < 2.2 / DT; i++) { step(c, { st: 1, thr: 'hold' }); push(R, c); }
    const iX = R.t.length;
    for (let i = 0; i < 2.5 / DT; i++) { step(c, { st: 0, thr: 'hold' }); push(R, c); }
    let rPk = -1e9, iPk = iT; for (let i = iT; i < iX; i++) if (R.r[i] > rPk) { rPk = R.r[i]; iPk = i; }
    const omF = mean(R.om, iX - 60, iX), slF = mean(R.sl, iX - 60, iX);
    let t10 = null, t90 = null; for (let i = iT; i <= iPk; i++) { if (t10 == null && R.r[i] >= 0.1 * rPk) t10 = R.t[i]; if (t90 == null && R.r[i] >= 0.9 * rPk) t90 = R.t[i]; }
    let s10 = null, s90 = null; for (let i = iT; i < iX; i++) { if (s10 == null && R.sl[i] >= 0.1 * slF) s10 = R.t[i]; if (s90 == null && R.sl[i] >= 0.9 * slF) s90 = R.t[i]; }
    const sl0 = R.sl[iX - 1]; let tau63 = null, rMin = 1e9, slMin = 1e9, cross = 0, prev = 0;
    for (let i = iX; i < R.t.length; i++) {
      if (tau63 == null && R.sl[i] <= 0.368 * sl0) tau63 = R.t[i] - R.t[iX];
      rMin = Math.min(rMin, R.r[i]); slMin = Math.min(slMin, R.sl[i]);
      const sg = R.sl[i] > 1 ? 1 : R.sl[i] < -1 ? -1 : 0; if (sg && prev && sg !== prev) cross++; if (sg) prev = sg;
    }
    return { rRise: t90 - t10, over: rPk / omF, slRise: s90 - s10, slip: slF, tau63, rMin, slMin, cross };
  }
  // a steady 100 km/h corner (analogue 0.7), then brake / lift / full throttle for 1.2 s
  function pedal(id, kind) {
    const c = mkCar(id, { v: 100 }), R = rec();
    for (let i = 0; i < 3 / DT; i++) { step(c, { st: 0.7, thr: 'hold' }); push(R, c); }
    const i0 = R.t.length, b0 = mean(R.sl, i0 - 30, i0), res0 = b0 - D * tauLaw(R.v[i0 - 1]) * mean(R.om, i0 - 30, i0) / D;
    for (let i = 0; i < 1.2 / DT; i++) step(c, kind === 'brake' ? { st: 0.7, thr: 0, brk: 1 } : kind === 'lift' ? { st: 0.7, thr: 0 } : { st: 0.7, thr: 1 }), push(R, c);
    let pk = -1e9, spun = false; for (let i = i0; i < R.t.length; i++) { pk = Math.max(pk, R.sl[i] - b0); if (Math.abs(R.sl[i]) > 90) spun = true; }
    let rs = 0, n = 0; for (let i = i0 + 48; i < i0 + 120; i++) { rs += R.sl[i] - D * tauLaw(R.v[i]) * R.om[i] / D; n++; }
    return { d03: R.sl[i0 + Math.round(0.3 / DT) - 1] - b0, pk, dMean: mean(R.sl, i0 + 48, i0 + 120) - b0, dRes: rs / n - res0, spun };
  }
  // straight line: 0-100 km/h, 100-0 km/h distance, straight braking from 150 km/h must not rotate the car
  function longi(id) {
    let c = mkCar(id, { v: 0 }), t = 0;
    while (c._v * 3.6 < 100 && t < 20) { step(c, { thr: 1 }); t += DT; }
    const t100 = t;
    c = mkCar(id, { v: 100 }); t = 0; while (c._v > 0.3 && t < 10) { step(c, { thr: 0, brk: 1 }); t += DT; }
    const d100 = c.x;
    c = mkCar(id, { v: 150 }); let bmax = 0; for (let i = 0; i < 3 / DT; i++) { step(c, { thr: 0, brk: 1 }); bmax = Math.max(bmax, Math.abs(c.beta || 0) * D); }
    return { t100, d100, bmax };
  }
  const topOf = (id, sec = 60) => { const c = mkCar(id, { v: 0 }); for (let i = 0; i < sec / DT; i++) step(c, { thr: 1 }); return c; };   // (60 s flat out)
  const t200 = (id) => { const c = mkCar(id, { v: 0 }); let t = 0; while (c._v * 3.6 < 200 && t < 30) { step(c, { thr: 1 }); t += DT; } return t; };
  const spinTo = (id) => { const c = mkCar(id, { v: 0 }); let v = 0; for (let i = 0; i < 30 / DT; i++) { step(c, { thr: 1 }); if (c.spin > 0.24) v = c._v * 3.6; } return v; };   // (the renderer smokes from 0.24)

  return { DT, G, D, tauLaw, mean, plane, surf, mkCar, step, rec, push, steady, turnExit, pedal, longi, topOf, t200, spinTo };
};
