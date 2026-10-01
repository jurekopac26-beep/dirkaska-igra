/* Vehicle 'sokol' — SOKOL R: a 1990s twin-turbo rotary sports coupe. Signature features: 1) a low curvy coupe with a long bonnet and a
   short tail, 2) pop-up headlamps in a smooth nose with a wide mouth, 3) a ducktail spoiler moulded into the tail, 4) round tail lamps
   under a dark full-width panel, 5) a double-bubble roof. L 4.29 W 1.76 H 1.23, wheelbase 2.43, overhangs F 0.95 R 0.91 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'sokol', name: 'SOKOL R', cat: 'sportni', ord: 1, drive: 'FR',
    desc: 'Japonski kupe z dvojnim turbo rotacijskim motorjem, dvižnimi žarometi in račjim repom.',
    phys: { mass: 1260, a: 1.2, b: 1.23, kI: 1.2, kw: 250, redline: 8000, idle: 1000, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 4.11, rw: 0.31, cDrag: 0.33, len: 4.29, wid: 1.76, steerMax: 0.62,
      spinK: 0.5 },
    arc: { amax: 1.75, kv: 2, rmin: 4.3 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.15, pwr: 0.1, out: 1.3, turn: 1, w: 1 },   // (the FR layer: lift-off and power rotation)
    stats: { power: 7, grip: 7, weight: 7, drift: 8 },
    price: 35000, pk: 'ta1', field: null,
    snd: { kind: 'rotary', hz: 1, turbo: 0.7, loud: 1 },
    expect: { t100: [3.27, 3.84], vmax: [231, 245], latG: [2.23, 2.33], d100: [22.9, 25.3] },
    parts: { set: 'race', ht: 1.23, y0: 0.18,
      over: {
        wing: { f: 0.72, lx: -0.95, m: 3 },
        trunk: { lx: -0.62, y: 1.06 },   // (where the look has them: the glass hatch up on the fastback, the bonnet with the nose's top,
        hood: { lx: 0.68 }, doorL: { y: 0.75 }, doorR: { y: 0.75 }, quarterL: { y: 0.66 }, quarterR: { y: 0.66 },   // the doors with their glass, the hips)
      },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, tail to nose: the ducktail rising behind the glass hatch, the bubble
    // canopy (its glass wrapping round, black pillars and frames), the long bonnet sunk between the front wings' crests, the smooth round
    // nose. The standard regions split it (doors with their glass, the wings and quarters with the side glass behind the doors, the bonnet
    // with the nose's top); the ducktail is its own part ('wing': the tail's top behind the glass), the glass hatch the 'trunk'
    look: {
      body: { len: 4.29, wid: 1.76, roofY: 1.23,
        //       x       w      yb    ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.145, 0.75, 0.31, 0.6, 0.68, 0.925, 0.03, 'b', 0.12],     // the tail's face (its corners rounded off; the ducktail's lip on it)
          [-1.97, 0.84, 0.25, 0.69, 0.75, 0.905, 0.025, 'b', 0.12],        // the deck behind the glass
          [-1.82, 0.865, 0.24, 0.74, 0.665, 0.925, 0.035, 'gr', 0.12],     // the glass hatch's foot, the hips' tops beside it
          [-1.33, 0.88, 0.22, 0.82, 0.65, 1.07, 0.05, 'gr', 0.13],         // its middle (it bulges); the hips
          [-0.82, 0.866, 0.2, 0.85, 0.6, 1.13, 0.065, 'r', 0.13],          // the roof's back edge
          [-0.4, 0.855, 0.19, 0.845, 0.6, 1.14, 0.065, 'r', 0.13],         // the roof's top (the two bubbles over it: 1.24)
          [-0.05, 0.855, 0.19, 0.84, 0.585, 1.125, 0.06, 'gf', 0.13],      // the windscreen's top
          [0.62, 0.865, 0.19, 0.81, 0.67, 0.85, -0.02, 'b', 0.13],         // its base (the cowl)
          [1.0, 0.88, 0.2, 0.7, 0.81, 0.8, -0.03, 'b', 0.13],              // the bonnet sunk between the wings' crests (cr < 0; shallow over
          [1.4, 0.878, 0.2, 0.69, 0.805, 0.775, -0.04, 'b', 0.13],         //  the wheel, where the arch lifts the loft's middle)
          [1.62, 0.87, 0.2, 0.64, 0.785, 0.755, -0.06, 'b', 0.13],         // the crests at the lamp lids
          [1.845, 0.845, 0.19, 0.6, 0.76, 0.72, -0.06, 'b', 0.12],
          [2.0, 0.795, 0.18, 0.55, 0.71, 0.67, -0.035, 'b', 0.1],          // the nose rounds down
          [2.1, 0.715, 0.19, 0.47, 0.63, 0.59, -0.01, 'b', 0.08],
          [2.145, 0.62, 0.21, 0.41, 0.56, 0.5, 0, 'b', 0.06]],             // the nose's face: the mouth
        eye: { x: -0.5, y: 1.02 },
        door: [0.62, -0.5], bumpF: 0.3, bumpR: 0.175, bumpY: [0.62, 0.62],
        crush: { x0: -1.5, x1: 0.18, z: 0.62 },                          // (the roof and the hatch's top: the bubble canopy)
        decalX: 1.2, decalY: 0.752, decalRz: -0.087, decalS: 0.68, decalPart: 'hood' },   // (the start number on the bonnet's sunk middle: the roof's
                                                                         //  double bubble stays in sight from the chase camera)
      wheels: { style: 'std', spokes: 5, w: 0.225, wR: 0.245, rimK: 0.68, rim: [0.74, 0.75, 0.78], cap: [0.16, 0.16, 0.18], gap: 0.055 },
      // the standard regions; the ducktail (the tail's top behind the glass, and anything over it there) is the 'wing', the glass hatch the trunk
      regions: (std) => std.filter(r => r.part !== 'wing').flatMap(r => r.part !== 'trunk' ? [r]
        : [{ part: 'wing', x: [-2.8, -1.82], bands: ['window', 'edge', 'crown'], y: [0.88, 3] }, Object.assign({}, r, { x: [-1.82, -0.82] })]),
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, D = [0.09, 0.09, 0.1], SMK = [0.1, 0.025, 0.03], SILL = K.shade(P, 0.62);
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (between the arches)
        // ---- the shell: the paint; the glass (the windscreen and the side glass under it, the side windows, the quarter windows, the hatch);
        //      the sills dark under the doors ----
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : at.x > XA && at.x < XB ? SILL : K.shade(P, 0.7);
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          if (kind === 'gr' && k === 4 && (e === 2 || e === 6)) return G;   // (the quarter window's tail: its rear edge drawn over it)
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const D2 = L.decal;
        // the glasshouse: black frames along the belt and the roof's edge, the A-pillars, the B-pillars; the quarter windows' slanted rear edge
        D2.band([[-1.08, 0], [0.62, 0], [0.62, 0.05], [-1.08, 0.05]], B, null, 0.008);
        D2.band([[-0.86, 0.93], [-0.05, 0.93], [-0.05, 1], [-0.86, 1]], B, null, 0.008);
        D2.band([[-0.05, 0.86], [0.62, 0.86], [0.62, 1], [-0.05, 1]], B, null, 0.008);
        D2.band([[-0.57, 0], [-0.505, 0], [-0.505, 1], [-0.57, 1]], B, null, 0.01);
        D2.band([[-1.34, 0], [-1.07, 0], [-0.85, 1], [-1.34, 1]], P, null, 0.01);
        // the double bubble: two low humps over the seats, a channel between them down the middle of the roof
        for (const sd of [-1, 1]) {
          const ring = (x, lift) => [[0.05, -0.004], [0.13, lift], [0.34, lift], [0.48, lift * 0.45], [0.56, -0.004]].map(([z, dy]) => [x, L.topY(x, z) + dy, sd * z]);
          K.skin([ring(-0.07, 0.008), ring(-0.24, 0.036), ring(-0.6, 0.036), ring(-0.8, 0.01)], P, null, null, { part: 'body' });
        }
        D2.top([[-0.08, -0.06], [-0.79, -0.06], [-0.79, 0.06], [-0.08, 0.06]], K.shade(P, 0.82), 0.003);   // (the channel's floor, in the bubbles' shade)
        // the pop-up lamps, shut: each lid at the front of its wing's crest (its outer edge along the crest), a shade darker, its shut lines
        for (const sd of [-1, 1]) {
          const x0 = 1.6, x1 = 1.9, zi = 0.475, t = 0.018, zo = (x) => L.prop(x, 'wt') - 0.004, Z = (p) => p.map(([x, z]) => [x, sd * z]);
          D2.top(Z([[x0, zi], [x1, zi], [x1, zo(x1)], [x0, zo(x0)]]), K.shade(P, 0.9), 0.003);
          for (const p of [[[x0, zi], [x1, zi], [x1, zi + t], [x0, zi + t]], [[x0, zo(x0) - t], [x1, zo(x1) - t], [x1, zo(x1)], [x0, zo(x0)]],
            [[x0, zi], [x0 + t, zi], [x0 + t, zo(x0 + t)], [x0, zo(x0)]], [[x1 - t, zi], [x1, zi], [x1, zo(x1)], [x1 - t, zo(x1 - t)]]]) D2.top(Z(p), D, 0.005);
        }
        // the ducktail's lip: it kicks up off the deck and curls over the tail's face, fading into the corners (the 'wing', with the deck under it)
        K.part('wing', () => {
          const ring = ([z, k]) => { const t = (x) => L.topY(x, z); return [[-2.02, t(-2.02) - 0.006, z], [-2.115, t(-2.115) + 0.046 * k, z], [-2.165, t(-2.145) + 0.068 * k, z], [-2.158, t(-2.145) + 0.02 * k, z], [-2.147, t(-2.145) - 0.012, z]]; };
          K.skin([[-0.67, 0.3], [-0.45, 0.85], [0, 1], [0.45, 0.85], [0.67, 0.3]].map(ring), P, P, P);
        }, { noCrush: true });
        // the side: a pinstripe in the stripe colour over the sills from arch to arch; the door handles
        D2.side([[XA + 0.04, 0.395], [XB - 0.04, 0.395], [XB - 0.04, 0.418], [XA + 0.04, 0.418]], K.strp, null, 0.006);
        D2.side([[1.93, 0.43], [2.01, 0.43], [2.01, 0.46], [1.93, 0.46]], [0.95, 0.55, 0.1], null, 0.006);     // the side markers: amber in front,
        D2.side([[-2.06, 0.5], [-1.99, 0.5], [-1.99, 0.53], [-2.06, 0.53]], [0.6, 0.06, 0.05], null, 0.006);  // red behind
        D2.top([[-1.845, -0.64], [-1.8, -0.64], [-1.8, 0.64], [-1.845, 0.64]], B, 0.006);                      // (the glass hatch's black foot)
        for (const sd of [-1, 1]) K.rect(-0.36, 0.785, sd * 0.864, 0.13, 0.024, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });
        // ---- the nose: the wide mouth (the intercooler behind it), a lamp slot at each corner (the parking lamps over the brake ducts),
        //      the chin ----
        const fx = 2.147, oval = (cz, cy, hw, hh, n) => { const pts = [], r = hh;   // (a stadium facing forward: its points counter-clockwise from the front)
          for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + Math.PI * i / n; pts.push([fx, cy + r * Math.sin(a), cz - (hw - r + r * Math.cos(a))]); }
          for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + Math.PI * i / n; pts.push([fx, cy + r * Math.sin(a), cz - (-(hw - r) + r * Math.cos(a))]); }
          return pts; };
        K.part('bumperF', () => {
          K.face(oval(0, 0.325, 0.36, 0.062, 4), B);
          for (const y of [0.3, 0.35]) K.rect(fx + 0.002, y, 0, 0.6, 0.012, [0.22, 0.22, 0.23]);   // (the intercooler's bars in it)
          for (const sd of [-1, 1]) K.face(oval(sd * 0.52, 0.338, 0.085, 0.052, 2), B);
          K.box(2.04, 0.15, 0, 0.16, 0.035, 1.0, 0, B);                                              // the chin
        }, { hinge: [[1.9, 0.3, -0.7], [1.9, 0.3, 0.7]] });
        for (const sd of [-1, 1]) K.headLamp(fx, 0.358, sd * 0.52, 0.03, { shape: 'rect', w: 0.13, h: 0.032, ring: null });
        // ---- the tail: the dark panel right across with two round lamps a side and the reversing lamps; the plate, the diffuser, the twin
        //      tail pipes (right) ----
        const tx = -2.147;
        K.face([[tx, 0.74, -0.7], [tx, 0.74, 0.7], [tx, 0.905, 0.664], [tx, 0.905, -0.664]], SMK, { part: 'body' });
        for (const sd of [-1, 1]) {
          K.tailLamp(tx, 0.822, sd * 0.555, 0.15, 0.15, { round: true });
          K.tailLamp(tx, 0.822, sd * 0.365, 0.13, 0.13, { round: true });
          K.discX(tx - 0.002, 0.822, sd * 0.215, 0.045, 8, [0.86, 0.86, 0.84], -1, { part: 'body' });
        }
        K.part('bumperR', () => {
          K.rect(tx - 0.001, 0.46, 0, 0.5, 0.11, [0.93, 0.93, 0.9], { dir: '-x' });
          K.face([[tx, 0.605, -0.745], [tx, 0.605, 0.745], [tx, 0.618, 0.745], [tx, 0.618, -0.745]], K.shade(P, 0.6));   // (the bumper's top line)
          K.face([[tx, 0.315, -0.66], [tx, 0.315, 0.66], [tx, 0.37, 0.69], [tx, 0.37, -0.69]], B);                          // (its black valance)
          K.box(-2.07, 0.21, 0, 0.16, 0.07, 1.2, 0, B);
        });
        for (const z of [0.3, 0.42]) K.exhaust(-2.165, 0.245, z, 0.042, 0.22, { part: 'body' });
        // ---- the mirrors (the paint, on black sails at the side glass's front corners), the wipers ----
        D2.band([[0.32, 0], [0.62, 0], [0.62, 1], [0.32, 1]], B, null, 0.008);
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'mirrorL' : 'mirrorR', () => {   // (a rounded pod: its glass on its back, a black stalk to the sail)
          const z = sd * 0.955, y = 0.93, ring = (x, k) => [[0, 1], [0.7, 0.75], [1, 0], [0.7, -0.75], [0, -1], [-0.7, -0.75], [-1, 0], [-0.7, 0.75]].map(([a, b]) => [x, y + b * 0.042 * k, z + a * 0.055 * k]);
          K.skin([ring(0.53, 0.3), ring(0.49, 0.85), ring(0.42, 1)], P, P, [0.42, 0.47, 0.54]);
          K.bar([0.45, 0.9, sd * 0.905], [0.46, 0.885, sd * 0.85], 0.016, B, { n: 4 });
        });
        for (const z of [-0.5, 0.05]) K.bar([0.6, L.topY(0.6, z) + 0.012, z], [0.5, L.topY(0.5, z + 0.5) + 0.012, z + 0.5], 0.009, B, { n: 4, part: 'body' });
        // ---- the hinges: the bonnet at the cowl, the hatch at the roof, the doors at their front edges, the ducktail at its front ----
        K.hinge('hood', [0.63, 0.83, -0.5], [0.63, 0.83, 0.5]);
        K.hinge('trunk', [-0.84, 1.2, -0.45], [-0.84, 1.2, 0.45]);
        K.hinge('doorL', [0.62, 0.35, -0.86], [0.62, 0.8, -0.86]); K.hinge('doorR', [0.62, 0.35, 0.86], [0.62, 0.8, 0.86]);
        K.hinge('wing', [-1.83, 0.96, -0.6], [-1.83, 0.96, 0.6]);
        // ---- inside (seen once a part is off): two bucket seats low down, the dashboard with the wheel (left), the console; the rotary
        //      behind the front axle with its turbo and the intercooler behind the mouth ----
        for (const sd of [-1, 1]) K.seat(-0.5, 0.33, sd * 0.36, { w: 0.48, l: 0.5, back: 0.6, tilt: 0.3 });
        K.box(0.32, 0.6, 0, 0.3, 0.22, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([0.13, 0.72, -0.36], [0.16, 0.735, -0.36], 0.17, B, { n: 8, inner: true, part: 'body' });
        K.box(-0.05, 0.22, 0, 0.7, 0.24, 0.2, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(1.0, 0.26, 0, { l: 0.44, w: 0.5, h: 0.36 });
        K.cyl([1.14, 0.47, 0.32], [0.94, 0.47, 0.32], 0.08, [0.5, 0.5, 0.52], { n: 6, inner: true, part: 'body' });
        K.box(1.98, 0.22, 0, 0.06, 0.2, 0.8, 0, [0.3, 0.31, 0.33], null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
