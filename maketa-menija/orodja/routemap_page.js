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
    city:     { fog: 0xd8e3ea, sun: 0xffe5bd, sunI: 1.04, sky: 0xdcecff, gnd: 0x86785a, hemiI: 0.6 },
    monaco:   { fog: 0xcfe2f1, sun: 0xfff0d6, sunI: 1.08, sky: 0xd8ebff, gnd: 0x8a7c62, hemiI: 0.6 },
    nring:    { fog: 0xb7c7cc, sun: 0xfff0d8, sunI: 1.1, sky: 0xcadcf0, gnd: 0x3e4a2a, hemiI: 0.6, sunOff: [-80, 76, 70] },
    spa:      { fog: 0xc3ced7, sun: 0xfff1de, sunI: 0.98, sky: 0xd0dde9, gnd: 0x43522f, hemiI: 0.64 },
    rbring:   { fog: 0xc6daea, sun: 0xfff1d8, sunI: 1.12, sky: 0xcfe3fb, gnd: 0x46602c, hemiI: 0.6, sunOff: [-86, 78, 52] },
    suzuka:   { fog: 0xc8d9e6, sun: 0xfff1dc, sunI: 1.06, sky: 0xd5e7fa, gnd: 0x4f5c34, hemiI: 0.62 },
    // (the real roads and circuits added later: the game's own race lighting, render.js THEMES)
    medvode: { fog: 0xc9d7e3, sun: 0xfff0d8, sunI: 1.18, sky: 0xc6dcf4, gnd: 0x58653a, hemiI: 0.6, sunOff: [-80, 84, 58] },
    baldy: { fog: 0xcbd6df, sun: 0xfff0d4, sunI: 1.24, sky: 0xb4cff0, gnd: 0x5c5a3c, hemiI: 0.6, sunOff: [-78, 96, 50] },
    beartooth: { fog: 0xc6d7e8, sun: 0xfff1da, sunI: 1.26, sky: 0xb3cdf0, gnd: 0x4c5636, hemiI: 0.6, sunOff: [-84, 90, 58] },
    bigsur: { fog: 0xc8d6e2, sun: 0xfff0d8, sunI: 1.14, sky: 0xc6dcf2, gnd: 0x5c6040, hemiI: 0.62, sunOff: [-86, 74, 58] },
    maunakea: { fog: 0xcad9ec, sun: 0xfff6e8, sunI: 1.42, sky: 0x7aa6e8, gnd: 0x5a4a40, hemiI: 0.58, sunOff: [-62, 118, 44] },
    moki: { fog: 0xc9d6e6, sun: 0xffeccc, sunI: 1.3, sky: 0x8fb6ee, gnd: 0x8a5a3c, hemiI: 0.62, sunOff: [-86, 82, 46] },
    monterey: { fog: 0xd8dfe4, sun: 0xfff0d2, sunI: 1.24, sky: 0xc6dbf0, gnd: 0x84724e, hemiI: 0.64, sunOff: [-66, 74, 70] },
    mulholland: { fog: 0xd8d4c8, sun: 0xfff0d2, sunI: 1.4, sky: 0xb8d2f0, gnd: 0x7a6a48, hemiI: 0.62, sunOff: [-70, 104, 48] },
    palomar: { fog: 0xd4d8d6, sun: 0xfff0d4, sunI: 1.36, sky: 0xb4d0f2, gnd: 0x6e6444, hemiI: 0.62, sunOff: [-74, 98, 52] },
    riverside: { fog: 0xd9dfe3, sun: 0xffecc8, sunI: 1.3, sky: 0xc3d8f2, gnd: 0x8a7650, hemiI: 0.62, sunOff: [-70, 74, 78] },
    uncompahgre: { fog: 0xbfcfe0, sun: 0xfff0d8, sunI: 1.24, sky: 0xb8d0f0, gnd: 0x4c5236, hemiI: 0.6, sunOff: [-70, 92, 62] },
    iroha: { fog: 0xc9d6df, sun: 0xffecc8, sunI: 1.12, sky: 0xd0e0f0, gnd: 0x4c5a32, hemiI: 0.6, sunOff: [-80, 74, 60] },
    harju: { fog: 0xcdd5dc, sun: 0xffcf96, sunI: 1.65, sky: 0xbad0ee, gnd: 0x58553f, hemiI: 0.58, sunOff: [-100, 33, -8] },
    montreal: { fog: 0xc9d9e6, sun: 0xfff0d6, sunI: 1.16, sky: 0xcde1f6, gnd: 0x56603a, hemiI: 0.62, sunOff: [-82, 88, 60] },
    toronto: { fog: 0xc9d8e6, sun: 0xfff0d8, sunI: 1.14, sky: 0xc8ddf4, gnd: 0x5d6448, hemiI: 0.62, sunOff: [-60, 88, 70] },
    cpalace: { fog: 0xc9d3db, sun: 0xfff0d8, sunI: 1.08, sky: 0xcddcec, gnd: 0x4c5a32, hemiI: 0.62, sunOff: [-60, 74, 66] },
    greatalpine: { fog: 0xc4d2dc, sun: 0xfff0d4, sunI: 1.26, sky: 0xaecbec, gnd: 0x5a5638, hemiI: 0.62, sunOff: [-74, 92, -56] },
    hotham: { fog: 0xc4d4e4, sun: 0xfff2dc, sunI: 1.3, sky: 0xb2cdf0, gnd: 0x5a5e40, hemiI: 0.62, sunOff: [-64, 96, -58] },
    longford: { fog: 0xcbd8e2, sun: 0xffe9c6, sunI: 1.24, sky: 0xc2d8f0, gnd: 0x56603a, hemiI: 0.56, sunOff: [-70, 76, -66] },
    newcastle: { fog: 0xc8d9e6, sun: 0xfff1d6, sunI: 1.2, sky: 0xc4dbf4, gnd: 0x6b6a52, hemiI: 0.62, sunOff: [-58, 86, -66] },
    townsville: { fog: 0xcfdde8, sun: 0xfff2da, sunI: 1.34, sky: 0xb4d2f4, gnd: 0x6f6a48, hemiI: 0.64, sunOff: [-62, 96, -66] },
    chapman: { fog: 0xc9dbe8, sun: 0xfff0d6, sunI: 1.24, sky: 0xbcd6f4, gnd: 0x5e5a40, hemiI: 0.62, sunOff: [-92, 74, -40] },
    sani: { fog: 0xc8d6e4, sun: 0xfff0d8, sunI: 1.28, sky: 0xb8d0f0, gnd: 0x5e5a40, hemiI: 0.6, sunOff: [-70, 92, -58] },
    caracoles: { fog: 0xc2d3e8, sun: 0xfff3de, sunI: 1.32, sky: 0xb4cdf2, gnd: 0x6e5e4c, hemiI: 0.6, sunOff: [-72, 98, -62] },
    rastro: { fog: 0xc4d0d0, sun: 0xfff0d8, sunI: 1.1, sky: 0xc2d4e6, gnd: 0x4a5a32, hemiI: 0.66, sunOff: [-66, 92, -64] },
    rio: { fog: 0xd3dfe6, sun: 0xfff3dc, sunI: 1.3, sky: 0xbfd8f4, gnd: 0x5d6a3a, hemiI: 0.62, sunOff: [-30, 120, -40] },
    katu: { fog: 0xc9d5dd, sun: 0xfff0d4, sunI: 1.2, sky: 0xc9dcf3, gnd: 0x6b6040, hemiI: 0.58, sunOff: [96, 76, 18] },
    tianmen: { fog: 0xc9d2d4, sun: 0xfff0dc, sunI: 1.02, sky: 0xd4dfe6, gnd: 0x4a5636, hemiI: 0.68, sunOff: [-70, 92, 60] },
    bathurst: { fog: 0xcfdbe6, sun: 0xfff0d2, sunI: 1.22, sky: 0xc6dcf6, gnd: 0x6b6a3c, hemiI: 0.6, sunOff: [-74, 86, -56] },
  };
  const SEASONS = { vrsic: 'autumn' };
  const KEEP_SEA = new Set(['newcastle', 'detroit', 'bangsaen']);
  let B = null, R = null, CV = null;
  function build(id, opt) {
    if (B && B.id === id) return B;
    const def = Core.TRACKS.find(d => d.id === id), T = new Core.Track(def), sc = new THREE.Scene(), tex = Tex.all(1);
    const w = World.build(sc, T, tex, { density: 1, season: SEASONS[id] });   // (Vršič in its October colours, as the published maps show it; the others as built)
    sc.updateMatrixWorld(true);
    w.root.traverse(o => { if (o.isMesh || o.isInstancedMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // a world's far backdrop (the far hills, the sea or lake plane to the horizon: much wider than the track) is left out: the map's
    // land round the island is the made-up skirt (top) or the real land painted by wide_map.py (isle)
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < T.N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    const wide = Math.max(6000, 1.6 * Math.max(x1 - x0, z1 - z0) + 2000), hid = [], bb = new THREE.Box3(), sz = new THREE.Vector3();
    // (a city by the sea or a river whose ground goes on under the water as its bed: its flat water planes stay, wide_map.py takes its water out; opt.keepWide: a lake or
    // river whose plane is the water of the map itself, e.g. Toronto's lake by the circuit: kept (true: all of them; a list: those by name))
    const keepSea = KEEP_SEA.has(id), keep = o => (keepSea && bb.setFromObject(o).getSize(sz).y < 1) || (!!(opt && opt.keepWide) && (opt.keepWide === true || opt.keepWide.includes(o.name)));
    sc.traverse(o => { if (!(o.isMesh || o.isInstancedMesh) || !o.visible || keep(o)) return; bb.setFromObject(o).getSize(sz); if (Math.max(sz.x, sz.z) > wide) hid.push(o); });
    hid.forEach(o => { o.visible = false; }); if (hid.length) console.log('far backdrop left out: ' + hid.map(o => (o.name || o.type) + ' ' + Math.round(new THREE.Box3().setFromObject(o).getSize(sz).x)).join(', '));
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
    city: [[-0.2, 0x6f7a44], [1.2, 0x7d8450]], monaco: [[-0.2, 0x7a7a52], [0.8, 0x8a8666], [1.4, 0x9a9478]],
    nring: [[-0.2, 0x3e5a2a], [1.2, 0x4f6a32]], spa: [[-0.2, 0x44602e], [1.2, 0x52703a]], rbring: [[-0.2, 0x4f6c30], [0.8, 0x5b7a3a], [1.4, 0x6d7d58]], suzuka: [[-0.2, 0x55683a], [1.2, 0x62763f]],
  };
  function trackBounds(T) {   // (a world without its own bounds, e.g. a city: the track's own box)
    const b = { minX: 1e9, maxX: -1e9, minZ: 1e9, maxZ: -1e9 }; for (let i = 0; i < T.N; i++) { b.minX = Math.min(b.minX, T.px[i]); b.maxX = Math.max(b.maxX, T.px[i]); b.minZ = Math.min(b.minZ, T.pz[i]); b.maxZ = Math.max(b.maxZ, T.pz[i]); }
    return b;
  }
  function skirt(Bw, margin, cell) {
    if (Bw.skirt) return Bw.skirt;
    const b = Bw.w.bounds || trackBounds(Bw.T), g = Bw.w.groundH, x0 = b.minX - margin, z0 = b.minZ - margin, nx = Math.ceil((b.maxX - b.minX + 2 * margin) / cell), nz = Math.ceil((b.maxZ - b.minZ + 2 * margin) / cell);
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
    const amp = { vrsic: 620, pikes: 460, ouni: 30, mountain: 150, lake: 60, city: 20, monaco: 90, nring: 160, spa: 140, rbring: 260, suzuka: 60 }[Bw.def.theme] || 120;
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
    const Bw = build(id, opt), T = Bw.T, pts = run(T, Bw.open, opt.step), box = boxOf(pts, 120), A = axis(pts); if (opt.skirt !== false) skirt(Bw, 3000, 40);
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
    const Bw = build(id, opt), T = Bw.T, pts = run(T, Bw.open, opt.step), box = boxOf(pts, 60); if (opt.skirt !== false) skirt(Bw, 3000, 40);
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
    const Bw = build(id, opt), T = Bw.T, pts = run(T, Bw.open, opt.step), A = axis(pts), sk = skirt(Bw, 3000, 40);
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

  // (the flyover, the menu's track picture 1: drone_page.js flyInit / flyFrame, over the game's own world and the real land round it)
  return { build, aerial, top, block, run };
})();
