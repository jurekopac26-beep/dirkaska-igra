/* Vehicle 'jastreb' — JASTREB 6: a 1960s British long-bonnet GT. Signature features: 1) a very long bonnet with a power bulge down its
   middle, 2) an oval grille mouth, 3) covered headlamps in the wing tips, 4) a short fastback tail, 5) wire wheels with knock-off
   spinners. L 4.45 W 1.66 H 1.22, wheelbase 2.44, overhangs F 0.90 R 1.11 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'jastreb', name: 'JASTREB 6', cat: 'klasika', ord: 1, drive: 'FR',
    desc: 'Britanski GT iz 60-ih: dolg pokrov motorja, ovalna maska in žična platišča.',
    phys: { mass: 1250, a: 1.33, b: 1.11, kI: 1.22, kw: 200, redline: 6000, idle: 750, gears: [3, 1.9, 1.35, 1], final: 3.38, rw: 0.33, cDrag: 0.4, len: 4.45, wid: 1.66, steerMax: 0.62,
      brakeK: 0.9, spinK: 0.6 },
    arc: { amax: 1.6, kv: 1.9, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.15, pwr: 0.1, out: 1.35, turn: 0.96, w: 1, tv: 1.08 },   // (the FR layer: lift-off and power rotation; its own out, tv, turn)
    stats: { power: 5, grip: 4, weight: 7, drift: 10 },
    price: 40000, pk: 'ta1', field: ['jastreb'],
    snd: { kind: 'i6', hz: 0.95, loud: 1 },
    expect: { t100: [3.32, 3.9], vmax: [202, 214], latG: [2.04, 2.14], d100: [25, 27.6] },
    parts: { set: 'car', ht: 1.22, y0: 0.2 },
    look: null,
  });
})();
