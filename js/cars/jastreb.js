/* Vehicle 'jastreb' — JASTREB 6: a 1960s British long-bonnet GT. Signature features: 1) a very long bonnet with a power bulge down its
   middle, 2) an oval grille mouth, 3) covered headlamps in the wing tips, 4) a short fastback tail, 5) wire wheels with knock-off
   spinners. L 4.45 W 1.66 H 1.22, wheelbase 2.44, overhangs F 0.90 R 1.11 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'jastreb', name: 'JASTREB 6', cat: 'klasika', ord: 1, drive: 'FR',
    desc: 'Britanski GT iz 60-ih: dolg pokrov motorja, ovalna maska in žična platišča.',
    phys: { mass: 1250, a: 1.33, b: 1.11, kI: 1.22, kw: 200, redline: 6000, idle: 750, gears: [3, 1.9, 1.35, 1], final: 3.38, rw: 0.33, cDrag: 0.4, len: 4.45, wid: 1.66, steerMax: 0.62,
      brakeK: 0.9, spinK: 0.6 },
    arc: { amax: 1.6, kv: 1.9, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.15, pwr: 0.1, out: 1.35, turn: 0.96, w: 1, tv: 1.08 },   // (the FR layer: lift-off and power rotation; its own out, tv, turn)
    stats: { power: 5, grip: 4, weight: 7, drift: 10 },
    price: 40000, pk: 'ta1', field: ['jastreb'],
    snd: { kind: 'i6', hz: 0.95, loud: 1 },
    expect: { t100: [3.32, 3.9], vmax: [202, 214], latG: [2.04, 2.14], d100: [25, 27.6] },
    parts: { set: 'car', ht: 1.22, y0: 0.2,   // (the debris thrown from where the look has the parts: the tailgate is the fastback's glass, the wings run to the nose)
      over: { trunk: { lx: -0.5, y: 1.07 }, fenderL: { lx: 0.71, lz: -0.77, y: 0.57, h: 0.15 }, fenderR: { lx: 0.71, lz: 0.77, y: 0.57, h: 0.15 }, doorL: { lx: -0.085, lz: -0.94, y: 0.67 }, doorR: { lx: -0.085, lz: 0.94, y: 0.67 },
        mirrorL: { lx: 0.09, lz: -0.89, y: 0.94 }, mirrorR: { lx: 0.09, lz: 0.89, y: 0.94 }, quarterL: { lx: -0.575, lz: -0.84, y: 0.68, h: 0.15 }, quarterR: { lx: -0.575, lz: 0.84, y: 0.68, h: 0.15 } } },   // (the wings with their tops lie as thick as they are)
    // the look (KIT API v1, render.js; look units = metres): one loft through the sections below, cut by the regions into the bonnet's top (with
    // the power bulge), the wings to the nose (the covered lamps with them), the doors (their glass), the rear wings (the quarter lights), the
    // tailgate (the fastback's glass in its frame) and the nose and tail ends (bumpers: the mouth, the chrome blades); the windows and their
    // chrome are strips on the window band; the livery: the paint, a centre stripe in the stripe colour, the start number in white roundels
    look: {
      body: { len: 4.45, wid: 1.66, roofY: 1.22,
        // (the sections at 0.95 .. 1.71 and -1.49 .. -0.73 sit exactly where the wheel arches cut the shell: they shape the bonnet's wings and
        // the fastback over the wheels at no extra cost; the sill there 0.33, the hub's height: the arches' half length is their radius)
        //       x        w     yb    ybelt  wt    yt     cr     kind  tuck
        secs: [[-2.22, 0.5, 0.35, 0.52, 0.42, 0.57, 0.015, 'b', 0.05],    // the tail's end (the plate, the blades, the lamps over them)
          [-2.18, 0.64, 0.31, 0.58, 0.52, 0.655, 0.025, 'b', 0.08],
          [-2.08, 0.74, 0.28, 0.64, 0.56, 0.72, 0.035, 'b', 0.1],
          [-1.9, 0.8, 0.25, 0.69, 0.53, 0.795, 0.04, 'b', 0.1],
          [-1.49, 0.83, 0.21, 0.72, 0.42, 0.895, 0.045, 'gr', 0.12],     // the tailgate's glass from its foot (the rear arch's front end)
          [-1.43909, 0.83, 0.17, 0.72, 0.43, 0.918, 0.045, 'gr', 0.16],
          [-1.3, 0.83, 0.17, 0.72, 0.45, 0.97, 0.045, 'gr', 0.16],
          [-1.11, 0.83, 0.17, 0.72, 0.48, 1.045, 0.045, 'gr', 0.16],
          [-0.92, 0.83, 0.17, 0.72, 0.5, 1.115, 0.045, 'gr', 0.16],
          [-0.78091, 0.83, 0.17, 0.72, 0.515, 1.155, 0.045, 'gr', 0.16],
          [-0.73, 0.83, 0.17, 0.72, 0.52, 1.168, 0.045, 'r', 0.16],      // the roof's back edge (the rear arch's rear end)
          [-0.45, 0.83, 0.16, 0.72, 0.545, 1.172, 0.045, 'r', 0.19],
          [-0.16, 0.83, 0.16, 0.72, 0.54, 1.17, 0.042, 'gf', 0.19],      // the windscreen's top
          [0.36, 0.82, 0.16, 0.72, 0.64, 0.835, 0.04, 'b', 0.19],        // its base (the cowl; the doors' front edge)
          [0.95, 0.815, 0.17, 0.72, 0.635, 0.805, 0.04, 'b', 0.16],      // the long bonnet over the front wheel
          [1.00091, 0.815, 0.17, 0.72, 0.635, 0.803, 0.04, 'b', 0.16],
          [1.14, 0.81, 0.17, 0.72, 0.63, 0.798, 0.04, 'b', 0.16],
          [1.33, 0.805, 0.17, 0.72, 0.62, 0.79, 0.04, 'b', 0.16],
          [1.52, 0.795, 0.17, 0.71, 0.605, 0.78, 0.04, 'b', 0.16],
          [1.65909, 0.78, 0.17, 0.7, 0.59, 0.768, 0.04, 'b', 0.16],
          [1.71, 0.772, 0.19, 0.69, 0.582, 0.762, 0.04, 'b', 0.14],
          [1.88, 0.72, 0.22, 0.64, 0.54, 0.72, 0.035, 'b', 0.13],         // the wing tips (the lamps under their covers)
          [2.03, 0.62, 0.25, 0.58, 0.47, 0.66, 0.03, 'b', 0.11],
          [2.13, 0.5, 0.28, 0.51, 0.385, 0.6, 0.02, 'b', 0.09],
          [2.23, 0.35, 0.31, 0.45, 0.29, 0.535, 0.012, 'b', 0.06]],       // the oval mouth's lip
        eye: { x: -0.52, y: 1.06, near: 0.2, tilt: 0.06, style: 'closed' },   // (low in the cabin, the long bonnet ahead)
        door: [0.36, -0.62], bumpF: 0.1, bumpR: 0.04,
        crush: { x0: -1.25, x1: 0.05, z: 0.6 },
      },
      wheels: { style: 'wire', w: 0.18, rimK: 0.62, gap: 0.05 },
      // the regions: the standard ones, the wings to the nose and to the tail (the lamps go with them), the tailgate (trunk) its glass alone
      regions: (std) => std.map(r => /^fender/.test(r.part) ? Object.assign({}, r, { x: [r.x[0], 2.6] }) : /^quarter/.test(r.part) ? Object.assign({}, r, { x: [-2.6, r.x[1]] })
        : r.part === 'trunk' ? Object.assign({}, r, { x: [-1.49, -0.73], bands: ['edge', 'crown'] }) : r),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, CH = K.chrome, G = K.GLASS, D = [0.07, 0.07, 0.075], W = [0.95, 0.95, 0.93], SH = K.shade(P, 0.62), COV = [0.2, 0.23, 0.28];
        // ---- the shell: the paint; the windscreen and the tailgate's glass; the sills a darker shade, black over the arches ----
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : SH;
          if ((kind === 'gf' || kind === 'gr') && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P, low: 'bumperF', high: 'bumperF' }, rear: { col: P, cut: 0.47, low: 'bumperR', high: 'body' } } });
        const DC = L.decal, yb = (x) => L.prop(x, 'ybelt'), yt = (x) => L.prop(x, 'yt'), u = (x, y) => (y - yb(x)) / (yt(x) - yb(x));
        // ---- the side windows (GLASS on the window band, in strips cut at the loft's sections: each piece a convex quad that follows the
        //      heights): the door's glass under the raked A-pillar, the quarter light's top falling with the fastback to its point over the rear
        //      wheel; their chrome frames: the A-pillar and the roof's edge, round the quarter light, the pillar between them, the waist ----
        const XS = L.secs.map(q => q.x), run = (xa, xb) => [xa].concat(XS.filter(x => x > xa + 1e-4 && x < xb - 1e-4), [xb]);
        const strip = (xa, xb, lo, hi, col, lift) => { const X = run(xa, xb); for (let i = 0; i + 1 < X.length; i++) { const p = X[i] + 1e-4, r = X[i + 1] - 1e-4;   // (a hair inside its segment: no empty piece in the next one)
          DC.band([[p, u(p, lo(p))], [r, u(r, lo(r))], [r, u(r, Math.max(lo(r), hi(r)))], [p, u(p, Math.max(lo(p), hi(p)))]], col, null, lift); } };
        const SILL = 0.865, top = (x) => yt(x) - 0.03, QT = -1.15, q = (x) => x > -0.73 ? top(x) : top(x) - 0.76 * (x + 0.73) * (x + 0.73);   // (the quarter light's top)
        let xf = 0.36; for (let i = 0; i < 40; i++) { const m = xf - 0.003; if (top(m) > SILL) break; xf = m; }   // (the door glass's front tip: where the A-pillar meets the waist)
        const sill = () => SILL;
        strip(-0.6, xf, sill, top, G, 0.01);                                           // the door's glass
        strip(QT, -0.66, sill, q, G, 0.01);                                             // the quarter light
        strip(-0.73, 0.36, top, yt, CH, 0.012);                                          // the A-pillar, the roof's edge
        strip(QT, -0.73, q, (x) => Math.min(yt(x), q(x) + 0.025), CH, 0.012);            // over the quarter light
        strip(-0.66, -0.6, () => SILL - 0.012, top, CH, 0.012);                         // the pillar between them
        strip(QT, xf, () => SILL - 0.012, sill, CH, 0.011);                              // the waist
        // ---- the doors' shut lines, handles, start numbers in white roundels; the round chrome mirrors on the doors ----
        for (const sd of [-1, 1]) {
          const s = sd < 0 ? 'L' : 'R', f = sd < 0 ? '-z' : 'z';
          for (const x of [0.36, -0.62]) { DC.side([[x - 0.006, 0.34], [x + 0.006, 0.34], [x + 0.006, 0.725], [x - 0.006, 0.725]], D, [sd], 0.004); DC.band([[x - 0.006, 0], [x + 0.006, 0], [x + 0.006, u(x, SILL)], [x - 0.006, u(x, SILL)]], D, [sd], 0.004); }
          K.rect(-0.42, 0.68, sd * 0.833, 0.11, 0.022, CH, { dir: f, host: 'door' + s });
          K.face([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const a = sd * i * Math.PI / 5; return [-0.13 + Math.cos(a) * 0.19, 0.53 + Math.sin(a) * 0.19, sd * 0.834]; }), W, { host: 'door' + s });
          K.number(-0.13, 0.53, sd * 0.836, 0.2, { dir: f, host: 'door' + s });
          K.part('mirror' + s, () => {
            K.bar([0.2, 0.86, sd * 0.69], [0.19, 0.93, sd * 0.73], 0.012, CH, { n: 4 });
            K.cyl([0.24, 0.95, sd * 0.745], [0.17, 0.95, sd * 0.745], 0.04, CH, { n: 6, r2: 0.045, capA: CH, capB: null });
            K.discX(0.168, 0.95, sd * 0.745, 0.042, 6, [0.42, 0.47, 0.54], -1);
          });
          K.hinge('door' + s, [0.34, 0.3, sd * 0.82], [0.34, 0.8, sd * 0.8]);
        }
        // ---- the long bonnet: the power bulge down its middle, the louvres either side of it ----
        K.part('hood', () => {
          const R = [[0.38, 0.2, 0.12, 0.02], [0.95, 0.21, 0.12, 0.027], [1.6, 0.2, 0.11, 0.025], [1.95, 0.15, 0.075, 0.015], [2.12, 0.085, 0.035, 0.003]].map(([x, hb, ht, h]) => {
            const y0 = L.topY(x, 0); return [[x, y0 - 0.01, -hb], [x, y0 + h, -ht], [x, y0 + h, ht], [x, y0 - 0.01, hb]]; });
          K.skin(R, (k, e) => e === 1 ? S : P, P, P);   // (its top in the stripe colour: the centre stripe starts on it)
          for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { const x = 0.5 + i * 0.065; DC.top([[x, sd * 0.27], [x + 0.03, sd * 0.27], [x + 0.03, sd * 0.42], [x, sd * 0.42]], D, 0.006); }
        }, { hinge: [[2.1, 0.5, -0.5], [2.1, 0.5, 0.5]] });
        // ---- the nose: the oval mouth with its bar, the covered lamps in the wing tips, the chrome blades either side of the mouth ----
        K.part('bumperF', () => {
          K.face([...Array(12).keys()].map(i => { const a = -i * Math.PI / 6; return [2.233, 0.43 + Math.sin(a) * 0.092, Math.cos(a) * 0.265]; }), D);
          K.box(2.236, 0.418, 0, 0.02, 0.022, 0.53, 0, CH);
          for (const sd of [-1, 1]) K.sweep([[0, -0.022], [0.012, 0], [0, 0.022], [-0.012, 0]], [[2.238, 0.36, sd * 0.25], [2.2, 0.36, sd * 0.42], [2.12, 0.365, sd * 0.55], [2.0, 0.37, sd * 0.655]], CH, { capA: CH, capB: CH });
        }, { hinge: [[2.2, 0.3, -0.4], [2.2, 0.3, 0.4]] });
        for (const sd of [-1, 1]) {
          const s = sd < 0 ? 'L' : 'R';
          DC.band([[1.84, 0.5], [1.95, 0.14], [2.06, 0.1], [2.1, 0.5], [2.06, 0.9], [1.95, 0.86]], COV, [sd], 0.008);   // the lamp's cover: a dark glass teardrop on the wing's tip,
          K.cyl([1.99, 0.57, sd * 0.5], [2.11, 0.57, sd * 0.5], 0.068, COV, { n: 10, capA: null, capB: null });            // its round front proud of the tip (the lamp's pod)
          K.headLamp(2.112, 0.57, sd * 0.5, 0.058, { host: 'fender' + s });
          K.discX(2.138, 0.455, sd * 0.51, 0.026, 6, K.rgb(0xff9a1e), 1, { host: 'fender' + s });                         // the indicator under it
        }
        // ---- the centre stripe (the stripe colour; the paint when the car has none) along the roof and the tail's deck ----
        for (const [x0, x1] of [[-0.72, -0.17], [-2.2, -1.5]]) DC.top([[x0, -0.11], [x1, -0.11], [x1, 0.11], [x0, 0.11]], S, 0.007);
        // ---- the tail: the lamps over the blades (chrome bezels), the blades round the corners, the plate between them, the twin pipes ----
        for (const sd of [-1, 1]) { K.tailLamp(-2.226, 0.545, sd * 0.37, 0.1, 0.1, { round: true }); K.discX(-2.224, 0.545, sd * 0.37, 0.062, 8, CH, -1, { part: 'body' }); }
        K.part('bumperR', () => {
          for (const sd of [-1, 1]) K.sweep([[0, -0.022], [0.012, 0], [0, 0.022], [-0.012, 0]], [[-1.99, 0.44, sd * 0.81], [-2.17, 0.44, sd * 0.67], [-2.24, 0.44, sd * 0.42], [-2.245, 0.44, sd * 0.18]], CH, { capA: CH, capB: CH });
          K.rect(-2.228, 0.465, 0, 0.28, 0.1, [0.93, 0.93, 0.9], { dir: '-x' });
        });
        for (const sd of [-1, 1]) K.exhaust(-2.25, 0.25, sd * 0.07, 0.028, 0.3, { part: 'body' });
        // ---- the windscreen's chrome frame (its top and its base, on the glass), the cowl's three wipers ----
        for (const [x0, x1] of [[-0.158, -0.118], [0.318, 0.358]]) { const w = (x) => L.prop(x, 'wt') - 0.012, c = (x) => 0.38 * L.prop(x, 'wt');
          for (const [f0, f1] of [[(x) => -w(x), (x) => -c(x)], [(x) => -c(x), c], [c, w]]) DC.top([[x0, f0(x0)], [x1, f0(x1)], [x1, f1(x1)], [x0, f1(x0)]], CH, 0.006); }   // (three flat pieces: the top's two edges and its crown)
        for (const z of [-0.42, -0.08, 0.26]) K.bar([0.4, 0.86, z - 0.13], [0.37, 0.87, z + 0.13], 0.008, B, { n: 4, part: 'body' });
        // ---- the tailgate: its glass in a chrome frame (on the glass's edges and foot, with it) ----
        for (const sd of [-1, 1]) { const X = run(-1.49, -0.73); for (let i = 0; i + 1 < X.length; i++) { const p = X[i] + 1e-4, r = X[i + 1] - 1e-4, wt = (x) => L.prop(x, 'wt');
          DC.top([[p, sd * (wt(p) - 0.035)], [r, sd * (wt(r) - 0.035)], [r, sd * (wt(r) - 0.008)], [p, sd * (wt(p) - 0.008)]], CH, 0.006); } }
        { const x0 = -1.488, x1 = -1.455, w = (x) => L.prop(x, 'wt') - 0.01, c = (x) => 0.38 * L.prop(x, 'wt');
          for (const [f0, f1] of [[(x) => -w(x), (x) => -c(x)], [(x) => -c(x), c], [c, w]]) DC.top([[x0, f0(x0)], [x1, f0(x1)], [x1, f1(x1)], [x0, f1(x0)]], CH, 0.006); }
        K.hinge('trunk', [-1.49, 0.895, 0.42], [-0.73, 1.168, 0.52]);
        K.rect(0.3, 0.835, 0, 1.2, 0.09, D, { dir: '-x', part: 'body' });   // (the scuttle's inside under the windscreen, facing the driver: from the seat no looking into the bonnet past the dashboard)
        // ---- inside (seen once a part is off): the bucket seats, the dashboard, the long six under the bonnet ----
        for (const sd of [-1, 1]) K.seat(-0.58, 0.33, sd * 0.33, { w: 0.46, l: 0.48, back: 0.56, tilt: 0.32 });
        K.box(0.22, 0.52, 0, 0.24, 0.24, 1.3, 0, D, null, false, { inner: true, part: 'body' });                       // the dashboard,
        K.box(-0.25, 0.17, 0, 1.1, 0.2, 0.24, 0, D, null, false, { inner: true, part: 'body' });                        // the gearbox's tunnel,
        K.inner(() => K.part('body', () => {                                                                           // the wood-rimmed wheel (right-hand drive)
          const C = [-0.08, 0.76, 0.33], r = 0.19, a = 0.42, pt = (t) => [C[0] - Math.sin(a) * Math.sin(t) * r, C[1] + Math.cos(a) * Math.sin(t) * r, C[2] + Math.cos(t) * r];
          for (let i = 0; i < 6; i++) K.bar(pt(i * Math.PI / 3), pt((i + 1) * Math.PI / 3), 0.014, [0.42, 0.26, 0.13], { n: 3 });
          K.bar([C[0] + 0.32, C[1] - 0.14, C[2]], C, 0.018, [0.55, 0.56, 0.58], { n: 4 });
        }));
        K.engine(0.85, 0.28, 0, { l: 0.85, w: 0.46, h: 0.44, cover: [0.72, 0.73, 0.76] });                               // (its polished cam covers)
        K.box(1.96, 0.3, 0, 0.06, 0.28, 0.62, 0, [0.12, 0.12, 0.13], null, false, { inner: true, part: 'body' });       // the radiator behind the mouth
        for (const sd of [-1, 1]) K.box(1.33, 0.2, sd * 0.54, 0.74, 0.5, 0.04, 0, D, null, true, { inner: true, part: 'body' });   // the inner wings (no tyre in the bay)
      },
    },
  });
})();
