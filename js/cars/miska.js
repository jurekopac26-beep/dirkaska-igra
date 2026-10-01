/* Vehicle 'miska' — MIŠKA: a tuned 1957-75 Italian micro city car, rear engine with its lid propped open. Signature features: 1) a tiny
   round two-box body with a short bonnet and a near-vertical tail, 2) the engine lid at the rear propped open on its stays, 3) round
   headlamps in the front wings and a chrome strip down the nose, 4) small wheels pushed to the corners under flared arches, 5) a canvas
   fold-back roof panel. L 2.97 W 1.32 H 1.33, wheelbase 1.84, overhangs F 0.50 R 0.63 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'miska', name: 'MIŠKA', cat: 'mali', ord: 1, drive: 'RR',
    desc: 'Italijanski mestni malček iz 60-ih, predelan za dirke: pokrov motorja vedno priprt.',
    phys: { mass: 560, a: 0.99, b: 0.85, kI: 0.85, kw: 38, redline: 6800, idle: 900, gears: [3.4, 2.1, 1.42, 1], final: 4.18, rw: 0.26, cDrag: 0.45, len: 2.97, wid: 1.32, steerMax: 0.66,
      spinK: 0.5, sway: 1.1 },
    arc: { amax: 1.62, kv: 2, rmin: 3.6 },
    csp: { bx: 0.15, coast: -0.04, thr: 0.01, liftP: 0.16, pwr: 0.04, out: 1.25, turn: 1.1, w: 1 },   // (the RR layer: the engine behind the rear axle, a pendulum on a lift; its own turn, liftP, pwr)
    stats: { power: 1, grip: 5, weight: 10, drift: 7 },
    price: 6000, pk: 'ta1', field: ['miska'],
    snd: { kind: 'i2', hz: 1.3, loud: 0.8 },
    expect: { t100: [4.94, 5.8], vmax: [144, 153], latG: [2.05, 2.15], d100: [22.7, 25] },
    parts: { set: 'car', ht: 1.33, y0: 0.18 },
    look: null,
  });
})();
