/* Vehicle 'kamen' — KAMEN PUŠČAVA: a desert rally-raid truck with a bonneted cab. Signature features: 1) a bonnet in front of the cab
   over the engine, 2) huge single tyres on tall arches, 3) spare wheels on the flanks behind the cab, 4) a boxy service body with a roof
   hatch, 5) a grille guard and roof lamps. L 6.30 W 2.50 H 3.30, wheelbase 4.20, overhangs F 1.15 R 0.95 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'kamen', name: 'KAMEN PUŠČAVA', cat: 'tovornjaki', ord: 2, drive: 'AWD',
    desc: 'Puščavski relijski tovornjak s kabino za motorjem, velikimi kolesi in rezervnimi kolesi.',
    phys: { mass: 7000, a: 2, b: 2.2, kI: 1.75, kw: 800, redline: 2600, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 4.31, rw: 0.65, cDrag: 0.95, len: 6.3, wid: 2.5, steerMax: 0.55,
      tracK: 0.5, brakeK: 0.6, spinK: 0.5, loose: 1.3, looseDrag: 0.4, landV: 22, landK: 0.5, dmgK: 0.55, sway: 1.8 },
    arc: { amax: 1.4, kv: 1.8, rmin: 8 },
    csp: { bx: 0.12, coast: -0.07, thr: -0.015, liftP: 0, pwr: 0.03, out: 1.1, turn: 0.7, w: 0.9, tv: 1.25 },   // (the AWD layer: steady, straightens quickly; its own bx, coast, thr, pwr, out, turn, w, tv)
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },
    price: 70000, pk: 'open', field: ['kamen'], fieldN: 7,
    snd: { kind: 'diesel', hz: 0.85, turbo: 0.7, loud: 1.3 },
    expect: { t100: [6.01, 7.06], vmax: [135, 143], latG: [1.79, 1.89], d100: [33.7, 37.3] },
    partNames: { spareL: 'spare wheel', spareR: 'spare wheel' },
    parts: { set: 'truck', ht: 3.3, y0: 0.75,
      extra: {
        hood: {},
        spareL: { z: 2, th: 0.62, m: 12, r: 0.6, h: 0.4, lx: -0.3, lz: -0.9, f: 0.4 },
        spareR: { z: 3, th: 0.62, m: 12, r: 0.6, h: 0.4, lx: -0.3, lz: 0.9, f: 0.4 },
      },
    },
    look: null,
  });
})();
