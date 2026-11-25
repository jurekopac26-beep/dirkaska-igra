/* ===================================================================================================================================
   WORLD — Quezaltepeque, Salvador: the roadside from OpenStreetMap (23. 11. 2026), laid into the scenery of the shared circuit builder
   -----------------------------------------------------------------------------------------------------------------------------------
   Drawn within ~60 m of the circuit, as the map has them: the perimeter fences (barrier=fence: posts and two wires, no height tagged:
   1.8 m), the walls (barrier=wall: 2.0 m of rendered block with a cap), the gates (barrier=gate: the gate in the wall line, way 421750603,
   and the two on the service roads, open beside the road), the single trees (natural=tree), the picnic tables (leisure=picnic_table,
   with their benches; where the game paves the run-off inside the barrier, as at all twelve today, left out), the bleachers (leisure=bleachers: concrete terraces stepping up away from the track) and the toilets
   (amenity=toilets: a small rendered block). The service roads, dirt tracks and buildings are already in js/tracks/quezaltepeque.js.
   How: js/world-quezaltepeque.js calls this from its LK.extra (before the crowds and the trees, which keep clear of what is laid here);
   everything goes into the chunks that already exist (no draw call of its own), nothing knockable, nothing on the track or its run-off
   (skipped within 2.5 m beyond the barrier and where the builder's stands, garages and lots already stand). Driving and physics unchanged.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), 23. 11. 2026; the ids in the rows
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, { box, cyl, ico, nrGround, nrNear, rng } = API;

  // x east, z south, metres from the track's origin (the start line)
  const FENCES = [   // barrier=fence: [OSM way, x, z, x, z, ...] (the parts within 60 m of the circuit)
    [421750602, -192.4, 277.5, -218, 238.6, -239, 250.1, -263.6, 259.7, -276.8, 261.4, -301.4, 251.8, -319, 231.7, -327.8, 207.2, -327.8, 191.5, -309.3, 158.3, -284.7, 141.7, -176.3, 83, -198.7, 44],
    [421750602, -92.2, -17, -69.8, -20.5, -58.7, -22.7, -46.5, -26, -36.9, -29.4, -26.3, -33.9, 13.8, -51.4, 26.5, -59.2, 51.8, -77.1, 74.9, -96.8, 88.9, -109.9, 107.9, -81.1, 247.5, -155.1],
    [421750607, -140.7, 296.1, -132, 301.6, -80.7, 307.6, -58.4, 305.9, -47.9, 282.8, -42.7, 275.6, -36.6, 271.3, -21.2, 266.7, -3.5, 265.3, 13.6, 267, 58.8, 275.6, 66.1, 278.5, 73.3, 284.6, 93, 309.1, 243, 306.8, 313.1, 285.7, 318.1, 283.1, 320.7, 280, 321.8, 275.9, 321.6, 270.7, 302.7, 166.7, 299.5, 153.2],
    [421750608, 283.9, 191.9, 256.4, 106.8, 250.7, 94.1, 245.3, 86.9, 220.1, 66.1, 215.7, 55.7, 214.8, 50, 216.3, 43.8, 222.5, 39.1, 226.5, 37.9, 232.8, 38.2, 238.6, 39, 252.9, 42.9, 261.4, 42.6, 271, 40.7, 279.6, 36.8, 300.1, 26.3, 317.9, 23.1, 326.8, 22.2, 352, 25.5, 361.9, 27.8, 370.3, 33.8, 378.6, 41, 397.7, 43.4, 406.8, 42.2, 410.8, 40.7, 422.1, 33.3, 430.6, 26.6, 435.3, 19.3, 443, 4, 474.7, -84.2, 476.5, -92.7, 476.7, -100.8, 475.5, -108.4, 471.1, -117.6, 467.1, -122.8, 447.1, -140.8, 440.5, -148.3, 436.5, -155.2, 434.7, -163.8, 429.8, -197.7, 426.3, -212.4, 422.2, -221.7],
    [404482197, 422.2, -221.7, 406.6, -232.1, 399.8, -231.2, 377.4, -221.3, 339.9, -202, 292.6, -180, 247.5, -155.1],
  ];
  const WALLS = [   // barrier=wall
    [414892255, -363.7, 251.6, -352.4, 256.2, -320.8, 274.5, -275, 291.1, -240.8, 296.4, -222.5, 297.6],
    [421750604, -147.4, 303.5, -137.8, 307.2, -129.1, 309.1, -28.4, 314.1],
    [421750604, 35.4, 317.3, 261.9, 328.9],
    [421750606, 226.7, 339.7, 190.3, 339.3, 77.3, 333.5],
    [421750606, -49.4, 325.3, -118.8, 320.9, -121.4, 321.4, -122.3, 324.3, -121.1, 328.4, -118.4, 333.7],
  ];
  const TREES = [   // natural=tree: [OSM node, x, z]
    [4215748648, -14.6, 178.5],
    [4215748649, 166.3, 215.6],
    [4215748650, -66.9, 223.5],
    [4215748651, -86.2, 225.5],
    [4215748652, 91.3, 236.4],
    [4215748653, 88.6, 251],
    [4215748654, 93, 258.6],
    [4215748655, 99.3, 244.4],
  ];
  const TABLES = [   // leisure=picnic_table: [OSM node, x, z]
    [11386811455, 87.5, 98.7],
    [11386811456, 90.3, 93.9],
    [11386811457, 92.2, 89.5],
    [11386811458, 96, 86.7],
    [11386811459, 96.9, 90],
    [11386811460, 99, 92.6],
    [11386811461, 100.5, 87.6],
    [11386811462, 98.4, 84.8],
    [11386811463, 101, 82.4],
    [11386811464, 98.3, 79.8],
    [11386811465, 96.3, 81.8],
    [11386811466, 94.9, 78.4],
  ];
  const GATES = [   // barrier=gate on the service roads: [OSM node, x, z, the road's heading through it]
    [1543732290, -162.6, 124.1, 2.6],
    [1701012094, -47.5, 63.2, 2.64],
  ];
  const GATE_WAY = [421750603, -167.7, 301.7, -147.4, 303.5];   // barrier=gate drawn as a way: the wide gate in the wall line (node 1701012134 on it)
  const BLEACHERS = [   // leisure=bleachers: [OSM way, x, z, length, depth, heading of the length]
    [1161786564, 96.6, 112.3, 16.1, 6.1, 1.94],
    [421840936, 93.1, 62.3, 25.2, 4.2, 1.4],
    [421840937, 80.3, 15.1, 45.4, 8.4, 2.0],
  ];
  const TOILETS = [1701012071, 13.8, 43.4];
  const TABLE_ROT = 0.77;   // (the tables stand in rows along the slope)

  const GALV = [0.66, 0.67, 0.68], POSTC = [0.58, 0.59, 0.6], WALLC = [0.86, 0.84, 0.78], CAPC = [0.74, 0.72, 0.68], CONC = [0.72, 0.71, 0.68], CONCT = [0.8, 0.79, 0.76];
  const WOOD = [0.55, 0.4, 0.27], WOODT = [0.62, 0.46, 0.31], BARK = [0.4, 0.33, 0.26], LEAF = [[0.27, 0.42, 0.18], [0.23, 0.38, 0.16], [0.31, 0.45, 0.2]];
  const RENDER = [0.92, 0.9, 0.84], ROOF = [0.55, 0.57, 0.58], GATEC = [0.6, 0.62, 0.64];
  const CO = World.quezaltepequeObcestje = function (o) { return lay(o); };

  const resample = (L, step) => {
    const out = [L[0], L[1]];
    for (let q = 0; q + 3 < L.length; q += 2) {
      const ax = L[q], az = L[q + 1], bx = L[q + 2], bz = L[q + 3], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
      for (let t = 1; t <= m; t++) out.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
    }
    return out;
  };
  const chunkAt = (scen, x, z) => { const s = scen.size, i = Math.floor(x / s), j = Math.floor(z / s); return scen.map.get(i + ',' + j) || null; };

  function lay(o) {
    const st = { fences: 0, fenceM: 0, walls: 0, wallM: 0, gates: 0, trees: 0, tables: 0, bleachers: 0, toilets: 0, verts: 0 };
    if (!o || !o.scen || !o.scen.map) return st;
    const { scen, exclPush, CR } = o, excluded = o.excluded || (() => false), R = rng(5281);
    let v0 = 0; for (const g of scen.map.values()) v0 += g.P.length / 3;
    // free: off the track and its run-off, not where the builder already put something; mark: the trees and crowds keep clear
    const free = (x, z, m) => { const n = nrNear(x, z); return !(n.i >= 0 && n.dd < 2.5 + (m || 0)) && !excluded(x, z); };
    // offAsphalt: for what OSM puts on a service road or inside the run-off line (the gates): only clear of the asphalt
    const offAsphalt = (x, z, m) => { const n = nrNear(x, z); return !(n.i >= 0 && n.d < (API.T.w || 6) + 3 + (m || 0)); };
    const mark = (x, z, r) => { if (exclPush) exclPush(x, z, r); if (CR && CR.avoid) CR.avoid(x, z, r); };
    const rail = (g, a, b, y0, h, col) => {   // a thin vertical strip between two posts, both faces
      const A = [a[0], a[1] + y0, a[2]], B = [b[0], b[1] + y0, b[2]], C = [b[0], b[1] + y0 + h, b[2]], D = [a[0], a[1] + y0 + h, a[2]];
      const mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2, dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, my = (a[1] + b[1]) / 2 + y0;
      g.quadO(A, B, C, D, col, [mx + nx, my, mz + nz]); g.quadO(A, B, C, D, col, [mx - nx, my, mz - nz]);
    };
    // a line of posts with two wires (fence) or of blocks (wall), on the ground, broken where the place is not free
    const line = (L, step, fn) => { const Q = resample(L, step); let prev = null;
      for (let k = 0; k < Q.length; k += 2) { const x = Q[k], z = Q[k + 1];
        if (!free(x, z)) { prev = null; continue; }
        const p = [x, nrGround(x, z), z], g = chunkAt(scen, x, z); if (!g) { prev = null; continue; }
        fn(g, p, prev); prev = p; } };

    for (const F of FENCES) { let any = false;
      line(F.slice(1), 3.5, (g, p, prev) => {
        box(g, p[0], p[1] - 0.1, p[2], 0.07, 1.9, 0.07, 0, POSTC, POSTC, true); mark(p[0], p[2], 0.9);
        if (prev) { rail(g, prev, p, 1.72, 0.05, GALV); rail(g, prev, p, 0.95, 0.04, GALV); rail(g, prev, p, 0.12, 0.04, GALV); st.fenceM += Math.hypot(p[0] - prev[0], p[2] - prev[2]); }
        any = true; });
      if (any) st.fences++; }
    for (const W of WALLS) { let any = false;
      line(W.slice(1), 4, (g, p, prev) => {
        if (prev) { const cx = (p[0] + prev[0]) / 2, cz = (p[2] + prev[2]) / 2, l = Math.hypot(p[0] - prev[0], p[2] - prev[2]), rot = Math.atan2(p[2] - prev[2], p[0] - prev[0]), y = Math.min(p[1], prev[1]);
          box(g, cx, y - 0.3, cz, l + 0.04, 2.3, 0.22, rot, WALLC, WALLC, true); box(g, cx, y + 2.0, cz, l + 0.04, 0.08, 0.3, rot, CAPC, CAPC, true);
          mark(cx, cz, 1.4); st.wallM += l; any = true; } });
      if (any) st.walls++; }
    st.fenceM = Math.round(st.fenceM); st.wallM = Math.round(st.wallM);

    { // the wide gate in the wall line: two piers and a steel frame of bars
      const [, ax, az, bx, bz] = GATE_WAY, cx = (ax + bx) / 2, cz = (az + bz) / 2, g = chunkAt(scen, cx, cz);
      if (g && offAsphalt(cx, cz)) { const l = Math.hypot(bx - ax, bz - az), rot = Math.atan2(bz - az, bx - ax), ux = (bx - ax) / l, uz = (bz - az) / l, y = nrGround(cx, cz);
        for (const [x, z] of [[ax, az], [bx, bz]]) box(g, x, nrGround(x, z) - 0.3, z, 0.5, 2.7, 0.5, rot, WALLC, CAPC, true);
        box(g, cx, y + 1.95, cz, l - 0.5, 0.08, 0.06, rot, GATEC, GATEC); box(g, cx, y + 0.1, cz, l - 0.5, 0.08, 0.06, rot, GATEC, GATEC);
        for (let t = 0.3; t < l - 0.3; t += 0.6) { const x = ax + ux * t, z = az + uz * t; box(g, x, y + 0.1, z, 0.04, 1.85, 0.04, rot, GATEC, GATEC, true); }
        mark(cx, cz, l / 2); st.gates++; } }
    for (const [, x, z, hd] of GATES) {   // a field gate on a service road, swung open beside it
      const px = -Math.sin(hd), pz = Math.cos(hd), ux = Math.cos(hd), uz = Math.sin(hd), g = chunkAt(scen, x, z);
      if (!g || !offAsphalt(x, z)) continue;
      for (const s of [-1, 1]) { const qx = x + px * s * 2.9, qz = z + pz * s * 2.9; cyl(g, qx, nrGround(qx, qz) - 0.2, qz, 0.07, 1.6, 6, POSTC, POSTC); }
      const hx = x + px * 2.9, hz = z + pz * 2.9, y = nrGround(hx, hz), lx = hx + ux * 1.9, lz = hz + uz * 1.9;   // the leaf: 3.8 m, from the hinge post along the road
      for (const h of [0.35, 0.8, 1.2]) box(g, lx, y + h, lz, 3.8, 0.05, 0.05, hd, GATEC, GATEC);
      box(g, hx + ux * 3.75, y + 0.3, hz + uz * 3.75, 0.05, 0.95, 0.05, hd, GATEC, GATEC);
      mark(x, z, 3.5); st.gates++;
    }

    for (const [, x, z] of TREES) {   // a broadleaf tree: the trunk and a crown of three clumps
      const g = chunkAt(scen, x, z); if (!g || !free(x, z, 2)) continue;
      const y = nrGround(x, z), h = 3.2 + R() * 1.6, r = 2.4 + R() * 1.2;
      cyl(g, x, y - 0.2, z, 0.22, h + 0.4, 6, BARK, BARK, 0.15);
      ico(g, x, y + h + r * 0.55, z, r, 0.75, LEAF[Math.floor(R() * 3)], R, 0.18);
      for (let k = 0; k < 2; k++) { const a = R() * 6.283; ico(g, x + Math.cos(a) * r * 0.6, y + h + r * 0.25, z + Math.sin(a) * r * 0.6, r * 0.65, 0.75, LEAF[Math.floor(R() * 3)], R, 0.2); }
      mark(x, z, r + 0.5); st.trees++;
    }
    for (const [, x, z] of TABLES) {   // a picnic table with two benches
      const g = chunkAt(scen, x, z); if (!g || !free(x, z)) continue;   // (in the game's paved run-off inside the barrier: left out)
      const y = nrGround(x, z), c = Math.cos(TABLE_ROT), s = Math.sin(TABLE_ROT), at = (a, b) => [x + a * c - b * s, z + a * s + b * c];
      box(g, x, y + 0.72, z, 1.8, 0.05, 0.75, TABLE_ROT, WOOD, WOODT);
      for (const a of [-0.7, 0.7]) box(g, at(a, 0)[0], y, at(a, 0)[1], 0.08, 0.72, 0.6, TABLE_ROT, WOOD, WOOD, true);
      for (const b of [-0.65, 0.65]) { const [bx, bz] = at(0, b); box(g, bx, y + 0.42, bz, 1.8, 0.04, 0.26, TABLE_ROT, WOOD, WOODT); for (const a of [-0.7, 0.7]) { const [lx, lz] = at(a, b); box(g, lx, y, lz, 0.06, 0.42, 0.2, TABLE_ROT, WOOD, WOOD, true); } }
      mark(x, z, 1.6); st.tables++;
    }
    for (const [, x, z, L, W, rot] of BLEACHERS) {   // concrete terraces: 0.8 m deep, 0.4 m higher each, the lowest row on the track's side
      const g = chunkAt(scen, x, z); if (!g || !free(x, z)) continue;
      const c = Math.cos(rot), s = Math.sin(rot), nx = -s, nz = c, n = nrNear(x, z), sd = n.i >= 0 && ((x + nx - API.T.px[n.i]) ** 2 + (z + nz - API.T.pz[n.i]) ** 2) < ((x - nx - API.T.px[n.i]) ** 2 + (z - nz - API.T.pz[n.i]) ** 2) ? -1 : 1;
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      const rows = Math.max(2, Math.min(10, Math.floor(W / 0.8)));
      for (let k = 0; k < rows; k++) { const off = sd * (-W / 2 + (k + 0.5) * W / rows);
        box(g, x + nx * off, y - 0.3, z + nz * off, L, 0.3 + 0.4 * (k + 1), W / rows + 0.02, rot, CONC, CONCT, true); }
      mark(x, z, Math.hypot(L, W) / 2 + 1); st.bleachers++;
    }
    { const [, x, z] = TOILETS, g = chunkAt(scen, x, z);   // a small rendered block with a sheet roof
      if (g && free(x, z)) { const y = nrGround(x, z), hd = (() => { const n = nrNear(x, z); return n.i >= 0 ? Math.atan2(API.T.tz[n.i], API.T.tx[n.i]) : 0; })();
        box(g, x, y - 0.3, z, 3.2, 2.9, 2.2, hd, RENDER, RENDER, true); box(g, x, y + 2.6, z, 3.5, 0.1, 2.5, hd, ROOF, ROOF);
        mark(x, z, 3); st.toilets = 1; } }

    for (const g of scen.map.values()) st.verts += g.P.length / 3; st.verts -= v0;
    CO.stats = st;
    return st;
  }
})();
