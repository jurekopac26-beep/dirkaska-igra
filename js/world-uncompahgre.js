/* =========================================================================
   WORLD — Uncompahgre (theme 'uncompahgre'): its own builder (World.ext.uncompahgre), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    CAN, Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, brookMat, caCar, caCondors, caNear, clamp, cone, crowdCtx, crowdFinish, crowdPut,
    crowdRun, cyl, gable, ico, lerp, ouCutMat, ouRod, pkGroundMat, propFloorTable, puff, rng, roadsideProps, rock, rpHash, sstep, starCone,
    stubExcl, stubGeo, stubProps, stubVerge, tuftGeo, tuftWindMat, valueNoise2, vary, vrDem, vrDist, vrFar, vrGritTex, vrLC, vrLCf, vrNear,
    vrPrep, vrStubH, vrWater
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= UNCOMPAHGRE (theme 'uncompahgre') =================
     The Uncompahgre Gorge (Colorado): U.S. Route 550 south of Ouray, the Million Dollar Highway, on a shelf cut into the cliffs of the San Juan
     Mountains above the drop to the river, no guard rails. Built on Vršič's corridor (vrPrep and the terrain helpers read the same forms: def.dem,
     def.lc, def.lakes, def.bridges, def.bld) and Los Caracoles' height blend (caNear), with a look of its own: on the drops (def.drops, Track.dropAt)
     the ground falls away steeply right past the shoulder (unH), the cliffs of grey quartzite streaked with rust and iron-red, spruce and fir
     forest with groves of aspen (green in summer, gold in autumn: the world is painted for the season, UNS, as Vršič), the streams down in the gorge
     and Bear Creek Falls under the bridge (def.creeks, def.falls: Spa's flowing water), the little rock tunnel and the Riverside snow shed (def.galleries:
     their roofs fade while the followed car is inside), the old mines (def.mines: generic timber buildings, a headframe and the orange tailings),
     yellow warning signs and chevrons, the closed road's queue at both ends. */
  let UNS = 'summer';                          // the season the world is painted in ('summer' or 'autumn': buildUncompahgre, from opts.season; winter: the autumn look, snowed over)
  const UNCOL = [0, 0, 0];
  let UNW = null;                              // per road sample and side ([0] left, [1] right): how much of a drop is there (0..1, eased over ~24 m)
  let UNC = null;                              // the creeks' courses for their beds: { L: [{ hw, x, z, y }] (3 m steps, y the water's level, falling downstream), cells: 16 m hash of [creek, step] }
  const UNCQ = { d: 1e9, y: 0, hw: 0 };
  function unCreekAt(x, z) {   // the nearest creek within its bed's reach: lateral distance, water level and half width there (UNCQ; d 1e9: none)
    UNCQ.d = 1e9; const L = UNC.cells.get(Math.floor(x / 16) + ',' + Math.floor(z / 16)); if (!L) return UNCQ;
    for (let q = 0; q < L.length; q += 2) { const C = UNC.L[L[q]], k = L[q + 1], ax = C.x[k], az = C.z[k], bx = C.x[k + 1], bz = C.z[k + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1), px = ax + dx * t - x, pz = az + dz * t - z, d = Math.sqrt(px * px + pz * pz);
      if (d < UNCQ.d) { UNCQ.d = d; UNCQ.y = C.y[k] + (C.y[k + 1] - C.y[k]) * t; UNCQ.hw = C.hw; } }
    return UNCQ;
  }
  let UNF = null;                              // Bear Creek Falls: where the creek drops off below the bridge ({ x, z: the lip, dx, dz: out over the gorge, y: the lip's height })
  function unH(x, z) {   // terrain height (as caH; on a drop the ground falls at ~62 degrees from the edge of the shoulder down to the real terrain)
    const n = caNear(x, z), i = n.i, dd = n.dd; let h;
    if (i < 0) h = vrFar(x, z);
    else {
      const hr = n.h - 0.3, f = vrFar(x, z); h = dd <= 1 ? hr : lerp(hr, f, sstep(1, 42, dd));
      if (UNW) { const lat = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], w = UNW[lat > 0 ? 1 : 0][i];
        if (w > 0 && dd > 0) h = lerp(h, Math.min(h, Math.max(f, T.hy[i] - 0.35 - 2.75 * Math.max(0, dd - 0.15))), w); }
    }
    if (UNC && (i < 0 || dd > 7)) { const q = unCreekAt(x, z); if (q.d < q.hw + 7) {   // a creek's bed: a shallow bowl under the water, the banks rising to the slope over 7 m
      const dep = 0.3 + 0.05 * q.hw * 2, t = q.d < q.hw ? q.y - dep * (1 - (q.d / q.hw) * (q.d / q.hw)) : lerp(q.y + 0.04, h, sstep(q.hw, q.hw + 7, q.d)); h = Math.min(h, lerp(h, t, i >= 0 ? sstep(7, 12, dd) : 1)); } }   // (none right by the road: the culverts)
    if (UNF) { const F = UNF, a = (x - F.x) * F.dx + (z - F.z) * F.dz, b = Math.abs((x - F.x) * F.dz - (z - F.z) * F.dx);   // the falls' slot: a narrow, ragged ravine from the lip, widening down to the pool and on
      if (a > -5 && a < 36) { const wd = 2.4 + 0.3 * Math.max(0, a) + (API.VR.n6(x, z) - 0.5) * 3.2; if (b < wd + 7) { const f = vrFar(x, z), bed = Math.max(f - 1.5, F.y - 1 - 34 * sstep(1.2, 5, a)) + Math.max(0, a - 20) * 0.55;
        h = Math.min(h, lerp(bed, h, clamp(sstep(wd, wd + 6, b) + sstep(-0.5, -4.5, a), 0, 1))); } } }
    const pads = API.VR.pads; for (let k = 0; k < pads.length; k++) { const p = pads[k], d = Math.hypot(x - p.x, z - p.z), pb = p.b || 12; if (d < p.r + pb) h = lerp(p.h, h, sstep(p.r, p.r + pb, d)); }   // level plots: the car parks, the mines
    for (const b of API.VR.gul) {   // the creek's bed under the bridge (as vrH)
      if (i < 0 || Math.abs(i - b.i) * T.ds > b.half + 30) continue;
      const dx = x - b.x, dz = z - b.z, al = Math.abs(dx * b.tx + dz * b.tz), lat = Math.abs(dx * b.nx + dz * b.nz);
      if (al < b.half + 14 && lat < 60) h = Math.min(h, lerp(h, b.y, sstep(60, 22, lat)) + Math.max(0, al - b.bw / 2) * 1.2);
    }
    if (i >= 0) h = Math.min(h, n.env);
    if (API.STG) h = vrStubH(x, z, h, i >= 0 ? dd : 999);   // the side roads: the ground levelled under them
    return h;
  }
  function unGH(i, j) {   // terrain height at grid vertex (i, j), computed once (VR.G: the same grid as Vršič's)
    const G = API.VR.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = unH(G.x0 + i * VRC, G.z0 + j * VRC); G.dd[k] = CAN.i >= 0 ? CAN.dd : 999; (G.rh || (G.rh = new Float32Array(G.nx * G.nz)))[k] = CAN.i >= 0 ? CAN.h - h : 0; }
    return h;
  }
  function unDeep(k) { return API.VR.G.rh ? API.VR.G.rh[k] : 0; }   // how far below the road around a grid vertex lies (the gorge's shade: unTileGeo)
  function unGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / VRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = unGH(i, j); return a + u * (unGH(i + 1, j) - a) + v * (unGH(i, j + 1) - a); }
    const d = unGH(i + 1, j + 1); return d + (1 - u) * (unGH(i, j + 1) - d) + (1 - v) * (unGH(i + 1, j) - d);
  }
  function unSlope(x, z) { const a = unGround(x - 2.5, z), b = unGround(x + 2.5, z), c = unGround(x, z - 2.5), d = unGround(x, z + 2.5); return Math.hypot(b - a, d - c) / 5; }
  function unSnow(x, z, A, ny, sz) {   // how much snow lies at (x, z): old patches on the shady (north-facing: sz < 0) slopes from ~3450 m in summer, the first
    // snow of the autumn from ~3250 m (lower on the north faces), off the steepest faces; and what WorldCover maps as snow (lc 6)
    const P = API.VR, au = UNS !== 'summer', line = (au ? 3330 : 3620) + 260 * clamp(sz * 2.2, -1, 1) + (P.c4(x, z) - 0.5) * 200;
    const k = sstep(line, line + 140, A) * sstep(0.45, 0.72, ny) * sstep(0.4, 0.66, P.c5(x, z) + 0.3 * sstep(line, line + 400, A));
    return Math.max(k, vrLCf(x, z, 6) * sstep(0.32, 0.6, ny));
  }
  function unCol(x, z, h, ny, sz, dd, sx) {   // ground colour (times the grey grit map): the forest floor under the spruce (lc 1: dark, needles and moss), mountain
    // meadows (lc 0: green in summer, straw and russet in autumn), willow scrub (lc 2), the rock and scree (lc 4) and the cliffs: grey quartzite and slate
    // streaked with rust, iron-red and ochre (the iron oxides of the San Juans), banded on the steep faces; the snow; a gravel verge by the road
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), r = P.c3(x, z), f = P.n4(x, z), au = UNS !== 'summer';
    const fo = vrLCf(x, z, 1), gr = vrLCf(x, z, 0), sh = vrLCf(x, z, 2), ro = vrLCf(x, z, 4), se = vrLCf(x, z, 3);
    let R = 0.41, G = 0.4, B = 0.4;   // grey quartzite and slate
    const rust = sstep(0.58, 0.86, m), red = sstep(0.64, 0.88, q) * (1 - 0.5 * rust), dark = sstep(0.52, 0.8, r);
    R = lerp(R, 0.5, rust * 0.75); G = lerp(G, 0.38, rust * 0.75); B = lerp(B, 0.29, rust * 0.75);   // (rust and iron-red, not too pink under the warm grit)
    R = lerp(R, 0.46, red * 0.7); G = lerp(G, 0.32, red * 0.7); B = lerp(B, 0.26, red * 0.7);
    R = lerp(R, 0.29, dark * 0.8); G = lerp(G, 0.29, dark * 0.8); B = lerp(B, 0.31, dark * 0.8);
    const och = sstep(0.66, 0.88, P.c4(x * 1.3, z * 1.3)) * (1 - dark); R = lerp(R, 0.62, och * 0.4); G = lerp(G, 0.5, och * 0.4); B = lerp(B, 0.32, och * 0.4);
    R += (f - 0.5) * 0.1; G += (f - 0.5) * 0.095; B += (f - 0.5) * 0.09;
    const st = sstep(0.8, 0.5, ny);   // the steep faces: rock in bands along the height, streaked with rust down the fall line
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 5.5 + P.c2(x * 0.4, z * 0.4) * 7), k = 0.78 + 0.24 * band, sk = sstep(0.55, 0.85, P.n3(x * 2.4 + z * 0.3, A * 0.05)) * 0.5;
      R = lerp(R, 0.38 * k + rust * 0.12 + red * 0.08 + sk * 0.14, st); G = lerp(G, 0.37 * k + rust * 0.03 + sk * 0.05, st); B = lerp(B, 0.37 * k, st); }
    const veg = 1 - st * 0.8;
    const mg = Math.min(1, gr + ro * 0.5 * sstep(24, 4, dd)) * veg * (0.75 + 0.25 * P.n2(x * 1.7, z * 1.7));   // meadows (and the grassy verges in WorldCover's bare strip along the road itself)
    if (au) { R = lerp(R, 0.6 + (m - 0.5) * 0.12, mg); G = lerp(G, 0.52 + (q - 0.5) * 0.08, mg); B = lerp(B, 0.33, mg); }
    else { R = lerp(R, 0.31 + (m - 0.5) * 0.1, mg); G = lerp(G, 0.45 + (q - 0.5) * 0.08, mg); B = lerp(B, 0.19, mg); }
    const ff = fo * veg; R = lerp(R, au ? 0.36 : 0.3, ff); G = lerp(G, au ? 0.32 : 0.33, ff); B = lerp(B, 0.2, ff);   // the forest floor (in autumn the aspens' leaves on it)
    R = lerp(R, au ? 0.58 : 0.4, sh * veg * 0.7); G = lerp(G, au ? 0.42 : 0.45, sh * veg * 0.7); B = lerp(B, 0.24, sh * veg * 0.7);
    R = lerp(R, 0.55 + rust * 0.08, ro * 0.35 * (1 - st)); G = lerp(G, 0.52, ro * 0.35 * (1 - st)); B = lerp(B, 0.48, ro * 0.35 * (1 - st));   // the scree: paler
    R = lerp(R, 0.62, se * 0.5); G = lerp(G, 0.6, se * 0.5); B = lerp(B, 0.56, se * 0.5);
    const sn = unSnow(x, z, A, ny, sz); R = lerp(R, 1.02, sn); G = lerp(G, 1.04, sn); B = lerp(B, 1.09, sn);
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.5 * (1 - sn); R = lerp(R, 0.52, t); G = lerp(G, 0.5, t); B = lerp(B, 0.46, t); }
    UNCOL[0] = R; UNCOL[1] = G; UNCOL[2] = B; return UNCOL;
  }
  function unGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in unTileGeo)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = unGH(ii, jj);
      const nx = -(unGH(ii + 1, jj) - unGH(ii - 1, jj)) / (2 * VRC), nz = -(unGH(ii, jj + 1) - unGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = unCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, nz / l, G.dd[jj * G.nx + ii], nx / l);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function unTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells, in the haze)
    const G = API.VR.G, L = VRC * VRT, d = vrDist(G.x0 + (ti + 0.5) * L, G.z0 + (tj + 0.5) * L);
    return d < 300 ? 1 : d < 440 ? 2 : 0;
  }
  function unTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by unCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = unGH(i, j);
      let nx = -(unGH(i + st, j) - unGH(i - st, j)) / (2 * VRC * st), nz = -(unGH(i, j + st) - unGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const gk = clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1), c = unCol(x, z, h, ny, nz, G.dd[gk], nx), dk = 1 - 0.4 * sstep(3, 45, unDeep(gk));   // (down in the gorge, below the road: in its shade, a bluer haze)
      col[k * 3] = c[0] * dk; col[k * 3 + 1] = c[1] * dk; col[k * 3 + 2] = c[2] * (0.08 + 0.92 * dk) + 0.04 * (1 - dk);
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? unTileOn(a, b) : 0);
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
  let unATex = null, unAKey = '', unA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function unAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the finish's board, the race's banner
    const key = cps.join('|') + '|' + finA; if (unATex && unAKey === key) return unATex;
    if (unATex) unATex.dispose(); unAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(312, 142, 400, 100); txt('FINISH', 512, 196, 92, '#111', 380);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#7a2e1c'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#5b3a22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#efe3c8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('UNCOMPAHGRE GORGE', 512, 812, 56, '#f3ead6', 900); txt('ELEV. ' + finA, 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#f2f2ee'; x.fillRect(0, 896, 1024, 128); for (let k = 0; k < 7; k++) { x.fillStyle = k % 2 ? '#f2f2ee' : '#b22234'; x.fillRect(0, 896 + k * 128 / 7, 1024, 128 / 7 + 0.5); }   // (the stripes of the US flag, the canton at the left)
    x.fillStyle = '#3c3b6e'; x.fillRect(0, 896, 200, 69); x.fillStyle = '#fff'; for (let a = 0; a < 5; a++) for (let b = 0; b < 3; b++) { x.beginPath(); x.arc(20 + a * 40, 912 + b * 18, 4, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = 'rgba(22,24,28,0.82)'; x.fillRect(230, 916, 780, 92); txt('SAN JUAN HILL CLIMB', 620, 944, 50, '#fff', 760); txt('US 550 · OURAY · COLORADO', 620, 990, 36, '#ffd23a', 760);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (unATex = t);
  }
  const UN_BOARDS = [['BEAR CREEK FALLS', '#6b4a22'], ['UNCOMPAHGRE GORGE', '#6b4a22'], ['ALPINE LOOP', '#6b4a22'], ['AVALANCHE AREA', '#e2b21a'], ['FALLING ROCK', '#e2b21a'], ['SLIDE PATH', '#f2f2ee'], ['RIVERSIDE SLIDE', '#f2f2ee'], ['US 550 SOUTH', '#f2f2ee']];
  function unAtlas2() {   // the small signs: row 0, the yellow warning diamonds (a curve to the right, to the left; the narrow road) and the chevrons (right, left);
    // rows 4-7, the place boards (two a row, 512 x 128: brown for the sights, yellow warnings, white for the slide paths and the road)
    if (unA2Tex) return unA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (let k = 0; k < 3; k++) {   // the diamonds: a yellow square turned 45 degrees with a black rim, a black arrow
      const x0 = k * 128 + 64, y0 = 64; x.fillStyle = '#16181c'; x.beginPath(); x.moveTo(x0, y0 - 62); x.lineTo(x0 + 62, y0); x.lineTo(x0, y0 + 62); x.lineTo(x0 - 62, y0); x.closePath(); x.fill();
      x.fillStyle = '#f2c21b'; x.beginPath(); x.moveTo(x0, y0 - 55); x.lineTo(x0 + 55, y0); x.lineTo(x0, y0 + 55); x.lineTo(x0 - 55, y0); x.closePath(); x.fill();
      x.strokeStyle = '#16181c'; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath();
      if (k < 2) { const d = k ? -1 : 1; x.moveTo(x0 - 8 * d, y0 + 32); x.lineTo(x0 - 8 * d, y0); x.quadraticCurveTo(x0 - 8 * d, y0 - 18, x0 + 12 * d, y0 - 22); x.stroke(); x.fillStyle = '#16181c'; x.beginPath(); x.moveTo(x0 + 24 * d, y0 - 23); x.lineTo(x0 + 8 * d, y0 - 36); x.lineTo(x0 + 8 * d, y0 - 9); x.closePath(); x.fill(); }
      else { x.moveTo(x0 - 14, y0 - 30); x.quadraticCurveTo(x0 - 5, y0, x0 - 14, y0 + 30); x.moveTo(x0 + 14, y0 - 30); x.quadraticCurveTo(x0 + 5, y0, x0 + 14, y0 + 30); x.stroke(); }
    }
    for (const [k, dir] of [[3, 1], [4, -1]]) {   // the chevrons: black arrows on yellow, pointing the way the road turns
      const x0 = k * 128; x.fillStyle = '#f2c21b'; x.fillRect(x0, 0, 128, 128); x.fillStyle = '#16181c';
      const cx = x0 + 64; x.beginPath(); x.moveTo(cx - 22 * dir, 18); x.lineTo(cx + 22 * dir, 64); x.lineTo(cx - 22 * dir, 110); x.lineTo(cx - 46 * dir, 110); x.lineTo(cx - 2 * dir, 64); x.lineTo(cx - 46 * dir, 18); x.closePath(); x.fill(); }
    UN_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, dark = bg === '#e2b21a' || bg === '#f2f2ee';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = dark ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, 54, dark ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (unA2Tex = t);
  }
  function unTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them), shaped for the high cameras: 0 Engelmann spruce and subalpine fir (four drooping
    // tiers, the sunlit tips lighter), 1 the same far from the road (three tiers of four tips: the outline from above is what reads), 2 quaking aspen (a white trunk, a
    // round, lumpy crown of light leaves: green in summer, gold in autumn), 4 the spruce under snow
    const g = new GB(), R = rng(560 + kind), rs = API.ROCK_SMOOTH, au = UNS !== 'summer', snow = [0.93, 0.95, 0.99];
    API.ROCK_SMOOTH = false;
    if (kind === 0 || kind === 4) {
      const col = [0.075, 0.16, 0.115], tip = [0.19, 0.31, 0.22];
      [[0.02, 0.31, 0.32, 0.06], [0.23, 0.25, 0.31, 0.05], [0.44, 0.19, 0.28, 0.045], [0.61, 0.13, 0.24, 0.035]].forEach(([y, r, h, dr], k) => {
        const kk = k % 2 ? 1.1 : 1, c = [col[0] * kk, col[1] * kk, col[2] * kk]; starCone(g, 0, y, 0, r, h, 5, kind === 4 ? snow : c, kind === 4 ? c : tip, k * 0.66, dr); });
      cone(g, 0, 0.78, 0, 0.055, 0.22, 4, kind === 4 ? snow : col, tip, 0.4);
    } else if (kind === 1) {
      const col = [0.08, 0.165, 0.12], tip = [0.18, 0.3, 0.21];
      [[0.03, 0.31, 0.4, 0.06], [0.33, 0.22, 0.34, 0.045], [0.58, 0.14, 0.27, 0.035]].forEach(([y, r, h, dr], k) => starCone(g, 0, y, 0, r, h, 4, k % 2 ? [col[0] * 1.1, col[1] * 1.1, col[2] * 1.1] : col, tip, k * 0.8, dr));
      cone(g, 0, 0.8, 0, 0.05, 0.2, 3, col, tip, 0.3);
    } else {
      const leaf = au ? [0.95, 0.72, 0.18] : [0.38, 0.55, 0.2], bark = [0.86, 0.86, 0.8];
      cyl(g, 0, -0.02, 0, 0.026, 0.6, 3, bark, null, 0.014);
      API.ROCK_SMOOTH = true;
      puff(g, 0.02, 0.68, -0.02, 0.28, 1.05, leaf, R, 0.5, 0.6, 1.12);   // (one lumpy clump: the outline from above irregular)
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // a standing dead spruce (the spruce beetle's grey stands in the San Juans): a bare tapering trunk, three tiers of stiff grey branch stubs; red: one killed
  // last year, its needles still on, rusty red-brown
  function unSnag(g, x, y, z, h, w, rot, red, R) {
    const bk = vary(red ? [0.36, 0.28, 0.22] : [0.55, 0.52, 0.48], R, 0.12), br = red ? vary([0.34, 0.2, 0.13], R, 0.1) : [bk[0] * 0.82, bk[1] * 0.82, bk[2] * 0.82];
    cyl(g, x, y - 0.3, z, Math.max(0.12, h * 0.016), h + 0.3, 3, bk, null, 0.03);
    for (const [f, r] of [[0.3, 0.5], [0.52, 0.36], [0.72, 0.22]]) starCone(g, x, y + h * f, z, w * r * (red ? 0.7 : 1), h * (red ? 0.24 : 0.1), red ? 5 : 3, br, red ? [br[0] * 1.15, br[1] * 1.08, br[2]] : br, rot + f * 5, h * 0.03);
  }
  function unFlowerGeo() {   // a clump of wildflowers (the unit about a metre across, height 1; the instance tints the petals): five heads on short stems, each a little
    // star of petals facing up (both faces), a darker heart
    const g = new GB(), R = rng(571), stem = [0.26, 0.36, 0.16];
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R(), d = k ? 0.18 + R() * 0.25 : 0, cx = Math.cos(a) * d, cz = Math.sin(a) * d, h = 0.35 + R() * 0.3, r = 0.07 + R() * 0.04, w = [1, 1, 1], hc = [0.9, 0.85, 0.6];
      g.triO([cx - 0.012, 0, cz], [cx + 0.012, 0, cz], [cx, h, cz], stem, [cx, h * 0.5, cz + 1]); g.triO([cx - 0.012, 0, cz], [cx, h, cz], [cx + 0.012, 0, cz], stem, [cx, h * 0.5, cz - 1]);
      for (let q = 0; q < 4; q++) { const b = q / 4 * TAU + a, c = Math.cos(b), s = Math.sin(b), c2 = Math.cos(b + 0.6), s2 = Math.sin(b + 0.6), P0 = [cx, h + 0.02, cz], P1 = [cx + c * r, h, cz + s * r], P2 = [cx + c2 * r * 0.7, h + 0.01, cz + s2 * r * 0.7];
        g.triO(P0, P1, P2, w, [cx, h - 1, cz], hc, w); g.triO(P0, P2, P1, w, [cx, h + 1, cz], hc, w); } }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the animals of the gorge, life size and a little more (they read from the high cameras), merged into the scenery: 0 a bighorn sheep (brown, the white rump,
  // a ram's heavy curls), 1 a mountain goat (white, short black horns), 2 a mule deer (grey-brown, the white rump, big ears), 3 an elk (tan, the dark neck and
  // head, the pale rump, a bull's antlers). +x forward; graze: the head down in the grass
  function unBeast(g, x, y, z, h, kind, sc, R, male, graze) {
    const D = [[1.5, 0.95, [0.46, 0.36, 0.26], [0.42, 0.32, 0.23], [0.9, 0.86, 0.78]], [1.45, 0.95, [0.9, 0.88, 0.82], [0.88, 0.86, 0.8], [0.92, 0.9, 0.84]], [1.6, 1.0, [0.48, 0.41, 0.33], [0.44, 0.37, 0.3], [0.9, 0.88, 0.82]], [2.3, 1.45, [0.6, 0.46, 0.3], [0.32, 0.24, 0.16], [0.84, 0.74, 0.55]]][kind];
    const L = D[0] * sc, H = D[1] * sc, coat = vary(D[2], R, 0.08), neck = vary(D[3], R, 0.06), rump = D[4], c = Math.cos(h), s = Math.sin(h), Pp = (u, v, w) => [x + c * u - s * w, y + v, z + s * u + c * w], dark = [0.1, 0.09, 0.08];
    const rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true; const br = H * 0.3;
    let p = Pp(0.2 * L, 0.64 * H, 0); ico(g, p[0], p[1], p[2], br * 1.05, 0.86, coat, R, 0.12);
    p = Pp(-0.2 * L, 0.62 * H, 0); ico(g, p[0], p[1], p[2], br, 0.86, coat, R, 0.12);
    p = Pp(-0.4 * L, 0.64 * H, 0); ico(g, p[0], p[1], p[2], br * 0.62, 0.95, rump, R, 0.1);
    const hx = graze ? 0.5 : 0.56, hy = graze ? 0.3 : 1.02; p = Pp(0.42 * L, (graze ? 0.62 : 0.86) * H, 0); ico(g, p[0], p[1], p[2], br * 0.5, graze ? 0.9 : 1.3, neck, R, 0.1);
    const hp = Pp(hx * L, hy * H, 0); ico(g, hp[0], hp[1], hp[2], br * 0.42, 0.85, neck, R, 0.1);
    if (kind === 2) for (const w of [-1, 1]) { const e = Pp(hx * L - 0.05, hy * H + br * 0.45, w * br * 0.45); ico(g, e[0], e[1], e[2], br * 0.22, 0.6, neck, R, 0.1); }   // (the mule deer's ears)
    API.ROCK_SMOOTH = false;
    for (const [u, w] of [[0.28, 0.13], [0.28, -0.13], [-0.3, 0.13], [-0.3, -0.13]]) { const q = Pp(u * L, 0, w * H); box(g, q[0], q[1] - 0.05, q[2], 0.08 * H, 0.52 * H, 0.08 * H, h, kind === 1 ? [0.84, 0.82, 0.76] : [coat[0] * 0.85, coat[1] * 0.85, coat[2] * 0.85]); }
    if (kind === 0 && male) for (const w of [-1, 1]) { const q = Pp(hx * L - 0.06, hy * H + br * 0.15, w * br * 0.55); ico(g, q[0], q[1], q[2], br * 0.36, 0.9, [0.78, 0.68, 0.5], R, 0.15); }   // (the ram's curls)
    if (kind === 1) for (const w of [-1, 1]) { const q = Pp(hx * L - 0.05, hy * H + br * 0.3, w * br * 0.2); cone(g, q[0], q[1], q[2], 0.04 * sc, 0.22 * sc, 3, dark, dark, 0); }
    if (kind === 3 && male) for (const w of [-1, 1]) { const a = Pp(hx * L - 0.1, hy * H + br * 0.3, w * br * 0.25), b = Pp(hx * L - 0.5, hy * H + br * 0.3 + 0.9 * sc, w * 0.55 * sc), m = Pp(hx * L - 0.25, hy * H + 0.5 * sc, w * 0.4 * sc);
      ouRod(g, a, b, 0.04 * sc, [0.62, 0.54, 0.42], 3); ouRod(g, m, [m[0] + c * 0.35 * sc, m[1] + 0.3 * sc, m[2] + s * 0.35 * sc], 0.03 * sc, [0.62, 0.54, 0.42], 3); }   // (the bull's antlers)
    API.ROCK_SMOOTH = rs;
  }
  function unRavenGeo() {   // a raven, wings spread for soaring (x forward, ~1.6 m across at scale 1): the black body and head, the long wedge tail, both faces of the wings
    const g = new GB(), K = [0.05, 0.05, 0.06], R = rng(577);
    API.ROCK_SMOOTH = true; ico(g, 0, 0, 0, 0.16, 0.55, K, R, 0.1); ico(g, 0.2, 0.02, 0, 0.08, 0.8, K, R, 0.1); API.ROCK_SMOOTH = false;
    for (const sd of [-1, 1]) { const A = [0.12, 0, sd * 0.08], B = [-0.12, 0, sd * 0.08], C = [-0.08, 0.08, sd * 0.8], D = [0.1, 0.07, sd * 0.78]; g.quadO(A, B, C, D, K, [0, -1, sd * 0.4]); g.quadO(A, B, C, D, K, [0, 1, sd * 0.4]); }
    g.triO([-0.14, 0, -0.07], [-0.14, 0, 0.07], [-0.46, 0.01, 0], K, [-0.3, -1, 0]); g.triO([-0.14, 0, -0.07], [-0.46, 0.01, 0], [-0.14, 0, 0.07], K, [-0.3, 1, 0]);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function unStoneGeo() {   // two stones of the scree, sunk in it (the unit about a metre across): four-sided, the tops lit, the feet darker (24 faces)
    const g = new GB(), R = rng(579), C = [[0.6, 0.57, 0.53], [0.55, 0.47, 0.41]];
    for (let k = 0; k < 2; k++) { const a0 = R() * TAU, d = k ? 0.3 : 0, cx = Math.cos(a0) * d, cz = Math.sin(a0) * d, rx = k ? 0.12 : 0.22, ry = rx * (0.6 + R() * 0.3), col = C[k], lo = col.map(v => v * 0.66), hi = col.map(v => v * 1.15), B = [], M = [], top = [cx, ry, cz], inn = [cx, ry * 0.2, cz];
      for (let q = 0; q < 4; q++) { const a = (q + (R() - 0.5) * 0.5) / 4 * TAU + a0, f = 0.8 + R() * 0.4; B.push([cx + Math.cos(a) * rx * f, -ry * 0.25, cz + Math.sin(a) * rx * f]); M.push([cx + Math.cos(a) * rx * f * 0.8, ry * 0.5, cz + Math.sin(a) * rx * f * 0.8]); }
      for (let q = 0; q < 4; q++) { const j = (q + 1) % 4; g.quadO(B[q], B[j], M[j], M[q], col, inn, null, [lo, lo, col, col]); g.triO(M[q], M[j], top, col, inn, col, hi); } }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // a weathered timber building of an old mine (L along x, the downhill side at -z): a stone footing, plank walls grey-brown with age, a rusty tin roof
  // (one end of it caved in: a few sheets missing), dark window holes
  function unMineHouse(g, x, y0, y1, z, rot, L, D, fl, R) {
    const c = Math.cos(rot), s = Math.sin(rot), wood = vary([0.42, 0.36, 0.3], R, 0.15), roof = vary([0.5, 0.3, 0.2], R, 0.2), H = fl * 3.0, yb = y1 + 0.2;
    box(g, x, y0 - 0.4, z, L + 0.3, yb - y0 + 0.4, D + 0.3, rot, [0.5, 0.47, 0.43], null, true);
    box(g, x, yb, z, L, H, D, rot, wood, null, true);
    for (let k = 0; k < Math.floor(L / 2.6); k++) { const u = -L / 2 + 1.3 + k * 2.6; for (let f = 0; f < fl; f++) for (const v of [-D / 2 - 0.02, D / 2 + 0.02]) box(g, x + c * u - s * v, yb + 1.1 + f * 3.0, z + s * u + c * v, 0.8, 1.0, 0.06, rot, [0.08, 0.07, 0.06], null, true); }
    gable(g, x - c * L * 0.12, yb + H, z - s * L * 0.12, L * 0.76 + 0.6, D + 0.8, D * 0.28, rot, roof, wood);
  }
  // a timber headframe over an old shaft: four legs leaning in, cross braces, the sheave wheel at the top
  function unHeadframe(g, x, y, z, rot, R) {
    const wood = vary([0.38, 0.32, 0.26], R, 0.12), H = 9 + R() * 3, c = Math.cos(rot), s = Math.sin(rot);
    for (const [u, v] of [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]]) ouRod(g, [x + c * u - s * v, y - 0.3, z + s * u + c * v], [x + c * u * 0.3 - s * v * 0.3, y + H, z + s * u * 0.3 + c * v * 0.3], 0.16, wood, 4);
    for (const hh of [2.8, 5.6]) { const k = 1 - hh / H * 0.7; for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) ouRod(g, [x + 1.6 * k * (c * a[0] - s * a[1]), y + hh, z + 1.6 * k * (s * a[0] + c * a[1])], [x + 1.6 * k * (c * b[0] - s * b[1]), y + hh, z + 1.6 * k * (s * b[0] + c * b[1])], 0.1, wood, 4); }
    box(g, x, y + H - 0.1, z, 1.4, 0.4, 1.4, rot, wood); cyl(g, x, y + H + 0.3, z, 0.9, 0.18, 10, [0.32, 0.22, 0.16]);
  }
  function buildUncompahgre(scene, tex, opts) {
    const R = rng(5511), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    UNS = opts.season === 'autumn' || opts.season === 'winter' ? 'autumn' : 'summer';   // (as Vršič: summer green; autumn and winter the autumn look, which winter's season code snows over)
    const out = { root, dyn: {}, groundH: unGround, camFloor: unGround, props: [], farClip: true, ownTex: [], dust: [0.66, 0.6, 0.52], season: UNS, paintFor: (s) => (s === 'autumn' || s === 'winter' ? 'autumn' : 'summer') };
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(811, 140); P.c2 = valueNoise2(812, 60); P.c3 = valueNoise2(813, 200); P.c4 = valueNoise2(814, 110); P.c5 = valueNoise2(815, 26);
    UNW = null;
    if (T.dropAt) { UNW = [new Float32Array(N), new Float32Array(N)]; for (let sd = 0; sd < 2; sd++) { const D = T.dropAt[sd], W = UNW[sd]; for (let i = 0; i < N; i++) { let s = 0; for (let o = -6; o <= 6; o++) s += D[clamp(i + o, 0, N - 1)]; W[i] = sstep(0.1, 0.75, s / 13); } } }
    UNC = null;   // the creeks' courses (def.creeks, every 3 m), their water's level falling downstream (the real terrain along them, a running minimum, smoothed)
    if (def.creeks && def.creeks.length) {
      const L = [], cells = new Map();
      for (const cr of def.creeks) {
        const W = cr[0] <= 2 ? 1.3 : cr[0] >= 6 ? 7 : cr[0], xs = [], zs = [];   // (the brooks narrower, the river a little wider)
        for (let k = 1; k + 3 < cr.length; k += 2) { const ax = cr[k], az = cr[k + 1], bx = cr[k + 2], bz = cr[k + 3], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 3)); for (let m = 0; m < n; m++) { xs.push(ax + (bx - ax) * m / n); zs.push(az + (bz - az) * m / n); } }
        xs.push(cr[cr.length - 2]); zs.push(cr[cr.length - 1]);
        let y = xs.map((x, k) => vrDem(x, zs[k])); if (y[0] < y[y.length - 1]) { xs.reverse(); zs.reverse(); y.reverse(); }   // (upstream first)
        for (let it = 0; it < 3; it++) { for (let k = 1; k < y.length; k++) y[k] = Math.min(y[k], y[k - 1]); const o = y.slice(); for (let k = 1; k < y.length - 1; k++) y[k] = (o[k - 1] + 2 * o[k] + o[k + 1]) / 4; }
        for (let k = 1; k < y.length; k++) y[k] = Math.min(y[k], y[k - 1]);
        const C = { hw: W / 2, x: xs, z: zs, y: y.map(v => v - 0.4) }, ci = L.length; L.push(C);
        for (let k = 0; k < xs.length - 1; k++) { const m = C.hw + 7.5, x0 = Math.floor((Math.min(xs[k], xs[k + 1]) - m) / 16), x1 = Math.floor((Math.max(xs[k], xs[k + 1]) + m) / 16), z0 = Math.floor((Math.min(zs[k], zs[k + 1]) - m) / 16), z1 = Math.floor((Math.max(zs[k], zs[k + 1]) + m) / 16);
          for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) { const key = a + ',' + b; let A = cells.get(key); if (!A) cells.set(key, A = []); A.push(ci, k); } }
      }
      UNC = { L, cells };
    }
    UNF = null;
    if (def.falls) { const i = T.nearestIdx(def.falls[0], def.falls[1]), up = (sd) => vrFar(T.px[i] + T.nx[i] * sd * 40, T.pz[i] + T.nz[i] * sd * 40), sd = up(1) < up(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + 1.5;   // (out: the gorge's side)
      UNF = { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, dx: T.nx[i] * sd, dz: T.nz[i] * sd, y: T.hy[i] - 4.6, i }; }
    // the galleries ([from, to, the mountain's side, 1: a tunnel], metres after the start line) per sample
    const galAt = new Int8Array(N), GAL = (def.galleries || []).map(([a, b, sd, k]) => ({ s0: sStart + a, s1: sStart + b, sd, rock: k === 1 }));
    for (const G of GAL) for (let s = G.s0; s <= G.s1; s += T.ds / 2) galAt[T.idx(s)] = G.sd;
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const dropAt = (i, side) => !!(T.dropAt && T.dropAt[side > 0 ? 1 : 0][i]);
    // the buildings (def.bld: OpenStreetMap footprints, small timber sheds and cabins here): clear of the road
    const blds = [];
    for (const b of def.bld || []) {
      const [x, z, L, W, ang] = b; if (L < 2.5 || W < 2.5) continue;
      const c = Math.cos(ang), s = Math.sin(ang); let ok = true;
      for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const n = vrNear(x + c * u - s * v, z + s * u + c * v); if (n.i >= 0 && n.dd < 1.5) ok = false; }
      if (ok) blds.push({ x, z, L, W, ang });
    }
    // the old mines (def.mines [metres after the start line, side, metres out]): a level plot for the ore house, the headframe beside it, the tailings below
    const mines = (def.mines || []).map(([d, sd, o]) => { const [x, z, i] = onSide(sStart + d, sd, o - (sd > 0 ? T.br[T.idx(sStart + d)] : T.bl[T.idx(sStart + d)])); return { x, z, i, sd, d, rot: T.hd[i] }; });
    for (const M of mines) { M.pad = { x: M.x, z: M.z, r: 7, b: 9, h: vrFar(M.x, M.z) }; P.pads.push(M.pad); }
    // the car parks: at the finish (beside the road past the line, on the side where the ground lies nearer the road's height) and before the start
    // (the cars held at the closed road)
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * (r + 6), T.pz[i] + T.nz[i] * sd * (r + 6)) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 14, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 60, 13); P.pads.push(padF);
    const padS = padBeside(Math.max(30, sStart - 70), 10); P.pads.push(padS);
    const pulls = [];   // the turnouts where the spectators left their cars (the overlook by Bear Creek Falls, the Alpine Loop junction, two more): a level plot beside the road, never on a drop's side
    for (const d of [655, 935, 2640, 4690]) { const s0 = sStart + d, i = T.idx(s0); if (s0 > sFin - 60 || galAt[i] || galAt[T.idx(s0 - 25)] || galAt[T.idx(s0 + 25)]) continue;
      const far = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * 18, T.pz[i] + T.nz[i] * sd * 18) - T.hy[i]), sd = dropAt(i, 1) || dropAt(T.idx(s0 + 15), 1) ? -1 : dropAt(i, -1) || dropAt(T.idx(s0 + 15), -1) ? 1 : far(1) < far(-1) ? 1 : -1;
      if (dropAt(i, sd) || dropAt(T.idx(s0 - 15), sd) || dropAt(T.idx(s0 + 15), sd)) continue;
      const r = 8.5, o = (sd > 0 ? T.br[i] : T.bl[i]) + r - 1.2, pad = { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 12, h: T.hy[i] - 0.22, sd, i };
      P.pads.push(pad); pulls.push(pad); }
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees and buildings between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots, the water) for the trees and the rocks, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    stubExcl(exclPush);   // (nothing grows or stands on the side roads)
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    for (const M of mines) exclPush(M.x, M.z, 11);
    exclPush(padF.x, padF.z, padF.r + 4); exclPush(padS.x, padS.z, padS.r + 4);
    for (const p of pulls) exclPush(p.x, p.z, p.r + 3);
    out.marks = {};   // (where the landmarks stand: the tests look for them)

    /* ---- terrain tiles, the reservoir below the start ---- */
    let nFar = 0;
    const tMat = pkGroundMat();
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = unTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(unTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 50, specular: 0x24343c });
      for (const L of P.lakes) {
        const deep = [0.08, 0.24, 0.24], shal = [0.3, 0.46, 0.4], sky = [0.48, 0.62, 0.72], g = new GB(true), uv = (q) => [q[0] / 14, -q[2] / 14];
        for (let z0 = Math.floor((L.z0 - 8) / 4) * 4; z0 < L.z1 + 8; z0 += 4) for (let x0 = Math.floor((L.x0 - 8) / 4) * 4; x0 < L.x1 + 8; x0 += 4) {
          if (!(unGround(x0, z0) < L.h + 0.4 || unGround(x0 + 4, z0) < L.h + 0.4 || unGround(x0, z0 + 4) < L.h + 0.4 || unGround(x0 + 4, z0 + 4) < L.h + 0.4)) continue;
          const wc = (x, z) => { const e = vrWater(x, z).e, ks = 0.4 * sstep(0.55, 0.8, P.n2(x * 2.2, z * 2.2)); return [0, 1, 2].map(k => lerp(lerp(shal[k], deep[k], sstep(2, 14, e)), sky[k], ks)); };
          const A = [x0, L.h, z0], B = [x0 + 4, L.h, z0], C = [x0 + 4, L.h, z0 + 4], D = [x0, L.h, z0 + 4];
          g.quadUp(A, B, C, D, [wc(A[0], A[2]), wc(B[0], B[2]), wc(C[0], C[2]), wc(D[0], D[2])], [uv(A), uv(B), uv(C), uv(D)]);
        }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); out.dyn.water = tex.water; }
      }
    }

    /* ---- the road: asphalt with white edge lines and a double yellow centre line, a gravel shoulder, then the verge out past the edge: up to the foot
       of the cut on the mountain's side, on a drop a rough lip of rock and the cliff straight down; on the bridge the deck out to its parapets, in the
       tunnel and the shed a concrete floor out to the walls (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const onBr = new Uint8Array(N), sw = 0.5;
    for (const [a, b] of def.bridges || []) for (let s = sStart + a - 3; s <= sStart + b + 3; s += T.ds / 2) onBr[T.idx(s)] = 1;
    const SB = stubGeo({ gCol: unGCol, paveC: [0.8, 0.8, 0.81], gravC: [0.66, 0.6, 0.54], shC: [0.62, 0.58, 0.52], line: 'solid' });   // the side roads (their mouths; their surfaces in the road's chunks below)
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      if (onBr[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];
      const ms = stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;   // (a side road's mouth: no ditch, the verge at its surface)
      if (galAt[i]) return [[e + sw, -0.02], [bar - 0.3, -0.02], [bar + 0.2, 0.18], [bar + 0.5, 0.2], [bar + 0.9, 0.2]];   // (a gallery: a concrete kerb along its walls)
      const y = T.hy[i], gAt = (o) => { const q = side * o; return unGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (UNW && UNW[side > 0 ? 1 : 0][i] > 0.5) return [[e + sw, -0.02], [bar - 0.15, -0.05], [bar + 0.25, gAt(bar + 0.25) * 0.5 - 0.1], [bar + 0.9, gAt(bar + 0.9) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (the edge of a drop: a rough lip, then the cliff)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.4, bar - 0.6), -0.1), [bar + 0.4, Math.min(-0.35, gAt(bar + 0.4) - 0.2)], lift(bar + 1.1, -0.25), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.86 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; if (galAt[i]) k *= 0.9; return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], ylw = [0.95, 0.74, 0.14], gc = [0.7, 0.65, 0.58], deck = [0.62, 0.61, 0.58], conc = [0.6, 0.59, 0.56], rockL = [0.5, 0.46, 0.42];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return k < 3 ? deck : [0.5, 0.49, 0.47];
          if (galAt[i]) return k < 2 ? [0.55, 0.54, 0.51] : conc;
          const lip = UNW && UNW[si][i] > 0.5; if (lip && (k === 1 || k === 2)) { const q = 0.9 + 0.16 * rpHash(i >> 1, 51 + si); return k === 1 ? [rockL[0] * q * 1.1, rockL[1] * q * 1.08, rockL[2] * q * 1.05] : [rockL[0] * q, rockL[1] * q * 0.94, rockL[2] * q * 0.9]; }   // (the rock lip of a drop)
          if (k === 4) return unGCol(x, z);
          const sl = k === 2 ? unSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return unCol(x, z, T.hy[i] + y, 1 / l, 0, Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const [o0, o1] of SB.edges(i, j, [[-(w - 0.25), -(w - 0.4)], [w - 0.4, w - 0.25]])) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          for (const [o0, o1] of [[-0.21, -0.09], [0.09, 0.21]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [ylw, ylw, ylw, ylw]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], sc = onBr[i] ? deck : galAt[i] ? [0.55, 0.54, 0.51] : gc;
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [sc, sc, sc, sc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k >= 1 && UNW && (UNW[si][i] > 0.5 || UNW[si][j] > 0.5)) gv.quadO(a, b, c, d, null, Pt(i, -side * 2, -6), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the lip and the cliff's top: facing up and out over the drop)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        SB.emit(c0, c0 + 60, gr, gs, gl);   // (the side roads whose junctions are in this chunk)
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
    const scen = new Chunks(110), det = scen, ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (det: the flat details on the ground, in the scenery's chunks: no draws of their own; ban: the race's boards, ban2: the signs)
    const fans = [[0.7, 0.13, 0.17], [0.95, 0.95, 0.95], [0.16, 0.2, 0.42], [0.36, 0.5, 0.3], [0.95, 0.95, 0.95], [0.9, 0.62, 0.16], [0.24, 0.26, 0.3], [0.5, 0.3, 0.2], [0.2, 0.42, 0.62], [0.95, 0.5, 0.12]];
    const CR = crowdCtx({ gH: unGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => vrWater(x, z).e > -4, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a place board of the second atlas: [v0, v1, u0, u1]
    const sign = (s, side, k, tx, tz, W, H, hgt) => {   // a board of the second atlas on one post beside the road, facing (tx, tz)
      const [px, pz, ii] = onSide(s, side, side > 0 && dropAt(T.idx(s), 1) ? -0.5 : 0.9); if (excluded(px, pz)) return;
      const py = unGround(px, pz), [v0, v1, u0, u1] = board(k); box(scen.get(px, pz), px, py - 0.2, pz, 0.1, hgt + 0.2, 0.1, T.hd[ii], [0.6, 0.61, 0.63]);
      bannerQ(px, py + hgt - H * 0.5, pz, tx == null ? -T.tx[ii] : tx, tz == null ? -T.tz[ii] : tz, W, H, v0, v1, u0, u1, ban2); exclPush(px, pz, 1.6); CR.avoid(px, pz, 0.8); };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the edges, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = Math.min(T.bl[i] - 0.3, w + 1.4) + 0.3, L2 = Math.min(T.br[i] - 0.3, w + 1.4) + 0.3, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 11.6, 1.45, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, unGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const flagUS = (g, x, y, z, rot, h) => {   // a pole with the US flag: red and white stripes, the blue canton (both faces)
      cyl(g, x, y - 0.2, z, 0.06, h + 0.2, 5, [0.94, 0.94, 0.92], [0.9, 0.78, 0.2]);
      const c = Math.cos(rot), s = Math.sin(rot), fw = 1.9, fh = 1.0, y0 = y + h - fh - 0.15;
      for (let k = 0; k < 5; k++) { const fx = x + c * (fw / 2 + 0.06), fz = z + s * (fw / 2 + 0.06); box(g, fx, y0 + k * fh / 5, fz, fw, fh / 5, 0.04, rot, k % 2 ? [0.95, 0.95, 0.94] : [0.7, 0.13, 0.17]); }
      box(g, x + c * (fw * 0.21 + 0.06), y0 + fh * 0.45, z + s * (fw * 0.21 + 0.06), fw * 0.42, fh * 0.55, 0.06, rot, [0.2, 0.2, 0.42]);
    };
    const carCols = [[0.85, 0.85, 0.83], [0.62, 0.12, 0.1], [0.14, 0.26, 0.5], [0.2, 0.2, 0.22], [0.5, 0.52, 0.54], [0.24, 0.38, 0.26], [0.95, 0.95, 0.94]];
    const camper = (g, x, y, z, rot, col) => {   // a camper van: a tall box on a van chassis, the cab at +x
      const c = Math.cos(rot), s = Math.sin(rot);
      box(g, x - c * 0.6, y + 0.5, z - s * 0.6, 5.4, 2.6, 2.3, rot, [0.94, 0.93, 0.9], null, true); box(g, x + c * 2.6, y + 0.45, z + s * 2.6, 1.6, 1.6, 2.2, rot, col, null, true);
      box(g, x + c * 3.35, y + 1.25, z + s * 3.35, 0.08, 0.7, 2.0, rot, [0.14, 0.18, 0.22], null, true); box(g, x - c * 0.6, y + 1.9, z - s * 0.6, 5.0, 0.3, 2.32, rot, col, null, true);
      for (const [a, b] of [[2.4, 1.0], [2.4, -1.0], [-2.2, 1.0], [-2.2, -1.0]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.72, 0.72, 0.26, rot, [0.08, 0.08, 0.09], null, true); };

    /* ---- the buildings: the two OpenStreetMap sheds as weathered timber cabins; the old mines (generic): an ore house on its plot, the headframe over
       the shaft, the tailings pouring down the slope below in orange, ochre and grey, a few rotten timbers ---- */
    let nBld = 0, nMine = 0;
    {
      const RB = rng(5521);
      const lowHigh = (x, z, L, W, ang) => { const c = Math.cos(ang), s = Math.sin(ang); let lo = 1e9, hi = -1e9; for (const [u, v] of [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2], [0, 0]]) { const y = unGround(x + c * u - s * v, z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
      for (const b of blds) { const [lo, hi] = lowHigh(b.x, b.z, b.L, b.W, b.ang); unMineHouse(scen.get(b.x, b.z), b.x, lo, hi, b.z, b.ang, b.L, b.W, 1, RB); CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++; }
      const tail = [[0.72, 0.5, 0.28], [0.66, 0.42, 0.24], [0.74, 0.6, 0.36], [0.56, 0.5, 0.44], [0.62, 0.36, 0.22]];
      for (const M of mines) {
        const L = 9 + RB() * 4, D = 6 + RB() * 2, rot = M.rot, [lo, hi] = lowHigh(M.x, M.z, L, D, rot), g = scen.get(M.x, M.z);
        unMineHouse(g, M.x, lo, hi, M.z, rot, L, D, RB() < 0.5 ? 2 : 1, RB); CR.block(M.x, M.z, L + 1, D + 1, rot);
        const ox = -T.nx[M.i] * M.sd, oz = -T.nz[M.i] * M.sd;   // (towards the road: the headframe on the plot's road side, the tailings tip downhill of it)
        const hx = M.x + T.tx[M.i] * (L / 2 + 4), hz = M.z + T.tz[M.i] * (L / 2 + 4); unHeadframe(scen.get(hx, hz), hx, unGround(hx, hz), hz, rot, RB);
        let dx = 0, dz = 0; { const a = vrFar(M.x - 16, M.z), b = vrFar(M.x + 16, M.z), c = vrFar(M.x, M.z - 16), d = vrFar(M.x, M.z + 16); dx = a - b; dz = c - d; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; }   // (downhill, on the real slope round the plot)
        if (Math.abs(dx * ox + dz * oz) > 0.85) { dx = T.tx[M.i]; dz = T.tz[M.i]; }   // (not onto the road)
        { const Rl = 15 + RB() * 6, Rw = 8 + RB() * 3, Hh = 2.6 + RB() * 1.2, cx = M.x + dx * (Rl * 0.55 + 9), cz = M.z + dz * (Rl * 0.55 + 9), tg = scen.get(cx, cz), ph = RB() * 10;   // the tailings: a fan of spoil poured down the slope
          const V = (r, th) => { const u = Math.cos(th) * r * Rl, v = Math.sin(th) * r * Rw, x = cx + dx * u - dz * v, z = cz + dz * u + dx * v, n = vrNear(x, z), cut = n.i >= 0 ? sstep(1.5, 5, n.dd) : 1;
            return [x, unGround(x, z) + Hh * (1 - r * r) * (0.8 + 0.2 * Math.sin(th * 3 + ph)) * cut + 0.05, z]; };
          const C = (r, th) => vary(tail[Math.floor((Math.sin(th * 5 + r * 7 + ph) * 0.5 + 0.5) * 4.99)], () => 0.5 + 0.5 * Math.sin(th * 11 + r * 13), 0.14);
          for (let a = 0; a < 4; a++) for (let b = 0; b < 14; b++) { const r0 = a / 4, r1 = (a + 1) / 4, t0 = b / 14 * TAU, t1 = (b + 1) / 14 * TAU, inn = [cx, unGround(cx, cz) - 30, cz];
            tg.quadO(V(r0, t0), V(r1, t0), V(r1, t1), V(r0, t1), null, inn, null, [C(r0, t0), C(r1, t0), C(r1, t1), C(r0, t1)]); }
          for (let k = 0; k < 7; k++) { const th = RB() * TAU, rr = 0.2 + RB() * 0.7, p = V(rr, th), sz = 0.4 + RB() * 0.7; rock(tg, p[0], p[1] + sz * 0.2, p[2], sz, sz * 0.7, sz, RB() * TAU, vary(tail[Math.floor(RB() * tail.length)], RB, 0.1), RB, 0.3); }
          { const rl = [], rail = [0.24, 0.16, 0.12];   // the track along the dump's crest from the ore house to its end, a rusty ore car at the end of it
            for (let k = 0; k <= 8; k++) { const f = k / 8, p = f < 0.5 ? V(1 - f * 2, PI) : V((f - 0.5) * 2 * 0.86, 0); rl.push([p[0], p[1] + 0.12, p[2]]); }
            for (const o of [-0.45, 0.45]) for (let k = 0; k < 8; k++) { const a = rl[k], b = rl[k + 1]; ouRod(tg, [a[0] - dz * o, a[1], a[2] + dx * o], [b[0] - dz * o, b[1], b[2] + dx * o], 0.05, rail, 3); }
            for (let k = 0; k < 16; k++) { const f = k / 16, a = rl[Math.floor(f * 8)], b = rl[Math.floor(f * 8) + 1], t2 = f * 8 - Math.floor(f * 8), px = a[0] + (b[0] - a[0]) * t2, pz = a[2] + (b[2] - a[2]) * t2, py = a[1] + (b[1] - a[1]) * t2; box(tg, px, py - 0.08, pz, 0.25, 0.08, 1.4, Math.atan2(dz, dx), [0.3, 0.25, 0.2]); }   // (the sleepers)
            const e = rl[7]; box(tg, e[0], e[1] + 0.25, e[2], 1.3, 0.75, 0.95, Math.atan2(dz, dx), [0.46, 0.27, 0.16], [0.2, 0.14, 0.1], true); }
          { const ax = M.x - dx * (L / 2 + 3.5), az = M.z - dz * (L / 2 + 3.5), ay = unGround(ax, az), rot = Math.atan2(dz, dx), wood = [0.36, 0.3, 0.25];   // the adit: a timbered portal in the slope behind the house, black inside
            for (const v of [-1, 1]) box(tg, ax - dz * v * 1.1, ay - 0.2, az + dx * v * 1.1, 0.3, 2.6, 0.3, rot, wood); box(tg, ax, ay + 2.3, az, 0.35, 0.35, 2.6, rot, wood);
            box(tg, ax - dx * 0.25, ay, az - dz * 0.25, 0.1, 2.3, 1.9, rot, [0.03, 0.03, 0.03]); }
          if (nMine % 2 === 1) {   // an old aerial tramway up the mountainside from the mine: timber towers, the cables sagging between them
            let prev = null; for (let k = 0; k <= 4; k++) { const tx2 = M.x - dx * (12 + k * 38), tz2 = M.z - dz * (12 + k * 38), n2 = vrNear(tx2, tz2); if (n2.i >= 0 && n2.dd < 6) { prev = null; continue; }
              const ty = unGround(tx2, tz2), H2 = 7 + RB() * 2, gw = scen.get(tx2, tz2), wood = vary([0.38, 0.32, 0.26], RB, 0.1), top = [];
              for (const v of [-1, 1]) { ouRod(gw, [tx2 - dz * v * 1.6, ty - 0.3, tz2 + dx * v * 1.6], [tx2 - dz * v * 0.7, ty + H2, tz2 + dx * v * 0.7], 0.14, wood, 4); top.push([tx2 - dz * v * 1.1, ty + H2 + 0.2, tz2 + dx * v * 1.1]); }
              box(gw, tx2, ty + H2, tz2, 0.3, 0.3, 2.8, Math.atan2(dz, dx), wood); exclPush(tx2, tz2, 2.5);
              if (prev) for (const v of [0, 1]) { const a = prev[v], b = top[v], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 1.4, (a[2] + b[2]) / 2]; ouRod(gw, a, m, 0.03, [0.1, 0.1, 0.1], 3); ouRod(gw, m, b, 0.03, [0.1, 0.1, 0.1], 3); }
              prev = top; } }
          exclPush(cx, cz, Rw + 2); exclPush(cx + dx * Rl * 0.5, cz + dz * Rl * 0.5, Rw); }
        for (let k = 0; k < 3; k++) { const px = M.x + (RB() - 0.5) * 14, pz = M.z + (RB() - 0.5) * 14, n = vrNear(px, pz); if (n.i >= 0 && n.dd < 2.5) continue; const a = RB() * TAU, l = 3 + RB() * 3, y = unGround(px, pz) + 0.15;
          ouRod(scen.get(px, pz), [px, y, pz], [px + Math.cos(a) * l, y + 0.1, pz + Math.sin(a) * l], 0.13, [0.34, 0.29, 0.24], 4); }   // (rotten timbers)
        nMine++; out.marks['mine' + nMine] = [M.x, M.z];
      }
    }
    /* ---- the avalanche and rockfall works: a rockfall net (steel posts, the grey mesh between them) at the foot of the highest cuts above the road;
       rows of timber snow fences high in the big slide paths; at each mine a log cabin fallen in and a timber ore bin ---- */
    let nNet = 0, nFence = 0;
    {
      const RF = rng(6113), steel = [0.3, 0.31, 0.33], mesh = [0.5, 0.51, 0.5], wood = [0.26, 0.2, 0.15], step = 5;
      const busy = (d) => d < 70 || d > 4830 || Math.abs(d - 541) < 40 || Math.abs(d - 985.6) < 45 || Math.abs(d - 2642.7) < 40 || mines.some(M => Math.abs(M.d - d) < 40);
      const net = (pts) => {   // pts: [x, y(ground), z] along the foot of the cut, a post at each, the mesh 3 m high between them, the cables top and bottom
        const H = 3.1; for (let k = 0; k < pts.length; k++) { const [x, y, z] = pts[k], g = scen.get(x, z); ouRod(g, [x, y - 0.3, z], [x, y + H + 0.2, z], 0.07, steel, 4); exclPush(x, z, 2.5);
          if (k) { const [a, ay, az] = pts[k - 1], mx = (a + x) / 2, mz = (az + z) / 2, nx = -(z - az), nz = x - a, l = Math.hypot(nx, nz) || 1, ux = nx / l * 0.6, uz = nz / l * 0.6;
            const A = [a, ay + 0.15, az], B = [x, y + 0.15, z], C = [x, y + H, z], D = [a, ay + H, az];
            g.quadO(A, B, C, D, mesh, [mx + ux, (ay + y) / 2 + H / 2, mz + uz]); g.quadO(A, B, C, D, mesh, [mx - ux, (ay + y) / 2 + H / 2, mz - uz]);
            ouRod(g, [a, ay + H + 0.1, az], [x, y + H + 0.1, z], 0.03, [0.15, 0.15, 0.16], 3); ouRod(g, [a, ay + 0.2, az], [x, y + 0.2, z], 0.03, [0.15, 0.15, 0.16], 3); } }
        nNet++; if (nNet === 1) out.marks.rockNet = [pts[0][0], pts[0][2]]; };
      let run = [], total = 0;
      const flush = () => { if (run.length >= 5 && total < 520) { net(run); total += (run.length - 1) * step; } run = []; };
      for (let d = 60; d < 4900; d += step) {
        if (busy(d)) { flush(); continue; }
        const i = T.idx(sStart + d); let best = null;
        for (const sd of [-1, 1]) { const e = sd > 0 ? T.br[i] : T.bl[i], at = (o) => vrFar(T.px[i] + T.nx[i] * sd * (e + o), T.pz[i] + T.nz[i] * sd * (e + o)) - T.hy[i];
          const r16 = at(16); if (at(6) > 2 && r16 > 10 && (!best || r16 > best.r)) best = { sd, e, r: r16 }; }
        if (!best || (run.length && run.sd !== best.sd)) { flush(); if (!best) continue; }
        const o = best.sd * (best.e + 3.4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, n = vrNear(x, z);
        if (n.i >= 0 && n.dd < 2.2) { flush(); continue; }
        run.sd = best.sd; run.push([x, unGround(x, z), z]);
      }
      flush();
      // snow fences: staggered rows across the slide path, 24 to 57 m up the slope from the road
      for (const dc of [3382.9, 4800]) {
        const i0 = T.idx(sStart + dc), up = (sd) => vrFar(T.px[i0] + T.nx[i0] * sd * 50, T.pz[i0] + T.nz[i0] * sd * 50), sd = up(1) > up(-1) ? 1 : -1;
        for (let row = 0; row < 4; row++) { const off = 24 + row * 11, d0 = dc - 52 + (row % 2) * 9;
          for (let seg = 0; seg < 4; seg++) { const pts = [];
            for (let k = 0; k <= 4; k++) { const i = T.idx(sStart + d0 + seg * 26 + k * 3.5), o = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + off + (RF() - 0.5) * 1.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; pts.push([x, unGround(x, z), z]); }
            const g = scen.get(pts[2][0], pts[2][2]);
            for (const [x, y, z] of pts) { ouRod(g, [x, y - 0.3, z], [x, y + 2.6, z], 0.09, wood, 4); exclPush(x, z, 2.5); }
            for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], b = pts[k]; for (let h = 0.7; h < 2.7; h += 0.5) ouRod(g, [a[0], a[1] + h, a[2]], [b[0], b[1] + h, b[2]], 0.06, vary(wood, RF, 0.12), 3); }
            nFence++; if (nFence === 1) out.marks.snowFence = [pts[0][0], pts[0][2]]; } } }
      // at each mine: a log cabin fallen in (low log walls, no roof, the roof timbers on the ground), a timber ore bin on legs with its chute
      for (const M of mines) {
        const c = Math.cos(M.rot), s = Math.sin(M.rot), logc = [0.31, 0.25, 0.19], bw = [0.37, 0.3, 0.23];
        const cx = M.x - T.tx[M.i] * 10 + T.nx[M.i] * M.sd * 6, cz = M.z - T.tz[M.i] * 10 + T.nz[M.i] * M.sd * 6, n = vrNear(cx, cz);
        if (!(n.i >= 0 && n.dd < 4)) { const g = scen.get(cx, cz), y = unGround(cx, cz), W = 4.4, Dp = 3.6;
          const P = (u, v) => [cx + c * u - s * v, cz + s * u + c * v];
          for (const [u0, v0, u1, v1] of [[-W / 2, -Dp / 2, W / 2, -Dp / 2], [W / 2, -Dp / 2, W / 2, Dp / 2], [W / 2, Dp / 2, -W / 2, Dp / 2], [-W / 2, Dp / 2, -W / 2, -Dp / 2]]) {
            const lv = 2 + Math.floor(RF() * 3), [ax, az] = P(u0, v0), [bx2, bz2] = P(u1, v1);
            for (let k = 0; k < lv; k++) { const yy = y + 0.15 + k * 0.32, f = k === lv - 1 ? 0.45 + RF() * 0.55 : 1; ouRod(g, [ax, yy, az], [ax + (bx2 - ax) * f, yy, az + (bz2 - az) * f], 0.16, vary(logc, RF, 0.1), 4); } }
          for (let k = 0; k < 3; k++) { const a = RF() * TAU, l = 2 + RF() * 2.5, px = cx + (RF() - 0.5) * 2, pz = cz + (RF() - 0.5) * 2; ouRod(g, [px, y + 0.2, pz], [px + Math.cos(a) * l, y + 0.5 + RF() * 0.6, pz + Math.sin(a) * l], 0.15, logc, 4); }
          exclPush(cx, cz, 4.5); }
        const bx = M.x + T.tx[M.i] * 11 - T.nx[M.i] * M.sd * 2, bz = M.z + T.tz[M.i] * 11 - T.nz[M.i] * M.sd * 2, nb = vrNear(bx, bz);
        if (!(nb.i >= 0 && nb.dd < 3)) { const g = scen.get(bx, bz), y = unGround(bx, bz);
          for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const px = bx + c * u * 1.4 - s * v * 1.1, pz = bz + s * u * 1.4 + c * v * 1.1; ouRod(g, [px, y - 0.2, pz], [px, y + 2.4, pz], 0.12, bw, 4); }
          box(g, bx, y + 2.3, bz, 3.2, 2.2, 2.6, M.rot, bw, [0.24, 0.2, 0.16]); box(g, bx + c * 1.9, y + 1.6, bz + s * 1.9, 1.2, 0.25, 1.0, M.rot, [0.29, 0.23, 0.18]);
          exclPush(bx, bz, 3.5); }
      }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- START: gantry with the start lights, the timing hut, US flags along the grid, the road closed behind it; the cars and campers held back in the
       lay-by; the checkpoints (brown gantries "CPn altitude"); FINISH: the chequered gantry and flags, the board, the car park, the road closed on ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const hs = dropAt(T.idx(sStart - 5), -1) ? 1 : -1, [hx, hz] = onSide(sStart - 5, hs, 3.0), hy = unGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut (on the side away from a drop)
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.84, 0.8, 0.72], [0.4, 0.3, 0.22], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.1, T.hd[i], [0.46, 0.28, 0.2], [0.84, 0.8, 0.72]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      for (let s = 8; s < sStart + 50; s += 12) for (const side of [-1, 1]) { const ii = T.idx(s); if (dropAt(ii, side)) continue; const [px, pz] = onSide(s, side, 1.0); if (excluded(px, pz) && s > sStart - 8) continue; flagUS(scen.get(px, pz), px, unGround(px, pz), pz, T.hd[ii], 6); }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const bs = dropAt(T.idx(sStart + 16), 1) ? -1 : 1, [bx, bz, bi] = onSide(sStart + 16, bs, 1.4), by = unGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi] * bs, -T.nz[bi] * bs, 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
      const hh = T.hd[padS.i], c = Math.cos(hh), sn = Math.sin(hh), RT = rng(5531);   // the queue in the lay-by
      for (let k = 0; k < 4; k++) { const a = (k - 1.5) * 5.6, px = padS.x + c * a, pz = padS.z + sn * a; if (vrNear(px, pz).dd < 1.5) continue;
        if (k === 1) camper(scen.get(px, pz), px, unGround(px, pz), pz, hh, carCols[Math.floor(RT() * carCols.length)]); else caCar(scen.get(px, pz), px, unGround(px, pz), pz, hh, carCols[Math.floor(RT() * carCols.length)]); }
      for (let k = 0; k < 6; k++) { const px = padS.x + (R() - 0.5) * 14, pz = padS.z + (R() - 0.5) * 14; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
    }
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.42, 0.2, 0.12]));
    { const RP = rng(5631);   // the turnouts: the spectators' cars and campers nosed in along the plot, people at its edge looking at the gorge and the race
      for (const p of pulls) { const hh = T.hd[p.i], c = Math.cos(hh), sn = Math.sin(hh), n = 3 + Math.floor(RP() * 3);
        for (let k = 0; k < n; k++) { const a = (k - (n - 1) / 2) * 3.1 + (RP() - 0.5) * 0.6, b = p.sd * (1.5 + RP() * 1.2), px = p.x + c * a - sn * b, pz = p.z + sn * a + c * b; if (vrNear(px, pz).dd < 1.2) continue;
          const g = scen.get(px, pz), col = vary(carCols[Math.floor(RP() * carCols.length)], RP, 0.15), rot = hh + PI / 2 * p.sd + (RP() - 0.5) * 0.2;
          if (RP() < 0.25) camper(g, px, unGround(px, pz), pz, rot, col); else caCar(g, px, unGround(px, pz), pz, rot, col); }
        for (let k = 0; k < 5; k++) { const a = (RP() - 0.5) * 14, b = -p.sd * (p.r - 2.5), px = p.x + c * a - sn * b, pz = p.z + sn * a + c * b; if (vrNear(px, pz).dd < 0.8) continue; person(px, pz, hh - PI / 2 * p.sd + (RP() - 0.5)); }
        out.marks['turnout' + Math.round(p.i * T.ds - sStart)] = [p.x, p.z]; } }
    { const RP = rng(5641), tc = [[0.92, 0.92, 0.9], [0.72, 0.16, 0.14], [0.16, 0.3, 0.56], [0.24, 0.42, 0.26], [0.94, 0.72, 0.18]];   // the teams' canopies by the start's lay-by and the finish's car park: plain colours, no names
      const tent = (x, z, rot, col) => { const g = scen.get(x, z), y = unGround(x, z), c = Math.cos(rot), sn = Math.sin(rot), W = 3, H = 2.4;
        for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const px = x + (c * u - sn * v) * W / 2, pz = z + (sn * u + c * v) * W / 2; ouRod(g, [px, unGround(px, pz) - 0.1, pz], [px, y + H, pz], 0.035, [0.75, 0.76, 0.78], 4); }
        box(g, x, y + H, z, W + 0.1, 0.12, W + 0.1, rot, col, col, true); box(g, x, y + H + 0.12, z, W * 0.7, 0.32, W * 0.7, rot, col, [col[0] * 1.08, col[1] * 1.08, col[2] * 1.08], true);   // (the roof and its peak)
        for (const v of [-1, 1]) { const px = x - sn * v * W / 2, pz = z + c * v * W / 2; box(g, px, y + H - 0.32, pz, W + 0.1, 0.32, 0.03, rot, [col[0] * 0.85, col[1] * 0.85, col[2] * 0.85]); }   // (the valances)
        box(g, x, y + 0.7, z, 1.8, 0.05, 0.7, rot, [0.86, 0.86, 0.84]); CR.block(x, z, W + 0.6, W + 0.6, rot); };
      for (const [pd, n] of [[padS, 2], [padF, 3]]) { const hh = T.hd[pd.i], c = Math.cos(hh), sn = Math.sin(hh);
        for (let k = 0; k < n; k++) { const a = (k - (n - 1) / 2) * 4.4, b = -(pd.sd || 1) * (pd.r - 2.6), px = pd.x + c * a - sn * b, pz = pd.z + sn * a + c * b; if (vrNear(px, pz).dd < 2) continue; tent(px, pz, hh, tc[Math.floor(RP() * tc.length)]); } } }
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const ii0 = T.idx(s); if (dropAt(ii0, side)) continue; const [px, pz, ii] = onSide(s, side, 1.2), py = unGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 18, sdP, 3.0), sy = unGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the board: on posts leaning back, facing the arriving cars
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.36, 0.24, 0.14]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.56, 0.5, 0.46], [0.62, 0.56, 0.5]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 5);
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh), RT = rng(5541);
      for (let k = 0; k < 10; k++) { const a = -14 + (k % 5) * 7, b = (k < 5 ? -4.5 : 4.5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5) continue;
        if (k === 2 || k === 7) camper(scen.get(px, pz), px, unGround(px, pz), pz, hh + PI / 2, carCols[Math.floor(RT() * carCols.length)]);
        else if (k !== 4) caCar(scen.get(px, pz), px, unGround(px, pz), pz, hh + PI / 2, vary(carCols[(k * 3) % carCols.length], R, 0.2)); }
      for (let k = 0; k < 18; k++) { const px = padF.x + (R() - 0.5) * 24, pz = padF.z + (R() - 0.5) * 24; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
    }

    /* ---- the little rock tunnel (raw rock walls, an arched roof, the rock mass over it and the portals in the cliff face) and the Riverside snow shed
       (a concrete wall against the mountain, the roof on pillars on the valley side, portal frames). The roofs and what lies on them fade while
       the followed car is inside (dyn.tunnel: their ranges) ---- */
    const galG = new GB(), galRanges = [];
    {
      const conc = [0.64, 0.63, 0.59], concD = [0.48, 0.47, 0.45], top = [0.5, 0.46, 0.4], rk = [0.42, 0.39, 0.36], rkD = [0.3, 0.28, 0.26], H = 6.2, th = 0.9, RK = rng(5551);
      for (const G of GAL) {
        galRanges.push([G.s0, G.s1]);
        const i0 = T.idx(G.s0), i1 = T.idx(G.s1), msd = G.sd, Q = (i, side, o, y) => { const bar = side > 0 ? T.br[i] : T.bl[i], d = side * (bar + o); return [T.px[i] + T.nx[i] * d, T.hy[i] + y, T.pz[i] + T.nz[i] * d]; };
        if (G.rock) {   // the tunnel: both walls rock, an arch of four facets up to the crown, the mass on top
          for (let i = i0; i < i1; i++) {
            const j = i + 1, g = scen.get(T.px[i], T.pz[i]), inn = [T.px[i], T.hy[i] + 2.5, T.pz[i]], q = 0.9 + 0.2 * rpHash(i, 61);
            for (const sd of [-1, 1]) g.quadO(Q(i, sd, 0.1, -0.3), Q(j, sd, 0.1, -0.3), Q(j, sd, 0.1, 4.0), Q(i, sd, 0.1, 4.0), [rk[0] * q, rk[1] * q, rk[2] * q], inn);
            const arc = (ii, k) => { const a = k / 4 * PI, bl = T.bl[ii] + 0.1, br = T.br[ii] + 0.1, hw = (bl + br) / 2, cx = (br - bl) / 2, o = cx - Math.cos(a) * hw; return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + 4.0 + Math.sin(a) * 2.4, T.pz[ii] + T.nz[ii] * o]; };
            for (let k = 0; k < 4; k++) galG.quadO(arc(i, k), arc(j, k), arc(j, k + 1), arc(i, k + 1), [rkD[0] * q, rkD[1] * q, rkD[2] * q], inn);
          }
          for (let s = G.s0 - 6; s <= G.s1 + 6; s += 5) { const i = T.idx(s);   // its flanks: tall rock from the ground up to the top, on both sides
            for (const o of [-1.75, 1.75]) { const d = o * (w + 2) * msd, px = T.px[i] + T.nx[i] * d, pz = T.pz[i] + T.nz[i] * d, gy = Math.min(unGround(px, pz), T.hy[i]), top = T.hy[i] + 10, r0 = 5 + RK() * 2.5;
              rock(galG, px, (gy + top) / 2, pz, r0, (top - gy) / 2 + 1, r0, RK() * TAU, vary(rk, RK, 0.15), RK, 0.3); } }
          for (let s = G.s0 - 4; s <= G.s1 + 4; s += 5) { const i = T.idx(s), x = T.px[i], z = T.pz[i];   // the rock over it: boulders sunk into one another
            for (const o of [-1.1, 0.1, 1.2]) { const p = [x + T.nx[i] * o * (w + 2) * msd, z + T.nz[i] * o * (w + 2) * msd], r0 = 5 + RK() * 2.5, mid = Math.abs(o) < 0.5; rock(galG, p[0], T.hy[i] + (mid ? 10.6 : 8 + (o > 0 ? 2.5 : 0)), p[1], r0, r0 * (mid ? 0.5 : 0.75), r0, RK() * TAU, vary(rk, RK, 0.15), RK, 0.35); } }   // (over the middle high enough to stay above the crown)
          for (const ie of [i0, i1]) {   // the portals: the cliff face round the opening
            const n = [T.tx[ie] * (ie === i0 ? -1 : 1), T.tz[ie] * (ie === i0 ? -1 : 1)], c0 = [T.px[ie] + n[0] * 0.3, T.pz[ie] + n[1] * 0.3], y0 = T.hy[ie], inn = [T.px[ie] - n[0] * 3, y0 + 3, T.pz[ie] - n[1] * 3];
            for (let k = 0; k < 8; k++) { const a0 = k / 8 * PI, a1 = (k + 1) / 8 * PI, hw = w + 1.9, r0 = 6.4 + 1.5 * rpHash(ie + k, 63), r1 = 6.4 + 1.5 * rpHash(ie + k + 1, 63);
              const P0 = (a, rr, hh) => [c0[0] - T.nx[ie] * Math.cos(a) * rr, y0 + 4 + Math.sin(a) * hh, c0[1] - T.nz[ie] * Math.cos(a) * rr];
              galG.quadO(P0(a0, hw, 2.4), P0(a1, hw, 2.4), P0(a1, hw + r1, 2.4 + r1), P0(a0, hw + r0, 2.4 + r0), rk, inn); }
            for (const cs of [1, -1]) { const hw = w + 1.9, r0 = 6.4, P1 = (rr, yy) => [c0[0] - T.nx[ie] * cs * rr, y0 + yy, c0[1] - T.nz[ie] * cs * rr];   // (and beside the opening, down to the road)
              galG.quadO(P1(hw, -0.6), P1(hw, 4), P1(hw + r0, 4), P1(hw + r0, -0.6), rk, inn); }
          }
          for (let i = i0; i <= i1; i += 3) { exclPush(T.px[i], T.pz[i], w + 4); }
          out.marks.Predor = [T.px[(i0 + i1) >> 1], T.pz[(i0 + i1) >> 1]];
          continue;
        }
        for (let i = i0; i < i1; i++) {   // the snow shed (as Los Caracoles' galleries)
          const j = i + 1, g = scen.get(T.px[i], T.pz[i]), inn = [T.px[i], T.hy[i] + H / 2, T.pz[i]];
          g.quadO(Q(i, msd, 0.1, -0.3), Q(j, msd, 0.1, -0.3), Q(j, msd, 0.1, H), Q(i, msd, 0.1, H), conc, Q(i, msd, 3, H / 2));
          const ia = Q(i, -msd, 0.7, H), ja = Q(j, -msd, 0.7, H), ib = Q(i, msd, 0.1, H), jb = Q(j, msd, 0.1, H);
          galG.quadO(ia, ja, jb, ib, concD, [inn[0], T.hy[i] + H + 5, inn[2]]);
          const ta = Q(i, -msd, 0.7, H + th), tja = Q(j, -msd, 0.7, H + th), tb = Q(i, msd, 2.5, H + th + 1.4), tjb = Q(j, msd, 2.5, H + th + 1.4);
          galG.quadO(ta, tja, tjb, tb, top, [inn[0], inn[1], inn[2]]);
          galG.quadO(ia, ja, tja, ta, conc, inn);
          if (i % 3 === 0) { const p = Q(i, -msd, 0.35, -0.3); box(galG, p[0], p[1], p[2], 0.7, H + 0.3, 0.9, T.hd[i], conc, null, true); }   // a pillar every 6 m
          { const a = Q(i, -msd, 0.1, -0.2), b = Q(j, -msd, 0.1, -0.2), c2 = Q(j, -msd, 0.1, 1.0), d = Q(i, -msd, 0.1, 1.0), a2 = Q(i, -msd, 0.6, -0.2), b2 = Q(j, -msd, 0.6, -0.2), c3 = Q(j, -msd, 0.6, 1.0), d2 = Q(i, -msd, 0.6, 1.0);
            galG.quadO(a, b, c2, d, conc, Q(i, -msd, 3, 0.4)); galG.quadO(a2, b2, c3, d2, concD, inn); galG.quadO(d, c2, c3, d2, conc, Q(i, -msd, 0.35, -1)); }   // the parapet between the pillars
        }
        for (const ie of [i0, i1]) {   // the portals: a frame round the opening, a band of yellow and black on the lintel
          const n = [T.tx[ie] * (ie === i0 ? -1 : 1), T.tz[ie] * (ie === i0 ? -1 : 1)], a = Q(ie, -msd, 0.9, -0.3), b = Q(ie, msd, 0.6, -0.3), cx = (a[0] + b[0]) / 2, cz = (a[2] + b[2]) / 2, W = Math.hypot(b[0] - a[0], b[2] - a[2]);
          box(galG, cx + n[0] * 0.4, T.hy[ie] + H, cz + n[1] * 0.4, 0.9, th + 0.4, W + 0.4, T.hd[ie], conc, top, true);
          for (let k = 0; k < 8; k++) { const u = (k + 0.5) / 8 - 0.5, px = cx + n[0] * 0.87 + T.nx[ie] * u * W, pz = cz + n[1] * 0.87 + T.nz[ie] * u * W; box(galG, px, T.hy[ie] + H - 0.05, pz, 0.04, 0.5, W / 8, T.hd[ie], k % 2 ? [0.95, 0.75, 0.1] : [0.1, 0.1, 0.1]); }
          for (const p of [a, b]) box(galG, p[0] + n[0] * 0.4, p[1], p[2] + n[1] * 0.4, 0.9, H + 0.3, 1.0, T.hd[ie], conc, null, true);
        }
        sign(G.s0 - 120, 1, 3, null, null, 3.0, 0.75, 2.6); sign(G.s0 - 60, 1, 6, null, null, 3.0, 0.75, 2.6);   // AVALANCHE AREA, RIVERSIDE SLIDE before it
        for (let i = i0; i <= i1; i += 3) { const p = Q(i, msd, -T.w, 0); exclPush(p[0], p[2], T.w + 3); }
        out.marks['Galerija Riverside'] = [T.px[(i0 + i1) >> 1], T.pz[(i0 + i1) >> 1]];
      }
      if (!galG.empty) {
        const gm = new THREE.MeshLambertMaterial({ vertexColors: true }), m = new THREE.Mesh(galG.geometry(), gm); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
        out.dyn.tunnel = { mat: gm, s0: galRanges[0][0], s1: galRanges[galRanges.length - 1][1], ranges: galRanges };   // (Render: the roof fades while the followed car is inside one; Sfx: the engine rings)
      }
    }

    /* ---- no guard rails: only the bridge has its concrete parapets; a white post with a reflector every ~50 m where there is no drop (knockable where
       it fits), yellow warning diamonds before the sharper bends and chevrons round their outside, the sights' and the slides' boards ---- */
    /* ---- the side roads' cones across their mouths, the rails and gates at their ends, the streets' names (stubProps) ---- */
    out.stubStats = stubProps({ scen, out, root, gH: unGround, loc: { closed: 'ROAD CLOSED', gate: 'CLOSED', plate: ['#0f6b3e', '#f4f6f2'] }, posts: 'none' });
    let nPost = 0;
    {
      const mkPosts = [];
      for (const side of [-1, 1]) {
        const bar = side > 0 ? T.br : T.bl, Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (onBr[i] && onBr[i + 1]) {   // the bridge: a concrete parapet
            const a = Q(i, -0.1, -0.05), b = Q(i + 1, -0.1, -0.05), c = Q(i + 1, 0.95, -0.05), d = Q(i, 0.95, -0.05), a2 = Q(i, -0.1, 0.4), b2 = Q(i + 1, -0.1, 0.4), c2 = Q(i + 1, 0.95, 0.4), d2 = Q(i, 0.95, 0.4), inn = Q(i, 0.4, 0.18);
            g.quadO(a, b, c, d, [0.68, 0.67, 0.64], inn); g.quadO(a2, b2, c2, d2, [0.6, 0.59, 0.56], inn); g.quadO(d, c, c2, d2, [0.76, 0.74, 0.7], inn);
          } else if (!onBr[i] && !galAt[i] && !dropAt(i, side) && i % 25 === 0 && i > 2 && i < iE - 2 && !SB.mouthV[side > 0 ? 1 : 0][i]) mkPosts.push([i, side]);
        }
      }
      for (let i = 0; i < N; i += 8) for (const side of [-1, 1]) {   // the tall snow poles the ploughs steer by, right at the edge of every drop: from above a row of strokes (and their shadows) that marks the brink
        if (!dropAt(i, side) || galAt[i] || onBr[i]) continue;
        const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.12), px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o, g = scen.get(px, pz), hp = 2.4 + 0.3 * rpHash(i, 91);
        box(g, px, T.hy[i] - 0.25, pz, 0.14, hp, 0.14, T.hd[i], [0.3, 0.26, 0.22], null, true); box(g, px, T.hy[i] - 0.25 + hp, pz, 0.16, 0.55, 0.16, T.hd[i], [1.0, 0.55, 0.06], [1.0, 0.75, 0.3], true); nPost++; }
      out.propR = 150; out.propFloor = propFloorTable(null, (i, side) => vp[side > 0 ? 1 : 0][i]);
      const sA = sStart + 30, sB = sFin - 30;
      out.propStats = roadsideProps(out.props, { spots: mkPosts, postEdge: [1.0, 1.4], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.2, 1.6], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
        floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB || galAt[i]; } });
      const kp = out.propStats.spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.35), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.12, 1.3, 0.12, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.85, p[2], 0.13, 0.16, 0.13, T.hd[i], [0.9, 0.62, 0.1], null, true); nPost++; }
      // the warning diamonds 70 m before the sharper bends (on the right), three chevrons round the outside of each
      for (const c of T.corners) { if (c.sev < 2) continue; const sm = ((c.i0 + c.i1) / 2) * T.ds; if (sm < sStart + 80 || sm > sFin - 20) continue;
        const turn = c.dir > 0 ? 1 : -1, sd = T.idx(sm - 70); if (galAt[sd]) continue;
        const [px, pz, ii] = onSide(sm - 70, 1, dropAt(sd, 1) ? -0.5 : 0.9);
        if (!excluded(px, pz)) { const py = unGround(px, pz), g = scen.get(px, pz), u0 = (turn > 0 ? 0 : 1) / 8; box(g, px, py - 0.2, pz, 0.08, 2.1, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
          bannerQ(px, py + 1.4, pz, -T.tx[ii], -T.tz[ii], 0.95, 0.95, 7 / 8, 1, u0, u0 + 1 / 8, ban2); exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); }
        const out_ = -turn, cell = turn > 0 ? 3 : 4, u0 = cell / 8;
        for (const o of [-16, 0, 16]) { const s = sm + o, ci = T.idx(s); if (galAt[ci] || onBr[ci]) continue; const [cx, cz] = onSide(s, out_, dropAt(ci, out_) ? -0.45 : 0.6); if (excluded(cx, cz)) continue;
          const cy = unGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
          bannerQ(cx, cy + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, 7 / 8, 1, u0, u0 + 1 / 8, ban2); CR.avoid(cx, cz, 0.6); }
      }
      const nm = (n) => T.names.find(q => q.n.startsWith(n));   // the place boards
      for (const [n, k, o] of [['Soteska', 1, 20], ['Slap Bear', 0, -40], ['Alpine', 2, -50], ['Velik plaz', 5, -40]]) { const q = nm(n); if (q) sign(sStart + q.d + o, 1, k, null, null, 3.2, 0.8, 2.7); }
      sign(sStart + 60, 1, 7, null, null, 3.0, 0.75, 2.6); sign(sStart + 1500, 1, 4, null, null, 3.0, 0.75, 2.6); sign(sStart + 3800, 1, 4, null, null, 3.0, 0.75, 2.6);   // US 550 SOUTH, FALLING ROCK
    }

    /* ---- the streams (def.creeks): the Uncompahgre River at the bottom of the gorge, Bear Creek, the brooks: flowing water (Spa's brook shader: white
       where it runs steep) on the ground, grey cobbles along it; Bear Creek Falls (def.falls): the creek drops off under the bridge, a sheet of white water
       down the cliff into the gorge, a pool of foam at its foot ---- */
    let nCreek = 0;
    {
      const wg = new Chunks(200, true), wcr = new Chunks(320, true), shal = [0.5, 0.22, 0.15], deep = [0.28, 0.13, 0.09], white = [2.2, 1.1, 0.85], wet = [0.12, 0.12, 0.11], dry = [0.22, 0.21, 0.19], RC = rng(5581);   // (wcr: the creeks' water, times the blue water map: a dark grey-green, white riffles; wg: the falls' white water)
      const cob = [[0.5, 0.48, 0.45], [0.44, 0.42, 0.4], [0.56, 0.5, 0.44], [0.38, 0.37, 0.36]];
      for (const C of UNC ? UNC.L : []) {
        let dist = 0; const hw = C.hw, W = hw * 2, bw = 0.6 + W * 0.18, n = C.x.length;   // (bw: the wet gravel bank either side)
        for (let k = 0; k < n - 1; k++) {
          const ax = C.x[k], az = C.z[k], bx = C.x[k + 1], bz = C.z[k + 1], l = Math.hypot(bx - ax, bz - az) || 1, d0 = dist; dist += l;
          if (vrDist(ax, az) > 330) continue; const na = vrNear(ax, az), nb = vrNear(bx, bz); if ((na.i >= 0 && na.dd < 7 + hw) || (nb.i >= 0 && nb.dd < 7 + hw)) continue;   // (under the road: a culvert)
          const nx = -(bz - az) / l, nz = (bx - ax) / l, Pb = (x, z, o, dy) => { const X = x + nx * o, Z = z + nz * o; return [X, unGround(X, Z) + dy, Z]; }, Pw = (x, z, o, yw) => { const X = x + nx * o, Z = z + nz * o; return [X, Math.min(yw, unGround(X, Z) + 0.3), Z]; };
          const st = clamp((C.y[Math.max(0, k - 2)] - C.y[Math.min(n - 1, k + 3)]) / 15 / 0.14, 0, W >= 6 ? 0.45 : 0.9), g = wcr.get(ax, az), ya = C.y[k], yb2 = C.y[k + 1];
          const rip = (j) => { const q = st * (0.45 + 0.55 * rpHash(k + j * 7, 77 + n)); return [lerp(shal[0], white[0], q), lerp(shal[1], white[1], q), lerp(shal[2], white[2], q)]; }, mid = [lerp(deep[0], white[0], st * 0.6), lerp(deep[1], white[1], st * 0.6), lerp(deep[2], white[2], st * 0.6)];   // (riffles of white where it runs steep)
          const uvw = (p) => [p[0] / 9, -p[2] / 9], A0 = Pw(ax, az, -hw, ya), A1 = Pw(ax, az, 0, ya), A2 = Pw(ax, az, hw, ya), B0 = Pw(bx, bz, -hw, yb2), B1 = Pw(bx, bz, 0, yb2), B2 = Pw(bx, bz, hw, yb2);
          g.quadUp(A0, A1, B1, B0, [rip(0), mid, mid, rip(1)], [uvw(A0), uvw(A1), uvw(B1), uvw(B0)]);
          g.quadUp(A1, A2, B2, B1, [mid, rip(2), rip(3), mid], [uvw(A1), uvw(A2), uvw(B2), uvw(B1)]);
          const gd = det.get(ax, az);
          for (const sd of [-1, 1]) gd.quadUp(Pb(ax, az, sd * (hw - 0.1), 0.05), Pb(ax, az, sd * (hw + bw), 0.06), Pb(bx, bz, sd * (hw + bw), 0.06), Pb(bx, bz, sd * (hw - 0.1), 0.05), [wet, dry, dry, wet]);   // (the wet gravel along it)
          if (RC() < 0.35 + 0.3 * st) { const sd = RC() < 0.5 ? -1 : 1, o = sd * (hw * (0.4 + RC() * 0.7) + RC() * bw), f = RC(), cx = ax + (bx - ax) * f + nx * o, cz = az + (bz - az) * f + nz * o, r0 = 0.25 + RC() * 0.45 * (W > 3 ? 1.6 : 1);   // (cobbles and boulders in and beside it)
            rock(gd, cx, unGround(cx, cz) + r0 * 0.15, cz, r0 * 1.2, r0 * 0.8, r0, RC() * TAU, vary(cob[Math.floor(RC() * cob.length)], RC, 0.12), RC, 0.3); }
          if (k % 2 === 0) { exclPush(ax, az, hw + bw + 0.8); CR.block(ax, az, l + 0.4, W + 2 * bw + 1, Math.atan2(bz - az, bx - ax)); }
          nCreek++;
        }
      }
      if (UNF) {   // the falls: a curtain of white water from the lip below the bridge down the chasm (bulging out, so the high cameras see its face), a pool of
        // foam at its foot, the white run-out down to the river, a cloud of spray over the pool
        const F = UNF, i = F.i, g = wg.get(F.x, F.z), wc = [0.9, 0.93, 0.95], wc2 = [0.62, 0.68, 0.72], tx = F.dz, tz = -F.dx, bxp = F.x + F.dx * 6, bzp = F.z + F.dz * 6, yb = unGround(bxp, bzp);
        const row = (t) => { const o = 0.4 + 2.6 * Math.pow(t, 1.5), cx = F.x + F.dx * o, cz = F.z + F.dz * o, y = F.y + 0.2 - (F.y + 0.2 - yb - 0.3) * t, hw = 1.0 + 1.4 * t, P = [];
          for (let j = 0; j <= 4; j++) { const ph = (j / 4 - 0.5) * 1.7, u = Math.sin(ph) * hw, v = (Math.cos(ph) - 1) * hw * 0.55; P.push([cx + tx * u + F.dx * v, y, cz + tz * u + F.dz * v]); } return { P, cx, cz, y }; };
        let prev = row(0), dl = 0;
        for (let k = 1; k <= 14; k++) { const cur = row(k / 14), d1 = dl + Math.hypot(cur.cx - prev.cx, cur.y - prev.y, cur.cz - prev.cz);
          for (let j = 0; j < 4; j++) g.quadO(prev.P[j], prev.P[j + 1], cur.P[j + 1], cur.P[j], null, [cur.cx - F.dx * 6, cur.y, cur.cz - F.dz * 6], [[20 + j / 4, dl], [20.25 + j / 4, dl], [20.25 + j / 4, d1], [20 + j / 4, d1]], j === 0 || j === 3 ? [wc2, wc, wc, wc2] : [wc, wc, wc, wc]);
          prev = cur; dl = d1; }
        { const L = [F.x - tx * 1.6, F.y + 0.2, F.z - tz * 1.6], Rr = [F.x + tx * 1.6, F.y + 0.2, F.z + tz * 1.6], bx = T.px[i], bz = T.pz[i];   // (the creek under the bridge up to the lip)
          g.quadUp([bx - tx * 1.6, F.y + 0.2, bz - tz * 1.6], [bx + tx * 1.6, F.y + 0.2, bz + tz * 1.6], Rr, L, [wc2, wc2, wc, wc], [[16, 0], [17, 0], [17, 8], [16, 8]]); }
        for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, b = (k + 1) / 12 * TAU, r = 3.6;   // the pool of foam at the foot
          g.quadUp([bxp, yb + 0.3, bzp], [bxp + Math.cos(b) * r * 0.5, yb + 0.3, bzp + Math.sin(b) * r * 0.5], [bxp + Math.cos(b) * r, unGround(bxp + Math.cos(b) * r, bzp + Math.sin(b) * r) + 0.25, bzp + Math.sin(b) * r], [bxp + Math.cos(a) * r, unGround(bxp + Math.cos(a) * r, bzp + Math.sin(a) * r) + 0.25, bzp + Math.sin(a) * r], [wc, wc, wc2, wc2], [[20, 0], [20.5, 0], [21, 2], [21, 2]]); }
        { let best = null; for (const cr of def.creeks || []) { if (cr[0] < 6) continue; for (let k = 1; k + 1 < cr.length; k += 2) { const d = Math.hypot(cr[k] - bxp, cr[k + 1] - bzp); if (d > 20 && (!best || d < best.d)) best = { d, x: cr[k], z: cr[k + 1] }; } }   // the run-out: white water down to the river
          if (best && best.d < 170) { const n = Math.ceil(best.d / 3), ux = (best.x - bxp) / best.d, uz = (best.z - bzp) / best.d, nx = -uz, nz = ux; let d0 = 0;
            for (let k = 0; k < n; k++) { const f0 = k / n, f1 = (k + 1) / n, ax = bxp + (best.x - bxp) * f0 + nx * Math.sin(k * 0.9) * 1.2, az = bzp + (best.z - bzp) * f0 + nz * Math.sin(k * 0.9) * 1.2, cx = bxp + (best.x - bxp) * f1 + nx * Math.sin((k + 1) * 0.9) * 1.2, cz = bzp + (best.z - bzp) * f1 + nz * Math.sin((k + 1) * 0.9) * 1.2;
              if (k * 3 < 4) continue; const hw = 1.5, Q = (x, z, o) => [x + nx * o, unGround(x + nx * o, z + nz * o) + 0.16, z + nz * o], st = clamp((unGround(ax, az) - unGround(cx, cz)) / 3 / 0.12, 0.4, 1), S2 = 2 * Math.round(st * 10), d1 = d0 + 3, gg = wg.get(ax, az);
              gg.quadUp(Q(ax, az, -hw), Q(ax, az, hw), Q(cx, cz, hw), Q(cx, cz, -hw), [shal, shal, shal, shal], [[S2, d0], [S2 + 1, d0], [S2 + 1, d1], [S2, d1]]); d0 = d1;
              if (k % 2 === 0) exclPush(ax, az, hw + 1.5); } } }
        { const RM = rng(5591), pts = [];   // the spray: soft white clouds over the pool and along the fall (points with a soft round sprite: one draw)
          for (let k = 0; k < 30; k++) { const t = k < 18 ? 0.85 + RM() * 0.15 : RM() * 0.85, o = 0.4 + 2.6 * Math.pow(t, 1.5) + (RM() - 0.2) * (k < 18 ? 5 : 2), x = F.x + F.dx * o + tx * (RM() - 0.5) * (k < 18 ? 6 : 3), z = F.z + F.dz * o + tz * (RM() - 0.5) * (k < 18 ? 6 : 3);
            pts.push(x, k < 18 ? yb + 0.6 + RM() * 6 : F.y - (F.y - yb) * t, z); }
          const c = document.createElement('canvas'); c.width = c.height = 64; const x2 = c.getContext('2d'), gr = x2.createRadialGradient(32, 32, 0, 32, 32, 32);
          gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x2.fillStyle = gr; x2.fillRect(0, 0, 64, 64);
          const st = new THREE.CanvasTexture(c); out.ownTex.push(st);
          const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); pg.computeBoundingSphere();
          const pm = new THREE.Points(pg, new THREE.PointsMaterial({ size: 7, map: st, color: 0xf4f8fb, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true })); pm.matrixAutoUpdate = false; pm.renderOrder = 2; root.add(pm); }
        exclPush(F.x + F.dx * 8, F.z + F.dz * 8, 12);
        out.marks['Slap Bear Creek'] = [F.x, F.z]; out.fallsH = F.y - yb;
      }
      out.dyn.brook = { uT: { value: 0 } }; wg.addTo(root, brookMat(out.dyn.brook), false, true);
      wcr.addTo(root, new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 60, specular: 0x2a3a44 }), false, true); out.dyn.water = tex.water;   // (the water map drifts: World.update)
    }

    /* ---- spectators: the start and the finish, the checkpoints, the Bear Creek Falls overlook and the Alpine Loop junction, a few groups along the road
       (never on the edge of a drop) ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.2, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.14, keepBar: 1.4 };
      const run = (sa, sb, side, o) => { sa = Math.max(sa, 8); sb = Math.min(sb, T.len - 8); for (let s = sa; s < sb; s += 6) if (dropAt(T.idx(s), side)) { if (s - sa > 8) crowdRun(CR, sa, s - 2, side, Object.assign({}, M, o)); sa = s + 6; } if (sb - sa > 8) crowdRun(CR, sa, sb, side, Object.assign({}, M, o)); };
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'UN start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'UN finish' }); }
      T.cpS.forEach((s0) => { for (const sd of [-1, 1]) run(s0 - 22, s0 + 18, sd, { rows: 2, dens: 0.5, label: 'UN cp' }); });
      for (const [n, a, b] of [['Slap Bear', -110, -15], ['Alpine', -60, 60]]) { const q = T.names.find(e => e.n.startsWith(n)); if (q) for (const sd of [-1, 1]) run(sStart + q.d + a, sStart + q.d + b, sd, { rows: 3, dens: 0.45, clump: 0.8, label: 'UN ' + n }); }
      for (let s = sStart + 300; s < sFin - 300; s += 520) { const sd = rpHash(Math.round(s), 7) < 0.5 ? -1 : 1; if (galAt[T.idx(s)]) continue; run(s, s + 24, sd, { rows: 2, dens: 0.35, clump: 0.9, label: 'UN group' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the forest (instanced per 96 m chunk): Engelmann spruce and subalpine fir (tall and narrow), groves of aspen on the gentler slopes (white trunks,
       green in summer, gold and orange in autumn), willow scrub; lone conifers on the ledges of the cliffs; none on the sheerest faces, the road or
       the water; under the snow the spruces white ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 4].map(k => new IChunks(unTreeGeo(k), tMatT, k === 1 ? 128 : 96));   // (0 / 1 spruce near / far from the road, 2 aspen, 3 spruce under snow; the far spruce in bigger chunks: fewer draws)
    let nTrees = 0, nSnag = 0, nShrub = 0, nLog = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(70000 * dens), RT = rng(5561), SP = 5.2 / Math.sqrt(dens), au = UNS !== 'summer', NEAR = 46;
      const shrubC = au ? [[0.78, 0.6, 0.2], [0.66, 0.36, 0.14], [0.5, 0.42, 0.2], [0.82, 0.48, 0.16]] : [[0.3, 0.42, 0.17], [0.25, 0.36, 0.15], [0.36, 0.44, 0.2], [0.28, 0.38, 0.22]];
      const logC = [[0.5, 0.45, 0.4], [0.42, 0.36, 0.3], [0.56, 0.52, 0.47]];
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(250)) continue;
          if (hd > LOD.radius(90) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot)
          const c = vrLC(x, z), road = sstep(34, 6, hd), p = c === 1 ? 0.9 : c === 2 ? 0.45 : c === 0 ? 0.12 + 0.25 * sstep(0.6, 0.8, P.n5(x * 1.3 + 40, z * 1.3)) : c === 4 ? 0.1 + 0.22 * sstep(0.5, 0.75, P.n5(x * 1.7, z * 1.7 + 90)) + 0.16 * road : c === 3 ? 0.04 : 0;   // (WorldCover's bare strip along the road itself: more trees in it than on the real scree; more near the road)
          if (r1 > p) continue;
          if (vrWater(x, z).e > -4) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 1.8) continue; if (nn.i >= 0 && nn.dd < 5 && r2 < 0.2) continue;
          if (nn.i >= 0 && nn.dd < 11 && UNW && UNW[nn.lat > 0 ? 1 : 0][nn.i] > 0.3) continue;   // (the edge of a drop: nothing but the cliff right below it)
          if (excluded(x, z)) continue;
          const y = unGround(x, z), A = y + base, sl = unSlope(x, z); if (sl > 1.45) continue;
          const asp = sstep(0.5, 0.66, P.n7(x * 0.8 + 300, z * 0.8)) * (1 - sstep(3050, 3250, A)) * (1 - sstep(0.75, 1.05, sl));   // (aspen groves: patches on the gentler, lower slopes)
          const near = hd < NEAR;
          if (c === 2 || (c === 0 && r3 < 0.18) || (c === 4 && r3 < 0.1 && hd < 40)) {   // willow and currant scrub, a lone bush on the meadows and the scree (merged: no draw of their own)
            if (hd < 70) { const sz = 0.8 + r4 * 1.4, g = scen.get(x, z); API.ROCK_SMOOTH = true; puff(g, x, y + sz * 0.32, z, sz, 0.62, vary(shrubC[Math.floor(r2 * shrubC.length)], RT, 0.16), RT, 0.35, 0.62, 1.12); API.ROCK_SMOOTH = false; nShrub++; }
            continue; }
          const sp = r3 < asp * 0.95 ? 1 : 0, shrink = lerp(1, 0.6, sstep(3200, 3500, A)) * (sl > 0.95 ? 0.75 : 1);
          let hgt, wid, col, kind;
          if (sp === 0) {
            const snag = r4 < 0.07 + 0.05 * sstep(2700, 2900, A);   // (standing dead spruce: the beetle's grey trees among the green)
            hgt = (14 + r4 * 13) * shrink; wid = hgt * (r2 < 0.45 ? 0.3 + r3 * 0.06 : 0.4 + r3 * 0.1);
            if (snag && hd < 95) { unSnag(scen.get(x, z), x, y, z, hgt * 0.9, wid * 0.55, r1 * 9, r2 < 0.75 ? 0 : 1, RT); nSnag++; continue; }   // (merged: grey, a few still red-brown)
            col = r2 < 0.45 ? [0.86 + r3 * 0.12, 0.95 + r4 * 0.1, 1.02 + r3 * 0.12] : [0.95 + r2 * 0.15, 0.95 + r4 * 0.12, 0.88 + r3 * 0.12];   // (the firs narrower and bluer)
            kind = unSnow(x, z, A, 1 / Math.sqrt(1 + sl * sl), 0) > 0.4 ? 3 : near ? 0 : 1;
          } else {
            hgt = (10 + r4 * 7) * shrink; wid = hgt * (0.46 + r2 * 0.16);
            col = au ? (r2 < 0.1 ? [0.84, 1.0, 0.76] : r2 < 0.8 ? [1.04, 1.0, 0.9] : [1.06, 0.72, 0.56]) : (r2 < 0.3 ? [0.92, 1.05, 0.86] : r2 < 0.85 ? [1, 1, 1] : [1.06, 1.06, 0.9]);   // (autumn: gold, a few still green, some orange)
            kind = 2;
          }
          tk[kind].add(x, y - 0.15, z, r1 * 70, wid, hgt, col);
          if (sp === 0 && c === 1 && r2 > 0.86 && hd > 6 && hd < 80 && sl < 0.9) {   // a fallen trunk on the forest floor, along the slope's contour (merged)
            const gx = unGround(x + 2, z) - unGround(x - 2, z), gz = unGround(x, z + 2) - unGround(x, z - 2), a = Math.atan2(gx, -gz) + (r3 - 0.5) * 0.6, L = 5 + r4 * 6, ox = Math.cos(a) * L / 2, oz = Math.sin(a) * L / 2;
            const lx = x + Math.sin(r1 * 9) * 3, lz = z + Math.cos(r1 * 9) * 3, ya = unGround(lx - ox, lz - oz), yb = unGround(lx + ox, lz + oz), n2 = vrNear(lx, lz);
            if (!(n2.i >= 0 && n2.dd < 3) && !excluded(lx, lz)) { ouRod(scen.get(lx, lz), [lx - ox, ya + 0.22, lz - oz], [lx + ox, yb + 0.18, lz + oz], 0.2 + r2 * 0.08, logC[Math.floor(r4 * 3)], 5); nLog++; } }
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);

    /* ---- the ground cover (instanced per 64 m chunk, no shadow pass): tufts of grass bending in the wind on the meadows, along the verges and in the
       clearings, green in summer and straw in autumn; in summer the wildflowers of the high meadows in patches (purple lupine, red paintbrush, yellow
       and white daisies) ---- */
    let nTufts = 0, nFlowers = 0;
    {
      const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);
      { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
      const tu = new IChunks(tuftGeo(false), wMat, 128), fl = UNS === 'summer' ? new IChunks(unFlowerGeo(), ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut), 128) : null;
      const G = P.G, Lt = VRC * VRT, RG = rng(5601), SPg = 2.5 / Math.sqrt(dens), au = UNS !== 'summer', maxT = Math.round(30000 * dens);
      const flC = [[0.55, 0.36, 0.86], [0.5, 0.32, 0.8], [0.9, 0.22, 0.16], [0.98, 0.82, 0.22], [0.97, 0.96, 0.92]];
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SPg) for (let xx = xa; xx < xa + Lt - 0.01; xx += SPg) {
          const x = xx + (RG() - 0.5) * SPg, z = zz + (RG() - 0.5) * SPg, r1 = RG(), r2 = RG(), r3 = RG();
          const hd = vrDist(x, z); if (hd > 72) continue;
          const c = vrLC(x, z), patch = P.n5(x * 2.3 + 17, z * 2.3), p = c === 0 ? 0.42 + 0.3 * patch : c === 4 ? (hd < 22 ? 0.2 : 0.06) * (0.5 + patch) : c === 1 ? 0.06 : c === 2 ? 0.3 : 0;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 0.7) continue;
          if (excluded(x, z) || vrWater(x, z).e > -2) continue;
          const sl = unSlope(x, z); if (sl > 0.95) continue;
          const y = unGround(x, z); if (unSnow(x, z, y + base, 1 / Math.sqrt(1 + sl * sl), 0) > 0.3) continue;
          if (fl && c === 0 && patch > 0.55 && r2 < 0.22) { const fc = flC[Math.floor(r3 * flC.length)]; fl.add(x, y - 0.02, z, r1 * TAU, 0.8 + r2 * 2, 0.7 + r3 * 0.5, fc); nFlowers++; continue; }
          const tint = au ? [0.62 + r2 * 0.08, 0.53 + r3 * 0.06, 0.3 + r2 * 0.05] : [0.27 + r2 * 0.08, 0.42 + r3 * 0.08, 0.15 + r2 * 0.05];   // (the clump's colours times the meadow's: green, straw in autumn)
          tu.add(x, y - 0.05, z, r2 * TAU, 1.0 + r3 * 1.1, 0.45 + r1 * 0.45, tint);
          if (++nTufts >= maxT) break grid;
        }
      }
      tu.addTo(root, false); if (fl) fl.addTo(root, false);
      for (const m of root.children) if (m.isInstancedMesh && m.instanceColor && m.material === wMat) m.instanceColor.ground = true;   // (the seasons' code: the tufts are grass)
    }

    /* ---- the rocks: boulders and scree at the foot of the cuts (grey, rust, red), crags where the slope rises steep beside the road and on the cliffs
       below the drops, loose stones along the verges ---- */
    {
      const RV = rng(5571), rockC = [[0.44, 0.42, 0.4], [0.5, 0.4, 0.32], [0.4, 0.39, 0.38], [0.47, 0.44, 0.41], [0.46, 0.35, 0.29], [0.35, 0.34, 0.34]];   // (grey quartzite and slate, rusty ones)
      for (let s = 10; s < T.len - 10; s += 5) for (const side of [-1, 1]) {   // at the foot of the cuts and out on the scree
        const i = T.idx(s); if (galAt[i] || RV() > 0.34) continue;
        const o = 1.4 + Math.pow(RV(), 1.5) * 36, [x, z] = onSide(s, side, o), sz = 0.35 + RV() * 1.2; if (vrNear(x, z).dd < sz + 0.5 || excluded(x, z) || vrWater(x, z).e > -3) continue;
        const y = unGround(x, z), sl = unSlope(x, z); if (sl < 0.3 && vrLC(x, z) !== 4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RV() * TAU, vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.12), RV, 0.32);
      }
      for (let s = 16; s < T.len - 16; s += 12) for (const side of [-1, 1]) {   // crags where the slope is steep (on the drops: the cliff below the road)
        if (RV() < 0.35) continue;
        const i = T.idx(s), dr = dropAt(i, side), [x, z] = onSide(s, side, (dr ? 3 : 7) + RV() * 60); if (excluded(x, z) || vrNear(x, z).dd < (dr ? 2.5 : 5)) continue;
        const sl = unSlope(x, z); if (sl < 0.75) continue;
        const y = unGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 1.4 + RV() * 2.6, qx = x + (RV() - 0.5) * 7, qz = z + (RV() - 0.5) * 7, qy = unGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 0.8) continue;
          rock(g, qx, qy + r0 * 0.12, qz, r0, r0 * (0.8 + RV() * 0.8), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, 0.4); }   // (sunk into the slope: outcrops rather than loose blocks)
      }
      const pk = new IChunks(unStoneGeo(), ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut), 96), RS = rng(5577), maxS = Math.round(13000 * dens); let nS = 0;   // the loose stones
      edge: for (let s = 12; s < T.len - 12; s += 1.1 / dens) for (const side of [-1, 1]) {
        if (galAt[T.idx(s)]) continue;
        const o = 1.5 + Math.pow(RS(), 2) * 30, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.0 || excluded(x, z) || vrWater(x, z).e > -3) continue;
        const y0 = unGround(x, z), sl = unSlope(x, z); if (sl > 1.2 || (vrLC(x, z) === 0 && r1 < 0.5)) continue;
        const k = 0.8 + r3 * 0.3, sc = 0.8 + r1 * 1.1 - 0.006 * o; pk.add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [k, k * 0.96, k * 0.92]);
        if (++nS >= maxS) break edge;
      }
      { const G = P.G, Lt = VRC * VRT, SPt = 3.4 / Math.sqrt(dens), maxT2 = Math.round(11000 * dens); let nT = 0;   // the talus: the bare rocky slopes (WorldCover's rock) strewn with stones, thickest on the steeper ones
        talus: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
          if (!G.on[tj * G.ntx + ti]) continue; const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
          for (let zz = za; zz < za + Lt - 0.01; zz += SPt) for (let xx = xa; xx < xa + Lt - 0.01; xx += SPt) {
            const x = xx + (RS() - 0.5) * SPt, z = zz + (RS() - 0.5) * SPt, r1 = RS(), r2 = RS(), r3 = RS(); if (vrDist(x, z) > 75 || vrLC(x, z) !== 4) continue;
            const sl = unSlope(x, z); if (r1 > 0.25 + 0.5 * sstep(0.35, 0.9, sl) || sl > 1.25) continue;
            const nn = vrNear(x, z); if ((nn.i >= 0 && nn.dd < 1.5) || excluded(x, z)) continue;
            const y0 = unGround(x, z), k = 0.78 + r3 * 0.32, sc = 0.9 + r2 * 1.6; pk.add(x, y0 - 0.06, z, r2 * TAU, sc, sc * (0.7 + r3 * 0.5), [k * 1.02, k * 0.95, k * 0.9]);
            if (++nT >= maxT2) break talus; } } }
      pk.addTo(root, false);
      for (let s = sStart + 40; s < sFin - 40; s += 9) for (const side of [-1, 1]) {   // a few rocks fallen from the cut onto the mountain side's shoulder (beyond the edge line, clear of the lane)
        const i = T.idx(s); if (dropAt(i, side) || galAt[i] || onBr[i] || RV() > 0.08) continue;
        const bar = side > 0 ? T.br[i] : T.bl[i]; if (bar < w + 1.6) continue;
        const [x, z] = onSide(s, side, -(0.4 + RV() * (bar - w - 1.2))), r0 = 0.18 + RV() * 0.28; if (excluded(x, z)) continue;
        rock(scen.get(x, z), x, T.hy[i] + r0 * 0.2, z, r0 * 1.2, r0 * 0.8, r0, RV() * TAU, vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.1), RV, 0.35); }
    }

    /* ---- wildlife: bands of bighorn sheep on the rocky slopes above and below the road, mountain goats on the cliffs, mule deer at the forest's edge, elk
       grazing on the big meadow (merged into the scenery; placed on spots the cameras look at: 10-45 m from the road) ---- */
    let nBeast = 0;
    {
      const RA = rng(5651);
      const find = (sa, sb, sl0, sl1, lc) => { let best = null;
        for (let s = sa; s <= sb; s += 6) for (const side of [-1, 1]) for (const e of [12, 18, 26, 36]) { const [x, z, i] = onSide(sStart + s, side, e), n = vrNear(x, z); if (n.i >= 0 && n.dd < 7) continue;
          if (excluded(x, z) || vrWater(x, z).e > -3 || (UNC && unCreekAt(x, z).d < unCreekAt(x, z).hw + 3)) continue;
          const sl = unSlope(x, z), c = vrLC(x, z); if (sl < sl0 || sl > sl1 || (lc != null && c !== lc)) continue;
          const sc = -Math.abs(sl - (sl0 + sl1) / 2) - e * 0.01 + RA() * 0.15; if (!best || sc > best.sc) best = { x, z, i, sc }; }
        return best; };
      const band = (sa, sb, kind, n, sl0, sl1, lc) => { const b = find(sa, sb, sl0, sl1, lc); if (!b) return;
        for (let k = 0, tries = 0; k < n && tries < 60; tries++) { const x = b.x + (RA() - 0.5) * 12, z = b.z + (RA() - 0.5) * 12, nn = vrNear(x, z); if ((nn.i >= 0 && nn.dd < 5) || excluded(x, z)) continue;
          const sl = unSlope(x, z); if (sl > sl1 + 0.15) continue;
          const gx = unGround(x + 1, z) - unGround(x - 1, z), gz = unGround(x, z + 1) - unGround(x, z - 1), h = (Math.hypot(gx, gz) > 0.1 ? Math.atan2(gx, -gz) + (RA() < 0.5 ? PI : 0) : RA() * TAU) + (RA() - 0.5) * 0.9;   // (across the slope)
          const male = k === 0, sc = (kind === 3 ? 1.05 : 1.15) * (male ? 1.08 : k > n - 2 && RA() < 0.4 ? 0.65 : 0.92 + RA() * 0.12);
          unBeast(scen.get(x, z), x, unGround(x, z) - 0.04, z, h, kind, sc, RA, male, RA() < 0.55); nBeast++; }
        exclPush(b.x, b.z, 9); out.marks['beast' + kind + '@' + sa] = [b.x, b.z]; };
      band(1350, 1700, 0, 5, 0.45, 1.0, null);   // bighorn sheep
      band(3150, 3500, 0, 6, 0.45, 1.0, null);
      band(4050, 4400, 0, 4, 0.45, 1.0, null);
      band(2250, 2550, 1, 3, 0.8, 1.35, 4);    // mountain goats on the rock
      band(3800, 4000, 1, 2, 0.8, 1.35, 4);
      band(450, 900, 2, 3, 0.05, 0.45, null);  // mule deer
      band(2700, 3000, 2, 2, 0.05, 0.45, null);
      band(1500, 2100, 3, 6, 0.0, 0.35, 0);    // elk on the meadow
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    {   // ravens soaring over the gorge (one instanced mesh; Los Caracoles' condors' flight: caCondors poses them, here through stand-ins that write the instances)
      const im = new THREE.InstancedMesh(unRavenGeo(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 4), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(1.15, 1.15, 1.15), i0 = T.idx(sStart);
      im.castShadow = true; im.frustumCulled = false; im.matrixAutoUpdate = false; root.add(im);
      const L = [[24, 0.22, 24, 20, -14, 0], [31, -0.17, 30, -24, 18, 2.1], [19, 0.27, 20, 6, 30, 4.2], [36, 0.14, 34, 30, 34, 1.0]].map(([r, sp, hh, ox, oz, ph], k) => { const pv = new THREE.Vector3();
        return { r, sp, h: hh, ox, oz, ph, bank: 0.42, m: { position: { set: (x, y, z) => pv.set(x, y, z) }, rotation: { set: (a, b, c, o) => { e.set(a, b, c, o); q.setFromEuler(e); m4.compose(pv, q, sv); im.setMatrixAt(k, m4); im.instanceMatrix.needsUpdate = true; } } } }; });
      out.dyn.condors = { L, x0: T.px[i0], z0: T.pz[i0], y0: T.hy[i0], ax: T.px[i0], az: T.pz[i0], ay: T.hy[i0], t: null };
      caCondors(out.dyn.condors, 0, null); }
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: unAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: unAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    let dropM = 0; if (T.dropAt) for (let i = 0; i < N; i++) dropM += (T.dropAt[0][i] | T.dropAt[1][i]) * T.ds;
    out.stats = { trees: nTrees, nets: nNet, snowFences: nFence, snags: nSnag, shrubs: nShrub, logs: nLog, tufts: nTufts, flowers: nFlowers, animals: nBeast, turnouts: pulls.length, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, mines: nMine, posts: nPost, creeks: nCreek, galleries: GAL.length, drops: Math.round(dropM), sideRoads: out.stubStats.n };   // (read by the tests)
    return out;
  }

  World.ext.uncompahgre = (scene, tex, opts) => buildUncompahgre(scene, tex, opts);
})();
