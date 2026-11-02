/* =========================================================================
   WORLD — Chapman's Peak (theme 'chapman'): its own builder (World.ext.chapman), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    CAN, Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caCar, caNear, caProps, clamp, cone, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl, ico,
    lerp, ouCutMat, pkGroundMat, rng, rock, rpHash, sstep, stubExcl, stubGeo, stubProps, stubRails, stubVerge, tuftWindMat, valueNoise2, vary,
    vrDem, vrDist, vrGritTex, vrHouse, vrLC, vrLCf, vrNear, vrPrep, vrStubH
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= CHAPMAN'S PEAK (theme 'chapman') =================
     Chapman's Peak Drive (the Cape Peninsula, South Africa), its north end: from Hout Bay along the cliffs of Chapman's Peak above the Atlantic to
     the view point at the highest point of the road, on a clear late-summer afternoon. Built on Vršič's corridor (vrPrep and caNear read the same
     forms: def.dem, def.lc, def.bld), with a look of its own: the sea at height 0 below the road (one plane, the land under it dug down: chFar),
     grey granite at the foot of the cliffs and the orange-brown banded sandstone above (chCol), fynbos on the slopes (low shrubs, proteas,
     restios), the beach and the white houses of Hout Bay at the start, low stone walls on the sea side and retaining walls where the ground
     falls away, rockfall nets on the steep slopes above the road, a generic toll plaza (def.toll: booths beside the road, a canopy over it, the
     barriers up, no names on it; the canopy fades over the followed car: dyn.tunnel), the view points' lay-bys (def.views) with parked cars and people, baboons by the road, kelp
     beds, boats and the beach at Hout Bay, generic signs (no words); the gulls: the render's flock by the sea (def.sea); winter without snow (noSnow). South African road
     markings: yellow edge lines, a white double centre line. */
  const CHCOL = [0, 0, 0];
  function chFar(x, z) {   // the land away from the road: the real terrain, a little made-up relief inland; under the sea (the model's 0 m) dug down
    const P = API.VR, d = vrDem(x, z), alt = d + P.D.base;
    if (alt < 4) return d - (4 - Math.max(0, alt)) * 1.6 - Math.max(0, -alt);   // (the shore: the water line at ~2.5 m of the model)
    return d + ((P.n1(x, z) - 0.5) * 5 + (P.n2(x, z) - 0.5) * 2) * sstep(4, 20, alt);
  }
  function chH(x, z) {   // terrain height (as caH, on caNear: the road's blend near it, the real terrain and the sea floor farther out)
    const n = caNear(x, z), i = n.i, dd = n.dd; let h;
    if (i < 0) h = chFar(x, z);
    else { const hr = n.h - 0.3, f0 = chFar(x, z), seaL = -API.VR.D.base, ex = sstep(170, 50, dd) * 0.7;   // (below the road the drop exaggerated, the model blurs the cliffs; never below halfway to the sea)
      const f = f0 < hr ? Math.max(seaL + 0.5 * Math.max(0, f0 - seaL), f0 - (hr - f0) * ex) : f0; h = dd <= 1 ? hr : lerp(hr, f, sstep(1, 42, dd));
      if (dd > 1.5 && f > hr) h = Math.max(h, Math.min(f, hr + 1.7 * (dd - 1.5)));   // (uphill: the road cut into the rock, a steep face behind it)
      else if (dd > 2 && f < hr) h = Math.min(h, Math.max(f, hr - 2.4 * (dd - 2))); }   // (downhill: the cliff under the road, falling steeply to the ground (the model blurs it to a gentle slope))
    const pads = API.VR.pads; for (let k = 0; k < pads.length; k++) { const p = pads[k], d = Math.hypot(x - p.x, z - p.z), pb = p.b || 12; if (d < p.r + pb) h = lerp(p.h, h, sstep(p.r, p.r + pb, d)); }   // level plots: the lay-bys, the start
    if (i >= 0) h = Math.min(h, n.env);
    if (API.STG) h = vrStubH(x, z, h, i >= 0 ? dd : 999);   // the side roads: the ground levelled under them
    return h;
  }
  function chGH(i, j) {   // terrain height at grid vertex (i, j), computed once (VR.G: the same grid as Vršič's)
    const G = API.VR.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = chH(G.x0 + i * VRC, G.z0 + j * VRC); G.dd[k] = CAN.i >= 0 ? CAN.dd : 999; }
    return h;
  }
  function chGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / VRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = chGH(i, j); return a + u * (chGH(i + 1, j) - a) + v * (chGH(i, j + 1) - a); }
    const d = chGH(i + 1, j + 1); return d + (1 - u) * (chGH(i, j + 1) - d) + (1 - v) * (chGH(i + 1, j) - d);
  }
  function chSlope(x, z) { const a = chGround(x - 2.5, z), b = chGround(x + 2.5, z), c = chGround(x, z - 2.5), d = chGround(x, z + 2.5); return Math.hypot(b - a, d - c) / 5; }
  function chCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map): the fynbos as a mosaic (lc 1): grey-green shrubland, dark olive thickets, rusty
    // restio beds, silvery patches and dry ochre ground, sandy grey soil between them on the gentle slopes; darker under the trees (lc 2), gardens in
    // Hout Bay (lc 3), pale beach sand (lc 4) and wet sand at the water; the rock on every steep face and the outcrops (lc 0): grey granite low down,
    // the brown sandstone above (the line at ~110 m, ragged) in pale and dark layers; a trodden verge
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), f = P.n4(x, z), fine = P.n6(x, z), mid = P.n7(x, z);
    const tr = vrLCf(x, z, 2), se = vrLCf(x, z, 3), sa = vrLCf(x, z, 4), bare = vrLCf(x, z, 0);
    let R = 0.42 + (m - 0.5) * 0.08, G = 0.45 + (m - 0.5) * 0.07, B = 0.31 + (m - 0.5) * 0.04;   // fynbos: grey-green
    const dk = sstep(0.46, 0.66, P.c3(x, z) * 0.45 + mid * 0.55); R = lerp(R, 0.22, dk * 0.85); G = lerp(G, 0.3, dk * 0.85); B = lerp(B, 0.17, dk * 0.85);   // dense, dark olive thickets
    const rs = sstep(0.56, 0.8, q * 0.55 + f * 0.45) * (1 - dk); R = lerp(R, 0.56, rs * 0.8); G = lerp(G, 0.38, rs * 0.8); B = lerp(B, 0.22, rs * 0.8);   // restio beds: rusty brown
    const sv = sstep(0.62, 0.84, P.n5(x * 1.3, z * 1.3)) * (1 - dk); R = lerp(R, 0.62, sv * 0.65); G = lerp(G, 0.63, sv * 0.65); B = lerp(B, 0.55, sv * 0.65);   // silvery leaves
    const och = sstep(0.6, 0.86, P.n3(x * 1.2, z * 1.2)) * (1 - dk); R = lerp(R, 0.62, och * 0.5); G = lerp(G, 0.53, och * 0.5); B = lerp(B, 0.34, och * 0.5);   // dry, ochre ground
    const soil = sstep(0.62, 0.84, fine * 0.55 + f * 0.45) * sstep(0.8, 0.92, ny) * (1 - dk) * 0.7; R = lerp(R, 0.68, soil); G = lerp(G, 0.63, soil); B = lerp(B, 0.54, soil);   // sandy grey soil between the bushes
    const mo = (fine - 0.5) * 0.16 + (f - 0.5) * 0.07; R += mo; G += mo * 0.95; B += mo * 0.7;   // the bushes' own light and shade (the 5 m grid's mottle)
    R = lerp(R, 0.22, tr * 0.8); G = lerp(G, 0.3, tr * 0.8); B = lerp(B, 0.17, tr * 0.8);
    R = lerp(R, 0.4, se * 0.6); G = lerp(G, 0.5, se * 0.6); B = lerp(B, 0.28, se * 0.6);
    const line = 110 + (P.c4(x, z) - 0.5) * 50, ss = sstep(line - 15, line + 15, A), st = Math.max(sstep(0.8, 0.55, ny), bare * 0.4 * (0.5 + 0.5 * sstep(0.95, 0.8, ny)));   // the rock
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 3.2 + P.c2(x * 0.5, z * 0.5) * 6), thin = 0.5 + 0.5 * Math.sin(A * 1.7 + fine * 4), k = 0.76 + 0.18 * band + 0.06 * thin, lich = sstep(0.5, 0.78, mid) * 0.45;
      const rr = lerp(0.52, 0.55, ss) * k, rg = lerp(0.51, 0.46, ss) * k, rb = lerp(0.49, 0.39, ss) * k;   // granite / sandstone, the sandstone's layers
      R = lerp(R, lerp(rr, 0.42, lich) + (m - 0.5) * 0.04, st); G = lerp(G, lerp(rg, 0.43, lich) + (m - 0.5) * 0.03, st); B = lerp(B, lerp(rb, 0.38, lich), st); }   // (grey-green lichen)
    const sn = Math.max(sa, sstep(4.5, 2.6, A) * sstep(0.6, 0.8, ny)); R = lerp(R, 0.86, sn); G = lerp(G, 0.8, sn); B = lerp(B, 0.66, sn);   // the beach
    if (A < 2.6) { const wet = sstep(2.6, 1.2, A); R = lerp(R, 0.58, wet); G = lerp(G, 0.54, wet); B = lerp(B, 0.46, wet); }   // wet sand, the sea floor
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.4; R = lerp(R, 0.58, t); G = lerp(G, 0.54, t); B = lerp(B, 0.44, t); }
    CHCOL[0] = R; CHCOL[1] = G; CHCOL[2] = B; return CHCOL;
  }
  function chGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, as caGCol)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = chGH(ii, jj);
      const nx = (chGH(ii + 1, jj) - chGH(ii - 1, jj)) / (2 * VRC), nz = (chGH(ii, jj + 1) - chGH(ii, jj - 1)) / (2 * VRC), c = chCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / Math.hypot(nx, 1, nz), G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function chTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells, in the haze); round the start wider (the beach of Hout Bay)
    const G = API.VR.G, L = VRC * VRT, x = G.x0 + (ti + 0.5) * L, z = G.z0 + (tj + 0.5) * L, d = vrDist(x, z), df = Math.hypot(x - API.VR.st[0], z - API.VR.st[1]);
    return d < 300 ? 1 : d < 430 || df < 560 ? 2 : 0;
  }
  function chTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by chCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = chGH(i, j);
      let nx = -(chGH(i + st, j) - chGH(i - st, j)) / (2 * VRC * st), nz = -(chGH(i, j + st) - chGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = chCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? chTileOn(a, b) : 0);
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
  let chATex = null, chAKey = '', chA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function chAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the view point's sign, the race's banner (only
    // place names and plain words: no names of firms, events or the road's operator)
    const key = cps.join('|') + '|' + finA; if (chATex && chAKey === key) return chATex;
    if (chATex) chATex.dispose(); chAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(312, 142, 400, 100); txt('FINISH', 512, 196, 90, '#111', 380);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#1e5c9a'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#6b3f22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f1e6cc'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);   // (a brown board: a sight to see)
    txt("CHAPMAN'S PEAK", 512, 812, 58, '#f3ead6', 900); txt(finA, 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#0d5a75'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#f2c21b'; x.fillRect(0, 896, 1024, 10); x.fillRect(0, 1014, 1024, 10);
    txt("HOUT BAY  →  CHAPMAN'S PEAK", 512, 938, 56, '#fff', 960); txt('HILL CLIMB', 512, 990, 42, '#f2c21b', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (chATex = t);
  }
  const CH_BOARDS = [['HOUT BAY', '#6b3f22'], ['EAST FORT', '#6b3f22'], ['NOORDHOEK  →', '#1f5a3a'], ['THE SENTINEL', '#6b3f22']];
  function chAtlas2() {   // the small signs: row 0, two chevrons (black and white) and the rockfall warning (a red triangle, falling rocks, no words); rows 4-5,
    // the brown place boards and the green direction board (two a row, 512 x 128)
    if (chA2Tex) return chA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (const [k, dir] of [[0, 1], [1, -1]]) { const x0 = k * 128, y0 = 0; x.fillStyle = '#f4f4f0'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#16181c';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    { const x0 = 256; x.fillStyle = '#d42a1e'; x.beginPath(); x.moveTo(x0 + 64, 6); x.lineTo(x0 + 124, 118); x.lineTo(x0 + 4, 118); x.closePath(); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.moveTo(x0 + 64, 30); x.lineTo(x0 + 104, 106); x.lineTo(x0 + 24, 106); x.closePath(); x.fill();
      x.fillStyle = '#16181c'; x.beginPath(); x.moveTo(x0 + 40, 104); x.lineTo(x0 + 58, 56); x.lineTo(x0 + 66, 104); x.closePath(); x.fill();   // the slope
      for (const [cx, cy, r] of [[78, 60, 7], [88, 78, 6], [74, 92, 8]]) { x.beginPath(); x.arc(x0 + cx, cy, r, 0, TAU); x.fill(); } }   // the rocks
    { const x0 = 384; x.fillStyle = '#f4f4f0'; x.beginPath(); x.arc(x0 + 64, 64, 60, 0, TAU); x.fill(); x.strokeStyle = '#d42a1e'; x.lineWidth = 14; x.beginPath(); x.arc(x0 + 64, 64, 52, 0, TAU); x.stroke();   // a speed limit: 60
      txt('60', x0 + 64, 68, 58, '#16181c', 90); }
    { const x0 = 512; x.fillStyle = '#6b3f22'; x.fillRect(x0 + 4, 4, 120, 120); x.strokeStyle = '#f1e6cc'; x.lineWidth = 5; x.strokeRect(x0 + 10, 10, 108, 108);   // a view point: a brown board, a camera and the hills (no words)
      x.fillStyle = '#f1e6cc'; x.beginPath(); x.moveTo(x0 + 18, 104); x.lineTo(x0 + 48, 70); x.lineTo(x0 + 66, 88); x.lineTo(x0 + 86, 60); x.lineTo(x0 + 110, 104); x.closePath(); x.fill();
      x.fillRect(x0 + 40, 26, 48, 30); x.fillRect(x0 + 54, 20, 20, 8); x.fillStyle = '#6b3f22'; x.beginPath(); x.arc(x0 + 64, 41, 10, 0, TAU); x.fill(); }
    CH_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128;
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112); txt(n, x0 + 256, y0 + 66, 54, '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (chA2Tex = t);
  }
  function chPlantGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 a restio (a tuft of reed-like stems), 1 a fynbos shrub (grey-green
    // lumps), 2 a protea bush (green with pink flower heads), 3 a granite boulder (rounded, grey), 4 a few stones, 5 a tree (a stone pine: a trunk, a flat crown)
    const g = new GB(), R = rng(760 + kind), rs = API.ROCK_SMOOTH;
    const dot = (x, y, z, r, col) => { const a = R() * TAU, c = Math.cos(a) * r, s = Math.sin(a) * r, A = [x + c, y, z + s], B = [x - s, y + r * 0.5, z + c], C = [x - c, y, z - s], D = [x + s, y + r * 0.5, z - c];   // (a flower head: a little tent of two faces, seen from above)
      g.triO(A, B, C, col, [x, y - 1, z]); g.triO(A, C, D, col, [x, y - 1, z]); };
    if (kind === 0) {   // nine stems from a tight base, leaning out, olive with brown tips
      const base = [0.36, 0.4, 0.2], tip = [0.6, 0.46, 0.26];
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + R() * 0.6, lean = 0.12 + R() * 0.16, hh = 0.75 + R() * 0.25, bx = Math.cos(a) * 0.05, bz = Math.sin(a) * 0.05, tx = Math.cos(a) * lean, tz = Math.sin(a) * lean, ox = -Math.sin(a) * 0.04, oz = Math.cos(a) * 0.04;
        g.triO([bx - ox, 0, bz - oz], [bx + ox, 0, bz + oz], [tx, hh, tz], base, [tx * 0.5, hh * 0.2, tz * 0.5], base, tip); g.triO([bx - ox, 0, bz - oz], [tx, hh, tz], [bx + ox, 0, bz + oz], base, [-tx, hh * 0.4, -tz], tip, base); }
    } else if (kind === 1) {   // two soft grey-green lumps
      API.ROCK_SMOOTH = true; const col = [0.4, 0.45, 0.3];
      ico(g, 0, 0.42, 0, 0.47, 0.85, col, R, 0.3); ico(g, 0.3, 0.3, 0.12, 0.32, 0.8, [col[0] * 0.9, col[1] * 0.95, col[2] * 0.9], R, 0.35);
    } else if (kind === 2) {   // a rounded bush, dark green, five pink-and-cream flower heads on top
      API.ROCK_SMOOTH = true; ico(g, 0, 0.42, 0, 0.48, 0.9, [0.26, 0.36, 0.2], R, 0.25);
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R(), d = 0.16 + R() * 0.16; dot(Math.cos(a) * d, 0.8 + R() * 0.1, Math.sin(a) * d, 0.13, k % 2 ? [0.92, 0.5, 0.6] : [0.9, 0.66, 0.7]); }
    } else if (kind === 3) { API.ROCK_SMOOTH = true; rock(g, 0, 0.3, 0, 0.6, 0.55, 0.5, 0, [0.62, 0.61, 0.58], R, 0.18); }
    else if (kind === 4) {   // three stones, sunk in the ground: grey granite, ochre sandstone
      const C = [[0.6, 0.59, 0.56], [0.66, 0.5, 0.36], [0.52, 0.5, 0.48]];
      for (let k = 0; k < 3; k++) { const a = R() * TAU, d = k ? 0.25 + R() * 0.25 : 0; API.ROCK_SMOOTH = false; rock(g, Math.cos(a) * d, 0.05, Math.sin(a) * d, 0.14 + R() * 0.1, 0.1 + R() * 0.06, 0.12 + R() * 0.08, R() * TAU, C[k], R, 0.3); }
    } else if (kind === 5) {   // a stone pine: a leaning trunk, a broad flat crown of three lumps
      API.ROCK_SMOOTH = true; cyl(g, 0, 0, 0, 0.035, 0.62, 4, [0.36, 0.28, 0.22]);
      ico(g, 0.03, 0.78, 0, 0.34, 0.45, [0.2, 0.3, 0.17], R, 0.25); ico(g, -0.16, 0.73, -0.1, 0.26, 0.45, [0.17, 0.27, 0.15], R, 0.25);
    } else if (kind === 6) {   // a heath (erica) in flower: a low wide mat, dark green, its top pink and magenta
      API.ROCK_SMOOTH = true; ico(g, 0, 0.22, 0, 0.5, 0.5, [0.24, 0.32, 0.18], R, 0.2);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R(), d = 0.1 + R() * 0.28; dot(Math.cos(a) * d, 0.42 + R() * 0.05, Math.sin(a) * d, 0.2, k % 2 ? [0.88, 0.38, 0.62] : [0.76, 0.32, 0.64]); }
    } else {   // a pincushion bush (leucospermum) in flower: a green dome, round orange and yellow heads on top
      API.ROCK_SMOOTH = true; ico(g, 0, 0.36, 0, 0.44, 0.8, [0.3, 0.4, 0.22], R, 0.22);
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.5, d = 0.14 + R() * 0.2; dot(Math.cos(a) * d, 0.66 + R() * 0.08, Math.sin(a) * d, 0.12, k % 3 ? [0.98, 0.56, 0.12] : [0.98, 0.82, 0.18]); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function chBaboonGeo() {   // a chacma baboon sitting (x forward, ~0.75 m): grey-brown body leaning forward, the long dark muzzle, arms on the ground, the tail's arch
    const g = new GB(), F = [0.52, 0.47, 0.39], D = [0.3, 0.27, 0.24], R = rng(3001);
    API.ROCK_SMOOTH = true; ico(g, -0.05, 0.3, 0, 0.24, 1.2, F, R, 0.1); ico(g, 0.14, 0.58, 0, 0.13, 1.0, F, R, 0.08); API.ROCK_SMOOTH = false;
    box(g, 0.26, 0.52, 0, 0.16, 0.08, 0.08, 0, D);   // the muzzle
    for (const sd of [-1, 1]) { box(g, 0.14, 0, 0.1 * sd, 0.07, 0.34, 0.07, 0, D); box(g, -0.12, 0, 0.13 * sd, 0.22, 0.1, 0.1, 0, F); }   // arms, haunches
    box(g, -0.3, 0.06, 0, 0.12, 0.3, 0.05, 0, D); box(g, -0.42, 0.24, 0, 0.2, 0.05, 0.05, 0.6, D);   // the tail
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function buildChapman(scene, tex, opts) {
    const R = rng(3011), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: chGround, camFloor: chGround, props: [], farClip: true, ownTex: [], dust: [0.7, 0.64, 0.54], noSnow: true };   // (noSnow: the Cape's winter is green and rainy)
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base, seaY = -base;
    P.c1 = valueNoise2(731, 120); P.c2 = valueNoise2(732, 50); P.c3 = valueNoise2(733, 160); P.c4 = valueNoise2(734, 260);
    P.st = [T.px[T.idx(sStart)], T.pz[T.idx(sStart)]];
    // the buildings (def.bld [x, z, length, width, angle, height, kind]: the houses of Hout Bay): clear of the road and the sea
    const blds = [];
    for (const b of def.bld || []) {
      const [x, z, L, W, ang, hgt, kind] = b; if (L < 3 || W < 3) continue;
      const c = Math.cos(ang), s = Math.sin(ang); let ok = true;
      for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const px = x + c * u - s * v, pz = z + s * u + c * v, n = vrNear(px, pz); if ((n.i >= 0 && n.dd < 2) || vrDem(px, pz) + base < 3) { ok = false; break; } }
      if (ok) blds.push({ x, z, L: Math.min(L, 40), W: Math.min(W, 24), ang, hgt, kind });
    }
    // the view points' lay-bys (def.views [metres after the start line, side]): a level plot beside the road; the start's (the road closed behind it)
    const padBeside = (s, sd, r) => { const i = T.idx(s), o = (sd > 0 ? T.br[i] : T.bl[i]) + r - 1.5; return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 10, h: T.hy[i] - 0.2, sd, i }; };
    const views = (def.views || []).map(([d, sd]) => { const p = padBeside(sStart + d, sd, 9); P.pads.push(p); return p; });
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the houses and boulders between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    stubExcl(exclPush);   // (nothing grows or stands on the side roads)
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    for (const v of views) exclPush(v.x, v.z, v.r + 2);
    const sea = (x, z) => chGround(x, z) < seaY + 0.3;

    /* ---- terrain tiles, the sea (one plane at height 0: turquoise over the sand near the shore, deep blue farther out) ---- */
    let nFar = 0, nOver = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = chTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(chTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 70, specular: 0x334a58 });
      const sc = new Chunks(480, true), deep = [0.05, 0.22, 0.36], mid = [0.1, 0.4, 0.5], shal = [0.3, 0.62, 0.6], foam = [0.86, 0.9, 0.9];   // (480 m chunks: culled out of view)
      const wc = (x, z) => { const dpt = seaY - chFar(x, z), dr = vrDist(x, z) < 470 ? seaY - chGround(x, z) : dpt, k = Math.max(0, Math.min(dpt, dr));
        const c = k < 0.6 ? foam : k < 3 ? [0, 1, 2].map(q => lerp(foam[q], shal[q], sstep(0.6, 3, k))) : k < 10 ? [0, 1, 2].map(q => lerp(shal[q], mid[q], sstep(3, 10, k))) : [0, 1, 2].map(q => lerp(mid[q], deep[q], sstep(10, 30, k)));
        const ks = 0.12 * sstep(0.55, 0.85, P.n2(x * 2.4, z * 2.4)); return [0, 1, 2].map(q => lerp(c[q], 0.8, ks)); };
      const D = P.D, X0 = D.x0, Z0 = D.z0, X1 = D.x0 + (D.nx - 1) * D.cell, Z1 = D.z0 + (D.nz - 1) * D.cell, uv = (x, z) => [x / 14, -z / 14];
      const lo = (a, b) => (vrDist(a, b) < 470 ? chGround(a, b) : chFar(a, b)) < seaY + 0.4;
      for (let z0 = Z0; z0 < Z1; z0 += 48) for (let x0 = X0; x0 < X1; x0 += 48) {   // 48 m blocks where any corner is under water: 8 m cells by the shore near the road (the surf), 24 m out to 600 m, else one
        const d = vrDist(x0 + 24, z0 + 24), cs = d < 330 ? 8 : d < 620 ? 24 : 48, g = sc.get(x0 + 24, z0 + 24);
        for (let zz = z0; zz < z0 + 48; zz += cs) for (let xx = x0; xx < x0 + 48; xx += cs) {
          if (!(lo(xx, zz) || lo(xx + cs, zz) || lo(xx, zz + cs) || lo(xx + cs, zz + cs))) continue;
          const A = [xx, seaY, zz], B = [xx + cs, seaY, zz], C = [xx + cs, seaY, zz + cs], E = [xx, seaY, zz + cs];
          g.quadUp(A, B, C, E, [wc(A[0], A[2]), wc(B[0], B[2]), wc(C[0], C[2]), wc(E[0], E[2])], [uv(A[0], A[2]), uv(B[0], B[2]), uv(C[0], C[2]), uv(E[0], E[2])]);
        }
      }
      for (const [a, b, c2, d2] of [[X0 - 3000, Z0 - 3000, X0, Z1 + 3000], [X0, Z1, X1 + 3000, Z1 + 3000]]) {   // the open ocean beyond the model: west and south of it
        const A = [a, seaY, b], B = [c2, seaY, b], C = [c2, seaY, d2], E = [a, seaY, d2]; sc.get(-1e5, -1e5).quadUp(A, B, C, E, [deep, deep, deep, deep], [uv(a, b), uv(c2, b), uv(c2, d2), uv(a, d2)]); }
      sc.addTo(root, wMat, false, true); out.dyn.water = tex.water; out.sea = seaY;
      // the surf: a band of white foam along the shore within 420 m of the road (4 m cells where the water line runs, a fainter one a cell out to sea),
      // in the water's own moving picture (dyn.water scrolls it); 480 m chunks
      { const fc = new Chunks(480, true), fm = new THREE.MeshBasicMaterial({ map: tex.water, vertexColors: true, transparent: true, depthWrite: false }), cs = 4;
        const wet = (a, b) => chGround(a, b) < seaY + 0.15, F = (al) => [0.97, 0.99, 1, al];
        for (let z0 = D.z0; z0 < Z1; z0 += cs) for (let x0 = D.x0; x0 < X1; x0 += cs) {
          if (vrDist(x0, z0) > 420) { x0 += 28; continue; }
          const n = (wet(x0, z0) ? 1 : 0) + (wet(x0 + cs, z0) ? 1 : 0) + (wet(x0, z0 + cs) ? 1 : 0) + (wet(x0 + cs, z0 + cs) ? 1 : 0);
          let al = n > 0 && n < 4 ? 0.85 : 0;
          if (!al && n === 4) { const m = (wet(x0 - cs, z0) ? 1 : 0) + (wet(x0 + 2 * cs, z0) ? 1 : 0) + (wet(x0, z0 - cs) ? 1 : 0) + (wet(x0, z0 + 2 * cs) ? 1 : 0); if (m < 4) al = 0.4; }   // (the next cell out: a fainter line)
          if (!al) continue;
          const y = seaY + 0.06, q = 0.6 * rpHash(Math.round(x0), Math.round(z0)), A = [x0, y, z0], B = [x0 + cs, y, z0], C = [x0 + cs, y, z0 + cs], E = [x0, y, z0 + cs], c = F(al * (0.7 + q));
          const gq = fc.get(x0, z0); gq.A = true; gq.quadUp(A, B, C, E, [c, c, c, c], [uv(x0 * 3, z0 * 3), uv((x0 + cs) * 3, z0 * 3), uv((x0 + cs) * 3, (z0 + cs) * 3), uv(x0 * 3, (z0 + cs) * 3)]);
        }
        fc.addTo(root, fm, false, false); }
      // the land beyond the corridor (the bay's shores, The Sentinel, the mountain behind): a coarse 32 m mesh of the model, sunk under the corridor's tiles
      const fg = new GB(true), fc = (x, z, h) => { const c = chCol(x, z, h, 0.8, 999); return [c[0] * 0.92, c[1] * 0.94, c[2] * 0.98]; }, cs = D.cell;
      const fh = (x, z) => chFar(x, z) - 40 * sstep(480, 380, vrDist(x, z));
      for (let z = Z0; z < Z1; z += cs) for (let x = X0; x < X1; x += cs) {
        if (vrDist(x + cs / 2, z + cs / 2) < 300) continue;
        const A = [x, fh(x, z), z], B = [x + cs, fh(x + cs, z), z], C = [x + cs, fh(x + cs, z + cs), z + cs], E = [x, fh(x, z + cs), z + cs];
        if (Math.max(A[1], B[1], C[1], E[1]) < seaY - 0.5) continue;
        fg.quadUp(A, B, C, E, [fc(A[0], A[2], A[1]), fc(B[0], B[2], B[1]), fc(C[0], C[2], C[1]), fc(E[0], E[2], E[1])], [uv(A[0], A[2]), uv(B[0], B[2]), uv(C[0], C[2]), uv(E[0], E[2])]);
      }
      if (!fg.empty) { const fm = new THREE.Mesh(fg.geometry(), gMat); fm.receiveShadow = true; fm.matrixAutoUpdate = false; root.add(fm); }
    }

    /* ---- the road: asphalt with yellow edge lines and a white double centre line (South Africa), a gravel shoulder, then the verge out past the
       barrier line, up or down onto the ground; where the ground falls away a retaining wall, its top flush with the verge (120 m chunks) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const onBr = new Uint8Array(N), sw = 0.6;
    for (const [a, b] of def.bridges || []) for (let s = sStart + a - 3; s <= sStart + b + 3; s += T.ds / 2) onBr[T.idx(s)] = 1;
    const SB = stubGeo({ gCol: chGCol, paveC: [0.8, 0.8, 0.81], gravC: [0.74, 0.68, 0.58], shC: [0.74, 0.68, 0.58], line: 'solid' });   // the side roads (their mouths; their surfaces in the road's chunks below)   // (the side roads' gravel the colour of the road's own shoulder: gc below)
    // the verge's profile across the road's side, outwards: [offset from the centre line, height above the road]: the shoulder's edge, three points
    // across the (up to 11 m wide) verge (its colours: the fynbos' mosaic, not one smooth band), the barrier line, the ditch or wall, out onto the ground
    const vMid = (P5) => { const [a, b] = P5; return [a, [lerp(a[0], b[0], 0.25), lerp(a[1], b[1], 0.25)], [lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5)], [lerp(a[0], b[0], 0.75), lerp(a[1], b[1], 0.75)], ...P5.slice(1)]; };
    const vProf = (i, side) => vMid(vProf5(i, side)), vProf5 = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      if (onBr[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];
      const ms = stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;   // (a side road's mouth: no ditch, the verge at its surface)
      const y = T.hy[i], gAt = (o) => { const q = side * o; return chGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.84 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k * 0.99, k * 0.97]; };
      const wht = [0.95, 0.95, 0.92], ylw = [0.97, 0.78, 0.15], gc = [0.74, 0.68, 0.58], deck = [0.64, 0.63, 0.6];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return k < 6 ? deck : [0.52, 0.51, 0.49];
          const wl = vp[si][i][5][1] < -2.6; if (wl && (k === 4 || k === 5)) { const q = 0.9 + 0.14 * rpHash(i >> 2, 51 + si); return k === 4 ? [0.66 * q, 0.6 * q, 0.5 * q] : [0.56 * q, 0.5 * q, 0.42 * q]; }   // (the retaining wall: dressed sandstone)
          if (k === 7) return chGCol(x, z);
          const sl = k === 5 ? chSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return chCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      const gut = [0, 1].map(si => { const a = new Uint8Array(N); for (let i = 0; i < N; i++) { let m = -9; for (let k = Math.max(0, i - 4); k <= Math.min(N - 1, i + 4); k++) m = Math.max(m, vp[si][k][7][1]); a[i] = m > 1 && !onBr[i] ? 1 : 0; } return a; });   // (the mountain side: where the ground rises beside the road, over a few samples: the grid's steps)
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const [o0, o1] of SB.edges(i, j, [[-(w - 0.3), -(w - 0.45)], [w - 0.45, w - 0.3]])) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [ylw, ylw, ylw, ylw]);
          for (const [o0, o1] of [[-0.21, -0.09], [0.09, 0.21]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          if (i % 6 === 0) { const ce = [0.98, 0.98, 0.96]; gl.quadUp(Pt(i, -0.08, 0.04), Pt(i, 0.08, 0.04), Pt(j, 0.08, 0.04), Pt(j, -0.08, 0.04), [ce, ce, ce, ce]); }   // (a cat's eye stud on the centre line every ~12 m)
          { const ph = rpHash(i >> 3, 91), ln = ph < 0.12 ? (ph < 0.06 ? -1 : 1) : 0; if (ln && (i & 7) < 3) { const pc = [0.62, 0.62, 0.64], o0 = ln < 0 ? -w * 0.85 : 0.35, o1 = ln < 0 ? -0.35 : w * 0.85;   // (a patch of newer asphalt over one lane, ~6 m long: darker)
            gr.quadUp(Pt(i, o0, 0.028), Pt(i, o1, 0.028), Pt(j, o1, 0.028), Pt(j, o0, 0.028), [pc, pc, pc, pc], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); } }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], sc = onBr[i] ? deck : gc;
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [sc, sc, sc, sc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            if (gut[si][i] && gut[si][j]) for (const [f0, f1, gk] of [[0.05, 0.45, 0.9], [0.45, 0.85, 0.7]]) {   // (on the mountain side a concrete gutter at the verge's foot: a V, its far half in shade)
              const yv = (q, o) => q[0][1] + (q[1][1] - q[0][1]) * (o - q[0][0]) / Math.max(1e-3, q[1][0] - q[0][0]) + 0.045, o0 = w + sw + f0, o1 = w + sw + f1, cc = [0.74 * gk, 0.73 * gk, 0.7 * gk];
              gl.quadUp(Pt(i, side * o0, yv(qi, o0)), Pt(i, side * o1, yv(qi, o1)), Pt(j, side * o1, yv(qj, o1)), Pt(j, side * o0, yv(qj, o0)), [cc, cc, cc, cc]); }
            for (let k = 0; k < 7; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 4 && (qi[5][1] < -2.6 || qj[5][1] < -2.6)) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[5][1], qj[5][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);
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
    const scen = new Chunks(160), fac = new Chunks(240, true), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const shirts = [[0.95, 0.95, 0.95], [0.12, 0.4, 0.26], [0.98, 0.76, 0.12], [0.12, 0.2, 0.5], [0.84, 0.2, 0.16], [0.4, 0.62, 0.86], [0.92, 0.5, 0.2], [0.14, 0.14, 0.16]];
    const CR = crowdCtx({ gH: chGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => sea(x, z), shirts }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (as Los Caracoles')
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road (as Los Caracoles')
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro) => crowdPut(CR, x, chGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: shirts[Math.floor(R() * shirts.length)] }, 1);
    const carCols = [[0.92, 0.92, 0.9], [0.7, 0.72, 0.74], [0.16, 0.16, 0.18], [0.62, 0.12, 0.1], [0.16, 0.3, 0.55], [0.85, 0.85, 0.82], [0.32, 0.34, 0.36]];
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the houses of Hout Bay: white and cream plastered walls, grey, slate and terracotta roofs ---- */
    let nBld = 0;
    {
      const RB = rng(3021), walls = [[0.96, 0.95, 0.92], [0.94, 0.9, 0.8], [0.9, 0.9, 0.88], [0.92, 0.86, 0.74], [0.97, 0.96, 0.94]], roofs = [[0.36, 0.38, 0.4], [0.62, 0.3, 0.2], [0.24, 0.26, 0.3], [0.52, 0.5, 0.48], [0.66, 0.36, 0.24]], woods = [[0.42, 0.3, 0.2], [0.56, 0.42, 0.28]];
      for (const b of blds) {
        const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = chGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); }
        if (b.kind === 3) { const mc = vary([0.8, 0.78, 0.74], RB, 0.1); box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 2.8, b.W, b.ang, mc, null, true); }
        else { const fl = b.hgt > 6.5 || b.L * b.W > 260 ? 2 : 1;
          vrHouse(g, fac.get(b.x, b.z), b.x, lo, hi, b.z, b.ang, b.L, b.W, fl, { wall: walls[Math.floor(RB() * walls.length)], wood: woods[Math.floor(RB() * 2)], roof: vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1) }); }
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++;
      }
    }

    /* ---- START (Hout Bay, by the beach): the gantry with the lights, the timing hut, the road closed behind; the checkpoints; the FINISH at the view
       point: a chequered gantry, the brown sign with the altitude, the green board on to Noordhoek, the road closed farther on ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 6, -1, 3.2), hy = chGround(hx, hz), gh = scen.get(hx, hz);
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.94, 0.93, 0.9], [0.4, 0.42, 0.45], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.78, 0.77, 0.74], [0.86, 0.85, 0.82]); }
      { const [bx, bz, bi] = onSide(sStart + 16, -1, 1.6), by = chGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
      T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.1, 0.3, 0.55]));
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const [sx, sz, si] = onSide(sFin + 20, 1, 2.2), sy = chGround(sx, sz), gs = scen.get(sx, sz), [v0, v1] = row(6);   // the view point's brown sign, facing the arriving cars
      for (const o of [-3, 3]) box(gs, sx + T.nx[si] * o, sy - 0.2, sz + T.nz[si] * o, 0.14, 2.2, 0.14, T.hd[si], [0.36, 0.26, 0.16]);
      bannerQ(sx, sy + 1.1, sz, -T.tx[si], -T.tz[si], 6.6, 0.82, v0, v1); exclPush(sx, sz, 4);
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.78, 0.77, 0.74], [0.86, 0.85, 0.82]); }
      const nm = (n) => T.names.find(q => q.n.startsWith(n));   // the brown place boards and the green one at the end of the road
      for (const [n, k, o] of [['Hout Bay', 0, 30], ['East Fort', 1, -30], ['Razgledišče · The Sentinel', 3, -40]]) { const q = nm(n); if (!q) continue; const [bx, bz, bi] = onSide(sStart + q.d + o, -1, 1.4); if (excluded(bx, bz)) continue;
        const by = chGround(bx, bz), [bv0, bv1, bu0, bu1] = board(k); box(scen.get(bx, bz), bx, by - 0.2, bz, 0.1, 2.6, 0.1, T.hd[bi], [0.6, 0.61, 0.63]); bannerQ(bx, by + 1.7, bz, -T.tx[bi], -T.tz[bi], 3.2, 0.8, bv0, bv1, bu0, bu1, ban2); exclPush(bx, bz, 2); }
      { const [bx, bz, bi] = onSide(T.len - 60, -1, 1.4), by = chGround(bx, bz), [bv0, bv1, bu0, bu1] = board(2); box(scen.get(bx, bz), bx, by - 0.2, bz, 0.1, 2.6, 0.1, T.hd[bi], [0.6, 0.61, 0.63]); bannerQ(bx, by + 1.7, bz, -T.tx[bi], -T.tz[bi], 3.2, 0.8, bv0, bv1, bu0, bu1, ban2); exclPush(bx, bz, 2); }
    }

    /* ---- the toll plaza (def.toll; a generic one, no names): a booth on an island beside each edge (outside the barriers), a flat canopy on four
       columns over the road, the boom barriers up, rumble strips across the road before it ---- */
    if (def.toll != null) {
      const s0 = sStart + def.toll, i = T.idx(s0), x = T.px[i], z = T.pz[i], y = T.hy[i], hd = T.hd[i], g = scen.get(x, z), L1 = T.bl[i] + 1.6, L2 = T.br[i] + 1.6;
      const conc = [0.8, 0.79, 0.76], blue = [0.12, 0.3, 0.56], gl = [0.3, 0.42, 0.5];
      for (const [sd, L] of [[-1, L1], [1, L2]]) {
        const bx = x + T.nx[i] * sd * L, bz = z + T.nz[i] * sd * L;
        box(g, bx, y - 0.4, bz, 16, 0.6, 2.6, hd, [0.86, 0.84, 0.8], [0.9, 0.88, 0.84], true);   // the island
        box(g, bx, y + 0.2, bz, 3.2, 2.6, 2.0, hd, conc, null, true); box(g, bx, y + 1.0, bz, 3.25, 1.0, 2.05, hd, gl, null, true); box(g, bx, y + 2.8, bz, 3.8, 0.3, 2.6, hd, blue, blue, true);   // the booth
        for (const u of [-6, 6]) { const px = bx + T.tx[i] * u, pz = bz + T.tz[i] * u; box(g, px, y - 0.1, pz, 0.5, 6.0, 0.5, hd, conc); }   // the canopy's columns
        { const px = bx + T.tx[i] * 3 - T.nx[i] * sd * 1.0, pz = bz + T.tz[i] * 3 - T.nz[i] * sd * 1.0; box(g, px, y + 0.2, pz, 0.3, 1.0, 0.3, hd, [0.95, 0.85, 0.15]);   // the boom: up
          for (let k = 0; k < 6; k++) { const qx = px - T.nx[i] * sd * 0.2, qz = pz - T.nz[i] * sd * 0.2; box(g, qx, y + 1.3 + k * 0.6, qz, 0.1, 0.6, 0.1, hd, k % 2 ? [0.9, 0.12, 0.1] : [0.96, 0.96, 0.94]); } }
        exclPush(bx, bz, 10); CR.block(bx, bz, 16, 3, hd);
      }
      const cx = x + T.nx[i] * (L2 - L1) / 2, cz = z + T.nz[i] * (L2 - L1) / 2;
      { const cg = new GB(), W = L1 + L2 + 3, c = Math.cos(hd), sn = Math.sin(hd);   // the canopy (its own material: it fades while the followed car is under it, dyn.tunnel)
        box(cg, cx, y + 5.8, cz, 15, 0.7, W, hd, [0.92, 0.92, 0.9], [0.66, 0.68, 0.7], true); box(cg, cx, y + 5.6, cz, 15.1, 0.3, W + 0.1, hd, blue, null, true);
        for (let u = -6; u <= 6; u += 4) for (let v = -W / 2 + 2; v < W / 2 - 1; v += 3.2) box(cg, cx + c * u - sn * v, y + 6.5, cz + sn * u + c * v, 2.6, 0.06, 2.2, hd, [0.5, 0.62, 0.72], null, true);   // the skylight panels on top
        for (let v = -W / 2 + 3; v < W / 2 - 2; v += 4) box(cg, cx - sn * v, y + 5.45, cz + c * v, 1.6, 0.12, 0.5, hd, [1, 0.97, 0.86], null, true);   // the lamps under it
        const gm = new THREE.MeshLambertMaterial({ vertexColors: true }), m = new THREE.Mesh(cg.geometry(), gm); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
        out.dyn.tunnel = { mat: gm, s0: s0 - 8, s1: s0 + 8, ranges: [[s0 - 8, s0 + 8]] }; }
      const gl2 = new GB(); for (const o of [-40, -34, -28]) for (let k = 0; k < 2; k++) { const s = s0 + o + k * 0.6; gl2.quadUp(Pt(T.idx(s), -w + 0.5, 0.04), Pt(T.idx(s), w - 0.5, 0.04), Pt(T.idx(s + 0.3), w - 0.5, 0.04), Pt(T.idx(s + 0.3), -w + 0.5, 0.04), [W1, W1, W1, W1]); }
      addM(gl2, lMat); out.marks = { toll: [x, z] };
    }

    /* ---- the view points' lay-bys: a gravel plot beside the road behind a low stone wall, parked cars, people looking out, a bench ---- */
    {
      const RV = rng(3031);
      for (const v of views) {
        const hh = T.hd[v.i], c = Math.cos(hh), sn = Math.sin(hh), nx = T.nx[v.i] * v.sd, nz = T.nz[v.i] * v.sd;
        for (let k = 0; k < 3; k++) { const a = (k - 1) * 5.2, px = v.x + c * a - nx * 1.5, pz = v.z + sn * a - nz * 1.5; if (vrNear(px, pz).dd < 1.2 || RV() < 0.3) continue;
          caCar(scen.get(px, pz), px, chGround(px, pz), pz, hh + PI / 2, carCols[Math.floor(RV() * carCols.length)]); }
        { const g = scen.get(v.x, v.z); for (let u = -v.r; u < v.r; u += 2) { const px = v.x + c * u + nx * (v.r - 0.6), pz = v.z + sn * u + nz * (v.r - 0.6); box(g, px, chGround(px, pz) - 0.2, pz, 2.0, 0.85, 0.55, hh, vary([0.6, 0.52, 0.42], RV, 0.1), [0.66, 0.6, 0.5], true); } }   // the wall at the drop
        { const px = v.x + nx * (v.r - 2), pz = v.z + nz * (v.r - 2), g = scen.get(px, pz), py = chGround(px, pz); box(g, px, py + 0.4, pz, 1.8, 0.08, 0.45, hh, [0.5, 0.36, 0.22]); for (const u of [-0.7, 0.7]) box(g, px + c * u, py, pz + sn * u, 0.1, 0.45, 0.4, hh, [0.3, 0.3, 0.32]); }   // a bench
        for (let k = 0; k < 4; k++) { const u = (RV() - 0.5) * v.r * 1.4, px = v.x + c * u + nx * (v.r - 1.6), pz = v.z + sn * u + nz * (v.r - 1.6); if (vrNear(px, pz).dd < 1) continue; person(px, pz, Math.atan2(nz, nx) - PI / 2); }
      }
    }

    /* ---- low stone walls on the sea side and wherever the ground falls away (a W-beam rail on the bridge's approach), black-and-white chevrons on the
       outside of the sharp bends; a marker post every ~50 m where there is neither (knockable where it fits: caProps) ---- */
    /* ---- the side roads' cones across their mouths, the rails and gates at their ends, the streets' names (stubProps) ---- */
    out.stubStats = stubProps({ scen, out, root, gH: chGround, loc: { closed: 'ROAD CLOSED', gate: 'CLOSED' }, posts: 'none' });
    let nRail = 0, nWall = 0, nNet = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 6); k <= Math.min(N - 1, c.i1 + 6); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19]) { const o = side * (bar + d); if (chGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.2 : 2.2 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 20), vAt = new Uint8Array(N); for (const v of views) for (let k = v.i - 6; k <= v.i + 6; k++) if (k >= 0 && k < N) vAt[k] = v.sd > 0 ? 2 : 1;
      const stone = [[0.62, 0.55, 0.45], [0.56, 0.5, 0.42], [0.66, 0.6, 0.5], [0.58, 0.56, 0.52]];
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || onBr[i] || vAt[i] === (side > 0 ? 2 : 1)) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 5) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        stubRails(nd, side);   // (open across the side roads' mouths)
        nWall += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (onBr[i] && onBr[i + 1]) {   // the bridge: a concrete parapet
            const a = Q(i, -0.1, -0.05), b = Q(i + 1, -0.1, -0.05), c = Q(i + 1, 0.95, -0.05), d = Q(i, 0.95, -0.05), a2 = Q(i, -0.1, 0.4), b2 = Q(i + 1, -0.1, 0.4), c2 = Q(i + 1, 0.95, 0.4), d2 = Q(i, 0.95, 0.4), inn = Q(i, 0.4, 0.18);
            g.quadO(a, b, c, d, [0.68, 0.67, 0.64], inn); g.quadO(a2, b2, c2, d2, [0.6, 0.59, 0.56], inn); g.quadO(d, c, c2, d2, [0.76, 0.74, 0.7], inn); nRail++;
          } else if (nd[i] && nd[i + 1]) {   // a low wall of rough sandstone blocks with a flat coping
            const k = 0.92 + 0.14 * rpHash(i, 71 + side), col = stone[(i >> 1) % 4].map(v => v * k), top = [0.72 * k, 0.68 * k, 0.6 * k];
            const a = Q(i, -0.15, -0.05), b = Q(i + 1, -0.15, -0.05), c = Q(i + 1, 0.75, -0.05), d = Q(i, 0.75, -0.05), a2 = Q(i, -0.6, 0.5), b2 = Q(i + 1, -0.6, 0.5), c2 = Q(i + 1, 0.75, 0.5), d2 = Q(i, 0.75, 0.5), inn = Q(i, 0.3, 0.22);
            g.quadO(a, b, c, d, col, inn); g.quadO(a2, b2, c2, d2, col.map(v => v * 0.85), inn); g.quadO(d, c, c2, d2, top, Q(i, -2, 0.22));
          } else if (!nd[i] && !onBr[i] && !vAt[i] && i % 25 === 0 && i > 2 && i < iE - 2 && !SB.mouthV[side > 0 ? 1 : 0][i]) mkPosts.push([i, side]);
        }
      }
      const kp = caProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
      const sign = (s, side, cell, face) => { const [px, pz, ii] = onSide(s, side, 0.9); if (excluded(px, pz)) return; const py = chGround(px, pz), u0 = cell / 8;   // a sign on a post beside the road (atlas row 0), facing the cars coming (face 1: up the road)
        box(scen.get(px, pz), px, py - 0.2, pz, 0.08, 2.2, 0.08, T.hd[ii], [0.6, 0.61, 0.63]); bannerQ(px, py + 1.3, pz, -T.tx[ii] * face, -T.tz[ii] * face, 0.8, 0.8, 7 / 8, 1, u0, u0 + 1 / 8, ban2); exclPush(px, pz, 1.2); CR.avoid(px, pz, 0.6); };
      for (const d of [70, 1240, 2330, 3480]) { sign(sStart + d, -1, 3, 1); sign(sStart + d + 25, 1, 3, -1); }   // the speed limit, both ways (on the left of the road: they drive on the left)
      for (const v of views) sign(v.i * T.ds - 70, -1, 4, 1);   // a view point ahead
      for (const c of T.corners) { if (c.sev < 3) continue;   // chevrons on the outside of the sharp bends, facing the cars coming in (both ways)
        const out_ = -c.dir, sm = (c.i0 + c.i1) / 2 * T.ds;
        for (const o of [-12, 0, 12]) { const [cx, cz, ci] = onSide(sm + o, out_, 0.7); if (excluded(cx, cz)) continue;
          const cy = chGround(cx, cz), g = scen.get(cx, cz), cell = c.dir > 0 ? 0 : 1, u0 = cell / 8;
          box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
          bannerQ(cx, cy + 0.75, cz, -T.tx[ci], -T.tz[ci], 0.7, 0.7, 7 / 8, 1, u0, u0 + 1 / 8, ban2); CR.avoid(cx, cz, 0.6); } }
    }

    const fallen = [];   // (where stones lie fallen on the shoulder under the nets: [s, side])
    /* ---- the rockfall nets: on the mountain side where the slope above the road is steep, a row of steel posts (4.5 m, leaning out over the road a
       little) 2-5 m behind the barrier line with a wire mesh between them, the anchor ropes up the slope; the rockfall warning sign before each
       run ---- */
    {
      const nMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: false }), ng = new GB(true), steel = [0.42, 0.43, 0.46], nc = [0.5, 0.52, 0.55];
      const want = [new Uint8Array(N), new Uint8Array(N)];
      for (let i = 0; i < N; i++) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i], at = (d) => { const o = side * (bar + d); return chGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) - T.hy[i]; };
        if (at(12) > 6 && at(25) > 16) want[side > 0 ? 1 : 0][i] = 1; }   // (the slope rising steeply right behind the road)
      for (const side of [-1, 1]) {
        const nd = want[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl, i0 = T.idx(sStart + 120), i1 = T.idx(sFin - 40);
        for (let i = 0; i < N; i++) if (i < i0 || i > i1 || onBr[i] || SB.mouthV[side > 0 ? 1 : 0][i] || (T.gap && (T.gap[side > 0 ? 1 : 0][Math.max(0, i - 3)] || T.gap[side > 0 ? 1 : 0][Math.min(N - 1, i + 3)]))) nd[i] = 0;   // (none across a side road)
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++;
          if ((j - i) * T.ds >= 40) {
            const off = 3 + 1.5 * rpHash(i, 81), Qn = (k, y) => { const o = side * (bar[k] + off); const x = T.px[k] + T.nx[k] * o, z = T.pz[k] + T.nz[k] * o; return [x, chGround(x, z) + y, z]; };
            for (let k = i; k < j - 1; k++) { const a = Qn(k, 0.1), b = Qn(k + 1, 0.1), c = Qn(k + 1, 4.3), d = Qn(k, 4.3); c[0] -= T.nx[k + 1] * side * 0.6; c[2] -= T.nz[k + 1] * side * 0.6; d[0] -= T.nx[k] * side * 0.6; d[2] -= T.nz[k] * side * 0.6;
              ng.quadUp(a, b, c, d, [nc, nc, nc, nc], [[0, 0], [1, 0], [1, 1], [0, 1]]); nNet++; }
            for (let k = i; k < j; k += 3) fallen.push([k * T.ds + (rpHash(k, 7) - 0.5) * 4, side]);   // (stones come down through the nets: on the shoulder below)
            for (let k = i; k < j; k += 4) { const a = Qn(k, -0.2), g = scen.get(a[0], a[2]); box(g, a[0] - T.nx[k] * side * 0.3, a[1], a[2] - T.nz[k] * side * 0.3, 0.16, 4.7, 0.16, T.hd[k], steel);
              const up = Qn(k, 0); exclPush(up[0], up[2], 1.4); }
            const [wx, wz, wi] = onSide(i * T.ds - 30, -side, 0.9); if (!excluded(wx, wz)) { const wy = chGround(wx, wz); box(scen.get(wx, wz), wx, wy - 0.2, wz, 0.08, 2.2, 0.08, T.hd[wi], [0.6, 0.61, 0.63]); bannerQ(wx, wy + 1.3, wz, -T.tx[wi], -T.tz[wi], 0.9, 0.8, 7 / 8, 1, 2 / 8, 3 / 8, ban2); exclPush(wx, wz, 1.2); }
          }
          i = j; }
      }
      if (!ng.empty) { const m = new THREE.Mesh(ng.geometry(), nMat); m.matrixAutoUpdate = false; root.add(m); }
    }

    /* ---- spectators (the race): the start and the finish, the checkpoints, the view points, a few groups on the lay-bys ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.1, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 60, sStart + 60, sd, { rows: 3, dens: 0.6, label: 'CH start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'CH finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.5, label: 'CH cp' }); });
      for (const q of T.names) if (/^Razgled/.test(q.n)) run(sStart + q.d - 40, sStart + q.d + 40, 1, { rows: 2, dens: 0.4, clump: 0.8, label: 'CH lookout' });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the fynbos (instanced per 96 m chunk): restios and low shrubs everywhere on the slopes, proteas in clumps, granite boulders low down, stone
       pines and milkwoods where the trees grow (lc 2) and round the houses; none in the sea, on the beach or the cliffs ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    const pk = [0, 1, 2, 3, 4, 5, 6, 7].map(k => new IChunks(chPlantGeo(k), k === 0 ? wMat : pMat, k === 4 ? 64 : 120));
    let nPlants = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(70000 * dens), RT = rng(3041), SP = 3.0 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(230)) continue;   // (LOD: a shorter plant/tree draw distance on the lower tiers)
          if (hd > LOD.radius(70) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;
          const c = vrLC(x, z), y0 = chGround(x, z), A = y0 + base, sl = chSlope(x, z);
          if (A < 4 || c === 4 || c === 5) continue;
          let kind = -1;
          if (c === 2) kind = r1 < 0.16 ? 5 : r1 < 0.4 ? 1 : -1;
          else if (c === 3) kind = r1 < 0.06 ? 5 : r1 < 0.12 ? 1 : -1;
          else if (c === 0) kind = r1 < 0.05 ? 3 : r1 < 0.1 ? 0 : -1;
          else { const pr = sstep(0.5, 0.8, P.c3(x * 1.6, z * 1.6)), er = sstep(0.6, 0.82, P.n5(x * 1.8 + 40, z * 1.8)), pc = sstep(0.62, 0.84, P.n3(x * 2.1 - 70, z * 2.1)), nr = sstep(70, 25, hd);   // (proteas, heaths and pincushions in patches; thicker by the road)
            kind = r1 < 0.24 ? 0 : r1 < 0.5 + 0.12 * nr ? 1 : r1 < 0.5 + 0.12 * nr + 0.16 * pr ? 2 : r1 < 0.62 + 0.12 * nr + 0.3 * er ? 6 : r1 < 0.7 + 0.12 * nr + 0.25 * pc ? 7 : r1 < 0.76 && A < 120 ? 3 : -1; }
          if (kind < 0) continue;
          if (sl > (kind === 3 ? 1.2 : 0.95)) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 1.6) continue;
          if (excluded(x, z)) continue;
          const tint = [0.9 + r2 * 0.2, 0.92 + r3 * 0.14, 0.88 + r4 * 0.18];
          if (kind === 0) pk[0].add(x, y0 - 0.05, z, r2 * TAU, 0.5 + r3 * 0.5, 0.5 + r4 * 0.5, tint);
          else if (kind === 1) pk[1].add(x, y0 - 0.1, z, r2 * TAU, 0.8 + r3 * 1.1, 0.6 + r4 * 0.8, r2 < 0.3 ? [0.98 + r3 * 0.1, 1.04, 0.92] : r2 < 0.55 ? [0.82, 0.9, 0.8] : tint);   // (some greyer and silvery, some darker)
          else if (kind === 6) pk[6].add(x, y0 - 0.06, z, r2 * TAU, 0.9 + r3 * 1.0, 0.6 + r4 * 0.5, tint);
          else if (kind === 7) pk[7].add(x, y0 - 0.08, z, r2 * TAU, 0.9 + r3 * 0.7, 0.8 + r4 * 0.5, tint);
          else if (kind === 2) pk[2].add(x, y0 - 0.08, z, r2 * TAU, 0.9 + r3 * 0.8, 0.9 + r4 * 0.7, tint);
          else if (kind === 3) { const k = 0.85 + r3 * 0.3; pk[3].add(x, y0 - 0.2, z, r4 * TAU, 0.6 + r3 * 1.6, 0.5 + r4 * 1.1, [k, k, k * 0.98]); }
          else if (nn.i < 0 || nn.dd > 4) pk[5].add(x, y0 - 0.1, z, r2 * TAU, 5 + r3 * 5, 5 + r4 * 4, tint);
          if (++nPlants >= maxT) break grid;
        }
      }
    }
    {   // the verge inside the barriers (up to 11 m of it): low restio tufts, flowering heaths and stones in the fynbos' patches, never on the shoulder
      // (cars drive over them as over grass); on the verge's own surface (the profile)
      const RG = rng(3043), maxG = Math.round(16000 * dens); let nG = 0;
      const vY = (i, side, o) => { const Q = vp[side > 0 ? 1 : 0][i]; let m = 0; while (m < Q.length - 2 && Q[m + 1][0] < o) m++; const a = Q[m], b = Q[m + 1]; return T.hy[i] + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); };
      verge: for (let s = 12; s < T.len - 12; s += 1.3 / dens) for (const side of [-1, 1]) {
        const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i]; if (onBr[i] || bar - w < 3) continue;
        const o = w + 1.6 + RG() * (bar - w - 2.1), [x, z] = onSide(s, side, o - bar), r1 = RG(), r2 = RG(), r3 = RG();
        if (excluded(x, z)) continue;
        const pat = P.n7(x, z) * 0.6 + P.n6(x, z) * 0.4; if (r1 > 0.25 + 0.75 * sstep(0.38, 0.62, pat)) continue;   // (in patches)
        const y = vY(i, side, o), ed = sstep(0, 2.5, o - w - 1.6), tint = [0.9 + r2 * 0.2, 0.92 + r3 * 0.14, 0.9];
        if (r2 < 0.5) pk[0].add(x, y - 0.04, z, r3 * TAU, (0.35 + r1 * 0.4) * (0.6 + 0.4 * ed), 0.4 + r3 * 0.4, tint);
        else if (r2 < 0.68) pk[6].add(x, y - 0.05, z, r3 * TAU, 0.5 + r1 * 0.5, 0.4 + r3 * 0.3, tint);
        else if (r2 < 0.78) pk[1].add(x, y - 0.1, z, r3 * TAU, 0.4 + r1 * 0.4, 0.35 + r3 * 0.25, tint);
        else { const k = 0.84 + r3 * 0.28; pk[4].add(x, y - 0.04, z, r1 * TAU, 0.7 + r3, 0.7 + r1 * 0.6, [k, k, k]); }
        if (++nG >= maxG) break verge;
      }
      nPlants += nG;
    }
    {   // stones fallen through the nets onto the shoulder, by the asphalt's edge (grey granite and brown sandstone, a few of them big)
      const RF = rng(3049);
      for (const [s0, side] of fallen) for (let q = 0; q < 2; q++) { const i = T.idx(s0 + (RF() - 0.5) * 3), o = w + 0.3 + RF() * 1.6, d = side * o, x = T.px[i] + T.nx[i] * d, z = T.pz[i] + T.nz[i] * d, k = 0.75 + RF() * 0.3, sc = 0.5 + Math.pow(RF(), 3) * 1.4;
        pk[4].add(x, T.hy[i] - 0.03, z, RF() * TAU, sc, sc * 0.8, RF() < 0.5 ? [k, k, k] : [k * 1.1, k * 0.9, k * 0.72]); }
    }
    {   // stones strewn at the foot of the cuts beside the road
      const RS = rng(3047), maxS = Math.round(14000 * dens); let nS = 0;
      edge: for (let s = 12; s < T.len - 12; s += 1.4 / dens) for (const side of [-1, 1]) {
        const o = 1.7 + Math.pow(RS(), 2) * 30, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z) || sea(x, z) || chGround(x, z) + base < 4) continue;
        const y0 = chGround(x, z), sl = chSlope(x, z); if (sl > 1.2 || (vrLC(x, z) === 1 && r1 < 0.5)) continue;
        const k = 0.84 + r3 * 0.28, sc = 0.8 + r1 * 1.2 - 0.008 * o; pk[4].add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [k, k, k]);
        if (++nS >= maxS) break edge;
      }
    }
    for (const t of pk) t.addTo(root, false);

    /* ---- the cliffs: crags where the slope beside the road is steep (granite boulders low down, the orange sandstone higher up) ---- */
    {
      const RV = rng(3051), gran = [[0.6, 0.59, 0.56], [0.53, 0.53, 0.51], [0.58, 0.56, 0.5]], sand = [[0.58, 0.47, 0.37], [0.5, 0.41, 0.33], [0.64, 0.54, 0.43], [0.47, 0.43, 0.38]];
      for (let s = 16; s < T.len - 16; s += 14) for (const side of [-1, 1]) {
        if (RV() < 0.35) continue;
        const [x, z] = onSide(s, side, 6 + RV() * 60); if (excluded(x, z) || vrNear(x, z).dd < 5 || sea(x, z)) continue;
        const sl = chSlope(x, z); if (sl < 0.75) continue;
        const y = chGround(x, z), A = y + base, L = A > 110 ? sand : gran, g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(L[Math.floor(RV() * L.length)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 1.1 + RV() * 2.2, qx = x + (RV() - 0.5) * 8, qz = z + (RV() - 0.5) * 8, qy = chGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1 || sea(qx, qz)) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0, r0 * (A > 110 ? 0.6 + RV() * 0.4 : 0.8 + RV() * 0.6), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, A > 110 ? 0.2 : 0.35, A > 110); }
      }
      // the overhangs: where the road is cut deep into the mountain, ledges of the banded sandstone jut out of the cut face above the verge (as the
      // road's famous overhanging rock), layered slabs, their backs in the slope; at least 400 m apart
      let last = -1e9;
      for (let s = sStart + 60; s < sFin - 40; s += 4) {
        if (s - last < 400) continue;
        const i = T.idx(s);
        for (const side of [-1, 1]) {
          const at = (o) => { const q = side * o; return chGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - T.hy[i]; };
          if (onBr[i] || at(w + 10) < 7 || at(w + 8) < 4) continue;
          const [x, z] = onSide(s, side, 0); if (excluded(x, z)) continue;
          const rot = Math.atan2(T.tz[i], T.tx[i]), L = 7 + RV() * 6, y0 = T.hy[i] + 3.6 + RV() * 0.6, b0 = vary(sand[Math.floor(RV() * sand.length)], RV, 0.06);
          for (let q = 0; q < 3; q++) { const o = w + 7.2 + q * 1.1, d = side * o, px = T.px[i] + T.nx[i] * d, pz = T.pz[i] + T.nz[i] * d, yq = Math.max(y0 + q * 1.1, T.hy[i] + at(o + 1.8) - 0.2);   // (three slabs stacked back into the face, each a little higher, their backs in the slope)
            rock(scen.get(px, pz), px, yq, pz, L * (1 - q * 0.12) / 2, 0.9 + RV() * 0.3, 3.4 - q * 0.5, rot, vary(b0, RV, 0.07), RV, 0.15, true); }
          nOver++; last = s; break;
        }
      }
    }

    /* ---- life by the road and on the sea: chacma baboons (the cliffs' known residents) in troops on the lay-bys' walls and the verges, kelp beds in
       the shallows off the rocks, fishing boats and a yacht on the bay with their white wakes, people and sunshades on the beach at Hout Bay ---- */
    let nBab = 0, nKelp = 0, nBoat = 0;
    {
      const RB = rng(3061), bab = new IChunks(chBaboonGeo(), pMat, 160), troop = (x0, z0, hd0, n, spread) => {
        for (let k = 0; k < n; k++) { const x = x0 + (RB() - 0.5) * spread, z = z0 + (RB() - 0.5) * spread, nn = vrNear(x, z); if ((nn.i >= 0 && Math.abs(nn.lat) < w + 1.3) || sea(x, z) || chSlope(x, z) > 0.9) continue;   // (off the asphalt; on the verge inside the barriers: on its surface)
          const sc = RB() < 0.25 ? 0.7 + RB() * 0.15 : 1.15 + RB() * 0.3, gy = nn.i >= 0 && nn.dd < 0.5 ? Math.max(chGround(x, z), T.hy[nn.i] - 0.1) : chGround(x, z); bab.add(x, gy - 0.02, z, hd0 + (RB() - 0.5) * 2.4, sc, sc, [0.9 + RB() * 0.2, 0.9 + RB() * 0.16, 0.9 + RB() * 0.12]); nBab++; } };
      views.forEach((v, k) => { if (k % 3 !== 1) return; troop(v.x, v.z, Math.atan2(-T.nz[v.i] * v.sd, -T.nx[v.i] * v.sd), 3 + Math.floor(RB() * 4), v.r * 1.2); });   // (on the lay-by, facing the road)
      for (const d of [620, 1650, 2950, 3900, 4500]) { const sd = RB() < 0.6 ? -1 : 1, i0 = T.idx(sStart + d), bar = sd > 0 ? T.br[i0] : T.bl[i0], [x, z, i] = onSide(sStart + d, sd, w + 2.5 + RB() * 2 - bar); if (excluded(x, z)) continue; troop(x, z, Math.atan2(-T.nz[i] * sd, -T.nx[i] * sd), 4 + Math.floor(RB() * 4), 7); }   // (on the verge by the asphalt, as they sit by the real road)
      bab.addTo(root, false);
      // kelp: dark olive-brown beds just under the surface where the sea is 1-10 m deep, in patches (a 10 m grid within 420 m of the road)
      const kc = [[0.22, 0.2, 0.1], [0.26, 0.22, 0.1], [0.18, 0.18, 0.09]], D = P.D;
      for (let z = D.z0; z < D.z0 + (D.nz - 1) * D.cell; z += 10) for (let x = D.x0; x < D.x0 + (D.nx - 1) * D.cell; x += 10) {
        if (vrDist(x, z) > 420 || P.n7(x * 1.4, z * 1.4) < 0.6 || RB() < 0.35) continue;
        const dpt = seaY - (vrDist(x, z) < 470 ? chGround(x, z) : chFar(x, z)); if (dpt < 1.2 || dpt > 10) continue;
        const g = scen.get(x, z), r0 = 1.6 + RB() * 2.6, c = kc[Math.floor(RB() * 3)], y = seaY + 0.04, n = 7, P0 = [x, y, z];
        for (let q = 0; q < n; q++) { const a0 = q / n * TAU, a1 = (q + 1) / n * TAU, f0 = 0.7 + 0.5 * rpHash(q, Math.round(x * 3 + z)), f1 = 0.7 + 0.5 * rpHash((q + 1) % n, Math.round(x * 3 + z));
          g.triO(P0, [x + Math.cos(a1) * r0 * f1, y, z + Math.sin(a1) * r0 * f1], [x + Math.cos(a0) * r0 * f0, y, z + Math.sin(a0) * r0 * f0], c, [x, y - 5, z]); }
        nKelp++;
      }
      // the boats: a hull tapered to the bow, a cabin or a mast, a white wake behind (those under way); on water 6 m deep or more, 70-380 m off the road
      const boat = (x, z, rot, L, kind, wake) => { const g = scen.get(x, z), c = Math.cos(rot), sn = Math.sin(rot), y = seaY, Q = (u, v, h) => [x + c * u - sn * v, y + h, z + sn * u + c * v], W = L * 0.32, hull = kind === 1 ? [0.95, 0.95, 0.93] : [[0.86, 0.22, 0.16], [0.2, 0.36, 0.62], [0.95, 0.95, 0.93]][Math.floor(RB() * 3)];
        g.quadO(Q(-L / 2, -W / 2, 0.6), Q(L * 0.25, -W / 2, 0.6), Q(L * 0.25, W / 2, 0.6), Q(-L / 2, W / 2, 0.6), [0.78, 0.7, 0.56], Q(0, 0, -2));   // the deck
        g.triO(Q(L * 0.25, -W / 2, 0.6), Q(L / 2, 0, 0.7), Q(L * 0.25, W / 2, 0.6), [0.8, 0.72, 0.58], Q(0, 0, -2));
        for (const [a, b] of [[Q(-L / 2, -W / 2, 0.6), Q(L * 0.25, -W / 2, 0.6)], [Q(L * 0.25, -W / 2, 0.6), Q(L / 2, 0, 0.7)], [Q(L / 2, 0, 0.7), Q(L * 0.25, W / 2, 0.6)], [Q(L * 0.25, W / 2, 0.6), Q(-L / 2, W / 2, 0.6)], [Q(-L / 2, W / 2, 0.6), Q(-L / 2, -W / 2, 0.6)]])
          g.quadO([a[0], y - 0.1, a[2]], [b[0], y - 0.1, b[2]], [b[0], b[1], b[2]], [a[0], a[1], a[2]], hull, Q(0, 0, 0.3));   // the sides
        if (kind === 1) { const m = Q(0, 0, 0.6); cyl(g, m[0], m[1], m[2], 0.06, L * 1.1, 4, [0.86, 0.86, 0.84]); }   // a yacht's mast
        else { const cb = Q(-L * 0.1, 0, 0.6); box(g, cb[0], cb[1], cb[2], L * 0.3, 1.2, W * 0.7, rot, [0.94, 0.94, 0.92], [0.5, 0.52, 0.55], true); }   // the wheelhouse
        if (wake) { const wc = [0.9, 0.94, 0.95]; for (const sd of [-1, 1]) { const a = Q(-L / 2, sd * W * 0.3, 0.02), b = Q(-L / 2 - L * 2.8, sd * L * 1.1, 0.02), b2 = Q(-L / 2 - L * 2.8, sd * L * 0.8, 0.02); g.triO(a, b, b2, wc, [a[0], y - 3, a[2]]); g.triO(a, b2, b, wc, [a[0], y + 3, a[2]]); }
          const t0 = Q(-L / 2, -W * 0.25, 0.02), t1 = Q(-L / 2, W * 0.25, 0.02), t2 = Q(-L * 2.2, W * 0.15, 0.02), t3 = Q(-L * 2.2, -W * 0.15, 0.02); g.quadUp(t0, t1, t2, t3, [wc, wc, wc, wc]); }
        nBoat++; };
      for (let k = 0, tries = 0; k < 7 && tries < 400; tries++) { const s = sStart + RB() * (sFin - sStart), sd = 1, [x, z] = onSide(s, sd, 70 + RB() * 310);   // (the sea is on the right)
        if (seaY - chFar(x, z) < 6 || excluded(x, z)) continue; boat(x, z, RB() * TAU, 6 + RB() * 7, k === 3 ? 1 : 0, k % 3 !== 0); exclPush(x, z, 30); k++; }
      // cyclists resting on the lay-bys (the road is a favourite climb): bikes leaning on the wall, their riders beside them in bright kit; on the lay-by
      // before the finish a fruit stall (a generic one: an awning in stripes, crates of oranges, apples and melons) and a tour bus (no names on it)
      const kit = [[0.95, 0.85, 0.12], [0.2, 0.55, 0.85], [0.92, 0.3, 0.2], [0.15, 0.15, 0.17], [0.95, 0.95, 0.95], [0.3, 0.75, 0.4]];
      views.forEach((v, k) => { if (k % 3 !== 2) return;
        const hh = T.hd[v.i], c = Math.cos(hh), sn = Math.sin(hh), nx = T.nx[v.i] * v.sd, nz = T.nz[v.i] * v.sd, n = 2 + Math.floor(RB() * 3);
        for (let q = 0; q < n; q++) { const u = (q - n / 2) * 1.1 + (RB() - 0.5) * 0.3, bx = v.x + c * u + nx * (v.r - 1.3), bz = v.z + sn * u + nz * (v.r - 1.3), by = chGround(bx, bz), g = scen.get(bx, bz), col = kit[Math.floor(RB() * kit.length)];
          box(g, bx, by + 0.33, bz, 0.9, 0.06, 0.05, hh + PI / 2, col); box(g, bx, by, bz, 1.7, 0.66, 0.03, hh + PI / 2 + 0.12, [0.12, 0.12, 0.13]);   // (a frame on its two wheels, seen from above a dark line)
          person(bx - nx * 1.0 + (RB() - 0.5), bz - nz * 1.0 + (RB() - 0.5), RB() * TAU); }
      });
      { const v = views[views.length - 1], hh = T.hd[v.i], c = Math.cos(hh), sn = Math.sin(hh), nx = T.nx[v.i] * v.sd, nz = T.nz[v.i] * v.sd;
        const sx = v.x - c * (v.r - 2.5) + nx * 2, sz = v.z - sn * (v.r - 2.5) + nz * 2, sy = chGround(sx, sz), g = scen.get(sx, sz);
        box(g, sx, sy, sz, 2.6, 0.85, 1.2, hh, [0.55, 0.38, 0.22], [0.5, 0.34, 0.2], true);   // the stall: its table
        for (let k = 0; k < 6; k++) { const u = -1.0 + (k % 3) * 1.0, w0 = k < 3 ? -0.3 : 0.3, px = sx + c * u - sn * w0, pz = sz + sn * u + c * w0; box(g, px, sy + 0.85, pz, 0.8, 0.2, 0.5, hh, [[0.98, 0.55, 0.1], [0.86, 0.15, 0.12], [0.4, 0.66, 0.2], [0.98, 0.82, 0.2], [0.98, 0.55, 0.1], [0.75, 0.2, 0.3]][k], null, true); }   // crates of fruit
        for (let k = 0; k < 6; k++) { const u = -1.5 + k * 0.6 + 0.3, px = sx + c * u, pz = sz + sn * u; box(g, px, sy + 2.2, pz, 0.6, 0.06, 2.0, hh, k % 2 ? [0.95, 0.95, 0.92] : [0.2, 0.5, 0.36], null, true); }   // the awning in stripes
        for (const u of [-1.5, 1.5]) for (const w0 of [-0.9, 0.9]) box(g, sx + c * u - sn * w0, sy, sz + sn * u + c * w0, 0.06, 2.2, 0.06, hh, [0.6, 0.6, 0.62]);
        exclPush(sx, sz, 3); CR.block(sx, sz, 3.4, 2.2, hh); person(sx - nx * 1.4, sz - nz * 1.4, Math.atan2(nz, nx));
        const v2 = views[views.length - 3] || v, h2 = T.hd[v2.i], bx = v2.x + T.nx[v2.i] * v2.sd * 1.5, bz = v2.z + T.nz[v2.i] * v2.sd * 1.5, by = chGround(bx, bz), gb = scen.get(bx, bz), c2 = Math.cos(h2), s2 = Math.sin(h2);   // the tour bus
        box(gb, bx, by + 0.35, bz, 12, 2.9, 2.5, h2, [0.95, 0.95, 0.94], [0.88, 0.9, 0.92], true); box(gb, bx, by + 1.6, bz, 11.6, 1.0, 2.52, h2, [0.18, 0.26, 0.34], null, true); box(gb, bx, by + 0.5, bz, 12.02, 0.35, 2.52, h2, [0.15, 0.42, 0.68], null, true);
        for (const u of [-4, 3.8]) for (const w0 of [-1.2, 1.2]) box(gb, bx + c2 * u - s2 * w0, by, bz + s2 * u + c2 * w0, 1.0, 1.0, 0.3, h2, [0.08, 0.08, 0.09], null, true);
        exclPush(bx, bz, 7); CR.block(bx, bz, 12.4, 2.8, h2); }
      // the beach at Hout Bay (lc 4 near the start): sunshades, towels and people
      const RBe = rng(3071); let nb = 0;
      for (let k = 0; k < 900 && nb < 40; k++) { const x = P.st[0] + (RBe() - 0.5) * 560, z = P.st[1] + (RBe() - 0.5) * 560; if (vrLC(x, z) !== 4 || vrNear(x, z).dd < 4 || excluded(x, z)) continue;
        const y = chGround(x, z); if (y + base < 2.8) continue; const g = scen.get(x, z);
        if (nb % 3 === 0) { cyl(g, x, y, z, 0.03, 2.1, 4, [0.9, 0.9, 0.88]); cone(g, x, y + 2.0, z, 1.1, 0.45, 8, [[0.92, 0.3, 0.22], [0.98, 0.82, 0.2], [0.18, 0.5, 0.78], [0.95, 0.95, 0.93]][nb % 4], [0.95, 0.95, 0.93], 0); box(g, x + 0.9, y, z + 0.3, 1.8, 0.03, 0.8, RBe() * PI, [[0.2, 0.55, 0.82], [0.92, 0.42, 0.32], [0.98, 0.9, 0.5]][nb % 3]); }
        person(x + 1.4, z - 0.6, RBe() * TAU); nb++; }
    }

    /* ---- finish the meshes (the gulls over the sea: the render's flock, def.sea) ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fac.addTo(sceneryGroup, ouCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: chAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: chAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { plants: nPlants, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, walls: +(nWall / (2 * N)).toFixed(3), parapet: nRail, nets: nNet, views: views.length, baboons: nBab, kelp: nKelp, boats: nBoat, overhangs: nOver, sideRoads: out.stubStats.n };   // (read by the tests)
    return out;
  }

  World.ext.chapman = (scene, tex, opts) => buildChapman(scene, tex, opts);
})();
