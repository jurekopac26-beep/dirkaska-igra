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
    parts: { set: 'car', ht: 1.3, y0: 0.2 },
    // the look (KIT API v1, render.js; look units = metres): one loft from the cut-off tail to the nose: the fastback's glass and the deck
    // are one tailgate (the trunk, taken out to the roof's rear edge), the bonnet a clamshell between the wings with the power bulge on it
    // (a skin of its own, the scoop at its front); the doors long and far back, the side glass running back into the sails; the details
    // on top: the vents behind the front wheels, the slit lamps, the low mouth, the quad round tail lamps over the diffuser and four pipes
    look: {
      body: { roofY: 1.3,
        //       x      w      yb    ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.28, 0.84, 0.32, 0.74, 0.78, 0.945, 0.012, 'b', 0.1],     // the cut-off tail: the lamps' face
          [-2.22, 0.91, 0.26, 0.79, 0.84, 0.995, 0.015, 'b', 0.12],         // the lip over it
          [-2.02, 0.95, 0.21, 0.82, 0.86, 0.97, 0.02, 'b', 0.13],           // the short deck
          [-1.78, 0.97, 0.18, 0.845, 0.84, 1.0, 0.022, 'gr', 0.13],         // the fastback's glass from here
          [-1.28, 0.97, 0.17, 0.87, 0.76, 1.155, 0.03, 'gr', 0.14],         // over the rear axle: the hips at their widest
          [-1.02, 0.955, 0.17, 0.88, 0.7, 1.235, 0.035, 'r', 0.14],         // the roof's rear edge
          [-0.62, 0.94, 0.17, 0.88, 0.655, 1.265, 0.035, 'r', 0.14],        // the roof's top
          [-0.44, 0.935, 0.17, 0.875, 0.645, 1.255, 0.035, 'gf', 0.14],     // the windscreen's top
          [0.24, 0.935, 0.17, 0.83, 0.835, 0.915, 0.03, 'b', 0.14],         // its base: the cowl
          [0.95, 0.95, 0.17, 0.78, 0.87, 0.865, 0.04, 'b', 0.14],           // the long bonnet: behind the front wheel (the vents)
          [1.42, 0.955, 0.17, 0.75, 0.875, 0.83, 0.04, 'b', 0.14],          // over the front axle
          [1.92, 0.93, 0.16, 0.68, 0.85, 0.75, 0.035, 'b', 0.13],
          [2.18, 0.86, 0.16, 0.58, 0.78, 0.66, 0.025, 'b', 0.12],
          [2.27, 0.76, 0.17, 0.47, 0.68, 0.56, 0.015, 'b', 0.1]],           // the nose: the mouth's face
        eye: { x: -0.86, y: 1.06 },
        wz: 0.155,                                                          // (the wide rear tyres inside the hips)
        door: [0.22, -0.84], bumpY: [0.4, 0.52],
        crush: { x0: -1.25, x1: -0.2, z: 0.7 },                             // (the roof between the fastback's middle and the windscreen)
      },
      wheels: { style: 'std', spokes: 5, w: 0.25, wR: 0.29, rimK: 0.7, rim: [0.7, 0.71, 0.74], cap: [0.16, 0.16, 0.17], gap: 0.045 },
      // the fastback's glass and the deck are the tailgate (the trunk out to the roof's rear edge; its top only: the sails stay with the quarters)
      regions: (std) => std.map(r => r.part === 'trunk' ? Object.assign({}, r, { x: [r.x[0], -1.02], bands: ['edge', 'crown'] }) : r),
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, D = [0.09, 0.09, 0.1], CH = K.chrome, SILL = K.shade(P, 0.6), AMB = K.rgb(0xff9a1e);
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        // ---- the shell: the paint; the windscreen and the side glass (forward to the A-pillar, back into the sail: the quarter window), the
        //      fastback's glass; the sills a darker shade, black in the arches ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return at.arch ? B : SILL;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          if (kind === 'r') return e === 2 || e === 6 ? G : P;
          if (kind === 'gr') return (e >= 3 && e <= 5) || ((e === 2 || e === 6) && at.x > -1.1) ? G : P;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P, high: 'body' } } });
        const D2 = L.decal;
        // ---- the glasshouse: the A-pillars in the paint, a black frame under the roof's edge, the B-pillar, the quarter window's rear edge
        //      slanting into the sail, the mirror's black sail at the window's front corner, a chrome line along the belt ----
        D2.band([[-0.44, 0.86], [0.24, 0.6], [0.24, 1], [-0.44, 1]], P, null, 0.01);
        D2.band([[-1.1, 0.93], [-0.44, 0.93], [-0.44, 1], [-1.1, 1]], B, null, 0.008);
        D2.band([[-0.87, 0], [-0.81, 0], [-0.81, 1], [-0.87, 1]], B, null, 0.01);
        D2.band([[-1.1, 0], [-1.05, 0], [-0.96, 1], [-1.1, 1]], P, null, 0.01);
        D2.band([[0.02, 0], [0.24, 0], [0.24, 0.62]], B, null, 0.009);
        D2.band([[-1.08, 0], [0.22, 0], [0.22, 0.04], [-1.08, 0.04]], CH, null, 0.008);
        // the fastback's glass framed in the paint (narrower than the deck)
        for (const sd of [-1, 1]) D2.top([[-1.78, sd * 0.84], [-1.02, sd * 0.7], [-1.02, sd * 0.57], [-1.78, sd * 0.67]].map(p => p), P, 0.008);
        // ---- the sides: the vents behind the front wheels (a black gill, three fins over it), the doors' shut lines and handles ----
        D2.side([[0.7, 0.45], [0.93, 0.45], [1.0, 0.64], [0.77, 0.64]], B, null, 0.006);
        for (const y of [0.495, 0.545, 0.595]) { const s = (y - 0.45) * 0.368; D2.side([[0.7 + s, y - 0.009], [0.93 + s, y - 0.009], [0.93 + s + 0.007, y + 0.009], [0.7 + s + 0.007, y + 0.009]], P, null, 0.011); }
        for (const x of [0.22, -0.84]) D2.side([[x - 0.006, 0.32], [x + 0.006, 0.32], [x + 0.006, 0.86], [x - 0.006, 0.86]], K.shade(P, 0.45), null, 0.004);
        D2.side([[-0.7, 0.795], [-0.56, 0.795], [-0.56, 0.82], [-0.7, 0.82]], B, null, 0.006);
        // ---- the power bulge down the bonnet's middle (a skin on the crown), its scoop's mouth at the front ----
        K.part('hood', () => {
          const rows = [[0.36, 0.022, 0.27, 0.2], [0.95, 0.045, 0.27, 0.19], [1.42, 0.045, 0.26, 0.18], [1.86, 0.032, 0.21, 0.14]];
          const rings = rows.map(([x, h, wb, wt]) => { const y = L.topY(x, 0); return [[x, y - 0.012, -wb], [x, y + h, -wt], [x, y + h, wt], [x, y - 0.012, wb]]; });
          K.skin(rings, P, P, B);
          K.rect(1.865, L.topY(1.86, 0) + 0.012, 0, 0.26, 0.026, D, { dir: 'x' });   // (the scoop's mesh)
        });
        // ---- the nose: the low mouth (the bumper's), the slit lamps in the wings' tips, the indicators, the splitter; the wipers on the cowl ----
        K.part('bumperF', () => {
          K.grille(2.273, 0.3, 0, 1.0, 0.16, { slats: 3, slatCol: [0.24, 0.24, 0.26], frame: D, frameH: 0.012 });
          K.box(2.17, 0.12, 0, 0.2, 0.035, 1.44, 0, B);                     // the splitter
          for (const sd of [-1, 1]) { K.rect(2.272, 0.27, sd * 0.62, 0.16, 0.09, B); K.rect(2.272, 0.36, sd * 0.62, 0.12, 0.025, AMB); }   // (the brake ducts, the indicators)
        }, { hinge: [[2.2, 0.2, -0.7], [2.2, 0.2, 0.7]] });
        for (const sd of [-1, 1]) {
          const f = sd < 0 ? 'fenderL' : 'fenderR';
          D2.top([[2.266, sd * 0.44], [2.266, sd * 0.67], [2.13, sd * 0.79], [2.1, sd * 0.56]], D, 0.006, { host: f });   // (the lamp's dark glass running back over the wing's tip)
          K.headLamp(2.272, 0.5, sd * 0.56, 0.035, { shape: 'rect', w: 0.22, h: 0.06, ring: B, host: f });
        }
        for (const z of [-0.34, 0.26]) K.bar([0.27, 0.925, z - 0.26], [0.25, 0.94, z + 0.26], 0.009, B, { n: 4, part: 'body' });
        // ---- the tail: the quad round lamps in dark rings (the lit lenses are the tail mesh), the plate, the diffuser and four pipes ----
        for (const sd of [-1, 1]) for (const z of [0.5, 0.7]) { K.discX(-2.283, 0.8, sd * z, 0.083, 10, D, -1, { part: 'body' }); K.tailLamp(-2.284, 0.8, sd * z, 0.135, 0.135, { round: true }); }
        K.rect(-2.282, 0.6, 0, 0.46, 0.1, [0.93, 0.93, 0.9], { dir: '-x', part: 'body' });
        K.part('bumperR', () => {
          K.box(-2.12, 0.13, 0, 0.3, 0.19, 1.36, 0, B);                      // the diffuser under the tail
          for (const z of [-0.45, -0.15, 0.15, 0.45]) K.box(-2.12, 0.1, z, 0.28, 0.06, 0.02, 0, D);
        }, { hinge: [[-2.2, 0.45, -0.7], [-2.2, 0.45, 0.7]] });
        for (const sd of [-1, 1]) for (const z of [0.38, 0.52]) K.exhaust(-2.29, 0.235, sd * z, 0.038, 0.18, { part: 'body' });
        // ---- the mirrors on the doors' front corners ----
        for (const sd of [-1, 1]) K.mirror(0.1, 0.98, sd * 1.0, { w: 0.1, h: 0.075, d: 0.15, z0: sd * 0.92 });
        // ---- the hinges: the bonnet at the cowl, the tailgate at the roof's edge, the doors at their front edges ----
        K.hinge('hood', [0.26, 0.93, -0.7], [0.26, 0.93, 0.7]);
        K.hinge('trunk', [-1.02, 1.25, -0.6], [-1.02, 1.25, 0.6]);
        K.hinge('doorL', [0.2, 0.4, -0.93], [0.2, 0.85, -0.93]); K.hinge('doorR', [0.2, 0.4, 0.93], [0.2, 0.85, 0.93]);
        // ---- inside (seen once a part is off): two seats low and far back, the dashboard, the tunnel; the V12 behind the front axle ----
        for (const sd of [-1, 1]) K.seat(-0.8, 0.4, sd * 0.37, { w: 0.5, back: 0.62, tilt: 0.3 });
        K.box(0.07, 0.6, 0, 0.36, 0.26, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.box(-0.45, 0.2, 0, 1.2, 0.24, 0.24, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(0.92, 0.26, 0, { l: 0.95, w: 0.62, h: 0.46 });
      },
    },
  });
})();
