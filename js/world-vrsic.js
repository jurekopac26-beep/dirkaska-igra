/* =========================================================================
   WORLD — Vršič (theme 'vrsic') and the corridor helpers of the mountain roads: its own builder (World.ext.vrsic), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NR_A64, TAU, atSf, box, clamp, cone, crowdCtx, crowdFinish, crowdLayer, crowdPut, crowdRun, crowdSub, cyl, gable, ico,
    inPoly, lerp, nrChamfer, polyDist, propFloorTable, rng, roadsideProps, rock, rpHash, sstep, starCone, valueNoise2, vary
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= VRŠIČ (theme 'vrsic') =================
     The road over the Vršič pass (Slovenia), its north side: from the junction in Kranjska Gora (~800 m) past the lakes at Jasna, through the
     beech and spruce woods and up the 24 numbered hairpins (the cobbled stretches: def.setts) to the pass at 1611 m, among larches, dwarf pines
     and limestone scree. Painted for the season (VRS, from the game's setting): in summer green meadows and leaves; in autumn golden larches,
     copper beeches and the first snow of the season on the top (in winter the render's season code snows the autumn look over). As on the other open roads only a corridor round the
     road is built: a 5 m height grid in 100 m tiles; near the road the road's own height (blended from the nearby samples), farther out the real
     terrain (def.dem: Copernicus GLO-30 on a 32 m grid) with a little noise. The OpenStreetMap land cover (def.lc) colours the ground and decides
     where the woods, the dwarf pines and the scree are; the OpenStreetMap buildings (def.bld: the houses and hotels of Kranjska Gora, the mountain
     huts, the Russian Chapel) stand on it, the lakes (def.lakes) lie in basins dug into it and a gully runs under each longer bridge (def.bridges).
     Guardrails where the ground falls away and round the outside of the bends, stone parapets round the cobbled hairpins and on the bridges, a
     numbered sign before every hairpin. Hot loops live in these small functions (the big builder is not optimised by V8). */
  const VRC = 5, VRT = 20, VRHC = 32;          // terrain cell (m), tile size (cells), road-sample hash cell (m)
  let VRS = 'summer';                          // the season the world is painted in ('summer' or 'autumn': buildVrsic, from opts.season; winter: the autumn look, the render's season code snows it over)
  let VR = null;                               // per-build data: sample hash, the terrain, the land cover, the distance to the road, lakes, pads, gullies, terrain height grid
  const VRN = { i: -1, d: 1e9, dd: 1e9, lat: 0, h: 0, hn: 0 };   // vrNear: nearest sample, its distance and lateral offset, distance beyond the barrier, blended and exact road height
  const VRCOL = [0, 0, 0], VRW = { L: null, e: -1e9 };            // (vrCol's colour; vrWater's lake and how deep inside its shore line)
  function vrPrep() {
    const def = T.def, N = T.N, M = 460; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    const P = VR = { bx0: x0, bx1: x1, bz0: z0, bz1: z1, pads: [], gul: [], lakes: [] };
    x0 -= M; x1 += M; z0 -= M; z1 += M; P.x0 = x0; P.z0 = z0;
    // every 2nd road sample (and the last one) in a hash grid
    P.cx0 = Math.floor(x0 / VRHC); P.cz0 = Math.floor(z0 / VRHC); P.ncx = Math.floor(x1 / VRHC) - P.cx0 + 1; P.ncz = Math.floor(z1 / VRHC) - P.cz0 + 1; P.cells = new Array(P.ncx * P.ncz);
    const add = (i) => { const k = (Math.floor(T.pz[i] / VRHC) - P.cz0) * P.ncx + Math.floor(T.px[i] / VRHC) - P.cx0; (P.cells[k] || (P.cells[k] = [])).push(i); };
    for (let i = 0; i < N; i += 2) add(i); if ((N - 1) % 2) add(N - 1);
    // the terrain (def.dem, a 32 m grid): a 256 m trend (2 bytes a node, big-endian, 0.1 m steps) and 1 m residuals in each row's span of cells near
    // the road (D.rows [first cell, count]); heights above the road's zero (D.base: the height of the start line above the sea)
    const D = def.dem, TR = D.tr, tb = atob(TR.b64), tr = new Float32Array(TR.nx * TR.nz);
    for (let k = 0; k < tr.length; k++) tr[k] = TR.lo + (tb.charCodeAt(2 * k) * 256 + tb.charCodeAt(2 * k + 1)) * TR.step;
    const rb = atob(D.res), dem = new Float32Array(D.nx * D.nz); let q = 0;
    for (let j = 0; j < D.nz; j++) { const a = D.rows[j][0], n = D.rows[j][1], fj = j / TR.f, tj = Math.min(TR.nz - 2, Math.floor(fj)), v = fj - tj;
      for (let i = 0; i < D.nx; i++) { const fi = i / TR.f, ti = Math.min(TR.nx - 2, Math.floor(fi)), u = fi - ti, k0 = tj * TR.nx + ti;
        let h = (tr[k0] * (1 - u) + tr[k0 + 1] * u) * (1 - v) + (tr[k0 + TR.nx] * (1 - u) + tr[k0 + TR.nx + 1] * u) * v;
        if (i >= a && i < a + n) h += rb.charCodeAt(q++) - 128;
        dem[j * D.nx + i] = h - D.base; } }
    P.dem = dem; P.D = D;
    // land cover (def.lc, 16 m cells, run-length coded: a symbol = class * 8 + run - 1; a run of 8 or more: 7, then digits of 64 until one below 63):
    // 0 open, 1 forest, 2 dwarf pine and scrub, 3 settlement, 4 rock and scree, 5 water
    const L = def.lc, lc = new Uint8Array(L.nx * L.nz), dg = new Int8Array(128); for (let k = 0; k < 64; k++) dg[NR_A64.charCodeAt(k)] = k;
    for (let p = 0, k = 0; k < lc.length;) { const s = dg[L.rle.charCodeAt(p++)]; let n = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = dg[L.rle.charCodeAt(p++)]; n += e; } while (e === 63 && p < L.rle.length); } lc.fill(s >> 3, k, Math.min(lc.length, k + n)); k += n; }
    P.lc = lc; P.L = L;
    // distance to the road centre line on a 16 m grid (chamfer transform seeded with the road samples)
    const dc = 16, dnx = Math.ceil((x1 - x0) / dc) + 1, dnz = Math.ceil((z1 - z0) / dc) + 1, dist = new Float32Array(dnx * dnz).fill(1e9);
    for (let i = 0; i < N; i++) { const a = Math.round((T.px[i] - x0) / dc), b = Math.round((T.pz[i] - z0) / dc); dist[b * dnx + a] = 0; }
    nrChamfer(dist, dnx, dnz, dc);
    Object.assign(P, { dc, dnx, dnz, dist });
    P.n1 = valueNoise2(611, 90); P.n2 = valueNoise2(612, 30); P.n3 = valueNoise2(613, 55); P.n4 = valueNoise2(614, 14); P.n5 = valueNoise2(615, 70); P.n6 = valueNoise2(616, 7); P.n7 = valueNoise2(617, 38);
    // the lakes (def.lakes [area, x, z, x, z, ...]: the shore polygons): the water a little below the shore and well below the road beside it
    P.lakes = (def.lakes || []).map((a) => { const poly = []; for (let k = 1; k + 1 < a.length; k += 2) poly.push([a[k], a[k + 1]]);
      let lx0 = 1e9, lx1 = -1e9, lz0 = 1e9, lz1 = -1e9, h = 1e9, cx = 0, cz = 0;
      for (const [x, z] of poly) { lx0 = Math.min(lx0, x); lx1 = Math.max(lx1, x); lz0 = Math.min(lz0, z); lz1 = Math.max(lz1, z); h = Math.min(h, vrDem(x, z)); cx += x / poly.length; cz += z / poly.length; }
      const i = T.nearestIdx(cx, cz);
      return { poly, x0: lx0, x1: lx1, z0: lz0, z1: lz1, h: Math.min(h - 0.6, T.hy[i] - 1.8), area: a[0], cx, cz, near: Math.min(...poly.map(([x, z]) => { const k = T.nearestIdx(x, z); return Math.hypot(x - T.px[k], z - T.pz[k]); })) }; }).filter(L => L.near < 380);   // (only those the corridor reaches)
    // under each longer bridge (def.bridges [from, to], metres after the start line) a gully for the stream, straight across the road
    for (const [a, b] of def.bridges || []) { if (b - a < 15) continue;
      const i = T.idx(T.startS + (a + b) / 2), half = (b - a) / 2;
      P.gul.push({ i, half, x: T.px[i], z: T.pz[i], tx: T.tx[i], tz: T.tz[i], nx: T.nx[i], nz: T.nz[i], y: T.hy[i] - clamp(2.5 + (b - a) * 0.07, 3, 6.5), bw: Math.min(8, half * 0.5) }); }
    // terrain height grid (filled lazily, NaN = not computed yet) and the distance beyond the nearest barrier at each vertex
    const G = P.G = { x0, z0 }; G.ntx = Math.ceil((x1 - x0) / (VRC * VRT)); G.ntz = Math.ceil((z1 - z0) / (VRC * VRT)); G.nx = G.ntx * VRT + 1; G.nz = G.ntz * VRT + 1;
    G.h = new Float32Array(G.nx * G.nz).fill(NaN); G.dd = new Float32Array(G.nx * G.nz); G.on = new Uint8Array(G.ntx * G.ntz);
    vrStubs();   // (the side roads: the terrain levelled under them, vrStubH)
  }
  function vrDist(x, z) {   // distance to the road centre line (bilinear on the chamfer grid)
    const P = VR, gx = clamp((x - P.x0) / P.dc, 0, P.dnx - 1.001), gz = clamp((z - P.z0) / P.dc, 0, P.dnz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = P.dnx, a = P.dist;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function vrLC(x, z) {   // land cover class at (x, z)
    const L = VR.L, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell);
    return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? 0 : VR.lc[j * L.nx + i];
  }
  function vrLCf(x, z, c) {   // share of land cover class c around (x, z), bilinear over the cell centres (soft edges for the ground colours)
    const L = VR.L, lc = VR.lc, fx = (x - L.x0) / L.cell - 0.5, fz = (z - L.z0) / L.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const at = (a, b) => (a < 0 || b < 0 || a >= L.nx || b >= L.nz ? 0 : lc[b * L.nx + a] === c ? 1 : 0);
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v;
  }
  function vrDem(x, z) {   // the real terrain (bilinear on the 32 m grid)
    const P = VR, D = P.D, gx = clamp((x - D.x0) / D.cell, 0, D.nx - 1.001), gz = clamp((z - D.z0) / D.cell, 0, D.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = D.nx, a = P.dem;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function vrNear(x, z) {   // Shepard blend of the road heights around (x, z): weights fall with the distance beyond each sample's barrier, so the legs of a hairpin blend smoothly
    const P = VR, cx = Math.floor(x / VRHC) - P.cx0, cz = Math.floor(z / VRHC) - P.cz0, ds = T.ds;
    let ws = 0, hs = 0, bd = 1e9, bi = -1, bl = 0, ba = 0, bdd = 1e9;
    for (let b = Math.max(0, cz - 2); b <= Math.min(P.ncz - 1, cz + 2); b++) for (let a = Math.max(0, cx - 2); a <= Math.min(P.ncx - 1, cx + 2); a++) {
      const L = P.cells[b * P.ncx + a]; if (!L) continue;
      for (let q = 0; q < L.length; q++) {
        const i = L[q], dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], lat = dx * T.nx[i] + dz * T.nz[i], ex = Math.max(0, Math.abs(al) - ds), d = Math.sqrt(lat * lat + ex * ex);
        if (d >= 64) continue;
        const dd = Math.max(0, d - (lat > 0 ? T.br[i] : T.bl[i])), k = 1 / (dd + 1.5), wq = k * k * k * k * (d < 48 ? 1 : sstep(64, 48, d));
        ws += wq; hs += wq * T.hy[i];
        if (d < bd) { bd = d; bi = i; bl = lat; ba = al; }
        if (dd < bdd) bdd = dd;
      }
    }
    VRN.i = bi; VRN.d = bd; VRN.dd = bdd; VRN.lat = bl;
    if (bi < 0) return VRN;
    VRN.h = hs / ws;
    const f = clamp(bi + ba / ds, 0, T.N - 1), i0 = Math.min(T.N - 2, Math.floor(f)); VRN.hn = T.hy[i0] + (T.hy[i0 + 1] - T.hy[i0]) * (f - i0);   // road height across from the point
    return VRN;
  }
  function vrWater(x, z) {   // the lake at (x, z) and how far inside its shore polygon (VRW.L null: none within 40 m)
    VRW.L = null; VRW.e = -1e9;
    for (const L of VR.lakes) { if (x < L.x0 - 40 || x > L.x1 + 40 || z < L.z0 - 40 || z > L.z1 + 40) continue;
      const e = (inPoly(L.poly, x, z) ? 1 : -1) * polyDist(L.poly, x, z); if (e > VRW.e) { VRW.e = e; VRW.L = L; } }
    return VRW;
  }
  function vrFar(x, z) {   // the land away from the road: the real terrain, a little made-up relief, the lake basins
    const P = VR; let f = vrDem(x, z) + (P.n1(x, z) - 0.5) * 5 + (P.n2(x, z) - 0.5) * 2;
    const W = vrWater(x, z), L = W.L;
    if (L) { const e = W.e, shore = L.h + 0.9 - 0.35 * e; if (e > -30) f = Math.min(f, e > 0 ? Math.max(L.h - 3.5, shore) : lerp(shore, f, sstep(0, -30, e))); }   // (the water line ~3 m inside the shore polygon)
    return f;
  }
  function vrH(x, z) {   // terrain height
    const n = vrNear(x, z), i = n.i, dd = n.dd, hn = n.hn; let h;
    if (i < 0) h = vrFar(x, z);
    else { const hr = lerp(hn, n.h, sstep(0, 6, dd)) - 0.3; h = dd <= 1 ? hr : lerp(hr, vrFar(x, z), sstep(1, 42, dd)); }
    const pads = VR.pads; for (let k = 0; k < pads.length; k++) { const p = pads[k], d = Math.hypot(x - p.x, z - p.z), pb = p.b || 12; if (d < p.r + pb) h = lerp(p.h, h, sstep(p.r, p.r + pb, d)); }   // level plots: the huts, the car park at the pass
    for (const b of VR.gul) {   // a gully under a bridge: a stream bed bw wide with steep banks, out to 60 m either side (only where that bridge's own stretch is the nearest road)
      if (i < 0 || Math.abs(i - b.i) * T.ds > b.half + 30) continue;
      const dx = x - b.x, dz = z - b.z, al = Math.abs(dx * b.tx + dz * b.tz), lat = Math.abs(dx * b.nx + dz * b.nz);
      if (al < b.half + 14 && lat < 60) h = Math.min(h, lerp(h, b.y, sstep(60, 22, lat)) + Math.max(0, al - b.bw / 2) * 1.2);
    }
    if (i >= 0 && dd < 6) h = Math.min(h, hn - 0.3 + 0.12 * dd * dd);   // never above the road inside the barriers, only a gentle rise right behind them
    if (STG) h = vrStubH(x, z, h, i >= 0 ? dd : 999);   // the side roads: the ground levelled under them
    VRN.dd = i >= 0 ? dd : 999;
    return h;
  }
  // the side roads (Track.stubs, def.sideRoads; any open road with them): STG hashes them in 64 m cells (vrStubs: vrPrep does it for the
  // builders on its terrain, the others call it themselves). vrStubAt: the one whose corridor (its limit, and m metres more) holds (x, z), t
  // from the junction to its end (the rail; a building at the end stays), else null. vrStubH: the ground levelled under one: its surface
  // 0.15 m down across its width (its corners' kerb returns too) and 4 m more (no slope of the coarser terrain grids creeps over its edge),
  // back to the land 13 m out, along the whole part drawn and fading out 10 m past its end; only beyond the road's barrier line (the road's
  // own levelling inside it)
  const VRSP = { S: null, j: -1, f: 0, t: 0, u: 0, kx: 1, kz: 0 }, VRSQ = {}, VRSA = { S: null, t: 0, u: 0, hw: 0 };
  let STG = null;
  function vrStubs() {
    const g = STG = T.stubs && T.stubs.length ? new Map() : null; if (VR) VR.sg = g; if (!g) return;
    for (const S of T.stubs) { const b = S.bb;
      for (let a = Math.floor((b[0] - 14) / 64); a <= Math.floor((b[2] + 14) / 64); a++) for (let c = Math.floor((b[1] - 14) / 64); c <= Math.floor((b[3] + 14) / 64); c++) { const k = a * 65536 + c; let L = g.get(k); if (!L) g.set(k, L = []); L.push(S); } }
  }
  function vrStubAt(x, z, m) {
    const L = STG && STG.get(Math.floor(x / 64) * 65536 + Math.floor(z / 64)); if (!L) return null;
    for (const S of L) { const b = S.bb; if (x < b[0] - m || x > b[2] + m || z < b[1] - m || z > b[3] + m) continue;
      VRSP.S = null; if (!T._stubProj(S, x, z, VRSP)) continue;
      const t = VRSP.t, hw = T.stubHw(S, t, VRSP.u); if (t < 0 || t > (S.end === 2 ? S.L - 0.5 : S.Lend + 2) || Math.abs(VRSP.u) > hw + S.lim + m) continue;
      VRSA.S = S; VRSA.t = t; VRSA.u = VRSP.u; VRSA.hw = hw; return VRSA; }
    return null;
  }
  function vrStubH(x, z, h, dd) {
    const L = STG && STG.get(Math.floor(x / 64) * 65536 + Math.floor(z / 64)); if (!L || dd < 0.5) return h;
    for (const S of L) { const b = S.bb; if (x < b[0] - 8 || x > b[2] + 8 || z < b[1] - 8 || z > b[3] + 8) continue;
      VRSP.S = null; if (!T._stubProj(S, x, z, VRSP)) continue;
      const t = VRSP.t, au = Math.abs(VRSP.u), hw = T.stubHw(S, t, VRSP.u), end = S.end === 2 ? S.L + 1 : S.Lend;
      if (t < 0 || t > end + 10 || au > hw + 13) continue;
      const f = sstep(hw + 13, hw + 4, au) * sstep(end + 10, end, t) * sstep(0.5, 3, dd); if (f <= 0) continue;
      const q = au < hw + S.lim + 3 ? T.query(x, z, T.stubHint(S.k, t), VRSQ) : null, ys = q && q.k === S.k ? q.y : T.stubPt(S.k, t, VRSQ).y;   // (its surface; the profile out where the query gives the road's)
      h = lerp(h, ys - 0.15, f);
    }
    return h;
  }
  function vrGH(i, j) {   // terrain height at grid vertex (i, j), computed once
    const G = VR.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = vrH(G.x0 + i * VRC, G.z0 + j * VRC); G.dd[k] = VRN.dd; }
    return h;
  }
  function vrGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = VR.G, gx = clamp((x - G.x0) / VRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / VRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = vrGH(i, j); return a + u * (vrGH(i + 1, j) - a) + v * (vrGH(i, j + 1) - a); }
    const d = vrGH(i + 1, j + 1); return d + (1 - u) * (vrGH(i, j + 1) - d) + (1 - v) * (vrGH(i + 1, j) - d);
  }
  function vrSlope(x, z) { const a = vrGround(x - 2.5, z), b = vrGround(x + 2.5, z), c = vrGround(x, z - 2.5), d = vrGround(x, z + 2.5); return Math.hypot(b - a, d - c) / 5; }
  function vrSnow(x, z, A, ny) {   // how much of the first snow of the autumn lies at (x, z) (A: metres above the sea, ny: the ground's slope): from ~1480 m on the flatter
    // ground, nearly everywhere round the pass; it slides off the steep faces
    if (VRS === 'summer') return 0;   // (no snow in summer)
    const line = 1480 + (VR.n5(x, z) - 0.5) * 110;
    return sstep(line, line + 90, A) * sstep(0.5, 0.74, ny);
  }
  function vrCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map): tawny autumn meadows (red bilberry leaves higher up), the copper leaf litter under the
    // beeches and brown needles under the conifers, dark ground under the dwarf pines, lawns in the village, pale limestone scree and every steep face,
    // the first snow near the top, a trodden verge
    const P = VR, m = P.n3(x, z), q = P.n4(x, z), A = h + P.D.base, up = sstep(1050, 1450, A);
    const fo = vrLCf(x, z, 1), sc = vrLCf(x, z, 2), se = vrLCf(x, z, 3), rk = vrLCf(x, z, 4);
    const su = VRS === 'summer', ms = sstep(0.5, 0.78, P.n7(x * 1.7 + 90, z * 1.7)) * 0.7;
    let r, g, b, lr, lg, lb;
    if (su) {
      r = 0.36 + (m - 0.5) * 0.1 + (q - 0.5) * 0.08; g = 0.52 + (m - 0.5) * 0.1 + (q - 0.5) * 0.06; b = 0.2 + (m - 0.5) * 0.05;   // fresh meadow grass
      const lu = sstep(0.38, 0.72, P.n2(x, z)) * lerp(0.7, 0.3, up); r = lerp(r, 0.27, lu); g = lerp(g, 0.44, lu); b = lerp(b, 0.15, lu);   // lush, darker patches (most in the valley)
      const al = up * 0.55; r = lerp(r, 0.44 + (m - 0.5) * 0.08, al); g = lerp(g, 0.5, al); b = lerp(b, 0.27, al);   // higher up the short, grey-green alpine sward
      const bil = up * sstep(0.52, 0.76, P.n7(x, z)) * 0.6; r = lerp(r, 0.24, bil); g = lerp(g, 0.36, bil); b = lerp(b, 0.14, bil);   // bilberry and alpenrose: dark green
      lr = lerp(lerp(0.36, 0.3, up), 0.22, ms); lg = lerp(lerp(0.34, 0.3, up), 0.33, ms); lb = lerp(0.17, 0.13, ms);   // last year's leaves and needles, moss in patches
    } else {
      r = 0.64 + (m - 0.5) * 0.14 + (q - 0.5) * 0.1; g = 0.54 + (m - 0.5) * 0.1 + (q - 0.5) * 0.07; b = 0.3 + (m - 0.5) * 0.06;   // dry autumn grass
      const gr = sstep(0.38, 0.72, P.n2(x, z)) * lerp(0.85, 0.3, up); r = lerp(r, 0.4, gr); g = lerp(g, 0.5, gr); b = lerp(b, 0.22, gr);   // patches still green (most in the valley, few up high)
      const bil = up * sstep(0.52, 0.76, P.n7(x, z)) * 0.75; r = lerp(r, 0.6, bil); g = lerp(g, 0.25, bil); b = lerp(b, 0.14, bil);   // bilberry leaves turned red
      lr = lerp(lerp(0.5, 0.34, up), 0.25, ms); lg = lerp(lerp(0.32, 0.29, up), 0.32, ms); lb = lerp(0.17, 0.14, ms);   // beech leaves low, needles higher, moss in patches
    }
    r = lerp(r, lr + m * 0.07, fo); g = lerp(g, lg + m * 0.05, fo); b = lerp(b, lb + m * 0.03, fo);
    r = lerp(r, 0.22 + m * 0.05, sc * 0.8); g = lerp(g, 0.28 + m * 0.05, sc * 0.8); b = lerp(b, 0.15, sc * 0.8);   // under the dwarf pines
    r = lerp(r, su ? 0.34 : 0.44, se * 0.6); g = lerp(g, su ? 0.5 : 0.52, se * 0.6); b = lerp(b, su ? 0.2 : 0.26, se * 0.6);   // lawns and gardens
    const st = Math.max(rk * 0.9, sstep(0.8, 0.58, ny) * 0.95);   // scree and rock, and every steep face: limestone
    r = lerp(r, 0.78 + m * 0.07, st); g = lerp(g, 0.77 + m * 0.06, st); b = lerp(b, 0.74 + m * 0.06, st);
    const sn = vrSnow(x, z, A, ny); r = lerp(r, 1.04, sn); g = lerp(g, 1.06, sn); b = lerp(b, 1.12, sn);
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.4 * (1 - sn); r = lerp(r, su ? 0.48 : 0.54, t); g = lerp(g, su ? 0.5 : 0.49, t); b = lerp(b, su ? 0.32 : 0.36, t); }   // trodden verge
    VRCOL[0] = r; VRCOL[1] = g; VRCOL[2] = b; return VRCOL;
  }
  function vrGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in vrTileGeo)
    const G = VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = vrGH(ii, jj);
      const nx = (vrGH(ii + 1, jj) - vrGH(ii - 1, jj)) / (2 * VRC), nz = (vrGH(ii, jj + 1) - vrGH(ii, jj - 1)) / (2 * VRC), c = vrCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / Math.hypot(nx, 1, nz), G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function vrTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells, in the haze)
    const G = VR.G, L = VRC * VRT, d = vrDist(G.x0 + (ti + 0.5) * L, G.z0 + (tj + 0.5) * L);
    return d < 300 ? 1 : d < 430 ? 2 : 0;
  }
  function vrTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex): indexed, normals from the shared grid (no seams between tiles); 'steep' for pkGroundMat
    const G = VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = vrGH(i, j);
      let nx = -(vrGH(i + st, j) - vrGH(i - st, j)) / (2 * VRC * st), nz = -(vrGH(i, j + st) - vrGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = vrCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // an edge shared with a coarse tile runs straight between every other vertex there: the fine tile's in-between vertices go onto that line (no cracks)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? vrTileOn(a, b) : 0);
      const fix = (k0, dk) => { for (let q = 1; q < m; q += 2) { const a = k0 + (q - 1) * dk, b = k0 + (q + 1) * dk; pos[(k0 + q * dk) * 3 + 1] = (pos[a * 3 + 1] + pos[b * 3 + 1]) / 2; } };
      if (nb(ti, tj - 1) === 2) fix(0, 1); if (nb(ti, tj + 1) === 2) fix(m * n, 1); if (nb(ti - 1, tj) === 2) fix(0, n); if (nb(ti + 1, tj) === 2) fix(m, n);
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('steep', new THREE.BufferAttribute(stp, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }
  let vrATex = null, vrAKey = '', vrA2Tex = null, vrA2Key = '';   // the board atlases are made once and reused by every Vršič build (the teardown frees materials, not maps)
  const VR_HUTS = [['Mihov dom', '1085 m'], ['Koča na Gozdu', '1226 m'], ['Erjavčeva koča', '1525 m'], ['Tičarjev dom', '1620 m'], ['Poštarski dom', '1688 m'], ['Tonkina koča', ''], ['Ruska kapelica', '1200 m'], ['Jasna', '']];
  function vrAtlas(cps) {   // text boards (8 rows of 1024 x 128): START, CILJ, CP1-CP4 with the altitude, the pass sign, the race's banner
    if (vrATex && vrAKey === cps.join('|')) return vrATex;
    if (vrATex) vrATex.dispose(); vrAKey = cps.join('|');
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 104, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(312, 142, 400, 100); txt('CILJ', 512, 196, 96, '#111', 380);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#1e6b3a'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#5a3a22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#efe3c8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('PRELAZ VRŠIČ', 512, 812, 58, '#f3ead6', 900); txt('1.611 m', 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#1d4f9a'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#fff'; x.fillRect(0, 900, 1024, 8); x.fillStyle = '#d8261e'; x.fillRect(0, 1012, 1024, 8);
    txt('GORSKA DIRKA VRŠIČ', 512, 962, 80, '#fff', 960);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (vrATex = t);
  }
  function vrAtlas2(hp) {   // the small signs: rows 0-2, the hairpins' number and altitude (8 a row, 128 x 128 each); rows 3-6, the mountain huts' boards (two a row,
    // 512 x 128: dark wood, the name and the altitude in cream)
    const key = hp.map(h => h[1]).join(',');
    if (vrA2Tex && vrA2Key === key) return vrA2Tex;
    if (vrA2Tex) vrA2Tex.dispose(); vrA2Key = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w, wt) => { x.fillStyle = col; x.font = (wt || 900) + ' ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    hp.forEach((h, k) => { const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128;
      x.fillStyle = '#16181c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f6f5f0'; x.fillRect(x0 + 7, y0 + 7, 114, 114);
      txt(String(k + 1), x0 + 64, y0 + 52, 66, '#16181c', 110); txt(String(h[1]).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m', x0 + 64, y0 + 100, 26, '#16181c', 108, 700); });
    VR_HUTS.forEach(([n, a], k) => { const x0 = (k % 2) * 512, y0 = 384 + Math.floor(k / 2) * 128;
      x.fillStyle = '#4a2f1c'; x.fillRect(x0, y0, 512, 128); x.strokeStyle = '#e9dcc0'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      if (a) { txt(n, x0 + 256, y0 + 50, 50, '#f3ead6', 470); txt(a, x0 + 256, y0 + 96, 30, '#f3ead6', 470, 700); } else txt(n, x0 + 256, y0 + 66, 56, '#f3ead6', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (vrA2Tex = t);
  }
  function vrTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them): 0 Norway spruce, 1 European larch in its autumn gold, 2 beech (copper and orange),
    // 3 dwarf pine (a low, wide mound: the instances flatten it), 4 birch or rowan (yellow); 5-7 the spruce, the larch and the dwarf pine under the first snow
    const g = new GB(), R = rng(640 + kind), rs = API.ROCK_SMOOTH, snow = [0.93, 0.95, 0.99];
    API.ROCK_SMOOTH = kind === 2 || kind === 3 || kind === 4 || kind === 7;   // (soft, rounded crowns on the broadleaves and the dwarf pines)
    if (kind === 0 || kind === 5) {   // spruce: four drooping tiers down to the ground and a spire, dark inside, the branch tips lighter; under snow white out to the tips
      const col = [0.085, 0.175, 0.11], tip = [0.17, 0.3, 0.19];
      [[0.02, 0.31, 0.32, 0.06], [0.23, 0.25, 0.31, 0.05], [0.44, 0.19, 0.28, 0.045], [0.61, 0.13, 0.24, 0.035]].forEach(([y, r, h, dr], k) => {
        const kk = k % 2 ? 1.1 : 1, c = [col[0] * kk, col[1] * kk, col[2] * kk]; starCone(g, 0, y, 0, r, h, 5, kind === 5 ? snow : c, kind === 5 ? c : tip, k * 0.66, dr); });
      cone(g, 0, 0.78, 0, 0.055, 0.22, 4, kind === 5 ? snow : col, tip, 0.4);
    } else if (kind === 1 || kind === 6) {   // larch: a slim trunk, five light, open tiers of drooping branches and a thin spire, golden (under snow: white on the tips)
      const col = VRS === 'summer' ? [0.3, 0.48, 0.16] : [0.86, 0.6, 0.16], tip = VRS === 'summer' ? [0.48, 0.66, 0.26] : [0.97, 0.8, 0.32];
      cyl(g, 0, -0.02, 0, 0.018, 0.3, 3, [0.36, 0.26, 0.18], null, 0.012);
      [[0.1, 0.27, 0.26], [0.26, 0.23, 0.24], [0.42, 0.18, 0.22], [0.57, 0.13, 0.2], [0.71, 0.09, 0.18]].forEach(([y, r, h], k) => starCone(g, 0, y, 0, r, h, 4, kind === 6 ? snow : col, kind === 6 ? col : tip, k * 0.9 + 0.3, 0.05));
      cone(g, 0, 0.86, 0, 0.035, 0.14, 3, col, tip, 0.2);
    } else if (kind === 2) {   // beech: a smooth grey trunk, a broad crown of three clumps
      cyl(g, 0, -0.02, 0, 0.03, 0.45, 4, [0.55, 0.55, 0.52], null, 0.022);
      const su = VRS === 'summer';
      ico(g, 0, 0.62, 0, 0.3, 0.72, su ? [0.2, 0.36, 0.12] : [0.82, 0.44, 0.13], R, 0.3); ico(g, 0.14, 0.5, 0.08, 0.2, 0.8, su ? [0.18, 0.32, 0.11] : [0.76, 0.38, 0.11], R, 0.35); ico(g, -0.13, 0.52, -0.08, 0.2, 0.8, su ? [0.24, 0.4, 0.14] : [0.86, 0.52, 0.16], R, 0.35);
    } else if (kind === 3 || kind === 7) {   // dwarf pine: a mound of dark needle clumps (under snow a white cap on it)
      const col = [0.11, 0.21, 0.1];
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R() * 0.5, d = k ? 0.3 : 0; ico(g, Math.cos(a) * d, 0.4 - d * 0.45, Math.sin(a) * d, 0.3, 0.8, vary(col, R, 0.2), R, 0.35); }
      if (kind === 7) ico(g, 0.02, 0.6, 0, 0.34, 0.34, snow, R, 0.25);
    } else {   // birch (a rowan when the instance tints it red): a slim white trunk, a light crown of two clumps in autumn yellow
      cyl(g, 0, -0.02, 0, 0.019, 0.16, 3, [0.3, 0.28, 0.26], null, 0.016); cyl(g, 0, 0.14, 0, 0.016, 0.5, 3, [0.9, 0.9, 0.86], null, 0.009);
      ico(g, 0, 0.7, 0, 0.15, 1.5, VRS === 'summer' ? [0.28, 0.44, 0.14] : [0.9, 0.72, 0.2], R, 0.3); ico(g, 0.07, 0.56, -0.05, 0.1, 1.2, VRS === 'summer' ? [0.31, 0.47, 0.16] : [0.86, 0.66, 0.18], R, 0.35);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // an alpine house on the facade material (walls with the window and shutter texture, fac: a GB with uvs): a stone plinth (the cellar on the low
  // side of a slope), white or cream plastered storeys, a timber gable under a wide, low roof with deep eaves. y0 / y1: the lowest and highest ground
  // under it; fl: storeys; o: { wall, wood, roof }
  function vrHouse(g, fac, x, y0, y1, z, rot, L, D, fl, o) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (u, v, y) => [x + c * u - s * v, y, z + s * u + c * v], yb = y1 + 0.35, H = fl * 2.9;
    box(g, x, y0 - 0.5, z, L + 0.3, yb - y0 + 0.5, D + 0.3, rot, [0.55, 0.53, 0.5], null, true);
    const cs = [[-L / 2, -D / 2], [L / 2, -D / 2], [L / 2, D / 2], [-L / 2, D / 2]];
    for (let e = 0; e < 4; e++) { const [u0, v0] = cs[e], [u1, v1] = cs[(e + 1) % 4], bays = Math.max(1, Math.round(Math.hypot(u1 - u0, v1 - v0) / 3.4));
      fac.quadO(P(u0, v0, yb), P(u1, v1, yb), P(u1, v1, yb + H), P(u0, v0, yb + H), o.wall, [x, yb + H / 2, z], [[0, 0], [bays, 0], [bays, fl], [0, fl]]); }
    const rh = Math.min(D, L) * 0.27;
    gable(g, x, yb + H, z, L + 1.8, D + 1.8, rh, rot, o.roof, o.wood);
    box(g, x, yb + H - 0.35, z, L + 0.1, 0.35, D + 0.1, rot, o.wood, null, true);   // the timber band under the eaves
  }
  // a mountain hut: a whitewashed stone ground floor, a timber upper floor, small windows with green shutters, a steep roof (snow on it near the pass), a chimney
  function vrHut(g, x, y, z, rot, L, D, snow) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (u, v) => [x + c * u - s * v, z + s * u + c * v], wood = [0.42, 0.28, 0.17], wall = [0.9, 0.88, 0.82];
    box(g, x, y - 1.4, z, L + 0.3, 1.7, D + 0.3, rot, [0.52, 0.5, 0.47], null, true);
    box(g, x, y + 0.3, z, L, 3.0, D, rot, wall, null, true);
    box(g, x, y + 3.3, z, L, 2.8, D, rot, wood, null, true);
    const nw = Math.max(2, Math.min(6, Math.floor(L / 3)));
    for (const v of [-D / 2 - 0.05, D / 2 + 0.05]) for (let k = 0; k < nw; k++) { const u = (k + 0.5 - nw / 2) * (L / nw), [px, pz] = P(u, v);
      for (const yy of [1.2, 4.1]) { box(g, px, y + yy, pz, 0.9, 1.1, 0.12, rot, [0.14, 0.16, 0.2], null, true);
        for (const q of [-0.62, 0.62]) box(g, px + c * q, y + yy, pz + s * q, 0.34, 1.1, 0.14, rot, [0.2, 0.42, 0.26], null, true); } }
    const rh = D * 0.38; gable(g, x, y + 6.1, z, L + 1.4, D + 1.6, rh, rot, snow ? [0.9, 0.92, 0.96] : [0.34, 0.34, 0.36], wood);
    const [cx, cz] = P(L * 0.25, 0); box(g, cx, y + 6.1, cz, 0.6, rh + 1.0, 0.6, rot, [0.6, 0.58, 0.55], null, true);
  }
  // the Russian Chapel (1916: built by the Russian prisoners of war who made the road, in memory of their comrades killed by an avalanche): a small log
  // church on a stone base, a steep shingle roof, a porch at the front, an onion dome on a tower over the porch and a smaller one over the apse
  function vrChapel(g, x, y, z, rot, R) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (u, v) => [x + c * u - s * v, z + s * u + c * v], logs = [0.4, 0.27, 0.16], shing = [0.3, 0.22, 0.15], stone = [0.6, 0.58, 0.54];
    box(g, x, y - 1.2, z, 8.6, 1.7, 5.4, rot, stone, null, true);
    box(g, x, y + 0.5, z, 7.6, 3.2, 4.8, rot, logs, null, true);
    gable(g, x, y + 3.7, z, 8.4, 5.9, 3.3, rot, shing, logs);
    { const [px, pz] = P(4.6, 0); box(g, px, y + 0.5, pz, 1.8, 2.6, 3.2, rot, logs, null, true); gable(g, px, y + 3.1, pz, 2.2, 3.8, 1.3, rot + Math.PI / 2, shing, logs); }   // the porch
    const dome = (u, h, r) => { const [px, pz] = P(u, 0); box(g, px, y + 3.7, pz, r * 1.9, h, r * 1.9, rot, logs, null, true);   // a square tower, the onion dome, a spike and a cross
      API.ROCK_SMOOTH = true; ico(g, px, y + 3.7 + h + r * 0.75, pz, r * 1.15, 1.15, shing, R, 0.05); API.ROCK_SMOOTH = false;
      cone(g, px, y + 3.7 + h + r * 1.55, pz, r * 0.45, r * 1.2, 6, shing, shing, 0);
      const ct = y + 3.7 + h + r * 2.7, gold = [0.8, 0.66, 0.3]; box(g, px, ct, pz, 0.08, 0.9, 0.08, rot, gold); box(g, px, ct + 0.55, pz, 0.08, 0.08, 0.5, rot, gold); };
    dome(3.4, 3.2, 0.8); dome(-3.2, 1.6, 0.55);
  }
  // Zlatorog, the golden-horned chamois buck of the legend, in bronze on a rock by the lake at Jasna (y: the top of the rock; facing along rot)
  function vrGoat(g, x, y, z, rot) {
    const c = Math.cos(rot), s = Math.sin(rot), at = (u, v, h) => [x + c * u - s * v, y + h, z + s * u + c * v], br = [0.34, 0.28, 0.19], gold = [0.88, 0.7, 0.26];
    box(g, x, y + 0.9, z, 1.7, 0.72, 0.62, rot, br);
    for (const [u, v] of [[0.62, -0.2], [0.62, 0.2], [-0.62, -0.2], [-0.62, 0.2]]) API.ouRod(g, at(u, v, 1.0), at(u * 1.12, v, 0), 0.07, br, 4);
    API.ouRod(g, at(0.72, 0, 1.45), at(1.05, 0, 1.95), 0.16, br, 5);
    { const [hx, , hz] = at(1.2, 0, 0); box(g, hx, y + 1.85, hz, 0.55, 0.32, 0.3, rot, br); }
    for (const v of [-0.1, 0.1]) { API.ouRod(g, at(1.1, v, 2.1), at(0.95, v * 1.6, 2.65), 0.05, gold, 4); API.ouRod(g, at(0.95, v * 1.6, 2.65), at(0.72, v * 2, 2.8), 0.045, gold, 4); API.ouRod(g, at(0.72, v * 2, 2.8), at(0.55, v * 2.2, 2.62), 0.04, gold, 4); }
  }
  // the knockable roadside posts (stebrički; the orange snow poles high up: col 1): where buildVrsic wanted one (spots: [[i, side]]), only within w + 2 and on
  // level verge, never on the start grid. The props stand on the verge's own height. Drawn out to 150 m
  function vrsicProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30, alt = (i) => T.hy[i] + VR.D.base;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: (i) => (alt(i) > 1450 ? 1 : 0), exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }
  // the verge ribbons' grit: Pikes Peak's (pkTex: the grey grit in r, its relief in g, glints in b, read by its own ground shader) as a plain
  // grey map (r in all three channels), the vertex colours giving the hue
  let vrGTex = null;
  function vrGritTex() {
    if (vrGTex) return vrGTex;
    const src = API.pkTex().image, S = src.width, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    x.drawImage(src, 0, 0); const img = x.getImageData(0, 0, S, S), d = img.data; for (let o = 0; o < d.length; o += 4) d[o + 1] = d[o + 2] = d[o];
    x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    return (vrGTex = t);
  }
  /* ---- the side roads of an open road (Track.stubs, def.sideRoads: the streets, service roads, driveways and forest roads that meet it, from
     OpenStreetMap), shared by the builders. A junction as on the real road: the side road's own surface (asphalt, or gravel) from the road's
     edge, its two corners rounded by the kerb returns (each an arc of radius S.cr tangent to the road's edge and to the side road's; the one on
     the side where it leaves at a sharp angle long, the other short: stubCorner), its shoulders past them, the far part (past the rail) fading
     into the ground; across its lane at the road's edge the stop line (or the give-way line, 50 cm dashes); the road's own edge line broken
     across the mouth, from one arc's end to the other's (mouthE: none there, or 2 m dashes); the ground levelled under it (vrStubH); nothing
     grows or stands on it (stubExcl); the verge at its surface across the mouth, no ditch (stubVerge); the barrier open across it (T.gap:
     stubRails). stubGeo draws the surfaces into the road's own 120 m chunks (emit: no draw call of their own); stubProps the knockable posts
     and cones, the rail or the gate at its end with the closure board, the street's name. ---- */
  function stubCorner(S, c) {   // corner c (0: left of it going in, 1: right): its apex V (where the two edges meet) and the arc's points from its own edge to the road's, each [x, z]; UT: each one's [t, u] on the side road (the texture's way)
    const k = S.k, sg = c ? 1 : -1, r = S.cr, lt = S.lt[c], th = S.th[c], tv = S.tv[c], n = Math.max(3, Math.ceil((Math.PI - th) / 0.2)), F = {}, Q = {}, w = T.w;
    const at = (a, e) => { const p = T.stubPt(k, tv + a, F), u = sg * (S.hw + e); return [p.x - p.tz * u, p.z + p.tx * u]; };
    const edge = (P, onto) => { const q = T.query(P[0], P[1], S.i0, Q); if (q.deep) return P; const e = w + 0.02 - Math.abs(q.d), sd = q.d >= 0 ? 1 : -1;   // (onto the road's edge along its normal: a point on its asphalt out, onto: one short of it in too)
      if (e > 0 || onto) { P[0] += q.nx * sd * e; P[1] += q.nz * sd * e; } return P; };
    const V = edge(at(0, 0), true), A = [], UT = [[tv, sg * S.hw]];
    for (let m = 0; m <= n; m++) { const ph = -Math.PI / 2 - (Math.PI - th) * m / n, a = lt + r * Math.cos(ph), e = r + r * Math.sin(ph); A.push(edge(at(a, e), m === n)); UT.push([tv + a, sg * (S.hw + e)]); }
    return { V, A, UT };
  }
  function stubGeo(K) {
    const w = T.w, N = T.N, Q = {}, F = {}, RS = rng(7671), list = T.stubs || [];
    const dash = K.edge === 'dash', lh = !!T.def.leftHand, yAt = (x, z, S, t) => T.yAt(T.query(x, z, T.stubHint(S.k, t), Q));   // (the surface there, as the cars drive on it)
    // the corners, and where the mouth crosses the road's edge: from one arc's end to the other's (mouthE), the verge at its surface there and where the barrier is open (mouthV)
    const cor = list.map(S => [stubCorner(S, 0), stubCorner(S, 1)]);
    const mouthE = [new Uint8Array(N), new Uint8Array(N)], mouthV = [new Uint8Array(N), new Uint8Array(N)];
    list.forEach((S, n) => { const si = S.side > 0 ? 1 : 0; let a = 1e9, b = -1e9;
      for (const C of cor[n]) for (const P of [C.V, C.A[C.A.length - 1]]) { const s = T.query(P[0], P[1], S.i0, Q).s; a = Math.min(a, s); b = Math.max(b, s); }
      for (let i = Math.max(0, Math.floor((a - 0.6) / T.ds)); i <= Math.min(N - 1, Math.ceil((b + 0.6) / T.ds)); i++) { mouthE[si][i] = 1; mouthV[si][i] = 1; }
      if (T.gap) for (let i = Math.max(0, S.i0 - 80); i <= Math.min(N - 1, S.i0 + 80); i++) if (T.gap[si][i]) mouthV[si][i] = 1; });
    const edgeOn = (si, i, j) => !(mouthE[si][i] || mouthE[si][j]) || (dash && i % 2 === 0);
    // the surfaces of side road n into the chunk's builders (G.a asphalt, G.s gravel and the shoulders, G.l lines)
    const draw = (S, n, G) => {
      const k = S.k, paved = !S.grav, tEnd = S.end === 2 ? S.L + 0.5 : S.Lend, hw = S.hw, gC = K.gCol, pC = K.paveC || [0.84, 0.84, 0.86], vC = K.gravC || [0.66, 0.58, 0.48], sC = K.shC || vC;
      const sh = RS() * 0.08 + 0.92, pc = paved ? [pC[0] * sh, pC[1] * sh, pC[2] * sh] : vC, GS = paved ? G.a : G.s, uvS = paved ? (u, t) => [(u + 4) / 8, t / 8] : (u, t) => [u / 4, t / 6];
      const tA = Math.max(0, Math.min(S.tv[0], S.tv[1], S.te) - 1.5), tC = Math.max(S.tv[0] + S.lt[0], S.tv[1] + S.lt[1]) + 2, secs = [];
      for (let t = tA; ; t += t < tC ? 1 : 2) { const tt = Math.min(t, tEnd), p = T.stubPt(k, tt, F), nx = -p.tz, nz = p.tx;
        const shL = 0.6 * sstep(0, 1.5, tt - S.tv[0] - S.lt[0]), shR = 0.6 * sstep(0, 1.5, tt - S.tv[1] - S.lt[1]), us = [-hw - shL, -hw, -hw / 2, 0, hw / 2, hw, hw + shR];
        const fade = tEnd > S.L + 10 ? sstep(S.L + 6, tEnd, tt) : 0, sink = tEnd > S.L + 10 ? sstep(tEnd - 6, tEnd, tt) * 0.12 : 0;   // (the road on past the rail fades into the ground; one ending at a building does not)
        secs.push({ t: tt, pts: us.map((u, j) => { let x = p.x + nx * u, z = p.z + nz * u;
          for (let it = 0; it < 3; it++) { const q = T.query(x, z, S.i0, Q); if (q.deep) break; const e = w + 0.02 - Math.abs(q.d); if (e <= 0) break; const sa = Math.max(0.3, Math.abs(p.tx * q.nx + p.tz * q.nz)); x += p.tx * e / sa; z += p.tz * e / sa; }   // (onto the road's edge, along the side road)
          const out = j === 0 || j === 6, y = yAt(x, z, S, tt) + (out ? 0.035 : 0.055) - sink, gc = gC(x, z), c = out ? [lerp(sC[0], gc[0], 0.6), lerp(sC[1], gc[1], 0.6), lerp(sC[2], gc[2], 0.6)] : pc;
          return [x, y, z, [lerp(c[0], gc[0], fade), lerp(c[1], gc[1], fade), lerp(c[2], gc[2], fade)], u, tt]; }) });
        if (tt >= tEnd) break; }
      for (let a = 0; a + 1 < secs.length; a++) { const A = secs[a].pts, B = secs[a + 1].pts;
        for (let j = 0; j < 6; j++) { const p = A[j], q = A[j + 1], r = B[j + 1], s = B[j]; if (Math.hypot(p[0] - q[0], p[2] - q[2]) + Math.hypot(s[0] - r[0], s[2] - r[2]) < 0.05) continue;
          const g = j === 0 || j === 5 ? G.s : GS, uv = j === 0 || j === 5 ? (P) => [P[4] / 4, P[5] / 6] : (P) => uvS(P[4], P[5]);
          g.quadUp([p[0], p[1], p[2]], [q[0], q[1], q[2]], [r[0], r[1], r[2]], [s[0], s[1], s[2]], [p[3], q[3], r[3], s[3]], [uv(p), uv(q), uv(r), uv(s)]); } }
      // the two kerb returns: a fan from the corner's apex to its arc
      for (const C of cor[n]) { const P = [C.V, ...C.A].map(([x, z]) => [x, yAt(x, z, S, S.te) + 0.055, z]), uv = C.UT.map(([t, u]) => uvS(u, t));
        for (let m = 1; m + 1 < P.length; m++) { const a = P[0], b = P[m], c = P[m + 1]; if (Math.abs((b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0])) < 1e-3) continue;
          GS.triUp(a, b, c, [pc, pc, pc], [uv[0], uv[m], uv[m + 1]]); } }
      // across its lane out at the road's edge (paved streets and service roads, not the narrow driveways): the stop line (solid) or the give-way line (dashes)
      if (paved && hw >= 2.2 && K.line !== 'none') { const u0 = lh ? 0.15 : -hw + 0.2, u1 = lh ? hw - 0.2 : -0.15, wht = [0.95, 0.95, 0.92];
        let tl = 0; for (const u of [u0, (u0 + u1) / 2, u1]) for (let t = Math.max(0, S.te - 6); t < S.te + 30; t += 0.25) { const p = T.stubPt(k, t, F), q = T.query(p.x - p.tz * u, p.z + p.tx * u, S.i0, Q); if (q.deep || Math.abs(q.d) >= w) { tl = Math.max(tl, t); break; } }
        const t = tl + (K.line === 'dash' ? 0.5 : 0.6), p = T.stubPt(k, t, F), nx = -p.tz, nz = p.tx, lw = K.line === 'dash' ? 0.15 : 0.22;
        const at = (uu, dt) => { const x = p.x + nx * uu + p.tx * dt, z = p.z + nz * uu + p.tz * dt; return [x, yAt(x, z, S, t) + 0.07, z]; };
        if (K.line === 'dash') { for (let u = u0; u + 0.5 <= u1 + 0.01; u += 1) G.l.quadUp(at(u, -lw), at(u + 0.5, -lw), at(u + 0.5, lw), at(u, lw), [wht, wht, wht, wht]); }
        else G.l.quadUp(at(u0, -lw), at(u1, -lw), at(u1, lw), at(u0, lw), [wht, wht, wht, wht]); }
    };
    return { mouthE, mouthV, edgeOn, n: list.length,
      edges: (i, j, L) => L.filter((e, si) => edgeOn(si, i, j)),   // (the road's two edge lines [[left], [right]] where they are drawn between samples i and j)
      emit: (c0, c1, a, s, l) => { list.forEach((S, n) => { if (S.i0 >= c0 && S.i0 < c1) draw(S, n, { a, s: s || a, l }); }); } };
  }
  // the verge's cross-section on sample i, side (as the builders' vProf: [offset, height above the road] x 5) across a side road's mouth (null elsewhere): from
  // the shoulder's edge e0 at the side road's surface, no ditch
  function stubVerge(SB, i, side, e0, bar) {
    if (!SB || !SB.mouthV[side > 0 ? 1 : 0][i]) return null;
    const y = T.hy[i], sf = (o) => { const q = side * o; return [o, T.yAt(T.query(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q, i, VRSQ)) - y - 0.03]; };
    return [[e0, -0.02], sf(Math.max(e0 + 0.6, bar - 0.7)), sf(bar + 0.45), sf(bar + 1.15), sf(bar + 1.9)];
  }
  function stubRails(nd, side) { const G = T.gap && T.gap[side > 0 ? 1 : 0]; if (G) for (let i = 0; i < nd.length; i++) if (G[i]) nd[i] = 0; return nd; }   // (the barrier open across the mouths)
  function stubExcl(push) { for (const S of T.stubs || []) for (let t = 0, e = S.end === 2 ? S.L : S.Lend + 3; t <= e; t += 3) { const p = T.stubPt(S.k, t, {}); push(p.x, p.z, T.stubHw(S, t) + S.lim + 1.2); } }   // (nothing grows or stands on the side roads)
  // the side roads' boards (one canvas, 8 rows of 128 px): row 0 the closure board (K.closed, red rim), the round no-entry sign and red and white stripes;
  // row 1 the gate's plate (K.gate) and the first street name; then two street names a row (K.plate: its colours, as the street signs there)
  let stA3Tex = null, stA3Key = '';
  function stubAtlas(L) {
    const key = JSON.stringify(L); if (stA3Tex && stA3Key === key) return stA3Tex;
    if (stA3Tex) stA3Tex.dispose(); stA3Key = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d'), names = L.names || [], pl = L.plate || ['#1d4f9a', '#f4f3ee'];
    const txt = (s, cx, cy, px, col, w, wt) => { x.fillStyle = col; x.font = (wt || 900) + ' ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    x.fillStyle = '#f4f3ee'; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#c81e14'; x.lineWidth = 12; x.strokeRect(8, 8, 496, 112); txt(L.closed, 256, 68, 62, '#141414', 450);
    x.fillStyle = '#f4f3ee'; x.beginPath(); x.arc(576, 64, 60, 0, TAU); x.fill(); x.strokeStyle = '#c81e14'; x.lineWidth = 15; x.beginPath(); x.arc(576, 64, 52, 0, TAU); x.stroke();   // (no vehicles either way)
    x.save(); x.beginPath(); x.rect(640, 0, 384, 128); x.clip(); x.fillStyle = '#f4f3ee'; x.fillRect(640, 0, 384, 128); x.fillStyle = '#d0201a';
    for (let q = -2; q < 14; q++) { x.beginPath(); x.moveTo(640 + q * 64, 128); x.lineTo(640 + q * 64 + 64, 0); x.lineTo(640 + q * 64 + 96, 0); x.lineTo(640 + q * 64 + 32, 128); x.fill(); } x.restore();
    x.fillStyle = '#c81e14'; x.fillRect(0, 128, 512, 128); x.strokeStyle = '#f4f3ee'; x.lineWidth = 8; x.strokeRect(10, 138, 492, 108); txt(L.gate, 256, 194, 72, '#f4f3ee', 450);
    names.forEach((n, k) => { const cell = k + 3, x0 = (cell % 2) * 512, y0 = Math.floor(cell / 2) * 128;
      x.fillStyle = pl[0]; x.fillRect(x0, y0, 512, 128); x.strokeStyle = pl[1]; x.lineWidth = 7; x.strokeRect(x0 + 9, y0 + 9, 494, 110); txt(n, x0 + 256, y0 + 66, n.length > 18 ? 46 : 56, pl[1], 470, 800); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (stA3Tex = t);
  }
  // the props of the side roads: white delineator posts (knockable) at the corners of the open barrier (K.posts 'along': along both edges too,
  // fewer in a village: S.s < K.village), the row of cones across each just past the barrier line (the course goes straight on), at the end a
  // guard rail across it with the closure board and the no-entry sign (a gate, a red and white boom, on the driveways and forest roads; nothing
  // before a building it leads into); a street's name on a pole at its mouth (K.loc.plate: the streets with a name). K: scen, out, root, gH,
  // loc { closed, gate, plate }, posts, village, postCol(S). Returns the counts
  function stubProps(K) {
    const { scen, out, root, gH } = K, L = K.loc || { closed: 'ROAD CLOSED', gate: 'CLOSED' }, F = {}, Q = {}, w = T.w, ban = new GB(true), W1 = [1, 1, 1];   // (ban: the boards, one mesh: one draw call)
    const yAt = (x, z, S, t) => T.yAt(T.query(x, z, T.stubHint(S.k, t), Q));
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1) => { const ux = tz, uz = -tx;   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1
      for (const f of [-1, 1]) { const ox = tx * 0.04 * f, oz = tz * 0.04 * f, hw = W / 2 * f, A = [cx + ox - ux * hw, cy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy, cz + oz + uz * hw], C = [B[0], B[1] + H, B[2]], D = [A[0], A[1] + H, A[2]];
        ban.quadO(A, B, C, D, W1, [cx - tx * f, cy + H / 2, cz - tz * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); } };
    const names = []; if (L.plate) for (const S of T.stubs || []) { const n = (K.nameOf ? K.nameOf(S.name) : S.name); if (n && !names.includes(n) && names.length < 13) names.push(n); }
    const steel = [0.78, 0.8, 0.82], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52], yel = [0.93, 0.74, 0.1], red = [0.84, 0.13, 0.1], blk = [0.12, 0.12, 0.13], white = [0.95, 0.95, 0.92];
    let nPost = 0, nCone = 0;
    for (const S of T.stubs || []) {
      const k = S.k, side = S.side, pc = K.postCol ? K.postCol(S) : 0;
      const post = (x, z, yaw, h) => { const q = T.query(x, z, h, Q); if (!q.deep && Math.abs(q.d) < w + 0.6) return; out.props.push({ kind: 'post', x, z, yaw, col: pc, i: q.i }); nPost++; };   // (none on the road's asphalt; i: its hint)
      if (K.posts === 'along') { const pm = clamp(S.lim - 0.3, 0.2, 0.6), step = S.s < (K.village || 0) ? 15 : 11;
        for (let t = S.tb + 1; t <= S.L - 2; t += step) { const p = T.stubPt(k, t, F); for (const sd of [-1, 1]) { const hw = T.stubHw(S, t, sd) + pm; post(p.x - p.tz * hw * sd, p.z + p.tx * hw * sd, p.h, T.stubHint(k, t)); } } }
      if (K.posts !== 'none') { let a = -1, b = -1; for (let i = Math.max(0, S.i0 - 80); i <= Math.min(T.N - 1, S.i0 + 80); i++) { const bar = side > 0 ? T.br[i] : T.bl[i], x = T.px[i] + T.nx[i] * side * bar, z = T.pz[i] + T.nz[i] * side * bar;   // (its own stretch of open barrier)
          VRSP.S = null; if (T._stubProj(S, x, z, VRSP) && VRSP.t > 0 && VRSP.t < S.L && Math.abs(VRSP.u) <= T.stubHw(S, VRSP.t, VRSP.u) + S.lim + 2) { if (a < 0) a = i; b = i; } }   // (as T.gap: the barrier's clearance)
        for (const i of a >= 0 ? [a - 1, b + 1] : []) { const bar = (side > 0 ? T.br[i] : T.bl[i]) - 0.35, x = T.px[i] + T.nx[i] * side * bar, z = T.pz[i] + T.nz[i] * side * bar; post(x, z, T.hd[i], i); } }
      for (const c of T.stubCones(k)) { out.props.push(c); nCone++; }
      if (S.end !== 2) { const p = T.stubPt(k, S.L, {}), nx = -p.tz, nz = p.tx, hc = S.hw + S.lim, g = scen.get(p.x, p.z), rot = p.h + Math.PI / 2;
        const at = (u, dt, dy) => { const x = p.x + nx * u + p.tx * dt, z = p.z + nz * u + p.tz * dt; return [x, yAt(x, z, S, S.L) + dy, z]; };
        if (S.end === 0) {
          const n = Math.max(2, Math.ceil(hc * 2 / 2)); for (let c = 0; c < n; c++) { const u0 = -hc + c * 2 * hc / n, u1 = u0 + 2 * hc / n, a = at(u0, -0.25, 0.45), b = at(u1, -0.25, 0.45), cc = at(u1, -0.25, 0.8), d = at(u0, -0.25, 0.8), ins = at((u0 + u1) / 2, 2.5, 0.6), ino = at((u0 + u1) / 2, -3, 0.6);
            g.quadO(a, b, cc, d, steel, ins); g.quadO(a, b, cc, d, steelB, ino); }   // (the bright face towards the car coming)
          for (let u = -hc; u <= hc + 0.01; u += hc / Math.max(1, Math.round(hc / 1.6))) { const q = at(u, 0.05, -0.35); box(g, q[0], q[1], q[2], 0.13, 1.13, 0.13, p.h, postC, null, true); }
          for (const u of [-hc * 0.55, hc * 0.55]) { const q = at(u, -0.32, 0.47); bannerQ(q[0], q[1], q[2], p.tx, p.tz, 1.5, 0.3, 7 / 8, 1, 0.625, 1); }   // (red and white stripes on the beam)
          const q = at(0, 0.5, -0.2); cyl(g, q[0], q[1], q[2], 0.04, 2.45, 5, [0.62, 0.63, 0.66]);
          bannerQ(q[0] - p.tx * 0.06, q[1] + 1.12, q[2] - p.tz * 0.06, p.tx, p.tz, 1.6, 0.4, 7 / 8, 1, 0, 0.5);   // the closure board, the round sign above it
          bannerQ(q[0] - p.tx * 0.06, q[1] + 1.6, q[2] - p.tz * 0.06, p.tx, p.tz, 0.62, 0.62, 7 / 8, 1, 0.5, 0.625);
        } else {
          for (const u of [-(S.hw + 0.25), S.hw + 0.25]) { const q = at(u, 0, -0.2); box(g, q[0], q[1], q[2], 0.16, 1.25, 0.16, rot, yel, blk); }
          const m = Math.max(4, Math.round(S.hw * 2 / 0.6)); for (let c = 0; c < m; c++) { const u = -S.hw + (c + 0.5) * 2 * S.hw / m, q = at(u, 0, 0.88); box(g, q[0], q[1], q[2], 2 * S.hw / m + 0.005, 0.1, 0.1, rot, c % 2 ? white : red); }
          const q = at(0, -0.08, 0.72); bannerQ(q[0], q[1], q[2], p.tx, p.tz, 0.9, 0.22, 6 / 8, 7 / 8, 0, 0.5);
        }
      }
      // its name at its mouth (the streets): a plate on a pole at the right-hand corner going in (left-hand traffic: the left), past the kerb return
      const ni = S.name ? names.indexOf(K.nameOf ? K.nameOf(S.name) : S.name) : -1;
      if (ni >= 0) { const c = T.def.leftHand ? 0 : 1, sd = c ? 1 : -1, t = Math.max(S.tb + 1.5, S.tv[c] + S.lt[c] * 0.5), p = T.stubPt(k, t, F), u = sd * (T.stubHw(S, t, sd) + S.lim + 0.5), x = p.x - p.tz * u, z = p.z + p.tx * u, y = gH(x, z), g = scen.get(x, z), cell = ni + 3;
        cyl(g, x, y - 0.2, z, 0.04, 2.9, 5, [0.62, 0.63, 0.66]); bannerQ(x, y + 2.15, z, p.tx, p.tz, 1.4, 0.35, 1 - (Math.floor(cell / 2) + 1) / 8, 1 - Math.floor(cell / 2) / 8, (cell % 2) * 0.5, (cell % 2) * 0.5 + 0.5); }
    }
    if (!ban.empty) { const m = new THREE.Mesh(ban.geometry(), new THREE.MeshLambertMaterial({ map: stubAtlas({ closed: L.closed, gate: L.gate, plate: L.plate || null, names }), side: THREE.FrontSide })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
    return { n: (T.stubs || []).length, posts: nPost, cones: nCone };
  }
  // the building at the top of the run from the police (def.hideout { s: metres after the start line of its middle, side, len, wid, door }; only in
  // that mode: Render.attachRace shows it and hides the finish): a timber garage of the road service on the verge just past the pass, where the
  // core has it (Police: its middle at s, side * (w + 0.3 + wid / 2) across, along the road there; the walls 0.3 m thick where the core's are,
  // the cars collide with those), the open door (door m wide) in the end facing down the road. A stone plinth, weathered larch boards, small
  // windows with green shutters, a steep roof with deep eaves (under the first snow in autumn); inside, dim: a concrete floor at the height the
  // cars drive at, dark walls, a ceiling, a workbench, shelves, tyres, a snow plough's blade; a gravel yard from the asphalt to the door. The
  // roller door (its own mesh, rolled up under the lintel) comes down once the player is in (Render). Returns { grp, door, ... } or null
  function vrHideout(K) {
    const HO = T.def.hideout; if (!HO) return null;
    const { root, matV, sMat, exclPush, CR } = K, w = T.w, sd = HO.side, L = HO.len, W = HO.wid, t = 0.3, dw = HO.door, R = rng(9911);
    const gs = T.startS + HO.s, gi = T.idx(gs), gh = T.hd[gi], gd = sd * (w + 0.3 + W / 2), gx = T.px[gi] + T.nx[gi] * gd, gz = T.pz[gi] + T.nz[gi] * gd, ch = Math.cos(gh), sh = Math.sin(gh);
    const P = (lx, lz, y) => [gx + ch * lx - sh * lz, y, gz + sh * lx + ch * lz];   // (its own frame: lx up the road, lz across it, + to the right)
    const Q = {}, yR = (lx, lz) => { const p = P(lx, lz, 0); return T.yAt(T.query(p[0], p[2], gi, Q)); };   // (the height the cars drive at there: the road's)
    const hx = L / 2 + t / 2, hz = W / 2 + t / 2, ix = L / 2 - t / 2, iz = W / 2 - t / 2;   // (the walls' outer and inner faces)
    let y0 = -1e9; for (const [a, b] of [[-ix, -iz], [ix, -iz], [ix, iz], [-ix, iz], [0, 0], [-hx, 0]]) y0 = Math.max(y0, yR(a, b) + 0.025);
    const E = y0 + 3.7, Hd = 3.2, rh = 2.45, kr = rh / hz, oe = 0.65, og = 0.75, rt = 0.14, snow = VRS !== 'summer';   // (the eaves, the door's height, the roof's rise and slope, its overhangs and thickness)
    const g = new GB(), mid = P(0, 0, y0 + 2), wood = [0.44, 0.31, 0.2], dark = [0.19, 0.15, 0.12], stone = [0.55, 0.53, 0.5];
    const away = (lx, lz, y, k) => [gx + (P(lx, lz, y)[0] - gx) * k, y, gz + (P(lx, lz, y)[2] - gz) * k];   // (a point past a face seen from the middle: orients an inside face)
    const pan = (a, b, y0a, y0b, y1a, y1b, col, inner) => {   // a vertical face from a = [lx, lz] to b, from the bottom (y0a, y0b) to the top (y1a, y1b), facing out (inner: into the building)
      const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (y0a + y0b + y1a + y1b) / 4];
      g.quadO(P(a[0], a[1], y0a), P(b[0], b[1], y0b), P(b[0], b[1], y1b), P(a[0], a[1], y1a), col, inner ? away(c[0], c[1], c[2], 3) : mid); };
    const gab = (lz) => E + rh * (1 - Math.abs(lz) / hz);   // (the gable's top at lz)
    // the boards outside (planks ~0.24 m wide, each a shade of its own) from y = bot(u) to top(u) along a wall from a to b
    const boards = (a, b, bot, top) => { const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.24));
      for (let k = 0; k < n; k++) { const u0 = k / n, u1 = (k + 1) / n, A = [a[0] + (b[0] - a[0]) * u0, a[1] + (b[1] - a[1]) * u0], B = [a[0] + (b[0] - a[0]) * u1, a[1] + (b[1] - a[1]) * u1], s = (k % 2 ? 0.9 : 1) * (0.92 + 0.14 * R());
        const yb0 = bot(A), yb1 = bot(B); if (top(A) - yb0 < 0.01 && top(B) - yb1 < 0.01) continue;
        pan(A, B, yb0, yb1, top(A), top(B), [wood[0] * s, wood[1] * s, wood[2] * s]); } };
    const pl = y0 + 0.45, lo = y0 - 0.9, flat = () => E, pB = () => pl, gT = (p) => gab(p[1]), hd = dw / 2;   // (the plinth's top, the walls' foot in the ground)
    // the long walls, the back with its gable, the door's end (its gable over the lintel), boards over the plinth
    for (const s of [-1, 1]) boards([-hx, s * hz], [hx, s * hz], pB, flat);
    boards([hx, -hz], [hx, hz], pB, gT);
    boards([-hx, -hz], [-hx, -hd], pB, gT); boards([-hx, -hd], [-hx, hd], () => y0 + Hd + 0.24, gT); boards([-hx, hd], [-hx, hz], pB, gT);
    // the plinth (proud of the boards by 4 cm, a ledge on top; at the door's end cut out down to the floor), the lintel beam over the door
    const pe = hz + 0.04, xe = hx + 0.04, led = [0.62, 0.6, 0.57], ps = (a, b, top) => { pan(a, b, lo, lo, top, top, stone); }, ledge = (a, b, c, d) => g.quadO(P(a[0], a[1], pl), P(b[0], b[1], pl), P(c[0], c[1], pl), P(d[0], d[1], pl), led, P(0, 0, pl - 1));
    for (const s of [-1, 1]) { ps([-xe, s * pe], [xe, s * pe], pl); ledge([-xe, s * pe], [xe, s * pe], [hx, s * hz], [-hx, s * hz]); }
    ps([xe, -pe], [xe, pe], pl); ledge([xe, -pe], [xe, pe], [hx, hz], [hx, -hz]);
    for (const s of [-1, 1]) { ps([-xe, s * pe], [-xe, s * hd], pl); ledge([-xe, s * pe], [-xe, s * hd], [-hx, s * hd], [-hx, s * hz]); pan([-xe, s * hd], [-hx, s * hd], lo, lo, pl, pl, stone, true); }
    ps([-xe, -hd], [-xe, hd], y0 - 0.02);
    { const [bx, , bz] = P(-hx - 0.05, 0, 0); box(g, bx, y0 + Hd, bz, 0.12, 0.24, dw + 0.5, gh, [0.3, 0.2, 0.13]); }
    for (const a of [-hx, hx]) for (const b of [-hz, hz]) { const [bx, , bz] = P(a, b, 0); box(g, bx, pl, bz, 0.2, E - pl, 0.2, gh, [0.33, 0.23, 0.15]); }
    // the door's opening: the plinth's cut (the floor runs out under it), the reveals and the soffit (dark), the roller door's housing inside
    for (const s of [-1, 1]) { pan([-hx, s * dw / 2], [-ix, s * dw / 2], y0, y0, y0 + Hd, y0 + Hd, [0.26, 0.19, 0.13], true); }
    g.quadO(P(-hx, -dw / 2, y0 + Hd), P(-ix, -dw / 2, y0 + Hd), P(-ix, dw / 2, y0 + Hd), P(-hx, dw / 2, y0 + Hd), [0.24, 0.18, 0.12], P(-L / 2, 0, y0 + Hd + 1));
    { const [bx, , bz] = P(-ix + 0.22, 0, 0); box(g, bx, y0 + Hd - 0.02, bz, 0.42, 0.46, dw + 0.3, gh, [0.42, 0.43, 0.45]); }
    // inside (dim): the walls, the door's end round the opening, the ceiling under the eaves, the floor (concrete, darker towards the back)
    for (const s of [-1, 1]) pan([-ix, s * iz], [ix, s * iz], y0 - 0.1, y0 - 0.1, E, E, dark, true);
    pan([ix, -iz], [ix, iz], y0 - 0.1, y0 - 0.1, E, E, dark, true);
    for (const s of [-1, 1]) pan([-ix, s * iz], [-ix, s * dw / 2], y0 - 0.1, y0 - 0.1, E, E, dark, true);
    pan([-ix, -dw / 2], [-ix, dw / 2], y0 + Hd, y0 + Hd, E, E, dark, true);
    g.quadO(P(-ix, -iz, E), P(ix, -iz, E), P(ix, iz, E), P(-ix, iz, E), [0.15, 0.12, 0.1], P(0, 0, E + 1));
    { const nx = 8, nz = 3, fy = (a, b) => yR(a, b) + 0.025, fc = (a) => { const k = lerp(0.46, 0.24, (a + hx) / (hx + ix)); return [k, k, k * 0.98]; };
      for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const x0 = -hx + (hx + ix) * a / nx, x1 = -hx + (hx + ix) * (a + 1) / nx, z0 = -iz + 2 * iz * b / nz, z1 = -iz + 2 * iz * (b + 1) / nz;
        g.quadUp(P(x0, z0, fy(x0, z0)), P(x1, z0, fy(x1, z0)), P(x1, z1, fy(x1, z1)), P(x0, z1, fy(x0, z1)), [fc(x0), fc(x1), fc(x1), fc(x0)]); } }
    // the windows on the long walls (dark glass in a white frame, green shutters open beside it), a lamp over the door
    for (const s of [-1, 1]) for (const a of [-2.6, 2.4]) { const o = s * (hz + 0.02), [wx, , wz] = P(a, o, 0), [fx, , fz] = P(a, s * (hz + 0.05), 0);
      g.quadO(P(a - 0.45, o, y0 + 1.3), P(a + 0.45, o, y0 + 1.3), P(a + 0.45, o, y0 + 2.15), P(a - 0.45, o, y0 + 2.15), [0.13, 0.15, 0.19], mid);
      for (const [dx, dy, sx, sy] of [[0, 1.24, 1.04, 0.07], [0, 2.15, 1.04, 0.07], [-0.5, 1.24, 0.07, 0.98], [0.5, 1.24, 0.07, 0.98]]) box(g, wx + ch * dx, y0 + dy, wz + sh * dx, sx, sy, 0.06, gh, [0.9, 0.89, 0.85]);
      for (const q of [-0.8, 0.8]) box(g, fx + ch * q, y0 + 1.24, fz + sh * q, 0.5, 0.98, 0.04, gh, [0.2, 0.42, 0.26]); }
    { const [lx, , lz] = P(-hx - 0.12, 0, 0); box(g, lx, y0 + Hd + 0.4, lz, 0.22, 0.14, 0.3, gh, [0.15, 0.15, 0.16]); box(g, lx, y0 + Hd + 0.33, lz, 0.16, 0.07, 0.22, gh, [1.0, 0.96, 0.82]); }
    // inside: a workbench along the back wall, shelves with boxes, a stack of tyres, the orange blade of a snow plough against the wall
    { const at = (a, b) => { const p = P(a, b, 0); return [p[0], p[2]]; }, fyA = (a, b) => yR(a, b);
      let [x, z] = at(ix - 0.3, -sd * 0.9); box(g, x, fyA(ix - 0.3, -sd * 0.9), z, 0.55, 0.92, 2.6, gh, [0.36, 0.25, 0.16], [0.46, 0.35, 0.23]);
      const fs = fyA(1.0, sd * (iz - 0.25)), stl = [0.3, 0.31, 0.33];   // (the shelves: two uprights, four boards, boxes on them)
      for (const a of [-0.6, 2.6]) { [x, z] = at(a, sd * (iz - 0.25)); box(g, x, fs, z, 0.06, 2.1, 0.45, gh, stl); }
      [x, z] = at(1.0, sd * (iz - 0.25)); for (const yy of [0.1, 0.75, 1.4, 2.05]) box(g, x, fs + yy, z, 3.2, 0.04, 0.45, gh, stl);
      for (let k = 0; k < 6; k++) { const a = -0.25 + (k % 3) * 1.05 + (k > 2 ? 0.4 : 0), yy = fs + (k > 2 ? 1.44 : 0.79); [x, z] = at(a, sd * (iz - 0.25)); box(g, x, yy, z, 0.55, 0.34 + (k % 2) * 0.12, 0.38, gh, k % 3 ? [0.62, 0.5, 0.34] : [0.72, 0.18, 0.12]); }
      [x, z] = at(ix - 0.6, sd * (iz - 0.6)); for (let k = 0; k < 4; k++) cyl(g, x, fyA(ix - 0.6, sd * (iz - 0.6)) + k * 0.23, z, 0.33, 0.22, 10, [0.08, 0.08, 0.09], [0.16, 0.16, 0.17]);
      [x, z] = at(-3.2, -sd * (iz - 0.18)); box(g, x, fyA(-3.2, -sd * (iz - 0.18)), z, 2.7, 0.95, 0.16, gh, [0.95, 0.5, 0.1], [0.98, 0.62, 0.2]); }
    // the roof: a slope each side from the ridge over the walls to the eaves (its top: shingles or the first snow; under it dark boards), the
    // fascia boards along the eaves and up the gables
    { const top = snow ? [0.9, 0.92, 0.96] : [0.32, 0.31, 0.32], und = [0.27, 0.19, 0.12], fas = [0.36, 0.25, 0.16], rx = hx + og, ez = hz + oe, ey = E - kr * oe, R0 = E + rh;
      for (const s of [-1, 1]) {
        g.quadO(P(-rx, 0, R0 + rt), P(rx, 0, R0 + rt), P(rx, s * ez, ey + rt), P(-rx, s * ez, ey + rt), top, P(0, 0, E - 5));
        g.quadO(P(-rx, 0, R0), P(rx, 0, R0), P(rx, s * ez, ey), P(-rx, s * ez, ey), und, P(0, 0, R0 + 5));
        g.quadO(P(-rx, s * ez, ey), P(rx, s * ez, ey), P(rx, s * ez, ey + rt), P(-rx, s * ez, ey + rt), fas, P(0, 0, ey));
        for (const e of [-1, 1]) g.quadO(P(e * rx, 0, R0), P(e * rx, s * ez, ey), P(e * rx, s * ez, ey + rt), P(e * rx, 0, R0 + rt), fas, P(0, 0, E)); }
      if (snow) for (const s of [-1, 1]) g.quadO(P(-rx, s * (ez - 0.02), ey + rt), P(rx, s * (ez - 0.02), ey + rt), P(rx, s * (ez + 0.06), ey + rt - 0.12), P(-rx, s * (ez + 0.06), ey + rt - 0.12), [0.86, 0.88, 0.93], P(0, 0, E - 5)); }   // (the snow's lip over the eaves)
    const grp = new THREE.Group(); grp.name = 'vrHide'; grp.visible = false; root.add(grp);
    const shell = new THREE.Mesh(g.geometry(), matV); shell.castShadow = true; shell.receiveShadow = true; shell.matrixAutoUpdate = false; grp.add(shell);
    // the gravel yard from the asphalt's edge to the door (over the shoulder and the verge; along the road, to the barrier line), its edges
    // down into the ground
    const yd = new GB(true), s1 = gs - hx, s0 = s1 - 24, gc = [0.8, 0.76, 0.7];   // (from where the cars leave the road for it)
    { const rows = []; for (let s = s0; s <= s1 + 0.01; s += 1) { const ss = Math.min(s, s1), i = T.idx(ss), ob = Math.min((sd > 0 ? T.br[i] : T.bl[i]) - 0.25, Math.abs(gd) + hz), y = T.elevAt(ss).y + 0.035, os = [w + 0.02, w + 0.6, (w + 0.6 + ob) / 2, ob];
        rows.push(os.map(o => { const [x, z] = atSf(ss, sd * o); return [x, y, z, o, ss]; })); }
      const uv = (p) => [p[3] / 4, p[4] / 6], col = (p) => { const k = 0.9 + 0.1 * rpHash(Math.round(p[4]), Math.round(p[3] * 3)); return [gc[0] * k, gc[1] * k, gc[2] * k]; };
      for (let a = 0; a + 1 < rows.length; a++) for (let b = 0; b < 3; b++) { const p = rows[a][b], q = rows[a][b + 1], r = rows[a + 1][b + 1], u = rows[a + 1][b];
        yd.quadUp([p[0], p[1], p[2]], [q[0], q[1], q[2]], [r[0], r[1], r[2]], [u[0], u[1], u[2]], [col(p), col(q), col(r), col(u)], [uv(p), uv(q), uv(r), uv(u)]); }
      const sk = (p, q, inn) => yd.quadO([p[0], p[1], p[2]], [q[0], q[1], q[2]], [q[0], q[1] - 0.45, q[2]], [p[0], p[1] - 0.45, p[2]], [gc[0] * 0.7, gc[1] * 0.7, gc[2] * 0.7], inn, [uv(p), uv(q), uv(q), uv(p)]);
      for (let a = 0; a + 1 < rows.length; a++) { const p = rows[a][3], q = rows[a + 1][3]; sk(p, q, [(rows[a][0][0] + q[0]) / 2, p[1], (rows[a][0][2] + q[2]) / 2]); }
      for (let b = 0; b < 3; b++) { const p = rows[0][b], q = rows[0][b + 1]; sk(p, q, [rows[1][b][0], p[1], rows[1][b][2]]); } }
    const yard = new THREE.Mesh(yd.geometry(), sMat); yard.receiveShadow = true; yard.matrixAutoUpdate = false; grp.add(yard);
    // the roller door: grey steel slats from the lintel down (scale.y: 0 rolled up, 1 down), both faces
    const dg = new GB(), n = 20;
    for (let k = 0; k < n; k++) { const ya = -k * Hd / n, yb = -(k + 1) * Hd / n, c = k === n - 1 ? [0.36, 0.37, 0.39] : k % 2 ? [0.66, 0.67, 0.68] : [0.76, 0.77, 0.78];
      for (const f of [-1, 1]) dg.quadO([0, ya, -dw / 2 - 0.05], [0, ya, dw / 2 + 0.05], [0, yb, dw / 2 + 0.05], [0, yb, -dw / 2 - 0.05], c, [f, (ya + yb) / 2, 0]); }
    const door = new THREE.Mesh(dg.geometry(), matV), dp = P(-hx + 0.09, 0, y0 + Hd);
    door.position.set(dp[0], dp[1], dp[2]); door.rotation.y = -gh; door.scale.y = 0.02; door.castShadow = true; door.receiveShadow = true; door.matrixAutoUpdate = false; door.updateMatrix(); grp.add(door);
    exclPush(gx, gz, Math.hypot(L, W) / 2 + 4); CR.block(gx, gz, L + 1.4, W + 1.4, gh);   // (no trees, shrubs or people in it, no crowns in its eaves)
    return { grp, door, x: gx, z: gz, y: y0, h: gh, len: L, wid: W, Hd, k: 0, lamp: P(-hx - 0.12, 0, y0 + Hd + 0.3), lit: P(1, 0, E - 0.35) };   // (k: the door's share down; lamp: over the door, lit: the light inside, at dusk and at night: Render)
  }
  function buildVrsic(scene, tex, opts) {
    const R = rng(7611), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    VRS = opts.season === 'autumn' || opts.season === 'winter' ? 'autumn' : 'summer';   // (summer: green meadows and leaves; autumn and winter: the autumn look, which winter's season code snows over)
    const out = { root, dyn: {}, groundH: vrGround, camFloor: vrGround, props: [], farClip: true, ownTex: [], season: VRS, paintFor: (s) => (s === 'autumn' || s === 'winter' ? 'autumn' : 'summer') };
    vrPrep(); vrStubs();
    const P = VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    // the buildings (def.bld [x, z, length, width, angle, height (0: unknown), kind, name]; kind 0 house, 1 hotel, 2 chapel or church, 3 shed or garage,
    // 4 mountain hut): the ones clear of the road (the hairpins were widened) and of the lakes; the big hotel blocks cut down to a size that reads as one
    // building; the huts and the chapel get a level plot (pushed before the terrain is sampled)
    const blds = [];
    for (const b of def.bld || []) {
      let [x, z, L, W, ang, hgt, kind, name] = b; name = name || '';
      if (kind !== 4 && !name) { L = Math.min(L, 42); W = Math.min(W, 24); }
      if (L < 2.5 || W < 2.5) continue;
      const c = Math.cos(ang), s = Math.sin(ang), clear = () => { for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const px = x + c * u - s * v, pz = z + s * u + c * v, n = vrNear(px, pz);
        if ((n.i >= 0 && n.dd < 1.5) || vrWater(px, pz).e > -2) return false; }
        for (let a = -2; a <= 2; a++) for (let e = -2; e <= 2; e++) { const u = a * L / 4, v = e * W / 4; if (vrStubAt(x + c * u - s * v, z + s * u + c * v, 0.8)) return false; }   // (nor on a side road)
        return true; };
      if (name && !clear()) { const i = T.nearestIdx(x, z), sd = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] > 0 ? 1 : -1; for (let k = 0; k < 12 && !clear(); k++) { x += T.nx[i] * sd * 2; z += T.nz[i] * sd * 2; } }   // (a named one moves out, away from the road)
      if (clear()) blds.push({ x, z, L, W, ang, hgt, kind, name });
    }
    for (const b of blds) if (b.kind === 4 || b.name) { b.pad = { x: b.x, z: b.z, r: Math.hypot(b.L, b.W) / 2 + 1.5, b: 10, h: vrH(b.x, b.z) }; P.pads.push(b.pad); }
    // the car park at the pass: beside the road just past the line, on the side where the ground lies nearer the road's height
    const iF = T.idx(sFin + 34), sdP = (() => { const gd = (sd) => Math.abs(vrFar(T.px[iF] + T.nx[iF] * sd * 26, T.pz[iF] + T.nz[iF] * sd * 26) - T.hy[iF]); return gd(1) < gd(-1) ? 1 : -1; })();
    const oP = (sdP > 0 ? T.br[iF] : T.bl[iF]) + 13, padP = { x: T.px[iF] + T.nx[iF] * sdP * oP, z: T.pz[iF] + T.nz[iF] * sdP * oP, r: 12, b: 16, h: T.hy[iF] - 0.25 };
    P.pads.push(padP);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (ouCutMat: the trees and buildings between the camera and the car fade out)
    const matV = API.ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // tree exclusion circles (buildings, crowds, plots), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + (b.name ? 9 : 2.5));   // (a clearing round the huts and the chapel)
    out.marks = {};   // (where the landmarks stand: the tests look for them)
    for (const b of blds) if (b.name) out.marks[b.name] = [b.x, b.z];
    exclPush(padP.x, padP.z, padP.r + 4);
    stubExcl(exclPush);   // (nothing grows or stands on the side roads)

    /* ---- terrain tiles, the lakes ---- */
    let nFar = 0;
    const tMat = API.pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });   // terrain tiles (the grit fades on steep faces) / verge ribbons
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = vrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;   // (G.on: the full tiles, which get the forest)
        const m = new THREE.Mesh(vrTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      // the water: a 4 m grid at the lake's level wherever the ground lies below it, Jasna's clear emerald green: turquoise over the pale gravel of
      // the shallows, deep green farther out, the sky mirrored in patches
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 40, specular: 0x1e2c34 });   // (the low autumn sun: a soft glint only)
      const deep = [0.06, 0.3, 0.28], shal = [0.3, 0.56, 0.48], sky = [0.46, 0.6, 0.68];
      for (const L of P.lakes) {
        const cs = 4, x0 = L.x0 - 8, z0 = L.z0 - 8, nx = Math.ceil((L.x1 - L.x0 + 16) / cs) + 1, nz = Math.ceil((L.z1 - L.z0 + 16) / cs) + 1, wet = new Uint8Array(nx * nz);
        for (let b = 0; b < nz; b++) for (let a = 0; a < nx; a++) wet[b * nx + a] = vrGround(x0 + a * cs, z0 + b * cs) < L.h + 0.4 ? 1 : 0;
        const cc = new Map(), wc = (a, b) => { const key = b * nx + a; let c = cc.get(key); if (c) return c;
          const x = x0 + a * cs, z = z0 + b * cs, e = vrWater(x, z).e, ks = 0.45 * sstep(0.55, 0.8, P.n2(x * 2.2, z * 2.2));
          c = [0, 1, 2].map(k => lerp(lerp(shal[k], deep[k], sstep(2, 16, e)), sky[k], ks)); cc.set(key, c); return c; };
        const g = new GB(true), uv = (q) => [q[0] / 14, -q[2] / 14];
        for (let b = 0; b < nz - 1; b++) for (let a = 0; a < nx - 1; a++) {
          if (!(wet[b * nx + a] | wet[b * nx + a + 1] | wet[(b + 1) * nx + a] | wet[(b + 1) * nx + a + 1])) continue;
          const A = [x0 + a * cs, L.h, z0 + b * cs], B = [A[0] + cs, L.h, A[2]], C = [A[0] + cs, L.h, A[2] + cs], D = [A[0], L.h, A[2] + cs];
          g.quadUp(A, B, C, D, [wc(a, b), wc(a + 1, b), wc(a + 1, b + 1), wc(a, b + 1)], [uv(A), uv(B), uv(C), uv(D)]);
        }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); }
      }
      if (P.lakes.length) out.dyn.water = tex.water;
    }

    /* ---- the road: asphalt with a dashed white centre line and white edge lines; on the cobbled hairpins grey granite setts (the paving map laid
       small: a sett 19 x 12.5 cm), darker in the wheel tracks and the gutters; a gravel shoulder, then the verge: grass out to a ditch just past the
       barrier line, up or down onto the ground; on a bridge the deck out to its parapets (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const cMat = new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true });
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast, grp) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; (grp || root).add(m); return m; };
    // the race's finish at the pass (the gantry, the chequered line, the flags, the crowd) in a group of its own: not in the run from the police,
    // whose mission ends in the building past it instead (vrHideout; Render.attachRace shows the one or the other)
    const finG = new THREE.Group(); finG.name = 'vrFin'; root.add(finG); out.dyn.vrFin = finG;
    const sett = T.settAt || new Uint8Array(N), onBr = new Uint8Array(N), sw = 0.6;
    const SB = stubGeo({ gCol: vrGCol, edge: 'dash', line: 'dash', paveC: [0.83, 0.83, 0.85], shC: [0.84, 0.79, 0.72] });   // the side roads: their mouths, their surfaces (in the road's chunks below)
    const WK = T.walk, wE = (si, i) => w + (WK ? WK[si][i] : 0);   // the edge of the road on a side (0 left, 1 right): past its sidewalk (Kranjska Gora, Jasna)
    for (const [a, b] of def.bridges || []) for (let s = sStart + a - 3; s <= sStart + b + 3; s += T.ds / 2) onBr[T.idx(s)] = 1;
    const altAt = (i) => T.hy[i] + base;

    // (V2 makadamski rob: a gravel shoulder of irregular width (0.3-1.2 m, deterministic noise along the road), light grey-brown, thinning out softly into the grass)
    const eN1 = valueNoise2(9701, 9), eN2 = valueNoise2(9702, 3.1), eN3 = valueNoise2(9703, 1.3);
    const SWA = [0, 1].map(si => { const side = si ? 1 : -1, A = new Float32Array(N);
      for (let i = 0; i < N; i++) { const x = T.px[i] + T.nx[i] * side * w, z = T.pz[i] + T.nz[i] * side * w, n = 0.68 * eN1(x, z) + 0.32 * eN2(x, z) + 0.18 * (rpHash(i, 41 + si) - 0.5);
        A[i] = 0.3 + 0.9 * sstep(0.36, 0.64, n); }
      return A; });
    const GRV = (x, z) => { const n = (0.9 + 0.2 * eN2(x * 1.7, z * 1.7)) * (0.93 + 0.14 * eN3(x, z)); return [0.7 * n, 0.64 * n, 0.54 * n]; };   // light grey-brown gravel (times the grit map)
    const EDGE = {
      sw: (i, side) => SWA[side > 0 ? 1 : 0][i],
      prof: (i, side, p) => { const e = wE(side > 0 ? 1 : 0, i), s = SWA[side > 0 ? 1 : 0][i], A = p[0], B = p[1], fo = Math.min(A[0] + 0.4, (A[0] + B[0]) / 2), t = (fo - A[0]) / Math.max(1e-3, B[0] - A[0]);
        return [[e, 0.012, 'a'], [e + s * 0.55, -0.004, 'b'], A, [fo, lerp(A[1], B[1], t), 'f'], ...p.slice(1)]; },
      col: (i, side, role, o, x, z, c) => { const G = GRV(x, z);
        if (role === 'a') return [G[0] * 0.86, G[1] * 0.86, G[2] * 0.87];   // (a little darker against the asphalt's edge)
        if (role === 'b') return G;
        if (role === 0) { const t = 0.55 + 0.2 * eN3(x * 1.3, z * 1.3); return [lerp(c[0], G[0], t), lerp(c[1], G[1], t), lerp(c[2], G[2], t)]; }   // the ragged edge: gravel thinning out into the grass
        if (role === 'f') return [lerp(c[0], 0.47, 0.12) * 0.96, lerp(c[1], 0.44, 0.12) * 0.96, lerp(c[2], 0.3, 0.12) * 0.96];   // a little worn grass beside it
        return c; },
    };
    // the verge's cross-section per sample and side (5 points: [offset, height above the road]): the grass out to the ditch past the barrier line, onto the
    // ground; a bridge: its deck out past the parapet, then the deck's edge down
    const vProf0 = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = wE(side > 0 ? 1 : 0, i), sw = EDGE.sw(i, side);
      if (onBr[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];
      const y = T.hy[i], gAt = (o) => { const q = side * o; return vrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      const ms = stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;   // a side road's mouth: no ditch, the verge at its surface
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vProf = (i, side) => EDGE.prof(i, side, vProf0(i, side).map((q, k) => [q[0], q[1], k]));   // (each point tagged with its role: the old five 0-4, the shoulder's own letters)
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = EDGE.offs || [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade0 = (i, o) => { const rl = T.rl[i]; let k = 0.86 - 0.13 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const shade = (i, o) => (EDGE.ash ? EDGE.ash(i, o, shade0(i, o)) : shade0(i, o));
      const stone = (i, o) => { const rl = T.rl[i], k = (0.6 + 0.08 * rpHash(i, 77)) * (1 - 0.1 * Math.exp(-((o - rl) * (o - rl)) / 3)) * (Math.abs(o) > w - 0.4 ? 0.84 : 1); return [k, k * 0.99, k * 0.97]; };
      const wht = [0.95, 0.95, 0.92], gc = [0.84, 0.79, 0.72], deck = [0.64, 0.63, 0.6];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y, k]) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return typeof k !== 'number' || k < 3 ? deck : [0.52, 0.51, 0.49];
          if (k === 4) return vrGCol(x, z);
          const sl = k === 2 ? vrSlope(x, z) : 0; return EDGE.col(i, side, k, o, x, z, vrCol(x, z, T.hy[i] + y, 1 / Math.sqrt(1 + sl * sl), Math.max(0, o - bar)).slice()); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gp = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          if (sett[i] || sett[j]) for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1], q0 = i * T.ds, q1 = j * T.ds;
            gp.quadUp(Pt(i, o0, 0.03), Pt(i, o1, 0.03), Pt(j, o1, 0.03), Pt(j, o0, 0.03), [stone(i, o0), stone(i, o1), stone(j, o1), stone(j, o0)], [[o0 + w, q0], [o1 + w, q0], [o1 + w, q1], [o0 + w, q1]]); }
          else {
            for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
              if (EDGE.road && EDGE.road(gr, i, j, c, o0, o1, shade, v0, v1, tileL)) continue;
              gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
            const ln = SB.edges(i, j, [[-(w - 0.3), -(w - 0.45)], [w - 0.45, w - 0.3]]);   // (broken across a side road's mouth: 2 m dashes)
            if (Math.floor(i / 2) % 3 === 0) ln.push([-0.07, 0.07]);   // (the centre line: 4 m dashes, 8 m gaps)
            for (const [o0, o1] of ln) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], sc = onBr[i] ? deck : gc;
            const ei = wE(si, i), ej = wE(si, j);
            void sc;   // (the shoulder is now the head of the verge's profile, in the verge's mesh)
            if (ei > w + 0.02 || ej > w + 0.02) {   // a sidewalk, flush with the road (part of it): a granite kerb line, then small grey pavers
              const ki = Math.min(ei, w + 0.22), kj = Math.min(ej, w + 0.22), kc = [0.8, 0.8, 0.78], pc = (o) => { const k = 0.8 + 0.05 * rpHash(i, 31 + Math.round(o)); return [k, k * 0.98, k * 0.95]; };
              gl.quadUp(Pt(i, side * w, 0.03), Pt(i, side * ki, 0.03), Pt(j, side * kj, 0.03), Pt(j, side * w, 0.03), [kc, kc, kc, kc]);
              if (ei > ki + 0.01 || ej > kj + 0.01) gp.quadUp(Pt(i, side * ki, 0.028), Pt(i, side * ei, 0.028), Pt(j, side * ej, 0.028), Pt(j, side * kj, 0.028), [pc(ki), pc(ei), pc(ej), pc(kj)],
                [[ki * 0.55, s0 * 3.3], [ei * 0.55, s0 * 3.3], [ej * 0.55, s1 * 3.3], [kj * 0.55, s1 * 3.3]]);
            }
            for (let k = 0; k < qi.length - 1; k++) { if (EDGE.quad && EDGE.quad(gv, i, j, side, si, k, qi, qj, ci, cj, wuv)) continue;
              const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        SB.emit(c0, c0 + 60, gr, gs, gl);   // (the side roads' surfaces, their junctions in this chunk)
        addM(gr, aMat); addM(gp, cMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // chequered start and finish lines (the finish's in its group), a white line at each checkpoint
      const gq = new GB(true), gqF = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        (s0 === sFin ? gqF : gq).quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      for (const z0 of def.zebras || []) { const s0 = sStart + z0;   // the zebra crossings: white bars along the road, 0.5 m wide and 0.5 m apart, 3 m long, over the carriageway
        for (let o = -w + 0.35; o + 0.5 <= w - 0.3; o += 1.0) { const a = atSf(s0 - 1.5, o), b = atSf(s0 - 1.5, o + 0.5), c = atSf(s0 + 1.5, o + 0.5), d = atSf(s0 + 1.5, o), y = (p) => T.hy[p[3]] + 0.04;
          gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); } }
      tex.checker.repeat.set(1, 1); const qMat = new THREE.MeshLambertMaterial({ map: tex.checker }); addM(gq, qMat); addM(gqF, qMat, false, finG); addM(gw, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), fac = new Chunks(110, true), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (fac: the houses' walls; ban: the race's boards, ban2: the signs)
    const finS = new GB(), finB = new GB(true);   // (the finish's gantry and flags, its board: finG)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.86, 0.14, 0.12], [0.96, 0.82, 0.2], [0.16, 0.36, 0.78], [0.95, 0.95, 0.95], [0.2, 0.6, 0.3], [1, 0.55, 0.1], [0.12, 0.14, 0.2], [0.16, 0.36, 0.78], [0.95, 0.95, 0.95]];   // (Slovenian white, blue and red twice)
    const CR = crowdCtx({ gH: vrGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => vrWater(x, z).e > -4 }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const arch = (s, rowK, postCol, beamCol, G, B) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways (into G and B, else the scenery and ban); returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = G || scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1, 0, 1, B);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, vrGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const carPk = (x, z, rot, col) => { const g = scen.get(x, z), y = vrGround(x, z), c = Math.cos(rot), s = Math.sin(rot);   // parked car
      box(g, x, y + 0.25, z, 4.3, 0.8, 1.85, rot, col, null, true); box(g, x - c * 0.35, y + 1.05, z - s * 0.35, 2.3, 0.62, 1.62, rot, [0.16, 0.2, 0.26], col, true);
      for (const [a, b] of [[1.35, 0.8], [1.35, -0.8], [-1.35, 0.8], [-1.35, -0.8]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.66, 0.66, 0.24, rot, [0.08, 0.08, 0.09], null, true); };
    const flagSI = (g, x, y, z, rot, h) => {   // a flag pole with the Slovenian flag: white, blue, red (no coat of arms at this size), both faces
      cyl(g, x, y - 0.2, z, 0.06, h + 0.2, 5, [0.94, 0.94, 0.92], [0.9, 0.78, 0.2]);
      const c = Math.cos(rot), s = Math.sin(rot), fw = 1.8, fh = 0.9, at = (u) => [x + c * (u + 0.06), z + s * (u + 0.06)], [fx, fz] = at(fw / 2), y0 = y + h - fh - 0.15;
      box(g, fx, y0 + fh * 2 / 3, fz, fw, fh / 3, 0.04, rot, [0.96, 0.96, 0.95]); box(g, fx, y0 + fh / 3, fz, fw, fh / 3, 0.04, rot, [0.1, 0.24, 0.62]); box(g, fx, y0, fz, fw, fh / 3, 0.04, rot, [0.84, 0.12, 0.1]); };

    /* ---- the buildings: the alpine houses and hotels of Kranjska Gora (plastered storeys with windows and green shutters, timber gables, wide low
       roofs), sheds and garages, the church's tower, the mountain huts with their name boards, the Russian Chapel, the lookout tower at Jasna ---- */
    let nBld = 0;
    {
      const RB = rng(7621), walls = [[0.96, 0.95, 0.9], [0.95, 0.9, 0.78], [0.93, 0.93, 0.91], [0.94, 0.86, 0.7], [0.97, 0.96, 0.93]], roofs = [[0.3, 0.29, 0.3], [0.36, 0.22, 0.16], [0.42, 0.2, 0.14], [0.26, 0.27, 0.3]], woods = [[0.42, 0.28, 0.16], [0.5, 0.34, 0.2], [0.36, 0.24, 0.15]];
      const lowHigh = (b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9; for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = vrGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
      for (const b of blds) {
        const g = scen.get(b.x, b.z), [lo, hi] = lowHigh(b), key = VR_HUTS.findIndex(([n]) => b.name.startsWith(n)), A = hi + base;
        if (b.name.startsWith('Ruska kapelica')) { vrChapel(g, b.x, b.pad ? b.pad.h : hi, b.z, b.ang, RB); }
        else if (b.name.startsWith('Razgledni stolp')) {   // the wooden lookout tower by the lakes: four legs, two platforms, a hipped roof
          const y = b.pad ? b.pad.h : hi, c = Math.cos(b.ang), s = Math.sin(b.ang), wd = [0.45, 0.32, 0.2];
          for (const [u, v] of [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]]) cyl(g, b.x + c * u - s * v, y - 0.3, b.z + s * u + c * v, 0.14, 10.5, 5, wd);
          for (const yy of [4.5, 8.4]) box(g, b.x, y + yy, b.z, 3.9, 0.2, 3.9, b.ang, [0.52, 0.38, 0.24]);
          box(g, b.x, y + 8.6, b.z, 3.9, 1.0, 3.9, b.ang, [0.5, 0.36, 0.22]); cone(g, b.x, y + 10.2, b.z, 3.0, 2.0, 4, [0.3, 0.24, 0.18], [0.3, 0.24, 0.18], b.ang + PI / 4);
        }
        else if (b.kind === 4) vrHut(g, b.x, b.pad ? b.pad.h : hi, b.z, b.ang, Math.max(8, Math.min(24, b.L)), Math.max(7, Math.min(14, b.W)), A > 1500 && VRS !== 'summer');   // (snow on the roofs up high: autumn's first snow)
        else if (b.kind === 3) {   // shed, garage, hay barn: timber on a low stone base, a shallow roof
          const wd = vary(woods[Math.floor(RB() * 3)], RB, 0.12); box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 0.3 + 2.4, b.W, b.ang, wd, null, true);
          gable(g, b.x, hi + 2.1, b.z, b.L + 0.8, b.W + 0.8, Math.min(b.L, b.W) * 0.24, b.ang, vary(roofs[Math.floor(RB() * 4)], RB, 0.1), wd);
        } else if (b.kind === 2) {   // a church: white walls, a steep roof, a bell tower with a pointed spire at the front
          const H = Math.max(6, b.hgt || 8), wl = [0.95, 0.94, 0.9], c = Math.cos(b.ang), s = Math.sin(b.ang);
          box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + H, b.W, b.ang, wl, null, true); gable(g, b.x, hi + H - 0.3, b.z, b.L + 0.6, b.W + 0.6, b.W * 0.5, b.ang, [0.42, 0.2, 0.14], wl);
          if (b.L > 12) { const tw = Math.min(5, b.W * 0.45), tx = b.x + c * (b.L / 2 + tw / 2 - 0.2), tz = b.z + s * (b.L / 2 + tw / 2 - 0.2);
            box(g, tx, lo - 0.3, tz, tw, hi - lo + H + 11, tw, b.ang, wl, null, true); cone(g, tx, hi + H + 10.7, tz, tw * 0.72, 9, 4, [0.3, 0.32, 0.3], [0.3, 0.32, 0.3], b.ang + PI / 4); }
        } else {   // a house (kind 0: 2-3 storeys) or a hotel (kind 1: 3-5)
          const fl = b.kind === 1 ? clamp(Math.round((b.hgt || 11) / 2.9), 3, 5) : b.hgt > 8 ? 3 : b.L * b.W > 180 ? 3 : 2;
          vrHouse(g, fac.get(b.x, b.z), b.x, lo, hi, b.z, b.ang, b.L, b.W, fl, { wall: walls[Math.floor(RB() * walls.length)], wood: vary(woods[Math.floor(RB() * 3)], RB, 0.1), roof: vary(roofs[Math.floor(RB() * 4)], RB, 0.1) });
        }
        if (key >= 0) {   // the hut's (and the chapel's) board by the road: at the nearest point of the road, on the hut's side, facing the cars coming up
          const i = T.nearestIdx(b.x, b.z), side = (b.x - T.px[i]) * T.nx[i] + (b.z - T.pz[i]) * T.nz[i] > 0 ? 1 : -1, [px, pz, ii] = onSide(i * T.ds - 12, side, 1.4);
          if (!excluded(px, pz)) { const py = vrGround(px, pz), gs = scen.get(px, pz), wd = [0.36, 0.25, 0.16];
            for (const u of [-1.2, 1.2]) box(gs, px + T.tx[ii] * u, py - 0.2, pz + T.tz[ii] * u, 0.12, 2.3, 0.12, T.hd[ii], wd);
            bannerQ(px, py + 1.3, pz, -T.tx[ii], -T.tz[ii], 2.8, 0.7, 1 - (3 + Math.floor(key / 2) + 1) / 8, 1 - (3 + Math.floor(key / 2)) / 8, (key % 2) * 0.5, (key % 2) * 0.5 + 0.5, ban2);
            exclPush(px, pz, 2); CR.block(px, pz, 2.8, 0.5, T.hd[ii]); }
        }
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang);
        nBld++;
      }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- START (Kranjska Gora): gantry with the start lights, the timing hut, flags along the grid, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z);
      box(g, x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);   // light panel on top of the beam
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = vrGround(hx, hz), gh = scen.get(hx, hz);   // timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.92, 0.9, 0.84], [0.5, 0.3, 0.2], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.1, T.hd[i], [0.42, 0.2, 0.14], [0.92, 0.9, 0.84]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      for (let s = 8; s < sStart + 50; s += 12) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3); if ((excluded(px, pz) && s > sStart - 8) || vrStubAt(px, pz, 1)) continue; flagSI(scen.get(px, pz), px, vrGround(px, pz), pz, T.hd[ii], 6); }   // (none in a side road's mouth)
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = vrGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }

    /* ---- the signs of the zebra crossings (a blue board with a white triangle, both sides of the road, both ways) and the bus stops (a pole with the
       blue board and its white bus, a bench; a shelter at the bigger ones) ---- */
    {
      const blue = [0.1, 0.3, 0.72], wh = [0.95, 0.95, 0.94], poleC = [0.62, 0.63, 0.66];
      const board = (s0, side, fig) => {   // a square board on a pole beside the road's edge, its faces along the road (seen by the cars both ways)
        const i = T.idx(s0), o = side * (wE(side > 0 ? 1 : 0, i) + 0.7), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = vrGround(x, z), g = scen.get(x, z), hd = T.hd[i];
        if (excluded(x, z)) return null;
        cyl(g, x, y - 0.2, z, 0.04, 2.75, 5, poleC); box(g, x, y + 1.95, z, 0.05, 0.64, 0.64, hd, blue);
        const c = Math.cos(hd), sn = Math.sin(hd), L = (lx, ly, lz) => [x + lx * c - lz * sn, y + ly, z + lx * sn + lz * c], inn = [x, y + 2.27, z];
        for (const f of [-1, 1]) { const fx = f * 0.032;
          if (fig === 'zebra') g.triO(L(fx, 2.47, 0), L(fx, 2.05, -0.25), L(fx, 2.05, 0.25), wh, inn);
          else { g.quadO(L(fx, 2.12, -0.22), L(fx, 2.12, 0.22), L(fx, 2.4, 0.22), L(fx, 2.4, -0.22), wh, inn); g.quadO(L(f * 0.034, 2.26, -0.19), L(f * 0.034, 2.26, 0.19), L(f * 0.034, 2.36, 0.19), L(f * 0.034, 2.36, -0.19), blue, inn); } }
        exclPush(x, z, 1.2); return [x, y, z, i];
      };
      for (const z0 of def.zebras || []) for (const side of [-1, 1]) board(sStart + z0 - side * 4, side, 'zebra');
      (def.stops || []).forEach(([d, side, name]) => { const b = board(sStart + d, side, 'bus'); if (!b) return;
        const [x, y, z, i] = b, g = scen.get(x, z), o = side * (wE(side > 0 ? 1 : 0, i) + 1.9), bx = T.px[i] + T.nx[i] * o - T.tx[i] * 2.2, bz = T.pz[i] + T.nz[i] * o - T.tz[i] * 2.2, by = vrGround(bx, bz);
        if (excluded(bx, bz)) return;
        box(g, bx, by + 0.42, bz, 1.8, 0.06, 0.45, T.hd[i], [0.46, 0.32, 0.2]); for (const u of [-0.75, 0.75]) box(g, bx + T.tx[i] * u, by, bz + T.tz[i] * u, 0.08, 0.42, 0.4, T.hd[i], [0.3, 0.3, 0.32]);   // (a bench)
        if (name === 'Jasna' || name === 'Vršič' || name === 'Mihov dom') {   // a shelter: a back wall of glass, a flat roof on posts
          const ox = T.nx[i] * side * 0.9, oz = T.nz[i] * side * 0.9;
          box(g, bx + ox, by, bz + oz, 3.2, 2.3, 0.06, T.hd[i], [0.62, 0.74, 0.8]); box(g, bx + ox * 0.4, by + 2.3, bz + oz * 0.4, 3.5, 0.1, 1.7, T.hd[i], [0.36, 0.38, 0.42]);
          for (const u of [-1.6, 1.6]) box(g, bx + ox + T.tx[i] * u, by, bz + oz + T.tz[i] * u, 0.08, 2.3, 0.08, T.hd[i], [0.36, 0.38, 0.42]); }
        exclPush(bx, bz, 2.6); CR.block(bx, bz, 3.4, 1.8, T.hd[i]); });
    }

    /* ---- checkpoints: a green gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.12, 0.42, 0.24]));

    /* ---- FINISH (the pass): chequered gantry and flags (the race's: finG), the pass sign on a stone plinth, the car park with its cars and walkers, the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12], finS, finB);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4), py = vrGround(px, pz), gg = finS;
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const [sx, sz, si] = onSide(sFin + 18, sdP, 3.2), sy = vrGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the pass sign: a board on posts leaning back, facing the arriving cars
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.36, 0.24, 0.14]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.62, 0.6, 0.56], [0.7, 0.68, 0.64]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 5);
      const hh = T.hd[iF], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 8; k++) { const a = -12 + (k % 4) * 6.5, b = (k < 4 ? -4 : 4) * sdP, px = padP.x - sn * b + c * a, pz = padP.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5) continue; carPk(px, pz, hh + PI / 2, vary(fans[(k * 3) % fans.length], R, 0.2)); }
      for (let k = 0; k < 18; k++) { const px = padP.x + (R() - 0.5) * 22, pz = padP.z + (R() - 0.5) * 22; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road down the far side: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
    }

    /* ---- the building at the top of the run from the police, just past the pass (vrHideout; only in that mode) ---- */
    out.dyn.vrHide = vrHideout({ root, matV, sMat, exclPush, CR });

    /* ---- guardrails where the ground falls away and round the outside of the bends (not in the village), stone parapets round the cobbled hairpins
       and on the bridges; a marker post every ~50 m where there is neither (knockable where it fits: vrsicProps) ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];   // a drop: 2.4 m within 8 m of the barrier, or a fall-off farther out
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (vrGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), steel = [0.78, 0.8, 0.82], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52], lime = [0.7, 0.68, 0.63];
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || onBr[i] || vrLCf(T.px[i], T.pz[i], 3) > 0.5) nd[i] = 0;   // (the start and the pass, the bridges and the village stay open)
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }   // close short gaps
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }   // drop tiny bits
        const gp = T.gap ? T.gap[side > 0 ? 1 : 0] : null; if (gp) for (let i = 0; i < N; i++) if (gp[i]) nd[i] = 0;   // a side road's mouth: open (only now, or the gap closing above would shut it again)
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        if (gp) for (let i = 1; i < N - 1; i++) if (nd[i] && !sett[i] && !onBr[i] && ((gp[i + 1] && !nd[i + 1]) || (gp[i - 1] && !nd[i - 1]))) {   // the rail's end at a mouth: a terminal bent back away from the road, its post
          const dir = gp[i + 1] && !nd[i + 1] ? 1 : -1, g = scen.get(T.px[i], T.pz[i]), tx = T.tx[i] * dir, tz = T.tz[i] * dir, ox = T.nx[i] * side, oz = T.nz[i] * side;
          const A = Q(i, 0.45), D = Q(i, 0.8), at = (p, a, b, dy) => [p[0] + tx * a + ox * b, p[1] + dy, p[2] + tz * a + oz * b], B = at(A, 1.3, 0.55, -0.05), C = at(D, 1.3, 0.55, -0.12);
          g.quadO(A, B, C, D, steel, at(A, -0.5, 3, 0.15)); g.quadO(A, B, C, D, steelB, at(A, 0.3, -3, 0.15));
          const p = at(Q(i, -0.35, 0.14), 1.1, 0.5, 0); box(g, p[0], p[1], p[2], 0.13, 1.05, 0.13, T.hd[i], postC, null, true);
        }
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]), both = (a) => a[i] && a[i + 1];
          if (both(onBr)) {   // a bridge: a concrete parapet with a stone coping
            const a = Q(i, -0.1, -0.05), b = Q(i + 1, -0.1, -0.05), c = Q(i + 1, 0.95, -0.05), d = Q(i, 0.95, -0.05), a2 = Q(i, -0.1, 0.4), b2 = Q(i + 1, -0.1, 0.4), c2 = Q(i + 1, 0.95, 0.4), d2 = Q(i, 0.95, 0.4), inn = Q(i, 0.4, 0.18);
            g.quadO(a, b, c, d, [0.68, 0.67, 0.64], inn); g.quadO(a2, b2, c2, d2, [0.6, 0.59, 0.56], inn); g.quadO(d, c, c2, d2, [0.76, 0.74, 0.7], inn);
          } else if (nd[i] && nd[i + 1] && (sett[i] || sett[i + 1])) {   // round a cobbled hairpin: a low wall of mortared limestone
            const k = 0.9 + 0.2 * rpHash(i, side + 5), col = [lime[0] * k, lime[1] * k, lime[2] * k], a = Q(i, -0.2, -0.1), b = Q(i + 1, -0.2, -0.1), c = Q(i + 1, 0.72, -0.1), d = Q(i, 0.72, -0.1), a2 = Q(i, -0.4, 0.4), b2 = Q(i + 1, -0.4, 0.4), c2 = Q(i + 1, 0.72, 0.4), d2 = Q(i, 0.72, 0.4), inn = Q(i, 0.3, 0.15);
            g.quadO(a, b, c, d, col, inn); g.quadO(a2, b2, c2, d2, [col[0] * 0.86, col[1] * 0.86, col[2] * 0.86], inn); g.quadO(d, c, c2, d2, [col[0] * 1.1, col[1] * 1.1, col[2] * 1.1], inn);
          } else if (nd[i] && nd[i + 1]) {   // W-beam: a front and a back face, a post every 4 m
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
          } else if (!nd[i] && !onBr[i] && !(gp && gp[i]) && i % 25 === 0 && i > 2 && i < iE - 2) mkPosts.push([i, side]);
        }
      }
      out.rsRail = need; out.rsBr = onBr;   // (the rails and the parapets as drawn: the roadside signs stand wholly in front of them or behind them, roadside)
      const kp = vrsicProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;   // knockable where they fit on the verge; the rest stay fixed beside the barrier line
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]), tall = altAt(i) > 1450 ? 1.9 : 1;
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2 * tall, 0.13, T.hd[i], tall > 1 ? [0.95, 0.5, 0.12] : [0.94, 0.94, 0.92], null, true);
        box(g, p[0], p[1] + 0.72 * tall, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
    }

    /* ---- the side roads' posts, cones, rails and gates, the streets' names (stubProps; their surfaces: stubGeo, in the road's chunks) ---- */
    out.stubStats = stubProps({ scen, out, root, gH: vrGround, loc: { closed: 'CESTA ZAPRTA', gate: 'ZAPRTO', plate: ['#1d4f9a', '#f4f3ee'] }, posts: 'along', village: 1250,
      postCol: (S) => (T.hy[S.i0] + VR.D.base > 1450 ? 1 : 0), nameOf: (n) => n.replace(/ c$/, ' cesta') });

    /* ---- the hairpins' signs (number and altitude, as on the real road) 25 m before each, on the right, facing the cars coming up ---- */
    (def.hairpins || []).forEach(([d, , turn], k) => {
      const [px, pz, ii] = onSide(sStart + d - 25, 1, 0.9); if (excluded(px, pz)) return;
      const py = vrGround(px, pz), g = scen.get(px, pz), u0 = (k % 8) / 8, v1 = 1 - Math.floor(k / 8) / 8;
      box(g, px, py - 0.2, pz, 0.08, 2.1, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
      bannerQ(px, py + 1.2, pz, -T.tx[ii], -T.tz[ii], 0.85, 0.85, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2);
      exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8);
    });

    /* ---- Jasna: Zlatorog on his rock at the water's edge of the big lake, where it comes nearest the road ---- */
    {
      const L = P.lakes.reduce((a, b) => (!a || b.area > a.area ? b : a), null);
      if (L) { let best = null, bd = 1e9;
        for (const [x, z] of L.poly) { const n = vrNear(x, z); if (n.i >= 0 && n.dd > 3 && n.dd < bd) { bd = n.dd; best = [x, z]; } }
        if (best) { const [bx, bz] = best, dx = L.cx - bx, dz = L.cz - bz, dl = Math.hypot(dx, dz) || 1; let x = bx, z = bz;
          for (let k = 0; k < 60 && vrGround(x, z) > L.h + 0.1; k++) { x += dx / dl; z += dz / dl; }   // (out to the water's edge: near the road the ground is the road's)
          x += dx / dl * 1.5; z += dz / dl * 1.5; const g = scen.get(x, z), top = L.h + 1.6;
          API.ROCK_SMOOTH = true; rock(g, x, L.h + 0.2, z, 2.2, 1.8, 1.8, R() * TAU, [0.72, 0.7, 0.66], R, 0.25); API.ROCK_SMOOTH = false;
          const i = T.nearestIdx(x, z); vrGoat(g, x, top, z, Math.atan2(T.pz[i] - z, T.px[i] - x) + PI / 2);
          exclPush(x, z, 5); out.marks.Zlatorog = [x, z]; }
      }
    }

    /* ---- spectators: the start and the finish (the finish's in a layer of its own, CRF: finG), the checkpoints, the insides and outsides of every
       third hairpin, the lake shore at Jasna ---- */
    const CRF = crowdSub(CR);
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };   // buildings, plots
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.12, keepBar: 1.6 };
      const run = (sa, sb, side, o, C) => crowdRun(C || CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'VR start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'VR finish' }, CRF); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.55, label: 'VR cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.4, label: 'VR cp-' }); });
      (def.hairpins || []).forEach(([d, , turn], k) => { if (k % 3 !== 1) return; const sm = sStart + d; for (const sd of [-1, 1]) run(sm - 22, sm + 22, sd, { rows: 3, dens: sd === turn ? 0.5 : 0.35, flag: 0.2, label: 'VR hairpin ' + (k + 1) }); });
      { const jn = T.names.find(n => n.n === 'Jasna'); if (jn) for (const sd of [-1, 1]) run(sStart + jn.d - 60, sStart + jn.d + 90, sd, { rows: 2, dens: 0.3, clump: 0.9, label: 'VR Jasna' }); }
      for (let s = sStart + 300; s < sFin - 300; s += 520) { const sd = rpHash(Math.round(s), 3) < 0.5 ? -1 : 1; run(s, s + 24, sd, { rows: 2, dens: 0.35, clump: 0.9, label: 'VR group' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);   // the trees keep clear of the crowds

    /* ---- the autumn forest (instanced per 96 m chunk): beech and spruce low down, more and more larches higher up, dwarf pines on the scrub and near
       the pass, birches and rowans at the edges; lone larches out on the high meadows; under the first snow near the top (the ground's snow line)
       the spruces, larches and dwarf pines white on top. Right up to the ditch, thinner and bigger farther out ---- */
    const tMatT = API.ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 3, 4, 5, 6, 7].map(k => new IChunks(vrTreeGeo(k), tMatT, 96));
    let nTrees = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(110000 * dens), RT = rng(7641), SP = 5.6 / Math.sqrt(dens);   // (the cap is only a safety net)
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(250)) continue;
          if (hd > LOD.radius(90) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // farther out every other spot (bigger trees: a closed canopy from above)
          const c = vrLC(x, z), p = c === 1 ? 0.93 : c === 2 ? 0.5 : c === 0 ? 0.05 + 0.22 * sstep(0.62, 0.8, P.n5(x * 1.3 + 40, z * 1.3)) : c === 3 ? 0.05 : c === 4 ? 0.03 : 0;
          if (r1 > p) continue;
          if (vrWater(x, z).e > -4) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.2) continue; if (nn.i >= 0 && nn.dd < 5 && r2 < 0.18) continue;
          if (excluded(x, z)) continue;
          const y = vrGround(x, z), A = y + base, up = sstep(1050, 1450, A); if (vrSlope(x, z) > 1.25) continue;   // (none on the cliffs)
          let sp;
          if (c === 2 || (A > 1570 && r3 < 0.55)) sp = 3;
          else { const pB = lerp(0.46, 0.03, up) * (1 - 0.8 * sstep(0.62, 0.78, P.n7(x + 300, z))), pL = lerp(0.1, 0.6, up) + 0.25 * sstep(0.6, 0.8, P.n1(x * 1.6 + 70, z * 1.6)), pBi = 0.07 * (1 - up) + (nn.i >= 0 && nn.dd < 14 ? 0.08 : 0);
            sp = r3 < pB ? 2 : r3 < pB + pL ? 1 : r3 < pB + pL + pBi ? 4 : 0; }
          if (c === 0 && sp === 2 && A > 1000) sp = 1;   // (the lone trees on the high meadows are larches)
          const shrink = lerp(1, 0.5, sstep(1350, 1700, A)), far = hd > 90 ? 1.15 : 1;
          let hgt, wid, col;
          if (sp === 0) { hgt = (16 + r4 * 12) * shrink; wid = hgt * (0.5 + r2 * 0.12); col = [0.9 + r2 * 0.2, 0.92 + r4 * 0.16, 0.9 + r3 * 0.2]; }
          else if (sp === 1) { hgt = (14 + r4 * 10) * shrink; wid = hgt * (0.55 + r2 * 0.15); col = VRS === 'summer' ? (r2 < 0.25 ? [0.9, 1, 0.9] : r2 < 0.8 ? [1, 1, 1] : [1.08, 1.05, 0.9]) : r2 < 0.18 ? [0.82, 0.96, 0.7] : r2 < 0.78 ? [1, 0.98, 0.94] : [1.06, 0.82, 0.6]; }   // yellow-green, gold, orange
          else if (sp === 2) { hgt = (14 + r4 * 10) * shrink; wid = hgt * (0.8 + r2 * 0.25); col = VRS === 'summer' ? (r2 < 0.22 ? [1.1, 1.08, 0.95] : r2 < 0.6 ? [1, 1, 1] : r2 < 0.86 ? [0.9, 0.95, 0.9] : [0.82, 0.88, 0.84]) : r2 < 0.22 ? [1.06, 1.18, 0.92] : r2 < 0.6 ? [1, 1, 1] : r2 < 0.86 ? [0.88, 0.76, 0.68] : [0.74, 0.6, 0.55]; }   // yellow, copper, rust, brown
          else if (sp === 3) { hgt = 1.3 + r4 * 1.5; wid = 3 + r2 * 3; col = [0.9 + r3 * 0.2, 0.95 + r4 * 0.1, 0.9]; }
          else { hgt = 9 + r4 * 6; wid = hgt * (0.7 + r2 * 0.2); col = r3 < 0.35 ? (VRS === 'summer' ? [0.92, 1.02, 0.9] : [0.88, 0.36, 0.28]) : [1, 1, 1]; }   // (a third of them rowans in red)
          const kind = vrSnow(x, z, A, 0.9) > 0.4 ? [5, 6, 2, 7, 4][sp] : sp;
          tk[kind].add(x, y - 0.15, z, r1 * 70, wid * far, hgt * far, col);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);

    /* ---- the verges: shrubs in their autumn colours right behind the barrier (hazel yellow, bramble and dogwood red, faded olive), tufts of dry
       grass higher up; limestone boulders and crags where the slope rises steep beside the road; up high the snow the ploughs pushed off the road ---- */
    {
      const RV = rng(7651), su = VRS === 'summer', bushC = su ? [[0.3, 0.44, 0.16], [0.24, 0.36, 0.13], [0.36, 0.46, 0.18], [0.28, 0.4, 0.2], [0.34, 0.4, 0.15]] : [[0.72, 0.56, 0.2], [0.62, 0.26, 0.12], [0.44, 0.44, 0.18], [0.78, 0.44, 0.14], [0.5, 0.34, 0.14]],
        tuftC = su ? [[0.42, 0.5, 0.24], [0.36, 0.46, 0.2], [0.48, 0.52, 0.28]] : [[0.66, 0.58, 0.32], [0.6, 0.5, 0.28], [0.54, 0.5, 0.26]];
      const lime = [[0.76, 0.75, 0.71], [0.7, 0.69, 0.66], [0.8, 0.78, 0.73]], snowC = [0.95, 0.96, 1.0];
      API.ROCK_SMOOTH = true;
      for (let s = 4; s < T.len - 4; s += 3.2) for (const side of [-1, 1]) {
        const i = T.idx(s), A = altAt(i), r = RV(), [x, z] = onSide(s, side, 1.2 + RV() * 6);
        if (vrNear(x, z).dd < 0.8 || excluded(x, z) || vrWater(x, z).e > -3) continue;
        const y = vrGround(x, z), g = scen.get(x, z), snowy = vrSnow(x, z, A, 0.9);
        if (A > 1520 && snowy > 0.3 && !onBr[i] && r < 0.7) {   // a ploughed snow bank
          const [bx, bz] = onSide(s, side, 0.5 + RV() * 1.4); if (vrNear(bx, bz).dd < 0.3) continue;
          const ry = 0.55 + RV() * 0.3; rock(g, bx, vrGround(bx, bz) + ry * 0.4 - 0.08, bz, 2.4 + RV() * 1.2, ry, 0.8 + RV() * 0.35, T.hd[i], snowC, RV, 0.12, 0.25); continue; }
        if (A < 1480 && r < 0.24) ico(g, x, y + 0.35, z, 0.7 + RV() * 0.8, 0.8, vary(bushC[Math.floor(RV() * bushC.length)], RV, 0.15), RV, 0.3);
        else if (A >= 1480 && r < 0.3 && snowy < 0.5) { const col = tuftC[Math.floor(RV() * 3)]; for (let q = 0; q < 2; q++) cone(g, x + (RV() - 0.5) * 0.6, y, z + (RV() - 0.5) * 0.6, 0.12 + RV() * 0.1, 0.35 + RV() * 0.4, 4, vary(col, RV, 0.12), [col[0] * 1.2, col[1] * 1.15, col[2] * 1.1], RV() * TAU); }
      }
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {   // limestone at the foot of the cuts and out on the scree
        const i = T.idx(s), A = altAt(i); if (A < 950 || RV() > 0.3) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 40, [x, z] = onSide(s, side, o), sz = 0.5 + RV() * 1.3; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = vrGround(x, z), sl = vrSlope(x, z), scree = vrLC(x, z) === 4; if (sl < 0.35 && !scree) continue;
        const g = scen.get(x, z), col = vary(lime[Math.floor(RV() * 3)], RV, 0.1);
        rock(g, x, y + sz * 0.3, z, sz * 1.2, sz, sz, RV() * TAU, col, RV, 0.3);
        if (vrSnow(x, z, A, 0.9) > 0.4) ico(g, x, y + sz * 0.85, z, sz * 0.75, 0.3, snowC, RV, 0.2);   // (a cap of snow)
      }
      API.ROCK_SMOOTH = false;
      for (let s = 16; s < T.len - 16; s += 18) for (const side of [-1, 1]) {   // crags where the slope is steep
        if (RV() < 0.45) continue;
        const [x, z] = onSide(s, side, 8 + RV() * 60); if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(90)) continue;
        const sl = vrSlope(x, z); if (sl < 0.7) continue;
        const y = vrGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(lime[Math.floor(RV() * 3)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 2 + RV() * 3.4, qx = x + (RV() - 0.5) * 7, qz = z + (RV() - 0.5) * 7, qy = vrGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.4, qz, r0, r0 * (0.8 + RV() * 0.8), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, 0.35); }
      }
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fac.addTo(sceneryGroup, API.ouCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), true, true);
    const banMat = new THREE.MeshLambertMaterial({ map: vrAtlas(cpAlt), side: THREE.FrontSide });
    const bm = addM(ban, banMat, true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: vrAtlas2(def.hairpins || []), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    addM(finS, matV, true, finG); addM(finB, banMat, false, finG);   // (the finish's gantry, flags and board)
    crowdFinish(CR, root, out);
    out.crowdN += crowdLayer(CRF, finG);   // (the finish's crowd)
    out.stats = { trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), sideRoads: out.stubStats.n };   // (read by the tests)
    return out;
  }

  Object.assign(API, { VRC, VRHC, VRSP, VRSQ, VRT, stubExcl, stubGeo, stubProps, stubRails, stubVerge, vrCol, vrDem, vrDist, vrFar, vrGCol, vrGH, vrGritTex, vrGround, vrHouse, vrLC, vrLCf, vrNear, vrPrep, vrSlope, vrStubAt, vrStubH, vrStubs, vrTileGeo, vrTileOn, vrTreeGeo, vrWater, vrsicProps });   // (what World and the other worlds use of this one)
  Object.defineProperties(API, { STG: { get: () => STG, set: (v) => { STG = v; } }, VR: { get: () => VR, set: (v) => { VR = v; } }, VRS: { get: () => VRS, set: (v) => { VRS = v; } } });
  World.ext.vrsic = (scene, tex, opts) => buildVrsic(scene, tex, opts);
})();
