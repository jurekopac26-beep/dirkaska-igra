/* Vehicle 'predsednik' — PREDSEDNIK: a stretch state limousine. Signature features: 1) a very long three-box body with six side windows,
   2) small flags on the front wings, 3) chrome grille, bumpers and window frames, 4) four doors and a long boot, 5) whitewall tyres. L
   6.20 W 1.95 H 1.45, wheelbase 4.40, overhangs F 0.85 R 0.95 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'predsednik', name: 'PREDSEDNIK', cat: 'posebni', ord: 2, drive: 'FR',
    desc: 'Raztegnjena limuzina z zastavicama na blatnikih in obilo kroma.',
    phys: { mass: 2900, a: 2.25, b: 2.15, kI: 1.65, kw: 300, redline: 5800, idle: 650, gears: [2.9, 1.8, 1.3, 1, 0.8], final: 5.37, rw: 0.36, cDrag: 0.45, len: 6.2, wid: 1.95, steerMax: 0.58,
      tracK: 0.7, brakeK: 0.75, spinK: 0.3, sway: 1.4, dmgK: 0.85 },
    arc: { amax: 1.5, kv: 1.8, rmin: 7.5 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.06, pwr: 0.05, out: 1.25, turn: 0.75, w: 0.92, tv: 1.18 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 7, grip: 3, weight: 1, drift: 9 },
    price: 40000, pk: 'open', field: ['predsednik'], fieldN: 9,
    snd: { kind: 'v8', hz: 0.7, loud: 0.8 },
    expect: { t100: [4.95, 5.81], vmax: [167, 177], latG: [1.91, 2.01], d100: [29.3, 32.3] },
    partNames: { door2L: 'rear left door', door2R: 'rear right door', flagL: 'left flag', flagR: 'right flag' },
    parts: { set: 'car', ht: 1.45, y0: 0.2,
      over: {
        doorL: { lx: 0.22 },
        doorR: { lx: 0.22 },
      },
      extra: {
        door2L: { z: 2, th: 0.72, m: 9, r: 0.6, h: 0.08, lx: -0.3, lz: -1, f: 0.38 },
        door2R: { z: 3, th: 0.72, m: 9, r: 0.6, h: 0.08, lx: -0.3, lz: 1, f: 0.38 },
        flagL: { z: 0, th: 0.4, m: 1, r: 0.3, h: 0.05, lx: 0.78, lz: -0.85, f: 0.62 },
        flagR: { z: 0, th: 0.4, m: 1, r: 0.3, h: 0.05, lx: 0.78, lz: 0.85, f: 0.62 },
      },
    },
    look: null,
  });
})();
