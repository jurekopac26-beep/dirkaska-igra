/* Vehicle 'bizon' — BIZON 70: a 1970 big-block open sports-racer (Can-Am style). Signature features: 1) a low open body with the driver
   in a small screen, 2) a high wing on tall struts over the engine, 3) big intakes behind the roll hoop, 4) fat rear tyres under bulging
   rear wings, 5) a wide flat nose. L 4.20 W 2.05 H 1.00, wheelbase 2.40, overhangs F 0.95 R 0.85 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'bizon', name: 'BIZON 70', cat: 'dirkalni', ord: 6, drive: 'MR',
    desc: 'Odprt dirkalnik iz leta 1970 z velikim motorjem in visokim krilom na nosilcih.',
    phys: { mass: 750, a: 1.15, b: 1.25, kI: 1.15, kw: 550, redline: 7500, idle: 1000, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 3.24, rw: 0.34, cDrag: 0.55, len: 4.2, wid: 2.05, steerMax: 0.56,
      tracK: 1.3, brakeK: 1.15, spinK: 0.12, aero: 0.0001, loose: 0.66 },
    arc: { amax: 1.9, kv: 2.6, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.12, pwr: 0.07, out: 1.05, turn: 1.15, w: 0.97, tv: 0.7 },   // (the MR layer: quick turn-in, lift rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 10, grip: 10, weight: 10, drift: 4 },
    price: 90000, pk: 'unl', field: ['bizon'],
    snd: { kind: 'v8fp', hz: 0.85, loud: 1.3 },
    expect: { t100: [2.47, 2.9], vmax: [303, 322], latG: [2.62, 2.72], d100: [19.9, 22] },
    partNames: { nose: 'nose section', cover: 'engine cover' },
    parts: { set: 'none', ht: 1, y0: 0.12,
      extra: {
        nose: { z: 0, th: 0.55, m: 9, rW: 0.45, h: 0.1, lx: 0.8, lz: 0, f: 0.35, df: 0.3 },
        cover: { z: 1, th: 0.7, m: 10, rW: 0.45, h: 0.08, lx: -0.55, lz: 0, f: 0.55 },
        wing: { y: 1.25, lx: -0.85 },
        fenderL: {},
        fenderR: {},
      },
    },
    look: null,
  });
})();
