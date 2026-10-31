/* =========================================================================
   WORLD — the shared world of the mountain passes (docs/nove-proge.md: Bâlea, Furka, Gudauri, Llogara, Porto Moniz, Yungas): one builder
   (buildPrelaz) for every pass, read from the track file's data (made by tools/proga/proga.py: def.dem, def.lc, def.col, def.bld, def.lakes,
   def.streams, def.cables, def.pylons, def.pulls, def.farDem, def.trees) and a look of each road's own (PL_LOOK[theme]: the colours of its
   ground and rock, the snow line, the plants, the signs and markings of its country, its landmarks). A new pass: its data from the tool, a
   PL_LOOK entry, World.ext[theme] below. What it uses of World comes from World.api (as the other worlds in files of their own).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caCar, caGH, caGround, caSlope, clamp, cone, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl,
    gable, ico, lerp, ouCutMat, ouRod, pkGroundMat, propFloorTable, rng, roadsideProps, rock, rpHash, sstep, starCone, tuftWindMat, valueNoise2,
    vary, vrDist, vrFar, vrGritTex, vrLC, vrLCf, vrNear, vrPrep
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ---- the looks of the passes. Land cover classes (def.lc, tools/proga): 0 alpine grass, 1 forest, 2 dwarf pine and shrubs, 3 built-up,
     4 rock faces, 5 water, 6 snow, 7 scree and bare ground ---- */
  const PL_LOOK = {
    // Bâlea (the Făgăraș Mountains, Romania): the glacial valley of the Bâlea under the cirque, green alpine pasture on the slopes with mats of
    // dwarf pine and juniper, grey-brown crystalline schist in crags, slabs and scree under the walls, snow lying on into the summer in the shady
    // gullies high up; the lake in the cirque with the huts and the stalls by it, the cable car up the valley, the tunnel's portal at the end
    balea: {
      seed: 4100, board: 'LACUL BÂLEA', sub: 'FĂGĂRAȘ', banner: ['TRANSFĂGĂRĂȘAN', '6 SERPENTINE · LACUL BÂLEA'],
      grass: [0.4, 0.5, 0.24], grassDry: [0.55, 0.55, 0.32], grassLush: [0.33, 0.48, 0.2], shrub: [0.17, 0.27, 0.14],
      rock: [0.5, 0.48, 0.45], rockWarm: [0.56, 0.5, 0.44], lichen: [0.34, 0.34, 0.3], scree: [0.62, 0.6, 0.56],
      sat: 0.5, satV: 1.35, snowLine: 2120, snowC: [1.0, 1.02, 1.06],
      rockCols: [[0.5, 0.48, 0.45], [0.56, 0.52, 0.47], [0.44, 0.43, 0.41], [0.6, 0.57, 0.52], [0.48, 0.44, 0.4]],
      centre: [0.95, 0.95, 0.92], dash: [3, 6], solidNear: 70,   // (white centre line: dashed 3 m / 6 m, solid through the hairpins)
      chev: ['#d8261c', '#ffffff'], warn: 'tri', rail: 'steel', shoulder: [0.66, 0.64, 0.6],
      fans: [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.12, 0.24, 0.62], [0.98, 0.82, 0.12], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.12, 0.14, 0.2], [0.55, 0.62, 0.7]],
      cars: [[0.85, 0.85, 0.83], [0.62, 0.12, 0.1], [0.14, 0.26, 0.5], [0.16, 0.16, 0.18], [0.5, 0.52, 0.55], [0.72, 0.7, 0.66]],
      roofs: [[0.32, 0.18, 0.12], [0.26, 0.27, 0.28], [0.44, 0.2, 0.14], [0.2, 0.24, 0.22]],
      sheep: 1, portal: 1, far: { lo: [0.36, 0.44, 0.26], hi: [0.5, 0.49, 0.45], dw: [0.18, 0.26, 0.16], snow: 2250 },
    },
  };

  let L = PL_LOOK.balea;   // (the look of the build under way)
  const PLCOL = [0, 0, 0];
  let SAT = null;          // the satellite colours on the terrain grid (def.col), RGB, NaN outside the rows near the road
  function plPrep() {   // the satellite colours (def.col: RGB 5-6-5 in each row's span of the 32 m grid, as the terrain's residuals)
    const D = T.def.dem, Cd = T.def.col; SAT = null; if (!Cd) return;
    const b = atob(Cd.b64), a = new Float32Array(D.nx * D.nz * 3).fill(NaN); let q = 0;
    for (let j = 0; j < D.nz; j++) { const [s, n] = D.rows[j]; for (let i = s; i < s + n; i++) { const v = b.charCodeAt(q) * 256 + b.charCodeAt(q + 1); q += 2; const k = (j * D.nx + i) * 3;
      a[k] = (v >> 11) / 31; a[k + 1] = ((v >> 5) & 63) / 63; a[k + 2] = (v & 31) / 31; } }
    SAT = a;
  }
  const SC = [0, 0, 0];
  function plSat(x, z) {   // the satellite colour at (x, z), bilinear (null outside)
    if (!SAT) return null; const D = T.def.dem, gx = (x - D.x0) / D.cell, gz = (z - D.z0) / D.cell, i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (i < 0 || j < 0 || i >= D.nx - 1 || j >= D.nz - 1) return null;
    let w = 0; SC[0] = SC[1] = SC[2] = 0;
    for (const [a, b, f] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const k = ((j + b) * D.nx + i + a) * 3; if (SAT[k] !== SAT[k] || f <= 0) continue; SC[0] += SAT[k] * f; SC[1] += SAT[k + 1] * f; SC[2] += SAT[k + 2] * f; w += f; }
    if (w < 0.3) return null; SC[0] /= w; SC[1] /= w; SC[2] /= w; return SC;
  }
  function plSnow(x, z, A, ny, sz, sx) {   // how much of the old snow lies at (x, z): above the look's snow line on the shady north- and east-facing slopes (higher on
    // the sunny ones), in patches and in the hollows, off the steepest faces; and the snowfields of the land cover (lc 6)
    const P = API.VR, face = clamp(-sz * 2.2 - (sx || 0) * 0.8, -1, 1), line = L.snowLine + 160 - 200 * face + (P.c4(x, z) - 0.5) * 160;
    const k = sstep(line, line + 60, A) * sstep(0.45, 0.72, ny) * sstep(0.62, 0.78, P.c5(x, z) + 0.2 * sstep(line, line + 300, A));
    return Math.max(k, vrLCf(x, z, 6) * sstep(0.32, 0.6, ny));
  }
  function plCol(x, z, h, ny, sz, dd, sx) {   // ground colour (times the grey grit map): the pasture (fresh, lush and dry patches), the satellite's colour over it,
    // the dwarf pine's dark mats, the scree, the rock (every steep face too) in bands with lichen, the snow, a gravel verge by the road
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), f = P.n4(x, z);
    const sh = vrLCf(x, z, 2) + vrLCf(x, z, 1), rk = vrLCf(x, z, 4), sc = vrLCf(x, z, 7), vi = vrLCf(x, z, 3);
    const dry = sstep(0.55, 0.82, m) * 0.7, lush = sstep(0.6, 0.85, q) * (1 - dry);
    let R = lerp(lerp(L.grass[0], L.grassDry[0], dry), L.grassLush[0], lush), G = lerp(lerp(L.grass[1], L.grassDry[1], dry), L.grassLush[1], lush), B = lerp(lerp(L.grass[2], L.grassDry[2], dry), L.grassLush[2], lush);
    const s = plSat(x, z); if (s) { const k = L.sat, m3 = (s[0] + s[1] + s[2]) / 3, sv = L.satV || 1.3; R = lerp(R, m3 + (s[0] - m3) * sv, k); G = lerp(G, m3 + (s[1] - m3) * sv, k); B = lerp(B, m3 + (s[2] - m3) * sv, k); }
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.08; B += (f - 0.5) * 0.06;
    R = lerp(R, L.shrub[0], sh * 0.75); G = lerp(G, L.shrub[1], sh * 0.75); B = lerp(B, L.shrub[2], sh * 0.75);
    R = lerp(R, 0.55, vi * 0.5); G = lerp(G, 0.52, vi * 0.5); B = lerp(B, 0.46, vi * 0.5);
    if (sc > 0) { const k = sc * (0.7 + 0.3 * P.n3(x, z)); R = lerp(R, L.scree[0], k); G = lerp(G, L.scree[1], k); B = lerp(B, L.scree[2], k); }
    // the rock: the faces of the land cover and the steepest ground away from the road; the steep banks between the hairpins' legs and by the road stay
    // grass over earth (in streaks down the fall line)
    const nearR = sstep(30, 12, dd), st = Math.max(sstep(0.66, 0.48, ny) * (1 - 0.8 * nearR), rk * (0.6 + 0.4 * sstep(0.35, 0.65, P.n3(x, z))));
    const bank = sstep(0.86, 0.62, ny) * (1 - st); if (bank > 0) { const e = bank * (0.35 + 0.35 * P.n2(x * 1.3, z * 1.3)); R = lerp(R, 0.5, e); G = lerp(G, 0.47, e); B = lerp(B, 0.36, e); }
    if (st > 0) { const w = sstep(0.45, 0.75, P.c3(x, z)), li = sstep(0.55, 0.8, P.n2(x * 1.7, z * 1.7)) * 0.5, band = 0.88 + 0.12 * Math.sin(A / 4.5 + P.c2(x * 0.4, z * 0.4) * 6);
      const r0 = lerp(L.rock[0], L.rockWarm[0], w) * band, g0 = lerp(L.rock[1], L.rockWarm[1], w) * band, b0 = lerp(L.rock[2], L.rockWarm[2], w) * band;
      R = lerp(R, lerp(r0, L.lichen[0], li), st); G = lerp(G, lerp(g0, L.lichen[1], li), st); B = lerp(B, lerp(b0, L.lichen[2], li), st); }
    const sn = plSnow(x, z, A, ny, sz, sx); R = lerp(R, L.snowC[0], sn); G = lerp(G, L.snowC[1], sn); B = lerp(B, L.snowC[2], sn);
    if (dd < 2) { const t = sstep(2, 0.3, dd) * 0.45 * (1 - sn); R = lerp(R, 0.56, t); G = lerp(G, 0.55, t); B = lerp(B, 0.5, t); }
    PLCOL[0] = R; PLCOL[1] = G; PLCOL[2] = B; return PLCOL;
  }
  function plGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in plTileGeo)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = plCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, nz / l, G.dd[jj * G.nx + ii], nx / l);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function plTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells, in the haze)
    const G = API.VR.G, Lt = VRC * VRT, x = G.x0 + (ti + 0.5) * Lt, z = G.z0 + (tj + 0.5) * Lt, d = vrDist(x, z);
    return d < 300 ? 1 : d < 440 ? 2 : 0;
  }
  function plTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by plCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = plCol(x, z, h, ny, nz, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)], nx); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? plTileOn(a, b) : 0);
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
  const plATex = {};   // (the board atlases of each look, made once and reused by every build of the road)
  function plAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the pass's board, the race's banner
    const key = L.seed + '|' + cps.join('|') + '|' + finA; if (plATex.a && plATex.ak === key) return plATex.a;
    if (plATex.a) plATex.a.dispose(); plATex.ak = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(292, 142, 440, 100); txt('FINISH', 512, 196, 92, '#111', 420);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#23466e'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#4a3a2a'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f1e6cc'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt(L.board, 512, 812, 60, '#f3ead6', 900); txt(finA, 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#f2f2ee'; x.fillRect(0, 896, 1024, 64); x.fillStyle = '#23466e'; x.fillRect(0, 960, 1024, 64);
    txt(L.banner[0], 512, 930, 54, '#16181c', 960); txt(L.banner[1], 512, 994, 44, '#fff', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (plATex.a = t);
  }
  function plAtlas2() {   // the small signs (8 x 8 cells of 128): 0-1 the bend warning (a red-bordered triangle with the bent arrow, right and left), 2-3 the
    // chevrons (white on red, right and left), 4 the speed limit (40), 5 the end of the limit; 8-15 the hairpins' numbers on a small white plate
    if (plATex.b && plATex.bk === L.seed) return plATex.b;
    if (plATex.b) plATex.b.dispose(); plATex.bk = L.seed;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 110); };
    for (const [k, dir] of [[0, 1], [1, -1]]) {   // the triangle: white, a red border, the black arrow bending the road's way
      const x0 = k * 128; x.fillStyle = '#c8201a'; x.beginPath(); x.moveTo(x0 + 64, 6); x.lineTo(x0 + 124, 116); x.lineTo(x0 + 4, 116); x.fill();
      x.fillStyle = '#f6f6f2'; x.beginPath(); x.moveTo(x0 + 64, 30); x.lineTo(x0 + 106, 104); x.lineTo(x0 + 22, 104); x.fill();
      x.strokeStyle = '#16181c'; x.lineWidth = 8; x.beginPath(); x.moveTo(x0 + 64 - 8 * dir, 98); x.lineTo(x0 + 64 - 8 * dir, 70); x.quadraticCurveTo(x0 + 64 - 8 * dir, 54, x0 + 64 + 10 * dir, 54); x.stroke();
      x.fillStyle = '#16181c'; x.beginPath(); x.moveTo(x0 + 64 + 8 * dir, 44); x.lineTo(x0 + 64 + 24 * dir, 54); x.lineTo(x0 + 64 + 8 * dir, 64); x.fill(); }
    for (const [k, dir] of [[2, 1], [3, -1]]) {   // the chevrons
      const x0 = k * 128; x.fillStyle = L.chev[0]; x.fillRect(x0, 0, 128, 128); x.fillStyle = L.chev[1];
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, 22); x.lineTo(cx + 18 * dir, 64); x.lineTo(cx - 14 * dir, 106); x.lineTo(cx - 34 * dir, 106); x.lineTo(cx - 2 * dir, 64); x.lineTo(cx - 34 * dir, 22); x.closePath(); x.fill(); } }
    { const x0 = 512; x.fillStyle = '#c8201a'; x.beginPath(); x.arc(x0 + 64, 64, 60, 0, TAU); x.fill(); x.fillStyle = '#f6f6f2'; x.beginPath(); x.arc(x0 + 64, 64, 46, 0, TAU); x.fill(); txt('40', x0 + 64, 68, 56, '#16181c', 80); }
    { const x0 = 640; x.fillStyle = '#f6f6f2'; x.beginPath(); x.arc(x0 + 64, 64, 60, 0, TAU); x.fill(); x.strokeStyle = '#16181c'; x.lineWidth = 3; x.stroke(); txt('40', x0 + 64, 68, 54, '#8a8a8a', 80);
      x.strokeStyle = '#16181c'; x.lineWidth = 7; x.beginPath(); x.moveTo(x0 + 24, 104); x.lineTo(x0 + 104, 24); x.stroke(); }
    for (let k = 0; k < 8; k++) { const x0 = k * 128, y0 = 128; x.fillStyle = '#16181c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f6f6f2'; x.fillRect(x0 + 6, y0 + 6, 116, 116); txt(String(k + 1), x0 + 64, y0 + 68, 84, '#16181c', 110); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (plATex.b = t);
  }
  function plTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them): 0 Norway spruce (a narrow dark spire), 1 dwarf pine (a low mat of
    // crooked branches with dark tufts), 2 juniper (a smaller, flatter, grey-green mat)
    const g = new GB(), R = rng(4140 + kind), rs = API.ROCK_SMOOTH;
    if (kind === 0) {
      const col = [0.08, 0.15, 0.1], tip = [0.14, 0.25, 0.17];
      [[0.0, 0.24, 0.3, 0.05], [0.18, 0.2, 0.27, 0.045], [0.36, 0.17, 0.24, 0.04], [0.52, 0.13, 0.22, 0.035], [0.67, 0.09, 0.2, 0.03]].forEach(([y, r, h, dr], k) => {
        const kk = k % 2 ? 1.1 : 1; starCone(g, 0, y, 0, r, h, 6, [col[0] * kk, col[1] * kk, col[2] * kk], tip, k * 0.7, dr); });
      cone(g, 0, 0.84, 0, 0.04, 0.16, 4, col, tip, 0.4);
    } else {
      API.ROCK_SMOOTH = true; const col = kind === 1 ? [0.1, 0.2, 0.11] : [0.2, 0.28, 0.2], n = kind === 1 ? 6 : 4;
      for (let k = 0; k < n; k++) { const a = k / n * TAU + R() * 0.5, d = k ? 0.32 : 0; ico(g, Math.cos(a) * d, 0.4 - d * 0.45, Math.sin(a) * d, 0.32, 0.7, vary(col, R, 0.18), R, 0.35); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function plSheepGeo() {   // a sheep (cream fleece, dark face and legs): x forward, ~1.2 m long
    const g = new GB(), R = rng(4151), fl = [0.88, 0.85, 0.76], dk = [0.16, 0.13, 0.12], rs = API.ROCK_SMOOTH;
    API.ROCK_SMOOTH = true; ico(g, 0, 0.72, 0, 0.44, 0.8, fl, R, 0.15); ico(g, -0.26, 0.7, 0, 0.38, 0.85, fl, R, 0.15); API.ROCK_SMOOTH = rs;
    box(g, 0.56, 0.86, 0, 0.32, 0.22, 0.2, 0, dk);
    for (const [u, v] of [[0.3, -0.13], [0.3, 0.13], [-0.4, -0.13], [-0.4, 0.13]]) box(g, u, 0, v, 0.08, 0.5, 0.08, 0, dk);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function plFarCol(A, sl, q) {   // the land beyond the corridor (irFar): the pasture green low down, grey-brown rock higher up and on the steep faces, the dwarf pine darker
    // on the lower slopes, snow in the high gullies
    const F = L.far, dw = sstep(1500, 1700, A) * sstep(2100, 1850, A) * 0.6, rk = Math.min(1, sstep(2050, 2350, A) * 0.8 + sstep(0.55, 0.95, sl) * 0.8);
    let c = [F.lo[0] + q * 0.04, F.lo[1] + q * 0.05, F.lo[2] + q * 0.03];
    const fo = sstep(1650, 1450, A); c = [lerp(c[0], 0.12, fo), lerp(c[1], 0.2, fo), lerp(c[2], 0.12, fo)];   // the spruce forest below the treeline
    c = [lerp(c[0], F.dw[0], dw), lerp(c[1], F.dw[1], dw), lerp(c[2], F.dw[2], dw)];
    c = [lerp(c[0], F.hi[0], rk), lerp(c[1], F.hi[1], rk), lerp(c[2], F.hi[2], rk)];
    const sn = sstep(F.snow, F.snow + 150, A) * sstep(0.9, 0.5, sl) * (0.5 + q); return [lerp(c[0], 0.95, sn), lerp(c[1], 0.96, sn), lerp(c[2], 0.98, sn)];
  }

  function buildPrelaz(scene, tex, opts, look) {
    L = look;
    const R = rng(L.seed), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.7, 0.68, 0.62] };
    vrPrep(); plPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(L.seed + 11, 140); P.c2 = valueNoise2(L.seed + 12, 60); P.c3 = valueNoise2(L.seed + 13, 190); P.c4 = valueNoise2(L.seed + 14, 110); P.c5 = valueNoise2(L.seed + 15, 24);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the buildings (def.bld [x, z, length, width, angle, height, kind 0 a hut / 1 a stall or shed / 2 a big house]), clear of the road
    const blds = [];
    for (const [x, z, Lb, Wb, ang, hb, kind] of def.bld || []) { if (Lb < 2 || Wb < 2) continue; const c = Math.cos(ang), s = Math.sin(ang); let ok = true;
      for (const [u, v] of [[0, 0], [-Lb / 2, -Wb / 2], [Lb / 2, -Wb / 2], [Lb / 2, Wb / 2], [-Lb / 2, Wb / 2]]) { const n = vrNear(x + c * u - s * v, z + s * u + c * v); if (n.i >= 0 && n.dd < 1.2) ok = false; }
      if (ok && vrDist(x, z) < 430) blds.push({ x, z, L: Math.min(Lb, 34), W: Math.min(Wb, 20), ang, h: hb, kind }); }
    // the car parks by the road (def.pulls [x, z, radius, distance]): a level plot at the road's height
    const pulls = [];
    for (const [x, z, r] of def.pulls || []) { const n = vrNear(x, z); if (n.i < 0) continue; const i = n.i, s = i * T.ds; if (s < 30 || s > T.len - 20) continue;
      const pad = { x, z, r: Math.max(5, Math.min(r, 22)), b: 12, h: T.hy[i] - 0.25, i }; P.pads.push(pad); pulls.push(pad); }
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 14, h: T.hy[i] - 0.25, sd, i }; };
    const padF = pulls.find(p => Math.abs(p.i * T.ds - sFin) < 160) || padBeside(sFin + 60, 12); if (!padF.sd) { const i = padF.i, sd = (padF.x - T.px[i]) * T.nx[i] + (padF.z - T.pz[i]) * T.nz[i] > 0 ? 1 : -1; padF.sd = sd; }
    if (P.pads.indexOf(padF) < 0) P.pads.push(padF);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the rocks and trees between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the rocks, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lq = eh.get(k); if (!Lq) eh.set(k, Lq = []); Lq.push(e); } return e; };
    const excluded = (x, z) => { const Lq = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lq) return false; for (let k = 0; k < Lq.length; k++) { const e = Lq[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const inLake = (x, z) => { for (const Lk of P.lakes) if (x > Lk.x0 - 2 && x < Lk.x1 + 2 && z > Lk.z0 - 2 && z < Lk.z1 + 2 && API.vrWater(x, z).e > -2) return true; return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    for (const p of pulls) exclPush(p.x, p.z, p.r + 2);
    exclPush(padF.x, padF.z, padF.r + 4);
    out.marks = {};   // (where the landmarks stand: the tests look for them)

    /* ---- terrain tiles; the lakes (def.lakes: OpenStreetMap's shores, the water a little below them) ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = plTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(plTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 70, specular: 0x2a3a44 });
      for (const Lk of P.lakes) {   // a 4 m grid near the road, 8 m farther out: the glacial lake's deep blue-green, paler at the shore, the sky in it
        const deep = [0.05, 0.2, 0.26], shal = [0.22, 0.4, 0.4], sky = [0.5, 0.62, 0.74];
        const g = new GB(true), uv = (q) => [q[0] / 14, -q[2] / 14], cc = new Map();
        const wc = (x, z) => { const key = Math.round(x) + ',' + Math.round(z); let c = cc.get(key); if (c) return c;
          const e = API.vrWater(x, z).e, ks = 0.35 * sstep(0.55, 0.8, P.n2(x * 2.2, z * 2.2)); c = [0, 1, 2].map(k => lerp(lerp(shal[k], deep[k], sstep(2, 26, e)), sky[k], ks)); cc.set(key, c); return c; };
        for (let z0 = Math.floor((Lk.z0 - 8) / 8) * 8; z0 < Lk.z1 + 8; z0 += 8) for (let x0 = Math.floor((Lk.x0 - 8) / 8) * 8; x0 < Lk.x1 + 8; x0 += 8) {
          const d = vrDist(x0 + 4, z0 + 4); if (d > 600) continue;
          const cs = d < 320 ? 4 : 8;
          for (let zz = z0; zz < z0 + 8; zz += cs) for (let xx = x0; xx < x0 + 8; xx += cs) {
            if (!(caGround(xx, zz) < Lk.h + 0.4 || caGround(xx + cs, zz) < Lk.h + 0.4 || caGround(xx, zz + cs) < Lk.h + 0.4 || caGround(xx + cs, zz + cs) < Lk.h + 0.4)) continue;
            const A = [xx, Lk.h, zz], B = [xx + cs, Lk.h, zz], C = [xx + cs, Lk.h, zz + cs], D = [xx, Lk.h, zz + cs];
            g.quadUp(A, B, C, D, [wc(A[0], A[2]), wc(B[0], B[2]), wc(C[0], C[2]), wc(D[0], D[2])], [uv(A), uv(B), uv(C), uv(D)]); }
        }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); out.dyn.water = tex.water; }
      }
      const big = P.lakes.reduce((a, b) => (!a || b.area > a.area ? b : a), null); if (big) out.marks.lake = [big.cx, big.cz];
    }

    /* ---- the road: asphalt with white edge lines and the country's centre line (dashed; solid through the hairpins), a gravel shoulder, then the verge out to a
       ditch past the barrier line, up or down onto the ground (120 m chunks); where the ground drops away below the barrier a dry-stone retaining wall ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.6;
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    const hairS = (def.curves || []).map(([d]) => sStart + d);
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.84 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; k *= 0.96 + 0.08 * P.n2(T.px[i] * 0.5 + o, T.pz[i] * 0.5); return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], gc = L.shoulder;
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          const wl = vp[si][i][2][1] < -2.6; if (wl && (k === 1 || k === 2)) { const q = 0.9 + 0.14 * rpHash(i >> 1, 43 + si); return k === 1 ? [0.62 * q, 0.6 * q, 0.56 * q] : [0.47 * q, 0.45 * q, 0.42 * q]; }   // (the wall's coping, its stones)
          if (k === 4) return plGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return plCol(x, z, T.hy[i] + y, 1 / l, 0, Math.max(0, o - bar), 0).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      const solid = (s) => hairS.some(h => Math.abs(s - h) < L.solidNear) || s < sStart + 20 || s > sFin - 10;
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const [o0, o1] of [[-(w - 0.3), -(w - 0.45)], [w - 0.45, w - 0.3]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          { const sm = (i + 0.5) * T.ds, ph = ((sm % (L.dash[0] + L.dash[1])) + (L.dash[0] + L.dash[1])) % (L.dash[0] + L.dash[1]);
            if (solid(sm) || ph < L.dash[0]) gl.quadUp(Pt(i, -0.07, 0.036), Pt(i, 0.07, 0.036), Pt(j, 0.07, 0.036), Pt(j, -0.07, 0.036), [L.centre, L.centre, L.centre, L.centre]); }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6)) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face: out, towards the slope below)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // chequered start and finish lines, a white line at each checkpoint
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = L.fans;
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: inLake, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, Wd, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = Wd / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const cell = (k) => { const u0 = (k % 8) / 8, v1 = 1 - Math.floor(k / 8) / 8; return [v1 - 1 / 8, v1, u0, u0 + 1 / 8]; };   // a small sign of the second atlas
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const signPost = (s, side, extra, k, Wd, H, tall) => {   // a sign of the second atlas on a steel post beside the road, facing the cars coming up
      const [px, pz, ii] = onSide(s, side, extra); if (excluded(px, pz)) return null; const py = caGround(px, pz), g = scen.get(px, pz), c = cell(k);
      box(g, px, py - 0.2, pz, 0.08, (tall || 2.1) + 0.2, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
      bannerQ(px, py + (tall || 2.1) - H * 0.4, pz, -T.tx[ii], -T.tz[ii], Wd, H, c[0], c[1], c[2], c[3], ban2); exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); return [px, py, pz, ii];
    };
    const carCols = L.cars;
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the buildings (OpenStreetMap's footprints, generic: no names or signs): the huts of stone and timber under steep metal roofs, the big houses
       (a hut's two storeys), the stalls and sheds (timber, a tarp or a low roof) ---- */
    let nBld = 0;
    {
      const RB = rng(L.seed + 21), stone = [[0.58, 0.56, 0.52], [0.52, 0.5, 0.47], [0.62, 0.6, 0.56]], wood = [[0.46, 0.32, 0.2], [0.4, 0.28, 0.18], [0.54, 0.4, 0.26]], tarps = [[0.2, 0.34, 0.6], [0.7, 0.16, 0.14], [0.86, 0.86, 0.84], [0.22, 0.46, 0.3]];
      for (const b of blds) {
        const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = caGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); }
        if (b.kind === 1) {   // a stall: timber walls, a tarp roof
          box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 2.5, b.W, b.ang, vary(wood[nBld % 3], RB, 0.1), null, true);
          gable(g, b.x, hi + 2.2, b.z, b.L + 0.5, b.W + 0.6, 0.5, b.ang, vary(tarps[Math.floor(RB() * tarps.length)], RB, 0.08), vary(wood[0], RB, 0.1));
        } else {
          const H1 = b.kind === 2 ? 6.2 : 3.2, st = vary(stone[nBld % 3], RB, 0.08), wd = vary(wood[nBld % 3], RB, 0.1), rf = vary(L.roofs[Math.floor(RB() * L.roofs.length)], RB, 0.08);
          box(g, b.x, lo - 0.4, b.z, b.L, hi - lo + 0.4 + H1 * 0.45, b.W, b.ang, st, null, true);
          box(g, b.x, hi + H1 * 0.45 - 0.02, b.z, b.L, H1 * 0.55, b.W, b.ang, wd, null, true);
          for (const f of [-1, 1]) for (let q = -1; q <= 1; q++) { if (b.L < 7 && q) continue; const u = q * b.L * 0.28, v = f * (b.W / 2 + 0.03);   // (windows on the long sides)
            box(g, b.x + c * u - s * v, hi + H1 * 0.55, b.z + s * u + c * v, 1.0, 0.9, 0.06, b.ang, [0.14, 0.17, 0.2]); }
          gable(g, b.x, hi + H1, b.z, b.L + 0.8, b.W + 0.8, Math.min(b.W, 12) * 0.42, b.ang, rf, wd);
        }
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++;
      }
    }

    /* ---- START: gantry with the start lights, the timing hut, pennants along the grid, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.62, 0.44, 0.28], [0.4, 0.28, 0.18], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.1, T.hd[i], [0.3, 0.32, 0.3], [0.62, 0.44, 0.28]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const pc = [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.14, 0.26, 0.6], [0.95, 0.72, 0.16]];
      for (let s = 8, k = 0; s < sStart + 50; s += 12, k++) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3); if (excluded(px, pz) && s > sStart - 8) continue;   // pennants on poles
        const g = scen.get(px, pz), py = caGround(px, pz); cyl(g, px, py - 0.2, pz, 0.05, 5.2, 5, [0.9, 0.9, 0.92]);
        const tri = (yy, c) => { const a = [px, py + yy, pz], b = [px, py + yy - 1.0, pz], cc = [px + T.tx[ii] * 1.6, py + yy - 0.5, pz + T.tz[ii] * 1.6]; g.triO(a, b, cc, c, [px - T.nx[ii], py + yy, pz - T.nz[ii]]); g.triO(a, cc, b, c, [px + T.nx[ii], py + yy, pz + T.nz[ii]]); };
        tri(4.9, pc[(k + (side > 0 ? 1 : 0)) % 4]); }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road below: concrete barriers across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }

    /* ---- the checkpoints: a blue gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.14, 0.27, 0.43]));

    /* ---- FINISH: chequered gantry and flags, the pass's board, the car park with cars, people about; the end of the road (the tunnel's portal, def.portal,
       or concrete barriers) ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4); if (excluded(px, pz) && Math.abs(s - sFin) > 8) continue; const py = caGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 14, -sdP, 2.4), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the board: timber on posts leaning back, on a stone plinth
      if (!excluded(sx, sz)) {
        for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.36, 0.24, 0.14]); }
        box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.58, 0.56, 0.52], [0.64, 0.62, 0.58]);
        { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
        exclPush(sx, sz, 5); }
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh), RC = rng(L.seed + 41);
      for (let k = 0; k < 10; k++) { const a = -14 + (k % 5) * 7, b = (k < 5 ? -4.5 : 4.5), px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || inLake(px, pz)) continue;
        if (k !== 4) caCar(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[Math.floor(RC() * carCols.length)], R, 0.15)); }
      for (let k = 0; k < 16; k++) { const px = padF.x + (R() - 0.5) * 26, pz = padF.z + (R() - 0.5) * 26; if (vrNear(px, pz).dd < 1 || inLake(px, pz)) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.0, eZ = T.pz[iE] + T.tz[iE] * 1.0, eY = T.hy[iE];
      if (L.portal) {   // the tunnel's portal: a concrete face across the road's end, the dark mouth of the tunnel in it, the rock of the mountain over it
        const g = scen.get(eX, eZ), hd = T.hd[iE], Wp = w * 2 + 5, Hp = 8.5, tx = T.tx[iE], tz = T.tz[iE], nx = T.nx[iE], nz = T.nz[iE], con = [0.7, 0.69, 0.66], dk = [0.03, 0.03, 0.035];
        box(g, eX + tx * 6, eY - 0.3, eZ + tz * 6, 12, 6.3, w * 2 + 0.6, hd, dk, dk);   // the mouth: a dark box going in
        for (const f of [-1, 1]) box(g, eX + nx * f * (w + 1.6) + tx * 0.5, eY - 0.6, eZ + nz * f * (w + 1.6) + tz * 0.5, 2.0, Hp + 0.6, 3.0, hd, con);   // the sides
        box(g, eX + tx * 0.5, eY + 5.6, eZ + tz * 0.5, 2.0, Hp - 5.6 + 0.4, Wp, hd, con, [0.64, 0.63, 0.6]);   // the lintel
        box(g, eX + tx * 0.6, eY + Hp, eZ + tz * 0.6, 2.4, 0.6, Wp + 0.6, hd, [0.6, 0.6, 0.58]);
        const RV = rng(L.seed + 47);
        for (let k = 0; k < 9; k++) { const a = (k / 8 - 0.5) * 2.6, d = 14 + RV() * 8, r0 = 8 + RV() * 7; rock(g, eX + tx * (d * Math.cos(a) * 0.6 + 8) + nx * d * Math.sin(a), eY + Hp + r0 * 0.25 - 2, eZ + tz * (d * Math.cos(a) * 0.6 + 8) + nz * d * Math.sin(a), r0 * 1.2, r0, r0, RV() * TAU, vary(L.rockCols[k % L.rockCols.length], RV, 0.06), RV, 0.3); }
        exclPush(eX, eZ, 16); out.marks.portal = [eX, eZ];
      } else for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, eY - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
    }

    /* ---- guardrails where the ground falls away and round the outside of the bends; chevrons on the outside of every hairpin, the bend warning and the
       hairpin's number before each (the game's numbering); the speed limit at the start ---- */
    let nRail = 0;
    {
      const need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), steel = [0.8, 0.82, 0.84], steelB = [0.56, 0.58, 0.6], postC = [0.5, 0.52, 0.54];
      const near = (i) => { for (const p of pulls) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 6) return true; return false; };
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || near(i)) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          if (!(nd[i] && nd[i + 1])) continue; const g = scen.get(T.px[i], T.pz[i]);   // W-beam: a front and a back face, a steel post every 4 m
          const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
          g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
          if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.12, 1.13, 0.12, T.hd[i], postC, null, true); }
        }
      }
      out.propR = 150; out.propFloor = propFloorTable(null, (i, side) => vp[side > 0 ? 1 : 0][i]);
      const spots = [];
      for (let i = T.idx(sStart + 30); i < T.idx(sFin - 30); i += 25) for (const side of [-1, 1]) if (!need[side > 0 ? 1 : 0][i] && !near(i)) spots.push([i, side]);   // (white delineator posts where there is no rail)
      out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
        floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sStart + 30 || s > sFin - 30; } });
    }
    (def.curves || []).forEach(([d, , turn], k) => {
      const r = signPost(sStart + d - 90, 1, 0.9, turn > 0 ? 0 : 1, 0.95, 0.85, 2.3);
      if (r && k < 8) { const [px, py, pz, ii] = r, c2 = cell(8 + k); bannerQ(px, py + 0.2, pz, -T.tx[ii], -T.tz[ii], 0.5, 0.5, c2[0], c2[1], c2[2], c2[3], ban2); }
      const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 6 && sStart + d <= q.i1 * T.ds + 6); if (!c || c.sev < 2) return;
      const out_ = -turn, cc = cell(turn > 0 ? 2 : 3);
      for (const o of [-14, 0, 14]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.7); if (excluded(cx, cz)) continue;
        const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
        box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
        bannerQ(cx, cy + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, cc[0], cc[1], cc[2], cc[3], ban2); CR.avoid(cx, cz, 0.6); }
    });
    signPost(sStart + 40, 1, 1.2, 4, 0.8, 0.8, 2.2);   // the speed limit up the pass

    /* ---- the cable car (def.cables, def.pylons: OpenStreetMap): steel pylons along the line, the two ropes sagging between them, a cabin on each, the
       stations at the ends as plain concrete blocks ---- */
    let nPyl = 0;
    if ((def.cables || []).length) {
      const gp = new GB(), steel = [0.42, 0.44, 0.46], rope = [0.12, 0.12, 0.13], top = [];
      const pyl = []; for (let k = 0; k + 2 < (def.pylons || []).length; k += 3) pyl.push(def.pylons.slice(k, k + 3));
      for (const cb of def.cables) {
        const p = cb.p, n = p.length / 2, pts = [];
        for (let k = 0; k < n; k++) pts.push([p[2 * k], p[2 * k + 1]]);
        const dir = (k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
        const H = (k) => (k === 0 || k === n - 1 ? 9 : 18 + 6 * rpHash(k, 91));   // (the stations' rope height, the pylons')
        for (let k = 0; k < n; k++) { const [x, z] = pts[k], y = vrFar(x, z), [dx, dz] = dir(k), dist = vrDist(x, z); top.push([x, y + H(k), z, dx, dz]);
          if (k === 0 || k === n - 1) { if (dist < 600) { box(scen.get(x, z), x, y - 0.5, z, 14, 9.5, 9, Math.atan2(dz, dx), [0.72, 0.71, 0.68], [0.5, 0.5, 0.5], true); exclPush(x, z, 10); } continue; }
          if (dist > 900) continue;
          const g = scen.get(x, z), hh = H(k), a = Math.atan2(dz, dx);   // a pylon: a tapering steel mast, the cross-arm with the two rope saddles
          for (let q = 0; q < 4; q++) { const f0 = q / 4, f1 = (q + 1) / 4, r0 = lerp(1.6, 0.6, f0), r1 = lerp(1.6, 0.6, f1); box(g, x, y + hh * f0 - (q ? 0 : 0.5), z, r0 * 0.9 + r1 * 0.1, hh / 4 + (q ? 0 : 0.5), r0 * 0.9 + r1 * 0.1, a, steel, null, true); }
          box(g, x, y + hh, z, 0.6, 0.5, 9, a, steel, null, true); exclPush(x, z, 3); nPyl++; }
        for (const f of [-1, 1]) for (let k = 0; k + 1 < top.length; k++) {   // the ropes: ~16 segments each span, sagging
          const A = top[k], B = top[k + 1], o = 4.2 * f, ax = A[0] - A[4] * o, az = A[2] + A[3] * o, bx = B[0] - B[4] * o, bz = B[2] + B[3] * o, span = Math.hypot(bx - ax, bz - az);
          if (Math.min(vrDist(ax, az), vrDist(bx, bz)) > 1100) continue;
          let px = ax, py = A[1], pz = az;
          for (let q = 1; q <= 16; q++) { const t = q / 16, x = lerp(ax, bx, t), z = lerp(az, bz, t), y = lerp(A[1], B[1], t) - span * 0.035 * 4 * t * (1 - t);
            ouRod(gp, [px, py, pz], [x, y, z], 0.06, rope, 3); px = x; py = y; pz = z; }
        }
        top.length = 0;
        { const k = Math.floor(n * 0.4), A = pts[k], B = pts[Math.min(n - 1, k + 1)], x = lerp(A[0], B[0], 0.5), z = lerp(A[1], B[1], 0.5), y = (vrFar(A[0], A[1]) + vrFar(B[0], B[1])) / 2 + 12, a = Math.atan2(B[1] - A[1], B[0] - A[0]);   // a cabin
          const g = scen.get(x, z); box(g, x, y, z, 4.2, 2.6, 2.6, a, [0.8, 0.14, 0.12], [0.86, 0.86, 0.84], true); box(g, x, y + 1.1, z, 4.25, 0.9, 2.65, a, [0.18, 0.22, 0.26], null, true); ouRod(g, [x, y + 2.6, z], [x, y + 5.6, z], 0.08, steel, 4); }
      }
      addM(gp, lMat, false);
      out.marks.cable = pyl.length ? [pyl[0][0], pyl[0][1]] : null;
    }

    /* ---- spectators: the start and the finish, the checkpoints, both sides of every hairpin, a few groups along the road ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return inLake(x, z); };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.12, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'PL start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'PL finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.55, label: 'PL cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.4, label: 'PL cp-' }); });
      (def.curves || []).forEach(([d, , turn], k) => { const sm = sStart + d; for (const sd of [-1, 1]) run(sm - 22, sm + 22, sd, { rows: 3, dens: sd === turn ? 0.5 : 0.35, flag: 0.18, label: 'PL hairpin ' + (k + 1) }); });
      for (let s = sStart + 400; s < sFin - 300; s += 600) { const sd = rpHash(Math.round(s), 7) < 0.5 ? -1 : 1; run(s, s + 24, sd, { rows: 2, dens: 0.35, clump: 0.9, label: 'PL group' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the trees and shrubs (instanced per 96 m chunk): spruce in the forest (lc 1), dwarf pine and juniper in mats (lc 2), a few dwarf pines on the
       pasture; none on the rock, the scree, the snow or the cliffs ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2].map(k => new IChunks(plTreeGeo(k), tMatT, 96));
    let nTrees = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(70000 * dens), RT = rng(L.seed + 61), SP = 3.6 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(240)) continue;
          if (hd > LOD.radius(90) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot)
          const c = vrLC(x, z), p = c === 1 ? 0.55 : c === 2 ? 0.62 : c === 0 ? 0.015 + 0.05 * sstep(0.62, 0.8, P.n5(x * 1.3 + 40, z * 1.3)) : 0;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.2) continue;
          if (excluded(x, z) || inLake(x, z)) continue;
          const sl = caSlope(x, z); if (sl > 1.1) continue;
          const y = caGround(x, z); if (plSnow(x, z, y + base, 1 / Math.sqrt(1 + sl * sl), 0, 0) > 0.4) continue;
          const sp = c === 1 && r3 < 0.7 ? 0 : r3 < 0.75 ? 1 : 2;
          let hgt, wid, col;
          if (sp === 0) { hgt = 10 + r4 * 12; wid = hgt * (0.3 + r2 * 0.08); col = [0.9 + r2 * 0.2, 0.92 + r4 * 0.16, 0.92 + r3 * 0.16]; }
          else if (sp === 1) { hgt = 0.9 + r4 * 1.4; wid = 2.2 + r2 * 3.2; col = [0.9 + r3 * 0.2, 0.95 + r4 * 0.1, 0.9]; }
          else { hgt = 0.5 + r4 * 0.6; wid = 1.4 + r2 * 2; col = [0.95 + r3 * 0.1, 0.98, 0.95]; }
          tk[sp].add(x, y - 0.15, z, r1 * 70, wid, hgt, col);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);

    /* ---- the pasture's plants (instanced per 96 m chunk): tufts of grass, cushions of flowers, boulders; stones on the scree and by the road ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);   // (the grass: in the wind, and the cut)
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    const pk = [0, 1, 2, 3].map(k => new IChunks(API.btPlantGeo(k), k === 0 ? wMat : pMat, k === 3 ? 64 : 96));
    const flowerC = [[1.0, 0.92, 0.35], [0.66, 0.5, 0.95], [1, 1, 1], [0.95, 0.5, 0.75], [0.5, 0.65, 1.0]];
    let nPlants = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(60000 * dens), RT = rng(L.seed + 71), SP = 3.4 / Math.sqrt(dens);
      const rc = L.rockCols;
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(220)) continue;
          if (hd > LOD.radius(70) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;
          const c = vrLC(x, z);
          let kind = -1;
          if (c === 0) kind = r1 < 0.5 ? 0 : r1 < 0.58 ? 1 : r1 < 0.62 ? 2 : -1;
          else if (c === 2) kind = r1 < 0.2 ? 0 : -1;
          else if (c === 4) kind = r1 < 0.16 ? 2 : r1 < 0.2 ? 0 : -1;
          else if (c === 7) kind = r1 < 0.12 ? 2 : r1 < 0.4 ? 3 : -1;
          else if (c === 1) kind = r1 < 0.05 ? 0 : -1;
          if (kind < 0) continue;
          const y0 = caGround(x, z), sl = caSlope(x, z); if (sl > (kind >= 2 ? 1.1 : 0.85)) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 1.6) continue;
          if (excluded(x, z) || inLake(x, z)) continue;
          const ny = 1 / Math.sqrt(1 + sl * sl); if (plSnow(x, z, y0 + base, ny, 0, 0) > 0.35) continue;
          if (kind === 0) pk[0].add(x, y0 - 0.05, z, r2 * TAU, 0.45 + r3 * 0.5, 0.25 + r4 * 0.3, [0.92 + r2 * 0.16, 0.95 + r3 * 0.1, 0.9 + r4 * 0.16]);
          else if (kind === 1) pk[1].add(x, y0 - 0.06, z, r2 * TAU, 0.4 + r3 * 0.6, 0.25 + r4 * 0.25, flowerC[Math.floor(r4 * flowerC.length)]);
          else { const q = rc[Math.floor(r2 * rc.length)], k = (0.85 + r3 * 0.3) / 0.62; pk[kind].add(x, y0 - (kind === 2 ? 0.15 : 0.04), z, r4 * TAU, kind === 2 ? 0.6 + r3 * 1.8 : 0.8 + r3, kind === 2 ? 0.45 + r4 * 1.2 : 0.8 + r4, [q[0] * k, q[1] * k, q[2] * k]); }
          if (++nPlants >= maxT) break grid;
        }
      }
      const RS = rng(L.seed + 77), maxS = Math.round(16000 * dens); let nS = 0;   // the stones by the road: little clusters strewn beside it, thinning out over ~30 m
      edge: for (let s = 12; s < T.len - 12; s += 1.3 / dens) for (const side of [-1, 1]) {
        const o = 1.7 + Math.pow(RS(), 2) * 30, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z) || inLake(x, z)) continue;
        const y0 = caGround(x, z), sl = caSlope(x, z), c = vrLC(x, z); if (sl > 1.15 || (c !== 4 && c !== 7 && r1 < 0.5)) continue;
        const q = rc[Math.floor(r2 * rc.length)], k = (0.84 + r3 * 0.28) / 0.62, sc = 0.8 + r1 * 1.1; pk[3].add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [q[0] * k, q[1] * k, q[2] * k]);
        if (++nS >= maxS) break edge;
      }
    }
    for (const t of pk) t.addTo(root, false);

    /* ---- the slopes: blocks at the foot of the cuts, crags and slabs where the slope rises steep beside the road, old snow in the shady gullies high up ---- */
    let nSnow = 0;
    {
      const RV = rng(L.seed + 81), rc = L.rockCols;
      for (let s = 10; s < T.len - 10; s += 6) for (const side of [-1, 1]) {   // blocks at the foot of the cuts
        if (RV() > 0.32) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 36, [x, z] = onSide(s, side, o), sz = 0.4 + RV() * 1.4; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || inLake(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = caGround(x, z), sl = caSlope(x, z), c = vrLC(x, z); if (sl < 0.3 && c !== 4 && c !== 7) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.25, sz, sz, RV() * TAU, vary(rc[Math.floor(RV() * rc.length)], RV, 0.1), RV, 0.28);
      }
      for (let s = 16; s < T.len - 16; s += 14) for (const side of [-1, 1]) {   // crags and slabs where the slope is steep (the schist: flatter, tilted slabs)
        if (RV() < 0.4) continue;
        const [x, z] = onSide(s, side, 8 + RV() * 80); if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(110)) continue;
        const sl = caSlope(x, z); if (sl < 0.6 && vrLC(x, z) !== 4) continue;
        const y = caGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(rc[Math.floor(RV() * rc.length)], RV, 0.06);
        for (let q = 0; q < n; q++) { const r0 = 2 + RV() * 4, qx = x + (RV() - 0.5) * 9, qz = z + (RV() - 0.5) * 9, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.15, qz, r0 * 1.3, r0 * (0.4 + RV() * 0.3), r0 * (0.8 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.06), RV, 0.22); }
      }
      API.ROCK_SMOOTH = true;
      const G = P.G, Lt = VRC * VRT;   // the old snow: flat white patches where the snow lies, on the full tiles
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        for (let k = 0; k < 6; k++) { const x = G.x0 + (ti + RV()) * Lt, z = G.z0 + (tj + RV()) * Lt, y = caGround(x, z), sl = caSlope(x, z), nn = vrNear(x, z);
          if (nn.i >= 0 && nn.dd < 4) continue; const sn = plSnow(x, z, y + base, 1 / Math.sqrt(1 + sl * sl), 0, 0); if (sn < 0.6) continue;
          ico(scen.get(x, z), x, y - 0.4, z, 3 + RV() * 4, 0.16, L.snowC, RV, 0.1); nSnow++; }
      }
      API.ROCK_SMOOTH = false;
    }

    /* ---- the flocks: sheep grazing on the pasture, a shepherd with each ---- */
    let nSheep = 0;
    if (L.sheep) {
      const RF = rng(L.seed + 91), sh = new IChunks(plSheepGeo(), pMat, 96);
      for (const f of [0.18, 0.55, 0.82]) {
        for (let tries = 0; tries < 30; tries++) { const s = sStart + f * (sFin - sStart) + (RF() - 0.5) * 200, side = RF() < 0.5 ? -1 : 1, [cx, cz] = onSide(s, side, 25 + RF() * 60);
          if (excluded(cx, cz) || inLake(cx, cz) || vrLC(cx, cz) !== 0 || caSlope(cx, cz) > 0.5) continue;
          const n = 14 + Math.floor(RF() * 14); let placed = 0;
          for (let k = 0; k < n * 3 && placed < n; k++) { const x = cx + (RF() - 0.5) * 40, z = cz + (RF() - 0.5) * 40, nn = vrNear(x, z); if ((nn.i >= 0 && nn.dd < 4) || excluded(x, z) || inLake(x, z) || caSlope(x, z) > 0.6) continue;
            sh.add(x, caGround(x, z), z, RF() * TAU, 0.9 + RF() * 0.25, 0.9 + RF() * 0.2, [1, 1, 1]); placed++; nSheep++; }
          person(cx + 6, cz - 4, RF() * TAU, [0.32, 0.26, 0.2]); exclPush(cx, cz, 24); break; }
      }
      sh.addTo(root, true);
    }

    /* ---- the puddles of a race in the rain (T.puddles; as Sani Pass') ---- */
    if (T.puddles && T.puddles.length) {
      const g = new GB(), PP = (s, d) => { const f = s / T.ds, i = clamp(Math.floor(f), 0, T.N - 2), t = f - i, j = i + 1, nx = lerp(T.nx[i], T.nx[j], t), nz = lerp(T.nz[i], T.nz[j], t);
        return [lerp(T.px[i], T.px[j], t) + nx * d, lerp(T.hy[i], T.hy[j], t) + 0.035, lerp(T.pz[i], T.pz[j], t) + nz * d]; };
      const SKY = [0.55, 0.59, 0.63], MID = [0.36, 0.36, 0.37], RIM = [0.3, 0.3, 0.31], n = 14, RP = rng(L.seed + 97);
      for (const [s, d, hl, hw] of T.puddles) {
        const c = PP(s, d), below = [c[0], c[1] - 5, c[2]], ph = RP() * TAU, wob = [];
        for (let k = 0; k < n; k++) { const a = k / n * TAU; wob.push([Math.cos(a), Math.sin(a), 0.84 + 0.16 * Math.sin(a * 3 + ph) * Math.cos(a * 2 - ph)]); }
        const ring = (f) => wob.map(([cx, sz, ww]) => PP(s + cx * hl * ww * f, d + sz * hw * ww * f)), I = ring(0.62), O = ring(1);
        for (let k = 0; k < n; k++) { const m = (k + 1) % n; g.triO(c, I[k], I[m], SKY, below); g.triO(I[k], O[k], O[m], MID, below, RIM, RIM); g.triO(I[k], O[m], I[m], MID, below, RIM, MID); }
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true })); m.matrixAutoUpdate = false; m.visible = false; m.name = 'puddles'; root.add(m);
      out.dyn.wet = { puddles: m, road: aMat, ground: gMat, base: { sh: 0, sp: 0 } };
    }

    /* ---- the view beyond the corridor (def.farDem: the ridges of the cirque, the valley below; irFar, World.update moves it with the camera); finish the meshes ---- */
    const FAR = API.irFar ? API.irFar(plFarCol) : null; if (FAR) { FAR.mesh.visible = false; root.add(FAR.mesh); out.dyn.irFar = FAR; }   // (hidden until the first World.update)
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: plAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: plAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, plants: nPlants, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), snow: nSnow, sheep: nSheep, pylons: nPyl, lakes: P.lakes.length, pulls: pulls.length, sat: !!SAT };   // (read by the tests)
    return out;
  }

  Object.assign(API, { PL_LOOK, buildPrelaz });   // (what World and the other worlds use of this one)
  for (const th of Object.keys(PL_LOOK)) World.ext[th] = (scene, tex, opts) => buildPrelaz(scene, tex, opts, PL_LOOK[th]);
})();
