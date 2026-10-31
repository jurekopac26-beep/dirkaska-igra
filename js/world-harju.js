/* =========================================================================
   WORLD — Harju (theme 'harju'): its own builder (World.ext.harju), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl, hjCutMat, ico, inPoly, lerp, ouCutMat,
    ouFlag, ouGTex, ouRod, ouVegMat, pkSky, polyDist, propFloorTable, rng, sstep, starCone, valueNoise2, vary
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= HARJU (theme 'harju') =================
     Rally Finland's city stage on the Harju ridge in Jyväskylä, on its real ground and at its real scale. Terrain: the bare-earth ArcticDEM
     (def.scen.dem, a 5 m grid, bicubic onto a 2.5 m mesh in 160 m tiles), the road's own height inside its barriers, blended out over
     ~14 m; round it a 20 m ring from Copernicus (def.scen.far) with the lakes Jyväsjärvi and Tuomiojärvi (def.scen.water). The town from
     OpenStreetMap (read through Overture Maps): the buildings raised to their measured heights with floors of windows and flat or gabled
     roofs, the streets, paths and steps, lawns, car parks and squares, street lamps, benches and bus stops; the trees from the canopy height
     model (the old Scots pines of the ridge, spruces, birches and lindens), filled in where the canopy is closed. The stage: tarmac with its
     lines, the esker's gravel, the school yard's paving stones, granite kerbs and sidewalks; on race day fences and tape, straw bale chicanes,
     spectators on the slopes and along the streets, the start with its lights, the split and finish gantries, the TV. Landmarks: the
     Vesilinna water tower on the summit, the Harju stadium, the hillside steps. Hot loops live in these small functions (as for Ouninpohja). */
  const HJC = 2.5, HJT = 64, HJHC = 32;        // terrain cell (m), tile size (cells: 160 m), road-sample hash cell (m)
  let HJ = null;                               // per-build data: sample hash, height grids, lakes, the terrain grid and its rasters
  const HJN = { i: -1, d: 1e9, dd: 1e9, lat: 0, h: 0, hn: 0 };   // hjNear: nearest sample, its distance, distance beyond the barrier, lateral offset, blended and exact road height
  const HJCOL = [0, 0, 0];
  function hjB64(b) { const s = atob(b), a = new Uint8Array(s.length); for (let k = 0; k < s.length; k++) a[k] = s.charCodeAt(k); return a; }
  function hjI16(b) { const u = hjB64(b), v = new DataView(u.buffer), n = u.length >> 1, a = new Int16Array(n); for (let k = 0; k < n; k++) a[k] = v.getInt16(k * 2, true); return a; }   // (little-endian, as written)
  function hjGrid(D) {   // a height grid, rows nibble-delta coded (the first value a byte, then deltas -7..7 as 0..14, 15: the next byte whole) -> heights
    const u = hjB64(D.nd), n = D.nx * D.nz, out = new Float32Array(n); let p = 0;
    const nib = () => { const b = u[p >> 1], v = p & 1 ? b & 15 : b >> 4; p++; return v; };
    for (let j = 0; j < D.nz; j++) { let v = nib() * 16 + nib(); out[j * D.nx] = v;
      for (let i = 1; i < D.nx; i++) { const q = nib(); v = q === 15 ? nib() * 16 + nib() : v + q - 7; out[j * D.nx + i] = v; } }
    for (let k = 0; k < n; k++) out[k] = D.lo + out[k] * D.step;
    return out;
  }
  const hjCR = (a, b, c, d, t) => b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));   // Catmull-Rom
  // the ground types of the areas (def.scen.areas): 0 lawn, 1 garden, 2 pitch, 3 running track, 4 sand, 5 car park, 6 square, 7 building site,
  // 8 school yard, 9 woods, 10 park, 11 stadium, 12 ski slope, 13 wetland; the higher priority wins where they overlap (none: 255, the town's yards;
  // the stadium's running track is mapped as the whole oval: the pitch inside it wins)
  const HJ_PRI = [4, 5, 10, 9, 6, 8, 8, 5, 3, 2, 1, 2, 2, 4];
  // the town's streets and paths (def.scen.roads, class in the code's top bits): 0 main street, 1 residential, 2 living street, 3 service road, 4 track,
  // 5 footway, 6 path, 7 cycleway, 8 steps, 9 pedestrian street; their half widths (m)
  const HJ_RHW = [4.4, 3.2, 2.8, 2.1, 1.5, 1.05, 0.75, 1.2, 1.3, 2.6];
  function hjPrep() {
    const def = T.def, S = def.scen, N = T.N;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    const P = HJ = { bx0: x0, bx1: x1, bz0: z0, bz1: z1 };
    // every road sample in a hash grid (the samples are 2 m apart; the hairpins and the lane change need them all)
    const M = 100; P.cx0 = Math.floor((x0 - M) / HJHC); P.cz0 = Math.floor((z0 - M) / HJHC); P.ncx = Math.floor((x1 + M) / HJHC) - P.cx0 + 1; P.ncz = Math.floor((z1 + M) / HJHC) - P.cz0 + 1; P.cells = new Array(P.ncx * P.ncz);
    for (let i = 0; i < N; i++) { const k = (Math.floor(T.pz[i] / HJHC) - P.cz0) * P.ncx + Math.floor(T.px[i] / HJHC) - P.cx0; (P.cells[k] || (P.cells[k] = [])).push(i); }
    // the real ground: the inner 5 m grid (bare earth, m above the start line) and the far ring (20 m); the lakes' beds under the far ring
    P.D = S.dem; P.dem = hjGrid(S.dem); P.F = S.far; P.far = hjGrid(S.far);
    P.lakes = (S.water || []).map(w => { const a = hjI16(w.p), poly = []; let lx0 = 1e9, lx1 = -1e9, lz0 = 1e9, lz1 = -1e9;
      for (let k = 0; k < a.length; k += 2) { const x = a[k] / 2, z = a[k + 1] / 2; poly.push([x, z]); lx0 = Math.min(lx0, x); lx1 = Math.max(lx1, x); lz0 = Math.min(lz0, z); lz1 = Math.max(lz1, z); }
      return { poly, h: w.h, name: w.n, x0: lx0, x1: lx1, z0: lz0, z1: lz1 }; });
    { const F = P.F; for (let j = 0; j < F.nz; j++) for (let i = 0; i < F.nx; i++) { const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell, k = j * F.nx + i;
      for (const L of P.lakes) if (x > L.x0 && x < L.x1 && z > L.z0 && z < L.z1 && inPoly(L.poly, x, z)) P.far[k] = Math.min(P.far[k], L.h - 0.9 - Math.min(5, polyDist(L.poly, x, z) * 0.06)); } }
    // the terrain mesh's grid: 2.5 m over the inner grid's box, in 160 m tiles, on the far ring's grid lines (its edge meets the ring without a crack)
    const D = P.D, G = P.G = { x0: D.x0, z0: D.z0 }; G.ntx = Math.ceil((D.nx - 1) * D.cell / (HJC * HJT)); G.ntz = Math.ceil((D.nz - 1) * D.cell / (HJC * HJT)); G.nx = G.ntx * HJT + 1; G.nz = G.ntz * HJT + 1;
    G.x1 = G.x0 + (G.nx - 1) * HJC; G.z1 = G.z0 + (G.nz - 1) * HJC;
    const NV = G.nx * G.nz; G.h = new Float32Array(NV).fill(NaN); G.dd = new Float32Array(NV); G.gt = new Uint8Array(NV).fill(255); G.bm = new Uint8Array(NV); G.pv = new Uint8Array(NV); G.gd = new Uint8Array(NV);
    // rasters on the grid's vertices: the ground type (areas), under a building (bm), under a street, path or car park (pv: set by the builder)
    const pri = new Uint8Array(NV);
    const A = hjI16(S.areas); P.areas = [];
    for (let k = 0; k < A.length;) { const n = A[k], t = A[k + 1], poly = []; for (let q = 0; q < n; q++) poly.push([A[k + 2 + q * 2] / 2, A[k + 3 + q * 2] / 2]); k += 2 + n * 2;
      P.areas.push({ t, poly }); hjFill(poly, (v) => { if (HJ_PRI[t] > pri[v]) { pri[v] = HJ_PRI[t]; G.gt[v] = t; } }); }
    const B = hjI16(S.bld); P.blds = [];
    for (let k = 0; k < B.length;) { const n = B[k], kr = B[k + 1], h = B[k + 2] / 10, poly = []; for (let q = 0; q < n; q++) poly.push([B[k + 3 + q * 2] / 4, B[k + 4 + q * 2] / 4]); k += 3 + n * 2;
      P.blds.push({ kind: kr >> 4, roof: kr & 15, h, poly }); hjFill(poly, (v) => { G.bm[v] = 1; }, 1.2); if (kr >> 4 === 1) hjFill(poly, (v) => { G.gd[v] = 1; }, 12); }   // (gd: the gardens round the houses)
    // the tarmac streets (sw): the ground under them and just beside them is tarmac (2: no yard shows where the ribbons leave gaps at the junctions),
    // a strip of verge beyond (1: a mown lawn rather than the yards' gravel and worn grass)
    G.sw = new Uint8Array(NV);
    { const RD = hjI16(S.roads);
      for (let k = 0; k < RD.length;) { const n = RD[k], cls = RD[k + 1] >> 3, surf = RD[k + 1] & 7, a = k + 2; k += 2 + n * 2;
        if (surf !== 0 || (cls > 3 && cls !== 5 && cls !== 7 && cls !== 9)) continue; const hw = HJ_RHW[cls];
        for (let q = 0; q < n - 1; q++) { const ax = RD[a + q * 2] / 4, az = RD[a + q * 2 + 1] / 4, bx = RD[a + q * 2 + 2] / 4, bz = RD[a + q * 2 + 3] / 4;
          hjMarkSeg(ax, az, bx, bz, hw + (cls <= 3 ? 0.8 : 0.3), 2, G.sw); if (cls <= 3) hjMarkSeg(ax, az, bx, bz, hw + 3.5, 1, G.sw); } } }
    // the canopy cover (4 m cells, canopy height classes 0-5: none, 4-9 m ... 24 m and more), runs of (value * 32 + length - 1)
    const C = S.canopy, cr = hjB64(C.rle), cv = P.can = new Uint8Array(C.nx * C.nz); P.C = C;
    for (let p = 0, k = 0; p < cr.length && k < cv.length; p++) { const v = cr[p] >> 5, n = (cr[p] & 31) + 1; cv.fill(v, k, Math.min(cv.length, k + n)); k += n; }
    P.n1 = valueNoise2(801, 60); P.n2 = valueNoise2(802, 18); P.n3 = valueNoise2(803, 7); P.n4 = valueNoise2(804, 140); P.n5 = valueNoise2(805, 3.2);
  }
  // every grid vertex inside poly (grown by 'grow' m: a square around each vertex tested against the edges) -> fn(vertex index)
  function hjFill(poly, fn, grow) {
    const G = HJ.G; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const g = grow || 0, i0 = Math.max(0, Math.ceil((x0 - g - G.x0) / HJC)), i1 = Math.min(G.nx - 1, Math.floor((x1 + g - G.x0) / HJC)), j0 = Math.max(0, Math.ceil((z0 - g - G.z0) / HJC)), j1 = Math.min(G.nz - 1, Math.floor((z1 + g - G.z0) / HJC));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = G.x0 + i * HJC, z = G.z0 + j * HJC; if (inPoly(poly, x, z) || (g > 0 && polyDist(poly, x, z) < g)) fn(j * G.nx + i); }
  }
  // grid vertices within r of the segment a-b -> G.pv (the paved mask: no trees, no crowd there), or the raster M
  function hjMarkSeg(ax, az, bx, bz, r, val, M) {
    const G = HJ.G, A = M || G.pv, i0 = Math.max(0, Math.ceil((Math.min(ax, bx) - r - G.x0) / HJC)), i1 = Math.min(G.nx - 1, Math.floor((Math.max(ax, bx) + r - G.x0) / HJC)), j0 = Math.max(0, Math.ceil((Math.min(az, bz) - r - G.z0) / HJC)), j1 = Math.min(G.nz - 1, Math.floor((Math.max(az, bz) + r - G.z0) / HJC));
    const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = G.x0 + i * HJC, z = G.z0 + j * HJC, t = clamp(((x - ax) * vx + (z - az) * vz) / l2, 0, 1), dx = x - ax - vx * t, dz = z - az - vz * t; if (dx * dx + dz * dz < r * r) A[j * G.nx + i] = Math.max(A[j * G.nx + i], val); }
  }
  function hjFarH(x, z) {   // the far ring (bilinear)
    const P = HJ, F = P.F, gx = clamp((x - F.x0) / F.cell, 0, F.nx - 1.001), gz = clamp((z - F.z0) / F.cell, 0, F.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = F.nx, a = P.far;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function hjDem(x, z) {   // the real ground: the inner grid (bicubic), blended into the far ring over its outer 60 m
    const P = HJ, D = P.D, gx = (x - D.x0) / D.cell, gz = (z - D.z0) / D.cell, e = Math.min(gx, gz, D.nx - 1 - gx, D.nz - 1 - gz) * D.cell;
    if (e <= 0) return hjFarH(x, z);
    const i = clamp(Math.floor(gx), 1, D.nx - 3), j = clamp(Math.floor(gz), 1, D.nz - 3), u = gx - i, v = gz - j, A = P.dem, W = D.nx;
    const r = (jj) => { const o = jj * W + i; return hjCR(A[o - 1], A[o], A[o + 1], A[o + 2], u); };
    const h = hjCR(r(j - 1), r(j), r(j + 1), r(j + 2), v);
    return e >= 60 ? h : lerp(hjFarH(x, z), h, sstep(0, 60, e));
  }
  function hjNear(x, z) {   // Shepard blend of the road heights around (x, z): weights fall with the distance beyond each sample's barrier
    const P = HJ, cx = Math.floor(x / HJHC) - P.cx0, cz = Math.floor(z / HJHC) - P.cz0, ds = T.ds;
    let ws = 0, hs = 0, bd = 1e9, bi = -1, bl = 0, ba = 0, bdd = 1e9;
    if (cx >= -2 && cz >= -2 && cx < P.ncx + 2 && cz < P.ncz + 2)
    for (let b = Math.max(0, cz - 2); b <= Math.min(P.ncz - 1, cz + 2); b++) for (let a = Math.max(0, cx - 2); a <= Math.min(P.ncx - 1, cx + 2); a++) {
      const L = P.cells[b * P.ncx + a]; if (!L) continue;
      for (let q = 0; q < L.length; q++) {
        const i = L[q], dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], lat = dx * T.nx[i] + dz * T.nz[i], ex = Math.max(0, Math.abs(al) - ds * 0.5), d = Math.sqrt(lat * lat + ex * ex);
        if (d >= 64) continue;
        const dd = Math.max(0, d - (lat > 0 ? T.br[i] : T.bl[i])), k = 1 / (dd + 1.5), wq = k * k * k * k * (d < 48 ? 1 : sstep(64, 48, d));
        ws += wq; hs += wq * T.hy[i];
        if (d < bd) { bd = d; bi = i; bl = lat; ba = al; }
        if (dd < bdd) bdd = dd;
      }
    }
    HJN.i = bi; HJN.d = bd; HJN.dd = bdd; HJN.lat = bl;
    if (bi < 0) return HJN;
    HJN.h = hs / ws;
    const f = clamp(bi + ba / ds, 0, T.N - 1), i0 = Math.min(T.N - 2, Math.floor(f)); HJN.hn = T.hy[i0] + (T.hy[i0 + 1] - T.hy[i0]) * (f - i0);   // the road's height across from the point
    return HJN;
  }
  function hjH(x, z) {   // terrain height: under the verge ribbons inside the barriers (0.3 m below the road), up to the sidewalks' level where they end
    // (1.9 m past the barrier), then over 12 m into the real ground
    const n = hjNear(x, z), i = n.i, dd = n.dd, hn = n.hn, f = hjDem(x, z); let h;
    if (i < 0) h = f;
    else { const hr = lerp(hn, n.h, sstep(0, 8, dd)) - 0.3 + 0.42 * sstep(0.3, 1.9, dd); h = dd <= 2 ? hr : lerp(hr, f, sstep(2, 14, dd));
      if (dd < 2) h = Math.min(h, hn - 0.3 + 0.42 * sstep(0.3, 1.9, dd) + 0.08 * dd * dd); }
    HJN.dd = i >= 0 ? dd : 999;
    return h;
  }
  function hjGH(i, j) {   // terrain height at grid vertex (i, j), computed once (with the distance beyond the barrier there)
    const G = HJ.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { const x = G.x0 + i * HJC, z = G.z0 + j * HJC; h = hjH(x, z);
      if (i === 0 || j === 0 || i === G.nx - 1 || j === G.nz - 1) h = hjFarH(x, z);   // (the edge: exactly the far ring's line)
      G.h[k] = h; G.dd[k] = HJN.dd; h = G.h[k]; }
    return h;
  }
  // the mesh's level of detail: 20 m blocks (8 cells) of 2.5 m cells along the road, 5 m out to ~110 m, 10 m beyond; where a finer block meets
  // a coarser one, its edge vertices between the coarser one's go onto that straight edge (no cracks). G.hr: the drawn height of every vertex the mesh
  // uses (hjGround follows the drawn surface, so the streets, houses, trees and people stand on what is drawn)
  const HJB = 8;
  function hjLOD() {
    const G = HJ.G, nb = G.nbx = (G.nx - 1) / HJB, nbz = G.nbz = (G.nz - 1) / HJB, bs = G.bs = new Uint8Array(nb * nbz), sx = [], sz = [];
    for (let i = 0; i < T.N; i += 3) { sx.push(T.px[i]); sz.push(T.pz[i]); }
    for (let bj = 0; bj < nbz; bj++) for (let bi = 0; bi < nb; bi++) {
      const x = G.x0 + (bi + 0.5) * HJB * HJC, z = G.z0 + (bj + 0.5) * HJB * HJC; let d2 = 1e18;
      for (let k = 0; k < sx.length; k++) { const dx = x - sx[k], dz = z - sz[k], d = dx * dx + dz * dz; if (d < d2) d2 = d; }
      const d = Math.sqrt(d2) - HJB * HJC * 0.71; bs[bj * nb + bi] = d < 14 ? 1 : d < 100 ? 2 : 4;
    }
    const hr = G.hr = new Float32Array(G.nx * G.nz).fill(NaN), W = G.nx;
    for (let bj = 0; bj < nbz; bj++) for (let bi = 0; bi < nb; bi++) { const s = bs[bj * nb + bi];
      for (let b = 0; b <= HJB; b += s) for (let a = 0; a <= HJB; a += s) { const i = bi * HJB + a, j = bj * HJB + b; hr[j * W + i] = hjGH(i, j); } }
    const st = (bi, bj) => (bi < 0 || bj < 0 || bi >= nb || bj >= nbz ? 0 : bs[bj * nb + bi]);
    for (let bj = 0; bj < nbz; bj++) for (let bi = 0; bi < nb; bi++) {
      const s = bs[bj * nb + bi], i0 = bi * HJB, j0 = bj * HJB;
      const fix = (sn, horiz, K) => { for (let q = s; q < HJB; q += s) { if (q % sn === 0) continue; const qa = q - (q % sn), t = (q - qa) / sn;
        if (horiz) hr[K * W + i0 + q] = lerp(hr[K * W + i0 + qa], hr[K * W + i0 + qa + sn], t); else hr[(j0 + q) * W + K] = lerp(hr[(j0 + qa) * W + K], hr[(j0 + qa + sn) * W + K], t); } };
      let sn; if ((sn = st(bi, bj - 1)) > s) fix(sn, true, j0); if ((sn = st(bi, bj + 1)) > s) fix(sn, true, j0 + HJB); if ((sn = st(bi - 1, bj)) > s) fix(sn, false, i0); if ((sn = st(bi + 1, bj)) > s) fix(sn, false, i0 + HJB);
    }
  }
  function hjGround(x, z) {   // height of the drawn terrain surface (its block's cells, the same two triangles per cell as the tiles; the far ring outside the grid)
    const G = HJ.G;
    if (x < G.x0 || z < G.z0 || x > G.x1 || z > G.z1) return hjFarH(x, z);
    const gx = Math.min((x - G.x0) / HJC, G.nx - 1.001), gz = Math.min((z - G.z0) / HJC, G.nz - 1.001);
    if (!G.hr) { const i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;   // (before the levels of detail are set: the fine grid)
      if (u + v <= 1) { const a = hjGH(i, j); return a + u * (hjGH(i + 1, j) - a) + v * (hjGH(i, j + 1) - a); }
      const d = hjGH(i + 1, j + 1); return d + (1 - u) * (hjGH(i, j + 1) - d) + (1 - v) * (hjGH(i + 1, j) - d); }
    const s = G.bs[Math.min(G.nbz - 1, Math.floor(gz / HJB)) * G.nbx + Math.min(G.nbx - 1, Math.floor(gx / HJB))], i = Math.min(Math.floor(gx / s) * s, G.nx - 1 - s), j = Math.min(Math.floor(gz / s) * s, G.nz - 1 - s);
    const u = (gx - i) / s, v = (gz - j) / s, H = G.hr, W = G.nx;
    if (u + v <= 1) { const a = H[j * W + i]; return a + u * (H[j * W + i + s] - a) + v * (H[(j + s) * W + i] - a); }
    const d = H[(j + s) * W + i + s]; return d + (1 - u) * (H[(j + s) * W + i] - d) + (1 - v) * (H[j * W + i + s] - d);
  }
  function hjCanopy(x, z) { const C = HJ.C, i = Math.floor((x - C.x0) / C.cell), j = Math.floor((z - C.z0) / C.cell); return i < 0 || j < 0 || i >= C.nx || j >= C.nz ? 0 : HJ.can[j * C.nx + i]; }
  function hjCanopyS(x, z) {   // the canopy class smoothed (bilinear over the 4 m cells' centres): how much crown is overhead, for the shade on the ground
    const C = HJ.C, gx = (x - C.x0) / C.cell - 0.5, gz = (z - C.z0) / C.cell - 0.5, i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, at = (a, b) => (a < 0 || b < 0 || a >= C.nx || b >= C.nz ? 0 : HJ.can[b * C.nx + a]);
    return lerp(lerp(at(i, j), at(i + 1, j), u), lerp(at(i, j + 1), at(i + 1, j + 1), u), v);
  }
  function hjCol(x, z, ny, k) {   // ground colour at grid vertex k (multiplies the mottled ground map): the town's yards, lawns, the pine forest's floor of needles,
    // moss and sand on the ridge, the gardens, the stadium's pitch and red track, sand pits, bare sand on the steep esker slopes, a trodden verge by the road
    const P = HJ, G = P.G, t = G.gt[k], m = P.n2(x, z), q = P.n3(x, z), cv = hjCanopy(x, z), dd = G.dd[k], sw = G.sw[k];
    if (sw === 2 && t !== 2 && t !== 3 && t !== 11 && t !== 12 && t !== 13 && !G.bm[k]) {   // under a street and just beside it: its tarmac (as the ribbons over the ground's map)
      HJCOL[0] = 0.41 + q * 0.03; HJCOL[1] = 0.423 + q * 0.03; HJCOL[2] = 0.443 + q * 0.03; return HJCOL; }
    let r, g, b;
    const lawn = () => { r = 0.33 + m * 0.07 + q * 0.03; g = 0.46 + m * 0.06 + q * 0.03; b = 0.17 + m * 0.03; };
    const floor = () => { r = 0.34 + m * 0.08 + q * 0.04; g = 0.33 + m * 0.06 + q * 0.03; b = 0.2 + m * 0.03;   // needles and sand
      const mo = sstep(0.45, 0.7, P.n1(x * 1.7 + 30, z * 1.7)) * 0.7; r = lerp(r, 0.25, mo); g = lerp(g, 0.34, mo); b = lerp(b, 0.14, mo);   // lingonberry and moss
      const sa = sstep(0.62, 0.8, P.n1(x * 1.3 + 80, z * 1.3 - 40)) * 0.6; r = lerp(r, 0.6, sa); g = lerp(g, 0.53, sa); b = lerp(b, 0.38, sa); };   // bare esker sand
    if (t === 2 || t === 11 || t === 12) { lawn(); const st = 0.5 + 0.5 * Math.sin((x * 0.64 + z * 0.77) * 0.6); r = 0.27 + st * 0.05; g = 0.5 + st * 0.06; b = 0.18; }   // (the pitch: mowing stripes)
    else if (t === 3) { r = 0.62 + q * 0.04; g = 0.3 + q * 0.02; b = 0.23; }
    else if (t === 4) { r = 0.72 + q * 0.05; g = 0.64 + q * 0.04; b = 0.48 + q * 0.03; }
    else if (t === 5) { r = g = 0.4 + q * 0.03; b = 0.41 + q * 0.03; }
    else if (t === 6) { r = 0.62 + q * 0.04; g = 0.6 + q * 0.04; b = 0.56 + q * 0.03; }
    else if (t === 7) { r = 0.52 + m * 0.06; g = 0.44 + m * 0.05; b = 0.33; }
    else if (t === 9 || (t === 10 && cv >= 1)) { floor(); if (cv === 1) { r = lerp(r, 0.33, 0.35); g = lerp(g, 0.41, 0.35); b = lerp(b, 0.17, 0.35); } }
    else if (t === 13) { r = 0.26 + m * 0.05; g = 0.3 + m * 0.05; b = 0.16; }
    else if (t === 1) { r = 0.29 + m * 0.07; g = 0.37 + m * 0.06; b = 0.15; }
    else if (t === 0) { lawn(); if (cv >= 1) { const r0 = r, g0 = g, b0 = b, f = cv >= 2 ? 0.75 : 0.5; floor(); r = lerp(r0, r, f); g = lerp(g0, g, f); b = lerp(b0, b, f); } }   // (a lawn under the pines: thin grass, needles, moss)
    else if (t === 10) { lawn(); const f = 0.35 + 0.3 * P.n1(x * 0.8, z * 0.8); r = lerp(r, 0.4, f); g = lerp(g, 0.43, f); b = lerp(b, 0.2, f); }   // (the park's open slopes: a dry esker meadow)
    else if (t === 8) { r = 0.46 + q * 0.05; g = 0.45 + q * 0.04; b = 0.39; const gr = sstep(0.55, 0.75, m) * 0.6; r = lerp(r, 0.34, gr); g = lerp(g, 0.44, gr); b = lerp(b, 0.2, gr); }
    else if (G.gd[k]) { lawn(); const bu = sstep(0.6, 0.75, P.n1(x * 2.3 - 60, z * 2.3)) * 0.7; r = lerp(r, 0.17, bu); g = lerp(g, 0.29, bu); b = lerp(b, 0.1, bu); }   // (the gardens round the wooden houses: lawns, currant and lilac bushes)
    else if (sw === 1) { lawn(); const f = 0.3 * sstep(0.55, 0.8, P.n1(x * 1.6 + 20, z * 1.6)); r = lerp(r, 0.45, f); g = lerp(g, 0.44, f); b = lerp(b, 0.31, f); }   // (the streets' verges: mown grass, worn in places)
    else { r = 0.47 + q * 0.05; g = 0.45 + q * 0.05; b = 0.4 + q * 0.04;   // the town's yards: gravel, asphalt patches and worn grass
      const gr = sstep(0.5, 0.72, P.n1(x, z)) * 0.75; r = lerp(r, 0.36, gr); g = lerp(g, 0.46, gr); b = lerp(b, 0.2, gr);
      if (cv >= 2) { r *= 0.86; g *= 0.9; b *= 0.84; } }
    if (G.bm[k]) { r = lerp(r, 0.38, 0.7); g = lerp(g, 0.37, 0.7); b = lerp(b, 0.35, 0.7); }   // (round the buildings: their paved edges)
    if (t !== 2 && t !== 3 && t !== 5 && t !== 6 && t !== 11) { const sh = 1 - 0.16 * Math.min(1, hjCanopyS(x, z) / 2.5); r *= sh; g *= sh; b *= sh * 0.98; }   // (the shade under the crowns)
    const st = sstep(0.8, 0.6, ny) * (t === 5 || t === 6 ? 0 : 0.75); r = lerp(r, 0.63 + m * 0.05, st); g = lerp(g, 0.55 + m * 0.04, st); b = lerp(b, 0.4, st);   // the esker's sand where it is steep
    if (dd < 4) { const f = sstep(4, 0.5, dd) * 0.35; r = lerp(r, 0.44, f); g = lerp(g, 0.42, f); b = lerp(b, 0.33, f); }   // trodden by the crowds right behind the barriers
    HJCOL[0] = r; HJCOL[1] = g; HJCOL[2] = b; return HJCOL;
  }
  function hjGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices)
    const G = HJ.G, gx = clamp((x - G.x0) / HJC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / HJC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b;
      const nx = (hjGH(ii + 1, jj) - hjGH(ii - 1, jj)) / (2 * HJC), nz = (hjGH(ii, jj + 1) - hjGH(ii, jj - 1)) / (2 * HJC), c = hjCol(G.x0 + ii * HJC, G.z0 + jj * HJC, 1 / Math.hypot(nx, 1, nz), jj * G.nx + ii);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function hjTileGeo(ti, tj) {   // one 160 m terrain tile: its 8 x 8 blocks, each at its own step (hjLOD), indexed; normals from the true heights
    const G = HJ.G, n = HJT + 1, map = new Int32Array(n * n).fill(-1), pos = [], nor = [], col = [], uv = [], idx = [], i0 = ti * HJT, j0 = tj * HJT, nbt = HJT / HJB;
    const vert = (a, b, s) => { const k = b * n + a; if (map[k] >= 0) return map[k];
      const i = i0 + a, j = j0 + b, x = G.x0 + i * HJC, z = G.z0 + j * HJC, h = G.hr[j * G.nx + i];
      let nx = -(hjGH(i + s, j) - hjGH(i - s, j)) / (2 * HJC * s), nz = -(hjGH(i, j + s) - hjGH(i, j - s)) / (2 * HJC * s), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      const c = hjCol(x, z, ny, j * G.nx + i); map[k] = pos.length / 3; pos.push(x, h, z); nor.push(nx, ny, nz); col.push(c[0], c[1], c[2]); uv.push(x / 7, -z / 7); return map[k]; };
    for (let bb = 0; bb < nbt; bb++) for (let ba = 0; ba < nbt; ba++) { const s = G.bs[(tj * nbt + bb) * G.nbx + ti * nbt + ba];
      for (let b = 0; b < HJB; b += s) for (let a = 0; a < HJB; a += s) { const A = ba * HJB + a, B = bb * HJB + b, p = vert(A, B, s), q = vert(A + s, B, s), c = vert(A, B + s, s), d = vert(A + s, B + s, s); idx.push(p, c, q, q, c, d); } }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    g.computeBoundingSphere(); return g;
  }
  // the far ring: 20 m cells round the terrain grid (a hole where the grid is), the woods and the town round Jyväskylä in the haze; in chunks of 12 x 12
  // cells (240 m), each its own mesh, so the chase camera's short far plane culls them (seen only in the wide views); normals from the whole grid (no seams)
  function hjFarGeo() {
    const P = HJ, F = P.F, G = P.G, W = F.nx, CH = 12, out = [], H = (i, j) => P.far[clamp(j, 0, F.nz - 1) * W + clamp(i, 0, W - 1)];
    for (let cj = 0; cj < F.nz - 1; cj += CH) for (let ci = 0; ci < W - 1; ci += CH) {
      const i1 = Math.min(ci + CH, W - 1), j1 = Math.min(cj + CH, F.nz - 1), nx = i1 - ci + 1, nz = j1 - cj + 1, idx = [];
      for (let j = cj; j < j1; j++) for (let i = ci; i < i1; i++) {
        const x = F.x0 + (i + 0.5) * F.cell, z = F.z0 + (j + 0.5) * F.cell; if (x > G.x0 && x < G.x1 && z > G.z0 && z < G.z1) continue;   // (the grid's own tiles there)
        const p = (j - cj) * nx + i - ci, q = p + 1, c = p + nx, d = c + 1; idx.push(p, c, q, q, c, d); }
      if (!idx.length) continue;
      const n = nx * nz, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      for (let j = cj, k = 0; j <= j1; j++) for (let i = ci; i <= i1; i++, k++) {
        const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell, h = P.far[j * W + i], m = P.n4(x, z), q = P.n1(x * 0.5, z * 0.5);
        pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; uv[k * 2] = x / 7; uv[k * 2 + 1] = -z / 7;
        const ex = (H(i - 1, j) - H(i + 1, j)) / (2 * F.cell), ez = (H(i, j - 1) - H(i, j + 1)) / (2 * F.cell), l = Math.hypot(ex, 1, ez);
        nor[k * 3] = ex / l; nor[k * 3 + 1] = 1 / l; nor[k * 3 + 2] = ez / l;
        const town = sstep(0.55, 0.7, m) * 0.8;   // spruce and pine woods, patches of town
        col[k * 3] = lerp(0.2 + q * 0.06, 0.46, town); col[k * 3 + 1] = lerp(0.27 + q * 0.05, 0.45, town); col[k * 3 + 2] = lerp(0.15 + q * 0.03, 0.42, town);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeBoundingSphere(); out.push(g);
    }
    return out;
  }
  let hjFTex = null, hjATex = null, hjAKey = '', hjBTex = null;   // (made once, reused by every Harju build: the teardown frees materials, not maps)
  // the facades: rows of one window bay (3.2 m) by one floor (128 x 128 px each, 16 rows), white where the vertex colour tints the wall: 0 a plastered
  // block (a two-pane window, white frame, a sill), 1 a glazed balcony, 2 a shop front (a display window under a fascia), 3 painted boards with a window in
  // white trim, 4 red brick with a white window, 5 a school's tall windows, 6 a blank wall, 7 plain, 8 plain red brick, 9 big windows between brick
  // piers, 10 roofing felt, 11 a standing-seam metal roof, 12 a staircase entrance
  function hjFacadeTex() {
    if (hjFTex) return hjFTex;
    const W = 128, c = document.createElement('canvas'); c.width = W; c.height = W * 16; const x = c.getContext('2d'), r = rng(8201);
    const row = (k) => k * W, fill = (col, a, b, cw, ch, k) => { x.fillStyle = col; x.fillRect(a, row(k) + b, cw, ch); };
    const glass = (a, b, cw, ch, k) => { const y0 = row(k) + b, gr = x.createLinearGradient(a, y0, a + cw * 0.6, y0 + ch); gr.addColorStop(0, '#6f8398'); gr.addColorStop(0.45, '#34424f'); gr.addColorStop(1, '#222b34'); x.fillStyle = gr; x.fillRect(a, y0, cw, ch); };
    const win = (a, b, cw, ch, k, frame, mull) => { fill(frame, a - 4, b - 4, cw + 8, ch + 8, k); glass(a, b, cw, ch, k); if (mull) fill(frame, a + cw / 2 - 2, b, 4, ch, k); fill(frame, a, b + ch * 0.28, cw, 3, k); };
    for (let k = 0; k < 8; k++) { fill('#f6f5f1', 0, 0, W, W, k); for (let q = 0; q < 300; q++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.05)'; x.fillRect(r() * W, row(k) + r() * W, 2 + r() * 5, 2 + r() * 5); } }   // (a faint render texture)
    win(34, 26, 60, 70, 0, '#fbfbf8', true); fill('#c9c6bd', 28, 100, 72, 6, 0); fill('rgba(0,0,0,0.12)', 30, 106, 68, 3, 0);
    fill('#2a3440', 30, 16, 68, 92, 1); glass(34, 20, 26, 84, 1); fill('#d8d6cf', 4, 104, 120, 12, 1); fill('rgba(170,200,215,0.55)', 4, 58, 120, 46, 1); fill('#e9e8e3', 4, 56, 120, 4, 1); fill('#e9e8e3', 4, 58, 3, 46, 1); fill('#e9e8e3', 121, 58, 3, 46, 1);   // (the balcony's glass front, its slab)
    fill('#d9d7d0', 0, 6, W, 20, 2); fill('#9a9890', 0, 24, W, 3, 2); win(10, 34, 108, 84, 2, '#4a4f55', false); fill('#4a4f55', 62, 34, 4, 84, 2);
    for (let yy = 0; yy < W; yy += 8) { fill('rgba(0,0,0,0.13)', 0, yy, W, 1.5, 3); fill('rgba(255,255,255,0.12)', 0, yy + 2, W, 1, 3); } win(40, 30, 48, 58, 3, '#fbfbf8', true); fill('#fbfbf8', 34, 88, 60, 7, 3); fill('#fbfbf8', 34, 20, 60, 6, 3);
    const brick = (k, y0, y1) => { x.fillStyle = '#d8d1c6'; x.fillRect(0, row(k) + y0, W, y1 - y0); for (let c = 0, yy = y0; yy < y1; yy += 3.5, c++) for (let xx = c % 2 ? -4 : 0; xx < W; xx += 8) {   // (courses of 3.5 px: ~36 to a storey, as real facing brick)
      const t = r(); x.fillStyle = 'rgb(' + [146 + t * 34, 62 + t * 20, 46 + t * 14].map(v => v | 0).join(',') + ')'; x.fillRect(xx + 0.6, row(k) + yy + 0.6, 6.8, 2.6); } };
    brick(4, 0, W); win(36, 26, 56, 70, 4, '#f4f2ec', true); fill('#e2ddd2', 30, 100, 68, 6, 4);
    win(16, 18, 38, 88, 5, '#fbfbf8', false); win(74, 18, 38, 88, 5, '#fbfbf8', false); fill('#dcd9d0', 0, 112, W, 5, 5);
    fill('rgba(0,0,0,0.07)', 0, 60, W, 2, 6);
    fill('#ffffff', 0, 0, W, W, 7);
    brick(8, 0, W);   // plain red brick
    brick(9, 0, W); glass(12, 14, 104, 96, 9); fill('#e8e6e0', 8, 10, 112, 4, 9); fill('#e8e6e0', 8, 110, 112, 5, 9); fill('#e8e6e0', 62, 14, 4, 96, 9);   // a big window between brick piers, white frames
    // 10: a flat roof's bitumen felt (u along the roof: the strips' seams, patches; the colour from the vertex), 11: a standing-seam sheet-metal roof
    // (u along the ridge, v from the eave up: a seam every 0.5 m, lighter towards the ridge), 12: a staircase entrance (a glazed door under a canopy, a lamp)
    fill('#ffffff', 0, 0, W, W, 10); for (let xx = 0; xx < W; xx += 32) { fill('rgba(0,0,0,0.16)', xx, 0, 2, W, 10); fill('rgba(255,255,255,0.08)', xx + 2, 0, 1, W, 10); }
    for (let q = 0; q < 26; q++) { x.fillStyle = r() < 0.6 ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.07)'; x.fillRect(r() * W, row(10) + r() * W, 6 + r() * 26, 4 + r() * 20); }
    for (let q = 0; q < 400; q++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'; x.fillRect(r() * W, row(10) + r() * W, 1 + r() * 2, 1 + r() * 2); }
    { const gr = x.createLinearGradient(0, row(11) + W, 0, row(11)); gr.addColorStop(0, '#e2e2e2'); gr.addColorStop(1, '#ffffff'); x.fillStyle = gr; x.fillRect(0, row(11), W, W); }
    for (let xx = 0; xx < W; xx += 20) { fill('rgba(0,0,0,0.28)', xx, 0, 2, W, 11); fill('rgba(255,255,255,0.35)', xx + 2, 0, 1.5, W, 11); }
    fill('#f6f5f1', 0, 0, W, W, 12); fill('#3a3f45', 38, 34, 52, 94, 12); glass(43, 40, 42, 50, 12); fill('#c9c6bd', 41, 92, 46, 3, 12); glass(43, 97, 42, 31, 12);   // (the door)
    fill('#d4d2cb', 26, 20, 76, 9, 12); fill('rgba(0,0,0,0.18)', 30, 29, 68, 5, 12); fill('#f2e7b0', 98, 40, 7, 10, 12); fill('#9a9890', 32, 120, 64, 8, 12);   // (the canopy, its shadow, the lamp, the step)
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return (hjFTex = t);
  }
  const hjFV = (k, f) => { const v1 = 1 - k / 16, v0 = v1 - 1 / 16, pad = 3 / 2048; return v0 + pad + (v1 - v0 - 2 * pad) * f; };   // (facade row k, height fraction f -> v)
  // the stage's boards (8 rows of 1024 x 128): START, LETEČI CILJ (flying finish), CP1-CP2 with the distance, the stage banner (SS1 HARJU); row 5: STOP (0-511), the
  // yellow and the red chequered-flag boards (512-767, 768-1023); row 6: YLEISÖALUE (0-511), KIELLETTY ALUE (512-1023); row 7: the town's banners (JYVÄSKYLÄ, a sponsor-free RALLI board)
  function hjAtlas(cps) {
    if (hjATex && hjAKey === cps.join('|')) return hjATex;
    if (hjATex) hjATex.dispose(); hjAKey = cps.join('|');
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w, wt) => { x.fillStyle = col; x.font = (wt || 900) + ' ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    const flag = (x0, y0, h) => { const w = h * 18 / 11; x.fillStyle = '#fff'; x.fillRect(x0, y0, w, h); x.fillStyle = '#12357f'; x.fillRect(x0 + w * 5 / 18, y0, w * 3 / 18, h); x.fillRect(x0, y0 + h * 4 / 11, w, h * 3 / 11); };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 104, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(232, 142, 560, 100); txt('LETEČI CILJ', 512, 196, 84, '#111', 530);
    cps.slice(0, 2).forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#12357f'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 280, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#f4f4f2'; x.fillRect(0, 512, 1024, 128); flag(24, 540, 72); flag(882, 540, 72); txt('SS1  HARJU', 512, 578, 84, '#12357f', 700);
    x.fillStyle = '#c8211b'; x.fillRect(0, 640, 512, 128); x.fillStyle = '#fff'; x.fillRect(0, 648, 512, 6); x.fillRect(0, 754, 512, 6); txt('STOP', 256, 708, 104, '#fff', 440);
    for (const [x0, bg] of [[512, '#f2c230'], [768, '#c8211b']]) { x.fillStyle = bg; x.fillRect(x0, 640, 256, 128); x.fillStyle = '#fff'; x.fillRect(x0 + 60, 656, 8, 100); chq(x0 + 68, 658, 128, 64, 16); }
    const board = (x0, y0, bg, rim, w) => { x.fillStyle = rim; x.fillRect(x0, y0, w, 128); x.fillStyle = bg; x.fillRect(x0 + 9, y0 + 9, w - 18, 110); };
    board(0, 768, '#1d7a3c', '#f4f4f2', 512); txt('YLEISÖALUE', 256, 822, 68, '#fff', 470); txt('SPECTATOR AREA', 256, 868, 26, '#fff', 400, 700);
    board(512, 768, '#c8211b', '#f4f4f2', 512); txt('KIELLETTY ALUE', 768, 822, 60, '#fff', 470); txt('NO SPECTATORS', 768, 868, 26, '#fff', 400, 700);
    x.fillStyle = '#12357f'; x.fillRect(0, 896, 512, 128); txt('JYVÄSKYLÄ', 256, 962, 78, '#fff', 470);
    x.fillStyle = '#f2c230'; x.fillRect(512, 896, 512, 128); x.fillStyle = '#16181c'; x.fillRect(512, 896, 512, 10); x.fillRect(512, 1014, 512, 10); txt('RALLI  SM', 768, 962, 76, '#16181c', 470);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (hjATex = t);
  }
  // the crowd barriers (a 2.5 m panel of the steel 'bike rack' kind: a tube frame with vertical bars, clear between them) and, on the right half, the
  // orange plastic mesh fence of the park (alphaTest cuts out the holes)
  // the barriers' texture (256 x 128): the upper half (v 0.5-1) the steel barrier (u 0-0.5) and the orange mesh fence (u 0.5-1), the lower half (v 0-0.5)
  // straw for the bales (fibres along the bale, two darker twine bands; white where the vertex colour tints it)
  function hjBarTex() {
    if (hjBTex) return hjBTex;
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'), r = rng(8205);
    x.clearRect(0, 0, 256, 128);
    x.fillStyle = '#e4e4e2'; x.fillRect(0, 64, 256, 64);
    for (let q = 0; q < 900; q++) { const yy = 64 + r() * 64, xx = r() * 256, l = 6 + r() * 26; x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,' + (0.25 + r() * 0.35).toFixed(2) + ')' : 'rgba(90,80,60,' + (0.12 + r() * 0.2).toFixed(2) + ')'; x.fillRect(xx, yy, l, 0.8 + r() * 0.8); }
    x.fillStyle = 'rgba(70,60,45,0.45)'; for (const u of [0.28, 0.72]) x.fillRect(u * 256 - 2, 64, 3, 64);
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 64, 256, 2); x.fillRect(0, 126, 256, 2); x.fillStyle = '#b9bcc0'; x.fillRect(0, 4, 128, 5); x.fillRect(0, 44, 128, 4); x.fillRect(0, 4, 5, 58); x.fillRect(123, 4, 5, 58);
    for (let k = 1; k < 11; k++) x.fillRect(k * 11.6, 8, 2.4, 37); x.fillStyle = '#8a8d91'; x.fillRect(2, 56, 16, 6); x.fillRect(110, 56, 16, 6);
    x.fillStyle = '#f07a18'; for (let yy = 6; yy < 60; yy += 6) x.fillRect(128, yy, 128, 2.4); for (let xx = 128; xx < 256; xx += 9) x.fillRect(xx, 6, 2.4, 54); x.fillRect(128, 4, 128, 3); x.fillRect(128, 58, 128, 3);
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return (hjBTex = t);
  }
  // a crown lump: an n-sided bipyramid (2n faces), jittered, smooth shaded as an ellipsoid (the Harju trees: cheap enough for a whole pine forest)
  function hjLump(g, cx, cy, cz, r, sy, col, R, n, lo) {
    const top = [cx, cy + r * sy, cz], bot = [cx, cy - r * sy * (lo || 0.55), cz], ring = [], inn = [cx, cy, cz], a0 = R() * TAU;
    for (let k = 0; k < n; k++) { const a = a0 + (k + (R() - 0.5) * 0.4) / n * TAU, rr = r * (0.82 + R() * 0.36); ring.push([cx + Math.cos(a) * rr, cy + (R() - 0.5) * r * sy * 0.3, cz + Math.sin(a) * rr]); }
    const nn = (p) => { const x = (p[0] - cx) / r, y = (p[1] - cy) / (r * sy * sy), z = (p[2] - cz) / r, l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
    const lt = [col[0] * 1.14, col[1] * 1.12, col[2] * 1.08], dk = [col[0] * 0.74, col[1] * 0.76, col[2] * 0.78];
    for (let k = 0; k < n; k++) { const p = ring[k], q = ring[(k + 1) % n]; g.triON(p, q, top, nn(p), nn(q), [0, 1, 0], inn, col, col, lt); g.triON(q, p, bot, nn(q), nn(p), [0, -1, 0], inn, col, col, dk); }
  }
  function hjTrunk(g, h0, h1, r0, r1, c0, c1) {   // a three-sided trunk from h0 to h1, its colour from c0 at the foot to c1 at the top
    const inn = [0, (h0 + h1) / 2, 0], P = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.3, b = (k + 1) / 3 * TAU + 0.3; g.quadO(P(a, r0, h0), P(b, r0, h0), P(b, r1, h1), P(a, r1, h1), c0, inn, null, [c0, c0, c1, c1]); }
  }
  // unit trees (height 1, instances scale them): 0 Norway spruce, 1 Scots pine (the ridge's old pines: a long bare trunk, grey below and orange up high, a deep
  // uneven crown of needle cushions in its top 40 %), 2 silver birch, 4 a linden or maple of the streets and yards; far: the plainer ones far from the road (one lump)
  function hjTreeGeo(kind, far) {
    const g = new GB(), R = rng(8230 + kind * 7 + (far ? 1 : 0));
    if (kind === 0) { const col = [0.085, 0.175, 0.11], tip = [0.17, 0.3, 0.19], rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = false;
      if (far) { starCone(g, 0, 0.02, 0, 0.3, 0.5, 4, col, tip, 0.2, 0.05); cone(g, 0, 0.45, 0, 0.16, 0.55, 3, col, tip, 0.9); }
      else { [[0.02, 0.31, 0.36, 0.06], [0.3, 0.23, 0.33, 0.05], [0.55, 0.15, 0.28, 0.04]].forEach(([y, r, h, dr], k) => starCone(g, 0, y, 0, r, h, 4, col, tip, k * 0.7, dr)); cone(g, 0, 0.78, 0, 0.06, 0.22, 3, col, tip, 0.4); }
      API.ROCK_SMOOTH = rs; }
    else if (far) {   // (the plain ones, over 50 m from the road)
      if (kind === 1) { hjTrunk(g, -0.02, 0.8, 0.017, 0.009, [0.38, 0.32, 0.27], [0.7, 0.42, 0.22]); hjLump(g, 0.02, 0.84, 0, 0.19, 0.42, [0.14, 0.26, 0.12], R, 5); }
      else if (kind === 2) { hjTrunk(g, -0.02, 0.62, 0.018, 0.01, [0.3, 0.28, 0.26], [0.9, 0.9, 0.86]); hjLump(g, 0, 0.68, 0, 0.17, 1.4, [0.27, 0.42, 0.13], R, 5, 0.7); }
      else { hjTrunk(g, -0.02, 0.45, 0.03, 0.02, [0.28, 0.24, 0.2], [0.34, 0.29, 0.24]); hjLump(g, 0, 0.64, 0, 0.3, 0.95, [0.2, 0.36, 0.12], R, 6, 0.7); } }
    else { const rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;   // (soft, rounded crowns, as Ouninpohja's)
      if (kind === 1) {   // an old Scots pine: a long trunk, grey-brown below and orange up high, a deep uneven crown of three clumps of dark blue-green needles
        cyl(g, 0, -0.02, 0, 0.018, 0.42, 3, [0.37, 0.31, 0.26], null, 0.015); cyl(g, 0, 0.4, 0, 0.015, 0.46, 3, [0.7, 0.42, 0.22], null, 0.008);
        ico(g, 0.02, 0.84, 0, 0.17, 0.55, [0.13, 0.24, 0.13], R, 0.35); ico(g, -0.09, 0.73, 0.06, 0.13, 0.6, [0.11, 0.21, 0.12], R, 0.4); hjLump(g, 0.08, 0.69, -0.06, 0.11, 0.6, [0.12, 0.22, 0.12], R, 5, 0.6); }
      else if (kind === 2) {   // a silver birch: a slim white trunk, dark rough bark at the foot and a black band, a light, airy crown of two clumps (as Ouninpohja's)
        cyl(g, 0, -0.02, 0, 0.019, 0.16, 3, [0.3, 0.28, 0.26], null, 0.016); cyl(g, 0, 0.14, 0, 0.016, 0.24, 3, [0.9, 0.9, 0.86], null, 0.014);
        cyl(g, 0, 0.38, 0, 0.014, 0.04, 3, [0.16, 0.16, 0.16], null, 0.013); cyl(g, 0, 0.42, 0, 0.013, 0.24, 3, [0.88, 0.88, 0.84], null, 0.008);
        ico(g, 0, 0.7, 0, 0.15, 1.5, [0.27, 0.42, 0.13], R, 0.3); ico(g, 0.07, 0.56, -0.05, 0.1, 1.2, [0.31, 0.46, 0.15], R, 0.35); }
      else {   // a linden or a maple of the streets and yards: a round crown of three soft clumps in a deep summer green
        hjTrunk(g, -0.02, 0.45, 0.03, 0.02, [0.28, 0.24, 0.2], [0.34, 0.29, 0.24]);
        ico(g, -0.03, 0.62, -0.02, 0.22, 0.8, [0.17, 0.3, 0.11], R, 0.3); ico(g, 0.12, 0.72, 0.08, 0.16, 0.8, [0.2, 0.34, 0.13], R, 0.35); ico(g, -0.1, 0.76, 0.1, 0.14, 0.85, [0.19, 0.32, 0.12], R, 0.35); }
      API.ROCK_SMOOTH = rs; }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // a building from its footprint (poly: [x, z], either winding), kind (0 flats, 1 a house, 2 a shed or garage, 3 a stand or a roof, 4 a school or public
  // building, 5 shops and offices, 6 a church, 7 industrial), roof (0 flat, 1 gabled), h: its measured height over the lowest ground at its walls.
  // Walls in floors of the facade atlas (hjFacadeTex), a dark plinth, a flat roof or a gable over the footprint's rectangle. g: a GB with UVs
  function hjBuilding(g, poly, kind, roof, h, R, o) {
    const n = poly.length; let area2 = 0, cx = 0, cz = 0, g0 = 1e9, g1 = -1e9;
    for (let k = 0; k < n; k++) { const [ax, az] = poly[k], [bx, bz] = poly[(k + 1) % n]; area2 += ax * bz - bx * az; cx += ax / n; cz += az / n; const y = hjGround(ax, az); g0 = Math.min(g0, y); g1 = Math.max(g1, y); }
    const sgn = area2 > 0 ? 1 : -1, u = R(), u2 = R(), bare = !!(o && o.bare);
    const PAL0 = [[0.93, 0.87, 0.7], [0.9, 0.8, 0.62], [0.93, 0.92, 0.88], [0.8, 0.8, 0.78], [0.88, 0.71, 0.58], [0.77, 0.81, 0.73], [0.85, 0.75, 0.6], [0.72, 0.7, 0.66]];
    const PALW = [[0.9, 0.74, 0.38], [0.62, 0.2, 0.14], [0.93, 0.92, 0.88], [0.7, 0.76, 0.8], [0.58, 0.67, 0.5], [0.52, 0.37, 0.25], [0.92, 0.84, 0.6]];
    let row = 0, rowUp = 0, col, fh = 3.1, wood = false;
    if (kind === 1) { wood = u < 0.72; row = rowUp = wood ? 3 : 0; col = wood ? PALW[Math.floor(u2 * PALW.length)] : PAL0[Math.floor(u2 * PAL0.length)]; fh = 2.9; }
    else if (kind === 2) { row = rowUp = 6; col = [[0.6, 0.2, 0.14], [0.55, 0.4, 0.27], [0.62, 0.62, 0.6], [0.88, 0.8, 0.55]][Math.floor(u2 * 4)]; fh = 3.0; }
    else if (kind === 4 || kind === 6) { const brick = kind === 6 || u < 0.35; row = rowUp = brick ? 4 : 5; col = brick ? [0.97, 0.92, 0.9] : PAL0[Math.floor(u2 * 4)]; fh = 3.8; if (brick) { row = 4; rowUp = kind === 6 ? 5 : 4; } }
    else if (kind === 5) { row = 2; rowUp = u < 0.5 ? 0 : 5; col = PAL0[Math.floor(u2 * PAL0.length)]; fh = 3.4; }
    else if (kind === 7 || kind === 3) { row = rowUp = 6; col = [0.66, 0.66, 0.64]; fh = 4; }
    else { const brick = u < 0.2; row = brick ? 4 : 0; rowUp = brick ? 4 : u < 0.55 ? 1 : 0; col = brick ? [0.97, 0.93, 0.9] : PAL0[Math.floor(u2 * PAL0.length)]; }
    if (o && o.row != null) { row = o.row; rowUp = o.rowUp; col = o.col; fh = o.fh || fh; }
    col = vary(col, R, 0.08);
    const plinth = [0.42, 0.41, 0.4], yb = g0 - 1.2, y0 = g0 + 0.45;
    let top = Math.max(g0 + h, g1 + 2.6);
    // the footprint's long axis (its longest edge) and the extents along and across it: the gable's ridge, the roof's textures, the machine rooms
    let bl = 0, dx = 1, dz = 0; for (let k = 0; k < n; k++) { const [ax, az] = poly[k], [bx, bz] = poly[(k + 1) % n], l = Math.hypot(bx - ax, bz - az); if (l > bl) { bl = l; dx = (bx - ax) / l; dz = (bz - az) / l; } }
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of poly) { const a = (x - cx) * dx + (z - cz) * dz, b = -(x - cx) * dz + (z - cz) * dx; u0 = Math.min(u0, a); u1 = Math.max(u1, a); v0 = Math.min(v0, b); v1 = Math.max(v1, b); }
    const L = u1 - u0, D = v1 - v0, rect = Math.abs(area2) / 2 > 0.8 * L * D, ax0 = (x, z) => (x - cx) * dx + (z - cz) * dz, ac0 = (x, z) => -(x - cx) * dz + (z - cz) * dx;
    // a gable over the footprint's rectangle when the footprint is near one; many of the 1950s blocks of flats round the ridge have a low saddle roof of sheet metal too
    const saddle = !bare && roof === 0 && kind === 0 && h < 17 && rect && D > 6 && crH(cx, cz, 61) < 0.4;
    let gab = null;
    if ((roof === 1 || saddle) && n >= 4 && rect && D > 3) { const rh = saddle ? Math.min(D * 0.17, 3.2) : Math.min(D * 0.32, 5.5), mx = cx + dx * (u0 + u1) / 2 - dz * (v0 + v1) / 2, mz = cz + dz * (u0 + u1) / 2 + dx * (v0 + v1) / 2;
      top = Math.max(top, g1 + 2.6 + rh); gab = { L, D, rh, x: mx, z: mz, rot: Math.atan2(dz, dx), eave: top - rh }; }
    const yTop = gab ? gab.eave : top, nf = Math.max(1, Math.round((yTop - y0) / fh)), fhh = (yTop - y0) / nf;
    const para = !gab && !bare && (kind === 0 || kind === 4 || kind === 5 || kind === 7) && yTop - y0 > 5 ? 0.5 : 0;   // (a parapet round a flat roof, a light metal coping on it)
    const door = kind === 0 && !(o && o.row != null), foot = [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], COP = [0.78, 0.78, 0.77];
    for (let k = 0; k < n; k++) {
      const [ax, az] = poly[k], [bx, bz] = poly[(k + 1) % n], Le = Math.hypot(bx - ax, bz - az); if (Le < 0.05) continue;
      const ox = sgn * (bz - az) / Le, oz = -sgn * (bx - ax) / Le, inn = [(ax + bx) / 2 - ox, (y0 + yTop) / 2, (az + bz) / 2 - oz], bays = Math.max(1, Math.round(Le / 3.2)), U1 = bays;
      const q = (ya, yb2, rk, c, fa, fb) => g.quadO([ax, ya, az], [bx, ya, bz], [bx, yb2, bz], [ax, yb2, az], c, inn, [[0, hjFV(rk, fa)], [U1, hjFV(rk, fa)], [U1, hjFV(rk, fb)], [0, hjFV(rk, fb)]]);
      q(yb, y0, 6, plinth, 0, 1);
      // the ground floor in runs of bays (a staircase's entrance every fifth bay of a block of flats), darker at its foot
      const P = (t, y) => [lerp(ax, bx, t), y, lerp(az, bz, t)], y1 = y0 + fhh;
      for (let b0 = 0; b0 < bays;) { const isD = door && bays >= 3 && b0 % 5 === 2; let b1 = b0 + 1; if (!isD) while (b1 < bays && !(door && bays >= 3 && b1 % 5 === 2)) b1++;
        const rk = isD ? 12 : row, t0 = b0 / bays, t1 = b1 / bays;
        g.quadO(P(t0, y0), P(t1, y0), P(t1, y1), P(t0, y1), col, inn, [[b0, hjFV(rk, 0)], [b1, hjFV(rk, 0)], [b1, hjFV(rk, 1)], [b0, hjFV(rk, 1)]], [foot, foot, col, col]); b0 = b1; }
      for (let f = 1; f < nf; f++) q(y0 + f * fhh, y0 + (f + 1) * fhh, rowUp, col, 0, 1);
      if (para) { const ix = -ox * 0.25, iz = -oz * 0.25, cp = [col[0] * 0.96, col[1] * 0.96, col[2] * 0.96], U7 = [0.5, hjFV(7, 0.5)];
        q(yTop, yTop + para, 7, cp, 0.2, 0.8);   // (outside)
        g.quadO([ax + ix, yTop, az + iz], [bx + ix, yTop, bz + iz], [bx + ix, yTop + para, bz + iz], [ax + ix, yTop + para, az + iz], cp, [(ax + bx) / 2 + ox, yTop, (az + bz) / 2 + oz], [U7, U7, U7, U7]);   // (inside)
        g.quadO([ax, yTop + para, az], [bx, yTop + para, bz], [bx + ix, yTop + para, bz + iz], [ax + ix, yTop + para, az + iz], COP, [(ax + bx) / 2, yTop, (az + bz) / 2], [U7, U7, U7, U7]); }   // (the coping)
      if (wood) box(g, ax, y0, az, 0.17, yTop - y0, 0.17, Math.atan2(bz - az, bx - ax), [0.95, 0.94, 0.9], null, true);   // (a wooden house's white corner board)
    }
    const metal = [[0.3, 0.3, 0.32], [0.5, 0.18, 0.12], [0.18, 0.18, 0.2], [0.36, 0.25, 0.18]], rc = R();
    const RC = kind === 1 || kind === 2 ? metal[Math.floor(rc * 4)] : saddle ? metal[Math.floor(crH(cx, cz, 62) * 4)] : [[0.24, 0.24, 0.25], [0.3, 0.29, 0.28], [0.52, 0.5, 0.47]][Math.floor(rc * 3)];
    const UV7 = [0.5, hjFV(7, 0.5)];
    if (gab) {   // two roof slopes of standing-seam metal with a 0.4 m overhang (the seams from the eave to the ridge), the gable ends in the wall's colour
      const c = Math.cos(gab.rot), s = Math.sin(gab.rot), at = (a, b, y) => [gab.x + c * a - s * b, y, gab.z + s * a + c * b], hl = gab.L / 2 + 0.4, hd = gab.D / 2 + 0.45, e = gab.eave - 0.12, rt = gab.eave + gab.rh, inn = [gab.x, gab.eave, gab.z];
      const rc2 = [RC[0] * 0.9, RC[1] * 0.9, RC[2] * 0.9], UR = 2 * hl / 3.2, ruv = [[0, hjFV(11, 0)], [UR, hjFV(11, 0)], [UR, hjFV(11, 1)], [0, hjFV(11, 1)]];
      g.quadO(at(-hl, -hd, e), at(hl, -hd, e), at(hl, 0, rt), at(-hl, 0, rt), RC, inn, ruv);
      g.quadO(at(-hl, hd, e), at(hl, hd, e), at(hl, 0, rt), at(-hl, 0, rt), rc2, inn, ruv);
      for (const a of [-gab.L / 2, gab.L / 2]) g.triO(at(a, -gab.D / 2, gab.eave), at(a, gab.D / 2, gab.eave), at(a, 0, rt - 0.1), col, inn, col, col, [0, hjFV(6, 0)], [2, hjFV(6, 0)], [1, hjFV(6, 1)]);
      if (kind === 1 && R() < 0.8) { const a = gab.L * (R() - 0.5) * 0.5; box(g, gab.x + c * a - s * gab.D * 0.15, rt - gab.rh * 0.3, gab.z + s * a + c * gab.D * 0.15, 0.55, gab.rh * 0.3 + 0.8, 0.55, gab.rot, [0.55, 0.28, 0.2], null, true); }   // a chimney
      if (saddle) R(), R();   // (as the flat roof's draws: the other buildings keep their colours)
      if (saddle) for (let m = 0, nm = Math.max(1, Math.round(gab.L / 16)); m < nm; m++) { const a = -gab.L / 2 + (m + 0.5) * gab.L / nm; box(g, gab.x + c * a + s * 1.2, rt - 0.7, gab.z + s * a - c * 1.2, 0.5, 1.5, 0.5, gab.rot, [0.5, 0.48, 0.46], null, true); }   // (a vent stack per staircase)
    } else {   // a flat roof: the footprint triangulated (earcut), roofing felt in strips (or pale gravel), a machine room for each staircase, vent pipes
      const pts = poly.map(([x, z]) => new THREE.Vector2(x, z)), tris = THREE.ShapeUtils.triangulateShape(pts, []), below = [cx, top - 5, cz];
      const ruv = (p) => [(ax0(p[0], p[1]) - u0) / 3.2, hjFV(10, D > 0.1 ? (ac0(p[0], p[1]) - v0) / D : 0.5)];
      for (const [a, b, c] of tris) g.triO([poly[a][0], top, poly[a][1]], [poly[b][0], top, poly[b][1]], [poly[c][0], top, poly[c][1]], RC, below, RC, RC, ruv(poly[a]), ruv(poly[b]), ruv(poly[c]));
      if (kind === 0 || kind === 5 || kind === 4) {
        R(); const mc = vary(col, R, 0.1), nm = bare ? 0 : Math.max(1, Math.round(L / 18)), rot = Math.atan2(dz, dx), vm = (v0 + v1) / 2;   // (two draws, as before: the other buildings keep their colours)
        for (let m = 0; m < nm; m++) { const a = u0 + (m + 0.5) * L / nm, mx = cx + dx * a - dz * vm, mz = cz + dz * a + dx * vm; if (!inPoly(poly, mx, mz)) continue;
          box(g, mx, top, mz, 2.6, 1.7, 2.2, rot, mc, RC, true);
          for (const [pa, pb] of [[2.2, 1.6], [-2.4, -1.8]]) { const px = mx + dx * pa - dz * pb, pz = mz + dz * pa + dx * pb; if (inPoly(poly, px, pz)) cyl(g, px, top, pz, 0.16, 0.9, 4, [0.4, 0.4, 0.41]); } }   // (vent pipes)
      }
    }
    return { g0, g1, top, cx, cz };
  }
  function buildHarju(scene, tex, opts) {
    const R = rng(8111), N = T.N, def = T.def, S = def.scen, dens = opts.density || 1, PI = Math.PI, ds = T.ds;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: hjGround, camFloor: hjGround, props: [], ownTex: [], farClip: true };
    hjPrep(); hjLOD();
    const P = HJ, G = P.G, sStart = T.startS, sFin = T.finishS, iE = N - 1, w = T.w;
    const WA = T.wa || new Float64Array(N).fill(w), SF = T.sf || new Uint8Array(N), VG = T.vg || [new Uint8Array(N).fill(4), new Uint8Array(N).fill(4)];
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) }, uA: { value: new THREE.Vector4(0, 0, -1e6, 1) }, uB: { value: new THREE.Vector4(0, 0, -1e6, 1) } };   // (ouCutMat: the trees and the small things between the camera and the car fade; hjCutMat: the buildings over the car and the road ahead)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const addM = (g, mat, cast, grp) => { if (!g || g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; (grp || root).add(m); return m; };
    const excl = [], eh = new Map(), EHC = 32;   // tree exclusion circles (the crowds, the rally's things), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const gIdx = (x, z) => { const i = Math.round((x - G.x0) / HJC), j = Math.round((z - G.z0) / HJC); return i < 0 || j < 0 || i >= G.nx || j >= G.nz ? -1 : j * G.nx + i; };
    const onBld = (x, z) => { const k = gIdx(x, z); return k >= 0 && G.bm[k] === 1; }, onPaved = (x, z) => { const k = gIdx(x, z); return k >= 0 && G.pv[k] > 0; };
    const sAt = (d) => clamp(sStart + d, 0, T.len - 0.01);   // (metres after the start line -> s)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const nearDD = (x, z) => { const n = hjNear(x, z); return n.i < 0 ? 999 : n.dd; };

    /* ---- terrain: the tiles, the far ring, the lakes ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: ouGTex(), vertexColors: true });
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const m = new THREE.Mesh(hjTileGeo(ti, tj), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); }
      for (const fg of hjFarGeo()) { const fm = new THREE.Mesh(fg, gMat); fm.receiveShadow = true; fm.matrixAutoUpdate = false; grp.add(fm); }
      if (P.lakes.length) {   // the lakes: flat water at their levels over the shelving beds (a still evening: the pale sky mirrored, darker near the shore)
        const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 90, specular: 0x7fa6c8 }), g = new GB(true);
        for (const L of P.lakes) { const tris = THREE.ShapeUtils.triangulateShape(L.poly.map(([x, z]) => new THREE.Vector2(x, z)), []), y = L.h, c = [0.3, 0.42, 0.55], uv = (p) => [p[0] / 14, -p[1] / 14];
          for (const [a, b, cc] of tris) { const A = L.poly[a], B = L.poly[b], C = L.poly[cc]; g.triO([A[0], y, A[1]], [B[0], y, B[1]], [C[0], y, C[1]], c, [A[0], y - 5, A[1]], c, c, uv(A), uv(B), uv(C)); } }
        const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); out.dyn.water = tex.water;
      }
    }

    /* ---- the town's streets and paths (def.scen.roads): where they meet the stage (its verge there is the side street's tarmac, no kerb: 'mouth') ---- */
    const RD = hjI16(S.roads), roads = [];
    for (let k = 0; k < RD.length;) { const n = RD[k], code = RD[k + 1], pts = []; for (let q = 0; q < n; q++) pts.push([RD[k + 2 + q * 2] / 4, RD[k + 3 + q * 2] / 4]); k += 2 + n * 2; roads.push({ cls: code >> 3, surf: code & 7, pts }); }
    const RHW = HJ_RHW, RLIFT = [0.07, 0.065, 0.06, 0.055, 0.045, 0.04, 0.04, 0.042, 0.04, 0.05];   // (half widths per class; lifts: the bigger street covers the smaller at a junction)
    const mouth = [new Uint8Array(N), new Uint8Array(N)];
    const dense = (pts, st) => { const o = []; for (let q = 0; q < pts.length - 1; q++) { const [ax, az] = pts[q], [bx, bz] = pts[q + 1], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / st)); for (let t = 0; t < m; t++) o.push([lerp(ax, bx, t / m), lerp(az, bz, t / m)]); } o.push(pts[pts.length - 1]); return o; };
    for (const r of roads) {
      r.d = dense(r.pts, 2.0); const hw = RHW[r.cls];
      for (let q = 0; q < r.d.length - 1; q++) hjMarkSeg(r.d[q][0], r.d[q][1], r.d[q + 1][0], r.d[q + 1][1], hw + (r.cls <= 3 ? 0.9 : 0.4), 1);
      if (r.cls > 3 && r.cls !== 9) continue;
      for (let q = 0; q < r.d.length - 1; q++) { const [x, z] = r.d[q], n = hjNear(x, z); if (n.i < 0) continue; const i = n.i, al = Math.abs(n.lat);
        if (al > WA[i] + 12 || al < WA[i] - 0.5) continue;
        const dx = r.d[q + 1][0] - x, dz = r.d[q + 1][1] - z, l = Math.hypot(dx, dz) || 1; if (Math.abs((dx * T.tx[i] + dz * T.tz[i]) / l) > 0.72) continue;   // (running along the stage: its own street)
        const si = n.lat > 0 ? 1 : 0, m = Math.ceil((hw + 2.5) / ds); for (let j = Math.max(0, i - m); j <= Math.min(N - 1, i + m); j++) mouth[si][j] = 1; }
    }
    // the bale chicanes (def.chicanes [d, A, L]: the line swings A m to one side and back over L m, round straw bales on the street) and the lane change
    const chic = (def.chicanes || []).map(([d, A, L]) => ({ s0: sStart + d - L / 2, s1: sStart + d + L / 2, A, L, d }));
    const inChic = (s) => chic.some(c => s > c.s0 - 8 && s < c.s1 + 8);

    /* ---- the stage road: tarmac (a little rubber on the driving line), the esker's gravel (two wheel tracks swept clean, the loose gravel on the
       crown and the edges thrown wide on the outside of the bends), the school yard's paving stones; then the verges: granite kerbs and sidewalks,
       lawns, the side streets' tarmac (200 m chunks, culled) ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const kMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.05, shininess: 4, specular: 0x16130f, vertexColors: true });
    const pMat = new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true });
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const vType = (i, side) => { const si = side > 0 ? 1 : 0; if (inChic(i * ds)) return SF[i] === 5 ? 5 : SF[i] === 4 ? 4 : 0; if (mouth[si][i]) return 0; return VG[si][i]; };
    // the verge's cross-section per sample and side: six points [offset, height above the road] from the road's edge out to 1.9 m past the barrier
    // (lifted over the ground where it rises), and the kind of each of the five strips (0 tarmac, 1 kerb, 2 grass, 4 sidewalk, 5 gravel)
    const VK = { 4: [1, 1, 4, 4, 4], 0: [0, 0, 0, 0, 0], 2: [2, 2, 2, 2, 2], 3: [5, 5, 5, 2, 2], 5: [5, 5, 5, 2, 2] };
    const vEnd = (i, side, e) => {   // how far the verge goes: short of the centre of a tight bend on its inside, and of another part of the stage beside it (the
      // other carriageway: to the middle between the two), at most e
      let km = 0; for (let j = Math.max(0, i - 4); j <= Math.min(N - 1, i + 4); j++) if (Math.sign(T.k[j]) === side) km = Math.max(km, Math.abs(T.k[j]));
      if (km > 0) e = Math.min(e, Math.max(WA[i] + 0.3, 1 / km - 0.4));
      for (let o = WA[i] + 0.3; o <= e + 0.01; o += 0.5) { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o, n = hjNear(x, z);
        if (n.i >= 0 && Math.abs(n.i - i) * ds > 24 && Math.abs(n.lat) < o) return Math.max(WA[i] + 0.25, (o + Math.abs(n.lat)) / 2 - 0.1); }
      return e; };
    const vProf = (i, side) => {
      const t = vType(i, side), wi = WA[i], bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], e = vEnd(i, side, Math.max(bar + 1.9, wi + 1.4));
      const gAt = (o) => { const q = side * o; return hjGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.04)];
      const o3 = lerp(wi + 0.2, e - 0.4, 0.5);
      if (t === 4) return [[wi, 0], lift(wi + 0.03, 0.13), lift(wi + 0.2, 0.13), lift(o3, 0.13), lift(e - 0.4, 0.13), [e, gAt(e) + 0.03]];
      if (t === 0) return [[wi, 0], lift(wi + 0.03, 0), lift(wi + 0.2, 0), lift(o3, 0), lift(e - 0.4, 0), [e, gAt(e) + 0.03]];
      if (t === 3 || t === 5) return [[wi, 0], lift(wi + 0.3, -0.01), lift(wi + 0.7, -0.03), lift(o3, -0.06), lift(e - 0.4, -0.06), [e, gAt(e) + 0.03]];
      return [[wi, 0], lift(wi + 0.2, -0.01), lift(wi + 0.5, -0.02), lift(o3, -0.04), lift(e - 0.4, -0.05), [e, gAt(e) + 0.03]];
    };
    const VP = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; }), VT = [-1, 1].map(side => { const a = new Uint8Array(N); for (let i = 0; i < N; i++) a[i] = vType(i, side); return a; });
    {
      const tileL = 7, grav = [1.2, 1.25, 1.3], pave = [0.84, 0.8, 0.77];   // (grav: the esker's pale, grey-beige sand and gravel over the shared makadam picture)
      const cols = (i) => { const wi = WA[i], rl = clamp(T.rl[i], -wi + 2.3, wi - 2.3); return [-wi, -wi + 0.5, rl - 1.7, rl - 1.2, rl - 0.7, rl - 0.25, rl + 0.25, rl + 0.7, rl + 1.2, rl + 1.7, wi - 0.5, wi]; };
      const shade = (i, o) => { const a = Math.abs(o - T.rl[i]), trk = sstep(0.45, 0.72, a) * sstep(1.45, 1.18, a), ao = Math.abs(o), wi = WA[i], s = SF[i];
        if (s === 5) { let k = 1.0 - 0.2 * trk + 0.06 * sstep(0.5, 0.2, a);
          const outer = Math.sign(o) === -Math.sign(T.k[i]) ? sstep(1 / 400, 1 / 60, Math.abs(T.k[i])) : 0; k += (0.06 + 0.08 * outer) * sstep(wi - 1.3 - 1.4 * outer, wi - 0.3, ao) * (1 - trk);
          k *= 0.93 + 0.12 * P.n2(T.px[i] * 0.7 + 50, T.pz[i] * 0.7); return [grav[0] * k, grav[1] * k, grav[2] * k]; }
        if (s === 4) { const k = 0.95 + 0.08 * P.n3(T.px[i] + o, T.pz[i]); return [pave[0] * k, pave[1] * k, pave[2] * k]; }
        const k = (1.0 - 0.08 * trk - 0.05 * sstep(wi - 0.8, wi, ao)) * (0.95 + 0.08 * P.n2(T.px[i] * 0.5, T.pz[i] * 0.5)); return [k, k, k * 1.01]; };
      const KC = [0.64, 0.64, 0.62], KT = [0.72, 0.72, 0.7], WH = [1, 1, 1];
      const vCol = (i, side, k, kind) => { if (k === 5) { const q = side * VP[side > 0 ? 1 : 0][i][5][0]; return hjGCol(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q); }
        if (kind === 1) return k === 1 ? KT : KC;
        if (kind === 2) {   // the grass verge: the ground's own colour (the park's needles and sand, a town lawn), worn bare along the road's edge and behind the barrier
          const si = side > 0 ? 1 : 0, o = VP[si][i][k][0], q = side * o, c = hjGCol(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q), bar = side > 0 ? T.br[i] : T.bl[i];
          const wear = 0.42 * sstep(WA[i] + 1.2, WA[i] + 0.2, o) + 0.25 * sstep(1.4, 0.2, Math.abs(o - bar)), m = P.n3(T.px[i] * 2 + o, T.pz[i] * 2);
          return [lerp(c[0], 0.47 + m * 0.05, wear), lerp(c[1], 0.43 + m * 0.04, wear), lerp(c[2], 0.31, wear)]; }
        if (kind === 5) { if (k < 3) return [grav[0] * 0.98, grav[1] * 0.98, grav[2] * 0.98];   // (the gravel shoulder: loose sand spilling into the needles and the grass at its outer edge)
          const q = side * VP[side > 0 ? 1 : 0][i][k][0], c = hjGCol(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q), f = k === 3 ? 0.45 : 0.8; return [lerp(grav[0] * 0.95, c[0] * 1.6, f), lerp(grav[1] * 0.95, c[1] * 1.6, f), lerp(grav[2] * 0.95, c[2] * 1.6, f)]; }
        if (kind === 4) return [0.9, 0.88, 0.85]; return [0.96, 0.96, 0.97]; };
      const vuv = (p) => [p[0] / 2, -p[2] / 2], vuvA = (p) => [p[0] / tileL, -p[2] / tileL];
      for (let c0 = 0; c0 < N - 1; c0 += 100) {
        const gA = new GB(true), gK = new GB(true), gP = new GB(true), gK2 = new GB(), gV = new GB(true);   // (tarmac, gravel, paving, kerbs, grass)
        for (let i = c0; i < Math.min(c0 + 100, N - 1); i++) {
          const j = i + 1, v0 = i * ds / tileL, v1 = j * ds / tileL, oi = cols(i), oj = cols(j), s = SF[i], gr = s === 5 ? gK : s === 4 ? gP : gA, us = s === 4 ? 2 : tileL;
          for (let c = 0; c < oi.length - 1; c++) { const a0 = oi[c], a1 = oi[c + 1], b0 = oj[c], b1 = oj[c + 1];
            gr.quadUp(Pt(i, a0, 0.02), Pt(i, a1, 0.02), Pt(j, b1, 0.02), Pt(j, b0, 0.02), [shade(i, a0), shade(i, a1), shade(j, b1), shade(j, b0)], [[(a0 + WA[i]) / us, v0 * tileL / us], [(a1 + WA[i]) / us, v0 * tileL / us], [(b1 + WA[j]) / us, v1 * tileL / us], [(b0 + WA[j]) / us, v1 * tileL / us]]); }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, qi = VP[si][i], qj = VP[si][j], kinds = VK[VT[si][i]] || VK[2];
            for (let k = 0; k < 5; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]), kind = kinds[k];
              const ca = vCol(i, side, k, kind), cb = vCol(i, side, k + 1, kind), cc = vCol(j, side, k + 1, kind), cd = vCol(j, side, k, kind);
              if (kind === 1) gK2.quadUp(a, b, c, d, [ca, cb, cc, cd]);
              else if (kind === 0) gA.quadUp(a, b, c, d, [ca, cb, cc, cd], [vuvA(a), vuvA(b), vuvA(c), vuvA(d)]);
              else if (kind === 4) gP.quadUp(a, b, c, d, [ca, cb, cc, cd], [vuv(a), vuv(b), vuv(c), vuv(d)]);
              else if (kind === 5) gK.quadUp(a, b, c, d, [ca, cb, cc, cd], [vuvA(a), vuvA(b), vuvA(c), vuvA(d)]);
              else gV.quadUp(a, b, c, d, [ca, cb, cc, cd], [[a[0] / 7, -a[2] / 7], [b[0] / 7, -b[2] / 7], [c[0] / 7, -c[2] / 7], [d[0] / 7, -d[2] / 7]]); }
          }
        }
        addM(gA, aMat); addM(gK, kMat); addM(gP, pMat); addM(gK2, matV); addM(gV, gMat);
      }
      for (let i = 0; i < N - 1; i++) { const a = [T.px[i], T.pz[i]], b = [T.px[i + 1], T.pz[i + 1]]; hjMarkSeg(a[0], a[1], b[0], b[1], Math.max(WA[i], (T.bl[i] + T.br[i]) / 2) + 0.6, 2); }   // (no trees in the corridor)
      // markings: the white dashed lane line down a carriageway of two lanes (def.marks); the start, split and finish lines in lime; zebra crossings where
      // the town's crossings meet the stage
      const gm = new GB(), WHT = [0.95, 0.95, 0.93];
      const strip = (s0, s1, o, hw, col) => { for (let s = s0; s < s1 - 0.01; s += 2) { const e = Math.min(s1, s + 2), a = atSf(s, o - hw), b = atSf(s, o + hw), c = atSf(e, o + hw), d = atSf(e, o - hw), y0 = T.hy[a[3]] + 0.045, y1 = T.hy[c[3]] + 0.045;
        gm.quadUp([a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]], [col, col, col, col]); } };
      for (const [d0, d1] of def.marks || []) for (let s = sAt(d0); s < sAt(d1) - 3; s += 12) { const i = T.idx(s); if (SF[i] !== 0 || inChic(s)) continue; strip(s, s + 3, 0, 0.06, WHT); }   // (def.marks [d0, d1])
      for (const [s0, hw] of [[sStart, 0.4], [sFin, 0.4]].concat(T.cpS.map(s => [s, 0.2]))) { const i = T.idx(s0), wi = WA[i]; strip(s0 - hw, s0 + hw, 0, wi - 0.1, WHT); }
      const PT = hjI16(S.pts); out.zebras = 0;
      for (let k = 0; k < PT.length; k += 3) { if (PT[k] !== 4) continue; const x = PT[k + 1] / 2, z = PT[k + 2] / 2, n = hjNear(x, z); if (n.i < 0 || Math.abs(n.lat) > WA[n.i] + 1 || SF[n.i] !== 0) continue;
        const s = n.i * ds; for (let o = -WA[n.i] + 0.6; o < WA[n.i] - 0.5; o += 1.0) { const a = atSf(s - 1.6, o), b = atSf(s - 1.6, o + 0.5), c = atSf(s + 1.6, o + 0.5), d = atSf(s + 1.6, o), y = T.hy[n.i] + 0.045; gm.quadUp([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], [d[0], y, d[1]], [WHT, WHT, WHT, WHT]); }
        out.zebras++; }
      // manhole covers (in a lane every 30-60 m, down the side streets every 35-55 m), gully grates in the gutters by the kerbs (every 22-34 m), and
      // give-way teeth across the lane where a street comes up to the stage
      const IRIM = [0.16, 0.16, 0.17], IRON = [0.26, 0.26, 0.27], GFR = [0.5, 0.5, 0.49], GRT = [0.08, 0.08, 0.09];
      const disc = (x, y, z, r, col) => { for (let q = 0; q < 10; q++) { const a0 = q * PI / 5, a1 = a0 + PI / 5; gm.triO([x, y, z], [x + Math.cos(a0) * r, y, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r], col, [x, y - 5, z]); } };
      const manhole = (x, y, z) => { disc(x, y, z, 0.37, IRIM); disc(x, y + 0.004, z, 0.3, IRON); out.manholes++; };
      const hyS = (sv) => { const f = clamp(sv / ds, 0, N - 1.001), i0 = Math.floor(f); return lerp(T.hy[i0], T.hy[i0 + 1], f - i0); };   // (the road's height between the samples)
      const rect = (s0, s1, o0, o1, dy, col) => { const a = atSf(s0, o0), b = atSf(s0, o1), c = atSf(s1, o1), d = atSf(s1, o0), y0 = hyS(s0) + dy, y1 = hyS(s1) + dy; gm.quadUp([a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]], [col, col, col, col]); };
      out.manholes = 0; out.grates = 0; out.giveWay = 0;
      for (let s = Math.max(2, sStart - 30); s < T.len - 6; s += 30 + 30 * crH(s, 1, 85)) { const i = T.idx(s); if (SF[i] !== 0 || inChic(s)) continue;
        const p = atSf(s, (crH(s, 2, 86) - 0.5) * 2 * (WA[i] - 1.3)); manhole(p[0], hyS(s) + 0.045, p[1]); }
      for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0;
        for (let s = Math.max(2, sStart - 30); s < T.len - 6; s += 22 + 12 * crH(s, side, 87)) { const i = T.idx(s); if (SF[i] !== 0 || VT[si][i] !== 4 || inChic(s)) continue;
          const o = side * (WA[i] - 0.3); rect(s - 0.32, s + 0.32, o - 0.22, o + 0.22, 0.045, GFR); rect(s - 0.25, s + 0.25, o - 0.15, o + 0.15, 0.049, GRT); out.grates++; } }
      for (const r of roads) { if (r.cls > 2 || r.surf !== 0) continue;
        const D = r.d, M = D.length, hw = RHW[r.cls], lift = RLIFT[r.cls] + 0.012, near = D.map(([x, z]) => { const n = hjNear(x, z); return n.i >= 0 && Math.abs(n.lat) < WA[n.i] + 0.3; });
        let run = 0;
        for (let q = 0; q < M - 1; q++) {
          if (!near[q] && !near[q + 1] && (run += Math.hypot(D[q + 1][0] - D[q][0], D[q + 1][1] - D[q][1])) > 35 + 20 * crH(D[q][0], D[q][1], 88)) { run = 0; const [x, z] = D[q]; if (!onBld(x, z)) manhole(x, hjGround(x, z) + lift, z); }
          if (near[q] === near[q + 1] || r.cls > 1) continue;
          const a = near[q] ? D[q + 1] : D[q], b = near[q] ? D[q] : D[q + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, fx = (b[0] - a[0]) / l, fz = (b[1] - a[1]) / l;   // (coming up to the stage from a to b: the lane on the right, x east and z south)
          const P = (u, v) => { const x = a[0] - fz * u + fx * v, z = a[1] + fx * u + fz * v; return [x, hjGround(x, z) + lift, z]; };
          for (let o = 0.2; o + 0.5 < hw - 0.3; o += 0.8) gm.triO(P(o, 0), P(o + 0.5, 0), P(o + 0.25, -0.6), WHT, [a[0], -999, a[1]]);
          out.giveWay++; }
      }
      { const m = addM(gm, new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })); if (m) { m.name = 'roadcovers'; m.renderOrder = 0.75; } }   // (ROAD DECAL ORDER: the rubber over the iron and the paint)
    }

    /* ---- the streets, footways, park paths and steps (ribbons on the ground, cut back where they reach the stage) ---- */
    {
      const gA = new Chunks(120, true), gP = new Chunks(120, true), gG = new Chunks(120, true), gS = new Chunks(120), SC = [[0.68, 0.61, 0.47], [0.68, 0.61, 0.47], [0.68, 0.61, 0.47], [0.5, 0.42, 0.31], [0.52, 0.4, 0.28]];
      for (const r of roads) {
        const hw = RHW[r.cls], lift = RLIFT[r.cls], D = dense(r.pts, 2.4), M = D.length; if (M < 2) continue;
        const path = r.cls >= 4 && r.cls !== 9, kind = r.surf === 1 ? 1 : (r.surf >= 2 || (r.cls === 6 && r.surf === 0 && P.can && hjCanopy(D[0][0], D[0][1]) >= 1)) ? 2 : 0;   // (0 tarmac, 1 paving, 2 gravel or earth: the park's paths are sand)
        const keep = D.map(([x, z]) => { const n = hjNear(x, z); return !(n.i >= 0 && Math.abs(n.lat) < WA[n.i] + (path ? 0.6 : 0.3)); });
        const L = D.map((p, q) => { const a = D[Math.max(0, q - 1)], b = D[Math.min(M - 1, q + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
        if (r.cls === 8) {   // steps: a concrete flight (treads every ~0.35 m of height where it climbs), railings
          for (let q = 0; q < M - 1; q++) { if (!keep[q] || !keep[q + 1]) continue; const [ax, az] = D[q], [bx, bz] = D[q + 1], ya = hjGround(ax, az), yb = hjGround(bx, bz), nx = L[q][0], nz = L[q][1], rise = yb - ya, m = Math.max(1, Math.round(Math.abs(rise) / 0.17)), g = gS.get(ax, az), C = [0.5, 0.48, 0.47];   // (stone steps: the risers in shadow-dark granite, the treads worn pale)
            for (let t = 0; t < m; t++) { const f0 = t / m, f1 = (t + 1) / m, x0 = lerp(ax, bx, f0), z0 = lerp(az, bz, f0), x1 = lerp(ax, bx, f1), z1 = lerp(az, bz, f1), y = ya + rise * (rise > 0 ? f1 : f0) + 0.02;
              const k = 0.95 + 0.1 * crH(x0, z0, 61); box(g, (x0 + x1) / 2, Math.min(ya, yb) - 0.4, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0) + 0.02, y - Math.min(ya, yb) + 0.4, hw * 2, Math.atan2(bz - az, bx - ax), vary(C, R, 0.04), [0.71 * k, 0.69 * k, 0.66 * k], true); }
            for (const sd of [-1, 1]) ouRod(g, [ax + nx * sd * hw, ya + 0.95, az + nz * sd * hw], [bx + nx * sd * hw, yb + 0.95, bz + nz * sd * hw], 0.03, [0.2, 0.22, 0.24], 4); }
          continue;
        }
        const col = kind === 2 ? SC[r.surf] || SC[0] : kind === 1 ? [0.92, 0.9, 0.87] : [0.95, 0.95, 0.97];   // (the tarmac as the stage's)
        for (let q = 0; q < M - 1; q++) { if (!keep[q] || !keep[q + 1]) continue;
          const pt = (p, n, o) => { const x = p[0] + n[0] * o, z = p[1] + n[1] * o; return [x, hjGround(x, z) + lift, z]; };
          const a = pt(D[q], L[q], -hw), b = pt(D[q], L[q], hw), c = pt(D[q + 1], L[q + 1], hw), d = pt(D[q + 1], L[q + 1], -hw), us = kind === 1 ? 2 : 7, uv = (p) => [p[0] / us, -p[2] / us];
          const ch = kind === 0 ? gA : kind === 1 ? gP : gG, cc = kind === 2 ? [col, col, col, col] : [col, col, col, col];
          ch.get(D[q][0], D[q][1]).quadUp(a, b, c, d, cc, [uv(a), uv(b), uv(c), uv(d)]); }
      }
      const rA = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const rP = new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const rG = new THREE.MeshLambertMaterial({ map: ouGTex(), vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      // car parks (tarmac) and squares (paving) laid on the ground: the polygons triangulated and cut into ~3 m triangles that follow it
      const cA = gA, cP = gP;   // (the car parks and squares in the streets' own chunks: fewer draws)
      const lay = (ch, a, b, c, us, col, dep) => { const l = Math.max(Math.hypot(a[0] - b[0], a[1] - b[1]), Math.hypot(b[0] - c[0], b[1] - c[1]), Math.hypot(c[0] - a[0], c[1] - a[1]));
        if (l > 3.2 && dep < 7) { const ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2], ca = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2]; lay(ch, a, ab, ca, us, col, dep + 1); lay(ch, ab, b, bc, us, col, dep + 1); lay(ch, ca, bc, c, us, col, dep + 1); lay(ch, ab, bc, ca, us, col, dep + 1); return; }
        const mx = (a[0] + b[0] + c[0]) / 3, mz = (a[1] + b[1] + c[1]) / 3; if (nearDD(mx, mz) < 0.5 || onBld(mx, mz)) return;
        const P3 = (p) => [p[0], hjGround(p[0], p[1]) + 0.05, p[1]], A = P3(a), B = P3(b), C = P3(c);
        ch.get(mx, mz).triO(A, B, C, col, [mx, Math.min(A[1], B[1], C[1]) - 5, mz], col, col, [A[0] / us, -A[2] / us], [B[0] / us, -B[2] / us], [C[0] / us, -C[2] / us]); };
      for (const ar of P.areas) { if (ar.t !== 5 && ar.t !== 6) continue;
        const tris = THREE.ShapeUtils.triangulateShape(ar.poly.map(([x, z]) => new THREE.Vector2(x, z)), []), park = ar.t === 5, col = park ? [0.93, 0.93, 0.95] : [0.9, 0.88, 0.84];
        for (const [a, b, c] of tris) lay(park ? cA : cP, ar.poly[a], ar.poly[b], ar.poly[c], park ? 7 : 2, col, 0);
        for (let q = 0; q < ar.poly.length; q++) { const a = ar.poly[q], b = ar.poly[(q + 1) % ar.poly.length]; hjMarkSeg(a[0], a[1], b[0], b[1], 1.0, 1); }
        hjFill(ar.poly, (v) => { G.pv[v] = Math.max(G.pv[v], 1); }); }
      gA.addTo(root, rA, false, true); gP.addTo(root, rP, false, true); gG.addTo(root, rG, false, true); gS.addTo(root, matV, true, true);
    }

    /* ---- the buildings (def.scen.bld): the blocks of flats and the shops of the centre, the wooden houses, sheds, schools, the church, the stadium's stand,
       the Vesilinna water tower (1953) on the summit (its own model); vertex coloured facades from the atlas, 140 m chunks ---- */
    const fMat = hjCutMat(new THREE.MeshLambertMaterial({ map: hjFacadeTex(), vertexColors: true }), cut);   // (what of a building hides the car or the road just ahead of it on the screen fades)
    const bch = new Chunks(140, true), UV7 = [0.5, hjFV(7, 0.5)], scen = new Chunks(110), veg = new Chunks(110), UPN = [0, 1, 0];
    const RB = rng(8121); let nBld = 0, vesi = null, stand = null;
    for (const b of P.blds) {
      let cx = 0, cz = 0; for (const [x, z] of b.poly) { cx += x / b.poly.length; cz += z / b.poly.length; }
      const n = hjNear(cx, cz); if (n.i >= 0 && n.dd < 0.5) continue;   // (never in the corridor: the stage's streets were cleared)
      if (b.kind === 8) { vesi = { poly: b.poly, cx, cz }; continue; }
      if (b.kind === 3 && Math.abs(polyArea(b.poly)) > 400) { stand = { poly: b.poly, cx, cz, h: b.h }; continue; }
      const g = bch.get(cx, cz); g.dUV = UV7;
      const r = hjBuilding(g, b.poly, b.kind, b.roof, b.h, RB);
      if (b.kind === 6) { const k = 0, [ax, az] = b.poly[k], [bx, bz] = b.poly[1], tx = lerp(ax, bx, 0.5), tz = lerp(az, bz, 0.5), rot = Math.atan2(bz - az, bx - ax);   // the church's tower and spire
        box(g, lerp(tx, r.cx, 0.12), r.g0, lerp(tz, r.cz, 0.12), 5.2, r.top - r.g0 + 9, 5.2, rot, [0.97, 0.92, 0.9]); cone(g, lerp(tx, r.cx, 0.12), r.top + 9, lerp(tz, r.cz, 0.12), 3.4, 14, 4, [0.22, 0.26, 0.24], [0.3, 0.34, 0.3], rot + PI / 4); }
      nBld++;
    }
    function polyArea(p) { let a = 0; for (let k = 0; k < p.length; k++) { const [ax, az] = p[k], [bx, bz] = p[(k + 1) % p.length]; a += ax * bz - bx * az; } return a / 2; }
    if (vesi) {   // Vesilinna (1953): a water and observation tower of red brick, 34 m, on the summit: the Natural History Museum in the low wing
      // over the whole footprint, the 3 000 m3 tanks in the shaft rising from its middle, up top the café and the restaurant behind a band of big windows,
      // the observation deck on the roof (its railing), the lift's machine room, the telecom masts and a flag; the whole Harju comes up here to watch
      const g = bch.get(vesi.cx, vesi.cz); g.dUV = UV7;
      const pol = vesi.poly, BR = [0.97, 0.93, 0.9]; let bl = 0, dx = 1, dz = 0;
      for (let k = 0; k < pol.length; k++) { const [ax, az] = pol[k], [bx, bz] = pol[(k + 1) % pol.length], l = Math.hypot(bx - ax, bz - az); if (l > bl) { bl = l; dx = (bx - ax) / l; dz = (bz - az) / l; } }
      const r = hjBuilding(g, pol, 4, 0, 10.5, rng(8131), { row: 4, rowUp: 4, col: BR, fh: 3.6, bare: true }), rot = Math.atan2(dz, dx), g0 = r.g0, tx = vesi.cx, tz = vesi.cz, H = g0 + 34, TL = 15.5, TD = 12.5;
      const c = Math.cos(rot), s = Math.sin(rot), at = (a, b) => [tx + c * a - s * b, tz + s * a + c * b];
      const prism = (L, D, y0, y1, rowK, col, fh) => {   // the walls of an L x D block round the tower's axis from y0 to y1, in bands of the atlas row
        const C4 = [at(-L / 2, -D / 2), at(L / 2, -D / 2), at(L / 2, D / 2), at(-L / 2, D / 2)], nb = Math.max(1, Math.round((y1 - y0) / fh)), bh = (y1 - y0) / nb;
        for (let k = 0; k < 4; k++) { const [ax, az] = C4[k], [bx, bz] = C4[(k + 1) % 4], U = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 3.2)), inn = [tx, (y0 + y1) / 2, tz];
          for (let q = 0; q < nb; q++) { const ya = y0 + q * bh, yb = ya + bh; g.quadO([ax, ya, az], [bx, ya, bz], [bx, yb, bz], [ax, yb, az], col, inn, [[0, hjFV(rowK, 0)], [U, hjFV(rowK, 0)], [U, hjFV(rowK, 1)], [0, hjFV(rowK, 1)]]); } } };
      prism(TL, TD, r.top - 0.5, H - 5.0, 8, BR, 3.2);   // the shaft
      for (const [a, b, L, D] of [[0, TD / 2 + 0.06, 1.1, 0.1], [0, -TD / 2 - 0.06, 1.1, 0.1], [TL / 2 + 0.06, 0, 0.1, 1.1], [-TL / 2 - 0.06, 0, 0.1, 1.1]]) { const [px, pz] = at(a, b); box(g, px, r.top + 1, pz, L, H - 7.5 - r.top, D, rot, [0.26, 0.31, 0.36]); }   // the stairwell's tall window slits
      box(g, tx, H - 5.2, tz, TL + 0.9, 0.35, TD + 0.9, rot, [0.84, 0.84, 0.82]);   // the upper floor's slab
      prism(TL + 0.6, TD + 0.6, H - 4.85, H - 1.3, 9, BR, 3.6);   // the café and the restaurant: big windows between brick piers
      prism(TL + 0.8, TD + 0.8, H - 1.3, H, 8, BR, 1.3);   // the parapet of the deck
      box(g, tx, H - 0.05, tz, TL + 0.6, 0.06, TD + 0.6, rot, [0.46, 0.45, 0.43], [0.52, 0.5, 0.47]);   // the deck
      for (let k = 0; k < 4; k++) { const sd = k < 2 ? 1 : -1, alongL = k % 2 === 0, L2 = alongL ? TL + 0.8 : TD + 0.8, [px, pz] = alongL ? at(0, sd * (TD / 2 + 0.4)) : at(sd * (TL / 2 + 0.4), 0);
        box(g, px, H + 1.05, pz, alongL ? L2 : 0.06, 0.06, alongL ? 0.06 : L2, rot, [0.3, 0.3, 0.32]); }   // the railing on the parapet
      box(g, tx + c * 3, H, tz + s * 3, 3.4, 2.6, 3.4, rot, [0.62, 0.3, 0.24], [0.4, 0.4, 0.4]);   // the lift's machine room
      for (const [a, b, hh] of [[-4, -3, 14], [-5.5, 3.5, 9]]) { const [px, pz] = at(a, b); cyl(g, px, H, pz, 0.12, hh, 5, [0.8, 0.8, 0.82]); for (let k = 0; k < 3; k++) box(g, px, H + hh * 0.45 + k * hh * 0.18, pz, 0.35, 1.3, 0.12, rot + k * 2.1, [0.86, 0.86, 0.88]); }   // the telecom masts
      ouFlag(g, tx + c * 6 - s * 4.5, H, tz + s * 6 + c * 4.5, rot, 6);
      out.vesilinna = { x: tx, z: tz, top: H };
    }
    if (stand) {   // the Harju stadium's main stand: rows of seats rising away from the pitch under a roof on posts (full: the stage passes behind it)
      const pol = stand.poly; let bl = 0, dx = 1, dz = 0, ia = 0; for (let k = 0; k < pol.length; k++) { const [ax, az] = pol[k], [bx, bz] = pol[(k + 1) % pol.length], l = Math.hypot(bx - ax, bz - az); if (l > bl) { bl = l; dx = (bx - ax) / l; dz = (bz - az) / l; ia = k; } }
      const pitch = P.areas.filter(a => a.t === 2 || a.t === 11).map(a => { let x = 0, z = 0; for (const [px, pz] of a.poly) { x += px / a.poly.length; z += pz / a.poly.length; } return { x, z, a: Math.abs(polyArea(a.poly)) }; }).sort((a, b) => b.a - a.a)[0];
      let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of pol) { const a = (x - stand.cx) * dx + (z - stand.cz) * dz, b = -(x - stand.cx) * dz + (z - stand.cz) * dx; u0 = Math.min(u0, a); u1 = Math.max(u1, a); v0 = Math.min(v0, b); v1 = Math.max(v1, b); }
      let fx = -dz, fz = dx; if (pitch && (pitch.x - stand.cx) * fx + (pitch.z - stand.cz) * fz < 0) { fx = -fx; fz = -fz; }   // (towards the pitch)
      const L = u1 - u0, D = v1 - v0, mx = stand.cx + dx * (u0 + u1) / 2 - dz * (v0 + v1) / 2, mz = stand.cz + dz * (u0 + u1) / 2 + dx * (v0 + v1) / 2, y0 = hjGround(mx, mz), rows = 9, g = bch.get(mx, mz); g.dUV = UV7;
      const rot = Math.atan2(dz, dx), crowdG = new GB(true), CW = [1, 1, 1];
      for (let k = 0; k < rows; k++) { const off = -D / 2 + 1 + k * (D - 3) / rows, y = y0 + 0.4 + k * 0.45, px = mx - fx * off, pz = mz - fz * off;
        box(g, px, y0 - 0.5, pz, L, y - y0 + 0.5, (D - 3) / rows + 0.02, rot, [0.6, 0.6, 0.6], [0.72, 0.72, 0.72], true);
        const a = [px - dx * L / 2 + fx * 0.2, y + 0.02, pz - dz * L / 2 + fz * 0.2], b = [px + dx * L / 2 + fx * 0.2, y + 0.02, pz + dz * L / 2 + fz * 0.2], cT = [b[0] - fx * 0.3, y + 0.62, b[2] - fz * 0.3], dT = [a[0] - fx * 0.3, y + 0.62, a[2] - fz * 0.3];
        crowdG.quadO(a, b, cT, dT, CW, [px - fx * 3, y, pz - fz * 3], [[0, 0], [L / 3, 0], [L / 3, 1], [0, 1]]); }
      const back = [mx - fx * (D / 2), mz - fz * (D / 2)], BH = 0.4 + rows * 0.45 + 3.4; box(g, back[0], y0 - 0.3, back[1], L, BH, 0.3, rot, [0.56, 0.57, 0.58]);
      { // its back, seen from the stage: red-ochre boards, doors under the seats every few bays, a band of small windows above
        const WC = [0.62, 0.3, 0.22], ox = back[0] - fx * 0.16, oz = back[1] - fz * 0.16, bays = Math.max(1, Math.round(L / 3.2)), inn = [back[0] + fx, y0 + 2, back[1] + fz], yb = y0 - 0.3, ym = y0 + 3.3, yt = y0 - 0.3 + BH;
        for (let b0 = 0; b0 < bays; b0++) { const a0 = -L / 2 + b0 * L / bays, a1 = a0 + L / bays, A = [ox + dx * a0, oz + dz * a0], B = [ox + dx * a1, oz + dz * a1], rk = b0 % 6 === 3 ? 12 : 6;
          g.quadO([A[0], yb, A[1]], [B[0], yb, B[1]], [B[0], ym, B[1]], [A[0], ym, A[1]], WC, inn, [[0, hjFV(rk, 0)], [1, hjFV(rk, 0)], [1, hjFV(rk, 1)], [0, hjFV(rk, 1)]]);
          g.quadO([A[0], ym, A[1]], [B[0], ym, B[1]], [B[0], yt, B[1]], [A[0], yt, A[1]], WC, inn, [[0, hjFV(3, 0)], [1, hjFV(3, 0)], [1, hjFV(3, 1)], [0, hjFV(3, 1)]]); }
        const fy = y0 + 0.4 + rows * 0.45 + 3.0, e = D * 0.1 + D * 0.425 + 0.02, P1 = [mx - fx * e - dx * (L / 2 + 0.5), mz - fz * e - dz * (L / 2 + 0.5)], P2 = [mx - fx * e + dx * (L / 2 + 0.5), mz - fz * e + dz * (L / 2 + 0.5)];
        g.quadO([P1[0], fy - 0.35, P1[1]], [P2[0], fy - 0.35, P2[1]], [P2[0], fy + 0.32, P2[1]], [P1[0], fy + 0.32, P1[1]], [0.24, 0.24, 0.26], [mx, fy, mz]); }   // (the roof's dark fascia)
      for (let k = 0; k <= 10; k++) { const a = -L / 2 + k * L / 10; box(g, back[0] + dx * a - fx * 0.2, y0 - 0.3, back[1] + dz * a - fz * 0.2, 0.5, 0.4 + rows * 0.45 + 3.6, 0.3, rot, [0.48, 0.49, 0.5]); }   // (its pillars)
      box(g, mx - fx * (D * 0.1), y0 + 0.4 + rows * 0.45 + 3.0, mz - fz * (D * 0.1), L + 1, 0.3, D * 0.85, rot, [0.86, 0.86, 0.84], [0.3, 0.32, 0.34]);
      for (let k = 0; k <= 5; k++) { const a = -L / 2 + k * L / 5, px = mx + dx * a + fx * (D * 0.3), pz = mz + dz * a + fz * (D * 0.3); box(g, px, y0, pz, 0.25, 0.4 + rows * 0.45 + 3.0, 0.25, rot, [0.4, 0.4, 0.42]); }
      addM(crowdG, new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), false);
    }

    /* ---- the stage's boards and gantries, the start with its lights, the splits, the flying finish, STOP; flags ---- */
    const ban = new GB(true), W1 = [1, 1, 1], row = (k) => [1 - (k + 1) / 8, 1 - k / 8];
    const bannerQ = (cx, cy, cz, tx, tz, Wd, H, v0, v1, u0, u1, gb) => { const ux = tz, uz = -tx; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;   // a double-sided board (bottom centre cx, cy, cz), readable from +t and -t (gb: another texture's GB)
      for (const f of [-1, 1]) { const ox = tx * 0.04 * f, oz = tz * 0.04 * f, hw = Wd / 2 * f;
        const A = [cx + ox - ux * hw, cy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy, cz + oz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
        (gb || ban).quadO(A, B, C, D, W1, [cx - tx * f, cy + H / 2, cz - tz * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); } };
    const arch = (s, rowK, postCol, beamCol) => {   // a gantry over the road: two posts beyond the verge, a beam, a board both ways
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = WA[i] + 1.6, g = scen.get(x, z), hd = T.hd[i];
      for (const o of [-L1, L1]) box(g, x + nx * o, y - 0.5, z + nz * o, 0.5, 7.0, 0.5, hd, postCol);
      box(g, x, y + 5.9, z, 0.5, 0.6, 2 * L1 + 0.5, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.2, z, T.tx[i], T.tz[i], Math.min(12.5, 2 * L1 - 0.6), 1.56 * Math.min(1, (2 * L1 - 0.6) / 12.5), v0, v1);
      exclPush(x, z, WA[i] + 6); return [x, y, z, i]; };
    const flagAt = (x, z, rot, h) => { ouFlag(scen.get(x, z), x, hjGround(x, z), z, rot, h || 7); exclPush(x, z, 1); };
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.1, 0.2, 0.46]), nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z);
      box(g, x, y + 6.5, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);   // the start lights' panel
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.05, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 6, 1, 0.6), hy = hjGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut on the sidewalk
      box(gh, hx, hy, hz, 3.4, 2.6, 2.4, T.hd[i], [0.93, 0.92, 0.88], [0.3, 0.3, 0.32], true); box(gh, hx, hy + 1.2, hz, 3.45, 0.8, 2.45, T.hd[i], [0.16, 0.24, 0.36], null, true); exclPush(hx, hz, 3);
      { const [bx, bz, bi] = onSide(sStart + 16, -1, 0.5), by = hjGround(bx, bz), gb = scen.get(bx, bz);   // the stage's banner beside the road after the line
        for (const o of [-3.1, 3.1]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 2.9, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        const [v0, v1] = row(4); bannerQ(bx, by + 1.4, bz, -T.nx[bi], -T.nz[bi], 6.4, 0.8, v0, v1); exclPush(bx, bz, 4); }
      for (let s = sStart - 40; s < sStart + 40; s += 16) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 0.4); if (!onBld(px, pz)) flagAt(px, pz, T.hd[ii], 6.5); }
    }
    const kmS = (s) => ((s - sStart) / 1000).toFixed(1).replace('.', ',') + ' km';
    T.cpS.forEach((s, k) => { arch(s, 2 + k, [0.86, 0.86, 0.88], [0.1, 0.2, 0.46]); });
    {
      const [x, y, z, i] = arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const [hx, hz] = onSide(sFin + 3, 1, 0.5), hy = hjGround(hx, hz), gh = scen.get(hx, hz);
      box(gh, hx, hy, hz, 3.4, 2.6, 2.4, T.hd[i], [0.93, 0.92, 0.88], [0.3, 0.3, 0.32], true); box(gh, hx, hy + 1.2, hz, 3.45, 0.8, 2.45, T.hd[i], [0.16, 0.24, 0.36], null, true); exclPush(hx, hz, 3);
      const sign = (s, side, u0, u1, rk, Wd, H) => { const [px, pz, ii] = onSide(s, side, 0.3), py = hjGround(px, pz), gg = scen.get(px, pz);
        for (const o of [-Wd * 0.35, Wd * 0.35]) box(gg, px + T.nx[ii] * o, py - 0.2, pz + T.nz[ii] * o, 0.1, 1.5, 0.1, T.hd[ii], [0.3, 0.3, 0.32]);
        const [v0, v1] = row(rk); bannerQ(px, py + 1.3, pz, T.tx[ii], T.tz[ii], Wd, H, v0, v1, u0, u1); exclPush(px, pz, 2); };
      sign(sFin - 100, 1, 0.5, 0.75, 5, 1.8, 0.9); sign(sFin + 1, -1, 0.75, 1, 5, 1.8, 0.9);
      const sStop = T.len - 24; sign(sStop, 1, 0, 0.5, 5, 3.2, 0.8); sign(sStop, -1, 0, 0.5, 5, 3.2, 0.8);
      for (const side of [-1, 1]) for (let s = sFin - 20; s < sFin + 12; s += 10) { const [px, pz, ii] = onSide(s, side, 0.4); if (!onBld(px, pz)) flagAt(px, pz, T.hd[ii], 6); }
    }

    /* ---- the stage's edges on race day: straw bales where the barrier stands on the street itself (the chicanes, the lane change), the steel crowd
       barriers along the town's streets, the orange mesh fence in the park; a KIELLETTY ALUE board and a marshal where a side street is closed ---- */
    const fGB = new Chunks(220, true), spG = new Chunks(200, true), bales = [];
    const barType = (i, side) => { const si = side > 0 ? 1 : 0, bar = side > 0 ? T.br[i] : T.bl[i]; if (bar - WA[i] < 0.45) return 4; if (bar - WA[i] < 1.3) return 1; const t = VT[si][i]; return t === 4 || t === 0 ? 2 : 3; };   // 1 bales, 2 steel barriers, 3 mesh fence, 4 concrete blocks
    const hard = (x, z) => onBld(x, z) || excluded(x, z), blk = new Map(), blkNear = (x, z) => { const cx = Math.floor(x), cz = Math.floor(z); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = blk.get((cx + a) + ',' + (cz + b)); if (L) for (let q = 0; q < L.length; q += 2) if ((L[q] - x) ** 2 + (L[q + 1] - z) ** 2 < 0.8) return true; } return false; };
    const CONC = [0.62, 0.62, 0.6], CONCT = [0.7, 0.7, 0.68];
    const bale = (g, cx, cy, cz, rot, col) => {   // a small square bale (1.15 x 0.45 x 0.55 m) in the barriers' straw: fibres along it, the twine round it; the cut ends lighter
      const c = Math.cos(rot), s = Math.sin(rot), hl = 0.575, hd = 0.275, H = 0.45, P = (a, yy, b) => [cx + a * c - b * s, cy + yy, cz + a * s + b * c], inn = [cx, cy + H / 2, cz], end = [col[0] * 1.08, col[1] * 1.08, col[2] * 1.06];
      const S = (a0, a1) => [[0, 0.02], [1, 0.02], [1, a1], [0, a1]].map(([u, v]) => [u, v === 0.02 ? a0 : v]);
      g.quadO(P(-hl, 0, -hd), P(hl, 0, -hd), P(hl, H, -hd), P(-hl, H, -hd), col, inn, S(0.02, 0.47)); g.quadO(P(-hl, 0, hd), P(hl, 0, hd), P(hl, H, hd), P(-hl, H, hd), col, inn, S(0.02, 0.47));
      g.quadO(P(-hl, H, -hd), P(hl, H, -hd), P(hl, H, hd), P(-hl, H, hd), [col[0] * 1.06, col[1] * 1.06, col[2] * 1.04], inn, S(0.03, 0.4));
      for (const a of [-hl, hl]) g.quadO(P(a, 0, -hd), P(a, 0, hd), P(a, H, hd), P(a, H, -hd), end, inn, [[0.4, 0.05], [0.62, 0.05], [0.62, 0.3], [0.4, 0.3]]); };
    for (const side of [-1, 1]) {
      let prev = null, pk = 0;
      for (let s = Math.max(2, sStart - 30); s < T.len - 6; s += 2.5) {
        const i = T.idx(s), bt = barType(i, side), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + (bt === 1 || bt === 4 ? 0.3 : 0.15)), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        const nn = hjNear(x, z), other = nn.i >= 0 && Math.abs(nn.i - i) * ds > 20 && nn.dd < 0.3;   // (not across another part of the road; the barrier the two carriageways share: once)
        if ((other && bt !== 4 && bt !== 1) || onBld(x, z) || (bt !== 1 && bt !== 4 && mouth[side > 0 ? 1 : 0][i] && pk !== 1)) { prev = null; pk = bt; continue; }
        const y = hjGround(x, z);
        if (bt === 1 || bt === 4) { if (blkNear(x, z)) { prev = null; pk = bt; continue; } const g = scen.get(x, z), k = Math.floor(x) + ',' + Math.floor(z); let L = blk.get(k); if (!L) blk.set(k, L = []); L.push(x, z);
          if (bt === 1) { const gb = fGB.get(x, z), h = T.hd[i], w = crH(x, z, 43), col = [lerp(0.88, 0.72, w), lerp(0.74, 0.66, w), lerp(0.44, 0.52, w)];   // (golden to weathered grey)
            bale(gb, x - Math.cos(h) * 0.58, y, z - Math.sin(h) * 0.58, h + (crH(x, z, 44) - 0.5) * 0.08, col); bale(gb, x + Math.cos(h) * 0.58, y, z + Math.sin(h) * 0.58, h + (crH(x, z, 45) - 0.5) * 0.08, col);
            bale(gb, x, y + 0.44, z, h + (crH(x, z, 46) - 0.5) * 0.2, [col[0] * 1.04, col[1] * 1.04, col[2] * 1.02]); }
          else { box(g, x, y - 0.05, z, 2.3, 0.35, 0.6, T.hd[i], CONC, CONCT, true); box(g, x, y + 0.3, z, 2.3, 0.5, 0.32, T.hd[i], CONC, CONCT, true); }   // (a concrete block: a wide foot, a narrower top)
          bales.push([x, z]); exclPush(x, z, 1); prev = null; pk = bt; continue; }
        const P0 = [x, y, z];
        if (prev && pk === bt && Math.hypot(x - prev[0], z - prev[2]) < 3.6) { const g = fGB.get(x, z), hgt = bt === 2 ? 1.12 : 1.2, u0 = bt === 2 ? 0 : 0.5, u1 = u0 + 0.5;
          g.quadO([prev[0], prev[1] - 0.05, prev[2]], [x, y - 0.05, z], [x, y + hgt, z], [prev[0], prev[1] + hgt, prev[2]], W1, [(x + prev[0]) / 2 - T.nx[i] * side, y + 0.5, (z + prev[2]) / 2 - T.nz[i] * side], [[u0, 0.51], [u1, 0.51], [u1, 0.99], [u0, 0.99]]);
          const hs = crH(x, z, 41); if (hs < 0.34 && s > sStart - 20 && s < sFin + 20) {   // a sponsor's banner tied to the barrier (the game's own brands), readable from the road
            const k = Math.floor(crH(x, z, 42) * 8), bu = (k % 2) * 0.5, bv = 1 - Math.floor(k / 2) * 0.25, L = Math.hypot(x - prev[0], z - prev[2]);
            bannerQ((x + prev[0]) / 2, Math.min(y, prev[1]) + (bt === 2 ? 0.22 : 0.3), (z + prev[2]) / 2, T.nx[i], T.nz[i], L - 0.15, bt === 2 ? 0.62 : 0.7, bv - 0.25, bv, bu, bu + 0.5, spG.get(x, z)); } }
        prev = P0; pk = bt;
      }
    }
    const closedAt = [];   // (the closed side streets' boards: a marshal stands by each, placed with the crowds)
    { // the closed side streets: a board across, a marshal in orange
      for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0; let run0 = -1;
        for (let i = 0; i <= N; i++) { const on = i < N && mouth[si][i]; if (on && run0 < 0) run0 = i; if (!on && run0 >= 0) { const im = Math.round((run0 + i - 1) / 2), s = im * ds; run0 = -1; if (s < sStart - 20 || s > sFin + 60) continue;
          const [px, pz, ii] = onSide(s, side, 2.4); if (hard(px, pz)) continue; const py = hjGround(px, pz), g = scen.get(px, pz);
          for (const o of [-1.25, 1.25]) box(g, px + T.tx[ii] * o, py - 0.2, pz + T.tz[ii] * o, 0.09, 2.3, 0.09, T.hd[ii], [0.35, 0.3, 0.24]);
          const [v0, v1] = row(6); bannerQ(px, py + 1.25, pz, T.nx[ii] * side, T.nz[ii] * side, 3.2, 0.8, v0, v1, 0.5, 1); exclPush(px, pz, 2.5); closedAt.push([px, pz, ii, side]); } } }
    }

    /* ---- the spectators: the start, the boulevard past the hillside steps, the lane change and the corner onto the gravel, both sides of the climb, round the water
       tower, down past the stadium, the gravel kink at its corner, the hairpins by the Lyseo school, Pitkäkatu's chicanes, the old pine, the park, the corner at
       the school and Norssi corner (def.crowds); people on the hillside steps and on the tower's terrace ---- */
    // nobody behind the concrete blocks between the two carriageways (a car passes on either side), nor on the islands the hairpins turn round (def.hairpin [[x, z, r], ...])
    const HP = def.hairpin ? (Array.isArray(def.hairpin[0]) ? def.hairpin : [def.hairpin]) : [], crowdOut = (x, z) => { if (hard(x, z)) return true; for (const h of HP) if (Math.hypot(x - h[0], z - h[1]) < h[2] + 1.5) return true;
      const n = hjNear(x, z); return n.i >= 0 && barType(n.i, n.lat > 0 ? 1 : -1) === 4; };
    // a Finnish summer evening's crowd: blue and white, black rally merchandise, light summer clothes, a few in orange and red
    const SHIRTS = [[0.94, 0.94, 0.92], [0.9, 0.91, 0.92], [0.16, 0.36, 0.78], [0.2, 0.42, 0.86], [0.1, 0.11, 0.13], [0.14, 0.15, 0.17], [0.55, 0.6, 0.66], [0.4, 0.62, 0.85], [0.82, 0.16, 0.13], [0.95, 0.8, 0.2], [0.2, 0.5, 0.3], [0.96, 0.52, 0.12], [0.35, 0.36, 0.38], [0.74, 0.72, 0.62]];
    const CR = crowdCtx({ gH: hjGround, near: nearDD, excluded: crowdOut, maxSlope: 0.95, chunk: 32, shirts: SHIRTS }), crSoft = new Set();   // (64 m chunks: the chase view draws ~1/3 of the people a 128 m chunk would)
    const M = { first: 0.8, gap: 0.95, below: 3.5, above: 9, maxSlope: 0.95, sit: 0.22, flag: 0.1, keepBar: 0.6 };
    const run = (d0, d1, side, o) => { const a = Math.max(sAt(d0), 2), b = Math.min(sAt(d1), T.len - 4); if (b <= a) return 0; return crowdRun(CR, a, b, side, Object.assign({}, M, o)); };
    const C1 = def.crowds || [];   // (def.crowds [d0, d1, rows, share])
    for (const [a, b, rows, dn] of C1) for (const sd of [-1, 1]) run(a, b, sd, { rows, dens: dn * (sd > 0 ? 0.86 : 0.78), label: 'HJ ' + a + (sd > 0 ? 'R' : 'L') });
    for (const r of roads) { if (r.cls !== 8) continue;   // on the steps (the hillside steps and the ridge's other flights): people standing along them, looking towards the stage
      for (let q = 0; q < r.d.length; q++) { const [x, z] = r.d[q], n = hjNear(x, z); if (n.i < 0 || n.d > 70 || n.dd < 2) continue;
        for (const o of [-0.7, 0.7]) { const a = r.d[Math.max(0, q - 1)], b = r.d[Math.min(r.d.length - 1, q + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, px = x - dz / l * o, pz = z + dx / l * o;
          if (crH(px, pz, 31) > 0.55) continue; crowdPut(CR, px, hjGround(px, pz), pz, T.px[n.i] - px, T.pz[n.i] - pz, { flag: 0.1 }, 1); } } }
    if (out.vesilinna) { const V = out.vesilinna; for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, px = V.x + Math.cos(a) * 7.6, pz = V.z + Math.sin(a) * 6.1; if (crH(px, pz, 33) < 0.35) continue; crowdPut(CR, px, V.top, pz, Math.cos(a), Math.sin(a), { flag: 0.08 }, 1); } }
    for (const [bx, bz, ii, sd] of closedAt) { const mx = bx + T.tx[ii] * 1.9, mz = bz + T.tz[ii] * 1.9; crowdPut(CR, mx, hjGround(mx, mz), mz, -T.nx[ii] * sd, -T.nz[ii] * sd, { col: [1, 0.5, 0.06], flag: 0 }, 1); }   // (the marshals, hi-vis orange)
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);   // (the trees keep clear of the crowds)
    let nCars = 0;
    { // the car parks full of the spectators' cars (one instanced car, its colour per instance): perpendicular bays along each car park's long side, two rows to an aisle
      const g = new GB(), BODY = [1, 1, 1], GLASS = [0.2, 0.23, 0.26], DARK = [0.16, 0.16, 0.17];
      box(g, 0, 0.18, 0, 4.3, 0.72, 1.76, 0, BODY, BODY, true); box(g, -0.25, 0.9, 0, 2.3, 0.58, 1.5, 0, GLASS, BODY, true); box(g, 0, 0.12, 0, 4.36, 0.16, 1.8, 0, DARK, DARK, true);
      const cg = g.geometry(); cg.computeBoundingSphere(); const CARS = new IChunks(cg, new THREE.MeshLambertMaterial({ vertexColors: true }), 160);
      const PAL = [[0.92, 0.92, 0.9], [0.92, 0.92, 0.9], [0.12, 0.12, 0.13], [0.12, 0.12, 0.13], [0.62, 0.63, 0.65], [0.62, 0.63, 0.65], [0.36, 0.37, 0.4], [0.14, 0.2, 0.42], [0.55, 0.1, 0.09], [0.16, 0.3, 0.22], [0.75, 0.68, 0.55]];
      for (const A of P.areas) { if (A.t !== 5) continue; const poly = A.poly, n = poly.length; let bl = 0, dx = 1, dz = 0, cx = 0, cz = 0;
        for (let k = 0; k < n; k++) { const [ax, az] = poly[k], [bx, bz] = poly[(k + 1) % n], l = Math.hypot(bx - ax, bz - az); cx += ax / n; cz += az / n; if (l > bl) { bl = l; dx = (bx - ax) / l; dz = (bz - az) / l; } }
        let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of poly) { const a2 = (x - cx) * dx + (z - cz) * dz, b2 = -(x - cx) * dz + (z - cz) * dx; u0 = Math.min(u0, a2); u1 = Math.max(u1, a2); v0 = Math.min(v0, b2); v1 = Math.max(v1, b2); }
        for (let v = v0 + 2.8, row = 0; v < v1 - 2.4; v += row % 2 ? 11.2 : 5.2, row++) for (let u = u0 + 1.6; u < u1 - 1.2; u += 2.6) {   // (a bay 2.6 m wide, 5.2 m deep; a 6 m aisle after every second row)
          const x = cx + dx * u - dz * v, z = cz + dz * u + dx * v; if (crH(x, z, 71) > 0.68 || !inPoly(poly, x, z) || polyDist(poly, x, z) < 2.3 || onBld(x, z) || excluded(x, z)) continue;
          const nn = hjNear(x, z); if (nn.i >= 0 && nn.dd < 4) continue;
          CARS.add(x, hjGround(x, z), z, -Math.atan2(dx, -dz) + (crH(x, z, 72) - 0.5) * 0.08 + (crH(x, z, 73) < 0.5 ? Math.PI : 0), 1, 1, PAL[Math.floor(crH(x, z, 74) * PAL.length)]); nCars++; }
      }
      CARS.addTo(root, true);
    }
    // YLEISÖALUE boards where the big crowds begin
    for (const [a, b, rows] of C1) if (rows >= 4) for (const sd of [-1, 1]) { const [px, pz, ii] = onSide(sAt(a) - 3, sd, 0.6); if (hard(px, pz) || nearDD(px, pz) < 0.2) continue; const py = hjGround(px, pz), g = scen.get(px, pz);
      for (const u of [-1.05, 1.05]) box(g, px + T.tx[ii] * u, py - 0.2, pz + T.tz[ii] * u, 0.08, 2.0, 0.08, T.hd[ii], [0.35, 0.3, 0.24]);
      const [v0, v1] = row(6); bannerQ(px, py + 1.2, pz, T.nx[ii], T.nz[ii], 2.6, 0.66, v0, v1, 0, 0.5); CR.block(px, pz, 2.6, 0.4, T.hd[ii]); }

    /* ---- race day behind the big crowds: a sausage grill under a red and white pop-up tent (its queue, a beer table), a row of portable toilets ---- */
    let nStalls = 0, nLoos = 0;
    {
      const free = (x, z, y) => { const k = gIdx(x, z); return k >= 0 && G.sw[k] !== 2 && !hard(x, z) && !excluded(x, z) && nearDD(x, z) > 6 && Math.abs(hjGround(x, z) - y) < 0.6; };   // (on the park's paths too, not on a street)
      const spot = (x, z, r) => { const y = hjGround(x, z); if (!free(x, z, y)) return null; for (let k = 0; k < 8; k++) { const a = k * PI / 4; if (!free(x + Math.cos(a) * r, z + Math.sin(a) * r, y)) return null; } return y; };
      const stall = (x, y, z, rot, sd) => {   // (local u along the stage, v away from it: the counter on the far side, where the people come along the paths)
        const g = scen.get(x, z), c = Math.cos(rot), s = Math.sin(rot), at = (u, v) => [x + c * u - s * v * sd, z + s * u + c * v * sd], RED = [0.84, 0.14, 0.12], WH = [0.95, 0.95, 0.93];
        for (const [u, v] of [[-1.45, -1.45], [1.45, -1.45], [1.45, 1.45], [-1.45, 1.45]]) { const [px, pz] = at(u, v); box(g, px, y - 0.1, pz, 0.05, 2.25, 0.05, rot, [0.82, 0.83, 0.85]); }
        const cn = [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]].map(([u, v]) => { const [px, pz] = at(u, v); return [px, y + 2.15, pz]; }), top = [x, y + 2.95, z];
        for (let k = 0; k < 4; k++) { const a = cn[k], b = cn[(k + 1) % 4]; g.triO(a, b, top, k % 2 ? WH : RED, [x, y, z]); g.quadO([a[0], a[1] - 0.25, a[2]], [b[0], b[1] - 0.25, b[2]], b, a, k % 2 ? RED : WH, [x, y + 2, z]); }   // (the canopy and its valance)
        const [fx, fz] = at(0, 1.2); box(g, fx, y, fz, 2.6, 0.95, 0.6, rot, [0.86, 0.86, 0.84], [0.62, 0.48, 0.32]);   // (the counter)
        const [gx, gz] = at(0.5, -0.5); box(g, gx, y, gz, 0.9, 0.62, 0.5, rot, [0.3, 0.3, 0.32]); box(g, gx, y + 0.62, gz, 1.0, 0.28, 0.6, rot, [0.12, 0.12, 0.13], [0.2, 0.18, 0.17]);   // (the grill on its stand)
        const [tx, tz] = at(3.6, 2.2), ty = hjGround(tx, tz); box(g, tx, ty + 0.72, tz, 2.2, 0.05, 0.6, rot, [0.6, 0.45, 0.3]); for (const e of [-0.95, 0.95]) { const [lx, lz] = at(3.6 + e, 2.2); box(g, lx, ty, lz, 0.05, 0.72, 0.5, rot, [0.25, 0.25, 0.27]); }
        for (const e of [-0.6, 0.6]) { const [bx, bz] = at(3.6, 2.2 + e); box(g, bx, ty + 0.42, bz, 2.2, 0.04, 0.25, rot, [0.6, 0.45, 0.3]); }   // (a beer table and its benches)
        for (let q = 0; q < 2 + Math.floor(crH(x, z, 92) * 4); q++) { const [qx, qz] = at((crH(x, z, 93 + q) - 0.5) * 0.5, 2.3 + q * 0.75); crowdPut(CR, qx, hjGround(qx, qz), qz, x - qx, z - qz, { flag: 0 }, 1); }   // (the queue)
        exclPush(x, z, 3.4); exclPush(tx, tz, 1.8); nStalls++; };
      const loos = (x, z, rot, sd, n) => { const g = scen.get(x, z), c = Math.cos(rot), s = Math.sin(rot);
        for (let k = 0; k < n; k++) { const u = (k - (n - 1) / 2) * 1.25, px = x + c * u, pz = z + s * u, y0 = hjGround(px, pz), col = crH(px, pz, 91) < 0.7 ? [0.16, 0.36, 0.62] : [0.2, 0.5, 0.3];
          box(g, px, y0 - 0.1, pz, 1.15, 2.35, 1.15, rot, col, [0.9, 0.9, 0.88]); box(g, px, y0 + 2.25, pz, 1.25, 0.1, 1.25, rot, [0.88, 0.88, 0.86]);   // (a cabin, blue or green, its white roof)
          box(g, px + s * sd * 0.585, y0, pz - c * sd * 0.585, 0.72, 1.95, 0.03, rot, [col[0] * 0.72, col[1] * 0.72, col[2] * 0.72]); }   // (the door, towards the stage)
        exclPush(x, z, n * 0.7 + 1); nLoos += n; };
      for (const [a, b, rows] of C1) { if (rows < 5) continue;
        let done = false; const sd0 = crH(a, b, 94) < 0.5 ? -1 : 1;
        for (const sd of [sd0, -sd0]) { if (done) break;
          for (let t = 0; t < 7 && !done; t++) { const d = (a + b) / 2 + (t % 2 ? 1 : -1) * Math.ceil(t / 2) * 6, s0 = sAt(d), i = T.idx(s0), bar = sd > 0 ? T.br[i] : T.bl[i];
            for (let off = 10; off <= 22 && !done; off += 3) { const o = sd * (bar + off), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = spot(x, z, 3.6); if (y == null) continue;
              stall(x, y, z, T.hd[i], sd); done = true;
              for (const e of [14, -14, 20, -20]) { const j = T.idx(sAt(d + e)), bj = sd > 0 ? T.br[j] : T.bl[j], oj = sd * (bj + off), lx = T.px[j] + T.nx[j] * oj, lz = T.pz[j] + T.nz[j] * oj;
                if (spot(lx, lz, 2.6) != null) { loos(lx, lz, T.hd[j], sd, 3 + Math.floor(crH(lx, lz, 95) * 3)); break; } } } } } }
    }

    /* ---- the TV: a scaffold camera tower on the summit and one at the start; the helicopter with the car the whole way (pkSky) ---- */
    const tower = (x, z, rot, h) => { const y = hjGround(x, z), g = scen.get(x, z), c = Math.cos(rot), s = Math.sin(rot), sc = [0.7, 0.71, 0.73], at = (u, v, yy) => [x + c * u - s * v, y + yy, z + s * u + c * v], sq = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const [u, v] of sq) ouRod(g, at(u, v, -0.2), at(u, v, h + 1.1), 0.045, sc);
      for (const yy of [1.7, h / 2 + 0.85, h, h + 1.05]) for (let k = 0; k < 4; k++) { const [u0, v0] = sq[k], [u1, v1] = sq[(k + 1) % 4]; ouRod(g, at(u0, v0, yy), at(u1, v1, yy), 0.035, sc); }
      ouRod(g, at(-1, -1, 0.1), at(1, -1, h), 0.035, sc); ouRod(g, at(1, 1, 0.1), at(-1, 1, h), 0.035, sc);
      box(g, x, y + h, z, 2.3, 0.12, 2.3, rot, [0.5, 0.4, 0.28]); exclPush(x, z, 3.2); return y + h + 0.12; };
    const tvCam = (x, y, z, fx, fz) => { const g = scen.get(x, z); box(g, x, y, z, 0.1, 1.2, 0.1, 0, [0.15, 0.15, 0.16]); box(g, x, y + 1.2, z, 0.72, 0.4, 0.3, Math.atan2(fz, fx), [0.16, 0.16, 0.18], [0.3, 0.3, 0.32]);
      ouRod(g, [x + fx * 0.3, y + 1.4, z + fz * 0.3], [x + fx * 0.72, y + 1.4, z + fz * 0.72], 0.1, [0.07, 0.07, 0.08], 6); };
    for (const [d, sd, off] of def.tv || []) { const s = sAt(d), i = T.idx(s), o = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + off), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
      if (hard(x, z) || nearDD(x, z) < 4) continue; const yd = tower(x, z, T.hd[i], 4.6), fx = -T.nx[i] * sd, fz = -T.nz[i] * sd; tvCam(x + fx * 0.5, yd, z + fz * 0.5, fx, fz); crowdPut(CR, x - T.tx[i] * 0.5, yd, z - T.tz[i] * 0.5, fx, fz, {}, 1); }

    /* ---- the town's things (def.scen.pts): street lamps (tall on the streets, lanterns in the park), benches, bus stops, traffic lights, bollards, litter bins,
       the fountain, statues, notice boards, post boxes ---- */
    {
      const PT = hjI16(S.pts), grey = [0.46, 0.48, 0.5], dark = [0.16, 0.17, 0.18];
      for (let k = 0; k < PT.length; k += 3) {
        const t = PT[k], x = PT[k + 1] / 2, z = PT[k + 2] / 2; if (t === 4 || t === 10 || t === 12) continue;
        const n = hjNear(x, z); if ((n.i >= 0 && Math.abs(n.lat) < WA[n.i] + 0.4) || onBld(x, z)) continue;
        const y = hjGround(x, z), g = scen.get(x, z), rot = n.i >= 0 ? T.hd[n.i] : crH(x, z, 5) * TAU, park = G.gt[Math.max(0, gIdx(x, z))] === 10 || hjCanopy(x, z) >= 2;
        if (t === 0) { if (park) { cyl(g, x, y - 0.2, z, 0.07, 4.2, 5, dark); box(g, x, y + 4.0, z, 0.42, 0.55, 0.42, rot, [0.2, 0.2, 0.2], [0.95, 0.93, 0.85]); }
          else { cyl(g, x, y - 0.2, z, 0.1, 8.4, 6, grey, null, 0.07); const fx = n.i >= 0 ? -Math.sign(n.lat) * T.nx[n.i] : 1, fz = n.i >= 0 ? -Math.sign(n.lat) * T.nz[n.i] : 0;
            ouRod(g, [x, y + 8.0, z], [x + fx * 1.4, y + 8.3, z + fz * 1.4], 0.05, grey, 4); box(g, x + fx * 1.6, y + 8.1, z + fz * 1.6, 0.8, 0.18, 0.34, Math.atan2(fz, fx), [0.3, 0.31, 0.33], [0.3, 0.31, 0.33]); }
          CR.avoid(x, z, 0.4); }
        else if (t === 1) { box(g, x, y + 0.4, z, 1.6, 0.08, 0.45, rot, [0.5, 0.34, 0.2]); box(g, x - Math.sin(rot) * 0.2, y + 0.5, z + Math.cos(rot) * 0.2, 1.6, 0.4, 0.06, rot, [0.5, 0.34, 0.2]); for (const u of [-0.7, 0.7]) box(g, x + Math.cos(rot) * u, y, z + Math.sin(rot) * u, 0.06, 0.42, 0.45, rot, dark); CR.avoid(x, z, 0.9); }
        else if (t === 2) { const c = Math.cos(rot), s = Math.sin(rot); box(g, x, y - 0.1, z, 3.2, 2.4, 0.08, rot, [0.55, 0.66, 0.72]); for (const u of [-1.6, 1.6]) box(g, x + c * u, y - 0.1, z + s * u, 0.08, 2.4, 1.3, rot, [0.55, 0.66, 0.72]);
          box(g, x + s * 0.6, y + 2.3, z - c * 0.6, 3.4, 0.12, 1.6, rot, [0.3, 0.31, 0.33]); box(g, x + c * 2.2, y - 0.1, z + s * 2.2, 0.08, 2.9, 0.08, rot, grey); box(g, x + c * 2.2, y + 2.3, z + s * 2.2, 0.06, 0.5, 0.5, rot, [0.12, 0.3, 0.7]); CR.avoid(x, z, 1.8); }
        else if (t === 3) { cyl(g, x, y - 0.2, z, 0.08, 3.6, 5, dark); box(g, x, y + 2.3, z, 0.32, 1.0, 0.28, rot, [0.08, 0.08, 0.08], [0.1, 0.1, 0.1]); box(g, x, y + 2.25, z, 0.46, 1.1, 0.06, rot, [0.9, 0.78, 0.1]); CR.avoid(x, z, 0.4); }
        else if (t === 5) cyl(g, x, y - 0.1, z, 0.1, 1.0, 6, [0.3, 0.3, 0.32], [0.9, 0.9, 0.9]);
        else if (t === 6) { cyl(g, x, y - 0.1, z, 0.04, 0.9, 4, dark); cyl(g, x, y + 0.5, z, 0.22, 0.55, 7, [0.18, 0.34, 0.24], [0.1, 0.1, 0.1]); }
        else if (t === 7) { cyl(g, x, y - 0.2, z, 3.2, 0.65, 14, [0.6, 0.6, 0.58], [0.3, 0.42, 0.48]); cyl(g, x, y + 0.4, z, 0.35, 0.9, 6, [0.6, 0.6, 0.58]); cone(g, x, y + 1.3, z, 0.22, 1.9, 5, [0.78, 0.86, 0.9], [0.93, 0.96, 0.98], 0); exclPush(x, z, 4); CR.avoid(x, z, 3.6); }
        else if (t === 8) { box(g, x, y - 0.2, z, 1.4, 1.5, 1.4, rot, [0.6, 0.59, 0.56]); box(g, x, y + 1.3, z, 0.5, 1.2, 0.35, rot, [0.26, 0.36, 0.3]); ico(g, x, y + 2.7, z, 0.24, 1.1, [0.26, 0.36, 0.3], R, 0.1); exclPush(x, z, 1.6); CR.avoid(x, z, 1.2); }
        else if (t === 9) { for (const u of [-0.55, 0.55]) box(g, x + Math.cos(rot) * u, y - 0.2, z + Math.sin(rot) * u, 0.08, 2.0, 0.08, rot, dark); box(g, x, y + 1.0, z, 1.3, 0.9, 0.08, rot, [0.2, 0.3, 0.5], [0.3, 0.3, 0.3]); CR.avoid(x, z, 0.8); }
        else if (t === 11) { box(g, x, y - 0.1, z, 0.08, 0.9, 0.08, rot, dark); box(g, x, y + 0.8, z, 0.45, 0.55, 0.35, rot, [0.98, 0.56, 0.1]); }
      }
    }

    /* ---- fences, hedges, retaining and garden walls, guard rails (def.scen.lines), not in the stage's corridor ---- */
    {
      const L = hjI16(S.lines);
      for (let k = 0; k < L.length;) { const n = L[k], t = L[k + 1], pts = []; for (let q = 0; q < n; q++) pts.push([L[k + 2 + q * 2] / 2, L[k + 3 + q * 2] / 2]); k += 2 + n * 2;
        const D = dense(pts, 2.2);
        for (let q = 0; q < D.length - 1; q++) { const [ax, az] = D[q], [bx, bz] = D[q + 1], mx = (ax + bx) / 2, mz = (az + bz) / 2, len = Math.hypot(bx - ax, bz - az); if (len < 0.2 || nearDD(mx, mz) < 0.4 || onBld(mx, mz)) continue;
          const ya = hjGround(ax, az), yb = hjGround(bx, bz), y = Math.min(ya, yb), rot = Math.atan2(bz - az, bx - ax), g = scen.get(mx, mz);
          if (t === 0) { box(g, ax, ya - 0.2, az, 0.08, 1.3, 0.08, rot, [0.4, 0.3, 0.2]); for (const h of [0.35, 0.9]) ouRod(g, [ax, ya + h, az], [bx, yb + h, bz], 0.03, [0.52, 0.42, 0.3], 4); }
          else if (t === 1) { const c = vary([0.2, 0.34, 0.13], R, 0.12); box(g, mx, y - 0.2, mz, len + 0.3, 1.5, 0.9, rot, c, [c[0] * 1.15, c[1] * 1.15, c[2] * 1.1], true); }
          else if (t === 2) box(g, mx, y - 0.4, mz, len + 0.05, Math.abs(ya - yb) + 1.3, 0.45, rot, [0.52, 0.51, 0.48], [0.6, 0.59, 0.56], true);
          else if (t === 3) box(g, mx, y - 0.2, mz, len + 0.05, 1.8, 0.35, rot, [0.6, 0.5, 0.42], [0.66, 0.6, 0.54], true);
          else if (t === 4) { box(g, ax, ya - 0.2, az, 0.1, 0.95, 0.1, rot, [0.6, 0.61, 0.63]); ouRod(g, [ax, ya + 0.6, az], [bx, yb + 0.6, bz], 0.09, [0.7, 0.71, 0.73], 4); }
        }
      }
    }

    /* ---- knockable straw bale stacks on the outside of the tight corners (the first hairpin, the corner onto the gravel, the kink at the stadium, the hairpins by the Lyseo school, the school's corner, Norssi) ---- */
    out.propR = 150;
    out.propFloor = propFloorTable(null, (i, side) => VP[side > 0 ? 1 : 0][i]);
    for (const c of T.corners) { if (c.sev < 3 || c.angle < 1.2) continue; const side = -c.dir, sm = (c.i0 + c.i1) / 2 * ds; if (sm < sStart + 30 || sm > sFin + 20) continue;
      for (let d = -7; d <= 7.1; d += 2.8) { const s = sm + d, i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], room = bar - WA[i]; if (room < 2.6) continue;
        const [x, z, hd] = atSf(s, side * (WA[i] + Math.min(2.0, room - 1.1))); if (onBld(x, z)) continue; out.props.push({ kind: 'bstack', x, z, yaw: hd, col: 0, i }); exclPush(x, z, 1.5); } }

    /* ---- the trees: every crown the canopy height model found (def.scen.trees: the ridge's Scots pines, spruces, birches, the lindens and maples of the
       streets and yards) at its measured height, and where the canopy is closed a fill of the same kind (instanced per 128 m chunk) ---- */
    const tMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const TK = {}, TKF = {}; for (const k of [0, 1, 2, 4]) TK[k] = new IChunks(hjTreeGeo(k), tMat, k === 1 ? 128 : 192);   // (the pines, most of the trees, in 128 m chunks: the view and the sun's shadow box draw fewer of them outside)
    TKF[1] = TKF[0] = new IChunks(hjTreeGeo(1, true), tMat, 256); TKF[4] = TKF[2] = new IChunks(hjTreeGeo(4, true), tMat, 256);   // (over 50 m from the road: the plain pine and the plain broadleaf, casting no shadow)
    let nTrees = 0; const tHash = new Map(), THC = 4;   // (the planted trees in 4 m cells: the fill keeps 3.4 m from them)
    const treeOK = (x, z) => { if (onBld(x, z) || onPaved(x, z) || excluded(x, z)) return false; const n = hjNear(x, z); return !(n.i >= 0 && n.dd < 1.2); };
    const plant = (x, z, h, sp, r1, r2) => {
      const y = hjGround(x, z), wid = h * (sp === 0 ? 0.5 + r2 * 0.14 : sp === 1 ? 0.62 + r2 * 0.22 : sp === 2 ? 0.6 + r2 * 0.2 : 0.8 + r2 * 0.25), cv = 0.86 + r1 * 0.24;
      const old = sp === 1 && crH(x, z, 51) < 0.3 ? [1.07, 0.97, 0.86] : [1, 1, 1];   // (some old pines' crowns bronze-tinted, from the position: the seeded draws stay)
      const n = hjNear(x, z); (n.i >= 0 && n.dd < 50 ? TK : TKF)[sp].add(x, y - 0.15, z, r1 * 70, wid, h, [cv * (0.95 + r2 * 0.08) * old[0], cv * old[1], cv * (0.95 + r1 * 0.08) * old[2]]); nTrees++;
      const k = Math.floor(x / THC) + ',' + Math.floor(z / THC); let L = tHash.get(k); if (!L) tHash.set(k, L = []); L.push(x, z); };
    const nearTree = (x, z) => { const cx = Math.floor(x / THC), cz = Math.floor(z / THC); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = tHash.get((cx + a) + ',' + (cz + b)); if (L) for (let q = 0; q < L.length; q += 2) if ((L[q] - x) ** 2 + (L[q + 1] - z) ** 2 < 11.6) return true; } return false; };
    {
      const TR = hjI16(S.trees), RT = rng(8141);
      for (let k = 0; k < TR.length; k += 3) { const x = TR[k] / 2, z = TR[k + 1] / 2, v = TR[k + 2], h = Math.max(4, (v & 255) / 4), sp = v >> 8, r1 = RT(), r2 = RT();
        if (!treeOK(x, z) || !TK[sp]) continue; plant(x, z, sp === 1 ? h * 1.08 : h, sp, r1, r2); }
      // the closed canopy's fill: a tree in a share of its 4 m cells where none was found (taller classes: denser, bigger), the ridge's own mix of kinds
      const C = P.C, PK = [0, 0.26, 0.46, 0.62, 0.7, 0.75], HK = [0, 6.5, 11.5, 16.5, 21.5, 25.5];   // (PK: enough crowns that the canopy's cells are covered)
      for (let j = 0; j < C.nz; j++) for (let i = 0; i < C.nx; i++) { const c = P.can[j * C.nx + i]; if (!c) continue; const r0 = RT(), r1 = RT(), r2 = RT(), r3 = RT();
        if (r0 > PK[c] * dens) continue;
        const x = C.x0 + (i + 0.2 + r1 * 0.6) * C.cell, z = C.z0 + (j + 0.2 + r2 * 0.6) * C.cell; if (nearTree(x, z) || !treeOK(x, z)) continue;
        const gt = G.gt[Math.max(0, gIdx(x, z))], wood = gt === 9 || gt === 10 || gt === 13, sp = wood ? (r3 < 0.7 ? 1 : r3 < 0.84 ? 0 : 2) : (r3 < 0.45 ? 2 : r3 < 0.8 ? 4 : r3 < 0.9 ? 1 : 0);
        plant(x, z, HK[c] * (0.85 + r1 * 0.3), sp, r2, r3); }
    }
    for (const t of Object.values(TK)) t.addTo(root, true); TKF[1].addTo(root, false); TKF[4].addTo(root, false);

    /* ---- low plants (their own chunks, casting no shadow; as Ouninpohja's): grass tufts on the verges and the banks, the esker's late-July flowers (pink
       fireweed along the forest edge, cream yarrow, blue harebells), bilberry, lingonberry and heather on the floor of the pine forest ---- */
    {
      const RV = rng(8161), grassC = [[0.3, 0.37, 0.14], [0.36, 0.4, 0.16], [0.43, 0.43, 0.2], [0.5, 0.47, 0.25]], tipC = [0.62, 0.6, 0.36];
      const tri = (g, a, b, c, ca, cb, cc) => g.triN(a, b, c, UPN, UPN, UPN, ca, cb || ca, cc || ca);
      const blade = (g, x, y, z, h, a, lean, bw, c0, c1) => { const ca = Math.cos(a), sa = Math.sin(a); tri(g, [x - sa * bw, y, z + ca * bw], [x + sa * bw, y, z - ca * bw], [x + ca * h * lean, y + h, z + sa * h * lean], c0, c0, c1); };
      const tuft = (g, x, y, z, h) => { const c0 = grassC[Math.floor(RV() * grassC.length)]; for (let k = 0; k < 3; k++) blade(g, x, y, z, h * (0.7 + RV() * 0.5), RV() * TAU, 0.2 + RV() * 0.3, 0.05 + RV() * 0.04, c0, tipC); };
      const spike = (g, x, y, z, h, wd, col, top) => { const a = RV() * Math.PI, ca = Math.cos(a) * wd, sa = Math.sin(a) * wd, mL = [x - ca, y + h * 0.5, z - sa], mR = [x + ca, y + h * 0.5, z + sa];   // fireweed: a flat spindle
        tri(g, [x, y, z], mR, mL, [0.24, 0.36, 0.13], col, col); tri(g, mL, mR, [x, y + h, z], col, col, top); };
      const umbel = (g, x, y, z, h, col) => { blade(g, x, y, z, h, RV() * TAU, 0.05, 0.04, [0.24, 0.36, 0.13], [0.3, 0.42, 0.16]);   // a stem with a flat head of small flowers
        const r = 0.1 + RV() * 0.06, a0 = RV() * TAU, cy = y + h; for (let k = 0; k < 3; k++) { const a = a0 + k / 3 * TAU, b = a0 + (k + 1) / 3 * TAU; tri(g, [x, cy + 0.03, z], [x + Math.cos(a) * r, cy, z + Math.sin(a) * r], [x + Math.cos(b) * r, cy, z + Math.sin(b) * r], col); } };
      const dome = (g, x, y, z, r, h, c, n) => { const a0 = RV() * TAU, top = [x, y + h, z], cT = [c[0] * 1.25, c[1] * 1.2, c[2] * 1.2];   // a low dome of dwarf shrubs
        for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU, b = a0 + (k + 1) / n * TAU; tri(g, [x + Math.cos(a) * r, y, z + Math.sin(a) * r], [x + Math.cos(b) * r, y, z + Math.sin(b) * r], top, c, c, cT); } };
      const FIRE = [0.82, 0.3, 0.58], FIRET = [0.92, 0.5, 0.7], YARROW = [0.9, 0.88, 0.8], BELL = [0.45, 0.5, 0.86];
      const BIL = [[0.13, 0.26, 0.1], [0.16, 0.3, 0.11], [0.19, 0.31, 0.12]], LING = [0.12, 0.22, 0.09], HEATH = [0.36, 0.26, 0.3], FERN = [0.24, 0.42, 0.14], FERNT = [0.34, 0.5, 0.2];
      const vY = (i, side, o) => { const pr = VP[side > 0 ? 1 : 0][i]; if (o <= pr[0][0]) return T.hy[i];   // the verge ribbon's surface at offset o; beyond it the ground
        for (let k = 0; k < pr.length - 1; k++) if (o <= pr[k + 1][0]) return T.hy[i] + lerp(pr[k][1], pr[k + 1][1], (o - pr[k][0]) / (pr[k + 1][0] - pr[k][0]));
        return hjGround(T.px[i] + T.nx[i] * side * o, T.pz[i] + T.nz[i] * side * o); };
      const ok = (x, z, i) => { if (excluded(x, z) || onPaved(x, z) || onBld(x, z)) return false; const nn = hjNear(x, z); return !(nn.i >= 0 && Math.abs(nn.i - i) * ds > 24 && nn.dd < 0.5); };   // (not on another part of the stage)
      const soft = (x, z) => { const t = G.gt[Math.max(0, gIdx(x, z))]; return t === 0 || t === 9 || t === 10 || t === 13 || t === 255; };   // (lawns, the woods and the park, the yards: not the pitch, the car parks, the squares)
      const sA = Math.max(4, sStart - 30), sB = Math.min(T.len - 6, sFin + 30);
      for (let s = sA; s < sB; s += 0.8) for (const side of [-1, 1]) {
        const i = T.idx(s + (RV() - 0.5) * 0.8), si = side > 0 ? 1 : 0, vt = VT[si][i], bar = side > 0 ? T.br[i] : T.bl[i], at = (o) => [T.px[i] + T.nx[i] * side * o, T.pz[i] + T.nz[i] * side * o];
        const o = WA[i] + 0.5 + RV() * (bar + 1.8 - WA[i] - 0.5), [x, z] = at(o), r1 = RV(), r2 = RV(), r3 = RV();
        if ((vt !== 2 && vt !== 3 && vt !== 5) || !ok(x, z, i) || !soft(x, z)) continue;
        const g = veg.get(x, z), y = vY(i, side, o);
        tuft(g, x, y, z, 0.35 + r1 * 0.45);
        if (r2 < 0.12) { const n = 2 + Math.floor(RV() * 3); for (let q = 0; q < n; q++) umbel(g, x + (RV() - 0.5) * 0.7, y - 0.04, z + (RV() - 0.5) * 0.7, 0.3 + RV() * 0.25, r3 < 0.6 ? YARROW : BELL); }
        const band = P.n4(s * 0.3 + side * 211 + 40, 23);   // fireweed in bands along the forest's edge, just behind the barrier
        if (band > 0.55) { const oq = bar + 1.2 + RV() * 2.8, [fx, fz] = at(oq); if (ok(fx, fz, i) && soft(fx, fz)) { const fy = vY(i, side, oq), n = 2 + Math.floor(RV() * 4 * sstep(0.55, 0.72, band));
          for (let q = 0; q < n; q++) spike(g, fx + (RV() - 0.5) * 1.3, fy - 0.05, fz + (RV() - 0.5) * 1.3, 1.0 + RV() * 0.5, 0.1, FIRE, FIRET); } }
      }
      for (let s = sA; s < sB; s += 0.9) for (const side of [-1, 1]) {   // the forest floor beside the stage: mats of bilberry and lingonberry, heather on the sandy slopes, a fern here and there
        const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], o = bar + 2.2 + Math.pow(RV(), 1.4) * 16, x = T.px[i] + T.nx[i] * side * o + (RV() - 0.5) * 2, z = T.pz[i] + T.nz[i] * side * o + (RV() - 0.5) * 2, r1 = RV();
        const k = gIdx(x, z), t = k >= 0 ? G.gt[k] : 255; if (k < 0 || !(t === 9 || t === 10 || (t === 0 && hjCanopy(x, z) >= 1)) || !ok(x, z, i) || hjNear(x, z).dd < 1.8) continue;
        const y = hjGround(x, z) - 0.03, g = veg.get(x, z), sandy = G.dd[k] > 0 && P.n1(x * 1.3 + 80, z * 1.3 - 40) > 0.62;
        if (sandy || r1 < 0.18) dome(g, x, y, z, 0.45 + RV() * 0.45, 0.2 + RV() * 0.14, vary(HEATH, RV, 0.12), 6);
        else if (r1 < 0.62) dome(g, x, y, z, 0.5 + RV() * 0.55, 0.25 + RV() * 0.2, BIL[Math.floor(RV() * 3)], 7);
        else if (r1 < 0.9) dome(g, x, y, z, 0.4 + RV() * 0.35, 0.15 + RV() * 0.1, LING, 6);
        else { const a0 = RV() * TAU, L = 0.45 + RV() * 0.35;   // a fern: five fronds arching out
          for (let q = 0; q < 5; q++) { const a = a0 + q / 5 * TAU + (RV() - 0.5) * 0.4, ca = Math.cos(a), sa = Math.sin(a); tri(g, [x - sa * 0.07, y + 0.05, z + ca * 0.07], [x + sa * 0.07, y + 0.05, z - ca * 0.07], [x + ca * L, y + L * 0.45, z + sa * L], FERN, FERN, FERNT); } }
      }
    }

    /* ---- the puddles of a stage in the rain (T.puddles: only on the gravel), as Ouninpohja's ---- */
    if (T.puddles.length) {
      const g = new GB(), PP = (s, d) => { const f = s / ds, i = clamp(Math.floor(f), 0, N - 2), t = f - i, j = i + 1, nx = lerp(T.nx[i], T.nx[j], t), nz = lerp(T.nz[i], T.nz[j], t);
        return [lerp(T.px[i], T.px[j], t) + nx * d, lerp(T.hy[i], T.hy[j], t) + 0.035, lerp(T.pz[i], T.pz[j], t) + nz * d]; };
      const SKY = [0.55, 0.59, 0.63], MID = [0.38, 0.4, 0.42], RIM = [0.3, 0.27, 0.22], n = 14, RP = rng(8151);
      for (const [s, d, hl, hw] of T.puddles) {
        const c = PP(s, d), below = [c[0], c[1] - 5, c[2]], ph = RP() * TAU, wob = [];
        for (let k = 0; k < n; k++) { const a = k / n * TAU; wob.push([Math.cos(a), Math.sin(a), 0.84 + 0.16 * Math.sin(a * 3 + ph) * Math.cos(a * 2 - ph)]); }
        const ring = (f) => wob.map(([cx, sz, ww]) => PP(s + cx * hl * ww * f, d + sz * hw * ww * f)), I = ring(0.62), O = ring(1);
        for (let k = 0; k < n; k++) { const m = (k + 1) % n; g.triO(c, I[k], I[m], SKY, below); g.triO(I[k], O[k], O[m], MID, below, RIM, RIM); g.triO(I[k], O[m], I[m], MID, below, RIM, MID); }
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true })); m.matrixAutoUpdate = false; m.visible = false; m.name = 'puddles'; root.add(m);
      out.dyn.wet = { puddles: m, road: kMat, ground: gMat, base: { sh: kMat.shininess, sp: kMat.specular.getHex() } };
    }

    /* ---- finish the meshes, the sky: the TV helicopter with the car (as on Ouninpohja) ---- */
    bch.addTo(root, fMat, true, true);
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup); scen.addTo(sceneryGroup, matV, true, true);
    fGB.addTo(root, new THREE.MeshLambertMaterial({ map: hjBarTex(), vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), true, true);
    spG.addTo(root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: hjAtlas(T.cpS.map(kmS)), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    { const vg = new THREE.Group(); vg.name = 'plants'; root.add(vg); veg.addTo(vg, ouVegMat(), false, true); }
    { // every spectator's long evening shadow (the sun 18 degrees up from the west: THEMES.harju.sunOff), a soft dark band in the crowd's multiply strip
      const SX = 0.9968, SZ = 0.0797, N0 = [0.7, 0.7, 0.73], N1 = [0.84, 0.84, 0.86];
      const surfY = (x, z) => { const n = hjNear(x, z); if (n.i < 0) return hjGround(x, z); const i = n.i, o = Math.abs(n.lat); if (o <= WA[i]) return T.hy[i] + 0.02;   // (the top surface: the road, the sidewalk, the verge, the ground)
        const pr = VP[n.lat > 0 ? 1 : 0][i]; if (o >= pr[pr.length - 1][0]) return hjGround(x, z);
        for (let k = 0; k < pr.length - 1; k++) if (o <= pr[k + 1][0]) return T.hy[i] + lerp(pr[k][1], pr[k + 1][1], (o - pr[k][0]) / (pr[k + 1][0] - pr[k][0]));
        return hjGround(x, z); };
      for (const L of CR.ppl.map.values()) for (let q = 0; q < L.length; q += 9) {
        const x = L[q], y = L[q + 1], z = L[q + 2], len = 5.2 * L[q + 5], fx = x + SX * len, fz = z + SZ * len; if (Math.abs(y - hjGround(x, z)) > 0.8) continue;   // (not the ones up on the tower or a TV scaffold)
        const y0 = Math.max(y, surfY(x, z)) + 0.06, y1 = surfY(fx, fz) + 0.06, w0 = 0.26, w1 = 0.16, a = [x - SZ * w0, y0, z + SX * w0], b = [x + SZ * w0, y0, z - SX * w0];
        CR.strip.get(x, z).quadUp(a, b, [fx + SZ * w1, y1, fz - SX * w1], [fx - SZ * w1, y1, fz + SX * w1], [N0, N0, N1, N1]); }
    }
    crowdFinish(CR, root, out);
    pkSky({ root, tex, out, sStart, gH: hjGround, far: true });
    out.stats = { trees: nTrees, tiles: G.ntx * G.ntz, buildings: nBld, bales: bales.length, cars: nCars, stalls: nStalls, loos: nLoos };   // (read by the tests)
    return out;
  }

  Object.assign(API, { hjB64, hjFV, hjFacadeTex, hjI16, hjTreeGeo });   // (what World and the other worlds use of this one)
  Object.defineProperties(API, { HJ: { get: () => HJ, set: (v) => { HJ = v; } } });
  World.ext.harju = (scene, tex, opts) => buildHarju(scene, tex, opts);
})();
