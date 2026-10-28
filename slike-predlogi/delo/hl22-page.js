(() => {
  // (pictures only) 22. 10. (sheet 44-3, the user's red and blue marks): "vse kar je na desni strani ceste naj bo del parkirisca. Parkiriscu spremeni
  // obliko tako da bo sovpadalo z cesto. Cesta naj se zdruzi z drugo cesto in naj ju locijo le crtice": the wedge east of the heliport's road, from
  // the north road's edge down to where the road meets the lot, all lot (the lot's own surface from the road's east edge on; the grass, sand and old
  // paint there cut by ln21's mask; the tent, the wall with its posts and base, the fence along the north road, the cones, tyres, barrels, the crate
  // and the red-white barriers on that side taken away, the lot's lamps kept); at the mouth the fence, the white bar and the tile strip taken away
  // (the road's asphalt runs on into the north road, only the dashed edge line between them), the barrels and the sign on the north road there too
  // ; window.__HL22 report
  if (window.__HL22ROOT) Render.scene.remove(window.__HL22ROOT);
  const H = window.__H3, G = new THREE.Group(); G.name = 'hl22'; Render.scene.add(G); window.__HL22ROOT = G; Render.scene.updateMatrixWorld(true);
  const out = {};
  const find = (pred) => { let r = null; Render.scene.traverse(o => { if (!r && o.isMesh && o.geometry && o.geometry.attributes.position && pred(o)) r = o; }); return r; };
  const nv = (o) => o.geometry.attributes.position.count, hasXZ = (o, x, z) => { const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox.clone().applyMatrix4(o.matrixWorld); return x > b.min.x && x < b.max.x && z > b.min.z && z < b.max.z; };
  const ROAD = find(o => nv(o) === 1659 && hasXZ(o, -8, 110)), LOT = find(o => nv(o) === 27470 && hasXZ(o, 5, 110));
  out.found = [!!ROAD, !!LOT]; if (!ROAD || !LOT) return 'HL22 ' + JSON.stringify(out);
  // --- the road's east edge per row of a 0.25 m grid (x -46..2, z 56..110), smoothed along the rows
  const GX0 = -46, GZ0 = 56, GS = 0.25, GNX = 192, GNZ = 356, C = new Uint8Array(GNX * GNZ);
  { const g = ROAD.geometry, P = g.attributes.position, I = g.index, V = new THREE.Vector3(), n = I ? I.count : P.count; const at = (k) => { V.fromBufferAttribute(P, I ? I.getX(k) : k).applyMatrix4(ROAD.matrixWorld); return [V.x, V.z]; };
    for (let t = 0; t < n; t += 3) { const a = at(t), b = at(t + 1), c = at(t + 2), x0 = Math.max(0, Math.floor((Math.min(a[0], b[0], c[0]) - GX0) / GS)), x1 = Math.min(GNX - 1, Math.ceil((Math.max(a[0], b[0], c[0]) - GX0) / GS)), z0 = Math.max(0, Math.floor((Math.min(a[1], b[1], c[1]) - GZ0) / GS)), z1 = Math.min(GNZ - 1, Math.ceil((Math.max(a[1], b[1], c[1]) - GZ0) / GS));
      const ar = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); if (Math.abs(ar) < 1e-9) continue;
      for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const x = GX0 + (i + 0.5) * GS, z = GZ0 + (j + 0.5) * GS;
        const w0 = ((b[0] - x) * (c[1] - z) - (b[1] - z) * (c[0] - x)) / ar, w1 = ((c[0] - x) * (a[1] - z) - (c[1] - z) * (a[0] - x)) / ar, w2 = 1 - w0 - w1; if (w0 >= -1e-4 && w1 >= -1e-4 && w2 >= -1e-4) C[j * GNX + i] = 1; } } }
  const RE = new Float32Array(GNZ).fill(NaN);
  for (let j = 0; j < GNZ; j++) { let rw = -1, re = -1; for (let i = 0; i < GNX; i++) if (C[j * GNX + i]) { const x = GX0 + (i + 0.5) * GS; if (x > -44) { rw = i; break; } }
    if (rw < 0) continue; re = rw; while (re + 1 < GNX && C[j * GNX + re + 1]) re++; RE[j] = GX0 + (re + 1) * GS; }
  const smooth = (A, k) => { const B = new Float32Array(A.length).fill(NaN); for (let j = 0; j < A.length; j++) { if (isNaN(A[j])) continue; let s = 0, n = 0; for (let d = -k; d <= k; d++) { const v = A[j + d]; if (v !== undefined && !isNaN(v)) { s += v; n++; } } B[j] = s / n; } return B; };
  const REs = smooth(RE, 6), REat = (z) => { const j = Math.floor((z - GZ0) / GS); return j >= 0 && j < GNZ ? REs[j] : NaN; };
  // (the north road's band east of the wedge, per half metre: its white line (the road's edge) and the kerb's outer edge. The band floats above
  //  the ground, so from the game's cameras the ground under it shows beside it: there it must be lot, not grass)
  const BW = new Map(), BK = new Map(); { let EB = null; for (const c of Render.scene.children) if (c.name === 'edgeband') EB = c; const V = new THREE.Vector3();
    if (EB) EB.traverse(o => { if (!o.isMesh) return; const r = o.renderOrder, isW = Math.abs(r - 5.3) < 1e-3, isK = Math.abs(r - 5.25) < 1e-3; if (!isW && !isK) return; const P = o.geometry.attributes.position, C = o.geometry.attributes.color; o.updateMatrixWorld(true);
      for (let i = 0; i < P.count; i++) { V.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (V.x < -4 || V.x > 26 || V.z < 56 || V.z > 72) continue; if (C && C.itemSize > 3 && C.getW(i) < 0.05) continue; const k = Math.round(V.x * 2);
        if (isW) { const e = BW.get(k) || [0, 0]; e[0] += V.z; e[1]++; BW.set(k, e); } else BK.set(k, Math.max(BK.get(k) || -1e9, V.z)); } }); }
  const BO = new Map(); for (const [k, zk] of BK) { const w = BW.get(k); BO.set(k, [w ? w[0] / w[1] - 0.1 : zk - 2.0, zk + 2.5]); }
  { const ks = [...BO.keys()].sort((p, q) => p - q);   // (half metres where the kerb ribbon has no vertex: filled from the neighbours, up to 4 m apart)
    for (let i = 0; i + 1 < ks.length; i++) { const k0 = ks[i], k1 = ks[i + 1]; if (k1 - k0 < 2 || k1 - k0 > 8) continue; const a0 = BO.get(k0), a1 = BO.get(k1);
      for (let k = k0 + 1; k < k1; k++) { const t = (k - k0) / (k1 - k0); BO.set(k, [a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t]); } } }
  const XL = REat;   // (the lot's west edge: the road's east edge in every row, up to the north road's kerb)
  const Z0 = 59.5, Z1 = 106.0, XR = -3.0, XRM = 1.0;   // (Z0: under the north road's kerb, so no grass shows between it and the lot)   // (XRM: the mask goes on over the lot's west bays, its old dark paint there too)
  // --- the lot's surface over the wedge: rows from the road's east edge to x -3 (behind the lot and the road where they lie, polygonOffset)
  const fitUV = (o) => { const g = o.geometry, P = g.attributes.position, U = g.attributes.uv, V = new THREE.Vector3(); if (!U) return null; let S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bu = [0, 0, 0], bv = [0, 0, 0];
    for (let k = 0; k < P.count; k++) { V.fromBufferAttribute(P, k).applyMatrix4(o.matrixWorld); const r = [V.x, V.z, 1]; for (let a = 0; a < 3; a++) { for (let b = 0; b < 3; b++) S[a][b] += r[a] * r[b]; bu[a] += r[a] * U.getX(k); bv[a] += r[a] * U.getY(k); } }
    const inv = new THREE.Matrix3().set(S[0][0], S[0][1], S[0][2], S[1][0], S[1][1], S[1][2], S[2][0], S[2][1], S[2][2]).invert().elements; const mul = (b) => [0, 1, 2].map(r => inv[r] * b[0] + inv[r + 3] * b[1] + inv[r + 6] * b[2]);
    return [mul(bu), mul(bv)]; };
  const dyOf = (o) => { const P = o.geometry.attributes.position, V = new THREE.Vector3(); let s = 0, n = 0; for (let k = 0; k < P.count; k += Math.max(1, Math.floor(P.count / 200))) { V.fromBufferAttribute(P, k).applyMatrix4(o.matrixWorld); s += V.y - H.ground(V.x, V.z); n++; } return n ? s / n : 0.09; };
  { const uvA = fitUV(LOT), dy = dyOf(LOT), pos = [], uv = [], nor = [], idx = []; let prev = null;
    for (let z = Z0; z <= Z1 + 1e-6; z += GS) { const xl = REat(z) - 0.25;   // (from just under the road's edge: no gap; its edge 2 cm lower there, so the road stays on top)
      if (isNaN(xl) || XR - xl < 0.3) { prev = null; continue; }
      const base = pos.length / 3; for (const x of [xl, XR]) { pos.push(x, H.ground(x, z) + dy - (x === xl ? 0.02 : 0), z); uv.push(uvA[0][0] * x + uvA[0][1] * z + uvA[0][2], uvA[1][0] * x + uvA[1][1] * z + uvA[1][2]); nor.push(0, 1, 0); }
      if (prev !== null) idx.push(prev, base, prev + 1, prev + 1, base, base + 1); prev = base; }
    for (let t = 0; t < idx.length; t += 3) { const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3; if ((pos[c] - pos[a]) * (pos[b + 2] - pos[a + 2]) - (pos[b] - pos[a]) * (pos[c + 2] - pos[a + 2]) < 0) { const sw = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = sw; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
    const m = LOT.material.clone(), lb = LOT.material.onBeforeCompile, lk = LOT.material.customProgramCacheKey;
    // (the paving's own shader hook, without its cut-outs: its masks take the paving off by the roads, and the new surface must reach the road's edge)
    m.onBeforeCompile = function (sh, r) { if (lb && lb !== THREE.Material.prototype.onBeforeCompile) lb.call(this, sh, r); sh.fragmentShader = sh.fragmentShader.replace(/if \(nsk > 0\.5\) discard;/g, '').replace(/texture2D\(uT4, q\)\.r > 0\.5\) discard;/g, 'false) discard;'); };
    m.customProgramCacheKey = function () { return (lk ? lk.call(this) : '') + '|hl22f'; }; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; m.needsUpdate = true;   // (the road's own offset: over the fillet it lies higher and wins from the game's cameras too)
    const me = new THREE.Mesh(g, m); me.receiveShadow = true; me.renderOrder = LOT.renderOrder; me.userData.keep = true; G.add(me); out.lotTris = idx.length / 3;
    // (east of the wedge, along the lot's north edge: between the north road's kerb band and the lot's paving the grass showed from the game's
    //  cameras; a strip of the same surface under the band's outer edge (found from its terracotta ribbon, per half metre) and into the paving)
    const p2 = [], u2 = [], n2 = [], i2 = []; let pv = null;
    for (let k = Math.round(XR * 2) - 1; k <= 52; k++) { const zz = BO.get(k); if (zz === undefined) { pv = null; continue; } const x = k / 2, b0 = p2.length / 3;
      for (const z of zz) { p2.push(x, H.ground(x, z) + dy, z); u2.push(uvA[0][0] * x + uvA[0][1] * z + uvA[0][2], uvA[1][0] * x + uvA[1][1] * z + uvA[1][2]); n2.push(0, 1, 0); }
      if (pv !== null) i2.push(pv, b0, pv + 1, pv + 1, b0, b0 + 1); pv = b0; }
    for (let t = 0; t < i2.length; t += 3) { const a = i2[t] * 3, b = i2[t + 1] * 3, c = i2[t + 2] * 3; if ((p2[c] - p2[a]) * (p2[b + 2] - p2[a + 2]) - (p2[b] - p2[a]) * (p2[c + 2] - p2[a + 2]) < 0) { const sw = i2[t + 1]; i2[t + 1] = i2[t + 2]; i2[t + 2] = sw; } }
    if (i2.length) { const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(p2, 3)); g2.setAttribute('uv', new THREE.Float32BufferAttribute(u2, 2)); g2.setAttribute('normal', new THREE.Float32BufferAttribute(n2, 3)); g2.setIndex(i2);
      const m2 = new THREE.Mesh(g2, m); m2.receiveShadow = true; m2.renderOrder = LOT.renderOrder; m2.userData.keep = true; G.add(m2); }
    out.northTris = i2.length / 3;
    // (an unseen strip over the road's edge, for lotiso22's mask only: the grass sheets under the seam between road and lot are cut too)
    const p3 = [], i3 = []; let pw = null; for (let z = Z0; z <= 126 + 1e-6; z += GS) { const r = REat(z); if (isNaN(r)) { pw = null; continue; } const b0 = p3.length / 3; p3.push(r - 0.6, 0, z, r + 0.3, 0, z); if (pw !== null) i3.push(pw, b0, pw + 1, pw + 1, b0, b0 + 1); pw = b0; }
    if (i3.length) { const g3 = new THREE.BufferGeometry(); g3.setAttribute('position', new THREE.Float32BufferAttribute(p3, 3)); g3.setIndex(i3); const m3 = new THREE.Mesh(g3, new THREE.MeshBasicMaterial()); m3.visible = false; m3.name = 'hl22seam'; G.add(m3); } }
  // --- ln21's mask (the grass, sand, old paint layers cut): the wedge and the mouth painted into it
  const MX0 = -195, MZ0 = 20, MS = 0.25, MW = 840, MH = 520, TU = window.__LN21T; let mk = 0;
  if (TU && TU.value && TU.value.image && TU.value.image.data) { const A8 = TU.value.image.data;
    const fill = (x0, x1, z0, z1) => { const i0 = Math.max(0, Math.floor((x0 - MX0) / MS)), i1 = Math.min(MW - 1, Math.ceil((x1 - MX0) / MS)), j0 = Math.max(0, Math.floor((z0 - MZ0) / MS)), j1 = Math.min(MH - 1, Math.ceil((z1 - MZ0) / MS)); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { if (A8[j * MW + i] !== 255) { A8[j * MW + i] = 255; mk++; } } };
    for (let z = Z0 - 0.3; z <= 126; z += MS) { const xl = XL(z); if (isNaN(xl) || XRM - xl < 0.3) continue; fill(xl - 0.8, XRM, z, z + MS); }   // (south of the mouth over the road's east edge too: the sand on it)
    fill(-43.3, -33.9, 59.7, 62.8); for (const [k, zz] of BO) if (k / 2 >= XR - 0.5) fill(k / 2 - 0.25, k / 2 + 0.25, zz[0], zz[1]); TU.value.needsUpdate = true; }
  out.maskCells = mk;
  // --- what stands there taken away. A: in the wedge (x < -10.9, the lot's lamps east of it) and at the mouth everything small; B: the red-white
  // barriers, cones, tyres, barrels, the striped board by the road's east edge and on the lot (not the lamps: their places, where a tall pole
  // stands, kept); C: the barrels and the sign with its base on the north road at the mouth
  const inMouth = (x, z) => x > -43.3 && x < -33.8 && z > 59.6 && z < 63.0;   // (to the heliport's kerb end: the fence's last post and rail, the tiles there too)
  const zoneA = (x, z) => { if (inMouth(x, z)) return true; if (z < 60.0 || z > Z1) return false; const r = REat(z); return !isNaN(r) && x > r + 0.3 && x < -10.9; };
  const zoneB = (x, z) => { if (z < 60.0 || z > 142) return false; /* (on south of the wedge too, by the road's east edge: the cones there) */ const r = REat(z); return !isNaN(r) && x > r - 0.8 && x < XR; };
  const zoneC = (x, z) => x > -46.5 && x < -32.0 && z > 54.0 && z < 60.4;   // (to the barrels just west of the junction too: their shadow lay in the mark)
  const OVER = new Set(['nv-baked', 'edgeband', 'gr18', 'mk18', 'sea18', 'paint-beach', 'paint-oldsand', 'paint-sitedark', 'box20', 'kerbjoin', 'grassfill', 'stagegrass', 'trikerb', 'widek', 'notch', 'rimfill', 'xing6', 'terr', 'lawn3', 'filler', 'tpatch', 'jn', 'holes', 'bxp', 'apron', 'edge', 'mxsoft', 'sbeach2', 'ln21', 'fix21', 'hl22', 'gr21', 'ja21', 'ebrebuild', 'lanelines']);
  const top = (o) => { let p = o; while (p.parent && p.parent !== Render.scene) p = p.parent; return p; };
  let root = null; for (const c of Render.scene.children) if (c.name === 'nv-baked') root = c;
  let dropped = 0;
  if (root) { const byP = new Map(); root.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.index) return; const P = o.geometry.attributes.position; let e = byP.get(P); if (!e) byP.set(P, e = []); if (!e.includes(o.geometry.index)) e.push(o.geometry.index); });
    for (const [P, IL] of byP) { const n = P.count; let any = false; for (let i = 0; i < n && !any; i++) if (zoneA(P.getX(i), P.getZ(i))) any = true; if (!any) continue;
      const par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i; const f = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
      for (const I of IL) for (let t = 0; t < I.count; t += 3) { const a = I.getX(t), b = I.getX(t + 1), c = I.getX(t + 2); par[f(b)] = f(a); par[f(c)] = f(a); }
      const comp = new Map(); for (let i = 0; i < n; i++) { const r = f(i); let q = comp.get(r); if (!q) comp.set(r, q = { v: [], sx: 0, sz: 0, x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }); q.v.push(i); const x = P.getX(i), z = P.getZ(i); q.sx += x; q.sz += z; q.x0 = Math.min(q.x0, x); q.x1 = Math.max(q.x1, x); q.z0 = Math.min(q.z0, z); q.z1 = Math.max(q.z1, z); }
      let ch = 0; for (const q of comp.values()) { if (q.v.length < 3) continue; const cx = q.sx / q.v.length, cz = q.sz / q.v.length; if (!zoneA(cx, cz) || Math.max(q.x1 - q.x0, q.z1 - q.z0) > 9) continue; if (P.getY(q.v[0]) < -20) continue; for (const i of q.v) P.setY(i, P.getY(i) - 50); ch++; }
      if (ch) { P.needsUpdate = true; dropped += ch; } } }
  out.baked = dropped;
  const B = new THREE.Box3(), M = new THREE.Matrix4(), V = new THREE.Vector3(), Z3 = new THREE.Vector3(0, 0, 0); let hid = 0, inst = 0;
  // (the tall places: where any instance stands more than 2.5 m above the ground - the lamps' poles; zone B keeps every instance there)
  const tall = new Set(), key = (x, z) => Math.round(x * 4) + ',' + Math.round(z * 4);
  Render.scene.traverse(o => { if (!o.isInstancedMesh || !o.geometry.attributes.position) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); M.premultiply(o.matrixWorld); B.copy(g.boundingBox).applyMatrix4(M); B.getCenter(V); if (!(V.x > -46 && V.x < 2 && V.z > 52 && V.z < 108)) continue;
      if (B.max.y - H.ground(V.x, V.z) > 2.5) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) tall.add((Math.round(V.x * 4) + a) + ',' + (Math.round(V.z * 4) + b)); } });
  const hidList = []; Render.scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || OVER.has(top(o).name) || o.userData.__hl22gone) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
    if (o.isInstancedMesh) { let c = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); const M0 = M.clone(); M.premultiply(o.matrixWorld); B.copy(g.boundingBox).applyMatrix4(M); B.getCenter(V); const e = Math.max(B.max.x - B.min.x, B.max.z - B.min.z); if (e > 9 || B.max.x - B.min.x < 1e-5) continue;
        const kA = zoneA(V.x, V.z), kB = zoneB(V.x, V.z) && !tall.has(key(V.x, V.z)), kC = zoneC(V.x, V.z); if (!(kA || kB || kC)) continue; M0.scale(Z3); o.setMatrixAt(i, M0); c++; }
      if (c) { o.instanceMatrix.needsUpdate = true; inst += c; } return; }
    { const tp = top(o); if (Math.abs(tp.position.x) + Math.abs(tp.position.z) > 0.01) return; }   // (vehicles: their own groups placed where they drive - never taken)
    B.copy(g.boundingBox).applyMatrix4(o.matrixWorld); B.getCenter(V); if (!isFinite(V.x) || !isFinite(V.z)) return; const e = Math.max(B.max.x - B.min.x, B.max.z - B.min.z);
    const hy = () => B.max.y - H.ground(V.x, V.z);
    if ((zoneA(V.x, V.z) && e <= 9) || (zoneB(V.x, V.z) && e <= 3 && !tall.has(key(V.x, V.z)) && hy() < 2.5) || (zoneC(V.x, V.z) && e <= 2.5 && hy() > 0.15)) { o.visible = false; o.scale.set(0, 0, 0); o.updateMatrix(); o.updateMatrixWorld(true); o.userData.__hl22gone = true; hid++; if (hidList.length < 40) hidList.push('n' + g.attributes.position.count + '@' + V.x.toFixed(1) + ',' + V.z.toFixed(1)); } });   // (scaled to nothing too: the game's own culling and detail switches turn meshes visible again)
  out.meshes = hid; out.instances = inst; out.hid = hidList.join(' ');
  let np = 0; for (const b of ((window.__game && __game.race && __game.race.props) || [])) { if (b.hidden) continue; if (zoneA(b.x, b.z) || zoneB(b.x, b.z) || zoneC(b.x, b.z)) { b.hidden = true; np++; } } out.props = np;
  // --- the tile strip along the north road's south edge (a baked mesh) cut at the mouth (its own material, a discard in the mouth's rectangle)
  let cutN = 0; if (root) root.traverse(o => { if (!o.isMesh || nv(o) !== 1788 || !hasXZ(o, -30.4, 59.5) || o.userData.__hl22b) return; o.userData.__hl22b = true; if (o.userData.__hl22m) o.material = o.userData.__hl22m; o.userData.__hl22m = o.material;
    const m0 = o.material, m = m0.clone(), prev = m0.onBeforeCompile, ck = m0.customProgramCacheKey;
    m.onBeforeCompile = function (sh, r) { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(this, sh, r);
      sh.vertexShader = 'varying vec2 vHL22w;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vHL22w = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = 'varying vec2 vHL22w;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  if (vHL22w.x > -43.4 && vHL22w.x < -33.8 && vHL22w.y > 58.9 && vHL22w.y < 61.9) discard;'); };
    m.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + '|hl22'; }; m.needsUpdate = true; o.material = m; cutN++; });
  out.tileCut = cutN;
  window.__HL22 = out;
  return 'HL22 ' + JSON.stringify(out); })()
