/* Vehicle 'blisk' — BLISK 30: a 1920s / 30s Grand Prix car, supercharged straight eight. Signature features: 1) a slim single-seat body
   on exposed wire wheels, 2) a generic oval radiator cowl, 3) a long louvred bonnet held by leather straps, 4) a pointed boat tail behind
   the driver, 5) outside exhaust pipe and a tiny aero screen. L 3.70 W 1.35 H 1.10, wheelbase 2.40, overhangs F 0.55 R 0.75 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'blisk', name: 'BLISK 30', cat: 'klasika', ord: 3, drive: 'FR',
    desc: 'Dirkalnik za veliko nagrado iz 30-ih: ovalna maska, žična kolesa in čolnast rep.',
    phys: { mass: 750, a: 1.3, b: 1.1, kI: 1, kw: 100, redline: 6000, idle: 800, gears: [2.8, 1.8, 1.3, 1], final: 4.49, rw: 0.36, cDrag: 0.6, len: 3.7, wid: 1.35, steerMax: 0.6,
      tracK: 0.9, brakeK: 0.8, spinK: 0.7, dmgK: 1.15, loose: 0.95 },
    arc: { amax: 1.48, kv: 1.8, rmin: 5 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.15, pwr: 0.1, out: 1.4, turn: 0.95, w: 1, tv: 1.15 },   // (the FR layer: lift-off and power rotation; its own out, tv, turn)
    stats: { power: 2, grip: 2, weight: 10, drift: 10 },
    price: 30000, pk: 'ta1', field: ['blisk'],
    snd: { kind: 'i8s', hz: 1, loud: 1.1 },
    expect: { t100: [3.85, 4.52], vmax: [166, 176], latG: [1.89, 1.99], d100: [27.3, 30.1] },
    partNames: { nose: 'radiator cowl', cover: 'bonnet', tail: 'boat tail' },
    parts: { set: 'none', ht: 1.1, y0: 0.22,
      extra: {
        nose: { z: 0, th: 0.5, m: 6, r: 0.4, h: 0.3, lx: 0.95, lz: 0, f: 0.45 },
        cover: { z: 0, th: 0.75, m: 8, rW: 0.3, h: 0.06, lx: 0.45, lz: 0, f: 0.82 },
        tail: { z: 1, th: 0.6, m: 7, r: 0.5, h: 0.3, lx: -0.88, lz: 0, f: 0.55 },
      },
    },
    look: null,
  });
})();
