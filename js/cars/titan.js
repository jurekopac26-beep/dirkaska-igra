/* Vehicle 'titan' — TITAN: THE racing truck: a European truck-racing tractor unit (cab-over, 160 km/h limiter). Signature features: 1) a
   flat cab-over front with a big grille and four lamps, 2) a roof deflector over the cab, 3) side skirts between the axles, 4) twin
   vertical exhaust stacks behind the cab, 5) a bare racing chassis behind the cab with the rear bumper bar, 6) big single wheels on deep
   rims. L 5.90 W 2.50 H 3.00, wheelbase 3.70, overhangs F 1.30 R 0.90 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'titan', name: 'TITAN', cat: 'tovornjaki', ord: 1, drive: 'FR',
    desc: 'Dirkalni tovornjak: kabina nad motorjem, strešni deflektor in omejilnik pri 160 km/h.',
    phys: { mass: 5300, a: 1.65, b: 2.05, kI: 1.6, kw: 820, redline: 2800, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 3.42, rw: 0.55, cDrag: 0.8, len: 5.9, wid: 2.5, steerMax: 0.55,
      tracK: 0.55, brakeK: 0.7, spinK: 0.4, dmgK: 0.6, vLim: 160, sway: 1.4, landV: 13 },
    arc: { amax: 1.42, kv: 1.8, rmin: 7.5 },
    csp: { bx: 0.12, coast: -0.06, thr: -0.01, liftP: 0.04, pwr: 0.04, out: 1.2, turn: 0.75, w: 0.92, tv: 1.2 },   // (the FR layer: lift-off and power rotation; its own bx, coast, thr, liftP, pwr, out, turn, w, tv)
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },
    price: 60000, pk: 'open', field: ['titan'], fieldN: 9,
    snd: { kind: 'diesel', hz: 1, turbo: 0.8, loud: 1.3 },
    expect: { t100: [6.69, 7.86], vmax: [153, 163], latG: [1.82, 1.92], d100: [30.1, 33.2] },
    partNames: { grille: 'front grille', deflector: 'roof deflector', skirtL: 'left side skirt', skirtR: 'right side skirt' },
    parts: { set: 'truck', ht: 3, y0: 0.6,
      extra: {
        grille: { z: 0, th: 0.6, m: 6, rW: 0.35, h: 0.08, lx: 1, lz: 0, f: 0.35 },
        deflector: { z: 0, th: 0.6, m: 8, rW: 0.38, h: 0.12, lx: 0.62, lz: 0, f: 0.95 },
        skirtL: { z: 2, th: 0.58, m: 7, r: 0.8, h: 0.06, lx: -0.25, lz: -1, f: 0.08 },
        skirtR: { z: 3, th: 0.58, m: 7, r: 0.8, h: 0.06, lx: -0.25, lz: 1, f: 0.08 },
      },
    },
    look: null,
  });
})();
