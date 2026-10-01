/* Vehicle 'kozorog' — KOZOROG TC: a touring car (TCR-style front-drive saloon racer). Signature features: 1) very wide bolted-on arches
   over a road saloon body, 2) a deep front splitter, 3) a rear wing on the boot, 4) a roof-mounted fin and a rain light, 5) centre-lock
   race wheels. L 4.40 W 1.95 H 1.38, wheelbase 2.65, overhangs F 0.90 R 0.85 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'kozorog', name: 'KOZOROG TC', cat: 'dirkalni', ord: 1, drive: 'FF',
    desc: 'Turistični dirkalnik: široki blatniki, spojler spredaj in krilo zadaj.',
    phys: { mass: 1180, a: 1.3, b: 1.35, kI: 1.2, kw: 260, redline: 8500, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 5.39, rw: 0.33, cDrag: 0.4, len: 4.4, wid: 1.95, steerMax: 0.6,
      tracK: 1.15, brakeK: 1.1, spinK: 0.3, aero: 0.00004, loose: 0.8 },
    arc: { amax: 1.86, kv: 2.4, rmin: 4.6 },
    csp: { bx: 0.15, coast: -0.095, thr: -0.03, liftP: 0, pwr: 0, out: 1, turn: 1.1, w: 1, tv: 0.85 },   // (the FF layer: pivots on the brakes, the throttle pulls it straight; its own turn, w, tv)
    stats: { power: 7, grip: 10, weight: 7, drift: 3 },
    price: 55000, pk: 'ppo', field: ['kozorog'],
    snd: { kind: 'i4', hz: 1.2, turbo: 0.8, loud: 1.1 },
    expect: { t100: [2.61, 3.06], vmax: [225, 239], latG: [2.45, 2.55], d100: [20.9, 23.1] },
    partNames: { splitter: 'front splitter' },
    parts: { set: 'race', ht: 1.38, y0: 0.12,
      over: {
        bumperF: { df: 0 },
      },
      extra: {
        splitter: { z: 0, th: 0.45, m: 3, rW: 0.4, h: 0.04, lx: 1, lz: 0, f: 0.02, df: 0.3 },
      },
    },
    look: null,
  });
})();
