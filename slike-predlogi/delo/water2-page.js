(() => {
  // (pictures only) the user (a red circle where the jet-ski canal meets the sea beside the ring road): "Popravi vodo". The lagoon's and the canal's
  // floor, shore and water were cells of 1 m (stairs along every bank), the canal widened in one step at x 168 and ended in a round cap short of the
  // sea, and where jetski-page folded the ground round the water (any proposal's) its big triangles left holes: the sea's surface (under the land)
  // showed through as light blue wedges. Now, for the lagoon (proposal 0), window.__W2(1) (0: as before):
  //  - the floor one continuous height field: under the water level on the water, through it at the shore, up to the land 2 m in, so the water's edge
  //    is where the floor meets the level (no stairs); its colours the sea bed's by depth (the canal runs into the sea without a seam), the shore sand
  //    fading into the land;
  //  - the land round it laid again where it had been folded: the meadow in its own material (colours read off its vertices), by the sea the beach
  //    (its colours), blended where they meet; the beach's sand folded where the canal now cuts through it to the sea;
  //  - the canal widening smoothly (from 7.5 to 13.5 m) and running on into the sea;
  //  - one water surface (the sea's material), drawn before the sea's own and writing depth, so the two never lie over each other (no darker band)
  const H = window.__H3, sc = Render.scene, TX = Tex.all(), out = {}; sc.updateMatrixWorld(true);
  const JR = window.__JETROOT, W = H.water; if (!JR || !W) return 'no jet/water';
  if (window.__W2) window.__W2(0); if (window.__W2ROOT) sc.remove(window.__W2ROOT);
  const ROOT = new THREE.Group(); ROOT.name = 'water2'; ROOT.userData.keep = true; sc.add(ROOT); window.__W2ROOT = ROOT;
  const WL = W.WL, gnd = (x, z) => H.ground(x, z), sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const matOf = (o) => Array.isArray(o.material) ? o.material[0] : o.material;
  // ---- jetski-page's shapes (the same), the canal new
  const polyD = (P, x, z) => { let b = 1e9; for (let i = 1; i < P.length; i++) { const [ax, az] = P[i - 1], [bx, bz] = P[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (l2 || 1))), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < b) b = d; } return b; };
  const inPoly = (PG, x, z) => { let c = false; for (let i = 0, j = PG.length - 1; i < PG.length; j = i++) { const [xi, zi] = PG[i], [xj, zj] = PG[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const segD = (PG, x, z) => { let b = 1e9; for (let i = 0; i < PG.length; i++) { const [ax, az] = PG[i], [bx, bz] = PG[(i + 1) % PG.length], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); b = Math.min(b, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return b; };
  const sdPoly = (PG, x, z) => (inPoly(PG, x, z) ? -1 : 1) * segD(PG, x, z);
  const curve = (pts, closed, n) => { const cv = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), closed, 'centripetal'), o = []; for (let i = 0; i <= n; i++) { const q = cv.getPointAt(i / n); o.push([q.x, q.z]); } return o; };
  const NR = H.roads.nord, NP = NR.P2.map(p => [p.x, p.z]), NHW = NR.wd / 2, dN = (x, z) => polyD(NP, x, z) - NHW;
  const KP = (H.kartPts || []).map(p => Array.isArray(p) ? p : [p.x, p.z]);
  const LAG = curve([[-178, 206], [-170, 184], [-140, 176], [-100, 180], [-60, 190], [-20, 196], [10, 182], [50, 176], [90, 182], [118, 196], [116, 222], [90, 236], [50, 234], [12, 222], [-20, 212], [-60, 222], [-100, 236], [-140, 236], [-170, 228]], true, 300);
  const RIV = KP.length > 4 ? curve(KP, true, 500) : LAG, MAR = [[-70, 174], [112, 174], [118, 180], [118, 232], [112, 238], [-70, 238], [-76, 232], [-76, 180]];
  const CANo = curve([[100, 206], [116, 200], [128, 191], [140, 183], [152, 176], [166, 170], [180, 166]], false, 120);
  const CAN = curve([[100, 206], [116, 200], [128, 191], [140, 183], [152, 176], [166, 170], [180, 166], [196, 162], [216, 158]], false, 170), CWx = (x) => 7.5 + 6 * sst(156, 188, x);
  const ISL = [[[-128, 206], 11], [[62, 207], 10]];
  const SDo = [(x, z) => sdPoly(LAG, x, z), (x, z) => polyD(RIV, x, z) - 8.0, (x, z) => sdPoly(MAR, x, z)];
  const wOld = (k, x, z) => { let d = Math.min(SDo[k](x, z), polyD(CANo, x, z) - 7.5 + (x > 168 ? -6 : 0)); if (k === 0) for (const [[cx, cz], r] of ISL) if (Math.hypot(x - cx, z - cz) < r) d = Math.max(d, r - Math.hypot(x - cx, z - cz)); return d; };
  const uni = (x, z) => Math.min(wOld(0, x, z), wOld(1, x, z), wOld(2, x, z));
  const d0 = (x, z) => { let d = Math.min(SDo[0](x, z), polyD(CAN, x, z) - CWx(x)); for (const [[cx, cz], r] of ISL) { const q = Math.hypot(x - cx, z - cz); if (q < r + 2) d = Math.max(d, r - q); } return d; };
  // the sea's bed: underwater there already (beyond the beach): the canal's floor not drawn over it
  const TL = H.TL, w = __game.race.track.w, eOf = (x, z) => TL.dist(x, z, 80) - w, seaWet = (x, z) => W.region(x, z) && W.hgtB(eOf(x, z)) < WL - 0.03;
  // ---- the grid (1 m) and what lay there: the meadow's colours (its vertices, folded or not), the beach's (its vertices above the water), on 2 m cells
  const X0 = -198, X1 = 226, Z0 = 122, Z1 = 252, S = 1, NX = Math.round((X1 - X0) / S), NZ = Math.round((Z1 - Z0) / S), NV = (NX + 1) * (NZ + 1);
  const GC = 2, GW = Math.ceil((X1 - X0) / GC) + 2, GH = Math.ceil((Z1 - Z0) / GC) + 2, accG = new Float32Array(GW * GH * 4), accB = new Float32Array(GW * GH * 4);
  const cellOf = (x, z) => { const a = Math.floor((x - X0) / GC), b = Math.floor((z - Z0) / GC); return a < 0 || b < 0 || a >= GW || b >= GH ? -1 : b * GW + a; };
  let GM = null; const V3 = new THREE.Vector3();
  // (a vertex is the beach's if beachSet coloured it (C.userData.orig, also on the meadow's cells by the sea), the meadow's if its mesh has the grass
  // texture and it is not the beach's; the colour attributes are shared by the baked cells: each read once)
  const seenC = new Set(), origF = (C) => { if (!C.userData || !C.userData.orig) return null; if (!C.userData.origF) { const F = new Uint8Array(C.count), K = C.userData.orig; for (let q = 0; q < K.length; q += 2) F[K[q]] = 1; C.userData.origF = F; } return C.userData.origF; };
  sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.userData.keep || !o.geometry) return; const m = matOf(o), g = o.geometry, P = g.attributes.position, C = g.attributes.color; if (!P || !C || !m) return;
    const isG = !!(m.map && TX.grass && m.map.image === TX.grass.image && m.vertexColors), OF = origF(C); if (!isG && !OF) return; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < X0 || bb.min.x > X1 || bb.max.z < Z0 || bb.min.z > Z1) return;
    if (isG && !GM) GM = o; if (seenC.has(C)) return; seenC.add(C); const e = o.matrixWorld, id = e.equals(new THREE.Matrix4());
    for (let i = 0; i < P.count; i++) { const inB = OF && OF[i]; if (!inB && !isG) continue; V3.fromBufferAttribute(P, i); if (!id) V3.applyMatrix4(e); const c = cellOf(V3.x, V3.z); if (c < 0) continue; if (inB && V3.y < WL + 0.02) continue; const A = inB ? accB : accG; A[c * 4] += C.getX(i); A[c * 4 + 1] += C.getY(i); A[c * 4 + 2] += C.getZ(i); A[c * 4 + 3]++; } });
  out.samples = [accG.filter((v, i) => i % 4 === 3).reduce((a, b) => a + b, 0), accB.filter((v, i) => i % 4 === 3).reduce((a, b) => a + b, 0), !!GM];
  // (the meadow's uv: read off its vertices, u = a x + b, v = c z + d)
  let UVF = (x, z) => [x / 14, -z / 14]; if (GM) { const g = GM.geometry, P = g.attributes.position, U = g.attributes.uv; if (U && P.count > 10) { const i1 = 0, i2 = Math.floor(P.count / 2), xa = P.getX(i1), xb = P.getX(i2), za = P.getZ(i1), zb = P.getZ(i2); if (Math.abs(xb - xa) > 1 && Math.abs(zb - za) > 1) { const a = (U.getX(i2) - U.getX(i1)) / (xb - xa), b = U.getX(i1) - a * xa, c = (U.getY(i2) - U.getY(i1)) / (zb - za), d = U.getY(i1) - c * za; UVF = (x, z) => [a * x + b, c * z + d]; out.uv = [a, b, c, d].map(v => +v.toFixed(4)); } } }
  // averages, the empty cells filled from their neighbours; the beach's share (blurred) for the blend
  const fill = (A) => { const M = new Float32Array(GW * GH * 3), has = new Uint8Array(GW * GH); for (let c = 0; c < GW * GH; c++) if (A[c * 4 + 3]) { for (let j = 0; j < 3; j++) M[c * 3 + j] = A[c * 4 + j] / A[c * 4 + 3]; has[c] = 1; }
    for (let it = 0; it < 60; it++) { let todo = 0; const nh = has.slice(), nm = M.slice(); for (let b = 0; b < GH; b++) for (let a = 0; a < GW; a++) { const c = b * GW + a; if (has[c]) continue; let s = [0, 0, 0], n = 0; for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const aa = a + da, bb = b + db; if (aa < 0 || bb < 0 || aa >= GW || bb >= GH) continue; const q = bb * GW + aa; if (!has[q]) continue; for (let j = 0; j < 3; j++) s[j] += M[q * 3 + j]; n++; } if (n) { for (let j = 0; j < 3; j++) nm[c * 3 + j] = s[j] / n; nh[c] = 1; } else todo++; } M.set(nm); has.set(nh); if (!todo) break; } return M; };
  const MG = fill(accG).map((v, i) => v * [1.1, 1.13, 0.82][i % 3]), MB = fill(accB), SH = new Float32Array(GW * GH); for (let b = 0; b < GH; b++) for (let a = 0; a < GW; a++) SH[b * GW + a] = W.region(X0 + (a + 0.5) * GC, Z0 + (b + 0.5) * GC) ? 1 : 0;
  { let todo = true, it = 0; while (todo && it < 60) { todo = false; it++; const nx = SH.slice(); for (let b = 0; b < GH; b++) for (let a = 0; a < GW; a++) { const c = b * GW + a; if (SH[c] >= 0) continue; let s = 0, n = 0; for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = (b + db) * GW + a + da; if (a + da < 0 || b + db < 0 || a + da >= GW || b + db >= GH || SH[q] < 0) continue; s += SH[q]; n++; } if (n) nx[c] = s / n; else todo = true; } SH.set(nx); } }
  const SB = SH.slice(); for (let r = 0; r < 2; r++) { const t = SB.slice(); for (let b = 1; b < GH - 1; b++) for (let a = 1; a < GW - 1; a++) { let s = 0; for (let db = -1; db <= 1; db++) for (let da = -1; da <= 1; da++) s += t[(b + db) * GW + a + da]; SB[b * GW + a] = s / 9; } }
  const bil = (M, n, x, z) => { const fx = Math.max(0, Math.min(GW - 1.001, (x - X0) / GC - 0.5)), fz = Math.max(0, Math.min(GH - 1.001, (z - Z0) / GC - 0.5)), a = Math.floor(fx), b = Math.floor(fz), u = fx - a, v = fz - b, o = []; for (let j = 0; j < n; j++) { const q = (k) => M[k * n + j]; o.push((q(b * GW + a) * (1 - u) + q(b * GW + a + 1) * u) * (1 - v) + (q((b + 1) * GW + a) * (1 - u) + q((b + 1) * GW + a + 1) * u) * v); } return o; };
  // (the beach's own surface where the canal now cuts it: its facets (2.5 m cells) lie up to several cm off its smooth profile by the water, so the land
  // laid here takes its height from them, read straight down (before they are folded))
  const bedM = []; { const BX = [128, 228, 120, 216]; sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.userData.keep || !o.geometry) return; const C = o.geometry.attributes.color; if (!C || !C.userData || !C.userData.orig) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < BX[0] || bb.min.x > BX[1] || bb.max.z < BX[2] || bb.min.z > BX[3]) return; bedM.push(o); }); }
  const rcB = new THREE.Raycaster(), bedY = (x, z) => { rcB.set(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0)); rcB.far = 40; const h = rcB.intersectObjects(bedM, false)[0]; return h ? h.point.y : null; };
  out.bedMeshes = bedM.length;
  // ---- per vertex: the distance to the water, the land's kind and height, the surface's height
  // (round the mouth (the user's circle, 34 m round (178, 168), out to 44 m) the sea's own coast is laid the same way: its bed's cells end in stairs
  // there, so the bed is folded in that zone and the floor (the sea's bed, its own heights) and a sandy shore along the sea's edge are laid instead;
  // the distance to the water there the nearer of the canal's and the sea's)
  const ZC = [178, 168], zoneW = (x, z) => 1 - sst(34, 44, Math.hypot(x - ZC[0], z - ZC[1]));
  const D = new Float32Array(NV), D0 = new Float32Array(NV), U0 = new Float32Array(NV), WB = new Float32Array(NV), HY = new Float32Array(NV), SW = new Uint8Array(NV), LY = new Float32Array(NV), BEDY = new Float32Array(NV), ZW = new Float32Array(NV);
  for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) { const q = i * (NZ + 1) + j, x = X0 + i * S, z = Z0 + j * S; D0[q] = d0(x, z); U0[q] = uni(x, z); ZW[q] = zoneW(x, z);
    const wb = Math.max(0, Math.min(1, (bil(SB, 1, x, z)[0] - 0.25) / 0.5)); WB[q] = wb; const inR = W.region(x, z), e = inR ? eOf(x, z) : 99, bY = inR && x > 128 && x < 228 && z > 120 && z < 216 ? bedY(x, z) : null, bedH = inR ? Math.max(W.hgtB(e), bY === null ? -1e9 : bY) : -1e9, landB = inR ? bedH + 0.015 : gnd(x, z) + 0.03, landG = gnd(x, z) + 0.03;
    LY[q] = landG * (1 - wb) + landB * wb; BEDY[q] = bedH; SW[q] = inR && Math.min(W.hgtB(e), bY === null ? 1e9 : bY) < WL - 0.03 ? 1 : 0; }
  // (the signed distance to the sea's water on the grid, by chamfer: negative in it)
  const dSea = new Float32Array(NV); { const inf = 1e6, dIn = new Float32Array(NV).fill(inf), dOut = new Float32Array(NV).fill(inf); for (let q = 0; q < NV; q++) { if (SW[q]) dOut[q] = 0; else dIn[q] = 0; }
    const pass = (A) => { const n1 = NZ + 1; for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) { const q = i * n1 + j; let d = A[q]; if (i > 0) d = Math.min(d, A[q - n1] + 1); if (j > 0) d = Math.min(d, A[q - 1] + 1); if (i > 0 && j > 0) d = Math.min(d, A[q - n1 - 1] + 1.414); if (i > 0 && j < NZ) d = Math.min(d, A[q - n1 + 1] + 1.414); A[q] = d; }
      for (let i = NX; i >= 0; i--) for (let j = NZ; j >= 0; j--) { const q = i * n1 + j; let d = A[q]; if (i < NX) d = Math.min(d, A[q + n1] + 1); if (j < NZ) d = Math.min(d, A[q + 1] + 1); if (i < NX && j < NZ) d = Math.min(d, A[q + n1 + 1] + 1.414); if (i < NX && j > 0) d = Math.min(d, A[q + n1 - 1] + 1.414); A[q] = d; } };
    pass(dOut); pass(dIn); for (let q = 0; q < NV; q++) dSea[q] = SW[q] ? -(dIn[q] - 0.5) : dOut[q] - 0.5; }
  for (let q = 0; q < NV; q++) { const d0q = D0[q], d = ZW[q] > 0.5 ? Math.min(d0q, dSea[q]) : d0q, landY = LY[q]; D[q] = d;
    const rise = (WL - 0.05) + (landY - (WL - 0.05)) * (1 - Math.pow(1 - Math.min(1, d / 2), 2)), canal = WL - Math.min(2.6, 0.05 + Math.max(0, -d0q) * 0.42);
    // (the canal's bed: its depth profile; in the sea the sea's own bed, the canal cut into it as a channel; on the land a shore up to the land, over
    // the water level at once)
    if (SW[q]) HY[q] = d0q < 0 ? Math.min(canal, BEDY[q] + 0.015) : BEDY[q] + 0.015;
    else HY[q] = d <= 0 ? canal : d < 2 ? (landY > WL + 0.07 ? Math.max(rise, WL - 0.05 + Math.min(0.12, 1.2 * d)) : rise) : landY; }
  const cA = new THREE.Color(0xd9c08f), cB = new THREE.Color(0x7d8a5e), cC = new THREE.Color(0x2b5566), cD = new THREE.Color(0x163746), cc = new THREE.Color(), wetS = new THREE.Color(0.55, 0.47, 0.34), dryS = new THREE.Color(0.74, 0.64, 0.47), bcol = new THREE.Color();
  const floorCol = (q, x, z) => { const d = D[q], dep = WL - HY[q]; if (dep > 0.01) { if (dep < 0.35) cc.copy(cA).lerp(cB, dep / 0.35); else if (dep < 1.6) cc.copy(cB).lerp(cC, (dep - 0.35) / 1.25); else cc.copy(cC).lerp(cD, Math.min(1, (dep - 1.6) / 2.5)); return [cc.r, cc.g, cc.b, 1 - sst(2.8, 3.8, d)]; }
    cc.copy(wetS).lerp(dryS, sst(0, 1.3, Math.max(0, d))); const b = bil(MB, 3, x, z); bcol.setRGB(b[0], b[1], b[2]); cc.lerp(bcol, WB[q] * sst(0.2, 1.4, d)); return [cc.r, cc.g, cc.b, 1 - sst(2.8, 3.8, d)]; };
  // (the land laid again: opaque where it had been folded (any proposal's water 3.5 m round; the beach cut by the canal now, 6 m round), fading out
  // over the next 2.5 m onto what was never folded)
  const inMouth = (x, z) => x > 140 && x < 216 && z > 140 && z < 200, LA = new Float32Array(NV);
  for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) { const q = i * (NZ + 1) + j, x = X0 + i * S, z = Z0 + j * S; LA[q] = Math.max(1 - sst(3.5, 6, U0[q]), inMouth(x, z) ? 1 - sst(6, 8.5, D[q]) : 0, sst(0.35, 0.55, ZW[q])); }
  // ---- meshes from the grid: a cell kept if keep(its four vertex indices); per-vertex attributes from fns
  const build = (keep, fns, mat, ro) => { const pos = [], col = [], uv = [], idx = [], vid = new Int32Array(NV).fill(-1), csz = fns.csz || 3;
    const vx = (i, j) => { const q = i * (NZ + 1) + j; if (vid[q] >= 0) return vid[q]; const x = X0 + i * S, z = Z0 + j * S; vid[q] = pos.length / 3; pos.push(x, fns.y(q, x, z), z); if (fns.col) col.push(...fns.col(q, x, z).slice(0, csz)); if (fns.uv) uv.push(...fns.uv(x, z)); return vid[q]; };
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const q = [i * (NZ + 1) + j, (i + 1) * (NZ + 1) + j, (i + 1) * (NZ + 1) + j + 1, i * (NZ + 1) + j + 1]; if (!keep(q, i, j)) continue; const a = vx(i, j), b = vx(i + 1, j), c = vx(i + 1, j + 1), d = vx(i, j + 1); idx.push(a, c, b, a, d, c); }
    if (!idx.length) return null; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); if (col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(col, csz)); if (uv.length) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    if (g.attributes.normal.getY(0) < 0) { const I = g.index; for (let t = 0; t < I.count; t += 3) { const s2 = I.getX(t + 1); I.setX(t + 1, I.getX(t + 2)); I.setX(t + 2, s2); } g.computeVertexNormals(); }
    const me = new THREE.Mesh(g, mat); me.receiveShadow = true; me.renderOrder = ro || 0; me.userData.keep = true; ROOT.add(me); return me; };
  const anyQ = (q, f) => q.some(f), allQ = (q, f) => q.every(f);
  // the land laid again: where any proposal's water had folded it (and 6 m round), where this one has land; not on the ring road
  const landish = (q) => allQ(q, k => D[k] > 1.6), offRoad = (q, i, j) => { const x = X0 + (i + 0.5) * S, z = Z0 + (j + 0.5) * S; return dN(x, z) > 0.3 && !(H.roHit && H.roHit(x, z) && ZW[q[0]] > 0.01); };
  const GMm = GM ? matOf(GM).clone() : new THREE.MeshLambertMaterial({ map: TX.grass, vertexColors: true }); Object.assign(GMm, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const GMt = GMm.clone(); Object.assign(GMt, { transparent: true, depthWrite: false });
  const mGrass = build((q, i, j) => allQ(q, k => LA[k] >= 0.999) && landish(q) && offRoad(q, i, j) && allQ(q, k => !SW[k]), { y: (q) => HY[q], col: (q, x, z) => bil(MG, 3, x, z), uv: UVF }, GMm, 0);
  const mGrassF = build((q, i, j) => anyQ(q, k => LA[k] > 0.001) && !allQ(q, k => LA[k] >= 0.999) && landish(q) && offRoad(q, i, j) && allQ(q, k => !SW[k]), { y: (q) => HY[q] + 0.004, col: (q, x, z) => bil(MG, 3, x, z).concat([LA[q]]), uv: UVF, csz: 4 }, GMt, 0.5);
  const BMm = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 });
  const mBeach = build((q, i, j) => anyQ(q, k => LA[k] > 0.001) && landish(q) && offRoad(q, i, j) && anyQ(q, k => WB[k] > 0.01) && allQ(q, k => !SW[k]), { y: (q) => HY[q] + 0.006, col: (q, x, z) => bil(MB, 3, x, z).concat([WB[q] * LA[q]]), csz: 4 }, BMm, 0.6);
  // the floor: its body with the shore's sand out to 2.8 m (opaque: it writes depth, so the water drawn later never lies over the sand) and the sand's
  // fading edge (2.8-3.8 m, on the land, where no water reaches); in the sea the canal's bed follows the sea's (it lies under it there)
  const FMo = new THREE.MeshLambertMaterial({ vertexColors: true }), FMt = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -4 });
  const mFloor = build((q) => allQ(q, k => D[k] < 2.8), { y: (q) => HY[q], col: floorCol }, FMo, 0);
  const mShore = build((q) => anyQ(q, k => D[k] < 3.8) && !allQ(q, k => D[k] < 2.8), { y: (q) => HY[q] + 0.005, col: floorCol, csz: 4 }, FMt, 1);
  // the water: one surface over the lagoon, the canal and on into the sea (drawn before the sea's own, writing depth: never both)
  let WM = null; sc.traverse(o => { if (WM || !o.isMesh || o.userData.keep) return; const m = matOf(o), g = o.geometry; if (!m || !g || !g.attributes.position || !m.transparent || g.attributes.position.count > 64) return; if (!g.boundingBox) g.computeBoundingBox(); if (Math.abs(g.boundingBox.max.y - WL) < 0.3 && g.boundingBox.max.x - g.boundingBox.min.x > 300) WM = m; });
  const WMm = (WM ? WM.clone() : new THREE.MeshPhongMaterial({ color: 0x2f86b8, transparent: true, opacity: 0.58, shininess: 110 })); Object.assign(WMm, { depthWrite: true, polygonOffset: false });
  const mWater = build((q) => anyQ(q, k => HY[k] < WL + 0.03), { y: () => WL + 0.01 }, WMm, 1.95);
  out.meshes = [mGrass, mGrassF, mBeach, mFloor, mShore, mWater].map(m => m ? m.geometry.index.count / 3 : 0);
  // ---- the beach's sand where the canal now cuts through it (to the sea): folded; and jetski's old floor, meadow, shore and water of the lagoon hidden
  const fold = []; { const e0 = new THREE.Matrix4(); sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.userData.keep || !o.geometry || !o.geometry.index) return; const g = o.geometry, C = g.attributes.color, m = matOf(o); if (!m) return;
      const isB = !!(C && C.userData && C.userData.orig), isSandM = !!(m.map && m.transparent && C && C.itemSize === 4 && !(m.map.image === TX.grass.image)); if (!isB && !isSandM) return; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < 128 || bb.min.x > 228 || bb.max.z < 120 || bb.min.z > 216) return;
      const P = g.attributes.position, I = g.index, A = I.array, e = o.matrixWorld, id = e.equals(e0); let A0 = null, n = 0;
      for (let t = 0; t + 2 < I.count; t += 3) { const a = A[t], b = A[t + 1], c = A[t + 2]; if (a === b && b === c) continue; let x = 0, y = 0, z = 0; for (const v of [a, b, c]) { V3.fromBufferAttribute(P, v); if (!id) V3.applyMatrix4(e); x += V3.x / 3; y += V3.y / 3; z += V3.z / 3; } if (x < 128 || x > 228 || z < 120 || z > 216) continue; if (d0(x, z) > 3.0 && zoneW(x, z) < 0.5) continue; if (!A0) A0 = A.slice(); A[t + 1] = a; A[t + 2] = a; n++; }
      if (n) { I.needsUpdate = true; fold.push([I, A0, A.slice()]); } }); out.foldedBeach = fold.length; }
  const G0 = JR.children.find(c => c.isGroup && c.visible) || JR.children[0], hid = []; if (G0) G0.children.forEach(o => { if (!o.isMesh || o.isInstancedMesh) return; const m = matOf(o), g = o.geometry, C = g && g.attributes.color; const isFloor = m.type === 'MeshLambertMaterial' && m.vertexColors && !m.map && C && g.attributes.position.count > 2000, isWater = m.transparent && m.type === 'MeshPhongMaterial' && g.attributes.position.count > 2000; if (isFloor || isWater) hid.push(o); });
  out.hidJet = hid.length;
  window.__W2 = (k) => { const on = k > 0; ROOT.visible = on; hid.forEach(o => { o.visible = !on; }); for (const [I, A0, A1] of fold) { I.array.set(on ? A1 : A0); I.needsUpdate = true; } return k; };
  window.__W2(1); return JSON.stringify(out); })()
