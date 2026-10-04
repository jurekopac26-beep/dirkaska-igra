/* Vehicle 'kolibri' — KOLIBRI: a 1990s kei-class hot hatch, three-cylinder turbo. Signature features: 1) a tall boxy two-box body on a
   short wheelbase, 2) a roof spoiler over the near-vertical tailgate, 3) big square headlamps and a slim grille, 4) a bonnet scoop for
   the intercooler, 5) small wide-spoked alloy wheels. L 3.39 W 1.47 H 1.40, wheelbase 2.33, overhangs F 0.55 R 0.51 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'kolibri', name: 'KOLIBRI', cat: 'mali', ord: 2, drive: 'FF',
    desc: 'Japonski žepni hot hatch iz 90-ih: škatlast, lahek in živahen, s strešnim spojlerjem.',
    phys: { mass: 680, a: 1.15, b: 1.18, kI: 0.95, kw: 47, redline: 8500, idle: 1000, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 5.86, rw: 0.27, cDrag: 0.42, len: 3.39, wid: 1.47, steerMax: 0.66,
      spinK: 0.4 },
    arc: { amax: 1.66, kv: 2.1, rmin: 3.8 },
    csp: { bx: 0.15, coast: -0.095, thr: -0.03, liftP: 0, pwr: 0, out: 1, turn: 1, w: 1.02 },   // (the FF layer: pivots on the brakes, the throttle pulls it straight)
    stats: { power: 1, grip: 5, weight: 10, drift: 5 },
    price: 8000, pk: 'ta1', field: ['kolibri'],
    snd: { kind: 'i3', hz: 1.25, turbo: 0.6, loud: 0.8 },
    expect: { t100: [4.91, 5.76], vmax: [149, 158], latG: [2.1, 2.2], d100: [22.7, 25.1] },
    partNames: { spoiler: 'roof spoiler' },
    parts: { set: 'car', ht: 1.4, y0: 0.18,
      extra: {
        spoiler: { z: 1, th: 0.6, m: 2, r: 0.4, h: 0.05, lx: -0.95, lz: 0, f: 0.97 },
      },
      // (where the look has them, a lost one flies off from there: the tailgate is the near-vertical tail, the bonnet short, the mirrors
      // at the door glass's front corner; the doors, the fenders and the quarters by their ranges' middles)
      over: { hood: { lx: 0.77, y: 0.81 }, trunk: { lx: -0.97, y: 0.88 }, doorL: { lx: 0.12, y: 0.8 }, doorR: { lx: 0.12, y: 0.8 }, fenderL: { lx: 0.77, y: 0.64 }, fenderR: { lx: 0.77, y: 0.64 },
        quarterL: { lx: -0.68, y: 0.79 }, quarterR: { lx: -0.68, y: 0.79 }, mirrorL: { lx: 0.41, y: 0.95 }, mirrorR: { lx: 0.41, y: 0.95 } },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, tail to nose: the rear bumper's face, the tailgate's lower panel
    // between the tail lamps' strips, its glass nearly upright, the long flat roof, the windscreen, the short bonnet, the lamp face leaning
    // back over the front bumper. Its own regions: the bumpers wrap the corners up to their tops (0.535), the tailgate is the panel and the
    // glass between the lamp strips (they stay with the quarters), the lamp face's corners go with the fenders (the head lamps on them),
    // its middle (the slim grille) with the bonnet. The windscreen and the tailgate's window are panes over their frames (the loft's top
    // there in paint: the pillars show from the front and from behind). The roof spoiler, the bonnet's scoop, the bumpers' details in
    // their parts; the start number on the roof
    look: {
      body: { len: 3.39, wid: 1.47, door: [0.79, -0.35], bumpY: [0.535, 0.535],
        //       x      w      yb     ybelt   wt     yt     cr     kind  tuck
        secs: [[-1.69, 0.695, 0.24, 0.515, 0.6, 0.53, 0.004, 'b', 0.1],       // the rear bumper's face (the cap)
          [-1.66, 0.712, 0.225, 0.525, 0.565, 0.545, 0.006, 'b', 0.1],        // its top: the tailgate's lower panel from here, the lamp strips beside it
          [-1.655, 0.715, 0.22, 0.86, 0.565, 0.875, 0.008, 'gr', 0.1],        // the rear window's foot
          [-1.585, 0.725, 0.2, 0.88, 0.57, 1.335, 0.04, 'r', 0.07],           // the roof's rear edge (the spoiler over it)
          [-1.3425, 0.73, 0.185, 0.88, 0.59, 1.35, 0.045, 'r', 0.085],        // the D-pillar's front: the quarter window from here (on an arch cut)
          [0.16, 0.735, 0.18, 0.865, 0.61, 1.355, 0.045, 'gf', 0.09],         // the windscreen's top
          [0.825, 0.735, 0.18, 0.865, 0.7, 0.895, 0.045, 'b', 0.09],          // its base (the cowl, on the front arch's rear end): the bonnet
          [1.64, 0.715, 0.19, 0.78, 0.665, 0.8, 0.012, 'b', 0.08],            // the bonnet's front edge
          [1.672, 0.71, 0.22, 0.775, 0.66, 0.795, 0.008, 'b', 0.1],           // the lamp face's top
          [1.688, 0.705, 0.225, 0.525, 0.655, 0.535, 0.004, 'b', 0.1],        // its foot: the front bumper's top
          [1.7, 0.695, 0.235, 0.515, 0.635, 0.525, 0.002, 'b', 0.1]],         // the bumper's face (the cap)
        // (yb + tuck = 0.27, the hubs' height, by both axles: the arches are half circles, their ends on round numbers (0.825 / 1.475,
        // -1.505 / -0.855); every region's end lies on a section or an arch's cut: no sliver segments. The windscreen's ends share their
        // crown: its edge panels untwisted, the pane over them never cut by the frame's diagonal)
        eye: { x: -0.36, y: 1.17, style: 'closed' },
      },
      wheels: { style: 'std', spokes: 4, w: 0.165, rim: [0.8, 0.81, 0.84], cap: [0.26, 0.26, 0.28], gap: 0.055 },
      regions: (std) => {
        const XD0 = 0.79, XD1 = -0.35, R = [];
        for (const s of 'LR') R.push({ part: 'mirror' + s, x: [0.41, 1.16], y: [0.59, 1.12], side: s, out: true, points: true });
        for (const s of 'LR') R.push({ part: 'door' + s, x: [XD1, XD0], bands: ['side', 'window'], y: [0.29, 1.4], side: s });
        R.push({ part: 'bumperF', x: [1.475, 2.4], bands: ['tuck', 'side'], y: [-1, 0.535] }, { part: 'bumperF', x: [1.688, 2.4], bands: ['window', 'edge', 'crown'] });
        R.push({ part: 'bumperR', x: [-2.4, -1.505], bands: ['tuck', 'side'], y: [-1, 0.535] }, { part: 'bumperR', x: [-2.4, -1.66], bands: ['window', 'edge', 'crown'] });
        for (const s of 'LR') R.push({ part: 'fender' + s, x: [XD0, 1.688], bands: ['tuck', 'side', 'window'], y: [-1, 0.95], side: s });
        for (const s of 'LR') R.push({ part: 'fender' + s, x: [1.672, 1.688], bands: ['edge'], side: s });   // (the lamp face's corners)
        for (const s of 'LR') R.push({ part: 'quarter' + s, x: [-1.7, XD1], bands: ['tuck', 'side', 'window'], y: [-1, 1.4], side: s });   // (the lamp strips, the D-pillars)
        R.push({ part: 'hood', x: [0.825, 1.688], bands: ['window', 'edge', 'crown'], top: true });
        R.push({ part: 'trunk', x: [-2.4, -1.585], bands: ['window', 'edge', 'crown'], top: true });
        return R;
      },
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.1, 0.1, 0.11], DK = K.shade(P, 0.6), AMB = K.rgb(0xff9a1e), WH = [0.93, 0.93, 0.9], RED = K.rgb(0xa8100c);
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half, fz = (sd) => sd < 0 ? '-z' : 'z';
        // a flat polygon facing out (its winding turned to the side out points to)
        const face = (pts, col, out, o) => { const [a, b, c] = pts, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
          const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; K.face(n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0 ? pts.slice().reverse() : pts, col, o); };
        // ---- the shell: paint; the side glass (from the D-pillar to the A-pillar), the tail lamps' strips black, the sills a shade darker
        //      between the arches; the windscreen's and the tailgate window's frames in paint (their panes over them, below: no lining) ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : at.x > XA && at.x < XB ? K.shade(P, 0.62) : DK;
          if (e === 1 || e === 7) return P;
          if (e === 2 || e === 6) {
            if (k === 1) return B;                                       // (the tail lamps' strips)
            if (kind === 'gf') return at.x < 0.79 ? G : P;               // (the side glass's front corner)
            if (kind === 'r') return k === 4 ? G : P;                    // (the quarter window and the door's; the D-pillar)
            return P;
          }
          return P;
        }, { glass: (k, e, kind) => (kind === 'gf' || kind === 'gr') && e >= 3 && e <= 5,
          caps: { front: { col: P, low: 'bumperF', high: 'bumperF' }, rear: { col: P, low: 'bumperR', high: 'bumperR' } } });
        const LD = L.decal;
        // a pane on the loft's top between x0 and x1 (look units), half(x) wide, its corners cut ch (metres), off the frame by 5 mm along
        // nrm ([x, y]: out): three faces (the crown's flat middle, the two edges falling away to the sides)
        const pane = (x0, x1, half, nrm, ch, o) => {
          const len = Math.hypot(x1 - x0, L.topY(x1, 0) - L.topY(x0, 0)), tc = ch / len, X = (t) => x0 + (x1 - x0) * t;
          const P3 = (t, z) => [X(t) + nrm[0] * 0.005, L.topY(X(t), z) + nrm[1] * 0.005, z], c = (t) => 0.38 * L.prop(X(t), 'wt'), e = (t) => half(X(t));
          const out = [nrm[0], nrm[1], 0];
          face([P3(0, -c(0)), P3(0, c(0)), P3(1, c(1)), P3(1, -c(1))], G, out, o);
          for (const sd of [-1, 1]) face([[0, c(0)], [0, e(0) - ch], [tc, e(tc)], [1 - tc, e(1 - tc)], [1, e(1) - ch], [1, c(1)]].map(([t, z]) => P3(t, sd * z)), G, out, o);
        };
        pane(0.8, 0.185, (x) => L.prop(x, 'wt') - 0.075, [0.59, 0.81], 0.05, { part: 'body' });          // the windscreen
        pane(-1.651, -1.592, (x) => L.prop(x, 'wt') - 0.085, [-0.99, 0.14], 0.04, { part: 'trunk' });    // the tailgate's window
        // ---- the glasshouse: black frames round the side glass, the B-pillar black, the A-pillar's foot in paint ----
        LD.band([[-1.3425, 0], [0.79, 0], [0.79, 0.06], [-1.3425, 0.06]], B, null, 0.008);      // along the belt
        LD.band([[-1.3425, 0.93], [0.16, 0.93], [0.16, 1], [-1.3425, 1]], B, null, 0.008);      // under the roof's edge
        LD.band([[-0.44, 0], [-0.33, 0], [-0.33, 1], [-0.44, 1]], B, null, 0.01);               // the B-pillar (split at the door's edge)
        LD.band([[-1.3425, 0], [-1.3, 0], [-1.3, 1], [-1.3425, 1]], B, null, 0.01);             // the quarter window's rear frame
        LD.band([[0.2, 0.86], [0.79, 0.04], [0.79, 1], [0.16, 1]], P, null, 0.01);              // the A-pillar (paint, over the glass's edge)
        // ---- the side: the stripe along the doors between the arches, the shut lines, the handles, the repeaters, the fuel cap ----
        const X0 = XA + 0.04, X1 = XB - 0.04;
        LD.side([[X0, 0.425], [X1, 0.425], [X1, 0.5], [X0, 0.5]], S, null, 0.006);
        LD.side([[X0, 0.515], [X1, 0.515], [X1, 0.527], [X0, 0.527]], S, null, 0.006);
        for (const x of [0.79, -0.35]) LD.side([[x - 0.006, 0.33], [x + 0.006, 0.33], [x + 0.006, 0.86], [x - 0.006, 0.86]], D, null, 0.005);
        for (const sd of [-1, 1]) {
          K.rect(-0.24, 0.79, sd * 0.739, 0.13, 0.026, B, { dir: fz(sd), host: sd < 0 ? 'doorL' : 'doorR' });
          K.rect(1.3, 0.7, sd * 0.733, 0.06, 0.024, AMB, { dir: fz(sd), host: sd < 0 ? 'fenderL' : 'fenderR' });
        }
        K.face([0, 1, 2, 3, 4, 5].map(i => [-1.25 + Math.cos(i * Math.PI / 3) * 0.045, 0.74 + Math.sin(i * Math.PI / 3) * 0.045, 0.734]), D, { host: 'quarterR' });
        // ---- the nose: the big square head lamps on the lamp face (with the fenders), the slim grille between them (with the bonnet) ----
        for (const sd of [-1, 1]) { K.headLamp(1.687, 0.675, sd * 0.468, 0.1, { shape: 'rect', w: 0.27, h: 0.21, ring: B, host: sd < 0 ? 'fenderL' : 'fenderR' });
          K.rect(1.6925, 0.7, sd * 0.468, 0.27, 0.009, [0.36, 0.37, 0.4], { host: sd < 0 ? 'fenderL' : 'fenderR' }); }   // (the lens' divide: the main and the dipped beam)
        K.grille(1.684, 0.705, 0, 0.6, 0.065, { slats: 2, host: 'hood' });
        // ---- the front bumper: its intake, the plate, the indicators, the black lip under it ----
        K.part('bumperF', () => {
          K.grille(1.703, 0.32, 0, 0.92, 0.1, { slats: 2 });
          K.rect(1.704, 0.44, 0, 0.34, 0.1, WH);
          for (const sd of [-1, 1]) K.rect(1.703, 0.46, sd * 0.52, 0.16, 0.045, AMB);
          K.box(1.64, 0.19, 0, 0.13, 0.05, 1.28, 0, B);
        });
        // ---- the bonnet's scoop (the intercooler under it): a box rising from the bonnet, its black mouth facing forward ----
        K.part('hood', () => {
          const ring = (x, h) => { const y = L.topY(x, 0); return [[x, y - 0.012, -0.26], [x, y + h, -0.225], [x, y + h, 0.225], [x, y - 0.012, 0.26]]; };
          K.skin([ring(1.46, 0.07), ring(1.33, 0.064), ring(1.0, 0.006)], P, B, P);
          K.rect(1.457, L.topY(1.46, 0) + 0.03, 0, 0.42, 0.05, D);
        });
        // ---- the windscreen's wipers ----
        for (const z of [-0.3, 0.22]) K.bar([0.86, L.topY(0.86, z - 0.22) + 0.012, z - 0.22], [0.815, L.topY(0.815, z + 0.22) + 0.012, z + 0.22], 0.01, B, { n: 4, part: 'body' });
        // ---- the mirrors (black) ----
        for (const sd of [-1, 1]) K.mirror(0.7, 0.96, sd * 0.8, { col: B, w: 0.1, h: 0.085, d: 0.13 });
        // ---- the roof spoiler: a wedge on the roof's rear end rising to a kicked-up trailing edge over the tailgate's window, following
        //      the roof's crown across; its underside and trailing face dark, a high brake lamp in the middle of it ----
        K.part('spoiler', () => {
          const prof = (z) => { const lift = L.topY(-1.4, z) - L.topY(-1.4, 0);
            return [[-1.4, 1.387], [-1.42, 1.405], [-1.64, 1.425], [-1.725, 1.432], [-1.73, 1.395], [-1.6, 1.36]].map(([x, y]) => [x, y + lift, z]); };
          K.skin([-0.565, -0.22, 0.22, 0.565].map(prof), (k, e) => e === 3 ? K.shade(P, 0.45) : e >= 4 ? D : P, P, P);
          K.rect(-1.731, 1.414, 0, 0.3, 0.018, RED, { dir: '-x' });
        }, { noCrush: true, noDent: true, hinge: [[-1.41, 1.39, -0.5], [-1.41, 1.39, 0.5]] });
        // ---- the tail: the lamps in their strips (with the quarters), amber tops; the garnish between them, the plate and the wiper on
        //      the tailgate ----
        for (const sd of [-1, 1]) {
          K.tailLamp(-1.642, 0.68, sd * 0.64, 0.13, 0.24);
          K.rect(-1.661, 0.832, sd * 0.64, 0.125, 0.05, AMB, { dir: '-x', host: sd < 0 ? 'quarterL' : 'quarterR' });
        }
        K.part('trunk', () => {
          K.rect(-1.661, 0.81, 0, 1.1, 0.07, D, { dir: '-x' });
          K.rect(-1.663, 0.68, 0, 0.32, 0.11, WH, { dir: '-x' });
          K.bar([-1.652, 0.93, 0], [-1.626, 1.12, 0.34], 0.01, B, { n: 4 });
        });
        // ---- the rear bumper: the black valance, the reflectors; the exhaust under it ----
        K.part('bumperR', () => {
          K.box(-1.63, 0.2, 0, 0.13, 0.045, 1.24, 0, B);
          for (const sd of [-1, 1]) K.rect(-1.694, 0.44, sd * 0.53, 0.14, 0.04, RED, { dir: '-x' });
        });
        K.exhaust(-1.72, 0.25, -0.42, 0.03, 0.2, { part: 'body' });
        K.hinge('hood', [0.85, 0.91, -0.6], [0.85, 0.91, 0.6]);
        K.hinge('trunk', [-1.59, 1.33, -0.5], [-1.59, 1.33, 0.5]);
        for (const sd of [-1, 1]) K.hinge(sd < 0 ? 'doorL' : 'doorR', [0.78, 0.4, sd * 0.73], [0.78, 0.85, sd * 0.73]);
        // ---- inside (seen once a part is off): the red bucket seats, the rear bench, the dashboard and the wheel; the turbo three across
        //      the bay with its intercooler under the scoop, the radiator behind the grille ----
        for (const sd of [-1, 1]) K.seat(-0.22, 0.47, sd * 0.31, { w: 0.44, l: 0.46, back: 0.66, tilt: 0.2, col: [0.34, 0.07, 0.07] });
        K.seat(-1.0, 0.45, 0, { w: 1.0, l: 0.42, back: 0.55 });
        K.box(0.52, 0.6, 0, 0.34, 0.25, 1.32, 0, D, null, false, { inner: true, part: 'body' });
        K.box(0.12, 0.21, 0, 0.6, 0.2, 0.16, 0, D, null, true, { inner: true, part: 'body' });   // (the console between the seats)
        for (const sd of [-1, 1]) {   // (the B- and the D-pillar's posts: a stripped shell's roof stands on them)
          K.bar([-0.385, 0.87, sd * 0.69], [-0.385, 1.33, sd * 0.6], 0.035, D, { n: 4, inner: true, part: 'body' });
          K.bar([-1.47, 0.87, sd * 0.69], [-1.5, 1.33, sd * 0.56], 0.045, D, { n: 4, inner: true, part: 'body' });
        }
        K.cyl([0.3, 0.93, -0.31], [0.27, 0.97, -0.31], 0.17, [0.06, 0.06, 0.07], { n: 8, inner: true, part: 'body' });
        K.engine(1.24, 0.3, 0, { l: 0.4, w: 0.62, h: 0.36 });
        K.box(1.24, 0.69, 0, 0.3, 0.05, 0.42, 0, [0.62, 0.63, 0.66], null, false, { inner: true, part: 'body' });
        K.box(1.6, 0.3, 0, 0.05, 0.38, 1.0, 0, D, null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
