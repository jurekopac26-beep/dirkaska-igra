/* =========================================================================
   WORLD — Trois-Rivières (theme 'troisrivieres'): its own builder (World.ext.troisrivieres), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, RB, TAU, atS, atSf, box, clamp, clearance, cone, crAt, crowdCtx, crowdFinish, crowdRun, crowdUV, cyl, gable, hjB64,
    hjI16, ico, inPoly, lerp, nearest, nrChamfer, polyDist, rng, roadsideProps, rpHash, sstep, valueNoise2, vary, wrapS
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= TROIS-RIVIÈRES (theme 'troisrivieres') =================
     The street circuit round the exhibition grounds of Trois-Rivières (Québec) on its real ground: the terrain from the track file's model
     (TR.dem, the start line's ground = 0) blended into the road's height round the circuit, coloured by the land cover (ESA WorldCover) and the
     land use (OSM); the city's streets with their sidewalks, yellow centre lines, crossings and stop lines (OSM); the buildings on their real
     footprints and heights (OSM; Microsoft's footprints where the map has none), the plexes with their front balconies and outside stairs,
     flat roofs and gables; maples, ashes and spruces (OSM trees, the street trees, the woods of the land cover); wooden utility poles with
     their wires and lamps; parked cars; the circuit's concrete walls with catch fences, tyre walls round the corner run-offs, the gateway at
     Turn 3, the pit lane on the left of the main straight with the teams' tents, grandstands and the crowd; the old arena, the ballpark, the
     racecourse and the fair's halls; the junctions with their street furniture (knockable: def.streetProps); the land out to 3 km and the long
     steel bridge over the river beyond the city (trFar, drawn as Irohazaka's view: irFarUpdate). No names of firms, events or people. */
  let TRW = null;   // per-build data: the decoded scenery (grids, polygons), the road's sample hash
    function trPrep() {
    const D = T.def.tr, P = TRW = {};
    { const E = D.dem, b = hjB64(E.b64), h = new Float32Array(b.length); for (let k = 0; k < b.length; k++) h[k] = E.lo + b[k] * E.step; P.dem = h; P.D = E; }
    { const E = D.lc, b = hjB64(E.b64), a = new Uint8Array(E.nx * E.nz); let k = 0; for (const v of b) { const n = (v & 31) + 1; a.fill(v >> 5, k, k + n); k += n; } P.lc = a; P.L = E; }
    // buildings: { kind, osm, h, pts: [[x, z]...] (counter-clockwise seen from above), bb }
    P.bld = []; { const a = hjI16(D.bld); for (let k = 0; k < a.length;) { const n = a[k], kb = a[k + 1], h = a[k + 2] / 10, pts = []; for (let j = 0; j < n; j++) pts.push([a[k + 3 + j * 2] / 5, a[k + 4 + j * 2] / 5]); k += 3 + n * 2; P.bld.push({ kind: kb >> 1, osm: kb & 1, h, pts }); } }
    P.rd = []; { const a = hjI16(D.rd); for (let k = 0; k < a.length;) { const n = a[k], c = a[k + 1], pts = []; for (let j = 0; j < n; j++) pts.push([a[k + 2 + j * 2] / 2, a[k + 3 + j * 2] / 2]); k += 2 + n * 2; P.rd.push({ cl: c & 15, br: c >> 4, pts }); } }
    P.lu = []; { const a = hjI16(D.lu); for (let k = 0; k < a.length;) { const n = a[k], c = a[k + 1], pts = []; for (let j = 0; j < n; j++) pts.push([a[k + 2 + j * 2] / 2, a[k + 3 + j * 2] / 2]); k += 2 + n * 2; P.lu.push({ cl: c, pts }); } }
    P.trees = []; { const a = hjI16(D.tr); for (let k = 0; k < a.length; k += 2) P.trees.push([a[k] / 2, a[k + 1] / 2]); }
    P.pt = []; { const a = hjI16(D.pt); for (let k = 0; k < a.length; k += 3) P.pt.push([a[k], a[k + 1] / 2, a[k + 2] / 2]); }
    const bb = (o) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of o.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } o.bb = [x0, z0, x1, z1]; return o; };
    P.bld.forEach(bb); P.lu.forEach(bb); P.rd.forEach(bb);
    // a 16 m grid of what lies where: the land-use polygons and the buildings that touch each cell (point lookups), the streets near it
    const G = P.G = { x0: -1100, z0: -1000, c: 16, nx: 140, nz: 130 }, cell = (x, z) => clamp(Math.floor((x - G.x0) / G.c), 0, G.nx - 1) + clamp(Math.floor((z - G.z0) / G.c), 0, G.nz - 1) * G.nx;
    G.lu = new Array(G.nx * G.nz); G.b = new Array(G.nx * G.nz); G.r = new Array(G.nx * G.nz);
    const reg = (A, o, k, m) => { const [x0, z0, x1, z1] = o.bb; for (let a = Math.floor((x0 - m - G.x0) / G.c); a <= Math.floor((x1 + m - G.x0) / G.c); a++) for (let b = Math.floor((z0 - m - G.z0) / G.c); b <= Math.floor((z1 + m - G.z0) / G.c); b++) {
      if (a < 0 || b < 0 || a >= G.nx || b >= G.nz) continue; const c = a + b * G.nx; (A[c] || (A[c] = [])).push(k); } };
    P.lu.forEach((o, k) => reg(G.lu, o, k, 0)); P.bld.forEach((o, k) => reg(G.b, o, k, 0)); P.rd.forEach((o, k) => reg(G.r, o, k, 14));
    P.cell = cell;
    P.n1 = valueNoise2(611, 40); P.n2 = valueNoise2(612, 9); P.n3 = valueNoise2(613, 120);
    P.hcache = new Map();
  }
  const TR_RW = [7.5, 6.5, 6, 5.5, 4.5, 4, 3, 3, 0.9, 1.2, 2.2, 3.5, 3];   // the streets' half widths by class (rd)
  function trDem(x, z) { const E = TRW.D, a = TRW.dem, gx = clamp((x - E.x0) / E.cell, 0, E.nx - 1.001), gz = clamp((z - E.z0) / E.cell, 0, E.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = E.nx;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v; }
  function trLC(x, z) { const L = TRW.L, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell); return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? 2 : TRW.lc[j * L.nx + i]; }
  function trLCf(x, z, c) { const L = TRW.L, fx = (x - L.x0) / L.cell - 0.5, fz = (z - L.z0) / L.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const at = (a, b) => (a < 0 || b < 0 || a >= L.nx || b >= L.nz ? 0 : TRW.lc[b * L.nx + a] === c ? 1 : 0);
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v; }
  function trLU(x, z) {   // the land-use class at (x, z) (the smallest polygon wins: they come largest first), -1 none
    const L = TRW.G.lu[TRW.cell(x, z)]; if (!L) return -1; let r = -1;
    for (const k of L) { const o = TRW.lu[k], b = o.bb; if (x < b[0] || x > b[2] || z < b[1] || z > b[3]) continue; if (inPoly(o.pts, x, z)) r = o.cl; }
    return r; }
  function trInBld(x, z, m) {   // inside a building's footprint (grown by m)
    const L = TRW.G.b[TRW.cell(x, z)]; if (!L) return false;
    for (const k of L) { const o = TRW.bld[k], b = o.bb; if (x < b[0] - m || x > b[2] + m || z < b[1] - m || z > b[3] + m) continue; if (inPoly(o.pts, x, z) || (m > 0 && polyDist(o.pts, x, z) < m)) return true; }
    return false; }
  function trRoadD(x, z, maxCl) {   // distance beyond the asphalt edge of the nearest street (class <= maxCl, not the pit lane), its class: TRRD
    const L = TRW.G.r[TRW.cell(x, z)]; TRRD.d = 99; TRRD.cl = -1; TRRD.k = -1; TRRD.seg = 0; if (!L) return TRRD;
    for (const k of L) { const o = TRW.rd[k]; if (o.cl > (maxCl == null ? 9 : maxCl) || o.cl === 8) continue; const P = o.pts, hw = TR_RW[o.cl];
      for (let j = 0; j + 1 < P.length; j++) { const ax = P[j][0], az = P[j][1], vx = P[j + 1][0] - ax, vz = P[j + 1][1] - az, l2 = vx * vx + vz * vz || 1, t = clamp(((x - ax) * vx + (z - az) * vz) / l2, 0, 1), d = Math.hypot(x - ax - vx * t, z - az - vz * t) - hw;
        if (d < TRRD.d) { TRRD.d = d; TRRD.cl = o.cl; TRRD.k = k; TRRD.seg = j; } } }
    return TRRD; }
  const TRRD = { d: 99, cl: -1, k: -1, seg: 0 };
  function trH(x, z) {   // terrain height: the road's height inside the barriers and on the verges, blended into the model's ground 4-60 m beyond them
    const n = nearest(x, z), f = trDem(x, z) + (TRW.n1(x, z) - 0.5) * 0.4;
    if (n.i < 0) return f;
    const dd = Math.abs(n.lat) - n.bar, hr = T.hy[n.i] - 0.02, h = dd <= 0.5 ? hr - 0.3 : lerp(hr, f, sstep(4, 60, dd));
    return dd < 18 ? Math.min(h, hr - 0.3) : h;   // (under the road's level inside the walls and on 18 m beyond them: the big cells never rise through the verges)
  }
  function trGH(i, j, cell, x0, z0) { const k = (i + 30000) * 65536 + j + 30000 + cell * 1e10, c = TRW.hcache; let h = c.get(k); if (h === undefined) { h = trH(x0 + i * cell, z0 + j * cell); c.set(k, h); } return h; }
  function trGround(x, z) {   // the terrain mesh's surface (4 m cells in the tiles near the circuit, 16 m beyond: the same two triangles per cell as the mesh)
    const G = TRW.TG, ti = Math.floor((x - G.x0) / G.L), tj = Math.floor((z - G.z0) / G.L), st = ti < 0 || tj < 0 || ti >= G.n || tj >= G.n ? 2 : G.st[tj * G.n + ti], cell = st === 1 ? 4 : st === 3 ? 8 : st === 4 ? 16 : 32;
    const gx = (x - G.x0) / cell, gz = (z - G.z0) / cell, i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = trGH(i, j, cell, G.x0, G.z0); return a + u * (trGH(i + 1, j, cell, G.x0, G.z0) - a) + v * (trGH(i, j + 1, cell, G.x0, G.z0) - a); }
    const d = trGH(i + 1, j + 1, cell, G.x0, G.z0); return d + (1 - u) * (trGH(i, j + 1, cell, G.x0, G.z0) - d) + (1 - v) * (trGH(i + 1, j, cell, G.x0, G.z0) - d);
  }
  // ground colour (multiplies the grass map): lawns, the floor under the trees, paved and gravelled ground, the racecourse's dirt, the
  // ballpark's infield, the car parks (the green map turned grey)
  const TRCOL = [0, 0, 0];
  function trCol(x, z) {
    const P = TRW, m = P.n2(x, z), big = P.n3(x, z), lu = trLU(x, z), tr = trLCf(x, z, 1), bu = trLCf(x, z, 2), ba = trLCf(x, z, 3);
    let r = 0.9 + (m - 0.5) * 0.16 + (big - 0.5) * 0.12, g = 0.9 + (m - 0.5) * 0.12 + (big - 0.5) * 0.06, b = 0.72 + (m - 0.5) * 0.14;
    r = lerp(r, 0.62 + m * 0.1, tr * 0.6); g = lerp(g, 0.7 + m * 0.08, tr * 0.6); b = lerp(b, 0.5, tr * 0.6);   // leaf litter and shade under the trees
    r = lerp(r, 1.04, bu * 0.25); g = lerp(g, 0.98, bu * 0.25); b = lerp(b, 0.86, bu * 0.25);                  // the lawns between the houses, worn
    const grey = (k, v) => { r = lerp(r, 1.22 * v, k); g = lerp(g, 0.76 * v, k); b = lerp(b, 1.8 * v, k); };
    if (ba > 0) grey(ba * 0.7, 0.95);
    if (lu === 0 || lu === 9 || lu === 8) grey(lu === 8 ? 0.6 : 0.9, lu === 0 ? 0.82 : 0.95);   // car parks, paved yards, works
    else if (lu === 2) { r = 1.62; g = 0.98; b = 0.72; }                                         // the racecourse's dirt
    else if (lu === 1 || lu === 7) { r *= 0.92; g *= 1.12; b *= 0.86; }                            // the pitches: greener
    else if (lu === 3 || lu === 6) { g *= 1.04; }
    else if (lu === 5) grey(0.35, 1.0);
    else if (lu === 11) { r = 0.6; g = 1.1; b = 2.0; }
    TRCOL[0] = r; TRCOL[1] = g; TRCOL[2] = b; return TRCOL;
  }
  function trTerrainGeo(tiles, colAt) {   // terrain tiles [[x0, z0, cell, n]] (n x n cells each) in one indexed mesh, normals from the heights round each vertex
    const G = TRW.TG, P = [], N = [], C = [], U = [], I = [];
    for (const [x0, z0, cell, n] of tiles) {
      const m = n + 1, gx0 = Math.round((x0 - G.x0) / cell), gz0 = Math.round((z0 - G.z0) / cell), v0 = P.length / 3, H = (i, j) => trGH(i, j, cell, G.x0, G.z0);
      for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) {
        const i = gx0 + a, j = gz0 + b, x = G.x0 + i * cell, z = G.z0 + j * cell, h = H(i, j);
        const nx = -(H(i + 1, j) - H(i - 1, j)) / (2 * cell), nz = -(H(i, j + 1) - H(i, j - 1)) / (2 * cell), l = Math.hypot(nx, 1, nz);
        P.push(x, h, z); N.push(nx / l, 1 / l, nz / l); const c = colAt(x, z); C.push(c[0], c[1], c[2]); U.push(x / 14, -z / 14);
      }
      for (let b = 0; b < n; b++) for (let a = 0; a < n; a++) { const p = v0 + b * m + a, q = p + 1, c = p + m, d = c + 1; I.push(p, c, q, q, c, d); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    g.setIndex(I); g.computeBoundingSphere(); return g;
  }
  function buildTroisRivieres(scene, tex, opts) {
    const R = rng(1967), N = T.N, ds = T.ds, def = T.def, sStart = T.startS, dens = opts.density || 1, Lap = T.len;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: trGround, camFloor: trGround, props: [], farClip: true, ownTex: [], propR: 120, winMaps: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    trPrep();
    const P = TRW, WA = (i) => (T.wa ? T.wa[i] : T.w), dS = (s) => { let d = s - sStart; d = ((d % Lap) + Lap) % Lap; return d; }, sAt = (d) => wrapS(sStart + d);
    const near = (a, b, m) => { const d = Math.abs(a - b) % Lap; return Math.min(d, Lap - d) < m; };   // (metres along the lap)
    const junc = def.junctions || [], inJunc = (d, side, m) => junc.find(j => j[1] === side && near(d, j[0], 9 + j[2] * 0.4 + (m || 0)));
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // tree exclusion circles (stands, landmarks, the pits), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (const e of L) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };
    const addM = (g, mat, cast, nm) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; if (nm) m.name = nm; root.add(m); return m; };
    const named = (nm, f) => { const n0 = root.children.length; f(); for (let k = n0; k < root.children.length; k++) if (!root.children[k].name) root.children[k].name = nm; };   // (the tests and the profiler tell the parts apart)
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const scen = new Chunks(512), CH = 256, asphC = new Chunks(1024, true), markC = new Chunks(1024);   // (the scenery, the streets' and car parks' asphalt, the white and yellow markings: one mesh per 512 m each)

    /* ---- terrain: 512 m tiles, 4 m cells within ~250 m of the circuit, 16 m beyond (one mesh), out to ~1.5 km ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: tex.grass, vertexColors: true });
    let nTiles = 0;
    {
      const G = P.TG = { x0: -1536, z0: -1536, L: 256, n: 12, st: new Uint8Array(144) }, coarse = [], blocks = {}, grp = new THREE.Group(); grp.name = 'trGround'; root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.n; tj++) for (let ti = 0; ti < G.n; ti++) {
        const x0 = G.x0 + ti * G.L, z0 = G.z0 + tj * G.L; let dm = 1e9;
        for (let i = 0; i < N; i += 3) { const dx = Math.max(x0 - T.px[i], 0, T.px[i] - x0 - G.L), dz = Math.max(z0 - T.pz[i], 0, T.pz[i] - z0 - G.L); dm = Math.min(dm, Math.hypot(dx, dz)); }
        G.st[tj * G.n + ti] = dm < 130 ? 4 : 2;
      }
      for (let tj = 0; tj < G.n; tj++) for (let ti = 0; ti < G.n; ti++) {
        const x0 = G.x0 + ti * G.L, z0 = G.z0 + tj * G.L, st = G.st[tj * G.n + ti];
        if (st === 2) { coarse.push([x0, z0, 32, 8]); continue; }
        const bk = (ti >> 2) + ',' + (tj >> 2); (blocks[bk] || (blocks[bk] = [])).push([x0, z0, st === 3 ? 8 : 16, st === 3 ? 32 : 16]); nTiles++;
      }
      for (const k in blocks) { const m = new THREE.Mesh(trTerrainGeo(blocks[k], trCol), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); }
      const m = new THREE.Mesh(trTerrainGeo(coarse, trCol), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles += coarse.length;
    }

    /* ---- the circuit's asphalt (the city's own: patched, a darker strip down the middle of each lane), the verges inside the walls (the
       sidewalk's concrete, the side street's asphalt across the junctions' mouths), the yellow double centre line of the city streets, the
       white crossings at the junctions ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const pMat = new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true }), lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const asphV = (side, i) => { const d = dS(i * ds); return !!inJunc(d, side); };   // the verge is the side street's asphalt
    const pitSd = def.pit ? Math.sign(def.pit[0]) : 0, inPitZone = (s) => def.pit && (T.pitAt(s) || T.pitAt(s + 20) || T.pitAt(s - 20));
    const YEL = [0.93, 0.74, 0.12], WHT = [0.94, 0.94, 0.9];
    const TI = (def.turns || []).map(t => T.nearestIdx(t[0], t[1])), TD = TI.map(ti => dS(ti * ds)), TS = TI.map(ti => (T.k[ti] > 0 ? 1 : -1));
    const cityLine = (d) => d > 240 && d < 2010 && !TD.some(t => near(d, t, 22)) && !junc.some(j => near(d, j[0], 10));
    {
      const offs = (i) => { const w = WA(i); return [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w]; };
      const shade = (i, o) => { const w = WA(i), lane = Math.abs(Math.abs(o) - w / 2) / (w / 2); let k = 0.84 + 0.06 * lane + (P.n2(T.px[i] * 3, T.pz[i] * 3) - 0.5) * 0.08; if (Math.abs(o) > w * 0.93) k -= 0.05; return [k, k, k * 1.02]; };
      for (let c0 = 0; c0 < N; c0 += CH) {
        const gr = new RB(true), gv = new RB(true), ga = gr;
        let pr = -1; const pv = [-1, -1], pa = [-1, -1];
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, v = ii * ds / 8, of = offs(i), w = WA(i);
          const r = gr.row(of.map(o => Pt(i, o, 0.02)), of.map(o => shade(i, o)), of.map(o => [(o + w) / 8, v])); if (pr >= 0) gr.link(pr, r, 0, of.length - 1); pr = r;
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, bar = side > 0 ? T.br[i] : T.bl[i], asph = false, o3 = [w, w + 0.35, bar + 0.05], cols = [[0.56, 0.57, 0.6], [0.86, 0.88, 0.92], [0.84, 0.86, 0.9]];
            const pts = o3.map((o, k) => Pt(i, side * o, k === 0 ? 0.02 : asph ? 0.02 : 0.025)), ord = side > 0 ? [0, 1, 2] : [2, 1, 0];
            const tgt = asph ? ga : gv, rr = tgt.row(ord.map(k => pts[k]), ord.map(k => cols[k]), ord.map(k => [pts[k][0] / 8, -pts[k][2] / 8]));
            const prev = asph ? pa : pv, other = asph ? pv : pa;
            if (prev[si] >= 0) tgt.link(prev[si], rr, 0, 2); prev[si] = rr; other[si] = -1;
          }
          // the yellow double centre line (two 0.11 m lines 0.12 m apart) on the city streets
          const d = dS(i * ds), j = (i + 1) % N;
          if (ii < c0 + CH && cityLine(d) && cityLine(d + ds)) for (const o of [-0.17, 0.06]) markC.get(T.px[i], T.pz[i]).quadUp(Pt(i, o, 0.034), Pt(i, o + 0.11, 0.034), Pt(j, o + 0.11, 0.034), Pt(j, o, 0.034), [YEL, YEL, YEL, YEL]);
        }
        addM(gr, aMat, false, 'trRoad'); addM(gv, pMat, false, 'trVerge');
      }
      // crossings: a ladder of white bars across the circuit at each street junction's mouth (both sides of it) and at the crossings on the map
      const bars = (s, w) => { for (let o = -w + 0.4; o < w - 0.3; o += 1.1) { const a = atSf(s - 1.6, o), b = atSf(s - 1.6, o + 0.55), c = atSf(s + 1.6, o + 0.55), e = atSf(s + 1.6, o), y = (q) => T.hy[q[3]] + 0.036;
        markC.get(a[0], a[1]).quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [e[0], y(e), e[1]], [WHT, WHT, WHT, WHT]); } };
      const at = [];
      for (const [d, , , kind] of junc) if (kind === 0) at.push(d - 11.5, d + 11.5);
      for (const [k, x, z] of P.pt) if (k === 2) { const n = nearest(x, z); if (n.i >= 0 && Math.abs(n.lat) < WA(n.i) + 1) at.push(dS(n.i * ds)); }
      const done = []; for (const d of at) { if (done.some(e => near(e, d, 6))) continue; done.push(d); bars(sAt(d), WA(T.idx(sAt(d)))); }
    }

    /* ---- the walls: concrete blocks (3.7 m each, a dark joint between them) with a catch fence on posts along their top; round the outside
       of the corners a tyre wall in front (bound with a belt); the barrier line runs across the junctions' mouths ---- */
    const corner = (i, side) => TD.some((t, k) => side === -TS[k] && near(dS(i * ds), t, 30));
    const tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true }), fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.09, 1, 0.09, 0, [0.5, 0.51, 0.54], null, true); return g.geometry(); })(), posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 768);
    const fenceG = new GB(true);
    const CHB = Math.ceil(N / 3);
    for (let c0 = 0; c0 < N; c0 += CHB) {
      const gw = new RB(), gt = new RB(true);
      for (const side of [-1, 1]) {
        let pw = -1, pt = -1;
        const e1 = Math.min(c0 + CHB, N), II = []; for (let ii = c0; ii < e1; ii += 2) II.push(ii); II.push(e1);   // (a row every 4 m, a fence post every 8 m)
        for (let q2 = 0; q2 < II.length; q2++) {
          const ii = II[q2], i = ii % N, bar = side > 0 ? T.br[i] : T.bl[i], ty = corner(i, side), o0 = bar + (ty ? 0.9 : 0), s = ii * ds, blk = Math.floor(s / 3.7), jt = s - blk * 3.7 < 0.3;
          const sh = (0.86 + 0.06 * ((blk * 7) % 3) / 2) * (jt ? 0.7 : 1), cc = [0.8 * sh, 0.8 * sh, 0.78 * sh], ct = [0.88 * sh, 0.88 * sh, 0.86 * sh];
          let p = [Pt(i, side * o0, -0.05), Pt(i, side * (o0 + 0.05), 0.26), Pt(i, side * (o0 + 0.2), 0.82), Pt(i, side * (o0 + 0.4), 0.82), Pt(i, side * (o0 + 0.6), -0.45)], c = [cc, cc, ct, ct, [0.6, 0.6, 0.58]];
          if (side < 0) { p = p.reverse(); c = c.reverse(); }
          const r = gw.row(p, c); if (pw >= 0) gw.link(pw, r, 0, 4); pw = r;
          if (ty) {   // the tyre wall: black tyres four high in front of the blocks, a belt over their face
            const v = s / 1.6; let tp = [Pt(i, side * bar, -0.1), Pt(i, side * bar, 1.0), Pt(i, side * (bar + 0.9), 1.0)], tu = [[v, 0.5], [v, 0.998], [v, 0.6]];
            if (side < 0) { tp = tp.reverse(); tu = tu.reverse(); }
            const rt = gt.row(tp, [[1, 1, 1], [1, 1, 1], [0.8, 0.8, 0.8]], tu); if (pt >= 0) gt.link(pt, rt, 0, 2); pt = rt;
          } else pt = -1;
          // the catch fence on the blocks: 0.82 to 4 m, a post every 3 samples
          if (q2 + 1 < II.length) { const st2 = II[q2 + 1] - ii, j = (i + st2) % N, bj = side > 0 ? T.br[j] : T.bl[j], oj = bj + (corner(j, side) ? 0.9 : 0) + 0.3, oi = o0 + 0.3, u0 = s / 2.5, u1 = (s + ds * st2) / 2.5;
            const A = Pt(i, side * oi, 0.82), B = Pt(j, side * oj, 0.82), C = Pt(j, side * oj, 4.0), D = Pt(i, side * oi, 4.0), ins = Pt(i, side * (oi + 3), 1);
            if (!inPitZone(s) || side !== pitSd) fenceG.quadO(A, B, C, D, [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 1.3], [u0, 1.3]]);
            if (q2 % 2 === 0) box(scen.get(A[0], A[2]), A[0], A[1] - 0.1, A[2], 0.09, 3.3, 0.09, T.hd[i], [0.5, 0.51, 0.54], null, true); }
        }
      }
      addM(gw, matV, true, 'trWall'); addM(gt, tyMat, true, 'trTyres');
    }
    const nPosts = Math.ceil(N);
    { const fm = addM(fenceG, fMat); if (fm) fm.castShadow = false; }

    /* ---- the gateway at Turn 3: two square concrete pylons either side of the road and a deep lintel over it (no lettering) ---- */
    if (def.gate) {
      const gi = T.nearestIdx(def.gate[0], def.gate[1]), i = T.idx(gi * ds - 22), g = scen.get(T.px[i], T.pz[i]), cc = [0.84, 0.8, 0.7], cd = [0.7, 0.66, 0.58], h = T.hd[i];
      let ol = 0, orr = 0; for (let k = -4; k <= 4; k++) { const j = (i + k + N) % N; ol = Math.max(ol, T.bl[j]); orr = Math.max(orr, T.br[j]); }
      const pyl = (o) => { const [x, z] = [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o], y = T.hy[i]; box(g, x, y - 0.3, z, 3.2, 10.6, 3.6, h, cc, cd); box(g, x, y + 10.3, z, 3.6, 0.6, 4.0, h, cd, cd); box(g, x, y - 0.3, z, 3.5, 1.2, 3.9, h, cd, cd); exclPush(x, z, 4); return [x, z]; };
      const a = pyl(-(ol + 2.1)), b = pyl(orr + 2.1), y = T.hy[i], span = Math.hypot(b[0] - a[0], b[1] - a[1]) + 3.2;
      box(g, (a[0] + b[0]) / 2, y + 7.4, (a[1] + b[1]) / 2, 3.0, 2.4, span, h, cc, cd);   // (box: sx along the road, sz across)
      for (const f of [-1, 1]) box(g, (a[0] + b[0]) / 2 + T.tx[i] * f * 1.52, y + 7.9, (a[1] + b[1]) / 2 + T.tz[i] * f * 1.52, 0.06, 1.0, span - 6, h, [0.74, 0.7, 0.62], null, true);   // a panel on each face
    }

    /* ---- START / FINISH: the chequered line, the grid boxes (13 cars, staggered), the gantry with the start lights ---- */
    {
      const gq = new GB(true), gw = new GB(), w = WA(T.startIdx), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], HYp = (p) => T.hy[p[3]];
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) {
        const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.2;
        for (const [d0, d1, l0, l1] of [[0, 0.35, lat - 1.5, lat + 1.5], [-1.6, 0.35, lat - 1.5, lat - 1.25]]) { const p0 = atSf(sb + d0, l0), p1 = atSf(sb + d0, l1), p2 = atSf(sb + d1, l1), p3 = atSf(sb + d1, l0);
          gw.quadUp([p0[0], HYp(p0) + 0.037, p0[1]], [p1[0], HYp(p1) + 0.037, p1[1]], [p2[0], HYp(p2) + 0.037, p2[1]], [p3[0], HYp(p3) + 0.037, p3[1]], [WHT, WHT, WHT, WHT]); }
      }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.8, 7.9, 0.8, h, gray);
      box(g, x, gy + 6.4, z, 1.1, 1.3, span * 2 + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]); box(g, x, gy + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, gy + 7.95, z + nz * o); m.rotation.y = -h; root.add(m); lights.push(m); }
      out.dyn.lights = lights; exclPush(x, z, span + 6);
    }

    /* ---- the pit lane on the left of the main straight: the lane, its lines and the boxes' dividers, a concrete apron, the teams' white tents
       behind it (a tent and a transporter per crew), the BOKSI sign at the way in. The crews (the renderer's) get their boxes in a frame whose
       normal points away from the circuit (out.pitBoxes) ---- */
    let nTents = 0;
    if (def.pit) {
      const PD = def.pit, sd = Math.sign(PD[0]), gl = asphC.get(T.px[T.startIdx], T.pz[T.startIdx]), gp = markC.get(T.px[T.startIdx], T.pz[T.startIdx]), conc = [0.78, 0.78, 0.74], one = [1, 1, 1], [pq0, pq1] = def.pitRow;
      const at = (s, o, y) => { const [x, z, , k] = atSf(s, sd * o); return [x, T.hy[k] + y, z]; };
      for (let q = PD[1]; q < PD[2]; q += 2) {
        const s0 = sAt(q), s1 = sAt(q + 2), pi = T.pitAt(s0), pj = T.pitAt(s1); if (!pi || !pj) continue;
        const A = at(s0, pi.o - 3.5, 0.025), B = at(s0, pi.o + 3.5, 0.025), C = at(s1, pj.o + 3.5, 0.025), D = at(s1, pj.o - 3.5, 0.025), uv = (p) => [p[0] / 8, -p[2] / 8];
        gl.quadUp(A, B, C, D, [one, one, one, one], [uv(A), uv(B), uv(C), uv(D)]);
        gp.quadUp(at(s0, pi.o + 3.18, 0.034), at(s0, pi.o + 3.36, 0.034), at(s1, pj.o + 3.36, 0.034), at(s1, pj.o + 3.18, 0.034), [WHT, WHT, WHT, WHT]);
        if (((q / 2) | 0) % 2 === 0) gp.quadUp(at(s0, pi.o - 3.36, 0.034), at(s0, pi.o - 3.18, 0.034), at(s1, pj.o - 3.18, 0.034), at(s1, pj.o - 3.36, 0.034), [WHT, WHT, WHT, WHT]);
        if (pi.t > 0.999 && pj.t > 0.999) gp.quadUp(at(s0, pi.o + 3.5, 0.024), at(s0, pi.o + 12.5, 0.024), at(s1, pj.o + 12.5, 0.024), at(s1, pj.o + 3.5, 0.024), [conc, conc, conc, conc]);
        // the strip between the pit wall and the lane: grass, the lane's edge kerb
        const bi = pi.wall + 0.6, bj = pj.wall + 0.6; if (pi.o - 3.5 > bi + 0.4) gp.quadUp(at(s0, bi, 0.03), at(s0, pi.o - 3.5, 0.03), at(s1, pj.o - 3.5, 0.03), at(s1, bj, 0.03), [[0.42, 0.56, 0.26], [0.42, 0.56, 0.26], [0.42, 0.56, 0.26], [0.42, 0.56, 0.26]]);
      }
      const TEAM = [[0.85, 0.16, 0.13], [0.16, 0.36, 0.8], [0.95, 0.95, 0.94], [0.18, 0.62, 0.3], [0.96, 0.72, 0.12], [0.14, 0.14, 0.16], [0.95, 0.45, 0.1], [0.5, 0.26, 0.7], [0.1, 0.62, 0.72], [0.85, 0.2, 0.5], [0.4, 0.42, 0.46], [0.2, 0.3, 0.55], [0.7, 0.1, 0.1]];
      for (let q = pq0, k = 0; q <= pq1; q += 10, k++) {
        const s0 = sAt(q), p = T.pitAt(s0 + 5); if (!p || p.t < 0.999) continue;
        const i = T.idx(s0 + 5), base = p.o + 3.5, tc = TEAM[k % TEAM.length], nx = T.nx[i] * sd, nz = T.nz[i] * sd;   // (the frame's normal away from the circuit)
        { const L0 = at(s0 - 0.09, base, 0.035), L1 = at(s0 + 0.09, base, 0.035), L2 = at(s0 + 0.09, base + 9, 0.035), L3 = at(s0 - 0.09, base + 9, 0.035); gp.quadUp(L0, L1, L2, L3, [WHT, WHT, WHT, WHT]); }
        // the tent: four legs, a white roof with a valance in the team's colour, a back wall; the transporter behind it
        const tc0 = at(s0 + 5, base + 12.5, 0), g = scen.get(tc0[0], tc0[2]), hd = T.hd[i], roofY = tc0[1] + 2.9;
        for (const a of [0.6, 9.4]) for (const w of [9.2, 15.8]) { const c = at(s0 + a, base + w, 0); box(g, c[0], c[1], c[2], 0.07, 2.9, 0.07, hd, [0.7, 0.71, 0.74], null, true); }
        { const c = at(s0 + 5, base + 12.5, 0); box(g, c[0], roofY, c[2], 9.4, 0.12, 7.0, hd, tc.map(v => v * 0.85), [0.97, 0.97, 0.96]); box(g, c[0], roofY + 0.12, c[2], 9.0, 0.7, 6.6, hd, [0.95, 0.95, 0.94], [0.97, 0.97, 0.96]);
          const bw = at(s0 + 5, base + 15.85, 0); box(g, bw[0], bw[1], bw[2], 9.2, 2.85, 0.06, hd, [0.92, 0.92, 0.9], null, true);
          const fl = at(s0 + 5, base + 12.5, 0); box(g, fl[0], fl[1] + 0.01, fl[2], 9.0, 0.03, 6.6, hd, [0.42, 0.43, 0.46], [0.46, 0.47, 0.5], true);
          for (const a of [1.6, 8.4]) { const cb = at(s0 + a, base + 15.2, 0); box(g, cb[0], cb[1], cb[2], 1.1, 1.0, 0.6, hd, [0.2, 0.21, 0.24], [0.12, 0.12, 0.13]); }
          const tr = at(s0 + 5, base + 20.5, 0); box(g, tr[0], tr[1] + 0.9, tr[2], 13.5, 3.2, 2.5, hd, [0.93, 0.93, 0.92], [0.85, 0.86, 0.88]); box(g, tr[0], tr[1], tr[2], 12, 0.9, 2.2, hd, [0.12, 0.12, 0.13], null, true);
          box(g, tr[0] + T.tx[i] * 0.01, tr[1] + 2.4, tr[2] + T.tz[i] * 0.01, 13.52, 0.45, 2.52, hd, tc, tc);
          exclPush(c[0], c[2], 7); exclPush(tr[0], tr[2], 7); nTents++; }
        if (k >= 13) continue;
        const mine = PD[3] != null && Math.abs(q + 5 - PD[3]) < 1, sb = sAt(q + 5), oc = atSf(sb, 0), Y = T.hy[i];
        if (mine) {
          const st = atSf(sb, sd * p.o), ctr = atSf(sb, sd * (base + 4.2));
          out.pitBox = { s: sb, x: ctr[0], z: ctr[1], hd, tx: T.tx[i], tz: T.tz[i], nx, nz, lane: p.o, wallO: p.wall, apron0: base, garage0: base + 9, stop: st, y: Y }; }
        (out.pitBoxes = out.pitBoxes || []).push({ k, s: sb, ox: oc[0], oz: oc[1], tx: T.tx[i], tz: T.tz[i], nx, nz, hd, base, lane: p.o, wall: p.wall, team: tc, mine, y: Y });
        out.pitBoxes[out.pitBoxes.length - 1].gar = { band: [base + 9.2, 3.04, 3.7, 4.48], wall: [base + 15.82, 0.03, 2.82, 4.55] };   // (its tent above, for the renderer's team colours: the band on the roof's front, the back wall)
      }
      T.pitStands = null;
      { const sE = sAt(PD[1] + 24), pE = T.pitAt(sE); if (pE) { const [x, z, , i] = atSf(sE, sd * (pE.lout + 3)), g = scen.get(x, z), y = T.hy[i];   // the sign at the way in: BOKSI and an arrow
        const c2 = document.createElement('canvas'); c2.width = 256; c2.height = 128; const x2 = c2.getContext('2d');
        x2.fillStyle = '#1f3f8c'; x2.fillRect(0, 0, 256, 128); x2.strokeStyle = '#f4f1ec'; x2.lineWidth = 7; x2.strokeRect(5, 5, 246, 118);
        x2.fillStyle = '#f4f1ec'; x2.font = '900 50px "Russo One", "Arial Black", Arial, sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText('BOKSI', 128, 64);
        let fx = -T.tx[i], fz = -T.tz[i];
        const bm = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), new THREE.MeshLambertMaterial({ map: ownTex(new THREE.CanvasTexture(c2)) }));
        bm.position.set(x + fx * 0.14, y + 2.6, z + fz * 0.14); bm.rotation.set(0, Math.atan2(fx, fz), 0); bm.castShadow = true; root.add(bm);
        box(g, x, y + 1.6, z, 0.2, 2.0, 3.8, T.hd[i], [0.86, 0.85, 0.82]); for (const q2 of [-1.4, 1.4]) box(g, x - T.tz[i] * q2, y, z + T.tx[i] * q2, 0.18, 1.7, 0.18, 0, [0.62, 0.63, 0.66]); } }
    }

    /* ---- grandstands (def.stands [from, to, side, rows, roof]): steel bleachers behind the fence and the sidewalk, packed with fans (the crowd
       map over the rake), a roof on the main ones ---- */
    let nStands = 0;
    const CR = crowdCtx({ gH: trGround, near: (x, z) => clearance(x, z), maxSlope: 0.5, excluded: (x, z) => excluded(x, z) || trInBld(x, z, 0.8) });
    {
      const gs = new GB(), gc = new RB(true), gr = new GB(), stC = [0.66, 0.67, 0.7], stD = [0.5, 0.51, 0.55], stT = [0.76, 0.77, 0.8], roofC = [0.9, 0.91, 0.93], roofU = [0.62, 0.63, 0.66];
      for (const [d0, d1, side, rows, roof] of def.stands || []) {
        let prev = null, pc = -1; const depth = rows * 0.85;
        for (let d = d0; d <= d1; d += 3) {
          const s = sAt(d), q = Object.assign({}, crAt(s)), bar = side > 0 ? q.br : q.bl, front = bar + 3.2;
          const P2 = (o, h) => [q.px + q.nx * side * o, h, q.pz + q.nz * side * o], y0 = q.hy - 0.1, top = y0 + 1.2 + depth * 0.5;
          const cs = [P2(front, y0 - 0.5), P2(front, y0 + 1.2), P2(front + 1.0, y0 + 1.2), P2(front + depth, top), P2(front + depth, y0 - 0.5)];
          if (prev) { const inn = P2(front + depth / 2, y0 + 1); for (let m = 0; m < 4; m++) gs.quadO(prev.cs[m], prev.cs[m + 1], cs[m + 1], cs[m], m === 2 ? stT : m === 1 ? stC : stD, inn); }
          else { const inn = P2(front + depth / 2, y0 + 1); inn[0] += q.tx * 2; inn[2] += q.tz * 2; gs.quadO(cs[0], cs[1], cs[3], cs[4], stD, inn); gs.quadO(cs[1], cs[2], cs[3], cs[3], stD, inn); }
          const cp = [P2(front + 1.1, y0 + 1.27), P2(front + depth - 0.2, top + 0.02)], u = s / 12, cuv = [[u, 0.004], [u, 0.996 * Math.min(1, depth / 15)]];
          const rc = gc.row(side > 0 ? cp : cp.slice().reverse(), [[1, 1, 1], [1, 1, 1]], side > 0 ? cuv : cuv.slice().reverse()); if (pc >= 0) gc.link(pc, rc, 0, 1); pc = rc;
          if (roof) { const rp = [P2(front + depth + 0.3, top + 4.2), P2(front - 0.8, top + 3.2), P2(front - 0.8, top + 2.95), P2(front + depth + 0.3, top + 3.95)];
            if (prev && prev.rp) { gr.quadO(prev.rp[0], prev.rp[1], rp[1], rp[0], roofC, P2(front + depth / 2, top - 5)); gr.quadO(prev.rp[3], prev.rp[2], rp[2], rp[3], roofU, P2(front + depth / 2, top + 9)); }
            if (Math.round(d / 3) % 4 === 0) { const [bx, , bz] = P2(front + depth - 0.3, 0); box(scen.get(bx, bz), bx, y0, bz, 0.4, top + 4.1 - y0, 0.4, T.hd[q.i], [0.85, 0.86, 0.88]); } }
          prev = { cs, rp: roof ? [P2(front + depth + 0.3, top + 4.2), P2(front - 0.8, top + 3.2), P2(front - 0.8, top + 2.95), P2(front + depth + 0.3, top + 3.95)] : null };
          const [cx, , cz] = P2(front + depth / 2, 0); exclPush(cx, cz, depth / 2 + 3); CR.block(cx, cz, 4, depth + 2, Math.atan2(q.tz, q.tx));
        }
        if (prev) { const q = crAt(sAt(d1)), inn = [q.px + q.nx * side * (q.bl + 6) - q.tx * 2, prev.cs[1][1], q.pz + q.nz * side * (q.bl + 6) - q.tz * 2]; gs.quadO(prev.cs[0], prev.cs[1], prev.cs[3], prev.cs[4], stD, inn); }
        nStands++;
      }
      addM(gs, matV, true); addM(gc, crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.06, 0.06)); addM(gr, matV, true);
    }
    // spectators along the fences (def.ga [from, to, side]: on the sidewalks and the lawns behind the walls) and round the hairpin
    let nFans = 0;
    for (const [d0, d1, side] of def.ga || []) nFans += crowdRun(CR, sAt(d0), sAt(d0) + (((d1 - d0) % Lap) + Lap) % Lap, side, { rows: 3, dens: 0.5, first: 1.6, gap: 0.9, below: 1.5, above: 2.5, label: 'TR ' + d0 });
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the city's streets (OSM): asphalt ribbons with round joints, the yellow double centre line of the streets with traffic, the sidewalks
       (raised, concrete) along them, the railway's ballast and rails, the crossings' white ladders and the stop lines; cut where they meet the
       circuit (the circuit's own asphalt and verges there) ---- */
    const inCorr = (x, z, m) => { const n = nearest(x, z); return n.i >= 0 && Math.abs(n.lat) < n.bar + (m || 0); };
    const roadY = (cl) => (cl <= 5 ? 0.06 : cl === 12 ? 0.045 : cl >= 8 && cl <= 9 ? 0.1 : 0.05);
    const RCOL = [[0.8, 0.8, 0.82], [0.84, 0.84, 0.86], [0.86, 0.86, 0.88], [0.88, 0.88, 0.9], [0.92, 0.92, 0.93], [0.92, 0.92, 0.93], [0.96, 0.95, 0.94], [1.1, 1.06, 1.0], [1.25, 1.22, 1.15], [1.0, 0.72, 0.66], [0.9, 0.84, 0.72], [0.9, 0.9, 0.9], [0.95, 0.95, 0.96]];
    let nStreets = 0;
    {
      const ga = asphC, gs = new Chunks(1024, true), gm = markC, rail = scen, SW = [0.86, 0.88, 0.92];
      const segs = [];   // the parts of the streets out of the circuit's corridor: [cl, ax, az, bx, bz]
      for (const o of P.rd) {
        if (o.cl === 11) continue;
        const inA = (x, z) => { const n = nearest(x, z); return n.i >= 0 && Math.abs(n.lat) < WA(n.i) + 0.2; }, pts = o.pts, ins = pts.map(([x, z]) => inA(x, z));
        for (let j = 0; j + 1 < pts.length; j++) {
          let [ax, az] = pts[j], [bx, bz] = pts[j + 1];
          if (ins[j] && ins[j + 1]) continue;
          if (ins[j] || ins[j + 1]) {   // cut at the corridor's edge (bisection)
            let lo = 0, hi = 1; const in0 = ins[j]; for (let it = 0; it < 10; it++) { const t = (lo + hi) / 2, x = ax + (bx - ax) * t, z = az + (bz - az) * t; if (inA(x, z) === in0) lo = t; else hi = t; }
            const t = (lo + hi) / 2, x = ax + (bx - ax) * t, z = az + (bz - az) * t; if (in0) { ax = x; az = z; } else { bx = x; bz = z; }
          }
          segs.push([o.cl, ax, az, bx, bz, j === 0, j === pts.length - 2]);
        }
      }
      for (const [cl, ax, az, bx, bz, first, last] of segs) {
        const L = Math.hypot(bx - ax, bz - az); if (L < 0.2) continue;
        const ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz, nz = ux, hw = TR_RW[cl], yo = roadY(cl), cx = (ax + bx) / 2, cz = (az + bz) / 2;
        const n = Math.max(1, Math.ceil(L / 8)), Y = (x, z) => trGround(x, z) + yo;
        if (cl === 10) {   // the railway: a ballast bed, two rails
          const g = rail.get(cx, cz);
          for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, p = (t, o, y) => { const x = ax + (bx - ax) * t + nx * o, z = az + (bz - az) * t + nz * o; return [x, trGround(x, z) + y, z]; };
            g.quadUp(p(t0, -hw, 0.05), p(t0, hw, 0.05), p(t1, hw, 0.05), p(t1, -hw, 0.05), [[0.5, 0.47, 0.43], [0.5, 0.47, 0.43], [0.5, 0.47, 0.43], [0.5, 0.47, 0.43]]);
            for (const o of [-0.75, 0.68]) g.quadUp(p(t0, o, 0.22), p(t0, o + 0.07, 0.22), p(t1, o + 0.07, 0.22), p(t1, o, 0.22), [[0.42, 0.38, 0.34], [0.42, 0.38, 0.34], [0.42, 0.38, 0.34], [0.42, 0.38, 0.34]]); }
          continue;
        }
        const foot = cl === 8 || cl === 9, tg = foot ? gs : ga, g = tg.get(cx, cz), col = RCOL[cl], uv = (x, z) => [x / 8, -z / 8];
        for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, p = (t, o) => { const x = ax + (bx - ax) * t + nx * o, z = az + (bz - az) * t + nz * o; return [x, Y(x, z), z]; };
          const A = p(t0, -hw), B = p(t0, hw), C = p(t1, hw), D = p(t1, -hw); g.quadUp(A, B, C, D, [col, col, col, col], [uv(A[0], A[2]), uv(B[0], B[2]), uv(C[0], C[2]), uv(D[0], D[2])]);
          // the sidewalks of the streets with houses along them: raised 12 cm, concrete
          if (cl >= 1 && cl <= 5) for (const sd of [-1, 1]) { const a0 = p(t0, sd * (hw + 0.25)), a1 = p(t0, sd * (hw + 1.95)), b1 = p(t1, sd * (hw + 1.95)), b0 = p(t1, sd * (hw + 0.25));
            if (inCorr(a0[0], a0[2], 1.5) || inCorr(b0[0], b0[2], 1.5)) continue;
            for (const q of [a0, a1, b1, b0]) q[1] += 0.12;
            const gw = gs.get(a0[0], a0[2]); gw.quadUp(a0, a1, b1, b0, [SW, SW, SW, SW], [uv(a0[0], a0[2]), uv(a1[0], a1[2]), uv(b1[0], b1[2]), uv(b0[0], b0[2])]); } }
        if (!foot) {   // a round joint at each end (fills the gaps of the bends)
          for (const [x, z] of (cl >= 6 ? [] : last ? [[ax, az], [bx, bz]] : [[ax, az]])) { const y = Y(x, z) - 0.002; for (let k = 0; k < 6; k++) { const a0 = k / 6 * TAU, a1 = (k + 1) / 6 * TAU, p0 = [x + Math.cos(a0) * hw, y, z + Math.sin(a0) * hw], p1 = [x + Math.cos(a1) * hw, y, z + Math.sin(a1) * hw];
            g.triO([x, y, z], p0, p1, col, [x, y - 1, z], col, col, uv(x, z), uv(p0[0], p0[2]), uv(p1[0], p1[2])); } }
        }
        if (cl >= 1 && cl <= 4 && L > 6 && !first && !last || (cl >= 1 && cl <= 4 && L > 30)) {   // the yellow double centre line (not into the junctions)
          const m = gm.get(cx, cz), e0 = first ? 9 / L : 0, e1 = last ? 1 - 9 / L : 1;
          if (e1 > e0) for (const o of [-0.17, 0.06]) { const p = (t, oo) => { const x = ax + (bx - ax) * t + nx * oo, z = az + (bz - az) * t + nz * oo; return [x, Y(x, z) + 0.012, z]; };
            m.quadUp(p(e0, o), p(e0, o + 0.11), p(e1, o + 0.11), p(e1, o), [YEL, YEL, YEL, YEL]); }
        }
        nStreets++;
      }
      // crossings and stop lines (the map's points, off the circuit): white bars across the street there
      const segAt = (x, z) => { let best = null, bd = 9; for (const sg of segs) { const [cl, ax, az, bx, bz] = sg; if (cl > 6 && cl !== 12) continue; const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1, t = clamp(((x - ax) * vx + (z - az) * vz) / l2, 0, 1), d = Math.hypot(x - ax - vx * t, z - az - vz * t); if (d < bd) { bd = d; best = sg; } } return best; };
      for (const [k, x, z] of P.pt) {
        if ((k !== 2 && k !== 1) || inCorr(x, z, 2)) continue;
        const sg = segAt(x, z); if (!sg) continue;
        const [cl, ax, az, bx, bz] = sg, L = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz, nz = ux, hw = TR_RW[cl], m = gm.get(x, z), y = trGround(x, z) + roadY(cl) + 0.014;
        const q = (a, o) => [x + ux * a + nx * o, y, z + uz * a + nz * o];
        if (k === 2) for (let o = -hw + 0.3; o < hw - 0.2; o += 1.1) m.quadUp(q(-1.5, o), q(-1.5, o + 0.55), q(1.5, o + 0.55), q(1.5, o), [WHT, WHT, WHT, WHT]);
        else m.quadUp(q(-0.2, -hw + 0.2), q(-0.2, 0), q(0.2, 0), q(0.2, -hw + 0.2), [WHT, WHT, WHT, WHT]);
      }
      named('trWalk', () => gs.addTo(root, pMat, false, true));
      // the car parks' asphalt (the land use's parking polygons) on the ground, the racecourse's dirt as the ground's own colour
      const gp = asphC, PK = [0.82, 0.82, 0.84];
      for (const o of P.lu) { if (o.cl !== 0) continue; const shape = o.pts.map(([x, z]) => new THREE.Vector2(x, z)); let tri; try { tri = THREE.ShapeUtils.triangulateShape(shape, []); } catch (e) { continue; }
        const cx = (o.bb[0] + o.bb[2]) / 2, cz = (o.bb[1] + o.bb[3]) / 2, g = gp.get(cx, cz);
        for (const [a, b, c] of tri) { const p = (q) => [q[0], trGround(q[0], q[1]) + 0.04, q[1]], A = p(o.pts[a]), B = p(o.pts[b]), C = p(o.pts[c]); g.triO(A, B, C, PK, [A[0], A[1] - 5, A[2]], PK, PK, [A[0] / 8, -A[2] / 8], [B[0] / 8, -B[2] / 8], [C[0] / 8, -C[2] / 8]); } }
    }

    /* ---- buildings: the footprints at their heights. The houses (most of them the plexes of the city: two or three flats one over the other)
       in brick and siding with windows on every floor, flat roofs of tar and gravel, the smaller ones under a gable; on the street side of the
       plexes the galleries (balconies one over the other on posts) and the outside staircase up to them. The big ones: flat roofs with their
       plant, the fair's halls under gables, the arena under its curved roof, the grandstands of the ballpark and the racecourse ---- */
    const facTex = ownTex((() => {   // one floor of a facade (3 x 3 m): a window in a white frame (its glass blue: lit at night), brick courses
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
      x.fillStyle = '#d8d6d0'; x.fillRect(0, 0, 128, 128); x.fillStyle = 'rgba(0,0,0,0.07)'; for (let y = 0; y < 128; y += 5) x.fillRect(0, y, 128, 1);
      x.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = 0; y < 128; y += 10) for (let k = (y / 10) % 2 * 8; k < 128; k += 16) x.fillRect(k, y, 1, 5);
      x.fillStyle = '#f4f2ec'; x.fillRect(34, 22, 60, 72); x.fillStyle = '#5e7590'; x.fillRect(39, 27, 50, 62); x.fillStyle = '#90a8c0'; x.fillRect(41, 29, 20, 26);
      x.fillStyle = '#f4f2ec'; x.fillRect(62, 27, 4, 62); x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(30, 94, 68, 5);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; })());
    out.winMaps.push(facTex);
    const wMat = new THREE.MeshLambertMaterial({ map: facTex, vertexColors: true }), walls = new Chunks(512, true), roofs = new Chunks(512);
    const HOUSE = [[0.62, 0.33, 0.25], [0.55, 0.37, 0.28], [0.86, 0.8, 0.66], [0.92, 0.91, 0.87], [0.74, 0.76, 0.76], [0.9, 0.84, 0.62], [0.7, 0.78, 0.84], [0.66, 0.46, 0.36], [0.8, 0.74, 0.7]];
    const ROOFF = [[0.3, 0.3, 0.32], [0.36, 0.35, 0.34], [0.26, 0.27, 0.3], [0.42, 0.41, 0.4]], ROOFG = [[0.25, 0.25, 0.28], [0.4, 0.27, 0.22], [0.22, 0.24, 0.3], [0.45, 0.45, 0.47]];
    let nBld = 0, nPlex = 0;
    const obb = (pts) => {   // the footprint's long axis (its longest edge), the extents along and across it, its centre
      let best = 0, ang = 0; for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
      const c = Math.cos(ang), s = Math.sin(ang); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of pts) { const u = x * c + z * s, v = -x * s + z * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      const um = (u0 + u1) / 2, vm = (v0 + v1) / 2; return { ang, L: u1 - u0, D: v1 - v0, cx: um * c - vm * s, cz: um * s + vm * c }; };
    const areaOf = (pts) => { let a = 0; for (let k = 0; k < pts.length; k++) { const p = pts[k], q = pts[(k + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
    for (const o of P.bld) {
      const pts = o.pts, n = pts.length; if (n < 3) continue;
      let clash = false, y0 = 1e9, cx = 0, cz = 0; for (const [x, z] of pts) { if (inCorr(x, z, 1.2)) clash = true; y0 = Math.min(y0, trGround(x, z)); cx += x; cz += z; } cx /= n; cz /= n;
      if (clash || excluded(cx, cz)) continue;
      const hr = rng((Math.round(cx * 10) * 73856093) ^ (Math.round(cz * 10) * 19349663)), area = areaOf(pts), B = obb(pts), rect = area > 0.82 * B.L * B.D;
      const kind = o.kind, small = kind === 7 || area < 45, house = kind === 0;
      const h = Math.max(small ? 2.6 : 3.2, o.h), wallC = kind === 2 ? vary([0.74, 0.74, 0.72], hr, 0.1) : kind === 3 ? vary([0.7, 0.44, 0.34], hr, 0.12) : kind === 6 ? vary([0.6, 0.36, 0.28], hr, 0.1) : kind === 4 ? [0.82, 0.82, 0.8] : vary(HOUSE[Math.floor(hr() * HOUSE.length)], hr, 0.08);
      const gableR = (house && (area < 160 || (rect && hr() < 0.25)) && rect && B.D < 13) || small || (kind === 3 && area < 6000);
      const barrel = kind === 3 && area >= 6000;
      const wg = walls.get(cx, cz), rg = roofs.get(cx, cz), wTop = y0 + h;
      // the walls (u: 3 m to a window, v: a floor), the floors' windows; plain where the building is a hall or a shed
      let u = 0; const win = !(kind === 2 || kind === 7 || small);
      for (let k = 0; k < n; k++) { const a = pts[k], b = pts[(k + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.05) continue;
        const uu = win ? Math.max(1, Math.round(l / 3)) : 0, vv = win ? h / 3 : 0, A = [a[0], y0 - 0.4, a[1]], Bq = [b[0], y0 - 0.4, b[1]], C = [b[0], wTop, b[1]], D = [a[0], wTop, a[1]], vb = win ? -0.4 / 3 : 0;
        wg.quadO(A, Bq, C, D, wallC, [cx, y0 + h / 2, cz], [[u, vb], [u + uu, vb], [u + uu, vv], [u, vv]]); u += uu; }
      if (gableR) {   // a gable over the long axis (the footprint's rectangle), the walls' tops closed by it
        const rh = Math.min(kind === 3 ? 6 : 3.4, B.D * (kind === 3 ? 0.3 : 0.42)), rc = kind === 3 ? [0.42, 0.44, 0.46] : ROOFG[Math.floor(hr() * ROOFG.length)];
        gable(rg, B.cx, wTop, B.cz, B.L + 0.5, B.D + 0.5, rh, B.ang, rc, wallC.map(v => v * 0.92));
      } else if (barrel) {   // the arena: a curved roof over its long axis, in strips
        const c = Math.cos(B.ang), s = Math.sin(B.ang), Q = (lu, lv, y) => [B.cx + lu * c - lv * s, wTop + y, B.cz + lu * s + lv * c], rise = B.D * 0.16, nS = 10;
        for (let k = 0; k < nS; k++) { const v0 = -B.D / 2 + k * B.D / nS, v1 = v0 + B.D / nS, y = (v) => rise * (1 - (2 * v / B.D) ** 2), sh = 0.78 + 0.06 * (k % 2);
          rg.quadO(Q(-B.L / 2, v0, y(v0)), Q(B.L / 2, v0, y(v0)), Q(B.L / 2, v1, y(v1)), Q(-B.L / 2, v1, y(v1)), [0.5 * sh, 0.52 * sh, 0.55 * sh], [B.cx, wTop - 5, B.cz]); }
        for (const e of [-1, 1]) for (let k = 0; k < nS; k++) { const v0 = -B.D / 2 + k * B.D / nS, v1 = v0 + B.D / nS, y = (v) => rise * (1 - (2 * v / B.D) ** 2); rg.triO(Q(e * B.L / 2, v0, 0), Q(e * B.L / 2, v1, 0), Q(e * B.L / 2, (v0 + v1) / 2, (y(v0) + y(v1)) / 2), wallC, [B.cx, wTop, B.cz]); rg.triO(Q(e * B.L / 2, v0, 0), Q(e * B.L / 2, (v0 + v1) / 2, (y(v0) + y(v1)) / 2), Q(e * B.L / 2, v0, y(v0)), wallC, [B.cx, wTop, B.cz]); rg.triO(Q(e * B.L / 2, v1, 0), Q(e * B.L / 2, v1, y(v1)), Q(e * B.L / 2, (v0 + v1) / 2, (y(v0) + y(v1)) / 2), wallC, [B.cx, wTop, B.cz]); }
      } else {   // a flat roof (tar and gravel), its parapet's top; the plant on the big ones
        let tri; try { tri = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []); } catch (e) { tri = []; }
        const rc = vary(ROOFF[Math.floor(hr() * ROOFF.length)], hr, 0.1);
        for (const [a, b, c] of tri) rg.triO([pts[a][0], wTop, pts[a][1]], [pts[b][0], wTop, pts[b][1]], [pts[c][0], wTop, pts[c][1]], rc, [cx, wTop - 3, cz]);
        for (let k = 0; k < n; k++) { const a = pts[k], b = pts[(k + 1) % n]; rg.quadO([a[0], wTop, a[1]], [b[0], wTop, b[1]], [b[0], wTop + 0.35, b[1]], [a[0], wTop + 0.35, a[1]], wallC.map(v => v * 0.8), [cx, wTop, cz]); }
        if (area > 400) for (let k = 0; k < Math.min(6, area / 400); k++) { const lx = (hr() - 0.5) * B.L * 0.6, lz = (hr() - 0.5) * B.D * 0.6, c = Math.cos(B.ang), s = Math.sin(B.ang); box(rg, B.cx + lx * c - lz * s, wTop, B.cz + lx * s + lz * c, 1.6 + hr() * 2, 1.0 + hr() * 0.8, 1.2 + hr() * 1.5, B.ang, [0.66, 0.67, 0.68], [0.58, 0.59, 0.6]); }
      }
      // the plexes' galleries and outside stairs, on the side facing the nearest street
      if (house && !gableR && h >= 5.5 && area > 60 && area < 600) {
        let fk = -1, fd = 1e9; for (let k = 0; k < n; k++) { const a = pts[k], b = pts[(k + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 5) continue;
          const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, ox = (b[1] - a[1]) / l, oz = -(b[0] - a[0]) / l, sg = inPoly(pts, mx + ox * 0.5, mz + oz * 0.5) ? -1 : 1, d = trRoadD(mx + ox * sg * 5, mz + oz * sg * 5, 6).d; if (d < fd) { fd = d; fk = k; } }
        if (fk >= 0 && fd < 12) {
          const a = pts[fk], b = pts[(fk + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l; let ox = tz, oz = -tx; if (inPoly(pts, (a[0] + b[0]) / 2 + ox * 0.5, (a[1] + b[1]) / 2 + oz * 0.5)) { ox = -ox; oz = -oz; }
          const nf = Math.max(2, Math.min(3, Math.round(h / 3))), dep = 1.5, rail = hr() < 0.5 ? [0.13, 0.13, 0.14] : [0.92, 0.92, 0.9], deck = [0.5, 0.42, 0.34], g = scen.get(a[0], a[1]), ang = Math.atan2(tz, tx);
          const span = Math.min(l - 2.4, Math.max(3, l * 0.7)), c0 = (l - span) / 2 + (hr() < 0.5 ? 0.9 : -0.9), Pq = (al, out, y) => [a[0] + tx * al + ox * out, y, a[1] + tz * al + oz * out];
          for (let f = 1; f < nf; f++) { const y = y0 + f * 3 - 0.15, mid = Pq(c0 + span / 2, dep / 2, y);
            box(g, mid[0], y, mid[2], span, 0.15, dep, ang, deck, deck);   // the gallery's floor
            const rl = Pq(c0 + span / 2, dep - 0.04, y + 0.15); box(g, rl[0], y + 0.15, rl[2], span, 0.95, 0.06, ang, rail, rail, true); }   // its railing
          for (const al of [c0 + 0.1, c0 + span - 0.1]) { const p = Pq(al, dep - 0.1, 0); box(g, p[0], y0, p[2], 0.12, (nf - 1) * 3 + 1.0, 0.12, ang, rail, rail, true); }   // the posts
          { const sAl = c0 < l / 2 ? c0 + span + 0.65 : c0 - 0.65, run = Math.min(3.6, dep + 1.6), y1 = y0 + 2.85;   // the outside staircase to the first gallery: a flight out from the house, steps on it
            const s0 = Pq(sAl, dep + run, y0), s1 = Pq(sAl, dep - 0.2, y1), wv = 0.5, sx = tx * wv, sz = tz * wv;
            g.quadO([s0[0] - sx, y0 + 0.05, s0[2] - sz], [s0[0] + sx, y0 + 0.05, s0[2] + sz], [s1[0] + sx, y1, s1[2] + sz], [s1[0] - sx, y1, s1[2] - sz], deck, [s0[0], y0 + 5, s0[2]]);
            g.quadO([s0[0] - sx, y0 + 0.05, s0[2] - sz], [s0[0] + sx, y0 + 0.05, s0[2] + sz], [s1[0] + sx, y1, s1[2] + sz], [s1[0] - sx, y1, s1[2] - sz], rail, [s0[0], y0 - 5, s0[2]]);
            for (const e of [-1, 1]) g.quadO([s0[0] + sx * e, y0 + 0.05, s0[2] + sz * e], [s1[0] + sx * e, y1, s1[2] + sz * e], [s1[0] + sx * e, y1 + 0.9, s1[2] + sz * e], [s0[0] + sx * e, y0 + 0.95, s0[2] + sz * e], rail, [(s0[0] + s1[0]) / 2 - sx * e * 3, y1, (s0[2] + s1[2]) / 2 - sz * e * 3]); }
          nPlex++;
        }
      }
      CR.block(B.cx, B.cz, B.L, B.D, B.ang); nBld++;
    }
    named('trFacade', () => walls.addTo(root, wMat, true, true)); named('trRoofs', () => roofs.addTo(root, matV, false, true));

    /* ---- the ballpark (the pitch by the grandstand: the infield's dirt, the diamond of grass inside it, the bases, the mound, the outfield
       wall) and the light towers round it; the racecourse (its dirt and the white rails along both edges of the track) ---- */
    {
      const gb = scen.get(190, 0), stand = P.bld.find(o => o.kind === 4 && Math.hypot((o.bb[0] + o.bb[2]) / 2 - 190, (o.bb[1] + o.bb[3]) / 2) < 60);
      const DIRT = [0.62, 0.42, 0.28], GRN = [0.3, 0.5, 0.2], BASE = [0.96, 0.96, 0.94];
      if (stand) {
        const sx = (stand.bb[0] + stand.bb[2]) / 2, sz = (stand.bb[1] + stand.bb[3]) / 2;
        const field = P.lu.filter(o => o.cl === 1).map(o => ({ o, c: [(o.bb[0] + o.bb[2]) / 2, (o.bb[1] + o.bb[3]) / 2] })).filter(f => Math.hypot(f.c[0] - sx, f.c[1] - sz) < 160).sort((a, b) => (b.o.bb[2] - b.o.bb[0]) * (b.o.bb[3] - b.o.bb[1]) - (a.o.bb[2] - a.o.bb[0]) * (a.o.bb[3] - a.o.bb[1]))[0];
        if (field) {
          let hp = field.o.pts[0], hd = 1e9; for (const p of field.o.pts) { const d = Math.hypot(p[0] - sx, p[1] - sz); if (d < hd) { hd = d; hp = p; } }
          const dx = field.c[0] - hp[0], dz = field.c[1] - hp[1], l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l, hx = hp[0] + ux * 6, hz = hp[1] + uz * 6, y = trGround(hx, hz) + 0.05;
          const Q = (a, b, yy) => [hx + ux * a - uz * b, y + (yy || 0), hz + uz * a + ux * b];
          for (let k = 0; k < 12; k++) { const a0 = -Math.PI / 4 + k / 12 * Math.PI / 2, a1 = a0 + Math.PI / 24, r = 29; gb.triO(Q(0, 0), Q(Math.cos(a0) * r, Math.sin(a0) * r), Q(Math.cos(a1) * r, Math.sin(a1) * r), DIRT, Q(0, 0, -1)); }
          const b = 27.4 / Math.SQRT2; gb.quadO(Q(1.5, 0, 0.01), Q(b, b - 1.5, 0.01), Q(2 * b - 1.5, 0, 0.01), Q(b, -b + 1.5, 0.01), GRN, Q(b, 0, -1));
          for (const [a, c] of [[0, 0], [b, b], [2 * b, 0], [b, -b]]) box(gb, ...Q(a, c, 0.0), 0.45, 0.06, 0.45, Math.atan2(uz, ux), BASE, BASE);
          { const m = Q(18.4, 0, 0); cyl(gb, m[0], m[1] - 0.1, m[2], 2.7, 0.3, 10, DIRT, DIRT); }
          const fp = field.o.pts; for (let k = 0; k < fp.length; k++) { const a = fp[k], c = fp[(k + 1) % fp.length]; if (Math.hypot((a[0] + c[0]) / 2 - hp[0], (a[1] + c[1]) / 2 - hp[1]) < 50) continue;
            const ya = trGround(a[0], a[1]), yc = trGround(c[0], c[1]); gb.quadO([a[0], ya - 0.2, a[1]], [c[0], yc - 0.2, c[1]], [c[0], yc + 2.6, c[1]], [a[0], ya + 2.6, a[1]], [0.16, 0.3, 0.2], [field.c[0], ya, field.c[1]]); }
        }
      }
      for (const [k, x, z] of P.pt) if (k === 6 && !inCorr(x, z, 4)) {   // light towers: a steel mast with a bank of lamps
        const y = trGround(x, z), gb = scen.get(x, z); cyl(gb, x, y - 0.3, z, 0.35, 26, 6, [0.6, 0.61, 0.64], null, 0.25); box(gb, x, y + 25, z, 5.2, 3.0, 0.8, Math.atan2(-z, -x), [0.3, 0.31, 0.33], [0.9, 0.9, 0.86]); exclPush(x, z, 3);
      }
      for (const o of P.lu) if (o.cl === 2) { const gb = scen.get((o.bb[0] + o.bb[2]) / 2, (o.bb[1] + o.bb[3]) / 2);   // the racecourse: white rails along the polygon's edge and 18 m inside it
        const cx = (o.bb[0] + o.bb[2]) / 2, cz = (o.bb[1] + o.bb[3]) / 2, r0 = Math.max(o.bb[2] - o.bb[0], o.bb[3] - o.bb[1]) / 2;
        for (const shrink of [0.6, 18]) { const pts = o.pts.map(([x, z]) => { const dx = x - cx, dz = z - cz, l = Math.hypot(dx, dz) || 1, f = Math.max(0, (l - shrink) / l); return [cx + dx * f, cz + dz * f]; });
          for (let k = 0; k < pts.length; k++) { const a = pts[k], c = pts[(k + 1) % pts.length], ya = trGround(a[0], a[1]), yc = trGround(c[0], c[1]);
            gb.quadO([a[0], ya + 0.95, a[1]], [c[0], yc + 0.95, c[1]], [c[0], yc + 1.1, c[1]], [a[0], ya + 1.1, a[1]], BASE, [cx, ya, cz]); gb.quadO([a[0], ya + 0.95, a[1]], [c[0], yc + 0.95, c[1]], [c[0], yc + 1.1, c[1]], [a[0], ya + 1.1, a[1]], BASE, [2 * a[0] - cx, ya, 2 * a[1] - cz]);
            box(gb, a[0], ya, a[1], 0.1, 1.1, 0.1, 0, BASE, BASE, true); } }
        if (r0) exclPush(cx, cz, r0 * 0.5);
      }
    }

    /* ---- trees: the map's trees, the street trees between the sidewalks and the houses, the woods and the parks of the land cover; maples
       most (their crowns turn red and orange in the autumn), ashes and elms, a few spruces; the plain ones far out ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const treeGeo = (kind) => { const g = new GB(), r = rng(1534 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
      const bk = [0.32, 0.26, 0.21], lf = [0.24, 0.4, 0.14], lf2 = [0.28, 0.44, 0.16];
      if (kind === 0) { cone(g, 0, -0.02, 0, 0.04, 0.62, 3, bk, bk, 0.4); ico(g, 0, 0.62, 0, 0.38, 0.88, lf, r, 0.3); }   // a maple: a full round crown
      else if (kind === 1) { cyl(g, 0, -0.02, 0, 0.04, 0.55, 4, bk, null, 0.025); ico(g, 0, 0.74, 0, 0.32, 1.0, [0.27, 0.42, 0.17], r, 0.3); }   // an elm or an ash: a tall vase
      else if (kind === 2) { cone(g, 0, -0.02, 0, 0.03, 0.3, 4, bk, null, 0); const c = [0.12, 0.24, 0.16]; cone(g, 0, 0.12, 0, 0.26, 0.5, 6, c, [0.17, 0.3, 0.2], 0.3); cone(g, 0, 0.48, 0, 0.17, 0.5, 6, c, [0.17, 0.3, 0.2], 0.8); }   // a spruce
      else ico(g, 0, 0.5, 0, 0.45, 0.85, lf, r, 0.3);   // the plain one far out
      API.ROCK_SMOOTH = rs; const geo = g.geometry(); geo.computeBoundingSphere(); return geo; };
    const tk = [0, 1, 2, 3].map(k => new IChunks(treeGeo(k), tMat, 384));
    let nTrees = 0;
    const treeOk = (x, z, m) => !inCorr(x, z, 4.5) && !excluded(x, z) && !trInBld(x, z, m == null ? 1.6 : m) && trRoadD(x, z, 12).d > 0.6 && ![0, 1, 2, 7, 8].includes(trLU(x, z));
    const plant = (x, z, kind, hs) => { const y = trGround(x, z), sp = kind != null ? (kind === 1 ? 0 : kind) : 0, hgt = (sp === 2 ? 11 + R() * 7 : 9 + R() * 9) * (hs || 1), wid = hgt * (sp === 2 ? 0.45 : sp === 1 ? 0.75 : 0.85 + R() * 0.15), cv = 0.85 + R() * 0.3;
      tk[sp].add(x, y - 0.1, z, R() * TAU, wid, hgt, [cv * (0.92 + R() * 0.12), cv, cv * (0.9 + R() * 0.15)]); nTrees++; };
    // candidates first (the map's trees, the street trees, the woods and parks of the land cover), then the nearest to the circuit planted
    // first: the budget goes where the cameras look
    const cand = [], DG = P.DG || (P.DG = (() => { const G = P.G, d = new Float32Array(G.nx * G.nz).fill(1e9); for (let i = 0; i < N; i++) { const a = Math.floor((T.px[i] - G.x0) / G.c), b = Math.floor((T.pz[i] - G.z0) / G.c); if (a >= 0 && b >= 0 && a < G.nx && b < G.nz) d[b * G.nx + a] = 0; } nrChamfer(d, G.nx, G.nz, G.c); return d; })());
    const tdist = (x, z) => DG[P.cell(x, z)];
    const want = (x, z, kind, pr) => { cand.push([x, z, kind == null ? -1 : kind, tdist(x, z) + (pr || 0)]); };
    for (const [x, z] of P.trees) want(x, z, null, -30);
    for (const o of P.rd) if (o.cl >= 1 && o.cl <= 5) {   // street trees
      const hw = TR_RW[o.cl] + 2.7; let acc = R() * 10;
      for (let j = 0; j + 1 < o.pts.length; j++) { const [ax, az] = o.pts[j], [bx, bz] = o.pts[j + 1], L = Math.hypot(bx - ax, bz - az); if (L < 1) continue; const ux = (bx - ax) / L, uz = (bz - az) / L;
        for (let a = acc; a < L; a += 9 + R() * 5) for (const sd of [-1, 1]) { const x = ax + ux * a - uz * sd * hw, z = az + uz * a + ux * sd * hw; if (R() < (trLCf(x, z, 1) > 0.2 ? 0.75 : 0.4)) want(x, z, 0, -10); }
        acc = 0; }
    }
    { const G = P.TG;   // the woods and the parks of the land cover (7 m apart near the circuit, 16 m beyond)
      for (let tj = 0; tj < G.n; tj++) for (let ti = 0; ti < G.n; ti++) { const fine = G.st[tj * G.n + ti] !== 2, step = fine ? 7 : 16, x0 = G.x0 + ti * G.L, z0 = G.z0 + tj * G.L;
        for (let zz = z0; zz < z0 + G.L; zz += step) for (let xx = x0; xx < x0 + G.L; xx += step) {
          const x = xx + (R() - 0.5) * step * 0.8, z = zz + (R() - 0.5) * step * 0.8, lc = trLC(x, z), r1 = R(), lu = fine ? trLU(x, z) : -1;
          const p = lc === 1 ? (fine ? 0.7 : 0.8) : lc === 2 ? (fine ? 0.05 : 0.1) : lu === 3 || lu === 5 ? 0.06 : lc === 0 ? 0.015 : 0;
          if (r1 < p) want(x, z, fine ? null : 3, fine ? 0 : 200); } } }
    cand.sort((a, b) => a[3] - b[3]);
    const MAXT = Math.round(1150 * dens), MAXF = Math.round(450 * dens); let nFar = 0;
    for (const [x, z, kind] of cand) { if (kind === 3 ? nFar >= MAXF : nTrees - nFar >= MAXT) continue; if (!treeOk(x, z, kind === -1 ? 0.5 : null)) continue;
      if (kind === 3) { plant(x, z, 3, 1.25); nFar++; } else plant(x, z, kind === -1 ? null : kind); }
    tk.forEach((t, k) => named('trTree' + k, () => t.addTo(root, k < 3)));   // (kind 1 is no longer planted: the maples' crowns vary in height)

    /* ---- the wooden utility poles along the residential streets (a crossarm, now and then a transformer, a lamp on an arm over the street),
       their wires (sagging, one draw call); the steel lamp posts of the boulevards ---- */
    let nPoles = 0;
    {
      const WOOD = [0.36, 0.28, 0.21], wires = [], STEEL = [0.55, 0.56, 0.58], nearP = (x, z) => clearance(x, z) < 140;
      for (const o of P.rd) {
        if (o.cl < 1 || o.cl > 5) continue;
        const wood = o.cl >= 4, hw = TR_RW[o.cl] + (wood ? 1.0 : 0.6), step = wood ? 34 : 38; let acc = step * 0.5, prev = null;
        for (let j = 0; j + 1 < o.pts.length; j++) { const [ax, az] = o.pts[j], [bx, bz] = o.pts[j + 1], L = Math.hypot(bx - ax, bz - az); if (L < 0.5) continue; const ux = (bx - ax) / L, uz = (bz - az) / L;
          for (; acc < L; acc += step) {
            const sides = wood ? [1] : [nPoles % 2 ? 1 : -1];
            for (const sd of sides) { const x = ax + ux * acc - uz * sd * hw, z = az + uz * acc + ux * sd * hw;
              if (!nearP(x, z) || inCorr(x, z, 2) || trInBld(x, z, 0.6) || excluded(x, z)) { prev = null; continue; }
              const y = trGround(x, z), g = scen.get(x, z), rot = Math.atan2(uz, ux);
              if (wood) { cyl(g, x, y - 0.5, z, 0.14, 11.3, 4, WOOD, null, 0.11); box(g, x, y + 10.0, z, 0.12, 0.12, 2.2, rot, WOOD, WOOD);
                if (nPoles % 3 === 0) cyl(g, x - uz * sd * 0.4, y + 7.6, z + ux * sd * 0.4, 0.3, 1.0, 7, [0.6, 0.62, 0.64], [0.5, 0.51, 0.53]);
                const lx = x + uz * sd * 1.6, lz = z - ux * sd * 1.6; box(g, (x + lx) / 2, y + 7.2, (z + lz) / 2, 0.06, 0.06, 1.7, rot, [0.5, 0.5, 0.52], null); box(g, lx, y + 7.0, lz, 0.6, 0.18, 0.3, rot + Math.PI / 2, [0.55, 0.56, 0.58], [1, 0.96, 0.84]);
                if (prev) for (const [o2, hh] of [[-0.9, 9.95], [0.9, 9.95], [0, 7.6]]) { const ax2 = prev[0] - prev[3] * o2, az2 = prev[1] + prev[2] * o2, bx2 = x - uz * o2, bz2 = z + ux * o2, ya = prev[4] + hh, yb = y + hh, mx = (ax2 + bx2) / 2, mz = (az2 + bz2) / 2, my = (ya + yb) / 2 - 0.55;
                  wires.push(ax2, ya, az2, mx, my, mz, mx, my, mz, bx2, yb, bz2); }
                prev = [x, z, ux, uz, y];
              } else { cyl(g, x, y - 0.3, z, 0.11, 9.3, 6, STEEL, null, 0.08); const lx = x + uz * sd * 2.0, lz = z - ux * sd * 2.0; box(g, (x + lx) / 2, y + 8.7, (z + lz) / 2, 0.07, 0.07, 2.1, rot, STEEL, null); box(g, lx, y + 8.5, lz, 0.7, 0.2, 0.32, rot + Math.PI / 2, STEEL, [1, 0.96, 0.84]); }
              nPoles++; } }
          acc -= L; }
      }
      if (wires.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3)); const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x1c1c1e })); m.matrixAutoUpdate = false; root.add(m); }
    }

    /* ---- parked cars: along the residential streets (both kerbs) and in the car parks, which are full on a race day (no makes, no badges) ---- */
    let nCars = 0;
    {
      const g = new GB(), body = [1, 1, 1], glass = [0.12, 0.14, 0.17], tyre = [0.07, 0.07, 0.08];
      box(g, 0, 0.28, 0, 4.5, 0.72, 1.78, 0, body, body, true); box(g, -0.25, 0.98, 0, 2.4, 0.56, 1.58, 0, glass, body, true); for (const a of [-1.4, 1.4]) box(g, a, 0, 0, 0.64, 0.3, 1.86, 0, tyre, tyre, true);
      const cars = new IChunks(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }), 768), nearC = (x, z) => { const G = P.TG, ti = Math.floor((x - G.x0) / G.L), tj = Math.floor((z - G.z0) / G.L); return ti >= 0 && tj >= 0 && ti < G.n && tj < G.n && G.st[tj * G.n + ti] !== 2; };
      const CC = [[0.92, 0.92, 0.9], [0.1, 0.1, 0.11], [0.55, 0.57, 0.6], [0.72, 0.1, 0.1], [0.14, 0.24, 0.5], [0.8, 0.8, 0.82], [0.3, 0.32, 0.34], [0.52, 0.12, 0.14], [0.2, 0.36, 0.3]];
      const park = (x, z, rot) => { if (!nearC(x, z) || inCorr(x, z, 1.5) || trInBld(x, z, 1.2) || excluded(x, z)) return; cars.add(x, trGround(x, z) + 0.06, z, rot, 1, 1, CC[Math.floor(R() * CC.length)]); nCars++; };
      for (const o of P.rd) { if (o.cl !== 4 && o.cl !== 5) continue; const hw = TR_RW[o.cl] - 1.05;
        for (let j = 0; j + 1 < o.pts.length; j++) { const [ax, az] = o.pts[j], [bx, bz] = o.pts[j + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
          for (let a = 8; a < L - 8; a += 6.4) for (const sd of [-1, 1]) if (R() < 0.12) park(ax + ux * a - uz * sd * hw, az + uz * a + ux * sd * hw, -Math.atan2(uz, ux) + (sd > 0 ? Math.PI : 0)); } }
      for (const o of P.lu) { if (o.cl !== 0) continue; const B = obb(o.pts), c = Math.cos(B.ang), s = Math.sin(B.ang), full = clearance(B.cx, B.cz) < 60 ? 0.3 : 0.06;
        for (let v = -B.D / 2 + 3; v < B.D / 2 - 2.5; v += 7) for (let u = -B.L / 2 + 2; u < B.L / 2 - 1.5; u += 2.7) { if (R() > full) continue; const x = B.cx + u * c - v * s, z = B.cz + u * s + v * c; if (!inPoly(o.pts, x, z)) continue; park(x, z, -(B.ang + Math.PI / 2) + (((v / 7) | 0) % 2 ? Math.PI : 0)); } }
      named('trCars', () => cars.addTo(root, false));
    }

    /* ---- the street furniture away from the circuit (the map's: traffic lights at the junctions of the big streets, STOP signs, bus stops
       with their shelters, bollards, letter boxes, benches); at the circuit's junctions the knockable ones (def.streetProps) ---- */
    {
      const dk = [0.16, 0.17, 0.18], gy = [0.56, 0.57, 0.6], red = [0.8, 0.09, 0.08], wh = [0.95, 0.95, 0.93];
      const towards = (x, z) => { const r = trRoadD(x, z, 6); if (r.k < 0) return 0; const o = P.rd[r.k], a = o.pts[r.seg], b = o.pts[r.seg + 1]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
      for (const [k, x, z] of P.pt) {
        if (inCorr(x, z, 2.5) || trInBld(x, z, 0.3)) continue;
        const y = trGround(x, z) + 0.12, rot = towards(x, z), g = scen.get(x, z);
        if (k === 0) { cyl(g, x, y - 0.2, z, 0.1, 5.4, 6, dk, dk); box(g, x, y + 4.0, z, 0.32, 1.0, 0.32, rot, dk, dk); for (let q = 0; q < 3; q++) box(g, x, y + 4.7 - q * 0.3, z, 0.36, 0.2, 0.2, rot, q === 0 ? [0.9, 0.1, 0.08] : q === 2 ? [0.2, 0.8, 0.4] : [0.3, 0.22, 0.05]); }
        else if (k === 1) { box(g, x, y - 0.2, z, 0.07, 2.3, 0.07, rot, gy, gy); box(g, x, y + 1.7, z, 0.04, 0.75, 0.75, rot + Math.PI / 4, red, red); }
        else if (k === 3) { box(g, x, y - 0.2, z, 0.07, 2.6, 0.07, rot, gy, gy); box(g, x, y + 2.0, z, 0.05, 0.45, 0.6, rot, [0.2, 0.36, 0.7], wh); const sx = x + Math.cos(rot) * 2.5, sz = z + Math.sin(rot) * 2.5; box(g, sx, y, sz, 3.2, 2.4, 1.4, rot, [0.6, 0.7, 0.75], [0.3, 0.32, 0.35]); }
        else if (k === 4) cyl(g, x, y - 0.2, z, 0.1, 1.1, 6, [0.96, 0.78, 0.1], [0.96, 0.78, 0.1]);
        else if (k === 5) box(g, x, y - 0.1, z, 0.56, 1.25, 0.46, rot, red, red);
        else if (k === 8) box(g, x, y + 0.3, z, 1.7, 0.12, 0.45, rot, [0.56, 0.38, 0.22], [0.56, 0.38, 0.22]);
      }
    }
    out.props = def.streetProps ? def.streetProps(T) : [];
    out.propStats = roadsideProps(out.props, { exits: 4, apexes: 0, wallEdge: [1.0, 1.4], stacks: [4, 6], rows2: 0.3, skip: (i, side, x, z) => excluded(x, z) || !!inPitZone(i * ds) });

    /* ---- the land out to 3 km beyond the terrain (the roofs, the woods, the river) and the long steel bridge over the river: drawn behind
       everything, just inside the camera's far plane in its own direction (Irohazaka's way: irFarUpdate) ---- */
    { const F = trFar(); if (F) { root.add(F.mesh); out.dyn.irFar = F; } }

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true); sceneryGroup.name = 'trScen'; named('trAsph', () => asphC.addTo(root, aMat, false, true)); named('trMarks', () => markC.addTo(root, lMat, false, true));
    crowdFinish(CR, root, out);
    out.bounds = { minX: -1536, maxX: 1536, minZ: -1536, maxZ: 1536 };
    out.stats = { tiles: nTiles, trees: nTrees, posts: nPosts, buildings: nBld, plexes: nPlex, streets: nStreets, poles: nPoles, cars: nCars, tents: nTents, stands: nStands, fans: nFans, props: out.props.length };   // (read by the tests)
    return out;
  }
  function trFar() {   // the land beyond the terrain: 60 m cells, the ground raised by the roofs (grey and brown) and the tree tops (green), the river; the bridge
    const F = T.def.tr.far, n = F.n, b = hjB64(F.b64), H = new Float32Array(n * n), K = new Uint8Array(n * n), TOP = new Float32Array(n * n), dr = new Float32Array(n * n);
    for (let k = 0; k < n * n; k++) { H[k] = b[k * 2] / 2 - 60; K[k] = b[k * 2 + 1] >> 5; TOP[k] = b[k * 2 + 1] & 31; }
    const m2 = (n + 1) >> 1;   // (every other cell: 120 m apart)
    for (let j = 0; j < m2; j++) for (let i = 0; i < m2; i++) { const x = F.x0 + i * 2 * F.cell, z = F.z0 + j * 2 * F.cell; let m = 1e18; for (let q = 0; q < T.N; q += 6) { const d = (x - T.px[q]) ** 2 + (z - T.pz[q]) ** 2; if (d < m) m = d; } dr[j * m2 + i] = Math.sqrt(m); }
    const P0 = [], C = [], I = [];
    for (let j = 0; j < m2; j++) for (let i = 0; i < m2; i++) {
      const k = j * 2 * n + i * 2, q = rpHash(i, j) - 0.5, cl = K[k]; let h = H[k], c;
      if (cl === 4) { h = Math.min(h, -24); c = [0.3, 0.38, 0.42]; }
      else if (cl === 1) { h += TOP[k] * 0.8; c = [0.2 + q * 0.04, 0.33 + q * 0.05, 0.15]; }
      else if (cl === 2) { h += Math.min(TOP[k], 14) * 0.6; c = [0.52 + q * 0.12, 0.47 + q * 0.08, 0.43 + q * 0.06]; }
      else c = [0.42 + q * 0.06, 0.5 + q * 0.06, 0.3];
      P0.push(F.x0 + i * 2 * F.cell, h, F.z0 + j * 2 * F.cell); C.push(c[0], c[1], c[2]);
    }
    for (let j = 0; j + 1 < m2; j++) for (let i = 0; i + 1 < m2; i++) { const a = j * m2 + i, b2 = a + 1, c = a + m2, d = c + 1; if (Math.min(dr[a], dr[b2], dr[c], dr[d]) < 720) continue; I.push(a, c, b2, b2, c, d); }
    // the bridge (2.7 km): the deck rising from both banks to 55 m over the river on piers 75 m apart, the arched truss over its middle span (335 m)
    const BR = T.def.bridge;
    if (BR) { const [a, e] = BR, L = Math.hypot(e[0] - a[0], e[1] - a[1]), ux = (e[0] - a[0]) / L, uz = (e[1] - a[1]) / L, px = -uz, pz = ux, wid = 6, base = -26, top = 55;
      const deckY = (t) => base + 4 + (top - 4) * Math.min(1, Math.min(t, L - t) / (L * 0.42)), Q = (t, o, y) => [a[0] + ux * t + px * o, y, a[1] + uz * t + pz * o], ST = [0.42, 0.46, 0.44], DK = [0.36, 0.37, 0.38];
      const quad = (A, B2, C2, D2, col) => { const v = P0.length / 3; for (const p of [A, B2, C2, D2]) { P0.push(p[0], p[1], p[2]); C.push(col[0], col[1], col[2]); } I.push(v, v + 1, v + 2, v, v + 2, v + 3, v, v + 2, v + 1, v, v + 3, v + 2); };
      for (let t = 0; t + 30 <= L; t += 30) { quad(Q(t, -wid, deckY(t)), Q(t + 30, -wid, deckY(t + 30)), Q(t + 30, wid, deckY(t + 30)), Q(t, wid, deckY(t)), DK); quad(Q(t, -wid, deckY(t) - 2.5), Q(t + 30, -wid, deckY(t + 30) - 2.5), Q(t + 30, -wid, deckY(t + 30)), Q(t, -wid, deckY(t)), ST); }
      for (let t = 40; t < L - 20; t += 75) { const y = deckY(t); if (Math.abs(t - L / 2) < 170) continue; quad(Q(t - 1.5, -3, base), Q(t + 1.5, -3, base), Q(t + 1.5, -3, y - 2.5), Q(t - 1.5, -3, y - 2.5), [0.62, 0.62, 0.6]); quad(Q(t - 1.5, 3, base), Q(t + 1.5, 3, base), Q(t + 1.5, 3, y - 2.5), Q(t - 1.5, 3, y - 2.5), [0.62, 0.62, 0.6]); }
      const m0 = L / 2 - 168, ay = (t) => deckY(t) + 30 * Math.sin(Math.PI * clamp((t - m0) / 336, 0, 1));
      for (let t = m0; t < m0 + 336; t += 24) for (const o of [-wid, wid]) { quad(Q(t, o, ay(t)), Q(t + 24, o, ay(t + 24)), Q(t + 24, o, ay(t + 24) - 3), Q(t, o, ay(t) - 3), ST); quad(Q(t, o - 0.4, deckY(t)), Q(t + 0.8, o - 0.4, deckY(t)), Q(t + 0.8, o - 0.4, ay(t)), Q(t, o - 0.4, ay(t)), ST); }
    }
    const g = new THREE.BufferGeometry(), nv = P0.length / 3;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
    g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1)); g.setIndex(I); g.computeVertexNormals();
    const U = { uHz: { value: new THREE.Color(0xc8d6e2) } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false });
    m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
    m.customProgramCacheKey = () => 'trFar';
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'trFar';
    mesh.onBeforeRender = (r, sc) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); };
    const rim = new Float32Array(nv); for (let k = 0; k < m2 * m2; k++) rim[k] = sstep(1100, 750, dr[k]);
    return { mesh, P0: Float32Array.from(P0), rim, cx: 1e9, cy: 0, cz: 0, cf: 0 };
  }

  Object.defineProperties(API, { TRW: { get: () => TRW, set: (v) => { TRW = v; } } });
  World.ext.troisrivieres = (scene, tex, opts) => buildTroisRivieres(scene, tex, opts);
})();
