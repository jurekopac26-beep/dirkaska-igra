/* =========================================================================
   WORLD — Rio do Rastro (theme 'rastro'): its own builder (World.ext.rastro), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caCar, caGH, caGround, caSlope, caTileOn, clamp, cone, crowdCtx, crowdFinish, crowdPut,
    crowdRun, cyl, gable, ico, lerp, ouCutMat, ouRod, pkGroundMat, propFloorTable, rng, roadsideProps, rock, rpHash, sstep, valueNoise2, vary,
    vrDist, vrFar, vrGritTex, vrHouse, vrLC, vrLCf, vrNear, vrPrep, vrWater, parkOn
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= SERRA DO RIO DO RASTRO (theme 'rastro') =================
     Serra do Rio do Rastro (Brazil, road SC-390): the top 5 km of the climb up the wall of the Serra Geral, 17 bends stacked on the cliff, through
     the Atlantic rainforest (Mata Atlântica) to the viewpoint at the edge of the plateau (~1420 m), on a humid afternoon. Built on Vršič's
     corridor (vrPrep and Los Caracoles' terrain helpers caH / caGround read the same forms: def.dem, def.lc, def.lakes, def.bridges, def.bld) with a
     look of its own: the ground colours (rrCol: the forest floor, the plateau's grassland, the rock of the escarpment, dark basalt above and pink
     sandstone below, the red earth of the cuts), the dense forest (rrTreeGeo: broadleaf crowns, emergent trees, palms, tree ferns, bamboo) and the
     araucarias on the plateau, crags on the cliffs, the waterfalls (def.falls: a ribbon of water down the rock, flowing), the viewpoint with its
     railing on the cliff edge (def.mirante), the concrete walls holding the legs of the ladder, the numbered bends' signs, and the mist rising
     out of the valley (rrMist: soft banks drifting up the cliff, World.update moves them). Everything named is generic: no business on a sign. */
  const RRCOL = [0, 0, 0];
  function rrCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map): the plateau's grass with straw patches (lc 0), the dark forest floor (lc 1),
    // the shrubs (lc 2), the yards by the viewpoint (lc 3); on the steep faces the rock of the escarpment in bands (basalt above ~1150 m, the pink and
    // ochre sandstone below it), streaked with moss and ferns (the road's own cuts mostly overgrown); the red earth of a trodden verge
    const P = API.VR, A = h + P.D.base, f = P.n4(x, z), q = P.c2(x, z);
    const hi = sstep(1360, 1400, A), fo = vrLCf(x, z, 1), sh = vrLCf(x, z, 2), se = vrLCf(x, z, 3) * hi;   // (WorldCover's built-up below the plateau: the road's own strip, overgrown)   // (the plateau's grassland: tawny patches; below it the lush green of the clearings)
    let R = lerp(0.27, 0.4, hi), G = lerp(0.42, 0.5, hi), B = lerp(0.16, 0.23, hi);
    const straw = sstep(0.56, 0.8, q) * 0.55 * hi; R = lerp(R, 0.6, straw); G = lerp(G, 0.57, straw); B = lerp(B, 0.3, straw);
    R = lerp(R, 0.19, fo); G = lerp(G, 0.26, fo); B = lerp(B, 0.12, fo);
    R = lerp(R, 0.29, sh * 0.7); G = lerp(G, 0.38, sh * 0.7); B = lerp(B, 0.16, sh * 0.7);
    R = lerp(R, 0.56, se * 0.6); G = lerp(G, 0.54, se * 0.6); B = lerp(B, 0.49, se * 0.6);
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.08; B += (f - 0.5) * 0.05;
    const st = sstep(0.64, 0.42, ny);
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 6.5 + P.c2(x * 0.4, z * 0.4) * 6), k = 0.8 + 0.22 * band, ss = sstep(1180, 1110, A + (P.c1(x, z) - 0.5) * 60);
      const moss = Math.max(sstep(0.42, 0.72, P.c5(x, z)) * 0.55, 0.95 * sstep(60, 22, dd)), rr = lerp(0.35, 0.66, ss) * k, rg = lerp(0.34, 0.49, ss) * k, rb = lerp(0.33, 0.4, ss) * k;
      R = lerp(R, lerp(rr, 0.18, moss), st); G = lerp(G, lerp(rg, 0.31, moss), st); B = lerp(B, lerp(rb, 0.1, moss), st); }
    if (dd < 1.6) { const t = sstep(1.6, 0.2, dd) * 0.35; R = lerp(R, 0.5, t); G = lerp(G, 0.36, t); B = lerp(B, 0.24, t); }
    RRCOL[0] = R; RRCOL[1] = G; RRCOL[2] = B; return RRCOL;
  }
  function rrGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (as caGCol, coloured by rrCol)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = rrCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function rrTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by rrCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = rrCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
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
  let rrATex = null, rrAKey = '', rrA2Tex = null, rrA2Key = '';   // (the board atlases, made once and reused by every build of the road)
  function rrAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): LARGADA (the start), CHEGADA (the finish), CP1-CP4 with the altitude, the viewpoint's sign, the race's banner
    const key = cps.join('|') + '|' + finA; if (rrATex && rrAKey === key) return rrATex;
    if (rrATex) rrATex.dispose(); rrAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('LARGADA', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(262, 142, 500, 100); txt('CHEGADA', 512, 196, 92, '#111', 470);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#1e7a46'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#5a3a22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#efe3c8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('MIRANTE DA SERRA', 512, 812, 58, '#f3ead6', 900); txt(finA, 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#1e7a46'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#f2c81e'; x.fillRect(0, 956, 1024, 8);
    txt('SUBIDA DA SERRA DO RIO DO RASTRO', 512, 930, 50, '#fff', 980); txt('17 CURVAS · SC-390', 512, 994, 44, '#f2c81e', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (rrATex = t);
  }
  const RR_BOARDS = [['MIRANTE  →', '#6b4a22'], ['BOM JARDIM DA SERRA', '#1d4f9a'], ['LAURO MÜLLER', '#1d4f9a'], ['CASCATA', '#6b4a22'], ['SERRA DO RIO DO RASTRO', '#6b4a22'], ['NEBLINA', '#f2c81e'], ['CURVAS SINUOSAS', '#f2c81e'], ['SERRA GERAL', '#6b4a22']];
  function rrAtlas2(curves) {   // the small signs: rows 0-3, the bends' numbers (8 a row, 128 x 128: a white board with the number) and two chevrons; rows 4-7, the place boards (two a row, 512 x 128)
    const key = curves.length; if (rrA2Tex && rrA2Key === key) return rrA2Tex;
    if (rrA2Tex) rrA2Tex.dispose(); rrA2Key = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w, wt) => { x.fillStyle = col; x.font = (wt || 900) + ' ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    curves.forEach((cv, k) => { const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128;
      x.fillStyle = '#16181c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f6f5f0'; x.fillRect(x0 + 7, y0 + 7, 114, 114);
      txt('CURVA', x0 + 64, y0 + 30, 24, '#16181c', 108, 700); txt(String(k + 1), x0 + 64, y0 + 80, 64, '#16181c', 110); });
    for (const [k, dir] of [[30, 1], [31, -1]]) {   // the chevrons: black arrows on yellow, pointing the way the road turns
      const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128; x.fillStyle = '#f1c21b'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#16181c';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    RR_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, warn = bg === '#f2c81e';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = warn ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, 54, warn ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (rrA2Tex = t);
  }
  function rrTreeGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 a broadleaf of the rainforest (a lumpy crown of three clumps on a pale trunk),
    // 1 an emergent tree (a tall bare trunk, a wide flat umbrella crown), 2 a palm (palmito juçara: a slim ringed trunk, a crown of arching fronds),
    // 3 a tree fern (xaxim: a dark fibrous trunk, a rosette of long fronds), 4 an araucaria (a straight trunk, the branches turned up at their ends
    // into a flat-topped candelabra), 5 a clump of bamboo and shrubs
    const g = new GB(), R = rng(860 + kind), rs = API.ROCK_SMOOTH, frond = (cx, cy, cz, a, L, lift, droop, w, col, tip) => {   // a long leaf, both faces: out along a, rising then drooping
      const ux = Math.cos(a), uz = Math.sin(a), px = -uz * w, pz = ux * w, m = [cx + ux * L * 0.55, cy + lift, cz + uz * L * 0.55], e = [cx + ux * L, cy + lift - droop, cz + uz * L];
      const b = [cx, cy, cz], l1 = [m[0] + px, m[1], m[2] + pz], r1 = [m[0] - px, m[1], m[2] - pz], up = [cx, cy + 1, cz], dn = [cx, cy - 1, cz];
      g.triO(b, l1, m, col, dn, col, col); g.triO(b, m, l1, col, up, col, col); g.triO(b, m, r1, col, dn, col, col); g.triO(b, r1, m, col, up, col, col);
      g.triO(l1, e, m, col, dn, tip, col); g.triO(l1, m, e, col, up, col, tip); g.triO(m, e, r1, col, dn, tip, col); g.triO(m, r1, e, col, up, col, tip); };
    if (kind === 0) {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.035, 0.5, 4, [0.6, 0.57, 0.5], null, 0.025);
      const cs = [[0.19, 0.31, 0.12], [0.15, 0.27, 0.1], [0.24, 0.36, 0.14], [0.17, 0.3, 0.13]];
      ico(g, 0, 0.66, 0, 0.3, 0.62, cs[0], R, 0.32); ico(g, 0.2, 0.55, 0.1, 0.22, 0.7, cs[1], R, 0.35); ico(g, -0.16, 0.56, -0.16, 0.23, 0.7, cs[2], R, 0.35);
    } else if (kind === 1) {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.025, 0.74, 4, [0.66, 0.62, 0.55], null, 0.016);
      ico(g, 0, 0.84, 0, 0.42, 0.32, [0.27, 0.4, 0.15], R, 0.3); ico(g, 0.25, 0.8, 0.12, 0.24, 0.42, [0.22, 0.35, 0.13], R, 0.35); ico(g, -0.24, 0.81, -0.1, 0.24, 0.42, [0.31, 0.43, 0.17], R, 0.35);
    } else if (kind === 2) {
      API.ROCK_SMOOTH = false; cyl(g, 0, -0.02, 0, 0.022, 0.86, 4, [0.55, 0.53, 0.46], null, 0.016); cyl(g, 0, 0.78, 0, 0.026, 0.1, 4, [0.36, 0.48, 0.2]);   // (the green crown shaft)
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + R() * 0.4; frond(0, 0.88, 0, a, 0.42 + R() * 0.1, 0.07, 0.26, 0.05, k % 2 ? [0.2, 0.36, 0.12] : [0.24, 0.4, 0.14], [0.3, 0.44, 0.18]); }
      frond(0, 0.88, 0, 0, 0.05, 0.14, -0.05, 0.02, [0.3, 0.46, 0.16], [0.3, 0.46, 0.16]);
    } else if (kind === 3) {
      API.ROCK_SMOOTH = false; cyl(g, 0, -0.02, 0, 0.06, 0.62, 5, [0.2, 0.15, 0.1], null, 0.05);
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + R() * 0.3; frond(0, 0.6, 0, a, 0.55 + R() * 0.12, 0.12, 0.36, 0.08, k % 2 ? [0.22, 0.42, 0.14] : [0.27, 0.48, 0.16], [0.36, 0.54, 0.2]); }
    } else if (kind === 4) {
      API.ROCK_SMOOTH = false; const bark = [0.4, 0.3, 0.22], nd = [0.13, 0.24, 0.1], ndt = [0.2, 0.32, 0.13];
      cyl(g, 0, -0.02, 0, 0.03, 0.9, 5, bark, null, 0.018);
      for (let w = 0; w < 2; w++) { const y = 0.7 + w * 0.1, n = 5 - w; for (let k = 0; k < n; k++) { const a = (k + w * 0.5) / n * TAU + R() * 0.3, L = 0.34 - w * 0.1, ex = Math.cos(a) * L, ez = Math.sin(a) * L;
        ouRod(g, [0, y, 0], [ex, y + 0.06, ez], 0.008, bark, 3);
        cone(g, ex, y + 0.04, ez, 0.14 - w * 0.02, 0.1, 5, k % 2 ? nd : ndt, ndt, a); } }   // (each branch ends in a flat tuft of needles, turned up)
      cone(g, 0, 0.9, 0, 0.1, 0.1, 5, ndt, ndt, 0);
    } else {
      API.ROCK_SMOOTH = true; const cs = [[0.3, 0.44, 0.15], [0.36, 0.5, 0.18], [0.26, 0.38, 0.14]];
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + R() * 0.5, d = k ? 0.3 : 0; ico(g, Math.cos(a) * d, 0.45 - d * 0.3, Math.sin(a) * d, 0.36, 1.1, cs[k % 3], R, 0.35); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the knockable roadside posts: white with a black top
  function rrProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }
  // the mist rising out of the valley: soft banks (sprites) over the low ground below the road, drifting up the cliff and fading out as they rise,
  // then coming up again from below; a fixed pose at t (no car: the world test's pose at time 0)
  function rrMist(M, t) {
    const sc = M.root && M.root.parent, fc = sc && sc.fog ? sc.fog.color : null;   // (the mist in the haze's colour: pale by day, dark at night)
    for (const b of M.L) {
      if (fc) b.s.material.color.copy(fc).multiplyScalar(1.12);
      const ph = (b.p0 + t * b.v / b.H) % 1, k = Math.sin(ph * Math.PI);
      b.s.position.set(b.x + Math.sin(t * 0.013 + b.p0 * 9) * 18, b.y + ph * b.H, b.z + Math.cos(t * 0.011 + b.p0 * 7) * 18);
      b.s.material.opacity = b.a * k * k;
      b.s.scale.set(b.r * (0.8 + 0.4 * ph), b.r * 0.55 * (0.8 + 0.4 * ph), 1);
    }
  }
  function buildRastro(scene, tex, opts) {
    const R = rng(3311), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.55, 0.42, 0.32] };
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(811, 150); P.c2 = valueNoise2(812, 64); P.c3 = valueNoise2(813, 210); P.c4 = valueNoise2(814, 120); P.c5 = valueNoise2(815, 26);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the buildings (def.bld: the kiosks and halls by the viewpoint, the houses on the plateau): clear of the road and the ponds
    const blds = [];
    for (const b of def.bld || []) {
      let [x, z, L, W, ang, hgt] = b; L = Math.min(L, 40); W = Math.min(W, 22);
      if (L < 2.5 || W < 2.5) continue;
      const c = Math.cos(ang), s = Math.sin(ang), clear = () => { for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const px = x + c * u - s * v, pz = z + s * u + c * v, n = vrNear(px, pz);
        if ((n.i >= 0 && n.dd < 1.5) || vrWater(px, pz).e > -2) return false; } return true; };
      if (clear()) blds.push({ x, z, L, W, ang, hgt });
    }
    // the viewpoint (def.mirante): a level paved plaza on the cliff edge; the car park beside the road past the finish line
    const mir = def.mirante ? { x: def.mirante[0], z: def.mirante[1] } : null;
    if (mir) { const i = T.nearestIdx(mir.x, mir.z); mir.h = T.hy[i] + 0.1; mir.i = i; mir.pad = { x: mir.x, z: mir.z, r: 13, b: 10, h: mir.h }; P.pads.push(mir.pad); }
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 16, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 60, 14); P.pads.push(padF);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees and buildings between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the rocks, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    exclPush(padF.x, padF.z, padF.r + 4); if (mir) exclPush(mir.x, mir.z, 17);
    out.marks = {}; if (mir) out.marks.Mirante = [mir.x, mir.z];   // (where the landmarks stand: the tests look for them)

    /* ---- terrain tiles, the ponds on the plateau ---- */
    let nFar = 0;
    const tMat = pkGroundMat();
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(rrTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 40, specular: 0x24302c });
      for (const L of P.lakes) {   // a 4 m grid, only where the corridor is built: dark peaty water
        const deep = [0.1, 0.16, 0.12], shal = [0.26, 0.32, 0.2], sky = [0.5, 0.58, 0.62];
        const g = new GB(true), uv = (q) => [q[0] / 14, -q[2] / 14];
        const wc = (x, z) => { const e = vrWater(x, z).e, ks = 0.4 * sstep(0.55, 0.8, P.n2(x * 2.2, z * 2.2)); return [0, 1, 2].map(k => lerp(lerp(shal[k], deep[k], sstep(2, 14, e)), sky[k], ks)); };
        for (let zz = Math.floor((L.z0 - 4) / 4) * 4; zz < L.z1 + 4; zz += 4) for (let xx = Math.floor((L.x0 - 4) / 4) * 4; xx < L.x1 + 4; xx += 4) {
          if (vrDist(xx, zz) > 600) continue;
          if (!(caGround(xx, zz) < L.h + 0.4 || caGround(xx + 4, zz) < L.h + 0.4 || caGround(xx, zz + 4) < L.h + 0.4 || caGround(xx + 4, zz + 4) < L.h + 0.4)) continue;
          const A = [xx, L.h, zz], B = [xx + 4, L.h, zz], C = [xx + 4, L.h, zz + 4], D = [xx, L.h, zz + 4];
          g.quadUp(A, B, C, D, [wc(A[0], A[2]), wc(B[0], B[2]), wc(C[0], C[2]), wc(D[0], D[2])], [uv(A), uv(B), uv(C), uv(D)]);
        }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); }
      }
      for (const b of P.gul) {   // the stream in its bed under the bridge
        const g = new GB(true), cw = [0.3, 0.4, 0.34], hw = Math.min(2.4, b.bw * 0.4), y = b.y + 0.35;
        for (let a = -56; a < 56; a += 4) { const P0 = (q, o) => [b.x + b.nx * q + b.tx * o, y, b.z + b.nz * q + b.tz * o];
          g.quadUp(P0(a, -hw), P0(a, hw), P0(a + 4, hw), P0(a + 4, -hw), [cw, cw, cw, cw], [[a / 14, 0], [a / 14, 0.3], [(a + 4) / 14, 0.3], [(a + 4) / 14, 0]]); }
        const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
      out.dyn.water = tex.water;
    }

    /* ---- the road: asphalt with white edge lines and a double yellow centre line, a narrow shoulder, then the verge out to a ditch past the barrier
       line; where the leg below lies far beneath, the concrete retaining wall that holds the road on the cliff (its face out towards the valley);
       on the bridge the deck out to its parapets (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const onBr = new Uint8Array(N), sw = 0.5;
    for (const [a, b] of def.bridges || []) for (let s = sStart + a - 3; s <= sStart + b + 3; s += T.ds / 2) onBr[T.idx(s)] = 1;
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      if (onBr[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.84 - 0.13 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], ylw = [0.96, 0.76, 0.16], gc = [0.66, 0.6, 0.54], deck = [0.64, 0.63, 0.6];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return k < 3 ? deck : [0.52, 0.51, 0.49];
          const wl = vp[si][i][2][1] < -2.6; if (wl && (k === 1 || k === 2)) { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si); return k === 1 ? [0.72 * q, 0.71 * q, 0.67 * q] : [0.5 * q, 0.5 * q, 0.46 * q]; }   // (the retaining wall's coping, its weathered, damp foot)
          if (k === 4) return rrGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return rrCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - bar)).slice(); })); } return a; });
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
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], sc = onBr[i] ? deck : gc;
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [sc, sc, sc, sc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6)) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face: out, towards the leg below)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
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
    const scen = new Chunks(110), fac = new Chunks(110, true), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (fac: the walls with windows; ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.12, 0.55, 0.3], [0.96, 0.82, 0.12], [0.95, 0.95, 0.95], [0.14, 0.26, 0.62], [0.84, 0.14, 0.12], [0.2, 0.62, 0.38], [0.98, 0.86, 0.2], [0.12, 0.14, 0.2], [0.46, 0.7, 0.92], [1, 0.55, 0.1]];
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => vrWater(x, z).e > -4, shirts: fans }), crSoft = new Set();
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
    const carCols = [[0.85, 0.85, 0.83], [0.72, 0.12, 0.1], [0.12, 0.28, 0.6], [0.16, 0.16, 0.18], [0.6, 0.62, 0.64], [0.24, 0.45, 0.28], [0.95, 0.95, 0.94]];

    /* ---- the buildings: kiosks and halls by the viewpoint, houses on the plateau (plastered walls with windows, tiled or metal roofs) ---- */
    let nBld = 0;
    {
      const RB = rng(3321), walls = [[0.95, 0.94, 0.9], [0.93, 0.88, 0.76], [0.9, 0.84, 0.7], [0.86, 0.72, 0.56]], roofs = [[0.6, 0.28, 0.18], [0.52, 0.24, 0.16], [0.42, 0.44, 0.46], [0.3, 0.32, 0.36]], woods = [[0.42, 0.28, 0.16], [0.5, 0.34, 0.2], [0.36, 0.24, 0.15]];
      for (const b of blds) {
        const c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = caGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); }
        const fl = b.hgt > 5 ? 2 : b.L * b.W > 220 ? 2 : 1;
        vrHouse(scen.get(b.x, b.z), fac.get(b.x, b.z), b.x, lo, hi, b.z, b.ang, b.L, b.W, fl, { wall: walls[Math.floor(RB() * walls.length)], wood: vary(woods[Math.floor(RB() * 3)], RB, 0.1), roof: vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1) });
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++;
      }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- LARGADA (the start, in the forest below the hairpins): gantry with the start lights, the timing hut, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.92, 0.9, 0.84], [0.5, 0.3, 0.2], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.1, T.hd[i], [0.6, 0.28, 0.18], [0.92, 0.9, 0.84]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
      signAt(sStart + 60, 1, 6);   // CURVAS SINUOSAS
    }

    /* ---- the checkpoints: a green gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.12, 0.42, 0.25]));

    /* ---- CHEGADA (the viewpoint): chequered gantry, the viewpoint's sign, the plaza on the cliff edge with its railing and the people looking out
       over the hairpins, the car park; the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 18, sdP, 3.2), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the viewpoint's sign: a board on posts leaning back
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.36, 0.24, 0.14]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.42, 0.36, 0.32], [0.5, 0.44, 0.38]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 5);
      signAt(sFin + 110, -sdP, 1);   // BOM JARDIM DA SERRA ahead
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 10; k++) { const a = -12 + (k % 5) * 6, b = (k < 5 ? -4.5 : 4.5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || k === 2 || k === 7) continue;
        parkOn(caCar, caGround, 4.4, scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[k % carCols.length], R, 0.2)); }
      for (let k = 0; k < 12; k++) { const px = padF.x + (R() - 0.5) * 22, pz = padF.z + (R() - 0.5) * 22; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      if (mir) {   // the plaza: stone paving, a railing round its outer half (the side away from the road, over the cliff), benches, the people at the railing
        const g = scen.get(mir.x, mir.z), y = mir.h, rx = mir.x - T.px[mir.i], rz = mir.z - T.pz[mir.i], rl = Math.hypot(rx, rz) || 1, ox = rx / rl, oz = rz / rl, oa = Math.atan2(oz, ox), rr = 11;
        const pv = new GB(); for (let k = 0; k < 16; k++) { const a0 = k / 16 * TAU, a1 = (k + 1) / 16 * TAU, col = k % 2 ? [0.62, 0.6, 0.56] : [0.66, 0.64, 0.6];
          pv.quadUp([mir.x, y + 0.06, mir.z], [mir.x + Math.cos(a0) * rr, y + 0.06, mir.z + Math.sin(a0) * rr], [mir.x + Math.cos(a1) * rr, y + 0.06, mir.z + Math.sin(a1) * rr], [mir.x, y + 0.06, mir.z], [col, col, col, col]); }
        addM(pv, matV);
        const rail = [0.2, 0.22, 0.24], post = [0.3, 0.32, 0.34];
        for (let k = -9; k <= 9; k++) { const a = oa + k / 9 * 1.45, a2 = oa + (k + 1) / 9 * 1.45, px = mir.x + Math.cos(a) * rr, pz = mir.z + Math.sin(a) * rr;
          box(g, px, y - 0.3, pz, 0.12, 1.4, 0.12, a, post, null, true);
          if (k < 9) { const qx = mir.x + Math.cos(a2) * rr, qz = mir.z + Math.sin(a2) * rr; for (const hgt of [0.5, 1.08]) ouRod(g, [px, y + hgt, pz], [qx, y + hgt, qz], 0.035, rail, 4); }
          if (k % 2 === 0 && k > -8 && k < 8) { const d = rr - 0.9 - R() * 0.4, fx = mir.x + Math.cos(a) * d, fz = mir.z + Math.sin(a) * d; crowdPut(CR, fx, y + 0.06, fz, Math.cos(a), Math.sin(a), { col: fans[Math.floor(R() * fans.length)] }, 1); } }
        for (const k of [-1, 1]) { const a = oa + PI + k * 0.7, bx = mir.x + Math.cos(a) * 6, bz = mir.z + Math.sin(a) * 6; box(g, bx, y + 0.06, bz, 2.0, 0.45, 0.5, a + PI / 2, [0.46, 0.32, 0.2], null, true); }
        { const a = oa + PI * 0.75, bx = mir.x + Math.cos(a) * 8.5, bz = mir.z + Math.sin(a) * 8.5, [v0, v1, u0, u1] = board(4);   // its name board
          box(g, bx, y - 0.2, bz, 0.1, 2.6, 0.1, 0, [0.36, 0.24, 0.14]); bannerQ(bx, y + 1.7, bz, Math.cos(oa), Math.sin(oa), 3.2, 0.8, v0, v1, u0, u1, ban2); }
        CR.block(mir.x, mir.z, 2 * rr + 2, 2 * rr + 2, 0);
      }
    }

    /* ---- guardrails where the ground falls away and round the outside of the bends (on the bridge a concrete parapet), a marker post every ~50 m
       where there is neither (knockable where it fits: rrProps) ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), steel = [0.8, 0.82, 0.84], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52];
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || onBr[i]) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]), both = (a) => a[i] && a[i + 1];
          if (both(onBr)) {   // the bridge: a concrete parapet
            const a = Q(i, -0.1, -0.05), b = Q(i + 1, -0.1, -0.05), c = Q(i + 1, 0.95, -0.05), d = Q(i, 0.95, -0.05), a2 = Q(i, -0.1, 0.4), b2 = Q(i + 1, -0.1, 0.4), c2 = Q(i + 1, 0.95, 0.4), d2 = Q(i, 0.95, 0.4), inn = Q(i, 0.4, 0.18);
            g.quadO(a, b, c, d, [0.68, 0.67, 0.64], inn); g.quadO(a2, b2, c2, d2, [0.6, 0.59, 0.56], inn); g.quadO(d, c, c2, d2, [0.76, 0.74, 0.7], inn);
          } else if (nd[i] && nd[i + 1]) {   // W-beam: a front and a back face, a post every 4 m
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
          } else if (!nd[i] && !onBr[i] && i % 25 === 0 && i > 2 && i < iE - 2) mkPosts.push([i, side]);
        }
      }
      const kp = rrProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
    }

    /* ---- the bends' signs (CURVA and the number) 30 m before each, on the right, facing the cars coming up; three chevrons on the outside of each
       hairpin; the place boards (the waterfall, the mist warning on the ladder, the plateau) ---- */
    (def.curves || []).forEach(([d, , turn], k) => {
      const [px, pz, ii] = onSide(sStart + d - 30, 1, 0.9);
      if (!excluded(px, pz)) { const py = caGround(px, pz), g = scen.get(px, pz), u0 = (k % 8) / 8, v1 = 1 - Math.floor(k / 8) / 8;
        box(g, px, py - 0.2, pz, 0.08, 2.1, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
        bannerQ(px, py + 1.2, pz, -T.tx[ii], -T.tz[ii], 0.85, 0.85, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2);
        exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); }
      const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 6 && sStart + d <= q.i1 * T.ds + 6); if (!c || c.sev < 2) return;
      const out_ = -turn, cell = turn > 0 ? 30 : 31, u0 = (cell % 8) / 8, v1 = 1 - Math.floor(cell / 8) / 8;
      for (const o of [-10, 0, 10]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.7); if (excluded(cx, cz)) continue;
        const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
        box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
        bannerQ(cx, cy + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2); CR.avoid(cx, cz, 0.6); }
    });
    { const nm = (n) => T.names.find(q => q.n.startsWith(n));
      for (const [n, k, o] of [['Cascata', 3, -40], ['Serpentina 4', 5, -60], ['Alto da Serra', 7, 20]]) { const q = nm(n); if (q) signAt(sStart + q.d + o, 1, k); } }

    /* ---- the waterfalls (def.falls): the water down the rock in a ribbon that follows the ground (its texture flows: dyn.water), white with foam,
       from the lip above the fall line down to its foot (or to the road, where the stream passes under it), dark wet rock and boulders round it ---- */
    let nFalls = 0;
    {
      const fMat = new THREE.MeshLambertMaterial({ map: tex.water, vertexColors: true, transparent: true, opacity: 0.86, depthWrite: false }), RW = rng(3331);
      const gradAt = (x, z) => { const e = 6, gx = vrFar(x + e, z) - vrFar(x - e, z), gz = vrFar(x, z + e) - vrFar(x, z - e), l = Math.hypot(gx, gz) || 1; return [-gx / l, -gz / l]; };   // (downhill)
      for (const [fx, fz, drop0, name] of def.falls || []) {
        if (vrDist(fx, fz) > 430) continue;
        const drop = drop0 || 26, wid = name ? 4.2 : 3 + RW() * 1.5, up = [], dn = [];
        let x = fx, z = fz; for (let k = 0; k < 40; k++) { const [dx, dz] = gradAt(x, z), nx = x - dx * 1.6, nz = z - dz * 1.6; if (caGround(nx, nz) - caGround(fx, fz) > drop * 0.55 || vrNear(nx, nz).dd < 4) break; x = nx; z = nz; up.push([x, z]); }
        x = fx; z = fz; for (let k = 0; k < 40; k++) { const [dx, dz] = gradAt(x, z), nx = x + dx * 1.6, nz = z + dz * 1.6; if (caGround(fx, fz) - caGround(nx, nz) > drop * 0.55 || vrNear(nx, nz).dd < 4) break; x = nx; z = nz; dn.push([x, z]); }
        const line = [...up.reverse(), [fx, fz], ...dn]; if (line.length < 4) continue;
        const g = new GB(true), foam = [1, 1, 1], blue = [0.78, 0.86, 0.88];
        for (let k = 0; k < line.length - 1; k++) {
          const [x0, z0] = line[k], [x1, z1] = line[k + 1], ux = z1 - z0, uz = -(x1 - x0), ul = Math.hypot(ux, uz) || 1, px = ux / ul * wid / 2, pz = uz / ul * wid / 2;
          const y0 = caGround(x0, z0) + 0.35, y1 = caGround(x1, z1) + 0.35, c0 = k % 3 ? blue : foam, c1 = (k + 1) % 3 ? blue : foam;
          g.quadUp([x0 - px, y0, z0 - pz], [x0 + px, y0, z0 + pz], [x1 + px, y1, z1 + pz], [x1 - px, y1, z1 - pz], [c0, c0, c1, c1], [[0, k * 0.35], [1, k * 0.35], [1, (k + 1) * 0.35], [0, (k + 1) * 0.35]]);
        }
        const m = new THREE.Mesh(g.geometry(), fMat); m.matrixAutoUpdate = false; m.renderOrder = 1; root.add(m);
        const gr = scen.get(fx, fz);   // the wet rock beside it, boulders at its foot
        for (let k = 0; k < line.length; k += 3) for (const sd of [-1, 1]) { const [lx, lz] = line[Math.min(k, line.length - 1)], [ax, az] = line[Math.min(k + 1, line.length - 1)], ux = az - lz, uz = -(ax - lx), ul = Math.hypot(ux, uz) || 1, bx = lx + ux / ul * sd * (wid / 2 + 1.2), bz = lz + uz / ul * sd * (wid / 2 + 1.2);
          if (vrNear(bx, bz).dd < 2) continue; const r0 = 0.8 + RW() * 1.6; rock(gr, bx, caGround(bx, bz) + r0 * 0.3, bz, r0 * 1.2, r0, r0, RW() * TAU, vary([0.26, 0.26, 0.25], RW, 0.15), RW, 0.3); }
        for (const [x2, z2] of line) exclPush(x2, z2, wid / 2 + 1.5);
        nFalls++;
      }
    }

    /* ---- spectators: the start and the finish, the checkpoints, the insides and outsides of every third bend, a few groups along the road ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.12, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'RR start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'RR finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.55, label: 'RR cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.4, label: 'RR cp-' }); });
      (def.curves || []).forEach(([d, , turn], k) => { if (k % 3 !== 1) return; const sm = sStart + d; for (const sd of [-1, 1]) run(sm - 18, sm + 18, sd, { rows: 2, dens: sd === turn ? 0.5 : 0.35, label: 'RR bend ' + (k + 1) }); });
      for (let s = sStart + 400; s < sFin - 300; s += 600) { const sd = rpHash(Math.round(s), 7) < 0.5 ? -1 : 1; run(s, s + 24, sd, { rows: 2, dens: 0.35, clump: 0.9, label: 'RR group' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the forest (instanced per 96 m chunk): the closed canopy of the Atlantic rainforest on the slopes (broadleaf crowns in many greens, emergent
       trees over them, palms, tree ferns in the gullies, bamboo at the edges); on the plateau's grassland the araucarias, alone and in groves, and
       shrubs. Right up to the ditch, thinner and bigger farther out, none on the cliffs ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 3, 4, 5].map(k => new IChunks(rrTreeGeo(k), tMatT, 96));
    let nTrees = 0, nArauc = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(100000 * dens), RT = rng(3341), SP = 4.5 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(250)) continue;
          if (hd > 130 && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // farther out every other spot (bigger trees: a closed canopy from above)
          const c = vrLC(x, z), grove = sstep(0.6, 0.78, P.n5(x * 1.2 + 90, z * 1.2));
          const low = (c === 0 || c === 2 || c === 3) && caGround(x, z) + base < 1370;   // (below the plateau the clearings grow over: shrubs, ferns, young trees)
          const p = c === 1 ? 0.95 : low ? 0.6 : c === 2 ? 0.55 : c === 0 ? 0.04 + 0.4 * grove : c === 3 ? 0.04 : 0;
          if (r1 > p) continue;
          if (vrWater(x, z).e > -4) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.2) continue; if (nn.i >= 0 && nn.dd < 5 && r2 < 0.2) continue;
          if (excluded(x, z)) continue;
          const sl = caSlope(x, z), cutF = sl > 1.2 && nn.i >= 0 && nn.dd < 30 && sl < 2.6;   // (the road's steep cuts: ferns and shrubs cling to them)
          if (!cutF && (sl > 1.9 || (sl > 1.2 && r2 < (sl - 1.2) / 0.7))) continue;   // (none on the sheer cliffs, thinner on the rock faces)
          const y = caGround(x, z), far = hd > 130 ? 1.15 : 1;
          let sp;
          if (cutF) sp = r3 < 0.5 ? 3 : 5;
          else if (low) sp = r3 < 0.45 ? 5 : r3 < 0.7 ? 3 : r3 < 0.8 ? 2 : 0;
          else if (c === 0 || c === 3) sp = r3 < 0.82 ? 4 : 5;
          else if (c === 2) sp = r3 < 0.6 ? 5 : r3 < 0.8 ? 3 : 0;
          else { const wet = sstep(0.62, 0.8, P.n7(x + 200, z)); sp = r3 < 0.1 ? 1 : r3 < 0.25 ? 2 : r3 < 0.25 + 0.12 + 0.18 * wet ? 3 : r3 < 0.62 + 0.1 * wet ? 0 : r3 < 0.94 ? 0 : 5;
            if (y + base > 1390 && r4 < 0.25) sp = 4; }   // (araucarias at the forest's top edge too)
          let hgt, wid, col;
          if (sp === 0) { hgt = 13 + r4 * 11; wid = hgt * (0.72 + r2 * 0.25); col = r2 < 0.2 ? [1.12, 1.08, 0.9] : r2 < 0.6 ? [1, 1, 1] : r2 < 0.85 ? [0.86, 0.94, 0.88] : [1.05, 0.96, 0.82]; }
          else if (sp === 1) { hgt = 24 + r4 * 9; wid = hgt * (0.8 + r2 * 0.2); col = r2 < 0.12 ? [1.25, 1.0, 1.05] : r2 < 0.5 ? [1, 1, 1] : [1.08, 1.06, 0.92]; }   // (now and then one in flower, pink: a quaresmeira)
          else if (sp === 2) { hgt = 9 + r4 * 6; wid = hgt * 0.75; col = [0.95 + r2 * 0.1, 1, 0.95]; }
          else if (sp === 3) { hgt = 3 + r4 * 3.2; wid = hgt * 1.1; col = [0.92 + r2 * 0.16, 1, 0.92]; }
          else if (sp === 4) { hgt = 14 + r4 * 12; wid = hgt * (0.85 + r2 * 0.2); col = [0.95 + r2 * 0.1, 0.97 + r4 * 0.06, 0.95]; nArauc++; }
          else { hgt = 2.2 + r4 * 2.6; wid = 2.4 + r2 * 2.4; col = [0.92 + r3 * 0.18, 0.98 + r4 * 0.1, 0.9]; }
          tk[sp].add(x, y - 0.15, z, r1 * 70, wid * far, hgt * far, col);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    tk.forEach((t, k) => t.addTo(root, LOD.tier > 0 || (k !== 3 && k !== 5)));   // (NIZKA: the tree ferns and the bamboo, low under the canopy, cast no shadow)

    /* ---- the verges and the cliffs: ferns and shrubs right behind the barrier, the red earth and rocks at the foot of the cuts, crags of dark basalt
       (pink sandstone lower down) where the slope rises steep beside the road and out on the escarpment ---- */
    {
      const RV = rng(3351), bushC = [[0.24, 0.4, 0.13], [0.2, 0.34, 0.12], [0.3, 0.44, 0.16], [0.26, 0.42, 0.18]], basalt = [[0.32, 0.31, 0.3], [0.38, 0.36, 0.34], [0.28, 0.28, 0.27]], sand = [[0.64, 0.5, 0.4], [0.7, 0.56, 0.44], [0.6, 0.46, 0.38]];
      const rockC = (A) => (A > 1150 ? basalt : sand)[Math.floor(RV() * 3)];
      API.ROCK_SMOOTH = true;
      for (let s = 4; s < T.len - 4; s += 3.4) for (const side of [-1, 1]) {
        const i = T.idx(s), r = RV(), [x, z] = onSide(s, side, 1.2 + RV() * 6);
        if (r > 0.3 || vrNear(x, z).dd < 0.8 || excluded(x, z) || vrWater(x, z).e > -3 || vrLC(x, z) === 0) continue;
        ico(scen.get(x, z), x, caGround(x, z) + 0.3, z, 0.6 + RV() * 0.8, 0.85, vary(bushC[Math.floor(RV() * bushC.length)], RV, 0.15), RV, 0.3);
      }
      API.ROCK_SMOOTH = false;
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {   // rocks at the foot of the cuts
        const i = T.idx(s); if (RV() > 0.3) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 30, [x, z] = onSide(s, side, o), sz = 0.5 + RV() * 1.2; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RV() * TAU, vary(rockC(T.hy[i] + base), RV, 0.1), RV, 0.3);
      }
      for (let s = 16; s < T.len - 16; s += 14) for (const side of [-1, 1]) {   // crags where the slope is steep
        if (RV() < 0.35) continue;
        const [x, z] = onSide(s, side, 8 + RV() * 120); if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(90)) continue;
        const sl = caSlope(x, z); if (sl < 0.85) continue;
        const y = caGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(rockC(y + base), RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 2.2 + RV() * 4, qx = x + (RV() - 0.5) * 9, qz = z + (RV() - 0.5) * 9, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0, r0 * (0.9 + RV() * 0.9), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, 0.35); }
      }
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fac.addTo(sceneryGroup, ouCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: rrAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: rrAtlas2(def.curves || []), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    {   // the mist out of the valley: banks over the ground lying well below the road near it (the valley under the cliff), rising up it
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x2 = cv.getContext('2d'), gr = x2.createRadialGradient(32, 32, 2, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x2.fillStyle = gr; x2.fillRect(0, 0, 64, 64);
      const mt = new THREE.CanvasTexture(cv); out.ownTex.push(mt);
      const RM = rng(3361), L = [];
      for (let k = 0, tries = 0; k < 18 && tries < 400; tries++) {
        const s = sStart + RM() * (sFin - sStart), i = T.idx(s), sd = RM() < 0.5 ? -1 : 1, o = 60 + RM() * 220, x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o;
        const gy = caGround(x, z); if (gy > T.hy[i] - 30 || vrDist(x, z) < 45) continue;
        const s2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, color: 0xe9eeee, transparent: true, opacity: 0, depthWrite: false, fog: true }));
        root.add(s2); L.push({ s: s2, x, z, y: gy + 8, H: 70 + RM() * 60, v: 0.6 + RM() * 0.6, p0: RM(), a: 0.3 + RM() * 0.2, r: 70 + RM() * 60 }); k++;
      }
      out.dyn.rrMist = { L, root }; rrMist(out.dyn.rrMist, 0);
    }
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, araucarias: nArauc, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), falls: nFalls, mist: out.dyn.rrMist.L.length };   // (read by the tests)
    return out;
  }

  Object.assign(API, { rrMist });   // (what World and the other worlds use of this one)
  World.ext.rastro = (scene, tex, opts) => buildRastro(scene, tex, opts);
})();
