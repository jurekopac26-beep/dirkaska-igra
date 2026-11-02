/* =========================================================================
   WORLD — Mount Baldy (theme 'baldy'): its own builder (World.ext.baldy), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, parkedCar, caGCol, caGround, caSlope, caTileGeo, caTileOn, clamp, cone, crowdCtx, crowdFinish, crowdPut,
    crowdRun, cyl, gable, ico, inPoly, lerp, ouCutMat, ouRod, pkGroundMat, polyDist, propFloorTable, rng, roadsideProps, rock, rpHash, sstep,
    starCone, stubExcl, stubGeo, stubProps, stubRails, stubVerge, tuftWindMat, valueNoise2, vary, vrDem, vrDist, vrGritTex, vrHouse, vrLC, vrLCf,
    vrNear, vrPrep, vrStubAt, vrStubs
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= MOUNT BALDY (theme 'baldy') =================
     Mount Baldy Road (California): from the village of Mount Baldy up the San Antonio Canyon, past Icehouse Canyon, up the six switchbacks
     and past Manker Flat to the chairlift under Mount San Antonio, on a clear, warm summer afternoon. Low in the canyon the chaparral (dense
     olive scrub) on the sunny slopes, canyon live oaks and bigcone Douglas-firs in the shady hollows, sycamores and white alders along the
     creeks (def.creeks, their beds of pale granite cobbles); higher up Jeffrey and ponderosa pines with orange bark, white firs and incense
     cedars, manzanita among them; grey granite and gneiss in the road cuts, on the ridges and in the scree (def.lc 4). The cabins of the
     village (def.bld), the streets and forest roads that meet the road (def.sideRoads: stubGeo and stubProps, as the other open roads), the car parks (def.lots), the campground at Manker Flat (def.camp), the downhill carriageway there (def.branch), the
     chairlift at the top (def.lift, def.pylons) and the peaks round the canyon past the corridor (def.farDem: bdFar, as Irohazaka's view).
     Built on Vršič's corridor (vrPrep) and Los Caracoles' terrain (caH, caGround: VR.col = bdCol colours the tiles); every board and sign
     generic (place names only). */
  let BD = null;                                   // per build: the creeks in a 32 m hash (bdCreekD)
  const BDCOL = [0, 0, 0];
  function bdCreekD(x, z) {
    if (!BD) return 1e9; let d = 1e9; const a0 = Math.floor(x / 32), b0 = Math.floor(z / 32);
    for (let a = a0 - 1; a <= a0 + 1; a++) for (let b = b0 - 1; b <= b0 + 1; b++) { const L = BD.ck.get(a * 65536 + b); if (!L) continue;
      for (let k = 0; k < L.length; k += 4) { const ax = L[k], az = L[k + 1], dx = L[k + 2] - ax, dz = L[k + 3] - az, l2 = dx * dx + dz * dz || 1, t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1);
        d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t)); } }
    return d;
  }
  function bdCol(x, z, h, ny, nz, dd, nx) {   // ground colour (times the grey grit map): dry golden grass (lc 0), the dark olive-brown floor under the chaparral
    // (lc 1), leaf litter under the oaks low down and the rust-brown needle litter under the pines up high (lc 2), dusty yards in the village (lc 3),
    // pale granite and grey gneiss (lc 4, the steep faces, in bands), the creeks' beds of pale cobbles, the verge's decomposed granite
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), f = P.n4(x, z), hi = sstep(1500, 1800, A);
    const ch = vrLCf(x, z, 1), tr = vrLCf(x, z, 2), se = vrLCf(x, z, 3), ro = vrLCf(x, z, 4);
    let R = 0.52, G = 0.5, B = 0.39;   // the dry grass
    R = lerp(R, 0.6, sstep(0.55, 0.85, m) * 0.5); G = lerp(G, 0.57, sstep(0.55, 0.85, m) * 0.5);
    R = lerp(R, 0.6, sstep(0.6, 0.86, q) * 0.5); G = lerp(G, 0.54, sstep(0.6, 0.86, q) * 0.5); B = lerp(B, 0.36, sstep(0.6, 0.86, q) * 0.5);
    R = lerp(R, lerp(0.27, 0.3, hi), ch * 0.9); G = lerp(G, lerp(0.27, 0.29, hi), ch * 0.9); B = lerp(B, lerp(0.2, 0.22, hi), ch * 0.9);   // (the chaparral's floor; up high manzanita's)
    R = lerp(R, lerp(0.29, 0.36, hi), tr * 0.88); G = lerp(G, lerp(0.28, 0.29, hi), tr * 0.88); B = lerp(B, lerp(0.2, 0.21, hi), tr * 0.88);   // (oak leaves; pine needles)
    R = lerp(R, 0.66, se * 0.55); G = lerp(G, 0.62, se * 0.55); B = lerp(B, 0.54, se * 0.55);
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.075; B += (f - 0.5) * 0.06;
    const st = Math.max(sstep(0.66, 0.44, ny), ro * 0.85);   // the steep faces and the bare rock: pale granite and grey gneiss in bands
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 6 + P.c3(x * 0.5, z * 0.5) * 7), gn = sstep(0.45, 0.75, P.c4(x, z)), k = 0.84 + 0.17 * band;
      R = lerp(R, lerp(0.7, 0.55, gn) * k, st); G = lerp(G, lerp(0.68, 0.53, gn) * k, st); B = lerp(B, lerp(0.63, 0.5, gn) * k, st); }
    const cd = bdCreekD(x, z); if (cd < 9) { const t = sstep(9, 2.5, cd) * 0.8 * (0.75 + 0.25 * P.n6(x, z)); R = lerp(R, 0.72, t); G = lerp(G, 0.7, t); B = lerp(B, 0.66, t); }   // (the creek's bed of cobbles)
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.45; R = lerp(R, 0.55, t); G = lerp(G, 0.53, t); B = lerp(B, 0.49, t); }   // (the verge: decomposed granite)
    BDCOL[0] = R; BDCOL[1] = G; BDCOL[2] = B; return BDCOL;
  }
  function bdTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them): 0 Jeffrey or ponderosa pine (a tall, straight trunk of orange-brown
    // plates, an open crown of tufted clumps on its upper half), 1 white fir (a dense blue-green spire, its tiers to low down), 2 incense cedar (a
    // narrow cone of warm yellow-green, a flared red-brown trunk), 3 bigcone Douglas-fir (a broad cone of drooping, dark tiers), 4 a canyon live oak
    // (a short trunk, a wide dome of dark clumps), 5 a white alder or sycamore (a pale trunk, an airy, light green crown)
    const g = new GB(), R = rng(4310 + kind), rs = API.ROCK_SMOOTH, bark = [0.56, 0.34, 0.2], barkD = [0.38, 0.24, 0.15];
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.026, 0.86, 5, bark, barkD, 0.012);
      API.ROCK_SMOOTH = true; const c = [0.13, 0.21, 0.1];
      for (const [x, y, z, r, sy] of [[0.15, 0.46, 0.06, 0.15, 0.45], [-0.14, 0.52, -0.08, 0.15, 0.45], [0.04, 0.62, -0.14, 0.14, 0.5], [-0.03, 0.74, 0.1, 0.13, 0.55], [0.01, 0.87, -0.02, 0.09, 0.8]])
        ico(g, x, y, z, r, sy, vary(c, R, 0.2), R, 0.32);
    } else if (kind === 1) {
      const col = [0.1, 0.19, 0.16], tip = [0.2, 0.31, 0.27];
      cyl(g, 0, -0.02, 0, 0.025, 0.14, 4, barkD, null, 0.02);
      [[0.08, 0.24, 0.3, 0.045], [0.3, 0.19, 0.27, 0.04], [0.5, 0.14, 0.24, 0.035], [0.68, 0.09, 0.2, 0.025]].forEach(([y, r, h, dr], k) => {
        const kk = k % 2 ? 1.08 : 1; starCone(g, 0, y, 0, r, h, 5, [col[0] * kk, col[1] * kk, col[2] * kk], tip, k * 0.6, dr); });
      cone(g, 0, 0.86, 0, 0.035, 0.14, 4, col, tip, 0.4);
    } else if (kind === 2) {
      cyl(g, 0, -0.02, 0, 0.045, 0.2, 5, [0.5, 0.28, 0.18], null, 0.028);
      const col = [0.2, 0.3, 0.13], tip = [0.32, 0.42, 0.2];
      cone(g, 0, 0.12, 0, 0.2, 0.62, 7, col, tip, 0); cone(g, 0, 0.42, 0, 0.14, 0.58, 6, vary(col, R, 0.1), tip, 0.4);
    } else if (kind === 3) {
      cyl(g, 0, -0.02, 0, 0.03, 0.2, 4, barkD, null, 0.02);
      const col = [0.11, 0.18, 0.1], tip = [0.17, 0.26, 0.14];
      [[0.12, 0.34, 0.24, 0.09], [0.32, 0.27, 0.22, 0.08], [0.5, 0.2, 0.2, 0.07], [0.66, 0.13, 0.18, 0.05]].forEach(([y, r, h, dr], k) => starCone(g, 0, y, 0, r, h, 6, col, tip, k * 0.5, dr));
      cone(g, 0, 0.82, 0, 0.05, 0.18, 4, col, tip, 0.2);
    } else if (kind === 4) {
      cyl(g, 0, -0.02, 0, 0.07, 0.3, 5, [0.32, 0.3, 0.27], null, 0.05);
      API.ROCK_SMOOTH = true; const col = [0.16, 0.24, 0.11];
      ico(g, 0, 0.6, 0, 0.46, 0.6, col, R, 0.25);
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + R() * 0.6, d = 0.38 + R() * 0.1; ico(g, Math.cos(a) * d, 0.5 + R() * 0.1, Math.sin(a) * d, 0.26 + R() * 0.06, 0.72, vary(col, R, 0.3), R, 0.3); }
    } else {
      cyl(g, 0, -0.02, 0, 0.035, 0.52, 5, [0.82, 0.8, 0.74], [0.7, 0.68, 0.62], 0.022);
      API.ROCK_SMOOTH = true; const col = [0.25, 0.35, 0.15];
      ico(g, 0.04, 0.74, 0, 0.24, 0.9, col, R, 0.35); ico(g, -0.14, 0.6, 0.08, 0.17, 0.9, vary(col, R, 0.2), R, 0.35); ico(g, 0.17, 0.6, -0.08, 0.16, 0.9, vary(col, R, 0.2), R, 0.35);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function bdStoneGeo() {   // a pale granite stone half sunk in the ground (the verges', the creeks' beds)
    const g = new GB(), R = rng(4340), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = false; rock(g, 0, 0.06, 0, 0.2, 0.14, 0.17, 0, [0.64, 0.62, 0.59], R, 0.3); API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function bdShrubGeo(kind) {   // 0 a chaparral shrub (chamise, scrub oak, ceanothus: three tight olive lumps), 1 a manzanita (a dull grey-green mound over red stems)
    const g = new GB(), R = rng(4330 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    if (kind === 0) { const col = [0.2, 0.24, 0.12]; ico(g, -0.08, 0.44, 0, 0.5, 0.85, col, R, 0.3); ico(g, 0.36, 0.3, 0.06, 0.32, 0.9, vary(col, R, 0.25), R, 0.35); }
    else { const col = [0.27, 0.31, 0.21]; API.ROCK_SMOOTH = false; cyl(g, 0, 0, 0, 0.05, 0.3, 4, [0.55, 0.2, 0.12], null, 0.03); API.ROCK_SMOOTH = true; ico(g, 0.06, 0.48, -0.04, 0.56, 0.7, col, R, 0.25); }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  let bdATex = null, bdAKey = '', bdA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function bdAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the green sign at the top, the race's banner
    const key = cps.join('|') + '|' + finA; if (bdATex && bdAKey === key) return bdATex;
    if (bdATex) bdATex.dispose(); bdAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(262, 142, 500, 100); txt('FINISH', 512, 196, 92, '#111', 470);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#2d5a3d'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffe08a', 520); });
    x.fillStyle = '#1d6b3c'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f2f2ee'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);   // (a green guide sign, as on the roads there)
    txt('MT BALDY', 512, 814, 60, '#f2f2ee', 900); txt(finA, 512, 864, 44, '#f2f2ee', 900);
    x.fillStyle = '#f0e8d6'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#2d5a3d'; x.fillRect(0, 896, 1024, 10); x.fillRect(0, 1014, 1024, 10);
    txt('MOUNT BALDY', 512, 934, 62, '#2a3a2a', 980); txt('SAN GABRIEL MOUNTAINS', 512, 990, 40, '#2d5a3d', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (bdATex = t);
  }
  const BD_BOARDS = [['MT BALDY', '#6b4a2a'], ['ICEHOUSE CANYON', '#6b4a2a'], ['MANKER FLAT', '#6b4a2a'], ['SAN ANTONIO FALLS', '#6b4a2a'], ['SPEED LIMIT 25', '#f4f4f0'], ['SHARE THE ROAD', '#f1c21b'], ['ELEV 5000 FT', '#1d6b3c'], ['ELEV 6000 FT', '#1d6b3c']];
  function bdAtlas2() {   // the small signs: row 0, the yellow warnings (128 x 128: a bend left / right, a hairpin left / right, two chevrons, a cyclist); row 1, the
    // advisory plates (10 and 15 MPH) and the mile posts' numbers (1-4, green); rows 4-7, the boards (two a row, 512 x 128)
    if (bdA2Tex) return bdA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    const dia = (x0) => { x.save(); x.translate(x0 + 64, 64); x.rotate(Math.PI / 4); x.fillStyle = '#16181c'; x.fillRect(-44, -44, 88, 88); x.fillStyle = '#f1c21b'; x.fillRect(-40, -40, 80, 80); x.restore(); };
    for (let k = 0; k < 7; k++) { const x0 = k * 128;
      if (k < 4) {   // a bend (k 0, 1) or a hairpin (k 2, 3), left / right
        dia(x0); const dir = k % 2 ? 1 : -1; x.strokeStyle = '#16181c'; x.lineWidth = 9; x.beginPath();
        if (k < 2) { x.moveTo(x0 + 64, 98); x.lineTo(x0 + 64, 66); x.quadraticCurveTo(x0 + 64, 46, x0 + 64 + 22 * dir, 40); x.stroke(); x.fillStyle = '#16181c'; x.beginPath(); x.moveTo(x0 + 64 + 34 * dir, 38); x.lineTo(x0 + 64 + 16 * dir, 26); x.lineTo(x0 + 64 + 16 * dir, 52); x.fill(); }
        else { const a = x0 + 64 - 12 * dir, b = x0 + 64 + 12 * dir; x.moveTo(a, 100); x.lineTo(a, 48); x.arc(x0 + 64, 48, 12, Math.PI, 0, dir < 0); x.lineTo(b, 70); x.stroke(); x.fillStyle = '#16181c'; x.beginPath(); x.moveTo(b - 12, 66); x.lineTo(b + 12, 66); x.lineTo(b, 86); x.fill(); }
      } else if (k < 6) {   // the chevrons: black arrows on yellow, pointing the way the road turns
        const dir = k === 4 ? 1 : -1; x.fillStyle = '#f1c21b'; x.fillRect(x0, 0, 128, 128); x.fillStyle = '#16181c';
        x.beginPath(); const cx = x0 + 64; x.moveTo(cx - 20 * dir, 18); x.lineTo(cx + 22 * dir, 64); x.lineTo(cx - 20 * dir, 110); x.lineTo(cx - 44 * dir, 110); x.lineTo(cx - 2 * dir, 64); x.lineTo(cx - 44 * dir, 18); x.closePath(); x.fill();
      } else {   // a cyclist on a yellow diamond
        dia(x0); x.strokeStyle = '#16181c'; x.lineWidth = 6; x.beginPath(); x.arc(x0 + 44, 80, 14, 0, TAU); x.stroke(); x.beginPath(); x.arc(x0 + 84, 80, 14, 0, TAU); x.stroke();
        x.beginPath(); x.moveTo(x0 + 44, 80); x.lineTo(x0 + 60, 58); x.lineTo(x0 + 84, 80); x.moveTo(x0 + 60, 58); x.lineTo(x0 + 66, 42); x.lineTo(x0 + 78, 52); x.stroke(); x.fillStyle = '#16181c'; x.beginPath(); x.arc(x0 + 70, 32, 6, 0, TAU); x.fill(); } }
    ['10', '15'].forEach((n, k) => { const x0 = k * 128, y0 = 128; x.fillStyle = '#16181c'; x.fillRect(x0 + 6, y0 + 6, 116, 116); x.fillStyle = '#f1c21b'; x.fillRect(x0 + 10, y0 + 10, 108, 108); txt(n, x0 + 64, y0 + 52, 56, '#16181c', 100); txt('MPH', x0 + 64, y0 + 98, 28, '#16181c', 100); });
    for (let k = 1; k <= 4; k++) { const x0 = (k + 1) * 128, y0 = 128; x.fillStyle = '#1d6b3c'; x.fillRect(x0 + 24, y0, 80, 128); x.strokeStyle = '#f2f2ee'; x.lineWidth = 4; x.strokeRect(x0 + 28, y0 + 4, 72, 120); txt('MILE', x0 + 64, y0 + 30, 20, '#f2f2ee', 70); txt(String(k), x0 + 64, y0 + 82, 60, '#f2f2ee', 70); }
    BD_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, light = bg === '#f4f4f0' || bg === '#f1c21b';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = light ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, n.length > 16 ? 40 : 52, light ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (bdA2Tex = t);
  }
  // the view past the corridor (def.farDem: USGS 3DEP on a 200 m grid): as Irohazaka's (one mesh, drawn on the camera's lines of sight just inside
  // the far plane, irFarUpdate moves it), coloured for the San Gabriels: the chaparral's olive and brown on the lower slopes, the dark pine and fir
  // forest higher up and on the north faces, grey granite on the steep faces and the bare ridges; snow on the high ground in winter
  function bdFar(season) {
    const F = T.def.farDem; if (!F) return null;
    const nx = F.nx, nz = F.nz, n = nx * nz, b = atob(F.b64), base = API.VR.D.base, H = new Float32Array(n), dr = new Float32Array(n);
    for (let k = 0; k < n; k++) H[k] = 400 + (b.charCodeAt(2 * k) * 256 + b.charCodeAt(2 * k + 1)) / 2 - base;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell; let m = 1e18;
      for (let q = 0; q < T.N; q += 5) { const dx = x - T.px[q], dz = z - T.pz[q], d = dx * dx + dz * dz; if (d < m) m = d; } dr[j * nx + i] = Math.sqrt(m); }
    const P0 = [], C = [], I = [], snowA = season === 'winter' ? 1450 : 1e9;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, h = H[k], A = h + base, gx = (H[j * nx + Math.min(nx - 1, i + 1)] - H[j * nx + Math.max(0, i - 1)]) / (2 * F.cell), gz = (H[Math.min(nz - 1, j + 1) * nx + i] - H[Math.max(0, j - 1) * nx + i]) / (2 * F.cell);
      const sl = Math.hypot(gx, gz), north = clamp(gz / Math.max(0.05, sl), -1, 1), q = rpHash(i, j) - 0.5;   // (north: the ground falls away to the north)
      let c = [0.42 + q * 0.05, 0.38 + q * 0.04, 0.26];   // the chaparral
      const fo = clamp(sstep(1500, 1900, A) * 0.8 + 0.35 * Math.max(0, -north) * sstep(1100, 1500, A), 0, 1) * (1 - sstep(2650, 2900, A));   // the forest: high up, and on the north faces
      c = [lerp(c[0], 0.17, fo), lerp(c[1], 0.24, fo), lerp(c[2], 0.15, fo)];
      const top = Math.min(1, sstep(2550, 2850, A) * 0.9 + sstep(0.7, 1.1, sl) * 0.7); c = [lerp(c[0], 0.56, top), lerp(c[1], 0.54, top), lerp(c[2], 0.5, top)];   // bare granite on the summits, the cliffs
      const sn = sstep(snowA - 100, snowA + 200, A + q * 180) * (1 - 0.6 * sstep(0.9, 1.3, sl)); c = [lerp(c[0], 0.94, sn), lerp(c[1], 0.95, sn), lerp(c[2], 0.98, sn)];
      P0.push(F.x0 + i * F.cell, h, F.z0 + j * F.cell); C.push(c[0], c[1], c[2]);
    }
    for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) { const a = j * nx + i, b2 = a + 1, c = a + nx, d = c + 1;
      if (Math.min(dr[a], dr[b2], dr[c], dr[d]) < 470) continue; I.push(a, c, b2, b2, c, d); }
    const use = new Int32Array(n).fill(-1), Pu = [], Cu = [], dru = []; let nv = 0;   // (only the nodes of the drawn cells: fewer to move every step)
    for (let k = 0; k < I.length; k++) { const v = I[k]; if (use[v] < 0) { use[v] = nv++; Pu.push(P0[v * 3], P0[v * 3 + 1], P0[v * 3 + 2]); Cu.push(C[v * 3], C[v * 3 + 1], C[v * 3 + 2]); dru.push(dr[v]); } I[k] = use[v]; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(Pu), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(Cu), 3));
    g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1)); g.setIndex(I); g.computeVertexNormals();
    const U = { uHz: { value: new THREE.Color(0xc8d6e2) } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false });
    m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
    m.customProgramCacheKey = () => 'irFar';
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'bdFar';
    mesh.onBeforeRender = (r, sc) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); };
    const rim = new Float32Array(nv); for (let k = 0; k < nv; k++) rim[k] = sstep(1400, 800, dru[k]);
    return { mesh, P0: Float32Array.from(Pu), rim, cx: 1e9, cy: 0, cz: 0, cf: 0, th: 4 };   // (th: moved again once the camera is 4 m on: the lines of sight to the peaks hardly change)
  }
  // the knockable roadside posts: white with a black top (as the Santa Monica Mountains road's)
  function bdProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }
  function buildBaldy(scene, tex, opts) {
    const R = rng(4111), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const sea = opts.season === 'winter' ? 'winter' : 'other';   // (the far peaks: snow in winter; built again when that changes)
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.76, 0.7, 0.6], season: 'bd-' + sea, paintFor: (s) => 'bd-' + (s === 'winter' ? 'winter' : 'other') };
    vrPrep(); vrStubs();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base, altAt = (i) => T.hy[i] + base;
    P.c1 = valueNoise2(741, 140); P.c2 = valueNoise2(742, 70); P.c3 = valueNoise2(743, 190); P.c4 = valueNoise2(744, 90); P.c5 = valueNoise2(745, 24);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]]; P.col = bdCol;
    // the creeks (def.creeks [x, z, ...]): their segments in a 32 m hash (bdCreekD: the beds' colour, the alders and sycamores, the cobbles)
    BD = { ck: new Map() };
    for (const c of def.creeks || []) for (let k = 0; k + 3 < c.length; k += 2) { const ax = c[k], az = c[k + 1], bx = c[k + 2], bz = c[k + 3];
      for (let a = Math.floor((Math.min(ax, bx) - 10) / 32); a <= Math.floor((Math.max(ax, bx) + 10) / 32); a++) for (let b = Math.floor((Math.min(az, bz) - 10) / 32); b <= Math.floor((Math.max(az, bz) + 10) / 32); b++) {
        const key = a * 65536 + b; let L = BD.ck.get(key); if (!L) BD.ck.set(key, L = []); L.push(ax, az, bx, bz); } }
    // the car parks (def.lots [area, x, z, ...]): level plots under them (a circle of their area, at the road's height beside them, or the ground's),
    // the downhill carriageway at Manker Flat (def.branch) on plots of its own where it runs clear of this road
    const lots = (def.lots || []).map(a => { const poly = []; for (let k = 1; k + 1 < a.length; k += 2) poly.push([a[k], a[k + 1]]);
      let cx = 0, cz = 0; for (const [x, z] of poly) { cx += x / poly.length; cz += z / poly.length; }
      const n = vrNear(cx, cz), r = Math.sqrt(a[0] / PI) * 0.85, h = n.i >= 0 && n.dd < 25 ? T.hy[n.i] - 0.25 : vrDem(cx, cz);
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      return { poly, cx, cz, r, h, x0, x1, z0, z1, area: a[0] }; });
    for (const L of lots) if (L.area > 300) P.pads.push({ x: L.cx, z: L.cz, r: L.r, b: 14, h: L.h });
    const br = []; { const b = def.branch || []; for (let k = 0; k + 2 < b.length; k += 3) br.push([b[k], b[k + 1], b[k + 2]]); }
    const brOn = br.map(([x, z]) => vrNear(x, z).dd > 6);   // (clear of this road's barrier line: drawn, on its own plots)
    for (let k = 0; k < br.length; k += 3) if (brOn[k]) { const [x, z] = br[k], n = vrNear(x, z), y = n.i >= 0 && n.dd < 14 ? lerp(T.hy[n.i] - 0.3, br[k][2], sstep(6, 14, n.dd)) : br[k][2]; br[k][3] = y; P.pads.push({ x, z, r: 5.5, b: 9, h: y - 0.1 }); }
    for (let k = 0; k < br.length; k++) if (br[k][3] == null) { const a = br[Math.max(0, k - (k % 3))], b2 = br[Math.min(br.length - 1, k - (k % 3) + 3)]; br[k][3] = a[3] != null && b2[3] != null ? lerp(a[3], b2[3], (k % 3) / 3) : br[k][2]; }
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees, houses and boulders between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the boulders, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const inLot = (x, z, m) => { for (const L of lots) if (x > L.x0 - m && x < L.x1 + m && z > L.z0 - m && z < L.z1 + m && (inPoly(L.poly, x, z) || (m > 0 && polyDist(L.poly, x, z) < m))) return L; return null; };
    // the buildings (def.bld [x, z, length, width, angle, height, kind]: 0 a house, 3 a shed): clear of the road and its side roads
    const blds = [];
    for (const b of def.bld || []) {
      let [x, z, L, W, ang, hgt, kind] = b; L = Math.min(L, 34); W = Math.min(W, 20);
      if (L < 2.5 || W < 2.5) continue;
      const c = Math.cos(ang), s = Math.sin(ang), clear = () => { for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const px = x + c * u - s * v, pz = z + s * u + c * v, n = vrNear(px, pz);
        if ((n.i >= 0 && n.dd < 1.5) || vrStubAt(px, pz, 0.8) || inLot(px, pz, 0)) return false; } return true; };
      if (clear()) blds.push({ x, z, L, W, ang, hgt, kind });
    }
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2);
    stubExcl(exclPush);   // (nothing grows or stands on the side roads)
    for (let k = 0; k < br.length; k += 2) if (brOn[k]) exclPush(br[k][0], br[k][1], 5.5);
    for (const L of lots) for (let k = 0; k < L.poly.length; k++) exclPush(L.poly[k][0], L.poly[k][1], 4);
    out.marks = {};   // (where the landmarks stand: the tests look for them)

    /* ---- terrain tiles (caTileGeo, coloured by bdCol), the view past the corridor ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(caTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }
    { const F = bdFar(opts.season); if (F) { root.add(F.mesh); out.dyn.irFar = F; } }

    /* ---- the road: asphalt with white edge lines and a double yellow centre line (the edge line broken across the side roads' mouths), a gravel
       shoulder, then the verge out to a ditch past the barrier line, up or down onto the ground; where the ground falls away a dry-stone retaining
       wall, its top flush with the verge; on the bridges the deck out to the parapets (120 m chunks) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const onBr = new Uint8Array(N), sw = 0.6;
    for (const [a, b] of def.bridges || []) for (let s = sStart + a - 3; s <= sStart + b + 3; s += T.ds / 2) onBr[T.idx(s)] = 1;
    const SB = stubGeo({ gCol: caGCol, paveC: [0.8, 0.8, 0.81], gravC: [0.64, 0.62, 0.58], shC: [0.64, 0.62, 0.58], line: 'solid' });   // the side roads (their mouths; their surfaces in the road's chunks below)   // (the side roads' gravel the colour of the road's own shoulder: gc below)
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      if (onBr[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];
      const ms = stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;   // (a side road's mouth: no ditch, the verge at its surface)
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    const mouthE = SB.mouthE;   // (where a side road's mouth crosses the asphalt's edge: the edge line broken there)
    let nWall = 0;
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.82 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k += 0.03; return [k, k * 0.995, k * 0.985]; };   // (an old grey asphalt, the wheel tracks darker)
      const wht = [0.95, 0.95, 0.92], ylw = [0.96, 0.76, 0.16], gc = [0.64, 0.62, 0.58], deck = [0.66, 0.65, 0.62];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return k < 3 ? deck : [0.52, 0.51, 0.49];
          const wl = vp[si][i][2][1] < -2.6 && !SB.mouthV[si][i]; if (wl && (k === 1 || k === 2)) { const q = 0.9 + 0.16 * rpHash(i >> 1, 41 + si); return k === 1 ? [0.66 * q, 0.64 * q, 0.6 * q] : [0.5 * q, 0.48 * q, 0.45 * q]; }   // (the wall's coping, its face of grey granite blocks)
          if (k === 4) return caGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return bdCol(x, z, T.hy[i] + y, 1 / l, 0, Math.max(0, o - bar), 0).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const si of [0, 1]) if (!(mouthE[si][i] || mouthE[si][j]) || i % 2 === 0) { const [o0, o1] = si ? [w - 0.45, w - 0.3] : [-(w - 0.3), -(w - 0.45)]; gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]); }
          for (const [o0, o1] of [[-0.21, -0.09], [0.09, 0.21]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [ylw, ylw, ylw, ylw]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], sc = onBr[i] ? deck : gc;
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [sc, sc, sc, sc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
            if (qi[2][1] < -2.6 && !onBr[i] && !SB.mouthV[si][i]) nWall++;
          }
        }
        SB.emit(c0, c0 + 60, gr, gs, gl);   // (the side roads whose junctions are in this chunk)
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // the sealed cracks in the old asphalt: black tar wandering along the lanes and across them (as the Santa Monica Mountains road's)
      { const RS = rng(4191), ts = new Chunks(110), tc = [0.075, 0.075, 0.085], P2 = (s, o) => { const f = clamp(s / T.ds, 0, N - 1.001), i = Math.floor(f), u = f - i, j = i + 1;
          return [lerp(T.px[i] + T.nx[i] * o, T.px[j] + T.nx[j] * o, u), lerp(T.hy[i], T.hy[j], u) + 0.031, lerp(T.pz[i] + T.nz[i] * o, T.pz[j] + T.nz[j] * o, u)]; };
        for (let s = sStart - 40; s < sFin + 40; s += 13) { if (RS() > 0.35) continue;
          const across = RS() < 0.3, L = across ? 2 * w * (0.4 + RS() * 0.55) : 4 + RS() * 10, n = Math.ceil(L / 0.6), ph = RS() * 6, amp = 0.15 + RS() * 0.35;
          const a = s + RS() * 8, o = across ? -w + 0.3 + RS() * (2 * w - L) * 0.9 : (RS() - 0.5) * 2 * (w - 0.8); const pts = [];
          for (let k = 0; k <= n; k++) { const t = k / n * L, wig = Math.sin(t * 1.7 + ph) * amp + Math.sin(t * 4.3 + ph * 2) * amp * 0.35;
            pts.push(across ? P2(a + wig, clamp(o + t, -w + 0.2, w - 0.2)) : P2(a + t, clamp(o + wig, -w + 0.2, w - 0.2))); }
          const g = ts.get(pts[0][0], pts[0][2]);
          for (let k = 0; k < n; k++) { const A = pts[k], B = pts[k + 1], dx = B[0] - A[0], dz = B[2] - A[2], l = Math.hypot(dx, dz) || 1, hx = -dz / l * 0.07, hz = dx / l * 0.07;
            g.quadUp([A[0] - hx, A[1], A[2] - hz], [A[0] + hx, A[1], A[2] + hz], [B[0] + hx, B[1], B[2] + hz], [B[0] - hx, B[1], B[2] - hz], [tc, tc, tc, tc]); } }
        ts.addTo(root, lMat, false, true); }
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
    const fans = [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.14, 0.24, 0.6], [0.12, 0.13, 0.16], [0.96, 0.78, 0.18], [0.2, 0.5, 0.62], [0.95, 0.5, 0.14], [0.5, 0.32, 0.22], [0.3, 0.55, 0.3], [0.82, 0.82, 0.84]];
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a board of the second atlas: [v0, v1, u0, u1]
    const sign = (s, side, k, H) => {   // a board on two steel posts beside the road, facing the cars coming up
      const [bx, bz, bi] = onSide(s, side, 1.4); if (excluded(bx, bz) || vrStubAt(bx, bz, 1)) return;
      const by = caGround(bx, bz), [v0, v1, u0, u1] = board(k), gb = scen.get(bx, bz);
      for (const o of [-1.2, 1.2]) box(gb, bx + T.nx[bi] * o, by - 0.2, bz + T.nz[bi] * o, 0.1, (H || 1.6) + 0.95, 0.1, T.hd[bi], [0.6, 0.61, 0.63]);
      bannerQ(bx, by + (H || 1.6), bz, -T.tx[bi], -T.tz[bi], 3.2, 0.8, v0, v1, u0, u1, ban2); exclPush(bx, bz, 2); CR.avoid(bx, bz, 1.6); };
    const plate = (s, side, cells, H, sz) => {   // small square signs (atlas cells [row, col], 128 px) stacked on one post, the first on top
      const [px, pz, ii] = onSide(s, side, 0.9); if (excluded(px, pz) || vrStubAt(px, pz, 1)) return;
      const py = caGround(px, pz), g = scen.get(px, pz), u8 = 1 / 8; sz = sz || 0.9;
      box(g, px, py - 0.2, pz, 0.08, H + 0.25 + sz / 2, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
      cells.forEach(([r, c], k) => bannerQ(px, py + H - k * (sz * 0.78 + 0.05) - sz / 2, pz, -T.tx[ii], -T.tz[ii], k ? sz * 0.78 : sz, k ? sz * 0.78 : sz, 1 - (r + 1) * u8, 1 - r * u8, c * u8, (c + 1) * u8, ban2));
      exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const flagUS = (g, x, y, z, rot, h) => {   // a pole with the stars and stripes: seven red and six white stripes, the blue canton with white dots (both faces)
      cyl(g, x, y - 0.2, z, 0.06, h + 0.2, 5, [0.92, 0.92, 0.9], [0.85, 0.75, 0.3]);
      const c = Math.cos(rot), s = Math.sin(rot), fw = 1.9, fh = 1.0, y0 = y + h - fh - 0.15, at = (u) => [x + c * (u + 0.06), z + s * (u + 0.06)];
      for (let k = 0; k < 7; k++) { const [fx, fz] = at(fw / 2); box(g, fx, y0 + k * fh / 7, fz, fw, fh / 7, 0.04, rot, k % 2 ? [0.95, 0.95, 0.93] : [0.75, 0.12, 0.16]); }
      const [cx, cz] = at(fw * 0.2); box(g, cx, y0 + fh * 0.46, cz, fw * 0.4 + 0.004, fh * 0.54, 0.05, rot, [0.12, 0.17, 0.42]);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { const [sx, sz] = at(fw * (0.07 + a * 0.13)); box(g, sx, y0 + fh * (0.6 + b * 0.22), sz, 0.06, 0.06, 0.06, rot, [0.96, 0.96, 0.96]); }
    };
    const car = (g, x, y, z, rot, col) => {   // a parked car (as Los Caracoles')
      const c = Math.cos(rot), s = Math.sin(rot);
      parkedCar(g, x, y, z, rot, col);   // (the car: parkedCar in js/world.js)
    };
    const moto = (g, x, y, z, rot, col) => {   // a parked motorbike on its side stand
      const c = Math.cos(rot), s = Math.sin(rot);
      for (const a of [-0.7, 0.7]) cyl(g, x + c * a, y, z + s * a, 0.32, 0.12, 6, [0.08, 0.08, 0.09]);
      box(g, x, y + 0.45, z, 1.3, 0.35, 0.35, rot, col, null, true); box(g, x - c * 0.35, y + 0.75, z - s * 0.35, 0.6, 0.12, 0.3, rot, [0.1, 0.1, 0.11]); box(g, x + c * 0.55, y + 0.9, z + s * 0.55, 0.08, 0.08, 0.7, rot, [0.6, 0.6, 0.62]);
    };
    const carCols = [[0.86, 0.86, 0.84], [0.12, 0.13, 0.15], [0.62, 0.12, 0.1], [0.24, 0.34, 0.56], [0.7, 0.7, 0.72], [0.92, 0.9, 0.86], [0.3, 0.36, 0.3]];

    /* ---- the cabins of Mount Baldy and the houses at Icehouse Canyon: board-and-batten and log walls, stone chimneys, steep roofs of green or
       rust-red metal and grey shingles (deep snow in winter); sheds in wood or metal ---- */
    let nBld = 0;
    {
      const RB = rng(4121), walls = [[0.5, 0.36, 0.24], [0.6, 0.46, 0.32], [0.86, 0.84, 0.78], [0.44, 0.3, 0.2], [0.78, 0.72, 0.6]], roofs = [[0.26, 0.36, 0.28], [0.52, 0.24, 0.18], [0.36, 0.36, 0.38], [0.44, 0.4, 0.36], [0.3, 0.32, 0.34]], woods = [[0.36, 0.25, 0.16], [0.46, 0.32, 0.2]];
      const lowHigh = (b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9; for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = caGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
      for (const b of blds) {
        const g = scen.get(b.x, b.z), [lo, hi] = lowHigh(b);
        if (b.kind === 3) {
          const mc = vary([[0.46, 0.33, 0.22], [0.62, 0.62, 0.6], [0.5, 0.28, 0.2]][Math.floor(RB() * 3)], RB, 0.12);
          box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 0.3 + 2.4, b.W, b.ang, mc, null, true); gable(g, b.x, hi + 2.1, b.z, b.L + 0.5, b.W + 0.5, Math.min(b.L, b.W) * 0.22, b.ang, vary([0.4, 0.42, 0.42], RB, 0.15), mc);
        } else {
          vrHouse(g, fac.get(b.x, b.z), b.x, lo, hi, b.z, b.ang, b.L, b.W, b.L * b.W > 160 ? 2 : 1, { wall: walls[Math.floor(RB() * walls.length)], wood: vary(woods[Math.floor(RB() * 2)], RB, 0.1), roof: vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1) });
          if (RB() < 0.6) { const c = Math.cos(b.ang), s = Math.sin(b.ang), u = b.L / 2 - 0.3, ch = hi + 0.35 + (b.L * b.W > 160 ? 5.8 : 2.9) + Math.min(b.L, b.W) * 0.27 + 0.6;   // a fieldstone chimney at a gable end
            box(g, b.x + c * u, lo - 0.2, b.z + s * u, 1.0, ch - lo + 0.2, 1.0, b.ang, vary([0.56, 0.54, 0.5], RB, 0.12), null, true); }
        }
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang);
        nBld++;
      }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the car parks (def.lots): asphalt on the levelled plot (a 3 m grid inside the outline), white bays, parked cars and motorbikes; the
       campground at Manker Flat (def.camp): tents, picnic tables and cars under the pines ---- */
    let nLotCars = 0;
    {
      const RL = rng(4131), gA = new Chunks(110, true), lc = [0.6, 0.6, 0.6], q3 = 3;
      for (const L of lots) {
        const yAt = (x, z) => caGround(x, z) + 0.06;
        for (let z = Math.floor(L.z0 / q3) * q3; z < L.z1; z += q3) for (let x = Math.floor(L.x0 / q3) * q3; x < L.x1; x += q3) {   // (each 3 m cell of the grid clipped to the outline: a clean edge)
          if (vrNear(x + q3 / 2, z + q3 / 2).dd < 0.6) continue;
          let pg = L.poly;
          for (const [ax, az, v] of [[1, 0, x], [-1, 0, -(x + q3)], [0, 1, z], [0, -1, -(z + q3)]]) {   // (Sutherland-Hodgman against the cell's four sides)
            const o = [], inS = (p) => ax * p[0] + az * p[1] >= v; for (let k = 0; k < pg.length; k++) { const a = pg[k], b = pg[(k + 1) % pg.length], ia = inS(a), ib = inS(b);
              if (ia) o.push(a); if (ia !== ib) { const da = ax * a[0] + az * a[1] - v, db = ax * b[0] + az * b[1] - v, t = da / (da - db); o.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
            pg = o; if (pg.length < 3) break; }
          if (pg.length < 3) continue;
          const k = 0.95 + 0.05 * rpHash(x | 0, z | 0), c = [lc[0] * k, lc[1] * k, lc[2] * k], g = gA.get(x, z), V = pg.map(p => [p[0], yAt(p[0], p[1]), p[1]]), uv = (p) => [p[0] / 8, -p[2] / 8];
          for (let q = 1; q + 1 < V.length; q++) g.quadUp(V[0], V[q], V[q + 1], V[q + 1], [c, c, c, c], [uv(V[0]), uv(V[q]), uv(V[q + 1]), uv(V[q + 1])]); }
        // the cars: in rows along the outline's longest edge, about half the bays taken
        let best = 0, ux = 1, uz = 0; for (let k = 0; k < L.poly.length; k++) { const a = L.poly[k], b = L.poly[(k + 1) % L.poly.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; ux = (b[0] - a[0]) / l; uz = (b[1] - a[1]) / l; } }
        const rot = Math.atan2(uz, ux) + PI / 2, occ = L.area > 3000 ? 0.45 : 0.6;
        for (let v = -60; v <= 60; v += 6.5) for (let u = -90; u <= 90; u += 2.8) { const x = L.cx + ux * u - uz * v, z = L.cz + uz * u + ux * v;
          if (!inPoly(L.poly, x, z) || polyDist(L.poly, x, z) < 2.6 || vrNear(x, z).dd < 2 || RL() > occ) continue;
          const g = scen.get(x, z), y = caGround(x, z);
          if (RL() < 0.18) moto(g, x, y, z, rot + 0.2, vary(carCols[Math.floor(RL() * carCols.length)], RL, 0.2)); else car(g, x, y, z, rot + (RL() < 0.5 ? 0 : PI), vary(carCols[Math.floor(RL() * carCols.length)], RL, 0.15));
          nLotCars++; }
        exclPush(L.cx, L.cz, Math.min(L.r, 30));
      }
      gA.addTo(root, aMat, false, true);
      if (def.camp) { const poly = []; for (let k = 0; k + 1 < def.camp.length; k += 2) poly.push([def.camp[k], def.camp[k + 1]]);   // the campground: tents, tables, cars by the sites
        let cx = 0, cz = 0; for (const [x, z] of poly) { cx += x / poly.length; cz += z / poly.length; }
        const tc = [[0.2, 0.42, 0.62], [0.82, 0.5, 0.16], [0.3, 0.5, 0.3], [0.7, 0.2, 0.16], [0.86, 0.82, 0.6]];
        for (let k = 0; k < 22; k++) { const x = cx + (RL() - 0.5) * 140, z = cz + (RL() - 0.5) * 140; if (!inPoly(poly, x, z) || vrNear(x, z).dd < 6 || excluded(x, z) || caSlope(x, z) > 0.3) continue;
          const g = scen.get(x, z), y = caGround(x, z), r = RL() * TAU, c = Math.cos(r), s = Math.sin(r);
          gable(g, x, y, z, 2.6, 2.2, 1.5, r, tc[k % tc.length], tc[k % tc.length]);   // a tent
          box(g, x + c * 4, y + 0.7, z + s * 4, 2.2, 0.08, 0.9, r, [0.5, 0.36, 0.22]); for (const o of [-0.55, 0.55]) box(g, x + c * 4 - s * o, y, z + s * 4 + c * o, 2.0, 0.42, 0.08, r, [0.46, 0.33, 0.2]);   // a picnic table and its benches
          cyl(g, x - s * 3, y - 0.1, z + c * 3, 0.5, 0.35, 7, [0.3, 0.28, 0.26]);   // the fire ring
          if (RL() < 0.6) car(g, x + c * 2 + s * 4.5, y, z + s * 2 - c * 4.5, r, vary(carCols[Math.floor(RL() * carCols.length)], RL, 0.15));
          exclPush(x, z, 6); }
        out.marks.camp = [cx, cz]; }
    }

    /* ---- the downhill carriageway at Manker Flat (def.branch): a one-way road of its own beside this one (asphalt, white edge lines) where it runs
       clear of it ---- */
    { const gB = new GB(true), gBl = new GB(), hw = 3.3;
      for (let k = 0; k + 1 < br.length; k++) { if (!brOn[k] || !brOn[k + 1]) continue;
        const a = br[k], b = br[k + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
        const p = (q, o, y) => [q[0] + nx * o, Math.max(q[3], caGround(q[0] + nx * o, q[1] + nz * o)) + y, q[1] + nz * o];
        gB.quadUp(p(a, -hw, 0.05), p(a, hw, 0.05), p(b, hw, 0.05), p(b, -hw, 0.05), [[0.8, 0.8, 0.79], [0.8, 0.8, 0.79], [0.8, 0.8, 0.79], [0.8, 0.8, 0.79]], [[0, k * 0.5], [0.8, k * 0.5], [0.8, k * 0.5 + 0.5], [0, k * 0.5 + 0.5]]);
        for (const o of [-hw + 0.3, hw - 0.45]) gBl.quadUp(p(a, o, 0.075), p(a, o + 0.15, 0.075), p(b, o + 0.15, 0.075), p(b, o, 0.075), [[0.95, 0.95, 0.92], [0.95, 0.95, 0.92], [0.95, 0.95, 0.92], [0.95, 0.95, 0.92]]); }
      addM(gB, aMat); addM(gBl, lMat); }

    /* ---- the creeks: a thin ribbon of water down San Antonio Creek and Icehouse Creek, cobbles and boulders of pale granite in the beds ---- */
    {
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 70, specular: 0x2a3a44, transparent: true, opacity: 0.88 }), gW = new GB(true), wc = [0.42, 0.52, 0.56];
      const bed = (x, z) => { let m = 1e9; for (const [a, b] of [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]]) m = Math.min(m, caGround(x + a, z + b)); return m; };
      for (const c of def.creeks || []) { if (c.length < 20) continue;
        for (let k = 0; k + 3 < c.length; k += 2) { const ax = c[k], az = c[k + 1], bx = c[k + 2], bz = c[k + 3], l = Math.hypot(bx - ax, bz - az), n = Math.ceil(l / 3);
          for (let q = 0; q < n; q++) { const t0 = q / n, t1 = (q + 1) / n, x0 = lerp(ax, bx, t0), z0 = lerp(az, bz, t0), x1 = lerp(ax, bx, t1), z1 = lerp(az, bz, t1), nx = -(bz - az) / l * 1.1, nz = (bx - ax) / l * 1.1;
            if (vrDist(x0, z0) > 330 || vrNear(x0, z0).dd < 4 || vrNear(x1, z1).dd < 4) continue;
            const y0 = bed(x0, z0) + 0.12, y1 = bed(x1, z1) + 0.12;
            gW.quadUp([x0 - nx, y0, z0 - nz], [x0 + nx, y0, z0 + nz], [x1 + nx, y1, z1 + nz], [x1 - nx, y1, z1 - nz], [wc, wc, wc, wc], [[x0 / 12, -z0 / 12], [(x0 + 2) / 12, -z0 / 12], [(x1 + 2) / 12, -z1 / 12], [x1 / 12, -z1 / 12]]); } } }
      if (!gW.empty) { const m = new THREE.Mesh(gW.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.renderOrder = 2; root.add(m); out.dyn.water = tex.water; }
    }

    /* ---- START (in the village): gantry with the start lights, the timing hut, flags along the grid, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      { const [hx, hz] = onSide(sStart - 5, 1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut
        if (!vrStubAt(hx, hz, 1)) { box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.62, 0.46, 0.3], [0.4, 0.28, 0.18], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.0, T.hd[i], [0.26, 0.36, 0.28], [0.62, 0.46, 0.3]);
          exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]); } }
      for (let s = 8; s < sStart + 50; s += 12) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3); if ((excluded(px, pz) && s > sStart - 8) || vrStubAt(px, pz, 1)) continue; flagUS(scen.get(px, pz), px, caGround(px, pz), pz, T.hd[ii], 6); }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: plastic water barriers across it, orange and white
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.6, 0.9, 1.95, T.hd[0], (Math.round(o) & 2) ? [0.95, 0.95, 0.93] : [0.95, 0.45, 0.1]); }
      { const [bx, bz, bi] = onSide(sStart + 22, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        if (!vrStubAt(bx, bz, 2)) { for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
          bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); } }
    }

    /* ---- the checkpoints: a forest-green gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.9, 0.88, 0.84], [0.2, 0.36, 0.25]));

    /* ---- FINISH (below the chairlift's car park): chequered gantry and flags, the green sign, the car park with cars and motorbikes at the end
       of the road (def.lots), the road closed past it ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4), py = caGround(px, pz), gg = scen.get(px, pz); if (vrStubAt(px, pz, 1)) continue;
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const [sx, sz, si] = onSide(sFin + 30, -1, 1.6), sy = caGround(sx, sz), gs = scen.get(sx, sz);   // the green sign on two posts
      for (const o of [-2.6, 2.6]) box(gs, sx + T.nx[si] * o, sy - 0.2, sz + T.nz[si] * o, 0.16, 3.9, 0.16, T.hd[si], [0.6, 0.61, 0.63]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 2.3, sz, -T.tx[si], -T.tz[si], 6.4, 0.8, v0, v1); } exclPush(sx, sz, 4);
      for (let k = 0; k < 26; k++) { const s = sFin + 10 + R() * 170, side = R() < 0.5 ? -1 : 1, [px, pz] = onSide(s, side, 1.5 + R() * 6); if (vrNear(px, pz).dd < 1 || excluded(px, pz) || vrStubAt(px, pz, 1)) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: water barriers across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.6, 0.9, 1.95, T.hd[iE], (Math.round(o) & 2) ? [0.95, 0.95, 0.93] : [0.95, 0.45, 0.1]); }
    }

    /* ---- the chairlift (def.lift: its line, def.pylons): the bottom station (a steel frame with the bull wheel under a roof), the pylons (a
       tapered tube with a cross arm and the sheave trains), the haul rope both ways and the chairs on it, where the corridor shows them ---- */
    let nChairs = 0;
    if (def.lift) {
      const LP = []; for (let k = 0; k + 2 < def.lift.length; k += 3) LP.push([def.lift[k], def.lift[k + 2], def.lift[k + 1]]);   // [x, y (above the start line), z]
      const steel = [0.5, 0.52, 0.55], dark = [0.2, 0.21, 0.23], rope = [0.12, 0.12, 0.13];
      const a = LP[0], b = LP[LP.length - 1], dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l, nx = -uz, nz = ux, rot = Math.atan2(uz, ux);
      const st = [a[0], caGround(a[0], a[2]), a[2]], gS = scen.get(st[0], st[2]);
      for (const [u, v] of [[-3, -3], [-3, 3], [3, -3], [3, 3]]) box(gS, st[0] + ux * u + nx * v, st[1] - 0.3, st[2] + uz * u + nz * v, 0.4, 5.6, 0.4, rot, steel);
      box(gS, st[0], st[1] + 5.3, st[2], 8.4, 0.5, 8.4, rot, [0.3, 0.36, 0.3]); gable(gS, st[0], st[1] + 5.8, st[2], 9.2, 9.2, 1.4, rot, [0.26, 0.36, 0.28], [0.3, 0.36, 0.3]);
      cyl(gS, st[0], st[1] + 4.3, st[2], 2.6, 0.3, 12, dark); box(gS, st[0] - ux * 5, st[1], st[2] - uz * 5, 3, 2.6, 2.4, rot, [0.82, 0.8, 0.74], [0.3, 0.36, 0.3], true);   // (the bull wheel; the operator's hut)
      exclPush(st[0], st[2], 8); out.marks.lift = [st[0], st[2]];
      const tops = [[st[0], st[1] + 4.6, st[2]]];
      const pyl = (def.pylons || []).map(p => [p[0], p[2], p[1]]).sort((p, q) => ((p[0] - a[0]) * ux + (p[2] - a[2]) * uz) - ((q[0] - a[0]) * ux + (q[2] - a[2]) * uz));
      for (const p of pyl) { if (vrDist(p[0], p[2]) > 320) break; const y = caGround(p[0], p[2]), g = scen.get(p[0], p[2]), H = 9.5;
        cyl(g, p[0], y - 0.3, p[2], 0.32, H + 0.3, 6, steel, null, 0.2); box(g, p[0], y + H, p[2], 0.3, 0.35, 5.6, rot, steel);
        for (const v of [-2.4, 2.4]) box(g, p[0] + nx * v - ux * 0.8, y + H - 0.25, p[2] + nz * v - uz * 0.8, 1.8, 0.25, 0.3, rot, dark);
        tops.push([p[0], y + H - 0.1, p[2]]); exclPush(p[0], p[2], 2.5); }
      for (let k = 0; k + 1 < tops.length; k++) { const A = tops[k], B = tops[k + 1];
        for (const v of [-2.4, 2.4]) { const p0 = [A[0] + nx * v, A[1], A[2] + nz * v], p1 = [B[0] + nx * v, B[1], B[2] + nz * v], m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 0.6, (p0[2] + p1[2]) / 2];
          ouRod(scen.get(m[0], m[2]), p0, m, 0.03, rope, 3); ouRod(scen.get(m[0], m[2]), m, p1, 0.03, rope, 3);
          const L2 = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]);
          for (let t = 9 + (v > 0 ? 6 : 0); t < L2 - 4; t += 18) { const f = t / L2, sag = 4 * 0.6 * f * (1 - f), cx = lerp(p0[0], p1[0], f), cy = lerp(p0[1], p1[1], f) - sag, cz = lerp(p0[2], p1[2], f), g = scen.get(cx, cz);   // a chair: the hanger, the seat and its back
            box(g, cx, cy - 2.0, cz, 0.06, 2.0, 0.06, rot, dark); box(g, cx, cy - 2.2, cz, 0.6, 0.12, 1.8, rot, [0.24, 0.3, 0.42]); box(g, cx - ux * 0.3, cy - 2.2, cz - uz * 0.3, 0.08, 0.6, 1.8, rot, [0.24, 0.3, 0.42]); nChairs++; } } }
    }

    /* ---- the bridges: a concrete parapet each side on the deck; the road's own guard rails where the ground falls away and round the outside of
       the tight bends (a galvanised W-beam on wooden posts), a marker post every ~50 m where there is neither (knockable where it fits), the
       yellow curve and hairpin signs with their advisory plates, chevrons round the outside of the hairpins ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), steel = [0.78, 0.8, 0.82], steelB = [0.56, 0.58, 0.6], postW = [0.42, 0.33, 0.24];
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl, gp = T.gap ? T.gap[side > 0 ? 1 : 0] : null;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || onBr[i] || vrLCf(T.px[i], T.pz[i], 3) > 0.5) nd[i] = 0;   // (the start, the finish, the bridges and the village stay open)
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        stubRails(nd, side);   // (open across the side roads' mouths)
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]), both = (a) => a[i] && a[i + 1];
          if (both(onBr)) {   // a bridge: a concrete parapet
            const a = Q(i, -0.1, -0.05), b = Q(i + 1, -0.1, -0.05), c = Q(i + 1, 0.95, -0.05), d = Q(i, 0.95, -0.05), a2 = Q(i, -0.1, 0.4), b2 = Q(i + 1, -0.1, 0.4), c2 = Q(i + 1, 0.95, 0.4), d2 = Q(i, 0.95, 0.4), inn = Q(i, 0.4, 0.18);
            g.quadO(a, b, c, d, [0.72, 0.71, 0.68], inn); g.quadO(a2, b2, c2, d2, [0.62, 0.61, 0.58], inn); g.quadO(d, c, c2, d2, [0.8, 0.79, 0.76], inn);
          } else if (nd[i] && nd[i + 1]) {   // W-beam: a front and a back face, a wooden post every 4 m
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.16); box(g, p[0], p[1], p[2], 0.18, 1.12, 0.18, T.hd[i], postW, null, true); }
          } else if (!nd[i] && !onBr[i] && !(gp && gp[i]) && i % 25 === 0 && i > 2 && i < iE - 2) mkPosts.push([i, side]);
        }
      }
      const kp = bdProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
      // the warnings: a yellow bend sign 60 m before every tight bend (a hairpin sign and its 10 or 15 MPH plate before the six hairpins), on the right;
      // chevrons round the outside of the hairpins and the tightest bends
      const hpS = (def.curves || []).map(c => sStart + c[0]);
      for (const c of T.corners) { if (c.sev < 2) continue; const s0 = c.i0 * T.ds, s1 = c.i1 * T.ds; if (s0 < sStart + 30 || s1 > sFin - 20) continue;
        const turn = c.dir > 0 ? 1 : -1, hp = hpS.some(s => s > s0 - 10 && s < s1 + 10), cells = hp ? [[0, 2 + (turn > 0 ? 1 : 0)], [1, c.sev >= 3 ? 0 : 1]] : [[0, turn > 0 ? 1 : 0]];
        plate(s0 - 60, 1, cells, hp ? 2.2 : 2.0);
        if (c.sev < 3) continue;
        const cell = turn > 0 ? 4 : 5, mid = (s0 + s1) / 2, u8 = 1 / 8;
        for (const o of [-12, 0, 12]) { const [cx, cz, ci] = onSide(mid + o, -turn, 0.7); if (excluded(cx, cz) || vrStubAt(cx, cz, 1)) continue;
          const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]); bannerQ(cx, cy + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, 1 - u8, 1, cell * u8, (cell + 1) * u8, ban2); CR.avoid(cx, cz, 0.6); }
      }
    }
    { const nm = (n) => T.names.find(q => q.n.startsWith(n));   // the boards: brown at the places, the speed limit, the cyclists' warning, the altitude signs; the mile posts
      sign(sStart - 70, 1, 0);
      for (const [n, k, o] of [['Icehouse Canyon', 1, -70], ['Manker', 2, -50], ['San Antonio Falls', 3, -60]]) { const q = nm(n); if (q) sign(sStart + q.d + o, 1, k); }
      sign(sStart + 150, 1, 4); sign(sStart + 2820, 1, 4);
      for (const d of [900, 3000, 5700]) plate(sStart + d, 1, [[0, 6]], 2.0);
      for (const [A, k] of [[1524, 6], [1829, 7]]) { for (let i = T.startIdx; i < T.finishIdx; i++) if (altAt(i) >= A) { sign(i * T.ds, 1, k); break; } }
      for (let m = 1; m <= 4; m++) { const s = sStart + m * 1609.3; if (s < sFin - 10) plate(s, 1, [[1, 1 + m]], 1.4, 0.8); } }

    /* ---- the side roads' props: posts, cones, the rails and gates at their ends, the street names (stubProps) ---- */
    out.stubStats = stubProps({ scen, out, root, gH: caGround, loc: { closed: 'ROAD CLOSED', gate: 'CLOSED', plate: ['#1d6b3c', '#f4f6f2'] }, posts: 'along', village: 1250 });

    /* ---- the power line through the village: weathered wooden poles every ~45 m, a cross arm with three wires sagging between them ---- */
    let nPoles = 0;
    {
      const wood = [0.38, 0.29, 0.2], wire = [0.1, 0.1, 0.11];
      for (const [sa, sb, side] of [[sStart - 160, sStart + 820, 1]]) {
        let prev = null, k = 0;
        for (let s = sa; s <= sb; s += 45, k++) {
          const [x, z, i] = onSide(s, side, 3.6), nn = vrNear(x, z);
          if (excluded(x, z) || vrStubAt(x, z, 1.5) || (nn.i >= 0 && nn.dd < 2) || caSlope(x, z) > 0.9) { prev = null; continue; }
          const y = caGround(x, z), g = scen.get(x, z), H = 10.5, ah = T.hd[i] + Math.PI / 2, ax = Math.cos(ah), az = Math.sin(ah);
          cyl(g, x, y - 0.3, z, 0.15, H + 0.3, 6, wood, null, 0.11); box(g, x, y + H - 0.6, z, 2.4, 0.14, 0.14, ah, wood);
          if (k % 4 === 1) cyl(g, x + T.tx[i] * 0.3, y + H - 2.6, z + T.tz[i] * 0.3, 0.3, 1.0, 7, [0.58, 0.6, 0.62]);
          const tops = [-1.05, 0, 1.05].map(o => [x + ax * o, y + H - 0.48 + (o ? 0 : 0.5), z + az * o]);
          if (prev) for (let q = 0; q < 3; q++) { const a = prev[q], b = tops[q], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.7, (a[2] + b[2]) / 2], gg = scen.get(m[0], m[2]);
            ouRod(gg, a, m, 0.022, wire, 3); ouRod(gg, m, b, 0.022, wire, 3); }
          prev = tops; exclPush(x, z, 1.4); CR.avoid(x, z, 1); nPoles++;
        }
      }
    }

    /* ---- spectators: the start and the finish, the checkpoints, groups on the outside of the hairpins ---- */
    {
      const hard = (x, z) => { if (vrStubAt(x, z, 1)) return true; for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.12, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'BD start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'BD finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.55, label: 'BD cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.4, label: 'BD cp-' }); });
      T.corners.filter(c => c.sev >= 3).forEach((c, k) => { if (k % 2) return; const sm = (c.i0 + c.i1) / 2 * T.ds; if (sm < sStart + 100 || sm > sFin - 100) return; run(sm - 20, sm + 20, c.dir > 0 ? -1 : 1, { rows: 2, dens: 0.45, label: 'BD bend' }); });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants (instanced per 128 m chunk), by the land cover and the altitude: dry grass tufts, the chaparral thick on the sunny slopes
       (manzanita higher up), yuccas low down; in the woods canyon live oaks and bigcone Douglas-firs in the canyon, Jeffrey and ponderosa pines,
       white firs and incense cedars higher up; white alders and sycamores along the creeks; granite boulders; none on the road, the plots, the
       side roads ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);   // (the grass: in the wind, and the cut)
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    const PL = { grass: new IChunks(API.mhPlantGeo(0), wMat, 128), shrub: new IChunks(bdShrubGeo(0), pMat, 128), manz: new IChunks(bdShrubGeo(1), pMat, 128), yucca: new IChunks(API.mhPlantGeo(6), pMat, 128), stalk: new IChunks(API.mhPlantGeo(7), pMat, 128),
      boulder: new IChunks(API.btPlantGeo(2), pMat, 128), stones: new IChunks(bdStoneGeo(), pMat, 128), pine: new IChunks(bdTreeGeo(0), pMat, 128), fir: new IChunks(bdTreeGeo(1), pMat, 128),
      cedar: new IChunks(bdTreeGeo(2), pMat, 128), dfir: new IChunks(bdTreeGeo(3), pMat, 128), oak: new IChunks(bdTreeGeo(4), pMat, 128), alder: new IChunks(bdTreeGeo(5), pMat, 128) };
    let nPlants = 0, nTrees = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(90000 * dens), RT = rng(4171), SP = 3.2 / Math.sqrt(dens);
      const tree = (k, x, y, z, r2, r3, r4) => {   // k: 0 pine, 1 fir, 2 cedar, 3 bigcone fir, 4 oak, 5 alder / sycamore
        if (k === 0) PL.pine.add(x, y - 0.3, z, r2 * TAU, 15 + r3 * 9, 20 + r4 * 14, [0.9 + r2 * 0.2, 0.9 + r3 * 0.18, 0.88 + r4 * 0.14]);
        else if (k === 1) PL.fir.add(x, y - 0.3, z, r2 * TAU, 9 + r3 * 5, 15 + r4 * 13, [0.9 + r2 * 0.18, 0.92 + r3 * 0.14, 0.94 + r4 * 0.12]);
        else if (k === 2) PL.cedar.add(x, y - 0.3, z, r2 * TAU, 7 + r3 * 4, 13 + r4 * 9, [0.92 + r2 * 0.16, 0.92 + r3 * 0.14, 0.9]);
        else if (k === 3) PL.dfir.add(x, y - 0.3, z, r2 * TAU, 12 + r3 * 6, 16 + r4 * 10, [0.9 + r2 * 0.18, 0.92 + r3 * 0.14, 0.9]);
        else if (k === 4) PL.oak.add(x, y - 0.2, z, r2 * TAU, 8 + r3 * 6, 7 + r4 * 5, [0.9 + r2 * 0.2, 0.92 + r3 * 0.16, 0.9]);
        else PL.alder.add(x, y - 0.2, z, r2 * TAU, 8 + r3 * 5, 11 + r4 * 7, [0.92 + r2 * 0.16, 0.95 + r3 * 0.1, 0.9]);
        nTrees++; };
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > 240) continue;
          const fx = Math.floor(xx / SP), fz = Math.floor(zz / SP); if (hd > 70 && ((fx + fz) & 1)) continue; if (hd > 150 && (fx & 1)) continue;   // (farther out every other spot, then every fourth: bigger shrubs)
          const far = hd > 150 ? 1.6 : hd > 70 ? 1.25 : 1;
          const c = vrLC(x, z), y0 = caGround(x, z), sl = caSlope(x, z), cd = bdCreekD(x, z), A = y0 + base, hi = A > 1700, mid = A > 1480;
          let kind = -1, tk = -1;
          if (cd < 12 && r1 < 0.06) tk = 5;
          else if (c === 0) kind = r1 < 0.5 ? 0 : r1 < 0.54 ? 1 : r1 < 0.546 ? 8 : -1, tk = r1 > 0.995 ? (mid ? 0 : 4) : -1;
          else if (c === 1) { if (r1 < 0.62) kind = hi && r2 < 0.45 ? 2 : 1; else if (r1 < 0.66) kind = 0; else if (r1 < 0.665) kind = 8; else if (r1 < 0.676 && !mid && sl > 0.2) kind = 6; else if (r1 < (mid ? 0.69 : 0.682)) tk = mid ? (r2 < 0.6 ? 0 : 2) : 4; }
          else if (c === 2) { if (r1 < 0.062) tk = !mid ? (r2 < 0.65 ? 4 : 3) : !hi ? (r2 < 0.35 ? 0 : r2 < 0.55 ? 2 : r2 < 0.72 ? 1 : r2 < 0.85 ? 3 : 4) : (r2 < 0.48 ? 0 : r2 < 0.82 ? 1 : 2); else if (r1 < 0.5) kind = mid ? 2 : 1; else if (r1 < 0.54) kind = 0; }
          else if (c === 3) { if (r1 < 0.03) tk = mid ? 0 : r2 < 0.6 ? 4 : 0; else if (r1 < 0.12) kind = 0; }
          else if (c === 4) { if (r1 < 0.035) kind = 8; else if (r1 < 0.12) kind = mid ? 2 : 1; else if (r1 < 0.106) tk = mid ? 0 : 3; }
          if (kind < 0 && tk < 0) continue;
          if (sl > (kind === 8 ? 1.4 : kind === 0 ? 1.1 : tk >= 0 ? 1.15 : 1.6)) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && (tk >= 0 ? nn.dd < 3 : kind === 0 || kind === 8 ? nn.d < w + 1.6 : nn.dd < 0.4)) continue;
          if (excluded(x, z) || cd < 2.2 || inLot(x, z, tk >= 0 ? 3 : 1)) continue;
          if (tk >= 0) tree(tk, x, y0, z, r2, r3, r4);
          else if (kind === 0) PL.grass.add(x, y0 - 0.05, z, r2 * TAU, 0.8 + r3 * 0.7, 0.55 + r4 * 0.5, [0.9 + r2 * 0.16, 0.9 + r3 * 0.14, 0.84 + r4 * 0.16]);
          else if (kind === 1) PL.shrub.add(x, y0 - 0.15, z, r2 * TAU, (2.3 + r3 * 2.0) * far, (1.1 + r4 * 1.3) * Math.sqrt(far), r2 < 0.2 ? [1.12 + r3 * 0.1, 1.12 + r3 * 0.08, 1.3 + r4 * 0.12] : [0.86 + r2 * 0.24, 0.9 + r3 * 0.18, 0.86 + r4 * 0.16]);   // (one in five the grey-green sage)
          else if (kind === 2) PL.manz.add(x, y0 - 0.12, z, r2 * TAU, (2.0 + r3 * 1.8) * far, (1.1 + r4 * 1.0) * Math.sqrt(far), [0.9 + r2 * 0.2, 0.92 + r3 * 0.16, 0.9 + r4 * 0.16]);
          else if (kind === 6) { PL.yucca.add(x, y0 - 0.05, z, r2 * TAU, 0.8 + r3 * 0.6, 0.7 + r4 * 0.5, [0.92 + r2 * 0.16, 0.95 + r3 * 0.1, 0.95 + r4 * 0.1]); if (r4 < 0.35) PL.stalk.add(x, y0, z, r3 * TAU, 1, 3.2 + r2 * 2.2, [0.9 + r3 * 0.2, 0.9 + r3 * 0.2, 0.9 + r3 * 0.2]); }
          else { const k = 0.74 + r3 * 0.2; PL.boulder.add(x, y0 - 0.25, z, r4 * TAU, 0.9 + r3 * 2.4, 0.7 + r4 * 1.7, [k, k * (0.98 + r2 * 0.04), k * (0.96 + r2 * 0.06)]); }
          if (++nPlants >= maxT) break grid;
        }
      }
      // the creeks' beds: cobbles and boulders of pale granite
      for (const c of def.creeks || []) for (let k = 0; k + 3 < c.length; k += 2) { const ax = c[k], az = c[k + 1], bx = c[k + 2], bz = c[k + 3], l = Math.hypot(bx - ax, bz - az);
        for (let t = 0; t < l; t += 3.2) { const x = lerp(ax, bx, t / l) + (RT() - 0.5) * 5, z = lerp(az, bz, t / l) + (RT() - 0.5) * 5; if (vrDist(x, z) > 200 || vrNear(x, z).dd < 3 || excluded(x, z)) continue;
          const y = caGround(x, z), r = RT(), k2 = 0.82 + RT() * 0.16;
          if (r < 0.2) PL.boulder.add(x, y - 0.3, z, RT() * TAU, 0.8 + RT() * 1.4, 0.6 + RT() * 1.0, [k2 * 1.05, k2 * 1.04, k2]); else PL.stones.add(x, y - 0.04, z, RT() * TAU, 1 + RT(), 1 + RT() * 0.6, [k2 * 1.08, k2 * 1.07, k2 * 1.03]); } }
    }
    {   // stones strewn beside the road, thickest at its edge (decomposed granite and its pebbles)
      const RS = rng(4177), maxS = Math.round(6000 * dens); let nS = 0;
      edge: for (let s = 12; s < T.len - 12; s += 2.6 / dens) for (const side of [-1, 1]) {
        const o = 1.7 + Math.pow(RS(), 2) * 30, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z)) continue;
        const y0 = caGround(x, z), sl = caSlope(x, z); if (sl > 1.15 || (vrLC(x, z) === 0 && r1 < 0.5)) continue;
        const k = 0.8 + r3 * 0.18, sc = 0.8 + r1 * 1.1; PL.stones.add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [k, k * 0.99, k * 0.97]);
        if (++nS >= maxS) break edge;
      }
    }
    {   // the verge inside the barrier line: bunches of dry grass and a few small shrubs (none on the side roads' mouths, at the start or the finish)
      const RG = rng(4179);
      for (let s = 10; s < T.len - 10; s += 0.9 / dens) for (const side of [-1, 1]) {
        const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], room = bar - w - 1.2; if (room < 0.6 || RG() < 0.3) continue;
        if (Math.abs(s - sStart) < 60 || Math.abs(s - sFin) < 60) continue;
        const o = side * (w + 1.0 + RG() * room), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; if (excluded(x, z) || vrStubAt(x, z, 1) || (T.gap && T.gap[side > 0 ? 1 : 0][i])) continue;
        const y0 = caGround(x, z), r = RG(), r2 = RG(), r3 = RG();
        if (r < 0.76) PL.grass.add(x, y0 - 0.04, z, r2 * TAU, 0.9 + r3 * 0.7, 0.55 + r2 * 0.5, [0.78 + r2 * 0.14, 0.8 + r3 * 0.12, 0.72 + r2 * 0.14]);
        else if (Math.abs(o) > w + 2.2) PL.shrub.add(x, y0 - 0.12, z, r2 * TAU, 1.3 + r3 * 1.2, 0.6 + r2 * 0.5, [0.9 + r2 * 0.2, 0.92 + r3 * 0.16, 0.9]);
      }
    }
    for (const [k, ic] of Object.entries(PL)) ic.addTo(root, k === 'pine' || k === 'fir' || k === 'cedar' || k === 'dfir' || k === 'oak' || k === 'alder');

    /* ---- the road cuts and the slopes: granite and grey gneiss outcrops where the slope rises steep beside the road, boulders at the foot of the
       cuts ---- */
    {
      const RV = rng(4181), rockC = [[0.7, 0.68, 0.64], [0.62, 0.6, 0.57], [0.56, 0.54, 0.52], [0.74, 0.7, 0.64], [0.5, 0.49, 0.47]];
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {
        if (RV() > 0.3) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 30, [x, z] = onSide(s, side, o), sz = 0.4 + RV() * 1.2; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.35 && vrLC(x, z) !== 4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RV() * TAU, vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.1), RV, 0.32);
      }
      for (let s = 16; s < T.len - 16; s += 16) for (const side of [-1, 1]) {   // outcrops where the slope is steep: blocky, jointed granite
        if (RV() < 0.4) continue;
        const [x, z] = onSide(s, side, 8 + RV() * 70); if (excluded(x, z) || vrNear(x, z).dd < 6) continue;
        const sl = caSlope(x, z); if (sl < 0.75) continue;
        const y = caGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 2 + RV() * 3.5, qx = x + (RV() - 0.5) * 8, qz = z + (RV() - 0.5) * 8, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0, r0 * (0.6 + RV() * 0.5), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, 0.3, true); }
      }
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fac.addTo(sceneryGroup, ouCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: bdAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: bdAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { plants: nPlants, trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), poles: nPoles, walls: nWall, lotCars: nLotCars, chairs: nChairs, sideRoads: out.stubStats.n };   // (read by the tests)
    return out;
  }

  World.ext.baldy = (scene, tex, opts) => buildBaldy(scene, tex, opts);
})();
