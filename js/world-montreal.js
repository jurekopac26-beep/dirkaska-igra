/* =========================================================================
   WORLD — Montréal (theme 'montreal'): the circuit on Île Notre-Dame in the St. Lawrence. Its own builder (World.theme), in a file of its
   own: it uses World's shared helpers (World.kit) and the scenery data of js/data/montreal.js (OpenStreetMap, Copernicus DEM, ESA WorldCover).
   What it builds: the island on its real outline (the banks dropping into the river, the rowing basin, the lake with its beach, the canals),
   the island's roads, paths and car parks, the circuit (asphalt, red and white kerbs, concrete walls with catch fences, tyre walls at the
   slow corners), the pit lane on the left of the straight with the paddock building, the grandstands and the fans, the buildings of the
   island in their real outlines (the old exhibition pavilions, the casino plain and without any name), the geodesic dome on Île Sainte-
   Hélène, the Concorde bridge over the circuit, the junctions where the island's roads cross the circuit (closed by fences for the race,
   their traffic lights hung over the road on mast arms in the Québec way, stop signs, hydrants, bins, lamps, cabinets and bollards, all of
   it knockable: World props, Core's loose props), trees from the land cover, ships on the river and in the seaway, and the view beyond
   the near island (the towers of downtown Montréal, Mount Royal, the Jacques-Cartier bridge, the south shore), drawn as a backdrop
   that moves with the camera (inside its far plane). Only place names; no names of the circuit, events, people, firms or brands.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.theme) return;
  const { clamp, lerp, sstep, rng } = Core, TAU = Math.PI * 2;
  const { GB, box, cyl, cone, ico } = World, K = World.kit;
  const WL = -2.3;   // the water's level below the road (the island ~10 m a.s.l., the river and the basins ~5-8 m)

  // ---- decode helpers ----
  const b64 = (s) => { const b = atob(s), a = new Uint8Array(b.length); for (let k = 0; k < b.length; k++) a[k] = b.charCodeAt(k); return a; };
  const hash = (a, b) => { let h = Math.imul((a * 73856093) ^ (b * 19349663), 0x9e3779b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca77); h ^= h >>> 13; return (h >>> 0) / 4294967296; };

  // ---- a raster of polygons (even-odd, holes included) on a grid: fills M[k] = v where the cell centre lies inside ----
  function rasterPoly(M, G, rings, v) {
    let z0 = 1e9, z1 = -1e9; for (const r of rings) for (const p of r) { z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    const j0 = Math.max(0, Math.floor((z0 - G.z0) / G.c)), j1 = Math.min(G.nz - 1, Math.ceil((z1 - G.z0) / G.c)), xs = [];
    for (let j = j0; j <= j1; j++) {
      const z = G.z0 + j * G.c; xs.length = 0;
      for (const r of rings) for (let a = 0, b = r.length - 1; a < r.length; b = a++) { const za = r[a][1], zb = r[b][1]; if ((za > z) !== (zb > z)) xs.push(r[a][0] + (z - za) / (zb - za) * (r[b][0] - r[a][0])); }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) { const i0 = Math.max(0, Math.ceil((xs[k] - G.x0) / G.c)), i1 = Math.min(G.nx - 1, Math.floor((xs[k + 1] - G.x0) / G.c)); for (let i = i0; i <= i1; i++) M[j * G.nx + i] = v; }
    }
  }
  // (the grid's vertices: (x0 + i c, z0 + j c))
  // two-pass chamfer distance (metres) to the cells where seed(k) is true
  function chamfer(G, seed) {
    const n = G.nx * G.nz, D = new Float32Array(n), c = G.c, d2 = c * Math.SQRT2;
    for (let k = 0; k < n; k++) D[k] = seed(k) ? 0 : 1e9;
    for (let j = 0; j < G.nz; j++) for (let i = 0; i < G.nx; i++) { const k = j * G.nx + i; let v = D[k];
      if (i > 0) v = Math.min(v, D[k - 1] + c); if (j > 0) { v = Math.min(v, D[k - G.nx] + c); if (i > 0) v = Math.min(v, D[k - G.nx - 1] + d2); if (i < G.nx - 1) v = Math.min(v, D[k - G.nx + 1] + d2); } D[k] = v; }
    for (let j = G.nz - 1; j >= 0; j--) for (let i = G.nx - 1; i >= 0; i--) { const k = j * G.nx + i; let v = D[k];
      if (i < G.nx - 1) v = Math.min(v, D[k + 1] + c); if (j < G.nz - 1) { v = Math.min(v, D[k + G.nx] + c); if (i < G.nx - 1) v = Math.min(v, D[k + G.nx + 1] + d2); if (i > 0) v = Math.min(v, D[k + G.nx - 1] + d2); } D[k] = v; }
    return D;
  }

  /* ---- the island's ground: a 4 m grid over the near region (the track's box and 820 m round it): water (OSM polygons), the distance to the
     water and to the circuit, the height (the land a little under the road, the banks falling to below the water's level, the beds under it),
     the land's own kind (ESA WorldCover; OSM land use over it: beach, car parks, gardens, pitches) ---- */
  let MG = null;
  function mtPrep(T, D) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < T.N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    const c = 4, G = { c, x0: Math.floor((x0 - 820) / 64) * 64, z0: Math.floor((z0 - 820) / 64) * 64 };
    G.nx = Math.ceil((x1 + 820 - G.x0) / 64) * 16 + 1; G.nz = Math.ceil((z1 + 820 - G.z0) / 64) * 16 + 1;
    const n = G.nx * G.nz, wet = new Uint8Array(n), kind = new Uint8Array(n);   // kind: 0 grass, 1 trees, 2 built-up, 3 water, 4 sand, 5 car parks, 6 garden, 7 pitch, 8 plazas
    for (const [, rings] of D.water) rasterPoly(wet, G, rings, 1);
    // land cover (10 m cells) under the polygons
    const LC = D.lc, lcA = new Uint8Array(LC.nx * LC.nz); { const r = b64(LC.rle); let p = 0; for (const v of r) { lcA.fill(v >> 6, p, p + (v & 63)); p += v & 63; } }
    for (let j = 0; j < G.nz; j++) for (let i = 0; i < G.nx; i++) { const x = G.x0 + i * c, z = G.z0 + j * c, a = Math.floor((x - LC.x0) / LC.cell), b = Math.floor((z - LC.z0) / LC.cell);
      const v = a >= 0 && b >= 0 && a < LC.nx && b < LC.nz ? lcA[b * LC.nx + a] : 0; kind[j * G.nx + i] = v === 3 ? 0 : v; }
    const LU = { sand: 4, beach: 4, parking: 5, pedestrian: 8, plaza: 8, garden: 6, flowerbed: 6, pitch: 7, grass: 0, park: 0, wood: 1, scrub: 1 };
    for (const [cl, ring] of D.lu) if (LU[cl] != null) rasterPoly(kind, G, [ring], LU[cl]);
    const sdW = chamfer(G, (k) => wet[k] === 1), sdL = chamfer(G, (k) => wet[k] === 0);   // (to the water; to the land)
    // distance to the circuit's centre line: its samples seeded, then the chamfer
    const seedT = new Uint8Array(n); for (let i = 0; i < T.N; i++) { const a = Math.round((T.px[i] - G.x0) / c), b = Math.round((T.pz[i] - G.z0) / c); if (a >= 0 && b >= 0 && a < G.nx && b < G.nz) seedT[b * G.nx + a] = 1; }
    const dT = chamfer(G, (k) => seedT[k] === 1);
    { const TH = new Map(), TC = 16;   // within 45 m of the road the true distance to its centre line (the chamfer's octagons would step the banks)
      for (let i = 0; i < T.N; i++) { const key = Math.floor(T.px[i] / TC) * 65536 + Math.floor(T.pz[i] / TC); let L = TH.get(key); if (!L) TH.set(key, L = []); L.push(i); }
      for (let k = 0; k < n; k++) { if (dT[k] > 45) continue; const x = G.x0 + (k % G.nx) * c, z = G.z0 + Math.floor(k / G.nx) * c, a0 = Math.floor(x / TC), b0 = Math.floor(z / TC); let best = 1e18;
        for (let a = a0 - 3; a <= a0 + 3; a++) for (let b = b0 - 3; b <= b0 + 3; b++) { const L = TH.get(a * 65536 + b); if (!L) continue;
          for (const i of L) { const j = (i + 1) % T.N, ax = T.px[i], az = T.pz[i], vx = T.px[j] - ax, vz = T.pz[j] - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1e-9), 0, 1), dx = x - ax - vx * t, dz = z - az - vz * t, dd = dx * dx + dz * dz; if (dd < best) best = dd; } }
        dT[k] = Math.sqrt(best); } }
    // near the shores the true distance to the water's outline (the polygons' edges, hashed in 16 m cells): smooth banks, no steps
    const EH = new Map(), EC = 16;
    for (const [, rings] of D.water) for (const r of rings) for (let a = 0, b = r.length - 1; a < r.length; b = a++) {
      const ax = r[b][0], az = r[b][1], bx = r[a][0], bz = r[a][1]; if (Math.max(ax, bx) < G.x0 - 20 || Math.min(ax, bx) > G.x0 + G.nx * c + 20 || Math.max(az, bz) < G.z0 - 20 || Math.min(az, bz) > G.z0 + G.nz * c + 20) continue;
      for (let qa = Math.floor(Math.min(ax, bx) / EC); qa <= Math.floor(Math.max(ax, bx) / EC); qa++) for (let qb = Math.floor(Math.min(az, bz) / EC); qb <= Math.floor(Math.max(az, bz) / EC); qb++) { const key = qa * 65536 + qb; let L = EH.get(key); if (!L) EH.set(key, L = []); L.push(ax, az, bx, bz); } }
    const edgeD = (x, z) => { let best = 1e9; const a0 = Math.floor(x / EC), b0 = Math.floor(z / EC);
      for (let a = a0 - 1; a <= a0 + 1; a++) for (let b = b0 - 1; b <= b0 + 1; b++) { const L = EH.get(a * 65536 + b); if (!L) continue;
        for (let q = 0; q < L.length; q += 4) { const ax = L[q], az = L[q + 1], vx = L[q + 2] - ax, vz = L[q + 3] - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1e-9), 0, 1), dx = x - ax - vx * t, dz = z - az - vz * t, dd = dx * dx + dz * dz; if (dd < best) best = dd; } }
      return Math.sqrt(best); };
    const H = new Float32Array(n), SD = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      let sd = wet[k] ? -sdL[k] : sdW[k];
      if (Math.abs(sd) < 14) { const e = edgeD(G.x0 + (k % G.nx) * c, G.z0 + Math.floor(k / G.nx) * c); if (e < 15) sd = wet[k] ? -e : e; }
      SD[k] = sd;   // (+ on the land, metres to the waterline)
      // the height, from the distance to the water only near its edge (a smooth waterline): the bed under the water, the bank rising out of it,
      // steep (3 m) beside the circuit, where the verges stay level with the road, gentle (9 m) elsewhere
      const tgt = dT[k] < 26 ? lerp(-0.03, -0.14, sstep(17, 26, dT[k])) : -0.14;
      let h;
      if (sd <= 0) h = WL - 0.35 + Math.max(-3.2, sd * 0.4);
      else h = lerp(lerp(WL - 0.35, tgt, sstep(0, 3, sd)), lerp(WL - 0.35, tgt, sstep(0, 9, sd)), sstep(26, 40, dT[k]));
      H[k] = h;
    }
    for (const [d, sd, ang, hw] of T.def.junctions || []) {   // (a junction's mouth: the ground level with the road, the furniture stands on it)
      const a = ang * Math.PI / 180, JO = T.def.junctionOff || 11.5, ct = Math.cos(a) / Math.sin(a), e = hw / Math.sin(a), qa = Math.min(T.w * ct, (T.w + JO) * ct) - e - 4.5, qb = Math.max(T.w * ct, (T.w + JO) * ct) + e + 4.5;
      for (let q = qa - 2; q <= qb + 2; q += 1.5) for (let l = T.w; l <= T.w + JO + 1; l += 1.5) { const p = K.atSf(((T.startS + d + q) % T.len + T.len) % T.len, sd * l), ia = Math.round((p[0] - G.x0) / c), ib = Math.round((p[1] - G.z0) / c);
        for (let ee = -1; ee <= 1; ee++) for (let f = -1; f <= 1; f++) { const kk = (ib + f) * G.nx + ia + ee; if (kk >= 0 && kk < n && SD[kk] > 3) H[kk] = Math.max(H[kk], -0.02); } }
    }
    MG = Object.assign(G, { wet, kind, H, SD, dT, x1: G.x0 + (G.nx - 1) * c, z1: G.z0 + (G.nz - 1) * c });
    return MG;
  }
  function gAt(A, x, z) {   // bilinear lookup in a grid array of MG
    const G = MG, gx = clamp((x - G.x0) / G.c, 0, G.nx - 1.001), gz = clamp((z - G.z0) / G.c, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, k = j * G.nx + i;
    return (A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + G.nx] * (1 - u) + A[k + G.nx + 1] * u) * v;
  }
  function mtGround(x, z) {   // the ground mesh's surface (the same two triangles per cell)
    const G = MG; if (!G) return -0.14;
    if (x < G.x0 || z < G.z0 || x > G.x1 || z > G.z1) return WL - 3;
    const gx = (x - G.x0) / G.c, gz = (z - G.z0) / G.c, i = Math.min(G.nx - 2, Math.floor(gx)), j = Math.min(G.nz - 2, Math.floor(gz)), u = gx - i, v = gz - j, A = G.H, k = j * G.nx + i;
    return u + v <= 1 ? A[k] + u * (A[k + 1] - A[k]) + v * (A[k + G.nx] - A[k]) : A[k + G.nx + 1] + (1 - u) * (A[k + G.nx] - A[k + G.nx + 1]) + (1 - v) * (A[k + 1] - A[k + G.nx + 1]);
  }
  const mtKind = (x, z) => { const G = MG, i = Math.round((x - G.x0) / G.c), j = Math.round((z - G.z0) / G.c); return i < 0 || j < 0 || i >= G.nx || j >= G.nz ? 3 : G.wet[j * G.nx + i] ? 3 : G.kind[j * G.nx + i]; };

  function buildMontreal(scene, tex, opts) {
    const T = K.track(), D = MTL_DATA, def = T.def, N = T.N, w = T.w, ds = T.ds, L = T.len, sStart = T.startS, R = rng(4361);
    const root = new THREE.Group(); scene.add(root);
    mtPrep(T, D);
    const out = { root, dyn: {}, groundH: mtGround, camFloor: (x, z) => Math.max(mtGround(x, z), WL), props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    out.bounds = { minX: MG.x0, maxX: MG.x1, minZ: MG.z0, maxZ: MG.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; }, sAt = (d) => (((sStart + d) % L) + L) % L;
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, y, T.pz[i] + T.nz[i] * o];
    const atSf = K.atSf;
    const addM = (g, mat, cast, recv) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = recv !== false; m.castShadow = !!cast; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); return m; };
    const scen = new K.Chunks(192);   // vertex coloured scenery in 192 m chunks
    // tree / building exclusion (hashed circles) and where the junctions' mouths are
    const eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };
    const ctx = { T, D, def, N, w, ds, L, sStart, R, root, out, tex, opts, ownTex, matV, dS, sAt, Pt, atSf, addM, scen, exclPush, excluded };
    ctx.near = mtNear(T);
    const tag = (f, nm) => { const n0 = root.children.length; f(); for (let k = n0; k < root.children.length; k++) if (!root.children[k].name) root.children[k].name = nm; };   // (each part's meshes named after it)
    tag(() => mtGroundMesh(ctx), 'mtGroundMesh');
    tag(() => mtWater(ctx), 'mtWater');
    tag(() => mtRoad(ctx), 'mtRoad');
    tag(() => mtWalls(ctx), 'mtWalls');
    mtLegs(ctx);
    tag(() => mtPits(ctx), 'mtPits');
    tag(() => mtStands(ctx), 'mtStands');
    tag(() => mtBuildings(ctx), 'mtBuildings');
    tag(() => mtRoads(ctx), 'mtRoads');
    tag(() => mtJunctions(ctx), 'mtJunctions');
    tag(() => mtTrees(ctx), 'mtTrees');
    let fade = null; tag(() => { fade = mtBridges(ctx); }, 'mtBridges');
    tag(() => mtBasin(ctx), 'mtBasin');
    const ships = mtShips(ctx), far = mtFar(ctx);
    out.dyn.step = (t, car, cam) => { ships(t); far(cam); fade(t, car); };
    tag(() => scen.addTo(root, matV, true, true), 'mtScen');
    K.crowdFinish(ctx.CR, root, out);
    out.junctionProps = ctx.nJ || 0; out.mg = MG;
    { let m = 1e9; for (let k = 0; k < MG.dT.length; k++) if (MG.SD[k] < 0) m = Math.min(m, MG.dT[k]); out.waterNear = m; }   // (how close the water comes to the centre line)
    return out;
  }

  /* ---- the ground mesh: 256 m chunks of the 4 m grid (cells deep under the water left out), one grass material, the land's kind in its
     vertex colours (soft edges); the car parks, plazas and beaches on top as their own OSM outlines (crisp edges) ---- */
  const KCOL = [[0.68, 0.74, 0.56], [0.52, 0.6, 0.42], [0.66, 0.66, 0.6], [0.6, 0.62, 0.55], [0.86, 0.82, 0.62], [0.62, 0.64, 0.58], [0.95, 1.05, 0.7], [0.82, 1.08, 0.66], [0.72, 0.72, 0.66]];
  function mtGroundMesh(C) {
    const G = MG, mat = new THREE.MeshLambertMaterial({ map: C.tex.grass, vertexColors: true }), grp = new THREE.Group(); C.root.add(grp); C.out.ground = grp;
    const S = 64;   // cells per chunk side (256 m)
    for (let cj = 0; cj < G.nz - 1; cj += S) for (let ci = 0; ci < G.nx - 1; ci += S) {
      const ni = Math.min(S, G.nx - 1 - ci), nj = Math.min(S, G.nz - 1 - cj);
      const P = [], Cl = [], U = [], I = [];
      for (let j = 0; j <= nj; j++) for (let i = 0; i <= ni; i++) {
        const k = (cj + j) * G.nx + ci + i, x = G.x0 + (ci + i) * G.c, z = G.z0 + (cj + j) * G.c, h = G.H[k], kd = G.wet[k] ? 3 : G.kind[k];
        const n1 = hash(ci + i, cj + j), n2 = 0.92 + 0.16 * Math.sin(x * 0.031 + Math.sin(z * 0.027) * 2) * Math.sin(z * 0.023 + x * 0.007);
        let col = KCOL[kd].map(v => v * n2 * (0.96 + 0.08 * n1));
        const sd = G.SD[k]; if (sd < 5) { const t = sstep(5, 0.5, sd); col = [lerp(col[0], 0.72, t), lerp(col[1], 0.69, t), lerp(col[2], 0.6, t)]; }   // (the banks: stony, rip-rap)
        if (h < WL) { const t = sstep(WL, WL - 2, h); col = [lerp(col[0], 0.42, t), lerp(col[1], 0.42, t), lerp(col[2], 0.36, t)]; }
        P.push(x, h, z); Cl.push(col[0], col[1], col[2]); U.push(x / 14, -z / 14);
      }
      const W1 = ni + 1;
      for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) {
        const a = j * W1 + i, b = a + 1, c = a + W1, d = c + 1;
        if (Math.max(P[a * 3 + 1], P[b * 3 + 1], P[c * 3 + 1], P[d * 3 + 1]) < WL - 0.6) continue;   // (deep under the water)
        I.push(a, c, b, b, c, d);
      }
      if (!I.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
    }
    // the car parks (asphalt), the plazas (paving) and the beaches (sand): OSM outlines, a few cm over the ground
    const OV = { parking: [C.tex.asphalt, [0.8, 0.8, 0.82], 8], pedestrian: [C.tex.paving, [0.95, 0.93, 0.88], 3], plaza: [C.tex.paving, [0.95, 0.93, 0.88], 3], sand: [C.tex.sand, [1.0, 0.95, 0.8], 6], beach: [C.tex.sand, [1.0, 0.95, 0.8], 6] };
    const ov = {}, near = C.near;
    for (const [cl, ring] of C.D.lu) { const o = OV[cl]; if (!o || ring.length < 3) continue;
      const pts = ring.map(p => new THREE.Vector2(p[0], p[1])); if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
      let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts, []); } catch (e) { continue; }
      const key = cl === 'beach' ? 'sand' : cl === 'plaza' ? 'pedestrian' : cl, g = ov[key] || (ov[key] = new K.Chunks(256, true)), y = (p) => Math.max(mtGround(p.x, p.y), WL + 0.05) + 0.04;
      for (const [a, b, c] of tris) { const A = pts[a], B = pts[b], Cc = pts[c], m = [(A.x + B.x + Cc.x) / 3, (A.y + B.y + Cc.y) / 3]; if (near(m[0], m[1]).d < 0.5) continue;
        g.get(m[0], m[1]).quadUp([A.x, y(A), A.y], [B.x, y(B), B.y], [Cc.x, y(Cc), Cc.y], [Cc.x, y(Cc), Cc.y], [o[1], o[1], o[1], o[1]], [[A.x / o[2], -A.y / o[2]], [B.x / o[2], -B.y / o[2]], [Cc.x / o[2], -Cc.y / o[2]], [Cc.x / o[2], -Cc.y / o[2]]]); }
    }
    for (const k in ov) { const o = OV[k]; ov[k].addTo(grp, new THREE.MeshLambertMaterial({ map: o[0], vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), false, true); }
  }

  /* ---- the water: one plane at the water's level (the river, the seaway, the rowing basin, the lake, the canals: the ground keeps it out where
     it is land), the shore band along the waterline near the island (paler shallows, the foam lapping on the rip-rap) ---- */
  function mtWater(C) {
    const G = MG, O = { color: 0x4a7f8e, len: 1.6, amp: 0.9, refl: 0.5, land: 0.25, shal: 0.25, lap: 0.3 };
    const wm = K.waterMat(C.tex, O), S = 7000, g = new THREE.PlaneGeometry(2 * S, 2 * S, 1, 1); g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, (uv.getX(k) - 0.5) * 2 * S / 9, (uv.getY(k) - 0.5) * 2 * S / 9);
    const m = new THREE.Mesh(g, wm); m.position.set((G.x0 + G.x1) / 2, WL, (G.z0 + G.z1) / 2); m.receiveShadow = true; m.updateMatrix(); m.matrixAutoUpdate = false; C.root.add(m);
    C.out.dyn.water = C.tex.water;
    const sd = (x, z) => gAt(G.dT, x, z) > 320 ? 99 : -gAt(G.SD, x, z);   // (the band only along the shores near the circuit: the rest is open water to it)
    for (let z = G.z0; z < G.z1; z += 512) for (let x = G.x0; x < G.x1; x += 512) {   // (in 512 m tiles: culled apart)
      const band = K.shoreBand(x, z, Math.min(G.x1, x + 512), Math.min(G.z1, z + 512), WL + 0.01, sd, 9, { F: 4 }); if (band) K.addShore(C.root, band, wm, O); }
  }

  /* ---- the circuit: asphalt (the racing line rubbered in, darker in the braking zones), white edge lines, red and white kerbs, the verges
     inside the barriers (grass, or asphalt run-off where the barrier stands far out; the junctions' mouths paved), the start line and the grid ---- */
  function mtRoad(C) {
    const { T, N, w, ds, tex, Pt, addM } = C, CH = 128, offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); C.out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true }), gMat = new THREE.MeshLambertMaterial({ map: tex.grass, vertexColors: true });
    C.aMat = aMat; C.lMat = lMat;
    const kerb = [new Uint8Array(N), new Uint8Array(N)];
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) if (side * k > 0 || Math.abs(k) > 1 / 60) kerb[side > 0 ? 1 : 0][i] = 1; }
    const brk = new Float32Array(N);
    for (const c of T.corners) if (c.sev >= 2) for (let k = -60; k <= 6; k++) { const i = (c.i0 + k + N) % N, f = k < -10 ? sstep(-60, -12, k) : sstep(6, -10, k); if (f > brk[i]) brk[i] = f; }
    const shade = (i, o) => { const rl = T.rl[i]; let k = (0.84 - (0.15 + 0.12 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5)) * (0.96 + 0.06 * Math.sin(i * 0.013)); if (Math.abs(o) > w * 0.92) k -= 0.03; return [k, k, k * 1.02]; };
    const jMouth = C.jm = [new Float32Array(N), new Float32Array(N)];   // per sample: how far the junction mouth paving reaches (0: none)
    for (const [d, sd, ang, hw] of C.def.junctions || []) { const half = hw / Math.max(0.35, Math.sin(ang * Math.PI / 180)) + 4.5;
      for (let q = -half - 3; q <= half + 3; q += ds) { const i = T.idx(C.sAt(d + q)), f = Math.min(sstep(-half - 3, -half, q), sstep(half + 3, half, q)); jMouth[sd > 0 ? 1 : 0][i] = Math.max(jMouth[sd > 0 ? 1 : 0][i], f); } }
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new K.RB(true), gl = new K.RB(), gk = new K.RB(true), gv = new K.RB(true), gp = new K.RB(true);
      let pr = -1, pl = -1; const pk = [-1, -1], pv = [-1, -1], pp = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const wl = [0.94, 0.94, 0.9], l = gl.row([Pt(i, -w + 0.15, 0.034), Pt(i, -w + 0.45, 0.034), Pt(i, w - 0.45, 0.034), Pt(i, w - 0.15, 0.034)], [wl, wl, wl, wl]); if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        for (const side of [-1, 1]) {
          const si = side > 0 ? 1 : 0, bar = side > 0 ? T.br[i] : T.bl[i], kb = kerb[si][i], e0 = w + (kb ? T.curbW : 0);
          if (kb) { const cw = T.curbW, pf = [[w - 0.02, 0.035], [w + 0.14, 0.078], [w + cw - 0.12, 0.085], [w + cw + 0.02, 0.03]], vv = ii * ds / 2, sh = [0.84, 1, 1, 0.78].map(k => [k, k, k]), us = [0, 0.1, 0.92, 1], o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
            const rk = gk.row(o.map(k => Pt(i, side * pf[k][0], pf[k][1])), o.map(k => sh[k]), o.map(k => [us[k], vv])); if (pk[si] >= 0) gk.link(pk[si], rk, 0, 3); pk[si] = rk; } else pk[si] = -1;
          // the verge from the kerb (or the edge) to the barrier: grass, paved in the run-offs (the barrier far out) and the junctions' mouths
          const paved = (side > 0 ? T.gravR : T.gravL)[i] && !(jMouth[si][i] > 0.01), gc = [0.72, 0.78, 0.62], ys = -0.02;
          if (!kb) { const vp = [Pt(i, side * w, 0.022), Pt(i, side * (w + 0.7), -0.02)], vc = [gc, gc], op = side > 0 ? vp : vp.slice().reverse();   // (a narrow grass edge along the asphalt; the ground mesh beyond)
            const rv = gv.row(op, vc, op.map(p => [p[0] / 14, -p[2] / 14])); if (pv[si] >= 0) gv.link(pv[si], rv, 0, 1); pv[si] = rv; } else pv[si] = -1;
          if (paved) { const pc = [1.02, 1.02, 1.04], q0 = Pt(i, side * (e0 + 0.05), 0.026), q1 = Pt(i, side * Math.max(e0 + 0.3, bar - 0.3), 0.026), qq = side > 0 ? [q0, q1] : [q1, q0];
            const rp = gp.row(qq, [pc, pc], qq.map(p => [p[0] / 8, -p[2] / 8])); if (pp[si] >= 0) gp.link(pp[si], rp, 0, 1); pp[si] = rp; } else pp[si] = -1;
        }
      }
      addM(gr, aMat); addM(gl, lMat); addM(gk, cMat); addM(gv, gMat); addM(gp, aMat);
    }
    // the start line and the grid
    { const sS = C.sStart, gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wh = [0.93, 0.93, 0.9], Q = (s, o, y) => { const p = C.atSf(s, o); return [p[0], y, p[1]]; };
      gq.quadUp(Q(sS - 0.8, -w, 0.04), Q(sS - 0.8, w, 0.04), Q(sS + 0.8, w, 0.04), Q(sS + 0.8, -w, 0.04), [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) { const sb = sS - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.0;
        gw.quadUp(Q(sb, lat - 1.5, 0.037), Q(sb, lat + 1.5, 0.037), Q(sb + 0.35, lat + 1.5, 0.037), Q(sb + 0.35, lat - 1.5, 0.037), [wh, wh, wh, wh]);
        gw.quadUp(Q(sb - 1.6, lat - 1.5, 0.037), Q(sb + 0.35, lat - 1.5, 0.037), Q(sb + 0.35, lat - 1.25, 0.037), Q(sb - 1.6, lat - 1.25, 0.037), [wh, wh, wh, wh]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat); }
  }

  /* ---- the barriers: concrete walls (the street circuit's blocks, white with a grey foot, the game's own adverts on some), tyre walls round the
     outside of the slow corners, catch fences on poles above them; across a junction's mouth a fence over concrete blocks ---- */
  function mtWalls(C) {
    const { T, N, ds, Pt, addM, tex } = C, side2 = (s) => (s > 0 ? 1 : 0), CH = 128;
    const tyreOn = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) { if (c.sev < 3) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 8; k <= i1c + 12; k++) { const ii = ((k % N) + N) % N, bar = si ? T.br[ii] : T.bl[ii]; if (bar > T.w + 6 && !C.jm[si][ii]) tyreOn[si][ii] = 1; } }
    const kindAt = (i, side) => {   // -1 none (the pit lane's way in and out), 1 concrete, 2 tyres
      if (side < 0 && C.def.pit) { const p = T.pitAt(i * ds); if (p && p.gap) return -1; }
      return tyreOn[side2(side)][i] ? 2 : 1;
    };
    C.wallKind = kindAt;
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const conc = [0.9, 0.9, 0.88], concD = [0.62, 0.62, 0.6], W1 = [1, 1, 1];
    const wallRow = (gr, i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.1), o2 = side * (bar + 0.5), o3 = side * (bar + 0.7);   // a jersey profile: a sloped foot, the upright face, the top
      let p = [Pt(i, o - side * 0.1, -0.3), Pt(i, o - side * 0.08, 0.12), Pt(i, o + side * 0.12, 0.3), Pt(i, o + side * 0.2, 1.05), Pt(i, o2, 1.05), Pt(i, o3, 0.2)], c = [concD, concD, conc, conc, [0.96, 0.96, 0.94], concD];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    const tyreRow = (gt, i, side, u) => { const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.1), o2 = side * (bar + 0.9), dk = [0.3, 0.3, 0.32];
      let p = [Pt(i, o, -0.1), Pt(i, o, 0.95), Pt(i, o2, 0.95)], uv = [[u, 0.02], [u, 0.98], [u, 0.98]], c = [W1, W1, dk];
      if (side < 0) { p = p.reverse(); uv = uv.slice().reverse(); c = c.slice().reverse(); }
      return gt.row(p, c, uv); };
    const fence = [new Uint8Array(N), new Uint8Array(N)];
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new K.RB(), gt = new K.RB(true);
      for (const side of [-1, 1]) {
        let prev = -1, pk = -2, acc = c0 * ds;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++, acc += ds) {
          const i = ii % N, k = kindAt(i, side);
          if (prev >= 0 && k !== pk) { if (pk === 2) gt.link(prev, tyreRow(gt, i, side, acc / 3), 0, 2); else if (pk >= 0) gr.link(prev, wallRow(gr, i, side), 0, 5); prev = -1; }
          if (k < 0) { pk = k; continue; }
          const r = k === 2 ? tyreRow(gt, i, side, acc / 3) : wallRow(gr, i, side);
          if (prev >= 0) { if (k === 2) gt.link(prev, r, 0, 2); else gr.link(prev, r, 0, 5); } prev = r; pk = k;
          fence[side2(side)][i] = k;
        }
      }
      addM(gr, rMat, true); addM(gt, tyMat, true);
    }
    // the game's own adverts on the concrete walls (tex.sponsors: 4 m boards), where the wall runs straight along the road
    { const sb = new K.Chunks(192, true);
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 2) {
        const j = (i + 2) % N, bar = side > 0 ? T.br : T.bl; if (kindAt(i, side) !== 1 || kindAt(j, side) !== 1 || Math.abs(bar[i] - bar[j]) > 0.3 || C.jm[side2(side)][i] > 0 || (i >> 1) % 5 > 2) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, o = (ii) => side * (bar[ii] + 0.32);
        const A = Pt(i, o(i), 0.32), B = Pt(j, o(j), 0.32), Cq = Pt(j, o(j), 1.0), Dq = Pt(i, o(i), 1.0), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        sb.get(A[0], A[2]).quadO(A, B, Cq, Dq, W1, Pt(i, side * (bar[i] + 2), 0.6), [[uL, v1 - 0.25], [uR, v1 - 0.25], [uR, v1], [uL, v1]]); }
      sb.addTo(C.root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true); }
    // catch fences on the walls (and taller behind the tyre walls)
    const fg = new K.Chunks(192, true);
    for (const side of [-1, 1]) {
      const fc = fence[side2(side)], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N; if (!fc[i] || !fc[j]) { acc += ds; continue; }
        const e = fc[i] === 2 ? 1.2 : 0.55, top = fc[i] === 2 ? 4.4 : 3.6, Q = (ii, y) => Pt(ii, side * (bar[ii] + e), y);
        const u0 = acc / 2.5, u1 = (acc + ds) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        fg.get(ins[0], ins[2]).quadO(Q(i, 1.0), Q(j, 1.0), Q(j, top), Q(i, top), W1, ins, [[u0, 0], [u1, 0], [u1, (top - 1) / 2.5], [u0, (top - 1) / 2.5]]);
        if (i % 2 === 0) { const p = Q(i, 0); box(C.scen.get(p[0], p[2]), p[0], 0.9, p[2], 0.09, top - 0.8, 0.09, T.hd[i], [0.55, 0.56, 0.58]); }
        acc += ds;
      }
    }
    fg.addTo(C.root, fMat, false, true);
    // the wall at the exit of the last chicane (right, -205 .. -135 m): white, the province's greeting painted on it in blue
    { const bt = mtBoardTex(C, ['BIENVENUE AU QUÉBEC'], '#f2f2ee', '#1d4f9e', null, 1024, 64);
      for (const [d, wd] of [[-186, 22], [-160, 22]]) { const s = C.sAt(d), i = T.idx(s), o = T.br[i] + 0.33, x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        const m = mtPlane(C, bt, x, 0.3, z, wd, 0.62, Math.atan2(-T.nz[i], -T.nx[i])); m.castShadow = false; } }
  }

  /* ---- a canvas text board (a texture of its own): text on a colour, an edge stripe ---- */
  function mtBoardTex(C, lines, bg, fg, stripe, W, H) {
    const c = document.createElement('canvas'); c.width = W || 512; c.height = H || 128; const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); if (stripe) { x.fillStyle = stripe; x.fillRect(0, c.height - 10, c.width, 10); x.fillRect(0, 0, c.width, 5); }
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((t, k) => { const px = Math.round(c.height * (lines.length > 1 ? 0.34 : 0.56)); x.font = '900 ' + px + 'px Arial, sans-serif'; x.fillText(t, c.width / 2, c.height * (k + 0.55) / lines.length, c.width - 24); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return C.ownTex(t);
  }
  function mtPlane(C, map, x, y, z, W, H, yaw, both) {   // an upright textured board (bottom centre x, y, z) facing along yaw
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map, side: both ? THREE.DoubleSide : THREE.FrontSide }));
    m.position.set(x, y + H / 2, z); m.rotation.y = Math.PI / 2 - yaw; m.castShadow = true; m.receiveShadow = true; m.updateMatrix(); m.matrixAutoUpdate = false; C.root.add(m); return m;
  }

  /* ---- the pit lane on the left of the straight (Core.Track.pitAt, def.pit[0] < 0: offsets negative): the lane and its lines, the apron, the
     teams' stands on the strip behind the pit wall, the crews' boxes (out.pitBoxes: their frames mirrored, so the renderer's crews work to the
     left), the paddock building on its OSM outline (garages open to the lane, two glazed floors over them, a roof terrace), the start gantry ---- */
  const TEAM = [[0.86, 0.1, 0.12], [0.12, 0.16, 0.36], [0.16, 0.46, 0.3], [0.96, 0.52, 0.1], [0.94, 0.94, 0.92], [0.14, 0.14, 0.16], [0.16, 0.36, 0.8], [0.1, 0.62, 0.72], [0.96, 0.78, 0.12], [0.55, 0.26, 0.7], [0.4, 0.42, 0.46], [0.7, 0.1, 0.1], [0.2, 0.3, 0.55]];
  function mtPits(C) {
    const { T, def, ds, sStart, out, scen, atSf, addM, exclPush } = C, PD = def.pit; if (!PD) return;
    const sg = PD[0] < 0 ? -1 : 1, [pq0, pq1] = def.pitRow, PB = def.pitBld, lMat = C.lMat, aMat = C.aMat;
    const at = (s, o, y) => { const p = atSf(s, sg * o); return [p[0], y, p[1]]; };   // (o: metres out towards the pits)
    const gl = new GB(true), gp = new GB(), one = [1, 1, 1], wl = [0.95, 0.95, 0.94], apC = [0.8, 0.81, 0.78], yel = [0.98, 0.82, 0.12];
    const quad = (g, s0, s1, o0, o1, o2, o3, y, c, uv) => { const A = at(s0, o0, y), B = at(s0, o1, y), Cq = at(s1, o2, y), Dq = at(s1, o3, y); g.quadUp(A, B, Cq, Dq, [c, c, c, c], uv ? [A, B, Cq, Dq].map(p => [p[0] / 8, -p[2] / 8]) : undefined); };
    for (let q = PD[1]; q < PD[2]; q += 2) {
      const s0 = sStart + q, s1 = s0 + 2, pi = T.pitAt(s0), pj = T.pitAt(s1); if (!pi || !pj) continue;
      const oi = pi.o * sg, oj = pj.o * sg;
      quad(gl, s0, s1, oi - 3.5, oi + 3.5, oj + 3.5, oj - 3.5, 0.024, one, true);
      quad(gp, s0, s1, oi + 3.18, oi + 3.36, oj + 3.36, oj + 3.18, 0.033, wl);
      if (((q / 2) | 0) % 2 === 0) quad(gp, s0, s1, oi - 3.36, oi - 3.18, oj - 3.18, oj - 3.36, 0.033, wl);
      if (pi.t > 0.999 && pj.t > 0.999) { quad(gp, s0, s1, pi.wall + 0.45, oi - 3.5, oj - 3.5, pj.wall + 0.45, 0.022, [0.72, 0.72, 0.7]);   // (the strip behind the pit wall: concrete)
        quad(gp, s0, s1, oi + 3.5, PB[2], PB[2], oj + 3.5, 0.022, apC); if (q % 20 === 0) quad(gp, s0, s1, oi + 3.5, oi + 3.7, oj + 3.7, oj + 3.5, 0.03, wl); }
      else if (pi.t > 0.05) quad(gl, s0, s1, oi + 3.5, Math.max(oi + 3.6, PB[2] * pi.t), Math.max(oj + 3.6, PB[2] * pj.t), oj + 3.5, 0.02, one, true);   // (the way in and out: asphalt out to the building line)
    }
    // the 80 km/h line across the lane at its two ends
    for (const q of [PD[1] + 45, PD[2] - 34]) { const p = T.pitAt(sStart + q); if (p) quad(gp, sStart + q, sStart + q + 0.4, p.o * sg - 3.4, p.o * sg + 3.4, p.o * sg + 3.4, p.o * sg - 3.4, 0.036, wl); }
    // the crews' boxes (13, 10 m apart), the dividers, the player's yellow stop box
    const kb = (g, s, o, y, sx, sy, sz, col, top) => { const [x, z, hd] = atSf(s, sg * o); box(g, x, y, z, sx, sy, sz, hd, col, top); };
    let nb = 0;
    for (let q = pq0, k = 0; q <= pq1; q += 10, k++) {
      const s0 = sStart + q, i = T.idx(s0 + 5), p = T.pitAt(s0); if (!p || p.t < 0.999) continue;
      const base = p.o * sg + 3.5, tx = T.tx[i], tz = T.tz[i], nx = T.nx[i] * sg, nz = T.nz[i] * sg, mine = Math.abs(q + 5 - PD[3]) < 1, tc = TEAM[k % TEAM.length];
      quad(gp, s0 - 0.09, s0 + 0.09, base, PB[2], PB[2], base, 0.034, wl);
      const oc = atSf(s0 + 5, 0);
      if (mine) { const sb = s0 + 5, lo = p.o * sg; out.pitBox = { s: sb, x: oc[0] + nx * (base + 4), z: oc[1] + nz * (base + 4), hd: T.hd[i], tx, tz, nx, nz, lane: lo, wallO: p.wall, apron0: base, garage0: PB[2], stop: atSf(sb, p.o) };
        for (const [d0, d1, l0, l1] of [[-3.2, 3.2, lo - 2.6, lo - 2.35], [-3.2, 3.2, lo + 2.35, lo + 2.6], [-3.2, -2.95, lo - 2.6, lo + 2.6], [2.95, 3.2, lo - 2.6, lo + 2.6]]) quad(gp, sb + d0, sb + d1, l0, l1, l1, l0, 0.036, yel); }
      (out.pitBoxes = out.pitBoxes || []).push({ k: nb++, s: s0 + 5, ox: oc[0], oz: oc[1], tx, tz, nx, nz, hd: T.hd[i], base, lane: p.o * sg, wall: p.wall, team: tc, mine, y: 0 });
      // the team's stand on the pit wall strip: a desk with screens under a roof in the team's colour, stools
      const g = scen.get(oc[0], oc[1]), wv = p.wall;
      kb(g, s0 + 5, wv + 0.8, 0.96, 2.5, 0.06, 1.0, [0.3, 0.31, 0.34], [0.36, 0.37, 0.4]);
      for (const la of [-1.18, 1.18]) for (const lw of [0.35, 1.2]) kb(g, s0 + 5 + la, wv + lw, 0, 0.07, 0.96, 0.07, [0.22, 0.22, 0.24]);
      kb(g, s0 + 5, wv + 0.4, 1.02, 2.1, 0.42, 0.06, [0.07, 0.07, 0.08]);
      for (const pa of [-1.2, 1.2]) kb(g, s0 + 5 + pa, wv + 0.25, 0, 0.08, 2.5, 0.08, [0.25, 0.26, 0.28]);
      kb(g, s0 + 5, wv + 0.9, 2.5, 2.7, 0.07, 1.6, [0.22, 0.23, 0.26], tc);
    }
    { const pbs = out.pitBoxes; T.pitStands = null;
      if (pbs && pbs.length) T.pitStands = [C.dS(pbs[0].s) - 1.35, C.dS(pbs[pbs.length - 1].s) + 1.35]; }
    addM(gl, aMat); addM(gp, lMat);
    // the sign at the pit entry: an arrow and the 80 (no words)
    { const sE = sStart + PD[1] + 22, pE = T.pitAt(sE); if (pE) { const c2 = document.createElement('canvas'); c2.width = 256; c2.height = 160; const x2 = c2.getContext('2d');
      x2.fillStyle = '#1f3f8c'; x2.fillRect(0, 0, 256, 160); x2.strokeStyle = '#f4f1ec'; x2.lineWidth = 7; x2.strokeRect(5, 5, 246, 150); x2.fillStyle = '#f4f1ec';
      x2.beginPath(); x2.moveTo(70, 30); x2.lineTo(24, 64); x2.lineTo(70, 98); x2.lineTo(70, 76); x2.lineTo(120, 76); x2.lineTo(120, 52); x2.lineTo(70, 52); x2.closePath(); x2.fill();
      x2.beginPath(); x2.arc(190, 80, 46, 0, TAU); x2.fill(); x2.strokeStyle = '#c8261f'; x2.lineWidth = 11; x2.beginPath(); x2.arc(190, 80, 40, 0, TAU); x2.stroke();
      x2.fillStyle = '#16171a'; x2.font = '900 44px Arial, sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText('80', 190, 82);
      const [x, z] = atSf(sE, sg * (pE.o * sg + 5.5)), i = T.idx(sE), hd = Math.atan2(-T.tz[i], -T.tx[i]);
      mtPlane(C, C.ownTex(new THREE.CanvasTexture(c2)), x, 1.8, z, 3.2, 2.0, hd); for (const q2 of [-1.2, 1.2]) box(scen.get(x, z), x + Math.cos(hd + Math.PI / 2) * q2, 0, z + Math.sin(hd + Math.PI / 2) * q2, 0.14, 2.0, 0.14, 0, [0.6, 0.62, 0.64]); } }

    /* the paddock building: 326 m along the lane (OSM), its front 22.2 m from the centre line; ground floor garages every 10 m (the crews'
       open, team colours inside; the rest behind grey shutters), two glazed floors above set back behind white slabs, a roof terrace */
    const WH = [0.93, 0.93, 0.91], WT = [0.8, 0.8, 0.82], GLS = [0.3, 0.42, 0.55], GLD = [0.22, 0.3, 0.4], SH = [0.72, 0.74, 0.77], F0 = PB[2], BK = PB[3];
    const face = (g, s0, s1, o, y0, y1, col) => { const A = at(s0, o, y0), B = at(s1, o, y0), Cq = at(s1, o, y1), Dq = at(s0, o, y1), m = at((s0 + s1) / 2, o + 1, (y0 + y1) / 2); g.quadO(A, B, Cq, Dq, col, m); };
    const slab = (g, s0, s1, o0, o1, y0, y1, col, top) => {   // a block along the track between offsets o0 .. o1 (towards the pits), s0 .. s1
      const P8 = [at(s0, o0, y0), at(s1, o0, y0), at(s1, o1, y0), at(s0, o1, y0), at(s0, o0, y1), at(s1, o0, y1), at(s1, o1, y1), at(s0, o1, y1)], m = at((s0 + s1) / 2, (o0 + o1) / 2, (y0 + y1) / 2);
      for (const [a, b, c, d, cc] of [[0, 1, 5, 4, col], [1, 2, 6, 5, col], [2, 3, 7, 6, col], [3, 0, 4, 7, col], [4, 5, 6, 7, top || col]]) g.quadO(P8[a], P8[b], P8[c], P8[d], cc, m); };
    const crewQ = new Set(); for (let q = pq0; q <= pq1; q += 10) crewQ.add(q);
    for (let q = PB[0]; q < PB[1] - 1; q += 10) {
      const s0 = sStart + q, s1 = s0 + 10, mid = atSf(s0 + 5, sg * (F0 + 8)), g = scen.get(mid[0], mid[1]), crew = crewQ.has(q), k = crew ? ((q - pq0) / 10) | 0 : 0;
      slab(g, s0, s1, F0, F0 + 13, 4.2, 4.6, WH, WT);                                   // the ground floor's ceiling
      face(g, s0, s1, F0 + 13, 0, 4.2, crew ? TEAM[k % TEAM.length].map(v => v * 0.8 + 0.1) : [0.5, 0.52, 0.55]);   // the garage's back wall
      for (const e of [0.12, 9.88]) slab(g, s0 + e - 0.12, s0 + e + 0.12, F0, F0 + 13, 0, 4.2, WH);   // side walls
      slab(g, s0, s1, F0 - 0.1, F0 + 0.3, 3.4, 4.2, WH);                               // the header over the door
      if (crew) { slab(g, s0 + 0.3, s1 - 0.3, F0 - 0.14, F0 - 0.1, 3.5, 4.0, TEAM[k % TEAM.length]); slab(g, s0 + 0.3, s1 - 0.3, F0, F0 + 13, 0.0, 0.04, [0.44, 0.46, 0.49], [0.5, 0.52, 0.55]);
        for (const ca of [1.3, 8.7]) slab(g, s0 + ca - 0.55, s0 + ca + 0.55, F0 + 11.8, F0 + 12.6, 0, 1.0, [0.2, 0.21, 0.24]); }
      else { face(g, s0 + 0.25, s1 - 0.25, F0 + 0.3, 0, 3.4, SH); for (let y = 0.4; y < 3.3; y += 0.5) face(g, s0 + 0.25, s1 - 0.25, F0 + 0.29, y, y + 0.05, [0.6, 0.62, 0.65]); }
      slab(g, s0, s1, F0 + 13, BK, 0, 4.6, [0.84, 0.84, 0.82], WT);                     // the back half of the ground floor (offices)
      slab(g, s0, s1, F0 + 0.8, BK - 0.5, 4.6, 8.2, GLS, WH); slab(g, s0, s1, F0, BK, 8.2, 8.6, WH, WT);   // the glazed floors, their slabs
      slab(g, s0, s1, F0 + 1.6, BK - 1.0, 8.6, 11.8, GLD, WH); slab(g, s0, s1, F0 + 0.4, BK, 11.8, 12.2, WH, [0.86, 0.87, 0.88]);
      slab(g, s0, s1, F0 + 0.5, F0 + 0.62, 12.2, 13.2, [0.75, 0.8, 0.85]);              // the terrace's glass railing
      if (q % 30 === 0) { slab(g, s0 + 4.6, s0 + 5.4, F0 + 3, F0 + 9, 12.2, 15.2, WH); slab(g, s0, s1, F0 + 1.5, F0 + 10, 15.2, 15.5, [0.96, 0.96, 0.95], [0.97, 0.97, 0.96]); }   // shades over the terrace
      exclPush(mid[0], mid[1], 16);
    }
    // the paddock behind the building: the teams' motorhomes and trucks in rows (between the building and the rowing basin)
    for (let q = PB[0] + 8, k = 0; q < PB[1] - 10; q += 16, k++) { const s0 = sStart + q, tc = TEAM[k % TEAM.length], [x, z, hd] = atSf(s0, sg * (BK + 7)), g = scen.get(x, z);
      if (k % 2) { box(g, x, 0.3, z, 13.6, 3.6, 2.5, hd, [0.92, 0.92, 0.93], tc); box(g, x + Math.cos(hd) * 7.9, 0.3, z + Math.sin(hd) * 7.9, 2.2, 3.2, 2.5, hd, tc, tc); }
      else { box(g, x, 0, z, 12, 6.0, 6.6, hd, [0.95, 0.95, 0.96], tc); box(g, x, 6.0, z, 12.6, 0.3, 7.2, hd, tc, tc); } exclPush(x, z, 9); }

    // the start gantry: two posts outside the walls, a beam over the road with the five lights, a banner with the town's name
    { const i = T.idx(sStart), [x, z] = [T.px[i], T.pz[i]], h = T.hd[i], g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      const oL = T.bl[i] + 1.0, oR = T.br[i] + 1.0;
      for (const o of [-oL, oR]) box(g, x + nx * o, -0.3, z + nz * o, 0.8, 7.9, 0.8, h, gray);
      const cx = x + nx * (oR - oL) / 2, cz = z + nz * (oR - oL) / 2;
      box(g, cx, 6.4, cz, 1.1, 1.3, oL + oR + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, 7.95, z + nz * o); m.rotation.y = -h; C.root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const bt = mtBoardTex(C, ['MONTRÉAL · QUÉBEC'], '#c8102e', '#ffffff', '#ffffff', 1024, 96);
      for (const sd of [-1, 1]) { const m = mtPlane(C, bt, cx - T.tx[i] * 0.6 * sd, 6.45, cz - T.tz[i] * 0.6 * sd, oL + oR - 1, 1.2, sd > 0 ? Math.atan2(-T.tz[i], -T.tx[i]) : Math.atan2(T.tz[i], T.tx[i])); m.castShadow = false; }
      exclPush(x, z, Math.max(oL, oR) + 6);
    }
  }

  /* ---- grandstands (def.stands [from, to, side, rows, roof]): temporary steel stands behind the walls, tiers following the road with the
     seated crowd picture on them, a roof over the main one; fans on the grass along the circuit (def.ga), the crowd layer ---- */
  const MT_SHIRTS = [[0.86, 0.1, 0.12], [0.95, 0.95, 0.94], [0.86, 0.1, 0.12], [0.12, 0.16, 0.36], [0.98, 0.78, 0.12], [0.16, 0.36, 0.8], [0.12, 0.13, 0.16], [0.94, 0.5, 0.1], [0.18, 0.55, 0.3], [0.6, 0.18, 0.5], [0.86, 0.1, 0.12], [0.95, 0.95, 0.94]];   // (lots of red and white)
  function mtStands(C) {
    const { T, def, ds, sStart, scen, atSf, addM, exclPush, tex } = C, crowdG = new GB(true), W1 = [1, 1, 1];
    const near = (x, z) => { const i = T.nearestIdx(x, z), dx = x - T.px[i], dz = z - T.pz[i], lat = dx * T.nx[i] + dz * T.nz[i]; return Math.abs(lat) - (lat > 0 ? T.br[i] : T.bl[i]); };
    const CR = K.crowdCtx({ gH: mtGround, near, excluded: (x, z) => C.excluded(x, z), water: (x, z) => mtKind(x, z) === 3 || mtGround(x, z) < -0.6, maxSlope: 0.5, shirts: MT_SHIRTS, chunk: 256 });
    C.CR = CR;
    for (const [a, b, side, rows, roof] of def.stands || []) {
      const dep = 0.95, rise = 0.62, st = [];
      for (let d = a; d <= b + 0.01; d += Math.min(5, Math.max(1, b - d))) { const s = C.sAt(d), i = T.idx(s), f0 = (side > 0 ? T.br[i] : T.bl[i]) + 2.4; st.push({ s, f0 }); }
      const F0 = st.map((q, m) => { let t = 0, n = 0; for (let e = -3; e <= 3; e++) { t += st[clamp(m + e, 0, st.length - 1)].f0; n++; } return Math.max(q.f0 - 0.3, t / n); });
      const rowsP = st.map((q, m) => { const f0 = F0[m], prof = [[f0 - 0.3, -0.5]]; let y = 0;
        for (let k = 0; k < rows; k++) { const o = f0 + k * dep; y = 0.55 + k * rise; prof.push([o, y], [o + dep, y]); }
        const back = f0 + rows * dep; prof.push([back, y + 1.2], [back + 0.3, y + 1.2], [back + 0.3, -0.3]);
        return { s: q.s, prof, pts: prof.map(([o, yy]) => { const p = atSf(q.s, side * o); return [p[0], yy, p[1]]; }), top: y + 4.2, o0: f0 + rows * dep * 0.35, o1: back + 0.6 }; });
      for (let m = 0; m + 1 < rowsP.length; m++) {
        const A = rowsP[m], B = rowsP[m + 1], g = scen.get(A.pts[1][0], A.pts[1][2]), n = A.pts.length;
        for (let e = 0; e + 1 < n; e++) { const a0 = A.pts[e], a1 = A.pts[e + 1], b0 = B.pts[e], b1 = B.pts[e + 1], up = Math.abs(a1[1] - a0[1]) < 0.05, om = (A.prof[e][0] + A.prof[e + 1][0]) / 2, ym = (a0[1] + a1[1]) / 2;
          const p = atSf(A.s, side * (up ? om : e >= n - 3 ? om - 1 : om + 1)); g.quadO(a0, a1, b1, b0, up ? [0.55, 0.57, 0.6] : e >= n - 3 ? [0.38, 0.4, 0.44] : [0.45, 0.47, 0.5], [p[0], up ? ym - 1 : ym, p[1]]); }
        for (let k = 0; k < rows; k++) { const a0 = A.pts[1 + k * 2], a1 = A.pts[2 + k * 2], b0 = B.pts[1 + k * 2], b1 = B.pts[2 + k * 2], v = (k * 0.11) % 1, u0 = (m * 5) / 12, len = Math.hypot(b0[0] - a0[0], b0[2] - a0[2]);
          crowdG.quadUp([a0[0], a0[1] + 0.02, a0[2]], [a1[0], a1[1] + 0.02, a1[2]], [b1[0], b1[1] + 0.02, b1[2]], [b0[0], b0[1] + 0.02, b0[2]], [W1, W1, W1, W1], [[u0, v], [u0, v + 0.1], [u0 + len / 12, v + 0.1], [u0 + len / 12, v]]); }
        if (m % 2 === 0) for (let k = 0; k <= rows; k += 3) { const o = A.prof[0][0] + 0.3 + k * dep, y = 0.55 + Math.max(0, k - 1) * rise, p = atSf(A.s, side * o); box(g, p[0], -0.2, p[1], 0.08, y + 0.2, 0.08, 0, [0.5, 0.52, 0.55]); }   // (the scaffold's legs)
        if (roof) { const q = (Rr, o, y) => { const p = atSf(Rr.s, side * o); return [p[0], y, p[1]]; }, tA = A.top, tB = B.top;
          const rc = m % 2 ? [0.9, 0.91, 0.93] : [0.82, 0.84, 0.87];   // (the roof's panels, light and darker in turn; a red fascia along its front)
          g.quadO(q(A, A.o0 + 0.6, tA + 0.75), q(B, B.o0 + 0.6, tB + 0.75), q(B, B.o1, tB), q(A, A.o1, tA), rc, q(A, (A.o0 + A.o1) / 2, tA - 5));
          g.quadO(q(A, A.o0, tA + 0.8), q(B, B.o0, tB + 0.8), q(B, B.o0 + 0.6, tB + 0.75), q(A, A.o0 + 0.6, tA + 0.75), [0.78, 0.1, 0.12], q(A, A.o0 + 0.3, tA - 5));
          g.quadO(q(A, A.o0, tA + 0.5), q(B, B.o0, tB + 0.5), q(B, B.o1, tB - 0.3), q(A, A.o1, tA - 0.3), [0.6, 0.62, 0.66], q(A, (A.o0 + A.o1) / 2, tA + 5));
          if (m % 2 === 0) { const p = atSf(A.s, side * (A.o1 - 0.4)); box(g, p[0], -0.3, p[1], 0.4, tA + 0.3, 0.4, 0, [0.86, 0.87, 0.9]); } }
      }
      for (const r of rowsP) { const p = atSf(r.s, side * (r.prof[0][0] + rows * dep * 0.5)); exclPush(p[0], p[1], rows * dep / 2 + 5); CR.exclAdd(p[0], p[1], rows * dep / 2 + 3); }
    }
    if (!crowdG.empty) addM(crowdG, K.crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.11, 0.1));
    // fans on the grass
    for (const [a, b, side] of def.ga || []) K.crowdRun(CR, sStart + a, sStart + b, side, { rows: 3, dens: 0.55, first: 1.6, gap: 0.9, clump: 0.6, sit: 0.3, flag: 0.08, below: 1.2, above: 2, label: 'ga' });
    for (const [a, b, side] of def.stands || []) K.crowdRun(CR, sStart + a - 12, sStart + a, side, { rows: 2, dens: 0.4, first: 1.6, label: 'standEnd' });
  }

  /* ---- the nearest road sample to (x, z) through a 32 m hash of the samples; its lateral offset and the barrier on that side ---- */
  function mtNear(T) {
    const H = new Map(), c = 32;
    for (let i = 0; i < T.N; i++) { const k = Math.floor(T.px[i] / c) + ',' + Math.floor(T.pz[i] / c); let L = H.get(k); if (!L) H.set(k, L = []); L.push(i); }
    const o = { i: -1, lat: 0, bar: 0, d: 1e9 };
    return (x, z) => {
      const a0 = Math.floor(x / c), b0 = Math.floor(z / c); let bi = -1, bd = 1e18;
      for (let a = a0 - 1; a <= a0 + 1; a++) for (let b = b0 - 1; b <= b0 + 1; b++) { const L = H.get(a + ',' + b); if (L) for (const i of L) { const dx = x - T.px[i], dz = z - T.pz[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } } }
      o.i = bi; if (bi < 0) { o.lat = 1e9; o.bar = 0; o.d = 1e9; return o; }
      o.lat = (x - T.px[bi]) * T.nx[bi] + (z - T.pz[bi]) * T.nz[bi]; o.bar = o.lat > 0 ? T.br[bi] : T.bl[bi]; o.d = Math.abs(o.lat) - o.bar; return o;
    };
  }

  /* ---- the island's roads and paths (OSM; not the circuit, not the bridges): asphalt with a yellow centre line on the roads (the Québec
     way), pale paths; the car parks' bays and parked cars; street lamps along the roads ---- */
  function mtRoads(C) {
    const { D, root, tex, addM, scen, exclPush } = C, near = C.near, G = MG;
    const road = new K.Chunks(192, true), path = new K.Chunks(192, true), mark = new K.Chunks(192), aMat = C.aMat;
    const legs = C.legs || [];
    const inLeg = (x, z) => { for (const L of legs) { const dx = x - L.cx, dz = z - L.cz, r = dx * L.ux + dz * L.uz, v = -dx * L.uz + dz * L.ux; if (r > L.r0 - 2 && r < L.rEnd + 4 && Math.abs(v) < L.hw + 3) return true; } return false; };
    const yel = [0.95, 0.75, 0.12], W1 = [1, 1, 1];
    const lampAt = [], rm = new Uint8Array(G.nx * G.nz), mk = (x, z, r) => { const i0 = Math.floor((x - r - G.x0) / G.c), i1 = Math.ceil((x + r - G.x0) / G.c), j0 = Math.floor((z - r - G.z0) / G.c), j1 = Math.ceil((z + r - G.z0) / G.c);
      for (let j = Math.max(0, j0); j <= Math.min(G.nz - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(G.nx - 1, i1); i++) rm[j * G.nx + i] = 1; };
    C.roadMask = (x, z) => { const i = Math.round((x - G.x0) / G.c), j = Math.round((z - G.z0) / G.c); return i >= 0 && j >= 0 && i < G.nx && j < G.nz && rm[j * G.nx + i] === 1; };
    for (const [cls, hw, lv, pts] of D.roads) {
      if (lv) continue;
      const c0 = cls.split('.')[0], isPath = /^(footway|path|cycleway|steps|pedestrian|track)$/.test(c0), half = isPath ? Math.min(hw, 1.1) : hw, y = isPath ? -0.1 : -0.085;
      const tgt = isPath ? path : road, col = isPath ? (c0 === 'cycleway' ? [0.62, 0.6, 0.58] : [0.84, 0.82, 0.76]) : [0.82, 0.82, 0.84];
      // densify, drop the parts on the circuit's corridor or in a junction's leg
      const P = []; for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4)); for (let q = 0; q < n; q++) P.push([ax + (bx - ax) * q / n, az + (bz - az) * q / n]); }
      P.push(pts[pts.length - 1]);
      let run = [];
      const flush = () => {
        if (run.length >= 2) {
          let acc = 0, prevL = null, prevR = null;
          for (let k = 0; k < run.length; k++) {
            const a = run[Math.max(0, k - 1)], b = run[Math.min(run.length - 1, k + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l, p = run[k];
            if (k) acc += Math.hypot(p[0] - run[k - 1][0], p[1] - run[k - 1][1]);
            const Lp = [p[0] + nx * half, y, p[1] + nz * half], Rp = [p[0] - nx * half, y, p[1] - nz * half];
            if (prevL) { const g = tgt.get(p[0], p[1]); g.quadUp(prevR, Rp, Lp, prevL, [col, col, col, col], [[prevR[0] / 8, -prevR[2] / 8], [Rp[0] / 8, -Rp[2] / 8], [Lp[0] / 8, -Lp[2] / 8], [prevL[0] / 8, -prevL[2] / 8]]);
              if (!isPath && half >= 3.5 && Math.floor(acc / 4) % 3 === 0) { const q0 = run[k - 1], ml = mark.get(p[0], p[1]); ml.quadUp([q0[0] + nx * 0.07, y + 0.012, q0[1] + nz * 0.07], [q0[0] - nx * 0.07, y + 0.012, q0[1] - nz * 0.07], [p[0] - nx * 0.07, y + 0.012, p[1] - nz * 0.07], [p[0] + nx * 0.07, y + 0.012, p[1] + nz * 0.07], [yel, yel, yel, yel]); }
              if (!isPath && Math.floor(acc / 38) !== Math.floor((acc - 4) / 38)) lampAt.push([p[0] + nx * (half + 1.2), p[1] + nz * (half + 1.2), Math.atan2(-nz, -nx)]); }
            prevL = Lp; prevR = Rp;
          }
        }
        run = [];
      };
      for (const p of P) {
        const q = near(p[0], p[1]), bad = q.d < (isPath ? 1.5 : 1.0) || p[0] < G.x0 || p[1] < G.z0 || p[0] > G.x1 || p[1] > G.z1 || inLeg(p[0], p[1]) || mtGround(p[0], p[1]) < WL + 0.2;
        if (bad) flush(); else { run.push(p); mk(p[0], p[1], half + 1); }
      }
      flush();
    }
    road.addTo(root, aMat, false, true); path.addTo(root, new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true }), false, true); mark.addTo(root, C.lMat, false, true);
    // street lamps along the roads (static: away from the circuit's junctions)
    for (const [x, z, a] of lampAt) { if (near(x, z).d < 2 || C.excluded(x, z)) continue; const g = scen.get(x, z);
      cyl(g, x, -0.2, z, 0.09, 8.6, 5, [0.55, 0.56, 0.58], null, 0.06); box(g, x + Math.cos(a) * 1.0, 8.2, z + Math.sin(a) * 1.0, 2.0, 0.1, 0.1, a, [0.55, 0.56, 0.58]); box(g, x + Math.cos(a) * 2.0, 8.0, z + Math.sin(a) * 2.0, 0.7, 0.2, 0.3, a, [0.4, 0.42, 0.45], [0.5, 0.52, 0.55]); }
    // the car parks: white bays and parked cars (the teams', the staff's on race day)
    const carG = mtCarGeo(), cars = new K.IChunks(carG, new THREE.MeshLambertMaterial({ vertexColors: true }), 192), R = rng(767);
    const CARC = [[0.9, 0.9, 0.9], [0.12, 0.12, 0.13], [0.5, 0.52, 0.55], [0.7, 0.1, 0.1], [0.15, 0.25, 0.55], [0.78, 0.78, 0.8], [0.3, 0.32, 0.35], [0.95, 0.95, 0.95]];
    let nCars = 0;
    for (const [cl, ring] of D.lu) { if (cl !== 'parking') continue;
      let best = 0, ux = 1, uz = 0; for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; ux = (b[0] - a[0]) / l; uz = (b[1] - a[1]) / l; } }
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of ring) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      const vx = -uz, vz = ux, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ext = Math.hypot(x1 - x0, z1 - z0) / 2;
      for (let a = -ext; a < ext; a += 2.6) for (let b = -ext; b < ext; b += 6.2) {
        const row = Math.round(b / 6.2), x = cx + ux * a + vx * b, z = cz + uz * a + vz * b;
        if (!K.inPoly(ring, x, z) || K.polyDist(ring, x, z) < 1.5 || near(x, z).d < 2 || C.excluded(x, z)) continue;
        const ins = ring.length > 2;
        if (ins && Math.abs(row) % 2 === 0) { const g = mark.get(x, z), yb = Math.max(mtGround(x, z), WL + 0.05) + 0.06, p = (s, t) => [x + ux * s + vx * t, yb, z + uz * s + vz * t]; g.quadUp(p(-1.3, -2.6), p(-1.18, -2.6), p(-1.18, 2.6), p(-1.3, 2.6), [W1, W1, W1, W1]); }
        if (R() < 0.5 && C.near(x, z).d < 260) { const yaw = Math.atan2(vz, vx) + (R() < 0.5 ? Math.PI : 0) + (R() - 0.5) * 0.06, col = CARC[Math.floor(R() * CARC.length)], k = 0.85 + 0.25 * R();
          cars.add(x + ux * (R() - 0.5) * 0.3, Math.max(mtGround(x, z), WL + 0.05) + 0.04, z + uz * (R() - 0.5) * 0.3, -yaw, 1, 1, [col[0] * k, col[1] * k, col[2] * k]); nCars++; }
      }
    }
    cars.addTo(root, true); C.out.parkedCars = nCars;
  }
  function mtCarGeo() {   // a parked car (4.4 m long along x, 1.8 m wide): the body in the instance colour, dark glass, black tyres
    const g = new GB(), W1 = [1, 1, 1], gl = [0.12, 0.15, 0.18], tyre = [0.06, 0.06, 0.07];
    box(g, 0, 0.3, 0, 4.4, 0.64, 1.78, 0, W1, W1, true); box(g, -0.2, 0.94, 0, 2.3, 0.56, 1.6, 0, gl, W1, true);
    for (const z of [-0.8, 0.8]) box(g, 0, 0.0, z, 3.4, 0.6, 0.24, 0, tyre, tyre, true);   // (both wheels of a side in one dark block)
    const geo = g.geometry(); return geo;
  }

  /* ---- the buildings of the island and round it (OSM outlines and heights): walls in their kind's colours, a band of windows on every
     floor, a flat roof with a darker rim; the big pavilions by the hairpin clad in aluminium fins (plain, no name); the geodesic dome on
     Île Sainte-Hélène; the rest of the town within 2 km as boxes (OSM) ---- */
  const BCOL = [[0.86, 0.8, 0.7], [0.74, 0.62, 0.52], [0.8, 0.8, 0.78], [0.9, 0.89, 0.85], [0.72, 0.72, 0.7], [0.66, 0.6, 0.55], [0.88, 0.88, 0.86]];
  const BDEF = [6, 12, 10, 5.5, 8, 14, 7.5];
  function mtBuildings(C) {
    const { D, root, scen, exclPush, near } = C, glass = [0.26, 0.34, 0.42], roofC = [0.5, 0.5, 0.5];
    for (const [kd, h0, mh, name, ring] of D.bld) {
      if (name === 'Paddocks' || name === 'Biosphère' || ring.length < 3) continue;
      let cx = 0, cz = 0; for (const p of ring) { cx += p[0]; cz += p[1]; } cx /= ring.length; cz /= ring.length;
      if (near(cx, cz).d < 1) continue;
      const area = Math.abs(ring.reduce((a, p, k) => { const q = ring[(k + 1) % ring.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
      const H = h0 > 0 ? h0 : BDEF[kd] * (0.85 + 0.3 * hash(Math.round(cx), Math.round(cz))), y0 = Math.max(mtGround(cx, cz), -0.3) + (mh || 0) - 0.2, y1 = y0 + 0.2 + H;
      const hv = hash(Math.round(cz), Math.round(cx)), base = BCOL[kd], col = base.map(v => v * (0.92 + 0.14 * hv)), fins = area > 3000 && Math.hypot(cx + 290, cz + 1390) < 260;
      const g = scen.get(cx, cz), ins = [cx, (y0 + y1) / 2, cz], floors = H > 5 ? Math.max(1, Math.floor(H / 3.6)) : 0;
      // the walls (and the fins or the windows)
      for (let k = 0; k < ring.length; k++) {
        const a = ring[k], b = ring[(k + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.3) continue;
        g.quadO([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], col, ins);
        const ox = (b[1] - a[1]) / l, oz = -(b[0] - a[0]) / l, sgn = ((a[0] + b[0]) / 2 - cx) * ox + ((a[1] + b[1]) / 2 - cz) * oz > 0 ? 0.05 : -0.05;   // (outward)
        if (fins) { for (let t = 0.75; t < l - 0.5; t += 1.6) { const px = a[0] + (b[0] - a[0]) * t / l, pz = a[1] + (b[1] - a[1]) * t / l; box(g, px + ox * sgn * 6, y0 + 0.4, pz + oz * sgn * 6, 0.18, H - 0.4, 0.5, Math.atan2(b[1] - a[1], b[0] - a[0]), [0.82, 0.84, 0.87], [0.9, 0.91, 0.93]); } }
        else if (floors && l > 3) for (let f = 0; f < floors; f++) { const yb = y0 + 0.2 + f * 3.6 + 1.0, yt = yb + 1.5; if (yt > y1 - 0.3) break;
          const A = [a[0] + ox * sgn + (b[0] - a[0]) * 0.6 / l, yb, a[1] + oz * sgn + (b[1] - a[1]) * 0.6 / l], B = [b[0] + ox * sgn - (b[0] - a[0]) * 0.6 / l, yb, b[1] + oz * sgn - (b[1] - a[1]) * 0.6 / l];
          g.quadO(A, B, [B[0], yt, B[2]], [A[0], yt, A[2]], glass, ins); }
      }
      // the roof: a fan from the centre (the outlines are near enough convex; a darker rim)
      for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length]; g.triO([cx, y1, cz], [a[0], y1, a[1]], [b[0], y1, b[1]], roofC.map(v => v * (0.9 + 0.2 * hv)), [cx, y1 - 5, cz]); }
      let r = 0; for (const p of ring) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cz)); exclPush(cx, cz, r * 0.9 + 1); if (C.CR) C.CR.exclAdd(cx, cz, r);
    }
    // the dome: a geodesic sphere of steel struts (76 m across, 62 m tall), a museum inside it
    const bio = D.bld.find(b => b[3] === 'Biosphère');
    if (bio) { let cx = 0, cz = 0; for (const p of bio[4]) { cx += p[0]; cz += p[1]; } cx /= bio[4].length; cz /= bio[4].length; mtDome(C, cx, cz); exclPush(cx, cz, 42); }
    // the rest of the town within 2 km: boxes (OSM footprints as rectangles), merged per 256 m chunk
    const mb = new Int16Array(b64(D.bldMidB).buffer), mid = new K.Chunks(256), G = MG;
    for (let k = 0; k + 5 < mb.length; k += 6) {
      const x = mb[k], z = mb[k + 1], Lx = mb[k + 2], Wz = mb[k + 3], a = mb[k + 4] * Math.PI / 180, h = Math.max(4, mb[k + 5]);
      const hv = hash(x, z), col = h > 20 ? [0.7, 0.72, 0.74].map(v => v * (0.9 + 0.2 * hv)) : hv < 0.4 ? [0.62, 0.36, 0.28] : hv < 0.7 ? [0.82, 0.76, 0.66] : [0.76, 0.76, 0.74];
      const y0 = x > G.x0 && z > G.z0 && x < G.x1 && z < G.z1 ? Math.max(-0.3, mtGround(x, z)) : 0;
      box(mid.get(x, z), x, y0 - 0.5, z, Lx, h + 0.5, Wz, -a, col, [0.42, 0.42, 0.44]);
    }
    mid.addTo(root, C.matV, true, true);
  }
  function mtDome(C, cx, cz) {   // the dome: a 2x-subdivided icosahedron's edges as struts (the bottom quarter in the ground), an inner building
    const g = new GB(), R0 = 38, yc = 62 - R0 - 0.3, V = [], F = [], st = [0.78, 0.8, 0.84];
    const t = (1 + Math.sqrt(5)) / 2; [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].forEach(v => { const l = Math.hypot(...v); V.push(v.map(c => c / l)); });
    let faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let lv = 0; lv < 2; lv++) { const mp = new Map(), mid = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (mp.has(k)) return mp.get(k); const m = V[a].map((c, q) => (c + V[b][q]) / 2), l = Math.hypot(...m); V.push(m.map(c => c / l)); mp.set(k, V.length - 1); return V.length - 1; };
      const nf = []; for (const [a, b, c] of faces) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } faces = nf; }
    const P = (v) => [cx + v[0] * R0, yc + v[1] * R0, cz + v[2] * R0], E = new Set();
    for (const f of faces) for (let k = 0; k < 3; k++) { const a = f[k], b = f[(k + 1) % 3], key = a < b ? a + '_' + b : b + '_' + a; if (E.has(key)) continue; E.add(key);
      const A = P(V[a]), B = P(V[b]); if (A[1] < -0.5 && B[1] < -0.5) continue;
      const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], out = [m[0] - cx, m[1] - yc, m[2] - cz], ol = Math.hypot(...out), o = out.map(c => c / ol), d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
      let sx = d[1] * o[2] - d[2] * o[1], sy = d[2] * o[0] - d[0] * o[2], sz = d[0] * o[1] - d[1] * o[0]; const sl = Math.hypot(sx, sy, sz) || 1; sx *= 0.22 / sl; sy *= 0.22 / sl; sz *= 0.22 / sl;
      g.quadO([A[0] - sx, A[1] - sy, A[2] - sz], [A[0] + sx, A[1] + sy, A[2] + sz], [B[0] + sx, B[1] + sy, B[2] + sz], [B[0] - sx, B[1] - sy, B[2] - sz], st, [m[0] - o[0], m[1] - o[1], m[2] - o[2]]);
      g.quadO([A[0] - sx, A[1] - sy, A[2] - sz], [A[0] + sx, A[1] + sy, A[2] + sz], [B[0] + sx, B[1] + sy, B[2] + sz], [B[0] - sx, B[1] - sy, B[2] - sz], [0.5, 0.52, 0.56], [m[0] + o[0], m[1] + o[1], m[2] + o[2]]); }
    for (const [h, r] of [[8, 26], [16, 20], [24, 14]]) cyl(g, cx, h - 8, cz, r, 8, 12, [0.86, 0.86, 0.84], [0.62, 0.64, 0.66], r);   // the museum's floors inside
    const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; C.root.add(m);
  }

  /* ---- trees: from the land cover (ESA WorldCover's tree cells, 10 m), a few on the lawns too: maples and lindens (round crowns), poplars
     (tall, narrow), willows by the water, a few spruces; instanced per 192 m chunk, kept off the road's corridor, the buildings, the roads ---- */
  function mtTreeGeo(kind) {
    const g = new GB(), R = rng(900 + kind), lf = [0.3, 0.46, 0.22], lfD = [0.24, 0.38, 0.18], bk = [0.36, 0.3, 0.24];
    if (kind === 0) { cyl(g, 0, 0, 0, 0.022, 0.42, 5, bk, null, 0.015); K.puff(g, 0, 0.62, 0, 0.3, 0.82, lf, R, 0.22, 0.55, 1.12, true); K.nrLump(g, 0.12, 0.7, 0.06, 0.2, 0.85, lfD, R, 0.2); K.nrLump(g, -0.12, 0.72, -0.08, 0.19, 0.85, lf, R, 0.2); }   // maple
    else if (kind === 1) { cyl(g, 0, 0, 0, 0.03, 0.3, 5, bk, null, 0.022); ico(g, 0, 0.6, 0, 0.13, 3.2, [0.28, 0.44, 0.2], R, 0.15); }   // poplar
    else if (kind === 2) { cyl(g, 0, 0, 0, 0.026, 0.4, 5, bk, null, 0.02); K.puff(g, 0, 0.55, 0, 0.36, 0.7, [0.42, 0.55, 0.28], R, 0.25, 0.6, 1.1); ico(g, 0, 0.36, 0, 0.4, 0.55, [0.38, 0.5, 0.25], R, 0.3); }   // willow: wide, drooping
    else { cyl(g, 0, 0, 0, 0.03, 0.2, 5, bk, null, 0.02); cone(g, 0, 0.12, 0, 0.28, 0.5, 7, [0.16, 0.3, 0.2], [0.2, 0.36, 0.24], 0); cone(g, 0, 0.42, 0, 0.2, 0.58, 7, [0.17, 0.32, 0.21], [0.22, 0.38, 0.25], 0); }   // spruce
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function mtTrees(C) {
    const { root, near } = C, G = MG, R = rng(1967), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const IC = [0, 1, 2].map(k => new K.IChunks(mtTreeGeo(k), mat, 256));
    const roadM = C.roadMask; let n = 0;
    for (let j = 1; j < G.nz - 1; j += 2) for (let i = 1; i < G.nx - 1; i += 2) {
      const k = j * G.nx + i, kd = G.kind[k]; if (G.wet[k] || kd === 4 || kd === 5 || kd === 7) continue;
      const p = kd === 1 ? 0.5 : kd === 0 ? 0.06 : kd === 6 ? 0.1 : 0.015; if (R() > p) continue;
      const x = G.x0 + i * G.c + (R() - 0.5) * 7, z = G.z0 + j * G.c + (R() - 0.5) * 7, q = near(x, z);
      if (q.d < 3 || C.excluded(x, z) || (roadM && roadM(x, z)) || G.SD[k] < 1.5 || G.dT[k] > 760) continue;
      const sd = G.SD[k], sp = sd < 14 && R() < 0.6 ? 2 : R() < 0.12 ? 1 : 0, h = sp === 1 ? 18 + R() * 8 : sp === 2 ? 9 + R() * 5 : 9 + R() * 8;   // (maples and lindens; poplars; willows by the water)
      const tone = 0.85 + 0.3 * R(), col = [tone * (0.95 + 0.1 * R()), tone, tone * (0.9 + 0.1 * R())];
      IC[sp].add(x, mtGround(x, z) - 0.1, z, R() * TAU, sp === 1 ? h * 0.9 : h, h, col); n++;
    }
    for (const ic of IC) ic.addTo(root, true);
    C.out.treeN = n;
  }

  /* ---- the junctions (def.junctions): the side road's leg from the circuit's edge out past its fence (the barrier opens into its mouth up to
     the fence, Core: def.walls), its sidewalks and street lamps beyond; in the mouth the paved corners, the zebra crossing and the stop line;
     the street furniture of the junction, all of it knockable (World props -> Core's loose props): traffic signals on poles with their mast
     arms over the road (the circuit's and the side road's), a controller cabinet, stop signs, other signs, a hydrant, a bin, a lamp, bollards ---- */
  function mtLegs(C) {
    const { T, def, w } = C, JOFF = def.junctionOff || 11.5;
    C.legs = (def.junctions || []).map(([d, sd, ang, hw, kind, len, what]) => {
      const s = C.sAt(d), i = T.idx(s), a = ang * Math.PI / 180, tx = T.tx[i], tz = T.tz[i], nx = T.nx[i] * sd, nz = T.nz[i] * sd, ca = Math.cos(a), sa = Math.sin(a);
      const ux = tx * ca + nx * sa, uz = tz * ca + nz * sa, sn = Math.max(0.35, sa);
      const ct = ca / sn, e = hw / sn, qa = Math.min(w * ct, (w + JOFF) * ct) - e - 4.5, qb = Math.max(w * ct, (w + JOFF) * ct) + e + 4.5;   // (the mouth along the road, as the track's def.walls opens it)
      return { d, sd, a, hw, kind, len, what, s, i, cx: T.px[i], cz: T.pz[i], ux, uz, vx: -uz, vz: ux, tx, tz, nx, nz, r0: w / sn, rF: (w + JOFF) / sn, rEnd: (w + JOFF) / sn + len, qa, qb };
    });
  }
  function mtJunctions(C) {
    const { T, w, root, scen, out, near, aMat, lMat, exclPush } = C, legs = C.legs || [], W1 = [1, 1, 1], wh = [0.94, 0.94, 0.9], walk = [0.78, 0.77, 0.74], curbC = [0.66, 0.65, 0.62];
    const gr = new K.Chunks(192, true), gm = new GB(), gs = new K.Chunks(192, true);
    const prop = (kind, x, z, yaw, col) => { const q = near(x, z); if (q.d > -0.7 || Math.abs(q.lat) < w + 0.7) return false; out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0, i: q.i }); C.nJ = (C.nJ || 0) + 1; return true; };
    for (const L of legs) {
      const P = (r, v) => [L.cx + L.ux * r + L.vx * v, L.cz + L.uz * r + L.vz * v], Q = (r, v, y) => { const p = P(r, v); return [p[0], y, p[1]]; };
      const yaw = (x, z) => Math.atan2(z, x), yU = yaw(L.ux, L.uz), yV = yaw(L.vx, L.vz), yN = yaw(-L.nx, -L.nz), yT = yaw(-L.tx, -L.tz);
      // the leg beyond the fence: asphalt, sidewalks with curbs, lamps
      for (let r = L.r0 - 0.3; r < L.rF + 0.6; r += 3) { const r1 = Math.min(L.rF + 0.6, r + 3), g = gr.get(...P(r, 0)), y = 0.024, A = Q(r, -L.hw, y), B = Q(r, L.hw, y), Cq = Q(r1, L.hw, y), Dq = Q(r1, -L.hw, y), uv = (p) => [p[0] / 8, -p[2] / 8], c = [0.8, 0.8, 0.82];   // the carriageway in the mouth
        g.quadUp(A, B, Cq, Dq, [c, c, c, c], [uv(A), uv(B), uv(Cq), uv(Dq)]); }
      for (let r = L.rF + 0.6; r < L.rEnd; r += 4) { const r1 = Math.min(L.rEnd, r + 4), g = gr.get(...P(r, 0)), y = -0.07;
        const A = Q(r, -L.hw, y), B = Q(r, L.hw, y), Cq = Q(r1, L.hw, y), Dq = Q(r1, -L.hw, y), uv = (p) => [p[0] / 8, -p[2] / 8];
        g.quadUp(A, B, Cq, Dq, [W1, W1, W1, W1].map(c => [0.86, 0.86, 0.88]), [uv(A), uv(B), uv(Cq), uv(Dq)]);
        for (const sg of [-1, 1]) { const ys = 0.06, a0 = Q(r, sg * L.hw, ys), a1 = Q(r, sg * (L.hw + 2.2), ys), b1 = Q(r1, sg * (L.hw + 2.2), ys), b0 = Q(r1, sg * L.hw, ys), gg = gs.get(a0[0], a0[2]);
          gg.quadUp(a0, a1, b1, b0, [walk, walk, walk, walk], [[a0[0] / 1.5, -a0[2] / 1.5], [a1[0] / 1.5, -a1[2] / 1.5], [b1[0] / 1.5, -b1[2] / 1.5], [b0[0] / 1.5, -b0[2] / 1.5]]);
          gg.quadO(Q(r, sg * L.hw, -0.08), Q(r1, sg * L.hw, -0.08), Q(r1, sg * L.hw, ys), Q(r, sg * L.hw, ys), curbC, Q(r, sg * (L.hw + 1), 0)); }
        if (Math.floor(r / 20) !== Math.floor((r + 4) / 20) && r > L.rF + 6) { const [lx, lz] = P(r, L.hw + 1.4), gL = scen.get(lx, lz);
          cyl(gL, lx, -0.2, lz, 0.09, 8.4, 5, [0.55, 0.56, 0.58], null, 0.06); box(gL, lx - L.vx * 1.0, 8.0, lz - L.vz * 1.0, 2.0, 0.1, 0.1, yV, [0.55, 0.56, 0.58]); box(gL, lx - L.vx * 1.9, 7.8, lz - L.vz * 1.9, 0.7, 0.2, 0.3, yV, [0.4, 0.42, 0.45], [0.5, 0.52, 0.55]); }
      }
      // the road closed beyond the fence: a barricade striped orange and white
      { const r = L.rF + 2.5, g = scen.get(...P(r, 0)); for (const v of [-L.hw * 0.5, L.hw * 0.5]) { const [x, z] = P(r, v); box(g, x, 0, z, 0.08, 1.0, 0.08, yV, [0.4, 0.4, 0.42]); }
        for (let k = 0; k < 2; k++) { const [x, z] = P(r, 0), y = 0.55 + k * 0.32; box(g, x, y, z, L.hw * 1.4, 0.22, 0.05, yV, k ? [0.95, 0.95, 0.94] : [0.96, 0.45, 0.08]); } }
      // in the mouth: the paved corners either side of the leg (1 m cells: inside the barrier, off the circuit, off the leg's width)
      const sn = Math.sin(L.a);
      for (let q = L.qa - 3; q <= L.qb + 3; q += 0.5) {
        const s = L.s + q, i = T.idx(s), bar = L.sd > 0 ? T.br[i] : T.bl[i]; if (bar < w + 3) continue;
        for (let l = w + 0.6; l < bar - 0.3; l += 0.5) {
          const l1 = Math.min(bar - 0.3, l + 0.5), cs = [[q, l], [q + 0.5, l], [q + 0.5, l1], [q, l1]].map(([qq, ll]) => { const p = C.atSf(L.s + qq, L.sd * ll); return [p[0], 0.06, p[1]]; });
          const mx = (cs[0][0] + cs[2][0]) / 2, mz = (cs[0][2] + cs[2][2]) / 2, dx = mx - L.cx, dz = mz - L.cz, v = dx * L.vx + dz * L.vz, r = dx * L.ux + dz * L.uz;
          if (r < L.r0 - 0.5 || Math.abs(v) < L.hw + 0.2 || Math.abs(v) > L.hw + 2.6) continue;   // (the sidewalks along the leg's edges; grass beyond them)
          const g = gs.get(mx, mz); g.quadUp(cs[0], cs[1], cs[2], cs[3], [walk, walk, walk, walk], cs.map(p => [p[0] / 1.5, -p[2] / 1.5]));
        }
      }
      // markings in the mouth: the zebra crossing over the leg, the stop line on the lane coming in
      const z0 = L.r0 + 2.4, z1 = L.r0 + 5.4, yM = 0.045;
      if (z1 < L.rF - 1) { for (let v = -L.hw + 0.4; v < L.hw - 0.3; v += 1.0) gm.quadUp(Q(z0, v, yM), Q(z0, v + 0.5, yM), Q(z1, v + 0.5, yM), Q(z1, v, yM), [wh, wh, wh, wh]);
        gm.quadUp(Q(z1 + 1.0, 0, yM), Q(z1 + 1.0, L.hw - 0.2, yM), Q(z1 + 1.4, L.hw - 0.2, yM), Q(z1 + 1.4, 0, yM), [wh, wh, wh, wh]);
        if (L.hw >= 3.5) for (let r = z1 + 1.6; r < L.rF - 0.6; r += 3) gm.quadUp(Q(r, -0.08, yM), Q(r, 0.08, yM), Q(Math.min(r + 1.6, L.rF - 0.6), 0.08, yM), Q(Math.min(r + 1.6, L.rF - 0.6), -0.08, yM), [[0.95, 0.75, 0.12], [0.95, 0.75, 0.12], [0.95, 0.75, 0.12], [0.95, 0.75, 0.12]]); }
      // a worn crossing over the circuit itself where the island's lights are (the island's roads are public outside race week)
      if (L.kind === 'sig') { const qc = -(L.hw / sn + 2.6), gw = [0.74, 0.74, 0.72]; for (let l = -w + 0.6; l < w - 0.4; l += 1.1) { const a = C.atSf(L.s + qc - 1.5, l), b = C.atSf(L.s + qc - 1.5, l + 0.55), c = C.atSf(L.s + qc + 1.5, l + 0.55), d = C.atSf(L.s + qc + 1.5, l);
        gm.quadUp([a[0], 0.04, a[1]], [b[0], 0.04, b[1]], [c[0], 0.04, c[1]], [d[0], 0.04, d[1]], [gw, gw, gw, gw]); } }
      if (L.what === 'beach') { const [bx, bz] = P(L.rF + 7, -(L.hw + 1.4)), g = scen.get(bx, bz);   // the bus stop's shelter beyond the fence (glass on a steel frame)   // its shelter beyond the fence (glass on a steel frame)
        box(g, bx, 0.06, bz, 3.6, 0.08, 1.5, yU, [0.5, 0.52, 0.55]); box(g, bx, 2.4, bz, 3.8, 0.12, 1.7, yU, [0.3, 0.32, 0.36], [0.4, 0.42, 0.46]);
        for (const e of [-1.7, 1.7]) box(g, bx + L.ux * e, 0, bz + L.uz * e, 0.1, 2.4, 1.4, yU, [0.6, 0.7, 0.78]);
        box(g, bx - L.vx * 0.7, 0, bz - L.vz * 0.7, 3.5, 2.4, 0.06, yU, [0.55, 0.68, 0.76]); }
      exclPush(...P(L.rF * 0.6, 0), Math.max(8, L.rF * 0.6));
    }
    // the furniture (def.furniture: on the corners of each mouth, facing its way), every piece knockable
    for (const [d, sd, kind, l, face, col, j] of C.def.furniture || []) {
      const L = legs[j], s = C.sAt(d), i = T.idx(s), [x, z] = C.atSf(s, sd * l), tx = T.tx[i], tz = T.tz[i];
      const yaw = face === 'N' ? Math.atan2(-T.nz[i] * sd, -T.nx[i] * sd) : face === 'F' ? Math.atan2(tz, tx) : face === 'B' ? Math.atan2(-tz, -tx) : Math.atan2(L.uz, L.ux);
      prop(kind, x, z, yaw, col);
    }
    gr.addTo(root, aMat, false, true); gs.addTo(root, new THREE.MeshLambertMaterial({ map: C.tex.paving, vertexColors: true }), false, true);
    if (!gm.empty) { const m = new THREE.Mesh(gm.geometry(), lMat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
    // OSM's own street furniture round the circuit: inside the barriers knockable, outside it as scenery (hydrants, bollards, benches, signs)
    const F = C.D.fur || {}, KN = { fire_hydrant: 'hydrant', bollard: 'bollard', waste_basket: 'bin', street_lamp: 'lamp', traffic_signals: 'signal' };
    for (const cl in F) for (const [x, z] of F[cl]) {
      const q = near(x, z);
      if (q.d < -0.7 && Math.abs(q.lat) > w + 0.8 && KN[cl]) { prop(KN[cl], x, z, 0); continue; }
      if (q.d < 0.6) continue;
      const g = scen.get(x, z), y = mtGround(x, z);
      if (cl === 'fire_hydrant') { cyl(g, x, y, z, 0.16, 0.6, 6, [0.82, 0.1, 0.08], [0.93, 0.93, 0.9]); }
      else if (cl === 'bollard') cyl(g, x, y, z, 0.1, 0.95, 6, [0.25, 0.26, 0.28], [1, 0.8, 0.1]);
      else if (cl === 'bench') { box(g, x, y + 0.4, z, 1.8, 0.08, 0.5, hash(x, z) * TAU, [0.5, 0.36, 0.22]); box(g, x, y, z, 1.6, 0.4, 0.06, hash(x, z) * TAU, [0.3, 0.3, 0.32]); }
      else if (cl === 'information' || cl === 'stop' || cl === 'give_way') { box(g, x, y, z, 0.07, 2.2, 0.07, 0, [0.4, 0.4, 0.42]); box(g, x, y + 1.6, z, 0.06, 0.6, 0.6, hash(x, z) * TAU, cl === 'stop' ? [0.85, 0.1, 0.1] : [0.2, 0.4, 0.75]); }
      else if (cl === 'drinking_water') cyl(g, x, y, z, 0.2, 0.95, 6, [0.3, 0.45, 0.35], [0.5, 0.52, 0.55]);
    }
  }

  /* ---- the Concorde bridge over the circuit (OSM: the Pont de la Concorde and Avenue Pierre-Dupuy, level 1): decks 7.5 m up, concrete
     parapets, piers outside the circuit's barriers; and the small bridges and footbridges of the island over its canals ---- */
  function mtBridges(C) {
    const { D, root, aMat, near } = C, g = new K.Chunks(192), gd = new K.Chunks(192, true), conc = [0.74, 0.74, 0.72], concD = [0.56, 0.56, 0.55], HD = 7.5;
    for (const [nm, cls, pts] of D.bridgeRoads) {
      if (!/Concorde|Pierre-Dupuy/.test(nm) || cls === 'cycleway') continue;
      const hw = cls === 'cycleway' ? 1.8 : cls === 'tertiary' ? 4.2 : 3.6;
      for (let k = 0; k + 1 < pts.length; k++) {
        const [ax, az] = pts[k], [bx, bz] = pts[k + 1], l = Math.hypot(bx - ax, bz - az); if (l < 0.5) continue;
        const nx = -(bz - az) / l, nz = (bx - ax) / l, n = Math.ceil(l / 6);
        for (let q = 0; q < n; q++) {
          const t0 = q / n, t1 = (q + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
          if (Math.hypot(x0 - C.T.px[C.T.idx(C.sAt(2122))], z0 - C.T.pz[C.T.idx(C.sAt(2122))]) > 520) continue;
          const A = [x0 + nx * hw, HD, z0 + nz * hw], B = [x0 - nx * hw, HD, z0 - nz * hw], Cq = [x1 - nx * hw, HD, z1 - nz * hw], Dq = [x1 + nx * hw, HD, z1 + nz * hw], uv = (p) => [p[0] / 8, -p[2] / 8];
          gd.get(x0, z0).quadUp(A, B, Cq, Dq, [[0.9, 0.9, 0.92], [0.9, 0.9, 0.92], [0.9, 0.9, 0.92], [0.9, 0.9, 0.92]], [uv(A), uv(B), uv(Cq), uv(Dq)]);
          const gg = g.get(x0, z0), lo = HD - 1.3;
          gg.quadO([A[0], lo, A[2]], [Dq[0], lo, Dq[2]], [Cq[0], lo, Cq[2]], [B[0], lo, B[2]], concD, [(x0 + x1) / 2, HD + 3, (z0 + z1) / 2]);   // underside (seen from the road)
          for (const sg of [-1, 1]) { const e0 = [x0 + nx * hw * sg, 0, z0 + nz * hw * sg], e1 = [x1 + nx * hw * sg, 0, z1 + nz * hw * sg], o = [nx * sg * 0.3, nz * sg * 0.3];
            gg.quadO([e0[0], lo, e0[2]], [e1[0], lo, e1[2]], [e1[0], HD + 1.0, e1[2]], [e0[0], HD + 1.0, e0[2]], conc, [(x0 + x1) / 2 - nx * sg * 2, HD, (z0 + z1) / 2 - nz * sg * 2]);   // the outer face and the parapet
            gg.quadO([e0[0] - o[0], HD, e0[2] - o[1]], [e1[0] - o[0], HD, e1[2] - o[1]], [e1[0] - o[0], HD + 1.0, e1[2] - o[1]], [e0[0] - o[0], HD + 1.0, e0[2] - o[1]], [0.82, 0.82, 0.8], [(x0 + x1) / 2 + nx * sg * 2, HD, (z0 + z1) / 2 + nz * sg * 2]);
            gg.quadUp([e0[0] - o[0], HD + 1.0, e0[2] - o[1]], [e0[0], HD + 1.0, e0[2]], [e1[0], HD + 1.0, e1[2]], [e1[0] - o[0], HD + 1.0, e1[2] - o[1]], [[0.86, 0.86, 0.84], [0.86, 0.86, 0.84], [0.86, 0.86, 0.84], [0.86, 0.86, 0.84]]); }
          if (q % 5 === 0 && cls !== 'cycleway') { const qn = near(x0, z0); if (qn.d > 1.0) { const y0 = Math.min(-0.2, mtGround(x0, z0)); box(gg, x0, y0 - 1, z0, 1.4, lo - y0 + 1, hw * 1.6, Math.atan2(nz, nx), concD); } }
        }
      }
    }
    const bm = new THREE.MeshLambertMaterial({ vertexColors: true }), ba = aMat.clone(), i0 = C.T.idx(C.sAt(2122)), X0 = C.T.px[i0], Z0 = C.T.pz[i0];
    g.addTo(root, bm, true, true); gd.addTo(root, ba, false, true);
    let op = 1;   // the decks fade out while the followed car drives under them (the high cameras would lose it)
    return (t, car) => { const under = car && Math.hypot(car.x - X0, car.z - Z0) < 34, want = under ? 0.18 : 1; if (Math.abs(op - want) < 0.01) return;
      op += (want - op) * 0.12; if (Math.abs(op - want) < 0.02) op = want;
      for (const m of [bm, ba]) { m.transparent = op < 0.99; m.opacity = op; m.depthWrite = op >= 0.99; } };
  }

  /* ---- the Olympic rowing basin beside the straight: the lanes' buoy lines (white, orange near the ends), the start pontoon, the finish
     tower and its small stand; boathouses come from OSM ---- */
  function mtBasin(C) {
    const B = C.D.water.filter(w => w[0] === 'basin').map(w => w[1][0]).sort((a, b) => b.length - a.length)[0]; if (!B) return;
    let cx = 0, cz = 0; for (const p of B) { cx += p[0]; cz += p[1]; } cx /= B.length; cz /= B.length;
    let sxx = 0, szz = 0, sxz = 0; for (const p of B) { const dx = p[0] - cx, dz = p[1] - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; }
    const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th), vx = -uz, vz = ux;
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const p of B) { const dx = p[0] - cx, dz = p[1] - cz, a = dx * ux + dz * uz, b = dx * vx + dz * vz; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
    const geo = (() => { const g = new GB(); ico(g, 0, 0, 0, 0.22, 0.7, [1, 1, 1], rng(5), 0); return g.geometry(); })();
    const buoys = new K.IChunks(geo, new THREE.MeshLambertMaterial({ vertexColors: true }), 256), y = WL + 0.05, bm = (b0 + b1) / 2, nl = 9, lw = 13.5;
    for (let k = 0; k < nl; k++) { const b = bm + (k - (nl - 1) / 2) * lw; if (b < b0 + 4 || b > b1 - 4) continue;
      for (let a = a0 + 30; a < a1 - 30; a += 12.5) { const x = cx + ux * a + vx * b, z = cz + uz * a + vz * b; if (!K.inPoly(B, x, z) || K.polyDist(B, x, z) < 3) continue;
        const end = a < a0 + 130 || a > a1 - 130; buoys.add(x, y, z, 0, 1, 1, end ? [1, 0.45, 0.08] : [0.96, 0.96, 0.94]); } }
    buoys.addTo(C.root, false);
    const g = C.scen, P = (a, b) => [cx + ux * a + vx * b, cz + uz * a + vz * b], yaw = Math.atan2(uz, ux);
    { const [x, z] = P(a0 + 22, bm); box(g.get(x, z), x, WL - 0.3, z, 3, 0.7, (b1 - b0) * 0.85, yaw, [0.55, 0.5, 0.44], [0.62, 0.58, 0.5]); }   // the start pontoon across the lanes
    { const [x, z] = P(a1 - 25, b1 + 14), gg = g.get(x, z);   // the finish tower beside the water and a small stand
      box(gg, x, -0.2, z, 7, 13, 7, yaw, [0.9, 0.9, 0.88], [0.6, 0.62, 0.64]); box(gg, x, 9, z, 8, 3, 8, yaw, [0.3, 0.42, 0.52], [0.86, 0.86, 0.84]); box(gg, x, 12, z, 9, 0.4, 9, yaw, [0.92, 0.92, 0.9]);
      for (let r = 0; r < 8; r++) { const [sx, sz] = P(a1 - 70, b1 + 8 + r * 0.9); box(gg, sx, -0.2, sz, 34, 0.5 + r * 0.45, 0.9, yaw, r % 2 ? [0.62, 0.64, 0.68] : [0.68, 0.7, 0.74]); }
      C.exclPush(x, z, 14); }
  }

  /* ---- ships: a laker (a long bulk carrier) in the seaway east of the island, a tour boat on the river west of it, going up and down
     their channels (out.dyn.step moves them) ---- */
  function mtShipGeo(kind) {
    const g = new GB(), hull = kind ? [0.92, 0.92, 0.9] : [0.55, 0.12, 0.1], dk = [0.15, 0.15, 0.17];
    if (!kind) {   // the laker: 190 m, the bridge at the stern, hatch covers along the deck
      box(g, 0, -3, 0, 190, 7.5, 23, 0, hull, [0.3, 0.32, 0.3]); box(g, 0, -3.2, 0, 191, 1.5, 23.4, 0, dk, dk);
      for (let x = -70; x < 70; x += 12) box(g, x, 4.5, 0, 9, 0.8, 16, 0, [0.42, 0.44, 0.42], [0.45, 0.48, 0.45]);
      box(g, -84, 4.5, 0, 16, 10, 20, 0, [0.95, 0.95, 0.93], [0.9, 0.9, 0.88]); box(g, -84, 13, 0, 12, 2.5, 22, 0, [0.2, 0.26, 0.32], [0.95, 0.95, 0.93]); box(g, -90, 15, 0, 4, 5, 4, 0, [0.15, 0.15, 0.16]);
      box(g, 88, 4.5, 0, 10, 2.5, 18, 0, hull, [0.4, 0.4, 0.38]);
    } else {   // the tour boat: 40 m, two decks, a sun deck
      box(g, 0, -1.4, 0, 40, 3, 9, 0, hull, [0.85, 0.85, 0.84]); box(g, -2, 1.6, 0, 30, 2.6, 8, 0, [0.3, 0.42, 0.52], [0.95, 0.95, 0.94]); box(g, -4, 4.2, 0, 22, 0.3, 7.4, 0, [0.9, 0.9, 0.9], [0.86, 0.3, 0.2]);
      box(g, -4, 4.5, 0, 22, 1.0, 0.1, 0, [0.85, 0.86, 0.88]);
    }
    return g.geometry();
  }
  function mtShips(C) {
    const L = [];
    C.D.ships.forEach((path, k) => {
      const m = new THREE.Mesh(mtShipGeo(k), C.matV); m.castShadow = true; m.receiveShadow = true; C.root.add(m);
      const segL = []; let tot = 0; for (let q = 0; q + 1 < path.length; q++) { const l = Math.hypot(path[q + 1][0] - path[q][0], path[q + 1][1] - path[q][1]); segL.push(l); tot += l; }
      L.push({ m, path, segL, tot, v: k ? 4.5 : 2.6, ph: k ? 0.35 : 0.62, dy: k ? WL + 0.2 : WL + 1.2 });
    });
    return (t) => { for (const S of L) {
      let u = ((t * S.v / S.tot + S.ph) % 2 + 2) % 2, dir = 1; if (u > 1) { u = 2 - u; dir = -1; }   // (up the channel, then back down)
      let d = u * S.tot, q = 0; while (q < S.segL.length - 1 && d > S.segL[q]) { d -= S.segL[q]; q++; }
      const a = S.path[q], b = S.path[q + 1], f = clamp(d / S.segL[q], 0, 1), x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
      S.m.position.set(x, S.dy, z); S.m.rotation.y = -Math.atan2((b[1] - a[1]) * dir, (b[0] - a[0]) * dir); } };
  }

  /* ---- beyond the near island: the backdrop (Copernicus DEM: the city, Mount Royal, the south shore, the river), the towers of downtown
     and of the shores (OSM heights), the Jacques-Cartier bridge's steel cantilever span; drawn on a shell just inside the camera's far plane
     round the camera, each vertex along its own direction (as Irohazaka's far view), hazed by the fog's colour ---- */
  function mtFar(C) {
    const { D } = C, F = D.far, n = F.n, raw = b64(F.b64), G = MG, P0 = [], Cl = [], I = [];
    const H = (i, j) => raw[clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)] * F.step + F.base;
    // water on the coarse grid: the OSM water polygons at the grid's own vertices
    const wet = new Uint8Array(n * n), WG = { x0: F.x0, z0: F.z0, c: F.cell, nx: n, nz: n };
    for (const [, rings] of D.water) rasterPoly(wet, WG, rings, 1);
    const inNear = (x, z) => x > G.x0 + 60 && x < G.x1 - 60 && z > G.z0 + 60 && z < G.z1 - 60;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell, w = wet[j * n + i]; let h = w ? WL - 0.4 : Math.max(0, H(i, j) * 0.85);
      const q = hash(i, j) - 0.5, c = w ? [0.36, 0.48, 0.55] : h > 45 ? [0.24 + q * 0.04, 0.36 + q * 0.04, 0.2] : [0.5 + q * 0.06, 0.5 + q * 0.06, 0.46 + q * 0.05];   // (the river; Mount Royal's woods; the city)
      P0.push(x, h, z); Cl.push(...c);
    }
    for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) { const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      const xa = F.x0 + i * F.cell, za = F.z0 + j * F.cell; if (inNear(xa, za) && inNear(xa + F.cell, za + F.cell)) continue; I.push(a, c, b, b, c, d); }
    const vq = (p, col) => { P0.push(p[0], p[1], p[2]); Cl.push(col[0], col[1], col[2]); return P0.length / 3 - 1; };
    const quad = (a, b, c, d, col) => { const k = [a, b, c, d].map(p => vq(p, col)); I.push(k[0], k[1], k[2], k[0], k[2], k[3]); };
    const ground = (x, z) => { const i = Math.round((x - F.x0) / F.cell), j = Math.round((z - F.z0) / F.cell); return wet[clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)] ? 0 : Math.max(0, H(i, j) * 0.85); };
    // the towers (not the ones of the near island: those are in the near world)
    for (const [h, ring] of D.towers) { let cx = 0, cz = 0; for (const p of ring) { cx += p[0]; cz += p[1]; } cx /= ring.length; cz /= ring.length; if (inNear(cx, cz)) continue;
      const y0 = ground(cx, cz) - 2, y1 = y0 + h, hv = hash(Math.round(cx), Math.round(cz)), wc = hv < 0.35 ? [0.42, 0.52, 0.62] : hv < 0.7 ? [0.72, 0.72, 0.7] : [0.56, 0.58, 0.6];
      for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], ox = b[1] - a[1], oz = -(b[0] - a[0]), out = ((a[0] + b[0]) / 2 - cx) * ox + ((a[1] + b[1]) / 2 - cz) * oz > 0, sh = 0.82 + 0.18 * Math.abs(ox) / (Math.hypot(ox, oz) || 1);
        const col = wc.map(v => v * sh); if (out) quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], col); else quad([b[0], y0, b[1]], [a[0], y0, a[1]], [a[0], y1, a[1]], [b[0], y1, b[1]], col); }
      for (let k = 1; k + 1 < ring.length; k++) { const A = vq([ring[0][0], y1, ring[0][1]], [0.5, 0.5, 0.5]), B = vq([ring[k + 1][0], y1, ring[k + 1][1]], [0.5, 0.5, 0.5]), Cc = vq([ring[k][0], y1, ring[k][1]], [0.5, 0.5, 0.5]); I.push(A, B, Cc); }
    }
    // the Jacques-Cartier bridge: the deck from the city's shore over the river and Île Sainte-Hélène, the steel trusses over the main channel
    const JC = [[-2436, -2647, 22], [-2150, -2546, 40], [-1750, -2400, 49], [-1350, -2253, 42], [-1000, -2103, 32], [-895, -2093, 30], [-300, -2163, 30], [320, -2236, 26], [552, -2149, 12]];
    const st = [0.42, 0.5, 0.46];
    for (let k = 0; k + 1 < JC.length; k++) { const [ax, az, ah] = JC[k], [bx, bz, bh] = JC[k + 1], l = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / l * 9, nz = (bx - ax) / l * 9;
      for (const sd of [-1, 1]) quad([ax + nx * sd, ah - 2, az + nz * sd], [bx + nx * sd, bh - 2, bz + nz * sd], [bx + nx * sd, bh, bz + nz * sd], [ax + nx * sd, ah, az + nz * sd], [0.52, 0.54, 0.52]);
      quad([ax - nx, ah, az - nz], [bx - nx, bh, bz - nz], [bx + nx, bh, bz + nz], [ax + nx, ah, az + nz], [0.45, 0.46, 0.46]);
      const truss = k <= 3 ? 1 : 0;
      if (truss) for (let q = 0; q < 8; q++) { const t0 = q / 8, t1 = (q + 1) / 8, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1, y0 = ah + (bh - ah) * t0, y1 = ah + (bh - ah) * t1;
        const top = (yy, xx) => yy + 14 + 30 * Math.exp(-((Math.hypot(xx + 1750, 0) / 260) ** 2));   // (the cantilever's towers over the main piers)
        for (const sd of [-1, 1]) { const ox = nx * sd, oz = nz * sd, T0 = top(y0, x0), T1 = top(y1, x1);
          quad([x0 + ox, y0, z0 + oz], [x0 + ox + (x1 - x0) * 0.08, y0, z0 + oz + (z1 - z0) * 0.08], [x1 + ox, T1, z1 + oz], [x1 + ox - (x1 - x0) * 0.08, T1, z1 + oz - (z1 - z0) * 0.08], st);
          quad([x0 + ox, T0 - 1.2, z0 + oz], [x1 + ox, T1 - 1.2, z1 + oz], [x1 + ox, T1, z1 + oz], [x0 + ox, T0, z0 + oz], st);
          quad([x0 + ox, y0, z0 + oz], [x0 + ox + 1.5, y0, z0 + oz + 1.5], [x0 + ox + 1.5, T0, z0 + oz + 1.5], [x0 + ox, T0, z0 + oz], st); } }
      if (k < JC.length - 1) { const px = ax, pz = az, y0 = ground(px, pz); quad([px - 4, y0 - 5, pz], [px + 4, y0 - 5, pz], [px + 4, ah - 2, pz], [px - 4, ah - 2, pz], [0.6, 0.6, 0.58]); }
    }
    const nv = P0.length / 3, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(Cl), 3));
    g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1)); g.setIndex(I); g.computeVertexNormals();
    const U = { uHz: { value: new THREE.Color(0xc8d6e2) } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
    m.customProgramCacheKey = () => 'mtFar';
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'mtFar';
    mesh.onBeforeRender = (r, sc) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); };
    C.root.add(mesh);
    const Pf = Float32Array.from(P0), S = { cx: 1e9, cy: 0, cz: 0, cf: 0 };
    return (cam) => {
      if (!cam) return; const c = cam.position;
      cam.getWorldDirection(_fd); const top = Math.asin(clamp(_fd.y, -1, 1)) + (cam.fov || 50) * Math.PI / 360 * 1.15; mesh.visible = top > -0.02; if (!mesh.visible) return;   // (the horizon out of the picture: the steep cameras of the race, nothing to draw or move)
      if (Math.abs(c.x - S.cx) + Math.abs(c.y - S.cy) + Math.abs(c.z - S.cz) < 2 && cam.far === S.cf) return;
      S.cx = c.x; S.cy = c.y; S.cz = c.z; S.cf = cam.far;
      const p = g.attributes.position.array, hz = g.attributes.aHz.array, R0 = cam.far - 60, R1 = cam.far - 5;
      for (let v = 0, k = 0; k < Pf.length; v++, k += 3) { const dx = Pf[k] - c.x, dy = Pf[k + 1] - c.y, dz = Pf[k + 2] - c.z, Dd = Math.max(1, Math.sqrt(dx * dx + dy * dy + dz * dz)), r = R0 + (R1 - R0) * (1 - Math.exp(-Math.max(0, Dd - 300) / 2500)), f = r / Dd;
        p[k] = c.x + dx * f; p[k + 1] = c.y + dy * f; p[k + 2] = c.z + dz * f; hz[v] = 0.28 + 0.55 * (1 - Math.exp(-Math.max(0, Dd - 400) / 4500)); }
      g.attributes.position.needsUpdate = true; g.attributes.aHz.needsUpdate = true;
    };
  }

  const _fd = new THREE.Vector3();
  World.theme('montreal', buildMontreal);
})();
