/* =========================================================================
   WORLD — Bathurst, Avstralija: the summit boardwalk (docs/proge/bathurst.md, »Raziskava«). Along the ridge, behind the walls on top of
   the hill (s ≈ 1560-2510 m), a public walkway runs beside the circuit: a concrete path about 2 m wide over the slope, short bridges over
   the drains and a raised stretch of metal grid with railings, the lookout over the town and the plains at its far end. Its line is
   OpenStreetMap's (© OpenStreetMap contributors, ODbL: the footways of the walkway, 2026), in the track's metres (x east, z south from the
   start line, as js/tracks/bathurst.js), each point at its OSM distance from the road (at least 9 m) off the track's own centre line, which
   lies a few metres from OSM's here. It lies on the terrain in the builder's own scenery chunks (no draw calls of its own); only
   where it is past the walls (nrNear: dd), off the build's excluded places and within 60 m of the centre line. The terrain, the road,
   the walls and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, L = (API.rbLook || {}).bathurst;
  if (!L) return;
  // the walkway's ways: 'c' concrete path, 'g' the raised metal-grid boardwalk (railings both sides); [x, z, x, z, ...]
  const WAYS = [
    ['c', [-629.9, 1050.7, -631.2, 1051.2]],
    ['c', [-611, 1037.8, -627.4, 1050, -629.9, 1050.7]],
    ['c', [-816.5, 1166.4, -817.8, 1174, -826.6, 1245.3, -829.2, 1255.5, -832.3, 1263, -836, 1268, -851.6, 1285.5, -861.4, 1296.1, -868, 1301]],
    ['c', [-816.2, 1165.2, -816.5, 1166.4]],
    ['c', [-815.4, 1161.2, -816.2, 1165.2]],
    ['c', [-815.1, 1159.9, -815.4, 1161.2]],
    ['c', [-869.7, 1301.7, -892.7, 1309.9, -898.2, 1312.8, -905.1, 1318.2, -918.1, 1325.4]],
    ['c', [-868, 1301, -869.7, 1301.7]],
    ['c', [-942, 1333.6, -946.2, 1336.2, -948.6, 1338.9, -950.7, 1343.5, -952.8, 1345.8, -956, 1347.4, -960, 1348.7, -973.6, 1361.8, -1024, 1416.6, -1033.8, 1428.6, -1044.5, 1444.4, -1055.1, 1467.9, -1063.7, 1492.9]],
    ['g', [-918.1, 1325.4, -942, 1333.6]],
    ['c', [-823.1, 1151.8, -823.1, 1151.8]],
    ['c', [-856.8, 1282.7, -857.4, 1281.8]],
    ['c', [-851.6, 1285.5, -852.7, 1284.9]],
    ['c', [-813.5, 1153.1, -819.8, 1152.1]],
    ['c', [-631.2, 1051.2, -633.2, 1051.4, -635.4, 1051.3, -639.1, 1049, -645.8, 1043.7, -650.7, 1040.7, -653, 1040.8, -655.3, 1041.7, -656.5, 1041.9, -658, 1041.5, -687, 1019.2, -694.8, 1014.4, -740.6, 994.4, -744.9, 993.4, -748.8, 993.5, -753, 995.3, -756, 999.6, -759.4, 1009.6, -772, 1119.8, -775.1, 1122, -787.3, 1122.9, -794.5, 1128.5, -802, 1131.7, -805.3, 1134.8, -810.4, 1143.6, -813.5, 1153.1, -815.1, 1159.9]]
  ];
  const CON = [0.71, 0.69, 0.64], CON2 = [0.62, 0.6, 0.56], GRID = [0.5, 0.51, 0.5], RAIL = [0.66, 0.67, 0.66];
  const W = 1.0, LIFT = 0.07, STEP = 3, GH = 0.45, RH = 1.0;   // (half its width, over the ground; the grid's deck and its rail height)
  const build = (ctx) => {
    const { nrGround: gH, nrNear } = API, scen = ctx.scen, st = { steza: 0, mreza: 0 };
    if (!scen || !gH || !nrNear) return st;
    const ok = (x, z) => { const q = nrNear(x, z), i = q.i, d = q.d, dd = q.dd; return !(i >= 0 && dd < 1.2) && d < 60 && !ctx.excluded(x, z); };
    for (const [k, P] of WAYS) {
      const grid = k === 'g', lift = grid ? GH : LIFT;
      for (let j = 0; j + 3 < P.length; j += 2) {
        const x0 = P[j], z0 = P[j + 1], x1 = P[j + 2], z1 = P[j + 3], len = Math.hypot(x1 - x0, z1 - z0);
        if (len < 0.2) continue;
        const nx = -(z1 - z0) / len * W, nz = (x1 - x0) / len * W, n = Math.max(1, Math.ceil(len / STEP));
        for (let q = 0; q < n; q++) {
          const a = q / n, b = (q + 1) / n, ax = x0 + (x1 - x0) * a, az = z0 + (z1 - z0) * a, bx = x0 + (x1 - x0) * b, bz = z0 + (z1 - z0) * b;
          if (!ok(ax, az) || !ok(bx, bz) || !ok(ax + nx, az + nz) || !ok(ax - nx, az - nz)) continue;
          const y = (x, z) => gH(x, z) + lift;
          const A = [ax + nx, y(ax + nx, az + nz), az + nz], B = [ax - nx, y(ax - nx, az - nz), az - nz], C = [bx - nx, y(bx - nx, bz - nz), bz - nz], D = [bx + nx, y(bx + nx, bz + nz), bz + nz];
          const g = scen.get((ax + bx) / 2, (az + bz) / 2), under = [(ax + bx) / 2, Math.min(A[1], B[1], C[1], D[1]) - 5, (az + bz) / 2];
          const c = grid ? GRID : (q & 1 ? CON : CON2);
          g.triO(A, B, C, c, under, c, c); g.triO(A, C, D, c, under, c, c);
          if (grid) {   // the deck's edges down to the ground and a railing (a top rail) on each side
            for (const [P0, P1] of [[A, D], [B, C]]) {
              const lo0 = [P0[0], P0[1] - GH - 0.1, P0[2]], lo1 = [P1[0], P1[1] - GH - 0.1, P1[2]], hi0 = [P0[0], P0[1] + RH, P0[2]], hi1 = [P1[0], P1[1] + RH, P1[2]];
              const mid = [(ax + bx) / 2, P0[1], (az + bz) / 2];
              g.triO(P0, P1, lo1, GRID, mid, GRID, GRID); g.triO(P0, lo1, lo0, GRID, mid, GRID, GRID);
              const t0 = [hi0[0], hi0[1] - 0.08, hi0[2]], t1 = [hi1[0], hi1[1] - 0.08, hi1[2]];
              g.tri(hi0, hi1, t1, RAIL, RAIL, RAIL); g.tri(hi0, t1, hi1, RAIL, RAIL, RAIL); g.tri(hi0, t1, t0, RAIL, RAIL, RAIL); g.tri(hi0, t0, t1, RAIL, RAIL, RAIL);
              g.tri(P0, hi0, [P0[0] + 0.04, P0[1], P0[2] + 0.04], RAIL, RAIL, RAIL); g.tri(P0, [P0[0] + 0.04, P0[1], P0[2] + 0.04], hi0, RAIL, RAIL, RAIL);   // a post
            }
            st.mreza++;
          } else st.steza++;
        }
      }
    }
    return st;
  };
  const base = L.extra;
  L.extra = function (ctx) {
    const r = (base ? base.call(this, ctx) : null) || {};
    try { r.btSteza = build(ctx); console.log('STEZA ' + JSON.stringify(r.btSteza) + ' ' + !!ctx.scen); } catch (e) { console.error('bathurst-steza:', e); }
    return r;
  };
})();
