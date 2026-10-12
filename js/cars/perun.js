/* Vehicle 'perun' — PERUN V12: a 1980s wedge-shaped mid-engined supercar. Signature features: 1) a flat wedge nose and a steep
   windscreen, 2) scissor doors, 3) NACA ducts in the doors and big intakes behind them, 4) a huge rear wing on two pylons, 5) very wide
   rear wheel arches. L 4.14 W 2.00 H 1.07, wheelbase 2.50, overhangs F 0.78 R 0.86 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'perun', name: 'PERUN V12', cat: 'super', ord: 1, drive: 'MR',
    desc: 'Klinast superšportnik iz 80-ih s škarjastimi vrati, dovodi NACA in ogromnim krilom.',
    phys: { mass: 1490, a: 1.29, b: 1.21, kI: 1.2, kw: 420, redline: 7800, idle: 950, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 3.86, rw: 0.32, cDrag: 0.38, len: 4.14, wid: 2, steerMax: 0.6,
      tracK: 1.1, brakeK: 1.05, spinK: 0.3 },
    arc: { amax: 1.8, kv: 2, rmin: 4.6 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.18, pwr: 0.08, out: 1.2, turn: 1.15, w: 1.02 },   // (the MR layer: quick turn-in, lift rotation)
    stats: { power: 10, grip: 8, weight: 5, drift: 7 },
    price: 85000, pk: 'ppo', field: ['perun'],
    snd: { kind: 'v12', hz: 1.05, loud: 1.2 },
    expect: { t100: [2.97, 3.49], vmax: [248, 264], latG: [2.3, 2.4], d100: [21.8, 24.1] },
    parts: { set: 'race', ht: 1.07, y0: 0.16,
      // (where the look has them: the engine cover from the rear glass's foot to the tail, the front lid with the nose's top, the doors with
      // their glass, the quarters with their airboxes, the mirrors on stalks at the windscreen's foot, the wing high over the tail)
      over: { trunk: { lx: -0.82, y: 0.88 }, hood: { lx: 0.67 }, doorL: { lx: -0.01, y: 0.66 }, doorR: { lx: -0.01, y: 0.66 }, quarterL: { y: 0.68, h: 0.15 }, quarterR: { y: 0.68, h: 0.15 },
        mirrorL: { lx: 0.11, lz: -0.92, y: 0.87 }, mirrorR: { lx: 0.11, lz: 0.92, y: 0.87 }, wing: { lx: -0.87, y: 1.0 } } },
    // the look (KIT API v1, render.js; look units = metres): one loft, tail to nose: the low tail with its black lamp panel, the flat engine
    // cover between the hips, the rear glass between the buttresses, the short roof, the long raked windscreen, the front lid falling in
    // one wedge to the low nose. The standard regions split it: the doors (scissor doors, hinged across the car at their front: their glass,
    // the NACA ducts), the front wings and the rear quarters (their flares; the airbox scoops on the buttresses), the front lid (the pop-up
    // lamps' lids), the engine cover (trunk), the bumpers (the nose's face with its lamps; the tail's valance); the wing on its two pylons
    look: {
      body: { len: 4.14, wid: 2, roofY: 1.07, wz: 0.2,
        //       x      w      yb    ybelt  wt     yt     cr      kind tuck
        secs: [[-2.07, 0.86, 0.26, 0.78, 0.82, 0.83, 0.01, 'b', 0.08],     // the tail's face (the black lamp panel on it)
          [-1.99, 0.925, 0.21, 0.82, 0.87, 0.865, 0.012, 'b', 0.1],        // the deck's back edge
          [-1.6, 0.968, 0.18, 0.86, 0.8, 0.895, 0.02, 'b', 0.12],          // the engine cover between the hips, low under the wing
          [-1.28, 0.95, 0.17, 0.88, 0.58, 0.95, 0.02, 'gr', 0.12],         // the rear glass's foot (the buttresses beside it)
          [-0.92, 0.915, 0.16, 0.84, 0.6, 1.02, 0.045, 'r', 0.12],         // the roof's back edge
          [-0.22, 0.9, 0.16, 0.79, 0.63, 1.03, 0.04, 'gf', 0.11],          // the windscreen's top
          [0.4, 0.905, 0.16, 0.75, 0.79, 0.785, 0.006, 'b', 0.11],         // its base (the cowl)
          [1.29, 0.92, 0.17, 0.69, 0.86, 0.715, -0.012, 'b', 0.11],        // the front lid over the axle (sunk a little between the wings)
          [1.86, 0.885, 0.19, 0.58, 0.82, 0.6, -0.006, 'b', 0.1],          // the wedge falls to the nose
          [2.02, 0.82, 0.2, 0.5, 0.76, 0.535, 0, 'b', 0.09],               // its sharp front edge; under it the chin slopes back
          [2.07, 0.77, 0.27, 0.47, 0.72, 0.5, 0, 'b', 0.05]],              // the nose's face
        eye: { x: -0.55, y: 0.97 },                                         // (over the front lid's plane: the lid in sight from the seat)
        door: [0.62, -0.62], bumpF: 0.2, bumpR: 0.16, bumpY: [0.34, 0.45],
        engine: [-1.42, 0.74], engRear: true },                           // (the V12 behind the seats, under the engine cover)
      wheels: { style: 'std', spokes: 0, w: 0.245, wR: 0.34, rimK: 0.66, rim: [0.8, 0.72, 0.5], cap: [0.24, 0.24, 0.26], gap: 0.04 },
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.09, 0.09, 0.1], AMB = [0.95, 0.5, 0.08];
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (between the arches: the sills)
        // ---- the shell: the paint; the glass (the windscreen and the side glass beside it, the door glass, the rear glass); the sills black;
        //      the nose's face black over a painted valance (the bumper), the tail's face painted over a dark valance ----
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? B : K.shade(P, 0.7);
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return at.x > -0.62 ? G : P;   // (the door's glass; behind it the buttress)
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: B, colLow: P, low: 'bumperF', high: 'bumperF' }, rear: { col: P, colLow: D } } });
        const D2 = L.decal;
        // ---- the glasshouse: black frames along the glass's foot and the roof's edge, the A-pillars, the B-pillar at the door's rear edge,
        //      the split in the door glass ----
        D2.band([[-0.62, 0], [0.4, 0], [0.4, 0.07], [-0.62, 0.07]], B, null, 0.008);
        D2.band([[-0.62, 0.93], [0.4, 0.93], [0.4, 1], [-0.62, 1]], B, null, 0.008);
        D2.band([[-0.66, 0], [-0.6, 0], [-0.6, 1], [-0.66, 1]], B, null, 0.01);
        D2.band([[-0.6, 0.42], [0.05, 0.42], [0.05, 0.47], [-0.6, 0.47]], B, null, 0.01);
        // ---- the doors (scissor doors: no handle, the hinge across the car at the front): the shut lines, the NACA duct in each ----
        for (const x of [0.62, -0.62]) D2.side([[x - 0.006, 0.2], [x + 0.006, 0.2], [x + 0.006, 0.95], [x - 0.006, 0.95]], D, null, 0.004);
        D2.band([[0.614, 0], [0.626, 0], [0.42, 1], [0.408, 1]], D, null, 0.004);
        D2.side([[0.2, 0.647], [-0.2, 0.62], [-0.2, 0.675]], K.shade(P, 0.3), null, 0.006);                    // the duct's narrow front
        D2.side([[-0.2, 0.62], [-0.56, 0.55], [-0.56, 0.72], [-0.2, 0.675]], K.shade(P, 0.3), null, 0.006);    // flaring to its mouth
        D2.side([[-0.6, 0.55], [-0.56, 0.55], [-0.56, 0.72], [-0.6, 0.72]], B, null, 0.007);                    // the mouth
        // ---- behind the doors: the intake the ducts blow into (on the quarters, before the rear wheels: black, its slats) ----
        D2.side([[-0.65, 0.53], [-0.8, 0.5], [-0.8, 0.72], [-0.65, 0.73]], B, null, 0.006);
        for (const y of [0.585, 0.65]) D2.side([[-0.66, y], [-0.79, y - 0.01], [-0.79, y + 0.012], [-0.66, y + 0.022]], [0.22, 0.22, 0.24], null, 0.009);
        // ---- the side: black skirts from arch to arch (down to the sills), a stripe over them ----
        D2.side([[XA + 0.03, 0.2], [XB - 0.03, 0.2], [XB - 0.03, 0.37], [XA + 0.03, 0.37]], B, null, 0.006);
        D2.side([[XA + 0.03, 0.38], [XB - 0.03, 0.38], [XB - 0.03, 0.4], [XA + 0.03, 0.4]], S, null, 0.006);
        D2.side([[1.74, 0.47], [1.82, 0.47], [1.82, 0.5], [1.74, 0.5]], AMB, null, 0.006);                       // the side markers: amber in front,
        D2.side([[-1.93, 0.6], [-1.86, 0.6], [-1.86, 0.63], [-1.93, 0.63]], [0.62, 0.06, 0.05], null, 0.006);     //  red behind
        // ---- the airboxes: a scoop on each buttress behind the door's glass, its mouth forward (black, its slats) ----
        const band = (x, z) => { const w = L.prop(x, 'w'), wt = L.prop(x, 'wt'), yb = L.prop(x, 'ybelt'), yt = L.prop(x, 'yt'); return yb + (yt - yb) * Math.max(0, Math.min(1, (w - Math.abs(z)) / (w - wt))); };
        for (const sd of [-1, 1]) {
          const ring = (x, top, zi, zo) => [[x, band(x, zi) - 0.012, sd * zi], [x, top, sd * zi], [x, top - 0.012, sd * zo], [x, band(x, zo) - 0.012, sd * zo]];
          K.skin([ring(-0.665, 1.02, 0.68, 0.9), ring(-0.9, 1.012, 0.68, 0.905), ring(-1.25, 0.965, 0.68, 0.92)], P, B, P);
          for (const y of [0.94, 0.98]) K.rect(-0.66, y, sd * 0.77, 0.24, 0.012, D, { part: sd < 0 ? 'quarterL' : 'quarterR' });
        }
        // ---- the wheel arches: flares, the rear ones very wide ----
        for (const sd of [-1, 1]) {
          K.flare(K.fx, 0.365, 0.405, sd * 0.895, sd * 0.955, K.shade(P, 0.86), { a0: 0.06, a1: Math.PI - 0.06 });
          K.flare(K.rx, 0.365, 0.52, sd * 0.925, sd * 1.0, K.shade(P, 0.86), { a0: 0.02, a1: Math.PI - 0.02 });
        }
        // ---- the nose: the black strip with the lamps (the pop-up lamps are shut in the lid), the painted valance with its intakes, the
        //      black chin spoiler (the bumper) ----
        K.part('bumperF', () => {
          K.box(1.98, 0.15, 0, 0.2, 0.065, 1.5, 0, B);
          K.grille(2.073, 0.305, 0, 0.8, 0.05, { slats: 1 });
          for (const sd of [-1, 1]) {
            K.headLamp(2.078, 0.44, sd * 0.56, 0.035, { shape: 'rect', w: 0.3, h: 0.065, ring: null });
            K.rect(2.075, 0.44, sd * 0.33, 0.13, 0.065, AMB);
          }
        });
        // ---- the front lid: the pop-up lamps' lids (shut), the shut line at the cowl ----
        for (const sd of [-1, 1]) {
          const Z = (p) => p.map(([x, z]) => [x, sd * z]), x0 = 1.48, x1 = 1.82, zi = 0.36, zo = 0.76, t = 0.016;
          for (const p of [[[x0, zi], [x1, zi], [x1, zi + t], [x0, zi + t]], [[x0, zo - t], [x1, zo - t], [x1, zo], [x0, zo]],
            [[x0, zi], [x0 + t, zi], [x0 + t, zo], [x0, zo]], [[x1 - t, zi], [x1, zi], [x1, zo], [x1 - t, zo]]]) D2.top(Z(p), D, 0.004);
        }
        D2.top([[0.43, -0.78], [0.445, -0.78], [0.445, 0.78], [0.43, 0.78]], D, 0.004);
        // ---- the wing: a big plank on two pylons over the tail, endplates at its tips ----
        K.part('wing', () => {
          K.wingPlank(-1.55, 1.0, -2.04, 1.05, 0.04, -0.87, 0.87, P);
          for (const sd of [-1, 1]) {
            K.endplate([[-1.53, 0.97], [-2.07, 1.0], [-2.07, 1.1], [-1.55, 1.05]], sd * 0.88, 0.016, B);
            K.endplate([[-1.62, 0.87], [-1.88, 0.84], [-1.95, 1.045], [-1.68, 1.01]], sd * 0.4, 0.04, B);
          }
        }, { noCrush: true, noDent: true });
        // ---- the engine cover: a black louvred panel under the wing ----
        D2.top([[-1.3, -0.52], [-1.94, -0.52], [-1.94, 0.52], [-1.3, 0.52]], B, 0.004);   // (from the rear glass's foot: one dark band to the wing)
        for (let i = 0; i < 5; i++) { const x = -1.42 - i * 0.11; D2.top([[x, -0.47], [x - 0.035, -0.47], [x - 0.035, 0.47], [x, 0.47]], [0.24, 0.24, 0.26], 0.008); }
        // ---- the tail: the black panel with the lamps, the grille between them, the dark valance (the bumper), the four pipes ----
        const tx = -2.07;
        K.rect(tx - 0.002, 0.64, 0, 1.6, 0.27, B, { dir: '-x', part: 'body' });
        K.grille(tx - 0.004, 0.64, 0, 0.42, 0.16, { dir: -1, slats: 3, part: 'body' });
        for (const sd of [-1, 1]) {
          K.tailLamp(tx - 0.004, 0.66, sd * 0.6, 0.3, 0.13);
          K.rect(tx - 0.005, 0.66, sd * 0.38, 0.12, 0.13, AMB, { dir: '-x', part: 'body' });
          K.rect(tx - 0.005, 0.66, sd * 0.28, 0.07, 0.13, [0.9, 0.9, 0.88], { dir: '-x', part: 'body' });
        }
        K.part('bumperR', () => {
          K.box(-1.99, 0.22, 0, 0.16, 0.05, 1.5, 0, B);
          K.rect(tx - 0.004, 0.36, 0, 0.5, 0.11, [0.93, 0.93, 0.9], { dir: '-x' });
        });
        for (const z of [-0.2, -0.09, 0.09, 0.2]) K.exhaust(-2.11, 0.26, z, 0.038, 0.2, { part: 'body' });   // (at the valance's foot, under the plate)
        // ---- the mirrors (black, on stalks at the windscreen's foot), the single wiper ----
        for (const sd of [-1, 1]) K.mirror(0.22, 0.88, sd * 0.95, { col: B, w: 0.09, h: 0.075, d: 0.17, arm: B, z0: sd * 0.84 });
        K.bar([0.37, L.topY(0.37, -0.6) + 0.012, -0.6], [0.2, L.topY(0.2, 0.35) + 0.012, 0.35], 0.01, B, { n: 4, part: 'body' });
        // ---- the hinges: the front lid at the cowl, the engine cover at the rear glass, the scissor doors across the car at their front ----
        K.hinge('hood', [0.43, 0.81, -0.6], [0.43, 0.81, 0.6]);
        K.hinge('trunk', [-1.29, 0.95, -0.5], [-1.29, 0.95, 0.5]);
        for (const sd of [-1, 1]) K.hinge(sd < 0 ? 'doorL' : 'doorR', [0.6, 0.72, sd * 0.93], [0.6, 0.72, sd * 0.6]);
        // ---- inside (seen once a part is off): two buckets low down, the dashboard, the tunnel (the gearbox ahead of the engine), the V12 ----
        for (const sd of [-1, 1]) K.seat(-0.5, 0.3, sd * 0.36, { w: 0.46, l: 0.48, back: 0.55, tilt: 0.42 });
        K.box(0.22, 0.42, 0, 0.32, 0.2, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        // (the dashboard's top under the windscreen, in the outer shell: from the seat it meets the cowl's edge and closes the view into
        // the nose under it; sloping to the driver, it shows him its dark face, not the sky's glint)
        K.face([[-0.02, 0.62, -0.8], [-0.02, 0.62, 0.8], [0.398, 0.7835, 0.785], [0.398, 0.7835, -0.785]], D, { part: 'body' });
        for (const sd of [-1, 1]) { const q = [[0.398, 0.7835, sd * 0.785], [0.398, 0.752, sd * 0.89], [-0.02, 0.62, sd * 0.87], [-0.02, 0.62, sd * 0.8]]; K.face(sd > 0 ? q.reverse() : q, D, { part: 'body' }); }
        K.box(-0.1, 0.18, 0, 1.0, 0.22, 0.26, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([0.12, 0.66, -0.36], [0.15, 0.68, -0.36], 0.17, B, { n: 8, inner: true, part: 'body' });   // (the wheel, left)
        K.engine(-1.42, 0.24, 0, { l: 0.95, w: 0.66, h: 0.44, cover: [0.2, 0.2, 0.22] });
        for (const sd of [-1, 1]) K.box(-1.42, 0.6, sd * 0.2, 0.9, 0.07, 0.14, 0, [0.62, 0.1, 0.08], null, true, { inner: true, part: 'body' });   // (the V12's two red cam covers)
        // the wheels' housings, seen from the front boot and the engine bay (the tubs face the wheels: from inside, a wall)
        for (const sd of [-1, 1]) for (const x of [K.fx, K.rx]) K.box(x, 0.22, sd * 0.56, 0.74, x > 0 ? 0.44 : 0.6, 0.04, 0, D, null, true, { inner: true, part: 'body' });
      },
    },
  });
})();
