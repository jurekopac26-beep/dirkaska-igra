/* Vehicle 'modras' — MODRAS V10: a modern mid-engined V10 supercar. Signature features: 1) sharp hexagonal intakes in the nose and the
   flanks, 2) Y-shaped headlamps, 3) a glass engine cover showing the V10, 4) a rear spoiler over hexagonal tail lamps, 5) a wedge profile
   with a low cabin. L 4.52 W 1.93 H 1.17, wheelbase 2.62, overhangs F 0.90 R 1.00 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'modras', name: 'MODRAS V10', cat: 'super', ord: 3, drive: 'AWD',
    desc: 'Sodoben superšportnik z V10 na sredini in ostrimi šesterokotnimi linijami.',
    phys: { mass: 1450, a: 1.36, b: 1.26, kI: 1.25, kw: 470, redline: 8700, idle: 1000, gears: [3.3, 2.5, 2, 1.66, 1.42, 1.24, 1.1], final: 3.37, rw: 0.33, cDrag: 0.35, len: 4.52, wid: 1.93, steerMax: 0.6,
      tracK: 1.2, brakeK: 1.1, spinK: 0.25, aiGap: 7.5, aiPass: 4 },   // (aiGap / aiPass: its AI follows further back and passes wider: fewer pile-ups on the Nordschleife, tests/fleet.test.js 8b)
    arc: { amax: 1.84, kv: 2.1, rmin: 4.7 },
    csp: { bx: 0.12, coast: -0.08, thr: -0.015, liftP: 0, pwr: 0.03, out: 0.95, turn: 1.08, w: 0.98 },   // (the AWD layer: steady, straightens quickly; its own turn)
    stats: { power: 10, grip: 9, weight: 5, drift: 4 },
    price: 110000, pk: 'open', field: ['modras'],
    snd: { kind: 'v10', hz: 1.1, loud: 1.1 },
    expect: { t100: [2.19, 2.57], vmax: [268, 284], latG: [2.35, 2.45], d100: [21, 23.2] },
    parts: { set: 'race', ht: 1.17, y0: 0.15,
      over: {
        wing: { f: 0.75, m: 4 },
        trunk: { lx: -0.64, y: 1 },   // (the glass engine cover: over the engine, behind the cabin, where the look has it)
      },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, a wedge from the nose to the roof (the bonnet and the windscreen at
    // nearly one slope), the low cabin, the deck falling to the tail. The standard regions split it, but the nose's whole front segment (the
    // head lamps' slope, its sides, the face with the intakes) is the front bumper's and the bonnet ends behind it; the deck (the glass engine
    // cover: glass slopes either side of the clear middle, the V10's top seen through it, the black vent behind) is the boot lid ('trunk')
    look: {
      body: { len: 4.52, wid: 1.93, roofY: 1.175, wz: 0.16,
        //       x      w      yb    ybelt  wt     yt     cr      kind  tuck
        secs: [[-2.26, 0.87, 0.24, 0.82, 0.77, 0.955, -0.015, 'b', 0.08],     // the tail: the deck's lip over the tail lamps, the diffuser's kick under it
          [-2.06, 0.94, 0.16, 0.845, 0.79, 0.99, -0.03, 'b', 0.1],        // the rear bumper's front edge; the black vent behind the glass cover
          [-1.75, 0.96, 0.13, 0.86, 0.75, 1.02, -0.045, 'b', 0.12],       // the haunches; the glass cover (its clear middle flat at 0.975) from here
          [-1.26, 0.965, 0.12, 0.865, 0.69, 1.06, -0.085, 'b', 0.12],        // the rear axle
          [-0.8, 0.95, 0.12, 0.835, 0.61, 1.1, -0.125, 'gr', 0.12],       // the cover's front: the rear window rises steeply from here
          [-0.66, 0.94, 0.12, 0.815, 0.56, 1.143, 0.022, 'r', 0.12],       // the roof's rear edge (flat on top: the start number lies there)
          [-0.4, 0.932, 0.12, 0.79, 0.575, 1.148, 0.022, 'r', 0.12],       // the roof (the door's rear edge)
          [-0.12, 0.932, 0.12, 0.78, 0.585, 1.143, 0.022, 'gf', 0.12],     // the windscreen's top
          [0.9, 0.945, 0.12, 0.75, 0.75, 0.85, 0, 'b', 0.12],              // the windscreen's base over the front wheel's back (the cowl; the door's front edge)
          [1.36, 0.958, 0.12, 0.74, 0.82, 0.79, -0.032, 'b', 0.12],        // the front axle: the fenders' crests over the lower bonnet
          [1.85, 0.935, 0.12, 0.63, 0.8, 0.675, -0.026, 'b', 0.12],
          [2.08, 0.9, 0.11, 0.48, 0.79, 0.54, -0.012, 'b', 0.11],          // the bonnet's front edge: the head lamps' slope from here
          [2.26, 0.83, 0.1, 0.29, 0.75, 0.35, 0, 'b', 0.08]],              // the nose: the bumper's face with the intakes
        eye: { x: -0.38, y: 0.98, near: 0.2, tilt: 0.05, style: 'closed' },   // (low, under the roof's peak)
        door: [0.9, -0.4], bumpF: 0.18, bumpR: 0.2, bumpY: [0.4, 0.6],
        engine: [-1.25, 1.0], engRear: true,                                 // (the V10 under the glass cover)
        crush: { x0: -0.8, x1: 0.1, z: 0.62 } },                             // (the roof between the rear window and the windscreen's top)
      wheels: { style: 'std', spokes: 5, w: 0.25, wR: 0.3, rimK: 0.74, rim: [0.56, 0.57, 0.6], cap: [0.16, 0.16, 0.17], gap: 0.045 },
      regions: (std) => std.map(r => r.part === 'hood' ? Object.assign({}, r, { x: [r.x[0], 2.08] })
        : r.part === 'bumperF' ? Object.assign({}, r, { bands: ['tuck', 'side', 'window', 'edge', 'crown'], y: [-1, 2] }) : r),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, TRIM = [0.12, 0.12, 0.12], BAY = [0.1, 0.1, 0.11], MESH = [0.2, 0.2, 0.21];
        const RED = [0.76, 0.09, 0.06], ALU = [0.66, 0.67, 0.7], METAL = [0.36, 0.37, 0.39], DRL = [0.94, 0.96, 1], SEAT = [0.44, 0.1, 0.07];
        const AF = K.arches[0], AR = K.arches[1], XS0 = AR.x + AR.half, XS1 = AF.x - AF.half;   // (the sills: from the rear arch to the front one)
        const COV = [-1.75, -0.8], VENT = [-2.06, -1.75];                                    // (the glass cover, the vent behind it)
        // a flat polygon wound to face nrm (its first three points decide, as K.face's do)
        const face = (pts, col, nrm, o) => { const a = pts[0], b = pts[1], c = pts[2], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
          const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
          K.face(n[0] * nrm[0] + n[1] * nrm[1] + n[2] * nrm[2] < 0 ? pts.slice().reverse() : pts, col, o); };
        // ---- the shell: the paint; the tucks black (the sills, the bumpers' lips, the arches' ledges); the windscreen, the side windows and the
        //      rear window glass; the deck: the glass cover's slopes, its clear middle (the bay's dark under the glass), the black vent ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return B;
          if (kind === 'gf') return e === 1 || e === 7 ? P : G;
          if (kind === 'r') return e === 2 || e === 6 ? G : P;
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : P;
          if (e >= 3 && e <= 5 && at.x > COV[0] && at.x < COV[1]) return e === 4 ? BAY : G;
          if (e >= 3 && e <= 5 && at.x > VENT[0] && at.x < VENT[1]) return MESH;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P, colLow: B } } });
        const D2 = L.decal, top = (x, z) => L.topY(x, z);
        // ---- the glasshouse: the A-pillars and the roof rails black (a visor), the windows' seals, the black post behind the door glass; the
        //      buttress's intake behind the quarter window, tapering back to a point (one long dark shape with the glass) ----
        D2.band([[-0.659, 0.86], [0.899, 0.86], [0.899, 1], [-0.659, 1]], B, null, 0.008);
        D2.band([[-0.659, 0], [0.899, 0], [0.899, 0.06], [-0.659, 0.06]], B, null, 0.008);
        D2.band([[-0.45, 0], [-0.401, 0], [-0.401, 1], [-0.45, 1]], B, null, 0.009);
        D2.band([[-0.655, 0.06], [-1.06, 0.3], [-0.655, 1]], B, null, 0.008);
        // ---- the flanks: the lower door scooped (a darker shade) back into the hexagonal intake ahead of the rear wheel (its surround, the
        //      dark hole), the black sills, a line over them ----
        D2.side([[0.97, 0.3], [0.97, 0.41], [-0.42, 0.575], [-0.6, 0.36], [-0.6, 0.3]], K.shade(P, 0.72), null, 0.004);
        const hexI = [[-0.42, 0.55], [-0.52, 0.75], [-0.805, 0.77], [-0.868, 0.6], [-0.805, 0.38], [-0.52, 0.36]];
        D2.side(hexI, TRIM, null, 0.006);
        D2.side(hexI.map(([x, y]) => [-0.66 + (x + 0.66) * 0.76 - 0.012, 0.55 + (y - 0.55) * 0.72 - 0.02]), B, null, 0.01);
        D2.side([[XS0 + 0.01, 0.2], [XS1 - 0.01, 0.2], [XS1 - 0.01, 0.31], [XS0 + 0.01, 0.31]], B, null, 0.006);
        D2.side([[XS0 + 0.03, 0.316], [XS1 - 0.03, 0.316], [XS1 - 0.06, 0.328], [XS0 + 0.03, 0.328]], S, null, 0.006);
        // ---- the glass cover's frame (black, along its outer edges) ----
        for (const sd of [-1, 1]) for (const [x0, x1, z0, z1] of [[-0.801, -1.259, 0.575, 0.655], [-1.261, -1.749, 0.655, 0.715]])
          D2.top([[x0, sd * z0], [x1, sd * z1], [x1, sd * (z1 + 0.035)], [x0, sd * (z0 + 0.035)]], B, 0.006);
        // ---- the V10 under the glass: its two banks' red cam covers with five coil packs each, the intake plenum between them ----
        const yB = top(-1.24, 0);
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            K.box(-1.24, yB - 0.004, sd * 0.15, 0.82, 0.042, 0.1, 0, RED, null, true);
            for (let i = 0; i < 5; i++) K.rect(-1.56 + i * 0.16, yB + 0.04, sd * 0.15, 0.05, 0.05, B, { dir: 'y' });
          }
          K.box(-1.26, yB - 0.004, 0, 0.66, 0.056, 0.11, 0, ALU, null, true);
        });
        // ---- the nose: the head lamps on the slope at its corners (a black housing; a Y in it: the lens its stem, two day-light arms to the
        //      outer corners), the hexagonal intakes in its face (a Y blade in each), the slim middle intake, the splitter: the front bumper's ----
        for (const sd of [-1, 1]) {
          const on = (x, z, l) => [x, top(x, z) + (l || 0.006), sd * z], up = [0.6, 0.8, 0];
          face([[2.225, 0.38], [2.165, 0.775], [2.102, 0.778], [2.096, 0.72], [2.175, 0.35]].map(([x, z]) => on(x, z)), B, up, { host: 'bumperF' });
          K.headLamp(2.196, top(2.196, 0.47) + 0.004, sd * 0.47, 0.03, { shape: 'rect', w: 0.14, h: 0.028, ring: null, host: 'bumperF' });
          face([[2.202, 0.535], [2.19, 0.535], [2.108, 0.722], [2.118, 0.73]].map(([x, z]) => on(x, z, 0.009)), DRL, up, { host: 'bumperF' });
          face([[2.202, 0.535], [2.19, 0.535], [2.16, 0.762], [2.172, 0.76]].map(([x, z]) => on(x, z, 0.009)), DRL, up, { host: 'bumperF' });
          const hx = (pts, col) => face(pts.map(([z, y]) => [2.263, y, sd * z]), col, [1, 0, 0], { host: 'bumperF' });
          hx([[0.3, 0.25], [0.36, 0.33], [0.72, 0.325], [0.81, 0.25], [0.75, 0.14], [0.37, 0.135]], B);
          hx([[0.31, 0.243], [0.53, 0.236], [0.53, 0.252], [0.31, 0.257]], P);
          hx([[0.53, 0.236], [0.77, 0.29], [0.76, 0.305], [0.53, 0.252]], P);
          hx([[0.53, 0.236], [0.74, 0.17], [0.75, 0.186], [0.53, 0.252]], P);
        }
        face([[-0.25, 0.13], [-0.23, 0.19], [0.23, 0.19], [0.25, 0.13], [0.23, 0.115], [-0.23, 0.115]].map(([z, y]) => [2.263, y, z]), B, [1, 0, 0], { host: 'bumperF' });
        K.part('bumperF', () => K.box(2.16, 0.07, 0, 0.24, 0.03, 1.66, 0, B), { hinge: [[2.2, 0.12, -0.7], [2.2, 0.12, 0.7]] });
        // ---- the tail: the hexagonal tail lamps in black clusters under the spoiler, a vent between them; the lower bumper black: its mesh, two
        //      pairs of hexagonal tail pipes in bright bezels, the diffuser's fins ----
        for (const sd of [-1, 1]) {
          face([[0.36, 0.848], [0.4, 0.922], [0.77, 0.925], [0.832, 0.85], [0.79, 0.772], [0.4, 0.768]].map(([z, y]) => [-2.263, y, sd * z]), B, [-1, 0, 0], { part: 'body' });
          K.tailLamp(-2.26, 0.849, sd * 0.69, 0.15, 0.15, { round: true, n: 6 });
          K.tailLamp(-2.26, 0.849, sd * 0.52, 0.12, 0.12, { round: true, n: 6 });
        }
        K.grille(-2.262, 0.695, 0, 1.2, 0.1, { dir: -1, slats: 2, col: B, slatCol: MESH, part: 'body' });
        K.part('bumperR', () => {
          K.grille(-2.262, 0.52, 0, 1.5, 0.1, { dir: -1, slats: 2, col: B, slatCol: [0.24, 0.24, 0.25] });
          for (const z of [-0.31, -0.17, 0.17, 0.31]) { K.exhaust(-2.31, 0.4, z, 0.046, 0.14, { n: 6, col: [0.55, 0.55, 0.57] }); K.discX(-2.302, 0.4, z, 0.064, 6, [0.72, 0.73, 0.76], -1); }
          for (const z of [-0.5, -0.2, 0.2, 0.5]) K.box(-2.14, 0.17, z, 0.28, 0.08, 0.022, 0, TRIM);
        }, { hinge: [[-2.2, 0.26, -0.7], [-2.2, 0.26, 0.7]] });
        // ---- the rear spoiler: a blade over the tail lamps on two struts, black end plates (never crushed with the roof) ----
        K.part('wing', () => {
          K.wingPlank(-2.04, 1.012, -2.31, 1.058, 0.036, -0.85, 0.85, P);
          for (const sd of [-1, 1]) { K.box(-2.16, 0.95, sd * 0.6, 0.12, 0.09, 0.03, 0, B); K.endplate([[-2.03, 1.0], [-2.32, 1.045], [-2.32, 1.105], [-2.05, 1.06]], sd * 0.862, 0.016, B); }
        }, { noCrush: true, hinge: [[-2.06, 1.02, -0.6], [-2.06, 1.02, 0.6]] });
        // ---- the door mirrors on black stalks, the wiper ----
        for (const sd of [-1, 1]) K.mirror(0.7, 0.85, sd * 0.99, { w: 0.13, h: 0.075, d: 0.17, arm: B, z0: sd * 0.86 });
        K.bar([0.87, top(0.87, -0.5) + 0.012, -0.5], [0.76, top(0.76, 0.32) + 0.012, 0.32], 0.009, B, { n: 4, part: 'body' });
        K.hinge('hood', [0.91, 0.85, -0.6], [0.91, 0.85, 0.6]);
        K.hinge('trunk', [-0.8, 1.0, -0.5], [-0.8, 1.0, 0.5]);
        for (const sd of [-1, 1]) K.hinge(sd < 0 ? 'doorL' : 'doorR', [0.89, 0.3, sd * 0.93], [0.89, 0.8, sd * 0.93]);
        // ---- inside (seen once a part is off): the seats, the dashboard, the tunnel, the wheel, the bulkhead behind the seats; the V10's block
        //      and banks under the glass; the luggage tub under the bonnet ----
        const IN = { inner: true, part: 'body' };
        for (const sd of [-1, 1]) K.seat(-0.22, 0.33, sd * 0.35, { w: 0.46, l: 0.46, back: 0.6, tilt: 0.4, col: SEAT });
        K.box(0.52, 0.48, 0, 0.36, 0.24, 1.44, 0, TRIM, null, false, IN);
        K.box(0.1, 0.13, 0, 0.9, 0.24, 0.24, 0, TRIM, null, false, IN);
        K.cyl([0.2, 0.62, -0.35], [0.22, 0.655, -0.35], 0.16, B, Object.assign({ n: 8 }, IN));
        { const x = -0.74, w = L.prop(x, 'w') - 0.05, wt = L.prop(x, 'wt') - 0.05, yb = L.prop(x, 'yb') + 0.03, ybl = L.prop(x, 'ybelt'), yt = L.prop(x, 'yt') - 0.04, yc = top(x, 0) - 0.04;
          K.plate([[x, yb, -w], [x, yb, w], [x, ybl, w], [x, yt, wt], [x, yc, 0.3], [x, yc, -0.3], [x, yt, -wt], [x, ybl, -w]], 0.03, TRIM, IN); }
        K.box(-1.24, 0.2, 0, 0.9, 0.34, 0.42, 0, METAL, null, false, IN);
        for (const sd of [-1, 1]) K.plate([[-1.66, 0.52, sd * 0.07], [-0.82, 0.52, sd * 0.07], [-0.82, yB - 0.03, sd * 0.15], [-1.66, yB - 0.03, sd * 0.15]], 0.12, METAL, IN);
        K.box(-1.26, 0.56, 0, 0.62, yB - 0.56, 0.1, 0, ALU, null, false, IN);
        K.box(1.66, 0.2, 0, 0.62, 0.3, 0.9, 0, BAY, null, false, IN);
        for (const A of K.arches) for (const sd of [-1, 1]) {   // (the wheel housings: no tyre seen from the bay or the luggage tub)
          const x0 = A.x - A.half - 0.01, x1 = A.x + A.half + 0.01, y0 = A.x > 0 ? 0.75 : 0.73, y1 = A.x > 0 ? 0.64 : 0.73, z0 = 0.6, z1 = 0.86;
          face([[x0, y0, sd * z0], [x1, y1, sd * z0], [x1, y1, sd * z1], [x0, y0, sd * z1]], TRIM, [0, 1, 0], IN);
          face([[x0, 0.16, sd * z0], [x1, 0.16, sd * z0], [x1, y1, sd * z0], [x0, y0, sd * z0]], TRIM, [0, 0, -sd], IN);
        }
      },
    },
  });
})();
