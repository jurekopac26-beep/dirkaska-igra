/* =========================================================================
   WORLD — Ella (theme 'ella'): its own builder (World.ext.ella). What it uses of World comes from World.api: the helpers bound here once,
   the state that changes as API.<name>, the track being built and its theme (LOD, T) copied in at each build. Built on Vršič's corridor (vrPrep
   and Los Caracoles' terrain helpers caH / caGround read the same forms: def.dem, def.lc), as Dadès; the walls between the legs of the
   hairpins as the shared world of the passes builds them (js/world-prelaz.js: copied here, that file is not changed for this road).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    AB, Chunks, GB, IChunks, TAU, VRC, VRT, aPuff, aTier, aTrunk, atSf, box, brookMat, caCar, caGH, caGround, caSlope, caTileOn, clamp, crowdCtx,
    crowdFinish, crowdPut, crowdRun, cyl, gable, lerp, ouCutMat, parkOn, pkGroundMat, propFloorTable, rng, roadsideProps, rock, rpHash, sstep,
    valueNoise2, vary, vrDem, vrDist, vrFar, vrGritTex, vrLC, vrLCf, vrNear, vrPrep
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= ELLA (theme 'ella') =================
     The A23 from the valley at Pattiyakumbura up to Ella in the hill country of Sri Lanka (Uva Province): three hairpins and two sharp bends on a forested slope
     under Ella Rock, on a bright, humid morning. A look of its own: the ground's colours (eCol: the lush grass and the dark forest floor, the
     red laterite of the verges, the cuts and the yards, the grey gneiss of the bare faces, the bright green of the tea and the fields), the
     streams in their ravines (def.streams: Spa's brook shader, white where they fall steep, as the Kital Ella falls do; under the road through
     culverts with concrete headwalls and two bridges), the plants of the wet hills (eTreeGeo: broadleaf trees, tall grevilleas, areca and kitul
     palms, bananas, shrubs, tufts of grass), the houses, guesthouses and shops (def.bld: plastered walls in pastel colours under hipped roofs
     of red tile or sheet metal, a veranda in front; generic: no names or signs of any hotel, café or shop), the bus shelters (def.stops), the
     stalls by the road (def.poi), the masonry walls holding the legs of the hairpins, the low black-and-white parapets on the drops and round
     the bends, the chevrons, the viewpoint (def.views), three-wheelers parked at the finish, the land beyond the corridor (irFar: the forested
     hills, the rock faces, the plains far below). Only geographic names on the boards. */
  const ECOL = [0, 0, 0];
  let ST = null;   // the streams (def.streams, prepared at each build): points every ~4 m downstream, the water's level, e[k] 1 at a stream's last point; a hash of the segments
  const STC = 24, STN = { d: 1e9, lv: 0, k: -1 };
  function stNear(x, z) {   // the nearest stream within ~STC m: its distance and water level (relative to the start line), or d 1e9
    STN.d = 1e9; STN.k = -1; if (!ST) return STN;
    const L = ST.H.get(Math.floor(x / STC) * 65536 + Math.floor(z / STC)); if (!L) return STN;
    for (let q = 0; q < L.length; q++) { const k = L[q], ax = ST.x[k], az = ST.z[k], bx = ST.x[k + 1], bz = ST.z[k + 1], ux = bx - ax, uz = bz - az, ll = ux * ux + uz * uz || 1;
      const t = clamp(((x - ax) * ux + (z - az) * uz) / ll, 0, 1), dx = x - ax - ux * t, dz = z - az - uz * t, d = Math.sqrt(dx * dx + dz * dz);
      if (d < STN.d) { STN.d = d; STN.lv = ST.lv[k] + (ST.lv[k + 1] - ST.lv[k]) * t; STN.k = k; } }
    return STN;
  }
  function eCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map): the grass of the open slopes (lc 0) lush and green with drier golden patches,
    // the dark forest floor (lc 1), the scrub (lc 2), the red laterite of the yards (lc 3), bare grey gneiss (lc 4), tea in rows along the contours
    // (lc 6), the fields (lc 7); on the steep faces red earth and grey rock; the red laterite worn bare along the shoulder (dd: metres from it)
    const P = API.VR, A = h + P.D.base, f = P.n4(x, z), q = P.c2(x, z), m = P.c1(x, z);
    let R = 0.27, G = 0.4, B = 0.15;
    const lu = sstep(0.34, 0.12, q) * 0.45; R = lerp(R, 0.2, lu); G = lerp(G, 0.33, lu); B = lerp(B, 0.11, lu);   // (the lusher, darker hollows)
    const dry = sstep(0.6, 0.88, q) * 0.42; R = lerp(R, 0.46, dry); G = lerp(G, 0.45, dry); B = lerp(B, 0.2, dry);   // (the drier, golden patches of the grassland)
    const fo = vrLCf(x, z, 1) * 0.85; R = lerp(R, 0.19, fo); G = lerp(G, 0.26, fo); B = lerp(B, 0.11, fo);
    const sh = vrLCf(x, z, 2) * 0.7; R = lerp(R, 0.26, sh); G = lerp(G, 0.35, sh); B = lerp(B, 0.14, sh);
    const se = vrLCf(x, z, 3) * 0.55; R = lerp(R, 0.52, se); G = lerp(G, 0.37, se); B = lerp(B, 0.26, se);
    const te = vrLCf(x, z, 6); if (te > 0) { const rw = 0.5 + 0.5 * Math.sin(A * 1.3 + P.n2(x, z) * 2); R = lerp(R, lerp(0.2, 0.31, rw), te); G = lerp(G, lerp(0.37, 0.5, rw), te); B = lerp(B, lerp(0.11, 0.17, rw), te); }
    const fl = vrLCf(x, z, 7) * 0.85; if (fl > 0) { const pt = P.c5(x * 1.4, z * 1.4); R = lerp(R, lerp(0.34, 0.5, pt), fl); G = lerp(G, lerp(0.47, 0.48, pt), fl); B = lerp(B, lerp(0.16, 0.24, pt), fl); }
    const ba = Math.max(vrLCf(x, z, 4), sstep(0.7, 0.9, m) * 0.25); R = lerp(R, 0.42, ba); G = lerp(G, 0.4, ba); B = lerp(B, 0.37, ba);
    R += (f - 0.5) * 0.07; G += (f - 0.5) * 0.07; B += (f - 0.5) * 0.04;
    const st = sstep(0.7, 0.42, ny) * (dd < 30 ? 0.9 : 0.5) * (1 - 0.55 * fo);   // the steep faces: red earth of the cuts, the grey rock showing through
    if (st > 0) { const gn = sstep(0.5, 0.8, P.c3(x, z)), k = 0.9 + 0.12 * P.n2(x * 2, z * 2);
      R = lerp(R, lerp(0.48, 0.4, gn) * k, st); G = lerp(G, lerp(0.31, 0.38, gn) * k, st); B = lerp(B, lerp(0.22, 0.35, gn) * k, st); }
    if (dd < 1.6) { const t = sstep(1.6, 0.1, dd) * 0.55; R = lerp(R, 0.5, t); G = lerp(G, 0.33, t); B = lerp(B, 0.23, t); }   // (the red laterite worn bare beside the shoulder)
    ECOL[0] = R; ECOL[1] = G; ECOL[2] = B; return ECOL;
  }
  function eGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (as caGCol, coloured by eCol)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = eCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function eTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by eCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = eCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
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
  function eFarCol(A, sl, q) {   // the land beyond the corridor (irFar): forested hills, tea paler on the gentler upper slopes, grey rock on the steepest faces, the plains below hazier and drier
    const rk = sstep(0.55, 1.05, sl) * 0.75, tea = sstep(0.32, 0.12, sl) * sstep(850, 1100, A) * 0.45, low = sstep(560, 300, A) * 0.55;
    let c = [0.22 + q * 0.05, 0.32 + q * 0.05, 0.14 + q * 0.02];
    c = [lerp(c[0], 0.33, tea), lerp(c[1], 0.46, tea), lerp(c[2], 0.17, tea)];
    c = [lerp(c[0], 0.5, rk), lerp(c[1], 0.49, rk), lerp(c[2], 0.46, rk)];
    return [lerp(c[0], 0.42, low), lerp(c[1], 0.45, low), lerp(c[2], 0.27, low)];
  }
  let eATex = null, eAKey = '', eA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function eAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, Ella's board at the finish, the race's banner
    const key = cps.join('|') + '|' + finA; if (eATex && eAKey === key) return eATex;
    if (eATex) eATex.dispose(); eAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(262, 142, 500, 100); txt('FINISH', 512, 196, 92, '#111', 470);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#7a1f2b'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,214,90,0.95)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd25a', 520); });
    x.fillStyle = '#1f5a3a'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f2ecd8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('ELLA', 512, 812, 60, '#f6f1e2', 900); txt(finA, 512, 862, 46, '#f6f1e2', 900);
    x.fillStyle = '#7a1f2b'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#e8a628'; x.fillRect(0, 956, 1024, 8);
    txt('ELLA · UVA', 512, 930, 52, '#fff', 980); txt('A23 · 3 HAIRPINS', 512, 994, 44, '#ffd25a', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (eATex = t);
  }
  const E_BOARDS = [['ELLA', '#1d4f9a'], ['WELLAWAYA', '#1d4f9a'], ['BANDARAWELA', '#1d4f9a'], ['VIEWPOINT', '#6b4a22'], ['DANGEROUS BENDS', '#f2f0ea'], ['SLOW', '#f2f0ea'], ['ELLA ROCK', '#6b4a22'], ['PASSARA', '#1d4f9a']];
  function eAtlas2() {   // the small signs: cells 30-31 the chevrons (black on yellow, pointing the way the road turns); rows 4-7, the place boards (two a row, 512 x 128)
    if (eA2Tex) return eA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (const [k, dir] of [[30, 1], [31, -1]]) {
      const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128; x.fillStyle = '#f2c21c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#141414';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    E_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, warn = bg === '#f2f0ea';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = warn ? '#c8261c' : '#f2f2ee'; x.lineWidth = warn ? 12 : 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, 52, warn ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (eA2Tex = t);
  }
  // a frond or a leaf of the soft plants (AB): from its base along a, rising, then drooping to its tip; both its faces (lit from above)
  function aFrond(b, cx, cy, cz, a, L, lift, droop, wd, col, tip) {
    const ux = Math.cos(a), uz = Math.sin(a), px = -uz * wd, pz = ux * wd, mx = cx + ux * L * 0.5, mz = cz + uz * L * 0.5, my = cy + lift, up = 0.8, k = Math.hypot(0.25, up);
    const i0 = b.v(cx, cy, cz, ux * 0.25 / k, up / k, uz * 0.25 / k, col), i1 = b.v(mx + px, my, mz + pz, 0, 1, 0, col), i2 = b.v(mx - px, my, mz - pz, 0, 1, 0, col), i3 = b.v(cx + ux * L, cy + lift - droop, cz + uz * L, ux * 0.3, 0.95, uz * 0.3, tip);
    const above = [mx, my + 1, mz], below = [mx, my - 1, mz];
    b.t(i0, i1, i3, below); b.t(i0, i3, i2, below); b.t(i0, i1, i3, above); b.t(i0, i3, i2, above);
  }
  function eTreeGeo(kind) {   // unit plants (height 1; the instances scale and tint them) in the soft look A (AB, docs/drevesa-a.md): 0 a broadleaf tree of the
    // forest (a jak or a mango: a dark, dense crown of three clumps), 1 a tall grevillea or eucalyptus (a pale trunk, an airy grey-green crown in
    // tiers), 2 a palm (an areca or a kitul: a slim ringed trunk, a crown of arching fronds), 3 a banana (a short green stem, broad drooping
    // leaves), 4 a shrub (a low rounded clump), 5 a tuft of tall grass or fern
    const b = new AB(), R = rng(980 + kind), sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    if (kind === 0) {   // (41 vertices)
      aTrunk(b, 0, -0.02, 0, 0.045, 0.45, 4, [0.3, 0.24, 0.18]);
      const cs = [0.15, 0.29, 0.1]; aPuff(b, 0, 0.66, 0, 0.36, 0.7, cs, R, 0.3, 0.55, 1.25); aPuff(b, 0.24, 0.56, 0.12, 0.27, 0.72, sh(cs, 1.08), R, 0.3, 0.55, 1.25, -0.3);
      aPuff(b, -0.22, 0.58, -0.14, 0.27, 0.72, sh(cs, 0.94), R, 0.3, 0.55, 1.25, -0.3);
    } else if (kind === 1) {   // (41 vertices)
      aTrunk(b, 0, -0.02, 0, 0.022, 0.72, 4, [0.72, 0.68, 0.6], 0.012);
      const cs = [0.27, 0.36, 0.18]; aPuff(b, 0.02, 0.86, 0, 0.13, 1.1, cs, R, 0.35, 0.6, 1.3); aPuff(b, -0.05, 0.66, 0.04, 0.15, 0.9, sh(cs, 1.06), R, 0.35, 0.6, 1.3, -0.3);
      aPuff(b, 0.06, 0.48, -0.04, 0.12, 0.9, sh(cs, 0.95), R, 0.35, 0.6, 1.3, -0.3);
    } else if (kind === 2) {   // (37 vertices)
      aTrunk(b, 0, -0.02, 0, 0.026, 0.86, 4, [0.55, 0.5, 0.42], 0.018);
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + R() * 0.4; aFrond(b, 0, 0.86, 0, a, 0.34 + R() * 0.08, 0.07, 0.22, 0.05, k % 2 ? [0.24, 0.38, 0.13] : [0.3, 0.44, 0.16], [0.42, 0.48, 0.24]); }
    } else if (kind === 3) {   // (29 vertices)
      aTrunk(b, 0, -0.02, 0, 0.07, 0.5, 4, [0.4, 0.46, 0.22], 0.05);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R() * 0.5; aFrond(b, 0, 0.48, 0, a, 0.48 + R() * 0.1, 0.28, 0.34, 0.11, k % 3 ? [0.4, 0.56, 0.16] : [0.46, 0.6, 0.2], [0.5, 0.52, 0.24]); }
    } else if (kind === 4) {   // (24 vertices)
      const cs = [0.24, 0.38, 0.13]; aPuff(b, 0, 0.42, 0, 0.55, 0.75, cs, R, 0.4, 0.6, 1.3); aPuff(b, 0.32, 0.32, 0.14, 0.34, 0.8, sh(cs, 1.1), R, 0.4, 0.6, 1.3, -0.3);
    } else {   // (12 vertices)
      const cs = [0.42, 0.5, 0.2], tp = [0.62, 0.62, 0.32];
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + R() * 0.6, d = k ? 0.16 : 0; aTier(b, Math.cos(a) * d, 0, Math.sin(a) * d, 0.24, 1 - d * 0.8, 3, cs, tp, a); }
    }
    return b.geometry();
  }
  function hipRoof(g, cx, cy, cz, L, D, h, rot, col) {   // a hipped roof (its eaves at cy): the long slopes and the two ends, the far slope a shade darker
    const c = Math.cos(rot), s = Math.sin(rot), P = (lx, ly, lz) => [cx + lx * c - lz * s, cy + ly, cz + lx * s + lz * c], r = Math.max(0, (L - D) / 2);
    const b0 = P(-L / 2, 0, -D / 2), b1 = P(L / 2, 0, -D / 2), b2 = P(L / 2, 0, D / 2), b3 = P(-L / 2, 0, D / 2), r0 = P(-r, h, 0), r1 = P(r, h, 0), inn = [cx, cy + h * 0.3, cz], c2 = [col[0] * 0.9, col[1] * 0.9, col[2] * 0.9];
    g.quadO(b0, b1, r1, r0, col, inn); g.quadO(b2, b3, r0, r1, c2, inn); g.triO(b1, b2, r1, c2, inn); g.triO(b3, b0, r0, col, inn);
  }
  // a three-wheeler (generic: no make, no signs): the cab in one colour, the black canvas top, its single front wheel; front +x along rot
  const TK_BLACK = [0.08, 0.08, 0.09], TK_GLASS = [0.46, 0.56, 0.64];
  function tukTuk(g, x, y, z, rot, col) {
    const c = Math.cos(rot), s = Math.sin(rot), at = (u, v) => [x + c * u - s * v, z + s * u + c * v], dk = [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8];
    let p = at(-0.35, 0); box(g, p[0], y + 0.26, p[1], 1.5, 0.66, 1.3, rot, col, dk);
    p = at(0.75, 0); box(g, p[0], y + 0.28, p[1], 0.72, 0.74, 0.8, rot, col, col);
    p = at(-0.1, 0); box(g, p[0], y + 1.52, p[1], 2.0, 0.12, 1.32, rot, TK_BLACK);
    p = at(-1.04, 0); box(g, p[0], y + 0.92, p[1], 0.08, 0.62, 1.3, rot, TK_BLACK);
    p = at(0.9, 0); box(g, p[0], y + 1.02, p[1], 0.06, 0.5, 0.96, rot, TK_GLASS);
    for (const [u, v] of [[-0.6, -0.6], [-0.6, 0.6], [0.95, 0]]) { p = at(u, v); box(g, p[0], y, p[1], 0.46, 0.46, 0.14, rot, TK_BLACK, null, true); }
  }
  // the knockable roadside posts: white with a black top
  function eProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }

  function buildElla(scene, tex, opts) {
    const R = rng(5813), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.6, 0.42, 0.3] };
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS;
    P.c1 = valueNoise2(931, 150); P.c2 = valueNoise2(932, 64); P.c3 = valueNoise2(933, 90); P.c4 = valueNoise2(934, 120); P.c5 = valueNoise2(935, 26);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the streams (def.streams: [x, z, ...] each, as OSM draws them): points every ~4 m, the water's level from the ground model (smoothed, never
    // rising downstream), a hash of the segments
    ST = null;
    { const X = [], Z = [], LV = [], E = [];
      for (const p of def.streams || []) {
        if (p.length < 4) continue; const xs = [], zs = [];
        for (let k = 0; k + 3 < p.length; k += 2) { const ax = p[k], az = p[k + 1], bx = p[k + 2], bz = p[k + 3], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4));
          for (let q = 0; q < n; q++) { xs.push(ax + (bx - ax) * q / n); zs.push(az + (bz - az) * q / n); } }
        xs.push(p[p.length - 2]); zs.push(p[p.length - 1]);
        const n = xs.length, h = xs.map((x, k) => vrDem(x, zs[k])), hs = h.map((v, k) => { let s = 0, c = 0; for (let q = Math.max(0, k - 2); q <= Math.min(n - 1, k + 2); q++) { s += h[q]; c++; } return s / c; });
        if (hs[0] < hs[n - 1]) { xs.reverse(); zs.reverse(); hs.reverse(); }   // (downstream: the way the water falls)
        for (let k = 1; k < n; k++) hs[k] = Math.min(hs[k], hs[k - 1]);
        for (let k = 0; k < n; k++) { X.push(xs[k]); Z.push(zs[k]); LV.push(hs[k] - 0.5); E.push(k === n - 1 ? 1 : 0); }
      }
      if (X.length > 1) { const n = X.length, H = new Map(), S = { x: Float32Array.from(X), z: Float32Array.from(Z), lv: Float32Array.from(LV), e: Uint8Array.from(E), n, H };
        for (let k = 0; k < n - 1; k++) { if (S.e[k]) continue;
          const a0 = Math.floor((Math.min(X[k], X[k + 1]) - STC) / STC), a1 = Math.floor((Math.max(X[k], X[k + 1]) + STC) / STC), b0 = Math.floor((Math.min(Z[k], Z[k + 1]) - STC) / STC), b1 = Math.floor((Math.max(Z[k], Z[k + 1]) + STC) / STC);
          for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) { const kk = a * 65536 + b; let L = H.get(kk); if (!L) H.set(kk, L = []); L.push(k); } }
        ST = S; }
    }
    // the bridges (def.bridges: [from, to] after the start line): their samples
    const onBr = new Uint8Array(N);
    for (const [a, b] of def.bridges || []) for (let s = sStart + a - 3; s <= sStart + b + 3; s += T.ds / 2) onBr[T.idx(s)] = 1;
    const inGul = (x, z, m) => { for (const b of P.gul) { const dx = x - b.x, dz = z - b.z; if (Math.abs(dx * b.tx + dz * b.tz) < b.half + (m || 0) && Math.abs(dx * b.nx + dz * b.nz) < 34) return b; } return null; };
    // the buildings (def.bld: the houses, guesthouses and shops of the villages, Ella's at the finish): clear of the road and the streams; the long ones in two blocks
    const blds = [];
    for (const b of def.bld || []) {
      let [x, z, L, W, ang, kind, lv] = b; W = Math.min(W, 16); if (L < 3.5 || W < 3) continue; if (vrDist(x, z) > 285) continue;
      const parts = L > 32 ? [[-L / 4, L / 2 - 1.5], [L / 4, L / 2 - 1.5]] : [[0, L]];
      for (const [o, Lp] of parts) {
        const c = Math.cos(ang), s = Math.sin(ang), cx = x + c * o, cz = z + s * o;
        const clear = () => { for (const [u, v] of [[0, 0], [-Lp / 2, -W / 2], [Lp / 2, -W / 2], [Lp / 2, W / 2], [-Lp / 2, W / 2]]) { const px = cx + c * u - s * v, pz = cz + s * u + c * v, nn = vrNear(px, pz);
          if ((nn.i >= 0 && nn.dd < 2.2) || stNear(px, pz).d < 5) return false; } return true; };
        if (clear()) blds.push({ x: cx, z: cz, L: Lp, W, ang, kind, lv, d: vrDist(cx, cz) });
      }
    }
    // the level plots: the viewpoint beside the road (def.views within ~25 m of it), the car parks (def.parks), the cars' park past the finish
    const views = [], parks = [];
    for (const [x, z] of def.views || []) { const n = vrNear(x, z); if (n.i < 0 || n.dd > 25) continue; const i = n.i, s = i * T.ds; if (s < sStart + 20 || s > sFin - 20) continue;
      const pad = { x, z, r: 6, b: 8, h: T.hy[i] - 0.15, i }; P.pads.push(pad); views.push(pad); }
    for (const [x, z, r] of def.parks || []) { const n = vrNear(x, z); if (n.i < 0 || n.dd > 30) continue; const i = n.i;
      const pad = { x, z, r: Math.max(5, Math.min(r, 12)), b: 10, h: T.hy[i] - 0.2, i }; P.pads.push(pad); parks.push(pad); }
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 14, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 60, 11); P.pads.push(padF);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees and buildings between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the rocks, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2);
    for (const p of views) exclPush(p.x, p.z, p.r + 2);
    for (const p of parks) exclPush(p.x, p.z, p.r + 2);
    exclPush(padF.x, padF.z, padF.r + 4);
    out.marks = {}; if (views.length) out.marks.view = [views[0].x, views[0].z];   // (where the landmarks stand: the tests look for them)

    /* ---- the retaining walls between the legs of the hairpins (as js/world-prelaz.js builds them): the game's road is wider than the real one
       (9 m against ~6 m), so where two legs lie close the lower one's barrier comes within a few metres of the upper one's and the climb between
       them falls in between: the terrain's 5 m grid could only draw that as a sheer face over jagged teeth. There a masonry wall stands under
       the upper verge's edge (bar + 0.42), battered 1 in 20, its foot on a level shelf at the lower leg's height; the terrain kept down to the
       shelf from under the upper verge out to the lower leg's barrier (API.caBank in caH). bk[si][i]: { p: [[offset, height above the road]
       top, foot], o1: where the shelf ends, hl: the lower leg's height } or null. The streams' ravines are carved by the same hook (eBank) ---- */
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
    const eBank = (x, z, h) => {
      const Lq = BKH.get(Math.floor(x / BKC) * 65536 + Math.floor(z / BKC));
      if (Lq) for (let q = 0; q < Lq.length; q++) { const si = Lq[q] >= N ? 1 : 0, i = Lq[q] - si * N, side = si ? 1 : -1, b = bk[si][i], dx = x - T.px[i], dz = z - T.pz[i];
        if (Math.abs(dx * T.tx[i] + dz * T.tz[i]) > T.ds * 0.75) continue;
        const o = (dx * T.nx[i] + dz * T.nz[i]) * side; if (o < b.p[0][0] - 6 || o > b.o1) continue;
        if (b.hl - 0.35 < h) h = b.hl - 0.35; }
      const r = stNear(x, z);   // a stream's ravine: a channel ~2.5 m across at the water, its banks rising 1 in 2 (none by the road: it passes under in a culvert)
      if (r.k >= 0 && r.d < 16) { const f = sstep(w + 5, w + 13, vrDist(x, z)); if (f > 0) { const t = r.lv - 0.3 + Math.max(0, r.d - 1.2) * 0.55; if (t < h && h - r.lv < 9) h = lerp(h, t, f); } }
      return h; };
    API.caBank = { T, f: eBank };

    /* ---- terrain tiles; the streams' water in their ravines (Spa's brook shader: it flows, white where it runs steep), under each bridge across
       the gully; the culverts' headwalls where a stream passes under the road ---- */
    let nFar = 0, nWater = 0; const culv = [];
    const tMat = pkGroundMat();
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(eTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }
    {
      const wg = new Chunks(160, true), cDeep = [0.05, 0.075, 0.06], cShal = [0.11, 0.125, 0.09];   // (unmapped: about half of the grit-mapped ground's brightness for the same colour)
      const latOf = (x, z) => { const n = vrNear(x, z); if (n.i < 0 || n.d > 40) return null; const i = n.i; return { i, dd: n.dd, lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };
      const rib = (g, ax, az, bx, bz, ya, yb, hw, d0, d1, sl) => { const l = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / l, nz = (bx - ax) / l, S2 = 2 * Math.round(clamp(sl, 0, 1) * 10);
        const pa = (u) => [ax + nx * u, ya, az + nz * u], pb = (u) => [bx + nx * u, yb, bz + nz * u];
        g.quadUp(pa(-hw), pa(0), pb(0), pb(-hw), [cShal, cDeep, cDeep, cShal], [[S2, d0], [S2 + 0.5, d0], [S2 + 0.5, d1], [S2, d1]]);
        g.quadUp(pa(0), pa(hw), pb(hw), pb(0), [cDeep, cShal, cShal, cDeep], [[S2 + 0.5, d0], [S2 + 1, d0], [S2 + 1, d1], [S2 + 0.5, d1]]); nWater++; };
      if (ST) { let dist = 0;
        for (let k = 0; k < ST.n - 1; k++) {
          if (ST.e[k]) { dist = 0; continue; }
          const ax = ST.x[k], az = ST.z[k], bx = ST.x[k + 1], bz = ST.z[k + 1], l = Math.hypot(bx - ax, bz - az) || 1, d0 = dist; dist += l;
          if (vrDist(ax, az) > 300) continue;
          const la = latOf(ax, az), lb = latOf(bx, bz);
          if (la && lb && Math.abs(la.i - lb.i) < 12 && Math.sign(la.lat) !== Math.sign(lb.lat) && !onBr[la.i]) culv.push({ i: la.i });
          if ((la && la.dd < 5) || (lb && lb.dd < 5) || inGul(ax, az, 14) || inGul(bx, bz, 14)) continue;   // (by the road: in the culvert, or under a bridge: below)
          const ya = caGround(ax, az), yb = caGround(bx, bz); if (ya > ST.lv[k] + 1.2 || yb > ST.lv[k + 1] + 1.2) continue;   // (only in its ravine)
          rib(wg.get(ax, az), ax, az, bx, bz, ya + 0.1, yb + 0.1, 0.6, d0 / 2, dist / 2, sstep(0.12, 0.45, (ST.lv[k] - ST.lv[k + 1]) / l));   // (white only where it falls steeply)
          if (k % 2 === 0) exclPush(ax, az, 1.4);
        }
      }
      for (const b of P.gul) {   // under each bridge: the water across the gully's floor (only where the floor is level across: not up its banks)
        const hw = Math.max(1.2, b.bw * 0.32); let prev = null;
        for (let u = -34; u <= 34; u += 4) { const x = b.x + b.nx * u, z = b.z + b.nz * u, y = caGround(x, z) + 0.1;
          const flat = Math.abs(caGround(x + b.tx * hw, z + b.tz * hw) - caGround(x - b.tx * hw, z - b.tz * hw)) < 0.6;
          if (prev && prev[3] && flat && Math.abs(y - prev[2]) < 2.4) rib(wg.get(x, z), prev[0], prev[1], x, z, prev[2], y, hw, (u + 30) / 2, (u + 34) / 2, Math.min(0.45, Math.abs(y - prev[2]) / 4 / 0.25));
          prev = [x, z, y, flat]; }
        exclPush(b.x, b.z, b.half + 4);
      }
      out.dyn.brook = { uT: { value: 0 } }; wg.addTo(root, brookMat(out.dyn.brook), false, true);
      if (P.gul.length) out.marks.bridge = [P.gul[0].x, P.gul[0].z];
    }

    /* ---- the road: asphalt with a dashed white centre line (solid through the hairpins) and white edge lines, a gravel shoulder, then the verge
       (worn red earth beside the shoulder, then grass) out to a ditch past the barrier line (a concrete drain where the slope rises beside it); where the ground falls far below,
       the stone retaining wall that holds the road (its face out over the drop); by a leg below, the wall's coping, then the bank; on the
       bridges the deck's edge (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.5;
    const gAt = (i, side, o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - T.hy[i]; };
    const deck = (i, side) => onBr[i] && gAt(i, side, (side > 0 ? T.br[i] : T.bl[i]) + 0.5) < -1.5;
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w, lift = (o, h) => [o, Math.max(h, gAt(i, side, o) + 0.05)];   // (six points out from the shoulder)
      if (deck(i, side)) return [[e + sw, -0.02], [bar + 0.1, -0.035], [bar + 0.3, -0.04], [bar + 0.5, -0.05], [bar + 0.5, -1.25], [bar + 0.15, -1.3]];   // (a bridge: the deck's edge)
      if (bk[side > 0 ? 1 : 0][i]) return [[e + sw, -0.02], [bar + 0.2, -0.04], [bar + 0.2, -0.04], [bar + 0.42, -0.08], [bar + 0.42, -0.08], [bar + 0.42, -0.08]];   // (a bank down to the leg below: the verge, the wall's coping, then the bank)
      if (gAt(i, side, bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.2, -0.04], [bar + 0.2, -0.04], [bar + 0.42, -0.05], [bar + 0.42, gAt(i, side, bar + 0.42) - 0.08], [bar + 1.9, gAt(i, side, bar + 1.9) + 0.03]];   // (a retaining wall: the verge, its coping flush with it, its face down to the ground)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.3, Math.min(e + sw + 1.2, bar - 1.0)), -0.06), lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(i, side, bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(i, side, bar + 1.9) + 0.03]]; };   // (the verge: worn earth, grass; the ditch)
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    const hairS = (def.curves || []).map(([d]) => sStart + d);
    let nWall = 0;
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.8 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.86) k -= 0.05; k *= 0.96 + 0.08 * P.n2(T.px[i] * 0.5 + o, T.pz[i] * 0.5); return [k, k, k * 0.98]; };
      const wht = [0.94, 0.93, 0.88], gc = [0.56, 0.44, 0.36], wallC = [0.42, 0.4, 0.36], copeC = [0.6, 0.58, 0.54], conc = [0.64, 0.63, 0.6];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i], up = gAt(i, side, bar + 1.9) > 0.35;
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (deck(i, side)) { const q = (k < 3 ? 0.58 : 0.95) * (0.92 + 0.1 * rpHash(i >> 2, 81 + si)); return [conc[0] * q, conc[1] * q, conc[2] * q]; }   // (the deck's weathered top, its edge paler)
          if (bk[si][i] && k >= 2) { const q = 0.92 + 0.12 * rpHash(i >> 2, 61 + si); return k < 4 ? [copeC[0] * q, copeC[1] * q, copeC[2] * q] : [wallC[0] * q, wallC[1] * q, wallC[2] * q]; }
          const wl = vp[si][i][4][1] < -2.6; if (wl && k >= 2 && k <= 4) { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si); return k < 4 ? [copeC[0] * q, copeC[1] * q, copeC[2] * q] : [wallC[0] * 0.85 * q, wallC[1] * 0.85 * q, wallC[2] * 0.85 * q]; }
          if (up && !bk[si][i] && (k === 2 || k === 3)) { const q = (k === 3 ? 0.72 : 0.95) * (0.94 + 0.08 * rpHash(i >> 2, 91 + si)); return [conc[0] * q, conc[1] * q, conc[2] * q]; }   // (the concrete drain on the cut's side)
          if (k === 5) return eGCol(x, z);
          const sl = k === 3 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return eCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - w - sw)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      const solid = (s) => hairS.some(h => Math.abs(s - h) < 55), dashOn = (s) => solid(s) || (s % 9) < 3;
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true), gw = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          if (i * T.ds > 3 && j < N - 2) {
            if (dashOn(i * T.ds)) gl.quadUp(Pt(i, -0.07, 0.036), Pt(i, 0.07, 0.036), Pt(j, 0.07, 0.036), Pt(j, -0.07, 0.036), [wht, wht, wht, wht]);
            for (const sd of [-1, 1]) { const a = sd * (w - 0.32), b = sd * (w - 0.2); gl.quadUp(Pt(i, Math.min(a, b), 0.034), Pt(i, Math.max(a, b), 0.034), Pt(j, Math.max(a, b), 0.034), Pt(j, Math.min(a, b), 0.034), [wht, wht, wht, wht]); }
          }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 5; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 3 && (qi[4][1] < -2.6 || qj[4][1] < -2.6) && !bk[si][i] && !deck(i, side)) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[4][1], qj[4][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face: out, over the drop)
              else if (k >= 3 && deck(i, side)) gv.quadO(a, b, c, d, null, Pt(i, 0, 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the deck's edge and its underside)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
            const bi = bk[si][i], bj = bk[si][j];   // the wall down to the leg below: its battered face from the coping to the shelf, the shelf out to the lower barrier
            if (bi && bj) { const top = (q, b2) => Pt(q, side * b2.p[0][0], b2.p[0][1]), foot = (q, b2) => Pt(q, side * b2.p[1][0], b2.p[1][1]), A = top(i, bi), B = top(j, bj), C = foot(j, bj), D = foot(i, bi);
              const q = 0.9 + 0.14 * rpHash(i >> 1, 71 + si), wc2 = [wallC[0] * q, wallC[1] * q, wallC[2] * q], dk = [wallC[0] * 0.78 * q, wallC[1] * 0.78 * q, wallC[2] * 0.78 * q];
              gw.quadO(A, B, C, D, null, Pt(i, 0, -bi.p[1][1] * 0.2 - 1), [wuv(A), wuv(B), [B[0] / 10, -(B[2]) / 10 + 0.4], [A[0] / 10, -(A[2]) / 10 + 0.4]], [wc2, wc2, dk, dk]);
              const E = Pt(i, side * bi.o1, -(T.hy[i] - bi.hl) - 0.32), F = Pt(j, side * bj.o1, -(T.hy[j] - bj.hl) - 0.32), sc = [0.3, 0.36, 0.17];
              gw.quadUp(D, C, F, E, [sc, sc, sc, sc], [wuv(D), wuv(C), wuv(F), wuv(E)]); nWall++; }
          }
        }
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat); addM(gw, gMat);
      }
      const gq = new GB(true), gw2 = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];   // chequered start and finish lines, a white line at each checkpoint
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw2.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw2, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.94, 0.94, 0.92], [0.86, 0.2, 0.18], [0.2, 0.42, 0.7], [0.95, 0.72, 0.18], [0.22, 0.5, 0.32], [0.62, 0.22, 0.44], [0.14, 0.15, 0.2], [0.9, 0.55, 0.3], [0.48, 0.7, 0.88], [0.8, 0.8, 0.74]];
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => stNear(x, z).d < 3, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a place board of the second atlas: [v0, v1, u0, u1]
    const signAt = (s, side, k, o) => { const [bx, bz, bi] = onSide(s, side, o || 1.4); if (excluded(bx, bz)) return;   // a place board on a post, facing the cars coming up
      const by = caGround(bx, bz), [v0, v1, u0, u1] = board(k); box(scen.get(bx, bz), bx, by - 0.2, bz, 0.1, 2.6, 0.1, T.hd[bi], [0.6, 0.61, 0.63]); bannerQ(bx, by + 1.7, bz, -T.tx[bi], -T.tz[bi], 3.2, 0.8, v0, v1, u0, u1, ban2); exclPush(bx, bz, 2); };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const carCols = [[0.92, 0.92, 0.9], [0.62, 0.62, 0.6], [0.16, 0.16, 0.18], [0.7, 0.1, 0.1], [0.82, 0.78, 0.66], [0.22, 0.32, 0.5], [0.95, 0.95, 0.94]];
    const tukCols = [[0.5, 0.12, 0.14], [0.14, 0.38, 0.22], [0.16, 0.3, 0.58], [0.86, 0.64, 0.12], [0.62, 0.62, 0.6], [0.74, 0.14, 0.12], [0.1, 0.22, 0.42]];
    const pastel = [[0.93, 0.89, 0.76], [0.94, 0.93, 0.89], [0.93, 0.84, 0.56], [0.64, 0.79, 0.86], [0.68, 0.83, 0.64], [0.92, 0.72, 0.64], [0.8, 0.73, 0.86], [0.86, 0.68, 0.44], [0.96, 0.95, 0.9]];

    /* ---- the buildings: plastered walls in pastel colours on a darker plinth, under hipped roofs (some gabled) of red clay tile or sheet metal
       (grey, rusty, painted green or maroon) with deep eaves; the houses near the road with a veranda in front, the guesthouses and shops of two
       storeys with a balcony's band between the floors; a shrine white under an orange roof; small dark windows on the side to the road ---- */
    let nBld = 0;
    {
      const RB = rng(5821), tile = [[0.62, 0.27, 0.18], [0.7, 0.33, 0.2], [0.56, 0.24, 0.17]], metal = [[0.55, 0.56, 0.58], [0.5, 0.33, 0.24], [0.24, 0.4, 0.3], [0.48, 0.18, 0.16]], win = [0.13, 0.12, 0.11], plinth = [0.34, 0.31, 0.3], wood = [0.36, 0.22, 0.14];
      for (const b of blds) {
        const c = Math.cos(b.ang), s = Math.sin(b.ang), near = b.d < 75; let lo = 1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) lo = Math.min(lo, caGround(b.x + c * u - s * v, b.z + s * u + c * v));
        const g = scen.get(b.x, b.z), shrine = b.kind === 1, tall = b.kind === 5 || b.lv >= 2 || (b.L * b.W > 160 && RB() < 0.35), fl = b.lv >= 3 ? 3 : tall ? 2 : 1, H = fl * 3.0 + 0.2;
        const col = shrine ? [0.95, 0.94, 0.9] : vary(pastel[Math.floor(RB() * pastel.length)], RB, 0.04), dk = [col[0] * 0.88, col[1] * 0.88, col[2] * 0.88];
        const roofC = shrine ? [0.8, 0.42, 0.16] : vary(RB() < 0.55 || b.kind === 5 ? tile[Math.floor(RB() * tile.length)] : metal[Math.floor(RB() * metal.length)], RB, 0.05);
        box(g, b.x, lo - 1.2, b.z, b.L + 0.1, 1.6, b.W + 0.1, b.ang, plinth, plinth, true);   // (the plinth, down into the slope)
        box(g, b.x, lo + 0.4, b.z, b.L, H - 0.4, b.W, b.ang, col, dk, true);
        if (fl > 1) for (let f = 1; f < fl; f++) box(g, b.x, lo + f * 3.0, b.z, b.L + 0.5, 0.22, b.W + 0.5, b.ang, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], null, false);   // (the floors' slabs, a balcony's ledge)
        const rh = Math.min(b.W, 10) * 0.24 + 0.4, ov = 0.55;
        if (RB() < 0.75 || shrine) hipRoof(g, b.x, lo + H, b.z, b.L + 2 * ov, b.W + 2 * ov, rh, b.ang, roofC); else gable(g, b.x, lo + H, b.z, b.L + 2 * ov, b.W + 2 * ov, rh, b.ang, roofC, dk);
        if (near) {
          for (let f = 0; f < fl; f++) for (const sd of [-1, 1]) for (let u = -b.L / 2 + 1.6; u < b.L / 2 - 1.2; u += 3.2) {   // the windows
            const px = b.x + c * u - s * (sd * (b.W / 2 + 0.02)), pz = b.z + s * u + c * (sd * (b.W / 2 + 0.02));
            box(g, px, lo + 1.2 + f * 3.0, pz, 0.9, 1.1, 0.1, b.ang, win, win, true); }
          if (!tall && !shrine && b.d < 45 && b.L > 6 && RB() < 0.6) {   // a veranda along the long side to the road: its lean-to roof on slim posts
            const sd = ((T.px[T.nearestIdx(b.x, b.z)] - b.x) * -s + (T.pz[T.nearestIdx(b.x, b.z)] - b.z) * c) > 0 ? 1 : -1, vd = 2.0, ox = -s * sd * (b.W / 2 + vd / 2), oz = c * sd * (b.W / 2 + vd / 2);
            box(g, b.x + ox, lo + 2.45, b.z + oz, b.L - 0.6, 0.12, vd + 0.4, b.ang, roofC, roofC);
            for (const u of [-b.L / 2 + 0.6, 0, b.L / 2 - 0.6]) box(g, b.x + ox + c * u - s * sd * vd / 2, lo, b.z + oz + s * u + c * sd * vd / 2, 0.14, 2.45, 0.14, b.ang, wood);
            box(g, b.x + ox, lo - 0.3, b.z + oz, b.L - 0.4, 0.42, vd + 0.4, b.ang, [0.58, 0.4, 0.3], [0.62, 0.44, 0.34], true);   // (its floor of red cement)
          }
        }
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++;
      }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- START (at Pattiyakumbura, on the valley's side): gantry with the start lights, the timing hut, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut: plastered, under a metal roof
      box(gh, hx, hy - 0.4, hz, 4.0, 3.1, 2.8, T.hd[i], [0.93, 0.89, 0.76], [0.82, 0.78, 0.66]); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.26, 0.3], null, true);
      hipRoof(gh, hx, hy + 2.7, hz, 4.8, 3.6, 0.9, T.hd[i], [0.55, 0.56, 0.58]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
      signAt(sStart + 70, -1, 4);   // DANGEROUS BENDS
      signAt(sStart - 60, 1, 1);   // WELLAWAYA (behind, for the cars coming down)
      signAt(sStart + 150, -1, 0);   // ELLA ahead
    }

    /* ---- the checkpoints: a maroon gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.92, 0.92, 0.9], [0.48, 0.12, 0.17]));

    /* ---- FINISH (below the town): chequered gantry, Ella's board, the cars' park with cars and three-wheelers, people about; the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 18, sdP, 3.2), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // Ella's board: on posts, leaning back
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.36, 0.24, 0.14]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.5, 0.48, 0.45], [0.58, 0.56, 0.52]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 5);
      signAt(sFin + 120, -sdP, 7);   // PASSARA ahead
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 10; k++) { const a = -12 + (k % 5) * 6, b = (k < 5 ? -4.5 : 4.5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || k === 2 || k === 7) continue;
        if (k % 3 === 1) tukTuk(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(tukCols[k % tukCols.length], R, 0.1));
        else parkOn(caCar, caGround, 4.4, scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[k % carCols.length], R, 0.2)); }
      for (let k = 0; k < 8; k++) { const px = padF.x + (R() - 0.5) * 20, pz = padF.z + (R() - 0.5) * 20; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      out.marks.finish = [padF.x, padF.z];
    }

    /* ---- the viewpoint (def.views): a level terrace of red earth beside the road, a low stone wall round its outer half, a few people looking
       out over the valley; the car parks (def.parks) with cars and three-wheelers ---- */
    {
      const st = [0.54, 0.52, 0.48], top = [0.66, 0.64, 0.6];
      for (const v of views) {
        const g = scen.get(v.x, v.z), y = v.h, rx = v.x - T.px[v.i], rz = v.z - T.pz[v.i], rl = Math.hypot(rx, rz) || 1, oa = Math.atan2(rz / rl, rx / rl), rr = v.r;
        for (let k = -5; k <= 5; k++) { const a = oa + k / 5 * 1.3, px = v.x + Math.cos(a) * rr, pz = v.z + Math.sin(a) * rr; if (vrNear(px, pz).dd < 1.2) continue;
          box(g, px, y - 0.4, pz, 0.5, 1.0, 1.6, a, st, top); }
        for (let k = 0; k < 3; k++) { const a = oa + (R() - 0.5) * 1.6, d = rr - 1 - R(); const px = v.x + Math.cos(a) * d, pz = v.z + Math.sin(a) * d; if (vrNear(px, pz).dd < 1.5) continue;
          crowdPut(CR, px, y + 0.05, pz, Math.cos(a), Math.sin(a), { col: fans[Math.floor(R() * fans.length)] }, 1); }
        CR.block(v.x, v.z, 2 * rr, 2 * rr, 0);
      }
      for (const p of parks) { const hh = T.hd[p.i], c = Math.cos(hh), sn = Math.sin(hh), n = Math.min(5, Math.floor(p.r / 2.5));
        for (let k = 0; k < n; k++) { const a = (k - (n - 1) / 2) * 2.6, px = p.x + c * a, pz = p.z + sn * a; if (vrNear(px, pz).dd < 1.5 || R() < 0.3) continue;
          if (k % 2) tukTuk(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(tukCols[k % tukCols.length], R, 0.1));
          else parkOn(caCar, caGround, 4.4, scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[k % carCols.length], R, 0.2)); } }
    }

    /* ---- the bus shelters (def.stops: a concrete shelter where OSM has one, else a post with its plate; none on the bridges), the stalls and
       kiosks by the road (def.poi: an open front under a lean-to roof, fruit and goods on a table, a three-wheeler or two by them; no signs) ---- */
    let nStops = 0, nStalls = 0;
    {
      for (const [d, side, shelter] of def.stops || []) {
        const s = sStart + d; if (s < sStart - 150 || s > T.len - 20) continue; const i0 = T.idx(s); if (onBr[i0] || onBr[T.idx(s - 8)] || onBr[T.idx(s + 8)]) continue;
        const [x, z, i] = onSide(s, side, 2.0); if (excluded(x, z) || vrNear(x, z).dd < 1.2) continue;
        const y = caGround(x, z), g = scen.get(x, z), hd = T.hd[i], ox = T.nx[i] * side, oz = T.nz[i] * side;
        if (shelter) { const col = vary(pastel[Math.floor(R() * pastel.length)], R, 0.04), bx = x + ox * 1.1, bz = z + oz * 1.1;
          box(g, bx, y - 0.3, bz, 3.8, 2.7, 0.2, hd, col, col);   // (its back wall, away from the road)
          for (const u of [-1.8, 1.8]) box(g, x + T.tx[i] * u + ox * 0.2, y - 0.3, z + T.tz[i] * u + oz * 0.2, 0.18, 2.7, 1.9, hd, col, col);
          box(g, x + ox * 0.15, y + 2.4, z + oz * 0.15, 4.4, 0.16, 2.6, hd, [0.6, 0.6, 0.58], [0.66, 0.66, 0.64]);
          box(g, x + ox * 0.75, y + 0.05, z + oz * 0.75, 3.0, 0.42, 0.45, hd, [0.58, 0.57, 0.54]);
          exclPush(x, z, 3.6); CR.block(x, z, 4.4, 2.8, hd);
        } else { box(g, x, y - 0.2, z, 0.08, 2.6, 0.08, hd, [0.6, 0.61, 0.63]); box(g, x, y + 2.0, z, 0.05, 0.5, 0.5, hd, [0.16, 0.34, 0.66], [0.9, 0.9, 0.88]); exclPush(x, z, 1.6); }
        nStops++;
      }
      const goods = [[0.95, 0.8, 0.12], [0.94, 0.46, 0.1], [0.36, 0.58, 0.16], [0.78, 0.16, 0.12], [0.98, 0.94, 0.86], [0.42, 0.24, 0.12]];
      for (const [x0, z0, kind] of def.poi || []) {
        const n = vrNear(x0, z0); if (n.i < 0) continue; const i = n.i, side = (x0 - T.px[i]) * T.nx[i] + (z0 - T.pz[i]) * T.nz[i] > 0 ? 1 : -1, s = i * T.ds;
        if (s < 20 || s > T.len - 20 || onBr[i]) continue;
        const [x, z] = n.dd < 3 || n.dd > 14 ? onSide(s, side, 3.2) : [x0, z0]; if (excluded(x, z) || vrNear(x, z).dd < 2) continue;
        const y = caGround(x, z), g = scen.get(x, z), hd = T.hd[i], ox = T.nx[i] * side, oz = T.nz[i] * side, col = vary(pastel[Math.floor(R() * pastel.length)], R, 0.05), rf = vary([[0.5, 0.33, 0.24], [0.24, 0.4, 0.3], [0.55, 0.56, 0.58], [0.2, 0.34, 0.56]][Math.floor(R() * 4)], R, 0.05);
        box(g, x + ox * 1.0, y - 0.4, z + oz * 1.0, 3.6, 3.0, 2.4, hd, col, col);   // the kiosk: its open front to the road (dark), a lean-to roof over it on two posts
        box(g, x + ox * (-0.22), y + 0.5, z + oz * (-0.22), 2.6, 1.6, 0.06, hd, [0.15, 0.13, 0.12], null, true);
        const ra = [x - ox * 1.3, y + 2.75, z - oz * 1.3]; box(g, ra[0], ra[1], ra[2], 4.0, 0.1, 2.0, hd, rf, rf);
        for (const u of [-1.7, 1.7]) box(g, x + T.tx[i] * u - ox * 2.15, y - 0.2, z + T.tz[i] * u - oz * 2.15, 0.1, 2.95, 0.1, hd, [0.3, 0.3, 0.32]);
        box(g, x - ox * 0.9, y + 0.0, z - oz * 0.9, 2.4, 0.85, 0.9, hd, [0.42, 0.3, 0.2], [0.5, 0.36, 0.24]);   // the table, the goods on it in heaps
        for (let k = 0; k < 6; k++) { const u = -1.0 + k * 0.4, gc = goods[(k + (kind | 0) * 2) % goods.length]; box(g, x - ox * 0.9 + T.tx[i] * u, y + 0.85, z - oz * 0.9 + T.tz[i] * u, 0.34, 0.16 + R() * 0.12, 0.6, hd, vary(gc, R, 0.08)); }
        if (kind === 2) for (const u of [-2.9, 2.9]) { const px = x - ox * 1.6 + T.tx[i] * u, pz = z - oz * 1.6 + T.tz[i] * u; box(g, px, caGround(px, pz), pz, 0.7, 0.72, 0.7, hd, [0.86, 0.2, 0.16], [0.9, 0.9, 0.88]); }   // (a café's plastic tables)
        if (R() < 0.5) { const [tx, tz] = onSide(s + 7, side, 2.0); if (!excluded(tx, tz) && vrNear(tx, tz).dd > 1) tukTuk(scen.get(tx, tz), tx, caGround(tx, tz), tz, hd, vary(tukCols[Math.floor(R() * tukCols.length)], R, 0.1)); }
        exclPush(x, z, 4.6); CR.block(x, z, 4.4, 4.6, hd); nStalls++;
      }
      for (const cv of culv) {   // the culverts: a concrete headwall on each side, the pipe's dark mouth
        const i = cv.i; if (i * T.ds < 10 || i * T.ds > T.len - 10) continue;
        for (const side of [-1, 1]) { if (deck(i, side) || bk[side > 0 ? 1 : 0][i]) continue; const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.7), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, g = scen.get(x, z), y = Math.min(T.hy[i] - 0.3, caGround(x, z));
          box(g, x, y - 1.2, z, 0.4, 1.5, 3.0, T.hd[i] + PI / 2, [0.6, 0.59, 0.56], [0.68, 0.67, 0.64]); box(g, x + T.nx[i] * side * 0.22, y - 1.05, z + T.nz[i] * side * 0.22, 0.06, 0.8, 0.8, T.hd[i] + PI / 2, [0.08, 0.08, 0.08], null, true); }
      }
    }

    /* ---- the low parapets where the ground falls away and round the outside of the bends (concrete, painted in black and white blocks), white
       on the bridges, a marker post every ~50 m where there is none (knockable where it fits: eProps); chevrons on the outside of each hairpin ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0, side = sd ? 1 : -1;   // (the outside of the bend, where it is not against a cut)
        for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) if (gAt(k, side, (side > 0 ? T.br[k] : T.bl[k]) + 6) < -0.6) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), blk = [0.12, 0.12, 0.13], white = [0.93, 0.92, 0.88], stone = [0.56, 0.55, 0.52];
      const nearPad = (i) => { for (const p of views.concat(parks)) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 4) return true; return false; };
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || nearPad(i) || bk[si][i]) nd[i] = 0;
        for (let i = 0; i < N; i++) if (deck(i, side)) nd[i] = 2;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i] === 1) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) if (!nd[k]) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (nd[i] !== 1) { i++; continue; } let j = i; while (j < N && nd[j] === 1) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        for (let i = 0; i < N; i++) if (nd[i]) nRail++;
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.15 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          if (nd[i] && nd[i + 1]) {   // the parapet: its face to the road and its top painted (black and white blocks; on a bridge all white), the back the bare concrete
            const g = scen.get(T.px[i], T.pz[i]), br = nd[i] === 2, cc = br ? white : Math.floor(i * T.ds / 2) % 2 ? blk : white, hgt = br ? 0.75 : 0.55, a = Q(i, -0.2), b = Q(i + 1, -0.2), c = Q(i + 1, hgt), d = Q(i, hgt);
            const a2 = Q(i, br ? -0.2 : -0.6, 0.4), b2 = Q(i + 1, br ? -0.2 : -0.6, 0.4), c2 = Q(i + 1, hgt, 0.4), d2 = Q(i, hgt, 0.4), inn = Q(i, 0.2, 0.2);
            g.quadO(a, b, c, d, cc, inn); g.quadO(a2, b2, c2, d2, br ? white : stone, inn); g.quadO(d, c, c2, d2, cc, inn);
          } else if (!nd[i] && i % 25 === 0 && i > 2 && i < iE - 2 && !bk[si][i]) mkPosts.push([i, side]);
        }
      }
      const kp = eProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.11], null, true);
      }
      (def.curves || []).forEach(([d, , turn]) => {   // three chevrons on the outside of each hairpin, facing the cars coming up
        const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 6 && sStart + d <= q.i1 * T.ds + 6); if (!c || c.sev < 2) return;
        const out_ = -turn, cell = turn > 0 ? 30 : 31, u0 = (cell % 8) / 8, v1 = 1 - Math.floor(cell / 8) / 8;
        for (const o of [-10, 0, 10]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.9); if (excluded(cx, cz)) continue;
          const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
          bannerQ(cx, Math.max(cy, T.hy[ci]) + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2); CR.avoid(cx, cz, 0.6); }
      });
      { const nm = (n) => T.names.find(q => q.n.startsWith(n));
        for (const [n, k, o] of [['Ella Rock', 6, -40], ['Serpentina 1', 5, -80], ['Serpentina 3', 4, -70]]) { const q = nm(n); if (q) signAt(sStart + q.d + o, -1, k); }
        if (views.length) { const s = views[0].i * T.ds; signAt(s - 60, -1, 3); } }
    }

    /* ---- spectators, few (fewFans): the start and the finish, the checkpoints, the insides of two hairpins ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.1, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.1, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 50, sStart + 40, sd, { rows: 2, dens: 0.45, label: 'E start' }); run(sFin - 50, sFin + 14, sd, { rows: 2, dens: 0.45, label: 'E finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 16, s0 + 14, side, { rows: 1, dens: 0.4, label: 'E cp' }); });
      (def.curves || []).forEach(([d, , turn], k) => { if (k !== 0 && k !== 2) return; const sm = sStart + d; run(sm - 14, sm + 14, turn, { rows: 1, dens: 0.4, label: 'E hairpin ' + (k + 1) }); });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants (instanced per 96 m chunk): the forest (broadleaf trees, grevilleas, palms, shrubs under them by the road), the open slopes
       (tufts of tall grass and fern, a few trees and shrubs), the scrub, round the houses palms, bananas and fruit trees; thinner farther out ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 3, 4, 5].map(k => new IChunks(eTreeGeo(k), tMatT, 96));
    let nTrees = 0, nShrubs = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(38000 * dens), RT = rng(5841), SP = 4.4 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(260)) continue;
          const c = vrLC(x, z), far = sstep(50, 190, hd);
          const p = c === 1 ? 0.8 - 0.5 * far : c === 3 ? 0.42 - 0.24 * far : c === 2 ? 0.55 - 0.35 * far : c === 0 ? 0.34 - 0.25 * far : c === 6 ? 0.3 - 0.15 * far : c === 7 ? 0.08 : 0.01;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.4) continue; if (nn.i >= 0 && nn.dd < 6 && r2 < 0.3) continue;
          if (excluded(x, z) || stNear(x, z).d < 1.5) continue;
          const sl = caSlope(x, z); if (sl > 1.8 || (sl > 1.0 && r2 < (sl - 1.0) / 0.8)) continue;
          let sp, hgt, wid, col;
          if (c === 1) sp = r3 < 0.44 ? 0 : r3 < 0.62 ? 1 : r3 < 0.74 ? 2 : r3 < 0.78 ? 3 : (hd < 40 ? 4 : 0);
          else if (c === 3) sp = r3 < 0.3 ? 2 : r3 < 0.55 ? 3 : r3 < 0.78 ? 0 : 4;
          else if (c === 2) sp = r3 < 0.55 ? 4 : r3 < 0.8 ? 5 : 0;
          else if (c === 0) sp = hd > 120 ? (r3 < 0.6 ? 0 : 4) : r3 < 0.62 ? 5 : r3 < 0.82 ? 4 : r3 < 0.94 ? 0 : 1;
          else if (c === 6) sp = 4; else sp = r3 < 0.5 ? 3 : 2;
          if (sp === 5 && hd > 90) continue;   // (the tufts only where the camera sees them)
          if (sp === 0) { hgt = 11 + r4 * 10; wid = hgt * (0.85 + r2 * 0.25); col = [0.92 + r2 * 0.14, 0.96 + r3 * 0.08, 0.92]; }
          else if (sp === 1) { hgt = 16 + r4 * 10; wid = hgt * 0.62; col = [0.95 + r2 * 0.1, 1, 0.95]; }
          else if (sp === 2) { hgt = 9 + r4 * 8; wid = hgt * 0.75; col = [1, 1, 0.95]; }
          else if (sp === 3) { hgt = 3 + r4 * 2.2; wid = hgt * 1.0; col = [0.95 + r2 * 0.1, 1, 0.92]; }
          else if (sp === 4) { const tea = c === 6; hgt = tea ? 0.9 + r4 * 0.3 : 1.2 + r4 * 1.6; wid = tea ? 1.4 + r2 * 0.4 : hgt * (1.1 + r2 * 0.4); col = tea ? [1.05, 1.15, 0.95] : [0.92 + r3 * 0.16, 1, 0.92]; nShrubs++; }
          else { hgt = 0.8 + r4 * 1.0; wid = 0.9 + r2 * 0.8; col = [0.92 + r3 * 0.16, 0.95 + r4 * 0.1, 0.9]; nShrubs++; }
          tk[sp].add(x, caGround(x, z) - 0.12, z, r1 * 70, wid, hgt, col);
          if (++nTrees >= maxT) break grid;
        }
      }
      if (ST) { const RB = rng(5847);   // the streams' banks near the road: shrubs and tall grass along them, the water half hidden under them
        for (let k = 0; k < ST.n - 1; k++) { if (ST.e[k]) continue;
          const ax = ST.x[k], az = ST.z[k], bx = ST.x[k + 1], bz = ST.z[k + 1], l = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / l, nz = (bx - ax) / l;
          if (vrDist(ax, az) > LOD.radius(140)) continue;
          for (let t = 0; t < l; t += 2.2) for (const sd of [-1, 1]) { const r1 = RB(), r2 = RB(), r3 = RB(); if (r1 > 0.6) continue;
            const o = sd * (1.45 + r2 * 1.4), x = ax + (bx - ax) * t / l + nx * o, z = az + (bz - az) * t / l + nz * o, nn = vrNear(x, z);
            if ((nn.i >= 0 && nn.dd < 3) || excluded(x, z) || caSlope(x, z) > 1.6) continue;
            const sp = r3 < 0.55 || vrDist(x, z) > 90 ? 4 : 5, hgt = sp === 4 ? 1.2 + r2 * 1.6 : 0.9 + r1 * 1.2, wid = sp === 4 ? hgt * (1.1 + r3 * 0.4) : 1 + r2 * 0.8;
            tk[sp].add(x, caGround(x, z) - 0.12, z, r1 * 90, wid, hgt, [0.9 + r3 * 0.16, 0.97 + r2 * 0.06, 0.9]); nShrubs++; }
        }
      }
    }
    tk.forEach((t, k) => t.addTo(root, LOD.tier > 0 || k < 4));   // (NIZKA: the shrubs and the tufts cast no shadow)

    /* ---- the stones: grey gneiss boulders at the foot of the cuts and in the forest, crags where the slope is steep ---- */
    {
      const RW = rng(5851), grey = [[0.5, 0.49, 0.46], [0.56, 0.54, 0.5], [0.44, 0.43, 0.41], [0.52, 0.47, 0.42]];
      const rockC = () => grey[Math.floor(RW() * grey.length)];
      API.ROCK_SMOOTH = false;
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {   // blocks at the foot of the cuts
        if (RW() > 0.3) continue;
        const o = 1.6 + Math.pow(RW(), 1.5) * 30, [x, z] = onSide(s, side, o), sz = 0.5 + RW() * 1.2; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || stNear(x, z).d < 3 || vrDist(x, z) > LOD.cap(90)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RW() * TAU, vary(rockC(), RW, 0.08), RW, 0.3);
      }
      for (let s = 16; s < T.len - 16; s += 14) for (const side of [-1, 1]) {   // crags where the slope is steep
        if (RW() < 0.4) continue;
        const [x, z] = onSide(s, side, 8 + RW() * 110); if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(110)) continue;
        const sl = caSlope(x, z); if (sl < 0.85) continue;
        const g = scen.get(x, z), n = 2 + Math.floor(RW() * 2), b0 = vary(rockC(), RW, 0.06);
        for (let q = 0; q < n; q++) { const r0 = 1.8 + RW() * 3.5, qx = x + (RW() - 0.5) * 9, qz = z + (RW() - 0.5) * 9, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0, r0 * (0.8 + RW() * 0.7), r0 * (0.7 + RW() * 0.4), RW() * TAU, vary(b0, RW, 0.07), RW, 0.35); }
      }
    }

    /* ---- the view beyond the corridor (def.farDem: the hills round the valley, the plains far below to the south-east; irFar, World.update moves it with the camera); finish the meshes ---- */
    const FAR = API.irFar ? API.irFar(eFarCol) : null; if (FAR) { FAR.mesh.visible = false; root.add(FAR.mesh); out.dyn.irFar = FAR; }   // (hidden until the first World.update)
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: eAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: eAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, shrubs: nShrubs, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), walls: nWall, water: nWater,
      culverts: culv.length, bridges: P.gul.length, stops: nStops, stalls: nStalls, views: views.length, parks: parks.length, far: !!FAR };   // (read by the tests)
    return out;
  }

  World.keep('VR', 'ella');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.ella = (scene, tex, opts) => buildElla(scene, tex, opts);
})();
