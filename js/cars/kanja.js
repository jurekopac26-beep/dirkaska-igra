/* Vehicle 'kanja' — KANJA GP: a Grand Prix racing motorcycle for the circuits, the first motorcycle (phys.bike: the renderer leans it
   into the corner, rider and all; its two wheels are the kit's four, each one a left and a right half on the same hub, and they come
   off together). Signature features: 1) the racing fairing without lamps or mirrors: the round nose with its big air intake, the low
   smoked bubble, the winglet boxes on both sides of the nose, the side panels down to the belly pan, 2) the rider tucked in behind
   the bubble, the aero hump on his back, boots on the pegs, 3) the slicks on black rims, the big carbon front discs, the gold forks,
   4) the short high tail with the rain light and the start number on top, 5) the stubby titanium silencer on the right (what the
   chase and the isometric camera do not see is left out: no calipers, knee sliders, dash or side numbers). L 2.05 W 0.70 H 1.13
   (the bubble; 1.43 the rider's helmet), wheelbase 1.44, overhangs F 0.365 R 0.245 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'kanja', name: 'KANJA GP', cat: 'moto', ord: 1, drive: 'MR',
    desc: 'Dirkalni motor za dirkališča: krilca na nosu, gladke gume, v ovinkih se nagne v zavoj.',
    phys: { mass: 230, a: 0.66, b: 0.78, kI: 0.45, kw: 213, redline: 18000, idle: 1800, gears: [2.55, 2.0, 1.66, 1.44, 1.29, 1.18], final: 3.8, rw: 0.3, cDrag: 0.48, len: 2.05, wid: 0.7, steerMax: 0.6,
      tracK: 1.35, brakeK: 1, spinK: 0.15, loose: 0.7, dmgK: 1.3, bike: true },
    arc: { amax: 1.72, kv: 2.2, rmin: 3.2 },
    csp: { bx: 0.15, coast: -0.06, thr: 0.0, liftP: 0.04, pwr: -0.03, out: 1, turn: 1.1, w: 1.0 },   // (no power slides: the throttle stands it up a little)
    stats: { power: 8, grip: 7, weight: 10, drift: 3 },
    price: 95000, pk: 'unl', field: ['kanja'], tank: 16,
    snd: { kind: 'i4', hz: 1, loud: 1.2 },
    expect: { t100: [2.45, 2.8], vmax: [325, 343], latG: [2.18, 2.32], d100: [23, 24.8] },
    partNames: { nose: 'nose fairing', wingL: 'left winglets', wingR: 'right winglets', fairL: 'left fairing', fairR: 'right fairing', tail: 'tail unit', pipe: 'silencer' },
    parts: { set: 'none', ht: 1.13, y0: 0.15,
      extra: {
        nose: { z: 0, th: 0.5, m: 3, r: 0.3, h: 0.14, lx: 0.77, lz: 0, y: 0.85 },
        wingL: { z: 2, th: 0.35, m: 1, r: 0.15, h: 0.12, lx: 0.79, lz: -0.71, y: 0.83 },
        wingR: { z: 3, th: 0.35, m: 1, r: 0.15, h: 0.12, lx: 0.79, lz: 0.71, y: 0.83 },
        fairL: { z: 2, th: 0.5, m: 3, r: 0.35, h: 0.1, lx: 0.14, lz: -0.6, y: 0.55 },
        fairR: { z: 3, th: 0.5, m: 3, r: 0.35, h: 0.1, lx: 0.14, lz: 0.6, y: 0.55 },
        tail: { z: 1, th: 0.55, m: 3, r: 0.3, h: 0.12, lx: -0.55, lz: 0, y: 0.86 },
        pipe: { z: 3, th: 0.6, m: 2, r: 0.2, h: 0.1, lx: -0.37, lz: 0.43, y: 0.47 },
      },
    },
    // the look: no loft (a motorcycle is a frame, an engine and plastic): every piece drawn in an explicit part (KIT API v1, render.js).
    // 'body': the frame, the forks with the discs and the front fender, the swingarm, the tank, the seat, the clip-ons,
    // the pegs, the rider with his hump (and the engine in the inner block: it shows once a fairing is off); 'nose' the upper fairing
    // with its intake and bubble, 'wingL' / 'wingR' the winglet boxes, 'fairL' / 'fairR' the side panels with their vents, 'tail'
    // the tail unit with its rain light and the start number, 'pipe' the silencer. Look units = metres (the centre of mass at
    // x 0, the axles at 0.66 / -0.78, the hubs at 0.3). The wheels: each half 2 cm off the middle (wz: 0.33 in from the half width),
    // the front ones 7 cm wide (a slick of 11 cm), the rear 14 (18 cm)
    look: {
      body: { len: 2.05, wid: 0.7, roofY: 1.05, wz: 0.33,
        eye: { x: 0.24, y: 1.3, near: 0.1, tilt: 0.16, style: 'kart' },               // (in the helmet, over the bubble)
        decalX: -0.72, decalY: 0.98, decalRz: -0.2, decalS: 0.2, decalPart: 'tail',     // (the start number on the tail's top, rising to its tip)
        engine: [0.12, 0.66],
        crush: { x0: 0, x1: 0, z: 0 } },                                                // (no roof to crush)
      wheels: { style: 'slick', w: 0.07, wR: 0.14, rimK: 0.72, rim: [0.13, 0.13, 0.14], gap: 0.03, arch: false },
      regions: 'none',
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, DK = [0.13, 0.13, 0.14], CF = [0.17, 0.17, 0.18], AL = [0.62, 0.63, 0.66], GOLD = [0.8, 0.62, 0.24], TI = [0.66, 0.62, 0.55];
        const SMOKE = [0.24, 0.27, 0.3], DISC = [0.26, 0.26, 0.27], SEAT = [0.09, 0.09, 0.1];
        // a ring of 8 round a section at x: its bottom yb, top yt, half width w (the widest at 30 % of the height, a little less at 75 %)
        const ring8 = (x, yb, yt, w) => { const h = yt - yb; return [[x, yb, -w * 0.55], [x, yb, w * 0.55], [x, yb + 0.3 * h, w], [x, yb + 0.75 * h, w * 0.9], [x, yt, w * 0.45], [x, yt, -w * 0.45], [x, yb + 0.75 * h, -w * 0.9], [x, yb + 0.3 * h, -w]]; };
        // ---- the frame's spars and the engine (the inner block: they show once a fairing is off) ----
        K.inner(() => {
          for (const s of [-1, 1]) {
            K.plate([[0.44, 0.99, s * 0.13], [0.28, 0.98, s * 0.13], [-0.1, 0.73, s * 0.13], [0.0, 0.66, s * 0.13]], 0.03, AL);
            K.plate([[-0.1, 0.75, s * 0.12], [-0.17, 0.47, s * 0.12], [-0.06, 0.42, s * 0.12], [0.0, 0.66, s * 0.12]], 0.03, AL);
          }
          K.engine(0.12, 0.17, 0, { l: 0.44, w: 0.3, h: 0.46, col: [0.3, 0.31, 0.33], cover: [0.16, 0.16, 0.17], inner: true });
        });
        K.part('body', () => {
          // ---- the forks (gold tubes into black sliders, rake 22 degrees), the top clamp, the carbon discs ----
          const ax = [0.66, 0.3], top = [0.4, 0.94], at = (t) => [ax[0] + (top[0] - ax[0]) * t, ax[1] + (top[1] - ax[1]) * t];
          for (const s of [-1, 1]) {
            const m = at(0.42);
            K.cyl([ax[0], ax[1] - 0.02, s * 0.085], [m[0], m[1], s * 0.085], 0.034, DK, { n: 6, capB: null });   // (the ends inside the clamp and the slider: open)
            K.cyl([m[0], m[1], s * 0.085], [top[0], top[1], s * 0.085], 0.027, GOLD, { n: 6, capA: null, capB: null });
            for (let i = 0; i < 6; i++) {   // the disc: a ring (the rim seen through it), facing out
              const a0 = i / 6 * Math.PI * 2, a1 = (i + 1) / 6 * Math.PI * 2, q = (a, r) => [0.66 + Math.cos(a) * r, 0.3 + Math.sin(a) * r, s * 0.068], f = [q(a0, 0.12), q(a0, 0.17), q(a1, 0.17), q(a1, 0.12)];
              K.face(s > 0 ? f : f.reverse(), DISC);
            }
          }
          K.box(0.4, 0.91, 0, 0.09, 0.035, 0.23, 0, DK);                                  // the top triple clamp
          // the front fender over the slick (carbon, on the sliders)
          const fen = [0.55, 1.08, 1.62, 2.15].map(a => { const c = Math.cos(a), sn = Math.sin(a), ri = 0.322, ro = 0.336;
            return [[0.66 + c * ri, 0.3 + sn * ri, -0.064], [0.66 + c * ro, 0.3 + sn * ro, -0.064], [0.66 + c * ro, 0.3 + sn * ro, 0.064], [0.66 + c * ri, 0.3 + sn * ri, 0.064]]; });
          K.skin(fen, (k, e) => e === 1 ? CF : DK, DK, DK);
          // ---- the swingarm (carbon arms round the rear slick), the rear axle ----
          for (const s of [-1, 1]) K.plate([[-0.06, 0.52, s * 0.115], [-0.12, 0.38, s * 0.115], [-0.8, 0.26, s * 0.115], [-0.8, 0.34, s * 0.115]], 0.04, CF);
          K.cyl([-0.78, 0.3, -0.135], [-0.78, 0.3, 0.135], 0.018, DK, { n: 6 });
          // ---- the clip-ons, the pegs and their hangers ----
          for (const s of [-1, 1]) {
            K.bar([0.4, 0.92, s * 0.1], [0.33, 0.9, s * 0.25], 0.014, DK, { n: 4 });
            K.plate([[-0.12, 0.62, s * 0.15], [-0.22, 0.62, s * 0.15], [-0.36, 0.44, s * 0.15], [-0.26, 0.42, s * 0.15]], 0.012, AL);
            K.bar([-0.32, 0.47, s * 0.13], [-0.32, 0.47, s * 0.22], 0.012, DK, { n: 4 });
          }
          // ---- the tank (the airbox cover: the paint, a stripe along its top) and the seat ----
          const tk = [[0.38, 0.9, 0.98, 0.12], [0.24, 0.84, 1.05, 0.19], [0.04, 0.81, 1.02, 0.18], [-0.1, 0.83, 0.9, 0.12]].map(([x, yb, yt, w]) => ring8(x, yb, yt, w));
          K.skin(tk, (k, e) => e === 4 ? S : e === 0 ? DK : P, P, P);
          const st = [[-0.06, 0.83, 0.88, 0.12], [-0.42, 0.85, 0.89, 0.14]].map(([x, yb, yt, w]) => ring8(x, yb, yt, w));
          K.skin(st, SEAT, SEAT, SEAT);
        });
        // ---- the rider: tucked in (the back 22 degrees off the level, the hips on the seat), hands on the clip-ons, knees on the tank,
        //      boots on the pegs; the leathers a dark shade of the bike's colour, the helmet white with its stripe; the aero hump on his
        //      back ----
        K.driver(0.13, 1.3, 0, { r: 0.13, lean: -1.186, suit: K.shade(P, 0.42), band: S, hands: [0.34, 0.93, 0.25], knee: [0.03, 0.75, 0.23], feet: [-0.32, 0.5, 0.19] });
        K.part('body', () => {
          const hump = [[0.0, 1.13, 0.08], [-0.12, 1.19, 0.09], [-0.27, 1.1, 0.08]].map(([x, y, w]) => [[x, y - 0.05, -w], [x, y - 0.05, w], [x, y + 0.02, w * 0.8], [x, y + 0.06, 0], [x, y + 0.02, -w * 0.8]]);
          K.skin(hump, (k, e) => e === 2 || e === 3 ? S : K.shade(P, 0.42), K.shade(P, 0.42), K.shade(P, 0.42));
        }, { sub: 'driver', noCrush: true, noDent: true });
        // ---- the nose: the round upper fairing over the front wheel, its air intake, the smoked bubble ----
        K.part('nose', () => {
          const R = [[1.02, 0.75, 0.86, 0.075], [0.95, 0.68, 0.93, 0.16], [0.83, 0.65, 0.99, 0.21], [0.7, 0.65, 1.02, 0.23], [0.57, 0.69, 1.03, 0.225]].map(([x, yb, yt, w]) => ring8(x, yb, yt, w));
          K.skin(R, (k, e) => e === 0 ? DK : e === 4 && k < 2 ? S : P, P, P);
          const ia = [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i / 8 * Math.PI * 2; return [1.024, 0.805 + Math.sin(a) * 0.034, Math.cos(a) * 0.052]; });
          K.face(ia, B);                                                                   // (the intake, facing forward)
          for (const s of [-1, 1]) K.rect(0.8, 0.72, s * 0.215, 0.16, 0.04, B, { dir: s < 0 ? '-z' : 'z' });   // (the outlets under the winglets)
          K.plate([[0.7, 1.015, -0.16], [0.7, 1.015, 0.16], [0.5, 1.13, 0.09], [0.5, 1.13, -0.09]], 0.008, SMOKE);   // the bubble
        }, { hinge: [[0.57, 0.69, -0.23], [0.57, 0.69, 0.23]] });
        // ---- the winglet boxes on the nose's sides: two planks and an endplate each ----
        for (const s of [-1, 1]) K.part(s < 0 ? 'wingL' : 'wingR', () => {
          K.wingPlank(0.92, 0.86, 0.75, 0.885, 0.014, s * 0.2, s * 0.3, CF);
          K.wingPlank(0.94, 0.76, 0.77, 0.785, 0.014, s * 0.2, s * 0.3, CF);
          K.endplate([[0.95, 0.75], [0.93, 0.9], [0.74, 0.91], [0.76, 0.77]], s * 0.302, 0.012, P);
        });
        // ---- the side fairings: from the nose down to the belly pan, the knees outside their rear edges; a vent on each ----
        for (const s of [-1, 1]) K.part(s < 0 ? 'fairL' : 'fairR', () => {
          const half = (x, yb, yt, zm) => { const h = yt - yb; return [[x, yb, 0], [x, yb + 0.03, s * zm * 0.75], [x, yb + 0.28 * h, s * zm], [x, yb + 0.68 * h, s * zm * 0.96], [x, yt, s * zm * 0.72], [x, yt, s * 0.11]]; };
          const R = [[0.72, 0.64, 0.9, 0.2], [0.55, 0.48, 0.94, 0.25], [0.38, 0.17, 0.95, 0.26], [0.2, 0.14, 0.91, 0.24], [0.02, 0.16, 0.82, 0.19], [-0.12, 0.34, 0.74, 0.15]].map(([x, yb, yt, zm]) => half(x, yb, yt, zm));
          K.skin(R, (k, e) => e === 0 ? DK : e === 5 ? DK : e === 2 && k >= 1 && k <= 3 ? S : P, P, P);
          K.rect(0.12, 0.42, s * 0.245, 0.16, 0.05, B, { dir: s < 0 ? '-z' : 'z' });       // (the hot air's vent)
        }, { hinge: [[0.38, 0.94, s * 0.2], [-0.1, 0.75, s * 0.15]] });
        // ---- the tail: under the seat, short and high, rising to its tip; the rain light at the tip ----
        K.part('tail', () => {
          const R = [[-0.06, 0.63, 0.84, 0.13], [-0.4, 0.72, 0.89, 0.15], [-0.62, 0.8, 0.95, 0.13], [-0.84, 0.87, 0.99, 0.1], [-0.99, 0.91, 1.0, 0.055]].map(([x, yb, yt, w]) => ring8(x, yb, yt, w));
          K.skin(R, (k, e) => e === 0 ? DK : e === 4 && k >= 1 ? S : P, P, P);
          for (const s of [-1, 1]) K.tailLamp(-0.993, 0.95, s * 0.02, 0.035, 0.03, { host: 'tail' });
        }, { hinge: [[-0.06, 0.84, -0.15], [-0.06, 0.84, 0.15]] });
        // ---- the stubby silencer on the right, its link pipe from under the engine ----
        K.part('pipe', () => {
          K.bar([-0.04, 0.2, 0.08], [-0.24, 0.38, 0.15], 0.03, [0.42, 0.4, 0.38], { n: 5 });
          K.cyl([-0.22, 0.37, 0.155], [-0.54, 0.56, 0.15], 0.055, TI, { n: 7, r2: 0.045, capA: TI, capB: B });
        });
      },
    },
  });
})();
