/* Vehicle 'panter' — PANTER 6: a rear-engined six-cylinder sports coupe. Signature features: 1) round upright headlamps in high front
   wings, 2) a sloping fastback running down to the engine lid, 3) a whale-tail spoiler on the engine lid, 4) wide rear wings over the
   driven wheels, 5) a full-width tail-light bar. L 4.25 W 1.77 H 1.30, wheelbase 2.27, overhangs F 0.88 R 1.10 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'panter', name: 'PANTER 6', cat: 'sportni', ord: 2, drive: 'RR',
    desc: 'Športni kupe z motorjem zadaj: okrogla žarometa, poševna zadnjica in kitov rep.',
    phys: { mass: 1350, a: 1.25, b: 1.02, kI: 1.18, kw: 290, redline: 7800, idle: 900, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.52, rw: 0.31, cDrag: 0.36, len: 4.25, wid: 1.77, steerMax: 0.62,
      tracK: 1.05, spinK: 0.4 },
    arc: { amax: 1.76, kv: 2, rmin: 4.3 },
    csp: { bx: 0.15, coast: -0.04, thr: 0.01, liftP: 0.2, pwr: 0.07, out: 1.25, turn: 1.08, w: 1 },   // (the RR layer: the engine behind the rear axle, a pendulum on a lift)
    stats: { power: 8, grip: 7, weight: 6, drift: 7 },
    price: 48000, pk: 'ppo', field: null,
    snd: { kind: 'flat6', hz: 1, turbo: 0.5, loud: 1 },
    expect: { t100: [2.78, 3.27], vmax: [231, 245], latG: [2.25, 2.35], d100: [22.8, 25.2] },
    parts: { set: 'race', ht: 1.3, y0: 0.18,
      over: {
        wing: { f: 0.78, lx: -0.88, m: 4 },
      },
    },
    look: null,
  });
})();
