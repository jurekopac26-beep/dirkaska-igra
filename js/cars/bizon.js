/* Vehicle 'bizon' — BIZON 70: a 1970 big-block open sports-racer (Can-Am style). Signature features: 1) a low open body with the driver
   in a small screen, 2) a high wing on tall struts over the engine, 3) big intakes behind the roll hoop, 4) fat rear tyres under bulging
   rear wings, 5) a wide flat nose. L 4.20 W 2.05 H 1.00, wheelbase 2.40, overhangs F 0.95 R 0.85 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'bizon', name: 'BIZON 70', cat: 'dirkalni', ord: 6, drive: 'MR',
    desc: 'Odprt dirkalnik iz leta 1970 z velikim motorjem in visokim krilom na nosilcih.',
    phys: { mass: 750, a: 1.15, b: 1.25, kI: 1.15, kw: 550, redline: 7500, idle: 1000, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 3.24, rw: 0.34, cDrag: 0.55, len: 4.2, wid: 2.05, steerMax: 0.56,
      tracK: 1.3, brakeK: 1.15, spinK: 0.12, aero: 0.0001, loose: 0.66 },
    arc: { amax: 1.9, kv: 2.6, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.12, pwr: 0.07, out: 1.05, turn: 1.15, w: 0.97, tv: 0.7 },   // (the MR layer: quick turn-in, lift rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 10, grip: 10, weight: 10, drift: 4 },
    price: 90000, pk: 'unl', field: ['bizon'],
    snd: { kind: 'v8fp', hz: 0.85, loud: 1.3 },
    expect: { t100: [2.47, 2.9], vmax: [303, 322], latG: [2.62, 2.72], d100: [19.9, 22] },
    partNames: { nose: 'nose section', cover: 'engine cover' },
    parts: { set: 'none', ht: 1, y0: 0.12,
      extra: {
        nose: { z: 0, th: 0.55, m: 9, rW: 0.45, h: 0.1, lx: 0.8, lz: 0, f: 0.35, df: 0.3 },
        cover: { z: 1, th: 0.7, m: 10, rW: 0.45, h: 0.08, lx: -0.55, lz: 0, f: 0.55 },
        wing: { y: 1.25, lx: -0.85 },
        fenderL: { lx: 0.47, lz: -0.88, f: 0.6 },
        fenderR: { lx: 0.47, lz: 0.88, f: 0.6 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft from the tail to the nose, low and wide: the rear wings bulging over
    // the fat rear tyres and the front fenders over the front ones, each a crest with the deck between them lower (a saddle: the crown
    // under the crests), the cockpit open between its bulkheads (lined, floored), the scuttle under the screen. Its parts: the front
    // fenders' flanks ('fenderL' / 'fenderR', with their mirrors), the nose (everything ahead of the front arches and the deck between
    // the fenders back to the screen, the radiator's mouth in its leading edge: 'nose'), the whole rear body behind the cockpit (the
    // engine cover with the rear wings and the tail panel, its lamps: 'cover'); the high wing on its two tall struts and stays ('wing').
    // In 'body': the tub's flanks with the number roundels, the wrap-around screen, the driver, his seat and wheel, the roll hoop with its
    // headrest and brace, the V8's eight intake stacks standing out of the cover, the megaphones, the gearbox and the drive shafts under
    // the tail. Inside (seen once a part is off): the big-block V8 under the stacks, its headers, the radiator in the nose, the front
    // wishbones. The livery: the paint, the nose's leading edge and the wing in the stripe colour, white roundels
    look: {
      body: { len: 4.2, wid: 2.05, roofY: 1.0, wz: 0.21,
        //       x      w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.1, 0.88, 0.34, 0.52, 0.8, 0.64, -0.03, 'b', 0.04],     // the tail: the rear panel (the cap: its lamps, dark under them)
          [-1.62, 1.02, 0.2, 0.7, 0.94, 0.75, -0.02, 'b', 0.06],           // the rear arch's back end (the rear wings bulge over it: their skins)
          [-1.25, 1.025, 0.14, 0.72, 0.96, 0.76, -0.02, 'b', 0.06],        // over the rear axle: the deck between the rear wings
          [-0.88, 1.02, 0.13, 0.7, 0.94, 0.75, -0.02, 'b', 0.06],          // the rear arch's front end
          [-0.55, 0.96, 0.12, 0.62, 0.8, 0.71, -0.02, 'b', 0.06],          // the cover's front edge (the roll hoop on it)
          [-0.4, 0.93, 0.12, 0.57, 0.56, 0.665, 0, 'r', 0.06],             // the cockpit's rear bulkhead: open from here to the scuttle
          [0.3, 0.93, 0.12, 0.58, 0.56, 0.675, 0, 'gf', 0.06],             // the cockpit's front bulkhead: the scuttle (the screen on it)
          [0.48, 0.95, 0.12, 0.62, 0.8, 0.7, -0.02, 'b', 0.06],            // the screen's foot: the front body from here
          [0.78, 0.97, 0.13, 0.7, 0.9, 0.75, -0.02, 'b', 0.06],            // the front arch's back end
          [1.15, 0.98, 0.14, 0.73, 0.92, 0.77, -0.02, 'b', 0.06],          // over the front axle: the wide flat nose
          [1.52, 0.97, 0.13, 0.68, 0.9, 0.72, -0.03, 'b', 0.06],           // the front arch's front end
          [1.85, 0.93, 0.12, 0.48, 0.84, 0.54, -0.03, 'b', 0.05],          // the nose's slope
          [2.1, 0.8, 0.13, 0.25, 0.72, 0.31, -0.01, 'b', 0.04]],           // the nose's leading edge (the cap: the radiator's mouth)
        eye: { x: -0.11, y: 0.92, near: 0.1, tilt: 0.06, style: 'open' },   // (in the helmet, over the screen)
        decalX: 1.33, decalY: 0.563, decalRz: -0.2, decalS: 0.48, decalPart: 'nose',   // (the start number on the nose, between the fenders)
        engine: [-0.98, 0.68], engRear: true, crush: { x0: 0, x1: 0, z: 0 } },   // (the V8 under the cover; an open top: no roof to crush)
      wheels: { style: 'deep', w: 0.27, wR: 0.4, gap: 0.03, spokes: 6 },
      regions: [{ part: 'fenderL', x: [0.48, 1.52], bands: ['tuck', 'side', 'window'], side: 'L' }, { part: 'fenderR', x: [0.48, 1.52], bands: ['tuck', 'side', 'window'], side: 'R' },
        { part: 'nose', x: [0.48, 2.4] }, { part: 'cover', x: [-2.4, -0.4] }],   // (the loft's panels and decals; every primitive is in an explicit part)
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, CH = K.chrome, UND = K.shade(P, 0.55), D = [0.16, 0.16, 0.17], WH = [0.95, 0.95, 0.93];
        const ALU = [0.66, 0.67, 0.7], STEEL = [0.5, 0.48, 0.45], SUIT = [0.55, 0.62, 0.74], SEAT = [0.12, 0.12, 0.12], EN = [0.36, 0.37, 0.39], CAM = [0.72, 0.73, 0.76];
        const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const mid = (Q) => Q.reduce((m, p) => [m[0] + p[0] / Q.length, m[1] + p[1] / Q.length, m[2] + p[2] / Q.length], [0, 0, 0]);
        const face = (Q, col, out, o) => K.face(dot(crs(sub(Q[1], Q[0]), sub(Q[2], Q[0])), sub(out, mid(Q))) >= 0 ? Q : Q.slice().reverse(), col, o);   // (a flat convex polygon facing the point out)
        const ngon = (n, f) => { const L = []; for (let i = 0; i < n; i++) L.push(f(i * Math.PI * 2 / n)); return L; };
        // ---- the shell: the paint, the tuck darker; the cockpit open on top (its deck to the rim stays); the nose's leading edge in the
        //      stripe colour; the caps: the radiator's mouth (black) under the nose's front band, the tail panel dark under its lamps ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return at.x > 0 ? S : P;
          if (kind === 'r' && e >= 3 && e <= 5) return null;
          if (e === 0 || e === 8) return at.arch ? B : UND;
          if (at.x > 1.86 && e >= 2 && e <= 6) return S;
          return P;
        }, { caps: { front: { col: S, colLow: B, cut: 0.215, low: 'nose', high: 'nose' }, rear: { col: P, colLow: D, cut: 0.45, low: 'cover', high: 'cover' } } });
        const Dc = L.decal, pr = L.prop;
        // the radiator's outlet on the nose's deck ahead of the screen, the brake ducts in the nose's front corners, the chin lip
        Dc.top([[0.84, -0.24], [1.06, -0.24], [1.06, 0.24], [0.84, 0.24]], B, 0.005);
        K.part('nose', () => {
          for (const sd of [-1, 1]) K.rect(2.104, 0.235, sd * 0.6, 0.16, 0.04, B);
          K.box(2.07, 0.095, 0, 0.1, 0.03, 1.46, 0, B);
        }, { hinge: [[2.02, 0.14, -0.7], [2.02, 0.14, 0.7]] });
        K.hinge('cover', [-0.45, 0.68, -0.7], [-0.45, 0.68, 0.7]);
        // ---- the rear wings: a bulge over each fat rear tyre from the arch's front back to the tail panel (a skin on the deck, its foot
        //      buried in it, its outer flank on with the body's side; it goes with the cover) ----
        K.part('cover', () => { for (const sd of [-1, 1]) K.skin([[-0.86, 0], [-1.3, 0.12], [-1.68, 0.11], [-2.1, 0.075]].map(([x, h]) => {
          const w = pr(x, 'w'), zc = 0.57 + (w - 0.57) * 0.48;
          return [[x, L.topY(x, 0.57) - 0.012, sd * 0.57], [x, L.topY(x, 0.63) + 0.55 * h, sd * 0.63], [x, L.topY(x, zc) + h, sd * zc], [x, L.topY(x, w - 0.07) + 0.8 * h, sd * (w - 0.07)], [x, pr(x, 'ybelt') - 0.015, sd * (w + 0.004)]];
        }), P, null, P); });
        // ---- the tub's flanks: the number in a white roundel each side; the wrap-around screen on the scuttle (one-sided panes facing
        //      out: the driver sees through them); the dash on the front bulkhead ----
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            const z = sd * 0.934, ring = ngon(10, (a) => [-0.05 + Math.cos(a) * 0.15, 0.38 + Math.sin(a) * 0.15, z]);
            face(ring, WH, [-0.05, 0.38, sd * 3]);
            K.number(-0.05, 0.38, sd * 0.937, 0.16, { dir: sd < 0 ? '-z' : 'z', bg: WH, w: 0.2 });
          }
          const foot = [[0.33, 0], [0.315, 0.26], [0.25, 0.44], [0.12, 0.54], [-0.02, 0.555]].map(([x, z]) => [x, L.topY(x, z) - 0.006, z]);
          const lean = [[-0.07, 0], [-0.065, 0.02], [-0.05, 0.04], [-0.02, 0.05], [0, 0.05]], hgt = [0.19, 0.19, 0.18, 0.15, 0.1];
          const top = foot.map((p, i) => [p[0] + lean[i][0], p[1] + hgt[i], p[2] + lean[i][1]]);
          for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const q = [foot[i], foot[i + 1], top[i + 1], top[i]].map(p => [p[0], p[1], sd * p[2]]), c = mid(q);
            face(q, G, [c[0] + 1, c[1] - 0.1, c[2] + sd * 0.5 * (i / 3)]); }
          K.rect(0.295, 0.57, 0, 0.56, 0.11, B, { dir: '-x' });
          for (const z of [-0.12, 0.12]) face(ngon(6, (a) => [0.293, 0.575 + Math.sin(a) * 0.04, z + Math.cos(a) * 0.04]), WH, [-1, 0.575, z]);
        });
        // ---- the driver: white helmet (its band the stripe colour), a light blue suit, his hands on the wheel; the seat; his legs under
        //      the scuttle ----
        const C = [0.19, 0.6, 0], U = [0.33, 0.944, 0], RW = 0.15, rim = (a) => [C[0] + U[0] * RW * Math.sin(a), C[1] + U[1] * RW * Math.sin(a), RW * Math.cos(a)];
        K.driver(-0.21, 0.9, 0, { r: 0.13, lean: 0.42, helmet: WH, band: S, suit: SUIT, hands: rim(0.35) });
        K.part('body', () => {
          for (let i = 0; i < 5; i++) K.bar(rim(i * Math.PI * 0.4 + 0.3), rim((i + 1) * Math.PI * 0.4 + 0.3), 0.014, B, { n: 3 });
          K.box(0.16, 0.2, 0, 0.36, 0.11, 0.3, 0, SUIT);
        }, { noCrush: true, noDent: true });
        K.seat(-0.08, 0.26, 0, { w: 0.46, l: 0.44, back: 0.5, tilt: 0.26, col: SEAT, part: 'body' });
        // ---- the roll hoop behind the driver's head, its headrest and the brace back to the engine ----
        K.part('body', () => {
          const tri = [[0, 0.024], [-0.021, -0.012], [0.021, -0.012]];
          K.sweep(tri, [[-0.46, 0.62, -0.3], [-0.465, 0.9, -0.27], [-0.47, 1.0, -0.15], [-0.47, 1.0, 0.15], [-0.465, 0.9, 0.27], [-0.46, 0.62, 0.3]], D);
          K.box(-0.425, 0.78, 0, 0.07, 0.14, 0.24, 0, B);
          K.bar([-0.48, 0.97, 0], [-0.76, 0.68, 0], 0.017, D, { n: 4 });
        }, { noCrush: true });
        // ---- the big intakes: the V8's eight stacks out of the cover behind the hoop (two rows of four, flared, dark in their mouths) ----
        K.part('body', () => { for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const x = -0.66 - 0.12 * i;
          K.cyl([x, 0.56, sd * 0.12], [x, 0.9, sd * 0.12], 0.034, ALU, { n: 5, r2: 0.05, capA: null, capB: B }); } });
        // ---- the high wing on its tall struts and stays: its plank in the stripe colour, the endplates in the paint ----
        K.part('wing', () => {
          K.wingPlank(-1.57, 1.21, -2.03, 1.28, 0.035, -0.82, 0.82, S);
          for (const sd of [-1, 1]) {
            K.endplate([[-1.52, 1.16], [-1.52, 1.27], [-2.07, 1.35], [-2.07, 1.2]], sd * 0.832, 0.012, P);
            K.bar([-1.4, 0.45, sd * 0.42], [-1.74, 1.22, sd * 0.42], 0.022, D, { n: 4 });
            K.bar([-1.98, 0.6, sd * 0.3], [-1.92, 1.25, sd * 0.42], 0.014, D, { n: 4 });
          }
        }, { noCrush: true, noDent: true });
        // ---- under the tail: the gearbox, the drive shafts, the megaphones; a dark wall behind the rear axle (no seeing into the shell) ----
        K.part('body', () => {
          K.box(-1.88, 0.13, 0, 0.42, 0.21, 0.3, 0, ALU);
          for (const sd of [-1, 1]) {
            K.bar([-1.25, 0.32, sd * 0.13], [-1.25, 0.34, sd * 0.6], 0.025, D, { n: 4 });
            K.cyl([-1.78, 0.3, sd * 0.3], [-2.2, 0.35, sd * 0.33], 0.04, STEEL, { n: 6, r2: 0.072, capA: null, capB: [0.05, 0.04, 0.035] });
          }
          face([[-1.6, 0.12, -0.58], [-1.6, 0.12, 0.58], [-1.6, 0.36, 0.58], [-1.6, 0.36, -0.58]], D, [-3, 0.24, 0]);
        });
        // ---- the tail lamps (round, two a side, in the tail panel: they go with the cover) ----
        for (const sd of [-1, 1]) for (const z of [0.64, 0.52]) K.tailLamp(-2.1, 0.53, sd * z, 0.075, 0.075, { round: true });
        // ---- the mirrors on the front fenders' crests (they go with the fenders) ----
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'fenderL' : 'fenderR', () => { K.box(0.66, L.topY(0.66, 0.84) - 0.01, sd * 0.84, 0.05, 0.075, 0.12, 0, P); K.rect(0.634, L.topY(0.66, 0.84) + 0.03, sd * 0.84, 0.1, 0.045, [0.42, 0.47, 0.54], { dir: '-x' }); });
        // ---- inside (seen once a part is off): the big-block V8 under the stacks (the crankcase, the banks, the cam covers, the plenum the
        //      stacks stand on), its headers into the megaphones; the radiator in the nose; the front wishbones and coil-overs ----
        K.part('body', () => K.inner(() => {
          K.box(-1.0, 0.14, 0, 0.74, 0.24, 0.4, 0, EN);
          for (const sd of [-1, 1]) { K.box(-1.0, 0.36, sd * 0.2, 0.68, 0.14, 0.2, 0, EN); K.box(-1.0, 0.5, sd * 0.24, 0.62, 0.05, 0.13, 0, CAM);
            K.sweep([[0.03, 0], [0, 0.03], [-0.03, 0], [0, -0.03]], [[-0.8, 0.38, sd * 0.32], [-1.0, 0.3, sd * 0.36], [-1.5, 0.28, sd * 0.33], [-1.78, 0.3, sd * 0.3]], STEEL); }
          K.box(-0.99, 0.47, 0, 0.6, 0.09, 0.3, 0, ALU);
          K.box(1.8, 0.15, 0, 0.07, 0.3, 0.9, 0, D); K.grille(1.84, 0.3, 0, 0.84, 0.26, { slats: 5, col: B, slatCol: [0.4, 0.4, 0.42] });
          for (const sd of [-1, 1]) { K.bar([1.3, 0.2, sd * 0.25], [1.15, 0.22, sd * 0.62], 0.015, D, { n: 3 }); K.bar([1.0, 0.2, sd * 0.25], [1.15, 0.22, sd * 0.62], 0.015, D, { n: 3 });
            K.bar([1.12, 0.24, sd * 0.58], [1.05, 0.55, sd * 0.3], 0.02, [0.8, 0.55, 0.15], { n: 4 }); }
        }));
      },
    },
  });
})();
