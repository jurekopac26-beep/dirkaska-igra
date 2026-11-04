/* =========================================================================
   WORLD — Hakone (theme 'hakone'): its own builder (World.ext.hakone). What it uses of World comes from World.api: the helpers bound here
   once, the state that changes as API.<name>, the track being built and its theme (LOD, T) copied in at each build. Its scenery data is
   js/data/hakone.js (HK_DATA; the script that made it is in the repository's history, docs/proga-hakone.md).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, clamp, cone, crowdCtx, crowdFinish, crowdRun, cyl, gable, ico, lerp, ouCutMat, pkGroundMat,
    rng, rpHash, sstep, starCone, vary, vrDist, vrGH, vrGritTex, vrGround, vrLCf, vrNear, vrPrep, vrSlope, vrWater
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= HAKONE (theme 'hakone') =================
     One lap of the public roads round Hakone (Japan, docs/proga-hakone.md): national road 1 up from Yumoto past Miyanoshita and Kowakidani to
     its top (874 m) and down to Moto-Hakone, the old Tōkaidō (road 732) through the Seven Bends and Hatajuku back to Yumoto. A closed lap on
     Vršič's corridor helpers (vrPrep and the rest: the real terrain round the road from def.dem, the land cover def.lc), as the Irohazaka's, its
     corridor narrower (the rule of 60 m: the camera behind the car sees ~60 m round the road, ~110 m ahead held upright): the terrain's tiles
     out to ~280 m, the detailed things only within ~60 m of the road (HK_DATA: OpenStreetMap's buildings, railway, stone paving and torii, the
     canopy model's trees). The old spa towns (Yumoto, Tōnosawa, Miyanoshita, Kowakidani, Moto-Hakone, Hatajuku): houses with tiled roofs,
     hotels, shrines, utility poles with their wires; the mountain railway (its bed, rails and overhead line, its bridges, the one over the road
     at Deyama, the level crossing at Kowakidani, the stations' platforms) with hydrangeas along it; the forest (cedars, broadleaves, maples,
     bamboo by the villages), the cedar avenue along the old road, the old road's stones, the torii at Hatajuku, Lake Shōjin and Otama-ga-ike by
     the road, spectators, the start in Yumoto. Beyond the corridor only the terrain: the view (hkFar: the caldera, Lake Ashi with its red gate
     in the water and its sightseeing boats, the sea to the east and Mount Fuji, def.fuji: 'real' hidden by every ridge in front of it as it
     really is, else over the far ridges, hidden only by the corridor's own terrain and trees) drawn behind everything. Only the places' names
     anywhere, no firms, brands or the railway's operator. */
  const HKC = [0, 0, 0];
  let HKS = true;   // (the build's season: summer, else autumn's colours; winter: the autumn look, the render's season code snows it over)
  let HKD = null;   // (HK_DATA decoded once)
  function hkData() {
    if (HKD) return HKD;
    const D = typeof HK_DATA !== 'undefined' ? HK_DATA : null; if (!D) return null;
    const b = atob(D.trees), n = D.nTrees, tx = new Float32Array(n), tz = new Float32Array(n), th = new Float32Array(n);
    for (let k = 0, p = 0; k < n; k++, p += 5) {
      tx[k] = D.tx0 + (((b.charCodeAt(p) << 8) | b.charCodeAt(p + 1)) << 16 >> 16) * 0.5; tz[k] = D.tz0 + (((b.charCodeAt(p + 2) << 8) | b.charCodeAt(p + 3)) << 16 >> 16) * 0.5;
      th[k] = b.charCodeAt(p + 4) / 4; }
    return (HKD = { D, tx, tz, th, n });
  }
  function hkLC(rle, n) {   // a run-length coded land cover (js/world-vrsic.js vrPrep's code) into one class a node
    const dg = new Int8Array(128), A = API.NR_A64; for (let k = 0; k < 64; k++) dg[A.charCodeAt(k)] = k;
    const lc = new Uint8Array(n);
    for (let p = 0, k = 0; k < n && p < rle.length;) { const s = dg[rle.charCodeAt(p++)]; let m = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = dg[rle.charCodeAt(p++)]; m += e; } while (e === 63 && p < rle.length); } lc.fill(s >> 3, k, Math.min(n, k + m)); k += m; }
    return lc;
  }

  /* ---- the ground's colours (times the grey grit map): early summer's fresh grass (in patches drier or lusher), in autumn straw and pampas gold; under the forest by the road
     its dark floor of ferns and sasa, farther out the canopy seen from above (mottled deep greens; autumn's reds and golds); sasa on the scrub,
     grey yards between the villages' gardens, grey-brown andesite and soil on the steep faces and the bare rock, the lakes' beds, a mown verge ---- */
  function hkCol(x, z, h, ny, dd) {
    const P = API.VR, m = P.n3(x, z), q = P.n4(x, z), su = HKS;
    const fo = vrLCf(x, z, 1), sc = vrLCf(x, z, 2), se = vrLCf(x, z, 3), rk = vrLCf(x, z, 4), wa = vrLCf(x, z, 5);
    let r, g, b;
    if (su) { r = 0.3 + (m - 0.5) * 0.1 + (q - 0.5) * 0.07; g = 0.42 + (m - 0.5) * 0.09 + (q - 0.5) * 0.05; b = 0.16 + (m - 0.5) * 0.04;
      const dry = sstep(0.56, 0.82, P.n5(x * 0.55, z * 0.55)), lush = sstep(0.55, 0.8, P.n7(x * 0.7, z * 0.7));   // (patches of drier, yellower grass and of lusher, darker: the meadows not one green)
      r += dry * 0.07 - lush * 0.05; g += dry * 0.035 - lush * 0.045; b -= lush * 0.025; }
    else { r = 0.62 + (m - 0.5) * 0.12 + (q - 0.5) * 0.08; g = 0.52 + (m - 0.5) * 0.1; b = 0.27 + (m - 0.5) * 0.05; }
    if (fo > 0) {
      const cn = Math.max(sstep(2.5, 15, dd), sstep(13, 34, vrDist(x, z))), t = P.n6(x, z);   // (the canopy from a little past the barrier line: under it the trees stand close)
      let fr = su ? 0.16 + m * 0.05 : 0.36 + m * 0.08, fg = su ? 0.21 + m * 0.05 : 0.28 + m * 0.05, fb = su ? 0.1 : 0.13;
      if (cn > 0) {
        let cr, cg, cb;
        if (su) { cr = 0.08 + 0.06 * t + 0.03 * q; cg = 0.17 + 0.09 * t + 0.05 * q; cb = 0.07 + 0.035 * t; }
        else { const red = sstep(0.56, 0.8, P.n7(x * 1.3, z * 1.3)), gold = sstep(0.5, 0.76, P.n5(x * 2, z * 2)) * 0.7;
          cr = lerp(lerp(0.2 + 0.08 * t, 0.62 + 0.1 * t, gold), 0.6 + 0.1 * t, red); cg = lerp(lerp(0.27 + 0.08 * t, 0.46 + 0.08 * t, gold), 0.2 + 0.06 * t, red); cb = 0.1; }
        fr = lerp(fr, cr, cn); fg = lerp(fg, cg, cn); fb = lerp(fb, cb, cn);
      }
      r = lerp(r, fr, fo); g = lerp(g, fg, fo); b = lerp(b, fb, fo);
    }
    r = lerp(r, 0.26 + m * 0.05, sc * 0.85); g = lerp(g, 0.4 + m * 0.05, sc * 0.85); b = lerp(b, 0.13, sc * 0.85);
    if (se > 0) { const gs = sstep(0.4, 0.7, P.n2(x * 1.5, z * 1.5)); r = lerp(r, lerp(0.56, 0.36, gs), se * 0.75); g = lerp(g, lerp(0.55, 0.48, gs), se * 0.75); b = lerp(b, lerp(0.51, 0.22, gs), se * 0.75); }
    const st = Math.max(rk * 0.9, sstep(0.78, 0.55, ny) * 0.9); r = lerp(r, 0.47 + m * 0.06, st); g = lerp(g, 0.43 + m * 0.05, st); b = lerp(b, 0.37 + m * 0.05, st);
    r = lerp(r, 0.2, wa); g = lerp(g, 0.29, wa); b = lerp(b, 0.33, wa);   // (the water: Lake Ashi's surface in the corridor is the ground itself, levelled, hkFix)
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.45; r = lerp(r, su ? 0.4 : 0.5, t); g = lerp(g, su ? 0.5 : 0.47, t); b = lerp(b, su ? 0.24 : 0.3, t); }
    HKC[0] = r; HKC[1] = g; HKC[2] = b; return HKC;
  }
  function hkGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in hkTileGeo)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = vrGH(ii, jj);
      const nx = (vrGH(ii + 1, jj) - vrGH(ii - 1, jj)) / (2 * VRC), nz = (vrGH(ii, jj + 1) - vrGH(ii, jj - 1)) / (2 * VRC), c = hkCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / Math.hypot(nx, 1, nz), G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  /* ---- the terrain's tiles (the corridor narrower than Vršič's: the camera behind the car never sees past ~200 m, held upright ~290 m): full
     ones (5 m cells) out to 190 m from the road, coarse ones (10 m cells) to 340 m (the far view's hole: 300 m) ---- */
  const HK_FULL = 190, HK_COARSE = 340;
  function hkTileOn(ti, tj) { const G = API.VR.G, L = VRC * VRT, d = vrDist(G.x0 + (ti + 0.5) * L, G.z0 + (tj + 0.5) * L); return d < HK_FULL ? 1 : d < HK_COARSE ? 2 : 0; }
  function hkTileGeo(ti, tj, st) {   // one 100 m tile (every st-th grid vertex), as vrTileGeo with Hakone's colours
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = vrGH(i, j);
      let nx = -(vrGH(i + st, j) - vrGH(i - st, j)) / (2 * VRC * st), nz = -(vrGH(i, j + st) - vrGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = hkCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // an edge shared with a coarse tile: the fine tile's in-between vertices onto the coarse one's straight line (no cracks)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? hkTileOn(a, b) : 0);
      const fix = (k0, dk) => { for (let q = 1; q < m; q += 2) { const a = k0 + (q - 1) * dk, b = k0 + (q + 1) * dk; pos[(k0 + q * dk) * 3 + 1] = (pos[a * 3 + 1] + pos[b * 3 + 1]) / 2; } };
      if (nb(ti, tj - 1) === 2) fix(0, 1); if (nb(ti, tj + 1) === 2) fix(m * n, 1); if (nb(ti - 1, tj) === 2) fix(0, n); if (nb(ti + 1, tj) === 2) fix(m, n);
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('steep', new THREE.BufferAttribute(stp, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }

  /* ---- the railway's bed in the ground (VR.hfix, js/world-vrsic.js vrH): along every stretch on the ground the land levelled to the bed (a bench
     2.6 m either side of the track, back to the land 8 m farther out: the embankments and cuttings), never inside the road's own levelling ---- */
  let HKR = null;   // { cells: Map of 16 m cells -> [segment] (on the ground), all: the same of every stretch out of the tunnels, segs: [[x0, z0, y0, x1, z1, y1]], hills: the far ends' hills, lakeY: Lake Ashi's level above the start line }
  function hkFix(x, z, h, dd) {
    if (dd > 60 && API.vrLC(x, z) === 5 && Math.abs(API.vrDem(x, z) - HKR.lakeY) < 8) return HKR.lakeY - 0.15;   // (Lake Ashi in the corridor: its surface flat, the land's made-up relief off it)
    if (dd < 1.2) return h;
    const r = hkBench(x, z, h, dd);
    return dd > 30 && HKR.hills.length ? hkHill(x, z, r) : r;
  }
  // a line's far end (where the data of the line stops, ~95-170 m from the road): the hill it runs into, a tunnel's portal at its foot; the land
  // raised behind the portal (not in front of it) to 8 m over the rails, back to the land 20 m to either side and 26-42 m on
  function hkHill(x, z, h) {
    for (const e of HKR.hills) { const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz > 2500) continue;
      const u = dx * e.tx + dz * e.tz, v = Math.abs(dz * e.tx - dx * e.tz), f = sstep(-1.5, 5, u) * (1 - sstep(7, 20, v)) * (1 - sstep(26, 42, u));
      if (f > 0) h = Math.max(h, lerp(h, e.y + 8, f)); }
    return h;
  }
  // the distance to the railway's nearest stretch out of the tunnels (on the ground or on a bridge), for the plants (none on the bed)
  function hkRailD(x, z) {
    const L = HKR && HKR.all.get(Math.floor(x / 16) * 65536 + Math.floor(z / 16)); let b = 1e9; if (!L) return b;
    for (const s of L) { const ex = s[3] - s[0], ez = s[4] - s[1], t = clamp(((x - s[0]) * ex + (z - s[1]) * ez) / (ex * ex + ez * ez || 1), 0, 1); b = Math.min(b, Math.hypot(s[0] + ex * t - x, s[1] + ez * t - z)); }
    return b;
  }
  function hkBench(x, z, h, dd) {
    const L = HKR.cells.get(Math.floor(x / 16) * 65536 + Math.floor(z / 16)); if (!L) return h;
    let best = 1e9, y = 0;
    for (let k = 0; k < L.length; k++) { const s = L[k], ex = s[3] - s[0], ez = s[4] - s[1], l2 = ex * ex + ez * ez, t = clamp(((x - s[0]) * ex + (z - s[1]) * ez) / (l2 || 1), 0, 1), px = s[0] + ex * t - x, pz = s[1] + ez * t - z, d = px * px + pz * pz;
      if (d < best) { best = d; y = s[2] + (s[5] - s[2]) * t; } }
    const d = Math.sqrt(best); if (d > 10.6) return h;
    return lerp(y - 0.32, h, sstep(2.6, 10.6, d) * sstep(1.2, 4, dd));
  }

  /* ---- the unit plants (height 1; the instances scale and tint them): 0 Japanese cedar (sugi: a straight trunk, a tall narrow crown in drooping
     tiers), 1 broadleaf (oaks, zelkovas, beeches: a broad crown of three clumps), 2 Japanese maple (a low, layered crown: scarlet in autumn),
     3 a clump of bamboo (seven culms leaning out, feathery tufts at the top), 4 hydrangea (a mound of dark leaves under pale flower heads, the
     instance colour tints them blue, violet or pink) ---- */
  function hkPlantGeo(kind) {
    const g = new GB(), R = rng(930 + kind), rs = API.ROCK_SMOOTH, su = HKS;
    if (kind === 0) {
      API.ROCK_SMOOTH = false;
      cyl(g, 0, -0.02, 0, 0.02, 0.34, 4, [0.4, 0.27, 0.19], null, 0.016);
      const col = [0.1, 0.2, 0.11], tip = [0.18, 0.3, 0.17];
      [[0.24, 0.22, 0.26, 0.05], [0.4, 0.19, 0.24, 0.045], [0.55, 0.15, 0.22, 0.04], [0.69, 0.11, 0.2, 0.03]].forEach(([y, r, h, dr], k) => {
        const kk = k % 2 ? 1.08 : 1; starCone(g, 0, y, 0, r, h, 5, [col[0] * kk, col[1] * kk, col[2] * kk], tip, k * 0.7, dr); });
      cone(g, 0, 0.84, 0, 0.045, 0.16, 4, col, tip, 0.4);
    } else if (kind === 1) {
      API.ROCK_SMOOTH = true;
      cyl(g, 0, -0.02, 0, 0.03, 0.42, 4, [0.4, 0.36, 0.3], null, 0.022);
      const c = su ? [0.21, 0.36, 0.13] : [0.7, 0.46, 0.15];
      ico(g, 0, 0.62, 0, 0.3, 0.72, c, R, 0.3); ico(g, 0.15, 0.5, 0.08, 0.21, 0.8, vary(c, R, 0.2), R, 0.35); ico(g, -0.14, 0.52, -0.08, 0.21, 0.8, vary(c, R, 0.2), R, 0.35);
    } else if (kind === 2) {
      API.ROCK_SMOOTH = true;
      cyl(g, 0, -0.02, 0, 0.026, 0.32, 4, [0.3, 0.24, 0.2], null, 0.02);
      const c = su ? [0.26, 0.44, 0.14] : [0.86, 0.17, 0.08];
      [[0, 0.66, 0, 0.38, 0.46], [0.2, 0.52, 0.12, 0.26, 0.48], [-0.2, 0.5, -0.1, 0.27, 0.48]].forEach(([x, y, z, r, sy]) => ico(g, x, y, z, r, sy, vary(c, R, 0.16), R, 0.35));
    } else if (kind === 3) {
      API.ROCK_SMOOTH = false;
      const culm = su ? [0.5, 0.62, 0.26] : [0.56, 0.6, 0.3], leaf = su ? [0.42, 0.6, 0.2] : [0.5, 0.56, 0.22];
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R() * 0.6, d = k ? 0.05 + R() * 0.05 : 0, lean = 0.06 + R() * 0.08, x0 = Math.cos(a) * d, z0 = Math.sin(a) * d, x1 = x0 + Math.cos(a) * lean, z1 = z0 + Math.sin(a) * lean, h = 0.82 + R() * 0.18;
        const w = 0.014, P0 = [x0 - w, 0, z0], P1 = [x0 + w, 0, z0], P2 = [x1 + w * 0.6, h, z1], P3 = [x1 - w * 0.6, h, z1], Q0 = [x0, 0, z0 - w], Q1 = [x0, 0, z0 + w], Q2 = [x1, h, z1 + w * 0.6], Q3 = [x1, h, z1 - w * 0.6];
        g.quadO(P0, P1, P2, P3, culm, [x0, 0.4, z0 + 1]); g.quadO(Q0, Q1, Q2, Q3, culm, [x0 + 1, 0.4, z0]);   // (two crossed strips: a culm from every side)
        ico(g, x0 + (x1 - x0) * 0.72, h * 0.72 + 0.06, z0 + (z1 - z0) * 0.72, 0.15, 0.62, vary(leaf, R, 0.2), R, 0.4); }
    } else if (kind === 5) {   // sasa: two low, flattened clumps of bright leaves (green the year round)
      API.ROCK_SMOOTH = true;
      ico(g, -0.12, 0.42, 0.04, 0.42, 0.62, [0.22, 0.38, 0.12], R, 0.4); ico(g, 0.18, 0.36, -0.08, 0.34, 0.6, [0.26, 0.42, 0.14], R, 0.4);
    } else {
      API.ROCK_SMOOTH = true;
      ico(g, 0, 0.34, 0, 0.56, 0.64, [0.15, 0.29, 0.11], R, 0.3);
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + R() * 0.6, d = 0.24 + R() * 0.12; ico(g, Math.cos(a) * d, 0.58 + R() * 0.08, Math.sin(a) * d, 0.13 + R() * 0.04, 0.8, su ? [0.9, 0.92, 0.98] : [0.42, 0.4, 0.26], R, 0.3); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  /* ---- the view beyond the corridor (HK_DATA.far: the caldera, Odawara and the coast of Sagami Bay on a 200 m grid; HK_DATA.fuji: Mount Fuji's
     country on a 500 m grid; a strip of triangles between the two): one mesh as the Irohazaka's (irFar), its nodes kept in world coordinates (P0)
     and drawn on the camera's lines of sight between 70 m and 6 m inside its far plane, nearer ones nearer (a ridge covers what lies behind it),
     so the far land shows behind every part of the near world; hazed with its real distance, less the higher it stands (Fuji's top above the
     haze), into the fog near the corridor; not where the corridor is. Lake Ashi at its level with its red gate standing in the water and three
     sightseeing boats crossing it slowly; the sea; Fuji's scree and its snow (streaks of the last snow in early summer, the first cap in autumn).
     def.fuji 'real': Fuji in the one mesh (hidden by the caldera's ridges wherever they stand in front of it, as they do from most of the lap);
     else its massif in a mesh of its own drawn after the far land without the depth test (hidden only by the near world, drawn after it) ---- */
  function hkFar(base, fujiOver) {
    const H = hkData(); if (!H) return null;
    const D = H.D, su = HKS, P0 = [], C = [], AZ = [], IF = [], RIM = [], BLK = new Map(), blk = (k) => { let L = BLK.get(k); if (!L) BLK.set(k, L = []); return L; };   // (the triangles in blocks: each its own mesh, culled out of the view)
    const road = []; for (let i = 0; i < T.N; i += 10) road.push(T.px[i], T.pz[i]);
    const dRoad = (x, z) => { let m = 1e18; for (let k = 0; k < road.length; k += 2) { const dx = x - road[k], dz = z - road[k + 1], d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
    const FT = D.fujiTop || [-34338, -14105, 3776], HOLE = 300;
    const runs = (R, out) => { for (let k = 0, p = 0, v = 0; k < R.length; k++) { if (v) out.fill(1, p, p + R[k]); p += R[k]; v ^= 1; } };
    const isFuji = (x, z, A) => Math.hypot(x - FT[0], z - FT[1]) < 15500 && A > 950;
    const grid = (F, near) => {
      const nx = F.nx, nz = F.nz, n = nx * nz, b = atob(F.b64), h = new Float32Array(n), wet = new Uint8Array(n), sea = new Uint8Array(n), lc = hkLC(F.lc, n), dr = new Float32Array(n), v0 = P0.length / 3;
      for (let k = 0; k < n; k++) h[k] = F.lo + (b.charCodeAt(2 * k) * 256 + b.charCodeAt(2 * k + 1)) * F.step;
      runs(F.lake, wet); runs(F.sea, sea);
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const k = j * nx + i, x = F.x0 + i * F.cell, z = F.z0 + j * F.cell, A = h[k], q = rpHash(i + (near ? 0 : 500), j) - 0.5;
        const sl = Math.hypot(h[j * nx + Math.min(nx - 1, i + 1)] - h[j * nx + Math.max(0, i - 1)], h[Math.min(nz - 1, j + 1) * nx + i] - h[Math.max(0, j - 1) * nx + i]) / (2 * F.cell);
        dr[k] = near ? dRoad(x, z) : 1e9;
        let c;
        if (wet[k]) c = [0.19, 0.29, 0.33];
        else if (sea[k]) c = [0.23, 0.33, 0.42];
        else {
          const L = lc[k];
          if (su) c = L === 1 ? [0.13 + q * 0.03, 0.24 + q * 0.04, 0.11] : L === 2 ? [0.22, 0.33, 0.14] : L === 3 ? [0.5 + q * 0.06, 0.49 + q * 0.05, 0.46] : L === 4 ? [0.42, 0.38, 0.34] : L === 6 ? [0.37 + q * 0.06, 0.46 + q * 0.05, 0.2] : [0.3 + q * 0.04, 0.42 + q * 0.04, 0.18];
          else c = L === 1 ? (q > 0.15 ? [0.6, 0.24, 0.1] : q > -0.1 ? [0.58, 0.44, 0.15] : [0.3, 0.32, 0.14]) : L === 2 ? [0.42, 0.36, 0.18] : L === 3 ? [0.5, 0.48, 0.45] : L === 4 ? [0.42, 0.38, 0.34] : L === 6 ? [0.55, 0.48, 0.26] : [0.56, 0.5, 0.3];
          if (!near) {   // Mount Fuji: the forest up to ~2400 m (darker conifers higher up), its scree above, the snow
            const cf = sstep(1500, 2100, A); c = [lerp(c[0], 0.11, cf), lerp(c[1], 0.2, cf), lerp(c[2], 0.12, cf)];
            const sc = sstep(2250, 2600, A); c = [lerp(c[0], 0.31 + q * 0.05, sc), lerp(c[1], 0.29 + q * 0.04, sc), lerp(c[2], 0.32 + q * 0.04, sc)];   // (the dark volcanic scree, blue-grey from afar)
            const sn = su ? sstep(3250, 3550, A) * (q > -0.15 ? 1 : 0.25) : sstep(2750, 3150, A) * (q > -0.35 ? 1 : 0.6);
            c = [lerp(c[0], 0.95, sn), lerp(c[1], 0.96, sn), lerp(c[2], 0.99, sn)];
          }
          const rk = sstep(0.55, 0.9, sl) * 0.6; c = [lerp(c[0], 0.42, rk), lerp(c[1], 0.38, rk), lerp(c[2], 0.34, rk)];   // the cliffs
        }
        P0.push(x, A - base, z); C.push(c[0], c[1], c[2]); AZ.push(1 - 0.55 * sstep(900, 3300, A)); RIM.push(near ? sstep(580, 300, dr[k]) : 0);   // (round the corridor's hole: into the haze, no ragged edge)
      }
      for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) {
        const a = j * nx + i, b2 = a + 1, c = a + nx, d = c + 1;
        if (near && Math.min(dr[a], dr[b2], dr[c], dr[d]) < HOLE) continue;   // (none near the road: a cell round the camera, drawn on its far sphere, would cut through the near world)
        const L = fujiOver && !near && isFuji(F.x0 + i * F.cell, F.z0 + j * F.cell, h[a]) && isFuji(F.x0 + (i + 1) * F.cell, F.z0 + (j + 1) * F.cell, h[d]) ? IF : blk((near ? 'f' : 'j') + Math.floor(i / (near ? 28 : 40)) + ',' + Math.floor(j / (near ? 28 : 45)));
        L.push(v0 + a, v0 + c, v0 + b2, v0 + b2, v0 + c, v0 + d);
      }
      return { v0, nx, nz, wet };
    };
    const gF = grid(D.far, true), gJ = grid(D.fuji, false), FF = D.far;
    const open = (x, z) => { const i0 = Math.floor((x - FF.x0) / FF.cell), j0 = Math.floor((z - FF.z0) / FF.cell);   // (open water on the far grid: its cell's four nodes all wet)
      for (let j = j0; j <= j0 + 1; j++) for (let i = i0; i <= i0 + 1; i++) if (i < 0 || j < 0 || i >= gF.nx || j >= gF.nz || !gF.wet[j * gF.nx + i]) return false; return true; };
    const toOpen = (x, z) => { let best = null, bd = 1e18; for (let j = 0; j < gF.nz; j++) for (let i = 0; i < gF.nx; i++) { const px = FF.x0 + (i + 0.5) * FF.cell, pz = FF.z0 + (j + 0.5) * FF.cell, d = (px - x) ** 2 + (pz - z) ** 2; if (d < bd && open(px, pz)) { bd = d; best = [px, pz]; } } return best; };
    {   // the strip between the two grids: Fuji's grid's east column and the far grid's west column, a zipper of triangles over the z they share
      const Fj = D.fuji, Ff = D.far, iA = gJ.nx - 1, za = (j) => Fj.z0 + j * Fj.cell, zb = (k) => Ff.z0 + k * Ff.cell;
      let j = Math.max(0, Math.floor((Ff.z0 - Fj.z0) / Fj.cell)), k = 0; const j1 = gJ.nz - 1, k1 = Math.min(gF.nz - 1, Math.floor((za(j1) - Ff.z0) / Ff.cell) + 1);
      const A = (jj) => gJ.v0 + jj * gJ.nx + iA, B = (kk) => gF.v0 + kk * gF.nx, I = blk('seam');
      while (j < j1 || k < k1) {
        if (k >= k1 || (j < j1 && za(j + 1) <= zb(k + 1))) { I.push(A(j), A(j + 1), B(k)); j++; }
        else { I.push(B(k), A(j), B(k + 1)); k++; }
      }
    }
    // a few flat-shaded boxes of its own on the far mesh (its own vertices: the lake's red gate, the boats)
    const boxF = (cx, cy, cz, sx, sy, sz, rot, col) => { const c = Math.cos(rot), s = Math.sin(rot), Pp = (lx, ly, lz) => [cx + lx * c - lz * s, cy + ly, cz + lx * s + lz * c], hx = sx / 2, hz = sz / 2;
      const F6 = [[[-hx, 0, hz], [hx, 0, hz], [hx, sy, hz], [-hx, sy, hz]], [[hx, 0, -hz], [-hx, 0, -hz], [-hx, sy, -hz], [hx, sy, -hz]], [[hx, 0, hz], [hx, 0, -hz], [hx, sy, -hz], [hx, sy, hz]], [[-hx, 0, -hz], [-hx, 0, hz], [-hx, sy, hz], [-hx, sy, -hz]], [[-hx, sy, hz], [hx, sy, hz], [hx, sy, -hz], [-hx, sy, -hz]]];
      const v0 = P0.length / 3, I = blk('lake'); for (const f of F6) { const w = P0.length / 3; for (const p of f) { const q = Pp(p[0], p[1], p[2]); P0.push(q[0], q[1], q[2]); C.push(col[0], col[1], col[2]); AZ.push(1); RIM.push(0); } I.push(w, w + 1, w + 2, w, w + 2, w + 3); }
      return v0; };
    const lakeY = D.far.lakeH - base;
    for (const g of D.gates) if (g[4]) {   // the red gate in the lake (8 m wide, 9 m up; its two pillars, the black-topped beam, the tie beam), on the far grid's
      // open water nearest its real place (that, a few metres off the shore, lies under the coarse grid's shore)
      const ow = toOpen(g[0], g[1]); if (!ow) continue;
      const x = ow[0], z = ow[1], ang = g[3], red = [0.82, 0.2, 0.1], c = Math.cos(ang), s = Math.sin(ang);
      for (const sd of [-1, 1]) boxF(x + c * sd * 3.6, lakeY - 0.5, z + s * sd * 3.6, 0.8, 9, 0.8, ang, red);
      boxF(x, lakeY + 8.2, z, 11, 0.8, 1, ang, [0.12, 0.1, 0.1]); boxF(x, lakeY + 7.4, z, 10.2, 0.8, 0.9, ang, red); boxF(x, lakeY + 6, z, 8.6, 0.55, 0.6, ang, red);
    }
    const boats = [];
    {   // three sightseeing boats on routes across the lake (between points inside its shore line), each a white hull, a deck house and a coloured band
      const routes = [[[-10500, -300], [-8300, 4300]], [[-9500, 2100], [-7500, 4500]], [[-9700, 2900], [-7100, 3700]]];   // (the long reach from the north end, the two southern bays)
      const cols = [[0.85, 0.2, 0.15], [0.15, 0.35, 0.7], [0.9, 0.7, 0.2]];
      routes.forEach((r, k) => { const a = toOpen(r[0][0], r[0][1]), b = toOpen(r[1][0], r[1][1]); if (!a || !b) return; r = [a, b];
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let t = 0; t <= L; t += 50) if (!open(lerp(a[0], b[0], t / L), lerp(a[1], b[1], t / L))) return;   // (none over the land)
        const ang = Math.atan2(r[1][1] - r[0][1], r[1][0] - r[0][0]), v0 = P0.length / 3;
        boxF(0, lakeY - 0.6, 0, 34, 3.4, 8.5, ang, [0.94, 0.94, 0.92]); boxF(-2, lakeY + 2.8, 0, 20, 3.2, 7, ang, [0.96, 0.96, 0.95]); boxF(-2, lakeY + 1.8, 0, 22, 1, 8.7, ang, cols[k]); boxF(-4, lakeY + 6, 0, 9, 2.6, 5.5, ang, [0.9, 0.9, 0.9]);
        const v1 = P0.length / 3, loc = P0.slice(v0 * 3, v1 * 3);
        boats.push({ v0, v1, loc, a: r[0], b: r[1], len: Math.hypot(r[1][0] - r[0][0], r[1][1] - r[0][1]), ph: k * 0.37, sp: 4.5 });
      });
    }
    const nv = P0.length / 3, g = new THREE.BufferGeometry(), pos = new THREE.BufferAttribute(new Float32Array(P0), 3), hz = new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1);
    for (const b of boats) hkBoatAt(b, 0, pos.array);
    const all = []; for (const L of BLK.values()) for (const v of L) all.push(v); for (const v of IF) all.push(v);
    g.setAttribute('position', pos); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); g.setAttribute('aHz', hz); g.setIndex(all); g.computeVertexNormals();
    const U = { uHz: { value: new THREE.Color(0xc8d5dc) } };
    const mk = (over) => { const m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false });
      if (over) { m.depthTest = false; }
      m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
      m.customProgramCacheKey = () => 'hkFar' + (over ? 'O' : ''); return m; };
    const onBR = (r, sc) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); }, mat = mk(false), meshes = [];   // (the haze: the fog's colour, by the time of day and the weather)
    const part = (I, m, name, ro) => {   // a mesh of the triangles I: the attributes shared, its own index, its vertices (for its bounding sphere as drawn)
      const gq = new THREE.BufferGeometry(); for (const k in g.attributes) gq.setAttribute(k, g.attributes[k]); gq.setIndex(I);
      const vs = Uint32Array.from(new Set(I)); gq.boundingSphere = new THREE.Sphere();
      const o = new THREE.Mesh(gq, m); o.frustumCulled = true; o.renderOrder = ro; o.matrixAutoUpdate = false; o.name = name; o.onBeforeRender = onBR; o.userData.vs = vs; meshes.push(o); return o; };
    for (const L of BLK.values()) part(L, mat, 'hkFar', -50);
    const mesh2 = IF.length ? part(IF, mk(true), 'hkFuji', -49) : null;
    const F = { meshes, mesh: meshes[0], mesh2, g, P0: Float32Array.from(pos.array), rim: Float32Array.from(RIM), az: Float32Array.from(AZ), boats, cx: 1e9, cy: 0, cz: 0, cf: 0, t: -1, th: 4, rest: false };
    hkFarBounds(F); return F;
  }
  function hkBoatAt(b, t, out) {   // a boat t s into the race: to and fro along its route (it turns at the ends), its vertices into out (P0's layout)
    const L = b.len, u = ((t * b.sp / L + b.ph) % 2 + 2) % 2, f = u < 1 ? u : 2 - u, fs = f * f * (3 - 2 * f), dir = u < 1 ? 0 : Math.PI;
    const x = lerp(b.a[0], b.b[0], fs), z = lerp(b.a[1], b.b[1], fs), c = Math.cos(dir), s = Math.sin(dir);
    for (let k = 0, v = b.v0 * 3; k < b.loc.length; k += 3, v += 3) { const lx = b.loc[k], lz = b.loc[k + 2]; out[v] = x + lx * c - lz * s; out[v + 1] = b.loc[k + 1]; out[v + 2] = z + lx * s + lz * c; }
  }
  function hkFarBounds(F) {   // each block's bounding sphere round its vertices where they are drawn now (three.js culls the blocks out of the view)
    const p = F.g.attributes.position.array;
    for (const o of F.meshes) { const vs = o.userData.vs; let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
      for (let k = 0; k < vs.length; k++) { const q = vs[k] * 3, x = p[q], y = p[q + 1], z = p[q + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      o.geometry.boundingSphere.center.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); o.geometry.boundingSphere.radius = Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + 1; }
  }
  function hkFarUpdate(F, cam, t) {   // (no camera: back to the nodes' own places and the boats to their start, the world test's pose)
    const g = F.g, p = g.attributes.position.array, hz = g.attributes.aHz.array, P0 = F.P0;
    if (!cam) {   // (F.rest: drawn as P0 with the boats at time 0, however the frames before left it: the world test's fingerprint never depends on them)
      if (F.rest && F.t === 0) return;
      if (F.t !== 0) { F.t = 0; for (const b of F.boats) hkBoatAt(b, 0, P0); }
      p.set(P0); hz.fill(0.5); g.attributes.position.needsUpdate = g.attributes.aHz.needsUpdate = true; F.cx = 1e9; F.rest = true; hkFarBounds(F); return;
    }
    if (F.boats.length && t != null && Math.abs(t - F.t) > 0.25) { F.t = t; for (const b of F.boats) hkBoatAt(b, t, P0); F.cx = 1e9; }
    const c = cam.position; if (Math.abs(c.x - F.cx) + Math.abs(c.y - F.cy) + Math.abs(c.z - F.cz) < F.th && cam.far === F.cf) return;   // (every 4 m: drawn 64-6 m inside the far plane, the far land stays inside it)
    F.cx = c.x; F.cy = c.y; F.cz = c.z; F.cf = cam.far; F.rest = false;
    const R0 = cam.far - 70, R1 = cam.far - 6, rim = F.rim, az = F.az;
    for (let v = 0, k = 0; k < P0.length; v++, k += 3) { const dx = P0[k] - c.x, dy = P0[k + 1] - c.y, dz = P0[k + 2] - c.z, D = Math.max(1, Math.hypot(dx, dy, dz)), r = R0 + (R1 - R0) * (1 - Math.exp(-Math.max(0, D - 400) / 3000)), f = r / D;
      p[k] = c.x + dx * f; p[k + 1] = c.y + dy * f; p[k + 2] = c.z + dz * f; hz[v] = Math.max(rim[v], (0.22 + 0.58 * (1 - Math.exp(-Math.max(0, D - 400) / 6000))) * az[v]); }
    g.attributes.position.needsUpdate = true; g.attributes.aHz.needsUpdate = true;
    hkFarBounds(F);
  }

  /* ---- a hipped roof (yosemune) over the box L x D turned by rot: the ridge along L (L - D long; a pyramid on a square), its eaves at y ---- */
  function hip(g, cx, y, cz, L, D, h, rot, col, col2) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (lx, ly, lz) => [cx + lx * c - lz * s, y + ly, cz + lx * s + lz * c], r = Math.max(0, (L - D) / 2);
    const a = P(-L / 2, 0, -D / 2), b = P(L / 2, 0, -D / 2), cc = P(L / 2, 0, D / 2), d = P(-L / 2, 0, D / 2), r0 = P(-r, h, 0), r1 = P(r, h, 0), inn = [cx, y + h * 0.3, cz];
    g.quadO(a, b, r1, r0, col, inn); g.quadO(cc, d, r0, r1, col2 || col, inn); g.triO(b, cc, r1, col2 || col, inn); g.triO(d, a, r0, col, inn);
  }

  function buildHakone(scene, tex, opts) {
    const N = T.N, w = T.w, dens = opts.density || 1, def = T.def, ds = T.ds, W = (i) => (i % N + N) % N, L = T.len, H = hkData(), D = H ? H.D : null;
    const root = new THREE.Group(); scene.add(root);
    API.VRS = opts.season === 'autumn' || opts.season === 'winter' ? 'autumn' : 'summer'; HKS = API.VRS === 'summer';   // (as Vršič: the autumn colours; winter snows them over)
    const su = HKS, out = { root, dyn: {}, groundH: vrGround, camFloor: vrGround, props: [], farClip: true, ownTex: [], season: API.VRS, paintFor: (s) => (s === 'autumn' || s === 'winter' ? 'autumn' : 'summer') };
    { const lk = def.lakes; def.lakes = D ? D.lakes.filter(l => l[0] < 1e6) : null; vrPrep(); def.lakes = lk; }   // (Lake Shōjin and Otama-ga-ike: their basins in the ground; Lake Ashi's surface is the levelled ground and the far view's)
    const P = API.VR, sStart = T.startS, base = P.D.base, R = rng(4431), at = (d) => ((sStart + d) % L + L) % L;
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (ouCutMat: the trees between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // tree exclusion circles, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lq = eh.get(k); if (!Lq) eh.set(k, Lq = []); Lq.push(e); } return e; };
    const excluded = (x, z) => { const Lq = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lq) return false; for (let k = 0; k < Lq.length; k++) { const e = Lq[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const rects = new Map();   // building footprints (oriented boxes, 2 m round them), hashed: no tree stands in a house
    const rectPush = (x, z, Lb, Wb, a) => { const e = { x, z, c: Math.cos(a), s: Math.sin(a), hl: Lb / 2 + 1.5, hw: Wb / 2 + 1.5 }, r = Math.hypot(e.hl, e.hw);
      for (let i = Math.floor((x - r) / EHC); i <= Math.floor((x + r) / EHC); i++) for (let j = Math.floor((z - r) / EHC); j <= Math.floor((z + r) / EHC); j++) { const k = i + ',' + j; let Lq = rects.get(k); if (!Lq) rects.set(k, Lq = []); Lq.push(e); } };
    const inRect = (x, z) => { const Lq = rects.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lq) return false; for (const e of Lq) { const dx = x - e.x, dz = z - e.z, u = dx * e.c + dz * e.s, v = -dx * e.s + dz * e.c; if (Math.abs(u) < e.hl && Math.abs(v) < e.hw) return true; } return false; };
    out.marks = {}; out.bldBoxes = [];   // (where the landmarks stand, the buildings' boxes: the tests look for them)

    /* ---- the railway: its lines (HK_DATA.rail) in the game's frame, every ~3 m, the heights above the start line; where a line on the ground
       crosses the road it meets the road's own height (the level crossing at Kowakidani, eased over 45 m either side), where a bridge passes
       over the road it stands 6.5 m above it at least; the bed's stretches hashed for the ground (hkRailFix) ---- */
    const rail = [], cross = [];
    if (D) {
      for (const r of D.rail) {
        const p = r.p, n = p.length / 3, pts = [];
        for (let k = 0; k < n; k++) pts.push({ x: p[k * 3] / 10, z: p[k * 3 + 1] / 10, y: p[k * 3 + 2] / 10 - base, g: k < n - 1 ? r.g[k] : r.g[n - 2] });
        const q = []; for (let k = 0; k < n - 1; k++) { const a = pts[k], b = pts[k + 1], l = Math.hypot(b.x - a.x, b.z - a.z), m = Math.max(1, Math.ceil(l / 3));
          for (let j = 0; j < m; j++) { const f = j / m; q.push({ x: lerp(a.x, b.x, f), z: lerp(a.z, b.z, f), y: lerp(a.y, b.y, f), g: a.g }); } }
        q.push(Object.assign({}, pts[n - 1]));
        for (const o of q) { const nn = vrNear(o.x, o.z); o.i = nn.i; o.d = nn.d; o.hn = nn.hn; o.dd = nn.i >= 0 ? nn.dd : 99; }
        for (let k = 0; k + 1 < q.length; k++) {   // where the line crosses the road's centre line (not where it only runs close beside it): a level crossing or a bridge over it
          const o = q[k], b = q[k + 1], i = o.i; if (i < 0 || o.g === 2 || b.g === 2) continue;
          const la = (o.x - T.px[i]) * T.nx[i] + (o.z - T.pz[i]) * T.nz[i], lb = (b.x - T.px[i]) * T.nx[i] + (b.z - T.pz[i]) * T.nz[i];
          if (Math.sign(la) === Math.sign(lb) || Math.abs(la) > 14 || Math.abs(lb) > 14) continue;
          if (o.g === 0) { const yc = o.hn + 0.02; cross.push({ x: o.x, z: o.z, i, k, line: rail.length });
            for (let j = 0; j < q.length; j++) { const dl = Math.abs(j - k) * 3; if (dl < 45 && q[j].g !== 2) q[j].y = lerp(yc, q[j].y, sstep(9, 45, dl)); } }
          else if (o.y < o.hn + 6.5) { const up = o.hn + 6.5 - o.y; for (let j = 0; j < q.length; j++) { const dl = Math.abs(j - k) * 3; if (dl < 60) q[j].y += up * sstep(60, 20, dl); } } }
        rail.push(q);
      }
      const cells = new Map(), segs = [];
      for (const q of rail) for (let k = 0; k + 1 < q.length; k++) { const a = q[k], b = q[k + 1]; if (a.g !== 0) continue;
        const s = [a.x, a.z, a.y, b.x, b.z, b.y]; segs.push(s);
        for (let i = Math.floor((Math.min(a.x, b.x) - 11) / 16); i <= Math.floor((Math.max(a.x, b.x) + 11) / 16); i++) for (let j = Math.floor((Math.min(a.z, b.z) - 11) / 16); j <= Math.floor((Math.max(a.z, b.z) + 11) / 16); j++) { const key = i * 65536 + j; let Lq = cells.get(key); if (!Lq) cells.set(key, Lq = []); Lq.push(s); } }
      const all = new Map();
      for (const q of rail) for (let k = 0; k + 1 < q.length; k++) { const a = q[k], b = q[k + 1]; if (a.g === 2) continue;
        const s = [a.x, a.z, a.y, b.x, b.z, b.y];
        for (let i = Math.floor((Math.min(a.x, b.x) - 6) / 16); i <= Math.floor((Math.max(a.x, b.x) + 6) / 16); i++) for (let j = Math.floor((Math.min(a.z, b.z) - 6) / 16); j <= Math.floor((Math.max(a.z, b.z) + 6) / 16); j++) { const key = i * 65536 + j; let Lq = all.get(key); if (!Lq) all.set(key, Lq = []); Lq.push(s); } }
      // the lines' free ends (not at another line, not in a tunnel): by the road (within ~95 m) a buffer stop; farther out, where the data of the
      // line stops, a tunnel's portal at the foot of a hill (hkHill), as the line goes on into the hills
      const ends = [], hills = [];
      for (const [li, q] of rail.entries()) for (const k of [0, q.length - 1]) {
        const p = q[k], o = q[k ? k - 1 : 1]; if (!o || p.g === 2 || (k && q[k - 1].g === 2)) continue;
        let joined = false;
        for (const [lj, q2] of rail.entries()) { if (lj === li) continue;   // (within 4 m of another line: a junction, a siding's end at the main line)
          for (let j = 0; j + 1 < q2.length && !joined; j++) { const a2 = q2[j], b2 = q2[j + 1], ex = b2.x - a2.x, ez = b2.z - a2.z, t = clamp(((p.x - a2.x) * ex + (p.z - a2.z) * ez) / (ex * ex + ez * ez || 1), 0, 1);
            if (Math.hypot(a2.x + ex * t - p.x, a2.z + ez * t - p.z) < 4) joined = true; }
          if (joined) break; }
        if (joined) continue;
        const dx = p.x - o.x, dz = p.z - o.z, l = Math.hypot(dx, dz) || 1, e = { x: p.x, y: p.y, z: p.z, tx: dx / l, tz: dz / l, far: vrDist(p.x, p.z) > 95 };
        ends.push(e); if (e.far) hills.push(e);
      }
      HKR = { cells, all, segs, ends, hills, lakeY: D.far.lakeH - base }; P.hfix = hkFix;
    }

    /* ---- terrain tiles ---- */
    let nFar = 0, nTiles = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = hkTileOn(ti, tj); if (!on) continue; if (on === 1) { G.on[tj * G.ntx + ti] = 1; nTiles++; } else nFar++;
        const m = new THREE.Mesh(hkTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the water: Lake Shōjin and Otama-ga-ike by the road (4 m grids at their level wherever the ground lies below it), the near shore of
       Lake Ashi (8 m, within the corridor); dark green and still, the sky mirrored in patches ---- */
    {
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 50, specular: 0x24343c });
      const deep = [0.07, 0.2, 0.2], shal = [0.22, 0.36, 0.3], sky = [0.5, 0.62, 0.7];
      for (const Lk of P.lakes) {
        const big = Lk.area > 1e6, cs = big ? 8 : 4, x0 = Lk.x0 - 8, z0 = Lk.z0 - 8, nx = Math.ceil((Lk.x1 - Lk.x0 + 16) / cs) + 1, nz = Math.ceil((Lk.z1 - Lk.z0 + 16) / cs) + 1;
        const g = new GB(true), uv = (qq) => [qq[0] / 14, -qq[2] / 14], cc = new Map();
        const wc = (a, b) => { const key = b * nx + a; let c = cc.get(key); if (c) return c; const x = x0 + a * cs, z = z0 + b * cs, e = vrWater(x, z).e, ks = 0.42 * sstep(0.55, 0.8, P.n2(x * 2.2, z * 2.2));
          c = [0, 1, 2].map(k => lerp(lerp(shal[k], deep[k], sstep(2, 20, e)), sky[k], ks)); cc.set(key, c); return c; };
        for (let b = 0; b < nz - 1; b++) for (let a = 0; a < nx - 1; a++) {
          const x = x0 + a * cs, z = z0 + b * cs; if (big && vrDist(x, z) > HK_COARSE + 20) continue;
          if (!(vrGround(x, z) < Lk.h + 0.4 || vrGround(x + cs, z) < Lk.h + 0.4 || vrGround(x, z + cs) < Lk.h + 0.4 || vrGround(x + cs, z + cs) < Lk.h + 0.4)) continue;
          const A = [x, Lk.h, z], B = [x + cs, Lk.h, z], C = [x + cs, Lk.h, z + cs], Dd = [x, Lk.h, z + cs];
          g.quadUp(A, B, C, Dd, [wc(a, b), wc(a + 1, b), wc(a + 1, b + 1), wc(a, b + 1)], [uv(A), uv(B), uv(C), uv(Dd)]);
        }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); }
      }
      if (P.lakes.length) out.dyn.water = tex.water;
    }

    /* ---- the road, round the whole lap: asphalt, the white dashed line between the two lanes and the solid white edge lines (Japan's markings),
       a gravel shoulder, then the verge out to a ditch past the barrier line; on a bridge the deck out to its parapets (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast, grp) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; (grp || root).add(m); return m; };
    const onBr = new Uint8Array(N), sw = 0.6;
    for (const [a, b] of def.bridges || []) for (let s = sStart + a - 3; s <= sStart + b + 3; s += ds / 2) onBr[T.idx(s)] = 1;
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      if (onBr[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];
      const y = T.hy[i], gAt = (o) => { const q = side * o; return vrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.86 - 0.13 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], gc = [0.8, 0.78, 0.74], deck = [0.64, 0.63, 0.6];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return k < 3 ? deck : [0.52, 0.51, 0.49];
          if (k === 4) return hkGCol(x, z);
          const sl = k === 2 ? vrSlope(x, z) : 0; return hkCol(x, z, T.hy[i] + y, 1 / Math.sqrt(1 + sl * sl), Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N); i++) {
          const j = W(i + 1), v0 = i * ds / tileL, v1 = (i + 1) * ds / tileL, s0 = i * ds / 6, s1 = (i + 1) * ds / 6;   // (the lap closes: the last sample joins the first)
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          const ln = [[w - 0.45, w - 0.3], [-(w - 0.3), -(w - 0.45)]];   // (the edge lines)
          if (Math.floor(i / 2) % 4 < 2) ln.push([-0.07, 0.07]);   // (between the lanes: 4 m dashes, 4 m gaps)
          for (const [o0, o1] of ln) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], sc = onBr[i] ? deck : gc;
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [sc, sc, sc, sc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // the chequered start and finish line
      const gq = new GB(true), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];
      { const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker }));
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110);
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.86, 0.14, 0.12], [0.96, 0.82, 0.2], [0.16, 0.36, 0.78], [0.95, 0.95, 0.95], [0.2, 0.6, 0.3], [1, 0.55, 0.1], [0.12, 0.14, 0.2], [0.55, 0.3, 0.6]];
    const CR = crowdCtx({ gH: vrGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => vrWater(x, z).e > -2 });
    const wires = [];   // the utility poles' and the overhead line's wires: segments [x, y, z, x, y, z] (one LineSegments)
    const sag = (a, b, s, n) => { let pr = a; for (let k = 1; k <= n; k++) { const f = k / n, p = [lerp(a[0], b[0], f), lerp(a[1], b[1], f) - s * 4 * f * (1 - f), lerp(a[2], b[2], f)]; wires.push(pr[0], pr[1], pr[2], p[0], p[1], p[2]); pr = p; } };

    /* ---- the start in Yumoto: a gantry over the road on the line (steel posts, a truss beam, a chequered band), pennants on poles along the road
       either side of it ---- */
    {
      const i = T.idx(sStart), g = scen.get(T.px[i], T.pz[i]), steel = [0.78, 0.79, 0.8], dark = [0.12, 0.12, 0.13], hd = T.hd[i];
      const P2 = (o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o], bl = T.bl[i] + 0.6, br = T.br[i] + 0.6;
      for (const o of [-bl, br]) { const p = P2(o, 0); const y0 = vrGround(p[0], p[2]); box(g, p[0], Math.min(y0, T.hy[i]) - 0.5, p[2], 0.45, 7.4 + T.hy[i] - Math.min(y0, T.hy[i]), 0.45, hd, steel); exclPush(p[0], p[2], 1.5); }
      const a = P2(-bl, 6.2), b = P2(br, 6.2), span = bl + br, c = Math.cos(hd + Math.PI / 2), s = Math.sin(hd + Math.PI / 2);
      box(g, (a[0] + b[0]) / 2, 6.2 + T.hy[i], (a[2] + b[2]) / 2, span, 0.9, 0.5, hd + Math.PI / 2, steel);
      for (let k = 0; k < 16; k++) { const f = (k + 0.5) / 16 - 0.5; box(g, (a[0] + b[0]) / 2 + c * f * span, 5.0 + T.hy[i] + (k % 2 ? 0 : 0.6), (a[2] + b[2]) / 2 + s * f * span, span / 16, 0.6, 0.12, hd + Math.PI / 2, k % 2 ? dark : [0.96, 0.96, 0.95]);
        box(g, (a[0] + b[0]) / 2 + c * f * span, 5.0 + T.hy[i] + (k % 2 ? 0.6 : 0), (a[2] + b[2]) / 2 + s * f * span, span / 16, 0.6, 0.12, hd + Math.PI / 2, k % 2 ? [0.96, 0.96, 0.95] : dark); }
    }
    for (let s = sStart - 60; s < sStart + 50; s += 10) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3);
      const gp = scen.get(px, pz), py = vrGround(px, pz), col = fans[Math.floor(rpHash(Math.round(s), side + 3) * fans.length)]; cyl(gp, px, py - 0.2, pz, 0.05, 5.2, 4, [0.9, 0.9, 0.92]);
      box(gp, px + T.tx[ii] * 0.45, py + 4.2, pz + T.tz[ii] * 0.45, 0.9, 1.6, 0.04, T.hd[ii], col); exclPush(px, pz, 1.2); }

    /* ---- concrete parapets on the bridges, white guardrails where the ground falls away beside the road and round the outside of the tighter
       bends; a delineator post every ~50 m where there is neither ---- */
    let nRail = 0;
    {
      const need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let n = -8; n <= (c.i1 - c.i0 + N) % N + 8; n++) need[sd][W(c.i0 + n)] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i], si = side > 0 ? 1 : 0, gA = (d) => { const o = side * (bar + d); return vrGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) - T.hy[i]; };
        for (const d of [4, 8, 13, 19, 26]) if (gA(d) < -(d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[si][i] = 1; need[si][W(i + 1)] = 1; break; } }
      const white = [0.92, 0.92, 0.9], whiteB = [0.72, 0.72, 0.7], postC = [0.86, 0.86, 0.84];
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (onBr[i]) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }   // close short gaps
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 8) for (let k = i; k < j; k++) nd[k] = 0; i = j; }   // drop tiny bits
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N; i++) {
          const j = W(i + 1), g = scen.get(T.px[i], T.pz[i]);
          if (onBr[i] && onBr[j]) {   // a bridge: a concrete parapet
            const a = Q(i, -0.1, -0.05), b = Q(j, -0.1, -0.05), c = Q(j, 0.95, -0.05), d = Q(i, 0.95, -0.05), a2 = Q(i, -0.1, 0.4), b2 = Q(j, -0.1, 0.4), c2 = Q(j, 0.95, 0.4), d2 = Q(i, 0.95, 0.4), inn = Q(i, 0.4, 0.18);
            g.quadO(a, b, c, d, [0.7, 0.69, 0.66], inn); g.quadO(a2, b2, c2, d2, [0.6, 0.59, 0.56], inn); g.quadO(d, c, c2, d2, [0.78, 0.77, 0.74], inn);
          } else if (nd[i] && nd[j]) {   // the white W-beam guardrail: a front and a back face, a post every 4 m
            const a = Q(i, 0.45), b = Q(j, 0.45), c = Q(j, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, white, ins); g.quadO(a, b, c, d, whiteB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
          } else if (!onBr[i] && i % 25 === 0) {   // a delineator post
            const o = side * (bar[i] + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], gp = scen.get(p[0], p[2]);
            box(gp, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(gp, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.9, 0.5, 0.1], null, true);
          }
        }
      }
    }

    /* ---- the buildings (HK_DATA.bld, OpenStreetMap's within 60 m): each moved back off the road where it stood inside the barrier line (its side
       towards the road cut back; dropped when too little of it is left); on the lowest ground under it, a concrete plinth on the low side.
       Houses (two storeys of white, cream, grey or brown walls, or dark timber; tiled roofs, gabled or hipped, dark grey, silver, brown or a
       painted metal), the hotels and big buildings (concrete blocks in pale colours with dark window bands, flat roofs; the lower ones a big
       hipped roof of dark tiles, as the old inns), shrines (a dark timber hall under a heavy roof of grey tiles or green copper), the stations
       (a long low hall), roofs on posts, sheds ---- */
    let nBld = 0;
    const bldAt = new Map();   // (the houses' hash for the utility poles: 20 m cells -> count)
    if (D) {
      const WALL = [[0.92, 0.9, 0.85], [0.86, 0.82, 0.73], [0.94, 0.94, 0.92], [0.64, 0.63, 0.6], [0.4, 0.31, 0.24], [0.56, 0.46, 0.37], [0.74, 0.69, 0.6], [0.52, 0.57, 0.6]];
      const ROOF = [[0.23, 0.25, 0.29], [0.24, 0.26, 0.3], [0.37, 0.39, 0.43], [0.41, 0.31, 0.25], [0.26, 0.34, 0.47], [0.48, 0.25, 0.2], [0.3, 0.37, 0.31]];
      const CONC = [[0.88, 0.87, 0.83], [0.82, 0.79, 0.72], [0.92, 0.92, 0.9], [0.76, 0.74, 0.7], [0.86, 0.8, 0.7]], glass = [0.24, 0.29, 0.34], plinth = [0.55, 0.54, 0.52];
      const B = D.bld;
      for (let k = 0; k < B.length; k += 7) {
        let x = B[k] / 10, z = B[k + 1] / 10, Lb = B[k + 2] / 10, Wb = B[k + 3] / 10; const a = B[k + 4] / 1000, kind = B[k + 6], hr = rng(B[k] * 31 + B[k + 1] * 17);
        let hb = B[k + 5] / 10;
        if (Lb < 2.5 || Wb < 2) continue;
        const ca = Math.cos(a), sa = Math.sin(a), corners = () => [[Lb / 2, Wb / 2], [Lb / 2, -Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2]].map(([u, v]) => [x + ca * u - sa * v, z + sa * u + ca * v]);
        // off the road: the side towards the nearest road sample moved back to 1.2 m past the barrier line
        let nn = vrNear(x, z);
        if (nn.i >= 0) {
          const i = nn.i, sd = Math.sign(nn.lat) || 1, nx = T.nx[i] * sd, nz = T.nz[i] * sd, bar = (sd > 0 ? T.br[i] : T.bl[i]) + 1.2;
          let mn = 1e9; for (const [cx, cz] of corners()) mn = Math.min(mn, (cx - T.px[i]) * nx + (cz - T.pz[i]) * nz);
          if (mn < bar) {   // (cut back by up to 40 % of its depth, the rest of the way moved back: the street's front row stays, a little deeper in)
            const sh = bar - mn, au = Math.abs(ca * nx + sa * nz), av = Math.abs(-sa * nx + ca * nz);
            if (au >= av) { const du = sh / Math.max(0.3, au), cutL = Math.min(du, Lb * 0.4); Lb -= cutL; const mv = cutL / 2 + (du - cutL), sg = Math.sign(ca * nx + sa * nz); x += ca * sg * mv; z += sa * sg * mv; }
            else { const dv = sh / Math.max(0.3, av), cutW = Math.min(dv, Wb * 0.4); Wb -= cutW; const mv = cutW / 2 + (dv - cutW), sg = Math.sign(-sa * nx + ca * nz); x += -sa * sg * mv; z += ca * sg * mv; }
            if (sh > 6) hb = Math.min(hb || 7, 7.5);   // (a slice of a tall block, pushed far back: no tower)
          }
          if (Lb < 3 || Wb < 2.5) continue;
        }
        let bad = false, y0 = 1e9, y1 = -1e9;
        for (const [cx, cz] of corners().concat([[x, z]])) { const q = vrNear(cx, cz); if (q.i >= 0 && q.dd < 0.9) bad = true; const gy = vrGround(cx, cz); y0 = Math.min(y0, gy); y1 = Math.max(y1, gy); }
        if (bad || vrWater(x, z).e > -1) continue;
        let ang = a; if (Lb < Wb) { const t = Lb; Lb = Wb; Wb = t; ang += Math.PI / 2; }   // (cut back across its length: the long side is the other one now)
        const ca2 = Math.cos(ang), sa2 = Math.sin(ang);
        const g = scen.get(x, z); nBld++; rectPush(x, z, Lb, Wb, ang); CR.block(x, z, Lb, Wb, ang); out.bldBoxes.push([x, z, Lb, Wb, ang]);
        { const key = Math.floor(x / 20) * 65536 + Math.floor(z / 20); bldAt.set(key, (bldAt.get(key) || 0) + 1); }
        const fy = y0 - 0.5, up = y1 - y0;   // (the plinth from the lowest ground; the building stands on the highest corner less a little: on a slope its low side shows its concrete base)
        const yb = y1 - Math.min(up, 0.6) * 0.5;
        if (up > 0.25) box(g, x, fy, z, Lb, yb - fy + 0.05, Wb, ang, plinth, null, true);
        if (kind === 1) {   // a hotel or a big building
          const hh = hb > 2 ? hb : 9 + hr() * 9, fl = Math.max(1, Math.round(hh / 3.3)), col = CONC[Math.floor(hr() * CONC.length)];
          if (hh < 13 && Lb < 46 && hr() < 0.45) {   // an old inn: a timber and plaster block under a big hipped roof of dark tiles
            box(g, x, yb, z, Lb, hh - 2.2, Wb, ang, hr() < 0.5 ? [0.9, 0.88, 0.82] : [0.46, 0.36, 0.28], null, true);
            for (let f = 0; f < Math.max(1, fl - 1); f++) box(g, x, yb + 1.1 + f * 3.3, z, Lb + 0.06, 1.1, Wb + 0.06, ang, glass, null, true);
            hip(g, x, yb + hh - 2.2, z, Lb + 1.6, Wb + 1.6, Math.min(4.2, Wb * 0.3), ang, ROOF[0], [0.27, 0.29, 0.33]);
          } else {
            box(g, x, yb, z, Lb, hh, Wb, ang, col, [0.6, 0.6, 0.6], true);
            for (let f = 0; f < fl; f++) { const yy = yb + 1.15 + f * 3.3; if (yy + 1.1 > yb + hh - 0.4) break; box(g, x, yy, z, Lb + 0.06, 1.1, Wb + 0.06, ang, glass, null, true); }
            box(g, x, yb + hh, z, Lb + 0.2, 0.7, Wb + 0.2, ang, [col[0] * 0.92, col[1] * 0.92, col[2] * 0.92], [0.5, 0.5, 0.5], true);   // (the parapet round the flat roof)
            if (Lb * Wb > 250) box(g, x + ca2 * Lb * 0.2, yb + hh, z + sa2 * Lb * 0.2, Math.min(8, Lb * 0.25), 2.6, Math.min(6, Wb * 0.4), ang, [0.7, 0.7, 0.68], [0.55, 0.55, 0.55], true);   // (the lift's housing on it)
          }
        } else if (kind === 2) {   // a shrine's hall
          const hh = Math.max(3.5, Math.min(hb > 2 ? hb * 0.55 : 4.5, 6)), copper = hr() < 0.4;
          box(g, x, yb, z, Lb * 0.9, hh, Wb * 0.86, ang, [0.36, 0.22, 0.15], null, true);
          box(g, x, yb + hh * 0.42, z, Lb * 0.9 + 0.08, 0.35, Wb * 0.86 + 0.08, ang, [0.8, 0.22, 0.12], null, true);
          hip(g, x, yb + hh, z, Lb + 1.8, Wb + 1.8, Math.min(5.5, Wb * 0.42), ang, copper ? [0.34, 0.54, 0.48] : [0.22, 0.23, 0.26], copper ? [0.3, 0.5, 0.45] : [0.25, 0.26, 0.29]);
        } else if (kind === 3) {   // a station: a long low hall, a gabled roof
          const hh = Math.max(3.4, Math.min(hb > 2 ? hb : 4.5, 6));
          box(g, x, yb, z, Lb, hh, Wb, ang, [0.86, 0.82, 0.72], null, true);
          gable(g, x, yb + hh, z, Lb + 1.2, Wb + 1.4, Math.min(2.6, Wb * 0.32), ang, [0.3, 0.32, 0.36], [0.8, 0.76, 0.68]);
        } else if (kind === 4) {   // a roof on posts
          const hh = Math.max(2.6, Math.min(hb > 2 ? hb : 3.2, 5));
          for (const [u, v] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const px = x + ca2 * u * (Lb / 2 - 0.3) - sa2 * v * (Wb / 2 - 0.3), pz = z + sa2 * u * (Lb / 2 - 0.3) + ca2 * v * (Wb / 2 - 0.3); box(g, px, vrGround(px, pz) - 0.2, pz, 0.22, yb + hh - vrGround(px, pz) + 0.2, 0.22, ang, [0.42, 0.33, 0.26], null, true); }
          gable(g, x, yb + hh, z, Lb + 0.6, Wb + 0.6, Math.min(1.6, Wb * 0.3), ang, ROOF[Math.floor(hr() * ROOF.length)], [0.42, 0.33, 0.26]);
        } else if (kind === 5) {   // a shed or a garage: corrugated metal
          const hh = Math.max(2.4, Math.min(hb > 2 ? hb : 2.8, 4.5));
          box(g, x, yb, z, Lb, hh, Wb, ang, hr() < 0.5 ? [0.62, 0.64, 0.66] : [0.5, 0.42, 0.34], hr() < 0.5 ? [0.45, 0.47, 0.5] : [0.52, 0.28, 0.22], true);
        } else {   // a house
          const fl = hb > 2 ? Math.max(1, Math.min(3, Math.round(hb / 3.1))) : (hr() < 0.7 ? 2 : 1), hh = fl * 2.9 + 0.3, wall = vary(WALL[Math.floor(hr() * WALL.length)], hr, 0.06), roof = ROOF[Math.floor(hr() * ROOF.length)];
          const flat = Lb * Wb > 240 || hr() < 0.07;
          box(g, x, yb, z, Lb, hh, Wb, ang, wall, flat ? [0.56, 0.56, 0.55] : null, true);
          if (fl >= 2 && !flat && hr() < 0.55) box(g, x, yb + 2.85, z, Lb + 0.7, 0.18, Wb + 0.7, ang, [roof[0] * 0.9, roof[1] * 0.9, roof[2] * 0.9], null);   // (the eave of the ground floor's roof)
          if (flat) box(g, x, yb + hh, z, Lb + 0.1, 0.5, Wb + 0.1, ang, [wall[0] * 0.9, wall[1] * 0.9, wall[2] * 0.9], [0.5, 0.5, 0.5], true);
          else if (hr() < 0.55) gable(g, x, yb + hh, z, Lb + 0.9, Wb + 0.9, Math.min(3.2, Wb * 0.27), ang, roof, wall);
          else hip(g, x, yb + hh, z, Lb + 0.9, Wb + 0.9, Math.min(3, Wb * 0.27), ang, roof, [roof[0] * 1.08, roof[1] * 1.08, roof[2] * 1.08]);
        }
      }
    }

    /* ---- the utility poles along the road through the villages (where houses stand beside it): grey concrete poles every ~34 m on one side, a
       cross arm, now and then a transformer, the wires sagging from pole to pole ---- */
    let nPoles = 0;
    {
      const town = (x, z) => { let n = 0; const i0 = Math.floor(x / 20), j0 = Math.floor(z / 20); for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) n += bldAt.get(i * 65536 + j) || 0; return n; };
      const pc = [0.66, 0.66, 0.64];
      for (const side of [-1, 1]) {
        let prev = null;
        for (let s = 3 + (side > 0 ? 0 : 17); s < L; s += 34) {
          const [px, pz, i] = onSide(s, side, 0.9);
          if (onBr[i] || town(px, pz) < 3 || town(...onSide(s, -side, 0.9)) > town(px, pz) + 2 || vrNear(px, pz).dd < 0.6 || excluded(px, pz) || inRect(px, pz)) { prev = null; continue; }
          const y = vrGround(px, pz), g = scen.get(px, pz), hd = T.hd[i], top = y + 10.5;
          cyl(g, px, y - 0.3, pz, 0.17, 10.8, 6, pc, null, 0.13);
          box(g, px, top - 0.9, pz, 0.14, 0.14, 1.9, hd, [0.5, 0.5, 0.5]);
          if (rpHash(Math.round(s), side) < 0.25) cyl(g, px - T.nx[i] * side * 0.45, top - 3.4, pz - T.nz[i] * side * 0.45, 0.32, 1.2, 6, [0.6, 0.61, 0.62], [0.5, 0.5, 0.5]);
          exclPush(px, pz, 1.2); nPoles++;
          const tips = [-0.8, 0, 0.8].map(u => [px - Math.sin(hd) * u, top - 0.8, pz + Math.cos(hd) * u]);   // (along the cross arm, across the road)
          tips.push([px, top - 4.2, pz]);
          if (prev && s - prev.s < 40) for (let k = 0; k < 4; k++) sag(prev.tips[k], tips[k], k === 3 ? 0.5 : 0.7, 4);
          prev = { s, tips };
        }
      }
    }

    /* ---- the mountain railway: on the ground its bed of ballast between low shoulders, two rails, on its bridges a steel deck on red girders (a
       truss on the longer spans) and concrete piers; the overhead line's steel masts every ~40 m with their arms over the track, the wires;
       the tunnels' portals; the level crossing (the rails across the road, its gates and signals each side); the stations' platforms with a
       shelter; hydrangeas along the line, in flower in early summer ---- */
    let nHyd = 0, nCross = 0, nRailM = 0, nStop = 0, nPortal = 0;
    const hyd = new IChunks(hkPlantGeo(4), ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut), 96);
    if (rail.length) {
      const bal = [0.42, 0.4, 0.38], balD = [0.34, 0.32, 0.3], top = [0.6, 0.6, 0.62], rust = [0.4, 0.3, 0.24], red = [0.66, 0.2, 0.13], conc = [0.68, 0.67, 0.64], mast = [0.5, 0.55, 0.52];
      const HYD = su ? [[0.62, 0.7, 1], [0.76, 0.64, 0.96], [1, 0.74, 0.84], [0.68, 0.76, 1], [1, 1, 1]] : [[1, 1, 1]];
      const railNear = (x, z) => { const Lq = HKR.cells.get(Math.floor(x / 16) * 65536 + Math.floor(z / 16)); let b = 1e9; if (Lq) for (const s of Lq) { const ex = s[3] - s[0], ez = s[4] - s[1], t = clamp(((x - s[0]) * ex + (z - s[1]) * ez) / (ex * ex + ez * ez || 1), 0, 1); b = Math.min(b, Math.hypot(s[0] + ex * t - x, s[1] + ez * t - z)); } return b; };
      // the platforms: a concrete slab at the height of the rails beside it, a shelter over its middle
      for (const pl of D.plat) {
        const pts = []; for (let k = 0; k + 1 < pl.length; k += 2) pts.push([pl[k] / 10, pl[k + 1] / 10]);
        if (pts.length > 3 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 0.5) pts.pop();
        let cx = 0, cz = 0; for (const p of pts) { cx += p[0] / pts.length; cz += p[1] / pts.length; }
        let yr = null, bd = 1e9; for (const q of rail) for (const o of q) { const d = Math.hypot(o.x - cx, o.z - cz); if (d < bd) { bd = d; yr = o.y; } }
        if (yr == null || bd > 30 || vrDist(cx, cz) > 62) continue;
        const y = yr + 0.95, g = scen.get(cx, cz), pc = [0.74, 0.73, 0.7], in2 = [cx, y - 5, cz];
        for (let k = 0; k < pts.length; k++) { const p = pts[k], q2 = pts[(k + 1) % pts.length];
          g.triO([cx, y, cz], [p[0], y, p[1]], [q2[0], y, q2[1]], pc, in2); g.quadO([p[0], y, p[1]], [q2[0], y, q2[1]], [q2[0], y - 1.4, q2[1]], [p[0], y - 1.4, p[1]], [0.6, 0.59, 0.56], [cx, y - 0.7, cz]); }
        let fa = 0, fb = 0, best = 0; for (let k = 0; k < pts.length; k++) for (let j = k + 1; j < pts.length; j++) { const d = Math.hypot(pts[j][0] - pts[k][0], pts[j][1] - pts[k][1]); if (d > best) { best = d; fa = k; fb = j; } }
        const ux = (pts[fb][0] - pts[fa][0]) / best, uz = (pts[fb][1] - pts[fa][1]) / best, ang = Math.atan2(uz, ux), len = best * 0.5;
        for (let u = -len / 2; u <= len / 2 + 0.01; u += Math.max(4, len / 4)) box(g, cx + ux * u, y, cz + uz * u, 0.2, 2.9, 0.2, ang, [0.5, 0.5, 0.52]);
        box(g, cx, y + 2.9, cz, len + 1, 0.22, 3.4, ang, [0.4, 0.42, 0.46]);
        exclPush(cx, cz, Math.max(4, best / 2));
      }
      for (const q of rail) {
        let lastMast = -99;
        for (let k = 0; k + 1 < q.length; k++) {
          const a = q[k], b = q[k + 1]; if (a.g === 2) continue;
          if (a.g === 0 && Math.min(a.dd, b.dd) < 0.3) continue;   // (across the road and its verge: the level crossing's own rails)
          const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, tx = dx / l, tz = dz / l, nx = -tz, nz = tx, g = scen.get(a.x, a.z), inn = [(a.x + b.x) / 2, Math.min(a.y, b.y) - 3, (a.z + b.z) / 2];
          const Pq = (p, o, y) => [p.x + nx * o, p.y + y, p.z + nz * o];
          nRailM += l;
          if (a.g === 1) {   // a bridge: the deck, the girders under its edges, a truss on the long ones, a pier every ~18 m
            g.quadUp(Pq(a, -1.9, 0.05), Pq(a, 1.9, 0.05), Pq(b, 1.9, 0.05), Pq(b, -1.9, 0.05), [balD, balD, balD, balD]);
            for (const sd of [-1, 1]) { const o0 = sd * 1.9; g.quadO(Pq(a, o0, 0.05), Pq(b, o0, 0.05), Pq(b, o0, -1.25), Pq(a, o0, -1.25), red, [inn[0], a.y, inn[2]]); }
            g.quadO(Pq(a, -1.9, -1.25), Pq(a, 1.9, -1.25), Pq(b, 1.9, -1.25), Pq(b, -1.9, -1.25), [0.5, 0.16, 0.1], [inn[0], a.y + 5, inn[2]]);
            let run = 0; for (let j = k; j < q.length - 1 && q[j].g === 1; j++) run++;
            let back = 0; for (let j = k; j >= 0 && q[j].g === 1; j--) back++;
            if (run + back > 11) for (const sd of [-1, 1]) {   // (a truss on a span over ~30 m: its top chords and a post every ~6 m)
              const p0 = Pq(a, sd * 2.0, 3.25), p1 = Pq(b, sd * 2.0, 3.25), ang = Math.atan2(tz, tx);
              box(g, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2, l + 0.1, 0.36, 0.3, ang, red);
              if (k % 2 === 0) box(g, p0[0], a.y + 0.05, p0[2], 0.24, 3.3, 0.24, ang, red); }
            if (k % 6 === 0) { const gy = vrGround(a.x, a.z), nq = vrNear(a.x, a.z); if (gy < a.y - 2 && !(nq.i >= 0 && nq.dd < 0.5)) box(g, a.x, gy - 1, a.z, 1.6, a.y - 1.25 - gy + 1, 3.4, Math.atan2(tz, tx), conc); }
          } else {   // on the ground: the ballast bed between its shoulders
            const sh = [[-2.3, -0.55], [-1.6, 0.0], [1.6, 0.0], [2.3, -0.55]], cb = [balD, bal, bal, balD];
            for (let j = 0; j < 3; j++) g.quadUp(Pq(a, sh[j][0], sh[j][1]), Pq(a, sh[j + 1][0], sh[j + 1][1]), Pq(b, sh[j + 1][0], sh[j + 1][1]), Pq(b, sh[j][0], sh[j][1]), [cb[j], cb[j + 1], cb[j + 1], cb[j]]);
            // hydrangeas along it, both sides (not by the road, not on the steep banks)
            if (vrDist(a.x, a.z) < 60) for (const sd of [-1, 1]) for (let f = 0; f < 1; f += 0.55) {
              if (R() > 0.5 * (LOD.tier === 0 ? 0.6 : 1)) continue;
              const o = sd * (2.7 + R() * 0.8), x = lerp(a.x, b.x, f) + nx * o, z = lerp(a.z, b.z, f) + nz * o, nq = vrNear(x, z);
              if ((nq.i >= 0 && nq.dd < 0.8) || vrSlope(x, z) > 0.9 || inRect(x, z) || excluded(x, z) || railNear(x, z) < 2.4) continue;   // (not between two tracks, not on a platform)
              const hs = 0.9 + R() * 0.6; hyd.add(x, vrGround(x, z) - 0.05, z, R() * TAU, hs * (1.1 + R() * 0.3), hs, HYD[Math.floor(R() * HYD.length)]); nHyd++; exclPush(x, z, 1);
            }
          }
          // the two rails
          for (const o of [-0.72, 0.72]) { const y = 0.17; g.quadUp(Pq(a, o - 0.04, y), Pq(a, o + 0.04, y), Pq(b, o + 0.04, y), Pq(b, o - 0.04, y), [top, top, top, top]);
            for (const e of [-0.04, 0.04]) g.quadO(Pq(a, o + e, y), Pq(b, o + e, y), Pq(b, o + e, 0.02), Pq(a, o + e, 0.02), rust, Pq(a, o - e * 4, 0.1)); }
          // the overhead line: a mast every ~40 m (on the side away from the road), the wires
          const along = k * 3;
          if (along - lastMast >= 39) { lastMast = along; const sd = (() => { const nq = vrNear(a.x + nx * 3, a.z + nz * 3), nq2 = vrNear(a.x - nx * 3, a.z - nz * 3); return (nq.i < 0 ? 99 : nq.d) >= (nq2.i < 0 ? 99 : nq2.d) ? 1 : -1; })();
            const p = Pq(a, sd * 2.5, 0), y0 = a.g === 1 ? a.y - 0.2 : Math.min(vrGround(p[0], p[2]), a.y) - 0.3;
            box(g, p[0], y0, p[2], 0.28, a.y + 6.6 - y0, 0.28, Math.atan2(tz, tx), mast);
            const arm = Pq(a, sd * 1.1, 6.15); box(g, arm[0], arm[1], arm[2], 2.9, 0.16, 0.16, Math.atan2(nz, nx), mast);
            if (a.mw) { sag(a.mw[0], [a.x, a.y + 6.2, a.z], 0.5, 3); sag(a.mw[1], [a.x, a.y + 5.3, a.z], 0.12, 2); }
            const nk = q.findIndex((o, j) => j > k && (j - k) * 3 >= 39); if (nk > 0) q[nk].mw = [[a.x, a.y + 6.2, a.z], [a.x, a.y + 5.3, a.z]];
          }
          // a tunnel's portal where the line goes into the hill
          if (b.g === 2 && a.g !== 2) { const p = Pq(b, 0, 0), ang = Math.atan2(tz, tx) + Math.PI / 2; box(g, p[0] - tx * 0.6, p[1] - 0.4, p[2] - tz * 0.6, 6.4, 7.2, 1.2, ang, conc); box(g, p[0] - tx * 1.25, p[1], p[2] - tz * 1.25, 3.6, 4.9, 0.1, ang, [0.08, 0.08, 0.09]); }
          if (k > 0 && q[k - 1].g === 2 && a.g !== 2) { const p = Pq(a, 0, 0), ang = Math.atan2(tz, tx) + Math.PI / 2; box(g, p[0] + tx * 0.6, p[1] - 0.4, p[2] + tz * 0.6, 6.4, 7.2, 1.2, ang, conc); box(g, p[0] + tx * 1.25, p[1], p[2] + tz * 1.25, 3.6, 4.9, 0.1, ang, [0.08, 0.08, 0.09]); }
        }
      }
      // the free ends: a buffer stop (two posts, a red beam with a white plate across the end of the rails, a concrete block behind) or, where
      // the line runs on into the hills, a tunnel's portal
      for (const e of HKR.ends) {
        const g = scen.get(e.x, e.z), nx = -e.tz, nz = e.tx, ang = Math.atan2(e.tz, e.tx);
        if (e.far) { box(g, e.x - e.tx * 0.6, e.y - 0.4, e.z - e.tz * 0.6, 6.4, 7.2, 1.2, ang + Math.PI / 2, conc); box(g, e.x - e.tx * 1.25, e.y, e.z - e.tz * 1.25, 3.6, 4.9, 0.1, ang + Math.PI / 2, [0.08, 0.08, 0.09]); nPortal++; continue; }
        const bx = e.x + e.tx * 0.4, bz = e.z + e.tz * 0.4;
        for (const sd of [-1, 1]) box(g, bx + nx * sd * 0.72, e.y - 0.1, bz + nz * sd * 0.72, 0.22, 1.05, 0.22, ang, [0.3, 0.3, 0.32]);
        box(g, bx, e.y + 0.5, bz, 0.3, 0.38, 2.5, ang, [0.78, 0.13, 0.1]);
        box(g, bx - e.tx * 0.17, e.y + 0.52, bz - e.tz * 0.17, 0.04, 0.34, 0.7, ang, [0.92, 0.92, 0.9]);
        box(g, bx + e.tx * 1.0, e.y - 0.3, bz + e.tz * 1.0, 1.4, 1.1, 3.2, ang, conc);
        nStop++;
      }
      out.marks.railEnds = HKR.ends.map(e => [Math.round(e.x), Math.round(e.z), e.far ? 'portal' : 'stop']);
      // the level crossing(s): the rails across the road (a dark rubber panel between them), the gates (striped booms raised) and the signals
      const yb = [[0.95, 0.8, 0.1], [0.1, 0.1, 0.1]];
      for (const c of cross) {
        const q = rail[c.line], a = q[Math.max(0, c.k - 1)], b = q[Math.min(q.length - 1, c.k + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, tx = dx / l, tz = dz / l, nx = -tz, nz = tx, i = c.i;
        if (cross.some(o => o !== c && o.line === c.line && Math.abs(o.k - c.k) < 6 && o.k < c.k)) continue;
        const g = scen.get(c.x, c.z), hy = T.hy[i] + 0.04, ext = Math.max(T.bl[i], T.br[i]) + 1;
        const P3 = (u, o) => { const x = c.x + tx * u + nx * o, z = c.z + tz * u + nz * o, nq = vrNear(x, z); return [x, (nq.i >= 0 && nq.d < w + 0.6 ? nq.hn + 0.04 : vrGround(x, z) + 0.06), z]; };
        for (let u = -ext; u < ext; u += 1) { g.quadUp(P3(u, -1.1), P3(u, 1.1), P3(u + 1, 1.1), P3(u + 1, -1.1), [[0.2, 0.2, 0.21], [0.2, 0.2, 0.21], [0.2, 0.2, 0.21], [0.2, 0.2, 0.21]]);
          for (const o of [-0.72, 0.72]) { const A = P3(u, o - 0.04), B2 = P3(u + 1, o - 0.04), C2 = P3(u + 1, o + 0.04), D2 = P3(u, o + 0.04); for (const p of [A, B2, C2, D2]) p[1] += 0.01; g.quadUp(A, D2, C2, B2, [top, top, top, top]); } }
        for (const sd of [-1, 1]) { const o = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + 0.9), px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o, gy = vrGround(px, pz), hd = T.hd[i];
          for (const e of [-2.4, 2.4]) { const qx = px + tx * e * sd, qz = pz + tz * e * sd;
            box(g, qx, gy - 0.2, qz, 0.18, 3.4, 0.18, hd, [0.92, 0.92, 0.9]);   // the signal's post: the crossbuck, two red lamps
            for (const r of [0.6, -0.6]) box(g, qx, gy + 2.7, qz, 1.3, 0.22, 0.06, hd + r, yb[0]);
            box(g, qx, gy + 2.05, qz, 0.95, 0.34, 0.16, hd, [0.12, 0.12, 0.12]); }
          const bx = px + tx * 3.4 * sd, bz = pz + tz * 3.4 * sd; box(g, bx, gy - 0.2, bz, 0.4, 1.2, 0.4, hd, [0.92, 0.92, 0.9]);   // the gate: its box and the boom raised
          for (let k2 = 0; k2 < 6; k2++) box(g, bx, gy + 1 + k2 * 0.9, bz, 0.12, 0.9, 0.12, hd, yb[k2 % 2]);
        }
        out.marks.crossing = [c.x, c.z]; nCross++;
      }
    }
    hyd.addTo(root, true);

    /* ---- the old Tōkaidō's stone paving (HK_DATA.paving: beside the road and across it, within ~60 m): a path of big grey stones 1.8 m wide
       on the ground, mossy in the forest ---- */
    let nPave = 0;
    if (D) {
      const gpv = new Chunks(110, true), pMat = new THREE.MeshLambertMaterial({ map: tex.paving || null, vertexColors: true });
      for (const pv of D.paving) {
        const pts = []; for (let k = 0; k + 1 < pv.length; k += 2) pts.push([pv[k] / 10, pv[k + 1] / 10]);
        const q = []; for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(l / 1.5)); for (let j = 0; j < m; j++) q.push([lerp(a[0], b[0], j / m), lerp(a[1], b[1], j / m)]); }
        q.push(pts[pts.length - 1]); let u = 0;
        for (let k = 0; k + 1 < q.length; k++) {
          const a = q[k], b = q[k + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * 0.9, nz = dx / l * 0.9;
          const na = vrNear(a[0], a[1]), nb = vrNear(b[0], b[1]); if ((na.i >= 0 && na.dd < 0.4) || (nb.i >= 0 && nb.dd < 0.4) || vrDist(a[0], a[1]) > 64) { u += l; continue; }
          const g = gpv.get(a[0], a[1]), y = (x, z) => vrGround(x, z) + 0.07, P4 = [[a[0] - nx, a[1] - nz], [a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz]];
          const mo = (x, z) => { const m = P.n6(x * 3, z * 3); return [0.5 + 0.12 * m - 0.08 * sstep(0.5, 0.9, P.n4(x * 2, z * 2)), 0.5 + 0.1 * m, 0.46 + 0.08 * m]; };
          g.quadUp(...P4.map(p => [p[0], y(p[0], p[1]), p[1]]), P4.map(p => mo(p[0], p[1])), [[0, u / 2.4], [0.75, u / 2.4], [0.75, (u + l) / 2.4], [0, (u + l) / 2.4]]);
          exclPush((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 1.6); u += l; nPave++;
        }
      }
      gpv.addTo(root, pMat, false, true);
    }

    /* ---- the torii at Hatajuku (HK_DATA.gates, the one by the road): two vermilion pillars, the black-topped beam with its ends turned up, the
       tie beam ---- */
    if (D) for (const gt of D.gates) if (!gt[4]) {
      const [x, z, wd, a] = gt, nq = vrNear(x, z); if (nq.i >= 0 && nq.dd < 1) continue;
      const y = vrGround(x, z), g = scen.get(x, z), red = [0.84, 0.22, 0.11], blk = [0.12, 0.1, 0.1], hw = Math.max(1.6, wd / 2), hh = hw * 2 + 1.2, c = Math.cos(a), s = Math.sin(a);
      for (const sd of [-1, 1]) cyl(g, x + c * sd * hw, y - 0.3, z + s * sd * hw, 0.2, hh + 0.3, 8, red, null, 0.17);
      box(g, x, y + hh - 0.05, z, hw * 2 + 1.6, 0.36, 0.5, a, red); box(g, x, y + hh + 0.3, z, hw * 2 + 2.0, 0.26, 0.62, a, blk);
      for (const sd of [-1, 1]) box(g, x + c * sd * (hw + 1.1), y + hh + 0.42, z + s * sd * (hw + 1.1), 0.5, 0.24, 0.62, a + sd * 0.0, blk);
      box(g, x, y + hh * 0.72, z, hw * 2 + 0.9, 0.28, 0.32, a, red);
      exclPush(x, z, hw + 2); out.marks.torii = [x, z];
    }

    /* ---- spectators: the start, a few groups at the Ōhiradai hairpin, the summit, the Seven Bends and Sanmaibashi (CLAUDE.md: few on the real tracks) ---- */
    {
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: (x, z) => excluded(x, z) || inRect(x, z), sit: 0.25, flag: 0.1, keepBar: 1.6 };
      for (const sd of [-1, 1]) crowdRun(CR, sStart - 70, sStart + 70, sd, Object.assign({}, M, { rows: 3, dens: 0.6, label: 'HK start' }));
      const spots = [['Ōhiradai', 0, 50, 0.4], ['Vrh · 874 m', 0, 50, 0.4], ['Sedem ovinkov', 60, 80, 0.3], ['Sanmaibashi', 0, 40, 0.35]];   // (a few groups only: CLAUDE.md, the real tracks' roadside spectators)
      for (const [nm, off, len, dn] of spots) { const q = T.names.find(o => o.n === nm); if (!q) continue; const s0 = at(q.d + off);
        for (const sd of [-1, 1]) crowdRun(CR, s0 - len / 2, s0 + len / 2, sd, Object.assign({}, M, { rows: 2, dens: dn, label: 'HK ' + nm })); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);   // the trees keep clear of the crowds

    /* ---- the forest (instanced per 96 m chunk): the canopy model's trees within 60 m of the road (HK_DATA.trees: it finds only the tallest tops,
       the stands are closer) and as many more where the land cover has woods and no tree of the model stands near; cedars in their stands (the
       plantations, a smooth noise) and all along the cedar avenue of the old road, broadleaves, maples by the road, bamboo by the villages lower
       down; taller than the model makes them (it reads the canopy low: the old cedars stand 25-40 m). Thinned for the phone (the user's wish,
       2. 11. 2026: fewer trees and cedars): of the model's trees ~70 % within 12 m of the road, ~55 % to 25 m, ~45 % beyond it (fewer still on
       the lower tiers), the fill sparser, the cedars' stands smaller; none on the railway's bed or under its bridges. Sasa (dwarf bamboo, green
       the year round) in clumps on the verges ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 3, 5].map(k => new IChunks(hkPlantGeo(k), tMatT, 96)); out.treeMat = tMatT;
    let nTrees = 0, nFill = 0, nSasa = 0, nCedar = 0;
    if (H) {
      const av = D.avenue || [0, 0], avA = at(av[0]), avB = at(av[1]), inAv = (i) => { const s = i * ds; return avA < avB ? s > avA && s < avB : s > avA || s < avB; };
      const MAPLE = su ? [[1, 1, 1], [0.92, 1.05, 0.9], [1.1, 1.02, 1.05]] : [[1, 1, 1], [0.8, 0.55, 0.9], [1.08, 2.7, 1.3], [1.1, 4.0, 1.6], [1.02, 1.6, 1.0]];
      const thin = (LOD.tier === 0 ? 0.7 : LOD.tier === 1 ? 0.85 : 1) * dens;
      const TH = new Map(), TC = 6, tkey = (x, z) => Math.floor(x / TC) * 65536 + Math.floor(z / TC);
      for (let k = 0; k < H.n; k++) { const kk = tkey(H.tx[k], H.tz[k]); let Lq = TH.get(kk); if (!Lq) TH.set(kk, Lq = []); Lq.push(k); }
      const treeNear = (x, z, r) => { const i0 = Math.floor(x / TC), j0 = Math.floor(z / TC);
        for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) { const Lq = TH.get(i * 65536 + j); if (!Lq) continue; for (const k of Lq) { const dx = H.tx[k] - x, dz = H.tz[k] - z; if (dx * dx + dz * dz < r * r) return true; } }
        return false; };
      const plant = (x, z, h0) => {   // (h0: the model's height, null for a tree of the fill)
        const r1 = rpHash(x * 1.7, z * 1.3), r2 = rpHash(z * 0.9, x * 2.1), r3 = rpHash(x + z, x - z), r4 = rpHash(x * 0.37 + 11, z * 0.53 - 7);
        const nn = vrNear(x, z); if (nn.i < 0) return false; const dd = nn.dd;
        if (dd < (h0 == null ? 1.8 : 1.1) || (dd < 3 && r2 < 0.3)) return false;
        const avenue = dd < 16 && inAv(nn.i);   // (the cedar avenue of the old road: all its trees)
        if (!avenue && r4 > (dd < 12 ? 0.7 : dd < 25 ? 0.55 : 0.45 * thin)) return false;
        if (hkRailD(x, z) < 4) return false;
        if (excluded(x, z) || inRect(x, z) || vrWater(x, z).e > -1.5 || vrSlope(x, z) > 1.5) return false;
        const y = vrGround(x, z), A = y + base;
        let sp;
        if (avenue) sp = 0;
        else if (A < 560 && vrLCf(x, z, 3) > 0.15 && dd < 30 && P.n5(x * 1.6, z * 1.6) > 0.5) sp = 3;
        else if (P.n1(x * 1.1, z * 1.1) > 0.66) sp = 0;
        else if (dd < 14 && r1 < 0.3) sp = 2;
        else sp = 1;
        const hm = h0 == null ? (sp === 0 ? 13 + r3 * 7 : sp === 1 ? 9 + r3 * 6 : 7 + r3 * 4) : h0;
        let hg, wd, col;
        if (sp === 0) { hg = avenue ? clamp(hm * 2.1, 26, 40) : clamp(hm * 1.75, 14, 38); wd = hg * (0.26 + r2 * 0.07); col = [0.88 + r1 * 0.2, 0.92 + r3 * 0.14, 0.9]; }
        else if (sp === 1) { hg = clamp(hm * 1.3, 7, 24); wd = hg * (0.82 + r2 * 0.3); col = su ? (r1 < 0.3 ? [0.86, 1.02, 0.9] : r1 < 0.7 ? [1, 1, 1] : [1.1, 1.08, 1.0]) : (r1 < 0.35 ? [1.2, 1.25, 1.1] : r1 < 0.7 ? [1, 1, 1] : [0.8, 0.7, 0.8]); }
        else if (sp === 2) { hg = clamp(hm * 0.9, 5, 11); wd = hg * (1.0 + r2 * 0.25); col = MAPLE[Math.floor(r3 * 997) % MAPLE.length]; }
        else { hg = 8 + r2 * 7; wd = hg * (0.42 + r1 * 0.12); col = [0.95 + r1 * 0.1, 1, 0.95]; }
        tk[sp === 3 ? 3 : sp].add(x, y - 0.15, z, r1 * 70, wd, hg, col); if (sp === 0) nCedar++; return true;
      };
      for (let k = 0; k < H.n; k++) if (plant(H.tx[k], H.tz[k], H.th[k])) nTrees++;
      const G = P.G, Lt = VRC * VRT, SP = 6.4, RT = rng(4447);
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r = RT();
          if (vrDist(x, z) > 60) continue;
          const c = API.vrLC(x, z), p = c === 1 ? 0.6 : c === 2 ? 0.35 : c === 0 ? 0.05 : c === 3 ? 0.03 : 0;
          if (r > p || treeNear(x, z, 4.6)) continue;
          if (plant(x, z, null)) nFill++;
        }
      }
      // sasa on the verges: clumps 1-7 m past the barrier line in the woods and on the open ground (not in the villages)
      const RS = rng(4451), sasaP = LOD.tier === 0 ? 0.2 : 0.3;
      for (let s = 2; s < L - 2; s += 2.6) for (const side of [-1, 1]) {
        if (RS() > sasaP) continue;
        const [x, z] = onSide(s, side, 1.0 + RS() * 6), c = API.vrLC(x, z); if (c === 3 || c === 5) continue;
        const nn = vrNear(x, z); if (nn.i < 0 || nn.dd < 0.7 || excluded(x, z) || inRect(x, z) || vrSlope(x, z) > 1.1 || vrWater(x, z).e > -1 || hkRailD(x, z) < 3.2) continue;
        const sz = 0.9 + RS() * 0.8; tk[4].add(x, vrGround(x, z) - 0.08, z, RS() * TAU, sz * 1.3, sz * 0.75, [0.9 + RS() * 0.2, 0.95 + RS() * 0.15, 0.9]); nSasa++;
      }
    }
    for (const t of tk) t.addTo(root, true);

    /* ---- the view: the caldera, Lake Ashi, the sea and Mount Fuji beyond the corridor (hkFar; World.update moves it with the camera: dyn.ext) ---- */
    const FAR = hkFar(base, def.fuji !== 'real');
    if (FAR) { for (const o of FAR.meshes) root.add(o); out.dyn.ext = (t, car, cam) => hkFarUpdate(FAR, car ? cam : null, car ? t : 0); }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    if (wires.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3)); g.computeBoundingSphere();
      const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x1c1d1f })); m.matrixAutoUpdate = false; m.name = 'hkWires'; root.add(m); }
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, fill: nFill, sasa: nSasa, tiles: nTiles, farTiles: nFar, rails: +(nRail / (2 * N)).toFixed(3), base, buildings: nBld, poles: nPoles, hydrangeas: nHyd, crossings: nCross, railM: Math.round(nRailM), stops: nStop, portals: nPortal, cedars: nCedar, paving: nPave, far: FAR ? FAR.P0.length / 3 : 0, boats: FAR ? FAR.boats.length : 0, fujiOver: !!(FAR && FAR.mesh2) };   // (read by the tests)
    return out;
  }

  World.ext.hakone = (scene, tex, opts) => buildHakone(scene, tex, opts);
})();
