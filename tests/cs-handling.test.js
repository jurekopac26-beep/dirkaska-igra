// "Circuit Superstars" handling signatures, measured on a flat test plane and checked against the bands that came
// out of the analysis of the reference video (parta.mp4). BURJA R7 (model 'rally'), assist 2, unless noted.
// At the end the formula car (open wheels, wings): quicker than the road cars on tarmac, tidier, worse on makadam.
//   node tests/cs-handling.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
const DT = 1 / 120, G = 9.81, D = 180 / Math.PI;
const tauLaw = (v) => Math.min(0.6, Math.max(0.35, 0.45 * Math.pow(v / 27.78, 0.4)));   // drift attitude time constant vs speed (m/s)
const mean = (a, i0, i1) => { let s = 0, n = 0; for (let i = Math.max(0, i0); i < Math.min(a.length, i1); i++) { s += a[i]; n++; } return n ? s / n : NaN; };

// flat, endless test plane (optionally a wall along z = wallZ); its surface: asphalt, or planeSurf (5: makadam)
let planeSurf = 0;
const plane = { hasElev: false, def: {}, open: false,
  query(x, z, h, o) { o = o || {}; Object.assign(o, { i: 0, a: 0, s: x, d: z, tx: 1, tz: 0, nx: 0, nz: 1, x, z, bl: 1e9, br: 1e9 }); return o; },
  surface() { return planeSurf; } };

