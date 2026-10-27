/* =========================================================================
   WORLD — Beartooth (theme 'beartooth'): its own builder (World.ext.beartooth), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
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

  /* ================= BEARTOOTH (theme 'beartooth') =================
     The Beartooth Highway (US 212, Montana): its switchbacks above the Rock Creek valley, from the long leg above the valley (~2630 m) up five
     hairpins past the Rock Creek Vista to the top of the switchbacks (~2850 m), on a clear summer afternoon in the northern Rockies: a forest of
     Engelmann spruce, subalpine fir and lodgepole pine low down, thinning out higher up into stunted spruce and whitebark pine (and the silver snags
     of the dead ones), the alpine tundra above it (short grass, mats of moss campion and other low flowers), grey and pink granite in slabs,
     crags and boulders, the snow of the last winter lying late on the shady north and east slopes and in the drifts by the road. Built on
     Vršič's corridor (vrPrep and the terrain helpers read the same forms: def.dem, def.lc, def.bld) and Los Caracoles' terrain blend (caH,
     caGround: the hairpins' legs blend into each other), with a look of its own: the ground colours and the summer snow (btCol, btSnow), the
     trees and plants, tall snow poles along both edges, yellow warning signs before the hairpins, the car park at the Rock Creek Vista with the
     walk out to the viewpoint, the pull-outs by the road (def.pulls), mountain goats on the rocks and marmots on the boulders. No names of firms,
     no agency's badge: the signs are generic. */
  const BTCOL = [0, 0, 0], BT_SNC = [1.02, 1.04, 1.08];
  function btSnow(x, z, A, ny, sz, sx) {   // how much of the late summer snow lies at (x, z) (A: metres above the sea, ny / sz / sx: the ground's up, south and east
    // components): from ~2700 m on the shady north- and east-facing slopes (the northern hemisphere: the faces looking north have sz < 0), higher on the
    // sunny ones, in patches and in the hollows below the crests, off the steepest faces; and the snowfields WorldCover maps (lc 6)
    const P = API.VR, face = clamp(-sz * 2.2 - (sx || 0) * 0.8, -1, 1), line = 2905 - 190 * face + (P.c4(x, z) - 0.5) * 200;
    const k = sstep(line, line + 90, A) * sstep(0.45, 0.72, ny) * sstep(0.5, 0.7, P.c5(x, z) + 0.25 * sstep(line, line + 300, A));
    return Math.max(k, vrLCf(x, z, 6) * sstep(0.32, 0.6, ny));
  }
  function btCol(x, z, h, ny, sz, dd, sx) {   // ground colour (times the grey grit map): the alpine tundra in olive and fresh green with straw patches
    // (lc 0), the forest floor of needles and moss under the trees (lc 1), willow scrub (lc 2), the granite (lc 4 and every steep face) grey with a
    // pink cast and dark lichen, the late snow, a gravel verge by the road
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), f = P.n4(x, z);
    const fo = vrLCf(x, z, 1), sh = vrLCf(x, z, 2), rk = vrLCf(x, z, 4);
    let R = 0.4, G = 0.47, B = 0.26;   // the tundra
    const dry = sstep(0.55, 0.82, m) * 0.7, lush = sstep(0.6, 0.85, q) * (1 - dry);
    R = lerp(R, 0.6, dry); G = lerp(G, 0.56, dry); B = lerp(B, 0.34, dry);
    R = lerp(R, 0.33, lush); G = lerp(G, 0.47, lush); B = lerp(B, 0.21, lush);
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.08; B += (f - 0.5) * 0.06;
    R = lerp(R, 0.27, fo * 0.85); G = lerp(G, 0.29, fo * 0.85); B = lerp(B, 0.19, fo * 0.85);   // needles and moss
    R = lerp(R, 0.36, sh * 0.6); G = lerp(G, 0.41, sh * 0.6); B = lerp(B, 0.24, sh * 0.6);
    const st = Math.max(sstep(0.8, 0.55, ny), rk * (0.55 + 0.45 * sstep(0.35, 0.65, P.n3(x, z))));   // granite: the steep faces and the rock WorldCover maps
    if (st > 0) { const pink = sstep(0.45, 0.75, P.c3(x, z)), lich = sstep(0.55, 0.8, P.n2(x * 1.7, z * 1.7)) * 0.5, band = 0.9 + 0.1 * Math.sin(A / 5.5 + P.c2(x * 0.4, z * 0.4) * 6);
      const gr = [lerp(0.6, 0.66, pink) * band, lerp(0.59, 0.58, pink) * band, lerp(0.57, 0.55, pink) * band];
      R = lerp(R, lerp(gr[0], 0.36, lich), st); G = lerp(G, lerp(gr[1], 0.36, lich), st); B = lerp(B, lerp(gr[2], 0.33, lich), st); }
    const sn = btSnow(x, z, A, ny, sz, sx); R = lerp(R, BT_SNC[0], sn); G = lerp(G, BT_SNC[1], sn); B = lerp(B, BT_SNC[2], sn);
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.5 * (1 - sn); R = lerp(R, 0.58, t); G = lerp(G, 0.56, t); B = lerp(B, 0.52, t); }
    BTCOL[0] = R; BTCOL[1] = G; BTCOL[2] = B; return BTCOL;
  }
  function btGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in btTileGeo)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = btCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, nz / l, G.dd[jj * G.nx + ii], nx / l);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function btTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells, in the haze); wider round the vista (the view down into the valley)
    const G = API.VR.G, L = VRC * VRT, x = G.x0 + (ti + 0.5) * L, z = G.z0 + (tj + 0.5) * L, d = vrDist(x, z), v = API.VR.vista, dv = v ? Math.hypot(x - v[0], z - v[1]) : 1e9;
    return d < 300 || dv < 200 ? 1 : d < 440 || dv < 650 ? 2 : 0;
  }
  function btTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by btCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = btCol(x, z, h, ny, nz, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)], nx); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? btTileOn(a, b) : 0);
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
  let btATex = null, btAKey = '', btA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function btAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the summit board, the race's banner
    const key = cps.join('|') + '|' + finA; if (btATex && btAKey === key) return btATex;
    if (btATex) btATex.dispose(); btAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(292, 142, 440, 100); txt('FINISH', 512, 196, 92, '#111', 420);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#2b5d34'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#5b3b20'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f1e6cc'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('BEARTOOTH MOUNTAINS', 512, 812, 56, '#f3ead6', 900); txt(finA, 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#f2f2ee'; x.fillRect(0, 896, 1024, 64); x.fillStyle = '#2b5d34'; x.fillRect(0, 960, 1024, 64);
    txt('BEARTOOTH SWITCHBACKS', 512, 930, 54, '#16181c', 960); txt('5 HAIRPINS · ROCK CREEK', 512, 994, 44, '#fff', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (btATex = t);
  }
  const BT_BOARDS = [['BEARTOOTH PASS', '#1f5e3a'], ['RED LODGE', '#1f5e3a'], ['ROCK CREEK VISTA', '#5b3b20'], ['SCENIC VIEW', '#5b3b20'], ['WATCH FOR ROCKS', '#f1c21b'], ['ELEV 9000 FT', '#1f5e3a'], ['SWITCHBACKS', '#f1c21b'], ['WYOMING  →', '#1f5e3a']];
  function btAtlas2() {   // the small signs: row 0, the hairpin warning (a yellow diamond with the bent arrow, both ways) and the advisory speed; rows 1-2, the numbers of
    // the hairpins on a small yellow plate (the game's numbering); the chevrons; rows 4-7, the road's boards (two a row, 512 x 128)
    if (btA2Tex) return btA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (const [k, dir] of [[0, 1], [1, -1]]) {   // the diamond with a hairpin arrow: up, round and back down, the head pointing the way back
      const x0 = k * 128, y0 = 0; x.fillStyle = '#16181c'; x.beginPath(); x.moveTo(x0 + 64, y0 + 2); x.lineTo(x0 + 126, y0 + 64); x.lineTo(x0 + 64, y0 + 126); x.lineTo(x0 + 2, y0 + 64); x.fill();
      x.fillStyle = '#f1c21b'; x.beginPath(); x.moveTo(x0 + 64, y0 + 8); x.lineTo(x0 + 120, y0 + 64); x.lineTo(x0 + 64, y0 + 120); x.lineTo(x0 + 8, y0 + 64); x.fill();
      x.strokeStyle = '#16181c'; x.lineWidth = 9; x.lineCap = 'butt'; x.beginPath(); const a = x0 + 64 - 16 * dir, b = x0 + 64 + 16 * dir;
      x.moveTo(a, y0 + 96); x.lineTo(a, y0 + 56); x.arc(x0 + 64, y0 + 56, 16, Math.PI, 0, dir < 0); x.lineTo(b, y0 + 84); x.stroke();
      x.fillStyle = '#16181c'; x.beginPath(); x.moveTo(b - 12, y0 + 80); x.lineTo(b + 12, y0 + 80); x.lineTo(b, y0 + 98); x.fill(); }
    { const x0 = 256; x.fillStyle = '#16181c'; x.fillRect(x0, 0, 128, 128); x.fillStyle = '#f1c21b'; x.fillRect(x0 + 6, 6, 116, 116); txt('15', x0 + 64, 52, 54, '#16181c', 110); txt('MPH', x0 + 64, 100, 30, '#16181c', 110); }   // the advisory speed
    for (let k = 0; k < 8; k++) { const x0 = (k % 8) * 128, y0 = 128; x.fillStyle = '#16181c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f1c21b'; x.fillRect(x0 + 6, y0 + 6, 116, 116); txt(String(k + 1), x0 + 64, y0 + 68, 84, '#16181c', 110); }
    for (const [k, dir] of [[30, 1], [31, -1]]) {   // the chevrons: black arrows on yellow, pointing the way the road turns
      const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128; x.fillStyle = '#f1c21b'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#16181c';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    BT_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, warn = bg === '#f1c21b';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = warn ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, 54, warn ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (btA2Tex = t);
  }
  function btTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them): 0 Engelmann spruce or subalpine fir (a narrow dark spire, its tiers
    // to the ground), 1 lodgepole pine (a tall bare trunk, a short ragged crown at the top), 2 whitebark pine (a forked, spreading crown), 3 the silver snag
    // of a dead whitebark pine, 4 krummholz (spruce and fir at the treeline, a low, wind-cropped mat with a flag of branches on the lee side)
    const g = new GB(), R = rng(940 + kind), rs = API.ROCK_SMOOTH;
    if (kind === 0) {
      const col = [0.08, 0.16, 0.12], tip = [0.15, 0.27, 0.2];
      [[0.0, 0.22, 0.3, 0.05], [0.18, 0.19, 0.27, 0.045], [0.36, 0.16, 0.24, 0.04], [0.52, 0.12, 0.22, 0.035], [0.67, 0.085, 0.2, 0.03]].forEach(([y, r, h, dr], k) => {
        const kk = k % 2 ? 1.1 : 1; starCone(g, 0, y, 0, r, h, 5, [col[0] * kk, col[1] * kk, col[2] * kk], tip, k * 0.7, dr); });
      cone(g, 0, 0.84, 0, 0.04, 0.16, 4, col, tip, 0.4);
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.022, 0.64, 4, [0.4, 0.3, 0.22], null, 0.015);
      API.ROCK_SMOOTH = true; const c = [0.13, 0.24, 0.12];
      ico(g, 0, 0.78, 0, 0.13, 1.5, c, R, 0.35); ico(g, 0.06, 0.66, 0.04, 0.1, 1.2, vary(c, R, 0.1), R, 0.35); ico(g, -0.05, 0.9, -0.03, 0.08, 1.2, vary(c, R, 0.1), R, 0.3);
    } else if (kind === 2) {
      cyl(g, 0, -0.02, 0, 0.04, 0.3, 4, [0.55, 0.52, 0.46], null, 0.03);
      ouRod(g, [0, 0.26, 0], [0.18, 0.62, 0.05], 0.025, [0.55, 0.52, 0.46], 4); ouRod(g, [0, 0.26, 0], [-0.15, 0.58, -0.06], 0.025, [0.55, 0.52, 0.46], 4);
      API.ROCK_SMOOTH = true; const c = [0.17, 0.27, 0.13];
      ico(g, 0.18, 0.72, 0.05, 0.2, 0.7, c, R, 0.35); ico(g, -0.16, 0.68, -0.06, 0.2, 0.7, vary(c, R, 0.12), R, 0.35); ico(g, 0, 0.84, 0, 0.17, 0.75, vary(c, R, 0.12), R, 0.3);
    } else if (kind === 3) {
      const s = [0.74, 0.72, 0.68];
      cyl(g, 0, -0.02, 0, 0.035, 0.95, 4, s, null, 0.012);
      ouRod(g, [0, 0.45, 0], [0.2, 0.68, 0.04], 0.015, s, 3); ouRod(g, [0, 0.6, 0], [-0.17, 0.8, -0.05], 0.013, s, 3); ouRod(g, [0, 0.3, 0], [-0.12, 0.42, 0.1], 0.012, s, 3);
    } else {
      API.ROCK_SMOOTH = true; const col = [0.1, 0.19, 0.12];
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R() * 0.5, d = k ? 0.3 : 0; ico(g, Math.cos(a) * d + 0.1, 0.38 - d * 0.4, Math.sin(a) * d, 0.3, 0.75, vary(col, R, 0.2), R, 0.35); }
      API.ROCK_SMOOTH = false; cone(g, -0.12, 0.3, 0, 0.12, 0.75, 4, col, [0.16, 0.26, 0.17], 0.3);   // (the flag: one stem standing out of the mat)
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function btPlantGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 a tuft of alpine grass and sedge, 1 a cushion of flowers
    // (white, the instances tint it: pink moss campion, yellow cinquefoil, blue forget-me-not, white phlox), 2 a granite boulder, 3 a few stones
    const g = new GB(), R = rng(960 + kind), rs = API.ROCK_SMOOTH;
    if (kind === 0) {   // nine short blades from a tight base, fresh green with olive tips
      const base = [0.3, 0.42, 0.18], tip = [0.62, 0.68, 0.36];
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + R() * 0.6, lean = 0.16 + R() * 0.2, hh = 0.7 + R() * 0.3, bx = Math.cos(a) * 0.05, bz = Math.sin(a) * 0.05, tx = Math.cos(a) * lean, tz = Math.sin(a) * lean, ox = -Math.sin(a) * 0.06, oz = Math.cos(a) * 0.06;
        g.triO([bx - ox, 0, bz - oz], [bx + ox, 0, bz + oz], [tx, hh, tz], base, [tx * 0.5, hh * 0.2, tz * 0.5], base, tip); g.triO([bx - ox, 0, bz - oz], [tx, hh, tz], [bx + ox, 0, bz + oz], base, [-tx, hh * 0.4, -tz], tip, base); }
    } else if (kind === 1) {   // a low green mound dotted with flowers (pale: the instance colour is the flowers')
      API.ROCK_SMOOTH = true; ico(g, 0, 0.18, 0, 0.5, 0.45, [0.3, 0.42, 0.2], R, 0.2);
      for (let k = 0; k < 9; k++) { const a = R() * TAU, d = Math.sqrt(R()) * 0.42, y = 0.2 + (0.45 - d) * 0.5; ico(g, Math.cos(a) * d, y, Math.sin(a) * d, 0.09, 0.6, [0.98, 0.98, 0.98], R, 0.1); }
    } else if (kind === 2) { API.ROCK_SMOOTH = false; rock(g, 0, 0.3, 0, 0.6, 0.55, 0.5, 0, [0.64, 0.61, 0.59], R, 0.28); }
    else {   // three stones half sunk in the ground
      for (let k = 0; k < 3; k++) { API.ROCK_SMOOTH = false; const a = R() * TAU, d = k ? 0.25 + R() * 0.25 : 0, r = k ? 0.1 + R() * 0.08 : 0.17; rock(g, Math.cos(a) * d, r * 0.2, Math.sin(a) * d, r, r * 0.7, r * 0.9, R() * TAU, [0.62, 0.6, 0.58], R, 0.3); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // a mountain goat (x forward, ~1.5 m long): the shaggy white coat, the beard and the high shoulders, black horns and hooves; a kid: scaled down
  function btGoat(g, x, y, z, rot, k) {
    const c = Math.cos(rot), s = Math.sin(rot), at = (u, v, h) => [x + (c * u - s * v) * k, y + h * k, z + (s * u + c * v) * k], W = [0.93, 0.92, 0.86], K = [0.08, 0.08, 0.09], R = rng(977 + Math.round(x));
    const rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    { const p = at(0, 0, 0.95); ico(g, p[0], p[1], p[2], 0.55 * k, 0.75, W, R, 0.12); }   // the body
    { const p = at(0.32, 0, 1.12); ico(g, p[0], p[1], p[2], 0.38 * k, 1.0, W, R, 0.15); }   // the shoulders' hump
    { const p = at(0.78, 0, 1.15); box(g, p[0], p[1], p[2], 0.38 * k, 0.28 * k, 0.22 * k, rot, W); const b = at(0.86, 0, 0.98); box(g, b[0], b[1], b[2], 0.14 * k, 0.24 * k, 0.12 * k, rot, W); }   // the head, the beard
    API.ROCK_SMOOTH = rs;
    for (const v of [-0.05, 0.05]) ouRod(g, at(0.72, v, 1.28), at(0.62, v, 1.5), 0.025 * k, K, 4);   // the horns
    for (const [u, v] of [[0.38, -0.14], [0.38, 0.14], [-0.36, -0.14], [-0.36, 0.14]]) { ouRod(g, at(u, v, 0.75), at(u, v, 0.1), 0.06 * k, W, 4); ouRod(g, at(u, v, 0.1), at(u, v, 0), 0.05 * k, K, 4); }
  }
  // a yellow-bellied marmot sitting up on a boulder (~0.5 m): the brown-grey body, the pale belly, a dark face
  function btMarmot(g, x, y, z, rot) {
    const rs = API.ROCK_SMOOTH, R = rng(983 + Math.round(z)); API.ROCK_SMOOTH = true;
    ico(g, x, y + 0.2, z, 0.17, 1.3, [0.46, 0.38, 0.28], R, 0.1); ico(g, x + Math.cos(rot) * 0.05, y + 0.18, z + Math.sin(rot) * 0.05, 0.12, 1.4, [0.78, 0.62, 0.36], R, 0.1);
    ico(g, x + Math.cos(rot) * 0.03, y + 0.46, z + Math.sin(rot) * 0.03, 0.09, 1.0, [0.32, 0.27, 0.22], R, 0.1);
    API.ROCK_SMOOTH = rs;
  }
  function buildBeartooth(scene, tex, opts) {
    const R = rng(3911), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.7, 0.67, 0.6] };
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(911, 140); P.c2 = valueNoise2(912, 60); P.c3 = valueNoise2(913, 190); P.c4 = valueNoise2(914, 110); P.c5 = valueNoise2(915, 24);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]]; P.vista = def.vista || null;
    const altAt = (i) => T.hy[i] + base;
    // the buildings (def.bld: the restrooms at the vista's car park), clear of the road
    const blds = [];
    for (const b of def.bld || []) { const [x, z, L, W, ang] = b; if (L < 2.5 || W < 2.5) continue; const n = vrNear(x, z); if (n.i >= 0 && n.dd < 1.5) continue; blds.push({ x, z, L, W, ang }); }
    // the pull-outs and car parks by the road (def.pulls [x, z, radius, distance]: OpenStreetMap): a level gravel plot at the road's height; the vista's
    // (the biggest near the viewpoint) gets the parked cars, the restrooms and the walk out to the viewpoint
    const pulls = [];
    for (const [x, z, r] of def.pulls || []) { const n = vrNear(x, z); if (n.i < 0) continue; const i = n.i, s = i * T.ds; if (s < 30 || s > T.len - 30) continue;
      const pad = { x, z, r: Math.max(5, Math.min(r, 22)), b: 12, h: T.hy[i] - 0.25, i }; P.pads.push(pad); pulls.push(pad); }
    const vPad = P.vista ? pulls.reduce((a, p) => (!a || Math.hypot(p.x - P.vista[0], p.z - P.vista[1]) < Math.hypot(a.x - P.vista[0], a.z - P.vista[1]) ? p : a), null) : null;
    const padBeside = (s, off, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * (off + r), T.pz[i] + T.nz[i] * sd * (off + r)) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 16, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 60, 0, 15); P.pads.push(padF);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the boulders and trees between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the boulders, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    for (const p of pulls) exclPush(p.x, p.z, p.r + 2);
    exclPush(padF.x, padF.z, padF.r + 4);
    out.marks = {};   // (where the landmarks stand: the tests look for them)
    if (P.vista) out.marks['Rock Creek Vista'] = P.vista.slice();

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = btTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(btTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the road: asphalt with white edge lines and a double yellow centre line (no passing on the switchbacks), a gravel shoulder, then the verge out
       to a ditch past the barrier line, up or down onto the ground (120 m chunks, culled); where the ground drops away below the barrier a masonry
       retaining wall (as on the real road, built in the 1930s) ---- */
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
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.84 - 0.13 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], ylw = [0.96, 0.76, 0.16], gc = [0.74, 0.71, 0.66];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          const wl = vp[si][i][2][1] < -2.6; if (wl && (k === 1 || k === 2)) { const q = 0.9 + 0.14 * rpHash(i >> 1, 43 + si); return k === 1 ? [0.66 * q, 0.62 * q, 0.6 * q] : [0.5 * q, 0.47 * q, 0.45 * q]; }   // (the wall's granite coping, its face)
          if (k === 4) return btGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return btCol(x, z, T.hy[i] + y, 1 / l, 0, Math.max(0, o - bar), 0).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const [o0, o1] of [[-(w - 0.3), -(w - 0.45)], [w - 0.45, w - 0.3]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          for (const [o0, o1] of [[-0.21, -0.09], [0.09, 0.21]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [ylw, ylw, ylw, ylw]);
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
    const fans = [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.14, 0.26, 0.6], [0.2, 0.5, 0.32], [0.95, 0.72, 0.16], [0.46, 0.66, 0.86], [0.55, 0.32, 0.2], [0.12, 0.14, 0.2], [0.9, 0.45, 0.14], [0.6, 0.62, 0.64]];   // (hikers' jackets and fleeces)
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a road board of the second atlas: [v0, v1, u0, u1]
    const cell = (k) => { const u0 = (k % 8) / 8, v1 = 1 - Math.floor(k / 8) / 8; return [v1 - 1 / 8, v1, u0, u0 + 1 / 8]; };   // a small sign of the second atlas
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const signPost = (s, side, extra, k, W, H, tall) => {   // a sign of the second atlas on a steel post beside the road, facing the cars coming up
      const [px, pz, ii] = onSide(s, side, extra); if (excluded(px, pz)) return null; const py = caGround(px, pz), g = scen.get(px, pz), c = k < 32 ? cell(k) : board(k - 32);
      box(g, px, py - 0.2, pz, 0.08, (tall || 2.1) + 0.2, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
      bannerQ(px, py + (tall || 2.1) - H * 0.4, pz, -T.tx[ii], -T.tz[ii], W, H, c[0], c[1], c[2], c[3], ban2); exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); return [px, py, pz, ii];
    };
    const carCols = [[0.85, 0.85, 0.83], [0.62, 0.12, 0.1], [0.14, 0.26, 0.5], [0.16, 0.16, 0.18], [0.5, 0.52, 0.55], [0.24, 0.36, 0.26], [0.76, 0.66, 0.5]];
    const camper = (g, x, y, z, rot, col) => {   // a camper van (a motorhome, 7 m): the cab, the box over it, a window band, the wheels
      const c = Math.cos(rot), s = Math.sin(rot);
      box(g, x, y + 0.45, z, 7.0, 2.6, 2.4, rot, [0.94, 0.93, 0.9], null, true); box(g, x + c * 3.0, y + 0.35, z + s * 3.0, 1.4, 1.5, 2.3, rot, col, null, true);
      box(g, x - c * 0.4, y + 2.0, z - s * 0.4, 5.6, 0.25, 2.42, rot, col, null, true); box(g, x + c * 3.65, y + 1.15, z + s * 3.65, 0.08, 0.7, 2.0, rot, [0.14, 0.18, 0.22], null, true);
      for (const [a, b] of [[2.6, 1.05], [2.6, -1.05], [-2.2, 1.05], [-2.2, -1.05]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.8, 0.8, 0.3, rot, [0.08, 0.08, 0.09], null, true);
    };
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the restrooms at the vista: a low block of stone and timber under a metal roof ---- */
    let nBld = 0;
    for (const b of blds) { const g = scen.get(b.x, b.z), y = caGround(b.x, b.z);
      box(g, b.x, y - 0.6, b.z, b.L, 3.2, b.W, b.ang, [0.56, 0.52, 0.48], null, true); box(g, b.x, y + 1.6, b.z, b.L + 0.05, 1.0, b.W + 0.05, b.ang, [0.44, 0.3, 0.18], null, true);
      gable(g, b.x, y + 2.6, b.z, b.L + 0.9, b.W + 0.9, b.W * 0.22, b.ang, [0.34, 0.36, 0.34], [0.44, 0.3, 0.18]); CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++; }

    /* ---- START (on the long leg above the valley): gantry with the start lights, the timing hut, pennants along the grid, the road closed behind it ---- */
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
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete barriers across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }

    /* ---- the checkpoints: a green gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.17, 0.36, 0.2]));

    /* ---- FINISH (the top of the switchbacks): chequered gantry and flags, the summit board, the green board to the pass, the car park with cars and
       campers, the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4), py = caGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 18, sdP, 3.2), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the summit board: a timber board on posts leaning back, on a granite plinth
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.36, 0.24, 0.14]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.62, 0.58, 0.56], [0.68, 0.64, 0.62]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 5);
      { const [bx, bz, bi] = onSide(sFin + 110, -sdP, 1.5), by = caGround(bx, bz), gb = scen.get(bx, bz);   // the green board: the pass and Wyoming ahead
        for (const o of [-1.5, 1.5]) box(gb, bx + T.nx[bi] * o, by - 0.2, bz + T.nz[bi] * o, 0.12, 3.6, 0.12, T.hd[bi], [0.6, 0.61, 0.63]);
        for (const [k, yy] of [[0, 2.9], [7, 2.1]]) { const [v0, v1, u0, u1] = board(k); bannerQ(bx, by + yy, bz, -T.tx[bi], -T.tz[bi], 3.6, 0.9, v0, v1, u0, u1, ban2); }
        exclPush(bx, bz, 2.5); }
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh), RC = rng(3941);
      for (let k = 0; k < 10; k++) { const a = -14 + (k % 5) * 7, b = (k < 5 ? -5 : 5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5) continue;
        if (k === 2 || k === 7) camper(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, carCols[Math.floor(RC() * carCols.length)]);
        else if (k !== 4) caCar(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[Math.floor(RC() * carCols.length)], R, 0.15)); }
      for (let k = 0; k < 18; k++) { const px = padF.x + (R() - 0.5) * 26, pz = padF.z + (R() - 0.5) * 26; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road towards the pass: concrete barriers across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
    }

    /* ---- the Rock Creek Vista: the car park (cars and campers, visitors), the restrooms (above), a low granite wall round its edge and the paved walk out
       along the ridge to the viewpoint, with its railing and a few people looking down into the valley; the brown board at the turn-off ---- */
    if (vPad) {
      const RC = rng(3951), i = vPad.i, hh = T.hd[i], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 9; k++) { const a = -12 + (k % 5) * 6, b = (k < 5 ? -1 : 1) * 5, px = vPad.x - sn * b + c * a, pz = vPad.z + c * b + sn * a;
        if (vrNear(px, pz).dd < 1.5 || excluded(px, pz) && Math.hypot(px - vPad.x, pz - vPad.z) > vPad.r) continue;
        if (k % 4 === 1) camper(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, carCols[Math.floor(RC() * carCols.length)]);
        else caCar(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[Math.floor(RC() * carCols.length)], RC, 0.15)); }
      for (let k = 0; k < 10; k++) { const px = vPad.x + (RC() - 0.5) * vPad.r * 1.6, pz = vPad.z + (RC() - 0.5) * vPad.r * 1.6; if (vrNear(px, pz).dd < 1.2) continue; person(px, pz, RC() * TAU); }
      const v = P.vista, dx = v[0] - vPad.x, dz = v[1] - vPad.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, stone = [0.62, 0.58, 0.55];
      for (let t = vPad.r; t < L; t += 3) { const x = vPad.x + ux * t, z = vPad.z + uz * t; if (vrDist(x, z) > 600) break;   // the walk: a paved strip, kerbs of granite
        const y = caGround(x, z), g = scen.get(x, z); g.quadUp([x - uz * 1.1, y + 0.06, z + ux * 1.1], [x + uz * 1.1, y + 0.06, z - ux * 1.1], [x + uz * 1.1 + ux * 3, caGround(x + ux * 3, z + uz * 3) + 0.06, z - ux * 1.1 + uz * 3], [x - uz * 1.1 + ux * 3, caGround(x + ux * 3, z + uz * 3) + 0.06, z + ux * 1.1 + uz * 3], [[0.6, 0.59, 0.56], [0.6, 0.59, 0.56], [0.6, 0.59, 0.56], [0.6, 0.59, 0.56]]);
        exclPush(x, z, 2.2); if (RC() < 0.12) person(x + uz * (RC() < 0.5 ? 0.6 : -0.6), z - ux * 0.6, Math.atan2(uz, ux) - PI / 2 + (RC() < 0.5 ? 0 : PI)); }
      if (vrDist(v[0], v[1]) < 600) { const y = caGround(v[0], v[1]), g = scen.get(v[0], v[1]);   // the viewpoint: a round granite platform, a railing, the people at it
        cyl(g, v[0], y - 0.6, v[1], 5, 0.75, 12, stone, [0.6, 0.59, 0.56]);
        for (let a = 0; a < 12; a++) { if (a === Math.round(((Math.atan2(-uz, -ux) / TAU) * 12 + 12)) % 12) continue; const a0 = a / 12 * TAU, a1 = (a + 1) / 12 * TAU;
          ouRod(g, [v[0] + Math.cos(a0) * 4.8, y + 1.15, v[1] + Math.sin(a0) * 4.8], [v[0] + Math.cos(a1) * 4.8, y + 1.15, v[1] + Math.sin(a1) * 4.8], 0.04, [0.3, 0.3, 0.32], 4);
          ouRod(g, [v[0] + Math.cos(a0) * 4.8, y + 0.1, v[1] + Math.sin(a0) * 4.8], [v[0] + Math.cos(a0) * 4.8, y + 1.15, v[1] + Math.sin(a0) * 4.8], 0.04, [0.3, 0.3, 0.32], 4); }
        exclPush(v[0], v[1], 6.5); for (let k = 0; k < 6; k++) { const a = RC() * TAU, r = 2 + RC() * 2.2; person(v[0] + Math.cos(a) * r, v[1] + Math.sin(a) * r, a + PI / 2); } }
      const q = T.names.find(n => /Rock Creek Vista/.test(n.n)); if (q) { signPost(sStart + q.d - 160, 1, 1.4, 32 + 2, 3.4, 0.85, 2.6); signPost(sStart + q.d - 140, 1, 1.4, 32 + 3, 3.4, 0.85, 2.6); }
    }

    /* ---- guardrails where the ground falls away and round the outside of the bends, chevrons on the outside of every hairpin; the tall snow poles along both
       edges (orange and black, to find the road's edge in the spring when it is cleared through the drifts), knockable where they fit ---- */
    let nRail = 0, nPole = 0;
    {
      const need = [new Uint8Array(N), new Uint8Array(N)], poleSpots = [];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), steel = [0.8, 0.82, 0.84], steelB = [0.56, 0.58, 0.6], postC = [0.42, 0.32, 0.22];   // (timber posts, as on the scenic roads)
      const near = (i) => { for (const p of pulls) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 6) return true; return false; };
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || near(i)) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (nd[i] && nd[i + 1]) {   // W-beam: a front and a back face, a post every 4 m
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.16, 1.13, 0.16, T.hd[i], postC, null, true); }
          }
          if (i % 22 === (side > 0 ? 0 : 11) && i > 4 && i < iE - 4 && !near(i)) poleSpots.push([i, side]);
        }
      }
      out.propR = 150; out.propFloor = propFloorTable(null, (i, side) => vp[side > 0 ? 1 : 0][i]);
      const sA = sStart + 30, sB = sFin - 30;
      const kp = (out.propStats = roadsideProps(out.props, { spots: poleSpots, postEdge: [1.2, 1.6], postCol: () => 1, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
        floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } })).spots;
      const poleO = [0.95, 0.4, 0.08], poleK = [0.09, 0.09, 0.1];
      for (const sp of poleSpots) { if (kp.has(sp)) continue;   // the rest drawn here: a tall pole in orange and black bands
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y0 = Math.min(T.hy[i], caGround(x, z)) - 0.15, g = scen.get(x, z), H = 3.4;
        for (let b = 0; b < 6; b++) box(g, x, y0 + H * b / 6, z, 0.07, H / 6, 0.07, T.hd[i], b === 5 || b === 3 ? poleK : poleO, null, true);
        nPole++; }
    }

    /* ---- the hairpins' signs: 120 m before each a yellow diamond with the bent arrow, the advisory speed and the hairpin's number (the game's) under it; three
       chevrons on the outside of each hairpin, facing the cars coming into it; a few boards up the road ---- */
    (def.curves || []).forEach(([d, , turn], k) => {
      const s0 = sStart + d - 120, r = signPost(s0, 1, 0.9, turn > 0 ? 0 : 1, 0.95, 0.95, 2.4);
      if (r) { const [px, py, pz, ii] = r, c1 = cell(2), c2 = cell(8 + k);
        bannerQ(px, py + 0.95, pz, -T.tx[ii], -T.tz[ii], 0.62, 0.62, c1[0], c1[1], c1[2], c1[3], ban2); bannerQ(px, py + 0.25, pz, -T.tx[ii], -T.tz[ii], 0.55, 0.55, c2[0], c2[1], c2[2], c2[3], ban2); }
      const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 6 && sStart + d <= q.i1 * T.ds + 6); if (!c || c.sev < 2) return;
      const out_ = -turn, ck = turn > 0 ? 30 : 31, cc = cell(ck);
      for (const o of [-14, 0, 14]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.7); if (excluded(cx, cz)) continue;
        const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
        box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
        bannerQ(cx, cy + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, cc[0], cc[1], cc[2], cc[3], ban2); CR.avoid(cx, cz, 0.6); }
    });
    signPost(sStart + 220, 1, 1.4, 32 + 6, 3.0, 0.75, 2.4);   // SWITCHBACKS ahead
    signPost(sStart + 1500, 1, 1.4, 32 + 4, 3.0, 0.75, 2.4); signPost(sStart + 3000, 1, 1.4, 32 + 4, 3.0, 0.75, 2.4);   // WATCH FOR ROCKS
    { let i = T.startIdx; while (i < T.finishIdx && T.altAt(T.hy[i]) < 2743) i++; signPost(i * T.ds, 1, 1.4, 32 + 5, 3.0, 0.75, 2.4); }   // ELEV 9000 FT (2743 m): where the road reaches it
    signPost(sStart + 30, -1, 1.4, 32 + 1, 3.0, 0.75, 2.4);   // RED LODGE (behind: facing the other way is enough to read it from the grid)

    /* ---- spectators: the start and the finish, the checkpoints, both sides of every hairpin, a few groups along the road ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.12, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'BT start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'BT finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.55, label: 'BT cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.4, label: 'BT cp-' }); });
      (def.curves || []).forEach(([d, , turn], k) => { const sm = sStart + d; for (const sd of [-1, 1]) run(sm - 22, sm + 22, sd, { rows: 3, dens: sd === turn ? 0.5 : 0.35, flag: 0.18, label: 'BT hairpin ' + (k + 1) }); });
      for (let s = sStart + 400; s < sFin - 300; s += 600) { const sd = rpHash(Math.round(s), 7) < 0.5 ? -1 : 1; run(s, s + 24, sd, { rows: 2, dens: 0.35, clump: 0.9, label: 'BT group' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the forest (instanced per 96 m chunk): spruce and fir with lodgepole pines low down, fewer and smaller higher up, whitebark pines and their silver
       snags near the treeline, krummholz mats on the tundra; none on the rock, the snow or the cliffs ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 3, 4].map(k => new IChunks(btTreeGeo(k), tMatT, 96));
    let nTrees = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(90000 * dens), RT = rng(3961), SP = 5.2 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(260)) continue;
          if (hd > LOD.radius(90) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot, the trees bigger)
          const c = vrLC(x, z), y = caGround(x, z), A = y + base, tl = sstep(2780, 2950, A);   // (tl: towards the treeline)
          const p = c === 1 ? 0.9 - 0.35 * tl : c === 2 ? 0.35 : c === 0 ? 0.04 + 0.1 * sstep(0.6, 0.8, P.n5(x * 1.3 + 40, z * 1.3)) * (1 - tl) : c === 4 ? 0.04 : 0;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.4) continue; if (nn.i >= 0 && nn.dd < 5 && r2 < 0.25) continue;
          if (excluded(x, z)) continue;
          const sl = caSlope(x, z); if (sl > 1.2) continue;
          if (btSnow(x, z, A, 1 / Math.sqrt(1 + sl * sl), 0, 0) > 0.4) continue;
          let sp;
          if (c === 2 || (c === 0 && r3 < 0.7)) sp = 4;
          else { const pPine = lerp(0.3, 0.06, tl), pWb = lerp(0.04, 0.22, tl), pSnag = 0.05 + 0.06 * tl; sp = r3 < pPine ? 1 : r3 < pPine + pWb ? 2 : r3 < pPine + pWb + pSnag ? 3 : 0; }
          const shrink = lerp(1, 0.55, tl), far = hd > 90 ? 1.12 : 1;
          let hgt, wid, col;
          if (sp === 0) { hgt = (15 + r4 * 13) * shrink; wid = hgt * (0.3 + r2 * 0.08); col = [0.9 + r2 * 0.2, 0.92 + r4 * 0.16, 0.92 + r3 * 0.16]; }
          else if (sp === 1) { hgt = (16 + r4 * 10) * shrink; wid = hgt * (0.42 + r2 * 0.12); col = [0.95 + r2 * 0.15, 0.95 + r4 * 0.1, 0.9]; }
          else if (sp === 2) { hgt = (8 + r4 * 6) * shrink; wid = hgt * (0.8 + r2 * 0.3); col = [0.95 + r2 * 0.1, 0.95 + r3 * 0.1, 0.92]; }
          else if (sp === 3) { hgt = 6 + r4 * 6; wid = hgt * 0.6; col = [0.95 + r2 * 0.1, 0.95 + r2 * 0.1, 0.95 + r2 * 0.1]; }
          else { hgt = 0.8 + r4 * 1.3; wid = 2 + r2 * 3; col = [0.9 + r3 * 0.2, 0.95 + r4 * 0.1, 0.9]; }
          tk[sp].add(x, y - 0.15, z, r1 * 70, wid * far, hgt * far, col);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);

    /* ---- the tundra's plants (instanced per 96 m chunk): tufts of grass and sedge, cushions of flowers (pink moss campion, yellow cinquefoil, blue
       forget-me-not, white phlox), granite boulders; thicker near the road, none on the snow, under the trees or on the cliffs ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);   // (the grass: in the wind, and the cut)
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    const pk = [0, 1, 2, 3].map(k => new IChunks(btPlantGeo(k), k === 0 ? wMat : pMat, k === 3 ? 64 : 96));
    const flowerC = [[1.0, 0.55, 0.78], [1.0, 0.88, 0.3], [0.55, 0.7, 1.0], [1, 1, 1], [0.86, 0.5, 0.95]];
    let nPlants = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(60000 * dens), RT = rng(3971), SP = 3.4 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(220)) continue;
          if (hd > LOD.radius(70) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;
          const c = vrLC(x, z);
          let kind = -1;
          if (c === 0) kind = r1 < 0.5 ? 0 : r1 < 0.62 ? 1 : r1 < 0.65 ? 2 : -1;
          else if (c === 2) kind = r1 < 0.25 ? 0 : r1 < 0.3 ? 1 : -1;
          else if (c === 4) kind = r1 < 0.12 ? 2 : r1 < 0.18 ? 0 : r1 < 0.21 ? 1 : -1;
          else if (c === 1) kind = r1 < 0.05 ? 0 : r1 < 0.07 ? 2 : -1;
          if (kind < 0) continue;
          const y0 = caGround(x, z), sl = caSlope(x, z); if (sl > (kind === 2 ? 1.1 : 0.85)) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 1.6) continue;
          if (excluded(x, z)) continue;
          const ny = 1 / Math.sqrt(1 + sl * sl); if (btSnow(x, z, y0 + base, ny, 0, 0) > 0.35) continue;
          if (kind === 0) pk[0].add(x, y0 - 0.05, z, r2 * TAU, 0.45 + r3 * 0.5, 0.25 + r4 * 0.3, [0.92 + r2 * 0.16, 0.95 + r3 * 0.1, 0.9 + r4 * 0.16]);
          else if (kind === 1) pk[1].add(x, y0 - 0.06, z, r2 * TAU, 0.4 + r3 * 0.6, 0.25 + r4 * 0.25, flowerC[Math.floor(r4 * flowerC.length)]);
          else { const k = 0.85 + r3 * 0.3, rc = r2 < 0.4 ? [1.04, 0.97, 0.95] : [0.95, 0.95, 0.97]; pk[2].add(x, y0 - 0.15, z, r4 * TAU, 0.6 + r3 * 1.8, 0.45 + r4 * 1.2, [rc[0] * k, rc[1] * k, rc[2] * k]); }
          if (++nPlants >= maxT) break grid;
        }
      }
    }
    {   // the stones by the road: little clusters strewn beside it, thickest at its edge, thinning out over ~30 m
      const RS = rng(3977), maxS = Math.round(16000 * dens); let nS = 0;
      edge: for (let s = 12; s < T.len - 12; s += 1.3 / dens) for (const side of [-1, 1]) {
        const o = 1.7 + Math.pow(RS(), 2) * 30, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z)) continue;
        const y0 = caGround(x, z), sl = caSlope(x, z); if (sl > 1.15 || (vrLC(x, z) !== 4 && r1 < 0.55)) continue;
        if (btSnow(x, z, y0 + base, 1 / Math.sqrt(1 + sl * sl), 0, 0) > 0.3) continue;
        const k = 0.84 + r3 * 0.28, sc = 0.8 + r1 * 1.1; pk[3].add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [k, k, k]);
        if (++nS >= maxS) break edge;
      }
    }
    for (const t of pk) t.addTo(root, false);

    /* ---- the verges and the slopes: the snowdrifts the ploughs left along the edges high up (white banks, dirty at the foot), granite blocks at the foot
       of the cuts, crags and slabs where the slope rises steep beside the road ---- */
    let nDrift = 0;
    {
      const RV = rng(3981), granite = [[0.64, 0.61, 0.59], [0.68, 0.6, 0.57], [0.56, 0.55, 0.54], [0.7, 0.66, 0.62], [0.6, 0.58, 0.58]], snowC = [0.95, 0.96, 1.0], dirt = [0.74, 0.73, 0.72];
      API.ROCK_SMOOTH = true;
      for (let s = 10; s < T.len - 10; s += 2.6) for (const side of [-1, 1]) {   // the drifts: long low banks in stretches (a slow noise along the road) from ~2700 m up, more on the shady side
        const i = T.idx(s), A = altAt(i); if (A < 2700) continue;
        const nx = T.nx[i] * side, nz = T.nz[i] * side, shade = sstep(-0.2, 0.6, -nz * 0.8 - nx * 0.3);   // (the edge facing north or west lies in the slope's shade)
        if (P.c5(s * 0.35, side * 300) + 0.16 * shade + 0.14 * sstep(2700, 2850, A) < 0.7) continue;
        const [x, z] = onSide(s, side, 1.2 + RV() * 0.8); if (vrNear(x, z).dd < 0.8 || excluded(x, z)) continue;
        const g = scen.get(x, z), r = 1.1 + RV() * 0.6 + 0.4 * sstep(2780, 2860, A);
        ico(g, x, caGround(x, z) - r * 0.12, z, r, 0.42 + RV() * 0.18, RV() < 0.15 ? dirt : snowC, RV, 0.08); nDrift++;
      }
      API.ROCK_SMOOTH = false;
      for (let s = 10; s < T.len - 10; s += 6) for (const side of [-1, 1]) {   // granite at the foot of the cuts
        if (RV() > 0.32) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 36, [x, z] = onSide(s, side, o), sz = 0.4 + RV() * 1.4; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.3 && vrLC(x, z) !== 4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.25, sz, sz, RV() * TAU, vary(granite[Math.floor(RV() * granite.length)], RV, 0.1), RV, 0.28);
      }
      for (let s = 16; s < T.len - 16; s += 15) for (const side of [-1, 1]) {   // crags and slabs where the slope is steep
        if (RV() < 0.4) continue;
        const [x, z] = onSide(s, side, 8 + RV() * 70); if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(90)) continue;
        const sl = caSlope(x, z); if (sl < 0.65) continue;
        const y = caGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(granite[Math.floor(RV() * granite.length)], RV, 0.06);
        for (let q = 0; q < n; q++) { const r0 = 2 + RV() * 4, qx = x + (RV() - 0.5) * 9, qz = z + (RV() - 0.5) * 9, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0 * 1.2, r0 * (0.6 + RV() * 0.6), r0 * (0.8 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.06), RV, 0.3, 0.4); }
      }
    }

    /* ---- the wildlife: two small herds of mountain goats on the rocky slopes above the road, marmots sitting up on the boulders by it ---- */
    let nAnimals = 0;
    {
      const RA = rng(3991), herd = (s, side) => { for (let tries = 0; tries < 30; tries++) { const [x, z] = onSide(s + (RA() - 0.5) * 80, side, 18 + RA() * 50); if (excluded(x, z) || vrNear(x, z).dd < 10) continue;
          const sl = caSlope(x, z); if (sl < 0.35 || sl > 1.2) continue;
          for (let k = 0; k < 4; k++) { const gx = x + (RA() - 0.5) * 9, gz = z + (RA() - 0.5) * 9; if (vrNear(gx, gz).dd < 8) continue; btGoat(scen.get(gx, gz), gx, caGround(gx, gz) - 0.05, gz, RA() * TAU, k === 3 ? 0.6 : 0.95 + RA() * 0.15); nAnimals++; }
          exclPush(x, z, 7); return; } };
      herd(sStart + 2300, 1); herd(sStart + 4300, -1);
      for (let s = sStart + 300; s < sFin; s += 450 + RA() * 200) { const side = RA() < 0.5 ? -1 : 1, [x, z] = onSide(s, side, 4 + RA() * 10); if (excluded(x, z) || vrNear(x, z).dd < 2.5) continue;
        const y = caGround(x, z), g = scen.get(x, z); rock(g, x, y + 0.25, z, 1.0, 0.7, 0.9, RA() * TAU, [0.64, 0.61, 0.59], RA, 0.25); btMarmot(g, x, y + 0.85, z, RA() * TAU); nAnimals++; }
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: btAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: btAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, plants: nPlants, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), poles: nPole + out.propStats.posts, drifts: nDrift, animals: nAnimals, pulls: pulls.length };   // (read by the tests)
    return out;
  }

  Object.assign(API, { btPlantGeo });   // (what World and the other worlds use of this one)
  World.ext.beartooth = (scene, tex, opts) => buildBeartooth(scene, tex, opts);
})();
