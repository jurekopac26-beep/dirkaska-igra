/* Vehicle 'gad' — GAD 7L: a 1960s V8 roadster. Signature features: 1) bulging flared wheel arches front and rear, 2) side exhaust pipes
   along the sills, 3) a roll bar behind the seats, 4) an oval mouth with a bar across it, 5) twin racing stripes over the bonnet and the
   tail. L 3.96 W 1.73 H 1.22, wheelbase 2.29, overhangs F 0.78 R 0.89 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'gad', name: 'GAD 7L', cat: 'klasika', ord: 2, drive: 'FR',
    desc: 'Ameriški roadster iz 60-ih z velikim V8, stranskimi izpuhi in razširjenimi blatniki.',
    phys: { mass: 1100, a: 1.2, b: 1.09, kI: 1.12, kw: 300, redline: 6500, idle: 750, gears: [2.5, 1.75, 1.3, 1], final: 3.31, rw: 0.33, cDrag: 0.5, len: 3.96, wid: 1.73, steerMax: 0.62,
      tracK: 0.95, brakeK: 0.9, spinK: 1, aiGap: 7.5, aiPass: 4 },   // (aiGap / aiPass: its AI follows further back and passes wider: fewer pile-ups on the Nordschleife, tests/fleet.test.js 8b)
    arc: { amax: 1.58, kv: 1.9, rmin: 4.4 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.16, pwr: 0.14, out: 1.4, turn: 1.02, w: 0.97, tv: 1.1 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 8, grip: 4, weight: 8, drift: 10 },
    price: 55000, pk: 'ppo', field: ['gad'],
    snd: { kind: 'v8', hz: 0.9, loud: 1.2 },
    expect: { t100: [3.5, 4.11], vmax: [224, 238], latG: [2.02, 2.12], d100: [24.8, 27.4] },
    partNames: { pipeL: 'left side pipe', pipeR: 'right side pipe' },
    parts: { set: 'open', ht: 1.22, y0: 0.18,
      extra: {
        pipeL: { z: 2, th: 0.6, m: 3, r: 0.35, h: 0.1, lx: -0.1, lz: -1.02, f: 0.06 },
        pipeR: { z: 3, th: 0.6, m: 3, r: 0.35, h: 0.1, lx: -0.1, lz: 1.02, f: 0.06 },
      },
    },
    look: null,
  });
})();
