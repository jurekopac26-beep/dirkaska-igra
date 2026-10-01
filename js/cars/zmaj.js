/* Vehicle 'zmaj' — ZMAJ 85: a 1985 Group B short-wheelbase four-wheel-drive rally car. Signature features: 1) a short wheelbase with long
   overhangs, 2) huge front and rear wings, 3) a radiator grille in the front bumper, 4) boxy flared arches, 5) a roof vent and louvred
   rear window. L 4.24 W 1.80 H 1.34, wheelbase 2.22, overhangs F 0.95 R 1.07 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'zmaj', name: 'ZMAJ 85', cat: 'reli', ord: 2, drive: 'AWD',
    desc: 'Relijska pošast skupine B iz leta 1985: kratka medosna razdalja in ogromna krila.',
    phys: { mass: 1090, a: 1.17, b: 1.05, kI: 1.12, kw: 350, redline: 8000, idle: 1000, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 4.16, rw: 0.33, cDrag: 0.46, len: 4.24, wid: 1.8, steerMax: 0.64,
      tracK: 1.1, brakeK: 1.05, spinK: 0.3 },
    arc: { amax: 1.8, kv: 2.05, rmin: 4 },
    csp: { bx: 0.13, coast: -0.075, thr: -0.01, liftP: 0, pwr: 0.05, out: 1, turn: 1.08, w: 1 },   // (the AWD layer: steady, straightens quickly; its own bx, coast, thr, pwr, out, turn, w)
    stats: { power: 9, grip: 8, weight: 8, drift: 5 },
    price: 75000, pk: 'open', field: ['zmaj'],
    snd: { kind: 'i5', hz: 1, turbo: 1, loud: 1.2 },
    expect: { t100: [2.4, 2.82], vmax: [244, 259], latG: [2.3, 2.4], d100: [21.7, 24] },
    partNames: { grille: 'radiator grille' },
    parts: { set: 'race', ht: 1.34, y0: 0.18,
      extra: {
        grille: { z: 0, th: 0.55, m: 4, r: 0.45, h: 0.1, lx: 0.97, lz: 0, f: 0.3 },
      },
    },
    look: null,
  });
})();
