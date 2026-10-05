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
    if (o.lc && o.far) lcAt = await loadLC(o.lc, o.far);
    const land = o.far ? farLand(o.far, o.theme) : null;
    if (land && o.edgeTint) land.edge = edgeTint(o.edgeTint.margin || 300, o.edgeTint.iters || 2, o.edgeTint.strength);
    const fR = +(((window.DR_CFG || {}).feather != null ? window.DR_CFG.feather : o.feather) || 0);
    if (land && fR > 0) land.feather = edgeFeather(fR, (window.DR_CFG || {}).featherK || o.featherK || 1, (window.DR_CFG || {}).featherIt || o.featherIt || 2);
    return { len: T.len, raceLen: T.raceLen || T.len, startS: T.startS, open: T.finishS > T.startS, cw: cv.width, ch: cv.height, cars: R.cars.length, tf: !!R.tf, land };
  }
  // ---- the land round the world's strip -------------------------------------------------------------------------------------------
  // The game builds only a strip of land round the road (and draws nothing past 700 m). A drone up high sees much further, so the land
  // round it is added: low-poly and flat-shaded like the game's own, a little under the world's own ground wherever that is built.
  // A real track: the real land round it (geo_far.py: its real heights and land cover, in the world's coordinates); a made-up or a
  // shortened one: hills grown from the world's own heights at its edge (as routemap_page.js does for the maps).
  let land = null;   // { mesh, h(x, z) } the land's height anywhere (for keeping the camera above it)
  let wcov = null;   // where the world's own ground and water are (worldCover)
  let seaExt = null;   // the world's sea carried on to the far land's edges (seaExtend)
  const groundMeshes = new WeakSet(), groundList = [];   // the world's ground meshes (worldCover): always drawn
  let lcAt = null;   // the real land cover at (x, z) (a made-up world: of the real place it stands on), from the far land cover picture
  const FE = { uFeather: { value: null }, uFeatherBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uFeatherOn: { value: 0 } };   // (the seam's colours: edgeFeather)
  // the land cover picture (raw/geo/<track>-far-lc.png: WorldCover classes, north at the top over the far box F.ll), as lcAt(x, z)
  async function loadLC(url, F) {
    const img = await new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = '/__proto/' + url; });
    if (!img || !F.geo || !F.ll) return null;
    const cvs = document.createElement('canvas'); cvs.width = img.width; cvs.height = img.height; const c2 = cvs.getContext('2d'); c2.drawImage(img, 0, 0);
    const LCD = c2.getImageData(0, 0, img.width, img.height).data, nW = img.width, nH = img.height;
    const [la0, lo0, rot] = F.geo, [b0, b1, b2, b3] = F.ll, D2R = Math.PI / 180, e2 = 0.0066943799901413165, sn = Math.sin(la0 * D2R), w0 = 1 - e2 * sn * sn;
    const M = 6378137 * (1 - e2) / Math.pow(w0, 1.5), Nn = 6378137 / Math.sqrt(w0), cs = Math.cos(la0 * D2R), cr = Math.cos(rot * D2R), sr = Math.sin(rot * D2R);
    return (x, z) => { const e = x * cr + z * sr, so = -x * sr + z * cr, lat = la0 - so / M / D2R, lon = lo0 + e / (Nn * cs) / D2R, cc = Math.floor((lon - b1) / (b3 - b1) * nW), r = Math.floor((b2 - lat) / (b2 - b0) * nH); return cc < 0 || r < 0 || cc >= nW || r >= nH ? 0 : LCD[(r * nW + cc) * 4]; };
  }
  // the world's sea (its biggest water mesh) on to the far land's edges: four more pieces round it, with its own material and its
  // texture's placing (its uv per metre), a little under it
  function seaExtend(Wt, x0, z0, x1, z1) {
    const o = Wt.o, g = o.geometry, P = g.attributes.position, U = g.attributes.uv, bb = Wt.bb, y = bb.max.y - 0.05;
    let map = null;
    if (U && P.count >= 3) {   // u = a x + b z + c, v = d x + e z + f from three of its corners (in the world's coordinates)
      const v3 = new THREE.Vector3(), pts = [];
      for (let k = 0; k < P.count && pts.length < 3; k++) { v3.fromBufferAttribute(P, k).applyMatrix4(o.matrixWorld); if (!pts.some(p => Math.hypot(p[0] - v3.x, p[1] - v3.z) < 1)) pts.push([v3.x, v3.z, U.getX(k), U.getY(k)]); }
      if (pts.length === 3) { const [p, q, r] = pts, det = (q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1]);
        if (Math.abs(det) > 1e-6) { const sol = (i) => { const a = ((q[i] - p[i]) * (r[1] - p[1]) - (r[i] - p[i]) * (q[1] - p[1])) / det, b = ((r[i] - p[i]) * (q[0] - p[0]) - (q[i] - p[i]) * (r[0] - p[0])) / det; return [a, b, p[i] - a * p[0] - b * p[1]]; }; map = [sol(2), sol(3)]; } }
    }
    const rects = [[x0, z0, x1, bb.min.z], [x0, bb.max.z, x1, z1], [x0, bb.min.z, bb.min.x, bb.max.z], [bb.max.x, bb.min.z, x1, bb.max.z]].filter(r => r[2] > r[0] && r[3] > r[1]);
    const pos = [], uv = [], nrm = [];
    for (const [a, b, c, e] of rects) for (const [x, z] of [[a, b], [a, e], [c, b], [c, b], [a, e], [c, e]]) { pos.push(x, y, z); nrm.push(0, 1, 0); if (map) uv.push(map[0][0] * x + map[0][1] * z + map[0][2], map[1][0] * x + map[1][1] * z + map[1][2]); }
    const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ng.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); if (map) ng.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    for (const a in g.attributes) if (!ng.attributes[a] && g.attributes[a].itemSize) { const s = g.attributes[a].itemSize, arr = new Float32Array(pos.length / 3 * s); for (let k = 0; k < pos.length / 3; k++) for (let t = 0; t < s; t++) arr[k * s + t] = g.attributes[a].array[t]; ng.setAttribute(a, new THREE.BufferAttribute(arr, s)); }
    const mesh = new THREE.Mesh(ng, o.material); mesh.frustumCulled = false; mesh.receiveShadow = o.receiveShadow; mesh.renderOrder = o.renderOrder;
    (Render.scene || Render.world.root).add(mesh); seaExt = mesh; return mesh;
  }
  const LC = { 10: [0x34502a, 0x2c4624], 20: [0x5f6a3c], 30: [0x6f8a3e, 0x7b9444], 40: [0x9a9858, 0x8f9a50, 0xa69c5e], 50: [0x958b80, 0x8a8278], 60: [0x8e8a80, 0x9a958c], 70: [0xe8ecf0], 80: [0x3e6a8e], 90: [0x5c7650], 95: [0x2f5a40], 100: [0x84887a], 0: [0x3e6a8e] };
  const AUTUMN = [0xa8742e, 0xc08a2c, 0x8a5a2a, 0x2c4624];   // (Vršič in October: larches and beeches among the spruces)
  function roadPts(step) { const out = []; for (let s = 0; s < T.len; s += step) { const i = T.idx(s); out.push([T.px[i], T.pz[i]]); } return out; }
  // where the world's own ground is: its big meshes' triangles (the terrain, the road, the water) marked on a grid of `c` m over the box,
  // and how far each cell is from it (m). Our land goes well under the world's ground wherever that is built (the two surfaces, nearly the
  // same heights from different samplings, would cut through each other in stripes) and meets it at its edge.
  function worldCover(x0, z0, c, nx, nz) {
    const W = Render.world, M = new Uint8Array(nx * nz), e = new THREE.Matrix4(), wtex = W.dyn && W.dyn.water;
    W.root.updateMatrixWorld(true);
    let val = 1; const wl = [];   // (val 2: the world's water, its meshes drawn with the world's water texture)
    const WY = new Float32Array(nx * nz); let wy = 0;   // (the water's level in each water cell)
    const SY = new Float32Array(nx * nz).fill(NaN), gH = W.groundH ? (x, z) => W.groundH(x, z) : () => NaN;   // (the lowest point of the world's buildings in each cell)
    // (the world's ground wins over its water: a sea plane runs on under the town; water only where there is no ground over it)
    const put = (k) => { if (val === 1) M[k] = 1; else if (!M[k]) { M[k] = 2; WY[k] = wy; } };
    const mark = (x, z) => { const i = Math.floor((x - x0) / c), j = Math.floor((z - z0) / c); if (i >= 0 && j >= 0 && i < nx && j < nz) put(j * nx + i); };
    for (const pass of [1, 2]) W.root.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position) return;   // (hidden ones too: the world shows only the tiles near its camera)
      if ((pass === 2) !== !!(wtex && o.material && o.material.map === wtex)) return;
      const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
      if (!isFinite(bb.min.x) || Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) < 80) return;
      const isW = !!(wtex && o.material && o.material.map === wtex); val = isW ? 2 : 1; wy = bb.max.y; if (isW) wl.push({ o, bb, area: (bb.max.x - bb.min.x) * (bb.max.z - bb.min.z) });
      const P = g.attributes.position, I = g.index, n = I ? I.count : P.count, m = o.matrixWorld.elements, X = new Float32Array(P.count), Z = new Float32Array(P.count);
      for (let k = 0; k < P.count; k++) { const x = P.getX(k), y = P.getY(k), z = P.getZ(k); X[k] = m[0] * x + m[4] * y + m[8] * z + m[12]; Z[k] = m[2] * x + m[6] * y + m[10] * z + m[14]; }
      const Y = new Float32Array(P.count); for (let k = 0; k < P.count; k++) { const x = P.getX(k), y = P.getY(k), z = P.getZ(k); Y[k] = m[1] * x + m[5] * y + m[9] * z + m[13]; }
      let nG = 0, nT = 0, up = 0, all = 0;
      const nyOf = (a, b, cc) => { const ux = X[b] - X[a], uy = Y[b] - Y[a], uz = Z[b] - Z[a], vx = X[cc] - X[a], vy = Y[cc] - Y[a], vz = Z[cc] - Z[a]; return Math.abs(uz * vx - ux * vz) / (Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) + 1e-9); };
      if (pass === 1) for (let t = 0; t + 2 < n; t += 3) { const a = I ? I.getX(t) : t, b = I ? I.getX(t + 1) : t + 1, cc = I ? I.getX(t + 2) : t + 2; all++; if (nyOf(a, b, cc) > 0.35) up++; }
      const terrain = pass === 1 && all > 0 && up / all > 0.85;   // (a terrain tile: nearly all of it faces up; a building has its walls)
      for (let t = 0; t + 2 < n; t += 3) {
        nT++;
        const a = I ? I.getX(t) : t, b = I ? I.getX(t + 1) : t + 1, cc = I ? I.getX(t + 2) : t + 2, ax = X[a], az = Z[a], bx = X[b], bz = Z[b], cx = X[cc], cz = Z[cc];
        if (pass === 1) {   // (the ground: at the world's ground height, facing up; anything else is a building, a wall, a bridge)
          const mx = (ax + bx + cx) / 3, mz = (az + bz + cz) / 3, my = (Y[a] + Y[b] + Y[cc]) / 3, gy = gH(mx, mz), nyy = nyOf(a, b, cc);
          if (!terrain && !(Number.isFinite(gy) && Math.abs(my - gy) < 3 && nyy > 0.35)) { const i = Math.floor((mx - x0) / c), j = Math.floor((mz - z0) / c); if (i >= 0 && j >= 0 && i < nx && j < nz) { const k = j * nx + i, lo = Math.min(Y[a], Y[b], Y[cc]); if (!(SY[k] <= lo)) SY[k] = lo; } continue; }
          nG++;
        }
        const lx = Math.min(ax, bx, cx), hx = Math.max(ax, bx, cx), lz = Math.min(az, bz, cz), hz = Math.max(az, bz, cz);
        if (hx - lx < c * 2 && hz - lz < c * 2) { mark((ax + bx + cx) / 3, (az + bz + cz) / 3); mark(ax, az); mark(bx, bz); mark(cx, cz); continue; }
        const den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(den) < 1e-6) continue;   // (a big triangle: every cell centre inside it)
        for (let j = Math.max(0, Math.floor((lz - z0) / c)); j <= Math.min(nz - 1, Math.floor((hz - z0) / c)); j++) for (let i = Math.max(0, Math.floor((lx - x0) / c)); i <= Math.min(nx - 1, Math.floor((hx - x0) / c)); i++) {
          const px = x0 + (i + 0.5) * c, pz = z0 + (j + 0.5) * c, l1 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / den, l2 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / den;
          if (l1 >= -0.02 && l2 >= -0.02 && l1 + l2 <= 1.02) put(j * nx + i);
        }
      }
      if (pass === 1 && nT && nG / nT > 0.4) { groundMeshes.add(o); groundList.push(o); }   // (the world's ground: never left out far off, our land is under it there)
    });
    // close the pinholes (a cell between marked ones), then the distance of every cell from the marked ones, inside (-) and out (+)
    const N2 = new Uint8Array(nx * nz); for (let k = 0; k < M.length; k++) N2[k] = M[k] === 1 ? 1 : 0;   // (the ground only)
    for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) { const k = j * nx + i; if (!M[k] && (M[k - 1] === 1) + (M[k + 1] === 1) + (M[k - nx] === 1) + (M[k + nx] === 1) >= 3) N2[k] = 1; }
    const dt = (inside) => { const D = new Float32Array(nx * nz); for (let k = 0; k < D.length; k++) D[k] = (N2[k] === 1) === inside ? 0 : 1e9;
      const r2 = Math.SQRT2;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (i > 0) D[k] = Math.min(D[k], D[k - 1] + 1); if (j > 0) { D[k] = Math.min(D[k], D[k - nx] + 1); if (i > 0) D[k] = Math.min(D[k], D[k - nx - 1] + r2); if (i < nx - 1) D[k] = Math.min(D[k], D[k - nx + 1] + r2); } }
      for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i; if (i < nx - 1) D[k] = Math.min(D[k], D[k + 1] + 1); if (j < nz - 1) { D[k] = Math.min(D[k], D[k + nx] + 1); if (i < nx - 1) D[k] = Math.min(D[k], D[k + nx + 1] + r2); if (i > 0) D[k] = Math.min(D[k], D[k + nx - 1] + r2); } }
      return D; };
    const out = dt(true), inn = dt(false);   // (out: from outside to the nearest marked cell; inn: from inside to the nearest unmarked one)
    const at = (x, z) => { const i = Math.floor((x - x0) / c), j = Math.floor((z - z0) / c); if (i < 0 || j < 0 || i >= nx || j >= nz) return 1e9; const k = j * nx + i; return N2[k] ? -inn[k] * c : out[k] * c; };
    let cnt = 0, bx0 = 1e9, bz0 = 1e9, bx1 = -1e9, bz1 = -1e9; for (let k = 0; k < N2.length; k++) if (N2[k]) { cnt++; const i = k % nx, j = (k / nx) | 0; bx0 = Math.min(bx0, x0 + i * c); bx1 = Math.max(bx1, x0 + (i + 1) * c); bz0 = Math.min(bz0, z0 + j * c); bz1 = Math.max(bz1, z0 + (j + 1) * c); }
    const water = (x, z) => { const i = Math.floor((x - x0) / c), j = Math.floor((z - z0) / c); if (i < 0 || j < 0 || i >= nx || j >= nz) return false; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && M[jj * nx + ii] === 2) return true; } return false; };
    const level = (x, z) => { const i = Math.floor((x - x0) / c), j = Math.floor((z - z0) / c); if (i < 0 || j < 0 || i >= nx || j >= nz) return NaN; let y = NaN; for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && M[jj * nx + ii] === 2) y = Number.isFinite(y) ? Math.min(y, WY[jj * nx + ii]) : WY[jj * nx + ii]; } return y; };
    wl.sort((p, q) => q.area - p.area);
    const base = (x, z) => { const i = Math.floor((x - x0) / c), j = Math.floor((z - z0) / c); if (i < 0 || j < 0 || i >= nx || j >= nz) return NaN; let y = NaN; for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && SY[jj * nx + ii] === SY[jj * nx + ii]) y = y === y ? Math.min(y, SY[jj * nx + ii]) : SY[jj * nx + ii]; } return y; };
    // the mask our land is not drawn under: the world's ground, one cell in from its edge (a thin band of both at the edge, no gap)
    const MK = new Uint8Array(nx * nz);
    for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) { const k = j * nx + i; if (N2[k] && N2[k - 1] && N2[k + 1] && N2[k - nx] && N2[k + nx] && N2[k - nx - 1] && N2[k - nx + 1] && N2[k + nx - 1] && N2[k + nx + 1]) MK[k] = 255; }
    const maskTex = new THREE.DataTexture(MK, nx, nz, THREE.LuminanceFormat, THREE.UnsignedByteType); maskTex.magFilter = maskTex.minFilter = THREE.NearestFilter; maskTex.generateMipmaps = false; maskTex.flipY = false; maskTex.needsUpdate = true;
    return { at, water, level, base, share: cnt / N2.length, waters: wl, box: cnt ? [bx0, bz0, bx1, bz1] : null, maskTex, maskBox: [x0, z0, nx * c, nz * c] };
  }
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
    // under the world's own ground wherever that is built (40 m under it well inside, well clear of its surface), meeting it at its edge (1.5 m under),
    // rising from there to the land's own heights over 400 m
    const WC = worldCover(x0 - cell, z0 - cell, 20, Math.ceil((nx + 2) * cell / 20), Math.ceil((nz + 2) * cell / 20));
    for (let k = 0; k < N; k++) {
      const i = k % W1, j = (k / W1) | 0, x = x0 + i * cell, z = z0 + j * cell, e = WC.at(x, z); if (e > 400) continue;
      const gy = g(x, z); if (!Number.isFinite(gy)) continue;
      // (just under it for two of our cells in from its edge, so the slope down from there stays hidden under its ground)
      if (e < -200) H[k] = Math.min(H[k], gy - 40);
      else if (e <= 0) { const w = Math.min(1, Math.max(0, (-e - 80) / 120)); H[k] = Math.min(H[k], gy - 1.5 - 38.5 * w * w * (3 - 2 * w)); }
      else { const w = e / 400, s = w * w * (3 - 2 * w); H[k] = (gy - 1.5) * (1 - s) + H[k] * s; }
    }
    for (let k = 0; k < N; k++) { const i = k % W1, j = (k / W1) | 0, x = x0 + i * cell, z = z0 + j * cell; if (WC.at(x, z) < 0) continue; const yl = WC.level(x, z); if (Number.isFinite(yl)) H[k] = Math.min(H[k], yl - 6); }   // (under the world's water where no ground of its own is over it)
    F.cover = +WC.share.toFixed(3); window.__WC = WC; wcov = WC;
    // the sea round a coastal world (F.sea): the world's own sea goes on to the horizon (seaExtend); our land under it wherever the real
    // land cover has water, a little above it wherever it has land (outside the world's own ground)
    if (F.sea && WC.waters.length) {
      const yw = WC.waters[0].bb.max.y; let nW = 0;
      for (let k = 0; k < N; k++) {
        const i = k % W1, j = (k / W1) | 0, x = x0 + i * cell, z = z0 + j * cell; if (WC.at(x, z) < 30 || Number.isFinite(WC.level(x, z))) continue;
        const cl = Cl ? Cl[k] : lcAt ? lcAt(x, z) : 0;
        if (cl === 80 || cl === 0) { H[k] = Math.min(H[k], yw - 6); nW++; } else H[k] = Math.max(H[k], yw + 1.5);
      }
      // (the world's own houses beyond its ground, over its sea plane: land under them, at their height; and land where both say land)
      for (let k = 0; k < N; k++) {
        const i = k % W1, j = (k / W1) | 0, x = x0 + i * cell, z = z0 + j * cell; if (WC.at(x, z) < 0 || !Number.isFinite(WC.level(x, z))) continue;
        const gy = g(x, z), by = WC.base(x, z), cl = Cl ? Cl[k] : lcAt ? lcAt(x, z) : 0;
        if (Number.isFinite(by) && by > yw - 1) H[k] = Math.max(H[k], by - 0.5, yw + 1.0);   // (under its buildings)
        else if (cl !== 80 && cl !== 0 && Number.isFinite(gy) && gy >= yw + 3) H[k] = Math.max(H[k], gy - 0.5);   // (where the real place is land and its own heights say so too)
      }
      F.seaCells = nW; seaExtend(WC.waters[0], x0, z0, x0 + nx * cell, z0 + nz * cell);
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
      const mat = new THREE.MeshLambertMaterial({ map: F.map, color: new THREE.Color(F.tint || 0xffffff) });
      // (not drawn where the world's own ground is: the two would cut through each other; a grain in the land's colour at a few sizes,
      // its picture being coarse close up: DR_CFG.detail, 1 by default, 0 for none)
      const C0 = window.DR_CFG || {}, MASK = !!(wcov && wcov.maskTex), DET = C0.detail != null ? +C0.detail : 1;
      if (MASK || DET) {
        const U = Object.assign(MASK ? { uMask: { value: wcov.maskTex }, uMaskBox: { value: new THREE.Vector4(...wcov.maskBox) } } : {}, FE);
        mat.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, U);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vWxz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWxz = ( modelMatrix * vec4( transformed, 1.0 ) ).xz;');
          let fs = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vWxz;\nuniform sampler2D uFeather;\nuniform vec4 uFeatherBox;\nuniform float uFeatherOn;' + (MASK ? '\nuniform sampler2D uMask;\nuniform vec4 uMaskBox;' : '') +
            (DET ? '\nfloat dHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }\nfloat dNoise( vec2 p ) { vec2 i = floor( p ), f = fract( p ), u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( dHash( i ), dHash( i + vec2( 1.0, 0.0 ) ), u.x ), mix( dHash( i + vec2( 0.0, 1.0 ) ), dHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }' : ''));
          if (MASK) fs = fs.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n{ vec2 mUV = ( vWxz - uMaskBox.xy ) / uMaskBox.zw; if ( mUV.x > 0.0 && mUV.y > 0.0 && mUV.x < 1.0 && mUV.y < 1.0 && texture2D( uMask, mUV ).r > 0.5 ) discard; }');
          fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\nif ( uFeatherOn > 0.5 ) { vec2 fUV = ( vWxz - uFeatherBox.xy ) / uFeatherBox.zw; if ( fUV.x > 0.0 && fUV.y > 0.0 && fUV.x < 1.0 && fUV.y < 1.0 ) { vec4 fc = texture2D( uFeather, fUV ); diffuseColor.rgb *= mix( vec3( 1.0 ), exp2( fc.rgb * 6.0 - 3.0 ), fc.a ); } }');   // (the seam: the world's own colours, edgeFeather; the factor 1/8..8, log2 stored)
          if (DET) fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n{ float n = 0.45 * dNoise( vWxz / 6.0 ) + 0.33 * dNoise( vWxz / 19.0 ) + 0.22 * dNoise( vWxz / 61.0 ); diffuseColor.rgb *= 1.0 + ' + (0.3 * DET).toFixed(3) + ' * ( n - 0.5 ); }');
          sh.fragmentShader = fs;
        };
        mat.customProgramCacheKey = () => 'farLand' + (MASK ? 'M' : '') + (DET ? 'D' + DET : '');
      }
      const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = false; mesh.castShadow = false; mesh.frustumCulled = false;
      (Render.scene || W.root).add(mesh);
      const at = (x, z) => { const fi = (x - x0) / cell, fj = (z - z0) / cell; if (fi < 0 || fj < 0 || fi >= nx || fj >= nz) return NaN; const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, k = j * W1 + i; return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + W1] * (1 - u) + H[k + W1 + 1] * u) * v; };
      land = { mesh, n: N, h: at, grid: { x0, z0, cell, nx, nz, H } };
      return { n: N, cell, real: true, tex: true, cover: F.cover, seaCells: F.seaCells };
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
  // ---- our land's colour at the world's edge matched to the world's own ground ---------------------------------------------------
  // The world's ground and our painted land meet at the world's edge in two different colours. The two are measured as drawn (the game
  // draws, from high above, both at once), and our land is tinted (its vertex colours) towards the world's colour near the edge, fading
  // out over `margin` m with a little irregularity; twice (the game's colour grading is not quite linear).
  // ---- the seam: our land round the world's own ground takes on the world's own colours, fading out over R metres, so its fields,
  // meadows, snow and woods do not stop at the edge of its square tiles. Pictures from straight above in the same light, each taken
  // twice (the sky black, then white: what differs is sky, so the edge's mixed pixels are left out): the world's ground alone (nothing
  // standing on it, no road) and our land alone. Each 10 m cell inside the world's edge takes its
  // ground's colour (its water does not count), carried outward smoothly (push-pull: an empty cell takes the colour of the coloured
  // ones about it, from ever coarser levels); out there our land's colour is multiplied by the world's over its own (each channel,
  // within 1/8..8), measured again with that on and corrected (the game's grading is not linear), all of it at the edge and none
  // R metres out (a little unevenly, as a real edge is).
  function edgeFeather(R, k0, iters) {
    if (!land || !land.grid || !wcov || !wcov.box || !cv) return null;
    const cam = Render.camera, W = Render.world, sc = Render.scene, root = sc || W.root, [bx0, bz0, bx1, bz1] = wcov.box, cell = 10, t0 = performance.now(), dbg = !!(window.DR_CFG || {}).featherDbg;
    const fx0 = bx0 - R - 40, fz0 = bz0 - R - 40, nX = Math.ceil((bx1 - bx0 + 2 * R + 80) / cell), nZ = Math.ceil((bz1 - bz0 + 2 * R + 80) / cell), N = nX * nZ;
    const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2, aspect = cv.width / cv.height, fov = 12, half = Math.max((bz1 - bz0) / 2 + R + 60, ((bx1 - bx0) / 2 + R + 60) / aspect) * 1.04, Hc = half / Math.tan(fov / 2 * Math.PI / 180), gy0 = ground(cx, cz, 0);
    const cw = cv.width, ch = cv.height, c2 = document.createElement('canvas'); c2.width = cw; c2.height = ch; const x2 = c2.getContext('2d', { willReadFrequently: true });
    const shot1 = (bg) => {
      const bg0 = sc ? sc.background : null; if (sc) sc.background = new THREE.Color(bg);
      if (W) W.farClip = false; cullFar(1e9, cx, gy0 + Hc, cz); cam.far = Hc * 2 + 20000; cam.updateProjectionMatrix(); cam.up.set(0, 0, -1);
      Render.setShot({ px: cx, py: gy0 + Hc, pz: cz + 0.5, tx: cx, ty: gy0, tz: cz, fov, near: Hc * 0.4, fogD: 1e7, sky: false, blur: 0 });   // (no sky dome: the sky is the background)
      Render.frame(0, 1, target, mode === 'traffic' ? 'chase' : 'iso', {}); x2.clearRect(0, 0, cw, ch); x2.drawImage(cv, 0, 0); cam.updateMatrixWorld();
      if (sc) sc.background = bg0; cam.up.set(0, 1, 0);
      if (dbg) (window.__feDbg = window.__feDbg || []).push(c2.toDataURL('image/jpeg', 0.85));
      return x2.getImageData(0, 0, cw, ch).data;
    };
    // a picture, and where it shows something (the same over a black sky and over a white one)
    const shot = (hideFn) => {
      const hid = []; root.traverse(o => { if (o.visible && hideFn(o)) { o.visible = false; hid.push(o); } });
      const A = shot1(0x000000), B = shot1(0xffffff); for (const o of hid) o.visible = true;
      const M = new Uint8Array(cw * ch); for (let q = 0, p = 0; q < M.length; q++, p += 4) M[q] = Math.abs(A[p] - B[p]) + Math.abs(A[p + 1] - B[p + 1]) + Math.abs(A[p + 2] - B[p + 2]) < 9 ? 1 : 0;
      return { D: A, M };
    };
    const isIn = (o, r) => { for (let p = o; p; p = p.parent) if (p === r) return true; return false; };
    const hideL = (o) => o === seaExt || (o !== land.mesh && o.isMesh && !o.isInstancedMesh ? groundMeshes.has(o) || !!(W && W.root && isIn(o, W.root)) : o.isInstancedMesh);
    const SW = shot((o) => (o.isMesh || o.isPoints || o.isLine || o.isSprite) && !groundMeshes.has(o));   // (the world's ground alone: not its road, houses, stands, trees)
    const v3 = new THREE.Vector3(), pick = (S, x, y, z) => { v3.set(x, y, z).project(cam); const u = Math.round((v3.x + 1) / 2 * cw), v = Math.round((1 - v3.y) / 2 * ch); let s0 = 0, s1 = 0, s2 = 0, n = 0;
      for (let b2 = -1; b2 <= 1; b2++) for (let a2 = -1; a2 <= 1; a2++) { const uu = u + a2, vv = v + b2; if (uu < 0 || vv < 0 || uu >= cw || vv >= ch) return null; const q = vv * cw + uu; if (!S.M[q]) continue; s0 += S.D[q * 4]; s1 += S.D[q * 4 + 1]; s2 += S.D[q * 4 + 2]; n++; }
      return n >= 8 ? [s0 / n, s1 / n, s2 / n] : null; };
    // push-pull: the coloured cells (a = 1) about each empty one, ever coarser (each level half the one below), its colour bilinear from the next
    const fill = (C, A) => {
      const L = [{ w: nX, h: nZ, c: C, a: A }];
      while (L[L.length - 1].w > 1 || L[L.length - 1].h > 1) {
        const P = L[L.length - 1], w = Math.ceil(P.w / 2), h = Math.ceil(P.h / 2), c = new Float32Array(w * h * 3), a = new Float32Array(w * h);
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
          let s = 0, s0 = 0, s1 = 0, s2 = 0;
          for (let b = 0; b < 2; b++) for (let d = 0; d < 2; d++) { const ii = 2 * i + d, jj = 2 * j + b; if (ii >= P.w || jj >= P.h) continue; const q = jj * P.w + ii, w1 = P.a[q]; if (!w1) continue; s += w1; s0 += w1 * P.c[q * 3]; s1 += w1 * P.c[q * 3 + 1]; s2 += w1 * P.c[q * 3 + 2]; }
          const k = j * w + i; if (s > 0) { c[k * 3] = s0 / s; c[k * 3 + 1] = s1 / s; c[k * 3 + 2] = s2 / s; a[k] = Math.min(1, s); }
        }
        L.push({ w, h, c, a });
      }
      for (let l = L.length - 2; l >= 0; l--) {
        const P = L[l], U = L[l + 1];
        for (let j = 0; j < P.h; j++) for (let i = 0; i < P.w; i++) {
          const k = j * P.w + i, w1 = P.a[k]; if (w1 >= 1) continue;
          const u = Math.min(U.w - 1, Math.max(0, (i + 0.5) / 2 - 0.5)), v = Math.min(U.h - 1, Math.max(0, (j + 0.5) / 2 - 0.5)), i0 = Math.floor(u), j0 = Math.floor(v), i1 = Math.min(U.w - 1, i0 + 1), j1 = Math.min(U.h - 1, j0 + 1), fu = u - i0, fv = v - j0;
          for (let c3 = 0; c3 < 3; c3++) { const cu = (U.c[(j0 * U.w + i0) * 3 + c3] * (1 - fu) + U.c[(j0 * U.w + i1) * 3 + c3] * fu) * (1 - fv) + (U.c[(j1 * U.w + i0) * 3 + c3] * (1 - fu) + U.c[(j1 * U.w + i1) * 3 + c3] * fu) * fv; P.c[k * 3 + c3] = w1 * P.c[k * 3 + c3] + (1 - w1) * cu; }
          P.a[k] = 1;
        }
      }
    };
    // the world's colour in each cell inside its edge (a cell in), carried out
    const C = new Float32Array(N * 3), A = new Float32Array(N), E = new Float32Array(N); let nIn = 0;
    for (let j = 0; j < nZ; j++) for (let i = 0; i < nX; i++) {
      const k = j * nX + i, x = fx0 + (i + 0.5) * cell, z = fz0 + (j + 0.5) * cell; E[k] = wcov.at(x, z); if (E[k] > -cell || wcov.water(x, z)) continue;
      const p = pick(SW, x, ground(x, z, gy0), z); if (!p) continue; C[k * 3] = p[0]; C[k * 3 + 1] = p[1]; C[k * 3 + 2] = p[2]; A[k] = 1; nIn++;
    }
    if (!nIn) return null;
    fill(C, A);
    // how much of it in each cell out there (all of it at the edge, none R (0.7..1.3 R) out), and the factor
    const hash = (i, j) => { const q = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return q - Math.floor(q); };
    const vn = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, sm = (t) => t * t * (3 - 2 * t), u = sm(fx), v = sm(fz); return (hash(xi, zi) * (1 - u) + hash(xi + 1, zi) * u) * (1 - v) + (hash(xi, zi + 1) * (1 - u) + hash(xi + 1, zi + 1) * u) * v; };
    const AL = new Float32Array(N), Fk = new Float32Array(N * 3).fill(1), seaY = seaExt ? seaExt.geometry.attributes.position.array[1] : -1e9; let nOut = 0;
    for (let j = 0; j < nZ; j++) for (let i = 0; i < nX; i++) {
      const k = j * nX + i, e = E[k]; if (e < -2 * cell) continue; const x = fx0 + (i + 0.5) * cell, z = fz0 + (j + 0.5) * cell; if (land.h(x, z) < seaY + 0.5) continue;   // (not under the sea)
      const r = R * (0.7 + 0.6 * vn(x / 180, z / 180)), s = e <= 0 ? 1 : Math.max(0, 1 - e / r), a = k0 * s * s * (3 - 2 * s); if (a > 0.004) { AL[k] = Math.min(1, a); nOut++; }
    }
    // our land's colour there as drawn (where the picture misses it, carried in from about), and the factor that makes it the world's
    const ours = (S) => { const O = new Float32Array(N * 3), B = new Float32Array(N); for (let k = 0; k < N; k++) { if (!AL[k]) continue; const i = k % nX, j = (k / nX) | 0, x = fx0 + (i + 0.5) * cell, z = fz0 + (j + 0.5) * cell, p = pick(S, x, land.h(x, z), z); if (!p) continue; O[k * 3] = p[0]; O[k * 3 + 1] = p[1]; O[k * 3 + 2] = p[2]; B[k] = 1; } fill(O, B); return O; };
    const T = new Uint8Array(N * 4), tex = new THREE.DataTexture(T, nX, nZ, THREE.RGBAFormat, THREE.UnsignedByteType); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.flipY = false;
    const put = (full) => { for (let k = 0; k < N; k++) { for (let c3 = 0; c3 < 3; c3++) T[k * 4 + c3] = AL[k] ? Math.round((Math.log2(Fk[k * 3 + c3]) + 3) / 6 * 255) : 128; T[k * 4 + 3] = AL[k] ? (full ? 255 : Math.round(255 * AL[k])) : 0; } tex.needsUpdate = true; };
    FE.uFeather.value = tex; FE.uFeatherBox.value.set(fx0, fz0, nX * cell, nZ * cell);
    const err = [];
    for (let it = 0; it < (iters || 2); it++) {
      put(true); FE.uFeatherOn.value = it ? 1 : 0;
      const O = ours(shot(hideL)); let s = 0, n = 0;
      for (let k = 0; k < N; k++) { if (!AL[k]) continue; for (let c3 = 0; c3 < 3; c3++) { const q = k * 3 + c3; s += Math.abs(C[q] - O[q]) * AL[k]; n += AL[k]; Fk[q] = Math.min(8, Math.max(0.125, Fk[q] * (C[q] + 4) / (O[q] + 4))); } }
      err.push(n ? +(s / n).toFixed(1) : null);
    }
    put(false); FE.uFeatherOn.value = 1;
    if (dbg) { const png = (f) => { const c3 = document.createElement('canvas'); c3.width = nX; c3.height = nZ; const x3 = c3.getContext('2d'), im = x3.createImageData(nX, nZ); for (let q = 0; q < N; q++) { const v = f(q); im.data[q * 4] = v[0]; im.data[q * 4 + 1] = v[1]; im.data[q * 4 + 2] = v[2]; im.data[q * 4 + 3] = 255; } x3.putImageData(im, 0, 0); window.__feDbg.push(c3.toDataURL('image/png')); };
      png((q) => [C[q * 3], C[q * 3 + 1], C[q * 3 + 2]]); png((q) => [T[q * 4], T[q * 4 + 1], T[q * 4 + 2]]); png((q) => [T[q * 4 + 3], T[q * 4 + 3], T[q * 4 + 3]]); }
    return { R, cells: [nX, nZ], inside: nIn, out: nOut, err, ms: Math.round(performance.now() - t0) };
  }
  function edgeTint(margin, iters, strength) {
    if (!land || !land.grid || !wcov || !wcov.box) return null;
    const G = land.grid, W1 = G.nx + 1, N = W1 * (G.nz + 1), cam = Render.camera, W = Render.world, [bx0, bz0, bx1, bz1] = wcov.box;
    const E = new Float32Array(N); for (let k = 0; k < N; k++) E[k] = wcov.at(G.x0 + (k % W1) * G.cell, G.z0 + ((k / W1) | 0) * G.cell);
    const geo = land.mesh.geometry, col = new Float32Array(N * 3).fill(1); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); land.mesh.material.vertexColors = true; land.mesh.material.needsUpdate = true;
    const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); }, vn = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, sm = (t) => t * t * (3 - 2 * t), u = sm(fx), v = sm(fz); return (hash(xi, zi) * (1 - u) + hash(xi + 1, zi) * u) * (1 - v) + (hash(xi, zi + 1) * (1 - u) + hash(xi + 1, zi + 1) * u) * v; };
    const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2, aspect = cv.width / cv.height, fov = 12, half = Math.max((bz1 - bz0) / 2 + margin, ((bx1 - bx0) / 2 + margin) / aspect) * 1.04, Hc = half / Math.tan(fov / 2 * Math.PI / 180), gy0 = ground(cx, cz, 0);
    const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; const x2 = c2.getContext('2d', { willReadFrequently: true }), v3 = new THREE.Vector3(), log = [];
    const shoot = () => {
      if (W) W.farClip = false; cullFar(1e9, cx, gy0 + Hc, cz); cam.far = Hc * 2 + 20000; cam.updateProjectionMatrix(); cam.up.set(0, 0, -1);
      Render.setShot({ px: cx, py: gy0 + Hc, pz: cz + 0.5, tx: cx, ty: gy0, tz: cz, fov, near: Hc * 0.4, fogD: 1e7, sky: true, blur: 0 });
      Render.frame(0, 1, target, mode === 'traffic' ? 'chase' : 'iso', {}); x2.drawImage(cv, 0, 0); cam.updateMatrixWorld();
      return x2.getImageData(0, 0, c2.width, c2.height).data;
    };
    const pix = (D, x, y, z, r) => { v3.set(x, y, z).project(cam); const u = Math.round((v3.x + 1) / 2 * c2.width), v = Math.round((1 - v3.y) / 2 * c2.height); let s0 = 0, s1 = 0, s2 = 0, n = 0;
      for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) { const uu = u + a, vv = v + b; if (uu < 0 || vv < 0 || uu >= c2.width || vv >= c2.height) continue; const q = (vv * c2.width + uu) * 4; s0 += D[q]; s1 += D[q + 1]; s2 += D[q + 2]; n++; }
      return n ? [s0 / n, s1 / n, s2 / n] : null; };
    const pxR = Math.max(1, Math.round(G.cell / (2 * half / c2.height) / 2));
    for (let it = 0; it < (iters || 2); it++) {
      const D = shoot(), inner = [], outer = [];
      for (let k = 0; k < N; k++) { const e = E[k]; if (e > -150 && e < -30) inner.push(k); else if (e > 60 && e < 360) outer.push(k); }
      const sample = (list, cellSz) => { const m = new Map(); for (const k of list) { const i = k % W1, j = (k / W1) | 0, x = G.x0 + i * G.cell, z = G.z0 + j * G.cell, p = pix(D, x, ground(x, z, G.H[k]), z, pxR); if (!p) continue; const key = Math.floor(x / cellSz) + ',' + Math.floor(z / cellSz); let a = m.get(key); if (!a) m.set(key, a = [0, 0, 0, 0]); a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3]++; } return m; };
      const SI = sample(inner, 150), SO = sample(outer, 150);
      const near = (m, x, z) => { const i0 = Math.floor(x / 150), j0 = Math.floor(z / 150); let s0 = 0, s1 = 0, s2 = 0, n = 0; for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) { const e = m.get((i0 + a) + ',' + (j0 + b)); if (e) { s0 += e[0]; s1 += e[1]; s2 += e[2]; n += e[3]; } } return n ? [s0 / n, s1 / n, s2 / n] : null; };
      let nT = 0, sumT = [0, 0, 0];
      for (let k = 0; k < N; k++) {
        const e = E[k]; if (e > margin) continue;
        const i = k % W1, j = (k / W1) | 0, x = G.x0 + i * G.cell, z = G.z0 + j * G.cell, rw = near(SI, x, z), rl = near(SO, x, z); if (!rw || !rl) continue;
        const w = (e <= 0 ? 1 : Math.pow(1 - e / margin, 1.6)) * (0.6 + 0.4 * vn(x / 230, z / 230)) * (strength || 0.8);
        for (let ch = 0; ch < 3; ch++) { const T = Math.min(2.0, Math.max(0.5, (rw[ch] + 4) / (rl[ch] + 4))); col[k * 3 + ch] *= 1 + (T - 1) * Math.min(1, w); sumT[ch] += T; }
        nT++;
      }
      geo.attributes.color.needsUpdate = true; log.push(nT ? sumT.map(v => +(v / nT).toFixed(2)) : null);
    }
    cam.up.set(0, 1, 0);
    return { iters: log, box: wcov.box.map(Math.round) };
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
        if (s.radius < 2500 && !groundMeshes.has(o)) culls.push({ o, s });   // (a thing as big as the land itself always drawn, and the world's ground: our land lies under it)
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
    if (S.kind === 'heli') return heli(S, t);
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
  // ---- the helicopter: the whole run in one shot (the menu's intro before the race) -------------------------------------------------
  // From high above the start (the menu's globe hands over to the first frame) down to a TV helicopter's height, then along the whole run
  // to the finish without a cut: H m over the road, B m behind the point it looks at, along a line smoothed over the bends (it does not
  // follow each hairpin), turning gently and banking a little into the turns, never lower than its clearance over the land under it nor
  // where a ridge would hide the road. Planned once for the whole shot (smoothing over time needs the whole of it), 60 times a second.
  // S: { kind: 'heli', len (m: the run), dur (s: all), go (s: when it sets off along the road), fly (s: start to finish), ramp (s: speeding
  //      up, slowing down), H, B, D0 (m: the first frame's distance from the start), el0 (degrees: its angle from above), adur (s: the
  //      descent), fov }
  const plans = new WeakMap();
  function gauss(a, sig) {   // a smoothed copy (Gaussian over sig samples, the ends held)
    if (sig < 0.5) return Float64Array.from(a);
    const n = a.length, r = Math.ceil(sig * 3), w = []; let ws = 0; for (let k = -r; k <= r; k++) { const q = Math.exp(-k * k / (2 * sig * sig)); w.push(q); ws += q; }
    const out = new Float64Array(n); for (let i = 0; i < n; i++) { let s = 0; for (let k = -r; k <= r; k++) s += a[Math.min(n - 1, Math.max(0, i + k))] * w[k + r]; out[i] = s / ws; } return out;
  }
  function runMax(a, r) { const n = a.length, out = new Float64Array(n); for (let i = 0; i < n; i++) { let m = -1e18; for (let k = Math.max(0, i - r); k <= Math.min(n - 1, i + r); k++) m = Math.max(m, a[k]); out[i] = m; } return out; }
  function heliPlan(S) {
    if (plans.has(S)) return plans.get(S);
    const hz = 60, n = Math.round(S.dur * hz) + 1, L = S.len, H = S.H, B = S.B, dh = Math.hypot(B, H), elh = Math.atan2(H, B);
    const rs = S.smooth || Math.min(420, 0.5 * H), ra = S.ramp || 3, go = S.go || 0, fly = S.fly || 30, vmax = L / (fly - ra);
    // the road smoothed: points every 5 m (a closed track round and round; an open one held at its ends), box-filtered twice over +-rs/2
    const st = 5, m0 = Math.ceil((rs * 2 + 400) / st), nd = Math.ceil(L / st) + 2 * m0 + 1, X = new Float64Array(nd), Y = new Float64Array(nd), Z = new Float64Array(nd);
    for (let i = 0; i < nd; i++) { const p = road((i - m0) * st); X[i] = p.x; Y[i] = p.y; Z[i] = p.z; }
    const box = (a, r) => { const out = new Float64Array(a.length), c = new Float64Array(a.length + 1); for (let i = 0; i < a.length; i++) c[i + 1] = c[i] + a[i]; for (let i = 0; i < a.length; i++) { const lo = Math.max(0, i - r), hi = Math.min(a.length - 1, i + r); out[i] = (c[hi + 1] - c[lo]) / (hi - lo + 1); } return out; };
    const rr = Math.max(1, Math.round(rs / 2 / st)), XS = box(box(X, rr), rr), ZS = box(box(Z, rr), rr), YS = box(box(Y, Math.round(Math.max(rs, 500) / 2 / st)), Math.round(Math.max(rs, 500) / 2 / st));
    const at = (A, d) => { const f = Math.min(nd - 1.001, Math.max(0, d / st + m0)), i = Math.floor(f); return A[i] + (A[i + 1] - A[i]) * (f - i); };
    // how far along the road the point it looks at is: still for `go` s, then speeding up over `ramp` s, steady, slowing to the finish
    const vel = (t) => { const u = t - go; if (u <= 0 || u >= fly) return 0; const e = (x) => x * x * (3 - 2 * x); return vmax * Math.min(1, e(Math.min(1, u / ra)), e(Math.min(1, (fly - u) / ra))); };
    const D = new Float64Array(n); for (let k = 1; k < n; k++) { const t = k / hz; D[k] = D[k - 1] + (vel(t - 0.5 / hz) ) / hz; }
    const sc = L / (D[n - 1] || 1); for (let k = 0; k < n; k++) D[k] = Math.min(L, D[k] * sc);   // (exactly to the finish)
    // its heading: along the smoothed road (a chord over +-rs), then smoothed over time; unwrapped so it turns the short way
    const a = Math.max(S.headA || 0, 60, rs), th = new Float64Array(n); let prev = null;
    for (let k = 0; k < n; k++) { const d = D[k]; let v = Math.atan2(at(ZS, d + a) - at(ZS, d - a), at(XS, d + a) - at(XS, d - a)); if (prev != null) { while (v - prev > Math.PI) v -= 2 * Math.PI; while (v - prev < -Math.PI) v += 2 * Math.PI; } th[k] = prev = v; }
    const TH = gauss(th, (S.headT || 0.9) * hz);   // (S.headA: the chord the heading is taken over, S.headT: its smoothing in seconds: larger, the camera looks straight on through the small bends)
    // the descent: from D0 at el0 down onto the rig's distance and angle (a log-scale zoom, already moving at the start, at rest at the end)
    const P = new Float64Array(n * 8), ad = S.adur || 4.5, D0 = S.D0 || Math.max(3000, 3.5 * dh), el0 = (S.el0 || 55) * Math.PI / 180;
    const fl = new Float64Array(n);
    for (let k = 0; k < n; k++) {
      const t = k / hz, tc = Math.min(1, t / ad), u = tc + tc * tc - tc * tc * tc, dist = D0 * Math.pow(dh / D0, u), el = el0 + (elh - el0) * u, d = D[k];
      const cx = at(XS, d), cz = at(ZS, d), cy = at(YS, d), hx = Math.cos(TH[k]), hz2 = Math.sin(TH[k]);
      const px = cx - hx * Math.cos(el) * dist, pz = cz - hz2 * Math.cos(el) * dist, py = cy + Math.sin(el) * dist;
      P.set([px, py, pz, cx, cy, cz, 0, d], k * 8);
      // the lowest it may fly here: its clearance over the land under it (and round it), and over every ridge between it and the road
      let g = -1e9; for (const [ox, oz] of [[0, 0], [60, 0], [-60, 0], [0, 60], [0, -60]]) g = Math.max(g, ground(px + ox, pz + oz, -1e9));
      let f = g + 0.55 * H;
      for (let q = 1; q <= 18; q++) { const w = q / 20, x = px + (cx - px) * w, z = pz + (cz - pz) * w, gy = ground(x, z, -1e9) + 25; f = Math.max(f, (gy - cy * w) / (1 - w)); }
      fl[k] = f;
    }
    const FL = gauss(runMax(fl, Math.round(1.2 * hz)), 0.7 * hz);
    for (let k = 0; k < n; k++) { const a0 = P[k * 8 + 1], f = FL[k]; P[k * 8 + 1] = (a0 + f + Math.sqrt((a0 - f) * (a0 - f) + 400)) / 2; }
    // banking into the turns (the turn rate, smoothed: right turns roll right), a slow float of the helicopter in the air
    const om = new Float64Array(n); for (let k = 0; k < n; k++) om[k] = (TH[Math.min(n - 1, k + 1)] - TH[Math.max(0, k - 1)]) * hz / 2;
    const OM = gauss(om, 0.6 * hz), amp = 0.004 * H;
    for (let k = 0; k < n; k++) {
      const t = k / hz, b = Math.min(1, Math.max(0, (t - 1) / 2));
      P[k * 8 + 6] = b * Math.max(-0.1, Math.min(0.1, 0.16 * OM[k]));
      P[k * 8] += amp * Math.sin(t * 0.83 + 1.3) * b; P[k * 8 + 1] += amp * 0.8 * Math.sin(t * 0.57 + 0.4) * b; P[k * 8 + 2] += amp * Math.sin(t * 0.71 + 2.1) * b;
    }
    const plan = { hz, n, P, TH, D, vmax, dh, D0 };
    plans.set(S, plan); return plan;
  }
  function heli(S, t) {
    const pl = heliPlan(S), f = Math.min(pl.n - 1.0001, Math.max(0, t * S.dur * pl.hz)), i = Math.floor(f), w = f - i, A = pl.P, a = i * 8, b = a + 8;
    const v = (j) => A[a + j] + (A[b + j] - A[a + j]) * w, th = pl.TH[i] + (pl.TH[i + 1] - pl.TH[i]) * w;
    return { px: v(0), py: v(1), pz: v(2), tx: v(3), ty: v(4), tz: v(5), roll: v(6), dr: v(7), th, fov: S.fov || 50 };
  }
  // its shadow on the land ahead: the light from behind it and a little to the left, high (so the shadow runs ahead of the picture's
  // middle, in its lower part), the game's own helicopter seen from above (the TV helicopter: 11.4 m long, a 10.6 m rotor, here drawn
  // larger the higher it flies so it reads in the picture), draped over the land and the trees' tops, soft-edged
  let shadow = null;
  function shadowMesh() {
    if (shadow) return shadow;
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
    const N = 16, pos = new Float32Array((N + 1) * (N + 1) * 3), uv = new Float32Array((N + 1) * (N + 1) * 2), idx = [];
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const k = j * (N + 1) + i; uv[k * 2] = i / N; uv[k * 2 + 1] = 1 - j / N; if (i < N && j < N) idx.push(k, k + N + 1, k + 1, k + 1, k + N + 1, k + N + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false }));
    mesh.renderOrder = 999; mesh.frustumCulled = false; (Render.scene || Render.world.root).add(mesh);
    shadow = { mesh, N, g, tex, c, c0: document.createElement('canvas') }; shadow.c0.width = shadow.c0.height = 256;
    return shadow;
  }
  // the shadow's picture (16 m across, +x forward, the rotor's centre in the middle): the hull, the tail boom and its stabiliser, the skids,
  // the main rotor's blurred disc with its two blades caught at angle `a` (each frame another: they turn faster than the frames), the tail
  // rotor's; then softened (the sun is not a point)
  function shadowDraw(a) {
    const s = shadowMesh(), x = s.c0.getContext('2d'), m = 256 / 16;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 256, 256); x.translate(128, 128); x.scale(m, m); x.translate(-0.4, 0);
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.arc(0.9, 0, 5.3, 0, Math.PI * 2); x.fill();   // the main rotor's blur (its shadow ahead of the hull: it is higher)
    x.save(); x.translate(0.9, 0); x.rotate(a); x.fillStyle = 'rgba(0,0,0,0.32)'; x.fillRect(-5.3, -0.2, 10.6, 0.4); x.restore();
    x.fillStyle = 'rgba(0,0,0,0.78)';
    x.beginPath(); x.moveTo(3.15, -0.42); x.lineTo(3.15, 0.42); x.lineTo(1.8, 0.85); x.lineTo(-1.4, 0.85); x.lineTo(-2.7, 0.3); x.lineTo(-7.9, 0.13); x.lineTo(-7.9, -0.13); x.lineTo(-2.7, -0.3); x.lineTo(-1.4, -0.85); x.lineTo(1.8, -0.85); x.closePath(); x.fill();   // the hull and the tail boom
    x.fillRect(-7.28, -0.95, 0.55, 1.9);                                  // the stabiliser
    for (const sd of [-1, 1]) x.fillRect(-1.7, sd * 1.0 - 0.07, 3.8, 0.14);   // the skids
    x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(-8.85, 0.05, 1.7, 0.18);   // the tail rotor's
    const y = s.c.getContext('2d'); y.clearRect(0, 0, 256, 256); y.filter = 'blur(1.5px)'; y.drawImage(s.c0, 0, 0); y.filter = 'none';
    s.tex.needsUpdate = true;
  }
  // (el: the light's height in degrees, az: how far to the right of straight ahead the shadow falls; size: the drawn 13 m square's size)
  function placeShadow(P, el, az, k) {
    const s = shadowMesh(), e = el * Math.PI / 180, h = P.th + az * Math.PI / 180, sx = Math.cos(h), sz = Math.sin(h);
    let t = (P.py - ground(P.px, P.pz, P.py - 500)) / Math.sin(e);
    for (let q = 0; q < 8; q++) { const x = P.px + sx * Math.cos(e) * t, z = P.pz + sz * Math.cos(e) * t; t = Math.max(1, (P.py - ground(x, z, P.py - 500)) / Math.sin(e)); }
    const size = Math.max(13, k * t), cx = P.px + sx * Math.cos(e) * t, cz = P.pz + sz * Math.cos(e) * t, fx = Math.cos(P.th), fz = Math.sin(P.th), N = s.N, pos = s.g.attributes.position.array;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const u = (i / N - 0.5) * size, v = (j / N - 0.5) * size, x = cx + fx * u - fz * v, z = cz + fz * u + fx * v, k = (j * (N + 1) + i) * 3;
      pos[k] = x; pos[k + 1] = treeTop(x, z) + 0.5; pos[k + 2] = z;
    }
    s.g.attributes.position.needsUpdate = true; s.mesh.visible = true;
    return { x: cx, z: cz, dist: t };
  }
  // the top of what is under a point (the land, or the crowns where the planted woods stand: the shadow lies on them)
  function treeTop(x, z) { const g = ground(x, z, 0); return plant && plant.top ? g + plant.top(x, z) : g; }
  // ---- the land round the strip planted ---------------------------------------------------------------------------------------------
  // High up, the helicopter sees kilometres of land round the game's strip (the game plants its trees and builds its houses only near the
  // road). That land is planted like the game's own: its trees (the same kinds, sizes and colours, in the share the world has of each) in
  // the woods, its bushes in the scrub, a lone tree in a meadow, small houses in the villages, wherever the real land cover has them
  // (raw/geo/<track>-far-lc.png from geo_lc.py: north at the top, over the far land's box). Only where the helicopter looks (200 m tiles,
  // each its own instanced meshes with its bounds: the tiles out of the picture are skipped); not where the game's own things stand.
  // o: { lc: the land cover's file, keep (m: the game's own strip round the road, left as it is), tiles: [[i, j], …] (200 m tiles), seed }
  let plant = null;
  const TILE = 200;
  async function plantLand(o) {
    const F = o.far || {}, W = Render.world; if (!F.geo || !F.ll) return { err: 'no far land box' };
    if (!lcAt) lcAt = await loadLC(o.lc, F);
    if (!lcAt) return { err: 'no land cover ' + o.lc };
    // the game's own kinds: each instanced geometry with its material, how many the world has, samples of its instances (scale, colour)
    const kinds = new Map(), m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), col = new THREE.Color();
    W.root.updateMatrixWorld(true);
    W.root.traverse(ob => {
      if (!ob.isInstancedMesh || !ob.count) return;
      const g = ob.geometry, key = g.attributes.position.count + ':' + (ob.material.uuid || '');
      if (!g.boundingBox) g.computeBoundingBox();
      let K = kinds.get(g.attributes.position.count); if (!K) kinds.set(g.attributes.position.count, K = { geo: g, mat: ob.material, n: 0, sam: [], bbH: g.boundingBox.max.y - g.boundingBox.min.y, near: [] });
      K.n += ob.count;
      for (let i = 0; i < ob.count; i += Math.max(1, Math.floor(ob.count / 12))) { ob.getMatrixAt(i, m4); m4.premultiply(ob.matrixWorld); m4.decompose(p, q, s); if (ob.instanceColor) ob.getColorAt(i, col); else col.setRGB(1, 1, 1); if (K.sam.length < 600) K.sam.push([s.x, s.y, s.z, col.r, col.g, col.b, p.x, p.z]); }
    });
    if (o.borrow) {   // a world without instanced trees of its own: another world's (its geometry, a plain vertex-coloured material, its tints)
      const B = await (await fetch('/__proto/' + o.borrow)).json(), bm = new THREE.MeshLambertMaterial({ vertexColors: true });
      for (const v in B) { if (o.borrowKinds && !o.borrowKinds.includes(+v)) continue; const E = B[v], g = new THREE.BufferGeometry();
        for (const a in E.attr) g.setAttribute(a, new THREE.Float32BufferAttribute(E.attr[a].d, E.attr[a].n)); if (E.index) g.setIndex(E.index); g.computeBoundingBox(); g.computeBoundingSphere();
        const tn = o.tint || [1, 1, 1], sam = E.sam.map(e => [e[0] * (o.scale || 1), e[1] * (o.scale || 1), e[2] * (o.scale || 1), e[3] * tn[0], e[4] * tn[1], e[5] * tn[2], 0, 0]);
        kinds.set('b' + v, { geo: g, mat: bm, n: E.n * ((o.borrowShare || {})[v] || 1), sam, bbH: g.boundingBox.max.y - g.boundingBox.min.y, borrowed: true }); }
    }
    const rp = roadPts(20), distRoad = (x, z) => { let dm = 1e18; for (const r of rp) { const d = (r[0] - x) * (r[0] - x) + (r[1] - z) * (r[1] - z); if (d < dm) dm = d; } return Math.sqrt(dm); };
    const med = (a) => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
    const trees = [], bushes = [];
    for (const [v, K] of kinds) {
      const sy = med(K.sam.map(e => e[1])), dr = K.borrowed ? 1e3 : med(K.sam.filter((e, i) => i % 3 === 0).map(e => distRoad(e[6], e[7])));
      if (o.borrow && o.borrowOnly && !K.borrowed) continue;
      K.v = v; K.sy = sy; K.dr = dr;
      if (K.bbH > 1.4 || K.bbH < 0.4) continue;   // (not the unit-tall things: the crowds, the flags)
      if (sy >= 7) trees.push(K); else if (sy >= 0.8 && sy < 5 && dr > 40) bushes.push(K);
    }
    // how far round the road the game's own things stand (its trees: the 90th percentile of their distance), left as the game has it
    const td = []; for (const K of trees) if (!K.borrowed) for (const e of K.sam) if (td.length < 900) td.push(distRoad(e[6], e[7]));
    td.sort((x, y) => x - y); const keep = o.keep != null ? o.keep : Math.max(60, Math.min(400, td.length ? td[Math.floor(td.length * 0.9)] : 80));
    // the houses: a box and a gable roof, unit sized (scaled per house)
    const hb = new THREE.BoxGeometry(1, 1, 1); hb.translate(0, 0.5, 0);
    const rf = new THREE.BufferGeometry(), RV = [], tri = (a, b, c) => RV.push(...a, ...b, ...c), A = [-0.56, 1, -0.6], B2 = [0.56, 1, -0.6], C = [0.56, 1, 0.6], Dd = [-0.56, 1, 0.6], E = [-0.56, 1.5, 0], G = [0.56, 1.5, 0];
    tri(A, E, G); tri(A, G, B2); tri(Dd, C, G); tri(Dd, G, E); tri(A, Dd, E); tri(B2, G, C);
    rf.setAttribute('position', new THREE.Float32BufferAttribute(RV, 3)); rf.computeVertexNormals();
    const houseMat = new THREE.MeshLambertMaterial({ color: 0xffffff }), roofMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const WALL = o.walls || [0xf1ede4, 0xe9e1cf, 0xdcd0b8, 0xf4f1ea, 0xd8d2c8], ROOF = o.roofs || [0x5b3c2c, 0x4b4a4f, 0x7d3a2a, 0x6a4a36, 0x3d3c40];
    // the tiles: a jittered grid in each (11 m in the woods), the land cover at each point decides what grows or stands there
    let seed = o.seed || 7; const hash = (a, b, c) => { const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + seed) * 43758.5453; return v - Math.floor(v); };
    const rnoise = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, sm = (t) => t * t * (3 - 2 * t), u = sm(fx), v = sm(fz), h2 = (a, b) => hash(a, b, 21); return (h2(xi, zi) * (1 - u) + h2(xi + 1, zi) * u) * (1 - v) + (h2(xi, zi + 1) * (1 - u) + h2(xi + 1, zi + 1) * u) * v; };
    const pickK = (L, r) => { let tot = 0; for (const K of L) tot += K.n; let a = r * tot; for (const K of L) { a -= K.n; if (a <= 0) return K; } return L[L.length - 1]; };
    const out = { tiles: 0, trees: 0, bushes: 0, houses: 0, keep: Math.round(keep), kinds: [...kinds.values()].map(K => [K.v, K.n, +K.sy.toFixed(1), Math.round(K.dr), +K.bbH.toFixed(2)]), treeKinds: trees.map(K => K.v), bushKinds: bushes.map(K => K.v) };
    const tiles = [], mk = new THREE.Matrix4(), qy = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sv = new THREE.Vector3(), pv = new THREE.Vector3();
    const dens = o.dens || 1, SP = 11 / Math.sqrt(dens), lake = o.noWater !== false;
    for (const [ti, tj] of o.tiles) {
      const X0 = ti * TILE, Z0 = tj * TILE, items = new Map(), add = (K, mat, c) => { let L = items.get(K); if (!L) items.set(K, L = { m: [], c: [] }); L.m.push(mat.clone()); L.c.push(c); };
      // (the road's distance at the tile's corners: a tile wholly inside the game's strip is skipped)
      const dc = Math.min(distRoad(X0 + TILE / 2, Z0 + TILE / 2)); if (dc < keep - TILE * 0.75) continue;
      for (let gx = 0; gx < TILE / SP; gx++) for (let gz = 0; gz < TILE / SP; gz++) {
        const i = Math.round(X0 / SP) + gx, j = Math.round(Z0 / SP) + gz, x = (i + 0.15 + 0.7 * hash(i, j, 1)) * SP, z = (j + 0.15 + 0.7 * hash(i, j, 2)) * SP;
        if (x < X0 || x >= X0 + TILE || z < Z0 || z >= Z0 + TILE) continue;
        let cl = lcAt(x, z); if (!cl || cl === 70) continue;
        if (wcov && (wcov.water(x, z) || (o.inWorld === false && wcov.at(x, z) < 20))) continue;   // (not on the world's water; a made-up world's ground left as the game made it)
        const r = hash(i, j, 3);
        let what = null;
        if (o.ring && wcov && cl !== 80) { const e = wcov.at(x, z), f = 0.55 + 0.9 * rnoise(x / 260, z / 260); if (e >= o.ring[0] && e <= o.ring[1] * f) cl = 10; }   // (a belt of woods round a made-up world, its edge ragged: it stands in a clearing)
        if (cl === 80) continue;
        if (cl === 10) what = r < 0.9 ? 'tree' : null;
        else if (cl === 20) what = r < 0.45 ? 'bush' : r < 0.55 ? 'tree' : null;
        else if (cl === 30) what = r < 0.035 ? 'tree' : r < 0.06 ? 'bush' : null;
        else if (cl === 40) what = r < 0.012 ? 'tree' : null;
        else if (cl === 50) what = (i % 2 === 0 && j % 2 === 0 && r < 0.62) ? 'house' : r < 0.1 ? 'tree' : null;
        else if (cl === 60) what = r < 0.04 ? 'bush' : null;
        else if (cl === 90 || cl === 95) what = r < 0.25 ? 'bush' : r < 0.32 ? 'tree' : null;
        if (!what) continue;
        const dr = distRoad(x, z); if (dr < keep || (dr < keep + 60 && hash(i, j, 4) > (dr - keep) / 60)) continue;
        const y = ground(x, z, NaN); if (!Number.isFinite(y)) continue;
        if (what === 'house') {
          if (!o.houses) continue;
          const yaw = (Math.floor(hash(ti, tj, 9) * 4) * 90 + (hash(i, j, 5) - 0.5) * 16) * Math.PI / 180, L = 9 + 6 * hash(i, j, 6), Wd = 7 + 3 * hash(i, j, 7), Hh = 5.5 + 2.5 * hash(i, j, 8);
          mk.compose(pv.set(x, y - 0.4, z), qy.setFromAxisAngle(up, yaw), sv.set(L, Hh, Wd));
          add('wall', mk, WALL[Math.floor(hash(i, j, 10) * WALL.length)]); add('roof', mk, ROOF[Math.floor(hash(i, j, 11) * ROOF.length)]); out.houses++;
          continue;
        }
        const L = what === 'tree' ? trees : bushes; if (!L.length) continue;
        const K = pickK(L, hash(i, j, 12)), e = K.sam[Math.floor(hash(i, j, 13) * K.sam.length)];
        mk.compose(pv.set(x, y, z), qy.setFromAxisAngle(up, hash(i, j, 14) * Math.PI * 2), sv.set(e[0], e[1], e[2]));
        add(K, mk, [e[3], e[4], e[5]]); if (what === 'tree') out.trees++; else out.bushes++;
      }
      if (!items.size) continue;
      const meshes = [];
      for (const [K, L] of items) {
        const isH = K === 'wall' || K === 'roof', g0 = K === 'wall' ? hb : K === 'roof' ? rf : K.geo, g = new THREE.BufferGeometry();
        for (const a in g0.attributes) g.setAttribute(a, g0.attributes[a]); if (g0.index) g.setIndex(g0.index);
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(X0 + TILE / 2, 0, Z0 + TILE / 2), TILE * 0.75 + 40);
        let ymin = 1e9, ymax = -1e9; for (const m of L.m) { ymin = Math.min(ymin, m.elements[13]); ymax = Math.max(ymax, m.elements[13]); }
        g.boundingSphere.center.y = (ymin + ymax) / 2; g.boundingSphere.radius = Math.hypot(TILE * 0.71, (ymax - ymin) / 2 + 40);
        const im = new THREE.InstancedMesh(g, K === 'wall' ? houseMat : K === 'roof' ? roofMat : K.mat, L.m.length);
        L.m.forEach((m, k) => im.setMatrixAt(k, m));
        const cc = new THREE.Color(); L.c.forEach((c, k) => { if (Array.isArray(c)) cc.setRGB(c[0], c[1], c[2]); else cc.setHex(c); im.setColorAt(k, cc); });
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.castShadow = false; im.receiveShadow = false; im.frustumCulled = true; im.matrixAutoUpdate = false; im.updateMatrix();
        (Render.scene || W.root).add(im); meshes.push(im);
      }
      tiles.push({ cx: X0 + TILE / 2, cz: Z0 + TILE / 2, meshes }); out.tiles++;
    }
    const forest = (x, z) => { const cl = lcAt(x, z); return cl === 10 && distRoad(x, z) > keep && !(wcov && o.inWorld === false && wcov.at(x, z) < 20) ? 16 : 0; };
    plant = { tiles, top: forest, lcAt, keep };
    return out;
  }
  // the tiles to plant: those round where the helicopter looks over the shot (within `R` m of it, inside its view and a margin)
  function heliTiles(S, R, aspect) {
    const pl = heliPlan(S), set = new Set(), hf = Math.atan(Math.tan((S.fov || 50) * Math.PI / 360) * (aspect || 1.5)) + 0.2;
    for (let k = 0; k < pl.n; k += Math.round(pl.hz / 4)) {
      const a = k * 8, px = pl.P[a], pz = pl.P[a + 2], tx = pl.P[a + 3], tz = pl.P[a + 5], dist = Math.hypot(px - tx, pl.P[a + 1] - pl.P[a + 4], pz - tz);
      if (dist > 2.2 * pl.dh) continue;   // (the first seconds, far up: the trees would be specks)
      const th = Math.atan2(tz - pz, tx - px), i0 = Math.floor((px - R) / TILE), i1 = Math.floor((px + R) / TILE), j0 = Math.floor((pz - R) / TILE), j1 = Math.floor((pz + R) / TILE);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const cx = (i + 0.5) * TILE - px, cz = (j + 0.5) * TILE - pz, d = Math.hypot(cx, cz); if (d > R) continue;
        let da = Math.atan2(cz, cx) - th; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        if (d < TILE * 2 || Math.abs(da) < hf + Math.atan(TILE / Math.max(1, d))) set.add(i + ',' + j);
      }
    }
    return [...set].map(s => s.split(',').map(Number));
  }
  function plantCull(cx, cz, R) { if (!plant) return 0; let n = 0; for (const t of plant.tiles) { const v = Math.hypot(t.cx - cx, t.cz - cz) < R + TILE; for (const m of t.meshes) m.visible = v && !m.userData.__hid; if (v) n++; } return n; }
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
    if (!cfg._mip && (cfg.mip || S.kind === 'heli')) { cfg._mip = 1; window.DR_CFG = cfg; const seen = new Set(), info = [];   // (high up the ground's fine grit repeats so small it shimmers in stripes: mip-mapped)
      Render.world.root.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) for (const k of ['map', 'alphaMap', 'bumpMap', 'normalMap', 'roughnessMap']) { const t = m[k]; if (!t || seen.has(t)) continue; seen.add(t); info.push([k, t.minFilter, t.generateMipmaps, t.image ? (t.image.width + 'x' + t.image.height) : '?']); t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.needsUpdate = true; } });
      window.__mipInfo = info; }
    if (cfg.hide && cfg._hide !== cfg.hide) { cfg._hide = cfg.hide; const W = Render.world; W.root.updateMatrixWorld(true);   // (experiments: hide the world's ground / everything else / our planting)
      W.root.traverse(o => { if (!o.isMesh) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld), big = !o.isInstancedMesh && Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) >= 80;
        o.userData.__hid = cfg.hide === 'ground' ? big : cfg.hide === 'rest' ? !big : false; });
      if (plant) for (const t of plant.tiles) for (const m of t.meshes) m.userData.__hid = cfg.hide === 'plant'; }
    if (cfg.noBump && !cfg._nb) { cfg._nb = 1; Render.world.root.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.bumpMap) { m.bumpMap = null; m.needsUpdate = true; } }); }
    if (cfg.noShadow && !cfg._ns) { cfg._ns = 1; Render.scene.traverse(o => { if (o.isDirectionalLight) o.castShadow = false; }); }
    cullFar(cfg.cull || (S.kind === 'heli' ? S.cull || 3200 : Math.max(1500, d * 1.4)), P.px, P.py, P.pz);
    if (cfg.hide) { Render.world.root.traverse(o => { if (o.userData.__hid) o.layers.mask = 0; }); if (plant) for (const t of plant.tiles) for (const m of t.meshes) if (m.userData.__hid) m.visible = false; }
    if (W) W.farClip = false;
    if (cam && Math.abs(cam.far - far) > 1) { cam.far = far; cam.updateProjectionMatrix(); }
    // the helicopter: its shadow ahead (coming in as it comes down from high up), its bank (the camera's up rolled about the view)
    if (S.kind === 'heli') {
      const tt = (n > 1 ? k / (n - 1) : 0) * S.dur, fade = Math.min(1, Math.max(0, (tt - 1.6) / 2));
      if (S.shadow !== false && fade > 0) { const sh = shadowMesh(); shadowDraw(k * 2.399); sh.mesh.material.opacity = fade * (S.shadowA || 1); placeShadow(P, S.sunEl || 57, S.sunAz == null ? 10 : S.sunAz, S.shadowK || 0.14); } else if (shadow) shadow.mesh.visible = false;
      plantCull(P.px, P.pz, cfg.plantR || S.plantR || S.cull || 3200);
    } else if (shadow) shadow.mesh.visible = false;
    if (cam) {
      const fx = P.tx - P.px, fy = P.ty - P.py, fz = P.tz - P.pz, fl = Math.hypot(fx, fy, fz) || 1, f = new THREE.Vector3(fx / fl, fy / fl, fz / fl), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, f), ph = P.roll || 0;
      cam.up.copy(u.multiplyScalar(Math.cos(ph)).addScaledVector(r, Math.sin(ph)));
    }
    // the near clip: high up, as far out as the nearest land can be (the depth buffer may have only 16 bits: a near clip of a few metres
    // with land kilometres off makes surfaces a few metres apart cut through each other in stripes)
    const near = S.kind === 'heli' ? Math.max(2, Math.min(0.45 * (P.py - ground(P.px, P.pz, P.py - 100)), 0.3 * d)) : Math.max(2, d * 0.003);
    Render.setShot({ px: P.px, py: P.py, pz: P.pz, tx: P.tx, ty: P.ty, tz: P.tz, fov: P.fov, near, fogD, sky: true, blur: 0 });
    Render.frame(1 / fps, 1, target, mode === 'traffic' ? 'chase' : 'iso', {});
    return cv.toDataURL('image/jpeg', S.q || 0.9);
  }
  // the arrival's camera every frame (for the globe in the menu, which hands over to it): [px, py, pz, tx, ty, tz] in the world's metres
  function path(S, n) { const out = []; for (let k = 0; k < n; k++) { const P = pose(S, n > 1 ? k / (n - 1) : 0); out.push([P.px, P.py, P.pz, P.tx, P.ty, P.tz].map(v => +v.toFixed(1))); } return { fov: pose(S, 0).fov, cam: out }; }
  // where the race cars are (for timing the shots)
  function cars() { return R.cars.map(c => c.q ? Math.round(((c.q.s - T.startS) % T.len + T.len) % T.len) : null); }
  // the helicopter's camera every frame (for the menu: its globe hands over to the first frames, its pins follow the places, its height
  // profile's dot the point it looks at): [px, py, pz, tx, ty, tz, roll], d (m along the run)
  function heliPath(S, n) { const cam = [], d = []; for (let k = 0; k < n; k++) { const P = heli(S, n > 1 ? k / (n - 1) : 0); cam.push([P.px, P.py, P.pz, P.tx, P.ty, P.tz].map(v => +v.toFixed(1)).concat([+P.roll.toFixed(4)])); d.push(Math.round(P.dr)); } const pl = heliPlan(S); return { fov: S.fov || 50, cam, d, vmax: +pl.vmax.toFixed(1), dh: Math.round(pl.dh), D0: Math.round(pl.D0) }; }
  function heliInfo(S) { const pl = heliPlan(S); let lo = 1e9, hi = -1e9; for (let k = 0; k < pl.n; k++) { const h = pl.P[k * 8 + 1] - pl.P[k * 8 + 4]; lo = Math.min(lo, h); hi = Math.max(hi, h); } return { n: pl.n, vmax: +pl.vmax.toFixed(1), dh: Math.round(pl.dh), D0: Math.round(pl.D0), above: [Math.round(lo), Math.round(hi)] }; }
  // the world's instanced trees and bushes to take to another world (one whose own trees are not instanced): each kind's geometry (unit
  // sized, vertex coloured) and samples of its instances (scale, tint)
  function exportKinds(want) {
    const W = Render.world, out = {}, m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), col = new THREE.Color();
    W.root.updateMatrixWorld(true);
    W.root.traverse(ob => {
      if (!ob.isInstancedMesh || !ob.count) return; const g = ob.geometry, v = g.attributes.position.count; if (want && !want.includes(v)) return;
      let K = out[v]; if (!K) { const A = {}; for (const a of ['position', 'normal', 'color']) if (g.attributes[a]) A[a] = { n: g.attributes[a].itemSize, d: Array.from(g.attributes[a].array, x => +x.toFixed(4)) }; out[v] = K = { v, attr: A, index: g.index ? Array.from(g.index.array) : null, n: 0, sam: [] }; }
      K.n += ob.count;
      for (let i = 0; i < ob.count; i += Math.max(1, Math.floor(ob.count / 6))) { ob.getMatrixAt(i, m4); m4.decompose(p, q, s); if (ob.instanceColor) ob.getColorAt(i, col); else col.setRGB(1, 1, 1); if (K.sam.length < 400) K.sam.push([s.x, s.y, s.z, col.r, col.g, col.b].map(x => +x.toFixed(4))); }
    });
    return out;
  }
  function coverDbg(pts) {
    const W = Render.world, out = [];
    for (const [x, z] of pts) {
      const hits = []; W.root.traverse(o => { if (!o.isMesh || !o.geometry) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (x >= bb.min.x && x <= bb.max.x && z >= bb.min.z && z <= bb.max.z) hits.push([o.isInstancedMesh ? 'I' : 'M', g.attributes.position.count, Math.round(bb.max.x - bb.min.x), Math.round(bb.max.z - bb.min.z), o.visible ? 1 : 0, o.material && o.material.type, Math.round(bb.min.y), Math.round(bb.max.y)]); });
      out.push({ x, z, wc: window.__WC ? Math.round(window.__WC.at(x, z)) : null, lvl: window.__WC ? window.__WC.level(x, z) : null, wat: window.__WC ? window.__WC.water(x, z) : null, lc: lcAt ? lcAt(x, z) : null, g: +Render.world.groundH(x, z).toFixed(1), land: land ? +land.h(x, z).toFixed(1) : null, hits: hits.filter(h => h[0] === 'M').slice(0, 12) });
    }
    return out;
  }
  function rayDbg(pxs) {   // what is seen at these pixels (after a frame): our land or the world's ground, where, and the heights there
    const cam = Render.camera, rc = new THREE.Raycaster(), out = [];
    for (const [u, v] of pxs) {
      rc.setFromCamera(new THREE.Vector2(u / cv.width * 2 - 1, 1 - v / cv.height * 2), cam);
      const hl = land ? rc.intersectObject(land.mesh, false)[0] : null, hg = rc.intersectObjects(groundList, false)[0], hs = seaExt ? rc.intersectObject(seaExt, false)[0] : null;
      const f = (h) => h ? [Math.round(h.point.x), Math.round(h.point.y * 10) / 10, Math.round(h.point.z), Math.round(h.distance)] : null;
      const p = (hl && (!hg || hl.distance < hg.distance)) ? hl.point : hg ? hg.point : null;
      out.push({ px: [u, v], land: f(hl), ground: f(hg), sea: f(hs), seaVis: seaExt ? seaExt.visible : null, seaY: seaExt ? seaExt.geometry.attributes.position.array[1] : null, wc: p && wcov ? Math.round(wcov.at(p.x, p.z)) : null, gH: p ? +Render.world.groundH(p.x, p.z).toFixed(1) : null, landH: p && land ? +land.h(p.x, p.z).toFixed(1) : null, groundMeshes: groundList.length });
    }
    return out;
  }
  function coverWho(pts) {   // (debug) which of the world's meshes (shown or not) have a triangle over these points (x, z), and at what height
    const W = Render.world, out = pts.map(([x, z]) => ({ x, z, wc: wcov ? Math.round(wcov.at(x, z)) : null, hits: [] }));
    W.root.updateMatrixWorld(true);
    W.root.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position) return;
      const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
      const P = g.attributes.position, I = g.index, n = I ? I.count : P.count, v = new THREE.Vector3(), A = [];
      for (const q of out) {
        if (q.x < bb.min.x || q.x > bb.max.x || q.z < bb.min.z || q.z > bb.max.z) continue;
        for (let t = 0; t + 2 < n; t += 3) {
          const ids = [I ? I.getX(t) : t, I ? I.getX(t + 1) : t + 1, I ? I.getX(t + 2) : t + 2], c = ids.map(k => v.fromBufferAttribute(P, k).applyMatrix4(o.matrixWorld).clone());
          const den = (c[1].z - c[2].z) * (c[0].x - c[2].x) + (c[2].x - c[1].x) * (c[0].z - c[2].z); if (Math.abs(den) < 1e-9) continue;
          const l1 = ((c[1].z - c[2].z) * (q.x - c[2].x) + (c[2].x - c[1].x) * (q.z - c[2].z)) / den, l2 = ((c[2].z - c[0].z) * (q.x - c[2].x) + (c[0].x - c[2].x) * (q.z - c[2].z)) / den;
          if (l1 >= 0 && l2 >= 0 && l1 + l2 <= 1) { let vis = true, p = o; while (p) { if (!p.visible) vis = false; p = p.parent; } const m = Array.isArray(o.material) ? o.material[0] : o.material;
            q.hits.push({ y: +(c[0].y * l1 + c[1].y * l2 + c[2].y * (1 - l1 - l2)).toFixed(1), vis, name: o.name, verts: P.count, size: [Math.round(bb.max.x - bb.min.x), Math.round(bb.max.z - bb.min.z)], mat: m ? (m.type + (m.map ? ' map' : '') + (m.color ? ' #' + m.color.getHexString() : '') + (m.transparent ? ' tr' + m.opacity : '')) : '', ground: groundMeshes.has(o) }); break; }
        }
      }
    });
    return out;
  }
  function rayAll(pxs) {   // (debug) the first thing seen at these pixels, whatever it is: its name, kind, material, size and parents
    const cam = Render.camera, rc = new THREE.Raycaster(), out = [], scene = cam.parent && cam.parent.isScene ? cam.parent : (Render.scene || null);
    const root = scene || (function () { let o = groundList[0]; while (o && o.parent) o = o.parent; return o; })();
    for (const [u, v] of pxs) {
      rc.setFromCamera(new THREE.Vector2(u / cv.width * 2 - 1, 1 - v / cv.height * 2), cam);
      const hits = rc.intersectObject(root, true).filter(h => h.object.visible !== false && h.object.isMesh).slice(0, 3);
      out.push({ px: [u, v], hits: hits.map(h => { const o = h.object, m = Array.isArray(o.material) ? o.material[0] : o.material, chain = []; let q = o; while (q && chain.length < 5) { chain.push((q.name || q.type) + (q.userData && q.userData.kind ? ':' + q.userData.kind : '')); q = q.parent; }
        return { d: Math.round(h.distance), p: h.point.toArray().map(Math.round), name: o.name, type: o.type, inst: !!o.isInstancedMesh, verts: o.geometry && o.geometry.attributes.position ? o.geometry.attributes.position.count : 0, mat: m ? (m.name || m.type) + ' #' + (m.color ? m.color.getHexString() : '') + (m.map ? ' map' : '') : '', ground: groundMeshes.has(o), land: !!(land && o === land.mesh), chain: chain.join(' < ') }; }) });
    }
    return out;
  }
  function maskDbg() { if (!wcov || !wcov.maskTex) return null; const D = wcov.maskTex.image.data; let n = 0; for (let k = 0; k < D.length; k++) if (D[k]) n++; return { n, total: D.length, box: wcov.maskBox, hasOBC: !!(land && land.mesh.material.onBeforeCompile), prog: land && land.mesh.material.customProgramCacheKey && land.mesh.material.customProgramCacheKey() }; }
  function dbg() {
    const cam = Render.camera, out = { cam: cam.position.toArray().map(Math.round), up: cam.up.toArray().map(v => +v.toFixed(3)), fov: cam.fov, far: cam.far, near: +cam.near.toFixed(1) };
    if (shadow) { const p = shadow.g.attributes.position.array, c = new THREE.Vector3(p[(shadow.N * (shadow.N + 1) / 2 + shadow.N / 2) * 3], p[(shadow.N * (shadow.N + 1) / 2 + shadow.N / 2) * 3 + 1], p[(shadow.N * (shadow.N + 1) / 2 + shadow.N / 2) * 3 + 2]); out.sh = c.toArray().map(Math.round); c.project(cam); out.shScr = [+c.x.toFixed(2), +c.y.toFixed(2), +c.z.toFixed(3)]; out.shVis = shadow.mesh.visible; out.shOp = shadow.mesh.material.opacity; out.inScene = !!shadow.mesh.parent; out.layers = shadow.mesh.layers.mask; out.camLayers = cam.layers.mask; }
    return out;
  }
  return { coverWho, rayAll, maskDbg, rayDbg, exportKinds, coverDbg, dbg, setup, pose, run, waitCar, frame, cars, road, jerk, path, heliPath, heliInfo, heliTiles, plantLand, ground };
})();
