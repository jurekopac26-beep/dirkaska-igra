/* Vehicle 'goljat' — GOLJAT: a monster truck: a pickup shell on a tube chassis. Signature features: 1) a pickup body shell lifted high on
   a tube chassis, 2) four huge flotation tyres, 3) long-travel shock absorbers in plain view, 4) a roll cage under the shell, 5) a
   supercharger stack poking through the bonnet. L 5.00 W 3.20 H 3.20, wheelbase 3.40, overhangs F 0.78 R 0.82 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'goljat', name: 'GOLJAT', cat: 'posebni', ord: 3, drive: 'AWD',
    desc: 'Pošastni tovornjak: lupina poltovornjaka na cevni šasiji in ogromna kolesa.',
    phys: { mass: 4500, a: 1.72, b: 1.68, kI: 1.5, kw: 1100, redline: 7000, idle: 1000, gears: [2.5, 1.55, 1], final: 12.93, rw: 0.84, cDrag: 1.3, len: 5, wid: 3.2, steerMax: 0.6,
      tracK: 0.7, brakeK: 0.7, spinK: 0.6, loose: 1.2, looseDrag: 0.35, landV: 24, landK: 0.4, dmgK: 0.5, sway: 2.5 },
    arc: { amax: 1.45, kv: 1.8, rmin: 7 },
    csp: { bx: 0.12, coast: -0.08, thr: -0.015, liftP: 0, pwr: 0.06, out: 1.2, turn: 0.75, w: 0.9, tv: 1.3 },   // (the AWD layer: steady, straightens quickly; its own pwr, out, turn, w, tv)
    stats: { power: 10, grip: 2, weight: 1, drift: 10 },
    price: 55000, pk: 'open', field: ['goljat'], fieldN: 7,
    snd: { kind: 'v8s', hz: 0.8, loud: 1.4 },
    expect: { t100: [4.22, 4.95], vmax: [158, 167], latG: [1.89, 1.99], d100: [28.7, 31.8] },
    partNames: { bed: 'pickup bed', tailgate: 'tailgate' },
    parts: { set: 'none', ht: 3.2, y0: 1.2,
      extra: {
        hood: { lx: 0.66, f: 0.5 },                                  // (the look's ranges: the bonnet over the front axle, the doors on the
        doorL: { lx: 0.06, lz: -0.71, f: 0.28 },                     // body's sides (inside the tyres' faces), the bed and the tailgate
        doorR: { lx: 0.06, lz: 0.71, f: 0.28 },                      // at their middles: the debris flies off from there)
        bumperF: {},
        bumperR: {},
        bed: { z: 1, th: 0.7, m: 12, rW: 0.4, h: 0.1, lx: -0.64, lz: 0, f: 0.31 },
        tailgate: { z: 1, th: 0.7, m: 10, rW: 0.38, h: 0.08, lx: -0.99, lz: 0, f: 0.37 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): two lofts. The cab with the bonnet (look.body.secs): the doors under open side
    // windows (the roll cage, the seat and the helmeted driver in sight through them), the windscreen, the B-pillars, the bonnet with the
    // blower stack through it and the header pipes either side, the nose with its grille and lamps, the chrome bumper; under the bonnet the
    // V8 (the inner block). The bed behind it (an open top, K.part 'bed'): its rails, the rear arches, a raised floor with the rear shocks
    // rising through it to their hoops; the tailgate and the rear bumper close it. Under them the tube chassis ('body', in a shade of the
    // stripe colour): rails, cross tubes, the four-links, the axles with their differentials, the drive line, two coil-over shocks a wheel
    // (the springs in the stripe colour). The livery: the paint, flames (the stripe colour) from the nose along the fenders onto the doors,
    // the name in block letters on the bed's sides and across the tailgate, the start number on the roof (the default) and on both doors
    look: {
      body: { len: 5, wid: 3.2, roofY: 3.14,
        //       x     w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-0.45, 1.12, 1.3, 2.34, 0.97, 3.05, 0.06, 'r', 0.08],     // the cab's back wall (its cap: the rear window on it)
          [-0.3, 1.13, 1.3, 2.35, 0.98, 3.08, 0.06, 'r', 0.08],          // the B-pillar's front edge: the open side window from here
          [0.42, 1.14, 1.3, 2.35, 1.0, 3.08, 0.06, 'gf', 0.08],          // the roof's front edge: the windscreen's top
          [0.95, 1.15, 1.3, 2.21, 1.0, 2.24, 0.03, 'b', 0.08],           // the windscreen's base (the cowl): the bonnet from here
          [1.72, 1.15, 1.3, 2.18, 0.99, 2.21, 0.04, 'b', 0.08],          // (over the front axle: the arch's middle)
          [2.365, 1.14, 1.31, 2.13, 0.98, 2.16, 0.03, 'b', 0.08],        // (the arch's front end)
          [2.46, 1.11, 1.33, 2.09, 0.96, 2.11, 0.02, 'b', 0.08]],        // the nose: the grille's face
        eye: { x: 0.16, y: 2.86, near: 0.25, tilt: 0.1, style: 'closed' },   // (the driver in the middle of the cab, high in his seat: over the blower)
        engine: [1.72, 2.3], crush: { x0: -0.4, x1: 0.5, z: 0.98 } },          // (the fire from the blower's foot; only the cab's roof crushes)
      wheels: { style: 'monster', w: 0.9, gap: 0.08, rimK: 0.44, rim: [0.74, 0.75, 0.79] },
      regions: 'none',
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, CH = K.chrome, D = [0.11, 0.11, 0.115], CHS = K.shade(S, 0.62), ALU = [0.7, 0.71, 0.74],
          FLR = K.shade(P, 0.8), SEAT = [0.1, 0.1, 0.1], LINE = K.shade(P, 0.4);
        // (flat pieces on a loft's flat side: a polygon [[x, y] ...] at that side's half width (w(x)) + lift, facing out; clipX: the part of a
        // polygon between two x)
        const ccw = (poly) => { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; } return a > 0 ? poly : poly.slice().reverse(); };
        const onSide = (sd, w, poly, col, lift, o) => { if (poly.length < 3) return; const pts = ccw(poly).map(p => [p[0], p[1], sd * (w(p[0]) + lift)]); K.face(sd > 0 ? pts : pts.reverse(), col, o); };
        const clipX = (poly, xa, xb) => { const c = (Q, keep, V) => { const o = []; for (let i = 0; i < Q.length; i++) { const a = Q[i], b = Q[(i + 1) % Q.length], ia = keep(a[0]), ib = keep(b[0]); if (ia) o.push(a); if (ia !== ib) { const t = (V - a[0]) / (b[0] - a[0]); o.push([V, a[1] + (b[1] - a[1]) * t]); } } return o; };
          return c(c(poly, x => x >= xa, xa), x => x <= xb, xb); };
        // ---- the cab and the bonnet: open side windows (null), the windscreen; the doors (side panels) and the bonnet (its top) by this
        //      loft's own regions; the nose's cap: the bumper below 1.56, the grille's panel over it ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : K.shade(P, 0.62);
          if (kind === 'gf') return e >= 3 && e <= 5 ? G : e === 2 || e === 6 ? null : P;
          if (k === 1 && (e === 2 || e === 6)) return null;                  // (the side window: open)
          return P;
        }, { caps: { front: { col: P, colLow: CH, cut: 1.56, low: 'bumperF', high: 'body' }, rear: { col: P, cut: 1, low: 'body', high: 'body' } },
          regions: [{ part: 'doorL', x: [-0.3, 0.95], bands: ['side', 'window'], side: 'L' }, { part: 'doorR', x: [-0.3, 0.95], bands: ['side', 'window'], side: 'R' },
            { part: 'hood', x: [0.95, 2.7], bands: ['edge', 'crown'], top: true }] });
        const wCab = (x) => L.prop(x, 'w'), wBed = () => 1.13;
        // GOLJAT in block letters h tall: each bar [u0, v0, u1, v1] to fn (u to the reader's right from the word's middle, v up from its foot)
        const word = (h, fn) => { const W = 0.625 * h, t = 0.194 * h, gp = 0.2 * h, H = h, tot = 6 * W + 5 * gp;
          const LT = { G: [[0, 0, t, H], [0, H - t, W, H], [0, 0, W, t], [W - t, 0, W, H * 0.5], [W * 0.45, H * 0.5 - t / 2, W, H * 0.5 + t / 2]],
            O: [[0, 0, t, H], [W - t, 0, W, H], [0, H - t, W, H], [0, 0, W, t]], L: [[0, 0, t, H], [0, 0, W, t]],
            J: [[W - t, 0, W, H], [0, 0, W, t], [0, 0, t, H * 0.4], [W * 0.3, H - t, W, H]],
            A: [[0, 0, t, H], [W - t, 0, W, H], [0, H - t, W, H], [0, H * 0.42, W, H * 0.42 + t]], T: [[0, H - t, W, H], [W / 2 - t / 2, 0, W / 2 + t / 2, H]] };
          'GOLJAT'.split('').forEach((ch, i) => { const u0 = -tot / 2 + i * (W + gp); for (const [a, b, c, d] of LT[ch]) fn(u0 + a, b, u0 + c, d); }); };
        // the flames (the stripe colour): three tongues (a body, a rising tip) from the nose back along the fender onto the door (cut at the
        // door's front edge: the door takes its share); the door's shut lines; the number and the handle on the door
        const FL = [[[2.42, 2.0], [1.05, 2.02], [1.05, 2.12], [2.42, 2.11]], [[1.05, 2.02], [0.12, 2.24], [1.05, 2.12]],        // (above the flares' line on the fender)
          [[2.42, 1.89], [1.3, 1.9], [1.3, 1.99], [2.42, 1.99]], [[1.3, 1.9], [0.48, 2.06], [1.3, 1.99]],
          [[1.0, 1.66], [0.74, 1.68], [0.74, 1.8], [1.0, 1.8]], [[0.74, 1.68], [0.3, 1.86], [0.74, 1.8]]];
        for (const sd of [-1, 1]) {
          const dr = sd < 0 ? 'doorL' : 'doorR', f = sd < 0 ? '-z' : 'z';
          FL.forEach((q, i) => { const lift = 0.008 + i * 0.001; onSide(sd, wCab, clipX(q, 0.95, 3), S, lift, { part: 'body' }); onSide(sd, wCab, clipX(q, -0.3, 0.95), S, lift, { host: dr }); });
          onSide(sd, wCab, [[0.938, 1.39], [0.958, 1.39], [0.958, 2.2], [0.938, 2.2]], LINE, 0.014, { host: dr });
          onSide(sd, wCab, [[-0.29, 1.39], [-0.27, 1.39], [-0.27, 2.33], [-0.29, 2.33]], LINE, 0.014, { host: dr });
          K.number(0.0, 1.62, sd * 1.139, 0.36, { dir: f, w: 0.5, host: dr });                       // the number on the door
          K.rect(-0.16, 2.2, sd * 1.137, 0.18, 0.04, B, { dir: f, host: dr });                        // the handle
          K.hinge(dr, [0.94, 1.42, sd * 1.15], [0.94, 2.3, sd * 1.15]);
          K.bar([0.95, 2.24, sd * 1.0], [0.42, 3.08, sd * 1.0], 0.045, P, { n: 5, part: 'body' });   // the A-pillar (along the windscreen's edge)
        }
        K.hinge('hood', [0.97, 2.26, -0.9], [0.97, 2.26, 0.9]);
        K.rect(-0.456, 2.7, 0, 1.36, 0.44, G, { dir: '-x', part: 'body' });                          // the rear window (on the cab's back wall)
        // ---- the nose: the grille between the head lamps, the indicators; the chrome bumper ----
        K.part('body', () => {
          K.grille(2.462, 1.84, 0, 1.22, 0.4, { slats: 4, frame: CH, frameH: 0.03, slatCol: [0.42, 0.43, 0.46] });
          for (const sd of [-1, 1]) { K.headLamp(2.47, 1.84, sd * 0.84, 0.1, { shape: 'rect', w: 0.32, h: 0.2, ring: CH }); K.rect(2.463, 1.64, sd * 0.84, 0.3, 0.06, K.rgb(0xff9a1e)); }
        });
        K.part('bumperF', () => K.box(2.485, 1.3, 0, 0.07, 0.26, 2.26, 0, CH), { hinge: [[2.45, 1.4, -1.0], [2.45, 1.4, 1.0]] });
        // ---- the blower stack through the bonnet: its adaptor, the ribbed case, the drive pulley at its front, the bug-catcher scoop (its
        //      mouth forward, rising to it); the hole's trim on the bonnet ----
        K.part('body', () => {
          K.box(1.72, 2.08, 0, 0.5, 0.2, 0.36, 0, D);
          K.box(1.72, 2.26, 0, 0.7, 0.24, 0.46, 0, ALU);
          for (const sd of [-1, 1]) for (const y of [2.32, 2.38, 2.44]) K.rect(1.72, y, sd * 0.232, 0.66, 0.014, D, { dir: sd < 0 ? '-z' : 'z' });
          K.cyl([2.05, 2.37, 0], [2.13, 2.37, 0], 0.1, D, { n: 8, capA: null });
          K.skin([[[1.5, 2.49, -0.17], [1.5, 2.61, -0.17], [1.5, 2.61, 0.17], [1.5, 2.49, 0.17]], [[1.93, 2.49, -0.19], [1.93, 2.72, -0.19], [1.93, 2.72, 0.19], [1.93, 2.49, 0.19]]],
            (k, e) => e === 1 ? [0.82, 0.83, 0.86] : ALU, ALU, B);
        });
        K.rect(1.72, 2.256, 0, 0.6, 0.44, B, { dir: 'y', part: 'hood' });
        K.part('body', () => { for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const x = 1.36 + i * 0.15;   // the headers: four open pipes a side up through the fender's top (zoomies)
          K.cyl([x, 2.12, sd * 1.06], [x - 0.08, 2.44, sd * 1.12], 0.04, CH, { n: 6, capA: null, capB: [0.04, 0.04, 0.045] }); } });
        // ---- the bed: an open top (its rails' caps, the walls' lining, the rear arches), the headboard (its front cap); a raised floor with
        //      ribs; the flares over the rear wheels; the name on its sides. The tailgate and the rear bumper close its end ----
        K.part('bed', () => {
          K.loft(K.secs([[-2.46, 1.11, 1.33, 2.3, 1.0, 2.31, 0, 'b', 0.08], [-2.4, 1.13, 1.31, 2.32, 1.02, 2.33, 0, 'b', 0.08],
            [-0.53, 1.13, 1.3, 2.32, 1.02, 2.33, 0, 'b', 0.08], [-0.48, 1.12, 1.3, 2.31, 1.01, 2.32, 0, 'b', 0.08]]),
          (k, e, kind, at) => e === 0 || e === 8 ? (at.arch ? B : K.shade(P, 0.62)) : e >= 3 && e <= 5 ? null : P,
          { caps: { front: { col: P }, rear: false }, floor: false, regions: [] });
          K.box(-1.48, 1.78, 0, 1.94, 0.04, 2.2, 0, [0.12, 0.115, 0.11]);                                // (a bed liner, ribbed)
          for (const z of [-0.8, -0.4, 0, 0.4, 0.8]) K.rect(-1.48, 1.823, z, 1.9, 0.06, [0.26, 0.26, 0.27], { dir: 'y' });
          for (const sd of [-1, 1]) K.flare(K.rx, 0.92, 1.03, sd * 1.07, sd * 1.25, FLR, { a0: 0.75, a1: Math.PI - 0.75, n: 6 });
          for (const sd of [-1, 1]) word(0.32, (ua, va, ub, vb) => { const xa = -1.47 + sd * ua, xb = -1.47 + sd * ub;   // (the name, read from either side)
            onSide(sd, wBed, [[Math.min(xa, xb), 1.92 + va], [Math.max(xa, xb), 1.92 + va], [Math.max(xa, xb), 1.92 + vb], [Math.min(xa, xb), 1.92 + vb]], S, 0.01); });
        }, { hinge: [[-0.5, 1.3, -1.0], [-0.5, 1.3, 1.0]] });   // (loose: it tips about its front edge)
        K.part('tailgate', () => {
          K.box(-2.475, 1.56, 0, 0.05, 0.77, 2.2, 0, P);
          word(0.24, (ua, va, ub, vb) => K.face([[-2.503, 1.8 + va, ua], [-2.503, 1.8 + va, ub], [-2.503, 1.8 + vb, ub], [-2.503, 1.8 + vb, ua]], S));   // (the name across it)
          K.rect(-2.503, 2.25, 0, 0.3, 0.05, B, { dir: '-x' });
          for (const sd of [-1, 1]) K.rect(-2.502, 1.98, sd * 0.94, 0.22, 0.42, B, { dir: '-x' });
        }, { hinge: [[-2.47, 1.57, -1.0], [-2.47, 1.57, 1.0]] });
        for (const sd of [-1, 1]) K.tailLamp(-2.505, 1.98, sd * 0.94, 0.17, 0.36);
        K.part('bumperR', () => K.box(-2.485, 1.3, 0, 0.07, 0.26, 2.26, 0, CH), { hinge: [[-2.45, 1.4, -1.0], [-2.45, 1.4, 1.0]] });
        // ---- the front flares (the fenders stay with the body) ----
        K.part('body', () => { for (const sd of [-1, 1]) K.flare(K.fx, 0.92, 1.03, sd * 1.07, sd * 1.25, FLR, { a0: 0.75, a1: Math.PI - 0.75, n: 6 }); });
        // ---- the tube chassis: the rails, the cross tubes, the end hoops, the posts up to the cab; the axles with their differentials, the
        //      four-links, the drive line; two coil-over shocks a wheel (the rear ones through the bed's floor to their tower) ----
        K.part('body', () => {
          const bar = (a, b, r, col, n) => K.bar(a, b, r, col || CHS, { n: n || 5 });
          for (const sd of [-1, 1]) {
            bar([2.4, 1.08, sd * 0.5], [-2.4, 1.08, sd * 0.5], 0.055, CHS, 6);
            for (const x of [2.4, -2.4]) bar([x, 1.08, sd * 0.5], [x + Math.sign(x) * 0.04, 1.3, sd * 0.42], 0.045);
            for (const x of [-0.22, 0.82]) bar([x, 1.08, sd * 0.5], [x, 1.32, sd * 0.5], 0.045);
          }
          for (const x of [2.4, 0.82, -0.22, -2.4]) bar([x, 1.08, -0.5], [x, 1.08, 0.5], 0.05);
          for (const X of [K.fx, K.rx]) {
            const dir = X > 0 ? -1 : 1;
            K.cyl([X, 0.84, -0.68], [X, 0.84, 0.68], 0.08, D, { n: 6, capA: null, capB: null });     // the axle (its ends in the wheels)
            K.cyl([X - 0.2, 0.84, 0.12], [X + 0.2, 0.84, 0.12], 0.22, [0.3, 0.3, 0.32], { n: 6 });  // the differential
            for (const sd of [-1, 1]) {
              bar([X + dir * 0.1, 0.7, sd * 0.42], [X + dir * 0.95, 0.98, sd * 0.48], 0.04);
              bar([X + dir * 0.1, 1.02, sd * 0.2], [X + dir * 0.85, 1.12, sd * 0.28], 0.035);
            }
          }
          K.box(0.6, 0.9, 0, 0.7, 0.32, 0.4, 0, D);                                              // the gearbox, the transfer case
          K.box(-0.02, 0.82, 0.12, 0.34, 0.36, 0.3, 0, D);
          bar([0.0, 0.92, 0.12], [1.52, 0.84, 0.12], 0.045, [0.5, 0.5, 0.53]); bar([-0.16, 0.92, 0.12], [-1.48, 0.84, 0.12], 0.045, [0.5, 0.5, 0.53]);
          // the shocks: the chrome body from the axle to the top mount, the spring (the stripe colour) where it shows: the front ones' low,
          // the rear ones' high (in the bed)
          const coil = (A, Bp, t0, t1) => { const at = (t) => [0, 1, 2].map(i => A[i] + (Bp[i] - A[i]) * t); K.bar(A, Bp, 0.045, CH, { n: 6 }); K.bar(at(t0), at(t1), 0.11, S, { n: 6 }); };
          for (const sd of [-1, 1]) for (const dx of [-0.24, 0.24]) {
            coil([K.fx + dx, 0.9, sd * 0.56], [K.fx + dx * 1.3, 1.95, sd * 0.44], 0.06, 0.5);
            coil([K.rx + dx, 0.9, sd * 0.56], [K.rx + dx * 1.3, 2.3, sd * 0.44], 0.58, 0.95);
          }
          for (const dx of [-0.24, 0.24]) { const x = K.rx + dx * 1.3;   // the rear shocks' tower (in the bed): a hoop over each pair
            bar([x, 2.3, -0.5], [x, 2.3, 0.5], 0.05); for (const sd of [-1, 1]) bar([x, 1.8, sd * 0.5], [x, 2.3, sd * 0.5], 0.045); }
        });
        // ---- the cab inside (in sight through the open windows: the outer shell): the roll cage, the seat on its pedestal, the dashboard, the
        //      driver in the middle (helmet, shoulders, arms: never crushed or dented) ----
        K.cage([[[-0.22, 1.34, -0.86], [-0.22, 2.98, -0.78]], [[-0.22, 1.34, 0.86], [-0.22, 2.98, 0.78]], [[-0.22, 2.98, -0.78], [-0.22, 2.98, 0.78]], [[-0.22, 1.34, -0.86], [-0.22, 2.98, 0.78]],
          [[0.82, 1.34, -0.86], [0.82, 2.2, -0.88]], [[0.82, 1.34, 0.86], [0.82, 2.2, 0.88]], [[0.82, 2.2, -0.88], [0.45, 2.98, -0.8]], [[0.82, 2.2, 0.88], [0.45, 2.98, 0.8]],
          [[-0.22, 2.98, -0.78], [0.45, 2.98, -0.8]], [[-0.22, 2.98, 0.78], [0.45, 2.98, 0.8]], [[-0.22, 1.85, -0.9], [0.82, 1.85, -0.9]], [[-0.22, 1.85, 0.9], [0.82, 1.85, 0.9]]],   // (no bar across over the windscreen: the driver's view)
        0.035, CHS, { n: 5, inner: false, noCrush: true, noDent: true, part: 'body' });
        K.part('body', () => {
          K.box(0.0, 1.33, 0, 0.42, 0.69, 0.42, 0, D);                                           // the seat's pedestal
          K.box(0.8, 1.95, 0, 0.28, 0.29, 1.9, 0, SEAT);                                          // the dashboard
        });
        K.seat(0.0, 2.14, 0, { w: 0.56, l: 0.48, back: 0.8, tilt: 0.16, inner: false, col: SEAT, part: 'body' });
        K.part('body', () => {
          const hx = 0.08, hy = 2.82, HC = [0.95, 0.95, 0.93], V = [0.2, 0.2, 0.21], SU = [0.22, 0.22, 0.24];   // (the helmet, its visor, the suit: off the glass colours)
          const rg = (y, r) => [0, 1, 2, 3, 4, 5, 6, 7].map(i => [hx + r * Math.cos(i * Math.PI / 4), y, r * Math.sin(i * Math.PI / 4)]);
          K.skin([rg(hy - 0.12, 0.1), rg(hy - 0.04, 0.145), rg(hy + 0.05, 0.14), rg(hy + 0.13, 0.075)], (k, e) => k === 1 && (e === 7 || e === 0) ? V : k === 2 && (e === 7 || e === 0 || e === 3 || e === 4) ? S : HC, HC, HC);
          const tr = (y, w, d) => [0, 1, 2, 3, 4, 5].map(i => [hx - 0.07 + d * Math.cos(i * Math.PI / 3), y, w * Math.sin(i * Math.PI / 3) * 1.15]);
          K.skin([tr(2.24, 0.19, 0.11), tr(2.66, 0.23, 0.13)], SU, SU, SU);
          for (const sd of [-1, 1]) K.bar([hx - 0.04, 2.6, sd * 0.24], [0.5, 2.36, sd * 0.2], 0.05, SU, { n: 5 });
        }, { noCrush: true, noDent: true });
        // ---- inside the bonnet (seen once it is off): the engine under the blower, the radiator behind the grille ----
        K.engine(1.7, 1.4, 0, { l: 0.86, w: 0.7, h: 0.7 });
        K.inner(() => K.part('body', () => { for (const sd of [-1, 1]) {   // (the V8's banks: the valve covers either side of the blower, the manifolds out to the headers)
          K.box(1.7, 1.98, sd * 0.3, 0.74, 0.1, 0.16, 0, [0.62, 0.1, 0.08]);
          K.box(1.6, 1.86, sd * 0.68, 0.62, 0.12, 0.56, 0, [0.4, 0.41, 0.43]); } }));
        K.box(2.36, 1.42, 0, 0.08, 0.62, 1.4, 0, [0.17, 0.17, 0.17], null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