function mkCar(id, o) {
  const M = C.MODELS.find(m => m.id === id);
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

const checks = [];
const band = (name, v, lo, hi, unit = '') => checks.push({ name, v, ok: Number.isFinite(v) && v >= lo && v <= hi, want: `${lo}..${hi}${unit}` });
const f = (v, d = 2) => Number.isFinite(v) ? v.toFixed(d) : String(v);

for (const kmh of [60, 100, 140]) {
  const s = steady('rally', kmh, 1.0);
  band(`steady ${kmh} km/h full lock: lateral g`, s.ay, 2.15, 2.45, ' g');
  band(`steady ${kmh} km/h: drift attitude time constant minus law`, Math.abs(s.tau - s.law), 0, 0.05, ' s');
}
for (const kmh of [30, 60]) band(`steady ${kmh} km/h: path rate`, steady('rally', kmh, 1.0).om, 74, 80, ' deg/s');
band('steady 60 km/h: turn radius', steady('rally', 60, 1.0).R, 12, 13, ' m');
const te = turnExit('rally', 100);
band('turn-in 100 km/h: yaw-rate rise 10-90 %', te.rRise, 0.24, 0.34, ' s');
band('turn-in 100 km/h: yaw-rate overshoot ratio', te.over, 1.5, 2.2);
band('turn-in 100 km/h: slip build-up 10-90 %', te.slRise, 0.3, 0.7, ' s');
band('turn-in 100 km/h: drift attitude (nose in)', te.slip, 15, 35, ' deg');
band('exit 100 km/h: slip decay to 37 %', te.tau63, 0.33, 0.48, ' s');
band('exit 100 km/h: no swing to the other side (min slip)', te.slMin, -2, 90, ' deg');
band('exit 100 km/h: slip sign crossings', te.cross, 0, 0);
for (const id of ['rally', 'vortex', 'pico']) {
  const b = pedal(id, 'brake'), l = pedal(id, 'lift'), th = pedal(id, 'thr');
  band(`${id}: brake in a corner rotates the car (0.3 s)`, b.d03, 3.5, 8, ' deg');
  band(`${id}: brake in a corner, peak extra slip`, b.pk, -90, 13, ' deg');
  band(`${id}: lift-off residual`, l.dRes, -3.5, -1.5, ' deg');
  band(`${id}: full throttle mean slip change`, th.dMean, -2.5, 0, ' deg');
  band(`${id}: no spin under brake / lift / throttle`, +(b.spun || l.spun || th.spun), 0, 0);
}
const lo = longi('rally');
band('0-100 km/h', lo.t100, 2.85, 2.89, ' s');
band('100-0 km/h braking distance', lo.d100, 22, 26, ' m');
band('straight braking from 150 km/h: max body slip', lo.bmax, 0, 1, ' deg');

// ---- the formula (open wheels, wings): the fastest car on tarmac, a tidy slide, carbon brakes; slicks on makadam ----
{
  const lf = longi('formula');
  band('formula: 0-100 km/h', lf.t100, 2.3, 2.7, ' s');
  band('formula: 100-0 km/h braking distance', lf.d100, 16, 20, ' m');
  band('formula: straight braking from 150 km/h: max body slip', lf.bmax, 0, 1, ' deg');
  const c = mkCar('formula', { v: 0 }); let vSpin = 0;
  for (let i = 0; i < 60 / DT; i++) { step(c, { thr: 1 }); if (c.spin > 0.24) vSpin = c._v * 3.6; }   // (the renderer smokes and marks the road from 0.24)
  band('formula: top speed on the flat', c._v * 3.6, 270, 295, ' km/h');
  band('formula: full throttle spins the tyres only at the launch (up to)', vSpin, 20, 110, ' km/h');
  const f60 = steady('formula', 60, 1.0), f100 = steady('formula', 100, 1.0), f150 = steady('formula', 150, 1.0), r100 = steady('rally', 100, 1.0);
  band('formula: steady 150 km/h full lock: lateral g (the wings)', f150.ay, 3.0, 3.5, ' g');
  band('formula: grip gained from 60 to 150 km/h (downforce)', f150.ay - f60.ay, 0.7, 1.4, ' g');
  band('formula: drift attitude at 100 km/h below the rally car\'s', r100.slip - f100.slip, 4, 12, ' deg');
  const te = turnExit('formula', 100);
  band('formula exit 100 km/h: slip decay to 37 %', te.tau63, 0.18, 0.35, ' s');
  band('formula exit 100 km/h: no swing to the other side (min slip)', te.slMin, -2, 90, ' deg');
  band('formula exit 100 km/h: slip sign crossings', te.cross, 0, 0);
  const b = pedal('formula', 'brake'), l = pedal('formula', 'lift'), th = pedal('formula', 'thr');
  band('formula: brake in a corner, peak extra slip', b.pk, -90, 9, ' deg');
  band('formula: no spin under brake / lift / throttle', +(b.spun || l.spun || th.spun), 0, 0);
  planeSurf = 5;   // makadam
  const fm = longi('formula'), rm = longi('rally'), fs = steady('formula', 100, 1.0), rs = steady('rally', 100, 1.0);
  planeSurf = 0;
  band('formula on makadam: 0-100 km/h slower than the rally car', fm.t100 - rm.t100, 0.8, 2.5, ' s');
  band('formula on makadam: less side grip at 100 km/h than the rally car', rs.ay - fs.ay, 0.15, 0.6, ' g');
  // a head-on hit knocks the front wing off (half the downforce goes with it); the pit repair brings it back
  const A = mkCar('formula', { v: 0 }), B = mkCar('rally', { v: 0 });
  B.place(4.2, 0, Math.PI); A.vx = 20; B.vx = -20; C.carCollide(A, B);
  const wingOff = +!!A.lost.bumperF, lost = A.aeroK / A.aeroK0; C.Race.prototype.repairCar(A);
  band('formula: front wing knocked off in a head-on hit', wingOff, 1, 1);
  band('formula: downforce left without the front wing (share)', lost, 0.49, 0.51);
  band('formula: the pit repair gives it back', A.aeroK / A.aeroK0, 1, 1);
}

// ---- the newer cars: the prototype (the formula's class: less downforce, less drag), the V8 (the least grip, the biggest slides, long
// wheelspin), the electric car (the quickest launch, no revving, one gear), the truck (little grip on tarmac, the most off it, soft landings) ----
const topOf = (id) => { const c = mkCar(id, { v: 0 }); for (let i = 0; i < 60 / DT; i++) step(c, { thr: 1 }); return c; };   // (60 s flat out)
const t200 = (id) => { const c = mkCar(id, { v: 0 }); let t = 0; while (c._v * 3.6 < 200 && t < 30) { step(c, { thr: 1 }); t += DT; } return t; };
const spinTo = (id) => { const c = mkCar(id, { v: 0 }); let v = 0; for (let i = 0; i < 30 / DT; i++) { step(c, { thr: 1 }); if (c.spin > 0.24) v = c._v * 3.6; } return v; };   // (the renderer smokes from 0.24)
{
  const ll = longi('lm'), vL = topOf('lm')._v * 3.6, vF = topOf('formula')._v * 3.6;
  band('prototype: 0-100 km/h', ll.t100, 2.5, 2.9, ' s');
  band('prototype: 100-0 km/h braking distance (carbon brakes)', ll.d100, 18.5, 21.5, ' m');
  band('prototype: top speed on the flat', vL, 285, 305, ' km/h');
  band('prototype: quicker down a straight than the formula (less drag)', vL - vF, 5, 25, ' km/h');
  const l60 = steady('lm', 60, 1.0), l150 = steady('lm', 150, 1.0), f150 = steady('formula', 150, 1.0), l100 = steady('lm', 100, 1.0), r100 = steady('rally', 100, 1.0);
  band('prototype: steady 150 km/h full lock: lateral g (the wings)', l150.ay, 2.9, 3.25, ' g');
  band('prototype: less grip than the formula at 150 km/h (less downforce)', f150.ay - l150.ay, 0.05, 0.4, ' g');
  band('prototype: grip gained from 60 to 150 km/h', l150.ay - l60.ay, 0.6, 1.2, ' g');
  band('prototype: drift attitude at 100 km/h below the rally car\'s', r100.slip - l100.slip, 3, 10, ' deg');
  const b = pedal('lm', 'brake'), l = pedal('lm', 'lift'), th = pedal('lm', 'thr');
  band('prototype: no spin under brake / lift / throttle', +(b.spun || l.spun || th.spun), 0, 0);
  planeSurf = 5; const lm = longi('lm'), rm = longi('rally'); planeSurf = 0;
  band('prototype on makadam (slicks): 0-100 km/h slower than the rally car', lm.t100 - rm.t100, 1.2, 3.5, ' s');
  const A = mkCar('lm', { v: 0 }), B = mkCar('rally', { v: 0 });   // a head-on hit: the splitter off, half the downforce with it; the repair
  B.place(4.2, 0, Math.PI); A.vx = 20; B.vx = -20; C.carCollide(A, B);
  const off = +!!A.lost.bumperF, left = A.aeroK / A.aeroK0; C.Race.prototype.repairCar(A);
  band('prototype: the splitter knocked off in a head-on hit', off, 1, 1);
  band('prototype: downforce left without the splitter (share)', left, 0.49, 0.51);
  band('prototype: the pit repair gives it back', A.aeroK / A.aeroK0, 1, 1);
}
{
  const k100 = steady('kaze', 100, 1.0), m100 = steady('muscle', 100, 1.0);
  band('V8: less side grip than the KAZE RS (100 km/h, full lock)', k100.ay - m100.ay, 0.05, 0.3, ' g');
  band('V8: a bigger drift attitude than the KAZE RS (100 km/h)', m100.slip - k100.slip, 0.5, 4, ' deg');
  band('V8: 0-200 km/h quicker than the KAZE RS (the power)', t200('kaze') - t200('muscle'), 0.8, 2.5, ' s');
  band('V8: the wheelspin lasts longer than the KAZE RS\'s (up to)', spinTo('muscle') - spinTo('kaze'), 10, 40, ' km/h');
  band('V8: top speed', topOf('muscle')._v * 3.6, 234, 245, ' km/h');
  const b = pedal('muscle', 'brake'), l = pedal('muscle', 'lift'), th = pedal('muscle', 'thr');
  band('V8: no spin under brake / lift / throttle', +(b.spun || l.spun || th.spun), 0, 0);
}
{
  const le = longi('ev'), top = topOf('ev');
  band('electric: 0-100 km/h, the quickest road car (the rally car: 2.87 s)', le.t100, 2.4, 2.65, ' s');
  band('electric: top speed, still in its one gear', top._v * 3.6 + (top.gear === 1 ? 0 : 1000), 245, 260, ' km/h');
  band('electric: more side grip than the rally car (100 km/h)', steady('ev', 100, 1.0).ay - steady('rally', 100, 1.0).ay, 0.02, 0.15, ' g');
  band('electric: hardly any wheelspin (up to)', spinTo('ev'), 0, 75, ' km/h');
  const c = mkCar('ev', { v: 0 }), k = mkCar('kaze', { v: 0 }); c.locked = k.locked = true;   // on the grid, the throttle down: an engine revs, the motors do not
  for (let i = 0; i < 1 / DT; i++) { step(c, { thr: 1 }); step(k, { thr: 1 }); }
  band('electric: no revving on the grid (the KAZE RS revs)', c.rpm + (k.rpm > 5000 ? 0 : 1e4), 0, 1, ' rpm');
}
{
  const t100 = steady('truck', 100, 1.0), r100 = steady('rally', 100, 1.0);
  band('truck on tarmac: less side grip than the rally car (100 km/h)', r100.ay - t100.ay, 0.15, 0.45, ' g');
  planeSurf = 5; const tm = longi('truck'), rm = longi('rally'), ts = steady('truck', 100, 1.0), rs = steady('rally', 100, 1.0); planeSurf = 0;
  band('truck on makadam: more side grip than the rally car (100 km/h)', ts.ay - rs.ay, 0.08, 0.3, ' g');
  band('truck on makadam: 0-100 km/h quicker than the rally car', rm.t100 - tm.t100, 0.6, 1.6, ' s');
  planeSurf = 2; const vT = topOf('truck')._v * 3.6, vR = topOf('rally')._v * 3.6; planeSurf = 0;
  band('truck on grass: faster than the rally car (the loose ground holds it back less)', vT - vR, 10, 40, ' km/h');
  // a hard landing (3 m up, falling at 12 m/s): damage for the rally car, none for the truck, and it keeps more of its speed
  const hilly = Object.assign({}, plane, { hasElev: true, elevAt: () => ({ y: 0, grade: 0, curv: 0 }) });
  const drop = (id) => { const c = mkCar(id, { v: 72 }); c.air = 1; c.y = 3; c.vy = -12; for (let i = 0; i < 1.2 / DT; i++) { c.inThr = 0; c.inBrk = 0; c.inSteer = 0; c.step(DT, hilly); } return { dmg: c.dmg, v: Math.hypot(c.vx, c.vz) * 3.6 }; };
  const dT = drop('truck'), dR = drop('rally');
  band('a hard landing: the rally car damaged', dR.dmg, 0.02, 0.1);
  band('a hard landing: the truck not (it lands softly)', dT.dmg, 0, 0);
  band('a hard landing: the truck keeps more of its speed than the rally car', dT.v - dR.v, 3, 12, ' km/h');
}

let bad = 0;
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name.padEnd(56)} ${f(c.v).padStart(8)}  (want ${c.want})`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} handling checks`);
process.exit(bad ? 1 : 0);
