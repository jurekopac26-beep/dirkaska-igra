/* Vehicle 'levs' — LEV S: the road three-door hot hatch of the LEV family (the LEV R is its rally sibling). Signature features: 1) the
   big almond head lamps on the nose's corners, swept back along the wings, two projectors in each, 2) the wide mouth with its slats and
   round fog lamps under a thick black strip, the slim grille between the lamps, 3) the steep windscreen flowing into the dark roof, the
   belt rising to the rear, 4) the rear lamps wrapping round the corners, the black garnish across the upright tailgate, the small roof
   spoiler, the strip over the rear bumper. L 3.86 W 1.74 H 1.47, wheelbase 2.47, overhangs F 0.78 R 0.61 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'levs', name: 'LEV S', cat: 'mali', ord: 4, drive: 'FF',
    desc: 'Lahek trivratni hatchback z velikimi mandljastimi žarometi, živahen v ovinkih.',
    phys: { mass: 1080, a: 1.15, b: 1.32, kI: 1.12, kw: 250, redline: 7600, idle: 950, gears: [3.4, 2.15, 1.55, 1.2, 0.98, 0.83], final: 4.2, rw: 0.32, cDrag: 0.4, len: 3.86, wid: 1.74, steerMax: 0.64 },
    arc: { amax: 1.8, kv: 2.1, rmin: 4.1 },
    csp: { bx: 0.15, coast: -0.099, thr: -0.03, liftP: 0, pwr: 0, out: 1, turn: 1, w: 1.02 },   // (the FF layer: pivots on the brakes, the throttle pulls it straight)
    stats: { power: 7, grip: 8, weight: 8, drift: 4 },
    price: 20000, pk: 'ta1', field: ['levs'],
    snd: { kind: 'i4', hz: 1.15, turbo: 0, loud: 1 },
    expect: { t100: [3.02, 3.55], vmax: [228, 243], latG: [2.3, 2.4], d100: [22.7, 25.1] },
    // the standard car's parts and the wing (the small roof spoiler): where the look has them, a lost one flies off from there
    parts: { set: 'race', ht: 1.47, y0: 0.21,
      over: { bumperF: { lx: 0.925, y: 0.38 }, bumperR: { lx: -0.935, y: 0.44 }, hood: { lx: 0.738, y: 0.85 }, trunk: { lx: -0.868, y: 1.03 }, wing: { lx: -0.77, y: 1.39 },
        fenderL: { lx: 0.53, lz: -0.92, y: 0.7 }, fenderR: { lx: 0.53, lz: 0.92, y: 0.7 }, quarterL: { lx: -0.655, lz: -0.85, y: 0.86 }, quarterR: { lx: -0.655, lz: 0.85, y: 0.86 },
        doorL: { lx: -0.01, lz: -0.87, y: 0.78 }, doorR: { lx: -0.01, lz: 0.87, y: 0.78 }, mirrorL: { lx: 0.255, lz: -0.98, y: 0.96 }, mirrorR: { lx: 0.255, lz: 0.98, y: 0.96 } } },
    // the look (KIT API v1, render.js; look units = metres: the centre of mass at x 0, the axles at 1.15 / -1.32). Its lines (at every row: the windscreen raked 26 degrees
    // from its base at 0.97 to the header at 0.18, the roof's top 1.466, the belt rising from 0.87 at the A-pillar to 1.06 at the
    // C-pillar, the rear glass at 48 degrees, the tailgate upright down to the bumper; the arches 0.871 / 0.856 half wide, the doors
    // 0.83); stock: no flares, wing, scoop or livery (the LEV R is its rally sibling)
    look: {
      body: {
        // the rows sit on the cuts the kit makes anyway (the wheel arches' own sections, the parts' ends: the doors 0.72 / -0.59, the
        // bumpers 1.47 / -1.5026, the bonnet 0.965, the tailgate's top -1.2), so no sliver segments
        //       x        w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-1.93, 0.5, 0.27, 0.56, 0.42, 0.64, 0.03, 'b', 0.06],          // the rear bumper's face (the end cap, under the black strip)
          [-1.89, 0.56, 0.26, 0.62, 0.46, 0.69, 0.02, 'b', 0.07],              // the bumper's top
          [-1.875, 0.62, 0.255, 0.66, 0.3, 0.9, 0.03, 'b', 0.08],              // the tailgate's face (upright over the bumper)
          [-1.82, 0.73, 0.25, 0.66, 0.46, 0.95, 0.03, 'b', 0.1],               // (the lamps' inner ends on the corners)
          [-1.76, 0.785, 0.25, 0.7, 0.52, 0.99, 0.035, 'gr', 0.1],             // the rear glass's foot
          [-1.685, 0.815, 0.25, 0.74, 0.56, 1.06, 0.045, 'gr', 0.1],           // (the rear arch's end)
          [-1.636, 0.83, 0.25, 0.78, 0.6, 1.1, 0.05, 'gr', 0.1],
          [-1.5026, 0.855, 0.27, 0.8, 0.58, 1.25, 0.09, 'gr', 0.1],            // the quarters' rear ends (the rear glass curving up to the roof)
          [-1.32, 0.86, 0.28, 0.74, 0.55, 1.3, 0.1, 'r', 0.1],                 // the rear axle: the glass's top under the roof's lip, the spoiler
          [-1.2, 0.85, 0.27, 0.8, 0.5, 1.37, 0.055, 'r', 0.1],                 // the roof's rear edge (the C-pillar's solid paint)
          [-1.137, 0.845, 0.265, 0.86, 0.52, 1.39, 0.045, 'r', 0.1],           // the side glass's end (its foot rising to it: a band of paint)
          [-1.004, 0.835, 0.255, 0.9, 0.52, 1.4, 0.046, 'r', 0.1],
          [-0.955, 0.83, 0.25, 0.94, 0.52, 1.405, 0.046, 'r', 0.1],            // the rear arch's front end
          [-0.59, 0.825, 0.24, 0.95, 0.53, 1.42, 0.045, 'r', 0.1],             // the B-pillar (the door's rear edge), the roof's top
          [0.18, 0.83, 0.22, 0.9, 0.55, 1.34, 0.048, 'gf', 0.1],               // the windscreen's top
          [0.6, 0.83, 0.21, 0.89, 0.62, 1.12, 0.077, 'gf', 0.1],               // (the A-pillar)
          [0.72, 0.835, 0.205, 0.88, 0.66, 1.06, 0.08, 'gf', 0.1],             // the door's front edge
          [0.78, 0.85, 0.205, 0.87, 0.68, 1.02, 0.08, 'gf', 0.1],              // the front arch's back end
          [0.83, 0.855, 0.205, 0.86, 0.69, 1.0, 0.075, 'gf', 0.1],
          [0.965, 0.87, 0.21, 0.84, 0.7, 0.95, 0.065, 'b', 0.1],               // the windscreen's base (the cowl, the bonnet's back edge)
          [1.15, 0.871, 0.21, 0.8, 0.69, 0.9, 0.068, 'b', 0.1],                // (the front axle)
          [1.335, 0.865, 0.22, 0.77, 0.66, 0.85, 0.067, 'b', 0.1],
          [1.47, 0.835, 0.17, 0.72, 0.66, 0.81, 0.068, 'b', 0.1],              // the front bumper's corner from here
          [1.52, 0.82, 0.17, 0.74, 0.62, 0.81, 0.052, 'b', 0.1],               // the front arch's front end (the lamps' tails over it)
          [1.65, 0.745, 0.15, 0.66, 0.6, 0.77, 0.05, 'b', 0.09],               // (the lamps)
          [1.76, 0.655, 0.12, 0.58, 0.46, 0.72, 0.045, 'b', 0.07],
          [1.82, 0.55, 0.12, 0.56, 0.38, 0.675, 0.04, 'b', 0.06],
          [1.87, 0.42, 0.14, 0.555, 0.28, 0.635, 0.025, 'b', 0.05]],          // the face (the end cap: the mouth, the slim grille)
        eye: { x: -0.26, y: 1.18, style: 'closed' },
        door: [0.72, -0.59], bumpF: 0.4, bumpR: 0.4274, bumpY: [0.62, 0.66], wz: 0.1515,
        crush: { x0: -1.66, x1: 0.45, z: 0.6 },                              // (the roof to the spoiler's trailing edge: it goes down whole with it)
        decalX: -0.55, decalY: 1.466, decalS: 0.6,                           // (the start number on the roof's top)
        lamps: [[1.7, 0.68, 0.58], [-1.72, 0.87, 0.67]],                     // (the glow: the head lamps' projectors, the tail lamps' middles)
        engine: [1.4, 0.88],
      },
      wheels: { style: 'std', spokes: 5, w: 0.2, rim: [0.82, 0.83, 0.85], cap: [0.3, 0.3, 0.32], gap: 0.05 },
      // the standard regions, but the rear bumper's top goes with the bumper, the tailgate is the panel between the lamps up to the roof (its
      // glass, the spoiler's roof lip), the bonnet the cowl to its front edge between the wings, the quarters below the belt (the C-pillars
      // and the quarter glass stay: a lost quarter lies flat)
      regions(std) {
        const out = [{ part: 'bumperR', x: [-2.2, -1.89], bands: ['tuck', 'side', 'window', 'edge', 'crown'] }];
        for (const r of std) out.push(r.part === 'trunk' ? Object.assign({}, r, { x: [-2.6, -1.2], bands: ['edge', 'crown'] })
          : r.part === 'hood' ? Object.assign({}, r, { x: [0.965, 2.2], bands: ['edge', 'crown'] })
            : r.part === 'quarterL' || r.part === 'quarterR' ? Object.assign({}, r, { bands: ['tuck', 'side'] }) : r);
        return out;
      },
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, D = [0.1, 0.1, 0.11], ROOF = K.rgb(0x2c2e33), CH = [0.6, 0.62, 0.66], CREAM = [0.88, 0.85, 0.74];
        const RED = [0.45, 0.03, 0.04], AMBER = [0.85, 0.42, 0.06], DRED = [0.5, 0.03, 0.04];
        // ---- the shell: the paint; the glass (the windscreen, the side windows to the C-pillar, the rear glass); the roof's panel dark
        //      gloss from the C-pillars to the windscreen's top; the arches dark ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return at.arch ? B : K.shade(P, 0.62);
          if (kind === 'gf') return e >= 3 && e <= 5 ? G : (e === 2 || e === 6) && at.x < 0.62 ? G : P;
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : P;
          if (kind === 'r') return e === 2 || e === 6 ? (at.x > -1.15 ? G : P) : e >= 3 && e <= 5 && at.x > -1.24 ? ROOF : P;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P, colLow: P, cut: 0.4, low: 'bumperR', high: 'bumperR' } } });
        const pr = (x, k) => L.prop(x, k), DC = L.decal;
        // the half width at (x, y): the flat side to the belt, then the window band to the top's edge
        const wAt = (x, y) => { const w = pr(x, 'w'), yb = pr(x, 'ybelt'), wt = pr(x, 'wt'), yt = pr(x, 'yt'); return y <= yb ? w : y >= yt ? wt : w + (wt - w) * (y - yb) / (yt - yb); };
        // a flat polygon facing out (its points' order turned to face dir), one primitive
        const F = (pts, col, dir, o) => { const a = pts[0], b = pts[1], c = pts[2], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
          const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; K.face(n[0] * dir[0] + n[1] * dir[1] + n[2] * dir[2] < 0 ? pts.slice().reverse() : pts, col, o); };
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
          for (const [Q, cl, lf] of rim ? [[big, rim, 0.004], [poly, col, 0.008]] : [[poly, col, 0.006]]) {
            const xs = Q.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), cuts = [x0].concat(XC.filter(x => x > x0 + 0.002 && x < x1 - 0.002), [x1]);
            for (let i = 0; i < cuts.length - 1; i++) for (const [s0, s1] of [[-1, 1], [1, 2], [2, 3]]) {
              const pc = clip(clip(Q, 0, cuts[i], cuts[i + 1]), 1, s0, s1); if (pc.length >= 3) lay(pc.map(([x, q]) => on(x, Math.max(0, q), sd, 0)), cl, out, lf, o); }
          } };

        // ---- the side glass's shape: the B-pillar's frame (black), the glass's foot rising to the C-pillar (paint over the band's foot), the
        //      A-pillar's foot by the mirror ----
        DC.band([[-0.62, 0], [-0.575, 0], [-0.575, 1], [-0.62, 1]], B, null, 0.008);
        DC.band([[-1.137, 0], [-0.955, 0], [-1.004, 0.2], [-1.137, 0.38]], P, null, 0.008);
        DC.band([[0.55, 0], [0.72, 0], [0.72, 1], [0.66, 1]], P, null, 0.008);
        // the doors' shut lines, the black rubbing strips along the doors and the quarters (rising to the back), the handles, the repeaters
        for (const x of [0.72, -0.59]) DC.side([[x - 0.006, 0.24], [x + 0.006, 0.24], [x + 0.006, 1.2], [x - 0.006, 1.2]], D, null, 0.009);
        DC.side([[-0.955, 0.575], [0.78, 0.515], [0.78, 0.57], [-0.955, 0.632]], B, null, 0.01);
        for (const sd of [-1, 1]) {
          K.rect(-0.47, 0.88, sd * (pr(-0.47, 'w') + 0.008), 0.15, 0.028, D, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });
          K.rect(0.83, 0.66, sd * (pr(0.83, 'w') + 0.007), 0.055, 0.022, AMBER, { dir: sd < 0 ? '-z' : 'z' });
        }

        // ---- the bumpers' thick black strips: round the nose under the lamps (from the front arches) and round the tail over the bumper
        //      (to the rear arches); profile u < 0 out of the shell ----
        const strip = (y, xs, corner, xm, part, back) => { const half = xs.map(x => [x, y, wAt(x, y) + 0.004]).concat([[corner[0], y, corner[1]]]);
          const path = half.map(p => [p[0], p[1], -p[2]]).concat([[xm, y, 0]], half.slice().reverse());   // (the left side to the right: u < 0 out at the nose; reversed at the tail)
          K.sweep([[-0.035, -0.052], [0.006, -0.06], [0.006, 0.06], [-0.035, 0.052]], back ? path.slice().reverse() : path, B, Object.assign({ capA: B, capB: B }, part ? { part } : {})); };
        strip(0.49, [1.53, 1.7, 1.81], [1.862, 0.4], 1.876, 'bumperF');
        // ---- the nose: the almond head lamps on the corners (swept back along the wings' shoulders; two projectors with cream rings, the
        //      indicator's red tip by the grille), the slim grille between them, the wide mouth with its chrome slats, the fog lamps ----
        const LO = { host: 'body' };
        for (const sd of [-1, 1]) {
          onBand([[1.866, 0.15], [1.866, 0.85], [1.82, 1.1], [1.76, 1.2], [1.65, 1.18], [1.57, 1.0], [1.52, 0.8], [1.55, 0.4], [1.63, 0.12], [1.73, 0.0], [1.82, 0.02]], CH, sd, [0.4, 0.5, sd * 0.8], D, LO);
          for (const [x, s, r] of [[1.7, 0.75, 0.04], [1.79, 0.62, 0.033]]) { const p = on(x, s, sd, 0), dx = r * 1.25 * Math.abs((pr(x + 0.03, 'w') - pr(x - 0.03, 'w')) / 0.06);
            K.headLamp(x + dx + 0.004, p[1], p[2] - sd * r * 0.2, r, { n: 8, ring: CREAM, host: 'body' }); }
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
        }, { hinge: [[1.82, 0.16, -0.5], [1.82, 0.16, 0.5]] });
        // ---- the bonnet: the two slots on its right side ----
        K.part('hood', () => {
          for (const q of [[1.32, 1.4], [1.22, 1.3]]) { const p = [on(q[0], 1.25, 1, 0.006), on(q[0] - 0.12, 1.32, 1, 0.006), on(q[0] - 0.12, 1.4, 1, 0.006), on(q[0], 1.33, 1, 0.006)]; F(p, D, [0, 1, 0]); }
        }, { hinge: [[0.97, 0.95, -0.6], [0.97, 0.95, 0.6]] });
        // ---- the tail: the lamps round the corners (a chrome surround, the red lenses with a light bar between them; the lit part at their
        //      inner ends), the black garnish across the tailgate, the badge; the strip over the bumper, its red fog lamp, the exhaust ----
        for (const sd of [-1, 1]) {
          const TL = [[-1.845, 0.52], [-1.845, 0.8], [-1.76, 0.74], [-1.66, 0.6], [-1.56, 0.42], [-1.52, 0.33], [-1.53, 0.14], [-1.6, 0.15], [-1.7, 0.3], [-1.79, 0.45]];
          onBand(TL, RED, sd, [-0.6, 0.3, sd * 0.75], CH, LO);
          onBand([[-1.84, 0.62], [-1.84, 0.68], [-1.7, 0.5], [-1.58, 0.31], [-1.56, 0.26], [-1.6, 0.28], [-1.7, 0.44]], CH, sd, [-0.6, 0.3, sd * 0.75], null, LO);
          K.tailLamp(-1.836, 0.84, sd * 0.5, 0.05, 0.045, { d: 0.006, host: 'body' });   // (the lit part: the inner end, where the corner faces back)
        }
        K.part('trunk', () => {
          K.rect(-1.884, 0.86, 0, 0.62, 0.04, B, { dir: '-x' });                               // the garnish
          K.rect(-1.886, 0.925, 0, 0.05, 0.05, CH, { dir: '-x' });                              // the badge
          K.bar([-1.66, 1.1, -0.04], [-1.55, 1.2, 0.3], 0.008, B, { n: 3 });                   // the wiper
        }, { hinge: [[-1.25, 1.41, -0.5], [-1.25, 1.41, 0.5]] });
        K.part('bumperR', () => {
          strip(0.64, [-1.68, -1.8, -1.87], [-1.915, 0.46], -1.935, null, true);
          K.rect(-1.934, 0.36, 0, 0.1, 0.035, RED, { dir: '-x' });                              // the fog lamp
          K.exhaust(-1.93, 0.27, -0.48, 0.035, 0.2, { n: 6 });
        }, { hinge: [[-1.9, 0.33, -0.6], [-1.9, 0.33, 0.6]] });
        // ---- the small roof spoiler over the rear glass (the wing), dark as the roof ----
        K.part('wing', () => K.wingPlank(-1.31, 1.405, -1.52, 1.37, 0.022, -0.52, 0.52, ROOF), { noCrush: true, hinge: [[-1.31, 1.39, -0.5], [-1.31, 1.39, 0.5]] });
        // ---- the mirrors, the wipers ----
        for (const sd of [-1, 1]) K.mirror(0.48, 0.965, sd * 0.87, { w: 0.1, h: 0.1, d: 0.15, z0: sd * 0.79 });
        for (const z of [-0.36, 0.2]) K.bar([0.99, 0.97, z - 0.26], [0.93, 1.0, z + 0.26], 0.01, B, { n: 3, part: 'body' });
        // ---- hinges: the doors at their front edges ----
        K.hinge('doorL', [0.71, 0.4, -0.82], [0.71, 0.85, -0.82]); K.hinge('doorR', [0.71, 0.4, 0.82], [0.71, 0.85, 0.82]);
        // ---- inside: the seats, the dashboard, the transverse four in the bay ----
        for (const sd of [-1, 1]) K.seat(-0.4, 0.5, sd * 0.36, { w: 0.48, back: 0.7 });
        K.box(0.55, 0.62, 0, 0.3, 0.24, 1.4, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(1.4, 0.36, 0, { l: 0.5, w: 0.6, h: 0.5 });
      },
    },
  });
})();
