/* ===================================================================================================================================
   WORLD — Koli, Finska: the roadside from OpenStreetMap (23. 11. 2026), laid over the gore world js/world-koli.js builds
   -----------------------------------------------------------------------------------------------------------------------------------
   How: World.ext.koli is wrapped; while it runs, World.gore.build gets this file's keepOut and extra after its own. js/world-koli.js and
   js/tracks/koli.js are not changed. The OSM ways are laid on the game's map by the importer's projection (origin 63.101285, 29.784938;
   the road's ways fall on def.points with no shift).
   Drawn (OSM):
     the road lighting where the ways of the road are lit=yes (w125668507, w185268712: the lower 0.5 km; w28060023, w441911361: the last
     0.6 km up to Ylä-Koli), not on the unlit middle (w1535788100 lit=no); slim galvanised poles about 9 m high on one side; their spacing
     (40 m) and height are not in OSM; where the world's land cover is built up, its own village lamps stand and these are left out;
     the funicular w38331704 (railway=funicular, layer=1) from the car park below the hotel up the slope, over the road on a bridge
     before the finish: a steel deck on piers with two rails and its cabin at the lower end; the clearance over the road (5.5 m) and the
     cabin's size are not in OSM;
     the power lines w399349249, w397349119 (power=minor_line; the poles n4001424807, n4001424808 are wood): wooden poles at the ways'
     nodes and between them every <= 60 m (the spacing is not in OSM) where they run within 90 m of the road, three wires;
     the 60 m lattice mast n2936644466 (man_made=mast, tower:construction=lattice, height=60.0) above the finish;
     the quartzite of the Koli summit: the cliffs w627401627, w627401635, w627401636, w627401638 as rock steps and the bare rock
     w835074879, w835074880, w835597797 as low pale slabs (their shapes and heights are not in OSM), snow on their tops;
     the retaining wall w290139303 (natural stone, 1.4 m: not in OSM); the bus stops n801072184, n6270986172, n6270986173 (shelter=no:
     a post with a blank plate); the bicycle stands n13139800288 (capacity 12).
   Not drawn: names, the hotel's sign, the monument, the picnic site; the buildings and the lifts the world already draws.
   No new def.sideRoads, stubs or gaps: driving, physics and def.hills are unchanged.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), 23. 11. 2026
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.gore || !World.ext || typeof World.ext.koli !== 'function') return;
  const API = World.api, { box, cyl, vrGround, vrNear, vrLCf } = API;

  // ---- the data: x east, z south, metres from the track's origin; flat x, z lists ----
  const LIT = [[5, 520], [1571, 2201]];   // the lit stretches, in metres along def.points (the ways' lit=yes projected on the road)
  const FUNI = [921.3, 601.1, 923.1, 597.3, 964.1, 566.8, 1006.4, 534.0];   // w38331704 (109 m)
  const WALLS = [
    [996.7, 507.1, 1002.1, 519.1, 1007.9, 516.4, 1009.0, 515.9, 1014.9, 528.5],   // w290139303 (35 m)
  ];
  const POWER = [
    [165.2, 314.3, 641.2, 281.3, 895.0, 259.3, 934.2, 257.0, 981.7, 239.2, 1070.2, 185.4, 1296.7, 203.0],   // w399349249 (its part near the road)
    [-5.5, 533.2, 9.7, 502.1, 57.3, 424.8, 104.9, 378.9, 161.9, 339.0, 165.2, 314.3, 167.0, 297.2, -106.2, -82.8, -178.8, -239.2],   // w397349119 (its part near the road)
  ];
  const CLIFFS = [
    [955.0, 658.4, 980.1, 718.9],   // w627401627 (66 m)
    [932.1, 471.6, 932.1, 512.2],   // w627401635 (41 m)
    [909.9, 535.1, 924.0, 580.8],   // w627401636 (48 m)
    [1090.8, 596.3, 1084.1, 605.9, 1084.1, 631.8],   // w627401638 (38 m)
  ];
  const ROCK = [
    [1106.9, 592.5, 1115.8, 597.9, 1118.3, 606.6, 1119.9, 623.8, 1119.6, 631.4, 1117.4, 641.7, 1114.7, 653.3, 1110.4, 660.9, 1103.9, 663.0, 1096.4, 660.3, 1091.5, 651.7, 1085.8, 640.9, 1084.1, 631.8, 1084.1, 605.9, 1090.8, 596.3, 1099.9, 589.5, 1106.9, 592.5],   // w835074879
    [961.3, 627.9, 965.3, 644.7, 972.6, 657.4, 982.6, 669.0, 987.0, 677.9, 995.6, 694.1, 999.1, 712.7, 998.8, 726.3, 992.1, 737.3, 984.3, 740.6, 968.9, 738.1, 962.1, 734.4, 952.6, 713.0, 950.5, 695.2, 949.1, 686.0, 946.4, 673.6, 942.6, 658.7, 935.6, 645.7, 931.8, 628.7, 929.9, 614.9, 927.2, 607.4, 920.2, 588.7, 914.8, 572.5, 912.4, 562.2, 912.4, 557.1, 911.4, 546.6, 909.1, 535.2, 910.1, 534.1, 912.1, 537.7, 918.3, 556.6, 927.2, 569.3, 932.6, 575.7, 937.5, 578.7, 949.9, 592.5, 956.7, 606.3, 960.5, 616.3, 961.3, 627.9],   // w835074880
    [935.6, 480.0, 937.6, 488.7, 940.6, 498.5, 940.2, 508.1, 939.3, 516.4, 937.5, 523.5, 934.8, 523.3, 932.6, 519.4, 930.6, 514.7, 929.9, 499.8, 929.8, 487.5, 929.3, 478.2, 926.0, 473.5, 918.1, 463.7, 913.5, 458.2, 915.2, 456.2, 918.2, 454.8, 925.1, 459.7, 929.1, 465.5, 934.7, 473.5, 935.6, 480.0],   // w835597797
  ];
  const MAST = [1054.4, 668.2, 60];   // n2936644466
  const STOPS = [[213.6, 290.5], [157.2, 207.8], [922.5, 617.6]];   // n801072184, n6270986172, n6270986173
  const BIKES = [915.6, 586.5, 12];   // n13139800288

  const CO = World.koliObcestje = { keepOut, extra, stats: null };
  const GALV = [0.66, 0.68, 0.7], DARK = [0.3, 0.31, 0.33], WOOD = [0.4, 0.33, 0.26], WIRE = [0.26, 0.26, 0.27], SNOW = [0.92, 0.94, 0.97];
  const STEEL = [0.56, 0.58, 0.6], CONC = [0.66, 0.65, 0.62], CAB = [0.86, 0.87, 0.86], GLASS = [0.32, 0.4, 0.46];
  const QTZ = [[0.8, 0.8, 0.78], [0.74, 0.74, 0.72], [0.84, 0.83, 0.8], [0.7, 0.7, 0.69]], STONE = [0.55, 0.54, 0.52];

  // ---- helpers (their own rng: the world's random sequence stays as it was) ----
  const pairs = (L) => { const o = []; for (let q = 0; q + 1 < L.length; q += 2) o.push([L[q], L[q + 1]]); return o; };
  const along = (L, step, fn) => {   // calls fn(x, z, hd, d) every <= step m along a flat list, its corners included
    const P = pairs(L); let d = 0;
    for (let k = 0; k + 1 < P.length; k++) { const [ax, az] = P[k], [bx, bz] = P[k + 1], l = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(l / step)), hd = Math.atan2(bz - az, bx - ax);
      for (let t = k ? 1 : 0; t <= m; t++) fn(ax + (bx - ax) * t / m, az + (bz - az) * t / m, hd, d + l * t / m);
      d += l; } };
  const dRoad = (x, z) => vrNear(x, z).dd;
  const inPoly = (L, x, z) => { let c = false; for (let i = 0, j = L.length - 2; i < L.length; j = i, i += 2) { const xi = L[i], zi = L[i + 1], xj = L[j], zj = L[j + 1];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  function beam(g, A, B, r, col) {   // a square beam r half wide from A to B in any direction
    const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], L = Math.hypot(dx, dy, dz) || 1, ex = dx / L, ey = dy / L, ez = dz / L;
    let ux = -ez, uy = 0, uz = ex; if (Math.hypot(ux, uz) < 0.1) { ux = 0; uy = ez; uz = -ey; }
    const l = Math.hypot(ux, uy, uz); ux /= l; uy /= l; uz /= l;
    const vx = ey * uz - ez * uy, vy = ez * ux - ex * uz, vz = ex * uy - ey * ux, M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
    const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => [(ux * a + vx * b) * r, (uy * a + vy * b) * r, (uz * a + vz * b) * r]);
    for (let k = 0; k < 4; k++) { const p = C[k], q = C[(k + 1) % 4];
      g.quadO([A[0] + p[0], A[1] + p[1], A[2] + p[2]], [B[0] + p[0], B[1] + p[1], B[2] + p[2]], [B[0] + q[0], B[1] + q[1], B[2] + q[2]], [A[0] + q[0], A[1] + q[1], A[2] + q[2]], col, M); } }
  function wire(scen, A, B, sag, r, col) {   // a sagging wire in pieces of <= 20 m
    const span = Math.hypot(B[0] - A[0], B[2] - A[2]), n = Math.max(2, Math.ceil(span / 20)); let p = A;
    for (let t = 1; t <= n; t++) { const f = t / n, q = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f - 4 * sag * f * (1 - f), A[2] + (B[2] - A[2]) * f];
      beam(scen.get((p[0] + q[0]) / 2, (p[2] + q[2]) / 2), p, q, r, col); p = q; } }
  const funiAt = (() => {   // the funicular's line: point and heading at d m from its lower end
    const P = pairs(FUNI), cum = [0]; for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
    const f = (d) => { let k = 0; while (k < P.length - 2 && cum[k + 1] < d) k++; const l = cum[k + 1] - cum[k], u = Math.min(1, Math.max(0, (d - cum[k]) / l));
      return [P[k][0] + (P[k + 1][0] - P[k][0]) * u, P[k][1] + (P[k + 1][1] - P[k][1]) * u, Math.atan2(P[k + 1][1] - P[k][1], P[k + 1][0] - P[k][0])]; };
    f.len = cum[cum.length - 1]; return f; })();
  // the power poles: the ways' nodes and between them every <= 60 m, those within 90 m of the road (filled once, at the first build)
  let POLES = null;
  const poles = () => { if (POLES) return POLES; POLES = [];
    for (const L of POWER) { const run = []; const P = pairs(L);
      for (let k = 0; k + 1 < P.length; k++) { const [ax, az] = P[k], [bx, bz] = P[k + 1], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 60));
        for (let t = k ? 1 : 0; t <= m; t++) { const x = ax + (bx - ax) * t / m, z = az + (bz - az) * t / m, dd = dRoad(x, z);
          if (dd < 90 && dd > 4) run.push([x, z]); else if (run.length) { POLES.push(run.splice(0)); } } }
      if (run.length) POLES.push(run); }
    return POLES; };

  // ---- keepOut: no rocks nor trees where these stand ----
  function keepOut(push) {
    along(FUNI, 4, (x, z) => push(x, z, 3));
    for (const run of poles()) for (const [x, z] of run) push(x, z, 1.5);
    push(MAST[0], MAST[1], 6);
    for (const L of WALLS) along(L, 3, (x, z) => push(x, z, 1.2));
    for (const L of CLIFFS) along(L, 3, (x, z) => push(x, z, 2.5));
    for (const [x, z] of STOPS) push(x, z, 1); push(BIKES[0], BIKES[1], 3);
  }

  function extra(ctx) {
    const scen = ctx.scen, st = { lamps: 0, funi: 0, piers: 0, poles: 0, wire: 0, mast: 0, rocks: 0, wall: 0, stops: 0 }, R = API.rng(4711);
    const free = (x, z, r) => !ctx.excluded(x, z) && dRoad(x, z) > r;
    // the road lighting: a slim galvanised pole every 40 m on the right, its arm over the verge, the lamp (snow on the arm)
    for (const [a, b] of LIT) for (let s = a + 10; s < b; s += 40) {
      const [x, z, i] = ctx.onSide(s, 1, 1.4); if (vrLCf(x, z, 3) > 0.5 || ctx.excluded(x, z) || API.vrStubAt(x, z, 1.2)) continue;
      const [rx, rz] = ctx.onSide(s, 1, 0), nx = (rx - x), nz = (rz - z), nl = Math.hypot(nx, nz) || 1, ux = nx / nl, uz = nz / nl, y0 = vrGround(x, z) - 0.2, g = scen.get(x, z), H = 9;
      cyl(g, x, y0, z, 0.1, H, 6, GALV, null, 0.06);
      beam(g, [x, y0 + H - 0.1, z], [x + ux * 1.6, y0 + H + 0.25, z + uz * 1.6], 0.04, GALV);
      const lx = x + ux * 1.9, lz = z + uz * 1.9, hd = Math.atan2(uz, ux); box(g, lx, y0 + H + 0.1, lz, 0.7, 0.18, 0.28, hd, DARK, SNOW); box(g, lx, y0 + H + 0.08, lz, 0.55, 0.03, 0.2, hd, [0.95, 0.92, 0.78]);
      ctx.exclPush(x, z, 1.2); st.lamps++; }
    // the funicular: a steel deck on piers (5.5 m clear over the road where it crosses), two rails, its cabin at the lower end
    { const top = [], L = funiAt.len, n = Math.ceil(L / 3);
      for (let k = 0; k <= n; k++) { const d = L * k / n, [x, z, hd] = funiAt(d), dd = dRoad(x, z), gy = vrGround(x, z);
        const ry = dd < 9 ? vrNear(x, z).hn + 5.5 : -1e9; top.push([x, Math.max(gy + 1.2, ry), z, hd, gy, dd]); }
      for (let k = 1; k < top.length; k++) { const [ax, ay, az] = top[k - 1], [bx, by, bz, hd] = top[k];
        const g = scen.get((ax + bx) / 2, (az + bz) / 2), c = Math.cos(hd + Math.PI / 2), s = Math.sin(hd + Math.PI / 2);
        beam(g, [ax, ay - 0.35, az], [bx, by - 0.35, bz], 0.32, STEEL);
        for (const o of [-0.6, 0.6]) beam(g, [ax + c * o, ay + 0.05, az + s * o], [bx + c * o, by + 0.05, bz + s * o], 0.05, DARK);
        st.funi += Math.hypot(bx - ax, bz - az); }
      for (let k = 0; k < top.length; k += 3) { const [x, y, z, hd, gy, dd] = top[k]; if (dd < 4.5 || y - gy < 0.9) continue;
        box(scen.get(x, z), x, gy - 0.4, z, 0.45, y - gy - 0.3, 1.4, hd, CONC); st.piers++; }
      const [cx, cz, chd] = funiAt(6), cy = top[2][1]; box(scen.get(cx, cz), cx, cy, cz, 3.4, 2.4, 2.0, chd, CAB, SNOW);
      for (const sd of [-1, 1]) box(scen.get(cx, cz), cx + Math.cos(chd + Math.PI / 2) * sd * 1.01, cy + 1.2, cz + Math.sin(chd + Math.PI / 2) * sd * 1.01, 2.8, 0.8, 0.02, chd, GLASS);
      st.funi = Math.round(st.funi); }
    // the power lines: wooden poles ~9 m with a cross-arm, three wires
    for (const run of poles()) { const tops = [];
      for (let k = 0; k < run.length; k++) { const [x, z] = run[k], a = run[Math.max(0, k - 1)], b = run[Math.min(run.length - 1, k + 1)], hd = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
        const g = scen.get(x, z), gy = vrGround(x, z), c = Math.cos(hd), s = Math.sin(hd);
        cyl(g, x, gy - 0.3, z, 0.13, 9.3, 6, WOOD, SNOW, 0.11); box(g, x, gy + 8.5, z, 1.9, 0.12, 0.12, hd, WOOD, SNOW);
        tops.push([-0.8, 0, 0.8].map((o) => [x + c * o, gy + 8.65 + (o ? 0 : 0.45), z + s * o])); st.poles++; }
      for (let k = 0; k + 1 < tops.length; k++) for (let w = 0; w < 3; w++) { const A = tops[k][w], B = tops[k + 1][w]; wire(scen, A, B, 0.015 * Math.hypot(B[0] - A[0], B[2] - A[2]), 0.02, WIRE); st.wire += Math.round(Math.hypot(B[0] - A[0], B[2] - A[2])); } }
    // the mast: a tapering three-legged lattice, 60 m (height=60.0), a cross-brace every 5 m
    { const [x, z, H] = MAST, gy = vrGround(x, z), g = scen.get(x, z), w0 = 3.2, w1 = 0.9, leg = (q, h) => { const w = w0 + (w1 - w0) * h / H, a = q * 2 * Math.PI / 3; return [x + Math.cos(a) * w, gy + h, z + Math.sin(a) * w]; };
      for (let q = 0; q < 3; q++) { beam(g, leg(q, -0.3), leg(q, H), 0.1, GALV);
        for (let h = 0; h < H; h += 5) { beam(g, leg(q, h), leg((q + 1) % 3, h), 0.04, GALV); beam(g, leg(q, h), leg((q + 1) % 3, Math.min(H, h + 5)), 0.03, GALV); } }
      for (let q = 0; q < 3; q++) { const p = leg(q, H - 4); box(g, p[0], p[1], p[2], 0.35, 2.2, 0.35, q * 2.1, [0.8, 0.8, 0.8]); }   // the antennas
      st.mast = 1; }
    // the quartzite: rock steps along the cliffs (1.5–4 m), low pale slabs on the bare rock; snow on their tops
    const slab = (x, z, sx, sy, sz, rot) => { const g = scen.get(x, z), y = vrGround(x, z), col = QTZ[Math.floor(R() * QTZ.length)];
      API.rock(g, x, y + sy * 0.25, z, sx, sy, sz, rot, col, R, 0.22); API.rock(g, x, y + sy * 0.78, z, sx * 0.85, sy * 0.22, sz * 0.8, rot, SNOW, R, 0.15); st.rocks++; };
    for (const L of CLIFFS) along(L, 3.5, (x, z, hd) => { if (!free(x, z, 4.5)) return; const h = 1.5 + R() * 2.5; slab(x, z, 2.2 + R(), h, 1.6 + R() * 0.8, hd); });
    for (const L of ROCK) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pairs(L)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let x = x0 + 2; x < x1; x += 6) for (let z = z0 + 2; z < z1; z += 6) { const px = x + (R() - 0.5) * 4, pz = z + (R() - 0.5) * 4, u = R();
        if (!inPoly(L, px, pz) || !free(px, pz, 4.5) || u > 0.75) continue; slab(px, pz, 1.6 + R() * 1.8, 0.5 + R() * 0.9, 1.2 + R() * 1.4, R() * 6.28); } }
    // the retaining wall: natural stone, 1.4 m over the higher end
    for (const L of WALLS) { const P = pairs(L);
      for (let k = 0; k + 1 < P.length; k++) { const [ax, az] = P[k], [bx, bz] = P[k + 1], l = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2;
        const lo = Math.min(vrGround(ax, az), vrGround(bx, bz)), hi = Math.max(vrGround(ax, az), vrGround(bx, bz));
        box(scen.get(mx, mz), mx, lo - 0.4, mz, l + 0.4, hi - lo + 1.8, 0.6, Math.atan2(bz - az, bx - ax), STONE, SNOW); st.wall += Math.round(l); } }
    // the bus stops (no shelter): a post with a blank plate; the bicycle stands: a row of hoops
    const nudge = (x, z, r) => { if (free(x, z, r)) return [x, z]; for (let m = 1; m <= 6; m++) for (let a = 0; a < 8; a++) { const px = x + Math.cos(a * Math.PI / 4) * m, pz = z + Math.sin(a * Math.PI / 4) * m; if (free(px, pz, r)) return [px, pz]; } return null; };   // (the stops' nodes lie on the verge: the post just beyond it)
    for (const S0 of STOPS) { const p = nudge(S0[0], S0[1], 1.2); if (!p) continue; const [x, z] = p, g = scen.get(x, z), gy = vrGround(x, z); box(g, x, gy - 0.2, z, 0.07, 2.6, 0.07, 0, GALV); box(g, x, gy + 2.15, z, 0.5, 0.45, 0.03, 0, [0.85, 0.86, 0.88], SNOW); st.stops++; }
    { const [x, z, n] = BIKES, gy = vrGround(x, z), g = scen.get(x, z); for (let k = 0; k < n / 2; k++) { const px = x + (k - n / 4) * 0.8; beam(g, [px, gy - 0.1, z - 0.35], [px, gy + 0.8, z - 0.35], 0.025, GALV); beam(g, [px, gy - 0.1, z + 0.35], [px, gy + 0.8, z + 0.35], 0.025, GALV); beam(g, [px, gy + 0.8, z - 0.35], [px, gy + 0.8, z + 0.35], 0.025, GALV); } }
    CO.stats = st;
  }

  // ---- the hook ----
  const ext = World.ext, baseExt = ext.koli;
  ext.koli = function (scene, tex, opts) {
    const gore = World.gore, build = gore.build;
    gore.build = function (sc, tx, op, S) {
      gore.build = build;
      const S2 = Object.assign({}, S, {
        keepOut: (push) => { if (typeof S.keepOut === 'function') S.keepOut(push); keepOut(push); },
        extra: (ctx) => { const r = typeof S.extra === 'function' ? S.extra(ctx) : undefined; extra(ctx); return r; },
      });
      return build.call(this, sc, tx, op, S2);
    };
    try { return baseExt.apply(this, arguments); } finally { gore.build = build; }
  };
})();
