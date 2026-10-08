/* Vehicle 'kanja' — KANJA 1000: a superbike, the first motorcycle (phys.bike: the renderer leans it into the corner, rider and all; its two
   wheels are the kit's four, each one a left and a right half on the same hub, and they come off together). Signature features: 1) the
   full fairing: the pointed nose with two slit head lamps and the smoked screen, the side panels down to the belly pan, 2) the rider
   tucked in behind the screen, knees on the tank, boots on the pegs, 3) the gold forks and the twin front discs, 4) the tail rising to a
   sharp tip with its lamp, the start number on it, 5) the short silencer on the right. L 2.07 W 0.74 H 1.15 (the screen; 1.43 the rider's
   helmet), wheelbase 1.41, overhangs F 0.355 R 0.305 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'kanja', name: 'KANJA 1000', cat: 'moto', ord: 1, drive: 'MR',
    desc: 'Superšportni motor s polnim oklepom: voznik sključen za šipo, v ovinkih se nagne v zavoj.',
    phys: { mass: 275, a: 0.68, b: 0.73, kI: 0.5, kw: 154, redline: 14000, idle: 1300, gears: [2.6, 2.05, 1.7, 1.48, 1.33, 1.22], final: 4.24, rw: 0.3, cDrag: 0.55, len: 2.07, wid: 0.74, steerMax: 0.6,
      tracK: 1.25, brakeK: 0.85, spinK: 0.25, loose: 0.7, dmgK: 1.3, bike: true },
    arc: { amax: 1.65, kv: 2.2, rmin: 3.2 },
    csp: { bx: 0.15, coast: -0.06, thr: 0.0, liftP: 0.04, pwr: -0.03, out: 1, turn: 1.1, w: 1.0 },   // (no power slides: the throttle stands it up a little)
    stats: { power: 6, grip: 5, weight: 10, drift: 4 },
    price: 45000, pk: 'open', field: ['kanja'], tank: 13,
    snd: { kind: 'i4', hz: 1, loud: 1.1 },
    expect: { t100: [2.6, 3.15], vmax: [275, 297], latG: [2.05, 2.25], d100: [25.5, 29] },
    partNames: { nose: 'nose fairing', fairL: 'left fairing', fairR: 'right fairing', tail: 'tail unit', pipe: 'silencer' },
    parts: { set: 'none', ht: 1.15, y0: 0.15,
      extra: {
        nose: { z: 0, th: 0.5, m: 3, r: 0.3, h: 0.14, lx: 0.77, lz: 0, y: 0.86 },
        fairL: { z: 2, th: 0.5, m: 3, r: 0.35, h: 0.1, lx: 0.12, lz: -0.6, y: 0.55 },
        fairR: { z: 3, th: 0.5, m: 3, r: 0.35, h: 0.1, lx: 0.12, lz: 0.6, y: 0.55 },
        tail: { z: 1, th: 0.55, m: 3, r: 0.3, h: 0.12, lx: -0.6, lz: 0, y: 0.84 },
        pipe: { z: 3, th: 0.6, m: 2, r: 0.2, h: 0.12, lx: -0.45, lz: 0.47, y: 0.44 },
        mirrorL: { lx: 0.58, lz: -0.74, y: 1.02 },
        mirrorR: { lx: 0.58, lz: 0.74, y: 1.02 },
      },
    },
    // the look: no loft (a motorcycle is a frame, an engine and plastic): every piece drawn in an explicit part (KIT API v1, render.js).
    // 'body': the frame, the forks with the discs and the front fender, the swingarm, the tank, the seat, the clip-ons, the pegs, the
    // rider (and the engine in the inner block: it shows once a fairing is off); 'nose' the upper fairing with its lamps and screen,
    // 'fairL' / 'fairR' the side panels with their numbers, 'tail' the tail unit with its lamp and the start number, 'pipe' the silencer,
    // the mirrors. Look units = metres (the centre of mass at x 0, the axles at 0.68 / -0.73, the hubs at 0.3). The wheels: each half
    // 2 cm off the middle (wz: 0.35 in from the half width), the front ones 7 cm wide (a tyre of 11 cm), the rear 13 (17 cm)
    look: {
      body: { len: 2.07, wid: 0.74, roofY: 1.06, wz: 0.35,
        eye: { x: 0.24, y: 1.3, near: 0.1, tilt: 0.16, style: 'kart' },               // (in the helmet, over the screen)
        decalX: -0.74, decalY: 0.945, decalRz: -0.24, decalS: 0.2, decalPart: 'tail',   // (the start number on the tail's top, rising to its tip)
        lamps: [[0.98, 0.8, 0.07], [-1.0, 0.955, 0.03]],
        engine: [0.12, 0.66],
        crush: { x0: 0, x1: 0, z: 0 } },                                                // (no roof to crush)
      wheels: { style: 'std', spokes: 5, w: 0.07, wR: 0.13, rimK: 0.72, rim: [0.78, 0.6, 0.22], gap: 0.03, arch: false },
      regions: 'none',
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, DK = [0.13, 0.13, 0.14], AL = [0.62, 0.63, 0.66], GOLD = [0.8, 0.62, 0.24], TI = [0.66, 0.64, 0.6];
        const SMOKE = [0.26, 0.3, 0.33], DISC = [0.55, 0.56, 0.58], SEAT = [0.09, 0.09, 0.1];
        // a ring of 8 round a section at x: its bottom yb, top yt, half width w (the widest at 30 % of the height, a little less at 75 %)
        const ring8 = (x, yb, yt, w) => { const h = yt - yb; return [[x, yb, -w * 0.55], [x, yb, w * 0.55], [x, yb + 0.3 * h, w], [x, yb + 0.75 * h, w * 0.9], [x, yt, w * 0.45], [x, yt, -w * 0.45], [x, yb + 0.75 * h, -w * 0.9], [x, yb + 0.3 * h, -w]]; };
        // ---- the frame's spars and the engine (the inner block: they show once a fairing is off) ----
        K.inner(() => {
          for (const s of [-1, 1]) {
            K.plate([[0.44, 1.0, s * 0.13], [0.28, 0.99, s * 0.13], [-0.1, 0.73, s * 0.13], [0.0, 0.66, s * 0.13]], 0.03, AL);
            K.plate([[-0.1, 0.75, s * 0.12], [-0.17, 0.47, s * 0.12], [-0.06, 0.42, s * 0.12], [0.0, 0.66, s * 0.12]], 0.03, AL);
          }
          K.engine(0.12, 0.17, 0, { l: 0.44, w: 0.3, h: 0.46, col: [0.3, 0.31, 0.33], cover: [0.16, 0.16, 0.17], inner: true });
        });
        K.part('body', () => {
          // ---- the forks (gold tubes into black sliders, rake 23 degrees), the axle, the triple clamps, the twin discs and their calipers ----
          const ax = [0.68, 0.3], top = [0.4, 0.96], at = (t) => [ax[0] + (top[0] - ax[0]) * t, ax[1] + (top[1] - ax[1]) * t];
          for (const s of [-1, 1]) {
            const m = at(0.42);
            K.cyl([ax[0], ax[1] - 0.02, s * 0.085], [m[0], m[1], s * 0.085], 0.034, DK, { n: 6 });
            K.cyl([m[0], m[1], s * 0.085], [top[0], top[1], s * 0.085], 0.027, GOLD, { n: 6 });
            for (let i = 0; i < 10; i++) {   // the disc: a ring (the rim's spokes seen through it), facing out
              const a0 = i / 10 * Math.PI * 2, a1 = (i + 1) / 10 * Math.PI * 2, q = (a, r) => [0.68 + Math.cos(a) * r, 0.3 + Math.sin(a) * r, s * 0.068], f = [q(a0, 0.1), q(a0, 0.155), q(a1, 0.155), q(a1, 0.1)];
              K.face(s > 0 ? f : f.reverse(), DISC);
            }
            K.box(0.55, 0.33, s * 0.074, 0.06, 0.11, 0.035, -0.3, DK);
          }
          K.box(0.4, 0.93, 0, 0.09, 0.035, 0.23, 0, DK);                                  // the top triple clamp
          K.box(0.47, 0.76, 0, 0.09, 0.04, 0.23, 0, DK);                                  // the bottom one
          // the front fender over the tyre (on the sliders)
          const fen = [0.55, 0.95, 1.35, 1.75, 2.15].map(a => { const c = Math.cos(a), sn = Math.sin(a), ri = 0.322, ro = 0.338;
            return [[0.68 + c * ri, 0.3 + sn * ri, -0.066], [0.68 + c * ro, 0.3 + sn * ro, -0.066], [0.68 + c * ro, 0.3 + sn * ro, 0.066], [0.68 + c * ri, 0.3 + sn * ri, 0.066]]; });
          K.skin(fen, (k, e) => e === 1 ? P : DK, DK, DK);
          // ---- the swingarm (two aluminium arms round the rear tyre), the rear axle's blocks, the chain's sprocket guard ----
          for (const s of [-1, 1]) K.plate([[-0.06, 0.52, s * 0.112], [-0.12, 0.39, s * 0.112], [-0.76, 0.27, s * 0.112], [-0.76, 0.34, s * 0.112]], 0.035, AL);
          K.cyl([-0.73, 0.3, -0.13], [-0.73, 0.3, 0.13], 0.018, DK, { n: 6 });
          // ---- the clip-ons, the pegs and their hangers, the instruments behind the screen ----
          for (const s of [-1, 1]) {
            K.bar([0.4, 0.94, s * 0.1], [0.33, 0.92, s * 0.27], 0.014, DK, { n: 4 });
            K.plate([[-0.12, 0.6, s * 0.15], [-0.22, 0.6, s * 0.15], [-0.34, 0.4, s * 0.15], [-0.24, 0.38, s * 0.15]], 0.012, AL);
            K.bar([-0.3, 0.42, s * 0.13], [-0.3, 0.42, s * 0.22], 0.012, DK, { n: 4 });
          }
          K.box(0.47, 0.98, 0, 0.1, 0.05, 0.16, -0.5, DK);
          // ---- the tank (the paint, a stripe along its top) and the seat ----
          const tk = [[0.38, 0.9, 0.99, 0.12], [0.26, 0.84, 1.06, 0.19], [0.1, 0.81, 1.05, 0.19], [-0.04, 0.82, 0.96, 0.15], [-0.1, 0.83, 0.9, 0.12]].map(([x, yb, yt, w]) => ring8(x, yb, yt, w));
          K.skin(tk, (k, e) => e === 4 ? S : e === 0 ? DK : P, P, P);
          const st = [[-0.06, 0.82, 0.875, 0.12], [-0.25, 0.83, 0.88, 0.145], [-0.43, 0.84, 0.885, 0.13]].map(([x, yb, yt, w]) => ring8(x, yb, yt, w));
          K.skin(st, SEAT, SEAT, SEAT);
        });
        // ---- the rider: tucked in (the back 22 degrees off the level, the hips on the seat), hands on the clip-ons, knees on the tank,
        //      boots on the pegs; the suit a dark shade of the bike's colour, the helmet white with its stripe ----
        K.driver(0.13, 1.3, 0, { r: 0.13, lean: -1.186, suit: K.shade(P, 0.42), band: S, hands: [0.34, 0.95, 0.26], knee: [0.04, 0.75, 0.23], feet: [-0.3, 0.45, 0.19] });
        // ---- the nose: the upper fairing over the front wheel, its two slit lamps, the screen ----
        K.part('nose', () => {
          const R = [[1.02, 0.77, 0.85, 0.05], [0.94, 0.69, 0.93, 0.15], [0.82, 0.65, 0.99, 0.21], [0.68, 0.66, 1.02, 0.24], [0.56, 0.7, 1.03, 0.235]].map(([x, yb, yt, w]) => ring8(x, yb, yt, w));
          K.skin(R, (k, e) => e === 0 ? DK : e === 4 && k < 2 ? S : P, P, P);
          for (const s of [-1, 1]) {
            K.headLamp(0.965, 0.82, s * 0.075, 0.03, { shape: 'rect', w: 0.09, h: 0.035, ring: null });
            K.rect(0.9, 0.73, s * 0.165, 0.18, 0.05, B, { dir: s < 0 ? '-z' : 'z' });    // (the air intakes' dark slots under the lamps)
          }
          K.plate([[0.69, 1.015, -0.175], [0.69, 1.015, 0.175], [0.47, 1.15, 0.1], [0.47, 1.15, -0.1]], 0.008, SMOKE);   // the screen
        }, { hinge: [[0.56, 0.7, -0.25], [0.56, 0.7, 0.25]] });
        for (const s of [-1, 1]) K.mirror(0.6, 1.0, s * 0.27, { col: P, w: 0.05, h: 0.05, d: 0.11, z0: s * 0.2 });
        // ---- the side fairings: from the nose down to the belly pan, the knees outside their rear edges; a number on each ----
        for (const s of [-1, 1]) K.part(s < 0 ? 'fairL' : 'fairR', () => {
          const half = (x, yb, yt, zm) => { const h = yt - yb; return [[x, yb, 0], [x, yb + 0.03, s * zm * 0.75], [x, yb + 0.28 * h, s * zm], [x, yb + 0.68 * h, s * zm * 0.96], [x, yt, s * zm * 0.72], [x, yt, s * 0.11]]; };
          const R = [[0.74, 0.64, 0.9, 0.2], [0.56, 0.48, 0.95, 0.26], [0.38, 0.17, 0.96, 0.27], [0.2, 0.14, 0.92, 0.25], [0.02, 0.16, 0.82, 0.19], [-0.12, 0.34, 0.74, 0.15]].map(([x, yb, yt, zm]) => half(x, yb, yt, zm));
          K.skin(R, (k, e) => e === 0 ? DK : e === 5 ? DK : e === 2 && k >= 1 && k <= 3 ? S : P, P, P);
          K.number(0.33, 0.5, s * 0.272, 0.15, { dir: s < 0 ? '-z' : 'z' });
        }, { hinge: [[0.38, 0.95, s * 0.2], [-0.1, 0.75, s * 0.15]] });
        // ---- the tail: under the seat, rising to its sharp tip; the lamp at the tip ----
        K.part('tail', () => {
          const R = [[-0.06, 0.62, 0.82, 0.13], [-0.4, 0.7, 0.85, 0.15], [-0.62, 0.78, 0.91, 0.13], [-0.86, 0.86, 0.97, 0.09], [-1.02, 0.925, 0.99, 0.045]].map(([x, yb, yt, w]) => ring8(x, yb, yt, w));
          K.skin(R, (k, e) => e === 0 ? DK : e === 4 && k >= 1 ? S : P, P, P);
          for (const s of [-1, 1]) K.tailLamp(-1.022, 0.957, s * 0.022, 0.04, 0.04, { host: 'tail' });
        }, { hinge: [[-0.06, 0.82, -0.15], [-0.06, 0.82, 0.15]] });
        // ---- the silencer on the right, its link pipe from under the engine ----
        K.part('pipe', () => {
          K.bar([-0.06, 0.2, 0.08], [-0.3, 0.37, 0.165], 0.03, [0.42, 0.4, 0.38], { n: 5 });
          K.cyl([-0.28, 0.36, 0.17], [-0.66, 0.52, 0.19], 0.065, TI, { n: 7, r2: 0.055, capA: TI, capB: B });
        });
      },
    },
  });
})();
