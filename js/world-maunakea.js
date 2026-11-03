/* =========================================================================
   WORLD — Mauna Kea (theme 'maunakea'): its own builder (World.ext.maunakea), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRHC, VRT, atSf, box, caGCol, caGround, caPlantGeo, caProps, caSlope, caTileGeo, clamp, crowdCtx, crowdFinish,
    crowdPut, crowdRun, cyl, ico, lerp, ouCutMat, pkGroundMat, rng, rock, rpHash, sstep, stubExcl, stubGeo, stubProps, stubVerge, tuftWindMat,
    valueNoise2, vary, vrDem, vrDist, vrGritTex, vrLCf, vrNear, vrPrep, vrStubAt, vrStubs
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= MAUNA KEA (theme 'maunakea') =================
     The summit road of Mauna Kea (the island of Hawaiʻi), its paved upper part: from the end of the gravel at ~3,600 m past the cinder cones and
     the old lava, through two hairpins and round the summit cone to the domes on the summit ridge (~4,200 m), on a clear, dry afternoon above the
     sea of clouds: a deep blue sky, a strong high sun. The ground: cinders and ash in red-brown, black and grey-brown (oxidised scoria on the cones'
     flanks, darker lava and lighter, weathered ash between them, fans of loose cinder down the fall line), fields of lava boulders and cinder bombs,
     hardly any plants (a few silvery tufts of grass and low shrubs at the bottom, none on the top: the real summit is bare). Built on Vršič's
     corridor (vrPrep, def.dem, def.lc) and Los Caracoles' terrain (caGround and the tiles, coloured by maCol through VR.col), with a look of its
     own: the asphalt with its double yellow line between the gravel below the start and past the finish (def.paved), retaining walls of dark
     basalt where the road is carried over a drop, low cinder berms and steel rails where the ground falls away, white
     posts, chevrons round the hairpins, generic signs and mile posts; the car parks (def.parks), the side roads (def.sideRoads: stubGeo and stubProps,
     American boards) and the service roads drawn on the ground (def.lanes); the observatories as plain white and silver domes, buildings and radio
     dishes without names or markings (def.obs); beyond the corridor the mountain's flanks (def.farDem), the sea of clouds and the neighbouring
     volcanoes on the horizon (def.far), drawn on the camera's far shell (maFar). Nothing religious, no names of firms or brands anywhere. */
  const MACOL = [0, 0, 0];
  function maCol(x, z, h, ny, sz, dd, sx) {   // ground colour (times the grey grit map)
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), r = P.c3(x, z), f = P.n4(x, z), o = P.c4(x, z);
    let R = 0.33 + (q - 0.5) * 0.07, G = 0.3 + (q - 0.5) * 0.065, B = 0.285 + (q - 0.5) * 0.06;   // grey-brown cinder and ash
    const red = sstep(0.58, 0.85, m) * 0.75; R = lerp(R, 0.42, red); G = lerp(G, 0.27, red); B = lerp(B, 0.22, red);   // the red-brown, oxidised scoria
    const blk = sstep(0.6, 0.86, o) * (1 - 0.6 * red) * 0.55; R = lerp(R, 0.17, blk); G = lerp(G, 0.165, blk); B = lerp(B, 0.165, blk);   // black lava and fresh cinder
    const ash = sstep(0.6, 0.88, r) * (1 - blk) * 0.4; R = lerp(R, 0.5, ash); G = lerp(G, 0.47, ash); B = lerp(B, 0.43, ash);   // pale, weathered ash and till
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.074; B += (f - 0.5) * 0.068;   // (the fine grain: patches of coarser and finer cinder)
    const st = sstep(0.86, 0.6, ny);   // the steep flanks of the cones: redder, in streaks down the fall line
    if (st > 0) { const hz = Math.hypot(sx || 0, sz) || 1, u = (z * (sx || 0) - x * sz) / hz, wv = Math.sin(u * 0.19 + P.c5(x, z) * 6 + P.n2(x, z) * 4), k = 0.92 + 0.09 * wv;
      R = lerp(R, 0.42 * k, st * 0.45); G = lerp(G, 0.28 * k, st * 0.45); B = lerp(B, 0.23 * k, st * 0.45); }
    const gr = vrLCf(x, z, 1) * sstep(3950, 3700, A) * 0.5; R = lerp(R, 0.45, gr); G = lerp(G, 0.42, gr); B = lerp(B, 0.33, gr);   // a tinge of grass low down
    const bu = vrLCf(x, z, 3) * 0.6; R = lerp(R, 0.55, bu); G = lerp(G, 0.52, bu); B = lerp(B, 0.49, bu);   // the graded pads round the domes
    const wt = vrLCf(x, z, 5); R = lerp(R, 0.16, wt); G = lerp(G, 0.2, wt); B = lerp(B, 0.24, wt);
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.5; R = lerp(R, 0.26, t); G = lerp(G, 0.24, t); B = lerp(B, 0.23, t); }   // the verge, packed dark cinder
    MACOL[0] = R; MACOL[1] = G; MACOL[2] = B; return MACOL;
  }
  function maTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse ring (10 m cells); round the observatories and the antenna too
    const G = API.VR.G, L = VRC * VRT, x = G.x0 + (ti + 0.5) * L, z = G.z0 + (tj + 0.5) * L, d = vrDist(x, z);
    if (d < 300) return 1; if (d < 430) return 2;
    for (const o of T.def.obs || []) if (Math.hypot(x - o[0], z - o[1]) < 140) return 2;
    return 0;
  }
  let maATex = null, maAKey = '', maA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function maAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the board at the top, the banner; row 7: the chevrons
    const key = cps.join('|') + '|' + finA; if (maATex && maAKey === key) return maATex;
    if (maATex) maATex.dispose(); maAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 104, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(262, 142, 500, 100); txt('FINISH', 512, 196, 92, '#111', 480);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#7c2e1c'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#5a3a22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#efe3c8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('MAUNA KEA', 512, 812, 58, '#f3ead6', 900); txt(finA, 512, 862, 46, '#f3ead6', 900);
    for (const [k, dir] of [[0, 1], [1, -1]]) {   // the chevrons: black arrows on yellow, pointing the way the road turns
      const x0 = k * 128, y0 = 896; x.fillStyle = '#f1c21b'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#16181c';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    x.fillStyle = '#f2efe6'; x.fillRect(256, 896, 768, 128); x.fillStyle = '#7c2e1c'; x.fillRect(256, 900, 768, 9); x.fillRect(256, 1011, 768, 9);   // the banner
    txt('MAUNA KEA · SUMMIT ROAD', 640, 962, 60, '#7c2e1c', 740);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (maATex = t);
  }
  // the road signs (generic, as along any mountain road in the state: no agency's name or badge): two a row, 512 x 128; row 4: the mile posts
  // (128 x 128, green with the number), row 5: the speed and the side roads' plates
  const MA_BOARDS = [['PAVEMENT BEGINS', '#f1c21b'], ['USE LOW GEAR', '#f1c21b'], ['SPEED LIMIT 25', '#f2f2ee'], ['WATCH FOR ICE', '#f1c21b'], ['ELEV 12,000 FT', '#6b4a22'], ['ELEV 13,000 FT', '#6b4a22'], ['LAKE WAIAU TRAIL', '#6b4a22'], ['SUMMIT AREA', '#6b4a22']];
  const MA_MILE0 = 10;   // (the first mile post's number on the atlas)
  function maAtlas2() {
    if (maA2Tex) return maA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w); };
    MA_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = Math.floor(k / 2) * 128, dark = bg === '#f1c21b' || bg === '#f2f2ee';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = dark ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, 50, dark ? '#16181c' : '#f2f2ee', 470); });
    for (let k = 0; k < 8; k++) { const x0 = k * 128, y0 = 512; x.fillStyle = '#1f6b3a'; x.fillRect(x0, y0, 128, 128); x.strokeStyle = '#f2f2ee'; x.lineWidth = 5; x.strokeRect(x0 + 7, y0 + 7, 114, 114);
      txt('MILE', x0 + 64, y0 + 36, 26, '#f2f2ee', 110); txt(String(MA_MILE0 + k), x0 + 64, y0 + 84, 58, '#f2f2ee', 110); }
    x.fillStyle = '#f2f2ee'; x.fillRect(0, 640, 1024, 128);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (maA2Tex = t);
  }
  function maPlantGeo(kind) {   // unit plants and stones (height 1; the instances scale and tint them): 0 a silvery tuft of bunch grass, 1 a low silver-green shrub,
    // 2 cinder bombs and lava stones half sunk in the ash (Los Caracoles' scree stones, re-coloured by the instances)
    if (kind === 0) return caPlantGeo(0);
    if (kind === 2) return caPlantGeo(4);
    const g = new GB(), R = rng(781), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const col = [0.56, 0.6, 0.52];
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + R() * 0.5, d = k ? 0.26 : 0; ico(g, Math.cos(a) * d, 0.42 - d * 0.3, Math.sin(a) * d, 0.34, 0.8, vary(col, R, 0.14), R, 0.4); }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the observatories: plain shapes, white and silver, no names or markings. A dome (d across, h high): its drum and a hemisphere with the closed
  // shutter's slit (a darker band over the top), a dark ring at the eave; facing rot
  function maDome(g, x, y, z, d, h, rot, R) {
    const r = d / 2, hd = Math.max(1.5, h - r), n = 18, drum = vary([0.9, 0.9, 0.88], R, 0.04), dome = [0.95, 0.96, 0.96], slit = [0.7, 0.72, 0.74], ring = [0.36, 0.37, 0.4];
    cyl(g, x, y - 1, z, r, hd + 1, n, drum);
    cyl(g, x, y + hd - 0.6, z, r * 1.01, 0.6, n, ring);
    const inn = [x, y + hd * 0.5, z], rows = 5, pt = (k, q) => { const a = rot + k / n * TAU, e = q / rows * Math.PI / 2, rr = r * Math.cos(e); return [x + Math.cos(a) * rr, y + hd + r * Math.sin(e) * 0.96, z + Math.sin(a) * rr]; };
    for (let q = 0; q < rows; q++) for (let k = 0; k < n; k++) {
      const a = pt(k, q), b = pt(k + 1, q), c = pt(k + 1, q + 1), dd = pt(k, q + 1), sl = k === 0 || k === n - 1 ? slit : null, sh = 0.93 + 0.07 * (q / rows);
      const col = sl || [dome[0] * sh, dome[1] * sh, dome[2] * sh];
      if (q === rows - 1) g.triO(a, b, c, col, inn); else g.quadO(a, b, c, dd, col, inn);
    }
  }
  function maDish(g, x, y, z, d, h, az, el) {   // a radio dish (d across) on its pedestal (the hub h up), pointed at az (from north, clockwise) and el (from the horizon)
    const r = d / 2, ped = [0.84, 0.84, 0.82], dish = [0.93, 0.93, 0.92], back = [0.78, 0.78, 0.77];
    cyl(g, x, y - 0.5, z, Math.max(0.6, d * 0.06), h + 0.5, 8, ped, null, Math.max(0.45, d * 0.045));
    box(g, x, y + h - d * 0.05, z, d * 0.16, d * 0.12, d * 0.16, az, ped);
    const ax = Math.sin(az) * Math.cos(el), ay = Math.sin(el), azz = -Math.cos(az) * Math.cos(el);   // the dish's axis (x east, z south)
    let ux = Math.cos(az), uy = 0, uz = Math.sin(az); const vx = ay * uz - azz * uy, vy = azz * ux - ax * uz, vz = ax * uy - ay * ux;   // two axes across it
    const c0 = [x + ax * d * 0.08, y + h + ay * d * 0.08, z + azz * d * 0.08], n = 14, depth = d * 0.16, rings = [[0, 0.12], [0.55, 0.04], [1, 0]];
    const P = (k, q) => { const a = k / n * TAU, rr = r * rings[q][0], dp = depth * (1 - rings[q][0] * rings[q][0]); return [c0[0] + (Math.cos(a) * ux + Math.sin(a) * vx) * rr + ax * (depth - dp), c0[1] + (Math.cos(a) * uy + Math.sin(a) * vy) * rr + ay * (depth - dp), c0[2] + (Math.cos(a) * uz + Math.sin(a) * vz) * rr + azz * (depth - dp)]; };
    const front = [c0[0] + ax * 50, c0[1] + ay * 50, c0[2] + azz * 50], behind = [c0[0] - ax * 50, c0[1] - ay * 50, c0[2] - azz * 50];
    for (let q = 0; q < 2; q++) for (let k = 0; k < n; k++) { const a = P(k, q), b = P(k + 1, q), c = P(k + 1, q + 1), dd = P(k, q + 1);
      g.quadO(a, b, c, dd, dish, behind); g.quadO(a, b, c, dd, back, front); }   // (the bright bowl towards the sky, the grey back)
    cyl(g, c0[0] + ax * depth * 0.9, c0[1] + ay * depth * 0.9 - 0.15, c0[2] + azz * depth * 0.9, Math.max(0.12, d * 0.02), 0.3, 5, back);   // (the feed)
  }
  // the view beyond the corridor: the mountain's flanks (def.farDem) above the cloud tops, the sea of clouds out to the horizon, the volcanoes
  // standing out of it (def.far's rings: Mauna Loa, Hualālai, Haleakalā on Maui). One mesh, its nodes kept in world coordinates (P0) and drawn on
  // the camera's lines of sight just inside its far plane, at a radius that grows with the log of their real distance (so 40 km and 140 km stay
  // apart: no flicker between the clouds and the mountains); hazed towards the fog's colour with the distance (maFarUpdate, World.update)
  const MA_CLOUD = 2050;   // the cloud tops (m above the sea): the trade-wind inversion, below the summit's ~4,200 m
  function maFar(season) {
    const F = T.def.farDem, FR = T.def.far; if (!F || !FR) return null;
    const base = API.VR.D.base, cloud = MA_CLOUD - base, P0 = [], C = [], I = [], HZ = [], snow = season === 'winter' ? 3300 : 1e9;
    const lava = (A, q, sl) => {   // the flanks: cinder and lava above ~3,000 m, the māmane and grass woodland lower down (olive), snow in winter
      let c = [0.36 + q * 0.06, 0.3 + q * 0.04, 0.27 + q * 0.03];
      const red = sstep(0.2, 0.5, q); c = [lerp(c[0], 0.44, red * 0.5), lerp(c[1], 0.3, red * 0.5), lerp(c[2], 0.25, red * 0.5)];
      const veg = sstep(3050, 2700, A) * 0.8; c = [lerp(c[0], 0.33, veg), lerp(c[1], 0.32, veg), lerp(c[2], 0.26, veg)];
      const sn = sstep(snow - 150, snow + 200, A + q * 300); c = [lerp(c[0], 0.95, sn), lerp(c[1], 0.96, sn), lerp(c[2], 0.99, sn)];
      return c.map(v => v * (0.94 + 0.12 * Math.tanh(sl)));
    };
    // the flanks: the grid's nodes above the cloud tops and outside the corridor
    const dRoad = (x, z) => { let m = 1e18; for (let q = 0; q < T.N; q += 8) { const dx = x - T.px[q], dz = z - T.pz[q], d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };   // (vrDist's grid ends ~460 m out)
    const nx = F.nx, nz = F.nz, fb = atob(F.b64), Hf = (i, j) => F.lo + fb.charCodeAt(clamp(j, 0, nz - 1) * nx + clamp(i, 0, nx - 1)) * F.step, id = new Int32Array(nx * nz).fill(-1);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const A = Hf(i, j), x = F.x0 + i * F.cell, z = F.z0 + j * F.cell; if (A < MA_CLOUD - 600) continue; const dr = dRoad(x, z);
      const sl = ((Hf(i - 1, j) - Hf(i + 1, j)) * 0.6 + (Hf(i, j + 1) - Hf(i, j - 1)) * 0.5) / (2 * F.cell) * 3, q = rpHash(i, j);
      id[j * nx + i] = P0.length / 3; P0.push(x, Math.max(A - base, cloud - 200), z); C.push(...lava(A, q, sl)); HZ.push(sstep(900, 450, dr) * 0.5);   // (the edge well under the cloud tops: hidden)
    }
    const DR = HZ.map((h, k) => dRoad(P0[k * 3], P0[k * 3 + 2])), dr0 = (k) => DR[k];
    for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) { const a = id[j * nx + i], b = id[j * nx + i + 1], c = id[(j + 1) * nx + i], d = id[(j + 1) * nx + i + 1];
      if (a < 0 || b < 0 || c < 0 || d < 0 || (dr0(a) + dr0(b) + dr0(c) + dr0(d)) / 4 < 420 || Math.max(P0[a * 3 + 1], P0[b * 3 + 1], P0[c * 3 + 1], P0[d * 3 + 1]) < cloud - 150) continue; I.push(a, c, b, b, c, d); }
    // the sea of clouds: a polar grid round the road, out to the horizon, its tops in soft heaps (whiter where they rise, blue-grey in the hollows)
    const nI0 = I.length, cx = FR.x, cz = FR.z, NA = 72, RR = [];
    for (let r = 1800; r < 190000; r *= 1.22) RR.push(r);
    const c0 = P0.length / 3, cn = valueNoise2(931, 1), RC = rng(9311);
    for (let k = 0; k < RR.length; k++) for (let a = 0; a < NA; a++) {
      const az = (a + (k % 2) * 0.5) / NA * TAU, r = RR[k], x = cx + Math.sin(az) * r, z = cz - Math.cos(az) * r, heap = cn(x / 900, z / 900), y = cloud + (heap - 0.5) * 300, t = 0.88 + 0.17 * heap + (RC() - 0.5) * 0.04;
      P0.push(x, y, z); C.push(0.96 * t, 0.97 * t, 0.99 * t); HZ.push(-1); }
    for (let k = 0; k + 1 < RR.length; k++) for (let a = 0; a < NA; a++) { const p = c0 + k * NA + a, q = c0 + k * NA + (a + 1) % NA, r = c0 + (k + 1) * NA + a, s = c0 + (k + 1) * NA + (a + 1) % NA; I.push(p, q, r, q, s, r); }   // (facing up)
    // the volcanoes on the horizon: def.far's rings as a surface in rings and directions round the road (each node at the ring's highest ground),
    // only where it stands out of the clouds (the quads with a corner above them; the rest of it under the cloud tops)
    const nI1 = I.length, fb2 = atob(FR.b64), NA2 = FR.na, NR = FR.r.length, HR = (k, a) => FR.lo + fb2.charCodeAt(k * NA2 + ((a % NA2) + NA2) % NA2) * FR.step, vid = new Int32Array(NR * NA2).fill(-1);
    const node = (k, a) => { a = ((a % NA2) + NA2) % NA2; const q = k * NA2 + a; if (vid[q] >= 0) return vid[q];
      const az = a / NA2 * TAU, r = FR.r[k], A = HR(k, a) * 0.5 + (HR(k, a - 1) + HR(k, a + 1)) * 0.25, x = cx + Math.sin(az) * r, z = cz - Math.cos(az) * r, sl = (HR(k, a + 1) - HR(k, a - 1)) / 900, c = lava(Math.max(A, MA_CLOUD), rpHash(k, a), Math.sin(az - 3.9) * sl * 3);
      vid[q] = P0.length / 3; P0.push(x, Math.max(A, MA_CLOUD - 220) - base, z); C.push(...c); HZ.push(0); return vid[q]; };
    for (let k = 0; k + 1 < NR; k++) for (let a = 0; a < NA2; a++) {
      if (Math.max(HR(k, a), HR(k, a + 1), HR(k + 1, a), HR(k + 1, a + 1)) < MA_CLOUD + 20) continue;
      const p = node(k, a), q = node(k, a + 1), r = node(k + 1, a), t = node(k + 1, a + 1); I.push(p, q, r, q, t, r); }   // (facing up)
    const g = new THREE.BufferGeometry(), nv = P0.length / 3;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
    g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(HZ), 1)); g.setIndex(I); g.computeVertexNormals();
    // the projection onto the far shell in the vertex shader (uR: its inner and outer radius, 0 = none: the nodes' own places): no work per frame in JS
    const U = { uHz: { value: new THREE.Color(0xc8d6e2) }, uR: { value: new THREE.Vector2(0, 0) }, uCam: { value: new THREE.Vector3() } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false });   // (uCam: a Lambert material gets no cameraPosition)
    m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz; sh.uniforms.uR = U.uR; sh.uniforms.uCam = U.uCam;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nuniform vec2 uR;\nuniform vec3 uCam;\nvarying float vHz;')
        .replace('#include <project_vertex>', [   // (the mesh at the world's origin: its positions are world positions)
          'vec3 maD = transformed - uCam; float maL = max( 1.0, length( maD ) );',
          'if ( uR.y > 0.0 ) { float maU = clamp( ( log( maL ) - 5.9915 ) / 6.2146, 0.0, 1.0 ); transformed = uCam + maD * ( ( uR.x + ( uR.y - uR.x ) * maU ) / maL ); }',   // (log 400 m .. log 200 km)
          'vHz = uR.y > 0.0 ? ( aHz < 0.0 ? 0.25 * ( 1.0 - exp( -maL / 60000.0 ) ) : max( aHz, 0.12 + 0.6 * ( 1.0 - exp( -maL / 90000.0 ) ) ) ) : 0.4;',   // (the clouds bright, a little haze far out; the land hazed with the distance)
          '#include <project_vertex>'].join('\n'));
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
    m.customProgramCacheKey = () => 'maFar'; m.userData.noCloud = true;
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'maFar';
    mesh.onBeforeRender = (r, sc, cam) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); if (cam && cam.isPerspectiveCamera && cam.far > 50 && U.on) { U.uR.value.set(cam.far * 0.7, cam.far - 4); U.uCam.value.setFromMatrixPosition(cam.matrixWorld); } else U.uR.value.set(0, 0); };
    return { mesh, U, nv, parts: [nI0, nI1, I.length] };   // (the index ranges: the flanks, the clouds, the horizon)
  }
  function maFarUpdate(F, cam) { F.mesh.visible = true; F.U.on = !!cam; }   // (no camera: the nodes' own places, the world test's pose; hidden until the first update: a view of the world without the game's loop, as the menu's model, has none)
  function maCar(g, x, y, z, rot, col, tall) {   // a parked 4x4 or van (taller than caCar's car)
    const c = Math.cos(rot), s = Math.sin(rot), hb = tall ? 1.25 : 0.95, L = tall ? 5.0 : 4.6;
    box(g, x, y + 0.3, z, L, hb, 1.95, rot, col, null, true); box(g, x - c * 0.3, y + 0.3 + hb, z - s * 0.3, L * 0.62, 0.62, 1.8, rot, [0.14, 0.17, 0.21], col, true);
    for (const [a, b] of [[1.5, 0.85], [1.5, -0.85], [-1.5, 0.85], [-1.5, -0.85]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.78, 0.78, 0.28, rot, [0.08, 0.08, 0.09], null, true);
  }
  function buildMaunakea(scene, tex, opts) {
    const R = rng(4111), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.45, 0.4, 0.37] };
    vrPrep(); vrStubs();
    const P = API.VR, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(941, 120); P.c2 = valueNoise2(942, 48); P.c3 = valueNoise2(943, 70); P.c4 = valueNoise2(944, 95); P.c5 = valueNoise2(945, 22);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]]; P.col = maCol;   // (caTileGeo, caGCol: this road's colours)
    const paved = T.pavedAt || new Uint8Array(N);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the domes and boulders between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles for the plants and the boulders, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    // level plots: the car parks (def.parks) at the road's height beside it, out on the ridges at the ground's; the observatories' pads
    const parks = [];
    for (const [x0, z0, r0, d0] of def.parks || []) { let x = x0, z = z0; const r = clamp(r0, 6, 20), n = vrNear(x, z), near = n.i >= 0 && d0 < 60;
      if (near) { const i = n.i, sd = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] >= 0 ? 1 : -1, o = Math.max(Math.abs(d0), (sd > 0 ? T.br[i] : T.bl[i]) + r + 1.2); x = T.px[i] + T.nx[i] * sd * o; z = T.pz[i] + T.nz[i] * sd * o; }   // (beside the road, past its barrier line: the lot opens onto it)
      const pad = { x, z, r, b: 10, h: near ? T.hy[n.i] - 0.2 : vrDem(x, z), near }; P.pads.push(pad); parks.push(pad); exclPush(x, z, pad.r + 2); }
    const obs = [];
    for (const o0 of def.obs || []) { const o = o0.slice(), k = o[2]; if (k === 1) { o[3] *= 0.9; o[4] *= 0.9; }   // (the footprint's bounding box: a little smaller)
      const rad = k === 1 ? Math.hypot(o[3], o[4]) / 2 : o[3] / 2; let x = o[0], z = o[1];
      const i = T.nearestIdx(x, z), lat = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], sd = lat >= 0 ? 1 : -1, need = (sd > 0 ? T.br[i] : T.bl[i]) + rad + 1.5;
      if (Math.abs(lat) < need && Math.abs((x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i]) < rad + 4) { x += T.nx[i] * sd * (need - Math.abs(lat)); z += T.nz[i] * sd * (need - Math.abs(lat)); }   // (clear of the road: the footprints reach its edge)
      o[0] = x; o[1] = z;
      const nearR = Math.hypot(x - T.px[i], z - T.pz[i]) < rad + 40, pad = { x, z, r: rad + 2, b: 8, h: nearR ? T.hy[i] - 0.3 : vrDem(x, z) };
      if (k !== 2 || o[3] > 10) P.pads.push(pad); obs.push({ o, pad, rad }); exclPush(x, z, rad + 3); }
    out.marks = { domes: obs.filter(q => q.o[2] === 0).length, parks: parks.length };   // (read by the tests)

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat();
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = maTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(caTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the road: asphalt (def.paved) with white edge lines and a double yellow centre line; the cinder gravel below the start and past the
       finish; a shoulder of dark cinder, then the verge out past the barrier line onto the ground. Where the ground drops away below the barrier
       line a retaining wall of dark basalt carries the verge (its face down the slope) (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.045, shininess: 5, specular: 0x14110d, vertexColors: true });
    sMat.color.setRGB(0.86, 1.03, 1.33);   // (the makadam's warm beige turned grey: the cinder's colour comes from the vertex colours)
    const gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.6;
    const WALL = [new Uint8Array(N), new Uint8Array(N)];   // 1: a retaining wall below the road
    // the room on each side before another leg of the road (a hairpin's): the verges stop half way, so the two legs' verges do not overlap
    const ROOM = [new Float32Array(N).fill(1e9), new Float32Array(N).fill(1e9)];
    for (let i = 0; i < N; i++) { const cx = Math.floor(T.px[i] / VRHC) - P.cx0, cz = Math.floor(T.pz[i] / VRHC) - P.cz0;
      for (let b = Math.max(0, cz - 1); b <= Math.min(P.ncz - 1, cz + 1); b++) for (let a = Math.max(0, cx - 1); a <= Math.min(P.ncx - 1, cx + 1); a++) { const L = P.cells[b * P.ncx + a]; if (!L) continue;
        for (const j of L) { if (Math.abs(j - i) * T.ds < 45) continue; const dx = T.px[j] - T.px[i], dz = T.pz[j] - T.pz[i], lat = dx * T.nx[i] + dz * T.nz[i], al = dx * T.tx[i] + dz * T.tz[i];
          if (Math.abs(al) > 8 || Math.abs(lat) > 40) continue; const si = lat > 0 ? 1 : 0; if (Math.abs(lat) < ROOM[si][i]) ROOM[si][i] = Math.abs(lat); } } }
    const KIN = [-1, 1].map(side => { const a = new Float32Array(N); for (let i = 0; i < N; i++) { let m = 0; for (let j = Math.max(1, i - 6); j <= Math.min(N - 2, i + 6); j++) { const dh = T.hd[j + 1] - T.hd[j - 1], kk = (dh - TAU * Math.round(dh / TAU)) / (2 * T.ds); if (side * kk > m) m = side * kk; } a[i] = m; } return a; });   // (the sharpest curvature within 12 m, towards that side)
    const SB = stubGeo({ gCol: caGCol, paveC: [0.8, 0.8, 0.81], gravC: [0.66, 0.6, 0.57], shC: [0.5, 0.47, 0.45], line: 'solid' });   // the side roads (their mouths; their surfaces in the road's chunks below)
    const vProf0 = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w, si = side > 0 ? 1 : 0, kin = KIN[si][i], half = Math.min(ROOM[si][i] / 2, kin > 1e-4 ? 0.75 / kin : 1e9);   // (and on the inside of a tight bend short of its centre: never folded over)
      const ms = stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;   // (a side road's mouth: no ditch, the verge at its surface)
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (half < bar + 1.9) { const o2 = Math.max(e + sw + 0.3, Math.min(bar + 0.45, half - 0.6)), o3 = Math.max(o2 + 0.2, half - 0.3), o4 = Math.max(o3 + 0.2, half);   // (between two legs: the verge to half way)
        return [[e + sw, -0.02], lift(Math.max(e + sw + 0.15, Math.min(bar - 0.7, o2 - 0.2)), -0.12), lift(o2, -0.3), lift(o3, -0.2), [o4, gAt(o4) + 0.03]]; }
      if (gAt(bar + 0.45) < -2.6) { WALL[si][i] = 1; return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]]; }
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.1), [bar + 0.45, Math.min(-0.22, gAt(bar + 0.45) - 0.15)], lift(bar + 1.15, -0.18), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };   // (a shallow swale of cinder at the barrier line)
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf0(i, side)); return a; });
    let nWall = 0;
    {
      const offsA = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8, tileG = 7;
      const shadeA = (i, o) => { const rl = T.rl[i]; let k = 0.8 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const grav = [0.66, 0.6, 0.57];   // (the cinder gravel: dark grey-brown)
      const colsG = (i) => { const rl = clamp(T.rl[i], -w + 1.9, w - 1.9); return [-w, -w + 0.45, rl - 1.6, rl - 1.15, rl - 0.65, rl - 0.2, rl + 0.2, rl + 0.65, rl + 1.15, rl + 1.6, w - 0.45, w]; };
      const shadeG = (i, o) => { const a = Math.abs(o - T.rl[i]), trk = sstep(0.42, 0.68, a) * sstep(1.4, 1.12, a), ao = Math.abs(o);
        let k = 1.0 - 0.18 * trk + 0.05 * sstep(0.45, 0.18, a); k += 0.06 * sstep(w - 1.2, w - 0.3, ao) * (1 - trk); k *= 0.94 + 0.12 * P.n2(T.px[i] * 0.7 + 50, T.pz[i] * 0.7);
        return [grav[0] * k, grav[1] * k, grav[2] * k]; };
      const wht = [0.95, 0.95, 0.92], ylw = [0.96, 0.76, 0.16], gc = [0.4, 0.37, 0.35];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i], wl = WALL[si][i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (wl === 1 && (k === 1 || k === 2)) { const q = 0.88 + 0.16 * rpHash(i >> 1, 47 + si); return k === 1 ? [0.36 * q, 0.34 * q, 0.33 * q] : [0.24 * q, 0.23 * q, 0.23 * q]; }   // (the basalt wall's coping, its face)
          if (k === 4) return caGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return maCol(x, z, T.hy[i] + y, 1 / l, 0, Math.max(0, o - bar), 0).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gg = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1;
          if (paved[i] && paved[j]) {
            const v0 = i * T.ds / tileL, v1 = j * T.ds / tileL;
            for (let c = 0; c < offsA.length - 1; c++) { const o0 = offsA[c], o1 = offsA[c + 1];
              gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shadeA(i, o0), shadeA(i, o1), shadeA(j, o1), shadeA(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
            for (const [o0, o1] of SB.edges(i, j, [[-(w - 0.25), -(w - 0.4)], [w - 0.4, w - 0.25]])) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
            for (const [o0, o1] of [[-0.21, -0.09], [0.09, 0.21]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [ylw, ylw, ylw, ylw]);
          } else {
            const v0 = i * T.ds / tileG, v1 = j * T.ds / tileG, oi = colsG(i), oj = colsG(j);
            for (let c = 0; c < oi.length - 1; c++) { const a0 = oi[c], a1 = oi[c + 1], b0 = oj[c], b1 = oj[c + 1];
              gg.quadUp(Pt(i, a0, 0.02), Pt(i, a1, 0.02), Pt(j, b1, 0.02), Pt(j, b0, 0.02), [shadeG(i, a0), shadeG(i, a1), shadeG(j, b1), shadeG(j, b0)], [[(a0 + w) / tileG, v0], [(a1 + w) / tileG, v0], [(b1 + w) / tileG, v1], [(b0 + w) / tileG, v1]]); }
          }
          const s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], wi = WALL[si][i], wj = WALL[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]), cs = [ci[k], ci[k + 1], cj[k + 1], cj[k]], uv = [wuv(a), wuv(b), wuv(c), wuv(d)];
              if (k === 1 && (wi === 1 || wj === 1)) { gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), uv, cs); nWall++; }   // (the wall's face: out, towards the slope below)
              else gv.quadUp(a, b, c, d, cs, uv); }
          }
        }
        SB.emit(c0, c0 + 60, gr, gs, gl);   // (the side roads whose junctions are in this chunk)
        addM(gr, aMat); addM(gg, sMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
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
    const scen = new Chunks(110), oCh = new Chunks(160), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the race's boards, ban2: the signs; oCh: the observatories)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const shirts = [[0.92, 0.3, 0.12], [0.95, 0.95, 0.95], [0.12, 0.24, 0.6], [0.95, 0.75, 0.16], [0.2, 0.45, 0.3], [0.2, 0.2, 0.22], [0.55, 0.75, 0.9], [0.75, 0.2, 0.2]];   // (warm jackets: it is cold up there)
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false, shirts }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - Math.floor(k / 2) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a road sign of the second atlas: [v0, v1, u0, u1]
    const sign = (s, side, k, facing, h) => {   // a road sign on a post beside the road, facing the cars coming up (facing 1) or down (-1)
      const [bx, bz, bi] = onSide(s, side, 1.2); if (excluded(bx, bz)) return; const by = caGround(bx, bz), [v0, v1, u0, u1] = board(k);
      box(scen.get(bx, bz), bx, by - 0.2, bz, 0.1, (h || 2.2) + 0.5, 0.1, T.hd[bi], [0.6, 0.61, 0.63]);
      bannerQ(bx, by + (h || 2.2) - 0.3, bz, -T.tx[bi] * facing, -T.tz[bi] * facing, 2.6, 0.65, v0, v1, u0, u1, ban2); exclPush(bx, bz, 1.5); CR.avoid(bx, bz, 0.8);
    };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 11.2, 1.4, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || shirts[Math.floor(R() * shirts.length)] }, 1);
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the start (past the end of the gravel): a gantry with the start lights, a timing hut; the finish on the summit ridge: a chequered gantry,
       the brown board with the altitude; the checkpoints: gantries "CPn  altitude"; the banner over the road below the start ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 6, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.9, 0.9, 0.88], [0.5, 0.5, 0.52], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); box(gh, hx, hy + 2.7, hz, 4.4, 0.2, 3.2, T.hd[i], [0.5, 0.5, 0.52]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      for (let k = 0; k < 8; k++) { const [px, pz] = onSide(sStart - 30 + k * 6, k % 2 ? 1 : -1, 2 + R() * 4); if (vrNear(px, pz).dd < 1 || excluded(px, pz)) continue; person(px, pz, R() * TAU); }
      { const ib = T.idx(sStart - 70), bx = T.px[ib], bz = T.pz[ib], by = T.hy[ib], L1 = T.bl[ib] + 0.9, L2 = T.br[ib] + 0.9, g = scen.get(bx, bz);   // the banner on two poles
        for (const o of [-L1, L2]) box(g, bx + T.nx[ib] * o, by - 0.4, bz + T.nz[ib] * o, 0.25, 6.4, 0.25, T.hd[ib], [0.62, 0.63, 0.66]);
        const [v0, v1] = row(7); bannerQ(bx + T.nx[ib] * (L2 - L1) / 2, by + 4.6, bz + T.nz[ib] * (L2 - L1) / 2, T.tx[ib], T.tz[ib], L1 + L2, 1.3, v0, v1, 0.25, 1); exclPush(bx, bz, Math.max(L1, L2) + 3); }
    }
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.48, 0.18, 0.11]));
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const [sx, sz, si] = onSide(sFin + 22, 1, 3), sy = caGround(sx, sz), gs = scen.get(sx, sz), W2 = 6, H2 = W2 / 8;   // the brown board on two posts
      for (const o of [-2.4, 2.4]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy - 0.2, pz, 0.24, 2.4, 0.24, T.hd[si], [0.36, 0.24, 0.14]); }
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, -T.tx[si], -T.tz[si], W2, H2, v0, v1); }
      exclPush(sx, sz, 5);
      for (let k = 0; k < 10; k++) { const [px, pz] = onSide(sFin - 40 + k * 8, k % 2 ? 1 : -1, 2 + R() * 5); if (vrNear(px, pz).dd < 1 || excluded(px, pz)) continue; person(px, pz, R() * TAU); }
    }

    /* ---- the road signs: the asphalt's start, low gear and the speed limit, ice, the elevation boards at 12,000 and 13,000 ft (where the road's
       height crosses them), the Lake Waiau trail, the summit area; the mile posts (counted from the bottom of the road at the saddle: OSM) ---- */
    {
      const pv = def.paved && def.paved[0] ? def.paved[0][0] : -100;
      sign(sStart + pv + 20, 1, 0, 1); sign(sStart + 60, 1, 1, 1); sign(sStart + 180, 1, 2, 1); sign(sStart + 1500, 1, 3, 1); sign(sStart + 3300, 1, 2, 1);
      const ftAt = (ft) => { const m = ft * 0.3048; for (let s = sStart; s < sFin; s += T.ds) if (T.altAt(T.hy[T.idx(s)]) >= m) return s; return -1; };
      for (const [ft, k] of [[12000, 4], [13000, 5]]) { const s = ftAt(ft); if (s > 0) { sign(s, 1, k, 1); sign(s + 8, -1, k, -1); } }
      const pW = parks.find(p => p.near && Math.abs(T.nearestIdx(p.x, p.z) * T.ds - sStart - 2573) < 120); if (pW) sign(T.nearestIdx(pW.x, pW.z) * T.ds - 70, 1, 6, 1);
      sign(sFin - 420, 1, 7, 1); sign(sFin - 380, -1, 1, -1);
      const mile0 = def.mile0 || 0;   // (the start line's distance from the bottom of the road, metres)
      for (let mi = Math.ceil(mile0 / 1609.34); ; mi++) { const s = sStart + mi * 1609.34 - mile0; if (s > sFin) break; if (s < sStart + 20 || mi < MA_MILE0 || mi > MA_MILE0 + 7) continue;
        const [bx, bz, bi] = onSide(s, 1, 0.9); if (excluded(bx, bz)) continue; const by = caGround(bx, bz), g = scen.get(bx, bz), k = mi - MA_MILE0;
        box(g, bx, by - 0.2, bz, 0.08, 1.5, 0.08, T.hd[bi], [0.6, 0.61, 0.63]); bannerQ(bx, by + 0.9, bz, -T.tx[bi], -T.tz[bi], 0.45, 0.45, 3 / 8, 4 / 8, k / 8, (k + 1) / 8, ban2); exclPush(bx, bz, 1); }
    }

    /* ---- barriers: where the ground falls away past the barrier line a low berm of cinder along the edge, a steel rail on the outside of the
       bends with chevrons (def.curves) and over the higher drops; a white marker post every ~50 m where there is neither (knockable: caProps) ---- */
    let nRail = 0, nBerm = 0;
    {
      const mkPosts = [], drop = [new Uint8Array(N), new Uint8Array(N)], deep = [new Uint8Array(N), new Uint8Array(N)], hp = [new Uint8Array(N), new Uint8Array(N)];
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i], sd = side > 0 ? 1 : 0;
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d), gy = caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) - T.hy[i];
          if (gy < -(d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { drop[sd][i] = 1; if (i + 1 < N) drop[sd][i + 1] = 1; if (gy < -(4 + d * 0.5)) { deep[sd][i] = 1; if (i + 1 < N) deep[sd][i + 1] = 1; } break; } } }
      for (const [d, , turn] of def.curves || []) { const sd = -turn > 0 ? 1 : 0; for (let s = sStart + d - 34; s <= sStart + d + 34; s += T.ds / 2) hp[sd][T.idx(s)] = 1; }
      const iS0 = T.idx(sStart - 60), iS1 = T.idx(sFin - 20), steel = [0.8, 0.82, 0.84], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52], berm = [0.32, 0.29, 0.27];
      for (const side of [-1, 1]) {
        const sd = side > 0 ? 1 : 0, dr = drop[sd], rail = hp[sd], dp = deep[sd], bar = side > 0 ? T.br : T.bl, gap = T.gap ? T.gap[sd] : null;
        for (let i = 1, last = -1; i < N; i++) { if (dr[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) dr[k] = 1; last = i; } }
        for (let i = 0; i < N; i++) { if (dp[i] && dr[i]) rail[i] = 1; if (i < iS0 || i > iS1 || (side * T.k[i] > 0 && Math.abs(T.k[i]) * (bar[i] + 1.5) > 0.5) || (gap && gap[i]) || ROOM[sd][i] < 2 * bar[i] + 1) { dr[i] = 0; rail[i] = 0; } }   // (the bends' outsides railed whatever the drop; none between a hairpin's legs)
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (rail[i] && rail[i + 1]) {   // W-beam: a front and a back face, a post every 4 m
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino); nRail++;
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
          } else if (dr[i] && dr[i + 1] && !WALL[sd][i]) {   // the berm: a low ridge of cinder, its crest at the barrier line
            const k = 0.9 + 0.14 * rpHash(i >> 2, 71 + sd), cc = [berm[0] * k, berm[1] * k, berm[2] * k], cd = [berm[0] * k * 0.8, berm[1] * k * 0.8, berm[2] * k * 0.8];
            const a0 = Q(i, -0.05, -1.1), b0 = Q(i + 1, -0.05, -1.1), a1 = Q(i, 0.42, -0.1), b1 = Q(i + 1, 0.42, -0.1), a2 = Q(i, -0.35, 0.7), b2 = Q(i + 1, -0.35, 0.7), inn = Q(i, -1.5, -0.2);
            g.quadO(a0, b0, b1, a1, cc, inn); g.quadO(a1, b1, b2, a2, cd, inn); nBerm++;
          } else if (!dr[i] && i % 25 === 0 && i > 2 && i < N - 3 && !(gap && gap[i])) mkPosts.push([i, side]);
        }
      }
      const kp = caProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
      (def.curves || []).forEach(([d, , turn]) => {   // the chevrons on the outside of the bend
        const out_ = -turn, [v0, v1] = row(7), u0 = turn > 0 ? 0 : 1 / 8;
        for (const o of [-16, 0, 16]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.7); if (excluded(cx, cz)) continue;
          const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, Math.max(cy, T.hy[ci] - 0.5) - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
          bannerQ(cx, Math.max(cy, T.hy[ci] - 0.5) + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, v0, v1, u0, u0 + 1 / 8); CR.avoid(cx, cz, 0.6); }
      });
    }

    /* ---- the side roads (def.sideRoads: the road to the radio antenna, the summit road's other branch, the road along the ridge): Vršič's side
       roads with this road's ground and American boards; the service roads beyond them drawn on the ground (def.lanes: the rest of those roads,
       the roads between the domes, the track along the ridge past the finish) ---- */
    stubExcl(exclPush);   // (nothing grows or stands on the side roads)
    out.stubStats = stubProps({ scen, out, root, gH: caGround, loc: { closed: 'ROAD CLOSED', gate: 'CLOSED' } });   // (the posts at the corners of the open barrier, the cones, the rail or the gate at the end)
    let nLane = 0;
    {
      const LA = new GB(true), LG = new GB(true), RS = rng(4171);
      for (const L of def.lanes || []) { const grav = L[0], hw = L[1], pts = [];
        for (let k = 2; k + 1 < L.length; k += 2) pts.push([L[k], L[k + 1]]);
        const ok = (x, z) => { const n = vrNear(x, z); return !(n.i >= 0 && n.dd < 2) && !vrStubAt(x, z, 1) && maTileOn(Math.floor((x - P.G.x0) / (VRC * VRT)), Math.floor((z - P.G.z0) / (VRC * VRT))) > 0; };
        for (let k = 0; k + 1 < pts.length; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
          if (!ok(x0, z0) || !ok(x1, z1)) continue;
          for (const exclK of [0]) exclPush((x0 + x1) / 2, (z0 + z1) / 2, hw + 1.5 + exclK);
          const sh = 0.9 + 0.1 * RS(), c = grav ? [0.4 * sh, 0.37 * sh, 0.35 * sh] : [0.62 * sh, 0.62 * sh, 0.64 * sh], gb = grav ? LG : LA;
          const at = (x, z) => [x, caGround(x, z) + 0.12, z];
          gb.quadUp(at(x0 - nx * hw, z0 - nz * hw), at(x0 + nx * hw, z0 + nz * hw), at(x1 + nx * hw, z1 + nz * hw), at(x1 - nx * hw, z1 - nz * hw), [c, c, c, c], [[x0 / 8, z0 / 8], [x0 / 8 + 0.6, z0 / 8], [x1 / 8 + 0.6, z1 / 8], [x1 / 8, z1 / 8]]); nLane++; } }
      addM(LA, aMat); addM(LG, gMat);
    }

    /* ---- the car parks: level plots of packed cinder (paved near the observatories), parked 4x4s and vans, a few visitors and staff ---- */
    {
      const PA = new GB(true), PG = new GB(true), cols = [[0.85, 0.85, 0.83], [0.12, 0.13, 0.15], [0.62, 0.64, 0.66], [0.7, 0.12, 0.1], [0.2, 0.3, 0.5], [0.9, 0.9, 0.88], [0.32, 0.36, 0.3]];
      for (const p of parks) { const n = 14, gb = p.near ? PG : PA, c = p.near ? [0.36, 0.33, 0.31] : [0.56, 0.56, 0.58];
        const at = (a, f) => { const x = p.x + Math.cos(a) * p.r * f, z = p.z + Math.sin(a) * p.r * f; return [x, Math.max(p.h, caGround(x, z)) + 0.06, z]; };
        for (let k = 0; k < n; k++) { const a0 = k / n * TAU, a1 = (k + 1) / n * TAU; gb.quadUp(at(a0, 0.02), at(a0, 1), at(a1, 1), at(a1, 0.02), [c, c, c, c], [[0, 0], [p.r / 8, 0], [p.r / 8, 0.5], [0, 0.5]]); }
        const g = scen.get(p.x, p.z), nn = vrNear(p.x, p.z), hd = nn.i >= 0 ? T.hd[nn.i] : 0, nc = Math.min(5, Math.floor(p.r / 3.2));
        for (let k = 0; k < nc; k++) { const a = (k - (nc - 1) / 2) * 2.8, x = p.x + Math.cos(hd) * a, z = p.z + Math.sin(hd) * a; maCar(g, x, p.h + 0.06, z, hd + PI / 2 + (R() - 0.5) * 0.1, cols[Math.floor(R() * cols.length)], R() < 0.55); }
        for (let k = 0; k < 3; k++) { const a = R() * TAU, x = p.x + Math.cos(a) * p.r * 0.75, z = p.z + Math.sin(a) * p.r * 0.75; if (vrNear(x, z).dd > 1.5) person(x, z, R() * TAU); } }
      addM(PA, aMat); addM(PG, gMat);
    }

    /* ---- the observatories (def.obs): domes, the round enclosure, the buildings, the radio dishes; plain and white, nothing written on them ---- */
    {
      const RO = rng(4191);
      for (const { o, rad } of obs) { const [x, z, k] = o, g = oCh.get(x, z), rot = RO() * TAU;
        let y = 1e9, yH = -1e9; for (let a = 0; a < 8; a++) { const gy = caGround(x + Math.cos(a * PI / 4) * rad * 0.9, z + Math.sin(a * PI / 4) * rad * 0.9); y = Math.min(y, gy); yH = Math.max(yH, gy); }
        const g0 = caGround(x, z); y = Math.min(y, g0) - 0.05; yH = Math.max(yH, g0); const lift = Math.min(6, yH - y);   // (on the ground as built: from its lowest corner, its roof above the highest)
        if (k === 0) maDome(g, x, y, z, o[3], o[4] + lift, rot, RO);
        else if (k === 3) { const r = o[3] / 2; cyl(g, x, y - 1, z, r, o[4] + 1, 22, [0.9, 0.9, 0.9], [0.8, 0.81, 0.83]); cyl(g, x, y + o[4] - 3, z, r * 1.005, 0.8, 22, [0.42, 0.43, 0.46]); box(g, x, y + o[4] * 0.3, z - r * 0.98, r * 0.5, o[4] * 0.7, 0.4, 0, [0.72, 0.73, 0.75]); }
        else if (k === 1) { const hh = o[6] || 5, c = hh > 12 ? [0.78, 0.79, 0.8] : RO() < 0.5 ? [0.88, 0.88, 0.86] : [0.72, 0.7, 0.66];
          box(g, x, y - 0.6, z, o[3], lift + hh + 0.6, o[4], o[5], c, [0.6, 0.61, 0.63]);
          box(g, x, y + lift + hh * 0.55, z, o[3] + 0.06, Math.min(1.1, hh * 0.22), o[4] + 0.06, o[5], [0.3, 0.33, 0.37], null, true);   // (the band of windows)
          box(g, x, y + lift + hh, z, o[3] + 0.3, 0.35, o[4] + 0.3, o[5], [0.82, 0.82, 0.8], [0.66, 0.66, 0.66]); }   // (the roof's edge)
        else { const az = RO() * TAU, el = 0.8 + RO() * 0.5; if (o[3] > 10) { box(g, x, y - 0.5, z, 6, 2.2, 6, rot, [0.8, 0.8, 0.78]); maDish(g, x, y + 2, z, o[3], o[4] * 0.55, az, el); } else { box(g, x, y - 0.3, z, 3.4, 0.5, 3.4, rot, [0.6, 0.6, 0.6]); maDish(g, x, y, z, o[3], o[4] * 0.62, az, el); } }
      }
      for (let k = 0; k < 6; k++) { const q = obs[Math.floor(RO() * obs.length)]; if (!q) break; const a = RO() * TAU, x = q.o[0] + Math.cos(a) * (q.rad + 3), z = q.o[1] + Math.sin(a) * (q.rad + 3); crowdPut(CR, x, caGround(x, z), z, Math.cos(a), Math.sin(a), { col: k % 2 ? [0.95, 0.95, 0.95] : [0.95, 0.45, 0.12] }, 1); }   // (the staff: white and orange jackets)
    }

    /* ---- spectators: at the start and the finish, the checkpoints, the hairpins and the bends with chevrons (inside, where there is room) ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.4, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.06, keepBar: 1.4 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 50, sStart + 40, sd, { rows: 2, dens: 0.5, label: 'MK start' }); run(sFin - 50, sFin + 14, sd, { rows: 2, dens: 0.5, label: 'MK finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 20, s0 + 16, side, { rows: 1, dens: 0.45, label: 'MK cp' }); });
      (def.curves || []).forEach(([d, , turn]) => run(sStart + d - 18, sStart + d + 18, turn, { rows: 2, dens: 0.35, clump: 0.8, label: 'MK bend' }));
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the stones and plants (instanced per 96 m chunk): cinder bombs and lava stones everywhere, thickest by the road; silvery tufts of grass
       and low shrubs only low down (below ~3,800 m, thinning out upwards, none on the top) ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    const pk = [maPlantGeo(0), maPlantGeo(1), maPlantGeo(2), caPlantGeo(3)].map((geo, k) => new IChunks(geo, k === 0 ? wMat : pMat, k === 2 ? 64 : 96));
    let nPlants = 0, nStones = 0;
    const stoneC = [[0.5, 0.33, 0.26], [0.3, 0.29, 0.29], [0.55, 0.5, 0.46], [0.42, 0.26, 0.2], [0.24, 0.23, 0.23]];
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(26000 * dens), RT = rng(4161), SP = 4.2 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > 220) continue;
          if (hd > 70 && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot)
          const y0 = caGround(x, z), A = y0 + base, sl = caSlope(x, z), low = sstep(3880, 3640, A) + vrLCf(x, z, 1) * 0.6;
          let kind = -1;
          if (r1 < 0.05 * low) kind = 0; else if (r1 < 0.065 * low) kind = 1; else if (r1 < 0.2) kind = 2; else if (r1 < 0.215) kind = 3;
          if (kind < 0 || sl > (kind >= 2 ? 1.2 : 0.8)) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 1.6) continue;
          if (excluded(x, z)) continue;
          if (kind === 0) pk[0].add(x, y0 - 0.05, z, r2 * TAU, 0.35 + r3 * 0.35, 0.3 + r4 * 0.3, [1.02 + r2 * 0.1, 1.04 + r3 * 0.08, 1.06 + r4 * 0.08]);
          else if (kind === 1) pk[1].add(x, y0 - 0.08, z, r2 * TAU, 0.5 + r3 * 0.6, 0.4 + r4 * 0.4, [0.92 + r2 * 0.14, 0.95 + r3 * 0.1, 0.95 + r4 * 0.1]);
          else if (kind === 2) { const c = stoneC[Math.floor(r4 * stoneC.length)], k = 0.85 + r3 * 0.3; pk[2].add(x, y0 - 0.05, z, r2 * TAU, 0.7 + r3 * 1.6, 0.6 + r4 * 0.9, [c[0] * k * 1.6, c[1] * k * 1.6, c[2] * k * 1.6]); nStones++; }
          else { const c = stoneC[Math.floor(r2 * stoneC.length)], k = 0.8 + r3 * 0.3; pk[3].add(x, y0 - 0.25, z, r4 * TAU, 0.8 + r3 * 2.2, 0.6 + r4 * 1.5, [c[0] * k * 1.15, c[1] * k * 1.15, c[2] * k * 1.15]); }
          if (++nPlants >= maxT) break grid;
        }
      }
    }
    {   // the stones beside the road, thickest at its edge, thinning out over ~40 m
      const RS = rng(4167), maxS = Math.round(14000 * dens); let nS = 0;
      edge: for (let s = 12; s < T.len - 12; s += 1.3 / dens) for (const side of [-1, 1]) {
        const o = 1.7 + Math.pow(RS(), 2) * 40, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z)) continue;
        const y0 = caGround(x, z), sl = caSlope(x, z); if (sl > 1.15) continue;
        const c = stoneC[Math.floor(r1 * stoneC.length)], k = 0.84 + r3 * 0.28, sc = 0.7 + r1 * 1.1 - 0.006 * o; pk[2].add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [c[0] * k * 1.6, c[1] * k * 1.6, c[2] * k * 1.6]);
        if (++nS >= maxS) break edge;
      }
    }
    for (const t of pk) t.addTo(root, false);

    /* ---- lava boulders and the rough edges of old flows beside the road; outcrops where the slope is steep ---- */
    {
      const RV = rng(4171), rockC = [[0.28, 0.27, 0.27], [0.36, 0.3, 0.27], [0.45, 0.3, 0.24], [0.22, 0.21, 0.21], [0.4, 0.37, 0.34]];
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {
        if (RV() > 0.3) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 40, [x, z] = onSide(s, side, o), sz = 0.4 + RV() * 1.3; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.2 && RV() < 0.5) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.3, sz, sz, RV() * TAU, vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.14), RV, 0.35, RV() < 0.5);
      }
      for (const [d, , turn] of def.curves || []) {   // inside each hairpin, between its legs: a pile of lava blocks (over the crease the two legs' banks make there)
        const i = T.idx(sStart + d), a2 = T.idx(sStart + d - 30), b2 = T.idx(sStart + d + 30); let tq = 0; for (let k = a2; k < b2; k++) { const dh = T.hd[k + 1] - T.hd[k]; tq += dh - TAU * Math.round(dh / TAU); } if (Math.abs(tq) < 2.4) continue;
        const ii = turn > 0 ? 1 : -1, bar = ii > 0 ? T.br[i] : T.bl[i];
        for (let q = 0; q < 7; q++) { const o = bar + 2 + RV() * 7, al = (RV() - 0.5) * 10, x = T.px[i] + T.nx[i] * ii * o + T.tx[i] * al, z = T.pz[i] + T.nz[i] * ii * o + T.tz[i] * al, r0 = 1.2 + RV() * 2.2;
          if (vrNear(x, z).dd < r0 * 0.8 + 0.5 || excluded(x, z)) continue;
          rock(scen.get(x, z), x, caGround(x, z) + r0 * 0.25, z, r0 * 1.2, r0 * (0.6 + RV() * 0.4), r0, RV() * TAU, vary(rockC[Math.floor(RV() * 4)], RV, 0.12), RV, 0.35, true); } }
      for (let s = 16; s < T.len - 16; s += 16) for (const side of [-1, 1]) {   // outcrops of lava where the slope is steep
        if (RV() < 0.4) continue;
        const [x, z] = onSide(s, side, 6 + RV() * 60); if (excluded(x, z) || vrNear(x, z).dd < 6) continue;
        const sl = caSlope(x, z); if (sl < 0.62) continue;
        const y = caGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3);
        for (let q = 0; q < n; q++) { const r0 = 1.6 + RV() * 3, qx = x + (RV() - 0.5) * 8, qz = z + (RV() - 0.5) * 8, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.3, qz, r0 * 1.2, r0 * (0.55 + RV() * 0.4), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(rockC[Math.floor(RV() * 3)], RV, 0.1), RV, 0.35, true); }
      }
    }

    /* ---- the view beyond the corridor: the flanks, the sea of clouds, the volcanoes on the horizon ---- */
    { const F = maFar(opts.season); if (F) { F.mesh.visible = false; root.add(F.mesh); out.dyn.mkFar = F; } }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    oCh.addTo(sceneryGroup, ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x30353c }), cut), true, true);   // (the white domes and buildings: bright even in their own shade, as the real ones)
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: maAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: maAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { plants: nPlants, stones: nStones, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, rails: +(nRail / (2 * N)).toFixed(3), berm: +(nBerm / (2 * N)).toFixed(3), walls: nWall, lanes: nLane,
      domes: obs.filter(q => q.o[2] === 0).length, dishes: obs.filter(q => q.o[2] === 2).length, buildings: obs.filter(q => q.o[2] === 1 || q.o[2] === 3).length, parks: parks.length, sideRoads: out.stubStats.n, far: out.dyn.mkFar ? out.dyn.mkFar.nv : 0 };   // (read by the tests)
    return out;
  }

  Object.assign(API, { maFarUpdate });   // (what World and the other worlds use of this one)
  World.ext.maunakea = (scene, tex, opts) => buildMaunakea(scene, tex, opts);
})();
