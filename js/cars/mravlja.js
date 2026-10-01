/* Vehicle 'mravlja' — MRAVLJA: a racing kart, two-stroke behind the seat. Signature features: 1) the driver in full view in a moulded
   seat, 2) side pods between the wheels, 3) a front fairing and a nose bumper, 4) a rear bumper bar across the wheels, 5) the two-stroke
   engine beside the seat with its exhaust. L 1.85 W 1.35 H 1.00, wheelbase 1.05, overhangs F 0.40 R 0.40 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'mravlja', name: 'MRAVLJA', cat: 'dirkalni', ord: 5, drive: 'RR',
    desc: 'Dirkalni kart: voznik na očeh, stranska oklepa in sprednji spojler.',
    phys: { mass: 165, a: 0.53, b: 0.52, kI: 0.55, kw: 22, redline: 14000, idle: 2500, gears: [1], final: 5.2, rw: 0.14, cDrag: 1.25, len: 1.85, wid: 1.35, steerMax: 0.5,
      tracK: 1.2, brakeK: 1.1, spinK: 0.3, loose: 0.66, dmgK: 1.3, sway: 0.3 },
    arc: { amax: 1.95, kv: 2.6, rmin: 2.6 },
    csp: { bx: 0.15, coast: -0.04, thr: 0.01, liftP: 0.05, pwr: 0.03, out: 0.9, turn: 1.3, w: 1.05, tv: 0.65 },   // (the RR layer: the engine behind the rear axle, a pendulum on a lift; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 1, grip: 10, weight: 10, drift: 2 },
    price: 5000, pk: 'ta1', field: ['mravlja'],
    snd: { kind: 'kart2t', hz: 1.6, loud: 0.9 },
    expect: { t100: [3.1, 3.64], vmax: [130, 138], latG: [2.51, 2.61], d100: [19.8, 21.8] },
    partNames: { nose: 'front fairing', podL: 'left side pod', podR: 'right side pod' },
    parts: { set: 'none', ht: 1, y0: 0.05,
      extra: {
        nose: { z: 0, th: 0.5, m: 2, r: 0.35, h: 0.12, lx: 0.95, lz: 0, f: 0.25 },
        podL: { z: 2, th: 0.55, m: 2, r: 0.3, h: 0.12, lx: -0.05, lz: -0.85, f: 0.15 },
        podR: { z: 3, th: 0.55, m: 2, r: 0.3, h: 0.12, lx: -0.05, lz: 0.85, f: 0.15 },
        bumperR: { m: 3, f: 0.12 },
      },
    },
    look: null,
  });
})();
