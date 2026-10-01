/* Vehicle 'raketa' — RAKETA 16V: a late-1970s / 1980s square hot hatch, 16-valve four. Signature features: 1) a square three-door hatch
   with a flat bonnet and a steep tailgate, 2) twin round headlamps per side in a black grille, 3) a thin red stripe across the grille and
   round the bumpers, 4) black wheel-arch extensions and side skirts, 5) four-spoke alloy wheels. L 3.80 W 1.63 H 1.40, wheelbase 2.40,
   overhangs F 0.78 R 0.62 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'raketa', name: 'RAKETA 16V', cat: 'mali', ord: 3, drive: 'FF',
    desc: 'Oglat hot hatch iz poznih 70-ih in 80-ih: okrogla žarometa in rdeča črta na maski.',
    phys: { mass: 880, a: 1.12, b: 1.28, kI: 1.05, kw: 140, redline: 7600, idle: 950, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 4.12, rw: 0.29, cDrag: 0.38, len: 3.8, wid: 1.63, steerMax: 0.64,
      spinK: 0.4 },
    arc: { amax: 1.72, kv: 2.1, rmin: 4 },
    csp: { bx: 0.15, coast: -0.095, thr: -0.03, liftP: 0, pwr: 0, out: 1, turn: 1.04, w: 1.02 },   // (the FF layer: pivots on the brakes, the throttle pulls it straight; its own turn)
    stats: { power: 4, grip: 7, weight: 10, drift: 5 },
    price: 14000, pk: 'ta1', field: ['raketa'],
    snd: { kind: 'i4', hz: 1.1, loud: 1 },
    expect: { t100: [3.09, 3.63], vmax: [205, 217], latG: [2.19, 2.29], d100: [22.8, 25.2] },
    parts: { set: 'car', ht: 1.4, y0: 0.2 },
    look: null,
  });
})();
