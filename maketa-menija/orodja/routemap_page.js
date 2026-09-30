// Mockup only (routemap.mjs): the maps of the open roads and the rally stages for the track menu, drawn from the game's own worlds.
// Runs inside the game page (headless). Two views of a track's whole world: from the air at an angle, and from straight above. Each
// comes as a picture of the land (transparent where the world ends) and the route, its places and its heights, for the menu to draw
// on top. Dry, or wet as the game draws a race in the rain.
window.RM = (function () {
  const THEMES = {   // the race lighting of each theme (render.js)
    lake:     { fog: 0xbcd3e4, sun: 0xfff0d6, sunI: 0.98, sky: 0xd3e7ff, gnd: 0x5d6b35, hemiI: 0.62 },
    mountain: { fog: 0xb4cadf, sun: 0xfff2e0, sunI: 1.0, sky: 0xc8dcff, gnd: 0x4d5c33, hemiI: 0.6 },
    ouni:     { fog: 0xc4d3dc, sun: 0xffe9c6, sunI: 1.18, sky: 0xcfe1f5, gnd: 0x4a5a2e, hemiI: 0.56, sunOff: [-88, 72, 58] },
    vrsic:    { fog: 0xc6d4e0, sun: 0xffe4b8, sunI: 1.16, sky: 0xcfe0f4, gnd: 0x6a5a3a, hemiI: 0.58, sunOff: [-84, 70, 56] },
    pikes:    { fog: 0xdfd0cc, sun: 0xffcc8f, sunI: 1.58, sky: 0x9fbbf1, gnd: 0x70604e, hemiI: 0.75, sunOff: [104, 48, -60] },
  };
  let B = null, R = null, CV = null;
  function build(id) {
    if (B && B.id === id) return B;
    const def = Core.TRACKS.find(d => d.id === id), T = new Core.Track(def), sc = new THREE.Scene(), tex = Tex.all(1);
    const w = World.build(sc, T, tex, { density: 1 });
    sc.updateMatrixWorld(true);
    w.root.traverse(o => { if (o.isMesh || o.isInstancedMesh) { o.castShadow = true; o.receiveShadow = true; } });
    B = { id, def, T, sc, w, tex, open: T.finishS > T.startS };
    return B;
  }
  function getR(W, H) {
    if (!R) {
      CV = document.createElement('canvas');
      R = new THREE.WebGLRenderer({ canvas: CV, antialias: true, alpha: true, preserveDrawingBuffer: true });
      R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    R.setPixelRatio(1); R.setSize(W, H, false); return R;
  }
  // the run: from the start line to the finish (a closed track: one lap from the start line), every `step` metres, 2 m over the road
  function run(T, open, step) {
    const a = T.startS, b = open ? T.finishS : T.startS + T.len, out = [];
    for (let s = a; s <= b + 0.01; s += step) { const i = T.idx(s); out.push({ x: T.px[i], y: T.hy[i] + 2, z: T.pz[i], d: s - a, h: T.hy[i] }); }
    return out;
  }
  // the wet world (render.js applyWeather): a darker road, the puddles, no cloud shadows
  function wet(Bw, r) {
    const { w, tex } = Bw, maps = [tex.asphalt, tex.paving, tex.curb, tex.makadam].filter(Boolean);
    w.root.traverse(o => { for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
      if (!m.color || !maps.includes(m.map)) continue;
      if (!m.userData.dry) m.userData.dry = m.color.clone();
      m.color.copy(m.userData.dry).multiplyScalar(1 - (m.map === tex.curb ? 0.22 : 0.36) * r); } });
    const W = w.dyn && w.dyn.wet;
    if (W) { W.puddles.visible = r > 0; W.road.color.setScalar(1 - 0.36 * r); W.road.shininess = r > 0 ? 28 : W.base.sh; W.road.specular.setHex(r > 0 ? 0x3c3e40 : W.base.sp); W.ground.color.setScalar(1 - 0.2 * r); }
    if (w.dyn && w.dyn.clouds) w.dyn.clouds.K.value = w.dyn.clouds.k0 * (1 - r);
  }
  // the theme's sky light and sun (overcast in the rain), the sun's shadows over the whole route
  function lights(Bw, box, rn) {
    const th = THEMES[Bw.def.theme] || THEMES.lake, mix = (a, b, f) => new THREE.Color(a).lerp(new THREE.Color(b), f * rn), L = [];
    const hemi = new THREE.HemisphereLight(mix(th.sky, 0xaab4bd, 0.7), mix(th.gnd, 0x3a4032, 0.5), th.hemiI * (1 + 0.3 * rn)); Bw.sc.add(hemi); L.push(hemi);
    const sun = new THREE.DirectionalLight(mix(th.sun, 0xe8eef4, 0.8), th.sunI * (1 - 0.62 * rn));
    const cx = (box.x0 + box.x1) / 2, cz = (box.z0 + box.z1) / 2, cy = box.y, R0 = Math.hypot(box.x1 - box.x0, box.z1 - box.z0) / 2 + 200;
    const so = th.sunOff || [-80, 96, 70], d = new THREE.Vector3(so[0], so[1], so[2]).normalize();
    sun.position.set(cx + d.x * R0 * 2, cy + d.y * R0 * 2, cz + d.z * R0 * 2); sun.target.position.set(cx, cy, cz);
    sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
    const s = sun.shadow.camera; s.left = -R0; s.right = R0; s.top = R0; s.bottom = -R0; s.near = R0 * 0.5; s.far = R0 * 4; s.updateProjectionMatrix();
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
    Bw.sc.add(sun, sun.target); L.push(sun, sun.target);
    return L;
  }
  // the land round the world: the game builds only a strip round the road, so the menu's views fill the rest with a plain low-poly
  // land of the same heights (the world's own height function), coloured by height from the valley to the rock and snow, a little
  // under the world's own ground so the real land shows wherever it is built
  const RAMPS = {
    vrsic: [[-0.15, 0x6f7a3c], [0.12, 0x8a672d], [0.45, 0x6c5030], [0.78, 0x6d7058], [1.0, 0x8c8880], [1.3, 0x9a968f], [1.55, 0xe4e8ec]],
    pikes: [[-0.1, 0x46562f], [0.45, 0x55603a], [0.66, 0x8a7b66], [0.9, 0x9c928a], [1.35, 0xa8a09a], [1.6, 0xeef0f2]],
    ouni: [[-0.2, 0x3b562a], [0.5, 0x4a6632], [1.2, 0x5c7a3d]],
    mountain: [[-0.2, 0x587637], [0.6, 0x6d7d44], [1.3, 0x8b8c7b]],
    lake: [[-0.2, 0x587637], [1.2, 0x6d7d44]],
  };
  function skirt(Bw, margin, cell) {
    if (Bw.skirt) return Bw.skirt;
    const b = Bw.w.bounds, g = Bw.w.groundH, x0 = b.minX - margin, z0 = b.minZ - margin, nx = Math.ceil((b.maxX - b.minX + 2 * margin) / cell), nz = Math.ceil((b.maxZ - b.minZ + 2 * margin) / cell);
    const T = Bw.T; let h0 = 1e9, h1 = -1e9; for (let i = 0; i < T.N; i++) { h0 = Math.min(h0, T.hy[i]); h1 = Math.max(h1, T.hy[i]); } if (h1 - h0 < 50) h1 = h0 + 50;
    const ramp = RAMPS[Bw.def.theme] || RAMPS.lake, C = ramp.map(r => [r[0], new THREE.Color(r[1])]), rock = new THREE.Color(0x857f76), c = new THREE.Color();
    const pos = new Float32Array((nx + 1) * (nz + 1) * 3), col = new Float32Array((nx + 1) * (nz + 1) * 3), H = new Float32Array((nx + 1) * (nz + 1));
    // the world's heights near the road (its real land); further out the heights spread smoothly from there (the game's own height
    // function only stretches its edge outwards), with hills rising the further from the road
    const W1 = nx + 1, near = new Uint8Array((nx + 1) * (nz + 1)), dist = new Float32Array((nx + 1) * (nz + 1));
    const rp = run(T, Bw.open, 30);
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = x0 + i * cell, z = z0 + j * cell, k = j * W1 + i; let dm = 1e9; for (const p of rp) { const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z); if (d < dm) dm = d; }
      dist[k] = Math.sqrt(dm); let y = g ? g(x, z) : h0; if (!Number.isFinite(y)) y = h0; H[k] = y; near[k] = dist[k] < 520 ? 1 : 0;
    }
    let avg = 0, cnt = 0; for (let k = 0; k < H.length; k++) if (near[k]) { avg += H[k]; cnt++; } avg = cnt ? avg / cnt : h0;
    for (let k = 0; k < H.length; k++) if (!near[k]) H[k] = avg;
    const tmp = new Float32Array(H.length);
    for (let it = 0; it < 420; it++) {
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const k = j * W1 + i; if (near[k]) { tmp[k] = H[k]; continue; }
        const a1 = H[j * W1 + Math.max(0, i - 1)], a2 = H[j * W1 + Math.min(nx, i + 1)], a3 = H[Math.max(0, j - 1) * W1 + i], a4 = H[Math.min(nz, j + 1) * W1 + i]; tmp[k] = (a1 + a2 + a3 + a4) / 4; }
      H.set(tmp);
    }
    const vn = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }, sm = (t) => t * t * (3 - 2 * t);
      const a = h(xi, zi), b2 = h(xi + 1, zi), c2 = h(xi, zi + 1), d = h(xi + 1, zi + 1), u = sm(fx), v = sm(fz); return (a * (1 - u) + b2 * u) * (1 - v) + (c2 * (1 - u) + d * u) * v; };
    const amp = { vrsic: 620, pikes: 460, ouni: 30, mountain: 150, lake: 60 }[Bw.def.theme] || 120;
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const k = j * W1 + i; if (near[k]) continue;
      const x = x0 + i * cell, z = z0 + j * cell, f = Math.min(1, (dist[k] - 520) / 1400);
      const n = vn(x / 1400, z / 1400) * 0.6 + vn(x / 560, z / 560) * 0.3 + vn(x / 230, z / 230) * 0.1;
      H[k] += f * f * amp * (n * 1.25 - 0.1);
    }
    const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const k = j * (nx + 1) + i, y = H[k], t = (y - h0) / (h1 - h0);
      const gx = (H[j * (nx + 1) + Math.min(nx, i + 1)] - H[j * (nx + 1) + Math.max(0, i - 1)]) / (2 * cell), gz = (H[Math.min(nz, j + 1) * (nx + 1) + i] - H[Math.max(0, j - 1) * (nx + 1) + i]) / (2 * cell);
      let q = 0; while (q < C.length - 1 && t > C[q + 1][0]) q++;
      if (q >= C.length - 1) c.copy(C[C.length - 1][1]); else { const f = Math.min(1, Math.max(0, (t - C[q][0]) / (C[q + 1][0] - C[q][0]))); c.copy(C[q][1]).lerp(C[q + 1][1], f); }
      const sl = Math.hypot(gx, gz); if (sl > 0.7) c.lerp(rock, Math.min(0.8, (sl - 0.7) * 1.2));
      c.multiplyScalar(0.9 + 0.2 * hash(i, j));
      pos.set([x0 + i * cell, y - (near[k] ? 4 : 0), z0 + j * cell], k * 3); col.set([c.r, c.g, c.b], k * 3);
    }
    const idx = []; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b2 = a + 1, c2 = a + nx + 1, d = c2 + 1; idx.push(a, c2, b2, b2, c2, d); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })); m.receiveShadow = true; m.castShadow = false;
    m.userData = { x0, z0, nx, nz, cell }; Bw.sc.add(m); Bw.skirt = m; return m;
  }
  const boxOf = (pts, pad) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y = 0; for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); y += p.h; } return { x0: x0 - pad, x1: x1 + pad, z0: z0 - pad, z1: z1 + pad, y: y / pts.length }; };
  // which points the camera sees: a depth picture of the land (the trees and the other repeated things left out: the route under
  // the trees still shows on a map), each point against it
  function seen(r, sc, cam, pts, W, H) {
    const rt = new THREE.WebGLRenderTarget(W, H), dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), hid = [];
    sc.traverse(o => { if ((o.isInstancedMesh || o.isPoints || o.isSprite) && o.visible) { o.visible = false; hid.push(o); } });
    const ov = sc.overrideMaterial; sc.overrideMaterial = dm; r.setRenderTarget(rt); r.setClearColor(0xffffff, 1); r.clear(); r.render(sc, cam); r.setRenderTarget(null); sc.overrideMaterial = ov;
    hid.forEach(o => { o.visible = true; });
    const buf = new Uint8Array(W * H * 4); r.readRenderTargetPixels(rt, 0, 0, W, H, buf); rt.dispose(); dm.dispose();
    const depth = (x, y) => { const o = (y * W + x) * 4; return (buf[o] / 16777216 + buf[o + 1] / 65536 + buf[o + 2] / 256 + buf[o + 3]) / 255 * 255 / 256; };
    const v = new THREE.Vector3(), out = [];
    for (const p of pts) {
      v.set(p.x, p.y, p.z).project(cam);
      const px = Math.round((v.x + 1) / 2 * W), py = Math.round((v.y + 1) / 2 * H);
      if (px < 1 || py < 1 || px >= W - 1 || py >= H - 1 || v.z > 1) { out.push(0); continue; }
      let far = 0; for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) far = Math.max(far, depth(px + ox, py + oy));   // (the farthest of the 9 pixels round it: the road's own edge does not hide it)
      out.push((v.z + 1) / 2 <= far + 0.0004 ? 1 : 0);
    }
    return out;
  }
  function project(cam, pts, W, H) { const v = new THREE.Vector3(); return pts.map(p => { v.set(p.x, p.y, p.z).project(cam); return [+((v.x + 1) / 2 * W).toFixed(1), +((1 - v.y) / 2 * H).toFixed(1)]; }); }
  function names(Bw) { return (Bw.T.names || []).map(q => ({ n: q.n, d: q.d, hud: q.hud })); }
  function shoot(Bw, cam, W, H, pts, rn, box) {
    const r = getR(W, H), sc = Bw.sc;
    wet(Bw, rn);
    const L = lights(Bw, box, rn);
    r.setClearColor(0x000000, 0); r.render(sc, cam);
    const png = CV.toDataURL('image/png');
    const vis = seen(r, sc, cam, pts, W, H);
    L.forEach(l => sc.remove(l));
    return { png, vis };
  }

  // the run's long axis (principal axis) and its centre; the axis points from the start's end to the finish's end
  function axis(pts) {
    let mx = 0, mz = 0; for (const p of pts) { mx += p.x; mz += p.z; } mx /= pts.length; mz /= pts.length;
    let sxx = 0, szz = 0, sxz = 0; for (const p of pts) { const a = p.x - mx, b = p.z - mz; sxx += a * a; szz += b * b; sxz += a * b; }
    let th = 0.5 * Math.atan2(2 * sxz, sxx - szz); const ux = Math.cos(th), uz = Math.sin(th), a0 = pts[0], a1 = pts[pts.length - 1];
    if ((a1.x - a0.x) * ux + (a1.z - a0.z) * uz < 0) th += Math.PI;   // (the start on the left)
    return { mx, mz, th };
  }

  // from the air at an angle: looking across the run (its long axis along the picture's width, the start on the left), the whole run
  // in the lower part of the picture and the far land up to the haze above it
  function aerial(id, opt) {
    opt = Object.assign({ W: 824, H: 660, el: 34, fov: 34, az: 0, step: 12, fillW: 0.9, fillH: 0.62, yc: -0.16, rain: 0 }, opt || {});
    const Bw = build(id), T = Bw.T, pts = run(T, Bw.open, opt.step), box = boxOf(pts, 120), A = axis(pts); if (opt.skirt !== false) skirt(Bw, 3000, 40);
    const th = A.th + opt.az * Math.PI / 180, rx = Math.cos(th), rz = Math.sin(th), fx = rz, fz = -rx;   // right along the run; forward: 90 degrees to it
    const e = opt.el * Math.PI / 180, cam = new THREE.PerspectiveCamera(opt.fov, opt.W / opt.H, 5, 80000), v = new THREE.Vector3();
    let tx = A.mx, tz = A.mz, ty = box.y, D = Math.hypot(box.x1 - box.x0, box.z1 - box.z0) * 1.2;
    const place = () => { cam.position.set(tx - fx * D * Math.cos(e), ty + D * Math.sin(e), tz - fz * D * Math.cos(e)); cam.lookAt(tx, ty, tz); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); };
    for (let it = 0; it < 40; it++) {
      place(); let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      for (const p of pts) { v.set(p.x, p.y, p.z).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      const hh = D * Math.tan(opt.fov * Math.PI / 360), hw = hh * cam.aspect, ex = (x0 + x1) / 2, ey = (y0 + y1) / 2 - opt.yc;
      tx += rx * ex * hw * 0.7 + fx * ey * hh * 0.7 / Math.sin(e); tz += rz * ex * hw * 0.7 + fz * ey * hh * 0.7 / Math.sin(e);
      D *= Math.pow(Math.max((x1 - x0) / (2 * opt.fillW), (y1 - y0) / (2 * opt.fillH)), 0.6);
    }
    place();
    const shot = shoot(Bw, cam, opt.W, opt.H, pts, opt.rain, box);
    const hz = new THREE.Vector3(cam.position.x + fx * 1e6, cam.position.y, cam.position.z + fz * 1e6).project(cam);
    return { png: shot.png, W: opt.W, H: opt.H, route: project(cam, pts, opt.W, opt.H), vis: shot.vis, d: pts.map(p => Math.round(p.d)), h: pts.map(p => +p.h.toFixed(1)), names: names(Bw),
      raceLen: Math.round(Bw.open ? T.raceLen : T.len), open: Bw.open, horizon: +((1 - hz.y) / 2 * opt.H).toFixed(1) };
  }

  // from straight above: north (or the run's long side) turned to fit the picture, the land round the run
  function top(id, opt) {
    opt = Object.assign({ W: 824, H: 700, step: 12, pad: 0.12, rot: null, rain: 0, grid: 0 }, opt || {});
    const Bw = build(id), T = Bw.T, pts = run(T, Bw.open, opt.step), box = boxOf(pts, 60); if (opt.skirt !== false) skirt(Bw, 3000, 40);
    // the run's long axis along the picture's width, the start on the left
    const A = axis(pts), mx = A.mx, mz = A.mz, th = opt.rot != null ? opt.rot * Math.PI / 180 : A.th;
    const ux = Math.cos(th), uz = Math.sin(th), vx = -uz, vz = ux;   // u: along the picture's width, v: along its height (down)
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const p of pts) { const a = (p.x - mx) * ux + (p.z - mz) * uz, b = (p.x - mx) * vx + (p.z - mz) * vz; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
    const cw = (a0 + a1) / 2, ch = (b0 + b1) / 2, asp = opt.W / opt.H;
    let hw = (a1 - a0) / 2 * (1 + opt.pad), hh = (b1 - b0) / 2 * (1 + opt.pad); if (hw / hh > asp) hh = hw / asp; else hw = hh * asp;
    const cx = mx + ux * cw + vx * ch, cz = mz + uz * cw + vz * ch;
    const cam = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 1, 40000);
    cam.position.set(cx, box.y + 12000, cz); cam.up.set(-vx, 0, -vz); cam.lookAt(cx, box.y, cz); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    const shot = shoot(Bw, cam, opt.W, opt.H, pts, opt.rain, box);
    let grid = null;
    if (opt.grid) {   // the ground's heights on a grid over the picture (for contour lines)
      const n = opt.grid, m = Math.round(n / asp), g = [], ex = -1e9; const gh = Bw.w.groundH;
      for (let j = 0; j <= m; j++) for (let i = 0; i <= n; i++) {
        const a = -hw + 2 * hw * i / n, b = -hh + 2 * hh * j / m, x = cx + ux * a + vx * b, z = cz + uz * a + vz * b, y = gh ? gh(x, z) : NaN;
        g.push(Number.isFinite(y) ? Math.round(y * 10) / 10 : null);
      }
      grid = { n, m, g };
    }
    return { png: shot.png, W: opt.W, H: opt.H, route: project(cam, pts, opt.W, opt.H), vis: shot.vis, d: pts.map(p => Math.round(p.d)), h: pts.map(p => +p.h.toFixed(1)), names: names(Bw),
      raceLen: Math.round(Bw.open ? T.raceLen : T.len), open: Bw.open, mPerPx: +(2 * hw / opt.W).toFixed(3), north: +(Math.atan2(-vx, -vz) * 180 / Math.PI).toFixed(1), grid };
  }
  // a floating block of the land round the run (like the circuits' models): a rectangle along the run, cut out of the world and the
  // land round it, soil down its sides, seen from above at an angle; transparent round it
  function block(id, opt) {
    opt = Object.assign({ W: 824, H: 700, el: 42, rot: 26, fov: 30, fill: 0.94, step: 12, margin: 0.1, soil: 0.1, rain: 0 }, opt || {});
    const Bw = build(id), T = Bw.T, pts = run(T, Bw.open, opt.step), A = axis(pts), sk = skirt(Bw, 3000, 40);
    const ux = Math.cos(A.th), uz = Math.sin(A.th), vx = -uz, vz = ux;
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const p of pts) { const a = (p.x - A.mx) * ux + (p.z - A.mz) * uz, b = (p.x - A.mx) * vx + (p.z - A.mz) * vz; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
    const L0 = (a1 - a0) / 2, m = L0 * opt.margin; a0 -= m; a1 += m; const bw = Math.max((b1 - b0) / 2 + m, (a1 - a0) / 2 * 0.36), bc = (b0 + b1) / 2; b0 = bc - bw; b1 = bc + bw;
    const cx = A.mx + ux * (a0 + a1) / 2 + vx * bc, cz = A.mz + uz * (a0 + a1) / 2 + vz * bc, hl = (a1 - a0) / 2;
    const corner = (sa, sb) => [cx + ux * sa * hl + vx * sb * bw, cz + uz * sa * hl + vz * sb * bw];
    const C = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
    const planes = [[ux, uz, hl], [-ux, -uz, hl], [vx, vz, bw], [-vx, -vz, bw]].map(([nx, nz, h]) => new THREE.Plane(new THREE.Vector3(-nx, 0, -nz), nx * cx + nz * cz + h));
    const mats = new Set(); Bw.sc.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(q => mats.add(q)); });
    mats.forEach(q => { q.clippingPlanes = planes; q.clipShadows = true; q.needsUpdate = true; });
    // soil sides: from the land's edge (the higher of the world's ground and the land round it) down to the base
    const g = Bw.w.groundH, topAt = (x, z) => { const y = g ? g(x, z) : 0; return Number.isFinite(y) ? y : 0; };
    let ymin = 1e9, ymax = -1e9; const E = [];
    for (let e = 0; e < 4; e++) { const P = C[e], Q = C[(e + 1) % 4], n = 80; for (let k = 0; k <= n; k++) { const x = P[0] + (Q[0] - P[0]) * k / n, z = P[1] + (Q[1] - P[1]) * k / n, y = skirtH(sk, x, z); E.push([x, y, z, e]); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); } }
    const base = ymin - Math.max(40, hl * 2 * opt.soil), pos = [], col = [], soil = [[0.47, 0.33, 0.2], [0.56, 0.39, 0.24], [0.36, 0.25, 0.17], [0.3, 0.22, 0.13]];
    for (let k = 0; k < E.length - 1; k++) {
      const p = E[k], q = E[k + 1]; if (p[3] !== q[3]) continue;
      const band = (y0, y1, c) => { pos.push(p[0], y0(p), p[2], q[0], y0(q), q[2], q[0], y1(q), q[2], p[0], y0(p), p[2], q[0], y1(q), q[2], p[0], y1(p), p[2]); for (let t = 0; t < 6; t++) col.push(c[0], c[1], c[2]); };
      const lv = (f) => (r) => r[1] + (base - r[1]) * f;
      band(lv(0), lv(0.08), soil[0]); band(lv(0.08), lv(0.45), soil[1]); band(lv(0.45), lv(0.8), soil[2]); band(lv(0.8), lv(1), soil[3]);
    }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); wg.computeVertexNormals();
    const wall = new THREE.Mesh(wg, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); Bw.sc.add(wall);
    // the camera: turned a little off the run's axis, from above at an angle, the block filling the picture
    const rot = opt.rot * Math.PI / 180, dx = Math.cos(A.th + rot), dz = Math.sin(A.th + rot), fx = dz, fz = -dx, e = opt.el * Math.PI / 180;
    const cam = new THREE.PerspectiveCamera(opt.fov, opt.W / opt.H, 5, 80000), v = new THREE.Vector3();
    const hull = []; for (const c of C) hull.push([c[0], ymax + 20, c[1]], [c[0], base, c[1]]);
    let tx = cx, tz = cz, ty = (ymax + base) / 2, D = hl * 4;
    const place = () => { cam.position.set(tx - fx * D * Math.cos(e), ty + D * Math.sin(e), tz - fz * D * Math.cos(e)); cam.lookAt(tx, ty, tz); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); };
    for (let it = 0; it < 40; it++) {
      place(); let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      for (const h of hull) { v.set(h[0], h[1], h[2]).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      const hh = D * Math.tan(opt.fov * Math.PI / 360), hw = hh * cam.aspect, ex = (x0 + x1) / 2, ey = (y0 + y1) / 2;
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
      tx += right.x * ex * hw * 0.7 + up.x * ey * hh * 0.7; ty += up.y * ey * hh * 0.7; tz += right.z * ex * hw * 0.7 + up.z * ey * hh * 0.7;
      D *= Math.pow(Math.max((x1 - x0) / (2 * opt.fill), (y1 - y0) / (2 * opt.fill)), 0.6);
    }
    place();
    const R2 = getR(opt.W, opt.H); R2.localClippingEnabled = true;
    const shot = shoot(Bw, cam, opt.W, opt.H, pts, opt.rain, boxOf(pts, 120));
    mats.forEach(q => { q.clippingPlanes = null; q.needsUpdate = true; }); Bw.sc.remove(wall);
    return { png: shot.png, W: opt.W, H: opt.H, route: project(cam, pts, opt.W, opt.H), vis: shot.vis, d: pts.map(p => Math.round(p.d)), h: pts.map(p => +p.h.toFixed(1)), names: names(Bw),
      raceLen: Math.round(Bw.open ? T.raceLen : T.len), open: Bw.open };
  }
  function skirtH(sk, x, z) {   // the land's height under a point (the higher of the world's ground and the land round it)
    const P = sk.geometry.attributes.position, S = sk.userData; const i = Math.min(S.nx - 1, Math.max(0, Math.floor((x - S.x0) / S.cell))), j = Math.min(S.nz - 1, Math.max(0, Math.floor((z - S.z0) / S.cell)));
    const fx = (x - S.x0) / S.cell - i, fz = (z - S.z0) / S.cell - j, k = (j * (S.nx + 1) + i) * 3, W1 = (S.nx + 1) * 3;
    const y = (P.array[k + 1] * (1 - fx) + P.array[k + 4] * fx) * (1 - fz) + (P.array[k + W1 + 1] * (1 - fx) + P.array[k + W1 + 4] * fx) * fz;
    return y;
  }

  // a flyover (like a stage presentation): the camera follows the run from behind and above through the haze, the route drawn up to a
  // glowing point that runs at an even speed (it only speeds up at the start and slows down at the finish); at the end the camera rises
  // over the finish. flyInit plans every frame: the point's place along the run between the road's points (no steps), the camera's
  // heading and aim smoothed over time (it turns gently); flyFrame(k) draws frame k (JPEG) and tells where the start, the finish, the
  // point and the chosen places are on it (the menu writes their names over the video).
  let F = null;
  function smooth(arr, r) {   // a moving average; near the ends a narrower one, so the ends stay where they are
    const n = arr.length, out = new Array(n); for (let i = 0; i < n; i++) { const q = Math.min(r, i, n - 1 - i); let a = 0; for (let k = -q; k <= q; k++) a += arr[i + k]; out[i] = a / (2 * q + 1); } return out;
  }
  function gauss(arr, sig) { const r = Math.ceil(sig * 3), n = arr.length, out = new Array(n); for (let i = 0; i < n; i++) { let a = 0, c = 0; for (let k = -r; k <= r; k++) { const w = Math.exp(-k * k / (2 * sig * sig)), j = Math.min(n - 1, Math.max(0, i + k)); a += arr[j] * w; c += w; } out[i] = a / c; } return out; }
  const at = (a, u) => { const i = Math.min(a.length - 2, Math.max(0, Math.floor(u))), f = Math.min(1, Math.max(0, u - i)); return a[i] * (1 - f) + a[i + 1] * f; };
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  // how far along the run at x (0..1 of its time): an even speed, reached smoothly over the first `e` and lost over the last `e`
  function glide(x, e) {
    const G = (y) => e * (Math.pow(y / e, 3) - Math.pow(y / e, 4) / 2); x = Math.min(1, Math.max(0, x));
    return (x < e ? G(x) : x > 1 - e ? 1 - e - G(1 - x) : e / 2 + x - e) / (1 - e);
  }
  function flyInit(id, opt) {
    // speed: the point's even speed (m/s); end: the seconds of the rise over the finish; turn: how slowly the camera turns and aim: how
    // gently it follows the point (seconds);
    // cull: the trees and other repeated things are left out from this far into the haze (0 its start, 1 its end), where they hardly show
    opt = Object.assign({ W: 660, H: 544, fps: 30, speed: 300, ease: 0.12, end: 2.4, turn: 0.8, aim: 0.3, cull: 0.75, fov: 48, back: 520, up: 330, ahead: 260, rain: 0, shadow: 2048, color: 0xffd23a, places: [], fogNear: 900, fogFar: 3400 }, opt || {});
    const Bw = build(id), T = Bw.T, pts = run(T, Bw.open, 6), box = boxOf(pts, 120), th = THEMES[Bw.def.theme] || THEMES.lake; skirt(Bw, 3000, 40);
    const r = getR(opt.W, opt.H); wet(Bw, opt.rain);
    const L = lights(Bw, box, opt.rain); L[1].shadow.mapSize.set(opt.shadow, opt.shadow);
    r.shadowMap.autoUpdate = false; r.shadowMap.needsUpdate = true;   // nothing in the world moves: its shadows are drawn once
    // haze: the world fades into the theme's haze in the distance; the sky a light blue above it (the horizon is near the top)
    const fogC = new THREE.Color(th.fog); Bw.sc.fog = new THREE.Fog(fogC, opt.fogNear, opt.fogFar);
    const sk = document.createElement('canvas'); sk.width = 4; sk.height = 256; const gx = sk.getContext('2d'), gg = gx.createLinearGradient(0, 0, 0, 256);
    gg.addColorStop(0, '#78a2d6'); gg.addColorStop(0.2, '#' + new THREE.Color(th.fog).lerp(new THREE.Color(0x78a2d6), 0.3).getHexString()); gg.addColorStop(1, '#' + fogC.getHexString());
    gx.fillStyle = gg; gx.fillRect(0, 0, 4, 256); Bw.sc.background = new THREE.CanvasTexture(sk);
    // the route: a flat ribbon 1 m over the road, 14 m wide, drawn up to the point
    const n = pts.length, pos = new Float32Array(n * 2 * 3), idx = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * 7, nz = dx / l * 7, p = pts[i];
      pos.set([p.x + nx, p.y - 0.5, p.z + nz, p.x - nx, p.y - 0.5, p.z - nz], i * 6);
      if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    const ribbon = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: opt.color, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    Bw.sc.add(ribbon);
    // the glowing point
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,246,190,.95)'); gr.addColorStop(0.4, 'rgba(255,214,60,.35)'); gr.addColorStop(1, 'rgba(255,214,60,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false, transparent: true, fog: false })); dot.renderOrder = 10; Bw.sc.add(dot);
    // the camera's path: the road smoothed (the further back the camera, the more), and how far round it looks for the road's heading
    const rs = Math.max(8, Math.round(opt.back * 0.7 / 6)), rh = Math.max(6, Math.round(opt.back * 0.3 / 6));
    const sx = smooth(pts.map(p => p.x), rs), sz = smooth(pts.map(p => p.z), rs), sy = smooth(pts.map(p => p.y), Math.round(rs * 2 / 3));
    const cam = new THREE.PerspectiveCamera(opt.fov, opt.W / opt.H, 5, 60000);
    const places = opt.places.map(q => { const k = Math.min(n - 1, Math.max(0, Math.round(q.d / 6))); return { n: q.n, d: q.d, p: pts[k] }; });
    // the plan of every frame: the point's place (a fraction of the road's points), the camera's heading, and where it looks: a little
    // ahead of the point (so the point always shows, low in the middle); at the end on the finish itself
    const px = pts.map(p => p.x), pz = pts.map(p => p.z);
    const runF = Math.max(2, Math.round(pts[n - 1].d / (opt.speed * (1 - opt.ease)) * opt.fps)), endF = Math.max(1, Math.round(opt.end * opt.fps)), N = runF + endF;
    const U = [], E = [], TH = [], AX = [], AY = [], AZ = [];
    for (let k = 0; k < N; k++) {
      const u = glide(k / (runF - 1), opt.ease) * (n - 1), a = Math.max(0, u - rh), b = Math.min(n - 1, u + rh);
      U.push(u); E.push(ease(Math.min(1, Math.max(0, (k - runF + 1) / endF)))); TH.push(Math.atan2(at(sz, b) - at(sz, a), at(sx, b) - at(sx, a)));
    }
    for (let k = 1; k < N; k++) { while (TH[k] - TH[k - 1] > Math.PI) TH[k] -= 2 * Math.PI; while (TH[k] - TH[k - 1] < -Math.PI) TH[k] += 2 * Math.PI; }
    const TS = gauss(TH, Math.max(1, opt.turn * opt.fps));
    for (let k = 0; k < N; k++) {
      const u = U[k], f = opt.ahead * (1 - E[k]), ua = Math.min(n - 1, u + f / 6);
      AX.push(at(px, u) + Math.cos(TS[k]) * f); AY.push(at(sy, ua)); AZ.push(at(pz, u) + Math.sin(TS[k]) * f);
    }
    const sg = Math.max(1, opt.aim * opt.fps);
    // the repeated things (their bounding spheres in the world) for leaving out the far ones; the shadows first, drawn with all of them
    const reps = []; Bw.sc.traverse(o => { if (o.isInstancedMesh && o.visible) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const bs = o.geometry.boundingSphere; reps.push({ o, c: bs.center.clone().applyMatrix4(o.matrixWorld), r: bs.radius }); } });
    cam.position.set(pts[0].x, pts[0].y + opt.up, pts[0].z); cam.lookAt(pts[1].x, pts[1].y, pts[1].z); cam.updateMatrixWorld(); r.render(Bw.sc, cam);
    F = { Bw, pts, n, ribbon, dot, cam, sx, sz, sy, opt, box, places, reps, runF, endF, N, U, TH: TS, AX: gauss(AX, sg), AY: gauss(AY, sg), AZ: gauss(AZ, sg) };
    return { frames: N, n, fps: opt.fps, W: opt.W, H: opt.H, raceLen: Math.round(Bw.open ? T.raceLen : T.len) };
  }
  function flyFrame(k) {
    const { Bw, pts, n, ribbon, dot, cam, sx, sz, sy, opt, places, reps, runF, endF, U, TH, AX, AY, AZ } = F, r = getR(opt.W, opt.H);
    const u = U[k], i = Math.min(n - 2, Math.floor(u)), f = u - i, a = pts[i], b = pts[i + 1];
    const p = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f, d: a.d + (b.d - a.d) * f };
    ribbon.geometry.setDrawRange(0, i * 6);
    dot.position.set(p.x, p.y + 6, p.z); dot.scale.set(90, 90, 1);
    const lift = 1 + 0.6 * ease(Math.min(1, Math.max(0, (k - runF + 1) / endF))), c = Math.cos(TH[k]), s = Math.sin(TH[k]);
    cam.position.set(at(sx, u) - c * opt.back * lift, at(sy, u) + opt.up * lift, at(sz, u) - s * opt.back * lift); cam.lookAt(AX[k], AY[k], AZ[k]); cam.updateMatrixWorld();
    const far = opt.fogNear + opt.cull * (opt.fogFar - opt.fogNear); for (const q of reps) q.o.visible = q.c.distanceTo(cam.position) - q.r < far;
    r.setClearColor(0x000000, 1); r.render(Bw.sc, cam);
    const pr = (P) => { const v = new THREE.Vector3(P.x, P.y + 4, P.z).project(cam); return [Math.round((v.x + 1) / 2 * opt.W), Math.round((1 - v.y) / 2 * opt.H), v.z < 1 && Math.abs(v.x) < 1.4 && Math.abs(v.y) < 1.4 ? 1 : 0]; };
    return { jpg: CV.toDataURL('image/jpeg', 0.9), i, d: Math.round(p.d), s: pr(pts[0]), f: pr(pts[n - 1]), p: pr(p), q: places.map(q => pr(q.p)) };
  }
  return { build, aerial, top, block, run, flyInit, flyFrame };
})();
