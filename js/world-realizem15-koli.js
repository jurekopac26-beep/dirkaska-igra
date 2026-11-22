// Realizem 15 (partyslo a): Koli, Finland – what OpenStreetMap maps within 60 m of the road that js/world-gore.js does not draw yet.
// Drawn: the funicular railway=funicular layer=1 w38331704 (on a girder over the road where it crosses it: layer=1), the mast man_made=mast
//   height=60 tower:construction=lattice tower:type=communication n2936644466, the poles of the power=minor_line w397349119 (n11772646785,
//   n4001424807, n4001424808, n4001424809) with the wires of its two short spans, the power=transformer n4020853300 on w399349249, the nordic ski
//   trails piste:type=nordic piste:grooming=classic+skating w50436999 (width=2), w50437014, w330713291, w330713292, w330713957, w441911363,
//   w1436256665, the natural=cliff w627401627, w627401628, w627401635, w627401636, w627401638, the highway=steps handrail=yes w290139300 (117
//   steps, concrete), w290139302 (paving stones), w835590523 (58, concrete), w835590525 (70, concrete), the barrier=retaining_wall w290139303, the
//   car parks amenity=parking surface=asphalt w253763299 and w167079819 (under packed snow, as the road), the tourism=information information=map
//   n641362579 (no text).
// Kept open: the road and its verges (nothing until 0.8 m beyond them, the trails 1.5 m; the funicular's girder 4.8 m above the road); no trees
//   on what this draws (S.keepOut in js/world-koli.js calls World.k15.koli).
// Not drawn again: the hotel and the other buildings (def.bld), the land cover, the lakes.
// Not drawn at all: the chair lift (3 % of it within 60 m), the bicycle stands, the attraction, the monument, the water tap, the addresses, the
//   former building; the wires of the long spans (173 m to 478 m: OSM has no poles between), the lamps of the lit trail w50436999 (none mapped).
// Assumed: the funicular's gauge (1.2 m), deck, girder, pillars and its one car (light grey, by the lower end), the 4.8 m under the girder; the
//   mast's taper (4.5 m to 1.6 m: lattice, not guyed) and three panel antennas; the poles (10 m, wood, a crossarm, three wires: OSM has no
//   voltage=) and the transformer on its pole; the trails' width (4 m) and where the classic tracks run; the cliffs' height (2-3 m); the steps'
//   width (1.5 m), the tread of w290139302 (0.35 m) and the handrail on one side; the wall's height (1.2 m); the board's size (1.2 m x 0.9 m).
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«); OSM's ways moved by the track's own alignment (2.14 m, -1.49 m).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.koli) return;
  const A = World.api, { Chunks, box, cyl, rng, vary } = A, TAU = Math.PI * 2;
  // (x east, z south; m from the start)
  const FUNI = [[907.7, 586.4], [909.5, 582.7], [950.6, 552.1], [992.9, 519.2]];   // w38331704, from the lower end
  const MAST = [1041.1, 653.6, 60];   // n2936644466 [x, z, height=]
  const POLES = [[146.2, 324.1, 0.751], [149.5, 299.3, 0.122], [151.3, 282.2, -0.6], [-122.6, -98.3, -0.573]];   // n11772646785, n4001424807, n4001424808, n4001424809 [x, z, the crossarm's angle: across the line]
  const WIRES = [[0, 1], [1, 2]];   // the spans under 80 m (24.9 m, 17.2 m)
  const TRAFO = [626.8, 266.2, 1.496];   // n4020853300
  const BOARD = [-84.0, -47.5];   // n641362579
  const SKI = [   // the nordic trails [width m (width=, else 4: assumed), the way]
    [2, [[-51.3, 36.1], [-43.7, 14.1], [-48.0, 8.1], [-50.8, -2.3], [-117.2, -87.1], [-159.1, -172.7], [-163.5, -184.1]]],   // w50436999
    [4, [[949.0, 745.5], [954.2, 762.7]]],   // w50437014
    [4, [[1051.8, 601.8], [1047.7, 618.4], [1052.7, 656.8], [1059.7, 667.2], [1064.6, 672.8], [1068.0, 678.9], [1071.5, 681.3]]],   // w330713291
    [4, [[718.0, 490.6], [727.9, 482.7], [739.0, 469.2], [742.7, 457.8], [748.2, 445.5], [752.0, 438.6], [751.1, 425.2], [756.4, 415.5], [754.1, 405.5], [755.4, 399.2], [759.0, 388.1], [761.6, 374.2], [763.4, 361.0], [765.6, 350.1], [769.9, 311.6]]],   // w330713292
    [4, [[910.3, 772.0], [922.7, 752.0], [949.0, 745.5]]],   // w330713957
    [4, [[942.8, 428.8], [943.7, 432.8]]],   // w441911363
    [4, [[943.7, 432.8], [938.9, 442.6], [936.8, 448.6], [936.3, 458.4], [937.2, 465.7], [942.0, 477.6]]],   // w1436256665
  ];
  const CLIFF = [   // natural=cliff: the low side to the right of the way
    [[941.4, 643.8], [966.5, 704.4]],   // w627401627
    [[1025.0, 674.1], [1023.2, 680.1]],   // w627401628
    [[918.4, 456.8], [918.4, 497.4]],   // w627401635
    [[896.2, 520.4], [910.3, 566.2]],   // w627401636
    [[1077.6, 581.7], [1070.9, 591.3], [1070.9, 617.2]],   // w627401638
  ];
  const STEPS = [   // [step_count (0: not mapped), surface (0 concrete, 1 paving stones), the way]; all handrail=yes, incline=up
    [117, 0, [[905.7, 593.2], [950.6, 552.1]]],   // w290139300
    [0, 1, [[996.2, 507.9], [994.4, 501.7]]],   // w290139302
    [58, 0, [[1100.5, 598.0], [1121.5, 610.6]]],   // w835590523
    [70, 0, [[1073.3, 570.9], [1092.2, 590.4]]],   // w835590525
  ];
  const WALL = [[983.3, 492.3], [988.6, 504.4], [995.6, 501.2], [1001.5, 513.8]];   // barrier=retaining_wall w290139303
  const PARK = [   // amenity=parking, surface=asphalt (the outlines)
    [[888.4, 721.6], [897.6, 712.4], [921.3, 699.5], [919.1, 692.3], [920.4, 691.0], [923.6, 687.6], [927.4, 693.3], [934.9, 704.4], [942.3, 726.1], [937.7, 731.7], [945.3, 756.8], [949.1, 793.9], [925.5, 797.7], [921.7, 777.9], [933.9, 769.8], [926.6, 749.0], [922.7, 752.0], [917.1, 756.3], [900.1, 771.2], [875.4, 735.7], [888.4, 721.6]],   // w253763299
    [[865.0, 518.1], [845.4, 526.8], [855.8, 541.1], [863.2, 554.5], [877.8, 599.2], [908.3, 612.5], [894.3, 572.3], [893.3, 569.3], [882.0, 543.0], [879.1, 544.4], [865.0, 518.1]],   // w167079819
  ];
  const C = {
    snow: [0.9, 0.92, 0.96], conc: [0.7, 0.7, 0.68], rail: [0.5, 0.52, 0.54], car: [0.84, 0.86, 0.88], win: [0.5, 0.57, 0.64],
    mast: [0.62, 0.64, 0.66], panel: [0.86, 0.87, 0.88], wood: [0.47, 0.4, 0.32], ins: [0.82, 0.82, 0.78], wire: [0.6, 0.62, 0.64], trafo: [0.6, 0.63, 0.62],
    trail: [0.86, 0.89, 0.94], track: [0.76, 0.8, 0.87], rock: [0.66, 0.65, 0.62], slope: [0.86, 0.88, 0.92], pave: [0.6, 0.58, 0.55], steel: [0.58, 0.6, 0.62],
    park: [0.8, 0.82, 0.86], frame: [0.45, 0.36, 0.27], face: [0.8, 0.76, 0.66]
  };
  // (helpers) the points every `step` m along a way; the stretches of them where keep(x, z) holds; a way moved sideways by o m
  const dense = (P, step) => { const Q = []; for (let k = 0; k + 1 < P.length; k++) { const [ax, az] = P[k], [bx, bz] = P[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step)); for (let j = 0; j < n; j++) Q.push([ax + (bx - ax) * j / n, az + (bz - az) * j / n]); } Q.push(P[P.length - 1].slice()); return Q; };
  const stretches = (Q, keep) => { const rs = []; let cur = []; for (const q of Q) { if (keep(q[0], q[1])) cur.push(q); else { if (cur.length > 1) rs.push(cur); cur = []; } } if (cur.length > 1) rs.push(cur); return rs; };
  const dir = (Q, k) => { const a = Q[Math.max(0, k - 1)], b = Q[Math.min(Q.length - 1, k + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; };
  const side = (Q, o) => Q.map((q, k) => { const [ux, uz] = dir(Q, k); return [q[0] - uz * o, q[1] + ux * o]; });   // (o > 0: to the right)
  const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  function add(out) {
    if (!out || !out.root || !out.matV || !A.vrNear || !A.ouRod || typeof out.groundH !== 'function') return;
    const flat = new Chunks(512), solid = new Chunks(512), R = rng(17171), gh = out.groundH, near = A.vrNear, rod = A.ouRod;
    const ok = (x, z, m) => { const n = near(x, z); return n.i >= 0 && n.d <= 60 && n.dd >= m; };   // within 60 m of the road, m beyond its barriers
    // a beam along the points Q, w wide, its top and bottom heights per point (the sides face out; caps: 1 the start, 2 the end, 4 the underside)
    function beam(ch, Q, top, bot, w, col, colTop, caps) {
      for (let k = 0; k + 1 < Q.length; k++) {
        const [ax, az] = Q[k], [bx, bz] = Q[k + 1], L = Math.hypot(bx - ax, bz - az); if (L < 1e-3) continue;
        const px = -(bz - az) / L * w / 2, pz = (bx - ax) / L * w / 2, g = ch.get((ax + bx) / 2, (az + bz) / 2);
        const aL = [ax - px, top[k], az - pz], aR = [ax + px, top[k], az + pz], bL = [bx - px, top[k + 1], bz - pz], bR = [bx + px, top[k + 1], bz + pz];
        const aL0 = [ax - px, bot[k], az - pz], aR0 = [ax + px, bot[k], az + pz], bL0 = [bx - px, bot[k + 1], bz - pz], bR0 = [bx + px, bot[k + 1], bz + pz];
        const mid = [(ax + bx) / 2, (top[k] + bot[k] + top[k + 1] + bot[k + 1]) / 4, (az + bz) / 2];
        g.quadUp(aL, aR, bR, bL, [colTop, colTop, colTop, colTop]);
        g.quadO(aL, bL, bL0, aL0, col, mid); g.quadO(aR, bR, bR0, aR0, col, mid);
        if ((caps & 1) && k === 0) g.quadO(aL, aR, aR0, aL0, col, mid);
        if ((caps & 2) && k === Q.length - 2) g.quadO(bL, bR, bR0, bL0, col, mid);
        if (caps & 4) g.quadO(aL0, aR0, bR0, bL0, col, [mid[0], mid[1] + 5, mid[2]]);
      }
    }
    // an up-facing quad on the ground, shaded with the ground's own normals (no facets of its own: it reads as the snow it lies on)
    const nrm = (x, z) => { const e = 1.5, hx = gh(x + e, z) - gh(x - e, z), hz = gh(x, z + e) - gh(x, z - e), L = Math.hypot(hx, 2 * e, hz); return [-hx / L, 2 * e / L, -hz / L]; };
    const ground = (g, a, b, c, d, cols, N) => { N = N || [nrm(a[0], a[2]), nrm(b[0], b[2]), nrm(c[0], c[2]), nrm(d[0], d[2])]; g.quadON(a, b, c, d, N[0], N[1], N[2], N[3], [(a[0] + c[0]) / 2, Math.min(a[1], b[1], c[1], d[1]) - 5, (a[2] + c[2]) / 2], cols[0], cols[1], cols[2], cols[3]); };
    // a strip laid on the ground along Q, w wide, o m to the right of it
    function strip(ch, Q, w, o, lift, col) {
      for (let k = 0; k + 1 < Q.length; k++) {
        const [ax, az] = Q[k], [bx, bz] = Q[k + 1], [ux, uz] = dir(Q, k), [vx, vz] = dir(Q, k + 1);
        const at = (x, z, ox, oz, s) => { const X = x + ox * (o + s * w / 2), Z = z + oz * (o + s * w / 2); return [X, gh(X, Z) + lift, Z]; };
        const c1 = vary(col, R, 0.015), c2 = vary(col, R, 0.015);
        ground(ch.get(ax, az), at(ax, az, -uz, ux, -1), at(ax, az, -uz, ux, 1), at(bx, bz, -vz, vx, 1), at(bx, bz, -vz, vx, -1), [c1, c1, c2, c2]);
      }
    }
    // the nordic trails: the groomed lane, the classic tracks along its right edge
    for (const [w, P] of SKI) for (const Q of stretches(dense(P, 2), (x, z) => ok(x, z, 1.5 + w / 2))) { strip(flat, Q, w, 0, 0.08, C.trail); strip(flat, Q, 0.35, w / 2 - 0.45, 0.12, C.track); }
    // the funicular: its rails' height follows the ground 0.6 m up, 4.8 m clear over the road under a 0.9 m girder, smoothed
    {
      const Q = dense(FUNI, 1), n = Q.length, g0 = Q.map(([x, z]) => gh(x, z)), lo = g0.map((g) => g + 0.6);
      for (let k = 0; k < n; k++) { const v = near(Q[k][0], Q[k][1]); if (v.i >= 0 && v.dd < 2) lo[k] = Math.max(lo[k], v.hn + 4.8 + 0.9); }
      let y = lo.slice();
      for (let it = 0; it < 40; it++) { const y2 = y.slice(); for (let k = 0; k < n; k++) { let s = 0, c = 0; for (let j = Math.max(0, k - 6); j <= Math.min(n - 1, k + 6); j++) { s += y[j]; c++; } y2[k] = Math.max(lo[k], s / c); } y = y2; }
      const up = (d) => y.map((v) => v + d), bot = y.map((v, k) => (v - g0[k] <= 1.2 ? g0[k] - 0.3 : v - 0.9));
      beam(solid, Q, y, bot, 2.2, C.conc, C.snow, 1 | 2 | 4);   // the deck (on the ground a bed, in the air a girder)
      for (const o of [-0.6, 0.6]) beam(solid, side(Q, o), up(0.12), y, 0.08, C.rail, C.rail, 0);
      for (let k = 4; k < n; k += 8) {   // the pillars, none on the road or its verge
        const [x, z] = Q[k]; if (y[k] - g0[k] <= 1.2 || near(x, z).dd < 1.5) continue;
        const [ux, uz] = dir(Q, k); box(solid.get(x, z), x, g0[k] - 0.3, z, 1.4, y[k] - 0.9 - (g0[k] - 0.3), 0.6, Math.atan2(uz, ux) + Math.PI / 2, C.conc, C.conc, true);
      }
      const Qc = Q.slice(3, 7), yc = y.slice(3, 7);   // the car, 3 m to 6 m from the lower end
      beam(solid, Qc, yc.map((v) => v + 2.6), yc.map((v) => v + 0.2), 2.2, C.car, C.car, 1 | 2 | 4);
      beam(solid, Qc, yc.map((v) => v + 2.15), yc.map((v) => v + 1.35), 2.26, C.win, C.car, 1 | 2);
    }
    // the mast: a lattice of three legs, a ring and a diagonal every 3 m, three panel antennas at the top
    {
      const [mx, mz, H] = MAST, y0 = gh(mx, mz) - 0.2, a0 = 0.4, g = solid.get(mx, mz);
      const leg = (h, j) => { const r = (4.5 - 2.9 * h / H) / Math.sqrt(3), a = a0 + j * TAU / 3; return [mx + Math.cos(a) * r, y0 + h, mz + Math.sin(a) * r]; };
      for (let b = 0; b < H / 3; b++) for (let j = 0; j < 3; j++) {
        const p0 = leg(b * 3, j), p1 = leg(b * 3 + 3, j), q0 = leg(b * 3, (j + 1) % 3), q1 = leg(b * 3 + 3, (j + 1) % 3);
        rod(g, p0, p1, 0.07, C.mast, 4); rod(g, p1, q1, 0.035, C.mast, 3); rod(g, b % 2 ? p0 : q0, b % 2 ? q1 : p1, 0.03, C.mast, 3);
      }
      for (let j = 0; j < 3; j++) { const a = a0 + j * TAU / 3 + Math.PI / 3, r = 1.6 / (2 * Math.sqrt(3)) + 0.25; box(g, mx + Math.cos(a) * r, y0 + H - 4.5, mz + Math.sin(a) * r, 0.32, 1.6, 0.12, a - Math.PI / 2, C.panel, C.panel); }
    }
    // the poles: wood, a crossarm with two insulators and one on the top; the wires of the short spans sag 2 %
    const tips = (x, z, rot) => { const y = gh(x, z), c = Math.cos(rot), s = Math.sin(rot); return [[x - c * 0.8, y + 9.53, z - s * 0.8], [x, y + 10.18, z], [x + c * 0.8, y + 9.53, z + s * 0.8]]; };
    const pole = (x, z, rot) => {
      const g = solid.get(x, z), y = gh(x, z), c = Math.cos(rot), s = Math.sin(rot);
      cyl(g, x, y - 0.3, z, 0.13, 10.3, 6, C.wood, C.wood, 0.11); box(g, x, y + 9.25, z, 1.8, 0.1, 0.1, rot, C.wood, C.wood);
      for (const o of [-0.8, 0.8]) cyl(g, x + c * o, y + 9.35, z + s * o, 0.06, 0.18, 5, C.ins, C.ins);
      cyl(g, x, y + 10.0, z, 0.06, 0.18, 5, C.ins, C.ins);
    };
    for (const [x, z, rot] of POLES) pole(x, z, rot);
    for (const [a, b] of WIRES) {
      const [ax, az, ra] = POLES[a], [bx, bz, rb] = POLES[b], ta = tips(ax, az, ra), tb = tips(bx, bz, rb), L = Math.hypot(bx - ax, bz - az), sag = 0.02 * L + 0.2;
      if (Math.cos(ra) * Math.cos(rb) + Math.sin(ra) * Math.sin(rb) < 0) tb.reverse();   // (the crossarms the same way round)
      for (let j = 0; j < 3; j++) { let p = ta[j]; for (let q = 1; q <= 8; q++) { const t = q / 8, P = [ta[j][0] + (tb[j][0] - ta[j][0]) * t, ta[j][1] + (tb[j][1] - ta[j][1]) * t - 4 * sag * t * (1 - t), ta[j][2] + (tb[j][2] - ta[j][2]) * t]; rod(solid.get(P[0], P[2]), p, P, 0.015, C.wire, 3); p = P; } }
    }
    { const [x, z, rot] = TRAFO, y = gh(x, z), c = Math.cos(rot), s = Math.sin(rot); pole(x, z, rot);   // the transformer hangs on its pole, across the crossarm
      box(solid.get(x, z), x - s * 0.62, y + 3.6, z + c * 0.62, 1.0, 1.2, 0.8, rot, C.trafo, C.trafo); }
    // the cliffs: a rock face 2-3 m high on the way's right (its low side), the snow on its top and on the slope behind it
    for (const P of CLIFF) {
      const ph = R() * TAU;
      for (const Q of stretches(dense(P, 2), (x, z) => ok(x, z, 3.8))) {
        const m = Q.length, S = (m - 1) * 2, sec = [];
        for (let k = 0; k < m; k++) {
          const [x, z] = Q[k], [ux, uz] = dir(Q, k), rx = -uz, rz = ux, s = k * 2, H = (2.5 + 0.5 * Math.sin(s / 6 + ph)) * Math.max(0.15, Math.min(1, s / 3, (S - s) / 3)), top = gh(x, z) + H;
          const pt = (o, yy) => [x + rx * o, yy, z + rz * o];
          sec.push({ B: pt(-3, gh(x - rx * 3, z - rz * 3) - 0.2), T1: pt(-0.9, top), T2: pt(0, top), F: pt(0.25, gh(x + rx * 0.25, z + rz * 0.25) - 0.4), I: pt(-1, gh(x, z) - 1), u: [ux, uz] });
        }
        for (let k = 0; k + 1 < m; k++) {
          const a = sec[k], b = sec[k + 1], I = [(a.I[0] + b.I[0]) / 2, (a.I[1] + b.I[1]) / 2, (a.I[2] + b.I[2]) / 2], g = solid.get(a.T2[0], a.T2[2]);
          g.quadO(a.B, a.T1, b.T1, b.B, vary(C.slope, R, 0.03), I); g.quadO(a.T1, a.T2, b.T2, b.T1, C.snow, I); g.quadO(a.T2, a.F, b.F, b.T2, vary(C.rock, R, 0.05), I);
        }
        for (const [e, f] of [[sec[0], -1], [sec[m - 1], 1]]) { const I = [e.I[0] - e.u[0] * f, e.I[1], e.I[2] - e.u[1] * f], g = solid.get(e.T2[0], e.T2[2]); g.quadO(e.B, e.T1, e.T2, e.F, C.rock, I); }
      }
    }
    // the retaining wall
    for (const Q of stretches(dense(WALL, 1.5), (x, z) => ok(x, z, 1))) beam(solid, Q, Q.map(([x, z]) => gh(x, z) + 1.2), Q.map(([x, z]) => gh(x, z) - 0.3), 0.3, C.conc, C.snow, 1 | 2);
    // the steps: a tread for each step, on the ground; the handrail on the left going up (posts every 3 m)
    for (const [cnt, surf, P] of STEPS) {
      const [[ax, az], [bx, bz]] = P, L = Math.hypot(bx - ax, bz - az), n = cnt || Math.max(1, Math.round(L / 0.35)), tr = L / n, ux = (bx - ax) / L, uz = (bz - az) / L, rot = Math.atan2(-ux, uz), col = surf ? C.pave : C.conc;
      for (let j = 0; j < n; j++) { const x = ax + ux * tr * (j + 0.5), z = az + uz * tr * (j + 0.5); if (!ok(x, z, 1.6)) continue; box(solid.get(x, z), x, gh(x, z) - 0.3, z, 1.5, 0.45, tr + 0.02, rot, col, C.snow, true); }
      let prev = null;
      for (let t = 0; t <= L + 0.01; t += L / Math.max(1, Math.round(L / 3))) {
        const x = ax + ux * t + uz * 0.8, z = az + uz * t - ux * 0.8; if (!ok(x, z, 0.8)) { prev = null; continue; }
        const y = gh(x, z), top = [x, y + 1.05, z], g = solid.get(x, z); rod(g, [x, y - 0.1, z], top, 0.025, C.steel, 4); if (prev) rod(g, prev, top, 0.022, C.steel, 4); prev = top;
      }
    }
    // the car parks: 2 m cells inside the outline, packed snow on the asphalt as on the road
    for (const P of PARK) {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      const vc = new Map(), V = (i, j) => { const k = i + ',' + j; let v = vc.get(k); if (!v) vc.set(k, v = { p: [i * 2, gh(i * 2, j * 2) + 0.07, j * 2], n: nrm(i * 2, j * 2) }); return v; };   // (the corners shared: one height, one normal)
      for (let i = Math.floor(x0 / 2); i * 2 < x1; i++) for (let j = Math.floor(z0 / 2); j * 2 < z1; j++) {
        const cx = i * 2 + 1, cz = j * 2 + 1; if (!inPoly(P, cx, cz) || !ok(cx, cz, 0.8)) continue;
        const a = V(i, j), b = V(i + 1, j), c = V(i + 1, j + 1), d = V(i, j + 1);
        ground(flat.get(cx, cz), a.p, b.p, c.p, d.p, [C.park, C.park, C.park, C.park], [a.n, b.n, c.n, d.n]);
      }
    }
    // the map board: two posts and the panel, its face to the road
    {
      const [x, z] = BOARD, tx = -(near(x + 1, z).d - near(x - 1, z).d), tz = -(near(x, z + 1).d - near(x, z - 1).d), rot = Math.atan2(-tx, tz), c = Math.cos(rot), s = Math.sin(rot), y = gh(x, z), g = solid.get(x, z);
      for (const o of [-0.55, 0.55]) box(g, x + c * o, y - 0.2, z + s * o, 0.1, 2.15, 0.1, rot, C.frame, C.frame);
      box(g, x, y + 1.0, z, 1.2, 0.9, 0.06, rot, C.face, C.frame);
    }
    flat.addTo(out.root, out.matV, false, true); solid.addTo(out.root, out.matV, true, true);
  }
  World.k15 = World.k15 || {};
  World.k15.koli = (push) => {   // (called by S.keepOut before the trees: none on what this draws)
    const along = (P, step, r) => { for (const [x, z] of dense(P, step)) push(x, z, r); };
    for (const [w, P] of SKI) along(P, 3, w / 2 + 1.5);
    along(FUNI, 3, 3); along(WALL, 3, 1.5); for (const [, , P] of STEPS) along(P, 2.5, 2); for (const P of CLIFF) along(P, 3, 2);
    push(MAST[0], MAST[1], 5); for (const [x, z] of POLES) push(x, z, 1.5); push(TRAFO[0], TRAFO[1], 2); push(BOARD[0], BOARD[1], 1.5);
    for (const P of PARK) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } for (let x = x0; x <= x1; x += 4) for (let z = z0; z <= z1; z += 4) if (inPoly(P, x, z)) push(x, z, 3); }
  };
  const base = World.ext.koli;
  World.ext.koli = (...a) => { const out = base(...a); add(out); return out; };
})();
