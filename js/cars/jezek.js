/* Vehicle 'jezek' — JEŽEK E: a retro-modern electric city hatch. Signature features: 1) a rounded two-box hatch with a short bonnet, 2)
   LED light bars across the nose and the tail, 3) flush door handles and a closed grille panel, 4) a glass roof over a two-tone body, 5)
   aero-disc wheels. L 3.95 W 1.78 H 1.50, wheelbase 2.54, overhangs F 0.72 R 0.69 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'jezek', name: 'JEŽEK E', cat: 'elektricni', ord: 1, drive: 'FF',
    desc: 'Retro električni mestni avto z LED pasovi: tih, takoj pospeši, a je težak.',
    phys: { mass: 1350, a: 1.26, b: 1.28, kI: 1.1, kw: 160, redline: 12000, idle: 0, gears: [1], final: 6.59, rw: 0.31, cDrag: 0.33, len: 3.95, wid: 1.78, steerMax: 0.62,
      ev: true, tracK: 1.1, spinK: 0.3 },
    arc: { amax: 1.74, kv: 2.1, rmin: 4.2 },
    csp: { bx: 0.15, coast: -0.095, thr: -0.04, liftP: 0, pwr: 0, out: 1, turn: 1, w: 1.02 },   // (the FF layer: pivots on the brakes, the throttle pulls it straight; its own thr)
    stats: { power: 4, grip: 7, weight: 6, drift: 4 },
    price: 22000, pk: 'ta1', field: ['jezek'],
    snd: { kind: 'ev', hz: 1, loud: 0.7 },
    expect: { t100: [3.14, 3.69], vmax: [194, 206], latG: [2.22, 2.32], d100: [22.9, 25.3] },
    parts: { set: 'car', ht: 1.5, y0: 0.2,
      over: { hood: { lx: 0.78 }, trunk: { lx: -0.95, y: 1.0 }, mirrorL: { lx: 0.41, y: 1.02 }, mirrorR: { lx: 0.41, y: 1.02 } } },   // (the hatch's tailgate at the tail, the mirrors on the doors' front corners: where the look has them)
    // the look (KIT API v1, render.js; look units = metres): one loft through the sections below, cut by the standard regions into the
    // parts (the front fascia with its light bar, the bonnet, the tailgate with its glass and light bar, the fenders, the quarters, the long
    // doors of a three-door with their glass), the details on top. Two-tone: the body in the paint, the greenhouse's frame (pillars, roof
    // rails, the roof's ends, the mirrors, the spoiler) in the stripe colour; the roof's middle is glass. The aero discs: steel-disc wheels
    look: {
      body: { len: 3.95, wid: 1.78, roofY: 1.5,
        //       x       w      yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-1.97, 0.8, 0.3, 0.86, 0.72, 0.93, 0.03, 'b', 0.12],     // the tail: the tailgate's lower panel (the bumper under it)
          [-1.94, 0.855, 0.27, 0.92, 0.74, 0.99, 0.04, 'gr', 0.11],      // the tailgate's glass, raked a little
          [-1.72, 0.885, 0.22, 1.0, 0.66, 1.36, 0.07, 'r', 0.1],         // its top: the roof rounds down into it (the spoiler over it)
          [-1.56, 0.89, 0.21, 0.997, 0.69, 1.4, 0.08, 'r', 0.1],
          [-1.465, 0.89, 0.21, 0.995, 0.7, 1.41, 0.085, 'r', 0.1],       // the glass roof's back end (the rear arch's cut there too)
          [-0.34, 0.89, 0.21, 0.985, 0.71, 1.415, 0.085, 'r', 0.1],      // the doors' rear edge, the B-pillar
          [0.2, 0.885, 0.21, 0.978, 0.71, 1.408, 0.083, 'r', 0.1],       // the glass roof's front end
          [0.4, 0.885, 0.21, 0.975, 0.7, 1.395, 0.08, 'gf', 0.1],        // the windscreen's top
          [1.075, 0.89, 0.21, 0.94, 0.8, 0.97, 0.045, 'b', 0.1],         // its base (the cowl, over the front wheel), the bonnet's back edge
          [1.7, 0.885, 0.22, 0.865, 0.79, 0.915, 0.04, 'b', 0.1],        // the short bonnet, falling to the nose; the bumper's corners from here
          [1.86, 0.86, 0.25, 0.81, 0.765, 0.855, 0.035, 'b', 0.11],      // its rounded front edge
          [1.94, 0.815, 0.28, 0.765, 0.715, 0.8, 0.025, 'b', 0.115],
          [1.98, 0.75, 0.3, 0.725, 0.65, 0.745, 0.015, 'b', 0.12]],      // the nose: the fascia's face
        eye: { x: -0.12, y: 1.27 },
        door: [0.89, -0.34], bumpF: 0.28, bumpR: 0.25, bumpY: [0.745, 0.55],
      },
      wheels: { style: 'std', spokes: 0, w: 0.205, rimK: 0.7, rim: [0.74, 0.75, 0.78], cap: [0.12, 0.78, 0.95], gap: 0.06 },
      regions: (std) => std.map(r => r.part === 'trunk' ? Object.assign({}, r, { bands: ['edge', 'crown'] }) : r),   // (the tailgate: its glass and its lower panel; the rear pillars stay on the body)
      build(K) {
        const P = K.paint, S = K.strp, G = K.GLASS, B = K.black, DK = K.dark;
        const GR0 = -1.465, GR1 = 0.2, XC = -1.28;   // the glass roof's ends; the quarter window's rear edge (the C-pillar's foot)
        const XA = K.arches[1].x - K.arches[1].half, XF = K.arches[0].x + K.arches[0].half;   // (the rear arch's back end, the front arch's front end)
        // ---- the shell: the paint below the belt, the glass, the frame of the greenhouse in the stripe colour (two-tone), black sills ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XF) ? B : K.shade(P, 0.62);   // (black sills and arches' ledges; the bumpers' undersides darker)
          if (e === 1 || e === 7) return P;
          if (e === 2 || e === 6) return kind === 'r' ? (at.x < XC ? P : G) : kind === 'gf' ? G : P;   // (the side glass; the hatch's broad C-pillar in the paint)
          if (e === 3 || e === 5) return kind === 'r' ? S : kind === 'gf' || kind === 'gr' ? G : P;                       // (the roof rails)
          return kind === 'r' ? (at.x > GR0 && at.x < GR1 ? G : S) : kind === 'gf' || kind === 'gr' ? G : P;               // (the glass roof)
        }, { caps: { front: { col: P, high: 'bumperF' }, rear: { col: P } }, glass: (k, e, kind, at) => kind === 'r' && (e === 3 || e === 5) && at.x > GR0 && at.x < GR1 });
        const D = L.decal;
        // the glass roof right across the roof's top, the rails each side of it (the edges' outer parts) in the stripe colour
        for (const sd of [-1, 1]) D.top([[GR0 + 0.04, sd * 0.27], [GR1 - 0.04, sd * 0.27], [GR1 - 0.04, sd * 0.47], [GR0 + 0.04, sd * 0.47]].map((p, i, a) => sd < 0 ? a[a.length - 1 - i] : p), G, 0.003);
        // the A- and B-pillars black (the glass a dark band under the roof's cap): the A-pillar along the windscreen's edge (three pieces:
        // about 6 cm deep all the way down), the B-pillar at the doors' rear edge; the C-pillar's slanted front edge; the shut lines
        D.band([[0.4, 0.857], [0.7, 0.757], [0.7, 1], [0.4, 1]], B, null, 0.008); D.band([[0.7, 0.757], [0.9, 0.54], [0.9, 1], [0.7, 1]], B, null, 0.008);
        D.band([[0.9, 0.54], [1.075, 0], [1.075, 1], [0.9, 1]], B, null, 0.008);
        D.band([[-0.43, 0], [-0.345, 0], [-0.345, 1], [-0.43, 1]], B, null, 0.008);
        D.band([[XC, 0], [XC + 0.13, 1], [XC, 1]], P, null, 0.008);
        D.side([[-1.96, 0.79], [1.95, 0.79], [1.95, 0.8], [-1.96, 0.8]], K.shade(P, 0.72), null, 0.004);   // (the shoulder's crease, nose to tail)
        D.side([[0.874, 0.33], [0.886, 0.33], [0.886, 0.97], [0.874, 0.97]], B, null, 0.004);
        D.side([[-0.336, 0.32], [-0.326, 0.32], [-0.326, 0.98], [-0.336, 0.98]], B, null, 0.004);
        // the flush door handles (a dark recess, a bright bar in it), the charge port's flap (right rear quarter)
        for (const sd of [-1, 1]) { const f = sd < 0 ? '-z' : 'z', h = sd < 0 ? 'doorL' : 'doorR';
          K.rect(-0.2, 0.86, sd * 0.892, 0.2, 0.032, B, { dir: f, host: h }); K.rect(-0.2, 0.86, sd * 0.896, 0.17, 0.012, K.chrome, { dir: f, host: h }); }
        K.rect(-1.62, 0.68, 0.891, 0.14, 0.11, DK, { dir: 'z', host: 'quarterR' }); K.rect(-1.62, 0.68, 0.895, 0.125, 0.095, P, { dir: 'z', host: 'quarterR' });
        // ---- the nose: the front fascia (the bumper: the whole face): the closed grille panel, gloss black, right across under the bonnet's
        //      edge, the LED light bar along its top (the head lamps' lenses: the bar's halves, the indicators in its ends); a slim intake ----
        K.part('bumperF', () => {
          K.face([[1.983, 0.48, 0.5], [1.983, 0.48, -0.5], [1.983, 0.58, -0.64], [1.983, 0.735, -0.64], [1.983, 0.735, 0.64], [1.983, 0.58, 0.64]], B);   // (a visor: its lower corners cut)
          K.rect(1.982, 0.37, 0, 0.84, 0.06, B);
          K.rect(1.985, 0.665, 0, 1.2, 0.008, [0.12, 0.78, 0.95]);   // (a thin cyan line under the bar: the electric's accent)
        }, { hinge: [[1.9, 0.35, -0.7], [1.9, 0.35, 0.7]] });
        for (const sd of [-1, 1]) K.headLamp(1.987, 0.7, sd * 0.31, 0.03, { shape: 'rect', w: 0.62, h: 0.05, ring: null, host: 'bumperF' });
        // ---- the tail: the tailgate's black band with the red light bar across it (the tail mesh), the spoiler over its glass, its wiper;
        //      the bumper with the plate, the reflectors, a dark diffuser ----
        K.part('trunk', () => {
          K.face([[-1.983, 0.685, -0.56], [-1.983, 0.685, 0.56], [-1.983, 0.74, 0.66], [-1.983, 0.835, 0.66], [-1.983, 0.835, -0.66], [-1.983, 0.74, -0.66]], B);   // (the nose's visor, mirrored)
          const y0 = L.topY(-1.64, 0);
          K.plate([[-1.64, y0 + 0.004, -0.62], [-1.64, y0 + 0.004, 0.62], [-1.79, y0 - 0.035, 0.6], [-1.79, y0 - 0.035, -0.6]], 0.025, S);
          K.bar([-1.915, 1.07, -0.02], [-1.85, 1.22, -0.4], 0.01, B, { n: 4 });
        }, { hinge: [[-1.72, 1.43, -0.6], [-1.72, 1.43, 0.6]] });
        for (const sd of [-1, 1]) K.tailLamp(-1.985, 0.77, sd * 0.31, 0.62, 0.055, { host: 'trunk' });
        K.part('bumperR', () => {
          K.rect(-1.983, 0.44, 0, 0.5, 0.11, [0.93, 0.93, 0.9], { dir: '-x' });
          K.rect(-1.982, 0.335, 0, 1.2, 0.06, DK, { dir: '-x' });
          for (const sd of [-1, 1]) K.rect(-1.982, 0.46, sd * 0.62, 0.14, 0.035, K.rgb(0xb01010), { dir: '-x' });
        });
        // ---- the mirrors (the stripe colour), the wipers ----
        for (const sd of [-1, 1]) K.mirror(0.95, 1.02, sd * 0.955, { col: S, w: 0.08, h: 0.085, d: 0.15, arm: B });
        for (const z of [-0.5, 0.06]) K.bar([1.035, 1.055, z - 0.06], [0.965, 1.1, z + 0.44], 0.01, B, { n: 4, part: 'body' });
        K.hinge('hood', [1.08, 1.0, -0.6], [1.08, 1.0, 0.6]);
        K.hinge('doorL', [0.88, 0.35, -0.89], [0.88, 0.95, -0.89]); K.hinge('doorR', [0.88, 0.35, 0.89], [0.88, 0.95, 0.89]);
        // ---- inside (seen once a part is off): the seats, the dashboard with its screen across, the wheel; the drive unit in the bay ----
        for (const sd of [-1, 1]) K.seat(-0.22, 0.56, sd * 0.36, { w: 0.48, back: 0.64 });
        K.seat(-1.02, 0.55, 0, { w: 1.24, back: 0.55 });
        K.box(0.76, 0.68, 0, 0.36, 0.28, 1.5, 0, DK, null, false, { inner: true, part: 'body' });
        K.rect(0.578, 0.86, 0, 1.2, 0.1, [0.28, 0.42, 0.55], { dir: '-x', inner: true, part: 'body' });
        K.cyl([0.54, 0.84, -0.36], [0.5, 0.87, -0.36], 0.17, B, { n: 8, inner: true, part: 'body' });
        K.box(0.2, 0.24, 0, 0.56, 0.24, 0.22, 0, DK, null, false, { inner: true, part: 'body' });
        K.engine(1.4, 0.3, 0, { l: 0.5, w: 0.72, h: 0.36, col: [0.6, 0.61, 0.64], cover: [0.2, 0.2, 0.22] });
        for (const z of [-0.18, -0.08]) K.bar([1.18, 0.56, z], [0.9, 0.3, z], 0.022, K.rgb(0xf07818), { n: 4, inner: true, part: 'body' });   // (the orange high-voltage cables to the battery under the floor)
      },
    },
  });
})();
