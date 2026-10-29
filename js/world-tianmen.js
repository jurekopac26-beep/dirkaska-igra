/* =========================================================================
   WORLD — Tianmen (theme 'tianmen'): its own builder (World.ext.tianmen), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    CAN, Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caH, caProps, caTileOn, clamp, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl, gable,
    ico, lerp, ouCutMat, ouRod, pkGroundMat, rng, rock, rpHash, sstep, valueNoise2, vary, vrDist, vrFar, vrGritTex, vrLC, vrLCf, vrNear, vrPrep
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= TIANMEN (theme 'tianmen') =================
     The upper half of the road of 99 bends up Tianmen Mountain above Zhangjiajie (China), from bend 54 (~731 m) to the square below
     Tianmen Cave (~1,214 m): hairpins stacked up the cliffs of a steep limestone mountain in thick subtropical forest (evergreen
     broadleaves, pines, bamboo, shrubs on the ledges), grey rock faces streaked dark by the rain, mist and low cloud in the valley.
     Built on Vršič's corridor with Los Caracoles' terrain (vrPrep, caH: the road's blend near it, the real terrain farther out), with its own
     look: the ground (tmCol), the plants, concrete retaining walls under the legs, guardrails, white-and-black concrete blocks round the
     hairpins, a blue sign with the number before every bend (the character for "bend" drawn as strokes into the texture: no font needed),
     the loop's bridge over its own road (bend 90: Track.cross), the 999 steps up to the cave and the cave itself, a great arch through the
     wall of the mountain with the sky behind it, a cable car over the hairpins, the far mountains and the town down in the valley, the tour
     buses at both ends. Only place names: no operator, no tickets, no adverts, no names of events. */
  let TMC = null;   // the cave and its steps (buildTianmen): tmH cuts the ground through the arch and levels it under the steps
  function tmH(x, z) {   // terrain height: Los Caracoles' (caH), the floor through the cave and down behind it, the slope of the steps
    let h = caH(x, z); const C = TMC; if (!C) return h;
    const dx = x - C.x, dz = z - C.z, a = dx * C.ux + dz * C.uz, l = Math.abs(dz * C.ux - dx * C.uz);
    if (a > -8 && l < C.w / 2 + 26) h = lerp(h, Math.min(h, C.y - 0.4 - Math.max(0, a - C.d) * 0.6), sstep(C.w / 2 + 26, C.w / 2 - 2, l) * sstep(-8, 4, a));
    const S = C.st, ex = x - S.x0, ez = z - S.z0, al = ex * S.ux + ez * S.uz, q = Math.abs(ez * S.ux - ex * S.uz);
    if (al > -10 && al < S.L + 10 && q < 16) h = lerp(h, S.y0 + (S.y1 - S.y0) * clamp(al / S.L, 0, 1) - 0.35, sstep(16, 5, q) * sstep(-10, 0, al) * sstep(S.L + 10, S.L, al));
    return h;
  }
  function tmGH(i, j) {   // terrain height at grid vertex (i, j), computed once (VR.G)
    const G = API.VR.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = tmH(G.x0 + i * VRC, G.z0 + j * VRC); G.dd[k] = CAN.i >= 0 ? CAN.dd : 999; }
    return h;
  }
  function tmGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / VRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = tmGH(i, j); return a + u * (tmGH(i + 1, j) - a) + v * (tmGH(i, j + 1) - a); }
    const d = tmGH(i + 1, j + 1); return d + (1 - u) * (tmGH(i, j + 1) - d) + (1 - v) * (tmGH(i + 1, j) - d);
  }
  function tmSlope(x, z) { const a = tmGround(x - 2.5, z), b = tmGround(x + 2.5, z), c = tmGround(x, z - 2.5), d = tmGround(x, z + 2.5); return Math.hypot(b - a, d - c) / 5; }
  const TMCOL = [0, 0, 0];
  function tmCol(x, z, h, ny, dd, sx, sz) {   // ground colour (times the grey grit map): the dark forest floor (lc 0), greener scrub and grass (lc 1), the
    // limestone on the steep faces (pale grey, streaked dark down the fall line where the rain runs, rusty stains, moss in the cracks), bare
    // rock (lc 2), concrete where it is built up (lc 3), a trodden verge of grit by the road
    const P = API.VR, m = P.c1(x, z), q = P.c2(x, z), f = P.n4(x, z);
    const sh = vrLCf(x, z, 1), bare = vrLCf(x, z, 2), built = vrLCf(x, z, 3), fld = vrLCf(x, z, 4);
    let R = 0.25, G = 0.31, B = 0.17;
    R = lerp(R, 0.37, sh * 0.8); G = lerp(G, 0.43, sh * 0.8); B = lerp(B, 0.22, sh * 0.8);
    R = lerp(R, 0.47, fld * 0.7); G = lerp(G, 0.5, fld * 0.7); B = lerp(B, 0.27, fld * 0.7);
    const lit = sstep(0.55, 0.85, m) * 0.6; R = lerp(R, 0.34, lit * 0.5); G = lerp(G, 0.37, lit * 0.5); B = lerp(B, 0.19, lit * 0.5);   // (the litter of leaves, browner)
    R += (f - 0.5) * 0.07; G += (f - 0.5) * 0.08; B += (f - 0.5) * 0.05;
    const st = Math.max(sstep(0.78, 0.5, ny), bare * 0.8);   // the rock: the steep faces, the bare ground
    if (st > 0) {
      const hz = Math.hypot(sx || 0, sz || 0) || 1, u = (z * (sx || 0) - x * (sz || 0)) / hz, streak = 0.5 + 0.5 * Math.sin(u * 0.31 + P.c5(x, z) * 7 + P.n2(x * 0.6, z * 0.6) * 5);
      let r = 0.68, g = 0.67, b = 0.63; const k = 0.78 + 0.26 * streak * streak; r *= k; g *= k; b *= k;
      const rust = sstep(0.62, 0.85, q) * 0.5; r = lerp(r, 0.62, rust); g = lerp(g, 0.52, rust); b = lerp(b, 0.42, rust);
      const moss = sstep(0.55, 0.8, P.c3(x, z)) * 0.55; r = lerp(r, 0.36, moss); g = lerp(g, 0.42, moss); b = lerp(b, 0.25, moss);
      R = lerp(R, r, st); G = lerp(G, g, st); B = lerp(B, b, st);
    }
    R = lerp(R, 0.6, built * 0.6); G = lerp(G, 0.59, built * 0.6); B = lerp(B, 0.56, built * 0.6);
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.5; R = lerp(R, 0.5, t); G = lerp(G, 0.48, t); B = lerp(B, 0.43, t); }
    TMCOL[0] = R; TMCOL[1] = G; TMCOL[2] = B; return TMCOL;
  }
  function tmGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in tmTileGeo)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = tmGH(ii, jj);
      const nx = -(tmGH(ii + 1, jj) - tmGH(ii - 1, jj)) / (2 * VRC), nz = -(tmGH(ii, jj + 1) - tmGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = tmCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, G.dd[jj * G.nx + ii], nx / l, nz / l);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function tmTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by tmCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = tmGH(i, j);
      let nx = -(tmGH(i + st, j) - tmGH(i - st, j)) / (2 * VRC * st), nz = -(tmGH(i, j + st) - tmGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = tmCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)], nx, nz); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? caTileOn(a, b) : 0);
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
  // the character for "bend" (弯), drawn as strokes in a 100 x 100 box: the dot and the bar on top, the two short strokes between the two
  // downstrokes, below them the bow (弓) with its hook; the signs never need a Chinese font
  const TM_WAN = [[[50, 4], [55, 13]], [[12, 21], [88, 21]], [[37, 27], [37, 45]], [[63, 27], [63, 45]], [[24, 30], [15, 43]], [[76, 30], [86, 42]],
    [[24, 52], [74, 52], [72, 64]], [[30, 64], [72, 64]], [[30, 64], [27, 78], [78, 78], [75, 95], [62, 91]]];
  function tmGlyph(x, cx, cy, sz, col, lw) { x.strokeStyle = col; x.lineWidth = lw * sz / 100; x.lineCap = 'round'; x.lineJoin = 'round';
    for (const s of TM_WAN) { x.beginPath(); s.forEach(([u, v], k) => { const px = cx + (u - 50) * sz / 100, py = cy + (v - 50) * sz / 100; if (k) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke(); } }
  let tmATex = null, tmAKey = '', tmA2Tex = null, tmA2Key = '';   // (the board atlases, made once and reused by every build of the road)
  function tmAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the place board at the top, the race's banner
    const key = cps.join('|') + '|' + finA; if (tmATex && tmAKey === key) return tmATex;
    if (tmATex) tmATex.dispose(); tmAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#9c1c1c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(282, 142, 460, 100); txt('FINISH', 512, 196, 92, '#111', 440);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#1e4fa0'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#2f4a3a'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#eef0e8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('TIANMEN', 512, 812, 58, '#f3f2ea', 900); txt(finA, 512, 862, 46, '#f3f2ea', 900);
    x.fillStyle = '#b3201c'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#f2c84b'; x.fillRect(0, 900, 1024, 6); x.fillRect(0, 1014, 1024, 6);
    txt('99', 430, 962, 104, '#f2c84b', 300); tmGlyph(x, 600, 960, 92, '#f2c84b', 13);   // (the banner: "99 bends")
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (tmATex = t);
  }
  function tmAtlas2(curves) {   // the small signs: rows 0-5, the bends' numbers (8 a row, 128 x 128: a blue board, the number and 弯, as on the real road), two
    // chevrons in the last two cells of row 5; rows 6-7, the bus boards and the arrows of the steps (two a row, 512 x 128)
    const key = curves.map(c => c[3]).join(','); if (tmA2Tex && tmA2Key === key) return tmA2Tex;
    if (tmA2Tex) tmA2Tex.dispose(); tmA2Key = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    curves.slice(0, 46).forEach((cv, k) => { const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128;
      x.fillStyle = '#f2f2ee'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#1e4fa0'; x.fillRect(x0 + 6, y0 + 6, 116, 116);
      txt(String(cv[3]), x0 + 50, y0 + 66, 60, '#f6f6f2', 80); tmGlyph(x, x0 + 102, y0 + 66, 34, '#f6f6f2', 12); });
    for (const [k, dir] of [[46, 1], [47, -1]]) {   // the chevrons: white arrows on blue, pointing the way the road turns
      const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128; x.fillStyle = '#1e4fa0'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f6f6f2';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    const boards = [['TIANMEN', '#2f4a3a'], ['ZHANGJIAJIE  ↓', '#1e4fa0'], ['999  ↑', '#2f4a3a'], ['P', '#1e4fa0']];
    boards.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 768 + Math.floor(k / 2) * 128;
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112); txt(n, x0 + 256, y0 + 66, 54, '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (tmA2Tex = t);
  }
  function tmPlantGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 an evergreen broadleaf tree (a trunk, a crown of soft lumps), 1 a
    // pine (a bare trunk, flat tiers of needles up top), 2 a clump of bamboo (thin canes, feathery tops), 3 a shrub of the ledges, 4 a limestone boulder
    const g = new GB(), R = rng(880 + kind), rs = API.ROCK_SMOOTH;
    if (kind === 0) {
      cyl(g, 0, 0, 0, 0.035, 0.45, 5, [0.3, 0.24, 0.18]);
      API.ROCK_SMOOTH = true; const C = [[0.2, 0.33, 0.14], [0.17, 0.3, 0.13], [0.24, 0.37, 0.16]];
      ico(g, 0.04, 0.68, 0.02, 0.34, 0.8, C[0], R, 0.2); ico(g, -0.14, 0.52, -0.08, 0.26, 0.75, C[2], R, 0.22);
    } else if (kind === 1) {
      cyl(g, 0, 0, 0, 0.025, 0.7, 5, [0.36, 0.26, 0.2]);
      API.ROCK_SMOOTH = true; const C = [0.16, 0.27, 0.15];
      ico(g, 0, 0.78, 0, 0.27, 0.36, C, R, 0.2); ico(g, 0.06, 0.9, -0.03, 0.18, 0.3, [0.18, 0.3, 0.16], R, 0.2);
    } else if (kind === 2) {
      const cane = [0.42, 0.52, 0.24], leaf = [0.33, 0.47, 0.18];
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + R() * 0.5, r0 = 0.04 + R() * 0.06, lean = 0.08 + R() * 0.14, hh = 0.75 + R() * 0.25, bx = Math.cos(a) * r0, bz = Math.sin(a) * r0, tx = Math.cos(a) * (r0 + lean), tz = Math.sin(a) * (r0 + lean);
        ouRod(g, [bx, 0, bz], [tx, hh, tz], 0.012, cane, 3);
        API.ROCK_SMOOTH = true; ico(g, tx * 1.2, hh * 0.86, tz * 1.2, 0.13, 0.9, vary(leaf, R, 0.15), R, 0.3); }
    } else if (kind === 3) {
      API.ROCK_SMOOTH = true; const col = [0.25, 0.36, 0.16];
      ico(g, 0, 0.42, 0, 0.42, 0.85, col, R, 0.28); ico(g, 0.3, 0.3, 0.14, 0.3, 0.8, [0.22, 0.33, 0.15], R, 0.3); ico(g, -0.26, 0.28, -0.16, 0.3, 0.8, [0.28, 0.39, 0.17], R, 0.3);
    } else { API.ROCK_SMOOTH = false; rock(g, 0, 0.3, 0, 0.6, 0.62, 0.5, 0, [0.66, 0.65, 0.61], R, 0.3); }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // a tour bus of the scenic area (12 m, plain livery, no lettering; x along it, the front at +x): parked at both ends of the road
  function tmBus(g, x, y, z, rot, col) {
    const c = Math.cos(rot), s = Math.sin(rot), K = [0.08, 0.08, 0.09], Gl = [0.13, 0.17, 0.21];
    box(g, x, y + 0.45, z, 12, 2.8, 2.5, rot, col, [0.9, 0.9, 0.9], true);
    box(g, x + c * 0.2, y + 1.75, z + s * 0.2, 11.2, 1.0, 2.52, rot, Gl, null, true);   // the band of windows
    box(g, x + c * 5.98, y + 1.4, z + s * 5.98, 0.08, 1.7, 2.2, rot, Gl, null, true);   // the windscreen
    for (const u of [3.8, -3.6]) for (const v of [-1.15, 1.15]) box(g, x + c * u - s * v, y, z + s * u + c * v, 1.0, 1.0, 0.32, rot, K, null, true);
  }
  function buildTianmen(scene, tex, opts) {
    const R = rng(3911), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: tmGround, camFloor: tmGround, props: [], farClip: true, ownTex: [], dust: [0.6, 0.57, 0.5] };
    TMC = null; vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(811, 150); P.c2 = valueNoise2(812, 64); P.c3 = valueNoise2(813, 40); P.c4 = valueNoise2(814, 120); P.c5 = valueNoise2(815, 26);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the cave (def.cave: its mouth's foot, the axis into the mountain, the arch's width, height and depth) and the steps up to it from the end of the road
    const CV = def.cave, sp = def.steps.p, ux = Math.cos(CV.ang), uz = Math.sin(CV.ang), mx0 = sp[2], mz0 = sp[3], yE = T.hy[iE];
    const st = { x0: sp[0], z0: sp[1], L: Math.hypot(sp[2] - sp[0], sp[3] - sp[1]), y0: yE + 0.2, y1: CV.y }; st.ux = (sp[2] - sp[0]) / st.L; st.uz = (sp[3] - sp[1]) / st.L;
    TMC = { x: mx0 + ux * 12, z: mz0 + uz * 12, y: CV.y, ux, uz, w: CV.w, d: CV.d, st };
    P.pads.push({ x: mx0 + ux * 4, z: mz0 + uz * 4, r: 16, b: 18, h: CV.y - 0.3 });   // (the terrace at the cave's mouth)
    // the buildings by the road (def.bld: the pavilions at the top), clear of the road
    const blds = [];
    for (const [x, z, L0, W0, ang, hgt] of def.bld || []) { const L = Math.min(L0, 30), W = Math.min(W0, 16); if (L < 2.5 || W < 2.5) continue;
      const c = Math.cos(ang), s = Math.sin(ang); let ok = true; for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const n = vrNear(x + c * u - s * v, z + s * u + c * v); if (n.i >= 0 && n.dd < 2) ok = false; }
      if (ok) blds.push({ x, z, L, W, ang, hgt }); }
    for (const b of blds) { b.pad = { x: b.x, z: b.z, r: Math.hypot(b.L, b.W) / 2 + 1.5, b: 10, h: caH(b.x, b.z) }; P.pads.push(b.pad); }
    // the bus park at the top (beside the road past the finish, where the ground lies nearer the road's height) and the lay-by below the start
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 14, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(Math.min(sFin + 120, T.len - 30), 15); P.pads.push(padF);
    const padS = padBeside(Math.max(20, sStart - 70), 11); P.pads.push(padS);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (what stands between the camera and the car fades out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the boulders, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    exclPush(padF.x, padF.z, padF.r + 4); exclPush(padS.x, padS.z, padS.r + 4);
    for (let a = -10; a < st.L + 6; a += 8) exclPush(st.x0 + st.ux * a, st.z0 + st.uz * a, 6);
    out.marks = { cave: [TMC.x, TMC.z], steps: [st.x0, st.z0] };   // (where the landmarks stand: the tests look for them)

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(tmTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the far mountains (def.far: 96 m cells, out to ~5 km): one coarse mesh, forest green, the steep faces grey; under the corridor's
       tiles it sinks out of sight; behind the cave it falls away, so the sky shows through the arch ---- */
    const FD = def.far, fb = atob(FD.b64), farH = (i, j) => FD.lo + fb.charCodeAt(clamp(j, 0, FD.nz - 1) * FD.nx + clamp(i, 0, FD.nx - 1)) * FD.step;
    const farAt = (x, z) => { const gx = clamp((x - FD.x0) / FD.cell, 0, FD.nx - 1.001), gz = clamp((z - FD.z0) / FD.cell, 0, FD.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
      return (farH(i, j) * (1 - u) + farH(i + 1, j) * u) * (1 - v) + (farH(i, j + 1) * (1 - u) + farH(i + 1, j + 1) * u) * v; };
    const inCorr = (x, z) => { const G = P.G, L = VRC * VRT, ti = Math.floor((x - G.x0) / L), tj = Math.floor((z - G.z0) / L); return ti >= 0 && tj >= 0 && ti < G.ntx && tj < G.ntz && caTileOn(ti, tj) > 0; };
    const behind = (x, z) => { const dx = x - TMC.x, dz = z - TMC.z, a = dx * ux + dz * uz, l = Math.abs(dz * ux - dx * uz); return a > TMC.d && l < 90 + a * 0.35; };
    {
      const g = new GB(), n = FD.nx, Y = new Float32Array(n * FD.nz), C3 = [];
      for (let j = 0; j < FD.nz; j++) for (let i = 0; i < n; i++) { const x = FD.x0 + i * FD.cell, z = FD.z0 + j * FD.cell; let y = farH(i, j);
        if (inCorr(x, z) || inCorr(x - 50, z) || inCorr(x + 50, z) || inCorr(x, z - 50) || inCorr(x, z + 50)) y -= 45;
        if (behind(x, z)) y = Math.min(y, TMC.y - 80);
        Y[j * n + i] = y; }
      for (let j = 0; j < FD.nz - 1; j++) for (let i = 0; i < n - 1; i++) {
        const x = FD.x0 + i * FD.cell, z = FD.z0 + j * FD.cell; if (inCorr(x + 48, z + 48)) continue;
        const a = [x, Y[j * n + i], z], b = [x + FD.cell, Y[j * n + i + 1], z], c = [x + FD.cell, Y[(j + 1) * n + i + 1], z + FD.cell], d = [x, Y[(j + 1) * n + i], z + FD.cell];
        const sl = Math.hypot(b[1] - a[1], d[1] - a[1]) / FD.cell, k = 0.9 + 0.2 * rpHash(i, j), rk = sstep(0.7, 1.3, sl);
        const col = [lerp(0.2, 0.6, rk) * k, lerp(0.29, 0.6, rk) * k, lerp(0.15, 0.56, rk) * k];
        g.quadUp(a, b, c, d, [col, col, col, col]);
      }
      if (!g.empty) { const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.matrixAutoUpdate = false; root.add(m); }
    }

    /* ---- the road: asphalt with white edge lines and a yellow centre line, a grit shoulder, then the verge out to a ditch past the barrier line,
       up or down onto the ground; where the ground falls away under the road a concrete retaining wall; on the loop's bridge the deck out to its
       parapets (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const onBr = new Uint8Array(N), sw = 0.5, X0 = T.cross[0] || null;
    if (def.loopBridge) for (let s = sStart + def.loopBridge[0]; s <= sStart + def.loopBridge[1]; s += T.ds / 2) onBr[T.idx(s)] = 1;
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      if (onBr[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];
      const y = T.hy[i], gAt = (o) => { const q = side * o; return tmGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.8 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], ylw = [0.95, 0.74, 0.14], gc = [0.6, 0.58, 0.53], deck = [0.62, 0.61, 0.58];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return k < 3 ? deck : [0.5, 0.49, 0.47];
          const wl = vp[si][i][2][1] < -2.6; if (wl && (k === 1 || k === 2)) { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si); return k === 1 ? [0.72 * q, 0.71 * q, 0.68 * q] : [0.5 * q, 0.5 * q, 0.47 * q]; }   // (the retaining wall's coping, its stained face)
          if (k === 4) return tmGCol(x, z);
          const sl = k === 2 ? tmSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return tmCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - bar), 0, 0).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const [o0, o1] of [[-(w - 0.25), -(w - 0.4)], [w - 0.4, w - 0.25]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          gl.quadUp(Pt(i, -0.08, 0.036), Pt(i, 0.08, 0.036), Pt(j, 0.08, 0.036), Pt(j, -0.08, 0.036), [ylw, ylw, ylw, ylw]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], sc = onBr[i] ? deck : gc;
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [sc, sc, sc, sc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if ((k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6)) || (onBr[i] && k === 2)) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face: out, towards the leg below)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
          if (onBr[i] && onBr[j]) { const a = Pt(i, -T.bl[i] - 0.68, -1.4), b = Pt(i, T.br[i] + 0.68, -1.4), c = Pt(j, T.br[j] + 0.68, -1.4), d = Pt(j, -T.bl[j] - 0.68, -1.4); gv.quadO(a, b, c, d, null, Pt(i, 0, 2), [wuv(a), wuv(b), wuv(c), wuv(d)], [deck, deck, deck, deck]); }   // (the deck's underside)
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
    const scen = new Chunks(110), fac = new Chunks(110, true), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (fac: the walls with windows; ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.86, 0.13, 0.12], [0.95, 0.95, 0.95], [0.98, 0.8, 0.15], [0.2, 0.42, 0.75], [0.95, 0.95, 0.95], [0.12, 0.14, 0.2], [0.86, 0.13, 0.12], [0.3, 0.6, 0.35], [1, 0.55, 0.1], [0.6, 0.62, 0.66]];
    const CR = crowdCtx({ gH: tmGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const qx = tz, qz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - qx * hw, cy + oy, cz + oz - qz * hw], B = [cx + ox + qx * hw, cy + oy, cz + oz + qz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (6 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a board of the second atlas: [v0, v1, u0, u1]
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 11.5, 1.45, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, tmGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const busCols = [[0.94, 0.94, 0.92], [0.24, 0.5, 0.36], [0.92, 0.92, 0.9], [0.2, 0.36, 0.62], [0.95, 0.95, 0.93], [0.64, 0.16, 0.14]];

    /* ---- the pavilions at the top: white walls, grey tiled roofs with upturned eaves ---- */
    let nBld = 0;
    for (const b of blds) {
      const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9;
      for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = tmGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const H = b.hgt > 2 ? Math.min(b.hgt, 9) : 4.2;
      box(g, b.x, lo - 0.4, b.z, b.L, hi - lo + 0.4 + H, b.W, b.ang, [0.92, 0.91, 0.87], [0.4, 0.3, 0.24], true);
      box(g, b.x, hi + H - 0.1, b.z, b.L + 1.4, 0.3, b.W + 1.4, b.ang, [0.3, 0.31, 0.33], null, true);
      gable(g, b.x, hi + H + 0.2, b.z, b.L + 0.8, b.W + 0.8, Math.min(b.L, b.W) * 0.3, b.ang, [0.28, 0.29, 0.31], [0.92, 0.91, 0.87]);
      CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++;
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- START: gantry with the start lights, the timing hut, the road closed behind it; buses held back in the lay-by ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = tmGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.92, 0.9, 0.84], [0.5, 0.3, 0.2], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.1, T.hd[i], [0.3, 0.31, 0.33], [0.92, 0.9, 0.84]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.4), by = tmGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-2.6, 2.6]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 5.2, 0.65, v0, v1); exclPush(bx, bz, 4); }
      const hh = T.hd[padS.i], c = Math.cos(hh), sn = Math.sin(hh), RB = rng(3931);   // the buses in the lay-by, side by side
      for (let k = 0; k < 2; k++) { const b = (k - 0.5) * 3.6, px = padS.x - sn * b, pz = padS.z + c * b; if (vrNear(px, pz).dd < 1.5) continue; tmBus(scen.get(px, pz), px, tmGround(px, pz), pz, hh, busCols[Math.floor(RB() * busCols.length)]); }
      for (let k = 0; k < 6; k++) { const px = padS.x + (R() - 0.5) * 14, pz = padS.z + (R() - 0.5) * 14; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
    }

    /* ---- the checkpoints: a blue gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.12, 0.3, 0.6]));

    /* ---- FINISH (under the cave): chequered gantry and flags, the TIANMEN board, the bus park with the tour buses, the road's end at the foot of the steps ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.2), py = tmGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 20, sdP, 2.6), sy = tmGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 6, H2 = W2 / 8;   // the TIANMEN board on a plinth, facing the arriving cars
      for (const o of [-2.4, 2.4]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.24, 1.2, 0.24, T.hd[si], [0.32, 0.3, 0.28]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.24, 1.15 + H2 * Math.cos(tl), 0.24, T.hd[si], [0.32, 0.3, 0.28]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.4, 0.6, W2 + 1, T.hd[si], [0.62, 0.61, 0.58], [0.7, 0.69, 0.66]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.1, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 4.5);
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh), RB = rng(3941);
      for (let k = 0; k < 8; k++) { const a = -9 + (k % 4) * 6, b = (k < 4 ? -4.5 : 4.5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || k === 2 || k === 5) continue;
        tmBus(scen.get(px, pz), px, tmGround(px, pz), pz, hh + PI / 2, busCols[Math.floor(RB() * busCols.length)]); }
      { const [bx, bz, bi] = onSide(sFin + 60, -sdP, 1.4), by = tmGround(bx, bz), gb = scen.get(bx, bz), [v0, v1, u0, u1] = board(3);   // the parking board
        box(gb, bx, by - 0.2, bz, 0.1, 2.8, 0.1, T.hd[bi], [0.6, 0.61, 0.63]); bannerQ(bx, by + 1.9, bz, -T.tx[bi], -T.tz[bi], 2.4, 0.6, v0, v1, u0, u1, ban2); exclPush(bx, bz, 1.5); }
      for (let k = 0; k < 24; k++) { const px = padF.x + (R() - 0.5) * 24, pz = padF.z + (R() - 0.5) * 24; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: a low wall across it, the steps beyond
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.6, 0.8, 1.95, T.hd[iE], [0.8, 0.79, 0.76], [0.86, 0.85, 0.82]); }
    }

    /* ---- the 999 steps from the end of the road up to the cave: pale stone flights with landings, a handrail each side ---- */
    let nSteps = 0;
    {
      const g = scen.get(st.x0, st.z0), wS = 3.2, stone = [0.74, 0.72, 0.67], riser = [0.56, 0.55, 0.52], qx = -st.uz, qz = st.ux, n = Math.round(st.L / 0.26);
      for (let k = 0; k < n; k++) {
        const a0 = k * st.L / n, a1 = (k + 1) * st.L / n, y0 = st.y0 + (st.y1 - st.y0) * k / n, y1 = st.y0 + (st.y1 - st.y0) * (k + 1) / n, P0 = (a, o, y) => [st.x0 + st.ux * a + qx * o, y, st.z0 + st.uz * a + qz * o];
        const gk = scen.get(st.x0 + st.ux * a0, st.z0 + st.uz * a0);
        gk.quadUp(P0(a0, -wS, y1), P0(a0, wS, y1), P0(a1, wS, y1), P0(a1, -wS, y1), [stone, stone, stone, stone]);
        gk.quadO(P0(a0, -wS, y0), P0(a0, wS, y0), P0(a0, wS, y1), P0(a0, -wS, y1), riser, P0(a0 + 1, 0, y1));
        for (const o of [-wS, wS]) gk.quadO(P0(a0, o, y0 - 1.2), P0(a1, o, y1 - 1.2), P0(a1, o, y1), P0(a0, o, y0), riser, P0((a0 + a1) / 2, 0, y1));
        nSteps++;
      }
      for (const o of [-wS - 0.1, wS + 0.1]) { const A = [st.x0 + qx * o, st.y0 + 1.0, st.z0 + qz * o], B = [st.x0 + st.ux * st.L + qx * o, st.y1 + 1.0, st.z0 + st.uz * st.L + qz * o]; ouRod(g, A, B, 0.04, [0.82, 0.8, 0.74], 4);
        for (let a = 0; a <= st.L; a += 4) { const y = st.y0 + (st.y1 - st.y0) * a / st.L, px = st.x0 + st.ux * a + qx * o, pz = st.z0 + st.uz * a + qz * o; box(scen.get(px, pz), px, y, pz, 0.12, 1.0, 0.12, Math.atan2(st.uz, st.ux), [0.82, 0.8, 0.74], null, true); } }
      const [v0, v1, u0, u1] = board(2), bx = st.x0 - st.ux * 3 + qx * (wS + 1.2), bz = st.z0 - st.uz * 3 + qz * (wS + 1.2), by = tmGround(bx, bz);   // the board at their foot
      box(g, bx, by - 0.2, bz, 0.1, 2.4, 0.1, 0, [0.6, 0.61, 0.63]); bannerQ(bx, by + 1.5, bz, -st.ux, -st.uz, 2.6, 0.65, v0, v1, u0, u1, ban2);
    }

    /* ---- Tianmen Cave: a wall of limestone across the cave's axis (~300 m wide, from below the floor to ~200 m above it, as deep as the arch),
       the arch through it (57 m wide, 131 m high: upright sides, a rounded crown), its faces streaked and stained, the soffit darker; star-shaped
       about the arch's middle, so each face is a ring of quads from the arch's edge out to the wall's ---- */
    {
      const g = new GB(), C = TMC, qx = -uz, qz = ux, hw = C.w / 2, Hh = CV.h, Wd = 300, top = Hh + 75, bot = -55, cy = Hh * 0.46, RS = rng(3951), M = 72;
      const hole = (t) => {   // the arch's outline at angle t round (0, cy): [l, y]
        const dx = Math.cos(t), dy = Math.sin(t); let best = 1e9, out = null;
        const seg = (a, b) => { const ex = b[0] - a[0], ey = b[1] - a[1], den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) return; const s = (a[0] * ey - (a[1] - cy) * ex) / den, u = (a[0] * dy - (a[1] - cy) * dx) / den; if (s > 0 && u >= 0 && u <= 1 && s < best) { best = s; out = [dx * s, cy + dy * s]; } };
        const pts = [[-hw, 0], [hw, 0], [hw, Hh * 0.6]]; for (let k = 0; k <= 12; k++) { const a = k / 12 * PI; pts.push([Math.cos(a) * hw, Hh * 0.6 + Math.sin(a) * Hh * 0.4]); } pts.push([-hw, Hh * 0.6], [-hw, 0]);
        for (let k = 0; k < pts.length - 1; k++) seg(pts[k], pts[k + 1]);
        return out;
      };
      const rect = (t) => { const dx = Math.cos(t), dy = Math.sin(t), sx = dx ? (dx > 0 ? Wd / 2 : -Wd / 2) / dx : 1e9, sy = dy ? (dy > 0 ? top - cy : bot - cy) / dy : 1e9, k = Math.round(t / TAU * M) % M, s = Math.min(Math.abs(sx), Math.abs(sy)) * (dy > -0.3 ? 0.78 + 0.3 * rpHash(k, 3953) : 1); return [dx * s, cy + dy * s]; };   // (the wall's edge ragged, but for its foot in the ground)
      const jit = (l, y, a) => { const n = rpHash(Math.round(l / 6) + 400, Math.round(y / 6) + Math.round(a / 20) * 7 + 400); return (n - 0.5) * 5; };
      const W3 = (l, y, a) => [C.x + qx * l + ux * (a + jit(l, y, a)), C.y + y, C.z + qz * l + uz * (a + jit(l, y, a))];
      const rockC = (l, y, k) => { const s = 0.5 + 0.5 * Math.sin(l * 0.21 + rpHash(Math.round(l / 9), 9) * 6), q = 0.78 + 0.24 * s * s - 0.1 * k; const v = rpHash(Math.round(l / 14), Math.round(y / 30)) < 0.12 ? 0.2 : 0;
        return [lerp(0.66 * q, 0.36, v), lerp(0.65 * q, 0.42, v), lerp(0.61 * q, 0.25, v)]; };
      for (let k = 0; k < M; k++) {
        const t0 = k / M * TAU, t1 = (k + 1) / M * TAU, h0 = hole(t0), h1 = hole(t1), r0 = rect(t0), r1 = rect(t1);
        for (const [a, sg] of [[0, -1], [C.d, 1]]) {   // the front face and the back face, the ring from the arch out to the wall's edge in three bands
          for (let b = 0; b < 3; b++) { const f0 = b / 3, f1 = (b + 1) / 3, L = (p, q, f) => [lerp(p[0], q[0], f), lerp(p[1], q[1], f)];
            const A = L(h0, r0, f0), B = L(h1, r1, f0), Cq = L(h1, r1, f1), D = L(h0, r0, f1);
            g.quadO(W3(A[0], A[1], a), W3(B[0], B[1], a), W3(Cq[0], Cq[1], a), W3(D[0], D[1], a), rockC(A[0], A[1], 0), [C.x + ux * (a - sg * 30), C.y + cy, C.z + uz * (a - sg * 30)], null, [rockC(A[0], A[1], 0), rockC(B[0], B[1], 0), rockC(Cq[0], Cq[1], 0), rockC(D[0], D[1], 0)]); }
        }
        const s0 = W3(h0[0], h0[1], 0), s1 = W3(h1[0], h1[1], 0), e1 = W3(h1[0], h1[1], C.d), e0 = W3(h0[0], h0[1], C.d), sc = rockC(h0[0], h0[1], 1);   // the soffit and the sides of the arch, inside
        if (h0[1] > 0.5 || h1[1] > 0.5) g.quadO(s0, s1, e1, e0, sc, [C.x + ux * C.d / 2, C.y + cy, C.z + uz * C.d / 2], null, [sc, rockC(h1[0], h1[1], 1), rockC(h1[0], h1[1], 1), sc]);
        const o0 = W3(r0[0], r0[1], 0), o1 = W3(r1[0], r1[1], 0), p1 = W3(r1[0], r1[1], C.d), p0 = W3(r0[0], r0[1], C.d), oc = rockC(r0[0], r0[1], 0.5);   // the wall's outer edge (its sides and top)
        g.quadO(o0, o1, p1, p0, oc, [C.x + ux * C.d / 2, C.y + cy, C.z + uz * C.d / 2]);
      }
      for (let k = 0; k < 40; k++) { const l = (RS() - 0.5) * Wd * 0.9, y = Hh + 10 + RS() * 50; if (Math.abs(l) < hw + 6 && y < Hh + 8) continue;   // shrubs on the ledges above the arch
        const p = W3(l, y, -1.5); API.ROCK_SMOOTH = true; ico(g, p[0], p[1], p[2], 3 + RS() * 4, 0.6, [0.24, 0.35, 0.16], RS, 0.3); API.ROCK_SMOOTH = false; }
      const m = new THREE.Mesh(g.geometry(), ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut)); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
    }

    /* ---- guardrails where the ground falls away, white-and-black concrete blocks round the outside of the hairpins (not on the bridge: its
       concrete parapets), low concrete walls along the lower road under the bridge; chevrons on the outside of every hairpin; a marker post every
       ~50 m where there is nothing (knockable where it fits: caProps) ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)], blk = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 6); k <= Math.min(N - 1, c.i1 + 6); k++) { need[sd][k] = 1; blk[sd][k] = 1; } }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (tmGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      if (X0) for (let i = 0; i < N; i++) if (Math.abs(i - X0.lo) * T.ds < X0.loZ + 24) { need[0][i] = need[1][i] = 1; blk[0][i] = blk[1][i] = 2; }   // (the lower road under the bridge: between low walls)
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), steel = [0.8, 0.82, 0.84], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52], cw = [0.92, 0.92, 0.9], ck = [0.1, 0.1, 0.11], cg = [0.66, 0.65, 0.62];
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], bk = blk[si], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || onBr[i]) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]), both = (a) => a[i] && a[i + 1];
          if (both(onBr)) {   // the bridge: a concrete parapet
            const a = Q(i, -0.1, -0.05), b = Q(i + 1, -0.1, -0.05), c = Q(i + 1, 0.95, -0.05), d = Q(i, 0.95, -0.05), a2 = Q(i, -0.1, 0.4), b2 = Q(i + 1, -0.1, 0.4), c2 = Q(i + 1, 0.95, 0.4), d2 = Q(i, 0.95, 0.4), inn = Q(i, 0.4, 0.18);
            g.quadO(a, b, c, d, [0.7, 0.69, 0.66], inn); g.quadO(a2, b2, c2, d2, [0.6, 0.59, 0.56], inn); g.quadO(d, c, c2, d2, [0.78, 0.76, 0.72], inn);
          } else if (nd[i] && nd[i + 1] && bk[i] && bk[i + 1]) {   // concrete: blocks striped white and black round a hairpin, a plain low wall under the bridge
            const col = bk[i] === 2 ? cg : (i >> 1) % 2 ? cw : ck, a = Q(i, -0.15, -0.05), b = Q(i + 1, -0.15, -0.05), c = Q(i + 1, 0.8, -0.05), d = Q(i, 0.8, -0.05), a2 = Q(i, -0.15, 0.45), b2 = Q(i + 1, -0.15, 0.45), c2 = Q(i + 1, 0.8, 0.45), d2 = Q(i, 0.8, 0.45), inn = Q(i, 0.3, 0.2);
            g.quadO(a, b, c, d, col, inn); g.quadO(a2, b2, c2, d2, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], inn); g.quadO(d, c, c2, d2, col, inn);
          } else if (nd[i] && nd[i + 1]) {   // W-beam: a front and a back face, a post every 4 m
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
          } else if (!nd[i] && !onBr[i] && i % 25 === 0 && i > 2 && i < iE - 2) mkPosts.push([i, side]);
        }
      }
      const kp = caProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp2 of mkPosts) { if (kp.has(sp2)) continue;
        const [i, side] = sp2, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
      if (X0) {   // the bridge's piers: either side of the lower road, from the ground to the deck
        const sn = Math.max(0.3, X0.sin);
        for (const sd of [-1, 1]) { const s = X0.up * T.ds + sd * (T.w + 3.4 + 2.2) / sn, i = T.idx(s), x = T.px[i], z = T.pz[i], y0 = tmGround(x, z) - 0.5, y1 = T.hy[i] - 1.4;
          if (y1 - y0 > 1) box(scen.get(x, z), x, y0, z, 2.2, y1 - y0, T.w * 2 + 1.5, T.hd[i], [0.62, 0.61, 0.58], null, true); }
      }
    }

    /* ---- the bends' signs (a blue board, the number and 弯) 30 m before each, on the right, facing the cars coming up; three chevrons on the
       outside of each hairpin, facing the cars coming into it ---- */
    (def.curves || []).forEach(([d, , turn], k) => {
      if (k > 45) return;
      const [px, pz, ii] = onSide(sStart + d - 30, 1, 0.8);
      if (!excluded(px, pz)) { const py = tmGround(px, pz), g = scen.get(px, pz), u0 = (k % 8) / 8, v1 = 1 - Math.floor(k / 8) / 8;
        box(g, px, py - 0.2, pz, 0.08, 2.1, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
        bannerQ(px, py + 1.2, pz, -T.tx[ii], -T.tz[ii], 0.85, 0.85, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2);
        exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); }
      const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 6 && sStart + d <= q.i1 * T.ds + 6); if (!c || c.sev < 2) return;
      const out_ = -turn, cell = turn > 0 ? 46 : 47, u0 = (cell % 8) / 8, v1 = 1 - Math.floor(cell / 8) / 8;
      for (const o of [-12, 0, 12]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.75); if (excluded(cx, cz) || onBr[ci]) continue;
        const cy = tmGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
        box(g, cx, cy - 0.2, cz, 0.08, 1.7, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
        bannerQ(cx, cy + 0.95, cz, tx / tl, tz / tl, 0.7, 0.7, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2); CR.avoid(cx, cz, 0.6); }
    });

    /* ---- the cable cars over the mountain (def.cables: OpenStreetMap's lines, their vertices the towers): grey lattice towers, the two
       hauling ropes, a gondola every ~110 m; only within ~1.2 km of the road ---- */
    let nCab = 0;
    {
      const stl = [0.5, 0.52, 0.55], rope = [0.12, 0.12, 0.13], gnd = (x, z) => (vrDist(x, z) < 420 ? tmGround(x, z) : farAt(x, z));
      for (const L of def.cables || []) {
        const n = L.length / 2, tops = [];
        for (let k = 0; k < n; k++) { const x = L[2 * k], z = L[2 * k + 1]; if (vrDist(x, z) > 1200) { tops.push(null); continue; }
          let px = x, pz = z; const nn = vrNear(px, pz); if (nn.i >= 0 && nn.dd < 4) { px += 9; pz += 9; }
          const y = gnd(px, pz), g = scen.get(px, pz), end = k === 0 || k === n - 1, h = end ? 9 : 24 + 6 * rpHash(k, 77), rot = Math.atan2(L[Math.min(n - 1, k + 1) * 2 + 1] - L[Math.max(0, k - 1) * 2 + 1], L[Math.min(n - 1, k + 1) * 2] - L[Math.max(0, k - 1) * 2]);
          if (end) { box(g, px, y - 0.5, pz, 16, 9.5, 12, rot, [0.86, 0.86, 0.84], [0.32, 0.33, 0.35], true); exclPush(px, pz, 11); }
          else { for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) ouRod(g, [px + a * 2.2, y - 0.3, pz + b * 2.2], [px + a * 0.7, y + h, pz + b * 0.7], 0.14, stl, 4);
            for (let q = 1; q < 5; q++) { const yy = y + h * q / 5, r = 2.2 - 1.5 * q / 5; box(g, px, yy, pz, r * 2, 0.16, r * 2, 0, stl); }
            box(g, px, y + h, pz, 1.2, 0.5, 7.5, rot, stl); exclPush(px, pz, 4); }
          tops.push([px, y + h + (end ? 0.5 : 0.3), pz, rot]);
        }
        for (let k = 0; k < n - 1; k++) { const a = tops[k], b = tops[k + 1]; if (!a || !b) continue;
          const dx = b[0] - a[0], dz = b[2] - a[2], Ls = Math.hypot(dx, dz) || 1, qx = -dz / Ls, qz = dx / Ls;
          for (const sd of [-3.4, 3.4]) { const g = scen.get((a[0] + b[0]) / 2, (a[2] + b[2]) / 2), A = [a[0] + qx * sd, a[1], a[2] + qz * sd], B = [b[0] + qx * sd, b[1], b[2] + qz * sd];
            ouRod(g, A, B, 0.05, rope, 3);
            for (let t = 55 + 40 * (sd > 0 ? 1 : 0); t < Ls - 20; t += 110) { const f = t / Ls, cx = lerp(A[0], B[0], f), cz = lerp(A[2], B[2], f), cy = lerp(A[1], B[1], f) - 0.6 * Math.sin(f * PI), gg = scen.get(cx, cz), ro = Math.atan2(dz, dx);
              ouRod(gg, [cx, cy, cz], [cx, cy - 1.6, cz], 0.04, stl, 3); box(gg, cx, cy - 4.1, cz, 2.3, 2.4, 2.0, ro, [0.86, 0.2, 0.16], [0.9, 0.9, 0.9], false); box(gg, cx, cy - 3.2, cz, 2.34, 0.9, 2.04, ro, [0.14, 0.18, 0.22]); nCab++; } }
        }
      }
    }

    /* ---- the town in the valley (def.town: OpenStreetMap footprints, within the far mountains' ring): pale blocks of flats and houses, instanced ---- */
    let nTown = 0;
    {
      const ug = new THREE.BoxGeometry(1, 1, 1); ug.translate(0, 0.5, 0); const tw = new IChunks(ug, new THREE.MeshLambertMaterial({ vertexColors: false }), 512), RT = rng(3961);
      for (const [x, z, L, W, a, hg] of def.town || []) {
        if (x < FD.x0 + 100 || z < FD.z0 + 100 || x > FD.x0 + (FD.nx - 2) * FD.cell || z > FD.z0 + (FD.nz - 2) * FD.cell || inCorr(x, z)) continue;
        const H = hg > 2 ? hg : L * W > 900 ? 18 + RT() * 30 : 6 + RT() * 12, k = 0.8 + 0.25 * RT(), y = farAt(x, z) - 2;
        tw.add(x, y, z, a, Math.sqrt(L * W), H + 2, [0.86 * k, 0.85 * k, 0.81 * k]); nTown++;
      }
      tw.addTo(root, false);
    }

    /* ---- limestone towers in the far valleys (where the far ring is steep): grey pillars with forest on top ---- */
    {
      const g = new GB(), RP = rng(3971); let n = 0;
      for (let t = 0; t < 400 && n < 16; t++) {
        const x = FD.x0 + (0.1 + 0.8 * RP()) * FD.nx * FD.cell, z = FD.z0 + (0.1 + 0.8 * RP()) * FD.nz * FD.cell, d = vrDist(x, z); if (d < 700 || inCorr(x, z) || behind(x, z)) continue;
        const sl = Math.hypot(farAt(x + 60, z) - farAt(x - 60, z), farAt(x, z + 60) - farAt(x, z - 60)) / 120; if (sl < 0.45) continue;
        const y = farAt(x, z) - 10, r = 16 + RP() * 22, h = 60 + RP() * 120, rk = [0.64, 0.63, 0.59];
        cyl(g, x, y, z, r, h, 9, vary(rk, RP, 0.12), [0.2, 0.3, 0.15], r * 0.8);
        API.ROCK_SMOOTH = true; ico(g, x, y + h + r * 0.15, z, r * 0.95, 0.45, [0.2, 0.31, 0.15], RP, 0.3); API.ROCK_SMOOTH = false; n++;
      }
      if (!g.empty) { const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.matrixAutoUpdate = false; root.add(m); }
    }

    /* ---- spectators: the start and the finish, the checkpoints, every fourth bend, a few groups along the road ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.2, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.14, keepBar: 1.4 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 60, sStart + 60, sd, { rows: 3, dens: 0.55, label: 'TM start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'TM finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.5, label: 'TM cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.35, label: 'TM cp-' }); });
      (def.curves || []).forEach(([d, , turn], k) => { if (k % 4 !== 2 || d > T.raceLen - 40) return; const sm = sStart + d; for (const sd of [-1, 1]) run(sm - 20, sm + 20, sd, { rows: 2, dens: sd === turn ? 0.45 : 0.3, label: 'TM bend ' + k }); });
      for (let s = sStart + 300; s < sFin - 300; s += 520) { const sd = rpHash(Math.round(s), 6) < 0.5 ? -1 : 1; if (onBr[T.idx(s)]) continue; run(s, s + 22, sd, { rows: 2, dens: 0.3, clump: 0.9, label: 'TM group' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the forest (instanced per 96 m chunk): evergreen broadleaves and pines thick on the slopes, bamboo near the road lower down, shrubs on
       the ledges of the cliffs; none on the bare faces, the road, the plots; limestone boulders at the foot of the cuts ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const pk = [0, 1, 2, 3, 4].map(k => new IChunks(tmPlantGeo(k), pMat, 128));
    let nPlants = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(40000 * dens), RT = rng(3981), SP = 5.6 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > 210) continue;
          if (hd > 80 && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot)
          const c = vrLC(x, z), y0 = tmGround(x, z), sl = tmSlope(x, z), A = y0 + base;
          let kind = -1;
          if (c === 0) kind = r1 < 0.6 ? 0 : r1 < 0.8 ? 1 : r1 < 0.86 && A < 1050 ? 2 : 3;
          else if (c === 1 || c === 4) kind = r1 < 0.55 ? 3 : r1 < 0.75 ? 0 : -1;
          else if (c === 2) kind = r1 < 0.15 ? 3 : r1 < 0.2 ? 4 : -1;
          if (kind < 0) continue;
          if (sl > 1.7) { if (kind !== 3 || sl > 2.6 || r2 < 0.4) continue; }   // (the trees cling to the steep slopes too; the cliffs bare but for a shrub on a ledge here and there)
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < (kind < 2 ? 2.4 : 1.4)) continue;
          if (excluded(x, z)) continue;
          if (kind === 0) pk[0].add(x, y0 - 0.2, z, r2 * TAU, 6 + r3 * 5, 8 + r4 * 9, [0.85 + r2 * 0.3, 0.88 + r3 * 0.24, 0.85 + r4 * 0.2]);
          else if (kind === 1) pk[1].add(x, y0 - 0.2, z, r2 * TAU, 7 + r3 * 4, 12 + r4 * 9, [0.88 + r2 * 0.2, 0.9 + r3 * 0.16, 0.9]);
          else if (kind === 2) pk[2].add(x, y0 - 0.1, z, r2 * TAU, 2.6 + r3 * 1.5, 7 + r4 * 5, [0.9 + r2 * 0.2, 0.95 + r3 * 0.1, 0.9]);
          else if (kind === 3) pk[3].add(x, y0 - 0.1, z, r2 * TAU, 1.2 + r3 * 1.6, 1.0 + r4 * 1.3, [0.88 + r2 * 0.24, 0.9 + r3 * 0.2, 0.88]);
          else { const k = 0.85 + r3 * 0.3; pk[4].add(x, y0 - 0.15, z, r4 * TAU, 0.6 + r3 * 1.6, 0.5 + r4 * 1.0, [k, k, k]); }
          if (++nPlants >= maxT) break grid;
        }
      }
    }
    pk.forEach((t, k) => t.addTo(root, k < 3));   // (the trees cast shadows, the shrubs and the boulders do not)
    {   // crags: limestone boulders where the slope beside the road is steep
      const RV = rng(3991), rockC = [[0.68, 0.67, 0.63], [0.6, 0.6, 0.57], [0.64, 0.6, 0.54], [0.52, 0.53, 0.5]];
      for (let s = 16; s < T.len - 16; s += 14) for (const side of [-1, 1]) {
        if (RV() < 0.35) continue;
        const [x, z] = onSide(s, side, 6 + RV() * 60); if (excluded(x, z) || vrNear(x, z).dd < 5) continue;
        const sl = tmSlope(x, z); if (sl < 0.75) continue;
        const y = tmGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 2 + RV() * 4, qx = x + (RV() - 0.5) * 8, qz = z + (RV() - 0.5) * 8, qy = tmGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.4, qz, r0 * 0.8, r0 * (1.1 + RV() * 1.0), r0 * (0.6 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, 0.35); }
      }
    }

    /* ---- the mist: soft white banks of low cloud in the valley below the road and against the cliffs above it (no depth writes, in the fog) ---- */
    {
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c); out.ownTex.push(t);
      const mat = new THREE.MeshLambertMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.7, side: THREE.DoubleSide, emissive: 0x9aa4ac }), RM = rng(3999), pos = [], uvs = [], nor = [];
      let n = 0;
      for (let k = 0; k < 600 && n < 36; k++) {
        const x2 = P.bx0 - 300 + RM() * (P.bx1 - P.bx0 + 600), z2 = P.bz0 - 300 + RM() * (P.bz1 - P.bz0 + 600), d = vrDist(x2, z2); if (d < 90 || d > 520) continue;
        const gy = d < 420 ? tmGround(x2, z2) : farAt(x2, z2), lowR = T.hy[0], y = gy + 18 + RM() * 30;
        if (y > lowR - 25 && RM() < 0.7) continue;   // (mostly down in the valley, below the road's foot)
        const nn = vrNear(x2, z2); if (nn.i >= 0 && Math.abs(nn.h - y) < 30 && nn.d < 140) continue;   // (never over the road itself)
        const sc = 120 + RM() * 160, sb = sc * (0.5 + RM() * 0.4), a = RM() * PI, ca = Math.cos(a), sa = Math.sin(a), Q = (u, v) => [x2 + ca * u * sc / 2 - sa * v * sb / 2, y, z2 + sa * u * sc / 2 + ca * v * sb / 2];
        for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { pos.push(...Q(u, v)); uvs.push((u + 1) / 2, (v + 1) / 2); nor.push(0, 1, 0); }
        n++;
      }
      if (n) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.computeBoundingSphere();
        const m = new THREE.Mesh(geo, mat); m.renderOrder = 2; m.matrixAutoUpdate = false; root.add(m); }   // (one mesh: one draw)
      out.mist = n;
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fac.addTo(sceneryGroup, ouCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: tmAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: tmAtlas2(def.curves || []), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { plants: nPlants, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), steps: nSteps, cabins: nCab, town: nTown, mist: out.mist };   // (read by the tests)
    return out;
  }

  World.ext.tianmen = (scene, tex, opts) => buildTianmen(scene, tex, opts);
})();
