/* Vehicle 'panter' — PANTER 6: a rear-engined six-cylinder sports coupe. Signature features: 1) round upright headlamps in high front
   wings, 2) a sloping fastback running down to the engine lid, 3) a whale-tail spoiler on the engine lid, 4) wide rear wings over the
   driven wheels, 5) a full-width tail-light bar. L 4.25 W 1.77 H 1.30, wheelbase 2.27, overhangs F 0.88 R 1.10 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'panter', name: 'PANTER 6', cat: 'sportni', ord: 2, drive: 'RR',
    desc: 'Športni kupe z motorjem zadaj: okrogla žarometa, poševna zadnjica in kitov rep.',
    phys: { mass: 1350, a: 1.25, b: 1.02, kI: 1.18, kw: 290, redline: 7800, idle: 900, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.52, rw: 0.31, cDrag: 0.36, len: 4.25, wid: 1.77, steerMax: 0.62,
      tracK: 1.05, spinK: 0.4 },
    arc: { amax: 1.76, kv: 2, rmin: 4.3 },
    csp: { bx: 0.15, coast: -0.04, thr: 0.01, liftP: 0.2, pwr: 0.07, out: 1.25, turn: 1.08, w: 1 },   // (the RR layer: the engine behind the rear axle, a pendulum on a lift)
    stats: { power: 8, grip: 7, weight: 6, drift: 7 },
    price: 48000, pk: 'ppo', field: null,
    snd: { kind: 'flat6', hz: 1, turbo: 0.5, loud: 1 },
    expect: { t100: [2.78, 3.27], vmax: [231, 245], latG: [2.25, 2.35], d100: [22.8, 25.2] },
    parts: { set: 'race', ht: 1.3, y0: 0.18,
      over: {
        wing: { f: 0.78, lx: -0.88, m: 4 },
        // (where the look has them: the front lid low between the wings, the high front wings forward of the axle)
        hood: { lx: 0.66, y: 0.69 }, fenderL: { lx: 0.69, lz: -0.79, y: 0.63 }, fenderR: { lx: 0.69, lz: 0.79, y: 0.63 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft from the tail panel to the front lid's edge (the lid low between the
    // wings, the roof's arc, the fastback's glass and the engine lid, the hips flaring out behind the doors); the high front wings with the
    // round lamps are skins of their own on its shoulders (in the fenders); the whale tail on the engine lid (the wing); the impact bumpers
    // with their black bellows (sweeps). Regions: the bumpers first, the front wings to the nose, the hips to the tail (the lids between them)
    look: {
      body: { len: 4.25, wid: 1.77, roofY: 1.3, wz: 0.15,
        //       x      w      yb    ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.05, 0.8, 0.24, 0.62, 0.59, 0.745, 0.035, 'b', 0.1],   // the tail panel's top: the engine lid's rear edge (the light bar under it)
          [-1.8, 0.872, 0.22, 0.64, 0.61, 0.815, 0.05, 'b', 0.11],       // the engine lid between the hips, curving down to the tail
          [-1.39, 0.885, 0.205, 0.67, 0.6, 0.895, 0.07, 'b', 0.12],      // (sections at the arches' cuts and the regions' ends cost nothing)
          [-1.3, 0.885, 0.2, 0.68, 0.58, 0.93, 0.07, 'gr', 0.12],        // the rear window's foot: the fastback's glass up to the roof
          [-1.02, 0.885, 0.19, 0.69, 0.56, 1.06, 0.065, 'gr', 0.12],     // (the hips' belt low: their shoulders are skins over it)
          [-0.835, 0.882, 0.185, 0.665, 0.55, 1.14, 0.055, 'gr', 0.12],
          [-0.65, 0.878, 0.18, 0.66, 0.545, 1.205, 0.045, 'r', 0.12],    // the roof's rear edge (the hips full width from here back)
          [-0.5, 0.785, 0.17, 0.79, 0.57, 1.235, 0.045, 'r', 0.12],      // the door's rear edge: the flare starts behind it
          [-0.15, 0.785, 0.17, 0.795, 0.6, 1.255, 0.045, 'r', 0.12],     // the roof's crest
          [0.08, 0.785, 0.17, 0.797, 0.6, 1.23, 0.04, 'gf', 0.12],       // the windscreen's top
          [0.7, 0.79, 0.17, 0.8, 0.54, 0.815, 0.045, 'b', 0.12],         // the cowl: the windscreen's foot, the door's front edge
          [1.25, 0.855, 0.18, 0.685, 0.43, 0.69, 0.055, 'b', 0.12],      // the front lid low between the wings, over the front axle
          [1.62, 0.845, 0.195, 0.6, 0.4, 0.615, 0.05, 'b', 0.12],
          [2.04, 0.78, 0.22, 0.52, 0.36, 0.525, 0.03, 'b', 0.1]],        // the lid's front edge (the bumper in front of it)
        eye: { x: -0.28, y: 1.07, style: 'closed' },
        door: [0.7, -0.5], bumpF: 0.18, bumpR: 0.25, bumpY: [0.5, 0.52], engRear: true,
        crush: { x0: -1.05, x1: 0.33, z: 0.58 },                         // (the roof and the rear window's top; the whale tail far behind it)
        lamps: [[2.08, 0.65, 0.605], [-2.06, 0.655, 0.62]] },           // (the tail's glow at the light bar's ends)
      wheels: { style: 'std', spokes: 5, w: 0.205, wR: 0.255, rim: [0.8, 0.81, 0.84], cap: [0.12, 0.12, 0.13], gap: 0.06 },
      // the bumpers first (the corners under their tops go with them); the front wings to the nose, the hips (quarters) to the tail: the
      // bonnet and the engine lid only between them; the engine lid up to the rear window's foot (the std trunk ends at the last 'gr' section)
      regions: (std) => {
        const B = std.filter(r => /^bumper/.test(r.part)), R = std.filter(r => !/^bumper/.test(r.part));
        for (const r of R) { if (/^fender/.test(r.part)) r.x = [r.x[0], 3]; if (/^quarter/.test(r.part)) r.x = [-3, r.x[1]]; if (r.part === 'trunk') r.x = [r.x[0], -1.3]; }
        const i = R.findIndex(r => /^(fender|quarter)/.test(r.part));
        return R.slice(0, i).concat(B, R.slice(i));
      },
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.12, 0.12, 0.13], CH = K.chrome;
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (the rear arch's front end, the front arch's rear end)
        const XQ = -0.835;                                                                     // (the quarter window's rear corner at the belt)
        // ---- the shell: the paint; the glass (the windscreen, the side windows, the fastback's rear window, the quarter windows' front);
        //      black sills from arch to arch, the arches' ledges black ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? B : K.shade(P, 0.55);
          if (kind === 'gf' && e >= 3 && e <= 5) return G;                                     // (its sides: paint, the side glass a decal over them)
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'gr') { if (e >= 3 && e <= 5) return G; if ((e === 2 || e === 6) && at.x > XQ) return G; }
          return P;
        }, { caps: { front: { col: P, high: 'hood' }, rear: { col: P } }, glass: (k, e, kind) => kind === 'gf' && (e === 2 || e === 6) });
        const D2 = L.decal;
        // the window graphics: the sail behind the quarter window's slanted edge, the door window's front up to the A-pillar (glass on the
        // painted band by the windscreen: by the cowl the band lies flat, it would face the driver's eyes), the door frame's rear edge, the seals
        D2.band([[XQ, 0], [-0.65, 1], [XQ, 1]], P, null, 0.01);                                         // (the sail: the glass's rear edge slants)
        D2.band([[0.08, 0], [0.58, 0], [0.39, 0.684], [0.08, 0.834]], G, null, 0.006);                   // (the A-pillar 6 cm wide over it)
        D2.band([[-0.53, 0], [-0.49, 0], [-0.47, 1], [-0.51, 1]], B, null, 0.012);                      // the door frame's rear edge
        D2.band([[XQ, 0], [0.64, 0], [0.64, 0.05], [XQ, 0.05]], B, null, 0.008);                        // the seal along the sill
        D2.band([[-0.67, 0.94], [0.1, 0.94], [0.1, 1], [-0.67, 1]], B, null, 0.008);                    // the drip rail over the side windows
        // the livery: a stripe along the sills between the arches (the stripe colour: the paint when the car has none)
        D2.side([[XA + 0.04, 0.31], [XB - 0.04, 0.31], [XB - 0.04, 0.37], [XA + 0.04, 0.37]], S, null, 0.006);
        for (const sd of [-1, 1]) K.rect(-0.3, 0.745, sd * 0.787, 0.13, 0.026, B, { dir: sd < 0 ? '-z' : 'z' });   // the door handles
        for (const x of [-0.5, 0.7]) D2.side([[x - 0.008, 0.3], [x + 0.008, 0.3], [x + 0.008, 0.8], [x - 0.008, 0.8]], D, null, 0.004);   // the doors' shut lines
        // ---- the front wings: high over the lid, round lamps upright at their noses (skins on the loft's shoulders: from its belt over the
        //      crest and down to the lid's edge, a gutter by the lid), in the fenders ----
        const WC = [[0.7, 0.835, 0.69], [0.95, 0.855, 0.675], [1.25, 0.858, 0.66], [1.55, 0.842, 0.64], [1.85, 0.808, 0.62], [2.04, 0.775, 0.605]];   // x, the crest's height and its z
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'fenderL' : 'fenderR', () => {
          const rings = WC.map(([x, yc, zc]) => { const yb = L.prop(x, 'ybelt'), w = L.prop(x, 'w'), yt = L.prop(x, 'yt'), wt = L.prop(x, 'wt');
            return [[x, yb, sd * w], [x, yb + 0.7 * (yc - yb), sd * (w - 0.25 * (w - zc))], [x, yc, sd * zc], [x, yc - 0.45 * (yc - yt), sd * (zc - 0.3 * (zc - wt))], [x, yt, sd * wt]]; });
          K.skin(rings, P, P, P);
          K.cyl([2.02, 0.65, sd * 0.605], [2.074, 0.65, sd * 0.605], 0.1, CH, { n: 10, capA: null, capB: null });   // (the lamp's chrome bucket: it stands out of the wing)
          K.headLamp(2.076, 0.65, sd * 0.605, 0.09, { ring: CH });
        });
        // ---- the hips: the rear wings' shoulders over the driven wheels, flaring out behind the doors (skins on the loft's low belt: over the
        //      crest, then in under the sail and the quarter window; at the tail a valley by the engine lid), in the quarters ----
        const HC = [[-0.5, 0, 0], [-0.65, 0.8, 0.85], [-0.835, 0.82, 0.862], [-1.02, 0.83, 0.865], [-1.39, 0.825, 0.862], [-1.8, 0.8, 0.845], [-2.05, 0.745, 0.775]];   // x, the crest's height and its z (0: none, at the door)
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'quarterL' : 'quarterR', () => {
          const rings = HC.map(([x, yc, zc]) => { const yb = L.prop(x, 'ybelt'), w = L.prop(x, 'w'), yt = L.prop(x, 'yt'), wt = L.prop(x, 'wt');
            if (!yc) return [0, 1, 2, 3].map(() => [x, yb, sd * w]);
            const ze = zc - 0.08, ye = yb + (w - ze) / (w - wt) * (yt - yb) - 0.004;   // (the inner edge just under the window band)
            return [[x, yb, sd * w], [x, yb + 0.55 * (yc - yb), sd * (Math.max(w, zc) + 0.02)], [x, yc, sd * zc], [x, ye, sd * ze]]; });
          K.skin(rings, P, null, P);
        });
        // ---- the wipers on the cowl ----
        for (const z of [-0.5, 0.06]) K.bar([0.67, L.topY(0.67, z) + 0.012, z], [0.58, L.topY(0.58, z + 0.42) + 0.012, z + 0.42], 0.01, B, { n: 4, part: 'body' });
        // ---- the whale tail on the engine lid (the wing): its deck over the lid, the rubber lip round its edge, the intake grille ----
        K.part('wing', () => {
          const st = [[-1.48, 0, 0.44], [-1.62, 0.975, 0.52], [-1.82, 0.985, 0.58], [-2.0, 0.985, 0.6], [-2.09, 1.015, 0.6]];   // x, the deck's height (0: on the lid), its half width
          const rings = st.map(([x, yt, zo]) => {
            const end = x < -2.04, y0 = (z) => (end ? 0.945 : L.topY(x, z) - 0.012), top = yt || L.topY(x, 0) + 0.006, zi = zo - 0.035, zb = end ? zo : zo + 0.03;
            return [[x, y0(-zb), -zb], [x, top - 0.02, -zo], [x, top, -zi], [x, top, zi], [x, top - 0.02, zo], [x, y0(zb), zb]]; });
          K.skin(rings, (k, e) => e === 1 || e === 3 || (k === 3 && e === 2) ? B : P, P, B);
          K.rect(-1.8, 0.992, 0, 0.28, 0.68, B, { dir: 'y' });                                            // the intake grille on the deck
          for (const x of [-1.71, -1.77, -1.83, -1.89]) K.rect(x, 0.996, 0, 0.022, 0.64, [0.2, 0.2, 0.21], { dir: 'y' });
        }, { noCrush: true, noDent: true, hinge: [[-1.48, 0.94, -0.4], [-1.48, 0.94, 0.4]] });
        // ---- the impact bumpers: rounded, short black bellows at their ends, a rubber strip along the face, the plates; the front one with
        //      the indicators and a black lip under it ----
        const prof = [[0.07, -0.14], [-0.045, -0.14], [-0.065, -0.08], [-0.065, 0.08], [-0.045, 0.14], [0.07, 0.14]];   // (u in, v up)
        const bcol = (n) => (k, e) => k === 0 || k === n - 2 ? B : e === 5 ? D : P;
        K.part('bumperF', () => {
          const path = [[1.7, 0.37, -0.787], [1.76, 0.37, -0.785], [1.98, 0.37, -0.74], [2.065, 0.37, -0.6], [2.065, 0.37, 0.6], [1.98, 0.37, 0.74], [1.76, 0.37, 0.785], [1.7, 0.37, 0.787]];
          K.sweep(prof, path, bcol(path.length), { capA: B, capB: B });
          K.rect(2.131, 0.455, 0, 1.2, 0.04, B);                                                          // the rubber strip
          for (const sd of [-1, 1]) K.rect(2.131, 0.385, sd * 0.47, 0.17, 0.06, K.rgb(0xff9a1e));          // the indicators
          K.rect(2.131, 0.32, 0, 0.46, 0.1, [0.93, 0.93, 0.9]);                                          // the plate
          K.box(1.99, 0.14, 0, 0.16, 0.09, 1.38, 0, B);                                                  // the lip under it
        }, { hinge: [[2.05, 0.3, -0.6], [2.05, 0.3, 0.6]] });
        K.part('bumperR', () => {
          const path = [[-1.78, 0.38, 0.818], [-1.84, 0.38, 0.81], [-1.97, 0.38, 0.77], [-2.05, 0.38, 0.62], [-2.05, 0.38, -0.62], [-1.97, 0.38, -0.77], [-1.84, 0.38, -0.81], [-1.78, 0.38, -0.818]];
          K.sweep(prof, path, bcol(path.length), { capA: B, capB: B });
          K.rect(-2.116, 0.465, 0, 1.24, 0.04, B, { dir: '-x' });
          K.rect(-2.116, 0.36, 0, 0.5, 0.11, [0.93, 0.93, 0.9], { dir: '-x' });
          K.exhaust(-2.08, 0.19, -0.42, 0.045, 0.22, { part: 'bumperR' });
        }, { hinge: [[-2.04, 0.3, -0.6], [-2.04, 0.3, 0.6]] });
        // ---- the tail: the full-width light bar under the engine lid (one lamp each half: it lights right across) ----
        K.rect(-2.052, 0.655, 0, 1.54, 0.15, B, { dir: '-x', part: 'body' });
        for (const sd of [-1, 1]) K.tailLamp(-2.054, 0.655, sd * 0.38, 0.76, 0.1);
        // ---- the door mirrors (flag mirrors in the paint) ----
        for (const sd of [-1, 1]) K.mirror(0.55, 0.89, sd * 0.87, { w: 0.09, h: 0.075, d: 0.14, z0: sd * 0.785 });
        // ---- hinges: the lids at their edges by the glass, the doors at the front ----
        K.hinge('hood', [0.72, 0.84, -0.4], [0.72, 0.84, 0.4]);
        K.hinge('trunk', [-1.32, 0.97, -0.4], [-1.32, 0.97, 0.4]);
        for (const sd of [-1, 1]) K.hinge(sd < 0 ? 'doorL' : 'doorR', [0.68, 0.3, sd * 0.79], [0.68, 0.8, sd * 0.79]);
        // ---- inside (seen once a part is off): the seats, the +2 bench, the dashboard; the flat six behind the rear axle with its fan
        //      housing; the spare wheel and the tank under the front lid ----
        const SEAT = [0.36, 0.2, 0.12];
        for (const sd of [-1, 1]) K.seat(-0.3, 0.44, sd * 0.36, { w: 0.48, back: 0.62, tilt: 0.3, col: SEAT });
        K.seat(-0.98, 0.42, 0, { w: 1.0, l: 0.32, back: 0.4, tilt: 0.45, col: SEAT });
        K.box(0.46, 0.58, 0, 0.3, 0.26, 1.42, 0, D, null, false, { inner: true, part: 'body' });
        K.box(0.3, 0.76, -0.36, 0.1, 0.1, 0.46, 0, [0.06, 0.06, 0.07], null, false, { inner: true, part: 'body' });   // (the instruments' hood)
        K.inner(() => K.part('body', () => {                                                               // the steering wheel: its rim, its column
          const C = [0.16, 0.86, -0.36], rr = 0.18, pt = (a) => [C[0] - Math.sin(a) * rr * 0.6, C[1] + Math.sin(a) * rr * 0.8, C[2] + Math.cos(a) * rr];
          for (let i = 0; i < 8; i++) K.bar(pt(i * Math.PI / 4), pt((i + 1) * Math.PI / 4), 0.014, [0.05, 0.05, 0.055], { n: 3 });
          K.bar([0.36, 0.7, -0.36], C, 0.02, [0.1, 0.1, 0.11], { n: 4 });
        }));
        K.engine(-1.63, 0.26, 0, { l: 0.6, w: 0.46, h: 0.44, col: [0.42, 0.43, 0.45], cover: [0.14, 0.14, 0.15] });   // (the crankcase, its fan on top)
        for (const sd of [-1, 1]) K.box(-1.63, 0.3, sd * 0.34, 0.52, 0.2, 0.22, 0, [0.27, 0.27, 0.29], null, false, { inner: true, part: 'body' });   // the cylinder banks, lying flat
        K.cyl([-1.84, 0.6, 0], [-1.72, 0.6, 0], 0.17, [0.22, 0.22, 0.23], { n: 10, inner: true, part: 'body', capA: [0.55, 0.3, 0.1] });
        K.cyl([1.55, 0.24, 0], [1.55, 0.4, 0], 0.27, [0.06, 0.06, 0.065], { n: 10, inner: true, part: 'body', capB: [0.55, 0.56, 0.6] });
        K.box(1.02, 0.24, 0, 0.36, 0.24, 1.0, 0, [0.5, 0.51, 0.53], null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
