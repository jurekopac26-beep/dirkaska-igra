/* Vehicle 'hrast' — HRAST: the TITAN with a timber semi-trailer, oak logs between its stanchions and a loader crane folded at its front (the
   user's decision of 20. 11. 2026, question tovornjaki-zasnova-20-11: as in its picture). The tractor is the TITAN CISTERNA's
   (js/cars/cisterna.js); the trailer a body of its own on the kingpin (model.trailer, Core: tlStep), its look built by the renderer's
   trailer builder (js/render.js, tlBuild): a green frame, four bolsters and their stanchions, a headboard, the crane (its column, the boom
   and the jib laid along the load, the grapple), nine logs in three rows (bark on their sides, the cut ends light), orange straps, three
   axles. The trailer L 12.4 W 2.50 H 3.6, its kingpin 0.90 behind its front, three axles 7.5, 8.8 and 10.1 m behind the kingpin (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const DK = 0x2a2b2e, TYRE = 0x1b1b1b, RIM = 0xb9bdc2, BLK = 0x202022, GN = 0x3b9a4c, BARK = 0x5b4733, END = 0xd2ab73, STRAP = 0xff7a1a, GRP = 0x4a4a4c;
  function wheel(B, x, r, z0, z1) {
    const sd = Math.sign(z1);
    if (!B.lo) { B.cyl([x, r, z0], [x, r, z1], r, TYRE, { n: 14 }); B.cyl([x, r, z1], [x, r, z1 + sd * 0.015], r * 0.62, RIM, { n: 12 }); B.cyl([x, r, z1 + sd * 0.015], [x, r, z1 + sd * 0.03], r * 0.2, 0x55585c, { n: 8 }); }
    else B.cyl([x, r, z0], [x, r, z1], r, TYRE, { n: B.lo === 2 ? 6 : 8, capK: RIM });
  }
  function build(B) {
    const full = !B.lo, sh = B.lo === 2;
    for (const sd of [-1, 1]) B.box(-5.4, 1.06, sd * 0.5, 12.0, 0.24, 0.16, DK);
    B.box(-0.2, 1.0, 0, 2.1, 0.08, 1.9, DK);
    // the bolsters and their stanchions; the front headboard (a grid)
    for (const x of [-1.6, -4.6, -7.6, -10.6]) { B.box(x, 1.28, 0, 0.3, 0.2, 2.45, GN); if (!sh) for (const sd of [-1, 1]) B.box(x, 2.2, sd * 1.18, 0.14, 1.75, 0.12, GN); }
    if (!sh) { B.box(-0.65, 2.15, 0, 0.12, 1.9, 2.4, GN); if (full) for (const z of [-0.8, -0.4, 0, 0.4, 0.8]) B.box(-0.72, 2.15, z, 0.05, 1.85, 0.06, GRP); }
    // the crane folded behind the headboard: its column, the boom and the jib laid along the top, the grapple, its hose
    if (!sh) { B.cyl([-0.1, 1.1, 0], [-0.1, 3.0, 0], 0.22, GN, { n: 10 }); B.box(-1.4, 3.3, 0.2, 3.0, 0.32, 0.3, GN); B.box(-1.3, 3.0, -0.25, 2.6, 0.26, 0.24, GN);
      if (full) { B.box(-2.95, 2.8, 0.2, 0.3, 0.6, 0.5, GRP); B.cyl([0.05, 3.0, 0.35], [-2.4, 3.35, 0.35], 0.06, 0x9aa1a8, { n: 6 }); } }
    // the logs: three rows, bark on their sides, the cut ends light (each a little longer or shorter, a little thicker or thinner)
    const rows = [[1.62, [-0.9, -0.3, 0.3, 0.9], 0.31], [2.18, [-0.6, 0.0, 0.6], 0.29], [2.68, [-0.3, 0.3], 0.27]];
    let i = 0;
    for (const [y, zs, r] of rows) for (const z of zs) { i++; const rr = r * (0.92 + 0.12 * ((i * 37) % 5) / 4), dx = ((i * 53) % 7) * 0.06;
      B.cyl([-0.85 + dx * 0.5, y, z], [-11.3 - dx, y, z], rr, BARK, { n: full ? 10 : 6, capK: END }); }
    // the straps over the load
    if (full) for (const x of [-3.1, -6.1, -9.1]) { B.box(x, 3.0, 0, 0.06, 0.03, 1.4, STRAP); for (const sd of [-1, 1]) B.box(x, 2.0, sd * 1.24, 0.06, 2.0, 0.02, STRAP); }
    // the axles and their wheels, the mudguards, the landing gear, the side guards, the bumper and its lamps
    for (const ax of [-7.5, -8.8, -10.1]) { if (!sh) B.box(ax, 0.5, 0, 0.12, 0.12, 1.72, DK); for (const sd of [-1, 1]) wheel(B, ax, 0.5, sd * 0.86, sd * 1.22); }
    if (!sh) for (const sd of [-1, 1]) { B.box(-8.8, 1.1, sd * 1.04, 3.9, 0.05, 0.42, BLK); B.box(-2.1, 0.62, sd * 0.55, 0.14, 0.78, 0.14, DK); B.box(-4.7, 0.68, sd * 1.18, 3.8, 0.1, 0.05, 0xdadde0); }
    B.box(-11.44, 0.42, 0, 0.08, 0.2, 2.3, GN);
    if (!sh) for (const sd of [-1, 1]) { B.box(-11.44, 0.42, sd * 1.0, 0.09, 0.22, 0.4, BLK); B.lamp(-11.49, 0.43, sd * 1.0, 0.12, 0.28); }
  }

  // ---- the tractor: the TITAN CISTERNA's (the TITAN with a little rust: its phys, parts, mounts and look, read from js/cars/cisterna.js
  // when first asked for: this file alone still registers its def), its trailer this file's own. No spare tyres (docs/realizem.md, the
  // trucks' decision): the CISTERNA's tlSpare parts left out
  function rig(o) {
    const C = () => VEHICLE_DEFS.find(q => q && q.id === 'cisterna') || {}, memo = {};
    const cp = (x) => x == null ? x : JSON.parse(JSON.stringify(x)), noSp = (m) => m && Object.fromEntries(Object.entries(m).filter(([k]) => !/^tlSpare/.test(k)));
    const from = { drive: () => C().drive, pk: () => C().pk, look: () => C().look, phys: () => cp(C().phys), arc: () => cp(C().arc), csp: () => cp(C().csp), stats: () => cp(C().stats),
      snd: () => cp(C().snd), mounts: () => cp(C().mounts), partNames: () => noSp(C().partNames),
      parts: () => { const p = cp(C().parts); if (p) p.extra = noSp(p.extra); return p; } };
    const d = Object.assign({ cat: 'tovornjaki', fieldN: 5 }, o);
    for (const k of Object.keys(from)) Object.defineProperty(d, k, { enumerable: true, configurable: true, get() { if (!(k in memo) || memo[k] == null) memo[k] = from[k](); return memo[k]; } });
    VEHICLE_DEFS.push(d);
  }

  rig({
    id: 'hrast', name: 'HRAST', ord: 7,
    desc: 'TITAN s hlodi: težka prikolica z dvigalom se v ovinku lomi in pri zaviranju potiska.',
    expect: { t100: [10.35, 11.35], vmax: [144, 152], latG: [1.17, 1.29], d100: [41.9, 46.3] },
    price: 85000, field: ['hrast'],
    // the semi-trailer: ~7 t of frame and crane and ~8 t of oak; its kingpin on the TITAN's fifth wheel
    trailer: { mass: 15000, len: 12.4, wid: 2.5, ht: 3.6, f: 0.9, ax: [-7.5, -8.8, -10.1], kp: [-1.8, 0.98], rw: 0.5, mu: 1.5, brk: 7.5, look: { build } },
  });
})();
