/* Vehicle 'medved' — MEDVED 4x4: a boxy luxury off-roader. Signature features: 1) a tall slab-sided box with flat glass, 2) a spare wheel
   on the side-hinged tailgate, 3) a roof rack the length of the roof, 4) round headlamps and a slatted grille, 5) flared arches over big
   all-terrain tyres. L 4.80 W 1.98 H 1.95, wheelbase 2.85, overhangs F 0.90 R 1.05 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'medved', name: 'MEDVED 4x4', cat: 'teren', ord: 2, drive: 'AWD',
    desc: 'Škatlast luksuzni terenec z rezervnim kolesom na zadnjih vratih in strešnim nosilcem.',
    phys: { mass: 2300, a: 1.5, b: 1.35, kI: 1.4, kw: 430, redline: 6200, idle: 700, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 5.53, rw: 0.38, cDrag: 0.62, len: 4.8, wid: 1.98, steerMax: 0.6,
      tracK: 0.85, brakeK: 0.85, spinK: 0.4, loose: 1.15, looseDrag: 0.5, landV: 16, landK: 0.6, sway: 1.6 },
    arc: { amax: 1.56, kv: 1.85, rmin: 5.6 },
    csp: { bx: 0.12, coast: -0.07, thr: -0.015, liftP: 0, pwr: 0.03, out: 1.05, turn: 0.85, w: 0.95, tv: 1.15 },   // (the AWD layer: steady, straightens quickly; its own coast, turn, out, w, tv)
    stats: { power: 9, grip: 4, weight: 1, drift: 8 },
    price: 50000, pk: 'open', field: ['medved'],
    snd: { kind: 'v8', hz: 0.8, loud: 1.1 },
    expect: { t100: [3.18, 3.73], vmax: [184, 195], latG: [1.99, 2.09], d100: [25.8, 28.5] },
    partNames: { tailgate: 'tailgate', spare: 'spare wheel', roofRack: 'roof rack' },
    parts: { set: 'car', ht: 1.95, y0: 0.32, drop: ['trunk'],
      extra: {
        tailgate: { z: 1, th: 0.78, m: 12, rW: 0.4, h: 0.07, lx: -0.98, lz: 0, f: 0.5 },
        spare: { z: 1, th: 0.6, m: 10, r: 0.42, h: 0.3, lx: -1.03, lz: 0, f: 0.42 },
        roofRack: { z: 1, th: 0.7, m: 6, rW: 0.4, h: 0.15, lx: -0.12, lz: 0, f: 1.02 },
      },
    },
    look: null,
  });
})();
