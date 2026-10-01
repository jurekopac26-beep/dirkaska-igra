/* Vehicle 'strelica' — STRELICA 61: an early-1960s cigar-shaped Formula car, mid-engined. Signature features: 1) a slim cigar body with
   an oval nose intake, 2) exposed wheels on wishbones, 3) exhaust stacks curling up behind the engine, 4) a wrap-around aero screen and
   the driver in view, 5) small mirrors on the cockpit sides. L 3.60 W 1.50 H 0.95, wheelbase 2.30, overhangs F 0.55 R 0.75 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'strelica', name: 'STRELICA 61', cat: 'dirkalni', ord: 4, drive: 'MR',
    desc: 'Cigarast dirkalnik formule iz zgodnjih 60-ih: odprta kolesa in izpušne cevi.',
    phys: { mass: 460, a: 1.25, b: 1.05, kI: 0.95, kw: 140, redline: 8500, idle: 1500, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 4.98, rw: 0.33, cDrag: 0.62, len: 3.6, wid: 1.5, steerMax: 0.52,
      tracK: 1.1, brakeK: 1.05, spinK: 0.3, loose: 0.85, dmgK: 1.2 },
    arc: { amax: 1.62, kv: 2.4, rmin: 5 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.16, pwr: 0.07, out: 1.05, turn: 1.15, w: 1.02, tv: 0.85 },   // (the MR layer: quick turn-in, lift rotation; its own liftP, pwr, out, turn, tv)
    stats: { power: 4, grip: 5, weight: 10, drift: 8 },
    price: 70000, pk: 'ta1', field: ['strelica'],
    snd: { kind: 'v8hi', hz: 1.4, loud: 1.2 },
    expect: { t100: [3.03, 3.55], vmax: [217, 230], latG: [2.07, 2.17], d100: [21.4, 23.7] },
    partNames: { nose: 'nose cone', cover: 'engine cover' },
    parts: { set: 'none', ht: 0.95, y0: 0.12,
      extra: {
        nose: { z: 0, th: 0.5, m: 5, r: 0.35, h: 0.25, lx: 0.92, lz: 0, f: 0.35 },
        cover: { z: 1, th: 0.7, m: 6, rW: 0.3, h: 0.06, lx: -0.45, lz: 0, f: 0.72 },
        mirrorL: { lx: 0.12, lz: -0.45, f: 0.85 },
        mirrorR: { lx: 0.12, lz: 0.45, f: 0.85 },
      },
    },
    look: null,
  });
})();
