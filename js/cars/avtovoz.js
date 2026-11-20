/* Vehicle 'avtovoz' — TITAN AVTOVOZ: the TITAN with a two-deck car-carrier semi-trailer on its fifth wheel (the user's decision of 20. 11.
   2026, question tovornjaki-zasnova-20-11: as in its picture). The tractor is the TITAN CISTERNA's (js/cars/cisterna.js); the trailer a
   body of its own on the kingpin (model.trailer, Core: tlStep), its look built by the renderer's trailer builder (js/render.js, tlBuild):
   a red frame with galvanised posts, a gooseneck over the fifth wheel, two decks of tracks, six cars on them (the game's cars in a simpler
   look, docs/realizem.md: boxes, their wheels), three axles, a red bumper. The trailer L 14.0 W 2.50 H 4.0, its kingpin 0.90 behind its
   front, three axles 9.6, 10.9 and 12.2 m behind the kingpin (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const DK = 0x2a2b2e, TYRE = 0x1b1b1b, RIM = 0xb9bdc2, GALV = 0xc4c9ce, BLK = 0x202022, RED = 0xe04a2a, DECK = 0x8d949b, GLASS = 0x4a5a6a;
  function wheel(B, x, r, z0, z1) {
    const sd = Math.sign(z1);
    if (!B.lo) { B.cyl([x, r, z0], [x, r, z1], r, TYRE, { n: 14 }); B.cyl([x, r, z1], [x, r, z1 + sd * 0.015], r * 0.62, RIM, { n: 12 }); B.cyl([x, r, z1 + sd * 0.015], [x, r, z1 + sd * 0.03], r * 0.2, 0x55585c, { n: 8 }); }
    else B.cyl([x, r, z0], [x, r, z1], r, TYRE, { n: B.lo === 2 ? 6 : 8, capK: RIM });
  }
  // a carried car (x its middle, y the deck's top, k its paint): the body, its cabin, the glass round it, four wheels; the light look the body
  // and the cabin only, the shadow one block
  function car(B, x, y, k, lean) {
    const h = y + (lean || 0);
    if (B.lo === 2) { B.box(x, h + 0.62, 0, 4.2, 0.95, 1.75, k); return; }
    B.box(x, h + 0.5, 0, 4.2, 0.55, 1.76, k);
    B.box(x - 0.3, h + 1.0, 0, 2.2, 0.48, 1.56, B.lo ? GLASS : k);
    if (!B.lo) { for (const sd of [-1, 1]) B.box(x - 0.3, h + 1.0, sd * 0.785, 2.0, 0.36, 0.01, GLASS); B.box(x + 0.8, h + 1.0, 0, 0.02, 0.36, 1.4, GLASS); B.box(x - 1.4, h + 1.0, 0, 0.02, 0.36, 1.4, GLASS);
      for (const wx of [x + 1.35, x - 1.35]) for (const sd of [-1, 1]) B.cyl([wx, h + 0.32, sd * 0.72], [wx, h + 0.32, sd * 0.9], 0.32, TYRE, { n: 10, capK: 0x9aa1a8 }); }
  }
  function build(B) {
    const full = !B.lo, sh = B.lo === 2;
    B.box(-0.4, 1.22, 0, 2.6, 0.3, 2.3, RED);   // (the gooseneck over the fifth wheel)
    for (const sd of [-1, 1]) B.box(-6.5, 0.78, sd * 0.5, 12.6, 0.24, 0.16, DK);
    // the lower deck's tracks (stepped up over the axles), the upper deck's
    for (const sd of [-1, 1]) { B.box(-5.3, 0.92, sd * 0.72, 7.0, 0.06, 0.6, DECK); B.box(-11.0, 1.22, sd * 0.72, 4.0, 0.06, 0.6, DECK); B.box(-6.3, 2.42, sd * 0.72, 13.6, 0.07, 0.6, DECK); }
    // the posts, the rails along both sides, the galvanised balusters on the upper deck's sides
    if (!sh) for (const x of [0.5, -2.6, -5.8, -9.0, -12.9]) for (const sd of [-1, 1]) B.box(x, 2.35, sd * 1.2, 0.14, 3.1, 0.14, RED);
    if (!sh) for (const sd of [-1, 1]) for (const y of [3.85, 2.4, 1.05]) B.box(-6.2, y, sd * 1.2, 13.6, 0.1, 0.1, y === 1.05 ? DK : RED);
    if (full) for (let x = 0.0; x > -12.9; x -= 1.6) for (const sd of [-1, 1]) B.box(x, 3.12, sd * 1.2, 0.05, 1.4, 0.05, GALV);
    // the six cars: three on each deck
    car(B, -4.0, 0.95, 0xd8382e); car(B, -8.6, 0.95, 0xf0c23a, 0.12); car(B, -11.4, 1.25, 0x3d7fd6);
    car(B, -1.6, 2.46, 0xeef0f2); car(B, -6.2, 2.46, 0xff7a1a); car(B, -10.8, 2.46, 0xb9bdc2);
    // the axles and their wheels, the mudguards, the landing gear, the side guards, the bumper and its tail lamps
    for (const ax of [-9.6, -10.9, -12.2]) { if (!sh) B.box(ax, 0.42, 0, 0.12, 0.12, 1.72, DK); for (const sd of [-1, 1]) wheel(B, ax, 0.42, sd * 0.86, sd * 1.22); }
    if (!sh) for (const sd of [-1, 1]) { B.box(-10.9, 0.95, sd * 1.04, 3.8, 0.05, 0.42, BLK); B.box(-1.9, 0.62, sd * 0.55, 0.14, 0.78, 0.14, DK); B.box(-5.75, 0.6, sd * 1.18, 6.3, 0.1, 0.05, 0xdadde0); }
    B.box(-13.05, 0.42, 0, 0.08, 0.2, 2.3, RED);
    if (!sh) for (const sd of [-1, 1]) { B.box(-13.05, 0.42, sd * 1.0, 0.09, 0.22, 0.4, BLK); B.lamp(-13.1, 0.43, sd * 1.0, 0.12, 0.28); }
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
    id: 'avtovoz', name: 'TITAN AVTOVOZ', ord: 5,
    desc: 'TITAN z avtovozom: šest avtov na dveh etažah, dolga prikolica se v ovinku lomi.',
    expect: { t100: [9.75, 10.75], vmax: [144, 152], latG: [1.17, 1.29], d100: [41.6, 46.0] },
    price: 80000, field: ['avtovoz'],
    // the semi-trailer: 7 t of frame and six cars of ~1.2 t; its kingpin on the TITAN's fifth wheel
    trailer: { mass: 14000, len: 14.0, wid: 2.5, ht: 4.0, f: 0.9, ax: [-9.6, -10.9, -12.2], kp: [-1.8, 0.98], rw: 0.42, mu: 1.5, brk: 7.5, look: { build } },
  });
})();
