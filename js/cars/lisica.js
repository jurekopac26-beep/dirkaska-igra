/* Vehicle 'lisica' — LISICA: a light 1990 roadster. Signature features: 1) a small open two-seater with a smiling oval mouth, 2) pop-up
   headlamps, 3) a roll hoop behind the seats, 4) a short rounded tail with oval lamps, 5) a low windscreen frame. L 3.95 W 1.68 H 1.23,
   wheelbase 2.27, overhangs F 0.82 R 0.86 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'lisica', name: 'LISICA', cat: 'sportni', ord: 4, drive: 'FR',
    desc: 'Lahek roadster iz leta 1990 z dvižnimi žarometi, odprto streho in varnostnim lokom.',
    phys: { mass: 980, a: 1.16, b: 1.11, kI: 1.08, kw: 120, redline: 7200, idle: 900, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 4.41, rw: 0.3, cDrag: 0.38, len: 3.95, wid: 1.68, steerMax: 0.64,
      spinK: 0.5 },
    arc: { amax: 1.72, kv: 2, rmin: 4 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.16, pwr: 0.06, out: 1.3, turn: 1.08, w: 1 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, turn)
    stats: { power: 2, grip: 7, weight: 9, drift: 7 },
    price: 18000, pk: 'ta1', field: ['lisica'],
    snd: { kind: 'i4', hz: 1.15, loud: 0.9 },
    expect: { t100: [3.54, 4.16], vmax: [187, 199], latG: [2.19, 2.29], d100: [22.8, 25.2] },
    parts: { set: 'open', ht: 1.23, y0: 0.18 },
    // the look (KIT API v1, render.js; look units = metres): one loft, soft and low, the cockpit an open top (its 'r' segments without a
    // top: the lining, the floor and the bulkheads in the outer shell) behind a closed scuttle under the windscreen; the regions: the front
    // bumper the whole lower nose with the mouth (from the front arch) and the nose's shoulders, the rear one the lower tail (from the rear
    // arch), the fenders and quarters the sides and shoulders between, the bonnet the top from the windscreen to the nose, the boot lid
    // the top behind the deck with the tail's shoulders, the doors. The details: the raised pop-up lamps, the smiling mouth, the oval tail
    // lamps, the windscreen in its black frame, the roll hoop over the folded soft top, the seats and the driver in sight
    look: {
      body: { len: 3.95, wid: 1.68, wz: 0.12, door: [0.55, -0.5], bumpY: [0.5, 0.5],
        //       x      w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-1.97, 0.64, 0.28, 0.6, 0.54, 0.735, 0.01, 'b', 0.08],     // the tail's face: the oval lamps, the plate
          [-1.925, 0.76, 0.235, 0.645, 0.64, 0.79, 0.015, 'b', 0.1],
          [-1.81, 0.825, 0.205, 0.68, 0.7, 0.83, 0.02, 'b', 0.12],
          [-1.11, 0.84, 0.19, 0.69, 0.71, 0.845, 0.02, 'b', 0.12],        // the rear axle: the boot lid's front edge, the deck ahead of it
          [-0.76, 0.84, 0.18, 0.685, 0.67, 0.845, 0.0, 'r', 0.12],        // the cockpit (open: no top) from the bulkhead behind the seats
          [-0.5, 0.84, 0.18, 0.68, 0.665, 0.84, 0.0, 'r', 0.12],          // (the door's rear edge)
          [0.3, 0.84, 0.18, 0.675, 0.68, 0.825, 0.03, 'gf', 0.12],        // the scuttle under the windscreen (closed: the dashboard's top)
          [0.55, 0.84, 0.18, 0.665, 0.72, 0.8, 0.035, 'b', 0.12],         // the windscreen's base, the door's front edge
          [1.16, 0.84, 0.19, 0.62, 0.75, 0.735, 0.035, 'b', 0.12],        // the front axle: the bonnet sloping down to the nose
          [1.51, 0.825, 0.2, 0.58, 0.72, 0.675, 0.035, 'b', 0.12],
          [1.82, 0.765, 0.21, 0.52, 0.64, 0.605, 0.03, 'b', 0.11],
          [1.93, 0.665, 0.22, 0.46, 0.54, 0.545, 0.02, 'b', 0.1],
          [1.98, 0.52, 0.235, 0.425, 0.42, 0.5, 0.012, 'b', 0.09]],       // the nose's face: the smiling mouth
        eye: { x: -0.4, y: 1.04, near: 0.2, tilt: 0.06, style: 'open' },   // (low behind the windscreen, its frame 9 cm over the eyes)
        decalX: 1.02, decalY: 0.785, decalRz: -0.107, decalS: 0.55, decalPart: 'hood',   // (the start number on the bonnet, between the lamps)
        crush: { x0: 0.08, x1: 0.45, z: 0.6 } },                          // (a roll-over folds the windscreen's frame; the hoop stands)
      wheels: { style: 'std', spokes: 7, w: 0.19, rim: [0.74, 0.75, 0.78], gap: 0.05 },
      // the standard regions, the bumpers taken further (the lower nose from the front arch with the nose's shoulders round its corners, the
      // lower tail from the rear arch: first, so a side panel over them is cut at their top and the rest goes with the fender / quarter),
      // the fenders and quarters up to the bumpers' depths (not round the corners: their pieces lie flat), the boot lid behind the deck
      // with the tail's shoulders (no rear glass: the default takes the tail's last 25 cm)
      regions: (std) => {
        const by = (p, o) => std.filter(r => r.part === p).map(r => Object.assign({}, r, o || {}));
        return [].concat(by('mirrorL'), by('mirrorR'), by('doorL'), by('doorR'), by('bumperF', { x: [1.82, 2.6], bands: ['side', 'window'], y: null }),
          by('bumperF', { x: [1.51, 2.6] }), by('bumperR', { x: [-2.6, -1.46] }), by('fenderL', { x: [0.55, 1.82] }), by('fenderR', { x: [0.55, 1.82] }),
          by('quarterL', { x: [-1.81, -0.5] }), by('quarterR', { x: [-1.81, -0.5] }), by('hood'), by('trunk', { x: [-2.6, -1.11] }));
      },
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, D = [0.09, 0.09, 0.1], SEAT = [0.5, 0.39, 0.27], HOOP = [0.7, 0.71, 0.74], TOP = [0.05, 0.05, 0.055], AMB = [1, 0.62, 0.1];
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (the sills: from the rear arch to the front one)
        // ---- the shell: the paint; the cockpit's top open; the scuttle's top dark (the dashboard under the glass); the sills a shade
        //      darker, black ledges in the arches, the bumpers' undersides a little darker than the paint ----
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return at.arch ? B : at.x > XA && at.x < XB ? K.shade(P, 0.62) : K.shade(P, 0.86);
          if (kind === 'r' && e >= 3 && e <= 5) return null;
          if (kind === 'gf' && e >= 3 && e <= 5) return D;
          return P;
        }, { caps: { front: { col: P, low: 'bumperF', high: 'bumperF' }, rear: { col: P, high: 'body' } } });
        const DC = L.decal, SH = K.shade(P, 0.45);
        // the doors' shut lines (the side and the shoulder), the handles; the side markers on the bumper's flanks
        for (const x of [-0.5, 0.55]) { DC.side([[x - 0.006, 0.31], [x + 0.006, 0.31], [x + 0.006, 0.68], [x - 0.006, 0.68]], SH, null, 0.004);
          DC.band([[x - 0.006, 0], [x + 0.006, 0], [x + 0.006, 1], [x - 0.006, 1]], SH, null, 0.004); }
        DC.side([[-0.42, 0.615], [-0.31, 0.615], [-0.31, 0.64], [-0.42, 0.64]], B, null, 0.005);
        DC.side([[1.64, 0.43], [1.74, 0.43], [1.74, 0.46], [1.64, 0.46]], AMB, null, 0.005);
        DC.side([[1.51, 0.494], [1.9, 0.494], [1.9, 0.506], [1.51, 0.506]], SH, null, 0.004);   // (the front bumper's top on its flanks)
        // ---- the nose: the smiling mouth (wide, its top flatter than its bottom), the indicators in the bumper's corners ----
        K.part('bumperF', () => {
          const m = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, s = Math.sin(a); m.push([1.983, 0.335 + s * (s > 0 ? 0.045 : 0.08), -Math.cos(a) * 0.33]); }
          K.face(m, B);
          const lip = [[1.986, 0.4, 0.24]]; for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; lip.push([1.986, 0.392 - Math.sin(a) * 0.05, Math.cos(a) * 0.24]); }
          K.face(lip.concat([[1.986, 0.4, -0.24]]), P);   // (its upper lip, the paint over the mouth's middle: the corners turn up)
          for (const sd of [-1, 1]) { const q = [[0.15, 0.35], [0.8, 0.35], [0.8, 0.41], [0.15, 0.41]].map(([t, y]) => [1.93 + 0.05 * t + 0.0038, y, sd * (0.665 - 0.145 * t + 0.0013)]);
            K.face(sd > 0 ? q : q.reverse(), AMB); }
        });
        // ---- the pop-up lamps, raised: a box on each front corner (its face black, the lens in it), the body's (the lamp units stay when a
        //      fender or the bonnet goes, as their mechanism does; on a fender its piece would not lie flat) ----
        for (const sd of [-1, 1]) {
          const host = 'body', prof = [[1.47, 0.665], [1.655, 0.665], [1.665, 0.79], [1.63, 0.83], [1.47, 0.82]];
          K.skin([0.47, 0.79].map(z => prof.map(([x, y]) => [x, y, sd * z])), (k, e) => e === 1 ? B : P, P, P, { host });
          K.headLamp(1.669, 0.728, sd * 0.63, 0.05, { shape: 'rect', w: 0.25, h: 0.095, ring: null, host });
        }
        // ---- the windscreen: one pane facing forward (the driver sees out through it) in its black frame; the wipers; the mirrors ----
        K.face([[0.55, 0.82, 0.66], [0.55, 0.82, -0.66], [0.13, 1.13, -0.6], [0.13, 1.13, 0.6]], G, { part: 'body' });
        K.part('body', () => {
          K.bar([0.13, 1.14, -0.615], [0.13, 1.14, 0.615], 0.022, B, { n: 4 });
          for (const sd of [-1, 1]) K.bar([0.555, 0.81, sd * 0.672], [0.13, 1.14, sd * 0.612], 0.02, B, { n: 4 });
          for (const z of [-0.42, 0.06]) K.bar([0.6, 0.836, z - 0.24], [0.57, 0.842, z + 0.24], 0.009, B, { n: 3 });
        });
        for (const sd of [-1, 1]) K.mirror(0.45, 0.8, sd * 0.9, { col: B, w: 0.05, h: 0.075, d: 0.13, z0: sd * 0.79 });
        // ---- the tail: the oval lamps in black bezels (the lit lens a rounded bar: the tail mesh), the plate on the bumper, the pipe ----
        for (const sd of [-1, 1]) {
          const zc = sd * 0.4, bz = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; bz.push([-1.972, 0.66 + Math.sin(a) * 0.072, zc + Math.cos(a) * 0.165]); }
          K.face(bz, B, { part: 'body' });
          K.tailLamp(-1.974, 0.66, zc, 0.17, 0.1, { d: 0.012 });
          for (const s2 of [-1, 1]) K.tailLamp(-1.98, 0.66, zc + s2 * 0.085, 0.1, 0.1, { round: true });
        }
        K.rect(-1.973, 0.43, 0, 0.4, 0.11, [0.93, 0.93, 0.9], { dir: '-x', part: 'bumperR' });
        K.rect(-1.972, 0.5, 0, 1.28, 0.012, SH, { dir: '-x', part: 'bumperR' }); DC.side([[-1.97, 0.494], [-1.47, 0.494], [-1.47, 0.506], [-1.97, 0.506]], SH, null, 0.004);   // (its top's shut line)
        K.exhaust(-1.995, 0.25, 0.42, 0.032, 0.2, { part: 'body' });
        const fy = L.topY(-1.0, 0.6) + 0.004, fc = []; for (let i = 0; i < 8; i++) { const a = -i / 8 * Math.PI * 2; fc.push([-1.0 + Math.cos(a) * 0.045, fy, 0.6 + Math.sin(a) * 0.045]); }
        K.face(fc, [0.2, 0.2, 0.21], { part: 'body' });   // (the fuel filler's cap on the right of the deck)
        // ---- the cockpit (in sight): the seats, the dashboard, the driver in the left seat; the roll hoop behind them (never crushed or
        //      dented), the soft top folded on the deck behind it ----
        for (const sd of [-1, 1]) K.seat(-0.3, 0.37, sd * 0.33, { w: 0.46, l: 0.46, back: 0.56, tilt: 0.3, col: SEAT });
        K.box(0.2, 0.6, 0, 0.2, 0.2, 1.24, 0, D, null, true, { part: 'body' });
        K.driver(-0.47, 1.06, -0.33, { r: 0.125, lean: 0.3, suit: [0.15, 0.17, 0.2], hands: [0.02, 0.78, 0.16] });
        K.part('body', () => {   // (his wheel: leaning back on its column, low enough that the cockpit's own dashboard hides it from the seat)
          const C = [0.03, 0.77, -0.33], u = [-Math.sin(0.55), Math.cos(0.55), 0], pt = (a) => [C[0] + 0.16 * Math.sin(a) * u[0], C[1] + 0.16 * Math.sin(a) * u[1], C[2] + 0.16 * Math.cos(a)];
          for (let i = 0; i < 6; i++) K.bar(pt(i / 6 * Math.PI * 2), pt((i + 1) / 6 * Math.PI * 2), 0.014, B, { n: 3 });
          K.bar(C, [0.22, 0.66, -0.33], 0.02, D, { n: 4 }); K.bar(pt(0), pt(Math.PI), 0.01, D, { n: 3 });
        });
        const hx = -0.84;
        K.cage([[[hx + 0.02, 0.84, -0.56], [hx, 1.12, -0.55]], [[hx, 1.12, -0.55], [hx - 0.01, 1.2, -0.44]], [[hx - 0.01, 1.2, -0.44], [hx - 0.01, 1.2, 0.44]], [[hx - 0.01, 1.2, 0.44], [hx, 1.12, 0.55]],
          [[hx, 1.12, 0.55], [hx + 0.02, 0.84, 0.56]], [[hx, 1.13, -0.53], [-1.06, 0.87, -0.5]], [[hx, 1.13, 0.53], [-1.06, 0.87, 0.5]]], 0.024, HOOP, { n: 6, noCrush: true, noDent: true });
        const prof2 = [[-0.87, 0.85], [-0.895, 0.925], [-0.97, 0.965], [-1.055, 0.94], [-1.1, 0.865]];
        K.skin([[-0.6, 0.8], [-0.52, 1], [0.52, 1], [0.6, 0.8]].map(([z, k]) => prof2.map(([x, y]) => [x, 0.85 + (y - 0.85) * k, z])), TOP, TOP, TOP, { part: 'body' });
        // ---- the hinges: the bonnet at the windscreen, the boot lid at the deck, the doors at their front edges ----
        K.hinge('hood', [0.56, 0.83, -0.6], [0.56, 0.83, 0.6]);
        K.hinge('trunk', [-1.115, 0.86, -0.6], [-1.115, 0.86, 0.6]);
        K.hinge('doorL', [0.55, 0.3, -0.84], [0.55, 0.75, -0.84]); K.hinge('doorR', [0.55, 0.3, 0.84], [0.55, 0.75, 0.84]);
        // ---- inside (seen once a part is off): the four under the bonnet, the radiator behind the mouth, the spare lying in the boot; the
        //      boot's front wall and the bay's firewall (the cockpit's bulkheads face the cockpit only: from the boot or the bay they would
        //      show the seats and the footwell), the lining's ring 3 cm in, facing back / forward. The boot's wall is in the outer shell (it
        //      faces back, never seen from the seat): a low camera behind the car looks in under the tail and would see the seats' bases ----
        K.engine(0.82, 0.28, 0, { l: 0.5, w: 0.46, h: 0.38, inner: true });
        K.box(1.8, 0.27, 0, 0.05, 0.3, 0.72, 0, [0.12, 0.12, 0.13], null, false, { inner: true, part: 'body' });
        K.tyre(-1.56, 0.33, 0.12, { axis: 'y', r: 0.24, w: 0.12, inner: true, part: 'body' });
        const wall = (x, yt, wt, cr, ybelt, dir, inner) => { const q = [[0.2, 0.753], [0.3, 0.81], [Math.min(ybelt, yt - 0.03), 0.81], [yt - 0.03, wt - 0.03], [yt - 0.03 + cr, (wt - 0.03) * 0.38]], R = q.map(([y, z]) => [x, y, dir * z]);
          K.face(R.concat(q.slice().reverse().map(([y, z]) => [x, y, -dir * z])), K.lining, { inner, part: 'body' }); };
        wall(-0.766, 0.845, 0.67, 0, 0.685, 1, false); wall(0.306, 0.825, 0.68, 0.03, 0.675, -1, true);
      },
    },
  });
})();
