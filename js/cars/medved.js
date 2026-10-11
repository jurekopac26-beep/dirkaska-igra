/* Vehicle 'medved' — MEDVED 4x4: a boxy luxury off-roader dressed for the outback. Signature features: 1) a tall slab-sided box with flat
   glass, 2) a spare wheel on the side-hinged tailgate, a ladder beside it up to the roof, 3) a roof rack the length of the roof, a light bar
   across its front, its load (two sand boards, two jerrycans, a bag under a tarp), 4) round headlamps and a slatted grille behind a bull bar
   with a winch and two spot lamps, 5) flared arches over big all-terrain tyres, a snorkel up the right A-pillar, rock sliders under the
   doors. L 4.80 W 1.98 H 1.95, wheelbase 2.85, overhangs F 0.90 R 1.05 (m). */
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
    partNames: { tailgate: 'tailgate', roofRack: 'roof rack', bullBar: 'bull bar' },
    parts: { set: 'car', ht: 1.95, y0: 0.32, drop: ['trunk'],
      extra: {
        tailgate: { z: 1, th: 0.78, m: 12, rW: 0.4, h: 0.11, lx: -0.94, lz: 0, y: 1.11 },   // (with its spare wheel and the ladder on it)
        roofRack: { z: 1, th: 0.7, m: 6, rW: 0.4, h: 0.15, lx: -0.24, lz: 0, y: 1.88 },     // (with its light bar and its load)
        bullBar: { z: 0, th: 0.45, m: 10, rW: 0.22, h: 0.15, lx: 0.985, lz: 0, y: 0.97 },    // (steel: it takes the first knock, before the bumper)
      },
      // (where the look has them: the mirrors on the doors' front corners, the bonnet's middle, the bumpers' and the tailgate's faces; a
      // lost one flies off from there. The fenders lie as thick as their pods over the lamps)
      over: { mirrorL: { lx: 0.395, y: 1.31 }, mirrorR: { lx: 0.395, y: 1.31 }, hood: { lx: 0.655, y: 1.17 }, bumperF: { lx: 0.94 }, bumperR: { lx: -0.89 },
        fenderL: { h: 0.17 }, fenderR: { h: 0.17 } },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, the box: slab sides, flat glass leaning in a little, a flat roof (the
    // stripe colour: a two-tone roof), an upright windscreen, a flat bonnet; its end caps the grille's panel (front) and the tailgate (rear,
    // over the bumper). Each side: the fender, both doors (one part, their glass with them; the sill under them stays), the quarter under
    // the belt (its long window and the pillars stay with the roof). The bumpers, the bull bar in front of the grille, the tailgate with the
    // spare and the ladder on it, the roof rack with the light bar and the load, the black flares over the tyres (with the fenders and the
    // quarters), the snorkel (with the right fender) in their parts. What the two cameras see first (from above, from behind) gets the
    // triangles: the rack's load, the bonnet, the bull bar's top; nothing under the bumpers
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
      // bonnet over the fenders' tops. (The doors' front edge at the cowl's section: no sliver of a segment between them)
      regions: [
        { part: 'doorL', x: [-0.86, 1.06], bands: ['side', 'window'], side: 'L', y: [0.5, 1.85] },
        { part: 'doorR', x: [-0.86, 1.06], bands: ['side', 'window'], side: 'R', y: [0.5, 1.85] },
        { part: 'fenderL', x: [1.06, 2.3], bands: ['tuck', 'side', 'window'], side: 'L', y: [-1, 1.3] },
        { part: 'fenderR', x: [1.06, 2.3], bands: ['tuck', 'side', 'window'], side: 'R', y: [-1, 1.3] },
        { part: 'quarterL', x: [-2.3, -0.86], bands: ['tuck', 'side'], side: 'L', y: [-1, 1.25] },
        { part: 'quarterR', x: [-2.3, -0.86], bands: ['tuck', 'side'], side: 'R', y: [-1, 1.25] },
        { part: 'hood', x: [1.06, 2.3], bands: ['window', 'edge', 'crown'], top: true },
      ],
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, CH = K.chrome, D = [0.12, 0.12, 0.13], DK = [0.07, 0.07, 0.075], AL = [0.6, 0.61, 0.64];
        const T = [0.17, 0.17, 0.18];   // (the steel tubes: the bull bar, the sliders, the ladder: dark grey)
        // a flat convex polygon turned to face n (K.face shows only the side its points run counter-clockwise from)
        const faceTo = (pts, n, col, o) => { const [a, b, c] = pts, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
          const m = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
          K.face(m[0] * n[0] + m[1] * n[1] + m[2] * n[2] < 0 ? pts.slice().reverse() : pts, col, o); };
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
        for (const x of [0.01, -0.86, 1.05]) LD.side([[x - 0.008, 0.58], [x + 0.008, 0.58], [x + 0.008, 1.19], [x - 0.008, 1.19]], DK, null, 0.01);
        for (const sd of [-1, 1]) for (const x of [0.16, -0.72]) K.rect(x, 1.06, sd * 0.942, 0.17, 0.035, CH, { dir: sd < 0 ? '-z' : 'z' });
        K.rect(-1.76, 1.02, 0.938, 0.11, 0.11, DK, { dir: 'z' });                      // the fuel filler's flap (right quarter)
        // ---- the flares over the big tyres (black), the arch's ledge under them ----
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.44, 0.54, sd * 0.86, sd * 0.995, D, { n: 5 });
        // ---- the nose: the slatted grille between two round head lamps (in the fenders: they go with them), the indicators under them ----
        K.grille(2.256, 0.87, 0, 0.78, 0.36, { slats: 4, slatCol: [0.78, 0.79, 0.82], slatH: 0.034, frame: CH, frameH: 0.018 });
        for (const sd of [-1, 1]) { const f = sd < 0 ? 'fenderL' : 'fenderR';
          K.box(2.265, 0.68, sd * 0.69, 0.03, 0.41, 0.4, 0, P, null, true, { part: f });     // (the fender's front: a pod proud of the grille)
          K.headLamp(2.284, 0.88, sd * 0.69, 0.105, { ring: null, n: 8, host: f });
          K.discX(2.285, 0.88, sd * 0.69, 0.122, 8, CH, 1, { host: f });                   // (a chrome ring round the lens)
          K.rect(2.282, 0.725, sd * 0.69, 0.18, 0.05, K.rgb(0xff9a1e), { host: f }); }
        // the wipers parked on the cowl (flat strips)
        for (const z of [-0.42, 0.28]) { const a = [1.09, 1.215, z - 0.3], b = [1.075, 1.24, z + 0.3], o = [0.0101, -0.0044, 0];
          faceTo([[a[0] + o[0], a[1] + o[1], a[2]], [b[0] + o[0], b[1] + o[1], b[2]], [b[0] - o[0], b[1] - o[1], b[2]], [a[0] - o[0], a[1] - o[1], a[2]]], [0.4, 0.92, 0], B, { part: 'body' }); }
        // the mirrors: big, on the doors' front corners
        for (const sd of [-1, 1]) K.mirror(0.95, 1.33, sd * 0.97, { w: 0.08, h: 0.17, d: 0.12, z0: sd * 0.925, col: P, arm: B, crack: 1 });   // (crack: its glass breaks, it folds in: Razbijanje · nov način)
        // ---- the bonnet (seen from above): a low bulge down its middle rising to the cowl, a vent grille each side of it, louvres across ----
        K.skin([[2.02, 0.004, 0.2], [1.16, 0.032, 0.26]].map(([x, h, w]) => { const y = L.topY(x, 0) - 0.004; return [[x, y, -w], [x, y + h, -w * 0.82], [x, y + h, w * 0.82], [x, y, w]]; }), P, null, P, { part: 'hood' });
        const onTop = (x0, x1, z0, z1, lift) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => [x, L.topY(x, z) + lift, z]);
        for (const sd of [-1, 1]) {
          faceTo(onTop(1.3, 1.72, sd * 0.45, sd * 0.62, 0.006), [0, 1, 0], B, { part: 'hood' });
          for (const x of [1.44, 1.58]) faceTo(onTop(x - 0.022, x + 0.022, sd * 0.455, sd * 0.615, 0.009), [0, 1, 0], [0.3, 0.3, 0.32], { part: 'hood' });
        }
        // ---- the front bumper: black, square, wrapped round the corners; the plate (the bull bar's spot lamps light the way) ----
        K.part('bumperF', () => {
          K.box(2.31, 0.36, 0, 0.18, 0.28, 1.8, 0, D, null, true);
          for (const sd of [-1, 1]) K.box(2.13, 0.38, sd * 0.88, 0.2, 0.24, 0.1, 0, D, null, true);
          K.rect(2.403, 0.5, 0, 0.5, 0.11, [0.93, 0.93, 0.9]);
        }, { hinge: [[2.3, 0.36, -0.9], [2.3, 0.36, 0.9]] });
        // ---- the bull bar (its own part): a hoop over the grille standing on the bumper, its wings out under the head lamps to the bumper's
        //      corners, the winch's drum on the bumper inside the hoop, two round spot lamps on its top bar (it tips forward off the car) ----
        K.part('bullBar', () => {
          K.sweep([[-0.03, -0.03], [0.03, -0.03], [0.03, 0.03], [-0.03, 0.03]], [[2.37, 0.62, -0.38], [2.38, 1.08, -0.38], [2.38, 1.08, 0.38], [2.37, 0.62, 0.38]], T);
          for (const sd of [-1, 1]) K.bar([2.38, 0.95, sd * 0.38], [2.35, 0.64, sd * 0.86], 0.026, T, { n: 4 });
          K.cyl([2.33, 0.71, -0.17], [2.33, 0.71, 0.17], 0.06, [0.42, 0.42, 0.44], { n: 6, capA: T, capB: T });   // (the cable on the drum)
          for (const sd of [-1, 1]) K.cyl([2.34, 1.18, sd * 0.22], [2.42, 1.18, sd * 0.22], 0.068, B, { n: 6, capB: K.lampHead });
        }, { hinge: [[2.37, 0.62, -0.38], [2.37, 0.62, 0.38]] });
        // ---- the snorkel up the right A-pillar (from the right front wing: it goes with it), its intake facing forward over the roof line ----
        K.hinge('fenderR', [1.06, 0.44, 0.995], [1.06, 1.25, 0.995]);   // (as the left one: at its edge by the door, the snorkel's top behind it)
        K.part('fenderR', () => K.sweep([[-0.04, -0.04], [0.04, -0.04], [0.04, 0.04], [-0.04, 0.04]], [[1.2, 0.98, 0.975], [1.12, 1.24, 0.972], [0.84, 1.9, 0.93], [0.96, 1.97, 0.93]], B, { capB: [0.26, 0.26, 0.28] }));
        // ---- the tail: the lamps up the corners (their black surrounds on the quarters), the bumper, the tailgate (its window, hinges on the
        //      right, handle, the ladder on its left) ----
        for (const sd of [-1, 1]) { K.rect(-2.163, 0.9, sd * 0.8, 0.17, 0.44, B, { dir: '-x', part: sd < 0 ? 'quarterL' : 'quarterR' }); K.tailLamp(-2.17, 0.92, sd * 0.8, 0.13, 0.36); }
        K.part('bumperR', () => {
          K.box(-2.19, 0.36, 0, 0.14, 0.28, 1.8, 0, D, null, true);
          for (const sd of [-1, 1]) K.box(-2.06, 0.38, sd * 0.88, 0.2, 0.24, 0.1, 0, D, null, true);
          K.rect(-2.262, 0.62, 0, 0.9, 0.04, AL, { dir: '-x' });                              // (the step plate along its top)
          K.rect(-2.262, 0.47, 0, 0.5, 0.11, [0.93, 0.93, 0.9], { dir: '-x' });               // (the number plate)
        }, { hinge: [[-2.2, 0.36, -0.9], [-2.2, 0.36, 0.9]] });
        K.part('tailgate', () => {
          K.rect(-2.163, 1.6, 0, 1.24, 0.26, G, { dir: '-x' });                               // the window over the spare
          for (const y of [0.9, 1.5]) K.rect(-2.163, y, 0.67, 0.08, 0.07, B, { dir: '-x' });   // the hinges (on the right)
          K.rect(-2.163, 1.0, -0.6, 0.05, 0.14, B, { dir: '-x' });                            // the handle (on the left, between the ladder's rungs)
          for (const sd of [-1, 1]) K.rect(-2.162, 1.2, sd * 0.705, 0.014, 1.1, DK, { dir: '-x' });   // (its shut lines)
          faceTo([[-2.167, 1.494, -0.1], [-2.167, 1.554, 0.45], [-2.167, 1.566, 0.45], [-2.167, 1.506, -0.1]], [-1, 0, 0], B);   // the wiper (flat on the glass)
          // the ladder left of the spare, up to the roof rack: two square rails standing off the gate, the rungs between them
          for (const z of [-0.46, -0.68]) K.bar([-2.205, 0.7, z], [-2.175, 1.95, z], 0.016, T, { n: 4 });
          for (const y of [0.86, 1.13, 1.4, 1.67]) K.rect(-2.205 + (y - 0.7) * 0.024, y, -0.57, 0.22, 0.026, T, { dir: '-x' });
        }, { hinge: [[-2.17, 0.66, 0.84], [-2.17, 1.74, 0.84]] });
        // ---- the spare wheel on the tailgate (its carrier on the gate's frame): the tyre, a cover over the rim in the paint; it swings open and
        //      leaves with the gate (or by itself: its sub-range 'spare') ----
        K.part('tailgate', () => {
          const TY = [0.045, 0.045, 0.05], ring = (x) => { const R = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 0.35 : 0.38; R.push([x, 1.06 + Math.sin(a) * r, Math.cos(a) * r]); } return R; };
          K.skin([ring(-2.18), ring(-2.41)], TY, null, TY);                                  // the tyre: its tread in blocks (its face to the gate unseen)
          K.discX(-2.412, 1.06, 0, 0.235, 10, [0.66, 0.67, 0.7], -1);                       // the rim's edge round
          K.discX(-2.417, 1.06, 0, 0.2, 10, P, -1);                                         // a cover over it, in the paint
          K.bar([-2.2, 0.98, 0], [-2.17, 0.66, 0], 0.03, B, { n: 4 });                       // the carrier's arm down to the frame
        }, { sub: 'spare' });   // (its own sub-range: Razbijanje · nov način knocks it off the gate in a hard crash from behind)
        // ---- the roof rack the length of the roof (never crushed): the frame on its feet, a slat either side of the start number; the light bar
        //      as its front member (four round lamps); the load on it, seen from above: two orange sand boards along its sides, two jerrycans
        //      lying at its back, a bag under a tarp strapped down at its front ----
        K.part('roofRack', () => {
          for (const sd of [-1, 1]) K.box(-0.68, 1.865, sd * 0.8, 2.68, 0.095, 0.05, 0, B, null, true);   // the frame: its sides, its rear end
          K.box(-2.015, 1.865, 0, 0.05, 0.095, 1.65, 0, B, null, true);
          for (const x of [-0.18, -1.13]) K.box(x, 1.865, 0, 0.05, 0.035, 1.56, 0, B, null, true);   // the slats across (clear of the number)
          for (const sd of [-1, 1]) for (const x of [0.5, -0.65, -1.85]) K.rect(x, 1.828, sd * 0.826, 0.07, 0.076, D, { dir: sd < 0 ? '-z' : 'z' });   // its feet
          K.box(0.675, 1.86, 0, 0.1, 0.12, 1.65, 0, B, null, true);                          // the light bar
          for (const z of [-0.5, -0.17, 0.17, 0.5]) K.discX(0.727, 1.92, z, 0.042, 6, K.lampHead, 1);
          const OR = K.rgb(0xf08a1c), ORD = [0.6, 0.29, 0.05], GN = [0.16, 0.26, 0.12], TP = [0.52, 0.48, 0.36];
          for (const sd of [-1, 1]) {   // the sand boards (their studded tread darker)
            K.box(-1.37, 1.9, sd * 0.6, 1.15, 0.04, 0.32, 0, OR, null, true);
            for (const x of [-1.75, -1.37, -0.99]) K.rect(x, 1.942, sd * 0.6, 0.2, 0.2, ORD, { dir: 'y' });
          }
          for (const z of [-0.19, 0.19]) K.box(-1.74, 1.9, z, 0.47, 0.17, 0.34, 0, GN, [0.2, 0.32, 0.15], true);   // the jerrycans (dark green)
          const bag = [[-0.4, 0], [-0.43, 0.12], [-0.34, 0.24], [0.34, 0.24], [0.43, 0.12], [0.4, 0]];
          K.skin([0.0, 0.55].map(x => bag.map(([z, h]) => [x, 1.9 + h, z])), TP, TP, TP);   // the bag under its tarp, its two straps
          for (const x of [0.13, 0.42]) K.rect(x, 2.143, 0, 0.045, 0.66, B, { dir: 'y' });
        }, { noCrush: true, hinge: [[-2.0, 1.85, -0.8], [-2.0, 1.85, 0.8]] });
        // ---- the rock sliders under the doors (square tubes along the sills, their ends at the flares), the mud flaps behind the wheels ----
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            K.bar([-0.84, 0.45, sd * 0.95], [0.97, 0.45, sd * 0.95], 0.034, T, { n: 4 });
            for (const x of [1.03, -1.8]) K.rect(x, 0.27, sd * 0.85, 0.27, 0.34, B, { dir: '-x' });
          }
        });
        K.hinge('hood', [1.08, 1.19, -0.8], [1.08, 1.19, 0.8]);
        K.hinge('doorL', [1.05, 0.6, -0.93], [1.05, 1.2, -0.93]); K.hinge('doorR', [1.05, 0.6, 0.93], [1.05, 1.2, 0.93]);
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
