/* Vehicle 'lev' — LEV R: a 1999-2003 world-rally hatchback on the 206 family (DESIGN section 4). Signature features: 1) the 206-like
   three-door body with very wide flared arches, 2) a big rear wing on the tailgate, 3) a roof scoop, 4) mudflaps behind every wheel, 5) a
   spot-lamp pod on the bonnet and a splitter. L 4.00 W 1.80 H 1.42, wheelbase 2.47, overhangs F 0.78 R 0.75 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'lev', name: 'LEV R', cat: 'reli', ord: 1, drive: 'AWD',
    desc: 'Relijski dirkač za svetovno prvenstvo: široki blatniki, veliko krilo, zajemalka na strehi.',
    phys: { mass: 1230, a: 1.22, b: 1.25, kI: 1.12, kw: 300, redline: 8000, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.91, rw: 0.32, cDrag: 0.44, len: 4, wid: 1.8, steerMax: 0.64,
      tracK: 1.1, brakeK: 1.05, spinK: 0.3 },
    arc: { amax: 1.82, kv: 2.05, rmin: 4.1 },
    csp: { bx: 0.13, coast: -0.077, thr: -0.015, liftP: 0, pwr: 0.035, out: 0.95, turn: 1.05, w: 1 },   // (the AWD layer: steady, straightens quickly; its own bx, coast, thr, pwr, out, turn, w)
    stats: { power: 8, grip: 8, weight: 7, drift: 5 },
    price: 45000, pk: 'open', field: ['lev'],
    snd: { kind: 'i4', hz: 1.15, turbo: 1, loud: 1.1 },
    expect: { t100: [2.42, 2.84], vmax: [225, 239], latG: [2.33, 2.43], d100: [21.7, 24] },
    partNames: { scoop: 'roof scoop', flapL: 'left mudflap', flapR: 'right mudflap' },
    parts: { set: 'race', ht: 1.42, y0: 0.18,
      extra: {
        scoop: { z: 0, th: 0.62, m: 2, r: 0.3, h: 0.08, lx: -0.035, lz: 0, f: 1 },
        flapL: { z: 2, th: 0.5, m: 1, r: 0.25, h: 0.03, lx: -0.825, lz: -0.855, f: 0.03 },
        flapR: { z: 3, th: 0.5, m: 1, r: 0.25, h: 0.03, lx: -0.825, lz: 0.855, f: 0.03 },
      },
      // (where the look has them: the bonnet with its lamp pod, the tailgate up to the roof, the quarters with their C-pillars, the mirrors
      // by the A-pillars' feet, the wing over the tailgate, the mudflaps behind the rear wheels; a lost one flies off from there)
      over: { hood: { lx: 0.82, y: 0.82 }, trunk: { lx: -0.84, y: 0.99 }, fenderL: { lx: 0.56, lz: -0.92, y: 0.6 }, fenderR: { lx: 0.56, lz: 0.92, y: 0.6 },
        quarterL: { lx: -0.675, lz: -0.92, y: 0.72 }, quarterR: { lx: -0.675, lz: 0.92, y: 0.72 }, doorL: { lz: -0.92, y: 0.67 }, doorR: { lz: 0.92, y: 0.67 },
        mirrorL: { lx: 0.28, lz: -0.99, y: 0.94 }, mirrorR: { lx: 0.28, lz: 0.99, y: 0.94 }, wing: { lx: -0.85, y: 1.32 } },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft traced from the 206 (the scratchpad map p206.txt, section I: the
    // windscreen raked 26 degrees flowing into the curved roof, the belt rising to the rear, the rounded tailgate, the bonnet sloping to the
    // nose), lowered 3 cm, its arches flared out to 1.81 m (a bulge over each wheel: the WRC's wings and quarters, the doors 1.69 m), a WRC
    // bumper 11 cm longer at the back (4.00 m). The standard regions split it, but the bumper's top goes with the bumper, the tailgate is the
    // panel between the lamps up to the roof and the bonnet starts at the cowl. On it: the almond head lamps on the nose's corners (two
    // projectors in each, swept back along the shoulders), the slim grille, the wide mouth with the fog lamps, the splitter; the lamps
    // climbing up the C-pillars; the wing on its endplates, the roof scoop, the mudflaps, the spot-lamp pod on the bonnet. The livery: the
    // paint with a bold swoosh in the stripe colour along each side, a sun strip, the number panels on the doors (generic: no marks)
    look: {
      body: {
        //       x       w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.0, 0.76, 0.25, 0.48, 0.72, 0.53, 0.02, 'b', 0.09],       // the WRC bumper's rear face (the end cap)
          [-1.885, 0.8, 0.22, 0.56, 0.62, 0.6, 0.02, 'b', 0.1],             // its top meets the tailgate's foot
          [-1.84, 0.83, 0.21, 0.72, 0.62, 0.89, 0.03, 'b', 0.1],            // the tailgate's lower panel (upright), the lamps' faces beside it
          [-1.69, 0.865, 0.21, 0.94, 0.6, 0.965, 0.04, 'gr', 0.1],          // the rear glass's foot
          [-1.62, 0.885, 0.21, 0.96, 0.585, 1.035, 0.04, 'gr', 0.1],        // (the rear arch's back end: the flare)
          [-1.38, 0.9, 0.21, 0.99, 0.53, 1.29, 0.045, 'r', 0.1],            // the roof's rear edge (the rear glass's top)
          [-1.25, 0.905, 0.21, 0.99, 0.526, 1.317, 0.045, 'r', 0.1],        // (the rear axle: the flare's crest)
          [-1.065, 0.895, 0.21, 0.99, 0.52, 1.355, 0.046, 'r', 0.1],        // the C-pillar's front edge
          [-0.88, 0.875, 0.21, 0.97, 0.52, 1.375, 0.046, 'r', 0.1],         // the rear flare's front end (the doors 0.845)
          [-0.4, 0.84, 0.21, 0.92, 0.52, 1.39, 0.046, 'r', 0.1],            // the roof's top
          [0.255, 0.835, 0.21, 0.875, 0.5, 1.33, 0.04, 'gf', 0.1],          // the windscreen's top
          [0.785, 0.845, 0.205, 0.838, 0.636, 1.051, 0.06, 'gf', 0.1],      // the door's front edge (on the windscreen's line)
          [0.85, 0.875, 0.205, 0.833, 0.653, 1.017, 0.063, 'gf', 0.1],      // the front flare's back end
          [1.035, 0.895, 0.2, 0.82, 0.7, 0.92, 0.07, 'b', 0.1],             // the windscreen's base (the cowl)
          [1.22, 0.905, 0.185, 0.787, 0.693, 0.873, 0.07, 'b', 0.1],        // (the front axle: the flare's crest)
          [1.59, 0.885, 0.17, 0.725, 0.68, 0.78, 0.07, 'b', 0.1],           // the front arch's front end (the bumper's corner from here)
          [1.935, 0.735, 0.095, 0.68, 0.58, 0.725, 0.045, 'b', 0.08],       // the bonnet's front edge
          [1.975, 0.665, 0.085, 0.6, 0.53, 0.62, 0.03, 'b', 0.075],         // the lamps' face (the bumper's top under it)
          [2.0, 0.62, 0.08, 0.52, 0.5, 0.535, 0.015, 'b', 0.07]],           // the bumper's face: the mouth (the end cap)
        eye: { x: -0.3, y: 1.14, style: 'closed' },
        door: [0.785, -0.495], bumpF: 0.41, bumpR: 0.115, bumpY: [0.58, 0.62],
        crush: { x0: -1.77, x1: 0.5, z: 0.62 }, cage: true,                 // (the roof to the wing's trailing edge: the wing goes down whole with it)
        decalX: -0.82, decalY: 1.425, decalRz: 0.05, decalS: 0.55,
      },
      wheels: { style: 'std', spokes: 6, w: 0.235, rim: [0.9, 0.9, 0.88], cap: [0.3, 0.3, 0.32], gap: 0.05 },
      // the standard regions, but the bumper's top (behind the tailgate's foot) goes with the bumper, the tailgate is the panel between
      // the lamps up to the roof (the top and the crown: its glass, the panel under it), the bonnet is the cowl (the windscreen's base) to
      // its front edge (the lamps' panel is the body's; the std's xWs is the first windscreen section's end: here the door's front edge)
      regions(std) {
        const out = [{ part: 'bumperR', x: [-2.2, -1.885], bands: ['tuck', 'side', 'window', 'edge', 'crown'] }];
        for (const r of std) out.push(r.part === 'trunk' ? Object.assign({}, r, { x: [-2.6, -1.38], bands: ['edge', 'crown'] }) : r.part === 'hood' ? Object.assign({}, r, { x: [1.035, 1.935] }) : r);
        return out;
      },
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.12, 0.12, 0.13], SK = [0.09, 0.09, 0.1], W = [0.95, 0.95, 0.93];
        const LENS = [0.6, 0.65, 0.72], RED = [0.42, 0.025, 0.04], REV = [0.86, 0.86, 0.88];   // (the lens a cool silver: it shows on any paint)
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (between the arches: the sills)
        // ---- the shell: the paint; the glass (the windscreen, the side windows to the C-pillar, the rear glass); dark sills; the bumper's
        //      lower half dark at the back ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return at.arch ? B : at.x > XA && at.x < XB ? SK : K.shade(P, 0.6);
          if (kind === 'gf') return e >= 3 && e <= 5 ? G : (e === 2 || e === 6) && at.x < 0.66 ? G : P;
          if (kind === 'r') return (e === 2 || e === 6) && at.x > -1.07 ? G : P;
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : P;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P, colLow: D, cut: 0.4, low: 'bumperR', high: 'bumperR' } } });
        const pr = (x, k) => L.prop(x, k), DC = L.decal, XN = 2.0;
        // a flat polygon facing out (its points' order turned to face dir), one primitive
        const F = (pts, col, dir, o) => { const a = pts[0], b = pts[1], c = pts[2], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
          const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; K.face(n[0] * dir[0] + n[1] * dir[1] + n[2] * dir[2] < 0 ? pts.slice().reverse() : pts, col, o); };
        // a point on the right (sd 1) or left (-1) half's top at x: s 0..1 the window band (the belt to the top's edge), 1..2 the edge,
        // 2..3 the crown; lifted off it in the section's plane
        const on = (x, s, sd, lift) => { const w = pr(x, 'w'), yb = pr(x, 'ybelt'), wt = pr(x, 'wt'), yt = pr(x, 'yt'), cr = pr(x, 'cr');
          const Q = [[w, yb], [wt, yt], [wt * 0.38, yt + cr], [0, yt + cr]], i = Math.min(2, Math.floor(s)), t = s - i, p = [Q[i][0] + (Q[i + 1][0] - Q[i][0]) * t, Q[i][1] + (Q[i + 1][1] - Q[i][1]) * t];
          const n = [Q[i + 1][1] - Q[i][1], -(Q[i + 1][0] - Q[i][0])], nl = Math.hypot(n[0], n[1]) || 1, l = lift == null ? 0.008 : lift;
          return [x, p[1] + n[1] / nl * l, (p[0] + n[0] / nl * l) * sd]; };
        // a polygon of points on the shell, lifted off it along its own normal (turned to the side out points to): a patch on a panel that
        // faces along x (the decals lift sideways or up)
        const lay = (pts, col, out, lift, o) => { const n = [0, 0, 0]; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length];
            n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]); }
          const l = Math.hypot(n[0], n[1], n[2]) * (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0 ? -1 : 1) || 1, m = [n[0] / l, n[1] / l, n[2] / l];
          F(pts.map(p => [p[0] + m[0] * lift, p[1] + m[1] * lift, p[2] + m[2] * lift]), col, m, o); };
        // a lens: the patch over a dark rim (the same patch 12 % larger about its middle, just under it)
        const lens = (pts, col, out, o) => { const c = [0, 1, 2].map(i => pts.reduce((t, p) => t + p[i], 0) / pts.length);
          lay(pts.map(p => [0, 1, 2].map(i => c[i] + (p[i] - c[i]) * 1.12)), B, out, 0.003, o); lay(pts, col, out, 0.007, o); };
        // a polygon [[x, s] ...] on a half's top (s as for on()), cut at the loft's sections (each piece on one segment's panel), laid along
        // each piece's own normal; rim: over a dark rim (the polygon 12 % larger about its middle)
        const XC = L.secs.map(q => q.x), clipX = (Q, xa, xb) => { const cut = (R, keep, X) => { const r = [];
            for (let i = 0; i < R.length; i++) { const a = R[i], b = R[(i + 1) % R.length], ia = keep(a[0]), ib = keep(b[0]); if (ia) r.push(a); if (ia !== ib) { const t = (X - a[0]) / (b[0] - a[0]); r.push([X, a[1] + (b[1] - a[1]) * t]); } }
            return r; }; return cut(cut(Q, x => x >= xa - 1e-9, xa), x => x <= xb + 1e-9, xb); };
        const onBand = (poly, col, sd, out, rim, o) => {
          const c = [0, 1].map(i => poly.reduce((t, p) => t + p[i], 0) / poly.length), big = poly.map(p => [c[0] + (p[0] - c[0]) * 1.12, c[1] + (p[1] - c[1]) * 1.12]);
          for (const [Q, cl, lf] of rim ? [[big, B, 0.003], [poly, col, 0.007]] : [[poly, col, 0.006]]) {
            const xs = Q.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), cuts = [x0].concat(XC.filter(x => x > x0 + 0.002 && x < x1 - 0.002), [x1]);
            for (let i = 0; i < cuts.length - 1; i++) { const pc = clipX(Q, cuts[i], cuts[i + 1]); if (pc.length >= 3) lay(pc.map(([x, q]) => on(x, Math.max(0, q), sd, 0)), cl, out, lf, o); }
          } };

        // ---- the side glass's shape: the B-pillar (black), the quarter window's kink at the back, the A-pillar's foot by the mirror; a sun
        //      strip over the windscreen ----
        DC.band([[-0.535, 0], [-0.455, 0], [-0.455, 1], [-0.535, 1]], B, null, 0.008);
        DC.band([[-1.07, 0], [-0.86, 0], [-1.07, 0.42]], P, null, 0.008);
        DC.band([[0.6, 0], [0.79, 0], [0.79, 1], [0.72, 1]], P, null, 0.008);
        for (const [a, b] of [[-0.52, -0.2], [-0.2, 0.2], [0.2, 0.52]]) DC.top([[0.262, a * 0.95], [0.4, a], [0.4, b], [0.262, b * 0.95]], S, 0.01);   // (split at the crown's edges: on the glass)
        // ---- the livery: a bold swoosh in the stripe colour, from the nose's corner under the lamp sweeping back and up, wider to the tail
        //      (it stops at the tail lamps) ----
        const XS = L.secs.map(q => q.x).filter(x => x > -1.85 && x < 1.995).concat([-1.84]).sort((a, b) => a - b);
        const tt = (x) => (XN - x) / 3.84, lo = (x) => 0.25 + 0.42 * Math.pow(tt(x), 1.7), hi = (x) => lo(x) + (tt(x) < 0.75 ? 0.07 + 0.13 * tt(x) / 0.75 : 0.2 - 0.4 * (tt(x) - 0.75));
        for (let i = 0; i < XS.length - 1; i++) { const a = XS[i], b = XS[i + 1]; DC.side([[a, lo(a)], [b, lo(b)], [b, hi(b)], [a, hi(a)]], S, null, 0.007); }
        // the number panels on the doors, the handles
        for (const sd of [-1, 1]) { const f = sd < 0 ? '-z' : 'z', h = sd < 0 ? 'doorL' : 'doorR';
          K.number(0.15, 0.7, sd * (pr(0.15, 'w') + 0.01), 0.22, { dir: f, w: 0.36, host: h });
          K.rect(-0.36, 0.82, sd * (pr(-0.36, 'w') + 0.008), 0.15, 0.028, B, { dir: f, host: h }); }

        // ---- the nose: the almond head lamps (on the face's corners, swept back along the wings' shoulders; two projectors in each), the
        //      slim grille between them, the wide mouth under them with the fog lamps, the splitter ----
        const X0 = 1.935, X1 = 1.975, LO = { host: 'body' };   // (the lamps' face: the bonnet's front edge to the bumper's top)
        for (const sd of [-1, 1]) {
          const fw = [1, 0.5, sd * 0.4];
          lens([on(X0 + 0.004, 0.03, sd, 0), on(X1 - 0.003, 0.03, sd, 0), on(X1 - 0.004, 1, sd, 0), on(X0 + 0.003, 1, sd, 0)], LENS, fw, LO);            // the lens: the corner,
          lens([on(X0 + 0.003, 1, sd, 0), on(X1 - 0.004, 1, sd, 0), on(X1 - 0.007, 1.45, sd, 0), on(1.957, 1.7, sd, 0), on(X0 + 0.007, 1.5, sd, 0)], LENS, fw, LO);   // its inner end
          onBand([[X0 - 0.003, 0.02], [X0 - 0.003, 0.97], [1.87, 0.95], [1.79, 0.84], [1.71, 0.62], [1.665, 0.42], [1.7, 0.22], [1.78, 0.08], [1.87, 0.03]], LENS, sd, [0.2, 1, sd * 0.3], true, LO);   // swept back along the wing's top
          for (const s of [1.14, 1.48]) { const p = on(1.959, s, sd, 0); K.headLamp(1.968, p[1], p[2], 0.03, { n: 8, ring: null, host: 'body' }); }   // two projectors
          lay([on(X0 + 0.006, 1.75, sd, 0), on(1.956, 1.75, sd, 0), on(1.956, 2, sd, 0), on(X0 + 0.006, 2, sd, 0)], B, fw, 0.004, LO);      // the slim grille,
        }
        lay([on(X0 + 0.006, 2, -1, 0), on(1.956, 2, -1, 0), on(1.956, 2, 1, 0), on(X0 + 0.006, 2, 1, 0)], B, [1, 0.5, 0], 0.004, LO);      // its middle
        DC.side([[1.975, 0.585], [1.935, 0.625], [1.8, 0.665], [1.7, 0.7], [1.7, 0.78], [1.975, 0.78]], LENS, null, 0.005, LO);   // (the lens round the corner, up to the shoulder)
        K.part('bumperF', () => {
          K.grille(XN + 0.003, 0.28, 0, 0.92, 0.25, { slats: 2, col: [0.03, 0.03, 0.035], slatCol: [0.22, 0.22, 0.24] });   // the wide mouth
          for (const sd of [-1, 1]) K.headLamp(XN + 0.004, 0.28, sd * 0.535, 0.042, { n: 8, ring: null, col: [0.9, 0.9, 0.82] });   // the fog lamps
          K.box(1.95, 0.05, 0, 0.13, 0.025, 1.36, 0, B, null, true);                       // the splitter
          K.rect(XN + 0.005, 0.125, -0.3, 0.045, 0.05, K.rgb(0xe8261c));                  // the towing strap
        }, { hinge: [[1.98, 0.12, -0.6], [1.98, 0.12, 0.6]] });
        // ---- the bonnet: the spot-lamp pod across its front, the vents ----
        K.part('hood', () => {
          K.box(1.78, 0.78, 0, 0.1, 0.09, 0.84, 0, B);
          for (const z of [-0.36, -0.13, 0.13, 0.36]) K.discX(1.832, 0.828, z, 0.04, 8, K.lampHead, 1);
          for (const sd of [-1, 1]) { const q = [on(1.42, 1.3, sd, 0.006), on(1.18, 1.35, sd, 0.006), on(1.18, 1.75, sd, 0.006), on(1.42, 1.7, sd, 0.006)]; F(q, D, [0, 1, 0]); }
        }, { hinge: [[1.03, 0.93, -0.6], [1.03, 0.93, 0.6]] });
        // ---- the tail: the lamps on the corners' faces (the lit lenses face back, a reversing lamp, the red climbing to the glass's foot),
        //      the plate on the tailgate, the diffuser, the exhaust ----
        for (const sd of [-1, 1]) {
          const out = [-1, 0.1, sd * 0.3];
          K.tailLamp(-1.86, 0.765, sd * 0.715, 0.17, 0.1, { d: 0.02 });
          lay([on(-1.878, 0, sd, 0), on(-1.84, 0, sd, 0), on(-1.84, 1, sd, 0), on(-1.878, 1, sd, 0)], RED, out, 0.005, { host: 'body' });
          onBand([[-1.84, 0.0], [-1.84, 1.0], [-1.72, 0.97], [-1.66, 0.62], [-1.635, 0.2], [-1.7, 0.0]], RED, sd, [-0.5, 0.6, sd * 0.6], false, { host: 'body' });   // (over the shoulder: climbing to the glass's foot)
          lay([on(-1.874, 0.66, sd, 0), on(-1.852, 0.66, sd, 0), on(-1.852, 0.94, sd, 0), on(-1.874, 0.94, sd, 0)], REV, out, 0.008, { host: 'body' });
        }
        DC.side([[-1.885, 0.6], [-1.8, 0.72], [-1.66, 0.88], [-1.62, 0.95], [-1.62, 1.0], [-1.885, 1.0]], RED, null, 0.005, { host: 'body' });   // (the lamps' sides)
        K.rect(-1.873, 0.74, 0, 0.42, 0.1, W, { dir: '-x' });                             // the plate on the tailgate
        K.part('bumperR', () => {
          K.exhaust(-1.995, 0.245, 0.42, 0.055, 0.22, { n: 6 });
        }, { hinge: [[-1.97, 0.3, -0.6], [-1.97, 0.3, 0.6]] });
        // ---- the wing on its endplates (their feet on the C-pillars), over the tailgate ----
        K.part('wing', () => {
          K.wingPlank(-1.43, 1.37, -1.83, 1.405, 0.032, -0.69, 0.69, P);
          K.wingPlank(-1.78, 1.425, -1.9, 1.455, 0.016, -0.69, 0.69, S);
          for (const sd of [-1, 1]) K.endplate([[-1.42, 1.145], [-1.56, 1.055], [-1.92, 1.32], [-1.92, 1.475], [-1.44, 1.41]], sd * 0.69, 0.02, P);
        }, { noCrush: true, hinge: [[-1.42, 1.3, -0.7], [-1.42, 1.3, 0.7]] });
        // ---- the roof scoop ----
        K.part('scoop', () => {
          const ring = (x, hw, h) => { const y0 = L.topY(x, 0) - 0.012; return [[x, y0, -hw], [x, y0 + h, -hw * 0.75], [x, y0 + h, hw * 0.75], [x, y0, hw]]; };
          K.skin([ring(0.1, 0.15, 0.06), ring(-0.04, 0.16, 0.055), ring(-0.3, 0.12, 0.01)], S, D, S);
        }, { noCrush: true });
        // ---- the mudflaps: behind the front wheels (the fenders'), behind the rear ones (their own parts) ----
        for (const sd of [-1, 1]) {
          K.box(0.83, 0.05, sd * 0.76, 0.012, 0.26, 0.2, 0, S, null, true, { part: sd < 0 ? 'fenderL' : 'fenderR' });
          K.part(sd < 0 ? 'flapL' : 'flapR', () => K.box(-1.645, 0.04, sd * 0.77, 0.012, 0.3, 0.22, 0, S, null, true), { noDent: true, hinge: [[-1.645, 0.33, sd * 0.66], [-1.645, 0.33, sd * 0.88]] });
        }
        // ---- the mirrors, the wipers ----
        for (const sd of [-1, 1]) K.mirror(0.56, 0.95, sd * 0.925, { col: P, w: 0.09, h: 0.08, d: 0.14, z0: sd * 0.8 });
        for (const z of [-0.38, 0.18]) K.bar([1.02, 0.96, z - 0.26], [0.96, 1.0, z + 0.26], 0.01, B, { n: 4, part: 'body' });
        // ---- hinges: the tailgate at the roof, the doors at their front edges ----
        K.hinge('trunk', [-1.38, 1.3, -0.5], [-1.38, 1.3, 0.5]);
        K.hinge('doorL', [0.78, 0.4, -0.84], [0.78, 0.85, -0.84]); K.hinge('doorR', [0.78, 0.4, 0.84], [0.78, 0.85, 0.84]);
        // ---- inside: two buckets, the dashboard, the roll cage, the transverse four in the bay ----
        for (const sd of [-1, 1]) K.seat(-0.38, 0.48, sd * 0.36, { w: 0.48, back: 0.74, col: [0.1, 0.1, 0.11] });
        K.box(0.6, 0.6, 0, 0.3, 0.26, 1.42, 0, D, null, false, { inner: true, part: 'body' });
        const CG = [0.78, 0.79, 0.82], cy = 1.3;
        K.cage([[[-0.8, 0.3, -0.6], [-0.8, cy, -0.5]], [[-0.8, 0.3, 0.6], [-0.8, cy, 0.5]], [[-0.8, cy, -0.5], [-0.8, cy, 0.5]], [[-0.8, 0.3, -0.6], [-0.8, cy, 0.5]],
          [[0.62, 0.62, -0.62], [0.2, cy, -0.46]], [[0.62, 0.62, 0.62], [0.2, cy, 0.46]], [[0.2, cy, -0.46], [-0.8, cy, -0.5]], [[0.2, cy, 0.46], [-0.8, cy, 0.5]],
          [[-0.8, 0.4, -0.66], [0.6, 0.4, -0.66]], [[-0.8, 0.4, 0.66], [0.6, 0.4, 0.66]], [[-0.8, cy, -0.5], [-1.6, 0.6, -0.6]], [[-0.8, cy, 0.5], [-1.6, 0.6, 0.6]]], 0.022, CG, { n: 4 });
        K.engine(1.35, 0.3, 0, { l: 0.5, w: 0.62, h: 0.42 });
        K.tyre(-1.3, 0.37, 0, { axis: 'y', w: 0.2, inner: true, part: 'body' });   // the spare wheel lying in the boot
      },
    },
  });
})();
