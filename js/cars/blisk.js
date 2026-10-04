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
        cover: { z: 0, th: 0.75, m: 8, rW: 0.3, h: 0.06, lx: 0.45, lz: 0, f: 0.82 },
        tail: { z: 1, th: 0.6, m: 7, r: 0.5, h: 0.3, lx: -0.88, lz: 0, f: 0.55 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft from the boat tail's point to the bonnet's front: the tail ('tail'),
    // the open cockpit (its sides cut down at the elbows; lined, floored, a bulkhead at each end), the scuttle with the aero screen, the
    // bonnet ('cover': its sides and top, the louvres, two leather straps); the oval radiator cowl ('nose') a skin from the bonnet's front
    // ring to an ellipse, a chrome bezel, the grille. In 'body': the driver (leather helmet, white overalls, straight arms), the seat, the
    // axles and springs bare between the body and the wheels, the exhaust out of the bonnet's right side along the body, the start number
    // in a white roundel on each side of the cockpit. Inside (seen once a part is off): the straight eight with its blower, the radiator,
    // the fuel tank in the tail, the frame rails, the gearbox and the shaft to the rear axle. No lamps (a Grand Prix car: none to light)
    look: {
      body: { len: 3.7, wid: 1.35, roofY: 1.1,
        //       x      w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-1.85, 0.03, 0.43, 0.47, 0.025, 0.49, 0.006, 'b', 0.02],     // the boat tail's point
          [-1.74, 0.115, 0.37, 0.535, 0.095, 0.58, 0.02, 'b', 0.05],
          [-1.58, 0.2, 0.32, 0.6, 0.165, 0.66, 0.035, 'b', 0.07],
          [-1.38, 0.28, 0.275, 0.665, 0.23, 0.735, 0.05, 'b', 0.08],
          [-1.15, 0.35, 0.245, 0.715, 0.285, 0.79, 0.055, 'b', 0.08],          // (over the rear axle: the taper starts here)
          [-0.95, 0.38, 0.23, 0.74, 0.31, 0.815, 0.06, 'b', 0.08],
          [-0.75, 0.385, 0.22, 0.76, 0.315, 0.825, 0.06, 'r', 0.08],          // the cockpit's rear edge (open from here to the scuttle)
          [-0.45, 0.39, 0.215, 0.7, 0.32, 0.83, 0.06, 'r', 0.08],             // (its sides cut down at the elbows)
          [-0.15, 0.39, 0.215, 0.72, 0.32, 0.83, 0.06, 'r', 0.08],
          [0.08, 0.385, 0.215, 0.76, 0.315, 0.83, 0.06, 'gf', 0.08],          // the scuttle (the aero screen on it)
          [0.4, 0.355, 0.225, 0.73, 0.29, 0.825, 0.06, 'b', 0.08],            // the bonnet's rear edge
          [0.95, 0.33, 0.245, 0.7, 0.265, 0.8, 0.065, 'b', 0.09],
          [1.52, 0.3, 0.28, 0.64, 0.23, 0.78, 0.07, 'b', 0.12]],              // its front: the radiator cowl's skin goes on from this ring
        eye: { x: -0.37, y: 0.99, near: 0.1, tilt: 0.06, style: 'open', wheel: { r: 0.2, tilt: 1.15 } },   // (in the helmet, over the aero screen)
        decalX: -1.0, decalY: 0.866, decalRz: 0.15, decalS: 0.44, decalPart: 'tail',   // (the start number on the tail's deck behind the driver)
        engine: [0.95, 0.74], crush: { x0: 0, x1: 0, z: 0 } },                // (no roof, no hoop: nothing to crush)
      wheels: { style: 'wire', w: 0.13, wR: 0.15, rim: [0.74, 0.75, 0.78], cap: [0.88, 0.89, 0.91], gap: 0.06, arch: false },
      regions: [{ part: 'tail', x: [-2.0, -0.75] }, { part: 'cover', x: [0.4, 1.6], bands: ['side', 'window', 'edge', 'crown'] }],
      build(K) {
        const P = K.paint, S = K.strp, G = K.GLASS, CH = K.chrome, TUCK = K.shade(P, 0.55), STEEL = [0.4, 0.41, 0.43], DK = [0.1, 0.1, 0.11];
        const LEATHER = [0.32, 0.17, 0.08], HELMET = [0.42, 0.26, 0.13], SUIT = [0.88, 0.86, 0.8], WHITE = [0.95, 0.95, 0.93], EXH = [0.66, 0.63, 0.58];
        const ALU = [0.62, 0.63, 0.66], GRILLE = [0.06, 0.06, 0.065], SEC = K.body.secs;
        // ---- the shell: the paint; the bottom tuck darker; the cockpit open on top (its sides, lined, cut down at the elbows) ----
        const L = K.loft(K.secs(SEC), (k, e, kind) => e === 0 || e === 8 ? TUCK : kind === 'r' && e >= 2 && e <= 6 ? null : P,
          { arches: false, caps: { front: false, rear: { col: P, low: 'tail', high: 'tail' } } });
        const D = L.decal, pr = L.prop;
        // a coach line in the stripe colour along each side under the belt, from the bonnet's front to the tail (in pieces: with the bonnet,
        // the body and the tail)
        const xs = L.secs.map(q => q.x).filter(x => x > -1.72 && x < 1.5).concat([-1.72, 1.5]).sort((a, b) => a - b);
        for (let i = 0; i < xs.length - 1; i++) { const a = xs[i], b = xs[i + 1], ya = pr(a, 'ybelt') - 0.03, yb = pr(b, 'ybelt') - 0.03;
          D.side([[a, ya - 0.012], [b, yb - 0.012], [b, yb], [a, ya]], S, null, 0.005); }
        // ---- the bonnet: louvres along both sides, two leather straps over it (a buckle on the right) ----
        for (let i = 0; i < 12; i++) { const x = 0.58 + i * 0.048; D.side([[x, 0.5], [x + 0.02, 0.5], [x + 0.02, 0.625], [x, 0.625]], K.shade(P, 0.3), null, 0.004); }
        for (const xc of [0.74, 1.28]) {
          const w = pr(xc, 'w'), wt = pr(xc, 'wt'), yb = pr(xc, 'ybelt'), yt = pr(xc, 'yt'), cr = pr(xc, 'cr'), d = 0.007;
          const ring = (x) => [[x, yb - 0.06, w + d], [x, yb, w + d], [x, yt + d * 0.7, wt + d * 0.7], [x, yt + cr + d, 0.38 * wt], [x, yt + cr + d, -0.38 * wt], [x, yt + d * 0.7, -wt - d * 0.7], [x, yb, -w - d], [x, yb - 0.06, -w - d]];
          K.skin([ring(xc - 0.024), ring(xc + 0.024)], LEATHER, null, null, { part: 'cover' });
          K.rect(xc, yb - 0.03, w + d + 0.002, 0.036, 0.03, CH, { dir: 'z', part: 'cover' });
        }
        // ---- the radiator cowl: a skin from the bonnet's front ring (the loft's own points: no seam) to an ellipse leaning back a little, a
        //      chrome bezel proud of it, the grille in it (vertical slats), the filler cap on top ----
        {
          const q = SEC[SEC.length - 1], [x0, w, yb, ybelt, wt, yt, cr, , tk] = q;
          const R0 = [[x0, yb, w * 0.93], [x0, yb + tk, w], [x0, ybelt, w], [x0, yt, wt], [x0, yt + cr, wt * 0.38], [x0, yt + cr, -wt * 0.38], [x0, yt, -wt], [x0, ybelt, -w], [x0, yb + tk, -w], [x0, yb, -w * 0.93]];
          const cy = 0.575, rk = 0.1, ell = (x, a, b) => R0.map((p, i) => { const t = (-72 + 36 * i) * Math.PI / 180, y = cy + a * Math.sin(t); return [x - (y - cy) * rk, y, b * Math.cos(t)]; });
          const mixR = (A, B, t) => A.map((p, i) => [p[0] + (B[i][0] - p[0]) * t, p[1] + (B[i][1] - p[1]) * t, p[2] + (B[i][2] - p[2]) * t]);
          const R2 = ell(1.795, 0.275, 0.208), R1 = mixR(R0.map(p => [1.67, p[1], p[2]]), ell(1.67, 0.29, 0.25), 0.62), R3 = ell(1.822, 0.287, 0.218), R4 = ell(1.85, 0.232, 0.175);
          K.part('nose', () => {
            K.skin([R0, R1, R2, R3, R4], (k) => k < 2 ? P : CH, null, GRILLE);
            for (const z of [-0.144, -0.096, -0.048, 0, 0.048, 0.096, 0.144]) { const h = 0.232 * Math.sqrt(1 - (z / 0.175) * (z / 0.175)) - 0.022, X = (y) => 1.853 - (y - cy) * rk;
              K.face([[X(cy - h), cy - h, z + 0.007], [X(cy - h), cy - h, z - 0.007], [X(cy + h), cy + h, z - 0.007], [X(cy + h), cy + h, z + 0.007]], [0.4, 0.41, 0.43]); }
            K.cyl([1.745, 0.82, 0], [1.745, 0.872, 0], 0.03, CH, { n: 6, capA: null });
          }, { hinge: [[1.6, 0.29, -0.2], [1.6, 0.29, 0.2]] });
        }
        K.hinge('cover', [0.42, 0.88, -0.3], [0.42, 0.88, 0.3]);
        K.hinge('tail', [-0.75, 0.24, -0.35], [-0.75, 0.24, 0.35]);
        // ---- the scuttle: the tiny aero screen (one-sided, facing forward: the driver sees out) in a chrome frame; the dashboard (an
        //      engine-turned panel, two dials) on the bulkhead at the cockpit's front ----
        K.part('body', () => {
          K.face([[0.168, 0.884, 0.15], [0.168, 0.884, -0.15], [0.14, 0.952, -0.142], [0.14, 0.952, 0.142]], G);
          K.bar([0.139, 0.955, -0.146], [0.139, 0.955, 0.146], 0.007, CH, { n: 4 });
          for (const sd of [-1, 1]) K.bar([0.17, 0.875, sd * 0.152], [0.139, 0.955, sd * 0.146], 0.007, CH, { n: 4 });
          K.rect(0.076, 0.815, 0, 0.42, 0.1, [0.6, 0.6, 0.58], { dir: '-x' });
          for (const z of [-0.09, 0.09]) K.face([0, 1, 2, 3, 4, 5].map(i => [0.073, 0.815 + Math.sin(i * Math.PI / 3) * 0.034, z - Math.cos(i * Math.PI / 3) * 0.034]), [0.9, 0.88, 0.8]);
        });
        // ---- the driver: a leather helmet (its goggles), white overalls, a red scarf, straight arms to the wheel under the scuttle (where the
        //      cockpit's own wheel is: eye.wheel); the seat under him ----
        K.driver(-0.45, 1.0, 0, { r: 0.112, helmet: HELMET, band: HELMET, suit: SUIT, glove: [0.3, 0.18, 0.1], neck: [0.62, 0.08, 0.06], lean: 0.2, hands: [0.186, 0.629, 0.173] });
        K.seat(-0.37, 0.29, 0, { w: 0.42, l: 0.36, back: 0.5, tilt: 0.3, col: [0.34, 0.13, 0.08] });
        // ---- the start number in a white roundel on each side of the cockpit ----
        K.part('body', () => { for (const sd of [-1, 1]) {
          const z = sd * 0.394, ring = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => [-0.36 + Math.cos(i * Math.PI / 6) * 0.115, 0.535 + Math.sin(i * Math.PI / 6) * 0.115, z]);
          K.face(sd > 0 ? ring : ring.reverse(), WHITE);
          K.number(-0.36, 0.535, sd * 0.397, 0.13, { dir: sd > 0 ? 'z' : '-z', bg: WHITE, w: 0.17 });
        } });
        // ---- the running gear between the body and the wheels: the front beam axle, the springs under the frame, the dumb irons under the
        //      cowl, the rear axle ----
        K.part('body', () => {
          K.bar([1.3, 0.335, -0.53], [1.3, 0.335, 0.53], 0.026, [0.72, 0.73, 0.76], { n: 6 });
          K.bar([-1.1, 0.345, -0.53], [-1.1, 0.345, 0.53], 0.032, STEEL, { n: 6 });
          for (const sd of [-1, 1]) {
            K.box(1.3, 0.215, sd * 0.29, 0.78, 0.035, 0.05, 0, STEEL);
            K.bar([1.5, 0.235, sd * 0.27], [1.72, 0.27, sd * 0.25], 0.022, DK, { n: 4 });
          }
        });
        // ---- the exhaust: four pipes out of the bonnet's right side (behind the front wheel's swing), down into the big pipe along the body,
        //      past the rear wheel to a megaphone at the tail ----
        K.part('body', () => {
          for (const x of [0.86, 0.74, 0.62, 0.5]) K.bar([x + 0.03, 0.47, 0.15], [x - 0.05, 0.405, 0.43], 0.022, EXH, { n: 5 });
          const hex = [0, 1, 2, 3, 4, 5].map(i => [Math.cos(i * Math.PI / 3), Math.sin(i * Math.PI / 3)]);
          const path = [[0.84, 0.4, 0.43], [0.45, 0.39, 0.44], [0.0, 0.372, 0.448], [-0.7, 0.36, 0.452], [-1.3, 0.358, 0.45], [-1.5, 0.362, 0.41]], rad = [0.036, 0.042, 0.046, 0.046, 0.046, 0.044];
          K.sweep(hex, path, EXH, { scale: (i) => rad[i], capA: EXH });
          K.cyl([-1.5, 0.362, 0.41], [-1.68, 0.37, 0.36], 0.044, EXH, { n: 6, r2: 0.07, capA: null, capB: [0.05, 0.04, 0.035] });
          K.bar([-1.25, 0.37, 0.43], [-1.25, 0.4, 0.33], 0.01, DK, { n: 4 });
        });
        // ---- the tail: the fuel filler cap on its deck ----
        K.cyl([-1.28, 0.8, 0], [-1.28, 0.835, 0], 0.05, CH, { n: 8, capA: null, part: 'tail' });
        // ---- inside (seen once a part is off): the straight eight with its blower and cam cover, the radiator, the gearbox, the shaft, the
        //      rear axle's differential, the fuel tank across the tail, the frame rails ----
        K.engine(0.95, 0.27, 0, { l: 0.95, w: 0.26, h: 0.42, col: ALU, cover: [0.78, 0.79, 0.81], inner: true });
        K.part('body', () => {
          K.cyl([1.47, 0.42, -0.12], [1.22, 0.42, -0.12], 0.075, ALU, { n: 8 });
          K.box(1.49, 0.3, 0, 0.05, 0.52, 0.42, 0, [0.16, 0.16, 0.17]);
          K.box(0.3, 0.25, 0, 0.3, 0.2, 0.2, 0, ALU);
          K.cyl([0.15, 0.32, 0], [-1.0, 0.33, 0], 0.03, STEEL, { n: 6, capA: null, capB: null });
          K.box(-1.1, 0.26, 0, 0.22, 0.2, 0.26, 0, STEEL);
          K.cyl([-0.98, 0.56, -0.3], [-0.98, 0.56, 0.3], 0.2, [0.58, 0.55, 0.48], { n: 10 });
          for (const sd of [-1, 1]) K.box(0.1, 0.235, sd * 0.28, 2.8, 0.05, 0.05, 0, DK);
        }, { inner: true });
      },
    },
  });
})();
