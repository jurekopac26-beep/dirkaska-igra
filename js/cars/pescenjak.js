/* Vehicle 'pescenjak' — PEŠČENJAK: a desert marathon-rally buggy, mid-engined. Signature features: 1) an exposed tube frame with a low
   body around it, 2) two spare wheels standing behind the cabin, 3) a tall air snorkel beside the roof, 4) huge long-travel wheels in
   open arches, 5) a roof light pod and a flat nose. L 4.60 W 2.30 H 1.85, wheelbase 2.90, overhangs F 0.82 R 0.88 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'pescenjak', name: 'PEŠČENJAK', cat: 'teren', ord: 1, drive: 'MR',
    desc: 'Puščavski buggy za maratonske relije: cevni okvir, rezervni kolesi in dihalka.',
    phys: { mass: 1500, a: 1.48, b: 1.42, kI: 1.3, kw: 260, redline: 6500, idle: 800, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 6.97, rw: 0.45, cDrag: 0.6, len: 4.6, wid: 2.3, steerMax: 0.62,
      tracK: 0.9, brakeK: 0.85, spinK: 0.6, loose: 1.3, looseDrag: 0.4, landV: 20, landK: 0.5, sway: 1.7, dmgK: 0.8 },
    arc: { amax: 1.55, kv: 1.85, rmin: 5.4 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.08, pwr: 0.06, out: 1.15, turn: 0.9, w: 0.95, tv: 1.15 },   // (the MR layer: quick turn-in, lift rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 7, grip: 4, weight: 5, drift: 9 },
    price: 55000, pk: 'ppo', field: ['pescenjak'],
    snd: { kind: 'v8', hz: 0.85, loud: 1.2 },
    expect: { t100: [3.75, 4.4], vmax: [181, 192], latG: [1.98, 2.08], d100: [25.9, 28.6] },
    partNames: { nose: 'front panel', cover: 'engine cover', spareL: 'spare wheel', spareR: 'spare wheel', snorkel: 'snorkel' },
    parts: { set: 'none', ht: 1.85, y0: 0.45,
      extra: {
        nose: { z: 0, th: 0.55, m: 6, rW: 0.35, h: 0.1, lx: 0.9, lz: 0, f: 0.3 },
        cover: { z: 1, th: 0.72, m: 9, rW: 0.38, h: 0.08, lx: -0.55, lz: 0, f: 0.6 },
        spareL: { z: 2, th: 0.65, m: 10, r: 0.42, h: 0.3, lx: -0.3, lz: -0.85, f: 0.55 },
        spareR: { z: 3, th: 0.65, m: 10, r: 0.42, h: 0.3, lx: -0.3, lz: 0.85, f: 0.55 },
        snorkel: { z: 3, th: 0.5, m: 2, r: 0.25, h: 0.1, lx: 0.05, lz: 0.9, f: 0.95 },
      },
    },
    look: null,
  });
})();
