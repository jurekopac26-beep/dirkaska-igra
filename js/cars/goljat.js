/* Vehicle 'goljat' — GOLJAT: a monster truck: a pickup shell on a tube chassis. Signature features: 1) a pickup body shell lifted high on
   a tube chassis, 2) four huge flotation tyres, 3) long-travel shock absorbers in plain view, 4) a roll cage under the shell, 5) a
   supercharger stack poking through the bonnet. L 5.00 W 3.20 H 3.20, wheelbase 3.40, overhangs F 0.78 R 0.82 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'goljat', name: 'GOLJAT', cat: 'posebni', ord: 3, drive: 'AWD',
    desc: 'Pošastni tovornjak: lupina poltovornjaka na cevni šasiji in ogromna kolesa.',
    phys: { mass: 4500, a: 1.72, b: 1.68, kI: 1.5, kw: 1100, redline: 7000, idle: 1000, gears: [2.5, 1.55, 1], final: 12.93, rw: 0.84, cDrag: 1.3, len: 5, wid: 3.2, steerMax: 0.6,
      tracK: 0.7, brakeK: 0.7, spinK: 0.6, loose: 1.2, looseDrag: 0.35, landV: 24, landK: 0.4, dmgK: 0.5, sway: 2.5 },
    arc: { amax: 1.45, kv: 1.8, rmin: 7 },
    csp: { bx: 0.12, coast: -0.08, thr: -0.015, liftP: 0, pwr: 0.06, out: 1.2, turn: 0.75, w: 0.9, tv: 1.3 },   // (the AWD layer: steady, straightens quickly; its own pwr, out, turn, w, tv)
    stats: { power: 10, grip: 2, weight: 1, drift: 10 },
    price: 55000, pk: 'open', field: ['goljat'], fieldN: 7,
    snd: { kind: 'v8s', hz: 0.8, loud: 1.4 },
    expect: { t100: [4.22, 4.95], vmax: [158, 167], latG: [1.89, 1.99], d100: [28.7, 31.8] },
    partNames: { bed: 'pickup bed', tailgate: 'tailgate' },
    parts: { set: 'none', ht: 3.2, y0: 1.2,
      extra: {
        hood: {},
        doorL: {},
        doorR: {},
        bumperF: {},
        bumperR: {},
        bed: { z: 1, th: 0.7, m: 12, rW: 0.4, h: 0.1, lx: -0.62, lz: 0, f: 0.62 },
        tailgate: { z: 1, th: 0.7, m: 10, rW: 0.38, h: 0.08, lx: -0.97, lz: 0, f: 0.5 },
      },
    },
    look: null,
  });
})();
