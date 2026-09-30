// Runs inside the game page (headless mockup capture only). Builds a track's real world with the game's own
// World.build, cuts it into a diorama and renders it on a copy of the showroom turntable.
window.DIO = (function () {
  const THEMES = {   // copied from render.js (race lighting per theme)
    lake:     { sun: 0xfff0d6, sunI: 0.98, sky: 0xd3e7ff, gnd: 0x5d6b35, hemiI: 0.62 },
    city:     { sun: 0xffe5bd, sunI: 1.04, sky: 0xdcecff, gnd: 0x86785a, hemiI: 0.6 },
    ljubljana: { sun: 0xffe6c2, sunI: 1.04, sky: 0xd8e9ff, gnd: 0x7a6e56, hemiI: 0.6 },
    monaco:   { sun: 0xfff0d6, sunI: 1.08, sky: 0xd8ebff, gnd: 0x8a7c62, hemiI: 0.6 },
    mountain: { sun: 0xfff2e0, sunI: 1.0, sky: 0xc8dcff, gnd: 0x4d5c33, hemiI: 0.6 },
    ouni:     { sun: 0xffe9c6, sunI: 1.18, sky: 0xcfe1f5, gnd: 0x4a5a2e, hemiI: 0.56 },
    pikes:    { sun: 0xfff4e4, sunI: 1.1, sky: 0xcfe0ff, gnd: 0x6b5847, hemiI: 0.6 },
    nring:    { sun: 0xfff0d8, sunI: 1.1, sky: 0xcadcf0, gnd: 0x3e4a2a, hemiI: 0.6 },
    spa:      { sun: 0xfff1de, sunI: 0.98, sky: 0xd0dde9, gnd: 0x43522f, hemiI: 0.64 },
    rbring:   { sun: 0xfff1d8, sunI: 1.12, sky: 0xcfe3fb, gnd: 0x46602c, hemiI: 0.6 },
    suzuka:   { sun: 0xfff1dc, sunI: 1.06, sky: 0xd5e7fa, gnd: 0x4f5c34, hemiI: 0.62 },
  };
  function buildWorld(id) {
    const def = Core.TRACKS.find(d => d.id === id);
    const T = new Core.Track(def);
    const sc = new THREE.Scene();
    const tex = Tex.all(1);
    const w = World.build(sc, T, tex, { density: 1 });
    return { def, T, sc, w, tex };
  }
  function probe(id) {
    const { T, sc, w } = buildWorld(id);
    sc.updateMatrixWorld(true);
    const out = { N: T.N, len: T.len, w: T.w, bounds: w.bounds, sceneKids: sc.children.length, list: [] };
    let hmin = 1e9, hmax = -1e9; for (let i = 0; i < T.N; i++) { hmin = Math.min(hmin, T.hy[i]); hmax = Math.max(hmax, T.hy[i]); }
    out.hy = [hmin, hmax];
    const box = new THREE.Box3();
    w.root.traverse(o => {
      if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
      const g = o.geometry; const n = g && g.attributes && g.attributes.position ? g.attributes.position.count : 0;
      if (g && !g.boundingBox) g.computeBoundingBox();
      box.copy(g.boundingBox).applyMatrix4(o.matrixWorld);
      const mats = (Array.isArray(o.material) ? o.material : [o.material]).map(m => m.type + (m.map ? '+map' : '') + (m.transparent ? '+tr' : '') + (m.onBeforeCompile && m.onBeforeCompile.toString().length > 30 ? '+obc' : ''));
      out.list.push([o.type + (o.isInstancedMesh ? '(' + o.count + ')' : ''), o.name || '', n, mats.join(','), [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z].map(v => Math.round(v)), o.visible, o.renderOrder || 0]);
    });
    out.gh = [[0, 0], [100, 100], [-200, 0], [0, 400], [500, 500]].map(([x, z]) => [x, z, +w.groundH(x, z).toFixed(2)]);
    return out;
  }

  /* ---- 2D helpers (x, z) ---- */
  function hull(P) {   // Andrew's monotone chain, CCW in (x, z)
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop(); return lo.concat(up);
  }
  function offsetHull(H, m, step) {   // Minkowski sum of a convex CCW polygon with a disc of radius m (arcs every `step` rad)
    const out = [], n = H.length;
    for (let i = 0; i < n; i++) {
      const a = H[(i - 1 + n) % n], b = H[i], c = H[(i + 1) % n];
      const n0 = Math.atan2(-(b[0] - a[0]), (b[1] - a[1])), n1 = Math.atan2(-(c[0] - b[0]), (c[1] - b[1]));   // outward normals (for CCW with this cross sign) — fixed below if inward
      let d = n1 - n0; while (d < 0) d += Math.PI * 2; while (d > Math.PI * 2) d -= Math.PI * 2;
      const k = Math.max(1, Math.ceil(d / step));
      for (let j = 0; j <= k; j++) { const t = n0 + d * j / k; out.push([b[0] + Math.cos(t) * m, b[1] + Math.sin(t) * m]); }
    }
    return out;
  }
  function reduce(P, maxTurn) {   // keep a vertex whenever the direction has turned by more than maxTurn since the last kept one
    const n = P.length, keep = [P[0]]; let last = Math.atan2(P[1][1] - P[0][1], P[1][0] - P[0][0]);
    for (let i = 1; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n], dir = Math.atan2(b[1] - a[1], b[0] - a[0]);
      let d = dir - last; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      if (Math.abs(d) >= maxTurn) { keep.push(a); last = dir; }
    }
    return keep;
  }
  function area(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }

  function vc(g, arr) { g.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3)); }

  /* ---- turntable (as render.js initShowroom), scaled by k, centred at c ---- */
  function turntable(k, cx, cy, cz) {
    const pos = [], col = [];
    const S = 48, push = (p, c) => { pos.push(cx + p[0] * k, cy + p[1] * k, cz + p[2] * k); col.push(c[0], c[1], c[2]); };
    const quad = (a, b, c, d, cl) => { push(a, cl); push(b, cl); push(c, cl); push(a, cl); push(c, cl); push(d, cl); };
    for (let i = 0; i < S; i++) {
      const a0 = i / S * Math.PI * 2, a1 = (i + 1) / S * Math.PI * 2;
      const C = (a, r, y) => [Math.cos(a) * r, y || 0, Math.sin(a) * r];
      const col0 = [0.16, 0.18, 0.22];
      // (triangles wound to face up: y-up, CCW seen from above => (x,z) order clockwise in math coords)
      quad([0, 0, 0], C(a1, 4.2), C(a0, 4.2), [0, 0, 0], col0);
      const rc = i % 2 ? [0.85, 0.16, 0.14] : [0.95, 0.95, 0.93];
      quad(C(a0, 4.2, 0.01), C(a1, 4.2, 0.01), C(a1, 4.8, 0.01), C(a0, 4.8, 0.01), rc);
      const oc = [0.09, 0.11, 0.14];
      quad(C(a0, 4.8), C(a1, 4.8), C(a1, 40), C(a0, 40), oc);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); vc(g, col); g.computeVertexNormals();
    // force normals up (winding of the copied quads may vary)
    const nrm = g.attributes.normal; for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
    return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  }

  /* ---- soil walls along the cut (water surface kept where the cut crosses a lake or river) ---- */
  function walls(poly, topInfo, yBase, seg, cols, waterCol) {
    const pos = [], col = [], nrm = [];
    const n = poly.length;
    let cxs = 0, czs = 0; for (const p of poly) { cxs += p[0]; czs += p[1]; } cxs /= n; czs /= n;
    const band = (t, x, z) => {   // t: 0 top .. 1 bottom
      const j = 0.035 * Math.sin(x * 0.07 + z * 0.05) + 0.03 * Math.sin(x * 0.19 - z * 0.13);
      const u = t + j;
      if (u < 0.1) return cols[0]; if (u < 0.55) return cols[1]; if (u < 0.8) return cols[2]; return cols[3];
    };
    const R = 10;
    const levels = (ti) => { const top = ti.top, wb = top - ti.water, L = [top, wb]; for (let r = 1; r <= R; r++) L.push(wb + (yBase - wb) * r / R); return L; };
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(L / seg));
      let nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; if (nx * (mx - cxs) + nz * (mz - czs) < 0) { nx = -nx; nz = -nz; }
      for (let j = 0; j < m; j++) {
        const t0 = j / m, t1 = (j + 1) / m;
        const x0 = a[0] + (b[0] - a[0]) * t0, z0 = a[1] + (b[1] - a[1]) * t0, x1 = a[0] + (b[0] - a[0]) * t1, z1 = a[1] + (b[1] - a[1]) * t1;
        const A = levels(topInfo(x0, z0)), Bv = levels(topInfo(x1, z1));
        for (let r = 0; r < A.length - 1; r++) {
          if (r === 0 && A[0] - A[1] < 0.01 && Bv[0] - Bv[1] < 0.01) continue;   // no water here
          const c = r === 0 ? waterCol : band((r - 0.5) / R, (x0 + x1) / 2, (z0 + z1) / 2);
          const P = [[x0, A[r], z0], [x1, Bv[r], z1], [x1, Bv[r + 1], z1], [x0, A[r], z0], [x1, Bv[r + 1], z1], [x0, A[r + 1], z0]];
          const e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], e2 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
          const fx = e1[1] * e2[2] - e1[2] * e2[1], fz = e1[0] * e2[1] - e1[1] * e2[0];
          const order = fx * nx + fz * nz < 0 ? [0, 2, 1, 3, 5, 4] : [0, 1, 2, 3, 4, 5];
          for (const q of order) { pos.push(...P[q]); col.push(...c); nrm.push(nx, 0, nz); }
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); vc(g, col); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
  }

  function blobTex(poly, cx, cz, R) {   // soft contact shadow of the footprint, on a square of side 2R centred at (cx, cz)
    const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const g = cv.getContext('2d'); g.clearRect(0, 0, N, N);
    g.filter = 'blur(' + Math.round(N * 0.025) + 'px)';
    g.fillStyle = 'rgba(0,0,0,0.85)'; g.beginPath();
    poly.forEach((p, i) => { const u = (p[0] - cx) / (2 * R) * N + N / 2, v = (p[1] - cz) / (2 * R) * N + N / 2; if (i) g.lineTo(u, v); else g.moveTo(u, v); });
    g.closePath(); g.fill();
    const t = new THREE.CanvasTexture(cv); return t;
  }

  let renderer = null, canvas = null;
  function getRenderer() {
    if (renderer) return renderer;
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2147483647;display:block;';
    document.body.appendChild(canvas);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    return renderer;
  }

  let built = null;
  function prepare(id, opt) {
    if (built && built.id === id && built.key === JSON.stringify([opt.margin, opt.extra, opt.soil, opt.crop])) return built;
    const B = buildWorld(id), { T, sc, w, def } = B;
    // 1. cut outline: convex hull of the centre line (+ extra anchor points), grown by the margin, reduced to few edges
    const pts = []; for (let i = 0; i < T.N; i += 2) pts.push([T.px[i], T.pz[i]]);
    (opt.extra || []).forEach(p => pts.push(p));
    { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const p of pts) { a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]); }
      const ext = Math.max(b - a, d - c) / 2; if (opt.marginK) opt.margin = Math.max(opt.margin, ext * opt.marginK); }
    let poly = offsetHull(hull(pts), opt.margin, Math.PI / 36);
    poly = reduce(poly, Math.PI * 2 / (opt.sides || 40));
    if (area(poly) < 0) poly.reverse();
    let cx = 0, cz = 0, mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9;
    for (const p of poly) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mnz = Math.min(mnz, p[1]); mxz = Math.max(mxz, p[1]); }
    cx = (mnx + mxx) / 2; cz = (mnz + mxz) / 2;
    let Rmax = 0; for (const p of poly) Rmax = Math.max(Rmax, Math.hypot(p[0] - cx, p[1] - cz));
    // 2. clipping planes (inward normals)
    const planes = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; if (nx * (cx - mx) + nz * (cz - mz) < 0) { nx = -nx; nz = -nz; }
      planes.push(new THREE.Plane(new THREE.Vector3(nx, 0, nz), -(nx * a[0] + nz * a[1])));
    }
    const setClip = (m) => { if (!m) return; m.clippingPlanes = planes; m.clipShadows = true; m.needsUpdate = true; };
    sc.updateMatrixWorld(true);
    const bb = new THREE.Box3(), inPoly = (x, z) => planes.every(p => p.normal.x * x + p.normal.z * z + p.constant >= -1);
    const drop = [];
    w.root.traverse(o => {
      if (!o.isMesh && !o.isPoints && !o.isLine) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(setClip);
      setClip(o.customDepthMaterial); setClip(o.customDistanceMaterial);
      o.castShadow = true; o.receiveShadow = true;
      if (!o.isInstancedMesh && o.geometry) {   // fully outside the cut: drop (saves render time)
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
        const cs = [[bb.min.x, bb.min.z], [bb.max.x, bb.min.z], [bb.min.x, bb.max.z], [bb.max.x, bb.max.z]];
        const pin = poly.some(p => p[0] >= bb.min.x && p[0] <= bb.max.x && p[1] >= bb.min.z && p[1] <= bb.max.z);
        if (bb.max.x - bb.min.x < 400 && !pin && !cs.some(c => inPoly(c[0], c[1])) && !inPoly((bb.min.x + bb.max.x) / 2, (bb.min.z + bb.max.z) / 2)) drop.push(o);
      }
    });
    drop.forEach(o => o.parent.remove(o));
    // 3. soil walls: top = ground, or the water surface where the cut crosses water
    const waters = [];
    w.root.traverse(o => { if (!o.isMesh || o.isInstancedMesh) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.transparent && /Phong|Standard|Physical/.test(m.type)) waters.push(o); });
    const rc = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
    const topInfo = (x, z) => {
      const g = w.groundH(x, z); let wy = -1e9;
      if (waters.length) { from.set(x, 900, z); rc.set(from, down); const hit = rc.intersectObjects(waters, false)[0]; if (hit) wy = hit.point.y; }
      return wy > g + 0.05 ? { top: wy + 0.05, water: wy + 0.05 - g - 0.25 } : { top: g + 0.25, water: 0 };
    };
    let minTop = 1e9; for (const p of poly) minTop = Math.min(minTop, topInfo(p[0], p[1]).top - topInfo(p[0], p[1]).water);
    if (opt.soilK) opt.soil = Math.max(opt.soil, Rmax * opt.soilK);
    const yBase = minTop - opt.soil;
    const cols = opt.soilCols || [[0.30, 0.22, 0.13], [0.56, 0.39, 0.24], [0.47, 0.32, 0.20], [0.36, 0.25, 0.17]];
    const wall = walls(poly, topInfo, yBase, 4, cols, opt.waterCol || [0.20, 0.45, 0.66]); wall.castShadow = false; wall.receiveShadow = true;
    sc.add(wall);
    if (opt.floor) {   // a flat ground over the whole cut, just under the lowest road point: fills what the game's corridor world leaves open
      let lo = 1e9; for (let i = 0; i < T.N; i++) lo = Math.min(lo, T.hy[i]);
      const fy = lo - (opt.floorDrop || 12), pos = [], col = [], fc = opt.floor;
      let mx = 0, mz = 0; for (const p of poly) { mx += p[0]; mz += p[1]; } mx /= poly.length; mz /= poly.length;
      for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; pos.push(mx, fy, mz, b[0], fy, b[1], a[0], fy, a[1]); for (let k = 0; k < 3; k++) col.push(fc[0], fc[1], fc[2]); }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); fg.computeVertexNormals();
      const fm = new THREE.Mesh(fg, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); fm.receiveShadow = true; sc.add(fm);
      // soil walls down from the floor at the rim, where the rim ground is lower than the floor
    }
    let maxH = -1e9; for (let i = 0; i < T.N; i++) maxH = Math.max(maxH, T.hy[i]);
    built = { id, soil: opt.soil, maxTop: maxH + 25, key: JSON.stringify([opt.margin, opt.extra, opt.soil, opt.crop]), B, poly, planes, cx, cz, Rmax, yBase, dropped: drop.length, waters: waters.length };
    return built;
  }

  function shot(id, opt) {
    opt = Object.assign({ margin: 45, sides: 40, soil: 16, rot: 0, fill: 4.0, cam: [2.2, 4.4, 19], look: [0, -2.6, 0], fov: 32, shadow: 4096, exposure: 1 }, opt || {});
    const r = getRenderer();
    const P = prepare(id, opt), { B, poly, cx, cz, Rmax, yBase } = P, { sc, def } = B;
    let k = Rmax / opt.fill;                            // world metres per showroom unit
    const rot = opt.rot, cr = Math.cos(rot), sr = Math.sin(rot);
    const toW = (v) => new THREE.Vector3(cx + (v[0] * cr + v[2] * sr) * k, yBase + v[1] * k, cz + (-v[0] * sr + v[2] * cr) * k);   // showroom -> world (rotated about the centre)
    const cam = new THREE.PerspectiveCamera(opt.fov, window.innerWidth / window.innerHeight, 0.5 * k, 200 * k);
    const shift = new THREE.Vector3();
    const place = () => { cam.near = 0.5 * k; cam.far = 200 * k; cam.updateProjectionMatrix(); cam.position.copy(toW(opt.cam)).add(shift); cam.lookAt(toW(opt.look).add(shift)); cam.updateMatrixWorld(); };
    const span = () => {   // projected extent of the diorama outline (at the wall top) in NDC
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9; const v = new THREE.Vector3();
      for (const p of poly) for (const y of [yBase, yBase + opt.soil + 4]) { v.set(p[0], y, p[1]).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      return { x0, x1, y0, y1 };
    };
    place();
    for (let it = 0; it < 5; it++) {
      if (opt.fitW) { const sp = span(); k *= (sp.x1 - sp.x0) / (2 * opt.fitW); shift.multiplyScalar(0); place(); }
      if (opt.centerX !== false) for (let j = 0; j < 3; j++) {   // slide the camera sideways so the diorama sits in the middle of the screen
        const sp = span(), off = (sp.x0 + sp.x1) / 2, right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
        const dist = cam.position.distanceTo(new THREE.Vector3(cx, yBase, cz)), halfW = dist * Math.tan(opt.fov * Math.PI / 360) * cam.aspect;
        shift.addScaledVector(right, off * halfW); place();
      }
    }
    const SP = span();
    // pass 1: turntable with the showroom lights
    const tsc = new THREE.Scene(); tsc.background = new THREE.Color(0x10151d);
    tsc.add(new THREE.HemisphereLight(0xdfe9ff, 0x303848, 0.75));
    const key = new THREE.DirectionalLight(0xfff2dd, 0.9); key.position.copy(toW([-6, 10, 7])); key.target.position.copy(toW([0, 0, 0])); tsc.add(key, key.target);
    const rim = new THREE.DirectionalLight(0x7fb8ff, 0.55); rim.position.copy(toW([6, 4, -8])); rim.target.position.copy(toW([0, 0, 0])); tsc.add(rim, rim.target);
    const tt = turntable(k, cx, yBase, cz); tt.rotation.y = 0; tsc.add(tt);
    // soft contact shadow of the diorama on the disc
    const R2 = Rmax * 1.25, blob = new THREE.Mesh(new THREE.PlaneGeometry(2 * R2, 2 * R2), new THREE.MeshBasicMaterial({ map: blobTex(poly, cx, cz, R2), transparent: true, opacity: opt.blob == null ? 0.75 : opt.blob, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(cx, yBase + 0.02 * k, cz); tsc.add(blob);
    // pass 2: the diorama with the track's race lighting
    const th = THEMES[def.theme] || THEMES.lake;
    const L = [];
    const hemi = new THREE.HemisphereLight(th.sky, th.gnd, th.hemiI * (opt.hemiMul || 1)); sc.add(hemi); L.push(hemi);
    const sun = new THREE.DirectionalLight(th.sun, th.sunI * (opt.sunMul || 1));
    const sd = opt.sunDir || [-6, 10, 7];
    sun.position.copy(toW(sd).sub(new THREE.Vector3(cx, yBase, cz)).normalize().multiplyScalar(Rmax * 2.2).add(new THREE.Vector3(cx, yBase, cz)));
    sun.target.position.set(cx, yBase, cz);
    sun.castShadow = true; sun.shadow.mapSize.set(opt.shadow, opt.shadow);
    const s = sun.shadow.camera; s.left = -Rmax * 1.08; s.right = Rmax * 1.08; s.top = Rmax * 1.08; s.bottom = -Rmax * 1.08; s.near = Rmax * 0.8; s.far = Rmax * 4;
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = opt.nb == null ? 0.15 : opt.nb;
    sc.add(sun, sun.target); L.push(sun, sun.target);
    r.autoClear = true; r.setClearColor(0x10151d, 1);
    r.render(tsc, cam);
    r.autoClear = false;
    r.clearDepth();   // the diorama always sits on top of the disc: draw it over (its own depth test inside)
    r.render(sc, cam);
    r.autoClear = true;
    L.forEach(l => sc.remove(l));
    return { span: [SP.x0, SP.x1, SP.y0, SP.y1].map(v => +(v).toFixed(3)), k: +k.toFixed(2), Rmax: +Rmax.toFixed(1), planes: poly.length, dropped: P.dropped, waters: P.waters, yBase: +yBase.toFixed(2), center: [+cx.toFixed(1), +cz.toFixed(1)] };
  }

  /* Exact showroom camera and turntable (as for the cars); the diorama floats above the disc, tilted towards the camera. */
  function shot2(id, opt) {
    opt = Object.assign({ margin: 45, sides: 40, soil: 24, rot: 0.4, tilt: 0.4, gap: 0.35, fitW: 0.86, fill: 2.4, cam: [2.2, 4.4, 19], look: [0, -2.6, 0], fov: 32, shadow: 4096 }, opt || {});
    const r = getRenderer();
    const P = prepare(id, opt), { B, poly, cx, cz, Rmax, yBase } = P, { sc, def } = B;
    let k = opt.k || Rmax / opt.fill, lift = 0, dx = opt.dx || 0;
    const cr = Math.cos(opt.rot), sr = Math.sin(opt.rot), ct = Math.cos(opt.tilt), st = Math.sin(opt.tilt);
    const ctp = Math.cos(opt.plate || 0), stp = Math.sin(opt.plate || 0);   // the whole turntable tilted towards the camera (about its centre)
    const rotP = (v) => [v[0], v[1] * ctp - v[2] * stp, v[1] * stp + v[2] * ctp];     // turntable frame -> showroom
    const unrotP = (v) => [v[0], v[1] * ctp + v[2] * stp, -v[1] * stp + v[2] * ctp];  // showroom -> turntable frame
    const d2w = (v) => new THREE.Vector3(cx + (v[0] * cr + v[2] * sr) * k, yBase + v[1] * k, cz + (-v[0] * sr + v[2] * cr) * k);   // diorama units -> world metres
    const w2d = (x, y, z) => { const dx = (x - cx) / k, dz = (z - cz) / k; return [dx * cr - dz * sr, (y - yBase) / k, dx * sr + dz * cr]; };
    const s2d = (v0) => { const v = unrotP(v0), y = v[1] - lift; return [v[0] - dx, y * ct + v[2] * st, -y * st + v[2] * ct]; };   // showroom -> turntable -> diorama: drop the lift (and the small sideways offset), tilt back
    const toW = (v) => d2w(s2d(v));
    const dirW = (v) => toW(v).sub(toW([0, 0, 0]));
    const cam = new THREE.PerspectiveCamera(opt.fov, window.innerWidth / window.innerHeight, 0.5, 200);
    const place = () => {
      let zmax = -1e9; for (const p of poly) zmax = Math.max(zmax, w2d(p[0], yBase, p[1])[2]);
      lift = opt.sit ? 0 : opt.gap + zmax * st;        // standing on the disc, or floating with the lowest (front) edge `gap` above it
      cam.near = 0.5 * k; cam.far = 200 * k; cam.updateProjectionMatrix();
      cam.position.copy(toW(opt.cam)); cam.up.copy(dirW([0, 1, 0]).normalize()); cam.lookAt(toW(opt.look)); cam.updateMatrixWorld();
    };
    const span = () => {
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9; const v = new THREE.Vector3();
      for (const p of poly) for (const y of [yBase, yBase + opt.soil + 6]) { v.set(p[0], y, p[1]).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      return { x0, x1, y0, y1 };
    };
    place();
    for (let it = 0; it < 6; it++) {
      if (opt.fitW && !opt.k) { const sp = span(); k *= (sp.x1 - sp.x0) / (2 * opt.fitW); place(); }
      if (opt.centerX !== false && opt.dx == null) {   // slide the diorama sideways on the disc (not the camera) so it sits in the middle of the screen
        const sp = span(), off = (sp.x0 + sp.x1) / 2 - (opt.cx || 0);
        const halfW = cam.position.distanceTo(new THREE.Vector3(cx, yBase, cz)) * Math.tan(opt.fov * Math.PI / 360) * cam.aspect;
        dx -= off * halfW / k; place();
      }
    }
    const SP = span();
    // pass 1: the showroom floor exactly as render.js builds it, with the showroom lights
    const tsc = new THREE.Scene(); tsc.background = new THREE.Color(0x10151d);
    const up = dirW([0, 1, 0]).normalize(), pUp = dirW(rotP([0, 1, 0])).normalize();
    const hs = new THREE.HemisphereLight(0xdfe9ff, 0x303848, 0.75); hs.position.copy(up); tsc.add(hs);
    const key = new THREE.DirectionalLight(0xfff2dd, 0.9); key.position.copy(toW([-6, 10, 7])); key.target.position.copy(toW([0, 0, 0])); tsc.add(key, key.target);
    const rim = new THREE.DirectionalLight(0x7fb8ff, 0.55); rim.position.copy(toW([6, 4, -8])); rim.target.position.copy(toW([0, 0, 0])); tsc.add(rim, rim.target);
    {
      const pos = [], col = [], nrm = [], S = 48;
      const push = (p, c) => { const w = toW(rotP(p)); pos.push(w.x, w.y, w.z); col.push(c[0], c[1], c[2]); nrm.push(pUp.x, pUp.y, pUp.z); };
      const quad = (a, b, c, d, cl) => { push(a, cl); push(b, cl); push(c, cl); push(a, cl); push(c, cl); push(d, cl); };
      const C = (a, rr, y) => [Math.cos(a) * rr, y || 0, Math.sin(a) * rr];
      for (let i = 0; i < S; i++) {
        const a0 = i / S * Math.PI * 2, a1 = (i + 1) / S * Math.PI * 2;
        quad([0, 0, 0], C(a1, 4.2), C(a0, 4.2), [0, 0, 0], [0.16, 0.18, 0.22]);   // (wound to face the camera: Lambert lights back faces with the flipped normal)
        const rc = i % 2 ? [0.85, 0.16, 0.14] : [0.95, 0.95, 0.93];
        quad(C(a0, 4.2, 0.01), C(a1, 4.2, 0.01), C(a1, 4.8, 0.01), C(a0, 4.8, 0.01), rc);
        quad(C(a0, 4.8), C(a1, 4.8), C(a1, 40), C(a0, 40), [0.09, 0.11, 0.14]);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); vc(g, col); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      tsc.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    }
    // soft shadow of the floating diorama on the disc (its footprint seen from above in the showroom)
    {
      const F = poly.map(p => { const d = w2d(p[0], yBase, p[1]); return [d[0] + dx, d[2] * ct]; });
      let R2 = 0; for (const f of F) R2 = Math.max(R2, Math.abs(f[0]), Math.abs(f[1])); R2 *= 1.45;
      const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const g2 = cv.getContext('2d');
      g2.filter = 'blur(' + Math.round(N * (opt.sit ? 0.018 : 0.03 + 0.03 * lift)) + 'px)'; g2.fillStyle = 'rgba(0,0,0,0.9)'; g2.beginPath();
      F.forEach((f, i) => { const u = (f[0] / R2 * 0.5 + 0.5) * N, v = (f[1] / R2 * 0.5 + 0.5) * N; if (i) g2.lineTo(u, v); else g2.moveTo(u, v); }); g2.closePath(); g2.fill();
      const t = new THREE.CanvasTexture(cv);
      const pos = [], uv = [], y = 0.02;
      const corner = (x, z) => { const w = toW(rotP([x, y, z])); pos.push(w.x, w.y, w.z); uv.push(x / R2 * 0.5 + 0.5, 1 - (z / R2 * 0.5 + 0.5)); };
      corner(-R2, -R2); corner(-R2, R2); corner(R2, R2); corner(-R2, -R2); corner(R2, R2); corner(R2, -R2);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      tsc.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: opt.blob == null ? 0.7 : opt.blob, depthWrite: false, side: THREE.DoubleSide })));
    }
    // pass 2: the diorama with its track's race lighting (sun fixed relative to the camera, as the showroom key light)
    const th = THEMES[def.theme] || THEMES.lake, L = [], ctr = new THREE.Vector3(cx, yBase, cz);
    const hemi = new THREE.HemisphereLight(th.sky, th.gnd, th.hemiI * (opt.hemiMul || 1)); hemi.position.copy(up); sc.add(hemi); L.push(hemi);
    const sun = new THREE.DirectionalLight(th.sun, th.sunI * (opt.sunMul || 1));
    sun.position.copy(dirW(opt.sunDir || [-6, 10, 7]).normalize().multiplyScalar(Rmax * 2.2).add(ctr)); sun.target.position.copy(ctr);
    sun.castShadow = true; sun.shadow.mapSize.set(opt.shadow, opt.shadow);
    const s = sun.shadow.camera; s.left = -Rmax * 1.08; s.right = Rmax * 1.08; s.top = Rmax * 1.08; s.bottom = -Rmax * 1.08; s.near = Rmax * 0.8; s.far = Rmax * 4; s.updateProjectionMatrix();
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = opt.nb == null ? 0.15 : opt.nb;
    sc.add(sun, sun.target); L.push(sun, sun.target);
    r.autoClear = true; r.setClearColor(0x10151d, 1);
    r.render(tsc, cam);
    r.autoClear = false; r.clearDepth(); r.render(sc, cam); r.autoClear = true;
    L.forEach(l => sc.remove(l));
    const px = (v) => { const q = v.clone().project(cam); return [Math.round((q.x + 1) / 2 * window.innerWidth), Math.round((1 - q.y) / 2 * window.innerHeight)]; };
    return { css: { top: Math.round((1 - SP.y1) / 2 * window.innerHeight), bottom: Math.round((1 - SP.y0) / 2 * window.innerHeight), left: Math.round((SP.x0 + 1) / 2 * window.innerWidth), right: Math.round((SP.x1 + 1) / 2 * window.innerWidth) },
      ringFront: px(toW(rotP([0, 0, 4.8]))), ringBack: px(toW(rotP([0, 0, -4.8]))), ringL: px(toW(rotP([-4.8, 0, 0]))), ringR: px(toW(rotP([4.8, 0, 0]))), ctr: px(toW([0, 0, 0])), k: +k.toFixed(3), lift: +lift.toFixed(2), dx: +dx.toFixed(4) };
  }

  /* Floating diorama on a transparent background (for a page that draws its own backdrop). Camera orbits the diorama. */
  let rendererA = null, canvasA = null;
  function shot3(id, opt) {
    opt = Object.assign({ margin: 45, sides: 40, soil: 24, rot: 0.25, el: 38, fov: 30, fitW: 0.97, W: 412, H: 440, drop: 0.55, shadowOpacity: 0.55, shadow: 4096, sunDir: [-6, 10, 7] }, opt || {});
    if (!rendererA) {
      canvasA = document.createElement('canvas');
      rendererA = new THREE.WebGLRenderer({ canvas: canvasA, antialias: true, alpha: true, preserveDrawingBuffer: true });
      rendererA.setPixelRatio(window.devicePixelRatio || 1);
      rendererA.shadowMap.enabled = true; rendererA.shadowMap.type = THREE.PCFSoftShadowMap; rendererA.localClippingEnabled = true;
    }
    const r = rendererA; r.setSize(opt.W, opt.H, false);
    const P = prepare(id, opt), { B, poly, cx, cz, Rmax, yBase } = P, { sc, def } = B;
    opt.soil = P.soil;
    const k = Rmax / 3, cr = Math.cos(opt.rot), sr = Math.sin(opt.rot);
    const d2w = (v) => new THREE.Vector3(cx + (v[0] * cr + v[2] * sr) * k, yBase + v[1] * k, cz + (-v[0] * sr + v[2] * cr) * k);
    const w2d = (x, y, z) => { const dx = (x - cx) / k, dz = (z - cz) / k; return [dx * cr - dz * sr, (y - yBase) / k, dx * sr + dz * cr]; };
    const e = opt.el * Math.PI / 180;
    const cam = new THREE.PerspectiveCamera(opt.fov, opt.W / opt.H, 0.1 * k, 400 * k);
    let D = 14, tx = 0, ty = 0.2, tz = 0;
    const place = () => { cam.near = 0.1 * k; cam.far = 400 * k; cam.updateProjectionMatrix(); cam.position.copy(d2w([tx, ty + D * Math.sin(e), tz + D * Math.cos(e)])); cam.up.set(0, 1, 0); cam.lookAt(d2w([tx, ty, tz])); cam.updateMatrixWorld(); };
    const span = () => { let x0 = 9, x1 = -9, y0 = 9, y1 = -9; const v = new THREE.Vector3();
      for (const p of poly) for (const y of [yBase - opt.drop * k, Math.max(yBase + opt.soil + 12, P.maxTop)]) { v.set(p[0], y, p[1]).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      return { x0, x1, y0, y1 }; };
    place();
    for (let it = 0; it < 10; it++) {
      let sp = span(); D *= Math.max((sp.x1 - sp.x0) / (2 * opt.fitW), (sp.y1 - sp.y0) / (2 * (opt.fitH || 0.9))); place();
      sp = span(); const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), upv = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
      const dist = cam.position.distanceTo(d2w([tx, ty, tz])), hh = dist * Math.tan(opt.fov * Math.PI / 360), hw = hh * cam.aspect;
      const mv = right.multiplyScalar(((sp.x0 + sp.x1) / 2) * hw / k).add(upv.multiplyScalar(((sp.y0 + sp.y1) / 2 - (opt.cy || 0)) * hh / k));
      const lm = w2d(cx + mv.x * k, yBase + mv.y * k, cz + mv.z * k); tx += lm[0]; ty += lm[1]; tz += lm[2]; place();
    }
    // drop shadow under the floating island
    const F = poly.map(p => { const d = w2d(p[0], yBase, p[1]); return [d[0], d[2]]; });
    let R2 = 0; for (const f of F) R2 = Math.max(R2, Math.abs(f[0]), Math.abs(f[1])); R2 *= 1.5;
    const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const g2 = cv.getContext('2d');
    g2.filter = 'blur(' + Math.round(N * 0.035) + 'px)'; g2.fillStyle = 'rgba(0,0,0,1)'; g2.beginPath();
    F.forEach((f, i) => { const u = (f[0] / R2 * 0.5 + 0.5) * N, v = (f[1] / R2 * 0.5 + 0.5) * N; if (i) g2.lineTo(u, v); else g2.moveTo(u, v); }); g2.closePath(); g2.fill();
    const pos = [], uv = [], yy = -opt.drop;
    const corner = (x, z) => { const w = d2w([x, yy, z]); pos.push(w.x, w.y, w.z); uv.push(x / R2 * 0.5 + 0.5, 1 - (z / R2 * 0.5 + 0.5)); };
    corner(-R2, -R2); corner(-R2, R2); corner(R2, R2); corner(-R2, -R2); corner(R2, R2); corner(R2, -R2);
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const blob = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: opt.shadowOpacity, depthWrite: false, side: THREE.DoubleSide }));
    blob.renderOrder = -1; sc.add(blob);
    // lights: the track's race lighting, sun fixed relative to the camera
    const th = THEMES[def.theme] || THEMES.lake, L = [blob], ctr = new THREE.Vector3(cx, yBase, cz);
    const camDir = (v) => { const m = new THREE.Matrix4().extractRotation(cam.matrixWorld); return new THREE.Vector3(v[0], v[1], v[2]).applyMatrix4(m); };
    const hemi = new THREE.HemisphereLight(th.sky, th.gnd, th.hemiI * (opt.hemiMul || 1)); sc.add(hemi); L.push(hemi);
    const sun = new THREE.DirectionalLight(th.sun, th.sunI * (opt.sunMul || 1));
    const sd = opt.sunWorld ? new THREE.Vector3(...opt.sunWorld) : d2w(opt.sunDir).sub(d2w([0, 0, 0]));
    sun.position.copy(sd.normalize().multiplyScalar(Rmax * 2.2).add(ctr)); sun.target.position.copy(ctr);
    sun.castShadow = true; sun.shadow.mapSize.set(opt.shadow, opt.shadow);
    const s = sun.shadow.camera; s.left = -Rmax * 1.08; s.right = Rmax * 1.08; s.top = Rmax * 1.08; s.bottom = -Rmax * 1.08; s.near = Rmax * 0.8; s.far = Rmax * 4; s.updateProjectionMatrix();
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = opt.nb == null ? 0.15 : opt.nb;
    sc.add(sun, sun.target); L.push(sun, sun.target);
    r.setClearColor(0x000000, 0); r.autoClear = true; r.render(sc, cam);
    L.forEach(l => sc.remove(l));
    const SP = span();
    return { png: canvasA.toDataURL('image/png'), css: { top: Math.round((1 - SP.y1) / 2 * opt.H), bottom: Math.round((1 - SP.y0) / 2 * opt.H), left: Math.round((SP.x0 + 1) / 2 * opt.W), right: Math.round((SP.x1 + 1) / 2 * opt.W) } };
  }
  return { buildWorld, probe, shot, shot2, shot3 };
})();
