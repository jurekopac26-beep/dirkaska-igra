/* Vehicle 'jelen' — JELEN GT: a front-engined V12 grand tourer. Signature features: 1) a very long bonnet with a power bulge, 2) the
   cabin set far back over the rear axle, 3) a fastback roof ending in a short cut-off tail, 4) quad round tail lamps, 5) side vents
   behind the front wheels. L 4.55 W 1.94 H 1.30, wheelbase 2.70, overhangs F 0.85 R 1.00 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'jelen', name: 'JELEN GT', cat: 'sportni', ord: 3, drive: 'FR',
    desc: 'Gran turismo z V12 spredaj: dolg pokrov motorja, hiter in miren na dolgih ravninah.',
    phys: { mass: 1650, a: 1.42, b: 1.28, kI: 1.3, kw: 400, redline: 7500, idle: 800, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.36, rw: 0.33, cDrag: 0.34, len: 4.55, wid: 1.94, steerMax: 0.6,
      brakeK: 1.05, spinK: 0.3 },
    arc: { amax: 1.78, kv: 2, rmin: 4.6 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.12, pwr: 0.08, out: 1.2, turn: 0.95, w: 0.99 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w)
    stats: { power: 9, grip: 8, weight: 3, drift: 7 },
    price: 60000, pk: 'ppo', field: ['jelen'],
    snd: { kind: 'v12', hz: 0.95, loud: 1.1 },
    expect: { t100: [3.28, 3.85], vmax: [245, 260], latG: [2.27, 2.37], d100: [21.9, 24.2] },
    parts: { set: 'car', ht: 1.3, y0: 0.2, over: { doorL: { lx: -0.16, y: 0.78 }, doorR: { lx: -0.16, y: 0.78 }, mirrorL: { lx: 0, y: 0.93 }, mirrorR: { lx: 0, y: 0.93 } } },   // (the doors and their mirrors far back, where the look has them)
    // the look (KIT API v1, render.js; look units = metres): one loft from the cut-off tail to the nose: the fastback's glass and the deck
    // are one tailgate (the trunk, taken out to the roof's rear edge), the bonnet a clamshell between the wings with the power bulge on it
    // (a skin of its own, the scoop at its front); the doors long and far back, the side glass running back into the sails; the details
    // on top: the vents behind the front wheels, the swept lamps, the low mouth, the quad round tail lamps over the diffuser and four pipes
    look: {
      body: { roofY: 1.3,
        //       x      w      yb    ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.28, 0.83, 0.25, 0.7, 0.77, 0.915, 0.012, 'b', 0.1],      // the cut-off tail: the lamps' face
          [-2.22, 0.9, 0.22, 0.745, 0.83, 0.965, 0.016, 'b', 0.12],         // the lip over it
          [-2.02, 0.945, 0.2, 0.775, 0.85, 0.94, 0.02, 'b', 0.14],          // the short deck
          [-1.8, 0.965, 0.19, 0.8, 0.835, 0.965, 0.022, 'gr', 0.15],        // the fastback's glass from here
          [-1.36, 0.97, 0.17, 0.84, 0.76, 1.13, 0.028, 'gr', 0.16],         // the hips at their widest, over the rear axle
          [-1.08, 0.95, 0.17, 0.855, 0.695, 1.252, 0.033, 'r', 0.16],       // the roof's rear edge
          [-0.7, 0.93, 0.17, 0.86, 0.66, 1.267, 0.033, 'r', 0.16],          // the roof's top
          [-0.52, 0.925, 0.17, 0.855, 0.65, 1.264, 0.033, 'gf', 0.16],      // the windscreen's top
          [0.16, 0.925, 0.17, 0.81, 0.83, 0.915, 0.03, 'b', 0.16],          // its base: the cowl
          [0.95, 0.945, 0.17, 0.76, 0.865, 0.87, 0.04, 'b', 0.16],          // the long bonnet: behind the front wheel (the vents)
          [1.42, 0.95, 0.17, 0.73, 0.865, 0.83, 0.04, 'b', 0.15],           // over the front axle
          [1.86, 0.93, 0.16, 0.65, 0.84, 0.765, 0.035, 'b', 0.13],
          [2.12, 0.87, 0.16, 0.555, 0.76, 0.68, 0.025, 'b', 0.12],          // the lamps on the wings' tips
          [2.24, 0.78, 0.17, 0.475, 0.66, 0.585, 0.015, 'b', 0.11],
          [2.27, 0.7, 0.2, 0.425, 0.58, 0.5, 0.01, 'b', 0.09]],             // the nose: the mouth's face
        eye: { x: -0.98, y: 1.06 },
        wz: 0.155,                                                          // (the wide rear tyres inside the hips)
        door: [0.14, -0.86], bumpY: [0.4, 0.52],
        crush: { x0: -1.35, x1: -0.3, z: 0.7 },                             // (the roof between the fastback's middle and the windscreen)
      },
      wheels: { style: 'std', spokes: 5, w: 0.25, wR: 0.29, rimK: 0.7, rim: [0.7, 0.71, 0.74], cap: [0.16, 0.16, 0.17], gap: 0.045 },
      // the fastback's glass and the deck are the tailgate (the trunk out to the roof's rear edge; its top only: the sails stay with the quarters)
      regions: (std) => std.map(r => r.part === 'trunk' ? Object.assign({}, r, { x: [r.x[0], -1.08], bands: ['edge', 'crown'] }) : r),
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, D = [0.09, 0.09, 0.1], CH = K.chrome, SILL = K.shade(P, 0.6), AMB = K.rgb(0xff9a1e), LC = [0.74, 0.77, 0.82];
        // ---- the shell: the paint; the windscreen and the side glass (forward to the A-pillar, back into the sail: the quarter window), the
        //      fastback's glass; the sills a darker shade, black in the arches ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return at.arch ? B : SILL;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          if (kind === 'r') return e === 2 || e === 6 ? G : P;
          if (kind === 'gr') return (e >= 3 && e <= 5) || ((e === 2 || e === 6) && at.x > -1.33) ? G : P;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P, high: 'body' } } });
        const D2 = L.decal;
        // ---- the glasshouse: the A-pillars in the paint, a black frame under the roof's edge, the B-pillar black (one run of glass), the
        //      quarter window's rear edge slanting into the sail, the mirror's black sail at the window's front corner, a chrome belt line ----
        D2.band([[-0.52, 0.86], [0.16, 0.6], [0.16, 1], [-0.52, 1]], P, null, 0.01);
        D2.band([[-1.12, 0.93], [-0.52, 0.93], [-0.52, 1], [-1.12, 1]], B, null, 0.008);
        D2.band([[-0.89, 0], [-0.83, 0], [-0.83, 1], [-0.89, 1]], B, null, 0.01);
        D2.band([[-1.36, 0], [-1.3, 0], [-1.1, 1], [-1.36, 1]], P, null, 0.01);
        D2.band([[-0.06, 0], [0.16, 0], [0.16, 0.62]], B, null, 0.009);
        D2.band([[-1.3, 0], [0.14, 0], [0.14, 0.04], [-1.3, 0.04]], CH, null, 0.008);
        // the fastback's glass framed in the paint (narrower than the deck)
        for (const sd of [-1, 1]) D2.top([[-1.8, sd * 0.83], [-1.08, sd * 0.695], [-1.08, sd * 0.57], [-1.8, sd * 0.67]], P, 0.008);
        // ---- the sides: the vents behind the front wheels (a black gill, two fins over it), the doors' shut lines and handles ----
        D2.side([[0.66, 0.44], [0.98, 0.44], [1.06, 0.62], [0.74, 0.62]], B, null, 0.006);
        for (const y of [0.5, 0.56]) { const s = (y - 0.44) * 0.444; D2.side([[0.66 + s, y - 0.01], [0.98 + s, y - 0.01], [0.98 + s + 0.009, y + 0.01], [0.66 + s + 0.009, y + 0.01]], P, null, 0.011); }
        for (const x of [0.14, -0.86]) D2.side([[x - 0.006, 0.32], [x + 0.006, 0.32], [x + 0.006, 0.84], [x - 0.006, 0.84]], K.shade(P, 0.45), null, 0.004);
        D2.side([[-0.78, 0.785], [-0.64, 0.785], [-0.64, 0.81], [-0.78, 0.81]], B, null, 0.006);
        // ---- the power bulge down the bonnet's middle (a skin on the crown), its scoop's mouth at the front ----
        K.part('hood', () => {
          const rows = [[0.3, 0.022, 0.27, 0.2], [0.95, 0.048, 0.27, 0.19], [1.42, 0.048, 0.26, 0.18], [1.88, 0.032, 0.2, 0.135]];
          const rings = rows.map(([x, h, wb, wt]) => { const y = L.topY(x, 0); return [[x, y - 0.012, -wb], [x, y + h, -wt], [x, y + h, wt], [x, y - 0.012, wb]]; });
          K.skin(rings, P, P, B);
          K.rect(1.885, L.topY(1.88, 0) + 0.014, 0, 0.25, 0.024, D, { dir: 'x' });   // (the scoop's mesh)
        });
        // ---- the nose: the low mouth (the bumper's), the indicators, the brake ducts, the splitter; the lamps in the wings' tips, their
        //      covers swept back over the wings; the wipers on the windscreen's foot ----
        K.part('bumperF', () => {
          K.grille(2.273, 0.3, 0, 1.0, 0.14, { slats: 2, slatCol: [0.24, 0.24, 0.26], frame: D, frameH: 0.012 });
          K.box(2.17, 0.12, 0, 0.2, 0.035, 1.38, 0, B);                     // the splitter
          for (const sd of [-1, 1]) { K.rect(2.272, 0.27, sd * 0.6, 0.12, 0.08, B); K.rect(2.272, 0.355, sd * 0.6, 0.12, 0.025, AMB); }   // (the brake ducts, the indicators)
          K.rect(2.2715, 0.4, 0, 1.36, 0.008, K.shade(P, 0.45));               // (its shut line under the lamps)
        }, { hinge: [[2.2, 0.2, -0.7], [2.2, 0.2, 0.7]] });
        for (const sd of [-1, 1]) {
          const f = sd < 0 ? 'fenderL' : 'fenderR';
          D2.top([[2.268, sd * 0.37], [2.268, sd * 0.575], [2.1, sd * 0.745], [2.13, sd * 0.52]], LC, 0.006, { host: f });
          K.headLamp(2.272, 0.474, sd * 0.47, 0.03, { shape: 'rect', w: 0.2, h: 0.05, ring: B, host: f });
        }
        for (const z of [-0.33, 0.27]) { const a = [0.11, 0, z - 0.27], b = [0.07, 0, z + 0.27]; a[1] = L.topY(a[0], a[2]) + 0.012; b[1] = L.topY(b[0], b[2]) + 0.012; K.bar(a, b, 0.008, B, { n: 4, part: 'body' }); }
        // ---- the tail: the quad round lamps in silver rings (the lit lenses are the tail mesh), the plate; the bumper's black valance
        //      low down, four pipes in chrome rings out of it ----
        for (const sd of [-1, 1]) for (const z of [0.48, 0.68]) { K.discX(-2.283, 0.78, sd * z, 0.083, 10, [0.5, 0.51, 0.54], -1, { part: 'body' }); K.tailLamp(-2.284, 0.78, sd * z, 0.135, 0.135, { round: true }); }
        K.rect(-2.282, 0.585, 0, 0.46, 0.09, [0.93, 0.93, 0.9], { dir: '-x', part: 'body' });
        K.part('bumperR', () => {
          K.rect(-2.282, 0.33, 0, 1.4, 0.15, B, { dir: '-x' });                // the black valance the pipes come out of
          K.rect(-2.2815, 0.52, 0, 1.62, 0.008, K.shade(P, 0.45), { dir: '-x' });   // (its shut line)
        }, { hinge: [[-2.2, 0.45, -0.7], [-2.2, 0.45, 0.7]] });
        for (const sd of [-1, 1]) for (const z of [0.4, 0.53]) { K.exhaust(-2.31, 0.31, sd * z, 0.036, 0.2, { part: 'body' }); K.discX(-2.306, 0.31, sd * z, 0.048, 8, CH, -1, { part: 'body' }); }
        // the dashboard's far wall under the windscreen's foot, in the outer shell (the glass hides it from outside), facing the driver: the
        // cockpit's own dashboard stops well short of a windscreen this far ahead (no looking down into the bonnet's hollow at the wheels)
        K.face([[0.15, 0.7, -0.85], [0.15, 0.7, 0.85], [0.15, 0.82, 0.86], [0.15, 0.92, 0.62], [0.15, 0.92, -0.62], [0.15, 0.82, -0.86]], [0.13, 0.13, 0.14], { part: 'body' });
        // ---- the mirrors on the doors' front corners ----
        for (const sd of [-1, 1]) K.mirror(0.0, 0.93, sd * 0.985, { w: 0.09, h: 0.07, d: 0.13 });
        // ---- the hinges: the bonnet at the cowl, the tailgate at the roof's edge, the doors at their front edges ----
        K.hinge('hood', [0.18, 0.94, -0.7], [0.18, 0.94, 0.7]);
        K.hinge('trunk', [-1.08, 1.26, -0.6], [-1.08, 1.26, 0.6]);
        K.hinge('doorL', [0.12, 0.4, -0.92], [0.12, 0.82, -0.92]); K.hinge('doorR', [0.12, 0.4, 0.92], [0.12, 0.82, 0.92]);
        // ---- inside (seen once a part is off): two seats low and far back, the dashboard, the tunnel; the V12 behind the front axle with
        //      its two plenums, the inner wings over the front wheels, the radiator in the nose ----
        for (const sd of [-1, 1]) K.seat(-0.92, 0.4, sd * 0.37, { w: 0.5, back: 0.62, tilt: 0.3 });
        K.box(-0.05, 0.6, 0, 0.36, 0.25, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.box(-0.55, 0.2, 0, 1.2, 0.24, 0.24, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(0.98, 0.26, 0, { l: 0.92, w: 0.62, h: 0.46 });
        for (const sd of [-1, 1]) {
          K.cyl([0.58, 0.7, sd * 0.15], [1.38, 0.7, sd * 0.15], 0.05, [0.62, 0.63, 0.66], { n: 6, inner: true, part: 'body' });
          K.box(1.42, 0.715, sd * 0.76, 0.8, 0.04, 0.3, 0, D, null, false, { inner: true, part: 'body' });
        }
        K.box(2.0, 0.22, 0, 0.06, 0.34, 1.1, 0, D, null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
