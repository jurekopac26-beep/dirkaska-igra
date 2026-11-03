/* =========================================================================
   WORLD — Detroit (theme 'detroit'): its own builder (World.ext.detroit), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, RB, TAU, addShore, atS, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdPut, crowdUV, cyl, hjCutMat, ico,
    irFarUpdate, lerp, nrChamfer, ouCutMat, rbCrowdTex, rng, shoreBand, sstep, valueNoise2, waterMat, wrapS, pitJunction, pitKerbs, pitOpen, pitRoadAt
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= DETROIT (theme 'detroit') =================
     The street circuit in the centre of Detroit by the river (2.647 km, nine turns), on the real streets (def.scen: OpenStreetMap via Overture
     Maps; the ground from 3DEP, the land cover from ESA WorldCover). Built for the two cameras of the game, the high view and the one behind
     the car: the streets with their curbs, markings and crosswalks; the crossings the track passes, their mouths open to the sidewalks'
     corners where the signals, lamps, signs, hydrants, bins, bollards, meters and the signals' cabinets stand (all knockable: Race.setProps),
     the cross street closed a few metres in by a concrete barrier under a catch fence; concrete walls with catch fences along the whole lap,
     tyre walls at the ends of the escape roads; the buildings in their real footprints and heights (an American facade picture each: brick,
     limestone, glass, concrete, a parking deck), the round glass towers on the riverfront simplified without any name or sign, the
     buildings between the camera and the car cut away (hjCutMat, as Harju's); the river with its promenade and railings, the bridge
     downstream and the Canadian shore with its skyline beyond the haze (dtFar); the trees of the streets and the parks, the grandstands, the
     fans on the sidewalks and the parking decks, the pit lane in the car park with the crews' boxes and the teams' tents, cars parked in the
     car parks. No names of firms, events, sponsors or people anywhere: the boards carry the game's own made-up brands and the place's
     names only. */
  let DT = null;   // per build: the ground grid, the streets' hash
  const DT_FH = [3.6, 3.6, 3.9, 4.0, 3.8, 4.0, 3.2, 4.2, 3.9];   // the facade kinds' storey heights (m)
  const DT_BW = [3.4, 3.4, 2.2, 1.6, 3.0, 1.6, 6.0, 4.0, 2.0];   // and their bays' widths (m)
  function dtI16(b) { const s = atob(b), n = s.length >> 1, a = new Int16Array(n); for (let k = 0; k < n; k++) { const v = s.charCodeAt(2 * k) | (s.charCodeAt(2 * k + 1) << 8); a[k] = v > 32767 ? v - 65536 : v; } return a; }
  function dtPrep() {
    const def = T.def, S = def.scen, D = def.dem, N = T.N;
    const P = DT = { S };
    { const b = atob(D.b64), a = P.dem = new Float32Array(D.nx * D.nz); for (let k = 0; k < a.length; k++) a[k] = D.lo + b.charCodeAt(k) * D.step; P.D = D; }
    { const L = def.lc, b = atob(L.b64), a = P.lc = new Uint8Array(L.nx * L.nz); for (let p = 0, k = 0; p < b.length; p++) { const v = b.charCodeAt(p), n = (v & 63) + 1; a.fill(v >> 6, k, k + n); k += n; } P.L = L; }
    // the ground: a 4 m grid of the real ground, pulled to the road's height over the barriers and blended out 4-30 m beyond them
    const x0 = -1300, z0 = -760, cell = 4, nx = 481, nz = 406, G = P.G = { x0, z0, cell, nx, nz, h: new Float32Array(nx * nz), dd: new Float32Array(nx * nz).fill(1e9), ii: new Int32Array(nx * nz).fill(-1) };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) G.h[j * nx + i] = dtDem(x0 + i * cell, z0 + j * cell);
    const R = 46;
    for (let s = 0; s < N; s++) { const px = T.px[s], pz = T.pz[s], a0 = Math.max(0, Math.floor((px - R - x0) / cell)), a1 = Math.min(nx - 1, Math.ceil((px + R - x0) / cell)), b0 = Math.max(0, Math.floor((pz - R - z0) / cell)), b1 = Math.min(nz - 1, Math.ceil((pz + R - z0) / cell));
      for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) { const k = b * nx + a, dx = x0 + a * cell - px, dz = z0 + b * cell - pz, d2 = dx * dx + dz * dz; if (d2 < G.dd[k]) { G.dd[k] = d2; G.ii[k] = s; } } }
    for (let k = 0; k < nx * nz; k++) { const i = G.ii[k]; if (i < 0) continue;
      const x = x0 + (k % nx) * cell, z = z0 + Math.floor(k / nx) * cell, lat = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], bar = lat > 0 ? T.br[i] : T.bl[i];
      G.h[k] = lerp(T.hy[i], G.h[k], sstep(4, 30, Math.abs(lat) - bar)); }
    // the streets (def.scen.st): polylines with their half widths; a 16 m hash of their segments
    const st = dtI16(S.st), streets = P.streets = [], SH = P.sh = new Map();
    for (let p = 0; p < st.length;) { const n = st[p], c = st[p + 1], hw = st[p + 2] / 4, pts = []; for (let k = 0; k < n; k++) pts.push([st[p + 3 + 2 * k] / 4, st[p + 4 + 2 * k] / 4]); p += 3 + 2 * n;
      const r = { cls: c >> 1, one: c & 1, hw, pts }; streets.push(r);
      for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], R2 = hw + 2;
        for (let a = Math.floor((Math.min(ax, bx) - R2) / 16); a <= Math.floor((Math.max(ax, bx) + R2) / 16); a++) for (let b = Math.floor((Math.min(az, bz) - R2) / 16); b <= Math.floor((Math.max(az, bz) + R2) / 16); b++) {
          const key = a * 4096 + b; let L = SH.get(key); if (!L) SH.set(key, L = []); L.push(r, k); } } }
    // the land use (lu): 0 lawn, 1 sports ground, 2 plaza, 3 car park
    const lu = dtI16(S.lu); P.lu = [];
    for (let p = 0; p < lu.length;) { const n = lu[p], k = lu[p + 1], pts = []; for (let q = 0; q < n; q++) pts.push([lu[p + 2 + 2 * q] / 4, lu[p + 3 + 2 * q] / 4]); p += 2 + 2 * n;
      let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, z] of pts) { a = Math.min(a, x); b = Math.min(b, z); c = Math.max(c, x); d = Math.max(d, z); } P.lu.push({ k, pts, bb: [a, b, c, d] }); }
    { const w = dtI16(S.wat); P.wat = []; for (let p = 0; p < w.length;) { const n = w[p], pts = []; for (let q = 0; q < n; q++) pts.push([w[p + 1 + 2 * q], w[p + 2 + 2 * q]]); p += 1 + 2 * n; P.wat.push(pts); } }
    P.river = P.wat.reduce((a, b) => (b.length > a.length ? b : a), []);
    // the distance from the river's shore on an 8 m lattice (the promenade along it)
    { const c = 8, nx2 = Math.floor((G.nx - 1) * G.cell / c) + 1, nz2 = Math.floor((G.nz - 1) * G.cell / c) + 1, d = new Float32Array(nx2 * nz2).fill(1e9);
      for (let j = 0; j < nz2; j++) for (let i = 0; i < nx2; i++) if (dtInPoly(P.river, x0 + i * c, z0 + j * c)) d[j * nx2 + i] = 0;
      nrChamfer(d, nx2, nz2, c); P.SD = { c, nx: nx2, nz: nz2, d }; }
    { const c = 8, nx2 = Math.floor((G.nx - 1) * G.cell / c) + 1, nz2 = Math.floor((G.nz - 1) * G.cell / c) + 1, d = new Float32Array(nx2 * nz2).fill(1e9);   // the distance from the track's centre line (the same lattice)
      for (let i = 0; i < N; i++) { const a = Math.round((T.px[i] - x0) / c), b = Math.round((T.pz[i] - z0) / c); if (a >= 0 && b >= 0 && a < nx2 && b < nz2) d[b * nx2 + a] = 0; }
      nrChamfer(d, nx2, nz2, c); P.TD = { c, nx: nx2, nz: nz2, d }; }
  }
  function dtShore(x, z) { const S = DT.SD, gx = clamp((x - DT.G.x0) / S.c, 0, S.nx - 1.001), gz = clamp((z - DT.G.z0) / S.c, 0, S.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, a = S.d, W = S.nx;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v; }
  function dtDem(x, z) {   // the real ground (bilinear on the 12 m grid), metres above the start line
    const P = DT, D = P.D, gx = clamp((x - D.x0) / D.cell, 0, D.nx - 1.001), gz = clamp((z - D.z0) / D.cell, 0, D.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = D.nx, a = P.dem;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function dtGround(x, z) {   // the ground's height (bilinear on the 4 m grid; the real ground outside it)
    const G = DT && DT.G; if (!G) return 0;
    const gx = (x - G.x0) / G.cell, gz = (z - G.z0) / G.cell;
    if (gx < 0 || gz < 0 || gx > G.nx - 1.001 || gz > G.nz - 1.001) return dtDem(x, z);
    const i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = G.nx, a = G.h;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function dtLC(x, z) { const L = DT.L, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell); return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? 0 : DT.lc[j * L.nx + i]; }
  function dtStreetAt(x, z, pad) {   // the street under (x, z) (within its half width + pad): { r, k, d, t, tx, tz } or null
    const L = DT.sh.get(Math.floor(x / 16) * 4096 + Math.floor(z / 16)); if (!L) return null;
    let best = null, bd = 1e9;
    for (let q = 0; q < L.length; q += 2) { const r = L[q], k = L[q + 1], [ax, az] = r.pts[k], [bx, bz] = r.pts[k + 1], vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1, t = clamp(((x - ax) * vx + (z - az) * vz) / l2, 0, 1);
      const d = Math.hypot(x - ax - vx * t, z - az - vz * t); if (d < r.hw + (pad || 0) && d - r.hw < bd) { bd = d - r.hw; const l = Math.sqrt(l2); best = { r, k, d, t, tx: vx / l, tz: vz / l }; } }
    return best;
  }
  function dtInPoly(P, x, z) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
  // the facade pictures: 16 rows of 128 x 128 (one bay wide, the u repeating along a wall); the upper rows two storeys each, the ground
  // floors one; the glass in the alpha (0.6: the windows light up at night, dtBldMat)
  let dtFTex = null;
  function dtFacadeTex() {
    if (dtFTex) return dtFTex;
    const W = 128, c = document.createElement('canvas'); c.width = W; c.height = W * 16; const x = c.getContext('2d'), r = rng(3133);
    const Y = (k) => k * W, fill = (col, a, b, w, h, k) => { x.fillStyle = col; x.fillRect(a, Y(k) + b, w, h); };
    const glass = (a, b, w, h, k, c0, c1) => { x.clearRect(a, Y(k) + b, w, h); const gr = x.createLinearGradient(a, Y(k) + b, a + w * 0.7, Y(k) + b + h); gr.addColorStop(0, c0 || 'rgba(120,140,158,0.6)'); gr.addColorStop(1, c1 || 'rgba(40,50,62,0.6)'); x.fillStyle = gr; x.fillRect(a, Y(k) + b, w, h); };
    const noise = (k, n, a) => { for (let q = 0; q < n; q++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,' + a + ')' : 'rgba(255,255,255,' + a + ')'; x.fillRect(r() * W, Y(k) + r() * W, 1 + r() * 4, 1 + r() * 3); } };
    const brick = (k, base, var_) => { fill(base, 0, 0, W, W, k); for (let yy = 0, c2 = 0; yy < W; yy += 3, c2++) for (let xx = c2 % 2 ? -4 : 0; xx < W; xx += 8) { const t = r(); x.fillStyle = 'rgba(' + var_.map((v, q) => Math.round(v[0] + t * v[1])).join(',') + ',1)'; x.fillRect(xx + 0.5, Y(k) + yy + 0.5, 7, 2.2); } };
    // 0, 1: brick, a punched window per bay and storey (two storeys: 64 px each), stone sills and lintels
    for (const [k, base, v] of [[0, '#6e3a2c', [[132, 40], [62, 22], [48, 14]]], [1, '#8a6a4c', [[168, 36], [130, 28], [96, 20]]]]) {
      brick(k, base, v); for (const f of [0, 64]) { fill('#d9d2c2', 30, f + 12, 68, 5, k); glass(34, f + 17, 60, 36, k); fill('#e2dccd', 30, f + 53, 68, 4, k); fill('rgba(255,255,255,0.5)', 63, f + 17, 2, 36, k); } }
    // 2: limestone (the 1920s towers): pale stone, tall narrow windows, dark spandrels, a fine vertical pier
    fill('#cfc4ad', 0, 0, W, W, 2); noise(2, 300, 0.05); for (const f of [0, 64]) { glass(26, f + 8, 76, 40, 2); fill('#5a5248', 26, f + 48, 76, 9, 2); fill('#cfc4ad', 62, f + 8, 4, 40, 2); fill('rgba(0,0,0,0.12)', 22, f + 6, 4, 54, 2); }
    // 3: blue-grey curtain wall, 5: green-tinted: mullions and a spandrel band per storey
    for (const [k, c0, c1, sp] of [[3, 'rgba(118,146,172,0.6)', 'rgba(40,58,80,0.6)', '#3c4a58'], [5, 'rgba(130,168,160,0.6)', 'rgba(40,70,68,0.6)', '#3a4e4c']]) {
      glass(0, 0, W, W, k, c0, c1); for (const f of [0, 64]) { fill(sp, 0, f + 50, W, 14, k); fill('rgba(210,220,228,0.9)', 0, f + 49, W, 2, k); } fill('rgba(200,210,220,0.9)', 0, 0, 3, W, k); fill('rgba(200,210,220,0.9)', 125, 0, 3, W, k); }
    // 4: concrete, ribbon windows
    fill('#b8b5ae', 0, 0, W, W, 4); noise(4, 260, 0.05); for (const f of [0, 64]) { glass(0, f + 14, W, 30, 4); fill('#a9a69f', 0, f + 44, W, 3, 4); fill('#c3c0b8', 60, f + 14, 8, 30, 4); }
    // 6: a parking deck: concrete spandrels, the dark decks between them (one storey a half of the row)
    fill('#b5b2aa', 0, 0, W, W, 6); for (const f of [0, 64]) { fill('#2e3033', 0, f + 22, W, 42, 6); fill('#3e4044', 0, f + 22, W, 6, 6); fill('#a6a39b', 58, f + 22, 12, 42, 6); }
    // 7: painted commercial walls (tinted), simple windows
    fill('#efece6', 0, 0, W, W, 7); noise(7, 200, 0.04); for (const f of [0, 64]) { glass(30, f + 16, 68, 34, 7); fill('#d8d4ca', 26, f + 50, 76, 4, 7); }
    // 8: the round towers' dark bronze glass, a thin light band at every storey
    glass(0, 0, W, W, 8, 'rgba(90,96,98,0.6)', 'rgba(36,38,40,0.6)'); for (const f of [0, 32, 64, 96]) fill('rgba(170,170,160,0.85)', 0, f + 28, W, 3, 8);
    // 9: a ground floor of shops (one storey): big windows, a blank sign band, a door; 10: a lobby: stone piers, glass doors
    fill('#3a3c40', 0, 0, W, W, 9); glass(6, 34, 116, 86, 9, 'rgba(140,156,170,0.6)', 'rgba(30,36,44,0.6)'); fill('#dcd6c8', 0, 8, W, 20, 9); fill('#2a2c30', 52, 60, 24, 60, 9);
    fill('#c9bea8', 0, 0, W, W, 10); glass(20, 24, 88, 96, 10); fill('#b0a690', 0, 0, W, 14, 10); fill('#c9bea8', 62, 24, 4, 96, 10);
    // 11: a deck's ground floor: open bays; 12: a plain wall (tinted); 13: a parapet / cornice; 14: brick ground floor with a door and a window
    fill('#b0ada6', 0, 0, W, W, 11); fill('#25272a', 10, 30, 108, 98, 11); fill('#c8a832', 10, 26, 108, 4, 11);
    fill('#efede8', 0, 0, W, W, 12); noise(12, 300, 0.04);
    fill('#e4e0d6', 0, 0, W, W, 13); fill('rgba(0,0,0,0.18)', 0, 96, W, 10, 13); fill('rgba(255,255,255,0.3)', 0, 20, W, 4, 13);
    brick(14, '#6e3a2c', [[132, 40], [62, 22], [48, 14]]); glass(14, 30, 50, 70, 14); fill('#3a2a20', 76, 40, 36, 88, 14); fill('#d9d2c2', 0, 18, W, 6, 14);
    fill('#8a8f96', 0, 0, W, W, 15);
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; t.premultiplyAlpha = false; return (dtFTex = t);
  }
  const dtFV = (k, f) => { const v1 = 1 - k / 16, v0 = v1 - 1 / 16, pad = 2 / 2048; return v0 + pad + (v1 - v0 - 2 * pad) * f; };   // (facade row k, height fraction f -> v)
  // the buildings' material: the facade picture (its glass from the alpha), lit windows at dusk and at night (U.uWin), the cut between the
  // camera and the car (hjCutMat's)
  function dtBldMat(map, U, W) {
    const m = new THREE.MeshLambertMaterial({ map, vertexColors: true });
    const cutF = hjCutMat(new THREE.MeshLambertMaterial(), U).onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      cutF(sh, r); sh.uniforms.uWin = W;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uWin;')
        .replace('#include <map_fragment>', '#include <map_fragment>\nfloat dtG = 1.0 - step( 0.8, texelColor.a ); diffuseColor.a = 1.0;')
        .replace('#include <emissivemap_fragment>', ['#include <emissivemap_fragment>',
          '{ vec3 ws = vec3( floor( vUv.x ), floor( vOuW.y / 3.9 ), 0.0 );',
          '#ifdef USE_COLOR', '  ws.z = floor( dot( vColor.rgb, vec3( 7.1, 3.7, 5.3 ) ) * 4.0 + 0.5 );', '#endif',
          '  float wh = fract( sin( dot( ws, vec3( 12.9898, 78.233, 37.719 ) ) ) * 43758.5453 );',
          '  vec3 wc = wh > 0.965 ? vec3( 0.5, 0.68, 1.0 ) : mix( vec3( 1.0, 0.66, 0.32 ), vec3( 1.0, 0.88, 0.62 ), fract( wh * 7.3 ) );',
          '  totalEmissiveRadiance += wc * dtG * step( 0.5, wh ) * ( 0.42 + 0.38 * fract( wh * 13.7 ) ) * uWin; }'].join('\n'));
    };
    m.customProgramCacheKey = () => 'dtBld';
    return m;
  }
  function dtConcTex(seed, base, joint, js, dark) {   // sidewalk concrete (slabs js px apart), the roofs' membrane (dark: no joints, patches)
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(seed);
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    for (let q = 0; q < 1400; q++) { const v = r(); x.fillStyle = v < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'; x.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2); }
    if (dark) for (let q = 0; q < 10; q++) { x.fillStyle = r() < 0.6 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'; x.fillRect(r() * S, r() * S, 10 + r() * 40, 8 + r() * 30); }
    if (js) { x.fillStyle = joint; for (let k = 0; k < S; k += js) { x.fillRect(k, 0, 1.4, S); x.fillRect(0, k, S, 1.4); } }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  function buildDetroit(scene, tex, opts) {
    const R = rng(1645), N = T.N, ds = T.ds, def = T.def, L = T.len, sStart = T.startS, w = T.w, dens = opts.density || 1;
    const root = new THREE.Group(); scene.add(root);
    dtPrep();
    const P = DT, S = P.S, gH = dtGround;
    const out = { root, dyn: {}, groundH: gH, camFloor: gH, props: [], farClip: true, ownTex: [], ownMarks: false };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const W_ = (i) => (T.wa ? T.wa[i] : w);   // the road's half width at sample i
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };
    const sAt = (d) => (((sStart + d) % L) + L) % L;
    const hyS = (s) => T.elevAt(wrapS(s)).y;
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) }, uA: { value: new THREE.Vector4(0, 0, -1e6, 1) }, uB: { value: new THREE.Vector4(0, 0, -1e6, 1) } };
    const winU = { value: 0 }, DY = out.dyn.dt = { win: winU, far: null };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const matVC = hjCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);   // (what stands on the roofs: cut with them)
    const addM = (g, mat, cast, recv) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = recv !== false; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const q0 = {};
    const near0 = (x, z) => { const G = P.G, gi = Math.round((x - G.x0) / G.cell), gj = Math.round((z - G.z0) / G.cell); return gi < 0 || gj < 0 || gi >= G.nx || gj >= G.nz ? -1 : G.ii[gj * G.nx + gi]; };   // (the nearest road sample: a lookup's hint)
    const FAR = { q: null, lim: 0, ad: 1e9 }, barAt = (x, z, hint) => { const h = hint == null ? near0(x, z) : hint; if (h < 0) return FAR; const q = T.query(x, z, h, q0); return { q, lim: q.d > 0 ? q.br : q.bl, ad: Math.abs(q.d) }; };   // (FAR: more than 46 m from the road)
    const inBarrier = (x, z, m, hint) => { const b = barAt(x, z, hint); return b.ad < b.lim - (m || 0) ? b : null; };   // (inside the barriers, m metres clear of them)
    // building footprints (for the stands, the trees, the crowds): a 16 m hash of their polygons
    const BH = new Map(), bldIn = (x, z, pad) => { const Lb = BH.get(Math.floor(x / 16) * 4096 + Math.floor(z / 16)); if (!Lb) return false;
      for (const b of Lb) { if (x < b.bb[0] - pad || x > b.bb[2] + pad || z < b.bb[1] - pad || z > b.bb[3] + pad) continue; if (dtInPoly(b.pts, x, z)) return true;
        if (pad > 0) for (let k = 0; k < b.pts.length; k++) { const [ax, az] = b.pts[k], [bx, bz] = b.pts[(k + 1) % b.pts.length], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1), 0, 1); if (Math.hypot(x - ax - vx * t, z - az - vz * t) < pad) return true; } }
      return false; };
    const B = []; { const a = dtI16(S.bld);
      for (let p = 0; p < a.length;) { const n = a[p], k = a[p + 1], h = a[p + 2] / 4, mh = a[p + 3] / 4, pts = []; for (let q = 0; q < n; q++) pts.push([a[p + 4 + 2 * q] / 4, a[p + 5 + 2 * q] / 4]); p += 4 + 2 * n;
        let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9, cx = 0, cz = 0; for (const [x, z] of pts) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); cx += x / n; cz += z / n; }
        const b = { k, h, mh, pts, bb: [x0, z0, x1, z1], cx, cz }; B.push(b);
        if (!mh) for (let i = Math.floor(x0 / 16); i <= Math.floor(x1 / 16); i++) for (let j = Math.floor(z0 / 16); j <= Math.floor(z1 / 16); j++) { const key = i * 4096 + j; let Lb = BH.get(key); if (!Lb) BH.set(key, Lb = []); Lb.push(b); } } }
    const excl = new Map(), exclPush = (x, z, r) => { for (let a = Math.floor((x - r) / 16); a <= Math.floor((x + r) / 16); a++) for (let b = Math.floor((z - r) / 16); b <= Math.floor((z + r) / 16); b++) { const k = a * 4096 + b; let Le = excl.get(k); if (!Le) excl.set(k, Le = []); Le.push([x, z, r]); } };
    const excluded = (x, z) => { const Le = excl.get(Math.floor(x / 16) * 4096 + Math.floor(z / 16)); if (Le) for (const [ex, ez, r] of Le) if ((x - ex) ** 2 + (z - ez) ** 2 < r * r) return true; return false; };
    const water = (x, z) => { const d = dtShore(x, z); return d > 12 ? false : dtInPoly(P.river, x, z); };   // (far from the shore: dry, no polygon test)

    /* ---- the ground: sidewalks and plazas (concrete slabs), lawns, the car parks' asphalt; 128 m tiles, 8 m cells ---- */
    const concTex = ownTex(dtConcTex(301, '#c9c6bf', 'rgba(60,58,52,0.35)', 43)), gMat = new THREE.MeshLambertMaterial({ map: concTex, vertexColors: true }); gMat.userData.wear = true;   // (the rain darkens the sidewalks with the road)
    let nTiles = 0;
    { const G = P.G, gx0 = G.x0, gz0 = G.z0, TS = 512, C8 = 12.8, nT = Math.ceil((G.nx - 1) * G.cell / TS), mT = Math.ceil((G.nz - 1) * G.cell / TS);
      const luAt = (x, z) => { let k = -1; for (const p of P.lu) { if (x < p.bb[0] || x > p.bb[2] || z < p.bb[1] || z > p.bb[3]) continue; if (dtInPoly(p.pts, x, z)) { if (p.k === 0 || p.k === 1) return 0; k = p.k; } } return k; };
      const n3 = valueNoise2(611, 40), n4 = valueNoise2(612, 9);
      for (let tj = 0; tj < mT; tj++) for (let ti = 0; ti < nT; ti++) {
        const rb = new RB(true), n = TS / C8 + 1, X0 = gx0 + ti * TS, Z0 = gz0 + tj * TS; let any = false;
        for (let b = 0; b < n; b++) { const P2 = [], C2 = [], U2 = [];
          for (let a = 0; a < n; a++) { const x = X0 + a * C8, z = Z0 + b * C8; let y = gH(x, z) - 0.04;
            const wt = water(x, z), lc = dtLC(x, z), lu = wt ? -1 : luAt(x, z), m = 0.7 + (n3(x, z) - 0.5) * 0.14 + (n4(x, z) - 0.5) * 0.07;
            let c = [m, m, m * 0.98];
            if (wt) { y = Math.min(y, S.water - 3); c = [0.3, 0.32, 0.3]; }
            else if (lu === 0 || (lc === 2 && lu < 0) || (lc === 1 && lu < 0)) { const g = 0.86 + (n4(x * 1.7, z * 1.7) - 0.5) * 0.2; c = [0.42 * g, 0.62 * g, 0.3 * g]; }
            else if (lu === 2) c = [m * 1.04, m * 1.0, m * 0.93];
            else if (lu < 0 && dtShore(x, z) < 34) { const sd = dtShore(x, z); if (sd < 11) c = [m * 1.05, m * 0.99, m * 0.9];   // (the promenade along the river: warm paving, lawns behind it)
              else if (n3(x * 2.3, z * 2.3) > 0.38) { const g = 0.86 + (n4(x * 1.7, z * 1.7) - 0.5) * 0.2; c = [0.42 * g, 0.62 * g, 0.3 * g]; } }
            else if (lu === 3) c = [0.45 * m, 0.45 * m, 0.46 * m];
            if (!wt) any = true;
            P2.push([x, y, z]); C2.push(c); U2.push([x / 3, -z / 3]); }
          const r = rb.row(P2, C2, U2); if (b) for (let a = 0; a < n - 1; a++) { const p0 = r - n + a, p1 = r + a; rb.I.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); } }
        if (!any) continue;
        const m = addM(rb, gMat); if (m) { m.name = 'ground'; nTiles++; }
      } }

    /* ---- the river: the water to the far shore, the seawall along the promenade, its railing ---- */
    { const sh = new THREE.Shape(P.river.map(([x, z]) => new THREE.Vector2(x, -z))), g = new THREE.ShapeGeometry(sh, 1); g.rotateX(-Math.PI / 2); g.translate(0, S.water, 0);
      const uv = g.attributes.uv, pos = g.attributes.position; for (let k = 0; k < uv.count; k++) uv.setXY(k, pos.getX(k) / 16, -pos.getZ(k) / 16);
      const wm = waterMat(tex, { len: 2.4, color: 0x5d7f78, refl: 0.5 }), m = new THREE.Mesh(g, wm); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); out.dyn.water = tex.water;
      { const E = []; for (let k = 0; k < P.river.length; k++) { const [ax, az] = P.river[k], [bx, bz] = P.river[(k + 1) % P.river.length]; if (Math.max(az, bz) < 900 && Math.min(az, bz) > -200 && Math.max(ax, bx) > -1400 && Math.min(ax, bx) < 720) E.push([ax, az, bx, bz]); }
        const sd = (x, z) => { let d = 1e9; for (const [ax, az, bx, bz] of E) { const vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return dtInPoly(P.river, x, z) ? d : -d; };
        addShore(root, shoreBand(-1300, 0, 700, 900, S.water + 0.01, sd, 16), wm, { len: 2.4, refl: 0.5, lap: 0.6, shal: 0.3 }); }   // (the band along the seawall: the water lapping at it)
      // the seawall and the railing along the near shore (within the world): the shore line where the river meets this bank
      const RV = P.river, g2 = new GB(), rail = [0.2, 0.22, 0.22], wall = [0.6, 0.58, 0.54];
      for (let k = 0; k < RV.length; k++) { const [ax, az] = RV[k], [bx, bz] = RV[(k + 1) % RV.length]; if (az > 800 || bz > 800 || ax < -1300 || ax > 620) continue;   // (this bank only)
        const L2 = Math.hypot(bx - ax, bz - az); if (L2 < 0.5 || L2 > 200) continue;
        const ya = gH(ax, az), yb = gH(bx, bz), ins = [(ax + bx) / 2 + (bz - az) / L2 * -3, S.water, (az + bz) / 2 - (bx - ax) / L2 * -3];
        g2.quadO([ax, S.water - 0.5, az], [bx, S.water - 0.5, bz], [bx, yb, bz], [ax, ya, az], wall, [(ax + bx) / 2 - (bz - az) / L2 * 3, ya - 1, (az + bz) / 2 + (bx - ax) / L2 * 3]);
        if (Math.min(dtGroundD(ax, az), dtGroundD(bx, bz)) > 500) continue;
        for (let t = 0; t < L2; t += 2.4) { const x = ax + (bx - ax) * t / L2, z = az + (bz - az) * t / L2, y = gH(x, z); box(g2, x, y, z, 0.07, 1.05, 0.07, 0, rail); }
        g2.quadO([ax, ya + 1.0, az], [bx, yb + 1.0, bz], [bx, yb + 1.08, bz], [ax, ya + 1.08, az], rail, ins);
        g2.quadO([ax, ya + 0.5, az], [bx, yb + 0.5, bz], [bx, yb + 0.53, bz], [ax, ya + 0.53, az], rail, ins); }
      addM(g2, matV, true); }
    function dtGroundD(x, z) { const D = P.TD, i = Math.round((x - P.G.x0) / D.c), j = Math.round((z - P.G.z0) / D.c); return i < 0 || j < 0 || i >= D.nx || j >= D.nz ? 1e9 : D.d[j * D.nx + i]; }   // (metres from the track's centre line, on the 8 m lattice)

    /* ---- the streets: asphalt ribbons (a little under the track's), the junctions filled; the curbs along their edges; markings ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const mkMat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -10 });
    const stC = new Chunks(256, true), mkC = new Chunks(256), cuC = mkC;
    // the track's paint, its manholes and drains' grates: flat on its surface, one mesh drawn as a road decal (ROAD DECAL ORDER: transparent, not
    // written to the depth buffer, still depth-tested; the tyre marks over them, as Harju's covers)
    const cvG = new GB(), cvC = { get: () => cvG }, cvMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -10 });
    const onTrack = (x, z) => { const h = near0(x, z); if (h < 0) return null; const q = T.query(x, z, h, q0), wi = T.wa ? T.wa[q.i] : w; return Math.abs(q.d) < wi - 0.2 ? q : null; };
    const yS = (x, z) => gH(x, z);
    const YEL = [0.93, 0.74, 0.16], WHT = [0.94, 0.94, 0.92];
    const stripe = (gC, ax, az, bx, bz, o, hw, col, y0) => {   // a painted strip from a to b, offset o across, half width hw
      const L2 = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / L2, nz = (bx - ax) / L2, g = gC.get(ax, az);
      const A = [ax + nx * (o - hw), 0, az + nz * (o - hw)], Bq = [ax + nx * (o + hw), 0, az + nz * (o + hw)], Cq = [bx + nx * (o + hw), 0, bz + nz * (o + hw)], Dq = [bx + nx * (o - hw), 0, bz + nz * (o - hw)];
      for (const p of [A, Bq, Cq, Dq]) p[1] = (y0 != null ? y0 : yS(p[0], p[2])) + 0.07;
      g.quadUp(A, Bq, Cq, Dq, [col, col, col, col]);
    };
    let nStreets = 0;
    for (const r of P.streets) {
      const pts = r.pts, hw = r.hw, sc = r.cls === 5 ? [1.06, 1.02, 0.95] : [0.86, 0.86, 0.88];   // (a pedestrian street: pale paving)
      for (let k = 0; k + 1 < pts.length; k++) {
        const [ax, az] = pts[k], [bx, bz] = pts[k + 1], L2 = Math.hypot(bx - ax, bz - az); if (L2 < 0.05) continue;
        const n = Math.max(1, Math.ceil(L2 / 6)), nx = -(bz - az) / L2, nz = (bx - ax) / L2;
        for (let s = 0; s < n; s++) {
          const f0 = s / n, f1 = (s + 1) / n, x0 = ax + (bx - ax) * f0, z0 = az + (bz - az) * f0, x1 = ax + (bx - ax) * f1, z1 = az + (bz - az) * f1;
          if (onTrack(x0, z0) && onTrack(x1, z1) && onTrack((x0 + x1) / 2 + nx * hw, (z0 + z1) / 2 + nz * hw) && onTrack((x0 + x1) / 2 - nx * hw, (z0 + z1) / 2 - nz * hw)) continue;   // (the track's own asphalt)
          const A = [x0 - nx * hw, 0, z0 - nz * hw], Bq = [x0 + nx * hw, 0, z0 + nz * hw], Cq = [x1 + nx * hw, 0, z1 + nz * hw], Dq = [x1 - nx * hw, 0, z1 - nz * hw];
          for (const p of [A, Bq, Cq, Dq]) p[1] = yS(p[0], p[2]);
          const uv = (p) => [p[0] / 7, -p[2] / 7];
          stC.get(x0, z0).quadUp(A, Bq, Cq, Dq, [sc, sc, sc, sc], [uv(A), uv(Bq), uv(Cq), uv(Dq)]);
          // the curbs: a pale strip along both edges where no other street joins and not on the track
          for (const sd of [-1, 1]) { const ex0 = x0 + nx * sd * (hw + 0.15), ez0 = z0 + nz * sd * (hw + 0.15), ex1 = x1 + nx * sd * (hw + 0.15), ez1 = z1 + nz * sd * (hw + 0.15), mx = (ex0 + ex1) / 2, mz = (ez0 + ez1) / 2;
            const o = dtStreetAt(mx + nx * sd * 0.6, mz + nz * sd * 0.6, 0); if ((o && o.r !== r) || inBarrier(mx, mz, -0.5)) continue;
            const y0 = yS(ex0, ez0), y1 = yS(ex1, ez1), cc = [0.8, 0.79, 0.76], g = cuC.get(ex0, ez0), oi = sd * 0.15, oo = sd * 0.35;
            const I0 = [ex0 - nx * oi, y0 + 0.03, ez0 - nz * oi], I1 = [ex1 - nx * oi, y1 + 0.03, ez1 - nz * oi], T0 = [ex0 - nx * oi, y0 + 0.15, ez0 - nz * oi], T1 = [ex1 - nx * oi, y1 + 0.15, ez1 - nz * oi], O0 = [ex0 + nx * oo, y0 + 0.15, ez0 + nz * oo], O1 = [ex1 + nx * oo, y1 + 0.15, ez1 + nz * oo];
            g.quadO(I0, I1, T1, T0, [0.66, 0.65, 0.62], [mx + nx * sd, y0, mz + nz * sd]); g.quadUp(T0, T1, O1, O0, [cc, cc, cc, cc]); } }
        // the markings: a double yellow line down a two-way street, dashes between the lanes of a one-way street
        if (r.cls <= 3 && hw >= 4.5 && L2 > 8) {
          const m0 = k === 0 ? Math.min(hw + 4, L2 / 3) : 0, m1 = k === pts.length - 2 ? Math.min(hw + 4, L2 / 3) : 0, ux = (bx - ax) / L2, uz = (bz - az) / L2;
          for (let t = m0; t < L2 - m1 - 0.5; t += 12) { const t1 = Math.min(L2 - m1, t + 12), sx = ax + ux * t, sz = az + uz * t, ex = ax + ux * t1, ez = az + uz * t1; if (onTrack(sx, sz) || inBarrier(sx, sz, -3) || onTrack(ex, ez)) continue;
            if (!r.one) { stripe(mkC, sx, sz, ex, ez, -0.13, 0.06, YEL); stripe(mkC, sx, sz, ex, ez, 0.13, 0.06, YEL); }
            else for (const o of [-hw / 3, hw / 3]) stripe(mkC, sx, sz, ax + ux * Math.min(L2 - m1, t + 3), az + uz * Math.min(L2 - m1, t + 3), o, 0.06, WHT); } }
      }
      for (const [x, z] of pts) { if (onTrack(x, z)) continue; const g = stC.get(x, z), y = yS(x, z), n = 10, c = [x, y, z];   // (the junctions: a disc)
        for (let q = 0; q < n; q++) { const a0 = q / n * TAU, a1 = (q + 1) / n * TAU, p0 = [x + Math.cos(a0) * hw, yS(x + Math.cos(a0) * hw, z + Math.sin(a0) * hw), z + Math.sin(a0) * hw], p1 = [x + Math.cos(a1) * hw, yS(x + Math.cos(a1) * hw, z + Math.sin(a1) * hw), z + Math.sin(a1) * hw];
          g.triO(c, p0, p1, sc, [x, y - 5, z], sc, sc, [x / 7, -z / 7], [p0[0] / 7, -p0[2] / 7], [p1[0] / 7, -p1[2] / 7]); } }
      nStreets++;
    }
    // the crosswalks (the mapped crossings): the bars along the street, across its whole width
    const PTS = dtI16(S.pts), items = []; for (let p = 0; p < PTS.length; p += 3) items.push([PTS[p], PTS[p + 1] / 4, PTS[p + 2] / 4]);
    let nCross = 0;
    for (const [k, x, z] of items) { if (k !== 8 || dtGroundD(x, z) > 220) continue; const st = dtStreetAt(x, z, 1.5); if (!st || st.r.cls > 4) continue;
      const hw = Math.min(st.r.hw, 9), q = onTrack(x, z), tx = q ? T.tx[q.i] : st.tx, tz = q ? T.tz[q.i] : st.tz, nx = -tz, nz = tx;   // (on the track: across the track)
      const wi = q ? (T.wa ? T.wa[q.i] : w) : hw, ox = q ? T.px[q.i] : x, oz = q ? T.pz[q.i] : z, y0 = q ? T.hy[q.i] - 0.025 : null;
      for (let o = -wi + 0.3; o < wi - 0.3; o += 1.2) stripe(q ? cvC : mkC, ox - tx * 1.5, oz - tz * 1.5, ox + tx * 1.5, oz + tz * 1.5, o + 0.3, 0.25, WHT, y0);
      nCross++; }
    stC.addTo(root, aMat, false, true);

    /* ---- the track: the streets' asphalt (darker where the rubber is down, patches and seams of the city's repairs), the concrete of the
       last corner (since 2024), red and white kerbs bolted on at the apexes, the gutters and curbs along the edges (not in a cross street's
       mouth), the markings of the streets it runs on, the chequered line and the grid ---- */
    const tMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 }); out.asphaltMat = tMat;   // (over the streets it runs on)
    out.markLift = 0.035; out.markOffset = [-2, -6];   // (the live tyre marks, Render's Skids: 3 cm over this surface, as over any other road, and with its polygon offset; under it they never showed)
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 });
    const kerb = [new Uint8Array(N), new Uint8Array(N)];
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) if (side * k > 0) kerb[side > 0 ? 1 : 0][i] = 1; }   // (the inside of the bends)
    pitKerbs(kerb);   // (none on the pit lane's side where it joins the circuit)
    const concAt = new Uint8Array(N); for (let i = 0; i < N; i++) { const d = dS(i * ds); if ((d > 2425 - L && d < 2480 - L) || (d >= 2425 && d < 2480)) concAt[i] = 1; }
    const mouth = [new Uint8Array(N), new Uint8Array(N)];   // the samples whose edge opens into a cross street (no curb, no gutter)
    for (let i = 0; i < N; i++) for (const sd of [-1, 1]) { const o = sd * (W_(i) + 0.9), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, st = dtStreetAt(x, z, 0.5);
      if (st && Math.abs((st.tx * T.tx[i] + st.tz * T.tz[i])) < 0.75) mouth[sd > 0 ? 1 : 0][i] = 1; }
    for (const M of mouth) { const c = M.slice(); for (let i = 0; i < N; i++) if (c[i]) for (let o = -2; o <= 2; o++) M[(i + o + N) % N] = 1; }
    if (def.pit) for (let i = 0; i < N; i++) if (pitOpen(i)) mouth[def.pit[0] < 0 ? 0 : 1][i] = 1;   // (nor where the pit lane leaves and joins the circuit)
    const secT = new Float32Array(N); for (let i0 = 0, k = 0; i0 < N; k++) { const n = 20 + Math.floor(crH(k, 3, 41) * 40), t = 0.9 + crH(k, 5, 41) * 0.12; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const CH = 128;
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true), gk = new RB(true); let pr = -1; const pk = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, wi = W_(i), offs = [-wi, -wi * 0.6, -wi * 0.25, 0, wi * 0.25, wi * 0.6, wi], v = ii * ds / 8, cc = concAt[i];
        const sh = (o) => { const rl = T.rl[i]; let k = (0.84 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 6)) * secT[i]; if (cc) k = 1.18 + 0.04 * Math.sin(ii * 2.1); return [k, k, k * (cc ? 0.97 : 1.02)]; };
        const r = gr.row(offs.map(o => Pt(i, o, 0.035)), offs.map(o => sh(o)), offs.map(o => [(o + wi) / 8, v]));
        if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0, bar = side > 0 ? T.br[i] : T.bl[i], j = (i + 1) % N;
          if (kerb[si][i]) {   // red and white kerb, 1 m blocks, to just short of the barrier
            const cw = Math.min(1.2, bar - wi - 0.15), pf = [[wi - 0.02, 0.035], [wi + 0.12, 0.07], [wi + cw - 0.1, 0.075], [wi + cw, 0.03]], vv = ii * ds / 2, o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0], us = [0, 0.1, 0.92, 1];
            const rk = gk.row(o.map(k => Pt(i, side * pf[k][0], pf[k][1])), o.map(k => [[0.84, 0.84, 0.84], [1, 1, 1], [1, 1, 1], [0.78, 0.78, 0.78]][k]), o.map(k => [us[k], vv]));
            if (pk[si] >= 0) gk.link(pk[si], rk, 0, 3); pk[si] = rk;
          } else pk[si] = -1;
          if (!mouth[si][i] && !mouth[si][j] && !kerb[si][i] && bar > W_(i) + 0.6) {   // the gutter's concrete and the curb behind it
            const gm = mkC.get(T.px[i], T.pz[i]), wj = W_(j), gc = [0.74, 0.73, 0.7], cu = [0.82, 0.81, 0.78], A = Pt(i, side * wi, 0.04), B2 = Pt(j, side * wj, 0.04), C2 = Pt(j, side * (wj + 0.45), 0.04), D2 = Pt(i, side * (wi + 0.45), 0.04);
            gm.quadUp(A, B2, C2, D2, [gc, gc, gc, gc]);
            const E = Pt(i, side * (wi + 0.45), 0.16), F = Pt(j, side * (wj + 0.45), 0.16), G2 = Pt(j, side * (wj + 0.7), 0.16), H2 = Pt(i, side * (wi + 0.7), 0.16);
            gm.quadO(D2, C2, F, E, [0.64, 0.63, 0.6], Pt(i, side * (wi + 2), 0)); gm.quadUp(E, F, G2, H2, [cu, cu, cu, cu]); }
        }
      }
      addM(gr, tMat); addM(gk, cMat);
    }
    // the streets' markings on the track: [from, to, kind] (0 two-way: double yellow in the middle; 1 one-way: dashes between four lanes, yellow along the median)
    const MK = [[-200, 150, 0], [210, 318, 0], [372, 1385, 1], [1492, 1600, 1], [1645, 1798, 0], [1850, 2315, 0], [2355, 2432, 0]];
    { const gd = cvC, Y2 = YEL;
      const put = (d0, d1, o, hw, col) => { for (let d = d0; d < d1 - 0.01; d += 4) { const s0 = sAt(d), s1 = sAt(Math.min(d1, d + 4)), i = T.idx(s0);
        if (mouth[0][i] && mouth[1][i]) continue; const A = atSf(s0, o - hw), B2 = atSf(s0, o + hw), C2 = atSf(s1, o + hw), D2 = atSf(s1, o - hw);
        gd.get(A[0], A[1]).quadUp([A[0], hyS(s0) + 0.045, A[1]], [B2[0], hyS(s0) + 0.045, B2[1]], [C2[0], hyS(s1) + 0.045, C2[1]], [D2[0], hyS(s1) + 0.045, D2[1]], [col, col, col, col]); } };
      for (const [a, b, kind] of MK) {
        if (kind === 0) { put(a, b, -0.14, 0.06, Y2); put(a, b, 0.14, 0.06, Y2);
          const wi = W_(T.idx(sAt((a + b) / 2))); if (wi > 6) for (let d = a; d < b; d += 12) for (const o of [-wi / 2, wi / 2]) put(d, d + 3, o, 0.06, WHT); }
        else { for (let d = a; d < b; d += 12) for (const f of [-0.5, 0, 0.5]) { const wi = W_(T.idx(sAt(d))); put(d, d + 3, f * wi, 0.06, WHT); }
          put(a, b, -W_(T.idx(sAt(a))) + 0.35, 0.07, Y2); }
      }
      }
    // the chequered line across the road, the grid's boxes (staggered, 7.5 m apart)
    { const gq = new GB(true), gw = cvG, W1 = [1, 1, 1], wh = [0.93, 0.93, 0.9], HYp = (p) => T.hy[p[3]], w0 = W_(T.idx(sStart)), uM = Math.round(w0 * 2 / 0.8) / 16;
      const a = atSf(sStart - 0.8, -w0), b = atSf(sStart - 0.8, w0), c = atSf(sStart + 0.8, w0), d = atSf(sStart + 0.8, -w0);
      gq.quadUp([a[0], HYp(a) + 0.05, a[1]], [b[0], HYp(b) + 0.05, b[1]], [c[0], HYp(c) + 0.05, c[1]], [d[0], HYp(d) + 0.05, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) { const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.2;
        for (const [s0, s1, l0, l1] of [[sb, sb + 0.35, lat - 1.5, lat + 1.5], [sb - 1.6, sb + 0.35, lat - 1.5, lat - 1.25]]) { const p0 = atSf(s0, l0), p1 = atSf(s0, l1), p2 = atSf(s1, l1), p3 = atSf(s1, l0);
          gw.quadUp([p0[0], HYp(p0) + 0.046, p0[1]], [p1[0], HYp(p1) + 0.046, p1[1]], [p2[0], HYp(p2) + 0.046, p2[1]], [p3[0], HYp(p3) + 0.046, p3[1]], [wh, wh, wh, wh]); } }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); }

    /* ---- the barriers: concrete blocks (Jersey profile) along both edges, a catch fence on them; tyre walls at the ends of the escape
       roads; the gaps of the pit lane; boards on the blocks (the game's own made-up brands), the place's banners on the fences ---- */
    const PD = def.pit, esc = [new Uint8Array(N), new Uint8Array(N)];
    for (const [a, b, sd, off, e] of def.walls || []) if (off > 8 && e === 6) for (let d = a; d <= b; d += ds) { const i = T.idx(sAt(d)); if ((sd > 0 ? T.br[i] : T.bl[i]) > W_(i) + off - 1.5) esc[sd > 0 ? 1 : 0][i] = 1; }
    const kindAt = (i, side) => { if (side > 0 && PD) { if (pitOpen(i)) return -1; const p = T.pitAt(i * ds); if (p) return p.gap ? -1 : 1; } return esc[side > 0 ? 1 : 0][i] ? 2 : 1; };   // (pitOpen: the deceleration and acceleration lanes too)
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const scen = new Chunks(256), fenceC = new Chunks(256, true), bn = new GB(true);   // (bn: every board and banner, one atlas: dtBoards)
    const cW = [0.78, 0.77, 0.74], cD = [0.62, 0.61, 0.58], cT = [0.86, 0.85, 0.82];
    const wallRow = (gr, i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], pan = ((i >> 1) & 1) ? 0.97 : 1.02, cw = cW.map(v => v * pan), cd = cD.map(v => v * pan);
      let p = [Pt(i, side * (bar - 0.02), -0.3), Pt(i, side * (bar - 0.02), 0.08), Pt(i, side * (bar + 0.14), 0.3), Pt(i, side * (bar + 0.2), 0.82), Pt(i, side * (bar + 0.42), 0.82)], c = [cd, cd, cw, cw.map(v => v * 1.08), cT];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); } return gr.row(p, c); };
    const fence = [new Uint8Array(N), new Uint8Array(N)];
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB();
      for (const side of [-1, 1]) { let prev = -1, pkd = -2;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) { const i = ii % N, k = kindAt(i, side);
          if (prev >= 0 && k !== pkd) { if (pkd === 1) gr.link(prev, wallRow(gr, i, side), 0, 4); prev = -1; }
          if (k < 0) { pkd = k; continue; }
          if (k === 2) {   // the energy-absorbing blocks at the end of an escape road: blue and red foam blocks, 2 m each, a fence behind
            if (ii < c0 + CH && kindAt((i + 1) % N, side) === 2) { const j = (i + 1) % N, bi = side > 0 ? T.br[i] : T.bl[i], bj = side > 0 ? T.br[j] : T.bl[j], col = ((i >> 1) & 1) ? [0.13, 0.3, 0.72] : [0.78, 0.14, 0.12], top = col.map(v => v * 1.18), g = scen.get(T.px[i], T.pz[i]);
              const A = Pt(i, side * bi, -0.05), B2 = Pt(j, side * bj, -0.05), C2 = Pt(j, side * bj, 1.0), D2 = Pt(i, side * bi, 1.0), E = Pt(i, side * (bi + 0.95), 1.0), F = Pt(j, side * (bj + 0.95), 1.0), ins = Pt(i, side * (bi + 0.5), 0.5);
              g.quadO(A, B2, C2, D2, (i & 1) ? col : col.map(v => v * 0.9), ins); g.quadO(D2, C2, F, E, top, ins); if (kindAt((i + N - 1) % N, side) !== 2) g.quadO(A, D2, E, Pt(i, side * (bi + 0.95), -0.05), col, ins); }
            prev = -1; pkd = k; fence[side > 0 ? 1 : 0][i] = k; continue; }
          const r = wallRow(gr, i, side); if (prev >= 0) gr.link(prev, r, 0, 4); prev = r; pkd = k; fence[side > 0 ? 1 : 0][i] = k; } }
      addM(gr, rMat, false);   // (low: their shadows hardly show, not worth a pass of their own)
    }
    { const W1 = [1, 1, 1];
      for (const side of [-1, 1]) { const fc = fence[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl; let acc = 0;
        for (let i = 0; i < N; i++) { const j = (i + 1) % N; if (!fc[i] || !fc[j]) { acc += ds; continue; }
          const e = fc[i] === 2 ? 1.1 : 0.3, y0 = fc[i] === 2 ? 1.0 : 0.82, Q = (ii, y) => Pt(ii, side * (bar[ii] + e), y), ins = Pt(i, side * (bar[i] + 4), 1);
          fenceC.get(T.px[i], T.pz[i]).quadO(Q(i, y0), Q(j, y0), Q(j, 4.3), Q(i, 4.3), W1, ins, [[acc / 2.5, 0], [(acc + ds) / 2.5, 0], [(acc + ds) / 2.5, 1.4], [acc / 2.5, 1.4]]);
          if (i % 3 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] + y0 - 0.1, p[2], 0.09, 4.4 - y0, 0.09, T.hd[i], [0.5, 0.51, 0.54], null, true); }
          if (i % 3 === 0) { const p = Q(i, 4.25); box(scen.get(p[0], p[2]), p[0], p[1], p[2], 0.05, 0.05, ds * 3, T.hd[i], [0.5, 0.51, 0.54], null, true); }
          acc += ds; } }
      // boards on the concrete blocks along the straights (4 m, the text read from the road)
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 2) { const j = (i + 2) % N;
        if (kindAt(i, side) !== 1 || kindAt(j, side) !== 1 || Math.abs(T.k[i]) > 1 / 120 || ((i >> 1) % 3) === 2) continue;
        const bar = side > 0 ? T.br : T.bl; if (bar[i] > W_(i) + 3 || bar[j] > W_(j) + 3) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, o = (ii) => side * (bar[ii] + 0.16);
        const A = Pt(i, o(i), 0.3), B2 = Pt(j, o(j), 0.3), C2 = Pt(j, o(j), 0.78), D2 = Pt(i, o(i), 0.78), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        bn.quadO(A, B2, C2, D2, W1, Pt(i, side * (bar[i] + 2), 0.5), [[uL, (v1 - 0.25) / 2], [uR, (v1 - 0.25) / 2], [uR, v1 / 2], [uL, v1 / 2]]); } }   // (the brands' picture in the atlas' lower half)
    fenceC.addTo(root, fMat, false, true);

    /* ---- the street furniture: in the cross streets' mouths (inside the barriers: knocked over by the cars) and on the sidewalks outside them
       (the mapped lamps, signals, benches, bus stops, bins, hydrants, bollards: standing). In every mouth: a mast-arm signal on each corner,
       its controller cabinet, a lamp, a hydrant, bins, bollards, signs and parking meters along the cross street's curbs ---- */
    const props = out.props, taken = [];
    const free = (x, z, r) => { for (const [a, b, rr] of taken) if ((x - a) ** 2 + (z - b) ** 2 < (r + rr) ** 2) return false; return true; };
    const putProp = (kind, x, z, yaw, r, m) => { const K = { signal: 0.5, signalm: 0.5, lamp: 0.4, cabinet: 0.8, bin: 0.45, hydrant: 0.35, bollard: 0.25, sign: 0.3, meter: 0.25 }[kind] || 0.4;
      const b = inBarrier(x, z, K + (m == null ? 0.35 : m)); if (!b || b.ad < (T.wa ? T.wa[b.q.i] : w) + 0.7 || !free(x, z, r || K)) return false;
      props.push({ kind, x, z, yaw, col: 0, i: b.q.i }); taken.push([x, z, r || K]); return true; };
    let nMouths = 0;
    for (const [d, sd, ang, hw] of S.xs) {
      const s = sAt(d), i = T.idx(s), wi = W_(i), a = ang * Math.PI / 180, nx = T.nx[i] * sd, nz = T.nz[i] * sd, tx = T.tx[i], tz = T.tz[i];
      const ux = nx * Math.cos(a) + tx * Math.sin(a), uz = nz * Math.cos(a) + tz * Math.sin(a), px = -uz, pz = ux;   // (u: up the cross street; p: across it)
      const bx = T.px[i] + nx * (wi + 0.8), bz = T.pz[i] + nz * (wi + 0.8), cs = hw / Math.max(0.5, Math.cos(a));
      const P2 = (al, ac) => [bx + ux * al + px * ac, bz + uz * al + pz * ac];
      for (const e of [-1, 1]) {   // the two corners
        const cr = e * (hw + 1.4), [sx, sz] = P2(1.2, cr), yaw = Math.atan2(-pz * e, -px * e);   // (the arm over the cross street)
        putProp('signalm', sx, sz, yaw, 0.6);
        { const [lx, lz] = P2(3.6, e * (hw + 2.2)); putProp(e > 0 ? 'cabinet' : 'lamp', lx, lz, Math.atan2(uz, ux), 0.8); }
        { const [hx, hz] = P2(5.4, e * (hw + 0.9)); if (crH(d, e, 3) < 0.6) putProp('hydrant', hx, hz, R() * TAU); else putProp('meter', hx, hz, Math.atan2(pz * e, px * e)); }
        { const [kx, kz] = P2(0.4, e * (hw + 3.0)); putProp('bin', kx, kz, R() * TAU); }
        { const [gx, gz] = P2(6.8, e * (hw + 1.0)); putProp('sign', gx, gz, Math.atan2(uz, ux)); }
        for (let q = 0; q < 3; q++) { const [ox, oz] = P2(-0.1 + 0.0 * q, e * (hw + 4.3 + q * 1.3)); putProp('bollard', ox, oz, 0); }
      }
      nMouths++;
    }
    // the escape roads: the street ahead goes on past the corner (bollards and a sign by its far curb, a hydrant)
    for (const [a, b, sd, off, e] of def.walls || []) { if (!(off > 8 && e === 6)) continue;
      for (let dd = a + 4; dd < b - 3; dd += 7) { const s = sAt(dd), i = T.idx(s), bar = sd > 0 ? T.br[i] : T.bl[i], o = sd * (bar - 1.4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        putProp(crH(dd, sd, 1) < 0.5 ? 'bollard' : crH(dd, sd, 2) < 0.6 ? 'sign' : 'hydrant', x, z, T.hd[i] + Math.PI / 2); } }
    // the mapped things (OpenStreetMap): inside the barriers they can be knocked over, outside they stand (instanced)
    const STK = ['lamp', 'signal', 'hydrant', 'bollard', 'bin', null, null, null, null, null, null];
    const stat = { lamp: [], signal: [], bench: [], shelter: [], bin: [], hydrant: [], bollard: [] };
    for (const [k, x, z] of items) {
      if (k === 8 || k === 11 || k === 9 || k === 10 || k === 7) continue;
      const b = barAt(x, z);
      if (b.ad < b.lim + 0.3) { const kind = STK[k]; if (kind && b.ad > W_(b.q.i) + 0.8) putProp(kind, x, z, R() * TAU); continue; }   // (inside: knockable; on the road itself: none)
      if (b.ad < b.lim + 1.0 || bldIn(x, z, 0.3)) continue;
      const st = dtStreetAt(x, z, 0.3); if (st && k !== 1) continue;   // (not on a street)
      const nt = b.q, yaw = nt ? Math.atan2(-nt.nz * Math.sign(nt.d), -nt.nx * Math.sign(nt.d)) : crH(x, z, 5) * TAU;   // (facing the track)
      if (k === 0) stat.lamp.push([x, z, yaw]); else if (k === 1) { /* the mapped signal: a node on the junction; its poles go on the corners below */ }
      else if (k === 2) stat.hydrant.push([x, z, R() * TAU]); else if (k === 3) stat.bollard.push([x, z, 0]); else if (k === 4) stat.bin.push([x, z, R() * TAU]);
      else if (k === 5) stat.shelter.push([x, z, yaw]); else if (k === 6) stat.bench.push([x, z, yaw]);
    }
    // the signals of the junctions away from the track (the mapped nodes): a mast arm on two corners, over the street
    for (const [k, x, z] of items) { if (k !== 1) continue; const b = barAt(x, z); if (b.ad < b.lim + 6) continue;
      const st = dtStreetAt(x, z, 2); if (!st) continue; const hw = st.r.hw, nx = -st.tz, nz = st.tx;
      for (const e of [-1, 1]) { const sx = x + nx * e * (hw + 1.2) + st.tx * e * 6, sz = z + nz * e * (hw + 1.2) + st.tz * e * 6; if (bldIn(sx, sz, 0.4) || dtStreetAt(sx, sz, 0)) continue; const bb = barAt(sx, sz); if (bb.ad < bb.lim + 1) continue;
        stat.signal.push([sx, sz, Math.atan2(-nz * e, -nx * e)]); } }
    const furnC = scen;
    for (const k in stat) for (const [x, z, yaw] of stat[k]) dtFurn(furnC.get(x, z), k, x, gH(x, z), z, yaw);
    // the lamps along the barriers: the street lights of the streets on the lap (every ~28 m, both sides, behind the fence), standing
    for (const side of [-1, 1]) for (let s = 6 + (side > 0 ? 14 : 0); s < L; s += 28) { const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i]; if (bar > W_(i) + 4) continue;
      const o = side * (bar + 1.6), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; if (bldIn(x, z, 0.5) || water(x, z)) continue;
      dtFurn(furnC.get(x, z), 'lamp', x, gH(x, z), z, Math.atan2(-T.nz[i] * side, -T.nx[i] * side));
      { const g = furnC.get(x, z), y = gH(x, z), tx = T.tx[i], tz = T.tz[i], cb = ((s / 28) | 0) % 2 ? [0.1, 0.24, 0.52] : [0.72, 0.12, 0.12], wh = [0.92, 0.92, 0.9];   // the race's banners on the pole (no words: the city's colours, a white band)
        for (const e of [-1, 1]) { const bx = x + tx * e * 0.42, bz = z + tz * e * 0.42; box(g, bx, y + 4.6, bz, 0.66, 2.2, 0.03, Math.atan2(tz, tx), cb); box(g, bx, y + 5.5, bz, 0.67, 0.22, 0.035, Math.atan2(tz, tx), wh); } } }
    // the streets' manholes and storm drains (dark iron on the asphalt): on the lap and the cross streets near it
    for (let s = 9; s < L; s += 23) { const i = T.idx(s), o = (crH(s, 1, 81) - 0.5) * W_(i) * 1.2, [x, z] = atSf(s, o), y = T.hy[i] + 0.047, g = cvG, mc = [0.2, 0.2, 0.21], n = 8;
      for (let q = 0; q < n; q++) { const a0 = q / n * TAU, a1 = (q + 1) / n * TAU; g.triO([x, y, z], [x + Math.cos(a0) * 0.42, y, z + Math.sin(a0) * 0.42], [x + Math.cos(a1) * 0.42, y, z + Math.sin(a1) * 0.42], mc, [x, y - 1, z]); }
      for (const sd of [-1, 1]) { if (crH(s, sd, 82) < 0.5) continue; const wi = W_(i), yy = T.hy[i] + 0.047, dc = [0.16, 0.16, 0.17], Q = (a, o) => { const [qx, qz] = atSf(s + a, sd * o); return [qx, yy, qz]; };   // (a drain's grate at the gutter)
        g.quadUp(Q(4.5, wi - 0.55), Q(4.5, wi - 0.12), Q(5.5, wi - 0.12), Q(5.5, wi - 0.55), [dc, dc, dc, dc]); } }
    // the race's marshals: posts every ~180 m behind the fences (a hut on a scaffold, the flag), the TV towers at the hairpin and at Turn 1
    { const post = (s, side) => { const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 2.2), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; if (bldIn(x, z, 1.5) || water(x, z) || excluded(x, z)) return false;
        const y = gH(x, z), g = scen.get(x, z), hd = T.hd[i], og = [0.94, 0.5, 0.1]; for (const e of [[-0.8, -0.6], [0.8, -0.6], [-0.8, 0.6], [0.8, 0.6]]) box(g, x + Math.cos(hd) * e[0] - Math.sin(hd) * e[1], y, z + Math.sin(hd) * e[0] + Math.cos(hd) * e[1], 0.08, 2.0, 0.08, 0, [0.6, 0.62, 0.64]);
        box(g, x, y + 2.0, z, 2.0, 0.12, 1.6, hd, [0.5, 0.52, 0.55]); box(g, x, y + 2.12, z, 1.7, 1.9, 1.3, hd, og, [0.92, 0.92, 0.9]); box(g, x - T.nx[i] * side * 0.66, y + 3.0, z - T.nz[i] * side * 0.66, 1.2, 0.5, 0.02, hd, [0.16, 0.2, 0.26]);   // (the hut: orange, a window to the track)
        exclPush(x, z, 2.5); return true; };
      for (let s = 60; s < L; s += 180) for (let t = 0; t < 30; t += 6) if (post(s + t, ((s / 180) | 0) % 2 ? 1 : -1)) break;
      const tower = (d, side) => { const s = sAt(d), i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; if (bldIn(x, z, 2) || excluded(x, z)) return;
        const y = gH(x, z), g = scen.get(x, z), sc = [0.66, 0.68, 0.7];
        for (const [ex, ez] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(g, x + ex * 1.1, y, z + ez * 1.1, 0.1, 9, 0.1, 0, sc);
        for (let h = 1.5; h < 9; h += 2.5) box(g, x, y + h, z, 2.3, 0.06, 2.3, 0, sc); box(g, x, y + 9, z, 2.6, 0.15, 2.6, 0, [0.4, 0.42, 0.45]); box(g, x, y + 9.15, z, 0.5, 0.6, 0.8, T.hd[i], [0.12, 0.12, 0.13]); exclPush(x, z, 3); };
      tower(1380, 1); tower(1500, 1); tower(130, -1); tower(2050, 1); }
    // two footbridges over the lap for the fans (steel trusses on towers with stairs, no names): on the avenue and on the riverfront
    for (const [d, sp] of [[700, 0], [2130, 0]]) { const s = sAt(d), i = T.idx(s), hd = T.hd[i], nx = T.nx[i], nz = T.nz[i], tx = T.tx[i], tz = T.tz[i], wl = T.bl[i] + 2.5, wr = T.br[i] + 2.5, y0 = T.hy[i] + 6.0, g = scen.get(T.px[i], T.pz[i]);
      const P2 = (o, a, y) => [T.px[i] + nx * o + tx * a, y, T.pz[i] + nz * o + tz * a], st = [0.24, 0.3, 0.36], dkc = [0.82, 0.83, 0.85];
      if (bldIn(...P2(-wl, 0, 0).filter((v, q) => q !== 1), 2) || bldIn(...P2(wr, 0, 0).filter((v, q) => q !== 1), 2)) continue;
      g.quadO(P2(-wl, -1.6, y0), P2(wr, -1.6, y0), P2(wr, 1.6, y0), P2(-wl, 1.6, y0), dkc, P2(0, 0, y0 - 2));   // the deck
      g.quadO(P2(-wl, -1.6, y0 - 0.5), P2(wr, -1.6, y0 - 0.5), P2(wr, 1.6, y0 - 0.5), P2(-wl, 1.6, y0 - 0.5), st, P2(0, 0, y0 + 2));
      for (const e of [-1.6, 1.6]) { g.quadO(P2(-wl, e, y0 - 0.5), P2(wr, e, y0 - 0.5), P2(wr, e, y0 + 1.3), P2(-wl, e, y0 + 1.3), st, P2(0, 0, y0)); }   // (the trusses' sides)
      g.quadO(P2(-wl, -1.7, y0 + 2.4), P2(wr, -1.7, y0 + 2.4), P2(wr, 1.7, y0 + 2.4), P2(-wl, 1.7, y0 + 2.4), [0.9, 0.9, 0.92], P2(0, 0, y0));   // (the roof)
      for (const o of [-wl, wr]) { const [cx, , cz] = P2(o, 0, 0), y = gH(cx, cz); box(g, cx, y, cz, 3.4, y0 + 2.4 - y, 3.4, hd, st, [0.9, 0.9, 0.92]); exclPush(cx, cz, 4); } }

    /* ---- START / FINISH: the gantry with the start lights over the start straight ---- */
    { const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.0, nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.7, 7.9, 0.7, h, gray);
      box(g, x, gy + 6.4, z, 1.1, 1.3, span * 2 + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]); box(g, x, gy + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, gy + 7.95, z + nz * o); m.rotation.y = -h; root.add(m); lights.push(m); }
      out.dyn.lights = lights; exclPush(x, z, span + 4); }

    /* ---- the pit lane in the car park right of the start straight (Core.Track.pitAt): the lane and its lines, the concrete apron with the
       boxes and the crews' kit, the teams' stands on the strip behind the pit wall; the teams' tents and transporters behind; the
       renderer's crews work in the 13 boxes (out.pitBoxes, the player's out.pitBox) ---- */
    let nBoxes = 0;
    if (PD) {
      const gl = new GB(true), gp = new GB(), one = [1, 1, 1], wl = [0.95, 0.95, 0.94], apC = [0.8, 0.81, 0.78], [pq0, pq1] = def.pitRow || [PD[1] + 70, PD[1] + 200];   // (def.pitRow: the crews' boxes, the player's among them)
      const at = (s, o, y) => { const [x, z] = atSf(s, o); return [x, hyS(s) + y, z]; };
      for (let q = PD[1]; q < PD[2]; q += 2) {
        const s0 = sStart + q, s1 = s0 + 2, pi = T.pitAt(s0), pj = T.pitAt(s1); if (!pi || !pj) continue;
        const A = at(s0, pi.o - 3.5, 0.034), Bq = at(s0, pi.o + 3.5, 0.034), C = at(s1, pj.o + 3.5, 0.034), D = at(s1, pj.o - 3.5, 0.034);
        gl.quadUp(A, Bq, C, D, [one, one, one, one], [[A[0] / 8, -A[2] / 8], [Bq[0] / 8, -Bq[2] / 8], [C[0] / 8, -C[2] / 8], [D[0] / 8, -D[2] / 8]]);
        gp.quadUp(at(s0, pi.o + 3.18, 0.043), at(s0, pi.o + 3.36, 0.043), at(s1, pj.o + 3.36, 0.043), at(s1, pj.o + 3.18, 0.043), [wl, wl, wl, wl]);
        if (((q / 2) | 0) % 2 === 0) gp.quadUp(at(s0, pi.o - 3.36, 0.043), at(s0, pi.o - 3.18, 0.043), at(s1, pj.o - 3.18, 0.043), at(s1, pj.o - 3.36, 0.043), [wl, wl, wl, wl]);
        { const b0 = pi.br + 0.45, b1 = pj.br + 0.45; if (pi.o - 3.5 > b0 + 0.2) gl.quadUp(at(s0, b0, 0.032), at(s0, pi.o - 3.5, 0.032), at(s1, pj.o - 3.5, 0.032), at(s1, b1, 0.032), [[0.78, 0.78, 0.8], [0.78, 0.78, 0.8], [0.78, 0.78, 0.8], [0.78, 0.78, 0.8]], [[0, 0], [0.5, 0], [0.5, 0.25], [0, 0.25]]); }   // (the strip behind the pit wall)
        if (pi.t > 0.999 && pj.t > 0.999) { gp.quadUp(at(s0, pi.o + 3.5, 0.032), at(s0, pi.o + 12.5, 0.032), at(s1, pj.o + 12.5, 0.032), at(s1, pj.o + 3.5, 0.032), [apC, apC, apC, apC]);
          gp.quadUp(at(s0, pi.o - 0.08, 0.044), at(s0, pi.o + 0.08, 0.044), at(s1, pj.o + 0.08, 0.044), at(s1, pj.o - 0.08, 0.044), [[0.1, 0.32, 0.86], [0.1, 0.32, 0.86], [0.1, 0.32, 0.86], [0.1, 0.32, 0.86]]); }   // (the blue line down the lane's middle)
      }
      pitJunction(gl, gp, hyS);   // the deceleration and acceleration lanes, the gores (in the lane's meshes)
      const TEAM = [[0.12, 0.16, 0.36], [0.85, 0.12, 0.14], [0.16, 0.46, 0.3], [0.96, 0.52, 0.1], [0.94, 0.94, 0.92], [0.14, 0.14, 0.16], [0.16, 0.36, 0.8], [0.1, 0.62, 0.72], [0.96, 0.78, 0.12], [0.55, 0.26, 0.7], [0.4, 0.42, 0.46], [0.7, 0.1, 0.1], [0.2, 0.3, 0.55]];
      const kbox = (g, s0, a, wo, y, sx, sy, sz, col, top, nb) => { const [x, z, hd] = atSf(s0 + a, wo); box(g, x, hyS(s0 + a) + y, z, sx, sy, sz, hd, col, top, nb); };
      const kcyl = (g, s0, a, wo, y, r, h, n, col, top) => { const [x, z] = atSf(s0 + a, wo); cyl(g, x, hyS(s0 + a) + y, z, r, h, n, col, top); };
      const kface = (g, s0, a0, a1, wo, y0, y1, col, dir) => { const [x0, z0] = atSf(s0 + a0, wo), [x1, z1] = atSf(s0 + a1, wo), [xb, zb] = atSf(s0 + (a0 + a1) / 2, wo - (dir || -1) * 0.2), yy = hyS(s0 + (a0 + a1) / 2);
        g.quadO([x0, yy + y0, z0], [x1, yy + y0, z1], [x1, yy + y1, z1], [x0, yy + y1, z0], col, [xb, yy + (y0 + y1) / 2, zb]); };
      const CAB = [[0.78, 0.14, 0.12], [0.2, 0.21, 0.24], [0.15, 0.3, 0.62], [0.12, 0.12, 0.13]], CMP = [[0.86, 0.14, 0.12], [0.95, 0.8, 0.14], [0.92, 0.92, 0.9]], BLK = [0.13, 0.13, 0.15], SIL = [0.66, 0.68, 0.72], SCR = [0.16, 0.24, 0.38];
      const blankets = (g, s0, a, wo, y, n, h, cmp) => { kcyl(g, s0, a, wo, y, 0.36, n * h, 8, BLK, [0.17, 0.17, 0.19]); for (let l = 0; l < n; l++) kcyl(g, s0, a, wo, y + (l + 0.42) * h, 0.366, h * 0.16, 8, cmp); };
      const cabinet = (g, s0, a, wo, sx, sy, sz, col) => { kbox(g, s0, a, wo, 0, sx * 0.94, 0.1, sz * 0.9, [0.08, 0.08, 0.09], null, true); kbox(g, s0, a, wo, 0.1, sx, sy, sz, col, [0.1, 0.1, 0.11]);
        for (let d = 0; d < 4; d++) { const y = 0.1 + sy * (0.22 + d * 0.2); kface(g, s0, a - sx * 0.43, a + sx * 0.43, wo - sz / 2 - 0.004, y, y + 0.025, SIL); } };
      const pitKit = (g, s0, k, base, wv, mine) => {
        const h = (k * 7 + 3) % 4, cmp = CMP[k % 3], mc = mine ? 9.35 : 3.4;
        if (!mine) { cabinet(g, s0, 1.6, base + 7.6, 1.15, 0.95, 0.62, CAB[h]); kbox(g, s0, 7.6, base + 7.5, 0.06, 1.75, 0.12, 0.9, [0.2, 0.2, 0.22]); for (const ta of [7.18, 8.02]) blankets(g, s0, ta, base + 7.5, 0.18, 2, 0.5, cmp); }
        kbox(g, s0, mc, base + 8.25, 0, 0.62, 0.95, 0.5, [0.22, 0.23, 0.26], [0.12, 0.12, 0.13]); kbox(g, s0, mc, base + 8.28, 1.33, 1.2, 0.4, 0.05, [0.07, 0.07, 0.08]); for (const ma of [-0.3, 0.3]) kface(g, s0, mc + ma - 0.26, mc + ma + 0.26, base + 8.25, 1.37, 1.7, SCR);
        kbox(g, s0, 5, wv + 0.72, 0.96, 2.5, 0.06, 1.0, [0.3, 0.31, 0.34], [0.36, 0.37, 0.4]);
        for (const la of [-1.18, 1.18]) for (const lw of [0.28, 1.16]) kbox(g, s0, 5 + la, wv + lw, 0, 0.07, 0.96, 0.07, [0.22, 0.22, 0.24], null, true);
        kbox(g, s0, 5, wv + 0.34, 1.02, 2.1, 0.4, 0.05, [0.07, 0.07, 0.08]); for (const ma of [-0.7, 0, 0.7]) kface(g, s0, 5 + ma - 0.3, 5 + ma + 0.3, wv + 0.368, 1.05, 1.39, SCR, 1);
        for (const pa of [-1.2, 1.2]) kbox(g, s0, 5 + pa, wv + 0.2, 0, 0.08, 2.5, 0.08, [0.25, 0.26, 0.28], null, true);
        kbox(g, s0, 5, wv + 0.8, 2.5, 2.7, 0.07, 1.55, [0.22, 0.23, 0.26], TEAM[k % TEAM.length]); };
      const tent = (g, s0, k, base) => {   // the team's tent behind its box: a white frame tent, the team's colour on its valance, a transporter behind
        const tc = TEAM[k % TEAM.length], WT = [0.95, 0.95, 0.94];
        for (const a of [0.4, 9.6]) for (const o of [base + 9.4, base + 15.6]) kbox(g, s0, a, o, 0, 0.1, 2.6, 0.1, [0.75, 0.76, 0.78], null, true);
        kbox(g, s0, 5, base + 12.5, 2.6, 9.6, 0.35, 6.4, tc, tc); const [x0, z0] = atSf(s0, base + 9.2), [x1, z1] = atSf(s0 + 10, base + 9.2), [x2, z2] = atSf(s0 + 10, base + 15.8), [x3, z3] = atSf(s0, base + 15.8), [xm, zm] = atSf(s0 + 5, base + 12.5), y = hyS(s0 + 5) + 2.95;
        const RF = k % 2 ? tc : WT, RF2 = k % 2 ? tc.map(v => v * 0.85) : [0.82, 0.83, 0.85]; g.triO([x0, y, z0], [x1, y, z1], [xm, y + 1.3, zm], RF, [xm, y - 3, zm]); g.triO([x1, y, z1], [x2, y, z2], [xm, y + 1.3, zm], RF2, [xm, y - 3, zm]); g.triO([x2, y, z2], [x3, y, z3], [xm, y + 1.3, zm], RF, [xm, y - 3, zm]); g.triO([x3, y, z3], [x0, y, z0], [xm, y + 1.3, zm], RF2, [xm, y - 3, zm]);
        kbox(g, s0, 5, base + 15.4, 0, 9.4, 2.5, 0.06, WT); kbox(g, s0, 5, base + 22, 0.3, 13.6, 3.6, 2.5, [0.92, 0.92, 0.93], tc);
        for (const wa of [-5, -3.6, 4.6]) for (const sd of [-1.05, 1.05]) kbox(g, s0, 5 + wa, base + 22 + sd, 0, 1.0, 1.0, 0.35, [0.08, 0.08, 0.09], null, true); };
      for (let q = pq0, k = 0; q <= pq1; q += 10, k++) { const s0 = sStart + q, i = T.idx(s0), p = T.pitAt(s0); if (!p || p.t < 0.999) continue;
        const tx = T.tx[i], tz = T.tz[i], base = p.o + 3.5, hd = T.hd[i];
        gp.quadUp(at(s0 - 0.09, base, 0.044), at(s0 + 0.09, base, 0.044), at(s0 + 0.09, base + 9, 0.044), at(s0 - 0.09, base + 9, 0.044), [wl, wl, wl, wl]);
        if (nBoxes >= 13) continue; nBoxes++;
        const tc = TEAM[k % TEAM.length], cx = T.px[i] + T.nx[i] * (base + 4.2) + tx * 5, cz = T.pz[i] + T.nz[i] * (base + 4.2) + tz * 5, mine = PD[3] != null && Math.abs(q + 5 - PD[3]) < 1, yb = hyS(s0 + 5);
        if (mine) { const sb = s0 + 5, bp = T.bayPose(PD[3]);   // (the car stops in its box on the apron, parked straight in front of the garage: Core's BAY)
          out.pitBox = { s: sb, x: cx, z: cz, hd, tx, tz, nx: T.nx[i], nz: T.nz[i], lane: p.o, wallO: p.wall, apron0: base, garage0: base + 9, stop: atSf(sb, bp.o), stopO: bp.o, stopA: bp.a }; }
        const g = scen.get(cx, cz); pitKit(g, s0, k, base, p.wall, mine); tent(g, s0, k, base); exclPush(cx, cz, 14);
        const oc = atSf(s0 + 5, 0); (out.pitBoxes = out.pitBoxes || []).push({ k, s: s0 + 5, ox: oc[0], oz: oc[1], tx, tz, nx: T.nx[i], nz: T.nz[i], hd, base, lane: p.o, wall: p.wall, team: tc, mine, y: yb });
        out.pitBoxes[out.pitBoxes.length - 1].gar = { band: [base + 9.3, 2.6, 2.95, 4.8], wall: [base + 15.37, 0.03, 2.47, 4.65] }; }   // (its tent, for the renderer's team colours: the valance, the back wall)
      { const pbs = out.pitBoxes; T.pitStands = null;
        if (pbs && pbs.length) { T.pitStands = [dS(pbs[0].s) - 1.35, dS(pbs[pbs.length - 1].s) + 1.35]; const kt = [0.86, 0.86, 0.83], kf = [0.66, 0.67, 0.64];
          for (let q = T.pitStands[0] - 28; q < T.pitStands[1] + 28; q += 2) { const s0 = sStart + q, pi = T.pitAt(s0), pj = T.pitAt(s0 + 2); if (!pi || !pj || pi.gap || pj.gap) continue;
            const ai = pi.inner, aj = pj.inner; if (ai - pi.wall < 0.15 && aj - pj.wall < 0.15) continue;
            gp.quadUp(at(s0, ai - 0.15, 0.1), at(s0, ai, 0.1), at(s0 + 2, aj, 0.1), at(s0 + 2, aj - 0.15, 0.1), [kt, kt, kt, kt]); gp.quadO(at(s0, ai, 0.02), at(s0 + 2, aj, 0.02), at(s0 + 2, aj, 0.1), at(s0, ai, 0.1), kf, at(s0, ai - 1, 0.05)); } } }
      for (const [qa, dq] of [[PD[1] + 30, 4], [PD[2] - 26, -4]]) for (let k = 0; k < 3; k++) { const s = sStart + qa + k * dq, i = T.idx(s), p = T.pitAt(s); if (!p) continue; const o = (T.br[i] + 0.9 + p.o - 3.5) / 2; if (o < T.br[i] + 0.5 || o > p.o - 4) continue; const [x, z] = atS(s, o); props.push({ kind: 'cone', x, z, yaw: R() * TAU, col: 0 }); }
      // the lane's outer edge: a concrete wall under a fence along the boxes' backs (the paddock behind)
      for (let q = PD[1]; q < PD[2]; q += 2) { const s0 = sStart + q, pi = T.pitAt(s0), pj = T.pitAt(s0 + 2); if (!pi || !pj) continue; const ea = pi.t > 0.999 ? pi.o + 25.5 : pi.lout + 0.4, eb = pj.t > 0.999 ? pj.o + 25.5 : pj.lout + 0.4, A = at(s0, ea, 0), B2 = at(s0 + 2, eb, 0);
        fenceC.get(A[0], A[2]).quadO([A[0], A[1] + 0.8, A[2]], [B2[0], B2[1] + 0.8, B2[2]], [B2[0], B2[1] + 3.2, B2[2]], [A[0], A[1] + 3.2, A[2]], [1, 1, 1], at(s0, ea - 3, 1), [[q / 2.5, 0], [(q + 2) / 2.5, 0], [(q + 2) / 2.5, 1], [q / 2.5, 1]]);
        scen.get(A[0], A[2]).quadO([A[0], A[1], A[2]], [B2[0], B2[1], B2[2]], [B2[0], B2[1] + 0.8, B2[2]], [A[0], A[1] + 0.8, A[2]], cW, at(s0, ea - 3, 0.4)); }
      for (let q = PD[1] + 50; q < PD[2] - 40; q += 4) { const s0 = sStart + q, pi = T.pitAt(s0), pj = T.pitAt(s0 + 4); if (!pi || !pj || pi.t < 0.999 || pj.t < 0.999) continue;   // the paddock: the car park's asphalt behind the boxes
        const A = at(s0, pi.o + 12.5, 0.03), B2 = at(s0, pi.o + 25.5, 0.03), C2 = at(s0 + 4, pj.o + 25.5, 0.03), D2 = at(s0 + 4, pj.o + 12.5, 0.03), pc = [0.78, 0.78, 0.8];
        gl.quadUp(A, B2, C2, D2, [pc, pc, pc, pc], [[A[0] / 8, -A[2] / 8], [B2[0] / 8, -B2[2] / 8], [C2[0] / 8, -C2[2] / 8], [D2[0] / 8, -D2[2] / 8]]); }
      addM(gl, tMat); addM(gp, mkMat);
    }

    /* ---- grandstands (scaffold stands as on a street circuit, behind the fences where the street is free of buildings): steel frames, the tiers,
       a seated crowd, a roof over the long one on the start straight ---- */
    const crowdMat = ownTex(rbCrowdTex(false)), crowdG = new GB(true);
    let nStands = 0;
    const standFree = (x, z) => !bldIn(x, z, 1.5) && !water(x, z) && !excluded(x, z);
    for (const [sa, sb, side, rows, roof, sections] of def.stands || []) {
      const dep = 0.9, rise = 0.55, secL = (sb - sa) / sections;
      for (let sec = 0; sec < sections; sec++) {
        const a = sa + sec * secL + 1.5, b = sa + (sec + 1) * secL - 1.5; let st = [];
        const flush = () => {   // build the run of stations collected so far
          if (st.length < 3) { st = []; return; }
          const rows2 = st.map(q => { const prof = [[q.f0 - 0.3, q.gy - 0.6]]; let y = q.gy;
            for (let k = 0; k < rows; k++) { const o = q.f0 + k * dep; y = q.gy + 0.6 + k * rise; prof.push([o, y], [o + dep, y]); }
            const back = q.f0 + rows * dep; prof.push([back, y + 1.1], [back + 0.3, y + 1.1], [back + 0.3, q.gy - 0.5]);
            return { s: q.s, prof, pts: prof.map(([o, yy]) => { const [x, z] = atSf(q.s, side * o); return [x, yy, z]; }), top: y + 4 }; });
          for (let m = 0; m + 1 < rows2.length; m++) { const A = rows2[m], B2 = rows2[m + 1], g = scen.get(A.pts[1][0], A.pts[1][2]), n = A.pts.length;
            for (let e = 0; e + 1 < n; e++) { const a0 = A.pts[e], a1 = A.pts[e + 1], b0 = B2.pts[e], b1 = B2.pts[e + 1], up = Math.abs(a1[1] - a0[1]) < 0.05, om = (A.prof[e][0] + A.prof[e + 1][0]) / 2, ym = (a0[1] + a1[1]) / 2;
              const [ix, iz] = atSf(A.s, side * (up ? om : e >= n - 3 ? om - 1 : om + 1)); g.quadO(a0, a1, b1, b0, up ? [0.66, 0.67, 0.7] : e >= n - 3 ? [0.4, 0.42, 0.46] : [0.56, 0.57, 0.6], [ix, up ? ym - 1 : ym, iz]); }
            const len = Math.hypot(B2.pts[1][0] - A.pts[1][0], B2.pts[1][2] - A.pts[1][2]);
            for (let k = 0; k < rows; k++) { const p0 = A.pts[1 + k * 2], p1 = A.pts[2 + k * 2], q0b = B2.pts[1 + k * 2], q1 = B2.pts[2 + k * 2], v = (k * 0.11) % 1, u0 = (m * 5) / 12;
              crowdG.quadUp([p0[0], p0[1] + 0.02, p0[2]], [p1[0], p1[1] + 0.02, p1[2]], [q1[0], q1[1] + 0.02, q1[2]], [q0b[0], q0b[1] + 0.02, q0b[2]], [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]], [[u0, v], [u0, v + 0.1], [u0 + len / 12, v + 0.1], [u0 + len / 12, v]]); }
            if (m % 2 === 0) for (const o of [A.prof[0][0] + 0.3, A.prof[A.prof.length - 2][0]]) { const [x, z] = atSf(A.s, side * o), y0 = gH(x, z); box(g, x, y0, z, 0.12, Math.max(0.2, A.pts[A.pts.length - 3][1] - y0), 0.12, 0, [0.5, 0.52, 0.56], null, true); }   // (the scaffold's legs)
            if (roof) { const q = (R2, o, y) => { const [x, z] = atSf(R2.s, side * o); return [x, y, z]; }, o0 = A.prof[0][0] + rows * dep * 0.45, o1 = A.prof[A.prof.length - 2][0] + 0.6;
              g.quadO(q(A, o0, A.top + 0.6), q(B2, o0, B2.top + 0.6), q(B2, o1, B2.top), q(A, o1, A.top), [0.92, 0.93, 0.94], q(A, (o0 + o1) / 2, A.top - 5));
              g.quadO(q(A, o0, A.top + 0.4), q(B2, o0, B2.top + 0.4), q(B2, o1, B2.top - 0.2), q(A, o1, A.top - 0.2), [0.5, 0.52, 0.56], q(A, (o0 + o1) / 2, A.top + 5));
              if (m % 3 === 0) { const [x, z] = atSf(A.s, side * (o1 - 0.3)), y0 = gH(x, z); box(g, x, y0, z, 0.25, A.top - y0, 0.25, 0, [0.86, 0.87, 0.9]); } } }
          for (const r of rows2) { const [x, z] = atSf(r.s, side * (r.prof[0][0] + rows * dep * 0.5)); exclPush(x, z, rows * dep / 2 + 4); }
          nStands++; st = []; };
        for (let d = a; d <= b + 0.01; d += 4) { const s = sAt(d), i = T.idx(s), f0 = (side > 0 ? T.br[i] : T.bl[i]) + 2.2;
          let ok = true; for (let k = 0; k <= rows; k += 2) { const [x, z] = atSf(s, side * (f0 + k * dep)); if (!standFree(x, z)) { ok = false; break; } }
          if (!ok) { flush(); continue; }
          const [x, z] = atSf(s, side * f0); st.push({ s, f0, gy: gH(x, z) + 0.1 }); }
        flush();
      }
    }
    addM(crowdG, crowdUV(new THREE.MeshLambertMaterial({ map: crowdMat, vertexColors: true }), 1, 0.11, 0.1));

    /* ---- the turn numbers on the fences (numbers only), a few city banners ---- */
    { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d'); if (tex.sponsors.image) x.drawImage(tex.sponsors.image, 0, 256, 512, 256);
      for (let k = 0; k < 9; k++) { const cx = (k % 4) * 128, cy = Math.floor(k / 4) * 64; x.fillStyle = '#123a6b'; x.fillRect(cx, cy, 128, 64); x.fillStyle = '#fff'; x.font = '900 46px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(k + 1), cx + 64, cy + 34); x.fillStyle = '#d8b02a'; x.fillRect(cx, cy + 58, 128, 6); }
      for (const [k, txt, bg] of [[9, 'DETROIT', '#0e2f56'], [10, 'MICHIGAN', '#1d5a34'], [11, 'DETROIT', '#8a1a1e']]) { const cx = (k % 4) * 128, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 128, 64); x.fillStyle = '#fff'; x.font = '900 24px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 64, cy + 33, 118); }
      const at2 = ownTex(new THREE.CanvasTexture(c)), W1 = [1, 1, 1], AU = (k) => [(k % 4) / 4, 1 - (Math.floor(k / 4) + 1) / 8, (k % 4 + 1) / 4, 1 - Math.floor(k / 4) / 8];
      const panel = (i, side, along, k, Wd, H, y0) => { const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.25), [u0, v0, u1, v1] = AU(k), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = T.hy[i] + y0, tx = T.tx[i], tz = T.tz[i];
        const A = [x - tx * Wd / 2, y, z - tz * Wd / 2], B2 = [x + tx * Wd / 2, y, z + tz * Wd / 2], C2 = [B2[0], y + H, B2[2]], D2 = [A[0], y + H, A[2]], fl = side < 0;
        bn.quadO(A, B2, C2, D2, W1, [x + T.nx[i] * side * 2, y + H / 2, z + T.nz[i] * side * 2], fl ? [[u0, v0], [u1, v0], [u1, v1], [u0, v1]] : [[u1, v0], [u0, v0], [u0, v1], [u1, v1]]); };
      (def.turns || []).forEach(([tx2, tz2], k) => { const i = T.nearestIdx(tx2, tz2), c2 = T.corners.find(c3 => { const a = c3.i0, b = c3.i1 < c3.i0 ? c3.i1 + N : c3.i1; return (i >= a && i <= b) || (i + N >= a && i + N <= b); }), side = c2 ? -c2.dir : 1;
        panel((i + N - 18) % N, side, 0, k, 2.2, 1.1, 2.4); });
      for (let s = 40, n = 0; s < L; s += 120, n++) { const i = T.idx(s), side = n % 2 ? 1 : -1; if (Math.abs(T.k[i]) > 1 / 150 || kindAt(i, side) !== 1) continue; panel(i, side, 0, 9 + (n % 3), 6, 1.5, 2.2); }
      addM(bn, new THREE.MeshLambertMaterial({ map: at2 })); }

    /* ---- the buildings: their real footprints and heights (the parts of the round towers each at its own height); the facades from the picture
       (a ground floor of shops or a lobby, the storeys above, a parapet), the flat roofs with their plant rooms and units; the round towers
       smooth; cut away between the camera and the car ---- */
    const fTex = ownTex(dtFacadeTex()), bMat = dtBldMat(fTex, cut, winU), rfTex = ownTex(dtConcTex(302, '#a9a7a2', null, 0, true)), rfMat = hjCutMat(new THREE.MeshLambertMaterial({ map: rfTex, vertexColors: true }), cut);
    const bC = new Chunks(256, true), rC = new Chunks(256, true), uC = rC;   // (the units on the roofs: in the roofs' mesh, coloured over the membrane's grey)
    const TINT = [[1, 1, 1], [1, 1, 1], [1, 0.98, 0.94], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [0.94, 0.9, 0.84], [1, 1, 1]];
    let nBld = 0;
    for (const b of B) {
      const pts = b.pts, n = pts.length, k = b.k, fh = DT_FH[k], bw = DT_BW[k], g = bC.get(b.cx, b.cz), seed = crH(Math.round(b.cx), Math.round(b.cz), 77);
      let gy = 1e9; for (const [x, z] of pts) gy = Math.min(gy, gH(x, z)); gy -= 0.1;
      const y0 = gy + b.mh, y1 = gy + Math.max(b.h, b.mh + 2), round = k === 8, tint = TINT[k].map(v => v * (0.9 + seed * 0.16)), tcol = k === 7 ? [[1, 0.94, 0.86], [0.92, 0.96, 1], [1, 1, 0.94], [0.95, 0.9, 0.9]][Math.floor(seed * 4)] : tint;
      const glassK = k === 3 || k === 5 || k === 8, gfl = !b.mh && !glassK && k !== 6 && b.h > 5 ? Math.min(4.6, b.h * 0.4) : 0, gRow = k === 6 ? 11 : k === 0 || k === 1 ? (seed < 0.5 ? 14 : 9) : seed < 0.55 ? 9 : 10;
      const par = !glassK && b.h > 8 ? 0.9 : 0, cxy = [b.cx, (y0 + y1) / 2, b.cz];
      for (let e = 0; e < n; e++) {
        const [ax, az] = pts[e], [bx, bz] = pts[(e + 1) % n], Lw = Math.hypot(bx - ax, bz - az); if (Lw < 0.05) continue;
        const nb = Math.max(1, Math.round(Lw / bw)), na = round ? [ax - b.cx, 0, az - b.cz] : null, nbN = round ? [bx - b.cx, 0, bz - b.cz] : null;
        if (round) { const la = Math.hypot(na[0], na[2]) || 1, lb = Math.hypot(nbN[0], nbN[2]) || 1; na[0] /= la; na[2] /= la; nbN[0] /= lb; nbN[2] /= lb; }
        const band = (ya, yb, row, f0, f1, col) => { const A = [ax, ya, az], Bq = [bx, ya, bz], C = [bx, yb, bz], D = [ax, yb, az], uv = [[0, dtFV(row, f0)], [nb, dtFV(row, f0)], [nb, dtFV(row, f1)], [0, dtFV(row, f1)]];
          if (round) g.quadON(A, Bq, C, D, na, nbN, nbN, na, cxy, col, col, col, col, uv); else g.quadO(A, Bq, C, D, col, cxy, uv); };
        let y = y0;
        if (gfl) { band(y, y + gfl, gRow, 0, 1, tcol); y += gfl; }
        const top = y1 - par, sp = 2 * fh;
        if (k === 6 || !(top > y + 0.5)) { /* (a deck: the rows below) */ }
        while (y < top - 0.05) { const yn = Math.min(top, y + sp); band(y, yn, k, 0, (yn - y) / sp, tcol); y = yn; }
        if (par) band(top, y1, 13, 0, 1, tint);
      }
      // the roof
      { const contour = pts.map(([x, z]) => new THREE.Vector2(x, z)); let tris = []; try { tris = THREE.ShapeUtils.triangulateShape(contour, []); } catch (e) { tris = []; }
        const rc = k === 8 ? [0.5, 0.52, 0.54] : (() => { const v = 0.82 + seed * 0.3; return seed < 0.25 ? [v * 0.62, v * 0.62, v * 0.64] : [v, v * 0.99, v * 0.96]; })(), rg = rC.get(b.cx, b.cz), below = [b.cx, y1 - 5, b.cz], yr = y1 - (par ? 0.25 : 0);
        for (const t of tris) { const [p0, p1, p2] = t.map(q => [pts[q][0], yr, pts[q][1]]); rg.triO(p0, p1, p2, rc, below, rc, rc, [p0[0] / 6, -p0[2] / 6], [p1[0] / 6, -p1[2] / 6], [p2[0] / 6, -p2[2] / 6]); }
        // on the roof: a plant room on the taller ones, units and a few vents (on the flat roofs big enough)
        const area = Math.abs(pts.reduce((a, p, q) => a + p[0] * pts[(q + 1) % n][1] - pts[(q + 1) % n][0] * p[1], 0)) / 2;
        if (!round && area > 150 && b.h > 6) { const ug = uC.get(b.cx, b.cz), rnd = rng(Math.floor(seed * 1e6));
          const inside = (x, z, m) => dtInPoly(pts, x, z) && dtInPoly(pts, x + m, z) && dtInPoly(pts, x - m, z) && dtInPoly(pts, x, z + m) && dtInPoly(pts, x, z - m);
          if (b.h > 25 && inside(b.cx, b.cz, 5)) { const s2 = Math.min(10, Math.sqrt(area) * 0.3); box(ug, b.cx, yr, b.cz, s2, 3.2 + rnd() * 2, s2 * 0.8, seed * 3, [1.05, 1.04, 1.0], [0.9, 0.9, 0.9]); }
          for (let q = 0; q < Math.min(6, area / 120); q++) { const x = b.bb[0] + rnd() * (b.bb[2] - b.bb[0]), z = b.bb[1] + rnd() * (b.bb[3] - b.bb[1]); if (!inside(x, z, 2)) continue;
            box(ug, x, yr, z, 1.6 + rnd() * 2, 1.0 + rnd() * 0.8, 1.2 + rnd() * 1.5, seed * 3, [1.15, 1.16, 1.18], [1.0, 1.01, 1.02]); } } }
      nBld++;
    }
    bC.addTo(root, bMat, true, true); rC.addTo(root, rfMat, false, true);

    /* ---- the elevated light rail loop round the centre: its concrete box beam 7 m up on round columns (none on the track) ---- */
    { const a = dtI16(S.pm || ''), cc = [0.72, 0.71, 0.68], cs = [0.6, 0.59, 0.56], cb = [0.5, 0.49, 0.47];
      for (let p = 0; p < a.length;) { const n = a[p], pts = []; for (let q = 0; q < n; q++) pts.push([a[p + 1 + 2 * q] / 4, a[p + 2 + 2 * q] / 4]); p += 1 + 2 * n;
        for (let k = 0; k + 1 < n; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], L2 = Math.hypot(bx - ax, bz - az); if (L2 < 0.1) continue;
          const nx = -(bz - az) / L2 * 1.3, nz = (bx - ax) / L2 * 1.3, ya = gH(ax, az) + 7, yb = gH(bx, bz) + 7, g = scen.get(ax, az), ins = [(ax + bx) / 2, (ya + yb) / 2 + 0.8, (az + bz) / 2];
          const A = (x, z, y, o) => [x + nx * o, y, z + nz * o];
          g.quadO(A(ax, az, ya, -1), A(bx, bz, yb, -1), A(bx, bz, yb + 1.7, -1), A(ax, az, ya + 1.7, -1), cs, ins); g.quadO(A(ax, az, ya, 1), A(bx, bz, yb, 1), A(bx, bz, yb + 1.7, 1), A(ax, az, ya + 1.7, 1), cs, ins);
          g.quadO(A(ax, az, ya + 1.7, -1), A(bx, bz, yb + 1.7, -1), A(bx, bz, yb + 1.7, 1), A(ax, az, ya + 1.7, 1), cc, ins); g.quadO(A(ax, az, ya, -1), A(bx, bz, yb, -1), A(bx, bz, yb, 1), A(ax, az, ya, 1), cb, ins);
          for (let t = (k * 7) % 24; t < L2; t += 24) { const x = ax + (bx - ax) * t / L2, z = az + (bz - az) * t / L2; if (inBarrier(x, z, -2) || bldIn(x, z, 0.8) || dtStreetAt(x, z, -1.5)) continue;
            const y0 = gH(x, z); cyl(g, x, y0, z, 0.55, 7, 8, cs, null); box(g, x, y0 + 6.4, z, 1.8, 0.6, 1.8, Math.atan2(bz - az, bx - ax), cc); } } } }

    /* ---- the trees: the mapped ones, the street trees of the boulevards and the riverfront's, the parks' from the land cover; honey locusts,
       lindens and maples, a few pines; cut away between the camera and the car ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut), tgeo = [dtTreeGeo(0), dtTreeGeo(1)], tic = tgeo.map(g => new IChunks(g, tMatT, 384));
    let nTrees = 0;
    const treeOk = (x, z) => { if (water(x, z) || bldIn(x, z, 1.8) || excluded(x, z)) return false; const b = barAt(x, z); if (b.ad < b.lim + 1.2) return false; if (dtStreetAt(x, z, 0.6)) return false; return true; };
    const plant = (x, z, big) => { if (!treeOk(x, z)) return false; const h = crH(Math.round(x * 3), Math.round(z * 3), 41), kind = h < 0.5 ? 0 : 1, s = (big ? 8.5 : 6.5) + crH(x, z, 42) * 4, gc = 0.85 + crH(x, z, 43) * 0.3;
      tic[kind].add(x, gH(x, z), z, crH(x, z, 44) * TAU, s * (kind === 2 ? 0.6 : 0.85), s, [gc, gc * (0.96 + crH(x, z, 45) * 0.08), gc]); exclPush(x, z, 1.5); nTrees++; return true; };
    for (const [k, x, z] of items) if (k === 11) plant(x, z, true);
    { const RV = P.river; for (let k = 0; k < RV.length; k++) { const [ax, az] = RV[k], [bx, bz] = RV[(k + 1) % RV.length], L2 = Math.hypot(bx - ax, bz - az); if (az > 800 || bz > 800 || L2 > 300) continue;   // the promenade's trees, a row 12 m from the water
        const nx = (bz - az) / L2, nz = -(bx - ax) / L2; for (let t = 4; t < L2; t += 10) { let x = ax + (bx - ax) * t / L2 + nx * 13, z = az + (bz - az) * t / L2 + nz * 13; if (water(x, z)) { x -= nx * 26; z -= nz * 26; } if (dtGroundD(x, z) < 200) plant(x, z, false); } } }
    { const G = P.G; for (let z = G.z0; z < G.z0 + (G.nz - 1) * G.cell; z += 9) for (let x = G.x0; x < G.x0 + (G.nx - 1) * G.cell; x += 9) {   // the land cover's trees and the lawns' scattered ones (in the parks along the river)
        if (dtGroundD(x, z) > 200) continue; const lc = dtLC(x, z), j = crH(Math.round(x), Math.round(z), 46);
        if (lc === 1 && j < 0.5 * dens) plant(x + (crH(x, z, 47) - 0.5) * 6, z + (crH(x, z, 48) - 0.5) * 6, true);
        else if (lc === 2 && j < 0.08 * dens) plant(x + (crH(x, z, 47) - 0.5) * 6, z + (crH(x, z, 48) - 0.5) * 6, false); } }
    for (const r of P.streets) { if (r.cls > 2 || r.hw < 5.5) continue;   // the street trees along the wider streets (in pits in the sidewalk, ~11 m apart)
      for (let k = 0; k + 1 < r.pts.length; k++) { const [ax, az] = r.pts[k], [bx, bz] = r.pts[k + 1], L2 = Math.hypot(bx - ax, bz - az); if (L2 < 12) continue; const nx = -(bz - az) / L2, nz = (bx - ax) / L2;
        for (let t = 6; t < L2 - 6; t += 11) for (const sd of [-1, 1]) { const x = ax + (bx - ax) * t / L2 + nx * sd * (r.hw + 2.2), z = az + (bz - az) * t / L2 + nz * sd * (r.hw + 2.2); if (crH(Math.round(x), Math.round(z), 49) < 0.62 * dens) plant(x, z, false); } } }
    for (const ic of tic) ic.addTo(root, true);

    /* ---- the fans: on the sidewalks behind the fences along the lap (thicker at the corners and by the stands), on the parking decks' roofs ---- */
    const CR = crowdCtx({ chunk: 160, gH, near: (x, z) => { const b = barAt(x, z); return b.ad - b.lim; }, maxSlope: 0.9 });
    let nFans = 0;
    const fanOk = (x, z) => !bldIn(x, z, 0.5) && !water(x, z) && !excluded(x, z) && !dtStreetAt(x, z, -1.5);
    for (const side of [-1, 1]) for (let s = 0; s < L; s += 1.1) { const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i]; if (bar > W_(i) + 4) continue;
      const nearC = T.corners.some(c => { const d = Math.abs(i - c.i0); return Math.min(d, N - d) * ds < 60; }), p = crH(Math.round(s * 7), side, 51);
      if (p > (nearC ? 0.32 : 0.09) * dens) continue;
      for (let r2 = 0; r2 < (nearC ? 2 : 1); r2++) { const o = side * (bar + 1.0 + r2 * 0.75 + crH(s, r2, 52) * 0.3), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; if (!fanOk(x, z)) continue;
        if (crowdPut(CR, x, gH(x, z), z, -side * T.nx[i], -side * T.nz[i], { flag: 0.06 }, r2)) nFans++; } }
    for (const b of B) { if (b.k !== 6 || b.mh) continue; const n = b.pts.length;   // the parking decks near the track: fans along the roof's edges facing it
      let near = 1e9; for (const [x, z] of b.pts) near = Math.min(near, dtGroundD(x, z)); if (near > 60) continue;
      let gy = 1e9; for (const [x, z] of b.pts) gy = Math.min(gy, gH(x, z)); const y = gy - 0.1 + b.h;
      for (let e = 0; e < n; e++) { const [ax, az] = b.pts[e], [bx, bz] = b.pts[(e + 1) % n], L2 = Math.hypot(bx - ax, bz - az); if (L2 < 3) continue;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, bq = barAt(mx, mz); if (bq.ad - bq.lim > 45) continue;
        let fx = (bz - az) / L2, fz = -(bx - ax) / L2; if (dtInPoly(b.pts, mx + fx * 1.5, mz + fz * 1.5)) { fx = -fx; fz = -fz; }
        for (let t = 0.6; t < L2 - 0.6; t += 0.85) for (let r2 = 0; r2 < 2; r2++) { if (crH(Math.round(t * 5), e + r2 * 17, 53) > 0.4 * dens) continue; const x = ax + (bx - ax) * t / L2 - fx * (0.7 + r2 * 0.8), z = az + (bz - az) * t / L2 - fz * (0.7 + r2 * 0.8);
          if (crowdPut(CR, x, y, z, fx, fz, { flag: 0.08 }, r2)) nFans++; } } }

    /* ---- the car parks: cars in rows on the mapped lots near the track, the stalls' lines ---- */
    let nCars = 0;
    { const cg = dtCarGeo(), ic = new IChunks(cg, matVC, 256), lines = mkC, PAL = [[0.85, 0.85, 0.86], [0.12, 0.12, 0.14], [0.55, 0.57, 0.6], [0.6, 0.08, 0.08], [0.1, 0.2, 0.45], [0.9, 0.9, 0.88], [0.3, 0.32, 0.34], [0.75, 0.62, 0.3], [0.2, 0.35, 0.25]];
      for (const p of P.lu) { if (p.k !== 3) continue; let near = 1e9; for (const [x, z] of p.pts) near = Math.min(near, dtGroundD(x, z)); if (near > 90) continue;
        let bi = 0, bl = 0; for (let e = 0; e < p.pts.length; e++) { const [ax, az] = p.pts[e], [bx, bz] = p.pts[(e + 1) % p.pts.length], l = Math.hypot(bx - ax, bz - az); if (l > bl) { bl = l; bi = e; } }
        const [ax, az] = p.pts[bi], [bx, bz] = p.pts[(bi + 1) % p.pts.length], ux = (bx - ax) / bl, uz = (bz - az) / bl, vx = -uz, vz = ux, yaw = Math.atan2(vz, vx);
        let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of p.pts) { const u = (x - ax) * ux + (z - az) * uz, v = (x - ax) * vx + (z - az) * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
        for (let v = v0 + 3; v < v1 - 3; v += 16) for (const half of [-1, 1]) for (let u = u0 + 1.5; u < u1 - 1.5; u += 2.7) {
          const vc = v + half * 2.7, x = ax + ux * u + vx * vc, z = az + uz * u + vz * vc; if (!dtInPoly(p.pts, x, z) || bldIn(x, z, 1) || excluded(x, z) || dtStreetAt(x, z, 0.5) || pitRoadAt(x, z, 2.5)) continue; const bq = barAt(x, z); if (bq.ad < bq.lim + 2) continue;
          { const y = gH(x, z) + 0.06, a1 = [x + ux * 1.35 - vx * 2.6 * half, y, z + uz * 1.35 - vz * 2.6 * half], a2 = [x + ux * 1.35 + vx * 2.6 * half, y, z + uz * 1.35 + vz * 2.6 * half], wl = [0.92, 0.92, 0.9];
            lines.get(x, z).quadUp([a1[0] - ux * 0.06, y, a1[2] - uz * 0.06], [a1[0] + ux * 0.06, y, a1[2] + uz * 0.06], [a2[0] + ux * 0.06, y, a2[2] + uz * 0.06], [a2[0] - ux * 0.06, y, a2[2] - uz * 0.06], [wl, wl, wl, wl]); }
          if (crH(Math.round(x * 2), Math.round(z * 2), 61) > 0.45 * dens || dtGroundD(x, z) > 110) continue;
          ic.add(x, gH(x, z), z, -(yaw + (half > 0 ? Math.PI : 0)) + (crH(x, z, 62) - 0.5) * 0.06, 1, 1, PAL[Math.floor(crH(x, z, 63) * PAL.length)]); nCars++; } }
      ic.addTo(root, false); }

    /* ---- the far view: the Canadian shore (its towers, the parkland along the river), the skyline of the city round the world, the bridge
       downstream; one mesh drawn on the camera's lines of sight just inside its far plane (as Irohazaka's irFar) ---- */
    { const P0 = [], C = [], I = [], add = (x, y, z, c) => { P0.push(x, y, z); C.push(c[0], c[1], c[2]); return P0.length / 3 - 1; };
      const prism = (pts, y0, y1, c, cTop) => { const n = pts.length, b0 = P0.length / 3; for (const [x, z] of pts) { add(x, y0, z, c); add(x, y1, z, cTop || c); }
        let ar = 0; for (let e = 0; e < n; e++) { const [x0, z0] = pts[e], [x1, z1] = pts[(e + 1) % n]; ar += x0 * z1 - x1 * z0; } const cw = ar > 0;   // (the faces outward, whichever way the outline runs)
        for (let e = 0; e < n; e++) { const a = b0 + e * 2, b2 = b0 + ((e + 1) % n) * 2; if (cw) I.push(a, a + 1, b2, b2, a + 1, b2 + 1); else I.push(a, b2, a + 1, b2, b2 + 1, a + 1); }
        for (let e = 1; e + 1 < n; e++) if (cw) I.push(b0 + 1, b0 + e * 2 + 3, b0 + e * 2 + 1); else I.push(b0 + 1, b0 + e * 2 + 1, b0 + e * 2 + 3); };
      const fa = dtI16(S.far), FC = [[0.52, 0.36, 0.3], [0.6, 0.52, 0.42], [0.74, 0.7, 0.6], [0.36, 0.44, 0.52], [0.62, 0.62, 0.6], [0.36, 0.46, 0.44], [0.6, 0.6, 0.58], [0.72, 0.7, 0.66], [0.34, 0.35, 0.36]];
      for (let p = 0; p < fa.length;) { const n = fa[p], k = fa[p + 1], h = fa[p + 2] / 2, pts = []; for (let q = 0; q < n; q++) pts.push([fa[p + 3 + 2 * q] * 2, fa[p + 4 + 2 * q] * 2]); p += 3 + 2 * n;
        const cx = pts.reduce((a, q) => a + q[0], 0) / n, cz = pts.reduce((a, q) => a + q[1], 0) / n, y0 = (cz > 900 ? 3 : dtDem(cx, cz)) - 2, c = FC[k] || FC[4]; prism(pts, y0, y0 + 2 + h, c, c.map(v => v * 1.1)); }
      // the far bank: a strip of parkland, low buildings behind it
      { const RV = P.river; for (let x = -4200; x < 2200; x += 120) { let zs = 1e9; for (let k = 0; k < RV.length; k++) { const [ax, az] = RV[k], [bx, bz] = RV[(k + 1) % RV.length]; if ((ax - x) * (bx - x) <= 0 && Math.abs(bx - ax) > 1e-6) { const zz = az + (bz - az) * (x - ax) / (bx - ax); if (zz > 700 && zz < zs) zs = zz; } }
          if (zs > 5000) continue; const g = 0.9 + crH(x, 1, 71) * 0.2; prism([[x, zs], [x + 120, zs], [x + 120, zs + 400], [x, zs + 400]], S.water - 1, 2.5, [0.3 * g, 0.42 * g, 0.24 * g]);
          for (let q = 0; q < 4; q++) { const bx2 = x + crH(x, q, 72) * 100, bz2 = zs + 90 + crH(x, q, 73) * 260, hh = 6 + crH(x, q, 74) * 14, sz2 = 10 + crH(x, q, 75) * 20; prism([[bx2, bz2], [bx2 + sz2, bz2], [bx2 + sz2, bz2 + sz2], [bx2, bz2 + sz2]], 2, 2 + hh, [0.62, 0.6, 0.56]); }
          prism([[x, zs + 6], [x + 120, zs + 6], [x + 120, zs + 40], [x, zs + 40]], 2, 9, [0.22, 0.36, 0.18]); } }   // (the parkland's trees: a dark green band)
      // the bridge: two towers, the deck, the main cables' sag as a few straight runs, the approach spans
      { const [[x0, z0], [x1, z1]] = S.bridge, [[sx0, sz0], [sx1, sz1]] = S.span, ux = x1 - x0, uz = z1 - z0, Lb = Math.hypot(ux, uz), nx = -uz / Lb * 8, nz = ux / Lb * 8, yd = S.water + 46, BC = [0.32, 0.4, 0.42];
        const deck = (ax, az, bx, bz, y) => prism([[ax - nx, az - nz], [bx - nx, bz - nz], [bx + nx, bz + nz], [ax + nx, az + nz]], y - 2, y, BC);
        deck(x0, z0, sx0, sz0, yd - 8); deck(sx0, sz0, sx1, sz1, yd); deck(sx1, sz1, x1, z1, yd - 8);
        for (const [tx, tz] of [[sx0, sz0], [sx1, sz1]]) for (const e of [-1, 1]) { const cx = tx + nx * e, cz = tz + nz * e; prism([[cx - 3, cz - 3], [cx + 3, cz - 3], [cx + 3, cz + 3], [cx - 3, cz + 3]], S.water - 1, yd + 70, BC); }
        for (const e of [-1, 1]) for (let q = 0; q < 6; q++) { const f0 = q / 6, f1 = (q + 1) / 6, sag = (f) => yd + 70 - 62 * 4 * f * (1 - f), ax = sx0 + (sx1 - sx0) * f0 + nx * e, az = sz0 + (sz1 - sz0) * f0 + nz * e, bx = sx0 + (sx1 - sx0) * f1 + nx * e, bz = sz0 + (sz1 - sz0) * f1 + nz * e;
          prism([[ax - 0.6, az], [bx - 0.6, bz], [bx + 0.6, bz], [ax + 0.6, az]], sag(f0) - 1.2, sag(f0), BC); } }
      const g = new THREE.BufferGeometry(), nv = P0.length / 3; g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
      g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1)); g.setIndex(I); g.computeVertexNormals();
      const U = { uHz: { value: new THREE.Color(0xc8d6e2) } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false, alphaTest: 0.01, side: THREE.DoubleSide });
      m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
      m.customProgramCacheKey = () => 'dtFar';
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'dtFar';
      mesh.onBeforeRender = (r, sc) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); };
      root.add(mesh); DY.far = { mesh, P0: Float32Array.from(P0), rim: new Float32Array(nv), cx: 1e9, cy: 0, cz: 0, cf: 0 }; }

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matVC, true, true); mkC.addTo(root, mkMat, false, true);
    { const m = addM(cvG, cvMat); if (m) { m.name = 'roadcovers'; m.renderOrder = 0.75; } }   // (ROAD DECAL ORDER: the track's paint, manholes and grates under the rubber)
    crowdFinish(CR, root, out);
    { const NM = new Map([[gMat, 'dt-ground'], [aMat, 'dt-streets'], [mkMat, 'dt-marks'], [tMat, 'dt-track'], [cMat, 'dt-kerbs'], [rMat, 'dt-walls'], [fMat, 'dt-fences'], [matV, 'dt-scen'], [matVC, 'dt-cut'], [bMat, 'dt-bld'], [rfMat, 'dt-roofs'], [tMatT, 'dt-trees']]);   // (names: the budget's tests tell the parts apart)
      root.traverse(o => { if (o.isMesh && !o.name && NM.has(o.material)) o.name = NM.get(o.material); }); }
    out.propR = 110;
    out.stats = { tiles: nTiles, streets: nStreets, crossings: nCross, mouths: nMouths, props: props.length, buildings: nBld, trees: nTrees, fans: nFans, stands: nStands, boxes: nBoxes, cars: nCars };   // (read by the tests)
    return out;
  }
  function dtUpdate(D, t, car, cam) {   // the lit windows (by the time of day), the far view following the camera
    const A = typeof Render !== 'undefined' && Render.atmos, tod = A ? A.tod : 'day';
    D.win.value = tod === 'night' ? 1 : tod === 'dusk' ? 0.45 : tod === 'dawn' ? 0.3 : 0;
    if (D.far) irFarUpdate(D.far, car ? cam : null);
  }
  function dtTreeGeo(kind) {   // unit trees (height 1): 0 a honey locust (an airy, open crown of light green), 1 a linden or maple (round, dense), 2 a pine
    const g = new GB(), Rr = rng(900 + kind), bk = [0.34, 0.28, 0.22], rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    cyl(g, 0, -0.02, 0, 0.035, kind === 2 ? 0.6 : 0.45, 4, bk, null, 0.022);
    if (kind === 0) { for (const [x, y, z, r] of [[0.1, 0.64, 0.05, 0.26], [-0.1, 0.76, -0.04, 0.24]]) ico(g, x, y, z, r, 0.75, [0.4, 0.53, 0.25], Rr, 0.35); }
    else if (kind === 1) ico(g, 0, 0.66, 0, 0.38, 0.95, [0.25, 0.38, 0.18], Rr, 0.22);
    else { cone(g, 0, 0.3, 0, 0.26, 0.45, 7, [0.16, 0.3, 0.18], [0.2, 0.34, 0.2], 0); cone(g, 0, 0.55, 0, 0.2, 0.45, 7, [0.18, 0.32, 0.19], [0.22, 0.36, 0.2], 0); }
    API.ROCK_SMOOTH = rs; const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function dtCarGeo() {   // a parked car (instance tinted): the body on its dark sill, the glasshouse narrowing to the roof, the windscreen and the rear window sloped
    const g = new GB(), wh = [1, 1, 1], gl = [0.13, 0.15, 0.18], sill = [0.32, 0.32, 0.33], ins = [0, 0.6, 0];
    box(g, 0, 0.12, 0, 4.45, 0.3, 1.78, 0, sill, sill, true); box(g, 0, 0.42, 0, 4.5, 0.5, 1.8, 0, wh.map(v => v * 0.92), wh, true);
    const yb = 0.92, yt = 1.38, B = [[-1.15, -0.8], [1.25, -0.8], [1.25, 0.8], [-1.15, 0.8]], Tp = [[-0.85, -0.66], [0.45, -0.66], [0.45, 0.66], [-0.85, 0.66]];
    for (let e = 0; e < 4; e++) { const f = (e + 1) % 4; g.quadO([B[e][0], yb, B[e][1]], [B[f][0], yb, B[f][1]], [Tp[f][0], yt, Tp[f][1]], [Tp[e][0], yt, Tp[e][1]], gl, ins); }
    g.quadO([Tp[0][0], yt, Tp[0][1]], [Tp[1][0], yt, Tp[1][1]], [Tp[2][0], yt, Tp[2][1]], [Tp[3][0], yt, Tp[3][1]], wh, [0, 0, 0]);
    return g.geometry();
  }
  function dtFurn(g, kind, x, y, z, yaw) {   // the standing street furniture at (x, y, z), its arm along yaw: lamps, mast-arm signals, benches, bus shelters, bins, hydrants, bollards
    if (pitRoadAt(x, z, 0.6)) return;   // (none on the pit road's junctions)
    const c = Math.cos(yaw), s = Math.sin(yaw), dk = [0.24, 0.25, 0.27], st = [0.56, 0.58, 0.6];
    const B = (ox, oy, oz, sx, sy, sz, col, top) => box(g, x + ox * c - oz * s, y + oy, z + ox * s + oz * c, sx, sy, sz, yaw, col, top || col);
    if (kind === 'lamp') { B(0, 0, 0, 0.34, 0.5, 0.34, dk); cyl(g, x, y + 0.5, z, 0.12, 8.3, 5, dk, dk, 0.07); B(0.55, 8.85, 0, 1.2, 0.08, 0.08, dk); B(1.3, 8.72, 0, 0.75, 0.16, 0.34, [0.42, 0.44, 0.46], [0.5, 0.52, 0.54]); }
    else if (kind === 'signal') { B(0, 0, 0, 0.42, 0.14, 0.42, st); cyl(g, x, y + 0.1, z, 0.12, 5.75, 5, dk, dk, 0.09); B(2.4, 5.26, 0, 4.7, 0.13, 0.13, dk);
      for (const ox of [2.75, 4.5]) { B(ox, 4.0, 0, 0.36, 1.18, 0.3, [0.16, 0.17, 0.18]); B(ox, 4.73, 0, 0.26, 0.24, 0.34, [1, 0.2, 0.14]); } }
    else if (kind === 'bench') { B(0, 0, 0, 1.8, 0.46, 0.5, [0.2, 0.22, 0.2]); B(0, 0.46, 0.22, 1.8, 0.42, 0.06, [0.2, 0.22, 0.2]); }
    else if (kind === 'shelter') { for (const ox of [-1.9, 1.9]) B(ox, 0, 0, 0.08, 2.5, 1.5, dk); B(0, 2.5, 0, 4.1, 0.12, 1.7, [0.3, 0.32, 0.35], [0.8, 0.82, 0.84]); B(0, 0.15, 0.68, 3.8, 2.2, 0.03, [0.62, 0.72, 0.78]); }
    else if (kind === 'bin') cyl(g, x, y, z, 0.3, 0.92, 6, [0.13, 0.14, 0.14], [0.2, 0.21, 0.22]);
    else if (kind === 'hydrant') { cyl(g, x, y, z, 0.14, 0.64, 6, [0.78, 0.13, 0.1], [0.92, 0.92, 0.9]); }
    else if (kind === 'bollard') cyl(g, x, y, z, 0.11, 0.95, 5, [0.14, 0.14, 0.15], [0.4, 0.41, 0.43]);
  }

  Object.assign(API, { dtUpdate });   // (what World and the other worlds use of this one)
  Object.defineProperties(API, { DT: { get: () => DT, set: (v) => { DT = v; } } });
  World.ext.detroit = (scene, tex, opts) => buildDetroit(scene, tex, opts);
})();
