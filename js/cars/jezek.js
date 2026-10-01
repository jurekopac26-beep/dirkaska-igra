/* Vehicle 'jezek' — JEŽEK E: a retro-modern electric city hatch. Signature features: 1) a rounded two-box hatch with a short bonnet, 2)
   LED light bars across the nose and the tail, 3) flush door handles and a closed grille panel, 4) a glass roof over a two-tone body, 5)
   aero-disc wheels. L 3.95 W 1.78 H 1.50, wheelbase 2.54, overhangs F 0.72 R 0.69 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'jezek', name: 'JEŽEK E', cat: 'elektricni', ord: 1, drive: 'FF',
    desc: 'Retro električni mestni avto z LED pasovi: tih, takoj pospeši, a je težak.',
    phys: { mass: 1350, a: 1.26, b: 1.28, kI: 1.1, kw: 160, redline: 12000, idle: 0, gears: [1], final: 6.59, rw: 0.31, cDrag: 0.33, len: 3.95, wid: 1.78, steerMax: 0.62,
      ev: true, tracK: 1.1, spinK: 0.3 },
    arc: { amax: 1.74, kv: 2.1, rmin: 4.2 },
    csp: { bx: 0.15, coast: -0.095, thr: -0.04, liftP: 0, pwr: 0, out: 1, turn: 1, w: 1.02 },   // (the FF layer: pivots on the brakes, the throttle pulls it straight; its own thr)
    stats: { power: 4, grip: 7, weight: 6, drift: 4 },
    price: 22000, pk: 'ta1', field: ['jezek'],
    snd: { kind: 'ev', hz: 1, loud: 0.7 },
    expect: { t100: [3.14, 3.69], vmax: [194, 206], latG: [2.22, 2.32], d100: [22.9, 25.3] },
    parts: { set: 'car', ht: 1.5, y0: 0.2 },
    look: null,
  });
})();
