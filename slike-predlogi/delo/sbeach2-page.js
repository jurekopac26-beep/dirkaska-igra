(() => {
  // (pictures only) the user: "Naj bo tudi mivka ob progi enaka kot je plaža ... 3 različne opcije", and then (on the far west hairpin): "Tukaj naj ostane
  // prejšnja verzija mivke, ker smo daleč od morja in je tukaj drugačna. Počasi se spreminja: bolj ko je oddaljena od morja, bolj je podobna tej mivki na
  // tem zavoju. Prehod naj bo dolg in mehak."
  // So the run-offs' sand (the makadam's sand along the roads: H3.roHit in the baked cells, the run-offs' colour in the pictures' own meshes; not the gravel
  // ways' middles) keeps its old look, and over it lies the beach's sand (its own colour as it shows), opaque by the sea and fading out with the distance
  // from the beach, softly (smoothstep), over a long way (window.__SB2(k)):
  //  0 over the whole map: the beach's sand by the sea, half by the middle, the old sand only at the far west edge (10-480 m from the beach)
  //  1 the beach's sand up to 80 m from the beach, then fading to the old by 360 m (the west third the old sand)
  //  2 the beach's sand only by the sea (30 m), fading to the old by 240 m (the west half the old sand)
  //  -1 as before (the old sand everywhere)
  const H = window.__H3, sc = Render.scene, out = {}; sc.updateMatrixWorld(true);
  if (window.__SBEACH) { window.__SBEACH(-1); if (window.__SBROOT) sc.remove(window.__SBROOT); window.__SBEACH = null; }
  if (window.__SB2ROOT) sc.remove(window.__SB2ROOT);
  const ROOT = new THREE.Group(); ROOT.name = 'sbeach2'; ROOT.userData.keep = true; sc.add(ROOT); window.__SB2ROOT = ROOT;
  const MKI = Tex.all().makadam.image, BE = [0.543, 0.463, 0.343];   // (the beach's colour as it shows: most of it lies 0.1-0.2 m over the water)
  if (!H.roHit) return 'no roHit';
  // the gravel ways' firm middles (they stay makadam, no beach over them)
  const CELL = 8, SG = new Map(), key = (i, j) => i * 100003 + j;
  for (const e of H.net || []) { if (!e.P || e.P.length < 2 || e.P[0][0] < -5000 || !(e.kind === 'dirt' || e.kind === 'forest')) continue; const r = Math.max(0.8, e.hw - 0.6);
    for (let k = 0; k < e.P.length - 1; k++) { const [ax, az] = e.P[k], [bx, bz] = e.P[k + 1];
      for (let i = Math.floor((Math.min(ax, bx) - r) / CELL); i <= Math.floor((Math.max(ax, bx) + r) / CELL); i++) for (let j = Math.floor((Math.min(az, bz) - r) / CELL); j <= Math.floor((Math.max(az, bz) + r) / CELL); j++) { const kk = key(i, j); let L = SG.get(kk); if (!L) SG.set(kk, L = []); L.push([ax, az, bx, bz, r]); } } }
  const onWay = (x, z) => { const L = SG.get(key(Math.floor(x / CELL), Math.floor(z / CELL))); if (!L) return false; for (const [ax, az, bx, bz, r] of L) { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), ex = ax + dx * t - x, ez = az + dz * t - z; if (ex * ex + ez * ez < r * r) return true; } return false; };
  // ---- the distance from the beach: its vertices (beachSet's C.userData.orig) stamped on a 4 m grid, a chamfer distance over it
  const V = new THREE.Vector3(), G0 = [-420, -470], GC = 4, GW = 210, GH = 210, D = new Float32Array(GW * GH).fill(1e9); let nB = 0;
  const seenC = new Set(); sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || o.parent === ROOT) return; const C = o.geometry.attributes.color; if (!C || !C.userData || !C.userData.orig || seenC.has(C)) return; seenC.add(C);
    const Pa = o.geometry.attributes.position, e = o.matrixWorld, id = e.equals(new THREE.Matrix4()), K = C.userData.orig; for (let q = 0; q < K.length; q += 2) { V.fromBufferAttribute(Pa, K[q]); if (!id) V.applyMatrix4(e); const i = Math.round((V.x - G0[0]) / GC), j = Math.round((V.z - G0[1]) / GC); if (i >= 0 && j >= 0 && i < GW && j < GH) { D[j * GW + i] = 0; nB++; } } });
  for (let pass = 0; pass < 2; pass++) { for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const q = j * GW + i; let d = D[q]; if (i > 0) d = Math.min(d, D[q - 1] + GC); if (j > 0) { d = Math.min(d, D[q - GW] + GC); if (i > 0) d = Math.min(d, D[q - GW - 1] + GC * 1.4142); if (i < GW - 1) d = Math.min(d, D[q - GW + 1] + GC * 1.4142); } D[q] = d; }
    for (let j = GH - 1; j >= 0; j--) for (let i = GW - 1; i >= 0; i--) { const q = j * GW + i; let d = D[q]; if (i < GW - 1) d = Math.min(d, D[q + 1] + GC); if (j < GH - 1) { d = Math.min(d, D[q + GW] + GC); if (i < GW - 1) d = Math.min(d, D[q + GW + 1] + GC * 1.4142); if (i > 0) d = Math.min(d, D[q + GW - 1] + GC * 1.4142); } D[q] = d; } }
  const dBeach = (x, z) => { const fx = (x - G0[0]) / GC, fz = (z - G0[1]) / GC, i = Math.max(0, Math.min(GW - 2, Math.floor(fx))), j = Math.max(0, Math.min(GH - 2, Math.floor(fz))), u = Math.max(0, Math.min(1, fx - i)), v = Math.max(0, Math.min(1, fz - j)); const a = D[j * GW + i], b = D[j * GW + i + 1], c = D[(j + 1) * GW + i], d = D[(j + 1) * GW + i + 1]; return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v; };
  window.__SB2D = dBeach; out.beachCells = nB;
  // ---- the beach's sand over the run-offs: their triangles copied (world positions, normals), the beach's colour, alpha = their own alpha x the fade
  const roCol = (C, i) => { if (!C) return false; const r = C.getX(i), g = C.getY(i), b = C.getZ(i); return r >= 0.98 && r >= g && g >= b && r - b >= 0.03 && r - b <= 0.14; };
  const baked = (o) => { for (let p = o.parent; p; p = p.parent) if (p.name === 'nv-baked') return true; return false; };
  const mk = []; sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position || o.parent === ROOT) return; let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) vis = false; if (!vis) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.map && m.map.image === MKI) mk.push(o); });
  const flags = new Map(), N3 = new THREE.Matrix3(), made = []; let nT = 0;
  const mat = (ro) => { const m = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); return m; }, M0 = mat();
  for (const o of mk) { const g = o.geometry, I = g.index, Pa = g.attributes.position, Na = g.attributes.normal, Ca = g.attributes.color, bk = baked(o), e = o.matrixWorld, id = e.equals(new THREE.Matrix4()); if (!I) continue; N3.getNormalMatrix(e);
    let F = flags.get(Pa); if (!F) { F = new Uint8Array(Pa.count); for (let i = 0; i < Pa.count; i++) { V.fromBufferAttribute(Pa, i); if (!id) V.applyMatrix4(e); F[i] = (bk ? H.roHit(V.x, V.z) : roCol(Ca, i)) && !onWay(V.x, V.z) ? 1 : 0; } flags.set(Pa, F); }
    const A = I.array, P = [], NN = [], A0 = [], DD = []; let n = 0;
    for (let t = 0; t + 2 < I.count; t += 3) { const a = A[t], b = A[t + 1], c = A[t + 2]; if (a === b && b === c) continue; if (!(F[a] && F[b] && F[c])) continue;
      for (const v of [a, b, c]) { V.fromBufferAttribute(Pa, v); if (!id) V.applyMatrix4(e); P.push(V.x, V.y, V.z); DD.push(dBeach(V.x, V.z)); A0.push(Ca && Ca.itemSize === 4 ? Ca.getW(v) : 1); if (Na) { V.fromBufferAttribute(Na, v); if (!id) V.applyMatrix3(N3).normalize(); NN.push(V.x, V.y, V.z); } else NN.push(0, 1, 0); } n++; }
    if (!n) continue; nT += n;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(NN, 3)); const C = new Float32Array(P.length / 3 * 4); for (let i = 0; i < P.length / 3; i++) { C[i * 4] = BE[0]; C[i * 4 + 1] = BE[1]; C[i * 4 + 2] = BE[2]; C[i * 4 + 3] = 0; } geo.setAttribute('color', new THREE.BufferAttribute(C, 4));
    geo.userData.a0 = new Float32Array(A0); geo.userData.d = new Float32Array(DD); const me = new THREE.Mesh(geo, M0); me.renderOrder = o.renderOrder + 0.5; me.receiveShadow = true; me.userData.keep = true; ROOT.add(me); made.push(me); }
  out.overlay = { tris: nT, meshes: made.length, from: mk.length };
  const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const FADE = [[10, 480], [80, 360], [30, 240]];
  window.__SB2 = (k) => { if (k < 0) { ROOT.visible = false; return -1; } ROOT.visible = true; const [d0, d1] = FADE[k];
    for (const me of made) { const g = me.geometry, C = g.attributes.color, a0 = g.userData.a0, d = g.userData.d; for (let i = 0; i < d.length; i++) C.array[i * 4 + 3] = a0[i] * (1 - sst(d0, d1, d[i])); C.needsUpdate = true; }
    return k; };
  window.__SB2(0); return JSON.stringify(out); })()
