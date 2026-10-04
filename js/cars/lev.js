/* Vehicle 'lev' — LEV R: the world-rally hatchback of the LEV family (the rally sibling of the LEV S). Signature features: 1) the LEV S's
   three-door body with very wide flared arches, 2) a big rear wing on the tailgate, 3) a roof scoop, 4) mudflaps behind every wheel, 5) a
   spot-lamp pod on the bonnet and a splitter. L 4.00 W 1.80 H 1.42, wheelbase 2.47, overhangs F 0.78 R 0.75 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'lev', name: 'LEV R', cat: 'reli', ord: 1, drive: 'AWD',
    desc: 'Relijski dirkač za svetovno prvenstvo: široki blatniki, veliko krilo, zajemalka na strehi.',
    phys: { mass: 1230, a: 1.22, b: 1.25, kI: 1.12, kw: 300, redline: 8000, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.91, rw: 0.32, cDrag: 0.44, len: 4, wid: 1.8, steerMax: 0.64,
      tracK: 1.1, brakeK: 1.05, spinK: 0.3 },
    arc: { amax: 1.82, kv: 2.05, rmin: 4.1 },
    csp: { bx: 0.13, coast: -0.077, thr: -0.015, liftP: 0, pwr: 0.035, out: 0.95, turn: 1.05, w: 1 },   // (the AWD layer: steady, straightens quickly; its own bx, coast, thr, pwr, out, turn, w)
    stats: { power: 8, grip: 8, weight: 7, drift: 5 },
    price: 45000, pk: 'open', field: ['lev'],
    snd: { kind: 'i4', hz: 1.15, turbo: 1, loud: 1.1 },
    expect: { t100: [2.42, 2.84], vmax: [225, 239], latG: [2.33, 2.43], d100: [21.7, 24] },
    partNames: { scoop: 'roof scoop', flapL: 'left mudflap', flapR: 'right mudflap' },
    parts: { set: 'race', ht: 1.42, y0: 0.18,
      extra: {
        scoop: { z: 0, th: 0.62, m: 2, r: 0.3, h: 0.08, lx: 0.02, lz: 0, f: 1 },
        flapL: { z: 2, th: 0.5, m: 1, r: 0.25, h: 0.03, lx: -0.62, lz: -0.92, f: 0.06 },
        flapR: { z: 3, th: 0.5, m: 1, r: 0.25, h: 0.03, lx: -0.62, lz: 0.92, f: 0.06 },
      },
    },
    look: null,
  });
})();
