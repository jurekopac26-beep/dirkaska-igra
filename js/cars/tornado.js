/* Vehicle 'tornado' — TORNADO V8: an American oval-track stock car. Signature features: 1) a long saloon silhouette on a stock-car
   chassis, 2) big numbers on the doors and the roof, 3) window nets in the side windows, 4) a blade spoiler across the tail, 5) a flat
   splitter and roof flaps. L 5.05 W 2.00 H 1.30, wheelbase 2.79, overhangs F 1.12 R 1.14 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'tornado', name: 'TORNADO V8', cat: 'dirkalni', ord: 3, drive: 'FR',
    desc: 'Ameriški dirkalnik za ovale z velikimi številkami in mrežami na oknih.',
    phys: { mass: 1550, a: 1.4, b: 1.39, kI: 1.38, kw: 560, redline: 8800, idle: 900, gears: [2.2, 1.6, 1.25, 1], final: 4.2, rw: 0.34, cDrag: 0.5, len: 5.05, wid: 2, steerMax: 0.58,
      tracK: 1.1, brakeK: 1.05, spinK: 0.3, aero: 0.00004, loose: 0.78, aiGap: 7.5, aiPass: 4 },   // (aiGap / aiPass: its AI follows further back and passes wider: fewer pile-ups on the Nordschleife, tests/fleet.test.js 8b)
    arc: { amax: 1.78, kv: 2.2, rmin: 5 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.12, pwr: 0.1, out: 1.15, turn: 1, w: 1, tv: 0.9 },   // (the FR layer: lift-off and power rotation; its own pwr, liftP, out, tv)
    stats: { power: 10, grip: 9, weight: 4, drift: 7 },
    price: 65000, pk: 'unl', field: ['tornado'],
    snd: { kind: 'v8', hz: 0.85, loud: 1.3 },
    expect: { t100: [2.97, 3.49], vmax: [247, 262], latG: [2.35, 2.45], d100: [21.6, 23.9] },
    parts: { set: 'race', ht: 1.3, y0: 0.12,
      over: {
        wing: { f: 0.62, lx: -0.97, m: 4 },
        trunk: { lx: -0.83, y: 1.02 },   // (the deck lid behind the long rear glass, where the look has it)
      },
    },
    // the look (KIT API v1, render.js; look units = metres): a long two-door saloon on one loft, low and slab-sided, the wheels flush under
    // tight arches; a short roof between the raked windscreen and a long flat rear glass, a high flat deck with the blade spoiler across its
    // trailing edge, a blunt nose over the flat splitter. The standard regions cut it: the hood and the deck lid (their tops), the front
    // fenders, the rear quarters (with the quarter glass), the doors with their glass, nets and numbers, the nose cover (bumperF: the whole
    // nose from the hood's leading edge, the grilles, the lamps, the splitter), the rear bumper, the mirrors
    look: {
      body: { len: 5.05, wid: 2.0, roofY: 1.3,
        //       x      w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.53, 0.9, 0.2, 0.8, 0.84, 0.99, 0.01, 'b', 0.06],      // the tail's face (the lamps along its top, the bumper under them)
          [-2.43, 0.975, 0.15, 0.86, 0.885, 1.015, 0.015, 'b', 0.06],    // the deck lid's trailing edge (the spoiler on it); the corners round in plan
          [-1.66, 0.99, 0.11, 0.89, 0.875, 1.04, 0.02, 'gr', 0.07],      // the rear glass's base: the deck lid's front edge
          [-1.1, 0.99, 0.11, 0.875, 0.72, 1.268, 0.032, 'r', 0.07],      // the roof's back edge (the long flat rear glass up to it)
          [-0.1, 0.99, 0.11, 0.87, 0.72, 1.268, 0.032, 'gf', 0.07],      // the windscreen's top
          [0.55, 0.99, 0.11, 0.86, 0.86, 0.935, 0.025, 'b', 0.07],       // the cowl: the windscreen's base, the doors' front edge
          [1.85, 0.99, 0.11, 0.74, 0.865, 0.82, 0.03, 'b', 0.07],        // the hood over the front wheels
          [2.28, 0.955, 0.1, 0.68, 0.84, 0.745, 0.02, 'b', 0.06],        // the hood's leading edge (the nose cover from here on: bumperF)
          [2.42, 0.89, 0.09, 0.6, 0.78, 0.66, 0.01, 'b', 0.05],          // the nose's rounded top
          [2.47, 0.83, 0.085, 0.53, 0.74, 0.6, 0.005, 'b', 0.045]],      // the nose's face: the grilles, the lamps (the splitter under it)
        eye: { x: -0.55, y: 1.05, style: 'closed' }, cage: true,        // (low and far back, the cage round the driver)
        door: [0.55, -0.6], bumpF: 0.19, bumpR: 0.1, bumpY: [0.42, 0.48],
        decalX: -0.47, decalY: 1.3, decalRz: 0, decalS: 0.85 },         // (the roof number: in front of the roof flaps)
      wheels: { style: 'std', spokes: 0, w: 0.28, rimK: 0.58, rim: [0.3, 0.3, 0.32], cap: [0.18, 0.18, 0.19], gap: 0.05 },
      // the nose cover takes the whole nose from the hood's leading edge; the lids take their tops only (the shoulders stay with the
      // fenders and the quarters)
      regions: (std) => [{ part: 'bumperF', x: [2.28, 3.2], bands: ['tuck', 'side', 'window', 'edge', 'crown'] }]
        .concat(std.map(r => r.part === 'hood' || r.part === 'trunk' ? Object.assign({}, r, { bands: ['edge', 'crown'] }) : r)),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, CF = [0.05, 0.05, 0.055], D = [0.1, 0.1, 0.11], CH = K.chrome, NET = [0.03, 0.03, 0.033];
        const LR = (n, sd) => n + (sd < 0 ? 'L' : 'R'), dirZ = (sd) => sd < 0 ? '-z' : 'z';
        const XF = K.arches[0].x - K.arches[0].half, XR = K.arches[1].x + K.arches[1].half;   // (the front arch's rear end, the rear arch's front end)
        // ---- the shell: the paint; the glass (the windscreen, the side windows from the A-pillar to the C-pillar, the rear glass); the
        //      sills black between the arches (the skirts), the arches' ledges black ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : at.x > XR && at.x < XF ? CF : K.shade(P, 0.6);
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          if (kind === 'r') return e === 2 || e === 6 ? G : P;
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : P;
          return P;
        }, { caps: { front: { col: P, low: 'bumperF', high: 'bumperF' }, rear: { col: P } } });
        const DL = L.decal;
        // the glass's black frames (along the belt, under the roof's edge, the quarter glass's back edge), the B-pillar in the paint, the
        // A-pillars in the paint (four pieces: the pillar keeps its width down to the cowl)
        DL.band([[-1.1, 0], [0.55, 0], [0.55, 0.06], [-1.1, 0.06]], B, null, 0.006);
        DL.band([[-1.1, 0.93], [-0.1, 0.93], [-0.1, 1], [-1.1, 1]], B, null, 0.006);
        DL.band([[-1.1, 0], [-1.06, 0], [-1.06, 1], [-1.1, 1]], B, null, 0.007);
        DL.band([[-0.66, 0], [-0.56, 0], [-0.56, 1], [-0.66, 1]], P, null, 0.008);
        for (const q of [[-0.1, 0.824, 0.1, 0.766], [0.1, 0.766, 0.25, 0.688], [0.25, 0.688, 0.4, 0.532], [0.4, 0.532, 0.55, 0]]) DL.band([[q[0], q[1]], [q[2], q[3]], [q[2], 1], [q[0], 1]], P, null, 0.008);
        // the window nets in the side windows (the doors' glass, from the B-pillar to under the A-pillar): straps across and up, a frame
        const xn0 = -0.545, xn1 = 0.28, un0 = 0.08, un1 = 0.8;
        for (const [u0, u1] of [[un0, un0 + 0.05], [0.31, 0.35], [0.54, 0.58], [un1 - 0.05, un1]]) DL.band([[xn0, u0], [xn1, u0], [xn1, u1], [xn0, u1]], NET, null, 0.01);
        for (let i = 0; i <= 7; i++) { const x = xn0 + (xn1 - xn0) * i / 7, h = i === 0 || i === 7 ? 0.03 : 0.018; DL.band([[x - h / 2, un0], [x + h / 2, un0], [x + h / 2, un1], [x - h / 2, un1]], NET, null, 0.011); }
        // the livery: a broad band in the stripe colour down the middle of the hood and the deck lid; the windscreen's banner (split at the
        // crown's edges: a flat piece would sink under the crest); the numbers on the doors (big, on panels in the stripe colour)
        DL.top([[0.62, -0.3], [2.24, -0.3], [2.24, 0.3], [0.62, 0.3]], S, 0.006);
        DL.top([[-2.4, -0.3], [-1.7, -0.3], [-1.7, 0.3], [-2.4, 0.3]], S, 0.006);
        for (const [z0, z1] of [[-0.72, -0.275], [-0.275, 0.275], [0.275, 0.72]]) DL.top([[-0.1, z0], [0.02, z0], [0.02, z1], [-0.1, z1]], S, 0.006);
        for (const sd of [-1, 1]) K.number(-0.03, 0.5, sd * 0.992, 0.46, { dir: dirZ(sd), w: 0.74, bg: S, slant: 0.14, host: LR('door', sd) });
        // the roof flaps (two panels on the roof's back, the right one turned) and the roof rails along its edges
        const flap = (cx, cz, a) => { const c = Math.cos(a), s = Math.sin(a); return [[-0.1, -0.1], [0.1, -0.1], [0.1, 0.1], [-0.1, 0.1]].map(([u, v]) => [cx + u * c - v * s, cz + u * s + v * c]); };
        DL.top(flap(-0.96, -0.15, 0), K.shade(P, 0.72), 0.005); DL.top(flap(-0.96, 0.14, 0.5), K.shade(P, 0.72), 0.005);
        for (const sd of [-1, 1]) K.box(-0.6, L.topY(-0.6, 0.56) - 0.006, sd * 0.56, 0.96, 0.028, 0.012, 0, K.shade(P, 0.7), null, false, { part: 'body' });
        // the hood pins
        for (const x of [0.75, 2.1]) for (const sd of [-1, 1]) K.rect(x, L.topY(x, sd * 0.6) + 0.004, sd * 0.6, 0.04, 0.04, B, { dir: 'y' });
        // ---- the nose: a blunt face with the lower mouth, the upper grille between the lamps (stickers, as the oval racers have), the
        //      flat splitter under it all; the nose cover (bumperF) ----
        K.part('bumperF', () => {
          K.grille(2.472, 0.235, 0, 0.94, 0.17, { slats: 2, slatCol: [0.2, 0.2, 0.21] });
          K.grille(2.472, 0.47, 0, 0.44, 0.07, { slats: 1 });
          K.box(2.415, 0.05, 0, 0.23, 0.035, 1.72, 0, CF);                                  // the splitter, out past the face
          for (const sd of [-1, 1]) { K.box(2.44, 0.085, sd * 0.6, 0.06, 0.06, 0.012, 0, CF); K.rect(2.472, 0.32, sd * 0.66, 0.12, 0.05, B); }   // (its stays; the brake ducts)
        }, { hinge: [[2.28, 0.6, -0.8], [2.28, 0.6, 0.8]] });
        for (const sd of [-1, 1]) K.headLamp(2.474, 0.47, sd * 0.53, 0.045, { shape: 'rect', w: 0.27, h: 0.09, ring: null, host: 'bumperF' });
        // ---- the tail: a black panel across its top with the lamps; the rear bumper's black valance; the exhaust out of the right side
        //      ahead of the rear wheel ----
        K.rect(-2.532, 0.8, 0, 1.56, 0.13, B, { dir: '-x', part: 'body' });
        for (const sd of [-1, 1]) K.tailLamp(-2.534, 0.8, sd * 0.52, 0.46, 0.1);
        K.part('bumperR', () => {
          K.box(-2.47, 0.12, 0, 0.12, 0.14, 1.6, 0, CF);
          for (const sd of [-1, 1]) K.rect(-2.533, 0.4, sd * 0.7, 0.12, 0.04, [0.6, 0.05, 0.04], { dir: '-x' });   // (the reflectors)
        });
        for (const x of [-0.78, -0.88]) K.cyl([x, 0.17, 0.93], [x, 0.17, 1.005], 0.042, CH, { n: 8, capA: null, capB: [0.03, 0.03, 0.035], part: 'body' });
        // the fuel filler on the left rear quarter
        K.face([0, 1, 2, 3, 4, 5, 6, 7].map(i => [-1.95 - Math.cos(i * Math.PI / 4) * 0.055, 0.79 + Math.sin(i * Math.PI / 4) * 0.055, -(L.prop(-1.95, 'w') + 0.006)]), D, { part: 'quarterL' });
        // ---- the blade spoiler across the deck lid's trailing edge, its braces behind it (never crushed with the roof) ----
        K.part('wing', () => {
          K.plate([[-2.448, 1.02, -0.84], [-2.448, 1.02, 0.84], [-2.535, 1.21, 0.84], [-2.535, 1.21, -0.84]], 0.012, CF);
          for (const z of [-0.55, 0, 0.55]) K.box(-2.505, 0.99, z, 0.05, 0.13, 0.012, 0, CF);
        }, { noCrush: true, noDent: true });
        // ---- the mirrors (small, black) ----
        for (const sd of [-1, 1]) K.mirror(0.4, 0.97, sd * 0.975, { w: 0.08, h: 0.065, d: 0.11, col: B });
        // ---- inside (seen once a part is off): the containment seat on the left, the dashboard and the wheel, the cage (the door bars
        //      on both sides), the V8 under the hood with its round air cleaner, the radiator, the fuel cell under the deck ----
        K.seat(-0.62, 0.34, -0.3, { w: 0.5, l: 0.46, back: 0.84, tilt: 0.16, col: [0.12, 0.12, 0.13] });
        K.box(0.42, 0.6, 0, 0.28, 0.2, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([0.08, 0.84, -0.3], [0.05, 0.86, -0.3], 0.17, B, { n: 8, inner: true, part: 'body' });
        const cg = [0.78, 0.79, 0.8], yH = 1.2;
        K.cage([
          [[-0.95, 0.15, -0.86], [-0.95, yH, -0.64]], [[-0.95, 0.15, 0.86], [-0.95, yH, 0.64]], [[-0.95, yH, -0.64], [-0.95, yH, 0.64]],
          [[0.5, 0.25, -0.88], [-0.12, yH, -0.64]], [[0.5, 0.25, 0.88], [-0.12, yH, 0.64]], [[-0.12, yH, -0.64], [-0.12, yH, 0.64]],
          [[-0.12, yH, -0.64], [-0.95, yH, -0.64]], [[-0.12, yH, 0.64], [-0.95, yH, 0.64]],
          [[0.45, 0.35, -0.88], [-0.95, 0.35, -0.88]], [[0.45, 0.5, -0.88], [-0.95, 0.5, -0.88]], [[0.45, 0.65, -0.88], [-0.95, 0.65, -0.88]],
          [[0.45, 0.4, 0.88], [-0.95, 0.4, 0.88]], [[0.45, 0.6, 0.88], [-0.95, 0.6, 0.88]],
          [[-0.95, yH, -0.6], [-1.85, 0.6, -0.6]], [[-0.95, yH, 0.6], [-1.85, 0.6, 0.6]], [[-0.95, yH, -0.6], [-0.95, 0.2, 0.8]],
        ], 0.024, cg, { n: 4 });
        K.engine(1.55, 0.24, 0, { l: 0.72, w: 0.62, h: 0.42, cover: [0.7, 0.1, 0.08] });
        K.cyl([1.55, 0.68, 0], [1.55, 0.73, 0], 0.17, B, { n: 8, inner: true, part: 'body' });
        K.box(2.18, 0.14, 0, 0.06, 0.42, 1.3, 0, D, null, false, { inner: true, part: 'body' });
        K.box(-2.05, 0.28, 0, 0.5, 0.34, 0.9, 0, [0.14, 0.14, 0.15], null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
