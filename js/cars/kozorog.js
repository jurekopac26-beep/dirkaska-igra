/* Vehicle 'kozorog' — KOZOROG TC: a touring car (TCR-style front-drive saloon racer). Signature features: 1) very wide bolted-on arches
   over a road saloon body, 2) a deep front splitter, 3) a rear wing on the boot, 4) a roof-mounted fin and a rain light, 5) centre-lock
   race wheels. L 4.40 W 1.95 H 1.38, wheelbase 2.65, overhangs F 0.90 R 0.85 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'kozorog', name: 'KOZOROG TC', cat: 'dirkalni', ord: 1, drive: 'FF',
    desc: 'Turistični dirkalnik: široki blatniki, spojler spredaj in krilo zadaj.',
    phys: { mass: 1180, a: 1.3, b: 1.35, kI: 1.2, kw: 260, redline: 8500, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 5.39, rw: 0.33, cDrag: 0.4, len: 4.4, wid: 1.95, steerMax: 0.6,
      tracK: 1.15, brakeK: 1.1, spinK: 0.3, aero: 0.00004, loose: 0.8 },
    arc: { amax: 1.86, kv: 2.4, rmin: 4.6 },
    csp: { bx: 0.15, coast: -0.095, thr: -0.03, liftP: 0, pwr: 0, out: 1, turn: 1.1, w: 1, tv: 0.85 },   // (the FF layer: pivots on the brakes, the throttle pulls it straight; its own turn, w, tv)
    stats: { power: 7, grip: 10, weight: 7, drift: 3 },
    price: 55000, pk: 'ppo', field: ['kozorog'],
    snd: { kind: 'i4', hz: 1.2, turbo: 0.8, loud: 1.1 },
    expect: { t100: [2.61, 3.06], vmax: [225, 239], latG: [2.45, 2.55], d100: [20.9, 23.1] },
    partNames: { splitter: 'front splitter' },
    parts: { set: 'race', ht: 1.38, y0: 0.12,
      over: {
        bumperF: { df: 0 },
        trunk: { lx: -0.82, y: 1.0 },   // (the boot lid behind the rear glass, where the look has it)
      },
      extra: {
        splitter: { z: 0, th: 0.45, m: 3, rW: 0.4, h: 0.04, lx: 1, lz: 0, f: 0.02, df: 0.3 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): a compact four-door saloon on one loft, its front wings and rear quarters
    // pushed out over the wheels (the doors keep the road car's width: steps in the loft, a black vent behind each front wheel, black
    // lips round the arches), black skirts between them; the deep splitter under the bumper's mouth, the wing on two stands on the boot
    // lid, the fin on the roof's back with the rain light at its foot; slick wheels with centre-lock nuts. The standard regions cut the
    // loft: the bonnet and the boot lid (their tops), the front wings (with the vents), the quarters (the rear door, its glass and the
    // flare), the front doors with their glass, the bumpers, the mirrors
    look: {
      body: { len: 4.4, wid: 1.95,
        //       x      w      yb    ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.17, 0.9, 0.24, 0.84, 0.8, 0.975, 0.01, 'b', 0.1],      // the tail's face: the lamps along its top, the bumper under them
          [-1.97, 0.975, 0.17, 0.92, 0.84, 1.01, 0.02, 'b', 0.1],         // the boot lid's lip, the rear bumper's front edge (the flares' full
          [-1.5, 0.975, 0.15, 0.93, 0.82, 0.995, 0.03, 'gr', 0.1],        //   width from here to the rear door); the rear glass's base
          [-0.98, 0.975, 0.12, 0.93, 0.665, 1.298, 0.045, 'r', 0.1],      // the roof's back edge, the rear flare's front (the arch cuts it)
          [-0.88, 0.905, 0.12, 0.925, 0.668, 1.302, 0.045, 'r', 0.1],     // the rear door's rear edge: the saloon's own width
          [0.0, 0.905, 0.12, 0.9, 0.672, 1.315, 0.045, 'gf', 0.1],        // the windscreen's top
          [0.78, 0.905, 0.12, 0.87, 0.79, 0.905, 0.01, 'b', 0.1],         // the cowl: the windscreen's base, the front door's front edge
          [0.9, 0.975, 0.12, 0.865, 0.79, 0.9, 0, 'b', 0.1],              // the front wing's back (pushed out over the wheel; the vent before it)
          [1.85, 0.975, 0.15, 0.82, 0.78, 0.845, -0.01, 'b', 0.1],        // the front bumper's back edge
          [2.05, 0.955, 0.16, 0.73, 0.76, 0.78, 0.005, 'b', 0.11],        // the bonnet's leading edge
          [2.17, 0.88, 0.17, 0.62, 0.7, 0.7, 0.005, 'b', 0.11]],          // the nose: the lamps, the grilles
        eye: { x: -0.45, y: 1.1, style: 'closed' }, cage: true,          // (low in the bucket, the roll cage round the driver)
        door: [0.78, -0.25], bumpF: 0.32, bumpR: 0.2, bumpY: [0.5, 0.58],
        decalX: -0.3, decalY: 1.36, decalRz: 0.0145, decalS: 0.6 },      // (the start number on the roof's front half: the fin is behind it)
      wheels: { style: 'slick', w: 0.25, gap: 0.04 },
      // the lids take their tops only (the nose's and the tail's sloping corners stay with the body); the sill under the rear door stays too
      regions: (std) => [{ part: 'body', x: [-0.98, -0.25], bands: ['tuck'], y: [-1, 0.2] }]
        .concat(std.map(r => r.part === 'hood' || r.part === 'trunk' ? Object.assign({}, r, { bands: ['edge', 'crown'] }) : r)),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.06, 0.06, 0.065], CF = [0.045, 0.045, 0.05], RD = [0.86, 0.12, 0.08], SH = K.shade(P, 0.45);
        const dirZ = (sd) => sd < 0 ? '-z' : 'z', LR = (n, sd) => n + (sd < 0 ? 'L' : 'R'), XC = -0.88, XB = -0.25, XA = 0.78;
        const face = (pts, col, nr, o) => {   // a flat polygon turned to face nr (its points in either order)
          const a = pts[0], u = [0, 1, 2].map(i => pts[1][i] - a[i]), v = [0, 1, 2].map(i => pts[2][i] - a[i]);
          const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
          K.face(n[0] * nr[0] + n[1] * nr[1] + n[2] * nr[2] < 0 ? pts.slice().reverse() : pts, col, o); };
        // ---- the shell: the paint, the glass (the windscreen, the side windows to the C-pillar, the rear glass); the sills black between the
        //      arches (the skirts), the arches' ledges black, the vent behind each front wheel black ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : at.x > -0.98 && at.x < 0.92 ? CF : D;
          if (at.x > XA && at.x < 0.9 && (e === 1 || e === 7)) return B;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          if (kind === 'r') return (e === 2 || e === 6) && at.x > XC ? G : P;
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : P;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const DL = L.decal;
        // the glass's black frames (along the belt, under the roof's edge, the B-pillar); the A-pillars in the paint (four pieces: the
        // pillar keeps its width down to the cowl)
        DL.band([[XC, 0], [XA, 0], [XA, 0.07], [XC, 0.07]], B, null, 0.006);
        DL.band([[XC, 0.9], [0, 0.9], [0, 1], [XC, 1]], B, null, 0.006);
        DL.band([[-0.31, 0], [-0.2, 0], [-0.2, 1], [-0.31, 1]], B, null, 0.008);
        for (const q of [[0, 0.831, 0.3, 0.74], [0.3, 0.74, 0.5, 0.59], [0.5, 0.59, 0.64, 0.32], [0.64, 0.32, XA, 0]]) DL.band([[q[0], q[1]], [q[2], q[3]], [q[2], 1], [q[0], 1]], P, null, 0.008);
        // the shut lines: the doors' (the B-pillar's foot, the rear door's back)
        for (const x of [XB, XC + 0.012]) DL.side([[x - 0.006, 0.2], [x + 0.006, 0.2], [x + 0.006, 0.95], [x - 0.006, 0.95]], SH, null, 0.008);
        // the sun strip over the windscreen (the stripe colour; split at the crown's edges: a flat piece would sink under the crest)
        for (const [z0, z1] of [[-0.66, -0.255], [-0.255, 0.255], [0.255, 0.66]]) DL.top([[0, z0], [0.11, z0], [0.11, z1], [0, z1]], S, 0.006);
        // the bonnet's vent (the radiator's outlet)
        DL.top([[1.42, -0.28], [1.72, -0.28], [1.72, 0.28], [1.42, 0.28]], D, 0.006);
        // ---- the livery: a band of the stripe colour along the shoulders, nose to tail, widening to the back (flat pieces on the flat
        //      sides, each in its panel's part); the numbers on the front doors; the door handles ----
        for (const sd of [-1, 1]) {
          const band = (x0, x1, z0, z1, a0, a1, b0, b1, part) => face([[x0, a0, sd * z0], [x1, a1, sd * z1], [x1, b1, sd * z1], [x0, b0, sd * z0]], S, [0, 0, sd], { part });
          band(1.85, 0.9, 0.981, 0.981, 0.765, 0.775, 0.79, 0.805, LR('fender', sd));
          band(XA, XB, 0.911, 0.911, 0.775, 0.782, 0.805, 0.822, LR('door', sd));
          band(XB, XC, 0.911, 0.911, 0.782, 0.786, 0.822, 0.845, LR('quarter', sd));
          band(-0.98, -1.97, 0.981, 0.981, 0.787, 0.795, 0.85, 0.91, LR('quarter', sd));
          band(-1.97, -2.165, 0.981, 0.906, 0.795, 0.797, 0.91, 0.835, 'body');
          K.number(0.27, 0.52, sd * 0.912, 0.3, { dir: dirZ(sd), host: LR('door', sd) });
          for (const x of [-0.12, -0.74]) K.rect(x, 0.83, sd * 0.915, 0.14, 0.025, B, { dir: dirZ(sd) });
        }
        // ---- the skirts between the arches (black, out to the flares' width), the black lips round the arches ----
        for (const sd of [-1, 1]) K.box(-0.02, 0.08, sd * 0.94, 1.86, 0.14, 0.07, 0, CF);
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.37, 0.42, sd * 0.955, sd * 0.99, B, { n: 6 });
        // the louvres on the front wings' tops behind the wheels (black slots on the shelf between the side and the bonnet's edge)
        const shelf = (x, u, sd) => { const yb = L.prop(x, 'ybelt'), yt = L.prop(x, 'yt'), w = L.prop(x, 'w'), wt = L.prop(x, 'wt'), dy = yt - yb, dz = wt - w, l = Math.hypot(dy, dz);
          return [x, yb + dy * u - dz / l * 0.006, sd * (w + dz * u + dy / l * 0.006)]; };   // (u 0 at the belt, 1 at the bonnet's edge; 6 mm off it)
        for (const sd of [-1, 1]) for (const x of [0.97, 1.07, 1.17]) face([shelf(x, 0.2, sd), shelf(x + 0.05, 0.2, sd), shelf(x + 0.05, 0.85, sd), shelf(x, 0.85, sd)], B, [0, 1, 0], { part: LR('fender', sd) });
        // ---- the nose: a black band across it at the lamps' height (the slim lamps in it, the upper grille between them); the bumper's
        //      three mouths (the radiator's in the middle, the brake ducts at the corners), the canards on its corners, the tow strap ----
        for (const sd of [-1, 1]) {
          face([[2.173, 0.572, sd * 0.36], [2.173, 0.562, sd * 0.8], [2.173, 0.64, sd * 0.78], [2.173, 0.66, sd * 0.38]], B, [1, 0, 0], { part: 'body' });
          K.headLamp(2.176, 0.611, sd * 0.6, 0.03, { shape: 'rect', w: 0.3, h: 0.042, ring: null, host: 'body' });
        }
        K.rect(2.173, 0.615, 0, 0.74, 0.05, B, { part: 'body' });
        K.part('bumperF', () => {
          K.grille(2.173, 0.32, 0, 0.76, 0.22, { slats: 2 });
          for (const sd of [-1, 1]) {
            face([[2.173, 0.2, sd * 0.46], [2.173, 0.2, sd * 0.8], [2.173, 0.4, sd * 0.74], [2.173, 0.43, sd * 0.5]], B, [1, 0, 0]);
            for (const [y, dy] of [[0.44, 0.03], [0.33, 0.02]]) face([[2.15, y, sd * 0.875], [1.97, y + dy, sd * 0.97], [1.99, y + dy, sd * 1.0], [2.16, y, sd * 0.905]], B, [0, 1, 0]);
          }
          K.box(2.02, 0.097, 0, 0.28, 0.075, 1.7, 0, CF);                       // the air dam down to the splitter
          K.rect(2.174, 0.47, 0.3, 0.05, 0.08, RD);                            // the tow strap
        });
        // ---- the splitter: a deep black plate under the mouth, out past the nose, its fences ----
        K.part('splitter', () => {
          K.box(2.06, 0.075, 0, 0.36, 0.022, 1.86, 0, CF);
          for (const sd of [-1, 1]) K.box(2.08, 0.097, sd * 0.92, 0.3, 0.06, 0.02, 0, CF);
        });
        // ---- the tail: the slim lamps in black surrounds; the bumper's black lower half, the diffuser and its fins, the exhaust ----
        for (const sd of [-1, 1]) { K.rect(-2.172, 0.86, sd * 0.6, 0.44, 0.11, B, { dir: '-x', part: 'body' }); K.tailLamp(-2.174, 0.86, sd * 0.6, 0.4, 0.08); }
        K.rect(-2.172, 0.86, 0, 0.78, 0.06, B, { dir: '-x', part: 'body' });   // (a black band between them)
        K.rect(-2.172, 0.58, 0, 1.6, 0.012, SH, { dir: '-x', part: 'body' });   // (the bumper's shut line)
        K.part('bumperR', () => {
          K.rect(-2.173, 0.38, 0, 1.64, 0.22, CF, { dir: '-x' });
          K.box(-2.1, 0.1, 0, 0.2, 0.16, 1.5, 0, CF);                          // the diffuser
          for (const z of [-0.45, -0.15, 0.15, 0.45]) K.rect(-2.202, 0.18, z, 0.025, 0.16, D, { dir: '-x' });   // (its fins)
          K.rect(-2.175, 0.47, -0.38, 0.05, 0.1, RD, { dir: '-x' });          // the tow strap
          for (const sd of [-1, 1]) K.rect(-2.174, 0.42, sd * 0.76, 0.1, 0.035, [0.6, 0.05, 0.04], { dir: '-x' });   // (the reflectors)
        });
        K.exhaust(-2.2, 0.2, 0.62, 0.05, 0.2, { part: 'body', n: 6 });
        // ---- the wing on the boot lid: one black plane on two stands, its endplates and the gurney along its trailing edge in the stripe colour ----
        K.part('wing', () => {
          K.wingPlank(-1.86, 1.2, -2.17, 1.24, 0.03, -0.84, 0.84, CF);
          K.box(-2.16, 1.255, 0, 0.018, 0.03, 1.68, 0, S);
          for (const sd of [-1, 1]) {
            K.endplate([[-1.82, 1.12], [-2.19, 1.1], [-2.2, 1.31], [-1.9, 1.28]], sd * 0.855, 0.012, S);
            K.box(-1.98, 0.99, sd * 0.42, 0.18, 0.22, 0.025, 0, B);
          }
        }, { noCrush: true, noDent: true });
        // ---- the fin on the roof's back (never crushed out of shape: it goes down with the roof), the rain light at its foot ----
        K.part('body', () => K.endplate([[-0.56, 1.347], [-0.985, 1.333], [-0.975, 1.44]], 0, 0.03, CF), { noCrush: true, noDent: true });
        K.rect(-0.99, 1.36, 0, 0.1, 0.06, B, { dir: '-x', part: 'body' }); K.tailLamp(-0.992, 1.36, 0, 0.08, 0.04);
        // ---- the mirrors, the wiper ----
        for (const sd of [-1, 1]) K.mirror(0.6, 1.0, sd * 0.965, { w: 0.1, h: 0.07, d: 0.11, col: S });
        K.bar([0.8, 0.915, -0.5], [0.74, 0.94, 0.3], 0.01, B, { n: 4, part: 'body' });
        // the dashboard's top up to the windscreen's base as the driver sees it (the outer shell: the cockpit draws no cabin): no seeing
        // under the bonnet through the car
        face([[0.42, 0.79, -0.84], [0.42, 0.79, 0.84], [0.79, 0.902, 0.84], [0.79, 0.902, -0.84]], D, [-0.3, 1, 0], { part: 'body' });
        // ---- hinges: the bonnet at the cowl, the boot lid at the rear glass, the doors at their front edges ----
        K.hinge('hood', [0.8, 0.905, -0.6], [0.8, 0.905, 0.6]);
        K.hinge('trunk', [-1.52, 1.0, -0.6], [-1.52, 1.0, 0.6]);
        for (const sd of [-1, 1]) K.hinge(LR('door', sd), [0.77, 0.3, sd * 0.9], [0.77, 0.86, sd * 0.9]);
        // ---- inside (seen once a part is off): the bucket seat, the dashboard and the wheel, the roll cage, the extinguisher; the
        //      transverse four in the bay ----
        K.seat(-0.42, 0.36, -0.3, { w: 0.5, l: 0.48, back: 0.78, tilt: 0.24 });
        K.box(0.5, 0.6, 0, 0.3, 0.24, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([0.24, 0.84, -0.3], [0.2, 0.86, -0.3], 0.17, B, { n: 8, inner: true, part: 'body' });
        K.cyl([-0.2, 0.2, 0.42], [0.25, 0.2, 0.42], 0.07, RD, { n: 6, inner: true, part: 'body' });
        const cg = [0.75, 0.76, 0.78];
        K.cage([
          [[-0.66, 0.16, -0.8], [-0.66, 1.22, -0.6]], [[-0.66, 0.16, 0.8], [-0.66, 1.22, 0.6]], [[-0.66, 1.22, -0.6], [-0.66, 1.22, 0.6]],
          [[0.62, 0.3, -0.8], [-0.05, 1.24, -0.6]], [[0.62, 0.3, 0.8], [-0.05, 1.24, 0.6]], [[-0.05, 1.24, -0.6], [-0.66, 1.22, -0.6]], [[-0.05, 1.24, 0.6], [-0.66, 1.22, 0.6]],
          [[0.5, 0.32, -0.82], [-0.64, 0.75, -0.82]], [[0.5, 0.75, -0.82], [-0.64, 0.32, -0.82]], [[0.5, 0.5, 0.82], [-0.64, 0.5, 0.82]],
          [[-0.66, 1.2, -0.55], [-1.6, 0.6, -0.6]], [[-0.66, 1.2, 0.55], [-1.6, 0.6, 0.6]], [[-0.66, 1.2, -0.55], [-0.66, 0.2, 0.75]],
        ], 0.022, cg, { n: 4 });
        K.engine(1.45, 0.28, 0, { l: 0.5, w: 0.66, h: 0.42 });
        K.box(1.98, 0.2, 0, 0.06, 0.36, 1.2, 0, D, null, false, { inner: true, part: 'body' });                    // the radiator behind the mouth
        K.bar([1.3, 0.8, -0.62], [1.3, 0.8, 0.62], 0.02, [0.62, 0.12, 0.1], { n: 4, inner: true, part: 'body' });   // the strut brace
      },
    },
  });
})();
