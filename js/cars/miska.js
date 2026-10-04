/* Vehicle 'miska' — MIŠKA: a tuned 1957-75 Italian micro city car, rear engine with its lid propped open. Signature features: 1) a tiny
   round two-box body with a short bonnet and a near-vertical tail, 2) the engine lid at the rear propped open on its stays, 3) round
   headlamps in the front wings and a chrome strip down the nose, 4) small wheels pushed to the corners under flared arches, 5) a canvas
   fold-back roof panel. L 2.97 W 1.32 H 1.33, wheelbase 1.84, overhangs F 0.50 R 0.63 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'miska', name: 'MIŠKA', cat: 'mali', ord: 1, drive: 'RR',
    desc: 'Italijanski mestni malček iz 60-ih, predelan za dirke: pokrov motorja vedno priprt.',
    phys: { mass: 560, a: 0.99, b: 0.85, kI: 0.85, kw: 38, redline: 6800, idle: 900, gears: [3.4, 2.1, 1.42, 1], final: 4.18, rw: 0.26, cDrag: 0.45, len: 2.97, wid: 1.32, steerMax: 0.66,
      spinK: 0.5, sway: 1.1 },
    arc: { amax: 1.62, kv: 2, rmin: 3.6 },
    csp: { bx: 0.15, coast: -0.04, thr: 0.01, liftP: 0.16, pwr: 0.04, out: 1.25, turn: 1.1, w: 1 },   // (the RR layer: the engine behind the rear axle, a pendulum on a lift; its own turn, liftP, pwr)
    stats: { power: 1, grip: 5, weight: 10, drift: 7 },
    price: 6000, pk: 'ta1', field: ['miska'],
    snd: { kind: 'i2', hz: 1.3, loud: 0.8 },
    expect: { t100: [4.94, 5.8], vmax: [144, 153], latG: [2.05, 2.15], d100: [22.7, 25] },
    // (where the look has them: the bullet mirrors on the front wings, the engine lid propped open behind the tail)
    parts: { set: 'car', ht: 1.33, y0: 0.18, over: { mirrorL: { lx: 0.66, lz: -0.79, y: 0.84 }, mirrorR: { lx: 0.66, lz: 0.79, y: 0.84 }, trunk: { lx: -0.9, y: 0.76 } } },
    // the look (KIT API v1, render.js; look units = metres): a round bubble lofted through the sections below. The standard regions cut it
    // into the front lid (the bonnet over the luggage well), the front wings with their lamps, the (rear-hinged) doors with their glass, the
    // rear wings and the bumpers; the engine bay under the lid is open (its top panels null: lined, floored, the firewall a bulkhead) with
    // the twin in it, and the lid itself ('trunk') stands propped open on its stays over it (the trunk's region moved off the loft: the lid
    // alone). The canvas roof, the rear window and the stripes are decals laid on the loft; the start number on the front lid, roundels on
    // the doors
    look: {
      body: { len: 2.97, wid: 1.32, roofY: 1.33, wz: 0.07,
        //       x       w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-1.48, 0.49, 0.26, 0.54, 0.42, 0.58, 0.012, 'b', 0.07],      // the tail: its face (the lamps), the bumper
          [-1.43, 0.565, 0.235, 0.58, 0.37, 0.6, 0.015, 'b', 0.08],         // the engine bay's lower edge (the lid's, closed)
          [-1.33, 0.615, 0.215, 0.66, 0.36, 0.72, 0.02, 'b', 0.09],         // the lid's bend (the louvres over it)
          [-1.157, 0.64, 0.205, 0.77, 0.35, 0.9, 0.025, 'b', 0.1],          // the lid's hinge (the rear arch's end)
          [-1.004, 0.645, 0.2, 0.8, 0.44, 1.03, 0.04, 'gr', 0.1],           // the rear window's foot
          [-0.584, 0.645, 0.2, 0.81, 0.5, 1.16, 0.1, 'r', 0.1],             // the roof's back edge (the rear arch's front end)
          [-0.36, 0.645, 0.2, 0.81, 0.51, 1.19, 0.14, 'r', 0.1],            // the roof's crest (the doors' back edge)
          [0.27, 0.645, 0.2, 0.8, 0.5, 1.15, 0.11, 'gf', 0.1],              // the windscreen's top
          [0.62, 0.64, 0.2, 0.77, 0.57, 0.82, 0.05, 'b', 0.1],              // its base (the cowl; the doors' front edge)
          [1.1435, 0.64, 0.205, 0.74, 0.55, 0.78, 0.055, 'b', 0.1],         // the front lid's dome (on the front arch's cut)
          [1.2967, 0.625, 0.215, 0.72, 0.52, 0.755, 0.05, 'b', 0.09],       // (the front arch's end)
          [1.43, 0.585, 0.23, 0.69, 0.46, 0.72, 0.04, 'b', 0.08],           // the wings' round ends (the bumper's depth)
          [1.49, 0.5, 0.25, 0.66, 0.37, 0.685, 0.025, 'b', 0.07]],          // the nose: the lamps' face, the lid's lip over it
        eye: { x: -0.3, y: 1.08, style: 'closed' },
        decalX: 0.92, decalY: 0.851, decalRz: -0.067, decalS: 0.47, decalPart: 'hood',   // (the start number on the front lid, as the old racers had it)
        door: [0.62, -0.36], bumpY: [0.37, 0.37], bumpR: 0.05, engine: [-1.29, 0.7], engRear: true },
      wheels: { style: 'deep', spokes: 8, w: 0.15, gap: 0.05, rim: [0.78, 0.79, 0.82], cap: [0.3, 0.3, 0.32] },
      // (the standard regions, the boot's moved off the loft: the propped lid is drawn whole in 'trunk'; the bay under it stays the body's)
      regions: (std) => std.map(r => r.part === 'trunk' ? Object.assign({}, r, { x: [-2.4, -1.9] }) : r),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, CH = K.chrome, G = K.GLASS, WH = [0.95, 0.95, 0.93], SH = K.shade(P, 0.42);
        const CV = [0.15, 0.145, 0.14], SEAM = [0.3, 0.29, 0.27], AL = [0.6, 0.61, 0.63], EB = [0.16, 0.16, 0.17];
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (the sills between the arches)
        // the shell: the paint; the glass (the windscreen with the vent windows, the side windows, the rear window's middle); the canvas
        // the roof's crown; the engine bay's top open under the lid (e 3..5 null); the sills dark, the arches' ledges black
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : at.x > XA && at.x < XB ? K.shade(P, 0.5) : K.shade(P, 0.62);
          if (k >= 1 && k <= 2 && e >= 3 && e <= 5) return null;                               // (the engine bay, open under the lid)
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'r' && e === 4) return CV;                                               // (the canvas: the crown, the edges' strips below)
          if (kind === 'gr' && e === 4) return G;                                               // (the rear window: the crown, its sides below)
          return P;
        }, { glass: (k, e, kind) => kind === 'gr' && (e === 3 || e === 5), caps: { front: { col: P }, rear: { col: P } } });
        const D = L.decal, top = (x, z) => L.topY(x, z);
        // ---- the greenhouse: the rear window's sides (glass on the painted edges, marked), the pillars, the window's chrome sill ----
        for (const sd of [-1, 1]) D.top([[-1.0, sd * 0.16], [-0.59, sd * 0.18], [-0.59, sd * 0.31], [-1.0, sd * 0.26]], G, 0.006);
        D.band([[-0.39, 0], [-0.345, 0], [-0.345, 1], [-0.39, 1]], P, null, 0.008);            // the B-pillar (the door's back edge)
        D.band([[-0.6, 0], [0.61, 0], [0.61, 0.045], [-0.6, 0.045]], CH, null, 0.006);           // the window's chrome sill line
        D.band([[-0.6, 0.93], [0.27, 0.93], [0.27, 1], [-0.6, 1]], P, null, 0.007);           // under the roof's edge (the drip rail)
        for (const sd of [-1, 1]) K.bar([0.615, 0.82, sd * 0.572], [0.268, 1.155, sd * 0.502], 0.022, P, { n: 4, part: 'body' });   // the A-pillars
        // the doors' shut lines (front and back edges, down the flat side)
        for (const x of [0.618, -0.36]) D.side([[x - 0.006, 0.31], [x + 0.006, 0.31], [x + 0.006, 0.9], [x - 0.006, 0.9]], SH, null, 0.004);
        // ---- the canvas roof: the crown and the edges' strips (the painted rails either side), its bows, the folded canvas at the back ----
        for (const sd of [-1, 1]) D.top([[-0.584, sd * 0.185], [0.255, sd * 0.185], [0.255, sd * 0.37], [-0.584, sd * 0.37]], CV, 0.006);
        for (const x of [-0.3, -0.06, 0.16]) D.top([[x - 0.015, -0.18], [x + 0.015, -0.18], [x + 0.015, 0.18], [x - 0.015, 0.18]], SEAM, 0.006);
        for (const sd of [-1, 1]) K.cyl([-0.56, top(-0.56, 0) + 0.022, 0], [-0.56, top(-0.56, 0.37) + 0.02, sd * 0.37], 0.03, CV, { n: 6, capA: null, part: 'body' });
        // ---- the front: the lid's chrome strip down the nose (along the crown, on down the face), the lamps in the wings' round ends ----
        { const xs = [0.66, 1.1435, 1.2967, 1.43, 1.49];
          for (let i = 0; i < 4; i++) { const x0 = xs[i], x1 = xs[i + 1], y0 = top(x0, 0) + 0.005, y1 = top(x1, 0) + 0.005;
            K.face([[x0, y0, -0.014], [x0, y0, 0.014], [x1, y1, 0.014], [x1, y1, -0.014]], CH); } }
        K.rect(1.493, 0.545, 0, 0.028, 0.33, CH);
        for (const sd of [-1, 1]) {
          const f = sd < 0 ? 'fenderL' : 'fenderR', z = sd * 0.41;
          K.cyl([1.44, 0.6, z], [1.52, 0.6, z], 0.085, P, { n: 8, part: f, capA: null, capB: CH });   // the lamp's nacelle out of the wing, its chrome bezel
          K.headLamp(1.524, 0.6, z, 0.066, { host: f, ring: null, n: 8 });
          K.rect(1.493, 0.47, sd * 0.43, 0.075, 0.035, K.rgb(0xff9a1e), { host: f });         // the indicator under it
        }
        for (const z of [-0.3, 0.12]) K.bar([0.66, 0.876, z - 0.2], [0.63, 0.886, z + 0.2], 0.009, B, { n: 4, part: 'body' });   // the wipers
        // ---- the bullet mirrors on the front wings (mirrorL / mirrorR) on their stalks ----
        for (const sd of [-1, 1]) { const m = sd < 0 ? 'mirrorL' : 'mirrorR', y0 = top(0.99, 0.52);
          K.mirror(0.98, y0 + 0.075, sd * 0.52, { w: 0.06, h: 0.055, d: 0.09, col: CH, z0: sd * 0.52 });
          K.bar([0.99, y0 - 0.01, sd * 0.52], [0.985, y0 + 0.055, sd * 0.52], 0.01, CH, { n: 4, part: m }); }
        // ---- the flares over the wheels pushed to the corners (paint, riveted on) ----
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.31, 0.37, sd * 0.6, sd * 0.685, P, { n: 5 });
        // ---- the livery: a stripe along the sills, a roundel with the number on each (rear-hinged) door, its handle at the front edge ----
        D.side([[XA + 0.03, 0.32], [XB - 0.03, 0.32], [XB - 0.03, 0.385], [XA + 0.03, 0.385]], S, null, 0.006);
        for (const sd of [-1, 1]) {
          const d = sd < 0 ? 'doorL' : 'doorR', dir = sd < 0 ? '-z' : 'z', z = sd * 0.651, ring = [];
          for (let i = 0; i < 12; i++) { const a = (sd > 0 ? i : -i) * Math.PI / 6; ring.push([0.1 + Math.cos(a) * 0.165, 0.6 + Math.sin(a) * 0.165, z]); }
          K.face(ring, WH, { host: d });
          K.number(0.1, 0.6, sd * 0.654, 0.19, { dir, w: 0.24, bg: WH, host: d });
          K.rect(0.5, 0.75, sd * 0.652, 0.1, 0.022, CH, { dir, host: d });
          K.hinge(d, [-0.36, 0.3, sd * 0.645], [-0.36, 0.84, sd * 0.645]);                    // (suicide doors: hinged at the B-pillar)
        }
        // ---- the bumpers: thin chrome blades, two overriders each ----
        for (const [part, x, s] of [['bumperF', 1.505, 1], ['bumperR', -1.5, -1]]) K.part(part, () => {
          K.box(x, 0.3, 0, 0.04, 0.06, 1.0, 0, CH);
          for (const sd of [-1, 1]) K.box(x + s * 0.008, 0.25, sd * 0.25, 0.045, 0.16, 0.05, 0, CH);
        });
        // ---- the tail: the lamps either side of its face (chrome rims), the exhaust's tip ----
        for (const sd of [-1, 1]) { K.rect(-1.482, 0.47, sd * 0.45, 0.09, 0.17, CH, { dir: '-x', part: sd < 0 ? 'quarterL' : 'quarterR' }); K.tailLamp(-1.484, 0.47, sd * 0.45, 0.07, 0.14); }
        K.exhaust(-1.545, 0.2, -0.16, 0.042, 0.2, { n: 8, part: 'body' });
        // ---- the engine lid ('trunk'): hinged under the rear window, propped open by 26 degrees on two stays; louvres in its upper half ----
        const H = [-1.157, 0.925], th = -26 * Math.PI / 180, ct = Math.cos(th), st = Math.sin(th);
        const rot = (p) => { const dx = p[0] - H[0], dy = p[1] - H[1]; return [H[0] + dx * ct - dy * st, H[1] + dx * st + dy * ct, p[2]]; };
        const lidC = [[-1.157, 0.928], [-1.33, 0.743], [-1.435, 0.618]], LW = [0.3, 0.34, 0.355], T = 0.03;   // (the closed lid's crest line, its half widths)
        const nrm = (i) => { const a = lidC[Math.max(0, i - 1)], b = lidC[Math.min(2, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dy / l, -dx / l]; };   // (outward: up and back)
        const ringAt = (i) => { const c = lidC[i], n = nrm(i), w = LW[i]; return [[c[0], c[1], -w], [c[0], c[1], w], [c[0] - n[0] * T, c[1] - n[1] * T, w * 0.98], [c[0] - n[0] * T, c[1] - n[1] * T, -w * 0.98]].map(rot); };
        K.part('trunk', () => {
          K.skin([0, 1, 2].map(ringAt), (k, e) => e === 2 ? K.shade(P, 0.7) : P, P, P);
          // the louvres: dark slots across the upper half (on its outer face, facing up and back)
          const n = nrm(0), a = lidC[0], b = lidC[1], N = [n[0] * ct - n[1] * st, n[0] * st + n[1] * ct], on = (t, z) => rot([a[0] + (b[0] - a[0]) * t + n[0] * 0.003, a[1] + (b[1] - a[1]) * t + n[1] * 0.003, z]);
          for (let i = 0; i < 5; i++) { const t0 = 0.14 + i * 0.16, t1 = t0 + 0.08, pts = [on(t0, -0.22), on(t0, 0.22), on(t1, 0.22), on(t1, -0.22)];
            const u = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1], pts[1][2] - pts[0][2]], v = [pts[2][0] - pts[0][0], pts[2][1] - pts[0][1], pts[2][2] - pts[0][2]];
            K.face((u[1] * v[2] - u[2] * v[1]) * N[0] + (u[2] * v[0] - u[0] * v[2]) * N[1] >= 0 ? pts : pts.reverse(), B); }
          // the stays: from the lid's lower corners down to the bay's edge
          for (const sd of [-1, 1]) { const q = rot([lidC[2][0] + 0.03, lidC[2][1] + 0.01, sd * 0.3]); K.bar(q, [-1.425, 0.61, sd * 0.31], 0.01, CH, { n: 4 }); }
        }, { hinge: [[H[0], H[1], -0.3], [H[0], H[1], 0.3]] });
        // ---- the twin in the open bay (the outer shell: in sight under the lid): its block, the cooling shroud, the air filter ----
        K.part('body', () => {
          K.box(-1.29, 0.26, 0, 0.2, 0.22, 0.5, 0, AL, null, true);                           // the crankcase, the finned sump
          K.box(-1.29, 0.48, 0.02, 0.2, 0.16, 0.44, 0, EB, null, true);                       // the cooling shroud over the cylinders
          K.cyl([-1.29, 0.64, -0.1], [-1.29, 0.7, -0.1], 0.1, CH, { n: 8, capA: null });       // the air filter, chrome
        });
        // ---- hinges: the front lid at the cowl ----
        K.hinge('hood', [0.63, 0.87, -0.45], [0.63, 0.87, 0.45]);
        // ---- inside (seen once a part is off): the seats, the roll hoop behind them, the painted dash, the luggage well (the spare lying
        //      in it, the fuel tank) ----
        for (const sd of [-1, 1]) K.seat(-0.22, 0.46, sd * 0.28, { w: 0.42, l: 0.42, back: 0.58 });
        K.seat(-0.78, 0.44, 0, { w: 0.92, l: 0.34, back: 0.42 });
        K.cage([[[-0.5, 0.3, -0.52], [-0.5, 1.1, -0.44]], [[-0.5, 1.1, -0.44], [-0.5, 1.1, 0.44]], [[-0.5, 1.1, 0.44], [-0.5, 0.3, 0.52]], [[-0.5, 1.08, -0.4], [-0.95, 0.62, -0.42]], [[-0.5, 1.08, 0.4], [-0.95, 0.62, 0.42]]], 0.022, [0.85, 0.86, 0.88]);
        K.box(0.5, 0.66, 0, 0.12, 0.12, 1.1, 0, P, null, false, { inner: true, part: 'body' });
        K.tyre(1.12, 0.36, -0.12, { axis: 'y', inner: true, part: 'body' });
        K.box(1.0, 0.3, 0.33, 0.3, 0.32, 0.22, 0, [0.42, 0.43, 0.45], null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
