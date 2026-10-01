/* Vehicle 'superkombi' — SUPERKOMBI: a 1980s / 90s racing van, a race engine in the middle. Signature features: 1) a one-box van body
   lowered over wide race wheels, 2) big side intakes for the mid-mounted engine, 3) a rear wing across the roof edge, 4) a deep front
   spoiler, 5) flared arches and a race livery. L 4.70 W 1.95 H 1.75, wheelbase 2.80, overhangs F 0.85 R 1.05 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'superkombi', name: 'SUPERKOMBI', cat: 'posebni', ord: 1, drive: 'MR',
    desc: 'Dirkalni kombi iz 80-ih in 90-ih z dirkalnim motorjem na sredini.',
    phys: { mass: 1250, a: 1.5, b: 1.3, kI: 1.28, kw: 520, redline: 8500, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.84, rw: 0.34, cDrag: 0.5, len: 4.7, wid: 1.95, steerMax: 0.6,
      tracK: 1.1, brakeK: 1.05, spinK: 0.25, aero: 0.00005, loose: 0.8, sway: 1.3, aiGap: 7.5, aiPass: 4 },   // (aiGap / aiPass: its AI follows further back and passes wider: fewer pile-ups on the Nordschleife, tests/fleet.test.js 8b)
    arc: { amax: 1.8, kv: 2.2, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.14, pwr: 0.07, out: 1.2, turn: 1.05, w: 1.02 },   // (the MR layer: quick turn-in, lift rotation; its own liftP, pwr, turn)
    stats: { power: 10, grip: 10, weight: 7, drift: 6 },
    price: 70000, pk: 'unl', field: ['superkombi'],
    snd: { kind: 'v10', hz: 1, loud: 1.2 },
    expect: { t100: [2.97, 3.48], vmax: [259, 275], latG: [2.39, 2.49], d100: [21.6, 23.9] },
    parts: { set: 'race', ht: 1.75, y0: 0.14 },
    look: null,
  });
})();
