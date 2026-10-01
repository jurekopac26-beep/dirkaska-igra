/* Vehicle 'hrosc' — SKAKAČ 1600: a Baja-style cut-down beetle, rear air-cooled flat four. Signature features: 1) the round beetle cabin on
   a raised long-travel chassis, 2) an exo-cage over the roof and down to the bumpers, 3) cut-away short wings over big off-road tyres, 4)
   a light bar on the roof hoop, 5) the exposed engine at the rear. L 3.90 W 1.80 H 1.55, wheelbase 2.40, overhangs F 0.62 R 0.88 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'hrosc', name: 'SKAKAČ 1600', cat: 'teren', ord: 3, drive: 'RR',
    desc: 'Puščavski skakač z motorjem zadaj: dolg hod vzmetenja, zunanja kletka in luči na strehi.',
    phys: { mass: 850, a: 1.33, b: 1.07, kI: 1.05, kw: 110, redline: 6000, idle: 850, gears: [3.4, 2.1, 1.42, 1], final: 4.51, rw: 0.38, cDrag: 0.5, len: 3.9, wid: 1.8, steerMax: 0.62,
      tracK: 0.95, brakeK: 0.9, spinK: 0.6, loose: 1.2, looseDrag: 0.45, landV: 18, landK: 0.5, sway: 1.5 },
    arc: { amax: 1.55, kv: 1.85, rmin: 4.6 },
    csp: { bx: 0.15, coast: -0.04, thr: 0.01, liftP: 0.2, pwr: 0.07, out: 1.3, turn: 1.08, w: 1, tv: 1.12 },   // (the RR layer: the engine behind the rear axle, a pendulum on a lift; its own out, tv)
    stats: { power: 2, grip: 4, weight: 10, drift: 9 },
    price: 16000, pk: 'ta1', field: ['hrosc'],
    snd: { kind: 'flat4', hz: 1.05, loud: 1 },
    expect: { t100: [3.36, 3.94], vmax: [174, 185], latG: [1.98, 2.08], d100: [24.8, 27.4] },
    partNames: { cover: 'engine lid', lightbar: 'light bar' },
    parts: { set: 'none', ht: 1.55, y0: 0.42,
      extra: {
        hood: {},
        cover: { z: 1, th: 0.72, m: 6, rW: 0.36, h: 0.06, lx: -0.68, lz: 0, f: 0.45 },
        fenderL: {},
        fenderR: {},
        lightbar: { z: 0, th: 0.45, m: 3, rW: 0.3, h: 0.12, lx: 0.3, lz: 0, f: 1 },
      },
    },
    look: null,
  });
})();
