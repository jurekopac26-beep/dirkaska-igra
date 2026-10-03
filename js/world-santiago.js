/* =========================================================================
   WORLD — Santiago (theme 'santiago'): the street circuit in the big park south of the centre of Santiago, Chile. Its own builder
   (World.theme), in a file of its own: it uses World's shared helpers (World.kit) and the scenery data of js/data/santiago.js
   (OpenStreetMap, Copernicus DEM, ESA WorldCover).
   What it builds: the park's ground on the real terrain (the city's gentle fall to the west), its lawns, gardens, playing fields and paths,
   the long paved parade ground (the Elipse) the main straight runs up, the park's lakes with their shores; the circuit (asphalt, white
   edge lines, kerbs, concrete walls with debris fences, impact barriers at the hairpins), the pit lane on the inside of the straight with
   the teams' temporary garages, the start gantry, the grandstands and the fans; the park's buildings and the city round it in their real
   outlines and heights (the round arena plain, without any name; houses, blocks, the towers of the centre beyond); the streets and
   avenues round the park with their sidewalks, crossings and traffic lights; the junctions where the park's roads meet the circuit
   (closed by fences for the race, the Chilean traffic lights on poles with an arm over the road, stop signs, signs, lamps, hydrants,
   bins, cabinets and bollards, all of it knockable: World props, Core's loose props); bus shelters, benches, lamps; plane trees,
   poplars, palms and the park's other trees where OpenStreetMap has them; parked cars on the streets; and the view beyond the near city
   (the basin's suburbs, the hills and the snowy Andes to the east), drawn as a backdrop that moves with the camera (inside its far plane).
   Only place names; no names of the circuit, events, people, firms or brands.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.theme) return;
  const { clamp, lerp, sstep, rng } = Core, TAU = Math.PI * 2;
  const { GB, box, cyl, cone, ico } = World, K = World.kit;

  // ---- decode helpers ----
  const b64 = (s) => { const b = atob(s), a = new Uint8Array(b.length); for (let k = 0; k < b.length; k++) a[k] = b.charCodeAt(k); return a; };
  const hash = (a, b) => { let h = Math.imul((a * 73856093) ^ (b * 19349663), 0x9e3779b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca77); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
  const centroid = (r) => { let x = 0, z = 0; for (const p of r) { x += p[0]; z += p[1]; } return [x / r.length, z / r.length]; };
  const area = (r) => { let a = 0; for (let k = 0; k < r.length; k++) { const p = r[k], q = r[(k + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };

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

  /* ---- the ground: an 8 m grid over the near region (the data's: the track's box and ~650 m round it): the bare terrain (Copernicus, above
     the start line), pulled to the road's height near the circuit (the park's verges and the parade ground level with it); the lakes'
     beds under their water; the land's kind (ESA WorldCover; OSM's land use over it). The distance to the circuit's centre line ---- */
  let SG = null;
  const LAKES = { water: 1, lake: 1, pond: 1, reservoir: 1 };
  function scPrep(T, D) {
    const GD = D.ground, gq = b64(GD.b64), gAtD = (x, z) => {   // the data's ground (16 m cells), bilinear
      const gx = clamp((x - GD.x0) / GD.cell, 0, GD.nx - 1.001), gz = clamp((z - GD.z0) / GD.cell, 0, GD.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, k = j * GD.nx + i, H = (q) => GD.lo + gq[q] * GD.step;
      return (H(k) * (1 - u) + H(k + 1) * u) * (1 - v) + (H(k + GD.nx) * (1 - u) + H(k + GD.nx + 1) * u) * v; };
    const c = 8, G = { c, x0: GD.x0, z0: GD.z0 }; G.nx = Math.floor((GD.nx - 1) * GD.cell / c) + 1; G.nz = Math.floor((GD.nz - 1) * GD.cell / c) + 1;
    const n = G.nx * G.nz, kind = new Uint8Array(n), wet = new Uint8Array(n);   // kind: 0 grass, 1 trees, 2 built-up, 3 water, 4 bare, 5 scrub, 6 garden, 7 pitch, 8 paved (plazas, the Elipse), 9 track (cinder), 10 yards (residential)
    // land cover (10 m cells, RLE class * 32 + run) under the polygons
    const LC = D.lc, lcA = new Uint8Array(LC.nx * LC.nz); { const r = b64(LC.rle); let p = 0; for (const v of r) { lcA.fill(v >> 5, p, p + (v & 31)); p += v & 31; } }
    for (let j = 0; j < G.nz; j++) for (let i = 0; i < G.nx; i++) { const x = G.x0 + i * c, z = G.z0 + j * c, a = Math.floor((x - LC.x0) / LC.cell), b = Math.floor((z - LC.z0) / LC.cell);
      const v = a >= 0 && b >= 0 && a < LC.nx && b < LC.nz ? lcA[b * LC.nx + a] : 2; kind[j * G.nx + i] = v === 3 ? 0 : v; }
    const LU = { residential: 10, grass: 0, park: 0, garden: 6, flowerbed: 6, pitch: 7, track: 9, stadium: 7, playground: 8, pedestrian: 8, plaza: 8, parking: 8, dog_park: 4, construction: 4 };
    for (const [cl, ring] of D.lu) if (LU[cl] != null && cl !== 'pedestrian' && cl !== 'parking') rasterPoly(kind, G, [ring], LU[cl]);
    for (const [cl, ring] of D.lu) if (cl === 'pedestrian' || cl === 'parking') rasterPoly(kind, G, [ring], 8);
    for (const ring of D.woods) rasterPoly(kind, G, [ring], 1);
    const lakes = [];
    for (const [cl, rings] of D.water) if (LAKES[cl]) { lakes.push(rings); rasterPoly(wet, G, rings, lakes.length); }
    // the distance to the circuit's centre line: the true distance within 60 m (hashed samples), the farther cells by a chamfer
    const dT = new Float32Array(n).fill(1e9), TH = new Map(), TC = 16;
    for (let i = 0; i < T.N; i++) { const key = Math.floor(T.px[i] / TC) * 65536 + Math.floor(T.pz[i] / TC); let L = TH.get(key); if (!L) TH.set(key, L = []); L.push(i); }
    const iT = new Int32Array(n).fill(-1);
    for (let k = 0; k < n; k++) { const x = G.x0 + (k % G.nx) * c, z = G.z0 + Math.floor(k / G.nx) * c, a0 = Math.floor(x / TC), b0 = Math.floor(z / TC); let best = 1e18, bi = -1;
      for (let a = a0 - 4; a <= a0 + 4; a++) for (let b = b0 - 4; b <= b0 + 4; b++) { const L = TH.get(a * 65536 + b); if (!L) continue;
        for (const i of L) { const j = (i + 1) % T.N, ax = T.px[i], az = T.pz[i], vx = T.px[j] - ax, vz = T.pz[j] - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1e-9), 0, 1), dx = x - ax - vx * t, dz = z - az - vz * t, dd = dx * dx + dz * dz; if (dd < best) { best = dd; bi = i; } } }
      if (bi >= 0) { dT[k] = Math.sqrt(best); iT[k] = bi; } }
    { const d1 = c, d2 = c * Math.SQRT2;   // (beyond: a two-pass chamfer from the cells measured)
      for (let j = 0; j < G.nz; j++) for (let i = 0; i < G.nx; i++) { const k = j * G.nx + i; let v = dT[k];
        if (i > 0) v = Math.min(v, dT[k - 1] + d1); if (j > 0) { v = Math.min(v, dT[k - G.nx] + d1); if (i > 0) v = Math.min(v, dT[k - G.nx - 1] + d2); if (i < G.nx - 1) v = Math.min(v, dT[k - G.nx + 1] + d2); } dT[k] = v; }
      for (let j = G.nz - 1; j >= 0; j--) for (let i = G.nx - 1; i >= 0; i--) { const k = j * G.nx + i; let v = dT[k];
        if (i < G.nx - 1) v = Math.min(v, dT[k + 1] + d1); if (j < G.nz - 1) { v = Math.min(v, dT[k + G.nx] + d1); if (i < G.nx - 1) v = Math.min(v, dT[k + G.nx + 1] + d2); if (i > 0) v = Math.min(v, dT[k + G.nx - 1] + d2); } dT[k] = v; } }
    // the lakes' levels: a little under the lowest ground round their shores
    const lv = lakes.map(rings => { let m = 1e9; for (const p of rings[0]) m = Math.min(m, gAtD(p[0], p[1])); return m - 0.55; });
    const H = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const x = G.x0 + (k % G.nx) * c, z = G.z0 + Math.floor(k / G.nx) * c; let h = gAtD(x, z);
      if (iT[k] >= 0) { const i = iT[k], f = sstep(48, 20, dT[k]); h = lerp(h, T.hy[i] - 0.06, f); }   // (by the circuit: level with the road)
      const w = wet[k]; if (w) { const L = lakes[w - 1], d = K.polyDist(L[0], x, z); h = lv[w - 1] - 0.25 - Math.min(1.6, d * 0.12); }
      H[k] = h;
    }
    SG = Object.assign(G, { kind, wet, H, dT, iT, lakes, lv, x1: G.x0 + (G.nx - 1) * c, z1: G.z0 + (G.nz - 1) * c, gAtD });
    return SG;
  }
  function scGround(x, z) {   // the ground mesh's surface (the same two triangles per cell); outside the near region the data's terrain
    const G = SG; if (!G) return -0.1;
    if (x < G.x0 || z < G.z0 || x > G.x1 || z > G.z1) return G.gAtD(x, z);
    const gx = (x - G.x0) / G.c, gz = (z - G.z0) / G.c, i = Math.min(G.nx - 2, Math.floor(gx)), j = Math.min(G.nz - 2, Math.floor(gz)), u = gx - i, v = gz - j, A = G.H, k = j * G.nx + i;
    return u + v <= 1 ? A[k] + u * (A[k + 1] - A[k]) + v * (A[k + G.nx] - A[k]) : A[k + G.nx + 1] + (1 - u) * (A[k + G.nx] - A[k + G.nx + 1]) + (1 - v) * (A[k + 1] - A[k + G.nx + 1]);
  }
  const scKind = (x, z) => { const G = SG, i = Math.round((x - G.x0) / G.c), j = Math.round((z - G.z0) / G.c); return i < 0 || j < 0 || i >= G.nx || j >= G.nz ? 2 : G.wet[j * G.nx + i] ? 3 : G.kind[j * G.nx + i]; };
  const scDT = (x, z) => { const G = SG, i = Math.round((x - G.x0) / G.c), j = Math.round((z - G.z0) / G.c); return i < 0 || j < 0 || i >= G.nx || j >= G.nz ? 1e9 : G.dT[j * G.nx + i]; };

  /* ---- the nearest road sample to (x, z) through a 32 m hash of the samples; its lateral offset and the barrier on that side ---- */
  function scNear(T) {
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

  function buildSantiago(scene, tex, opts) {
    const T = K.track(), D = SCL_DATA, def = T.def, N = T.N, w = T.w, ds = T.ds, L = T.len, sStart = T.startS, R = rng(2287);
    const root = new THREE.Group(); scene.add(root);
    scPrep(T, D);
    const out = { root, dyn: {}, groundH: scGround, camFloor: scGround, props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    out.bounds = { minX: SG.x0, maxX: SG.x1, minZ: SG.z0, maxZ: SG.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; }, sAt = (d) => (((sStart + d) % L) + L) % L;
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const atSf = K.atSf, yS = (s) => T.elevAt(K.wrapS(s)).y;
    const addM = (g, mat, cast, recv) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = recv !== false; m.castShadow = !!cast; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); return m; };
    const scen = new K.Chunks(192);   // vertex coloured scenery in 192 m chunks
    // tree / building exclusion (hashed circles)
    const eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };
    const C = { T, D, def, N, w, ds, L, sStart, R, root, out, tex, opts, ownTex, matV, dS, sAt, Pt, atSf, yS, addM, scen, exclPush, excluded };
    C.near = scNear(T);
    const tag = (f, nm) => { const n0 = root.children.length; f(); for (let k = n0; k < root.children.length; k++) if (!root.children[k].name) root.children[k].name = nm; };   // (each part's meshes named after it)
    { const PL = def.pitLane; if (PL) C.inPits = (x, z) => { const q = C.near(x, z); if (q.i < 0) return false; const d = dS(q.i * ds); return d > PL[0] - 4 && d < PL[1] + 4 && q.lat * Math.sign(PL[2]) > 9 && q.lat * Math.sign(PL[2]) < Math.abs(PL[2]) + 36; }; }
    tag(() => scGroundMesh(C), 'scGround');
    tag(() => scWater(C), 'scWater');
    tag(() => scRoad(C), 'scRoad');
    tag(() => scWalls(C), 'scWalls');
    scLegs(C);
    tag(() => scPits(C), 'scPits');
    tag(() => scStands(C), 'scStands');
    tag(() => scBuildings(C), 'scBuildings');
    tag(() => scRoads(C), 'scRoads');
    tag(() => scJunctions(C), 'scJunctions');
    tag(() => scStreet(C), 'scStreet');
    tag(() => scTrees(C), 'scTrees');
    const far = scFar(C);
    out.dyn.step = (t, car, cam) => { far(cam); };
    tag(() => scen.addTo(root, matV, true, true), 'scScen');
    K.crowdFinish(C.CR, root, out);
    out.junctionProps = C.nJ || 0; out.sg = SG;
    return out;
  }

  /* ---- the ground mesh: 384 m chunks of the 8 m grid, one grass material, the land's kind in its vertex colours; the paved and the
     marked surfaces on top as their own OSM outlines (crisp edges): the Elipse and the plazas (pale concrete), car parks (asphalt), the
     playing fields (lined green), the running tracks (red), the swimming pools in the yards (blue) ---- */
  const KCOL = [[0.55, 0.56, 0.45], [0.5, 0.56, 0.38], [0.6, 0.58, 0.54], [0.6, 0.62, 0.55], [0.7, 0.62, 0.5], [0.64, 0.62, 0.46], [0.6, 0.7, 0.44], [0.58, 0.72, 0.44], [0.66, 0.65, 0.62], [0.76, 0.46, 0.36], [0.58, 0.56, 0.5]];
  const URBAN = [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1];   // (the kinds drawn as the city's ground: no grass picture)
  function scGroundMesh(C) {
    const G = SG, mat = new THREE.MeshLambertMaterial({ map: C.tex.grass, vertexColors: true }), grp = new THREE.Group(); C.root.add(grp); C.out.ground = grp;
    const ov = {}, plain = ov.plain = new K.Chunks(384, true);   // (the city's ground cells and the plain overlays: one untextured material)
    const S = 48;   // cells per chunk side (384 m)
    for (let cj = 0; cj < G.nz - 1; cj += S) for (let ci = 0; ci < G.nx - 1; ci += S) {
      const ni = Math.min(S, G.nx - 1 - ci), nj = Math.min(S, G.nz - 1 - cj), P = [], Cl = [], U = [], I = [], IU = [];
      for (let j = 0; j <= nj; j++) for (let i = 0; i <= ni; i++) {
        const k = (cj + j) * G.nx + ci + i, x = G.x0 + (ci + i) * G.c, z = G.z0 + (cj + j) * G.c, h = G.H[k], kd = G.wet[k] ? 3 : G.kind[k];
        const n1 = hash(ci + i, cj + j), n2 = 0.92 + 0.16 * Math.sin(x * 0.031 + Math.sin(z * 0.027) * 2) * Math.sin(z * 0.023 + x * 0.007);
        let col = KCOL[kd].map(v => v * n2 * (0.96 + 0.08 * n1));
        if (G.wet[k]) { col = [0.42, 0.42, 0.34]; }   // (the lake beds)
        if (URBAN[kd] && !G.wet[k]) col = col.map(v => v * (0.9 + 0.2 * hash(cj + j, ci + i)));
        if (kd === 0 && G.dT[k] < 40) { const t = 0.25; col = [lerp(col[0], 0.6, t), lerp(col[1], 0.74, t), lerp(col[2], 0.44, t)]; }   // (the watered lawns by the circuit: greener)
        P.push(x, h, z); Cl.push(col[0], col[1], col[2]); U.push(x / 14, -z / 14);
      }
      const W1 = ni + 1;
      for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) { const a = j * W1 + i, b = a + 1, c = a + W1, d = c + 1, k = (cj + j) * G.nx + ci + i, u = URBAN[G.kind[k]] && !G.wet[k] ? 1 : 0;
        if (!u) { I.push(a, c, b, b, c, d); continue; }
        const V = (q) => [P[q * 3], P[q * 3 + 1], P[q * 3 + 2]], Cv = (q) => [Cl[q * 3], Cl[q * 3 + 1], Cl[q * 3 + 2]], va = V(a), vb = V(b), vc = V(c), vd = V(d);
        plain.get(va[0] + 4, va[2] + 4).quadUp(va, vb, vd, vc, [Cv(a), Cv(b), Cv(d), Cv(c)], [[0, 0], [0, 0], [0, 0], [0, 0]]); }
      for (const [idx, mm] of [[I, mat]]) { if (!idx.length) continue;
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
        g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
        const m = new THREE.Mesh(g, mm); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); }
    }
    // the surfaces on top: OSM outlines, a few cm over the ground (not on the circuit's asphalt)
    const OV = { pedestrian: ['paved', [1.32, 1.3, 1.26], 6], parking: ['paved', [0.84, 0.84, 0.86], 8], pitch: ['plain', [0.42, 0.62, 0.34], 1], track: ['plain', [0.72, 0.32, 0.24], 1], playground: ['plain', [0.86, 0.8, 0.66], 6], pool: ['plain', [0.36, 0.7, 0.86], 1] };
    const OVM = { paved: C.tex.asphalt, plain: null };
    const near = C.near;
    const put = (key, ring, lift) => { const o = OV[key]; if (ring.length < 3) return;
      const pts = ring.map(p => new THREE.Vector2(p[0], p[1])); if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
      let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts, []); } catch (e) { return; }
      const g = ov[o[0]] || (ov[o[0]] = new K.Chunks(384, true)), y = (p) => scGround(p.x, p.y) + lift;
      const tri = (A, B, Cc, dep) => {
        const lab = Math.hypot(A.x - B.x, A.y - B.y), lbc = Math.hypot(B.x - Cc.x, B.y - Cc.y), lca = Math.hypot(Cc.x - A.x, Cc.y - A.y);
        const L0 = Math.max(lab, lbc, lca), cx0 = (A.x + B.x + Cc.x) / 3, cz0 = (A.y + B.y + Cc.y) / 3;
        // (split only near the circuit and the pits)
        if (L0 > 6 && dep < 7 && (scDT(cx0, cz0) < L0 + 30 || (C.inPits && C.inPits(cx0, cz0)))) { const m = (p, q) => new THREE.Vector2((p.x + q.x) / 2, (p.y + q.y) / 2), ab = m(A, B), bc = m(B, Cc), ca = m(Cc, A); tri(A, ab, ca, dep + 1); tri(ab, B, bc, dep + 1); tri(ca, bc, Cc, dep + 1); tri(ab, bc, ca, dep + 1); return; }
        const mx = (A.x + B.x + Cc.x) / 3, mz = (A.y + B.y + Cc.y) / 3, q = near(mx, mz); if (q.d < 0.3 || (C.inPits && C.inPits(mx, mz))) return;
        g.get(mx, mz).quadUp([A.x, y(A), A.y], [B.x, y(B), B.y], [Cc.x, y(Cc), Cc.y], [Cc.x, y(Cc), Cc.y], [o[1], o[1], o[1], o[1]], [[A.x / o[2], -A.y / o[2]], [B.x / o[2], -B.y / o[2]], [Cc.x / o[2], -Cc.y / o[2]], [Cc.x / o[2], -Cc.y / o[2]]]); };
      for (const [a, b, c] of tris) tri(pts[a], pts[b], pts[c], 0);
    };
    for (const [cl, ring] of C.D.lu) { if (cl === 'pedestrian' || cl === 'plaza') put('pedestrian', ring, 0.035); else if (cl === 'parking') put('parking', ring, 0.03); else if (cl === 'pitch') put('pitch', ring, 0.05); else if (cl === 'track') put('track', ring, 0.055); else if (cl === 'playground') put('playground', ring, 0.06); }
    for (const [cl, rings] of C.D.water) if (cl === 'swimming_pool' || cl === 'reflecting_pool') put('pool', rings[0], 0.06);
    for (const k in ov) ov[k].addTo(grp, new THREE.MeshLambertMaterial(k === 'plain' ? { vertexColors: true } : { map: OVM[k], vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), false, true);
  }

  /* ---- the park's lakes: each one a plane at its level (the ground keeps it out where it is land), the shore band along its waterline ---- */
  function scWater(C) {
    const G = SG, O = { color: 0x5a7f78, len: 0.7, amp: 0.5, refl: 0.45, land: 0.5, shal: 0.35, lap: 0.15 };
    const wm = K.waterMat(C.tex, O);
    C.out.dyn.water = C.tex.water;
    G.lakes.forEach((rings, k) => {
      const ring = rings[0], lv = G.lv[k]; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of ring) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      if (x1 < G.x0 || x0 > G.x1 || z1 < G.z0 || z0 > G.z1 || area(ring) < 150) return;
      const g = new THREE.PlaneGeometry(x1 - x0 + 16, z1 - z0 + 16, 1, 1); g.rotateX(-Math.PI / 2);
      const uv = g.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) * (x1 - x0 + 16) / 9, uv.getY(q) * (z1 - z0 + 16) / 9);
      const m = new THREE.Mesh(g, wm); m.position.set((x0 + x1) / 2, lv, (z0 + z1) / 2); m.receiveShadow = true; m.updateMatrix(); m.matrixAutoUpdate = false; C.root.add(m);
      const sd = (x, z) => (K.inPoly(ring, x, z) ? -1 : 1) * K.polyDist(ring, x, z);   // (+ on the land)
      const band = K.shoreBand(x0 - 12, z0 - 12, x1 + 12, z1 + 12, lv + 0.01, sd, 9, { F: 2 }); if (band) K.addShore(C.root, band, wm, O);
    });
  }

  /* ---- the circuit: asphalt (the racing line rubbered in, darker in the braking zones), white edge lines, red and white kerbs at the
     corners, the paved verges inside the walls (the park's sidewalks and the parade ground: concrete; the junctions' mouths), the
     start line and the grid ---- */
  function scRoad(C) {
    const { T, N, w, ds, tex, Pt, addM } = C, CH = 400, offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); C.out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true }), pMat = new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true });
    C.aMat = aMat; C.lMat = lMat; C.pMat = pMat;
    const kerb = [new Uint8Array(N), new Uint8Array(N)];
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) if (side * k > 0 || Math.abs(k) > 1 / 60) kerb[side > 0 ? 1 : 0][i] = 1; }
    const brk = new Float32Array(N);
    for (const c of T.corners) if (c.sev >= 2) for (let k = -60; k <= 6; k++) { const i = (c.i0 + k + N) % N, f = k < -10 ? sstep(-60, -12, k) : sstep(6, -10, k); if (f > brk[i]) brk[i] = f; }
    const shade = (i, o) => { const rl = T.rl[i]; let k = (0.84 - (0.15 + 0.12 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5)) * (0.96 + 0.06 * Math.sin(i * 0.013)); if (Math.abs(o) > w * 0.92) k -= 0.03; return [k, k, k * 1.02]; };
    const jMouth = C.jm = [new Float32Array(N), new Float32Array(N)];   // per sample: the junction mouth's paving (0: none)
    for (const [d, sd, ang, hw] of C.def.junctions || []) { const half = hw / Math.max(0.35, Math.sin(ang * Math.PI / 180)) + 4.5;
      for (let q = -half - 3; q <= half + 3; q += ds) { const i = T.idx(C.sAt(d + q)), f = Math.min(sstep(-half - 3, -half, q), sstep(half + 3, half, q)); jMouth[sd > 0 ? 1 : 0][i] = Math.max(jMouth[sd > 0 ? 1 : 0][i], f); } }
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new K.RB(true), gl = gr, gk = new K.RB(true), gp = new K.RB(true);   // (the edge lines in the asphalt's mesh)
      let pr = -1, pl = -1; const pk = [-1, -1], pp = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const wl = [2.3, 2.3, 2.2], lp = [Pt(i, -w + 0.15, 0.034), Pt(i, -w + 0.45, 0.034), Pt(i, w - 0.45, 0.034), Pt(i, w - 0.15, 0.034)], l = gl.row(lp, [wl, wl, wl, wl], lp.map(q => [q[0] / tileL, -q[2] / tileL])); if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        for (const side of [-1, 1]) {
          const si = side > 0 ? 1 : 0, bar = side > 0 ? T.br[i] : T.bl[i], kb = kerb[si][i], e0 = w + (kb ? T.curbW : 0);
          if (kb) { const cw = T.curbW, pf = [[w - 0.02, 0.035], [w + 0.14, 0.078], [w + cw - 0.12, 0.085], [w + cw + 0.02, 0.03]], vv = ii * ds / 2, sh = [0.84, 1, 1, 0.78].map(k => [k, k, k]), us = [0, 0.1, 0.92, 1], o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
            const rk = gk.row(o.map(k => Pt(i, side * pf[k][0], pf[k][1])), o.map(k => sh[k]), o.map(k => [us[k], vv])); if (pk[si] >= 0) gk.link(pk[si], rk, 0, 3); pk[si] = rk; } else pk[si] = -1;
          // the verge from the kerb (or the edge) to the wall: the park's paving (pale concrete), the sidewalks' joints in its texture
          const pc = jMouth[si][i] > 0.01 ? [0.66, 0.67, 0.7] : [0.72, 0.73, 0.76], q0 = Pt(i, side * (e0 + 0.02), 0.026), q1 = Pt(i, side * Math.max(e0 + 0.3, bar + 0.2), 0.026), qq = side > 0 ? [q0, q1] : [q1, q0];
          const rp = gp.row(qq, [pc, pc], qq.map(p => [p[0] / 3, -p[2] / 3])); if (pp[si] >= 0) gp.link(pp[si], rp, 0, 1); pp[si] = rp;
        }
      }
      addM(gr, aMat); addM(gk, cMat); addM(gp, pMat);
    }
    // the start line and the grid (boxes in pairs, staggered)
    { const sS = C.sStart, gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wh = [0.93, 0.93, 0.9], Q = (s, o, y) => { const p = C.atSf(s, o); return [p[0], C.yS(s) + y, p[1]]; };
      gq.quadUp(Q(sS - 0.8, -w, 0.04), Q(sS - 0.8, w, 0.04), Q(sS + 0.8, w, 0.04), Q(sS + 0.8, -w, 0.04), [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) { const sb = sS - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 2.8;
        gw.quadUp(Q(sb, lat - 1.4, 0.037), Q(sb, lat + 1.4, 0.037), Q(sb + 0.35, lat + 1.4, 0.037), Q(sb + 0.35, lat - 1.4, 0.037), [wh, wh, wh, wh]);
        gw.quadUp(Q(sb - 1.6, lat - 1.4, 0.037), Q(sb + 0.35, lat - 1.4, 0.037), Q(sb + 0.35, lat - 1.15, 0.037), Q(sb - 1.6, lat - 1.15, 0.037), [wh, wh, wh, wh]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat); }
  }

  /* ---- the barriers: the street circuit's concrete blocks (pale grey, a darker foot, the game's own adverts on some), with debris fences
     on poles above them; at the outside of the slow corners impact barriers in front of the blocks (blue and white foam), across a
     junction's mouth the fence over the blocks ---- */
  function scWalls(C) {
    const { T, N, ds, Pt, addM, tex } = C, side2 = (s) => (s > 0 ? 1 : 0), CH = 384;
    const foam = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) { if (c.sev < 3) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 6; k <= i1c + 10; k++) { const ii = ((k % N) + N) % N; if (!C.jm[si][ii]) foam[si][ii] = 1; } }
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const conc = [0.86, 0.86, 0.84], concD = [0.6, 0.6, 0.58], W1 = [1, 1, 1];
    const fo = (i, side) => (foam[side2(side)][i] ? 1.15 : 0);   // (where the foam stands in front of it, the wall 1.15 m back)
    C.wallOff = fo;
    const wallRow = (gr, i, side) => { const bar = (side > 0 ? T.br[i] : T.bl[i]) + fo(i, side), o = side * (bar + 0.1), o2 = side * (bar + 0.5), o3 = side * (bar + 0.7);   // a jersey profile: a sloped foot, the upright face, the top
      let p = [Pt(i, o - side * 0.1, -0.3), Pt(i, o + side * 0.06, 0.3), Pt(i, o + side * 0.2, 1.05), Pt(i, o2, 1.05)], c = [concD, conc, conc, [0.94, 0.94, 0.92]];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    const fence = [new Uint8Array(N), new Uint8Array(N)];
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new K.RB();
      for (const side of [-1, 1]) {
        let prev = -1;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) { const i = ii % N, r = wallRow(gr, i, side); if (prev >= 0) gr.link(prev, r, 0, 3); prev = r; fence[side2(side)][i] = 1; }
      }
      addM(gr, rMat, true);
    }
    // the impact barriers: foam blocks 1.2 m deep in front of the wall, blue and white in turn (merged into the scenery chunks)
    for (const side of [-1, 1]) for (let i = 0; i < N; i++) { if (!foam[side2(side)][i] || i % 1) continue;
      const bar = side > 0 ? T.br[i] : T.bl[i]; if (bar < T.w + 1.6) continue;
      const p = Pt(i, side * (bar + 0.55), 0), g = C.scen.get(p[0], p[2]), col = (i >> 0) % 2 ? [0.16, 0.36, 0.78] : [0.93, 0.94, 0.95];
      box(g, p[0], p[1] - 0.05, p[2], ds * 1.02, 1.0, 1.1, T.hd[i], col, col.map(v => v * 1.04)); }
    // the game's own adverts on the walls (tex.sponsors: 4 m boards), where the wall runs straight along the road
    { const sb = new K.Chunks(512, true);
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 2) {
        const j = (i + 2) % N, bar = side > 0 ? T.br : T.bl; if (foam[side2(side)][i] || Math.abs(bar[i] - bar[j]) > 0.3 || C.jm[side2(side)][i] > 0 || (i >> 1) % 5 > 2) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, o = (ii) => side * (bar[ii] + 0.32);
        const A = Pt(i, o(i), 0.32), B = Pt(j, o(j), 0.32), Cq = Pt(j, o(j), 1.0), Dq = Pt(i, o(i), 1.0), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        sb.get(A[0], A[2]).quadO(A, B, Cq, Dq, W1, Pt(i, side * (bar[i] + 2), 0.6), [[uL, v1 - 0.25], [uR, v1 - 0.25], [uR, v1], [uL, v1]]); }
      sb.addTo(C.root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true); }   // (one mesh per 192 m)
    // the debris fences on the walls
    const fg = new K.Chunks(384, true);
    for (const side of [-1, 1]) {
      const fc = fence[side2(side)], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N; if (!fc[i] || !fc[j]) { acc += ds; continue; }
        const top = 3.4, Q = (ii, y) => Pt(ii, side * (bar[ii] + fo(ii, side) + 0.55), y);
        const u0 = acc / 2.5, u1 = (acc + ds) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        fg.get(ins[0], ins[2]).quadO(Q(i, 1.0), Q(j, 1.0), Q(j, top), Q(i, top), W1, ins, [[u0, 0], [u1, 0], [u1, (top - 1) / 2.5], [u0, (top - 1) / 2.5]]);
        if (i % 2 === 0) { const p = Q(i, 0); box(C.scen.get(p[0], p[2]), p[0], p[1] + 0.9, p[2], 0.09, top - 0.8, 0.09, T.hd[i], [0.55, 0.56, 0.58]); }
        acc += ds;
      }
    }
    fg.addTo(C.root, fMat, false, true);
  }

  /* ---- the pit lane on the inside (left) of the straight (def.pitLane [from, to, centre offset]: scenery, the race has no stops): the
     lane and its lines behind the pit wall, the teams' temporary garages (white tents, a band in the team's colour), their stands on the
     wall; the start gantry over the straight ---- */
  const TEAM = [[0.86, 0.1, 0.12], [0.12, 0.16, 0.36], [0.16, 0.46, 0.3], [0.96, 0.52, 0.1], [0.94, 0.94, 0.92], [0.14, 0.14, 0.16], [0.16, 0.36, 0.8], [0.1, 0.62, 0.72], [0.96, 0.78, 0.12], [0.55, 0.26, 0.7], [0.4, 0.42, 0.46], [0.7, 0.1, 0.1]];
  function scPits(C) {
    const { T, def, sStart, out, scen, atSf, addM, exclPush, yS } = C, PL = def.pitLane; if (!PL) return;
    const [a, b, o] = PL, sg = o < 0 ? -1 : 1, lo = Math.abs(o);
    const at = (s, oo, y) => { const p = atSf(s, sg * oo); return [p[0], yS(s) + y, p[1]]; };
    const gl = new GB(true), gp = new GB(), one = [1, 1, 1], wl = [0.95, 0.95, 0.94];
    const quad = (g, s0, s1, o0, o1, y, c, uv) => { const A = at(s0, o0, y), B = at(s0, o1, y), Cq = at(s1, o1, y), Dq = at(s1, o0, y); g.quadUp(A, B, Cq, Dq, [c, c, c, c], uv ? [A, B, Cq, Dq].map(p => [p[0] / 8, -p[2] / 8]) : undefined); };
    // the lane (7 m), its white lines, the fast lane's dashes; the way in and out from the straight at its ends (a gap in the wall: no, the
    // wall runs on; the lane is scenery behind it)
    for (let q = a; q < b; q += 2) {
      const s0 = sStart + q, s1 = s0 + 2;
      quad(gl, s0, s1, lo - 3.5, lo + 3.5, 0.03, one, true);
      quad(gp, s0, s1, lo + 3.2, lo + 3.38, 0.04, wl);
      if (((q / 2) | 0) % 2 === 0) quad(gp, s0, s1, lo - 0.1, lo + 0.1, 0.04, wl);
      quad(gp, s0, s1, lo + 3.5, lo + 9.5, 0.035, [0.8, 0.8, 0.78]);   // (the apron in front of the garages)
      if (q % 6 === 0) { const p = atSf(s0, sg * lo); exclPush(p[0], p[1], 12); }
    }
    addM(gl, C.aMat); addM(gp, C.lMat);
    // the garages: 12 tents 13 m wide along the apron, white with a band and the back wall in the team's colour, open to the lane
    for (let q = a + 16, k = 0; q + 13 < b - 6 && k < 12; q += 15, k++) {
      const s0 = sStart + q, s1 = s0 + 13, tc = TEAM[k % TEAM.length], mid = at((s0 + s1) / 2, lo + 15, 0), g = scen.get(mid[0], mid[2]);
      const P8 = (o0, o1, y0, y1) => [at(s0, o0, y0), at(s1, o0, y0), at(s1, o1, y0), at(s0, o1, y0), at(s0, o0, y1), at(s1, o0, y1), at(s1, o1, y1), at(s0, o1, y1)];
      const slab = (o0, o1, y0, y1, col, top, open) => { const V = P8(o0, o1, y0, y1), m = at((s0 + s1) / 2, (o0 + o1) / 2, (y0 + y1) / 2);
        for (const [i0, i1, i2, i3, cc, fr] of [[0, 1, 5, 4, col, 1], [1, 2, 6, 5, col, 0], [2, 3, 7, 6, col, 0], [3, 0, 4, 7, col, 0], [4, 5, 6, 7, top || col, 0]]) if (!(open && fr)) g.quadO(V[i0], V[i1], V[i2], V[i3], cc, m); };
      slab(lo + 9.5, lo + 21, 0, 4.2, [0.94, 0.94, 0.95], [0.97, 0.97, 0.98], true);           // the tent (open to the lane)
      slab(lo + 9.4, lo + 9.6, 3.5, 4.2, tc, tc);                                             // the band over the opening
      slab(lo + 20.6, lo + 20.9, 0.05, 3.5, tc.map(v => v * 0.8 + 0.1));                     // the back wall
      slab(lo + 10, lo + 20.5, 0.0, 0.04, [0.46, 0.48, 0.5], [0.52, 0.54, 0.57]);             // the floor
      for (const ca of [3.5, 9.5]) { const p = at(s0 + ca, lo + 15, 0); box(g, p[0], p[1], p[2], 2.2, 0.9, 1.1, T.hd[T.idx(s0)], [0.2, 0.21, 0.24]); }   // the tool chests and the chargers
      // the team's stand on the pit wall: a desk with screens under a roof in its colour
      const wv = (T.bl[T.idx(s0)]) + 0.8, p = at(s0 + 6.5, wv, 0), hd = T.hd[T.idx(s0)];
      box(g, p[0], p[1] + 0.9, p[2], 2.5, 0.06, 1.0, hd, [0.3, 0.31, 0.34], [0.36, 0.37, 0.4]); box(g, p[0], p[1] + 2.4, p[2], 2.7, 0.07, 1.6, hd, [0.22, 0.23, 0.26], tc);
      for (const e of [-1.2, 1.2]) box(g, p[0] + Math.cos(hd) * e, p[1], p[2] + Math.sin(hd) * e, 0.08, 2.4, 0.08, 0, [0.25, 0.26, 0.28]);
      exclPush(mid[0], mid[2], 10);
    }
    // the paddock behind: the teams' trucks and offices (white and grey containers in rows)
    for (let q = a + 10, k = 0; q < b - 10; q += 18, k++) { const p = at(sStart + q, lo + 28, 0), g = scen.get(p[0], p[2]), hd = T.hd[T.idx(sStart + q)], tc = TEAM[k % TEAM.length];
      if (k % 2) { box(g, p[0], p[1], p[2], 13.6, 3.8, 2.5, hd, [0.92, 0.92, 0.93], tc); } else { box(g, p[0], p[1], p[2], 12, 2.6, 2.5, hd, [0.85, 0.86, 0.87], [0.7, 0.72, 0.74]); box(g, p[0], p[1] + 2.6, p[2], 12, 2.6, 2.5, hd, [0.92, 0.92, 0.93], tc); }
      exclPush(p[0], p[2], 9); }
    // the start gantry: two posts outside the walls, a beam over the road with the five lights
    { const i = T.idx(sStart), [x, z] = [T.px[i], T.pz[i]], y = T.hy[i], h = T.hd[i], g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      const oL = T.bl[i] + 1.0, oR = T.br[i] + 1.0;
      for (const oo of [-oL, oR]) box(g, x + nx * oo, y - 0.3, z + nz * oo, 0.8, 7.9, 0.8, h, gray);
      const cx = x + nx * (oR - oL) / 2, cz = z + nz * (oR - oL) / 2;
      box(g, cx, y + 6.4, cz, 1.1, 1.3, oL + oR + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, y + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const oo = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * oo, y + 7.95, z + nz * oo); m.rotation.y = -h; C.root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      exclPush(x, z, Math.max(oL, oR) + 6);
    }
  }

  /* ---- grandstands (def.stands [from, to, side, rows, roof]): temporary steel stands behind the walls, tiers following the road with the
     seated crowd picture on them, a roof over the main one; fans on the grass (def.ga), the crowd layer ---- */
  const SC_SHIRTS = [[0.86, 0.12, 0.14], [0.95, 0.95, 0.94], [0.12, 0.22, 0.6], [0.86, 0.12, 0.14], [0.95, 0.95, 0.94], [0.98, 0.78, 0.12], [0.12, 0.13, 0.16], [0.16, 0.36, 0.8], [0.18, 0.55, 0.3], [0.94, 0.5, 0.1], [0.12, 0.22, 0.6], [0.6, 0.18, 0.5]];   // (lots of red, white and blue)
  function scStands(C) {
    const { T, def, sStart, scen, atSf, addM, exclPush, tex } = C, crowdG = new GB(true), W1 = [1, 1, 1];
    const near = (x, z) => { const q = C.near(x, z); return q.d; };
    const CR = K.crowdCtx({ gH: scGround, near, excluded: (x, z) => C.excluded(x, z), water: (x, z) => scKind(x, z) === 3, maxSlope: 0.5, shirts: SC_SHIRTS, chunk: 256 });
    C.CR = CR;
    for (const [a, b, side, rows, roof] of def.stands || []) {
      const dep = 0.95, rise = 0.62, st = [];
      for (let d = a; d <= b + 0.01; d += Math.min(5, Math.max(1, b - d))) { const s = C.sAt(d), i = T.idx(s), f0 = (side > 0 ? T.br[i] : T.bl[i]) + 2.4; st.push({ s, f0, y: T.hy[i] }); }
      const F0 = st.map((q, m) => { let t = 0, n = 0; for (let e = -3; e <= 3; e++) { t += st[clamp(m + e, 0, st.length - 1)].f0; n++; } return Math.max(q.f0 - 0.3, t / n); });
      const rowsP = st.map((q, m) => { const f0 = F0[m], prof = [[f0 - 0.3, -0.5]]; let y = 0;
        for (let k = 0; k < rows; k++) { const o = f0 + k * dep; y = 0.55 + k * rise; prof.push([o, y], [o + dep, y]); }
        const back = f0 + rows * dep; prof.push([back, y + 1.2], [back + 0.3, y + 1.2], [back + 0.3, -0.3]);
        return { s: q.s, y0: q.y, prof, pts: prof.map(([o, yy]) => { const p = atSf(q.s, side * o); return [p[0], q.y + yy, p[1]]; }), top: y + 4.2, o0: f0 + rows * dep * 0.35, o1: back + 0.6 }; });
      for (let m = 0; m + 1 < rowsP.length; m++) {
        const A = rowsP[m], B = rowsP[m + 1], g = scen.get(A.pts[1][0], A.pts[1][2]), n = A.pts.length;
        for (let e = 0; e + 1 < n; e++) { const a0 = A.pts[e], a1 = A.pts[e + 1], b0 = B.pts[e], b1 = B.pts[e + 1], up = Math.abs(a1[1] - a0[1]) < 0.05, om = (A.prof[e][0] + A.prof[e + 1][0]) / 2, ym = (a0[1] + a1[1]) / 2;
          const p = atSf(A.s, side * (up ? om : e >= n - 3 ? om - 1 : om + 1)); g.quadO(a0, a1, b1, b0, up ? [0.55, 0.57, 0.6] : e >= n - 3 ? [0.38, 0.4, 0.44] : [0.45, 0.47, 0.5], [p[0], up ? ym - 1 : ym, p[1]]); }
        for (let k = 0; k < rows; k++) { const a0 = A.pts[1 + k * 2], a1 = A.pts[2 + k * 2], b0 = B.pts[1 + k * 2], b1 = B.pts[2 + k * 2], v = (k * 0.11) % 1, u0 = (m * 5) / 12, len = Math.hypot(b0[0] - a0[0], b0[2] - a0[2]);
          crowdG.quadUp([a0[0], a0[1] + 0.02, a0[2]], [a1[0], a1[1] + 0.02, a1[2]], [b1[0], b1[1] + 0.02, b1[2]], [b0[0], b0[1] + 0.02, b0[2]], [W1, W1, W1, W1], [[u0, v], [u0, v + 0.1], [u0 + len / 12, v + 0.1], [u0 + len / 12, v]]); }
        if (m % 2 === 0) for (let k = 0; k <= rows; k += 3) { const o = A.prof[0][0] + 0.3 + k * dep, y = 0.55 + Math.max(0, k - 1) * rise, p = atSf(A.s, side * o); box(g, p[0], A.y0 - 0.2, p[1], 0.08, y + 0.2, 0.08, 0, [0.5, 0.52, 0.55]); }   // (the scaffold's legs)
        if (roof) { const q = (Rr, o, y) => { const p = atSf(Rr.s, side * o); return [p[0], Rr.y0 + y, p[1]]; }, tA = A.top, tB = B.top;
          const rc = m % 2 ? [0.9, 0.91, 0.93] : [0.82, 0.84, 0.87];   // (the roof's panels, light and darker in turn; a red fascia along its front)
          g.quadO(q(A, A.o0 + 0.6, tA + 0.75), q(B, B.o0 + 0.6, tB + 0.75), q(B, B.o1, tB), q(A, A.o1, tA), rc, q(A, (A.o0 + A.o1) / 2, tA - 5));
          g.quadO(q(A, A.o0, tA + 0.8), q(B, B.o0, tB + 0.8), q(B, B.o0 + 0.6, tB + 0.75), q(A, A.o0 + 0.6, tA + 0.75), [0.78, 0.1, 0.12], q(A, A.o0 + 0.3, tA - 5));
          g.quadO(q(A, A.o0, tA + 0.5), q(B, B.o0, tB + 0.5), q(B, B.o1, tB - 0.3), q(A, A.o1, tA - 0.3), [0.6, 0.62, 0.66], q(A, (A.o0 + A.o1) / 2, tA + 5));
          if (m % 2 === 0) { const p = atSf(A.s, side * (A.o1 - 0.4)); box(g, p[0], A.y0 - 0.3, p[1], 0.4, tA + 0.3, 0.4, 0, [0.86, 0.87, 0.9]); } }
      }
      for (const r of rowsP) { const p = atSf(r.s, side * (r.prof[0][0] + rows * dep * 0.5)); exclPush(p[0], p[1], rows * dep / 2 + 5); CR.exclAdd(p[0], p[1], rows * dep / 2 + 3); }
    }
    if (!crowdG.empty) addM(crowdG, K.crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.11, 0.1));
    // fans on the grass and at the stands' ends
    for (const [a, b, side] of def.ga || []) K.crowdRun(CR, sStart + a, sStart + b, side, { rows: 3, dens: 0.55, first: 1.6, gap: 0.9, clump: 0.6, sit: 0.3, flag: 0.08, below: 1.2, above: 2, label: 'ga' });
    for (const [a, , side] of def.stands || []) K.crowdRun(CR, sStart + a - 12, sStart + a, side, { rows: 2, dens: 0.4, first: 1.6, label: 'standEnd' });
  }

  /* ---- the buildings round the park (OSM outlines; the heights OSM gives, else estimated from the Copernicus surface model): stuccoed
     walls in the city's colours (cream, ochre, salmon, white, a pale blue now and then), a band of windows on every floor, flat roofs with
     their parapets and kit, the small houses under tiled hip roofs; the round arena plain (no name); the rest of the city within ~650 m as
     boxes (OSM footprints as rectangles), merged per 256 m chunk ---- */
  const WALLS = [[0.92, 0.88, 0.78], [0.86, 0.72, 0.52], [0.88, 0.66, 0.56], [0.94, 0.93, 0.9], [0.8, 0.82, 0.84], [0.76, 0.64, 0.5], [0.9, 0.82, 0.62], [0.72, 0.8, 0.86], [0.84, 0.56, 0.42]];
  function scBuildings(C) {
    const { D, root, scen, exclPush, near } = C, glass = [0.24, 0.3, 0.36], roofC = [0.56, 0.55, 0.53], tile = [0.62, 0.32, 0.22];
    for (const [kd, h0, mh, ring] of D.bld) {
      if (ring.length < 3) continue;
      const [cx, cz] = centroid(ring); let hit = false;
      for (let k = 0; k < ring.length && !hit; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3); for (let t = 0; t <= n && !hit; t++) if (near(a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n).d < 1.5) hit = true; }
      if (hit || near(cx, cz).d < 1.5) continue;   // (an outline over the circuit's corridor: left out)
      const A = area(ring), H = Math.max(2.6, h0), hv = hash(Math.round(cx), Math.round(cz)), y0 = Math.min(...ring.map(p => scGround(p[0], p[1]))) + (mh || 0) - 0.3, y1 = Math.max(...ring.map(p => scGround(p[0], p[1]))) + H;
      const base = kd === 1 ? [[0.92, 0.91, 0.88], [0.84, 0.84, 0.82], [0.88, 0.8, 0.68]][Math.floor(hv * 3)] : kd === 4 || kd === 6 ? [[0.9, 0.9, 0.88], [0.8, 0.8, 0.8], [0.86, 0.78, 0.66]][Math.floor(hv * 3)] : WALLS[Math.floor(hv * WALLS.length)];
      const col = base.map(v => v * (0.94 + 0.1 * hash(Math.round(cz), Math.round(cx)))), g = scen.get(cx, cz), ins = [cx, (y0 + y1) / 2, cz], floors = H > 4.5 ? Math.max(1, Math.floor((H - 0.6) / 3.0)) : 1;
      const round = A > 3000 && ring.length > 24;   // (the arena: a drum, its dome roof)
      for (let k = 0; k < ring.length; k++) {
        const a = ring[k], b = ring[(k + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.3) continue;
        g.quadO([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], col, ins);
        const ox = (b[1] - a[1]) / l, oz = -(b[0] - a[0]) / l, sgn = ((a[0] + b[0]) / 2 - cx) * ox + ((a[1] + b[1]) / 2 - cz) * oz > 0 ? 0.05 : -0.05;   // (outward)
        if (l > 2.4 && !round) for (let f = 0; f < floors; f++) { const yb = y0 + 0.3 + f * 3.0 + 1.0, yt = yb + 1.3; if (yt > y1 - 0.4) break;
          const Aw = [a[0] + ox * sgn + (b[0] - a[0]) * 0.7 / l, yb, a[1] + oz * sgn + (b[1] - a[1]) * 0.7 / l], Bw = [b[0] + ox * sgn - (b[0] - a[0]) * 0.7 / l, yb, b[1] + oz * sgn - (b[1] - a[1]) * 0.7 / l];
          g.quadO(Aw, Bw, [Bw[0], yt, Bw[2]], [Aw[0], yt, Aw[2]], glass, ins); }
      }
      let rr = 0; for (const p of ring) rr = Math.max(rr, Math.hypot(p[0] - cx, p[1] - cz));
      if (round) {   // the arena's shallow dome: rings of the outline drawn in towards the top, pale metal
        for (let t = 0; t < 4; t++) { const f0 = 1 - t / 4, f1 = 1 - (t + 1) / 4, ya = y1 + 6 * (1 - f0 * f0), yb = y1 + 6 * (1 - f1 * f1);
          for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], P = (p, f, y) => [cx + (p[0] - cx) * f, y, cz + (p[1] - cz) * f];
            g.quadO(P(a, f0, ya), P(b, f0, ya), P(b, f1, yb), P(a, f1, yb), [0.8 - t * 0.03, 0.82 - t * 0.03, 0.84 - t * 0.03], [cx, y1 - 10, cz]); } }
      } else if (kd === 0 && A < 260 && H < 9) {   // a house: a tiled hip roof over its outline's principal box
        let sxx = 0, szz = 0, sxz = 0; for (const p of ring) { const dx = p[0] - cx, dz = p[1] - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; }
        const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th); let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
        for (const p of ring) { const dx = p[0] - cx, dz = p[1] - cz, u = dx * ux + dz * uz, v = -dx * uz + dz * ux; a0 = Math.min(a0, u); a1 = Math.max(a1, u); b0 = Math.min(b0, v); b1 = Math.max(b1, v); }
        const Lr = a1 - a0 + 0.6, Dr = b1 - b0 + 0.6, mx = cx + ux * (a0 + a1) / 2 - uz * (b0 + b1) / 2, mz = cz + uz * (a0 + a1) / 2 + ux * (b0 + b1) / 2, tc = tile.map(v => v * (0.86 + 0.24 * hv));
        if (Lr > 2 && Dr > 2) World.gable(g, mx, y1, mz, Math.max(Lr, Dr), Math.min(Lr, Dr), Math.min(Lr, Dr) * 0.32, Lr >= Dr ? th : th + Math.PI / 2, tc, col);
      } else {   // a flat roof: a fan from the centre (the outlines are near enough convex); a parapet and air conditioners on the bigger ones
        for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length]; g.triO([cx, y1, cz], [a[0], y1, a[1]], [b[0], y1, b[1]], roofC.map(v => v * (0.9 + 0.2 * hv)), [cx, y1 - 5, cz]); }
        if (A > 120) { const n = Math.min(4, Math.floor(A / 150)); for (let t = 0; t < n; t++) { const ax = cx + (hash(t, Math.round(cx)) - 0.5) * rr * 0.6, az = cz + (hash(Math.round(cz), t) - 0.5) * rr * 0.6; box(g, ax, y1, az, 1.2, 0.8, 0.9, hv * 3, [0.78, 0.78, 0.8], [0.7, 0.7, 0.72]); }
          if (H > 14) box(g, cx, y1, cz, 3.2, 2.4, 3.2, hv * 3, [0.72, 0.72, 0.7]); }   // (the lift's and the water tank's housing)
      }
      exclPush(cx, cz, rr * 0.9 + 1); if (C.CR) C.CR.exclAdd(cx, cz, rr);
    }
    // the rest within ~650 m of the circuit: boxes, a lighter top; farther ones and the city's towers go to the far view (scFar)
    const mb = b64(D.bldMidB), dv = new DataView(mb.buffer), mid = new K.Chunks(256); C.farBoxes = [];
    for (let k = 0; k + 8 <= mb.length; k += 8) {
      const x = dv.getInt16(k, true), z = dv.getInt16(k + 2, true), Lx = mb[k + 4], Wz = mb[k + 5], a = mb[k + 6] * Math.PI / 180, h = Math.max(3, mb[k + 7]);
      const dt = scDT(x, z), rr = Math.hypot(Lx, Wz) / 2; if (dt < rr + 10 && near(x, z).d < rr + 1.5) continue;
      const hv = hash(x, z), col = h > 18 ? [0.82, 0.82, 0.8].map(v => v * (0.9 + 0.2 * hv)) : WALLS[Math.floor(hv * WALLS.length)].map(v => v * 0.92);
      if (dt > 650) { if (h >= 12) C.farBoxes.push([x, z, Lx, Wz, a, h]); continue; }
      const y0 = scGround(x, z);
      box(mid.get(x, z), x, y0 - 0.5, z, Lx, h + 0.5, Wz, a, col, h > 9 ? [0.55, 0.55, 0.54] : hv < 0.5 ? [0.62, 0.34, 0.24] : [0.6, 0.58, 0.55]);
    }
    mid.addTo(root, C.matV, false, true);   // (no shadows from the blocks beyond the park: rarely near the car)
  }

  /* ---- the streets and paths round the park (OSM; not the circuit): asphalt with the white dashed centre line, the sidewalks either side
     of the city's streets (pale paving, a curb), the park's paths (pale gravel), zebra crossings where OSM has them, street lamps every
     ~35 m, cars parked along the residential streets ---- */
  const RCLS = { primary: 1, secondary: 1, tertiary: 1, residential: 1, unclassified: 1, living_street: 1, motorway: 1, trunk: 1 };
  function scRoads(C) {
    const { D, root, tex, scen } = C, near = C.near, G = SG;
    const road = new K.Chunks(384, true), walk = new K.Chunks(384, true), aMat = C.aMat, path = walk, mark = road, PAINT = [2.3, 2.3, 2.2];   // (paths on the sidewalks' material; the paint in the road's mesh: a bright tone on the asphalt picture)
    const legs = C.legs || [];
    const inLeg = (x, z) => { for (const L of legs) { const dx = x - L.cx, dz = z - L.cz, r = dx * L.ux + dz * L.uz, v = -dx * L.uz + dz * L.ux; if (r > L.r0 - 2 && r < L.rEnd + 4 && Math.abs(v) < L.hw + 3) return true; } return false; };
    const W1 = [1, 1, 1], wh = PAINT, curbC = [0.62, 0.61, 0.58], walkC = [0.7, 0.71, 0.74], uvP = (q) => [q[0] / 8, -q[2] / 8];
    const lampAt = [], parkAt = [], rm = new Uint8Array(G.nx * G.nz), mk = (x, z, r) => { const i0 = Math.floor((x - r - G.x0) / G.c), i1 = Math.ceil((x + r - G.x0) / G.c), j0 = Math.floor((z - r - G.z0) / G.c), j1 = Math.ceil((z + r - G.z0) / G.c);
      for (let j = Math.max(0, j0); j <= Math.min(G.nz - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(G.nx - 1, i1); i++) rm[j * G.nx + i] = 1; };
    C.roadMask = (x, z) => { const i = Math.round((x - G.x0) / G.c), j = Math.round((z - G.z0) / G.c); return i >= 0 && j >= 0 && i < G.nx && j < G.nz && rm[j * G.nx + i] === 1; };
    for (const [cls, hw, lv, pts] of D.roads) {
      if (lv > 0) continue;   // (the bridges over the motorway's trench: its own level, left out)
      const isPath = /^(footway|path|cycleway|steps|pedestrian|track)$/.test(cls), street = !!RCLS[cls], half = isPath ? Math.min(hw, 1.3) : hw, sunk = lv < 0 || cls === 'motorway' ? -3.5 : 0;
      const tgt = isPath ? path : road, col = isPath ? (cls === 'cycleway' ? [0.66, 0.4, 0.34] : [0.98, 0.9, 0.78]) : [0.82, 0.82, 0.84], lift = isPath ? 0.03 : 0.045;
      const P = []; for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4)); for (let q = 0; q < n; q++) P.push([ax + (bx - ax) * q / n, az + (bz - az) * q / n]); }
      P.push(pts[pts.length - 1]);
      let run = [];
      const flush = () => {
        if (run.length >= 2) {
          let acc = 0, prev = null;
          for (let k = 0; k < run.length; k++) {
            const a = run[Math.max(0, k - 1)], b = run[Math.min(run.length - 1, k + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l, p = run[k], y = scGround(p[0], p[1]) + lift + sunk;
            if (k) acc += Math.hypot(p[0] - run[k - 1][0], p[1] - run[k - 1][1]);
            const cur = { p, y, nx, nz };
            if (prev) {
              const Q = (c, o, dy) => [c.p[0] + c.nx * o, c.y + (dy || 0), c.p[1] + c.nz * o], g = tgt.get(p[0], p[1]), uv = (q) => [q[0] / 8, -q[2] / 8];
              const A = Q(prev, -half), B = Q(cur, -half), Cq = Q(cur, half), Dq = Q(prev, half), us = isPath ? 1.5 / 8 : 1, uvw = (q) => [q[0] / 8 / us, -q[2] / 8 / us]; g.quadUp(A, B, Cq, Dq, [col, col, col, col], [uvw(A), uvw(B), uvw(Cq), uvw(Dq)]);
              if (street && !sunk) {   // the sidewalks (2.2 m, 12 cm up), their curbs
                for (const sg of [-1, 1]) { const a0 = Q(prev, sg * half, 0.12), a1 = Q(prev, sg * (half + 2.2), 0.12), b1 = Q(cur, sg * (half + 2.2), 0.12), b0 = Q(cur, sg * half, 0.12), gw = walk.get(p[0], p[1]);
                  gw.quadUp(a0, a1, b1, b0, [walkC, walkC, walkC, walkC], [[a0[0] / 1.5, -a0[2] / 1.5], [a1[0] / 1.5, -a1[2] / 1.5], [b1[0] / 1.5, -b1[2] / 1.5], [b0[0] / 1.5, -b0[2] / 1.5]]);
                  gw.quadO(Q(prev, sg * half, -0.02), Q(cur, sg * half, -0.02), Q(cur, sg * half, 0.12), Q(prev, sg * half, 0.12), curbC, Q(prev, sg * (half + 1), 0)); }
                if (half >= 2.8 && Math.floor(acc / 3) % 3 === 0) { const ml = mark.get(p[0], p[1]), q4 = [Q(prev, -0.07, 0.012), Q(cur, -0.07, 0.012), Q(cur, 0.07, 0.012), Q(prev, 0.07, 0.012)]; ml.quadUp(q4[0], q4[1], q4[2], q4[3], [wh, wh, wh, wh], q4.map(uvP)); }
                if (Math.floor(acc / 34) !== Math.floor((acc - 4) / 34)) lampAt.push([p[0] + nx * (half + 1.6), p[1] + nz * (half + 1.6), Math.atan2(-nz, -nx)]);
                if ((cls === 'residential' || cls === 'tertiary') && Math.floor(acc / 6) !== Math.floor((acc - 4) / 6)) for (const sg of [-1, 1]) parkAt.push([p[0] + nx * sg * (half - 1.1), p[1] + nz * sg * (half - 1.1), Math.atan2(tz, tx), hash(Math.round(p[0] * 3) + sg, Math.round(p[1] * 3))]);
              }
            }
            prev = cur;
          }
        }
        run = [];
      };
      for (const p of P) {
        const q = near(p[0], p[1]), bad = q.d < (isPath ? 1.5 : 1.0) || Math.abs(q.lat) < q.bar + 0.8 || p[0] < G.x0 || p[1] < G.z0 || p[0] > G.x1 || p[1] > G.z1 || inLeg(p[0], p[1]) || scKind(p[0], p[1]) === 3;
        if (bad) flush(); else { run.push(p); mk(p[0], p[1], half + (street ? 2.6 : 0.6)); }
      }
      flush();
    }
    walk.addTo(root, new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true }), false, true);
    // the zebra crossings where OSM has them on a street: white bars across it (its direction from the nearest road's segment)
    const segs = []; for (const [cls, hw, lv, pts] of D.roads) if (RCLS[cls] && !lv) for (let k = 0; k + 1 < pts.length; k++) segs.push([pts[k], pts[k + 1], hw]);
    for (const [x, z] of (D.fur.crossing || [])) {
      if (near(x, z).d < 1 || inLeg(x, z)) continue;
      let best = null, bd = 9; for (const [a, b, hw] of segs) { const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz || 1, t = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / l2, 0, 1), d = Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); if (d < bd) { bd = d; best = [vx, vz, hw]; } }
      if (!best) continue;
      const l = Math.hypot(best[0], best[1]), ux = best[0] / l, uz = best[1] / l, vx = -uz, vz = ux, hw = best[2], y = scGround(x, z) + 0.06, g = mark.get(x, z);
      for (let v = -hw + 0.4; v < hw - 0.3; v += 1.0) { const P = (u, vv) => [x + ux * u + vx * vv, y, z + uz * u + vz * vv], q4 = [P(-1.5, v), P(1.5, v), P(1.5, v + 0.5), P(-1.5, v + 0.5)]; g.quadUp(q4[0], q4[1], q4[2], q4[3], [wh, wh, wh, wh], q4.map(uvP)); }
    }
    road.addTo(root, aMat, false, true);
    // street lamps (the city's: a tall grey pole, the arm and the head over the street), away from the circuit
    let nL = 0; const lamp = (x, y, z, a) => { const g = scen.get(x, z), gr = [0.5, 0.52, 0.55], c = Math.cos(a), sn = Math.sin(a); cyl(g, x, y - 0.2, z, 0.11, 9.2, 5, gr, null, 0.07); box(g, x + c * 0.9, y + 8.8, z + sn * 0.9, 1.9, 0.1, 0.1, a, gr); box(g, x + c * 1.8, y + 8.55, z + sn * 1.8, 0.75, 0.22, 0.34, a, [0.38, 0.4, 0.43], [0.46, 0.48, 0.5]); nL++; };
    for (const [x, z, a] of lampAt) { if (near(x, z).d < 2 || C.excluded(x, z)) continue; lamp(x, scGround(x, z) + 0.12, z, a); }
    for (const [x, z] of (D.fur.street_lamp || [])) { if (near(x, z).d < 2) continue; lamp(x, scGround(x, z), z, hash(Math.round(x), Math.round(z)) * TAU); }
    // the parked cars (instanced, in the street's colours of the city: white, silver, grey, black, red, blue)
    const cars = { n: 0, add: (x, y, z, rot, sxz, sy, col) => { const g = scen.get(x, z), a = -rot, c = Math.cos(a), sn = Math.sin(a), gl = [0.12, 0.15, 0.18], ty = [0.06, 0.06, 0.07];
      box(g, x, y + 0.28, z, 4.3, 0.64, 1.76, a, col, col, true); box(g, x - c * 0.2, y + 0.92, z - sn * 0.2, 2.2, 0.52, 1.56, a, gl, col, true);
      for (const o of [-0.78, 0.78]) box(g, x - sn * o, y, z + c * o, 3.3, 0.58, 0.24, a, ty, ty, true); } };   // (merged into the scenery chunks)
    const CARC = [[0.92, 0.92, 0.92], [0.72, 0.73, 0.75], [0.45, 0.46, 0.48], [0.12, 0.12, 0.13], [0.66, 0.12, 0.1], [0.16, 0.26, 0.52], [0.95, 0.95, 0.95], [0.6, 0.6, 0.62]];
    let nCars = 0;
    for (const [x, z, hd, hv] of parkAt) { if (hv > 0.55 || near(x, z).d < 3 || C.excluded(x, z) || C.near(x, z).d > 420) continue;
      const col = CARC[Math.floor(hash(Math.round(x * 7), Math.round(z * 7)) * CARC.length)], k = 0.88 + 0.2 * hv;
      cars.add(x, scGround(x, z) + 0.05, z, -hd, 1, 1, [col[0] * k, col[1] * k, col[2] * k]); nCars++; }
    // the car parks (OSM): cars in rows
    for (const [cl, ring] of D.lu) { if (cl !== 'parking') continue;
      let best = 0, ux = 1, uz = 0; for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; ux = (b[0] - a[0]) / l; uz = (b[1] - a[1]) / l; } }
      const [cx, cz] = centroid(ring), vx = -uz, vz = ux; let ext = 0; for (const p of ring) ext = Math.max(ext, Math.hypot(p[0] - cx, p[1] - cz));
      for (let a = -ext; a < ext; a += 2.6) for (let b = -ext; b < ext; b += 6.2) { const x = cx + ux * a + vx * b, z = cz + uz * a + vz * b;
        if (!K.inPoly(ring, x, z) || K.polyDist(ring, x, z) < 1.4 || near(x, z).d < 2 || C.excluded(x, z) || hash(Math.round(x * 3), Math.round(z * 3)) < 0.45) continue;
        const col = CARC[Math.floor(hash(Math.round(z * 5), Math.round(x * 5)) * CARC.length)]; cars.add(x, scGround(x, z) + 0.08, z, -(Math.atan2(vz, vx) + (hash(Math.round(x), 3) < 0.5 ? Math.PI : 0)), 1, 1, col); nCars++; } }
    C.out.parkedCars = nCars; C.out.lamps = nL;
  }
  function scCarGeo() {   // a parked car (4.3 m long along x, 1.8 m wide): the body in the instance colour, dark glass, black tyres
    const g = new GB(), W1 = [1, 1, 1], gl = [0.12, 0.15, 0.18], tyre = [0.06, 0.06, 0.07];
    box(g, 0, 0.28, 0, 4.3, 0.64, 1.76, 0, W1, W1, true); box(g, -0.2, 0.92, 0, 2.2, 0.52, 1.56, 0, gl, W1, true);
    for (const z of [-0.78, 0.78]) box(g, 0, 0.0, z, 3.3, 0.58, 0.24, 0, tyre, tyre, true);
    return g.geometry();
  }

  /* ---- the junctions (def.junctions): the side road's leg from the circuit's edge out past its fence (the barrier opens into its mouth up
     to the fence, Core: def.walls), its sidewalks beyond; in the mouth the paved corners, the zebra crossing and the stop line; the road
     closed beyond the fence by a barricade. The street furniture of the junction (def.furniture), all of it knockable (World props ->
     Core's loose props); where the leg reaches an avenue, that junction's traffic lights (OSM) as scenery ---- */
  function scLegs(C) {
    const { T, def, w } = C, JOFF = def.junctionOff || 11.5;
    C.legs = (def.junctions || []).map(([d, sd, ang, hw, kind, len, what]) => {
      const s = C.sAt(d), i = T.idx(s), a = ang * Math.PI / 180, tx = T.tx[i], tz = T.tz[i], nx = T.nx[i] * sd, nz = T.nz[i] * sd, ca = Math.cos(a), sa = Math.sin(a);
      const ux = tx * ca + nx * sa, uz = tz * ca + nz * sa, sn = Math.max(0.35, sa);
      const ct = ca / sn, e = hw / sn, qa = Math.min(w * ct, (w + JOFF) * ct) - e - 4.5, qb = Math.max(w * ct, (w + JOFF) * ct) + e + 4.5;
      return { d, sd, a, hw, kind, len, what, s, i, y: T.hy[i], cx: T.px[i], cz: T.pz[i], ux, uz, vx: -uz, vz: ux, tx, tz, nx, nz, r0: w / sn, rF: (w + JOFF) / sn, rEnd: (w + JOFF) / sn + len, qa, qb };
    });
  }
  function scJunctions(C) {
    const { T, w, root, scen, out, near, aMat, lMat, exclPush } = C, legs = C.legs || [], wh = [0.94, 0.94, 0.9], walk = [0.84, 0.83, 0.8], curbC = [0.62, 0.61, 0.58];
    const gr = new K.Chunks(192, true), gm = new GB(), gs = new K.Chunks(192, true);
    const prop = (kind, x, z, yaw, col) => { const q = near(x, z); if (q.d > -0.7 || Math.abs(q.lat) < w + 0.7) return false; out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0, i: q.i }); C.nJ = (C.nJ || 0) + 1; return true; };
    for (const L of legs) {
      const P = (r, v) => [L.cx + L.ux * r + L.vx * v, L.cz + L.uz * r + L.vz * v], Y = (r, v) => { const p = P(r, v); return r < L.rF + 0.6 ? L.y : scGround(p[0], p[1]); }, Q = (r, v, y) => { const p = P(r, v); return [p[0], Y(r, v) + y, p[1]]; };
      const yaw = (x, z) => Math.atan2(z, x), yV = yaw(L.vx, L.vz);
      for (let r = L.r0 - 0.3; r < L.rF + 0.6; r += 3) { const r1 = Math.min(L.rF + 0.6, r + 3), g = gr.get(...P(r, 0)), A = Q(r, -L.hw, 0.024), B = Q(r, L.hw, 0.024), Cq = Q(r1, L.hw, 0.024), Dq = Q(r1, -L.hw, 0.024), uv = (p) => [p[0] / 8, -p[2] / 8], c = [0.8, 0.8, 0.82];
        g.quadUp(A, B, Cq, Dq, [c, c, c, c], [uv(A), uv(B), uv(Cq), uv(Dq)]); }
      for (let r = L.rF + 0.6; r < L.rEnd; r += 4) { const r1 = Math.min(L.rEnd, r + 4), g = gr.get(...P(r, 0));
        const A = Q(r, -L.hw, 0.04), B = Q(r, L.hw, 0.04), Cq = Q(r1, L.hw, 0.04), Dq = Q(r1, -L.hw, 0.04), uv = (p) => [p[0] / 8, -p[2] / 8], c = [0.86, 0.86, 0.88];
        g.quadUp(A, B, Cq, Dq, [c, c, c, c], [uv(A), uv(B), uv(Cq), uv(Dq)]);
        for (const sg of [-1, 1]) { const a0 = Q(r, sg * L.hw, 0.16), a1 = Q(r, sg * (L.hw + 2.2), 0.16), b1 = Q(r1, sg * (L.hw + 2.2), 0.16), b0 = Q(r1, sg * L.hw, 0.16), gg = gs.get(a0[0], a0[2]);
          gg.quadUp(a0, a1, b1, b0, [walk, walk, walk, walk], [[a0[0] / 1.5, -a0[2] / 1.5], [a1[0] / 1.5, -a1[2] / 1.5], [b1[0] / 1.5, -b1[2] / 1.5], [b0[0] / 1.5, -b0[2] / 1.5]]);
          gg.quadO(Q(r, sg * L.hw, 0.02), Q(r1, sg * L.hw, 0.02), Q(r1, sg * L.hw, 0.16), Q(r, sg * L.hw, 0.16), curbC, Q(r, sg * (L.hw + 1), 0)); }
      }
      { const r = L.rF + 2.5, g = scen.get(...P(r, 0)); for (const v of [-L.hw * 0.5, L.hw * 0.5]) { const [x, z] = P(r, v); box(g, x, Y(r, v), z, 0.08, 1.0, 0.08, yV, [0.4, 0.4, 0.42]); }
        for (let k = 0; k < 2; k++) { const [x, z] = P(r, 0), y = Y(r, 0) + 0.55 + k * 0.32; box(g, x, y, z, L.hw * 1.4, 0.22, 0.05, yV, k ? [0.95, 0.95, 0.94] : [0.96, 0.45, 0.08]); } }
      const sn = Math.sin(L.a);
      for (let q = L.qa - 3; q <= L.qb + 3; q += 0.5) {   // the paved corners in the mouth (sidewalks along the leg's edges)
        const s = L.s + q, i = T.idx(s), bar = L.sd > 0 ? T.br[i] : T.bl[i]; if (bar < w + 3) continue;
        for (let l = w + 0.6; l < bar - 0.3; l += 0.5) {
          const l1 = Math.min(bar - 0.3, l + 0.5), cs = [[q, l], [q + 0.5, l], [q + 0.5, l1], [q, l1]].map(([qq, ll]) => { const p = C.atSf(L.s + qq, L.sd * ll); return [p[0], L.y + 0.07, p[1]]; });
          const mx = (cs[0][0] + cs[2][0]) / 2, mz = (cs[0][2] + cs[2][2]) / 2, dx = mx - L.cx, dz = mz - L.cz, v = dx * L.vx + dz * L.vz, r = dx * L.ux + dz * L.uz;
          if (r < L.r0 - 0.5 || Math.abs(v) < L.hw + 0.2 || Math.abs(v) > L.hw + 2.6) continue;
          gs.get(mx, mz).quadUp(cs[0], cs[1], cs[2], cs[3], [walk, walk, walk, walk], cs.map(p => [p[0] / 1.5, -p[2] / 1.5]));
        }
      }
      // markings: the zebra crossing over the leg, the stop line (a broken one on the stop roads), the pedestrian crossing over the circuit at the lights
      const z0 = L.r0 + 2.4, z1 = L.r0 + 5.4, yM = 0.045;
      if (z1 < L.rF - 1) { for (let v = -L.hw + 0.4; v < L.hw - 0.3; v += 1.0) gm.quadUp(Q(z0, v, yM), Q(z0, v + 0.5, yM), Q(z1, v + 0.5, yM), Q(z1, v, yM), [wh, wh, wh, wh]);
        gm.quadUp(Q(z1 + 1.0, 0, yM), Q(z1 + 1.0, L.hw - 0.2, yM), Q(z1 + 1.4, L.hw - 0.2, yM), Q(z1 + 1.4, 0, yM), [wh, wh, wh, wh]);
        if (L.kind === 'stop') { const [x, z] = P(z1 + 3.2, L.hw * 0.5), g = gm; for (const [a, b] of [[-0.9, 0.9]]) g.quadUp(Q(z1 + 2.6, L.hw * 0.5 + a, yM), Q(z1 + 2.6, L.hw * 0.5 + b, yM), Q(z1 + 3.8, L.hw * 0.5 + b, yM), Q(z1 + 3.8, L.hw * 0.5 + a, yM), [wh, wh, wh, wh]); } }
      if (L.kind === 'sig') { const qc = -(L.hw / sn + 2.6), gw = [0.8, 0.8, 0.78]; for (let l = -w + 0.6; l < w - 0.4; l += 1.1) { const a = C.atSf(L.s + qc - 1.5, l), b = C.atSf(L.s + qc - 1.5, l + 0.55), c = C.atSf(L.s + qc + 1.5, l + 0.55), d = C.atSf(L.s + qc + 1.5, l);
        gm.quadUp([a[0], L.y + 0.04, a[1]], [b[0], L.y + 0.04, b[1]], [c[0], L.y + 0.04, c[1]], [d[0], L.y + 0.04, d[1]], [gw, gw, gw, gw]); } }
      if (L.what === 'avenue' || L.what === 'street') { const [bx, bz] = P(L.rF + 7, -(L.hw + 1.4)), g = scen.get(bx, bz), y = scGround(bx, bz) + 0.16, yU = yaw(L.ux, L.uz);   // a bus shelter beyond the fence
        box(g, bx, y + 2.4, bz, 3.8, 0.12, 1.7, yU, [0.18, 0.42, 0.3], [0.24, 0.5, 0.36]); for (const e of [-1.7, 1.7]) box(g, bx + L.ux * e, y, bz + L.uz * e, 0.1, 2.4, 1.4, yU, [0.6, 0.7, 0.78]);
        box(g, bx - L.vx * 0.7, y, bz - L.vz * 0.7, 3.5, 2.4, 0.06, yU, [0.55, 0.68, 0.76]); box(g, bx - L.vx * 0.35, y + 0.45, bz - L.vz * 0.35, 2.8, 0.08, 0.4, yU, [0.4, 0.42, 0.45]); }
      exclPush(...P(L.rF * 0.6, 0), Math.max(8, L.rF * 0.6));
    }
    for (const [d, sd, kind, l, face, col, j] of C.def.furniture || []) {   // (def.furniture: on the corners of each mouth, facing its way)
      const L = legs[j], s = C.sAt(d), i = T.idx(s), [x, z] = C.atSf(s, sd * l), tx = T.tx[i], tz = T.tz[i];
      const yaw = face === 'N' ? Math.atan2(-T.nz[i] * sd, -T.nx[i] * sd) : face === 'F' ? Math.atan2(tz, tx) : face === 'B' ? Math.atan2(-tz, -tx) : Math.atan2(L.uz, L.ux);
      prop(kind, x, z, yaw, col);
    }
    gr.addTo(root, aMat, false, true); gs.addTo(root, new THREE.MeshLambertMaterial({ map: C.tex.paving, vertexColors: true }), false, true);
    if (!gm.empty) { const m = new THREE.Mesh(gm.geometry(), lMat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
  }

  /* ---- the city's street furniture where OSM has it (static, away from the circuit): traffic lights at the avenues' junctions (a grey
     pole, the black heads with their yellow-edged back plates facing both ways along the street), bus stops (a green-roofed shelter of
     glass on a steel frame), benches, hydrants (the city's red and yellow) ---- */
  function scStreet(C) {
    const { D, near } = C, segs = [];
    for (const [cls, hw, lv, pts] of D.roads) if (RCLS[cls] && !lv) for (let k = 0; k + 1 < pts.length; k++) segs.push([pts[k], pts[k + 1], hw]);
    const along = (x, z) => { let best = null, bd = 30; for (const [a, b, hw] of segs) { const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz || 1, t = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / l2, 0, 1), d = Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); if (d < bd) { bd = d; best = { a: Math.atan2(vz, vx), d, hw }; } } return best; };
    const blk = [0.08, 0.08, 0.09], yel = [0.95, 0.78, 0.1], gr = [0.46, 0.48, 0.5];
    let nS = 0;
    for (const [x, z] of (D.fur.traffic_signals || [])) { const q = near(x, z); if (q.d < 3) continue;
      const A = along(x, z), a = A ? A.a : 0, y = scGround(x, z), g = C.scen.get(x, z), c = Math.cos(a + Math.PI / 2), s = Math.sin(a + Math.PI / 2);
      for (const sd of [-1, 1]) { const px = x + c * sd * ((A ? A.hw : 3) + 0.9), pz = z + s * sd * ((A ? A.hw : 3) + 0.9);
        cyl(g, px, y, pz, 0.09, 3.6, 6, gr, gr); box(g, px, y + 2.3, pz, 0.36, 1.05, 0.3, a, blk, blk); box(g, px, y + 2.25, pz, 0.6, 1.2, 0.04, a, yel, yel);
        for (let k = 0; k < 3; k++) box(g, px + Math.cos(a) * 0.16, y + 3.06 - k * 0.34, pz + Math.sin(a) * 0.16, 0.03, 0.22, 0.22, a, k === 0 ? [0.9, 0.15, 0.1] : k === 1 ? [0.35, 0.28, 0.06] : [0.1, 0.3, 0.14]);
        cyl(g, px + Math.cos(a + Math.PI / 2) * 0.22, y + 2.1, pz + Math.sin(a + Math.PI / 2) * 0.22, 0.12, 0.45, 6, blk, blk); }   // (the pedestrians' head)
      nS++; }
    for (const [x, z] of (D.fur.bus_stop || [])) { if (near(x, z).d < 3 || C.excluded(x, z)) continue;
      const A = along(x, z); if (!A) continue; const a = A.a, y = scGround(x, z) + 0.12, g = C.scen.get(x, z), ox = Math.cos(a + Math.PI / 2), oz = Math.sin(a + Math.PI / 2), sgn = ((x - 0) * ox + (z - 0) * oz) >= 0 ? 1 : 1;
      box(g, x, y + 2.5, z, 4.6, 0.12, 1.8, a, [0.18, 0.42, 0.3], [0.24, 0.5, 0.36]); box(g, x + ox * 0.8 * sgn, y, z + oz * 0.8 * sgn, 4.4, 2.5, 0.06, a, [0.55, 0.66, 0.72]);
      for (const e of [-2.2, 2.2]) box(g, x + Math.cos(a) * e, y, z + Math.sin(a) * e, 0.1, 2.5, 1.6, a, [0.42, 0.44, 0.46]);
      box(g, x + ox * 0.45 * sgn, y + 0.45, z + oz * 0.45 * sgn, 3.4, 0.08, 0.4, a, [0.4, 0.42, 0.45]);
      cyl(g, x - Math.cos(a) * 2.8, y, z - Math.sin(a) * 2.8, 0.05, 2.6, 5, gr); box(g, x - Math.cos(a) * 2.8, y + 2.1, z - Math.sin(a) * 2.8, 0.06, 0.5, 0.5, a, [0.14, 0.44, 0.3]); }
    for (const [x, z] of (D.fur.bench || [])) { if (near(x, z).d < 2) continue; const g = C.scen.get(x, z), y = scGround(x, z), a = hash(Math.round(x), Math.round(z)) * TAU;
      box(g, x, y + 0.42, z, 1.8, 0.07, 0.48, a, [0.5, 0.34, 0.2]); box(g, x, y, z, 1.6, 0.42, 0.06, a, [0.22, 0.24, 0.24]); }
    for (const [x, z] of (D.fur.fire_hydrant || [])) { if (near(x, z).d < 2) continue; const g = C.scen.get(x, z), y = scGround(x, z);
      cyl(g, x, y, z, 0.17, 0.62, 6, [0.82, 0.12, 0.08], [0.95, 0.78, 0.1]); }
    C.out.signalsOSM = nS;
  }

  /* ---- trees: OpenStreetMap's own (the park's single trees, the rows along the avenues, the woods) and the land cover's tree cells: plane
     trees (big round crowns), poplars (tall and narrow), Canary palms, eucalyptus (tall, grey-green, open), stone pines (umbrellas);
     instanced per 256 m chunk, kept off the circuit's corridor, the buildings and the streets ---- */
  function scTreeGeo(kind) {
    const g = new GB(), R = rng(700 + kind), bk = [0.38, 0.32, 0.26];
    if (kind === 0) { cyl(g, 0, 0, 0, 0.025, 0.4, 4, [0.62, 0.58, 0.5], null, 0.018); K.puff(g, 0, 0.64, 0, 0.38, 0.8, [0.36, 0.5, 0.24], R, 0.26, 0.55, 1.12); }   // plane tree: a pale trunk, a big rounded crown
    else if (kind === 1) { cyl(g, 0, 0, 0, 0.03, 0.22, 4, bk, null, 0.022); ico(g, 0, 0.58, 0, 0.12, 3.6, [0.34, 0.5, 0.22], R, 0.16); }   // poplar
    else if (kind === 2) {   // Canary palm: a stout trunk, a ball of arching fronds
      cyl(g, 0, 0, 0, 0.07, 0.74, 4, [0.52, 0.42, 0.3], null, 0.06);
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.3, c = Math.cos(a), s = Math.sin(a), tip = [c * 0.34, 0.66, s * 0.34], mid = [c * 0.18, 0.86, s * 0.18], b0 = [-s * 0.035, 0.76, c * 0.035], b1 = [s * 0.035, 0.76, -c * 0.035], col = [0.26, 0.44, 0.2];
        g.quadO(b0, [mid[0] - s * 0.07, mid[1], mid[2] + c * 0.07], tip, [mid[0] + s * 0.07, mid[1], mid[2] - c * 0.07], col, [0, 0.3, 0]); g.quadO(b1, [mid[0] + s * 0.07, mid[1], mid[2] - c * 0.07], tip, [mid[0] - s * 0.07, mid[1], mid[2] + c * 0.07], col, [0, 1.6, 0]); } }
    else if (kind === 3) { cyl(g, 0, 0, 0, 0.022, 0.55, 4, [0.7, 0.66, 0.58], null, 0.014); K.puff(g, 0.03, 0.7, 0, 0.22, 1.2, [0.42, 0.5, 0.36], R, 0.35, 0.6, 1.1); }   // eucalyptus
    else { cyl(g, 0, 0, 0, 0.03, 0.62, 4, [0.46, 0.34, 0.26], null, 0.022); K.puff(g, 0, 0.72, 0, 0.42, 0.32, [0.24, 0.38, 0.2], R, 0.18, 0.55, 1.1); }   // stone pine
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function scTrees(C) {
    const { D, root, near } = C, G = SG, R = rng(1873), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const IC = [0, 1, 2].map(k => new K.IChunks(scTreeGeo(k), mat, 512)), roadM = C.roadMask;
    const H = [[11, 7], [20, 8], [8, 4], [22, 9], [12, 4]];   // (heights: base, spread)
    let n = 0;
    const plant = (x, z, sp, force) => {
      const q = near(x, z); if (q.d < 2.5 || Math.abs(q.lat) < q.bar + 2.5) return;
      if (C.excluded(x, z) || (!force && roadM && roadM(x, z))) return;
      if (scKind(x, z) === 3) return;
      const h = H[sp][0] + R() * H[sp][1], tone = 0.85 + 0.3 * R(), col = [tone * (0.95 + 0.1 * R()), tone, tone * (0.9 + 0.1 * R())];
      if (sp === 3) { col[0] *= 1.12; col[2] *= 1.18; }   // (eucalyptus: grey-green)
      if (sp === 4) { col[0] *= 0.8; col[1] *= 0.85; col[2] *= 0.85; }   // (stone pines: dark)
      const m = sp === 3 || sp === 4 ? 0 : sp, wsc = sp === 1 ? h * 0.8 : sp === 2 ? h * 1.1 : sp === 3 ? h * 0.62 : sp === 4 ? h * 1.25 : h, hsc = sp === 4 ? h * 0.75 : h;
      IC[m].add(x, scGround(x, z) - 0.1, z, R() * TAU, wsc, hsc, col); n++;
    };
    const pick = (x, z) => { const u = hash(Math.round(x * 3), Math.round(z * 3)); return u < 0.5 ? 0 : u < 0.62 ? 1 : u < 0.72 ? 2 : u < 0.88 ? 3 : 4; };
    const tr = new Int16Array(b64(D.trees).buffer);
    for (let k = 0; k + 1 < tr.length; k += 2) plant(tr[k], tr[k + 1], pick(tr[k], tr[k + 1]), true);
    for (const row of D.treeRows) { const sp = hash(Math.round(row[0][0]), Math.round(row[0][1])) < 0.6 ? 1 : 0;   // (the rows: poplars or plane trees along the avenues)
      for (let k = 0; k + 1 < row.length; k++) { const [ax, az] = row[k], [bx, bz] = row[k + 1], l = Math.hypot(bx - ax, bz - az); for (let t = 0; t < l; t += sp === 1 ? 6 : 9) plant(ax + (bx - ax) * t / l, az + (bz - az) * t / l, sp, true); } }
    for (let j = 1; j < G.nz - 1; j += 2) for (let i = 1; i < G.nx - 1; i += 2) {   // the land cover: the tree cells dense, the lawns and yards here and there
      const k = j * G.nx + i, kd = G.kind[k]; if (G.wet[k] || kd === 7 || kd === 8 || kd === 9) continue;
      const p = kd === 1 ? 0.3 : kd === 0 ? 0.03 : kd === 6 ? 0.08 : kd === 10 ? 0.025 : kd === 2 ? 0.01 : 0.02; if (R() > p) continue;
      const x = G.x0 + i * G.c + (R() - 0.5) * 7, z = G.z0 + j * G.c + (R() - 0.5) * 7; plant(x, z, pick(x, z), false);
    }
    for (const ic of IC) ic.addTo(root, true);
    C.out.treeN = n;
  }

  /* ---- beyond the near city: the basin (its suburbs grey, the parks and the orchards green, the dry hills ochre), the hills round it and the
     Andes to the east with their snow (Copernicus DEM; ESA WorldCover's classes), on a ring of 240 directions round the circuit from 750 m
     out to 55 km; the city's towers (OSM heights) and the taller blocks beyond ~650 m as boxes. The vertex shader draws it all on a shell
     just inside the camera's far plane, each vertex along its own direction, hazed by the fog's colour (no work on the CPU per frame) ---- */
  function scFar(C) {
    const { D, T } = C, F = D.far, h8 = b64(F.b64), lc8 = b64(F.lc), P0 = [], Cl = [], I = [];
    const lcAt = (i, j) => { const q = j * F.nx + i, b = lc8[q >> 1]; return q & 1 ? b & 15 : b >> 4; };
    const Hc = (i, j) => h8[clamp(j, 0, F.nz - 1) * F.nx + clamp(i, 0, F.nx - 1)] * F.step + F.lo;
    const Hb = (x, z) => { const gx = clamp((x - F.x0) / F.cell, 0, F.nx - 1.001), gz = clamp((z - F.z0) / F.cell, 0, F.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
      return (Hc(i, j) * (1 - u) + Hc(i + 1, j) * u) * (1 - v) + (Hc(i, j + 1) * (1 - u) + Hc(i + 1, j + 1) * u) * v; };
    let cx = 0, cz = 0; for (let i = 0; i < T.N; i++) { cx += T.px[i]; cz += T.pz[i]; } cx /= T.N; cz /= T.N;
    const NA = 240, RS = [750, 950, 1200, 1500, 1900, 2400, 3000, 3800, 4800, 6000, 7500, 9500, 12000, 15000, 19000, 24000, 30000, 38000, 47000, 56000];
    const LCC = [[0.5, 0.52, 0.38], [0.3, 0.38, 0.24], [0.48, 0.48, 0.46], [0.36, 0.42, 0.46], [0.56, 0.5, 0.42], [0.46, 0.46, 0.34], [0.95, 0.96, 0.98]];   // open, trees, built, water, bare, scrub, snow
    for (let r = 0; r < RS.length; r++) for (let a = 0; a < NA; a++) {
      const th = a / NA * TAU, x = cx + Math.cos(th) * RS[r], z = cz + Math.sin(th) * RS[r];
      let h = Hb(x, z); const step = RS[r] * TAU / NA; if (step > F.cell) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) h = Math.max(h, Hb(x + dx * step * 0.4, z + dz * step * 0.4));   // (the peaks kept between the samples)
      const i = Math.round((x - F.x0) / F.cell), j = Math.round((z - F.z0) / F.cell), lc = i >= 0 && j >= 0 && i < F.nx && j < F.nz ? lcAt(i, j) : 4, abs = h + D.h0;
      let col = LCC[lc].slice(); const q = hash(a, r) - 0.5; col = col.map(v => v * (1 + q * 0.1));
      if (abs > 2600) { const t = sstep(2600, 3600, abs) * 0.55; col = col.map((v, k) => lerp(v, [0.6, 0.55, 0.5][k], t)); }   // (bare rock high up)
      const snow = sstep(3500, 4300, abs + 300 * Math.sin(a * 0.9 + r) + (lc === 6 ? 1500 : 0)); col = col.map(v => lerp(v, 0.96, snow));
      P0.push(x, Math.max(-20, h * 0.92), z); Cl.push(...col);
    }
    for (let r = 0; r + 1 < RS.length; r++) for (let a = 0; a < NA; a++) { const p = r * NA + a, q = r * NA + (a + 1) % NA, p2 = p + NA, q2 = q + NA; I.push(p, p2, q, q, p2, q2); }
    const vq = (p, col) => { P0.push(p[0], p[1], p[2]); Cl.push(col[0], col[1], col[2]); return P0.length / 3 - 1; };
    const quad = (a, b, c, d, col) => { const k = [a, b, c, d].map(p => vq(p, col)); I.push(k[0], k[1], k[2], k[0], k[2], k[3]); };
    const tower = (x, z, Lx, Wz, ang, h) => { const y0 = Hb(x, z) - 2, y1 = y0 + h, c = Math.cos(ang), s = Math.sin(ang), hv = hash(Math.round(x), Math.round(z)), wc = h > 60 ? (hv < 0.5 ? [0.46, 0.56, 0.64] : [0.66, 0.68, 0.7]) : [0.8, 0.78, 0.74].map(v => v * (0.9 + 0.15 * hv));
      const P = (u, v, y) => [x + u * c - v * s, y, z + u * s + v * c], cs = [[-Lx / 2, -Wz / 2], [Lx / 2, -Wz / 2], [Lx / 2, Wz / 2], [-Lx / 2, Wz / 2]];
      for (let k = 0; k < 4; k++) { const [u0, v0] = cs[k], [u1, v1] = cs[(k + 1) % 4], sh = 0.82 + 0.18 * Math.abs(Math.cos(ang + k * Math.PI / 2 + 0.6)); quad(P(u0, v0, y0), P(u1, v1, y0), P(u1, v1, y1), P(u0, v0, y1), wc.map(v => v * sh)); }
      quad(P(-Lx / 2, -Wz / 2, y1), P(-Lx / 2, Wz / 2, y1), P(Lx / 2, Wz / 2, y1), P(Lx / 2, -Wz / 2, y1), [0.5, 0.5, 0.5]); };
    for (const [x, z, Lx, Wz, ang, h] of D.towers) tower(x, z, Math.max(8, Lx), Math.max(8, Wz), ang * Math.PI / 180, h);
    for (const [x, z, Lx, Wz, ang, h] of C.farBoxes || []) tower(x, z, Lx, Wz, ang, h);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(Cl), 3)); g.setIndex(I); g.computeVertexNormals();
    const U = { uHz: { value: new THREE.Color(0xd6dbe0) }, uFar: { value: 700 }, uCam: { value: new THREE.Vector3() } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz; sh.uniforms.uFar = U.uFar; sh.uniforms.uCam = U.uCam;   // (uCam: three.js sets cameraPosition only for some materials, not for Lambert)
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uFar;\nuniform vec3 uCam;\nvarying float vHz;').replace('#include <begin_vertex>', ['#include <begin_vertex>',
        'vec3 fD = transformed - uCam; float fL = max( 1.0, length( fD ) ), fR0 = uFar - 60.0, fR1 = uFar - 5.0;',
        'float fR = fR0 + ( fR1 - fR0 ) * ( 1.0 - exp( -max( 0.0, fL - 300.0 ) / 2500.0 ) );',
        'transformed = uCam + fD * ( fR / fL );',
        'vHz = 0.06 + 0.36 * ( 1.0 - exp( -max( 0.0, fL - 600.0 ) / 26000.0 ) );'].join('\n'));
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
    m.customProgramCacheKey = () => 'scFar'; m.userData.noCloud = true;   // (no cloud shadows on the far view)
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'scFar'; mesh.castShadow = false; mesh.receiveShadow = false;
    mesh.onBeforeRender = (r, sc, cam) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); if (cam) { U.uFar.value = cam.far; U.uCam.value.setFromMatrixPosition(cam.matrixWorld); } };
    C.root.add(mesh); C.out.farVerts = P0.length / 3;
    return (cam) => { if (!cam) return; cam.getWorldDirection(_fd); const top = Math.asin(clamp(_fd.y, -1, 1)) + (cam.fov || 50) * Math.PI / 360 * 1.15; mesh.visible = top > -0.02; };   // (the horizon out of the picture: the steep cameras of the race, nothing to draw)
  }

  const _fd = new THREE.Vector3();
  World.theme('santiago', buildSantiago);
})();
