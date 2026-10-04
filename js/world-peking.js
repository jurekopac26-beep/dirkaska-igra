/* =========================================================================
   WORLD — Peking (theme 'peking'): the street circuit round the Olympic Green's big stadium. Its own builder (World.theme), in a file of its
   own: it uses World's shared helpers (World.kit) and the scenery data of js/data/peking.js (OpenStreetMap, ESA WorldCover, SRTM).
   What it builds: the park's ground (granite plazas, lawns, groves; the long lake east of the stadium and the ponds, behind stone
   embankments, their bridges), the circuit (asphalt, white edge lines, kerbs at the chicanes, concrete walls with catch fences, tyre walls at
   the slow corners) and the rest of the broad boulevards beyond its walls (their outer lanes and markings, granite kerbs, sidewalks, rows of
   trees), the pit lane on the right of the start straight with the teams' temporary garages, the grandstands and the fans, the venues
   plain and generic (no names, no logos, no symbols: the stadium in its lattice of steel beams, the swimming hall's bubble walls, the indoor
   arena's wave roof, the tower with its wide trapezoid top), the buildings round the park in their OSM outlines and heights, the junctions
   where the park's roads meet the circuit (closed by barriers for the race, their signals on poles with long arms over the road, round
   signs, guard railings, hydrants, bins, lamps, cabinets, bollards and bus shelters, all of it knockable: World props, Core's loose props),
   the roads and parked cars round it, and beyond the near park the towers of the city and the hills to the west and north in the haze.
   Only place names; no names of the circuit, events, venues, people, firms or brands.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.theme) return;
  const { clamp, lerp, sstep, rng } = Core, TAU = Math.PI * 2;
  const { GB, box, cyl, cone, ico } = World, K = World.kit;
  const WL = -1.6;   // the lakes' water level below the plazas (stone embankments)

  // ---- decode helpers ----
  const b64 = (s) => { const b = atob(s), a = new Uint8Array(b.length); for (let k = 0; k < b.length; k++) a[k] = b.charCodeAt(k); return a; };
  const hash = (a, b) => { let h = Math.imul((a * 73856093) ^ (b * 19349663), 0x9e3779b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca77); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
  const centroid = (r) => { let x = 0, z = 0; for (const p of r) { x += p[0]; z += p[1]; } return [x / r.length, z / r.length]; };
  const areaOf = (r) => Math.abs(r.reduce((a, p, k) => { const q = r[(k + 1) % r.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

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

  /* ---- the park's ground: a 10 m grid over the near region (the track's box and 650 m round it): water (OSM polygons), the distance to the
     water and to the circuit, the height (the plazas level with the road, the lakes' beds under their water behind the embankments), the
     land's own kind (ESA WorldCover; OSM land use over it: lawns, pitches, car parks, plazas) ---- */
  let PG = null;
  function pkPrep(T, D) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < T.N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    const c = 10, M0 = 650, G = { c, x0: Math.floor((x0 - M0) / 160) * 160, z0: Math.floor((z0 - M0) / 160) * 160 };
    G.nx = Math.ceil((x1 + M0 - G.x0) / 160) * 16 + 1; G.nz = Math.ceil((z1 + M0 - G.z0) / 160) * 16 + 1;
    const n = G.nx * G.nz, wet = new Uint8Array(n), kind = new Uint8Array(n);   // kind: 0 lawn, 1 grove, 2 paving (built-up), 3 water, 4 bare, 5 car park, 6 garden, 7 pitch, 8 plaza
    for (const [, rings] of D.water) rasterPoly(wet, G, rings, 1);
    const LC = D.lc, lcA = new Uint8Array(LC.nx * LC.nz); { const r = b64(LC.rle); let p = 0; for (const v of r) { lcA.fill(v >> 5, p, p + (v & 31)); p += v & 31; } }
    const LCK = [2, 1, 0, 2, 2, 4];   // (WorldCover -> kind: other: paving, trees: grove, grass: lawn, built-up: paving, water: paving (OSM decides the water), bare)
    for (let j = 0; j < G.nz; j++) for (let i = 0; i < G.nx; i++) { const x = G.x0 + i * c, z = G.z0 + j * c, a = Math.floor((x - LC.x0) / LC.cell), b = Math.floor((z - LC.z0) / LC.cell);
      kind[j * G.nx + i] = a >= 0 && b >= 0 && a < LC.nx && b < LC.nz ? LCK[lcA[b * LC.nx + a]] : 2; }
    const LU = { grass: 0, park: 0, meadow: 0, recreation_ground: 0, garden: 6, pitch: 7, track: 7, parking: 5, pedestrian: 8, plaza: 8 };
    for (const [cl, ring] of D.lu) if (LU[cl] != null) rasterPoly(kind, G, [ring], LU[cl]);
    for (const [, ring] of D.woods) rasterPoly(kind, G, [ring], 1);
    const sdW = chamfer(G, (k) => wet[k] === 1), sdL = chamfer(G, (k) => wet[k] === 0);
    const seedT = new Uint8Array(n); for (let i = 0; i < T.N; i++) { const a = Math.round((T.px[i] - G.x0) / c), b = Math.round((T.pz[i] - G.z0) / c); if (a >= 0 && b >= 0 && a < G.nx && b < G.nz) seedT[b * G.nx + a] = 1; }
    const dT = chamfer(G, (k) => seedT[k] === 1);
    for (let k = 0; k < n; k++) if (dT[k] < 22 && !wet[k] && kind[k] !== 7) kind[k] = 8;   // (beside the circuit: the plazas and sidewalks of granite)
    const H = new Float32Array(n), SD = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const sd = wet[k] ? -sdL[k] : sdW[k]; SD[k] = sd;
      H[k] = sd > 0 ? -0.06 : WL - 0.9 + Math.max(-1.2, sd * 0.25);   // (the plazas level; behind the embankment the bed under the water)
    }
    PG = Object.assign(G, { wet, kind, H, SD, dT, x1: G.x0 + (G.nx - 1) * c, z1: G.z0 + (G.nz - 1) * c });
    return PG;
  }
  function gAt(A, x, z) {   // bilinear lookup in a grid array of PG
    const G = PG, gx = clamp((x - G.x0) / G.c, 0, G.nx - 1.001), gz = clamp((z - G.z0) / G.c, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, k = j * G.nx + i;
    return (A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + G.nx] * (1 - u) + A[k + G.nx + 1] * u) * v;
  }
  function pkGround(x, z) {   // the ground mesh's surface (the same two triangles per cell)
    const G = PG; if (!G) return -0.06;
    if (x < G.x0 || z < G.z0 || x > G.x1 || z > G.z1) return -0.3;
    const gx = (x - G.x0) / G.c, gz = (z - G.z0) / G.c, i = Math.min(G.nx - 2, Math.floor(gx)), j = Math.min(G.nz - 2, Math.floor(gz)), u = gx - i, v = gz - j, A = G.H, k = j * G.nx + i;
    return u + v <= 1 ? A[k] + u * (A[k + 1] - A[k]) + v * (A[k + G.nx] - A[k]) : A[k + G.nx + 1] + (1 - u) * (A[k + G.nx] - A[k + G.nx + 1]) + (1 - v) * (A[k + 1] - A[k + G.nx + 1]);
  }
  const pkKind = (x, z) => { const G = PG, i = Math.round((x - G.x0) / G.c), j = Math.round((z - G.z0) / G.c); return i < 0 || j < 0 || i >= G.nx || j >= G.nz ? 2 : G.wet[j * G.nx + i] ? 3 : G.kind[j * G.nx + i]; };
  const isWet = (x, z) => pkKind(x, z) === 3;

  function buildPeking(scene, tex, opts) {
    const T = K.track(), D = PEK_DATA, def = T.def, N = T.N, w = T.w, ds = T.ds, L = T.len, sStart = T.startS, R = rng(3440);
    const root = new THREE.Group(); scene.add(root);
    pkPrep(T, D);
    const ice = opts && opts.season === 'winter';   // (in winter the lakes freeze over: built again when the season changes, out.paintFor)
    const out = { root, dyn: {}, groundH: pkGround, camFloor: (x, z) => Math.max(pkGround(x, z), WL), props: [], farClip: true, ownTex: [], dust: [0.7, 0.68, 0.62], season: ice ? 'ice' : 'water', paintFor: (s) => (s === 'winter' ? 'ice' : 'water') };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    out.bounds = { minX: PG.x0, maxX: PG.x1, minZ: PG.z0, maxZ: PG.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; }, sAt = (d) => (((sStart + d) % L) + L) % L;
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, y, T.pz[i] + T.nz[i] * o];
    const atSf = K.atSf;
    const addM = (g, mat, cast, recv) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = recv !== false; m.castShadow = !!cast; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); return m; };
    const scen = new K.Chunks(400);   // vertex coloured scenery in 400 m chunks
    // tree / building exclusion (hashed circles)
    const eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };
    const ctx = { T, D, def, N, w, ds, L, sStart, R, root, out, tex, opts, ownTex, matV, dS, sAt, Pt, atSf, addM, scen, exclPush, excluded, trees: [], ice };
    ctx.near = pkNear(T);
    ctx.street = pkStreetW(T, def);
    const tag = (f, nm) => { const n0 = root.children.length; f(); for (let k = n0; k < root.children.length; k++) if (!root.children[k].name) root.children[k].name = nm; };   // (each part's meshes named after it)
    pkLegs(ctx);
    tag(() => pkGroundMesh(ctx), 'pkGround');
    tag(() => pkWater(ctx), 'pkWater');
    tag(() => pkRoad(ctx), 'pkRoad');
    tag(() => pkWalls(ctx), 'pkWalls');
    tag(() => pkStreet(ctx), 'pkStreet');
    tag(() => pkPits(ctx), 'pkPits');
    tag(() => pkStands(ctx), 'pkStands');
    tag(() => pkVenues(ctx), 'pkVenues');
    tag(() => pkBuildings(ctx), 'pkBuildings');
    tag(() => pkRoads(ctx), 'pkRoads');
    tag(() => pkJunctions(ctx), 'pkJunctions');
    tag(() => pkTrees(ctx), 'pkTrees');
    const far = pkFar(ctx);
    out.dyn.step = (t, car, cam) => { far(cam); };
    tag(() => scen.addTo(root, matV, true, true), 'pkScen');
    K.crowdFinish(ctx.CR, root, out);
    out.junctionProps = ctx.nJ || 0; out.pg = PG;
    return out;
  }

  /* ---- the nearest road sample to (x, z) through a 32 m hash of the samples; its lateral offset and the barrier on that side ---- */
  function pkNear(T) {
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
  /* ---- the boulevard's reach each side per sample (def.street keyframes, metres after the start line: [d, left, right]) ---- */
  function pkStreetW(T, def) {
    const S = def.street || [], N = T.N, Lw = new Float32Array(N), Rw = new Float32Array(N), L = T.len;
    for (let i = 0; i < N; i++) {
      let d = i * T.ds - T.startS; d = ((d % L) + L) % L;
      let k = 0; while (k + 1 < S.length && S[k + 1][0] <= d) k++;
      const a = S[k], b = S[(k + 1) % S.length], span = ((b[0] - a[0]) % L + L) % L || 1, f = clamp((d - a[0]) / span, 0, 1);
      Lw[i] = lerp(a[1], b[1], f); Rw[i] = lerp(a[2], b[2], f);
    }
    return { L: Lw, R: Rw };
  }

  /* ---- the ground mesh: 640 m chunks of the 10 m grid (cells deep under the water left out), one grass material, the land's kind in its
     vertex colours (lawns, groves, the granite plazas pale), the car parks and plazas on top as their own OSM outlines (crisp edges) ---- */
  const KCOL = [[0.72, 0.68, 0.46], [0.58, 0.58, 0.4], [0.8, 0.79, 0.75], [0.6, 0.62, 0.55], [0.74, 0.7, 0.6], [0.6, 0.6, 0.6], [0.68, 0.68, 0.46], [0.6, 0.66, 0.42], [0.84, 0.83, 0.79]];
  function pkGroundMesh(C) {
    const G = PG, mat = new THREE.MeshLambertMaterial({ map: C.tex.grass, vertexColors: true }), matP = new THREE.MeshLambertMaterial({ map: C.tex.paving, vertexColors: true }), grp = new THREE.Group(); C.root.add(grp); C.out.ground = grp;
    const PAVED = [0, 0, 1, 0, 1, 1, 0, 0, 1];   // (the kinds of ground laid with granite: built-up, bare, car parks, plazas; the rest grass)
    const S = 64;   // cells per chunk side (640 m)
    for (let cj = 0; cj < G.nz - 1; cj += S) for (let ci = 0; ci < G.nx - 1; ci += S) {
      const ni = Math.min(S, G.nx - 1 - ci), nj = Math.min(S, G.nz - 1 - cj);
      let dMin = 1e9; for (let j = 0; j <= nj; j += 4) for (let i = 0; i <= ni; i += 4) dMin = Math.min(dMin, G.dT[(cj + j) * G.nx + ci + i]);
      const st = dMin > 260 ? 2 : 1;   // (a chunk well away from the circuit: every other vertex)
      const P = [], Cl = [], U = [], I = [];
      for (let j = 0; j <= nj; j += st) for (let i = 0; i <= ni; i += st) {
        const k = (cj + j) * G.nx + ci + i, x = G.x0 + (ci + i) * G.c, z = G.z0 + (cj + j) * G.c, h = G.H[k], kd = G.wet[k] ? 3 : G.kind[k];
        const n1 = hash(ci + i, cj + j), n2 = 0.93 + 0.14 * Math.sin(x * 0.031 + Math.sin(z * 0.027) * 2) * Math.sin(z * 0.023 + x * 0.007);
        let col = KCOL[kd].map(v => v * (kd === 2 || kd === 8 ? 0.97 + 0.06 * n1 : n2 * (0.95 + 0.1 * n1)));
        if (h < WL) col = [0.36, 0.38, 0.34];
        if (PAVED[kd]) col = [0.86, 0.85, 0.83].map(v => v * (0.95 + 0.08 * n1));
        P.push(x, h, z); Cl.push(col[0], col[1], col[2]); U.push(x / 12, -z / 12);
      }
      const IP = [];
      const W1 = Math.floor(ni / st) + 1, H1 = Math.floor(nj / st) + 1;
      for (let j = 0; j < H1 - 1; j++) for (let i = 0; i < W1 - 1; i++) {
        const a = j * W1 + i, b = a + 1, c = a + W1, d = c + 1;
        if (Math.max(P[a * 3 + 1], P[b * 3 + 1], P[c * 3 + 1], P[d * 3 + 1]) < WL - 0.5) continue;   // (deep under the water)
        const k0 = (cj + j * st) * G.nx + ci + i * st, kd = G.wet[k0] ? 3 : G.kind[k0];
        (PAVED[kd] ? IP : I).push(a, c, b, b, c, d);
      }
      if (!I.length && !IP.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U.map(v => v * 4), 2)); g.setIndex(I.concat(IP)); g.computeVertexNormals();
      const uvP = new THREE.Float32BufferAttribute(U.map(v => v * 4), 2), uvG = new THREE.Float32BufferAttribute(U, 2);
      for (const [L, mt, uv] of [[I, mat, uvG], [IP, matP, uvP]]) { if (!L.length) continue;   // (one vertex buffer, two index lists: the grass and the granite)
        const gg = new THREE.BufferGeometry(); gg.setAttribute('position', g.attributes.position); gg.setAttribute('normal', g.attributes.normal); gg.setAttribute('color', g.attributes.color); gg.setAttribute('uv', uv);
        gg.setIndex(L); gg.computeBoundingSphere(); const m = new THREE.Mesh(gg, mt); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); }
    }
    // the car parks (asphalt) and the plazas (granite paving): OSM outlines, a few cm over the ground
    const OV = { parking: [C.tex.paving, [0.5, 0.5, 0.52], 6], pedestrian: [C.tex.paving, [0.86, 0.86, 0.86], 3], plaza: [C.tex.paving, [0.86, 0.86, 0.86], 3], pitch: [C.tex.grass, [0.74, 1.0, 0.62], 6] };
    const ov = {}, near = C.near;
    for (const [cl, ring] of C.D.lu) { const o = OV[cl]; if (!o || ring.length < 3) continue;
      const pts = ring.map(p => new THREE.Vector2(p[0], p[1])); if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
      let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts, []); } catch (e) { continue; }
      const key = cl === 'plaza' || cl === 'parking' ? 'pedestrian' : cl, g = ov[key] || (ov[key] = new K.Chunks(512, true)), y = (p) => pkGround(p.x, p.y) + 0.04;
      for (const [a, b, c] of tris) { const A = pts[a], B = pts[b], Cc = pts[c], m = [(A.x + B.x + Cc.x) / 3, (A.y + B.y + Cc.y) / 3]; if (near(m[0], m[1]).d < 0.5 || isWet(m[0], m[1])) continue;
        g.get(m[0], m[1]).quadUp([A.x, y(A), A.y], [B.x, y(B), B.y], [Cc.x, y(Cc), Cc.y], [Cc.x, y(Cc), Cc.y], [o[1], o[1], o[1], o[1]], [[A.x / o[2], -A.y / o[2]], [B.x / o[2], -B.y / o[2]], [Cc.x / o[2], -Cc.y / o[2]], [Cc.x / o[2], -Cc.y / o[2]]]); }
    }
    for (const k in ov) { const o = OV[k]; ov[k].addTo(grp, new THREE.MeshLambertMaterial({ map: o[0], vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), false, true); }
  }

  /* ---- the water: one plane at the lakes' level (the ground keeps it out where it is land), the granite embankment along every shore near
     the circuit (a wall from the bed to the plaza, a coping stone on top, a white balustrade where the plaza is busy) ---- */
  function pkWater(C) {
    const G = PG, O = { color: 0x8c9a72, len: 1.4, amp: 0.5, refl: 0.28, land: 0.35, shal: 0.15, lap: 0.2 };
    const wm = C.ice ? new THREE.MeshLambertMaterial({ color: 0xcfdde8, emissive: 0x101418 }) : K.waterMat(C.tex, O), wg = new K.Chunks(512, true), W1 = [1, 1, 1];   // (the ice: pale, still)   // the water: the OSM outlines themselves, triangulated (holes: the islands), a little past the embankments
    for (const [, rings] of C.D.water) {
      const sh = rings.map(r => { const p = r.map(q => new THREE.Vector2(q[0], q[1])); return p; }); if (!sh[0] || sh[0].length < 3) continue;
      let [x0, z0, x1, z1] = [1e9, 1e9, -1e9, -1e9]; for (const q of rings[0]) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
      if (x1 < G.x0 - 900 || x0 > G.x1 + 900 || z1 < G.z0 - 900 || z0 > G.z1 + 900) continue;
      const outer = THREE.ShapeUtils.isClockWise(sh[0]) ? sh[0].slice().reverse() : sh[0], holes = sh.slice(1).map(h => THREE.ShapeUtils.isClockWise(h) ? h : h.slice().reverse());
      let tris; try { tris = THREE.ShapeUtils.triangulateShape(outer, holes); } catch (e) { continue; }
      const all = outer.concat(...holes), V = (p) => [p.x, WL, p.y], U = (p) => [p.x / 9, -p.y / 9];
      for (const [a, b, c] of tris) { const A = all[a], B = all[b], Cc = all[c]; const mx = (A.x + B.x + Cc.x) / 3, mz = (A.y + B.y + Cc.y) / 3; wg.get(mx, mz).triO(V(A), V(B), V(Cc), W1, [mx, WL - 5, mz], W1, W1, U(A), U(B), U(Cc)); }
    }
    wg.addTo(C.root, wm, false, true);
    if (C.ice) { pkEmbank(C); return; }
    C.out.dyn.water = C.tex.water;
    const sd = (x, z) => gAt(G.dT, x, z) > 320 ? 99 : -gAt(G.SD, x, z);   // (the shore band only along the shores near the circuit: the paler water by the embankments)
    for (let z = G.z0; z < G.z1; z += 512) for (let x = G.x0; x < G.x1; x += 512) {
      const band = K.shoreBand(x, z, Math.min(G.x1, x + 512), Math.min(G.z1, z + 512), WL + 0.01, sd, 9, { F: 4 }); if (band) K.addShore(C.root, band, wm, O); }
    pkEmbank(C);
  }
  function pkEmbank(C) {
    const G = PG;
    // the embankments: along the OSM outlines of the water (their edges), within 900 m of the circuit
    const ew = new K.Chunks(512), st = [0.7, 0.69, 0.65], stD = [0.5, 0.5, 0.47], cap = [0.84, 0.83, 0.8];
    for (const [, rings] of C.D.water) for (const r of rings) for (let a = 0, b = r.length - 1; a < r.length; b = a++) {
      const A = r[b], B = r[a], l = Math.hypot(B[0] - A[0], B[1] - A[1]); if (l < 0.5) continue;
      const mx = (A[0] + B[0]) / 2, mz = (A[1] + B[1]) / 2; if (gAt(G.dT, mx, mz) > 900 || mx < G.x0 || mz < G.z0 || mx > G.x1 || mz > G.z1) continue;
      const ox = (B[1] - A[1]) / l, oz = -(B[0] - A[0]) / l, sg = isWet(mx + ox * 2, mz + oz * 2) ? 1 : -1, wx = ox * sg, wz = oz * sg;   // (w: towards the water)
      const g = ew.get(mx, mz), dry = [mx - wx * 3, 0, mz - wz * 3];
      g.quadO([A[0], WL - 1.2, A[1]], [B[0], WL - 1.2, B[1]], [B[0], -0.02, B[1]], [A[0], -0.02, A[1]], st, dry, null, [stD, stD, st, st]);
      const A2 = [A[0] - wx * 0.6, A[1] - wz * 0.6], B2 = [B[0] - wx * 0.6, B[1] - wz * 0.6];
      g.quadUp([A[0] + wx * 0.1, 0.12, A[1] + wz * 0.1], [B[0] + wx * 0.1, 0.12, B[1] + wz * 0.1], [B2[0], 0.12, B2[1]], [A2[0], 0.12, A2[1]], [cap, cap, cap, cap]);
      g.quadO([A[0] + wx * 0.1, -0.02, A[1] + wz * 0.1], [B[0] + wx * 0.1, -0.02, B[1] + wz * 0.1], [B[0] + wx * 0.1, 0.12, B[1] + wz * 0.1], [A[0] + wx * 0.1, 0.12, A[1] + wz * 0.1], cap, dry);
      if (gAt(G.dT, mx, mz) < 260) for (let t = 0; t < l; t += 2.2) { const px = A[0] + (B[0] - A[0]) * t / l - wx * 0.3, pz = A[1] + (B[1] - A[1]) * t / l - wz * 0.3; box(g, px, 0.12, pz, 0.16, 0.85, 0.16, 0, [0.9, 0.9, 0.87]); }   // the white balustrade's posts
      if (gAt(G.dT, mx, mz) < 260) { const y = 0.97; g.quadO([A2[0] + wx * 0.25, y, A2[1] + wz * 0.25], [B2[0] + wx * 0.25, y, B2[1] + wz * 0.25], [B2[0] + wx * 0.25, y + 0.12, B2[1] + wz * 0.25], [A2[0] + wx * 0.25, y + 0.12, A2[1] + wz * 0.25], [0.92, 0.92, 0.9], dry); }
    }
    ew.addTo(C.root, C.matV, false, true);
  }

  /* ---- the circuit: asphalt (the racing line rubbered in, darker in the braking zones), white edge lines, red and white kerbs at the corners,
     the verges inside the walls paved (the junctions' mouths too), the start line and the grid ---- */
  function pkRoad(C) {
    const { T, N, w, ds, tex, Pt, addM } = C, CH = 224, offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); C.out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true });
    C.aMat = aMat; C.lMat = lMat;
    const kerb = [new Uint8Array(N), new Uint8Array(N)];
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) if (side * k > 0 || Math.abs(k) > 1 / 40) kerb[side > 0 ? 1 : 0][i] = 1; }
    const brk = new Float32Array(N);
    for (const c of T.corners) if (c.sev >= 2) for (let k = -60; k <= 6; k++) { const i = (c.i0 + k + N) % N, f = k < -10 ? sstep(-60, -12, k) : sstep(6, -10, k); if (f > brk[i]) brk[i] = f; }
    const shade = (i, o) => { const rl = T.rl[i]; let k = (0.8 - (0.13 + 0.12 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5)) * (0.96 + 0.06 * Math.sin(i * 0.013)); if (Math.abs(o) > w * 0.92) k -= 0.03; return [k, k, k * 1.02]; };
    const jMouth = C.jm = [new Float32Array(N), new Float32Array(N)];   // per sample: a junction's mouth (0: none)
    for (const [d, sd, ang, hw] of C.def.junctions || []) { const half = hw / Math.max(0.35, Math.sin(ang * Math.PI / 180)) + 4.5;
      for (let q = -half - 3; q <= half + 3; q += ds) { const i = T.idx(C.sAt(d + q)), f = Math.min(sstep(-half - 3, -half, q), sstep(half + 3, half, q)); jMouth[sd > 0 ? 1 : 0][i] = Math.max(jMouth[sd > 0 ? 1 : 0][i], f); } }
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new K.RB(true), gl = new K.RB(), gk = new K.RB(true), gp = new K.RB(true);
      let pr = -1, pl = -1; const pk = [-1, -1], pp = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const wl = [0.94, 0.94, 0.9], l = gl.row([Pt(i, -w + 0.15, 0.034), Pt(i, -w + 0.4, 0.034), Pt(i, w - 0.4, 0.034), Pt(i, w - 0.15, 0.034)], [wl, wl, wl, wl]); if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        for (const side of [-1, 1]) {
          const si = side > 0 ? 1 : 0, bar = side > 0 ? T.br[i] : T.bl[i], kb = kerb[si][i], e0 = w + (kb ? T.curbW : 0);
          if (kb) { const cw = T.curbW, pf = [[w - 0.02, 0.035], [w + 0.14, 0.078], [w + cw - 0.12, 0.085], [w + cw + 0.02, 0.03]], vv = ii * ds / 2, sh = [0.84, 1, 1, 0.78].map(k => [k, k, k]), us = [0, 0.1, 0.92, 1], o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
            const rk = gk.row(o.map(k => Pt(i, side * pf[k][0], pf[k][1])), o.map(k => sh[k]), o.map(k => [us[k], vv])); if (pk[si] >= 0) gk.link(pk[si], rk, 0, 3); pk[si] = rk; } else pk[si] = -1;
          // the verge from the kerb (or the edge) to the wall: the boulevard's asphalt (paler, older), out to the wall
          const pc = jMouth[si][i] > 0.01 ? [0.92, 0.92, 0.94] : [0.97, 0.97, 0.99], q0 = Pt(i, side * (e0 - 0.02), 0.021), q1 = Pt(i, side * Math.max(e0 + 0.3, bar + 0.6), 0.021), qq = side > 0 ? [q0, q1] : [q1, q0];
          const rp = gp.row(qq, [pc, pc], qq.map(p => [p[0] / 8, -p[2] / 8])); if (pp[si] >= 0) gp.link(pp[si], rp, 0, 1); pp[si] = rp;
        }
      }
      addM(gr, aMat); addM(gl, lMat); addM(gk, cMat); addM(gp, aMat);
    }
    // the start line and the grid
    { const sS = C.sStart, gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wh = [0.93, 0.93, 0.9], Q = (s, o, y) => { const p = C.atSf(s, o); return [p[0], y, p[1]]; };
      gq.quadUp(Q(sS - 0.8, -w, 0.04), Q(sS - 0.8, w, 0.04), Q(sS + 0.8, w, 0.04), Q(sS + 0.8, -w, 0.04), [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) { const sb = sS - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.0;
        gw.quadUp(Q(sb, lat - 1.5, 0.037), Q(sb, lat + 1.5, 0.037), Q(sb + 0.35, lat + 1.5, 0.037), Q(sb + 0.35, lat - 1.5, 0.037), [wh, wh, wh, wh]);
        gw.quadUp(Q(sb - 1.6, lat - 1.5, 0.037), Q(sb + 0.35, lat - 1.5, 0.037), Q(sb + 0.35, lat - 1.25, 0.037), Q(sb - 1.6, lat - 1.25, 0.037), [wh, wh, wh, wh]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat); }
  }

  /* ---- the walls: concrete blocks (white with a grey foot, the game's own adverts on some), tyre walls round the outside of the slow corners,
     catch fences on poles above them ---- */
  function pkWalls(C) {
    const { T, N, ds, Pt, addM, tex } = C, side2 = (s) => (s > 0 ? 1 : 0), CH = 224;
    const tyreOn = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) { if (c.sev < 3) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 8; k <= i1c + 12; k++) { const ii = ((k % N) + N) % N, bar = si ? T.br[ii] : T.bl[ii]; if (bar > T.w + 5 && !C.jm[si][ii]) tyreOn[si][ii] = 1; } }
    const kindAt = (i, side) => {   // -1 none (the pit lane's way in and out), 1 concrete, 2 tyres
      if (side > 0 && C.def.pit) { const p = T.pitAt(i * ds); if (p && p.gap) return -1; }
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
    { const sb = new K.Chunks(512, true);
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 2) {
        const j = (i + 2) % N, bar = side > 0 ? T.br : T.bl; if (kindAt(i, side) !== 1 || kindAt(j, side) !== 1 || Math.abs(bar[i] - bar[j]) > 0.3 || C.jm[side2(side)][i] > 0 || (i >> 1) % 5 > 2) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, o = (ii) => side * (bar[ii] + 0.32);
        const A = Pt(i, o(i), 0.32), B = Pt(j, o(j), 0.32), Cq = Pt(j, o(j), 1.0), Dq = Pt(i, o(i), 1.0), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        sb.get(A[0], A[2]).quadO(A, B, Cq, Dq, W1, Pt(i, side * (bar[i] + 2), 0.6), [[uL, v1 - 0.25], [uR, v1 - 0.25], [uR, v1], [uL, v1]]); }
      sb.addTo(C.root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true); }
    // catch fences on the walls (and taller behind the tyre walls)
    const fg = new K.Chunks(512, true);
    for (const side of [-1, 1]) {
      const fc = fence[side2(side)], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N; if (!fc[i] || !fc[j]) { acc += ds; continue; }
        const e = fc[i] === 2 ? 1.2 : 0.55, top = fc[i] === 2 ? 4.2 : 3.4, Q = (ii, y) => Pt(ii, side * (bar[ii] + e), y);
        const u0 = acc / 2.5, u1 = (acc + ds) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        fg.get(ins[0], ins[2]).quadO(Q(i, 1.0), Q(j, 1.0), Q(j, top), Q(i, top), W1, ins, [[u0, 0], [u1, 0], [u1, (top - 1) / 2.5], [u0, (top - 1) / 2.5]]);
        if (i % 3 === 0) { const p = Q(i, 0); box(C.scen.get(p[0], p[2]), p[0], 0.9, p[2], 0.09, top - 0.8, 0.09, T.hd[i], [0.55, 0.56, 0.58], null, true); }
        acc += ds;
      }
    }
    fg.addTo(C.root, fMat, false, true);
  }
  /* ---- the rest of the boulevard beyond the walls (def.street: how far its carriageways reach): its outer lanes (asphalt, white dashed lane
     lines, a solid edge line), the granite kerb, the sidewalk of grey and rose tiles, the rows of trees in their pits along it, the tall
     two-armed street lamps; on the paths round the stadium the plaza itself ---- */
  function pkStreet(C) {
    const { T, N, ds, Pt, root, scen } = C, S = C.street, CH = 224, W1 = [1, 1, 1], wh = [0.92, 0.92, 0.88], kerbC = [0.72, 0.71, 0.68], walk = [0.9, 0.86, 0.84];
    const aMat = C.aMat, pMat = new THREE.MeshLambertMaterial({ map: C.tex.paving, vertexColors: true });
    const pitSide = (i) => { if (!C.def.pit) return false; const d = C.dS(i * ds); return d > C.def.pit[1] - 30 && d < C.def.pit[2] + 30; };
    const run = (side) => { const si = side > 0 ? 1 : 0, ok = new Uint8Array(N), ext = new Float32Array(N);
      for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i], e = side > 0 ? S.R[i] : S.L[i]; ext[i] = e; ok[i] = e > bar + 2.2 && C.jm[si][i] < 0.01 && !(side > 0 && pitSide(i)) ? 1 : 0; }
      return { ok, ext }; };
    for (const side of [-1, 1]) {
      const { ok, ext } = run(side);
      for (let c0 = 0; c0 < N; c0 += CH) {
        const ga = new K.RB(true), gm = new GB(), gs = new K.RB(true), gk = new GB();
        let pa = -1, ps = -1;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, j = (i + 1) % N, bar = side > 0 ? T.br[i] : T.bl[i], e = ext[i];
          if (!ok[i]) { pa = ps = -1; continue; }
          const o0 = bar + 0.7, A = [Pt(i, side * o0, 0.01), Pt(i, side * e, 0.01)], As = side > 0 ? A : A.slice().reverse();
          const ra = ga.row(As, [W1, W1], As.map(p => [p[0] / 8, -p[2] / 8])); if (pa >= 0) ga.link(pa, ra, 0, 1); pa = ra;
          const Sw = [Pt(i, side * e, 0.15), Pt(i, side * (e + 4.5), 0.15)], Ss = side > 0 ? Sw : Sw.slice().reverse();
          const rs = gs.row(Ss, [walk, walk], Ss.map(p => [p[0] / 1.6, -p[2] / 1.6])); if (ps >= 0) gs.link(ps, rs, 0, 1); ps = rs;
          if (!ok[j]) continue;
          const ej = ext[j], barj = side > 0 ? T.br[j] : T.bl[j];
          gk.quadO(Pt(i, side * e, -0.05), Pt(j, side * ej, -0.05), Pt(j, side * ej, 0.15), Pt(i, side * e, 0.15), kerbC, Pt(i, side * (e + 2), 0.1));   // the kerb's face
          // markings: the edge line, dashed lane lines every 3.5 m in from the kerb (6 m lines, 9 m gaps)
          const ln = (o, oj, wdt) => gm.quadUp(Pt(i, side * (o - wdt), 0.03), Pt(i, side * (o + wdt), 0.03), Pt(j, side * (oj + wdt), 0.03), Pt(j, side * (oj - wdt), 0.03), [wh, wh, wh, wh]);
          if (e > bar + 6.5) {   // a bike lane by the kerb behind a guard railing (white rails, yellow and black at its foot)
            const bk = [0.66, 0.42, 0.38], o1 = e - 3.0, o1j = ej - 3.0; gm.quadUp(Pt(i, side * (o1 + 0.1), 0.026), Pt(i, side * (e - 0.1), 0.026), Pt(j, side * (ej - 0.1), 0.026), Pt(j, side * (o1j + 0.1), 0.026), [bk, bk, bk, bk]);
            const rl = [0.92, 0.92, 0.9], g = scen.get(T.px[i], T.pz[i]), r0 = Pt(i, side * o1, 0), r1 = Pt(j, side * o1j, 0);
            for (const y of [0.55, 0.95]) gk.quadO([r0[0], y, r0[2]], [r1[0], y, r1[2]], [r1[0], y + 0.06, r1[2]], [r0[0], y + 0.06, r0[2]], rl, Pt(i, side * (o1 - 2), 0.7));
            gk.quadO([r0[0], 0.02, r0[2]], [r1[0], 0.02, r1[2]], [r1[0], 0.2, r1[2]], [r0[0], 0.2, r0[2]], (ii >> 1) % 2 ? [0.1, 0.1, 0.11] : [0.95, 0.78, 0.1], Pt(i, side * (o1 - 2), 0.1));
            if (ii % 2 === 0) box(g, r0[0], 0, r0[2], 0.07, 1.02, 0.07, T.hd[i], rl);
          } else ln(e - 0.45, ej - 0.45, 0.08);
          if ((ii * ds) % 15 < 6) for (let o = e - (e > bar + 6.5 ? 6.6 : 3.6), oj = ej - (e > bar + 6.5 ? 6.6 : 3.6); o > bar + 1.8 && oj > barj + 1.8; o -= 3.5, oj -= 3.5) ln(o, oj, 0.07);
          // trees in their pits along the sidewalk (every 7 m), lamps every 35 m
          const s = ii * ds;
          if (Math.floor(s / 7) !== Math.floor((s + ds) / 7)) { const p = Pt(i, side * (e + 1.4), 0); C.trees.push([p[0], p[2], 0, 1]); const g = scen.get(p[0], p[2]), c = Math.cos(T.hd[i]) * 0.65, sn = Math.sin(T.hd[i]) * 0.65, pc = [0.32, 0.28, 0.22]; g.quadUp([p[0] - c + sn, 0.16, p[2] - sn - c], [p[0] + c + sn, 0.16, p[2] + sn - c], [p[0] + c - sn, 0.16, p[2] + sn + c], [p[0] - c - sn, 0.16, p[2] - sn + c], [pc, pc, pc, pc]); }
          if (Math.floor(s / 35) !== Math.floor((s + ds) / 35)) { const p = Pt(i, side * (e + 0.6), 0), g = scen.get(p[0], p[2]), gr = [0.52, 0.54, 0.57], hd = T.hd[i];
            cyl(g, p[0], 0.15, p[2], 0.11, 10.5, 6, gr, null, 0.07); for (const q of [-1, 1]) { const ax = p[0] + T.tx[i] * q * 1.1, az = p[2] + T.tz[i] * q * 1.1; box(g, ax, 10.2, az, 2.2, 0.08, 0.08, hd, gr); box(g, p[0] + T.tx[i] * q * 2.1, 10.0, p[2] + T.tz[i] * q * 2.1, 0.7, 0.18, 0.3, hd, [0.42, 0.44, 0.47], [0.55, 0.57, 0.6]); } }
        }
        if (!ga.empty) { const m = new THREE.Mesh(ga.geometry(), aMat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
        if (!gs.empty) { const m = new THREE.Mesh(gs.geometry(), pMat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
        if (!gm.empty) { const m = new THREE.Mesh(gm.geometry(), C.lMat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
        if (!gk.empty) { const m = new THREE.Mesh(gk.geometry(), C.matV); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
      }
    }
  }

  /* ---- the pit lane on the right of the start straight (Core.Track.pitAt): the lane and its lines, the apron, the teams' stands on the strip
     behind the pit wall, the crews' boxes (out.pitBoxes), the teams' temporary garages (white marquees, a band in the team's colour), their
     trucks behind on the plaza, the start gantry ---- */
  const TEAM = [[0.86, 0.1, 0.12], [0.12, 0.16, 0.36], [0.16, 0.46, 0.3], [0.96, 0.52, 0.1], [0.94, 0.94, 0.92], [0.14, 0.14, 0.16], [0.16, 0.36, 0.8], [0.1, 0.62, 0.72], [0.96, 0.78, 0.12], [0.55, 0.26, 0.7], [0.4, 0.42, 0.46], [0.7, 0.1, 0.1], [0.2, 0.3, 0.55]];
  function pkPits(C) {
    const { T, def, sStart, out, scen, atSf, addM, exclPush } = C, PD = def.pit; if (!PD) return;
    const [pq0, pq1] = def.pitRow, lMat = C.lMat, aMat = C.aMat;
    const at = (s, o, y) => { const p = atSf(s, o); return [p[0], y, p[1]]; };
    const gl = new GB(true), gp = new GB(), one = [1, 1, 1], wl = [0.95, 0.95, 0.94], apC = [0.8, 0.81, 0.78], yel = [0.98, 0.82, 0.12];
    const quad = (g, s0, s1, o0, o1, o2, o3, y, c, uv) => { const A = at(s0, o0, y), B = at(s0, o1, y), Cq = at(s1, o2, y), Dq = at(s1, o3, y); g.quadUp(A, B, Cq, Dq, [c, c, c, c], uv ? [A, B, Cq, Dq].map(p => [p[0] / 8, -p[2] / 8]) : undefined); };
    let F0 = 0;
    for (let q = PD[1]; q < PD[2]; q += 2) {
      const s0 = sStart + q, s1 = s0 + 2, pi = T.pitAt(s0), pj = T.pitAt(s1); if (!pi || !pj) continue;
      const oi = pi.o, oj = pj.o; F0 = Math.max(F0, oi + 9.5);
      quad(gl, s0, s1, oi - 3.5, oi + 3.5, oj + 3.5, oj - 3.5, 0.024, one, true);
      quad(gp, s0, s1, oi + 3.18, oi + 3.36, oj + 3.36, oj + 3.18, 0.033, wl);
      if (((q / 2) | 0) % 2 === 0) quad(gp, s0, s1, oi - 3.36, oi - 3.18, oj - 3.18, oj - 3.36, 0.033, wl);
      if (pi.t > 0.999 && pj.t > 0.999) { quad(gp, s0, s1, pi.wall + 0.45, oi - 3.5, oj - 3.5, pj.wall + 0.45, 0.022, [0.72, 0.72, 0.7]);
        quad(gp, s0, s1, oi + 3.5, oi + 9.5, oj + 9.5, oj + 3.5, 0.022, apC); if (q % 20 === 0) quad(gp, s0, s1, oi + 3.5, oi + 3.7, oj + 3.7, oj + 3.5, 0.03, wl); }
      else if (pi.t > 0.05) quad(gl, s0, s1, oi + 3.5, oi + 3.5 + 6 * pi.t + 0.1, oj + 3.5 + 6 * pj.t + 0.1, oj + 3.5, 0.02, one, true);
      if (q % 6 === 0) { const p = atSf(s0, oi + 6); exclPush(p[0], p[1], 12); }
    }
    for (const q of [PD[1] + 45, PD[2] - 34]) { const p = T.pitAt(sStart + q); if (p) quad(gp, sStart + q, sStart + q + 0.4, p.o - 3.4, p.o + 3.4, p.o + 3.4, p.o - 3.4, 0.036, wl); }
    const kb = (g, s, o, y, sx, sy, sz, col, top) => { const [x, z, hd] = atSf(s, o); box(g, x, y, z, sx, sy, sz, hd, col, top); };
    let nb = 0;
    for (let q = pq0, k = 0; q <= pq1; q += 10, k++) {
      const s0 = sStart + q, i = T.idx(s0 + 5), p = T.pitAt(s0); if (!p || p.t < 0.999) continue;
      const base = p.o + 3.5, tx = T.tx[i], tz = T.tz[i], nx = T.nx[i], nz = T.nz[i], mine = Math.abs(q + 5 - PD[3]) < 1, tc = TEAM[k % TEAM.length];
      quad(gp, s0 - 0.09, s0 + 0.09, base, base + 6, base + 6, base, 0.034, wl);
      const oc = atSf(s0 + 5, 0);
      if (mine) { const sb = s0 + 5, lo = p.o; out.pitBox = { s: sb, x: oc[0] + nx * (base + 4), z: oc[1] + nz * (base + 4), hd: T.hd[i], tx, tz, nx, nz, lane: lo, wallO: p.wall, apron0: base, garage0: base + 6, stop: atSf(sb, p.o) };
        for (const [d0, d1, l0, l1] of [[-3.2, 3.2, lo - 2.6, lo - 2.35], [-3.2, 3.2, lo + 2.35, lo + 2.6], [-3.2, -2.95, lo - 2.6, lo + 2.6], [2.95, 3.2, lo - 2.6, lo + 2.6]]) quad(gp, sb + d0, sb + d1, l0, l1, l1, l0, 0.036, yel); }
      (out.pitBoxes = out.pitBoxes || []).push({ k: nb++, s: s0 + 5, ox: oc[0], oz: oc[1], tx, tz, nx, nz, hd: T.hd[i], base, lane: p.o, wall: p.wall, team: tc, mine, y: 0 });
      const g = scen.get(oc[0], oc[1]), wv = p.wall;   // the team's stand on the pit wall strip: a desk with screens under a roof in the team's colour
      kb(g, s0 + 5, wv + 0.8, 0.96, 2.5, 0.06, 1.0, [0.3, 0.31, 0.34], [0.36, 0.37, 0.4]);
      for (const la of [-1.18, 1.18]) for (const lw of [0.35, 1.2]) kb(g, s0 + 5 + la, wv + lw, 0, 0.07, 0.96, 0.07, [0.22, 0.22, 0.24]);
      kb(g, s0 + 5, wv + 0.4, 1.02, 2.1, 0.42, 0.06, [0.07, 0.07, 0.08]);
      for (const pa of [-1.2, 1.2]) kb(g, s0 + 5 + pa, wv + 0.25, 0, 0.08, 2.5, 0.08, [0.25, 0.26, 0.28]);
      kb(g, s0 + 5, wv + 0.9, 2.5, 2.7, 0.07, 1.6, [0.22, 0.23, 0.26], tc);
      // the team's marquee garage behind the apron: white canvas walls, open to the lane, the band in its colour, the floor
      const G0 = base + 6, gd = 9;
      kb(g, s0 + 5, G0 + gd / 2, 0, 9.8, 0.03, gd, [0.42, 0.44, 0.47], [0.48, 0.5, 0.53]);
      kb(g, s0 + 5, G0 + gd - 0.1, 0, 9.8, 3.4, 0.2, [0.94, 0.94, 0.95]);
      for (const e of [-4.9, 4.9]) kb(g, s0 + 5 + e, G0 + gd / 2, 0, 0.12, 3.4, gd, [0.94, 0.94, 0.95]);
      kb(g, s0 + 5, G0 + gd / 2, 3.4, 10, 0.25, gd + 0.4, [0.92, 0.92, 0.93], [0.96, 0.96, 0.97]);
      kb(g, s0 + 5, G0 + 0.1, 2.8, 9.8, 0.6, 0.12, tc);
      for (const ca of [1.4, 8.6]) kb(g, s0 + ca, G0 + gd - 1.0, 0, 1.0, 1.0, 0.6, [0.2, 0.21, 0.24]);
      if (k % 2 === 0) { const [x, z, hd] = atSf(s0 + 5, G0 + gd + 6), gg = scen.get(x, z); box(gg, x, 0.3, z, 13.6, 3.6, 2.5, hd, [0.92, 0.92, 0.93], tc); box(gg, x + Math.cos(hd) * 7.9, 0.3, z + Math.sin(hd) * 7.9, 2.2, 3.2, 2.5, hd, tc, tc); exclPush(x, z, 8); }
      exclPush(...atSf(s0 + 5, G0 + gd / 2).slice(0, 2), 9);
    }
    { const pbs = out.pitBoxes; T.pitStands = null;
      if (pbs && pbs.length) T.pitStands = [C.dS(pbs[0].s) - 1.35, C.dS(pbs[pbs.length - 1].s) + 1.35]; }
    addM(gl, aMat); addM(gp, lMat);
    // the start gantry: two posts outside the walls, a beam over the road with the five lights, a banner with the town's name
    { const i = T.idx(sStart), x = T.px[i], z = T.pz[i], h = T.hd[i], g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      const oL = T.bl[i] + 1.0, oR = T.br[i] + 1.0;
      for (const o of [-oL, oR]) box(g, x + nx * o, -0.3, z + nz * o, 0.8, 7.9, 0.8, h, gray);
      const cx = x + nx * (oR - oL) / 2, cz = z + nz * (oR - oL) / 2;
      box(g, cx, 6.4, cz, 1.1, 1.3, oL + oR + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, 7.95, z + nz * o); m.rotation.y = -h; C.root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const bt = pkBoardTex(C, ['BEIJING'], '#c8102e', '#ffffff', '#f2c230', 1024, 96);
      for (const sd of [-1, 1]) { const m = pkPlane(C, bt, cx - T.tx[i] * 0.6 * sd, 6.45, cz - T.tz[i] * 0.6 * sd, oL + oR - 1, 1.2, sd > 0 ? Math.atan2(-T.tz[i], -T.tx[i]) : Math.atan2(T.tz[i], T.tx[i])); m.castShadow = false; }
      exclPush(x, z, Math.max(oL, oR) + 6);
    }
  }
  /* ---- a canvas text board (a texture of its own): text on a colour, an edge stripe ---- */
  function pkBoardTex(C, lines, bg, fg, stripe, W, H) {
    const c = document.createElement('canvas'); c.width = W || 512; c.height = H || 128; const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); if (stripe) { x.fillStyle = stripe; x.fillRect(0, c.height - 10, c.width, 10); x.fillRect(0, 0, c.width, 5); }
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((t, k) => { const px = Math.round(c.height * (lines.length > 1 ? 0.34 : 0.56)); x.font = '900 ' + px + 'px Arial, sans-serif'; x.fillText(t, c.width / 2, c.height * (k + 0.55) / lines.length, c.width - 24); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return C.ownTex(t);
  }
  function pkPlane(C, map, x, y, z, W, H, yaw, both) {   // an upright textured board (bottom centre x, y, z) facing along yaw
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map, side: both ? THREE.DoubleSide : THREE.FrontSide }));
    m.position.set(x, y + H / 2, z); m.rotation.y = Math.PI / 2 - yaw; m.castShadow = true; m.receiveShadow = true; m.updateMatrix(); m.matrixAutoUpdate = false; C.root.add(m); return m;
  }

  /* ---- grandstands (def.stands [from, to, side, rows, roof]): temporary steel stands behind the walls, tiers following the road with the
     seated crowd picture on them, a roof over the main one, plain banners along the back; fans on the plazas (def.ga), the crowd layer ---- */
  const PK_SHIRTS = [[0.86, 0.1, 0.12], [0.95, 0.95, 0.94], [0.12, 0.13, 0.16], [0.98, 0.78, 0.12], [0.16, 0.36, 0.8], [0.86, 0.1, 0.12], [0.94, 0.5, 0.1], [0.18, 0.55, 0.3], [0.95, 0.95, 0.94], [0.36, 0.38, 0.42], [0.86, 0.1, 0.12], [0.6, 0.18, 0.5]];
  function pkStands(C) {
    const { T, def, scen, atSf, addM, exclPush, tex } = C, crowdG = new GB(true), W1 = [1, 1, 1];
    const near = (x, z) => { const i = T.nearestIdx(x, z), dx = x - T.px[i], dz = z - T.pz[i], lat = dx * T.nx[i] + dz * T.nz[i]; return Math.abs(lat) - (lat > 0 ? T.br[i] : T.bl[i]); };
    const CR = K.crowdCtx({ gH: pkGround, near, excluded: (x, z) => C.excluded(x, z), water: (x, z) => isWet(x, z), maxSlope: 0.5, shirts: PK_SHIRTS, chunk: 256 });
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
        if (m % 2 === 0) for (let k = 0; k <= rows; k += 3) { const o = A.prof[0][0] + 0.3 + k * dep, y = 0.55 + Math.max(0, k - 1) * rise, p = atSf(A.s, side * o); box(g, p[0], -0.2, p[1], 0.08, y + 0.2, 0.08, 0, [0.5, 0.52, 0.55]); }
        if (roof) { const q = (Rr, o, y) => { const p = atSf(Rr.s, side * o); return [p[0], y, p[1]]; }, tA = A.top, tB = B.top;
          const rc = m % 2 ? [0.9, 0.91, 0.93] : [0.82, 0.84, 0.87];
          g.quadO(q(A, A.o0 + 0.6, tA + 0.75), q(B, B.o0 + 0.6, tB + 0.75), q(B, B.o1, tB), q(A, A.o1, tA), rc, q(A, (A.o0 + A.o1) / 2, tA - 5));
          g.quadO(q(A, A.o0, tA + 0.8), q(B, B.o0, tB + 0.8), q(B, B.o0 + 0.6, tB + 0.75), q(A, A.o0 + 0.6, tA + 0.75), [0.78, 0.1, 0.12], q(A, A.o0 + 0.3, tA - 5));
          g.quadO(q(A, A.o0, tA + 0.5), q(B, B.o0, tB + 0.5), q(B, B.o1, tB - 0.3), q(A, A.o1, tA - 0.3), [0.6, 0.62, 0.66], q(A, (A.o0 + A.o1) / 2, tA + 5));
          if (m % 2 === 0) { const p = atSf(A.s, side * (A.o1 - 0.4)); box(g, p[0], -0.3, p[1], 0.4, tA + 0.3, 0.4, 0, [0.86, 0.87, 0.9]); } }
      }
      // banners along the back of the stand (plain red and gold, one every 15 m)
      for (let m = 1; m < rowsP.length - 1; m += 3) { const r = rowsP[m], p = atSf(r.s, side * (r.o1 + 0.3)), g = scen.get(p[0], p[1]), hd = T.hd[T.idx(r.s)], c = Math.cos(hd), s = Math.sin(hd);
        box(g, p[0], 0, p[1], 0.1, r.top + 3.3, 0.1, hd, [0.78, 0.8, 0.82]); box(g, p[0] + c * 0.7, r.top + 1.3, p[1] + s * 0.7, 1.3, 1.9, 0.03, hd, ((m / 3) | 0) % 2 ? [0.95, 0.75, 0.12] : [0.8, 0.1, 0.12]); }
      for (const r of rowsP) { const p = atSf(r.s, side * (r.prof[0][0] + rows * dep * 0.5)); exclPush(p[0], p[1], rows * dep / 2 + 5); CR.exclAdd(p[0], p[1], rows * dep / 2 + 3); }
    }
    if (!crowdG.empty) addM(crowdG, K.crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.11, 0.1));
    for (const [a, b, side] of def.ga || []) K.crowdRun(CR, C.sStart + a, C.sStart + b, side, { rows: 3, dens: 0.5, first: 1.6, gap: 0.9, clump: 0.6, sit: 0.2, flag: 0.06, below: 1.2, above: 2, label: 'ga' });
    for (const [a, b, side] of def.stands || []) K.crowdRun(CR, C.sStart + a - 12, C.sStart + a, side, { rows: 2, dens: 0.4, first: 1.6, label: 'standEnd' });
  }
  /* ---- the venues by the circuit, plain and generic (their OSM outlines; no names, no logos, no symbols) ---- */
  // the principal axes of an outline: its centre, the unit axes and the half extents along them
  function axesOf(r) {
    const [cx, cz] = centroid(r); let sxx = 0, szz = 0, sxz = 0; for (const p of r) { const dx = p[0] - cx, dz = p[1] - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; }
    const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th);
    let a = 0, b = 0; for (const p of r) { const dx = p[0] - cx, dz = p[1] - cz; a = Math.max(a, Math.abs(dx * ux + dz * uz)); b = Math.max(b, Math.abs(-dx * uz + dz * ux)); }
    return { cx, cz, ux, uz, vx: -uz, vz: ux, a, b };
  }
  function pkVenues(C) {
    const Lm = C.D.land || {};
    if (Lm.stadium) pkStadium(C, Lm.stadium.ring);
    if (Lm.aquatic) pkAquatic(C, Lm.aquatic.ring);
    if (Lm.arena) pkArena(C, Lm.arena.ring);
    if (Lm.tower) pkTower(C, Lm.tower.ring);
  }
  /* the big stadium: an oval bowl (its OSM outline's axes), the saddle-shaped rim 41-69 m high, wrapped in a lattice of crossing steel beams
     (the outer walls and the roof ring), the red concrete bowl behind them, a pale membrane in the roof between the beams, inside the tiers
     of seats, the running track and the pitch */
  function pkStadium(C, ring) {
    const A = axesOf(ring), g = new GB(), R = rng(2008), st = [0.74, 0.75, 0.77], stD = [0.56, 0.57, 0.6], red = [0.66, 0.2, 0.16], mem = [0.6, 0.61, 0.6];
    const ea = A.a, eb = A.b, P = (th, f, y) => [A.cx + (A.ux * Math.cos(th) * ea + A.vx * Math.sin(th) * eb) * f, y, A.cz + (A.uz * Math.cos(th) * ea + A.vz * Math.sin(th) * eb) * f];
    const Hr = (th) => 55 - 14 * Math.cos(2 * th);   // the rim: high at the ends of the long axis, low in the middle of the long sides (a saddle)
    const fW = (t) => 1 - 0.07 * t * t;                // the walls lean in towards the top
    const ins = [A.cx, 20, A.cz];
    // the red bowl behind the lattice (the concourses' outer wall) and its top
    const n = 72;
    for (let k = 0; k < n; k++) { const t0 = k / n * TAU, t1 = (k + 1) / n * TAU;
      g.quadO(P(t0, 0.95, 0), P(t1, 0.95, 0), P(t1, 0.9, Hr(t1) * 0.78), P(t0, 0.9, Hr(t0) * 0.78), red, ins);
      g.quadUp(P(t1, 0.95, 0.03), P(t0, 0.95, 0.03), P(t0, 1.05, 0.03), P(t1, 1.05, 0.03), [[0.74, 0.73, 0.7], [0.74, 0.73, 0.7], [0.74, 0.73, 0.7], [0.74, 0.73, 0.7]]);   // (the granite under the lattice)
      // the roof between the rim and the opening: a pale membrane a little under the beams
      g.quadO(P(t0, fW(1) - 0.005, Hr(t0) - 0.4), P(t1, fW(1) - 0.005, Hr(t1) - 0.4), P(t1, 0.62, Hr(t1) - 5.5), P(t0, 0.62, Hr(t0) - 5.5), mem, [A.cx, -50, A.cz]);
      g.quadO(P(t0, 0.62, Hr(t0) - 5.5), P(t1, 0.62, Hr(t1) - 5.5), P(t1, 0.62, Hr(t1) - 8), P(t0, 0.62, Hr(t0) - 8), stD, [A.cx, 30, A.cz]);   // the opening's lip
      // the tiers of seats inside: three bands from the pitch's edge up to under the roof, red, darker at the walkways
      const tiers = [[0.42, 0.5, 0, 9, [0.72, 0.16, 0.14]], [0.5, 0.56, 10, 22, [0.78, 0.2, 0.16]], [0.56, 0.62, 23, 36, [0.7, 0.15, 0.13]]];
      for (const [f0, f1, y0, y1, c] of tiers) { g.quadO(P(t0, f0, y0), P(t1, f0, y0), P(t1, f1, y1), P(t0, f1, y1), c, [A.cx, y1 + 30, A.cz]); g.quadO(P(t0, f1, y1), P(t1, f1, y1), P(t1, f1, y1 + 1), P(t0, f1, y1 + 1), [0.3, 0.3, 0.32], [A.cx, y1, A.cz]); }
      // the running track and the pitch
      g.quadUp(P(t1, 0.27, 0.06), P(t0, 0.27, 0.06), P(t0, 0.42, 0.06), P(t1, 0.42, 0.06), [[0.68, 0.26, 0.2], [0.68, 0.26, 0.2], [0.68, 0.26, 0.2], [0.68, 0.26, 0.2]]);
      g.triO([A.cx, 0.07, A.cz], P(t0, 0.27, 0.07), P(t1, 0.27, 0.07), (k >> 2) % 2 ? [0.3, 0.52, 0.24] : [0.34, 0.58, 0.27], [A.cx, -5, A.cz]);
    }
    // the beams: a box section (two faces seen: outward and one side) following a path over the walls and on over the roof ring
    const beam = (pts, wd) => { for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      const ox = a[0] - A.cx, oz = a[2] - A.cz, ol = Math.hypot(ox, oz) || 1, nxo = ox / ol, nzo = oz / ol;   // (outward, roughly)
      let sx = dy * nzo - 0, sy = dz * nxo - dx * nzo, sz = -dy * nxo; const sl = Math.hypot(sx, sy, sz) || 1; sx *= wd / 2 / sl; sy *= wd / 2 / sl; sz *= wd / 2 / sl;   // (across the beam, in the surface)
      const o = [nxo * wd * 0.8, 0, nzo * wd * 0.8];
      const a0 = [a[0] - sx, a[1] - sy, a[2] - sz], a1 = [a[0] + sx, a[1] + sy, a[2] + sz], b0 = [b[0] - sx, b[1] - sy, b[2] - sz], b1 = [b[0] + sx, b[1] + sy, b[2] + sz];
      const ao = (p) => [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
      g.quadO(ao(a0), ao(a1), ao(b1), ao(b0), st, [(a[0] + b[0]) / 2 - nxo * 5, (a[1] + b[1]) / 2 - 3, (a[2] + b[2]) / 2 - nzo * 5]);
      g.quadO(a1, b1, ao(b1), ao(a1), stD, [(a[0] + b[0]) / 2 - sx * 4, (a[1] + b[1]) / 2 - sy * 4, (a[2] + b[2]) / 2 - sz * 4]); } };
    const surf = (th, t) => t <= 1 ? P(th, fW(t) + 0.004, Hr(th) * t) : P(th, lerp(fW(1), 0.6, t - 1) + 0.004, Hr(th) - 5.2 * (t - 1));   // t 0..1 up the wall, 1..2 over the roof to the opening
    for (let k = 0; k < 240; k++) {   // long beams rising slantwise, both ways, and on over the roof
      const th0 = R() * TAU, dth = (R() < 0.5 ? -1 : 1) * (0.35 + R() * 0.35), pts = [];
      for (let q = 0; q <= 8; q++) { const t = q / 4; pts.push(surf(th0 + dth * t / 2, t)); }
      beam(pts, 2.2);
    }
    for (let k = 0; k < 140; k++) {   // shorter ones across them
      const th0 = R() * TAU, t0 = R() * 1.6, dth = (R() - 0.5) * 0.5, pts = [];
      for (let q = 0; q <= 4; q++) { const t = Math.min(2, t0 + q * 0.12); pts.push(surf(th0 + dth * q / 4, t)); }
      beam(pts, 1.6);
    }
    for (let k = 0; k < 24; k++) { const th = k / 24 * TAU, pts = []; for (let q = 0; q <= 6; q++) pts.push(surf(th + 0.05 * Math.sin(q), q / 6)); beam(pts, 3.2); }   // the big columns up the walls
    const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; C.root.add(m);
    C.exclPush(A.cx, A.cz, Math.max(ea, eb) + 6); if (C.CR) C.CR.exclAdd(A.cx, A.cz, Math.max(ea, eb) + 4);
    C.venueAt = (C.venueAt || []).concat([[A.cx, A.cz, Math.max(ea, eb) + 3]]);
  }
  /* the swimming hall: a box (its OSM outline) clad in bubbles: a pale blue wall and roof of irregular cells (a canvas texture, no text) */
  function pkAquatic(C, ring) {
    const A = axesOf(ring), cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d'), R = rng(31);
    x.fillStyle = '#5d9bcc'; x.fillRect(0, 0, 512, 512);
    for (let k = 0; k < 420; k++) { const cx = R() * 512, cy = R() * 512, r = 6 + R() * R() * 42;
      for (const [dx, dy] of [[0, 0], [512, 0], [-512, 0], [0, 512], [0, -512]]) { x.beginPath(); x.arc(cx + dx, cy + dy, r, 0, TAU); x.fillStyle = `rgba(${130 + R() * 50 | 0},${180 + R() * 40 | 0},235,0.45)`; x.fill(); x.lineWidth = 2; x.strokeStyle = 'rgba(225,240,250,0.6)'; x.stroke(); } }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; C.ownTex(t);
    const H = 31, P = (u, v, y) => [A.cx + A.ux * u + A.vx * v, y, A.cz + A.uz * u + A.vz * v], g = new GB(true), W1 = [1, 1, 1], S = 24, ins = [A.cx, H / 2, A.cz];
    const crn = [[-A.a, -A.b], [A.a, -A.b], [A.a, A.b], [-A.a, A.b]];
    for (let k = 0; k < 4; k++) { const [u0, v0] = crn[k], [u1, v1] = crn[(k + 1) % 4], l = Math.hypot(u1 - u0, v1 - v0);
      g.quadO(P(u0, v0, -0.1), P(u1, v1, -0.1), P(u1, v1, H), P(u0, v0, H), W1, ins, [[0, 0], [l / S, 0], [l / S, H / S], [0, H / S]]); }
    g.quadO(P(-A.a, -A.b, H), P(A.a, -A.b, H), P(A.a, A.b, H), P(-A.a, A.b, H), [0.82, 0.86, 0.92], [A.cx, 0, A.cz], [[0, 0], [2 * A.a / S, 0], [2 * A.a / S, 2 * A.b / S], [0, 2 * A.b / S]]);
    const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ map: t, vertexColors: true, emissive: 0x06101a })); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; C.root.add(m);
    C.exclPush(A.cx, A.cz, Math.max(A.a, A.b) * 1.3); if (C.CR) C.CR.exclAdd(A.cx, A.cz, Math.max(A.a, A.b) * 1.25);
    C.venueAt = (C.venueAt || []).concat([[A.cx, A.cz, Math.max(A.a, A.b) * 1.3]]);
  }
  /* the indoor arena: glass walls with white fins, a silver roof rising and falling in waves along its length */
  function pkArena(C, ring) {
    const A = axesOf(ring), g = C.scen.get(A.cx, A.cz), P = (u, v, y) => [A.cx + A.ux * u + A.vx * v, y, A.cz + A.uz * u + A.vz * v], H0 = 22, ins = [A.cx, 10, A.cz];
    const roofY = (u) => H0 + 4 + 6 * Math.sin((u / A.a) * Math.PI * 1.5 + 0.6) * 0.5 + 3 * (1 - (u / A.a) ** 2);
    const gls = [0.36, 0.48, 0.58], fin = [0.9, 0.9, 0.9], sil = [0.8, 0.82, 0.85], silD = [0.68, 0.7, 0.73], n = 16;
    for (let k = 0; k < n; k++) { const u0 = -A.a + 2 * A.a * k / n, u1 = u0 + 2 * A.a / n;
      for (const sv of [-1, 1]) { g.quadO(P(u0, sv * A.b, 0), P(u1, sv * A.b, 0), P(u1, sv * A.b, roofY(u1) - 1.5), P(u0, sv * A.b, roofY(u0) - 1.5), gls, ins); const fp = P(u0, sv * (A.b + 0.3), 0); box(g, fp[0], 0, fp[2], 0.5, roofY(u0) - 1.5, 0.6, Math.atan2(A.uz, A.ux), fin); }
      for (let j = 0; j < 4; j++) { const v0 = -A.b - 3 + (2 * A.b + 6) * j / 4, v1 = v0 + (2 * A.b + 6) / 4; g.quadO(P(u0, v0, roofY(u0)), P(u1, v0, roofY(u1)), P(u1, v1, roofY(u1)), P(u0, v1, roofY(u0)), j % 2 ? sil : silD, [A.cx, -40, A.cz]); } }
    for (const su of [-1, 1]) { const u = su * A.a; for (let j = 0; j < 4; j++) { const v0 = -A.b + 2 * A.b * j / 4, v1 = v0 + 2 * A.b / 4; g.quadO(P(u, v0, 0), P(u, v1, 0), P(u, v1, roofY(u) - 1.5), P(u, v0, roofY(u) - 1.5), gls, ins); } }
    C.exclPush(A.cx, A.cz, Math.max(A.a, A.b) + 6); if (C.CR) C.CR.exclAdd(A.cx, A.cz, Math.max(A.a, A.b) + 4);
    C.venueAt = (C.venueAt || []).concat([[A.cx, A.cz, Math.max(A.a, A.b) + 3]]);
  }
  /* the tower by the start straight: a square shaft of four pale legs with glass between, tapering, under a wide inverted trapezoid head of
     glass with a white frame (132 m) */
  function pkTower(C, ring) {
    const [cx, cz] = centroid(ring), g = C.scen.get(cx, cz), rot = 0.0, gl = [0.3, 0.38, 0.46], wh = [0.88, 0.88, 0.86], ins = (y) => [cx, y, cz];
    const sq = (y, h) => { const r = h; return [[-r, -r], [r, -r], [r, r], [-r, r]].map(([u, v]) => [cx + u, y, cz + v]); };
    const band = (y0, h0, y1, h1, col) => { const a = sq(y0, h0), b = sq(y1, h1); for (let k = 0; k < 4; k++) g.quadO(a[k], a[(k + 1) % 4], b[(k + 1) % 4], b[k], col, ins((y0 + y1) / 2)); };
    band(0, 12, 100, 8, gl);
    for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) for (let y = 0; y < 100; y += 10) { const f = y / 100, r = lerp(12, 8, f) + 0.2, r1 = lerp(12, 8, (y + 10) / 100) + 0.2; g.quadO([cx + u * r, y, cz + v * r - v * 2], [cx + u * r, y, cz + v * r], [cx + u * r1, y + 10, cz + v * r1], [cx + u * r1, y + 10, cz + v * r1 - v * 2], wh, ins(y)); g.quadO([cx + u * r - u * 2, y, cz + v * r], [cx + u * r, y, cz + v * r], [cx + u * r1, y + 10, cz + v * r1], [cx + u * r1 - u * 2, y + 10, cz + v * r1], wh, ins(y)); }
    band(100, 8, 104, 10, wh); band(104, 10, 124, 17, gl); band(124, 17, 127, 17, wh); band(127, 17, 132, 15, [0.6, 0.62, 0.65]);
    for (let y = 108; y < 124; y += 4) band(y, lerp(10, 17, (y - 104) / 20) + 0.05, y + 0.4, lerp(10, 17, (y + 0.4 - 104) / 20) + 0.05, wh);
    const t = sq(132, 15); g.quadO(t[0], t[1], t[2], t[3], [0.55, 0.57, 0.6], ins(120));
    C.exclPush(cx, cz, 20);
  }

  /* ---- the buildings round the park (OSM outlines and heights; unknown: a guess by kind and size): walls in Beijing's colours (pale tile,
     grey concrete, glass), a band of windows on every floor near the circuit, a flat roof; the slender towers north of the park with a
     wide platform on top ---- */
  const BCOL = [[0.78, 0.76, 0.72], [0.84, 0.8, 0.74], [0.62, 0.68, 0.74], [0.86, 0.86, 0.84]];
  function pkBuildings(C) {
    const { D, scen, exclPush, near } = C, glass = [0.28, 0.35, 0.42], roofC = [0.5, 0.5, 0.5], VA = C.venueAt || [];
    for (const [kd, h0, ring] of D.bld) {
      if (ring.length < 3) continue;
      const [cx, cz] = centroid(ring), q = near(cx, cz);
      if (q.d < 2) continue;
      if (VA.some(([x, z, r]) => (cx - x) ** 2 + (cz - z) ** 2 < r * r)) continue;   // (inside a venue's outline: the venue is drawn)
      const dTr = gAt(PG.dT, cx, cz); if (dTr > 1200 || cx < PG.x0 || cz < PG.z0 || cx > PG.x1 || cz > PG.z1) continue;
      const area = areaOf(ring), hv = hash(Math.round(cx), Math.round(cz));
      const H = h0 > 0 ? h0 : area < 120 ? 4 + 3 * hv : kd === 1 ? 18 + 24 * hv : kd === 2 ? 24 + 30 * hv : area > 12000 ? 22 + 10 * hv : area > 2500 ? 14 + 16 * hv : 8 + 10 * hv;
      const y0 = Math.max(pkGround(cx, cz), -0.3) - (dTr > 350 ? 0.6 : 0.2), y1 = y0 + 0.2 + H;   // (far off: its foot below the contact shadows' reach, there are many)
      const base = BCOL[kd], col = base.map(v => v * (0.9 + 0.16 * hv)), g = scen.get(cx, cz), ins = [cx, (y0 + y1) / 2, cz], floors = dTr < 260 && H > 5 ? Math.floor(H / 3.3) : 0;
      for (let k = 0; k < ring.length; k++) {
        const a = ring[k], b = ring[(k + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.3) continue;
        g.quadO([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], col, ins);
        if (floors && l > 4) { const ox = (b[1] - a[1]) / l, oz = -(b[0] - a[0]) / l, sgn = ((a[0] + b[0]) / 2 - cx) * ox + ((a[1] + b[1]) / 2 - cz) * oz > 0 ? 0.05 : -0.05, step = floors > 6 ? 2 : 1;
          for (let f = 0; f < floors; f += step) { const yb = y0 + 0.2 + f * 3.3 + 1.0, yt = yb + 1.4 * step; if (yt > y1 - 0.3) break;
            const A2 = [a[0] + ox * sgn + (b[0] - a[0]) * 0.5 / l, yb, a[1] + oz * sgn + (b[1] - a[1]) * 0.5 / l], B2 = [b[0] + ox * sgn - (b[0] - a[0]) * 0.5 / l, yb, b[1] + oz * sgn - (b[1] - a[1]) * 0.5 / l];
            g.quadO(A2, B2, [B2[0], yt, B2[2]], [A2[0], yt, A2[2]], kd === 2 ? [0.22, 0.3, 0.38] : glass, ins); } }
      }
      for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length]; g.triO([cx, y1, cz], [a[0], y1, a[1]], [b[0], y1, b[1]], roofC.map(v => v * (0.9 + 0.2 * hv)), [cx, y1 - 5, cz]); }
      if (H > 170 && area < 1200) cyl(g, cx, y1 - 6, cz, Math.sqrt(area / Math.PI) * 2.3, 6, 10, [0.9, 0.9, 0.88], [0.82, 0.83, 0.84], Math.sqrt(area / Math.PI) * 2.6);   // a slender tower's wide platform
      let r = 0; for (const p of ring) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cz)); exclPush(cx, cz, r * 0.9 + 1); if (C.CR) C.CR.exclAdd(cx, cz, r);
    }
  }
  /* ---- the roads and paths round the park (OSM; not the circuit, not the junction legs): asphalt, white lane lines on the two-lane
     carriageways, a yellow centre line on the others, pale paths; the bridges over the lakes (a deck, a white stone balustrade, piers);
     zebra crossings where OSM has them; the signals, bus shelters and lamps of OSM along them (scenery); parked cars in the car parks ---- */
  function pkRoads(C) {
    const { D, root, tex, scen, near } = C, G = PG;
    const road = new K.Chunks(512, true), path = new K.Chunks(512, true), mark = new K.Chunks(512), brg = new K.Chunks(512), aMat = C.aMat;
    const legs = C.legs || [];
    const inLeg = (x, z) => { for (const L of legs) { const dx = x - L.cx, dz = z - L.cz, r = dx * L.ux + dz * L.uz, v = -dx * L.uz + dz * L.ux; if (r > L.r0 - 2 && r < L.rEnd + 4 && Math.abs(v) < L.hw + 3) return true; } return false; };
    const yel = [0.95, 0.75, 0.12], wh = [0.93, 0.93, 0.9], segs = [];
    const lampAt = [];
    for (const [cls, hw0, lv, pts] of D.roads) {
      if (lv < 0) continue;   // (the avenue in its tunnel under the park)
      const isPath = /^(footway|path|cycleway|steps|pedestrian|track)$/.test(cls); if (isPath && cls !== 'pedestrian' && pts.every(q => gAt(G.dT, q[0], q[1]) > 320)) continue;
      const half = isPath ? Math.min(hw0, cls === 'pedestrian' ? 3.5 : 1.1) : hw0, bridge = lv > 0;
      const y = bridge ? 0.06 : isPath ? -0.03 : -0.02, tgt = isPath ? path : road, col = isPath ? [0.86, 0.84, 0.8] : [0.84, 0.84, 0.86];
      const P = []; for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 8)); for (let q = 0; q < n; q++) P.push([ax + (bx - ax) * q / n, az + (bz - az) * q / n]); }
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
              if (!isPath && half >= 2.8 && gAt(G.dT, p[0], p[1]) < 420) { const q0 = run[k - 1], ml = mark.get(p[0], p[1]), two = half >= 5, dash = Math.floor(acc / 8) % 2 === 0, c = two ? wh : yel, edges = gAt(G.dT, p[0], p[1]) < 220;
                if (!two || dash) ml.quadUp([q0[0] + nx * 0.07, y + 0.012, q0[1] + nz * 0.07], [q0[0] - nx * 0.07, y + 0.012, q0[1] - nz * 0.07], [p[0] - nx * 0.07, y + 0.012, p[1] - nz * 0.07], [p[0] + nx * 0.07, y + 0.012, p[1] + nz * 0.07], [c, c, c, c]);
                if (edges) for (const sg of [-1, 1]) { const e = half - 0.35; ml.quadUp([q0[0] + nx * sg * e, y + 0.012, q0[1] + nz * sg * e], [q0[0] + nx * sg * (e - 0.12), y + 0.012, q0[1] + nz * sg * (e - 0.12)], [p[0] + nx * sg * (e - 0.12), y + 0.012, p[1] + nz * sg * (e - 0.12)], [p[0] + nx * sg * e, y + 0.012, p[1] + nz * sg * e], [wh, wh, wh, wh]); } }
              if (bridge) { const gb = brg.get(p[0], p[1]), q0 = run[k - 1]; for (const sg of [-1, 1]) { const e0 = [q0[0] + nx * sg * (half + 0.2), q0[1] + nz * sg * (half + 0.2)], e1 = [p[0] + nx * sg * (half + 0.2), p[1] + nz * sg * (half + 0.2)];
                  gb.quadO([e0[0], WL - 0.2, e0[1]], [e1[0], WL - 0.2, e1[1]], [e1[0], y + 1.0, e1[1]], [e0[0], y + 1.0, e0[1]], [0.88, 0.88, 0.85], [p[0], y, p[1]]);
                  gb.quadUp([e0[0], y + 1.0, e0[1]], [e1[0], y + 1.0, e1[1]], [e1[0] - nx * sg * 0.35, y + 1.0, e1[1] - nz * sg * 0.35], [e0[0] - nx * sg * 0.35, y + 1.0, e0[1] - nz * sg * 0.35], [[0.94, 0.94, 0.92], [0.94, 0.94, 0.92], [0.94, 0.94, 0.92], [0.94, 0.94, 0.92]]);
                  gb.quadO([e0[0] - nx * sg * 0.35, y, e0[1] - nz * sg * 0.35], [e1[0] - nx * sg * 0.35, y, e1[1] - nz * sg * 0.35], [e1[0] - nx * sg * 0.35, y + 1.0, e1[1] - nz * sg * 0.35], [e0[0] - nx * sg * 0.35, y + 1.0, e0[1] - nz * sg * 0.35], [0.9, 0.9, 0.87], [p[0] + nx * sg * 5, y, p[1] + nz * sg * 5]); } }
              if (!isPath && !bridge && Math.floor(acc / 40) !== Math.floor((acc - 8) / 40) && gAt(G.dT, p[0], p[1]) < 420) lampAt.push([p[0] + nx * (half + 1.5), p[1] + nz * (half + 1.5), Math.atan2(-nz, -nx)]); }
            prevL = Lp; prevR = Rp;
          }
          segs.push({ run, half, isPath });
        }
        run = [];
      };
      for (const p of P) {
        const q = near(p[0], p[1]), bad = q.d < (isPath ? 1.5 : 0.8) || p[0] < G.x0 || p[1] < G.z0 || p[0] > G.x1 || p[1] > G.z1 || inLeg(p[0], p[1]) || (!bridge && isWet(p[0], p[1]));
        if (bad) flush(); else run.push(p);
      }
      flush();
    }
    road.addTo(root, aMat, false, true); path.addTo(root, new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true }), false, true); brg.addTo(root, C.matV, true, true);
    C.roadSegs = segs;
    // zebra crossings at OSM's crossings: across the nearest road, its full width
    const F = D.fur || {}, zb = mark;
    for (const [x, z] of F.crossing || []) { if (near(x, z).d < 1.5) continue;
      let best = null, bd = 30; for (const S of segs) { if (S.isPath) continue; for (let k = 0; k + 1 < S.run.length; k++) { const a = S.run[k], d = Math.hypot(a[0] - x, a[1] - z); if (d < bd) { bd = d; best = [S, k]; } } }
      if (!best || bd > 6) continue; const [S, k] = best, a = S.run[k], b = S.run[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l, nx = -tz, nz = tx, g = zb.get(x, z);
      for (let v = -S.half + 0.3; v < S.half - 0.3; v += 1.0) { const P0 = [a[0] + nx * v, a[1] + nz * v]; g.quadUp([P0[0] - tx * 2, 0.0, P0[1] - tz * 2], [P0[0] + nx * 0.5 - tx * 2, 0.0, P0[1] + nz * 0.5 - tz * 2], [P0[0] + nx * 0.5 + tx * 2, 0.0, P0[1] + nz * 0.5 + tz * 2], [P0[0] + tx * 2, 0.0, P0[1] + tz * 2], [wh, wh, wh, wh]); } }
    // OSM's signals, bus stops and lamps outside the circuit (scenery; inside its barriers the junctions' knockable furniture stands)
    const gr = [0.52, 0.54, 0.57], blk = [0.08, 0.08, 0.09];
    for (const [x, z] of F.traffic_signals || []) { if (near(x, z).d < 3 || C.excluded(x, z)) continue; const g = scen.get(x, z), a = hash(Math.round(x), Math.round(z)) * TAU;
      cyl(g, x, -0.1, z, 0.12, 6.2, 6, gr, null, 0.1); const ex = x + Math.cos(a) * 3, ez = z + Math.sin(a) * 3; box(g, ex, 5.9, ez, 6, 0.14, 0.14, a, gr); box(g, x + Math.cos(a) * 5.2, 4.6, z + Math.sin(a) * 5.2, 0.34, 1.1, 0.3, a, blk); box(g, x, 2.6, z, 0.3, 1.0, 0.3, a, blk); }
    for (const [x, z] of F.bus_stop || []) { if (near(x, z).d < 4 || C.excluded(x, z)) continue; const g = scen.get(x, z), a = hash(Math.round(z), Math.round(x)) * TAU, st = [0.42, 0.44, 0.48];
      box(g, x, 2.3, z, 3.6, 0.14, 1.6, a, st, [0.62, 0.63, 0.66]); box(g, x, 0, z, 3.4, 2.3, 0.05, a, [0.56, 0.68, 0.76]); box(g, x + Math.cos(a) * 1.7, 0, z + Math.sin(a) * 1.7, 0.12, 2.3, 1.2, a, [0.9, 0.92, 0.94]); }
    for (const [x, z, a] of lampAt) { if (near(x, z).d < 2 || C.excluded(x, z)) continue; const g = scen.get(x, z);
      cyl(g, x, -0.2, z, 0.1, 9.6, 5, gr, null, 0.06); box(g, x + Math.cos(a) * 1.0, 9.2, z + Math.sin(a) * 1.0, 2.0, 0.1, 0.1, a, gr); box(g, x + Math.cos(a) * 2.0, 9.0, z + Math.sin(a) * 2.0, 0.7, 0.2, 0.3, a, [0.4, 0.42, 0.45], [0.5, 0.52, 0.55]); }
    // the car parks: white bays and parked cars
    const carG = pkCarGeo(), cars = new K.IChunks(carG, new THREE.MeshLambertMaterial({ vertexColors: true }), 512), R = rng(767), W1 = [1, 1, 1];
    const CARC = [[0.92, 0.92, 0.92], [0.12, 0.12, 0.13], [0.5, 0.52, 0.55], [0.7, 0.1, 0.1], [0.15, 0.25, 0.55], [0.78, 0.78, 0.8], [0.3, 0.32, 0.35], [0.95, 0.95, 0.95], [0.6, 0.5, 0.36]];
    let nCars = 0;
    for (const [cl, ring] of D.lu) { if (cl !== 'parking') continue;
      let best = 0, ux = 1, uz = 0; for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; ux = (b[0] - a[0]) / l; uz = (b[1] - a[1]) / l; } }
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of ring) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      const vx = -uz, vz = ux, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ext = Math.hypot(x1 - x0, z1 - z0) / 2;
      if (gAt(G.dT, cx, cz) > 600) continue;
      for (let a = -ext; a < ext; a += 2.6) for (let b = -ext; b < ext; b += 6.2) {
        const row = Math.round(b / 6.2), x = cx + ux * a + vx * b, z = cz + uz * a + vz * b;
        if (!K.inPoly(ring, x, z) || K.polyDist(ring, x, z) < 1.5 || near(x, z).d < 2 || C.excluded(x, z)) continue;
        if (Math.abs(row) % 2 === 0) { const g = mark.get(x, z), yb = pkGround(x, z) + 0.06, p = (s, t) => [x + ux * s + vx * t, yb, z + uz * s + vz * t]; g.quadUp(p(-1.3, -2.6), p(-1.18, -2.6), p(-1.18, 2.6), p(-1.3, 2.6), [W1, W1, W1, W1]); }
        if (R() < 0.38) { const yaw = Math.atan2(vz, vx) + (R() < 0.5 ? Math.PI : 0) + (R() - 0.5) * 0.06, col = CARC[Math.floor(R() * CARC.length)], k = 0.85 + 0.25 * R();
          cars.add(x, pkGround(x, z) + 0.04, z, -yaw, 1, 1, [col[0] * k, col[1] * k, col[2] * k]); nCars++; }
      }
    }
    mark.addTo(root, C.lMat, false, true);
    cars.addTo(root, false); C.out.parkedCars = nCars;
  }
  function pkCarGeo() {   // a parked car (4.6 m long along x, 1.8 m wide): the body in the instance colour, dark glass, black tyres
    const g = new GB(), W1 = [1, 1, 1], gl = [0.12, 0.15, 0.18], tyre = [0.06, 0.06, 0.07];
    box(g, 0, 0.3, 0, 4.6, 0.64, 1.8, 0, W1, W1, true); box(g, -0.2, 0.94, 0, 2.5, 0.56, 1.62, 0, gl, W1, true);
    for (const z of [-0.8, 0.8]) box(g, 0, 0.0, z, 3.5, 0.6, 0.24, 0, tyre, tyre, true);
    return g.geometry();
  }

  /* ---- the junctions (def.junctions): the side road's leg from the circuit's edge out past its fence (the barrier opens into its mouth up to
     the fence, Core: def.walls), its sidewalks beyond; in the mouth the paved corners, the zebra crossing and the stop line, lane arrows;
     the road closed beyond the fence by red and white water-filled barriers and a blue fence; the street furniture of the junction, all of
     it knockable (World props -> Core's loose props) ---- */
  function pkLegs(C) {
    const { T, def, w } = C, JOFF = def.junctionOff || 12;
    C.legs = (def.junctions || []).map(([d, sd, ang, hw, kind, len, what]) => {
      const s = C.sAt(d), i = T.idx(s), a = ang * Math.PI / 180, tx = T.tx[i], tz = T.tz[i], nx = T.nx[i] * sd, nz = T.nz[i] * sd, ca = Math.cos(a), sa = Math.sin(a);
      const ux = tx * ca + nx * sa, uz = tz * ca + nz * sa, sn = Math.max(0.35, sa);
      const ct = ca / sn, e = hw / sn, qa = Math.min(w * ct, (w + JOFF) * ct) - e - 4.5, qb = Math.max(w * ct, (w + JOFF) * ct) + e + 4.5;
      return { d, sd, a, hw, kind, len, what, s, i, cx: T.px[i], cz: T.pz[i], ux, uz, vx: -uz, vz: ux, tx, tz, nx, nz, r0: w / sn, rF: (w + JOFF) / sn, rEnd: (w + JOFF) / sn + len, qa, qb };
    });
  }
  function pkJunctions(C) {
    const { T, w, root, scen, out, near, aMat, lMat, exclPush } = C, legs = C.legs || [], W1 = [1, 1, 1], wh = [0.94, 0.94, 0.9], walk = [0.86, 0.83, 0.8], curbC = [0.7, 0.69, 0.66];
    const gr = new K.Chunks(512, true), gm = new GB(), gs = new K.Chunks(512, true);
    const prop = (kind, x, z, yaw, col) => { const q = near(x, z); if (q.d > -0.7 || Math.abs(q.lat) < w + 0.7) return false; out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0, i: q.i }); C.nJ = (C.nJ || 0) + 1; return true; };
    for (const L of legs) {
      const P = (r, v) => [L.cx + L.ux * r + L.vx * v, L.cz + L.uz * r + L.vz * v], Q = (r, v, y) => { const p = P(r, v); return [p[0], y, p[1]]; };
      const yaw = (x, z) => Math.atan2(z, x), yV = yaw(L.vx, L.vz), ped = L.kind === 'ped';
      // the leg: the carriageway in the mouth and beyond the fence (a plaza: granite paving), sidewalks with granite kerbs beyond the fence
      const surf = ped ? gs : gr, sc = ped ? [0.86, 0.86, 0.86] : [0.82, 0.82, 0.84], uS = ped ? 3 : 8;
      for (let r = L.r0 - 0.3; r < L.rEnd; r += 3) { const r1 = Math.min(L.rEnd, r + 3), g = surf.get(...P(r, 0)), y = r < L.rF + 0.6 ? 0.024 : -0.02, A = Q(r, -L.hw, y), B = Q(r, L.hw, y), Cq = Q(r1, L.hw, y), Dq = Q(r1, -L.hw, y), uv = (p) => [p[0] / uS, -p[2] / uS];
        g.quadUp(A, B, Cq, Dq, [sc, sc, sc, sc], [uv(A), uv(B), uv(Cq), uv(Dq)]);
        if (!ped && r > L.rF + 0.6) for (const sg of [-1, 1]) { const ys = 0.15, a0 = Q(r, sg * L.hw, ys), a1 = Q(r, sg * (L.hw + 4), ys), b1 = Q(r1, sg * (L.hw + 4), ys), b0 = Q(r1, sg * L.hw, ys), gg = gs.get(a0[0], a0[2]);
          gg.quadUp(a0, a1, b1, b0, [walk, walk, walk, walk], [[a0[0] / 1.6, -a0[2] / 1.6], [a1[0] / 1.6, -a1[2] / 1.6], [b1[0] / 1.6, -b1[2] / 1.6], [b0[0] / 1.6, -b0[2] / 1.6]]);
          gg.quadO(Q(r, sg * L.hw, -0.05), Q(r1, sg * L.hw, -0.05), Q(r1, sg * L.hw, ys), Q(r, sg * L.hw, ys), curbC, Q(r, sg * (L.hw + 1), 0));
          if (Math.floor(r / 7) !== Math.floor((r + 3) / 7)) C.trees.push([...P(r, sg * (L.hw + 1.5)), 0, 1]); } }
      // the road closed beyond the fence: red and white water-filled barriers, a blue fence behind them
      { const r = L.rF + 1.2, g = scen.get(...P(r, 0)), n = Math.max(2, Math.round(L.hw * 2 / 1.9));
        for (let k = 0; k < n; k++) { const v = -L.hw + (k + 0.5) * 2 * L.hw / n, [x, z] = P(r, v); box(g, x, 0, z, 1.8, 0.85, 0.5, yV, k % 2 ? [0.95, 0.95, 0.93] : [0.86, 0.14, 0.12], k % 2 ? [0.98, 0.98, 0.96] : [0.92, 0.2, 0.16]); }
        const [fx, fz] = P(r + 1.2, 0); box(g, fx, 0, fz, L.hw * 2 + 1, 1.9, 0.06, yV, [0.18, 0.42, 0.74]); }
      // in the mouth: the paved corners either side of the leg
      for (let q = L.qa - 3; q <= L.qb + 3; q += 0.5) {
        const s = L.s + q, i = T.idx(s), bar = L.sd > 0 ? T.br[i] : T.bl[i]; if (bar < w + 3) continue;
        for (let l = w + 0.6; l < bar - 0.3; l += 0.5) {
          const l1 = Math.min(bar - 0.3, l + 0.5), cs = [[q, l], [q + 0.5, l], [q + 0.5, l1], [q, l1]].map(([qq, ll]) => { const p = C.atSf(L.s + qq, L.sd * ll); return [p[0], 0.15, p[1]]; });
          const mx = (cs[0][0] + cs[2][0]) / 2, mz = (cs[0][2] + cs[2][2]) / 2, dx = mx - L.cx, dz = mz - L.cz, v = dx * L.vx + dz * L.vz, r = dx * L.ux + dz * L.uz;
          if (r < L.r0 + 0.3 || Math.abs(v) < L.hw + 0.2 || Math.abs(v) > L.hw + 4) continue;
          const g = gs.get(mx, mz); g.quadUp(cs[0], cs[1], cs[2], cs[3], [walk, walk, walk, walk], cs.map(p => [p[0] / 1.6, -p[2] / 1.6]));
        }
      }
      // markings in the mouth: the zebra crossing over the leg (broad bars), the stop line and arrows on the lane coming in
      const z0 = L.r0 + 1.6, z1 = L.r0 + 6.0, yM = 0.045;
      if (!ped && z1 < L.rF - 1) { for (let v = -L.hw + 0.4; v < L.hw - 0.3; v += 1.0) gm.quadUp(Q(z0, v, yM), Q(z0, v + 0.45, yM), Q(z1, v + 0.45, yM), Q(z1, v, yM), [wh, wh, wh, wh]);
        gm.quadUp(Q(z1 + 1.0, 0, yM), Q(z1 + 1.0, L.hw - 0.2, yM), Q(z1 + 1.4, L.hw - 0.2, yM), Q(z1 + 1.4, 0, yM), [wh, wh, wh, wh]);
        for (let v = 1.75; v < L.hw - 0.5; v += 3.5) { const a0 = z1 + 3.0, a1 = a0 + 3.2; gm.quadUp(Q(a1, v - 0.08, yM), Q(a1, v + 0.08, yM), Q(a0 + 0.9, v + 0.08, yM), Q(a0 + 0.9, v - 0.08, yM), [wh, wh, wh, wh]); gm.triO(Q(a0, v, yM), Q(a0 + 0.9, v - 0.35, yM), Q(a0 + 0.9, v + 0.35, yM), wh, Q(a0 + 0.5, v, yM - 1)); }   // an arrow ahead (towards the circuit)
        if (L.hw >= 3.5) for (let r = z1 + 1.6; r < L.rF - 0.6; r += 1) gm.quadUp(Q(r, -0.2, yM), Q(r, -0.08, yM), Q(Math.min(r + 1, L.rF - 0.6), -0.08, yM), Q(Math.min(r + 1, L.rF - 0.6), -0.2, yM), [[0.95, 0.75, 0.12], [0.95, 0.75, 0.12], [0.95, 0.75, 0.12], [0.95, 0.75, 0.12]]); }
      // a worn crossing over the circuit itself where the park's lights are (its roads are open outside race days)
      if (L.kind === 'sig') { const qc = -(L.hw / Math.sin(L.a) + 2.6), gw = [0.8, 0.8, 0.78]; for (let l = -w + 0.6; l < w - 0.4; l += 1.0) { const a = C.atSf(L.s + qc - 2, l), b = C.atSf(L.s + qc - 2, l + 0.45), c = C.atSf(L.s + qc + 2, l + 0.45), d = C.atSf(L.s + qc + 2, l);
        gm.quadUp([a[0], 0.04, a[1]], [b[0], 0.04, b[1]], [c[0], 0.04, c[1]], [d[0], 0.04, d[1]], [gw, gw, gw, gw]); } }
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
  }

  /* ---- trees: Chinese scholar trees and ashes (round crowns) in the rows along the boulevards and in the groves, poplars and ginkgos (tall,
     narrow), weeping willows along the lakes, Chinese pines (dark, flat tiers) in the groves; from the land cover (ESA WorldCover's tree cells)
     and OSM's woods, tree rows and single trees; instanced per 512 m chunk, kept off the circuit, the buildings, the roads ---- */
  function pkTreeGeo(kind) {
    const g = new GB(), R = rng(700 + kind), lf = [0.3, 0.44, 0.22], lfD = [0.24, 0.36, 0.18], bk = [0.34, 0.29, 0.24];
    if (kind === 0) { cyl(g, 0, 0, 0, 0.024, 0.42, 4, bk, null, 0.016); K.puff(g, 0, 0.64, 0, 0.32, 0.72, lf, R, 0.22, 0.55, 1.12); }   // scholar tree / ash
    else if (kind === 1) { cyl(g, 0, 0, 0, 0.03, 0.32, 5, bk, null, 0.022); ico(g, 0, 0.6, 0, 0.15, 2.8, [0.32, 0.46, 0.22], R, 0.15); }   // poplar / ginkgo
    else if (kind === 2) { cyl(g, 0, 0, 0, 0.026, 0.36, 5, bk, null, 0.02); K.puff(g, 0, 0.55, 0, 0.38, 0.62, [0.46, 0.58, 0.28], R, 0.25, 0.6, 1.1); ico(g, 0, 0.36, 0, 0.36, 0.5, [0.42, 0.54, 0.26], R, 0.3); }   // weeping willow
    else { cyl(g, 0, 0, 0, 0.035, 0.5, 5, [0.42, 0.3, 0.24], null, 0.025); for (const [y, r] of [[0.45, 0.34], [0.68, 0.26]]) cone(g, 0, y, 0, r, 0.2, 6, [0.16, 0.28, 0.18], [0.2, 0.34, 0.22], R() * TAU); }   // Chinese pine: flat dark tiers
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function pkTrees(C) {
    const { root, near, D } = C, G = PG, R = rng(1949), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const GEO = [0, 1, 3].map(k => pkTreeGeo(k)), IC = GEO.map(g => new K.IChunks(g, mat, 512)), ICf = GEO.map(g => new K.IChunks(g, mat, 512));   // (ICf: past 90 m from the circuit, no shadows)
    let n = 0;
    const put = (x, z, sp, h, force) => {
      const q = near(x, z); if (q.d < 2.5 || isWet(x, z)) return;
      if (!force && C.excluded(x, z)) return;
      const tone = 0.85 + 0.3 * R(), col = [tone * (0.95 + 0.1 * R()), tone, tone * (0.9 + 0.1 * R())];
      const k = sp === 3 ? 2 : sp === 2 ? 0 : sp, wil = sp === 2, c2 = wil ? [col[0] * 1.12, col[1] * 1.1, col[2] * 0.85] : col;   // (a willow: the round crown, wider, flatter, paler)
      (gAt(G.dT, x, z) < 90 ? IC : ICf)[k].add(x, pkGround(x, z) - 0.1, z, R() * TAU, k === 1 ? h * 0.7 : wil ? h * 1.25 : h, wil ? h * 0.8 : h, c2); n++;
    };
    // the boulevards' and the legs' rows (pkStreet, pkJunctions): scholar trees, now and then a poplar
    for (const [x, z] of C.trees) put(x, z, R() < 0.85 ? 0 : 1, 9 + R() * 4);
    // OSM: tree rows (a tree every 6 m) and single trees
    for (const row of D.rows || []) for (let k = 0; k + 1 < row.length; k++) { const a = row[k], b = row[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let t = 0; t < l; t += 6) put(a[0] + (b[0] - a[0]) * t / l, a[1] + (b[1] - a[1]) * t / l, R() < 0.7 ? 0 : 1, 9 + R() * 5); }
    for (const [x, z] of D.trees || []) put(x, z, 0, 8 + R() * 6);
    for (const S of C.roadSegs || []) { if (!S.isPath) continue; let acc = 0;   // rows along the footpaths near the circuit (a tree every 11 m, alternating sides)
      for (let k = 1; k < S.run.length; k++) { const a = S.run[k - 1], b = S.run[k], l = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += l; if (acc < 11) continue; acc = 0;
        if (gAt(G.dT, b[0], b[1]) > 450) continue; const sg = k % 2 ? 1 : -1, nx = -(b[1] - a[1]) / (l || 1), nz = (b[0] - a[0]) / (l || 1); put(b[0] + nx * sg * 2.6, b[1] + nz * sg * 2.6, R() < 0.8 ? 0 : 1, 8 + R() * 5); } }
    // the groves (WorldCover's tree cells and OSM woods): denser near the circuit; willows by the water, pines in the groves
    for (let j = 1; j < G.nz - 1; j += 2) for (let i = 1; i < G.nx - 1; i += 2) {
      const k = j * G.nx + i, kd = G.kind[k]; if (G.wet[k] || kd === 5 || kd === 7 || kd === 8 || kd === 4) continue;
      const dT = G.dT[k], p = kd === 1 ? (dT < 300 ? 0.45 : dT < 700 ? 0.16 : 0.05) : kd === 0 || kd === 6 ? (dT < 500 ? 0.08 : 0.025) : 0.004; if (R() > p) continue;
      const x = G.x0 + i * G.c + (R() - 0.5) * 8, z = G.z0 + j * G.c + (R() - 0.5) * 8;
      const sd = G.SD[k], sp = sd < 10 ? 2 : R() < 0.25 ? 3 : R() < 0.12 ? 1 : 0;
      put(x, z, sp, sp === 3 ? 8 + R() * 6 : sp === 2 ? 8 + R() * 4 : 9 + R() * 7);
    }
    for (const ic of IC) ic.addTo(root, true);
    for (const ic of ICf) ic.addTo(root, false);
    C.out.treeN = n;
  }

  /* ---- beyond the near park: the land round the city (SRTM: the hills to the west and north), the city's towers (OSM heights); drawn on a
     shell just inside the camera's far plane round the camera, each vertex along its own direction (as Montréal's far view), hazed ---- */
  function pkFar(C) {
    const { D } = C, F = D.far, n = F.n, raw = b64(F.b64), G = PG, P0 = [], Cl = [], I = [];
    const H = (i, j) => raw[clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)] * F.step;
    const inNear = (x, z) => x > G.x0 + 60 && x < G.x1 - 60 && z > G.z0 + 60 && z < G.z1 - 60;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell, h = Math.max(0, H(i, j)) * 1.0, q = hash(i, j) - 0.5;
      const c = h > 160 ? [0.36 + q * 0.04, 0.4 + q * 0.04, 0.32] : [0.58 + q * 0.05, 0.57 + q * 0.05, 0.53 + q * 0.04];   // (the hills' woods and scrub; the plain all city)
      P0.push(x, h - 1.5, z); Cl.push(...c);
    }
    for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) { const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      const xa = F.x0 + i * F.cell, za = F.z0 + j * F.cell; if (inNear(xa, za) && inNear(xa + F.cell, za + F.cell)) continue; I.push(a, c, b, b, c, d); }
    const vq = (p, col) => { P0.push(p[0], p[1], p[2]); Cl.push(col[0], col[1], col[2]); return P0.length / 3 - 1; };
    const quad = (a, b, c, d, col) => { const k = [a, b, c, d].map(p => vq(p, col)); I.push(k[0], k[1], k[2], k[0], k[2], k[3]); };
    for (const [h, ring] of D.towers) { const [cx, cz] = centroid(ring); if (inNear(cx, cz)) continue;
      const y0 = -2, y1 = y0 + h, hv = hash(Math.round(cx), Math.round(cz)), wc = hv < 0.35 ? [0.5, 0.56, 0.62] : hv < 0.7 ? [0.74, 0.73, 0.7] : [0.6, 0.6, 0.6];
      for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], ox = b[1] - a[1], oz = -(b[0] - a[0]), outw = ((a[0] + b[0]) / 2 - cx) * ox + ((a[1] + b[1]) / 2 - cz) * oz > 0, sh = 0.82 + 0.18 * Math.abs(ox) / (Math.hypot(ox, oz) || 1);
        const col = wc.map(v => v * sh); if (outw) quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], col); else quad([b[0], y0, b[1]], [a[0], y0, a[1]], [a[0], y1, a[1]], [b[0], y1, b[1]], col); }
      for (let k = 1; k + 1 < ring.length; k++) { const A = vq([ring[0][0], y1, ring[0][1]], [0.5, 0.5, 0.5]), B = vq([ring[k + 1][0], y1, ring[k + 1][1]], [0.5, 0.5, 0.5]), Cc = vq([ring[k][0], y1, ring[k][1]], [0.5, 0.5, 0.5]); I.push(A, B, Cc); }
    }
    const nv = P0.length / 3, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(Cl), 3));
    g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1)); g.setIndex(I); g.computeVertexNormals();
    const U = { uHz: { value: new THREE.Color(0xc8c6bc) } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
    m.customProgramCacheKey = () => 'pkFar';
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'pkFar';
    mesh.onBeforeRender = (r, sc) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); };
    C.root.add(mesh);
    const Pf = Float32Array.from(P0), S = { cx: 1e9, cy: 0, cz: 0, cf: 0 };
    return (cam) => {
      if (!cam) return; const c = cam.position;
      cam.getWorldDirection(_fd); const top = Math.asin(clamp(_fd.y, -1, 1)) + (cam.fov || 50) * Math.PI / 360 * 1.15; mesh.visible = top > -0.02; if (!mesh.visible) return;
      if (Math.abs(c.x - S.cx) + Math.abs(c.y - S.cy) + Math.abs(c.z - S.cz) < 2 && cam.far === S.cf) return;
      S.cx = c.x; S.cy = c.y; S.cz = c.z; S.cf = cam.far;
      const p = g.attributes.position.array, hz = g.attributes.aHz.array, R0 = cam.far - 60, R1 = cam.far - 5;
      for (let v = 0, k = 0; k < Pf.length; v++, k += 3) { const dx = Pf[k] - c.x, dy = Pf[k + 1] - c.y, dz = Pf[k + 2] - c.z, Dd = Math.max(1, Math.sqrt(dx * dx + dy * dy + dz * dz)), r = R0 + (R1 - R0) * (1 - Math.exp(-Math.max(0, Dd - 300) / 2500)), f = r / Dd;
        p[k] = c.x + dx * f; p[k + 1] = c.y + dy * f; p[k + 2] = c.z + dz * f; hz[v] = 0.42 + 0.5 * (1 - Math.exp(-Math.max(0, Dd - 400) / 3500)); }   // (the smog: the far land fades sooner than elsewhere)
      g.attributes.position.needsUpdate = true; g.attributes.aHz.needsUpdate = true;
    };
  }
  const _fd = new THREE.Vector3();
  World.theme('peking', buildPeking);
})();
