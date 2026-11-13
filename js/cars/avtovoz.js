/* Vehicle 'avtovoz' — TITAN AVTOVOZ: the TITAN racing tractor with a car carrier on its fifth wheel (docs/titan-cisterna.md, »Novi
   tovornjaki«). The tractor is the TITAN as it is (its look drawn by K.lookOf('titan'), its breaking parts and the garage's mounts the
   TITAN's: copied from its def when first asked for); the trailer is a body of its own on the kingpin (model.trailer, Core: tlStep), as the
   TITAN CISTERNA's. Its look (trailer.look, the renderer's trailer builder: js/render.js, tlBuild): a low well between the gooseneck and the
   axles, a deck over its small wheels, an upper deck on six pairs of posts, and on them five of the game's own cars (B.car: the player's
   trailer their real bodies and wheels, in the trailer's one geometry; a rival's their outlines; the shadow blocks). No spare tyre
   (docs/avti-kolibri.md), no names, no lettering. Tractor L 5.90 W 2.50 H 3.00; the trailer L 13.60 W 2.50 H 3.80 with its load, its
   kingpin 0.90 behind its front, three axles 9.9, 11.0 and 12.1 m behind the kingpin (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const TITAN = () => VEHICLE_DEFS.find(q => q && q.id === 'titan'), titan = () => TITAN().look, OWN = {};   // (the TITAN's def, read when asked: this file loads alone too)
  const copy = (k) => OWN[k] || (OWN[k] = JSON.parse(JSON.stringify(TITAN()[k])));   // (the TITAN's parts and mounts: a copy of its own, tests/novi-tovornjaki.test.js keeps them the same)

  // ---- the decks (m: x from the kingpin, y their tops over the ground) and the cars on them (their bodies' middles; each its own colour) ----
  const WELL = { x0: -1.9, x1: -8.45, y: 0.55 }, REAR = { x0: -8.45, x1: -12.7, y: 0.96 }, TOP = { x0: 1.3, x1: -12.45, y: 2.4 };
  const LOAD = [
    ['sokol', -1.0, TOP.y, 0xc8302a], ['panter', -5.57, TOP.y, 0x1f3f8f], ['kuna', -10.13, TOP.y, 0xe9e9e4],
    ['jelen', -5.0, WELL.y, 0x2e7d4f, true], ['raketa', -10.55, REAR.y, 0xe0a81c],
  ];

  // ---- the trailer's pieces (the renderer's builder B; x forward from the kingpin, y up from the ground, z across). B.lo: 0 the look
  // (the player's trailer, the previews), 1 the light look (a rival's), 2 the shadow ----
  function build(B) {
    const FRM = 0x5f6368, DECK = 0x3a3d41, POST = 0xc8302a, BLK = 0x131313, DK = 0x1c1c1e, TYRE = 0x1b1b1b, RIM = 0xa9adb1, RW = 0.4;
    const lo = B.lo || 0, full = !lo, sh = lo === 2;
    // the gooseneck over the fifth wheel, its step down to the well; the well's floor and side rails; the step up to the deck over the axles
    B.box(-0.5, 1.15, 0, 2.8, 0.3, 2.3, FRM);
    B.box(-1.8, 0.87, 0, 0.24, 0.86, 2.3, FRM);
    B.box((WELL.x0 + WELL.x1) / 2, WELL.y - 0.07, 0, WELL.x0 - WELL.x1, 0.14, 2.36, DECK);
    if (!sh) for (const sd of [-1, 1]) B.box((WELL.x0 + WELL.x1) / 2, WELL.y + 0.1, sd * 1.19, WELL.x0 - WELL.x1, 0.2, 0.06, FRM);
    B.box(WELL.x1 - 0.1, 0.69, 0, 0.24, 0.5, 2.3, FRM);
    B.box((REAR.x0 + REAR.x1) / 2 - 0.1, REAR.y - 0.07, 0, REAR.x0 - REAR.x1 - 0.2, 0.14, 2.42, DECK);
    // the upper deck: its two tracks under the cars' wheels, its side beams, the bars across (the look's only); a stop at each track's ends
    const TL = TOP.x0 - TOP.x1, TX = (TOP.x0 + TOP.x1) / 2;
    for (const sd of [-1, 1]) { B.box(TX, TOP.y - 0.04, sd * 0.78, TL, 0.08, sh ? 0.9 : 0.66, DECK); if (!sh) B.box(TX, TOP.y - 0.1, sd * 1.19, TL, 0.2, 0.08, POST); }
    if (full) { for (let x = TOP.x0 - 0.3; x > TOP.x1; x -= 1.02) B.box(x, TOP.y - 0.11, 0, 0.06, 0.06, 2.3, FRM);
      for (const sd of [-1, 1]) for (const x of [TOP.x0 - 0.03, TOP.x1 + 0.03]) B.box(x, TOP.y + 0.05, sd * 0.78, 0.06, 0.1, 0.66, POST); }
    // its posts (from the neck, the well's rails and the rear deck), the rams that lift it (the look's only)
    if (!sh) for (const [x, yb] of [[0.72, 1.3], [-2.1, WELL.y], [-5.2, WELL.y], [-8.2, WELL.y], [-10.5, REAR.y], [-12.55, REAR.y]])
      for (const sd of [-1, 1]) B.box(x, (yb + TOP.y - 0.2) / 2, sd * 1.2, 0.12, TOP.y - 0.2 - yb, 0.1, POST);
    if (full) for (const sd of [-1, 1]) for (const [xa, ya, xb] of [[-0.9, 1.3, 0.5], [-3.4, WELL.y + 0.2, -2.3], [-7.0, WELL.y + 0.2, -8.0], [-11.3, REAR.y, -10.7]]) {
      B.cyl([xa, ya, sd * 1.2], [(xa + xb) / 2, (ya + TOP.y - 0.2) / 2, sd * 1.2], 0.045, DK, { n: 6 }); B.cyl([(xa + xb) / 2, (ya + TOP.y - 0.2) / 2, sd * 1.2], [xb, TOP.y - 0.2, sd * 1.2], 0.028, 0xc9ccd0, { n: 6 }); }
    // the landing gear under the neck
    if (!sh) for (const sd of [-1, 1]) { B.box(-1.5, 0.62, sd * 0.55, 0.14, 0.78, 0.14, 0x2a2a2c); if (full) B.box(-1.5, 0.2, sd * 0.55, 0.32, 0.05, 0.32, DK); }
    // the small wheels on their three axles under the rear deck
    for (const ax of [-9.9, -11.0, -12.1]) {
      if (!sh) B.box(ax, RW, 0, 0.12, 0.12, 1.72, DK);
      for (const sd of [-1, 1]) {
        if (full) { B.cyl([ax, RW, sd * 0.86], [ax, RW, sd * 1.22], RW, TYRE, { n: 14 }); B.cyl([ax, RW, sd * 1.22], [ax, RW, sd * 1.235], RW * 0.6, RIM, { n: 12 }); B.cyl([ax, RW, sd * 1.235], [ax, RW, sd * 1.25], 0.08, DK, { n: 8 }); }
        else B.cyl([ax, RW, sd * 0.86], [ax, RW, sd * 1.23], RW, TYRE, { n: sh ? 6 : 8, capK: RIM });
      }
    }
    // the rear: the folded ramps standing on the deck's end (the look's only), the under-run bar, the mud flaps, the tail lamps
    if (full) for (const sd of [-1, 1]) B.box(REAR.x1 - 0.02, REAR.y + 0.3, sd * 0.78, 0.05, 0.6, 0.6, FRM);
    B.box(REAR.x1 + 0.02, 0.52, 0, 0.08, 0.18, 2.4, BLK);
    if (!sh) for (const sd of [-1, 1]) { B.box(REAR.x1 + 0.22, 0.5, sd * 1.04, 0.02, 0.56, 0.4, BLK); B.lamp(REAR.x1 - 0.025, 0.72, sd * 1.0, 0.14, 0.26); }
    // its load: five of the game's cars (the well's one nose to the rear, as it was driven on)
    for (const [id, x, y, k, rev] of LOAD) B.car(id, x, y, 0, { k, rev: !!rev });
  }

  VEHICLE_DEFS.push({
    id: 'avtovoz', name: 'TITAN AVTOVOZ', cat: 'tovornjaki', ord: 5, drive: 'FR',
    desc: 'TITAN z avtovozom: na dveh palubah pelje pet avtov iz igre; visok, dolg in težak.',
    phys: { mass: 5300, a: 1.65, b: 2.05, kI: 1.6, kw: 820, redline: 2800, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 3.42, rw: 0.55, cDrag: 0.8, len: 5.9, wid: 2.5, steerMax: 0.55,
      tracK: 0.55, brakeK: 0.7, spinK: 0.4, dmgK: 0.6, vLim: 150, sway: 1.4, landV: 13 },   // (the TITAN's, its limiter the rig's: 150 km/h)
    arc: { amax: 1.0, kv: 1.8, rmin: 9 },
    csp: { bx: 0.12, coast: -0.06, thr: -0.01, liftP: 0.04, pwr: 0.04, out: 1.2, turn: 0.75, w: 0.92, tv: 1.2 },   // (the TITAN's)
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },
    expect: { t100: [9.26, 10.24], vmax: [144, 152], latG: [1.17, 1.29], d100: [41.2, 45.6] },   // (the rig: tests/fleet.test.js, its envelope 'prikolica')
    price: 85000, pk: 'open', field: ['avtovoz'], fieldN: 4,   // (4 of its own, no others: a long rig each, the phone's budget)
    snd: { kind: 'diesel', hz: 0.95, turbo: 0.8, loud: 1.35 },
    get partNames() { return copy('partNames'); }, get parts() { return copy('parts'); }, get mounts() { return copy('mounts'); },
    // the semi-trailer (Core: tlDefBad, tlStep): 13 t with its five cars; its kingpin on the TITAN's fifth wheel (x -1.8, 0.98 up)
    trailer: { mass: 13000, len: 13.6, wid: 2.5, ht: 3.8, f: 0.9, ax: [-9.9, -11.0, -12.1], kp: [-1.8, 0.98], rw: 0.4, mu: 1.5, brk: 7.5, look: { build } },
    look: { get body() { return titan().body; }, get wheels() { return titan().wheels; }, regions: 'none', build(K) { K.lookOf('titan').build(K); } },
  });
})();
