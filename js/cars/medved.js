/* Vehicle 'medved' — MEDVED 4x4: a boxy luxury off-roader. Signature features: 1) a tall slab-sided box with flat glass, 2) a spare wheel
   on the side-hinged tailgate, 3) a roof rack the length of the roof, 4) round headlamps and a slatted grille, 5) flared arches over big
   all-terrain tyres. L 4.80 W 1.98 H 1.95, wheelbase 2.85, overhangs F 0.90 R 1.05 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'medved', name: 'MEDVED 4x4', cat: 'teren', ord: 2, drive: 'AWD',
    desc: 'Škatlast luksuzni terenec z rezervnim kolesom na zadnjih vratih in strešnim nosilcem.',
    phys: { mass: 2300, a: 1.5, b: 1.35, kI: 1.4, kw: 430, redline: 6200, idle: 700, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 5.53, rw: 0.38, cDrag: 0.62, len: 4.8, wid: 1.98, steerMax: 0.6,
      tracK: 0.85, brakeK: 0.85, spinK: 0.4, loose: 1.15, looseDrag: 0.5, landV: 16, landK: 0.6, sway: 1.6 },
    arc: { amax: 1.56, kv: 1.85, rmin: 5.6 },
    csp: { bx: 0.12, coast: -0.07, thr: -0.015, liftP: 0, pwr: 0.03, out: 1.05, turn: 0.85, w: 0.95, tv: 1.15 },   // (the AWD layer: steady, straightens quickly; its own coast, turn, out, w, tv)
    stats: { power: 9, grip: 4, weight: 1, drift: 8 },
    price: 50000, pk: 'open', field: ['medved'],
    snd: { kind: 'v8', hz: 0.8, loud: 1.1 },
    expect: { t100: [3.18, 3.73], vmax: [184, 195], latG: [1.99, 2.09], d100: [25.8, 28.5] },
    partNames: { tailgate: 'tailgate', spare: 'spare wheel', roofRack: 'roof rack' },
    parts: { set: 'car', ht: 1.95, y0: 0.32, drop: ['trunk'],
      extra: {
        tailgate: { z: 1, th: 0.78, m: 12, rW: 0.4, h: 0.07, lx: -0.9, lz: 0, y: 1.3 },
        spare: { z: 1, th: 0.6, m: 10, r: 0.42, h: 0.3, lx: -0.955, lz: 0, y: 1.04 },
        roofRack: { z: 1, th: 0.7, m: 6, rW: 0.4, h: 0.15, lx: -0.24, lz: 0, y: 1.88 },
      },
      // (where the look has them: the mirrors on the doors' front corners, the bonnet's middle, the bumpers' and the tailgate's faces; a
      // lost one flies off from there)
      over: { mirrorL: { lx: 0.395, y: 1.31 }, mirrorR: { lx: 0.395, y: 1.31 }, hood: { lx: 0.655, y: 1.17 }, bumperF: { lx: 0.94 }, bumperR: { lx: -0.89 } },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, the box: slab sides, flat glass leaning in a little, a flat roof (the
    // stripe colour: a two-tone roof), an upright windscreen, a flat bonnet; its end caps the grille's panel (front) and the tailgate (rear,
    // over the bumper). Each side: the fender, both doors (one part; the sill under them stays), the quarter with its long window. The
    // bumpers, the spare on the tailgate, the roof rack, the black flares over the tyres in their parts
    look: {
      body: { len: 4.8, wid: 1.98,
        //       x      w      yb    ybelt  wt     yt     cr    kind  tuck
        secs: [[-2.16, 0.905, 0.47, 1.19, 0.835, 1.775, 0.012, 'b', 0.1],   // the tail: its face the tailgate, a little in (the corners rounded)
          [-2.11, 0.93, 0.44, 1.2, 0.86, 1.8, 0.018, 'r', 0.12],            // the roof's rear edge (a flat roof)
          [0.8, 0.93, 0.44, 1.2, 0.86, 1.8, 0.018, 'gf', 0.12],             // the windscreen's top: upright, flat
          [1.06, 0.93, 0.44, 1.18, 0.905, 1.19, 0.012, 'b', 0.12],          // its base (the cowl)
          [2.19, 0.925, 0.46, 1.15, 0.9, 1.16, 0.012, 'b', 0.12],           // the flat bonnet's front edge
          [2.25, 0.9, 0.5, 1.12, 0.875, 1.13, 0.008, 'b', 0.12]],           // the nose: the grille's panel
        eye: { x: 0.25, y: 1.6, near: 0.25, tilt: 0.06, style: 'closed' },   // (sitting high, close behind the upright windscreen)
        crush: { x0: -2.08, x1: 1.0, z: 0.86 } },
      wheels: { style: 'knob', w: 0.27, rimK: 0.58, rim: [0.66, 0.67, 0.7], cap: [0.28, 0.28, 0.3], gap: 0.06 },
      // the parts' regions (look units): the doors from behind the front arch to the rear door's edge (side, window: their glass), the
      // fenders forward of them, the quarters behind them under the belt (the long window, the C- and D-pillars stay with the roof), the
      // bonnet over the fenders' tops
      regions: [
        { part: 'doorL', x: [-0.86, 1.04], bands: ['side', 'window'], side: 'L', y: [0.5, 1.85] },
        { part: 'doorR', x: [-0.86, 1.04], bands: ['side', 'window'], side: 'R', y: [0.5, 1.85] },
        { part: 'fenderL', x: [1.04, 2.3], bands: ['tuck', 'side', 'window'], side: 'L', y: [-1, 1.3] },
        { part: 'fenderR', x: [1.04, 2.3], bands: ['tuck', 'side', 'window'], side: 'R', y: [-1, 1.3] },
        { part: 'quarterL', x: [-2.3, -0.86], bands: ['tuck', 'side'], side: 'L', y: [-1, 1.25] },
        { part: 'quarterR', x: [-2.3, -0.86], bands: ['tuck', 'side'], side: 'R', y: [-1, 1.25] },
        { part: 'hood', x: [1.06, 2.3], bands: ['window', 'edge', 'crown'], top: true },
      ],
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, CH = K.chrome, D = [0.12, 0.12, 0.13], DK = [0.07, 0.07, 0.075], AL = [0.6, 0.61, 0.64];
        // ---- the shell: the paint; the glass (the windscreen, the side windows door to tail); the roof in the stripe colour; dark sills ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : D;
          if (kind === 'gf') return e >= 3 && e <= 5 ? G : (e === 2 || e === 6) && at.x < 1.04 ? G : P;
          if (kind === 'r') return e >= 3 && e <= 5 ? S : e === 2 || e === 6 ? G : P;
          if (at.x < 0 && e >= 3 && e <= 5) return S;                       // (the roof's rounded rear edge)
          return P;
        }, { caps: { front: { col: P, cut: 0.64, low: 'bumperF', high: 'body' }, rear: { col: P, cut: 0.64, low: 'bumperR', high: 'tailgate' } } });
        const LD = L.decal;
        // the pillars over the glass (paint): the B-pillar between the doors (the body's: it stays when the doors go), the C-pillar behind the
        // rear door, the broad D-pillar at the tail; the windscreen's frame up its sides (on the top's edge)
        LD.band([[-0.03, 0], [0.05, 0], [0.05, 1], [-0.03, 1]], P, null, 0.008, { part: 'body' });
        LD.band([[-0.94, 0], [-0.86, 0], [-0.86, 1], [-0.94, 1]], P, null, 0.008);
        LD.band([[-2.11, 0], [-1.88, 0], [-1.88, 1], [-2.11, 1]], P, null, 0.008);
        for (const sd of [-1, 1]) LD.top([[0.8, sd * 0.79], [1.06, sd * 0.835], [1.06, sd * 0.905], [0.8, sd * 0.86]], P, 0.006);
        for (const [z0, z1] of [[-0.865, -0.33], [-0.33, 0.33], [0.33, 0.865]]) LD.top([[0.8, z0], [0.835, z0], [0.835, z1], [0.8, z1]], P, 0.006);   // (its header)
        // the side: a black rubbing strip along the doors, the shut lines, the handles
        LD.side([[-0.84, 0.8], [1.02, 0.8], [1.02, 0.87], [-0.84, 0.87]], B, null, 0.008);
        LD.side([[-0.84, 0.828], [1.02, 0.828], [1.02, 0.842], [-0.84, 0.842]], CH, null, 0.011);   // (its chrome insert)
        for (const x of [0.01, -0.86, 1.04]) LD.side([[x - 0.008, 0.58], [x + 0.008, 0.58], [x + 0.008, 1.19], [x - 0.008, 1.19]], DK, null, 0.01);
        for (const sd of [-1, 1]) for (const x of [0.16, -0.72]) K.rect(x, 1.06, sd * 0.942, 0.17, 0.035, CH, { dir: sd < 0 ? '-z' : 'z' });
        // ---- the flares over the big tyres (black), the arch's ledge under them ----
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.44, 0.54, sd * 0.86, sd * 0.995, D, { n: 7 });
        // ---- the nose: the slatted grille between two round head lamps (in the fenders: they go with them), the indicators under them ----
        K.grille(2.256, 0.87, 0, 0.78, 0.36, { slats: 4, slatCol: [0.78, 0.79, 0.82], slatH: 0.034, frame: CH, frameH: 0.018 });
        for (const sd of [-1, 1]) { const f = sd < 0 ? 'fenderL' : 'fenderR';
          K.box(2.265, 0.68, sd * 0.69, 0.03, 0.41, 0.4, 0, P, null, true, { part: f });     // (the fender's front: a pod proud of the grille)
          K.headLamp(2.284, 0.88, sd * 0.69, 0.105, { ring: B, host: f });
          K.discX(2.285, 0.88, sd * 0.69, 0.116, 10, CH, 1, { host: f });                  // (a chrome ring round the lens)
          K.rect(2.282, 0.725, sd * 0.69, 0.18, 0.05, K.rgb(0xff9a1e), { host: f }); }
        // the wipers on the cowl
        for (const z of [-0.42, 0.28]) K.bar([1.09, 1.215, z - 0.3], [1.075, 1.24, z + 0.3], 0.011, B, { n: 4, part: 'body' });
        // the mirrors: big, on the doors' front corners
        for (const sd of [-1, 1]) K.mirror(0.95, 1.33, sd * 0.98, { w: 0.08, h: 0.17, d: 0.12, z0: sd * 0.925, col: P, arm: B });
        // ---- the front bumper: black, square, wrapped round the corners; the skid plate, the fog lamps, the plate ----
        K.part('bumperF', () => {
          K.box(2.31, 0.36, 0, 0.18, 0.28, 1.8, 0, D);
          for (const sd of [-1, 1]) K.box(2.13, 0.38, sd * 0.88, 0.2, 0.24, 0.1, 0, D);
          K.plate([[2.39, 0.37, -0.44], [2.39, 0.37, 0.44], [2.0, 0.28, 0.44], [2.0, 0.28, -0.44]], 0.035, [0.2, 0.2, 0.22]);   // (the skid plate under it)
          for (const sd of [-1, 1]) K.discX(2.403, 0.5, sd * 0.66, 0.045, 8, [0.95, 0.93, 0.8]);
          K.rect(2.403, 0.5, 0, 0.5, 0.11, [0.93, 0.93, 0.9]);
        }, { hinge: [[2.3, 0.36, -0.9], [2.3, 0.36, 0.9]] });
        // ---- the tail: the lamps up the corners (on the quarters), the bumper, the tailgate (its window, hinges on the right, handle) ----
        for (const sd of [-1, 1]) { K.box(-2.185, 0.68, sd * 0.8, 0.05, 0.44, 0.17, 0, B, null, false, { part: sd < 0 ? 'quarterL' : 'quarterR' }); K.tailLamp(-2.212, 0.92, sd * 0.8, 0.13, 0.36); }
        K.part('bumperR', () => {
          K.box(-2.19, 0.36, 0, 0.14, 0.28, 1.8, 0, D);
          for (const sd of [-1, 1]) K.box(-2.06, 0.38, sd * 0.88, 0.2, 0.24, 0.1, 0, D);
          K.rect(-2.262, 0.62, 0, 0.9, 0.04, AL, { dir: '-x' });                              // (the step plate along its top)
          K.rect(-2.262, 0.47, 0, 0.5, 0.11, [0.93, 0.93, 0.9], { dir: '-x' });               // (the number plate)
        }, { hinge: [[-2.2, 0.36, -0.9], [-2.2, 0.36, 0.9]] });
        K.part('tailgate', () => {
          K.rect(-2.163, 1.6, 0, 1.24, 0.26, G, { dir: '-x' });                               // the window over the spare
          for (const y of [0.9, 1.5]) K.rect(-2.163, y, 0.67, 0.08, 0.07, B, { dir: '-x' });   // the hinges (on the right)
          K.rect(-2.163, 1.0, -0.6, 0.05, 0.14, B, { dir: '-x' });                            // the handle (on the left)
          for (const sd of [-1, 1]) K.rect(-2.162, 1.2, sd * 0.705, 0.014, 1.1, DK, { dir: '-x' });   // (its shut lines)
          K.bar([-2.17, 1.5, -0.1], [-2.17, 1.56, 0.45], 0.01, B, { n: 4 });                 // the wiper
        }, { hinge: [[-2.17, 0.66, 0.84], [-2.17, 1.74, 0.84]] });
        // ---- the spare wheel on the tailgate (its carrier into the frame): the tyre, a cover over the rim in the paint ----
        K.part('spare', () => {
          const TY = [0.045, 0.045, 0.05], ring = (x) => { const R = []; for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10, r = i % 2 ? 0.35 : 0.38; R.push([x, 1.06 + Math.sin(a) * r, Math.cos(a) * r]); } return R; };
          K.skin([ring(-2.18), ring(-2.41)], TY, TY, TY);                                     // the tyre: its tread in blocks
          K.discX(-2.412, 1.06, 0, 0.235, 10, [0.66, 0.67, 0.7], -1);                       // the rim's edge round
          K.discX(-2.417, 1.06, 0, 0.2, 10, P, -1);                                         // a cover over it, in the paint
          K.box(-2.17, 0.95, 0, 0.02, 0.22, 0.22, 0, B);                                     // the carrier, its arm down to the frame
          K.bar([-2.2, 0.98, 0], [-2.17, 0.58, 0], 0.03, B, { n: 4 });
        });
        // ---- the roof rack the length of the roof: the frame on its feet, the slats, a wind deflector at its front (never crushed) ----
        K.part('roofRack', () => {
          for (const sd of [-1, 1]) K.box(-0.68, 1.865, sd * 0.8, 2.68, 0.095, 0.05, 0, B, null, true);   // the frame: its sides, its ends
          for (const x of [0.655, -2.015]) K.box(x, 1.865, 0, 0.05, 0.095, 1.65, 0, B, null, true);
          for (const x of [0.25, -0.18, -1.13, -1.57]) K.box(x, 1.865, 0, 0.05, 0.035, 1.56, 0, B, null, true);   // the slats across (clear of the number)
          for (const sd of [-1, 1]) K.box(-0.68, 1.86, sd * 0.5, 2.62, 0.03, 0.06, 0, D, null, true);   // and along
          for (const sd of [-1, 1]) for (const x of [0.5, -0.65, -1.85]) K.box(x, 1.79, sd * 0.8, 0.07, 0.076, 0.06, 0, D, null, true);   // its feet
          K.plate([[0.7, 1.83, -0.76], [0.7, 1.83, 0.76], [0.64, 1.95, 0.76], [0.64, 1.95, -0.76]], 0.012, B);   // the wind deflector
        }, { noCrush: true, hinge: [[-2.0, 1.85, -0.8], [-2.0, 1.85, 0.8]] });
        K.hinge('hood', [1.08, 1.19, -0.8], [1.08, 1.19, 0.8]);
        K.hinge('doorL', [1.03, 0.6, -0.93], [1.03, 1.2, -0.93]); K.hinge('doorR', [1.03, 0.6, 0.93], [1.03, 1.2, 0.93]);
        // ---- inside (seen once a part is off): the seats, the rear bench, the dashboard and the wheel, the B-pillars' feet; the V8 ----
        for (const sd of [-1, 1]) K.seat(0.25, 0.95, sd * 0.42, { w: 0.52, back: 0.7 });
        K.seat(-0.62, 0.95, 0, { w: 1.5, back: 0.66 });
        K.box(0.85, 1.0, 0, 0.3, 0.24, 1.7, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([0.62, 1.2, -0.42], [0.58, 1.3, -0.42], 0.19, [0.1, 0.1, 0.11], { n: 8, inner: true, part: 'body' });
        for (const sd of [-1, 1]) K.box(0.01, 0.5, sd * 0.89, 0.08, 0.7, 0.06, 0, P, null, false, { inner: true, part: 'body' });
        K.box(0.32, 0.47, 0, 0.62, 0.42, 0.24, 0, D, null, false, { inner: true, part: 'body' });   // the console between the front seats
        // the load behind the rear bench (what the chase camera sees once the tailgate is gone): two jerrycans, a crate; the housings over the
        // rear wheels (the tubs are seen from outside only: from the load bay they would show the tyres)
        for (const sd of [-1, 1]) K.box(-1.35, 0.46, sd * 0.75, 0.92, 0.42, 0.26, 0, K.lining, null, true, { inner: true, part: 'body' });
        for (const z of [0.52, 0.28]) K.box(-1.95, 0.47, z, 0.32, 0.46, 0.16, 0, [0.27, 0.33, 0.18], null, true, { inner: true, part: 'body' });
        K.box(-1.62, 0.47, -0.36, 0.48, 0.34, 0.5, 0, [0.42, 0.33, 0.22], null, true, { inner: true, part: 'body' });   // (clear of the wheel's tub)
        K.engine(1.68, 0.62, 0, { l: 0.72, w: 0.66, h: 0.46 });
      },
    },
  });
})();
