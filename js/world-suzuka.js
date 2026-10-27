/* =========================================================================
   WORLD — Suzuka (theme 'suzuka'): its own builder (World.ext.suzuka), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NR_A64, RB, TAU, addShore, atS, atSf, box, clamp, cone, crAt, crowdCtx, crowdFinish, crowdRun, crowdUV, cyl, gable, ico,
    inPoly, lerp, mergeBands, nearest, nrChamfer, polyDist, propFloorTable, rng, roadsideProps, shoreBand, sstep, valueNoise2, vary, waterMat,
    waterline
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= SUZUKA (theme 'suzuka'): the figure of eight on its real ground =================
     The Nordschleife's corridor way: the terrain is def.dem (Copernicus GLO-30, trees and buildings taken out) blended into the road heights
     near the track, def.lc the land cover (grass, forest, scrub, car parks). The crossover (Track.cross): the back straight runs over a
     concrete bridge, the lower road (double right -> Hairpin) between the retaining walls of its underpass. Inside the lower road's walls the ground
     follows the lower road (also under the deck), outside them the lower road's samples drop out of the blend, so the walls hold up the back
     straight's embankment. The bridge (deck, parapets, the road on it) fades out while the followed car drives underneath. The stands and the
     pit building are their real outlines cut along the track (def.stands, def.pitBld: [metres after the start line, front, back offset]), the
     other buildings their footprints (def.bld); the Ferris wheel in Motopia turns. */
  const SZC = 8, SZT = 32, SZHC = 32;          // terrain cell (m), tile size (cells), road-sample hash cell (m)
  let SZ = null;                               // per-build data: sample hash, land cover, terrain grids, ponds, the crossover
  const SZN = { i: -1, d: 1e9, dd: 1e9, lat: 0, h: 0, hn: 0 };   // szNear: nearest sample, distance, distance beyond the barrier, blended and exact road height
  const SZCOL = [0, 0, 0];
  const szCd = (i, f) => { const N = T.N, d = Math.abs(i - f) % N; return Math.min(d, N - d) * T.ds; };   // metres along the lap between sample i and sample position f
  function szDem(x, z) {   // terrain height (bilinear on the 32 m grid)
    const P = SZ, D = P.D, gx = clamp((x - D.x0) / D.cell, 0, D.nx - 1.001), gz = clamp((z - D.z0) / D.cell, 0, D.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = D.nx, a = P.dem;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function szPrep() {
    const def = T.def, N = T.N, M = 420;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    x0 -= M; x1 += M; z0 -= M; z1 += M;
    const P = SZ = { x0, z0, x1, z1 };
    P.cx0 = Math.floor(x0 / SZHC); P.cz0 = Math.floor(z0 / SZHC); P.ncx = Math.floor(x1 / SZHC) - P.cx0 + 1; P.ncz = Math.floor(z1 / SZHC) - P.cz0 + 1; P.cells = new Array(P.ncx * P.ncz);
    for (let i = 0; i < N; i += 2) { const k = (Math.floor(T.pz[i] / SZHC) - P.cz0) * P.ncx + Math.floor(T.px[i] / SZHC) - P.cx0; (P.cells[k] || (P.cells[k] = [])).push(i); }
    // land cover (0 grass, 1 forest, 2 scrub, 3 car park; the Nordschleife's run-length code) and the terrain (0.5 m steps)
    const L = def.lc, lc = new Uint8Array(L.nx * L.nz);
    for (let p = 0, k = 0; k < lc.length;) { const v = NR_A64.indexOf(L.rle[p++]); let n = (v & 15) + 1; if ((v & 15) === 15) { let e; do { e = NR_A64.indexOf(L.rle[p++]); n += e; } while (e === 63); } lc.fill(v >> 4, k, Math.min(lc.length, k + n)); k += n; }
    P.lc = lc; P.L = L;
    const D = def.dem, bin = atob(D.b64), dem = new Float32Array(D.nx * D.nz);
    for (let k = 0; k < dem.length; k++) dem[k] = D.lo + bin.charCodeAt(k) * D.step;
    P.dem = dem; P.D = D;
    // distance to the road centre line on a 16 m grid
    const dc = 16, dnx = Math.ceil((x1 - x0) / dc) + 1, dnz = Math.ceil((z1 - z0) / dc) + 1, dist = new Float32Array(dnx * dnz).fill(1e9);
    for (let i = 0; i < N; i++) { const a = Math.round((T.px[i] - x0) / dc), b = Math.round((T.pz[i] - z0) / dc); dist[b * dnx + a] = 0; }
    nrChamfer(dist, dnx, dnz, dc);
    Object.assign(P, { dc, dnx, dnz, dist });
    P.n1 = valueNoise2(501, 90); P.n2 = valueNoise2(502, 30); P.n3 = valueNoise2(503, 55); P.n4 = valueNoise2(504, 14); P.n5 = valueNoise2(505, 160);
    const bb = (poly) => { let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9; for (const [x, z] of poly) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z); } return { poly, bx0, bx1, bz0, bz1 }; };
    P.inBB = (o, x, z, m) => x > o.bx0 - m && x < o.bx1 + m && z > o.bz0 - m && z < o.bz1 + m;
    // the crossover: the lower leg's wall zone (its samples within loR of the crossing) and the frame of the lower leg there
    P.X = T.cross.map(c => { const il = Math.round(c.lo) % N; return { c, il, x: c.x, z: c.z, loR: c.loZ + 24, tlx: T.tx[il], tlz: T.tz[il] }; });
    // ponds: the water a little below the lowest ground on the shore (the ground as it would be without them)
    P.ponds = []; P.ponds = (def.ponds || []).map(poly => { const o = bb(poly); let y = 1e9; for (const [x, z] of poly) y = Math.min(y, szH(x, z)); o.y = y - 0.35; return o; });
    // terrain height grid (filled lazily, NaN = not computed yet) and the distance beyond the nearest barrier at each vertex
    const G = P.G = { x0, z0 }; G.ntx = Math.ceil((x1 - x0) / (SZC * SZT)); G.ntz = Math.ceil((z1 - z0) / (SZC * SZT)); G.nx = G.ntx * SZT + 1; G.nz = G.ntz * SZT + 1;
    G.h = new Float32Array(G.nx * G.nz).fill(NaN); G.dd = new Float32Array(G.nx * G.nz); G.on = new Uint8Array(G.ntx * G.ntz);
    // a finer terrain patch (2 m cells) round every crossover, on whole cells of the coarse grid: there the lower road's cutting meets the
    // back straight's embankment right behind the walls (the 8 m cells would slope up in front of them)
    P.pat = P.X.map(X => { const Rr = 64, a0 = Math.floor((X.x - Rr - G.x0) / SZC), a1 = Math.ceil((X.x + Rr - G.x0) / SZC), b0 = Math.floor((X.z - Rr - G.z0) / SZC), b1 = Math.ceil((X.z + Rr - G.z0) / SZC);
      const px0 = G.x0 + a0 * SZC, pz0 = G.z0 + b0 * SZC, px1 = G.x0 + a1 * SZC, pz1 = G.z0 + b1 * SZC, nx = (px1 - px0) / 2 + 1, nz = (pz1 - pz0) / 2 + 1;
      return { a0, a1, b0, b1, x0: px0, z0: pz0, x1: px1, z1: pz1, nx, nz, h: new Float32Array(nx * nz).fill(NaN), dd: new Float32Array(nx * nz) }; });
  }
  function szDist(x, z) {   // distance to the road centre line (bilinear on the chamfer grid)
    const P = SZ, gx = clamp((x - P.x0) / P.dc, 0, P.dnx - 1.001), gz = clamp((z - P.z0) / P.dc, 0, P.dnz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = P.dnx, a = P.dist;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function szLC(x, z) { const L = SZ.L, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell); return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? 0 : SZ.lc[j * L.nx + i]; }
  function szLCf(x, z, c) {   // share of land cover class c around (x, z) (bilinear over the cell centres)
    const L = SZ.L, lc = SZ.lc, fx = (x - L.x0) / L.cell - 0.5, fz = (z - L.z0) / L.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const at = (a, b) => (a < 0 || b < 0 || a >= L.nx || b >= L.nz ? 0 : lc[b * L.nx + a] === c ? 1 : 0);
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v;
  }
  function szNear(x, z) {   // Shepard blend of the road heights around (x, z) (as nrNear), the crossover as described above
    const P = SZ, cx = Math.floor(x / SZHC) - P.cx0, cz = Math.floor(z / SZHC) - P.cz0, ds = T.ds, N = T.N;
    let lx = null, lin = false;
    for (const X of P.X) {
      const dx = x - X.x, dz = z - X.z; if (dx * dx + dz * dz > 160 * 160) continue; lx = X;
      const al = dx * X.tlx + dz * X.tlz; if (Math.abs(al) > X.loR) continue;
      const j = (((X.il + Math.round(al / ds)) % N) + N) % N, lat = (x - T.px[j]) * T.nx[j] + (z - T.pz[j]) * T.nz[j];
      lin = Math.abs(lat) < (lat > 0 ? T.br[j] : T.bl[j]) + 3;   // (the walls, their cap and a patch cell behind: the bank rises only behind them)
    }
    let ws = 0, hs = 0, bd = 1e9, bi = -1, bl = 0, ba = 0, bdd = 1e9;
    for (let b = Math.max(0, cz - 2); b <= Math.min(P.ncz - 1, cz + 2); b++) for (let a = Math.max(0, cx - 2); a <= Math.min(P.ncx - 1, cx + 2); a++) {
      const Lc = P.cells[b * P.ncx + a]; if (!Lc) continue;
      for (let q = 0; q < Lc.length; q++) {
        const i = Lc[q]; let f = 1;
        if (lx) { const dl = szCd(i, lx.c.lo); if (lin) { if (dl > lx.loR + 16) continue; } else if (dl < lx.loR + 16) { f = sstep(lx.loR - 12, lx.loR + 16, dl); if (f < 0.5) continue; } }
        const dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], lat = dx * T.nx[i] + dz * T.nz[i], ex = Math.max(0, Math.abs(al) - ds), d = Math.sqrt(lat * lat + ex * ex);
        if (d >= 64) continue;
        const dd = Math.max(0, d - (lat > 0 ? T.br[i] : T.bl[i])), k = 1 / (dd + 1.5), wq = k * k * k * k * (d < 48 ? 1 : sstep(64, 48, d)) * f;
        ws += wq; hs += wq * T.hy[i];
        if (d < bd) { bd = d; bi = i; bl = lat; ba = al; }
        if (dd < bdd) bdd = dd;
      }
    }
    SZN.i = bi; SZN.d = bd; SZN.dd = bdd; SZN.lat = bl;
    if (bi < 0) return SZN;
    SZN.h = hs / ws;
    const f = bi + ba / ds, fi = Math.floor(f), i0 = ((fi % N) + N) % N, i1 = (i0 + 1) % N; SZN.hn = T.hy[i0] + (T.hy[i1] - T.hy[i0]) * (f - fi);
    return SZN;
  }
  function szFar(x, z) { const P = SZ; return szDem(x, z) + (P.n1(x, z) - 0.5) * 2.4 + (P.n2(x, z) - 0.5) * 0.8; }   // the land away from the road
  function szPond(x, z) { for (const p of SZ.ponds) if (SZ.inBB(p, x, z, 1) && inPoly(p.poly, x, z)) return p; return null; }
  function szH(x, z) {   // terrain height
    const n = szNear(x, z), i = n.i, dd = n.dd, hn = n.hn; let h;
    if (i < 0) h = szFar(x, z);
    else { const hr = lerp(hn, n.h, sstep(0, 6, dd)) - 0.3; h = dd <= 1 ? hr : lerp(hr, szFar(x, z), sstep(2, 70, dd)); }
    if (i >= 0 && dd < 6) h = Math.min(h, hn - 0.3 + 0.12 * dd * dd);   // never above the road inside the barriers, only a gentle rise right behind them
    const p = szPond(x, z); if (p) h = Math.min(h, p.y - 0.3 - 1.4 * sstep(0, 9, polyDist(p.poly, x, z)));   // a pond: the bed under the water
    SZN.dd = i >= 0 ? dd : 999;
    return h;
  }
  function szGH(i, j) {   // terrain height at grid vertex (i, j), computed once
    const G = SZ.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = szH(G.x0 + i * SZC, G.z0 + j * SZC); G.dd[k] = SZN.dd; }
    return h;
  }
  function szPH(p, i, j) {   // height at vertex (i, j) of a fine patch, computed once; its rim lies on the coarse grid's edges and takes their surface (no cracks)
    i = clamp(i, 0, p.nx - 1); j = clamp(j, 0, p.nz - 1); const k = j * p.nx + i; let h = p.h[k];
    if (h !== h) { const x = p.x0 + i * 2, z = p.z0 + j * 2; h = szH(x, z); p.dd[k] = SZN.dd; if (i === 0 || j === 0 || i === p.nx - 1 || j === p.nz - 1) h = szGroundC(x, z); p.h[k] = h; }
    return h;
  }
  function szGround(x, z) {   // height of the terrain surface: a fine patch round the crossover, else the tiles (the same two triangles per cell as the meshes)
    for (const p of SZ.pat) if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) {
      const gx = clamp((x - p.x0) / 2, 0, p.nx - 1.001), gz = clamp((z - p.z0) / 2, 0, p.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
      if (u + v <= 1) { const a = szPH(p, i, j); return a + u * (szPH(p, i + 1, j) - a) + v * (szPH(p, i, j + 1) - a); }
      const d = szPH(p, i + 1, j + 1); return d + (1 - u) * (szPH(p, i, j + 1) - d) + (1 - v) * (szPH(p, i + 1, j) - d);
    }
    return szGroundC(x, z);
  }
  function szGroundC(x, z) {   // height of the coarse terrain tiles' surface
    const G = SZ.G, gx = clamp((x - G.x0) / SZC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / SZC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = szGH(i, j); return a + u * (szGH(i + 1, j) - a) + v * (szGH(i, j + 1) - a); }
    const d = szGH(i + 1, j + 1); return d + (1 - u) * (szGH(i, j + 1) - d) + (1 - v) * (szGH(i + 1, j) - d);
  }
  function szCol(x, z, ny, dd) {   // ground colour (multiplies the grass map): spring lawns, the forest floor, scrub, tarmac car parks, bare earth on steep banks, a mown verge
    const P = SZ, m = P.n3(x, z), fo = szLCf(x, z, 1), sc = szLCf(x, z, 2), pk = szLCf(x, z, 3);
    let r = 1.0 + (m - 0.5) * 0.2 + (P.n4(x, z) - 0.5) * 0.1, g = 1.04 + (m - 0.5) * 0.14, b = 0.9 + (m - 0.5) * 0.18;
    const dry = sstep(0.6, 0.85, P.n5(x, z)) * 0.3; r += dry * 0.45; g += dry * 0.08; b -= dry * 0.1;   // some drier patches
    r = lerp(r, 0.52 + m * 0.1, fo); g = lerp(g, 0.52 + m * 0.08, fo); b = lerp(b, 0.42 + m * 0.06, fo);   // needles and leaf litter under the trees
    r = lerp(r, 0.82, sc * 0.6); g = lerp(g, 0.8, sc * 0.6); b = lerp(b, 0.62, sc * 0.6);
    r = lerp(r, 1.2, pk * 0.92); g = lerp(g, 0.74, pk * 0.92); b = lerp(b, 1.78, pk * 0.92);   // tarmac car parks (the green map turned grey)
    const st = sstep(0.86, 0.66, ny) * 0.8; r = lerp(r, 1.08, st); g = lerp(g, 0.82, st); b = lerp(b, 0.62, st);   // bare earth on steep banks
    if (dd < 5) { const t = sstep(5, 0.5, dd); r = lerp(r, 1.0, t); g = lerp(g, 1.07, t); b = lerp(b, 0.92, t); }   // mown verge right behind the barriers
    SZCOL[0] = r; SZCOL[1] = g; SZCOL[2] = b; return SZCOL;
  }
  function szGCol(x, z) {   // the terrain mesh's vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in szTileGeo)
    const G = SZ.G, gx = clamp((x - G.x0) / SZC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / SZC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b;
      const nx = (szGH(ii + 1, jj) - szGH(ii - 1, jj)) / (2 * SZC), nz = (szGH(ii, jj + 1) - szGH(ii, jj - 1)) / (2 * SZC), c = szCol(G.x0 + ii * SZC, G.z0 + jj * SZC, 1 / Math.hypot(nx, 1, nz), G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function szTileOn(ti, tj) {   // 0: none, 1: full tile (8 m cells), 2: coarse outer ring (32 m cells, in the haze)
    const G = SZ.G, L = SZC * SZT, x = G.x0 + (ti + 0.5) * L, z = G.z0 + (tj + 0.5) * L, d = szDist(x, z);
    return d < 200 + L * 0.71 ? 1 : d < 360 + L * 0.71 ? 2 : 0;
  }
  function szTileGeo(ti, tj, st) {   // one 256 m terrain tile (every st-th grid vertex): indexed, normals from the shared grid (no seams between tiles)
    const G = SZ.G, m = SZT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), i0 = ti * SZT, j0 = tj * SZT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * SZC, z = G.z0 + j * SZC, h = szGH(i, j);
      let nx = -(szGH(i + st, j) - szGH(i - st, j)) / (2 * SZC * st), nz = -(szGH(i, j + st) - szGH(i, j - st)) / (2 * SZC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = szCol(x, z, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 14; uv[k * 2 + 1] = -z / 14;
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    const hole = (ci, cj) => { for (const p of SZ.pat) if (ci + st > p.a0 && ci < p.a1 && cj + st > p.b0 && cj < p.b1) return true; return false; };   // (the fine patch's cells)
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { if (hole(i0 + a * st, j0 + b * st)) continue; const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx.subarray(0, k), 1));
    g.computeBoundingSphere(); return g;
  }
  function szPatchGeo(p) {   // the fine patch's mesh (indexed, 2 m cells)
    const n = p.nx * p.nz, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    for (let j = 0, k = 0; j < p.nz; j++) for (let i = 0; i < p.nx; i++, k++) {
      const x = p.x0 + i * 2, z = p.z0 + j * 2, h = szPH(p, i, j);
      let nx = -(szPH(p, i + 1, j) - szPH(p, i - 1, j)) / 4, nz = -(szPH(p, i, j + 1) - szPH(p, i, j - 1)) / 4, l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = szCol(x, z, ny, p.dd[k]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2]; uv[k * 2] = x / 14; uv[k * 2 + 1] = -z / 14;
    }
    const idx = new Uint16Array((p.nx - 1) * (p.nz - 1) * 6); let k = 0;
    for (let b = 0; b < p.nz - 1; b++) for (let a = 0; a < p.nx - 1; a++) { const q0 = b * p.nx + a, q1 = q0 + 1, c = q0 + p.nx, d = c + 1; idx[k++] = q0; idx[k++] = c; idx[k++] = q1; idx[k++] = q1; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }
  function szTreeGeo(kind) {   // unit trees (height 1): 0 Japanese cedar (sugi), 1 broadleaf, 2 bush, 3 cherry in blossom
    const g = new GB(), R = rng(710 + kind);
    if (kind === 0) {   // sugi: a straight trunk, a tall narrow cone in tiers, dark blue-green
      cone(g, 0, -0.02, 0, 0.03, 0.34, 4, [0.36, 0.24, 0.16], null, 0);
      const col = [0.13, 0.24, 0.14], tip = [0.2, 0.33, 0.19];
      cone(g, 0, 0.16, 0, 0.21, 0.4, 7, col, tip, 0.2); cone(g, 0, 0.38, 0, 0.16, 0.36, 7, [col[0] * 1.06, col[1] * 1.06, col[2] * 1.06], tip, 0.7); cone(g, 0, 0.6, 0, 0.1, 0.4, 6, col, tip, 1.2);
    } else if (kind === 1) {   // broadleaf (oak, camphor): a round crown of two lumps
      cyl(g, 0, -0.02, 0, 0.04, 0.42, 4, [0.4, 0.34, 0.28], null, 0.03);
      ico(g, 0, 0.62, 0, 0.34, 0.9, [0.22, 0.38, 0.13], R, 0.3); ico(g, 0.12, 0.74, 0.08, 0.2, 0.8, [0.25, 0.42, 0.15], R, 0.3);
    } else if (kind === 2) {   // bush
      ico(g, 0, 0.35, 0, 0.45, 0.8, [0.26, 0.4, 0.16], R, 0.3);
    } else {   // cherry in full blossom (the Japanese Grand Prix is in April): dark trunk, a wide pale pink crown
      cyl(g, 0, -0.02, 0, 0.045, 0.4, 5, [0.3, 0.22, 0.2], null, 0.03);
      ico(g, 0, 0.6, 0, 0.42, 0.72, [1.0, 0.76, 0.84], R, 0.35); ico(g, 0.18, 0.72, -0.1, 0.24, 0.7, [1.0, 0.82, 0.88], R, 0.3);
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function szAtlas(names) {   // text boards (4 x 16 cells of 256 x 64): the corner names, braking boards, banners
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 56, 256, 8); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 33, 240); };
    names.forEach((n, k) => cell(k, '#f4f4f0', '#d3232a', n.toUpperCase(), n.length > 13 ? 28 : 34, '#d3232a'));
    const B = names.length;
    for (let k = 0; k < 3; k++) cell(B + k, '#f4f4f0', '#111', String((k + 1) * 100), 44, '#111');   // braking boards 100 / 200 / 300
    cell(B + 3, '#16181c', '#fff', 'START · FINISH', 34); cell(B + 4, '#d3232a', '#fff', 'SUZUKA', 44); cell(B + 5, '#f4f4f0', '#d3232a', 'SUZUKA', 44); cell(B + 6, '#1a3f8f', '#fff', 'JAPAN', 42);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  // knockable props (as the Nordschleife's): posts every 60-80 m, tyre walls at the corner exits; not on the start / finish straight, the
  // crossover (its walls and the bridge), nor on a sloping verge. The props stand on the verge's own height. Drawn out to 150 m.
  function suzukaProps(out, skip) {
    out.propR = 150;
    const w = T.w;
    out.propFloor = propFloorTable(null, (i, side) => SZ.verge(i, side));
    return out.propStats = roadsideProps(out.props, { post: [60, 80], postEdge: [1.8, 2.4], exits: 12, apexes: 2, wallEdge: [1.9, 2.5], stacks: [5, 7], rows2: 0.3,
      floor: out.propFloor, skip });
  }

  function szWheel(W, t) {   // the Ferris wheel at time t: the wheel turns, every gondola hangs level under its pin
    const a = t * W.w; W.spin.rotation.z = a;
    for (let k = 0; k < W.n; k++) { const b = a + k / W.n * TAU, e = Math.cos(b) * W.r; W.m.makeTranslation(W.x + W.ux * e, W.y + Math.sin(b) * W.r, W.z + W.uz * e); W.gond.setMatrixAt(k, W.m); }
    W.gond.instanceMatrix.needsUpdate = true;
  }

  function buildSuzuka(scene, tex, opts) {
    const R = rng(5117), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: szGround, camFloor: szGround, props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    szPrep();
    const P = SZ, G = P.G;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 64;   // tree exclusion circles (buildings, stands, crowds), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const exclRect = [];   // oriented building footprints (the trees keep out of them)
    const inRects = (x, z) => { for (const r of exclRect) { const dx = x - r.x, dz = z - r.z; if (Math.abs(dx * r.c + dz * r.s) < r.hl && Math.abs(-dx * r.s + dz * r.c) < r.hw) return true; } return false; };
    const dS = (s) => { let d = s - sStart; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line along the lap
    const sAt = (d) => ((sStart + d) % T.len + T.len) % T.len;
    const nameD = (n) => { const f = T.names.find(q => q.n === n); return f ? f.d : null; };
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };

    /* ---- the crossover: which samples lie on the bridge, in its approach walls and in the underpass ---- */
    const XC = T.cross.map(c => ({ c, up: c.up, lo: c.lo, il: Math.round(c.lo) % N, iu: Math.round(c.up) % N }));
    const onDeck = (i) => { for (const X of XC) if (szCd(i, X.up) <= 20) return X; return null; };     // the road on the bridge (fades while you drive under it)
    const upWall = (i) => { for (const X of XC) if (szCd(i, X.up) <= X.c.upZ + 12) return X; return null; };   // the back straight between concrete parapets
    const loWall = (i) => { for (const X of XC) if (szCd(i, X.lo) <= X.c.loZ + 14) return X; return null; };   // the lower road between the retaining walls
    const nearX = (i, m) => { for (const X of XC) if (szCd(i, X.up) < m || szCd(i, X.lo) < m) return true; return false; };

    /* ---- terrain tiles ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: tex.grass, vertexColors: true });
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = szTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1;
        const m = new THREE.Mesh(szTileGeo(ti, tj, on === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++;
      }
      for (const p of P.pat) { const m = new THREE.Mesh(szPatchGeo(p), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); }
    }

    /* ---- road: asphalt, white edge lines, red / white kerbs, grass verges out past the barriers, gravel traps (256 m chunks); the road on
       the bridge in its own meshes with their own materials (they fade while the followed car drives underneath) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true }), sMat = new THREE.MeshLambertMaterial({ map: tex.sand, vertexColors: true });
    const fadeMats = [];
    const bridgeMat = (m) => { const b = m.clone(); fadeMats.push(b); return b; };
    const aMatB = bridgeMat(aMat), lMatB = bridgeMat(lMat), dMatB = bridgeMat(matV);
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const kerb = [new Uint8Array(N), new Uint8Array(N)];   // kerbs: inside of every bend, outside only in the tighter ones
    for (let i = 0; i < N; i++) if (T.curb[i] && !loWall(i) && !upWall(i)) { const k = T.k[i]; for (const side of [-1, 1]) { const inside = side * k > 0; if (inside || Math.abs(k) > 1 / 60) kerb[side > 0 ? 1 : 0][i] = 1; } }
    // the verge's cross-section beyond the road edge: [offset, height above the road], lifted onto the ground where it rises; flat on the
    // bridge (out to its edge) and between the underpass walls
    SZ.verge = (i, side) => {
      const bar = side > 0 ? T.br[i] : T.bl[i];
      if (onDeck(i)) return [[w, 0], [w + 1.2, 0], [bar - 0.4, 0], [bar + 0.3, 0], [bar + 0.6, 0]];
      if (loWall(i) || upWall(i)) return [[w, 0], [w + 1.2, -0.03], [bar - 0.4, -0.06], [bar, -0.08], [bar + 0.12, -0.08]];
      const y = T.hy[i], lift = (o, h) => { const q = side * o, g = szGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y; return [o, Math.max(h, g)]; };
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
    };
    const vY = (vr, o) => { let m = 0; while (m < vr.length - 2 && vr[m + 1][0] < o) m++; const a = vr[m], b = vr[m + 1]; return a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); };
    const gravW = (i, side) => { const gv = side > 0 ? T.gravR : T.gravL; let k = 0; for (let d = -3; d <= 3; d++) k += gv[(i + d + N) % N]; return k / 7; };   // gravel trap width share (tapers in and out)
    const CH = 128, offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;
    const shade = (i, o) => { const rl = T.rl[i]; let k = 0.86 - 0.15 * Math.exp(-((o - rl) * (o - rl)) / 5); if (Math.abs(o) > w * 0.92) k -= 0.03; return [k, k, k * 1.02]; };
    const vg = [0.97, 1.05, 0.92], conc = [0.74, 0.74, 0.72];
    // the verge inside the barriers mown in stripes along the track (as at the Red Bull Ring): MOW_W m bands, light and dark in turn from 1.2 m
    // past the edge (the dark ones a deeper green); each band's edge twice in the cross-section (a sharp change of colour), the quads of no width
    // left out. (The lawns out past the barriers: striped at the end, once the stands and buildings stand.)
    const MOW_D = [0.22, 0.15, 0.18], vgD = vg.map((v, k) => v * (1 - MOW_D[k])), MOW_W = 3, MOW_N = 6, MOW_B = 5, MOW_O = 3.5, bandC = (b) => (b % 2 ? vg : vgD);
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true), gl = new RB(), gv = new RB(true), gk = new RB(true), gs = new RB(true), grB = new RB(true), glB = new RB(), gvB = new RB();
      let pr = -1, pl = -1, pv = [-1, -1], pk = [-1, -1], ps = [-1, -1], prB = -1, plB = -1, pvB = [-1, -1], pd = false;
      const pw = [null, null];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL, deck = !!onDeck(i), both = deck && pd; pd = deck;
        // (a quad between two rows on the bridge goes into the bridge meshes instead)
        const rp = offs.map(o => Pt(i, o, 0.02)), rc = offs.map(o => shade(i, o)), ru = offs.map(o => [(o + w) / tileL, v]);
        const r = gr.row(rp, rc, ru); if (pr >= 0 && !both) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const rB = deck ? grB.row(rp, rc, ru) : -1; if (rB >= 0 && prB >= 0) grB.link(prB, rB, 0, offs.length - 1); prB = rB;
        const wl = [0.94, 0.94, 0.9], lp = [Pt(i, -w + 0.2, 0.034), Pt(i, -w + 0.5, 0.034), Pt(i, w - 0.5, 0.034), Pt(i, w - 0.2, 0.034)], l = gl.row(lp, [wl, wl, wl, wl]), lB = deck ? glB.row(lp, [wl, wl, wl, wl]) : -1;
        if (pl >= 0 && !both) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        if (lB >= 0 && plB >= 0) { glB.link(plB, lB, 0, 1); glB.link(plB, lB, 2, 3); } plB = lB;
        for (const side of [-1, 1]) {
          const si = side > 0 ? 1 : 0, vr = SZ.verge(i, side), [o1, h1] = vr[1], [o2, h2] = vr[2], band = [], bc = [];
          for (let b = 1; b <= MOW_N; b++) { const o = Math.min(o1 + b * MOW_W, o2), h = h1 + (h2 - h1) * (o - o1) / Math.max(1e-6, o2 - o1); band.push([o, h], [o, h]); bc.push(bandC(b), bandC(b + 1)); }
          const bo = Math.max(1, Math.min(MOW_N + 1, Math.ceil((o2 - o1) / MOW_W - 1e-6)));   // (the band the verge ends in)
          const pv5 = [vr[0], vr[1], ...band, vr[2], vr[3], vr[4]], pts = pv5.map(([o, h]) => Pt(i, side * o, h)), nL = pv5.length;
          let cols;
          if (deck) cols = pv5.map(() => conc);
          else { const g3 = szGCol(pts[nL - 2][0], pts[nL - 2][2]), g4 = szGCol(pts[nL - 1][0], pts[nL - 1][2]); cols = [vg, bandC(1), ...bc, bandC(bo), [lerp(vg[0], g3[0], 0.5), lerp(vg[1], g3[1], 0.5), lerp(vg[2], g3[2], 0.5)], g4]; }
          const ordered = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };   // rows run left -> right
          const rv = gv.row(ordered.p, ordered.c, ordered.p.map(p => [p[0] / 14, -p[2] / 14]));   // (the terrain tiles' grass scale: no seam)
          const ow = side > 0 ? pv5.map(e => e[0]) : pv5.map(e => e[0]).reverse(), qw = pw[si];
          const wide = (k) => Math.abs(ow[k + 1] - ow[k]) > 1e-3 || Math.abs(qw[k + 1] - qw[k]) > 1e-3;
          if (pv[si] >= 0 && !both) for (let k = 0; k < nL - 1; k++) if (wide(k)) gv.link(pv[si], rv, k, k + 1);
          pv[si] = rv;
          const rvB = deck ? gvB.row(ordered.p, ordered.c) : -1; if (rvB >= 0 && pvB[si] >= 0) for (let k = 0; k < nL - 1; k++) if (wide(k)) gvB.link(pvB[si], rvB, k, k + 1);
          pvB[si] = rvB; pw[si] = ow;
          if (kerb[si][i]) {   // red / white kerb, raised a little towards its outer edge
            const kp = side > 0 ? [Pt(i, w - 0.02, 0.04), Pt(i, w + T.curbW, 0.085)] : [Pt(i, -(w + T.curbW), 0.085), Pt(i, -w + 0.02, 0.04)];
            const rk = gk.row(kp, [[1, 1, 1], [1, 1, 1]], side > 0 ? [[0, ii * ds / 3], [1, ii * ds / 3]] : [[1, ii * ds / 3], [0, ii * ds / 3]]);
            if (pk[si] >= 0) gk.link(pk[si], rk, 0, 1); pk[si] = rk;
          } else pk[si] = -1;
          const gwv = gravW(i, side), bar = side > 0 ? T.br[i] : T.bl[i];
          if (gwv > 0 && !deck) {   // gravel trap on the verge: from 3 m past the edge to 1.5 m short of the barrier, pinched in at its ends
            const o0 = w + 3, o1 = lerp(o0, Math.max(o0 + 0.5, bar - 1.5), gwv), a = [o0, vY(vr, o0) + 0.03], b = [(o0 + o1) / 2, vY(vr, (o0 + o1) / 2) + 0.03], e = [o1, vY(vr, o1) + 0.03];
            const sp = [a, b, e].map(([o, h]) => Pt(i, side * o, h)), sc = [[0.88, 0.88, 0.9], [0.93, 0.93, 0.95], [0.9, 0.9, 0.92]], so = side > 0 ? sp : sp.slice().reverse(), sco = side > 0 ? sc : sc.slice().reverse();
            const rs = gs.row(so, sco, so.map(p => [p[0] / 6, -p[2] / 6])); if (ps[si] >= 0) gs.link(ps[si], rs, 0, 2); ps[si] = rs;
          } else ps[si] = -1;
        }
      }
      addM(gr, aMat); addM(gl, lMat); addM(gv, gMat); addM(gk, cMat); addM(gs, sMat);
      addM(grB, aMatB); addM(glB, lMatB); addM(gvB, dMatB);
    }
    // chequered start / finish line and the grid boxes (13 cars, staggered)
    {
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wh = [0.93, 0.93, 0.9], HYp = (p) => T.hy[p[3]];
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) {
        const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.4;
        const p0 = atSf(sb, lat - 1.5), p1 = atSf(sb, lat + 1.5), p2 = atSf(sb + 0.35, lat + 1.5), p3 = atSf(sb + 0.35, lat - 1.5);
        gw.quadUp([p0[0], HYp(p0) + 0.037, p0[1]], [p1[0], HYp(p1) + 0.037, p1[1]], [p2[0], HYp(p2) + 0.037, p2[1]], [p3[0], HYp(p3) + 0.037, p3[1]], [wh, wh, wh, wh]);
        const q0 = atSf(sb - 1.6, lat - 1.5), q1 = atSf(sb + 0.35, lat - 1.5), q2 = atSf(sb + 0.35, lat - 1.25), q3 = atSf(sb - 1.6, lat - 1.25);
        gw.quadUp([q0[0], HYp(q0) + 0.037, q0[1]], [q1[0], HYp(q1) + 0.037, q1[1]], [q2[0], HYp(q2) + 0.037, q2[1]], [q3[0], HYp(q3) + 0.037, q3[1]], [wh, wh, wh, wh]);
      }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }
    if (T.drs) {   // the DRS lines across the road (def.drs, down the start / finish straight): a solid one at the detection point, a dashed one where the zone opens
      const gd = new GB(), wl = [0.95, 0.95, 0.92], HYp = (p) => T.hy[p[3]];
      for (const z of T.drs) for (const [at, dash] of [[z.det, false], [z.act, true]]) {
        const s0 = sAt(at), s1 = s0 + 0.3;
        for (let o = -w + 0.2; o < w - 0.2 - 1e-6; o += dash ? 1.2 : 2) { const o1 = Math.min(w - 0.2, o + (dash ? 0.7 : 2)), A = atSf(s0, o), B = atSf(s0, o1), C = atSf(s1, o1), D = atSf(s1, o);
          gd.quadUp([A[0], HYp(A) + 0.036, A[1]], [B[0], HYp(B) + 0.036, B[1]], [C[0], HYp(C) + 0.036, C[1]], [D[0], HYp(D) + 0.036, D[1]], [wl, wl, wl, wl]); }
      }
      addM(gd, lMat);
    }

    /* ---- barriers: armco on posts, tyre walls in front of it round the gravel traps, concrete walls with catch fences along the start / finish
       straight (the pit wall on the right), concrete parapets on and beside the bridge, the retaining walls of the underpass ---- */
    // the retaining walls' top: the ground behind them (the embankment of the back straight), a smooth line (the highest ground over
    // 8 m either way, averaged over 8 m), under the deck no higher than its underside
    const wallRaw = (i, side) => {
      const bar = side > 0 ? T.br[i] : T.bl[i]; let top = 1.1;
      for (const o of [bar + 1, bar + 3, bar + 5, bar + 6.5]) { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o; top = Math.max(top, szGround(x, z) - T.hy[i] + 0.15); }
      return top;
    };
    const wallCap = (i, side) => {   // the deck's underside over the wall (+inf where there is no deck)
      const bar = side > 0 ? T.br[i] : T.bl[i]; let cap = 1e9;
      for (const X of XC) { const up = X.iu, x = T.px[i] + T.nx[i] * side * (bar + 0.5), z = T.pz[i] + T.nz[i] * side * (bar + 0.5), dx = x - T.px[up], dz = z - T.pz[up];
        if (Math.abs(dx * T.nx[up] + dz * T.nz[up]) < T.br[up] + 0.8 && Math.abs(dx * T.tx[up] + dz * T.tz[up]) < 40) cap = Math.min(cap, T.hy[up] - 1.35 - T.hy[i]); }   // (a straight line is enough there)
      return cap;
    };
    const wtop = [new Map(), new Map()];
    for (const X of XC) for (const side of [-1, 1]) {
      const M = wtop[side > 0 ? 1 : 0], i0 = Math.round(X.lo) - 36, raw = [];
      for (let k = 0; k <= 72; k++) raw.push(wallRaw(((i0 + k) % N + N) % N, side));
      for (let k = 0; k <= 72; k++) { let a = 0, n = 0; for (let d = -4; d <= 4; d++) { let m = 0; for (let e = -4; e <= 4; e++) m = Math.max(m, raw[clamp(k + d + e, 0, 72)]); a += m; n++; }
        const i = ((i0 + k) % N + N) % N; M.set(i, Math.max(1.1, Math.min(a / n, wallCap(i, side)))); }
    }
    const wallTop = (i, side) => { const v = wtop[side > 0 ? 1 : 0].get(i); return v == null ? Math.max(1.1, Math.min(wallRaw(i, side), wallCap(i, side))) : v; };
    const mainStr = (i) => { const d = dS(i * ds); return d > T.len - 330 || d < 250; };   // the start / finish straight
    const rw = [new Uint8Array(N), new Uint8Array(N)];   // the lower road's retaining walls: under the bridge and on as long as the ground behind stands up
    for (const X of XC) for (let i = 0; i < N; i++) if (szCd(i, X.lo) < X.c.loZ + 40) for (const side of [-1, 1]) if (loWall(i) || wallTop(i, side) > 1.7) rw[side > 0 ? 1 : 0][i] = 1;
    const tw = [T.gravL, T.gravR].map(gv => {   // tyre walls round the gravel traps: the traps widened by 10 m, no runs shorter than 30 m
      const a = new Uint8Array(N); for (let i = 0; i < N; i++) if (gv[i]) for (let d = -5; d <= 5; d++) a[(i + d + N) % N] = 1;
      for (let i = 0; i < N; i++) if (a[i] && !a[(i - 1 + N) % N]) { let n = 0; while (n < N && a[(i + n) % N]) n++; if (n < 15) for (let d = 0; d < n; d++) a[(i + d) % N] = 0; }
      return a; });
    const kind = (i, side) => rw[side > 0 ? 1 : 0][i] ? 3 : upWall(i) ? 2 : mainStr(i) ? 1 : tw[side > 0 ? 1 : 0][i] ? 4 : 0;   // 0 armco, 1 wall + fence, 2 parapet, 3 retaining wall, 4 tyres + armco
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.13, 1, 0.13, 0, [0.42, 0.43, 0.46], null, true); return g.geometry(); })();
    const posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
    const fence = [new Uint8Array(N), new Uint8Array(N)];   // catch fences (set below where the spectators are)
    const steel = [0.8, 0.82, 0.85], steelD = [0.5, 0.52, 0.56], concD = [0.6, 0.6, 0.58];
    const railRow = (gr, i, side, k) => {   // barrier cross-section at sample i, 5 points (rows run so that the faces look at the road)
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + (k === 4 ? 1.05 : 0.12));
      let p, c;
      if (k === 0 || k === 4) { const o2 = side * (bar + (k === 4 ? 1.35 : 0.42)); p = [Pt(i, o, 0.32), Pt(i, o, 0.6), Pt(i, o, 0.66), Pt(i, o, 0.95), Pt(i, o2, 0.95)]; c = [steel, steelD, steel, [0.9, 0.91, 0.93], [0.72, 0.74, 0.77]]; }
      else if (k === 3) { const t = wallTop(i, side), o3 = side * (bar + 0.55), o2 = side * (bar + 6), gc = [0.34, 0.54, 0.22]; p = [Pt(i, o, -0.4), Pt(i, o, t - 0.12), Pt(i, o, t), Pt(i, o3, t), Pt(i, o2, t)]; c = [[0.5, 0.5, 0.48], [0.66, 0.66, 0.64], [0.74, 0.74, 0.72], gc, gc]; }   // (grassed over behind the coping)
      else { const h = k === 1 ? 1.05 : 1.15, o2 = side * (bar + 0.45); p = [Pt(i, o, -0.4), Pt(i, o, 0.1), Pt(i, o, h - 0.1), Pt(i, o, h), Pt(i, o2, h)]; c = [concD, conc, conc, [0.84, 0.84, 0.82], [0.8, 0.8, 0.78]]; }
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(), grB = new RB(), gt = new RB(true);
      for (const side of [-1, 1]) {
        let prev = -1, pk = -1, prevB = -1, pt = -1;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, k = kind(i, side), deck = !!onDeck(i);
          if (prev >= 0 && k !== pk) { gr.link(prev, railRow(gr, i, side, pk), 0, 4); prev = -1; }   // the old kind runs up to here, the new one starts here
          const r = railRow(gr, i, side, k); if (prev >= 0 && !(deck && prevB >= 0)) gr.link(prev, r, 0, 4); prev = r; pk = k;
          const rB = deck ? railRow(grB, i, side, k) : -1; if (rB >= 0 && prevB >= 0) grB.link(prevB, rB, 0, 4); prevB = rB;
          if ((k === 0 || k === 4) && ii % 2 === 0 && ii < c0 + CH) { const p = Pt(i, side * ((side > 0 ? T.br[i] : T.bl[i]) + (k === 4 ? 1.17 : 0.24)), 0); posts.add(p[0], p[1] - 0.35, p[2], T.hd[i], 1, 1.25); }
          if (k === 4) {   // the tyre wall: black tyres three high in front of the rail, a belt of conveyor rubber over their face
            const bar = side > 0 ? T.br[i] : T.bl[i], o0 = side * (bar + 0.12), o1 = side * (bar + 0.95), v = ii * ds / 1.6;
            let tp = [Pt(i, o0, -0.1), Pt(i, o0, 0.95), Pt(i, o1, 0.95)], tu = [[v, 0.5], [v, 0.998], [v, 0.6]];
            if (side < 0) { tp = tp.reverse(); tu = tu.reverse(); }
            const rt = gt.row(tp, [[1, 1, 1], [1, 1, 1], [0.8, 0.8, 0.8]], tu); if (pt >= 0) gt.link(pt, rt, 0, 2); pt = rt;
          } else pt = -1;
        }
      }
      addM(gr, rMat, true); addM(grB, dMatB, true); addM(gt, tyMat, true);
    }
    const nPosts = posts.addTo(root, true);
    for (let i = 0; i < N; i++) if (mainStr(i)) { fence[0][i] = 1; fence[1][i] = 1; }

    /* ---- the bridge: a concrete deck under the back straight, from wall to wall of the underpass (its fascias and underside seen from below) ---- */
    for (const X of XC) {
      const g = new GB(), nlx = T.nx[X.il], nlz = T.nz[X.il], ext = T.br[X.iu] + 0.6, reach = (T.br[X.il] + 2.2);   // the deck edges: 0.6 m past the parapets; it rests 2.2 m onto the walls' tops
      const rows = [];
      for (let d = -24; d <= 24; d += 1) {
        const s = X.up * ds + d, i = T.idx(s), f = atSf(s, 0), cx = f[0], cz = f[1], nx = T.nx[i], nz = T.nz[i], y = T.hy[i] - 0.03;
        const ll0 = (cx - X.c.x) * nlx + (cz - X.c.z) * nlz, dl = nx * nlx + nz * nlz;   // lateral offset from the lower road's centre line at lateral o: ll0 + o * dl
        let a = -ext, b = ext;
        if (Math.abs(dl) > 1e-3) { const o1 = (-reach - ll0) / dl, o2 = (reach - ll0) / dl; a = Math.max(a, Math.min(o1, o2)); b = Math.min(b, Math.max(o1, o2)); } else if (Math.abs(ll0) > reach) continue;
        if (b - a < 0.05) continue;
        rows.push({ top: [[cx + nx * a, y, cz + nz * a], [cx + nx * b, y, cz + nz * b]], bot: [[cx + nx * a, y - 1.3, cz + nz * a], [cx + nx * b, y - 1.3, cz + nz * b]], full: a <= -ext + 0.01 && b >= ext - 0.01 });
      }
      const cc = [0.7, 0.7, 0.68], cu = [0.56, 0.56, 0.55];
      for (let k = 0; k + 1 < rows.length; k++) {
        const A = rows[k], B = rows[k + 1], mid = [(A.top[0][0] + B.top[1][0]) / 2, A.top[0][1] - 0.65, (A.top[0][2] + B.top[1][2]) / 2];
        g.quadO(A.bot[0], A.bot[1], B.bot[1], B.bot[0], cu, mid);                                     // underside
        if (A.full && B.full) { g.quadO(A.top[0], B.top[0], B.bot[0], A.bot[0], cc, mid); g.quadO(A.top[1], B.top[1], B.bot[1], A.bot[1], cc, mid); }   // fascias along the parapets
      }
      addM(g, dMatB, true);
      out.dyn.tunnel = { mat: dMatB, mats: fadeMats, s0: X.lo * ds - 30, s1: X.lo * ds + 16 };   // (Render: fades while the followed car drives underneath)
      exclPush(X.c.x, X.c.z, 34);
    }

    /* ---- scenery (vertex coloured, 128 m chunks) ---- */
    const scen = new Chunks(128), ban = new GB(true), fenceG = new GB(true), crowdT = new GB(true);
    const CR = crowdCtx({ gH: szGround, near: (x, z) => szNear(x, z).dd, maxSlope: 0.7 });   // spectators (instanced)
    const nm = T.names.map(q => q.n);
    const atlas = ownTex(szAtlas(nm)), AB = nm.length, aUV = (k) => { const u0 = (k % 4) / 4, v1 = 1 - Math.floor(k / 4) / 16; return [u0, v1 - 1 / 16, u0 + 0.25, v1]; };
    const board = (cx, cy, cz, tx, tz, W, H, cellK) => {   // text board (bottom centre cx, cy, cz) facing -t (read by cars driving along +t), a dark back behind it
      const [u0, v0, u1, v1] = aUV(cellK), ux = tz, uz = -tx, hw = -W / 2, W1 = [1, 1, 1];
      const A = [cx - ux * hw, cy, cz - uz * hw], B = [cx + ux * hw, cy, cz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban.quadO(A, B, C, D, W1, [cx + tx, cy + H / 2, cz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      box(scen.get(cx, cz), cx + tx * 0.06, cy - 0.02, cz + tz * 0.06, 0.08, H + 0.04, W + 0.04, Math.atan2(tz, tx), [0.3, 0.31, 0.33], null, true);
    };
    const signPost = (s, side, extra, cellK, W, H, y0) => {   // a board on two posts beside the track, facing the traffic
      const [x, z, i] = onSide(s, side, extra), y = szGround(x, z), g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i];
      for (const o of [-W / 2 + 0.2, W / 2 - 0.2]) box(g, x + nx * o + T.tx[i] * 0.16, y - 0.3, z + nz * o + T.tz[i] * 0.16, 0.1, y0 + H + 0.3, 0.1, T.hd[i], [0.55, 0.56, 0.58]);
      board(x, y + y0, z, T.tx[i], T.tz[i], W, H, cellK); exclPush(x, z, 3); CR.avoid(x, z, 1.5);
    };
    const roomSide = (s) => { let l = 0, r = 0; for (let d = -30; d <= 30; d += 6) { const i = T.idx(s + d); l += T.bl[i]; r += T.br[i]; } return r > l ? 1 : -1; };

    /* ---- START / FINISH: the gantry with the start lights over the straight ---- */
    {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.8, 7.9, 0.8, h, gray);
      box(g, x, gy + 6.4, z, 1.1, 1.3, span * 2 + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, gy + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, gy + 7.95, z + nz * o); m.rotation.y = -h; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      board(x - T.tx[i] * 0.6, gy + 6.45, z - T.tz[i] * 0.6, T.tx[i], T.tz[i], span * 2 - 2, 1.2, AB + 3);
      exclPush(x, z, span + 6);
    }

    /* ---- the pit lane, the pit building (garages under two floors of offices, the control tower) and the teams' flags ---- */
    let nBld = 0;
    {
      const rows = def.pitBld || [], TEAM = [[0.85, 0.16, 0.13], [0.16, 0.36, 0.8], [0.95, 0.95, 0.94], [0.18, 0.62, 0.3], [0.96, 0.72, 0.12], [0.14, 0.14, 0.16], [0.95, 0.45, 0.1], [0.5, 0.26, 0.7], [0.1, 0.62, 0.72], [0.85, 0.2, 0.5]];
      const gl = new RB(true), gb = new GB();
      const wallC = [0.9, 0.9, 0.88], glass = [0.3, 0.42, 0.55], roofC = [0.62, 0.63, 0.66], dark = [0.1, 0.1, 0.12], door2 = [0.17, 0.17, 0.2];
      let pl = -1, prev = null;
      for (let k = 0; k < rows.length; k++) {
        const [d, f0] = rows[k], s = sAt(d), q0 = crAt(s); if (!q0) { prev = null; continue; } const q = Object.assign({}, q0);
        const i = q.i, y = T.hy[i], bar = T.br[i], front = Math.max(f0, bar + 9), back = front + 16, P2 = (o, h) => [q.px + q.nx * o, y + h, q.pz + q.nz * o];
        // pit lane: tarmac from the pit wall to the garages (a white line along the wall)
        const lp = [P2(bar + 0.5, 0.01), P2(bar + 0.9, 0.012), P2(front, 0.01)], rl = gl.row(lp, [[1, 1, 1], [1.6, 1.6, 1.55], [1, 1, 1]], lp.map(p => [p[0] / 8, -p[2] / 8]));
        if (pl >= 0) gl.link(pl, rl, 0, 2); pl = rl;
        // the building's cross-section: garage doors, a canopy over the lane, two office floors with a glass band, the flat roof, the back wall
        const cs = [P2(front, -0.3), P2(front, 4.6), P2(front - 2.4, 4.9), P2(front - 2.4, 5.4), P2(front, 5.4), P2(front, 7.4), P2(front, 10.4), P2(front, 12.6), P2(back, 12.6), P2(back, -0.3)];
        const door = (Math.floor(d / 6.5) & 1) ? dark : door2, cc = [door, wallC, wallC, wallC, wallC, glass, wallC, roofC, wallC];
        if (prev) { const inn = P2(front + 8, 6); for (let m = 0; m + 1 < cs.length; m++) gb.quadO(prev[m], prev[m + 1], cs[m + 1], cs[m], cc[m], inn); }
        prev = cs;
        if (k % 3 === 0) { const fx = q.px + q.nx * (bar + 0.7), fz = q.pz + q.nz * (bar + 0.7), gg = scen.get(fx, fz); cyl(gg, fx, y, fz, 0.05, 5, 5, [0.86, 0.86, 0.88]); box(gg, fx + q.tx * 0.55, y + 3.9, fz + q.tz * 0.55, 1.1, 1.0, 0.05, Math.atan2(q.tz, q.tx), TEAM[(k / 3 | 0) % TEAM.length], null, true); }
        if (k % 4 === 0) CR.block(q.px + q.nx * (front + 8), q.pz + q.nz * (front + 8), 14, 18, Math.atan2(q.tz, q.tx));
        exclPush(q.px + q.nx * (front + 6), q.pz + q.nz * (front + 6), 14);
        if (k === 0 || k === rows.length - 1) { const inn = P2(front + 8, 6), q2 = crAt(s + (k === 0 ? 3 : -3)), inn2 = q2 ? [q2.px + q2.nx * (front + 8), y + 6, q2.pz + q2.nz * (front + 8)] : inn;   // the gable ends
          gb.quadO(cs[0], cs[1], cs[8], cs[9], wallC, inn2); gb.quadO(cs[4], cs[7], cs[8], cs[1], wallC, inn2); }
      }
      addM(gl, aMat); addM(gb, matV, true);
      // the control tower by the finish line: a glass box on the building
      { const q = crAt(sAt(18)), i = q.i, y = T.hy[i], front = Math.max(26, T.br[i] + 9), cx = q.px + q.nx * (front + 8), cz = q.pz + q.nz * (front + 8), g = scen.get(cx, cz), rot = Math.atan2(q.tz, q.tx);
        box(g, cx, y + 12.6, cz, 22, 7.5, 13, rot, [0.9, 0.9, 0.88], [0.6, 0.61, 0.64]); box(g, cx - q.nx * 6.55, y + 13.4, cz - q.nz * 6.55, 21, 5.2, 0.1, rot, glass, null, true);
        box(g, cx, y + 20.1, cz, 14, 0.5, 9, rot, [0.24, 0.25, 0.28]); nBld++; }
      nBld++;
      for (let i = 0; i < N; i++) { const d = dS(i * ds); if (d > T.len - 260 || d < 110) fence[1][i] = 1; }
    }

    /* ---- grandstands: their real outlines cut along the track, a raked bank of seats packed with fans (the crowd map), a roof over the main grandstand ---- */
    let nStands = 0;
    {
      const gs = new GB(), gc = new RB(true), gr = new GB(), stC = [0.62, 0.63, 0.66], stD = [0.5, 0.51, 0.55], stT = [0.74, 0.75, 0.78], roofC = [0.92, 0.93, 0.95], roofU = [0.7, 0.71, 0.74];
      for (const [name, side, roof, rows] of def.stands || []) {
        let prev = null, pc = -1;
        const cap = (cs, s, into) => {   // an end wall (into: the side along the track where the stand goes on)
          const qa = crAt(s); if (!qa) return; const ax = qa.px, az = qa.pz, qb = crAt(s + into * 3); if (!qb) return;
          const inn = [(cs[1][0] + cs[3][0]) / 2 + qb.px - ax, cs[1][1], (cs[1][2] + cs[3][2]) / 2 + qb.pz - az]; gs.quadO(cs[0], cs[1], cs[3], cs[4], stD, inn); gs.quadO(cs[1], cs[2], cs[3], cs[3], stD, inn); };
        for (let k = 0; k < rows.length; k++) {
          const [d, f0, f1] = rows[k], s = sAt(d), q0 = crAt(s), q = q0 && Object.assign({}, q0), i = q ? q.i : 0;
          const bar = q ? (side > 0 ? q.br : q.bl) : 0, front = Math.max(f0, bar + 4.5), depth = clamp(f1 - front, 0, 24);
          if (!q || depth < 4 || nearX(i, 30)) { if (prev) cap(prev.cs, prev.s, -1); prev = null; pc = -1; continue; }
          const P2 = (o, h) => [q.px + q.nx * side * o, h, q.pz + q.nz * side * o];
          const y0 = szGround(q.px + q.nx * side * front, q.pz + q.nz * side * front) - 0.2, top = y0 + 1.4 + depth * 0.52;
          // cross-section: front wall, the walkway along it, the raked seating, the back wall (flat shaded between two rows)
          const cs = [P2(front, y0 - 0.6), P2(front, y0 + 1.4), P2(front + 1.2, y0 + 1.4), P2(front + depth, top), P2(front + depth, y0 - 0.6)];
          if (prev) { const inn = P2(front + depth / 2, y0 + 1), a = prev.cs; for (let m = 0; m < 4; m++) gs.quadO(a[m], a[m + 1], cs[m + 1], cs[m], m === 2 ? stT : m === 1 ? stC : stD, inn); }
          else cap(cs, s, 1);
          // the fans: a crowd map over the rake (u along the stand, v up it: 16 rows of people)
          const cp = [P2(front + 1.3, y0 + 1.47), P2(front + depth - 0.2, top + 0.02)], u = s / 12, cuv = [[u, 0.004], [u, 0.996 * Math.min(1, depth / 15)]];
          const rc = gc.row(side > 0 ? cp : cp.slice().reverse(), [[1, 1, 1], [1, 1, 1]], side > 0 ? cuv : cuv.slice().reverse()); if (pc >= 0) gc.link(pc, rc, 0, 1); pc = rc;
          if (roof) {   // a roof on the back wall, cantilevered out over the front rows
            const rp = [P2(front + depth + 0.3, top + 4.4), P2(front - 1.5, top + 3.3), P2(front - 1.5, top + 3.0), P2(front + depth + 0.3, top + 4.1)];
            if (prev && prev.rp) { const inn = P2(front + depth / 2, top + 3.7); gr.quadO(prev.rp[0], prev.rp[1], rp[1], rp[0], roofC, P2(front + depth / 2, top - 5)); gr.quadO(prev.rp[3], prev.rp[2], rp[2], rp[3], roofU, P2(front + depth / 2, top + 9)); gr.quadO(prev.rp[1], prev.rp[2], rp[2], rp[1], roofC, inn); }
            if (k % 4 === 0) { const [bx, , bz] = P2(front + depth - 0.4, 0); box(scen.get(bx, bz), bx, y0, bz, 0.5, top + 4.3 - y0, 0.5, T.hd[i], [0.86, 0.87, 0.9]); }
            prev = { cs, s, rp }; } else prev = { cs, s };
          if (k % 2 === 0) { const [cx, , cz] = P2(front + depth / 2, 0); exclPush(cx, cz, depth / 2 + 4); CR.block(cx, cz, 7, depth + 2, Math.atan2(q.tz, q.tx)); }
          for (let dd = -1; dd <= 1; dd++) fence[side > 0 ? 1 : 0][(i + dd + N) % N] = 1;
        }
        if (prev) cap(prev.cs, prev.s, -1);
        nStands++;
      }
      addM(gs, matV, true); addM(gc, crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.06, 0.06)); addM(gr, matV, true);   // (one slope: a row of people every 0.9 m)
    }

    /* ---- buildings (OpenStreetMap footprints near the track): houses, halls, the circuit's own buildings, the theme park's rides in bright colours ---- */
    const moto = def.motopia || null, RIDE = [[0.95, 0.35, 0.3], [0.2, 0.55, 0.9], [0.98, 0.8, 0.2], [0.35, 0.75, 0.4], [0.95, 0.55, 0.75], [0.6, 0.4, 0.85], [0.98, 0.6, 0.2]].map(c => c.map(v => lerp(v, 0.95, 0.3)));   // (pastel)
    for (const [bx, bz, L, W, ang, H, k] of def.bld || []) {
      const ca = Math.cos(ang), sa = Math.sin(ang), corners = [[L / 2, W / 2], [L / 2, -W / 2], [-L / 2, W / 2], [-L / 2, -W / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      let clash = false, y0 = 1e9; for (const [cx, cz] of corners.concat([[bx, bz]])) { const n = szNear(cx, cz); if (n.i >= 0 && n.dd < 1.5) clash = true; y0 = Math.min(y0, szGround(cx, cz)); }
      if (clash || szPond(bx, bz)) continue;
      const g = scen.get(bx, bz), inMoto = moto && inPoly(moto, bx, bz); nBld++; CR.block(bx, bz, L, W, ang);
      exclRect.push({ x: bx, z: bz, c: ca, s: sa, hl: L / 2 + 2, hw: W / 2 + 2 });
      if (k === 3 || k === 4) {   // the circuit's buildings: white, a dark glass band on every floor, a flat roof
        const hh = H || 9, fl = Math.max(1, Math.round(hh / 3.6));
        box(g, bx, y0 - 0.4, bz, L, hh + 0.4, W, ang, [0.92, 0.92, 0.9], [0.66, 0.67, 0.7]);
        for (let f = 0; f < fl; f++) box(g, bx, y0 + 1.2 + f * 3.6, bz, L + 0.08, 1.4, W + 0.08, ang, [0.28, 0.36, 0.46], null, true);
      } else if (k === 1) {   // hall: metal walls, a low roof
        const hh = H || 8 + R() * 3, wc = inMoto ? RIDE[Math.floor(R() * RIDE.length)] : vary([0.72, 0.74, 0.76], R, 0.14);
        box(g, bx, y0 - 0.4, bz, L, hh + 0.4, W, ang, wc, inMoto ? [0.95, 0.95, 0.95] : [0.52, 0.55, 0.6]);
      } else {   // house or small pavilion: light walls, a dark tiled roof (Japanese kawara), bright ones in the theme park
        const hh = H || 5.4 + R() * 1.8, walls = [[0.94, 0.92, 0.88], [0.9, 0.88, 0.84], [0.84, 0.8, 0.74], [0.95, 0.95, 0.93]], roofs = [[0.22, 0.24, 0.28], [0.3, 0.3, 0.34], [0.38, 0.28, 0.24], [0.2, 0.3, 0.42]];
        const wc = inMoto ? RIDE[Math.floor(R() * RIDE.length)] : vary(walls[Math.floor(R() * walls.length)], R, 0.06);
        box(g, bx, y0 - 0.4, bz, L, hh + 0.4, W, ang, wc, null, true);
        if (L * W < 700) gable(g, bx, y0 + hh, bz, L + 0.6, W + 0.6, Math.min(3.2, W * 0.4), ang, inMoto ? [0.95, 0.95, 0.95] : roofs[Math.floor(R() * roofs.length)], [0.8, 0.78, 0.74]);
        else box(g, bx, y0 + hh, bz, L, 0.5, W, ang, [0.5, 0.5, 0.52]);
      }
      exclPush(bx, bz, Math.min(Math.max(L, W) / 2 + 3, 30));
    }

    /* ---- Motopia's Ferris wheel: it turns, the gondolas hang level ---- */
    if (def.wheel) {
      const [wx, wz] = def.wheel, gy = szGround(wx, wz), rim = 21, hub = gy + rim + 4.5, rot = 0.7, c = Math.cos(rot), s = Math.sin(rot), g = scen.get(wx, wz), leg = [0.92, 0.92, 0.94];
      const beam = (gg, a, b, r, col) => {   // a square beam from a to b
        const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz), ux = dx / L, uy = dy / L, uz = dz / L;
        let px = -uz, pz = ux, pl = Math.hypot(px, pz) || 1; px /= pl; pz /= pl; const qx = uy * pz, qy = uz * px - ux * pz, qz = -uy * px;
        const C = (p, sa, sb) => [p[0] + (px * sa + qx * sb) * r, p[1] + qy * sb * r, p[2] + (pz * sa + qz * sb) * r], inn = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
        const S = [[1, 1], [-1, 1], [-1, -1], [1, -1]]; for (let k = 0; k < 4; k++) { const [s0, t0] = S[k], [s1, t1] = S[(k + 1) % 4]; gg.quadO(C(a, s0, t0), C(a, s1, t1), C(b, s1, t1), C(b, s0, t0), col, inn); } };
      for (const side of [-1, 1]) for (const f of [-1, 1]) beam(g, [wx + f * c * 10 - side * s * 3.6, gy - 0.3, wz + f * s * 10 + side * c * 3.6], [wx - side * s * 2.4, hub, wz + side * c * 2.4], 0.45, leg);   // two A-frames either side
      beam(g, [wx + s * 2.6, hub, wz - c * 2.6], [wx - s * 2.6, hub, wz + c * 2.6], 0.5, [0.75, 0.75, 0.78]);   // the axle
      box(g, wx, gy - 0.3, wz, 14, 3.2, 7, rot, [0.9, 0.3, 0.3], [0.95, 0.95, 0.95]);   // the boarding station
      const wg = new GB(), n = 32;
      for (let k = 0; k < n; k++) {   // in the wheel's own frame: x along it, y up, z along the axle
        const a0 = k / n * TAU, a1 = (k + 1) / n * TAU;
        for (const zz of [-1.6, 1.6]) { const p0 = [Math.cos(a0) * rim, Math.sin(a0) * rim, zz], p1 = [Math.cos(a1) * rim, Math.sin(a1) * rim, zz];
          wg.quadO(p0, p1, [p1[0] * 0.95, p1[1] * 0.95, zz], [p0[0] * 0.95, p0[1] * 0.95, zz], [0.95, 0.95, 0.96], [0, 0, 0]);   // the rims
          wg.quadO(p0, p1, [p1[0] * 0.95, p1[1] * 0.95, zz * 0.9], [p0[0] * 0.95, p0[1] * 0.95, zz * 0.9], [0.95, 0.95, 0.96], [0, 0, zz * 3]);
          if (k % 2 === 0) wg.quadO([0, 0, zz * 0.35], [p0[0] * 0.96, p0[1] * 0.96, zz], [p0[0] * 0.96 + 0.2, p0[1] * 0.96 + 0.2, zz], [0.2, 0.2, zz * 0.35], [0.85, 0.86, 0.9], [0, 0, zz * 3]); }   // spokes
        wg.quadO([Math.cos(a0) * rim, Math.sin(a0) * rim, -1.6], [Math.cos(a1) * rim, Math.sin(a1) * rim, -1.6], [Math.cos(a1) * rim, Math.sin(a1) * rim, 1.6], [Math.cos(a0) * rim, Math.sin(a0) * rim, 1.6], [0.88, 0.88, 0.9], [0, 0, 0]);   // the tread between the rims
      }
      cyl(wg, 0, -0.9, 0, 1.3, 1.8, 10, [0.8, 0.8, 0.84], [0.7, 0.7, 0.74]);
      const wm = new THREE.Mesh(wg.geometry(), matV); wm.castShadow = true;
      const pivot = new THREE.Group(); pivot.position.set(wx, hub, wz); pivot.rotation.y = -rot; pivot.add(wm); root.add(pivot);   // (local x along the wheel, local z along the axle)
      const gg = new GB(); box(gg, 0, -3.1, 0, 2.3, 2.3, 2.1, rot, [1, 1, 1], [0.95, 0.95, 0.95]);   // a gondola (the instance colour paints it)
      const gm = new THREE.InstancedMesh(gg.geometry(), matV, n), cols = [[0.95, 0.3, 0.3], [0.98, 0.8, 0.2], [0.25, 0.6, 0.95], [0.35, 0.78, 0.4], [0.95, 0.55, 0.8], [0.98, 0.6, 0.2]], cc = new THREE.Color();
      for (let k = 0; k < n; k++) { cc.setRGB(...cols[k % cols.length]); gm.setColorAt(k, cc); }
      gm.castShadow = true; gm.frustumCulled = false; root.add(gm);
      out.dyn.wheel = { spin: wm, gond: gm, n, r: rim, x: wx, y: hub, z: wz, ux: c, uz: s, w: TAU / 720, m: new THREE.Matrix4() };
      szWheel(out.dyn.wheel, 0);
      exclPush(wx, wz, 28); CR.avoid(wx, wz, 15); nBld++;
    }

    /* ---- ponds (the water flat, a little below the lowest ground on the shore) ---- */
    {
      const wt = tex.water, WO = { len: 0.7, amp: 0.6, refl: 0.45, land: 0.7, shal: 0.5, lap: 0.45, surf: 0 }, wMat = waterMat(tex, Object.assign({ color: 0xa8c8d8 }, WO));
      const g = new GB(true), bands = [];
      for (const p of P.ponds) {
        const shape = p.poly.map(([x, z]) => new THREE.Vector2(x, z)), tri = THREE.ShapeUtils.triangulateShape(shape, []);
        for (const [a, b, c] of tri) { const A = p.poly[a], B = p.poly[b], C = p.poly[c], P3 = (q) => [q[0], p.y, q[1]], U = (q) => [q[0] / 30, -q[1] / 30];
          g.quadUp(P3(A), P3(B), P3(C), P3(C), [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]], [U(A), U(B), U(C), U(C)]); }
        exclPush((p.bx0 + p.bx1) / 2, (p.bz0 + p.bz1) / 2, Math.max(p.bx1 - p.bx0, p.bz1 - p.bz0) / 2);
        const G = P.G, i0 = Math.max(0, Math.floor((p.bx0 - 16 - G.x0) / SZC)), j0 = Math.max(0, Math.floor((p.bz0 - 16 - G.z0) / SZC)), i1 = Math.min(G.nx - 1, Math.ceil((p.bx1 + 16 - G.x0) / SZC)), j1 = Math.min(G.nz - 1, Math.ceil((p.bz1 + 16 - G.z0) / SZC));
        bands.push(shoreBand(p.bx0 - 12, p.bz0 - 12, p.bx1 + 12, p.bz1 + 12, p.y + 0.015, waterline(szGH, G.x0, G.z0, SZC, i0, i1, j0, j1, p.y), 30));   // (where the terrain meets the pond)
      }
      addM(g, wMat); out.dyn.water = wt; addShore(root, mergeBands(bands), wMat, WO);
    }
    CR.water = (x, z) => !!szPond(x, z);

    /* ---- marshal posts, corner-name boards, braking boards, banners ---- */
    for (let d = 300, k = 0; d < T.len - 350; d += 420, k++) {   // marshal post: a white hut with an orange roof and a flag pole
      const s = sAt(d), i0 = T.idx(s); if (nearX(i0, 60)) continue;
      const side = k % 2 ? roomSide(s) : -roomSide(s), [x, z, i] = onSide(s, side, 2.6), y = szGround(x, z), g = scen.get(x, z);
      if (excluded(x, z)) continue;
      box(g, x, y - 0.2, z, 2.4, 2.5, 2.2, T.hd[i], [0.94, 0.94, 0.92], [0.95, 0.45, 0.12], true);
      box(g, x - T.nx[i] * side * 0.4, y + 1.1, z - T.nz[i] * side * 0.4, 1.6, 0.6, 2.25, T.hd[i], [0.2, 0.28, 0.36], null, true);
      const fx = x + T.tx[i] * 1.8, fz = z + T.tz[i] * 1.8; cyl(g, fx, y, fz, 0.05, 4.2, 5, [0.85, 0.85, 0.87]); box(g, fx + T.tx[i] * 0.45, y + 3.4, fz + T.tz[i] * 0.45, 0.9, 0.6, 0.04, T.hd[i], [0.98, 0.84, 0.1], null, true);
      exclPush(x, z, 5); CR.avoid(x, z, 2.5);
    }
    T.names.forEach((q, k) => { const s = sAt(q.d - 60), i = T.idx(s); if (nearX(i, 50)) return; signPost(s, roomSide(s), 1.6, k, 3.4, 0.85, 1.2); });
    for (const n of ['Prvi ovinek', 'Lasnica', '\u0160ikana', 'Spoon']) {   // 300 / 200 / 100 boards before the heavy braking zones
      const d0 = nameD(n); if (d0 == null) continue;
      let at = d0, bk = 0; for (let dd = -40; dd <= 60; dd += 2) { const kk = Math.abs(T.k[T.idx(sAt(d0 + dd))]); if (kk > bk) { bk = kk; at = d0 + dd; } }   // the corner's apex
      const turn = T.corners.find(c => Math.abs(dS(c.s0) - at) < 120), s0 = turn ? dS(turn.s0) : at - 40, side = turn ? -turn.dir : -1;
      for (let m = 1; m <= 3; m++) signPost(sAt(s0 - m * 100), side, 1.4, AB + m - 1, 1.3, 0.75, 0.9);
    }
    for (const d of [-200, -120, 120, 200]) { const s = sAt(d), q = crAt(s); if (!q) continue; const off = -(q.bl + 1.2), x = q.px + q.nx * off, z = q.pz + q.nz * off; board(x, T.hy[q.i] + 1.5, z, -q.nx, -q.nz, 9, 1.6, AB + 4 + ((d > 0) | 0)); }   // SUZUKA banners on the wall of the main grandstand

    /* ---- spectators on the grass banks at the famous corners (the stands have their own), catch fences in front of them ---- */
    let nFans = 0;
    {
      const M = { first: 1.4, gap: 1.1, excluded: (x, z) => excluded(x, z) || inRects(x, z), below: 3, above: 7, sit: 0.35, flag: 0.08 };
      const run = (d0, d1, side, o, fc) => { const n = crowdRun(CR, sStart + d0, sStart + d1, side, Object.assign({}, M, o));
        if (n && fc) for (let ii = T.idx(sStart + d0 - 6), k = 0; k < (d1 - d0 + 12) / ds; k++, ii = (ii + 1) % N) fence[side > 0 ? 1 : 0][ii] = 1; nFans += n; return n; };
      const SPOTS = [['S-zavoji', 1, 3, 0.55], ['S-zavoji', -1, 2, 0.4], ['Dolgi levi', 1, 2, 0.45], ['Dvojni desni', -1, 3, 0.6], ['Lasnica', -1, 3, 0.65], ['Lasnica', 1, 2, 0.45], ['200R', -1, 2, 0.4], ['Spoon', 1, 3, 0.6], ['Spoon', -1, 2, 0.4], ['130R', 1, 3, 0.55], ['\u0160ikana', 1, 2, 0.45], ['Prvi ovinek', 1, 2, 0.4]];
      for (const [n, side, rows, dn] of SPOTS) { const d = nameD(n); if (d == null) continue; run(d - 45, d + 55, side, { rows, dens: dn, label: 'SZ ' + n + (side > 0 ? ' R' : ' L') }, true); }
      for (const sd of [-1, 1]) run(260, T.len - 340, sd, { rows: 2, dens: 0.05, clump: 0.95, strip: false, label: 'SZ groups' });
      for (const e of CR.circ) exclPush(e.x, e.z, e.r);
    }
    // catch fences (chain link on posts) right behind the barriers where the spectators are
    for (const side of [-1, 1]) {
      const fc = fence[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N, seg = ds; if (!fc[i] || !fc[j] || nearX(i, 45) || kind(i, side) !== kind(j, side)) { acc += seg; continue; }
        const e = kind(i, side) === 4 ? 1.5 : 0.55, Q = (ii, y) => { const o = side * (bar[ii] + e); return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + y, T.pz[ii] + T.nz[ii] * o]; };
        const u0 = acc / 2.5, u1 = (acc + seg) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        fenceG.quadO(Q(i, 0.9), Q(j, 0.9), Q(j, 3.8), Q(i, 3.8), [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 1.15], [u0, 1.15]]);
        if (i % 3 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] - 0.2, p[2], 0.1, 4.0, 0.1, T.hd[i], [0.6, 0.61, 0.64]); }
        acc += seg;
      }
    }

    /* ---- trees: Japanese cedars and broadleaves where the land cover has woods, bushes on the scrub, lone trees on the lawns, cherries in
       blossom along the main straight and round the theme park ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const tk = [new IChunks(szTreeGeo(0), tMat, 128), new IChunks(szTreeGeo(1), tMat, 128), new IChunks(szTreeGeo(2), tMat, 128), new IChunks(szTreeGeo(3), tMat, 128)];
    let nTrees = 0;
    {
      const L = SZC * SZT, maxT = Math.round(90000 * dens);
      const cherryAt = (x, z) => { if (moto && inPoly(moto, x, z)) return 0.3; const i = nearest(x, z).i; if (i < 0) return 0; const d = dS(i * ds); return d > T.len - 420 || d < 330 ? 0.22 : 0.02; };
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * L, za = G.z0 + tj * L;
        for (let zz = za; zz < za + L; zz += 6.5) for (let xx = xa; xx < xa + L; xx += 6.5) {
          const x = xx + (R() - 0.5) * 5.6, z = zz + (R() - 0.5) * 5.6, rd = szDist(x, z), r1 = R(), r2 = R();
          if (rd > LOD.radius(260)) continue;
          if (rd > 80 && ((Math.floor(xx / 6.5) + Math.floor(zz / 6.5)) & 1)) continue;   // farther out every other spot, bigger trees
          const cl = szLC(x, z), far = rd > 80;
          const p = cl === 1 ? 0.9 : cl === 2 ? 0.4 : cl === 3 ? 0.01 : 0.05;
          if (r1 > p) continue;
          if (rd < 50) { const nn = szNear(x, z); if (nn.i >= 0 && nn.dd < 4) continue; if (nn.i >= 0 && nn.dd < 9 && r2 < 0.4) continue; }
          if (excluded(x, z) || inRects(x, z) || szPond(x, z)) continue;
          const y = szGround(x, z), ck = cl !== 1 && R() < cherryAt(x, z) * 3, sp = ck ? 3 : cl === 1 ? (P.n1(x * 2.1 + 300, z * 2.1) < 0.5 + (R() - 0.5) * 0.3 ? 0 : 1) : cl === 2 ? 2 : 1;
          const hgt = sp === 0 ? (13 + R() * 6) * (far ? 1.15 : 1) : sp === 1 ? (9 + R() * 4.5) * (far ? 1.15 : 1) : sp === 3 ? 6.5 + R() * 2 : 1.6 + R() * 2.2, wid = hgt * (sp === 0 ? 0.9 : sp === 1 ? 0.95 + R() * 0.25 : sp === 3 ? 1.25 : 1.1);
          const cv = 0.86 + R() * 0.28; tk[sp].add(x, y - 0.1, z, R() * TAU, wid, hgt, sp === 3 ? [1, 1, 1] : [cv * (0.95 + R() * 0.1), cv, cv * (0.95 + R() * 0.1)]);
          nTrees++;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);

    // knockable tyre walls and roadside posts (not on the main straight, round the crossover or on the grid)
    suzukaProps(out, (i, side, x, z) => mainStr(i) || nearX(i, 70) || excluded(x, z) || inRects(x, z));

    // the lawns out past the barriers, mown in stripes too: MOW_B darker bands along the track from 3.5 m past the barrier (the terrain's own
    // colour and grass, a deeper green, fading out 20-36 m out), 5 cm over the ground; not in the woods, the scrub or the car parks, under the
    // stands and buildings, in the ponds, along the main straight (the stands, the pits), round the crossover, where another leg of the track is
    // nearer, nor where the inside of a bend would fold them
    {
      const own = (x, z, i) => { const n = szNear(x, z), d = Math.abs(n.i - i); return n.i >= 0 && Math.min(d, N - d) < 30; };
      const mowPt = (i, side, o) => { const p = Pt(i, side * o, 0), x = p[0], z = p[2]; if (excluded(x, z) || inRects(x, z) || szPond(x, z) || !own(x, z, i)) return null;
        const f = (1 - szLCf(x, z, 1)) * (1 - szLCf(x, z, 2)) * (1 - szLCf(x, z, 3)) * sstep(36, 20, o - (side > 0 ? T.br[i] : T.bl[i])), c = szGCol(x, z);
        return f < 0.05 ? null : { p: [x, szGround(x, z) + 0.05, z], c: c.map((v, k) => v * (1 - MOW_D[k] * f)) }; };
      for (let c0 = 0; c0 < N; c0 += CH) {
        const gv = new RB(true), pm = [new Array(MOW_B).fill(-1), new Array(MOW_B).fill(-1)];
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, skip = mainStr(i) || nearX(i, 60);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, bar = side > 0 ? T.br[i] : T.bl[i], fold = side * T.k[i] > 0 ? 0.7 / Math.abs(T.k[i]) : 1e9;
            for (let b = 0; b < MOW_B; b++) {
              const oa = bar + 3.5 + b * 2 * MOW_O, ob = oa + MOW_O, A = !skip && ob < fold ? mowPt(i, side, oa) : null, B = A ? mowPt(i, side, ob) : null;
              if (!B) { pm[si][b] = -1; continue; }
              const q = side > 0 ? [A, B] : [B, A], r = gv.row(q.map(e => e.p), q.map(e => e.c), q.map(e => [e.p[0] / 14, -e.p[2] / 14]));
              if (pm[si][b] >= 0) gv.link(pm[si][b], r, 0, 1); pm[si][b] = r;
            }
          }
        }
        addM(gv, gMat);
      }
    }

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas })); if (bm) bm.castShadow = false;
    addM(fenceG, fMat);
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, posts: nPosts, buildings: nBld, stands: nStands, fans: nFans };   // (read by the tests)
    return out;
  }

  Object.assign(API, { szWheel });   // (what World and the other worlds use of this one)
  Object.defineProperties(API, { SZ: { get: () => SZ, set: (v) => { SZ = v; } } });
  World.ext.suzuka = (scene, tex, opts) => buildSuzuka(scene, tex, opts);
})();
