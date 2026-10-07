/* Vehicle 'gad' — GAD 7L: a 1960s V8 roadster. Signature features: 1) bulging flared wheel arches front and rear, 2) side exhaust pipes
   along the sills, 3) a roll bar behind the seats, 4) an oval mouth with a bar across it, 5) twin racing stripes over the bonnet and the
   tail. L 3.96 W 1.73 H 1.22, wheelbase 2.29, overhangs F 0.78 R 0.89 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'gad', name: 'GAD 7L', cat: 'klasika', ord: 2, drive: 'FR',
    desc: 'Ameriški roadster iz 60-ih z velikim V8, stranskimi izpuhi in razširjenimi blatniki.',
    phys: { mass: 1100, a: 1.2, b: 1.09, kI: 1.12, kw: 300, redline: 6500, idle: 750, gears: [2.5, 1.75, 1.3, 1], final: 3.31, rw: 0.33, cDrag: 0.5, len: 3.96, wid: 1.73, steerMax: 0.62,
      tracK: 0.95, brakeK: 0.9, spinK: 1, aiGap: 7.5, aiPass: 4 },   // (aiGap / aiPass: its AI follows further back and passes wider: fewer pile-ups on the Nordschleife, tests/fleet.test.js 8b)
    arc: { amax: 1.58, kv: 1.9, rmin: 4.4 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.16, pwr: 0.14, out: 1.4, turn: 1.02, w: 0.97, tv: 1.1 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 8, grip: 4, weight: 8, drift: 10 },
    price: 55000, pk: 'ppo', field: ['gad'],
    snd: { kind: 'v8', hz: 0.9, loud: 1.2 },
    expect: { t100: [3.5, 4.11], vmax: [224, 238], latG: [2.02, 2.12], d100: [24.8, 27.4] },
    partNames: { pipeL: 'left side pipe', pipeR: 'right side pipe' },
    parts: { set: 'open', ht: 1.22, y0: 0.18,
      extra: {
        pipeL: { z: 2, th: 0.6, m: 3, r: 0.35, h: 0.1, lx: 0.05, lz: -0.94, f: 0.06 },   // (the pipes as the look has them: along the sills, x -0.56..0.72)
        pipeR: { z: 3, th: 0.6, m: 3, r: 0.35, h: 0.1, lx: 0.05, lz: 0.94, f: 0.06 },
      },
      // (where the look has them: the mirrors on the windscreen's posts, the boot lid between the hips)
      over: { mirrorL: { lx: 0.075, lz: -0.77, y: 0.99 }, mirrorR: { lx: 0.075, lz: 0.77, y: 0.99 }, trunk: { lx: -0.82 }, fenderL: { h: 0.14 }, fenderR: { h: 0.14 } },   // (the fenders with the humps lie as thick as they are)
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, the cockpit an open top (its 'r' segments without a top: the lining,
    // the floor and the bulkheads in the outer shell), the fenders bulging over the wheels (wider there, the humps higher than the bonnet)
    // with flared lips round the arches, the humps ending in a step at the nose (the lamps' faces) over the lower nose with the mouth; the
    // standard regions split it (the bonnet between the front humps, the boot lid between the rear ones, the doors, fenders, quarters, the
    // nose's and the tail's lower half the bumpers). The details: the oval mouth with its bar, the round lamps, the side pipes (pipeL /
    // pipeR), the windscreen in its frame, the roll bar behind the driver, the driver and the seats in sight; twin stripes in the stripe
    // colour over the bonnet and the tail (the crown's colour, the paint's gap down its middle); the V8 in the bay
    look: {
      body: { len: 3.96, wid: 1.73, roofY: 0.86, wz: 0.145, door: [0.26, -0.58], bumpF: 0.1, bumpY: [0.42, 0.44],
        //       x      w      yb    ybelt  wt    yt     cr     kind  tuck
        secs: [[-1.98, 0.6, 0.25, 0.56, 0.48, 0.66, 0.02, 'b', 0.08],      // the tail: its round lamps, the plate
          [-1.9, 0.74, 0.22, 0.62, 0.58, 0.76, 0.02, 'b', 0.09],
          [-1.827, 0.8, 0.2, 0.66, 0.63, 0.83, 0.0, 'b', 0.1],           // (the rear bumper's depth)
          [-1.65, 0.84, 0.2, 0.7, 0.67, 0.88, -0.03, 'b', 0.1],
          [-1.47, 0.855, 0.18, 0.72, 0.69, 0.9, -0.045, 'b', 0.1],       // the rear arch: the hips, higher than the boot lid between them
          [-1.09, 0.858, 0.18, 0.73, 0.7, 0.915, -0.06, 'b', 0.1],
          [-0.71, 0.835, 0.18, 0.7, 0.66, 0.85, -0.02, 'r', 0.1],        // the cockpit (open: no top), from the seats' backs
          [-0.58, 0.805, 0.17, 0.68, 0.65, 0.8, 0.02, 'r', 0.1],         // (the door's rear edge)
          [0.12, 0.8, 0.17, 0.68, 0.66, 0.81, 0.03, 'gf', 0.1],          // the scuttle under the windscreen (closed)
          [0.26, 0.805, 0.17, 0.69, 0.67, 0.83, 0.02, 'b', 0.1],         // the windscreen's base, the door's front edge
          [0.82, 0.84, 0.18, 0.71, 0.69, 0.87, -0.03, 'b', 0.1],         // the front arch: the humps over the wheels
          [1.2, 0.852, 0.18, 0.73, 0.7, 0.89, -0.055, 'b', 0.1],
          [1.58, 0.82, 0.2, 0.69, 0.66, 0.84, -0.045, 'b', 0.1],
          [1.75, 0.76, 0.22, 0.62, 0.6, 0.77, -0.04, 'b', 0.08],         // the humps run on to the lamps
          [1.86, 0.69, 0.235, 0.58, 0.56, 0.735, -0.05, 'b', 0.07],      // their ends: a step down to the nose (the lamps' faces)
          [1.88, 0.56, 0.24, 0.55, 0.46, 0.64, 0.04, 'b', 0.065],        // (the front bumper's depth)
          [1.945, 0.53, 0.245, 0.53, 0.44, 0.625, 0.025, 'b', 0.065],    // the nose rounding down to its face
          [1.98, 0.47, 0.255, 0.5, 0.38, 0.59, 0.0, 'b', 0.06]],         // the nose's face: the oval mouth
        eye: { x: -0.42, y: 1.02, near: 0.2, tilt: 0.06, style: 'open' },   // (low behind the windscreen, its top 0.19 over the eyes)
        decalX: 1.02, decalY: 0.838, decalRz: -0.005, decalS: 0.6, decalPart: 'hood',   // (the start number on the bonnet, over the stripes)
        crush: { x0: -0.06, x1: 0.3, z: 0.62 } },                         // (a roll-over folds the windscreen's frame; the roll bar stands)
      wheels: { style: 'deep', spokes: 8, w: 0.215, wR: 0.245, rim: [0.7, 0.7, 0.68], cap: [0.86, 0.87, 0.9], gap: 0.05 },
      // the standard regions, but the bonnet stops at the humps' ends (the nose round the mouth is the body's) and the boot lid lies
      // between the hips behind the roll bar's deck (no rear glass: the default takes the tail's last 25 cm)
      regions: (std) => std.map(r => r.part === 'hood' ? Object.assign({}, r, { x: [r.x[0], 1.88] }) : r.part === 'trunk' ? Object.assign({}, r, { x: [r.x[0], -1.09] }) : r),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, CH = K.chrome, G = K.GLASS, D = [0.09, 0.09, 0.1], IN = [0.11, 0.1, 0.09];
        // ---- the shell: the paint; the cockpit's top open; the sills a shade darker, black ledges in the arches ----
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return at.arch ? B : K.shade(P, 0.62);
          if (kind === 'r' && e >= 3 && e <= 5) return null;
          return e === 4 ? S : P;   // (the crown: the stripes' colour, a gap of paint laid down its middle: the twin stripes)
        }, { caps: { front: { col: P }, rear: { col: P, high: 'body' } } });
        const DC = L.decal;
        // the twin stripes' gap: over the scuttle, the bonnet and the nose; over the deck behind the cockpit, the boot lid and the tail
        for (const [x0, x1] of [[0.12, 1.98], [-1.98, -0.71]]) DC.top([[x0, -0.045], [x1, -0.045], [x1, 0.045], [x0, 0.045]], P, 0.004);
        // the doors' shut lines (front and rear edge, the side and the shoulder up to the cockpit's rim)
        for (const x of [-0.57, 0.25]) { DC.side([[x - 0.005, 0.27], [x + 0.005, 0.27], [x + 0.005, 0.7], [x - 0.005, 0.7]], K.shade(P, 0.5), null, 0.004);
          DC.band([[x - 0.005, 0], [x + 0.005, 0], [x + 0.005, 1], [x - 0.005, 1]], K.shade(P, 0.5), null, 0.004); }
        // the vents behind the front wheels (a slot rounded along the arch)
        DC.side([[0.66, 0.44], [0.74, 0.44], [0.785, 0.5], [0.785, 0.6], [0.74, 0.66], [0.66, 0.66]], D, null, 0.006);
        // the flared lips round the arches (the fenders' and the quarters')
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.38, 0.425, sd * 0.82, sd * 0.865, P, { n: 6 });
        // ---- the nose: the oval mouth (black) with a chrome bar across; the round lamps in the humps' ends, the indicators under them ----
        K.part('bumperF', () => {
          const oval = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; oval.push([1.983, 0.415 + Math.sin(a) * 0.135, -Math.cos(a) * 0.37]); }
          K.face(oval, B);
          K.bar([1.986, 0.415, -0.36], [1.986, 0.415, 0.36], 0.012, CH, { n: 4 });
        }, { hinge: [[1.9, 0.3, -0.4], [1.9, 0.3, 0.4]] });
        for (const sd of [-1, 1]) {
          const host = sd < 0 ? 'fenderL' : 'fenderR';
          K.headLamp(1.885, 0.645, sd * 0.54, 0.086, { n: 10, host });
          K.discX(1.884, 0.5, sd * 0.625, 0.03, 6, [1, 0.6, 0.12], 1, { host });
        }
        // ---- the tail: round lamps (two a side), the plate; the bumperettes ----
        for (const sd of [-1, 1]) for (const z of [0.48, 0.35]) K.tailLamp(-1.98, 0.56, sd * z, 0.084, 0.084, { round: true });
        K.rect(-1.985, 0.5, 0, 0.42, 0.11, [0.93, 0.93, 0.9], { dir: '-x', part: 'body' });
        K.part('bumperR', () => { for (const sd of [-1, 1]) K.cyl([-1.975, 0.4, sd * 0.28], [-1.975, 0.4, sd * 0.56], 0.022, CH, { n: 5 }); },
          { hinge: [[-1.9, 0.3, -0.4], [-1.9, 0.3, 0.4]] });
        // ---- the side pipes along the sills: out of the fender behind the front wheel, the heat shield over the middle ----
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'pipeL' : 'pipeR', () => {
          const hex = [0, 1, 2, 3, 4, 5].map(i => [Math.cos(i * Math.PI / 3), Math.sin(i * Math.PI / 3)]), rad = [0.035, 0.045, 0.055, 0.06, 0.046];
          K.sweep(hex, [[0.72, 0.38, sd * 0.7], [0.6, 0.265, sd * 0.795], [0.42, 0.24, sd * 0.805], [-0.42, 0.24, sd * 0.805], [-0.56, 0.24, sd * 0.805]],
            (k) => k === 2 ? [0.5, 0.51, 0.53] : CH, { scale: (i) => rad[i], capB: [0.03, 0.03, 0.035] });
        });
        // ---- the windscreen: one pane facing forward (the driver sees out through it), its chrome frame; the mirrors on its posts; wipers ----
        K.face([[0.258, 0.835, 0.64], [0.258, 0.835, -0.64], [0.028, 1.205, -0.6], [0.028, 1.205, 0.6]], G, { part: 'body' });
        K.part('body', () => {
          K.bar([0.025, 1.21, -0.61], [0.025, 1.21, 0.61], 0.016, CH, { n: 4 });
          for (const sd of [-1, 1]) K.bar([0.262, 0.83, sd * 0.645], [0.025, 1.21, sd * 0.61], 0.016, CH, { n: 4 });
          for (const z of [-0.36, 0.2]) K.bar([0.27, 0.856, z - 0.2], [0.25, 0.862, z + 0.2], 0.008, B, { n: 3 });
        });
        for (const sd of [-1, 1]) K.mirror(0.14, 1.0, sd * 0.675, { w: 0.04, h: 0.05, d: 0.08, col: CH, arm: CH, z0: sd * 0.63 });
        // ---- the cockpit (in sight): the seats, the dashboard, the driver in the left seat (helmet, shoulders, arms to the wheel under
        //      the scuttle; the cockpit camera sits in the middle: none of him in its view), the roll bar behind him ----
        for (const sd of [-1, 1]) K.seat(-0.36, 0.36, sd * 0.32, { w: 0.44, l: 0.44, back: 0.52, tilt: 0.2, col: IN });
        K.box(0.05, 0.6, 0, 0.14, 0.22, 1.24, 0, D, null, true, { part: 'body' });
        K.part('body', () => {
          const z = -0.32, SU = [0.1, 0.14, 0.32], HC = [0.95, 0.95, 0.93];
          K.box(-0.44, 0.48, z, 0.24, 0.4, 0.4, 0.0, SU, null, true);                                 // the torso (the shoulders at 0.88)
          const R = [[0.86, 0.075], [0.94, 0.12], [1.05, 0.125], [1.11, 0.095], [1.14, 0.045]].map(([y, r], i) => [0, 1, 2, 3, 4, 5, 6, 7].map(j => { const a = j / 8 * Math.PI * 2; return [-0.42 + Math.cos(a) * r * (i ? 1.06 : 1), y, z + Math.sin(a) * r]; }));
          K.skin(R, (k, e) => k === 1 && (e === 0 || e === 7) ? [0.26, 0.17, 0.06] : k === 3 && e >= 2 && e <= 5 ? S : HC, [0.1, 0.1, 0.11], HC);   // the helmet: its gold visor at the eyes, the stripe colour on its crown
          for (const sd of [-1, 1]) K.bar([-0.43, 0.84, z + sd * 0.17], [-0.06, 0.74, z + sd * 0.15], 0.042, SU, { n: 4 });   // the arms (to the wheel under the scuttle)
        }, { noCrush: true, noDent: true });
        // (the bulkhead behind the seats stands on the rear arch's end, its ring raised to the arch: under it, outside the tub's inner wall,
        // a gap to the floor; closed here, facing the cockpit)
        for (const sd of [-1, 1]) K.face(sd > 0 ? [[-0.706, 0.19, 0.78], [-0.706, 0.19, 0.54], [-0.706, 0.335, 0.54], [-0.706, 0.335, 0.78]] : [[-0.706, 0.19, -0.54], [-0.706, 0.19, -0.78], [-0.706, 0.335, -0.78], [-0.706, 0.335, -0.54]], K.lining, { part: 'body' });
        K.cage([[[-0.8, 0.8, -0.56], [-0.8, 1.06, -0.54]], [[-0.8, 1.06, -0.54], [-0.8, 1.13, -0.46]], [[-0.8, 1.13, -0.46], [-0.8, 1.13, -0.18]], [[-0.8, 1.13, -0.18], [-0.8, 1.06, -0.1]],
          [[-0.8, 1.06, -0.1], [-0.8, 0.8, -0.08]], [[-0.8, 1.1, -0.5], [-1.2, 0.88, -0.52]]], 0.024, [0.8, 0.81, 0.84], { n: 5, noCrush: true, noDent: true });
        // ---- the hinges: the bonnet at the windscreen, the boot lid at the roll bar's deck, the doors at their front edges, the pipes ----
        K.hinge('hood', [0.28, 0.84, -0.6], [0.28, 0.84, 0.6]);
        K.hinge('trunk', [-1.1, 0.88, -0.6], [-1.1, 0.88, 0.6]);
        K.hinge('doorL', [0.25, 0.3, -0.8], [0.25, 0.75, -0.8]); K.hinge('doorR', [0.25, 0.3, 0.8], [0.25, 0.75, 0.8]);
        for (const sd of [-1, 1]) K.hinge(sd < 0 ? 'pipeL' : 'pipeR', [0.55, 0.25, sd * 0.75], [0.55, 0.25, sd * 0.86]);   // (a loose pipe hangs from its header, its tail down)
        // ---- inside (seen once a part is off): the V8 under the bonnet with its air cleaner, the radiator behind the mouth ----
        K.engine(0.85, 0.32, 0, { l: 0.62, w: 0.52, h: 0.36, inner: true, col: [0.3, 0.32, 0.36], cover: CH });
        K.cyl([0.88, 0.68, 0], [0.88, 0.74, 0], 0.16, CH, { n: 10, inner: true, part: 'body' });
        K.box(1.84, 0.28, 0, 0.06, 0.34, 0.8, 0, [0.12, 0.12, 0.13], null, false, { inner: true, part: 'body' });
        for (const sd of [-1, 1]) K.box(1.2, 0.2, sd * 0.57, 0.74, 0.5, 0.04, 0, D, null, true, { inner: true, part: 'body' });   // (the inner wings: no tyre in the bay)
      },
    },
  });
})();
