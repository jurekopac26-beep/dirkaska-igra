/* =========================================================================
   WORLD — Santo Antão (theme 'santoantao'): its own builder (World.ext.santoantao). What it uses of World comes from World.api: the helpers
   bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T) copied in at each build. Built on
   Vršič's corridor (vrPrep and Los Caracoles' terrain helpers caH / caGround read the same forms: def.dem, def.lc), as Dadès; the walls
   between the legs of the hairpins as the shared world of the passes builds them (js/world-prelaz.js: copied here, that file is not changed
   for this road). The basalt cobbles of the road (saCobbleTex) are there for the other cobbled roads too: API.saCobble.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caCar, caGH, caGround, caSlope, caTileOn, clamp, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl,
    ico, lerp, ouCutMat, pkGroundMat, propFloorTable, rng, roadsideProps, rock, rpHash, sstep, valueNoise2, vary, vrDist, vrFar, vrGritTex, vrLC,
    vrLCf, vrNear, vrPrep, parkOn
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= SANTO ANTÃO (theme 'santoantao') =================
     The cobbled road EN1-SA-01 on the island of Santo Antão (Cape Verde): along the narrow ridge of Delgadim, over its saddle and its top and
     down six hairpins towards Ribeira Grande, on a bright afternoon with the haze of the trade wind over the sea. A look of its own: the
     ground's colours (saCol: the grassy volcanic slopes in olive green and straw with the red-brown soil showing, darker shrubs and trees, the
     bands of the terraced fields, the dark basalt and the reddish tuff in bands on the steep faces, the footpaths), the road of dark basalt
     cobbles with a kerb of bigger stones (no lines on it), the masonry walls holding the legs of the hairpins, the low basalt parapets on the
     drops (whitewashed in blocks round the hairpins), the chevrons, the two viewpoints on the saddle (def.views: a terrace on either side of
     the ridge), the plants (saTreeGeo: cypresses, eucalyptus, acacias, shrubs, agaves, tufts of grass), the small houses scattered on the
     slopes below (def.bld; generic), the land beyond the corridor and the sea (irFar). Only geographic names on the boards. */
  const SCOL = [0, 0, 0];
  let PA = null;   // the footpaths (def.paths, prepared at each build): { x, z: their points, H: a hash of their segments by PAC m cells }
  const PAC = 16;
  function pathD(x, z) {   // the distance to the nearest footpath within ~PAC m (or 1e9)
    if (!PA) return 1e9;
    const L = PA.H.get(Math.floor(x / PAC) * 65536 + Math.floor(z / PAC)); if (!L) return 1e9;
    let best = 1e9;
    for (let q = 0; q < L.length; q++) { const k = L[q], ax = PA.x[k], az = PA.z[k], ux = PA.x[k + 1] - ax, uz = PA.z[k + 1] - az, ll = ux * ux + uz * uz || 1;
      const t = clamp(((x - ax) * ux + (z - az) * uz) / ll, 0, 1), dx = x - ax - ux * t, dz = z - az - uz * t, d = dx * dx + dz * dz; if (d < best) best = d; }
    return Math.sqrt(best);
  }
  function saCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map): the grass of the slopes (lc 0) olive green with patches of straw and of the
    // red-brown soil, the shrubs (lc 2) and the trees (lc 1) darker, the terraced fields (lc 6) fresh green in bands along the contours with their
    // walls between, the yards (lc 3) grey, the bare ground (lc 4) dark; on the steep faces the basalt's dark grey and the tuff's reddish bands, the
    // grass hanging on in the ledges; the footpaths and the verge trodden
    const P = API.VR, A = h + P.D.base, f = P.n4(x, z), q = P.c2(x, z), m = P.c1(x, z), s5 = P.c5(x * 1.3, z * 1.3);
    let R = 0.43, G = 0.48, B = 0.25;
    const dry = sstep(0.5, 0.82, m) * 0.55; R = lerp(R, 0.62, dry); G = lerp(G, 0.57, dry); B = lerp(B, 0.34, dry);   // (straw)
    const soil = sstep(0.64, 0.86, q) * 0.42; R = lerp(R, 0.52, soil); G = lerp(G, 0.37, soil); B = lerp(B, 0.27, soil);   // (the red-brown soil)
    const sh = vrLCf(x, z, 2) * 0.7; R = lerp(R, 0.3, sh); G = lerp(G, 0.38, sh); B = lerp(B, 0.2, sh);
    const tr = vrLCf(x, z, 1) * 0.75; R = lerp(R, 0.24, tr); G = lerp(G, 0.32, tr); B = lerp(B, 0.16, tr);
    const fd = vrLCf(x, z, 6) * 0.85;
    if (fd > 0) { const band = 0.5 + 0.5 * Math.sin(A / 2.4 + P.c3(x, z) * 3), wall = sstep(0.8, 0.95, band) * 0.8;
      const fr = lerp(0.38, 0.56, s5), fg = lerp(0.53, 0.52, s5), fb = lerp(0.2, 0.29, s5);   // (green crops and the stubble)
      R = lerp(R, lerp(fr, 0.44, wall), fd); G = lerp(G, lerp(fg, 0.4, wall), fd); B = lerp(B, lerp(fb, 0.31, wall), fd); }
    const bu = vrLCf(x, z, 3) * 0.6; R = lerp(R, 0.6, bu); G = lerp(G, 0.57, bu); B = lerp(B, 0.52, bu);
    const ba = vrLCf(x, z, 4) * 0.8; R = lerp(R, 0.37, ba); G = lerp(G, 0.34, ba); B = lerp(B, 0.31, ba);
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.08; B += (f - 0.5) * 0.05;
    const st = sstep(0.7, 0.42, ny) * (1 - 0.6 * fd);
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 5.5 + P.c2(x * 0.4, z * 0.4) * 6), tuff = sstep(0.6, 0.9, band) * sstep(0.4, 0.7, P.c3(x, z)), k = 0.88 + 0.14 * band;
      const ledge = sstep(0.5, 0.75, s5) * 0.4 * sstep(0.3, 0.5, ny);
      const rr = lerp(lerp(0.34, 0.53, tuff) * k, R, ledge), rg = lerp(lerp(0.33, 0.37, tuff) * k, G, ledge), rb = lerp(lerp(0.31, 0.28, tuff) * k, B, ledge);
      R = lerp(R, rr, st); G = lerp(G, rg, st); B = lerp(B, rb, st); }
    const pd = pathD(x, z); if (pd < 1.3) { const t = sstep(1.3, 0.4, pd) * 0.7; R = lerp(R, 0.52, t); G = lerp(G, 0.44, t); B = lerp(B, 0.33, t); }
    if (dd < 1.8) { const t = sstep(1.8, 0.2, dd) * 0.45; R = lerp(R, 0.43, t); G = lerp(G, 0.38, t); B = lerp(B, 0.3, t); }
    SCOL[0] = R; SCOL[1] = G; SCOL[2] = B; return SCOL;
  }
  function saGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (as caGCol, coloured by saCol)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = saCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function saTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by saCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = saCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
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
  function saFarCol(A, sl, q) {   // the land beyond the corridor (irFar; the sea it paints itself): green slopes, the dark basalt and the red-brown tuff of the
    // ridges' steep faces, the pine woods up high, the drier brown coast
    const rk = Math.min(1, sstep(0.5, 0.95, sl) * 0.85), pine = sstep(900, 1200, A) * 0.6, dry = sstep(140, 30, A) * 0.5;
    let c = [0.38 + q * 0.05, 0.45 + q * 0.04, 0.25 + q * 0.03];
    c = [lerp(c[0], 0.22, pine), lerp(c[1], 0.3, pine), lerp(c[2], 0.17, pine)];
    c = [lerp(c[0], 0.56, dry), lerp(c[1], 0.5, dry), lerp(c[2], 0.36, dry)];
    return [lerp(c[0], 0.36 + q * 0.1, rk), lerp(c[1], 0.33 + q * 0.03, rk), lerp(c[2], 0.3, rk)];
  }
  // the road's cobbles: the dark basalt stones of the island's roads (~16 cm, irregular, set close), the joints between them dark with soil, the
  // relief baked in (each stone lit from one side); 512 px = 2.4 m of road, tileable; made once and kept (API.saCobble: for the other cobbled roads)
  let saCobT = null;
  function saCobbleTex() {
    if (saCobT) return saCobT;
    const S = 512, n = 15, cell = S / n, Rr = rng(5101), sx = new Float32Array(n * n), sz = new Float32Array(n * n), tone = new Float32Array(n * n), tint = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = j * n + i; sx[k] = (i + 0.15 + Rr() * 0.7) * cell; sz[k] = (j + 0.15 + Rr() * 0.7) * cell; tone[k] = 0.82 + Rr() * 0.36; tint[k] = Rr() - 0.5; }
    const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), im = x.createImageData(S, S), d = im.data;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
      const ci = Math.floor(px / cell), cj = Math.floor(py / cell); let f1 = 1e9, f2 = 1e9, k1 = 0, dx1 = 0, dy1 = 0;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
        const ia = ci + a, jb = cj + b, k = ((jb + n) % n) * n + ((ia + n) % n), ox = sx[k] + (ia < 0 ? -S : ia >= n ? S : 0), oy = sz[k] + (jb < 0 ? -S : jb >= n ? S : 0);
        const dx = px - ox, dy = py - oy, dd = dx * dx + dy * dy;
        if (dd < f1) { f2 = f1; f1 = dd; k1 = k; dx1 = dx; dy1 = dy; } else if (dd < f2) f2 = dd;
      }
      f1 = Math.sqrt(f1); f2 = Math.sqrt(f2); const e = (f2 - f1) / 2, o = (py * S + px) * 4;   // (e: about the distance to the joint, px)
      let r, g, b;
      if (e < 1.3) { const k = 0.2 + e * 0.05 + (Rr() - 0.5) * 0.04; r = k * 1.08; g = k; b = k * 0.88; }   // (the joint)
      else {
        const edge = sstep(cell * 0.24, 1.3, e), lit = -(dx1 * 0.6 + dy1 * 0.8) / (f1 + 1e-3) * edge, tn = tone[k1];
        const k = tn * (0.43 + 0.16 * lit) * (0.8 + 0.2 * sstep(1.3, 4.5, e)) + (Rr() - 0.5) * 0.045;
        r = k * (1 + tint[k1] * 0.07); g = k; b = k * (1.03 - tint[k1] * 0.05);
      }
      d[o] = clamp(r * 255, 0, 255); d[o + 1] = clamp(g * 255, 0, 255); d[o + 2] = clamp(b * 255, 0, 255); d[o + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return (saCobT = t);
  }
  API.saCobble = saCobbleTex;
  let sATex = null, sAKey = '', sA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function saAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): PARTIDA (the start), CHEGADA (the finish), CP1-CP4 with the altitude, the board at the finish, the race's banner
    const key = cps.join('|') + '|' + finA; if (sATex && sAKey === key) return sATex;
    if (sATex) sATex.dispose(); sAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('PARTIDA', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(262, 142, 500, 100); txt('CHEGADA', 512, 196, 92, '#111', 470);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#1f4f8f'; x.fillRect(0, y, 1024, 128); x.fillStyle = '#f7d116'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#f7d116', 520); });
    x.fillStyle = '#2f5a34'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#eef0e6'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('RIBEIRA GRANDE', 512, 812, 58, '#f2f4ea', 900); txt(finA, 512, 862, 46, '#f2f4ea', 900);
    x.fillStyle = '#1f4f8f'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#cf2027'; x.fillRect(0, 956, 1024, 8);
    txt('SANTO ANTÃO', 512, 930, 52, '#fff', 980); txt('DELGADIM · EN1-SA-01', 512, 994, 44, '#f7d116', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (sATex = t);
  }
  const SA_BOARDS = [['RIBEIRA GRANDE', '#2f5a34'], ['PORTO NOVO', '#2f5a34'], ['CORDA', '#2f5a34'], ['MIRADOURO', '#6b4a22'], ['CURVAS PERIGOSAS', '#f2f0ea'], ['DEVAGAR', '#f2f0ea'], ['DELGADIM', '#6b4a22'], ['SANTO ANTÃO', '#6b4a22']];
  function saAtlas2() {   // the small signs: cells 30-31 the chevrons (white on red, pointing the way the road turns), cells 28-29 the viewpoint's board (a
    // picture of the island's ridges and the sea, no words); rows 4-7, the place boards (two a row, 512 x 128)
    if (sA2Tex) return sA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (const [k, dir] of [[30, 1], [31, -1]]) {
      const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128; x.fillStyle = '#c8261c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f6f5f0';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    { const x0 = 512, y0 = 384, W = 256, H = 128;   // the viewpoint's board: the sky, the ridges in green, the sea, the road's line in red and its two viewpoints
      x.fillStyle = '#6b4a22'; x.fillRect(x0, y0, W, H); x.fillStyle = '#dfe9ee'; x.fillRect(x0 + 8, y0 + 8, W - 16, H - 16);
      x.fillStyle = '#4f7fa6'; x.fillRect(x0 + 8, y0 + 84, W - 16, H - 92);
      for (const [cx, hw, hh, col] of [[60, 70, 52, '#7d9a5a'], [150, 80, 64, '#5f7f46'], [222, 52, 40, '#6f8d50']]) { x.fillStyle = col; x.beginPath(); x.moveTo(x0 + cx - hw, y0 + 96); x.lineTo(x0 + cx, y0 + 96 - hh); x.lineTo(x0 + cx + hw, y0 + 96); x.closePath(); x.fill(); }
      x.fillStyle = '#8a5a3a'; x.fillRect(x0 + 8, y0 + 92, W - 16, 6);
      x.strokeStyle = '#c8261c'; x.lineWidth = 4; x.beginPath(); x.moveTo(x0 + 30, y0 + 70); x.lineTo(x0 + 90, y0 + 52); x.lineTo(x0 + 150, y0 + 40); x.lineTo(x0 + 175, y0 + 62); x.lineTo(x0 + 205, y0 + 54); x.lineTo(x0 + 236, y0 + 82); x.stroke();
      x.fillStyle = '#f7d116'; for (const [px, py] of [[148, 40], [158, 46]]) { x.beginPath(); x.arc(x0 + px, y0 + py, 6, 0, TAU); x.fill(); } }
    SA_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, warn = bg === '#f2f0ea';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = warn ? '#c8261c' : '#f2f2ee'; x.lineWidth = warn ? 12 : 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, 52, warn ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (sA2Tex = t);
  }
  function saTreeGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 a cypress (a narrow dark column), 1 a eucalyptus (a tall pale
    // trunk, an open grey-green crown), 2 an acacia (a flat umbrella of a crown on a leaning trunk), 3 a shrub (a rounded dark green mound), 4 an agave
    // (a rosette of stiff grey-green leaves), 5 a tuft of grass (straw-tipped blades)
    const g = new GB(), R = rng(980 + kind), rs = API.ROCK_SMOOTH, frond = (cx, cy, cz, a, L, lift, droop, w, col, tip) => {
      const ux = Math.cos(a), uz = Math.sin(a), px = -uz * w, pz = ux * w, m = [cx + ux * L * 0.55, cy + lift, cz + uz * L * 0.55], e = [cx + ux * L, cy + lift - droop, cz + uz * L];
      const b = [cx, cy, cz], l1 = [m[0] + px, m[1], m[2] + pz], r1 = [m[0] - px, m[1], m[2] - pz], up = [cx, cy + 1, cz], dn = [cx, cy - 1, cz];
      g.triO(b, l1, m, col, dn, col, col); g.triO(b, m, l1, col, up, col, col); g.triO(b, m, r1, col, dn, col, col); g.triO(b, r1, m, col, up, col, col);
      g.triO(l1, e, m, col, dn, tip, col); g.triO(l1, m, e, col, up, col, tip); g.triO(m, e, r1, col, dn, tip, col); g.triO(m, r1, e, col, up, col, tip); };
    if (kind === 0) {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.022, 0.12, 4, [0.4, 0.33, 0.26], null, 0.016);
      ico(g, 0, 0.42, 0, 0.16, 2.5, [0.2, 0.3, 0.16], R, 0.2); ico(g, 0, 0.7, 0, 0.1, 2.3, [0.23, 0.33, 0.18], R, 0.25);
    } else if (kind === 1) {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.025, 0.64, 4, [0.72, 0.68, 0.6], null, 0.018);
      const cs = [[0.36, 0.44, 0.3], [0.4, 0.47, 0.33], [0.33, 0.41, 0.28]];
      ico(g, 0, 0.78, 0, 0.2, 1.1, cs[0], R, 0.4); ico(g, 0.14, 0.66, 0.08, 0.15, 1.0, cs[1], R, 0.4); ico(g, -0.13, 0.7, -0.1, 0.15, 1.1, cs[2], R, 0.4); ico(g, 0.02, 0.9, 0.05, 0.12, 0.8, cs[1], R, 0.4);
    } else if (kind === 2) {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.03, 0.66, 4, [0.36, 0.3, 0.24], null, 0.02); cyl(g, 0.06, 0.5, 0.02, 0.016, 0.3, 3, [0.36, 0.3, 0.24], null, 0.01);
      ico(g, 0, 0.8, 0, 0.4, 0.3, [0.3, 0.4, 0.18], R, 0.25); ico(g, 0.12, 0.9, 0.06, 0.26, 0.32, [0.36, 0.45, 0.21], R, 0.25); ico(g, -0.16, 0.74, -0.1, 0.24, 0.3, [0.28, 0.37, 0.17], R, 0.25);
    } else if (kind === 3) {
      API.ROCK_SMOOTH = true; ico(g, 0, 0.42, 0, 0.52, 0.8, [0.3, 0.4, 0.2], R, 0.4); ico(g, 0.28, 0.32, 0.16, 0.32, 0.85, [0.35, 0.44, 0.22], R, 0.4); ico(g, -0.24, 0.3, -0.18, 0.3, 0.8, [0.27, 0.36, 0.19], R, 0.4);
    } else if (kind === 4) {
      const lc = [[0.4, 0.5, 0.42], [0.45, 0.54, 0.44]], tp = [0.52, 0.56, 0.42];
      for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + R() * 0.3, up = k % 2 ? 0.55 : 0.32; frond(0, 0.03, 0, a, 0.5 - up * 0.3, up, -up * 0.6, 0.07, lc[k % 2], tp); }
    } else {
      const gc = [[0.5, 0.52, 0.28], [0.58, 0.56, 0.32]], gt = [0.72, 0.66, 0.42];
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.5; frond(0, 0, 0, a, 0.28 + R() * 0.12, 0.62, -0.3, 0.035, gc[k % 2], gt); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the knockable roadside posts: white with a red top
  function saProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }

  function buildSantoAntao(scene, tex, opts) {
    const R = rng(4811), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.5, 0.43, 0.34] };
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS;
    P.c1 = valueNoise2(921, 150); P.c2 = valueNoise2(922, 64); P.c3 = valueNoise2(923, 90); P.c4 = valueNoise2(924, 120); P.c5 = valueNoise2(925, 26);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the footpaths (def.paths: [x, z, ...]): their points and a hash of their segments
    PA = null;
    { const xs = [], zs = [], H = new Map();
      for (const p of def.paths || []) { const n = p.length / 2; if (n < 2) continue; const k0 = xs.length;
        for (let k = 0; k < n; k++) { xs.push(p[2 * k]); zs.push(p[2 * k + 1]); }
        for (let k = k0; k < k0 + n - 1; k++) { const a0 = Math.floor((Math.min(xs[k], xs[k + 1]) - 2) / PAC), a1 = Math.floor((Math.max(xs[k], xs[k + 1]) + 2) / PAC), b0 = Math.floor((Math.min(zs[k], zs[k + 1]) - 2) / PAC), b1 = Math.floor((Math.max(zs[k], zs[k + 1]) + 2) / PAC);
          for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) { const kk = a * 65536 + b; let L = H.get(kk); if (!L) H.set(kk, L = []); L.push(k); } }
        xs.push(NaN); zs.push(NaN); }   // (a gap between two paths: the segment across it is never hashed)
      if (xs.length) PA = { x: Float32Array.from(xs), z: Float32Array.from(zs), H }; }
    // the level plots: the viewpoints (def.views: on the saddle, on the road itself in the map, so each one a terrace beside it, the first on the side
    // the ground falls the more, the next on the other), the cars' park past the finish
    const views = [];
    { let sd0 = 0;
      for (const [x, z] of def.views || []) { const n = vrNear(x, z); if (n.i < 0 || n.dd > 25) continue; const i = n.i, s = i * T.ds; if (s < sStart + 20 || s > sFin - 20) continue;
        if (n.dd > w + 1.5) { const pad = { x, z, r: 6, b: 8, h: T.hy[i] - 0.15, i }; P.pads.push(pad); views.push(pad); continue; }
        const gd = (sd) => vrFar(T.px[i] + T.nx[i] * sd * 14, T.pz[i] + T.nz[i] * sd * 14) - T.hy[i];
        if (!sd0) sd0 = gd(1) < gd(-1) ? 1 : -1; else sd0 = -sd0;
        const r = 5, o = (sd0 > 0 ? T.br[i] : T.bl[i]) + r + 0.8, pad = { x: T.px[i] + T.nx[i] * sd0 * o, z: T.pz[i] + T.nz[i] * sd0 * o, r, b: 8, h: T.hy[i] - 0.15, i, sd: sd0 };
        P.pads.push(pad); views.push(pad); } }
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 14, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 60, 12); P.pads.push(padF);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (crowds, plots, signs) for the plants and the rocks, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const p of views) exclPush(p.x, p.z, p.r + 2);
    exclPush(padF.x, padF.z, padF.r + 4);
    out.marks = {}; if (views.length) out.marks.view = [views[0].x, views[0].z];   // (where the landmarks stand: the tests look for them)

    /* ---- the retaining walls between the legs of the hairpins (as js/world-prelaz.js builds them): the game's road is wider than the real one
       (9 m against ~6 m), so where two legs lie close the lower one's barrier comes within a few metres of the upper one's and the climb between
       them falls in between: the terrain's 5 m grid could only draw that as a sheer face over jagged teeth. There a masonry wall stands under
       the upper verge's edge (bar + 0.42), battered 1 in 20, its foot on a level shelf at the lower leg's height; the terrain kept down to the
       shelf from under the upper verge out to the lower leg's barrier (API.caBank in caH). bk[si][i]: { p: [[offset, height above the road]
       top, foot], o1: where the shelf ends, hl: the lower leg's height } or null ---- */
    const BKC = 24, BKH = new Map(), bk = [-1, 1].map((side, si) => { const a = new Array(N).fill(null);
      for (let i = 0; i < N; i++) {
        const bar = side > 0 ? T.br[i] : T.bl[i], o0 = bar + 0.42, y = T.hy[i], at = (o) => [T.px[i] + T.nx[i] * side * o, T.pz[i] + T.nz[i] * side * o];
        const other = (o) => { const [x, z] = at(o), n = vrNear(x, z); return n.i >= 0 && Math.abs(n.i - i) * T.ds > 40 && T.hy[n.i] < y - 4 ? n : null; };
        if (![1, 6, 12, 18].some(d => { const n = other(o0 + d); return n && n.dd < 3; })) continue;
        let oL = -1, hl = 0;
        for (let o = o0; o < o0 + 26; o += 0.5) { const n = other(o); if (n && n.dd < 0.5) { oL = o; hl = T.hy[n.i]; break; } }
        const H = y - hl; if (oL < 0 || H / Math.max(0.5, oL - o0) < 1.2) continue;
        const ob = Math.max(o0, Math.min(o0 + 0.05 * H, oL - 0.5)); a[i] = { p: [[o0, -0.08], [ob, -H - 0.6]], o1: Math.max(ob + 0.8, oL + 0.4), hl }; }
      for (let i = 1; i < N - 1; i++) if (a[i] && !a[i - 1] && !a[i + 1]) a[i] = null;
      for (let i = 0; i < N; i++) if (a[i]) { const o0 = a[i].p[0][0];
        for (const o of [o0 - 6, o0, a[i].o1]) { const k = Math.floor((T.px[i] + T.nx[i] * side * o) / BKC) * 65536 + Math.floor((T.pz[i] + T.nz[i] * side * o) / BKC);
          for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) { const kk = k + da * 65536 + db; let Lq = BKH.get(kk); if (!Lq) BKH.set(kk, Lq = []); if (Lq[Lq.length - 1] !== si * N + i) Lq.push(si * N + i); } } }
      return a; });
    const saBank = (x, z, h) => {
      const Lq = BKH.get(Math.floor(x / BKC) * 65536 + Math.floor(z / BKC));
      if (Lq) for (let q = 0; q < Lq.length; q++) { const si = Lq[q] >= N ? 1 : 0, i = Lq[q] - si * N, side = si ? 1 : -1, b = bk[si][i], dx = x - T.px[i], dz = z - T.pz[i];
        if (Math.abs(dx * T.tx[i] + dz * T.tz[i]) > T.ds * 0.75) continue;
        const o = (dx * T.nx[i] + dz * T.nz[i]) * side; if (o < b.p[0][0] - 6 || o > b.o1) continue;
        if (b.hl - 0.35 < h) h = b.hl - 0.35; }
      return h; };
    API.caBank = { T, f: saBank };

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat();
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(saTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the road: the dark basalt cobbles (no lines), darker where the wheels polish them, a kerb of bigger stones along each edge, then the
       verge out to a ditch past the barrier line; where the ground falls far below, the stone retaining wall that holds the road (its face out
       over the drop); by a leg below, the wall's coping, then the bank (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const cob = saCobbleTex(), aMat = new THREE.MeshLambertMaterial({ map: cob, vertexColors: true }); aMat.userData.wear = true; out.asphaltMat = aMat;   // (wear: the rain darkens it as a road)
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.45;
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (bk[side > 0 ? 1 : 0][i]) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, -0.08], [bar + 0.42, -0.08], [bar + 0.42, -0.08]];   // (a bank down to the leg below: the wall's coping, then the bank)
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    let nWall = 0;
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 2.4, kerbL = 3.8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.94 - 0.07 * Math.exp(-((o - rl - 0.9) * (o - rl - 0.9)) / 0.6) - 0.07 * Math.exp(-((o - rl + 0.9) * (o - rl + 0.9)) / 0.6); if (Math.abs(o) > w * 0.86) k -= 0.04;
        k *= 0.95 + 0.1 * P.n2(T.px[i] * 0.5 + o, T.pz[i] * 0.5); return [k, k, k * 1.02]; };
      const kc = [1.12, 1.1, 1.08], wallC = [0.4, 0.39, 0.37], copeC = [0.55, 0.54, 0.51];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (bk[si][i]) { const q = 0.92 + 0.12 * rpHash(i >> 2, 61 + si); return k < 2 ? [copeC[0] * q, copeC[1] * q, copeC[2] * q] : [wallC[0] * q, wallC[1] * q, wallC[2] * q]; }
          const wl = vp[si][i][2][1] < -2.6; if (wl && (k === 1 || k === 2)) { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si); return k === 1 ? [copeC[0] * q, copeC[1] * q, copeC[2] * q] : [wallC[0] * 0.85 * q, wallC[1] * 0.85 * q, wallC[2] * 0.85 * q]; }
          if (k === 4) return saGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return saCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gv = new GB(true), gw = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / kerbL, s1 = j * T.ds / kerbL;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gr.quadUp(Pt(i, side * w, 0.03), Pt(i, side * (w + sw), 0.0), Pt(j, side * (w + sw), 0.0), Pt(j, side * w, 0.03), [kc, kc, kc, kc], [[0, s0], [sw / kerbL, s0], [sw / kerbL, s1], [0, s1]]);   // (the kerb: the same stones, bigger)
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6) && !bk[si][i]) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face: out, over the drop)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
            const bi = bk[si][i], bj = bk[si][j];   // the wall down to the leg below: its battered face from the coping to the shelf, the shelf out to the lower barrier
            if (bi && bj) { const top = (q, b2) => Pt(q, side * b2.p[0][0], b2.p[0][1]), foot = (q, b2) => Pt(q, side * b2.p[1][0], b2.p[1][1]), A = top(i, bi), B = top(j, bj), C = foot(j, bj), D = foot(i, bi);
              const q = 0.9 + 0.14 * rpHash(i >> 1, 71 + si), wc2 = [wallC[0] * q, wallC[1] * q, wallC[2] * q], dk = [wallC[0] * 0.78 * q, wallC[1] * 0.78 * q, wallC[2] * 0.78 * q];
              gw.quadO(A, B, C, D, null, Pt(i, 0, -bi.p[1][1] * 0.2 - 1), [wuv(A), wuv(B), [B[0] / 10, -(B[2]) / 10 + 0.4], [A[0] / 10, -(A[2]) / 10 + 0.4]], [wc2, wc2, dk, dk]);
              const E = Pt(i, side * bi.o1, -(T.hy[i] - bi.hl) - 0.32), F = Pt(j, side * bj.o1, -(T.hy[j] - bj.hl) - 0.32), sc = [0.44, 0.4, 0.33];
              gw.quadUp(D, C, F, E, [sc, sc, sc, sc], [wuv(D), wuv(C), wuv(F), wuv(E)]); nWall++; }
          }
        }
        addM(gr, aMat); addM(gv, gMat); addM(gw, gMat);
      }
      const gq = new GB(true), gw2 = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wht = [0.94, 0.93, 0.88];   // chequered start and finish lines, a white line at each checkpoint
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw2.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw2, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.84, 0.16, 0.14], [0.95, 0.95, 0.94], [0.12, 0.26, 0.56], [0.97, 0.82, 0.1], [0.18, 0.46, 0.3], [0.5, 0.32, 0.2], [0.12, 0.14, 0.2], [0.86, 0.62, 0.42], [0.46, 0.66, 0.86], [0.7, 0.2, 0.36]];
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a place board of the second atlas: [v0, v1, u0, u1]
    const signAt = (s, side, k, o) => { const [bx, bz, bi] = onSide(s, side, o || 1.4); if (excluded(bx, bz)) return;   // a place board on a post, facing the cars
      const by = caGround(bx, bz), [v0, v1, u0, u1] = board(k); box(scen.get(bx, bz), bx, by - 0.2, bz, 0.1, 2.6, 0.1, T.hd[bi], [0.6, 0.61, 0.63]); bannerQ(bx, by + 1.7, bz, -T.tx[bi], -T.tz[bi], 3.2, 0.8, v0, v1, u0, u1, ban2); exclPush(bx, bz, 2); };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const carCols = [[0.9, 0.9, 0.88], [0.72, 0.12, 0.1], [0.62, 0.6, 0.56], [0.16, 0.16, 0.18], [0.82, 0.76, 0.62], [0.24, 0.36, 0.5], [0.95, 0.95, 0.94]];
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the houses on the slopes below the road (def.bld: small, scattered, all a few hundred metres off; generic): plastered cubes in the
       island's pale colours or the bare grey of the blocks, a flat concrete roof; only where the terrain is drawn under them (one mesh) ---- */
    let nBld = 0;
    {
      const RB = rng(4821), G = P.G, Lt = VRC * VRT, gh = new GB();
      const cols = [[0.92, 0.9, 0.84], [0.9, 0.82, 0.58], [0.88, 0.7, 0.66], [0.66, 0.78, 0.86], [0.86, 0.66, 0.42], [0.62, 0.61, 0.58], [0.95, 0.94, 0.9]], roofC = [0.56, 0.55, 0.52];
      for (const [x, z, L0, W0, ang] of def.bld || []) {
        const ti = Math.floor((x - G.x0) / Lt), tj = Math.floor((z - G.z0) / Lt); if (ti < 0 || tj < 0 || ti >= G.ntx || tj >= G.ntz || !caTileOn(ti, tj)) continue;
        const L = Math.max(4, L0 * 1.6), W = Math.max(3.5, W0 * 1.6), c = Math.cos(ang), s = Math.sin(ang); let lo = 1e9;   // (the map's outlines are of the roofs' cores: a little bigger)
        for (const [u, v] of [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2], [0, 0]]) lo = Math.min(lo, caGround(x + c * u - s * v, z + s * u + c * v));
        const col = vary(cols[Math.floor(RB() * cols.length)], RB, 0.05), H = RB() < 0.3 ? 5.8 : 3.1;
        box(gh, x, lo - 1.2, z, L, H + 1.2, W, -ang, col, col);
        box(gh, x, lo + H, z, L + 0.3, 0.22, W + 0.3, -ang, roofC, roofC);
        nBld++;
      }
      addM(gh, lMat);
    }

    /* ---- PARTIDA (the start, on the ridge above the saddle): gantry with the start lights, the timing hut, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut: plastered white, a flat roof
      box(gh, hx, hy - 0.4, hz, 4.0, 3.1, 2.8, T.hd[i], [0.9, 0.89, 0.85], [0.58, 0.57, 0.54]); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.26, 0.3], null, true);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
      signAt(sStart - 60, -1, 1);   // PORTO NOVO (behind, for the cars coming the other way)
      signAt(sStart - 140, 1, 2);   // CORDA
    }

    /* ---- the checkpoints: a blue gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.12, 0.3, 0.56]));

    /* ---- CHEGADA (low on the slope above Ribeira Grande): chequered gantry, the board of the town, the cars' park with cars, people about; the road
       closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 18, sdP, 3.2), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the board: on posts, leaning back
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.3, 0.3, 0.3]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.3, 0.3, 0.3]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.38, 0.37, 0.35], [0.5, 0.49, 0.46]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 5);
      signAt(sFin + 110, -sdP, 0);   // RIBEIRA GRANDE ahead
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 10; k++) { const a = -12 + (k % 5) * 6, b = (k < 5 ? -4.5 : 4.5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || k === 2 || k === 7) continue;
        parkOn(caCar, caGround, 4.4, scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[k % carCols.length], R, 0.2)); }
      for (let k = 0; k < 8; k++) { const px = padF.x + (R() - 0.5) * 22, pz = padF.z + (R() - 0.5) * 22; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      out.marks.finish = [padF.x, padF.z];
    }

    /* ---- the viewpoints on the saddle (def.views): a level terrace beside the road on either side of the ridge, a low basalt wall round its outer
       half with a whitewashed top, a few people looking out; on the first a board with a picture of the island (no words) ---- */
    {
      const st = [0.38, 0.37, 0.35], top = [0.88, 0.87, 0.83];
      views.forEach((v, kv) => {
        const g = scen.get(v.x, v.z), y = v.h, rx = v.x - T.px[v.i], rz = v.z - T.pz[v.i], rl = Math.hypot(rx, rz) || 1, oa = Math.atan2(rz / rl, rx / rl), rr = v.r;
        const at = (a, r, yy) => [v.x + Math.cos(a) * r, yy, v.z + Math.sin(a) * r];   // the wall: one curve of 16 pieces, its inner face, its outer face down onto the slope, its top
        for (let k = 0; k < 16; k++) { const a = oa - 1.35 + 2.7 * k / 16, b = oa - 1.35 + 2.7 * (k + 1) / 16, am = (a + b) / 2, mx = v.x + Math.cos(am) * rr, mz = v.z + Math.sin(am) * rr; if (vrNear(mx, mz).dd < 1.2) continue;
          const q = 0.9 + 0.16 * rpHash(k, 91 + kv), fc = [st[0] * q, st[1] * q, st[2] * q], inn = at(am, rr, y + 0.1), lo = Math.min(caGround(mx, mz), y) - 1.2;
          g.quadO(at(a, rr - 0.25, y - 0.3), at(b, rr - 0.25, y - 0.3), at(b, rr - 0.25, y + 0.6), at(a, rr - 0.25, y + 0.6), fc, inn);
          g.quadO(at(a, rr + 0.25, lo), at(b, rr + 0.25, lo), at(b, rr + 0.25, y + 0.6), at(a, rr + 0.25, y + 0.6), fc, inn);
          g.quadO(at(a, rr - 0.25, y + 0.6), at(b, rr - 0.25, y + 0.6), at(b, rr + 0.25, y + 0.6), at(a, rr + 0.25, y + 0.6), top, inn); }
        for (let k = 0; k < 3; k++) { const a = oa + (R() - 0.5) * 1.6, d = rr - 1 - R(); const px = v.x + Math.cos(a) * d, pz = v.z + Math.sin(a) * d; if (vrNear(px, pz).dd < 1.5) continue;
          crowdPut(CR, px, y + 0.05, pz, Math.cos(a), Math.sin(a), { col: fans[Math.floor(R() * fans.length)] }, 1); }
        CR.block(v.x, v.z, 2 * rr, 2 * rr, 0);
        if (kv === 0) {   // the board: on two posts at the terrace's edge by the road, facing it
          const fx = -rx / rl, fz = -rz / rl, bx = v.x + fx * (rr - 1.2), bz = v.z + fz * (rr - 1.2), ux = -fz, uz = fx;
          for (const o of [-0.75, 0.75]) box(g, bx + ux * o, y - 0.2, bz + uz * o, 0.1, 1.9, 0.1, -oa, [0.36, 0.26, 0.16]);
          bannerQ(bx, y + 0.75, bz, fx, fz, 1.8, 0.9, 1 - 4 / 8, 1 - 3 / 8, 4 / 8, 6 / 8, ban2, -0.15);
        }
      });
      { const q = T.names.find(n => n.n.startsWith('Delgadim')); if (q) { signAt(sStart + q.d - 70, 1, 6); signAt(sStart + q.d - 30, -1, 3); } }   // DELGADIM, MIRADOURO
    }

    /* ---- the low parapets where the ground falls away and round the outside of the bends (dry basalt masonry, the top whitewashed in blocks
       round the hairpins), a marker post every ~50 m where there is none (knockable where it fits: saProps); chevrons on the outside of each
       hairpin ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)], hp = new Uint8Array(N);
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) { need[sd][k] = 1; hp[k] = 1; } }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), white = [0.9, 0.89, 0.85], stone = [0.4, 0.39, 0.37], back = [0.34, 0.33, 0.31];
      const nearPad = (i) => { for (const p of views) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 4) return true; return false; };
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || nearPad(i) || bk[si][i]) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.15 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          if (nd[i] && nd[i + 1]) {   // the parapet: its face to the road in stones of a shade each, its top (whitewashed in 2 m blocks round the hairpins), the back
            const g = scen.get(T.px[i], T.pz[i]), blk = Math.floor(i * T.ds / 2), q = 0.9 + 0.16 * rpHash(blk, 83 + si), fc = [stone[0] * q, stone[1] * q, stone[2] * q];
            const tc = hp[i] && blk % 2 ? white : [stone[0] * q * 1.2, stone[1] * q * 1.2, stone[2] * q * 1.2];
            const a = Q(i, -0.2), b = Q(i + 1, -0.2), c = Q(i + 1, 0.6), d = Q(i, 0.6);
            const a2 = Q(i, -0.6, 0.5), b2 = Q(i + 1, -0.6, 0.5), c2 = Q(i + 1, 0.6, 0.5), d2 = Q(i, 0.6, 0.5), inn = Q(i, 0.2, 0.25);
            g.quadO(a, b, c, d, fc, inn); g.quadO(a2, b2, c2, d2, back, inn); g.quadO(d, c, c2, d2, tc, inn);
          } else if (!nd[i] && i % 25 === 0 && i > 2 && i < iE - 2 && !bk[si][i]) mkPosts.push([i, side]);
        }
      }
      const kp = saProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.76, 0.12, 0.1], null, true);
      }
      (def.curves || []).forEach(([d, , turn]) => {   // three chevrons on the outside of each hairpin, facing the cars
        const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 6 && sStart + d <= q.i1 * T.ds + 6); if (!c || c.sev < 2) return;
        const out_ = -turn, cell = turn > 0 ? 30 : 31, u0 = (cell % 8) / 8, v1 = 1 - Math.floor(cell / 8) / 8;
        for (const o of [-10, 0, 10]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.9); if (excluded(cx, cz)) continue;
          const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
          bannerQ(cx, Math.max(cy, T.hy[ci]) + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2); CR.avoid(cx, cz, 0.6); }
      });
      { const cv = def.curves || [];   // CURVAS PERIGOSAS before the first hairpin and before the fourth, DEVAGAR at the top before the long way down, SANTO ANTÃO
        if (cv[0]) signAt(sStart + cv[0][0] - 120, 1, 4);
        if (cv[3]) signAt(sStart + cv[3][0] - 140, 1, 4);
        const q = T.names.find(n => n.n.startsWith('Vrh grebena')); if (q) { signAt(sStart + q.d + 60, 1, 5); signAt(sStart + q.d - 50, -1, 7); } }
    }

    /* ---- spectators, few (fewFans): the start and the finish, the checkpoints, the insides of two hairpins, a group on the saddle ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.1, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.1, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 50, sStart + 40, sd, { rows: 2, dens: 0.45, label: 'SA start' }); run(sFin - 50, sFin + 14, sd, { rows: 2, dens: 0.45, label: 'SA finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 16, s0 + 14, side, { rows: 1, dens: 0.4, label: 'SA cp' }); });
      (def.curves || []).forEach(([d, , turn], k) => { if (k !== 1 && k !== 4) return; const sm = sStart + d; run(sm - 14, sm + 14, turn, { rows: 1, dens: 0.4, label: 'SA hairpin ' + (k + 1) }); });
      { const q = T.names.find(n => n.n.startsWith('Delgadim')); if (q) run(sStart + q.d + 14, sStart + q.d + 50, -1, { rows: 1, dens: 0.35, clump: 0.9, label: 'SA saddle' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants (instanced per 96 m chunk): on the grassy slopes tufts of grass near the road, shrubs and agaves; in the shrubland the shrubs,
       agaves and a few acacias; the trees (cypresses, eucalyptus, acacias) where the map has trees; a few by the fields; none on the bare rock ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 3, 4, 5].map(k => new IChunks(saTreeGeo(k), tMatT, 96));
    let nTrees = 0, nShrubs = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(60000 * dens), RT = rng(4841), SP = 4 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(260)) continue;
          const c = vrLC(x, z), p = c === 1 ? 0.35 : c === 2 ? 0.3 : c === 0 ? 0.07 : c === 6 ? 0.035 : c === 3 ? 0.05 : 0.006;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.4) continue; if (nn.i >= 0 && nn.dd < 6 && r2 < 0.3) continue;
          if (excluded(x, z) || pathD(x, z) < 1.2) continue;
          const sl = caSlope(x, z); if (sl > 1.25 || (sl > 0.7 && r2 < (sl - 0.7) / 0.55)) continue;
          const sp = c === 1 ? (r3 < 0.3 ? 0 : r3 < 0.58 ? 1 : r3 < 0.86 ? 2 : 3) : c === 2 ? (r3 < 0.5 ? 3 : r3 < 0.75 ? 4 : r3 < 0.88 ? 2 : 5)
            : c === 0 ? (r3 < 0.62 ? 5 : r3 < 0.8 ? 3 : r3 < 0.95 ? 4 : 2) : c === 6 ? (r3 < 0.5 ? 4 : r3 < 0.8 ? 2 : 1) : (r3 < 0.5 ? 3 : 2);
          if ((sp === 5 && hd > LOD.radius(70)) || (sp === 4 && hd > LOD.radius(140))) continue;
          let hgt, wid, col;
          if (sp === 0) { hgt = 9 + r4 * 7; wid = hgt * 0.9; col = [0.95 + r2 * 0.1, 1, 0.95]; }
          else if (sp === 1) { hgt = 14 + r4 * 10; wid = hgt * 0.95; col = [0.95 + r2 * 0.1, 1, 0.96]; }
          else if (sp === 2) { hgt = 5 + r4 * 3; wid = hgt * 1.15; col = [0.94 + r2 * 0.12, 1, 0.94]; }
          else if (sp === 3) { hgt = 1.0 + r4 * 1.2; wid = 1.0 + r2 * 1.2; col = [0.92 + r3 * 0.16, 0.95 + r4 * 0.1, 0.9]; nShrubs++; }
          else if (sp === 4) { hgt = 0.9 + r4 * 0.7; wid = 1.3 + r2 * 0.8; col = [0.95 + r3 * 0.1, 1, 0.96]; nShrubs++; }
          else { hgt = 0.35 + r4 * 0.35; wid = 0.6 + r2 * 0.5; col = [0.92 + r3 * 0.18, 0.95 + r4 * 0.1, 0.9]; nShrubs++; }
          tk[sp].add(x, caGround(x, z) - 0.1, z, r1 * 70, wid, hgt, col);
          if (++nTrees >= maxT) break grid;
        }
      }
      for (const [x, z] of def.trees || []) { if (excluded(x, z) || vrNear(x, z).dd < 3) continue; tk[2].add(x, caGround(x, z) - 0.1, z, 1.3, 8, 7, [1, 1, 0.95]); nTrees++; }   // (the map's lone tree: an old acacia)
    }
    tk.forEach((t, k) => t.addTo(root, LOD.tier > 0 ? k !== 5 : k < 3));   // (NIZKA: only the trees cast shadows)

    /* ---- the stones and the rock: basalt stones strewn on the grass by the road, blocks at the foot of the cuts, crags of the dark basalt where the
       slope rises steep beside the road, along the map's cliffs and on its bare rock (def.cliffs, def.rocks) ---- */
    {
      const RW = rng(4851), dark = [[0.32, 0.31, 0.3], [0.36, 0.34, 0.32], [0.28, 0.27, 0.27], [0.42, 0.4, 0.37]], tuff = [[0.44, 0.33, 0.28], [0.4, 0.31, 0.27]];
      const rockC = () => (RW() < 0.9 ? dark[Math.floor(RW() * dark.length)] : tuff[Math.floor(RW() * 2)]);
      API.ROCK_SMOOTH = false;
      for (let s = 6; s < T.len - 6; s += 4.2) for (const side of [-1, 1]) {   // stones beside the road
        if (RW() > 0.4) continue; const o = 1.8 + Math.pow(RW(), 1.6) * 34, [x, z] = onSide(s, side, o), sz = 0.18 + RW() * 0.45;
        if (vrNear(x, z).dd < sz + 0.5 || excluded(x, z) || vrLC(x, z) === 6) continue;
        rock(scen.get(x, z), x, caGround(x, z) + sz * 0.2, z, sz * 1.3, sz, sz, RW() * TAU, vary(rockC(), RW, 0.08), RW, 0.35);
      }
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {   // blocks at the foot of the cuts
        if (RW() > 0.32) continue;
        const o = 1.6 + Math.pow(RW(), 1.5) * 30, [x, z] = onSide(s, side, o), sz = 0.5 + RW() * 1.3; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RW() * TAU, vary(rockC(), RW, 0.1), RW, 0.3);
      }
      const crag = (x, z, n, rMax) => { const g = scen.get(x, z), b0 = vary(rockC(), RW, 0.06);
        for (let q = 0; q < n; q++) { const r0 = 1.1 + RW() * rMax, qx = x + (RW() - 0.5) * 10, qz = z + (RW() - 0.5) * 10, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1 || excluded(qx, qz)) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0, r0 * (0.9 + RW() * 0.9), r0 * (0.7 + RW() * 0.4), RW() * TAU, vary(b0, RW, 0.07), RW, 0.35); } };
      for (let s = 16; s < T.len - 16; s += 12) for (const side of [-1, 1]) {   // crags where the slope is steep
        if (RW() < 0.6) continue;
        const [x, z] = onSide(s, side, 12 + RW() * 120); if (excluded(x, z) || vrNear(x, z).dd < 10 || vrDist(x, z) > LOD.cap(110)) continue;
        if (caSlope(x, z) < 1.0) continue;
        crag(x, z, 1 + Math.floor(RW() * 3), 2.6);
      }
      for (const p of def.cliffs || []) for (let k = 0; k + 3 < p.length; k += 2) {   // the map's cliffs: crags along them, every ~12 m
        const ax = p[k], az = p[k + 1], bx = p[k + 2], bz = p[k + 3], L = Math.hypot(bx - ax, bz - az);
        for (let t = 0; t < L; t += 12) { const x = ax + (bx - ax) * t / L, z = az + (bz - az) * t / L; if (vrDist(x, z) > LOD.cap(130) || vrNear(x, z).dd < 8) continue; crag(x, z, 2, 2.4); }
      }
      for (const p of def.rocks || []) {   // the map's bare rock: crags inside its outlines, on a 14 m grid
        let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let k = 0; k < p.length; k += 2) { x0 = Math.min(x0, p[k]); x1 = Math.max(x1, p[k]); z0 = Math.min(z0, p[k + 1]); z1 = Math.max(z1, p[k + 1]); }
        const inside = (x, z) => { let c = false; for (let a = 0, b = p.length - 2; a < p.length; b = a, a += 2) { const ya = p[a + 1], yb = p[b + 1]; if ((ya > z) !== (yb > z) && x < (p[b] - p[a]) * (z - ya) / (yb - ya) + p[a]) c = !c; } return c; };
        for (let z = z0 + 7; z < z1; z += 14) for (let x = x0 + 7; x < x1; x += 14) { if (!inside(x, z) || RW() < 0.65 || vrDist(x, z) > LOD.cap(130) || vrNear(x, z).dd < 8) continue; crag(x, z, 1 + Math.floor(RW() * 2), 2.4); }
      }
    }

    /* ---- the view beyond the corridor (def.farDem: the island's ridges and valleys, the sea all round: def.far.lake; irFar, World.update moves it with
       the camera); finish the meshes ---- */
    const FAR = API.irFar ? API.irFar(saFarCol) : null; if (FAR) { FAR.mesh.visible = false; root.add(FAR.mesh); out.dyn.irFar = FAR; }   // (hidden until the first World.update)
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: saAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: saAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, shrubs: nShrubs, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), walls: nWall, views: views.length, far: !!FAR };   // (read by the tests)
    return out;
  }

  World.keep('VR', 'santoantao');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.santoantao = (scene, tex, opts) => buildSantoAntao(scene, tex, opts);
})();
