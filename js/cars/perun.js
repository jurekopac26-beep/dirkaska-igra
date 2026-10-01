/* Vehicle 'perun' — PERUN V12: a 1980s wedge-shaped mid-engined supercar. Signature features: 1) a flat wedge nose and a steep
   windscreen, 2) scissor doors, 3) NACA ducts in the doors and big intakes behind them, 4) a huge rear wing on two pylons, 5) very wide
   rear wheel arches. L 4.14 W 2.00 H 1.07, wheelbase 2.50, overhangs F 0.78 R 0.86 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'perun', name: 'PERUN V12', cat: 'super', ord: 1, drive: 'MR',
    desc: 'Klinast superšportnik iz 80-ih s škarjastimi vrati, dovodi NACA in ogromnim krilom.',
    phys: { mass: 1490, a: 1.29, b: 1.21, kI: 1.2, kw: 420, redline: 7800, idle: 950, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 3.86, rw: 0.32, cDrag: 0.38, len: 4.14, wid: 2, steerMax: 0.6,
      tracK: 1.1, brakeK: 1.05, spinK: 0.3 },
    arc: { amax: 1.8, kv: 2, rmin: 4.6 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.18, pwr: 0.08, out: 1.2, turn: 1.15, w: 1.02 },   // (the MR layer: quick turn-in, lift rotation)
    stats: { power: 10, grip: 8, weight: 5, drift: 7 },
    price: 85000, pk: 'ppo', field: ['perun'],
    snd: { kind: 'v12', hz: 1.05, loud: 1.2 },
    expect: { t100: [2.97, 3.49], vmax: [248, 264], latG: [2.3, 2.4], d100: [21.8, 24.1] },
    parts: { set: 'race', ht: 1.07, y0: 0.16 },
    look: null,
  });
})();
