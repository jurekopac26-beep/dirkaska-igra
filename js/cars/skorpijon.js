/* Vehicle 'skorpijon' — ŠKORPIJON H: a 2010s hybrid hypercar. Signature features: 1) a low teardrop canopy over the cabin, 2) exhausts
   exiting at the top of the engine cover, 3) a long tail with an active rear wing, 4) deep side intakes behind the doors, 5) a front
   splitter and big front air ducts. L 4.70 W 1.98 H 1.12, wheelbase 2.73, overhangs F 0.92 R 1.05 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'skorpijon', name: 'ŠKORPIJON H', cat: 'super', ord: 2, drive: 'AWD',
    desc: 'Hibridni hiperšportnik: izpuha na vrhu, nizka kabina, krila ga držijo ob cesti.',
    phys: { mass: 1550, a: 1.43, b: 1.3, kI: 1.3, kw: 680, redline: 9000, idle: 1000, gears: [3.3, 2.5, 2, 1.66, 1.42, 1.24, 1.1], final: 3.19, rw: 0.34, cDrag: 0.33, len: 4.7, wid: 1.98, steerMax: 0.58,
      tracK: 1.25, brakeK: 1.15, spinK: 0.2, aero: 0.00004, loose: 0.8 },
    arc: { amax: 1.88, kv: 2.2, rmin: 4.8 },
    csp: { bx: 0.12, coast: -0.08, thr: -0.015, liftP: 0, pwr: 0.03, out: 0.95, turn: 1.1, w: 0.98 },   // (the AWD layer: steady, straightens quickly; its own turn, w)
    stats: { power: 10, grip: 10, weight: 4, drift: 4 },
    price: 150000, pk: 'unl', field: ['skorpijon'],
    snd: { kind: 'hybrid', hz: 1, loud: 1.1 },
    expect: { t100: [2.07, 2.43], vmax: [302, 321], latG: [2.48, 2.58], d100: [20.2, 22.3] },
    parts: { set: 'race', ht: 1.12, y0: 0.14 },
    look: null,
  });
})();
