/* Vehicle 'gozdar' — GOZDAR: a short-course off-road racing pickup. Signature features: 1) a pickup cab with a short bed, 2) a big wing
   standing in the bed, 3) long-travel suspension with huge arches, 4) a tubular front bumper, 5) number panels on the doors. L 4.90 W
   2.20 H 1.75, wheelbase 2.95, overhangs F 0.90 R 1.05 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'gozdar', name: 'GOZDAR', cat: 'teren', ord: 4, drive: 'FR',
    desc: 'Dirkalni poltovornjak za kratke terenske steze z velikim krilom na kesonu.',
    phys: { mass: 1360, a: 1.55, b: 1.4, kI: 1.35, kw: 380, redline: 7000, idle: 850, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 5.16, rw: 0.42, cDrag: 0.55, len: 4.9, wid: 2.2, steerMax: 0.62,
      tracK: 0.9, brakeK: 0.9, spinK: 0.8, loose: 1.25, looseDrag: 0.4, landV: 20, landK: 0.5, sway: 1.6 },
    arc: { amax: 1.56, kv: 1.85, rmin: 5.6 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.1, pwr: 0.12, out: 1.3, turn: 0.9, w: 0.95, tv: 1.15 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 9, grip: 4, weight: 6, drift: 10 },
    price: 50000, pk: 'ppo', field: ['gozdar'],
    snd: { kind: 'v8', hz: 0.9, loud: 1.3 },
    expect: { t100: [3.73, 4.37], vmax: [219, 233], latG: [1.99, 2.09], d100: [24.7, 27.3] },
    partNames: { tailgate: 'tailgate' },
    parts: { set: 'truck', ht: 1.75, y0: 0.4,
      extra: {
        hood: {},
        fenderL: {},
        fenderR: {},
        wing: { f: 0.9, lx: -0.75 },
        tailgate: { z: 1, th: 0.7, m: 10, rW: 0.4, h: 0.08, lx: -0.98, lz: 0, f: 0.45 },
      },
    },
    look: null,
  });
})();
