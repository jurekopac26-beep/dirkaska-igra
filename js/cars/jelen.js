/* Vehicle 'jelen' — JELEN GT: a front-engined V12 grand tourer. Signature features: 1) a very long bonnet with a power bulge, 2) the
   cabin set far back over the rear axle, 3) a fastback roof ending in a short cut-off tail, 4) quad round tail lamps, 5) side vents
   behind the front wheels. L 4.55 W 1.94 H 1.30, wheelbase 2.70, overhangs F 0.85 R 1.00 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'jelen', name: 'JELEN GT', cat: 'sportni', ord: 3, drive: 'FR',
    desc: 'Gran turismo z V12 spredaj: dolg pokrov motorja, hiter in miren na dolgih ravninah.',
    phys: { mass: 1650, a: 1.42, b: 1.28, kI: 1.3, kw: 400, redline: 7500, idle: 800, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.36, rw: 0.33, cDrag: 0.34, len: 4.55, wid: 1.94, steerMax: 0.6,
      brakeK: 1.05, spinK: 0.3 },
    arc: { amax: 1.78, kv: 2, rmin: 4.6 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.12, pwr: 0.08, out: 1.2, turn: 0.95, w: 0.99 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w)
    stats: { power: 9, grip: 8, weight: 3, drift: 7 },
    price: 60000, pk: 'ppo', field: ['jelen'],
    snd: { kind: 'v12', hz: 0.95, loud: 1.1 },
    expect: { t100: [3.28, 3.85], vmax: [245, 260], latG: [2.27, 2.37], d100: [21.9, 24.2] },
    parts: { set: 'car', ht: 1.3, y0: 0.2 },
    look: null,
  });
})();
