/* Vehicle 'strelica' — STRELICA 61: an early-1960s cigar-shaped Formula car, mid-engined. Signature features: 1) a slim cigar body with
   an oval nose intake, 2) exposed wheels on wishbones, 3) exhaust stacks curling up behind the engine, 4) a wrap-around aero screen and
   the driver in view, 5) small mirrors on the cockpit sides. L 3.60 W 1.50 H 0.95, wheelbase 2.30, overhangs F 0.55 R 0.75 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'strelica', name: 'STRELICA 61', cat: 'dirkalni', ord: 4, drive: 'MR',
    desc: 'Cigarast dirkalnik formule iz zgodnjih 60-ih: odprta kolesa in izpušne cevi.',
    phys: { mass: 460, a: 1.25, b: 1.05, kI: 0.95, kw: 140, redline: 8500, idle: 1500, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 4.98, rw: 0.33, cDrag: 0.62, len: 3.6, wid: 1.5, steerMax: 0.52,
      tracK: 1.1, brakeK: 1.05, spinK: 0.3, loose: 0.85, dmgK: 1.2 },
    arc: { amax: 1.62, kv: 2.4, rmin: 5 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.16, pwr: 0.07, out: 1.05, turn: 1.15, w: 1.02, tv: 0.85 },   // (the MR layer: quick turn-in, lift rotation; its own liftP, pwr, out, turn, tv)
    stats: { power: 4, grip: 5, weight: 10, drift: 8 },
    price: 70000, pk: 'ta1', field: ['strelica'],
    snd: { kind: 'v8hi', hz: 1.4, loud: 1.2 },
    expect: { t100: [3.03, 3.55], vmax: [217, 230], latG: [2.07, 2.17], d100: [21.4, 23.7] },
    partNames: { nose: 'nose cone', cover: 'engine cover' },
    parts: { set: 'none', ht: 0.95, y0: 0.12,
      extra: {
        nose: { z: 0, th: 0.5, m: 5, r: 0.35, h: 0.25, lx: 0.92, lz: 0, f: 0.35 },
        cover: { z: 1, th: 0.7, m: 6, rW: 0.3, h: 0.06, lx: -0.6, lz: 0, f: 0.5 },
        mirrorL: { lx: 0.19, lz: -0.47, f: 0.52 },
        mirrorR: { lx: 0.19, lz: 0.47, f: 0.52 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): a section loft for the cigar, open over the cockpit (lined, floored, its
    // bulkheads), its upper panels behind the cockpit the engine cover ('cover'); the nose cone a skin of its own over the front bulkhead
    // (the radiator) with the oval intake recessed into it ('nose'); the driver reclined under the wrap-around screen, the roll hoop behind
    // his head; the wishbones, coil-overs and drive shafts out to the wire wheels; four exhaust pipes a side out of the engine bay, along
    // the tail and curling up behind it; small chrome mirrors on stalks ('mirrorL' / 'mirrorR'). The livery: the paint, a stripe along
    // the top from the nose to the tail and round the intake (the stripe colour), white number roundels on the flanks and the start number
    // on the engine cover
    look: {
      body: {
        //       x      w      yb    ybelt  wt     yt     cr     kind  tuck
        secs: [[-1.79, 0.06, 0.27, 0.32, 0.048, 0.365, 0.022, 'b', 0.03],   // the tail's tip
          [-1.6, 0.155, 0.2, 0.35, 0.12, 0.44, 0.05, 'b', 0.05],
          [-1.36, 0.235, 0.15, 0.38, 0.18, 0.51, 0.07, 'b', 0.07],
          [-1.0, 0.29, 0.12, 0.395, 0.222, 0.55, 0.082, 'b', 0.08],          // over the rear axle
          [-0.62, 0.322, 0.11, 0.4, 0.243, 0.57, 0.088, 'b', 0.08],
          [-0.34, 0.335, 0.1, 0.4, 0.252, 0.575, 0.09, 'r', 0.08],           // the cockpit's rear edge (the engine cover's front): open to the scuttle
          [0.02, 0.345, 0.1, 0.4, 0.262, 0.57, 0.09, 'r', 0.08],
          [0.4, 0.336, 0.1, 0.4, 0.252, 0.575, 0.09, 'gf', 0.08],            // the cockpit's front edge: the scuttle, the screen on it
          [0.8, 0.31, 0.1, 0.38, 0.23, 0.535, 0.08, 'b', 0.08],
          [1.22, 0.265, 0.12, 0.345, 0.195, 0.475, 0.07, 'b', 0.07]],         // the front bulkhead (the radiator): the nose cone over it
        wz: 0.09,
        eye: { x: -0.11, y: 0.8, near: 0.12, tilt: 0.06, style: 'open' },    // (in the helmet, over the screen: a round wheel and dials)
        decalX: -0.7, decalY: 0.652, decalRz: 0.068, decalS: 0.24, decalPart: 'cover',   // (the start number on the engine cover's crown)
        engine: [-0.72, 0.52], engRear: true, crush: { x0: 0, x1: 0, z: 0 },                       // (no roof: a crushed roof bends nothing; the hoop stands)
      },
      wheels: { style: 'wire', w: 0.135, wR: 0.175, rimK: 0.62, arch: false },
      regions: [{ part: 'cover', x: [-2, -0.34], bands: ['window', 'edge', 'crown'] }],   // (the loft's panels only: every primitive is in an explicit part)
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, CH = K.chrome, UND = K.shade(P, 0.55), WH = [0.95, 0.95, 0.93];
        const STEEL = [0.8, 0.77, 0.71], HOLE = K.black, ARM = [0.6, 0.61, 0.64], SHAFT = [0.3, 0.3, 0.32], SPRING = [0.86, 0.6, 0.16], WOOD = [0.45, 0.27, 0.13];
        const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const mid = (Q) => Q.reduce((m, p) => [m[0] + p[0] / Q.length, m[1] + p[1] / Q.length, m[2] + p[2] / Q.length], [0, 0, 0]);
        const face = (Q, col, out) => K.face(dot(crs(sub(Q[1], Q[0]), sub(Q[2], Q[0])), sub(out, mid(Q))) >= 0 ? Q : Q.slice().reverse(), col);   // (a flat convex polygon facing the point out)
        const dia = (r) => [[r, 0], [0, r], [-r, 0], [0, -r]];
        // ---- the cigar: the paint, the stripe along its crown, the chamfers under it darker; open on top over the cockpit ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => at.end ? P : kind === 'r' && e >= 3 && e <= 5 ? null : e === 0 || e === 8 ? UND : e === 4 ? S : P,
          { caps: { front: false, rear: { col: [0.12, 0.12, 0.13], cut: 0.32, low: 'body', high: 'cover' } } });
        // ---- the nose cone: a skin from the cigar's section (5 mm over it) to the oval mouth, the stripe along its top and round the mouth;
        //      the intake recessed into it (its wall facing in, dark), the grille at the back ----
        const s0 = {}; for (const k of ['w', 'yb', 'tk', 'ybelt', 'wt', 'yt', 'cr']) s0[k] = L.prop(1.19, k);
        const e5 = 0.005, top0 = s0.yt + s0.cr, cy0 = (s0.yb + top0) / 2, hh0 = (top0 - s0.yb) / 2 + e5, hw0 = s0.w + e5;
        const shape = [[0.93 * s0.w + e5, s0.yb - e5], [s0.w + e5, s0.yb + s0.tk], [s0.w + e5, s0.ybelt], [s0.wt + e5, s0.yt + e5 / 2], [0.38 * s0.wt, top0 + e5]].map(([z, y]) => [z / hw0, (y - cy0) / hh0]);
        const TH = [-72, -36, 0, 36, 72].map(a => a * Math.PI / 180);   // (the mouth: a ten-sided oval)
        const ring = (x, cy, hh, hw, t) => { const R = shape.map(([u, v], i) => [x, cy + hh * (v + (Math.sin(TH[i]) - v) * t), hw * (u + (Math.cos(TH[i]) - u) * t)]);
          return R.concat(R.slice().reverse().map(p => [p[0], p[1], -p[2]])); };
        const MY = 0.3325, NR = [ring(1.19, cy0, hh0, hw0, 0), ring(1.38, 0.3275, 0.1975, 0.245, 0.4), ring(1.56, 0.33, 0.16, 0.198, 0.75), ring(1.765, MY, 0.1125, 0.142, 1), ring(1.8, MY, 0.1045, 0.134, 1)];
        K.part('nose', () => {
          K.skin(NR, (k, e) => k === 3 || e === 4 ? S : e === 9 ? K.shade(P, 0.45) : e === 0 || e === 8 ? UND : P);
          const lip = NR[4], back = lip.map(p => [1.72, MY + (p[1] - MY) * 0.8, p[2] * 0.8]), ax = [1.76, MY, 0];
          for (let e = 0; e < 10; e++) { const e1 = (e + 1) % 10; face([lip[e], lip[e1], back[e1], back[e]], K.dark, ax); }
          face(back, B, [3, MY, 0]);
          for (const y of [MY - 0.028, MY + 0.028]) K.rect(1.722, y, 0, 0.2, 0.012, [0.34, 0.34, 0.36]);
        }, { hinge: [[1.2, 0.13, -0.25], [1.2, 0.13, 0.25]] });
        // ---- the driver, reclined, his hands on the wooden wheel; the wrap-around screen on the scuttle (one-sided panes facing out: he
        //      sees through them); the roll hoop behind his head ----
        K.driver(-0.13, 0.8, 0, { r: 0.125, lean: 0.6, suit: [0.7, 0.75, 0.82], band: P, hands: [0.27, 0.5, 0.14] });
        K.part('body', () => {
          const C = [0.27, 0.5, 0], u = [0.33, 0.944, 0], rr = 0.14, pt = (a) => [C[0] + u[0] * rr * Math.sin(a), C[1] + u[1] * rr * Math.sin(a), rr * Math.cos(a)];
          for (let i = 0; i < 6; i++) K.bar(pt(i * Math.PI / 3), pt((i + 1) * Math.PI / 3), 0.013, WOOD, { n: 3 });
          const b = [[0.47, 0], [0.455, 0.13], [0.405, 0.215], [0.29, 0.258]].map(([x, z]) => [x, L.topY(x, z) - 0.004, z]);
          const tp = [[-0.07, 0.125], [-0.068, 0.12], [-0.06, 0.1], [-0.04, 0.06]].map(([dx, dy], i) => [b[i][0] + dx, b[i][1] + dy, b[i][2]]);
          for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const q = [b[i], b[i + 1], tp[i + 1], tp[i]].map(p => [p[0], p[1], sd * p[2]]), c = mid(q); face(q, G, [2 * c[0] - 0.1, c[1], 2 * c[2]]); }
          const fy = L.topY(0.66, 0) + 0.004, oc = []; for (let i = 0; i < 8; i++) oc.push([0.66 + Math.cos(i * Math.PI / 4) * 0.045, fy, Math.sin(i * Math.PI / 4) * 0.045]);
          face(oc, CH, [0.66, 2, 0]);   // (the fuel filler on the scuttle)
        });
        K.part('body', () => K.sweep(dia(0.017), [[-0.37, 0.56, -0.2], [-0.374, 0.83, -0.18], [-0.38, 0.925, -0.08], [-0.38, 0.925, 0.08], [-0.374, 0.83, 0.18], [-0.37, 0.56, 0.2]], CH), { noCrush: true, noDent: true });
        // ---- the mirrors on their stalks, on the cockpit's sides ----
        for (const sd of [-1, 1]) K.mirror(0.33, 0.56, sd * 0.37, { w: 0.03, h: 0.05, d: 0.075, col: CH, arm: CH, z0: sd * 0.265 });
        // ---- the suspension: double wishbones and coil-overs at the front; at the back a lower wishbone, a top link, a radius arm, the
        //      coil-over and the drive shaft ----
        K.part('body', () => {
          const fx = K.fx, rx = K.rx, bar = (a, b, r, col, n) => K.bar(a, b, r || 0.012, col || ARM, { n: n || 3 });
          for (const sd of [-1, 1]) {
            for (const dx of [0.15, -0.15]) { bar([fx + dx, 0.43, sd * 0.2], [fx, 0.46, sd * 0.555]); bar([fx + dx * 1.1, 0.17, sd * 0.17], [fx, 0.2, sd * 0.565], 0.013); }
            bar([fx - 0.02, 0.21, sd * 0.47], [fx - 0.06, 0.47, sd * 0.25], 0.017, SPRING, 4);
            bar([rx - 0.16, 0.17, sd * 0.16], [rx, 0.19, sd * 0.565], 0.013); bar([rx + 0.16, 0.17, sd * 0.2], [rx, 0.19, sd * 0.565], 0.013);
            bar([rx + 0.02, 0.45, sd * 0.18], [rx, 0.46, sd * 0.555]); bar([rx + 0.6, 0.17, sd * 0.27], [rx + 0.02, 0.3, sd * 0.555]);
            bar([rx, 0.33, sd * 0.15], [rx, 0.33, sd * 0.58], 0.022, SHAFT, 4);
            bar([rx - 0.04, 0.21, sd * 0.47], [rx - 0.1, 0.46, sd * 0.22], 0.017, SPRING, 4);
          }
        });
        // ---- the exhausts: the V8's four stacks a side out of its flanks, back along the cover and curling up behind the engine ----
        K.part('body', () => {
          const zb = (x, y) => { const w = L.prop(x, 'w'), wt = L.prop(x, 'wt'), y0 = L.prop(x, 'ybelt'), y1 = L.prop(x, 'yt'); return w + (wt - w) * Math.max(0, Math.min(1, (y - y0) / (y1 - y0))); };   // (the shell's half width at y, on its band)
          for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {   // (fanned across: four pipes from behind; flared tips. Each from 3 cm inside the shell: its root from the engine in
            // the inner block, drawn once the cover is off)
            const x0 = -0.72 - 0.08 * i, zo = 0.3 - 0.035 * i, r = [x0 - 0.12, 0.52, sd * Math.min(zo, zb(x0 - 0.12, 0.52) - 0.03)];
            K.inner(() => K.sweep(dia(0.021), [[x0, 0.43, sd * 0.19], r], STEEL));
            K.sweep(dia(0.021), [r, [x0 - 0.2, 0.56, sd * zo], [x0 - 0.28, 0.66, sd * zo], [x0 - 0.31, 0.8 - 0.015 * i, sd * zo]], STEEL, { capB: HOLE, scale: (k) => k === 3 ? 1.4 : 1 });
          }
        });
        // ---- louvres in the engine cover's flanks, behind the cockpit (decals on its band: they go with it); the number roundels ----
        for (let i = 0; i < 5; i++) { const x = -0.6 + 0.045 * i; L.decal.band([[x, 0.28], [x + 0.022, 0.28], [x + 0.022, 0.78], [x, 0.78]], [0.1, 0.1, 0.11], null, 0.004); }
        for (const sd of [-1, 1]) {
          const x = -0.6, y = 0.31, z = sd * (L.prop(x, 'w') + 0.004), oct = []; for (let i = 0; i < 8; i++) oct.push([x + Math.cos(i * Math.PI / 4) * 0.1, y + Math.sin(i * Math.PI / 4) * 0.1, z]);
          K.part('body', () => face(oct, WH, [x, y, sd * 2]));
          K.number(x, y, z + sd * 0.002, 0.12, { dir: sd < 0 ? '-z' : 'z', bg: WH, w: 0.14, part: 'body' });
        }
        // ---- inside (seen once a part is off): the radiator behind the nose, the V8 under the cover, the gearbox ----
        { const F = {}; for (const k of ['w', 'yb', 'tk', 'ybelt', 'wt', 'yt', 'cr']) F[k] = L.prop(1.22, k);   // (the loft open at the front: its bulkhead here, inside the nose)
          const half = [[F.yb, 0.93 * F.w], [F.yb + F.tk, F.w], [F.ybelt, F.w], [F.yt, F.wt], [F.yt + F.cr, 0.38 * F.wt]];
          K.part('body', () => K.inner(() => { face(half.map(([y, z]) => [1.22, y, z]).concat(half.slice().reverse().map(([y, z]) => [1.22, y, -z])), [0.2, 0.2, 0.21], [3, 0.33, 0]);
            K.grille(1.222, 0.33, 0, 0.34, 0.24, { slats: 5, col: [0.08, 0.08, 0.085], slatCol: [0.42, 0.42, 0.44] }); })); }
        K.part('body', () => K.inner(() => {
          const EN = [0.45, 0.46, 0.48], CAM = [0.12, 0.12, 0.13];
          K.box(-0.72, 0.15, 0, 0.62, 0.22, 0.34, 0, EN);
          for (const sd of [-1, 1]) { K.box(-0.72, 0.37, sd * 0.11, 0.58, 0.1, 0.13, 0, EN); K.box(-0.72, 0.47, sd * 0.11, 0.56, 0.035, 0.11, 0, CAM);
            for (let j = 0; j < 4; j++) K.cyl([-0.52 - 0.13 * j, 0.42, sd * 0.03], [-0.52 - 0.13 * j, 0.56, sd * 0.03], 0.024, CH, { n: 6, capA: null, capB: B }); }
        }));
        K.box(-1.28, 0.16, 0, 0.42, 0.2, 0.24, 0, [0.42, 0.43, 0.45], null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
