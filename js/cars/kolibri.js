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
    partNames: { spoiler: 'roof spoiler', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp',
      plate: 'number plate', wiperFront: 'windscreen wiper', wiperRear: 'rear wiper', aerial: 'aerial' },
    parts: { set: 'car', ht: 1.4, y0: 0.18, drop: ['fenderL', 'fenderR', 'quarterL', 'quarterR'],   // (the four fenders the body's: they dent, they never come off)
      extra: {
        spoiler: { z: 1, th: 0.6, m: 2, r: 0.4, h: 0.05, lx: -0.95, lz: 0, f: 0.97 },
        // (the head lamps parts of their own: a hit on their corner knocks one out of the lamp face)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.16, h: 0.08, lx: 0.99, lz: -0.64, f: 0.41 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.16, h: 0.08, lx: 0.99, lz: 0.64, f: 0.41 },
        // (the tail lamps likewise, out of their strips on the rear quarters; the number plate and the rear wiper mounted on the tailgate
        // (on: they turn with it when it hangs open, go with it when it goes), off before it opens (0.6 x 0.78); the front wipers on the
        // cowl after the bumper; the aerial on the roof's right rear: a side swipe or a rear right corner snaps it)
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: -0.98, lz: -0.87, f: 0.44 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: -0.98, lz: 0.87, f: 0.44 },
        plate: { z: 1, th: 0.4, m: 1, r: 0.17, h: 0.02, lx: -0.98, lz: 0, f: 0.41, on: 'trunk' },
        wiperRear: { z: 1, th: 0.45, m: 0.5, r: 0.2, h: 0.03, lx: -0.97, lz: 0.23, f: 0.66, on: 'trunk' },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.45, h: 0.03, lx: 0.49, lz: -0.05, f: 0.62 },
        aerial: { z: 3, th: 0.5, corner: 3, cth: 0.6, m: 0.3, r: 0.18, h: 0.03, lx: -0.76, lz: 0.49, f: 1.0 },
      },
      // (where the look has them, a lost one flies off from there: the tailgate is the near-vertical tail, the bonnet short, the mirrors
      // at the door glass's front corner; the doors by their ranges' middles, the bonnet with its scoop: on the road they lie as tall as
      // their h says)
      over: { hood: { lx: 0.77, y: 0.81, h: 0.12 }, trunk: { lx: -0.97, y: 0.88 }, doorL: { lx: 0.12, y: 0.8 }, doorR: { lx: 0.12, y: 0.8 },
        mirrorL: { lx: 0.41, y: 0.95 }, mirrorR: { lx: 0.41, y: 0.95 } },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, tail to nose: the rear bumper's face, the tailgate's lower panel
    // between the tail lamps' strips, its glass nearly upright, the long flat roof, the windscreen, the short bonnet, the lamp face leaning
    // back over the front bumper. Its own regions: the bumpers wrap the corners up to their tops (0.535), the tailgate is the panel and the
    // glass between the lamp strips (they stay with the body's quarters), the lamp face's corners with the body's fenders (the head lamps parts of their own),
    // its middle (the slim grille) with the body (the nose panel: the bonnet ends at its top). The windscreen and the tailgate's window are the loft's own glass (its top
    // there, out to the roof's creases; the A-pillars the bead down the crease and the side's band, the D-pillars the tail's): nothing painted under or over the glass (broken,
    // it shows the cabin; its crack decal lies on glass only). The roof spoiler, the bonnet's scoop, the bumpers' details in
    // their parts; the tail lamps, the number plate, the wipers and the aerial parts of their own; the start number on the roof
    look: {
      hi: true,   // (Nastavitve · Detajli avtov: Visoki: the small details at the end of build, and the tyres in 64)
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
      wheels: { style: 'std', spokes: 6, w: 0.165, seg: 32, segHi: 64, rim: [0.8, 0.81, 0.84], cap: [0.26, 0.26, 0.28], gap: 0.055 },
      regions: (std) => {
        const XD0 = 0.79, XD1 = -0.35, R = [];
        for (const s of 'LR') R.push({ part: 'mirror' + s, x: [0.41, 1.16], y: [0.59, 1.12], side: s, out: true, points: true });
        for (const s of 'LR') R.push({ part: 'door' + s, x: [XD1, XD0], bands: ['side', 'window'], y: [0.29, 1.4], side: s });
        R.push({ part: 'bumperF', x: [1.475, 2.4], bands: ['tuck', 'side'], y: [-1, 0.535] }, { part: 'bumperF', x: [1.688, 2.4], bands: ['window', 'edge', 'crown'] });
        R.push({ part: 'bumperR', x: [-2.4, -1.505], bands: ['tuck', 'side'], y: [-1, 0.535] }, { part: 'bumperR', x: [-2.4, -1.66], bands: ['window', 'edge', 'crown'] });
        for (const s of 'LR') R.push({ part: 'body', x: [XD0, 1.688], bands: ['tuck', 'side', 'window'], y: [-1, 0.95], side: s });   // (the front fenders: the body's, never off)
        for (const s of 'LR') R.push({ part: 'body', x: [1.672, 1.688], bands: ['edge'], side: s });   // (the lamp face's corners)
        for (const s of 'LR') R.push({ part: 'body', x: [-1.7, XD1], bands: ['tuck', 'side', 'window'], y: [-1, 1.4], side: s });   // (the rear quarters: the body's, never off)   // (the lamp strips, the D-pillars)
        R.push({ part: 'hood', x: [0.825, 1.672], bands: ['window', 'edge', 'crown'], top: true });   // (the bonnet ends at the lamp face's top: the face between the lamps stays with the body)
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
        //      between the arches; the windscreen and the tailgate's window the loft's top there, in glass (no lining) ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : at.x > XA && at.x < XB ? K.shade(P, 0.62) : DK;
          if (e === 1 || e === 7) return P;
          if (e === 2 || e === 6) {
            if (k === 1) return B;                                       // (the tail lamps' strips)
            if (kind === 'gf') return at.x < 0.79 ? G : P;               // (the side glass's front corner)
            if (kind === 'r') return k === 4 ? G : P;                    // (the quarter window and the door's; the D-pillar)
            return P;
          }
          return kind === 'gf' || kind === 'gr' ? G : P;                 // (the top: the windscreen, the tailgate's window; else the roof, the bonnet)
        }, { caps: { front: { col: P, low: 'bumperF', high: 'bumperF' }, rear: { col: P, low: 'bumperR', high: 'bumperR' } }, glassBend: [20, 38],
          glassBendTop: { gf: [20, 38], gr: [0, 40] } });   // (the windscreen shaded as if curved; the tailgate's window not down: seen from above it would mirror the ground)
        const LD = L.decal;
        // ---- the glasshouse: black frames round the side glass, the B-pillar black, the A-pillar's foot in paint ----
        LD.band([[-1.3425, 0], [0.79, 0], [0.79, 0.06], [-1.3425, 0.06]], B, null, 0.008);      // along the belt
        LD.band([[-1.3425, 0.93], [0.16, 0.93], [0.16, 1], [-1.3425, 1]], B, null, 0.008);      // under the roof's edge
        LD.band([[-0.44, 0], [-0.33, 0], [-0.33, 1], [-0.44, 1]], B, null, 0.01);               // the B-pillar (split at the door's edge)
        LD.band([[-1.3425, 0], [-1.3, 0], [-1.3, 1], [-1.3425, 1]], B, null, 0.01);             // the quarter window's rear frame
        LD.band([[0.2, 0.86], [0.79, 0.04], [0.79, 1], [0.16, 1]], P, null, 0.01);              // the A-pillar (paint, over the glass's edge)
        // ---- the roof's edges rounded: a bead in paint along each crease of the roof and down the A-pillar to the cowl (the drip rail's
        //      moulding: the slab's sharp edge catches the light round); the cowl's black scuttle panel at the windscreen's foot ----
        for (const sd of [-1, 1]) {
          const path = [-1.56, 0.16, 0.8].map(x => [x, L.prop(x, 'yt') - 0.004, sd * (L.prop(x, 'wt') - 0.004)]);
          K.sweep([[0.006, -0.022], [0.022, -0.004], [0.016, 0.016], [-0.004, 0.024], [-0.02, 0.004]].map(([u, v]) => [u * sd, v]), path, P, { capA: P, capB: P, part: 'body' });
        }
        LD.top([[0.815, -0.62], [0.855, -0.66], [0.855, 0.66], [0.815, 0.62]], B, 0.006);
        // ---- the side: the stripe along the doors between the arches, the shut lines, the handles, the repeaters, the fuel cap ----
        const X0 = XA + 0.04, X1 = XB - 0.04;
        LD.side([[X0, 0.425], [X1, 0.425], [X1, 0.5], [X0, 0.5]], S, null, 0.006);
        LD.side([[X0, 0.515], [X1, 0.515], [X1, 0.527], [X0, 0.527]], S, null, 0.006);
        for (const x of [0.79, -0.35]) LD.side([[x - 0.006, 0.33], [x + 0.006, 0.33], [x + 0.006, 0.86], [x - 0.006, 0.86]], D, null, 0.005);
        for (const [xa, xb] of [[1.475, 1.7], [-1.69, -1.505]]) LD.side([[xa, 0.529], [xb, 0.529], [xb, 0.541], [xa, 0.541]], D, null, 0.005);   // (the bumpers' joints)
        for (const sd of [-1, 1]) {
          K.rect(-0.24, 0.79, sd * 0.739, 0.13, 0.026, B, { dir: fz(sd), host: sd < 0 ? 'doorL' : 'doorR' });
          K.rect(1.3, 0.7, sd * 0.733, 0.06, 0.024, AMB, { dir: fz(sd), host: 'body' });
        }
        K.face([0, 1, 2, 3, 4, 5].map(i => [-1.25 + Math.cos(i * Math.PI / 3) * 0.045, 0.74 + Math.sin(i * Math.PI / 3) * 0.045, 0.734]), D, { host: 'body' });
        // ---- the wheel arches' lips: a band round each arch's rim just off the side, round with the round tyres (the loft cuts the arch in
        //      six), a shade under the paint; one primitive each, the body's (the fenders never come off) ----
        for (const A of K.arches) for (const sd of [-1, 1]) {
          const a0 = Math.acos(Math.min(1, A.half * K.sx / A.r)), n = 10, z = sd * (L.prop(A.x, 'w') + 0.008), r0 = A.r - 0.012, r1 = A.r + 0.042;
          const Q = (b, r) => [A.x + Math.cos(b) * r / K.sx, A.y + Math.sin(b) * r, z];
          K.at(A.x, A.y + A.r, z, () => { for (let i = 0; i < n; i++) { const b0 = a0 + (Math.PI - 2 * a0) * i / n, b1 = a0 + (Math.PI - 2 * a0) * (i + 1) / n;
            face([Q(b0, r0), Q(b1, r0), Q(b1, r1), Q(b0, r1)], K.shade(P, 0.8), [0, 0, sd]); } }, { part: 'body' });   // (by name: by its point the front one would be the mirror's)
        }
        // ---- the nose: the big square head lamps on the lamp face (parts of their own), the slim grille between them (with the body) ----
        for (const sd of [-1, 1]) { const hz = sd < 0 ? 'headL' : 'headR';   // (each lamp a part of its own: its ring, lens, reflectors and bulbs leave together)
          K.headLamp(1.687, 0.675, sd * 0.468, 0.1, { shape: 'rect', w: 0.27, h: 0.21, ring: B, host: hz });
          K.rect(1.6835, 0.675, sd * 0.468, 0.25, 0.19, [0.05, 0.05, 0.055], { part: 'body' });   // (its socket, dark: seen once the lamp is knocked out)
          for (const dz of [-0.066, 0.066]) {   // (behind the lens two reflector bowls, the main and the dipped beam, a bulb in each)
            K.discX(1.6925, 0.675, sd * 0.468 + dz, 0.06, 8, [0.7, 0.72, 0.76], 1, { host: hz });
            K.discX(1.6935, 0.675, sd * 0.468 + dz, 0.02, 6, [1, 0.99, 0.94], 1, { host: hz }); } }
        K.grille(1.684, 0.705, 0, 0.6, 0.065, { slats: 2 });   // (the nose panel's: the body)
        // ---- the front bumper: its intake, the plate, the indicators, the black lip under it ----
        K.part('bumperF', () => {
          K.grille(1.703, 0.32, 0, 0.92, 0.1, { slats: 2 });
          K.rect(1.704, 0.44, 0, 0.34, 0.1, WH);
          for (const sd of [-1, 1]) K.rect(1.703, 0.46, sd * 0.52, 0.16, 0.045, AMB);
          K.box(1.64, 0.19, 0, 0.13, 0.05, 1.28, 0, B);
        });
        // ---- the bonnet's scoop (the intercooler under it): a box rising from the bonnet, its black mouth facing forward ----
        K.part('hood', () => {   // (rounded shoulders, its top falling into the bonnet; a mesh in its black mouth)
          const ring = (x, h, w) => { const y = L.topY(x, 0); return [[x, y - 0.012, -w], [x, y + h * 0.72, -w + 0.012], [x, y + h, -w + 0.055], [x, y + h, w - 0.055], [x, y + h * 0.72, w - 0.012], [x, y - 0.012, w]]; };
          K.skin([ring(1.47, 0.075, 0.27), ring(1.43, 0.079, 0.268), ring(1.3, 0.068, 0.258), ring(1.0, 0.006, 0.235)], P, B, P);
          K.grille(1.472, L.topY(1.47, 0) + 0.034, 0, 0.44, 0.05, { slats: 3, col: B, slatCol: D });
        });
        // ---- the windscreen's wipers (a part: both blades come off together) ----
        for (const z of [-0.3, 0.22]) K.bar([0.86, L.topY(0.86, z - 0.22) + 0.012, z - 0.22], [0.815, L.topY(0.815, z + 0.22) + 0.012, z + 0.22], 0.01, B, { n: 4, part: 'wiperFront' });
        // ---- the mirrors (black) ----
        for (const sd of [-1, 1]) K.mirror(0.7, 0.96, sd * 0.8, { col: B, w: 0.1, h: 0.085, d: 0.13, crack: 1 });   // (crack: its glass breaks, it folds in: Razbijanje · nov način)
        // ---- the roof spoiler: a wedge on the roof's rear end rising to a kicked-up trailing edge over the tailgate's window, following
        //      the roof's crown across; its underside and trailing face dark, a high brake lamp in the middle of it ----
        K.part('spoiler', () => {
          const prof = (z) => { const lift = L.topY(-1.4, z) - L.topY(-1.4, 0);
            return [[-1.4, 1.387], [-1.42, 1.405], [-1.64, 1.425], [-1.725, 1.432], [-1.73, 1.395], [-1.6, 1.36]].map(([x, y]) => [x, y + lift, z]); };
          K.skin([-0.565, -0.22, 0.22, 0.565].map(prof), (k, e) => e === 3 ? K.shade(P, 0.45) : e >= 4 ? D : P, P, P);
          K.rect(-1.731, 1.414, 0, 0.3, 0.018, RED, { dir: '-x' });
          for (const sd of [-1, 1]) { const lift = L.topY(-1.4, sd * 0.575) - L.topY(-1.4, 0);   // (its endplates: fins a little over its ends)
            K.endplate([[-1.4, 1.38], [-1.62, 1.352], [-1.742, 1.388], [-1.737, 1.447]].map(([x, y]) => [x, y + lift]), sd * 0.573, 0.01, P); }
        }, { noCrush: true, noDent: true, hinge: [[-1.41, 1.39, -0.5], [-1.41, 1.39, 0.5]] });
        // ---- the tail: the lamps in their strips on the rear quarters (parts of their own: the lit lens, its dark copy in the body behind
        //      it (a smashed lamp's, the piece's face), the amber top and the ribs leave together; the strip stays, black), the garnish
        //      on the tailgate between them; the number plate (a thin plate) and the wiper mounted on the tailgate (parts of their own) ----
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';
          K.tailLamp(-1.642, 0.68, sd * 0.64, 0.13, 0.24, { host: tp });
          K.rect(-1.662, 0.68, sd * 0.64, 0.126, 0.236, [0.26, 0.03, 0.03], { dir: '-x', host: tp });   // (3 mm behind the lit face: unseen while it is there)
          K.rect(-1.661, 0.832, sd * 0.64, 0.125, 0.05, AMB, { dir: '-x', host: tp });
          for (const y of [0.62, 0.74]) K.rect(-1.667, y, sd * 0.64, 0.13, 0.008, [0.26, 0.03, 0.03], { dir: '-x', host: tp });   // (the lens' ribs)
        }
        K.part('trunk', () => K.rect(-1.661, 0.81, 0, 1.1, 0.07, D, { dir: '-x' }));
        K.box(-1.663, 0.625, 0, 0.006, 0.11, 0.32, 0, WH, null, true, { part: 'plate' });
        K.bar([-1.668, 0.862, 0], [-1.638, 1.12, 0.34], 0.01, B, { n: 4, part: 'wiperRear' });   // (its pivot on the panel under the glass; 2 cm off the glass: over a broken window's crack decal)
        // ---- the rear bumper: the black valance, the reflectors; the exhaust under it ----
        K.part('bumperR', () => {
          K.box(-1.63, 0.2, 0, 0.13, 0.045, 1.24, 0, B);
          for (const sd of [-1, 1]) K.rect(-1.694, 0.44, sd * 0.53, 0.14, 0.04, RED, { dir: '-x' });
        });
        K.exhaust(-1.72, 0.25, -0.42, 0.03, 0.2, { part: 'body' });
        // ---- the aerial (a part of its own): a foot on the roof by the spoiler, the whip raked far back, under the spoiler's top (the
        //      showroom frames the car by its height); it sinks with a crushed roof ----
        K.part('aerial', () => { const y0 = L.topY(-1.22, 0.36);
          K.box(-1.22, y0 - 0.004, 0.36, 0.05, 0.02, 0.024, 0, B, null, true);
          K.bar([-1.22, y0 + 0.012, 0.36], [-1.56, 1.425, 0.36], 0.0035, B, { n: K.hi ? 4 : 3 }); }, { noDent: true });
        // ---- the underbody: a black floor pan under the whole car, narrowed between the wheels over the axles (no seeing the road
        //      through the car from a low angle or through an open door) ----
        K.part('body', () => { for (const [x0, x1, w, y] of [[-1.655, -1.505, 0.655, 0.226], [-1.505, -0.855, 0.52, 0.2], [-0.855, 0.825, 0.672, 0.186], [0.825, 1.475, 0.52, 0.19], [1.475, 1.686, 0.645, 0.226]])
          face([[x0, y, -w], [x1, y, -w], [x1, y, w], [x0, y, w]], B, [0, -1, 0]); }, { noCrush: true });
        K.hinge('hood', [0.85, 0.91, -0.6], [0.85, 0.91, 0.6]);
        K.hinge('trunk', [-1.59, 1.33, -0.5], [-1.59, 1.33, 0.5]);
        for (const sd of [-1, 1]) K.hinge(sd < 0 ? 'doorL' : 'doorR', [0.78, 0.4, sd * 0.73], [0.78, 0.85, sd * 0.73]);
        // ---- Visoki (Nastavitve · Detajli avtov; the player's and the showroom's car on a computer): the small details. A generic badge
        //      (a chrome hexagon, a dark field, a chevron) on the grille and on the tailgate; the handles raised out of their recesses; the
        //      shut lines (the bonnet's along the fenders, the doors' at the sill, the tailgate's over the bumper); a chrome trim along the
        //      belt; the plates framed, dark bars for their characters ----
        if (K.hi) {
          const CH = K.chrome, badge = (x, y, dir, host) => { const o = { host }, sg = dir;
            K.discX(x, y, 0, 0.034, 6, CH, sg, o); K.discX(x + sg * 0.001, y, 0, 0.026, 6, D, sg, o);
            face([[x + sg * 0.002, y + 0.017, 0], [x + sg * 0.002, y - 0.012, -0.016], [x + sg * 0.002, y - 0.012, 0.016]], CH, [sg, 0, 0], o); };
          badge(1.6905, 0.705, 1, 'body'); badge(-1.664, 0.775, -1, 'trunk');
          for (const sd of [-1, 1]) K.box(-0.24, 0.781, sd * 0.746, 0.11, 0.016, 0.012, 0, [0.12, 0.12, 0.13], null, false, { host: sd < 0 ? 'doorL' : 'doorR' });   // (the handles' grips)
          for (const sd of [-1, 1]) LD.top([[0.86, sd * 0.655], [1.63, sd * 0.645], [1.63, sd * 0.652], [0.86, sd * 0.662]].map(([x, z]) => [x, z]), D, 0.004);   // (the bonnet's shut lines)
          LD.side([[-0.35, 0.33], [0.79, 0.33], [0.79, 0.337], [-0.35, 0.337]], D, null, 0.005);   // (the doors' at the sill)
          K.rect(-1.664, 0.548, 0, 1.12, 0.006, D, { dir: '-x', host: 'trunk' });   // (the tailgate's over the bumper)
          LD.band([[-1.3425, 0.06], [0.79, 0.06], [0.79, 0.085], [-1.3425, 0.085]], CH, null, 0.01);   // (the chrome trim on the belt)
          for (const [x, y, dir, host, w, h] of [[1.7035, 0.44, 1, 'bumperF', 0.34, 0.1], [-1.666, 0.68, -1, 'plate', 0.32, 0.11]]) {   // (the plates: a dark frame, four bars)
            K.rect(x - dir * 0.0008, y, 0, w + 0.024, h + 0.02, D, { dir: dir > 0 ? 'x' : '-x', host });
            for (let i = 0; i < 4; i++) K.rect(x + dir * 0.0012, y, (i - 1.5) * w * 0.21, w * 0.12, h * 0.48, [0.16, 0.17, 0.2], { dir: dir > 0 ? 'x' : '-x', host });
          }
        }
        if (K.hi) K.driver(-0.27, 1.1, -0.31, { inner: true, r: 0.12, lean: 0.25, hands: [0.24, 0.95, 0.15], feet: [0.6, 0.3, 0.11], suit: [0.14, 0.16, 0.2], helmet: [0.93, 0.93, 0.9] });   // (Visoki: the driver at the wheel, left; his hands' and feet's z: out from his middle)
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
        { const o = { inner: true, part: 'body' };   // (round the engine: the battery, the air filter's drum, the strut tops, the brake fluid's reservoir)
          K.box(0.98, 0.42, 0.44, 0.2, 0.17, 0.14, 0, [0.08, 0.08, 0.09], [0.16, 0.16, 0.18], true, o);
          K.cyl([1.0, 0.56, -0.43], [1.0, 0.7, -0.43], 0.085, [0.1, 0.1, 0.11], Object.assign({ n: 6, capA: null, capB: [0.62, 0.63, 0.66] }, o));
          for (const sd of [-1, 1]) K.box(1.15, 0.5, sd * 0.56, 0.1, 0.3, 0.1, 0, [0.2, 0.2, 0.22], [0.5, 0.5, 0.53], true, o);
          K.box(0.92, 0.6, -0.2, 0.06, 0.1, 0.06, 0, [0.9, 0.82, 0.4], [0.12, 0.12, 0.13], true, o); }
        // ---- the front's structure behind the bumper (seen once the bumper hangs or is off, as in a real car with its bumper torn away):
        //      the radiator support's panel across the nose, its posts by the fenders, the radiator in front of it (fins across), the
        //      frame rails' ends with the steel crash bar on them, the cross member under it, the inner aprons closing the arches' fronts:
        //      no hollow nose. The tail likewise: the rear panel behind the bumper, its crash bar ----
        { const o = { inner: true, part: 'body' }, ST = [0.15, 0.15, 0.16], od = (d) => Object.assign({ dir: d }, o);
          K.rect(1.56, 0.37, 0, 1.3, 0.3, K.shade(P, 0.62), od('x'));   // (the support panel, the posts and the aprons in the body's paint, darker: steel)
          K.box(1.6, 0.27, 0, 0.05, 0.41, 0.86, 0, [0.42, 0.44, 0.47], null, true, o);   // (the radiator's core, aluminium; dark fins across it)
          for (const y of [0.34, 0.42, 0.5, 0.58]) K.rect(1.6265, y, 0, 0.82, 0.016, [0.12, 0.12, 0.13], od('x'));
          for (const sd of [-1, 1]) {
            K.rect(1.586, 0.375, sd * 0.645, 0.07, 0.33, K.shade(P, 0.8), od('x'));
            K.rect(1.54, 0.365, sd * 0.675, 0.13, 0.33, K.shade(P, 0.55), od(fz(sd)));
            K.rect(1.57, 0.37, sd * 0.4, 0.14, 0.09, ST, od('y')); }
          K.rect(1.585, 0.225, 0, 1.3, 0.05, ST, od('x'));
          K.box(1.665, 0.27, 0, 0.05, 0.1, 1.24, 0, ST, null, true, o);
          K.rect(-1.6, 0.37, 0, 1.3, 0.28, K.shade(P, 0.62), od('-x'));
          K.box(-1.665, 0.27, 0, 0.05, 0.1, 1.24, 0, ST, null, true, o); }
        // ---- the dashboard's top (the outer shell, matte): from the windscreen's foot under the cowl's crown back over the dash, so the
        //      driver never looks under the short bonnet into the nose (the road, the wheel tubs) above the cockpit's own dashboard ----
        { const A = [0.8, 0.945, 0], E = [0.55, 0.855, 0], o = { part: 'body', noCrush: true };
          for (const sd of [1, -1]) { const B = [0.8, 0.945, sd * 0.26], C = [0.79, 0.905, sd * 0.68], D = [0.55, 0.855, sd * 0.68], f = (p) => K.face(sd > 0 ? p : p.slice().reverse(), K.lining, o);
            f([E, D, C]); f([E, C, B]); f([E, B, A]); } }
      },
    },
  });
})();
