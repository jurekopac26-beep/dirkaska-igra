/* Vehicle 'jezek' — JEŽEK E: a retro-modern electric city hatch. Signature features: 1) a rounded two-box hatch with a short bonnet, 2)
   LED light bars across the nose and the tail, 3) flush door handles and a closed grille panel, 4) a glass roof over a two-tone body, 5)
   aero-disc wheels. L 3.95 W 1.78 H 1.50, wheelbase 2.54, overhangs F 0.72 R 0.69 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp in the place of each half of the LED bar across the nose (u out from the car's middle, v up; metres round
  // z 0.31, y 0.7): every option takes this outline (the two halves meet in the middle, as the bar's)
  const BAR = [[-0.31, -0.025], [0.31, -0.025], [0.31, 0.025], [-0.31, 0.025]];
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
    partNames: { spoiler: 'roof spoiler', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp',
      plate: 'number plate', wiperFront: 'windscreen wipers', wiperRear: 'rear wiper', aerial: 'aerial' },
    parts: { set: 'car', ht: 1.5, y0: 0.2,
      over: { hood: { lx: 0.78 }, trunk: { lx: -0.95, y: 1.0 }, doorL: { lx: 0.14, y: 0.86 }, doorR: { lx: 0.14, y: 0.86 },
        mirrorL: { lx: 0.48, lz: -1.04, y: 1.01 }, mirrorR: { lx: 0.48, lz: 1.04, y: 1.01 } },   // (where the look has them: the short bonnet, the hatch's tailgate, the long doors, the mirrors by the A-pillars)
      // (as KOLIBRI's: the LED bar's halves parts of their own on the front fascia, the tail lamps (each with its half of the black visor),
      // the spoiler and the rear wiper on the tailgate, the plate on the rear bumper (they go with it, turn with it); the wipers, the
      // aerial's fin on the roof; a hit on a lamp's corner knocks it out)
      extra: {
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.3, h: 0.04, lx: 1.0, lz: -0.35, y: 0.7, on: 'bumperF' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.3, h: 0.04, lx: 1.0, lz: 0.35, y: 0.7, on: 'bumperF' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.3, h: 0.04, lx: -1.0, lz: -0.4, y: 0.755, on: 'trunk' },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.3, h: 0.04, lx: -1.0, lz: 0.4, y: 0.755, on: 'trunk' },
        spoiler: { z: 1, th: 0.6, m: 2, r: 0.4, h: 0.05, lx: -0.88, lz: 0, y: 1.25, on: 'trunk' },
        plate: { z: 1, th: 0.4, m: 1, r: 0.17, h: 0.02, lx: -1.0, lz: 0, y: 0.44, on: 'bumperR' },
        wiperRear: { z: 1, th: 0.45, m: 0.5, r: 0.2, h: 0.03, lx: -0.95, lz: -0.24, y: 1.15, on: 'trunk' },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.45, h: 0.03, lx: 0.51, lz: -0.03, y: 1.08 },
        aerial: { z: 1, th: 0.5, m: 0.3, r: 0.12, h: 0.045, lx: -0.78, lz: 0, y: 1.45 },
      },
    },
    // where the garage's parts go (js/deli.js, look units): the wing on the roof's back edge, in the spoiler's part (in place of the lip,
    // on the tailgate: it opens and goes with it); the head lamps in the place of the LED bar's halves (every option in their outline,
    // BAR), in the lamps' parts; the rims
    mounts: {
      krilo: { x: -1.72, w: 0.6, part: 'spoiler' },
      zarometi: { x: 1.984, y0: 0.7, lean: 0, zc: 0.31, yc: 0.7, s: 0.28, hosts: ['headL', 'headR'], shape: BAR, bulge: 0, ringW: 0.006 },
      platisca: {},
    },
    // the look (KIT API v1, render.js; look units = metres): one loft through the sections below, cut by the standard regions into the
    // parts (the front fascia with its light bar, the bonnet, the tailgate with its glass and light bar, the fenders, the quarters, the long
    // doors of a three-door with their glass), the details on top. Two-tone: the body in the paint, the roof (its rails and ends), the
    // mirrors and the spoiler in the stripe colour, the roof's middle glass; the A- and B-pillars black (the glass a dark band under the
    // roof), the hatch's broad C-pillar in the paint. The aero discs: the steel-disc wheel (no spokes) in silver, a cyan cap (the electric's)
    look: {
      body: { len: 3.95, wid: 1.78, roofY: 1.5,
        //       x       w      yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-1.97, 0.74, 0.3, 0.86, 0.68, 0.93, 0.03, 'b', 0.12],    // the tail: the tailgate's lower panel (the bumper under it), round in plan
          [-1.94, 0.82, 0.27, 0.92, 0.7, 0.99, 0.04, 'gr', 0.11],        // the tailgate's glass, raked,
          [-1.8, 0.875, 0.24, 0.96, 0.62, 1.16, 0.07, 'gr', 0.1],        // rounding over into the roof
          [-1.72, 0.885, 0.22, 0.98, 0.62, 1.27, 0.09, 'r', 0.1],        // the roof's back edge (the spoiler over it): the roof falls into it
          [-1.56, 0.89, 0.21, 0.977, 0.65, 1.35, 0.11, 'r', 0.1],
          [-1.465, 0.89, 0.21, 0.975, 0.7, 1.385, 0.1, 'r', 0.1],        // the glass roof's back end (the rear arch's cut there too)
          [-0.34, 0.89, 0.21, 0.965, 0.71, 1.415, 0.085, 'r', 0.1],      // the doors' rear edge, the B-pillar
          [0.2, 0.885, 0.21, 0.958, 0.71, 1.408, 0.083, 'r', 0.1],       // the glass roof's front end
          [0.4, 0.885, 0.21, 0.955, 0.7, 1.395, 0.08, 'gf', 0.1],        // the windscreen's top
          [1.075, 0.89, 0.21, 0.94, 0.8, 0.97, 0.045, 'b', 0.1],         // its base (the cowl, over the front wheel), the bonnet's back edge
          [1.7, 0.885, 0.22, 0.865, 0.79, 0.915, 0.04, 'b', 0.1],        // the short bonnet, falling to the nose; the bumper's corners from here
          [1.86, 0.845, 0.25, 0.81, 0.765, 0.855, 0.035, 'b', 0.11],     // its rounded front edge (round in plan too)
          [1.94, 0.78, 0.28, 0.765, 0.69, 0.8, 0.025, 'b', 0.115],
          [1.98, 0.69, 0.3, 0.725, 0.6, 0.745, 0.015, 'b', 0.12]],       // the nose: the fascia's face
        eye: { x: -0.12, y: 1.27 },
        door: [0.89, -0.34], bumpF: 0.28, bumpR: 0.25, bumpY: [0.745, 0.55],
      },
      wheels: { style: 'std', spokes: 0, w: 0.205, rimK: 0.7, rim: [0.74, 0.75, 0.78], cap: [0.12, 0.78, 0.95], gap: 0.06 },
      regions: (std) => std.map(r => r.part === 'trunk' ? Object.assign({}, r, { bands: ['edge', 'crown'] }) : r),   // (the tailgate: its glass and its lower panel; the rear pillars stay on the body)
      build(K) {
        const P = K.paint, S = K.strp, G = K.GLASS, B = K.black, DK = K.dark;
        const GR0 = -1.465, GR1 = 0.2, XC = -1.28;   // the glass roof's ends; the quarter window's rear edge (the C-pillar's foot)
        const XA = K.arches[1].x - K.arches[1].half, XF = K.arches[0].x + K.arches[0].half;   // (the rear arch's back end, the front arch's front end)
        // ---- the shell: the paint below the belt, the glass, the roof in the stripe colour (two-tone), black sills ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XF) ? B : K.shade(P, 0.62);   // (black sills and arches' ledges; the bumpers' undersides darker)
          if (e === 1 || e === 7) return P;
          if (e === 2 || e === 6) return kind === 'r' ? (at.x < XC ? P : G) : kind === 'gf' ? (at.x > 0.88 ? B : G) : P;   // (the side glass; the mirrors' black sails; the hatch's broad C-pillar in the paint)
          if (e === 3 || e === 5) return kind === 'r' ? S : kind === 'gf' || kind === 'gr' ? G : P;                       // (the roof rails)
          return kind === 'r' ? (at.x > GR0 && at.x < GR1 ? G : S) : kind === 'gf' || kind === 'gr' ? G : P;               // (the glass roof)
        }, { caps: { front: { col: P, high: 'bumperF' }, rear: { col: P } }, glass: (k, e, kind, at) => kind === 'r' && (e === 3 || e === 5) && at.x > GR0 && at.x < GR1 });
        const D = L.decal;
        // the glass roof right across the roof's top, the rails each side of it (the edges' outer parts) in the stripe colour
        for (const sd of [-1, 1]) D.top([[GR0 + 0.04, sd * 0.27], [GR1 - 0.04, sd * 0.27], [GR1 - 0.04, sd * 0.47], [GR0 + 0.04, sd * 0.47]], G, 0.003);   // (the edges under it: glass, unlined)
        // the A- and B-pillars black (the glass a dark band under the roof's cap): the A-pillar along the windscreen's edge (two pieces: about
        // 6 cm deep down to the mirror's black sail), the B-pillar at the doors' rear edge; the C-pillar's slanted front edge; the shut lines
        D.band([[0.4, 0.857], [0.7, 0.757], [0.7, 1], [0.4, 1]], B, null, 0.008); D.band([[0.7, 0.757], [0.89, 0.55], [0.89, 1], [0.7, 1]], B, null, 0.008);
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
        //      edge, the LED light bar along its top (the head lamps' lenses: the bar's two halves); a slim intake under it ----
        K.part('bumperF', () => {
          K.face([[1.983, 0.48, 0.5], [1.983, 0.48, -0.5], [1.983, 0.58, -0.64], [1.983, 0.735, -0.64], [1.983, 0.735, 0.64], [1.983, 0.58, 0.64]], B);   // (a visor: its lower corners cut)
          K.rect(1.982, 0.37, 0, 0.84, 0.06, B);
          K.rect(1.985, 0.665, 0, 1.2, 0.008, [0.12, 0.78, 0.95]);   // (a thin cyan line under the bar: the electric's accent)
        }, { hinge: [[1.9, 0.35, -0.7], [1.9, 0.35, 0.7]] });
        // (the bar's halves parts of their own on the fascia: headL, headR; the garage's in their place: K.deli, mounts.zarometi)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(1.987, 0.7, sd * 0.31, 0.03, { shape: 'rect', w: 0.62, h: 0.05, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        // ---- the tail: the tailgate's black band with the red light bar across it (the tail mesh), the spoiler over its glass, its wiper;
        //      the bumper with the plate, the reflectors, a dark diffuser ----
        K.hinge('trunk', [-1.72, 1.36, -0.6], [-1.72, 1.36, 0.6]);
        // the visor (the nose's, mirrored) in two halves, each with its tail lamp a part of its own on the tailgate (tailL, tailR); its top
        // 4 mm further back than its foot (the piece on the road has a volume)
        const xv = (y) => -1.983 - 0.004 * (y - 0.685) / 0.15;
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR', V = [[0, 0.685], [0.56, 0.685], [0.66, 0.74], [0.66, 0.835], [0, 0.835]].map(([z, y]) => [xv(y), y, sd * z]);
          K.face(sd > 0 ? V : V.slice().reverse(), B, { host: tp }); K.tailLamp(-1.985, 0.77, sd * 0.31, 0.62, 0.055, { host: tp }); }
        // the spoiler: a lip off the roof's back edge over the glass, following the roof's crown across (its foot just under the roof); a
        // part of its own on the tailgate (the garage's wing in its place: K.deli, mounts.krilo)
        K.part('spoiler', () => K.deli('krilo', () => {
          const sp = (z) => [[-1.66, L.topY(-1.66, z) - 0.002, z], [-1.8, L.topY(-1.72, z) - 0.02, z], [-1.8, L.topY(-1.72, z) - 0.04, z], [-1.735, L.topY(-1.735, z) - 0.003, z]];
          K.skin([-0.58, -0.24, 0.24, 0.58].map(sp), (k, e) => e === 0 ? S : K.shade(S, e === 1 ? 0.7 : 0.5), S, S);
        }), { hinge: [[-1.72, 1.36, -0.6], [-1.72, 1.36, 0.6]] });
        K.bar([-1.915, 1.07, -0.02], [-1.85, 1.22, -0.4], 0.01, B, { n: 4, part: 'wiperRear' });   // (the rear wiper on the tailgate)
        K.part('bumperR', () => {
          K.rect(-1.982, 0.335, 0, 1.2, 0.06, DK, { dir: '-x' });
          for (const sd of [-1, 1]) K.rect(-1.982, 0.46, sd * 0.62, 0.14, 0.035, K.rgb(0xb01010), { dir: '-x' });
        });
        // the plate on the rear bumper, a part of its own (its top 4 mm further back than its foot: the piece on the road has a volume)
        K.face([[-1.983, 0.385, -0.25], [-1.983, 0.385, 0.25], [-1.987, 0.495, 0.25], [-1.987, 0.495, -0.25]], [0.93, 0.93, 0.9], { host: 'plate' });
        K.endplate([[-1.6, L.topY(-1.6, 0) - 0.01], [-1.47, L.topY(-1.47, 0) - 0.01], [-1.575, L.topY(-1.575, 0) + 0.06]], 0, 0.045, B, { part: 'aerial' });   // (the aerial's fin on the roof, behind the glass, its foot on the roof's slope)
        // ---- the mirrors (the stripe colour), the wipers ----
        for (const sd of [-1, 1]) K.mirror(0.95, 1.02, sd * 0.955, { col: S, w: 0.08, h: 0.085, d: 0.15, arm: B });
        for (const z of [-0.5, 0.06]) K.bar([1.035, 1.055, z - 0.06], [0.965, 1.1, z + 0.44], 0.01, B, { n: 4, part: 'wiperFront' });
        K.hinge('hood', [1.08, 1.0, -0.6], [1.08, 1.0, 0.6]);
        K.hinge('doorL', [0.88, 0.35, -0.89], [0.88, 0.95, -0.89]); K.hinge('doorR', [0.88, 0.35, 0.89], [0.88, 0.95, 0.89]);
        // ---- inside (seen once a part is off): the seats, the dashboard with its screen across, the wheel; the drive unit in the bay ----
        for (const sd of [-1, 1]) K.seat(-0.22, 0.56, sd * 0.36, { w: 0.48, back: 0.64 });
        K.seat(-1.02, 0.55, 0, { w: 1.24, back: 0.55 });
        K.box(0.76, 0.68, 0, 0.36, 0.28, 1.5, 0, DK, null, false, { inner: true, part: 'body' });
        K.rect(0.578, 0.86, 0, 1.2, 0.1, [0.28, 0.42, 0.55], { dir: '-x', inner: true, part: 'body' });
        K.cyl([0.54, 0.84, -0.36], [0.5, 0.87, -0.36], 0.17, B, { n: 8, inner: true, part: 'body' });
        K.box(0.2, 0.24, 0, 0.56, 0.24, 0.22, 0, DK, null, false, { inner: true, part: 'body' });
        // (the bay: the motor and its gearbox low between the front wheels, the inverter on it, the orange high-voltage cables from it down to
        // the battery under the floor, the 12 V battery, the coolant tank, the radiator behind the fascia)
        K.engine(1.4, 0.28, 0, { l: 0.46, w: 0.66, h: 0.34, col: [0.58, 0.59, 0.62], cover: [0.34, 0.35, 0.38] });
        const OR = K.rgb(0xf07818), IN = { inner: true, part: 'body' };
        K.box(1.42, 0.62, 0, 0.36, 0.1, 0.46, 0, [0.72, 0.73, 0.76], null, false, IN);
        for (const z of [-0.12, 0.12]) { K.bar([1.6, 0.73, z], [1.26, 0.73, z], 0.02, OR, Object.assign({ n: 4 }, IN)); K.bar([1.26, 0.73, z], [0.98, 0.34, z], 0.022, OR, Object.assign({ n: 4 }, IN)); }
        K.box(1.62, 0.36, 0.44, 0.22, 0.2, 0.17, 0, K.black, null, false, IN); K.box(1.66, 0.46, -0.44, 0.15, 0.15, 0.13, 0, [0.86, 0.86, 0.8], null, false, IN);
        K.box(1.86, 0.3, 0, 0.05, 0.36, 1.2, 0, DK, null, false, IN);
        // ---- the dashboard's top (the outer shell, matte): from the windscreen's foot under the cowl's crown back over the dash, so the
        //      driver never looks under the bonnet into the nose (the road, the back of the light bar) above the cockpit's own dashboard ----
        { const A = [1.05, 1.02, 0], E = [0.8, 0.965, 0], o = { part: 'body', noCrush: true };
          for (const sd of [1, -1]) { const B = [1.05, 1.02, sd * 0.3], C = [1.04, 0.97, sd * 0.8], D = [0.8, 0.965, sd * 0.8], f = (p) => K.face(sd > 0 ? p : p.slice().reverse(), K.lining, o);
            f([E, D, C]); f([E, C, B]); f([E, B, A]); } }
      },
    },
  });
})();
