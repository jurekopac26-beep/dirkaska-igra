// Mockup only (drone.mjs): drone shots of a track drawn by the game's own renderer, in the game's page (headless, virtual time), so
// everything the game shows moves in them: its traffic and people on the open road (a race in the traffic, the player's car driving
// itself), or the title screen's race of AI cars, the birds, the helicopters, the crowds, the boats. The camera is a drone's: smooth,
// gimbal-steady moves over the road (push along it, orbit a place, look straight down and turn, rise to reveal), set as the renderer's
// own TV shot (Render.setShot), without the game's miniature blur.
window.DR = (function () {
  const STEP = 1 / 120;
  let R = null, T = null, mode = 'demo', target = null, cv = null, fps = 30;
  const ease = (t) => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  // the race the shots are of: the game's race (in the traffic) or the title screen's demo; the canvas the game draws into
  async function setup(o) {
    mode = o.mode || 'demo'; fps = o.fps || 30;
    if (o.far && o.far.tex && !o.far.map) o.far.map = await new Promise((res) => new THREE.TextureLoader().load('/__proto/' + o.far.tex, (t) => res(t), undefined, () => res(null)));
    R = mode === 'traffic' ? window.__game.race : window.__game.demo; T = R.track;
    cv = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    // a drone sees the forest as it is: no fading of the trees between the camera and the followed car (Ouninpohja's aid for the driver)
    if (!World.__dr) { const V = World.view; World.view = (out, cam) => V(out, cam, null); World.__dr = true; }
    target = mode === 'traffic' ? R.player : R.cars[0];
    if (R.tf && o.extra) more(o.extra);
    const land = o.far ? farLand(o.far, o.theme) : null;
    return { len: T.len, raceLen: T.raceLen || T.len, startS: T.startS, open: T.finishS > T.startS, cw: cv.width, ch: cv.height, cars: R.cars.length, tf: !!R.tf, land };
  }
  // ---- the land round the world's strip -------------------------------------------------------------------------------------------
  // The game builds only a strip of land round the road (and draws nothing past 700 m). A drone up high sees much further, so the land
  // round it is added: low-poly and flat-shaded like the game's own, a little under the world's own ground wherever that is built.
  // A real track: the real land round it (geo_far.py: its real heights and land cover, in the world's coordinates); a made-up or a
  // shortened one: hills grown from the world's own heights at its edge (as routemap_page.js does for the maps).
  let land = null;   // { mesh, h(x, z) } the land's height anywhere (for keeping the camera above it)
  const LC = { 10: [0x34502a, 0x2c4624], 20: [0x5f6a3c], 30: [0x6f8a3e, 0x7b9444], 40: [0x9a9858, 0x8f9a50, 0xa69c5e], 50: [0x958b80, 0x8a8278], 60: [0x8e8a80, 0x9a958c], 70: [0xe8ecf0], 80: [0x3e6a8e], 90: [0x5c7650], 95: [0x2f5a40], 100: [0x84887a], 0: [0x3e6a8e] };
  const AUTUMN = [0xa8742e, 0xc08a2c, 0x8a5a2a, 0x2c4624];   // (Vršič in October: larches and beeches among the spruces)
  function roadPts(step) { const out = []; for (let s = 0; s < T.len; s += step) { const i = T.idx(s); out.push([T.px[i], T.pz[i]]); } return out; }
  function farLand(F, theme) {
    if (land) return { n: land.n };
    const W = Render.world, g = W && W.groundH ? (x, z) => { const y = W.groundH(x, z); return Number.isFinite(y) ? y : NaN; } : () => NaN;
    const rp = roadPts(30), hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
    const vn = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, sm = (t) => t * t * (3 - 2 * t), a = hash(xi, zi), b2 = hash(xi + 1, zi), c2 = hash(xi, zi + 1), d = hash(xi + 1, zi + 1), u = sm(fx), v = sm(fz); return (a * (1 - u) + b2 * u) * (1 - v) + (c2 * (1 - u) + d * u) * v; };
    let nx, nz, x0, z0, cell, Hr = null, Cl = null;
    if (F.h) { nx = F.nx; nz = F.nz; x0 = F.x0; z0 = F.z0; cell = F.cell; Hr = F.h; Cl = F.lc; }
    else if (F.nx) { nx = F.nx; nz = F.nz; x0 = F.x0; z0 = F.z0; cell = F.cell; }   // (drawn hills under the real place's picture: its grid)
    else { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const [x, z] of rp) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, z); d = Math.max(d, z); } cell = 60; x0 = a - 9000; z0 = c - 9000; nx = Math.ceil((b - a + 18000) / cell); nz = Math.ceil((d - c + 18000) / cell); }
    const W1 = nx + 1, N = (nx + 1) * (nz + 1), H = new Float32Array(N), dist = new Float32Array(N);
    let h0 = 1e9, h1 = -1e9; for (let i = 0; i < T.N; i++) { h0 = Math.min(h0, T.hy[i]); h1 = Math.max(h1, T.hy[i]); }
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = x0 + i * cell, z = z0 + j * cell, k = j * W1 + i; let dm = 1e18; for (const p of rp) { const d = (p[0] - x) * (p[0] - x) + (p[1] - z) * (p[1] - z); if (d < dm) dm = d; } dist[k] = Math.sqrt(dm);
    }
    // the heights: the world's own ground near the road (4 m under it), the real land from 1.1 km out, a smooth blend between
    if (Hr) for (let k = 0; k < N; k++) { const i = k % W1, j = (k / W1) | 0, gy = g(x0 + i * cell, z0 + j * cell), w = Math.min(1, Math.max(0, (dist[k] - 520) / 580)), s = w * w * (3 - 2 * w); H[k] = Number.isFinite(gy) ? (gy - 4) * (1 - s) + Hr[k] * s : Hr[k]; }
    else {   // the drawn hills: the edge of the world's ground spread outwards, hills rising the further from the road (routemap_page.js)
      const near = new Uint8Array(N); let avg = 0, cnt = 0;
      for (let k = 0; k < N; k++) { const i = k % W1, j = (k / W1) | 0, gy = g(x0 + i * cell, z0 + j * cell); H[k] = Number.isFinite(gy) ? gy - 4 : h0; if (dist[k] < 520) { near[k] = 1; avg += H[k]; cnt++; } }
      avg = cnt ? avg / cnt : h0; for (let k = 0; k < N; k++) if (!near[k]) H[k] = avg;
      const tmp = new Float32Array(N);
      for (let it = 0; it < 300; it++) { for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const k = j * W1 + i; if (near[k]) { tmp[k] = H[k]; continue; } tmp[k] = (H[j * W1 + Math.max(0, i - 1)] + H[j * W1 + Math.min(nx, i + 1)] + H[Math.max(0, j - 1) * W1 + i] + H[Math.min(nz, j + 1) * W1 + i]) / 4; } H.set(tmp); }
      const amp = { pikes: 520, ouni: 40, mountain: 260, lake: 140, city: 60 }[theme] || 160;
      for (let k = 0; k < N; k++) { if (near[k]) continue; const i = k % W1, j = (k / W1) | 0, x = x0 + i * cell, z = z0 + j * cell, f = Math.min(1, (dist[k] - 520) / 1600); H[k] += f * f * amp * (vn(x / 1700, z / 1700) * 0.6 + vn(x / 640, z / 640) * 0.3 + vn(x / 260, z / 260) * 0.1) * 1.25 - f * f * amp * 0.1; }
    }
    // a real track's land with its painted picture (geo_far.py: the land cover as on the globe, the season, a little relief): each
    // point's place on it from its latitude and longitude (geo_lib.Geo: the world's origin and turn)
    if (F.map) {
      const [la0, lo0, rot] = F.geo, [b0, b1, b2, b3] = F.ll, D2R = Math.PI / 180, e2 = 0.0066943799901413165, sn = Math.sin(la0 * D2R), w = 1 - e2 * sn * sn;
      const M = 6378137 * (1 - e2) / Math.pow(w, 1.5), Nn = 6378137 / Math.sqrt(w), cs = Math.cos(la0 * D2R), cr = Math.cos(rot * D2R), sr = Math.sin(rot * D2R);
      const pos = new Float32Array(N * 3), uv = new Float32Array(N * 2);
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
        const k = j * W1 + i, x = x0 + i * cell, z = z0 + j * cell, e = x * cr + z * sr, so = -x * sr + z * cr, lat = la0 - so / M / D2R, lon = lo0 + e / (Nn * cs) / D2R;
        pos[k * 3] = x; pos[k * 3 + 1] = H[k]; pos[k * 3 + 2] = z; uv[k * 2] = (lon - b1) / (b3 - b1); uv[k * 2 + 1] = (lat - b0) / (b2 - b0);
      }
      const idx = new Uint32Array(nx * nz * 6); let q = 0; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * W1 + i, b2 = a + 1, c2 = a + W1, d = c2 + 1; idx[q++] = a; idx[q++] = c2; idx[q++] = b2; idx[q++] = b2; idx[q++] = c2; idx[q++] = d; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeVertexNormals();
      F.map.anisotropy = 8;   // (the game draws in linear colour, as the picture is)
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: F.map, color: new THREE.Color(F.tint || 0xffffff) })); mesh.receiveShadow = false; mesh.castShadow = false; mesh.frustumCulled = false;
      (Render.scene || W.root).add(mesh);
      const at = (x, z) => { const fi = (x - x0) / cell, fj = (z - z0) / cell; if (fi < 0 || fj < 0 || fi >= nx || fj >= nz) return NaN; const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, k = j * W1 + i; return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + W1] * (1 - u) + H[k + W1 + 1] * u) * v; };
      land = { mesh, n: N, h: at };
      return { n: N, cell, real: true, tex: true };
    }
    // the colours: the land cover (a real track) or the height (the drawn hills); rock where it is steep, snow up high, a little variety
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), c = new THREE.Color(), rock = new THREE.Color(0x8a857c), snow = new THREE.Color(0xeef1f4);
    const RAMP = { pikes: [[0, 0x55603a], [0.55, 0x8a7b66], [0.85, 0x9c928a], [1.2, 0xeef0f2]], ouni: [[0, 0x3b562a], [1, 0x4a6632]], mountain: [[0, 0x587637], [0.7, 0x6d7d44], [1.3, 0x8b8c7b]] }[theme] || [[0, 0x587637], [1, 0x6d7d44]];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const k = j * W1 + i, y = H[k], gx = (H[j * W1 + Math.min(nx, i + 1)] - H[j * W1 + Math.max(0, i - 1)]) / (2 * cell), gz = (H[Math.min(nz, j + 1) * W1 + i] - H[Math.max(0, j - 1) * W1 + i]) / (2 * cell), sl = Math.hypot(gx, gz), r = hash(i, j);
      if (Cl) {   // the land cover's colour, varied in patches a few hundred metres across (not speckled point by point)
        const cl = Cl[k], x = x0 + i * cell, z = z0 + j * cell, m1 = vn(x / 380, z / 380), m2 = vn(x / 150 + 7, z / 150 + 3);
        const pal = cl === 10 && theme === 'vrsic' && m1 > 0.5 ? AUTUMN : (LC[cl] || LC[30]);
        c.setHex(pal[Math.min(pal.length - 1, Math.floor(m2 * pal.length))]);
        if (F.snow) { const f = Math.min(1, Math.max(0, (y - F.snow[0]) / (F.snow[1] - F.snow[0]))); if (f > 0 && cl !== 80) c.lerp(snow, f * f * (3 - 2 * f) * (0.85 + 0.15 * m2)); }
      }
      else { const t = (y - h0) / Math.max(50, h1 - h0); let q = 0; while (q < RAMP.length - 1 && t > RAMP[q + 1][0]) q++; c.setHex(RAMP[q][1]); if (q < RAMP.length - 1) c.lerp(new THREE.Color(RAMP[q + 1][1]), Math.min(1, Math.max(0, (t - RAMP[q][0]) / (RAMP[q + 1][0] - RAMP[q][0])))); }
      if (!(Cl && Cl[k] === 80) && sl > 0.65) c.lerp(rock, Math.min(0.75, (sl - 0.65) * 1.3));
      c.multiplyScalar(0.95 + 0.1 * r);
      pos[k * 3] = x0 + i * cell; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z0 + j * cell; col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    const idx = new Uint32Array(nx * nz * 6); let q = 0; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * W1 + i, b2 = a + 1, c2 = a + W1, d = c2 + 1; idx[q++] = a; idx[q++] = c2; idx[q++] = b2; idx[q++] = b2; idx[q++] = c2; idx[q++] = d; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })); mesh.receiveShadow = false; mesh.castShadow = false; mesh.frustumCulled = false;
    (Render.scene || W.root).add(mesh);
    const at = (x, z) => { const fi = (x - x0) / cell, fj = (z - z0) / cell; if (fi < 0 || fj < 0 || fi >= nx || fj >= nz) return NaN; const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, k = j * W1 + i; return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + W1] * (1 - u) + H[k + W1 + 1] * u) * v; };
    land = { mesh, n: N, h: at };
    return { n: N, cell, real: !!Hr };
  }
  // ---- the world's own things far off ---------------------------------------------------------------------------------------------
  // The game draws its world only to 700 m; the drone sees much further (the land round it), but drawing all of the world's own things
  // (each tree, rock and house) out to the horizon is slow: past `D` metres from the camera they are left out (the land under them,
  // coloured by what grows there, stands in for them). Each thing's bounds once (the world does not move); the game uses no layers.
  let culls = null;
  function cullFar(D, cx, cy, cz) {
    const W = Render.world; if (!W || !W.root) return 0;
    if (!culls) {
      culls = []; const box = new THREE.Box3(), b = new THREE.Box3(), m = new THREE.Matrix4();
      W.root.updateMatrixWorld(true);
      W.root.traverse(o => {
        if (!o.geometry || !(o.isMesh || o.isPoints || o.isLine)) return;
        const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); if (!g.boundingBox || !isFinite(g.boundingBox.min.x)) return;
        if (o.isInstancedMesh) { box.makeEmpty(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); b.copy(g.boundingBox).applyMatrix4(m); box.union(b); } }
        else box.copy(g.boundingBox);
        box.applyMatrix4(o.matrixWorld); const s = box.getBoundingSphere(new THREE.Sphere());
        if (s.radius < 2500) culls.push({ o, s });   // (a thing as big as the land itself always drawn)
      });
    }
    const c = new THREE.Vector3(cx, cy, cz); let n = 0;
    for (const e of culls) { const far = e.s.center.distanceTo(c) - e.s.radius > D; e.o.layers.mask = far ? 0 : 1; if (far) n++; }
    return n;
  }
  // a busier day on the open road: `dens` times as many vehicles again as the game puts there (the game's own kinds and share of them:
  // cars, vans, buses, motorbikes), each at least 45 m from any other going the same way
  function more(dens) {
    const tf = R.tf, Tt = tf.T; let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (const dir of [1, -1]) {
      const a = dir > 0 ? Tt.startS + 180 : tf.s0 + 60, L = tf.s1 - 30 - a, n = Math.round(L / (dir > 0 ? 290 : 250) * dens);
      for (let k = 0; k < n; k++) {
        const s = a + (k + 0.1 + 0.8 * rnd()) * L / n, u = rnd();
        if (tf.veh.some(v => v.dir === dir && Math.abs(v.s - s) < 45)) continue;
        tf._veh(dir, u < 0.07 ? 2 : u < 0.24 ? 1 : u < 0.32 ? 3 : 0, s);
      }
    }
  }
  // the road at d metres from the start (a closed track: round and round): its middle, height, heading (smoothed over ~60 m)
  // (between the game's road points, not snapped to them: a camera that follows the road glides instead of stepping a few metres at a time)
  function posAt(s) {
    const N = T.N; s = T.open ? Math.min(Math.max(s, 0), T.len - 0.001) : (s % T.len + T.len) % T.len;
    const f = s / T.ds; let i = Math.floor(f), j; const t = f - i;
    if (T.open) { i = Math.min(i, N - 2); j = i + 1; } else { i %= N; j = (i + 1) % N; }
    return { x: T.px[i] + (T.px[j] - T.px[i]) * t, y: T.hy[i] + (T.hy[j] - T.hy[i]) * t, z: T.pz[i] + (T.pz[j] - T.pz[i]) * t };
  }
  function road(d) {
    const s = T.startS + d, p = posAt(s), a = posAt(s + 30), b = posAt(s - 30), hx = a.x - b.x, hz = a.z - b.z, l = Math.hypot(hx, hz) || 1;
    return { x: p.x, y: p.y, z: p.z, hx: hx / l, hz: hz / l };
  }
  // how smooth a shot is: the largest jump in the camera's and the aim's motion from one frame to the next (m per frame per frame)
  function jerk(S, n) {
    let mc = 0, mt = 0, P0 = pose(S, 0), P1 = pose(S, 1 / (n - 1));
    for (let k = 2; k < n; k++) { const P2 = pose(S, k / (n - 1)); mc = Math.max(mc, Math.hypot(P2.px - 2 * P1.px + P0.px, P2.py - 2 * P1.py + P0.py, P2.pz - 2 * P1.pz + P0.pz)); mt = Math.max(mt, Math.hypot(P2.tx - 2 * P1.tx + P0.tx, P2.ty - 2 * P1.ty + P0.ty, P2.tz - 2 * P1.tz + P0.tz)); P0 = P1; P1 = P2; }
    return [+mc.toFixed(3), +mt.toFixed(3)];
  }
  // the road smoothed over +-r metres (the path a drone flies along a winding road)
  function roadS(d, r) { let x = 0, y = 0, z = 0, n = 0; for (let e = -r; e <= r; e += 10) { const p = road(d + e); x += p.x; y += p.y; z += p.z; n++; } const p = road(d); return { x: x / n, y: y / n, z: z / n, hx: p.hx, hz: p.hz }; }
  function ground(x, z, y0) {   // the world's ground, or the land round it where that is higher (out of the world's strip)
    const W = Render.world, g = W && W.groundH ? W.groundH(x, z) : NaN, f = land ? land.h(x, z) : NaN, m = Math.max(Number.isFinite(g) ? g : -1e9, Number.isFinite(f) ? f : -1e9);
    return m > -1e8 ? m : y0;
  }
  // where the camera is and looks in a shot at t (0..1), before keeping it clear of the land (pose)
  function pose0(S, t) {
    const u = ease(t), fov = S.fov || 50;
    if (S.kind === 'push') {   // along the road, from d0 to d1, rising from h0 to h1, a little to the side, looking `look` m ahead
      const d = lerp(S.d0, S.d1, S.lin ? t : u), c = roadS(d, S.smooth || 60), a = roadS(d + (S.look || 120), S.smooth || 60), h = lerp(S.h0, S.h1 == null ? S.h0 : S.h1, u), sd = S.side || 0;
      const px = c.x - c.hz * sd, pz = c.z + c.hx * sd;
      return { px, py: c.y + h, pz, tx: a.x, ty: a.y + (S.lookUp || 0), tz: a.z, fov };
    }
    if (S.kind === 'orbit') {   // round a place on the road (or beside it), at radius r and height h, from angle a0 to a1 (0: behind it)
      const c = road(S.d), ang = (lerp(S.a0, S.a1, S.lin ? t : u)) * Math.PI / 180, b = Math.atan2(c.hz, c.hx) + Math.PI + ang, r = lerp(S.r, S.r1 == null ? S.r : S.r1, u);
      const ox = S.ox ? -c.hz * S.ox : 0, oz = S.ox ? c.hx * S.ox : 0, cx = c.x + ox, cz = c.z + oz, px = cx + Math.cos(b) * r, pz = cz + Math.sin(b) * r;
      return { px, py: c.y + lerp(S.h, S.h1 == null ? S.h : S.h1, u), pz, tx: cx, ty: c.y + (S.lookUp || 0), tz: cz, fov };
    }
    if (S.kind === 'top') {   // straight down (a few degrees off) over a place, turning from yaw0 to yaw1, sinking from h to h1
      const c = road(S.d), yaw = lerp(S.yaw0 || 0, S.yaw1 || 0, S.lin ? t : u) * Math.PI / 180 + Math.atan2(c.hz, c.hx), h = lerp(S.h, S.h1 == null ? S.h : S.h1, u), off = h * Math.tan((S.tilt || 10) * Math.PI / 180);
      const cx = c.x + (S.ox ? -c.hz * S.ox : 0), cz = c.z + (S.ox ? c.hx * S.ox : 0);
      return { px: cx - Math.cos(yaw) * off, py: c.y + h, pz: cz - Math.sin(yaw) * off, tx: cx, ty: c.y, tz: cz, fov };
    }
    if (S.kind === 'rise') {   // behind a place, rising from h0 to h1 while the look lifts from the road near it to the far land
      const c = roadS(S.d, S.smooth || 40), back = lerp(S.back, S.back1 == null ? S.back : S.back1, u), px = c.x - c.hx * back - c.hz * (S.side || 0), pz = c.z - c.hz * back + c.hx * (S.side || 0);
      const a = roadS(S.d + lerp(S.look0 || 40, S.look1 || 400, u), 30), py = c.y + lerp(S.h0, S.h1, u);
      return { px, py, pz, tx: a.x, ty: a.y + lerp(S.up0 || 0, S.up1 || 0, u), tz: a.z, fov };
    }
    throw new Error('shot kind ' + S.kind);
  }
  // clear of the land and the trees: the lowest the camera may fly along a shot (the ground under its path + `clear` m, the highest point
  // within a stretch round each moment, smoothed), so it glides over a ridge instead of going through the forest
  const floors = new WeakMap();
  function floorOf(S) {
    if (floors.has(S)) return floors.get(S);
    const n = 61, raw = [], c = S.clear == null ? 38 : S.clear;
    for (let i = 0; i < n; i++) { const P = pose0(S, i / (n - 1)); let g = -1e9; for (const [ox, oz] of [[0, 0], [12, 0], [-12, 0], [0, 12], [0, -12]]) g = Math.max(g, ground(P.px + ox, P.pz + oz, -1e9)); raw.push(g + c); }
    const mx = raw.map((v, i) => Math.max(...raw.slice(Math.max(0, i - 8), i + 9))), sm = mx.map((v, i) => { let a = 0, w = 0; for (let k = -6; k <= 6; k++) { const j = Math.min(n - 1, Math.max(0, i + k)), q = Math.exp(-k * k / 18); a += mx[j] * q; w += q; } return a / w; });
    const f = (t) => { const x = Math.min(1, Math.max(0, t)) * (n - 1), i = Math.min(n - 2, Math.floor(x)); return sm[i] + (sm[i + 1] - sm[i]) * (x - i); };
    floors.set(S, f); return f;
  }
  // (a smooth maximum: the camera eases up onto the clearance instead of meeting it with a jolt)
  function pose(S, t) {
    if (S.kind === 'arrive') return arrive(S, t);
    const P = pose0(S, t); if (S.kind !== 'top') { const f = floorOf(S)(t), a = P.py; P.py = (a + f + Math.sqrt((a - f) * (a - f) + 144)) / 2; } return P;
  }
  // ---- the arrival from the globe: from high above, looking at where the first shot looks, down to the first shot's own camera ----
  // The menu's globe ends on this first view. The camera then comes down along the line it looks along: its distance shrinking evenly on a
  // log scale (like a zoom), its angle from above flattening to the first shot's; it ends exactly where the first shot starts, at rest.
  // S: { kind: 'arrive', first: the first shot, D: the distance to start from (m), el: the angle from above to start at (degrees) }
  function arrive(S, t) {
    const P1 = pose(S.first, 0), tx = P1.tx, ty = P1.ty, tz = P1.tz;
    let fx = tx - P1.px, fz = tz - P1.pz; const fl = Math.hypot(fx, fz);
    if (fl < 0.5) { const r = road(S.first.d != null ? S.first.d : S.first.d0); fx = r.hx; fz = r.hz; } else { fx /= fl; fz /= fl; }   // (straight down: along the road)
    const d1 = Math.hypot(P1.px - tx, P1.py - ty, P1.pz - tz), el1 = Math.asin(Math.min(1, Math.max(-1, (P1.py - ty) / d1)));
    // (already moving at the start: the globe in the menu comes down at this speed and hands over to it; still at the end, as the first shot starts)
    const tc = Math.min(1, Math.max(0, t)), u = tc + tc * tc - tc * tc * tc, d = S.D * Math.pow(d1 / S.D, u), el = lerp(S.el * Math.PI / 180, el1, u);
    const P = { px: tx - fx * Math.cos(el) * d, py: ty + Math.sin(el) * d, pz: tz - fz * Math.cos(el) * d, tx, ty, tz, fov: P1.fov, d };
    const w = 1 - ease((t - 0.82) / 0.18);   // (clear of the land on the way down; none at the very end, where the first shot's own clearance holds)
    if (w > 0) { const f = ground(P.px, P.pz, -1e9) + 40, a = P.py; if (f > -1e8) { const m = (a + f + Math.sqrt((a - f) * (a - f) + 144)) / 2; P.py = a + (m - a) * w; } }
    return P;
  }
  // the race goes on for sec seconds (nothing drawn): the traffic race with the player's car driving itself, or the demo's AI cars
  function run(sec) {
    if (mode === 'traffic') window.__game.sim(sec, true);
    else for (let t = 0; t < sec; t += STEP) { R.step(STEP); for (const c of R.cars) { c.hitWall = 0; c.hitCar = 0; } }
  }
  // until one of the cars (the race's, not the traffic) is `before` metres short of d (at most max seconds)
  function waitCar(d, before, max) {
    const want = ((T.startS + d - before) % T.len + T.len) % T.len;
    for (let t = 0; t < (max || 120); t += 0.1) {
      for (const c of R.cars) { const s = c.q ? c.q.s : null; if (s == null) continue; const gap = ((want - s) % T.len + T.len) % T.len; if (gap < 12 || gap > T.len - 12) { target = c; return t; } }
      run(0.1);
    }
    return -1;
  }
  // frame k of a shot: the race a frame on, the camera where the shot has it, drawn by the game (JPEG). The haze as for a camera at least
  // 900 m from what it looks at (the land round the strip shows a few kilometres off), the far clip just past the haze, the near clip
  // further out the higher the camera (the depth stays sharp)
  function frame(S, k, n) {
    run(1 / fps);
    const P = pose(S, n > 1 ? k / (n - 1) : 0), d = P.d || Math.hypot(P.px - P.tx, P.py - P.ty, P.pz - P.tz), fogD = Math.max(900, d);
    const cfg = window.DR_CFG || {}, W = Render.world, cam = Render.camera, far = cfg.far || fogD * 5.5 + 300;   // (DR_CFG: prof.mjs's switches)
    if (land) land.mesh.visible = !cfg.noLand;
    cullFar(cfg.cull || Math.max(1500, d * 1.4), P.px, P.py, P.pz);
    if (W) W.farClip = false;
    if (cam && Math.abs(cam.far - far) > 1) { cam.far = far; cam.updateProjectionMatrix(); }
    Render.setShot({ px: P.px, py: P.py, pz: P.pz, tx: P.tx, ty: P.ty, tz: P.tz, fov: P.fov, near: Math.max(2, d * 0.003), fogD, sky: true, blur: 0 });
    Render.frame(1 / fps, 1, target, mode === 'traffic' ? 'chase' : 'iso', {});
    return cv.toDataURL('image/jpeg', 0.9);
  }
  // the arrival's camera every frame (for the globe in the menu, which hands over to it): [px, py, pz, tx, ty, tz] in the world's metres
  function path(S, n) { const out = []; for (let k = 0; k < n; k++) { const P = pose(S, n > 1 ? k / (n - 1) : 0); out.push([P.px, P.py, P.pz, P.tx, P.ty, P.tz].map(v => +v.toFixed(1))); } return { fov: pose(S, 0).fov, cam: out }; }
  // where the race cars are (for timing the shots)
  function cars() { return R.cars.map(c => c.q ? Math.round(((c.q.s - T.startS) % T.len + T.len) % T.len) : null); }
  return { setup, pose, run, waitCar, frame, cars, road, jerk, path };
})();
