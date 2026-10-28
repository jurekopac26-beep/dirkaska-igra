(() => {
  // (pictures only) the user, drawing on the north strip: "kmetija vse kar je v rdecem" (the farm: all that is in red, the land north and east of the
  // ring road's bend by the sea), "hisa" (the house, by the north edge), a light blue line "makadamska cesta" along the north edge, and the run-off's
  // sand by the junction crossed out. Then, on the fields' picture, the land west of the fields circled: "Naj kmetija se tukaj ima poljedelstvo"
  // (fields there too), and on the pastures' picture: "Dodaj se zivali kmetiji" (animals too). So fields in all three, the animals in three places
  // (window.__FNE(k), k 0..2; -1 as before):
  //  0 by the sea: cows, horses and sheep fenced south of the jetty's way, by the beach; fields west of the yard and north of the way
  //  1 by the yard: cows, horses and a pond, sheep apart, north of the way next to the yard; fields west of the yard and by the beach
  //  2 across the road: a long pasture north of the gravel road (cows, horses, sheep, a stable); fields everywhere south of it
  // In all three: the yard (house, barn, open shed, two silos, hay, a tractor), the gravel road along the north edge (from the jetty west to the farm
  // road's mouth), the crossed-out sand gone (grass under it), the circled land in fields.
  const H = window.__H3, sc = Render.scene, TX = Tex.all(), out = {};
  if (Render.setDetailDist) Render.setDetailDist(1e5); if (Render.world && Render.world.cullFog) for (const c of Render.world.cullFog) c.visible = true; sc.updateMatrixWorld(true);
  if (window.__FNE) window.__FNE(-1); if (window.__FNEROOT) sc.remove(window.__FNEROOT);
  const ROOT = new THREE.Group(); ROOT.name = 'farmne'; ROOT.userData.keep = true; sc.add(ROOT); window.__FNEROOT = ROOT;
  const VG = [0, 1, 2].map(() => { const g = new THREE.Group(); g.userData.keep = true; ROOT.add(g); return g; }), CG = new THREE.Group(); CG.userData.keep = true; ROOT.add(CG);
  const matOf = (o) => Array.isArray(o.material) ? o.material[0] : o.material, V3 = new THREE.Vector3(), M0 = new THREE.Matrix4(), gy = (x, z) => H.ground ? H.ground(x, z) : 0;
  const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let seed = 7; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // ---- what stands: quads in vertex colours (a triangle: its last corner twice), turned out the way given; one mesh per version
  const C3 = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  const fix = (q, o) => { const [a, b, c] = q, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], d = (uy * vz - uz * vy) * o[0] + (uz * vx - ux * vz) * o[1] + (ux * vy - uy * vx) * o[2]; return d >= 0 ? q : q[2] === q[3] ? [a, c, b, b] : [a, q[3], c, b]; };
  const FR = (x, z, nx, nz, y) => (p) => [x + p[0] * nx - p[2] * nz, y + p[1], z + p[0] * nz + p[2] * nx];
  const boxQuads = (x0, x1, y0, y1, z0, z1) => [[[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]]];
  const ICO = (() => { let g = new THREE.IcosahedronGeometry(1, 0); if (g.index) g = g.toNonIndexed(); const p = g.attributes.position, T3 = []; for (let k = 0; k < p.count; k += 3) T3.push([0, 1, 2].map(m => [p.getX(k + m), p.getY(k + m), p.getZ(k + m)])); return T3; })();
  const builder = () => { const QS = [], QC = [];
    const put = (fr, quads, c) => { const cc = Array.isArray(c) ? c : C3(c); for (const q of quads) { QS.push(q.map(fr)); QC.push(cc); } };
    const box = (fr, x0, x1, y0, y1, z0, z1, c) => put(fr, boxQuads(x0, x1, y0, y1, z0, z1), c);
    const gableB = (fr, cx, cz, D, L, Hh, h, cW, cR, o = 0.45) => { box(fr, cx - D / 2, cx + D / 2, -0.3, Hh, cz - L / 2, cz + L / 2, cW); const e = o * h / (D / 2), dk = C3(cR).map(v => v * 0.55);
      for (const s of [-1, 1]) { const zz = cz + s * L / 2; put(fr, [fix([[cx - D / 2, Hh, zz], [cx + D / 2, Hh, zz], [cx, Hh + h, zz], [cx, Hh + h, zz]], [0, 0, s])], cW);
        const q = [[cx + s * (D / 2 + o), Hh - e, cz - L / 2 - o], [cx + s * (D / 2 + o), Hh - e, cz + L / 2 + o], [cx, Hh + h, cz + L / 2 + o], [cx, Hh + h, cz - L / 2 - o]]; put(fr, [fix(q, [s, 1, 0])], cR); put(fr, [fix(q.map(([x, y, z]) => [x, y - 0.12, z]), [-s, -1, 0])], dk); } };
    const cylY = (fr, cx, cz, r, y0, y1, c, cap, capH, seg = 12) => { for (let k = 0; k < seg; k++) { const b0 = k / seg * 6.2832, b1 = (k + 1) / seg * 6.2832, bm = (b0 + b1) / 2, x0 = cx + Math.cos(b0) * r, z0 = cz + Math.sin(b0) * r, x1 = cx + Math.cos(b1) * r, z1 = cz + Math.sin(b1) * r;
      put(fr, [fix([[x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0]], [Math.cos(bm), 0, Math.sin(bm)])], c); put(fr, [fix([[x0, y1, z0], [x1, y1, z1], [cx, y1 + capH, cz], [cx, y1 + capH, cz]], [Math.cos(bm), 1, Math.sin(bm)])], cap); } };
    const cylZ = (fr, cx, cy, cz, r, len, c, cE, seg = 10) => { const zA = cz - len / 2, zB = cz + len / 2; for (let k = 0; k < seg; k++) { const b0 = k / seg * 6.2832, b1 = (k + 1) / seg * 6.2832, bm = (b0 + b1) / 2, x0 = cx + Math.cos(b0) * r, y0 = cy + Math.sin(b0) * r, x1 = cx + Math.cos(b1) * r, y1 = cy + Math.sin(b1) * r;
      put(fr, [fix([[x0, y0, zA], [x1, y1, zA], [x1, y1, zB], [x0, y0, zB]], [Math.cos(bm), Math.sin(bm), 0])], c); for (const [zz, s] of [[zA, -1], [zB, 1]]) put(fr, [fix([[cx, cy, zz], [x0, y0, zz], [x1, y1, zz], [x1, y1, zz]], [0, 0, s])], cE); } };
    const tree = (x, z, r, th, c) => { const fr = FR(x, z, 1, 0, gy(x, z) - 0.1); box(fr, -0.2, 0.2, 0, th + r * 0.4, -0.2, 0.2, 0x5a4030); const cc = C3(c), ry = rnd() * 6.28, cs = Math.cos(ry), sn = Math.sin(ry);
      for (const t3 of ICO) { const q = t3.map(([a, b, d]) => [(a * cs - d * sn) * r, th + r * 0.75 + b * r * 0.85, (a * sn + d * cs) * r]); put(fr, [[q[0], q[1], q[2], q[2]]], cc.map(v => v * (0.9 + rnd() * 0.18))); } };
    const mesh = (parent) => { if (!QS.length) return null; const pos = [], col = []; for (let k = 0; k < QS.length; k++) { const q = QS[k], c = QC[k], tris = q[2] === q[3] ? [[0, 1, 2]] : [[0, 1, 2], [0, 2, 3]]; for (const t of tris) for (const i of t) { pos.push(q[i][0], q[i][1], q[i][2]); col.push(c[0], c[1], c[2]); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; m.receiveShadow = true; m.userData.keep = true; parent.add(m); return m; };
    return { put, box, gableB, cylY, cylZ, tree, mesh, QS }; };
  // ---- flat things on the ground: the gravel road and the yard in the ways' own makadam (its material, uv x/6 z/6), fields in rows
  let wayM = null, wayC = [0.86, 0.78, 0.66]; sc.traverse(o => { if (wayM || !o.isMesh || o.isInstancedMesh) return; const m = matOf(o), g = o.geometry; if (!m || m.transparent || !m.map || !TX.makadam || m.map.image !== TX.makadam.image || !g.attributes.color) return; const P = g.attributes.position; for (let i = 0; i < P.count; i += 7) { V3.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (Math.abs(V3.x - 48) < 3 && V3.z > -362 && V3.z < -335) { wayM = m; const C = g.attributes.color; wayC = [C.getX(i), C.getY(i), C.getZ(i)]; return; } } });
  out.way = [!!wayM, wayC.map(v => +v.toFixed(2))];
  const ribbon = (pts, hw, y, mat, edge, parent) => { const cv = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'), L = cv.getLength(), n = Math.max(4, Math.ceil(L / 1.5)), pos = [], col = [], uv = [], idx = [];
    const E = edge ? [-hw - 2.2, -hw, hw, hw + 2.2] : [-hw, hw];
    for (let i = 0; i <= n; i++) { const p = cv.getPointAt(i / n), t = cv.getTangentAt(i / n), nx = -t.z, nz = t.x; for (const e of E) { const x = p.x + nx * e, z = p.z + nz * e; pos.push(x, gy(x, z) + y + (Math.abs(e) > hw ? -0.005 : 0), z); uv.push(x / 6, z / 6); const a = Math.abs(e) > hw ? 0 : 1; col.push(wayC[0], wayC[1], wayC[2], a); } }
    const k = E.length; for (let i = 0; i < n; i++) for (let j = 0; j < k - 1; j++) { const a = i * k + j, b = a + k; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx); g.computeVertexNormals();
    const I = g.index; for (let t = 0; t < I.count; t += 3) { const a = I.getX(t), b = I.getX(t + 1), c = I.getX(t + 2), ny = (pos[b * 3 + 2] - pos[a * 3 + 2]) * (pos[c * 3] - pos[a * 3]) - (pos[b * 3] - pos[a * 3]) * (pos[c * 3 + 2] - pos[a * 3 + 2]); if (ny < 0) { I.setX(t + 1, c); I.setX(t + 2, b); } } g.computeVertexNormals();
    const me = new THREE.Mesh(g, mat); me.receiveShadow = true; me.userData.keep = true; parent.add(me); return me; };
  const wayMat = (() => { const m = wayM ? wayM.clone() : new THREE.MeshPhongMaterial({ map: TX.makadam, shininess: 4 }); m.vertexColors = true; m.transparent = true; m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; return m; })();
  // the gravel road along the north edge: from the jetty's way (its end by the jetty) west, past the yard, to the farm road's mouth by the ring road
  const ROAD = [[51, -371], [38, -377], [10, -378], [-30, -377], [-70, -373], [-110, -369], [-145, -367], [-179, -367]];
  ribbon(ROAD, 3.6, 0.05, wayMat, true, CG); out.road = ROAD.length;
  // the yard: a gravel square between the road and the buildings
  { const pts = [], hw = 9; ribbon([[3, -366], [24, -366], [44, -366]], hw, 0.048, wayMat, true, CG); }
  // ---- the crossed-out sand (the run-off by the junction, east of the ring road): gone, the grass under it shows; the ways' middles stay
  const BOXC = [-14, 61, -325, -288], inBox = (x, z, m) => x > BOXC[0] + m && x < BOXC[1] - m && z > BOXC[2] + m && z < BOXC[3] - m;
  const CELL = 8, SG = new Map(), key = (i, j) => i * 100003 + j;
  for (const e of H.net || []) { if (!e.P || e.P.length < 2 || !(e.kind === 'dirt' || e.kind === 'forest')) continue; const r = Math.max(0.8, e.hw - 0.6); for (let k = 0; k < e.P.length - 1; k++) { const [ax, az] = e.P[k], [bx, bz] = e.P[k + 1];
    for (let i = Math.floor((Math.min(ax, bx) - r) / CELL); i <= Math.floor((Math.max(ax, bx) + r) / CELL); i++) for (let j = Math.floor((Math.min(az, bz) - r) / CELL); j <= Math.floor((Math.max(az, bz) + r) / CELL); j++) { const kk = key(i, j); let L = SG.get(kk); if (!L) SG.set(kk, L = []); L.push([ax, az, bx, bz, r + 1.5]); } } }
  const onWay = (x, z) => { const L = SG.get(key(Math.floor(x / CELL), Math.floor(z / CELL))); if (!L) return false; for (const [ax, az, bx, bz, r] of L) { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), ex = ax + dx * t - x, ez = az + dz * t - z; if (ex * ex + ez * ez < r * r) return true; } return false; };
  const REC = [], recA = new Map(), track = (attr) => { if (!recA.has(attr)) { const r = [attr.array, attr.array.slice(), null, attr]; recA.set(attr, r); REC.push(r); } };
  let nSand = 0; sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position || o.parent === CG || VG.includes(o.parent)) return; const m = matOf(o); if (!m || !m.map || !TX.makadam || m.map.image !== TX.makadam.image) return;
    const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < BOXC[0] || bb.min.x > BOXC[1] || bb.max.z < BOXC[2] || bb.min.z > BOXC[3]) return;
    const P = g.attributes.position, I = g.index, C = g.attributes.color, e = o.matrixWorld, id = e.equals(M0), n = I ? I.count : P.count, vc4 = !!(C && C.itemSize === 4 && m.transparent);
    if (vc4) { for (let v = 0; v < P.count; v++) { V3.fromBufferAttribute(P, v); if (!id) V3.applyMatrix4(e); if (!inBox(V3.x, V3.z, -3) || onWay(V3.x, V3.z)) continue; const dIn = Math.min(V3.x - BOXC[0], BOXC[1] - V3.x, V3.z - BOXC[2], BOXC[3] - V3.z), w = sst(-2, 2, dIn); if (w <= 0) continue; track(C); C.setW(v, C.getW(v) * (1 - w)); nSand++; } C.needsUpdate = true; return; }
    for (let t = 0; t + 2 < n; t += 3) { const vv = I ? [I.getX(t), I.getX(t + 1), I.getX(t + 2)] : [t, t + 1, t + 2]; if (vv[0] === vv[1] && vv[1] === vv[2]) continue; let cx = 0, cz = 0; for (const v of vv) { V3.fromBufferAttribute(P, v); if (!id) V3.applyMatrix4(e); cx += V3.x / 3; cz += V3.z / 3; } if (!inBox(cx, cz, 0) || onWay(cx, cz)) continue;
      if (I) { track(I); I.setX(t + 1, vv[0]); I.setX(t + 2, vv[0]); I.needsUpdate = true; } else { track(P); for (const v of [vv[1], vv[2]]) P.setXYZ(v, P.getX(vv[0]), P.getY(vv[0]), P.getZ(vv[0])); P.needsUpdate = true; } nSand++; } });
  out.sand = nSand;
  // (the trees on the farm's land: away)
  const FARM = (x, z) => (x > -2 && x < 58 && z > -380 && z < -276);
  const INST = []; sc.traverse(o => { if (!o.isInstancedMesh || o.parent === CG) return; const M4 = new THREE.Matrix4(), Z = new THREE.Matrix4().makeScale(0, 0, 0); let r0 = null; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (o.geometry.boundingSphere.radius < 1.2) return;
    for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, M4); V3.setFromMatrixPosition(M4).applyMatrix4(o.matrixWorld); if (!FARM(V3.x, V3.z)) continue; if (!r0) r0 = o.instanceMatrix.array.slice(); o.setMatrixAt(k, Z); } if (r0) { o.instanceMatrix.needsUpdate = true; INST.push([o, r0, o.instanceMatrix.array.slice()]); } });
  const LANDS = [[-2, 46, -382, -348], [-2, 45, -354, -317], [13, 61, -316, -272]], onLand = (x, z) => LANDS.some(([a, b, c, d]) => x > a && x < b && z > c && z < d); let nTree = 0;
  sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position || o.userData.keep) return; for (let p = o.parent; p; p = p.parent) if (p.userData && p.userData.keep && p !== sc) return; const m = matOf(o); if (!m || m.transparent) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < -2 || bb.min.x > 60 || bb.max.z < -382 || bb.min.z > -274 || bb.max.y < 0.5) return;
    const P = g.attributes.position, I = g.index, e = o.matrixWorld, id = e.equals(M0), n = I ? I.count : P.count;
    for (let t = 0; t + 2 < n; t += 3) { const vv = I ? [I.getX(t), I.getX(t + 1), I.getX(t + 2)] : [t, t + 1, t + 2]; if (vv[0] === vv[1] && vv[1] === vv[2]) continue; let cx = 0, cy = 0, cz = 0; for (const v of vv) { V3.fromBufferAttribute(P, v); if (!id) V3.applyMatrix4(e); cx += V3.x / 3; cy += V3.y / 3; cz += V3.z / 3; } if (cy < 0.25 || cy > 16 || !onLand(cx, cz)) continue;
      if (I) { track(I); I.setX(t + 1, vv[0]); I.setX(t + 2, vv[0]); I.needsUpdate = true; } else { track(P); for (const v of [vv[1], vv[2]]) P.setXYZ(v, P.getX(vv[0]), P.getY(vv[0]), P.getZ(vv[0])); P.needsUpdate = true; } nTree++; } });
  out.trees = [INST.length, nTree];
  // ---- fields in rows: a striped texture (a light and a dark band each row), the crop's colour per vertex
  const ST = (() => { const cv = document.createElement('canvas'); cv.width = 4; cv.height = 32; const c = cv.getContext('2d'); for (let y = 0; y < 32; y++) { const b = Math.round(255 * (0.78 + 0.22 * Math.cos(y / 32 * 6.2832))); c.fillStyle = `rgb(${b},${b},${b})`; c.fillRect(0, y, 4, 1); } const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  const FM = new THREE.MeshLambertMaterial({ map: ST, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const CROP = { wheat: [0xdcbc5a, 1.0], green: [0x7fb24a, 0.9], soil: [0x8a6440, 0.8], maize: [0x4f8a34, 1.2], rape: [0xe2d040, 1.0], hay: [0xb4c26a, 2.2], veg: [0x5a8a3a, 0.7], vine: [0x6f8a3c, 2.4] };
  const field = (parent, cx, cz, ang, L, Wd, crop) => { const [hc, sp] = CROP[crop], cc = C3(hc), ca = Math.cos(ang), sa = Math.sin(ang), nL = Math.max(2, Math.ceil(L / 2)), nW = Math.max(2, Math.ceil(Wd / 2)), pos = [], col = [], uv = [], idx = [];
    for (let i = 0; i <= nL; i++) for (let j = 0; j <= nW; j++) { const u = -L / 2 + L * i / nL, v = -Wd / 2 + Wd * j / nW, x = cx + u * ca - v * sa, z = cz + u * sa + v * ca, mo = 0.93 + 0.07 * Math.sin(x * 0.11 + z * 0.07) * Math.sin(x * 0.05 - z * 0.13 + 1.3); pos.push(x, gy(x, z) + 0.035, z); uv.push(u / 4, v / sp); col.push(cc[0] * mo, cc[1] * mo, cc[2] * mo); }
    for (let i = 0; i < nL; i++) for (let j = 0; j < nW; j++) { const a = i * (nW + 1) + j, b = a + nW + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
    const I = g.index; for (let t = 0; t < I.count; t += 3) { const a = I.getX(t), b = I.getX(t + 1), c = I.getX(t + 2), ny = (pos[b * 3 + 2] - pos[a * 3 + 2]) * (pos[c * 3] - pos[a * 3]) - (pos[b * 3] - pos[a * 3]) * (pos[c * 3 + 2] - pos[a * 3 + 2]); if (ny < 0) { I.setX(t + 1, c); I.setX(t + 2, b); } } g.computeVertexNormals();
    const me = new THREE.Mesh(g, FM); me.receiveShadow = true; me.userData.keep = true; parent.add(me); return me; };
  // (a field of four corners [NW, NE, SE, SW]: rows along ang, the corners' quad cut in a grid of about 2 m)
  const fieldP = (parent, Q, ang, crop) => { const [hc, sp] = CROP[crop], cc = C3(hc), ca = Math.cos(ang), sa = Math.sin(ang), Lx = Math.max(Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]), Math.hypot(Q[2][0] - Q[3][0], Q[2][1] - Q[3][1])), Lz = Math.max(Math.hypot(Q[3][0] - Q[0][0], Q[3][1] - Q[0][1]), Math.hypot(Q[2][0] - Q[1][0], Q[2][1] - Q[1][1]));
    const nL = Math.max(2, Math.ceil(Lx / 2)), nW = Math.max(2, Math.ceil(Lz / 2)), pos = [], col = [], uv = [], idx = [];
    for (let i = 0; i <= nL; i++) for (let j = 0; j <= nW; j++) { const a = i / nL, b = j / nW, x = (Q[0][0] * (1 - a) + Q[1][0] * a) * (1 - b) + (Q[3][0] * (1 - a) + Q[2][0] * a) * b, z = (Q[0][1] * (1 - a) + Q[1][1] * a) * (1 - b) + (Q[3][1] * (1 - a) + Q[2][1] * a) * b;
      const u = x * ca + z * sa, v = -x * sa + z * ca, mo = 0.93 + 0.07 * Math.sin(x * 0.11 + z * 0.07) * Math.sin(x * 0.05 - z * 0.13 + 1.3); pos.push(x, gy(x, z) + 0.035, z); uv.push(u / 4, v / sp); col.push(cc[0] * mo, cc[1] * mo, cc[2] * mo); }
    for (let i = 0; i < nL; i++) for (let j = 0; j < nW; j++) { const a = i * (nW + 1) + j, b = a + nW + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
    const I = g.index; for (let t = 0; t < I.count; t += 3) { const a = I.getX(t), b = I.getX(t + 1), c = I.getX(t + 2), ny = (pos[b * 3 + 2] - pos[a * 3 + 2]) * (pos[c * 3] - pos[a * 3]) - (pos[b * 3] - pos[a * 3]) * (pos[c * 3 + 2] - pos[a * 3 + 2]); if (ny < 0) { I.setX(t + 1, c); I.setX(t + 2, b); } } g.computeVertexNormals();
    const me = new THREE.Mesh(g, FM); me.receiveShadow = true; me.userData.keep = true; parent.add(me); return me; };
  // ---- the yard (all three): the house (cream, a red roof, a chimney, windows, a door to the yard), the barn (red, a grey roof, its big doors to the
  // yard), an open shed; the ridges east-west (local z along the world's -x)
  const yard = (B, k) => { const fh = FR(11, -360, 0, 1, gy(11, -360)); B.gableB(fh, 0, 0, 7, 10, 4.6, 2.6, 0xe8dcc0, 0xa8402e); B.box(fh, -1.0, 0.2, 3, 8.6, -3.6, -2.8, 0x7a6a62);
    for (const zz of [-3.2, 0, 3.2]) for (const yy of [1.2, 3.1]) B.box(fh, 3.46, 3.56, yy, yy + 1.0, zz - 0.55, zz + 0.55, 0x3a4a5a); B.box(fh, 3.46, 3.58, 0, 2.2, 1.2, 2.4, 0x5a3a24);
    const fb = FR(31, -362, 0, 1, gy(31, -362)); B.gableB(fb, 0, 0, 11, 16, 5.4, 3.4, 0x9a3a2a, 0x6e7276); B.box(fb, 5.45, 5.55, 0, 4.2, -2.4, 2.4, 0x4a2a1a); for (const zz of [-2.5, 2.5]) B.box(fb, 5.42, 5.6, 0, 4.4, zz - 0.15, zz + 0.15, 0xf0f0e8); B.box(fb, 5.42, 5.6, 4.25, 4.45, -2.5, 2.5, 0xf0f0e8);
    const fs = FR(22, -352.5, 1, 0, gy(22, -352.5)); for (const [x, z] of [[-4, -1.6], [4, -1.6], [-4, 1.6], [4, 1.6]]) B.box(fs, x - 0.15, x + 0.15, 0, 3.2, z - 0.15, z + 0.15, 0x6a6a64); { const q = [[-4.6, 3.0, -2.2], [4.6, 3.0, -2.2], [4.6, 3.6, 2.2], [-4.6, 3.6, 2.2]]; B.put(fs, [fix(q, [0, 1, 0])], 0x5a6a5a); B.put(fs, [fix(q.map(([x, y, z]) => [x, y - 0.1, z]), [0, -1, 0])], 0x3a4038); }
    for (const zz of [-370.5, -364]) { B.cylY(FR(43.5, zz, 1, 0, gy(43.5, zz)), 0, 0, 2.3, -0.2, 9, 0xc0c4c8, 0x8a8e92, 1.5); }
    for (let i = 0; i < 4; i++) B.cylZ(FR(19 + i * 1.7, -357.5, 1, 0, gy(19, -357.5)), 0, 0.75, 0, 0.75, 1.2, 0xd9b45a, 0xc89a48);
    // the garden fence round the house (low pickets) and two trees by it
    for (let x = 4; x <= 18; x += 1.4) B.box(FR(x, -354.6, 1, 0, gy(x, -354.6)), -0.05, 0.05, 0, 0.8, -0.05, 0.05, 0xf0f0e8); B.box(FR(11, -354.6, 1, 0, gy(11, -354.6)), -7, 7, 0.55, 0.62, -0.04, 0.04, 0xf0f0e8);
    B.tree(3.5, -368, 2.4, 2.0, 0x4f8a34); B.tree(3.0, -357, 2.0, 1.8, 0x5f9a3a); };
  // a tractor; animals; fences; vines; hives
  const tractor = (B, x, z, h) => { const tr = FR(x, z, Math.cos(h), Math.sin(h), gy(x, z)); B.box(tr, -0.3, 1.9, 0.75, 1.55, -0.55, 0.55, 0x3f8a3a); B.box(tr, -1.4, -0.2, 0.75, 2.75, -0.7, 0.7, 0x2f3a33); B.box(tr, -1.5, -0.1, 2.75, 2.9, -0.78, 0.78, 0x3f8a3a);
    for (const s of [-1, 1]) { B.cylZ(tr, -0.9, 0.85, s * 0.95, 0.85, 0.45, 0x1c1c1c, 0xd8a02a); B.cylZ(tr, 1.4, 0.48, s * 0.8, 0.48, 0.3, 0x1c1c1c, 0xd8a02a); } };
  const cow = (B, x, z, h, kind) => { const fr = FR(x, z, Math.cos(h), Math.sin(h), gy(x, z)), body = kind === 1 ? 0x8a5a3a : 0xf4f2ec, spot = 0x1e1c1a; B.box(fr, -1.1, 1.1, 0.75, 1.75, -0.45, 0.45, body); if (kind !== 1) { B.box(fr, -0.7, -0.1, 1.74, 1.78, -0.46, 0.2, spot); B.box(fr, 0.25, 0.8, 1.74, 1.78, -0.1, 0.46, spot); }
    B.box(fr, 1.05, 1.6, 1.2, 1.75, -0.22, 0.22, kind === 1 ? body : spot); for (const [a, b] of [[0.8, 0.3], [0.8, -0.3], [-0.8, 0.3], [-0.8, -0.3]]) B.box(fr, a - 0.1, a + 0.1, 0, 0.78, b - 0.1, b + 0.1, body); };
  const sheep = (B, x, z, h) => { const fr = FR(x, z, Math.cos(h), Math.sin(h), gy(x, z)); B.box(fr, -0.65, 0.65, 0.45, 1.15, -0.4, 0.4, 0xf2efe6); B.box(fr, 0.6, 0.95, 0.75, 1.15, -0.17, 0.17, 0x2a2622); for (const [a, b] of [[0.4, 0.22], [0.4, -0.22], [-0.4, 0.22], [-0.4, -0.22]]) B.box(fr, a - 0.06, a + 0.06, 0, 0.47, b - 0.06, b + 0.06, 0x2a2622); };
  const horse = (B, x, z, h, c) => { const fr = FR(x, z, Math.cos(h), Math.sin(h), gy(x, z)); B.box(fr, -1.0, 1.0, 0.95, 1.75, -0.35, 0.35, c); B.box(fr, 0.85, 1.25, 1.5, 2.35, -0.17, 0.17, c); B.box(fr, 1.1, 1.75, 2.05, 2.4, -0.15, 0.15, c); B.box(fr, 0.8, 1.3, 2.3, 2.45, -0.05, 0.05, 0x2a2018); B.box(fr, -1.15, -0.95, 1.0, 1.6, -0.05, 0.05, 0x2a2018);
    for (const [a, b] of [[0.75, 0.22], [0.75, -0.22], [-0.75, 0.22], [-0.75, -0.22]]) B.box(fr, a - 0.08, a + 0.08, 0, 0.98, b - 0.08, b + 0.08, c); };
  const fence = (B, pts, c = 0x8a6a48) => { for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 2.6)), fr = FR(ax, az, (bx - ax) / L, (bz - az) / L, gy(ax, az));
      for (let k = 0; k <= n; k++) { const u = L * k / n; B.box(fr, u - 0.07, u + 0.07, 0, 1.15, -0.07, 0.07, c); } for (const yy of [0.5, 0.95]) B.box(fr, 0, L, yy, yy + 0.08, -0.04, 0.04, c); } };
  const vineRow = (B, x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), fr = FR(x0, z0, (x1 - x0) / L, (z1 - z0) / L, gy(x0, z0)); for (let u = 0; u <= L; u += 4) B.box(fr, u - 0.06, u + 0.06, 0, 1.6, -0.06, 0.06, 0x7a6a52); B.box(fr, 0, L, 1.48, 1.51, -0.02, 0.02, 0x6a6a64);
    for (let u = 0.6; u < L - 0.4; u += 1.2) { const s = 0.9 + rnd() * 0.25; B.box(fr, u - 0.55, u + 0.55, 0.55, 0.55 + 0.95 * s, -0.32, 0.32, [0.36 + rnd() * 0.05, 0.52 + rnd() * 0.06, 0.2]); } };
  const hive = (B, x, z, c) => { const fr = FR(x, z, 1, 0, gy(x, z)); B.box(fr, -0.3, 0.3, 0, 0.18, -0.25, 0.25, 0x6a5a48); B.box(fr, -0.28, 0.28, 0.18, 0.78, -0.23, 0.23, c); B.box(fr, -0.33, 0.33, 0.78, 0.86, -0.28, 0.28, 0x8a8a84); };
  const bale = (B, x, z, h) => B.cylZ(FR(x, z, Math.cos(h), Math.sin(h), gy(x, z)), 0, 0.75, 0, 0.75, 1.2, 0xd9b45a, 0xc89a48);
  // ---- the land: A north of the jetty's way (x 1..42, z -351..-323), B south of it where the sand was (x 19..51, z -313..-290, the beach east of it),
  // W the circled land west of A and of the yard (between the gravel road and the ring road's run-off), N north of the gravel road (to the fence at z -402)
  const BS = [0, 1, 2].map(() => builder());
  for (let k = 0; k < 3; k++) yard(BS[k], k);
  const scatter = (n, inside, x0, x1, z0, z1, dmin, seen) => { const P = []; let tries = 0; while (P.length < n && tries++ < 4000) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if (!inside(x, z)) continue; if (P.concat(seen || []).some(([a, b]) => Math.hypot(a - x, b - z) < dmin)) continue; P.push([x, z]); } return P; };
  const pond = (parent, x, z) => { for (const [r, c, y, f] of [[5.4, 0x7a6a48, 0.03, -2], [4.5, 0x3d7f9c, 0.05, -4], [3.0, 0x2e6a86, 0.06, -5]]) { const d = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshLambertMaterial({ color: c, polygonOffset: true, polygonOffsetFactor: f, polygonOffsetUnits: f })); d.rotation.x = -Math.PI / 2; d.position.set(x, gy(x, z) + y, z); d.receiveShadow = true; d.userData.keep = true; parent.add(d); } };
  const trough = (B, x, z, h) => { const tr = FR(x, z, Math.cos(h), Math.sin(h), gy(x, z)); B.box(tr, -1.5, 1.5, 0, 0.55, -0.4, 0.4, 0x6a6e72); B.box(tr, -1.4, 1.4, 0.42, 0.5, -0.3, 0.3, 0x3f6a8a); };
  const shelter = (B, x, z, h, w, d) => { const fr = FR(x, z, Math.cos(h), Math.sin(h), gy(x, z)); for (const [a, b] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) B.box(fr, a - 0.12, a + 0.12, 0, b < 0 ? 2.6 : 2.1, b - 0.12, b + 0.12, 0x6a4a30);
    B.box(fr, -w / 2, w / 2, 0, 2.1, -d / 2 - 0.1, -d / 2, 0x7a5a3a); const q = [[-w / 2 - 0.3, 2.7, -d / 2 - 0.3], [w / 2 + 0.3, 2.7, -d / 2 - 0.3], [w / 2 + 0.3, 2.15, d / 2 + 0.3], [-w / 2 - 0.3, 2.15, d / 2 + 0.3]]; B.put(fr, [fix(q, [0, 1, 0])], 0x5a4a3c); B.put(fr, [fix(q.map(([a, y, b]) => [a, y - 0.1, b]), [0, -1, 0])], 0x3a3028); };
  // W: fields in bands along the ring road's bend (its run-off's sand on the inside, 1.5 m off it), 8 m wide, 1 m of grass between; cut where they reach
  // the gravel road (7.3 m off its middle), the way or the yard's line (x -1.5); a long band in two fields
  const sandNear = (x, z, r) => { if (!H.roHit) return false; if (H.roHit(x, z)) return true; for (let a = 0; a < 12; a++) { const t = a / 12 * 6.2832; if (H.roHit(x + Math.cos(t) * r, z + Math.sin(t) * r)) return true; } return false; };
  const roadZ = (x) => { for (let i = 0; i < ROAD.length - 1; i++) { const [ax, az] = ROAD[i], [bx, bz] = ROAD[i + 1]; if ((x - ax) * (x - bx) <= 0) return az + (bz - az) * (x - ax) / (bx - ax); } return ROAD[ROAD.length - 1][1]; };
  const okW = (x, z) => x <= -1.5 && x >= -92 && z >= roadZ(x) + 7.3 && !onWay(x, z) && !sandNear(x, z, 2.5);
  { const NPa = H.roads.nord.P2.map(p => [p.x, p.z]); let run = [], best = []; for (const p of NPa) { if (p[0] > -125 && p[0] < 20 && p[1] > -362 && p[1] < -276) run.push(p); else { if (run.length > best.length) best = run; run = []; } } if (run.length > best.length) best = run;
    const acc = [0]; for (let i = 1; i < best.length; i++) acc.push(acc[i - 1] + Math.hypot(best[i][0] - best[i - 1][0], best[i][1] - best[i - 1][1])); const Lr = acc[acc.length - 1], SM = [];
    for (let s = 0, k = 0; s <= Lr; s += 2) { while (k < acc.length - 2 && acc[k + 1] < s) k++; const t = (s - acc[k]) / ((acc[k + 1] - acc[k]) || 1); SM.push([best[k][0] + (best[k + 1][0] - best[k][0]) * t, best[k][1] + (best[k + 1][1] - best[k][1]) * t, s]); }
    const NR = SM.map((p, i) => { const a = SM[Math.max(0, i - 2)], b = SM[Math.min(SM.length - 1, i + 2)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1; return [-tz / l, tx / l]; });
    { const m = Math.floor(SM.length / 2), [px, pz] = SM[m]; if (NR[m][0] * (-30 - px) + NR[m][1] * (-362 - pz) < 0) NR.forEach(n => { n[0] = -n[0]; n[1] = -n[1]; }); }
    // the run-off's outer edge (3 m off) per sample, kept from shrinking fast and smoothed
    const D0 = SM.map(([px, pz], i) => { for (let d = 12; d < 45; d += 0.5) { const x = px + NR[i][0] * d, z = pz + NR[i][1] * d; if (!sandNear(x, z, 1.5)) return d; } return 45; });
    const D1 = D0.map((d, i) => { let m = 0; for (let k = -2; k <= 2; k++) m = Math.max(m, D0[Math.max(0, Math.min(D0.length - 1, i + k))]); return m; }), DS = D1.map((d, i) => { let a = 0, n = 0; for (let k = -4; k <= 4; k++) { a += D1[Math.max(0, Math.min(D1.length - 1, i + k))]; n++; } return a / n; });
    out.Wd0 = [Math.min(...DS).toFixed(1), Math.max(...DS).toFixed(1), SM.length];
    // how far out the land reaches at each sample (to the gravel road's 7.3 m, the yard's line, the way): the bands are cut along it, not across
    const okR = (x, z) => x <= -1.5 && x >= -92 && z >= roadZ(x) + 7.3 && !onWay(x, z);
    const DM0 = SM.map(([px, pz], i) => { let d = DS[i]; if (!okR(px + NR[i][0] * d, pz + NR[i][1] * d)) return d; while (d < 90 && okR(px + NR[i][0] * (d + 0.5), pz + NR[i][1] * (d + 0.5))) d += 0.5; return d; });
    const DM = DM0.map((d, i) => { let m = 1e9; for (let k = -2; k <= 2; k++) m = Math.min(m, DM0[Math.max(0, Math.min(DM0.length - 1, i + k))]); return m; });
    const CR = [['wheat', 'hay', 'rape'], ['maize', 'soil', 'wheat'], ['rape', 'wheat', 'hay'], ['soil', 'green', 'maize'], ['hay', 'maize'], ['green', 'wheat']]; out.W = [];
    for (let b = 0; b < 2; b++) { const o0 = b * 9, LO = DS.map(d => d + o0), HI = DS.map((d, i) => Math.min(d + o0 + 8, DM[i])), val = LO.map((l, i) => HI[i] - l >= 2);
      const runs = []; let r0 = -1; for (let i = 0; i <= val.length; i++) { if (i < val.length && val[i]) { if (r0 < 0) r0 = i; } else if (r0 >= 0) { if (i - 1 - r0 >= 5) runs.push([r0, i - 1]); r0 = -1; } }
      const parts = []; for (const [a, z] of runs) { const n = z - a, np = Math.max(1, Math.round(n * 2 / 30)), step = (n + 1) / np; for (let q = 0; q < np; q++) { const i0 = a + Math.round(q * step), i1 = a + Math.round((q + 1) * step) - 1 - (q < np - 1 ? 1 : 0); if (i1 - i0 >= 3) parts.push([i0, i1]); } }
      if (!parts.length) { out.W.push([b, 'none']); continue; }
      parts.forEach(([i0, i1], pi) => { const crop = CR[b][pi % CR[b].length], [hc, sp] = CROP[crop], cc = C3(hc), nW = 4, pos = [], col = [], uv = [], idx = [];
        for (let i = i0; i <= i1; i++) for (let j = 0; j <= nW; j++) { const d = LO[i] + (HI[i] - LO[i]) * j / nW, x = SM[i][0] + NR[i][0] * d, z = SM[i][1] + NR[i][1] * d, mo = 0.93 + 0.07 * Math.sin(x * 0.11 + z * 0.07) * Math.sin(x * 0.05 - z * 0.13 + 1.3);
          pos.push(x, gy(x, z) + 0.035, z); uv.push(SM[i][2] / 4, (d - DS[i]) / sp); col.push(cc[0] * mo, cc[1] * mo, cc[2] * mo); }
        for (let i = 0; i < i1 - i0; i++) for (let j = 0; j < nW; j++) { const a = i * (nW + 1) + j, c = a + nW + 1; idx.push(a, a + 1, c, c, a + 1, c + 1); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
        const I = g.index; for (let t = 0; t < I.count; t += 3) { const a = I.getX(t), bb = I.getX(t + 1), c = I.getX(t + 2), ny = (pos[bb * 3 + 2] - pos[a * 3 + 2]) * (pos[c * 3] - pos[a * 3]) - (pos[bb * 3] - pos[a * 3]) * (pos[c * 3 + 2] - pos[a * 3 + 2]); if (ny < 0) { I.setX(t + 1, c); I.setX(t + 2, bb); } } g.computeVertexNormals();
        const me = new THREE.Mesh(g, FM); me.receiveShadow = true; me.userData.keep = true; CG.add(me); let mid = Math.floor((i0 + i1) / 2); for (let i = i0; i <= i1; i++) if (HI[i] - LO[i] > HI[mid] - LO[mid] + 0.5) mid = i; const dm = (LO[mid] + HI[mid]) / 2;
        out.W.push([b, crop, (i1 - i0) * 2, [+(SM[mid][0] + NR[mid][0] * dm).toFixed(1), +(SM[mid][1] + NR[mid][1] * dm).toFixed(1)]]);
        if (!window.__WMID) window.__WMID = {}; window.__WMID[crop] = window.__WMID[crop] || [SM[mid][0] + NR[mid][0] * dm, SM[mid][1] + NR[mid][1] * dm, Math.atan2(SM[Math.min(i1, mid + 1)][1] - SM[mid][1], SM[Math.min(i1, mid + 1)][0] - SM[mid][0]) + (mid + 1 > i1 ? Math.PI : 0)]; }); }
    { const CP = SM.map((p, i) => [p[0] + NR[i][0] * (DS[i] + 18), p[1] + NR[i][1] * (DS[i] + 18)]), xC = (z) => { let bx = null; for (let i = 1; i < CP.length; i++) { const [ax, az] = CP[i - 1], [cx, cz] = CP[i]; if ((z - az) * (z - cz) <= 0 && az !== cz) { const x = ax + (cx - ax) * (z - az) / (cz - az); if (bx === null || x > bx) bx = x; } } return bx; };
      let xN = xC(roadZ(-20) + 7.3); if (xN !== null) xN = xC(roadZ(xN) + 7.3); const zS1 = -362.4, zN2 = -361.2, zS2 = -354.2; out.NE = [];
      if (xN !== null && xC(zS1) !== null) { fieldP(CG, [[xN, roadZ(xN) + 7.3], [-1.5, roadZ(-1.5) + 7.3], [-1.5, zS1], [xC(zS1), zS1]], 0, 'soil'); out.NE.push(['soil', +xN.toFixed(1), +xC(zS1).toFixed(1)]); if (!window.__WMID) window.__WMID = {}; window.__WMID.soil = [(-1.5 + xC(zS1)) / 2 - 2, (zS1 + roadZ(-8) + 7.3) / 2, 0]; }
      if (xC(zN2) !== null && xC(zS2) !== null && -1.5 - xC(zS2) > 2) { fieldP(CG, [[xC(zN2), zN2], [-1.5, zN2], [-1.5, zS2], [xC(zS2), zS2]], 0, 'green'); out.NE.push(['green', +xC(zN2).toFixed(1), +xC(zS2).toFixed(1)]); } }
  }
  const BW = builder(), WM = window.__WMID || {}; const TW = WM.soil; if (TW) { const [x, z, h] = TW; tractor(BW, x, z, h); } const HW = WM.hay; if (HW) { const [x, z, h] = HW; for (const k of [-6, 0, 7]) bale(BW, x + Math.cos(h) * k + Math.sin(h) * (k % 2 ? 2 : -1.5), z + Math.sin(h) * k - Math.cos(h) * (k % 2 ? 2 : -1.5), rnd() * 3); } BW.mesh(CG); window.__WMID = null;
  const fieldsA = (k) => { field(VG[k], 21, -345.5, 0, 40, 8, 'wheat'); field(VG[k], 21, -336, 0, 40, 8, 'maize'); field(VG[k], 19, -327, 0.08, 34, 6.5, 'rape'); };
  const fieldsB = (k) => { field(VG[k], 38, -304, -0.42, 30, 9, 'hay'); field(VG[k], 40, -293.5, -0.42, 32, 8, 'soil'); field(VG[k], 34, -283, -0.42, 22, 6, 'veg'); for (const [x, z] of [[44, -306], [47, -302], [36, -308]]) bale(BS[k], x, z, rnd() * 3); };
  // 0 by the sea: B fenced (cows and horses west, sheep east), a shelter and a trough; fields in A
  { const B = BS[0]; fieldsA(0); const PB = [[19, -306], [30, -307.5], [41, -310.5], [49, -313.5], [51, -313], [51, -290], [19, -290], [19, -306]]; fence(B, PB); fence(B, [[35, -308.6], [35, -290]]);
    const inB = (x, z) => z > -305 + (x > 30 ? -(x - 30) * 0.27 : 0) + 1.5 && z < -291.5 && x > 20.5 && x < 49.5; let seen = [];
    const cw = scatter(6, (x, z) => inB(x, z) && x < 33.5, 20, 34, -306, -291, 3.0); cw.forEach(([x, z], i) => cow(B, x, z, rnd() * 6.28, i % 3 === 0 ? 1 : 0)); seen = seen.concat(cw);
    scatter(3, (x, z) => inB(x, z) && x < 33.5, 20, 34, -306, -291, 3.0, seen).forEach(([x, z], i) => horse(B, x, z, rnd() * 6.28, [0x7a4a2a, 0x3a2a20, 0xb08060][i]));
    scatter(10, (x, z) => inB(x, z) && x > 36.5 && x < 49.5 && (z < -295.5 || x < 39.5), 36, 50, -312, -291, 1.8).forEach(([x, z]) => sheep(B, x, z, rnd() * 6.28));
    shelter(B, 44, -292.6, 0, 7, 3); trough(B, 27, -291.2, 0); }
  // 1 by the yard: A fenced, sheep west of x 14, cows, horses and the pond east; fields in B
  { const B = BS[1]; fieldsB(1); fence(B, [[1, -351], [42, -351], [42, -323], [12, -323], [1, -333], [1, -351]]); fence(B, [[14, -351], [14, -323]]); pond(VG[1], 34, -330);
    const inA = (x, z) => x > 2.2 && x < 40.8 && z > -349.8 && z < -324.2 && z < -333 + (x - 1) * 10 / 11 - 1.2 && Math.hypot(x - 34, z + 330) > 6.6; let seen = [];
    const cw = scatter(8, (x, z) => inA(x, z) && x > 15.5, 15, 41, -350, -324, 3.0); cw.forEach(([x, z], i) => cow(B, x, z, rnd() * 6.28, i % 3 === 0 ? 1 : 0)); seen = seen.concat(cw);
    scatter(3, (x, z) => inA(x, z) && x > 15.5, 15, 41, -350, -324, 3.0, seen).forEach(([x, z], i) => horse(B, x, z, rnd() * 6.28, [0x5a3a24, 0x9a6a40, 0x3a2a20][i]));
    scatter(9, (x, z) => inA(x, z) && x < 12.8 && z > -346.5, 2, 13, -350, -334, 1.8).forEach(([x, z]) => sheep(B, x, z, rnd() * 6.28));
    trough(B, 26, -324.6, 0); shelter(B, 7.5, -349.2, 0, 7, 2.6); for (const [x, z] of [[45, -347], [46.5, -342], [44, -337]]) bale(B, x, z, rnd() * 3); }
  // 2 across the road: N fenced from x -60 to 40 (cows west, horses in the middle by a stable, sheep east); fields in A and B
  { const B = BS[2]; fieldsA(2); fieldsB(2); const xs = []; for (let x = -60; x <= 40; x += 5) xs.push(x); const south = xs.map(x => [x, roadZ(x) - 7.2]); fence(B, south); fence(B, [[-60, roadZ(-60) - 7.2], [-60, -399.5], [40, -399.5], [40, roadZ(40) - 7.2]]);
    for (const x of [-25, 5]) fence(B, [[x, roadZ(x) - 7.2], [x, -399.5]]);
    const inN = (x, z) => z < roadZ(x) - 8.6 && z > -398.2; let seen = [];
    const st = FR(-10, -393.5, 1, 0, gy(-10, -393.5)); B.gableB(st, 0, 0, 5.5, 9, 2.8, 1.8, 0x8a5a3a, 0x6e7276); B.box(st, -0.9, 0.9, 0, 2.2, 4.5, 4.58, 0x3a2418);
    scatter(7, (x, z) => inN(x, z) && x > -58.6 && x < -26.4 && (z < -396 ? x > -38 : true) && !(x < -46 && z < -395.8), -59, -26, -398, -384, 3.0).forEach(([x, z], i) => cow(B, x, z, rnd() * 6.28, i % 3 === 0 ? 1 : 0));
    scatter(4, (x, z) => inN(x, z) && x > -23.6 && x < 3.6 && Math.hypot(x + 10, z + 393.5) > 7, -24, 4, -398, -384, 3.0).forEach(([x, z], i) => horse(B, x, z, rnd() * 6.28, [0x7a4a2a, 0x3a2a20, 0xb08060, 0x5a3a24][i]));
    scatter(12, (x, z) => inN(x, z) && x > 6.4 && x < 38.6 && !(x > 25 && z < -395.4), 6, 39, -398, -384, 1.8).forEach(([x, z]) => sheep(B, x, z, rnd() * 6.28));
    trough(B, -42, -397.6, 0); shelter(B, 30, -397.4, 0, 7, 2.6); }
  BS.forEach((B, k) => B.mesh(VG[k])); out.quads = BS.map(B => B.QS.length);
  // ---- the switch: the road, the yard and the sand's removal in all three; one version's farm
  REC.forEach(r => { r[2] = r[0].slice(); }); INST.forEach(r => { r[2] = r[0].instanceMatrix.array.slice(); });
  window.__FNE = (k) => { const on = k >= 0; ROOT.visible = on; VG.forEach((g, i) => { g.visible = i === k; }); for (const [arr, a0, a1, attr] of REC) { arr.set(on ? a1 : a0); attr.needsUpdate = true; } for (const [o, m0, m1] of INST) { o.instanceMatrix.array.set(on ? m1 : m0); o.instanceMatrix.needsUpdate = true; } return k; };
  window.__FNE(0); return JSON.stringify(out); })()
