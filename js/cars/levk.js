/* Vehicle 'levk' — LEV KABRIO: the LEV family's coupé-cabriolet, its folding metal roof stowed in the boot (open top). Signature features:
   1) the LEV face (the big almond head lamps swept back along the wings, the wide mouth under a black strip, the slim grille), 2) an open
   two-seat cabin with two roll hoops behind the seats, 3) a long, high rear deck over the stowed roof and a short tail, 4) a raked
   windscreen in a bright frame, 5) the rear lamps wrapping round the corners. L 3.88 W 1.74 H 1.30, wheelbase 2.47, overhangs F 0.78 R 0.63
   (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'levk', name: 'LEV KABRIO', cat: 'mali', ord: 5, drive: 'FF',
    desc: 'Kabriolet družine LEV: kovinska streha zložena v prtljažnik, dva sedeža in roll bar.',
    phys: { mass: 1150, a: 1.15, b: 1.32, kI: 1.14, kw: 220, redline: 7200, idle: 900, gears: [3.4, 2.15, 1.55, 1.2, 0.98, 0.83], final: 4.1, rw: 0.32, cDrag: 0.42, len: 3.88, wid: 1.74, steerMax: 0.64 },
    arc: { amax: 1.76, kv: 2.05, rmin: 4.2 },
    csp: { bx: 0.15, coast: -0.09, thr: -0.03, liftP: 0, pwr: 0, out: 1.05, turn: 0.98, w: 1 },   // (the FF layer: a little softer than the LEV S)
    stats: { power: 6, grip: 7, weight: 8, drift: 4 },
    price: 24000, pk: 'ta1', field: ['levk'],
    snd: { kind: 'i4', hz: 1.05, turbo: 0, loud: 0.95 },
    expect: { t100: [3.04, 3.57], vmax: [210, 224], latG: [2.25, 2.35], d100: [22.7, 25.1] },
    parts: { set: 'open', ht: 1.3, y0: 0.21 },
    look: null,
  });
})();
