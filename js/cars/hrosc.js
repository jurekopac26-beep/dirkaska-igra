/* Vehicle 'hrosc' — SKAKAČ 1600: a Baja-style cut-down beetle, rear air-cooled flat four. Signature features: 1) the round beetle cabin on
   a raised long-travel chassis, 2) an exo-cage over the roof and down to the bumpers, 3) cut-away short wings over big off-road tyres, 4)
   a light bar on the roof hoop, 5) the exposed engine at the rear. L 3.90 W 1.80 H 1.55, wheelbase 2.40, overhangs F 0.62 R 0.88 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'hrosc', name: 'SKAKAČ 1600', cat: 'teren', ord: 3, drive: 'RR',
    desc: 'Puščavski skakač z motorjem zadaj: dolg hod vzmetenja, zunanja kletka in luči na strehi.',
    phys: { mass: 850, a: 1.33, b: 1.07, kI: 1.05, kw: 110, redline: 6000, idle: 850, gears: [3.4, 2.1, 1.42, 1], final: 4.51, rw: 0.38, cDrag: 0.5, len: 3.9, wid: 1.8, steerMax: 0.62,
      tracK: 0.95, brakeK: 0.9, spinK: 0.6, loose: 1.2, looseDrag: 0.45, landV: 18, landK: 0.5, sway: 1.5 },
    arc: { amax: 1.55, kv: 1.85, rmin: 4.6 },
    csp: { bx: 0.15, coast: -0.04, thr: 0.01, liftP: 0.2, pwr: 0.07, out: 1.3, turn: 1.08, w: 1, tv: 1.12 },   // (the RR layer: the engine behind the rear axle, a pendulum on a lift; its own out, tv)
    stats: { power: 2, grip: 4, weight: 10, drift: 9 },
    price: 16000, pk: 'ta1', field: ['hrosc'],
    snd: { kind: 'flat4', hz: 1.05, loud: 1 },
    expect: { t100: [3.36, 3.94], vmax: [174, 185], latG: [1.98, 2.08], d100: [24.8, 27.4] },
    partNames: { cover: 'engine lid', lightbar: 'light bar' },
    parts: { set: 'none', ht: 1.55, y0: 0.42,
      extra: {
        hood: { lx: 0.74, f: 0.41 },
        cover: { z: 1, th: 0.72, m: 6, rW: 0.36, h: 0.06, lx: -0.68, lz: 0, f: 0.45 },
        fenderL: {},
        fenderR: {},
        lightbar: { z: 0, th: 0.45, m: 3, rW: 0.3, h: 0.12, lx: 0.3, lz: 0, f: 1 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): the beetle one loft (the round roof from the upright windscreen back to the
    // small rear window, the cowl, the front lid falling to a short nose; the rear wheel's arch cut in it, its tub), the cut-down engine lid
    // a skin of its own behind it (cover), the four short wings round the hubs (skins: the front pair with their lamp pods fenderL /
    // fenderR, the rear pair with the tail lamps the body's), the exo-cage (a tube each side from the front bumper over the roof to the rear
    // frame, the front hoop under the light bar, the cross tubes), the light bar (lightbar), the flat four bare under the lid, the shocks
    // in the wheels' gaps, the bumpers and the skid plate
    look: {
      body: { len: 3.9, wid: 1.8, wz: 0.16,
        //       x      w     yb    ybelt  wt    yt    cr     kind  tuck
        secs: [[-1.18, 0.6, 0.5, 0.9, 0.44, 1.0, 0.12, 'gr', 0.12],      // the rear window's base (the engine lid goes on from here)
          [-0.9, 0.67, 0.45, 0.95, 0.51, 1.16, 0.15, 'r', 0.12],           // the roof's back: the round dome
          [-0.52, 0.7, 0.43, 0.97, 0.54, 1.26, 0.16, 'r', 0.12],
          [-0.1, 0.7, 0.42, 0.97, 0.55, 1.3, 0.17, 'r', 0.12],
          [0.28, 0.7, 0.42, 0.97, 0.55, 1.28, 0.165, 'r', 0.12],
          [0.54, 0.7, 0.43, 0.97, 0.55, 1.23, 0.15, 'gf', 0.12],           // the windscreen's top: short and nearly upright
          [0.8, 0.68, 0.44, 0.95, 0.6, 0.98, 0.04, 'b', 0.12],             // the cowl
          [0.98, 0.56, 0.5, 0.87, 0.5, 0.93, 0.06, 'b', 0.12],             // the front lid between the wings, round, falling to the nose
          [1.36, 0.54, 0.53, 0.83, 0.48, 0.88, 0.06, 'b', 0.12],
          [1.62, 0.52, 0.55, 0.78, 0.45, 0.82, 0.05, 'b', 0.12],
          [1.77, 0.5, 0.56, 0.72, 0.42, 0.75, 0.04, 'b', 0.1],
          [1.82, 0.47, 0.57, 0.68, 0.38, 0.7, 0.03, 'b', 0.08]],           // the short nose
        eye: { x: -0.06, y: 1.22, style: 'closed' },
        lamps: [[1.75, 0.865, 0.69], [-1.47, 0.86, 0.71]],
        engine: [-1.4, 0.76], engRear: true },
      wheels: { style: 'knob', w: 0.26, wR: 0.3, rim: [0.86, 0.86, 0.84], cap: [0.24, 0.24, 0.26] },
      regions: [{ part: 'hood', x: [0.98, 1.9], bands: ['edge', 'crown'] }],
      build(K) {
        const P = K.paint, S = K.strp, G = K.GLASS, B = K.black, D = [0.16, 0.16, 0.165], CG = [0.1, 0.1, 0.105], AL = [0.62, 0.63, 0.65], RB = [0.1, 0.1, 0.11];
        const SH = K.shade(P, 0.55), SP = [0.95, 0.72, 0.1];
        // ---- the body: the paint, the glass (the windscreen, the side windows, a small rear window), dark under its lower edge; the firewall
        //      behind the rear seat (the loft's tail: under the engine lid) dark; the rear wheel's arch (the front wheels stand clear of it) ----
        const L = K.loft(K.body.secs, (k, e, kind) => {
          if (e === 0 || e === 8) return SH;
          if (e === 2 || e === 6) return kind === 'r' || kind === 'gf' ? G : P;
          if (kind === 'gf' && e >= 3 && e <= 5) return G;
          if (kind === 'gr' && e === 4) return G;
          return P;
        }, { caps: { front: { col: P, cut: 0 }, rear: { col: D, cut: 0 } }, arches: [{ x: K.rx, r: 0.5 }] });
        const DL = L.decal, top = (x, z) => L.topY(x, z);
        DL.band([[-0.36, 0], [-0.28, 0], [-0.28, 1], [-0.36, 1]], P, null, 0.01);               // the B-pillar
        DL.band([[-0.9, 0], [-0.74, 0], [-0.84, 1], [-0.9, 1]], P, null, 0.01);                 // the C-pillar's lean (the quarter window's back)
        DL.band([[0.54, 0.84], [0.8, 0.3], [0.8, 1], [0.54, 1]], P, null, 0.01);                 // the A-pillar's foot
        K.hinge('hood', [0.99, 0.98, -0.4], [0.99, 0.98, 0.4]);                                   // (the front lid hinges at the cowl)
        for (const sd of [-1, 1]) DL.top([[0.99, sd * 0.07], [1.79, sd * 0.07], [1.79, sd * 0.17], [0.99, sd * 0.17]], S, 0.006);   // the livery: twin stripes along the front lid
        // ---- the engine lid: cut short over the engine (the lower lid and the apron gone), its louvres ----
        const deck = [[-1.18, 0.6, 0.9, 0.44, 1.0, 0.12], [-1.3, 0.585, 0.88, 0.43, 0.955, 0.11], [-1.41, 0.565, 0.85, 0.415, 0.905, 0.095],
          [-1.5, 0.54, 0.81, 0.4, 0.85, 0.08], [-1.57, 0.51, 0.77, 0.38, 0.795, 0.065]];
        K.part('cover', () => {
          K.skin(deck.map(([x, w, yl, wt, yt, cr]) => [[x, yl, -w], [x, yt, -wt], [x, yt + cr, -0.38 * wt], [x, yt + cr, 0.38 * wt], [x, yt, wt], [x, yl, w]]),
            (k, e) => e === 5 ? D : P, null, P);
          for (const sd of [-1, 1]) { const q = [[-1.22, 1.107, sd * 0.04], [-1.33, 1.06, sd * 0.04], [-1.33, 1.06, sd * 0.15], [-1.22, 1.107, sd * 0.15]]; K.face(sd > 0 ? q : q.reverse(), B); }   // the louvres
        }, { hinge: [[-1.18, 1.1, -0.4], [-1.18, 1.1, 0.4]] });
        // ---- the wings: short bands round the hubs, cut high over the big tyres; the front pair (fenderL / fenderR) with the lamp pods ----
        const wing = (cx, t0, t1, n, prof, sd) => { const R = []; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; R.push(prof.map(([r, z]) => [cx + r * Math.cos(t), K.rw + r * Math.sin(t), sd * z])); } return R; };
        const wcol = (k, e) => e === 5 ? D : e === 0 ? K.shade(P, 0.7) : e === 4 ? K.shade(P, 0.9) : P;
        for (const sd of [-1, 1]) {
          K.part(sd < 0 ? 'fenderL' : 'fenderR', () => {
            K.skin(wing(K.fx, 0.56, 2.88, 5, [[0.5, 0.5], [0.57, 0.51], [0.625, 0.62], [0.62, 0.76], [0.575, 0.865], [0.505, 0.885]], sd), wcol, P, P);
            K.cyl([1.52, 0.865, sd * 0.69], [1.745, 0.865, sd * 0.69], 0.105, P, { n: 6, capA: null, capB: null });   // the lamp's pod on the wing's nose
            K.headLamp(1.75, 0.865, sd * 0.69, 0.092);
          }, { hinge: [[0.95, 0.86, sd * 0.52], [1.7, 0.86, sd * 0.52]] });
          K.part('body', () => {
            K.skin(wing(K.rx, 0.24, 2.27, 5, [[0.515, 0.5], [0.585, 0.51], [0.64, 0.64], [0.635, 0.78], [0.59, 0.885], [0.52, 0.915]], sd), wcol, P, P);
            K.cyl([-1.33, 0.86, sd * 0.71], [-1.465, 0.86, sd * 0.71], 0.058, B, { n: 5, capA: null, capB: B });   // the tail lamp's pod on the wing's tail
          });
          K.tailLamp(-1.47, 0.86, sd * 0.71, 0.1, 0.1, { round: true });
        }
        // ---- the running boards, the shocks in the wheels' gaps ----
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            K.box(0.14, 0.42, sd * 0.73, 1.28, 0.04, 0.22, 0, RB);
            K.bar([1.28, 0.46, sd * 0.57], [1.16, 0.92, sd * 0.56], 0.035, SP, { n: 5 });
            K.bar([-1.0, 0.46, sd * 0.53], [-0.84, 0.98, sd * 0.5], 0.035, SP, { n: 5 });
          }
        });
        // ---- the exo-cage: a tube each side from the front bumper up the lid's edge and the A-pillar, over the roof, down the rear window's
        //      edge and the lid to the rear frame; the front hoop (the light bar's), the cross tube at the roof's back, the rear frame,
        //      the front bumper (never crushed with the roof, never dented) ----
        const pent = [0, 1, 2, 3, 4].map(i => [Math.cos(i * Math.PI * 0.4) * 0.026, Math.sin(i * Math.PI * 0.4) * 0.026]);
        const yH = top(0.5, 0.36) + 0.05, yR = top(-0.8, 0.4) + 0.05;
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            const z = (q) => sd * q;
            K.sweep(pent, [[1.93, 0.6, z(0.44)], [1.72, 0.9, z(0.5)], [0.88, 1.05, z(0.61)], [0.58, 1.31, z(0.56)], [-0.1, top(-0.1, 0.36) + 0.05, z(0.36)], [-0.8, yR, z(0.4)], [-1.18, 1.05, z(0.5)], [-1.56, 0.86, z(0.52)], [-1.9, 0.77, z(0.48)]], CG);
          }
          K.bar([0.5, yH, -0.37], [0.5, yH, 0.37], 0.026, CG, { n: 5 });   // the front hoop
          K.bar([-0.8, yR, -0.41], [-0.8, yR, 0.41], 0.026, CG, { n: 5 });
          K.bar([-1.9, 0.77, -0.48], [-1.9, 0.77, 0.48], 0.026, CG, { n: 5 });                  // the rear frame round the engine
          for (const sd of [-1, 1]) K.bar([-1.9, 0.77, sd * 0.48], [-1.93, 0.36, sd * 0.48], 0.026, CG, { n: 5 });
          K.bar([-1.93, 0.36, -0.64], [-1.93, 0.36, 0.64], 0.032, CG, { n: 6 });               // the rear bumper
          K.bar([1.93, 0.6, -0.64], [1.93, 0.6, 0.64], 0.032, CG, { n: 6 });                   // the front bumper
          K.plate([[1.94, 0.5, -0.42], [1.94, 0.5, 0.42], [1.66, 0.36, 0.42], [1.66, 0.36, -0.42]], 0.012, AL);   // the skid plate under the nose
        }, { noCrush: true, noDent: true });
        // ---- the light bar on the front hoop: four round lamps in a black housing ----
        K.part('lightbar', () => {
          K.box(0.545, yH + 0.1, 0, 0.09, 0.09, 1.0, 0, CG);
          for (const sd of [-1, 1]) { K.bar([0.5, yH, sd * 0.3], [0.54, yH + 0.1, sd * 0.3], 0.018, CG, { n: 4 }); for (const z of [0.125, 0.375]) K.headLamp(0.592, yH + 0.145, sd * z, 0.042, { ring: null }); }
        }, { noCrush: true, noDent: true, hinge: [[0.5, yH, -0.4], [0.5, yH, 0.4]] });
        // ---- the flat four, bare behind the rear axle: the crankcase, the finned cylinders and heads each side, the fan shroud, the
        //      generator on it, twin air cleaners, the pulley, the headers and the stinger (the body's outer shell: in sight) ----
        K.part('body', () => {
          K.box(-1.46, 0.32, 0, 0.5, 0.22, 0.3, 0, [0.46, 0.47, 0.49]);
          for (const sd of [-1, 1]) {
            K.box(-1.42, 0.34, sd * 0.28, 0.34, 0.2, 0.2, 0, CG);
            K.box(-1.42, 0.36, sd * 0.42, 0.3, 0.16, 0.08, 0, AL);
            K.cyl([-1.32, 0.72, sd * 0.3], [-1.32, 0.81, sd * 0.3], 0.08, K.chrome, { n: 6, capA: null });
          }
          K.box(-1.4, 0.54, 0, 0.34, 0.18, 0.66, 0, CG);                                           // the fan shroud over both banks
          K.cyl([-1.46, 0.69, 0], [-1.6, 0.69, 0], 0.12, CG, { n: 8, capA: null, capB: AL });      // its round fan housing, the generator's pulley
          K.bar([-1.62, 0.64, 0], [-1.755, 0.48, 0], 0.014, B, { n: 3 });                          // the fan belt
          K.cyl([-1.72, 0.43, 0], [-1.76, 0.43, 0], 0.1, [0.2, 0.2, 0.21], { n: 8, capA: null });   // the crank pulley
          K.cyl([-1.66, 0.28, 0], [-1.94, 0.5, 0], 0.035, [0.35, 0.3, 0.27], { n: 6, r2: 0.062, capA: null, capB: B });   // the stinger
        });
        // ---- inside (seen once a part is off): the bucket seats, the dashboard, the roll bar behind the seats; the fuel tank and the spare
        //      wheel under the front lid ----
        for (const sd of [-1, 1]) K.seat(-0.08, 0.64, sd * 0.33, { w: 0.46, l: 0.48, back: 0.66, col: [0.1, 0.1, 0.11] });
        K.box(0.66, 0.78, 0, 0.16, 0.14, 1.2, 0, D, null, false, { inner: true, part: 'body' });
        K.cage([[[-0.45, 0.48, -0.56], [-0.45, 1.28, -0.48]], [[-0.45, 0.48, 0.56], [-0.45, 1.28, 0.48]], [[-0.45, 1.28, -0.48], [-0.45, 1.28, 0.48]], [[-0.45, 1.28, 0], [-1.0, 0.7, 0]]], 0.022, CG, { part: 'body' });
        K.box(1.02, 0.56, 0, 0.3, 0.26, 0.84, 0, [0.3, 0.3, 0.32], null, false, { inner: true, part: 'body' });
        K.tyre(1.48, 0.66, 0, { axis: 'y', r: 0.3, w: 0.18, inner: true, part: 'body' });
      },
    },
  });
})();
