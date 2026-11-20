/* Vehicle 'krilo' — KRILO VETRNICE: the TITAN with a low semi-trailer carrying a wind turbine's blade (the user's decision of 20. 11. 2026,
   question tovornjaki-zasnova-20-11: as in its picture). The tractor is the TITAN CISTERNA's (js/cars/cisterna.js); the trailer a body of
   its own on the kingpin (model.trailer, Core: tlStep), its look built by the renderer's trailer builder (js/render.js, tlBuild): a yellow
   low frame, the blade's root ring in its fixture over the gooseneck, the white blade (~30 m) on two saddles, its tip red, far past the
   trailer's tail as on the road (only the look: the trailer's body for the walls and the cars ends at its bumper, 16 m), four axles.
   The trailer L 16.0 W 2.50 H 3.6, its kingpin 0.90 behind its front, four axles 11.6 to 14.6 m behind the kingpin (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const DK = 0x2a2b2e, TYRE = 0x1b1b1b, RIM = 0xb9bdc2, BLK = 0x202022, WH = 0xeef0f2, YL = 0xf0b419, TIP = 0xd8282a;
  function wheel(B, x, r, z0, z1) {
    const sd = Math.sign(z1);
    if (!B.lo) { B.cyl([x, r, z0], [x, r, z1], r, TYRE, { n: 14 }); B.cyl([x, r, z1], [x, r, z1 + sd * 0.015], r * 0.62, RIM, { n: 12 }); B.cyl([x, r, z1 + sd * 0.015], [x, r, z1 + sd * 0.03], r * 0.2, 0x55585c, { n: 8 }); }
    else B.cyl([x, r, z0], [x, r, z1], r, TYRE, { n: B.lo === 2 ? 6 : 8, capK: RIM });
  }
  function build(B) {
    const full = !B.lo, sh = B.lo === 2;
    B.box(-0.6, 1.2, 0, 3.0, 0.28, 2.3, YL);
    for (const sd of [-1, 1]) B.box(-7.5, 0.98, sd * 0.4, 15.0, 0.26, 0.18, YL);
    if (full) for (let x = -2.5; x > -15; x -= 2.5) B.box(x, 0.98, 0, 0.12, 0.2, 0.9, DK);
    // the root's fixture: a frame round the root's ring, bolted to the gooseneck
    if (!sh) { B.box(0.25, 2.3, 0, 0.3, 2.1, 2.5, YL); for (const sd of [-1, 1]) B.box(-0.5, 1.9, sd * 1.15, 1.5, 1.2, 0.12, YL); }
    // the blade: its root ring, the tapered shell in segments (the chord standing up), the tip's red bands
    const L = 30, x0 = 0.1, base = 1.35, N = sh ? 8 : B.lo ? 12 : 44;
    B.cyl([x0 + 0.05, base + 1.15, 0], [x0 - 0.35, base + 1.15, 0], 1.18, 0x8a9096, { n: full ? 24 : 10 });
    for (let i = 0; i < N; i++) {
      const t0 = i / N, t1 = (i + 1) / N, tm = (t0 + t1) / 2, k = tm > 0.93 ? TIP : WH;
      const chord = tm < 0.08 ? 2.3 : tm < 0.25 ? 2.3 + (tm - 0.08) / 0.17 * 1.0 : 3.3 * Math.pow(1 - (tm - 0.25) / 0.75, 0.85) + 0.25;
      const thick = tm < 0.08 ? 2.3 : Math.max(0.18, 2.3 * Math.pow(1 - tm, 1.6) * 0.55 + 0.12);
      const ry = chord / 2, rz = Math.min(thick, chord) / 2;
      B.tank(x0 - 0.35 - t0 * L, x0 - 0.35 - t1 * L, base + ry, ry, rz, { n: [20, 12, 8][B.lo || 0], k, col: k });
    }
    // the saddles under the blade
    if (!sh) for (const x of [-7.0, -13.2]) { B.box(x, 1.25, 0, 0.5, 0.34, 1.4, YL); B.box(x, 1.5, 0, 0.6, 0.12, 1.6, 0x4a4a4c); }
    // the axles and their wheels, the mudguards, the landing gear, the side guards, the bumper and its lamps; the marker boards on the tip
    for (const ax of [-11.6, -12.6, -13.6, -14.6]) { if (!sh) B.box(ax, 0.42, 0, 0.12, 0.12, 1.72, DK); for (const sd of [-1, 1]) wheel(B, ax, 0.42, sd * 0.86, sd * 1.22); }
    if (!sh) for (const sd of [-1, 1]) { B.box(-13.1, 0.95, sd * 1.04, 3.9, 0.05, 0.42, BLK); B.box(-2.2, 0.62, sd * 0.55, 0.14, 0.78, 0.14, DK); B.box(-6.8, 0.66, sd * 1.18, 8.6, 0.1, 0.05, 0xdadde0); }
    B.box(-15.05, 0.42, 0, 0.08, 0.2, 2.3, YL);
    if (!sh) for (const sd of [-1, 1]) { B.box(-15.05, 0.42, sd * 1.0, 0.09, 0.22, 0.4, BLK); B.lamp(-15.1, 0.43, sd * 1.0, 0.12, 0.28); B.box(-L - 0.4, base + 0.5, sd * 0.25, 0.04, 0.5, 0.04, 0xf6f6f6); }
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
    id: 'krilo', name: 'KRILO VETRNICE', ord: 6,
    desc: 'TITAN s krilom vetrnice: krilo sega daleč za prikolico, ta se v ovinku lomi.',
    expect: { t100: [10.5, 11.5], vmax: [144, 152], latG: [1.17, 1.29], d100: [42.2, 46.6] },
    price: 90000, field: ['krilo'],
    // the semi-trailer: ~9 t of extendable frame and a blade of ~7 t; its kingpin on the TITAN's fifth wheel
    trailer: { mass: 16000, len: 16.0, wid: 2.5, ht: 3.6, f: 0.9, ax: [-11.6, -12.6, -13.6, -14.6], kp: [-1.8, 0.98], rw: 0.42, mu: 1.5, brk: 7.5, look: { build } },
  });
})();
