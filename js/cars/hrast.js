/* Vehicle 'hrast' — HRAST: a bonneted desert tractor with a timber trailer on its fifth wheel (docs/titan-cisterna.md, »Novi tovornjaki«).
   The tractor is the ZRCALNI VLAK's (js/cars/zrcalni.js: its look drawn by K.lookOf('zrcalni'), here in the player's paint instead of the
   train's black; its phys, its breaking parts and the garage's mounts the train's tractor's: copied from its def when first asked for); the
   trailer is a body of its own on the kingpin (model.trailer, Core: tlStep), as the TITAN CISTERNA's. Its look (trailer.look, the
   renderer's trailer builder: js/render.js, tlBuild): two frame rails, a headboard behind the cab, four bolsters with their stakes, two
   stacks of fourteen logs each (bark, pale cut ends), chains down the sides, three axles. No spare tyre (docs/avti-kolibri.md), no names,
   no lettering. Tractor L 6.30 W 2.50 H 3.05; the trailer L 13.00 W 2.50 H 3.50, its kingpin 0.90 behind its front, three axles 8.6, 9.8
   and 11.0 m behind the kingpin (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const BASE = () => VEHICLE_DEFS.find(q => q && q.id === 'zrcalni'), base = () => BASE().look, OWN = {};   // (the train's def, read when asked: this file loads alone too)
  const copy = (k, more) => OWN[k] || (OWN[k] = Object.assign(JSON.parse(JSON.stringify(BASE()[k])), more));   // (the tractor's phys, parts and mounts: a copy of the train's, tests/novi-tovornjaki.test.js keeps them the same)
  const lcg = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;

  // ---- the load (m: x from the kingpin): two stacks between their bolsters, each four rows of logs (how many, how high over the bolster) ----
  const STACKS = [[-0.7, -6.1], [-6.7, -12.0]], ROWS = [[5, 0], [4, 0.41], [3, 0.82], [2, 1.23]], BOLSTERS = [-1.3, -5.5, -7.3, -11.4], AX = [-8.6, -9.8, -11.0], END = -12.1;

  // ---- the trailer's pieces (the renderer's builder B; x forward from the kingpin, y up from the ground, z across). B.lo: 0 the look
  // (the player's trailer, the previews), 1 the light look (a rival's), 2 the shadow ----
  function build(B) {
    const DK = 0x1d1e20, STK = 0x2b2c2e, BLK = 0x131313, TYRE = 0x1b1b1b, RIM = 0xa9adb1, RW = 0.5, rnd = lcg(91109);
    const BARK = [0x5b4331, 0x4e3a2b, 0x67503a, 0x56402f], CUT = [0xd9b27a, 0xcfa56b, 0xe2bf8a, 0xc99d62];
    const lo = B.lo || 0, full = !lo, sh = lo === 2;
    // the two frame rails, the plate over the fifth wheel
    for (const sd of [-1, 1]) B.box(-5.6, 1.33, sd * 0.5, 12.6, 0.24, 0.16, DK);
    B.box(-0.2, 1.3, 0, 2.0, 0.08, 1.9, DK);
    // the headboard behind the cab: two posts, the bars across, the mesh's uprights (the look's only)
    if (!sh) {
      for (const sd of [-1, 1]) B.box(0.55, 2.45, sd * 1.15, 0.12, 2.1, 0.12, STK);
      for (const y of [1.7, 2.3, 2.9, 3.42]) B.box(0.55, y, 0, 0.08, 0.08, 2.3, STK);
      if (full) for (const z of [-0.7, -0.35, 0, 0.35, 0.7]) B.box(0.55, 2.55, z, 0.05, 1.8, 0.05, STK);
    }
    // the bolsters across the rails, a stake at each end
    for (const x of BOLSTERS) { B.box(x, 1.53, 0, 0.22, 0.16, 2.5, STK); if (!sh) for (const sd of [-1, 1]) B.box(x, 2.47, sd * 1.2, 0.14, 1.76, 0.12, STK); }
    // the logs: each a little thicker at its butt, a little out of line with its neighbours (the shadow: a block a stack)
    for (const [xa, xb] of STACKS) {
      if (sh) { B.box((xa + xb) / 2, 2.45, 0, xa - xb, 1.7, 2.3, 0x3a2a1c); continue; }
      let i = 0;
      for (const [m, dy] of ROWS) for (let j = 0; j < m; j++) {
        const z = (j - (m - 1) / 2) * 0.48, r = 0.21 + 0.05 * rnd(), y = 1.86 + dy, j0 = (rnd() - 0.5) * 0.24, j1 = (rnd() - 0.5) * 0.24;
        B.cyl([xa + j0, y, z], [xb + j1, y, z], r, BARK[i % 4], { n: full ? 10 : 6, r2: r * 0.9, capK: CUT[(i * 7) % 4] }); i++;
      }
    }
    // the chains down the sides (the look's only), the landing gear
    if (full) for (const x of [-2.4, -4.4, -8.4, -10.4]) for (const sd of [-1, 1]) B.box(x, 2.47, sd * 1.24, 0.04, 1.75, 0.03, 0x7c7e81);
    if (!sh) for (const sd of [-1, 1]) { B.box(-2.4, 0.62, sd * 0.55, 0.14, 0.78, 0.14, 0x2a2a2c); if (full) B.box(-2.4, 0.2, sd * 0.55, 0.32, 0.05, 0.32, 0x1c1c1e); }
    // the wheels on their three axles, the mudguards over them
    for (const ax of AX) {
      if (!sh) B.box(ax, RW, 0, 0.12, 0.12, 1.72, 0x1c1c1e);
      for (const sd of [-1, 1]) {
        if (full) { B.cyl([ax, RW, sd * 0.86], [ax, RW, sd * 1.22], RW, TYRE, { n: 14 }); B.cyl([ax, RW, sd * 1.22], [ax, RW, sd * 1.235], RW * 0.6, RIM, { n: 12 }); B.cyl([ax, RW, sd * 1.235], [ax, RW, sd * 1.25], 0.09, 0x3a3b3d, { n: 8 }); }
        else B.cyl([ax, RW, sd * 0.86], [ax, RW, sd * 1.23], RW, TYRE, { n: sh ? 6 : 8, capK: RIM });
      }
    }
    for (const sd of [-1, 1]) B.box(-9.8, 1.12, sd * 1.04, 3.8, 0.05, 0.42, BLK);
    // the rear: the under-run bar, the mud flaps, the tail lamps
    B.box(END + 0.08, 0.6, 0, 0.1, 0.16, 2.3, 0xc9ccd0);
    if (!sh) for (const sd of [-1, 1]) { B.box(-11.7, 0.56, sd * 1.04, 0.02, 0.6, 0.4, BLK); B.lamp(END + 0.02, 0.6, sd * 0.98, 0.14, 0.26); }
  }

  // the train's tractor in the player's paint: its one always-black colour (the cab's and the bonnet's) the paint instead
  function painted(K) { const Q = Object.create(K); Q.rgb = (h) => h === 0x0c0d0f ? K.paint : K.rgb(h); return Q; }

  VEHICLE_DEFS.push({
    id: 'hrast', name: 'HRAST', cat: 'tovornjaki', ord: 7, drive: 'AWD',
    desc: 'Puščavski vlačilec z gozdarsko prikolico: dva kupa hlodov med koli, en zgib.',
    get phys() { return copy('phys', { vLim: 145 }); },   // (the train's tractor's, with one trailer its limiter 145 km/h)
    get arc() { return copy('arc'); }, get csp() { return copy('csp'); },
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },
    expect: { t100: [8.84, 9.77], vmax: [138, 146], latG: [1.18, 1.3], d100: [40.0, 44.2] },   // (the rig: tests/fleet.test.js, its envelope 'prikolica')
    price: 88000, pk: 'open', field: ['hrast'], fieldN: 4,   // (4 of its own, no others: a long rig each, the phone's budget)
    snd: { kind: 'diesel', hz: 0.8, turbo: 0.75, loud: 1.4 },
    get partNames() { return copy('partNames'); }, get parts() { return copy('parts'); }, get mounts() { return copy('mounts'); },
    // the semi-trailer (Core: tlDefBad, tlStep): 14 t with its logs; its kingpin on the tractor's fifth wheel (x -2.0, 1.28 up)
    trailer: { mass: 14000, len: 13.0, wid: 2.5, ht: 3.5, f: 0.9, ax: AX, kp: [-2.0, 1.28], rw: 0.5, mu: 1.5, brk: 7.5, look: { build } },
    look: { get body() { return base().body; }, get wheels() { return base().wheels; }, regions: 'none', build(K) { K.lookOf('zrcalni').build(painted(K)); } },
  });
})();
