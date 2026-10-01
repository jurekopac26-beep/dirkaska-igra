/* Vehicle 'lisica' — LISICA: a light 1990 roadster. Signature features: 1) a small open two-seater with a smiling oval mouth, 2) pop-up
   headlamps, 3) a roll hoop behind the seats, 4) a short rounded tail with oval lamps, 5) a low windscreen frame. L 3.95 W 1.68 H 1.23,
   wheelbase 2.27, overhangs F 0.82 R 0.86 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'lisica', name: 'LISICA', cat: 'sportni', ord: 4, drive: 'FR',
    desc: 'Lahek roadster iz leta 1990 z dvižnimi žarometi, odprto streho in varnostnim lokom.',
    phys: { mass: 980, a: 1.16, b: 1.11, kI: 1.08, kw: 120, redline: 7200, idle: 900, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 4.41, rw: 0.3, cDrag: 0.38, len: 3.95, wid: 1.68, steerMax: 0.64,
      spinK: 0.5 },
    arc: { amax: 1.72, kv: 2, rmin: 4 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.16, pwr: 0.06, out: 1.3, turn: 1.08, w: 1 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, turn)
    stats: { power: 2, grip: 7, weight: 9, drift: 7 },
    price: 18000, pk: 'ta1', field: ['lisica'],
    snd: { kind: 'i4', hz: 1.15, loud: 0.9 },
    expect: { t100: [3.54, 4.16], vmax: [187, 199], latG: [2.19, 2.29], d100: [22.8, 25.2] },
    parts: { set: 'open', ht: 1.23, y0: 0.18 },
    look: null,
  });
})();
