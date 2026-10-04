/* Vehicle 'levk' — LEV KABRIO: the LEV family's coupé-cabriolet, its folding metal roof stowed in the boot (open top). Signature features:
   1) the LEV face (the big almond head lamps swept back along the wings, the wide mouth under a black strip, the slim grille), 2) an open
   two-seat cabin with two roll hoops behind the seats, 3) a long, high rear deck over the stowed roof, the tail a little longer than the
   hatch's, 4) a raked windscreen in a bright frame, 5) the rear lamps wrapping round the corners. L 3.88 W 1.74 H 1.30, wheelbase 2.47,
   overhangs F 0.78 R 0.63 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'levk', name: 'LEV KABRIO', cat: 'mali', ord: 5, drive: 'FF',
    desc: 'Kabriolet družine LEV: kovinska streha zložena v prtljažnik, dva sedeža in roll bar.',
    phys: { mass: 1150, a: 1.15, b: 1.32, kI: 1.14, kw: 220, redline: 7200, idle: 900, gears: [3.4, 2.15, 1.55, 1.2, 0.98, 0.83], final: 4.1, rw: 0.32, cDrag: 0.42, len: 3.88, wid: 1.74, steerMax: 0.64 },
    arc: { amax: 1.76, kv: 2.05, rmin: 4.2 },
    csp: { bx: 0.15, coast: -0.09, thr: -0.03, liftP: 0, pwr: 0, out: 1.05, turn: 0.98, w: 1 },   // (the FF layer: a little softer than the LEV S)
    stats: { power: 6, grip: 7, weight: 8, drift: 4 },
    price: 24000, pk: 'ta1', field: ['levk'],
    snd: { kind: 'i4', hz: 1.05, turbo: 0, loud: 0.95 },
    expect: { t100: [3.04, 3.57], vmax: [210, 224], latG: [2.25, 2.35], d100: [22.7, 25.1] },
    // the open car's parts: where the look has them, a lost one flies off from there
    parts: { set: 'open', ht: 1.3, y0: 0.21,
      over: { bumperF: { lx: 0.902, y: 0.39 }, bumperR: { lx: -0.969, y: 0.48 }, hood: { lx: 0.773, y: 0.82 }, trunk: { lx: -0.732, y: 1.01 },
        fenderL: { lx: 0.521, lz: -0.931, y: 0.68 }, fenderR: { lx: 0.521, lz: 0.931, y: 0.68 }, quarterL: { lx: -0.603, lz: -0.931, y: 0.71 }, quarterR: { lx: -0.603, lz: 0.931, y: 0.71 },
        doorL: { lx: 0.067, lz: -0.931, y: 0.76 }, doorR: { lx: 0.067, lz: 0.931, y: 0.76 }, mirrorL: { lx: 0.412, lz: -0.966, y: 0.96 }, mirrorR: { lx: 0.412, lz: 0.966, y: 0.96 } } },
    // the look (KIT API v1, render.js; look units = metres: the centre of mass at x 0, the axles at 1.15 / -1.32): the LEV S's loft from the
    // windscreen's base forward (the same nose, lamps, mouth, sides and wheels), behind it a coupé-cabriolet with its roof stowed: the
    // scuttle under the windscreen (closed, the dashboard's top), the cockpit open from the dashboard to the bulkhead behind the seats
    // (its top null: the lining, the floor and the bulkheads in the outer shell), the door tops at the belt (the windows down), the long
    // high deck (the boot lid: it holds the folded roof) to a tail 2 cm longer than the hatch's; the windscreen a pane of its own in a
    // bright frame
    look: {
      body: {
        // the rows sit on the cuts the kit makes anyway (the wheel arches' own sections, the parts' ends: the doors 0.72 / -0.62, the
        // bumpers 1.47 / -1.6851 and -1.91, the bonnet 0.965, the boot lid -1.895 / -0.84), so no sliver segments
        //       x        w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-1.95, 0.5, 0.27, 0.56, 0.42, 0.64, 0.03, 'b', 0.06],          // the rear bumper's face (the end cap, under the black strip)
          [-1.91, 0.6, 0.26, 0.62, 0.57, 0.69, 0.02, 'b', 0.07],               // the bumper's top
          [-1.895, 0.64, 0.255, 0.68, 0.58, 0.875, 0.03, 'b', 0.08],           // the boot lid's face (upright over the bumper: the lamps on its corners)
          [-1.84, 0.745, 0.25, 0.7, 0.62, 0.95, 0.035, 'b', 0.1],              // the deck's trailing edge (the lamps round the corners)
          [-1.76, 0.795, 0.25, 0.735, 0.67, 0.99, 0.04, 'b', 0.1],
          [-1.6851, 0.82, 0.25, 0.77, 0.69, 1.008, 0.042, 'b', 0.1],           // the rear arch's end (the bumper's sides to here)
          [-1.6362, 0.835, 0.25, 0.8, 0.71, 1.014, 0.042, 'b', 0.1],
          [-1.5026, 0.855, 0.27, 0.85, 0.735, 1.02, 0.04, 'b', 0.1],
          [-1.32, 0.86, 0.28, 0.89, 0.745, 1.025, 0.035, 'b', 0.1],            // the rear axle
          [-1.1375, 0.855, 0.27, 0.91, 0.75, 1.022, 0.032, 'b', 0.1],
          [-1.0038, 0.85, 0.262, 0.925, 0.75, 1.016, 0.03, 'b', 0.1],
          [-0.9549, 0.848, 0.26, 0.93, 0.75, 1.012, 0.028, 'b', 0.1],          // the rear arch's front end
          [-0.84, 0.845, 0.255, 0.935, 0.755, 1.0, 0.025, 'r', 0.1],           // the bulkhead behind the seats: the cockpit open from here
          [-0.62, 0.835, 0.245, 0.925, 0.775, 0.965, 0.0, 'r', 0.1],           // the door's rear edge (its top the belt: the window down)
          [0.45, 0.83, 0.215, 0.895, 0.755, 0.945, 0.035, 'gf', 0.1],          // the dashboard: the scuttle under the windscreen from here
          [0.72, 0.835, 0.205, 0.885, 0.725, 0.95, 0.045, 'gf', 0.1],          // the door's front edge
          [0.78, 0.85, 0.205, 0.875, 0.715, 0.95, 0.055, 'gf', 0.1],           // the front arch's back end
          [0.83, 0.855, 0.205, 0.865, 0.71, 0.95, 0.06, 'gf', 0.1],
          [0.965, 0.87, 0.21, 0.84, 0.7, 0.95, 0.065, 'b', 0.1],               // the windscreen's base (the cowl, the bonnet's back edge)
          [1.15, 0.871, 0.21, 0.8, 0.69, 0.9, 0.068, 'b', 0.1],                // (the front axle)
          [1.335, 0.865, 0.22, 0.77, 0.66, 0.85, 0.067, 'b', 0.1],
          [1.47, 0.835, 0.17, 0.72, 0.66, 0.81, 0.068, 'b', 0.1],              // the front bumper's corner from here
          [1.52, 0.82, 0.17, 0.74, 0.62, 0.81, 0.052, 'b', 0.1],               // the front arch's front end (the lamps' tails over it)
          [1.65, 0.745, 0.15, 0.66, 0.6, 0.77, 0.05, 'b', 0.09],               // (the lamps)
          [1.76, 0.655, 0.12, 0.58, 0.46, 0.72, 0.045, 'b', 0.07],
          [1.82, 0.55, 0.12, 0.56, 0.38, 0.675, 0.04, 'b', 0.06],
          [1.87, 0.42, 0.14, 0.555, 0.28, 0.635, 0.025, 'b', 0.05]],          // the face (the end cap: the mouth, the slim grille)
        eye: { x: -0.32, y: 1.13, near: 0.2, tilt: 0.05, style: 'open' },    // (behind the windscreen, its header 0.7 ahead, 0.14 over the eyes)
        door: [0.72, -0.62], bumpF: 0.4, bumpR: 0.2649, bumpY: [0.62, 0.66], wz: 0.1515,
        crush: { x0: 0, x1: 0, z: 0 },                                       // (no roof to crush: the windscreen's frame and the hoops stand)
        decalX: -1.33, decalY: 1.06, decalRz: 0.01, decalS: 0.5, decalPart: 'trunk',   // (the start number on the deck)
        lamps: [[1.7, 0.68, 0.58], [-1.91, 0.79, 0.5]],                       // (the glow: the head lamps' projectors, the tail lamps' inner ends)
        engine: [1.4, 0.88],
      },
      wheels: { style: 'std', spokes: 5, w: 0.2, rim: [0.82, 0.83, 0.85], cap: [0.3, 0.3, 0.32], gap: 0.05 },
      // the standard regions, but the rear bumper's top goes with the bumper (its sides to the rear arches), the boot lid is the deck from the
      // bulkhead behind the seats to its trailing edge (its top: the quarters keep the shoulders, the tail keeps the face with the lamps),
      // the bonnet the cowl to its front edge between the wings
      regions(std) {
        const out = [{ part: 'bumperR', x: [-2.2, -1.91], bands: ['tuck', 'side', 'window', 'edge', 'crown'] }];
        for (const r of std) out.push(r.part === 'trunk' ? Object.assign({}, r, { x: [-1.895, -0.84], bands: ['edge', 'crown'] })
          : r.part === 'hood' ? Object.assign({}, r, { x: [0.965, 2.2], bands: ['edge', 'crown'] }) : r);
        return out;
      },
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, D = [0.1, 0.1, 0.11], CH = [0.6, 0.62, 0.66], CREAM = [0.88, 0.85, 0.74];
        const RED = [0.45, 0.03, 0.04], LENS = [0.66, 0.05, 0.06], AMBER = [0.85, 0.42, 0.06], DRED = [0.5, 0.03, 0.04], BRIGHT = [0.78, 0.79, 0.82], SEAT = [0.5, 0.47, 0.43];
        // ---- the shell: the paint; the cockpit's top open; the scuttle's top dark (the dashboard under the windscreen); the sills a shade
        //      darker, the arches dark ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return at.arch ? B : K.shade(P, 0.62);
          if (kind === 'r' && e >= 3 && e <= 5) return null;
          if (kind === 'gf' && e >= 3 && e <= 5) return D;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P, colLow: P, cut: 0.4, low: 'bumperR', high: 'bumperR' } } });
        const pr = (x, k) => L.prop(x, k), DC = L.decal;
        // the half width at (x, y): the flat side to the belt, then the window band to the top's edge
        const wAt = (x, y) => { const w = pr(x, 'w'), yb = pr(x, 'ybelt'), wt = pr(x, 'wt'), yt = pr(x, 'yt'); return y <= yb ? w : y >= yt ? wt : w + (wt - w) * (y - yb) / (yt - yb); };
        // a flat polygon facing out (its points' order turned to face dir), one primitive: repeated points dropped (a clip at a section
        // repeats a corner) and the corner whose turn is the widest put first (K.face takes its facing from its first three points)
        const F = (pts, col, dir, o) => {
          const P = pts.filter((p, i) => { const q = pts[(i + pts.length - 1) % pts.length]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > 1e-5; }); if (P.length < 3) return;
          const cr = (i) => { const a = P[i], b = P[(i + 1) % P.length], c = P[(i + 2) % P.length], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
            return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; };
          let k = 0, best = -1; for (let i = 0; i < P.length; i++) { const l = Math.hypot(...cr(i)); if (l > best) { best = l; k = i; } }
          const Q = P.slice(k).concat(P.slice(0, k)), n = cr(k);
          K.face(n[0] * dir[0] + n[1] * dir[1] + n[2] * dir[2] < 0 ? [Q[2], Q[1], Q[0]].concat(Q.slice(3).reverse()) : Q, col, o); };
        // a point on the right (sd 1) or left (-1) half's top at x: s 0..1 the window band (the belt to the top's edge), 1..2 the edge,
        // 2..3 the crown; lifted off it in the section's plane
        const on = (x, s, sd, lift) => { const w = pr(x, 'w'), yb = pr(x, 'ybelt'), wt = pr(x, 'wt'), yt = pr(x, 'yt'), cr = pr(x, 'cr');
          const Q = [[w, yb], [wt, yt], [wt * 0.38, yt + cr], [0, yt + cr]], i = Math.min(2, Math.floor(s)), t = s - i, p = [Q[i][0] + (Q[i + 1][0] - Q[i][0]) * t, Q[i][1] + (Q[i + 1][1] - Q[i][1]) * t];
          const n = [Q[i + 1][1] - Q[i][1], -(Q[i + 1][0] - Q[i][0])], nl = Math.hypot(n[0], n[1]) || 1, l = lift == null ? 0.008 : lift;
          return [x, p[1] + n[1] / nl * l, (p[0] + n[0] / nl * l) * sd]; };
        // a polygon of points on the shell, lifted off it along its own normal (turned to the side out points to)
        const lay = (pts, col, out, lift, o) => { const n = [0, 0, 0]; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length];
            n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]); }
          const l = Math.hypot(n[0], n[1], n[2]) * (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0 ? -1 : 1) || 1, m = [n[0] / l, n[1] / l, n[2] / l];
          F(pts.map(p => [p[0] + m[0] * lift, p[1] + m[1] * lift, p[2] + m[2] * lift]), col, m, o); };
        // a polygon [[x, s] ...] on a half's top (s as for on()), cut at the loft's sections and at the bands' edges (each piece on one
        // panel), laid along each piece's own normal; rim: a colour under it (the polygon 12 % larger about its middle)
        const XC = L.secs.map(q => q.x), clip = (Q, k, xa, xb) => { const cut = (R, keep, X) => { const r = [];
            for (let i = 0; i < R.length; i++) { const a = R[i], b = R[(i + 1) % R.length], ia = keep(a[k]), ib = keep(b[k]); if (ia) r.push(a); if (ia !== ib) { const t = (X - a[k]) / (b[k] - a[k]), q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; q[k] = X; r.push(q); } }
            return r; }; return cut(cut(Q, x => x >= xa - 1e-9, xa), x => x <= xb + 1e-9, xb); };
        const onBand = (poly, col, sd, out, rim, o) => {
          const c = [0, 1].map(i => poly.reduce((t, p) => t + p[i], 0) / poly.length), big = poly.map(p => [c[0] + (p[0] - c[0]) * 1.12, c[1] + (p[1] - c[1]) * 1.12]);
          for (const [Q, cl, lf] of rim ? [[big, rim, 0.004], [poly, col, 0.008]] : [[poly, col, (o && o.lift) || 0.006]]) {
            const xs = Q.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), cuts = [x0].concat(XC.filter(x => x > x0 + 0.002 && x < x1 - 0.002), [x1]);
            for (let i = 0; i < cuts.length - 1; i++) for (const [s0, s1] of [[-1, 1], [1, 2], [2, 3]]) {
              const pc = clip(clip(Q, 0, cuts[i], cuts[i + 1]), 1, s0, s1); if (pc.length >= 3) lay(pc.map(([x, q]) => on(x, Math.max(0, q), sd, 0)), cl, out, lf, o && { host: o.host, part: o.part }); }
          } };

        // ---- the sides: the doors' shut lines (the side and the top), the black rubbing strips along the doors and the quarters (rising to
        //      the back), the handles, the repeaters ----
        for (const x of [0.713, -0.613]) { DC.side([[x - 0.006, 0.24], [x + 0.006, 0.24], [x + 0.006, 1.2], [x - 0.006, 1.2]], D, null, 0.009);
          DC.band([[x - 0.006, 0], [x + 0.006, 0], [x + 0.006, 1], [x - 0.006, 1]], D, null, 0.009); }
        DC.side([[-0.955, 0.575], [0.78, 0.515], [0.78, 0.57], [-0.955, 0.632]], B, null, 0.01);
        DC.band([[-0.82, 0.5], [0.6, 0.5], [0.6, 1], [-0.82, 1]], B, null, 0.006);              // (the rubber seal along the door tops and the quarters' by the hoops)
        K.face([0, 1, 2, 3, 4, 5].map(i => [-1.27 + Math.cos(-i * Math.PI / 3) * 0.045, 0.8 + Math.sin(-i * Math.PI / 3) * 0.045, pr(-1.27, 'w') + 0.007]), D);   // (the fuel filler's flap, right)
        for (const sd of [-1, 1]) {
          K.rect(-0.5, 0.86, sd * (pr(-0.5, 'w') + 0.008), 0.15, 0.028, D, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });
          K.rect(0.83, 0.66, sd * (pr(0.83, 'w') + 0.007), 0.055, 0.022, AMBER, { dir: sd < 0 ? '-z' : 'z' });
        }

        // ---- the bumpers' thick black strips: round the nose under the lamps (from the front arches) and round the tail over the bumper
        //      (to the rear arches); profile u < 0 out of the shell ----
        const strip = (y, xs, corner, xm, part, back) => { const half = xs.map(x => [x, y, wAt(x, y) + 0.004]).concat([[corner[0], y, corner[1]]]);
          const path = half.map(p => [p[0], p[1], -p[2]]).concat([[xm, y, 0]], half.slice().reverse());   // (the left side to the right: u < 0 out at the nose; reversed at the tail)
          K.sweep([[-0.035, -0.052], [0.006, -0.06], [0.006, 0.06], [-0.035, 0.052]], back ? path.slice().reverse() : path, B, Object.assign({ capA: B, capB: B }, part ? { part } : {})); };
        strip(0.49, [1.53, 1.7, 1.81], [1.862, 0.4], 1.876, 'bumperF');
        // ---- the nose (the LEV face): the almond head lamps on the corners (swept back along the wings' shoulders; two projectors with
        //      cream rings, the indicator's red tip by the grille), the slim grille between them, the wide mouth with its chrome slats, the
        //      fog lamps ----
        const LO = { host: 'body' };
        for (const sd of [-1, 1]) {
          onBand([[1.866, 0.15], [1.866, 0.85], [1.82, 1.1], [1.76, 1.2], [1.65, 1.18], [1.57, 1.0], [1.52, 0.8], [1.55, 0.4], [1.63, 0.12], [1.73, 0.0], [1.82, 0.02]], CH, sd, [0.4, 0.5, sd * 0.8], D, LO);
          for (const [x, s, r] of [[1.7, 0.75, 0.04], [1.79, 0.62, 0.033]]) { const p = on(x, s, sd, 0), dx = r * 1.25 * Math.abs((pr(x + 0.03, 'w') - pr(x - 0.03, 'w')) / 0.06);
            K.headLamp(x + dx + 0.004, p[1], p[2] - sd * r * 0.2, r, { n: 6, ring: CREAM, host: 'body' }); }
          const q = on(1.845, 0.55, sd, 0); K.discX(1.869, q[1], q[2] * 0.97, 0.016, 6, DRED, 1, LO);
        }
        K.part('bumperF', () => {
          K.rect(1.873, 0.6, 0, 0.52, 0.032, B);                                               // the slim grille
          K.grille(1.871, 0.305, 0, 0.7, 0.2, { slats: 3, col: [0.04, 0.04, 0.045], slatCol: CH, slatH: 0.016 });   // the wide mouth
          for (const z of [-0.18, 0, 0.18]) K.rect(1.878, 0.305, z, 0.014, 0.2, CH);
          for (const sd of [-1, 1]) {   // the fog lamps: round, on the corners beside the mouth
            const fog = (r) => { const pts = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, x = 1.792 + Math.cos(a) * r * 0.55, y = 0.3 + Math.sin(a) * r; pts.push([x, y, sd * (wAt(x, y) + 0.004)]); } return pts; };
            lay(fog(0.055), D, [0.5, 0, sd], 0.002); lay(fog(0.036), [0.8, 0.8, 0.76], [0.5, 0, sd], 0.005);
          }
        });
        // ---- the bonnet: the two slots on its right side ----
        K.part('hood', () => {
          for (const q of [[1.32, 1.4], [1.22, 1.3]]) { const p = [on(q[0], 1.25, 1, 0.006), on(q[0] - 0.12, 1.32, 1, 0.006), on(q[0] - 0.12, 1.4, 1, 0.006), on(q[0], 1.33, 1, 0.006)]; F(p, D, [0, 1, 0]); }
        }, { hinge: [[0.97, 0.95, -0.6], [0.97, 0.95, 0.6]] });

        // ---- the windscreen: a pane of its own (three facets, wrapping a little; one-sided, facing out: the driver sees through it) from
        //      the cowl up to the header, raked 25 degrees; its frame bright: the A-pillars and the header; the wipers parked on it ----
        const WB = [[0.958, 0.966, 0.68], [0.958, 1.018, 0.26]], WT = [[0.38, 1.252, 0.605], [0.38, 1.26, 0.24]];   // (the base's and the header's corner and inner points, right side)
        const mz = (p, sd) => [p[0], p[1], p[2] * sd];
        K.part('body', () => {
          F([mz(WB[1], -1), mz(WB[1], 1), mz(WT[1], 1), mz(WT[1], -1)], G, [0.3, 1, 0]);
          for (const sd of [-1, 1]) F([mz(WB[0], sd), mz(WB[1], sd), mz(WT[1], sd), mz(WT[0], sd)], G, [0.3, 1, sd * 0.25]);
          for (const sd of [-1, 1]) K.bar([0.962, 0.966, sd * 0.7], [0.373, 1.266, sd * 0.628], 0.032, BRIGHT, { n: 5 });   // the A-pillars
          K.bar([0.37, 1.27, -0.65], [0.37, 1.27, 0.65], 0.032, BRIGHT, { n: 6 });               // the header
          for (const z of [-0.36, 0.2]) F([[0.94, 1.032, z - 0.26], [0.932, 1.037, z - 0.26], [0.872, 1.064, z + 0.26], [0.88, 1.059, z + 0.26]], B, [0.4, 1, 0]);   // the wipers
        });
        // ---- the tail: the lamps round the corners (a chrome surround, the red lenses; the lit part at their inner ends on the boot lid's
        //      face), the black garnish across the boot lid between them; the strip over the bumper, its red fog lamp, the exhaust ----
        const fX = (y) => -1.91 + Math.max(0, Math.min(1, (y - 0.69) / 0.185)) * 0.015, fP = (y, z, l) => [fX(y) - l, y, z];   // (the boot lid's face: upright, leaning in 1.5 cm)
        const cP = (s, sd, l) => { const p = on(-1.895, s, sd, 0); return [p[0] - l, p[1], p[2]]; };   // (the face's corner: the band's line at its top section)
        for (const sd of [-1, 1]) {   // (each: on the face from its slanted inner end out to the corner, then round it on the band)
          F([fP(0.708, sd * 0.42, 0.004), cP(0.12, sd, 0.004), cP(0.98, sd, 0.004), fP(0.87, sd * 0.33, 0.004)], B, [-1, 0, 0], LO);                    // (the housing)
          F([fP(0.72, sd * 0.43, 0.008), cP(0.2, sd, 0.008), cP(0.92, sd, 0.008), fP(0.858, sd * 0.345, 0.008)], LENS, [-1, 0, 0], LO);                 // (the lens)
          F([fP(0.735, sd * 0.425, 0.011), fP(0.735, sd * 0.47, 0.011), fP(0.843, sd * 0.405, 0.011), fP(0.843, sd * 0.36, 0.011)], [0.86, 0.86, 0.83], [-1, 0, 0], LO);   // (the reversing light)
          onBand([[-1.895, 0.12], [-1.895, 0.98], [-1.84, 0.92], [-1.76, 0.78], [-1.69, 0.64], [-1.65, 0.55], [-1.69, 0.45], [-1.76, 0.31], [-1.84, 0.16]], B, sd, [-0.4, 0.3, sd * 0.85], null, LO);
          onBand([[-1.895, 0.2], [-1.895, 0.92], [-1.84, 0.86], [-1.76, 0.74], [-1.7, 0.62], [-1.67, 0.55], [-1.7, 0.48], [-1.76, 0.36], [-1.84, 0.24]], LENS, sd, [-0.4, 0.3, sd * 0.85], null, Object.assign({ lift: 0.01 }, LO));
          K.tailLamp(fX(0.79) - 0.004, 0.79, sd * 0.525, 0.1, 0.09, { d: 0.006, host: 'body' });   // (the lit part, on the face)
        }
        K.rect(fX(0.79) - 0.004, 0.79, 0, 0.6, 0.05, B, { dir: '-x', part: 'body' });          // the garnish
        K.hinge('trunk', [-0.86, 1.02, -0.6], [-0.86, 1.02, 0.6]);
        K.part('bumperR', () => {
          strip(0.64, [-1.76], [-1.93, 0.47], -1.955, null, true);
          K.rect(-1.954, 0.36, 0, 0.1, 0.035, RED, { dir: '-x' });                              // the fog lamp
          K.rect(-1.953, 0.49, 0, 0.44, 0.1, [0.9, 0.9, 0.86], { dir: '-x' });                  // the number plate (blank)
          K.exhaust(-1.95, 0.27, -0.48, 0.035, 0.2, { n: 6 });
        });
        // ---- the sails between the A-pillars' feet and the doors' front corners (the paint outside, the lining in), the mirrors on them ----
        for (const sd of [-1, 1]) { const q = [[0.958, 0.955, 0.703], [0.72, 0.952, 0.729], [0.72, 1.075, 0.672]].map(p => [p[0], p[1], sd * p[2]]);
          F(q, P, [0, 0, sd], { part: 'body' }); F(q.map(p => [p[0], p[1], p[2] - sd * 0.012]), K.lining, [0, 0, -sd], { part: 'body' });
          K.mirror(0.8, 1.0, sd * 0.875, { w: 0.1, h: 0.1, d: 0.15, z0: sd * 0.72 }); }
        // ---- the hinges: the doors at their front edges ----
        K.hinge('doorL', [0.71, 0.4, -0.82], [0.71, 0.85, -0.82]); K.hinge('doorR', [0.71, 0.4, 0.82], [0.71, 0.85, 0.82]);
        // ---- the cockpit (in sight): the two seats (the head rests in their backs), the dashboard, the steering wheel (left); the roll
        //      hoops behind the seats, bright, never crushed or dented ----
        for (const sd of [-1, 1]) { const z = sd * 0.36, b0 = [-0.54, 0.47], b1 = [-0.54 - Math.sin(0.26) * 0.7, 0.47 + Math.cos(0.26) * 0.7];
          K.box(-0.34, 0.38, z, 0.5, 0.12, 0.48, 0, SEAT, null, false, { part: 'body' });
          K.plate([[b0[0], b0[1], z - 0.235], [b0[0], b0[1], z + 0.235], [b1[0], b1[1], z + 0.14], [b1[0], b1[1], z - 0.14]], 0.1, SEAT, { part: 'body' }); }
        K.box(0.4, 0.66, 0, 0.12, 0.28, 1.46, 0, D, null, true, { part: 'body' });
        K.box(0.02, 0.24, 0, 0.62, 0.3, 0.2, 0, D, null, true, { part: 'body' });              // (the centre console between the seats)
        K.part('body', () => {   // (the steering wheel, leaning back on its column: low enough that the cockpit's own dashboard hides it from the seat)
          const C = [0.17, 0.82, -0.36], u = [-Math.sin(0.5), Math.cos(0.5), 0], pt = (a) => [C[0] + 0.17 * Math.sin(a) * u[0], C[1] + 0.17 * Math.sin(a) * u[1], C[2] + 0.17 * Math.cos(a)];
          for (let i = 0; i < 6; i++) K.bar(pt(i / 6 * Math.PI * 2), pt((i + 1) / 6 * Math.PI * 2), 0.016, B, { n: 3 });
          K.bar(C, [0.36, 0.72, -0.36], 0.02, D, { n: 3 });
        });
        for (const sd of [-1, 1]) { const zc = sd * 0.36, x = -0.875, y0 = 0.99, y1 = 1.225, h = 0.18, r = 0.025;   // (a square tube along the hoop's arch)
          K.sweep([[-r, -r], [r, -r], [r, r], [-r, r]], [[x, y0, zc - h], [x, y1 - 0.05, zc - h], [x, y1, zc - h + 0.05], [x, y1, zc + h - 0.05], [x, y1 - 0.05, zc + h], [x, y0, zc + h]],
            BRIGHT, { part: 'body', noCrush: true, noDent: true });
        }
        // ---- inside (seen once a part is off): the transverse four in the bay, the folded roof in the boot (its two panels stacked) ----
        K.engine(1.4, 0.36, 0, { l: 0.5, w: 0.6, h: 0.5, inner: true });
        K.plate([[-0.95, 0.86, -0.62], [-0.95, 0.86, 0.62], [-1.62, 0.8, 0.62], [-1.62, 0.8, -0.62]], 0.02, P, { inner: true, part: 'body' });
        K.plate([[-1.0, 0.92, -0.6], [-1.0, 0.92, 0.6], [-1.58, 0.88, 0.6], [-1.58, 0.88, -0.6]], 0.02, D, { inner: true, part: 'body' });
      },
    },
  });
})();
