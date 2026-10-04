/* Vehicle 'blisk' — BLISK 30: a 1920s / 30s Grand Prix car, supercharged straight eight. Signature features: 1) a slim single-seat body
   on exposed wire wheels, 2) a generic oval radiator cowl, 3) a long louvred bonnet held by leather straps, 4) a pointed boat tail behind
   the driver, 5) outside exhaust pipe and a tiny aero screen. L 3.70 W 1.35 H 1.10, wheelbase 2.40, overhangs F 0.55 R 0.75 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'blisk', name: 'BLISK 30', cat: 'klasika', ord: 3, drive: 'FR',
    desc: 'Dirkalnik za veliko nagrado iz 30-ih: ovalna maska, žična kolesa in čolnast rep.',
    phys: { mass: 750, a: 1.3, b: 1.1, kI: 1, kw: 100, redline: 6000, idle: 800, gears: [2.8, 1.8, 1.3, 1], final: 4.49, rw: 0.36, cDrag: 0.6, len: 3.7, wid: 1.35, steerMax: 0.6,
      tracK: 0.9, brakeK: 0.8, spinK: 0.7, dmgK: 1.15, loose: 0.95 },
    arc: { amax: 1.48, kv: 1.8, rmin: 5 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.15, pwr: 0.1, out: 1.4, turn: 0.95, w: 1, tv: 1.15 },   // (the FR layer: lift-off and power rotation; its own out, tv, turn)
    stats: { power: 2, grip: 2, weight: 10, drift: 10 },
    price: 30000, pk: 'ta1', field: ['blisk'],
    snd: { kind: 'i8s', hz: 1, loud: 1.1 },
    expect: { t100: [3.85, 4.52], vmax: [166, 176], latG: [1.89, 1.99], d100: [27.3, 30.1] },
    partNames: { nose: 'radiator cowl', cover: 'bonnet', tail: 'boat tail' },
    parts: { set: 'none', ht: 1.1, y0: 0.22,
      extra: {
        nose: { z: 0, th: 0.5, m: 6, r: 0.4, h: 0.3, lx: 0.95, lz: 0, f: 0.45 },
        cover: { z: 0, th: 0.75, m: 8, rW: 0.3, h: 0.06, lx: 0.51, lz: 0, f: 0.53 },
        tail: { z: 1, th: 0.6, m: 7, r: 0.5, h: 0.3, lx: -0.75, lz: 0, f: 0.43 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft from the boat tail's point to the bonnet's front: the tail ('tail'),
    // the open cockpit (its sides cut down at the elbows; lined, floored, a bulkhead at each end), the scuttle with the aero screen, the
    // bonnet ('cover': its sides and top, the louvres, two leather straps); the oval radiator cowl ('nose') a skin from the bonnet's front
    // ring to an ellipse, a chrome bezel, the grille. In 'body': the driver (leather helmet and goggles, white overalls) at a wooden wheel,
    // his seat, the axles and springs bare between the body and the wheels, the exhaust out of the bonnet's right side along the body, the
    // start number in a white roundel on each side of the cockpit. Inside (seen once a part is off): the straight eight with its blower, the
    // radiator, the fuel tank in the tail, the frame rails, the gearbox, the shaft and the rear axle's differential, a firewall at each end
    // of the cockpit. No lamps (a Grand Prix car: none to light)
    look: {
      body: { len: 3.7, wid: 1.35, roofY: 1.1,
        //       x      w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-1.85, 0.028, 0.45, 0.49, 0.022, 0.51, 0.006, 'b', 0.02],     // the boat tail's point
          [-1.74, 0.11, 0.395, 0.55, 0.09, 0.595, 0.02, 'b', 0.05],
          [-1.58, 0.19, 0.35, 0.615, 0.155, 0.675, 0.035, 'b', 0.065],
          [-1.38, 0.265, 0.31, 0.675, 0.215, 0.745, 0.048, 'b', 0.075],
          [-1.15, 0.33, 0.28, 0.72, 0.27, 0.795, 0.055, 'b', 0.08],           // (over the rear axle: the taper starts here)
          [-0.95, 0.36, 0.265, 0.745, 0.295, 0.82, 0.058, 'b', 0.08],
          [-0.75, 0.365, 0.26, 0.765, 0.3, 0.83, 0.058, 'r', 0.08],           // the cockpit's rear edge (open from here to the scuttle)
          [-0.45, 0.37, 0.255, 0.705, 0.305, 0.835, 0.058, 'r', 0.08],        // (its sides cut down at the elbows)
          [-0.15, 0.37, 0.255, 0.725, 0.305, 0.835, 0.058, 'r', 0.08],
          [0.08, 0.365, 0.255, 0.765, 0.3, 0.835, 0.058, 'gf', 0.08],         // the scuttle (the aero screen on it)
          [0.4, 0.33, 0.265, 0.735, 0.27, 0.83, 0.058, 'b', 0.08],            // the bonnet's rear edge
          [0.95, 0.305, 0.28, 0.705, 0.245, 0.805, 0.062, 'b', 0.09],
          [1.52, 0.275, 0.3, 0.645, 0.21, 0.785, 0.066, 'b', 0.11]],          // its front: the radiator cowl's skin goes on from this ring
        eye: { x: -0.37, y: 0.99, near: 0.1, tilt: 0.06, style: 'open', wheel: { r: 0.2, tilt: 1.15 } },   // (in the helmet, over the aero screen)
        decalX: -1.0, decalY: 0.871, decalRz: 0.14, decalS: 0.4, decalPart: 'tail',   // (the start number on the tail's deck behind the driver)
        engine: [0.95, 0.76], crush: { x0: 0, x1: 0, z: 0 } },                // (no roof, no hoop: nothing to crush)
      wheels: { style: 'wire', w: 0.13, wR: 0.15, rim: [0.74, 0.75, 0.78], cap: [0.88, 0.89, 0.91], gap: 0.06, arch: false },
      regions: [{ part: 'tail', x: [-2.0, -0.75] }, { part: 'cover', x: [0.4, 1.6], bands: ['side', 'window', 'edge', 'crown'] }],
      build(K) {
        const P = K.paint, S = K.strp, G = K.GLASS, CH = K.chrome, TUCK = K.shade(P, 0.55), STEEL = [0.4, 0.41, 0.43], DK = [0.1, 0.1, 0.11];
        const LEATHER = [0.32, 0.17, 0.08], HELMET = [0.58, 0.4, 0.22], SUIT = [0.88, 0.86, 0.8], WHITE = [0.95, 0.95, 0.93], EXH = [0.36, 0.34, 0.32], WOOD = [0.46, 0.27, 0.12];
        const ALU = [0.62, 0.63, 0.66], GRILLE = [0.06, 0.06, 0.065], WALL = [0.44, 0.44, 0.46], SEAT = [0.34, 0.13, 0.08], SEC = K.body.secs;
        const ringOf = (q) => { const [x, w, yb, ybelt, wt, yt, cr, , tk] = q;   // (a section's ring as the loft makes it: the cowl's skin starts on it, the firewalls fill it)
          return [[x, yb, w * 0.93], [x, yb + tk, w], [x, ybelt, w], [x, yt, wt], [x, yt + cr, wt * 0.38], [x, yt + cr, -wt * 0.38], [x, yt, -wt], [x, ybelt, -w], [x, yb + tk, -w], [x, yb, -w * 0.93]]; };
        // ---- the shell: the paint; the bottom tuck darker; the cockpit open on top (its sides, lined, cut down at the elbows) ----
        const L = K.loft(K.secs(SEC), (k, e, kind) => e === 0 || e === 8 ? TUCK : kind === 'r' && e >= 2 && e <= 6 ? null : P,
          { arches: false, floor: false, caps: { front: false, rear: { col: P, low: 'tail', high: 'tail' } } });
        const D = L.decal, pr = L.prop;
        // the floor at the sill's height (the loft's own would stay with the body): the cockpit's in sight (the open top's), the engine bay's
        // and the scuttle's inside, the tail's inside and leaving with it
        for (let j = 0; j < SEC.length - 1; j++) { const a = SEC[j], b = SEC[j + 1], xm = (a[0] + b[0]) / 2, ya = a[2] + 0.03, yb = b[2] + 0.03, wa = a[1] * 0.93 - 0.02, wb = b[1] * 0.93 - 0.02;
          K.part(xm < -0.75 ? 'tail' : 'body', () => K.g.quadO([a[0], ya, -wa], [b[0], yb, -wb], [b[0], yb, wb], [a[0], ya, wa], K.lining, [xm, Math.min(ya, yb) - 1, 0]), { inner: xm < -0.75 || xm > 0.08 }); }
        // a coach line in the stripe colour along each side under the belt, from the bonnet's front to the tail (in pieces: with the bonnet,
        // the body and the tail)
        const xs = L.secs.map(q => q.x).filter(x => x > -1.72 && x < 1.5).concat([-1.72, 1.5]).sort((a, b) => a - b);
        for (let i = 0; i < xs.length - 1; i++) { const a = xs[i] + 1e-4, b = xs[i + 1] - 1e-4, ya = pr(a, 'ybelt') - 0.03, yb = pr(b, 'ybelt') - 0.03;   // (each piece inside its segment: no slivers in the next one)
          D.side([[a, ya - 0.012], [b, yb - 0.012], [b, yb], [a, ya]], S, null, 0.005);
          if (a >= -0.75 && b <= 0.08) D.side([[a, ya + 0.011], [b, yb + 0.011], [b, yb + 0.026], [a, ya + 0.026]], LEATHER, null, 0.005); }   // (the cockpit's edge trimmed in leather)
        // ---- the bonnet: its hinge along the top, louvres along both sides, two leather straps over it (a buckle on the right) ----
        D.top([[0.41, -0.008], [1.51, -0.008], [1.51, 0.008], [0.41, 0.008]], [0.72, 0.73, 0.75], 0.004);
        for (let i = 0; i < 12; i++) { const x = 0.58 + i * 0.048; D.side([[x, 0.54], [x + 0.02, 0.54], [x + 0.02, 0.652], [x, 0.652]], K.shade(P, 0.3), null, 0.004); }
        for (const xc of [0.74, 1.28]) {
          const w = pr(xc, 'w'), wt = pr(xc, 'wt'), yb = pr(xc, 'ybelt'), yt = pr(xc, 'yt'), cr = pr(xc, 'cr'), d = 0.007;
          const ring = (x) => [[x, yb - 0.06, w + d], [x, yb, w + d], [x, yt + d * 0.7, wt + d * 0.7], [x, yt + cr + d, 0.38 * wt], [x, yt + cr + d, -0.38 * wt], [x, yt + d * 0.7, -wt - d * 0.7], [x, yb, -w - d], [x, yb - 0.06, -w - d]];
          K.skin([ring(xc - 0.024), ring(xc + 0.024)], LEATHER, null, null, { part: 'cover' });
          K.rect(xc, yb - 0.03, w + d + 0.002, 0.036, 0.03, CH, { dir: 'z', part: 'cover' });
        }
        // ---- the radiator cowl: a skin from the bonnet's front ring (the loft's own points: no seam) to an ellipse leaning back a little, a
        //      chrome bezel proud of it, the grille in it (vertical slats), the filler cap on top ----
        {
          const R0 = ringOf(SEC[SEC.length - 1]), cy = 0.575, rk = 0.1;
          const ell = (x, a, b) => R0.map((p, i) => { const t = (-72 + 36 * i) * Math.PI / 180, y = cy + a * Math.sin(t); return [x - (y - cy) * rk, y, b * Math.cos(t)]; });
          const mixR = (A, B, t) => A.map((p, i) => [p[0] + (B[i][0] - p[0]) * t, p[1] + (B[i][1] - p[1]) * t, p[2] + (B[i][2] - p[2]) * t]);
          const R1 = mixR(R0.map(p => [1.655, p[1], p[2]]), ell(1.655, 0.285, 0.235), 0.62), R2 = ell(1.775, 0.272, 0.198), R3 = ell(1.8, 0.284, 0.208), R4 = ell(1.826, 0.23, 0.166);
          K.part('nose', () => {
            K.skin([R0, R1, R2, R3, R4], (k) => k < 2 ? P : CH, null, GRILLE);
            for (const z of [-0.136, -0.091, -0.045, 0, 0.045, 0.091, 0.136]) { const h = 0.23 * Math.sqrt(1 - (z / 0.166) * (z / 0.166)) - 0.022, X = (y) => 1.829 - (y - cy) * rk;
              K.face([[X(cy - h), cy - h, z + 0.007], [X(cy - h), cy - h, z - 0.007], [X(cy + h), cy + h, z - 0.007], [X(cy + h), cy + h, z + 0.007]], [0.4, 0.41, 0.43]); }
            K.cyl([1.73, 0.82, 0], [1.73, 0.872, 0], 0.03, CH, { n: 6, capA: null });
          }, { hinge: [[1.6, 0.31, -0.2], [1.6, 0.31, 0.2]] });
        }
        K.hinge('cover', [0.42, 0.88, -0.3], [0.42, 0.88, 0.3]);
        K.hinge('tail', [-0.75, 0.27, -0.35], [-0.75, 0.27, 0.35]);
        // ---- the scuttle: the tiny three-piece aero screen (one-sided, facing out: the driver sees out over and through it) in a chrome
        //      frame; the dashboard (an engine-turned panel, two dials) on the bulkhead at the cockpit's front ----
        K.part('body', () => {
          const sc = [[0.098, -0.152], [0.145, -0.1], [0.145, 0.1], [0.098, 0.152]], lo = (p) => [p[0] + 0.025, 0.886, p[1]], hi = (p) => [p[0], 0.955, p[1]];
          for (let i = 0; i < 3; i++) { const a = sc[i], b = sc[i + 1]; K.face([lo(b), lo(a), hi(a), hi(b)], G); }
          K.sweep([[0, 0.008], [-0.007, -0.004], [0.007, -0.004]], sc.map(hi).map(p => [p[0], p[1] + 0.004, p[2]]), CH);
          for (const p of [sc[0], sc[3]]) K.bar(lo(p), hi(p), 0.007, CH, { n: 3 });
          K.rect(0.076, 0.815, 0, 0.42, 0.1, [0.6, 0.6, 0.58], { dir: '-x' });
          for (const z of [-0.09, 0.09]) K.face([0, 1, 2, 3, 4, 5].map(i => [0.073, 0.815 + Math.sin(i * Math.PI / 3) * 0.034, z - Math.cos(i * Math.PI / 3) * 0.034]), [0.9, 0.88, 0.8]);
        });
        // ---- the driver: a tan leather helmet, dark goggles, white overalls, a red scarf, his hands at ten to two on the
        //      big wooden wheel in front of his chest (the cockpit's own wheel, eye.wheel, is further on: from the seat this one is under the
        //      dashboard's edge); the seat ----
        const XH = -0.45, YH = 1.0, RH = 0.112, bt = 25 * Math.PI / 180, C = [-0.18, 0.658], RW = 0.19;
        const rim = (a) => [C[0] + RW * Math.sin(a) * Math.sin(bt), C[1] + RW * Math.sin(a) * Math.cos(bt), RW * Math.cos(a)];
        K.driver(XH, YH, 0, { r: RH, helmet: HELMET, band: HELMET, suit: SUIT, glove: [0.3, 0.18, 0.1], neck: [0.62, 0.08, 0.06], lean: 0.2, hands: rim(Math.PI / 6) });
        K.part('body', () => {
          for (let i = 0; i < 8; i++) K.bar(rim(i * Math.PI / 4), rim((i + 1) * Math.PI / 4), 0.014, WOOD, { n: 3 });
          for (const a of [0, Math.PI, Math.PI * 1.5]) K.bar(C.concat([0]), rim(a), 0.008, ALU, { n: 3 });
          K.bar(C.concat([0]), [C[0] + 0.45 * Math.cos(bt), C[1] - 0.45 * Math.sin(bt), 0], 0.016, DK, { n: 4 });
        }, { noCrush: true, noDent: true });
        K.part('body', () => {
          K.box(-0.36, 0.285, 0, 0.34, 0.055, 0.4, 0, SEAT);
          K.plate([[-0.54, 0.33, -0.2], [-0.54, 0.33, 0.2], [-0.64, 0.78, 0.18], [-0.64, 0.78, -0.18]], 0.06, SEAT);
        });
        // ---- the start number in a white roundel on each side of the cockpit ----
        K.part('body', () => { for (const sd of [-1, 1]) {
          const z = sd * 0.374, ring = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => [-0.36 + Math.cos(i * Math.PI / 6) * 0.115, 0.535 + Math.sin(i * Math.PI / 6) * 0.115, z]);
          K.face(sd > 0 ? ring : ring.reverse(), WHITE);
          K.number(-0.36, 0.535, sd * 0.377, 0.13, { dir: sd > 0 ? 'z' : '-z', bg: WHITE, w: 0.17 });
        } });
        // ---- the running gear between the body and the wheels: the front beam axle, the springs under the frame, the dumb irons under the
        //      cowl, the rear axle ----
        K.part('body', () => {
          K.bar([1.3, 0.335, -0.53], [1.3, 0.335, 0.53], 0.026, [0.72, 0.73, 0.76], { n: 6 });
          K.bar([-1.1, 0.345, -0.53], [-1.1, 0.345, 0.53], 0.032, STEEL, { n: 6 });
          for (const sd of [-1, 1]) {
            K.box(1.3, 0.25, sd * 0.27, 0.78, 0.035, 0.05, 0, STEEL);
            K.bar([1.5, 0.27, sd * 0.25], [1.72, 0.3, sd * 0.23], 0.022, DK, { n: 4 });
          }
        });
        // ---- the exhaust: four pipes out of the bonnet's right side (behind the front wheel's swing), down into the big pipe along the body,
        //      past the rear wheel to a megaphone at the tail ----
        K.part('body', () => {
          const hex = [0, 1, 2, 3, 4, 5].map(i => [Math.cos((i + 0.5) * Math.PI / 3), Math.sin((i + 0.5) * Math.PI / 3)]), pen = [0, 1, 2, 3, 4].map(i => [Math.cos((i + 0.25) * Math.PI * 0.4), Math.sin((i + 0.25) * Math.PI * 0.4)]);   // (a ridge on top: no flat facet catching the light)
          for (const x of [0.86, 0.74, 0.62, 0.5]) K.sweep(pen, [[x + 0.03, 0.515, 0.18], [x + 0.01, 0.515, 0.36], [x - 0.09, 0.415, 0.425]], EXH, { scale: () => 0.023 });
          const path = [[0.83, 0.405, 0.42], [0.45, 0.395, 0.43], [0.0, 0.38, 0.435], [-0.7, 0.37, 0.44], [-1.3, 0.37, 0.44], [-1.5, 0.375, 0.4]], rad = [0.038, 0.044, 0.048, 0.048, 0.048, 0.046];
          K.sweep(hex, path, EXH, { scale: (i) => rad[i], capA: EXH });
          K.cyl([-1.5, 0.375, 0.4], [-1.68, 0.385, 0.35], 0.046, EXH, { n: 6, r2: 0.072, capA: null, capB: [0.05, 0.04, 0.035] });
          K.bar([-1.25, 0.38, 0.42], [-1.25, 0.41, 0.31], 0.01, DK, { n: 4 });
        });
        // ---- the tail: the fuel filler cap on its deck ----
        K.cyl([-1.28, 0.8, 0], [-1.28, 0.835, 0], 0.05, CH, { n: 8, capA: null, part: 'tail' });
        // ---- inside (seen once a part is off): the straight eight with its blower and cam cover, the radiator, the gearbox, the shaft, the
        //      rear axle's differential, the fuel tank across the tail, the frame rails, the firewalls (the scuttle's front, the cockpit's back) ----
        K.part('body', () => {
          const POL = [0.85, 0.86, 0.88];
          K.box(0.95, 0.31, 0, 0.94, 0.15, 0.24, 0, ALU); K.box(0.95, 0.46, 0, 0.9, 0.16, 0.22, 0, [0.3, 0.3, 0.32]);   // (the crankcase, the block)
          for (const sd of [-1, 1]) K.box(0.95, 0.62, sd * 0.055, 0.86, 0.06, 0.08, 0, POL);                             // (the twin cam covers)
          K.cyl([1.48, 0.43, -0.13], [1.24, 0.43, -0.13], 0.08, ALU, { n: 8 }); K.cyl([1.22, 0.53, -0.15], [0.56, 0.53, -0.15], 0.032, POL, { n: 6 });   // (the blower, the inlet pipe)
          K.box(1.49, 0.33, 0, 0.05, 0.46, 0.4, 0, [0.16, 0.16, 0.17]); K.box(1.49, 0.79, 0, 0.07, 0.05, 0.38, 0, POL);   // (the radiator, its top tank)
          K.box(0.3, 0.29, 0, 0.3, 0.2, 0.2, 0, ALU);
          K.cyl([0.15, 0.36, 0], [-1.0, 0.36, 0], 0.03, STEEL, { n: 6, capA: null, capB: null });
          K.box(-1.1, 0.29, 0, 0.22, 0.2, 0.26, 0, STEEL);
          K.cyl([-0.98, 0.58, -0.28], [-0.98, 0.58, 0.28], 0.19, [0.58, 0.55, 0.48], { n: 10 });
          for (const sd of [-1, 1]) K.box(0.15, 0.275, sd * 0.25, 2.7, 0.045, 0.05, 0, DK);
          K.face(ringOf(SEC[10]).reverse(), WALL); K.face(ringOf(SEC[6]).map(p => [p[0] - 0.01, p[1], p[2]]), WALL);
        }, { inner: true });
      },
    },
  });
})();
