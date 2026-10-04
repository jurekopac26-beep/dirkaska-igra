/* Vehicle 'zmaj' — ZMAJ 85: a 1985 Group B short-wheelbase four-wheel-drive rally car. Signature features: 1) a short wheelbase with long
   overhangs, 2) huge front and rear wings, 3) a radiator grille in the front bumper, 4) boxy flared arches, 5) a roof vent and louvred
   rear window. L 4.24 W 1.80 H 1.34, wheelbase 2.22, overhangs F 0.95 R 1.07 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'zmaj', name: 'ZMAJ 85', cat: 'reli', ord: 2, drive: 'AWD',
    desc: 'Relijska pošast skupine B iz leta 1985: kratka medosna razdalja in ogromna krila.',
    phys: { mass: 1090, a: 1.17, b: 1.05, kI: 1.12, kw: 350, redline: 8000, idle: 1000, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 4.16, rw: 0.33, cDrag: 0.46, len: 4.24, wid: 1.8, steerMax: 0.64,
      tracK: 1.1, brakeK: 1.05, spinK: 0.3 },
    arc: { amax: 1.8, kv: 2.05, rmin: 4 },
    csp: { bx: 0.13, coast: -0.075, thr: -0.01, liftP: 0, pwr: 0.05, out: 1, turn: 1.08, w: 1 },   // (the AWD layer: steady, straightens quickly; its own bx, coast, thr, pwr, out, turn, w)
    stats: { power: 9, grip: 8, weight: 8, drift: 5 },
    price: 75000, pk: 'open', field: ['zmaj'],
    snd: { kind: 'i5', hz: 1, turbo: 1, loud: 1.2 },
    expect: { t100: [2.4, 2.82], vmax: [244, 259], latG: [2.3, 2.4], d100: [21.7, 24] },
    partNames: { grille: 'radiator grille' },
    parts: { set: 'race', ht: 1.34, y0: 0.18,
      extra: {
        grille: { z: 0, th: 0.55, m: 4, r: 0.45, h: 0.1, lx: 0.97, lz: 0, y: 0.34 },
      },
      // (the debris from where the look has the parts: the radiator low in the bumper, the bumper's middle, the boot lid behind the steep rear
      // glass, the wing high over it, the doors and quarters up to their glass, the mirrors by the A-pillars)
      over: { bumperF: { lx: 0.93 }, trunk: { lx: -0.79, y: 0.96 }, wing: { lx: -0.89, y: 1.22 }, doorL: { y: 0.73 }, doorR: { y: 0.73 },
        quarterL: { y: 0.67 }, quarterR: { y: 0.67 }, mirrorL: { y: 0.94 }, mirrorR: { y: 0.94 } },
    },
    // the look (KIT API v1, render.js; look units = metres): a three-box coupé loft, its sides stepped out over both axles (the box flares:
    // flat-faced, flat-topped, the doors set in between them), a long low nose over the five ahead of the front axle, an upright glasshouse
    // set back over the short wheelbase, a short boot under a full-width wing. The standard regions split the loft (the bonnet, the boot lid,
    // the fenders, the quarters, the doors with their glass, the bumpers' corners); the deep front bumper with its splitter, end plates and
    // dive planes ('bumperF'), the radiator box showing through it ('grille'), the rear wing ('wing'), the rear bumper, the mirrors drawn in
    // their parts; the roof vent and the louvres over the rear glass in the body
    look: {
      body: { len: 4.24, wid: 1.8, roofY: 1.335,
        //       x      w     yb    ybelt  wt    yt     cr     kind  tuck
        secs: [[-2.07, 0.83, 0.3, 0.86, 0.8, 0.95, 0.01, 'b', 0.1],      // the tail panel's top edge (the boot lid's rear edge)
          [-2.02, 0.86, 0.27, 0.88, 0.83, 0.97, 0.015, 'b', 0.1],
          [-1.66, 0.86, 0.24, 0.88, 0.83, 0.975, 0.02, 'b', 0.11],       // the rear flare's tail end (its taper)
          [-1.58, 0.9, 0.23, 0.88, 0.84, 0.975, 0.02, 'b', 0.11],        // the rear flare: its flat face, its flat top
          [-1.245, 0.9, 0.22, 0.88, 0.82, 0.98, 0.02, 'gr', 0.11],       // the rear glass's base (the boot lid's front edge; on the arch's own cut)
          [-0.92, 0.9, 0.22, 0.88, 0.66, 1.27, 0.06, 'r', 0.11],         // the roof's rear edge
          [-0.56, 0.9, 0.22, 0.88, 0.66, 1.275, 0.06, 'r', 0.11],        // the rear flare's front end (behind the B-pillar)
          [-0.5, 0.82, 0.22, 0.88, 0.66, 1.275, 0.06, 'r', 0.11],        // the door's rear edge: the door set in between the flares
          [-0.06, 0.82, 0.22, 0.88, 0.66, 1.27, 0.06, 'gf', 0.11],       // the windscreen's top
          [0.5, 0.82, 0.22, 0.84, 0.79, 0.87, 0.02, 'b', 0.11],          // the windscreen's base (the cowl; its side band not a flat sliver)
          [0.62, 0.82, 0.22, 0.84, 0.79, 0.86, 0.025, 'b', 0.11],        // the door's front edge
          [0.7, 0.9, 0.22, 0.8, 0.82, 0.85, 0.025, 'b', 0.11],           // the front flare
          [1.64, 0.9, 0.24, 0.79, 0.81, 0.83, 0.025, 'b', 0.11],         // its front end
          [1.74, 0.86, 0.26, 0.77, 0.79, 0.81, 0.025, 'b', 0.11],        // the nose's sides
          [1.96, 0.84, 0.3, 0.72, 0.76, 0.76, 0.02, 'b', 0.1]],          // the nose's face: the head lamps (the bumper juts out under it)
        eye: { x: -0.5, y: 1.1, style: 'closed' },
        door: [0.62, -0.5], bumpF: 0.22, bumpR: 0.05, bumpY: [0.52, 0.5],      // (the bumpers' regions end on sections: no extra cuts)
        decalX: -0.37, decalY: 1.333, decalRz: 0, decalS: 0.68,                         // (the start number on the roof ahead of the vent)
        cage: true },
      wheels: { style: 'std', spokes: 8, w: 0.235, rim: [0.86, 0.86, 0.84], cap: [0.3, 0.3, 0.32], gap: 0.06 },
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.1, 0.1, 0.11], DS = K.shade(P, 0.6);
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (between the arches: the sills)
        const vent = (x) => (x > 0.62 && x < 0.7) || (x > -0.56 && x < -0.5);                  // (the flares' tapers by the doors: an outlet, an intake)
        // ---- the shell: the paint; the windscreen, the side glass, the rear glass; dark sills, black arch ledges; the flares' inner ends black ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : at.x > XA && at.x < XB ? D : DS;
          if ((e === 1 || e === 7) && vent(at.x)) return B;
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const DC = L.decal;
        // the A- and B-pillars black, the C-pillar in paint (the quarter window ends ahead of it)
        DC.band([[-0.06, 0.86], [0.5, 0.86], [0.5, 1], [-0.06, 1]], B, null, 0.009);
        DC.band([[-0.58, 0], [-0.48, 0], [-0.48, 1], [-0.58, 1]], B, null, 0.01);
        DC.band([[-0.92, 0], [-0.76, 0], [-0.82, 1], [-0.92, 1]], P, null, 0.01);
        for (const [za, zb] of [[-0.8, -0.24], [-0.24, 0.24], [0.24, 0.8]]) DC.top([[-0.06, za], [0.05, za], [0.05, zb], [-0.06, zb]], S, 0.008);   // (a banner across the windscreen's top)
        // ---- the livery: a broad band in the stripe colour low along the side (broken by the arches); the numbers on the doors ----
        DC.side([[-1.62, 0.43], [1.72, 0.43], [1.72, 0.55], [-1.62, 0.55]], S, null, 0.006);
        for (const sd of [-1, 1]) { const f = sd < 0 ? '-z' : 'z', door = sd < 0 ? 'doorL' : 'doorR';
          K.number(0.04, 0.7, sd * 0.828, 0.24, { dir: f, w: 0.34, host: door });
          K.rect(-0.38, 0.8, sd * 0.828, 0.14, 0.025, B, { dir: f, host: door }); }   // (the handle at the door's rear edge)
        // ---- the nose: rectangular lamps in a black band right across, the bonnet's two vents ----
        K.rect(1.962, 0.64, 0, 1.62, 0.16, B);
        for (const sd of [-1, 1]) K.headLamp(1.968, 0.64, sd * 0.56, 0.06, { shape: 'rect', w: 0.36, h: 0.12, ring: [0.5, 0.51, 0.53] });
        for (const sd of [-1, 1]) DC.top([[1.12, sd * 0.08], [1.44, sd * 0.08], [1.44, sd * 0.26], [1.12, sd * 0.26]], B, 0.006, { host: 'hood' });
        // ---- the front bumper: deep, in the paint, the radiator's box showing through its middle; the splitter right across under it, its end
        //      plates up the corners, a dive plane each side (the front wing); brake ducts low in its corners, the fog lamps over them ----
        const ring = (x, y0, y1, zw, c) => [[x, y0, -zw + c], [x, y0, zw - c], [x, y0 + c, zw], [x, y1 - c, zw], [x, y1, zw - c], [x, y1, -zw + c], [x, y1 - c, -zw], [x, y0 + c, -zw]];
        K.part('bumperF', () => {
          K.skin([ring(1.7, 0.17, 0.47, 0.87, 0.04), ring(2.02, 0.15, 0.52, 0.87, 0.05), ring(2.08, 0.17, 0.5, 0.8, 0.05)], P, B, P);
          K.wingPlank(2.16, 0.12, 1.84, 0.13, 0.024, -0.86, 0.86, B); K.rect(2.081, 0.19, 0, 1.5, 0.04, B);
          K.rect(2.083, 0.335, 0, 0.88, 0.25, B);   // (the opening the radiator fills: black once the grille is gone)
          for (const sd of [-1, 1]) {
            K.endplate([[2.16, 0.12], [2.16, 0.22], [1.98, 0.46], [1.86, 0.46], [1.86, 0.12]], sd * 0.878, 0.012, B);
            K.plate([[2.04, 0.34, sd * 0.86], [1.9, 0.4, sd * 0.86], [1.93, 0.37, sd * 0.93]], 0.01, B);   // (the dive plane)
            K.rect(2.082, 0.26, sd * 0.6, 0.26, 0.1, B); K.discX(2.084, 0.41, sd * 0.62, 0.05, 8, K.lampHead, 1);
          }
        }, { hinge: [[1.9, 0.48, -0.75], [1.9, 0.48, 0.75]] });
        // ---- the radiator grille: the radiator's box behind the bumper, its mesh face through the bumper's middle ----
        K.part('grille', () => {
          K.box(2.025, 0.21, 0, 0.13, 0.25, 0.88, 0, D);
          K.grille(2.09, 0.335, 0, 0.86, 0.23, { slats: 5, col: B, slatCol: [0.24, 0.24, 0.26], frame: [0.3, 0.3, 0.32], frameH: 0.016 });
        }, { hinge: [[2.0, 0.44, -0.4], [2.0, 0.44, 0.4]] });
        // ---- the rear wing: a full-width plane high over the boot (dark: it stands out over the boot from behind), a band of the stripe colour
        //      along it, a black gurney; plates in the stripe colour at its tips, on two black pylons from the boot lid (open under it) ----
        K.part('wing', () => {
          K.wingPlank(-1.7, 1.225, -2.1, 1.265, 0.04, -0.86, 0.86, D);
          K.face([[-1.9, 1.291, 0.86], [-1.9, 1.291, -0.86], [-2.02, 1.303, -0.86], [-2.02, 1.303, 0.86]], S);   // (facing up, 6 mm over the plane)
          K.rect(-2.102, 1.315, 0, 1.72, 0.03, B, { dir: '-x' });
          for (const sd of [-1, 1]) {
            K.endplate([[-1.66, 1.17], [-1.68, 1.29], [-1.79, 1.34], [-2.14, 1.34], [-2.14, 1.17]], sd * 0.872, 0.014, S);
            K.endplate([[-1.79, 0.975], [-1.83, 1.25], [-1.97, 1.27], [-1.95, 0.975]], sd * 0.5, 0.03, B);
          }
        }, { noCrush: true, noDent: true, hinge: [[-1.8, 0.98, -0.5], [-1.8, 0.98, 0.5]] });   // (it swings back about the pylons' feet)
        // ---- the roof vent (a scoop at the roof's rear, its mouth forward), the louvres over the rear glass ----
        const sc = (x, h, w) => [[x, 1.322, -w], [x, 1.322, w], [x, 1.322 + h, w - 0.02], [x, 1.322 + h, -w + 0.02]];
        K.skin([sc(-0.93, 0.004, 0.15), sc(-0.8, 0.045, 0.19), sc(-0.71, 0.052, 0.2)], S, null, B);
        for (let i = 0; i < 4; i++) { const x0 = -1.215 + i * 0.075, x1 = x0 + 0.038;
          for (const [za, zb] of [[-0.9, -0.24], [-0.24, 0.24], [0.24, 0.9]]) DC.top([[x0, za], [x1, za], [x1, zb], [x0, zb]], B, 0.012); }
        // ---- the tail: the radiators' outlet grille right across, the lamps at its ends, the plate; the rear bumper, its tow eye; the exhaust ----
        K.grille(-2.072, 0.74, 0, 1.0, 0.16, { dir: -1, slats: 3, col: B });
        for (const sd of [-1, 1]) { K.rect(-2.071, 0.74, sd * 0.64, 0.3, 0.18, B, { dir: '-x' }); K.tailLamp(-2.073, 0.74, sd * 0.64, 0.26, 0.13); }
        K.part('bumperR', () => {
          K.skin([ring(-2.12, 0.21, 0.47, 0.8, 0.04), ring(-2.07, 0.19, 0.5, 0.87, 0.05), ring(-1.84, 0.21, 0.48, 0.87, 0.04)], P, P, B);
          K.rect(-2.122, 0.37, 0, 0.5, 0.11, [0.93, 0.93, 0.9], { dir: '-x' });
          K.box(-2.12, 0.16, 0.3, 0.06, 0.05, 0.08, 0, K.rgb(0xd8261c));
        }, { hinge: [[-2.0, 0.48, -0.75], [-2.0, 0.48, 0.75]] });
        K.exhaust(-2.15, 0.2, -0.52, 0.05, 0.3, { part: 'body', n: 6 });
        // ---- the mud flaps behind the wheels, the mirrors ----
        for (const sd of [-1, 1]) {
          for (const x of [0.8, -1.42]) K.box(x, 0.07, sd * 0.77, 0.01, 0.3, 0.24, 0, D, null, true);
          K.mirror(0.44, 0.95, sd * 0.9, { col: P, arm: B, w: 0.09, h: 0.07, d: 0.13 });
        }
        K.hinge('hood', [0.52, 0.88, -0.6], [0.52, 0.88, 0.6]);
        K.hinge('trunk', [-1.25, 0.99, -0.6], [-1.25, 0.99, 0.6]);
        K.hinge('doorL', [0.6, 0.4, -0.82], [0.6, 0.85, -0.82]); K.hinge('doorR', [0.6, 0.4, 0.82], [0.6, 0.85, 0.82]);
        // ---- inside (seen once a part is off): the bucket seats, the dashboard and the wheel, the roll cage, the extinguisher; the five ahead of
        //      the front axle, its intercooler ----
        for (const sd of [-1, 1]) K.seat(-0.42, 0.5, sd * 0.34, { w: 0.46, l: 0.48, back: 0.68, tilt: 0.18, col: [0.1, 0.1, 0.11] });
        K.box(0.34, 0.6, 0, 0.3, 0.22, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([0.13, 0.86, -0.34], [0.1, 0.88, -0.34], 0.17, [0.06, 0.06, 0.065], { n: 8, inner: true, part: 'body' });   // (the steering wheel, left-hand drive)
        const cg = [];
        for (const sd of [-1, 1]) cg.push([[-0.66, 0.26, sd * 0.7], [-0.66, 1.2, sd * 0.56]], [[0.4, 0.26, sd * 0.7], [0.4, 0.84, sd * 0.7]], [[0.4, 0.84, sd * 0.7], [-0.02, 1.2, sd * 0.56]],
          [[-0.02, 1.2, sd * 0.56], [-0.66, 1.2, sd * 0.56]], [[0.4, 0.7, sd * 0.72], [-0.66, 0.4, sd * 0.72]]);
        cg.push([[-0.66, 1.2, -0.56], [-0.66, 1.2, 0.56]], [[-0.02, 1.2, -0.56], [-0.02, 1.2, 0.56]], [[-0.66, 0.26, -0.7], [-0.66, 1.2, 0.56]]);
        K.cage(cg, 0.022, [0.78, 0.79, 0.82], { n: 4, noCrush: true, noDent: true });   // (the main hoop, the A-pillar bars, the roof rails, the door bars, a diagonal)
        K.cyl([0.12, 0.3, 0.3], [0.12, 0.3, 0.02], 0.06, K.rgb(0xc81e1e), { n: 6, inner: true, part: 'body' });   // (the fire extinguisher on the floor)
        K.engine(1.38, 0.3, 0, { l: 0.62, w: 0.4, h: 0.4 });
        K.box(1.78, 0.5, 0, 0.1, 0.22, 0.62, 0, [0.55, 0.56, 0.58], null, false, { inner: true, part: 'body' });   // (the intercooler)
      },
    },
  });
})();
