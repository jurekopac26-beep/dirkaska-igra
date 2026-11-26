/* Vehicle 'vetrnica' — KRILO VETRNICE: the TITAN racing tractor with one blade of a wind turbine on a long trailer (docs/titan-cisterna.md,
   »Novi tovornjaki«). The tractor is the TITAN as it is (its look drawn by K.lookOf('titan'), its breaking parts and the garage's mounts the
   TITAN's: copied from its def when first asked for); the trailer is a body of its own on the kingpin (model.trailer, Core: tlStep), as the
   TITAN CISTERNA's. Its look (trailer.look, the renderer's trailer builder: js/render.js, tlBuild): a gooseneck with the yellow frame that
   holds the blade's root, a thin spine back to a three-axle bogie with the blade's cradle, and the blade itself (B.loft: round at its root,
   widest a fifth of the way along, a thin red tip) reaching 11.8 m past the trailer's tail. That overhang is the look's only: the walls and
   the cars touch the trailer's own 16 m (trailer.tail keeps the rivals and the grid behind the tip). No spare tyre (docs/avti-kolibri.md),
   no names, no lettering. Tractor L 5.90 W 2.50 H 3.00; the trailer L 16.00 (27.80 with the blade) W 2.50 H 3.35, its kingpin 0.90 behind
   its front, three axles 12.2, 13.4 and 14.6 m behind the kingpin (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const TITAN = () => VEHICLE_DEFS.find(q => q && q.id === 'titan'), titan = () => TITAN().look, OWN = {};   // (the TITAN's def, read when asked: this file loads alone too)
  const copy = (k) => OWN[k] || (OWN[k] = JSON.parse(JSON.stringify(TITAN()[k])));   // (the TITAN's parts and mounts: a copy of its own, tests/novi-tovornjaki.test.js keeps them the same)

  // ---- the blade (m: [x from the kingpin, its middle's height, half its thickness, half its chord]; the chord lies flat, inside the trailer's width) ----
  const BLADE = [[0.3, 2.3, 1.0, 1.0], [-1.8, 2.3, 1.0, 1.0], [-3.6, 2.28, 0.88, 1.1], [-5.8, 2.25, 0.64, 1.22], [-8.5, 2.2, 0.5, 1.2], [-12, 2.15, 0.39, 1.04],
    [-16, 2.12, 0.3, 0.82], [-20, 2.12, 0.22, 0.58], [-23.5, 2.16, 0.14, 0.34], [-25.8, 2.22, 0.07, 0.15], [-26.9, 2.25, 0.02, 0.03]];
  const AX = [-12.2, -13.4, -14.6], END = -15.1, TIP = BLADE[BLADE.length - 1][0];

  // ---- the trailer's pieces (the renderer's builder B; x forward from the kingpin, y up from the ground, z across). B.lo: 0 the look
  // (the player's trailer, the previews), 1 the light look (a rival's), 2 the shadow ----
  function build(B) {
    const FRM = 0x2c2d30, YEL = 0xe0b21c, BLK = 0x131313, DK = 0x1c1c1e, WH = 0xeeeee9, RED = 0xd8261c, TYRE = 0x1b1b1b, RIM = 0xa9adb1, RW = 0.5;
    const lo = B.lo || 0, full = !lo, sh = lo === 2, n = [20, 12, 8][lo];
    // the gooseneck over the fifth wheel, the telescopic spine, the rear bogie's frame
    B.box(-0.6, 1.15, 0, 2.6, 0.3, 2.4, FRM);
    B.box(-7.6, 1.05, 0, 13.0, 0.36, 0.7, FRM);
    B.box(-13.4, 1.12, 0, 3.6, 0.24, 2.4, FRM);
    // the yellow frame round the blade's root (its foot, two uprights, a beam over the top: the look's only), the cradle on the bogie
    if (!sh) {
      B.box(0.05, 1.62, 0, 0.5, 0.65, 2.3, YEL); for (const sd of [-1, 1]) B.box(0.05, 2.3, sd * 1.12, 0.5, 1.4, 0.14, YEL);
      if (full) B.box(0.05, 3.3, 0, 0.5, 0.1, 2.38, YEL);
      B.box(-13.4, 1.48, 0, 0.6, 0.48, 1.9, YEL);
      if (full) for (const sd of [-1, 1]) B.box(-13.4, 1.95, sd * 1.0, 0.6, 0.5, 0.1, YEL);
    }
    // the blade: its root's steel flange, the white shell, the red tip
    B.cyl([0.42, 2.3, 0], [0.3, 2.3, 0], 1.08, 0x8d9195, { n: full ? 24 : 12 });
    B.loft(BLADE.slice(0, 9), WH, { n }); B.loft(BLADE.slice(8), RED, { n });
    // the straps over it (the look's only); the marker board at its tip
    if (full) { B.hoop(-1.0, 2.3, 1.0, 1.0, 0.12, 0.03, 0xe8731c, { n: 20 }); B.hoop(-13.4, 2.14, 0.37, 0.98, 0.12, 0.03, 0xe8731c, { n: 20 }); }
    if (!sh) { B.box(TIP + 0.3, 2.3, 0, 0.04, 0.5, 0.5, RED); if (full) B.box(TIP + 0.3, 2.3, 0, 0.05, 0.16, 0.5, 0xf4f4f0); }
    // the landing gear under the neck
    if (!sh) for (const sd of [-1, 1]) { B.box(-1.6, 0.62, sd * 0.55, 0.14, 0.78, 0.14, 0x2a2a2c); if (full) B.box(-1.6, 0.2, sd * 0.55, 0.32, 0.05, 0.32, DK); }
    // the wheels on their three axles, the mudguards over them
    for (const ax of AX) {
      if (!sh) B.box(ax, RW, 0, 0.12, 0.12, 1.72, DK);
      for (const sd of [-1, 1]) {
        if (full) { B.cyl([ax, RW, sd * 0.86], [ax, RW, sd * 1.22], RW, TYRE, { n: 14 }); B.cyl([ax, RW, sd * 1.22], [ax, RW, sd * 1.235], RW * 0.6, RIM, { n: 12 }); B.cyl([ax, RW, sd * 1.235], [ax, RW, sd * 1.25], 0.09, 0x3a3b3d, { n: 8 }); }
        else B.cyl([ax, RW, sd * 0.86], [ax, RW, sd * 1.23], RW, TYRE, { n: sh ? 6 : 8, capK: RIM });
      }
    }
    for (const sd of [-1, 1]) B.box(-13.4, 1.06, sd * 1.04, 3.6, 0.04, 0.42, BLK);
    // the rear: the under-run bar, the mud flaps, the tail lamps
    B.box(END - 0.02, 0.9, 0, 0.08, 0.3, 2.4, BLK);
    if (!sh) for (const sd of [-1, 1]) { B.box(END + 0.12, 0.52, sd * 1.04, 0.02, 0.6, 0.4, BLK); B.lamp(END - 0.07, 0.9, sd * 1.0, 0.14, 0.26); }
  }

  VEHICLE_DEFS.push({
    id: 'vetrnica', name: 'KRILO VETRNICE', cat: 'tovornjaki', ord: 6, drive: 'FR',
    desc: 'TITAN s krilom vetrnice: 27 metrov krila sega daleč čez zadnje osi prikolice.',
    phys: { mass: 5300, a: 1.65, b: 2.05, kI: 1.6, kw: 820, redline: 2800, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 3.42, rw: 0.55, cDrag: 0.8, len: 5.9, wid: 2.5, steerMax: 0.55,
      tracK: 0.55, brakeK: 0.7, spinK: 0.4, dmgK: 0.6, vLim: 150, sway: 1.4, landV: 13 },   // (the TITAN's, its limiter the rig's: 150 km/h)
    arc: { amax: 1.0, kv: 1.8, rmin: 9 },
    csp: { bx: 0.12, coast: -0.06, thr: -0.01, liftP: 0.04, pwr: 0.04, out: 1.2, turn: 0.75, w: 0.92, tv: 1.2 },   // (the TITAN's)
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },
    expect: { t100: [8.5, 9.38], vmax: [144, 152], latG: [1.17, 1.29], d100: [40.5, 44.7] },   // (the rig: tests/fleet.test.js, its envelope 'prikolica')
    price: 95000, pk: 'open', field: ['vetrnica'], fieldN: 3,   // (3 of its own, no others: the longest rig of all, the phone's budget)
    snd: { kind: 'diesel', hz: 0.95, turbo: 0.8, loud: 1.35 },
    get partNames() { return copy('partNames'); }, get parts() { return copy('parts'); }, get mounts() { return copy('mounts'); },
    // the semi-trailer (Core: tlDefBad, tlStep): 11 t, a light load on a long wheelbase; its kingpin on the TITAN's fifth wheel (x -1.8, 0.98 up);
    // tail: the blade past the trailer's own end (the look's; the rivals behind and the grid keep clear of it)
    trailer: { mass: 11000, len: 16, wid: 2.5, ht: 3.35, f: 0.9, ax: AX, kp: [-1.8, 0.98], rw: 0.5, mu: 1.5, brk: 7.5, tail: END - TIP, look: { build } },
    look: { get body() { return titan().body; }, get wheels() { return titan().wheels; }, regions: 'none', build(K) { K.lookOf('titan').build(K); } },
  });
})();
