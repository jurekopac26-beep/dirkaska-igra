/* ===================================================================================================================================
   WORLD — Longyearbyen, Norveška: the roadside from OpenStreetMap (23. 11. 2026), laid over the gore world js/world-longyearbyen.js builds
   -----------------------------------------------------------------------------------------------------------------------------------
   How: World.ext.longyearbyen is wrapped; while it runs, World.gore.build gets this file's keepOut, ownBld and extra after its own.
   js/world-longyearbyen.js and js/tracks/longyearbyen.js are not changed. The OSM ways are laid on the game's map by the fit of their
   buildings to def.bld (x' = 1.002 x + 2.74, z' = 1.003 z + 1.36 after the start-line projection; 0.6–0.8 m median left).
   Drawn (OSM):
     the town's pipelines above the ground (man_made=pipeline, not location=underground nor layer=-1; 19 ways, 3.4 km) where they run
     5.5–70 m from the road: a clad pipe about 1 m over the snow on wooden posts every ~6 m (where a way passes under the road, the
     map has it underground and it is not drawn); a) aluminium cladding, b) the same in a timber box (World.longyearbyenObcestje.pipe);
     the old coal cableway (aerialway=goods, disused=yes; w397436582, w397436588): its wooden trestles at the ways' nodes near the road
     (8, of them the mapped pylons n4002311052, n4002311200, n4002311461) and the two ropes between them; the height (12 m) is not in OSM;
     the six storage tanks w545868382–w545868387 as round tanks (def.bld has them as boxes; they are taken out of the boxes by ownBld),
     their height (twice the radius) is not in OSM;
     the fences w1348566244, w1348566239, w1348566245 (round the tanks), w1487981411; the retaining walls w1577112011, w1577112014.
   Not drawn: names, shops, cafés, the monuments; the street lamps, benches and buildings the world already draws.
   No new def.sideRoads, stubs or gaps: driving, physics and def.hills are unchanged.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), 23. 11. 2026
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.gore || !World.ext || typeof World.ext.longyearbyen !== 'function') return;
  const API = World.api, { box, cyl, vrGround, vrNear } = API;

  // ---- the data: x east, z south, metres from the track's origin; flat x, z lists ----
  const PIPES = [
    [530.7, 2008.7, 539.9, 2000.2, 536.5, 1923.9, 534.4, 1854.5, 531.1, 1774.7, 596.0, 1664.2],   // w397436593 (366 m)
    [101.7, 2637.7, 92.8, 2632.8, 64.1, 2594.8],   // w397440704 (58 m)
    [507.0, 2030.8, 469.0, 2063.9],   // w397440705 (50 m)
    [66.6, 2619.0, 42.5, 2655.9, 25.8, 2683.4, 21.9, 2688.3, 19.3, 2692.8],   // w397440710 (88 m)
    [-20.5, 2785.4, -37.3, 2812.9, -56.1, 2841.5, -78.1, 2880.2, -85.6, 2892.6],   // w397440711 (125 m)
    [460.4, 2071.2, 385.5, 2138.4, 355.7, 2190.6, 315.9, 2258.7, 249.6, 2373.1, 230.4, 2408.0, 204.0, 2451.8, 195.4, 2467.6, 175.3, 2500.8, 90.1, 2581.8, 76.2, 2605.2, 73.7, 2607.6],   // w397440712 (668 m)
    [91.2, 2651.8, 78.9, 2666.1, 72.4, 2669.5, 25.2, 2712.4, 8.6, 2739.3],   // w397440713 (122 m)
    [394.8, 2131.6, 181.4, 2500.7, 151.4, 2553.8, 112.0, 2619.1, 100.5, 2640.0],   // w397440715 (587 m)
    [19.3, 2692.8, -18.9, 2752.2, -84.8, 2856.2],   // w397440716 (194 m)
    [534.0, 1974.7, 533.6, 1958.5, 540.4, 1958.4, 540.4, 1952.1, 541.7, 1950.4],   // w1487981418 (31 m)
    [511.7, 2020.4, 505.8, 2025.7, 480.3, 2020.7],   // w1487981420 (34 m)
    [536.2, 1912.8, 544.9, 1912.9],   // w1487981422 (9 m)
    [507.0, 2030.8, 516.5, 2022.0],   // w1538491306 (13 m)
    [-124.4, 3087.9, 17.4, 2838.7],   // w1538491312 (287 m)
    [730.1, 1438.1, 757.9, 1389.6, 870.5, 1245.2, 916.6, 1187.9],   // w397436591 (312 m)
    [928.4, 1173.4, 1000.9, 1088.4, 1036.4, 1042.1, 1050.4, 1020.7, 1090.3, 928.4, 1040.1, 892.0],   // w397436594 (358 m)
    [615.4, 1631.5, 667.4, 1543.4],   // w397440706 (102 m)
    [916.6, 1187.9, 928.4, 1173.4],   // w1119176366 (19 m)
    [1210.8, 621.2, 1231.3, 629.5],   // w1576771216 (22 m)
  ];   // 3446 m
  const LINES = [
    [472.7, 2303.3, 489.1, 2199.5, 505.4, 2094.4, 556.3, 1766.3, 599.3, 1490.6],   // w397436582 nodes 4-8: 132, 91, 24, 36, 78 m from the road
    [1252.2, 1070.9, 1101.5, 957.0, 947.1, 842.3],   // w397436588 nodes 39-41: 197, 13, 172 m from the road
  ];
  const FENCES = [
    [830.1, 370.1, 828.2, 372.2, 781.6, 361.0, 789.5, 337.8, 831.0, 340.1, 837.2, 354.1],   // w1348566244
    [614.1, 349.7, 611.8, 348.5, 609.5, 345.5, 608.8, 341.4, 609.7, 334.2, 610.9, 328.0, 613.3, 321.1, 615.0, 317.7, 617.5, 315.2, 619.6, 313.7, 621.5, 313.2, 625.5, 312.9, 630.1, 314.0, 632.3, 315.3, 635.0, 317.1, 637.0, 319.9, 638.0, 322.7, 637.9, 326.3, 637.0, 329.6, 631.6, 341.1, 625.8, 349.1, 621.0, 351.5, 617.5, 351.1],   // w1487981411
    [833.3, 367.7, 838.0, 364.2],   // w1348566239
    [839.6, 359.1, 838.2, 356.0],   // w1348566245
  ];
  const WALLS = [
    [909.8, 1079.8, 913.5, 1080.5, 937.8, 1098.9, 935.5, 1102.1, 946.8, 1111.0],   // w1577112011
    [955.6, 1126.1, 954.1, 1124.6, 946.2, 1124.1, 943.1, 1123.2, 940.3, 1121.9],   // w1577112014
  ];
  const TANKS = [
    [814.9, 348.4, 2.07],   // w545868382
    [817.5, 358.8, 3.35],   // w545868383
    [823.5, 350.1, 3.36],   // w545868384
    [807.5, 343.8, 3.35],   // w545868385
    [807.0, 358.2, 3.35],   // w545868386
    [796.2, 356.1, 3.35],   // w545868387
  ];
  const CO = World.longyearbyenObcestje = { pipe: 'a', keepOut, ownBld, extra, stats: null };
  const WOOD = [0.43, 0.37, 0.3], OLDW = [0.38, 0.33, 0.27], ROPE = [0.33, 0.33, 0.34], SNOW = [0.92, 0.94, 0.97];
  const CLAD = { a: [0.72, 0.74, 0.76], b: [0.5, 0.42, 0.33] }, FENCE = [0.6, 0.61, 0.63], CONC = [0.63, 0.62, 0.59], TANK = [0.82, 0.83, 0.83];
  const LH = 12, PH = 1.0;   // the trestles' height; the pipes' height over the snow (their bottom)

  // ---- helpers (no rng: the world's own random sequence stays as it was) ----
  const pairs = (L) => { const o = []; for (let q = 0; q + 1 < L.length; q += 2) o.push([L[q], L[q + 1]]); return o; };
  const along = (L, step, fn) => {   // calls fn(x, z, hd, d) every <= step m along a flat list, its corners included
    const P = pairs(L); let d = 0;
    for (let k = 0; k + 1 < P.length; k++) { const [ax, az] = P[k], [bx, bz] = P[k + 1], l = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(l / step)), hd = Math.atan2(bz - az, bx - ax);
      for (let t = k ? 1 : 0; t <= m; t++) fn(ax + (bx - ax) * t / m, az + (bz - az) * t / m, hd, d + l * t / m);
      d += l; } };
  const offRoad = (x, z, r) => vrNear(x, z).dd > r;
  function beam(g, A, B, r, col) {   // a square beam r half wide from A to B in any direction
    const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], L = Math.hypot(dx, dy, dz) || 1, ex = dx / L, ey = dy / L, ez = dz / L;
    let ux = -ez, uy = 0, uz = ex; if (Math.hypot(ux, uz) < 0.1) { ux = 0; uy = ez; uz = -ey; }
    const l = Math.hypot(ux, uy, uz); ux /= l; uy /= l; uz /= l;
    const vx = ey * uz - ez * uy, vy = ez * ux - ex * uz, vz = ex * uy - ey * ux, M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
    const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => [(ux * a + vx * b) * r, (uy * a + vy * b) * r, (uz * a + vz * b) * r]);
    for (let k = 0; k < 4; k++) { const p = C[k], q = C[(k + 1) % 4];
      g.quadO([A[0] + p[0], A[1] + p[1], A[2] + p[2]], [B[0] + p[0], B[1] + p[1], B[2] + p[2]], [B[0] + q[0], B[1] + q[1], B[2] + q[2]], [A[0] + q[0], A[1] + q[1], A[2] + q[2]], col, M); } }
  function pipe(g, A, B, w, col) {   // a level-sided pipe w wide and high, its bottom on A..B, snow on its top
    const dx = B[0] - A[0], dz = B[2] - A[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2, M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + w / 2, (A[2] + B[2]) / 2];
    const c = (P, s, h) => [P[0] + nx * s, P[1] + h, P[2] + nz * s];
    g.quadO(c(A, -1, 0), c(B, -1, 0), c(B, -1, w), c(A, -1, w), col, M); g.quadO(c(B, 1, 0), c(A, 1, 0), c(A, 1, w), c(B, 1, w), col, M);
    g.quadO(c(A, -1, w), c(B, -1, w), c(B, 1, w), c(A, 1, w), SNOW, M); g.quadO(c(A, 1, 0), c(B, 1, 0), c(B, -1, 0), c(A, -1, 0), col, M); }

  // ---- keepOut: no rocks nor trees where these stand ----
  function keepOut(push) {
    for (const L of PIPES) along(L, 4, (x, z) => push(x, z, 1.5));
    for (const L of LINES) for (const [x, z] of pairs(L)) push(x, z, 4.5);
    for (const [x, z, r] of TANKS) push(x, z, r + 1.5);
    for (const L of FENCES.concat(WALLS)) along(L, 3, (x, z) => push(x, z, 1.2));
  }
  // ---- ownBld: the tanks are drawn round here, not as def.bld's boxes ----
  function ownBld(x, z) { for (const [tx, tz] of TANKS) if (Math.hypot(x - tx, z - tz) < 2.5) return true; return false; }

  function extra(ctx) {
    const scen = ctx.scen, st = { pipe: 0, posts: 0, trestles: 0, rope: 0, tanks: 0, fence: 0, wall: 0 }, clad = CLAD[CO.pipe] || CLAD.a;
    // the pipelines: a pipe 0.55 m across, PH over the ground's highest of its two ends, a post and a cross-piece every ~6 m
    for (const L of PIPES) { let prev = null, lastPost = -1e9;
      along(L, 3, (x, z, hd, d) => { const y = vrGround(x, z) + PH, P = [x, y, z];
        if (prev && offRoad(x, z, 4.5)) { const A = [prev[0], Math.max(prev[1], y - 0.4), prev[2]], B = [x, Math.max(y, prev[1] - 0.4), z]; pipe(scen.get(x, z), A, B, 0.55, clad); st.pipe += Math.hypot(x - prev[0], z - prev[2]); }
        if (d - lastPost >= 5.9 && offRoad(x, z, 4.5)) { const g = scen.get(x, z), gy = vrGround(x, z);
          box(g, x, gy - 0.3, z, 0.16, y - gy + 0.3, 0.16, hd, WOOD); box(g, x, y - 0.12, z, 0.14, 0.12, 0.9, hd, WOOD); st.posts++; lastPost = d; }
        prev = P; }); }
    st.pipe = Math.round(st.pipe);
    // the cableway: a tapering wooden trestle at each node (4 m square at the foot, 1.6 m at the top), a cross-arm across the line, two ropes
    for (const L of LINES) { const N = pairs(L), tops = [];
      for (let k = 0; k < N.length; k++) { const [x, z] = N[k], a = N[Math.max(0, k - 1)], b = N[Math.min(N.length - 1, k + 1)], hd = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const g = scen.get(x, z), gy = vrGround(x, z), c = Math.cos(hd), s = Math.sin(hd), at = (u, v, h) => [x + c * u - s * v, gy + h, z + s * u + c * v];
        const F = [[-2, -2], [2, -2], [2, 2], [-2, 2]], T = F.map(([u, v]) => [u * 0.4, v * 0.4]);
        for (let q = 0; q < 4; q++) { beam(g, at(F[q][0], F[q][1], -0.3), at(T[q][0], T[q][1], LH), 0.13, OLDW);
          const r = (q + 1) % 4; for (const h of [3, 7]) { const f = h / LH, m = (o) => [o[0] + (T[o === F[q] ? q : r][0] - o[0]) * f, o[1] + (T[o === F[q] ? q : r][1] - o[1]) * f];
            const p = m(F[q]), p2 = m(F[r]); beam(g, at(p[0], p[1], h), at(p2[0], p2[1], h), 0.07, OLDW); } }
        beam(g, at(0, -2.4, LH + 0.1), at(0, 2.4, LH + 0.1), 0.14, OLDW);
        tops.push([at(0, -1.9, LH), at(0, 1.9, LH)]); st.trestles++; }
      for (let k = 0; k + 1 < tops.length; k++) for (const sd of [0, 1]) { const A = tops[k][sd], B = tops[k + 1][sd], span = Math.hypot(B[0] - A[0], B[2] - A[2]), n = Math.max(2, Math.ceil(span / 25));
        let p = A; for (let t = 1; t <= n; t++) { const f = t / n, q = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f - 4 * 0.02 * span * f * (1 - f), A[2] + (B[2] - A[2]) * f];
          beam(scen.get((p[0] + q[0]) / 2, (p[2] + q[2]) / 2), p, q, 0.035, ROPE); p = q; } st.rope += Math.round(span); } }
    // the tanks: round, as high as they are wide, snow on the lid
    for (const [x, z, r] of TANKS) { const gy = vrGround(x, z); cyl(scen.get(x, z), x, gy - 0.3, z, r, 2 * r + 0.3, 16, TANK, SNOW); st.tanks++; }
    // the fences: a steel post every ~2.5 m, three wires
    for (const L of FENCES) { let prev = null;
      along(L, 2.5, (x, z, hd) => { const g = scen.get(x, z), gy = vrGround(x, z); box(g, x, gy - 0.2, z, 0.06, 2.0, 0.06, hd, FENCE); st.fence++;
        if (prev) for (const h of [0.2, 1.0, 1.75]) beam(g, [prev[0], prev[1] + h, prev[2]], [x, gy + h, z], 0.015, FENCE);
        prev = [x, gy, z]; }); }
    // the retaining walls: concrete, 1.6 m over the higher side, 0.4 m thick
    for (const L of WALLS) { const P = pairs(L);
      for (let k = 0; k + 1 < P.length; k++) { const [ax, az] = P[k], [bx, bz] = P[k + 1], l = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2;
        const lo = Math.min(vrGround(ax, az), vrGround(bx, bz)), hi = Math.max(vrGround(ax, az), vrGround(bx, bz));
        box(scen.get(mx, mz), mx, lo - 0.4, mz, l + 0.4, hi - lo + 2.0, 0.4, Math.atan2(bz - az, bx - ax), CONC); st.wall += Math.round(l); } }
    CO.stats = st;
  }

  // ---- the hook ----
  const ext = World.ext, baseExt = ext.longyearbyen;
  ext.longyearbyen = function (scene, tex, opts) {
    const gore = World.gore, build = gore.build;
    gore.build = function (sc, tx, op, S) {
      gore.build = build;
      const S2 = Object.assign({}, S, {
        keepOut: (push) => { if (typeof S.keepOut === 'function') S.keepOut(push); keepOut(push); },
        ownBld: (x, z, L, W) => (typeof S.ownBld === 'function' && S.ownBld(x, z, L, W)) || ownBld(x, z),
        extra: (ctx) => { const r = typeof S.extra === 'function' ? S.extra(ctx) : undefined; extra(ctx); return r; },
      });
      return build.call(this, sc, tx, op, S2);
    };
    try { return baseExt.apply(this, arguments); } finally { gore.build = build; }
  };
})();
