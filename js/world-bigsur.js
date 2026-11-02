/* =========================================================================
   WORLD — Big Sur (theme 'bigsur'): its own builder (World.ext.bigsur), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    CAN, Chunks, GB, IChunks, TAU, VRC, VRT, addShore, atSf, box, caCar, caCondorGeo, caCondors, caNear, caPlantGeo, caProps, clamp, crowdCtx,
    crowdFinish, crowdPut, crowdRun, cyl, gable, ico, lerp, ouCutMat, ouRod, pkGroundMat, rng, rock, rpHash, shoreBand, sstep, stubExcl, stubGeo,
    stubProps, stubRails, stubVerge, tuftWindMat, valueNoise2, vary, vrDem, vrDist, vrGritTex, vrHouse, vrLC, vrLCf, vrNear, vrPrep, vrStubAt,
    vrStubH, waterMat, waterline
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= BIG SUR (theme 'bigsur') =================
     Big Sur (California): Highway 1 along the cliffs over the Pacific, over the Rocky Creek and Bixby Creek bridges (the concrete open-spandrel
     arches of 1932) up to Hurricane Point, on a clear afternoon by the sea. Built on Vršič's corridor (vrPrep reads the same forms: def.dem,
     def.lc, def.bld, def.bridges) and Los Caracoles' road blend (caNear), with a look of its own: the real gorges under the bridges (no fill:
     bsH lets the terrain model through under the deck), golden grass and sage-green coastal scrub on the slopes, Monterey cypresses and pines
     in the gullies and on the bluffs, the sandstone and granite cliffs; the Pacific (waterMat: its waves, the surf and the foam at the foot of
     the cliffs and round the rocks, shoreBand) below the coast line of the terrain; the two arch bridges with their ribs, spandrel columns,
     pylons and approach piers; the gravel Old Coast Road into the Bixby Creek canyon (def.oldRoad); the pull-outs on the ocean side (def.wide:
     a gravel apron, the sightseers at its edge); the marine layer (dyn.bsMist: the fog bank lying off the coast, and on a misty run, def.mist,
     the fog over the road too: a closer, greyer haze, a veiled sun). */
  const BSCOL = [0, 0, 0];
  let BS = null;   // per build: the bridges' weight per road sample (the terrain model shows through under them), the sea level
  function bsFar(x, z) {   // the land away from the road: the terrain model, a little made-up relief on the land (none on the sea floor)
    const P = API.VR, h = vrDem(x, z); return h + BS.y0 > 3 ? h + (P.n1(x, z) - 0.5) * 3 + (P.n2(x, z) - 0.5) * 1.2 : h;
  }
  function bsH(x, z) {   // terrain height: as caH (the road's blend near it), but under a bridge the real gorge
    const n = caNear(x, z), i = n.i, dd = n.dd, far = bsFar(x, z);
    if (i < 0) return API.STG ? vrStubH(x, z, far, 999) : far;
    const hr = n.h - 0.3, b = BS.brW[i]; let h = dd <= 1 ? hr : lerp(hr, far, sstep(1, 42, dd));
    if (b > 0) h = lerp(Math.min(h, n.env), Math.min(far, n.h - 4), b); else h = Math.min(h, n.env);
    if (API.STG) h = vrStubH(x, z, h, dd);   // the side roads: the ground levelled under them
    return h;
  }
  function bsGH(i, j) {   // terrain height at grid vertex (i, j), computed once (VR.G)
    const G = API.VR.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = bsH(G.x0 + i * VRC, G.z0 + j * VRC); G.dd[k] = CAN.i >= 0 ? CAN.dd : 999; }
    return h;
  }
  function bsGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / VRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = bsGH(i, j); return a + u * (bsGH(i + 1, j) - a) + v * (bsGH(i, j + 1) - a); }
    const d = bsGH(i + 1, j + 1); return d + (1 - u) * (bsGH(i, j + 1) - d) + (1 - v) * (bsGH(i + 1, j) - d);
  }
  function bsSlope(x, z) { const a = bsGround(x - 2.5, z), b = bsGround(x + 2.5, z), c = bsGround(x, z - 2.5), d = bsGround(x, z + 2.5); return Math.hypot(b - a, d - c) / 5; }
  function bsScrub(x, z) {   // how much of the ground the coastal scrub covers (0 .. 1): its own land cover (lc 1), round the trees (lc 2), in patches (the noise
    // at 26 m and 210 m) and down the hollows and gullies (the terrain model round the point higher than the point), thinner on the ridges
    const P = API.VR, h0 = vrDem(x, z), gul = clamp(((vrDem(x - 24, z) + vrDem(x + 24, z) + vrDem(x, z - 24) + vrDem(x, z + 24)) / 4 - h0) / 5, -1, 1);
    const n = P.c3(x, z) * 0.55 + P.c5(x, z) * 0.45;
    return clamp(vrLCf(x, z, 1) * 0.7 + vrLCf(x, z, 2) * 0.45 + sstep(0.5, 0.7, n) * 0.6 + Math.max(0, gul) * 0.7 - Math.max(0, -gul) * 0.35, 0, 1);
  }
  function bsCol(x, z, h, ny, dd, sx, sz) {   // ground colour (times the grit map): the golden summer grass (paler on the ridges, olive streaks), the coastal
    // scrub in dark sage-green patches down the hollows (bsScrub, mottled), the dark floor under the cypresses and pines (lc 2), mats of ice plant on
    // the bluffs above the sea (olive and red, pink flowers), sandstone and granite on the steep faces (lc 4 and wherever the slope is steep), darker
    // and greyer down the sea cliffs, dark wet rock at the waterline, a trodden gravel verge by the road
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), f = P.n4(x, z), fine = P.n6(x, z);
    const tr = vrLCf(x, z, 2), rk = vrLCf(x, z, 4) + vrLCf(x, z, 3) * 0.5, sc = bsScrub(x, z);
    let R = 0.77, G = 0.66, B = 0.4;   // the dry grass, golden
    const oli = sstep(0.5, 0.82, m) * 0.55; R = lerp(R, 0.6, oli); G = lerp(G, 0.58, oli); B = lerp(B, 0.34, oli);   // (greener, olive swathes)
    const pale = sstep(0.62, 0.9, q) * 0.5; R = lerp(R, 0.84, pale); G = lerp(G, 0.75, pale); B = lerp(B, 0.52, pale);   // (pale, bleached patches)
    const scr = sstep(0.18, 0.62, sc), mot = 0.86 + 0.28 * fine;
    R = lerp(R, 0.33 * mot, scr); G = lerp(G, 0.39 * mot, scr); B = lerp(B, 0.24 * mot, scr);   // the scrub: dark sage-green
    R = lerp(R, 0.25, tr * 0.75); G = lerp(G, 0.3, tr * 0.75); B = lerp(B, 0.18, tr * 0.75);   // under the trees
    R += (f - 0.5) * 0.09; G += (f - 0.5) * 0.08; B += (f - 0.5) * 0.06;
    const ice = A > 6 && A < 75 ? sstep(0.66, 0.8, P.c4(x, z)) * sstep(0.62, 0.8, ny) * sstep(0.99, 0.9, ny) * (1 - tr) : 0;   // ice plant on the slopes over the sea
    if (ice > 0) { const fl = sstep(0.62, 0.8, fine); R = lerp(R, lerp(0.5, 0.78, fl), ice); G = lerp(G, lerp(0.46, 0.36, fl), ice); B = lerp(B, lerp(0.26, 0.48, fl), ice); }
    const st = Math.max(sstep(0.8, 0.55, ny), rk * sstep(0.95, 0.75, ny) * 0.9, rk * 0.5);   // rock: the steep faces, the bare ground
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 3.7 + P.c2(x * 0.5, z * 0.5) * 6), k = 0.8 + 0.2 * band, gr = sstep(0.5, 0.8, q), lo = sstep(45, 8, A);
      const rr = lerp(lerp(0.6, 0.5, gr), 0.4, lo) * k, rg = lerp(lerp(0.52, 0.49, gr), 0.37, lo) * k, rb = lerp(lerp(0.42, 0.46, gr), 0.34, lo) * k;
      R = lerp(R, rr, st); G = lerp(G, rg, st); B = lerp(B, rb, st); }
    const sand = A > 0.2 && A < 4.5 ? sstep(0.88, 0.96, ny) * sstep(4.5, 2, A) * (1 - tr) : 0;   // the coves' beaches: pale sand where the shore is gentle, wet and darker at the water
    if (sand > 0) { const w = sstep(2.2, 0.4, A), k = 0.94 + 0.12 * fine; R = lerp(R, lerp(0.8, 0.58, w) * k, sand); G = lerp(G, lerp(0.74, 0.53, w) * k, sand); B = lerp(B, lerp(0.6, 0.44, w) * k, sand); }
    const wet = sstep(4, 0.8, A) * (1 - sand); if (wet > 0) { R = lerp(R, 0.24, wet); G = lerp(G, 0.23, wet); B = lerp(B, 0.22, wet); }   // the splash zone, dark
    if (A < 0.2) { const d = sstep(0.2, -6, A); R = lerp(0.36, 0.18, d); G = lerp(0.35, 0.24, d); B = lerp(0.3, 0.25, d); }   // (the sea floor)
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.5; R = lerp(R, 0.62, t); G = lerp(G, 0.58, t); B = lerp(B, 0.5, t); }
    if (A > 1) {   // the light in the folds of the land: the hollows and gullies darker (the sky hidden), the ridges a little brighter
      const h0 = vrDem(x, z), cv = clamp(((vrDem(x - 20, z) + vrDem(x + 20, z) + vrDem(x, z - 20) + vrDem(x, z + 20)) / 4 - h0) / 4, -1, 1), k = cv > 0 ? 1 - 0.2 * cv : 1 - 0.07 * cv;
      R *= k; G *= k; B *= k * (cv > 0 ? 1.03 : 1); }
    BSCOL[0] = R; BSCOL[1] = G; BSCOL[2] = B; return BSCOL;
  }
  function bsGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, as caGCol)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = bsGH(ii, jj);
      const nx = -(bsGH(ii + 1, jj) - bsGH(ii - 1, jj)) / (2 * VRC), nz = -(bsGH(ii, jj + 1) - bsGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = bsCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, G.dd[jj * G.nx + ii], nx / l, nz / l);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function bsTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells, in the haze)
    const G = API.VR.G, L = VRC * VRT, d = vrDist(G.x0 + (ti + 0.5) * L, G.z0 + (tj + 0.5) * L);
    return d < 300 ? 1 : d < 430 ? 2 : 0;
  }
  function bsTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by bsCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = bsGH(i, j);
      let nx = -(bsGH(i + st, j) - bsGH(i - st, j)) / (2 * VRC * st), nz = -(bsGH(i, j + st) - bsGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = bsCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)], nx, nz); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? bsTileOn(a, b) : 0);
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
  function bsMergeGeo(gs) {   // the indexed terrain tiles (position, normal, color, uv, steep) as one geometry
    if (gs.length === 1) return gs[0];
    const names = ['position', 'normal', 'color', 'uv', 'steep'], n = gs.reduce((a, g) => a + g.attributes.position.count, 0), ni = gs.reduce((a, g) => a + g.index.count, 0);
    const out = new THREE.BufferGeometry(), idx = n > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    for (const nm of names) { const is = gs[0].attributes[nm].itemSize, arr = new Float32Array(n * is); let o = 0; for (const g of gs) { arr.set(g.attributes[nm].array, o); o += g.attributes[nm].array.length; } out.setAttribute(nm, new THREE.BufferAttribute(arr, is)); }
    let v0 = 0, o = 0; for (const g of gs) { const a = g.index.array; for (let k = 0; k < a.length; k++) idx[o++] = a[k] + v0; v0 += g.attributes.position.count; g.dispose(); }
    out.setIndex(new THREE.BufferAttribute(idx, 1)); out.computeBoundingSphere(); return out;
  }
  let bsATex = null, bsAKey = '';   // (the board atlas, made once and reused by every build of the road)
  const BS_BOARDS = [['ROCKY CREEK BRIDGE', 0], ['BIXBY CREEK BRIDGE', 0], ['HURRICANE POINT', 0], ['OLD COAST ROAD', 1], ['VISTA POINT', 2], ['CASTLE ROCK', 2], ['SLOW VEHICLES USE TURNOUTS', 3], ['BIG SUR', 0]];
  function bsAtlas(cps, finA) {   // the top half: the gantries' boards (8 rows of 1024 x 64: START, FINISH, CP1-CP4 with the altitude, HURRICANE POINT with
    // its altitude, the race's banner); the bottom half: the road signs, two a row (512 x 128: green guide signs, brown recreation signs, white ones)
    const key = cps.join('|') + '|' + finA; if (bsATex && bsAKey === key) return bsATex;
    if (bsATex) bsATex.dispose(); bsAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 64); chq(0, 0, 128, 64, 32); chq(896, 0, 128, 64, 32); txt('START', 512, 34, 50, '#fff', 700);
    chq(0, 64, 1024, 64, 32); x.fillStyle = '#fff'; x.fillRect(312, 70, 400, 52); txt('FINISH', 512, 97, 46, '#111', 380);
    cps.forEach((a, k) => { const y = 128 + k * 64; x.fillStyle = '#1e5c9a'; x.fillRect(0, y, 1024, 64); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 3, 1024, 3); x.fillRect(0, y + 58, 1024, 3);
      txt('CP' + (k + 1), 300, y + 34, 48, '#fff', 300); txt(a, 700, y + 34, 44, '#ffd23a', 520); });
    x.fillStyle = '#1d5a3a'; x.fillRect(0, 384, 1024, 64); x.strokeStyle = '#f2f2ee'; x.lineWidth = 4; x.strokeRect(6, 390, 1012, 52); txt('HURRICANE POINT  ·  ' + finA, 512, 418, 40, '#f2f2ee', 960);
    x.fillStyle = '#f2efe6'; x.fillRect(0, 448, 1024, 64); x.fillStyle = '#2a6f9e'; x.fillRect(0, 448, 1024, 8); x.fillRect(0, 504, 1024, 8); txt('BIG SUR  ·  HIGHWAY 1', 512, 482, 42, '#16181c', 940);
    const BG = ['#1d6b45', '#6a4322', '#6a4322', '#f4f4f0'];
    BS_BOARDS.forEach(([n, kind], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, w = kind === 3;
      x.fillStyle = BG[kind]; x.fillRect(x0, y0, 512, 128); x.strokeStyle = w ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      if (w) { txt('SLOW VEHICLES', x0 + 256, y0 + 46, 42, '#16181c', 470); txt('USE TURNOUTS', x0 + 256, y0 + 90, 42, '#16181c', 470); }
      else txt(n, x0 + 256, y0 + 66, n.length > 14 ? 46 : 54, '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (bsATex = t);
  }
  function bsTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them), few faces (the top-down cameras see the crowns): 0 a Monterey cypress
    // (a short stout trunk, a broad flat-topped crown in tiers, swept to the south-east by the wind off the sea), 1 a Monterey pine (a taller trunk, a
    // rounded open crown of dark clumps)
    const g = new GB(), R = rng(760 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.36, 0.28, 0.22];
    if (kind === 0) {
      cyl(g, 0, 0, 0, 0.06, 0.5, 5, bark, null, 0.04);
      const C = [0.2, 0.3, 0.17];
      for (const [x, y, z, r] of [[0.0, 0.62, 0.0, 0.3], [0.28, 0.66, 0.16, 0.26], [-0.2, 0.6, -0.12, 0.24], [0.1, 0.58, -0.3, 0.22]]) ico(g, x + 0.1, y, z + 0.06, r * (0.9 + R() * 0.2), 0.42, vary(C, R, 0.25), R, 0.3);
      ico(g, 0.14, 0.82, 0.08, 0.34, 0.3, [0.23, 0.33, 0.19], R, 0.25);
    } else {
      cyl(g, 0, 0, 0, 0.035, 0.66, 5, bark, null, 0.022);
      const C = [0.17, 0.27, 0.16];
      for (const [x, y, z, r] of [[0.14, 0.66, 0.05, 0.17], [-0.12, 0.7, 0.1, 0.16], [0.0, 0.72, -0.15, 0.17]]) ico(g, x, y, z, r * (0.9 + R() * 0.2), 0.7, vary(C, R, 0.3), R, 0.3);
      ico(g, 0, 0.9, 0, 0.2, 0.7, [0.19, 0.29, 0.17], R, 0.25);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function bsBushGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 a bush of the coastal scrub (coyote brush, sage: one soft lumpy mound,
    // 20 faces), 1 a clump of pampas grass on the road cuts (a fountain of grey-green blades, three cream plumes on stalks)
    const g = new GB(), R = rng(780 + kind), rs = API.ROCK_SMOOTH;
    if (kind === 0) { API.ROCK_SMOOTH = true; ico(g, 0, 0.45, 0, 0.62, 0.78, [0.36, 0.42, 0.26], R, 0.35); }
    else {
      const base = [0.42, 0.46, 0.3], tip = [0.62, 0.62, 0.42];
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R() * 0.5, tx = Math.cos(a) * 0.55, tz = Math.sin(a) * 0.55, ox = -Math.sin(a) * 0.12, oz = Math.cos(a) * 0.12;
        g.triO([-ox, 0, -oz], [ox, 0, oz], [tx, 0.55 + R() * 0.15, tz], base, [-tx, 0.3, -tz], base, tip); g.triO([-ox, 0, -oz], [tx, 0.55, tz], [ox, 0, oz], base, [tx, -1, tz], tip, base); }
      const pl = [0.93, 0.88, 0.74], st = [0.6, 0.58, 0.42];
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.4, x = Math.cos(a) * 0.12, z = Math.sin(a) * 0.12, y0 = 0.62 + k * 0.08, ox = -Math.sin(a) * 0.07, oz = Math.cos(a) * 0.07;
        g.triO([x - ox * 0.3, 0.2, z - oz * 0.3], [x + ox * 0.3, 0.2, z + oz * 0.3], [x * 1.3, y0, z * 1.3], st, [x * 1.3 - Math.cos(a), 0.5, z * 1.3 - Math.sin(a)]);
        g.quadO([x * 1.3 - ox, y0, z * 1.3 - oz], [x * 1.3 + ox, y0, z * 1.3 + oz], [x * 1.5 + ox * 0.5, y0 + 0.38, z * 1.5 + oz * 0.5], [x * 1.5 - ox * 0.5, y0 + 0.38, z * 1.5 - oz * 0.5], pl, [x * 1.3 - Math.cos(a) * 2, y0, z * 1.3 - Math.sin(a) * 2]); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function bsSealGeo() {   // a sea lion lying on a rock (x forward, ~2 m): a long soft body tapering to the flippers, the head raised a little
    const g = new GB(), R = rng(791), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    ico(g, 0, 0.2, 0, 0.5, 0.45, [1, 1, 1], R, 0.15); ico(g, -0.6, 0.12, 0, 0.32, 0.4, [0.92, 0.92, 0.92], R, 0.15); ico(g, 0.55, 0.35, 0, 0.2, 0.9, [1.05, 1.05, 1.05], R, 0.1);
    API.ROCK_SMOOTH = rs; const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function bsPelicanGeo() {   // seven brown pelicans in a line, one behind the other a little to the side (x the way they fly): a body, broad wings held flat, the long bill
    const g = new GB(), K = [0.36, 0.32, 0.28], H = [0.86, 0.82, 0.7], B = [0.62, 0.52, 0.36];
    for (let k = 0; k < 7; k++) { const ox = -k * 4.2, oz = k * 1.4 * (k % 2 ? 1 : -0.4), oy = Math.sin(k * 1.7) * 0.4;
      box(g, ox, oy - 0.15, oz, 1.0, 0.3, 0.3, 0, K, null, true); box(g, ox + 0.6, oy, oz, 0.25, 0.2, 0.2, 0, H, null, true); box(g, ox + 1.0, oy - 0.02, oz, 0.6, 0.06, 0.08, 0, B, null, true);
      for (const sd of [-1, 1]) g.quadO([ox + 0.25, oy, oz + sd * 0.12], [ox - 0.25, oy, oz + sd * 0.12], [ox - 0.35, oy + 0.15, oz + sd * 1.1], [ox + 0.15, oy + 0.15, oz + sd * 1.1], K, [ox, oy - 1, oz + sd]); }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function bsPelicanStep(P, t) {   // the flock flies along the road at ~11 m/s, ~60 m out over the water, ~9 m above the waves; at either end it turns back
    const L = P.b - P.a, u = (t * 11) % (2 * L), back = u > L, s = P.a + (back ? 2 * L - u : u), i = T.idx(s), o = Math.max(T.br[i] + 45, 60);
    const x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = Math.max(BS.y0, bsGround(x, z)) + 9 + Math.sin(t * 0.7) * 1.5;
    P.m.position.set(x, y, z); P.m.rotation.set(0, -(T.hd[i] + (back ? Math.PI : 0)), 0);
  }
  function bsCowGeo() {   // a beef cow grazing (x forward, ~2.2 m long; tinted by the instance: black, red-brown, white-faced): the body, the head down to the
    // grass, four legs, the tail; the face and the belly a little paler
    const g = new GB(), C = [1, 1, 1], D = [0.82, 0.82, 0.82], F = [1.25, 1.2, 1.15];
    box(g, 0, 0.55, 0, 1.55, 0.62, 0.6, 0, C, null, true); box(g, -0.05, 0.5, 0, 1.2, 0.12, 0.56, 0, F, null, true);
    box(g, 0.98, 0.22, 0, 0.42, 0.34, 0.3, 0.6, F, null, true); box(g, 0.78, 0.62, 0, 0.3, 0.3, 0.36, 0, C, null, true);
    for (const [x, z] of [[0.6, 0.2], [0.6, -0.2], [-0.6, 0.2], [-0.6, -0.2]]) box(g, x, 0, z, 0.13, 0.56, 0.13, 0, D, null, true);
    box(g, -0.8, 0.5, 0, 0.06, 0.6, 0.06, 0, C, null, true);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function bsMistMat(U) {   // the marine layer's sheets: soft drifting fog (two octaves of noise moving with the wind off the sea), thinner at the sheet's edge
    // and close to the camera; uK how thick (0.3 the fog bank offshore only, 1 a misty run), uC its colour (the haze's, a little whiter)
    return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: U,
      vertexShader: 'varying vec3 vW; varying vec2 vE; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vE = uv; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform float uT; uniform float uK; uniform vec3 uC; uniform float uLand; varying vec3 vW; varying vec2 vE;\n' +
        'float mh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float mn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(mh(i), mh(i + vec2(1.0, 0.0)), f.x), mix(mh(i + vec2(0.0, 1.0)), mh(i + vec2(1.0, 1.0)), f.x), f.y); }\n' +
        'void main(){ vec2 p = vW.xz * 0.006 + vec2(uT * 0.004, -uT * 0.0025); float n = 0.65 * mn(p) + 0.35 * mn(p * 3.1 + 7.0);\n' +
        ' float off = smoothstep(0.0, 0.35, vE.x);\n' +   // (uv.x: 0 at the coast, 1 far out to sea)
        ' float k = uK * mix(off, 1.0, uLand);\n' +
        ' float a = smoothstep(0.35 - 0.25 * k, 0.85, n) * (0.25 + 0.6 * k) * min(1.0, vE.y * 4.0) * min(1.0, (1.0 - vE.y) * 4.0);\n' +
        ' a *= smoothstep(30.0, 140.0, length(vW - cameraPosition));\n' +
        ' gl_FragColor = vec4(uC, clamp(a, 0.0, 0.85)); }' });
  }
  function bsMistStep(M, cam) {   // every frame after the camera (dyn.afterCam): the marine layer thickens or thins towards M.on (Render: the race's opts.mist), the
    // haze closes in and greys, the sun is veiled; the base values are taken again whenever the renderer has set its own since
    const sc = M.root.parent; if (!sc || !sc.fog) return;
    const now = performance.now() / 1000, dt = M.t0 == null ? 1e3 : clamp(now - M.t0, 0, 0.25); M.t0 = now; M.t = (M.t || 0) + dt;
    const want = M.on ? 1 : 0; M.k = dt > 100 ? want : M.k + (want - M.k) * Math.min(1, dt * 0.5);
    const k = M.k, F = sc.fog;
    if (F.color.getHex() !== M.hex) M.base.copy(F.color);
    if (!M.sun) M.sun = sc.children.find(o => o.isDirectionalLight) || null;
    F.color.copy(M.base).lerp(M.mc, 0.72 * k); M.hex = F.color.getHex();
    if (F.near !== M.nearW) M.nearB = F.near; if (F.far !== M.farW) M.farB = F.far;   // (the renderer sets them every frame it follows a car; else ours stay)
    F.near = M.nearB * (1 - 0.8 * k); F.far = M.farB * (1 - 0.6 * k); M.nearW = F.near; M.farW = F.far;
    if (M.sun) { if (M.sun.intensity !== M.sunW) M.sunB = M.sun.intensity; M.sun.intensity = M.sunB * (1 - 0.45 * k); M.sunW = M.sun.intensity; }
    M.U.uT.value = M.t % 10000; M.U.uK.value = 0.3 + 0.7 * k; M.U.uLand.value = k; M.U.uC.value.copy(M.base).lerp(M.mc, 0.5).multiplyScalar(1.04);
  }
  // an open-spandrel concrete arch bridge along the road between the samples i0 and i1 (Bixby Creek, Rocky Creek): the deck's fascia and underside, the two
  // ribs of the main arch (a parabola from its springings on the canyon walls to just under the deck, over the lowest point of the gorge), its spandrel
  // columns, the massive pylons at the springings, and the approach spans on bents of twin columns down to the ground
  function bsBridge(g, i0, i1, arch, gH) {
    const conc = [0.8, 0.78, 0.73], concD = [0.66, 0.64, 0.6], w = T.w, ds = T.ds, hw = w + 1.9;
    const P = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    for (let i = i0; i < i1; i++) {   // the deck: its underside and the fascias (the parapet itself: the guardrail code)
      const j = i + 1, inn = P(i, 0, -0.6);
      g.quadO(P(i, -hw, -1.4), P(j, -hw, -1.4), P(j, hw, -1.4), P(i, hw, -1.4), concD, [inn[0], inn[1] + 3, inn[2]]);
      for (const sd of [-1, 1]) g.quadO(P(i, sd * hw, -1.45), P(j, sd * hw, -1.45), P(j, sd * hw, 0.05), P(i, sd * hw, 0.05), conc, inn);
      for (const sd of [-1, 1]) { const o = sd * (w - 0.6); g.quadO(P(i, o, -1.4), P(j, o, -1.4), P(j, o, -2.5), P(i, o, -2.5), concD, P(i, 0, -2)); g.quadO(P(i, o + sd * 1.2, -1.4), P(j, o + sd * 1.2, -1.4), P(j, o + sd * 1.2, -2.5), P(i, o + sd * 1.2, -2.5), concD, P(i, o, -2)); }   // (the deck's girders)
    }
    // the arch: centred over the lowest ground under the bridge
    let ic = i0, lo = 1e9; for (let i = i0 + 4; i <= i1 - 4; i++) { const y = gH(T.px[i], T.pz[i]); if (y < lo) { lo = y; ic = i; } }
    const nA = Math.round(arch / 2 / ds), ia = clamp(ic - nA, i0 + 2, i1 - 2), ib = clamp(ic + nA, i0 + 2, i1 - 2);
    const yA = gH(T.px[ia], T.pz[ia]) + 1, yB = gH(T.px[ib], T.pz[ib]) + 1, yC = (k) => T.hy[k] - 3.4;
    const archY = (k) => { const u = (k - ia) / Math.max(1, ib - ia), base = lerp(yA, yB, u), top = yC(Math.round(lerp(ia, ib, 0.5))); return base + (top - base) * (1 - (2 * u - 1) * (2 * u - 1)); };
    const ribO = w - 0.4;
    for (const sd of [-1, 1]) for (let k = ia; k < ib; k++) {   // the ribs: box sections, 2.4 m wide, 3 m deep
      const o = sd * ribO, a = archY(k), b = archY(k + 1), c0 = [T.px[k] + T.nx[k] * o, T.pz[k] + T.nz[k] * o], c1 = [T.px[k + 1] + T.nx[k + 1] * o, T.pz[k + 1] + T.nz[k + 1] * o], nx = T.nx[k], nz = T.nz[k];
      const Q = (c, y, e) => [c[0] + nx * e, y, c[1] + nz * e], inn = [(c0[0] + c1[0]) / 2, (a + b) / 2 - 1.5, (c0[1] + c1[1]) / 2];
      g.quadO(Q(c0, a, -1.2), Q(c1, b, -1.2), Q(c1, b, 1.2), Q(c0, a, 1.2), conc, [inn[0], inn[1] - 3, inn[2]]);   // the top
      g.quadO(Q(c0, a - 3, -1.2), Q(c1, b - 3, -1.2), Q(c1, b - 3, 1.2), Q(c0, a - 3, 1.2), concD, [inn[0], inn[1] + 3, inn[2]]);   // the soffit
      for (const e of [-1.2, 1.2]) g.quadO(Q(c0, a, e), Q(c1, b, e), Q(c1, b - 3, e), Q(c0, a - 3, e), conc, inn);
    }
    for (let k = ia + 4; k <= ib - 4; k += 4) {   // the spandrel columns (every ~8 m), with a cross beam under the deck
      const y0 = archY(k), y1 = T.hy[k] - 1.4; if (y1 - y0 < 0.8) continue;
      for (const sd of [-1, 1]) { const o = sd * ribO, x = T.px[k] + T.nx[k] * o, z = T.pz[k] + T.nz[k] * o; box(g, x, y0, z, 1.1, y1 - y0, 1.6, T.hd[k], conc, null, true); }
      box(g, T.px[k], y1 - 1.1, T.pz[k], 0.9, 1.1, 2 * ribO + 1.6, T.hd[k], concD, null, true);
    }
    for (const [k, y] of [[ia, yA], [ib, yB]]) {   // the pylons at the springings: from below the ground up to the deck, wider than it
      const top = T.hy[k] - 1.4, H = top - y + 3; if (H < 2) continue;
      box(g, T.px[k], y - 3, T.pz[k], 7, H, 2 * hw + 1.2, T.hd[k], conc, null, true);
      box(g, T.px[k], top - 1.6, T.pz[k], 7.6, 1.2, 2 * hw + 1.8, T.hd[k], concD, null, true);
    }
    for (let k = i0 + 3; k <= i1 - 3; k += 9) {   // the approach spans: a bent of twin columns every ~18 m outside the arch
      if (k > ia - 3 && k < ib + 3) continue;
      const top = T.hy[k] - 1.4, gy = Math.min(...[-1, 1].map(sd => gH(T.px[k] + T.nx[k] * sd * ribO, T.pz[k] + T.nz[k] * sd * ribO))); if (top - gy < 1.5) continue;
      for (const sd of [-1, 1]) { const o = sd * ribO; box(g, T.px[k] + T.nx[k] * o, gy - 1, T.pz[k] + T.nz[k] * o, 1.5, top - gy + 1, 1.8, T.hd[k], conc, null, true); }
      box(g, T.px[k], top - 1.2, T.pz[k], 1.2, 1.2, 2 * ribO + 2, T.hd[k], concD, null, true);
      if (top - gy > 14) box(g, T.px[k], gy + (top - gy) * 0.5, T.pz[k], 0.9, 0.9, 2 * ribO, T.hd[k], concD, null, true);   // (a tie halfway down)
    }
    return { ic, ia, ib };
  }
  function buildBigSur(scene, tex, opts) {
    const R = rng(3911), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: bsGround, camFloor: bsGround, props: [], farClip: true, ownTex: [], dust: [0.72, 0.66, 0.56],
      season: opts.season === 'autumn' ? 'autumn' : 'summer', paintFor: (s) => (s === 'autumn' ? 'autumn' : 'summer') };   // (autumn on this coast: as the summer, golden grass, evergreen cypresses and pines: the render leaves it as built)
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.gul = [];   // (no stream bed cut under the bridges: the real gorges)
    P.c1 = valueNoise2(731, 120); P.c2 = valueNoise2(732, 48); P.c3 = valueNoise2(733, 210); P.c4 = valueNoise2(734, 90); P.c5 = valueNoise2(735, 26);
    const y0 = -base;   // the sea level
    // the bridges' weight per sample (1 on the span, fading out over 12 m past the abutments) and the pull-outs (def.wide) per sample
    const brW = new Float32Array(N), onBr = new Uint8Array(N), pull = new Uint8Array(N);
    for (const [a, b] of def.bridges || []) for (let i = 0; i < N; i++) { const s = i * T.ds - sStart, f = Math.min(sstep(a - 4, a + 8, s), sstep(b + 4, b - 8, s)); if (f > brW[i]) brW[i] = f; if (s >= a - 3 && s <= b + 3) onBr[i] = 1; }
    for (const [a, b, sd] of def.wide || []) for (let s = a - 6; s <= b + 6; s += T.ds / 2) { const i = T.idx(sStart + s); if (sd > 0) pull[i] = 1; }
    BS = { brW, y0 };
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees and buildings between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, signs) for the plants and the rocks, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    stubExcl(exclPush);   // (nothing grows or stands on the side roads)
    // the buildings (def.bld: the houses on the slopes, clear of the road)
    const blds = [];
    for (const [x, z, L0, W0, ang, hgt, kind] of def.bld || []) { const L = Math.min(L0, 30), W = Math.min(W0, 18); if (L < 2.5 || W < 2.5) continue;
      const n = vrNear(x, z); if (n.i >= 0 && n.dd < 4) continue; if (vrDem(x, z) + base < 4) continue; blds.push({ x, z, L, W, ang, hgt, kind }); exclPush(x, z, Math.hypot(L, W) / 2 + 2.5); }

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj += 2) for (let ti = 0; ti < G.ntx; ti += 2) {
        const gs = [];   // (the full tiles one by one, the coarse outer ring's merged 2 x 2: fewer draw calls where it costs few vertices)
        for (let b = tj; b < Math.min(G.ntz, tj + 2); b++) for (let a = ti; a < Math.min(G.ntx, ti + 2); a++) {
          const on = bsTileOn(a, b); if (!on) continue; if (on === 1) G.on[b * G.ntx + a] = 1; else nFar++;
          if (on === 2) gs.push(bsTileGeo(a, b, on)); else { const m = new THREE.Mesh(bsTileGeo(a, b, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); } }
        if (!gs.length) continue;
        const m = new THREE.Mesh(bsMergeGeo(gs), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the Pacific: the open sea west of the coast (40 m cells over the corridor wherever terrain is built or the cell lies on the ocean's side
       of the road, big sheets beyond it out to the horizon), its waves; along the coast line a band with the paler shallows, the foam lapping at
       the foot of the cliffs and round the rocks and the surf rolling in ---- */
    {
      const G = P.G, X0 = G.x0, Z0 = G.z0, X1 = G.x0 + G.ntx * VRC * VRT, Z1 = G.z0 + G.ntz * VRC * VRT, C = 40, g = new GB(true), uv = (x, z) => [x / 22, -z / 22];
      const deepC = [0.24, 0.44, 0.64], seaC = (x, z) => { const t = sstep(1.5, 30, y0 - bsFar(x, z)); return [lerp(0.46, deepC[0], t), lerp(0.78, deepC[1], t), lerp(0.76, deepC[2], t)]; };   // (turquoise over the shallow rock shelf, deep blue farther out)
      const quad = (xa, za, xb, zb, far) => g.quadUp([xa, y0, za], [xb, y0, za], [xb, y0, zb], [xa, y0, zb], far ? [deepC, deepC, deepC, deepC] : [seaC(xa, za), seaC(xb, za), seaC(xb, zb), seaC(xa, zb)], [uv(xa, za), uv(xb, za), uv(xb, zb), uv(xa, zb)]);
      const C3 = 3 * C;   // (a 120 m block of open water far from the coast is one quad; near the coast 40 m cells, the colour of its depth)
      for (let zb = Z0; zb < Z1; zb += C3) for (let xb = X0; xb < X1; xb += C3) {
        const cells = [];
        for (let z = zb; z < Math.min(Z1, zb + C3); z += C) for (let x = xb; x < Math.min(X1, xb + C3); x += C) {
          const cx = x + C / 2, cz = z + C / 2; let ok = vrDist(cx, cz) < 440;
          if (!ok) { const i = T.nearestIdx(cx, cz); ok = (cx - T.px[i]) * T.nx[i] + (cz - T.pz[i]) * T.nz[i] > 0; }   // (on the ocean's side: the road's right)
          if (ok) cells.push([x, z, bsFar(cx, cz) < y0 - 26 && bsFar(x, z) < y0 - 26 && bsFar(x + C, z + C) < y0 - 26]); }
        if (cells.length === 9 && cells.every(c => c[2]) && zb + C3 <= Z1 && xb + C3 <= X1) quad(xb, zb, xb + C3, zb + C3, 1);
        else for (const [x, z] of cells) quad(x, z, x + C, z + C);
      }
      const F = 9000, xs = (z) => { const i = z < (Z0 + Z1) / 2 ? 0 : iE; return T.px[i] - 250; };
      quad(X0 - F, Z0 - F, X0, Z1 + F, 1); quad(X0, Z0 - F, xs(Z0), Z0, 1); quad(X0, Z1, xs(Z1), Z1 + F, 1);
      const WO = { len: 2.4, amp: 1.4, refl: 0.34, shal: 0.75, lap: 1, surf: 1 }, sea = new THREE.Mesh(g.geometry(), waterMat(tex, Object.assign({ color: 0xffffff, vc: true }, WO)));
      sea.receiveShadow = true; sea.matrixAutoUpdate = false; root.add(sea); out.dyn.water = tex.water;
      // the waterline on a 10 m grid (the built tiles' heights where there are some, the terrain model elsewhere)
      const nI = Math.floor((G.nx - 1) / 2), nJ = Math.floor((G.nz - 1) / 2), HG = new Float32Array((nI + 1) * (nJ + 1));
      for (let j = 0; j <= nJ; j++) for (let i = 0; i <= nI; i++) { const ii = i * 2, jj = j * 2, ti = Math.min(G.ntx - 1, Math.floor(ii / VRT)), tj = Math.min(G.ntz - 1, Math.floor(jj / VRT));
        HG[j * (nI + 1) + i] = G.on[tj * G.ntx + ti] || bsTileOn(ti, tj) ? bsGH(ii, jj) : bsFar(G.x0 + ii * VRC, G.z0 + jj * VRC); }
      const wl = waterline((i, j) => HG[clamp(j, 0, nJ) * (nI + 1) + clamp(i, 0, nI)], G.x0, G.z0, 10, 0, nI, 0, nJ, y0 - 0.05);
      addShore(root, shoreBand(G.x0, G.z0, G.x0 + nI * 10, G.z0 + nJ * 10, y0 + 0.015, wl, 22, { F: 4, col: seaC }), sea.material, WO);
      // the kelp forests: olive-brown beds floating over the rock shelf (4-28 m deep), in patches, thinning out at their edges
      const gk = new GB(false, true), KC = 12, kn = valueNoise2(741, 80), kn2 = valueNoise2(742, 20);
      const ka = (x, z) => { const d = y0 - bsFar(x, z); return sstep(0.56, 0.74, kn(x, z) * 0.7 + kn2(x, z) * 0.3) * sstep(4, 8, d) * sstep(30, 20, d) * 0.62; };
      for (let z = Z0; z < Z1; z += KC) for (let x = X0; x < X1; x += KC) {
        if (vrDist(x, z) > 640) continue; const a = [ka(x, z), ka(x + KC, z), ka(x + KC, z + KC), ka(x, z + KC)]; if (Math.max(...a) < 0.02) continue;
        const kc = (q) => [0.3 + 0.04 * kn2(x * 3, z * 3), 0.27, 0.11, q];
        gk.quadUp([x, y0 + 0.06, z], [x + KC, y0 + 0.06, z], [x + KC, y0 + 0.06, z + KC], [x, y0 + 0.06, z + KC], a.map(kc)); }
      if (!gk.empty) { const m = new THREE.Mesh(gk.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -6 })); m.matrixAutoUpdate = false; m.renderOrder = 1; root.add(m); }
    }

    /* ---- the road: asphalt with white edge lines and a double yellow centre line, a gravel shoulder, the verge out past the barrier line onto the
       ground (at a pull-out a flat gravel apron out to it); on the bridges the deck out to the parapets (120 m chunks) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.6, grav = [0.66, 0.61, 0.52];
    const SB = stubGeo({ gCol: bsGCol, paveC: [0.82, 0.82, 0.83], gravC: [0.74, 0.7, 0.62], shC: [0.74, 0.7, 0.62], line: 'solid' });   // the side roads (their mouths; their surfaces in the road's chunks below)   // (the side roads' gravel the colour of the road's own shoulder: gc below)
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      if (onBr[i]) return [[e + sw, -0.02], [e + 0.9, 0.16], [bar - 0.1, 0.16], [bar + 0.3, 0.05], [bar + 0.35, -1.45]];   // (the sidewalk, the parapet's foot, the fascia)
      const ms = stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;   // (a side road's mouth: no ditch, the verge at its surface)
      const y = T.hy[i], gAt = (o) => { const q = side * o; return bsGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.84 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], ylw = [0.96, 0.76, 0.16], gc = [0.74, 0.7, 0.62], deck = [0.72, 0.7, 0.66];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return k < 3 ? deck : [0.7, 0.68, 0.64];
          const wl = vp[si][i][2][1] < -2.6; if (wl && (k === 1 || k === 2)) { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si); return k === 1 ? [0.7 * q, 0.67 * q, 0.6 * q] : [0.56 * q, 0.52 * q, 0.46 * q]; }
          if (side > 0 && pull[i] && k <= 1) { const q = 0.94 + 0.1 * rpHash(i, 61); return [grav[0] * q, grav[1] * q, grav[2] * q]; }   // (the pull-out's gravel apron)
          if (k === 4) return bsGCol(x, z);
          const sl = k === 2 ? bsSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return bsCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const [o0, o1] of SB.edges(i, j, [[-(w - 0.3), -(w - 0.45)], [w - 0.45, w - 0.3]])) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          for (const [o0, o1] of [[-0.21, -0.09], [0.09, 0.21]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [ylw, ylw, ylw, ylw]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], sc = onBr[i] ? deck : gc;
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [sc, sc, sc, sc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if ((k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6) && !onBr[i]) || (onBr[i] && onBr[j] && (k === 0 || k === 3))) gv.quadO(a, b, c, d, null, Pt(i, 0, onBr[i] ? -3 : Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (a wall's face; the kerb and the fascia of a bridge)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        SB.emit(c0, c0 + 60, gr, gs, gl);   // (the side roads whose junctions are in this chunk)
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];   // chequered start and finish lines, a white line at each checkpoint
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), fac = new Chunks(110, true), ban = new GB(true), W1 = [1, 1, 1];   // (fac: the walls with windows; ban: the boards and signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const shirts = [[0.84, 0.12, 0.12], [0.95, 0.95, 0.95], [0.1, 0.24, 0.66], [0.46, 0.7, 0.92], [0.96, 0.78, 0.18], [0.2, 0.55, 0.32], [1, 0.55, 0.1], [0.12, 0.14, 0.2], [0.72, 0.62, 0.48]];
    const CR = crowdCtx({ gH: bsGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => bsGround(x, z) < y0 + 1, shirts }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        ban.quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 16, 1 - k / 16];   // a gantry board (row k of the top half) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a road sign: [v0, v1, u0, u1]
    const sign = (s, side, k, W, H, hgt, face) => {   // a road sign on two posts beside the road, facing the cars coming up (face -1: those coming down)
      const [bx, bz, bi] = onSide(s, side, 1.2); if (excluded(bx, bz) || onBr[bi]) return;
      const by = bsGround(bx, bz), g = scen.get(bx, bz), [v0, v1, u0, u1] = board(k), f = face || 1;
      for (const o of [-W * 0.35, W * 0.35]) box(g, bx + T.tx[bi] * 0.05 + T.nx[bi] * o, by - 0.3, bz + T.tz[bi] * 0.05 + T.nz[bi] * o, 0.1, hgt + H * 0.5 + 0.3, 0.1, T.hd[bi], [0.6, 0.61, 0.63]);
      bannerQ(bx, by + hgt, bz, -T.tx[bi] * f, -T.tz[bi] * f, W, H, v0, v1, u0, u1); exclPush(bx, bz, 2); CR.avoid(bx, bz, 1);
    };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = Math.min(T.bl[i], w + 4) + 0.9, L2 = Math.min(T.br[i], w + 4) + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 0.8, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, bsGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || shirts[Math.floor(R() * shirts.length)] }, 1);
    const carCols = [[0.85, 0.85, 0.83], [0.72, 0.12, 0.1], [0.12, 0.28, 0.6], [0.16, 0.16, 0.18], [0.55, 0.57, 0.6], [0.24, 0.45, 0.28], [0.9, 0.86, 0.72]];

    /* ---- the houses on the slopes (white and grey clapboard, wood, dark roofs), sheds ---- */
    let nBld = 0;
    {
      const RB = rng(3921), walls = [[0.93, 0.92, 0.88], [0.78, 0.74, 0.66], [0.62, 0.5, 0.38], [0.86, 0.84, 0.8]], roofs = [[0.3, 0.3, 0.32], [0.42, 0.34, 0.26], [0.36, 0.38, 0.36]], woods = [[0.46, 0.32, 0.2], [0.52, 0.38, 0.24]];
      for (const b of blds) {
        const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = bsGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); }
        if (b.kind === 3) { const mc = vary([[0.6, 0.55, 0.48], [0.5, 0.36, 0.26]][Math.floor(RB() * 2)], RB, 0.12); box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 2.8, b.W, b.ang, mc, null, true); gable(g, b.x, hi + 2.5, b.z, b.L + 0.5, b.W + 0.5, Math.min(b.L, b.W) * 0.16, b.ang, vary(mc, RB, 0.2), mc); }
        else vrHouse(g, fac.get(b.x, b.z), b.x, lo, hi, b.z, b.ang, b.L, b.W, b.L * b.W > 220 ? 2 : 1, { wall: walls[Math.floor(RB() * walls.length)], wood: vary(woods[Math.floor(RB() * 2)], RB, 0.1), roof: vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1) });
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++;
      }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the bridges: Rocky Creek (a ~73 m arch) and Bixby Creek (the ~98 m arch, 320 ft) ---- */
    const brG = new GB(), brInfo = [];
    (def.bridges || []).forEach(([a, b], k) => { const i0 = T.idx(sStart + a), i1 = T.idx(sStart + b); brInfo.push(bsBridge(brG, i0, i1, k === 1 ? 98 : 73, bsGround));
      for (let i = i0; i <= i1; i += 3) exclPush(T.px[i], T.pz[i], w + 4); });
    if (!brG.empty) { const m = new THREE.Mesh(brG.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }

    /* ---- START: the gantry with the start lights, the timing hut, the road closed behind the grid; the checkpoints; FINISH at Hurricane Point ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 2.6), hy = bsGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.92, 0.9, 0.84], [0.5, 0.3, 0.2], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.0, T.hd[i], [0.3, 0.3, 0.32], [0.92, 0.9, 0.84]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, -1, 1.2), by = bsGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.6, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.42, v0, v1); exclPush(bx, bz, 4.5); }
    }
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.1, 0.3, 0.55]));
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      { const [bx, bz, bi] = onSide(sFin + 20, -1, 1.4), by = bsGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(6);   // HURRICANE POINT and its altitude, beside the road past the line
        for (const o of [-2.6, 2.6]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.16, 2.6, 0.16, T.hd[bi], [0.36, 0.26, 0.18]);
        bannerQ(bx, by + 1.3, bz, -T.nx[bi], -T.nz[bi], 6.0, 0.375, v0, v1); exclPush(bx, bz, 4); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
    }

    /* ---- the road signs: the bridges' names before them, the Old Coast Road at its junction, VISTA POINT before the pull-outs, CASTLE ROCK at its
       viewpoint, SLOW VEHICLES USE TURNOUTS now and then, BIG SUR after the start ---- */
    {
      const B = def.bridges || [];
      if (B[0]) sign(sStart + B[0][0] - 60, 1, 0, 3.4, 0.85, 1.6);
      if (B[1]) sign(sStart + B[1][0] - 70, 1, 1, 3.4, 0.85, 1.6);
      sign(sStart + 120, 1, 7, 2.6, 0.65, 1.7); sign(sStart + 1250, 1, 6, 2.8, 0.7, 1.5); sign(sStart + 2700, 1, 6, 2.8, 0.7, 1.5);
      const hp = T.names.find(q => /^Hurricane/.test(q.n)); if (hp) sign(sStart + hp.d - 80, 1, 2, 3.4, 0.85, 1.6);
      const cr = T.names.find(q => /Castle Rock/.test(q.n)); if (cr) sign(sStart + cr.d - 50, 1, 5, 3.0, 0.75, 1.5);
      for (const [a] of def.wide || []) sign(sStart + a - 45, 1, 4, 2.6, 0.65, 1.5);
      for (const [d, side] of def.oldRoad || []) sign(sStart + d - 30, side, 3, 2.8, 0.7, 1.5, 1);
    }

    /* ---- the guardrails where the ground falls away and round the outside of the bends (not on the pull-outs, where a low timber fence runs along the
       edge of the apron); the bridges' concrete parapets with their posts; a marker post every ~50 m where there is neither ---- */
    /* ---- the side roads' cones across their mouths, the rails and gates at their ends, the streets' names (stubProps) ---- */
    out.stubStats = stubProps({ scen, out, root, gH: bsGround, loc: { closed: 'ROAD CLOSED', gate: 'CLOSED', plate: ['#0f6b3e', '#f4f6f2'] }, posts: 'none' });
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (bsGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), steel = [0.8, 0.82, 0.84], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52], wood = [0.5, 0.38, 0.26];
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || onBr[i] || (side > 0 && pull[i])) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) if (!(side > 0 && pull[k]) && !onBr[k]) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        stubRails(nd, side);   // (open across the side roads' mouths)
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (onBr[i] && onBr[i + 1]) {   // the bridge: a concrete parapet with a post every 4 m and a capping rail
            const a = Q(i, 0.1, -0.05), b = Q(i + 1, 0.1, -0.05), c = Q(i + 1, 1.05, -0.05), d = Q(i, 1.05, -0.05), a2 = Q(i, 0.1, 0.3), b2 = Q(i + 1, 0.1, 0.3), c2 = Q(i + 1, 1.05, 0.3), d2 = Q(i, 1.05, 0.3), inn = Q(i, 0.5, 0.12);
            g.quadO(a, b, c, d, [0.84, 0.82, 0.77], inn); g.quadO(a2, b2, c2, d2, [0.76, 0.74, 0.69], inn); g.quadO(d, c, c2, d2, [0.88, 0.86, 0.81], inn);
            if (i % 2 === 0) { const p = Q(i, 0.1, 0.12); box(g, p[0], p[1], p[2], 0.55, 1.2, 0.5, T.hd[i], [0.86, 0.84, 0.79], null, true); }
          } else if (side > 0 && pull[i] && pull[i + 1]) {   // the pull-out: a low timber fence along the edge of the apron
            const a = Q(i, 0.55, 0.3), b = Q(i + 1, 0.55, 0.3), c = Q(i + 1, 0.7, 0.3), d = Q(i, 0.7, 0.3); g.quadO(a, b, c, d, wood, Q(i, 0.6, -3)); g.quadO(a, b, c, d, wood, Q(i, 0.6, 3));
            if (i % 2 === 0) { const p = Q(i, -0.3, 0.3); box(g, p[0], p[1], p[2], 0.16, 1.05, 0.16, T.hd[i], wood, null, true); }
          } else if (nd[i] && nd[i + 1]) {   // W-beam: a front and a back face, a post every 4 m
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
          } else if (!nd[i] && !onBr[i] && !pull[i] && i % 25 === 0 && i > 2 && i < iE - 2 && !SB.mouthV[side > 0 ? 1 : 0][i]) mkPosts.push([i, side]);
        }
      }
      const kp = caProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
    }

    /* ---- the Old Coast Road (def.oldRoad): a gravel track 4.2 m wide from the highway down into the Bixby Creek canyon, laid on the ground (a
       little above it), only within the built corridor ---- */
    let nOld = 0, nDrive = 0, nPond = 0;
    {
      const g = new GB(true), RW = 2.1, oc = [0.74, 0.66, 0.54], oe = [0.6, 0.55, 0.44];
      for (const [, , p] of def.oldRoad || []) {
        const n = p.length / 2, X = (k) => p[2 * k], Z = (k) => p[2 * k + 1], ys = [];
        for (let k = 0; k < n; k++) { const k0 = Math.max(0, k - 1), k1 = Math.min(n - 1, k + 1), dx = X(k1) - X(k0), dz = Z(k1) - Z(k0), l = Math.hypot(dx, dz) || 1, ux = -dz / l, uz = dx / l;
          ys.push(Math.max(bsGround(X(k), Z(k)), bsGround(X(k) + ux * RW, Z(k) + uz * RW), bsGround(X(k) - ux * RW, Z(k) - uz * RW)) + 0.12); }
        const ysm = ys.map((_, k) => { let s = 0, c = 0; for (let q = Math.max(0, k - 2); q <= Math.min(n - 1, k + 2); q++) { s += ys[q]; c++; } return Math.max(ys[k], s / c); });
        let acc = 0;
        for (let k = 0; k < n - 1; k++) {
          const x0 = X(k), z0 = Z(k), x1 = X(k + 1), z1 = Z(k + 1), dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz) || 1, ux = -dz / L, uz = dx / L;
          const nn = vrNear((x0 + x1) / 2, (z0 + z1) / 2), sa = vrStubAt((x0 + x1) / 2, (z0 + z1) / 2, 0);
          if ((nn.i >= 0 && nn.dd < 1.5) || vrDist(x0, z0) > 400 || (sa && sa.t < sa.S.Lend - 6)) { acc += L; continue; }   // (not where a side road is drawn: its junction and its first part, def.sideRoads)
          const A = [x0 - ux * RW, ysm[k], z0 - uz * RW], B = [x0 + ux * RW, ysm[k], z0 + uz * RW], C = [x1 + ux * RW, ysm[k + 1], z1 + uz * RW], D = [x1 - ux * RW, ysm[k + 1], z1 - uz * RW];
          g.quadUp(A, B, C, D, [oe, oe, oc, oc].map((c, q) => (q === 0 || q === 3 ? oe : oc)), [[0, acc / 6], [RW / 2, acc / 6], [RW / 2, (acc + L) / 6], [0, (acc + L) / 6]]); acc += L;
          for (const sd of [-1, 1]) { const ex = sd * RW, Ae = [x0 + ux * ex, ysm[k], z0 + uz * ex], Ce = [x1 + ux * ex, ysm[k + 1], z1 + uz * ex], Ad = [x0 + ux * (ex + sd * 1.2), bsGround(x0 + ux * (ex + sd * 1.2), z0 + uz * (ex + sd * 1.2)) - 0.1, z0 + uz * (ex + sd * 1.2)], Cd = [x1 + ux * (ex + sd * 1.2), bsGround(x1 + ux * (ex + sd * 1.2), z1 + uz * (ex + sd * 1.2)) - 0.1, z1 + uz * (ex + sd * 1.2)];
            g.quadUp(Ae, Ad, Cd, Ce, [oe, oe, oe, oe], [[0, 0], [0.2, 0], [0.2, 0.2], [0, 0.2]]); }   // (its verges down to the ground)
          exclPush((x0 + x1) / 2, (z0 + z1) / 2, RW + 1.5); nOld++;
        }
      }
      // the driveways: a gravel track 3 m wide from the highway's edge to each house within 260 m, bending a little with the ground
      const RDw = rng(4007), DW = 1.5;
      for (const b of blds) { if (b.kind === 3) continue;
        let bi = -1, bd = 260 * 260; for (let i = 0; i < T.N; i += 2) { if (onBr[i] || pull[i]) continue; const d = (b.x - T.px[i]) ** 2 + (b.z - T.pz[i]) ** 2; if (d < bd) { bd = d; bi = i; } }
        if (bi < 0) continue;
        const sd = (b.x - T.px[bi]) * T.nx[bi] + (b.z - T.pz[bi]) * T.nz[bi] > 0 ? 1 : -1, eo = sd * ((sd > 0 ? T.br[bi] : T.bl[bi]) + 0.3), ex = T.px[bi] + T.nx[bi] * eo, ez = T.pz[bi] + T.nz[bi] * eo;
        const L0 = Math.hypot(b.x - ex, b.z - ez), r0 = Math.max(b.L, b.W) / 2 + 1.5; if (L0 < r0 + 6) continue;
        const ux = (b.x - ex) / L0, uz = (b.z - ez) / L0, L = L0 - r0, n = Math.max(2, Math.ceil(L / 4)), wob = (RDw() - 0.5) * Math.min(14, L * 0.2), pts = [];
        for (let k = 0; k <= n; k++) { const t = k / n, w = Math.sin(Math.PI * t) * wob, x = ex + ux * L * t - uz * w, z = ez + uz * L * t + ux * w; pts.push([x, z, k === 0 ? T.hy[bi] + 0.02 : bsGround(x, z) + 0.1]); }
        let acc = 0;
        for (let k = 0; k < n; k++) { const [x0, z0, y0d] = pts[k], [x1, z1, y1d] = pts[k + 1], dx = x1 - x0, dz = z1 - z0, Lk = Math.hypot(dx, dz) || 1, px = -dz / Lk * DW, pz = dx / Lk * DW;
          g.quadUp([x0 - px, y0d, z0 - pz], [x0 + px, y0d, z0 + pz], [x1 + px, y1d, z1 + pz], [x1 - px, y1d, z1 - pz], [oe, oc, oc, oe], [[0, acc / 6], [0.5, acc / 6], [0.5, (acc + Lk) / 6], [0, (acc + Lk) / 6]]); acc += Lk;
          if (k > 0) exclPush((x0 + x1) / 2, (z0 + z1) / 2, DW + 1.2); }
        nDrive++;
      }
      addM(g, sMat);
      // the stock ponds on the pastures: a small round pond dug for the cattle, brown-green water level in a bare muddy rim (where the ground
      // rises above the water level the terrain covers it: an uneven shore)
      const RPd = rng(4013), gp = new GB();
      for (let k = 0, tries = 0; k < 5 && tries < 800; tries++) {
        const s = sStart - 100 + RPd() * (T.len - sStart), [x, z] = onSide(s, RPd() < 0.75 ? -1 : 1, 50 + RPd() * 180);
        if (vrLC(x, z) !== 0 || bsSlope(x, z) > 0.09 || vrDist(x, z) > 250 || excluded(x, z) || bsGround(x, z) + base < 15 || bsScrub(x, z) > 0.4) continue;
        const R = 6 + RPd() * 6, yw = bsGround(x, z) + 0.1, NQ = 14, ring = (r, f) => Array.from({ length: NQ }, (_, q) => { const a = q / NQ * TAU, w = r * (1 + 0.12 * Math.sin(q * 2.7 + k)), px = x + Math.cos(a) * w * 1.2, pz = z + Math.sin(a) * w; return [px, f(px, pz), pz]; });
        const wi = ring(R, (px, pz) => bsGround(px, pz) + 0.1), mi = ring(R, (px, pz) => bsGround(px, pz) + 0.07), mo = ring(R + 3, (px, pz) => bsGround(px, pz) + 0.04), wc = [0.27, 0.33, 0.27], mc = [0.42, 0.36, 0.27], mo2 = [0.56, 0.5, 0.38];
        for (let q = 0; q < NQ; q++) { const q1 = (q + 1) % NQ; gp.quadUp([x, yw, z], [x, yw, z], wi[q1], wi[q], [wc, wc, wc, wc]); scen.get(x, z).quadUp(mi[q], mi[q1], mo[q1], mo[q], [mc, mc, mo2, mo2]); }
        exclPush(x, z, R * 1.2 + 4); k++; nPond++;
      }
      if (!gp.empty) { const m = new THREE.Mesh(gp.geometry(), new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 80, specular: 0x506068 })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
      // a car parked at the gravel's edge near the junction (the hikers' car)
      const O = (def.oldRoad || [])[0];
      if (O) { const p = O[2], n = p.length / 2;
        for (let k = 6; k < Math.min(n, 16); k++) { const k0 = k - 1, k1 = Math.min(n - 1, k + 1), dx = p[2 * k1] - p[2 * k0], dz = p[2 * k1 + 1] - p[2 * k0 + 1], l = Math.hypot(dx, dz) || 1, o = RW + 1.9;
          const x = p[2 * k] - dz / l * o, z = p[2 * k + 1] + dx / l * o; if (vrNear(x, z).dd < 6 || bsSlope(x, z) > 0.3 || vrDist(x, z) > 400) continue;
          caCar(scen.get(x, z), x, bsGround(x, z), z, Math.atan2(dz, dx), [0.62, 0.6, 0.55]); exclPush(x, z, 3); break; }
      }
    }

    /* ---- spectators: the start and the finish, the checkpoints, the sightseers at the pull-outs, the crowd at the north end of the Bixby Creek Bridge
       (its famous viewpoint) and at Hurricane Point ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.1, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 60, sd, { rows: 3, dens: 0.55, label: 'BS start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'BS finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.5, label: 'BS cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.35, label: 'BS cp-' }); });
      for (const [a, b] of def.wide || []) run(sStart + a, sStart + b, 1, { rows: 1, dens: 0.35, clump: 0.85, flag: 0, label: 'BS pull-out' });
      const B = def.bridges || []; if (B[1]) run(sStart + B[1][0] - 70, sStart + B[1][0] - 4, 1, { rows: 3, dens: 0.55, label: 'BS bixby' });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants and the rocks (instanced per 96 m chunk): the golden grass in tufts, the coastal scrub's bushes (coyote brush, sage: one soft
       mound each) wherever bsScrub covers the ground, a few bigger clusters, the Monterey cypresses and pines thickest in the gullies and on the
       sheltered slopes (lc 2), boulders on the bare ground and at the foot of the cliffs; none on the steep faces, the road or the sea ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);   // (the grass: in the wind, and the cut)
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    const pk = [0, 1, 2, 3, 4].map(k => new IChunks(caPlantGeo(k), k === 0 ? wMat : pMat, k === 4 ? 64 : 128));
    const bk = [0, 1].map(k => new IChunks(bsBushGeo(k), k === 1 ? wMat : pMat, 128));
    const tk = [0, 1].map(k => new IChunks(bsTreeGeo(k), pMat, 128));
    let nPlants = 0, nTrees = 0, nBush = 0, nSeal = 0, nBarn = 0, nBoat = 0, nWhale = 0, nCrop = 0, nEuc = 0, nGuano = 0, nRed = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(70000 * dens), maxTr = Math.round(9000 * dens), RT = rng(3961), SP = 3.4 / Math.sqrt(dens);
      const BC = [[0.82, 0.98, 0.84], [0.74, 0.92, 0.78], [1.12, 1.1, 1.04], [1.2, 1.04, 0.82]];   // (coyote brush, darker; sage, grey-green; dried, brown)
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(230)) continue;   // (LOD: a shorter plant/tree draw distance on the lower tiers)
          if (hd > LOD.radius(70) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot)
          const c = vrLC(x, z), y = bsGround(x, z), A = y + base; if (A < 1.5) continue;
          const sl = bsSlope(x, z), sc = bsScrub(x, z);
          let kind = -1;
          if (c === 2) { const gul = clamp(((bsGround(x - 14, z) + bsGround(x + 14, z) + bsGround(x, z - 14) + bsGround(x, z + 14)) / 4 - y) / 4, -1, 1);   // (a gully: the ground round it higher)
            kind = r1 < 0.045 + 0.16 * Math.max(0, gul) ? 10 : r1 < 0.55 ? 20 : r1 < 0.6 ? 1 : -1; }
          else if (c === 4) kind = r1 < 0.07 ? 3 : r1 < 0.12 ? 0 : r1 < 0.16 ? 20 : -1;
          else { const pb = 0.065 + 0.48 * sstep(0.15, 0.7, sc); kind = r1 < pb ? 20 : r1 < pb + 0.02 * sc ? 1 : r1 < pb + (hd < 80 ? 0.62 : 0.45) * (1 - sc) ? 0 : r1 > 0.995 && c === 1 ? 10 : -1; }
          if (kind < 0) continue;
          if (sl > (kind === 3 ? 1.2 : kind === 10 ? 0.75 : 0.95)) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < (kind === 10 ? 9 : 1.6)) continue;
          if (excluded(x, z)) continue;
          if (kind === 10) { if (nTrees >= maxTr) continue; const cyp = A < 90 || r2 < 0.45, h = cyp ? 5 + r3 * 5 : 9 + r3 * 7; (cyp ? tk[0] : tk[1]).add(x, y - 0.2, z, cyp ? (r4 - 0.5) * 0.6 : r4 * TAU, h * (cyp ? 1.1 : 0.55), h, [0.88 + r2 * 0.22, 0.9 + r3 * 0.18, 0.88 + r4 * 0.2]); nTrees++; continue; }
          if (kind === 20) { const bc = BC[r2 < 0.45 ? 0 : r2 < 0.7 ? 1 : r2 < 0.92 ? 2 : 3], k = 0.9 + r4 * 0.2, w = 1.1 + r3 * 1.7 + sc * 0.6; bk[0].add(x, y - 0.25, z, r4 * TAU, w, w * (0.55 + r2 * 0.25), [bc[0] * k, bc[1] * k, bc[2] * k]); nBush++; }
          else if (kind === 0) { const fl = sstep(0.68, 0.78, P.c4(x * 1.7 + 300, z * 1.7)) * (hd < 120 ? 1 : 0.4), tc = r3 < fl * 0.85 ? (P.c2(x * 2, z * 2) > 0.5 ? [1.45, 0.72, 0.22] : [0.86, 0.62, 1.3]) : [1.06 + r2 * 0.12, 0.98 + r3 * 0.1, 0.82 + r4 * 0.12];   // (patches in flower: poppies, lupines)
            pk[0].add(x, y - 0.05, z, r2 * TAU, 0.65 + r3 * 0.6, 0.45 + r4 * 0.45, tc); }
          else if (kind === 1) pk[1].add(x, y - 0.1, z, r2 * TAU, 1.0 + r3 * 1.6, 0.7 + r4 * 0.9, [0.78 + r2 * 0.2, 0.88 + r3 * 0.14, 0.82 + r4 * 0.12]);
          else { const k = 0.85 + r3 * 0.3; pk[3].add(x, y - 0.15, z, r4 * TAU, 0.5 + r3 * 1.4, 0.4 + r4 * 1.0, [0.98 * k, 0.94 * k, 0.88 * k]); }
          if (++nPlants >= maxT) break grid;
        }
      }
      // pampas grass on the road's cuts and verges: clumps of one to three, its cream plumes nodding in the wind
      const RP = rng(3963);
      for (let s = sStart - 150; s < T.len - 20; s += 7) for (const side of [-1, 1]) {
        if (RP() > 0.16) continue; const i = T.idx(s); if (onBr[i] || (side > 0 && pull[i])) continue;
        const n = 1 + Math.floor(RP() * 3), o0 = 1.0 + RP() * 5;
        for (let q = 0; q < n; q++) { const [x, z] = onSide(s + (RP() - 0.5) * 5, side, o0 + RP() * 2.5); if (excluded(x, z) || vrNear(x, z).dd < 0.8) continue;
          const y = bsGround(x, z); if (y + base < 3 || bsSlope(x, z) > 1.1) continue;
          const h = 1.6 + RP() * 1.2; bk[1].add(x, y - 0.1, z, RP() * TAU, h * 0.9, h, [0.95 + RP() * 0.1, 0.95 + RP() * 0.1, 0.92]); nBush++; }
      }
    }
    {   // the stones at the road's edge, and the rocks in the surf: boulders where the ground meets the sea (half under water, the foam round them)
      const RS = rng(3967), maxS = Math.round(14000 * dens); let nS = 0;
      edge: for (let s = 12; s < T.len - 12; s += 1.4 / dens) for (const side of [-1, 1]) {
        if (onBr[T.idx(s)]) continue;
        const o = 1.7 + Math.pow(RS(), 2) * 30, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z)) continue;
        const y = bsGround(x, z); if (y < y0 + 1.5 || bsSlope(x, z) > 1.1 || (vrLC(x, z) !== 4 && r1 < 0.6)) continue;
        const k = 0.84 + r3 * 0.28, sc = 0.7 + r1 * 1.0; pk[4].add(x, y - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [k, k * 0.97, k * 0.92]);
        if (++nS >= maxS) break edge;
      }
      // the outcrops: clusters of weathered sandstone and granite boulders breaking through the grass on the steeper slopes, 3 to 6 together
      const RO = rng(4009), oc = [[0.6, 0.55, 0.47], [0.55, 0.53, 0.5], [0.66, 0.6, 0.5]];
      for (let k = 0, tries = 0; k < 45 && tries < 2000; tries++) {
        const s = sStart - 150 + RO() * (T.len - sStart + 120), [cx, cz] = onSide(s, RO() < 0.7 ? -1 : 1, 25 + RO() * 200), sl = bsSlope(cx, cz);
        if (sl < 0.45 || sl > 1.0 || vrNear(cx, cz).dd < 12 || vrDist(cx, cz) > 260 || excluded(cx, cz) || bsGround(cx, cz) + base < 12 || vrLC(cx, cz) === 2) continue;
        const n = 3 + Math.floor(RO() * 4), col = oc[Math.floor(RO() * 3)], g = scen.get(cx, cz);
        for (let q = 0; q < n; q++) { const x = cx + (RO() - 0.5) * 12, z = cz + (RO() - 0.5) * 12, r = 1.4 + RO() * RO() * 3.6; if (vrNear(x, z).dd < 6) continue;
          rock(g, x, bsGround(x, z) + r * 0.15, z, r * (1 + RO() * 0.5), r * (0.55 + RO() * 0.4), r, RO() * TAU, vary(col, RO, 0.08), RO, 0.3); exclPush(x, z, r); }
        k++; nCrop++;
      }
      const G = P.G, RK = rng(3971), rc = [[0.42, 0.4, 0.37], [0.5, 0.46, 0.4], [0.36, 0.35, 0.34]], gf = new GB(false, true), FW = [0.94, 0.95, 0.95];
      const seals = new IChunks(bsSealGeo(), pMat, 256), RL = rng(3973), RGu = rng(4017), SC = [[0.36, 0.27, 0.19], [0.24, 0.19, 0.15], [0.48, 0.38, 0.27]];   // (sea lions hauled out on the rocks, sunning)
      for (let k = 0; k < LOD.count(9000 * dens); k++) {   // (LOD: fewer scattered beach boulders on the lower tiers)
        const x = G.x0 + RK() * G.ntx * VRC * VRT, z = G.z0 + RK() * G.ntz * VRC * VRT, r1 = RK(), r2 = RK(), r3 = RK();
        const ti = Math.floor((x - G.x0) / (VRC * VRT)), tj = Math.floor((z - G.z0) / (VRC * VRT)); if (!G.on[tj * G.ntx + ti]) continue;
        const y = bsGround(x, z); if (y > y0 + 1.2 || y < y0 - 2.5) continue;
        const s = 1.2 + r1 * r1 * 4.5, g = scen.get(x, z); rock(g, x, y0 - s * 0.25, z, s * (1 + r2 * 0.6), s * (0.7 + r3 * 0.6), s, r2 * TAU, vary(rc[Math.floor(r3 * 3)], RK, 0.1), RK, 0.35);
        const sl0 = s > 2.2 && RL() < 0.4;
        if (!sl0 && s > 3 && RGu() < 0.65) { const yt = y0 - s * 0.25 + 0.6 * s * (0.7 + r3 * 0.6);   // the seabirds' white on the bigger stacks' tops
          rock(g, x, yt - s * 0.06, z, s * (0.65 + r2 * 0.3), s * 0.22, s * 0.6, r2 * TAU, vary([0.86, 0.85, 0.8], RGu, 0.05), RGu, 0.3, true); nGuano++; }
        if (sl0) { const yt = y0 - s * 0.25 + 0.6 * s * (0.7 + r3 * 0.6), n = 1 + Math.floor(RL() * 3);
          for (let q = 0; q < n; q++) { const a = RL() * TAU, d = RL() * s * 0.35, sz = 0.9 + RL() * 0.5; seals.add(x + Math.cos(a) * d, yt - 0.05, z + Math.sin(a) * d, RL() * TAU, sz, sz, SC[Math.floor(RL() * 3)]); nSeal++; } }
        if (y < y0 - 0.3) {   // the foam round a rock in the surf: a ring of white fading out over the water
          const ri = s * (0.9 + r2 * 0.4), ro = ri + 1.2 + s * 0.6, n = 9, yy = y0 + 0.05;
          for (let q = 0; q < n; q++) { const a0 = q / n * TAU, a1 = (q + 1) / n * TAU, w0 = 0.85 + 0.3 * Math.sin(q * 2.3 + r3 * 9);
            gf.quadUp([x + Math.cos(a0) * ri, yy, z + Math.sin(a0) * ri], [x + Math.cos(a1) * ri, yy, z + Math.sin(a1) * ri], [x + Math.cos(a1) * ro * w0, yy, z + Math.sin(a1) * ro * w0], [x + Math.cos(a0) * ro * w0, yy, z + Math.sin(a0) * ro * w0], [[...FW, 0.75], [...FW, 0.75], [...FW, 0], [...FW, 0]]); }
        }
      }
      seals.addTo(root, true);
      // fishing boats out on the Pacific, 120-300 m off the cliffs, at anchor or trolling: a white hull, the wheelhouse, a mast and outriggers
      for (let k = 0, tries = 0; k < 6 && tries < 200; tries++) {
        const s = sStart + RK() * (T.len - sStart - 40), [x, z] = onSide(s, 1, 120 + RK() * 180); if (bsGround(x, z) > y0 - 8) continue;
        const a = RK() * TAU, c = Math.cos(a), sn = Math.sin(a), L = 9 + RK() * 5, g = scen.get(x, z), hc = RK() < 0.7 ? [0.93, 0.93, 0.9] : [0.24, 0.42, 0.56];
        box(g, x, y0 - 0.5, z, L, 1.6, L * 0.32, a, hc, [0.56, 0.58, 0.6], true); box(g, x + c * L * 0.42, y0 + 0.4, z + sn * L * 0.42, L * 0.16, 0.7, L * 0.22, a, hc, null, true);
        box(g, x + c * L * 0.12, y0 + 1.1, z + sn * L * 0.12, L * 0.3, 1.7, L * 0.25, a, [0.95, 0.95, 0.92], [0.3, 0.36, 0.42], true);
        cyl(g, x - c * L * 0.1, y0 + 1, z - sn * L * 0.1, 0.09, 6, 4, [0.7, 0.7, 0.7], null);
        ouRod(g, [x - c * L * 0.1, y0 + 5.5, z - sn * L * 0.1], [x - c * L * 0.1 - sn * 5, y0 + 2.5, z - sn * L * 0.1 + c * 5], 0.05, [0.7, 0.7, 0.7], 3);
        ouRod(g, [x - c * L * 0.1, y0 + 5.5, z - sn * L * 0.1], [x - c * L * 0.1 + sn * 5, y0 + 2.5, z - sn * L * 0.1 - c * 5], 0.05, [0.7, 0.7, 0.7], 3);
        if (RK() < 0.5) for (let q = 0; q < 4; q++) { const d0 = L * 0.5 + q * 5, d1 = d0 + 5, w0 = 1.4 + q * 1.2, w1 = w0 + 1.2, A = 0.6 - q * 0.15;   // (a wake behind one under way)
          gf.quadUp([x - c * d0 - sn * w0, y0 + 0.05, z - sn * d0 + c * w0], [x - c * d0 + sn * w0, y0 + 0.05, z - sn * d0 - c * w0], [x - c * d1 + sn * w1, y0 + 0.05, z - sn * d1 - c * w1], [x - c * d1 - sn * w1, y0 + 0.05, z - sn * d1 + c * w1], [[...FW, A], [...FW, A], [...FW, A - 0.15], [...FW, A - 0.15]]); }
        k++; nBoat++;
      }
      // grey whales passing along the coast, 160-320 m out: the mottled back just above the water, the foam round it, and the blow (a spout of
      // spray every few seconds: dyn.bsWhale, World.update)
      const RW2 = rng(4003), spM = new THREE.MeshBasicMaterial({ color: 0xf2f4f4, transparent: true, opacity: 0.55, depthWrite: false, fog: true }); out.dyn.bsWhale = [];
      for (let k = 0, tries = 0; k < 2 && tries < 100; tries++) {
        const s = sStart + 300 + RW2() * (T.len - sStart - 600), i = T.idx(s), [x, z] = onSide(s, 1, 160 + RW2() * 160); if (bsGround(x, z) > y0 - 7) continue;
        const a = -T.hd[i] + (RW2() - 0.5) * 0.5, c = Math.cos(a), sn = Math.sin(a), g = scen.get(x, z);
        rock(g, x, y0 - 0.15, z, 6.5, 0.9, 2.0, a, [0.34, 0.35, 0.36], RW2, 0.15, true); rock(g, x - c * 7.5, y0 - 0.3, z - sn * 7.5, 1.6, 0.5, 1.0, a, [0.3, 0.31, 0.32], RW2, 0.1, true);
        for (let q = 0; q < 10; q++) { const a0 = q / 10 * TAU, a1 = (q + 1) / 10 * TAU, E = (an, r) => [x + Math.cos(a) * Math.cos(an) * r * 1.6 - Math.sin(a) * Math.sin(an) * r * 0.7, y0 + 0.05, z + Math.sin(a) * Math.cos(an) * r * 1.6 + Math.cos(a) * Math.sin(an) * r * 0.7];
          gf.quadUp(E(a0, 4.6), E(a1, 4.6), E(a1, 7), E(a0, 7), [[...FW, 0.6], [...FW, 0.6], [...FW, 0], [...FW, 0]]); }
        const sg = new GB(); cyl(sg, 0, 0, 0, 0.25, 5, 7, [1, 1, 1], [1, 1, 1], 1.3);
        const sp = new THREE.Mesh(sg.geometry(), spM); sp.position.set(x + c * 4.2, y0 + 0.6, z + sn * 4.2); sp.scale.set(1, 0.01, 1); sp.visible = false; root.add(sp);
        out.dyn.bsWhale.push({ m: sp, ph: k * 3.7 }); k++; nWhale++;
      }
      if (!gf.empty) { const m = new THREE.Mesh(gf.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -8 })); m.matrixAutoUpdate = false; m.renderOrder = 2; root.add(m); }
    }

    /* ---- life on the land: the power line on its wooden poles (def.power, OpenStreetMap) with three sagging wires, the ranch fences (wooden posts and
       barbed wire) along the inland side where the grass is grazed, herds of beef cattle on the grass, a car or a pickup by each house ---- */
    let nCows = 0, nFence = 0;
    {
      const pole = [0.38, 0.29, 0.21], wire = [0.16, 0.16, 0.17];
      const wireSeg = (g, a, b, sag) => { for (let k = 0; k < 4; k++) { const f0 = k / 4, f1 = (k + 1) / 4, y0w = lerp(a[1], b[1], f0) - sag * 4 * f0 * (1 - f0), y1w = lerp(a[1], b[1], f1) - sag * 4 * f1 * (1 - f1);
        ouRod(g, [lerp(a[0], b[0], f0), y0w, lerp(a[2], b[2], f0)], [lerp(a[0], b[0], f1), y1w, lerp(a[2], b[2], f1)], 0.03, wire, 3); } };
      for (const p of def.power ? [def.power] : []) {   // the power line: a pole at every vertex and every ~55 m between
        const pts = []; for (let k = 0; k + 3 < p.length; k += 2) { const ax = p[k], az = p[k + 1], bx = p[k + 2], bz = p[k + 3], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 55)); for (let q = 0; q < n; q++) pts.push([lerp(ax, bx, q / n), lerp(az, bz, q / n)]); }
        pts.push([p[p.length - 2], p[p.length - 1]]);
        let prev = null;
        for (const [x0p, z0p] of pts) {
          let x = x0p, z = z0p; const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2) { prev = null; continue; }
          if (vrDist(x, z) > 300 || excluded(x, z)) { prev = null; continue; }
          const y = bsGround(x, z), g = scen.get(x, z), H = 10;
          cyl(g, x, y - 0.5, z, 0.16, H + 0.5, 5, pole, null, 0.12);
          const nx2 = prev ? x - prev[0] : 1, nz2 = prev ? z - prev[1] : 0, l = Math.hypot(nx2, nz2) || 1, rot = Math.atan2(nz2, nx2) + Math.PI / 2;
          box(g, x, y + H - 0.7, z, 2.4, 0.14, 0.14, rot, pole, null, true);
          const tips = [-1.05, 0, 1.05].map(o => [x + Math.cos(rot) * o, y + H - (o ? 0.5 : -0.3), z + Math.sin(rot) * o]);
          if (prev) for (let w = 0; w < 3; w++) wireSeg(g, prev[2][w], tips[w], 0.7);
          prev = [x, z, tips]; exclPush(x, z, 1.2);
        }
      }
      // the ranch fences: wooden posts every 4 m, three strands of barbed wire, ~14 m past the barrier on the inland side, where the grass runs
      const RF = rng(3981), seg = (s0, s1) => {
        let prev = null;
        for (let s = s0; s < s1; s += 4) { const i = T.idx(s); if (onBr[i]) { prev = null; continue; }
          const [x, z] = onSide(s, -1, 13 + 2 * Math.sin(s * 0.013)); if (vrNear(x, z).dd < 8 || excluded(x, z) || bsSlope(x, z) > 0.7 || vrDist(x, z) > 280) { prev = null; continue; }
          const y = bsGround(x, z), g = scen.get(x, z); box(g, x, y - 0.2, z, 0.12, 1.4, 0.12, T.hd[i], pole, null, true);
          const tops = [0.45, 0.8, 1.12].map(h => [x, y + h, z]);
          if (prev && Math.hypot(prev[0] - x, prev[1] - z) < 6) for (let w = 0; w < 3; w++) ouRod(g, prev[2][w], tops[w], 0.012, wire, 3);
          prev = [x, z, tops]; nFence++; }
      };
      for (let s = sStart - 150; s < T.len - 30; s += 60) { const i = T.idx(s + 30), [x, z] = onSide(s + 30, -1, 14);
        if (vrLC(x, z) === 0 && bsScrub(x, z) < 0.45 && RF() < 0.8) seg(s, s + 60); }
      // the cattle: herds of 4 to 12 on the open grass (gentle slopes, 40-260 m from the road), heads down, a few looking up; black, red-brown, a
      // few white-faced and tan
      const cows = new IChunks(bsCowGeo(), pMat, 256), RC = rng(3991), CC = [[0.1, 0.09, 0.09], [0.1, 0.09, 0.09], [0.36, 0.2, 0.12], [0.5, 0.32, 0.2], [0.62, 0.5, 0.36]];
      for (let h = 0, tries = 0; h < 11 && tries < 400; tries++) {
        const s = sStart - 100 + RC() * (T.len - sStart), side = RC() < 0.75 ? -1 : 1, [cx, cz] = onSide(s, side, 40 + RC() * 200);
        if (vrLC(cx, cz) !== 0 || bsScrub(cx, cz) > 0.4 || bsSlope(cx, cz) > 0.32 || vrDist(cx, cz) > 260 || excluded(cx, cz) || bsGround(cx, cz) + base < 10) continue;
        h++; const n = 4 + Math.floor(RC() * 9), ha = RC() * TAU;
        if (h <= 4) {   // the ranch's barn (weathered board walls, a rusty metal roof) and its water tank on stilts, at the edge of the pasture
          const bx = cx + Math.cos(ha) * 28, bz = cz + Math.sin(ha) * 28;
          if (vrNear(bx, bz).dd > 14 && !excluded(bx, bz) && bsSlope(bx, bz) < 0.35 && vrDist(bx, bz) < 280) {
            const by = bsGround(bx, bz), g = scen.get(bx, bz), wc = [[0.52, 0.22, 0.16], [0.56, 0.5, 0.42], [0.4, 0.33, 0.25]][h % 3], rf = [0.46, 0.33, 0.24];
            box(g, bx, by - 0.4, bz, 14, 4.8, 9, ha, wc, null, true); gable(g, bx, by + 4.4, bz, 14.8, 10, 3.2, ha, rf, wc);
            const tx = bx + Math.cos(ha + 1.6) * 11, tz = bz + Math.sin(ha + 1.6) * 11, ty = bsGround(tx, tz);
            for (const [ox, oz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(g, tx + ox * 1.2, ty - 0.2, tz + oz * 1.2, 0.2, 3.4, 0.2, 0, [0.4, 0.31, 0.22], null, true);
            cyl(g, tx, ty + 3.2, tz, 1.8, 2.6, 8, [0.6, 0.6, 0.58], [0.5, 0.5, 0.5]);
            exclPush(bx, bz, 10); exclPush(tx, tz, 3); CR.block(bx, bz, 15, 10, ha); nBarn++;
            const hx = bx + Math.cos(ha - 1.6) * 12, hz = bz + Math.sin(ha - 1.6) * 12;   // round hay bales in a row beside the barn, a few stacked two high
            for (let q = 0; q < 7; q++) { const x = hx + Math.cos(ha) * (q - 3) * 1.9, z = hz + Math.sin(ha) * (q - 3) * 1.9; if (vrNear(x, z).dd < 8 || excluded(x, z) || bsSlope(x, z) > 0.4) continue;
              const y = bsGround(x, z), hc = [0.78, 0.66, 0.4], ht = [0.86, 0.76, 0.5]; cyl(g, x, y - 0.1, z, 0.85, 1.3, 8, hc, ht); if (q % 3 === 1) cyl(g, x, y + 1.2, z, 0.85, 1.3, 8, hc, ht); exclPush(x, z, 1.2); } } }
        for (let k = 0; k < n; k++) { const x = cx + (RC() - 0.5) * 34, z = cz + (RC() - 0.5) * 34; if (vrNear(x, z).dd < 10 || excluded(x, z) || bsSlope(x, z) > 0.4) continue;
          const c = CC[Math.floor(RC() * CC.length)], sz = 0.95 + RC() * 0.15; cows.add(x, bsGround(x, z), z, ha + (RC() - 0.5) * 1.6, sz, sz, c); exclPush(x, z, 1.4); nCows++; }
      }
      cows.addTo(root, true);
      // a car or a pickup by each house, on its plot
      const RV = rng(3993), VC = [[0.85, 0.85, 0.83], [0.2, 0.22, 0.25], [0.55, 0.12, 0.1], [0.2, 0.32, 0.5], [0.62, 0.6, 0.55], [0.3, 0.36, 0.28]];
      for (const b of blds) { if (b.kind === 3 || RV() < 0.25) continue; const c = Math.cos(b.ang), sn = Math.sin(b.ang), o = b.W / 2 + 3.2, x = b.x - sn * o, z = b.z + c * o;
        if (vrNear(x, z).dd < 3 || bsSlope(x, z) > 0.4) continue; caCar(scen.get(x, z), x, bsGround(x, z), z, b.ang + (RV() - 0.5) * 0.4, VC[Math.floor(RV() * VC.length)]); }
      // the windbreaks: a row of Monterey cypresses behind a house (on its far side from the car), dark, dense, wind-shaped
      for (const b of blds) { if (b.kind === 3 || RV() < 0.45) continue; const c = Math.cos(b.ang), sn = Math.sin(b.ang), o = -(b.W / 2 + 7), n = 4 + Math.floor(RV() * 5), L0 = (n - 1) * 3.6 / 2;
        for (let q = 0; q < n; q++) { const t = q * 3.6 - L0, x = b.x - sn * o + c * t, z = b.z + c * o + sn * t; if (vrNear(x, z).dd < 9 || excluded(x, z) || bsSlope(x, z) > 0.6) continue;
          const h = 7 + RV() * 4; tk[0].add(x, bsGround(x, z) - 0.2, z, (RV() - 0.5) * 0.5, h * 0.95, h, [0.78 + RV() * 0.1, 0.84 + RV() * 0.1, 0.82 + RV() * 0.1]); exclPush(x, z, 2.5); nTrees++; } }
      // blue gum eucalyptus planted as windbreaks across the pastures: long rows of tall, narrow trees, their crowns blue-grey
      const RE = rng(4011);
      for (let r = 0, tries = 0; r < 6 && tries < 600; tries++) {
        const s = sStart - 100 + RE() * (T.len - sStart), i = T.idx(s), [cx, cz] = onSide(s, -1, 45 + RE() * 110);
        if (vrLC(cx, cz) !== 0 || bsSlope(cx, cz) > 0.35 || vrDist(cx, cz) > 260 || excluded(cx, cz)) continue;
        const a = T.hd[i] + (RE() - 0.5) * 0.8, c = Math.cos(a), sn = Math.sin(a), n = 8 + Math.floor(RE() * 8); let m = 0;
        for (let q = 0; q < n; q++) { const t = (q - n / 2) * 6.5, x = cx + c * t + (RE() - 0.5) * 1.5, z = cz + sn * t + (RE() - 0.5) * 1.5; if (vrNear(x, z).dd < 12 || excluded(x, z) || bsSlope(x, z) > 0.5) continue;
          const h = 20 + RE() * 10; tk[1].add(x, bsGround(x, z) - 0.2, z, RE() * TAU, h * 0.5, h, [1.45 + RE() * 0.12, 1.4 + RE() * 0.1, 1.75 + RE() * 0.15]); exclPush(x, z, 3); nTrees++; m++; }
        if (m) { r++; nEuc++; }
      }
      // coast redwoods in the creek canyons below the bridges: tall, narrow, dark red-green spires, thickest along the canyon floor
      const RR = rng(4019);
      for (const [a, b] of def.bridges || []) { const i = T.idx(sStart + (a + b) / 2); let m = 0;
        for (let tries = 0; tries < 700 && m < 45; tries++) {
          const d = 30 + RR() * 330, o = (RR() - 0.5) * 160, x = T.px[i] - T.nx[i] * d + T.tx[i] * o, z = T.pz[i] - T.nz[i] * d + T.tz[i] * o, y = bsGround(x, z);
          if (y + base < 6 || vrNear(x, z).dd < 10 || vrDist(x, z) > 380 || bsSlope(x, z) > 0.9 || excluded(x, z)) continue;
          const gul = ((bsGround(x - 20, z) + bsGround(x + 20, z) + bsGround(x, z - 20) + bsGround(x, z + 20)) / 4 - y) / 4; if (gul < 0.25 && vrLC(x, z) !== 2) continue;
          const h = 28 + RR() * 18; tk[1].add(x, y - 0.3, z, RR() * TAU, h * 0.22, h, [0.72 + RR() * 0.08, 0.86 + RR() * 0.08, 0.8 + RR() * 0.08]); exclPush(x, z, 2.5); nTrees++; m++; nRed++; }
      }
    }
    for (const t of pk) t.addTo(root, false);
    for (const t of bk) t.addTo(root, false);
    for (const t of tk) t.addTo(root, true);

    /* ---- the marine layer: two sheets of fog over the sea off the coast (always: the fog bank lying offshore, thin), thick over the land too on a
       misty run (dyn.bsMist.on, from the race; bsMistStep) ---- */
    if (LOD.draw('marineFog')) {   // (LOD: the offshore fog sheets only on VISOKA; its consumers in render/game are guarded by `if (world.dyn.bsMist)`)
      const U = { uT: { value: 0 }, uK: { value: 0.3 }, uC: { value: new THREE.Color(0xdde3e8) }, uLand: { value: 0 } }, mat = bsMistMat(U);
      const G = P.G, X1 = G.x0 + G.ntx * VRC * VRT, Z0 = G.z0 - 1500, Z1 = G.z0 + G.ntz * VRC * VRT + 1500, XW = G.x0 - 4000, coast = Math.min(...Array.from({ length: 8 }, (_, k) => T.px[Math.round(k / 7 * iE)])) - 120;
      for (const [hgt, sp] of [[y0 + 28, 0], [y0 + 75, 1]]) {   // (uv.x: 0 at the coast .. 1 far out; uv.y across the strip, for the soft ends)
        const g = new THREE.BufferGeometry(), pos = [], uv = [], idx = [], NX = 12, NZ = 12;
        for (let b = 0; b <= NZ; b++) for (let a = 0; a <= NX; a++) { const u = a / NX, v = b / NZ, x = lerp(X1, XW, u), z = lerp(Z0, Z1, v); pos.push(x, hgt + sp * 10 * Math.sin(v * 7 + u * 3), z); uv.push(clamp((coast - x) / 1500, 0, 1), v); }
        for (let b = 0; b < NZ; b++) for (let a = 0; a < NX; a++) { const p = b * (NX + 1) + a; idx.push(p, p + NX + 1, p + 1, p + 1, p + NX + 1, p + NX + 2); }
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
        const m = new THREE.Mesh(g, mat); m.renderOrder = 3; m.matrixAutoUpdate = false; root.add(m);
      }
      const M = out.dyn.bsMist = { on: 0, k: 0, U, root, base: new THREE.Color(), mc: new THREE.Color(0xd9dfe4), hex: -1 };
      // a line of brown pelicans gliding low over the water along the coast, up and down it (one mesh; bsPelicanStep moves it)
      const pel = new THREE.Mesh(bsPelicanGeo(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); pel.castShadow = true; root.add(pel);
      out.dyn.bsPel = { m: pel, a: sStart - 100, b: T.len - 40 };
      out.dyn.afterCam = (cam) => bsMistStep(M, cam);
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fac.addTo(sceneryGroup, ouCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: bsAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    { const geo = caCondorGeo(), mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), i0 = T.idx(sStart), L = [];   // two California condors (released again on this coast) circling over it
      for (const [r, sp, h, ox, oz, ph] of [[52, 0.14, 55, -60, 20, 0], [40, -0.17, 70, -30, -40, 2.6]]) {
        const m = new THREE.Mesh(geo, mat); m.scale.setScalar(1.25); m.castShadow = true; root.add(m); L.push({ m, r, sp, h, ox, oz, ph, bank: 0.3 }); }
      out.dyn.condors = { L, x0: T.px[i0], z0: T.pz[i0], y0: T.hy[i0], ax: T.px[i0], az: T.pz[i0], ay: T.hy[i0], t: null };
      caCondors(out.dyn.condors, 0, null); }
    crowdFinish(CR, root, out);
    out.stats = { plants: nPlants, bushes: nBush, cows: nCows, fence: nFence, seals: nSeal, barns: nBarn, boats: nBoat, whales: nWhale, trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), bridges: brInfo.length, oldRoad: nOld, driveways: nDrive, outcrops: nCrop, ponds: nPond, eucalyptus: nEuc, guano: nGuano, redwoods: nRed, sideRoads: out.stubStats.n };   // (read by the tests)
    return out;
  }

  Object.assign(API, { bsPelicanStep });   // (what World and the other worlds use of this one)
  World.ext.bigsur = (scene, tex, opts) => buildBigSur(scene, tex, opts);
})();
