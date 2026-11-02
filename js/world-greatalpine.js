/* =========================================================================
   WORLD — Great Alpine Road (theme 'greatalpine'): its own builder (World.ext.greatalpine), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    CAN, Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, brookMat, caNear, caTileOn, clamp, cone, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl,
    lerp, ouCutMat, ouRod, pkGroundMat, propFloorTable, puff, rng, roadsideProps, rock, rpHash, sstep, stubExcl, stubGeo, stubProps, stubRails,
    stubVerge, tuftWindMat, valueNoise2, vary, vrDem, vrDist, vrGritTex, vrLC, vrNear, vrPrep, vrStubH, vrStubs, parkOn
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= GREAT ALPINE ROAD (theme 'greatalpine') =================
     The twistiest stretch of the Great Alpine Road (B500, Victoria, Australia), between Omeo and Bruthen: from the road beside the Tambo River
     (~123 m) up the forested valleys of Saint Patricks, Wild Dog, Bullocky and Mullocky Creeks, beside the Mount Elizabeth reserve, to the top
     of the climb on the ridge (~337 m), on a warm, clear afternoon in the Gippsland bush. Built on Vršič's corridor (vrPrep reads def.dem,
     def.lc) and Los Caracoles' height blend (caNear), with terrain helpers of its own (gaH: the rivers' beds dug into the ground, def.rivers;
     the side roads levelled, def.sideRoads) and a look of its own: the dry eucalypt forest (tall smooth-barked gums, stringybarks, dark
     ironbarks, the silver stags of old fires, wattles and bracken under them, tree ferns down the moist gullies), the river oaks and the rocky
     bed of the Tambo, the creeks under the road in culverts, the cut batters in grey and ochre shale, the pull-outs and gravel stockpile sites
     (def.pulls), Australian road furniture (white guide posts with a red and a white reflector: knockable, W-beam guard fence, yellow curve
     signs with the advisory speed, chevron alignment markers, kilometre posts), the far ridges beyond the corridor (def.far). It paints itself
     for the season (out.ownSeason): the bush is evergreen; the grass is straw in summer, greener in autumn and green in winter, when the wattles
     flower. No helicopter, no birds (def.noHeli, def.noBirds). Every sign and board is generic: only place names. */
  let GAS = 'summer';                          // the season the world is painted in ('summer' | 'autumn' | 'winter': buildGreatAlpine, from opts.season)
  let GAW = null;                              // the rivers (def.rivers): their segments hashed in 32 m cells (gaWaterPrep)
  const GAWV = { e: -16, lv: 0, hw: 0, r: -1, k: -1, t: 0 };   // gaWat's answer: how far inside the banks (+ in the water), the level, the half width, which river, segment, along it
  const GACOL = [0, 0, 0];
  function gaWaterPrep() {
    const HC = 32, H = new Map(), rv = (T.def.rivers || []).map((a) => { let mh = 0; for (let k = 3; k < a.length; k += 4) mh = Math.max(mh, a[k]); return { a, n: a.length / 4, wide: mh >= 4 }; });
    rv.forEach((R, r) => { const a = R.a;
      for (let k = 0; k + 1 < R.n; k++) { const x0 = a[4 * k], z0 = a[4 * k + 1], x1 = a[4 * k + 4], z1 = a[4 * k + 5], m = Math.max(a[4 * k + 3], a[4 * k + 7]) + 16;
        for (let i = Math.floor((Math.min(x0, x1) - m) / HC); i <= Math.floor((Math.max(x0, x1) + m) / HC); i++) for (let j = Math.floor((Math.min(z0, z1) - m) / HC); j <= Math.floor((Math.max(z0, z1) + m) / HC); j++) {
          const key = i * 65536 + j; let L = H.get(key); if (!L) H.set(key, L = []); L.push(r, k); } } });
    GAW = { rv, H, HC };
  }
  function gaWat(x, z) {   // the water nearest (x, z) (GAWV; r -1: none within 16 m of its banks)
    const W = GAWV; W.e = -16; W.r = -1; const L = GAW && GAW.H.get(Math.floor(x / GAW.HC) * 65536 + Math.floor(z / GAW.HC)); if (!L) return W;
    for (let q = 0; q < L.length; q += 2) { const a = GAW.rv[L[q]].a, k = L[q + 1], o = 4 * k, x0 = a[o], z0 = a[o + 1], dx = a[o + 4] - x0, dz = a[o + 5] - z0, l2 = dx * dx + dz * dz || 1;
      const t = clamp(((x - x0) * dx + (z - z0) * dz) / l2, 0, 1), px = x0 + dx * t - x, pz = z0 + dz * t - z, hw = a[o + 3] + (a[o + 7] - a[o + 3]) * t, e = hw - Math.sqrt(px * px + pz * pz);
      if (e > W.e) { W.e = e; W.r = L[q]; W.k = k; W.t = t; W.hw = hw; W.lv = a[o + 2] + (a[o + 6] - a[o + 2]) * t; } }
    return W;
  }
  function gaFar(x, z) { const P = API.VR; return vrDem(x, z) + (P.n1(x, z) - 0.5) * 3 + (P.n2(x, z) - 0.5) * 1.5; }   // the land away from the road: the real terrain, a little made-up relief
  function gaRiverH(x, z, h, dd) {   // the water's beds on the ground h: the Tambo's (wide: its own level, the waterline ~2 m inside its banks, ~2 m deep, the banks
    // eased into the land over 14 m, never under the water), the creeks' small channels (cut into the ground, not under the road: there they run in culverts)
    const W = gaWat(x, z); if (W.r < 0) return h;
    const e = W.e;
    if (GAW.rv[W.r].wide) { const lv = W.lv;
      if (e > 0) return Math.min(h, Math.max(lv - 2.4, lv + 0.7 - 0.32 * e));
      return Math.max(lv + 0.7 - 0.08 * e, Math.min(h, lerp(lv + 0.7, h, sstep(0, -14, e)))); }
    const d = W.hw - e, hw = W.hw; if (d > hw + 3) return h;
    return h - (0.45 + hw * 0.5) * sstep(hw + 3, hw * 0.3, d) * sstep(3, 9, dd);
  }
  function gaH(x, z) {   // terrain height: Los Caracoles' blend near the road (caNear), the real terrain farther out, the rivers' beds, the level plots, the side roads
    const n = caNear(x, z), i = n.i, dd = i >= 0 ? n.dd : 999; let h;
    if (i < 0) h = gaFar(x, z);
    else { const hr = n.h - 0.3; h = dd <= 1 ? hr : lerp(hr, gaFar(x, z), sstep(1, 42, dd)); }
    const pads = API.VR.pads; for (let k = 0; k < pads.length; k++) { const p = pads[k], d = Math.hypot(x - p.x, z - p.z), pb = p.b || 12; if (d < p.r + pb) h = lerp(p.h, h, sstep(p.r, p.r + pb, d)); }   // level plots: the car parks
    if (i >= 0) h = Math.min(h, n.env);
    h = gaRiverH(x, z, h, dd);
    if (API.VR.sg) h = vrStubH(x, z, h, dd);
    return h;
  }
  function gaGH(i, j) {   // terrain height at grid vertex (i, j), computed once (VR.G: Vršič's grid)
    const G = API.VR.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = gaH(G.x0 + i * VRC, G.z0 + j * VRC); G.dd[k] = CAN.i >= 0 ? CAN.dd : 999; (G.up || (G.up = new Float32Array(G.h.length)))[k] = CAN.i >= 0 ? h - CAN.h : 0; }   // (up: above the road's blend there)
    return h;
  }
  function gaGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / VRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = gaGH(i, j); return a + u * (gaGH(i + 1, j) - a) + v * (gaGH(i, j + 1) - a); }
    const d = gaGH(i + 1, j + 1); return d + (1 - u) * (gaGH(i, j + 1) - d) + (1 - v) * (gaGH(i + 1, j) - d);
  }
  function gaSlope(x, z) { const a = gaGround(x - 2.5, z), b = gaGround(x + 2.5, z), c = gaGround(x, z - 2.5), d = gaGround(x, z + 2.5); return Math.hypot(b - a, d - c) / 5; }
  function gaCol(x, z, h, ny, dd, up) {   // ground colour (times the grey grit map): the forest floor of grey-brown leaf litter and bark, patches of grass where the canopy
    // is open (straw in summer, greener in autumn, green in winter), darker and mossy down the creeks' gullies, the steep faces and the road's cut batters
    // in grey shale banded with ochre and rust, grey gravel and sand along the Tambo, a mown verge by the road
    const P = API.VR, m = P.c1(x, z), q = P.c2(x, z), f = P.n4(x, z), A = h + P.D.base, su = GAS === 'summer', wi = GAS === 'winter';
    let R = 0.3 + (m - 0.5) * 0.08, G = 0.28 + (m - 0.5) * 0.06, B = 0.21 + (m - 0.5) * 0.04;   // leaf litter, bark and twigs
    const gr = sstep(0.42, 0.72, q) * (0.45 + 0.55 * sstep(0.84, 0.97, ny)) * (0.7 + 0.3 * sstep(150, 300, A)), gc = su ? [0.52, 0.5, 0.31] : wi ? [0.33, 0.43, 0.21] : [0.43, 0.46, 0.27];
    R = lerp(R, gc[0], gr * 0.5); G = lerp(G, gc[1], gr * 0.5); B = lerp(B, gc[2], gr * 0.5);
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.07; B += (f - 0.5) * 0.05;
    const W = gaWat(x, z);
    if (W.r >= 0 && !GAW.rv[W.r].wide) { const g = sstep(W.hw + 14, W.hw + 1, W.hw - W.e) * 0.6; R = lerp(R, 0.3, g); G = lerp(G, 0.35, g); B = lerp(B, 0.22, g); }   // (a creek's gully: moss and ferns)
    const st = Math.max(sstep(0.66, 0.5, ny), sstep(0.86, 0.68, ny) * sstep(14, 4, dd) * sstep(0.5, 2.5, up || 0));   // shale: the cliffs, and the road's cut batters (steep within ~10 m of the road, above it)
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 2.6 + P.c3(x * 0.6, z * 0.6) * 7), och = sstep(0.42, 0.72, P.c4(x, z)), k = 0.86 + 0.14 * band;
      R = lerp(R, lerp(0.55, 0.7, och) * k, st); G = lerp(G, lerp(0.53, 0.53, och) * k, st); B = lerp(B, lerp(0.5, 0.38, och) * k, st); }
    if (W.r >= 0 && GAW.rv[W.r].wide && W.e > -8) { const t = sstep(-8, -1.5, W.e) * 0.85, s = 0.94 + 0.12 * P.n6(x, z); R = lerp(R, 0.64 * s, t); G = lerp(G, 0.62 * s, t); B = lerp(B, 0.57 * s, t); }   // the Tambo's gravel and sand
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.5, v = su ? [0.52, 0.5, 0.36] : [0.42, 0.47, 0.31]; R = lerp(R, v[0], t); G = lerp(G, v[1], t); B = lerp(B, v[2], t); }   // the verge
    GACOL[0] = R; GACOL[1] = G; GACOL[2] = B; return GACOL;
  }
  function gaGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in gaTileGeo)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = gaGH(ii, jj);
      const nx = -(gaGH(ii + 1, jj) - gaGH(ii - 1, jj)) / (2 * VRC), nz = -(gaGH(ii, jj + 1) - gaGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = gaCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, G.dd[jj * G.nx + ii], G.up[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function gaTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by gaCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = gaGH(i, j);
      let nx = -(gaGH(i + st, j) - gaGH(i - st, j)) / (2 * VRC * st), nz = -(gaGH(i, j + st) - gaGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const kk = clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1), c = gaCol(x, z, h, ny, G.dd[kk], G.up[kk]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
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
  let gaATex = null, gaAKey = '', gaA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function gaAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the board at the top, the race's banner
    const key = cps.join('|') + '|' + finA; if (gaATex && gaAKey === key) return gaATex;
    if (gaATex) gaATex.dispose(); gaAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(282, 142, 460, 100); txt('FINISH', 512, 196, 92, '#111', 440);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#1f4f3a'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#f2c84b', 520); });
    x.fillStyle = '#5a3a22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f1e6cc'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);   // (a brown board, as the ones at the lookouts)
    txt('GREAT ALPINE ROAD', 512, 812, 56, '#f3ead6', 900); txt(finA, 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#f2efe6'; x.fillRect(0, 896, 1024, 64); x.fillStyle = '#1f4f3a'; x.fillRect(0, 960, 1024, 64);
    txt('GREAT ALPINE ROAD', 512, 930, 54, '#16181c', 960); txt('TAMBO VALLEY · GIPPSLAND', 512, 994, 42, '#f2c84b', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (gaATex = t);
  }
  const GA_BOARDS = [['BRUTHEN  23', '#1d6b3c'], ['TAMBO RIVER', '#1f4f9a'], ['MOUNT ELIZABETH', '#5a3a22'], ['SLOW VEHICLE TURNOUT', '#1f4f9a'], ['WINDING ROAD', '#f1c21b']];
  const GA_CREEKS = ['ST PATRICKS CK', 'WILD DOG CK', 'BULLOCKY CK', 'MULLOCKY CK'], GA_ADV = [25, 35, 45, 55, 65, 75];
  function gaAtlas2() {   // the small signs: row 0 the yellow curve warnings (a left and a right bend, a winding road both ways), the chevron alignment markers
    // and two speed limits (100, 80); row 1 the advisory speeds on yellow plates; row 2 the creeks' names on blue plates; row 3 the
    // kilometre plates (73-80 km from Omeo); rows 4-7 the boards (two a row, 512 x 128): guide signs, the river, the reserve, the turnout
    if (gaA2Tex) return gaA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (let k = 0; k < 4; k++) { const x0 = k * 128, dir = k % 2 ? 1 : -1;   // the diamonds: black edge, yellow, a black arrow
      x.save(); x.translate(x0 + 64, 64); x.rotate(Math.PI / 4); x.fillStyle = '#16181c'; x.fillRect(-44, -44, 88, 88); x.fillStyle = '#f1c21b'; x.fillRect(-40, -40, 80, 80); x.restore();
      x.strokeStyle = '#16181c'; x.lineWidth = 9; x.beginPath(); x.moveTo(x0 + 64, 98);
      if (k < 2) { x.lineTo(x0 + 64, 66); x.quadraticCurveTo(x0 + 64, 46, x0 + 64 + 22 * dir, 40); } else { x.bezierCurveTo(x0 + 64 - 22 * dir, 82, x0 + 64 + 22 * dir, 64, x0 + 64, 52); x.lineTo(x0 + 64 + 10 * dir, 38); }
      x.stroke(); x.fillStyle = '#16181c'; x.beginPath();
      if (k < 2) { x.moveTo(x0 + 64 + 34 * dir, 38); x.lineTo(x0 + 64 + 16 * dir, 26); x.lineTo(x0 + 64 + 16 * dir, 52); } else { x.moveTo(x0 + 64 + 18 * dir, 26); x.lineTo(x0 + 64 - 2 * dir, 34); x.lineTo(x0 + 64 + 18 * dir, 46); }
      x.fill(); }
    for (const [k, dir] of [[4, -1], [5, 1]]) { const x0 = k * 128; x.fillStyle = '#f1c21b'; x.fillRect(x0, 0, 128, 128); x.fillStyle = '#16181c';   // the chevron alignment markers
      x.beginPath(); const cx = x0 + 64; x.moveTo(cx - 20 * dir, 18); x.lineTo(cx + 22 * dir, 64); x.lineTo(cx - 20 * dir, 110); x.lineTo(cx - 44 * dir, 110); x.lineTo(cx - 2 * dir, 64); x.lineTo(cx - 44 * dir, 18); x.closePath(); x.fill(); }
    for (const [k, v] of [[6, '100'], [7, '80']]) { const x0 = k * 128; x.fillStyle = '#f4f4f0'; x.fillRect(x0 + 14, 4, 100, 120); x.strokeStyle = '#16181c'; x.lineWidth = 3; x.strokeRect(x0 + 15, 5, 98, 118);   // the speed limits
      x.strokeStyle = '#c8261f'; x.lineWidth = 10; x.beginPath(); x.arc(x0 + 64, 64, 40, 0, TAU); x.stroke(); txt(v, x0 + 64, 66, v.length > 2 ? 34 : 42, '#16181c', 70); }
    GA_ADV.forEach((v, k) => { const x0 = k * 128; x.fillStyle = '#16181c'; x.fillRect(x0 + 8, 132, 112, 120); x.fillStyle = '#f1c21b'; x.fillRect(x0 + 12, 136, 104, 112); txt(String(v), x0 + 64, 180, 60, '#16181c', 96); txt('km/h', x0 + 64, 228, 26, '#16181c', 96); });
    GA_CREEKS.forEach((n, k) => { const x0 = k * 256, y0 = 256; x.fillStyle = '#1f4f9a'; x.fillRect(x0 + 4, y0 + 24, 248, 80); x.strokeStyle = '#f2f2ee'; x.lineWidth = 4; x.strokeRect(x0 + 10, y0 + 30, 236, 68); txt(n, x0 + 128, y0 + 66, 34, '#f2f2ee', 224); });
    for (let k = 0; k < 8; k++) { const x0 = k * 128, y0 = 384; x.fillStyle = '#f4f4f0'; x.fillRect(x0 + 24, y0 + 8, 80, 112); x.strokeStyle = '#16181c'; x.lineWidth = 4; x.strokeRect(x0 + 26, y0 + 10, 76, 108); txt(String(73 + k), x0 + 64, y0 + 64, 50, '#16181c', 70); }
    GA_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, warn = bg === '#f1c21b';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = warn ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, n.length > 16 ? 42 : 54, warn ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (gaA2Tex = t);
  }
  function gaLump(g, cx, cy, cz, r, sy, col, R, jit) {   // a low lump of foliage (8 faces, smooth normals): dark underneath, lit on top
    const V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(v => { const k = 1 + (R() - 0.5) * jit; return [cx + v[0] * r * k, cy + v[1] * r * sy * k, cz + v[2] * r * k]; });
    const F = [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [0, 4, 3], [4, 1, 3], [1, 5, 3], [5, 0, 3]], inn = [cx, cy, cz];
    const nn = (p) => { const x = (p[0] - cx) / r, y = (p[1] - cy) / (r * sy) + 0.3, z = (p[2] - cz) / r, l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
    const sc = (p) => { const t = clamp((p[1] - cy) / (r * sy) * 0.5 + 0.5, 0, 1), k = 0.72 + 0.4 * t; return [col[0] * k, col[1] * k, col[2] * k]; };
    for (const [a, b, c] of F) g.triON(V[a], V[b], V[c], nn(V[a]), nn(V[b]), nn(V[c]), inn, sc(V[a]), sc(V[b]), sc(V[c]));
  }
  function gaTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them): 0 a smooth-barked gum (a tall pale trunk, limbs splitting high, an open crown of
    // separate grey-green clumps), 1 a stringybark (a thick rough brown trunk, a denser, darker olive crown), 2 an ironbark (a black furrowed trunk, a compact
    // blue-grey crown), 3 the silver stag of a tree killed by an old fire (bare limbs), 4 a river oak (a dark trunk, a tall weeping crown of fine dark needles),
    // 5 a tree fern (a fibrous dark trunk, a crown of arching fronds), 6 a wattle (a rounded dull green shrub; the instances turn it gold when it flowers)
    const g = new GB(), R = rng(1210 + kind), rs = API.ROCK_SMOOTH;
    if (kind === 0 || kind === 1 || kind === 2) {
      const bark = kind === 0 ? [0.86, 0.84, 0.78] : kind === 1 ? [0.42, 0.33, 0.25] : [0.2, 0.18, 0.17], barkT = kind === 0 ? [0.8, 0.77, 0.7] : bark, r0 = kind === 1 ? 0.026 : 0.019, th = kind === 2 ? 0.46 : 0.56;
      cyl(g, 0, -0.02, 0, r0, th, 5, bark, null, r0 * 0.62);
      const limbs = kind === 2 ? [[0.12, 0.64, 0.05], [-0.11, 0.62, -0.05]] : [[0.18, 0.71, 0.06], [-0.16, 0.69, -0.08], [0.02, 0.8, 0.16]];
      for (const L of limbs) ouRod(g, [0, th - 0.08, 0], L, r0 * 0.45, barkT, 3);
      API.ROCK_SMOOTH = true; const col = kind === 0 ? [0.36, 0.42, 0.29] : kind === 1 ? [0.27, 0.32, 0.19] : [0.33, 0.38, 0.32];
      const C = kind === 0 ? [[0.21, 0.76, 0.07, 0.18], [-0.19, 0.73, -0.09, 0.17], [0.03, 0.9, 0.0, 0.16], [0.03, 0.72, 0.2, 0.14]]
        : kind === 1 ? [[0.17, 0.73, 0.08, 0.2], [-0.17, 0.71, -0.08, 0.19], [0.0, 0.86, 0.0, 0.19], [0.0, 0.67, 0.19, 0.16]]
        : [[0.13, 0.68, 0.06, 0.18], [-0.13, 0.66, -0.06, 0.17], [0.0, 0.79, 0.0, 0.17]];
      for (const [x, y, z, r] of C) puff(g, x, y, z, r, kind === 2 ? 0.75 : 0.58, vary(col, R, 0.16), R, 0.3, 0.62, 1.12);
    } else if (kind === 3) {
      const s = [0.72, 0.71, 0.68];
      cyl(g, 0, -0.02, 0, 0.022, 0.8, 4, s, null, 0.01);
      ouRod(g, [0, 0.5, 0], [0.16, 0.74, 0.04], 0.011, s, 3); ouRod(g, [0, 0.62, 0], [-0.14, 0.86, -0.04], 0.01, s, 3); ouRod(g, [0, 0.36, 0], [-0.1, 0.46, 0.08], 0.008, s, 3);
    } else if (kind === 4) {
      cyl(g, 0, -0.02, 0, 0.03, 0.3, 5, [0.3, 0.27, 0.24], null, 0.02);
      API.ROCK_SMOOTH = true; const c = [0.18, 0.25, 0.17], tip = [0.26, 0.33, 0.22];
      cone(g, 0, 0.18, 0, 0.26, 0.55, 6, c, tip, 0.3); cone(g, 0.02, 0.48, 0.01, 0.19, 0.52, 6, vary(c, R, 0.1), tip, 1.1);
    } else if (kind === 5) {
      cyl(g, 0, -0.02, 0, 0.05, 0.6, 5, [0.2, 0.15, 0.11], [0.16, 0.12, 0.09], 0.045);
      const base = [0.22, 0.34, 0.12], tip = [0.42, 0.56, 0.22];
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + R() * 0.3, ca = Math.cos(a), sa = Math.sin(a), ox = -sa * 0.07, oz = ca * 0.07, L = 0.42 + R() * 0.08;
        const p0 = [ca * 0.03, 0.6, sa * 0.03], pm = [ca * L * 0.55, 0.68, sa * L * 0.55], pe = [ca * L, 0.5, sa * L];
        g.triO([p0[0] - ox, p0[1], p0[2] - oz], [p0[0] + ox, p0[1], p0[2] + oz], pm, base, [pm[0], -1, pm[2]], base, tip);
        g.triO([pm[0] - ox * 1.2, pm[1], pm[2] - oz * 1.2], [pm[0] + ox * 1.2, pm[1], pm[2] + oz * 1.2], pe, tip, [pe[0], -1, pe[2]], tip, tip);
        g.triO([p0[0] - ox, p0[1], p0[2] - oz], pm, [pm[0] - ox * 1.2, pm[1], pm[2] - oz * 1.2], base, [0, -1, 0], tip, tip); }
    } else if (kind === 7) {   // a far tree (beyond ~70 m of the road, seen small and in the haze): a trunk and three low lumps of crown
      cyl(g, 0, -0.02, 0, 0.022, 0.62, 4, [0.62, 0.58, 0.52], null, 0.014);
      API.ROCK_SMOOTH = true; const col = [0.31, 0.36, 0.25];
      gaLump(g, 0.14, 0.74, 0.04, 0.24, 0.6, col, R, 0.3); gaLump(g, -0.14, 0.72, -0.05, 0.23, 0.6, vary(col, R, 0.15), R, 0.3); gaLump(g, 0.0, 0.86, 0.0, 0.2, 0.6, vary(col, R, 0.15), R, 0.3);
    } else {
      API.ROCK_SMOOTH = true; const col = [0.3, 0.35, 0.21];
      gaLump(g, 0, 0.5, 0, 0.42, 1.0, col, R, 0.3); gaLump(g, 0.22, 0.38, 0.1, 0.3, 1.0, vary(col, R, 0.2), R, 0.3); gaLump(g, -0.2, 0.36, -0.12, 0.3, 1.0, vary(col, R, 0.2), R, 0.3);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function gaPlantGeo(kind) {   // unit plants: 0 a clump of grass and bracken (blades and fronds; the instances tint it straw or green), 1 a boulder of grey shale, 2 a few stones
    const g = new GB(), R = rng(1240 + kind), rs = API.ROCK_SMOOTH;
    if (kind === 0) {
      const base = [0.62, 0.6, 0.42], tip = [0.95, 0.9, 0.66];
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + R() * 0.6, lean = 0.2 + R() * 0.25, hh = 0.6 + R() * 0.4, bx = Math.cos(a) * 0.05, bz = Math.sin(a) * 0.05, tx = Math.cos(a) * lean, tz = Math.sin(a) * lean, ox = -Math.sin(a) * (k % 3 ? 0.04 : 0.11), oz = Math.cos(a) * (k % 3 ? 0.04 : 0.11);
        g.triO([bx - ox, 0, bz - oz], [bx + ox, 0, bz + oz], [tx, hh, tz], base, [tx * 0.5, hh * 0.2, tz * 0.5], base, tip); g.triO([bx - ox, 0, bz - oz], [tx, hh, tz], [bx + ox, 0, bz + oz], base, [-tx, hh * 0.4, -tz], tip, base); }
    } else if (kind === 1) { API.ROCK_SMOOTH = false; rock(g, 0, 0.3, 0, 0.6, 0.5, 0.48, 0, [0.6, 0.57, 0.52], R, 0.3); }
    else { API.ROCK_SMOOTH = false; const C = [[0.62, 0.6, 0.55], [0.56, 0.52, 0.47], [0.68, 0.6, 0.48]];
      for (let k = 0; k < 3; k++) { const a = R() * TAU, d = k ? 0.25 + R() * 0.25 : 0, r = k ? 0.1 + R() * 0.08 : 0.17; rock(g, Math.cos(a) * d, r * 0.25, Math.sin(a) * d, r, r * 0.7, r * 0.85, R() * TAU, C[k], R, 0.3); } }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the view beyond the corridor (def.far: the real terrain on a 200 m grid, ~6 km round the road): as Irohazaka's (irFar, moved with the camera by
  // irFarUpdate), the bush grey-green and blue in the haze, the cleared river flats paler; not where the corridor is
  function gaFarMesh() {
    const F = T.def.far; if (!F) return null;
    const nx = F.nx, nz = F.nz, n = nx * nz, b = atob(F.b64), base = API.VR.D.base, H = new Float32Array(n), dr = new Float32Array(n);
    for (let k = 0; k < n; k++) H[k] = F.lo + (b.charCodeAt(2 * k) * 256 + b.charCodeAt(2 * k + 1)) * F.step - base;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell; let m = 1e18;
      for (let q = 0; q < T.N; q += 5) { const dx = x - T.px[q], dz = z - T.pz[q], d = dx * dx + dz * dz; if (d < m) m = d; } dr[j * nx + i] = Math.sqrt(m); }
    const P0 = [], C = [], I = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, sl = Math.hypot(H[j * nx + Math.min(nx - 1, i + 1)] - H[j * nx + Math.max(0, i - 1)], H[Math.min(nz - 1, j + 1) * nx + i] - H[Math.max(0, j - 1) * nx + i]) / (2 * F.cell), q = rpHash(i, j) - 0.5;
      let c = [0.25 + q * 0.04, 0.31 + q * 0.04, 0.22 + q * 0.03];   // the bush
      const flat = sstep(0.05, 0.015, sl) * sstep(160, 90, H[k] + base); c = [lerp(c[0], GAS === 'summer' ? 0.56 : 0.4, flat), lerp(c[1], GAS === 'summer' ? 0.52 : 0.46, flat), lerp(c[2], 0.32, flat)];   // the cleared river flats
      P0.push(F.x0 + i * F.cell, H[k], F.z0 + j * F.cell); C.push(c[0], c[1], c[2]);
    }
    for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) { const a = j * nx + i, b2 = a + 1, c = a + nx, d = c + 1;
      if (Math.min(dr[a], dr[b2], dr[c], dr[d]) < 470) continue; I.push(a, c, b2, b2, c, d); }
    const g = new THREE.BufferGeometry(), nv = P0.length / 3;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
    g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1)); g.setIndex(I); g.computeVertexNormals();
    const U = { uHz: { value: new THREE.Color(0xc8d6e2) }, uHk: { value: 1 } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false });
    m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz; sh.uniforms.uHk = U.uHk;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nuniform float uHk;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz * uHk );'); };
    m.customProgramCacheKey = () => 'gaFar';
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'gaFar';
    mesh.onBeforeRender = (r, sc) => { U.uHk.value = sc && sc.fog ? 1 : 0; if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); };   // (the haze: the fog's colour, by the time of day and the weather; none without fog)
    const rim = new Float32Array(nv); for (let k = 0; k < n; k++) rim[k] = sstep(1300, 750, dr[k]);   // (round the corridor's hole: into the haze, no ragged edge)
    return { mesh, P0: Float32Array.from(P0), rim, cx: 1e9, cy: 0, cz: 0, cf: 0 };
  }
  function gaFarUpdate(F, cam) {   // as irFarUpdate, but only once the camera has moved 3 m (the nodes lie 6 m and more inside the far plane: never past it)
    if (cam && Math.abs(cam.position.x - F.cx) + Math.abs(cam.position.y - F.cy) + Math.abs(cam.position.z - F.cz) < 3 && cam.far === F.cf) return;
    API.irFarUpdate(F, cam);
  }
  function buildGreatAlpine(scene, tex, opts) {
    const R = rng(4111), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    GAS = opts.season === 'autumn' || opts.season === 'winter' ? opts.season : 'summer';
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: gaGround, camFloor: gaGround, props: [], farClip: true, ownTex: [], dust: [0.72, 0.64, 0.52], season: GAS, ownSeason: true, paintFor: (s) => (s === 'autumn' || s === 'winter' ? s : 'summer') };
    vrPrep(); gaWaterPrep(); vrStubs();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base, su = GAS === 'summer', wi = GAS === 'winter';
    P.c1 = valueNoise2(1131, 140); P.c2 = valueNoise2(1132, 60); P.c3 = valueNoise2(1133, 190); P.c4 = valueNoise2(1134, 80); P.c5 = valueNoise2(1135, 24);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the car park at the top (beside the road past the line, on the side where the ground lies nearer the road's height)
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(gaFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 16, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 70, 13); P.pads.push(padF);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees and boulders between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (crowds, signs, plots) for the plants and the boulders, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    exclPush(padF.x, padF.z, padF.r + 4);
    stubExcl(exclPush);   // (nothing grows or stands on the side roads)
    out.marks = {};

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    { const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(gaTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); } }

    /* ---- the water (Spa's brook shader: it flows, white where it runs steep): the Tambo on its own level from bank to bank, the creeks in their
       channels on the ground (stopping short of the road: they pass under it in culverts, whose headwalls are drawn below) ---- */
    let nWater = 0; const culv = [];
    const latOf = (x, z) => { const n = caNear(x, z); if (n.i < 0 || n.d > 40) return null; const i = n.i; return { i, dd: n.dd, lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };
    { const wg = new Chunks(160, true), deep = [0.13, 0.2, 0.19], shal = [0.3, 0.34, 0.27], cDeep = [0.18, 0.22, 0.17], cShal = [0.34, 0.33, 0.25];
      for (const RV of GAW.rv) {
        const a = RV.a, n = RV.n; let dist = 0;
        for (let k = 0; k + 1 < n; k++) {
          const o = 4 * k, ax = a[o], az = a[o + 1], bx = a[o + 4], bz = a[o + 5], l = Math.hypot(bx - ax, bz - az) || 1, d0 = dist; dist += l;
          if (vrDist(ax, az) > 430) continue;
          const tx = (bx - ax) / l, tz = (bz - az) / l, nx = -tz, nz = tx, g = wg.get(ax, az);
          if (RV.wide) {   // the river: three strips across (the deep middle), on its level
            const ha = a[o + 3], hb = a[o + 7], ya = a[o + 2], yb = a[o + 6], st = clamp((ya - yb) / l / 0.03, 0, 1), S2 = 2 * Math.round(st * 10);
            const pa = (u) => [ax + nx * u, ya, az + nz * u], pb = (u) => [bx + nx * u, yb, bz + nz * u];
            g.quadUp(pa(-ha), pa(0), pb(0), pb(-hb), [shal, deep, deep, shal], [[S2, d0 / 3], [S2 + 0.5, d0 / 3], [S2 + 0.5, dist / 3], [S2, dist / 3]]);
            g.quadUp(pa(0), pa(ha), pb(hb), pb(0), [deep, shal, shal, deep], [[S2 + 0.5, d0 / 3], [S2 + 1, d0 / 3], [S2 + 1, dist / 3], [S2 + 0.5, dist / 3]]);
            nWater++; continue; }
          const la = latOf(ax, az), lb = latOf(bx, bz);
          if (la && lb && Math.abs(la.i - lb.i) < 12 && Math.sign(la.lat) !== Math.sign(lb.lat)) culv.push({ i: la.i, x: (ax + bx) / 2, z: (az + bz) / 2, tx, tz, hw: Math.max(a[o + 3], 1) });
          const da = la ? la.dd : 999, db = lb ? lb.dd : 999;
          if (da < 5 || db < 5) continue;   // (by the road: in the culvert)
          const hw = a[o + 3], Pb = (x, z, u) => { const X = x + nx * u, Z = z + nz * u; return [X, gaGround(X, Z) + 0.1, Z]; };
          const sl = clamp((gaGround(ax, az) - gaGround(bx, bz)) / l / 0.1, 0, 1), S2 = 2 * Math.round(sl * 10);
          g.quadUp(Pb(ax, az, -hw), Pb(ax, az, 0), Pb(bx, bz, 0), Pb(bx, bz, -hw), [cShal, cDeep, cDeep, cShal], [[S2, d0], [S2 + 0.5, d0], [S2 + 0.5, dist], [S2, dist]]);
          g.quadUp(Pb(ax, az, 0), Pb(ax, az, hw), Pb(bx, bz, hw), Pb(bx, bz, 0), [cDeep, cShal, cShal, cDeep], [[S2 + 0.5, d0], [S2 + 1, d0], [S2 + 1, dist], [S2 + 0.5, dist]]);
          if (k % 2 === 0) exclPush(ax, az, hw + 1.2);
          nWater++;
        }
      }
      out.dyn.brook = { uT: { value: 0 } }; wg.addTo(root, brookMat(out.dyn.brook), false, true);
    }
    // the culverts: one per creek where it crosses the road (the first crossing found within 12 m along the road)
    const culverts = []; for (const c of culv) if (!culverts.some(q => Math.abs(q.i - c.i) < 6)) culverts.push(c);

    /* ---- the road: chip-seal asphalt, white edge lines, the dividing line broken on the straights and doubled (the barrier lines) through the
       bends, a gravel shoulder, the verge out past the barrier line onto the ground (120 m chunks), the pull-outs' asphalt and gravel ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.6;
    const SB = stubGeo({ gCol: gaGCol, edge: 'dash', line: 'dash', paveC: [0.8, 0.8, 0.82], gravC: [0.7, 0.62, 0.5], shC: [0.66, 0.6, 0.5] });   // the side roads: their mouths, their surfaces (in the road's chunks below)
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      const ms = stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;   // (a side road's mouth: no ditch, the verge at its surface)
      const y = T.hy[i], gAt = (o) => { const q = side * o; return gaGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a fill slope: the verge's edge, then down)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    // the barrier lines: where the road bends (|k| over 1/260) within 70 m, both lines continuous; elsewhere the dividing line broken (3 m of 12)
    const bend = new Uint8Array(N); for (let i = 0; i < N; i++) if (Math.abs(T.k[i]) > 1 / 260) for (let o = -35; o <= 35; o++) { const j = i + o; if (j >= 0 && j < N) bend[j] = 1; }
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.8 - 0.1 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.86) k += 0.04; return [k, k * 0.99, k * 0.98]; };   // (pale grey chip seal, darker in the wheel tracks)
      const wht = [0.95, 0.95, 0.92], gc = [0.6, 0.57, 0.5];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (k === 4) return gaGCol(x, z);
          const sl = k === 2 ? gaSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return gaCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - bar), y).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 100) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 100, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const [o0, o1] of SB.edges(i, j, [[-(w - 0.35), -(w - 0.5)], [w - 0.5, w - 0.35]])) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          if (bend[i] || bend[j]) { for (const [o0, o1] of [[-0.26, -0.13], [0.13, 0.26]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]); }
          else if ((i * T.ds) % 12 < 3) gl.quadUp(Pt(i, -0.06, 0.036), Pt(i, 0.06, 0.036), Pt(j, 0.06, 0.036), Pt(j, -0.06, 0.036), [wht, wht, wht, wht]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        SB.emit(c0, c0 + 100, gr, gs, gl);   // (the side roads whose junctions are in this chunk)
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // the pull-outs (def.pulls [metres after the start line, side, 0 asphalt / 1 gravel]; def.wide moved the barrier out there): their surface from
      // the shoulder out to 1 m short of the barrier, eased in and out at the ends, a little above the verge
      const pa = new GB(true), pg = new GB(true);
      (def.pulls || []).forEach(([d, side, grav]) => { const s0 = sStart + d, wd = (def.wide || []).find(q => q[2] === side && d >= q[0] && d <= q[1]), half = wd ? (wd[1] - wd[0]) / 2 + 12 : 30;
        const i0 = T.idx(s0 - half), i1 = T.idx(s0 + half), si = side > 0 ? 1 : 0, g = grav ? pg : pa;
        const yA = (i, o) => { const Q = vp[si][i]; let m = 0; while (m < Q.length - 2 && Q[m + 1][0] < o) m++; const a = Q[m], b = Q[m + 1]; return Math.max(a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1), -0.08) + 0.04; };
        const add = (i) => { if (!wd) return 0; const dd = i * T.ds - sStart, [a, b, , m] = wd; return m * Math.min(sstep(a - 30, a, dd), sstep(b + 30, b, dd)); };   // (as much wider as def.wide moved the barrier out)
        for (let i = i0; i < i1; i++) { const j = i + 1, oi = Math.min(w + 0.6 + add(i), (side > 0 ? T.br[i] : T.bl[i]) - 0.6), oj = Math.min(w + 0.6 + add(j), (side > 0 ? T.br[j] : T.bl[j]) - 0.6); if (oi < w + 1.2 && oj < w + 1.2) continue;
          const col = grav ? [0.6, 0.58, 0.54] : [0.78, 0.78, 0.8], u = (o) => (o - w) / 6;
          g.quadUp(Pt(i, side * w, 0.015), Pt(i, side * oi, yA(i, oi)), Pt(j, side * oj, yA(j, oj)), Pt(j, side * w, 0.015), [col, col, col, col], [[0, i * T.ds / 8], [u(oi), i * T.ds / 8], [u(oj), j * T.ds / 8], [0, j * T.ds / 8]]); } });
      addM(pa, aMat); addM(pg, sMat);
      // chequered start and finish lines, a white line at each checkpoint
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(200), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.14, 0.24, 0.6], [0.12, 0.13, 0.16], [0.96, 0.78, 0.18], [0.2, 0.5, 0.62], [0.95, 0.5, 0.14], [0.2, 0.42, 0.24], [0.62, 0.66, 0.7], [0.5, 0.32, 0.22]];
    const CR = crowdCtx({ gH: gaGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => gaWat(x, z).e > -3, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const signQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1) => {   // a sign facing +t (its face from the second atlas), its back plain galvanised steel
      const ux = tz, uz = -tx, hw = W / 2, A = [cx + tx * 0.03 - ux * hw, cy, cz + tz * 0.03 - uz * hw], B = [cx + tx * 0.03 + ux * hw, cy, cz + tz * 0.03 + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban2.quadO(A, B, C, D, W1, [cx - tx, cy + H / 2, cz - tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      const g = scen.get(cx, cz), bk = [0.6, 0.62, 0.64], a = [A[0] - tx * 0.04, cy, A[2] - tz * 0.04], b = [B[0] - tx * 0.04, cy, B[2] - tz * 0.04];
      g.quadO(a, b, [b[0], cy + H, b[2]], [a[0], cy + H, a[2]], bk, [cx + tx, cy + H / 2, cz + tz]); };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a board of the second atlas: [v0, v1, u0, u1]
    const sign = (s, side, k, H) => {   // a board on two steel posts beside the road, facing the cars coming up
      const [bx, bz, bi] = onSide(s, side, 1.4); if (excluded(bx, bz)) return;
      const by = gaGround(bx, bz), [v0, v1, u0, u1] = board(k), gb = scen.get(bx, bz);
      for (const o of [-1.2, 1.2]) box(gb, bx + T.nx[bi] * o, by - 0.2, bz + T.nz[bi] * o, 0.1, (H || 1.6) + 0.95, 0.1, T.hd[bi], [0.6, 0.61, 0.63]);
      signQ(bx, by + (H || 1.6), bz, -T.tx[bi], -T.tz[bi], 3.2, 0.8, v0, v1, u0, u1); exclPush(bx, bz, 2); CR.avoid(bx, bz, 1.6); };
    const plate = (x, z, i, u0, u1, v0, v1, W, H, y0, face) => {   // a small sign on one steel post (the curve warnings, the creeks' and kilometre plates)
      const y = gaGround(x, z), g = scen.get(x, z), f = face || 1; box(g, x, y - 0.2, z, 0.08, y0 + H + 0.15, 0.08, T.hd[i], [0.6, 0.61, 0.63]);
      signQ(x, y + y0, z, -T.tx[i] * f, -T.tz[i] * f, W, H, v0, v1, u0, u1); exclPush(x, z, 1.2); CR.avoid(x, z, 0.8); };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, gaGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const car = (g, x, y, z, rot, col, ute) => {   // a parked car, or a ute (the cab and an open tray behind it)
      const c = Math.cos(rot), s = Math.sin(rot);
      box(g, x, y + 0.25, z, 4.7, 0.8, 1.85, rot, col, null, true);
      if (ute) { box(g, x + c * 0.75, y + 1.05, z + s * 0.75, 1.7, 0.62, 1.62, rot, [0.16, 0.2, 0.26], col, true); for (const b of [-0.88, 0.88]) box(g, x - c * 1.2 - s * b, y + 1.05, z - s * 1.2 + c * b, 2.1, 0.32, 0.08, rot, col, null, true); }
      else box(g, x - c * 0.35, y + 1.05, z - s * 0.35, 2.4, 0.62, 1.62, rot, [0.16, 0.2, 0.26], col, true);
      for (const [a, b] of [[1.45, 0.8], [1.45, -0.8], [-1.45, 0.8], [-1.45, -0.8]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.68, 0.68, 0.24, rot, [0.08, 0.08, 0.09], null, true);
    };
    const moto = (g, x, y, z, rot, col) => {   // a parked motorbike on its side stand
      const c = Math.cos(rot), s = Math.sin(rot);
      for (const a of [-0.7, 0.7]) cyl(g, x + c * a, y, z + s * a, 0.32, 0.12, 6, [0.08, 0.08, 0.09]);
      box(g, x, y + 0.45, z, 1.3, 0.35, 0.35, rot, col, null, true); box(g, x - c * 0.35, y + 0.75, z - s * 0.35, 0.6, 0.12, 0.3, rot, [0.1, 0.1, 0.11]); box(g, x + c * 0.55, y + 0.9, z + s * 0.55, 0.08, 0.08, 0.7, rot, [0.6, 0.6, 0.62]);
    };
    const logTruck = (g, x, y, z, rot) => {   // a log truck waiting at a stockpile site: the cab, a jinker trailer of bolsters and pins loaded with logs (generic: no name)
      const c = Math.cos(rot), s = Math.sin(rot), at = (u, v) => [x + c * u - s * v, z + s * u + c * v];
      { const [px, pz] = at(7.2, 0); box(g, px, y + 0.5, pz, 2.6, 2.6, 2.5, rot, [0.86, 0.84, 0.8], [0.8, 0.78, 0.74], true); box(g, px + c * 1.2, y + 1.6, pz + s * 1.2, 0.2, 1.1, 2.3, rot, [0.14, 0.18, 0.24]); }
      { const [px, pz] = at(0, 0); box(g, px, y + 0.9, pz, 12.5, 0.35, 2.4, rot, [0.2, 0.2, 0.21], null, true); }
      for (const u of [-5.4, -1.8, 1.8, 4.6]) { const [px, pz] = at(u, 0); box(g, px, y + 1.25, pz, 0.3, 0.25, 2.5, rot, [0.24, 0.24, 0.26]); for (const v of [-1.18, 1.18]) { const [qx, qz] = at(u, v); box(g, qx, y + 1.25, qz, 0.16, 2.2, 0.16, rot, [0.24, 0.24, 0.26]); } }
      const RL = rng(1291); for (let r = 0; r < 3; r++) for (let q = 0; q < 4 - r; q++) { const v = (q - (3 - r) / 2) * 0.55, h = y + 1.75 + r * 0.48, [ax, az] = at(-6.2, v), [bx, bz] = at(5.4, v);
        ouRod(g, [ax, h, az], [bx, h, bz], 0.24 + RL() * 0.04, vary([0.56, 0.42, 0.3], RL, 0.15), 6); }
      for (const u of [-4.6, -3.4, 5.8, 8.2]) for (const v of [-1.05, 1.05]) { const [px, pz] = at(u, v); box(g, px, y, pz, 1.0, 1.0, 0.36, rot, [0.08, 0.08, 0.09], null, true); }
    };
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- START (by the Tambo): gantry with the start lights, the timing hut, bunting along the grid, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const hs = gaGround(...onSide(sStart - 5, 1, 3.2).slice(0, 2)) > T.hy[i] - 1.5 ? 1 : -1, [hx, hz] = onSide(sStart - 5, hs, 3.2), hy = gaGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut (on the side of the ground, not the river's)
      box(gh, hx, hy - 0.3, hz, 4.0, 3.0, 2.8, T.hd[i], [0.9, 0.88, 0.82], [0.4, 0.42, 0.44], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true);
      box(gh, hx, hy + 2.7, hz, 4.6, 0.12, 3.4, T.hd[i], [0.62, 0.64, 0.66]);   // (a flat roof of corrugated iron)
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const flagC = [[0.95, 0.78, 0.15], [0.12, 0.42, 0.24], [0.9, 0.9, 0.9], [0.16, 0.3, 0.62], [0.84, 0.2, 0.16]];
      for (const side of [-1, 1]) { let prev = null;   // bunting on poles along the grid
        for (let s = sStart - 70, k = 0; s <= sStart + 24; s += 12, k++) { const [px, pz, ii] = onSide(s, side, 1.2), py = gaGround(px, pz), g = scen.get(px, pz);
          if (excluded(px, pz) && s > sStart - 8) { prev = null; continue; }
          cyl(g, px, py - 0.2, pz, 0.05, 3.4, 5, [0.9, 0.9, 0.9]); const top = [px, py + 3.1, pz];
          if (prev) for (let q = 0; q < 6; q++) { const t = (q + 0.5) / 6, sag = Math.sin(t * PI) * 0.5, fx = prev[0] + (top[0] - prev[0]) * t, fy = prev[1] + (top[1] - prev[1]) * t - sag, fz = prev[2] + (top[2] - prev[2]) * t;
            g.triO([fx - T.tx[ii] * 0.22, fy, fz - T.tz[ii] * 0.22], [fx + T.tx[ii] * 0.22, fy, fz + T.tz[ii] * 0.22], [fx, fy - 0.42, fz], flagC[(q + k) % 5], [fx + T.nx[ii], fy - 0.2, fz + T.nz[ii]]);
            g.triO([fx - T.tx[ii] * 0.22, fy, fz - T.tz[ii] * 0.22], [fx, fy - 0.42, fz], [fx + T.tx[ii] * 0.22, fy, fz + T.tz[ii] * 0.22], flagC[(q + k) % 5], [fx - T.nx[ii], fy - 0.2, fz - T.nz[ii]]); }
          prev = top; } }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: plastic water barriers across it, orange and white
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.6, 0.9, 1.95, T.hd[0], (Math.round(o) & 2) ? [0.95, 0.95, 0.93] : [0.95, 0.45, 0.1]); }
      { const [bx, bz, bi] = onSide(sStart + 16, hs, 1.6), by = gaGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi] * hs, -T.nz[bi] * hs, 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }

    /* ---- the checkpoints: a dark green gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.9, 0.88, 0.84], [0.12, 0.3, 0.22]));

    /* ---- FINISH (the top of the climb): chequered gantry and flags, the brown board with the altitude, the car park with cars, utes and motorbikes, the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4), py = gaGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 24, -sdP, 1.6), sy = gaGround(sx, sz), gs = scen.get(sx, sz);   // the brown board on two posts
      for (const o of [-2.6, 2.6]) box(gs, sx + T.nx[si] * o, sy - 0.2, sz + T.nz[si] * o, 0.16, 3.9, 0.16, T.hd[si], [0.6, 0.61, 0.63]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 2.3, sz, -T.tx[si], -T.tz[si], 6.4, 0.8, v0, v1); } exclPush(sx, sz, 4);
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh), RT = rng(4141), cols = [[0.88, 0.88, 0.86], [0.12, 0.13, 0.15], [0.62, 0.12, 0.1], [0.24, 0.34, 0.56], [0.7, 0.7, 0.72], [0.92, 0.9, 0.86], [0.3, 0.38, 0.28]];
      for (let k = 0; k < 10; k++) { const a = -12 + (k % 5) * 6, b = (k < 5 ? -4.5 : 4.5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5) continue;
        if (k % 3 === 1) for (const m of [-1.4, 0, 1.4]) moto(scen.get(px, pz), px + c * m, gaGround(px + c * m, pz + sn * m), pz + sn * m, hh + PI / 2 + 0.3, vary(cols[Math.floor(RT() * cols.length)], RT, 0.2));
        else car(scen.get(px, pz), px, gaGround(px, pz), pz, hh + PI / 2, vary(cols[Math.floor(RT() * cols.length)], RT, 0.15), k % 3 === 2); }
      for (let k = 0; k < 18; k++) { const px = padF.x + (R() - 0.5) * 24, pz = padF.z + (R() - 0.5) * 24; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: water barriers across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.6, 0.9, 1.95, T.hd[iE], (Math.round(o) & 2) ? [0.95, 0.95, 0.93] : [0.95, 0.45, 0.1]); }
    }

    /* ---- the pull-outs: a log truck waiting at the stockpile site on the blind corner, a ute at another ---- */
    (def.pulls || []).forEach(([d, side, grav], k) => {
      if (!grav || (k % 2 && k !== 3)) return;
      const s = sStart + d, i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) - 3.2), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = gaGround(x, z), g = scen.get(x, z);
      if (k === 3) parkOn(logTruck, gaGround, 14, g, x, y, z, T.hd[i]); else parkOn(car, gaGround, 4.4, g, x, y, z, T.hd[i] + 0.15, vary([0.88, 0.88, 0.86], R, 0.2), true);
      exclPush(x, z, k === 3 ? 10 : 4); CR.block(x, z, k === 3 ? 15 : 5, 2.6, T.hd[i]);
    });
    (def.pulls || []).forEach(([d, side, grav], k) => {   // the stockpile sites: heaps of crushed rock and road base at the back of the gravel
      if (!grav) return; const RG = rng(4151 + k);
      for (let q = 0; q < 2; q++) { const s = sStart + d + (q ? 12 : -14) + (RG() - 0.5) * 4, i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.6), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        if (excluded(x, z)) continue; const y = gaGround(x, z), r0 = 2.2 + RG() * 1.4, g = scen.get(x, z), c = q ? [0.66, 0.63, 0.58] : [0.62, 0.52, 0.4];
        const rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true; rock(g, x, y + r0 * 0.15, z, r0, r0 * 0.55, r0 * 0.8, T.hd[i] + RG(), c, RG, 0.12, 0.5); API.ROCK_SMOOTH = rs;
        exclPush(x, z, r0 + 1); CR.block(x, z, r0 * 2, r0 * 1.6, T.hd[i]); }
    });

    /* ---- the culverts: a concrete headwall at both ends, the pipe's dark mouth, the creek's name on a blue plate before it ---- */
    for (const C of culverts) {
      const i = C.i, nm = (() => { let best = -1, bd = 1e9; T.names.forEach((q, k) => { const d = Math.abs(sStart + q.d - i * T.ds); if (d < bd) { bd = d; best = k; } }); return bd < 60 ? T.names[best].n : ''; })();
      for (const side of [-1, 1]) { const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 1.6), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = gaGround(x, z), g = scen.get(x, z);
        box(g, x, y - 0.6, z, 3.2, 1.5, 0.35, T.hd[i], [0.74, 0.73, 0.7], [0.8, 0.79, 0.76]);
        box(g, x - T.nx[i] * side * 0.19, y - 0.45, z - T.nz[i] * side * 0.19, 1.0, 0.9, 0.04, T.hd[i], [0.06, 0.06, 0.07]); exclPush(x, z, 2.5); }
      const ck = GA_CREEKS.findIndex(c => nm && c.startsWith(nm.toUpperCase().replace('SAINT', 'ST').slice(0, 6)));
      if (ck >= 0) { const [px, pz, pi] = onSide(i * T.ds - 30, -1, 0.9); plate(px, pz, pi, ck * 0.25, ck * 0.25 + 0.25, 1 - 3 / 8 + 0.02, 1 - 2 / 8 - 0.02, 1.6, 0.5, 1.5); }
    }
    out.marks.culverts = culverts.length;

    /* ---- the guard fence where the ground falls away (to the river, into the gullies) and round the outside of the tight bends: galvanised W-beam on
       steel posts; a white guide post every ~50 m where there is none, closer on the outside of the bends (knockable: gaProps) ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 3) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 6); k <= Math.min(N - 1, c.i1 + 6); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (gaGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.2 : 2.2 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), steel = [0.78, 0.8, 0.82], steelB = [0.56, 0.58, 0.6], postC = [0.5, 0.51, 0.53];
      const stubAt = (i, side) => { for (const S of T.stubs || []) if (S.side === side && Math.abs(S.i0 - i) < 16) return true; return false; };
      const pullAt = (i, side) => (def.pulls || []).some(([d, sd]) => sd === side && Math.abs(sStart + d - i * T.ds) < 40);
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || stubAt(i, side) || pullAt(i, side)) nd[i] = 0;
        stubRails(nd, side);   // (open across the side roads' mouths)
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (nd[i] && nd[i + 1]) {
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
          } else if (!nd[i] && i > 2 && i < iE - 2 && !stubAt(i, side)) {
            const k = T.k[i] * side, out_ = k < -1 / 120;   // (closer on the outside of the bends)
            if (i % (out_ ? 10 : 25) === 0) mkPosts.push([i, side]); }
        }
      }
      out.propR = 150;
      out.propFloor = propFloorTable(null, (i, side) => vp[side > 0 ? 1 : 0][i]);
      const n0 = out.props.length, sA = sStart + 20, sB = sFin - 20;
      out.propStats = roadsideProps(out.props, { spots: mkPosts, postEdge: [1.1, 1.5], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
        floor: out.propFloor, skip: (i, side, x, z) => { const s = i * T.ds; return s < sA || s > sB || excluded(x, z); } });
      for (let k = n0; k < out.props.length; k++) { const p = out.props[k]; if (p.kind !== 'post') continue; p.kind = 'gpost';   // (an Australian guide post: the red reflector faces the traffic on its own side, the white one the other way)
        const i = p.i >= 0 ? p.i : T.nearestIdx(p.x, p.z), lat = (p.x - T.px[i]) * T.nx[i] + (p.z - T.pz[i]) * T.nz[i]; if (lat > 0) p.yaw += PI; }
    }

    /* ---- the signs: a yellow curve warning with the advisory speed 100 m before every tight bend (on the left: they drive on the left), chevron
       alignment markers round the outside of the tightest, the kilometre plates (from Omeo), the speed limit, the boards ---- */
    {
      const u8 = 1 / 8, adv = (r) => { const v = Math.sqrt(3.3 * r) * 3.6; let k = 0; while (k < GA_ADV.length - 1 && GA_ADV[k + 1] <= v) k++; return k; };
      let lastS = -1e9;
      for (const c of T.corners) { if (c.sev < 2) continue; const s0 = c.i0 * T.ds, s1 = c.i1 * T.ds; if (s0 < sStart + 60 || s1 > sFin - 20) continue;
        const turn = c.dir > 0 ? 1 : -1;
        if (s0 - lastS > 160) { const [px, pz, ii] = onSide(s0 - 100, -1, 0.9); if (!excluded(px, pz)) {
          const nx2 = T.corners.find(q => q.i0 > c.i1 && q.sev >= 2 && q.i0 * T.ds - s1 < 90), k = (nx2 ? 2 : 0) + (turn > 0 ? 1 : 0);
          plate(px, pz, ii, k * u8, (k + 1) * u8, 1 - u8, 1, 0.95, 0.95, 1.55);
          const ak = adv(c.minR); signQ(px, gaGround(px, pz) + 0.88, pz, -T.tx[ii], -T.tz[ii], 0.6, 0.62, 1 - 2 * u8 + 0.005, 1 - u8 - 0.005, ak * u8 + 0.004, (ak + 1) * u8 - 0.004); } }
        lastS = s1;
        if (c.sev < 3 && c.angle < 1.2) continue;
        const cell = turn > 0 ? 5 : 4, mid = (s0 + s1) / 2, span = Math.max(12, (s1 - s0) * 0.4);
        for (const o of [-span, 0, span]) { const [cx, cz, ci] = onSide(mid + o, -turn, 0.7); if (excluded(cx, cz)) continue;
          const cy = gaGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, cy - 0.2, cz, 0.08, 1.6, 0.08, T.hd[ci], [0.6, 0.61, 0.63]); signQ(cx, cy + 0.8, cz, tx / tl, tz / tl, 0.62, 0.78, 1 - u8, 1, cell * u8, (cell + 1) * u8); CR.avoid(cx, cz, 0.6); }
      }
      for (let km = 73; km <= 80; km++) { const s = sStart + km * 1000 - 72750; if (s < sStart + 30 || s > sFin - 30) continue;   // the kilometre plates on the left
        const [px, pz, pi] = onSide(s, -1, 0.6); if (!excluded(px, pz)) plate(px, pz, pi, (km - 73) * u8, (km - 72) * u8, 1 - 4 * u8 + 0.01, 1 - 3 * u8 - 0.01, 0.36, 0.5, 0.75); }
      { const [px, pz, pi] = onSide(sStart + 150, -1, 1.0); plate(px, pz, pi, 6 * u8, 7 * u8, 1 - u8, 1, 0.75, 0.75, 1.5); }   // the 100 limit past the start
      const nm = (n) => T.names.find(q => q.n.startsWith(n));
      sign(sStart + 60, -1, 1); sign(sStart + 220, -1, 0); sign(sStart + 420, -1, 4);
      { const q = nm('Mount Elizabeth'); if (q) sign(sStart + q.d, 1, 2); }
      (def.pulls || []).forEach(([d, side, grav]) => { if (!grav) sign(sStart + d - 160, side, 3); });
    }

    /* ---- the side roads' cones across their mouths, the rail and the gates at their ends, their names (stubProps) ---- */
    out.stubStats = stubProps({ scen, out, root, gH: gaGround, loc: { closed: 'ROAD CLOSED', gate: 'CLOSED', plate: ['#0f6b3e', '#f4f6f2'] }, posts: 'none' });

    /* ---- spectators: the start and the finish, the checkpoints, groups on the outside of the bends ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.1, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 60, sd, { rows: 3, dens: 0.55, label: 'GA start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'GA finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.5, label: 'GA cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.35, label: 'GA cp-' }); });
      T.corners.filter(c => c.sev >= 3).forEach((c, k) => { if (k % 2) return; const sm = (c.i0 + c.i1) / 2 * T.ds; if (sm < sStart + 100 || sm > sFin - 100) return; run(sm - 18, sm + 18, c.dir > 0 ? -1 : 1, { rows: 2, dens: 0.4, label: 'GA bend' }); });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the bush (instanced per 128 m chunk): smooth-barked gums down the gullies and on the lower slopes, stringybarks higher, ironbarks on the
       dry ridges and the sunny (north-facing) slopes, a silver stag here and there, wattles under them (gold when they flower in winter), tree
       ferns down the creeks' gullies, river oaks along the Tambo; grass and bracken by the road; none on the road, in the water, on the cliffs ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);   // (the grass: in the wind, and the cut)
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    // (instanced: the gums, the stringybarks and ironbarks (one shape, tinted apart), the wattles, the far trees; the rarer ones, the stags, the river
    // oaks and the tree ferns, are stamped into merged chunks: fewer draw calls)
    const TG = [0, 1, 2, 3, 4, 5, 6, 7].map(k => gaTreeGeo(k)), tk = [0, 1, 1, null, null, null, 6, 7].map(k => k == null ? null : new IChunks(TG[k], pMat, k === 7 ? 240 : 160));
    tk[2] = tk[1]; const rare = new Chunks(200), pk = [0, 1].map(k => new IChunks(gaPlantGeo(k), k === 0 ? wMat : pMat, 160)); pk[2] = pk[1];
    const stamp = (k, x, y, z, rot, sxz, sy, tint) => {   // a rare tree into its chunk (the unit shape moved, turned, scaled and tinted)
      const G = TG[k], P = G.attributes.position.array, Nn = G.attributes.normal.array, Cc = G.attributes.color.array, c = Math.cos(rot), sn = Math.sin(rot), g = rare.get(x, z);
      const tp = (o) => [x + (P[o] * c - P[o + 2] * sn) * sxz, y + P[o + 1] * sy, z + (P[o] * sn + P[o + 2] * c) * sxz], tn = (o) => { const nx = Nn[o] * c - Nn[o + 2] * sn, nz = Nn[o] * sn + Nn[o + 2] * c, ny = Nn[o + 1] * sxz / sy, l = Math.hypot(nx, ny, nz) || 1; return [nx / l, ny / l, nz / l]; };
      const tc = (o) => [Cc[o] * tint[0], Cc[o + 1] * tint[1], Cc[o + 2] * tint[2]];
      for (let o = 0; o < P.length; o += 9) g.triN(tp(o), tp(o + 3), tp(o + 6), tn(o), tn(o + 3), tn(o + 6), tc(o), tc(o + 3), tc(o + 6)); };
    let nTrees = 0, nPlants = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(90000 * dens), RT = rng(4171), SP = 6.5 / Math.sqrt(dens);
      const wat = wi ? [2.9, 2.4, 0.55] : null, ft = su ? [1, 0.96, 0.84] : wi ? [0.6, 0.86, 0.5] : [0.82, 0.92, 0.7];
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > 260) continue;
          const cell = Math.floor(xx / SP) + Math.floor(zz / SP) * 3; if ((hd > 60 && (cell & 1)) || (hd > 150 && cell % 3 === 0)) continue;   // (farther out every other spot, beyond 150 m one in three)
          const W = gaWat(x, z), wide = W.r >= 0 && GAW.rv[W.r].wide, creek = W.r >= 0 && !wide, We = W.e;
          if (We > (wide ? -2.5 : -0.6)) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.2) continue;
          if (excluded(x, z)) continue;
          const y = gaGround(x, z), sl = gaSlope(x, z); if (sl > 1.35) continue;
          const A = y + base, c = vrLC(x, z), near = nn.i >= 0 && nn.dd < 4, f = c === 1 ? 0.78 : 0.4;
          let kind = -1;
          if (wide && We > -12) kind = r1 < 0.32 ? 4 : r1 < 0.36 ? 0 : -1;
          else if (creek && We > -9 && r1 < 0.28) kind = 5;
          else if (r1 < f * (near ? 0.7 : 1)) {
            const dry = clamp((A - 180) / 160, 0, 1) * 0.5 + sstep(0.5, 0.75, P.c3(x * 0.7, z * 0.7)) * 0.5, gul = creek ? sstep(-40, -9, We) : 0;
            kind = r2 < 0.04 ? 3 : r2 < 0.12 + 0.35 * gul ? 0 : r2 < 0.12 + 0.35 * gul + 0.5 * (1 - dry) ? 1 : r2 < 0.86 ? (dry > 0.45 ? 2 : 1) : 0;
          } else if (r1 < f + 0.1 && !near) kind = 6;
          if (kind < 0) { if (hd < 70 && r2 < 0.45 && sl < 1.0) { const fern = r3 < 0.55; pk[0].add(x, y - 0.05, z, r4 * TAU, fern ? 1.4 + r3 : 0.9 + r3 * 0.6, fern ? 0.8 + r4 * 0.5 : 0.6 + r4 * 0.4, fern ? [0.5 * (wi ? 1.05 : 1), 0.72, 0.42] : [ft[0] * (0.9 + r3 * 0.2), ft[1] * (0.92 + r4 * 0.16), ft[2]]); } continue; }   // (the forest floor: bracken and tussocks)
          const far = (hd > 45 ? 1.15 : 1) * (nn.i >= 0 ? lerp(0.55, 1, sstep(3, 26, nn.dd)) : 1);
          if (hd > 45 && kind <= 2) { const t = kind === 0 ? [1.08, 1.06, 1.0] : kind === 1 ? [0.86, 0.88, 0.8] : [0.98, 1.0, 1.08], v = 0.9 + r2 * 0.2;   // (far: one cheap tree in the colours of the three)
            tk[7].add(x, y - 0.2, z, r3 * TAU, (10 + r4 * 6) * far, (kind === 0 ? 26 + r4 * 10 : kind === 1 ? 21 + r4 * 8 : 16 + r4 * 6) * far, [t[0] * v, t[1] * v, t[2] * v]); }
          else if (kind === 0) tk[0].add(x, y - 0.2, z, r3 * TAU, (11 + r4 * 6) * far, (24 + r4 * 12) * far, [0.92 + r2 * 0.16, 0.95 + r3 * 0.1, 0.92 + r4 * 0.12]);
          else if (kind === 1) tk[1].add(x, y - 0.2, z, r3 * TAU, (10 + r4 * 5) * far, (19 + r4 * 10) * far, [0.9 + r2 * 0.2, 0.92 + r3 * 0.14, 0.9 + r4 * 0.12]);
          else if (kind === 2) tk[2].add(x, y - 0.2, z, r3 * TAU, (8 + r4 * 4) * far, (15 + r4 * 8) * far, [0.66 + r2 * 0.1, 0.72 + r3 * 0.08, 0.86 + r4 * 0.08]);   // (the stringybark's shape, darker and bluer: an ironbark)
          else if (kind === 3) stamp(3, x, y - 0.2, z, r3 * TAU, 9 + r4 * 6, 16 + r4 * 10, [0.95 + r2 * 0.1, 0.95 + r2 * 0.1, 0.95 + r2 * 0.1]);
          else if (kind === 4) stamp(4, x, y - 0.2, z, r3 * TAU, 6 + r4 * 3, 11 + r4 * 6, [0.9 + r2 * 0.2, 0.95 + r3 * 0.1, 0.92]);
          else if (kind === 5) stamp(5, x, y - 0.1, z, r3 * TAU, 4 + r4 * 2, 3.2 + r4 * 2.2, [0.9 + r2 * 0.2, 0.95 + r3 * 0.12, 0.9]);
          else tk[6].add(x, y - 0.1, z, r3 * TAU, 3 + r4 * 2.5, 2.6 + r4 * 2.6, wat && r2 < 0.7 ? wat : [0.92 + r2 * 0.16, 0.95 + r3 * 0.1, 0.9]);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    {   // grass and bracken by the road and on the open slopes, boulders on the steep ground and along the river, stones on the verges
      const RS = rng(4177), maxS = Math.round(26000 * dens), tint = su ? [1, 0.96, 0.84] : wi ? [0.6, 0.86, 0.5] : [0.82, 0.92, 0.7];
      edge: for (let s = 12; s < T.len - 12; s += 1.1 / dens) for (const side of [-1, 1]) {
        const o = 1.6 + Math.pow(RS(), 1.8) * 30, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.0 || excluded(x, z) || gaWat(x, z).e > -1.5) continue;
        const y0 = gaGround(x, z), sl = gaSlope(x, z);
        if (r1 < 0.62 && sl < 1.0) { const fern = r2 < 0.4; pk[0].add(x, y0 - 0.05, z, r2 * TAU, fern ? 1.3 + r3 : 0.8 + r3 * 0.7, fern ? 0.8 + r3 * 0.5 : 0.6 + r3 * 0.5, fern ? [0.5 * (wi ? 1.05 : 1), 0.72, 0.42] : [tint[0] * (0.9 + r3 * 0.2), tint[1] * (0.92 + r3 * 0.16), tint[2]]); nPlants++; }
        else if (r1 < 0.8) { const k = 0.86 + r3 * 0.24, sc = 0.25 + r2 * 0.35; pk[2].add(x, y0 - 0.06, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [k, k, k]); nPlants++; }
        else if (sl > 0.45 || r1 > 0.96) { const k = 0.86 + r3 * 0.24; pk[1].add(x, y0 - 0.25, z, r2 * TAU, 0.8 + r3 * 1.8, 0.6 + r2 * 1.3, [k, k * (0.97 + r2 * 0.05), k * (0.95 + r2 * 0.08)]); nPlants++; }
        if (nPlants >= maxS) break edge;
      }
      for (const RV of GAW.rv) { if (!RV.wide) continue; const a = RV.a;   // the river's boulders: on its banks and out in the shallows
        for (let k = 0; k < RV.n; k += 1) { const o = 4 * k, x0 = a[o], z0 = a[o + 1]; if (vrDist(x0, z0) > 300) continue; const k1 = Math.min(RV.n - 1, k + 1), tx = a[4 * k1] - x0, tz = a[4 * k1 + 1] - z0, tl = Math.hypot(tx, tz) || 1;
          for (let q = 0; q < 3; q++) { const u = (RS() * 2 - 1) * (a[o + 3] + 4), x = x0 - tz / tl * u, z = z0 + tx / tl * u, e = gaWat(x, z).e; if (e > 3 || e < -6 || excluded(x, z)) continue;
            const sc = 0.7 + RS() * 1.8, k2 = 0.82 + RS() * 0.25; pk[1].add(x, Math.max(gaGround(x, z), a[o + 2] - 0.3) - 0.3, z, RS() * TAU, sc, sc * 0.7, [k2, k2, k2 * 0.97]); nPlants++; } } }
    }
    {   // fallen logs and branches on the forest floor (the bush is full of them): grey, half sunk into the litter, within 70 m of the road
      const RL = rng(4179), lg = [0.56, 0.53, 0.48], lgD = [0.44, 0.41, 0.36];
      for (let s = 20; s < T.len - 20; s += 9) for (const side of [-1, 1]) { if (RL() > 0.45) continue;
        const [x, z] = onSide(s, side, 3 + Math.pow(RL(), 1.4) * 60); if (excluded(x, z) || vrNear(x, z).dd < 2.5 || gaWat(x, z).e > -2 || gaSlope(x, z) > 0.9) continue;
        const a = RL() * TAU, L = 3 + RL() * 7, r = 0.12 + RL() * 0.18, ca = Math.cos(a) * L / 2, sa = Math.sin(a) * L / 2, ya = gaGround(x - ca, z - sa), yb = gaGround(x + ca, z + sa), g = rare.get(x, z);
        ouRod(g, [x - ca, ya + r * 0.6, z - sa], [x + ca, yb + r * 0.6, z + sa], r, vary(RL() < 0.5 ? lg : lgD, RL, 0.12), 5);
        if (RL() < 0.4) { const t = 0.3 + RL() * 0.4, px = x - ca + 2 * ca * t, pz = z - sa + 2 * sa * t, py = lerp(ya, yb, t) + r; ouRod(g, [px, py, pz], [px + Math.sin(a) * 1.4, py + 0.5, pz - Math.cos(a) * 1.4], r * 0.4, lg, 3); }
      }
    }
    for (const k of [0, 1, 6, 7]) tk[k].addTo(root, k !== 7);
    for (const k of [0, 1]) pk[k].addTo(root, false);
    rare.addTo(root, pMat, true, true);

    /* ---- the road's cut batters and the steep slopes: outcrops of grey and ochre shale where the ground rises steep beside the road ---- */
    {
      const RV = rng(4181), rockC = [[0.6, 0.57, 0.52], [0.66, 0.58, 0.46], [0.54, 0.52, 0.5], [0.7, 0.6, 0.44], [0.58, 0.55, 0.5]];
      for (let s = 16; s < T.len - 16; s += 14) for (const side of [-1, 1]) {
        if (RV() < 0.4) continue;
        const [x, z] = onSide(s, side, 3 + RV() * 26); if (excluded(x, z) || vrNear(x, z).dd < 2.5 || gaWat(x, z).e > -3) continue;
        const sl = gaSlope(x, z); if (sl < 0.6) continue;
        const y = gaGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 1.2 + RV() * 2.6, qx = x + (RV() - 0.5) * 7, qz = z + (RV() - 0.5) * 7, qy = gaGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 0.8) continue;
          rock(g, qx, qy + r0 * 0.3, qz, r0, r0 * (0.5 + RV() * 0.5), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, 0.3, true); }
      }
    }

    /* ---- the view beyond the corridor ---- */
    const FAR = gaFarMesh(); if (FAR) { root.add(FAR.mesh); out.dyn.gaFar = FAR; }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: gaAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: gaAtlas2(), side: THREE.FrontSide, alphaTest: 0.5 }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, plants: nPlants, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, water: nWater, culverts: culverts.length, rails: +(nRail / (2 * N)).toFixed(3), sideRoads: out.stubStats.n };   // (read by the tests)
    return out;
  }

  Object.assign(API, { gaFarUpdate });   // (what World and the other worlds use of this one)
  World.ext.greatalpine = (scene, tex, opts) => buildGreatAlpine(scene, tex, opts);
})();
