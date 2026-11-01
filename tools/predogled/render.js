/* Track preview from the game's chase camera, phone held upright (js/render.js: D 46 m, pitch 0.98*(1-0.3) rad, fov 58, look-ahead 13 m,
   fog 1.35*D .. 5.5*D). Terrain from the terrarium elevation tiles, everything else from the OSM scene file (prep.py). */
(async function () {
  try {
  const q = new URLSearchParams(location.search), id = q.get('id');
  const WW = 720, HH = 1280;
  const sc = await (await fetch('scenes/' + id + '.json')).json();
  const cfg = sc.cfg, [lat0, lon0] = sc.origin;
  const KX = 111320 * Math.cos(lat0 * Math.PI / 180), KY = 110540;
  let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };
  const fbm = (x, y) => 0.55 * vnoise(x, y) + 0.3 * vnoise(x * 2.1, y * 2.1) + 0.15 * vnoise(x * 4.3, y * 4.3);

  /* ---- elevation ---- */
  const tiles = {};
  await Promise.all(sc.tiles.map(async ([z, x, y]) => {
    const img = new Image(); img.src = `tiles/${z}/${x}/${y}.png`; await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, 256, 256).data, e = new Float32Array(65536);
    for (let i = 0; i < 65536; i++) e[i] = d[i * 4] * 256 + d[i * 4 + 1] + d[i * 4 + 2] / 256 - 32768;
    tiles[x + ',' + y] = e;
  }));
  const NT = 2 ** 15;
  function demLL(lat, lon) {
    const gx = (lon + 180) / 360 * NT * 256, la = lat * Math.PI / 180, gy = (1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * NT * 256;
    const x0 = Math.floor(gx - 0.5), y0 = Math.floor(gy - 0.5), fx = gx - 0.5 - x0, fy = gy - 0.5 - y0;
    const px = (X, Y) => { const t = tiles[Math.floor(X / 256) + ',' + Math.floor(Y / 256)]; return t ? t[(Y & 255) * 256 + (X & 255)] : NaN; };
    const a = px(x0, y0), b = px(x0 + 1, y0), c = px(x0, y0 + 1), d = px(x0 + 1, y0 + 1);
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }
  const demXY = (x, y) => demLL(lat0 + y / KY, lon0 + x / KX);

  /* ---- grid ---- */
  const R = 420, ST = 3, n = Math.round(2 * R / ST) + 1;
  const gx = i => -R + i * ST, gy = j => R - j * ST;     // row 0 = north
  let raw = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const v = demXY(gx(i), gy(j)); raw[j * n + i] = isFinite(v) ? v : 0; }
  const blur = (a) => { const b = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { let s = 0, c = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const I = i + di, J = j + dj; if (I < 0 || J < 0 || I >= n || J >= n) continue; s += a[J * n + I]; c++; }
      b[j * n + i] = s / c; } return b; };
  const dem = blur(blur(raw));
  const sampleGrid = (a, x, y) => { const fi = (x + R) / ST, fj = (R - y) / ST; const i = Math.max(0, Math.min(n - 2, Math.floor(fi))), j = Math.max(0, Math.min(n - 2, Math.floor(fj)));
    const u = Math.min(1, Math.max(0, fi - i)), v = Math.min(1, Math.max(0, fj - j));
    return (a[j * n + i] * (1 - u) + a[j * n + i + 1] * u) * (1 - v) + (a[(j + 1) * n + i] * (1 - u) + a[(j + 1) * n + i + 1] * u) * v; };
  const inGrid = (x, y) => Math.abs(x) < R - 4 && Math.abs(y) < R - 4;

  /* ---- the track: resample 2.5 m, smooth, heights ---- */
  const hw = cfg.circuit ? 6.5 : 5.5;
  let tp = [];
  { const P = sc.track.pts, B = sc.track.br, U = sc.track.tu;
    for (let k = 0; k < P.length - 1; k++) { const a = P[k], b = P[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.round(L / 2.5));
      for (let s = 0; s < m; s++) tp.push({ x: a[0] + (b[0] - a[0]) * s / m, y: a[1] + (b[1] - a[1]) * s / m, br: B[k], tu: U[k] }); }
    tp.push({ x: P[P.length - 1][0], y: P[P.length - 1][1], br: B[B.length - 1], tu: U[U.length - 1] }); }
  for (let pass = 0; pass < 2; pass++) { const c = tp.map(p => ({ ...p }));
    for (let k = 3; k < tp.length - 3; k++) { let sx = 0, sy = 0; for (let d = -3; d <= 3; d++) { sx += c[k + d].x; sy += c[k + d].y; } tp[k].x = sx / 7; tp[k].y = sy / 7; } }
  // keep the part inside the grid around the car
  let ic = 0, best = 1e9; tp.forEach((p, k) => { const d = p.x * p.x + p.y * p.y; if (d < best) { best = d; ic = k; } });
  let k0 = ic, k1 = ic; while (k0 > 0 && inGrid(tp[k0 - 1].x, tp[k0 - 1].y) && Math.hypot(tp[k0 - 1].x, tp[k0 - 1].y) < R - 30) k0--;
  while (k1 < tp.length - 1 && inGrid(tp[k1 + 1].x, tp[k1 + 1].y) && Math.hypot(tp[k1 + 1].x, tp[k1 + 1].y) < R - 30) k1++;
  tp = tp.slice(k0, k1 + 1); ic -= k0;
  tp.forEach(p => { p.h = sampleGrid(dem, p.x, p.y); });
  const smoothH = (w, passes) => { for (let pass = 0; pass < passes; pass++) { const c = tp.map(p => p.h);
    for (let k = 0; k < tp.length; k++) { let s = 0, m = 0; for (let d = -w; d <= w; d++) { const K = k + d; if (K < 0 || K >= tp.length) continue; s += c[K]; m++; } tp[k].h = s / m; } } };
  smoothH(14, 2);
  // bridges and tunnels: straight between their ends
  for (const f of ['br', 'tu']) { let k = 0; while (k < tp.length) { if (!tp[k][f]) { k++; continue; } let e = k; while (e < tp.length && tp[e][f]) e++;
    const a = Math.max(0, k - 1), b = Math.min(tp.length - 1, e); for (let m = k; m < e; m++) { const t = (m - a) / Math.max(1, b - a); tp[m].h = tp[a].h * (1 - t) + tp[b].h * t; } k = e; } }
  smoothH(3, 1);
  for (let k = 0; k < tp.length; k++) { const a = tp[Math.max(0, k - 1)], b = tp[Math.min(tp.length - 1, k + 1)], L = Math.hypot(b.x - a.x, b.y - a.y) || 1; tp[k].dx = (b.x - a.x) / L; tp[k].dy = (b.y - a.y) / L; }

  // nearest track point for a position (hash of 16 m cells)
  const CH = 16, cell = new Map();
  tp.forEach((p, k) => { const key = Math.floor(p.x / CH) + ',' + Math.floor(p.y / CH); (cell.get(key) || cell.set(key, []).get(key)).push(k); });
  function nearTrack(x, y, rad) { const cx = Math.floor(x / CH), cy = Math.floor(y / CH), rr = Math.ceil(rad / CH); let bd = 1e9, bk = -1;
    for (let a = -rr; a <= rr; a++) for (let b = -rr; b <= rr; b++) { const l = cell.get((cx + a) + ',' + (cy + b)); if (!l) continue; for (const k of l) { const d = (tp[k].x - x) ** 2 + (tp[k].y - y) ** 2; if (d < bd) { bd = d; bk = k; } } }
    return bk < 0 ? null : { k: bk, d: Math.sqrt(bd) }; }

  // other roads, heights from the smoothed elevation
  const roads = sc.roads.map(r => { const pts = []; for (let k = 0; k < r.pts.length - 1; k++) { const a = r.pts[k], b = r.pts[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.round(L / 3));
      for (let s = 0; s < m; s++) pts.push({ x: a[0] + (b[0] - a[0]) * s / m, y: a[1] + (b[1] - a[1]) * s / m }); }
    const e = r.pts[r.pts.length - 1]; pts.push({ x: e[0], y: e[1] }); return { w: r.w, br: r.br, pts: pts.filter(p => inGrid(p.x, p.y)) }; }).filter(r => r.pts.length > 1);
  roads.forEach(r => r.pts.forEach(p => { p.h = sampleGrid(dem, p.x, p.y); }));
  const rcell = new Map(); roads.forEach((r, ri) => r.pts.forEach((p, k) => { const key = Math.floor(p.x / CH) + ',' + Math.floor(p.y / CH); (rcell.get(key) || rcell.set(key, []).get(key)).push([ri, k]); }));
  function nearRoad(x, y, rad) { const cx = Math.floor(x / CH), cy = Math.floor(y / CH), rr = Math.ceil(rad / CH); let bd = 1e9, bp = null;
    for (let a = -rr; a <= rr; a++) for (let b = -rr; b <= rr; b++) { const l = rcell.get((cx + a) + ',' + (cy + b)); if (!l) continue; for (const [ri, k] of l) { const p = roads[ri].pts[k], d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; bp = [ri, k]; } } }
    return bp ? { r: roads[bp[0]], p: roads[bp[0]].pts[bp[1]], d: Math.sqrt(bd) } : null; }

  /* ---- masks (canvas raster at grid resolution) ---- */
  function mask(draw) { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d');
    g.setTransform(1 / ST, 0, 0, -1 / ST, R / ST, R / ST); g.fillStyle = g.strokeStyle = '#fff'; g.lineCap = g.lineJoin = 'round'; draw(g);
    const d = g.getImageData(0, 0, n, n).data, m = new Uint8Array(n * n); for (let i = 0; i < n * n; i++) m[i] = d[i * 4 + 3]; return m; }
  const poly = (g, ring) => { g.beginPath(); ring.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); };
  const line = (g, pts, w) => { g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); };
  const mBeach = mask(g => sc.beach.forEach(r => poly(g, r)));
  const mFarm = mask(g => sc.farm.forEach(r => poly(g, r)));
  const mWood = mask(g => sc.wood.forEach(r => poly(g, r)));
  const mWaterP = mask(g => sc.water.forEach(r => poly(g, r)));
  const mMarina = mask(g => sc.marina.forEach(r => poly(g, r)));
  const mPiste = mask(g => { sc.pisteA.forEach(r => poly(g, r)); sc.pisteL.forEach(l => line(g, l, 34)); });
  const mCliff = mask(g => sc.cliff.forEach(l => line(g, l, 9)));
  const mUrban = mask(g => sc.bldg.forEach(b => { g.lineWidth = 14; g.beginPath(); b.ring.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke(); g.fill(); }));
  const mBld = mask(g => sc.bldg.forEach(b => poly(g, b.ring)));
  const mStream = mask(g => sc.stream.forEach(s => line(g, s.pts, s.w + 1)));
  const mSea = mask(g => (sc.coast || []).forEach(l => { for (let k = 0; k < l.length - 1; k++) { const a = l[k], b = l[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, rx = (b[1] - a[1]) / L * 160, ry = -(b[0] - a[0]) / L * 160;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(b[0] + rx, b[1] + ry); g.lineTo(a[0] + rx, a[1] + ry); g.closePath(); g.fill(); } }));

  /* ---- water level ---- */
  let lakeL = null;
  if (cfg.lake && sc.waterPts.length) { const hs = sc.waterPts.map(p => demXY(p[0], p[1])).filter(isFinite).sort((a, b) => a - b); lakeL = hs[Math.floor(hs.length * 0.12)]; }
  const water = new Uint8Array(n * n), wLevel = new Float32Array(n * n);
  for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) { const k = j * n + i; let mn = 1e9, mx = -1e9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const v = raw[(j + dj) * n + i + di]; mn = Math.min(mn, v); mx = Math.max(mx, v); }
    if (cfg.sea && (raw[k] < 0.6 || (mSea[k] > 128 && raw[k] < 12) || (mMarina[k] > 128 && raw[k] < 4))) { water[k] = 1; wLevel[k] = 0; }
    else if (lakeL !== null && Math.abs(dem[k] - lakeL) < 1.4 && mx - mn < 1.6) { water[k] = 1; wLevel[k] = lakeL; }
    else if (mWaterP[k] > 128) { water[k] = 1; wLevel[k] = lakeL !== null && Math.abs(dem[k] - lakeL) < 4 ? lakeL : mn - 0.2; } }

  /* ---- final heights: road corridors, water ---- */
  const hf = new Float32Array(n * n), dTrack = new Float32Array(n * n).fill(1e9), dRoad = new Float32Array(n * n).fill(1e9);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = j * n + i, x = gx(i), y = gy(j); let h = dem[k];
    if (water[k]) h = Math.min(h, wLevel[k] - 1.2);
    const nr = nearRoad(x, y, 20);
    if (nr) { dRoad[k] = nr.d; const rw = nr.r.w / 2, rh = nr.p.h - 0.08; if (nr.d < rw + 1) h = rh; else if (nr.d < rw + 7) { const t = (nr.d - rw - 1) / 6, s = t * t * (3 - 2 * t); h = rh + (h - rh) * s; } }
    const nt = nearTrack(x, y, 34);
    if (nt) { dTrack[k] = nt.d; const p = tp[nt.k], rh = p.h - 0.14;
      if (p.tu) { if (nt.d < hw + 1.2) h = rh; else if (nt.d < hw + 4) { const t = (nt.d - hw - 1.2) / 2.8; h = rh + (h - rh) * t; } }
      else if (p.br) { if (nt.d < hw + 1.5 && h > rh - 2) h = rh - 2; }
      else if (nt.d < hw + 1.8) h = rh;
      else if (nt.d < hw + 18) { const t = (nt.d - hw - 1.8) / 16.2, s = t * t * (3 - 2 * t); h = rh + (h - rh) * s; } }
    hf[k] = h; }
  const hAt = (x, y) => inGrid(x, y) ? sampleGrid(hf, x, y) : demXY(x, y);
  const slopeAt = (i, j) => { const I = Math.max(1, Math.min(n - 2, i)), J = Math.max(1, Math.min(n - 2, j));
    const sx = (hf[J * n + I + 1] - hf[J * n + I - 1]) / (2 * ST), sy = (hf[(J - 1) * n + I] - hf[(J + 1) * n + I]) / (2 * ST); return Math.hypot(sx, sy); };

  /* ---- palette ---- */
  const C = (h) => new THREE.Color(h);
  const GROUND = { desert: 0xb07a52, snow: 0x7d8a5a, steppe: 0x9c8a62, alpine: 0x7a8a4c, lava: 0x4c4744, karst: 0x8a7d58, jungle: 0x3f6a2c, tropic: 0x5d8a38,
    rainforest: 0x3f5f2e, coast: 0x5f7d3c, urban: 0xb3ad9c, grass: 0x6f9447, sierra: 0x948c5c };
  const cGround = C(GROUND[cfg.ground] || 0x6f8a4a), cRock = C(cfg.rock || (cfg.ground === 'lava' ? 0x3b3836 : 0x8a8278)), cSnow = C(0xe8edf3), cPiste = C(0xf7f9fc),
    cBeach = C(0xe6d8b2), cFarm = C(cfg.tea ? 0x4b7a2c : 0x8a9a52), cUrban = C(0xa49e90), cWoodFloor = C(0x3c5228), cShoulder = C(0x8c8576);
  const snowAt = (h, x, y) => { if (!cfg.snow || cfg.snow === 'none') return 0; if (cfg.snow === 'all') return 1;
    const e = +cfg.snow.split(':')[1]; return h + (fbm(x / 60, y / 60) - 0.5) * 80 > e ? 1 : 0; };

  /* ---- scene ---- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(WW, HH); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = C(cfg.fog); scene.fog = new THREE.Fog(cfg.fog, 62, 253);
  const V = (x, y, h) => new THREE.Vector3(x, h, -y);
  const lam = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });

  // terrain mesh
  { const g = new THREE.PlaneGeometry(2 * R, 2 * R, n - 1, n - 1); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = j * n + i, x = gx(i), y = gy(j), h = hf[k];
      pos.setXYZ(k, x, h, -y);
      const sl = slopeAt(i, j), nz = fbm(x / 23, y / 23), c = cGround.clone();
      if (mWood[k] > 100) c.lerp(cWoodFloor, 0.45);
      if (mFarm[k] > 100) c.copy(cFarm);
      if (mUrban[k] > 100 && !cfg.ski) c.lerp(cUrban, 0.7);
      if (mBeach[k] > 100) c.copy(cBeach);
      const rockT = Math.min(1, Math.max(0, (sl - 0.62) / 0.35)) + (mCliff[k] > 100 ? 0.8 : 0); if (rockT > 0) c.lerp(cRock, Math.min(1, rockT));
      let sn = snowAt(h, x, y) * (1 - Math.min(1, Math.max(0, (sl - 0.85) / 0.4)));
      if (cfg.ski && mPiste[k] > 100) sn = Math.max(sn, 1);
      if (sn > 0) c.lerp(mPiste[k] > 100 ? cPiste : cSnow, sn);
      if (dTrack[k] < hw + 2.6 || dRoad[k] < 4.5) c.lerp(cShoulder, 0.5);
      if (mStream[k] > 100 && !water[k]) c.lerp(C(0x4a6e78), 0.6);
      c.multiplyScalar(0.9 + 0.2 * nz);
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, lam(0xffffff, { vertexColors: true })); m.receiveShadow = true; scene.add(m); }

  // water
  { const P = [], I = []; let v = 0;
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) { const ks = [j * n + i, j * n + i + 1, (j + 1) * n + i, (j + 1) * n + i + 1]; if (!ks.some(k => water[k])) continue;
      const L = ks.filter(k => water[k]).map(k => wLevel[k]); const lv = Math.max(...L) + 0.05;
      P.push(gx(i), lv, -gy(j), gx(i + 1), lv, -gy(j), gx(i), lv, -gy(j + 1), gx(i + 1), lv, -gy(j + 1)); I.push(v, v + 2, v + 1, v + 1, v + 2, v + 3); v += 4; }
    if (v) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ color: cfg.sea ? 0x2c6a86 : 0x386a74, shininess: 80, specular: 0x667788, transparent: true, opacity: 0.94 })); m.receiveShadow = true; scene.add(m); } }

  // ribbons along a path (left/right offsets from the centre line)
  function ribbon(pts, off0, off1, lift, mat, every) {
    const P = [], I = []; let v = 0;
    for (let k = 0; k < pts.length; k++) { const p = pts[k], a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], L = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L;
      P.push(p.x + nx * off0, p.h + lift, -(p.y + ny * off0), p.x + nx * off1, p.h + lift, -(p.y + ny * off1));
      if (k && (!every || every(k))) I.push(v - 2, v, v - 1, v - 1, v, v + 1); v += 2; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); return m; }
  const asphalt = lam(cfg.road || (cfg.gravel ? 0x8a7c66 : 0x45474b), { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  roads.forEach(r => { const pts = r.pts.map(p => ({ x: p.x, y: p.y, h: hAt(p.x, p.y) + 0.02 })); ribbon(pts, -r.w / 2, r.w / 2, 0.06, lam(cfg.gravel ? 0x8a7c66 : 0x55575b, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); });
  ribbon(tp, -hw, hw, 0.1, asphalt);
  if (!cfg.gravel) {
    const white = lam(0xe8e8e2, { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    ribbon(tp, -hw + 0.3, -hw + 0.45, 0.12, white); ribbon(tp, hw - 0.45, hw - 0.3, 0.12, white);
    if (cfg.center !== 'none') ribbon(tp, -0.09, 0.09, 0.12, lam(cfg.center === 'yellow' ? 0xe0b02a : 0xe8e8e2, { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), k => (k % 5) < 2);
  }

  // instancing helper
  const dummy = new THREE.Object3D();
  function inst(geo, mat, list, shadow = true) { if (!list.length) return; const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((t, i) => { dummy.position.set(t.x, t.h, -t.y); dummy.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0); dummy.scale.set(t.sx || 1, t.sy || 1, t.sz || 1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
    m.castShadow = shadow; m.receiveShadow = true; scene.add(m); return m; }
  const box = (w, h, d, y0 = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, y0 + h / 2, 0); return g; };
  const yawOf = (dx, dy) => Math.atan2(dx, -dy);   // rotation about up for a local direction (x east, y north) -> three's -z forward

  // roadside, swept along the track as continuous strips: profile = [[offset, height], ...] across the road (offset >0: left of travel)
  function sweep(profile, mat, keep, shadow = true) {
    const P = [], I = [], m = profile.length; let v = 0, prev = false;
    for (let k = 0; k < tp.length; k++) { const p = tp[k], nx = -p.dy, ny = p.dx, on = keep(k);
      for (const [o, y] of profile) P.push(p.x + nx * o, p.h + y, -(p.y + ny * o));
      if (k && on && prev) for (let c = 0; c < m - 1; c++) { const a = v - m + c, b = v + c; I.push(a, b, a + 1, a + 1, b, b + 1); }
      prev = on; v += m; }
    if (!I.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
    const me = new THREE.Mesh(g, mat); me.castShadow = shadow; me.receiveShadow = true; scene.add(me); }
  const DS = { side: THREE.DoubleSide };
  const sideDrop = (k, sd) => { const p = tp[k]; return p.h - sampleGrid(dem, p.x - p.dy * sd * (hw + 6), p.y + p.dx * sd * (hw + 6)); };
  const uphill = (k) => { const p = tp[k]; return sampleGrid(dem, p.x - p.dy * (hw + 9), p.y + p.dx * (hw + 9)) > sampleGrid(dem, p.x + p.dy * (hw + 9), p.y - p.dx * (hw + 9)) ? 1 : -1; };
  const isTu = k => !!tp[k].tu, isBr = k => !!tp[k].br, open = k => !tp[k].tu && !tp[k].br;
  for (const sd of [-1, 1]) {
    const o = sd * (hw + 0.7);
    // tunnel: rock wall on the mountain side, a gallery wall with openings on the valley side (cfg.windows), a faded roof
    sweep([[o, 0], [o, 6.2]], lam(cfg.rock || 0x7a746c, DS), k => isTu(k) && (uphill(k) === sd || !cfg.windows));
    if (cfg.windows) { const gw = k => isTu(k) && uphill(k) !== sd; const wm = lam(0x948d84, DS);
      sweep([[o, 0], [o, 1.1]], wm, gw); sweep([[o, 4.6], [o, 6.2]], wm, gw); sweep([[o, 1.1], [o, 4.6]], wm, k => gw(k) && (k % 7) < 2); }
    // bridge parapets, street-circuit walls
    sweep([[o - sd * 0.15, 0], [o - sd * 0.15, 1.0], [o + sd * 0.15, 1.0], [o + sd * 0.15, 0]], lam(0xd2cfc8, DS), k => isBr(k) || (cfg.circuit === 'walls' && open(k)));
    if (cfg.circuit === 'walls') sweep([[o + sd * 0.1, 1.0], [o + sd * 0.1, 3.6]], lam(0x2a2e33, { ...DS, transparent: true, opacity: 0.35 }), open, false);
    // guard rails: where the ground falls away, or all round a circuit with armco
    sweep([[o, 0.5], [o, 0.82]], lam(0xc4c8cc, DS), k => open(k) && !cfg.gravel && cfg.circuit !== 'walls' && cfg.circuit !== 'bales' && (cfg.circuit === 'armco' || sideDrop(k, sd) > 2.5));
    // snow banks
    if (cfg.snowbanks) sweep([[sd * (hw + 0.4), -0.1], [sd * (hw + 1.4), 0.75], [sd * (hw + 2.6), -0.2]], lam(0xf3f6f9), k => open(k) && (cfg.snow === 'all' || snowAt(tp[k].h, tp[k].x, tp[k].y)), false);
  }
  sweep([[-hw - 1, 6.25], [hw + 1, 6.25]], lam(cfg.rock || 0x7a746c, { ...DS, transparent: true, opacity: 0.22 }), isTu, false);
  sweep([[-hw - 0.9, -1.5], [-hw - 0.9, 0.05], [hw + 0.9, 0.05], [hw + 0.9, -1.5]], lam(0xb3afa7, DS), isBr);
  { const posts = [], bales = [], piers = [];
    for (let k = 0; k < tp.length; k += 2) { const p = tp[k], nx = -p.dy, ny = p.dx, ry = yawOf(p.dx, p.dy);
      for (const sd of [-1, 1]) { const ox = p.x + nx * sd * (hw + 0.7), oy = p.y + ny * sd * (hw + 0.7);
        if (cfg.circuit === 'bales' && open(k) && k % 4 === 0) bales.push({ x: ox, y: oy, h: p.h, ry });
        else if (open(k) && k % 2 === 0 && !cfg.gravel && cfg.circuit !== 'walls' && cfg.circuit !== 'bales' && (cfg.circuit === 'armco' || sideDrop(k, sd) > 2.5)) posts.push({ x: ox, y: oy, h: p.h, ry }); }
      if (p.br && k % 12 === 0) { const g = sampleGrid(dem, p.x, p.y); if (p.h - g > 3) piers.push({ x: p.x, y: p.y, h: g - 2, ry, sy: p.h - g + 0.5 }); } }
    inst(box(0.14, 0.8, 0.14), lam(0x8d9196), posts); inst(box(0.6, 0.55, 1.3), lam(0xd6bf72), bales); inst(box(2.4, 1, 6), lam(0xb8b4ac), piers); }

  // buildings
  { const roofC = cfg.snow && cfg.snow !== 'none' && cfg.ski ? 0xf2f4f6 : cfg.roof, mats = [lam(roofC), lam(cfg.bld)];
    sc.bldg.forEach(b => { const ring = b.ring; if (ring.length < 4) return; let mn = 1e9, cx = 0, cy = 0;
      for (const p of ring) { if (!inGrid(p[0], p[1])) return; mn = Math.min(mn, hAt(p[0], p[1])); cx += p[0]; cy += p[1]; }
      cx /= ring.length; cy /= ring.length; if (nearTrack(cx, cy, 8) && nearTrack(cx, cy, 8).d < hw + 1) return;
      const sh = new THREE.Shape(ring.map(p => new THREE.Vector2(p[0], p[1]))); const h = Math.min(45, b.h || (cfg.ski ? 9 : 6) + 3 * hash(cx, cy));
      const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, mats); m.position.y = mn - 0.8; m.castShadow = m.receiveShadow = true; scene.add(m); }); }

  // lifts: pylons, cables, chairs or cabins, stations
  { const pyl = [], arms = [], chairs = [], hangers = [], cabins = [], stations = [], cable = [];
    const SPEC = { chair_lift: [55, 11, 2.3, 14, 'chair'], gondola: [85, 16, 3, 36, 'cabin'], cable_car: [180, 26, 3.5, 200, 'cabin'], mixed_lift: [70, 14, 2.6, 18, 'chair'],
      drag_lift: [36, 7, 0, 13, 'tbar'], 't-bar': [36, 7, 0, 13, 'tbar'], platter: [36, 7, 0, 13, 'tbar'], j_bar: [36, 7, 0, 13, 'tbar'], rope_tow: [30, 3, 0, 0, ''] };
    sc.lifts.forEach(L => { const sp = SPEC[L.type] || SPEC.chair_lift, [gap, ph, half, every, kind] = sp;
      const P = L.pts.map(p => ({ x: p[0], y: p[1] })); let tot = 0; const cum = [0]; for (let k = 1; k < P.length; k++) { tot += Math.hypot(P[k].x - P[k - 1].x, P[k].y - P[k - 1].y); cum.push(tot); }
      if (tot < 20) return;
      const at = (s) => { let k = 1; while (k < P.length - 1 && cum[k] < s) k++; const t = (s - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1); return { x: P[k - 1].x + (P[k].x - P[k - 1].x) * t, y: P[k - 1].y + (P[k].y - P[k - 1].y) * t }; };
      const dir = { x: P[P.length - 1].x - P[0].x, y: P[P.length - 1].y - P[0].y }, dl = Math.hypot(dir.x, dir.y) || 1; dir.x /= dl; dir.y /= dl; const nx = -dir.y, ny = dir.x, ry = yawOf(dir.x, dir.y);
      const sup = []; const np = Math.max(1, Math.round(tot / gap));
      for (let s = 0; s <= np; s++) { const q = at(tot * s / np), end = s === 0 || s === np; const gh = inGrid(q.x, q.y) ? hAt(q.x, q.y) : NaN; sup.push({ x: q.x, y: q.y, top: gh + (end ? ph * 0.55 : ph), end }); }
      sup.forEach(s => { if (!inGrid(s.x, s.y)) return; const g = hAt(s.x, s.y);
        if (s.end) stations.push({ x: s.x, y: s.y, h: g, ry, sx: kind === 'cabin' ? 1.4 : kind === 'tbar' ? 0.35 : 1, sy: kind === 'tbar' ? 0.4 : 1, sz: kind === 'cabin' ? 1.4 : kind === 'tbar' ? 0.35 : 1 });
        else { pyl.push({ x: s.x, y: s.y, h: g, sy: s.top - g }); if (half) arms.push({ x: s.x, y: s.y, h: s.top - 0.3, ry }); } });
      const rails = half ? [-half, half] : [0];
      for (const off of rails) for (let s = 0; s < sup.length - 1; s++) { const a = sup[s], b = sup[s + 1]; if (!isFinite(a.top) || !isFinite(b.top)) continue;
        cable.push(a.x + nx * off, a.top, -(a.y + ny * off), b.x + nx * off, b.top, -(b.y + ny * off));
        if (!every) continue; const seg = Math.hypot(b.x - a.x, b.y - a.y), m = Math.floor(seg / every);
        for (let c = 1; c <= m; c++) { const t = (c - 0.5 + 0.5 * hash(s, off)) / m, x = a.x + (b.x - a.x) * t + nx * off, y = a.y + (b.y - a.y) * t + ny * off, top = a.top + (b.top - a.top) * t;
          if (!inGrid(x, y)) continue;
          if (kind === 'chair') { hangers.push({ x, y, h: top - 2.6, sy: 2.6 }); chairs.push({ x, y, h: top - 3.0, ry }); }
          else if (kind === 'cabin') { hangers.push({ x, y, h: top - 1.4, sy: 1.4 }); cabins.push({ x, y, h: top - 3.8, ry }); }
          else if (kind === 'tbar') hangers.push({ x, y, h: top - 2.2, sy: 2.2 }); } }
    });
    inst(box(0.5, 1, 0.5), lam(0x5e6268), pyl); inst(box(0.4, 0.4, 6.4), lam(0x5e6268), arms.map(a => ({ ...a, ry: a.ry + Math.PI / 2 })));
    inst(box(0.06, 1, 0.06), lam(0x303030), hangers, false); inst(box(1.9, 0.55, 0.7), lam(0x2a3a5a), chairs); inst(box(2.0, 2.3, 2.2), lam(0xc8302c), cabins);
    inst(box(9, 6, 13), lam(0xa9a49a), stations);
    if (cable.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(cable, 3)); scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x1e1e1e }))); }
  }

  // vegetation
  { const tgt = tp[Math.min(tp.length - 1, ic + 5)], cover = { forest: 0.9, sparse: 0.22, patchy: 0.45, none: 0 }[cfg.cover] ?? 0.3;
    const list = []; const SPC = cfg.cover === 'forest' ? 6.5 : 8;
    for (let y = -R + 4; y < R - 4; y += SPC) for (let x = -R + 4; x < R - 4; x += SPC) {
      const X = x + (hash(x, y) - 0.5) * SPC * 0.9, Y = y + (hash(y, x) - 0.5) * SPC * 0.9; if (Math.hypot(X - tgt.x, Y - tgt.y) > 300) continue;
      const i = Math.round((X + R) / ST), j = Math.round((R - Y) / ST), k = j * n + i; if (i < 1 || j < 1 || i >= n - 1 || j >= n - 1) continue;
      if (water[k] || mBld[k] > 60 || mBeach[k] > 100 || (mPiste[k] > 100 && cfg.ski) || dTrack[k] < hw + 3.5 || dRoad[k] < 5 || slopeAt(i, j) > 1.25) continue;
      if (mFarm[k] > 100 && cfg.tea) continue;
      let p = mWood[k] > 100 ? 0.95 : cover; if (cfg.cover === 'patchy' || cfg.cover === 'sparse') p *= 0.4 + 1.2 * fbm(X / 70, Y / 70);
      if (mUrban[k] > 100) p *= 0.4; if (hash(X * 1.3, Y * 0.7) > p) continue;
      list.push({ x: X, y: Y, h: hAt(X, Y) - 0.3, s: 0.75 + 0.5 * hash(Y, X), r: hash(X, Y * 3) }); }
    const snowy = cfg.snow === 'all' || (cfg.snow && cfg.snow.startsWith('above'));
    const coneG = (h, r) => { const g = new THREE.ConeGeometry(r, h, 7); g.translate(0, h / 2 + 2, 0); return g; }, trunk = box(0.5, 2.2, 0.5);
    const ball = (r, y) => { const g = new THREE.IcosahedronGeometry(r, 1); g.translate(0, y, 0); return g; };
    const type = cfg.tree;
    const T1 = list.map(t => ({ x: t.x, y: t.y, h: t.h, sx: t.s, sy: t.s, sz: t.s, ry: t.r * 6 }));
    if (type === 'conifer' || type === 'spruce' || type === 'deodar' || type === 'mixed') {
      const con = type === 'mixed' ? T1.filter((_, i) => i % 5 < 3) : T1, dec = type === 'mixed' ? T1.filter((_, i) => i % 5 >= 3) : [];
      const H = type === 'spruce' ? 20 : type === 'deodar' ? 15 : 14, Rr = type === 'spruce' ? 2.3 : type === 'deodar' ? 3.6 : 2.8;
      inst(coneG(H, Rr), lam(type === 'deodar' ? 0x34502f : 0x2d4a33), con); inst(trunk, lam(0x4a3a2a), con);
      if (snowy) inst((() => { const g = new THREE.ConeGeometry(Rr * 0.62, H * 0.42, 7); g.translate(0, H * 0.79 + 2, 0); return g; })(), lam(0xeef2f6), con.filter(t => snowAt(t.h, t.x, t.y)));
      inst(ball(2.8, 6), lam(0x6d6458), dec); inst(box(0.4, 4, 0.4), lam(0x5a4a3a), dec);
    } else if (type === 'juniper' || type === 'shrub') {
      inst(ball(type === 'shrub' ? 1.3 : 2.0, 1.0), lam(type === 'shrub' ? 0x6c6a42 : 0x51683a), T1);
    } else if (type === 'pine') {
      inst((() => { const g = new THREE.SphereGeometry(4, 8, 5); g.scale(1, 0.45, 1); g.translate(0, 8, 0); return g; })(), lam(0x3c5a30), T1); inst(box(0.5, 7, 0.5), lam(0x5a4632), T1);
    } else {
      const greens = [0x3e6a2a, 0x4a7a30, 0x355f26, 0x56813a];
      greens.forEach((c, gi) => { const L = T1.filter((_, i) => i % 4 === gi); inst(ball(cfg.tree === 'decid' ? 3.6 : 4.2, 6.5), lam(c), L); inst(box(0.5, 5, 0.5), lam(0x4e3e2c), L); });
    }
    // tea hedges in rows on the farmland near the view
    if (cfg.tea) { const hed = []; for (let y = -R + 4; y < R - 4; y += 1.7) for (let x = -R + 4; x < R - 4; x += 5) {
        if (Math.hypot(x - tgt.x, y - tgt.y) > 210) continue; const i = Math.round((x + R) / ST), j = Math.round((R - y) / ST), k = j * n + i;
        if (i < 1 || j < 1 || i >= n - 1 || j >= n - 1 || mFarm[k] < 120 || mBld[k] > 60 || dTrack[k] < hw + 2 || dRoad[k] < 4) continue;
        hed.push({ x, y, h: hAt(x, y) - 0.1, ry: Math.PI / 2 }); }
      inst((() => { const g = new THREE.BoxGeometry(1.1, 0.9, 4.6); g.translate(0, 0.45, 0); return g; })(), lam(0x3f7a26), hed); }
  }

  // skiers on the pistes, animals by the road, boats in the marina, waterfalls
  { const tgt = tp[Math.min(tp.length - 1, ic + 5)];
    if (cfg.ski) { const sk = []; let tries = 0; while (sk.length < 60 && tries++ < 6000) { const x = tgt.x + (rnd() - 0.5) * 300, y = tgt.y + (rnd() - 0.5) * 300;
        const i = Math.round((x + R) / ST), j = Math.round((R - y) / ST), k = j * n + i; if (i < 1 || j < 1 || i >= n - 1 || j >= n - 1 || mPiste[k] < 150 || dTrack[k] < hw + 4) continue;
        sk.push({ x, y, h: hAt(x, y), ry: rnd() * 6 }); }
      const cols = [0xd8342c, 0x2a62c8, 0xf0b020, 0x23a05a, 0x7a2ac8]; cols.forEach((c, ci) => inst(box(0.6, 1.75, 0.45), lam(c), sk.filter((_, i) => i % cols.length === ci))); }
    if (cfg.animals) { const an = []; for (let s = 0; s < 14; s++) { const k = Math.min(tp.length - 1, ic + 8 + Math.floor(rnd() * 26)), p = tp[k], sd = rnd() < 0.5 ? -1 : 1, off = hw + 3 + rnd() * 14;
        an.push({ x: p.x - p.dy * sd * off + (rnd() - 0.5) * 6, y: p.y + p.dx * sd * off + (rnd() - 0.5) * 6, h: 0, ry: rnd() * 6 }); }
      an.forEach(a => a.h = hAt(a.x, a.y)); const S = { goat: [1.1, 0.8, 0.45, 0xe6e0d4], cow: [2.1, 1.4, 0.8, 0x7a4e30], monkey: [0.6, 0.55, 0.4, 0x7d6e5c], coati: [0.8, 0.35, 0.3, 0x8a5a34] }[cfg.animals];
      if (S) inst(box(S[2], S[1], S[0]), lam(S[3]), an); }
    if (cfg.boats && sc.marina.length) { const bo = []; for (let y = -R + 4; y < R - 4; y += 7) for (let x = -R + 4; x < R - 4; x += 4.5) {
        const i = Math.round((x + R) / ST), j = Math.round((R - y) / ST), k = j * n + i; if (i < 1 || j < 1 || i >= n - 1 || j >= n - 1 || mMarina[k] < 120 || !water[k] || hash(x, y) < 0.35) continue;
        bo.push({ x, y, h: wLevel[k] - 0.2, ry: 0.05 * (hash(y, x) - 0.5) }); }
      inst(box(2.6, 1.0, 8.5), lam(0xf4f4f2), bo); inst(box(1.7, 0.9, 3.2, 1.0), lam(0x2c3e56), bo); }
    if (cfg.falls) { const fa = []; const cross = [];
      sc.stream.forEach(s => s.pts.forEach(p => { const nt = nearTrack(p[0], p[1], 12); if (nt && nt.d < hw + 2) cross.push(nt.k); }));
      sc.falls.forEach(p => { const nt = nearTrack(p[0], p[1], 40); if (nt) cross.push(nt.k); });
      [...new Set(cross)].filter(k => Math.abs(k - ic) < 70).forEach(k => { const p = tp[k], nx = -p.dy, ny = p.dx; const up = sampleGrid(dem, p.x + nx * 12, p.y + ny * 12) > sampleGrid(dem, p.x - nx * 12, p.y - ny * 12) ? 1 : -1;
        const x = p.x + nx * up * (hw + 3.5), y = p.y + ny * up * (hw + 3.5); fa.push({ x, y, h: hAt(x, y) - 0.5, ry: yawOf(p.dx, p.dy) }); });
      inst(box(0.6, 14, 3.4), lam(0xeaf2f6, { transparent: true, opacity: 0.85 }), fa, false); inst(box(4.2, 0.3, 4.4), lam(0xdfeef4, { transparent: true, opacity: 0.8 }), fa, false); }
  }

  // the player's car
  const cp = tp[ic], yaw = yawOf(cp.dx, cp.dy);
  { const car = new THREE.Group(); const body = new THREE.Mesh(box(1.95, 0.62, 4.5, 0.28), lam(0xd3202a)); const cab = new THREE.Mesh(box(1.6, 0.55, 2.1, 0.9), lam(0x1f2630));
    cab.position.z = 0.25; const wing = new THREE.Mesh(box(1.9, 0.12, 0.45, 1.15), lam(0x1a1a1a)); wing.position.z = 2.0;
    car.add(body, cab, wing); for (const [x, z] of [[-0.95, -1.45], [0.95, -1.45], [-0.95, 1.45], [0.95, 1.45]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 12), lam(0x111111)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z); car.add(w); }
    car.traverse(o => { o.castShadow = true; }); car.position.set(cp.x - cp.dy * (cfg.left ? -2.2 : 2.2) * 0, cp.h + 0.12, -cp.y); car.rotation.y = yaw + Math.PI; scene.add(car); }

  // camera: as the game's chase camera held upright
  const D = 46, pitch = 0.98 * (1 - 0.3), a0 = 13, fwd = { x: cp.dx, y: cp.dy };
  const tx = cp.x + fwd.x * a0, ty = cp.y + fwd.y * a0, th = cp.h;
  let px = tx - fwd.x * D * Math.cos(pitch), py = ty - fwd.y * D * Math.cos(pitch), ph = th + D * Math.sin(pitch);
  ph = Math.max(ph, hAt(px, py) + 4);
  const camera = new THREE.PerspectiveCamera(58, WW / HH, 0.5, 700); camera.position.set(px, ph, -py); camera.lookAt(tx, th, -ty);
  // light
  scene.add(new THREE.HemisphereLight(0xdfe8f2, 0x6b6250, 0.62));
  const sun = new THREE.DirectionalLight(0xfff2de, 0.9), az = Math.atan2(fwd.x, fwd.y) + 2.4;
  sun.position.set(tx + Math.sin(az) * 160, th + 190, -(ty + Math.cos(az) * 160)); sun.target.position.set(tx, th, -ty); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 600 }); sun.shadow.bias = -0.0008;
  renderer.render(scene, camera);
  window.__info = { lakeL, trackLen: tp.length * 2.5, car: [cp.x, cp.y, cp.h], cam: [px, py, ph] };
  window.__done = true;
  } catch (e) { window.__err = String(e && e.stack || e); }
})();
