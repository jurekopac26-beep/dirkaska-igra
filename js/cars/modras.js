/* Vehicle 'modras' — MODRAS V10: a modern mid-engined V10 supercar. Signature features: 1) sharp hexagonal intakes in the nose and the
   flanks, 2) Y-shaped headlamps, 3) a glass engine cover showing the V10, 4) a rear spoiler over hexagonal tail lamps, 5) a wedge profile
   with a low cabin. L 4.52 W 1.93 H 1.17, wheelbase 2.62, overhangs F 0.90 R 1.00 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'modras', name: 'MODRAS V10', cat: 'super', ord: 3, drive: 'AWD',
    desc: 'Sodoben superšportnik z V10 na sredini in ostrimi šesterokotnimi linijami.',
    phys: { mass: 1450, a: 1.36, b: 1.26, kI: 1.25, kw: 470, redline: 8700, idle: 1000, gears: [3.3, 2.5, 2, 1.66, 1.42, 1.24, 1.1], final: 3.37, rw: 0.33, cDrag: 0.35, len: 4.52, wid: 1.93, steerMax: 0.6,
      tracK: 1.2, brakeK: 1.1, spinK: 0.25, aiGap: 7.5, aiPass: 4 },   // (aiGap / aiPass: its AI follows further back and passes wider: fewer pile-ups on the Nordschleife, tests/fleet.test.js 8b)
    arc: { amax: 1.84, kv: 2.1, rmin: 4.7 },
    csp: { bx: 0.12, coast: -0.08, thr: -0.015, liftP: 0, pwr: 0.03, out: 0.95, turn: 1.08, w: 0.98 },   // (the AWD layer: steady, straightens quickly; its own turn)
    stats: { power: 10, grip: 9, weight: 5, drift: 4 },
    price: 110000, pk: 'open', field: ['modras'],
    snd: { kind: 'v10', hz: 1.1, loud: 1.1 },
    expect: { t100: [2.19, 2.57], vmax: [268, 284], latG: [2.35, 2.45], d100: [21, 23.2] },
    parts: { set: 'race', ht: 1.17, y0: 0.15,
      over: {
        wing: { f: 0.75, m: 4 },
      },
    },
    look: null,
  });
})();
