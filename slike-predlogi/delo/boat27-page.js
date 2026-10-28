(() => {
  // (pictures only) 27. 10., the user (a picture of the lagoon with two islands between the main straight and the S-bends): "vem da je bila ena verzija
  // kjer je bila na voda izpeljana v obliki proge za male colne. Sedaj sta tam 2 otoka ... Ali lahko naredis 6 razlicnih prog za colne ... Proga naj gre
  // tako kot je sla prej gokart steza". So the lagoon (water3's floor and water) is land again, and the water a track along the old go-kart line
  // (H3.kartPts, its figure eight, the crossing under the footbridge), joined to the canal to the sea. window.__BOATK = k (0..5) before running:
  //  0 a river 10 m wide, grass banks with a narrow sandy edge, buoys at the bends
  //  1 a wide course (17 m) with sandy beaches on both banks and floating lane lines
  //  2 a canal with concrete walls (white coping, tyre fenders), a start pontoon with boxes and a timing tower
  //  3 a river (13 m) with floating jumps and inflatable gates
  //  4 a wild river: width from 8 to 16 m, rocks at the narrows, reeds and palms
  //  5 a water circuit (12 m): red-white kerbs painted on both banks, a start/finish gantry and a small stand
  // window.__BOAT27 report; window.__BOATK = -1 puts the lagoon back.
  const H = window.__H3, W = H && H.water, sc = Render.scene, out = {};
  const R3 = window.__W3ROOT, DBG = window.__W3DBG, JR = window.__JETROOT; if (!R3 || !DBG || !W) return 'BOAT27 need water3';
  if (Render.setDetailDist) Render.setDetailDist(1e5); sc.updateMatrixWorld(true);
  const K = window.__BOATK == null ? 0 : window.__BOATK | 0; out.k = K;
  const WL = W.WL, sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }, mix = (a, b, t) => a + (b - a) * t;
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const matOf = (o) => Array.isArray(o.material) ? o.material[0] : o.material;
  // ---- water3's floor (TMesh) and water (LW), its grid
  const TM = R3.children.find(o => o.isMesh && matOf(o).customProgramCacheKey && matOf(o).customProgramCacheKey() === 'w3fade'), LW = R3.children.find(o => o.isMesh && o.renderOrder === 1.95);
  if (!TM || !LW) return 'BOAT27 no water3 meshes';
  const { X0, Z0, S, N1, HB } = DBG, NZ = N1 - 1, NX = Math.round(HB.length / N1) - 1, NV = (NX + 1) * N1;
  const G = TM.geometry, P = G.attributes.position, CO = G.attributes.color, BC = G.attributes.bcol, FD = G.attributes.fade;
  if (!TM.userData.b27) TM.userData.b27 = { p: P.array.slice(), c: CO.array.slice(), b: BC.array.slice(), f: FD.array.slice(), lw: LW.geometry };
  if (!TM.userData.b27.i) TM.userData.b27.i = G.index.array.slice(); const O = TM.userData.b27; P.array.set(O.p); CO.array.set(O.c); BC.array.set(O.b); FD.array.set(O.f); G.index.array.set(O.i); G.index.needsUpdate = true;
  const qv = new Int32Array(NV).fill(-1), vq = new Int32Array(P.count); for (let v = 0; v < P.count; v++) { const i = Math.round((P.getX(v) - X0) / S), j = Math.round((P.getZ(v) - Z0) / S), q = i * N1 + j; vq[v] = q; qv[q] = v; }
  const HO = new Float32Array(NV).fill(-1e9); for (let v = 0; v < P.count; v++) HO[vq[v]] = P.getY(v);
  // ---- shapes: the old lagoon (no islands), the canal (water3's), the go-kart line (closed) and a short link from it to the canal's mouth
  const polyD = (PL, x, z) => { let b = 1e9; for (let i = 1; i < PL.length; i++) { const [ax, az] = PL[i - 1], [bx, bz] = PL[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (l2 || 1))); b = Math.min(b, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return b; };
  const curve = (pts, closed, n) => { const cv = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), closed, 'centripetal'), o = []; for (let i = 0; i <= n; i++) { const q = cv.getPointAt(i / n); o.push([q.x, q.z]); } return o; };
  const inPoly = (PG, x, z) => { let c = false; for (let i = 0, j = PG.length - 1; i < PG.length; j = i++) { const [xi, zi] = PG[i], [xj, zj] = PG[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const sdPoly = (PG, x, z) => (inPoly(PG, x, z) ? -1 : 1) * polyD(PG.concat([PG[0]]), x, z);
  const LAG = curve([[-178, 206], [-170, 184], [-140, 176], [-100, 180], [-60, 190], [-20, 196], [10, 182], [50, 176], [90, 182], [118, 196], [116, 222], [90, 236], [50, 234], [12, 222], [-20, 212], [-60, 222], [-100, 236], [-140, 236], [-170, 228]], true, 300);
  const CAN = curve([[100, 206], [116, 200], [128, 191], [140, 183], [152, 176], [166, 170], [180, 166], [196, 162], [216, 158]], false, 170), CWx = (x) => 7.5 + 6 * sst(156, 188, x);
  const KP = (H.kartPts || []).map(p => Array.isArray(p) ? p : [p.x, p.z]); if (KP.length < 8) return 'BOAT27 no kart line';
  const KC = curve(KP, true, 700), KA = [0]; for (let i = 1; i < KC.length; i++) KA.push(KA[i - 1] + Math.hypot(KC[i][0] - KC[i - 1][0], KC[i][1] - KC[i - 1][1])); const KL = KA[KA.length - 1];
  const LINK = curve([[97.5, 212.5], [101, 207], [107, 203.5]], false, 12);
  const near = (x, z) => { let b = 1e9, s = 0; for (let i = 1; i < KC.length; i++) { const [ax, az] = KC[i - 1], [bx, bz] = KC[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (l2 || 1))), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < b) { b = d; s = KA[i - 1] + Math.sqrt(l2) * t; } } return [b, s]; };
  // ---- the six versions
  const VER = [
    { name: 'reka', hw: () => 5, beach: 0 },
    { name: 'siroka proga s plazami', hw: () => 8.5, beach: 7, slope: 0.05 },
    { name: 'kanal z zidovi', hw: () => 5.5, wall: true },
    { name: 'reka s skoki in vrati', hw: () => 6.5, beach: 0 },
    { name: 'divja reka', hw: (s) => 6 + 2.2 * Math.sin(s / KL * Math.PI * 2 * 7 + 0.6) + 0.8 * Math.sin(s / KL * Math.PI * 2 * 17), beach: 0 },
    { name: 'vodni krog z robniki', hw: () => 6, beach: 0 },
  ];
  // version 1 (the wide course with beaches) in six looks (window.__BEACHV = j): A as sent, B white sand + palms + turquoise shallows, C the beach only
  // on the loops' outer banks (wider), D a boardwalk along the beaches, E dunes with beach grass, F a family beach (wider water, shallow edge)
  const BV = K === 1 ? Math.max(0, Math.min(5, window.__BEACHV | 0)) : -1; out.bv = BV;
  const BB = [{ hw: 8.5, beach: 7 }, { hw: 8.5, beach: 9, white: 0.45, shelf: 1 }, { hw: 8.5, beach: 12, outer: 1 }, { hw: 8.5, beach: 7 }, { hw: 8, beach: 10, dune: 0.75 }, { hw: 11, beach: 8, shelf: 1, white: 0.5 }][Math.max(0, BV)];
  if (BV >= 0) VER[1].hw = () => BB.hw;
  const V = K >= 0 ? VER[K] : null;
  const hwF = (s, x) => { const h = V.hw(s); return K === 4 ? mix(h, Math.min(h, 5.4), sst(58, 74, x)) : h; };
  // (the track, the link and the canal joined smoothly: a rounded fillet where they meet, no notch, no spike)
  const dChan = (x, z) => { if (!V) return [99, 0]; const [d, s] = near(x, z), hw = hwF(s, x); return [smin(d - hw, polyD(LINK, x, z) - Math.min(hw, 5.5), 4), s]; };
  const d0c = (x, z) => polyD(CAN, x, z) - CWx(x);
  const dLagOld = (x, z) => sdPoly(LAG, x, z);
  // ---- the zone rebuilt: the old lagoon and 9 m round it, and wherever the new water comes within 9 m
  const inBox = (x, z) => x > -206 && x < 140 && z > 158 && z < 256;
  const zone = new Uint8Array(NV), DWn = new Float32Array(NV).fill(99), SN = new Float32Array(NV), LO = new Float32Array(NV).fill(99);
  for (let q = 0; q < NV; q++) { if (qv[q] < 0) continue; const i = (q / N1) | 0, j = q - i * N1, x = X0 + i * S, z = Z0 + j * S; if (!inBox(x, z)) continue; const dl = dLagOld(x, z); LO[q] = dl; if (dl > 16 && polyD(KC, x, z) > 26) continue;
    const [dc, s] = dChan(x, z), dw = smin(dc, d0c(x, z), 4); if (dl < 14.5 || dw < (BV >= 0 ? Math.max(9, BB.beach + 3) : 9)) { zone[q] = 1; DWn[q] = dw; SN[q] = s; } }
  // land's colours over the old water and its shore: the nearest dry land's (outside the old lagoon), spread over the grid
  const ok = new Uint8Array(NV), src = new Int32Array(NV).fill(-1), Q = new Int32Array(NV); let qh = 0, qt = 0;
  for (let q = 0; q < NV; q++) { if (qv[q] < 0) continue; const land = HO[q] - WL > 0.45 && LO[q] > 1.5; if (!zone[q] || land) { ok[q] = 1; src[q] = q; if (zone[q] || true) Q[qt++] = q; } }
  const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (qh < qt) { const q = Q[qh++], i = (q / N1) | 0, j = q - i * N1; for (const [di, dj] of D4) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii > NX || jj > NZ) continue; const p = ii * N1 + jj; if (qv[p] < 0 || src[p] >= 0) continue; src[p] = src[q]; Q[qt++] = p; } }
  const NC = 8, LC = new Float32Array(NV * NC);   // (col rgb, bcol rgb, fade, height) of the land each grid point takes
  for (let q = 0; q < NV; q++) { const sq = src[q] >= 0 ? src[q] : q, v = qv[sq]; if (v < 0) continue; const r = q * NC; LC[r] = O.c[v * 3]; LC[r + 1] = O.c[v * 3 + 1]; LC[r + 2] = O.c[v * 3 + 2]; LC[r + 3] = O.b[v * 3]; LC[r + 4] = O.b[v * 3 + 1]; LC[r + 5] = O.b[v * 3 + 2]; LC[r + 6] = O.f[v]; LC[r + 7] = HO[sq]; }
  { const T = LC.slice(); for (let it = 0; it < 10; it++) { T.set(LC); for (let q = 0; q < NV; q++) { if (!zone[q] || ok[q]) continue; const i = (q / N1) | 0, j = q - i * N1; let n = 0; const s8 = new Float32Array(NC); for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const p = (i + di) * N1 + j + dj; if (p < 0 || p >= NV || qv[p] < 0) continue; for (let c = 0; c < NC; c++) s8[c] += T[p * NC + c]; n++; } if (n) for (let c = 0; c < NC; c++) LC[q * NC + c] = s8[c] / n; } } }
  // the meadow's own look (textured grass: fade ~0) averaged round the zone: the new land's colour, blended into each point's own 6-9 m out of the old lagoon
  const GR = [0, 0, 0, 0, 0, 0]; { let n = 0; for (let q = 0; q < NV; q++) { const v = qv[q]; if (v < 0 || zone[q] || O.f[v] > 0.05) continue; const i = (q / N1) | 0, j = q - i * N1, x = X0 + i * S, z = Z0 + j * S; if (!inBox(x, z) || LO[q] > 30) continue;
    for (let c = 0; c < 3; c++) { GR[c] += O.c[v * 3 + c]; GR[3 + c] += O.b[v * 3 + c]; } n++; } for (let c = 0; c < 6; c++) GR[c] /= Math.max(1, n); out.grass = [n].concat(GR.map(x => +x.toFixed(3))); }
  // ---- the new floor and its colours
  const cA = new THREE.Color(0xd9c08f), cB = new THREE.Color(0x7d8a5e), cC = new THREE.Color(0x2b5566), cD = new THREE.Color(0x163746), wetS = new THREE.Color(0.55, 0.47, 0.34), dryS = new THREE.Color(0.74, 0.64, 0.47), cc = new THREE.Color(), c2 = new THREE.Color();
  const pal = (dep) => { if (dep < 0.35) cc.copy(cA).lerp(cB, dep / 0.35); else if (dep < 1.6) cc.copy(cB).lerp(cC, (dep - 0.35) / 1.25); else cc.copy(cC).lerp(cD, Math.min(1, (dep - 1.6) / 2.5)); return cc; };
  const depCanal = (u) => BV >= 0 && BB.shelf ? 0.22 * sst(0, 0.8, u) + 2.0 * sst(3, 6.5, u) : 2.3 * (1 - Math.exp(-u / 7)) - 0.2 * u * Math.exp(-u / 1.2);
  if (BV >= 0 && BB.white) dryS.lerp(new THREE.Color(0.9, 0.85, 0.72), BB.white); const KCc = KC.slice(0, -1);
  const HN = HO.slice(); let nz = 0, nWet = 0;
  for (let q = 0; q < NV; q++) { if (!zone[q]) continue; const v = qv[q], dW = DWn[q], qi = (q / N1) | 0, qx = X0 + qi * S, qz = Z0 + (q - qi * N1) * S; nz++;
    const bw = BV < 0 ? 0 : BB.outer ? (inPoly(KCc, qx, qz) ? 0.9 : BB.beach) : BB.beach;
    const base = ok[q] && HB[q] > -1e8 ? HB[q] : LC[q * NC + 7], land = Math.max(base, WL + 0.06);
    let h; if (V && V.wall) { h = dW >= 0 ? Math.max(land, WL + 0.14) : WL - 1.25 - 0.25 * sst(0, 3, -dW); }
    else { let h1 = land; if (dW > 0) h1 = Math.max(h1, WL + 0.03 + 0.05 * Math.min(dW, 3)); const hc = dW >= 0 ? WL + 0.07 * sst(0, 0.8, dW) + (V && V.slope ? V.slope : 0.1) * dW : WL - depCanal(-dW); h = smin(h1, hc, 0.3); if (BV >= 0 && BB.dune && dW > 1) h += BB.dune * sst(1.5, 4, dW) * (1 - sst(bw - 2, bw + 1, dW)) * (0.55 + 0.45 * Math.sin(qx * 0.23 + qz * 0.11) * Math.sin(qz * 0.19 - qx * 0.07)); }
    HN[q] = h; P.setY(v, h);
    const hA = h - WL, wO = LO[q] > 14 ? 1 : sst(9.5, 14, LO[q]), L7 = (c) => c < 3 ? mix(GR[c], O.c[v * 3 + c], wO) : c < 6 ? mix(GR[c], O.b[v * 3 + c - 3], wO) : mix(0, O.f[v], wO);
    if (hA < 0) { pal(-hA); BC.setXYZ(v, cc.r, cc.g, cc.b); FD.setX(v, 1); CO.setXYZ(v, L7(0), L7(1), L7(2)); nWet++; continue; }
    let wS = (V && V.wall) ? 0 : BV >= 0 ? 1 - sst(bw - 1.2, bw + 1.2, dW) : 1 - sst(V ? 0.4 : 5, V ? 3.4 : 9, dW); wS = Math.max(wS * (1 - wO), (1 - sst(0.16, 0.36, hA)) * (1 - sst(5, 9, dW)) * wO);
    c2.setRGB(L7(3), L7(4), L7(5)); cc.copy(wetS).lerp(dryS, sst(0, 0.1, hA)); c2.lerp(cc, wS);
    BC.setXYZ(v, c2.r, c2.g, c2.b); FD.setX(v, Math.max(L7(6), Math.min(1, wS * 1.3))); CO.setXYZ(v, L7(0), L7(1), L7(2)); }
  for (let q = 0; q < NV; q++) { if (!zone[q]) continue; const v = qv[q], i = (q / N1) | 0, x = X0 + i * S, wC = sst(114, 134, x); if (wC <= 0) continue; const h = mix(HN[q], O.p[v * 3 + 1], wC); HN[q] = h; P.setY(v, h);
    for (let c = 0; c < 3; c++) { CO.array[v * 3 + c] = mix(CO.array[v * 3 + c], O.c[v * 3 + c], wC); BC.array[v * 3 + c] = mix(BC.array[v * 3 + c], O.b[v * 3 + c], wC); } FD.array[v] = mix(FD.array[v], O.f[v], wC); }
  // (the zone's cells split along their shorter diagonal by the new heights: no zigzag on the banks)
  { const I = G.index, A = I.array; let nr = 0; for (let t = 0; t + 5 < A.length; t += 6) { const vs = [...new Set([A[t], A[t + 1], A[t + 2], A[t + 3], A[t + 4], A[t + 5]])]; if (vs.length !== 4) continue; const qs = vs.map(v => vq[v]); if (!qs.some(q => zone[q])) continue;
      const ij = qs.map(q => [(q / N1) | 0, q % N1]), i0 = Math.min(...ij.map(p => p[0])), j0 = Math.min(...ij.map(p => p[1])), at4 = (di, dj) => qv[(i0 + di) * N1 + j0 + dj]; const a = at4(0, 0), b = at4(1, 0), c = at4(1, 1), d = at4(0, 1); if (a < 0 || b < 0 || c < 0 || d < 0) continue;
      const ya = P.getY(a), yb = P.getY(b), yc = P.getY(c), yd = P.getY(d), tri = Math.abs(ya - yc) <= Math.abs(yb - yd) ? [a, c, b, a, d, c] : [a, d, b, b, d, c];
      // (wound so its normal points up: x along i, z along j)
      const up = (p, q2, r) => { const ux = P.getX(q2) - P.getX(p), uz = P.getZ(q2) - P.getZ(p), wx = P.getX(r) - P.getX(p), wz = P.getZ(r) - P.getZ(p); return uz * wx - ux * wz > 0; };
      for (let k = 0; k < 6; k += 3) { if (!up(tri[k], tri[k + 1], tri[k + 2])) { const s2 = tri[k + 1]; tri[k + 1] = tri[k + 2]; tri[k + 2] = s2; } } for (let k = 0; k < 6; k++) A[t + k] = tri[k]; nr++; }
    I.needsUpdate = true; out.retri = nr; }
  P.needsUpdate = true; CO.needsUpdate = true; BC.needsUpdate = true; FD.needsUpdate = true; G.computeVertexNormals(); G.computeBoundingSphere();
  out.zone = nz; out.wet = nWet;
  // ---- the water: water3's again, over the new floor (the sea's region, the canal, the new track)
  { const wp = [], wi = [], wv = new Int32Array(NV).fill(-1), wx = (q) => { if (wv[q] >= 0) return wv[q]; const i = (q / N1) | 0, j = q - i * N1; wv[q] = wp.length / 3; wp.push(X0 + i * S, WL + 0.01, Z0 + j * S); return wv[q]; };
    const OP = O.lw.attributes.position, OI = O.lw.index, oldCell = new Uint8Array(NV);   // (the old water's cells: kept where the zone does not reach)
    for (let t = 0; t < OI.count; t += 3) { let mi = 1e9, mj = 1e9; for (let k = 0; k < 3; k++) { const a = OI.getX(t + k); mi = Math.min(mi, Math.round((OP.getX(a) - X0) / S)); mj = Math.min(mj, Math.round((OP.getZ(a) - Z0) / S)); } oldCell[mi * N1 + mj] = 1; }
    let nw = 0; for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const a = i * N1 + j, b = a + N1, c = b + 1, d = a + 1; if (qv[a] < 0 || qv[b] < 0 || qv[c] < 0 || qv[d] < 0) continue;
      const inZ = zone[a] || zone[b] || zone[c] || zone[d]; if (!inZ) { if (!oldCell[a]) continue; } else { if (Math.min(HN[a], HN[b], HN[c], HN[d]) > WL - 0.01 && !(V && V.wall && Math.min(DWn[a], DWn[b], DWn[c], DWn[d]) < 0.3)) continue; if (Math.min(DWn[a], DWn[b], DWn[c], DWn[d]) >= 4) continue; }
      const A = wx(a), B = wx(b), C = wx(c), D = wx(d); wi.push(A, B, C, A, C, D); nw++; }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setIndex(wi); const I = wg.index; for (let t = 0; t < I.count; t += 3) { const a = I.getX(t), b = I.getX(t + 1), c = I.getX(t + 2), ny = (wp[b * 3 + 2] - wp[a * 3 + 2]) * (wp[c * 3] - wp[a * 3]) - (wp[b * 3] - wp[a * 3]) * (wp[c * 3 + 2] - wp[a * 3 + 2]); if (ny < 0) { I.setX(t + 1, c); I.setX(t + 2, b); } }
    wg.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(wp.length).map((v, k) => k % 3 === 1 ? 1 : 0), 3)); wg.computeBoundingSphere();
    LW.geometry = K >= 0 ? wg : O.lw; out.water = nw;
    // (the water a little further back than the floor (polygon offset): where the bank is a hair above the level the ground shows, so the water's edge is the
    // line where the ground meets the level and not the grid's cells)
    const wm = matOf(LW); if (!wm.userData.b27po) { wm.userData.b27po = [wm.polygonOffset, wm.polygonOffsetFactor, wm.polygonOffsetUnits]; } if (K >= 0) Object.assign(wm, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 6 }); else { const [a, f, u] = wm.userData.b27po; Object.assign(wm, { polygonOffset: a, polygonOffsetFactor: f, polygonOffsetUnits: u }); } wm.needsUpdate = true; }
  // ---- see-through layers with their own alpha (grass, sand) in the zone: gone over the old lagoon (its islands' grass) and over the new water and its
  // shore, faded where water3 had cut them at the old shore (so a cut sand edge turns into a soft one); the alpha as before kept for the next version
  { const skip = (o) => { for (let p = o; p; p = p.parent) if (p === R3 || p === JR || p === window.__BOATDROOT) return true; return false; }; const V3 = new THREE.Vector3(); let nl = 0, nv = 0;
    const bilF = (A, x, z) => { const fx = Math.max(0, Math.min(NX - 0.001, (x - X0) / S)), fz = Math.max(0, Math.min(NZ - 0.001, (z - Z0) / S)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, w = fz - j, q = i * N1 + j; return (A[q] * (1 - w) + A[q + 1] * w) * (1 - u) + (A[q + N1] * (1 - w) + A[q + N1 + 1] * w) * u; };
    sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || skip(o)) return; const m = matOf(o), g = o.geometry, C = g.attributes.color, Pp = g.attributes.position; if (!m || !m.transparent || !C || C.itemSize !== 4 || !Pp || Pp.count <= 64) return;
      if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < -206 || bb.min.x > 128 || bb.max.z < 158 || bb.min.z > 256) return;
      if (!o.userData.b27a) o.userData.b27a = C.array.slice(); const A0 = o.userData.b27a; C.array.set(A0); if (K < 0) { C.needsUpdate = true; return; } let ch = 0;
      for (let v = 0; v < Pp.count; v++) { V3.fromBufferAttribute(Pp, v).applyMatrix4(o.matrixWorld); if (!inBox(V3.x, V3.z)) continue; const a0 = A0[v * 4 + 3]; if (a0 <= 0.001) continue; const lo = dLagOld(V3.x, V3.z); if (lo > 12) continue;
        const [dc] = dChan(V3.x, V3.z), dw = Math.min(dc, d0c(V3.x, V3.z)), k1 = sst(0.5, 6, lo) * sst(1.5, 3.5, dw); if (k1 < 0.999) { C.setW(v, a0 * k1); ch++; } }
      if (ch) { C.needsUpdate = true; nl++; nv += ch; } }); out.layers = [nl, nv]; }
  window.__BOAT27GRID = { HN, DWn, SN, zone, qv, X0, Z0, S, N1, NX, NZ, KC, KA, KL, K, hw: V ? hwF : null, bv: BV, BB, d0c, inKC: (x, z) => inPoly(KCc, x, z), dKart: (x, z) => near(x, z)[0], name: V ? V.name : 'laguna', LAG, inPoly, polyD };
  return 'BOAT27 ' + JSON.stringify(out);
})()
