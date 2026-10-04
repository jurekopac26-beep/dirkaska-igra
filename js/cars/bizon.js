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
        nose: { z: 0, th: 0.55, m: 9, rW: 0.45, h: 0.1, lx: 0.7, lz: 0, f: 0.455, df: 0.3 },
        cover: { z: 1, th: 0.7, m: 10, rW: 0.45, h: 0.08, lx: -0.66, lz: 0, f: 0.59 },
        wing: { y: 1.08, lx: -0.85 },
        fenderL: { lx: 0.53, lz: -0.88, f: 0.56 },
        fenderR: { lx: 0.53, lz: 0.88, f: 0.56 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): low and wide, two lofts: the main one from the cockpit's rear bulkhead to the
    // nose (the cockpit open between its bulkheads, lined and floored, the scuttle under the screen, the wide flat nose ending in a wedge)
    // and the rear body (unlined: a few faces of the lining's colour under it); a flat deck over each axle (a loft's crown much under its
    // crests there would turn inside out) with a bulge skinned on it over each wheel: the front fenders' and, back to the tail panel, the
    // rear wings' over the fat rear tyres. Its parts: the front fenders' flanks with their bulges ('fenderL' / 'fenderR'), the nose (all
    // of it ahead of the front arches and the deck between the fenders back to the screen, the radiator's mouth in its leading edge:
    // 'nose'), the whole rear body (the engine cover, the rear wings, the tail panel with the oil cooler's mesh and the lamps: 'cover',
    // a clamshell hinged at the tail), the high wing on its two tall struts ('wing'). In 'body': the tub's flanks with the number
    // roundels, the wrap-around screen, the driver (a lean one of skins and bars) and his seat, the roll hoop with its headrest, the V8's
    // eight chrome intake stacks standing out of the cover, the megaphones and the gearbox under the tail. Inside (seen once a part is
    // off): the big-block V8 under the stacks with its headers, the rear beam the struts stand on, the drive shafts, the radiator in the
    // nose, the front wishbones. The livery: the paint; a stripe down the nose and the deck, the nose's leading edge and the wing's plank
    // in the stripe colour; white number roundels
    look: {
      body: { len: 4.2, wid: 2.05, roofY: 1.0, wz: 0.21,
        //       x      w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.1, 0.88, 0.34, 0.52, 0.8, 0.64, -0.03, 'b', 0.04],     // the tail: the rear panel (the cap: its lamps, dark under them)
          [-1.61, 1.02, 0.2, 0.69, 0.94, 0.735, -0.02, 'b', 0.06],         // the rear arch's back end (the rear wings bulge over it: their skins)
          [-1.25, 1.025, 0.14, 0.715, 0.96, 0.75, -0.025, 'b', 0.06],      // over the rear axle: the deck between the rear wings
          [-0.89, 1.02, 0.13, 0.69, 0.94, 0.735, -0.02, 'b', 0.06],        // the rear arch's front end
          [-0.4, 0.93, 0.12, 0.57, 0.56, 0.665, 0, 'r', 0.06],             // the cockpit's rear bulkhead: open from here to the scuttle
          [0.3, 0.93, 0.12, 0.58, 0.56, 0.675, 0, 'gf', 0.06],             // the cockpit's front bulkhead: the scuttle (the screen on it)
          [0.48, 0.95, 0.12, 0.62, 0.8, 0.7, -0.02, 'b', 0.06],            // the screen's foot: the front body from here
          [0.79, 0.97, 0.13, 0.68, 0.9, 0.72, -0.02, 'b', 0.06],           // the front arch's back end
          [1.15, 0.98, 0.14, 0.71, 0.92, 0.735, -0.025, 'b', 0.06],        // over the front axle: the wide flat nose (the fenders' bulges on it)
          [1.51, 0.97, 0.13, 0.665, 0.9, 0.7, -0.03, 'b', 0.06],           // the front arch's front end: the wedge from here
          [2.1, 0.8, 0.13, 0.25, 0.72, 0.31, -0.01, 'b', 0.04]],           // the nose's leading edge (the cap: the radiator's mouth)
        // (a deck between bulges, not a saddle in the loft: a crown much under the crests over a wheel arch turns the top inside out,
        // the arch lifting the sections' foot and with it the loft's inside point)
        eye: { x: -0.11, y: 0.92, near: 0.1, tilt: 0.06, style: 'open' },   // (in the helmet, over the screen)
        decalX: 1.32, decalY: 0.691, decalRz: -0.11, decalS: 0.44, decalPart: 'nose',   // (the start number on the nose, between the fenders' bulges)
        engine: [-0.98, 0.72], engRear: true, crush: { x0: 0, x1: 0, z: 0 } },   // (the V8 under the cover; an open top: no roof to crush)
      wheels: { style: 'deep', w: 0.27, wR: 0.4, gap: 0.02, spokes: 6 },
      regions: [{ part: 'fenderL', x: [0.48, 1.51], bands: ['tuck', 'side', 'window'], side: 'L' }, { part: 'fenderR', x: [0.48, 1.51], bands: ['tuck', 'side', 'window'], side: 'R' },
        { part: 'nose', x: [0.48, 2.4] }, { part: 'cover', x: [-2.4, -0.4] }],   // (the loft's panels and decals; every primitive is in an explicit part)
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, UND = K.shade(P, 0.55), D = [0.16, 0.16, 0.17], WH = [0.95, 0.95, 0.93];
        const ALU = [0.66, 0.67, 0.7], STEEL = [0.5, 0.48, 0.45], SUIT = [0.55, 0.62, 0.74], SEAT = [0.12, 0.12, 0.12], EN = [0.36, 0.37, 0.39], CAM = [0.72, 0.73, 0.76], GBX = [0.2, 0.2, 0.21];
        const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const mid = (Q) => Q.reduce((m, p) => [m[0] + p[0] / Q.length, m[1] + p[1] / Q.length, m[2] + p[2] / Q.length], [0, 0, 0]);
        const face = (Q, col, out, o) => K.face(dot(crs(sub(Q[1], Q[0]), sub(Q[2], Q[0])), sub(out, mid(Q))) >= 0 ? Q : Q.slice().reverse(), col, o);   // (a flat convex polygon facing the point out)
        const ngon = (n, f) => { const Q = []; for (let i = 0; i < n; i++) Q.push(f(i * Math.PI * 2 / n)); return Q; };
        // ---- the shell: the paint, the tuck darker; the cockpit open on top (its deck to the rim stays, a black edge on it); the caps:
        //      the radiator's mouth (black) under the nose's leading edge (the stripe colour), the bulkhead behind the seat, the tail panel
        //      dark under its lamps ----
        const shell = (k, e, kind, at) => {
          if (at.end) return at.x > 0 ? S : P;
          if (kind === 'r' && e >= 3 && e <= 5) return null;
          if (e === 0 || e === 8) return at.arch ? B : UND;
          return P;
        };
        const SEC = K.body.secs, iC = SEC.findIndex(q => q[7] === 'r');   // (the main loft from the cockpit's rear bulkhead to the nose; the rear body a loft of its own)
        const L = K.loft(SEC.slice(iC), shell, { caps: { front: { col: S, colLow: B, cut: 0.215, low: 'nose', high: 'nose' }, rear: { col: D, low: 'body', high: 'body' } } });
        // the rear body (the cover: the engine cover, the rear wings, the tail panel) unlined: under it the lining's colour only where a
        // raised cover shows it (its deck, its flanks, the tail; the inner block) — its piece on the road stays small
        const LC = K.loft(SEC.slice(0, iC + 1), shell, { lining: false, caps: { front: false, rear: { col: P, colLow: D, cut: 0.575, low: 'cover', high: 'cover' } } });
        K.part('cover', () => K.inner(() => {
          for (const [x0, x1] of [[-0.42, -1.25], [-1.25, -2.08]]) { const q = [[x0, LC.topY(x0, 0) - 0.04, -LC.prop(x0, 'wt') + 0.06], [x1, LC.topY(x1, 0) - 0.04, -LC.prop(x1, 'wt') + 0.06], [x1, LC.topY(x1, 0) - 0.04, LC.prop(x1, 'wt') - 0.06], [x0, LC.topY(x0, 0) - 0.04, LC.prop(x0, 'wt') - 0.06]];
            face(q, K.lining, [(x0 + x1) / 2, 0, 0]);
            for (const sd of [-1, 1]) face([[x0, 0.16, sd * (LC.prop(x0, 'w') - 0.03)], [x1, 0.3, sd * (LC.prop(x1, 'w') - 0.03)], [x1, LC.prop(x1, 'ybelt'), sd * (LC.prop(x1, 'w') - 0.03)], [x0, LC.prop(x0, 'ybelt'), sd * (LC.prop(x0, 'w') - 0.03)]], K.lining, [(x0 + x1) / 2, 0.4, 0]); }
          face([[-2.08, 0.36, -0.82], [-2.08, 0.36, 0.82], [-2.08, 0.6, 0.82], [-2.08, 0.6, -0.82]], K.lining, [-1, 0.48, 0]);
        }));
        const Dc = L.decal, pr = (x, k) => (x < -0.4 ? LC : L).prop(x, k), topY = (x, z) => (x < -0.4 ? LC : L).topY(x, z);
        Dc.band([[-0.3999, 0.82], [0.2999, 0.82], [0.2999, 1], [-0.3999, 1]], B, null, 0.006);   // (the cockpit's edge)
        // ---- a bulge on the deck over each wheel (a skin of four-point rings: its inner foot buried in the deck, its outer foot on the side
        //      just under the belt, h over the deck): the front ones go with the fenders, the rear wings (back to the tail panel) with the cover ----
        const bulge = (sd, zi, rings, capB) => K.skin(rings.map(([x, h]) => { const zo = pr(x, 'w') + 0.004, z1 = zi + (zo - zi) * 0.35, z2 = zi + (zo - zi) * 0.75;
          return [[x, topY(x, zi) - 0.012, sd * zi], [x, topY(x, z1) + h, sd * z1], [x, topY(x, z2) + h * 0.85, sd * z2], [x, pr(x, 'ybelt') - 0.015, sd * zo]]; }), P, null, capB || null);
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'fenderL' : 'fenderR', () => bulge(sd, 0.6, [[0.55, 0], [0.95, 0.095], [1.42, 0.095], [2.08, 0]]));
        K.part('cover', () => { for (const sd of [-1, 1]) bulge(sd, 0.58, [[-0.62, 0], [-1.05, 0.12], [-1.6, 0.13], [-2.1, 0.09]], P); });
        // the radiator's outlet on the nose's deck ahead of the screen, the brake ducts in the nose's front corners, the chin lip
        Dc.top([[0.84, -0.24], [1.06, -0.24], [1.06, 0.24], [0.84, 0.24]], B, 0.005);
        { const xs = L.secs.map(q => q.x).filter(x => x > 0.48 && x < 2.1).concat([0.48, 2.1]).sort((a, b) => a - b);   // (the stripe down the nose: a piece in each segment)
          for (let i = 0; i < xs.length - 1; i++) { const a = xs[i] + 1e-4, b = xs[i + 1] - 1e-4; if (b > 0.84 && a < 1.06) { if (a < 0.84) Dc.top([[a, -0.16], [0.8399, -0.16], [0.8399, 0.16], [a, 0.16]], S, 0.004); if (b > 1.06) Dc.top([[1.0601, -0.16], [b, -0.16], [b, 0.16], [1.0601, 0.16]], S, 0.004); continue; }
            Dc.top([[a, -0.16], [b, -0.16], [b, 0.16], [a, 0.16]], S, 0.004); }
          const xr = LC.secs.map(q => q.x).filter(x => x > -2.1 && x < -0.55).concat([-2.1, -0.55]).sort((a, b) => a - b);   // (and on along the deck behind the cockpit)
          for (let i = 0; i < xr.length - 1; i++) LC.decal.top([[xr[i] + 1e-4, -0.16], [xr[i + 1] - 1e-4, -0.16], [xr[i + 1] - 1e-4, 0.16], [xr[i] + 1e-4, 0.16]], S, 0.004); }
        K.part('nose', () => {
          for (const sd of [-1, 1]) K.rect(2.104, 0.235, sd * 0.6, 0.16, 0.04, B);
          K.box(2.07, 0.095, 0, 0.1, 0.03, 1.46, 0, B, null, true);
        }, { hinge: [[2.02, 0.14, -0.7], [2.02, 0.14, 0.7]] });
        K.hinge('cover', [-2.08, 0.63, -0.7], [-2.08, 0.63, 0.7]);   // (a clamshell hinged at the tail: its front lifts over the stacks and the hoop, clear of the wing)
        LC.decal.side([[-0.46, 0.3], [-0.86, 0.3], [-0.86, 0.5], [-0.46, 0.56]], B, null, 0.006);   // (the oil cooler's intakes in the rear wings' flanks, ahead of the wheels)
        // ---- the tub's flanks: the number in a white roundel each side; the wrap-around screen on the scuttle (one-sided panes facing
        //      out: the driver sees through them); the dash on the front bulkhead ----
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            face(ngon(10, (a) => [-0.05 + Math.cos(a) * 0.15, 0.38 + Math.sin(a) * 0.15, sd * 0.934]), WH, [-0.05, 0.38, sd * 3]);
            K.number(-0.05, 0.38, sd * 0.937, 0.16, { dir: sd < 0 ? '-z' : 'z', bg: WH, w: 0.2 });
          }
          const foot = [[0.33, 0], [0.315, 0.26], [0.25, 0.44], [0.12, 0.54], [-0.04, 0.555]].map(([x, z]) => [x, L.topY(x, z) - 0.006, z]);
          const lean = [[-0.07, 0], [-0.065, 0.02], [-0.05, 0.035], [-0.03, 0.04], [-0.01, 0.03]], hgt = [0.17, 0.165, 0.15, 0.11, 0.045];
          const top = foot.map((p, i) => [p[0] + lean[i][0], p[1] + hgt[i], p[2] + lean[i][1]]);
          for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const q = [foot[i], foot[i + 1], top[i + 1], top[i]].map(p => [p[0], p[1], sd * p[2]]), c = mid(q);
            face(q, G, [c[0] + 1, c[1] - 0.1, c[2] + sd * 0.5 * (i / 3)]); }
          K.rect(0.295, 0.57, 0, 0.56, 0.11, B, { dir: '-x' });
        });
        // ---- the driver (lean: K.driver's 240 triangles would cost the field too much with forty pieces about): a helmet of eight-point
        //      rings (white, the dark visor ahead, its crown in the stripe colour), the torso leaning back, the arms to the wheel under the
        //      screen, black gloves; his legs under the scuttle; the seat ----
        K.part('body', () => {
          const HX = -0.21, HY = 0.9, ring = (dy, r) => ngon(8, (a) => [HX + Math.cos(a + Math.PI / 8) * r, HY + dy, Math.sin(a + Math.PI / 8) * r]);
          K.skin([ring(-0.12, 0.085), ring(-0.035, 0.128), ring(0.05, 0.122), ring(0.108, 0.064)], (k, e) => k === 1 && (e === 7 || e === 0 || e === 6) ? [0.07, 0.06, 0.05] : WH, null, S);
          const tor = (x, y, w, d) => ngon(6, (a) => [x + Math.cos(a) * d, y, Math.sin(a) * w]);
          K.skin([tor(-0.06, 0.4, 0.17, 0.1), tor(-0.24, 0.775, 0.2, 0.1)], SUIT, null, SUIT);
          for (const sd of [-1, 1]) { const sh = [-0.23, 0.72, sd * 0.19], el = [-0.03, 0.57, sd * 0.24], wr = [0.12, 0.6, sd * 0.17], hd = [0.18, 0.61, sd * 0.15];
            K.bar(sh, el, 0.045, SUIT, { n: 3 }); K.bar(el, wr, 0.04, SUIT, { n: 3 }); K.bar(wr, hd, 0.042, B, { n: 3 }); }
          K.box(0.16, 0.2, 0, 0.36, 0.11, 0.3, 0, SUIT, null, true);
        }, { noCrush: true, noDent: true });
        K.part('body', () => K.plate([[-0.27, 0.22, -0.23], [-0.27, 0.22, 0.23], [-0.38, 0.72, 0.21], [-0.38, 0.72, -0.21]], 0.06, SEAT));   // (the seat's back: the driver sits on its cushion)
        // ---- the roll hoop behind the driver's head, its headrest ----
        K.part('body', () => {
          K.sweep([[0, 0.024], [-0.021, -0.012], [0.021, -0.012]], [[-0.46, 0.62, -0.3], [-0.468, 0.95, -0.25], [-0.47, 1.0, 0], [-0.468, 0.95, 0.25], [-0.46, 0.62, 0.3]], D);
          K.box(-0.425, 0.78, 0, 0.07, 0.14, 0.24, 0, B, null, true);
        }, { noCrush: true });
        // ---- the big intakes: the V8's eight stacks out of the cover behind the hoop (two rows of four, flared, dark in their mouths) ----
        K.part('body', () => { for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const x = -0.66 - 0.12 * i;
          K.cyl([x, 0.56, sd * 0.12], [x, 0.94, sd * 0.12], 0.034, K.chrome, { n: 5, r2: 0.054, capA: null, capB: B }); } });
        // ---- the high wing on its two tall struts: its plank in the stripe colour, the endplates in the paint ----
        K.part('wing', () => {
          K.wingPlank(-1.57, 1.19, -2.03, 1.26, 0.035, -0.82, 0.82, S);
          for (const sd of [-1, 1]) {
            K.endplate([[-1.52, 1.14], [-1.52, 1.25], [-2.07, 1.31], [-2.07, 1.17]], sd * 0.832, 0.012, P);
            K.bar([-1.42, 0.45, sd * 0.42], [-1.76, 1.2, sd * 0.42], 0.024, D, { n: 4 });
          }
        }, { noCrush: true, noDent: true });
        // ---- under the tail: the gearbox, the megaphones; a dark wall behind the rear axle (no seeing into the shell) ----
        K.part('body', () => {
          K.box(-1.86, 0.15, 0, 0.36, 0.18, 0.26, 0, GBX, null, true);
          for (const sd of [-1, 1]) {
            K.cyl([-1.76, 0.3, sd * 0.3], [-2.16, 0.35, sd * 0.33], 0.04, STEEL, { n: 5, r2: 0.072, capA: null, capB: [0.05, 0.04, 0.035] });
          }
          face([[-1.6, 0.12, -0.58], [-1.6, 0.12, 0.58], [-1.6, 0.36, 0.58], [-1.6, 0.36, -0.58]], D, [-3, 0.24, 0]);
        });
        // ---- the tail lamps (round, two a side, in the tail panel: they go with the cover) ----
        for (const sd of [-1, 1]) for (const z of [0.64, 0.52]) K.tailLamp(-2.1, 0.53, sd * z, 0.075, 0.075, { round: true });
        K.grille(-2.104, 0.46, 0, 0.7, 0.13, { dir: -1, slats: 3, slatCol: [0.3, 0.3, 0.32], part: 'cover' });   // (the oil cooler's mesh between them)
        // ---- inside (seen once a part is off): the big-block V8 under the stacks (the crankcase, the banks, the cam covers, the plenum the
        //      stacks stand on), its headers into the megaphones, the rear beam, the drive shafts; the radiator in the nose; the front wishbones
        //      and coil-overs ----
        K.part('body', () => K.inner(() => {
          K.box(-1.0, 0.14, 0, 0.74, 0.24, 0.4, 0, EN);
          for (const sd of [-1, 1]) { K.box(-1.0, 0.36, sd * 0.2, 0.68, 0.14, 0.2, 0, EN); K.box(-1.0, 0.5, sd * 0.24, 0.62, 0.05, 0.13, 0, CAM);
            K.sweep([[0.03, 0], [0, 0.03], [-0.03, 0], [0, -0.03]], [[-0.8, 0.38, sd * 0.32], [-1.0, 0.3, sd * 0.36], [-1.5, 0.28, sd * 0.33], [-1.78, 0.3, sd * 0.3]], STEEL); }
          K.box(-0.99, 0.47, 0, 0.6, 0.09, 0.3, 0, ALU);
          face([[-0.4, 0.14, -0.62], [-0.4, 0.14, 0.62], [-1.62, 0.14, 0.62], [-1.62, 0.14, -0.62]], K.lining, [-1, 2, 0]);   // (the engine bay's floor)
          K.bar([-1.42, 0.42, -0.62], [-1.42, 0.42, 0.62], 0.025, D, { n: 4 });   // (the rear subframe's top beam: the wing's struts stand on it)
          for (const sd of [-1, 1]) K.bar([-1.25, 0.32, sd * 0.13], [-1.25, 0.34, sd * 0.62], 0.025, D, { n: 4 });   // (the drive shafts)
          K.box(1.8, 0.15, 0, 0.07, 0.3, 0.9, 0, D); K.grille(1.84, 0.3, 0, 0.84, 0.26, { slats: 5, col: B, slatCol: [0.4, 0.4, 0.42] });
          for (const sd of [-1, 1]) { K.bar([1.3, 0.2, sd * 0.25], [1.15, 0.22, sd * 0.62], 0.015, D, { n: 3 }); K.bar([1.0, 0.2, sd * 0.25], [1.15, 0.22, sd * 0.62], 0.015, D, { n: 3 });
            K.bar([1.12, 0.24, sd * 0.58], [1.05, 0.55, sd * 0.3], 0.02, [0.8, 0.55, 0.15], { n: 4 }); }
        }));
      },
    },
  });
})();
