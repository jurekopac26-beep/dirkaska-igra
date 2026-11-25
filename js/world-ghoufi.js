/* =========================================================================
   WORLD — Ghoufi, Alžirija (theme 'ghoufi'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra. Made by tools/nova-proga.mjs (the style from tools/predogled/proge.json).
   The road runs along the rim of the canyon, the canyon on its left all the way, 70-80 m deep (Copernicus DEM). Its own things, all within
   about 60 m of the road (the chase camera's band):
   - the old stone village on the canyon's wall below the road (s 290-560, about 20-67 % of the track, closest round the viewpoint at about 43 %):
     cubic houses of ochre stone stacked down the slope, flat roofs with a low lip, dark doorways and windows, some of them roofless ruins;
   - the river Oued Labiod on the canyon's floor (OSM way 335697911, width 60 m): a gravel bed and its water laid on the terrain (never digging it),
     on the terrain's lowest line near the OSM line (the DEM smooths the canyon: the OSM line lies on its slope in the game);
   - the palms of the oasis on the canyon's floor (the orchard of OpenStreetMap, way 520836757, and along the river's bed);
   - the viewpoint (OSM node 3135560243): a small paved terrace on the rim, a low stone parapet round its canyon side, two stone benches.
   No signs, inscriptions, statues or ornaments. The guardrails of the shared builder (S.rails) and the barrier line keep the cars on the road.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  const STONE = [0.64, 0.5, 0.36], STONE2 = [0.55, 0.43, 0.31], STONE3 = [0.7, 0.58, 0.44], ROOF = [0.58, 0.47, 0.35], DARK = [0.12, 0.09, 0.07], DARK2 = [0.27, 0.21, 0.16], PAVE = [0.7, 0.64, 0.54];
  const TRUNK = [0.42, 0.34, 0.25], TRUNK2 = [0.33, 0.27, 0.2], FROND = [0.3, 0.42, 0.17], FROND2 = [0.42, 0.5, 0.2], DEAD = [0.55, 0.47, 0.3];
  const VX = 52.8, VZ = 241.7;   // (the viewpoint, in the track's metres: x east, z south)
  // the oasis on the canyon's floor (OSM: the orchard's outline near the road and the river's line)
  const ORCH = [[269.7, 245.6], [220.8, 197.7], [201.3, 142], [205.2, 75.5], [233.6, 62.8], [267.8, 71.6], [263.9, 20.8], [225.7, 11], [174.9, 23.7], [163.2, 38.6],
    [129.9, 32], [114.3, 69.7], [130.9, 94.1], [160.2, 166], [181.7, 234.9], [195.9, 295], [208.6, 319.5]];
  const RIVER = [[233.2, -25.2], [203.9, -21.2], [168.2, -25.2], [148.1, -1.7], [133.9, 9.3], [107.1, 30.1], [93.4, 85.3], [89.5, 124.9], [118.8, 165.7], [131.5, 198.2],
    [141.5, 248.8], [154.5, 268.9], [185.3, 282.1], [200.7, 310.2], [200.4, 346.6], [8.3, 459.8], [-126.6, 398.2], [-199, 400.2], [-277.1, 456]];

  // a house of the old village on the slope: a box from below the ground at its lowest corner to a little over its highest one (the houses step
  // down the wall, each roof under the next one up), a low lip round its flat earthen roof; a ruin roofless: its dark inside within the lip.
  // Dark openings on the three sides that are not against the slope (the frame's v > 0: down the slope)
  function house(g, x, z, w, d, rot, hTop, col, ruin, R, gH) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (u, v) => [x + u * c - v * s, z + u * s + v * c], { box } = World.api;
    let lo = 1e9, hi = -1e9; for (const [u, v] of [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]) { const [px, pz] = P(u, v), y = gH(px, pz); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    const y0 = lo - 1.2, y1 = hi + hTop, lip = ruin ? 0.9 + R() * 0.8 : 0.4, top = ruin ? y1 - lip + 0.25 : y1;
    box(g, x, y0, z, w, top - y0, d, rot, col, ruin ? DARK2 : ROOF, true);
    const lc = ruin ? col : STONE3;
    for (const [u, v, L, rr] of [[0, -d / 2 + 0.17, w, 0], [0, d / 2 - 0.17, w, 0], [-w / 2 + 0.17, 0, d - 0.7, Math.PI / 2], [w / 2 - 0.17, 0, d - 0.7, Math.PI / 2]]) {
      const [px, pz] = P(u, v), yb = ruin ? top - 0.2 : y1 - 0.05; box(g, px, yb, pz, L, (ruin ? y1 - (R() < 0.4 ? R() * lip * 0.7 : 0) : y1 + lip) - yb, 0.34, rot + rr, lc, ruin ? STONE2 : STONE3, true); }
    // the openings: a doorway and a window on the side down the slope, now and then a window on an end
    const inn = [x, (y0 + y1) / 2, z];
    const hole = (u, v, nu, nv, wd, yb, ht) => { const [ax, az] = P(u - nv * wd / 2, v + nu * wd / 2), [bx, bz] = P(u + nv * wd / 2, v - nu * wd / 2);
      const ox = (nu * c - nv * s) * 0.03, oz = (nu * s + nv * c) * 0.03;
      g.quadO([ax + ox, yb, az + oz], [bx + ox, yb, bz + oz], [bx + ox, yb + ht, bz + oz], [ax + ox, yb + ht, az + oz], DARK, inn); };
    const [fx, fz] = P(0, d / 2), yf = Math.max(y0 + 0.4, gH(fx, fz) - 0.2);
    if (yf + 2.3 < y1) hole(R() < 0.5 ? -w * 0.2 : w * 0.2, d / 2, 0, 1, 1, yf, 1.9);
    if (yf + 3.6 < y1) hole(R() < 0.5 ? w * 0.24 : -w * 0.26, d / 2, 0, 1, 0.7, yf + 2.6, 0.8);
    for (const sd of [-1, 1]) if (R() < 0.5) { const [ex, ez] = P(sd * w / 2, d * 0.1), ye = gH(ex, ez) + 0.7; if (ye + 1.2 < y1) hole(sd * w / 2, d * 0.1, sd, 0, 0.6, ye, 0.8); }
  }

  // a date palm: a leaning trunk (5 sides, darker at its foot), a crown of 8 arching fronds (each a creased blade, lit from above), a few dead ones hanging
  function palm(g, x, y, z, h, R) {
    const lean = R() * 0.12, la = R() * Math.PI * 2, tx = x + Math.cos(la) * lean * h, tz = z + Math.sin(la) * lean * h, ty = y + h, n = 5, r0 = 0.32, r1 = 0.22;
    for (let k = 0; k < n; k++) {
      const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2;
      const b0 = [x + Math.cos(a0) * r0, y - 0.3, z + Math.sin(a0) * r0], b1 = [x + Math.cos(a1) * r0, y - 0.3, z + Math.sin(a1) * r0];
      const t0 = [tx + Math.cos(a0) * r1, ty, tz + Math.sin(a0) * r1], t1 = [tx + Math.cos(a1) * r1, ty, tz + Math.sin(a1) * r1];
      g.quadO(b0, b1, t1, t0, TRUNK, [(x + tx) / 2, y + h / 2, (z + tz) / 2], null, [TRUNK2, TRUNK2, TRUNK, TRUNK]);
    }
    const top = [tx, ty + 0.3, tz], nf = 8, a00 = R() * Math.PI;
    for (let k = 0; k < nf; k++) {
      const a = a00 + k / nf * Math.PI * 2 + (R() - 0.5) * 0.4, L = h * (0.42 + R() * 0.12), ca = Math.cos(a), sa = Math.sin(a), wx = -sa * 0.55, wz = ca * 0.55;
      const mid = [tx + ca * L * 0.55, ty + 0.9 + R() * 0.4, tz + sa * L * 0.55], tip = [tx + ca * L, ty - 0.6 - R() * 0.8, tz + sa * L];
      const col = R() < 0.4 ? FROND2 : FROND, below = [mid[0], mid[1] - 3, mid[2]];
      g.triO(top, [mid[0] + wx, mid[1] - 0.25, mid[2] + wz], mid, col, below, col, col);
      g.triO(top, mid, [mid[0] - wx, mid[1] - 0.25, mid[2] - wz], col, below, col, col);
      g.triO(mid, [mid[0] + wx, mid[1] - 0.25, mid[2] + wz], tip, col, below, col, col);
      g.triO(mid, tip, [mid[0] - wx, mid[1] - 0.25, mid[2] - wz], col, below, col, col);
    }
    for (let k = 0; k < 2; k++) { const a = R() * Math.PI * 2, ca = Math.cos(a) * 0.5, sa = Math.sin(a) * 0.5;   // (the dead fronds, hanging down the trunk)
      g.quadO([tx + ca - sa * 0.3, ty, tz + sa + ca * 0.3], [tx + ca + sa * 0.3, ty, tz + sa - ca * 0.3], [tx + ca * 2 + sa * 0.2, ty - 2.2, tz + sa * 2 - ca * 0.2], [tx + ca * 2 - sa * 0.2, ty - 2.2, tz + sa * 2 + ca * 0.2], DEAD, [tx, ty - 1, tz]); }
  }

  const inPoly = (x, z, P) => { let a = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) a = !a; return a; };

  /* THE RIVER (OSM way 335697911: waterway=river, width=60, the Oued Labiod), drawn on the game's terrain, never digging it. Copernicus GLO-30
     smooths the steep canyon: near the road the OSM line lies on the slope, the terrain's floor 60-100 m off it. So the river follows the lowest line
     of the terrain across the canyon near the OSM line (every 5 m the lowest ground within 120 m across, a small cost for the distance from the line;
     a median, then smoothed over ~60 m), on the floor: the ground within 3.5 m of its lowest, at most the OSM width (60 m). On it a gravel bed and
     the water, both laid on the terrain. ESA WorldCover 2021 (10 m) has no water on the canyon's floor (crops, grass and some bare ground along the
     OSM line, the oasis): the water is narrower than its cells, so it is a stream (WATER_W) in a gravel bed (BED_W) about the floor's lowest line,
     the orchard's palms beside it (an approximation: no source gives these widths). BED_W 0 and WATER_W 0: the water over the whole floor, the
     OSM width (decision a/b, PR). */
  const WATER_W = 8, BED_W = 20, BED_UP = 0.25, WATER_UP = 0.45, GRAVEL = [0.66, 0.62, 0.55], SHAL = [0.3, 0.38, 0.36], DEEP = [0.1, 0.2, 0.26];
  let RL = null;   // this build's river (made in keepOut, before the trees; drawn in extra): rows { x, z, nx, nz, a, b } (the floor from a to b across)
  function riverLayout() {
    const A = World.api, gH = A.vrGround, P = [];
    for (let i = 0; i + 1 < RIVER.length; i++) { const [ax, az] = RIVER[i], [bx, bz] = RIVER[i + 1], n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 5));
      for (let k = 0; k < n; k++) P.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); }
    P.push(RIVER[RIVER.length - 1]);
    const nrm = (Q, k, r) => { const a = Q[Math.max(0, k - r)], b = Q[Math.min(Q.length - 1, k + r)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1; return [-tz / l, tx / l]; };
    const avg = (V, r) => V.map((_, k) => { let s = 0, n = 0; for (let j = Math.max(0, k - r); j <= Math.min(V.length - 1, k + r); j++) { s += V[j]; n++; } return s / n; });
    let O = P.map((p, k) => { const [nx, nz] = nrm(P, k, 3); let bo = 0, bc = 1e9;
      for (let o = -120; o <= 120; o += 2.5) { const c = gH(p[0] + nx * o, p[1] + nz * o) + 0.06 * Math.abs(o); if (c < bc) { bc = c; bo = o; } } return bo; });
    O = O.map((_, k) => { const w = O.slice(Math.max(0, k - 4), k + 5).sort((a, b) => a - b); return w[w.length >> 1]; });
    for (let r = 0; r < 3; r++) O = avg(O, 6);
    let C = P.map((p, k) => { const [nx, nz] = nrm(P, k, 3); return [p[0] + nx * O[k], p[1] + nz * O[k]]; });
    for (let r = 0; r < 2; r++) { const X = avg(C.map(c => c[0]), 3), Z = avg(C.map(c => c[1]), 3); C = X.map((x, k) => [x, Z[k]]); }
    const L = [C[0]]; let acc = 0;   // (the line again every 5 m)
    for (let k = 1; k < C.length; k++) { const [ax, az] = C[k - 1], [bx, bz] = C[k], d = Math.hypot(bx - ax, bz - az);
      for (let t = 5 - acc; t <= d; t += 5) L.push([ax + (bx - ax) * t / d, az + (bz - az) * t / d]); acc = (acc + d) % 5; }
    const rows = L.map((p, k) => { const [nx, nz] = nrm(L, k, 2), g = (o) => gH(p[0] + nx * o, p[1] + nz * o); let lo = 1e9;
      for (let o = -9; o <= 9; o += 3) lo = Math.min(lo, g(o));
      let a = -3, b = 3; while (a > -30 && g(a - 3) < lo + 3.5) a -= 3; while (b < 30 && g(b + 3) < lo + 3.5) b += 3;
      return { x: p[0], z: p[1], nx, nz, a, b }; });
    const As = avg(avg(rows.map(r => r.a), 3), 3), Bs = avg(avg(rows.map(r => r.b), 3), 3);
    const h = BED_W ? BED_W / 2 : 1e9;
    rows.forEach((r, k) => { r.a = Math.min(Math.max(As[k], -h), -4); r.b = Math.max(Math.min(Bs[k], h), 4); });
    return rows;
  }
  // how far (x, z) is out of the river's bed (negative: in it), from the nearest row
  const bedOut = (x, z) => { let e = 1e9; for (const r of RL) { const m = (r.a + r.b) / 2, d = Math.hypot(x - r.x - r.nx * m, z - r.z - r.nz * m) - (r.b - r.a) / 2; if (d < e) e = d; } return e; };
  function keepOut(push) {
    RL = riverLayout();
    for (let k = 0; k < RL.length; k += 2) { const r = RL[k], m = (r.a + r.b) / 2; push(r.x + r.nx * m, r.z + r.nz * m, (r.b - r.a) / 2 + 3); }
  }
  function river(ctx, tex) {
    const { root, out, P } = ctx, A = World.api, gH = A.vrGround, n = RL.length, TL = A.VRC * A.VRT;
    // only over the full terrain tiles (5 m cells: vrGround is exactly their surface; the coarse ring's 10 m cells would cover the ribbon)
    const full = (x, z) => A.vrTileOn(Math.floor((x - P.G.x0) / TL), Math.floor((z - P.G.z0) / TL)) === 1;
    const near = RL.map(r => [r.a - 5, r.b + 5].every(o => full(r.x + r.nx * o, r.z + r.nz * o)) && full(r.x + r.nx * (r.a + r.b) / 2, r.z + r.nz * (r.a + r.b) / 2));
    const jit = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s) - 0.5; };
    const strip = (g, cols, up, col, uvS) => {   // a ribbon over the rows: cols(r) the offsets across, col(r, j, x, z) the colour
      const row = (r) => cols(r).map((o, j) => { const x = r.x + r.nx * o, z = r.z + r.nz * o; return { p: [x, gH(x, z) + up, z], c: col(r, j, x, z), u: [x / uvS, -z / uvS] }; });
      let P0 = row(RL[0]);
      for (let k = 1; k < n; k++) { const P1 = row(RL[k]);
        if (near[k] && near[k - 1]) for (let j = 0; j + 1 < P0.length; j++) g.quadUp(P0[j].p, P0[j + 1].p, P1[j + 1].p, P1[j].p, [P0[j].c, P0[j + 1].c, P1[j + 1].c, P1[j].c], [P0[j].u, P0[j + 1].u, P1[j + 1].u, P1[j].u]);
        P0 = P1; }
    };
    const NB = 10, add = (g, mat) => { if (g.empty) return 0; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); return 1; };
    // the bed: gravel (BED_W about the lowest line, at most the floor), its outer 5 m blending into the terrain's own colour
    const bed = new A.GB(true);
    strip(bed, (r) => [r.a - 5].concat(Array.from({ length: NB + 1 }, (_, j) => r.a + (r.b - r.a) * j / NB), [r.b + 5]), BED_UP,
      (r, j, x, z) => j === 0 || j === NB + 2 ? ctx.gColAt(x, z) : GRAVEL.map(v => v + jit(x, z) * 0.08), 10);
    // the water: the whole bed (WATER_W 0) or WATER_W metres in its middle; shallow at its edges, deeper inside
    const wat = new A.GB(true), wa = (r) => WATER_W ? Math.min(WATER_W, r.b - r.a - 2) : r.b - r.a - 2;
    strip(wat, (r) => { const m = (r.a + r.b) / 2, h = wa(r) / 2; return Array.from({ length: NB + 1 }, (_, j) => m - h + 2 * h * j / NB); }, WATER_UP,
      (r, j) => { const t = Math.min(1, Math.min(j, NB - j) / (WATER_W ? 3 : 2)); return [0, 1, 2].map(i => SHAL[i] + (DEEP[i] - SHAL[i]) * t); }, 14);
    const off = (f) => ({ polygonOffset: true, polygonOffsetFactor: f, polygonOffsetUnits: f * 2 });
    const nm = add(bed, new THREE.MeshLambertMaterial(Object.assign({ map: A.vrGritTex(), vertexColors: true }, off(-2))))
      + add(wat, new THREE.MeshPhongMaterial(Object.assign({ map: tex.water, vertexColors: true, shininess: 50, specular: 0x24303a }, off(-4))));
    if (!wat.empty) out.dyn.water = tex.water;
    return nm;
  }

  /* THE LANDMARK, one replaceable function (decision 15. 11. 2026, docs/odlocitve.md, PR #701: the main landmark will come from Blender as a .glb in
     assets/landmarks/): the old stone village on the canyon's wall. To swap it, replace this function's body with the model's placement; it returns the
     footprints it took ([x, z, r]) and keeps the scenery out of them with exclPush. Called first in extra (the random draws of the rest follow it). */
  function landmark(ctx, roadAt) {
    const { scen, R, exclPush } = ctx, A = World.api, T = A.T, gH = A.vrGround;
    /* the village: spots on the canyon's side of the road, 24-62 m out, 6-48 m under the road, on the wall (steep), clustered round the viewpoint */
    const S0 = T.startS + 115, S1 = T.startS + 385, placed = [];
    for (let s = S0; s < S1; s += 3.5) {
      const i = T.idx(s), dv = Math.hypot(T.px[i] - VX, T.pz[i] - VZ), dens = dv < 70 ? 0.9 : dv < 140 ? 0.6 : 0.35;
      for (const side of [-1, 1]) for (let d = 22 + R() * 4; d < 62; d += 4.5 + R() * 2.5) {
        if (R() > dens) continue;
        const x = T.px[i] + T.nx[i] * side * d + (R() - 0.5) * 3, z = T.pz[i] + T.nz[i] * side * d + (R() - 0.5) * 3, [rd, ry] = roadAt(x, z), g0 = gH(x, z);
        if (rd < 19 || g0 > ry - 5 || g0 < ry - 50 || A.vrSlope(x, z) < 0.4) continue;
        const w = 3.4 + R() * 2.6, dd = 3.2 + R() * 2;
        if (placed.some(p => Math.hypot(p[0] - x, p[1] - z) < p[2] + Math.max(w, dd) * 0.5 + 0.4)) continue;
        // the house faces down the slope: its frame's v along the fall of the ground
        const gx = gH(x + 2, z) - gH(x - 2, z), gz = gH(x, z + 2) - gH(x, z - 2), ang = Math.atan2(-gz, -gx), k = R(), j = (R() - 0.5) * 0.06;
        const col = (k < 0.45 ? STONE : k < 0.8 ? STONE2 : STONE3).map(v => v + j);
        house(scen.get(x, z), x, z, w, dd, ang - Math.PI / 2, 0.8 + R() * 1.8, col, R() < 0.4, R, gH);
        placed.push([x, z, Math.max(w, dd) * 0.5]); exclPush(x, z, Math.max(w, dd) * 0.75);
      }
    }
    return placed;
  }

  function extra(ctx, tex) {
    const { scen, R, exclPush } = ctx, A = World.api, T = A.T, gH = A.vrGround;
    // the road's height and distance near (x, z): the nearest of the track's samples
    const roadAt = (x, z) => { let bd = 1e9, bi = 0; for (let i = 0; i < T.N; i += 2) { const d = Math.hypot(T.px[i] - x, T.pz[i] - z); if (d < bd) { bd = d; bi = i; } } return [bd, T.hy[bi], bi]; };

    const placed = landmark(ctx, roadAt);

    const nRiver = RL ? river(ctx, tex) : 0;

    /* the palms of the oasis: on the canyon's floor (over 50 m under the road), in the orchard or along the river's bed (not in it), within about
       150 m of the road */
    let np = 0;
    for (let k = 0; k < 2600 && np < 260; k++) {
      const x = -260 + R() * 520, z = -40 + R() * 520;
      const inO = inPoly(x, z, ORCH), dr = RL ? bedOut(x, z) : 1e9; if ((!inO && dr > 20) || dr < 2) continue;
      const [rd, ry] = roadAt(x, z); if (rd > 150 || rd < 30) continue;
      const y = gH(x, z); if (y > ry - 45) continue;
      palm(scen.get(x, z), x, y, z, 7 + R() * 7, R); np++;
    }

    /* the viewpoint: a paved terrace on the rim, its parapet on the canyon's side, two stone benches */
    {
      const [, ry, bi] = roadAt(VX, VZ), { box } = A, g = scen.get(VX, VZ), y = Math.max(gH(VX, VZ), ry - 1.2) + 0.05;
      // the canyon's side: away from the road's sample
      const ax = VX - T.px[bi], az = VZ - T.pz[bi], al = Math.hypot(ax, az) || 1, ox = ax / al, oz = az / al, rot = Math.atan2(oz, ox) + Math.PI / 2;
      box(g, VX, y - 3, VZ, 11, 3, 6.5, rot, STONE2, PAVE, true);
      for (const [u, v, L, rr] of [[0, 3.05, 11, 0], [-5.3, 0, 6.1, Math.PI / 2], [5.3, 0, 6.1, Math.PI / 2]]) {
        const c = Math.cos(rot), s = Math.sin(rot); box(g, VX + u * c - v * s, y, VZ + u * s + v * c, L, 0.85, 0.5, rot + rr, STONE, STONE3, true); }
      for (const u of [-2.8, 2.8]) { const c = Math.cos(rot), s = Math.sin(rot); box(g, VX + u * c - 1 * s, y, VZ + u * s + 1 * c, 1.8, 0.45, 0.5, rot, STONE2, STONE3, true); }
      exclPush(VX, VZ, 10);
    }
    ctx.out.ghoufi = { houses: placed.length, palms: np, river: RL ? RL.length : 0, riverMeshes: nRiver };
    if (World.ext.goreRob) World.ext.goreRob(ctx, 'ghoufi');   // (the roadside ground from the chase camera: js/world-chase-bt11.js)
  }

  World.ext.ghoufi = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1717, snow: 'none',
    road: { line: 'none' },
    ground: { grass: [0.62, 0.52, 0.37], forest: [0.46, 0.42, 0.3], shrub: [0.52, 0.47, 0.33], built: [0.6, 0.53, 0.42], rock: [0.66, 0.53, 0.39], dry: [0.72, 0.62, 0.46] },
    trees: { kinds: ['broad'], forest: 0.015 },
    skiers: 0, nets: false, snowbanks: false,
    animals: [],
    fans: 0.3,
    keepOut,
    extra: (ctx) => extra(ctx, tex),
  });
})();
