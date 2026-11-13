/* =========================================================================
   WORLD — Dadès (theme 'dades'): its own builder (World.ext.dades). What it uses of World comes from World.api: the helpers bound here once,
   the state that changes as API.<name>, the track being built and its theme (LOD, T) copied in at each build. Built on Vršič's corridor (vrPrep
   and Los Caracoles' terrain helpers caH / caGround read the same forms: def.dem, def.lc), as Rio do Rastro; the walls between the legs of the
   hairpins as the shared world of the passes builds them (js/world-prelaz.js: copied here, that file is not changed for this road).
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

  /* ================= DADÈS (theme 'dades') =================
     The valley of the Dadès in the High Atlas (Morocco, road R704): from the valley floor up the famous stack of four hairpins to the saddle above
     them and down into the gorge to the river, on a clear, dry afternoon. A look of its own: the ground's colours (dCol: the stony steppe in ochre
     and tan, the bare red and purple-brown rock of the conglomerate in bands on the steep faces, the river's green strip of fields), the river
     (def.river: its water in a shallow bed where the valley floor meets it, hidden in its slot under the road's ledge), the trees of the strip
     (dTreeGeo: poplars, walnuts, almonds, a few palms, tamarisks on the banks) and the sparse shrubs of the steppe, the masonry walls holding the
     legs of the hairpins, the low red-and-white parapets on the drops and round the bends, the chevrons, the viewpoints (def.views) and the
     flat-roofed buildings of rammed earth at the top of the hairpins (def.bld; generic: no names or signs of any hotel or café), the land beyond
     the corridor (irFar: the red ridges round the valley). Only geographic names on the boards. */
  const DCOL = [0, 0, 0];
  let RV = null;   // the river (def.river, prepared at each build): { x, z, lv, n, H: hash of its segments by RVC m cells }
  const RVC = 24, RVN = { d: 1e9, lv: 0, k: -1 };
  function rivNear(x, z) {   // the nearest point of the river within ~RVC m: its distance and water level (relative to the start line), or d 1e9
    RVN.d = 1e9; RVN.k = -1; if (!RV) return RVN;
    const L = RV.H.get(Math.floor(x / RVC) * 65536 + Math.floor(z / RVC)); if (!L) return RVN;
    for (let q = 0; q < L.length; q++) { const k = L[q], ax = RV.x[k], az = RV.z[k], bx = RV.x[k + 1], bz = RV.z[k + 1], ux = bx - ax, uz = bz - az, ll = ux * ux + uz * uz || 1;
      const t = clamp(((x - ax) * ux + (z - az) * uz) / ll, 0, 1), dx = x - ax - ux * t, dz = z - az - uz * t, d = Math.sqrt(dx * dx + dz * dz);
      if (d < RVN.d) { RVN.d = d; RVN.lv = RV.lv[k] + (RV.lv[k + 1] - RV.lv[k]) * t; RVN.k = k; } }
    return RVN;
  }
  function oasis(x, z, h) {   // how much of the river's green strip is at (x, z): near the river and low above its water
    const r = rivNear(x, z); if (r.k < 0) return 0;
    return sstep(26, 8, r.d) * sstep(7, 2.5, h - r.lv) * 0.55 + sstep(70, 22, r.d) * sstep(5, 1.5, h - r.lv) * 0.6;
  }
  function dCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map): the stony steppe (lc 0) in ochre and tan with darker gravel patches, the
    // bare ground and rock (lc 4) redder, the shrubs (lc 2) olive-grey, the trees and fields (lc 1, 6) and the river's strip green, the yards (lc 3);
    // on the steep faces the conglomerate's red and purple-brown bands with paler layers; a trodden reddish verge
    const P = API.VR, A = h + P.D.base, f = P.n4(x, z), q = P.c2(x, z), m = P.c1(x, z);
    let R = 0.66, G = 0.52, B = 0.38;
    const gv = sstep(0.55, 0.8, q) * 0.5; R = lerp(R, 0.52, gv); G = lerp(G, 0.43, gv); B = lerp(B, 0.34, gv);   // (the darker gravel of the steppe)
    const rd = Math.max(vrLCf(x, z, 4), sstep(0.62, 0.86, m) * 0.6); R = lerp(R, 0.66, rd); G = lerp(G, 0.43, rd); B = lerp(B, 0.32, rd);
    const sh = vrLCf(x, z, 2) * 0.6; R = lerp(R, 0.47, sh); G = lerp(G, 0.45, sh); B = lerp(B, 0.32, sh);
    const se = vrLCf(x, z, 3) * 0.5; R = lerp(R, 0.7, se); G = lerp(G, 0.58, se); B = lerp(B, 0.45, se);
    const gr = Math.min(1, Math.max(vrLCf(x, z, 1) * 0.8, vrLCf(x, z, 6) * 0.9, oasis(x, z, h))), fl = sstep(0.4, 0.75, P.c5(x * 1.6, z * 1.6));
    R = lerp(R, lerp(0.3, 0.46, fl), gr); G = lerp(G, lerp(0.38, 0.48, fl), gr); B = lerp(B, lerp(0.17, 0.22, fl), gr);   // (the fields: fresh green and stubble)
    R += (f - 0.5) * 0.09; G += (f - 0.5) * 0.075; B += (f - 0.5) * 0.06;
    const st = sstep(0.68, 0.42, ny) * (1 - 0.8 * gr);
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 4.5 + P.c2(x * 0.4, z * 0.4) * 6), pale = sstep(0.62, 0.9, band), pur = sstep(0.55, 0.8, P.c3(x, z)), k = 0.86 + 0.16 * band;
      const rr = lerp(lerp(0.6, 0.48, pur), 0.74, pale) * k, rg = lerp(lerp(0.36, 0.33, pur), 0.6, pale) * k, rb = lerp(lerp(0.26, 0.3, pur), 0.46, pale) * k;
      R = lerp(R, rr, st); G = lerp(G, rg, st); B = lerp(B, rb, st); }
    if (dd < 1.8) { const t = sstep(1.8, 0.2, dd) * 0.4; R = lerp(R, 0.64, t); G = lerp(G, 0.47, t); B = lerp(B, 0.36, t); }
    DCOL[0] = R; DCOL[1] = G; DCOL[2] = B; return DCOL;
  }
  function dGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (as caGCol, coloured by dCol)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = dCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function dTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by dCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = dCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
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
  function dFarCol(A, sl, q) {   // the land beyond the corridor (irFar): ochre steppe low down, the red and purple-brown rock of the ridges, greyer limestone up high
    const rk = Math.min(1, sstep(0.45, 0.9, sl) * 0.9 + sstep(2300, 2700, A) * 0.4), gy = sstep(2400, 2900, A) * 0.7, gr = sstep(1700, 1640, A) * 0.35;
    let c = [0.66 + q * 0.05, 0.52 + q * 0.04, 0.39 + q * 0.03];
    c = [lerp(c[0], 0.58, rk), lerp(c[1], 0.39, rk), lerp(c[2], 0.3, rk)];
    c = [lerp(c[0], 0.6, gy), lerp(c[1], 0.56, gy), lerp(c[2], 0.52, gy)];
    return [lerp(c[0], 0.36, gr), lerp(c[1], 0.42, gr), lerp(c[2], 0.22, gr)];   // (the river's green strip in the valley bottoms)
  }
  let dATex = null, dAKey = '', dA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function dAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): DÉPART (the start), ARRIVÉE (the finish), CP1-CP4 with the altitude, the gorge's board, the race's banner
    const key = cps.join('|') + '|' + finA; if (dATex && dAKey === key) return dATex;
    if (dATex) dATex.dispose(); dAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('DÉPART', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(262, 142, 500, 100); txt('ARRIVÉE', 512, 196, 92, '#111', 470);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#a3241c'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#7a3a22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f1e2c6'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('GORGES DU DADÈS', 512, 812, 58, '#f6ead2', 900); txt(finA, 512, 862, 46, '#f6ead2', 900);
    x.fillStyle = '#a3241c'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#2f7a3e'; x.fillRect(0, 956, 1024, 8);
    txt('VALLÉE DU DADÈS', 512, 930, 52, '#fff', 980); txt('R704 · 4 VIRAGES', 512, 994, 44, '#ffd23a', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (dATex = t);
  }
  const D_BOARDS = [['GORGES DU DADÈS', '#1d4f9a'], ['MSEMRIR', '#1d4f9a'], ['BOUMALNE DADÈS', '#1d4f9a'], ['POINT DE VUE', '#6b4a22'], ['VIRAGES DANGEREUX', '#f2f0ea'], ['RALENTIR', '#f2f0ea'], ['VALLÉE DU DADÈS', '#6b4a22'], ['TINGHIR', '#1d4f9a']];
  function dAtlas2() {   // the small signs: cells 30-31 the chevrons (white on red, pointing the way the road turns); rows 4-7, the place boards (two a row, 512 x 128)
    if (dA2Tex) return dA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (const [k, dir] of [[30, 1], [31, -1]]) {
      const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128; x.fillStyle = '#c8261c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f6f5f0';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    D_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, warn = bg === '#f2f0ea';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = warn ? '#c8261c' : '#f2f2ee'; x.lineWidth = warn ? 12 : 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, 52, warn ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (dA2Tex = t);
  }
  function dTreeGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 a poplar (a tall narrow column of a crown on a pale trunk),
    // 1 a walnut (a broad round crown of three clumps), 2 a date palm (a ringed trunk, a crown of arching fronds), 3 a shrub of the steppe (a low
    // grey-green mound), 4 an almond or a fig (a small open crown), 5 a tamarisk on the river's banks (a feathery grey-green clump)
    const g = new GB(), R = rng(960 + kind), rs = API.ROCK_SMOOTH, frond = (cx, cy, cz, a, L, lift, droop, w, col, tip) => {
      const ux = Math.cos(a), uz = Math.sin(a), px = -uz * w, pz = ux * w, m = [cx + ux * L * 0.55, cy + lift, cz + uz * L * 0.55], e = [cx + ux * L, cy + lift - droop, cz + uz * L];
      const b = [cx, cy, cz], l1 = [m[0] + px, m[1], m[2] + pz], r1 = [m[0] - px, m[1], m[2] - pz], up = [cx, cy + 1, cz], dn = [cx, cy - 1, cz];
      g.triO(b, l1, m, col, dn, col, col); g.triO(b, m, l1, col, up, col, col); g.triO(b, m, r1, col, dn, col, col); g.triO(b, r1, m, col, up, col, col);
      g.triO(l1, e, m, col, dn, tip, col); g.triO(l1, m, e, col, up, col, tip); g.triO(m, e, r1, col, dn, tip, col); g.triO(m, r1, e, col, up, col, tip); };
    if (kind === 0) {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.022, 0.3, 4, [0.72, 0.7, 0.62], null, 0.016);
      ico(g, 0, 0.6, 0, 0.13, 3.4, [0.3, 0.42, 0.16], R, 0.25); ico(g, 0.03, 0.78, 0.02, 0.1, 2.4, [0.36, 0.48, 0.19], R, 0.3);
    } else if (kind === 1) {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.05, 0.42, 5, [0.42, 0.36, 0.3], null, 0.035);
      const cs = [[0.26, 0.38, 0.14], [0.3, 0.42, 0.16], [0.23, 0.34, 0.13]];
      ico(g, 0, 0.64, 0, 0.36, 0.62, cs[0], R, 0.3); ico(g, 0.24, 0.56, 0.12, 0.26, 0.7, cs[1], R, 0.32); ico(g, -0.22, 0.57, -0.14, 0.27, 0.7, cs[2], R, 0.32);
    } else if (kind === 2) {
      API.ROCK_SMOOTH = false; cyl(g, 0, -0.02, 0, 0.032, 0.84, 5, [0.5, 0.42, 0.32], null, 0.026);
      for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + R() * 0.4; frond(0, 0.86, 0, a, 0.4 + R() * 0.1, 0.06, 0.24, 0.045, k % 2 ? [0.3, 0.4, 0.18] : [0.36, 0.44, 0.2], [0.5, 0.5, 0.3]); }
    } else if (kind === 3) {
      API.ROCK_SMOOTH = true; ico(g, 0, 0.4, 0, 0.55, 0.75, [0.46, 0.46, 0.3], R, 0.4); ico(g, 0.3, 0.3, 0.15, 0.32, 0.8, [0.52, 0.5, 0.34], R, 0.4);
    } else if (kind === 4) {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.04, 0.45, 4, [0.4, 0.33, 0.27], null, 0.025);
      ico(g, 0, 0.66, 0, 0.36, 0.5, [0.38, 0.46, 0.2], R, 0.45); ico(g, 0.2, 0.6, -0.1, 0.22, 0.6, [0.42, 0.5, 0.24], R, 0.45);
    } else {
      API.ROCK_SMOOTH = true; const cs = [[0.4, 0.46, 0.3], [0.46, 0.5, 0.34], [0.36, 0.42, 0.27]];
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + R() * 0.5, d = k ? 0.28 : 0; ico(g, Math.cos(a) * d, 0.48 - d * 0.3, Math.sin(a) * d, 0.34, 1.2, cs[k % 3], R, 0.45); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the knockable roadside posts: white with a red top
  function dProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }

  function buildDades(scene, tex, opts) {
    const R = rng(4711), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.66, 0.5, 0.38] };
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(911, 150); P.c2 = valueNoise2(912, 64); P.c3 = valueNoise2(913, 90); P.c4 = valueNoise2(914, 120); P.c5 = valueNoise2(915, 26);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the river (def.river: [x, z, level (dm above the start line), ...] downstream): its points and a hash of its segments
    RV = null;
    for (const p of def.river || []) {
      const n = p.length / 3; if (n < 2) continue; const x = new Float32Array(n), z = new Float32Array(n), lv = new Float32Array(n), H = new Map();
      for (let k = 0; k < n; k++) { x[k] = p[3 * k]; z[k] = p[3 * k + 1]; lv[k] = p[3 * k + 2] / 10; }
      for (let k = 0; k < n - 1; k++) { const a0 = Math.floor((Math.min(x[k], x[k + 1]) - RVC) / RVC), a1 = Math.floor((Math.max(x[k], x[k + 1]) + RVC) / RVC), b0 = Math.floor((Math.min(z[k], z[k + 1]) - RVC) / RVC), b1 = Math.floor((Math.max(z[k], z[k + 1]) + RVC) / RVC);
        for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) { const kk = a * 65536 + b; let L = H.get(kk); if (!L) H.set(kk, L = []); L.push(k); } }
      RV = { x, z, lv, n, H }; break;
    }
    // the buildings (def.bld: the hotels and cafés at the top of the hairpins, a house in the gorge): clear of the road and the river; the long ones
    // in two blocks
    const blds = [];
    for (const b of def.bld || []) {
      let [x, z, L, W, ang] = b; W = Math.min(W, 18); if (L < 4 || W < 4) continue;
      const parts = L > 40 ? [[-L / 4, L / 2 - 2], [L / 4, L / 2 - 2]] : [[0, L]];
      for (const [o, Lp] of parts) {
        const c = Math.cos(ang), s = Math.sin(ang), cx = x + c * o, cz = z + s * o;
        const clear = () => { for (const [u, v] of [[0, 0], [-Lp / 2, -W / 2], [Lp / 2, -W / 2], [Lp / 2, W / 2], [-Lp / 2, W / 2]]) { const px = cx + c * u - s * v, pz = cz + s * u + c * v, nn = vrNear(px, pz);
          if ((nn.i >= 0 && nn.dd < 2) || rivNear(px, pz).d < 12) return false; } return true; };
        if (clear()) blds.push({ x: cx, z: cz, L: Lp, W, ang });
      }
    }
    // the level plots: the viewpoints beside the road (def.views within ~25 m of it), the car parks (def.parks), the cars' park past the finish
    const views = [], parks = [];
    for (const [x, z] of def.views || []) { const n = vrNear(x, z); if (n.i < 0 || n.dd > 25) continue; const i = n.i, s = i * T.ds; if (s < sStart + 20 || s > sFin - 20) continue;
      const pad = { x, z, r: 6, b: 8, h: T.hy[i] - 0.15, i }; P.pads.push(pad); views.push(pad); }
    for (const [x, z, r] of def.parks || []) { const n = vrNear(x, z); if (n.i < 0 || n.dd > 30) continue; const i = n.i;
      const pad = { x, z, r: Math.max(5, Math.min(r, 14)), b: 10, h: T.hy[i] - 0.2, i }; P.pads.push(pad); parks.push(pad); }
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 14, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 60, 12); P.pads.push(padF);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees and buildings between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the rocks, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    for (const p of views) exclPush(p.x, p.z, p.r + 2);
    for (const p of parks) exclPush(p.x, p.z, p.r + 2);
    exclPush(padF.x, padF.z, padF.r + 4);
    out.marks = {}; if (views.length) out.marks.view = [views[0].x, views[0].z];   // (where the landmarks stand: the tests look for them)

    /* ---- the retaining walls between the legs of the hairpins (as js/world-prelaz.js builds them): the game's road is wider than the real one
       (9 m against ~6 m), so where two legs lie close the lower one's barrier comes within a few metres of the upper one's and the climb between
       them falls in between: the terrain's 5 m grid could only draw that as a sheer face over jagged teeth. There a masonry wall stands under
       the upper verge's edge (bar + 0.42), battered 1 in 20, its foot on a level shelf at the lower leg's height; the terrain kept down to the
       shelf from under the upper verge out to the lower leg's barrier (API.caBank in caH). bk[si][i]: { p: [[offset, height above the road]
       top, foot], o1: where the shelf ends, hl: the lower leg's height } or null. The river's bed is carved by the same hook (dBank) ---- */
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
    const dBank = (x, z, h) => {
      const Lq = BKH.get(Math.floor(x / BKC) * 65536 + Math.floor(z / BKC));
      if (Lq) for (let q = 0; q < Lq.length; q++) { const si = Lq[q] >= N ? 1 : 0, i = Lq[q] - si * N, side = si ? 1 : -1, b = bk[si][i], dx = x - T.px[i], dz = z - T.pz[i];
        if (Math.abs(dx * T.tx[i] + dz * T.tz[i]) > T.ds * 0.75) continue;
        const o = (dx * T.nx[i] + dz * T.nz[i]) * side; if (o < b.p[0][0] - 6 || o > b.o1) continue;
        if (b.hl - 0.35 < h) h = b.hl - 0.35; }
      const r = rivNear(x, z);   // the river's bed: a shallow channel with gentle banks, where the valley floor lies near the water (not the slot under the ledge)
      if (r.k >= 0 && r.d < 22) { const t = r.lv - 0.6 + Math.max(0, r.d - 3.2) * 0.42; if (t < h && h - r.lv < 9) h = t; }
      return h; };
    API.caBank = { T, f: dBank };

    /* ---- terrain tiles; the river's water where its bed lies open (a ribbon on its level, flowing: dyn.water) ---- */
    let nFar = 0, nRiver = 0;
    const tMat = pkGroundMat();
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(dTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      if (RV) {
        const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 50, specular: 0x2a3028 }), g = new GB(true), hw = 3.1;
        const wc = [[0.36, 0.42, 0.33], [0.42, 0.46, 0.36], [0.5, 0.52, 0.44]];
        for (let k = 0; k < RV.n - 1; k++) {
          const ax = RV.x[k], az = RV.z[k], bx = RV.x[k + 1], bz = RV.z[k + 1], d = vrDist((ax + bx) / 2, (az + bz) / 2); if (d > 380) continue;
          const ya = RV.lv[k] + 0.12, yb = RV.lv[k + 1] + 0.12; if (caGround(ax, az) > ya + 0.6 || caGround(bx, bz) > yb + 0.6) continue;
          const ux = bz - az, uz = -(bx - ax), ul = Math.hypot(ux, uz) || 1, px = ux / ul * hw, pz = uz / ul * hw, c0 = wc[k % 3], c1 = wc[(k + 1) % 3];
          g.quadUp([ax - px, ya, az - pz], [ax + px, ya, az + pz], [bx + px, yb, bz + pz], [bx - px, yb, bz - pz], [c0, c0, c1, c1], [[0, k * 0.6], [0.45, k * 0.6], [0.45, (k + 1) * 0.6], [0, (k + 1) * 0.6]]);
          nRiver++;
        }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); out.dyn.water = tex.water; }
      }
    }

    /* ---- the road: asphalt with a dashed white centre line (solid through the hairpins), a gravel shoulder, then the verge out to a ditch past the
       barrier line; where the ground falls far below, the stone retaining wall that holds the road (its face out over the drop); by a leg below,
       the wall's coping, then the bank (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.5;
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (bk[side > 0 ? 1 : 0][i]) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, -0.08], [bar + 0.42, -0.08], [bar + 0.42, -0.08]];   // (a bank down to the leg below: the wall's coping, then the bank)
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    const hairS = (def.curves || []).map(([d]) => sStart + d);
    let nWall = 0;
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.82 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.86) k -= 0.05; k *= 0.96 + 0.08 * P.n2(T.px[i] * 0.5 + o, T.pz[i] * 0.5); return [k * 1.02, k, k * 0.97]; };
      const wht = [0.94, 0.93, 0.88], gc = [0.6, 0.5, 0.41], wallC = [0.6, 0.45, 0.34], copeC = [0.7, 0.58, 0.47];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (bk[si][i]) { const q = 0.92 + 0.12 * rpHash(i >> 2, 61 + si); return k < 2 ? [copeC[0] * q, copeC[1] * q, copeC[2] * q] : [wallC[0] * q, wallC[1] * q, wallC[2] * q]; }
          const wl = vp[si][i][2][1] < -2.6; if (wl && (k === 1 || k === 2)) { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si); return k === 1 ? [copeC[0] * q, copeC[1] * q, copeC[2] * q] : [wallC[0] * 0.85 * q, wallC[1] * 0.85 * q, wallC[2] * 0.85 * q]; }
          if (k === 4) return dGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return dCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      const solid = (s) => hairS.some(h => Math.abs(s - h) < 55), dashOn = (s) => solid(s) || (s % 9) < 3;
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true), gw = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          if (i * T.ds > 3 && j < N - 2 && dashOn(i * T.ds)) gl.quadUp(Pt(i, -0.07, 0.036), Pt(i, 0.07, 0.036), Pt(j, 0.07, 0.036), Pt(j, -0.07, 0.036), [wht, wht, wht, wht]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6) && !bk[si][i]) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face: out, over the drop)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
            const bi = bk[si][i], bj = bk[si][j];   // the wall down to the leg below: its battered face from the coping to the shelf, the shelf out to the lower barrier
            if (bi && bj) { const top = (q, b2) => Pt(q, side * b2.p[0][0], b2.p[0][1]), foot = (q, b2) => Pt(q, side * b2.p[1][0], b2.p[1][1]), A = top(i, bi), B = top(j, bj), C = foot(j, bj), D = foot(i, bi);
              const q = 0.9 + 0.14 * rpHash(i >> 1, 71 + si), wc2 = [wallC[0] * q, wallC[1] * q, wallC[2] * q], dk = [wallC[0] * 0.78 * q, wallC[1] * 0.78 * q, wallC[2] * 0.78 * q];
              gw.quadO(A, B, C, D, null, Pt(i, 0, -bi.p[1][1] * 0.2 - 1), [wuv(A), wuv(B), [B[0] / 10, -(B[2]) / 10 + 0.4], [A[0] / 10, -(A[2]) / 10 + 0.4]], [wc2, wc2, dk, dk]);
              const E = Pt(i, side * bi.o1, -(T.hy[i] - bi.hl) - 0.32), F = Pt(j, side * bj.o1, -(T.hy[j] - bj.hl) - 0.32), sc = [0.56, 0.44, 0.34];
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
    const fans = [[0.84, 0.16, 0.14], [0.95, 0.95, 0.94], [0.16, 0.42, 0.26], [0.94, 0.8, 0.2], [0.18, 0.28, 0.6], [0.5, 0.32, 0.2], [0.12, 0.14, 0.2], [0.86, 0.62, 0.42], [0.46, 0.66, 0.86], [0.7, 0.2, 0.36]];
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => rivNear(x, z).d < 5, shirts: fans }), crSoft = new Set();
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
    const carCols = [[0.9, 0.9, 0.88], [0.72, 0.12, 0.1], [0.62, 0.6, 0.56], [0.16, 0.16, 0.18], [0.82, 0.76, 0.62], [0.24, 0.36, 0.5], [0.95, 0.95, 0.94]];

    /* ---- the buildings: rammed earth under flat roofs, a parapet round the roof, small dark windows; the bigger ones with towers at the corners
       (the old kasbahs' way, as the hotels at the top of the hairpins are built) ---- */
    let nBld = 0;
    {
      const RB = rng(4721), earth = [[0.72, 0.5, 0.36], [0.68, 0.47, 0.34], [0.76, 0.56, 0.42], [0.66, 0.44, 0.33]], win = [0.16, 0.12, 0.1];
      for (const b of blds) {
        const c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) lo = Math.min(lo, caGround(b.x + c * u - s * v, b.z + s * u + c * v));
        const g = scen.get(b.x, b.z), col = vary(earth[Math.floor(RB() * earth.length)], RB, 0.06), dk = [col[0] * 0.86, col[1] * 0.86, col[2] * 0.86], fl = b.L * b.W > 300 ? 3 : 2, H = fl * 3.1;
        box(g, b.x, lo - 1.5, b.z, b.L, H + 1.5, b.W, -b.ang, col, dk);
        box(g, b.x, lo + H, b.z, b.L, 0.6, b.W, -b.ang, dk, dk);   // (the parapet's band round the roof)
        for (let f = 0; f < fl; f++) for (const sd of [-1, 1]) for (let u = -b.L / 2 + 2.2; u < b.L / 2 - 1.5; u += 3.6) {   // the windows: small, deep-set
          const px = b.x + c * u - s * (sd * (b.W / 2 + 0.02)), pz = b.z + s * u + c * (sd * (b.W / 2 + 0.02));
          box(g, px, lo + 1.1 + f * 3.1, pz, 0.8, 1.1, 0.12, -b.ang, win, win, true); }
        if (b.L * b.W > 250) for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {   // the corner towers
          const px = b.x + c * u * (b.L / 2 - 1.6) - s * v * (b.W / 2 - 1.6), pz = b.z + s * u * (b.L / 2 - 1.6) + c * v * (b.W / 2 - 1.6);
          box(g, px, lo - 0.5, pz, 3.6, H + 3.4, 3.6, -b.ang, col, dk); box(g, px, lo + H + 2.9, pz, 3.9, 0.5, 3.9, -b.ang, dk, dk); }
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++;
      }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- DÉPART (the start, on the valley floor): gantry with the start lights, the timing hut, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut: flat-roofed, of the valley's earth colour
      box(gh, hx, hy - 0.4, hz, 4.0, 3.1, 2.8, T.hd[i], [0.74, 0.54, 0.4], [0.62, 0.45, 0.33]); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.26, 0.3], null, true);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
      signAt(sStart + 70, 1, 4);   // VIRAGES DANGEREUX
      signAt(sStart - 60, -1, 2);   // BOUMALNE DADÈS (behind, for the cars coming down)
    }

    /* ---- the checkpoints: a red gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.62, 0.15, 0.1]));

    /* ---- ARRIVÉE (by the river in the gorge): chequered gantry, the gorge's board, the cars' park with cars, people about; the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 18, sdP, 3.2), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the gorge's board: on posts, leaning back
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.36, 0.24, 0.14]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.6, 0.44, 0.34], [0.68, 0.52, 0.4]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 5);
      signAt(sFin + 110, -sdP, 1);   // MSEMRIR ahead
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 10; k++) { const a = -12 + (k % 5) * 6, b = (k < 5 ? -4.5 : 4.5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || k === 2 || k === 7) continue;
        parkOn(caCar, caGround, 4.4, scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[k % carCols.length], R, 0.2)); }
      for (let k = 0; k < 8; k++) { const px = padF.x + (R() - 0.5) * 22, pz = padF.z + (R() - 0.5) * 22; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      out.marks.finish = [padF.x, padF.z];
    }

    /* ---- the viewpoints (def.views): a level gravel terrace beside the road, a low stone wall round its outer half, a few people looking out; the
       car parks at the top of the hairpins (def.parks) with cars ---- */
    {
      const st = [0.62, 0.47, 0.36], top = [0.72, 0.6, 0.48];
      for (const v of views) {
        const g = scen.get(v.x, v.z), y = v.h, rx = v.x - T.px[v.i], rz = v.z - T.pz[v.i], rl = Math.hypot(rx, rz) || 1, oa = Math.atan2(rz / rl, rx / rl), rr = v.r;
        for (let k = -5; k <= 5; k++) { const a = oa + k / 5 * 1.3, px = v.x + Math.cos(a) * rr, pz = v.z + Math.sin(a) * rr; if (vrNear(px, pz).dd < 1.2) continue;
          box(g, px, y - 0.4, pz, 0.5, 1.0, 1.6, -a, st, top); }
        for (let k = 0; k < 3; k++) { const a = oa + (R() - 0.5) * 1.6, d = rr - 1 - R(); const px = v.x + Math.cos(a) * d, pz = v.z + Math.sin(a) * d; if (vrNear(px, pz).dd < 1.5) continue;
          crowdPut(CR, px, y + 0.05, pz, Math.cos(a), Math.sin(a), { col: fans[Math.floor(R() * fans.length)] }, 1); }
        CR.block(v.x, v.z, 2 * rr, 2 * rr, 0);
      }
      for (const p of parks) { const hh = T.hd[p.i], c = Math.cos(hh), sn = Math.sin(hh), n = Math.min(6, Math.floor(p.r / 2.5));
        for (let k = 0; k < n; k++) { const a = (k - (n - 1) / 2) * 2.6, px = p.x + c * a, pz = p.z + sn * a; if (vrNear(px, pz).dd < 1.5 || R() < 0.3) continue;
          parkOn(caCar, caGround, 4.4, scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[k % carCols.length], R, 0.2)); } }
    }

    /* ---- the low parapets where the ground falls away and round the outside of the bends (stone, painted in red and white blocks, as on the
       roads of the Atlas), a marker post every ~50 m where there is none (knockable where it fits: dProps); chevrons on the outside of each hairpin ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), red = [0.74, 0.16, 0.12], white = [0.93, 0.91, 0.86], stone = [0.58, 0.44, 0.34];
      const nearPad = (i) => { for (const p of views.concat(parks)) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 4) return true; return false; };
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || nearPad(i) || bk[si][i]) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.15 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          if (nd[i] && nd[i + 1]) {   // the parapet: its face to the road and its top painted in 2 m blocks, the back the bare stone
            const g = scen.get(T.px[i], T.pz[i]), cc = Math.floor(i * T.ds / 2) % 2 ? red : white, a = Q(i, -0.2), b = Q(i + 1, -0.2), c = Q(i + 1, 0.55), d = Q(i, 0.55);
            const a2 = Q(i, -0.6, 0.45), b2 = Q(i + 1, -0.6, 0.45), c2 = Q(i + 1, 0.55, 0.45), d2 = Q(i, 0.55, 0.45), inn = Q(i, 0.2, 0.22);
            g.quadO(a, b, c, d, cc, inn); g.quadO(a2, b2, c2, d2, stone, inn); g.quadO(d, c, c2, d2, cc, inn);
          } else if (!nd[i] && i % 25 === 0 && i > 2 && i < iE - 2 && !bk[si][i]) mkPosts.push([i, side]);
        }
      }
      const kp = dProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.76, 0.12, 0.1], null, true);
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
        for (const [n, k, o] of [['Vrh serpentin', 3, -40], ['Soteska', 0, -60], ['Vrh serpentin', 5, 60]]) { const q = nm(n); if (q) signAt(sStart + q.d + o, 1, k); } }
    }

    /* ---- spectators, few (fewFans): the start and the finish, the checkpoints, the insides of two hairpins, a group at the saddle ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.1, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.1, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 50, sStart + 40, sd, { rows: 2, dens: 0.45, label: 'D start' }); run(sFin - 50, sFin + 14, sd, { rows: 2, dens: 0.45, label: 'D finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 16, s0 + 14, side, { rows: 1, dens: 0.4, label: 'D cp' }); });
      (def.curves || []).forEach(([d, , turn], k) => { if (k !== 1 && k !== 3) return; const sm = sStart + d; run(sm - 14, sm + 14, turn, { rows: 1, dens: 0.4, label: 'D hairpin ' + (k + 1) }); });
      { const q = T.names.find(n => n.n.startsWith('Vrh serpentin')); if (q) run(sStart + q.d - 20, sStart + q.d + 20, 1, { rows: 1, dens: 0.35, clump: 0.9, label: 'D saddle' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants (instanced per 96 m chunk): the river's green strip (rows of poplars, walnuts, almonds and figs, a few palms, tamarisks on its
       banks); on the steppe and the shrubland sparse low shrubs, none on the rock and the cliffs ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 3, 4, 5].map(k => new IChunks(dTreeGeo(k), tMatT, 96));
    let nTrees = 0, nShrubs = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(60000 * dens), RT = rng(4741), SP = 4 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(260)) continue;
          const c = vrLC(x, z), y = caGround(x, z), rv = rivNear(x, z), oa = rv.k >= 0 ? sstep(60, 18, rv.d) * sstep(7, 2, y - rv.lv) : 0;
          const green = c === 1 || c === 6 || oa > 0.3;
          const p = green ? (rv.k >= 0 && rv.d < 9 ? 0.35 : 0.55) : c === 2 ? 0.3 : c === 0 ? 0.035 : c === 3 ? 0.06 : 0.008;
          if (r1 > p) continue;
          if (rv.k >= 0 && rv.d < 4.5) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.4) continue; if (nn.i >= 0 && nn.dd < 6 && r2 < 0.3) continue;
          if (excluded(x, z)) continue;
          const sl = caSlope(x, z); if (sl > 1.1 || (sl > 0.6 && r2 < (sl - 0.6) / 0.5)) continue;
          let sp, hgt, wid, col;
          if (green) { sp = rv.k >= 0 && rv.d < 12 ? (r3 < 0.6 ? 5 : 0) : r3 < 0.42 ? 0 : r3 < 0.7 ? 1 : r3 < 0.92 ? 4 : 2; }
          else sp = c === 3 && r3 < 0.3 ? 4 : 3;
          if (sp === 0) { hgt = 14 + r4 * 10; wid = hgt * 0.95; col = r2 < 0.3 ? [1.08, 1.06, 0.88] : [0.95 + r2 * 0.1, 1, 0.94]; }
          else if (sp === 1) { hgt = 8 + r4 * 6; wid = hgt * (0.95 + r2 * 0.2); col = [0.95 + r2 * 0.1, 1, 0.95]; }
          else if (sp === 2) { hgt = 7 + r4 * 6; wid = hgt * 0.8; col = [1, 1, 0.95]; }
          else if (sp === 4) { hgt = 4 + r4 * 2.5; wid = hgt * 1.1; col = [0.95 + r2 * 0.12, 1, 0.92]; }
          else if (sp === 5) { hgt = 2.5 + r4 * 2; wid = 2.6 + r2 * 2; col = [0.95 + r3 * 0.1, 1, 0.95]; }
          else { hgt = 0.5 + r4 * 0.7; wid = 0.8 + r2 * 1.1; col = [0.92 + r3 * 0.16, 0.95 + r4 * 0.1, 0.9]; nShrubs++; }
          tk[sp].add(x, y - 0.12, z, r1 * 70, wid, hgt, col);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    tk.forEach((t, k) => t.addTo(root, LOD.tier > 0 || k !== 3));   // (NIZKA: the low shrubs cast no shadow)

    /* ---- the stones and the rock: stones strewn on the steppe by the road, blocks at the foot of the cuts, crags of the red conglomerate where the
       slope rises steep beside the road and out on the gorge's walls ---- */
    {
      const RW = rng(4751), redR = [[0.6, 0.38, 0.27], [0.66, 0.44, 0.32], [0.52, 0.34, 0.27], [0.7, 0.52, 0.38]], grey = [[0.56, 0.5, 0.45], [0.5, 0.45, 0.42]];
      const rockC = () => (RW() < 0.8 ? redR[Math.floor(RW() * redR.length)] : grey[Math.floor(RW() * 2)]);
      API.ROCK_SMOOTH = false;
      for (let s = 6; s < T.len - 6; s += 4.2) for (const side of [-1, 1]) {   // stones on the steppe beside the road
        if (RW() > 0.45) continue; const o = 1.8 + Math.pow(RW(), 1.6) * 34, [x, z] = onSide(s, side, o), sz = 0.18 + RW() * 0.45;
        if (vrNear(x, z).dd < sz + 0.5 || excluded(x, z) || rivNear(x, z).d < 6 || vrLC(x, z) === 1) continue;
        rock(scen.get(x, z), x, caGround(x, z) + sz * 0.2, z, sz * 1.3, sz, sz, RW() * TAU, vary(rockC(), RW, 0.08), RW, 0.35);
      }
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {   // blocks at the foot of the cuts
        if (RW() > 0.32) continue;
        const o = 1.6 + Math.pow(RW(), 1.5) * 30, [x, z] = onSide(s, side, o), sz = 0.5 + RW() * 1.3; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RW() * TAU, vary(rockC(), RW, 0.1), RW, 0.3);
      }
      for (let s = 16; s < T.len - 16; s += 12) for (const side of [-1, 1]) {   // crags where the slope is steep
        if (RW() < 0.3) continue;
        const [x, z] = onSide(s, side, 8 + RW() * 120); if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(110)) continue;
        const sl = caSlope(x, z); if (sl < 0.8) continue;
        const y = caGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RW() * 3), b0 = vary(rockC(), RW, 0.06);
        for (let q = 0; q < n; q++) { const r0 = 2.2 + RW() * 4.5, qx = x + (RW() - 0.5) * 10, qz = z + (RW() - 0.5) * 10, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0, r0 * (0.9 + RW() * 0.9), r0 * (0.7 + RW() * 0.4), RW() * TAU, vary(b0, RW, 0.07), RW, 0.35); }
      }
    }

    /* ---- the view beyond the corridor (def.farDem: the red ridges round the valley; irFar, World.update moves it with the camera); finish the meshes ---- */
    const FAR = API.irFar ? API.irFar(dFarCol) : null; if (FAR) { FAR.mesh.visible = false; root.add(FAR.mesh); out.dyn.irFar = FAR; }   // (hidden until the first World.update)
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: dAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: dAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, shrubs: nShrubs, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), walls: nWall, river: nRiver, views: views.length, parks: parks.length, far: !!FAR };   // (read by the tests)
    return out;
  }

  World.keep('VR', 'dades');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.dades = (scene, tex, opts) => buildDades(scene, tex, opts);
})();
