/* =========================================================================
   WORLD — Los Caracoles (theme 'caracoles') and its terrain helpers: its own builder (World.ext.caracoles), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, atSf, box, clamp, cone, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl, gable, ico, lerp, propFloorTable, rng,
    roadsideProps, rock, rpHash, sstep, tuftWindMat, valueNoise2, vary
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= LOS CARACOLES (theme 'caracoles') =================
     Los Caracoles (Chile): the road to the Los Libertadores pass up its 29 numbered curves, from the Juncalillo river (~2200 m) to Portillo and
     the Laguna del Inca (~2870 m), on a clear afternoon of the Andean summer: bare slopes of grey, rust and ochre scree under steep crags, tufts of
     yellow bunch grass, green cushion plants up high, old snowfields on the shady (south-facing) slopes and in the gullies above the road. Built
     on Vršič's corridor (vrPrep and the terrain helpers read the same forms: def.dem, def.lc, def.lakes, def.bridges, def.bld), with a look of its
     own: the ground colours and the summer snow (caCol, caSnow), the plants and the boulders, two concrete avalanche galleries over the road
     (def.galleries: their roofs fade while the followed car is inside, as Monaco's tunnel), the old Transandine railway with its snow sheds
     (def.rail), Portillo (the yellow hotel by the lake, the Octagon, the ski lifts: def.lifts), a numbered sign before every curve (as on the
     real road) and chevrons round the hairpins, trucks waiting at both ends of the closed road. */
  const CACOL = [0, 0, 0], CA_SNC = [1.03, 1.05, 1.1];
  const CAN = { i: -1, d: 1e9, dd: 1e9, h: 0, env: 1e9 };   // caNear: nearest sample, its distance, the distance beyond the nearest barrier, blended road height, the ground's ceiling
  function caNear(x, z) {   // as vrNear, but every sample's height is carried across along its own grade (the road's height at the foot of the perpendicular):
    // by a leg the blend is that leg's height, between two legs of a hairpin ladder it passes smoothly from one to the other (no seam where the
    // nearest leg changes); env: the highest the ground may lie under every part of the road around (0.3 m below it inside its barriers, rising
    // behind them: gently for 5 m, then at 2 in 1)
    const P = API.VR, cx = Math.floor(x / API.VRHC) - P.cx0, cz = Math.floor(z / API.VRHC) - P.cz0, ds = T.ds;
    let ws = 0, hs = 0, bd = 1e9, bi = -1, bdd = 1e9, env = 1e9;
    for (let b = Math.max(0, cz - 2); b <= Math.min(P.ncz - 1, cz + 2); b++) for (let a = Math.max(0, cx - 2); a <= Math.min(P.ncx - 1, cx + 2); a++) {
      const L = P.cells[b * P.ncx + a]; if (!L) continue;
      for (let q = 0; q < L.length; q++) {
        const i = L[q], dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], lat = dx * T.nx[i] + dz * T.nz[i], ex = Math.max(0, Math.abs(al) - ds), d = Math.sqrt(lat * lat + ex * ex);
        if (d >= 64) continue;
        const dd = Math.max(0, d - (lat > 0 ? T.br[i] : T.bl[i])), hc = T.hy[i] + T.grade[i] * clamp(al, -2 * ds, 2 * ds), k = 1 / (dd + 1.5), wq = k * k * k * k * (d < 48 ? 1 : sstep(64, 48, d));
        ws += wq; hs += wq * hc;
        if (d < bd) { bd = d; bi = i; }
        if (dd < bdd) bdd = dd;
        const e = hc - 0.3 + (dd < 5 ? 0.2 * dd * dd : 5 + 2 * (dd - 5)); if (e < env) env = e;
      }
    }
    CAN.i = bi; CAN.d = bd; CAN.dd = bdd; CAN.h = bi < 0 ? 0 : hs / ws; CAN.env = env;
    return CAN;
  }
  function caH(x, z) {   // terrain height (as vrH, on caNear: the road's blend near it, the real terrain farther out; never above the road around)
    const n = caNear(x, z), i = n.i, dd = n.dd; let h;
    if (i < 0) h = API.vrFar(x, z);
    else { const hr = n.h - 0.3; h = dd <= 1 ? hr : lerp(hr, API.vrFar(x, z), sstep(1, 42, dd)); }
    const pads = API.VR.pads; for (let k = 0; k < pads.length; k++) { const p = pads[k], d = Math.hypot(x - p.x, z - p.z), pb = p.b || 12; if (d < p.r + pb) h = lerp(p.h, h, sstep(p.r, p.r + pb, d)); }   // level plots: the car parks, the named buildings
    for (const b of API.VR.gul) {   // the stream bed under the bridge (as vrH)
      if (i < 0 || Math.abs(i - b.i) * T.ds > b.half + 30) continue;
      const dx = x - b.x, dz = z - b.z, al = Math.abs(dx * b.tx + dz * b.tz), lat = Math.abs(dx * b.nx + dz * b.nz);
      if (al < b.half + 14 && lat < 60) h = Math.min(h, lerp(h, b.y, sstep(60, 22, lat)) + Math.max(0, al - b.bw / 2) * 1.2);
    }
    if (i >= 0) h = Math.min(h, n.env);
    const B = API.caBank; if (B && B.T === T) h = B.f(x, z, h);   // (the shared world of the passes: the ground kept under its banks between the hairpins' legs, js/world-prelaz.js)
    if (API.STG) h = API.vrStubH(x, z, h, i >= 0 ? dd : 999);   // the side roads: the ground levelled under them
    return h;
  }
  function caGH(i, j) {   // terrain height at grid vertex (i, j), computed once (VR.G: the same grid as Vršič's)
    const G = API.VR.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = caH(G.x0 + i * API.VRC, G.z0 + j * API.VRC); G.dd[k] = CAN.i >= 0 ? CAN.dd : 999; }
    return h;
  }
  function caGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = API.VR.G, gx = clamp((x - G.x0) / API.VRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / API.VRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = caGH(i, j); return a + u * (caGH(i + 1, j) - a) + v * (caGH(i, j + 1) - a); }
    const d = caGH(i + 1, j + 1); return d + (1 - u) * (caGH(i, j + 1) - d) + (1 - v) * (caGH(i + 1, j) - d);
  }
  function caSlope(x, z) { const a = caGround(x - 2.5, z), b = caGround(x + 2.5, z), c = caGround(x, z - 2.5), d = caGround(x, z + 2.5); return Math.hypot(b - a, d - c) / 5; }
  function caSnow(x, z, A, ny, sz) {   // how much of the old summer snow lies at (x, z) (A: metres above the sea, ny / sz: the ground's up and south
    // components): above ~3350 m on the sunny north faces, from ~2690 m on the shady south faces (the southern hemisphere), in patches and in the
    // hollows, off the steepest faces; and the snowfields WorldCover maps (lc 4)
    const P = API.VR, line = 3020 - 330 * clamp(sz * 2.4, -1, 1) + (P.c4(x, z) - 0.5) * 240;
    const k = sstep(line, line + 160, A) * sstep(0.42, 0.7, ny) * sstep(0.42, 0.66, P.c5(x, z) + 0.3 * sstep(line, line + 450, A));
    return Math.max(k, API.vrLCf(x, z, 4) * sstep(0.32, 0.6, ny));
  }
  function caCol(x, z, h, ny, sz, dd, sx) {   // ground colour (times the grey grit map): the scree and rock in grey-brown, banded with rust and ochre (the
    // volcanic layers of the range), pale with ash here and there, darker and banded on the steep faces; on the slopes the scree's fans and runnels down the
    // fall line (sx, sz: the ground's east and south components); straw in patches where the bunch grass grows (lc 1: thin on the scree, the tufts
    // themselves are the plants), olive under the shrubs (lc 2), gravel yards in Portillo (lc 3), the summer snow, a trodden gravel verge
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), r = P.c3(x, z), f = P.n4(x, z);
    const gr = API.vrLCf(x, z, 1), sh = API.vrLCf(x, z, 2), se = API.vrLCf(x, z, 3);
    let R = 0.575, G = 0.555, B = 0.53;
    const rust = sstep(0.6, 0.86, m), och = sstep(0.58, 0.84, q) * (1 - 0.6 * rust), dark = sstep(0.6, 0.84, r), ash = sstep(0.6, 0.86, P.c4(x * 1.4, z * 1.4)) * (1 - rust) * (1 - dark);
    R = lerp(R, 0.62, rust); G = lerp(G, 0.5, rust); B = lerp(B, 0.43, rust);
    R = lerp(R, 0.68, och); G = lerp(G, 0.6, och); B = lerp(B, 0.48, och);
    R = lerp(R, 0.45, dark * 0.75); G = lerp(G, 0.44, dark * 0.75); B = lerp(B, 0.43, dark * 0.75);
    R = lerp(R, 0.69, ash * 0.6); G = lerp(G, 0.68, ash * 0.6); B = lerp(B, 0.65, ash * 0.6);
    R += (f - 0.5) * 0.09; G += (f - 0.5) * 0.085; B += (f - 0.5) * 0.08;
    const st = sstep(0.8, 0.52, ny);   // the steep faces: rock in bands along the height
    const hz = Math.hypot(sx || 0, sz), fan = sstep(0.12, 0.3, hz) * (1 - st);   // the scree slopes: fans of fresher, paler scree and darker runnels down the fall line
    if (fan > 0) { const u = (z * (sx || 0) - x * sz) / hz, w = Math.sin(u * 0.23 + P.c5(x, z) * 6 + P.n2(x, z) * 4), k = w * fan * (0.06 + 0.09 * P.n3(x, z)); R += k; G += k * 0.97; B += k * 0.92; }
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 7.5 + P.c2(x * 0.4, z * 0.4) * 7), k = 0.8 + 0.18 * band; R = lerp(R, 0.57 * k + rust * 0.06, st); G = lerp(G, 0.53 * k, st); B = lerp(B, 0.5 * k, st); }
    const gk = gr * sstep(0.4, 0.78, P.n2(x * 1.9, z * 1.9)) * 0.55 * (1 - 0.7 * st);
    R = lerp(R, 0.69, gk); G = lerp(G, 0.64, gk); B = lerp(B, 0.5, gk);
    R = lerp(R, 0.52, sh * 0.6); G = lerp(G, 0.52, sh * 0.6); B = lerp(B, 0.35, sh * 0.6);
    R = lerp(R, 0.68, se * 0.5); G = lerp(G, 0.65, se * 0.5); B = lerp(B, 0.6, se * 0.5);
    const sn = caSnow(x, z, A, ny, sz); R = lerp(R, CA_SNC[0], sn); G = lerp(G, CA_SNC[1], sn); B = lerp(B, CA_SNC[2], sn);
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.45 * (1 - sn); R = lerp(R, 0.6, t); G = lerp(G, 0.57, t); B = lerp(B, 0.52, t); }
    CACOL[0] = R; CACOL[1] = G; CACOL[2] = B; return CACOL;
  }
  function caGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in caTileGeo)
    const G = API.VR.G, gx = clamp((x - G.x0) / API.VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / API.VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * API.VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * API.VRC), l = Math.hypot(nx, 1, nz), c = (API.VR.col || caCol)(G.x0 + ii * API.VRC, G.z0 + jj * API.VRC, h, 1 / l, nz / l, G.dd[jj * G.nx + ii], nx / l);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function caTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells, in the haze); round the finish wider (the Laguna del Inca)
    const G = API.VR.G, L = API.VRC * API.VRT, x = G.x0 + (ti + 0.5) * L, z = G.z0 + (tj + 0.5) * L, d = API.vrDist(x, z), f = API.VR.fin, df = Math.hypot(x - f[0], z - f[1]);
    return d < 300 ? 1 : d < 430 || df < 560 ? 2 : 0;
  }
  function caTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as vrTileGeo, coloured by caCol (or the road's own, VR.col: the Moki Dugway's)
    const G = API.VR.G, m = API.VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * API.VRT, j0 = tj * API.VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * API.VRC, z = G.z0 + j * API.VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * API.VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * API.VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = (API.VR.col || caCol)(x, z, h, ny, nz, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)], nx); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
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
  let caATex = null, caAKey = '', caA2Tex = null, caA2Key = '';   // (the board atlases, made once and reused by every build of the road)
  function caAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): LARGADA (the start), META (the finish), CP1-CP4 with the altitude, the Portillo sign, the race's banner
    const key = cps.join('|') + '|' + finA; if (caATex && caAKey === key) return caATex;
    if (caATex) caATex.dispose(); caAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('LARGADA', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(312, 142, 400, 100); txt('META', 512, 196, 96, '#111', 380);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#1e5c9a'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#5a3a22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#efe3c8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('PORTILLO', 512, 812, 58, '#f3ead6', 900); txt(finA, 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#f2f2ee'; x.fillRect(0, 896, 1024, 64); x.fillStyle = '#d52b1e'; x.fillRect(0, 960, 1024, 64); x.fillStyle = '#0039a6'; x.fillRect(0, 896, 128, 64);   // (the Chilean flag's colours)
    x.fillStyle = '#fff'; x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 9 : 22; x.lineTo(64 + Math.cos(a) * rr, 928 + Math.sin(a) * rr); } x.fill();
    txt('SUBIDA LOS CARACOLES', 576, 930, 54, '#16181c', 860); txt('29 CURVAS · RUTA 60', 512, 994, 44, '#fff', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (caATex = t);
  }
  const CA_BOARDS = [['PORTILLO', '#1d4f9a'], ['LAGUNA DEL INCA', '#1d4f9a'], ['PASO LOS LIBERTADORES', '#1f6b3a'], ['HOTEL', '#7a2a1c'], ['RÍO JUNCALILLO', '#1d4f9a'], ['MIRADOR LOS CARACOLES', '#6b4a22'], ['ZONA DE AVALANCHAS', '#e2b21a'], ['ARGENTINA  →', '#1f6b3a']];
  function caAtlas2(curves) {   // the small signs: rows 0-3, the curves' numbers (8 a row, 128 x 128: a white board, CURVA and the number, as on the real road) and two chevrons;
    // rows 4-7, the place boards (two a row, 512 x 128)
    const key = curves.length; if (caA2Tex && caA2Key === key) return caA2Tex;
    if (caA2Tex) caA2Tex.dispose(); caA2Key = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w, wt) => { x.fillStyle = col; x.font = (wt || 900) + ' ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    curves.forEach((cv, k) => { const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128;
      x.fillStyle = '#16181c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f6f5f0'; x.fillRect(x0 + 7, y0 + 7, 114, 114);
      txt('CURVA', x0 + 64, y0 + 30, 24, '#16181c', 108, 700); txt(String(k + 1), x0 + 64, y0 + 80, 64, '#16181c', 110); });
    for (const [k, dir] of [[30, 1], [31, -1]]) {   // the chevrons: black arrows on yellow, pointing the way the road turns
      const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128; x.fillStyle = '#f1c21b'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#16181c';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    CA_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, warn = bg === '#e2b21a';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = warn ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, 54, warn ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (caA2Tex = t);
  }
  function caPlantGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 a tuft of bunch grass (coirón), 1 a low Andean shrub, 2 a cushion plant
    // (llareta: a hard green mound on the rocks), 3 a boulder half sunk in the scree, 4 a few stones of the scree
    const g = new GB(), R = rng(740 + kind), rs = API.ROCK_SMOOTH;
    if (kind === 0) {   // seven blades from a tight base, leaning out, straw with green-grey hearts
      const base = [0.62, 0.6, 0.36], tip = [0.95, 0.86, 0.56];
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.6, lean = 0.22 + R() * 0.2, hh = 0.75 + R() * 0.25, bx = Math.cos(a) * 0.05, bz = Math.sin(a) * 0.05, tx = Math.cos(a) * lean, tz = Math.sin(a) * lean, ox = -Math.sin(a) * 0.07, oz = Math.cos(a) * 0.07;
        g.triO([bx - ox, 0, bz - oz], [bx + ox, 0, bz + oz], [tx, hh, tz], base, [tx * 0.5, hh * 0.2, tz * 0.5], base, tip); g.triO([bx - ox, 0, bz - oz], [tx, hh, tz], [bx + ox, 0, bz + oz], base, [-tx, hh * 0.4, -tz], tip, base); }
    } else if (kind === 1) {   // three soft grey-olive lumps
      API.ROCK_SMOOTH = true; const col = [0.46, 0.47, 0.32];
      ico(g, 0, 0.45, 0, 0.42, 0.9, col, R, 0.3); ico(g, 0.3, 0.32, 0.14, 0.3, 0.85, [col[0] * 0.92, col[1] * 0.95, col[2] * 0.9], R, 0.35); ico(g, -0.26, 0.3, -0.16, 0.3, 0.85, [col[0] * 1.08, col[1] * 1.06, col[2]], R, 0.35);
    } else if (kind === 2) {   // a flat, deep olive-green dome, lumpy
      API.ROCK_SMOOTH = true; ico(g, 0, 0.33, 0, 0.5, 0.72, [0.31, 0.37, 0.16], R, 0.2); ico(g, 0.24, 0.27, 0.1, 0.3, 0.7, [0.29, 0.35, 0.15], R, 0.22); ico(g, -0.2, 0.25, -0.16, 0.26, 0.66, [0.35, 0.41, 0.19], R, 0.22);
    } else if (kind === 3) { API.ROCK_SMOOTH = false; rock(g, 0, 0.3, 0, 0.6, 0.62, 0.5, 0, [0.66, 0.6, 0.53], R, 0.3); }
    else {   // three stones of the scree, sunk in it (the unit about a metre across; 15 faces each, the foot darker, the top lit): grey, rust, dark
      const C = [[0.64, 0.6, 0.55], [0.63, 0.52, 0.45], [0.5, 0.48, 0.47]];
      for (let k = 0; k < 3; k++) {
        const a0 = R() * TAU, d = k ? 0.22 + R() * 0.28 : 0, cx = Math.cos(a0) * d, cz = Math.sin(a0) * d, rx = k ? 0.09 + R() * 0.08 : 0.15 + R() * 0.07, ry = rx * (0.55 + R() * 0.35), t = 0.9 + R() * 0.2;
        const col = C[Math.floor(R() * 3)].map(v => v * t), lo = col.map(v => v * 0.68), hi = col.map(v => v * 1.14), B = [], M = [], top = [cx + (R() - 0.5) * rx * 0.4, ry, cz + (R() - 0.5) * rx * 0.4], inn = [cx, ry * 0.2, cz];
        for (let q = 0; q < 5; q++) { const a = (q + (R() - 0.5) * 0.6) / 5 * TAU, f = 0.8 + R() * 0.4; B.push([cx + Math.cos(a) * rx * f, -ry * 0.25, cz + Math.sin(a) * rx * f]); M.push([cx + Math.cos(a) * rx * f * 0.85, ry * 0.45, cz + Math.sin(a) * rx * f * 0.85]); }
        for (let q = 0; q < 5; q++) { const j = (q + 1) % 5; g.quadO(B[q], B[j], M[j], M[q], col, inn, null, [lo, lo, col, col]); g.triO(M[q], M[j], top, col, inn, col, hi); }
      }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // a truck (a tractor and its semi-trailer, 16.5 m; x along it, the cab at +x): for the queues at the closed road (scenery)
  function caTruck(g, x, y, z, rot, cab, box_, tarp) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (u, v) => [x + c * u - s * v, z + s * u + c * v], K = [0.07, 0.07, 0.08], S = [0.55, 0.56, 0.58];
    { const [px, pz] = P(6.6, 0); box(g, px, y + 1.0, pz, 2.4, 2.1, 2.5, rot, cab, null, true); box(g, px - c * 0.3, y + 3.1, pz - s * 0.3, 1.8, 0.7, 2.4, rot, cab, null, true);   // the cab and its sleeper roof
      const [wx, wz] = P(7.82, 0); box(g, wx, y + 1.95, wz, 0.06, 0.95, 2.2, rot, [0.14, 0.18, 0.22], null, true); box(g, wx, y + 0.55, wz, 0.1, 0.45, 2.3, rot, [0.75, 0.76, 0.78], null, true); }   // windscreen, grille
    { const [px, pz] = P(5.0, 0); box(g, px, y + 0.6, pz, 1.4, 0.35, 2.3, rot, K, null, true); }   // (the chassis behind the cab)
    { const [px, pz] = P(-1.4, 0); box(g, px, y + 1.25, pz, 13.4, 2.75, 2.5, rot, box_, tarp || box_, true); box(g, px, y + 0.95, pz, 13.4, 0.3, 2.46, rot, K, null, true); }   // the trailer
    for (const u of [6.8, 4.6, 3.3, -5.4, -6.7, -8.0]) for (const v of [-1.05, 1.05]) { const [px, pz] = P(u, v); box(g, px, y, pz, 1.0, 1.0, 0.45, rot, K, null, true); }
    for (const v of [-1.3, 1.3]) { const [px, pz] = P(7.5, v); box(g, px, y + 2.2, pz, 0.1, 0.35, 0.22, rot, S, null, true); }   // mirrors
  }
  // the parked cars of the car parks (as Vršič's)
  function caCar(g, x, y, z, rot, col) {
    const c = Math.cos(rot), s = Math.sin(rot);
    box(g, x, y + 0.25, z, 4.3, 0.8, 1.85, rot, col, null, true); box(g, x - c * 0.35, y + 1.05, z - s * 0.35, 2.3, 0.62, 1.62, rot, [0.16, 0.2, 0.26], col, true);
    for (const [a, b] of [[1.35, 0.8], [1.35, -0.8], [-1.35, 0.8], [-1.35, -0.8]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.66, 0.66, 0.24, rot, [0.08, 0.08, 0.09], null, true);
  }
  // the knockable roadside posts: white with a black top, the tall orange snow poles from Portillo's height on (col 1)
  function caProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30, alt = (i) => T.hy[i] + API.VR.D.base;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: (i) => (alt(i) > 2760 ? 1 : 0), exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }
  // an Andean condor (x forward, wingspan ~3.6 m): the black body, the white ruff round the neck, the bare grey head, broad black wings with the
  // white band on top and the spread primaries at their tips, held flat with a little dihedral (it soars, it hardly ever flaps), a short tail
  function caCondorGeo() {
    const g = new GB(), K = [0.07, 0.07, 0.08], Wh = [0.92, 0.92, 0.9], Hd = [0.62, 0.5, 0.48], R = rng(2981);
    API.ROCK_SMOOTH = true; ico(g, 0, 0, 0, 0.32, 0.5, K, R, 0.1); API.ROCK_SMOOTH = false;
    box(g, 0.32, -0.07, 0, 0.36, 0.2, 0.3, 0, K); cyl(g, 0.52, -0.08, 0, 0.11, 0.12, 6, Wh); box(g, 0.66, -0.06, 0, 0.2, 0.13, 0.12, 0, Hd);   // body, the ruff, the head
    for (const sd of [-1, 1]) {
      const r0 = 0.18 * sd, r1 = 1.75 * sd, y1 = 0.16, A = [0.2, 0, r0], B = [-0.32, 0, r0], C = [-0.24, y1, r1], D = [0.26, y1, r1 * 0.98];
      g.quadO(A, B, C, D, K, [0, -1, sd * 0.9]); g.quadO(A, B, C, D, K, [0, 1, sd * 0.9]);   // the wing, both faces
      g.quadO([-0.02, 0.012, r0 * 1.4], [-0.3, 0.012, r0 * 1.4], [-0.24, y1 + 0.012, r1 * 0.8], [-0.02, y1 + 0.012, r1 * 0.8], Wh, [0, -1, sd * 0.8]);   // the white band on top
      for (let k = 0; k < 4; k++) { const z = r1 * (1.02 + k * 0.035), x = 0.2 - k * 0.14; g.triO([x, y1, r1 * 0.97], [x - 0.12, y1, r1 * 0.97], [x - 0.02, y1 + 0.04, z + 0.28 * sd], K, [x, y1 - 1, r1]); }   // the primaries
    }
    g.triO([-0.3, 0, -0.16], [-0.3, 0, 0.16], [-0.72, 0.02, 0], K, [-0.4, -1, 0]); g.triO([-0.3, 0, -0.16], [-0.72, 0.02, 0], [-0.3, 0, 0.16], K, [-0.4, 1, 0]);   // the tail
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function caCondors(C, t, car) {   // the condors circle on a thermal; once the followed car is 260 m away from it, they find the next one 160 m ahead of the
    // car (out of the camera's view), so the car comes up under them; no car: over the start, posed by t alone
    if (car) { const dx = car.x - C.ax, dz = car.z - C.az; if (dx * dx + dz * dz > 260 * 260 || C.t == null) { const h = car.h || 0; C.ax = car.x + Math.cos(h) * 160; C.az = car.z + Math.sin(h) * 160; C.ay = car.roadY || 0; } }
    else { C.ax = C.x0; C.az = C.z0; C.ay = C.y0; }
    C.t = t;
    for (const b of C.L) {
      const a = b.ph + t * b.sp, cx = C.ax + b.ox, cz = C.az + b.oz, m = b.m;
      m.position.set(cx + Math.cos(a) * b.r, C.ay + b.h + Math.sin(t * 0.21 + b.ph) * 5, cz + Math.sin(a) * b.r);
      m.rotation.set(-b.bank * Math.sign(b.sp), -(a + Math.sign(b.sp) * Math.PI / 2), 0, 'YXZ');
    }
  }
  function buildCaracoles(scene, tex, opts) {
    const R = rng(2911), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.76, 0.69, 0.6] };
    API.vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(711, 150); P.c2 = valueNoise2(712, 64); P.c3 = valueNoise2(713, 210); P.c4 = valueNoise2(714, 120); P.c5 = valueNoise2(715, 26);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the galleries ([from, to, the mountain's side], metres after the start line) per sample
    const galAt = new Int8Array(N), GAL = (def.galleries || []).map(([a, b, sd]) => ({ s0: sStart + a, s1: sStart + b, sd }));
    for (const G of GAL) for (let s = G.s0; s <= G.s1; s += T.ds / 2) galAt[T.idx(s)] = G.sd;
    // the buildings (def.bld [x, z, length, width, angle, height, kind, name]: kind 0 a building, 1 the hotel, 3 a shed): clear of the road and the
    // lakes; the big unnamed blocks cut down to a size that reads as one building; the named ones get a level plot
    const blds = [];
    for (const b of def.bld || []) {
      let [x, z, L, W, ang, hgt, kind, name] = b; name = name || '';
      if (!name) { L = Math.min(L, 48); W = Math.min(W, 26); }
      if (L < 2.5 || W < 2.5) continue;
      const c = Math.cos(ang), s = Math.sin(ang), clear = () => { for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const px = x + c * u - s * v, pz = z + s * u + c * v, n = API.vrNear(px, pz);
        if ((n.i >= 0 && n.dd < 1.5) || API.vrWater(px, pz).e > -2) return false; } return true; };
      if (clear()) blds.push({ x, z, L, W, ang, hgt, kind, name });
    }
    for (const b of blds) if (b.name) { b.pad = { x: b.x, z: b.z, r: Math.hypot(b.L, b.W) / 2 + 2, b: 14, h: caH(b.x, b.z) }; P.pads.push(b.pad); }
    // the car parks: at the finish (beside the road past the line, on the side where the ground lies nearer the road's height) and by the start
    // (the trucks held at the closed road)
    const padBeside = (s, off, r) => { const i = T.idx(s), gd = (sd) => Math.abs(API.vrFar(T.px[i] + T.nx[i] * sd * (off + r), T.pz[i] + T.nz[i] * sd * (off + r)) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 16, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 60, 0, 16); P.pads.push(padF);
    const padS = padBeside(sStart - 70, 0, 13); P.pads.push(padS);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the buildings and boulders between the camera and the car fade out)
    const matV = API.ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the boulders, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    API.stubExcl(exclPush);   // (nothing grows or stands on the side roads)
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + (b.name ? 8 : 2.5));
    out.marks = {};   // (where the landmarks stand: the tests look for them)
    for (const b of blds) if (b.name) out.marks[b.name] = [b.x, b.z];
    exclPush(padF.x, padF.z, padF.r + 4); exclPush(padS.x, padS.z, padS.r + 4);

    /* ---- terrain tiles, the lakes (the Laguna del Inca's emerald water, two greener ponds by the river) ---- */
    let nFar = 0;
    const tMat = API.pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: API.vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(caTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 60, specular: 0x2a3a44 });   // (the high sun: a brighter glint than Vršič's)
      for (const L of P.lakes) {   // a 4 m grid near the road, 8 m farther out, only where the corridor is built
        const big = L.area > 50000, deep = big ? [0.04, 0.26, 0.32] : [0.12, 0.26, 0.2], shal = big ? [0.24, 0.58, 0.54] : [0.36, 0.5, 0.36], sky = [0.5, 0.64, 0.76];
        const g = new GB(true), uv = (q) => [q[0] / 14, -q[2] / 14], cc = new Map();
        const wc = (x, z) => { const key = Math.round(x) + ',' + Math.round(z); let c = cc.get(key); if (c) return c;
          const e = API.vrWater(x, z).e, ks = 0.4 * sstep(0.55, 0.8, P.n2(x * 2.2, z * 2.2)); c = [0, 1, 2].map(k => lerp(lerp(shal[k], deep[k], sstep(2, big ? 40 : 14, e)), sky[k], ks)); cc.set(key, c); return c; };
        for (let z0 = Math.floor((L.z0 - 8) / 8) * 8; z0 < L.z1 + 8; z0 += 8) for (let x0 = Math.floor((L.x0 - 8) / 8) * 8; x0 < L.x1 + 8; x0 += 8) {
          const d = API.vrDist(x0 + 4, z0 + 4); if (d > 600) continue;
          const cs = d < 320 ? 4 : 8;
          for (let zz = z0; zz < z0 + 8; zz += cs) for (let xx = x0; xx < x0 + 8; xx += cs) {
            if (!(caGround(xx, zz) < L.h + 0.4 || caGround(xx + cs, zz) < L.h + 0.4 || caGround(xx, zz + cs) < L.h + 0.4 || caGround(xx + cs, zz + cs) < L.h + 0.4)) continue;
            const A = [xx, L.h, zz], B = [xx + cs, L.h, zz], C = [xx + cs, L.h, zz + cs], D = [xx, L.h, zz + cs];
            g.quadUp(A, B, C, D, [wc(A[0], A[2]), wc(B[0], B[2]), wc(C[0], C[2]), wc(D[0], D[2])], [uv(A), uv(B), uv(C), uv(D)]); }
        }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); }
      }
      for (const b of P.gul) {   // the Juncalillo in its bed under the bridge: a strip of water along the gully, out to 55 m either side
        const g = new GB(true), cw = [0.3, 0.46, 0.44], hw = Math.min(2.4, b.bw * 0.4), y = b.y + 0.35;
        for (let a = -56; a < 56; a += 4) { const P0 = (q, o) => [b.x + b.nx * q + b.tx * o, y, b.z + b.nz * q + b.tz * o];
          g.quadUp(P0(a, -hw), P0(a, hw), P0(a + 4, hw), P0(a + 4, -hw), [cw, cw, cw, cw], [[a / 14, 0], [a / 14, 0.3], [(a + 4) / 14, 0.3], [(a + 4) / 14, 0]]); }
        const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); out.dyn.water = tex.water; }
      if (P.lakes.length) out.dyn.water = tex.water;
    }

    /* ---- the road: asphalt with white edge lines and a double yellow centre line (no overtaking up the curves), a gravel shoulder, then the verge
       out to a ditch past the barrier line, up or down onto the ground; on the bridge the deck out to its parapets, in a gallery its concrete floor
       out to the walls (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const onBr = new Uint8Array(N), sw = 0.6;
    for (const [a, b] of def.bridges || []) for (let s = sStart + a - 3; s <= sStart + b + 3; s += T.ds / 2) onBr[T.idx(s)] = 1;
    const altAt = (i) => T.hy[i] + base;
    const SB = API.stubGeo({ gCol: caGCol, paveC: [0.8, 0.8, 0.81], gravC: [0.7, 0.62, 0.52], shC: [0.66, 0.6, 0.52], line: 'solid' });   // the side roads (their mouths; their surfaces in the road's chunks below)
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      if (onBr[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];
      const ms = API.stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;   // (a side road's mouth: no ditch, the verge at its surface)
      if (galAt[i]) return [[e + sw, -0.02], [bar - 0.3, -0.02], [bar + 0.2, 0.18], [bar + 0.5, 0.2], [bar + 0.9, 0.2]];   // (a gallery: a concrete kerb along its walls)
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.86 - 0.13 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; if (galAt[i]) k *= 0.92; return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], ylw = [0.96, 0.76, 0.16], gc = [0.82, 0.77, 0.7], deck = [0.64, 0.63, 0.6], conc = [0.62, 0.61, 0.58];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return k < 3 ? deck : [0.52, 0.51, 0.49];
          if (galAt[i]) return k < 2 ? [0.56, 0.55, 0.52] : conc;
          const wl = vp[si][i][2][1] < -2.6; if (wl && (k === 1 || k === 2)) { const q = 0.92 + 0.12 * rpHash(i >> 2, 41 + si); return k === 1 ? [0.7 * q, 0.69 * q, 0.65 * q] : [0.52 * q, 0.5 * q, 0.47 * q]; }   // (the retaining wall's coping, its weathered foot)
          if (k === 4) return caGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return caCol(x, z, T.hy[i] + y, 1 / l, 0, Math.max(0, o - bar)).slice(); })); } return a; });
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
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], sc = onBr[i] ? deck : galAt[i] ? [0.56, 0.55, 0.52] : gc;
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [sc, sc, sc, sc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6)) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face: out, towards the leg below)
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
    const scen = new Chunks(110), fac = new Chunks(110, true), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (fac: the walls with windows; ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.84, 0.12, 0.12], [0.95, 0.95, 0.95], [0.1, 0.24, 0.66], [0.46, 0.7, 0.92], [0.95, 0.95, 0.95], [0.96, 0.78, 0.18], [0.84, 0.12, 0.12], [0.12, 0.14, 0.2], [0.2, 0.55, 0.32], [1, 0.55, 0.1]];   // (Chile's red, white and blue, Argentina's sky blue)
    const CR = crowdCtx({ gH: caGround, near: (x, z) => API.vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => API.vrWater(x, z).e > -4, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a place board of the second atlas: [v0, v1, u0, u1]
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const flagCL = (g, x, y, z, rot, h) => {   // a pole with the Chilean flag: white over red, the blue canton with its white star (both faces)
      cyl(g, x, y - 0.2, z, 0.06, h + 0.2, 5, [0.94, 0.94, 0.92], [0.9, 0.78, 0.2]);
      const c = Math.cos(rot), s = Math.sin(rot), fw = 1.8, fh = 1.2, at = (u) => [x + c * (u + 0.06), z + s * (u + 0.06)], y0 = y + h - fh - 0.15;
      { const [fx, fz] = at(fw / 2); box(g, fx, y0, fz, fw, fh / 2, 0.04, rot, [0.84, 0.13, 0.12]); }
      { const [fx, fz] = at(fw / 3 + fw / 3); box(g, fx, y0 + fh / 2, fz, fw * 2 / 3, fh / 2, 0.04, rot, [0.96, 0.96, 0.95]); }
      { const [fx, fz] = at(fw / 6); box(g, fx, y0 + fh / 2, fz, fw / 3, fh / 2, 0.04, rot, [0.04, 0.22, 0.65]); box(g, fx, y0 + fh * 0.7, fz, 0.16, 0.16, 0.06, rot, [0.98, 0.98, 0.98]); }
    };
    const truckCols = [[0.85, 0.85, 0.83], [0.72, 0.12, 0.1], [0.12, 0.28, 0.6], [0.9, 0.62, 0.12], [0.16, 0.16, 0.18], [0.24, 0.45, 0.28], [0.95, 0.95, 0.94]];
    const trailerCols = [[0.86, 0.86, 0.84], [0.74, 0.74, 0.72], [0.22, 0.32, 0.5], [0.55, 0.15, 0.12], [0.88, 0.88, 0.86], [0.3, 0.42, 0.3]];

    /* ---- the buildings: the yellow Hotel Portillo by the lake, the Octagon, the lodges, staff houses and ski huts of Portillo (plastered walls with
       windows, metal roofs in red oxide, green or grey), corrugated sheds, the road camp by the river ---- */
    let nBld = 0;
    {
      const RB = rng(2921), walls = [[0.95, 0.94, 0.9], [0.93, 0.88, 0.76], [0.92, 0.92, 0.9], [0.86, 0.72, 0.52], [0.94, 0.9, 0.82]], roofs = [[0.52, 0.2, 0.14], [0.26, 0.4, 0.3], [0.42, 0.44, 0.46], [0.6, 0.24, 0.16], [0.3, 0.32, 0.36]], woods = [[0.42, 0.28, 0.16], [0.5, 0.34, 0.2], [0.36, 0.24, 0.15]];
      const lowHigh = (b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9; for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = caGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
      for (const b of blds) {
        const g = scen.get(b.x, b.z), [lo, hi] = lowHigh(b), y = b.pad ? b.pad.h : hi;
        if (b.name === 'Hotel Portillo') {   // the long yellow block (five storeys on a stone plinth), white bands between the floors, a dark low roof, a wing at the back
          const c = Math.cos(b.ang), s = Math.sin(b.ang), F = fac.get(b.x, b.z), yel = [1.1, 0.84, 0.27], fl = 5, H = fl * 3.1, yb = y + 0.4, lk = P.lakes.reduce((a, q) => (!a || q.area > a.area ? q : a), null);
          const fs = lk && (lk.cx - b.x) * -s + (lk.cz - b.z) * c < 0 ? -1 : 1, fx = -s * fs, fz = c * fs;   // (fx, fz: out of the long side that looks at the lake)
          box(g, b.x, lo - 0.5, b.z, b.L + 0.4, yb - lo + 0.5, b.W + 0.4, b.ang, [0.52, 0.5, 0.47], null, true);
          const cs = [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2]], Q = (u, v, yy) => [b.x + c * u - s * v, yy, b.z + s * u + c * v];
          for (let e = 0; e < 4; e++) { const [u0, v0] = cs[e], [u1, v1] = cs[(e + 1) % 4], bays = Math.max(1, Math.round(Math.hypot(u1 - u0, v1 - v0) / 3.2));
            F.quadO(Q(u0, v0, yb), Q(u1, v1, yb), Q(u1, v1, yb + H), Q(u0, v0, yb + H), yel, [b.x, yb + H / 2, b.z], [[0, 0], [bays, 0], [bays, fl], [0, fl]]); }
          for (let k = 1; k <= fl; k++) box(g, b.x, yb + k * 3.1 - 0.2, b.z, b.L + 0.24, 0.22, b.W + 0.24, b.ang, [0.96, 0.95, 0.92], null, true);
          gable(g, b.x, yb + H + 0.1, b.z, b.L + 1.2, b.W + 1.4, b.W * 0.18, b.ang, [0.24, 0.26, 0.3], yel);
          { const kx = b.x - fx * (b.W * 0.5 + 6), kz = b.z - fz * (b.W * 0.5 + 6), kL = b.L * 0.4, kW = 12, kH = 2 * 3.1, Qk = (u, v, yy) => [kx + c * u - s * v, yy, kz + s * u + c * v], kc = [[-kL / 2, -kW / 2], [kL / 2, -kW / 2], [kL / 2, kW / 2], [-kL / 2, kW / 2]];   // the wing at the back: two storeys, a flat roof
            box(g, kx, lo - 0.3, kz, kL + 0.3, yb - lo + 0.3, kW + 0.3, b.ang, [0.52, 0.5, 0.47], null, true);
            for (let e = 0; e < 4; e++) { const [u0, v0] = kc[e], [u1, v1] = kc[(e + 1) % 4], bays = Math.max(1, Math.round(Math.hypot(u1 - u0, v1 - v0) / 3.2)); F.quadO(Qk(u0, v0, yb), Qk(u1, v1, yb), Qk(u1, v1, yb + kH), Qk(u0, v0, yb + kH), yel, [kx, yb + kH / 2, kz], [[0, 0], [bays, 0], [bays, 2], [0, 2]]); }
            box(g, kx, yb + kH, kz, kL + 0.4, 0.5, kW + 0.4, b.ang, [0.96, 0.95, 0.92], [0.3, 0.3, 0.33], true); }
          { const [bv0, bv1, bu0, bu1] = board(3); bannerQ(b.x + fx * (b.W / 2 + 0.3), yb + H - 2.4, b.z + fz * (b.W / 2 + 0.3), fx, fz, 9, 2.2, bv0, bv1, bu0, bu1, ban2); }   // its name on the lake's side
        } else if (b.name.startsWith('Oct')) {   // the Octagon: eight sides of stone and timber under a pointed roof
          const r = Math.max(5, Math.min(b.L, b.W) / 2); cyl(g, b.x, lo - 0.4, b.z, r, y - lo + 3.4, 8, [0.6, 0.58, 0.54]); cyl(g, b.x, y + 3.0, b.z, r * 0.98, 3.2, 8, [0.5, 0.34, 0.2]);
          cone(g, b.x, y + 6.2, b.z, r * 1.12, r * 0.7, 8, [0.26, 0.28, 0.3], [0.26, 0.28, 0.3], PI / 8);
        } else if (b.kind === 3) {   // a corrugated metal shed on a concrete base
          const mc = vary([[0.66, 0.68, 0.7], [0.62, 0.32, 0.22], [0.42, 0.5, 0.42]][Math.floor(RB() * 3)], RB, 0.12);
          box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 0.3 + 2.5, b.W, b.ang, mc, null, true); gable(g, b.x, hi + 2.2, b.z, b.L + 0.5, b.W + 0.5, Math.min(b.L, b.W) * 0.14, b.ang, vary(mc, RB, 0.15), mc);
        } else {   // a lodge, staff house or ski hut: 1-3 storeys
          const fl = b.L * b.W > 600 ? 3 : b.L * b.W > 160 ? 2 : 1;
          API.vrHouse(g, fac.get(b.x, b.z), b.x, lo, hi, b.z, b.ang, b.L, b.W, fl, { wall: walls[Math.floor(RB() * walls.length)], wood: vary(woods[Math.floor(RB() * 3)], RB, 0.1), roof: vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1) });
        }
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang);
        nBld++;
      }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- LARGADA (the start, by the river): gantry with the start lights, the timing hut, Chilean flags along the grid, the road closed behind it;
       the trucks held back at the closure in the lay-by beside the road ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z);
      box(g, x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.92, 0.9, 0.84], [0.5, 0.3, 0.2], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.1, T.hd[i], [0.6, 0.24, 0.16], [0.92, 0.9, 0.84]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      for (let s = 8; s < sStart + 50; s += 12) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3); if (excluded(px, pz) && s > sStart - 8) continue; flagCL(scen.get(px, pz), px, caGround(px, pz), pz, T.hd[ii], 6); }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
      const hh = T.hd[padS.i], c = Math.cos(hh), sn = Math.sin(hh), RT = rng(2931);   // the trucks in the lay-by, side by side
      for (let k = 0; k < 3; k++) { const b = (k - 1) * 4.2, px = padS.x - sn * b, pz = padS.z + c * b; if (API.vrNear(px, pz).dd < 1.5) continue;
        caTruck(scen.get(px, pz), px, caGround(px, pz), pz, hh, truckCols[Math.floor(RT() * truckCols.length)], trailerCols[Math.floor(RT() * trailerCols.length)]); }
      for (let k = 0; k < 6; k++) { const px = padS.x + (R() - 0.5) * 16, pz = padS.z + (R() - 0.5) * 16; if (API.vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
    }

    /* ---- the checkpoints: a blue gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.1, 0.3, 0.55]));

    /* ---- META (Portillo): chequered gantry and flags, the Portillo sign on a stone plinth, the blue board to the border, the car park (cars, the trucks
       and coaches waiting for the road to open), the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4), py = caGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 18, sdP, 3.2), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the Portillo sign: a board on posts leaning back, facing the arriving cars
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.36, 0.24, 0.14]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.62, 0.6, 0.56], [0.7, 0.68, 0.64]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 5);
      { const [bx, bz, bi] = onSide(sFin + 110, -sdP, 1.5), by = caGround(bx, bz), gb = scen.get(bx, bz);   // the blue board: the pass and Argentina ahead
        for (const o of [-1.5, 1.5]) box(gb, bx + T.nx[bi] * o, by - 0.2, bz + T.nz[bi] * o, 0.12, 3.6, 0.12, T.hd[bi], [0.6, 0.61, 0.63]);
        for (const [k, yy] of [[2, 2.9], [7, 2.1]]) { const [v0, v1, u0, u1] = board(k); bannerQ(bx, by + yy, bz, -T.tx[bi], -T.tz[bi], 3.6, 0.9, v0, v1, u0, u1, ban2); }
        exclPush(bx, bz, 2.5); }
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh), RT = rng(2941);
      for (let k = 0; k < 10; k++) { const a = -14 + (k % 5) * 7, b = (k < 5 ? -5 : 5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (API.vrNear(px, pz).dd < 1.5) continue;
        if (k === 4 || k === 9) caTruck(scen.get(px, pz), px, caGround(px, pz), pz, hh, truckCols[Math.floor(RT() * truckCols.length)], trailerCols[Math.floor(RT() * trailerCols.length)]);
        else if (k < 4 || k > 5) caCar(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(fans[(k * 3) % fans.length], R, 0.2)); }
      for (let k = 0; k < 20; k++) { const px = padF.x + (R() - 0.5) * 26, pz = padF.z + (R() - 0.5) * 26; if (API.vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road towards the border: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const RT2 = rng(2951);   // and the queue of trucks waiting behind the blocks on the shoulder, nose to tail
        for (let k = 0; k < 4; k++) { const s = T.len - 24 - k * 19, i = T.idx(s), o = (T.br[i] + 3.2), px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o; if (API.vrNear(px, pz).dd < 1.2 || excluded(px, pz)) continue;
          caTruck(scen.get(px, pz), px, caGround(px, pz), pz, T.hd[i] + PI, truckCols[Math.floor(RT2() * truckCols.length)], trailerCols[Math.floor(RT2() * trailerCols.length)]); exclPush(px, pz, 9); } }
    }

    /* ---- the two avalanche galleries over the road: a concrete wall against the mountain, the roof on a row of pillars on the valley side with a low
       parapet between them, portal frames at both ends; the roof covered in scree. The roof, the pillars and the portals fade while the followed car
       is inside (dyn.tunnel: its ranges) ---- */
    const galG = new GB(), galRanges = [];
    {
      const conc = [0.66, 0.65, 0.61], concD = [0.5, 0.49, 0.47], top = [0.6, 0.53, 0.46], H = 6.4, th = 0.9;
      for (const G of GAL) {
        galRanges.push([G.s0, G.s1]);
        const i0 = T.idx(G.s0), i1 = T.idx(G.s1), msd = G.sd, Q = (i, side, o, y) => { const bar = side > 0 ? T.br[i] : T.bl[i], d = side * (bar + o); return [T.px[i] + T.nx[i] * d, T.hy[i] + y, T.pz[i] + T.nz[i] * d]; };
        for (let i = i0; i < i1; i++) {
          const j = i + 1, g = scen.get(T.px[i], T.pz[i]), inn = [T.px[i], T.hy[i] + H / 2, T.pz[i]];
          // the wall against the mountain (opaque: it stays) and its inner face
          g.quadO(Q(i, msd, 0.1, -0.3), Q(j, msd, 0.1, -0.3), Q(j, msd, 0.1, H), Q(i, msd, 0.1, H), conc, Q(i, msd, 3, H / 2));
          // the roof: its underside, its top (scree on it), its valley edge
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
          const [v0, v1, u0, u1] = board(6), sp = Q(T.idx(ie * T.ds - 40 * (ie === i0 ? 1 : -1)), 1, 1.2, 0), py = caGround(sp[0], sp[2]);   // ZONA DE AVALANCHAS before it
          if (ie === i0) { box(scen.get(sp[0], sp[2]), sp[0], py - 0.2, sp[2], 0.1, 2.4, 0.1, T.hd[ie], [0.6, 0.61, 0.63]); bannerQ(sp[0], py + 1.6, sp[2], -T.tx[ie], -T.tz[ie], 2.8, 0.7, v0, v1, u0, u1, ban2); exclPush(sp[0], sp[2], 1.5); }
        }
        for (let i = i0; i <= i1; i += 3) { const p = Q(i, msd, -T.w, 0); exclPush(p[0], p[2], T.w + 3); }   // (nothing grows or lies inside it)
      }
      if (!galG.empty) {
        const gm = new THREE.MeshLambertMaterial({ vertexColors: true }), m = new THREE.Mesh(galG.geometry(), gm); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
        out.dyn.tunnel = { mat: gm, s0: galRanges[0][0], s1: galRanges[galRanges.length - 1][1], ranges: galRanges };   // (Render: the roof fades while the followed car is inside one; Sfx: the engine rings)
      }
    }

    /* ---- guardrails where the ground falls away and round the outside of the bends (not in the galleries, on the bridge a concrete parapet),
       chevrons on the outside of every hairpin; a marker post every ~50 m where there is neither (knockable where it fits: caProps) ---- */
    /* ---- the side roads' cones across their mouths, the rails and gates at their ends, the streets' names (stubProps) ---- */
    out.stubStats = API.stubProps({ scen, out, root, gH: caGround, loc: { closed: 'CAMINO CERRADO', gate: 'CERRADO' }, posts: 'none' });
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
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || onBr[i] || galAt[i]) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        API.stubRails(nd, side);   // (open across the side roads' mouths)
        for (let i = 0; i < N; i++) if (galAt[i]) nd[i] = 0;
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
          } else if (!nd[i] && !onBr[i] && !galAt[i] && i % 25 === 0 && i > 2 && i < iE - 2 && !SB.mouthV[side > 0 ? 1 : 0][i]) mkPosts.push([i, side]);
        }
      }
      const kp = caProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]), tall = altAt(i) > 2760 ? 1.9 : 1;
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2 * tall, 0.13, T.hd[i], tall > 1 ? [0.95, 0.5, 0.12] : [0.94, 0.94, 0.92], null, true);
        box(g, p[0], p[1] + 0.72 * tall, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
    }

    /* ---- the curves' signs ("CURVA" and the number, as on the real road) 30 m before each, on the right, facing the cars coming up; three chevrons
       on the outside of each hairpin, facing the cars coming into it ---- */
    (def.curves || []).forEach(([d, , turn], k) => {
      const [px, pz, ii] = onSide(sStart + d - 30, 1, 0.9);
      if (!excluded(px, pz)) { const py = caGround(px, pz), g = scen.get(px, pz), u0 = (k % 8) / 8, v1 = 1 - Math.floor(k / 8) / 8;
        box(g, px, py - 0.2, pz, 0.08, 2.1, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
        bannerQ(px, py + 1.2, pz, -T.tx[ii], -T.tz[ii], 0.85, 0.85, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2);
        exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); }
      const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 6 && sStart + d <= q.i1 * T.ds + 6); if (!c || c.sev < 2) return;
      const out_ = -turn, cell = turn > 0 ? 30 : 31, u0 = (cell % 8) / 8, v1 = 1 - Math.floor(cell / 8) / 8;
      for (const o of [-14, 0, 14]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.7); if (excluded(cx, cz) || galAt[ci]) continue;
        const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
        box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
        bannerQ(cx, cy + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2); CR.avoid(cx, cz, 0.6); }
    });
    { const nm = (n) => T.names.find(q => q.n.startsWith(n));   // the place boards: the river at its bridge, the viewpoint at curve 17
      for (const [n, k, o] of [['Río Juncalillo', 4, -20], ['Curva 17', 5, 25]]) { const q = nm(n); if (!q) continue; const [bx, bz, bi] = onSide(sStart + q.d + o, 1, 1.4); if (excluded(bx, bz)) continue;
        const by = caGround(bx, bz), [v0, v1, u0, u1] = board(k); box(scen.get(bx, bz), bx, by - 0.2, bz, 0.1, 2.6, 0.1, T.hd[bi], [0.6, 0.61, 0.63]); bannerQ(bx, by + 1.7, bz, -T.tx[bi], -T.tz[bi], 3.2, 0.8, v0, v1, u0, u1, ban2); exclPush(bx, bz, 2); } }

    /* ---- the old Transandine railway (closed since 1984) along the valley and past Portillo: its gravel bed and the rusted rails, the snow sheds over
       it (concrete, half-buried), its bridges; only within the corridor ---- */
    let nRailway = 0;
    {
      const bed = [0.5, 0.47, 0.43], rust = [0.42, 0.26, 0.17], shed = [0.6, 0.58, 0.54], shedT = [0.56, 0.5, 0.44];
      for (const r of def.rail || []) {
        const p = r.p, n = p.length / 2, X = (k) => p[2 * k], Z = (k) => p[2 * k + 1], cum = [0];
        for (let k = 1; k < n; k++) cum.push(cum[k - 1] + Math.hypot(X(k) - X(k - 1), Z(k) - Z(k - 1)));
        const yg = []; for (let k = 0; k < n; k++) yg.push(caGround(X(k), Z(k)));
        const ys = yg.map((_, k) => { let s = 0, c = 0; for (let q = Math.max(0, k - 4); q <= Math.min(n - 1, k + 4); q++) { s += yg[q]; c++; } return s / c; });   // (a smoothed bed: it cuts and fills a little)
        const inR = (L, a) => L.some(([x0, x1]) => a >= x0 && a <= x1);
        for (const [b0, b1] of r.br) { let k0 = -1, k1 = -1; for (let k = 0; k < n; k++) { if (cum[k] <= b0 - 6) k0 = k; if (k1 < 0 && cum[k] >= b1 + 6) k1 = k; } if (k0 < 0 || k1 < 0) continue;
          for (let k = k0; k <= k1; k++) ys[k] = lerp(ys[k0], ys[k1], (cum[k] - cum[k0]) / Math.max(1, cum[k1] - cum[k0])); }   // (a bridge: straight across)
        for (let k = 0; k < n - 1; k++) {
          const x0 = X(k), z0 = Z(k), x1 = X(k + 1), z1 = Z(k + 1), dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz) || 1, ux = -dz / L, uz = dx / L, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
          const dd = API.vrDist(mx, mz); if (dd > 420) continue; const nn = API.vrNear(mx, mz); if (nn.i >= 0 && nn.dd < 3) continue;   // (beyond the corridor, or where the road runs over it)
          const am = (cum[k] + cum[k + 1]) / 2, y0 = ys[k] + 0.12, y1 = ys[k + 1] + 0.12, g = scen.get(mx, mz), brg = inR(r.br, am);
          const A = (x, z, o, y) => [x + ux * o, y, z + uz * o];
          g.quadUp(A(x0, z0, -1.7, y0), A(x0, z0, 1.7, y0), A(x1, z1, 1.7, y1), A(x1, z1, -1.7, y1), [bed, bed, bed, bed]);
          for (const o of [-0.5, 0.5]) g.quadUp(A(x0, z0, o - 0.04, y0 + 0.16), A(x0, z0, o + 0.04, y0 + 0.16), A(x1, z1, o + 0.04, y1 + 0.16), A(x1, z1, o - 0.04, y1 + 0.16), [rust, rust, rust, rust]);
          if (brg) { box(g, mx, Math.min(y0, y1) - 1.6, mz, L + 0.1, 1.5, 2.6, Math.atan2(dz, dx), [0.32, 0.3, 0.3]); if (k % 3 === 0) box(g, x0, Math.min(caGround(x0, z0), y0 - 2) - 1, z0, 1.6, Math.max(0.5, y0 - caGround(x0, z0) - 0.4), 3.2, Math.atan2(dz, dx), [0.58, 0.55, 0.5]); }
          if (inR(r.cov, am)) {   // the snow shed: a wall on the uphill side, the roof on posts, scree on top
            const up = API.vrDem(mx + ux * 12, mz + uz * 12) > API.vrDem(mx - ux * 12, mz - uz * 12) ? 1 : -1, H = 5.2, inn = [mx, (y0 + y1) / 2 + 2, mz];
            for (const q of [inn, A(mx, mz, up * 6, (y0 + y1) / 2 + 2)]) g.quadO(A(x0, z0, up * 2.6, y0 - 0.5), A(x1, z1, up * 2.6, y1 - 0.5), A(x1, z1, up * 2.6, y1 + H), A(x0, z0, up * 2.6, y0 + H), q === inn ? [shed[0] * 0.85, shed[1] * 0.85, shed[2] * 0.85] : shed, q);
            g.quadO(A(x0, z0, -up * 2.9, y0 + H), A(x1, z1, -up * 2.9, y1 + H), A(x1, z1, up * 3.4, y1 + H + 0.8), A(x0, z0, up * 3.4, y0 + H + 0.8), shedT, [inn[0], inn[1] - 4, inn[2]]);
            g.quadO(A(x0, z0, -up * 2.9, y0 + H - 0.6), A(x1, z1, -up * 2.9, y1 + H - 0.6), A(x1, z1, -up * 2.9, y1 + H), A(x0, z0, -up * 2.9, y0 + H), shed, inn);
            if (k % 2 === 0) { const q = A(x0, z0, -up * 2.6, y0 - 0.4); box(g, q[0], q[1], q[2], 0.5, H + 0.2, 0.5, Math.atan2(dz, dx), shed, null, true); }
          }
          nRailway++;
        }
      }
    }

    /* ---- Portillo's ski lifts (stopped for the summer): a steel pylon every ~60 m with its cross arm and wheels, the hauling cable, a chair every
       14 m on a chair lift; the stations at both ends ---- */
    {
      const st = [0.42, 0.44, 0.48], blk = [0.1, 0.1, 0.12], seat = [0.2, 0.3, 0.55];
      for (const [x0, z0, x1, z1, kind] of def.lifts || []) {
        const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, rot = Math.atan2(uz, ux), n = Math.max(2, Math.round(L / 60)), tops = [];
        for (let k = 0; k <= n; k++) {
          let x = x0 + ux * L * k / n, z = z0 + uz * L * k / n; const nn = API.vrNear(x, z);
          if (API.vrDist(x, z) > 430) { tops.push(null); continue; }
          if (nn.i >= 0 && nn.dd < 3) { x += ux * 14; z += uz * 14; }   // (never on the road: a step along the line)
          const y = caGround(x, z), g = scen.get(x, z), end = k === 0 || k === n, h = end ? 4.5 : kind === 0 ? 10 + (k % 3) : 7;
          if (end) { box(g, x, y - 0.3, z, 7, 3.6, 5, rot, [0.82, 0.8, 0.74], [0.5, 0.2, 0.15], true); cyl(g, x, y + 3.3, z, 2.0, 0.3, 10, st); exclPush(x, z, 6); CR.block(x, z, 7.5, 5.5, rot); }
          else { cyl(g, x, y - 0.3, z, kind === 0 ? 0.3 : 0.2, h + 0.3, 6, st); box(g, x, y + h, z, 0.4, 0.35, kind === 0 ? 4.6 : 1.6, rot, st); exclPush(x, z, 1.2); CR.avoid(x, z, 0.8); }
          tops.push([x, y + h + (end ? 0 : -0.1), z]);
        }
        for (let k = 0; k < n; k++) { const a = tops[k], b = tops[k + 1]; if (!a || !b) continue;
          for (const side of kind === 0 ? [-2.1, 2.1] : [0]) { const ox = -uz * side, oz = ux * side, g = scen.get((a[0] + b[0]) / 2, (a[2] + b[2]) / 2);
            API.ouRod(g, [a[0] + ox, a[1], a[2] + oz], [b[0] + ox, b[1], b[2] + oz], 0.03, blk, 3);
            if (kind === 0) for (let t = 7; t < Math.hypot(b[0] - a[0], b[2] - a[2]) - 4; t += 14) { const f = t / Math.hypot(b[0] - a[0], b[2] - a[2]), cx = lerp(a[0], b[0], f) + ox, cz = lerp(a[2], b[2], f) + oz, cy = lerp(a[1], b[1], f) - 0.4 * Math.sin(f * PI);
              API.ouRod(g, [cx, cy, cz], [cx, cy - 2.1, cz], 0.025, st, 3); box(g, cx, cy - 2.6, cz, 0.5, 0.45, 1.2, rot, seat); } } }
      }
    }

    /* ---- spectators: the start and the finish, the checkpoints, the insides and outsides of every third curve, the viewpoint at curve 17, a few
       groups along the road ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.16, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'CA start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'CA finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.55, label: 'CA cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.4, label: 'CA cp-' }); });
      (def.curves || []).forEach(([d, , turn], k) => { if (k % 3 !== 1 && k !== 16) return; const sm = sStart + d; for (const sd of [-1, 1]) run(sm - 22, sm + 22, sd, { rows: 3, dens: sd === turn ? 0.5 : 0.35, flag: 0.22, label: 'CA curve ' + (k + 1) }); });
      { const q = T.names.find(n => n.n.startsWith('Curva 17')); if (q) for (const sd of [-1, 1]) run(sStart + q.d - 60, sStart + q.d + 80, sd, { rows: 3, dens: 0.45, clump: 0.8, label: 'CA mirador' }); }
      for (let s = sStart + 400; s < sFin - 300; s += 560) { const sd = rpHash(Math.round(s), 5) < 0.5 ? -1 : 1; if (galAt[T.idx(s)]) continue; run(s, s + 24, sd, { rows: 2, dens: 0.35, clump: 0.9, label: 'CA group' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants (instanced per 96 m chunk): tufts of bunch grass where the grass grows (lc 1) and here and there on the scree, low shrubs, green
       cushion plants on the rocky ground up high; boulders half sunk in the scree. Thicker near the road, none on the snow, the water, the cliffs ---- */
    const pMat = API.ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; API.ouCutMat(wMat, cut);   // (the bunch grass: in the wind, and the cut)
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }   // (the blades have both faces, each lit as it faces)
    const pk = [0, 1, 2, 3, 4].map(k => new IChunks(caPlantGeo(k), k === 0 ? wMat : pMat, k === 4 ? 64 : 96));   // (the stones: in smaller chunks, culled closer to the view)
    let nPlants = 0;
    {
      const G = P.G, Lt = API.VRC * API.VRT, maxT = Math.round(70000 * dens), RT = rng(2961), SP = 3.4 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = API.vrDist(x, z); if (hd > LOD.radius(230)) continue;   // (LOD: a shorter plant/tree draw distance on the lower tiers)
          if (hd > LOD.radius(70) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot)
          const c = API.vrLC(x, z), y0 = caGround(x, z), A = y0 + base, sl = caSlope(x, z);
          let kind = -1;
          if (c === 1) kind = r1 < 0.52 ? 0 : r1 < 0.56 ? 1 : -1;
          else if (c === 2) kind = r1 < 0.3 ? 1 : r1 < 0.42 ? 0 : -1;
          else if (c === 0) kind = r1 < 0.05 ? 0 : r1 < 0.065 ? 3 : A > 2620 && r1 < 0.085 ? 2 : r1 < 0.09 ? 1 : -1;
          if (kind < 0) continue;
          if (sl > (kind === 3 ? 1.1 : 0.85)) continue;
          if (API.vrWater(x, z).e > -3) continue;
          const nn = API.vrNear(x, z); if (nn.i >= 0 && nn.dd < 1.6) continue;
          if (excluded(x, z)) continue;
          const ny = 1 / Math.sqrt(1 + sl * sl); if (caSnow(x, z, A, ny, 0) > 0.35) continue;
          if (kind === 0) pk[0].add(x, y0 - 0.05, z, r2 * TAU, 0.6 + r3 * 0.6, 0.45 + r4 * 0.45, [0.92 + r2 * 0.16, 0.92 + r3 * 0.12, 0.88 + r4 * 0.16]);
          else if (kind === 1) pk[1].add(x, y0 - 0.1, z, r2 * TAU, 0.6 + r3 * 0.9, 0.5 + r4 * 0.6, [0.9 + r2 * 0.2, 0.92 + r3 * 0.12, 0.9]);
          else if (kind === 2) pk[2].add(x, y0 - 0.08, z, r2 * TAU, 0.5 + r3 * 0.9, 0.35 + r4 * 0.35, [0.9 + r2 * 0.2, 0.95 + r3 * 0.1, 0.9]);
          else { const k = 0.85 + r3 * 0.3, rc = r2 < 0.3 ? [1.04, 0.92, 0.84] : r2 < 0.55 ? [1.04, 1.0, 0.9] : [0.92, 0.92, 0.94]; pk[3].add(x, y0 - 0.15, z, r4 * TAU, 0.5 + r3 * 1.4, 0.4 + r4 * 1.0, [rc[0] * k, rc[1] * k, rc[2] * k]); }
          if (++nPlants >= maxT) break grid;
        }
      }
    }
    {   // the scree's stones: little clusters strewn beside the road, thickest at its edge and thinning out over ~45 m; fewer on the grass, none on the
      // road, the snow or the water
      const RS = rng(2967), maxS = Math.round(26000 * dens); let nS = 0;
      edge: for (let s = 12; s < T.len - 12; s += 0.9 / dens) for (const side of [-1, 1]) {
        if (galAt[T.idx(s)]) continue;
        const o = 1.7 + Math.pow(RS(), 2) * 42, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (API.vrNear(x, z).dd < 1.2 || excluded(x, z) || API.vrWater(x, z).e > -3) continue;
        const y0 = caGround(x, z), sl = caSlope(x, z); if (sl > 1.15 || (API.vrLC(x, z) === 1 && r1 < 0.45)) continue;
        if (caSnow(x, z, y0 + base, 1 / Math.sqrt(1 + sl * sl), 0) > 0.3) continue;
        const k = 0.84 + r3 * 0.28, sc = 0.85 + r1 * 1.25 - 0.006 * o; pk[4].add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [k, k, k]);   // (a little bigger at the road's edge)
        if (++nS >= maxS) break edge;
      }
    }
    for (const t of pk) t.addTo(root, false);

    /* ---- the verges and the slopes: scree and boulders at the foot of the cuts (grey, rust, ochre), crags where the slope rises steep beside the road,
       a few tufts right behind the barrier ---- */
    {
      const RV = rng(2971), rockC = [[0.64, 0.6, 0.55], [0.63, 0.53, 0.46], [0.68, 0.62, 0.53], [0.5, 0.48, 0.47], [0.6, 0.58, 0.56]];
      for (let s = 10; s < T.len - 10; s += 6) for (const side of [-1, 1]) {   // at the foot of the cuts and out on the scree
        const i = T.idx(s); if (galAt[i] || RV() > 0.36) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 40, [x, z] = onSide(s, side, o), sz = 0.4 + RV() * 1.3; if (API.vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || API.vrWater(x, z).e > -3) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.3 && API.vrLC(x, z) !== 0) continue;
        const g = scen.get(x, z), col = vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.12);
        rock(g, x, y + sz * 0.3, z, sz * 1.2, sz, sz, RV() * TAU, col, RV, 0.32);
      }
      for (let s = 16; s < T.len - 16; s += 16) for (const side of [-1, 1]) {   // crags where the slope is steep
        if (RV() < 0.4) continue;
        const [x, z] = onSide(s, side, 8 + RV() * 70); if (excluded(x, z) || API.vrNear(x, z).dd < 6 || API.vrDist(x, z) > LOD.cap(90)) continue;
        const sl = caSlope(x, z); if (sl < 0.7) continue;
        const y = caGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 2 + RV() * 3.8, qx = x + (RV() - 0.5) * 8, qz = z + (RV() - 0.5) * 8, qy = caGround(qx, qz); if (API.vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.4, qz, r0, r0 * (0.8 + RV() * 0.8), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, 0.35); }
      }
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fac.addTo(sceneryGroup, API.ouCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: caAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: caAtlas2(def.curves || []), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    { const geo = caCondorGeo(), mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), i0 = T.idx(sStart), L = [];   // three condors over the road
      for (const [r, sp, h, ox, oz, ph] of [[46, 0.16, 46, 30, -20, 0], [62, -0.12, 64, -40, 25, 2.1], [38, 0.2, 38, 10, 55, 4.2]]) {
        const m = new THREE.Mesh(geo, mat); m.scale.setScalar(1.3); m.castShadow = true; root.add(m); L.push({ m, r, sp, h, ox, oz, ph, bank: 0.32 }); }
      out.dyn.condors = { L, x0: T.px[i0], z0: T.pz[i0], y0: T.hy[i0], ax: T.px[i0], az: T.pz[i0], ay: T.hy[i0], t: null };
      caCondors(out.dyn.condors, 0, null); }
    crowdFinish(CR, root, out);
    out.stats = { plants: nPlants, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), railway: nRailway, galleries: GAL.length, sideRoads: out.stubStats.n };   // (read by the tests)
    return out;
  }

  Object.assign(API, { CAN, CA_SNC, caCar, caCondorGeo, caCondors, caGCol, caGH, caGround, caH, caNear, caPlantGeo, caProps, caSlope, caTileGeo, caTileOn });   // (what World and the other worlds use of this one)
  World.ext.caracoles = (scene, tex, opts) => buildCaracoles(scene, tex, opts);
})();
