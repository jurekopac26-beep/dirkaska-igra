/* Vehicle 'superkombi' — SUPERKOMBI: a 1980s / 90s racing van, a race engine in the middle. Signature features: 1) a one-box van body
   lowered over wide race wheels, 2) big side intakes for the mid-mounted engine, 3) a rear wing across the roof edge, 4) a deep front
   spoiler, 5) flared arches and a race livery. L 4.70 W 1.95 H 1.75, wheelbase 2.80, overhangs F 0.85 R 1.05 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'superkombi', name: 'SUPERKOMBI', cat: 'posebni', ord: 1, drive: 'MR',
    desc: 'Dirkalni kombi iz 80-ih in 90-ih z dirkalnim motorjem na sredini.',
    phys: { mass: 1250, a: 1.5, b: 1.3, kI: 1.28, kw: 520, redline: 8500, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.84, rw: 0.34, cDrag: 0.5, len: 4.7, wid: 1.95, steerMax: 0.6,
      tracK: 1.1, brakeK: 1.05, spinK: 0.25, aero: 0.00005, loose: 0.8, sway: 1.3, aiGap: 7.5, aiPass: 4 },   // (aiGap / aiPass: its AI follows further back and passes wider: fewer pile-ups on the Nordschleife, tests/fleet.test.js 8b)
    arc: { amax: 1.8, kv: 2.2, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.14, pwr: 0.07, out: 1.2, turn: 1.05, w: 1.02 },   // (the MR layer: quick turn-in, lift rotation; its own liftP, pwr, turn)
    stats: { power: 10, grip: 10, weight: 7, drift: 6 },
    price: 70000, pk: 'unl', field: ['superkombi'],
    snd: { kind: 'v10', hz: 1, loud: 1.2 },
    expect: { t100: [2.97, 3.48], vmax: [259, 275], latG: [2.39, 2.49], d100: [21.6, 23.9] },
    // (where the look has them: the short bonnet ahead of the windscreen, the tailgate at the tail, the wing over the roof's back edge, the
    // mirrors at the windscreen's foot, the doors behind the front wheels; a lost one flies off from there)
    parts: { set: 'race', ht: 1.75, y0: 0.14,
      over: { hood: { lx: 0.77, y: 0.93 }, trunk: { lx: -0.98, y: 1.12 }, wing: { y: 1.71 }, doorL: { lx: 0.18 }, doorR: { lx: 0.18 }, mirrorL: { lx: 0.47, y: 1.12 }, mirrorR: { lx: 0.47, y: 1.12 } } },
    // the look (KIT API v1, render.js; look units = metres): one loft, the one-box van (a short sloping bonnet running into a long raked
    // windscreen, a flat roof, an upright tailgate), lowered over wide slicks in flared arches. The standard regions split it (the bonnet,
    // the tailgate with its glass, the front fenders with the quarter-lights, the front doors with their glass, the rear quarters with the
    // sliding door's window and the side intake, the deep front spoiler and the rear bumper at the loft's ends); the wing on its struts
    // across the roof's back edge in its part. The livery: the paint, a band in the stripe colour sweeping up the side and twin stripes over
    // the bonnet and the roof, black skirts and pillars, the start number on the doors and the roof
    look: {
      body: { len: 4.7, wid: 1.95, roofY: 1.63, wz: 0.17,
        // (the sections sit on the cuts the regions and the arches make anyway: the windscreen's base on the front arch's, the bonnet's
        // front at the spoiler's back edge, the roof's back edge at the rear bumper's, the intake's back edge on the rear arch's last)
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-2.33, 0.86, 0.18, 0.98, 0.7, 1.05, 0.02, 'b', 0.08],    // the tail: the rear bumper and the tailgate's lower panel (the end cap)
          [-2.29, 0.88, 0.17, 1.0, 0.72, 1.1, 0.03, 'gr', 0.08],         // the tailgate's glass, nearly upright, between the D-pillars
          [-2.19, 0.9, 0.17, 1.0, 0.75, 1.55, 0.05, 'r', 0.09],          // the roof's back edge
          [-1.68, 0.9, 0.16, 1.0, 0.8, 1.57, 0.06, 'r', 0.1],            // (the side intake's back edge)
          [0.38, 0.9, 0.14, 1.0, 0.8, 1.57, 0.06, 'gf', 0.1],            // the windscreen's top
          [1.31, 0.9, 0.14, 0.98, 0.84, 1.03, 0.03, 'b', 0.1],           // the windscreen's base (the cowl)
          [2.18, 0.88, 0.08, 0.8, 0.83, 0.85, 0.02, 'b', 0.09],          // the short sloping bonnet; the spoiler from here, deep under it
          [2.33, 0.84, 0.07, 0.72, 0.79, 0.76, 0.01, 'b', 0.07]],        // the nose: the lamps' panel over the spoiler's face
        eye: { x: 0.12, y: 1.22, near: 0.25, tilt: 0.06, style: 'closed' },   // (high and upright, as in a van; the roll cage round it)
        door: [1.12, -0.06], bumpF: 0.15, bumpR: 0.14, bumpY: [0.5, 0.56],
        engine: [-0.85, 0.68], engRear: true, cage: true,                    // (the race engine behind the seats, between the axles: its top)
        crush: { x0: -2.29, x1: -0.55, z: 0.84 } },                          // (the roof over the engine sinks; the cage holds the cabin's)
      wheels: { style: 'slick', w: 0.27, wR: 0.31, rim: [0.17, 0.17, 0.19], gap: 0.04 },
      // (the tailgate is its glass and the panel under it: the D-pillars beside the glass stay on the body with the tail lamps)
      regions: (std) => std.map(r => r.part === 'trunk' ? Object.assign({}, r, { bands: ['edge', 'crown'] }) : r),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.1, 0.1, 0.11], GR = [0.32, 0.33, 0.35];
        const A0 = K.arches[0], A1 = K.arches[1], XA = A1.x + A1.half, XB = A0.x - A0.half;    // (the skirt from the rear arch to the front one)
        const XI0 = A1.x + A1.half * Math.cos(Math.PI / 6), XI1 = A1.x - A1.half;               // (the side intake: between two of the rear arch's cuts)
        // ---- the shell: the paint; the glass (the windscreen and the quarter-lights beside it, the side windows forward of the intake, the
        //      tailgate's window); black under the sills, the spoiler and the bumper ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return B;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : P;
          if (kind === 'r' && (e === 2 || e === 6)) return at.x > XI0 ? G : P;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const LD = L.decal;
        // the glasshouse: black pillars and frames (one dark band of glass round the cabin, as the vans had)
        LD.band([[0.38, 0.86], [1.31, 0.86], [1.31, 1], [0.38, 1]], B, null, 0.008);                     // the A-pillar (the windscreen's edge)
        LD.band([[1.09, 0], [1.15, 0], [1.15, 1], [1.09, 1]], B, null, 0.009);                            // the door's front edge (the quarter-light ahead of it)
        LD.band([[-0.12, 0], [-0.03, 0], [-0.03, 1], [-0.12, 1]], B, null, 0.009);                        // the B-pillar
        LD.band([[XI0, 0], [1.31, 0], [1.31, 0.06], [XI0, 0.06]], B, null, 0.008);                        // along the belt
        LD.band([[XI0, 0.93], [0.38, 0.93], [0.38, 1], [XI0, 1]], B, null, 0.008);                        // under the roof's edge
        // the livery: a band in the stripe colour sweeping up the side from the nose to the tail; the black skirts
        LD.side([[2.34, 0.36], [2.34, 0.54], [-2.34, 0.96], [-2.34, 0.78]], S, null, 0.008);
        for (const sd of [-1, 1]) {                                                                        // twin stripes over the bonnet and the roof
          LD.top([[1.34, sd * 0.14], [2.3, sd * 0.14], [2.3, sd * 0.26], [1.34, sd * 0.26]], S, 0.008);
          LD.top([[-2.14, sd * 0.14], [0.34, sd * 0.14], [0.34, sd * 0.26], [-2.14, sd * 0.26]], S, 0.008); }
        LD.side([[XA + 0.02, 0.24], [XB - 0.02, 0.24], [XB - 0.02, 0.33], [XA + 0.02, 0.33]], B, null, 0.008);
        LD.side([[2.18, 0.1], [2.34, 0.1], [2.34, 0.2], [2.18, 0.2]], B, null, 0.008);                      // (the spoiler's black lip, round its corners)
        // the sliding door: its rear shut line under the intake's lip, its rail along the quarter under the windows
        LD.side([[XI0 - 0.03, 0.25], [XI0 - 0.015, 0.25], [XI0 - 0.015, 0.995], [XI0 - 0.03, 0.995]], D, null, 0.009);
        LD.side([[-2.02, 0.935], [XI0 - 0.03, 0.935], [XI0 - 0.03, 0.955], [-2.02, 0.955]], D, null, 0.009);
        // ---- the flared arches (in the paint, round the wide slicks) ----
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, A.r, A.r + 0.15, sd * 0.85, sd * 0.975, P, { n: 6, a0: 0.04, a1: Math.PI - 0.04 });
        // ---- the side intakes for the mid-mounted engine: where the rear side window was, a black mouth with its slats, a lip at its front
        //      edge and over it standing out into the air ----
        for (const sd of [-1, 1]) {
          const f = sd < 0 ? '-z' : 'z', Q = sd < 0 ? 'quarterL' : 'quarterR', zb = (y) => sd * (0.9 - 0.1 * (y - 1) / 0.57 + 0.012);   // (the window band's plane there: w 0.9 at the belt, wt 0.8 at 1.57)
          const face = (pts, col, dz) => { const q = pts.map(([x, y]) => [x, y, zb(y) + sd * (dz || 0)]); K.face(sd > 0 ? q : q.reverse(), col, { part: Q }); };
          face([[XI1 + 0.05, 1.05], [XI0 - 0.04, 1.05], [XI0 - 0.04, 1.47], [XI1 + 0.05, 1.47]], B);
          for (const y of [1.16, 1.26, 1.36]) face([[XI1 + 0.06, y - 0.012], [XI0 - 0.05, y - 0.012], [XI0 - 0.05, y + 0.012], [XI1 + 0.06, y + 0.012]], GR, 0.006);
          K.box(XI0 - 0.02, 1.02, sd * 0.905, 0.05, 0.47, 0.05, 0, P, null, false, { part: Q });                   // (the lip at its front edge)
          K.box((XI0 + XI1) / 2, 1.47, sd * 0.85, XI0 - XI1 - 0.04, 0.035, 0.07, 0, P, null, false, { part: Q });   // (the brow over it)
          // the start number on the front door (over the band), its handle, its hinge; the mirror
          K.number(0.45, 0.62, sd * 0.918, 0.34, { dir: f, host: sd < 0 ? 'doorL' : 'doorR' });
          K.rect(-0.02, 0.9, sd * 0.913, 0.14, 0.03, B, { dir: f, host: sd < 0 ? 'doorL' : 'doorR' });
          K.hinge(sd < 0 ? 'doorL' : 'doorR', [1.1, 0.3, sd * 0.9], [1.1, 0.95, sd * 0.9]);
          K.mirror(1.1, 1.12, sd * 0.92, { col: B, w: 0.1, h: 0.08, d: 0.13 });
        }
        // ---- the nose: rectangular lamps in a black band, the slot between them; the deep front spoiler (the loft's end under the bumper's
        //      line, 'bumperF'): the radiator's mouth, the brake ducts, a band in the stripe colour over them, the splitter under it ----
        K.rect(2.333, 0.62, 0, 1.6, 0.17, B, { part: 'body' });
        for (const sd of [-1, 1]) { K.headLamp(2.34, 0.62, sd * 0.53, 0.065, { shape: 'rect', w: 0.38, h: 0.13, ring: null });
          K.rect(2.336, 0.62, sd * 0.78, 0.08, 0.12, K.rgb(0xff9a1e), { part: 'body' }); }
        K.grille(2.336, 0.62, 0, 0.6, 0.1, { slats: 2, slatCol: GR, part: 'body' });
        K.part('bumperF', () => {
          K.rect(2.334, 0.29, 0, 0.84, 0.17, B); K.grille(2.336, 0.29, 0, 0.8, 0.14, { slats: 2, slatCol: GR });   // the radiator's mouth
          for (const sd of [-1, 1]) K.rect(2.334, 0.28, sd * 0.64, 0.3, 0.13, B);                  // the brake ducts
          K.rect(2.334, 0.44, 0, 1.62, 0.04, S); K.rect(2.334, 0.135, 0, 1.64, 0.13, B);           // (a band in the stripe colour over them; the black lip under them)
          K.box(2.25, 0.045, 0, 0.24, 0.025, 1.8, 0, B);                                          // the splitter (4 cm proud of the face)
        }, { hinge: [[2.2, 0.3, -0.8], [2.2, 0.3, 0.8]] });
        for (const z of [-0.42, 0.28]) K.bar([1.34, 1.04, z - 0.3], [1.31, 1.06, z + 0.3], 0.01, B, { n: 4, part: 'body' });   // the wipers
        K.hinge('hood', [1.31, 1.02, -0.7], [1.31, 1.02, 0.7]);
        // ---- the tail: the tail lamps up the corner posts (they stay on the body when the tailgate goes), a black band across the
        //      tailgate; the rear bumper (the loft's end under the bumper's line): a black band, the twin tailpipes, the diffuser under it ----
        for (const sd of [-1, 1]) {
          K.box(-2.29, 0.56, sd * 0.77, 0.09, 0.5, 0.18, 0, P, null, false, { part: 'body' });
          K.rect(-2.337, 0.81, sd * 0.77, 0.16, 0.46, B, { dir: '-x', part: 'body' }); K.tailLamp(-2.338, 0.81, sd * 0.77, 0.12, 0.42);
        }
        K.rect(-2.334, 0.81, 0, 1.2, 0.17, B, { dir: '-x', part: 'trunk' });                    // (a black band across the tailgate from lamp to lamp)
        K.hinge('trunk', [-2.19, 1.6, -0.6], [-2.19, 1.6, 0.6]);
        K.part('bumperR', () => {
          K.rect(-2.334, 0.215, 0, 1.64, 0.07, B, { dir: '-x' }); K.rect(-2.334, 0.5, 0, 1.6, 0.035, S, { dir: '-x' });
          K.box(-2.2, 0.09, 0, 0.28, 0.07, 1.5, 0, B);                                            // the diffuser
          for (const sd of [-1, 1]) K.exhaust(-2.37, 0.32, sd * 0.22, 0.05, 0.2, { n: 6 });       // (the V10's twin tailpipes)
        });
        // ---- the wing across the roof's back edge: its plane in the stripe colour, the endplates in the paint, black struts (never crushed,
        //      never dented) ----
        K.part('wing', () => {
          K.wingPlank(-1.95, 1.7, -2.38, 1.73, 0.04, -0.9, 0.9, S);                               // (its top 1.77: 14 cm over the roof)
          for (const sd of [-1, 1]) { K.endplate([[-1.93, 1.675], [-2.4, 1.675], [-2.4, 1.78], [-1.95, 1.755]], sd * 0.915, 0.014, P);
            K.box(-2.16, 1.58, sd * 0.45, 0.14, 0.13, 0.025, 0, B); }
        }, { noCrush: true, noDent: true });
        // ---- inside (seen once a part is off): two racing seats in the cage, the dashboard and the wheel; the race engine behind them (the
        //      bulkhead between) with its radiators beside it, its gearbox over the rear axle; a radiator in the nose ----
        for (const sd of [-1, 1]) K.seat(0.02, 0.42, sd * 0.38, { w: 0.46, back: 0.76, tilt: 0.2, col: [0.08, 0.08, 0.09] });
        K.box(1.02, 0.6, 0, 0.42, 0.34, 1.6, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([0.52, 0.94, -0.38], [0.545, 0.965, -0.38], 0.17, B, { n: 10, capA: null, capB: null, inner: true, part: 'body' });   // the wheel (on the left) on its column
        K.bar([0.54, 0.955, -0.38], [0.84, 0.82, -0.38], 0.025, D, { n: 4, inner: true, part: 'body' });
        K.box(-0.4, 0.18, 0, 0.04, 0.84, 1.62, 0, D, null, false, { inner: true, part: 'body' });
        // the V10: its block, the plenum in the vee, the red cam covers on its banks, the headers to the tailpipes
        K.engine(-0.85, 0.2, 0, { l: 0.86, w: 0.46, h: 0.44, col: [0.6, 0.61, 0.64], cover: [0.1, 0.1, 0.11] });
        for (const sd of [-1, 1]) {
          K.plate([[-1.24, 0.48, sd * 0.12], [-0.46, 0.48, sd * 0.12], [-0.46, 0.6, sd * 0.31], [-1.24, 0.6, sd * 0.31]], 0.05, [0.82, 0.12, 0.08], { inner: true, part: 'body' });
          K.bar([-0.62, 0.36, sd * 0.3], [-1.9, 0.3, sd * 0.24], 0.035, [0.45, 0.42, 0.4], { n: 4, inner: true, part: 'body' }); }
        K.box(-1.52, 0.2, 0, 0.44, 0.32, 0.42, 0, [0.5, 0.51, 0.53], null, false, { inner: true, part: 'body' });                // (the gearbox)
        for (const sd of [-1, 1]) K.box(-0.68, 0.2, sd * 0.64, 0.4, 0.55, 0.1, 0, [0.2, 0.21, 0.22], null, false, { inner: true, part: 'body' });   // (the radiators beside it, ahead of the rear wheels)
        K.box(1.95, 0.2, 0, 0.1, 0.5, 1.3, 0, [0.16, 0.16, 0.17], null, false, { inner: true, part: 'body' });
        const C = [0.78, 0.79, 0.82];
        K.cage([[[-0.33, 0.2, -0.72], [-0.33, 1.5, -0.7]], [[-0.33, 0.2, 0.72], [-0.33, 1.5, 0.7]], [[-0.33, 1.5, -0.7], [-0.33, 1.5, 0.7]], [[-0.33, 0.25, -0.7], [-0.33, 1.48, 0.7]],
          [[1.0, 0.3, -0.76], [0.42, 1.5, -0.7]], [[1.0, 0.3, 0.76], [0.42, 1.5, 0.7]], [[0.42, 1.5, -0.7], [-0.33, 1.5, -0.7]], [[0.42, 1.5, 0.7], [-0.33, 1.5, 0.7]]], 0.025, C,
          { noCrush: true, noDent: true });
      },
    },
  });
})();
