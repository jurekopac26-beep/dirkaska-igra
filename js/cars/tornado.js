/* Vehicle 'tornado' — TORNADO V8: an American oval-track stock car. Signature features: 1) a long saloon silhouette on a stock-car
   chassis, 2) big numbers on the doors and the roof, 3) window nets in the side windows, 4) a blade spoiler across the tail, 5) a flat
   splitter and roof flaps. L 5.05 W 2.00 H 1.30, wheelbase 2.79, overhangs F 1.12 R 1.14 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'tornado', name: 'TORNADO V8', cat: 'dirkalni', ord: 3, drive: 'FR',
    desc: 'Ameriški dirkalnik za ovale z velikimi številkami in mrežami na oknih.',
    phys: { mass: 1550, a: 1.4, b: 1.39, kI: 1.38, kw: 560, redline: 8800, idle: 900, gears: [2.2, 1.6, 1.25, 1], final: 4.2, rw: 0.34, cDrag: 0.5, len: 5.05, wid: 2, steerMax: 0.58,
      tracK: 1.1, brakeK: 1.05, spinK: 0.3, aero: 0.00004, loose: 0.78 },
    arc: { amax: 1.78, kv: 2.2, rmin: 5 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.12, pwr: 0.1, out: 1.15, turn: 1, w: 1, tv: 0.9 },   // (the FR layer: lift-off and power rotation; its own pwr, liftP, out, tv)
    stats: { power: 10, grip: 9, weight: 4, drift: 7 },
    price: 65000, pk: 'unl', field: ['tornado'],
    snd: { kind: 'v8', hz: 0.85, loud: 1.3 },
    expect: { t100: [2.97, 3.49], vmax: [247, 262], latG: [2.35, 2.45], d100: [21.6, 23.9] },
    parts: { set: 'race', ht: 1.3, y0: 0.12,
      over: {
        wing: { f: 0.62, lx: -0.97, m: 4 },
      },
    },
    look: null,
  });
})();
