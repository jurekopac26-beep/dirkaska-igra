/* Vehicle 'tiger' — TIGER GT: a front-engined GT racer. Signature features: 1) a long bonnet with louvres over the wheels, 2) a big rear
   wing on swan-neck mounts, 3) a rear diffuser, 4) a front splitter with dive planes, 5) wide arches and centre-lock wheels. L 4.70 W
   2.05 H 1.25, wheelbase 2.70, overhangs F 1.05 R 0.95 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'tiger', name: 'TIGER GT', cat: 'dirkalni', ord: 2, drive: 'FR',
    desc: 'Dirkalnik GT z dolgim pokrovom motorja, velikim krilom in difuzorjem.',
    phys: { mass: 1300, a: 1.3, b: 1.4, kI: 1.28, kw: 405, redline: 8000, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.73, rw: 0.34, cDrag: 0.42, len: 4.7, wid: 2.05, steerMax: 0.58,
      tracK: 1.2, brakeK: 1.15, spinK: 0.25, aero: 0.00007, loose: 0.72 },
    arc: { amax: 1.9, kv: 2.6, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.1, pwr: 0.06, out: 1, turn: 1.12, w: 0.98, tv: 0.75 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 10, grip: 10, weight: 6, drift: 4 },
    price: 85000, pk: 'ppo', field: ['tiger'],
    snd: { kind: 'v8fp', hz: 1.05, loud: 1.2 },
    expect: { t100: [2.68, 3.15], vmax: [249, 264], latG: [2.56, 2.66], d100: [20, 22.1] },
    partNames: { splitter: 'front splitter', diffuser: 'diffuser' },
    parts: { set: 'race', ht: 1.25, y0: 0.1,
      over: {
        bumperF: { df: 0 },
      },
      extra: {
        splitter: { z: 0, th: 0.45, m: 3, rW: 0.42, h: 0.04, lx: 1, lz: 0, f: 0.02, df: 0.3 },
        diffuser: { z: 1, th: 0.55, m: 4, rW: 0.45, h: 0.05, lx: -0.98, lz: 0, f: 0.03, df: 0.15 },
      },
    },
    look: null,
  });
})();
