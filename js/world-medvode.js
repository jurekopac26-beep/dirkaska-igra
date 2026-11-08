/* =========================================================================
   WORLD — Medvode (theme 'medvode'): its own builder (World.ext.medvode), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NR_A64, RB, TAU, VRC, VRHC, VRSP, VRSQ, VRT, atS, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdLayer,
    crowdRun, crowdSub, cyl, gable, gravelSeams, hjCutMat, ico, inPoly, lerp, ouCutMat, ouGTex, rng, rpHash, sstep, vary, vrDem, vrDist, vrLC,
    tuftWindMat, tyreStack, valueNoise2, vrLCf, vrPrep, vrStubAt, vrStubs, vrTileOn, vrsicProps
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= MEDVODE (theme 'medvode') =================
     Medvode to Smlednik (Slovenia): the real road from the football ground in Medvode to the old castle above Smlednik on a clear summer
     afternoon, everything at its real place from the map (def: OSM via Overture, the Copernicus terrain, the canopy heights). Built on Vršič's
     corridor (vrPrep: def.dem, def.lc; the side roads: vrStubs, vrStubH) with its own ground (mvH: the real terrain, the water's beds under their
     surfaces (def.water), the road blended in except under the bridge over the Sava, the oncoming lanes round the rings (def.altDn), the rings'
     islands, the railway's bed), the road at its own width (T.wa) with its sidewalks, kerbs and markings, the bridge on its piers, the side
     roads, the town's streets and paths, every building from its footprint (houses with hipped and gabled tiled roofs, blocks of flats, halls,
     churches, the castle's ruins), the trees from the canopy map, hedges, walls and fences, the railway, the power lines, the sports
     grounds, bus stops, zebra crossings and their signs, street lamps. Only geographic names (no clubs, businesses or brands). */
  let MV = null;                                                     // per-build data: the water raster, the bridge's samples, the oncoming lanes', the railway's and the rings' ground
  const MVW = { e: -1e9, id: 0, lv: 0 }, MVN = { i: -1, d: 1e9, dd: 1e9, h: 0, env: 1e9 }, MVCOL = [0, 0, 0];
  // a clump of a roundabout's dense tall grass (Medvode, def.rings isl 'tall'), about 1 m across and 1 m tall before its instance's scale: seven long blades
  // leaning out from a narrow foot, darker below, the tips lighter and drier (the instance colour: the clump's own green); 21 vertices; lit as the ground under
  // it (normals up, both faces: tuftWindMat, which bends it in the wind)
  let mvTallGeoC = null;
  function mvTallGeo() {
    if (mvTallGeoC) return mvTallGeoC;
    const P = [], C = [], N = [], FOOT = [0.5, 0.62, 0.42], TIP = [1.12, 1.1, 0.8];
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * TAU + (k % 2) * 0.4, lean = 0.26 + 0.09 * ((k * 3) % 4) / 3, h = 0.78 + 0.22 * ((k * 5) % 3) / 2, w = 0.07;
      const bx = Math.cos(a) * 0.06, bz = Math.sin(a) * 0.06, px = -Math.sin(a) * w, pz = Math.cos(a) * w, tx = Math.cos(a) * (0.06 + lean), tz = Math.sin(a) * (0.06 + lean);
      P.push(bx - px, 0, bz - pz, bx + px, 0, bz + pz, tx, h, tz); C.push(FOOT[0], FOOT[1], FOOT[2], FOOT[0], FOOT[1], FOOT[2], TIP[0], TIP[1], TIP[2]);
    }
    for (let q = 0; q < P.length / 3; q++) N.push(0, 1, 0);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.computeBoundingSphere();
    return (mvTallGeoC = g);
  }
  function mvChamfer(d, id, nx, nz, c) {   // two-pass 3x3 chamfer distance (in place), carrying the seed's id along (id: null for none)
    const b = c * Math.SQRT2;
    const rel = (k, q, w) => { if (d[q] + w < d[k]) { d[k] = d[q] + w; if (id) id[k] = id[q]; } };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i;
      if (i > 0) rel(k, k - 1, c); if (j > 0) { rel(k, k - nx, c); if (i > 0) rel(k, k - nx - 1, b); if (i < nx - 1) rel(k, k - nx + 1, b); } }
    for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i;
      if (i < nx - 1) rel(k, k + 1, c); if (j < nz - 1) { rel(k, k + nx, c); if (i < nx - 1) rel(k, k + nx + 1, b); if (i > 0) rel(k, k + nx - 1, b); } }
  }
  function mvPrep() {
    const def = T.def, P = API.VR, N = T.N, ds = T.ds, M = MV = { pads: [] };
    // the bridge's own samples (they hold up no ground under the deck: its two ends do, the embankments)
    M.br = new Uint8Array(N); for (const [a, b] of def.bridges || []) for (let s = T.startS + a + 6; s <= T.startS + b - 6; s += ds / 2) M.br[T.idx(s)] = 1;
    // the water (def.water [class, level, [x, z, ...]]): which body covers each node of a 4 m raster, the signed distance to the nearest shore
    // (+ inside) and, on land, the nearest body (its level shapes the bank)
    const wc = 4, x0 = P.x0, z0 = P.z0, nx = Math.ceil((P.bx1 + 460 - x0) / wc) + 1, nz = Math.ceil((P.bz1 + 460 - z0) / wc) + 1, id = new Uint8Array(nx * nz);
    M.lv = [0]; M.cls = [''];
    (def.water || []).forEach(([cls, lv, p], k) => { M.lv.push(lv); M.cls.push(cls); const n = p.length / 2; let pz0 = 1e9, pz1 = -1e9;
      for (let q = 1; q < p.length; q += 2) { pz0 = Math.min(pz0, p[q]); pz1 = Math.max(pz1, p[q]); }
      for (let j = Math.max(0, Math.floor((pz0 - z0) / wc)); j <= Math.min(nz - 1, Math.ceil((pz1 - z0) / wc)); j++) { const z = z0 + j * wc, xs = [];
        for (let a = 0, b = n - 1; a < n; b = a++) { const za = p[2 * a + 1], zb = p[2 * b + 1]; if ((za > z) !== (zb > z)) xs.push(p[2 * a] + (z - za) / (zb - za) * (p[2 * b] - p[2 * a])); }
        xs.sort((u, v) => u - v);
        for (let m = 0; m + 1 < xs.length; m += 2) for (let i = Math.max(0, Math.ceil((xs[m] - x0) / wc)); i <= Math.min(nx - 1, Math.floor((xs[m + 1] - x0) / wc)); i++) id[j * nx + i] = k + 1; } });
    const dO = new Float32Array(nx * nz), dI = new Float32Array(nx * nz), nid = id.slice();
    for (let k = 0; k < id.length; k++) { dO[k] = id[k] ? 0 : 1e9; dI[k] = id[k] ? 1e9 : 0; }
    mvChamfer(dO, nid, nx, nz, wc); mvChamfer(dI, null, nx, nz, wc);
    const sd = new Float32Array(nx * nz); for (let k = 0; k < sd.length; k++) sd[k] = id[k] ? Math.min(dI[k], 300) - wc / 2 : -(Math.min(dO[k], 300) - wc / 2);
    Object.assign(M, { wc, wx0: x0, wz0: z0, wnx: nx, wnz: nz, wid: id, nid, sd });
    // the oncoming lanes round the rings and the split approaches (def.altDn: [x, z, y, ...]), def.altHw half wide: the ground levelled under them
    M.alts = (def.altDn || []).map(A => { const pts = []; for (let k = 0; k + 2 < A.P.length; k += 3) pts.push([A.P[k], A.P[k + 1], A.P[k + 2]]); return pts; });
    M.altH = API.lfSegs(M.alts, () => ({}));
    // the railway (def.rail [x, z, ...]): every 4 m, its height the ground's smoothed over ~100 m (across the rivers from bank to bank: the bridges)
    M.rails = (def.rail || []).map(L => { const pts = []; for (let k = 0; k + 3 < L.length; k += 2) { const ax = L[k], az = L[k + 1], bx = L[k + 2], bz = L[k + 3], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4));
        for (let q = 0; q < n; q++) pts.push([lerp(ax, bx, q / n), lerp(az, bz, q / n), 0]); }
      pts.push([L[L.length - 2], L[L.length - 1], 0]);
      const ok = pts.map(p => { p[2] = mvBase(p[0], p[1]); return mvW(p[0], p[1]).e < -10; });
      let last = -1; for (let k = 0; k < pts.length; k++) { if (!ok[k]) continue; if (last >= 0 && k - last > 1) for (let q = last + 1; q < k; q++) pts[q][2] = lerp(pts[last][2], pts[k][2], (q - last) / (k - last)); else if (last < 0) for (let q = 0; q < k; q++) pts[q][2] = pts[k][2]; last = k; }
      if (last >= 0) for (let q = last + 1; q < pts.length; q++) pts[q][2] = pts[last][2];
      for (let it = 0; it < 3; it++) { const y = pts.map(p => p[2]); for (let k = 0; k < pts.length; k++) { let s = 0, c = 0; for (let q = Math.max(0, k - 12); q <= Math.min(pts.length - 1, k + 12); q++) { s += y[q]; c++; } pts[k][2] = s / c; } }
      for (const p of pts) p[2] += 0.9;   // (the rails' top: on the ballast over the formation)
      return pts; });
    M.railH = API.lfSegs(M.rails, () => ({}));
    // the rings' islands (def.rings: centre, radius of the ring's centre line): level at the ring's height (the route's samples and the side
    // roads' points round it)
    M.rings = (def.rings || []).map(r => { const [cx, cz] = r.c; let hs = 0, n = 0;
      for (let i = 0; i < N; i += 2) { const d = Math.hypot(T.px[i] - cx, T.pz[i] - cz); if (Math.abs(d - r.r) < 3) { hs += T.hy[i]; n++; } }
      for (const S of T.stubs || []) for (let j = 0; j < S.n; j += 2) { const d = Math.hypot(S.x[j] - cx, S.z[j] - cz); if (Math.abs(d - r.r) < 3) { hs += S.Y[j]; n++; } }
      const y = n ? hs / n : T.hy[T.nearestIdx(cx, cz)], ri = r.r - (r.hw || 2.9) - 0.35;   // (r.hw: its road's half width)
      // the ring's own height round it (a ring on a slope): 36 bins of the road's heights by the angle, the empty ones filled between their neighbours
      const NB = 36, ys = new Array(NB).fill(null).map(() => []), put = (x, z, h) => { const d = Math.hypot(x - cx, z - cz); if (Math.abs(d - r.r) < 3.5) ys[Math.floor(((Math.atan2(z - cz, x - cx) / TAU) + 1) % 1 * NB) % NB].push(h); };
      for (let i = 0; i < N; i++) put(T.px[i], T.pz[i], T.hy[i]);
      for (const S of T.stubs || []) for (let j = 0; j < S.n; j++) put(S.x[j], S.z[j], S.Y[j]);
      for (const L of M.alts) for (const p of L) put(p[0], p[1], p[2]);   // (the oncoming lanes round the arc the route leaves out)
      let yb = ys.map(L => (L.length ? L.reduce((a, b) => a + b) / L.length : null)); if (yb.every(v => v === null)) yb = yb.map(() => y);
      for (let k = 0; k < NB; k++) if (yb[k] === null) { let a = 1, b = 1; while (yb[(k - a + NB) % NB] === null) a++; while (yb[(k + b) % NB] === null) b++; yb[k] = lerp(yb[(k - a + NB) % NB], yb[(k + b) % NB], a / (a + b)); }
      for (let it = 0; it < 2; it++) yb = yb.map((v, k) => (yb[(k + NB - 1) % NB] + 2 * v + yb[(k + 1) % NB]) / 4);
      const ym = yb.reduce((a, b) => a + b) / NB, R0 = { x: cx, z: cz, r: r.r, ri, hw: r.hw || 2.9, y: ym, yb, drive: r.drive, d: r.d, isl: r.isl || null };
      R0.yAt = (a) => { const f = ((a / TAU) + 1) % 1 * NB - 0.5, k = Math.floor(f), u = f - k; return lerp(yb[(k + NB) % NB], yb[(k + 1 + NB) % NB], u); };
      const TRr = (T.rings || []).find(Q => Math.hypot(Q.x - cx, Q.z - cz) < 0.5); R0.zr = TRr ? TRr.zr : 0;
      if (def.ringH && R0.zr > 0) { R0.yAt = (a) => T.ringY(cx + Math.cos(a) * ri, cz + Math.sin(a) * ri, ym); R0.y = T.ringY(cx, cz, ym); }   // (def.ringH: the zone's own surface, the cars' (Track.ringY), round the island too)
      M.pads.push({ x: cx, z: cz, r: ri - 0.2, b: 1.2, ring: R0 });
      return R0; });
  }
  function mvW(x, z) {   // the water at (x, z): MVW.e the signed distance to its shore (+ inside), id the body (on land the nearest), lv its level
    const M = MV, gx = clamp((x - M.wx0) / M.wc, 0, M.wnx - 1.001), gz = clamp((z - M.wz0) / M.wc, 0, M.wnz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = M.wnx, a = M.sd, k = j * W + i;
    MVW.e = (a[k] * (1 - u) + a[k + 1] * u) * (1 - v) + (a[k + W] * (1 - u) + a[k + W + 1] * u) * v;
    const id = M.nid[k + (u > 0.5 ? 1 : 0) + (v > 0.5 ? W : 0)]; MVW.id = id; MVW.lv = M.lv[id] || 0; return MVW;
  }
  function mvBase(x, z) {   // the land without the road: the real terrain (and a little of the relief its 24 m cells smooth away), the water's beds and banks
    let h = vrDem(x, z) + (API.VR.n2(x, z) - 0.5) * 0.7;
    const W = mvW(x, z);
    if (W.id) { const e = W.e, L = W.lv; if (e > 0) h = L + 0.25 - Math.min(3.4, 0.75 * sstep(0, 2.5, e) + e * 0.2); else if (e > -60) h = Math.min(h, L + 0.25 - 0.85 * e); }
    return h;
  }
  function mvNear(x, z) {   // caNear without the bridge's samples (the ground under the deck is the valley's): MVN
    const P = API.VR, B = MV.br, cx = Math.floor(x / VRHC) - P.cx0, cz = Math.floor(z / VRHC) - P.cz0, ds = T.ds;
    let ws = 0, hs = 0, bd = 1e9, bi = -1, bdd = 1e9, env = 1e9;
    for (let b = Math.max(0, cz - 2); b <= Math.min(P.ncz - 1, cz + 2); b++) for (let a = Math.max(0, cx - 2); a <= Math.min(P.ncx - 1, cx + 2); a++) {
      const L = P.cells[b * P.ncx + a]; if (!L) continue;
      for (let q = 0; q < L.length; q++) {
        const i = L[q]; if (B[i]) continue;
        const dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], lat = dx * T.nx[i] + dz * T.nz[i], ex = Math.max(0, Math.abs(al) - ds), d = Math.sqrt(lat * lat + ex * ex);
        if (d >= 64) continue;
        const dd = Math.max(0, d - (lat > 0 ? T.br[i] : T.bl[i])), hc = T.hy[i] + T.grade[i] * clamp(al, -2 * ds, 2 * ds), k = 1 / (dd + 1.5), wq = k * k * k * k * (d < 48 ? 1 : sstep(64, 48, d));
        ws += wq; hs += wq * hc;
        if (d < bd) { bd = d; bi = i; }
        if (dd < bdd) bdd = dd;
        const e = hc - 0.3 + (T.def.barrier ? (dd < 6 ? 0.05 * dd : 0.3 + 0.6 * (dd - 6)) : dd < 5 ? 0.2 * dd * dd : 5 + 2 * (dd - 5)); if (e < env) env = e;   // (def.barrier: the run-off out to it, past it a gentle bench for 6 m (the terrain's 5 m cells never rise through the run-off), then the bank)
      }
    }
    MVN.i = bi; MVN.d = bd; MVN.dd = bdd; MVN.h = bi < 0 ? 0 : hs / ws; MVN.env = env;
    return MVN;
  }
  function mvH(x, z) {   // terrain height
    const M = MV, base = mvBase(x, z), wet = MVW.id > 0 && MVW.e > 0, n = mvNear(x, z), i = n.i, dd = n.dd; let h = base;
    if (i >= 0) { const hr = n.h - 0.3; h = dd <= 1 ? hr : lerp(hr, base, sstep(1, 30, dd)); if (wet) h = lerp(h, Math.min(h, base), sstep(2, 9, dd)); }
    if (!wet) {   // the railway's bed (as Longford's): the formation under the ballast, the embankments and the cuttings
      const r = API.lfNear(M.railH, x, z); if (r.e && r.d < 30 && (i < 0 || dd > 4)) { const y = lerp(r.e.a[2], r.e.b[2], r.t) - 0.95, d = r.d;
        h = d < 3.4 ? y : h < y ? Math.max(h, y - (d - 3.4) / 1.5) : Math.min(h, y + (d - 3.4) / 1.3); } }
    { const r = API.lfNear(M.altH, x, z), ah = T.def.altHw || 2.4; if (r.e && r.d < ah + 6.6) h = lerp(h, lerp(r.e.a[2], r.e.b[2], r.t) - 0.15, sstep(ah + 6.6, ah + 1, r.d)); }   // (the oncoming lanes)
    for (const p of M.pads) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r + p.b) { const R0 = p.ring, ph = R0 ? lerp(R0.y, R0.yAt(Math.atan2(z - p.z, x - p.x)), clamp(d / R0.ri, 0, 1)) - 0.05 : p.h; h = lerp(ph, h, sstep(p.r, p.r + p.b, d)); } }   // (the rings' islands: at the ring's own height round them)
    if (API.VR.sg) h = mvStubH(x, z, h, i >= 0 ? dd : 999);
    for (const p of M.pads) { const R0 = p.ring; if (!R0) continue; const d = Math.hypot(x - p.x, z - p.z);
      if (T.def.ringH && R0.zr > 0) { if (d > R0.ri - 1.6 && d < R0.zr + 7) h = Math.min(h, T.ringY(x, z, i >= 0 ? n.h : h) - 0.35 + Math.max(0, d - R0.zr - 0.4) * 0.05); continue; }   // (def.ringH: under the ring's asphalt out past its zone's circle, its surface the cars' own)
      if (d > R0.ri - 1.6 && d < R0.r + R0.hw + 8) h = Math.min(h, R0.yAt(Math.atan2(z - p.z, x - p.x)) - 0.35 + Math.max(0, d - R0.r - R0.hw - 0.5) * 0.08); }   // (r5, after the side roads' levelling: well under the ring's own asphalt round the island, its depth offset (under the route's) no longer losing to the ground; under the apron too)
    if (i >= 0) h = Math.min(h, n.env);
    MVN.dd = i >= 0 ? dd : 999;
    return h;
  }
  function mvStubH(x, z, h, dd) {   // vrStubH, and then the ground never above a side road's surface across its width: a little under it, rising 0.08 m a
    // metre to 8 m out (two side roads close together, each levelling the ground to its own height; a driveway alongside the route's higher bank)
    const L = API.STG && API.STG.get(Math.floor(x / 64) * 65536 + Math.floor(z / 64)); if (!L || dd < 0.5) return h;
    let cap = 1e9;
    for (const S of L) { const b = S.bb; if (x < b[0] - 8 || x > b[2] + 8 || z < b[1] - 8 || z > b[3] + 8) continue;
      VRSP.S = null; if (!T._stubProj(S, x, z, VRSP)) continue;
      const t = VRSP.t, au = Math.abs(VRSP.u), hw = T.stubHw(S, t, VRSP.u), end = S.end === 2 && !T.def.barrier ? S.L + 1 : S.Lend;   // (def.barrier: no closure in it, the street drawn out to its end)
      if (t < 0 || t > end + 10 || au > hw + 13) continue;
      const f = sstep(hw + 13, hw + 4, au) * sstep(end + 10, end, t) * sstep(0.5, 3, dd), on = t >= S.te && t <= end && au < hw + 8; if (f <= 0 && !on) continue;
      const q = au < hw + S.lim + 3 ? T.query(x, z, T.stubHint(S.k, t), VRSQ) : null, ys = q && q.k === S.k ? q.y : T.stubPt(S.k, t, VRSQ).y;
      if (f > 0) h = lerp(h, ys - 0.15, f);
      if (on) cap = Math.min(cap, ys - 0.15 + Math.max(0, au - hw - 0.6) * 0.08);
    }
    return Math.min(h, cap);
  }
  function mvGH(i, j) {   // terrain height at grid vertex (i, j), computed once (VR.G: Vršič's grid)
    const G = API.VR.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = mvH(G.x0 + i * VRC, G.z0 + j * VRC); G.dd[k] = MVN.dd; }
    return h;
  }
  function mvGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / VRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = mvGH(i, j); return a + u * (mvGH(i + 1, j) - a) + v * (mvGH(i, j + 1) - a); }
    const d = mvGH(i + 1, j + 1); return d + (1 - u) * (mvGH(i, j + 1) - d) + (1 - v) * (mvGH(i + 1, j) - d);
  }
  function mvSlope(x, z) { const a = mvGround(x - 2.5, z), b = mvGround(x + 2.5, z), c = mvGround(x, z - 2.5), d = mvGround(x, z + 2.5); return Math.hypot(b - a, d - c) / 5; }
  function mvField(x, z) {   // the strip fields of the Sava plain: blocks of long strips (12-28 m wide, cut every 90-210 m), each block its own direction,
    // each strip its own crop: wheat, barley stubble, maize, a green crop, the ground ploughed; a darker furrow between the strips
    const c0 = Math.floor(x / 230), r0 = Math.floor(z / 230); let bd = 1e18, ba = 0, bb = 0;
    for (let a = c0 - 1; a <= c0 + 1; a++) for (let b = r0 - 1; b <= r0 + 1; b++) { const sx = (a + crH(a, b, 41)) * 230, sz = (b + crH(a, b, 42)) * 230, d = (x - sx) ** 2 + (z - sz) ** 2; if (d < bd) { bd = d; ba = a; bb = b; } }
    const an = (crH(ba, bb, 43) - 0.5) * 1.2 + 0.35, ca = Math.cos(an), sa = Math.sin(an), u = x * ca + z * sa, v = -x * sa + z * ca;
    const wS = 12 + crH(ba, bb, 44) * 16, iu = Math.floor(u / wS), fu = u / wS - iu, lS = 90 + crH(iu, ba, 45) * 120, iv = Math.floor((v + crH(iu, bb, 46) * 230) / lS);
    const k = crH(iu * 31 + iv, ba * 7 + bb, 47), m = API.VR.n4(x * 1.4, z * 1.4) - 0.5;
    const C = k < 0.24 ? [0.72, 0.63, 0.33] : k < 0.36 ? [0.66, 0.6, 0.4] : k < 0.6 ? [0.29, 0.45, 0.15] : k < 0.8 ? [0.38, 0.54, 0.19] : [0.48, 0.38, 0.28];
    const e = Math.min(fu, 1 - fu) * wS < 0.6 ? 0.84 : 1, f = e * (1 + m * 0.12);
    MVCOL[0] = C[0] * f; MVCOL[1] = C[1] * f; MVCOL[2] = C[2] * f; return MVCOL;
  }
  let MVWIN = null;   // (p10: the user's drawn windows (def.mvWin) of the Medvode build in progress: there the terrain shows no paved yards and no gravel's tint)
  let mvSettsC = null;
  function mvSettsTex() {   // (p10) granite setts: 20 cm stones in staggered rows, grey (the vertex colours give the tone), dark joints; one tile = 1.6 m (uv = world / 1.6); made once
    if (mvSettsC) return mvSettsC;
    const S = 128, CS = 16, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(5207), n = valueNoise2(5208, 2), sh = new Float32Array(64);
    for (let k = 0; k < 64; k++) sh[k] = 0.84 + r() * 0.18;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const row = Math.floor(j / CS), off = (row % 2) * CS / 2, jx = (i + off) % CS, jy = j % CS, ci = Math.floor((i + off) / CS) % 8;
      const k = (jx < 2 || jy < 2 ? 0.52 : sh[row * 8 + ci] - 0.06 * ((jx === 2 || jy === 2) ? 1 : 0)) + (n(i, j) - 0.5) * 0.1 + (r() - 0.5) * 0.07, o = (j * S + i) * 4; d[o] = d[o + 1] = d[o + 2] = clamp(k * 255, 0, 255); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    return (mvSettsC = t);
  }
  function mvCol(x, z, h, ny, dd) {   // ground colour (times the grass picture): the hay meadows (cut in patches), the strip fields, the forest floor, orchards,
    // the gardens' lawns and the paved yards in the villages, the parks, gravel, the rivers' banks and beds, steep banks of earth, a trodden verge
    const P = API.VR, m = P.n3(x, z), q = P.n4(x, z);
    const fo = vrLCf(x, z, 1), sc = vrLCf(x, z, 2), wn = MVWIN && MVWIN(x, z), se = wn ? 0 : vrLCf(x, z, 3), gv = wn ? 0 : vrLCf(x, z, 4), wt = vrLCf(x, z, 5), fl = vrLCf(x, z, 6), lw = vrLCf(x, z, 7);
    let r = 0.36 + (m - 0.5) * 0.1 + (q - 0.5) * 0.07, g = 0.52 + (m - 0.5) * 0.09 + (q - 0.5) * 0.05, b = 0.2 + (m - 0.5) * 0.05;
    const hay = sstep(0.56, 0.8, P.n5(x * 1.3, z * 1.3)) * 0.55; r = lerp(r, 0.56, hay); g = lerp(g, 0.58, hay); b = lerp(b, 0.3, hay);   // (cut, the hay drying)
    if (fl > 0) { const c = mvField(x, z); r = lerp(r, c[0], fl); g = lerp(g, c[1], fl); b = lerp(b, c[2], fl); }
    r = lerp(r, 0.25 + m * 0.06, fo); g = lerp(g, 0.31 + m * 0.05, fo); b = lerp(b, 0.15 + m * 0.03, fo);
    r = lerp(r, 0.31, sc * 0.6); g = lerp(g, 0.46, sc * 0.6); b = lerp(b, 0.18, sc * 0.6);
    if (se > 0) { const yard = sstep(0.52, 0.74, P.n6(x * 1.2, z * 1.2)) * 0.8; r = lerp(r, lerp(0.35, 0.6, yard), se * 0.85); g = lerp(g, lerp(0.53, 0.59, yard), se * 0.85); b = lerp(b, lerp(0.21, 0.53, yard), se * 0.85); }
    r = lerp(r, 0.33, lw * 0.9); g = lerp(g, 0.57, lw * 0.9); b = lerp(b, 0.19, lw * 0.9);
    r = lerp(r, 0.63 + m * 0.06, gv); g = lerp(g, 0.61 + m * 0.05, gv); b = lerp(b, 0.55, gv);
    r = lerp(r, 0.5, wt * 0.6); g = lerp(g, 0.5, wt * 0.6); b = lerp(b, 0.42, wt * 0.6);
    const W = mvW(x, z); if (W.id && W.e > -3) { const t = sstep(-3, 1.5, W.e); r = lerp(r, 0.36, t); g = lerp(g, 0.38, t); b = lerp(b, 0.3, t); }   // (the wet margin, the bed)
    const st = sstep(0.82, 0.6, ny) * (1 - fo * 0.6); r = lerp(r, 0.47 + m * 0.05, st); g = lerp(g, 0.43, st); b = lerp(b, 0.32, st);
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.35; r = lerp(r, 0.47, t); g = lerp(g, 0.5, t); b = lerp(b, 0.33, t); }
    MVCOL[0] = r; MVCOL[1] = g; MVCOL[2] = b; return MVCOL;
  }
  const MVGC = { G: null, m: null };   // (mvGCol's colours per grid vertex, computed once per terrain grid)
  function mvGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    if (MVGC.G !== G) { MVGC.G = G; MVGC.m = new Map(); }
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, key = jj * G.nx + ii; let c = MVGC.m.get(key);
      if (!c) { const h = mvGH(ii, jj), nx = (mvGH(ii + 1, jj) - mvGH(ii - 1, jj)) / (2 * VRC), nz = (mvGH(ii, jj + 1) - mvGH(ii, jj - 1)) / (2 * VRC);
        c = mvCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / Math.hypot(nx, 1, nz), G.dd[jj * G.nx + ii]).slice(); MVGC.m.set(key, c); }
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function mvTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex): as vrTileGeo, coloured by mvCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = mvGH(i, j);
      let nx = -(mvGH(i + st, j) - mvGH(i - st, j)) / (2 * VRC * st), nz = -(mvGH(i, j + st) - mvGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = mvCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 9; uv[k * 2 + 1] = -z / 9;
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? vrTileOn(a, b) : 0);
      const fix = (k0, dk) => { for (let q = 1; q < m; q += 2) { const a = k0 + (q - 1) * dk, b = k0 + (q + 1) * dk; pos[(k0 + q * dk) * 3 + 1] = (pos[a * 3 + 1] + pos[b * 3 + 1]) / 2; } };
      if (nb(ti, tj - 1) === 2) fix(0, 1); if (nb(ti, tj + 1) === 2) fix(m * n, 1); if (nb(ti - 1, tj) === 2) fix(0, n); if (nb(ti + 1, tj) === 2) fix(m, n);
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }
  function mvMerge(parts) {   // indexed geometries with the same attributes -> one
    if (parts.length === 1) return parts[0];
    const names = Object.keys(parts[0].attributes), n = parts.reduce((a, g) => a + g.attributes.position.count, 0), ni = parts.reduce((a, g) => a + g.index.count, 0), g = new THREE.BufferGeometry();
    for (const a of names) { const sz = parts[0].attributes[a].itemSize, arr = new Float32Array(n * sz); let o = 0; for (const p of parts) { arr.set(p.attributes[a].array, o); o += p.attributes[a].array.length; } g.setAttribute(a, new THREE.BufferAttribute(arr, sz)); }
    const idx = n > 65535 ? new Uint32Array(ni) : new Uint16Array(ni); let o = 0, base = 0; for (const p of parts) { const I = p.index.array; for (let k = 0; k < I.length; k++) idx[o++] = I[k] + base; base += p.attributes.position.count; p.dispose(); }
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere(); return g;
  }
  let mvATex = null, mvAKey = '';
  // the side roads' boards (the closure board CESTA ZAPRTA, ZAPRTO, the no-entry sign, the red-and-white stripes; then the streets' name plates, two a row: names)
  let mvA3Tex = null, mvA3Key = '';
  function mvAtlas3(names) {
    if (mvA3Tex && mvA3Key === names.join('|')) return mvA3Tex;
    if (mvA3Tex) mvA3Tex.dispose(); mvA3Key = names.join('|');
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w, wt) => { x.fillStyle = col; x.font = (wt || 900) + ' ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    x.fillStyle = '#f4f3ee'; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#c81e14'; x.lineWidth = 12; x.strokeRect(8, 8, 496, 112); txt('CESTA ZAPRTA', 256, 68, 62, '#141414', 450);
    x.fillStyle = '#f4f3ee'; x.beginPath(); x.arc(576, 64, 60, 0, TAU); x.fill(); x.strokeStyle = '#c81e14'; x.lineWidth = 15; x.beginPath(); x.arc(576, 64, 52, 0, TAU); x.stroke();   // (prepovedan promet: no vehicles either way)
    x.save(); x.beginPath(); x.rect(640, 0, 384, 128); x.clip(); x.fillStyle = '#f4f3ee'; x.fillRect(640, 0, 384, 128); x.fillStyle = '#d0201a';
    for (let q = -2; q < 14; q++) { x.beginPath(); x.moveTo(640 + q * 64, 128); x.lineTo(640 + q * 64 + 64, 0); x.lineTo(640 + q * 64 + 96, 0); x.lineTo(640 + q * 64 + 32, 128); x.fill(); } x.restore();
    x.fillStyle = '#c81e14'; x.fillRect(0, 128, 512, 128); x.strokeStyle = '#f4f3ee'; x.lineWidth = 8; x.strokeRect(10, 138, 492, 108); txt('ZAPRTO', 256, 194, 72, '#f4f3ee', 450);
    names.forEach((n, k) => { const cell = k + 3, x0 = (cell % 2) * 512, y0 = Math.floor(cell / 2) * 128;
      x.fillStyle = '#1d4f9a'; x.fillRect(x0, y0, 512, 128); x.strokeStyle = '#f4f3ee'; x.lineWidth = 7; x.strokeRect(x0 + 9, y0 + 9, 494, 110); txt(n, x0 + 256, y0 + 66, n.length > 18 ? 46 : 56, '#f4f3ee', 470, 800); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (mvA3Tex = t);
  }
  let mvA4Tex = null;
  function mvAtlas4() {   // def.barrier: the race's distance boards (150, 100, 50 m: black on white, a black border) in a 4 x 4 grid of 256 px cells
    if (mvA4Tex) return mvA4Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    ['150', '100', '50'].forEach((n, k) => { const x0 = k * 256; x.fillStyle = '#f6f6f2'; x.fillRect(x0, 0, 256, 256); x.strokeStyle = '#111'; x.lineWidth = 16; x.strokeRect(x0 + 10, 10, 236, 236);
      x.fillStyle = '#111'; x.font = '900 120px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(n, x0 + 128, 136, 220); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (mvA4Tex = t);
  }
  function mvAtlas(cps) {   // text boards (8 rows of 1024 x 128): START, CILJ, CP1-CP4 with the altitude, the race's banner, the villages' boards (two a row: 4 of them),
    // the end of a village's board (the name struck through)
    const key = cps.join('|'); if (mvATex && mvAKey === key) return mvATex;
    if (mvATex) mvATex.dispose(); mvAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w, wt) => { x.fillStyle = col; x.font = (wt || 900) + ' ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 104, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(312, 142, 400, 100); txt('CILJ', 512, 196, 96, '#111', 380);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#1d4f9a'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#f4f4f2'; x.fillRect(0, 768, 1024, 128); x.fillStyle = '#1d4f9a'; x.fillRect(0, 772, 1024, 10); x.fillStyle = '#d8261e'; x.fillRect(0, 882, 1024, 10);
    txt('MEDVODE  ·  SMLEDNIK', 512, 832, 84, '#1d4f9a', 960);
    ['MEDVODE', 'ZBILJE', 'VALBURGA', 'SMLEDNIK'].forEach((n, k) => { const x0 = (k % 2) * 512, y0 = 896 + (k > 1 ? 64 : 0);   // (half-height cells: the village boards)
      x.fillStyle = '#f6f6f2'; x.fillRect(x0, y0, 512, 64); x.strokeStyle = '#111'; x.lineWidth = 5; x.strokeRect(x0 + 6, y0 + 5, 500, 54); txt(n, x0 + 256, y0 + 34, 42, '#111', 470, 800); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (mvATex = t);
  }
  let mvFTex = null;
  function mvFacadeTex() {   // Harju's facade atlas (hjFacadeTex) with clay roof tiles in its rows 13-15 (v from the eave up: 24 courses of ~0.36 m, the tiles' joints,
    // weathering; vertex coloured): the walls and the roofs on one material
    if (mvFTex) return mvFTex;
    const src = API.hjFacadeTex().image, W = src.width, c = document.createElement('canvas'); c.width = W; c.height = src.height; const x = c.getContext('2d'), r = rng(9301), y0 = 13 * 128;
    x.drawImage(src, 0, 0); x.fillStyle = '#ffffff'; x.fillRect(0, y0, W, 384);
    for (let k = 0; k < 24; k++) { const yy = y0 + k * 16, gr = x.createLinearGradient(0, yy, 0, yy + 16); gr.addColorStop(0, 'rgba(255,255,255,0.1)'); gr.addColorStop(0.7, 'rgba(0,0,0,0.04)'); gr.addColorStop(1, 'rgba(0,0,0,0.28)'); x.fillStyle = gr; x.fillRect(0, yy, W, 16);
      for (let i = (k % 2) * 8; i < W; i += 16) { x.fillStyle = 'rgba(0,0,0,0.16)'; x.fillRect(i, yy, 1.5, 16); } }
    for (let q = 0; q < 300; q++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'; x.fillRect(r() * W, y0 + r() * 384, 2 + r() * 8, 2 + r() * 5); }
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return (mvFTex = t);
  }
  const mvRV = (q) => 0.003 + Math.min(Math.max(q, 0), 23.6) / 24 * 0.1845;   // (q tile courses up from the eave -> v in the atlas's roof rows)
  // a building of the footprint b ({ x, z, L, W, ang, hgt, kind, poly }) on the facade atlas (hjFacadeTex: gF, a GB with uvs) and the roofs (gR,
  // with uvs on the tile texture); lo / hi: the lowest and highest ground under it; R: its own random stream
  function mvBuilding(gF, b, lo, hi, R) {
    const PAL = [[0.96, 0.95, 0.91], [0.95, 0.9, 0.76], [0.97, 0.93, 0.82], [0.93, 0.84, 0.66], [0.94, 0.86, 0.78], [0.86, 0.87, 0.84], [0.88, 0.9, 0.8], [0.97, 0.96, 0.94], [0.9, 0.78, 0.62]];
    const TILE = [[0.62, 0.27, 0.18], [0.55, 0.23, 0.16], [0.47, 0.25, 0.19], [0.36, 0.25, 0.2], [0.33, 0.33, 0.35], [0.25, 0.26, 0.28], [0.58, 0.32, 0.22]];
    const k = b.kind, poly = b.poly, u = R(), u2 = R();
    let col = vary(PAL[Math.floor(u * PAL.length)], R, 0.05), row = 0, rowUp = 0, fh = 2.85, nf, roofC = vary(TILE[Math.floor(u2 * TILE.length)], R, 0.08), pitch = 0.78, flat = false;
    if (k === 0) nf = b.hgt > 0 ? clamp(Math.round(b.hgt / 3), 1, 4) : b.L * b.W < 55 ? 1 : 2;
    else if (k === 1) { nf = b.hgt > 0 ? clamp(Math.round(b.hgt / 2.9), 3, 9) : 4 + Math.floor(u2 * 2); rowUp = u < 0.5 ? 1 : 0; pitch = 0.36; flat = u2 < 0.35; }
    else if (k === 3) { nf = 1; fh = 2.5; row = rowUp = u < 0.45 ? 3 : 6; col = u < 0.45 ? vary([0.52, 0.38, 0.26], R, 0.15) : vary([0.88, 0.86, 0.8], R, 0.08); pitch = 0.5; }
    else if (k === 4) { nf = 1; fh = b.hgt > 0 ? clamp(b.hgt, 4, 12) : 5.5 + u * 2.5; row = rowUp = u < 0.5 ? 9 : 7; col = row === 7 ? vary([0.8, 0.81, 0.8], R, 0.08) : [0.98, 0.95, 0.92]; flat = b.W > 22 || u2 < 0.5; pitch = 0.22; roofC = vary([0.55, 0.56, 0.57], R, 0.1); }
    else if (k === 5) { nf = b.hgt > 0 ? clamp(Math.round(b.hgt / 3.4), 1, 4) : 2; fh = 3.4; row = rowUp = 5; pitch = 0.62; }
    else if (k === 7) { nf = 1; fh = 2.6; row = rowUp = 7; col = [0.78, 0.86, 0.86]; roofC = [0.82, 0.88, 0.9]; pitch = 0.45; }
    else { nf = 1; }
    const y0 = hi + 0.35, E = y0 + nf * fh, plinth = [0.55, 0.54, 0.52], foot = lo - 0.8;
    const pts = poly || (() => { const c = Math.cos(b.ang), s = Math.sin(b.ang); return [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2]].map(([p, q]) => [b.x + c * p - s * q, b.z + s * p + c * q]); })();
    const n = pts.length; let a2 = 0; for (let q = 0; q < n; q++) { const [ax, az] = pts[q], [bx, bz] = pts[(q + 1) % n]; a2 += ax * bz - bx * az; } const sg = a2 > 0 ? 1 : -1;
    for (let q = 0; q < n; q++) {   // the walls: the plinth, then each storey in bays of the atlas's row (a door in the ground floor of a house's long side)
      const [ax, az] = pts[q], [bx, bz] = pts[(q + 1) % n], Le = Math.hypot(bx - ax, bz - az); if (Le < 0.1) continue;
      const ox = sg * (bz - az) / Le, oz = -sg * (bx - ax) / Le, inn = [(ax + bx) / 2 - ox, (y0 + E) / 2, (az + bz) / 2 - oz], bays = Math.max(1, Math.round(Le / 3.2));
      const Q = (ya, yb, rk, c, U0, U1) => gF.quadO([ax, ya, az], [bx, ya, bz], [bx, yb, bz], [ax, yb, az], c, inn, [[U0, API.hjFV(rk, 0)], [U1, API.hjFV(rk, 0)], [U1, API.hjFV(rk, 1)], [U0, API.hjFV(rk, 1)]]);
      Q(foot, y0, 6, plinth, 0, bays);
      for (let f = 0; f < nf; f++) Q(y0 + f * fh, y0 + (f + 1) * fh, f ? rowUp : row, col, 0, bays);
    }
    // the roof: a hip (houses, schools: the footprint's rectangle, its ridge along the long side), a gable (the sheds, the long houses, some blocks),
    // or flat (halls, some blocks: the outline at the eaves' height, a parapet); tile courses on the pitched ones
    if (!poly && !flat) {
      const c = Math.cos(b.ang), s = Math.sin(b.ang), P = (p, q, y) => [b.x + c * p - s * q, y, b.z + s * p + c * q], ov = k === 4 ? 0.3 : 0.55, hl = b.L / 2 + ov, hw = b.W / 2 + ov, rise = (b.W / 2) * pitch, e = E - ov * pitch, top = E + rise;
      const hip = (k === 0 || k === 5 || k === 1) && b.L / b.W < 2.1 && R() < 0.72, rl = hip ? Math.max(0.2, hl - hw) : hl, inn = [b.x, E - 1, b.z], ut = (p, q) => [p / 2.2, mvRV(q)];
      const slope = Math.hypot(hw, rise) / 0.36;   // (the tile courses up the slope)
      for (const sd of [-1, 1]) { const cc = sd < 0 ? roofC : roofC.map(v => v * 0.93);
        gF.quadO(P(-hl, sd * hw, e), P(hl, sd * hw, e), P(rl, 0, top), P(-rl, 0, top), cc, inn, [ut(-hl, 0), ut(hl, 0), ut(rl, slope), ut(-rl, slope)]); }
      if (hip) for (const sd of [-1, 1]) gF.triO(P(sd * hl, -hw, e), P(sd * hl, hw, e), P(sd * rl, 0, top), roofC.map(v => v * (sd < 0 ? 0.97 : 0.9)), inn, null, null, ut(-hw, 0), ut(hw, 0), ut(0, slope));
      else for (const sd of [-1, 1]) gF.triO(P(sd * b.L / 2, -b.W / 2, E), P(sd * b.L / 2, b.W / 2, E), P(sd * b.L / 2, 0, top - ov * pitch * 0.5), col, inn, null, null, [0, API.hjFV(7, 0)], [2, API.hjFV(7, 0)], [1, API.hjFV(7, 1)]);   // (the gable ends: plain wall)
      if ((k === 0 || k === 1) && b.L * b.W > 60 && R() < 0.75) { const p = P((R() - 0.5) * b.L * 0.5, (R() < 0.5 ? -1 : 1) * b.W * 0.16, 0); box(gF, p[0], E + rise * 0.55, p[2], 0.55, rise * 0.45 + 0.9, 0.55, b.ang, [0.62, 0.6, 0.57], [0.2, 0.19, 0.19]); }   // (a chimney)
      return E + rise;
    }
    // flat (or an outline's): the roof's cap at the eaves (earcut), a low parapet in the wall's colour; a house's outline gets a shallow tent over it when its centre lies inside
    let cx = 0, cz = 0; for (const [x, z] of pts) { cx += x / n; cz += z / n; }
    const tent = poly && (k === 0 || k === 5 || k === 3) && inPoly(pts, cx, cz), rise = tent ? Math.min(3.2, Math.sqrt(Math.abs(a2) / 2) * 0.3) : 0;
    if (tent) { for (let q = 0; q < n; q++) { const [ax, az] = pts[q], [bx, bz] = pts[(q + 1) % n]; gF.triO([ax, E, az], [bx, E, bz], [cx, E + rise, cz], roofC.map(v => v * (0.9 + 0.1 * ((q * 7) % 3) / 2)), [cx, E - 2, cz], null, null, [ax / 2.2, mvRV(0)], [bx / 2.2, mvRV(0)], [(ax + bx) / 4.4, mvRV(Math.sqrt(Math.abs(a2) / 2) / 0.8)]); } return E + rise; }
    const tris = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []), rc = flat && k === 4 ? roofC : vary([0.42, 0.42, 0.43], R, 0.1);
    for (const [a, bb, cc] of tris) gF.triO([pts[a][0], E + 0.02, pts[a][1]], [pts[bb][0], E + 0.02, pts[bb][1]], [pts[cc][0], E + 0.02, pts[cc][1]], rc, [cx, E - 5, cz], null, null, [0.5, API.hjFV(7, 0.5)], [0.5, API.hjFV(7, 0.5)], [0.5, API.hjFV(7, 0.5)]);
    for (let q = 0; q < n; q++) { const [ax, az] = pts[q], [bx, bz] = pts[(q + 1) % n], Le = Math.hypot(bx - ax, bz - az); if (Le < 0.1) continue; const ox = sg * (bz - az) / Le * 0.25, oz = -sg * (bx - ax) / Le * 0.25;
      gF.quadO([ax, E, az], [bx, E, bz], [bx, E + 0.6, bz], [ax, E + 0.6, az], col, [(ax + bx) / 2 - ox * 4, E, (az + bz) / 2 - oz * 4], [[0, API.hjFV(7, 0)], [1, API.hjFV(7, 0)], [1, API.hjFV(7, 1)], [0, API.hjFV(7, 1)]]);
      gF.quadO([ax - ox, E + 0.6, az - oz], [bx - ox, E + 0.6, bz - oz], [bx, E + 0.6, bz], [ax, E + 0.6, az], [0.78, 0.78, 0.77], [(ax + bx) / 2, E, (az + bz) / 2], [[0, API.hjFV(7, 0.5)], [1, API.hjFV(7, 0.5)], [1, API.hjFV(7, 0.5)], [0, API.hjFV(7, 0.5)]]); }
    return E + 0.6;
  }
  function mvChurch(g, b, lo, hi) {   // a village church: white walls, a steep red roof, the bell tower at the west end with a dark pointed spire
    const H = Math.max(7, b.hgt ? b.hgt * 0.6 : 8), wl = [0.95, 0.94, 0.9], c = Math.cos(b.ang), s = Math.sin(b.ang);
    box(g, b.x, lo - 0.4, b.z, b.L, hi - lo + H, b.W, b.ang, wl, null, true); gable(g, b.x, hi + H - 0.4, b.z, b.L + 0.6, b.W + 0.6, b.W * 0.55, b.ang, [0.55, 0.24, 0.16], wl);
    const tw = Math.min(5, b.W * 0.48), sd = c * 1 + s * 0 > 0 ? -1 : 1, tx = b.x + c * sd * (b.L / 2 + tw / 2 - 0.4), tz = b.z + s * sd * (b.L / 2 + tw / 2 - 0.4);
    box(g, tx, lo - 0.4, tz, tw, hi - lo + H + 12, tw, b.ang, wl, null, true); box(g, tx, hi + H + 9.5, tz, tw + 0.08, 1.6, tw + 0.08, b.ang, [0.32, 0.3, 0.28], null, true);
    cone(g, tx, hi + H + 11.6, tz, tw * 0.74, 10, 4, [0.24, 0.25, 0.27], [0.3, 0.3, 0.32], b.ang + Math.PI / 4); cyl(g, tx, hi + H + 21.4, tz, 0.05, 1.6, 4, [0.85, 0.7, 0.25]);
    return hi + H + 23;
  }
  let mvSTex = null;
  function mvStoneTex() {   // the castle's masonry on a 4 m tile (512 px, seamless): 14 courses of rough limestone, every stone its own tone (pale limestone, grey, ochre, dark weathered) with a jittered outline,
    // speckles, lichen and stains, a few patches of old lime plaster and damp; the pale patch in the corner (0..56 px) is the "plain" spot where the parts without a picture (rubble, ivy, bushes, floors) take their colour from
    if (mvSTex) return mvSTex;
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(5521);
    x.fillStyle = '#4f4a41'; x.fillRect(0, 0, S, S);
    const nC = 14, hs = []; let tot = 0; for (let k = 0; k < nC; k++) { const h = 0.5 + r() * 1.1; hs.push(h); tot += h; }
    const TONE = [[0.9, 0.04, 0.35], [0.76, 0.0, 0.3], [0.8, 0.09, 0.2], [0.62, 0.03, 0.15]];   // (lightness, warmth, share: pale limestone, grey, ochre, dark weathered)
    let y = 0;
    for (let k = 0; k < nC; k++) {
      const hh = hs[k] / tot * S, nB = 6 + Math.floor(r() * 4), ws = []; let tw = 0; for (let q = 0; q < nB; q++) { const w = 0.35 + r() * 1.15; ws.push(w); tw += w; }
      let xx = r() * S;
      for (let q = 0; q < nB; q++) {
        const ww = ws[q] / tw * S, gp = 2 + r() * 3.5; let u = r(), tn = TONE[0]; for (const t of TONE) { if (u < t[2]) { tn = t; break; } u -= t[2]; }
        const L = tn[0] * (0.92 + r() * 0.14), wm = tn[1] + (r() - 0.5) * 0.04, jt = () => (r() - 0.5) * 3.2, dets = [];
        const jp = [[0, 0], [0.5, 0], [1, 0], [1, 0.5], [1, 1], [0.5, 1], [0, 1], [0, 0.5]].map(([a, b]) => [a, b, jt(), jt()]);
        for (let d = 0; d < 12; d++) dets.push([r() * ww, r() * hh, 1 + r() * 4, 1 + r() * 3, r() < 0.5 ? 'rgba(0,0,0,' + (0.05 + r() * 0.1) + ')' : 'rgba(255,255,255,' + (0.05 + r() * 0.08) + ')']);
        if (r() < 0.3) dets.push([r() * ww * 0.6, r() * hh * 0.5, ww * (0.15 + r() * 0.3), hh * (0.2 + r() * 0.35), 'rgba(160,172,100,' + (0.2 + r() * 0.2) + ')']);   // (lichen)
        if (r() < 0.18) dets.push([ww * 0.2, 0, ww * 0.2, hh, 'rgba(30,28,22,0.16)']);   // (a damp stain running down)
        for (const ox of [0, -S]) {
          const bx = xx + ox + gp / 2, by = y + gp / 2, bw = ww - gp, bh = hh - gp; if (bx > S || bx + bw < 0) continue;
          const rgb = (k2) => 'rgb(' + [L * k2 * (1 + wm), L * k2, L * k2 * (1 - wm * 1.6)].map(v => Math.min(255, Math.round(v * 255))).join(',') + ')', gr = x.createLinearGradient(bx, by, bx + bw * 0.4, by + bh);
          gr.addColorStop(0, rgb(1.05)); gr.addColorStop(1, rgb(0.88));
          x.fillStyle = gr; x.beginPath(); jp.forEach(([a, b, jx, jy], i) => { const px = bx + a * bw + jx, py = by + b * bh + jy; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.fill();
          for (const [dx, dy, w, h, f] of dets) { x.fillStyle = f; x.fillRect(bx + dx, by + dy, w, h); }
          x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(bx + 2, by + 0.5, bw - 4, 1.2); x.fillStyle = 'rgba(0,0,0,0.14)'; x.fillRect(bx + 2, by + bh - 1.5, bw - 4, 1.5);   // (the lit top edge, the shaded foot)
        }
        xx += ww;
      }
      y += hh;
    }
    for (let q = 0; q < 5; q++) {   // (old lime plaster, pale and soft; damp, dark and soft)
      const pale = q < 3, px = 80 + r() * (S - 160), py = 80 + r() * (S - 160), rad = 40 + r() * 50, gr = x.createRadialGradient(px, py, 0, px, py, rad);
      gr.addColorStop(0, pale ? 'rgba(238,230,208,0.34)' : 'rgba(40,46,34,0.26)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
    for (let q = 0; q < 2600; q++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'; x.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 2); }
    x.fillStyle = '#dedcd4'; x.fillRect(0, 0, 56, 56);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return (mvSTex = t);
  }
  // Stari grad above Smlednik as one object (a mesh of its own, 'mvCastle', on the masonry picture), built from the plan below: the castle's layout as the public descriptions give it (the late
  // Romanesque keep with walls over 3 m thick, the Gothic palace leaning on the western wall with its pointed portal, the curtain wall of an irregular shape up to 1.5 m thick, the Renaissance
  // outer ring with three smaller towers) on the OSM footprint (b.pts): every part inside it. Open ruins: no roofs, walls broken at different heights, rubble, ivy and scrub.
  // Plan coordinates: metres from the footprint's centre (x east, z south). Returns the counts of the parts (the browser test reads them) and the vertex count.
  function mvCastle(grp, b, R, cut, ownTex) {
    const g = new GB(true); g.dUV = [0.055, 0.055];
    const SP = 4, WP = (p) => [b.x + p[0], b.z + p[1]], gnd = (x, z) => mvGround(x, z), rr = (a, c) => a + (c - a) * R(), pick = (a) => a[Math.floor(R() * a.length)];
    const ST = { towers: 0, keeps: 0, palaces: 0, gates: 0, chapels: 0, cisterns: 0, runs: 0, columns: 0, openings: 0, merlons: 0, tufts: 0, slabs: 0, windows: 0, doors: 0, ivy: 0, stones: 0, bushes: 0, trees: 0, maxTop: 0 };
    const STONE = [[0.83, 0.81, 0.76], [0.79, 0.78, 0.76], [0.86, 0.84, 0.79], [0.78, 0.73, 0.65], [0.72, 0.71, 0.69], [0.81, 0.77, 0.69]], MOSS = [0.38, 0.47, 0.23], IVY = [[0.2, 0.34, 0.14], [0.16, 0.29, 0.12], [0.26, 0.38, 0.16]], LEAF = [[0.27, 0.42, 0.16], [0.22, 0.36, 0.14], [0.33, 0.45, 0.18]];
    const k3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k], EARTH = [[0.56, 0.5, 0.35], [0.5, 0.53, 0.3], [0.64, 0.6, 0.51], [0.46, 0.48, 0.28]];
    const dSeg = (px, pz, a, c) => { const dx = c[0] - a[0], dz = c[1] - a[1], t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(px - a[0] - t * dx, pz - a[1] - t * dz); };
    const dLoop = (pts, x, z) => { let d = 99; for (let i = 0; i < pts.length; i++) d = Math.min(d, dSeg(x, z, pts[i], pts[(i + 1) % pts.length])); return d; };
    const okP = (x, z, m) => inPoly(b.pts, x, z) && dLoop(b.pts, x, z) > m;   // (inside the footprint, m clear of its edge)
    let oU = 0, oV = 0;
    const face = (a, c1, c2, d, col, inside, cols) => {   // a quad (a triangle when d is null) with the masonry picture projected on its plane
      const ux = c1[0] - a[0], uy = c1[1] - a[1], uz = c1[2] - a[2], vx = c2[0] - a[0], vy = c2[1] - a[1], vz = c2[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz) || 1, hz = Math.hypot(nx, nz) || 1, tx = -nz / hz, tz = nx / hz, up = Math.abs(ny / nl) > 0.7;
      const uv = (p) => up ? [(p[0] + oU) / SP, (p[2] + oV) / SP] : [(p[0] * tx + p[2] * tz + oU) / SP, (p[1] + oV) / SP];
      if (d) g.quadO(a, c1, c2, d, col, inside, [uv(a), uv(c1), uv(c2), uv(d)], cols); else g.triO(a, c1, c2, col, inside, null, null, uv(a), uv(c1), uv(c2));
    };
    const cum = (pts, closed) => { const o = [0]; for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) { const a = pts[i], c = pts[(i + 1) % pts.length]; o.push(o[i] + Math.hypot(c[0] - a[0], c[1] - a[1])); } return o; };
    const rag = (s0, s1, lo, hi, e) => {   // a broken wall top from s0 to s1: heights between lo and hi (most of them low when e > 1), now and then a step
      const o = []; let s = s0, h = lerp(lo, hi, Math.pow(R(), e || 1.4)); o.push([s, h]);
      while (s < s1 - 0.01) { s = Math.min(s1, s + 0.8 + R() * 2.2); const hn = lerp(lo, hi, Math.pow(R(), e || 1.4)); if (R() < 0.4) { o.push([s, h]); h = hn; o.push([s, h]); } else { h = lerp(h, hn, 0.7); o.push([s, h]); } }
      return o;
    };
    const chunk = (x, z, sx, sy, sz, rot, col) => {   // a fallen stone: a squat block, its top corners pulled about, sunk a little (12 triangles)
      if (!okP(x, z, Math.max(sx, sz) * 0.75)) return;
      const y0 = gnd(x, z) - 0.12, c = Math.cos(rot), s = Math.sin(rot), cn = [[-1, -1], [1, -1], [1, 1], [-1, 1]], inn = [x, y0 + sy / 2, z];
      const B = cn.map(([p, q]) => [x + (p * sx / 2) * c - (q * sz / 2) * s, y0, z + (p * sx / 2) * s + (q * sz / 2) * c]);
      const T = cn.map(([p, q]) => { const k = 0.55 + R() * 0.4, lx = p * sx / 2 * k, lz = q * sz / 2 * k; return [x + lx * c - lz * s + (R() - 0.5) * sx * 0.25, y0 + sy * (0.72 + R() * 0.28), z + lx * s + lz * c + (R() - 0.5) * sz * 0.25]; });
      for (let k = 0; k < 4; k++) { const j = (k + 1) % 4; g.quadO(B[k], B[j], T[j], T[k], k3(col, 0.78 + 0.1 * k), inn); }
      g.quadO(T[0], T[1], T[2], T[3], k3(col, 1.04), inn); ST.stones++;
    };
    const slab = (x, z, L, Wd, H, rot, tilt) => {   // a fallen piece of wall lying on the ground, one end lifted on the rubble (masonry on its faces: 5 quads)
      if (!okP(x, z, Math.max(L, Wd) * 0.6)) return;
      const c = Math.cos(rot), s = Math.sin(rot), y0 = gnd(x, z) - 0.15, P = (u, v, h) => [x + (u * L / 2) * c - (v * Wd / 2) * s, y0 + h + (u + 1) * tilt * L / 2, z + (u * L / 2) * s + (v * Wd / 2) * c], inn = [x, y0 + H / 2, z], cc = vary(pick(STONE), R, 0.12);
      oU = R() * SP; oV = R() * SP;
      face(P(-1, -1, 0), P(1, -1, 0), P(1, -1, H), P(-1, -1, H), cc, inn, [k3(cc, 0.75), k3(cc, 0.75), cc, cc]); face(P(1, -1, 0), P(1, 1, 0), P(1, 1, H), P(1, -1, H), k3(cc, 0.9), inn); face(P(1, 1, 0), P(-1, 1, 0), P(-1, 1, H), P(1, 1, H), cc, inn, [k3(cc, 0.75), k3(cc, 0.75), cc, cc]);
      face(P(-1, 1, 0), P(-1, -1, 0), P(-1, -1, H), P(-1, 1, H), k3(cc, 0.9), inn); face(P(-1, -1, H), P(1, -1, H), P(1, 1, H), P(-1, 1, H), k3(cc, 1.06), inn); ST.slabs++;
    };
    const heap = (x, z, rad, n) => { for (let k = 0; k < n; k++) { const a = R() * 6.283, d = rad * Math.sqrt(R()) * 0.95, sz = rr(0.3, 0.55) + (1 - d / rad) * rr(0.1, 0.6); chunk(x + Math.cos(a) * d, z + Math.sin(a) * d, sz * rr(1, 1.5), sz * rr(0.5, 0.9), sz, R() * 3.14, vary(pick(STONE), R, 0.18)); } };
    const bush = (x, y, z, r) => { ico(g, x, y + r * 0.3, z, r, 0.62, vary(pick(LEAF), R, 0.3), R, 0.5); ST.bushes++; };
    const tuft = (x, y, z) => { const k = vary(pick(LEAF), R, 0.3); for (let q = 0; q < 3; q++) cone(g, x + rr(-0.18, 0.18), y, z + rr(-0.18, 0.18), rr(0.07, 0.12), rr(0.3, 0.65), 3, k3(k, 0.8), k3(k, 1.2), R() * 3); };   // (a clump of grass: three thin spikes, 9 triangles)
    const sapling = (x, z, h) => { const y = gnd(x, z); cyl(g, x, y - 0.1, z, 0.1, h, 5, [0.38, 0.31, 0.24], null, 0.05); for (let k = 0; k < 3; k++) ico(g, x + (R() - 0.5) * 0.9, y + h * (0.5 + 0.17 * k), z + (R() - 0.5) * 0.9, rr(0.7, 1.15) * (1 - k * 0.2), 0.8, vary(pick(LEAF), R, 0.3), R, 0.5); ST.trees++; };
    const patch = (cx, cz, rot, w, d, col, dy, nu, nv, vr) => {   // a flat piece of ground (floor, earth, paving), following the terrain
      const c = Math.cos(rot), s = Math.sin(rot), P = (i, j) => { const lx = (i / nu - 0.5) * w, lz = (j / nv - 0.5) * d, x = cx + lx * c - lz * s, z = cz + lx * s + lz * c; return [x, gnd(x, z) + dy, z]; };
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const k = vary(Array.isArray(col[0]) ? pick(col) : col, R, vr || 0.1); g.quadUp(P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1), [k, k, k, k]); }
    };
    const blob = (cx, cz, r, col, dy) => {   // a ragged flat patch of ground (earth, dry grass, stone dust) following the terrain
      const n = 9, rim = [], c0 = [cx, gnd(cx, cz) + dy, cz];
      for (let k = 0; k < n; k++) { const a = k / n * 6.283 + R() * 0.3, d = r * rr(0.6, 1.1), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; rim.push([x, gnd(x, z) + dy, z]); }
      for (let k = 0; k < n; k++) g.triO(c0, rim[k], rim[(k + 1) % n], vary(col, R, 0.12), [cx, c0[1] - 3, cz]);
    };
    const ivy = (pa, pb, side, y0, y1) => {   // a patch of ivy on a wall face: a ragged fan a few cm off the stone
      const dx = pb[0] - pa[0], dz = pb[1] - pa[1], l = Math.hypot(dx, dz) || 1, tx = dx / l, tz = dz / l, nx = -tz * side, nz = tx * side, w = Math.min(l * 0.45, rr(0.4, 1.1)), h = Math.min((y1 - y0) * 0.4, rr(0.6, 1.9));
      if (h < 0.3) return;
      const cu = rr(-l * 0.25, l * 0.25), yc = rr(y0 + h * 0.7, y1 - h * 0.7), cx = (pa[0] + pb[0]) / 2 + tx * cu + nx * 0.07, cz = (pa[1] + pb[1]) / 2 + tz * cu + nz * 0.07, base = vary(pick(IVY), R, 0.3), inn = [cx - nx, yc, cz - nz], rim = [];
      for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, q = rr(0.55, 1.1); rim.push([cx + tx * Math.cos(a) * w * q, yc + Math.sin(a) * h * q, cz + tz * Math.cos(a) * w * q]); }
      for (let k = 0; k < 9; k++) g.triO([cx, yc, cz], rim[k], rim[(k + 1) % 9], k3(base, 1.1), inn, k3(base, 0.85), k3(base, 0.85));
      ST.ivy++;
    };
    // a masonry wall along the path pts (th thick), as columns 1-2 m long, each with its own stone colour. o: { closed, prof: [[s, height above the ground] ...] piecewise linear along the path (two entries
    // with one s: a step), ops: [{ s0, s1, yb, ys, rise, kind }] openings (sill yb, springing line ys, a pointed arch of that rise above it; rise 0: a flat lintel; a wall broken lower than the arch is
    // open to the sky), step (column length), skip(x, z): a column left out, yard (+1 left of the path / -1 right / 0 both: where the rubble lies), rub, ivy, bush: the chance per column }
    function wall(pts, th, o) {
      const closed = !!o.closed, n = pts.length, V = pts.map(WP), ns = closed ? n : n - 1, ht = th / 2, st = o.step || 1.8, bury = 0.5, prof = o.prof, ops = o.ops || [];
      oU = R() * SP; oV = R() * SP; ST.runs++;
      const sg = []; let tot = 0;
      for (let i = 0; i < ns; i++) { const a = V[i], c = V[(i + 1) % n], l = Math.hypot(c[0] - a[0], c[1] - a[1]); sg.push({ a, l, s0: tot, dx: (c[0] - a[0]) / l, dz: (c[1] - a[1]) / l }); tot += l; }
      const bs = [0, tot]; for (const q of sg) bs.push(q.s0); for (const p of prof) bs.push(p[0]);
      for (const op of ops) { const k = op.rise > 0 ? Math.max(2, Math.ceil((op.s1 - op.s0) / 0.3)) : 1; for (let q = 0; q <= k; q++) bs.push(lerp(op.s0, op.s1, q / k)); }
      bs.sort((p, q) => p - q);
      const S = []; for (const s of bs) if (s > -1e-6 && s < tot + 1e-6 && (!S.length || s - S[S.length - 1] > 0.03)) S.push(Math.min(s, tot));
      const T = [S[0]]; for (let i = 1; i < S.length; i++) { const k = Math.max(1, Math.round((S[i] - S[i - 1]) / st)); for (let q = 1; q <= k; q++) T.push(lerp(S[i - 1], S[i], q / k)); }
      const sec = (s) => {   // the section across the wall at s: its middle and its left and right edges (mitred at the corners)
        let i = sg.length - 1; for (let q = 0; q < sg.length; q++) if (s < sg[q].s0 + sg[q].l - 1e-6) { i = q; break; }
        const q = sg[i], t = s - q.s0, x = q.a[0] + q.dx * t, z = q.a[1] + q.dz * t; let n1 = null, n2 = null, mx = -q.dz, mz = q.dx;
        if (t < 1e-5) { n1 = closed ? sg[(i + ns - 1) % ns] : i > 0 ? sg[i - 1] : null; n2 = q; } else if (Math.abs(t - q.l) < 1e-5) { n1 = q; n2 = closed ? sg[(i + 1) % ns] : i < ns - 1 ? sg[i + 1] : null; }
        if (n1 && n2) { const ax = -n1.dz, az = n1.dx, bx = -n2.dz, bz = n2.dx, f = 1 / Math.max(1 + ax * bx + az * bz, 0.3); mx = (ax + bx) * f; mz = (az + bz) * f; }
        const L = [x + mx * ht, z + mz * ht], Rr = [x - mx * ht, z - mz * ht], bL = gnd(L[0], L[1]) - bury, bR = gnd(Rr[0], Rr[1]) - bury;
        return { x, z, L, R: Rr, base: Math.min(bL, bR), bL, bR, gc: gnd(x, z) };   // (base: the lower face's foot; each face's own, bL / bR: a thick wall on a slope, a bank beside the road, is buried bury deep on both sides, no deeper)
      };
      const secs = T.map(sec);
      const hAt = (s, sm) => { for (let k = 0; k + 1 < prof.length; k++) { const p0 = prof[k], p1 = prof[k + 1]; if (p1[0] - p0[0] > 1e-6 && sm >= p0[0] - 1e-6 && sm <= p1[0] + 1e-6) return lerp(p0[1], p1[1], clamp((s - p0[0]) / (p1[0] - p0[0]), 0, 1)); } return prof[prof.length - 1][1]; };
      for (const op of ops) { const m = sec((op.s0 + op.s1) / 2); op.g0 = m.gc; ST.openings++; if (op.kind === 'win') ST.windows++; else if (op.kind === 'door') ST.doors++; }
      const C = [];
      for (let k = 0; k + 1 < T.length; k++) {
        const A = secs[k], B = secs[k + 1], sa = T[k], sb = T[k + 1], sm = (sa + sb) / 2, cx = (A.x + B.x) / 2, cz = (A.z + B.z) / 2, op = ops.find(q => sm > q.s0 && sm < q.s1), col = { A, B, ivA: [], ivB: [], cx, cz, c: null, op: !!op };
        if (o.skip && o.skip(cx - b.x, cz - b.z)) { C.push(col); continue; }
        const tA = A.gc + hAt(sa, sm), tB = B.gc + hAt(sb, sm); ST.columns++; ST.maxTop = Math.max(ST.maxTop, tA - A.gc, tB - B.gc);
        if (op) {
          const sill = op.g0 + op.yb, spr = op.g0 + op.ys; let yl = spr;
          if (op.rise > 0) { const hw = (op.s1 - op.s0) / 2, cs = (op.s0 + op.s1) / 2, u = Math.min(1, Math.max(Math.abs(sa - cs), Math.abs(sb - cs)) / hw); yl = spr + op.rise * (1 - Math.pow(u, 1.8)); }
          if (op.yb > 0.05) { col.ivA.push([A.base, Math.min(sill, tA)]); col.ivB.push([B.base, Math.min(sill, tB)]); }
          if (tA > yl + 0.12 && tB > yl + 0.12) { col.ivA.push([yl, tA]); col.ivB.push([yl, tB]); }
        } else { col.ivA.push([A.base, tA]); col.ivB.push([B.base, tB]); }
        col.c = vary(R() < 0.55 ? STONE[0] : pick(STONE), R, 0.16);
        const cc = col.c, moss = R() < 0.3 ? rr(0.35, 0.9) : 0;   // (moss on the top: the share of its corners)
        col.ivA.forEach(([loA, hiA], j) => {
          const [loB, hiB] = col.ivB[j]; if (hiA - loA < 0.03 && hiB - loB < 0.03) return;
          const inn = [cx, (loA + loB + hiA + hiB) / 4, cz], foot = loA <= A.base + 0.01, dk = foot ? 0.7 : 1, sc = [k3(cc, dk), k3(cc, dk), k3(cc, 1), k3(cc, 1)];
          const lAL = foot ? Math.min(A.bL, hiA) : loA, lBL = foot ? Math.min(B.bL, hiB) : loB, lAR = foot ? Math.min(A.bR, hiA) : loA, lBR = foot ? Math.min(B.bR, hiB) : loB;   // (the foot: each face from its own ground)
          face([A.L[0], lAL, A.L[1]], [B.L[0], lBL, B.L[1]], [B.L[0], hiB, B.L[1]], [A.L[0], hiA, A.L[1]], cc, inn, sc);
          face([A.R[0], lAR, A.R[1]], [B.R[0], lBR, B.R[1]], [B.R[0], hiB, B.R[1]], [A.R[0], hiA, A.R[1]], cc, inn, sc);
          const tp = k3(cc, 1.06), tm = () => (R() < moss ? vary(MOSS, R, 0.3) : tp);
          face([A.L[0], hiA, A.L[1]], [B.L[0], hiB, B.L[1]], [B.R[0], hiB, B.R[1]], [A.R[0], hiA, A.R[1]], tp, inn, [tm(), tm(), tm(), tm()]);
          if (!foot) face([A.L[0], loA, A.L[1]], [B.L[0], loB, B.L[1]], [B.R[0], loB, B.R[1]], [A.R[0], loA, A.R[1]], k3(cc, 0.6), inn);   // (the underside of a lintel or an arch)
        });
        if (!op && o.merl && R() < o.merl[0] && tA > A.gc + 2.2 && tB > B.gc + 2.2 && !(o.noMerl && o.noMerl(cx - b.x, cz - b.z))) {   // (a stump of the parapet on the outer half of the wall-walk, 0.9 m long and 0.5 m thick)
          const sd = o.merl[1], e0 = sd > 0 ? A.L : A.R, e1 = sd > 0 ? B.L : B.R, i0 = sd > 0 ? A.R : A.L, i1 = sd > 0 ? B.R : B.L, cl = Math.hypot(e1[0] - e0[0], e1[1] - e0[1]) || 1, f0 = rr(0.08, 0.4), f1 = Math.min(0.95, f0 + Math.min(0.9 / cl, 0.55)), ph = rr(0.7, 1.15);
          const O = (f, y) => [lerp(e0[0], e1[0], f), y, lerp(e0[1], e1[1], f)], I = (f, y) => { const ox = lerp(e0[0], e1[0], f), oz = lerp(e0[1], e1[1], f), px = lerp(i0[0], i1[0], f), pz = lerp(i0[1], i1[1], f), k = 0.5 / th; return [ox + (px - ox) * k, y, oz + (pz - oz) * k]; };
          const y0 = lerp(tA, tB, f0), y1 = lerp(tA, tB, f1), yt = Math.max(y0, y1) + ph, mi = [(O(f0, 0)[0] + I(f1, 0)[0]) / 2, (y0 + yt) / 2, (O(f0, 0)[2] + I(f1, 0)[2]) / 2], mc = k3(cc, 1.02);
          face(O(f0, y0), O(f1, y1), O(f1, yt), O(f0, yt), mc, mi); face(I(f0, y0), I(f1, y1), I(f1, yt), I(f0, yt), mc, mi); face(O(f0, yt), O(f1, yt), I(f1, yt), I(f0, yt), k3(cc, 1.1), mi);
          face(O(f0, y0), I(f0, y0), I(f0, yt), O(f0, yt), k3(cc, 0.9), mi); face(O(f1, y1), I(f1, y1), I(f1, yt), O(f1, yt), k3(cc, 0.9), mi); ST.merlons++;
        }
        const mt = (tA + tB) / 2, mh = mt - Math.min(A.base, B.base) - bury;
        if (!op && mh > 1.5) {
          if (R() < (o.ivy == null ? 0.1 : o.ivy)) { const sd = R() < 0.5 ? 1 : -1; ivy(sd > 0 ? A.L : A.R, sd > 0 ? B.L : B.R, sd, Math.min(A.base, B.base) + bury + 0.3, mt - 0.1); }
          if (R() < (o.bush == null ? 0.05 : o.bush)) bush(cx + rr(-0.3, 0.3), mt, cz + rr(-0.3, 0.3), rr(0.45, 0.85));
          if (R() < 0.45) { const f = R(), tf = rr(-0.2, 0.2) * th; tuft(lerp(A.x, B.x, f) + (A.L[0] - A.R[0]) / th * tf, lerp(tA, tB, f), lerp(A.z, B.z, f) + (A.L[1] - A.R[1]) / th * tf); ST.tufts++; }   // (grass on the top)
        }
        if (!op && o.yard !== undefined && o.yard !== 0 && R() < 0.5) { const nx = (B.L[0] - B.R[0]) / th, nz = (B.L[1] - B.R[1]) / th, d = ht + rr(0.15, 0.5), f = R(), x = lerp(A.x, B.x, f) + nx * o.yard * d, z = lerp(A.z, B.z, f) + nz * o.yard * d; if (okP(x, z, 0.3)) { tuft(x, gnd(x, z) - 0.05, z); ST.tufts++; } }   // (and at the foot, on the yard side)
        if (!op && o.yard != null && R() < (o.rub == null ? 0.2 : o.rub)) {
          const nx = (B.L[0] - B.R[0]) / th, nz = (B.L[1] - B.R[1]) / th, sd = o.yard === 0 ? (R() < 0.5 ? 1 : -1) : o.yard;
          for (let q = 0, m = 1 + Math.floor(R() * 3); q < m; q++) { const d = ht + rr(0.3, 1.1), z0 = rr(0.25, 0.7); chunk(cx + nx * sd * d + rr(-0.6, 0.6), cz + nz * sd * d + rr(-0.6, 0.6), z0 * rr(1, 1.6), z0 * rr(0.5, 0.9), z0, R() * 3.14, vary(pick(STONE), R, 0.18)); }
        }
        C.push(col);
      }
      // the faces where neighbouring columns meet at different heights (and the ends of an open wall)
      const capQ = (Sx, ivs, others, inside, cc, jam) => {
        for (const [y0, y1] of ivs) {
          let pcs = [[y0, y1]]; for (const [z0, z1] of others) { const np = []; for (const [p0, p1] of pcs) { if (z1 <= p0 || z0 >= p1) np.push([p0, p1]); else { if (z0 > p0) np.push([p0, z0]); if (z1 < p1) np.push([z1, p1]); } } pcs = np; }
          for (const [p0, p1] of pcs) if (p1 - p0 > 0.03) { const ft = p0 <= Sx.base + 0.01, pL = ft ? Math.min(Math.max(p0, Sx.bL), p1) : p0, pR = ft ? Math.min(Math.max(p0, Sx.bR), p1) : p0;   // (a piece at the foot: each side from its own ground)
            face([Sx.L[0], pL, Sx.L[1]], [Sx.R[0], pR, Sx.R[1]], [Sx.R[0], p1, Sx.R[1]], [Sx.L[0], p1, Sx.L[1]], k3(cc, jam ? 1.04 : 0.86), inside); }
        }
      };
      const nC = C.length, mid = (K) => (K.ivB[0][0] + K.ivB[K.ivB.length - 1][1]) / 2;
      for (let k = closed ? 0 : -1; k < nC; k++) {
        const P = k < 0 ? null : C[k], Q = k + 1 < nC ? C[k + 1] : closed ? C[0] : null, Sx = P ? P.B : Q.A;
        if (P && P.ivB.length) capQ(Sx, P.ivB, Q ? Q.ivA : [], [P.cx, mid(P), P.cz], P.c, P.op || (Q && Q.op));
        if (Q && Q.ivA.length) capQ(Sx, Q.ivA, P ? P.ivB : [], [Q.cx, mid(Q), Q.cz], Q.c, Q.op || (P && P.op));
      }
    }
    // ------------------------------------------------------------------ the plan
    const RING = [[-20.1, 0.4], [-19.1, 3.4], [-14.4, 5.5], [-11.4, 8.5], [10.3, 18.1], [11.6, 20.1], [13.9, 18], [12.5, 15.8], [19.3, 9.8], [24.1, 4.6], [28.5, 3.1], [28.2, 2.3], [26.5, 2], [23.7, 0.7], [19, 0.8], [18.3, -1.1], [1.8, -7.1], [-10, -16.3], [-10.5, -13.3], [-17, -0.9]];
    const sv = cum(RING, true), A = (i, d) => sv[i] + d;
    const KC = [-4.3, 7.2], KA = 24 * Math.PI / 180, KH = 4.7, kc = Math.cos(KA), ks = Math.sin(KA), kp = (u, v) => [KC[0] + u * kc - v * ks, KC[1] + u * ks + v * kc];   // (the keep: its own axes, u along its north face, v to the south)
    const TW = [[11.3, 16.6, 2.3, 4.2, 6.6], [24.3, 2.8, 2.3, 2.6, 5.2], [-8.9, -13.1, 2.3, 5.2, 8.2]];   // (the three round towers of the outer ring: centre, outer radius, lowest and highest top)
    const inKeep = (x, z) => { const dx = x - KC[0], dz = z - KC[1], u = dx * kc + dz * ks, v = -dx * ks + dz * kc; return Math.abs(u) < KH - 0.2 && Math.abs(v) < KH - 0.2; };
    const inTower = (x, z) => TW.some(([tx, tz, r]) => Math.hypot(x - tx, z - tz) < r - 0.35);
    const PV = RING[19], PL = Math.hypot(RING[18][0] - PV[0], RING[18][1] - PV[1]), PUx = (RING[18][0] - PV[0]) / PL, PUz = (RING[18][1] - PV[1]) / PL, PD = 7.8, PQ = (u, v) => [PV[0] + PUx * u - PUz * v, PV[1] + PUz * u + PUx * v];   // (the palace's frame: u along its rear wall to the north, v into the yard)
    const inPalace = (x, z) => { const u = (x - PV[0]) * PUx + (z - PV[1]) * PUz, v = -(x - PV[0]) * PUz + (z - PV[1]) * PUx; return u > -0.5 && u < 14 && v > -1 && v < PD + 1.8; };
    const GS = A(15, 14.2);   // the gate in the north-east wall
    // 1) the curtain wall round the whole hilltop outline
    {
      const pr = [], sec = (s0, s1, lo, hi, e) => { pr.push(...rag(s0, s1, lo, hi, e)); };
      sec(A(0, 0), A(3, 1.3), 1.8, 4.4); sec(A(3, 1.3), A(3, 10.7), 3.5, 4); sec(A(3, 10.7), A(3, 16.8), 2.2, 4.4); sec(A(3, 16.8), A(3, 20.4), 0.25, 0.9); sec(A(3, 20.4), A(5, 0), 2.6, 4.3);   // (the south wall: a breach 3.6 m wide)
      sec(A(5, 0), A(7, 0), 3, 5); sec(A(7, 0), A(8, 3.5), 1.2, 3.4); sec(A(8, 3.5), A(8, 5.5), 0.3, 0.7); sec(A(8, 5.5), A(10, 0), 1.6, 4.2); sec(A(10, 0), A(15, 0), 2.5, 5);
      sec(A(15, 0), A(15, 7.6), 1.4, 3.6); sec(A(15, 7.6), A(16, 3), 4.4, 5.8); sec(A(16, 3), A(16, 11.5), 2.6, 5.4); sec(A(16, 11.5), A(17, 0), 4, 6);
      sec(A(17, 0), A(18, 0), 4.5, 7); sec(A(18, 0), A(19, 0), 6.6, 8.8, 0.9); sec(A(19, 0), A(20, 0), 3.5, 6);
      const win = (u, yb, ys, rise, w) => ({ s0: A(18, PL - u - w / 2), s1: A(18, PL - u + w / 2), yb, ys, rise, kind: 'win' });   // (the palace's rear wall: windows of both floors; u from its south end)
      const slit = (i, d, yb) => ({ s0: A(i, d), s1: A(i, d + 0.35), yb, ys: yb + 1, rise: 0, kind: 'slit' });
      const ops = [{ s0: GS - 1.4, s1: GS + 1.4, yb: 0, ys: 2.1, rise: 1.25, kind: 'door' }, win(2.6, 1.6, 3, 0, 0.7), win(5.7, 1.6, 3, 0, 0.7), win(8.7, 1.6, 3, 0, 0.7), win(11.4, 1.6, 3, 0, 0.7), win(4.2, 4.9, 6.5, 0.6, 1), win(10, 4.9, 6.5, 0.6, 1), slit(16, 6.6, 1.5), slit(16, 10.4, 1.7), slit(7, 4.2, 1)];
      wall(RING, 1.5, { closed: true, prof: pr, ops, yard: -1, merl: [0.4, 1], noMerl: (x, z) => inPalace(x, z), rub: 0.22, ivy: 0.13, bush: 0.07, skip: (x, z) => inKeep(x, z) || inTower(x, z) });
    }
    // the gate: a stump of the gate tower on either side on the yard side, the threshold paved
    { const a = RING[15], c = RING[16], l = sv[16] - sv[15], dx = (c[0] - a[0]) / l, dz = (c[1] - a[1]) / l, p = [a[0] + dx * 14.2, a[1] + dz * 14.2];
      let nx = dz, nz = -dx; if (!inPoly(RING, p[0] + nx * 2, p[1] + nz * 2)) { nx = -nx; nz = -nz; }   // (into the yard)
      for (const e of [-1, 1]) { const q0 = [p[0] + dx * e * 2 + nx * 0.5, p[1] + dz * e * 2 + nz * 0.5]; wall([q0, [q0[0] + nx * 1.8, q0[1] + nz * 1.8]], 1.4, { prof: [[0, 4.6], [1.8, 3]], step: 1, yard: 0, rub: 0.1, ivy: 0.2 }); }
      patch(b.x + p[0] + nx, b.z + p[1] + nz, Math.atan2(dz, dx), 3.2, 3.4, [[0.5, 0.47, 0.42], [0.56, 0.53, 0.47]], 0.05, 3, 3, 0.1); ST.gates++; }
    // 2) the three round towers (a decagon of 1.2 m walls; a doorway facing the yard, a loophole)
    TW.forEach(([tx, tz, ro, lo, hi], ti) => {
      const nP = 10, rc = ro - 0.6, pts = []; for (let k = 0; k < nP; k++) { const a = k / nP * 6.283 + ti * 0.4; pts.push([tx + Math.cos(a) * rc, tz + Math.sin(a) * rc]); }
      const sc = cum(pts, true), ya = Math.atan2(-tz, -tx), dk = pts.map((p, k) => { const q = pts[(k + 1) % nP], am = Math.atan2((p[1] + q[1]) / 2 - tz, (p[0] + q[0]) / 2 - tx) - ya; return Math.abs(Math.atan2(Math.sin(am), Math.cos(am))); }), kd = dk.indexOf(Math.min(...dk)), k5 = (kd + 5) % nP;
      const ops = [{ s0: sc[kd] + 0.04, s1: sc[kd + 1] - 0.04, yb: 0, ys: 1.9, rise: 0.5, kind: 'door' }, { s0: sc[k5] + 0.4, s1: sc[k5] + 0.7, yb: 1.8, ys: 2.8, rise: 0, kind: 'slit' }];
      wall(pts, 1.2, { closed: true, prof: rag(0, sc[nP], lo, hi, 1.1), ops, merl: [0.4, -1], step: 1.5, yard: 0, rub: 0.3, ivy: 0.2, bush: 0.12 }); ST.towers++;
    });
    // 3) the keep: 9.4 m square, walls 3.2 m thick, up to 14.3 m; its south face is the line of the curtain wall; a doorway on the north (the footpath ends there), a high doorway on the west, slits
    { const c3 = 3.1, s0 = 6.2, pts = [kp(-c3, -c3), kp(c3, -c3), kp(c3, c3), kp(-c3, c3)];
      const pr = [...rag(0, s0, 11.2, 12.8), ...rag(s0, s0 * 1.65, 13, 14.3, 0.8), ...rag(s0 * 1.65, s0 * 2, 7.6, 9.2), ...rag(s0 * 2, s0 * 3, 10.2, 12.6), ...rag(s0 * 3, s0 * 4, 9.4, 11.6)];
      const ops = [{ s0: 3.1 - 0.8, s1: 3.1 + 0.8, yb: 0, ys: 2.2, rise: 0.6, kind: 'door' }, { s0: s0 * 3 + 3.1 - 0.8, s1: s0 * 3 + 3.1 + 0.8, yb: 4.7, ys: 6.7, rise: 0.8, kind: 'door' },
        { s0: s0 * 2 + 3.1 - 0.45, s1: s0 * 2 + 3.1 + 0.45, yb: 6, ys: 7.1, rise: 0.5, kind: 'win' }, { s0: s0 + 3.7 - 0.45, s1: s0 + 3.7 + 0.45, yb: 8.6, ys: 9.7, rise: 0.5, kind: 'win' },
        ...[[1.2, 6.4], [5, 8.2], [s0 + 2.2, 5.6], [s0 * 2 + 1.8, 7.2], [s0 * 2 + 4.6, 3.6], [s0 * 3 + 0.9, 8.8], [s0 * 3 + 5.2, 2.8]].map(([s, y]) => ({ s0: s - 0.17, s1: s + 0.17, yb: y, ys: y + 1.15, rise: 0, kind: 'slit' }))];
      wall(pts, 3.2, { closed: true, prof: pr, ops, merl: [0.35, -1], step: 1.55, yard: -1, rub: 0.5, ivy: 0.2, bush: 0.1 }); ST.keeps++;
      const kf = kp(0, 0); patch(b.x + kf[0], b.z + kf[1], KA, 3, 3, [0.24, 0.22, 0.19], 0.1, 1, 1, 0.05); heap(b.x + kf[0], b.z + kf[1], 1.2, 8);
    }
    // 4) the palace (its rear wall is the curtain wall): the front wall with arched windows and the pointed portal, a standing gable on the north, the south end down to a stump, a cross wall
    { const F0 = PQ(0.5, PD), F1 = PQ(13, PD), pts = [PQ(0.5, 0), F0, F1, PQ(13, 0)], sc = cum(pts, false), s1 = sc[1], g0 = sc[2], gl = sc[3] - sc[2];
      const prof = [...rag(0, s1, 1.2, 3.2, 1.2), [s1, 6.7], [s1 + 3.2, 7.4], [s1 + 3.2, 4.2], [s1 + 5.8, 3.6], [s1 + 5.8, 5.2], [s1 + 8.2, 6], [s1 + 8.2, 7.2], [s1 + 10.2, 7.6], [s1 + 10.2, 3.2], [g0, 4.8],
        [g0, 6.9], [g0 + gl * 0.5, 10.6], [g0 + gl * 0.72, 8.9], [g0 + gl * 0.8, 7.2], [g0 + gl * 0.8, 5.4], [g0 + gl, 4.6]];
      const wi = (f, w) => ({ s0: s1 + f - w / 2, s1: s1 + f + w / 2, yb: 1.1, ys: 3.3, rise: 1.3, kind: 'win' });
      const ops = [wi(1.9, 1.2), wi(4.4, 1.2), { s0: s1 + 6.9 - 1, s1: s1 + 6.9 + 1, yb: 0, ys: 2.5, rise: 1.6, kind: 'door' }, wi(9.4, 1.2), wi(11.3, 1.1), { s0: g0 + gl * 0.5 - 0.5, s1: g0 + gl * 0.5 + 0.5, yb: 6, ys: 7.3, rise: 0.4, kind: 'win' }];
      wall(pts, 1.1, { prof, ops, yard: 1, rub: 0.3, ivy: 0.16, bush: 0.05 });
      wall([PQ(6.8, 0), PQ(6.8, PD)], 0.9, { prof: rag(0, PD, 1.6, 4.4), ops: [{ s0: 3.2, s1: 4.3, yb: 0, ys: 2.1, rise: 0.4, kind: 'door' }], step: 1.4, yard: 0, rub: 0.2, ivy: 0.1 });
      for (const u of [3.4, 9.6]) wall([PQ(u, PD), PQ(u, PD + 1.15)], 0.8, { prof: [[0, 4.6], [1.15, 2]], step: 1.2, yard: 0, rub: 0.15 });
      const pc = PQ(6.8, PD / 2); patch(b.x + pc[0], b.z + pc[1], Math.atan2(PUz, PUx), 12, 6.2, EARTH, 0.05, 6, 3, 0.1); ST.palaces++; }
    // 5) inner walls: the low one linking the palace and the keep, the one east of the keep; the chapel's foundations (the castle chapel of the 12th century); the cistern
    wall([[-9.9, 2.3], kp(-KH + 0.3, -KH + 0.3)], 1, { prof: rag(0, 3.5, 0.8, 2), ops: [{ s0: 1.1, s1: 2.3, yb: 0, ys: 1.9, rise: 0.5, kind: 'door' }], step: 1.2, yard: 0, rub: 0.2, ivy: 0.1 });
    wall([kp(KH - 0.4, -KH + 0.4), [9, 5.8], [11.2, 12.6]], 1, { prof: [...rag(0, 7.8, 0.8, 2.4), ...rag(7.8, 14, 0.4, 1.8)], step: 1.6, yard: 0, rub: 0.3, ivy: 0.1, bush: 0.1 });
    { const cp = [14.7, 4.2], ca = 22 * Math.PI / 180, cc = Math.cos(ca), cs = Math.sin(ca), P = (u, v) => [cp[0] + u * cc - v * cs, cp[1] + u * cs + v * cc], pts = [P(-3.1, -2.1), P(3.1, -2.1), P(4.6, -0.9), P(4.6, 0.9), P(3.1, 2.1), P(-3.1, 2.1)], sc = cum(pts, true);
      wall(pts, 0.9, { closed: true, prof: [...rag(0, sc[1], 0.5, 1.6), ...rag(sc[1], sc[4], 0.8, 3.8, 0.8), ...rag(sc[4], sc[6], 0.4, 1.5)], ops: [{ s0: sc[2] + 0.5, s1: sc[2] + 1.3, yb: 1.2, ys: 2.6, rise: 0.7, kind: 'win' }], step: 1.5, yard: 0, rub: 0.3, ivy: 0.15 }); ST.chapels++;
      patch(b.x + cp[0], b.z + cp[1], ca, 5.4, 3.4, EARTH, 0.05, 3, 2, 0.1); }
    { const cx = 6.4, cz = -1.2, pts = [], dp = []; for (let k = 0; k < 8; k++) { pts.push([cx + Math.cos(k / 8 * 6.283) * 1.2, cz + Math.sin(k / 8 * 6.283) * 1.2]); dp.push([b.x + cx + Math.cos(k / 8 * 6.283) * 0.75, b.z + cz + Math.sin(k / 8 * 6.283) * 0.75]); }
      wall(pts, 0.6, { closed: true, prof: [[0, 0.7], [9.6, 0.9]], step: 1, yard: -1, rub: 0.15 }); ST.cisterns++;
      const q = [b.x + cx, gnd(b.x + cx, b.z + cz) + 0.1, b.z + cz]; for (let k = 0; k < 8; k++) { const a = dp[k], c = dp[(k + 1) % 8]; g.triO(q, [a[0], gnd(a[0], a[1]) + 0.1, a[1]], [c[0], gnd(c[0], c[1]) + 0.1, c[1]], [0.07, 0.09, 0.08], [q[0], q[1] - 3, q[2]]); } }
    // 6) the yard: patches of earth and paving, fallen stones, scrub and a few young trees; a heap at the breach in the south wall
    const PATH = [[3.74, -6.8], [1.36, -5.19], [-1.29, -4.24], [-3.01, -2.23], [-1.93, -1.44], [-3.7, 3.87]];   // (the game's footpath from the gate to the keep: kept clear)
    const dPath = (x, z) => { let d = 9; for (let i = 0; i + 1 < PATH.length; i++) d = Math.min(d, dSeg(x, z, PATH[i], PATH[i + 1])); return d; };
    const yardOK = (x, z, m) => inPoly(RING, x, z) && dLoop(RING, x, z) > 1.5 + m && !inKeep(x, z) && !inPalace(x, z) && !TW.some(([tx, tz, r]) => Math.hypot(x - tx, z - tz) < r + 0.6 + m) && dPath(x, z) > 1.1 + m && Math.hypot(x - 14.7, z - 4.2) > 5.2 && Math.hypot(x - 6.4, z + 1.2) > 2.2 + m;
    for (let q = 0, n = 0; q < 500 && n < 18; q++) { const x = rr(-19, 29), z = rr(-16, 20), r = rr(1, 2.3); if (!yardOK(x, z, r)) continue; n++; blob(b.x + x, b.z + z, r, pick(EARTH), 0.045); }
    for (let q = 0, n = 0; q < 600 && n < 46; q++) { const x = rr(-19, 29), z = rr(-16, 20); if (!yardOK(x, z, 0.2)) continue; n++; const sz = rr(0.25, 0.7); chunk(b.x + x, b.z + z, sz * rr(1, 1.7), sz * rr(0.45, 0.9), sz, R() * 3.14, vary(pick(STONE), R, 0.2)); }
    for (let q = 0, n = 0; q < 300 && n < 5; q++) { const x = rr(-19, 29), z = rr(-16, 20); if (!yardOK(x, z, 1.8)) continue; n++; slab(b.x + x, b.z + z, rr(1.8, 3.2), rr(0.8, 1.3), rr(0.6, 1), R() * 3.14, rr(0.15, 0.4)); }
    for (let q = 0, n = 0; q < 400 && n < 14; q++) { const x = rr(-19, 29), z = rr(-16, 20); if (!yardOK(x, z, 0.6)) continue; n++; bush(b.x + x, gnd(b.x + x, b.z + z), b.z + z, rr(0.5, 1)); }
    for (const [x, z, h] of [[-12.2, 5.5, 3.4], [16.5, 6.2, 2.8], [3.4, 11.2, 2.6]]) if (yardOK(x, z, 0.4)) sapling(b.x + x, b.z + z, h);
    { const a = RING[3], c = RING[4], l = sv[4] - sv[3], hx = lerp(a[0], c[0], 18.6 / l), hz = lerp(a[1], c[1], 18.6 / l), nx = (c[1] - a[1]) / l, nz = -(c[0] - a[0]) / l;   // (into the yard: north)
      heap(b.x + hx + nx * 1.7, b.z + hz + nz * 1.7, 1.9, 16); }
    // the mesh: its own object on the masonry picture; the parts between the camera and the car fade as the buildings do
    const stone = mvStoneTex(); if (ownTex) ownTex(stone);   // (freed with the world; the picture itself stays cached and goes up again with the next build)
    const m = new THREE.Mesh(g.geometry(), hjCutMat(new THREE.MeshLambertMaterial({ map: stone, vertexColors: true }), cut));
    m.name = 'mvCastle'; m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
    ST.verts = g.P.length / 3;
    return ST;
  }
  // the run-off's real surfaces (def.roSurf, Track.roM): asphalt, light paving, grass and gravel or bare earth blended by Core's atlas (U.mask: aRo.xy is
  // its uv, the run-off's rows and the rings' discs carry it; Track.roClass reads the same texels for the cars: what is drawn is what is driven). Each layer
  // the picture it has elsewhere: the asphalt the road's (its uv, aRo.z the stretch's shade), the grass the terrain's (its picture at the terrain's uv,
  // the vertex colour the terrain's own, mvGCol: it joins the skirt and the ground and takes the seasons with them), the gravel the castle road's
  // makadam and tint (its material's picture and colour as they are: snow-packed in the winter with the road), the paving light grey concrete slabs
  // (the setts' picture, grey, ~1.3 x the asphalt's brightness) (those three wet in the rain with the road: the material's colour; the grass as the
  // terrain). The four weights sharpened (m^4, normalised: no dark seam where three or four meet, a narrow soft edge), the sun's sheen
  // (Render.asphaltLook, inserted before the envmap) kept on the paved part only. back: the discs, behind the rows (polygonOffset, GL state: one
  // program for both). U.grassMat / U.gravelMat: the terrain's and the gravel road's materials, read as they are each frame (Render.seasonWorld swaps
  // their pictures and colours)
  function mvRunoffMat(tex, U, back) {
    const m = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true });   // (the asphalt as its map: Render takes it for road, the rain darkens it, the seasons leave its colour, the sun's sheen)
    if (back) Object.assign(m, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 });
    const HP = (t) => '#ifdef GL_FRAGMENT_PRECISION_HIGH\nvarying highp ' + t + '\n#else\nvarying ' + t + '\n#endif';   // (the atlas is ~2000 texels wide, the world thousands of metres: highp where there is any)
    const G = U.grassMat, K = U.gravelMat;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uRoM = { value: U.mask }; sh.uniforms.uRoP = { value: U.paving };
      sh.uniforms.uRoG = { get value() { return G.map; } }; sh.uniforms.uRoGc = { get value() { return G.color; } }; sh.uniforms.uRoK = { get value() { return K.map; } }; sh.uniforms.uRoKc = { get value() { return K.color; } };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aRo;\nvarying highp vec3 vRo;\nvarying highp vec2 vRoW;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRo = aRo;\nvRoW = ( modelMatrix * vec4( transformed, 1.0 ) ).xz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uRoM;\nuniform sampler2D uRoG;\nuniform sampler2D uRoP;\nuniform sampler2D uRoK;\nuniform vec3 uRoGc;\nuniform vec3 uRoKc;\n' + HP('vec3 vRo;') + '\n' + HP('vec2 vRoW;'))
        .replace('#include <map_fragment>', [
          'vec4 roW = texture2D( uRoM, vRo.xy ); roW *= roW; roW *= roW; roW /= max( dot( roW, vec4( 1.0 ) ), 1e-4 );',   // (r paving, g grass, b gravel, a asphalt)
          'vec3 roC = texture2D( map, vUv ).rgb * vRo.z * vec3( 1.0, 0.995, 1.01 ) * roW.a',                                   // (the asphalt: the road's picture at its uv, the stretch's shade)
          '  + dot( texture2D( uRoP, vRoW * 0.4 ).rgb, vec3( 0.3, 0.59, 0.11 ) ) * vec3( 0.64, 0.66, 0.69 ) * roW.r',          // (light grey concrete slabs, 2.5 m a repeat)
          '  + texture2D( uRoK, vRoW * 0.16666667 ).rgb * uRoKc * vec3( 1.02, 1.14, 1.3 ) * roW.b;',                            // (the castle road's makadam, its colour and tint)
          'diffuseColor.rgb = diffuseColor.rgb * roC + texture2D( uRoG, vRoW * vec2( 0.11111111, -0.11111111 ) ).rgb * uRoGc * vColor * roW.g;',   // (the material's colour, the rain's darkening of the road, on those; the grass the terrain's, its picture, colour and vertex colour, as dry as the terrain's)
          'float roPaved = roW.a + roW.r;'].join('\n'))
        .replace('#include <color_fragment>', '')   // (the vertex colour is the grass's only)
        .replace('#include <envmap_fragment>', 'vec3 roL0 = outgoingLight;\n#include <envmap_fragment>\noutgoingLight = mix( roL0, outgoingLight, roPaved );');
    };
    m.customProgramCacheKey = () => 'mvRunoff';
    return m;
  }
  function buildMedvode(scene, tex, opts) {
    const R = rng(4411), N = T.N, def = T.def, dens = opts.density || 1, PI = Math.PI, ds = T.ds;
    const root = new THREE.Group(); scene.add(root);
    API.VRS = 'summer';
    // (p10) the user's drawn windows (def.mvWin [{ id, kind, ring, poly: [x, z, ...] }]): there World draws their road (def.mvPaved), their sidewalks (def.walkLines)
    // and their markings (def.paint) and none of its own (the side roads' surfaces and lines, the streets, paths and car parks, the oncoming lanes, the route's
    // markings, the rings' edge lines) but the start line; the run-off's surfaces there are theirs (the pipeline's def.roSurf)
    const WINS = (def.mvWin || []).map(w => { const q = []; for (let k = 0; k + 1 < w.poly.length; k += 2) q.push([w.poly[k], w.poly[k + 1]]);
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of q) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return { id: w.id, q, x0, x1, z0, z1 }; });
    const inWin = (x, z) => { for (const W of WINS) if (x >= W.x0 && x <= W.x1 && z >= W.z0 && z <= W.z1 && inPoly(W.q, x, z)) return true; return false; };
    MVWIN = WINS.length ? inWin : null;
    const IW = new Uint8Array(N), IWE = new Uint8Array(N);   // (the route's samples in a window; IWE: those and their neighbours, where the run-off starts at the asphalt's edge (no gap at a window's border))
    if (WINS.length) { for (let i = 0; i < N; i++) IW[i] = inWin(T.px[i], T.pz[i]) ? 1 : 0; for (let i = 0; i < N; i++) IWE[i] = IW[i] || (i > 0 && IW[i - 1]) || (i + 1 < N && IW[i + 1]) ? 1 : 0; }
    const OWNW = WINS.filter((W, k) => (def.mvWin[k].kind || '') === 'k1'), inOwnWin = (x, z) => OWNW.some(W => x >= W.x0 && x <= W.x1 && z >= W.z0 && z <= W.z1 && inPoly(W.q, x, z));   // (K1: the user's own markings)
    const wPairs = (L) => { const q = []; for (let k = 0; k + 1 < L.length; k += 2) q.push([L[k], L[k + 1]]); if (q.length > 1 && q[0][0] === q[q.length - 1][0] && q[0][1] === q[q.length - 1][1]) q.pop(); return q; };
    const wBB = (q) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of q) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return [x0, z0, x1, z1]; };
    const UG = (def.mvPaved || []).map(F => { const o = wPairs(F.p); return { o, h: (F.h || []).map(wPairs).filter(h => h.length >= 3), b: wBB(o) }; })
      .concat((def.walkLines || []).map(L => { const re = wPairs(L.re), ge = wPairs(L.ge), o = re.concat(ge.reverse()); return { o, h: [], b: wBB(o) }; }));
    const onUserGround = (x, z) => UG.some(F => x >= F.b[0] && x <= F.b[2] && z >= F.b[1] && z <= F.b[3] && inPoly(F.o, x, z) && !F.h.some(h => inPoly(h, x, z)));   // (the user's road or sidewalk)
    const winGB = (g) => { if (!WINS.length || g.winW) return g; g.winW = 1; const qO = g.quadO, tO = g.triO; let inQ = false;   // (a builder that leaves out what falls in a window: a quad or a triangle by its middle; quadUp / triUp go through these; winOff: let it through)
      g.quadO = function (a, b, c, d, ...r) { if (!this.winOff && inWin((a[0] + b[0] + c[0] + d[0]) / 4, (a[2] + b[2] + c[2] + d[2]) / 4)) return; inQ = true; qO.call(this, a, b, c, d, ...r); inQ = false; };
      g.triO = function (a, b, c, ...r) { if (!inQ && !this.winOff && inWin((a[0] + b[0] + c[0]) / 3, (a[2] + b[2] + c[2]) / 3)) return; tO.call(this, a, b, c, ...r); };
      return g; };
    const out = { root, dyn: {}, groundH: mvGround, camFloor: mvGround, props: [], farClip: true, ownTex: [] };
    out.propR = 150;   // (the props drawn out to 150 m: the long open corridor)
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    vrPrep(); vrStubs(); API.VR.gul = []; API.VR.lakes = [];   // (no made-up gully under the bridge: the valley is the real one, the water def.water's)
    mvPrep();
    const P = API.VR, M = MV, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    const WA = T.wa || new Float64Array(N).fill(T.w), WK = T.walk, wE = (si, i) => WA[i] + (WK ? WK[si][i] : 0), SF = T.sf || new Uint8Array(N);
    // (the rings' tall islands (def.rings isl 'tall'): a point of the asphalt drawn inside one's edge (R.ie: its tall grass, Track.surface) moved out onto it: the
    // route's rows where its spline cuts inside the ring road, a side road's flared mouth; the island round)
    const TALLW = T.rings.filter(Rg => Rg.tall), tallOut = (q, iz) => { for (const Rg of TALLW) { const dx = q[0] - Rg.x, dz = q[iz] - Rg.z, d = Math.hypot(dx, dz); if (d < Rg.ie && d > 1e-6) { q[0] = Rg.x + dx / d * Rg.ie; q[iz] = Rg.z + dz / d * Rg.ie; } } return q; };
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) }, uA: { value: new THREE.Vector4(0, 0, -1e6, 1) }, uB: { value: new THREE.Vector4(0, 0, -1e6, 1) } };   // (ouCutMat: the trees and the small things between the camera and the car fade; hjCutMat: the buildings over the car and the road ahead)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const addM = (g, mat, cast, grp) => { if (!g || g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; (grp || root).add(m); return m; };
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, things beside the road) for the trees, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    // what covers the ground (a 2 m raster over the water's area): 1 a street, path or track, 2 the railway, 3 a building, 4 a sports ground (no trees there)
    const OC = 2, ocx0 = M.wx0, ocz0 = M.wz0, onx = Math.ceil(M.wnx * M.wc / OC), onz = Math.ceil(M.wnz * M.wc / OC), occ = new Uint8Array(onx * onz);
    const occAt = (x, z) => { const i = Math.floor((x - ocx0) / OC), j = Math.floor((z - ocz0) / OC); return i < 0 || j < 0 || i >= onx || j >= onz ? 0 : occ[j * onx + i]; };
    const occSeg = (ax, az, bx, bz, r, v) => { const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 1.5));
      for (let k = 0; k <= n; k++) { const x = lerp(ax, bx, k / n), z = lerp(az, bz, k / n); for (let a = Math.floor((x - r - ocx0) / OC); a <= Math.floor((x + r - ocx0) / OC); a++) for (let b = Math.floor((z - r - ocz0) / OC); b <= Math.floor((z + r - ocz0) / OC); b++) if (a >= 0 && b >= 0 && a < onx && b < onz && (x - ocx0 - (a + 0.5) * OC) ** 2 + (z - ocz0 - (b + 0.5) * OC) ** 2 <= r * r + 1) occ[b * onx + a] = Math.max(occ[b * onx + a], v); } };
    const occPoly = (pts, v) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let a = Math.floor((x0 - ocx0) / OC); a <= Math.floor((x1 - ocx0) / OC); a++) for (let b = Math.floor((z0 - ocz0) / OC); b <= Math.floor((z1 - ocz0) / OC); b++) if (a >= 0 && b >= 0 && a < onx && b < onz && inPoly(pts, ocx0 + (a + 0.5) * OC, ocz0 + (b + 0.5) * OC)) occ[b * onx + a] = Math.max(occ[b * onx + a], v); };
    const Q = {}, QS = {};
    const onAlt = (x, z, m) => { const r = API.lfNear(M.altH, x, z); return !!r.e && r.d < (T.def.altHw || 2.4) + m; };   // (on an oncoming lane, m metres more)
    // (r5: the side roads' drawn half widths, narrowed past their mouths where a house beside the street would stand in them: the house stays, the street fits
    // between the houses as a village street does; never under 1.2 m. Closed side roads only (def.sideClosed: no car drives in them))
    const SNW = (T.stubs || []).map(() => null), stubHwD = (S, t) => { const h = t < S.te ? T.stubHw(S, t) : S.hw, A = SNW[S.k]; if (!A) return h; const i = Math.round(t); return i >= 0 && i < A.length ? Math.min(h, A[i]) : h; };
    const onRoadB = (x, z, m) => { if (onAlt(x, z, m)) return true; const q = T.query(x, z, T.nearestIdx(x, z), Q); if (q.k >= 0) { const S = T.stubs[q.k]; if (q.st <= S.Lend && Math.abs(q.u) <= stubHwD(S, q.st) + m) return true; } return !q.deep && !q.over && Math.abs(q.d) < wE(q.d > 0 ? 1 : 0, q.a) + m; };   // (the buildings: a side road's own width past its mouth; walls.js the same)
    const onRoad = (x, z, m) => { if (def.barrier && (wFree.route(x, z, -m) || wFree.ring(x, z, -1))) return true; if (onAlt(x, z, m)) return true; const q = T.query(x, z, T.nearestIdx(x, z), Q); if (q.k >= 0 && Math.abs(q.u) <= Math.min(T.stubHw(T.stubs[q.k], q.st), stubHwD(T.stubs[q.k], q.st)) + m) return true; return !q.deep && !q.over && Math.abs(q.d) < wE(q.d > 0 ? 1 : 0, q.a) + m; };   // (on the asphalt or a sidewalk, or a side road's, m metres more; def.barrier: the cars' free ground, the run-off)

    /* ---- the fence (built further down, FENCE): the lines where the cars' free ground ends (Track.fenceRuns). What stands inside that ground by more than 30 cm
       could be driven through, so it is left out: a house the lines cut into or that stands inside it, a hedge, garden wall or fence (def.fences) inside it ---- */
    const tF0 = performance.now(), FR = T.fenceRuns(), wFree = T.wallFree(0.3), wallHit = T.wallHitter(FR.runs, wFree), msRuns = performance.now() - tF0;
    // (p10) the ground in the windows: inside the cars' free ground (and the run-off's rows' last 35 cm past the barrier, a ring's disc) the surface the cars
    // drive on (the route's rows' own height on its asphalt: a ring's surface can lie up to 4 cm off them), else the terrain; lin / lout metres over it
    // past it eased down to the terrain over 0.65 m (where the run-off's grass skirt would be: none under the user's ground), then the terrain
    // (with def.barrier the cover is the run-off as drawn further down: each row out to the barrier + 0.35 m, to the asphalt's or the sidewalk's edge where it has
    // none; each segment's halves as two triangles, hashed in an 8 m grid. Not the cars' free ground: that takes the barrier at each point's own projection,
    // which at a step in the barrier parts from the run-off's straight edge by up to a metre)
    let CQ = null; const CQH = new Map(), CQC = 8, cqK = (a, b) => a * 65536 + b;
    const cqBuild = () => { CQ = [];
      const eR = (i, si) => IWE[i] ? WA[i] : wE(si, i), bR = (i, si) => si ? T.br[i] : T.bl[i], dR = (i, si) => !onBr[i] && bR(i, si) - eR(i, si) >= 0.25;
      const add = (ax, az, bx, bz, cx, cz) => { if (Math.abs((bx - ax) * (cz - az) - (bz - az) * (cx - ax)) < 1e-6) return; const t = [ax, az, bx, bz, cx, cz, Math.min(ax, bx, cx) - 0.7, Math.min(az, bz, cz) - 0.7, Math.max(ax, bx, cx) + 0.7, Math.max(az, bz, cz) + 0.7]; CQ.push(t);
        for (let a = Math.floor((Math.min(ax, bx, cx) - 0.7) / CQC); a <= Math.floor((Math.max(ax, bx, cx) + 0.7) / CQC); a++) for (let b = Math.floor((Math.min(az, bz, cz) - 0.7) / CQC); b <= Math.floor((Math.max(az, bz, cz) + 0.7) / CQC); b++) {
          const k = cqK(a, b); let L = CQH.get(k); if (!L) CQH.set(k, L = []); L.push(t); } };
      for (let i = 0; i + 1 < N; i++) for (const si of [0, 1]) { const j = i + 1, sg = si ? 1 : -1, both = dR(i, si) && dR(j, si), oi = both ? bR(i, si) + 0.35 : eR(i, si), oj = both ? bR(j, si) + 0.35 : eR(j, si);
        const ax = T.px[i] + T.nx[i] * sg * oi, az = T.pz[i] + T.nz[i] * sg * oi, bx = T.px[j] + T.nx[j] * sg * oj, bz = T.pz[j] + T.nz[j] * sg * oj;
        add(T.px[i], T.pz[i], ax, az, bx, bz); add(T.px[i], T.pz[i], bx, bz, T.px[j], T.pz[j]); } };
    const segD = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-12, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
    const triSD = (t, x, z) => { if (x < t[6] || x > t[8] || z < t[7] || z > t[9]) return 1e9; const ax = t[0], az = t[1], bx = t[2], bz = t[3], cx = t[4], cz = t[5];   // (-1 inside; outside the distance, 1e9 past 0.7 m: only the ease's 0.65 m counts)
      const s1 = (bx - ax) * (z - az) - (bz - az) * (x - ax), s2 = (cx - bx) * (z - bz) - (cz - bz) * (x - bx), s3 = (ax - cx) * (z - cz) - (az - cz) * (x - cx);
      if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) return -1;
      return Math.min(segD(x, z, ax, az, bx, bz), segD(x, z, bx, bz, cx, cz), segD(x, z, cx, cz, ax, az)); };
    const QW = {}, wPast = (x, z) => { let p = 1e9;   // (metres past the cover's edge: the run-off's (the barrier + 0.35 m), a ring's disc)
      if (BAR) { if (!CQ) cqBuild(); const L = CQH.get(cqK(Math.floor(x / CQC), Math.floor(z / CQC))); if (L) for (const t of L) { const d = triSD(t, x, z); if (d < p) { p = d; if (p < 0) break; } } }
      else { const s = wFree.insetNear(x, z, T.nearestIdx(x, z)); if (!isNaN(s)) p = -s - 0.35; }
      for (const Rg of T.rings) if (Rg.zr > 0) p = Math.min(p, Math.hypot(x - Rg.x, z - Rg.z) - (Rg.zr + 0.35)); return p; };
    const wCov = (x, z) => wPast(x, z) <= 0;
    const wSurf = (x, z) => { const q = T.query(x, z, T.nearestIdx(x, z), QW); let y = T.yAt(q); if (!q.deep && q.k < 0 && Math.abs(q.d) <= WA[q.a] + 0.05) y = Math.max(y, T.elevAt(T.hs(q)).y + 0.02); else y += 0.02; return y; };
    const wY = (x, z, lin, lout) => { const p = wPast(x, z); if (p <= 0) return wSurf(x, z) + lin; const yo = mvGround(x, z) + lout; return p >= 0.65 ? yo : lerp(wSurf(x, z) + lin, yo, p / 0.65); };
    // (a flat piece on that ground: triangles split at their edges' middles (to 4 levels) where the ground bends more than 1.5 cm away from them; across the
    // ease's start and end past the cover's edge (where it slopes) to 20 cm (to 6 levels): its bends between the middles. Each corner's height and distance past the edge found once)
    const wP = (v) => v.p === v.p ? v.p : (v.p = wPast(v.x, v.z)), wKink = (pa, pb, pc) => { const lo = Math.min(pa, pb, pc), hi = Math.max(pa, pb, pc); return (lo <= 0 && hi > 0) || (lo < 0.65 && hi >= 0.65); };   // (across the ease's start or end)
    const wTriV = (g, a, b, c, hf, cols, uvf, lv, V) => {
      if (lv < 6 && Math.max(Math.hypot(b.x - a.x, b.z - a.z), Math.hypot(c.x - b.x, c.z - b.z), Math.hypot(a.x - c.x, a.z - c.z)) > 0.2) {
        const ab = V((a.x + b.x) / 2, (a.z + b.z) / 2), bc = V((b.x + c.x) / 2, (b.z + c.z) / 2), ca = V((c.x + a.x) / 2, (c.z + a.z) / 2);
        if ((lv < 4 && (Math.abs(ab.y - (a.y + b.y) / 2) > 0.015 || Math.abs(bc.y - (b.y + c.y) / 2) > 0.015 || Math.abs(ca.y - (c.y + a.y) / 2) > 0.015)) || (Math.max(a.y, b.y, c.y) - Math.min(a.y, b.y, c.y) > 0.02 && wKink(wP(a), wP(b), wP(c)))) {
          const l = lv + 1; wTriV(g, a, ab, ca, hf, cols, uvf, l, V); wTriV(g, ab, b, bc, hf, cols, uvf, l, V); wTriV(g, ca, bc, c, hf, cols, uvf, l, V); wTriV(g, ab, bc, ca, hf, cols, uvf, l, V); return; } }
      const A = [a.x, a.y, a.z], B = [b.x, b.y, b.z], C = [c.x, c.y, c.z]; g.triUp(A, B, C, [cols, cols, cols], uvf ? [uvf(A), uvf(B), uvf(C)] : undefined); };
    const wTri = (g, a, b, c, hf, cols, uvf) => { const V = (x, z) => ({ x, z, y: hf(x, z), p: NaN }); wTriV(g, V(a[0], a[1]), V(b[0], b[1]), V(c[0], c[1]), hf, cols, uvf, 0, V); };
    const wQuad = (g, a, b, c, d, hf, cols, uvf) => { wTri(g, a, b, c, hf, cols, uvf); wTri(g, a, c, d, hf, cols, uvf); };

    /* ---- the buildings (def.bld): clear of the road, its sidewalks and the side roads; their footprints marked (no trees in them) ---- */
    const blds = []; let nWallDrop = 0, nNarrow = 0, nDropB = 0, nDropF = 0;
    const dropB = new Set(def.dropBld || []);   // (def.dropBld: the footprints the course takes in, by their index in def.bld (a building site, a kiosk, the small sheds inside the barrier): left out)
    for (let bk = 0; bk < (def.bld || []).length; bk++) {
      const b = def.bld[bk]; if (dropB.has(bk)) { nDropB++; continue; }
      const [x, z, L, W, ang, hgt, kind, name] = b, poly = b[8] ? b[8].reduce((a, v, k) => (k % 2 ? a[a.length - 1].push(v) : a.push([v]), a), []) : null;
      if (L < 2.2 || W < 2.2) continue;
      const c = Math.cos(ang), s = Math.sin(ang), pts = poly || [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]].map(([p, q]) => [x + c * p - s * q, z + s * p + c * q]);
      let ok = true; for (const [px, pz] of pts.concat([[x, z]])) if (onRoadB(px, pz, 0.3) || mvW(px, pz).e > 1) { ok = false; break; }
      if (!ok && def.sideClosed && kind !== 6) {   // (r5: in a side road's band only, past its mouth: the street narrowed beside it, the house kept)
        const need = [], E = []; for (let e = 0; e < pts.length; e++) { const p0 = pts[e], p1 = pts[(e + 1) % pts.length], m = Math.max(1, Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 0.5)); for (let j = 0; j < m; j++) E.push([lerp(p0[0], p1[0], j / m), lerp(p0[1], p1[1], j / m)]); }
        let fine = !(mvW(x, z).e > 1);
        for (const [px, pz] of E.concat([[x, z]])) { if (!fine) break; if (mvW(px, pz).e > 1 || onAlt(px, pz, 0.3)) { fine = false; break; }
          const q = T.query(px, pz, T.nearestIdx(px, pz), Q);
          if (q.k < 0) { if (!q.deep && !q.over && Math.abs(q.d) < wE(q.d > 0 ? 1 : 0, q.a) + 0.3) fine = false; continue; }
          const S = T.stubs[q.k]; if (q.st > S.Lend || Math.abs(q.u) > stubHwD(S, q.st) + 0.3) continue;
          const w = Math.abs(q.u) - 0.3; if (q.st < S.te + 3 || w < 1.2) { fine = false; break; } need.push([S.k, q.st, w]); }
        if (fine && need.length) { for (const [k, st, w] of need) { const S = T.stubs[k]; if (!SNW[k]) SNW[k] = new Float32Array(Math.ceil(S.Lend) + 2).fill(1e9);
            for (let t = Math.floor(st) - 1; t <= Math.ceil(st) + 1; t++) if (t >= 0 && t < SNW[k].length) SNW[k][t] = Math.min(SNW[k][t], w); }
          ok = true; nNarrow++; }
      }
      if (!ok) continue;
      if (kind !== 2 && kind !== 6 && wallHit(pts, x, z)) { nWallDrop++; continue; }   // (the fence: nothing to drive into; not the churches, not the castle)
      blds.push({ x, z, L, W, ang, hgt, kind, name: name || '', poly, pts }); occPoly(pts, 3);
    }
    out.marks = {}; out.housesNarrowed = nNarrow; for (const b of blds) if (b.name) out.marks[b.name] = [b.x, b.z];
    // the town's streets, paths and tracks (def.roads, def.paths) and the railway: marked on the raster
    const lines = (def.roads || []).map(r => ({ w: r[0], grav: !!r[1], br: r[2], pts: r[4], path: false })).concat((def.paths || []).map(r => ({ w: r[0], grav: !!r[1], br: r[2], pts: r[4], path: true })));
    for (const l of lines) for (let k = 0; k + 3 < l.pts.length; k += 2) occSeg(l.pts[k], l.pts[k + 1], l.pts[k + 2], l.pts[k + 3], l.w / 2 + 0.6, 1);
    for (const L of M.rails) for (let k = 0; k + 1 < L.length; k++) occSeg(L[k][0], L[k][1], L[k + 1][0], L[k + 1][1], 3.4, 2);
    for (const p of def.pitches || []) { const [x, z, L, W, a] = p, c = Math.cos(a), s = Math.sin(a); occPoly([[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]].map(([u, v]) => [x + c * u - s * v, z + s * u + c * v]), 4); }

    /* ---- terrain tiles, the water ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: ouGTex(), vertexColors: true });
    let nFar = 0;
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let bj = 0; bj < G.ntz; bj += 2) for (let bi = 0; bi < G.ntx; bi += 2) {   // (2 x 2 tiles to a mesh: fewer draw calls)
        const parts = [];
        for (let tj = bj; tj < Math.min(G.ntz, bj + 2); tj++) for (let ti = bi; ti < Math.min(G.ntx, bi + 2); ti++) {
          const on = vrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++; parts.push(mvTileGeo(ti, tj, on)); }
        if (!parts.length) continue;
        const m = new THREE.Mesh(mvMerge(parts), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      // the water: flat at each body's level over its cells of the raster (and one more round the shore, under the bank), the Sava's emerald green,
      // darker where deep, the sky mirrored in patches
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 60, specular: 0x2c3a44 }), wch = new Chunks(400, true), W = M.wnx, wc = M.wc;
      const deep = [0.08, 0.24, 0.25], shal = [0.25, 0.4, 0.34], sky = [0.46, 0.58, 0.66];
      const wcol = (k) => { const x = M.wx0 + (k % W) * wc, z = M.wz0 + Math.floor(k / W) * wc, e = M.sd[k], t = sstep(1, 14, e), ks = 0.4 * sstep(0.55, 0.8, P.n2(x * 2.2, z * 2.2)); return [0, 1, 2].map(c => lerp(lerp(shal[c], deep[c], t), sky[c], ks)); };
      for (let j = 0; j < M.wnz - 1; j++) for (let i = 0; i < W - 1; i++) {
        const k = j * W + i, ids = [M.wid[k], M.wid[k + 1], M.wid[k + W], M.wid[k + W + 1]], id = ids.find(v => v > 0); if (!id) continue;
        const x = M.wx0 + i * wc, z = M.wz0 + j * wc; if (vrDist(x, z) > 470) continue;
        const y = M.lv[id], A = [x, y, z], B = [x + wc, y, z], C = [x + wc, y, z + wc], D = [x, y, z + wc], uv = (p) => [p[0] / 14, -p[2] / 14];
        wch.get(x, z).quadUp(A, B, C, D, [wcol(k), wcol(k + 1), wcol(k + W + 1), wcol(k + W)], [uv(A), uv(B), uv(C), uv(D)]);
      }
      wch.addTo(root, wMat, false, true); out.dyn.water = tex.water;
    }
    out.ownTex.push(gMat.map);

    /* ---- the road: asphalt at its own width (resurfaced in stretches, the wheel tracks darker), its sidewalks behind a concrete kerb, the
       verges: a gravel shoulder and grass out to a ditch past the barrier line in the country, the gardens' lawns straight from the kerb in the
       villages; on the bridge the deck out to its parapets (256 m chunks) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    // (def.barrier: the race circuit's barrier, the run-off out to it (def.roSurf: its real surfaces); the ground the cars drive on round a ring its zone's own surface, Track.ringY)
    const BAR = !!def.barrier, PtR = (i, o, y) => { const x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; return [x, (def.ringH ? T.ringY(x, z, T.hy[i]) : T.hy[i]) + y, z]; };
    const inZoneW = (x, z, m) => T.rings.some(R => R.zr > 0 && Math.hypot(x - R.x, z - R.z) < R.zr - (m || 0));
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const pMat = new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true });
    // (def.roSurf: the run-off's real surfaces, Core's atlas as a texture on its own bytes (NPOT: clamped, linear, no mipmaps), the run-off's material
    // for the rows and the rings' discs; out.runoff for the tests)
    const RM = BAR ? T.roM : null, roTex = RM ? ownTex(new THREE.DataTexture(RM.data, RM.W, RM.H, THREE.RGBAFormat)) : null;
    if (roTex) { roTex.magFilter = roTex.minFilter = THREE.LinearFilter; roTex.generateMipmaps = false; roTex.wrapS = roTex.wrapT = THREE.ClampToEdgeWrapping; roTex.needsUpdate = true; }
    const roU = { mask: roTex, grassMat: gMat, paving: tex.paving, gravelMat: sMat }, roMat = RM ? mvRunoffMat(tex, roU, false) : null, roMatR = RM ? mvRunoffMat(tex, roU, true) : null;
    if (RM) out.runoff = { mat: roMat, matR: roMatR, tex: roTex };
    const onBr = new Uint8Array(N); for (const [a, b] of def.bridges || []) for (let s = sStart + a - 2; s <= sStart + b + 2; s += ds / 2) onBr[T.idx(s)] = 1;
    const town = [new Uint8Array(N), new Uint8Array(N)];
    for (let i = 0; i < N; i++) for (const si of [0, 1]) { const o = (si ? 1 : -1) * (wE(si, i) + 2); town[si][i] = (WK && WK[si][i] > 0.05) || vrLCf(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, 3) > 0.45 ? 1 : 0; }
    const inRing = new Uint8Array(N), ringIn = [new Uint8Array(N), new Uint8Array(N)];   // (on a ring; the side towards its island: no verge there, the island's apron)
    for (const r of M.rings) if (r.drive) for (let i = 0; i < N; i++) if (Math.hypot(T.px[i] - r.x, T.pz[i] - r.z) < r.r + 4) { inRing[i] = 1; ringIn[(r.x - T.px[i]) * T.nx[i] + (r.z - T.pz[i]) * T.nz[i] > 0 ? 1 : 0][i] = 1; }
    const mouthE = [new Uint8Array(N), new Uint8Array(N)];   // where a side road's mouth crosses the asphalt's edge (no edge line, no kerb)
    for (const S of T.stubs || []) for (let i = Math.max(0, S.i0 - 70); i <= Math.min(N - 1, S.i0 + 70); i++) { const o = S.side * (WA[i] - 0.4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
      VRSP.S = null; if (T._stubProj(S, x, z, VRSP) && VRSP.t >= 0 && Math.abs(VRSP.u) <= T.stubHw(S, VRSP.t) + 0.6) mouthE[S.side > 0 ? 1 : 0][i] = 1; }
    const sw = 0.4;
    const vProf = (i, side) => {   // the verge's cross-section: 5 points [offset, height above the road]
      const si = side > 0 ? 1 : 0, bar = side > 0 ? T.br[i] : T.bl[i], e = wE(si, i), y = T.hy[i];
      if (ringIn[si][i]) return [[e, 0], [e, 0], [e, 0], [e, 0], [e, 0]];
      if (onBr[i]) return [[e + 0.3, 0.12], [bar - 0.2, 0.12], [bar + 0.58, 0.12], [bar + 0.62, -1.5], [bar + 0.68, -1.6]];
      const gAt = (o) => { const q = side * o; return mvGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (T.gap && T.gap[si][i]) { const sf = (o) => { const q = side * o; return [o, T.yAt(T.query(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q, i, VRSQ)) - y - 0.03]; };
        return [[e + sw, -0.02], sf(Math.max(e + sw + 0.6, bar - 0.7)), sf(bar + 0.45), sf(bar + 1.15), sf(bar + 1.9)]; }
      if (town[si][i]) { const o2 = Math.max(e + 0.8, Math.min(bar - 0.3, e + 3)); return [[e + 0.2, 0.06], lift(e + 0.5, 0.04), lift(o2, 0.0), lift(Math.max(o2 + 0.5, bar + 0.6), -0.05), [Math.max(o2 + 1.2, bar + 1.9), gAt(Math.max(o2 + 1.2, bar + 1.9)) + 0.03]]; }
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]];
    };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    const secT = new Float32Array(N); for (let i0 = 0, k = 0; i0 < N; k++) { const n = 25 + Math.floor(crH(k, 3, 71) * 70), t = 0.93 + crH(k, 5, 71) * 0.12; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    {
      const FR = [-1, -0.82, -0.5, -0.24, 0, 0.24, 0.5, 0.82, 1], tileL = 8;
      const shade = (i, f) => { const wi = WA[i], o = f * wi, lane = wi > 2.6 ? Math.abs(Math.abs(o) - wi / 2) : Math.abs(o), trk = Math.exp(-((lane - 0.85) ** 2) / 0.12);
        let k = (0.85 - 0.07 * trk) * secT[i]; if (Math.abs(f) > 0.9) k += 0.03; if (onBr[i]) k *= 0.97; return [k * 1.01, k, k * 1.02]; };
      const KC = [0.8, 0.79, 0.76], KT = [0.86, 0.85, 0.82], SWE = [0.24, 0.24, 0.25], gwMat = new THREE.MeshLambertMaterial({ map: mvSettsTex(), vertexColors: true }), gwAll = new RB(true), SWc = (i, o) => { const k = (0.98 + 0.06 * rpHash(i, 41 + Math.round(o))) * secT[i]; return [k, k * 0.99, k * 0.97]; };
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) {
        a.push(vp[si][i].map(([o], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return k < 3 ? [0.66, 0.65, 0.62] : [0.54, 0.53, 0.5];
          if (k === 4) return mvGCol(x, z);
          if (!town[si][i] && k === 0) { const c = mvCol(x, z, T.hy[i], 1, 0); return [lerp(c[0], 0.62, 0.5), lerp(c[1], 0.61, 0.5), lerp(c[2], 0.56, 0.5)]; }
          const sl = k === 2 ? mvSlope(x, z) : 0; return mvCol(x, z, T.hy[i] + vp[si][i][k][1], 1 / Math.sqrt(1 + sl * sl), Math.max(0, o - (side > 0 ? T.br[i] : T.bl[i]))).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 9, -p[2] / 9];
      const gShade = (i, f) => { const wi = WA[i], o = f * wi, lane = Math.abs(Math.abs(o) - wi / 2), trk = Math.exp(-((lane - 0.85) ** 2) / 0.2), k = (0.98 - 0.12 * trk + 0.05 * Math.abs(f)) * (0.96 + 0.08 * rpHash(i >> 3, 43));
        return [k * 1.02, k * 1.14, k * 1.3]; };   // (the gravel: the limestone's pale grey-beige over the makadam picture, its two wheel tracks darker and packed, the loose stones lighter at the edges)
      const islClip = (i, P) => { if (TALLW.length) for (const q of P) tallOut(q, 2); return P; };   // (the route's rows: off a tall island, TALLW)
      for (let c0 = 0; c0 < N - 1; c0 += 128) {
        const ga = new RB(true), gw = gwAll, gg = new RB(true), gk = winGB(new GB()), gs = new GB(true), gv = new GB(true); let pr = -1, prg = -1;
        for (let i = c0; i <= Math.min(c0 + 128, N - 1); i++) {   // (each segment asphalt or gravel: a row in each where they meet)
          const wi = WA[i], v = i * ds / tileL, gA = i > c0 && SF[i - 1] === 5 && SF[i] === 5, gB = i < N - 1 && SF[i] === 5 && SF[i + 1] === 5, pts = islClip(i, FR.map(f => Pt(i, f * wi, 0.02))), uvs = FR.map(f => [(f * wi + wi) / tileL, v]);
          if (!(gA && gB)) { const r = ga.row(pts, FR.map(f => shade(i, f)), uvs); if (pr >= 0 && !gA) ga.link(pr, r, 0, FR.length - 1); pr = r; }
          if (gA || gB) { const r = gg.row(pts, FR.map(f => gShade(i, f)), FR.map(f => [(f * wi + wi) / 6, i * ds / 6])); if (prg >= 0 && gA) gg.link(prg, r, 0, FR.length - 1); prg = r; }
        }
        for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0; let prw = -1;
          for (let i = c0; i <= Math.min(c0 + 128, N - 1); i++) {   // the sidewalks (raised 7 cm behind the kerb, part of the road), as rows
            const wk = WK ? WK[si][i] : 0; if (wk < 0.05 || onBr[i] || IW[i]) { prw = -1; continue; }   // (p10: in a window the user's sidewalks)
            // (p10: granite setts behind the kerb's light top, a dark edging 10 cm wide on the grass's side)
            const ed = Math.max(WA[i] + 0.2, WA[i] + wk - 0.1), os = [WA[i] + 0.18, ed, ed, WA[i] + wk], pts = os.map(o => Pt(i, side * o, 0.07)), gc = SWc(i, 0).map(v => v * 0.63), cols = [gc, gc, SWE, SWE], uvs = pts.map(p => [p[0] / 1.6, -p[2] / 1.6]);
            if (side < 0) { pts.reverse(); cols.reverse(); uvs.reverse(); }
            const r = gw.row(pts, cols, uvs); if (prw >= 0) gw.link(prw, r, 0, 3); prw = r; }
        }
        for (let i = c0; i < Math.min(c0 + 128, N - 1); i++) { const j = i + 1;
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], ei = wE(si, i), ej = wE(si, j), wki = WK ? WK[si][i] : 0, wkj = WK ? WK[si][j] : 0;
            if (ringIn[si][i] || ringIn[si][j]) continue;
            if (BAR && !onBr[i] && !onBr[j]) {   // (def.barrier: a kerb only in front of a sidewalk; the run-off below does the rest)
              if (wki > 0.05 || wkj > 0.05) { const k0 = WA[i], k1 = WA[j], y0 = 0.02, yk = 0.08;
                gk.quadO(Pt(i, side * k0, y0), Pt(j, side * k1, y0), Pt(j, side * k1, yk), Pt(i, side * k0, yk), KC, Pt(i, side * (k0 + 1), -1));
                gk.quadUp(Pt(i, side * k0, yk), Pt(i, side * (k0 + 0.18), yk), Pt(j, side * (k1 + 0.18), yk), Pt(j, side * k1, yk), [KT, KT, KT, KT]); }
              continue; }
            if (wki > 0.05 || wkj > 0.05 || (town[si][i] && !mouthE[si][i] && !onBr[i])) {   // the kerb: its face up from the road, its top
              const k0 = WA[i], k1 = WA[j], y0 = 0.02, yk = wki > 0.05 ? 0.08 : 0.1;
              gk.quadO(Pt(i, side * k0, y0), Pt(j, side * k1, y0), Pt(j, side * k1, yk), Pt(i, side * k0, yk), KC, Pt(i, side * (k0 + 1), -1));
              gk.quadUp(Pt(i, side * k0, yk), Pt(i, side * (k0 + 0.18), yk), Pt(j, side * (k1 + 0.18), yk), Pt(j, side * k1, yk), [KT, KT, KT, KT]);
              if (wki < 0.05 && wkj < 0.05) gk.quadUp(Pt(i, side * (k0 + 0.18), yk), Pt(i, side * qi[0][0], qi[0][1]), Pt(j, side * qj[0][0], qj[0][1]), Pt(j, side * (k1 + 0.18), yk), [KT, ci[0], cj[0], KT]);
              else gk.quadUp(Pt(i, side * ei, 0.07), Pt(i, side * qi[0][0], qi[0][1]), Pt(j, side * qj[0][0], qj[0][1]), Pt(j, side * ej, 0.07), [KT, ci[0], cj[0], KT]);   // (the sidewalk's back edge to the verge)
            } else if (!onBr[i]) {   // the shoulder: grey gravel from the asphalt's edge
              const sc = [0.78, 0.77, 0.74], sc2 = ci[0];
              gs.quadUp(Pt(i, side * ei, 0.012), Pt(i, side * qi[0][0], qi[0][1]), Pt(j, side * qj[0][0], qj[0][1]), Pt(j, side * ej, 0.012), [sc, sc2, cj[0], sc], [[0, i * ds / 6], [sw / 4, i * ds / 6], [sw / 4, j * ds / 6], [0, j * ds / 6]]);
            } else { const dk = [0.66, 0.65, 0.62]; gk.quadUp(Pt(i, side * ei, 0.02), Pt(i, side * (ei + 0.3), 0.12), Pt(j, side * (ej + 0.3), 0.12), Pt(j, side * ej, 0.02), [dk, dk, dk, dk]); }
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              (onBr[i] ? gk : gv).quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        if (BAR) {   // def.barrier: the run-off from the road's (the sidewalk's) edge out past the barrier's line, its real surfaces (def.roSurf: the run-off's material, RM; without them asphalt, beside the gravel road gravel); then a grass skirt down to the ground
          const QSK = {}, gr = new RB(true), grG = new RB(true), gsk = new RB(true), RC = (i, o) => { const k = 0.9 * secT[i] * (0.985 + 0.03 * rpHash(i >> 2, 53 + Math.round(o))); return [k, k * 0.995, k * 1.01]; };
          const aRo = [], kS = RM ? Math.floor(c0 / RM.strip) : 0;   // (RM: per vertex of gr the atlas's uv and the asphalt's shade; the chunk's strip of the atlas, not each row's: its last row is the next strip's first too. These 128-sample chunks, 4 to Core's 512-sample strip: none spans two)
          const QRO = {}, yRO = (p, i) => { p[1] = T.yAt(T.query(p[0], p[2], i, QRO)) + 0.02; return p; };   // (the run-off at the cars' own heights (Track.yAt): on a steep bend's inside its rows' normals and the cars' projection onto the line part by up to a metre)
          for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0; let pr = -1, prs = -1, pg = -1, prev = null, zprev = null;
            const cu = (g, i, os, P) => { const uvs = os.map(o => g ? [(side * o + WA[i]) / 6, i * ds / 6] : [(side * o + WA[i]) / tileL, i * ds / tileL]);
              if (RM) { const ro = os.map(o => T.roUV(i, side * o, kS).concat(RC(i, o)[0])); if (side < 0) { uvs.reverse(); ro.reverse(); } for (const v of ro) aRo.push(v[0], v[1], v[2]); return [P.map(p => mvGCol(p[0], p[2])), uvs]; }   // (the grass's colour the terrain's at the row's own points, in their order)
              const cols = os.map(o => g ? gShade(i, Math.sign(o) * 1.2) : RC(i, o)); if (side < 0) { cols.reverse(); uvs.reverse(); } return [cols, uvs]; };
            const add = (g, P, i, os) => { const [c2, u2] = cu(g, i, os, P); return (g ? grG : gr).row(P, c2, u2); };
            for (let i = c0; i <= Math.min(c0 + 128, N - 1); i++) {
              const iw = IWE[i], bar = side > 0 ? T.br[i] : T.bl[i], e = iw ? WA[i] : wE(si, i), y0 = !iw && WK && WK[si][i] > 0.05 ? 0.07 : 0.02, grav = !RM && SF[i] === 5;   // (p10: in a window and next to one the run-off from the asphalt's edge: the user's sidewalks over it; beside a window the route's sidewalk's last metre over it)   // (without def.roSurf, beside the gravel road: gravel out to the barrier)
              if (onBr[i] || bar - e < 0.25) { pr = prs = pg = -1; prev = zprev = null; continue; }   // (the bridge: its deck out to the parapets, drawn with it)
              const os = [0, 1, 2, 3, 4, 5, 6].map(k => e + (bar + 0.35 - e) * k / 6), P3 = os.map((o, k) => k ? yRO(PtR(i, side * o, 0.02), i) : PtR(i, side * o, 0.02));   // (7 across: the surface round a ring is curved; the edge at the road's own height)
              const yOut = P3[6][1];
              P3[0][1] += y0 - 0.02;   // (behind a sidewalk: from its back edge's height, a gentle slope down)
              if (side < 0) P3.reverse();
              if (P3.every(p => inZoneW(p[0], p[2], 0.4))) {   // (inside a ring's zone: its own disc. The strip ends on the first such row and starts on the last, over the disc: no wedge of grass between the disc's edge and the run-off)
                if (pg >= 0) grG.link(pg, add(true, P3, i, os), 0, 6); else if (pr >= 0) gr.link(pr, add(false, P3, i, os), 0, 6);
                pr = prs = pg = -1; prev = null; zprev = { i, os, P3 }; continue; }
              const st = prev || (zprev && zprev.i === i - 1 ? zprev : null);   // (a strip's start: the last row of the other kind (asphalt and gravel meet), or the last row in a ring's zone)
              if (grav) { if (pg < 0 && st) pg = add(true, st.P3, st.i, st.os); const r = add(true, P3, i, os); if (pg >= 0) grG.link(pg, r, 0, 6); pg = r; pr = -1; }   // (where the asphalt gives way to the gravel: the gravel from the last row on, no gap between them)
              else { if (pr < 0 && st) pr = add(false, st.P3, st.i, st.os); const r = add(false, P3, i, os); if (pr >= 0) gr.link(pr, r, 0, 6); pr = r; pg = -1; }
              prev = { i, os, P3 }; zprev = null;
              const A = PtR(i, side * (bar + 0.35), 0.02), B = PtR(i, side * (bar + 1.0), 0); A[1] = yOut; const gy = mvGround(B[0], B[2]); B[1] = Math.min(A[1] - 0.05, Math.max(gy + 0.03, A[1] - 0.6));
              if (inZoneW(B[0], B[2], -0.5) || wFree.route(B[0], B[2], -0.3) || (WINS.length && inWin(B[0], B[2]) && (onUserGround(B[0], B[2]) || onUserGround(A[0], A[2])))) { prs = -1; continue; }   // (p10: none over the user's road or sidewalk: it eases down from the run-off's edge itself)   // (its outer edge still in the cars' free ground (a ring's zone, another stretch's run-off): no grass skirt over that run-off)
              { const qb = T.query(B[0], B[2], i, QSK); if (qb.k >= 0 && Math.abs(qb.u) <= T.stubHw(T.stubs[qb.k], qb.st) + 0.8) { prs = -1; continue; } }   // (nor over a side road going on past the barrier)
              const sp = side < 0 ? [B, A] : [A, B], gc = mvGCol(B[0], B[2]), rs = gsk.row(sp, RM ? sp.map(p => mvGCol(p[0], p[2])) : [gc, gc], sp.map(p => [p[0] / 9, -p[2] / 9])); if (prs >= 0) gsk.link(prs, rs, 0, 1); prs = rs;   // (RM: each edge the terrain's colour there, the inner one the run-off's grass's at its last row)
            }
          }
          const mr = addM(gr, RM ? roMat : aMat); if (mr && RM) mr.geometry.setAttribute('aRo', new THREE.Float32BufferAttribute(aRo, 3));
          addM(grG, sMat); const mk = addM(gsk, gMat); if (mk && RM) { const nA = mk.geometry.attributes.normal; for (let k = 0; k < nA.count; k++) nA.setXYZ(k, 0, 1, 0); }   // (RM: the skirt lit as the flat grass either side of it (its slope down from the run-off's edge lit brighter: a pale band at the barrier's foot))
        }
        addM(ga, aMat); addM(gg, sMat); addM(gk, matV); addM(gs, sMat); addM(gv, gMat);
      }
      addM(gwAll, gwMat);
      // the asphalt giving way to the gravel (def.surf: the castle road) worn, not cut straight across: the overlay over each seam (gravelSeams)
      gravelSeams(root, T, { gravel: (i) => SF[i] === 5 && SF[i + 1] === 5, map: tex.asphalt, grav: tex.makadam, gs: tileL / 6, gt: [1.06, 1.17, 1.29], tileL, FR,
        wa: (i) => WA[i], shade, y: 0.035, own: out.ownTex });
    }

    /* ---- the markings: the centre line (dashed, solid round the bends and before the rings, none on the narrow roads and round the rings), the
       edge lines in the country and on the bridge, the zebra crossings, the rings' give-way teeth, the bus stops' yellow zigzags, the start, the
       finish and the checkpoints ---- */
    {
      const gl = winGB(new GB()), gq = new GB(true), gqF = new GB(true), WH = [0.95, 0.95, 0.92], YE = [0.95, 0.78, 0.12];
      const finG = new THREE.Group(); finG.name = 'mvFin'; root.add(finG); out.dyn.mvFin = finG;
      const hyS = (s) => { const f = clamp(s / ds, 0, N - 1.001), i0 = Math.floor(f); return lerp(T.hy[i0], T.hy[i0 + 1], f - i0); };
      const strip = (s0, s1, of, hw, col, dy) => { for (let s = s0; s < s1 - 0.01; s += 2) { const e = Math.min(s1, s + 2), o0 = of(s), o1 = of(e), a = atSf(s, o0 - hw), b = atSf(s, o0 + hw), c = atSf(e, o1 + hw), d = atSf(e, o1 - hw), y0 = hyS(s) + (dy || 0.036), y1 = hyS(e) + (dy || 0.036);
        gl.quadUp([a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]], [col, col, col, col]); } };
      const wS = (s) => WA[T.idx(s)], nar = 0.9 * T.w;   // (nar: the narrow roads, no centre or edge lines; none on the gravel either)
      // the centre line's kind per sample: 0 none, 1 dashed, 2 solid
      const cl = new Uint8Array(N);
      for (let i = 0; i < N; i++) { if (WA[i] < nar || inRing[i] || SF[i] === 5) continue; let km = 0; for (let j = Math.max(0, i - 10); j <= Math.min(N - 1, i + 10); j++) km = Math.max(km, Math.abs(T.k[j])); cl[i] = km > 1 / 140 ? 2 : 1; }
      for (const r of M.rings) if (r.drive) for (let i = 0; i < N; i++) if (!inRing[i] && cl[i] && Math.hypot(T.px[i] - r.x, T.pz[i] - r.z) < r.r + 40) cl[i] = 2;
      for (let i = 0; i < N - 1;) { if (!cl[i]) { i++; continue; } const k = cl[i]; let j = i; while (j < N - 1 && cl[j + 1] === k) j++;
        if (k === 2) strip(i * ds, (j + 1) * ds, () => 0, 0.06, WH); else for (let s = i * ds; s < (j + 1) * ds - 1; s += 9) strip(s, Math.min(s + 3, (j + 1) * ds), () => 0, 0.06, WH);
        i = j + 1; }
      for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0;   // the edge lines: in the country and on the bridge (broken at the side roads' mouths)
        for (let i = 0; i < N - 1; i++) { if (BAR ? inRing[i] || SF[i] === 5 || SF[i + 1] === 5 || (WK && (WK[si][i] > 0.05 || WK[si][i + 1] > 0.05)) || (mouthE[si][i] && i % 2) : (town[si][i] && !onBr[i]) || WA[i] < nar || inRing[i] || SF[i] === 5 || SF[i + 1] === 5 || (mouthE[si][i] && i % 2)) continue; strip(i * ds, (i + 1) * ds, (s) => side * (wS(s) - 0.22), 0.075, WH); } }   // (def.barrier: everywhere but in front of a sidewalk's kerb: the run-off beside the road)
      for (const g0 of def.giveWay || []) { const s0 = sStart + g0, wi = wS(s0);   // the route's own give-way lines (where it merges): teeth across it
        for (let o = -wi + 0.3; o + 0.5 <= wi - 0.2; o += 0.9) { const a = atSf(s0, o), b = atSf(s0, o + 0.5), c = atSf(s0 - 0.6, o + 0.25), y = hyS(s0) + 0.04; gl.triO([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], WH, [a[0], y - 5, a[1]]); } }
      for (const z0 of def.zebras || []) { const s0 = sStart + z0, i0 = T.idx(s0);   // the zebra crossings that go on across an oncoming lane beside the road (its own bars across it)
        gl.winOff = WINS.length > 0 && !inOwnWin(T.px[i0], T.pz[i0]);   // (p10: as the route's own bars)
        for (const L of M.alts) { let bk = -1, bd = 1e9; for (let k = 0; k < L.length; k++) { const dx = L[k][0] - T.px[i0], dz = L[k][1] - T.pz[i0], a = Math.abs(dx * T.tx[i0] + dz * T.tz[i0]), o = Math.abs(dx * T.nx[i0] + dz * T.nz[i0]); if (a < 2.5 && o < WA[i0] + 16 && a < bd) { bd = a; bk = k; } }
          if (bk < 1 || bk >= L.length - 1) continue; const [x, z, y] = L[bk], tx = L[bk + 1][0] - L[bk - 1][0], tz = L[bk + 1][1] - L[bk - 1][1], tl = Math.hypot(tx, tz) || 1, ux = tx / tl, uz = tz / tl, HWa = def.altHw || 2.4;
          for (let o = -HWa + 0.3; o + 0.5 <= HWa - 0.2; o += 1.0) { const P = (u, v) => [x - uz * (o + u) + ux * v, y + 0.07, z + ux * (o + u) + uz * v]; gl.quadUp(P(0, -1.5), P(0.5, -1.5), P(0.5, 1.5), P(0, 1.5), [WH, WH, WH, WH]); } } }
      gl.winOff = false;
      for (const z0 of def.zebras || []) { const s0 = sStart + z0, wi = wS(s0), p0 = atSf(s0, 0);   // the zebra crossings: bars along the road, 0.5 m wide and 0.5 m apart, 3 m long
        gl.winOff = WINS.length > 0 && !inOwnWin(p0[0], p0[1]);   // (p10: in a window too, but in K1: the user's own crossings there)
        for (let o = -wi + 0.3; o + 0.5 <= wi - 0.2; o += 1.0) strip(s0 - 1.5, s0 + 1.5, () => o + 0.25, 0.25, WH, 0.04); }
      gl.winOff = false;
      for (const r of M.rings) if (r.drive) {   // the give-way teeth across the route where it enters a ring (its oncoming traffic takes its own way round)
        let ie = -1; for (let i = 1; i < N; i++) if (inRing[i] && !inRing[i - 1]) { if (Math.hypot(T.px[i] - r.x, T.pz[i] - r.z) < r.r + 4.5) { ie = i; break; } }
        if (ie < 0) continue; const s0 = (ie - 2) * ds, wi = WA[ie - 2];
        for (let o = -wi + 0.3; o + 0.5 <= wi - 0.2; o += 0.9) { const a = atSf(s0, o), b = atSf(s0, o + 0.5), c = atSf(s0 - 0.6, o + 0.25), y = hyS(s0) + 0.04; gl.triO([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], WH, [a[0], y - 5, a[1]]); } }
      for (const [d, side] of def.stops || []) { const s0 = sStart + d;   // the bus stops: a yellow zigzag along the edge
        if (WINS.length) { const pa = atSf(s0 - 12, 0), pb = atSf(s0 + 12, 0), pm = atSf(s0, 0); if ([pa, pm, pb].some(p => inOwnWin(p[0], p[1]))) continue; gl.winOff = true; }   // (p10: none touching K1, whole elsewhere)
        for (let k = 0; k < 8; k++) { const sa = s0 - 12 + k * 3, sb = sa + 3, oa = (s) => side * (wS(s) - (k % 2 ? 0.25 : 1.4)), ob = (s) => side * (wS(s) - (k % 2 ? 1.4 : 0.25));
          const a1 = atSf(sa, oa(sa) - 0.06), a2 = atSf(sa, oa(sa) + 0.06), b1 = atSf(sb, ob(sb) + 0.06), b2 = atSf(sb, ob(sb) - 0.06), y0 = hyS(sa) + 0.037, y1 = hyS(sb) + 0.037;
          gl.quadUp([a1[0], y0, a1[1]], [a2[0], y0, a2[1]], [b1[0], y1, b1[1]], [b2[0], y1, b2[1]], [YE, YE, YE, YE]); } gl.winOff = false; }
      const W1 = [1, 1, 1];
      for (const s0 of [sStart, sFin]) { const wi = wS(s0), uM = Math.round(wi * 2 / 0.8) / 16, a = atSf(s0 - 0.8, -wi), b = atSf(s0 - 0.8, wi), c = atSf(s0 + 0.8, wi), d = atSf(s0 + 0.8, -wi), y = hyS(s0) + 0.045;
        (s0 === sFin ? gqF : gq).quadUp([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], [d[0], y, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) strip(s0 - 0.25, s0 + 0.25, () => 0, wS(s0) - 0.15, WH, 0.042);
      if (def.paint && def.paint.length) {   // (p10) the user's markings (K1's their own; the other windows' made by the pipeline from their road's outline): { p: [x, z, ...] a polygon, or l: [x, z, ...] a line w metres
        // wide; c: [r, g, b] 0-255 }, 2.5 cm over the ground they lie on (the run-off's, the route's or a ring's surface; past the barrier the user's asphalt)
        const hP = (x, z) => wY(x, z, 0.025, 0.095); gl.winOff = true;
        for (const F of def.paint) { const c = [F.c[0] / 255, F.c[1] / 255, F.c[2] / 255];
          if (F.l) { const L = F.l, hw = (F.w || 0.12) / 2;   // (a line: pieces of up to 1 m along it)
            for (let k = 0; k + 3 < L.length; k += 2) { const ax = L[k], az = L[k + 1], bx = L[k + 2], bz = L[k + 3], len = Math.hypot(bx - ax, bz - az); if (len < 1e-3) continue;
              const m = Math.max(1, Math.ceil(len)), nx = -(bz - az) / len * hw, nz = (bx - ax) / len * hw;
              for (let j = 0; j < m; j++) { const x0 = lerp(ax, bx, j / m), z0 = lerp(az, bz, j / m), x1 = lerp(ax, bx, (j + 1) / m), z1 = lerp(az, bz, (j + 1) / m);
                wQuad(gl, [x0 - nx, z0 - nz], [x1 - nx, z1 - nz], [x1 + nx, z1 + nz], [x0 + nx, z0 + nz], hP, c); } }
            continue; }
          const q = []; for (let k = 0; k + 1 < F.p.length; k += 2) q.push([F.p[k], F.p[k + 1]]); if (q.length < 3) continue;
          if (q.length === 4) { wQuad(gl, q[0], q[1], q[2], q[3], hP, c); continue; }
          for (const [a, b, d] of THREE.ShapeUtils.triangulateShape(q.map(p => new THREE.Vector2(p[0], p[1])), [])) wTri(gl, q[a], q[b], q[d], hP, c); }
        gl.winOff = false; }
      tex.checker.repeat.set(1, 1); const qMat = new THREE.MeshLambertMaterial({ map: tex.checker }); addM(gq, qMat); addM(gqF, qMat, false, finG); addM(gl, lMat);
    }

    /* ---- scenery helpers (vertex coloured, 140 m chunks), the boards ---- */
    const scen = new Chunks(230), ban = new GB(true), ban3 = new GB(true), W1 = [1, 1, 1];
    const finG = out.dyn.mvFin, finS = new GB(), finB = new GB(true);
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * (wE(side > 0 ? 1 : 0, i) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t (as Vršič's)
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const fans = [[0.86, 0.14, 0.12], [0.96, 0.82, 0.2], [0.16, 0.36, 0.78], [0.95, 0.95, 0.95], [0.2, 0.6, 0.3], [1, 0.55, 0.1], [0.12, 0.14, 0.2], [0.16, 0.36, 0.78], [0.95, 0.95, 0.95]];
    const CR = crowdCtx({ gH: mvGround, near: (x, z) => mvNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => mvW(x, z).e > -3 }), crSoft = new Set();

    /* ---- the side roads (as Vršič's, vrStubBuild): the surface from a mouth flared out to the route's edge, a give-way line, at the end the
       closure (the course is closed: a guard rail with the board, a gate on the driveways and tracks; the street goes on beyond it: def.roads),
       the street's name on a blue plate at its mouth ---- */
    const stubNames = []; for (const S of T.stubs || []) { const n = S.name; if (n && !stubNames.includes(n) && stubNames.length < 13) stubNames.push(n); }
    {
      const F = {}, SA = new Chunks(260, true), SG = new Chunks(260, true), SL = new Chunks(260), RS = rng(4431);
      for (const C of [SA, SG, SL]) { const g0 = C.get.bind(C); C.get = (x, z) => winGB(g0(x, z)); }   // (p10: in the windows the user's road)
      const yAt = (x, z, S, t) => T.yAt(T.query(x, z, T.stubHint(S.k, t), Q));
      const white = [0.95, 0.95, 0.92], steel = [0.78, 0.8, 0.82], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52], yel = [0.93, 0.74, 0.1], red = [0.84, 0.13, 0.1], blk = [0.12, 0.12, 0.13];
      for (const S of T.stubs || []) {
        const k = S.k, paved = !S.grav, tEnd = S.end === 2 && !BAR ? S.L + 0.5 : S.Lend;
        const P0 = T.stubPt(k, S.tb, {}), m0 = T.query(P0.x, P0.z, S.i0, {}), sinA = Math.max(0.3, Math.abs(P0.tx * m0.nx + P0.tz * m0.nz));
        let tc = 0; if (BAR) for (let t = 0; t < S.Lend; t += 0.5) { const p = T.stubPt(k, t, F); if (!wFree.route(p.x, p.z, 0) && !wFree.ring(p.x, p.z, -1)) { tc = t; break; } }   // (def.barrier: where it leaves the cars' free ground (the route's run-off, a ring's zone); inside it the run-off's surfaces)
        const t0 = BAR ? Math.max(0, tc + 0.2) : Math.max(0, S.te - 2 - (T.stubHw(S, 0) + 0.7) * Math.sqrt(1 - sinA * sinA) / sinA);
        const secs = [];
        for (let t = t0; ; t += 2) { const tt = Math.min(t, tEnd), p = T.stubPt(k, tt, F), nx = -p.tz, nz = p.tx, hw = tt < S.te ? T.stubHw(S, tt) : Math.min(T.stubHw(S, tt), stubHwD(S, tt)), us = [-hw - 0.5, -hw, -hw / 2, 0, hw / 2, hw, hw + 0.5];
          const hi = T.nearestIdx(p.x, p.z);   // (the road's sample beside this section: a side road at a shallow angle spans more of the road than its junction's)
          secs.push({ t: tt, pts: us.map((u, j) => { let x = p.x + nx * u, z = p.z + nz * u;
            for (let it = 0; it < 5; it++) { const q = T.query(x, z, hi, Q); if (q.deep) break; const e = WA[q.a] + 0.02 - S.side * q.d; if (e <= 0) break;   // (out at its own side's edge)
              if (it === 4) { x += q.nx * S.side * e; z += q.nz * S.side * e; break; }   // (still on the asphalt: straight out to its edge)
              const sl = Math.max(0.25, Math.abs(p.tx * q.nx + p.tz * q.nz)); x += p.tx * e / sl; z += p.tz * e / sl; }
            if (TALLW.length) { const o = tallOut([x, z], 1); x = o[0]; z = o[1]; }   // (its flared mouth off a ring's tall island)
            const edge = j === 0 || j === 6, y = yAt(x, z, S, tt) + (edge ? 0.03 : 0.055), gc = mvGCol(x, z), sh = (0.88 + 0.08 * RS()) * secT[S.i0];
            return [x, y, z, edge ? gc : paved ? [0.85 * sh, 0.85 * sh, 0.87 * sh] : [0.78, 0.77, 0.74], (u + 4) / 8, tt / 8]; }) });   // (the gravel: the shoulder's grey gravel, the user's wish, 2. 11. 2026: »enake barve kot makadam za belo črto«)
          if (tt >= tEnd) break; }
        for (let a = 0; a + 1 < secs.length; a++) { const A = secs[a].pts, B = secs[a + 1].pts, C = paved ? SA : SG;
          for (let j = 0; j < 6; j++) { const p = A[j], q = A[j + 1], r = B[j + 1], s = B[j]; if (Math.hypot(p[0] - q[0], p[2] - q[2]) + Math.hypot(s[0] - r[0], s[2] - r[2]) < 0.05) continue;
            C.get(p[0], p[2]).quadUp([p[0], p[1], p[2]], [q[0], q[1], q[2]], [r[0], r[1], r[2]], [s[0], s[1], s[2]], [p[3], q[3], r[3], s[3]], [[p[4], p[5]], [q[4], q[5]], [r[4], r[5]], [s[4], s[5]]]); } }
        const gwv = (def.sideRoads[k] || [])[11], gwt = gwv > 1 ? gwv : S.te + 1.2, ownW = (t) => Math.min(T.stubHw(S, t), S.hw);   // (the lines across its own width, not the flared mouth)   // (row[11]: 0 none, a distance along it, else at its mouth)
        if (paved && S.kind === 0 && gwv !== 0 && !(BAR && gwt < tc + 0.5) && !((def.sideRoads[k] || [])[12] || []).some(tz => Math.abs(tz - gwt) < 3.5)) { const t = gwt, p = T.stubPt(k, t, F), nx = -p.tz, nz = p.tx, hw = ownW(t) - 0.3;   // the give-way line (the streets): 50 cm dashes across it
          for (let u = 0.2; u + 0.5 <= hw; u += 1) { const at = (uu, dt) => { const x = p.x + nx * uu + p.tx * dt, z = p.z + nz * uu + p.tz * dt; return [x, yAt(x, z, S, t) + 0.07, z]; };
            SL.get(p.x, p.z).quadUp(at(u, -0.15), at(u + 0.5, -0.15), at(u + 0.5, 0.15), at(u, 0.15), [white, white, white, white]); } }
        for (const tz of (def.sideRoads[k] || [])[12] || []) { if (BAR && tz < tc + 1.5) continue; const p = T.stubPt(k, tz, F), nx = -p.tz, nz = p.tx, hw = ownW(tz) - 0.3;   // the zebra crossings across it (OSM), where the sidewalk crosses its mouth
          for (let u = -hw; u + 0.5 <= hw; u += 1) { const at = (uu, dt) => { const x = p.x + nx * uu + p.tx * dt, z = p.z + nz * uu + p.tz * dt; return [x, yAt(x, z, S, tz + dt) + 0.07, z]; };
            SL.get(p.x, p.z).quadUp(at(u, -1.5), at(u + 0.5, -1.5), at(u + 0.5, 1.5), at(u, 1.5), [white, white, white, white]); } }
        const bol = BAR ? [] : T.stubBollards(k); for (const b of bol) out.props.push(b);   // the yellow triangular bollards across its mouth: this is not the way (knockable; def.barrier: none, the barrier runs across it)
        if (S.end !== 2 && !BAR) { const p = T.stubPt(k, S.L, {}), nx = -p.tz, nz = p.tx, hc = S.hw + S.lim, g = scen.get(p.x, p.z), rot = p.h + PI / 2;   // the closure
          const at = (u, dt, dy) => { const x = p.x + nx * u + p.tx * dt, z = p.z + nz * u + p.tz * dt; return [x, yAt(x, z, S, S.L) + dy, z]; };
          if (S.end === 0) {
            const n = Math.max(2, Math.ceil(hc)); for (let c = 0; c < n; c++) { const u0 = -hc + c * 2 * hc / n, u1 = u0 + 2 * hc / n, a = at(u0, -0.25, 0.45), b = at(u1, -0.25, 0.45), cc = at(u1, -0.25, 0.8), d = at(u0, -0.25, 0.8);
              g.quadO(a, b, cc, d, steel, at((u0 + u1) / 2, 2.5, 0.6)); g.quadO(a, b, cc, d, steelB, at((u0 + u1) / 2, -3, 0.6)); }
            for (let u = -hc; u <= hc + 0.01; u += hc / Math.max(1, Math.round(hc / 1.6))) { const q = at(u, 0.05, -0.35); box(g, q[0], q[1], q[2], 0.13, 1.13, 0.13, p.h, postC, null, true); }
            for (const u of [-hc * 0.55, hc * 0.55]) { const q = at(u, -0.32, 0.47); bannerQ(q[0], q[1], q[2], p.tx, p.tz, 1.5, 0.3, 7 / 8, 1, 0.625, 1, ban3); }
            if (!bol.length || bol[0].t < S.L - 2.8) out.props.push({ kind: 'zaprta', x: p.x - p.tx * 1.3, z: p.z - p.tz * 1.3, yaw: p.h, col: 0, i: T.stubHint(k, S.L - 1.3) });   // the closure board and the no-entry sign: a knockable pole in front of the rail (it stood behind it, out of reach); not where the bollards stand
          } else {
            for (const u of [-(S.hw + 0.25), S.hw + 0.25]) { const q = at(u, 0, -0.2); box(g, q[0], q[1], q[2], 0.16, 1.25, 0.16, rot, yel, blk); }
            const m = Math.max(4, Math.round(S.hw * 2 / 0.6)); for (let c = 0; c < m; c++) { const u = -S.hw + (c + 0.5) * 2 * S.hw / m, q = at(u, 0, 0.88); box(g, q[0], q[1], q[2], 2 * S.hw / m + 0.005, 0.1, 0.1, rot, c % 2 ? white : red); }
            const q = at(0, -0.08, 0.72); bannerQ(q[0], q[1], q[2], p.tx, p.tz, 0.9, 0.22, 6 / 8, 7 / 8, 0, 0.5, ban3);
          }
          exclPush(p.x, p.z, hc + 1.5);
        }
        const ni = S.name ? stubNames.indexOf(S.name) : -1;   // its name at its mouth: a blue plate on a pole at the right-hand corner going in
        if (ni >= 0) { const t = S.tb + 1.5, p = T.stubPt(k, t, F), u = T.stubHw(S, t) + Math.min(0.5, S.lim - 0.2), x = p.x - p.tz * u, z = p.z + p.tx * u;   // (a knockable plate on a pole, now inside the side road's limit so that a car can reach it: the blue plate with white bars for its name; the atlas's name cells are unused)
          out.props.push({ kind: 'nsign', x, z, yaw: p.h, col: 0, i: T.stubHint(k, t) }); exclPush(x, z, 1); }
        for (let t = 0, e = S.end === 2 && !BAR ? S.L : S.Lend + 3; t <= e; t += 3) { const p = T.stubPt(k, t, {}); exclPush(p.x, p.z, Math.min(T.stubHw(S, t), stubHwD(S, t)) + 1.2); }   // (nothing grows on the side roads)
      }
      SA.addTo(root, aMat, false, true); SG.addTo(root, sMat, false, true); SL.addTo(root, lMat, false, true);
    }

    /* ---- the oncoming lanes round the rings and the split approaches (def.altDn), the raised islands between them and the route near the rings (def.splitIsl: the
       track file's own islands instead, below) ---- */
    {
      const ga = new RB(true), HW = def.altHw || 2.4, isl = [0.66, 0.65, 0.62], kerb = [0.8, 0.79, 0.76], QS2 = {}, GEN = !def.splitIsl;
      for (const L of M.alts) { const n = L.length; if (n < 2) continue; let pr = -1, cum = 0;
        const nrm = L.map((p, k) => { const a = L[Math.max(0, k - 1)], b = L[Math.min(n - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
        const QA = {}, onSR = L.map(([x, z]) => { const q = T.query(x, z, T.nearestIdx(x, z), QA); return q.k >= 0 && q.st > T.stubs[q.k].te + 2 && Math.abs(q.u) <= T.stubs[q.k].hw; });   // (on a side road's own carriageway: that road is its asphalt)
        const inF = L.map(([x, z]) => BAR && (wFree.route(x, z, -1) || wFree.ring(x, z, -1)));   // (def.barrier: in the cars' free ground the run-off is its road; only past the barrier its own)
        for (let k = 0; k < n; k++) { const [x, z, y] = L[k], [nx, nz] = nrm[k]; if (k) cum += Math.hypot(x - L[k - 1][0], z - L[k - 1][1]);
          const os = [-HW, 0, HW], sh = 0.84 * (0.97 + 0.06 * rpHash(Math.round(cum / 30), 7));
          const r = ga.row(os.map(o => [x + nx * o, y + 0.03, z + nz * o]), os.map(() => [sh, sh, sh * 1.01]), os.map(o => [(o + HW) / 8, cum / 8]));
          if (pr >= 0 && !(onSR[k] && onSR[k - 1]) && !(inF[k] && inF[k - 1]) && !(WINS.length && inWin(x, z) && inWin(L[k - 1][0], L[k - 1][1]))) ga.link(pr, r, 0, 2); pr = r; }
        // the islands: where the lane runs within 10 m of the route near a ring, raised 13 cm between the two edges behind kerbs, paved (no grass in the road)
        const rows = !GEN ? [] : L.map(([x, z, y], k) => { if (!M.rings.some(r => Math.hypot(x - r.x, z - r.z) < r.r + 45 && Math.hypot(x - r.x, z - r.z) > r.r + r.hw + 0.7)) return null;
          const i = T.nearestIdx(x, z), q = T._qMain(x, z, i, QS); if (q.over) return null; const sd = q.d > 0 ? 1 : -1, gap = Math.abs(q.d) - WA[q.a] - HW; if (gap < 0.4 || gap > 10) return null;
          const [nx, nz] = nrm[k], toR = (q.nx * nx + q.nz * nz) * sd > 0 ? -1 : 1;   // (which way across the lane faces the route)
          const ax = x + nx * toR * (HW + 0.05), az = z + nz * toR * (HW + 0.05), bx = q.x - q.nx * sd * (Math.abs(q.d) - WA[q.a] - 0.05), bz = q.z - q.nz * sd * (Math.abs(q.d) - WA[q.a] - 0.05);
          if (BAR) { const ya = T.yAt(T.query(ax, az, q.a, QS2)), yb = T.yAt(T.query(bx, bz, q.a, QS2));   // (def.barrier: a low island on the run-off, at the cars' own heights; drivable, the kerbs a bump)
            return { a: [ax, ya + 0.12, az], b: [bx, yb + 0.12, bz], ya: ya + 0.02, yb: yb + 0.02, gap, i: q.a, grass: true }; }
          return { a: [ax, y + 0.16, az], b: [bx, T._hyAt(q.s) + 0.16, bz], ya: y + 0.03, yb: T._hyAt(q.s) + 0.02, gap, i: q.a }; });
        for (let k = 0; k + 1 < n; k++) { const A = rows[k], B = rows[k + 1]; if (!A || !B || Math.abs(A.i - B.i) > 4) continue;   // (not across to another leg of the road: a ring's other side)
          if (((B.a[0] - A.a[0]) * (A.b[2] - A.a[2]) - (B.a[2] - A.a[2]) * (A.b[0] - A.a[0])) * ((B.b[0] - A.b[0]) * (A.b[2] - A.a[2]) - (B.b[2] - A.b[2]) * (A.b[0] - A.a[0])) < 0) continue;   // (a twisted quad)
          const gi = scen.get(A.a[0], A.a[2]), ic = A.grass ? [0.33, 0.5, 0.2] : isl; gi.quadUp(A.a, A.b, B.b, B.a, [ic, ic, ic, ic]);
          gi.quadO([A.a[0], A.ya, A.a[2]], [B.a[0], B.ya, B.a[2]], B.a, A.a, kerb, [(A.b[0] + B.b[0]) / 2, A.a[1] - 3, (A.b[2] + B.b[2]) / 2]);
          gi.quadO([A.b[0], A.yb, A.b[2]], [B.b[0], B.yb, B.b[2]], B.b, A.b, kerb, [(A.a[0] + B.a[0]) / 2, A.b[1] - 3, (A.a[2] + B.a[2]) / 2]); }
      }
      addM(ga, aMat);
    }
    // def.splitIsl ([{ p: [x, z, ...], g: 'grass' }, ...]; the p8 files a bare [x, z, ...]): every island but the rings' central ones, as the user outlined them (the
    // rings' splitter islands, Smlednik's corner lenses, Gorenjska's medians): grass FLUSH with the ground the cars drive on (no step, no kerb to climb: they drive across
    // it, Track.surface: the run-off's class there, grass). Where the run-off's surfaces (def.roSurf) have it as grass they draw it already; else its grass here. A light
    // kerb line just inside its outline (flush, over the run-off: lMat; the outline traced on the photo's half-metre raster rounded off). A long island's nose (the end
    // away from its ring; on a median the end the route comes to first) carries the island's sign on its three heavy bases: 'isign', knockable (Core PROPK: it bursts
    // into the three bases and the board)
    const SPL = (def.splitIsl || []).map(F => { const P = Array.isArray(F) ? F : (F && F.p) || [], q = []; for (let k = 0; k + 1 < P.length; k += 2) q.push([P[k], P[k + 1]]); return q; }).filter(q => q.length >= 3);
    out.islands = { n: SPL.length, own: 0, signs: [] };
    if (SPL.length) {
      const gI = new GB(), QI = {}, kerbC = [0.82, 0.81, 0.77], grassC = [0.33, 0.5, 0.2];
      const smooth = (q) => {   // (the outline every 0.4 m, then a 5-point running mean three times round: the photo raster's half-metre steps gone)
        let p = []; for (let k = 0; k < q.length; k++) { const a = q[k], b = q[(k + 1) % q.length], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.4)); for (let j = 0; j < m; j++) p.push([lerp(a[0], b[0], j / m), lerp(a[1], b[1], j / m)]); }
        const n = p.length; if (n < 8) return p;
        for (let it = 0; it < 3; it++) p = p.map((_, k) => { let x = 0, z = 0; for (let j = -2; j <= 2; j++) { const v = p[(k + j + n) % n]; x += v[0]; z += v[1]; } return [x / 5, z / 5]; });
        return p; };
      const signSpot = (q, cx, cz) => {   // [x, z, yaw] of the sign on a long island's nose, or null
        let sxx = 0, sxz = 0, szz = 0; for (const [x, z] of q) { sxx += (x - cx) ** 2; sxz += (x - cx) * (z - cz); szz += (z - cz) ** 2; }
        const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th), n = q.length, tw = q.map(([x, z]) => [(x - cx) * ux + (z - cz) * uz, -(x - cx) * uz + (z - cz) * ux]);
        let lo = 1e9, hi = -1e9; for (const [t] of tw) { lo = Math.min(lo, t); hi = Math.max(hi, t); }
        const cut = (t) => { let a = 1e9, b = -1e9; for (let k = 0; k < n; k++) { const P = tw[k], Q = tw[(k + 1) % n]; if ((P[0] - t) * (Q[0] - t) > 0 || P[0] === Q[0]) continue; const w = P[1] + (Q[1] - P[1]) * (t - P[0]) / (Q[0] - P[0]); a = Math.min(a, w); b = Math.max(b, w); } return b - a > 0 ? [a, b] : null; };
        const c0 = cut((lo + hi) / 2); if (hi - lo < 4 || !c0 || hi - lo < 2.5 * (c0[1] - c0[0])) return null;   // (a long island, not a lens or a blob)
        const at = (t, w) => [cx + ux * t - uz * w, cz + uz * t + ux * w];
        let R = null, rd = 70; for (const Q of T.rings) { const d = Math.hypot(Q.x - cx, Q.z - cz); if (d < rd) { rd = d; R = Q; } }
        const E0 = at(lo, 0), E1 = at(hi, 0); let dir;
        if (R) dir = Math.hypot(E0[0] - R.x, E0[1] - R.z) > Math.hypot(E1[0] - R.x, E1[1] - R.z) ? -1 : 1;
        else dir = T.query(E0[0], E0[1], T.nearestIdx(E0[0], E0[1]), {}).s < T.query(E1[0], E1[1], T.nearestIdx(E1[0], E1[1]), {}).s ? -1 : 1;
        const tN = dir < 0 ? lo : hi;
        for (let bk = 1.1; bk < Math.min(6, (hi - lo) / 2); bk += 0.3) { const t = tN - dir * bk, c = cut(t); if (!c || c[1] - c[0] < 1.0) continue; const [x, z] = at(t, (c[0] + c[1]) / 2); return [x, z, th]; }
        return null;
      };
      for (const q0 of SPL) {
        const q = smooth(q0), n = q.length; let A2 = 0, cx = 0, cz = 0; for (let k = 0; k < n; k++) { const a = q[k], b = q[(k + 1) % n]; A2 += a[0] * b[1] - b[0] * a[1]; cx += a[0]; cz += a[1]; } cx /= n; cz /= n;
        const sg = A2 > 0 ? 1 : -1, i0 = T.nearestIdx(cx, cz), yq = (x, z) => T.yAt(T.query(x, z, i0, QI)) + 0.035;
        let inn = null; for (let k = 0; k < n && !inn; k++) { const a = q[k], b = q[(k + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, x = (a[0] + b[0]) / 2 - (b[1] - a[1]) / l * sg * 0.6, z = (a[1] + b[1]) / 2 + (b[0] - a[0]) / l * sg * 0.6; if (inPoly(q, x, z)) inn = [x, z]; }
        if (!(RM && inn && T.roClass(T.query(inn[0], inn[1], i0, {})) === 2)) {   // (its own grass: the run-off's surfaces have it otherwise)
          const P3 = q.map(([x, z]) => [x, yq(x, z), z]); for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(q.map(p => new THREE.Vector2(p[0], p[1])), [])) gI.triUp(P3[a], P3[b], P3[c], [grassC, grassC, grassC]); out.islands.own++; }
        const IN = q.map((p, k) => { const a = q[(k + n - 1) % n], b = q[(k + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [p[0] - (b[1] - a[1]) / l * sg * 0.16, p[1] + (b[0] - a[0]) / l * sg * 0.16]; });   // (the kerb line: 0.16 m in from the outline, the normals across both neighbours)
        const OY = q.map(([x, z]) => yq(x, z) + 0.005), IY = IN.map(([x, z]) => yq(x, z) + 0.005);
        for (let k = 0; k < n; k++) { const j = (k + 1) % n; gI.quadUp([q[k][0], OY[k], q[k][1]], [q[j][0], OY[j], q[j][1]], [IN[j][0], IY[j], IN[j][1]], [IN[k][0], IY[k], IN[k][1]], [kerbC, kerbC, kerbC, kerbC]); }
        const S = signSpot(q, cx, cz);
        if (S && !excluded(S[0], S[1])) { out.props.push({ kind: 'isign', x: S[0], z: S[1], yaw: S[2], col: 0, i: T.nearestIdx(S[0], S[1]) }); exclPush(S[0], S[1], 1); out.islands.signs.push([S[0], S[1]]); }
      }
      addM(gI, lMat);
    }

    /* ---- the rings' islands: an apron of granite setts inside the ring, a kerb, a mound of lawn with shrubs and a small tree (the big ring on
       the slip road too) ---- */
    {
      const gp = new GB(true), lawn = [0.3, 0.5, 0.18], kerb = [0.82, 0.81, 0.78], sett = [0.78, 0.74, 0.7];
      // isl 'tall' (Track.rings' R.tall): the island dense tall grass the cars may drive across, out to its edge (World's r.ri, the run-off's grass edge; the ground under
      // it the ring's zone surface, below); in its very middle the only solid thing, R.mid across (wallCollide): a stone on a round concrete plinth in a ring of red and
      // white tyre stacks. The grass: clumps 0.55 m apart (jittered), shorter at the edge, one instanced mesh a ring (no shadow), swaying in the wind
      const QT = {}, tallMat = M.rings.some(r => { const R = T.rings.find(Q => Math.hypot(Q.x - r.x, Q.z - r.z) < 0.5); return R && R.tall; }) ? tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })) : null;
      out.tall = [];
      const tallIsl = (r, TR) => {
        const g = scen.get(r.x, r.z), hint = T.nearestIdx(r.x + r.r, r.z), yQ = (x, z) => T.yAt(T.query(x, z, hint, QT)), y0 = yQ(r.x, r.z), mid = TR.mid, RI = rng(Math.round(r.x * 10));
        const rt = mid - 0.43, pr = Math.max(0.45, rt - 0.53), nt = Math.max(6, Math.floor(TAU * rt / 0.9));
        cyl(g, r.x, y0 - 0.15, r.z, pr, 0.72, 12, [0.6, 0.59, 0.56], [0.68, 0.67, 0.63]);
        API.ROCK_SMOOTH = true; ico(g, r.x, y0 + 0.5 + pr * 0.55, r.z, pr * 0.78, 0.9, [0.55, 0.53, 0.5], RI, 0.25); API.ROCK_SMOOTH = false;
        for (let k = 0; k < nt; k++) { const a = k / nt * TAU, x = r.x + Math.cos(a) * rt, z = r.z + Math.sin(a) * rt; tyreStack(g, x, yQ(x, z) - 0.03, z, 0.8, k % 2 ? [0.95, 0.95, 0.94] : [0.88, 0.33, 0.24], 0.43); }
        const ie = r.ri, r0 = mid + 0.25, sp = 0.55, ic = new IChunks(mvTallGeo(), tallMat, 1e5); let nc = 0;
        for (let a = -ie; a <= ie + 1e-6; a += sp) for (let b = -ie; b <= ie + 1e-6; b += sp) {
          const ka = Math.round((r.x + a) * 4), kb = Math.round((r.z + b) * 4), h1 = rpHash(ka, kb), h2 = rpHash(ka + 7, kb + 13), h3 = rpHash(ka + 29, kb + 5);
          const x = r.x + a + (h1 - 0.5) * sp * 0.8, z = r.z + b + (h2 - 0.5) * sp * 0.8, d = Math.hypot(x - r.x, z - r.z); if (d < r0 || d > ie - 0.1) continue;
          const e = 0.55 + 0.45 * sstep(ie - 0.1, ie - 1.2, d), dry = h3 * h3, k = 0.9 + 0.2 * h1;
          ic.add(x, yQ(x, z) - 0.03, z, h1 * TAU, 0.95 + 0.4 * h2, (0.85 + 0.45 * h3) * e, [lerp(0.34, 0.52, dry) * k, lerp(0.52, 0.54, dry) * k, lerp(0.2, 0.27, dry) * k]); nc++;
        }
        const grp = new THREE.Group(); grp.name = 'mvTall'; root.add(grp); ic.addTo(grp, false); grp.traverse(m => { if (m.isInstancedMesh) { m.castShadow = false; if (m.instanceColor) m.instanceColor.ground = true; } });   // (the seasons paint them as grass)
        exclPush(r.x, r.z, ie + 1); out.tall.push({ x: r.x, z: r.z, mid, edge: ie, clumps: nc, tyres: nt });
      };
      for (const r of M.rings) { const TRt = T.rings.find(R => Math.hypot(R.x - r.x, R.z - r.z) < 0.5); if (BAR && TRt && TRt.tall) { tallIsl(r, TRt); continue; }
        const g = scen.get(r.x, r.z), n = 32, ap = r.ri - 1.5, y = r.y, at = (a, rad, dy) => [r.x + Math.cos(a) * rad, lerp(r.y, r.yAt(a), clamp(rad / r.ri, 0, 1)) + dy, r.z + Math.sin(a) * rad];
        for (let k = 0; k < n; k++) { const a0 = k / n * TAU, a1 = (k + 1) / n * TAU;
          gp.quadUp(at(a0, ap, 0.06), at(a0, r.ri + 0.05, 0.035), at(a1, r.ri + 0.05, 0.035), at(a1, ap, 0.06), [sett, sett, sett, sett], [at(a0, ap, 0), at(a0, r.ri, 0), at(a1, r.ri, 0), at(a1, ap, 0)].map(p => [p[0] / 1.2, p[2] / 1.2]));
          g.quadO(at(a0, ap, 0.06), at(a1, ap, 0.06), at(a1, ap, 0.22), at(a0, ap, 0.22), kerb, [r.x, y, r.z]);
          if (r.isl === 'setts') {   // (def.rings isl, as the orthophoto shows it: setts all over, a low dome; 'mixed': lawn round a paved centre; else the lawn's mound)
            gp.quadUp(at(a0, ap, 0.22), at(a0, ap * 0.5, 0.32), at(a1, ap * 0.5, 0.32), at(a1, ap, 0.22), [sett, sett, sett, sett], [at(a0, ap, 0), at(a0, ap * 0.5, 0), at(a1, ap * 0.5, 0), at(a1, ap, 0)].map(p => [p[0] / 1.2, p[2] / 1.2]));
            { const A = at(a0, ap * 0.5, 0.32), B = at(a1, ap * 0.5, 0.32), C = [r.x, y + 0.38, r.z]; gp.triUp(A, B, C, [sett, sett, sett], [A, B, C].map(p => [p[0] / 1.2, p[2] / 1.2])); }
          } else if (r.isl === 'mixed') {
            g.quadUp(at(a0, ap, 0.22), at(a0, ap * 0.45, 0.4), at(a1, ap * 0.45, 0.4), at(a1, ap, 0.22), [lawn, lawn, lawn, lawn]);
            gp.quadUp(at(a0, ap * 0.45, 0.4), at(a0, 0.01, 0.46), at(a1, 0.01, 0.46), at(a1, ap * 0.45, 0.4), [sett, sett, sett, sett], [at(a0, ap * 0.45, 0), at(a0, 0.01, 0), at(a1, 0.01, 0), at(a1, ap * 0.45, 0)].map(p => [p[0] / 1.2, p[2] / 1.2]));
          } else {
            g.quadUp(at(a0, ap, 0.22), at(a0, ap * 0.55, 0.62), at(a1, ap * 0.55, 0.62), at(a1, ap, 0.22), [lawn, lawn, lawn, lawn]);
            g.triO(at(a0, ap * 0.55, 0.62), at(a1, ap * 0.55, 0.62), [r.x, y + 0.85, r.z], lawn, [r.x, y - 4, r.z]); } }
        const RI = rng(Math.round(r.x * 10)); API.ROCK_SMOOTH = true;
        if (r.isl === 'setts' || r.isl === 'mixed') { const hy0 = (r.isl === 'setts' ? 0.38 : 0.46) - 0.05, sc = r.isl === 'mixed' ? 1 : 0.7;   // (a stone in the middle, a sculpture's plinth; small trees round the mixed one's lawn)
          box(scen.get(r.x, r.z), r.x, y + hy0, r.z, 1.6 * sc, 0.5, 1.6 * sc, 0.6, [0.62, 0.6, 0.57]); ico(scen.get(r.x, r.z), r.x, y + hy0 + 1.0, r.z, 0.75 * sc, 0.9, [0.55, 0.53, 0.5], RI, 0.25);
          if (r.isl === 'mixed') for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3, d = ap * 0.72; ico(scen.get(r.x, r.z), r.x + Math.cos(a) * d, y + 0.55, r.z + Math.sin(a) * d, 0.55, 0.7, vary([0.24, 0.38, 0.14], RI, 0.2), RI, 0.3); } }
        else if (r.isl !== 'lawn') for (let k = 0; k < 7; k++) { const a = RI() * TAU, d = ap * (0.35 + RI() * 0.45); ico(scen.get(r.x, r.z), r.x + Math.cos(a) * d, y + 0.75, r.z + Math.sin(a) * d, 0.6 + RI() * 0.5, 0.75, vary([0.24, 0.38, 0.14], RI, 0.2), RI, 0.3); }
        API.ROCK_SMOOTH = false;
        exclPush(r.x, r.z, ap + 1); }
      addM(gp, pMat);
      if (BAR) {   // def.barrier: the ring one piece from the island's apron out past its zone's circle (the barrier), at the cars' own heights (Track.yAt), its edge lines; its road asphalt, round it the zone's real surfaces (def.roSurf: the run-off's material, the ring's region of the atlas; without them all asphalt)
        const gd = new RB(true), gdR = new RB(true), aRoR = [], gm = winGB(new GB()), aR = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }), QR = {}, WHr = [0.95, 0.95, 0.92];
        for (const r of M.rings) { const TR = T.rings.find(R => Math.hypot(R.x - r.x, R.z - r.z) < 0.5); if (!TR || !(TR.zr > 0)) continue;
          const rk = RM ? RM.rings.findIndex(g => Math.hypot(g.x - r.x, g.z - r.z) < 0.5) : -1;   // (its region of the atlas)
          const hint = T.nearestIdx(r.x + r.r, r.z), n = Math.max(64, Math.round(TAU * TR.zr / 1.2)), rad = [];   // (outside in: the rows run left to right; ~1.2 m apart both ways, the surface curves where the legs climb)
          { const out0 = TR.zr + 0.35, a1 = r.r + r.hw, k1 = Math.max(1, Math.ceil((out0 - a1) / 1.2)); for (let k = 0; k < k1; k++) rad.push(out0 - (out0 - a1) * k / k1);
            const a2 = r.ri + 0.05, k2 = Math.max(2, Math.ceil((a1 - a2) / 1.2)); for (let k = 0; k <= k2; k++) rad.push(a1 - (a1 - a2) * k / k2);
            if (TR.tall && rk >= 0) { const a3 = 0.35, k3 = Math.max(2, Math.ceil((a2 - a3) / 1.2)); for (let k = 1; k <= k3; k++) rad.push(a2 - (a2 - a3) * k / k3); }   // (a tall island: the zone's ground on in to its middle, the run-off's grass)
            else if (TR.tall) { const gL = scen.get(r.x, r.z), m = 40, P = (a, rr) => { const x = r.x + Math.cos(a) * rr, z = r.z + Math.sin(a) * rr; return [x, T.yAt(T.query(x, z, hint, QR)) + 0.02, z]; };   // (without def.roSurf: a lawn under it)
              for (let k = 0; k < m; k++) { const a0 = k / m * TAU, a1b = (k + 1) / m * TAU; gL.quadUp(P(a0, a2), P(a1b, a2), P(a1b, a2 * 0.5), P(a0, a2 * 0.5), [lawn, lawn, lawn, lawn]); gL.triUp(P(a0, a2 * 0.5), P(a1b, a2 * 0.5), P(0, 0), [lawn, lawn, lawn]); } } }
          const yQ = (x, z) => T.yAt(T.query(x, z, hint, QR)); let pr = -1;
          for (let k = 0; k <= n; k++) { const a = k / n * TAU, c = Math.cos(a), sn = Math.sin(a), pts = rad.map(R_ => { const x = r.x + c * R_, z = r.z + sn * R_; return [x, yQ(x, z) + 0.02, z]; });
            if (rk >= 0) {   // (def.roSurf: the grass's colour the terrain's, the atlas's uv, the asphalt's shade: the ring's road a little darker)
              const row = gdR.row(pts, pts.map(p => mvGCol(p[0], p[2])), pts.map(p => [p[0] / 8, p[2] / 8]));
              pts.forEach((p, j) => { const uv = T.roRingUV(rk, p[0], p[2]); aRoR.push(uv[0], uv[1], rad[j] <= r.r + r.hw + 0.01 ? 0.83 : 0.9); });
              if (pr >= 0) gdR.link(pr, row, 0, rad.length - 1); pr = row; continue; }
            const row = gd.row(pts, rad.map(R_ => R_ <= r.r + r.hw + 0.01 ? [0.83, 0.82, 0.84] : [0.9, 0.895, 0.91]), pts.map(p => [p[0] / 8, p[2] / 8]));
            if (pr >= 0) gd.link(pr, row, 0, rad.length - 1); pr = row; }
          for (const R_ of [r.r + r.hw - 0.22, r.r - r.hw + 0.18]) for (let k = 0; k < n; k++) { const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, P = (a, rr) => { const x = r.x + Math.cos(a) * rr, z = r.z + Math.sin(a) * rr; return [x, yQ(x, z) + 0.045, z]; };
            gm.quadUp(P(a0, R_ - 0.06), P(a0, R_ + 0.06), P(a1, R_ + 0.06), P(a1, R_ - 0.06), [WHr, WHr, WHr, WHr]); }
        }
        addM(gd, aR); const md = addM(gdR, roMatR); if (md) md.geometry.setAttribute('aRo', new THREE.Float32BufferAttribute(aRoR, 3));
        addM(gm, lMat);
      } else { const ga = new GB(true), aR = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }), sh = [0.83, 0.82, 0.84];
        for (const r of M.rings) { const n = 48, r0 = r.r - r.hw, r1 = r.r + r.hw, at = (a, rad) => [r.x + Math.cos(a) * rad, lerp(r.y, r.yAt(a), clamp(rad / r.ri, 0, 1)) - 0.03, r.z + Math.sin(a) * rad];
          for (let k = 0; k < n; k++) { const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, P = [at(a0, r0), at(a0, r1), at(a1, r1), at(a1, r0)];
            ga.quadUp(P[0], P[1], P[2], P[3], [sh, sh, sh, sh], P.map(p => [p[0] / 8, p[2] / 8])); } }
        addM(ga, aR); }
      out.rings = M.rings.map(r => ({ x: r.x, z: r.z, r: r.r, y: r.y }));
    }

    /* ---- the bridge over the Sava: the deck's underside, round piers in pairs under a cap every ~36 m down to the ground or the river's bed,
       the abutments at both ends; on the deck a concrete edge beam with a steel railing on it ---- */
    {
      const conc = [0.68, 0.67, 0.64], concD = [0.56, 0.55, 0.52], rail = [0.62, 0.64, 0.66];
      for (const [a, b] of def.bridges || []) {
        const i0 = T.idx(sStart + a), i1 = T.idx(sStart + b);
        for (let i = i0; i < i1; i++) { const g = scen.get(T.px[i], T.pz[i]), j = i + 1, oi = [-(T.bl[i] + 0.62), T.br[i] + 0.62], oj = [-(T.bl[j] + 0.62), T.br[j] + 0.62];
          g.quadO(Pt(i, oi[0], -1.6), Pt(j, oj[0], -1.6), Pt(j, oj[1], -1.6), Pt(i, oi[1], -1.6), concD, Pt(i, 0, 0));   // (the underside)
          for (const side of [-1, 1]) { const bi = (side > 0 ? T.br[i] : T.bl[i]) + 0.1, bj = (side > 0 ? T.br[j] : T.bl[j]) + 0.1;   // the edge beam and the railing
            g.quadO(Pt(i, side * bi, 0.1), Pt(j, side * bj, 0.1), Pt(j, side * bj, 0.55), Pt(i, side * bi, 0.55), conc, Pt(i, side * (bi + 3), 0.3));
            g.quadUp(Pt(i, side * bi, 0.55), Pt(i, side * (bi + 0.5), 0.55), Pt(j, side * (bj + 0.5), 0.55), Pt(j, side * bj, 0.55), [conc, conc, conc, conc]);
            for (const [h0, h1] of [[1.0, 1.1], [0.75, 0.8]]) { const o0 = side * (bi + 0.25); g.quadO(Pt(i, o0, h0), Pt(j, side * (bj + 0.25), h0), Pt(j, side * (bj + 0.25), h1), Pt(i, o0, h1), rail, Pt(i, 0, h0)); g.quadO(Pt(i, o0, h0), Pt(j, side * (bj + 0.25), h0), Pt(j, side * (bj + 0.25), h1), Pt(i, o0, h1), rail, Pt(i, side * 9, h0)); }
            if (i % 1 === 0) { const p = Pt(i, side * (bi + 0.25), 0.55); box(g, p[0], p[1], p[2], 0.08, 0.55, 0.08, T.hd[i], rail, null, true); } } }
        for (let d = a + 22; d < b - 14; d += 36) { const s = sStart + d, i = T.idx(s), g = scen.get(T.px[i], T.pz[i]), y = T.hy[i] - 1.6, hd = T.hd[i], wi = WA[i];
          const [cx, cz] = atS(s, 0); box(g, cx, y - 1.1, cz, 1.8, 1.1, 2 * wi + 2.2, hd, conc);
          for (const o of [-wi * 0.5, wi * 0.5]) { const x = cx + T.nx[i] * o, z = cz + T.nz[i] * o, gy = mvGround(x, z) - 1.5; cyl(g, x, gy, z, 0.85, y - 1.05 - gy, 10, conc, conc); exclPush(x, z, 3); } }
        for (const [s, dir] of [[sStart + a, -1], [sStart + b, 1]]) { const i = T.idx(s), g = scen.get(T.px[i], T.pz[i]), y = T.hy[i], [cx, cz] = atS(s, 0), gy = mvGround(cx + T.tx[i] * dir * 2, cz + T.tz[i] * dir * 2);   // the abutments
          box(g, cx - T.tx[i] * dir * 0.8, Math.min(gy, y - 3) - 1, cz - T.tz[i] * dir * 0.8, 2.4, y - 1.5 - Math.min(gy, y - 3) + 1, 2 * WA[i] + 3, T.hd[i], concD); }
      }
    }

    /* ---- the overpass: Gorenjska cesta over the road on its bridge (def.overpass: its centre line [x, z, height, ...], width, the deck's span
       along it, the road under it [from, to]): the carriageway between two raised sidewalks, its approaches between low walls on their
       embankments down to the ground, over the road the slab with a parapet and a railing, the abutments beside the road under it (all of it
       fading over the car, as the buildings do) ---- */
    for (const O of def.overpass || []) {
      const L = []; for (let k = 0; k + 2 < O.P.length; k += 3) L.push([O.P[k], O.P[k + 1], O.P[k + 2]]);
      const n = L.length; if (n < 2) continue;
      const nrm = L.map((p, k) => { const a = L[Math.max(0, k - 1)], b = L[Math.min(n - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
      let cum = 0; const tt = L.map((p, k) => (k ? (cum += Math.hypot(p[0] - L[k - 1][0], p[1] - L[k - 1][1])) : 0));
      const hw = O.w / 2, cw = hw - 1.6, ga = new RB(true), gc = new GB(), conc = [0.7, 0.69, 0.66], concD = [0.55, 0.54, 0.51], walk = [0.8, 0.79, 0.76], rail = [0.62, 0.64, 0.66];
      const at = (k, o, dy) => [L[k][0] + nrm[k][0] * o, L[k][2] + (dy || 0), L[k][1] + nrm[k][1] * o];
      const onDeck = (k) => tt[k] >= O.deck[0] - 0.01 && tt[k] <= O.deck[1] + 0.01;
      let pr = -1;
      for (let k = 0; k < n; k++) { const os = [-cw, 0, cw], sh = 0.84, r = ga.row(os.map(o => at(k, o, 0.03)), os.map(() => [sh, sh, sh * 1.01]), os.map(o => [(o + cw) / 8, tt[k] / 8]));
        if (pr >= 0) ga.link(pr, r, 0, 2); pr = r; exclPush(L[k][0], L[k][1], hw + 1.5); }
      for (let k = 0; k + 1 < n; k++) { const j = k + 1, deck = onDeck(k) && onDeck(j), C = at(k, 0, 0);
        for (const sd of [-1, 1]) {
          gc.quadUp(at(k, sd * cw, 0.18), at(k, sd * hw, 0.18), at(j, sd * hw, 0.18), at(j, sd * cw, 0.18), [walk, walk, walk, walk]);   // the sidewalk
          gc.quadO(at(k, sd * cw, 0.03), at(j, sd * cw, 0.03), at(j, sd * cw, 0.18), at(k, sd * cw, 0.18), conc, at(k, sd * hw, 0.1));   // (its kerb)
          if (deck) {   // the slab's edge, the parapet, its railing
            gc.quadO(at(k, sd * hw, -1.2), at(j, sd * hw, -1.2), at(j, sd * hw, 0.95), at(k, sd * hw, 0.95), conc, C);
            gc.quadO(at(k, sd * (hw - 0.25), 0.18), at(j, sd * (hw - 0.25), 0.18), at(j, sd * (hw - 0.25), 0.95), at(k, sd * (hw - 0.25), 0.95), conc, at(k, sd * hw, 0.5));
            gc.quadUp(at(k, sd * (hw - 0.25), 0.95), at(k, sd * hw, 0.95), at(j, sd * hw, 0.95), at(j, sd * (hw - 0.25), 0.95), [conc, conc, conc, conc]);
            for (const f of [C, at(k, sd * (hw + 3), 1.2)]) gc.quadO(at(k, sd * (hw - 0.12), 1.12), at(j, sd * (hw - 0.12), 1.12), at(j, sd * (hw - 0.12), 1.2), at(k, sd * (hw - 0.12), 1.2), rail, f);
          } else {   // the approaches: a low wall on the embankment's edge, down to the ground
            const pk = at(k, sd * hw), pj = at(j, sd * hw), yk = Math.min(L[k][2] - 0.4, mvGround(pk[0], pk[2]) - 0.3), yj = Math.min(L[j][2] - 0.4, mvGround(pj[0], pj[2]) - 0.3);
            gc.quadO([pk[0], yk, pk[2]], [pj[0], yj, pj[2]], at(j, sd * hw, 0.6), at(k, sd * hw, 0.6), conc, C);
            gc.quadO(at(k, sd * (hw - 0.25), 0.18), at(j, sd * (hw - 0.25), 0.18), at(j, sd * (hw - 0.25), 0.6), at(k, sd * (hw - 0.25), 0.6), conc, at(k, sd * hw, 0.4));
            gc.quadUp(at(k, sd * (hw - 0.25), 0.6), at(k, sd * hw, 0.6), at(j, sd * hw, 0.6), at(j, sd * (hw - 0.25), 0.6), [conc, conc, conc, conc]);
          }
        }
        if (deck) gc.quadO(at(k, -hw, -1.2), at(j, -hw, -1.2), at(j, hw, -1.2), at(k, hw, -1.2), concD, C);   // (the slab's underside)
      }
      { const i0 = T.idx(sStart + O.d[0]), i1 = T.idx(sStart + O.d[1]), ks = L.map((p, k) => k).filter(onDeck), yd = ks.length ? L[ks[0]][2] - 1.2 : T.hy[i0] + 4;   // the abutments
        for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0;
          for (let i = i0; i < i1; i++) { const j = i + 1, oi = side * (wE(si, i) + 0.4), oj = side * (wE(si, j) + 0.4);
            gc.quadO(Pt(i, oi, -0.3), Pt(j, oj, -0.3), [T.px[j] + T.nx[j] * oj, yd, T.pz[j] + T.nz[j] * oj], [T.px[i] + T.nx[i] * oi, yd, T.pz[i] + T.nz[i] * oi], concD, Pt(i, 0, 0.5)); } } }
      const cA = hjCutMat(new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }), cut), cC = hjCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
      addM(ga, cA, true); addM(gc, cC, true);
    }

    /* ---- the buildings: houses with tiled hipped and gabled roofs, blocks of flats, halls, schools and the fire stations, sheds, the churches with
       their spires, the castle's ruins, a transformer tower (the facades on Harju's atlas, the roofs on its tile rows; they fade where they hide the
       car or the road just ahead of it on the screen: hjCutMat) ---- */
    let nBld = 0;
    {
      const fac = new Chunks(240, true), grpB = new THREE.Group(); root.add(grpB);
      for (const b of blds) {
        let lo = 1e9, hi = -1e9; for (const [px, pz] of b.pts.concat([[b.x, b.z]])) { const y = mvGround(px, pz); lo = Math.min(lo, y); hi = Math.max(hi, y); }
        const Rb = rng((Math.round(b.x * 7) * 7919) ^ Math.round(b.z * 13));
        if (b.kind === 2) mvChurch(scen.get(b.x, b.z), b, lo, hi);
        else if (b.kind === 6) out.castle = mvCastle(grpB, b, Rb, cut, ownTex);
        else if (b.kind === 8) { const g = scen.get(b.x, b.z), br = [0.62, 0.36, 0.26]; box(g, b.x, lo - 0.5, b.z, 3.2, hi - lo + 8.5, 3.2, b.ang, br, null, true); cone(g, b.x, hi + 8, b.z, 2.6, 2.2, 4, [0.36, 0.28, 0.24], [0.36, 0.28, 0.24], b.ang + PI / 4); }
        else mvBuilding(fac.get(b.x, b.z), b, lo, hi, Rb);
        exclPush(b.x, b.z, Math.min(Math.hypot(b.L, b.W) / 2 + 1, 9)); CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang);
        nBld++;
      }
      fac.addTo(grpB, hjCutMat(new THREE.MeshLambertMaterial({ map: mvFacadeTex(), vertexColors: true }), cut), true, true);
    }

    /* ---- the town's streets, paths and tracks (def.roads, def.paths): ribbons on the ground, cut back where they reach the route or a side road;
       the bridges on them level from bank to bank ---- */
    {
      const SA = new Chunks(300, true), SG = new Chunks(300, true), aS = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const sS = new THREE.MeshLambertMaterial({ map: tex.makadam, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      // (p10: a ribbon's piece that reaches into a window cut along its border: its triangles split to 30 cm there (and where a window's corner lies in one), the
      // border found by halving on the edges that cross it; the user's road goes on. a, b, c: [x, z, u, v])
      const wMid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2, (p[3] + q[3]) / 2];
      const wInT = (a, b, c, x, z) => { const s1 = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]), s2 = (c[0] - b[0]) * (z - b[1]) - (c[1] - b[1]) * (x - b[0]), s3 = (a[0] - c[0]) * (z - c[1]) - (a[1] - c[1]) * (x - c[0]); return (s1 > 0 && s2 > 0 && s3 > 0) || (s1 < 0 && s2 < 0 && s3 < 0); };
      const wCut = (p, q) => { let lo = p, hi = q; for (let it = 0; it < 10; it++) { const m = wMid(lo, hi); if (inWin(m[0], m[1])) hi = m; else lo = m; } return lo; };   // (p outside, q inside: the border between them)
      const wClip = (a, b, c, emit, lv) => { const ia = inWin(a[0], a[1]) ? 1 : 0, ib = inWin(b[0], b[1]) ? 1 : 0, ic = inWin(c[0], c[1]) ? 1 : 0, nIn = ia + ib + ic; if (nIn === 3) return;
        const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]), ca = Math.hypot(a[0] - c[0], a[1] - c[1]), m = Math.max(ab, bc, ca);
        const corner = !nIn && WINS.some(W => W.q.some(([x, z]) => wInT(a, b, c, x, z)));
        if (!nIn && !corner) { emit(a, b, c); return; }
        if (lv < 8 && m > 0.3) { if (m === ab) { const e = wMid(a, b); wClip(a, e, c, emit, lv + 1); wClip(e, b, c, emit, lv + 1); } else if (m === bc) { const e = wMid(b, c); wClip(a, b, e, emit, lv + 1); wClip(a, e, c, emit, lv + 1); } else { const e = wMid(c, a); wClip(a, b, e, emit, lv + 1); wClip(e, b, c, emit, lv + 1); } return; }
        if (!nIn) { emit(a, b, c); return; }
        if (nIn === 1) { const [p, q, r] = ic ? [a, b, c] : ia ? [b, c, a] : [c, a, b]; const u = wCut(q, r), v = wCut(p, r); emit(p, q, u); emit(p, u, v); }   // (r in the window)
        else { const [p, q, r] = !ia ? [a, b, c] : !ib ? [b, c, a] : [c, a, b]; emit(p, wCut(p, q), wCut(p, r)); } };   // (p outside it)
      const dense = (p, st) => { const o = []; for (let k = 0; k + 3 < p.length; k += 2) { const ax = p[k], az = p[k + 1], bx = p[k + 2], bz = p[k + 3], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / st)); for (let t = 0; t < m; t++) o.push([lerp(ax, bx, t / m), lerp(az, bz, t / m)]); } o.push([p[p.length - 2], p[p.length - 1]]); return o; };
      for (const l of lines) { if (l.br === 2) continue;
        const nearW = WINS.length && (() => { for (let k = 0; k + 1 < l.pts.length; k += 2) for (const W of WINS) if (l.pts[k] > W.x0 - 6 && l.pts[k] < W.x1 + 6 && l.pts[k + 1] > W.z0 - 6 && l.pts[k + 1] < W.z1 + 6) return true; return false; })();
        const segW = (k) => WINS.some(W => Math.max(l.pts[k], l.pts[k + 2]) > W.x0 - 6 && Math.min(l.pts[k], l.pts[k + 2]) < W.x1 + 6 && Math.max(l.pts[k + 1], l.pts[k + 3]) > W.z0 - 6 && Math.min(l.pts[k + 1], l.pts[k + 3]) < W.z1 + 6);
        const hw = l.w / 2, D = nearW ? (() => { const o = []; for (let k = 0; k + 3 < l.pts.length; k += 2) { const ax = l.pts[k], az = l.pts[k + 1], bx = l.pts[k + 2], bz = l.pts[k + 3], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / (segW(k) ? 1 : 3))); for (let t = 0; t < m; t++) o.push([lerp(ax, bx, t / m), lerp(az, bz, t / m)]); } o.push([l.pts[l.pts.length - 2], l.pts[l.pts.length - 1]]); return o; })() : dense(l.pts, 3); let n = D.length;   // (p10: 1 m steps near a window only) if (n < 2 || vrDist(D[0][0], D[0][1]) > 460 && vrDist(D[n - 1][0], D[n - 1][1]) > 460) continue;
        const keep = D.map(([x, z]) => !onRoad(x, z, Math.min(hw, 1.5)) && !(nearW && inWin(x, z)));
        if (!l.br) {   // (r5: a street that meets a side road ends right at its edge, not at its last 3 m step short of it: the edge found along its own line, up to 6 m on; never on to the route, behind its fence)
          const onStubE = (x, z) => { const q = T.query(x, z, T.nearestIdx(x, z), Q); if (q.k < 0) return false; const S = T.stubs[q.k]; return q.st <= (S.end === 2 ? S.L + 0.5 : S.Lend) && Math.abs(q.u) <= (q.st < S.te ? T.stubHw(S, q.st) : S.hw) + 0.05; };
          const edge = (k, j, back) => { const ax = D[k][0], az = D[k][1], dx = (D[j][0] - ax) * (back ? -1 : 1), dz = (D[j][1] - az) * (back ? -1 : 1), L = Math.hypot(dx, dz) || 1; let lo = 0, hi = -1;   // (back: beyond k, away from j: the street's own ends)
            for (let t = 0.5; t <= 6; t += 0.5) if (onStubE(ax + dx / L * t, az + dz / L * t)) { hi = t; break; }
            if (hi < 0) return null; for (let it = 0; it < 6; it++) { const m = (lo + hi) / 2; if (onStubE(ax + dx / L * m, az + dz / L * m)) hi = m; else lo = m; } return [ax + dx / L * lo, az + dz / L * lo]; };
          const D2 = [], K2 = [], inW2 = (p) => nearW && inWin(p[0], p[1]);
          const wB = (k, j) => { let a = D[k], b = D[j]; for (let it = 0; it < 12; it++) { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if (inWin(m[0], m[1])) b = m; else a = m; } return a; };   // (p10: a window's border between a kept point and one in it: the street ends on it, the user's road goes on)
          const wBx = (k, j) => { const a = wB(k, j), dx = D[j][0] - D[k][0], dz = D[j][1] - D[k][1], L = Math.hypot(dx, dz) || 1; return [a[0] + dx / L * 2 * hw, a[1] + dz / L * 2 * hw]; };   // (on past the border by the street's width: its piece in the window cut off along the border below, its other half reaching it too)
          const ext = (k, j, back) => { if (!back && inW2(D[j])) return wBx(k, j); const e = edge(k, j, back); return e && !inW2(e) ? e : null; };
          for (let k = 0; k < n; k++) { if (keep[k] && k > 0 && !keep[k - 1]) { const e = ext(k, k - 1); if (e) { D2.push(e); K2.push(true); } }
            if (k === 0 && keep[0]) { const e = ext(0, 1, true); if (e) { D2.push(e); K2.push(true); } }
            D2.push(D[k]); K2.push(keep[k]);
            if (keep[k] && k + 1 < n && !keep[k + 1]) { const e = ext(k, k + 1); if (e) { D2.push(e); K2.push(true); } }
            if (k === n - 1 && keep[k]) { const e = ext(k, k - 1, true); if (e) { D2.push(e); K2.push(true); } } }
          D.length = 0; D.push(...D2); keep.length = 0; keep.push(...K2); n = D.length;
        }
        const yb = l.br === 1 ? [mvGround(D[0][0], D[0][1]) + 0.2, mvGround(D[n - 1][0], D[n - 1][1]) + 0.2] : null;
        const nrm = D.map((p, k) => { const a = D[Math.max(0, k - 1)], b = D[Math.min(n - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], ll = Math.hypot(dx, dz) || 1; return [-dz / ll, dx / ll]; });
        let cum = 0; const vv = D.map((p, k) => (k ? (cum += Math.hypot(p[0] - D[k - 1][0], p[1] - D[k - 1][1])) : 0));
        const C = l.grav ? SG : SA, col = l.grav ? (l.path ? [0.78, 0.72, 0.6] : [0.8, 0.86, 0.94]) : l.path ? [0.92, 0.9, 0.88] : [0.84, 0.84, 0.86];   // (gravel roads grey-beige as the castle road, the dirt paths browner)
        const at = (k, o) => { const x = D[k][0] + nrm[k][0] * o, z = D[k][1] + nrm[k][1] * o; return [x, yb ? lerp(yb[0], yb[1], k / (n - 1)) : mvGround(x, z) + (l.path ? 0.05 : 0.07), z]; };
        for (let k = 0; k + 1 < n; k++) { if (!keep[k] || !keep[k + 1]) continue; const g = C.get(D[k][0], D[k][1]), sh = 0.95 + 0.1 * rpHash(Math.round(vv[k] / 20), 3), c = [col[0] * sh, col[1] * sh, col[2] * sh];
          for (const [o0, o1] of [[-hw, 0], [0, hw]]) {
            const Q4 = nearW && !yb ? [[k, o0], [k, o1], [k + 1, o1], [k + 1, o0]].map(([kk, o]) => [D[kk][0] + nrm[kk][0] * o, D[kk][1] + nrm[kk][1] * o, (o + hw) / 6, vv[kk] / 6]) : null;
            if (Q4 && WINS.some(W => Q4.some(q => q[0] > W.x0 - 0.1 && q[0] < W.x1 + 0.1 && q[1] > W.z0 - 0.1 && q[1] < W.z1 + 0.1))) {   // (p10: near a window: cut along its border)
              const y = (q) => [q[0], mvGround(q[0], q[1]) + (l.path ? 0.05 : 0.07), q[1]], emit = (p, q, r) => g.triUp(y(p), y(q), y(r), [c, c, c], [[p[2], p[3]], [q[2], q[3]], [r[2], r[3]]]);
              wClip(Q4[0], Q4[1], Q4[2], emit, 0); wClip(Q4[0], Q4[2], Q4[3], emit, 0); continue; }
            g.quadUp(at(k, o0), at(k, o1), at(k + 1, o1), at(k + 1, o0), [c, c, c, c], [[(o0 + hw) / 6, vv[k] / 6], [(o1 + hw) / 6, vv[k] / 6], [(o1 + hw) / 6, vv[k + 1] / 6], [(o0 + hw) / 6, vv[k + 1] / 6]]); }
          if (yb) { const gs = scen.get(D[k][0], D[k][1]), cc = [0.66, 0.65, 0.62]; for (const sd of [-1, 1]) { const a = at(k, sd * hw), b = at(k + 1, sd * hw); gs.quadO([a[0], a[1] - 1.2, a[2]], [b[0], b[1] - 1.2, b[2]], [b[0], b[1] + 0.9, b[2]], [a[0], a[1] + 0.9, a[2]], cc, [D[k][0], a[1], D[k][1]]); } } }
      }
      for (const Pp of def.parking || []) {   // the car parks (OSM): asphalt a few cm over the ground (its triangles split to 4 m to follow it), clear of the road; no trees on them
        const pts = []; for (let k = 0; k + 1 < Pp.length; k += 2) pts.push([Pp[k], Pp[k + 1]]);
        if (pts.length < 3 || vrDist(pts[0][0], pts[0][1]) > 460) continue;
        occPoly(pts, 1);
        const col = [0.8, 0.8, 0.82], P3 = (p) => [p[0], mvGround(p[0], p[1]) + 0.12, p[1]], uv = (p) => [p[0] / 6, -p[1] / 6];
        const put = (a, b, c, lv) => { const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]), ca = Math.hypot(a[0] - c[0], a[1] - c[1]), m = Math.max(ab, bc, ca);
          const offP = (p) => onRoad(p[0], p[1], 0.3) || inWin(p[0], p[1]), nOn = m > 1.2 && lv < 10 ? (offP(a) ? 1 : 0) + (offP(b) ? 1 : 0) + (offP(c) ? 1 : 0) : 0;
          if (nOn === 3 && m < 6) return;   // (under the road)
          if ((m > 4 || (nOn > 0 && nOn < 3)) && lv < 10) { const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];   // (finer along the road's edge)
            if (m === ab) { const e = mid(a, b); put(a, e, c, lv + 1); put(e, b, c, lv + 1); } else if (m === bc) { const e = mid(b, c); put(a, b, e, lv + 1); put(a, e, c, lv + 1); } else { const e = mid(c, a); put(a, b, e, lv + 1); put(e, b, c, lv + 1); }
            return; }
          const cx = (a[0] + b[0] + c[0]) / 3, cz = (a[1] + b[1] + c[1]) / 3; if (onRoad(cx, cz, 0.3) || inWin(cx, cz)) return;
          const A = P3(a), B = P3(b), C = P3(c); SA.get(cx, cz).triO(A, B, C, col, [cx, (A[1] + B[1] + C[1]) / 3 - 5, cz], col, col, uv(a), uv(b), uv(c)); };
        for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p[0], p[1])), [])) put(pts[i], pts[j], pts[k], 0);
      }
      SA.addTo(root, aS, false, true); SG.addTo(root, sS, false, true);
    }

    /* ---- p10: the user's road in their windows (def.mvPaved: asphalt polygons, the islands holes in them) past the cars' free ground (inside it the run-off's
       surfaces are theirs), on the terrain as the streets are (its triangles split to 3 m to follow it, finer along the free ground's edge); their sidewalks
       (def.walkLines: 1.5 m strips, re their edge on the road's side, ge on the grass's): granite setts behind a kerb (its face up from the road, its light top
       20 cm wide), a dark edging 10 cm wide on the grass's side, on the ground they lie on; no trees on either ---- */
    if (WINS.length) {
      const PA = new Chunks(260, true), aW = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3 });   // (over a street's ribbon where it reaches into a window)
      const pc = [0.85, 0.85, 0.87], hPv = (x, z) => wY(x, z, 0, 0.07), uvA = (P) => [P[0] / 8, -P[2] / 8]; let nPv = 0;   // (on the terrain as the streets are; at the free ground's edge up to the run-off's)
      const put = (a, b, c, lv) => { const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]), ca = Math.hypot(a[0] - c[0], a[1] - c[1]), m = Math.max(ab, bc, ca);
        const nOn = m > 0.6 && lv < 14 ? (wCov(a[0], a[1]) ? 1 : 0) + (wCov(b[0], b[1]) ? 1 : 0) + (wCov(c[0], c[1]) ? 1 : 0) : 0;
        if (nOn === 3 && m < 4) return;   // (in the free ground: the run-off's surfaces)
        if ((m > 3 || (nOn > 0 && nOn < 3)) && lv < 14) { const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
          if (m === ab) { const e = mid(a, b); put(a, e, c, lv + 1); put(e, b, c, lv + 1); } else if (m === bc) { const e = mid(b, c); put(a, b, e, lv + 1); put(a, e, c, lv + 1); } else { const e = mid(c, a); put(a, b, e, lv + 1); put(e, b, c, lv + 1); }
          return; }
        const cx = (a[0] + b[0] + c[0]) / 3, cz = (a[1] + b[1] + c[1]) / 3; if (wCov(cx, cz)) return;
        const sh = 0.96 + 0.06 * rpHash(Math.floor(cx / 23), Math.floor(cz / 23)); wTri(PA.get(cx, cz), a, b, c, hPv, [pc[0] * sh, pc[1] * sh, pc[2] * sh], uvA); nPv++; };
      const pairs = (L) => { const q = []; for (let k = 0; k + 1 < L.length; k += 2) q.push([L[k], L[k + 1]]); if (q.length > 1 && q[0][0] === q[q.length - 1][0] && q[0][1] === q[q.length - 1][1]) q.pop(); return q; };
      for (const F of def.mvPaved || []) { const outer = pairs(F.p), holes = (F.h || []).map(pairs).filter(h => h.length >= 3); if (outer.length < 3) continue;
        occPoly(outer, 1); const all = outer.concat(...holes);
        for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(outer.map(p => new THREE.Vector2(p[0], p[1])), holes.map(h => h.map(p => new THREE.Vector2(p[0], p[1]))))) put(all[i], all[j], all[k], 0); }
      PA.addTo(root, aW, false, true);
      const GS = new Chunks(260, true), GK = new Chunks(260), sMatW = new THREE.MeshLambertMaterial({ map: mvSettsTex(), vertexColors: true }), QK = [0.86, 0.85, 0.82], QE = [0.24, 0.24, 0.25], KCf = [0.8, 0.79, 0.76];
      const hTop = (x, z) => wY(x, z, 0.05, 0.12), wTop = (p) => [p[0], hTop(p[0], p[1]), p[1]], wFoot = (p) => [p[0], wY(p[0], p[1], 0, 0.07), p[1]], uvS = (P) => [P[0] / 1.6, -P[2] / 1.6];
      const crs = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      for (const L of def.walkLines || []) { const RE = pairs(L.re), GE = pairs(L.ge), n = Math.min(RE.length, GE.length); if (n < 2) continue;
        occPoly(RE.slice(0, n).concat(GE.slice(0, n).reverse()), 1);
        const at = (k, t) => [lerp(RE[k][0], GE[k][0], t), lerp(RE[k][1], GE[k][1], t)];
        for (let k = 0; k + 1 < n; k++) { const wk = Math.hypot(GE[k][0] - RE[k][0], GE[k][1] - RE[k][1]) || 1.5, tK = Math.min(0.3, 0.2 / wk), tE = Math.max(0.7, 1 - 0.1 / wk);
          if (crs(RE[k], RE[k + 1], GE[k + 1]) * crs(RE[k], GE[k + 1], GE[k]) <= 0) continue;   // (a twisted piece (the ends of a traced strip): left out)
          const a2 = [0, tK, tE, 1].map(t => at(k, t)), b2 = [0, tK, tE, 1].map(t => at(k + 1, t)), A = a2.map(wTop), B = b2.map(wTop), cx = (A[0][0] + B[3][0]) / 2, cz = (A[0][2] + B[3][2]) / 2, gk = GK.get(cx, cz);
          const sh = 0.6 * (0.97 + 0.06 * rpHash(k >> 3, 61)), sc = [sh, sh, sh * 1.02];
          wQuad(gk, a2[0], a2[1], b2[1], b2[0], hTop, QK);   // (the kerb's light top)
          wQuad(GS.get(cx, cz), a2[1], a2[2], b2[2], b2[1], hTop, sc, uvS);   // (the setts)
          wQuad(gk, a2[2], a2[3], b2[3], b2[2], hTop, QE);   // (the dark edging)
          const F0 = wFoot(at(k, 0)), F1 = wFoot(at(k + 1, 0)); if (A[0][1] - F0[1] > 0.01 || B[0][1] - F1[1] > 0.01) gk.quadO(F0, F1, B[0], A[0], KCf, [(A[2][0] + B[2][0]) / 2, A[2][1] - 1, (A[2][2] + B[2][2]) / 2]); } }   // (its face up from the road)
      GS.addTo(root, sMatW, false, true); GK.addTo(root, matV, false, true);
      out.win = { n: WINS.length, paved: nPv, walks: (def.walkLines || []).length, paint: (def.paint || []).length };
    }

    /* ---- the railway (Ljubljana - Jesenice through Medvode): the ballast's bank, the two rails, a mast for the overhead line every 60 m ---- */
    {
      const gB = new Chunks(400, true), gR = scen, bal = [0.62, 0.58, 0.54], steelR = [0.36, 0.34, 0.33], slp = [0.36, 0.32, 0.28];
      for (const L of M.rails) { const n = L.length; let cum = 0;
        const nrm = L.map((p, k) => { const a = L[Math.max(0, k - 1)], b = L[Math.min(n - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], ll = Math.hypot(dx, dz) || 1; return [-dz / ll, dx / ll]; });
        const at = (k, o, dy) => [L[k][0] + nrm[k][0] * o, L[k][2] + dy, L[k][1] + nrm[k][1] * o];
        for (let k = 0; k + 1 < n; k++) { const c0 = cum; cum += Math.hypot(L[k + 1][0] - L[k][0], L[k + 1][1] - L[k][1]); if (vrDist(L[k][0], L[k][1]) > 440) continue;
          const g = gB.get(L[k][0], L[k][1]), prof = [[-2.6, -1.05], [-1.6, -0.22], [1.6, -0.22], [2.6, -1.05]];
          for (let m = 0; m < 3; m++) { const [oa, ya] = prof[m], [ob, yb] = prof[m + 1], c = m === 1 ? slp : bal; g.quadUp(at(k, oa, ya), at(k, ob, yb), at(k + 1, ob, yb), at(k + 1, oa, ya), [c, c, c, c], [[oa / 3, c0 / 3], [ob / 3, c0 / 3], [ob / 3, cum / 3], [oa / 3, cum / 3]]); }
          const gr = gR.get(L[k][0], L[k][1]); for (const o of [-0.75, 0.75]) { gr.quadUp(at(k, o - 0.04, 0), at(k, o + 0.04, 0), at(k + 1, o + 0.04, 0), at(k + 1, o - 0.04, 0), [[0.7, 0.7, 0.72], [0.7, 0.7, 0.72], [0.7, 0.7, 0.72], [0.7, 0.7, 0.72]]);
            gr.quadO(at(k, o, -0.16), at(k + 1, o, -0.16), at(k + 1, o, 0), at(k, o, 0), steelR, at(k, o * 3, -0.1)); }
          if (Math.floor(cum / 60) !== Math.floor(c0 / 60)) { const p = at(k, 3.0, 0); cyl(gr, p[0], p[1] - 1.2, p[2], 0.13, 8.2, 6, [0.5, 0.52, 0.5]); const q = at(k, 1.2, 6.4); box(gr, q[0], q[1], q[2], 0.1, 0.12, 3.6, Math.atan2(nrm[k][1], nrm[k][0]), [0.45, 0.47, 0.46]); }
        }
      }
      gB.addTo(root, sMat, false, true);
    }

    /* ---- the power lines (def.power: their pylons): steel lattice towers (a tapered shaft, two crossarms), the conductors sagging between them ---- */
    {
      const g = scen, steelP = [0.55, 0.57, 0.58], wire = [0.2, 0.2, 0.21];
      for (const [, p] of def.power || []) { const pts = []; for (let k = 0; k + 1 < p.length; k += 2) pts.push([p[k], p[k + 1]]);
        const ok = pts.map(([x, z]) => vrDist(x, z) < 460), H = 26, tops = [];
        pts.forEach(([x, z], k) => { if (!ok[k]) { tops.push(null); return; }
          const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], rot = Math.atan2(b[1] - a[1], b[0] - a[0]) + PI / 2, y = mvGround(x, z), gg = g.get(x, z);
          if (mvW(x, z).e > -2) { tops.push(null); return; }
          cone(gg, x, y - 0.5, z, 2.6, H * 1.35, 4, steelP, steelP, rot + PI / 4);   // (the shaft: a slim four-sided pyramid, cut by the arms)
          box(gg, x, y + H - 6, z, 0.4, 0.4, 13, rot, steelP); box(gg, x, y + H - 1.5, z, 0.4, 0.4, 9, rot, steelP);
          const c = Math.cos(rot), s = Math.sin(rot); tops.push([[-6.2, H - 6.3], [6.2, H - 6.3], [-4.2, H - 1.8], [4.2, H - 1.8]].map(([u, h]) => [x + c * u, y + h, z + s * u]));
          exclPush(x, z, 4); occSeg(x, z, x, z, 4, 1); });
        for (let k = 0; k + 1 < pts.length; k++) { const A = tops[k], B = tops[k + 1]; if (!A || !B) continue;
          for (let m = 0; m < 3; m++) { const a = A[m], b = B[m], L = Math.hypot(b[0] - a[0], b[2] - a[2]), sag = L * L / 8 / 1600, gg = g.get(a[0], a[2]);
            for (let q = 0; q < 8; q++) { const t0 = q / 8, t1 = (q + 1) / 8, p0 = [lerp(a[0], b[0], t0), lerp(a[1], b[1], t0) - 4 * sag * t0 * (1 - t0), lerp(a[2], b[2], t0)], p1 = [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1) - 4 * sag * t1 * (1 - t1), lerp(a[2], b[2], t1)];
              gg.quadO(p0, p1, [p1[0], p1[1] + 0.07, p1[2]], [p0[0], p0[1] + 0.07, p0[2]], wire, [(p0[0] + p1[0]) / 2 + 1, p0[1], (p0[2] + p1[2]) / 2 + 1]);
              gg.quadO(p0, p1, [p1[0], p1[1] + 0.07, p1[2]], [p0[0], p0[1] + 0.07, p0[2]], wire, [(p0[0] + p1[0]) / 2 - 1, p0[1], (p0[2] + p1[2]) / 2 - 1]); } } }
      }
    }

    /* ---- hedges, garden walls, retaining walls, fences and guard rails (def.fences), not across the road or a side road ---- */
    const wallsBuilt = [];   // (def.barrier: the garden and retaining walls' stretches built, [ax, az, bx, bz, ...]: where one stands at the barrier, the rail is left out in front of it (FENCE))
    {
      const gF = scen, hedge = [0.25, 0.4, 0.15], wallC = [0.74, 0.72, 0.68], fenceC = [0.5, 0.5, 0.47], steel = [0.76, 0.78, 0.8];
      const dropF = new Set(def.dropFence || []);   // (def.dropFence: the hedges, fences and rails inside the cars' free ground, by their index in def.fences: left out)
      for (let fk = 0; fk < (def.fences || []).length; fk++) { if (dropF.has(fk)) { nDropF++; continue; } const [kind, p] = def.fences[fk];
        const D = []; for (let k = 0; k + 3 < p.length; k += 2) { const ax = p[k], az = p[k + 1], bx = p[k + 2], bz = p[k + 3], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2.5)); for (let t = 0; t < m; t++) D.push([lerp(ax, bx, t / m), lerp(az, bz, t / m)]); }
        D.push([p[p.length - 2], p[p.length - 1]]);
        const ok = D.map(([x, z]) => !onRoad(x, z, BAR ? 0.2 : 0.5) && mvW(x, z).e < -0.5 && vrDist(x, z) < 440 && !wFree.any(x, z));   // (the fence: not inside the free ground; def.barrier: a wall right behind the barrier stands, its front the barrier there)
        for (let k = 0; k + 1 < D.length; k++) { if (!ok[k] || !ok[k + 1]) continue;
          const [ax, az] = D[k], [bx, bz] = D[k + 1], ya = mvGround(ax, az), yb = mvGround(bx, bz), g = gF.get(ax, az), Le = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / Le, nz = (bx - ax) / Le;
          if (BAR && (kind === 2 || kind === 3)) wallsBuilt.push(ax, az, bx, bz);
          if (kind === 1) { const hh = 1.15, t = 0.4, c = vary(hedge, () => crH(ax, az, 9), 0.18), ct = [c[0] * 1.25, c[1] * 1.2, c[2] * 1.08];
            for (const sd of [-1, 1]) g.quadO([ax + nx * t * sd, ya - 0.1, az + nz * t * sd], [bx + nx * t * sd, yb - 0.1, bz + nz * t * sd], [bx + nx * t * sd * 0.8, yb + hh, bz + nz * t * sd * 0.8], [ax + nx * t * sd * 0.8, ya + hh, az + nz * t * sd * 0.8], c, [(ax + bx) / 2, (ya + yb) / 2 + 0.6, (az + bz) / 2]);
            g.quadUp([ax - nx * t * 0.8, ya + hh, az - nz * t * 0.8], [ax + nx * t * 0.8, ya + hh, az + nz * t * 0.8], [bx + nx * t * 0.8, yb + hh, bz + nz * t * 0.8], [bx - nx * t * 0.8, yb + hh, bz - nz * t * 0.8], [ct, ct, ct, ct]); }
          else if (kind === 2 || kind === 3) { const hh = kind === 3 ? 1.4 : 1.0, t = 0.16;
            for (const sd of [-1, 1]) g.quadO([ax + nx * t * sd, ya - (kind === 3 ? 1.2 : 0.2), az + nz * t * sd], [bx + nx * t * sd, yb - (kind === 3 ? 1.2 : 0.2), bz + nz * t * sd], [bx + nx * t * sd, yb + hh, bz + nz * t * sd], [ax + nx * t * sd, ya + hh, az + nz * t * sd], wallC, [(ax + bx) / 2, (ya + yb) / 2, (az + bz) / 2]);
            g.quadUp([ax - nx * t, ya + hh, az - nz * t], [ax + nx * t, ya + hh, az + nz * t], [bx + nx * t, yb + hh, bz + nz * t], [bx - nx * t, yb + hh, bz - nz * t], [[0.8, 0.78, 0.74], [0.8, 0.78, 0.74], [0.8, 0.78, 0.74], [0.8, 0.78, 0.74]]); }
          else if (kind === 4) { for (const sd of [-1, 1]) g.quadO([ax, ya + 0.45, az], [bx, yb + 0.45, bz], [bx, yb + 0.8, bz], [ax, ya + 0.8, az], steel, [(ax + bx) / 2 + nx * sd, ya + 0.6, (az + bz) / 2 + nz * sd]); if (k % 2 === 0) box(g, ax, ya - 0.3, az, 0.12, 1.1, 0.12, Math.atan2(bz - az, bx - ax), [0.5, 0.5, 0.52], null, true); }
          else { for (const [h0, h1] of [[0.38, 0.45], [1.0, 1.08]]) for (const sd of [-1, 1]) g.quadO([ax, ya + h0, az], [bx, yb + h0, bz], [bx, yb + h1, bz], [ax, ya + h1, az], fenceC, [(ax + bx) / 2 + nx * sd, ya + 0.6, (az + bz) / 2 + nz * sd]); box(g, ax, ya - 0.2, az, 0.08, 1.35, 0.08, 0, [0.36, 0.38, 0.36], null, true); }   // (posts and two rails: a garden fence, the wire between them unseen)
        }
      }
    }

    out.dropped = { bld: nDropB, fences: nDropF };   // (the scenery the course takes in: tests/medvode-fence)

    /* ---- the sports grounds (def.pitches): the football pitches mown in stripes with their lines and goals, the small courts (artificial turf or
       clay) with their lines and a fence ---- */
    {
      for (const [x, z, L, W, a] of def.pitches || []) { if (vrDist(x, z) > 440) continue;
        const gP = scen.get(x, z), gL = gP, c = Math.cos(a), s = Math.sin(a), P2 = (u, v, dy) => { const px = x + c * u - s * v, pz = z + s * u + c * v; return [px, mvGround(px, pz) + dy, pz]; };
        const big = L > 60 && W > 35, court = !big && L < 50, hl = (big ? Math.min(L, 105) : L) / 2 - 1, hw = (big ? Math.min(W, 68) : W) / 2 - 1;
        const surf = big ? [0.3, 0.54, 0.2] : court ? (crH(x, z, 3) < 0.5 ? [0.66, 0.36, 0.26] : [0.24, 0.46, 0.3]) : [0.32, 0.55, 0.22];
        const nu = Math.max(1, Math.round(L / 6)), nv = Math.max(1, Math.round(W / 6));
        for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const u0 = -L / 2 + i * L / nu, u1 = u0 + L / nu, v0 = -W / 2 + j * W / nv, v1 = v0 + W / nv, k = big && i % 2 ? 0.92 : 1, cc = [surf[0] * k, surf[1] * k, surf[2] * k];
          gP.quadUp(P2(u0, v0, 0.05), P2(u1, v0, 0.05), P2(u1, v1, 0.05), P2(u0, v1, 0.05), [cc, cc, cc, cc]); }
        const WH = [0.95, 0.95, 0.93], ln = (u0, v0, u1, v1) => { const du = u1 - u0, dv = v1 - v0, l = Math.hypot(du, dv) || 1, m = Math.max(1, Math.ceil(l / 6)), pu = -dv / l * 0.06, pv = du / l * 0.06;
          for (let q = 0; q < m; q++) { const a0 = u0 + du * q / m, b0 = v0 + dv * q / m, a1 = u0 + du * (q + 1) / m, b1 = v0 + dv * (q + 1) / m; gL.quadUp(P2(a0 - pu, b0 - pv, 0.07), P2(a0 + pu, b0 + pv, 0.07), P2(a1 + pu, b1 + pv, 0.07), P2(a1 - pu, b1 - pv, 0.07), [WH, WH, WH, WH]); } };
        ln(-hl, -hw, hl, -hw); ln(hl, -hw, hl, hw); ln(hl, hw, -hl, hw); ln(-hl, hw, -hl, -hw); ln(0, -hw, 0, hw);
        if (big) { for (let q = 0; q < 24; q++) ln(Math.cos(q / 24 * TAU) * 9.15, Math.sin(q / 24 * TAU) * 9.15, Math.cos((q + 1) / 24 * TAU) * 9.15, Math.sin((q + 1) / 24 * TAU) * 9.15);
          for (const sd of [-1, 1]) { ln(sd * hl, -20.16, sd * (hl - 16.5), -20.16); ln(sd * (hl - 16.5), -20.16, sd * (hl - 16.5), 20.16); ln(sd * (hl - 16.5), 20.16, sd * hl, 20.16);
            const g = scen.get(x, z); for (const v of [-3.66, 3.66]) { const p = P2(sd * hl, v, 0); box(g, p[0], p[1], p[2], 0.12, 2.44, 0.12, a, WH, null, true); } const p = P2(sd * hl, 0, 2.44); box(g, p[0], p[1], p[2], 0.12, 0.12, 7.4, a, WH, null, true); } }
        else if (court) { const g = scen.get(x, z); for (const [u0, v0, u1, v1] of [[-L / 2, -W / 2, L / 2, -W / 2], [L / 2, -W / 2, L / 2, W / 2], [L / 2, W / 2, -L / 2, W / 2], [-L / 2, W / 2, -L / 2, -W / 2]]) {
          const A = P2(u0, v0, 0), B = P2(u1, v1, 0), m = Math.max(1, Math.round(Math.hypot(B[0] - A[0], B[2] - A[2]) / 3)), fc = [0.3, 0.36, 0.32];   // (the court's fence: posts every 3 m, a rail along the top)
          for (let q = 0; q < m; q++) { const p = [lerp(A[0], B[0], q / m), lerp(A[1], B[1], q / m), lerp(A[2], B[2], q / m)]; box(g, p[0], p[1] - 0.2, p[2], 0.07, 3.2, 0.07, a, fc, null, true); }
          for (const sd of [-1, 1]) g.quadO([A[0], A[1] + 2.9, A[2]], [B[0], B[1] + 2.9, B[2]], [B[0], B[1] + 3, B[2]], [A[0], A[1] + 3, A[2]], fc, [x + (A[0] - x) * (1 - 0.1 * sd), A[1] + 1, z + (A[2] - z) * (1 - 0.1 * sd)]); } }
        exclPush(x, z, Math.min(Math.hypot(L, W) / 2, 30));
      }
    }

    /* ---- the signs of the zebra crossings (a blue board with a white triangle, both sides of the road) and the bus stops (a pole with the blue
       board and its white bus, a bench; a glass shelter where OSM has one); street lamps along the sidewalks. All but the shelter are knockable props
       (out.props: 'msign', 'bsign', 'bench', 'mlamp'; Core PROPK, Render.propGeometry) ---- */
    {
      const board = (s0, side, fig) => {   // a square board on a pole behind the road's edge (its sidewalk), its faces along the road
        const i = T.idx(s0), o = side * (wE(side > 0 ? 1 : 0, i) + 0.6), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = mvGround(x, z), hd = T.hd[i];
        if (excluded(x, z) || vrStubAt(x, z, 0.3)) return null;
        out.props.push({ kind: fig === 'zebra' ? 'msign' : 'bsign', x, z, yaw: hd, col: 0, i });   // (knockable: the pole with the blue board, its white triangle / bus: Render.propGeometry)
        exclPush(x, z, 1.2); CR.avoid(x, z, 0.6); return [x, y, z, i];
      };
      for (const z0 of def.zebras || []) for (const side of [-1, 1]) board(sStart + z0 - side * 4, side, 'zebra');
      for (const [d, side, , shelter] of def.stops || []) { const b = board(sStart + d - 5, side, 'bus'); if (!b) continue;
        const i = T.idx(sStart + d), o = side * (BAR ? (side > 0 ? T.br[i] : T.bl[i]) + 1.5 : wE(side > 0 ? 1 : 0, i) + 1.6), bx = T.px[i] + T.nx[i] * o, bz = T.pz[i] + T.nz[i] * o, by = mvGround(bx, bz), g = scen.get(bx, bz), hd = T.hd[i];   // (def.barrier: the shelter behind the barrier, out of the cars' way)
        if (excluded(bx, bz) || vrStubAt(bx, bz, 0.5) || T.onBuilding(bx + T.nx[i] * side * 0.4, bz + T.nz[i] * side * 0.4, 1)) continue;   // (the barrier along a house's front: no room behind it)
        if (shelter) {   // a shelter: a glass back wall and sides, a flat roof on four posts, the bench inside
          const ox = T.nx[i] * side * 0.7, oz = T.nz[i] * side * 0.7, frame = [0.3, 0.32, 0.36];
          box(g, bx + ox, by + 0.1, bz + oz, 3.6, 2.2, 0.05, hd, [0.6, 0.72, 0.78]); box(g, bx, by + 2.3, bz, 3.9, 0.12, 1.9, hd, frame, [0.36, 0.38, 0.42]);
          for (const u of [-1.8, 1.8]) { box(g, bx + ox + T.tx[i] * u, by, bz + oz + T.tz[i] * u, 0.08, 2.3, 0.08, hd, frame); box(g, bx + T.tx[i] * u - ox, by, bz + T.tz[i] * u - oz, 0.08, 2.3, 0.08, hd, frame); box(g, bx + T.tx[i] * u, by + 0.1, bz + T.tz[i] * u, 0.05, 2.1, 1.3, hd, [0.6, 0.72, 0.78]); }
          exclPush(bx, bz, 2.8); CR.block(bx, bz, 4, 2, hd); }
        out.props.push({ kind: 'bench', x: bx + T.nx[i] * side * 0.4, z: bz + T.nz[i] * side * 0.4, yaw: hd, col: 0, i });   // (the bench: knockable)
        exclPush(bx, bz, 2); }
      // the street lamps: along the sidewalks, every ~34 m on the side with the wider one (a tall grey pole, an arm over the road, the lamp)
      for (let i = 0; i < N; i += 17) { if (!WK) break; const si = WK[1][i] >= WK[0][i] ? 1 : 0, side = si ? 1 : -1; if (WK[si][i] < 0.5) continue;
        const o = side * (wE(si, i) + 0.35), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; if (excluded(x, z) || vrStubAt(x, z, 0.5) || mvW(x, z).e > -1) continue;
        out.props.push({ kind: 'mlamp', x, z, yaw: Math.atan2(-T.nz[i] * side, -T.nx[i] * side), col: 0, i });   // (knockable: the pole with its arm over the road, Render.propGeometry; yaw: the arm's way)
        exclPush(x, z, 1); CR.avoid(x, z, 0.5); }
    }

    /* ---- the delineator posts in the country (white with a black band, every 50 m both sides: knockable where they fit, as Vršič's), the guard
       rails where the ground falls away beside the road ---- */
    if (!BAR) {   // (def.barrier: the steel barrier everywhere, FENCE)
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { if (onBr[i] || town[side > 0 ? 1 : 0][i]) continue; const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [3, 6, 10]) { const o = side * (bar + d); if (mvGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 6 ? 2.6 : 3.6)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const steel = [0.78, 0.8, 0.82], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52];
      for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0, nd = need[si], bar = side > 0 ? T.br : T.bl, gp = T.gap ? T.gap[si] : null;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 8) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        if (gp) for (let i = 0; i < N; i++) if (gp[i]) nd[i] = 0;
        const Qp = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) { const g = scen.get(T.px[i], T.pz[i]);
          if (nd[i] && nd[i + 1]) { const a = Qp(i, 0.45), b = Qp(i + 1, 0.45), c = Qp(i + 1, 0.8), d = Qp(i, 0.8); g.quadO(a, b, c, d, steel, Qp(i, 0.6, 3)); g.quadO(a, b, c, d, steelB, Qp(i, 0.6, -3));
            if (i % 2 === 0) { const p = Qp(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); } }
          else if (!nd[i] && !onBr[i] && !town[si][i] && !(gp && gp[i]) && i % 25 === 0 && i > 4 && i < iE - 4 && !inRing[i]) mkPosts.push([i, side]); }
      }
      const kp = vrsicProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue; const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true); }
    }

    /* ---- the start (by the football ground), the checkpoints, the finish below the castle: gantries over the road, the start lights, flags ---- */
    const arch = (s, rowK, postCol, beamCol, G, B) => {   // a gantry over the road: two posts behind the sidewalks, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = BAR ? T.bl[i] + 0.7 : wE(0, i) + 1.1, L2 = BAR ? T.br[i] + 0.7 : wE(1, i) + 1.1, g = G || scen.get(x, z), hd = T.hd[i];   // (def.barrier: its posts behind the barrier)
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.5, 7.2, 0.5, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.5, 7.2, 0.5, hd, postCol);
      box(g, x + nx * (L2 - L1) / 2, y + 5.9, z + nz * (L2 - L1) / 2, 0.5, 0.6, L1 + L2 + 0.5, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], Math.min(12.8, (L1 + L2) * 0.95), 1.5, v0, v1, 0, 1, B);
      const e = exclPush(x, z, Math.max(L1, L2) + 3); crSoft.add(e); return [x, y, z, i];
    };
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z);
      box(g, x, y + 6.5, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.05, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      for (let s = sStart - 40; s < sStart + 40; s += 12) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 0.7); if (excluded(px, pz) || vrStubAt(px, pz, 1)) continue; out.props.push({ kind: 'flagp', x: px, z: pz, yaw: T.hd[ii], col: 0, i: ii }); exclPush(px, pz, 1); }   // (a flag pole with the Slovenian flag: knockable, Render.propGeometry)
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the road closed behind the grid: concrete blocks across it
      for (let o = -wE(0, 0); o < wE(1, 0); o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      const [bx, bz, bi] = onSide(sStart + 18, 1, 1.4), by = mvGround(bx, bz), [v0, v1] = row(6);   // the race's banner beside the road after the line
      if (!vrStubAt(bx, bz, 1)) { for (const o of [-3.3, 3.3]) box(scen.get(bx, bz), bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]); bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.1, 0.3, 0.72]));
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12], finS, finB);
      for (const side of [-1, 1]) for (let s = sFin - 24; s < sFin + 10; s += 7) { const [px, pz, ii] = onSide(s, side, 0.9);
        out.props.push({ kind: 'cflag', x: px, z: pz, yaw: T.hd[ii], col: 0, i: ii }); }   // (the chequered flags on their poles: knockable, Render.propGeometry)
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road at the castle: concrete blocks across it
      for (let o = -wE(0, iE) - 0.5; o <= wE(1, iE) + 0.5; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
    }
    // the villages' boards (white, black lettering) where the road comes into Zbilje, Valburga and Smlednik, and into Medvode's last houses behind
    // the start: at the first houses along the road (land cover: built-up) before each village's name
    {
      const bu = (s) => { const i = T.idx(s); let n = 0; for (const sd of [-1, 1]) { const o = sd * (wE(sd > 0 ? 1 : 0, i) + 12); n += vrLCf(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, 3); } return n / 2; };
      [['Zbilje', 1], ['Valburga', 2], ['Smlednik', 3]].forEach(([nm, k]) => { const q = T.names.find(v => v.n === nm); if (!q) return;
        let s = sStart + q.d; for (let t = s; t > s - 600; t -= 4) { if (bu(t) < 0.25 && bu(t - 12) < 0.25) { s = t; break; } }
        const [x, z, i] = onSide(s, 1, 0.8); if (vrStubAt(x, z, 1) || out.props.some(p => p.kind === 'vboard' && Math.hypot(p.x - x, p.z - z) < 6)) return;   // (two names on one spot: one board)
        out.props.push({ kind: 'vboard', x, z, yaw: T.hd[i], col: 0, i }); exclPush(x, z, 1.5); });   // (the board on its two poles: knockable, Render.propGeometry; the name's lettering is lost on it)
    }

    /* ---- def.barrier: the race's own furniture behind the barrier: the distance boards (150 / 100 / 50 m) before the rings and the sharp turns, on
       the outside; the marshals' posts (a white hut, a yellow flag on a pole) every ~400 m, by turns either side; the timing hut by the start line; the
       paddock's white tents on the car park behind the grid ---- */
    if (BAR) {
      const ban4 = new GB(true), postC = [0.52, 0.53, 0.56], hutW = [0.93, 0.93, 0.9], hutR = [0.3, 0.31, 0.34], win = [0.16, 0.2, 0.26], yel = [0.97, 0.82, 0.12], orng = [0.95, 0.45, 0.08];
      const behind = (s, side, extra) => { const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + extra); return { i, x: T.px[i] + T.nx[i] * o, z: T.pz[i] + T.nz[i] * o }; };
      const free = (x, z, r) => !excluded(x, z) && mvW(x, z).e < -1 && occAt(x, z) !== 3 && !blds.some(b => Math.hypot(b.x - x, b.z - z) < Math.max(b.L, b.W) / 2 + r);
      // the braking points: a turn sharper than 28 m in radius (a ring's entry, a junction, a hairpin) after 50 m of easier road
      const brk = []; for (let i = 80, last = -1e9; i < N - 3; i++) { if (Math.abs(T.k[i]) < 1 / 30) continue; const s = i * ds; if (s - last > 160 && s - sStart > 170 && s < sFin) { let easy = true; for (let j = i - 76; j < i - 8; j++) if (Math.abs(T.k[j]) > 1 / 45) { easy = false; break; } if (easy) brk.push(i); } last = s; }
      let nBoards = 0;
      for (const ic of brk) { const side = T.k[ic] > 0 ? -1 : 1;   // (k > 0 a right turn: the boards on the left, its outside)
        [150, 100, 50].forEach((m, k) => { const s = ic * ds - m; if (s < sStart + 20) return; const { i, x, z } = behind(s, side, 1.0); if (!free(x, z, 0.6)) return; const y = mvGround(x, z), g = scen.get(x, z);
          box(g, x, y - 0.3, z, 0.1, 1.95, 0.1, T.hd[i], postC); bannerQ(x, y + 1.0, z, T.tx[i], T.tz[i], 0.85, 0.85, 0.75, 1, k * 0.25, k * 0.25 + 0.25, ban4); exclPush(x, z, 0.8); nBoards++; }); }
      // the marshals' posts
      let nMar = 0;
      for (let s = sStart + 230, k = 0; s < sFin - 40; s += 400, k++) { const side = k % 2 ? -1 : 1;
        for (const ds2 of [0, 25, -25, 50, -50]) { const { i, x, z } = behind(s + ds2, side, 1.7); if (!free(x, z, 1.4)) continue; const y = mvGround(x, z), g = scen.get(x, z), h = T.hd[i];
          box(g, x, y - 0.2, z, 1.3, 2.2, 1.3, h, hutW, hutR); box(g, x, y + 2.0, z, 1.6, 0.14, 1.6, h, hutR); box(g, x, y + 1.15, z, 1.32, 0.55, 1.32, h, win);   // (the hut, its roof, its window all round)
          const fx = x - T.nx[i] * side * 0.95, fz = z - T.nz[i] * side * 0.95; box(g, fx, y - 0.2, fz, 0.05, 2.6, 0.05, h, postC);   // (the flag's pole, the flag towards the road)
          g.quadO([fx, y + 2.35, fz], [fx + T.tx[i] * 0.7, y + 2.3, fz + T.tz[i] * 0.7], [fx + T.tx[i] * 0.7, y + 1.85, fz + T.tz[i] * 0.7], [fx, y + 1.9, fz], yel, [fx - T.nx[i] * side, y + 2, fz - T.nz[i] * side]);
          g.quadO([fx, y + 2.35, fz], [fx + T.tx[i] * 0.7, y + 2.3, fz + T.tz[i] * 0.7], [fx + T.tx[i] * 0.7, y + 1.85, fz + T.tz[i] * 0.7], [fx, y + 1.9, fz], yel, [fx + T.nx[i] * side, y + 2, fz + T.nz[i] * side]);
          box(g, x + T.tx[i] * 0.9, y - 0.05, z + T.tz[i] * 0.9, 0.42, 1.7, 0.3, h, orng);   // (the marshal: an orange suit)
          exclPush(x, z, 1.6); CR.avoid(x, z, 1.5); nMar++; break; } }
      // the timing hut by the start line (right side, behind the barrier)
      { const { i, x, z } = behind(sStart + 7, 1, 2.2); if (free(x, z, 1.5)) { const y = mvGround(x, z), g = scen.get(x, z), h = T.hd[i];
          box(g, x, y - 0.3, z, 3.2, 2.9, 2.4, h, hutW, hutR); box(g, x, y + 1.3, z, 3.22, 0.8, 2.42, h, win); box(g, x, y + 2.6, z, 3.6, 0.16, 2.8, h, hutR); exclPush(x, z, 2.6); CR.avoid(x, z, 2.5); } }
      // the paddock: the rivals' tents on the car parks within 260 m behind and beside the grid, clear of the cars' free ground
      let nTent = 0; const tentC = [0.96, 0.96, 0.95], legC = [0.6, 0.6, 0.62];
      for (const pp of def.parking || []) { const q = []; for (let k = 0; k + 1 < pp.length; k += 2) q.push([pp[k], pp[k + 1]]); const cx = q.reduce((a, p) => a + p[0], 0) / q.length, cz = q.reduce((a, p) => a + p[1], 0) / q.length, i0 = T.nearestIdx(cx, cz);
        if (Math.abs(i0 * ds - sStart) > 260 || nTent >= 18) continue;
        let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of q) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
        for (let x = x0 + 3; x < x1 - 2; x += 6.5) for (let z = z0 + 3; z < z1 - 2; z += 6.5) { if (nTent >= 18 || !inPoly(q, x, z) || wFree.route(x, z, -4) || wFree.ring(x, z, -4) || !free(x, z, 2.5)) continue;
          const y = mvGround(x, z), g = scen.get(x, z), hw = 1.5; for (const [a, b] of [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]]) box(g, x + a, y - 0.1, z + b, 0.06, 2.2, 0.06, 0, legC);
          const top = [x, y + 2.75, z], cs = [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]].map(([a, b]) => [x + a * 1.08, y + 2.1, z + b * 1.08]);
          for (let e = 0; e < 4; e++) g.triO(cs[e], cs[(e + 1) % 4], top, tentC, [x, y, z]);
          exclPush(x, z, 2.6); CR.avoid(x, z, 2.5); nTent++; } }
      for (let s = sStart - 30; s > sStart - 175 && nTent < 14; s -= 7) for (const side of [1, -1]) {   // (and a row of them behind the barrier behind the grid, where the car parks have none)
        const { i, x, z } = behind(s, side, 3.2); if (nTent >= 14 || wFree.route(x, z, -2.2) || wFree.ring(x, z, -2.2) || !free(x, z, 2.4)) continue;
        const y = mvGround(x, z), g = scen.get(x, z), hw = 1.5, ux = T.tx[i], uz = T.tz[i], vx = T.nx[i], vz = T.nz[i], C4 = [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]].map(([a, b]) => [x + ux * a + vx * b, z + uz * a + vz * b]);
        for (const [px, pz] of C4) box(g, px, y - 0.1, pz, 0.06, 2.2, 0.06, 0, legC);
        const top = [x, y + 2.75, z], cs = C4.map(([px, pz]) => [x + (px - x) * 1.08, y + 2.1, z + (pz - z) * 1.08]);
        for (let e = 0; e < 4; e++) g.triO(cs[e], cs[(e + 1) % 4], top, tentC, [x, y, z]);
        exclPush(x, z, 2.6); CR.avoid(x, z, 2.5); nTent++; }
      // def.bales ([[d0, d1, side], ...]: the outside of the castle road's hairpins and of the other sharp corners): a row of straw-bale stacks (two bales with one on top,
      // knockable: 'bstack', Core PROPK) just in front of the barrier, 2.8 m apart, along the road; none where the barrier is less than 2.6 m past the road's (its sidewalk's) edge
      let nBales = 0;
      for (const [d0, d1, side] of def.bales || []) for (let s = sStart + d0; s <= sStart + d1 + 0.01; s += 2.8) {
        const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i]; if (bar - wE(side > 0 ? 1 : 0, i) < 2.6) continue;
        const [x, z, hd] = atSf(s, side * (bar - 1.15)); if (excluded(x, z)) continue;
        out.props.push({ kind: 'bstack', x, z, yaw: hd + (rpHash(i, 77) - 0.5) * 0.12, col: 0, i }); exclPush(x, z, 1.5); nBales++; }
      out.race = { boards: nBoards, marshals: nMar, tents: nTent, brakes: brk.length, bales: nBales };
      const bm4 = addM(ban4, new THREE.MeshLambertMaterial({ map: mvAtlas4(), side: THREE.FrontSide }), true); if (bm4) bm4.castShadow = false;
    }

    /* ---- FENCE: a light timber post-and-rail fence on the whole barrier (FR, Track.fenceRuns: the route's barriers on both sides, each side road's two limits,
       the roundabout zones' circles, not across a side road's mouth, the bridge's parapet, the overpass), 8 cm outside the line where wallCollide acts, so a
       car's body touches it where it hits the wall; the houses, garden walls and fences stand behind it. It stands on the ground (the terrain, the verge's
       surface). Indexed geometry in 320 m chunks, one mesh each, casting no shadow: a top rail (its flat top and its face), a lower rail, a post every ~3 m
       (two crossed planks); the columns are thinned out along straight, level stretches. out.fence holds the lines as built (tests/browser/medvode-fence.test.mjs) ---- */
    {
      const tG0 = performance.now(), EPS = 0.08, HT = 1.1, CK = 320, PS = 3.5, TOL = 0.05, TOLY = 0.08, stacks = [], QTY = {};
      const TIM = [0.96, 0.85, 0.62], FACE = [0.87, 0.72, 0.5], MID = [0.8, 0.65, 0.44], LOW = [0.72, 0.57, 0.38], POST = [0.42, 0.3, 0.2];
      const SHI = [0.84, 0.86, 0.88], SLO = [0.6, 0.62, 0.66], STOP = [0.9, 0.91, 0.93], SPO = [0.36, 0.37, 0.4];   // (def.barrier: the steel's colours)
      // (def.barrier: the fronts of the houses and walls the barrier runs along: within 0.65 m of the line, the rail left out there)
      const WH2 = new Map(), WC = 4, whK = (a, b) => a * 65536 + b, whAdd = (x, z) => { const k = whK(Math.floor(x / WC), Math.floor(z / WC)); let L = WH2.get(k); if (!L) WH2.set(k, L = []); L.push(x, z); };
      if (BAR) { for (const b of blds) { const p = b.pts; for (let e = 0; e < p.length; e++) { const p0 = p[e], p1 = p[(e + 1) % p.length], m = Math.max(1, Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 0.5)); for (let j = 0; j < m; j++) whAdd(lerp(p0[0], p1[0], j / m), lerp(p0[1], p1[1], j / m)); } }
        for (let k = 0; k + 3 < wallsBuilt.length; k += 4) { const L = wallsBuilt, m = Math.max(1, Math.ceil(Math.hypot(L[k + 2] - L[k], L[k + 3] - L[k + 1]) / 0.5)); for (let j = 0; j <= m; j++) whAdd(lerp(L[k], L[k + 2], j / m), lerp(L[k + 1], L[k + 3], j / m)); } }   // (only the walls built: no rail left out in front of nothing)
      const wallNear = (x, z) => { const a = Math.floor(x / WC), b = Math.floor(z / WC); for (let i = a - 1; i <= a + 1; i++) for (let j = b - 1; j <= b + 1; j++) { const L = WH2.get(whK(i, j)); if (L) for (let k = 0; k < L.length; k += 2) if ((L[k] - x) ** 2 + (L[k + 1] - z) ** 2 < 0.4225) return 1; } return 0; };
      // (p10) def.rwBar ([x, z, ...], or a list of them): where the barrier runs along the user's red / white line (within 0.9 m of it), red and white blocks 1.5 m long instead of the steel
      const RWL = BAR && def.rwBar && def.rwBar.length ? (typeof def.rwBar[0] === 'number' ? [def.rwBar] : def.rwBar) : [], RWT2 = 0.81;
      const rwProj = (L, x, z) => { let bd = 1e18, bs = 0, s = 0, end = 0; for (let k = 0; k + 3 < L.length; k += 2) { const ax = L[k], az = L[k + 1], dx = L[k + 2] - ax, dz = L[k + 3] - az, l2 = dx * dx + dz * dz || 1e-9, t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1), ex = x - ax - dx * t, ez = z - az - dz * t, d = ex * ex + ez * ez;
          if (d < bd) { bd = d; bs = s + t * Math.sqrt(l2); end = (k === 0 && t === 0) ? -1 : (k + 4 >= L.length && t === 1) ? 1 : 0; } s += Math.sqrt(l2); } return { d2: bd, s: bs, end, len: s }; };   // (the nearest point of the line: its distance squared, its metres along it, at its first / last end)
      const rwEnd = (L, sg) => { const n = L.length / 2, i0 = sg < 0 ? 0 : n - 1; let j = i0, l = 0; while (l < 1 && j + sg * -1 >= 0 && j + sg * -1 < n) { j -= sg; l = Math.hypot(L[2 * j] - L[2 * i0], L[2 * j + 1] - L[2 * i0 + 1]); } return [L[2 * i0], L[2 * i0 + 1], (L[2 * i0] - L[2 * j]) / (l || 1), (L[2 * i0 + 1] - L[2 * j + 1]) / (l || 1)]; };   // (an end and its outward way over the line's last metre)
      const rwNear = RWL.length ? (x, z) => { for (const L of RWL) { const pr = rwProj(L, x, z); if (pr.d2 >= RWT2) continue;
          if (pr.end) { const [ex, ez, ux, uz] = rwEnd(L, pr.end); if ((x - ex) * ux + (z - ez) * uz > 0.02) continue; }   // (not past the line's two ends)
          return 1; } return 0; } : null;
      const rwS = (x, z) => { let b = null; for (const L of RWL) { const pr = rwProj(L, x, z); if (!b || pr.d2 < b.d2) b = pr; } return b ? b.s : 0; };   // (metres along the user's line: the blocks' colours by it, unbroken from one fence run to the next)
      let rwLen = 0;
      const chunks = new Map(), fl = { lines: [], posts: [], len: 0, cols: 0, np: 0 };
      const getC = (x, z) => { const k = Math.floor(x / CK) + ',' + Math.floor(z / CK); let c = chunks.get(k); if (!c) chunks.set(k, c = { P: [], N: [], C: [], I: [], v: 0 }); return c; };
      const vtx = (c, x, y, z, nx, ny, nz, col, k) => { c.P.push(x, y, z); c.N.push(nx, ny, nz); c.C.push(col[0] * k, col[1] * k, col[2] * k); return c.v++; };
      const tri = (c, a, b, d) => { const P = c.P, ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[d * 3] - P[a * 3], vy = P[d * 3 + 1] - P[a * 3 + 1], vz = P[d * 3 + 2] - P[a * 3 + 2];   // (a triangle wound to face where its vertices' normals point: the two-sided material lights the other side with the flipped normal)
        if ((uy * vz - uz * vy) * c.N[a * 3] + (uz * vx - ux * vz) * c.N[a * 3 + 1] + (ux * vy - uy * vx) * c.N[a * 3 + 2] >= 0) c.I.push(a, b, d); else c.I.push(a, d, b); };
      const vh = (si, i, off) => { const A = vp[si][i]; if (off <= A[0][0]) return A[0][1]; for (let k = 1; k < A.length; k++) if (off <= A[k][0]) return A[k - 1][1] + (A[k][1] - A[k - 1][1]) * (off - A[k - 1][0]) / Math.max(1e-6, A[k][0] - A[k - 1][0]); return A[A.length - 1][1]; };   // (the verge's height above the road at that distance from the centre line)
      const QRL = {};
      for (const r of FR.runs) {
        const P = r.pts, n = P.length / 2, sg = r.sg, ix = r.ix, sd = r.side, si = sd > 0 ? 1 : 0, X = [], Z = [], Y = [];
        for (let j = 0; j < n; j++) {   // the line 8 cm outside, the ground under it (the verge's surface where it lies over the terrain)
          const a = Math.max(0, j - 1), b = Math.min(n - 1, j + 1); let dx = P[2 * b] - P[2 * a], dz = P[2 * b + 1] - P[2 * a + 1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
          const x = P[2 * j] - dz * sg * EPS, z = P[2 * j + 1] + dx * sg * EPS; let y = mvGround(x, z);
          if (r.k === 0 && ix[j] >= 0) { const i = ix[j]; y = Math.max(y, T.hy[i] + vh(si, i, ((x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]) * sd)); if (BAR) y = Math.max(y, T.yAt(T.query(x, z, i, QRL)) + 0.02); }   // (def.barrier: on the run-off, at the cars' own heights as its rows are drawn: across a slope the verge's profile lies under it, the rail buried)
          if (X.length && Math.hypot(x - X[X.length - 1], z - Z[Z.length - 1]) < 0.05) continue;   // (a cut point on top of a sample)
          X.push(x); Z.push(z); Y.push(y);
        }
        let rwD = rwNear ? X.map((x, k) => rwNear(x, Z[k])) : null; if (rwD && !rwD.includes(1)) rwD = null;
        if (rwD) for (let k = X.length - 1; k > 0; k--) if (rwD[k] !== rwD[k - 1]) { const a = k - 1; let lo = 0, hi = 1;   // (the red / white stretch's two ends exactly where the line comes within 0.9 m)
          for (let it = 0; it < 8; it++) { const u = (lo + hi) / 2; if (rwNear(lerp(X[a], X[k], u), lerp(Z[a], Z[k], u)) === rwD[a]) lo = u; else hi = u; }
          const u = rwD[a] ? lo : hi; X.splice(k, 0, lerp(X[a], X[k], u)); Z.splice(k, 0, lerp(Z[a], Z[k], u)); Y.splice(k, 0, lerp(Y[a], Y[k], u)); rwD.splice(k, 0, 1); }
        const m = X.length; if (m < 2) continue;
        const hidD = BAR ? X.map((x, k) => wallNear(x, Z[k])) : null;   // (def.barrier: where a house's or a wall's front is the barrier, no rail in front of it)
        const keep = [0];   // the columns: thinned out where the line is straight and the ground level (chords up to 8 m)
        for (let a = 0; a < m - 1;) {
          let b = a + 1;
          while (b + 1 < m) { const c = b + 1, dxc = X[c] - X[a], dzc = Z[c] - Z[a], lc = Math.hypot(dxc, dzc); if (lc > 8 || (hidD && hidD[c] !== hidD[a]) || (rwD && rwD[c] !== rwD[a])) break; let good = true;
            for (let k = a + 1; k <= b; k++) { const t = ((X[k] - X[a]) * dxc + (Z[k] - Z[a]) * dzc) / (lc * lc || 1), ex = X[a] + dxc * t - X[k], ez = Z[a] + dzc * t - Z[k], ey = Y[a] + (Y[c] - Y[a]) * t - Y[k]; if (ex * ex + ez * ez > TOL * TOL || Math.abs(ey) > TOLY) { good = false; break; } }
            if (!good) break; b = c; }
          keep.push(b); a = b;
        }
        const C = keep.map(k => [X[k], Y[k], Z[k]]), nc = C.length, nrm = [], cum = [0];
        for (let j = 0; j < nc; j++) { const a = Math.max(0, j - 1), b = Math.min(nc - 1, j + 1); let dx = C[b][0] - C[a][0], dz = C[b][2] - C[a][2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; nrm.push([-dz * sg, dx * sg]); if (j) cum.push(cum[j - 1] + Math.hypot(C[j][0] - C[j - 1][0], C[j][2] - C[j - 1][2])); }
        const memo = new Map();
        if (BAR) {   // def.barrier: a race circuit's steel barrier, two W-beams one over the other (the lower half of each W darker), on steel posts every 2.5 m
          const hid = keep.map(k => hidD[k]), colA = (c, j) => { let M = memo.get(c); if (!M) memo.set(c, M = []); if (M[j]) return M[j];
            const q = C[j], [nx, nz] = nrm[j], k = 0.95 + 0.1 * rpHash(Math.round(q[0] * 3) + j, Math.round(q[2] * 3)), v = (dy, dn, col) => vtx(c, q[0] - nx * dn, q[1] + dy, q[2] - nz * dn, nx, 0, nz, col, k);
            return M[j] = [v(0.36, 0, SLO), v(0.52, 0.05, SLO), v(0.52, 0.05, SHI), v(0.68, 0, SHI), v(0.7, 0, SLO), v(0.86, 0.05, SLO), v(0.86, 0.05, SHI), v(1.02, 0, SHI), vtx(c, q[0] + nx * 0.2, q[1] + 1.02, q[2] + nz * 0.2, 0, 1, 0, STOP, k), vtx(c, q[0], q[1] + 1.02, q[2], 0, 1, 0, STOP, k)]; };   // (its top 20 cm wide over the posts: seen from above)
          const rw = rwD ? keep.map(k => rwD[k]) : null, RWS = (j) => !!(rw && rw[j] && rw[j + 1]);   // (p10: the red / white stretch: no steel, no posts)
          for (let j = 0; j + 1 < nc; j++) { if ((hid[j] && hid[j + 1]) || RWS(j)) continue; const c = getC((C[j][0] + C[j + 1][0]) / 2, (C[j][2] + C[j + 1][2]) / 2), A = colA(c, j), B = colA(c, j + 1);
            for (const [lo, hi] of [[0, 1], [2, 3], [4, 5], [6, 7], [9, 8]]) { tri(c, A[lo], B[lo], B[hi]); tri(c, A[lo], B[hi], A[hi]); } }
          const Lt = cum[nc - 1], np = Math.max(1, Math.round(Lt / 2.5)); let npB = 0;
          for (let q = 0; q <= np; q++) {   // the posts behind the beams: a dark steel post from the ground to the top beam, its top seen from above
            const s = Lt * q / np; let j = 0; while (j < nc - 2 && cum[j + 1] < s) j++;
            if ((hid[j] && hid[j + 1]) || RWS(j)) continue;
            const u = cum[j + 1] > cum[j] ? (s - cum[j]) / (cum[j + 1] - cum[j]) : 0, y = lerp(C[j][1], C[j + 1][1], u);
            const tx = C[j + 1][0] - C[j][0], tz = C[j + 1][2] - C[j][2], tl = Math.hypot(tx, tz) || 1, ux = tx / tl, uz = tz / tl, nx = -uz * sg, nz = ux * sg;
            const x = lerp(C[j][0], C[j + 1][0], u) + nx * 0.12, z = lerp(C[j][2], C[j + 1][2], u) + nz * 0.12, c = getC(x, z), y0 = y - 0.3, y1 = y + 0.98;
            const a = vtx(c, x - ux * 0.08, y0, z - uz * 0.08, nx, 0, nz, SPO, 0.8), b = vtx(c, x + ux * 0.08, y0, z + uz * 0.08, nx, 0, nz, SPO, 0.8), d = vtx(c, x + ux * 0.08, y1, z + uz * 0.08, nx, 0, nz, SPO, 1), e = vtx(c, x - ux * 0.08, y1, z - uz * 0.08, nx, 0, nz, SPO, 1);
            tri(c, a, b, d); tri(c, a, d, e); fl.posts.push(x - nx * 0.12, z - nz * 0.12, y); npB++;
          }
          if (rw) { const RWC = [[0.8, 0.13, 0.13], [0.94, 0.94, 0.92]], BLK = 1.5;   // (p10) the red / white blocks: 1.5 m long, 0.95 m high, 0.4 m deep behind the line (nothing in the run-off), alternating
            const at = (s) => { let j = 0; while (j < nc - 2 && cum[j + 1] < s) j++; const u = cum[j + 1] > cum[j] ? clamp((s - cum[j]) / (cum[j + 1] - cum[j]), 0, 1) : 0;
              let nx = lerp(nrm[j][0], nrm[j + 1][0], u), nz = lerp(nrm[j][1], nrm[j + 1][1], u); const l = Math.hypot(nx, nz) || 1; return [lerp(C[j][0], C[j + 1][0], u), lerp(C[j][1], C[j + 1][1], u), lerp(C[j][2], C[j + 1][2], u), nx / l, nz / l]; };
            for (let j = 0; j + 1 < nc;) { if (!RWS(j) || (hid[j] && hid[j + 1])) { j++; continue; } let e = j + 1; while (e + 1 < nc && RWS(e) && !(hid[e] && hid[e + 1])) e++;
              const s0 = cum[j], s1 = cum[e], nb = Math.max(1, Math.round((s1 - s0) / BLK)), bl = (s1 - s0) / nb, A0 = at(s0 + bl / 2), p0 = Math.floor(rwS(A0[0], A0[2]) / BLK) % 2; rwLen += s1 - s0;   // (p0: the first block's colour by its place along the user's line)
              for (let b = 0; b < nb; b++) { const A = at(s0 + b * bl + 0.02), B = at(s0 + (b + 1) * bl - 0.02), col = RWC[(p0 + b) % 2], c = getC((A[0] + B[0]) / 2, (A[2] + B[2]) / 2);
                const F = (p, o, y) => [p[0] + p[3] * o, p[1] + y, p[2] + p[4] * o], Qd = (p, q, r2, s, n, k) => { const v = [p, q, r2, s].map(V => vtx(c, V[0], V[1], V[2], n[0], n[1], n[2], col, k)); tri(c, v[0], v[1], v[2]); tri(c, v[0], v[2], v[3]); };
                Qd(F(A, 0, -0.1), F(B, 0, -0.1), F(B, 0.06, 0.95), F(A, 0.06, 0.95), [-A[3], 0, -A[4]], 1);           // (the face to the road, on the line as the steel's)
                Qd(F(A, 0.06, 0.95), F(B, 0.06, 0.95), F(B, 0.4, 0.95), F(A, 0.4, 0.95), [0, 1, 0], 1.04);              // (the top: what the camera above sees)
                Qd(F(A, 0.4, 0.95), F(B, 0.4, 0.95), F(B, 0.46, -0.1), F(A, 0.46, -0.1), [A[3], 0, A[4]], 0.8);         // (the back)
                for (const [P0, sgE] of [[A, -1], [B, 1]]) { const tx = (B[0] - A[0]) * sgE, tz = (B[2] - A[2]) * sgE, tl = Math.hypot(tx, tz) || 1; Qd(F(P0, 0, -0.1), F(P0, 0.46, -0.1), F(P0, 0.4, 0.95), F(P0, 0.06, 0.95), [tx / tl, 0, tz / tl], 0.9); } }   // (its two ends)
              j = e; } }
          let Lv = 0; for (let j = 0; j + 1 < nc; j++) if (!(hid[j] && hid[j + 1])) Lv += cum[j + 1] - cum[j];
          const tyreAt = (j, back) => { const q = C[j], [nx, nz] = nrm[j], x = q[0] - nx * 0.65 + back[0], z = q[2] - nz * 0.65 + back[1], qt = T.query(x, z, T.nearestIdx(x, z), QTY); if (!qt.over && Math.abs(qt.d) < wE(qt.d > 0 ? 1 : 0, qt.a) + 0.55) return; if (!excluded(x, z)) { stacks.push({ kind: 'tstack', x, z, yaw: 0, col: stacks.length % 2, i: T.nearestIdx(x, z) }); exclPush(x, z, 0.8); } };
          for (let j = 0; j + 1 < nc; j++) if (hid[j] !== hid[j + 1]) { const jv = hid[j] ? j + 1 : j, jh = hid[j] ? j : j + 1, ux = C[jh][0] - C[jv][0], uz = C[jh][2] - C[jv][2], ul = Math.hypot(ux, uz) || 1; tyreAt(jv, [ux / ul * 0.3, uz / ul * 0.3]); }   // (the rail's end at a house's corner: a stack of tyres in front of it)
          if (!r.closed && !r.shut) for (const j of [0, nc - 1]) if (!hid[j]) tyreAt(j, [0, 0]);   // (a run's open end: the bridge's parapet, the underpass's walls)
          fl.lines.push({ k: r.k, side: r.side, ref: r.ref, sg, closed: r.closed, len: Lt, rail: Lv, posts: npB, cols: Float32Array.from(C.flat()), hid: Uint8Array.from(hid), rw: rw ? Uint8Array.from(rw) : null }); fl.len += Lt; fl.rail = (fl.rail || 0) + Lv; fl.cols += nc; fl.np += npB;
          continue;
        }
        const colV = (c, j) => {   // a column's eight vertices in a chunk: the top rail's flat top (two, 40 cm wide, on the outer side of the plane), its face, the middle rail, the lower rail (two each)
          let M = memo.get(c); if (!M) memo.set(c, M = []); if (M[j]) return M[j];
          const q = C[j], [nx, nz] = nrm[j], k = 0.93 + 0.14 * rpHash(Math.round(q[0] * 3) + j, Math.round(q[2] * 3));
          return M[j] = [vtx(c, q[0] - nx * 0.03, q[1] + HT, q[2] - nz * 0.03, 0, 1, 0, TIM, k), vtx(c, q[0] + nx * 0.37, q[1] + HT, q[2] + nz * 0.37, 0, 1, 0, TIM, k),
            vtx(c, q[0], q[1] + HT - 0.26, q[2], nx, 0, nz, FACE, k), vtx(c, q[0], q[1] + HT, q[2], nx, 0, nz, FACE, k),
            vtx(c, q[0], q[1] + 0.55, q[2], nx, 0, nz, MID, k), vtx(c, q[0], q[1] + 0.75, q[2], nx, 0, nz, MID, k),
            vtx(c, q[0], q[1] + 0.14, q[2], nx, 0, nz, LOW, k), vtx(c, q[0], q[1] + 0.32, q[2], nx, 0, nz, LOW, k)];
        };
        for (let j = 0; j + 1 < nc; j++) { const c = getC((C[j][0] + C[j + 1][0]) / 2, (C[j][2] + C[j + 1][2]) / 2), A = colV(c, j), B = colV(c, j + 1);
          for (const [lo, hi] of [[0, 1], [2, 3], [4, 5], [6, 7]]) { tri(c, A[lo], B[lo], B[hi]); tri(c, A[lo], B[hi], A[hi]); } }
        const Lt = cum[nc - 1], np = Math.max(1, Math.round(Lt / PS));
        for (let q = 0; q <= np; q++) {   // the posts, behind the rails (14 cm out): a dark plank along the line from 30 cm in the ground to 7 cm over the top rail, a dark cap on it (seen from above)
          const s = Lt * q / np; let j = 0; while (j < nc - 2 && cum[j + 1] < s) j++;
          const u = cum[j + 1] > cum[j] ? (s - cum[j]) / (cum[j + 1] - cum[j]) : 0, y = lerp(C[j][1], C[j + 1][1], u);
          const tx = C[j + 1][0] - C[j][0], tz = C[j + 1][2] - C[j][2], tl = Math.hypot(tx, tz) || 1, ux = tx / tl, uz = tz / tl, nx = -uz * sg, nz = ux * sg;
          const x = lerp(C[j][0], C[j + 1][0], u) + nx * 0.14, z = lerp(C[j][2], C[j + 1][2], u) + nz * 0.14, c = getC(x, z), y0 = y - 0.3, y1 = y + HT + 0.07, kk = 0.9 + 0.2 * rpHash(Math.round(x * 5), Math.round(z * 5));
          const a = vtx(c, x - ux * 0.1, y0, z - uz * 0.1, nx, 0, nz, POST, kk * 0.75), b = vtx(c, x + ux * 0.1, y0, z + uz * 0.1, nx, 0, nz, POST, kk * 0.75), d = vtx(c, x + ux * 0.1, y1, z + uz * 0.1, nx, 0, nz, POST, kk), e = vtx(c, x - ux * 0.1, y1, z - uz * 0.1, nx, 0, nz, POST, kk);
          tri(c, a, b, d); tri(c, a, d, e);
          const w0 = vtx(c, x - ux * 0.13 - nx * 0.1, y1, z - uz * 0.13 - nz * 0.1, 0, 1, 0, POST, kk), w1 = vtx(c, x + ux * 0.13 - nx * 0.1, y1, z + uz * 0.13 - nz * 0.1, 0, 1, 0, POST, kk), w2 = vtx(c, x + ux * 0.13 + nx * 0.1, y1, z + uz * 0.13 + nz * 0.1, 0, 1, 0, POST, kk), w3 = vtx(c, x - ux * 0.13 + nx * 0.1, y1, z - uz * 0.13 + nz * 0.1, 0, 1, 0, POST, kk);
          tri(c, w0, w1, w2); tri(c, w0, w2, w3);
          fl.posts.push(x - nx * 0.14, z - nz * 0.14, y);
        }
        fl.lines.push({ k: r.k, side: r.side, ref: r.ref, sg, closed: r.closed, len: Lt, posts: np + 1, cols: Float32Array.from(C.flat()) }); fl.len += Lt; fl.cols += nc; fl.np += np + 1;
      }
      const fMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); let verts = 0, tris = 0;
      for (const c of chunks.values()) {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(c.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(c.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c.C, 3));
        g.setIndex(c.v > 65535 ? new THREE.Uint32BufferAttribute(c.I, 1) : new THREE.Uint16BufferAttribute(c.I, 1)); g.computeBoundingSphere();
        const m = new THREE.Mesh(g, fMat); m.name = 'mvFence'; m.castShadow = false; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); verts += c.v; tris += c.I.length / 3;
      }
      if (BAR) { for (const r of FR.runs) if (r.shut) { const P = r.pts, n = P.length / 2, ax = P[0], az = P[1], bx = P[2 * n - 2], bz = P[2 * n - 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;   // the walls across the rings' roads: a row of tyres in front of each face (knockable)
          for (let t = 0.9; t < L - 0.6; t += 1.15) for (const sd of [-1, 1]) { const x = ax + ux * t - uz * sd * 0.62, z = az + uz * t + ux * sd * 0.62; stacks.push({ kind: 'tstack', x, z, yaw: 0, col: Math.round(t / 1.15) % 2 ? 1 : 0, i: T.nearestIdx(x, z) }); exclPush(x, z, 0.8); } }
        for (const st of stacks) out.props.push(st); }
      const bxz = [], boff = [0]; for (const b of blds) { for (const [x, z] of b.pts) bxz.push(x, z); boff.push(bxz.length / 2); }   // (the footprints that were built: for the test that no house is inside the free ground)
      out.fence = { lines: fl.lines, posts: Float32Array.from(fl.posts), skips: FR.skips, bld: { xz: Float32Array.from(bxz), off: Int32Array.from(boff) },
        stats: { length: fl.len, runs: fl.lines.length, columns: fl.cols, posts: fl.np, vertices: verts, triangles: tris, meshes: chunks.size, housesLeftOut: nWallDrop, rwLen, EPS, HT, msRuns: Math.round(msRuns), msGeometry: Math.round(performance.now() - tG0) } };
    }

    /* ---- the trees: where the canopy map has them (its height class), the kind by the land under them (the woods: spruce, Scots pine, beech, a few
       birches; the villages and the fields: lindens, maples, fruit trees, birches, a spruce in a garden; willows and poplars by the water), and the
       single trees and rows OSM maps (instanced per 128 m chunk; over 50 m from the road the plain ones, casting no shadow) ---- */
    const tMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const TK = {}, TKF = {}; for (const k of [0, 1, 2, 4]) TK[k] = new IChunks(API.hjTreeGeo(k), tMat, 200); TKF[0] = TKF[1] = new IChunks(API.hjTreeGeo(0, true), tMat, 320); TKF[2] = TKF[4] = new IChunks(API.hjTreeGeo(4, true), tMat, 320);   // (far from the road: a plain conifer, a plain broadleaf)
    let nTrees = 0;
    {
      const Cn = def.cano, can = new Uint8Array(Cn.nx * Cn.nz), dg = new Int8Array(128); for (let k = 0; k < 64; k++) dg[NR_A64.charCodeAt(k)] = k;
      for (let p = 0, k = 0; k < can.length;) { const s = dg[Cn.rle.charCodeAt(p++)]; let n = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = dg[Cn.rle.charCodeAt(p++)]; n += e; } while (e === 63 && p < Cn.rle.length); } can.fill(s >> 3, k, Math.min(can.length, k + n)); k += n; }
      const RT = rng(4461), PK = [0, 0.18, 0.5, 0.66, 0.72, 0.76, 0.78, 0.8], tHash = new Map(), THC = 4;
      const treeOK = (x, z) => { if (occAt(x, z) || excluded(x, z) || mvW(x, z).e > -1.5) return false; const n = mvNear(x, z); if (n.i >= 0 && n.dd < 1.2) return false; return !onRoad(x, z, 1.5); };
      const plant = (x, z, h, sp, r1, r2, tint) => {
        const y = mvGround(x, z), wid = h * (sp === 0 ? 0.48 + r2 * 0.14 : sp === 1 ? 0.6 + r2 * 0.2 : sp === 2 ? 0.58 + r2 * 0.2 : 0.78 + r2 * 0.25), cv = 0.86 + r1 * 0.24, t = tint || [1, 1, 1];
        const n = mvNear(x, z); (n.i >= 0 && n.dd < 50 ? TK : TKF)[sp].add(x, y - 0.15, z, r1 * 70, wid, h, [cv * (0.95 + r2 * 0.08) * t[0], cv * t[1], cv * (0.95 + r1 * 0.08) * t[2]]); nTrees++;
        const key = Math.floor(x / THC) + ',' + Math.floor(z / THC); let L = tHash.get(key); if (!L) tHash.set(key, L = []); L.push(x, z); };
      const nearTree = (x, z, r2) => { const cx = Math.floor(x / THC), cz = Math.floor(z / THC); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = tHash.get((cx + a) + ',' + (cz + b)); if (L) for (let q = 0; q < L.length; q += 2) if ((L[q] - x) ** 2 + (L[q + 1] - z) ** 2 < r2) return true; } return false; };
      const TR = def.trees || []; for (let k = 0; k + 1 < TR.length; k += 2) { const x = TR[k], z = TR[k + 1], r1 = RT(), r2 = RT(); if (vrDist(x, z) > 300 || !treeOK(x, z)) continue; plant(x, z, 9 + r1 * 7, 4, r1, r2); }
      for (let j = 0; j < Cn.nz; j++) for (let i = 0; i < Cn.nx; i++) { const c = can[j * Cn.nx + i]; if (!c) continue; const r0 = RT(), r1 = RT(), r2 = RT(), r3 = RT();
        if (r0 > PK[Math.min(c, 7)] * dens) continue;
        const x = Cn.x0 + (i + 0.15 + r1 * 0.7) * Cn.cell, z = Cn.z0 + (j + 0.15 + r2 * 0.7) * Cn.cell, hd = vrDist(x, z); if (hd > 280) continue;
        if (hd > 120 && ((i + j) & 1)) continue;   // (farther out every other cell: the bigger trees close the canopy from above)
        if (nearTree(x, z, 10) || !treeOK(x, z)) continue;
        const lc = vrLC(x, z), wetN = mvW(x, z).e > -18;
        let sp, tint = null;
        if (wetN) { sp = r3 < 0.85 ? 4 : 2; tint = r3 < 0.4 ? [1.12, 1.1, 0.96] : null; }   // (willows, poplars: paler)
        else if (lc === 1) sp = r3 < 0.36 ? 0 : r3 < 0.58 ? 1 : r3 < 0.66 ? 2 : 4;
        else if (lc === 3 || lc === 7) sp = r3 < 0.62 ? 4 : r3 < 0.78 ? 2 : r3 < 0.95 ? 0 : 1;
        else sp = r3 < 0.76 ? 4 : r3 < 0.86 ? 2 : r3 < 0.95 ? 0 : 1;
        const h = Math.max(4, c * 4 * (0.85 + r1 * 0.3));
        plant(x, z, sp === 4 && lc === 2 ? Math.min(h, 7) : h, sp, r2, r3, tint);
      }
    }
    for (const k of [0, 1, 2, 4]) TK[k].addTo(root, true); TKF[0].addTo(root, false); TKF[4].addTo(root, false);

    /* ---- spectators: the start and the finish, the checkpoints, the roundabouts, the bridge's ends, groups along the way ---- */
    const CRF = crowdSub(CR);
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const onRd = (x, z) => T.onAlt(x, z) || T.rings.some(R => R.zr > 0 && Math.hypot(x - R.x, z - R.z) < R.zr + 1);   // (not on a road a car may take: an oncoming lane, a ring's road round the island)
      const Mo = { first: 1.2, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: (x, z) => hard(x, z) || occAt(x, z) === 3 || mvW(x, z).e > -2 || onRd(x, z), sit: 0.2, flag: 0.12, keepBar: 1.2 };
      const run = (sa, sb, side, o, C) => crowdRun(C || CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, Mo, o));
      for (const sd of [-1, 1]) { run(sStart - 50, sStart + 60, sd, { rows: 2, dens: 0.55, label: 'MV start' }); run(sFin - 60, sFin + 12, sd, { rows: 2, dens: 0.55, label: 'MV finish' }, CRF); }
      T.cpS.forEach((s0) => { for (const sd of [-1, 1]) run(s0 - 20, s0 + 16, sd, { rows: 2, dens: 0.4, label: 'MV cp' }); });
      for (const r of M.rings) if (r.drive) { const i = T.nearestIdx(r.x, r.z), s0 = i * ds; run(s0 - 40, s0 + 40, -1, { rows: 2, dens: 0.3, clump: 0.9, label: 'MV ring' }); }
      for (const [a, b] of def.bridges || []) for (const s0 of [sStart + a - 30, sStart + b + 5]) for (const sd of [-1, 1]) run(s0, s0 + 25, sd, { rows: 2, dens: 0.35, clump: 0.9, label: 'MV bridge' });
      for (let s = sStart + 500; s < sFin - 300; s += 640) { const sd = rpHash(Math.round(s), 3) < 0.5 ? -1 : 1; run(s, s + 22, sd, { rows: 2, dens: 0.3, clump: 0.9, label: 'MV group' }); }
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const banMat = new THREE.MeshLambertMaterial({ map: mvAtlas(T.cpS.map(s => Math.round(T.altAt(T.hy[T.idx(s)])) + ' m')), side: THREE.FrontSide });
    const bm = addM(ban, banMat, true); if (bm) bm.castShadow = false;
    const bm3 = addM(ban3, new THREE.MeshLambertMaterial({ map: mvAtlas3(stubNames), side: THREE.FrontSide }), true); if (bm3) bm3.castShadow = false;
    addM(finS, matV, true, finG); addM(finB, banMat, false, finG);
    crowdFinish(CR, root, out);
    out.crowdN += crowdLayer(CRF, finG);
    out.stats = { trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, sideRoads: (T.stubs || []).length };
    out.knock = {}; for (const p of out.props) out.knock[p.kind] = (out.knock[p.kind] || 0) + 1;   // (the knockable things by kind, read by the tests)
    MVGC.G = MVGC.m = null;   // (the build's colour memo freed)
    return out;
  }

  World.keep('VR', 'medvode');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.medvode = (scene, tex, opts) => buildMedvode(scene, tex, opts);
})();
