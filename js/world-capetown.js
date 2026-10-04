/* =========================================================================
   WORLD — Cape Town (theme 'capetown'): the street circuit of Green Point by the Atlantic. Its own builder (World.theme), in a file of its
   own: World's shared helpers (World.kit) and the scenery data of js/data/capetown.js (OpenStreetMap, Copernicus DEM, ESA WorldCover).
   What it builds: the ground of Green Point on its real heights (the surface model with its buildings and trees filtered out), the coast
   (OSM's outline of the land), the Atlantic with its swell and the surf on the rocks of Mouille Point, the parks, lawns and pitches, the
   circuit (asphalt with the street's old lane lines, white edge lines, red and white kerbs at the chicane and the slow corners, the
   pavements, concrete walls with catch fences, tyre walls at the slow corners), the pit lane on the left of Vlei Road with the teams'
   garages (scenery), temporary grandstands and the fans, the town's streets (OSM: South Africa's markings, white broken centre lines and
   yellow edge lines, pavements), the junctions the circuit passes (their mouths closed by fences, the "robots" on poles at their corners,
   give way and stop signs, lamps, bins, bollards: all of it knockable, World props -> Core's loose props), the buildings in their real
   outlines and heights (OSM), the big stadium beside the circuit (plain: no name), the lighthouse at Mouille Point (red and white), palms
   and the trees of OSM, car parks with cars, and the view beyond (Copernicus DEM: Signal Hill, Lion's Head, Table Mountain with its flat
   top, Devil's Peak; the towers of the city), drawn on a shell inside the camera's far plane. Only place names; no names of the circuit,
   events, people, firms or brands. No birds (def.noBirds), no helicopter.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.theme || typeof CPT_DATA === 'undefined') return;
  const { clamp, lerp, sstep, rng } = Core, TAU = Math.PI * 2;
  const { GB, box, cyl, cone, ico } = World, K = World.kit;

  const b64 = (s) => { const b = atob(s), a = new Uint8Array(b.length); for (let k = 0; k < b.length; k++) a[k] = b.charCodeAt(k); return a; };
  const hash = (a, b) => { let h = Math.imul((a * 73856093) ^ (b * 19349663), 0x9e3779b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca77); h ^= h >>> 13; return (h >>> 0) / 4294967296; };

  // ---- a raster of polygons (even-odd, holes included) on a grid of vertices (x0 + i c, z0 + j c): M[k] = v where the vertex lies inside ----
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
  function chamfer(G, seed) {   // two-pass chamfer distance (metres) to the vertices where seed(k)
    const n = G.nx * G.nz, D = new Float32Array(n), c = G.c, d2 = c * Math.SQRT2;
    for (let k = 0; k < n; k++) D[k] = seed(k) ? 0 : 1e9;
    for (let j = 0; j < G.nz; j++) for (let i = 0; i < G.nx; i++) { const k = j * G.nx + i; let v = D[k];
      if (i > 0) v = Math.min(v, D[k - 1] + c); if (j > 0) { v = Math.min(v, D[k - G.nx] + c); if (i > 0) v = Math.min(v, D[k - G.nx - 1] + d2); if (i < G.nx - 1) v = Math.min(v, D[k - G.nx + 1] + d2); } D[k] = v; }
    for (let j = G.nz - 1; j >= 0; j--) for (let i = G.nx - 1; i >= 0; i--) { const k = j * G.nx + i; let v = D[k];
      if (i < G.nx - 1) v = Math.min(v, D[k + 1] + c); if (j < G.nz - 1) { v = Math.min(v, D[k + G.nx] + c); if (i < G.nx - 1) v = Math.min(v, D[k + G.nx + 1] + d2); if (i > 0) v = Math.min(v, D[k + G.nx - 1] + d2); } D[k] = v; }
    return D;
  }
  // the nearest road sample to (x, z) through a 32 m hash of the samples; its lateral offset and the barrier on that side
  function ctNear(T) {
    const H = new Map(), c = 32;
    for (let i = 0; i < T.N; i++) { const k = Math.floor(T.px[i] / c) + ',' + Math.floor(T.pz[i] / c); let L = H.get(k); if (!L) H.set(k, L = []); L.push(i); }
    const o = { i: -1, lat: 0, bar: 0, d: 1e9, dc: 1e9 };
    return (x, z, wide) => {
      const a0 = Math.floor(x / c), b0 = Math.floor(z / c), R = wide ? 3 : 1; let bi = -1, bd = 1e18;
      for (let a = a0 - R; a <= a0 + R; a++) for (let b = b0 - R; b <= b0 + R; b++) { const L = H.get(a + ',' + b); if (L) for (const i of L) { const dx = x - T.px[i], dz = z - T.pz[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } } }
      o.i = bi; if (bi < 0) { o.lat = 1e9; o.bar = 0; o.d = 1e9; o.dc = 1e9; return o; }
      o.lat = (x - T.px[bi]) * T.nx[bi] + (z - T.pz[bi]) * T.nz[bi]; o.bar = o.lat > 0 ? T.br[bi] : T.bl[bi]; o.d = Math.abs(o.lat) - o.bar; o.dc = Math.sqrt(bd); return o;
    };
  }

  /* ---- the ground of Green Point: an 8 m grid over the data's box: the land (OSM's outline of the coast) and the sea, the height (the ground
     of the surface model, a.s.l. less the start line's height; near the circuit level with its road), the land's kind ---- */
  let MG = null;
  const KIND = { open: 0, trees: 1, built: 2, water: 3, sand: 4, shrub: 5, lawn: 6, pitch: 7, paved: 8, golf: 9, rock: 10, track: 11 };
  function ctPrep(T, D, near) {
    const c = 8, G = { c, x0: D.dem.x0 + 8, z0: D.dem.z0 + 8 };
    G.nx = Math.floor((D.dem.x0 + (D.dem.nx - 1) * D.dem.cell - 8 - G.x0) / c) + 1; G.nz = Math.floor((D.dem.z0 + (D.dem.nz - 1) * D.dem.cell - 8 - G.z0) / c) + 1;
    const n = G.nx * G.nz, land = new Uint8Array(n), kind = new Uint8Array(n), H = new Float32Array(n);
    for (const poly of D.land) rasterPoly(land, G, poly, 1);
    const wetP = new Uint8Array(n); for (const w of D.water) rasterPoly(wetP, G, w.slice(1), 1);
    const sdW = chamfer(G, (k) => !land[k]), sdL = chamfer(G, (k) => !!land[k]);
    const dem = new Int16Array(b64(D.dem.b64).buffer), DM = D.dem, base = D.base;
    const demAt = (x, z) => { const gx = clamp((x - DM.x0) / DM.cell, 0, DM.nx - 1.001), gz = clamp((z - DM.z0) / DM.cell, 0, DM.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, k = j * DM.nx + i;
      return ((dem[k] * (1 - u) + dem[k + 1] * u) * (1 - v) + (dem[k + DM.nx] * (1 - u) + dem[k + DM.nx + 1] * u) * v) / 10; };
    G.demAt = demAt; G.WL = -base;
    // land cover (10 m) and the land use polygons over it
    const LC = D.lc, lcA = new Uint8Array(LC.nx * LC.nz); { const r = b64(LC.rle); let p = 0; for (const v of r) { const cnt = (v & 31) + 1; lcA.fill(v >> 5, p, p + cnt); p += cnt; } }
    const LCK = [KIND.open, KIND.trees, KIND.built, KIND.water, KIND.sand, KIND.shrub];
    for (let j = 0; j < G.nz; j++) for (let i = 0; i < G.nx; i++) { const x = G.x0 + i * c, z = G.z0 + j * c, a = Math.floor((x - LC.x0) / LC.cell), b = Math.floor((z - LC.z0) / LC.cell);
      const v = a >= 0 && b >= 0 && a < LC.nx && b < LC.nz ? lcA[b * LC.nx + a] : 2; kind[j * G.nx + i] = v === 3 ? KIND.built : LCK[v]; }
    const LU = { park: KIND.lawn, grass: KIND.lawn, village_green: KIND.lawn, garden: KIND.lawn, flowerbed: KIND.lawn, dog_park: KIND.lawn, playground: KIND.paved, pitch: KIND.pitch, golf_course: KIND.golf, green: KIND.pitch, fairway: KIND.golf, bunker: KIND.sand,
      pedestrian: KIND.paved, plaza: KIND.paved, beach: KIND.sand, sand: KIND.sand, scrub: KIND.shrub, heath: KIND.shrub, wood: KIND.trees, forest: KIND.trees, grassland: KIND.open, wetland: KIND.lawn, track: KIND.track, stadium: KIND.paved, residential: KIND.built, commercial: KIND.built, retail: KIND.built, industrial: KIND.built, school: KIND.built, construction: KIND.built };
    const ORD = ['residential', 'commercial', 'retail', 'industrial', 'school', 'construction', 'stadium', 'park', 'grassland', 'village_green', 'garden', 'golf_course', 'fairway', 'wood', 'forest', 'scrub', 'heath', 'grass', 'dog_park', 'wetland', 'flowerbed', 'pitch', 'green', 'bunker', 'beach', 'sand', 'playground', 'pedestrian', 'plaza', 'track'];
    const lus = D.lu.slice().sort((a, b) => ORD.indexOf(a[0]) - ORD.indexOf(b[0]));
    for (const e of lus) if (LU[e[0]] != null) rasterPoly(kind, G, e.slice(1), LU[e[0]]);
    for (const p of D.parking) rasterPoly(kind, G, [p], KIND.paved);
    // the distance to the circuit's centre line (exact within 70 m) and its height there
    const dT = new Float32Array(n), hT = new Float32Array(n), sideB = new Float32Array(n);
    for (let k = 0; k < n; k++) { const x = G.x0 + (k % G.nx) * c, z = G.z0 + Math.floor(k / G.nx) * c, q = near(x, z, true);
      dT[k] = q.dc; if (q.i >= 0) { hT[k] = T.hy[q.i]; sideB[k] = Math.abs(q.lat) - q.bar; } else { hT[k] = 0; sideB[k] = 1e9; } }
    // near the coast the true distance to the land's outline (its edges hashed in 16 m cells): a smooth waterline, no steps
    const EH = new Map(), EC = 16;
    for (const poly of D.land) for (const r of poly) for (let a = 0, b = r.length - 1; a < r.length; b = a++) {
      const ax = r[b][0], az = r[b][1], bx = r[a][0], bz = r[a][1];
      for (let qa = Math.floor(Math.min(ax, bx) / EC); qa <= Math.floor(Math.max(ax, bx) / EC); qa++) for (let qb = Math.floor(Math.min(az, bz) / EC); qb <= Math.floor(Math.max(az, bz) / EC); qb++) { const key = qa * 65536 + qb; let Le = EH.get(key); if (!Le) EH.set(key, Le = []); Le.push(ax, az, bx, bz); } }
    const edgeD = (x, z) => { let best = 1e9; const a0 = Math.floor(x / EC), b0 = Math.floor(z / EC);
      for (let a = a0 - 1; a <= a0 + 1; a++) for (let b = b0 - 1; b <= b0 + 1; b++) { const Le = EH.get(a * 65536 + b); if (!Le) continue;
        for (let q = 0; q < Le.length; q += 4) { const ax = Le[q], az = Le[q + 1], vx = Le[q + 2] - ax, vz = Le[q + 3] - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1e-9), 0, 1), dx = x - ax - vx * t, dz = z - az - vz * t, dd = dx * dx + dz * dz; if (dd < best) best = dd; } }
      return Math.sqrt(best); };
    const SD = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      let sd = land[k] ? sdW[k] : -sdL[k];
      if (Math.abs(sd) < 20) { const e = edgeD(G.x0 + (k % G.nx) * c, G.z0 + Math.floor(k / G.nx) * c); if (e < 21) sd = land[k] ? e : -e; }
      SD[k] = sd;   // (+ on the land: metres to the sea)
      const x = G.x0 + (k % G.nx) * c, z = G.z0 + Math.floor(k / G.nx) * c;
      let h;
      if (sd <= 0) h = G.WL + Math.max(-7, sd * 0.3);   // (the sea bed falling away)
      else {
        const dm = demAt(x, z) - base, coast = G.WL + Math.min(2.8, sd * 0.4);   // (the rocks and the sea wall rising out of the water)
        h = Math.max(lerp(coast, dm, sstep(5, 24, sd)), G.WL + Math.min(0.3, sd * 0.4));
        if (sideB[k] < 40) { const tgt = hT[k] - 0.12, f = sstep(40, 6, sideB[k]); h = lerp(h, tgt, f); }   // (beside the circuit: level with its road)
        if (wetP[k]) { h -= 1.2; kind[k] = KIND.water; }
        if (sd < 9 && kind[k] !== KIND.sand && kind[k] !== KIND.paved) kind[k] = KIND.rock;
      }
      H[k] = h;
    }
    MG = Object.assign(G, { land, kind, H, SD, dT, wetP, x1: G.x0 + (G.nx - 1) * c, z1: G.z0 + (G.nz - 1) * c });
    return MG;
  }
  function gAt(A, x, z) {   // bilinear lookup in a grid array of MG
    const G = MG, gx = clamp((x - G.x0) / G.c, 0, G.nx - 1.001), gz = clamp((z - G.z0) / G.c, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, k = j * G.nx + i;
    return (A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + G.nx] * (1 - u) + A[k + G.nx + 1] * u) * v;
  }
  function ctGround(x, z) {   // the ground mesh's surface (the same two triangles per cell)
    const G = MG; if (!G) return 0;
    if (x < G.x0 || z < G.z0 || x > G.x1 || z > G.z1) return G.WL - 4;
    const gx = (x - G.x0) / G.c, gz = (z - G.z0) / G.c, i = Math.min(G.nx - 2, Math.floor(gx)), j = Math.min(G.nz - 2, Math.floor(gz)), u = gx - i, v = gz - j, A = G.H, k = j * G.nx + i;
    return u + v <= 1 ? A[k] + u * (A[k + 1] - A[k]) + v * (A[k + G.nx] - A[k]) : A[k + G.nx + 1] + (1 - u) * (A[k + G.nx] - A[k + G.nx + 1]) + (1 - v) * (A[k + 1] - A[k + G.nx + 1]);
  }
  const ctKind = (x, z) => { const G = MG, i = Math.round((x - G.x0) / G.c), j = Math.round((z - G.z0) / G.c); return i < 0 || j < 0 || i >= G.nx || j >= G.nz ? KIND.water : G.land[j * G.nx + i] ? G.kind[j * G.nx + i] : KIND.water; };
  const ctSea = (x, z) => gAt(MG.SD, x, z) < 0;

  function buildCapetown(scene, tex, opts) {
    const T = K.track(), D = CPT_DATA, def = T.def, N = T.N, w = T.w, ds = T.ds, L = T.len, sStart = T.startS, R = rng(2921);
    const root = new THREE.Group(); scene.add(root);
    const near = ctNear(T);
    ctPrep(T, D, near);
    const WL = MG.WL;
    const out = { root, dyn: {}, groundH: ctGround, camFloor: (x, z) => Math.max(ctGround(x, z), WL), props: [], farClip: true, ownTex: [], ownMarks: false };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    out.bounds = { minX: MG.x0, maxX: MG.x1, minZ: MG.z0, maxZ: MG.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; }, sAt = (d) => (((sStart + d) % L) + L) % L;
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const atSf = K.atSf, hyS = (s) => T.elevAt(K.wrapS(s)).y;
    const addM = (g, mat, cast, recv) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = recv !== false; m.castShadow = !!cast; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); return m; };
    const scen = new K.Chunks(288);   // vertex coloured scenery in 288 m chunks
    const eh = new Map(), EHC = 32;   // tree / building exclusion (hashed circles)
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };
    const C = { T, D, def, N, w, ds, L, sStart, R, root, out, tex, opts, ownTex, matV, dS, sAt, Pt, atSf, hyS, addM, scen, exclPush, excluded, near, WL };
    { const BH = new Map(); for (const b of D.bld) { const r = b[4]; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of r) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
        for (let a = Math.floor(x0 / 32); a <= Math.floor(x1 / 32); a++) for (let c = Math.floor(z0 / 32); c <= Math.floor(z1 / 32); c++) { const k = a + ',' + c; let Lb = BH.get(k); if (!Lb) BH.set(k, Lb = []); Lb.push(r); } }
      C.inBld = (x, z, m) => { const Lb = BH.get(Math.floor(x / 32) + ',' + Math.floor(z / 32)); if (!Lb) return false; for (const r of Lb) if (K.inPoly(r, x, z) || (m && K.polyDist(r, x, z) < m)) return true; return false; }; }
    const tag = (f, nm) => { const n0 = root.children.length; f(); for (let k = n0; k < root.children.length; k++) if (!root.children[k].name) root.children[k].name = nm; };
    tag(() => ctGroundMesh(C), 'ctGround');
    tag(() => ctWater(C), 'ctWater');
    ctLegs(C);
    tag(() => ctRoad(C), 'ctRoad');
    tag(() => ctWalls(C), 'ctWalls');
    tag(() => ctPits(C), 'ctPits');
    tag(() => ctStands(C), 'ctStands');
    tag(() => ctBuildings(C), 'ctBuildings');
    tag(() => ctStreets(C), 'ctStreets');
    tag(() => ctJunctions(C), 'ctJunctions');
    tag(() => ctLandmarks(C), 'ctLandmarks');
    tag(() => ctTrees(C), 'ctTrees');
    tag(() => ctParking(C), 'ctParking');
    const far = ctFar(C);
    out.dyn.step = (t, car, cam) => { far(cam); };
    tag(() => scen.addTo(root, matV, true, true), 'ctScen');
    K.crowdFinish(C.CR, root, out);
    out.junctionProps = C.nJ || 0; out.mg = MG;
    return out;
  }

  /* ---- the ground mesh: 256 m chunks of the 8 m grid (cells deep under the sea left out), one grass material, the land's kind in its vertex
     colours; the car parks, plazas and beaches on top as their own OSM outlines (crisp edges) ---- */
  const KCOL = [[0.62, 0.66, 0.46], [0.42, 0.52, 0.34], [0.74, 0.73, 0.69], [0.5, 0.56, 0.52], [0.92, 0.86, 0.68], [0.5, 0.54, 0.4], [0.58, 0.74, 0.42], [0.48, 0.74, 0.36], [0.82, 0.8, 0.76], [0.6, 0.78, 0.44], [0.52, 0.5, 0.47], [0.78, 0.36, 0.28]];
  function ctGroundMesh(C) {
    const G = MG, mat = new THREE.MeshLambertMaterial({ map: C.tex.grass, vertexColors: true }), grp = new THREE.Group(); C.root.add(grp); C.out.ground = grp;
    const S = 48, WL = C.WL;   // (cells per chunk side: 384 m)
    for (let cj = 0; cj < G.nz - 1; cj += S) for (let ci = 0; ci < G.nx - 1; ci += S) {
      const ni = Math.min(S, G.nx - 1 - ci), nj = Math.min(S, G.nz - 1 - cj), P = [], Cl = [], U = [], I = [];
      for (let j = 0; j <= nj; j++) for (let i = 0; i <= ni; i++) {
        const k = (cj + j) * G.nx + ci + i, x = G.x0 + (ci + i) * G.c, z = G.z0 + (cj + j) * G.c, h = G.H[k], kd = G.land[k] ? G.kind[k] : KIND.water;
        const n1 = hash(ci + i, cj + j), n2 = 0.92 + 0.16 * Math.sin(x * 0.031 + Math.sin(z * 0.027) * 2) * Math.sin(z * 0.023 + x * 0.007);
        let col = KCOL[kd].map(v => v * n2 * (0.95 + 0.1 * n1));
        if (kd === KIND.rock) { const r = hash(i * 3 + ci, j * 7 + cj); col = [0.46 + r * 0.14, 0.44 + r * 0.12, 0.42 + r * 0.1]; }   // (the granite boulders of the shore)
        if (h < WL + 0.1) { const t = sstep(WL + 0.1, WL - 2.5, h); col = [lerp(col[0], 0.36, t), lerp(col[1], 0.42, t), lerp(col[2], 0.4, t)]; }
        P.push(x, h, z); Cl.push(col[0], col[1], col[2]); U.push(x / 14, -z / 14);
      }
      const W1 = ni + 1;
      for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) { const a = j * W1 + i, b = a + 1, c = a + W1, d = c + 1;
        if (Math.max(P[a * 3 + 1], P[b * 3 + 1], P[c * 3 + 1], P[d * 3 + 1]) < WL - 2.2) continue;   // (deep under the sea)
        I.push(a, c, b, b, c, d); }
      if (!I.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
    }
    // the car parks (asphalt), plazas and promenades (paving), the beaches (sand), the athletics track (red): OSM outlines a few cm over the ground
    const OV = { parking: [C.tex.asphalt, [0.82, 0.82, 0.84], 8], pedestrian: [C.tex.paving, [0.96, 0.94, 0.9], 3], plaza: [C.tex.paving, [0.96, 0.94, 0.9], 3], beach: [C.tex.sand, [1.0, 0.96, 0.84], 6], track: [C.tex.sand, [0.86, 0.42, 0.34], 6] };
    const ov = {}, near = C.near, polys = C.D.lu.filter(e => OV[e[0]]).map(e => [e[0], e[1]]).concat(C.D.parking.map(r => ['parking', r]));
    for (const [cl, ring] of polys) { const o = OV[cl]; if (ring.length < 3) continue;
      const pts = ring.map(p => new THREE.Vector2(p[0], p[1])); if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
      let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts, []); } catch (e) { continue; }
      const g = ov[cl] || (ov[cl] = new K.Chunks(256, true)), y = (p) => Math.max(ctGround(p.x, p.y), C.WL + 0.05) + 0.05;
      for (const [a, b, c] of tris) { const A = pts[a], B = pts[b], Cc = pts[c], m = [(A.x + B.x + Cc.x) / 3, (A.y + B.y + Cc.y) / 3]; if (near(m[0], m[1]).d < 0.5) continue;
        g.get(m[0], m[1]).quadUp([A.x, y(A), A.y], [B.x, y(B), B.y], [Cc.x, y(Cc), Cc.y], [Cc.x, y(Cc), Cc.y], [o[1], o[1], o[1], o[1]], [[A.x / o[2], -A.y / o[2]], [B.x / o[2], -B.y / o[2]], [Cc.x / o[2], -Cc.y / o[2]], [Cc.x / o[2], -Cc.y / o[2]]]); }
    }
    for (const k in ov) { const o = OV[k]; ov[k].addTo(grp, new THREE.MeshLambertMaterial({ map: o[0], vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), false, true); }
  }

  /* ---- the Atlantic: one plane at the sea's level (the ground keeps it out where it is land), the swell and the surf on the shore (the shore
     band along the waterline near the circuit); the ponds of the park a little lower ---- */
  function ctWater(C) {
    const G = MG, O = { color: 0x3f7d8e, len: 2.2, amp: 1.3, refl: 0.55, land: 0.2, shal: 0.35, lap: 0.8, surf: 0.8 };
    const wm = K.waterMat(C.tex, O), S = 9000, g = new THREE.PlaneGeometry(2 * S, 2 * S, 1, 1); g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, (uv.getX(k) - 0.5) * 2 * S / 9, (uv.getY(k) - 0.5) * 2 * S / 9);
    const m = new THREE.Mesh(g, wm); m.position.set((G.x0 + G.x1) / 2, C.WL, (G.z0 + G.z1) / 2); m.receiveShadow = true; m.updateMatrix(); m.matrixAutoUpdate = false; C.root.add(m);
    C.out.dyn.water = C.tex.water; C.out.sea = C.WL;
    const sd = (x, z) => gAt(G.dT, x, z) > 650 ? 99 : -gAt(G.SD, x, z);
    for (let z = G.z0; z < G.z1; z += 512) for (let x = G.x0; x < G.x1; x += 512) {
      const band = K.shoreBand(x, z, Math.min(G.x1, x + 512), Math.min(G.z1, z + 512), C.WL + 0.01, sd, 9, { F: 4 }); if (!band) continue;
      const sh = band.attributes.shore; let mn = 1e9, mx = -1e9; for (let k = 0; k < sh.count; k++) { mn = Math.min(mn, sh.getX(k)); mx = Math.max(mx, sh.getX(k)); }
      if (sh.count < 50 || mn > -1.99 || mx < 9.99) { band.dispose(); continue; }   // (a scrap of a tile's corner without a waterline of its own)
      K.addShore(C.root, band, wm, O); }
    // the ponds of the park (OSM water): their surface 1 m under the lawn
    const pg = new GB(true);
    for (const e of C.D.water) { const ring = e[1]; if (ring.length < 3) continue; let y = 1e9; for (const p of ring) y = Math.min(y, ctGround(p[0], p[1]) + 1.1);
      const pts = ring.map(p => new THREE.Vector2(p[0], p[1])); if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse(); let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts, []); } catch (er) { continue; }
      const c = [0.55, 0.7, 0.68]; for (const [a, b, cc] of tris) pg.quadUp([pts[a].x, y - 0.75, pts[a].y], [pts[b].x, y - 0.75, pts[b].y], [pts[cc].x, y - 0.75, pts[cc].y], [pts[cc].x, y - 0.75, pts[cc].y], [c, c, c, c], [[pts[a].x / 9, -pts[a].y / 9], [pts[b].x / 9, -pts[b].y / 9], [pts[cc].x / 9, -pts[cc].y / 9], [pts[cc].x / 9, -pts[cc].y / 9]]); }
    if (!pg.empty) C.addM(pg, new THREE.MeshPhongMaterial({ map: C.tex.water, vertexColors: true, shininess: 60 }), false, true);
  }

  /* ---- the circuit: asphalt (the racing line rubbered in, darker in the braking zones), the street's old lane lines faded under the race's
     white edge lines, red and white kerbs, the pavements between the road and the barriers (kerbstones, paving), the start line and the grid ---- */
  function ctRoad(C) {
    const { T, N, w, ds, tex, Pt, addM } = C, CH = 256, offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); C.out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true }), pMat = new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true });
    C.aMat = aMat; C.lMat = lMat; C.pMat = pMat;
    const kerb = [new Uint8Array(N), new Uint8Array(N)];
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) if ((side * k > 0 && Math.abs(k) > 1 / 36) || Math.abs(k) > 1 / 21) kerb[side > 0 ? 1 : 0][i] = 1; }   // (a street circuit: kerbs at the apexes only)
    const brk = new Float32Array(N);
    for (const c of T.corners) if (c.sev >= 2) for (let k = -60; k <= 6; k++) { const i = (c.i0 + k + N) % N, f = k < -10 ? sstep(-60, -12, k) : sstep(6, -10, k); if (f > brk[i]) brk[i] = f; }
    const secT = new Float32Array(N); for (let i0 = 0, k = 0; i0 < N; k++) { const n = 40 + Math.floor(hash(k, 3) * 60), t = 0.94 + hash(k, 5) * 0.1; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const shade = (i, o) => { const rl = T.rl[i]; let k = (0.8 - (0.13 + 0.12 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.92) k -= 0.03; return [k, k, k * 1.02]; };
    const jm = C.jm;
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new K.RB(true), gl = new K.RB(), gk = new K.RB(true), gp = new K.RB(true);
      let pr = -1, pl = -1; const pk = [-1, -1], pp = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const wl = [0.94, 0.94, 0.9], l = gl.row([Pt(i, -w + 0.15, 0.034), Pt(i, -w + 0.45, 0.034), Pt(i, w - 0.45, 0.034), Pt(i, w - 0.15, 0.034)], [wl, wl, wl, wl]); if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        for (const side of [-1, 1]) {
          const si = side > 0 ? 1 : 0, bar = side > 0 ? T.br[i] : T.bl[i], kb = kerb[si][i], e0 = w + (kb ? T.curbW : 0);
          if (kb) { const cw = T.curbW, pf = [[w - 0.02, 0.035], [w + 0.14, 0.078], [w + cw - 0.12, 0.085], [w + cw + 0.02, 0.03]], vv = ii * ds / 2, sh = [0.84, 1, 1, 0.78].map(k => [k, k, k]), us = [0, 0.1, 0.92, 1], o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
            const rk = gk.row(o.map(k => Pt(i, side * pf[k][0], pf[k][1])), o.map(k => sh[k]), o.map(k => [us[k], vv])); if (pk[si] >= 0) gk.link(pk[si], rk, 0, 3); pk[si] = rk; } else pk[si] = -1;
          // the pavement from the edge (or the kerb) to the barrier: the run-off asphalt where the barrier stands far out, else paving
          const paved = !((side > 0 ? T.gravR : T.gravL)[i]) && !(jm[si][i] > 0.01), pc = paved ? [0.9, 0.89, 0.86] : [0.8, 0.8, 0.82];
          const q0 = Pt(i, side * (e0 + 0.02), 0.03), q1 = Pt(i, side * Math.max(e0 + 0.3, bar + 0.2), 0.03), qq = side > 0 ? [q0, q1] : [q1, q0];
          const rp = gp.row(qq, [pc, pc], qq.map(p => paved ? [p[0] / 2, -p[2] / 2] : [p[0] / 8, -p[2] / 8])); if (pp[si] >= 0) gp.link(pp[si], rp, 0, 1); pp[si] = rp;
        }
      }
      addM(gr, aMat); addM(gl, lMat); addM(gk, cMat); addM(gp, pMat);
    }
    // the street's own lane lines, faded (broken white lines between the lanes: the boulevards' two lanes, the others' centre line), and the
    // yellow edge line on the left of the carriageway (South Africa's markings) where the race left them
    { const gm = new GB(), wf = [0.74, 0.74, 0.72], yf = [0.8, 0.68, 0.24], Q = (i, o) => Pt(i, o, 0.031);
      for (let i = 0; i < N; i++) { const j = (i + 1) % N, d = i * ds;
        if (Math.floor(d / 3) % 3 === 0) gm.quadUp(Q(i, -0.06), Q(i, 0.06), Q(j, 0.06), Q(j, -0.06), [wf, wf, wf, wf]);
        if (T.k[i] * T.k[i] < 1 / (60 * 60)) gm.quadUp(Q(i, -w + 0.75), Q(i, -w + 0.6), Q(j, -w + 0.6), Q(j, -w + 0.75), [yf, yf, yf, yf]); }
      addM(gm, lMat); }
    // the start line and the grid
    { const sS = C.sStart, gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wh = [0.93, 0.93, 0.9], Q = (s, o, y) => { const p = C.atSf(s, o); return [p[0], C.hyS(s) + y, p[1]]; };
      gq.quadUp(Q(sS - 0.8, -w, 0.04), Q(sS - 0.8, w, 0.04), Q(sS + 0.8, w, 0.04), Q(sS + 0.8, -w, 0.04), [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) { const sb = sS - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 2.8;
        gw.quadUp(Q(sb, lat - 1.5, 0.037), Q(sb, lat + 1.5, 0.037), Q(sb + 0.35, lat + 1.5, 0.037), Q(sb + 0.35, lat - 1.5, 0.037), [wh, wh, wh, wh]);
        gw.quadUp(Q(sb - 1.6, lat - 1.5, 0.037), Q(sb + 0.35, lat - 1.5, 0.037), Q(sb + 0.35, lat - 1.25, 0.037), Q(sb - 1.6, lat - 1.25, 0.037), [wh, wh, wh, wh]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat); }
  }

  /* ---- the junctions' legs (def.junctions): where each side street leaves the circuit, its mouth (the barrier opens into it up to its fence) ---- */
  function ctLegs(C) {
    const { T, def, w, N } = C, JOFF = def.junctionOff || 11.5;
    C.legs = (def.junctions || []).map(([d, sd, ang, hw, kind, len, what]) => {
      const s = C.sAt(d), i = T.idx(s), a = ang * Math.PI / 180, tx = T.tx[i], tz = T.tz[i], nx = T.nx[i] * sd, nz = T.nz[i] * sd, ca = Math.cos(a), sa = Math.sin(a);
      const ux = tx * ca + nx * sa, uz = tz * ca + nz * sa, sn = Math.max(0.35, sa);
      const ct = ca / sn, e = hw / sn, qa = Math.min(w * ct, (w + JOFF) * ct) - e - 4.5, qb = Math.max(w * ct, (w + JOFF) * ct) + e + 4.5;
      return { d, sd, a, hw, kind, len, what, s, i, cx: T.px[i], cz: T.pz[i], cy: T.hy[i], ux, uz, vx: -uz, vz: ux, tx, tz, nx, nz, r0: w / sn, rF: (w + JOFF) / sn, rEnd: (w + JOFF) / sn + len, qa, qb };
    });
    const jm = C.jm = [new Float32Array(N), new Float32Array(N)];
    for (const Lg of C.legs) for (let q = Lg.qa - 3; q <= Lg.qb + 3; q += C.ds) { const i = T.idx(C.sAt(Lg.d + q)), f = Math.min(sstep(Lg.qa - 3, Lg.qa, q), sstep(Lg.qb + 3, Lg.qb, q)), si = Lg.sd > 0 ? 1 : 0; jm[si][i] = Math.max(jm[si][i], f); }
  }

  /* ---- the barriers: concrete walls (the street circuit's blocks, white with a grey foot, the game's own adverts on some), tyre walls round the
     outside of the slow corners, catch fences on poles above them ---- */
  function ctWalls(C) {
    const { T, N, ds, Pt, addM, tex } = C, side2 = (s) => (s > 0 ? 1 : 0), CH = 256;
    const tyreOn = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) { if (c.sev < 3) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 8; k <= i1c + 12; k++) { const ii = ((k % N) + N) % N, bar = si ? T.br[ii] : T.bl[ii]; if (bar > T.w + 5 && !C.jm[si][ii]) tyreOn[si][ii] = 1; } }
    const kindAt = (i, side) => tyreOn[side2(side)][i] ? 2 : 1;
    C.wallKind = kindAt;
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const conc = [0.9, 0.9, 0.88], concD = [0.62, 0.62, 0.6], W1 = [1, 1, 1];
    const wallRow = (gr, i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.1), o2 = side * (bar + 0.5), o3 = side * (bar + 0.7);
      let p = [Pt(i, o - side * 0.1, -0.3), Pt(i, o - side * 0.08, 0.12), Pt(i, o + side * 0.12, 0.3), Pt(i, o + side * 0.2, 1.05), Pt(i, o2, 1.05), Pt(i, o3, 0.2)], c = [concD, concD, conc, conc, [0.96, 0.96, 0.94], concD];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c); };
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
          if (prev >= 0 && k !== pk) { if (pk === 2) gt.link(prev, tyreRow(gt, i, side, acc / 3), 0, 2); else gr.link(prev, wallRow(gr, i, side), 0, 5); prev = -1; }
          const r = k === 2 ? tyreRow(gt, i, side, acc / 3) : wallRow(gr, i, side);
          if (prev >= 0) { if (k === 2) gt.link(prev, r, 0, 2); else gr.link(prev, r, 0, 5); } prev = r; pk = k;
          fence[side2(side)][i] = k;
        }
      }
      addM(gr, rMat, true); addM(gt, tyMat, true);
    }
    // the game's own adverts on the concrete walls (tex.sponsors: 4 m boards) where the wall runs straight along the road
    { const sb = new K.Chunks(384, true);
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 2) {
        const j = (i + 2) % N, bar = side > 0 ? T.br : T.bl; if (kindAt(i, side) !== 1 || kindAt(j, side) !== 1 || Math.abs(bar[i] - bar[j]) > 0.3 || C.jm[side2(side)][i] > 0 || (i >> 1) % 5 > 2) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, o = (ii) => side * (bar[ii] + 0.32);
        const A = Pt(i, o(i), 0.32), B = Pt(j, o(j), 0.32), Cq = Pt(j, o(j), 1.0), Dq = Pt(i, o(i), 1.0), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        sb.get(A[0], A[2]).quadO(A, B, Cq, Dq, W1, Pt(i, side * (bar[i] + 2), 0.6), [[uL, v1 - 0.25], [uR, v1 - 0.25], [uR, v1], [uL, v1]]); }
      sb.addTo(C.root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true); }
    // catch fences on the walls (taller behind the tyre walls)
    const fg = new K.Chunks(384, true);
    for (const side of [-1, 1]) {
      const fc = fence[side2(side)], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N; if (!fc[i] || !fc[j]) { acc += ds; continue; }
        const e = fc[i] === 2 ? 1.2 : 0.55, top = fc[i] === 2 ? 4.2 : 3.4, Q = (ii, y) => Pt(ii, side * (bar[ii] + e), y);
        const u0 = acc / 2.5, u1 = (acc + ds) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        fg.get(ins[0], ins[2]).quadO(Q(i, 1.0), Q(j, 1.0), Q(j, top), Q(i, top), W1, ins, [[u0, 0], [u1, 0], [u1, (top - 1) / 2.5], [u0, (top - 1) / 2.5]]);
        if (i % 2 === 0) { const p = Q(i, 0); box(C.scen.get(p[0], p[2]), p[0], p[1], p[2], 0.09, top - 0.8, 0.09, T.hd[i], [0.55, 0.56, 0.58]); }
        acc += ds;
      }
    }
    fg.addTo(C.root, fMat, false, true);
  }

  /* ---- a canvas text board (a texture of its own) and an upright textured board ---- */
  function ctBoardTex(C, lines, bg, fg, stripe, W, H) {
    const c = document.createElement('canvas'); c.width = W || 512; c.height = H || 128; const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); if (stripe) { x.fillStyle = stripe; x.fillRect(0, c.height - 10, c.width, 10); x.fillRect(0, 0, c.width, 5); }
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((t, k) => { const px = Math.round(c.height * (lines.length > 1 ? 0.34 : 0.56)); x.font = '900 ' + px + 'px Arial, sans-serif'; x.fillText(t, c.width / 2, c.height * (k + 0.55) / lines.length, c.width - 24); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return C.ownTex(t);
  }
  function ctPlane(C, map, x, y, z, W, H, yaw, both) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map, side: both ? THREE.DoubleSide : THREE.FrontSide }));
    m.position.set(x, y + H / 2, z); m.rotation.y = Math.PI / 2 - yaw; m.castShadow = true; m.receiveShadow = true; m.updateMatrix(); m.matrixAutoUpdate = false; C.root.add(m); return m;
  }

  /* ---- the pit lane on the left of Vlei Road (def.pitLane [from, to, offset]: scenery, the cars do not stop there): the lane and its lines
     behind the pit wall, the teams' garages (white tents, the team's colour over the door, the crews' tool trolleys), the paddock behind them;
     the start gantry with its lights over the road and the town's name ---- */
  const TEAM = [[0.86, 0.1, 0.12], [0.12, 0.16, 0.36], [0.16, 0.46, 0.3], [0.96, 0.52, 0.1], [0.94, 0.94, 0.92], [0.14, 0.14, 0.16], [0.16, 0.36, 0.8], [0.1, 0.62, 0.72], [0.96, 0.78, 0.12], [0.55, 0.26, 0.7], [0.4, 0.42, 0.46], [0.7, 0.1, 0.1]];
  function ctPits(C) {
    const { T, def, sStart, scen, atSf, addM, exclPush } = C, PL = def.pitLane; if (!PL) return;
    const [a, b, off] = PL, sg = off < 0 ? -1 : 1, O = Math.abs(off);
    const at = (s, o, y) => { const p = atSf(s, sg * o); return [p[0], C.hyS(s) + y, p[1]]; };
    const gl = new GB(true), gp = new GB(), one = [1, 1, 1], wl = [0.95, 0.95, 0.94], yel = [0.98, 0.82, 0.12];
    const quad = (g, s0, s1, o0, o1, y, c, uv) => { const A = at(s0, o0, y), B = at(s0, o1, y), Cq = at(s1, o1, y), Dq = at(s1, o0, y); g.quadUp(A, B, Cq, Dq, [c, c, c, c], uv ? [A, B, Cq, Dq].map(p => [p[0] / 8, -p[2] / 8]) : undefined); };
    const bar = (s) => { const i = T.idx(s); return sg < 0 ? T.bl[i] : T.br[i]; };
    for (let q = a; q < b; q += 2) { const s0 = sStart + q, s1 = s0 + 2, e = Math.min(sstep(a, a + 40, q), sstep(b, b - 30, q)), lo = lerp(bar(s0) + 0.8, O, e), lo1 = lerp(bar(s1) + 0.8, O, e);
      quad(gl, s0, s1, Math.max(bar(s0) + 0.8, lo - 3.5), lo + 3.5, 0.03, one, true);
      quad(gp, s0, s1, lo + 3.2, lo + 3.4, 0.04, wl);
      if (e > 0.99) { quad(gp, s0, s1, lo + 3.5, O + 4.2, 0.025, [0.8, 0.81, 0.78]); if (q % 20 === 0) quad(gp, s0, s1, lo - 3.4, lo - 3.2, 0.04, wl); }
      if (q % 6 === 0) { const p = atSf(s0, sg * (O + 4)); exclPush(p[0], p[1], 10); } }
    // the speed limit lines and the garages: white tents 8 m wide along the lane, each team's colour over its door, the tool trolleys
    for (const q of [a + 45, b - 34]) quad(gp, sStart + q, sStart + q + 0.4, O - 3.4, O + 3.4, 0.045, yel);
    for (let q = a + 50, k = 0; q < b - 40; q += 9, k++) {
      const s0 = sStart + q, mid = at(s0 + 4.5, O + 7, 0), g = scen.get(mid[0], mid[2]), tc = TEAM[k % TEAM.length];
      if ([[0.5, 4.2], [8.5, 4.2], [0.5, 10.5], [8.5, 10.5], [4.5, 7]].some(([da, o]) => { const p = at(s0 + da, O + o, 0); return C.inBld(p[0], p[2], 0.5); })) continue;   // (no room: the stadium's grandstand)
      const blk = (sa, sb2, o0, o1, y0, y1, col, top) => { const P8 = [at(sa, o0, y0), at(sb2, o0, y0), at(sb2, o1, y0), at(sa, o1, y0), at(sa, o0, y1), at(sb2, o0, y1), at(sb2, o1, y1), at(sa, o1, y1)], m = at((sa + sb2) / 2, (o0 + o1) / 2, (y0 + y1) / 2);
        for (const [i0, i1, i2, i3, cc] of [[0, 1, 5, 4, col], [1, 2, 6, 5, col], [2, 3, 7, 6, col], [3, 0, 4, 7, col], [4, 5, 6, 7, top || col]]) g.quadO(P8[i0], P8[i1], P8[i2], P8[i3], cc, m); };
      blk(s0 + 0.1, s0 + 8.9, O + 4.2, O + 10.5, 0, 3.4, [0.95, 0.95, 0.94], [0.97, 0.97, 0.97]);   // the tent
      blk(s0 + 0.3, s0 + 8.7, O + 4.15, O + 4.3, 2.7, 3.4, tc);                               // the team's band over the door
      blk(s0 + 0.5, s0 + 8.5, O + 4.25, O + 4.3, 0, 2.6, [0.2, 0.21, 0.24]);                  // the open door (dark inside)
      for (const t of [1.5, 7.5]) blk(s0 + t - 0.4, s0 + t + 0.4, O + 3.4, O + 3.9, 0, 1.0, [0.16, 0.17, 0.2], tc);
      exclPush(mid[0], mid[2], 12); if (C.CR) C.CR.exclAdd(mid[0], mid[2], 10);
    }
    addM(gl, C.aMat); addM(gp, C.lMat);
    // the start gantry: two posts outside the walls, a beam with the five lights, a banner with the town's name
    { const i = T.idx(sStart), x = T.px[i], z = T.pz[i], y = T.hy[i], h = T.hd[i], g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      const oL = T.bl[i] + 1.0, oR = T.br[i] + 1.0;
      for (const o of [-oL, oR]) box(g, x + nx * o, y - 0.3, z + nz * o, 0.8, 7.9, 0.8, h, gray);
      const cx = x + nx * (oR - oL) / 2, cz = z + nz * (oR - oL) / 2;
      box(g, cx, y + 6.4, cz, 1.1, 1.3, oL + oR + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, y + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.95, z + nz * o); m.rotation.y = -h; C.root.add(m); lights.push(m); }
      C.out.dyn.lights = lights;
      const bt = ctBoardTex(C, ['CAPE TOWN'], '#1c3f8f', '#ffffff', '#f2b705', 1024, 96);
      for (const sd of [-1, 1]) { const m = ctPlane(C, bt, cx - T.tx[i] * 0.6 * sd, y + 6.45, cz - T.tz[i] * 0.6 * sd, oL + oR - 1, 1.2, sd > 0 ? Math.atan2(-T.tz[i], -T.tx[i]) : Math.atan2(T.tz[i], T.tx[i])); m.castShadow = false; }
      exclPush(x, z, Math.max(oL, oR) + 6);
    }
  }

  /* ---- grandstands (def.stands [from, to, side, rows, roof]): temporary steel stands behind the walls, tiers following the road with the
     seated crowd picture on them, a roof over the main one, flags of South Africa (simplified) along their backs; fans along the barriers ---- */
  const CT_SHIRTS = [[0.1, 0.45, 0.25], [0.98, 0.78, 0.12], [0.95, 0.95, 0.94], [0.12, 0.16, 0.42], [0.86, 0.1, 0.12], [0.12, 0.13, 0.16], [0.16, 0.36, 0.8], [0.94, 0.5, 0.1], [0.1, 0.45, 0.25], [0.6, 0.18, 0.5], [0.98, 0.78, 0.12], [0.95, 0.95, 0.94]];
  function ctStands(C) {
    const { T, def, sStart, scen, atSf, addM, exclPush, tex } = C, crowdG = new GB(true), W1 = [1, 1, 1];
    const nearF = (x, z) => { const q = C.near(x, z); return q.d; };
    const CR = K.crowdCtx({ gH: ctGround, near: nearF, excluded: (x, z) => C.excluded(x, z), water: (x, z) => ctSea(x, z), maxSlope: 0.5, shirts: CT_SHIRTS, chunk: 256 });
    C.CR = CR;
    for (const [a, b, side, rows, roof] of def.stands || []) {
      const dep = 0.95, rise = 0.62, st = [];
      for (let d = a; d <= b + 0.01; d += Math.min(5, Math.max(1, b - d))) { const s = C.sAt(d), i = T.idx(s), f0 = (side > 0 ? T.br[i] : T.bl[i]) + 2.4; st.push({ s, f0, y: T.hy[i] }); }
      const F0 = st.map((q, m) => { let t = 0, n = 0; for (let e = -3; e <= 3; e++) { t += st[clamp(m + e, 0, st.length - 1)].f0; n++; } return Math.max(q.f0 - 0.3, t / n); });
      const rowsP = st.map((q, m) => { const f0 = F0[m], prof = [[f0 - 0.3, -0.5]]; let y = 0;
        for (let k = 0; k < rows; k++) { const o = f0 + k * dep; y = 0.55 + k * rise; prof.push([o, y], [o + dep, y]); }
        const back = f0 + rows * dep; prof.push([back, y + 1.2], [back + 0.3, y + 1.2], [back + 0.3, -0.3]);
        return { s: q.s, prof, pts: prof.map(([o, yy]) => { const p = atSf(q.s, side * o); return [p[0], q.y + yy, p[1]]; }), y: q.y, top: y + 4.2, o0: f0 + rows * dep * 0.35, o1: back + 0.6 }; });
      for (let m = 0; m + 1 < rowsP.length; m++) {
        const A = rowsP[m], B = rowsP[m + 1], g = scen.get(A.pts[1][0], A.pts[1][2]), n = A.pts.length;
        for (let e = 0; e + 1 < n; e++) { const a0 = A.pts[e], a1 = A.pts[e + 1], b0 = B.pts[e], b1 = B.pts[e + 1], up = Math.abs(a1[1] - a0[1]) < 0.05, om = (A.prof[e][0] + A.prof[e + 1][0]) / 2, ym = (a0[1] + a1[1]) / 2;
          const p = atSf(A.s, side * (up ? om : e >= n - 3 ? om - 1 : om + 1)); g.quadO(a0, a1, b1, b0, up ? [0.55, 0.57, 0.6] : e >= n - 3 ? [0.38, 0.4, 0.44] : [0.45, 0.47, 0.5], [p[0], up ? ym - 1 : ym, p[1]]); }
        for (let k = 0; k < rows; k++) { const a0 = A.pts[1 + k * 2], a1 = A.pts[2 + k * 2], b0 = B.pts[1 + k * 2], b1 = B.pts[2 + k * 2], v = (k * 0.11) % 1, u0 = (m * 5) / 12, len = Math.hypot(b0[0] - a0[0], b0[2] - a0[2]);
          crowdG.quadUp([a0[0], a0[1] + 0.02, a0[2]], [a1[0], a1[1] + 0.02, a1[2]], [b1[0], b1[1] + 0.02, b1[2]], [b0[0], b0[1] + 0.02, b0[2]], [W1, W1, W1, W1], [[u0, v], [u0, v + 0.1], [u0 + len / 12, v + 0.1], [u0 + len / 12, v]]); }
        if (m % 2 === 0) for (let k = 0; k <= rows; k += 3) { const o = A.prof[0][0] + 0.3 + k * dep, y = 0.55 + Math.max(0, k - 1) * rise, p = atSf(A.s, side * o); box(g, p[0], A.y - 0.2, p[1], 0.08, y + 0.2, 0.08, 0, [0.5, 0.52, 0.55]); }
        if (roof) { const q = (Rr, o, y) => { const p = atSf(Rr.s, side * o); return [p[0], Rr.y + y, p[1]]; }, tA = A.top, tB = B.top, rc = m % 2 ? [0.92, 0.93, 0.95] : [0.84, 0.86, 0.89];
          g.quadO(q(A, A.o0 + 0.6, tA + 0.75), q(B, B.o0 + 0.6, tB + 0.75), q(B, B.o1, tB), q(A, A.o1, tA), rc, q(A, (A.o0 + A.o1) / 2, tA - 5));
          g.quadO(q(A, A.o0, tA + 0.8), q(B, B.o0, tB + 0.8), q(B, B.o0 + 0.6, tB + 0.75), q(A, A.o0 + 0.6, tA + 0.75), [0.1, 0.42, 0.24], q(A, A.o0 + 0.3, tA - 5));
          g.quadO(q(A, A.o0, tA + 0.5), q(B, B.o0, tB + 0.5), q(B, B.o1, tB - 0.3), q(A, A.o1, tA - 0.3), [0.6, 0.62, 0.66], q(A, (A.o0 + A.o1) / 2, tA + 5));
          if (m % 2 === 0) { const p = atSf(A.s, side * (A.o1 - 0.4)); box(g, p[0], A.y - 0.3, p[1], 0.4, tA + 0.3, 0.4, 0, [0.86, 0.87, 0.9]); } }
      }
      for (let m = 1; m < rowsP.length - 1; m += 3) { const r = rowsP[m], p = atSf(r.s, side * (r.o1 + 0.3)); ctFlag(scen.get(p[0], p[1]), p[0], r.y, p[1], r.top + 3.2, T.hd[T.idx(r.s)]); }
      for (const r of rowsP) { const p = atSf(r.s, side * (r.prof[0][0] + rows * dep * 0.5)); exclPush(p[0], p[1], rows * dep / 2 + 5); CR.exclAdd(p[0], p[1], rows * dep / 2 + 3); }
    }
    if (!crowdG.empty) addM(crowdG, K.crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.11, 0.1));
    for (const [a, b, side] of def.ga || []) K.crowdRun(CR, sStart + a, sStart + b, side, { rows: 3, dens: 0.55, first: 1.4, gap: 0.9, clump: 0.6, sit: 0.2, flag: 0.08, below: 1.2, above: 2, label: 'ga' });
    for (const [a, b, side] of def.stands || []) K.crowdRun(CR, sStart + a - 12, sStart + a, side, { rows: 2, dens: 0.4, first: 1.6, label: 'standEnd' });
  }
  // a flagpole with the flag of South Africa (simplified: red over blue, the green band from the hoist edged white, the black triangle edged gold)
  function ctFlag(g, x, y, z, h, yaw) {
    const c = Math.cos(yaw), s = Math.sin(yaw), at = (u) => [x + c * u, z + s * u], F = 1.3, y0 = y + h - 1.0 * F;
    box(g, x, y, z, 0.1, h + 0.1, 0.1, yaw, [0.78, 0.8, 0.82]);
    const bar = (u0, u1, v0, v1, col, t) => { const [cx, cz] = at((u0 + u1) / 2 * F); box(g, cx, y0 + v0 * F, cz, (u1 - u0) * F, (v1 - v0) * F, t, yaw, col); };
    bar(0.06, 1.56, 0.6, 1.0, [0.86, 0.14, 0.12], 0.03); bar(0.06, 1.56, 0, 0.4, [0.0, 0.18, 0.5], 0.03);
    bar(0.06, 1.56, 0.36, 0.64, [0.96, 0.96, 0.95], 0.04); bar(0.06, 1.56, 0.4, 0.6, [0.0, 0.48, 0.24], 0.05);
    bar(0.06, 0.4, 0.22, 0.78, [0.98, 0.72, 0.1], 0.06); bar(0.06, 0.3, 0.28, 0.72, [0.06, 0.06, 0.06], 0.07);
  }

  /* ---- a facade atlas (its own texture): rows of one floor each, the kinds of Cape Town's buildings: 0 white plastered flats with balconies,
     1 a glazed office floor, 2 a cream block with deep windows, 3 shops at street level (awnings, glass), 4 a pastel house, 5 a grey hotel block
     with tall windows, 6 a warehouse wall, 7 the stadium's woven skin (pale, open weave). One floor = 3.2 m high, one bay = 3.6 m wide ---- */
  function ctFacadeTex() {
    const W = 128, Hh = 64, c = document.createElement('canvas'); c.width = W; c.height = Hh * 8; const x = c.getContext('2d');
    const row = (k, f) => { x.save(); x.translate(0, k * Hh); f(); x.restore(); };
    const R = rng(1652);
    row(0, () => { x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, W, Hh); x.fillStyle = '#3d4e5c'; x.fillRect(14, 8, 100, 40); x.fillStyle = '#7f98ad'; x.fillRect(16, 10, 44, 18);
      x.fillStyle = '#e6e3dc'; x.fillRect(6, 44, 116, 6); x.fillStyle = 'rgba(40,50,60,0.55)'; for (let i = 8; i < 122; i += 6) x.fillRect(i, 36, 2, 8); x.fillStyle = '#d6d2c8'; x.fillRect(0, 56, W, 8); });
    row(1, () => { x.fillStyle = '#2f4454'; x.fillRect(0, 0, W, Hh); x.fillStyle = '#6f8ea6'; x.fillRect(0, 4, W, 22); x.fillStyle = '#4b6577'; x.fillRect(0, 26, W, 28);
      x.fillStyle = '#c9d2d8'; for (let i = 0; i < W; i += 32) x.fillRect(i, 0, 3, Hh); x.fillRect(0, 56, W, 8); });
    row(2, () => { x.fillStyle = '#e7dcc4'; x.fillRect(0, 0, W, Hh); for (const ox of [10, 70]) { x.fillStyle = '#c7b99b'; x.fillRect(ox - 3, 10, 54, 40); x.fillStyle = '#3a4650'; x.fillRect(ox, 13, 48, 34); x.fillStyle = '#8ea3b3'; x.fillRect(ox + 2, 15, 18, 12); } });
    row(3, () => { x.fillStyle = '#d9d3c7'; x.fillRect(0, 0, W, Hh); x.fillStyle = '#26323b'; x.fillRect(6, 18, 116, 46); x.fillStyle = '#7d93a3'; x.fillRect(10, 22, 50, 20); x.fillRect(68, 22, 50, 20);
      for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#2e6b8a' : '#e8e4da'; x.fillRect(i * 32, 8, 32, 10); } });
    row(4, () => { x.fillStyle = '#f0e0c4'; x.fillRect(0, 0, W, Hh); x.fillStyle = '#fbfaf6'; x.fillRect(28, 12, 72, 40); x.fillStyle = '#44525c'; x.fillRect(32, 16, 64, 32); x.fillStyle = '#93a7b5'; x.fillRect(34, 18, 28, 13);
      x.fillStyle = '#fbfaf6'; x.fillRect(62, 16, 4, 32); });
    row(5, () => { x.fillStyle = '#c9cbcc'; x.fillRect(0, 0, W, Hh); for (const ox of [8, 48, 88]) { x.fillStyle = '#2f3b44'; x.fillRect(ox, 6, 32, 50); x.fillStyle = '#7891a2'; x.fillRect(ox + 2, 8, 12, 20); } });
    row(6, () => { x.fillStyle = '#b9b2a6'; x.fillRect(0, 0, W, Hh); x.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < W; i += 8) x.fillRect(i, 0, 2, Hh); x.fillStyle = '#5e6870'; x.fillRect(40, 30, 48, 34); });
    row(7, () => { x.fillStyle = '#ece9e2'; x.fillRect(0, 0, W, Hh); x.strokeStyle = 'rgba(150,145,140,0.6)'; x.lineWidth = 2;
      for (let i = -64; i < W; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 64, Hh); x.stroke(); x.beginPath(); x.moveTo(i + 64, 0); x.lineTo(i, Hh); x.stroke(); } });
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; return t;
  }
  const FV = (row, f) => (8 - row - 1 + f * 0.97 + 0.015) / 8;   // (v in the atlas: row 0 at the top)

  /* ---- the buildings (OSM outlines and heights): walls in their kind's facade floor by floor, a flat roof (triangulated) with a parapet, plant
     rooms on the bigger roofs; the big stadium (its own: the woven skin, the roof ring, the tiers round the pitch); the farther town as boxes ---- */
  const BK = { apartments: [0, 0], residential: [0, 0], hotel: [5, 5], commercial: [3, 2], office: [1, 1], retail: [3, 3], house: [4, 4], detached: [4, 4], warehouse: [6, 6], hospital: [2, 2], school: [2, 2], church: [2, 2], grandstand: [2, 2] };
  const PAL = [[1, 1, 1], [0.98, 0.95, 0.88], [0.96, 0.9, 0.82], [0.9, 0.93, 0.96], [0.97, 0.88, 0.8], [0.88, 0.92, 0.86], [1, 0.97, 0.9]];
  function ctBuildings(C) {
    const { D, root, near } = C, ft = C.ownTex(ctFacadeTex()), fMat = new THREE.MeshLambertMaterial({ map: ft, vertexColors: true }), fch = new K.Chunks(192, true), roofs = new K.Chunks(192);
    let nB = 0;
    for (const b of D.bld) {
      const [kind, H0, minh, , ring] = b; if (ring.length < 3) continue;
      if (kind === 'stadium') { ctStadium(C, b, fch, roofs); continue; }
      let cx = 0, cz = 0; for (const p of ring) { cx += p[0]; cz += p[1]; } cx /= ring.length; cz /= ring.length;
      if (near(cx, cz).d < 1.5 || ctSea(cx, cz)) continue;
      let y0 = 1e9; for (const p of ring) y0 = Math.min(y0, ctGround(p[0], p[1])); y0 -= 0.3;
      const H = Math.max(3, H0) + 0.3, y1 = y0 + H, hv = hash(Math.round(cx), Math.round(cz)), st = BK[kind] || [H > 20 ? (hv < 0.3 ? 1 : hv < 0.75 ? 0 : 5) : H > 9 ? (hv < 0.5 ? 0 : 2) : (hv < 0.5 ? 4 : 2), 3];
      const col = PAL[Math.floor(hv * PAL.length)], g = fch.get(cx, cz), ins = [cx, (y0 + y1) / 2, cz], floors = Math.max(1, Math.round((H - 0.3) / 3.2)), fh = (H - 0.3) / floors;
      const yb = y0 + (minh || 0);
      for (let k = 0; k < ring.length; k++) {
        const a = ring[k], e = ring[(k + 1) % ring.length], l = Math.hypot(e[0] - a[0], e[1] - a[1]); if (l < 0.3) continue;
        const u1 = Math.max(1, Math.round(l / 3.6));
        for (let f = 0; f < floors; f++) { const ya = f === 0 ? yb : y0 + 0.3 + f * fh, yt = y0 + 0.3 + (f + 1) * fh, r = f === 0 && floors > 2 ? st[1] : st[0];
          g.quadO([a[0], ya, a[1]], [e[0], ya, e[1]], [e[0], yt, e[1]], [a[0], yt, a[1]], col, ins, [[0, FV(r, 0)], [u1, FV(r, 0)], [u1, FV(r, 1)], [0, FV(r, 1)]]); }
      }
      // the roof: triangulated outline, a darker parapet; plant rooms and water tanks on the bigger ones
      const pts = ring.map(p => new THREE.Vector2(p[0], p[1])); if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
      let tris = null; try { tris = THREE.ShapeUtils.triangulateShape(pts, []); } catch (er) { tris = null; }
      const rg = roofs.get(cx, cz), rc = [0.56 + hv * 0.12, 0.55 + hv * 0.1, 0.52 + hv * 0.08];
      if (tris) for (const [p0, p1, p2] of tris) rg.triO([pts[p0].x, y1, pts[p0].y], [pts[p1].x, y1, pts[p1].y], [pts[p2].x, y1, pts[p2].y], rc, [cx, y1 - 5, cz]);
      let area = 0; for (let k = 0; k < ring.length; k++) { const p = ring[k], q = ring[(k + 1) % ring.length]; area += p[0] * q[1] - q[0] * p[1]; } area = Math.abs(area) / 2;
      if (area > 400 && H > 8) { box(rg, cx + (hv - 0.5) * 4, y1, cz + (hash(Math.round(cz), 7) - 0.5) * 4, 4.5, 2.2, 3.5, hv * TAU, [0.78, 0.78, 0.76]); }
      let r = 0; for (const p of ring) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cz)); C.exclPush(cx, cz, r * 0.8 + 1); if (C.CR) C.CR.exclAdd(cx, cz, r);
      nB++;
    }
    fch.addTo(root, fMat, true, true); roofs.addTo(root, C.matV, false, true);
    C.out.buildings = nB;
    // the farther town (OSM footprints as boxes; up to 2.6 km): within the ground's box on it, beyond it in the far view (ctFar)
    const mb = new Int16Array(b64(D.bldFar).buffer), mid = new K.Chunks(256), G = MG;
    for (let k = 0; k + 5 < mb.length; k += 6) {
      const x = mb[k], z = mb[k + 1], Lx = mb[k + 2], Wz = mb[k + 3], a = mb[k + 4] * Math.PI / 180, h = Math.max(4, mb[k + 5]);
      if (!(x > G.x0 + 20 && z > G.z0 + 20 && x < G.x1 - 20 && z < G.z1 - 20) || ctSea(x, z)) continue;
      const hv = hash(x, z), col = h > 20 ? [0.82, 0.84, 0.85].map(v => v * (0.9 + 0.15 * hv)) : PAL[Math.floor(hv * PAL.length)].map(v => v * 0.86);
      box(mid.get(x, z), x, ctGround(x, z) - 0.5, z, Lx, h + 0.5, Wz, a, col, [0.5, 0.5, 0.5]);
    }
    mid.addTo(root, C.matV, true, true);
  }
  // the big stadium beside the circuit (OSM outline and its pitch's hole, 48 m): its woven skin over the bowl, the roof ring of glass round the
  // open middle, the tiers falling to the pitch, the pitch (plain: no name, no lettering)
  function ctStadium(C, b, fch, roofs) {
    const [, H0, , , ring, hole] = b, Hs = H0 || 48;
    let cx = 0, cz = 0; for (const p of ring) { cx += p[0]; cz += p[1]; } cx /= ring.length; cz /= ring.length;
    let y0 = 1e9; for (const p of ring) y0 = Math.min(y0, ctGround(p[0], p[1])); y0 -= 0.3;
    const g = fch.get(cx, cz), rg = roofs.get(cx, cz), skin = [1, 1, 1], ins = [cx, y0 + 10, cz], n = ring.length;
    const at = (p, f, y) => [cx + (p[0] - cx) * f, y, cz + (p[1] - cz) * f];
    // the skin: bulging out a little at mid height, three bands
    const prof = [[0.94, 0], [1.0, Hs * 0.35], [0.99, Hs * 0.75], [0.95, Hs * 0.92]];
    for (let k = 0; k < n; k++) { const p = ring[k], q = ring[(k + 1) % n], l = Math.hypot(q[0] - p[0], q[1] - p[1]), u1 = Math.max(1, Math.round(l / 4));
      for (let e = 0; e + 1 < prof.length; e++) { const [f0, h0] = prof[e], [f1, h1] = prof[e + 1];
        g.quadO(at(p, f0, y0 + h0), at(q, f0, y0 + h0), at(q, f1, y0 + h1), at(p, f1, y0 + h1), skin, ins, [[0, FV(7, 0)], [u1, FV(7, 0)], [u1, FV(7, 1)], [0, FV(7, 1)]]); } }
    // the roof ring: from the skin's top in to the opening over the pitch (glass, pale), a white rim
    const inner = hole && hole.length > 3 ? hole : ring.map(p => [cx + (p[0] - cx) * 0.55, cz + (p[1] - cz) * 0.55]);
    const ri = (k) => { const p = ring[k], t = k / n, m = Math.round(t * inner.length) % inner.length, h = inner[m]; return [cx + (h[0] - cx) * 1.06, cz + (h[1] - cz) * 1.06]; };
    for (let k = 0; k < n; k++) { const k1 = (k + 1) % n, a0 = at(ring[k], 0.95, y0 + Hs * 0.92), a1 = at(ring[k1], 0.95, y0 + Hs * 0.92), b0 = ri(k), b1 = ri(k1);
      rg.quadO(a0, a1, [b1[0], y0 + Hs * 0.86, b1[1]], [b0[0], y0 + Hs * 0.86, b0[1]], [0.84, 0.87, 0.9], [cx, y0, cz]);
      rg.quadO(a0, a1, [b1[0], y0 + Hs * 0.86, b1[1]], [b0[0], y0 + Hs * 0.86, b0[1]], [0.5, 0.52, 0.55], [cx, y0 + Hs * 3, cz]); }
    // the tiers seen through the opening: from the pitch's edge up and out, and the pitch
    for (let k = 0; k < inner.length; k++) { const p = inner[k], q = inner[(k + 1) % inner.length], P = (h, f) => [cx + (h[0] - cx) * f, y0 + 1 + (f - 1) * 120, cz + (h[1] - cz) * f];
      rg.quadO(P(p, 1.0), P(q, 1.0), P(q, 1.22), P(p, 1.22), k % 2 ? [0.62, 0.64, 0.68] : [0.56, 0.58, 0.62], [cx, y0 + 60, cz]); }
    const pts = inner.map(p => new THREE.Vector2(p[0], p[1])); if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
    try { for (const [p0, p1, p2] of THREE.ShapeUtils.triangulateShape(pts, [])) rg.triO([pts[p0].x, y0 + 1, pts[p0].y], [pts[p1].x, y0 + 1, pts[p1].y], [pts[p2].x, y0 + 1, pts[p2].y], [0.32, 0.56, 0.26], [cx, y0 - 5, cz]); } catch (er) { /* (no pitch) */ }
    let r = 0; for (const p of ring) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cz)); C.exclPush(cx, cz, r); if (C.CR) C.CR.exclAdd(cx, cz, r);
  }

  /* ---- the town's streets (OSM; not the circuit): asphalt with South Africa's markings (a broken white centre line, yellow edge lines on the
     bigger roads), pavements along them; paths (paving); street lamps along the roads ---- */
  function ctStreets(C) {
    const { D, root, tex, scen } = C, near = C.near, G = MG;
    const road = new K.Chunks(256, true), mark = new K.Chunks(256), walk = new K.Chunks(256, true);
    const legs = C.legs || [];
    const inLeg = (x, z) => { for (const Lg of legs) { const dx = x - Lg.cx, dz = z - Lg.cz, r = dx * Lg.ux + dz * Lg.uz, v = -dx * Lg.uz + dz * Lg.ux; if (r > Lg.r0 - 2 && r < Lg.rEnd + 2 && Math.abs(v) < Lg.hw + 3) return true; } return false; };
    const yel = [0.92, 0.74, 0.16], W1 = [0.96, 0.96, 0.94], pv = [0.8, 0.79, 0.76];
    const lampAt = [];
    for (const [cls, hw, lv, pts] of D.roads) {
      if (lv) continue;
      const isPath = /^(footway|path|cycleway|steps|pedestrian|track)$/.test(cls), half = isPath ? Math.min(hw, 1.2) : hw, big = /^(primary|secondary|tertiary|trunk|motorway)$/.test(cls);
      const tgt = isPath ? walk : road, col = isPath ? [0.86, 0.84, 0.8] : [0.8, 0.8, 0.82], y0 = isPath ? 0.06 : 0.05;
      const P = []; for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4)); for (let q = 0; q < n; q++) P.push([ax + (bx - ax) * q / n, az + (bz - az) * q / n]); }
      P.push(pts[pts.length - 1]);
      let run = [];
      const flush = () => {
        if (run.length >= 2) {
          let acc = 0, prev = null;
          for (let k = 0; k < run.length; k++) {
            const a = run[Math.max(0, k - 1)], b = run[Math.min(run.length - 1, k + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l, p = run[k], y = ctGround(p[0], p[1]) + y0;
            if (k) acc += Math.hypot(p[0] - run[k - 1][0], p[1] - run[k - 1][1]);
            const cur = { L: [p[0] + nx * half, y, p[1] + nz * half], R: [p[0] - nx * half, y, p[1] - nz * half], p, nx, nz, y };
            if (prev) { const g = tgt.get(p[0], p[1]); g.quadUp(prev.R, cur.R, cur.L, prev.L, [col, col, col, col], [prev.R, cur.R, cur.L, prev.L].map(q => [q[0] / 8, -q[2] / 8]));
              if (!isPath) {
                const ml = mark.get(p[0], p[1]), q0 = prev.p, ym = Math.max(prev.y, y) + 0.012, M = (q, o, yy) => [q[0] + (q === p ? nx : prev.nx) * o, yy, q[1] + (q === p ? nz : prev.nz) * o];
                if (Math.floor(acc / 3) % 3 === 0) ml.quadUp(M(q0, -0.07, ym), M(p, -0.07, ym), M(p, 0.07, ym), M(q0, 0.07, ym), [W1, W1, W1, W1]);
                if (big) for (const s of [-1, 1]) ml.quadUp(M(q0, s * (half - 0.35), ym), M(p, s * (half - 0.35), ym), M(p, s * (half - 0.2), ym), M(q0, s * (half - 0.2), ym), [yel, yel, yel, yel]);
                // the pavements (2 m) either side, a kerb
                if (half >= 2.6) for (const s of [-1, 1]) { const A = M(q0, s * half, prev.y + 0.14), B = M(p, s * half, y + 0.14), Cq = M(p, s * (half + 2.1), y + 0.14), Dq = M(q0, s * (half + 2.1), prev.y + 0.14);
                  const qn = near((A[0] + Cq[0]) / 2, (A[2] + Cq[2]) / 2); if (qn.d < 0.5) continue;
                  walk.get(p[0], p[1]).quadUp(A, B, Cq, Dq, [pv, pv, pv, pv], [A, B, Cq, Dq].map(q => [q[0] / 2, -q[2] / 2])); }
                if (big && Math.floor(acc / 34) !== Math.floor((acc - 4) / 34)) lampAt.push([p[0] + nx * (half + 1.0), p[1] + nz * (half + 1.0), Math.atan2(-nz, -nx)]);
              }
            }
            prev = cur;
          }
        }
        run = [];
      };
      for (const p of P) {
        const q = near(p[0], p[1]), bad = q.d < (isPath ? 1.5 : 0.6) || p[0] < G.x0 || p[1] < G.z0 || p[0] > G.x1 || p[1] > G.z1 || inLeg(p[0], p[1]) || ctSea(p[0], p[1]);
        if (bad) flush(); else run.push(p);
      }
      flush();
    }
    C.roadCh = road; C.walkCh = walk;   // (the junctions add theirs, then the chunks go into the world)
    mark.addTo(root, new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), false, true);
    // street lamps along the bigger roads (static: away from the circuit; the ones by the circuit are props of the junctions)
    for (const [x, z, a] of lampAt) { if (near(x, z).d < 3 || C.excluded(x, z)) continue; const g = scen.get(x, z), y = ctGround(x, z);
      cyl(g, x, y - 0.2, z, 0.1, 9.2, 5, [0.6, 0.61, 0.64], null, 0.07); box(g, x + Math.cos(a) * 0.9, y + 8.8, z + Math.sin(a) * 0.9, 1.8, 0.1, 0.1, a, [0.6, 0.61, 0.64]); box(g, x + Math.cos(a) * 1.8, y + 8.6, z + Math.sin(a) * 1.8, 0.7, 0.2, 0.3, a, [0.4, 0.42, 0.45], [0.95, 0.93, 0.85]); }
  }

  /* ---- the junctions (def.junctions): the side street's leg from the circuit's edge out past its fence (the barrier opens into its mouth up to
     the fence, Core: def.walls), its pavements; in the mouth the paved corners, the zebra crossing and the stop line; the fence across the
     street (the road closed for the race); the furniture of def.furniture on the corners, all of it knockable; OSM's own street furniture ---- */
  function ctJunctions(C) {
    const { T, w, root, scen, out, near, exclPush } = C, legs = C.legs || [], wh = [0.94, 0.94, 0.9], walk = [0.8, 0.79, 0.76], curbC = [0.66, 0.65, 0.62];
    const gr = C.roadCh, gm = new GB(), gs = C.walkCh, fz = new K.Chunks(320, true);
    const prop = (kind, x, z, yaw, col) => { const q = near(x, z); if (q.d > -0.7 || Math.abs(q.lat) < w + 0.7) return false; out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0, i: q.i }); C.nJ = (C.nJ || 0) + 1; return true; };
    for (const Lg of legs) {
      const P = (r, v) => [Lg.cx + Lg.ux * r + Lg.vx * v, Lg.cz + Lg.uz * r + Lg.vz * v], Q = (r, v, y) => { const p = P(r, v); return [p[0], Lg.cy + y, p[1]]; };
      const yV = Math.atan2(Lg.vz, Lg.vx);
      // the carriageway in the mouth and beyond the fence: asphalt; pavements and kerbs beyond the fence
      for (let r = Lg.r0 - 0.3; r < Lg.rF + 0.6; r += 3) { const r1 = Math.min(Lg.rF + 0.6, r + 3), g = gr.get(...P(r, 0)), y = 0.024, A = Q(r, -Lg.hw, y), B = Q(r, Lg.hw, y), Cq = Q(r1, Lg.hw, y), Dq = Q(r1, -Lg.hw, y), c = [0.8, 0.8, 0.82];
        g.quadUp(A, B, Cq, Dq, [c, c, c, c], [A, B, Cq, Dq].map(p => [p[0] / 8, -p[2] / 8])); }
      for (let r = Lg.rF + 0.6; r < Lg.rEnd; r += 4) { const r1 = Math.min(Lg.rEnd, r + 4), g = gr.get(...P(r, 0)), y = 0.03, c = [0.84, 0.84, 0.86];
        const A = Q(r, -Lg.hw, y), B = Q(r, Lg.hw, y), Cq = Q(r1, Lg.hw, y), Dq = Q(r1, -Lg.hw, y); g.quadUp(A, B, Cq, Dq, [c, c, c, c], [A, B, Cq, Dq].map(p => [p[0] / 8, -p[2] / 8]));
        for (const sg of [-1, 1]) { const ys = 0.16, a0 = Q(r, sg * Lg.hw, ys), a1 = Q(r, sg * (Lg.hw + 2.2), ys), b1 = Q(r1, sg * (Lg.hw + 2.2), ys), b0 = Q(r1, sg * Lg.hw, ys), gg = gs.get(a0[0], a0[2]);
          gg.quadUp(a0, a1, b1, b0, [walk, walk, walk, walk], [a0, a1, b1, b0].map(p => [p[0] / 1.5, -p[2] / 1.5]));
          gg.quadO(Q(r, sg * Lg.hw, 0.02), Q(r1, sg * Lg.hw, 0.02), Q(r1, sg * Lg.hw, ys), Q(r, sg * Lg.hw, ys), curbC, Q(r, sg * (Lg.hw + 1), 0)); } }
      // the fence across the street at the barrier's end: concrete blocks with a catch fence (the race's), and the road closed sign
      { const r = Lg.rF + 0.9, g = scen.get(...P(r, 0)); for (let v = -Lg.hw - 2; v < Lg.hw + 2; v += 2) { const [x, z] = P(r, v + 1); box(g, x, Lg.cy, z, 2.0, 1.05, 0.6, yV, [0.88, 0.88, 0.86], [0.94, 0.94, 0.92]); }
        for (let v = -Lg.hw - 2; v < Lg.hw + 2; v += 2.5) { const [x, z] = P(r + 0.3, v); box(g, x, Lg.cy + 1.0, z, 0.08, 2.5, 0.08, yV, [0.55, 0.56, 0.58]); }
        const A = Q(r + 0.32, -Lg.hw - 2, 1.0), B = Q(r + 0.32, Lg.hw + 2, 1.0), u = (Lg.hw + 2) * 2 / 2.5; fz.get(A[0], A[2]).quadO(A, B, [B[0], B[1] + 2.4, B[2]], [A[0], A[1] + 2.4, A[2]], [1, 1, 1], Q(r - 3, 0, 1.5), [[0, 0], [u, 0], [u, 0.96], [0, 0.96]]); }
      // markings in the mouth: the zebra crossing over the leg (white bars), the stop line, the broken centre line
      const z0 = Lg.r0 + 2.0, z1 = Lg.r0 + 5.0, yM = 0.045;
      if (z1 < Lg.rF - 1) { for (let v = -Lg.hw + 0.3; v < Lg.hw - 0.3; v += 1.0) gm.quadUp(Q(z0, v, yM), Q(z0, v + 0.5, yM), Q(z1, v + 0.5, yM), Q(z1, v, yM), [wh, wh, wh, wh]);
        gm.quadUp(Q(z1 + 1.0, 0, yM), Q(z1 + 1.0, Lg.hw - 0.2, yM), Q(z1 + 1.35, Lg.hw - 0.2, yM), Q(z1 + 1.35, 0, yM), [wh, wh, wh, wh]);
        for (let r = z1 + 1.6; r < Lg.rF - 0.6; r += 3) gm.quadUp(Q(r, -0.07, yM), Q(r, 0.07, yM), Q(Math.min(r + 1.0, Lg.rF - 0.6), 0.07, yM), Q(Math.min(r + 1.0, Lg.rF - 0.6), -0.07, yM), [wh, wh, wh, wh]); }
      // the circuit's own zebra crossing at the signals and zebras (the street's markings, left under the race's paint)
      if (Lg.kind === 'sig' || Lg.kind === 'zebra') { const qc = -(Lg.hw / Math.max(0.35, Math.sin(Lg.a)) + 2.6), gw = [0.8, 0.8, 0.78];
        for (let l = -w + 0.6; l < w - 0.4; l += 1.1) { const s0 = Lg.s + qc - 1.6, s1 = Lg.s + qc + 1.6, a = C.atSf(s0, l), b = C.atSf(s0, l + 0.55), c = C.atSf(s1, l + 0.55), d = C.atSf(s1, l);
          gm.quadUp([a[0], C.hyS(s0) + 0.036, a[1]], [b[0], C.hyS(s0) + 0.036, b[1]], [c[0], C.hyS(s1) + 0.036, c[1]], [d[0], C.hyS(s1) + 0.036, d[1]], [gw, gw, gw, gw]); } }
      exclPush(...P(Lg.rF * 0.6, 0), Math.max(8, Lg.rF * 0.6));
    }
    // the furniture (def.furniture: on the corners of each mouth, facing its way), every piece knockable
    for (const [d, sd, kind, l, face, col, j] of C.def.furniture || []) {
      const Lg = legs[j], s = C.sAt(d), i = T.idx(s), [x, z] = C.atSf(s, sd * l), tx = T.tx[i], tz = T.tz[i];
      const yaw = face === 'N' ? Math.atan2(-T.nz[i] * sd, -T.nx[i] * sd) : face === 'F' ? Math.atan2(tz, tx) : face === 'B' ? Math.atan2(-tz, -tx) : Math.atan2(-Lg.uz, -Lg.ux);
      prop(kind, x, z, yaw, col);
    }
    gr.addTo(root, C.aMat, false, true); gs.addTo(root, C.pMat, false, true); fz.addTo(root, new THREE.MeshLambertMaterial({ map: C.tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), false, true);
    if (!gm.empty) { const m = new THREE.Mesh(gm.geometry(), C.lMat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
    // OSM's own street furniture round the circuit: inside the barriers knockable, outside as scenery (benches, bus stop signs and shelters,
    // traffic lights of the other junctions, lamps, bins)
    const F = C.D.fur || {}, KN = { fire_hydrant: 'hydrant', bollard: 'bollard', waste_basket: 'bin', street_lamp: 'lamp', traffic_signals: 'tlight' };
    for (const cl in F) for (const v of F[cl]) {
      const x = v[0], z = v[1], q = near(x, z);
      if (q.d < -0.7 && Math.abs(q.lat) > w + 0.8 && KN[cl]) { prop(KN[cl], x, z, Math.atan2(-T.tz[q.i], -T.tx[q.i])); continue; }
      if (q.d < 0.8 || ctSea(x, z)) continue;
      const g = scen.get(x, z), y = ctGround(x, z), a = hash(Math.round(x), Math.round(z)) * TAU;
      if (cl === 'bench') { box(g, x, y + 0.42, z, 1.8, 0.08, 0.5, a, [0.5, 0.36, 0.22]); box(g, x, y, z, 1.6, 0.42, 0.06, a, [0.3, 0.3, 0.32]); }
      else if (cl === 'waste_basket') cyl(g, x, y, z, 0.26, 0.9, 7, [0.14, 0.32, 0.22], [0.5, 0.52, 0.5]);
      else if (cl === 'street_lamp') { cyl(g, x, y - 0.2, z, 0.1, 8.4, 5, [0.6, 0.61, 0.64], null, 0.07); box(g, x, y + 8.1, z, 0.6, 0.22, 0.3, a, [0.42, 0.44, 0.47], [0.95, 0.93, 0.85]); }
      else if (cl === 'traffic_signals') { cyl(g, x, y, z, 0.08, 3.6, 5, [0.55, 0.56, 0.58]); box(g, x, y + 2.2, z, 0.62, 1.36, 0.12, a, [0.9, 0.9, 0.88]); box(g, x, y + 2.26, z, 0.32, 1.12, 0.3, a, [0.07, 0.07, 0.08]); }
      else if (cl === 'bus_stop') { box(g, x, y, z, 0.07, 2.6, 0.07, 0, [0.55, 0.56, 0.58]); box(g, x, y + 2.1, z, 0.05, 0.5, 0.6, a, [0.1, 0.42, 0.24], [0.98, 0.78, 0.12]);
        if (hash(Math.round(z), 3) < 0.6) { const ox = Math.cos(a + Math.PI / 2) * 1.6, oz = Math.sin(a + Math.PI / 2) * 1.6; box(g, x + ox, y, z + oz, 3.6, 2.4, 0.06, a, [0.6, 0.68, 0.74]); box(g, x + ox * 0.6, y + 2.4, z + oz * 0.6, 3.8, 0.12, 1.6, a, [0.3, 0.32, 0.36], [0.4, 0.42, 0.46]); } }
      else if (cl === 'information' || cl === 'stop' || cl === 'give_way') { box(g, x, y, z, 0.07, 2.2, 0.07, 0, [0.6, 0.6, 0.62]); box(g, x, y + 1.7, z, 0.05, 0.6, 0.6, a, cl === 'information' ? [0.1, 0.32, 0.6] : [0.86, 0.1, 0.1]); }
      else if (cl === 'fire_hydrant') cyl(g, x, y, z, 0.15, 0.6, 6, [0.82, 0.12, 0.08], [0.95, 0.78, 0.12]);
    }
  }

  /* ---- the landmarks: the lighthouse at Mouille Point (its position: the published coordinates, -33.90083, 18.40028; a square tower painted
     in red and white diagonal stripes, ~20 m, the lantern on top), the athletics stadium's grandstand roof, the sea wall and the promenade's rail ---- */
  function ctLandmarks(C) {
    const { scen } = C, G = MG;
    { const x = -686.4, z = -467.9, y = ctGround(x, z), g = scen.get(x, z), Hh = 18, s = 2.4, red = [0.78, 0.12, 0.1], wh = [0.97, 0.96, 0.94];
      // the tower: four faces, each in diagonal bands (parallelograms) of red and white
      const yaw = 0.3, c = Math.cos(yaw), sn = Math.sin(yaw), P = (u, v, yy) => [x + c * u - sn * v, y + yy, z + sn * u + c * v], ins = [x, y + Hh / 2, z];
      const corners = [[-s, -s], [s, -s], [s, s], [-s, s]];
      for (let f = 0; f < 4; f++) { const [ua, va] = corners[f], [ub, vb] = corners[(f + 1) % 4], band = 3.2;
        for (let k = -2; k < Hh / band + 2; k++) { const y0 = k * band, col = k % 2 ? red : wh, A = (t, yy) => [ua + (ub - ua) * t, va + (vb - va) * t, yy];
          const pts = [A(0, y0), A(1, y0 + band * 0.9), A(1, y0 + band * 1.9), A(0, y0 + band)].map(([u, v, yy]) => [u, v, clamp(yy, 0, Hh)]);
          if (pts.every(p => p[2] <= 0) || pts.every(p => p[2] >= Hh)) continue;
          g.quadO(P(pts[0][0], pts[0][1], pts[0][2]), P(pts[1][0], pts[1][1], pts[1][2]), P(pts[2][0], pts[2][1], pts[2][2]), P(pts[3][0], pts[3][1], pts[3][2]), col, ins); } }
      box(g, x, y + Hh, z, s * 2 + 0.6, 0.4, s * 2 + 0.6, yaw, [0.3, 0.3, 0.32]);
      cyl(g, x, y + Hh + 0.4, z, 1.3, 2.4, 8, [0.85, 0.9, 0.92], [0.2, 0.2, 0.22], 1.3); cone(g, x, y + Hh + 2.8, z, 1.5, 1.2, 8, [0.22, 0.22, 0.24], [0.3, 0.3, 0.32], 0);
      box(g, x - 7, y, z + 3, 9, 4.2, 6, yaw, [0.96, 0.95, 0.92], [0.7, 0.2, 0.15]);   // (the keepers' house)
      C.exclPush(x, z, 12); }
    // the granite boulders of the shore (Mouille Point's rocky coast; not on the beaches): instanced, along the waterline near the circuit
    const rg = new GB(); ico(rg, 0, 0, 0, 1, 0.62, [1, 1, 1], rng(31), 0.32); const rGeo = rg.geometry(); rGeo.computeBoundingSphere();
    const rocks = new K.IChunks(rGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 384), RR = rng(77);
    for (let j = 1; j < G.nz - 1; j++) for (let i = 1; i < G.nx - 1; i++) { const k = j * G.nx + i, sd = G.SD[k]; if (sd > 7 || sd < -6 || G.dT[k] > 1100) continue;
      for (let q = 0; q < 3; q++) { const x = G.x0 + i * G.c + (RR() - 0.5) * G.c, z = G.z0 + j * G.c + (RR() - 0.5) * G.c, sd2 = gAt(G.SD, x, z); if (sd2 > 6 || sd2 < -5 || ctKind(x, z) === KIND.sand || C.near(x, z).d < 2) continue;
        const r = 0.8 + RR() * RR() * 2.6, t = 0.82 + RR() * 0.3; rocks.add(x, Math.max(ctGround(x, z), C.WL - 1) - r * 0.25, z, RR() * TAU, r, r, [0.44 * t, 0.42 * t, 0.4 * t]); } }
    rocks.addTo(C.root, false);
  }

  /* ---- trees: OSM's trees (single and in rows) and the land cover's tree cells: palms along the coast and the boulevards (tall fan palms and
     date palms), the park's stone pines, coral trees and milkwoods (round dark crowns), a few eucalypts; instanced per 256 m chunk ---- */
  function ctTreeGeo(kind) {
    const g = new GB(), R = rng(700 + kind), bk = [0.42, 0.36, 0.3];
    if (kind === 0) {   // a fan palm: a tall slim trunk, a tight round head of fronds (height 1)
      cyl(g, 0, 0, 0, 0.022, 0.86, 5, [0.5, 0.44, 0.36], null, 0.016);
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, c = Math.cos(a), s = Math.sin(a), lf = k % 2 ? [0.3, 0.46, 0.22] : [0.36, 0.52, 0.26];
        g.triO([0, 0.88, 0], [c * 0.13 - s * 0.04, 0.95, s * 0.13 + c * 0.04], [c * 0.15 + s * 0.04, 0.83, s * 0.15 - c * 0.04], lf, [0, 0.7, 0]); g.triO([0, 0.88, 0], [c * 0.15 + s * 0.04, 0.83, s * 0.15 - c * 0.04], [c * 0.13 - s * 0.04, 0.95, s * 0.13 + c * 0.04], lf, [0, 1.2, 0]); }
      ico(g, 0, 0.88, 0, 0.05, 1.2, [0.44, 0.4, 0.26], R, 0.1);
    } else if (kind === 1) {   // a date palm: a thicker trunk, a wide crown of arching fronds
      cyl(g, 0, 0, 0, 0.05, 0.7, 6, [0.52, 0.42, 0.3], null, 0.045);
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + (k % 2) * 0.2, c = Math.cos(a), s = Math.sin(a), up = k % 3 === 0 ? 0.1 : 0, lf = k % 2 ? [0.3, 0.42, 0.18] : [0.36, 0.48, 0.22];
        const A = [0, 0.72, 0], B = [c * 0.22, 0.82 + up, s * 0.22], E = [c * 0.42, 0.66 + up, s * 0.42], w = 0.05, P = (p, o) => [p[0] - s * o, p[1], p[2] + c * o];
        g.quadO(P(A, -w * 0.4), P(B, -w), P(B, w), P(A, w * 0.4), lf, [0, 0.4, 0]); g.quadO(P(A, w * 0.4), P(B, w), P(B, -w), P(A, -w * 0.4), lf, [0, 1.4, 0]);
        g.triO(P(B, -w), E, P(B, w), lf, [0, 0.3, 0]); g.triO(P(B, w), E, P(B, -w), lf, [0, 1.3, 0]); }
    } else if (kind === 2) {   // a stone pine: a bare trunk, a flat umbrella crown
      cyl(g, 0, 0, 0, 0.035, 0.66, 5, bk, null, 0.025); K.puff(g, 0, 0.78, 0, 0.42, 0.42, [0.24, 0.36, 0.2], R, 0.2, 0.55, 1.1); K.nrLump(g, 0.2, 0.82, 0.1, 0.24, 0.6, [0.28, 0.4, 0.22], R, 0.2);
    } else if (kind === 3) {   // a coral tree / milkwood: a short trunk, a dense round dark crown
      cyl(g, 0, 0, 0, 0.04, 0.4, 5, bk, null, 0.03); K.puff(g, 0, 0.6, 0, 0.4, 0.75, [0.26, 0.4, 0.2], R, 0.22, 0.55, 1.12, true); K.nrLump(g, 0.18, 0.66, -0.08, 0.24, 0.85, [0.3, 0.46, 0.24], R, 0.2);
    } else {   // a eucalypt: a tall pale trunk, loose grey-green clumps high up
      cyl(g, 0, 0, 0, 0.025, 0.7, 5, [0.78, 0.76, 0.7], null, 0.016); for (const [x, y, z, r] of [[0.1, 0.7, 0.04, 0.17], [-0.12, 0.78, -0.06, 0.16], [0.02, 0.9, 0.1, 0.14]]) K.puff(g, x, y, z, r, 0.7, [0.36, 0.44, 0.32], R, 0.3, 0.6, 1.1);
    }
    return g;
  }
  function ctTrees(C) {
    const { root, near } = C, G = MG, R = rng(1967), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    // the five kinds' models (height 1) copied into 384 m chunks of one mesh each (one draw for all the trees of a chunk, all kinds)
    const BASE = [0, 1, 2, 3, 4].map(k => ctTreeGeo(k)), ch = new K.Chunks(384);
    const IC = BASE.map(b => ({ add: (x, y, z, rot, sxz, sy, col) => { const g = ch.get(x, z), c = Math.cos(rot), sn = Math.sin(rot), P = b.P, Nn = b.N, Cc = b.C;
      for (let v = 0; v < P.length; v += 3) { const px = P[v] * sxz, pz = P[v + 2] * sxz; g.P.push(x + px * c - pz * sn, y + P[v + 1] * sy, z + px * sn + pz * c);
        const nx = Nn[v], nz = Nn[v + 2]; g.N.push(nx * c - nz * sn, Nn[v + 1], nx * sn + nz * c); g.C.push(Cc[v] * col[0], Cc[v + 1] * col[1], Cc[v + 2] * col[2]); } } }));
    let n = 0;
    const put = (x, z, sp) => { const q = near(x, z); if (q.d < 1.2 || C.excluded(x, z) || ctSea(x, z) || gAt(G.SD, x, z) < 3) return;
      const h = sp === 0 ? 13 + R() * 8 : sp === 1 ? 8 + R() * 4 : sp === 2 ? 11 + R() * 6 : sp === 3 ? 7 + R() * 5 : 16 + R() * 8, tone = 0.86 + 0.28 * R();
      IC[sp].add(x, ctGround(x, z) - 0.1, z, R() * TAU, sp < 2 ? h * 0.9 : h, h, [tone * (0.95 + 0.1 * R()), tone, tone * (0.92 + 0.1 * R())]); n++; };
    for (const [x, z, row] of C.D.trees) {
      const sd = gAt(G.SD, x, z), kd = ctKind(x, z);
      const sp = row ? (sd < 220 ? 0 : (hash(Math.round(x), Math.round(z)) < 0.6 ? 0 : 1)) : sd < 160 ? (R() < 0.55 ? 0 : R() < 0.5 ? 1 : 3) : kd === KIND.golf || kd === KIND.lawn ? (R() < 0.4 ? 2 : R() < 0.7 ? 3 : R() < 0.5 ? 4 : 1) : (R() < 0.35 ? 3 : R() < 0.5 ? 1 : R() < 0.6 ? 2 : 4);
      put(x, z, sp);
    }
    // the land cover's tree cells (the park and the golf course): where OSM has no trees
    for (let j = 1; j < G.nz - 1; j += 1) for (let i = 1; i < G.nx - 1; i += 1) { const k = j * G.nx + i; if (G.kind[k] !== KIND.trees || !G.land[k] || G.dT[k] > 800) continue;
      if (R() > 0.35) continue; const x = G.x0 + i * G.c + (R() - 0.5) * 6, z = G.z0 + j * G.c + (R() - 0.5) * 6; put(x, z, R() < 0.45 ? 2 : R() < 0.6 ? 3 : 4); }
    ch.addTo(root, mat, true, true);
    C.out.treeN = n;
  }

  /* ---- the car parks (OSM): white bays and parked cars ---- */
  function ctCarGeo() {
    const g = new GB(), W1 = [1, 1, 1], gl = [0.12, 0.15, 0.18];
    box(g, 0, 0.12, 0, 4.4, 0.82, 1.78, 0, W1, W1, true); box(g, -0.2, 0.94, 0, 2.3, 0.56, 1.6, 0, gl, W1, true);   // (the body down to the road, dark glass over it: seen from above)
    return g.geometry();
  }
  function ctParking(C) {
    const { D, root, near } = C, R = rng(767), cars = new K.IChunks(ctCarGeo(), new THREE.MeshLambertMaterial({ vertexColors: true }), 320), mark = new K.Chunks(320), W1 = [1, 1, 1];
    const CARC = [[0.92, 0.92, 0.92], [0.12, 0.12, 0.13], [0.5, 0.52, 0.55], [0.7, 0.1, 0.1], [0.15, 0.25, 0.55], [0.78, 0.78, 0.8], [0.3, 0.32, 0.35], [0.95, 0.95, 0.95]];
    let nCars = 0;
    for (const ring of D.parking) {
      let best = 0, ux = 1, uz = 0; for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; ux = (b[0] - a[0]) / l; uz = (b[1] - a[1]) / l; } }
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of ring) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      const vx = -uz, vz = ux, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ext = Math.hypot(x1 - x0, z1 - z0) / 2;
      if (near(cx, cz, true).dc > 700) continue;
      for (let a = -ext; a < ext; a += 2.6) for (let b = -ext; b < ext; b += 6.2) {
        const row = Math.round(b / 6.2), x = cx + ux * a + vx * b, z = cz + uz * a + vz * b;
        if (!K.inPoly(ring, x, z) || K.polyDist(ring, x, z) < 1.5 || near(x, z).d < 2 || C.excluded(x, z)) continue;
        const yb = ctGround(x, z) + 0.07;
        if (Math.abs(row) % 2 === 0) { const g = mark.get(x, z), p = (s, t) => [x + ux * s + vx * t, yb, z + uz * s + vz * t]; g.quadUp(p(-1.3, -2.6), p(-1.18, -2.6), p(-1.18, 2.6), p(-1.3, 2.6), [W1, W1, W1, W1]); }
        if (R() < 0.38) { const yaw = Math.atan2(vz, vx) + (R() < 0.5 ? Math.PI : 0) + (R() - 0.5) * 0.06, col = CARC[Math.floor(R() * CARC.length)], k = 0.85 + 0.25 * R();
          cars.add(x, yb, z, -yaw, 1, 1, [col[0] * k, col[1] * k, col[2] * k]); nCars++; }
      }
    }
    cars.addTo(root, false); mark.addTo(root, C.lMat, false, true); C.out.parkedCars = nCars;
  }

  /* ---- the view beyond the near ground: the land to 9 km (Copernicus DEM): Signal Hill, Lion's Head, Table Mountain's flat top and its cliffs,
     Devil's Peak, the city at their feet; the towers of the town (OSM heights); drawn on a shell just inside the camera's far plane round the
     camera, each vertex along its own direction, hazed by the fog's colour ---- */
  function ctFar(C) {
    const { D } = C, F = D.far, n = F.n, raw = b64(F.b64), G = MG, P0 = [], Cl = [], I = [], base = D.base;
    const H = (i, j) => raw[clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)] * F.step;
    const inNear = (x, z) => x > G.x0 + 60 && x < G.x1 - 60 && z > G.z0 + 60 && z < G.z1 - 60;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell, h0 = H(i, j), sea = h0 <= 0.5;
      const sl = Math.max(Math.abs(H(i + 1, j) - H(i - 1, j)), Math.abs(H(i, j + 1) - H(i, j - 1))) / (2 * F.cell), q = hash(i, j) - 0.5;
      let c;
      if (sea) c = [0.24, 0.42, 0.5];
      else if (sl > 0.75 && h0 > 300) c = [0.5 + q * 0.06, 0.47 + q * 0.05, 0.43 + q * 0.04];   // (the sandstone cliffs, grey)
      else if (h0 > 120) c = [0.38 + q * 0.05, 0.42 + q * 0.05, 0.3 + q * 0.04];                 // (the fynbos on the mountains' slopes)
      else c = [0.72 + q * 0.06, 0.7 + q * 0.06, 0.66 + q * 0.05];                               // (the town)
      P0.push(x, sea ? C.WL - 0.4 : h0 - base, z); Cl.push(...c);
    }
    for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) { const a = j * n + i, b = a + 1, c = a + n, d = c + 1, xa = F.x0 + i * F.cell, za = F.z0 + j * F.cell;
      if (inNear(xa, za) && inNear(xa + F.cell, za + F.cell)) continue; I.push(a, c, b, b, c, d); }
    const vq = (p, col) => { P0.push(p[0], p[1], p[2]); Cl.push(col[0], col[1], col[2]); return P0.length / 3 - 1; };
    const quad = (a, b, c, d, col) => { const k = [a, b, c, d].map(p => vq(p, col)); I.push(k[0], k[1], k[2], k[0], k[2], k[3]); };
    const ground = (x, z) => { const i = Math.round((x - F.x0) / F.cell), j = Math.round((z - F.z0) / F.cell); return Math.max(0, H(i, j)) - base; };
    // the town's taller buildings outside the near ground (boxes)
    const mb = new Int16Array(b64(D.bldFar).buffer);
    for (let k = 0; k + 5 < mb.length; k += 6) { const x = mb[k], z = mb[k + 1], Lx = mb[k + 2], Wz = mb[k + 3], a = mb[k + 4] * Math.PI / 180, h = mb[k + 5]; if (inNear(x, z) || h < 12) continue;
      const y0 = ground(x, z) - 1, y1 = y0 + h, ca = Math.cos(a), sa = Math.sin(a), hv = hash(x, z), wc = hv < 0.35 ? [0.6, 0.66, 0.72] : [0.84, 0.83, 0.8];
      const pc = [[-Lx / 2, -Wz / 2], [Lx / 2, -Wz / 2], [Lx / 2, Wz / 2], [-Lx / 2, Wz / 2]].map(([u, v]) => [x + u * ca - v * sa, z + u * sa + v * ca]);
      for (let e = 0; e < 4; e++) { const p = pc[e], q2 = pc[(e + 1) % 4], sh = 0.8 + 0.2 * Math.abs(Math.cos(a + e * Math.PI / 2)); quad([p[0], y0, p[1]], [q2[0], y0, q2[1]], [q2[0], y1, q2[1]], [p[0], y1, p[1]], wc.map(v => v * sh)); }
      quad([pc[0][0], y1, pc[0][1]], [pc[3][0], y1, pc[3][1]], [pc[2][0], y1, pc[2][1]], [pc[1][0], y1, pc[1][1]], [0.55, 0.55, 0.55]); }
    const nv = P0.length / 3, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(Cl), 3));
    g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1)); g.setIndex(I); g.computeVertexNormals();
    const U = { uHz: { value: new THREE.Color(0xc8d6e2) } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
    m.customProgramCacheKey = () => 'ctFar';
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'ctFar';
    mesh.onBeforeRender = (r, sc) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); };
    C.root.add(mesh);
    const Pf = Float32Array.from(P0), S = { cx: 1e9, cy: 0, cz: 0, cf: 0 };
    return (cam) => {
      if (!cam) return; const c = cam.position;
      cam.getWorldDirection(_fd); const top = Math.asin(clamp(_fd.y, -1, 1)) + (cam.fov || 50) * Math.PI / 360 * 1.15; mesh.visible = top > -0.02; if (!mesh.visible) return;
      if (Math.abs(c.x - S.cx) + Math.abs(c.y - S.cy) + Math.abs(c.z - S.cz) < 9 && cam.far === S.cf) return;   // (moved less than 9 m: the shell stays; it lies 20-70 m inside the far plane)
      S.cx = c.x; S.cy = c.y; S.cz = c.z; S.cf = cam.far;
      const p = g.attributes.position.array, hz = g.attributes.aHz.array, R0 = cam.far - 70, R1 = cam.far - 20;
      for (let v = 0, k = 0; k < Pf.length; v++, k += 3) { const dx = Pf[k] - c.x, dy = Pf[k + 1] - c.y, dz = Pf[k + 2] - c.z, Dd = Math.max(1, Math.sqrt(dx * dx + dy * dy + dz * dz)), r = R0 + (R1 - R0) * (1 - Math.exp(-Math.max(0, Dd - 300) / 2500)), f = r / Dd;
        p[k] = c.x + dx * f; p[k + 1] = c.y + dy * f; p[k + 2] = c.z + dz * f; hz[v] = 0.22 + 0.5 * (1 - Math.exp(-Math.max(0, Dd - 400) / 6000)); }
      g.attributes.position.needsUpdate = true; g.attributes.aHz.needsUpdate = true;
    };
  }

  const _fd = new THREE.Vector3();
  World.theme('capetown', buildCapetown);
})();
