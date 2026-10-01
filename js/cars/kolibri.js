/* Vehicle 'kolibri' — KOLIBRI: a 1990s kei-class hot hatch, three-cylinder turbo. Signature features: 1) a tall boxy two-box body on a
   short wheelbase, 2) a roof spoiler over the near-vertical tailgate, 3) big square headlamps and a slim grille, 4) a bonnet scoop for
   the intercooler, 5) small wide-spoked alloy wheels. L 3.39 W 1.47 H 1.40, wheelbase 2.33, overhangs F 0.55 R 0.51 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'kolibri', name: 'KOLIBRI', cat: 'mali', ord: 2, drive: 'FF',
    desc: 'Japonski žepni hot hatch iz 90-ih: škatlast, lahek in živahen, s strešnim spojlerjem.',
    phys: { mass: 680, a: 1.15, b: 1.18, kI: 0.95, kw: 47, redline: 8500, idle: 1000, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 5.86, rw: 0.27, cDrag: 0.42, len: 3.39, wid: 1.47, steerMax: 0.66,
      spinK: 0.4 },
    arc: { amax: 1.66, kv: 2.1, rmin: 3.8 },
    csp: { bx: 0.15, coast: -0.095, thr: -0.03, liftP: 0, pwr: 0, out: 1, turn: 1, w: 1.02 },   // (the FF layer: pivots on the brakes, the throttle pulls it straight)
    stats: { power: 1, grip: 5, weight: 10, drift: 5 },
    price: 8000, pk: 'ta1', field: ['kolibri'],
    snd: { kind: 'i3', hz: 1.25, turbo: 0.6, loud: 0.8 },
    expect: { t100: [4.91, 5.76], vmax: [149, 158], latG: [2.1, 2.2], d100: [22.7, 25.1] },
    partNames: { spoiler: 'roof spoiler' },
    parts: { set: 'car', ht: 1.4, y0: 0.18,
      extra: {
        spoiler: { z: 1, th: 0.6, m: 2, r: 0.4, h: 0.05, lx: -0.95, lz: 0, f: 0.97 },
      },
    },
    look: null,
  });
})();
