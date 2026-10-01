/* Vehicle 'sokol' — SOKOL R: a 1990s twin-turbo rotary sports coupe. Signature features: 1) a low curvy coupe with a long bonnet and a
   short tail, 2) pop-up headlamps in a smooth nose with a wide mouth, 3) a ducktail spoiler moulded into the tail, 4) round tail lamps
   under a dark full-width panel, 5) a double-bubble roof. L 4.29 W 1.76 H 1.23, wheelbase 2.43, overhangs F 0.95 R 0.91 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'sokol', name: 'SOKOL R', cat: 'sportni', ord: 1, drive: 'FR',
    desc: 'Japonski kupe z dvojnim turbo rotacijskim motorjem, dvižnimi žarometi in račjim repom.',
    phys: { mass: 1260, a: 1.2, b: 1.23, kI: 1.2, kw: 250, redline: 8000, idle: 1000, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 4.11, rw: 0.31, cDrag: 0.33, len: 4.29, wid: 1.76, steerMax: 0.62,
      spinK: 0.5 },
    arc: { amax: 1.75, kv: 2, rmin: 4.3 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.15, pwr: 0.1, out: 1.3, turn: 1, w: 1 },   // (the FR layer: lift-off and power rotation)
    stats: { power: 7, grip: 7, weight: 7, drift: 8 },
    price: 35000, pk: 'ta1', field: null,
    snd: { kind: 'rotary', hz: 1, turbo: 0.7, loud: 1 },
    expect: { t100: [3.27, 3.84], vmax: [231, 245], latG: [2.23, 2.33], d100: [22.9, 25.3] },
    parts: { set: 'race', ht: 1.23, y0: 0.18,
      over: {
        wing: { f: 0.72, lx: -0.95, m: 3 },
      },
    },
    look: null,
  });
})();
