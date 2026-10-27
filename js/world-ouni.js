/* =========================================================================
   WORLD — Ouninpohja (theme 'ouni'): its own builder (World.ext.ouni), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, addShore, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl, gable, ico, inPoly, lerp,
    mergeBands, pkSky, polyDist, propFloorTable, rng, roadsideProps, rock, shoreBand, sstep, starCone, valueNoise2, vary, waterMat, waterline
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= OUNINPOHJA (theme 'ouni') =================
     A scaled Rally Finland special stage: an open ~6 km gravel road (s = 0 at the pre-start end) through the lake district. As on Pikes Peak
     only a corridor around the road is built: a 5 m height grid in 100 m tiles; near the road the road's own height (blended from the nearby
     samples), farther out low rolling hills (the road's height trend plus noise), flat open fields (def.fields) and basins for the lakes
     (def.lakes, the water a little below the road). A dense forest of spruce, pine and birch stands right behind the ditch (instanced in 96 m
     chunks); red farmhouses and barns, grey hay barns and white silage bales on the fields, the Yellow House beside the big jump, saunas and
     jetties on the shore (def.farms), spectators at the jumps and junctions, and the rally's own boards: the start, the splits, the flying
     finish and the stop control. Hot loops live in these small functions (the big builder is not optimised by V8). */
  const OUC = 5, OUT = 20, OUHC = 32;          // terrain cell (m), tile size (cells), road-sample hash cell (m)
  let OU = null;                               // per-build data: sample hash, far-field grids, fields, lakes, terrain height grid, pads
  const OUN = { i: -1, d: 1e9, dd: 1e9, lat: 0, h: 0, hn: 0, fd: -40, we: -1e9, wl: -1, fs: false };   // ouNear: nearest sample, its distance and lateral offset, distance beyond the barrier, blended and exact road height;
                                                                                              // ouFW: the field distance, how deep inside a lake, which lake (fs: set for this point)
  const OUCOL = [0, 0, 0], OUW = { L: null, e: -1e9 };          // (ouCol's colour, ouWater's lake and how deep inside its shore line)
  // a band beside the road as a polygon: from road s0 to s1 on 'side', lateral offsets a (near edge) to b (far edge) from the centre line; the far
  // edge wavy (amp m), the ends rounded off; every ~12 m a point
  // (on the inside of a bend the far edge stays within 80 % of the tightest radius nearby, short of any other part of the road, and never steps back,
  // so the polygon never folds over itself)
  function ouBand(s0, s1, side, a, b, amp, seed) {
    const near = [], far = [], n = Math.max(3, Math.round((s1 - s0) / 12)), R = rng(seed), W = Math.round(24 / T.ds);
    const ph1 = R() * TAU, ph2 = R() * TAU;
    for (let k = 0; k <= n; k++) { const s = s0 + (s1 - s0) * k / n, i = T.idx(s), e = Math.max(0, Math.sin(Math.PI * k / n)), ox = T.nx[i] * side, oz = T.nz[i] * side;
      let bb = a + (b - a) * (0.35 + 0.65 * Math.pow(e, 0.35)) + amp * (Math.sin(s / 37 + ph1) * 0.6 + Math.sin(s / 13 + ph2) * 0.4) * e, kin = 0;
      for (let j = Math.max(0, i - W); j <= Math.min(T.N - 1, i + W); j++) kin = Math.max(kin, side * T.k[j]);   // the tightest bend towards this side nearby
      if (kin > 0) bb = Math.min(bb, Math.max(a + 2, 0.8 / kin));
      for (let o = a + 6; o < bb; o += 6) { const nn = ouNear(T.px[i] + ox * o, T.pz[i] + oz * o); if (nn.i >= 0 && Math.abs(nn.i - i) * T.ds > 60 && nn.d < 16) { bb = Math.max(a + 2, o - 14); break; } }   // nor across another part of the road
      near.push([T.px[i] + ox * a, T.pz[i] + oz * a]);
      const f = [T.px[i] + ox * bb, T.pz[i] + oz * bb], L = far[far.length - 1];
      if (!L || (f[0] - L[0]) * T.tx[i] + (f[1] - L[1]) * T.tz[i] > 0.5) far.push(f); }
    const poly = near.concat(far.reverse());
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    return { poly, x0, x1, z0, z1 };
  }
  function ouPrep() {
    const N = T.N, M = 420, def = T.def; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    const P = OU = { bx0: x0, bx1: x1, bz0: z0, bz1: z1, pads: [] };
    x0 -= M; x1 += M; z0 -= M; z1 += M; P.x0 = x0; P.z0 = z0;
    // every 2nd road sample (and the last one) in a hash grid
    P.cx0 = Math.floor(x0 / OUHC); P.cz0 = Math.floor(z0 / OUHC); P.ncx = Math.floor(x1 / OUHC) - P.cx0 + 1; P.ncz = Math.floor(z1 / OUHC) - P.cz0 + 1; P.cells = new Array(P.ncx * P.ncz);
    const add = (i) => { const k = (Math.floor(T.pz[i] / OUHC) - P.cz0) * P.ncx + Math.floor(T.px[i] / OUHC) - P.cx0; (P.cells[k] || (P.cells[k] = [])).push(i); };
    for (let i = 0; i < N; i += 2) add(i); if ((N - 1) % 2) add(N - 1);
    // far-field trend: inverse-distance average of the road heights on a 16 m grid, the distance to the road and its nearest sample (every 5th)
    const tc = 16, tnx = Math.ceil((x1 - x0) / tc) + 1, tnz = Math.ceil((z1 - z0) / tc) + 1, th = new Float32Array(tnx * tnz), td = new Float32Array(tnx * tnz), tn = new Int32Array(tnx * tnz);
    const sx = [], sz = [], sy = []; for (let i = 0; i < N; i += 5) { sx.push(T.px[i]); sz.push(T.pz[i]); sy.push(T.hy[i]); }
    const S = sx.length;
    for (let j = 0; j < tnz; j++) for (let i = 0; i < tnx; i++) {
      const x = x0 + i * tc, z = z0 + j * tc; let ws = 0, hs = 0, dm = 1e18, bk = 0;
      for (let k = 0; k < S; k++) { const dx = x - sx[k], dz = z - sz[k], d2 = dx * dx + dz * dz; if (d2 < dm) { dm = d2; bk = k; } const q = 1 / (d2 + 900), wq = q * q; ws += wq; hs += wq * sy[k]; }
      th[j * tnx + i] = hs / ws; td[j * tnx + i] = Math.sqrt(dm); tn[j * tnx + i] = bk * 5;
    }
    Object.assign(P, { tc, tnx, tnz, th, td, tn });
    // fields (def.fields [s0, s1, side, depth], metres after the start line): open land from the verge (w + 2) out to a wavy far edge, wherever the
    // nearest bit of road lies between s0 and s1 (ouField: so a field never folds over itself on the inside of a bend or across a hairpin);
    // lakes (def.lakes [s0, s1, side, gap, depth, level]): the shore polygon from gap to gap + depth off the centre line, the water surface at level
    const sS = T.startS;
    P.fields = (def.fields || []).map(([a, b, side, depth], k) => { const R = rng(700 + k); return { s0: sS + a, s1: sS + b, side, a: T.w + 2, depth, ph1: R() * TAU, ph2: R() * TAU }; });
    P.lakes = (def.lakes || []).map(([a, b, side, gap, depth, level], k) => Object.assign(ouBand(sS + a, sS + b, side, gap, gap + depth, 30, 800 + k), { h: level, side, gap, depth }));
    P.n1 = valueNoise2(501, 120); P.n2 = valueNoise2(502, 42); P.n3 = valueNoise2(503, 60); P.n4 = valueNoise2(504, 16); P.n5 = valueNoise2(505, 7); P.n6 = valueNoise2(506, 260);
    // islands (def.islands [lake, s, gap, radius], metres after the start line): a knoll of rock and pines out in a lake
    P.islands = (def.islands || []).map(([l, a, gap, r]) => { const L = P.lakes[l], i = T.idx(sS + a); return L ? { x: T.px[i] + T.nx[i] * L.side * gap, z: T.pz[i] + T.nz[i] * L.side * gap, r, L } : null; }).filter(Boolean);
    // terrain height grid (filled lazily, NaN = not computed yet); at each vertex also the distance beyond the nearest barrier, the field distance, how
    // deep inside a lake and which (for the colours)
    const G = P.G = { x0, z0 }; G.ntx = Math.ceil((x1 - x0) / (OUC * OUT)); G.ntz = Math.ceil((z1 - z0) / (OUC * OUT)); G.nx = G.ntx * OUT + 1; G.nz = G.ntz * OUT + 1;
    const NV = G.nx * G.nz; G.h = new Float32Array(NV).fill(NaN); G.dd = new Float32Array(NV); G.fd = new Float32Array(NV); G.we = new Float32Array(NV); G.wl = new Int8Array(NV); G.on = new Uint8Array(G.ntx * G.ntz);
  }
  function ouTG(a, x, z) {   // bilinear lookup in a far-field grid
    const P = OU, gx = clamp((x - P.x0) / P.tc, 0, P.tnx - 1.001), gz = clamp((z - P.z0) / P.tc, 0, P.tnz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = P.tnx;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function ouNear(x, z) {   // Shepard blend of the road heights around (x, z): weights fall with the distance beyond each sample's barrier
    const P = OU, cx = Math.floor(x / OUHC) - P.cx0, cz = Math.floor(z / OUHC) - P.cz0, ds = T.ds;
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
    OUN.i = bi; OUN.d = bd; OUN.dd = bdd; OUN.lat = bl;
    if (bi < 0) return OUN;
    OUN.h = hs / ws;
    const f = clamp(bi + ba / ds, 0, T.N - 1), i0 = Math.min(T.N - 2, Math.floor(f)); OUN.hn = T.hy[i0] + (T.hy[i0 + 1] - T.hy[i0]) * (f - i0);   // road height across from the point
    return OUN;
  }
  const OUS = { i: 0, s: 0, lat: 0 };
  function ouSeg(x, z) {   // the nearest road sample to (x, z) (from the 16 m grid, then the samples around it), the point's s and lateral offset there
    const P = OU, gi = clamp(Math.round((x - P.x0) / P.tc), 0, P.tnx - 1), gj = clamp(Math.round((z - P.z0) / P.tc), 0, P.tnz - 1), i0 = P.tn[gj * P.tnx + gi];
    let bi = i0, bd = 1e18; for (let i = Math.max(0, i0 - 9); i <= Math.min(T.N - 1, i0 + 9); i++) { const dx = x - T.px[i], dz = z - T.pz[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } }
    const dx = x - T.px[bi], dz = z - T.pz[bi]; OUS.i = bi; OUS.lat = dx * T.nx[bi] + dz * T.nz[bi]; OUS.s = bi * T.ds + clamp(dx * T.tx[bi] + dz * T.tz[bi], -T.ds, T.ds);
    return OUS;
  }
  function ouFieldFar(F, s) {   // a field's far edge at road s (m from the centre line): deepest in its middle, a wavy line
    const e = Math.max(0, Math.sin(Math.PI * clamp((s - F.s0) / (F.s1 - F.s0), 0, 1)));
    return F.a + (F.depth - F.a) * (0.35 + 0.65 * Math.pow(e, 0.35)) + 14 * (Math.sin(s / 37 + F.ph1) * 0.6 + Math.sin(s / 13 + F.ph2) * 0.4) * e;
  }
  function ouField(x, z) {   // signed distance to the nearest field's edge (m): positive inside (capped at 30), negative outside (down to -40)
    const L = OU.fields; if (!L.length) return -40;
    const q = ouSeg(x, z); let best = -40;
    for (const F of L) { const u = q.lat * F.side, d = Math.min(q.s - F.s0, F.s1 - q.s, u - F.a, ouFieldFar(F, q.s) - u); if (d > best) best = d; }
    return clamp(best, -40, 30); }
  function ouWater(x, z) {   // the lake at (x, z) and how far inside its shore polygon (OUW.L null: none within 60 m)
    OUW.L = null; OUW.e = -1e9;
    for (const L of OU.lakes) { if (x < L.x0 - 60 || x > L.x1 + 60 || z < L.z0 - 60 || z > L.z1 + 60) continue;
      const e = (inPoly(L.poly, x, z) ? 1 : -1) * polyDist(L.poly, x, z); if (e > OUW.e) { OUW.e = e; OUW.L = L; } }
    return OUW;
  }
  function ouFW(x, z) {   // the field distance and the lake at (x, z), into OUN (the grid keeps them for the colours)
    OUN.fd = ouField(x, z); const W = ouWater(x, z); OUN.we = W.e; OUN.wl = W.L ? OU.lakes.indexOf(W.L) : -1; OUN.fs = true;
  }
  function ouFar(x, z, dd) {   // the land away from the road: the road's height trend, low forested hills, flat fields, the lake basins
    const P = OU; let f = ouTG(P.th, x, z);
    ouFW(x, z); const flat = sstep(-16, 10, OUN.fd), L = OUN.wl >= 0 ? P.lakes[OUN.wl] : null;
    f += (P.n1(x, z) * 17 + P.n2(x, z) * 6 - 11.5) * sstep(8, 90, dd) * (1 - 0.85 * flat);   // hills and hollows (almost none on the fields)
    f += (P.n4(x, z) - 0.5) * 1.4 * (1 - flat);                                                // knolls and hummocks in the forest
    f += Math.max(0, P.n6(x, z) * 44 - 16) * sstep(110, 280, ouTG(P.td, x, z)) * (1 - 0.85 * flat);   // farther out the land rises into forested hills (the horizon of the side views)
    if (L) { const e = OUN.we, shore = L.h + 1.1 - 0.4 * e; if (e > -40) f = Math.min(f, e > 0 ? Math.max(L.h - 4.5, shore) : lerp(shore, f, sstep(0, -40, e))); }   // the basin: the water line ~3 m inside the polygon
    for (const I of P.islands) { const d = Math.hypot(x - I.x, z - I.z); if (d < I.r + 16) f = Math.max(f, I.L.h - 1.8 + 4.8 * sstep(I.r + 14, I.r * 0.35, d) + (P.n4(x * 2.3, z * 2.3) - 0.5) * 1.4); }   // an island: rock and moss out of the water
    return f;
  }
  function ouH(x, z) {   // terrain height
    const n = ouNear(x, z), i = n.i, dd = n.dd, hn = n.hn; let h;
    if (i < 0) h = ouFar(x, z, 200);
    else { const hr = lerp(hn, n.h, sstep(0, 6, dd)) - 0.3; h = dd <= 1 ? hr : lerp(hr, ouFar(x, z, dd), sstep(1, 40, dd)); }
    const pads = OU.pads; for (let k = 0; k < pads.length; k++) { const p = pads[k], d = Math.hypot(x - p.x, z - p.z), pb = p.b || 14; if (d < p.r + pb) h = lerp(p.h, h, sstep(p.r, p.r + pb, d)); }   // flat yards, the start and stop areas
    if (i >= 0 && dd < 6) h = Math.min(h, hn - 0.3 + 0.1 * dd * dd);   // never above the road inside the barriers, a gentle rise out of the ditch
    OUN.dd = i >= 0 ? dd : 999;
    return h;
  }
  function ouGH(i, j) {   // terrain height at grid vertex (i, j), computed once (with the distance beyond the barrier, the field distance and the lake there)
    const G = OU.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { const x = G.x0 + i * OUC, z = G.z0 + j * OUC; OUN.fs = false; h = G.h[k] = ouH(x, z); G.dd[k] = OUN.dd;
      if (!OUN.fs) ouFW(x, z); G.fd[k] = OUN.fd; G.we[k] = OUN.we; G.wl[k] = OUN.wl; }
    return h;
  }
  function ouGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = OU.G, gx = clamp((x - G.x0) / OUC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / OUC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = ouGH(i, j); return a + u * (ouGH(i + 1, j) - a) + v * (ouGH(i, j + 1) - a); }
    const d = ouGH(i + 1, j + 1); return d + (1 - u) * (ouGH(i, j + 1) - d) + (1 - v) * (ouGH(i + 1, j) - d);
  }
  function ouCol(x, z, h, ny, k) {   // ground colour at grid vertex k: dark mossy forest floor, meadow grass by the road, striped fields, sand and stones on the shore, grey granite on steep faces
    const P = OU, G = P.G, m = P.n3(x, z), m2 = P.n5(x, z), dd = G.dd[k];
    let r = 0.17 + m * 0.06 + m2 * 0.03, g = 0.24 + m * 0.07 + m2 * 0.03, b = 0.1 + m * 0.03;   // moss, lingonberry and needles
    const br = sstep(0.55, 0.8, P.n4(x * 1.3 + 40, z * 1.3)) * 0.5; r = lerp(r, 0.3, br); g = lerp(g, 0.25, br); b = lerp(b, 0.13, br);   // patches of brown needles and heather
    const fd = G.fd[k];
    if (fd >= 0) { const q = sstep(0, 6, fd), st = 0.5 + 0.5 * Math.sin((x * 0.6 + z * 0.8) * 0.9), gold = P.n1(x * 0.3 + 90, z * 0.3) > 0.5;   // crop rows (a field is ripe hay or young green)
      const fr = gold ? 0.64 + st * 0.08 : 0.34 + st * 0.06, fg = gold ? 0.56 + st * 0.07 : 0.5 + st * 0.07, fb = gold ? 0.3 : 0.18;
      r = lerp(r, fr, q); g = lerp(g, fg, q); b = lerp(b, fb, q); }
    if (dd < 5) { const t = sstep(5, 1, dd) * 0.6; r = lerp(r, 0.27 + m * 0.05, t); g = lerp(g, 0.36 + m * 0.05, t); b = lerp(b, 0.14, t); }   // mown verge grass
    const L = G.wl[k] >= 0 ? P.lakes[G.wl[k]] : null;
    if (L) { const u = h - L.h; if (u < 1.2) { const t = sstep(1.2, 0.2, u); r = lerp(r, 0.55 + m * 0.06, t); g = lerp(g, 0.5 + m * 0.05, t); b = lerp(b, 0.4 + m * 0.04, t); }   // sand and stones at the water line
      if (u < -0.6) { const t = sstep(-0.6, -3, u); r = lerp(r, 0.2, t); g = lerp(g, 0.22, t); b = lerp(b, 0.18, t); } }
    const st = sstep(0.82, 0.62, ny) * 0.9;
    r = lerp(r, 0.5 + m * 0.06, st); g = lerp(g, 0.49 + m * 0.05, st); b = lerp(b, 0.47 + m * 0.04, st);
    OUCOL[0] = r; OUCOL[1] = g; OUCOL[2] = b; return OUCOL;
  }
  function ouGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in ouTileGeo)
    const G = OU.G, gx = clamp((x - G.x0) / OUC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / OUC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = ouGH(ii, jj);
      const nx = (ouGH(ii + 1, jj) - ouGH(ii - 1, jj)) / (2 * OUC), nz = (ouGH(ii, jj + 1) - ouGH(ii, jj - 1)) / (2 * OUC), c = ouCol(G.x0 + ii * OUC, G.z0 + jj * OUC, h, 1 / Math.hypot(nx, 1, nz), jj * G.nx + ii);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function ouTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells, deep in the haze)
    const G = OU.G, x = G.x0 + (ti + 0.5) * OUT * OUC, z = G.z0 + (tj + 0.5) * OUT * OUC, d = ouTG(OU.td, x, z);
    return d < 300 ? 1 : d < 430 ? 2 : 0;
  }
  function ouTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex): indexed, normals from the shared grid (no seams between tiles)
    const G = OU.G, m = OUT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), i0 = ti * OUT, j0 = tj * OUT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * OUC, z = G.z0 + j * OUC, h = ouGH(i, j);
      let nx = -(ouGH(i + st, j) - ouGH(i - st, j)) / (2 * OUC * st), nz = -(ouGH(i, j + st) - ouGH(i, j - st)) / (2 * OUC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = ouCol(x, z, h, ny, clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 9; uv[k * 2 + 1] = -z / 9;
    }
    if (st === 1) {   // an edge shared with a coarse tile runs straight between every other vertex there: the fine tile's in-between vertices go onto that line (no cracks)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? ouTileOn(a, b) : 0);
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
  let ouGTexC = null, ouGMean = 0.88, ouATex = null, ouAKey = '';   // the ground texture and the board atlas are made once and reused by every Ouninpohja build (the teardown frees materials, not maps)
  function ouGTex() {   // neutral mottled grass and moss for the ground (the vertex colours give the hue): soft blotches, short blades, a few light and dark specks; tileable
    if (ouGTexC) return ouGTexC;
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(517), n = valueNoise2(518, 3), n2 = valueNoise2(519, 1);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const k = 0.8 + n(i, j) * 0.16 + n2(i, j) * 0.1 + (r() - 0.5) * 0.08, o = (j * S + i) * 4; d[o] = d[o + 1] = d[o + 2] = clamp(k * 255, 0, 255); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 700; k++) { const px = r() * S, py = r() * S, l = 1.5 + r() * 2.5, lean = (r() - 0.5) * 1.6; x.strokeStyle = r() < 0.55 ? 'rgba(40,40,40,0.28)' : 'rgba(255,255,255,0.26)'; x.lineWidth = 1;   // short blades (wrap copies keep the tile seamless)
      for (const ox of [0, S, -S]) for (const oy of [0, S, -S]) { x.beginPath(); x.moveTo(px + ox, py + oy); x.lineTo(px + ox + lean, py + oy - l); x.stroke(); } }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    let sum = 0; for (let o = 0; o < d.length; o += 4) sum += d[o]; ouGMean = sum / (S * S) / 255;
    return (ouGTexC = t);
  }
  function ouTreeGeo(kind, far) {   // unit trees (height 1, instances scale them): 0 Norway spruce, 1 Scots pine, 2 silver birch, 3 young spruce; far: the plain
    // versions for the forest deep behind the road (never seen up close)
    const g = new GB(), R = rng(620 + kind), rs = API.ROCK_SMOOTH;
    API.ROCK_SMOOTH = kind === 1 || kind === 2;   // soft, rounded crowns on the pines and birches (the spruces stay jagged)
    if (far) {
      if (kind === 0) { const col = [0.09, 0.185, 0.115], tip = [0.17, 0.3, 0.19]; starCone(g, 0, 0.02, 0, 0.3, 0.42, 4, col, tip, 0.2, 0.05); starCone(g, 0, 0.36, 0, 0.19, 0.38, 4, col, tip, 0.9, 0.04); cone(g, 0, 0.66, 0, 0.08, 0.34, 4, col, tip, 1.2); }
      else if (kind === 1) { cyl(g, 0, -0.02, 0, 0.017, 0.78, 3, [0.58, 0.37, 0.22], null, 0.009); ico(g, 0, 0.8, 0, 0.19, 0.55, [0.13, 0.25, 0.12], R, 0.35); }
      else { cyl(g, 0, -0.02, 0, 0.016, 0.62, 3, [0.88, 0.88, 0.84], null, 0.01); ico(g, 0, 0.67, 0, 0.16, 1.8, [0.27, 0.42, 0.13], R, 0.3); }
      API.ROCK_SMOOTH = rs; const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
    }
    if (kind === 0) {   // spruce: four drooping tiers down to the ground and a spire, very dark inside, the tips of the branches lighter and a little bluer
      const col = [0.085, 0.175, 0.11], tip = [0.17, 0.3, 0.19];
      [[0.02, 0.31, 0.32, 0.06], [0.23, 0.25, 0.31, 0.05], [0.44, 0.19, 0.28, 0.045], [0.61, 0.13, 0.24, 0.035]].forEach(([y, r, h, dr], k) => {
        const kk = k % 2 ? 1.1 : 1; starCone(g, 0, y, 0, r, h, 5, [col[0] * kk, col[1] * kk, col[2] * kk], tip, k * 0.66, dr); });
      cone(g, 0, 0.78, 0, 0.055, 0.22, 4, col, tip, 0.4);
    } else if (kind === 1) {   // pine: a long bare trunk, grey-brown below and orange up high, an uneven umbrella crown of two flat clumps
      cyl(g, 0, -0.02, 0, 0.018, 0.4, 3, [0.36, 0.3, 0.25], null, 0.015); cyl(g, 0, 0.38, 0, 0.015, 0.4, 3, [0.66, 0.4, 0.22], null, 0.009);
      ico(g, 0.02, 0.82, 0, 0.18, 0.5, [0.14, 0.26, 0.12], R, 0.35); ico(g, -0.1, 0.7, 0.06, 0.12, 0.55, [0.12, 0.23, 0.11], R, 0.4);
    } else if (kind === 2) {   // birch: a slim white trunk, dark rough bark at the foot and a black band, a light, airy crown of two clumps
      cyl(g, 0, -0.02, 0, 0.019, 0.16, 3, [0.3, 0.28, 0.26], null, 0.016); cyl(g, 0, 0.14, 0, 0.016, 0.24, 3, [0.9, 0.9, 0.86], null, 0.014);
      cyl(g, 0, 0.38, 0, 0.014, 0.04, 3, [0.16, 0.16, 0.16], null, 0.013); cyl(g, 0, 0.42, 0, 0.013, 0.24, 3, [0.88, 0.88, 0.84], null, 0.008);
      ico(g, 0, 0.7, 0, 0.15, 1.5, [0.27, 0.42, 0.13], R, 0.3); ico(g, 0.07, 0.56, -0.05, 0.1, 1.2, [0.31, 0.46, 0.15], R, 0.35);
    } else {   // young spruce
      const col = [0.12, 0.25, 0.13], tip = [0.2, 0.35, 0.17];
      starCone(g, 0, 0.0, 0, 0.34, 0.42, 4, col, tip, 0.4, 0.04); starCone(g, 0, 0.3, 0, 0.25, 0.38, 4, col, tip, 1.2, 0.03); cone(g, 0, 0.58, 0, 0.14, 0.42, 4, col, tip, 1.0);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function ouRod(g, a, b, r, col, n) {   // a round pole between the points a and b (n sides, no end caps): fence poles, scaffold tubes, braces, wires
    n = n || 4; const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1, ux = dx / L, uy = dy / L, uz = dz / L;
    let px = -uz, pz = ux, pl = Math.hypot(px, pz); if (pl < 0.1) { px = 1; pz = 0; pl = 1; } px /= pl; pz /= pl;   // (a level side vector across the rod; any one for an upright)
    const qx = uy * pz, qy = uz * px - ux * pz, qz = -uy * px;   // (u x p)
    const ring = (c) => { const o = []; for (let k = 0; k < n; k++) { const t = (k + 0.5) / n * TAU, cs = Math.cos(t) * r, sn = Math.sin(t) * r; o.push([c[0] + px * cs + qx * sn, c[1] + qy * sn, c[2] + pz * cs + qz * sn]); } return o; };
    const A = ring(a), B = ring(b), inn = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (let k = 0; k < n; k++) { const j = (k + 1) % n; g.quadO(A[k], B[k], B[j], A[j], col, inn); }
  }
  let ouRTexC = null;
  function ouRoadTex() {   // Ouninpohja's gravel (7 m a tile): grey-beige crushed granite, a fine grit, dusty and damp blotches, stones of three sizes (grey,
    // pink and rusty granite, a few dark ones) with their shadows; a matching bump map so the stones catch the sun. Tileable (periodic noise, wrapped stones)
    if (ouRTexC) return ouRTexC;
    const S = 256, can = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c; }, cm = can(), cb = can(), x = cm.getContext('2d'), xb = cb.getContext('2d');
    const r = rng(531), pn = (P, seed) => { const q = rng(seed), gr = new Float32Array(P * P); for (let k = 0; k < gr.length; k++) gr[k] = q();   // value noise with P cells across the tile
      return (i, j) => { const u = i * P / S, v = j * P / S, a = Math.floor(u), b = Math.floor(v), fu = u - a, fv = v - b, I = (m, n) => gr[(n % P) * P + (m % P)], su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
        return lerp(lerp(I(a, b), I(a + 1, b), su), lerp(I(a, b + 1), I(a + 1, b + 1), su), sv); }; };
    const n1 = pn(6, 532), n2 = pn(24, 533), n3 = pn(96, 534), nh = pn(10, 535);
    const img = x.createImageData(S, S), ib = xb.createImageData(S, S), d = img.data, db = ib.data;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const k = 0.8 + n1(i, j) * 0.16 + n2(i, j) * 0.1 + n3(i, j) * 0.08 + (r() - 0.5) * 0.12, w = nh(i, j), o = (j * S + i) * 4;   // (w: warm and sandy / cool and grey)
      d[o] = clamp((150 + w * 18) * k, 0, 255); d[o + 1] = clamp((139 + w * 8) * k, 0, 255); d[o + 2] = clamp((124 - w * 8) * k, 0, 255); d[o + 3] = 255;
      db[o] = db[o + 1] = db[o + 2] = clamp(118 + n3(i, j) * 30 + (r() - 0.5) * 40, 0, 255); db[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); xb.putImageData(ib, 0, 0);
    const stones = (n, r0, r1, sh) => { for (let k = 0; k < n; k++) {
      const px = r() * S, py = r() * S, rr = r0 + r() * r() * (r1 - r0), a = r() * Math.PI, t = r();
      const c = t < 0.45 ? [165 + r() * 35, 160 + r() * 30, 152 + r() * 28] : t < 0.7 ? [178 + r() * 25, 146 + r() * 18, 132 + r() * 16] : t < 0.88 ? [98 + r() * 22, 96 + r() * 20, 92 + r() * 18] : [156 + r() * 20, 112 + r() * 14, 80 + r() * 12];
      const f = 'rgb(' + c.map(v => v | 0).join(',') + ')';
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const cx = px + ox, cy = py + oy; if (cx < -10 || cx > S + 10 || cy < -10 || cy > S + 10) continue;   // (wrap copies: no seam)
        x.fillStyle = 'rgba(40,32,24,' + sh + ')'; x.beginPath(); x.ellipse(cx + rr * 0.35, cy + rr * 0.4, rr, rr * 0.75, a, 0, TAU); x.fill();
        x.fillStyle = f; x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.75, a, 0, TAU); x.fill();
        x.fillStyle = 'rgba(255,252,240,0.3)'; x.beginPath(); x.ellipse(cx - rr * 0.25, cy - rr * 0.25, rr * 0.45, rr * 0.3, a, 0, TAU); x.fill();
        xb.fillStyle = 'rgba(245,245,245,0.9)'; xb.beginPath(); xb.ellipse(cx, cy, rr, rr * 0.75, a, 0, TAU); xb.fill(); } } };
    stones(1500, 0.5, 1.5, 0.3); stones(320, 1.4, 3.2, 0.36); stones(40, 3, 5.5, 0.4);
    const mk = (c) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
    return (ouRTexC = { map: mk(cm), bump: mk(cb) });
  }
  let ouA2Tex = null;
  function ouAtlas2() {   // the signs, two columns of 8 rows (512 x 128 each). Left (u 0-0.5): 0 YLEISÖALUE (spectator area), 1 KIELLETTY ALUE (no
    // spectators), 2-5 blue direction signs with an arrow (Jämsä, Petäjävesi, Korpilahti, Himos), 6 parking, 7 MEDIA. Right (u 0.5-1): 0 KAUPPA (the
    // village shop), 1 SEURANTALO (the village hall), 2 KOULU (the school), 3 the bus stop sign (a 128 px square) and 4 the moose warning (a
    // triangle on a clear ground: the material cuts it out with alphaTest)
    if (ouA2Tex) return ouA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w, wt) => { x.fillStyle = col; x.font = (wt || 900) + ' ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    const board = (k, bg, rim, x0) => { const y = k * 128; x0 = x0 || 0; x.fillStyle = rim || '#f4f4f2'; x.fillRect(x0, y, 512, 128); x.fillStyle = bg; x.fillRect(x0 + 9, y + 9, 494, 110); return y; };
    let y = board(0, '#1d7a3c'); txt('YLEISÖALUE', 256, y + 54, 68, '#fff'); txt('SPECTATOR AREA', 256, y + 100, 26, '#fff', 400, 700);
    y = board(1, '#c8211b'); txt('KIELLETTY ALUE', 256, y + 54, 60, '#fff'); txt('NO SPECTATORS', 256, y + 100, 26, '#fff', 400, 700);
    [['Jämsä', '18', 1], ['Petäjävesi', '26', -1], ['Korpilahti', '21', 1], ['Himos', '9', -1]].forEach(([n, km, dir], k) => {
      const yy = board(2 + k, '#1f56a8'), ax = dir > 0 ? 440 : 72, m = yy + 64; x.fillStyle = '#fff'; x.beginPath();   // the arrow on the side it points to
      x.moveTo(ax + dir * 44, m); x.lineTo(ax + dir * 4, m - 36); x.lineTo(ax + dir * 4, m - 16); x.lineTo(ax - dir * 40, m - 16); x.lineTo(ax - dir * 40, m + 16); x.lineTo(ax + dir * 4, m + 16); x.lineTo(ax + dir * 4, m + 36); x.closePath(); x.fill();
      txt(n + '  ' + km, dir > 0 ? 214 : 298, m + 2, 58, '#fff', 330, 700); });
    y = board(6, '#1f56a8'); x.fillStyle = '#fff'; x.fillRect(22, y + 18, 92, 92); txt('P', 68, y + 66, 84, '#1f56a8'); txt('PYSÄKÖINTI', 310, y + 66, 54, '#fff', 350, 700);
    y = board(7, '#f2c230', '#16181c'); txt('MEDIA', 256, y + 66, 76, '#16181c');
    // the right column: the village's own boards
    y = board(0, '#f7f4ec', '#b8231c', 512); txt('KAUPPA', 768, y + 66, 84, '#b8231c', 460);
    y = board(1, '#f2ead2', '#2f5d3a', 512); txt('SEURANTALO', 768, y + 66, 66, '#2f5d3a', 460);
    y = board(2, '#f7f7f4', '#1f3f7a', 512); txt('KOULU', 768, y + 66, 84, '#1f3f7a', 460);
    { const y0 = 3 * 128; x.fillStyle = '#f4f4f2'; x.fillRect(512, y0, 128, 128); x.fillStyle = '#1f56a8'; x.fillRect(518, y0 + 6, 116, 116);   // bus stop: a white bus on blue
      x.fillStyle = '#fff'; x.fillRect(536, y0 + 34, 80, 44); x.fillRect(540, y0 + 78, 72, 8); x.fillStyle = '#1f56a8'; x.fillRect(544, y0 + 40, 20, 16); x.fillRect(568, y0 + 40, 20, 16); x.fillRect(592, y0 + 40, 18, 16);
      x.fillStyle = '#fff'; x.beginPath(); x.arc(552, y0 + 92, 9, 0, TAU); x.arc(600, y0 + 92, 9, 0, TAU); x.fill(); }
    { const y0 = 4 * 128, tri = (inset, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(576, y0 + 6 + inset * 1.15); x.lineTo(634 - inset, y0 + 118 - inset * 0.55); x.lineTo(518 + inset, y0 + 118 - inset * 0.55); x.closePath(); x.fill(); };
      tri(0, '#c8211b'); tri(11, '#f4c21c');   // a red rim, yellow inside, and the black moose walking left (body, neck, head, legs, antlers)
      x.fillStyle = '#111'; x.beginPath(); x.ellipse(580, y0 + 86, 21, 10, 0, 0, TAU); x.fill();
      x.beginPath(); x.moveTo(563, y0 + 82); x.lineTo(553, y0 + 70); x.lineTo(545, y0 + 72); x.lineTo(541, y0 + 79); x.lineTo(550, y0 + 80); x.lineTo(558, y0 + 90); x.closePath(); x.fill();
      for (const lx of [564, 570, 590, 597]) x.fillRect(lx, y0 + 92, 3.5, 17);
      x.fillRect(549, y0 + 62, 3, 9); x.fillRect(543, y0 + 62, 13, 3); x.fillRect(542, y0 + 58, 3, 6); x.fillRect(553, y0 + 58, 3, 6); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (ouA2Tex = t);
  }
  // the low plants' material: vertex coloured, both faces lit as the front one (the blades carry an 'up' normal: lit like the ground they grow on), no shadows cast
  function ouVegMat() {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('( gl_FrontFacing ) ? vIndirectFront : vIndirectBack', 'vIndirectFront').replace('( gl_FrontFacing ) ? vLightFront : vLightBack', 'vLightFront'); };
    m.customProgramCacheKey = () => 'ouVeg';
    return m;
  }
  function ouAtlas(cps) {   // text boards (8 rows of 1024 x 128): START, LETEČI CILJ, CP1-CP4 with the distance; row 6: STOP (0-511), the yellow and the red
    // chequered-flag boards (512-767, 768-1023); row 7: the stage banner (0-639), the fans' jump marks 40, 50, 57 (128 px each from 640)
    if (ouATex && ouAKey === cps.join('|')) return ouATex;
    if (ouATex) ouATex.dispose(); ouAKey = cps.join('|');
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    const flag = (x0, y0, h) => { const w = h * 18 / 11; x.fillStyle = '#fff'; x.fillRect(x0, y0, w, h); x.fillStyle = '#12357f'; x.fillRect(x0 + w * 5 / 18, y0, w * 3 / 18, h); x.fillRect(x0, y0 + h * 4 / 11, w, h * 3 / 11); };   // Finnish flag
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 104, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(232, 142, 560, 100); txt('LETEČI CILJ', 512, 196, 84, '#111', 530);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#12357f'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 280, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#c8211b'; x.fillRect(0, 768, 512, 128); x.fillStyle = '#fff'; x.fillRect(0, 776, 512, 6); x.fillRect(0, 882, 512, 6); txt('STOP', 256, 836, 104, '#fff', 440);
    for (const [x0, bg] of [[512, '#f2c230'], [768, '#c8211b']]) { x.fillStyle = bg; x.fillRect(x0, 768, 256, 128); x.fillStyle = '#fff'; x.fillRect(x0 + 60, 784, 8, 100); chq(x0 + 68, 786, 128, 64, 16); }   // a chequered flag on a pole
    x.fillStyle = '#f4f4f2'; x.fillRect(0, 896, 640, 128); flag(18, 924, 72); flag(504, 924, 72); txt('HP OUNINPOHJA', 320, 962, 64, '#12357f', 360);
    ['40', '50', '57'].forEach((n, k) => { const x0 = 640 + k * 128; x.fillStyle = '#f7f5ee'; x.fillRect(x0, 896, 128, 128); x.strokeStyle = '#222'; x.lineWidth = 6; x.strokeRect(x0 + 6, 902, 116, 116); txt(n, x0 + 64, 962, 78, '#16181c', 110); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (ouATex = t);
  }
  function ouLog(g, x, y, z, rot, r, len, col, colEnd) {   // a round thing lying on its side along rot (8 sides, two end caps): silage bales, logs, culverts; y = its lowest point
    const c = Math.cos(rot), s = Math.sin(rot), n = 8, cy = y + r, inn = [x, cy, z], ring = (u) => { const out = []; for (let k = 0; k < n; k++) { const a = (k + 0.5) / n * TAU, v = Math.cos(a) * r; out.push([x + c * u - s * v, cy + Math.sin(a) * r, z + s * u + c * v]); } return out; };
    const A = ring(-len / 2), B = ring(len / 2), ce = colEnd || col;
    for (let k = 0; k < n; k++) { const j = (k + 1) % n, sh = 0.84 + 0.2 * Math.sin((k + 1) / n * TAU); g.quadO(A[k], B[k], B[j], A[j], [col[0] * sh, col[1] * sh, col[2] * sh], inn); }
    for (let k = 1; k < n - 1; k++) { g.triO(A[0], A[k], A[k + 1], ce, [x + c, cy, z + s]); g.triO(B[0], B[k], B[k + 1], ce, [x - c, cy, z - s]); }
  }
  // a Finnish wooden building: plinth, walls (sunk into the ground), white corner boards and eaves, windows with white frames, a door, a gable roof, a chimney.
  // o: { wall, trim, roof, glass, door, win (windows per long side, -1: none), chim }
  function ouHouse(g, x, y, z, rot, L, D, H, o) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (u, v) => [x + c * u - s * v, z + s * u + c * v], trim = o.trim || [0.93, 0.92, 0.88];
    box(g, x, y - 0.6, z, L + 0.2, 0.9, D + 0.2, rot, [0.48, 0.47, 0.45], null, true);   // stone plinth
    box(g, x, y + 0.3, z, L, H - 0.3, D, rot, o.wall, null, true);
    for (const u of [-L / 2, L / 2]) for (const v of [-D / 2, D / 2]) { const [px, pz] = P(u, v); box(g, px, y + 0.3, pz, 0.24, H - 0.3, 0.24, rot, trim, null, true); }
    box(g, x, y + H - 0.22, z, L + 0.08, 0.22, D + 0.08, rot, trim, null, true);
    const nw = o.win == null ? Math.max(1, Math.floor(L / 2.8)) : o.win;
    for (const v of [-D / 2 - 0.05, D / 2 + 0.05]) for (let k = 0; k < nw; k++) { const u = (k + 0.5 - nw / 2) * (L / nw), [px, pz] = P(u, v);
      if (v > 0 && o.door && k === Math.floor(nw / 2)) { box(g, px, y + 0.3, pz, 1.0, 2.0, 0.12, rot, trim, null, true); box(g, px, y + 0.35, pz, 0.8, 1.85, 0.16, rot, o.door, null, true); continue; }
      box(g, px, y + 1.05, pz, 0.95, 1.2, 0.1, rot, trim, null, true); box(g, px, y + 1.15, pz, 0.72, 1.0, 0.14, rot, o.glass || [0.16, 0.2, 0.26], null, true); }
    if (o.door && nw === 0) { const [px, pz] = P(0, D / 2 + 0.05); box(g, px, y + 0.3, pz, 1.1, 1.9, 0.12, rot, trim, null, true); box(g, px, y + 0.35, pz, 0.9, 1.75, 0.16, rot, o.door, null, true); }   // (a storehouse: just a door)
    const rh = o.roofH || D * 0.34;
    gable(g, x, y + H, z, L + 0.9, D + 1.0, rh, rot, o.roof, o.wall);
    if (o.chim) { const [px, pz] = P(L * 0.22, 0); box(g, px, y + H + rh * 0.5, pz, 0.6, rh * 0.5 + 0.9, 0.6, rot, o.chim, null, true); }
  }
  function ouFlag(g, x, y, z, rot, h) {   // flag pole with a Finnish flag (blue cross on white), the flag on both faces
    cyl(g, x, y - 0.2, z, 0.06, h + 0.2, 5, [0.94, 0.94, 0.92], [0.9, 0.78, 0.2]);
    const c = Math.cos(rot), s = Math.sin(rot), fw = 1.8, fh = 1.1, fy = y + h - fh - 0.15, blue = [0.07, 0.21, 0.5];
    const at = (u) => [x + c * (u + 0.06), z + s * (u + 0.06)];
    let [fx, fz] = at(fw / 2); box(g, fx, fy, fz, fw, fh, 0.04, rot, [0.97, 0.97, 0.96], null, false);
    [fx, fz] = at(fw * 6.5 / 18); box(g, fx, fy, fz, fw * 3 / 18, fh, 0.06, rot, blue, null, false);
    [fx, fz] = at(fw / 2); box(g, fx, fy + fh * 4 / 11, fz, fw, fh * 3 / 11, 0.06, rot, blue, null, false);
  }
  // knockable props: marker posts on the outside of the bends, straw bale stacks on the outside of the junctions (buildOuni puts those in out.props
  // first); the props stand on the verge's own height (the verge ribbon's cross-section). Drawn out to 150 m (a long view down the straights)
  function ouniProps(out, prof, excluded) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 40, sB = T.finishS - 30, spots = [];
    for (const c of T.corners) if (c.sev >= 1) { const side = -c.dir; for (let i = c.i0; i <= c.i1; i += 14) spots.push([i, side]); }   // (posts round the outside of every bend)
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.1, 1.5], exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i, side, x, z) => { const s = i * T.ds; return s < sA || s > sB || excluded(x, z); } });
  }
  // the trees and buildings between the camera and the followed car fade out (an ordered screen-door dither), so the forest standing right
  // beside the road never hides the car: a cone along the line from the camera (1.5 m) to the car (5.5 m). World.view sets U.uCam and
  // U.uCar every frame (without a car the point is parked far away: nothing fades). The shadows stay (the depth pass is not patched)
  function ouCutMat(m, U) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.ouCam = U.uCam; sh.uniforms.ouCar = U.uCar;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOuW;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvec4 ouW = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\nouW = instanceMatrix * ouW;\n#endif\nvOuW = ( modelMatrix * ouW ).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 ouCam;\nuniform vec3 ouCar;\nvarying vec3 vOuW;')
        .replace('void main() {', 'void main() {\n' +
          '  vec3 ouD = ouCar - ouCam; float ouU = clamp( dot( vOuW - ouCam, ouD ) / max( dot( ouD, ouD ), 1.0 ), 0.0, 1.0 );\n' +
          '  float ouR = mix( 1.5, 5.5, ouU ), ouF = smoothstep( ouR, ouR * 0.55, length( vOuW - ouCam - ouD * ouU ) ) * step( ouU, 0.96 );\n' +
          '  vec2 ouQ = mod( floor( gl_FragCoord.xy ), 4.0 ), ouA = mod( ouQ, 2.0 ), ouB = floor( ouQ * 0.5 );\n' +
          '  if ( ouF * 0.9 > ( 4.0 * ( 2.0 * mod( ouA.x + ouA.y, 2.0 ) + ouA.y ) + 2.0 * mod( ouB.x + ouB.y, 2.0 ) + ouB.y + 0.5 ) / 16.0 ) discard;');
    };
    m.customProgramCacheKey = () => 'ouCut';
    return m;
  }
  // Harju's buildings: a block of flats by the road would hide the car and the road ahead from the chase view under its roof. On the screen, round the
  // line from the car to the road 20 m ahead (U.uA: the car's NDC x, y, its depth, the aspect; U.uB: the same for the point ahead), what is nearer the
  // camera than the road there and higher than the car fades (the same dither as ouCutMat); the walls' feet stay
  function hjCutMat(m, U) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.ouCar = U.uCar; sh.uniforms.hjA = U.uA; sh.uniforms.hjB = U.uB;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOuW;\nvarying vec4 vHjC;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvec4 ouW = vec4( transformed, 1.0 );\nvOuW = ( modelMatrix * ouW ).xyz;\nvHjC = gl_Position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 ouCar;\nuniform vec4 hjA;\nuniform vec4 hjB;\nvarying vec3 vOuW;\nvarying vec4 vHjC;')
        .replace('void main() {', 'void main() {\n' +
          '  vec2 hjP = vec2( vHjC.x / vHjC.w * hjA.w, vHjC.y / vHjC.w ), hjCa = vec2( hjA.x * hjA.w, hjA.y ), hjAB = vec2( hjB.x * hjA.w, hjB.y ) - hjCa;\n' +
          '  float hjT = clamp( dot( hjP - hjCa, hjAB ) / max( dot( hjAB, hjAB ), 1e-6 ), 0.0, 1.0 ), hjW = mix( hjA.z, hjB.z, hjT );\n' +
          '  float ouF = smoothstep( 0.42, 0.24, length( hjP - hjCa - hjAB * hjT ) ) * smoothstep( hjW - 1.5, hjW - 5.0, vHjC.w ) * smoothstep( 0.2, 1.4, vOuW.y - ouCar.y );\n' +
          '  vec2 ouQ = mod( floor( gl_FragCoord.xy ), 4.0 ), ouA = mod( ouQ, 2.0 ), ouB = floor( ouQ * 0.5 );\n' +
          '  if ( ouF * 0.9 > ( 4.0 * ( 2.0 * mod( ouA.x + ouA.y, 2.0 ) + ouA.y ) + 2.0 * mod( ouB.x + ouB.y, 2.0 ) + ouB.y + 0.5 ) / 16.0 ) discard;');
    };
    m.customProgramCacheKey = () => 'hjCut';
    return m;
  }
  function buildOuni(scene, tex, opts) {
    const R = rng(7411), N = T.N, w = T.w, dens = opts.density || 1, def = T.def;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: ouGround, camFloor: ouGround, props: [], ownTex: [] };
    ouPrep();
    const P = OU, iE = N - 1, sStart = T.startS, sFin = T.finishS, PI = Math.PI;
    // buildings (def.farms [kind, s, side, off, angle]): where they stand, their flat yards (pushed before the terrain is sampled)
    const KIND = { house: [11, 7.6, 3.3], house2: [10.5, 7.6, 5.8], barn: [17, 9.5, 4.8], aitta: [4.6, 3.6, 2.5], lato: [5.6, 4.4, 2.7], sauna: [4.4, 3.6, 2.4], yellow: [12, 8, 5.9], tent: [16, 9, 2.8],
      shop: [12, 8, 4.4], hall: [18, 10, 6.6], school: [22, 9, 4.8], bus: [3.2, 1.6, 2.4] };
    const farms = (def.farms || []).map(([kind, d, side, off, ang]) => {
      const s = clamp(sStart + d, 2, T.len - 2), i = T.idx(s), x = T.px[i] + T.nx[i] * side * off, z = T.pz[i] + T.nz[i] * side * off, K = KIND[kind] || KIND.house;
      const rot = Math.atan2(-side * T.tz[i], -side * T.tx[i]) + (ang || 0);   // its front (local +z) faces the road
      let y = T.hy[i] - 0.3; if (kind === 'sauna') { const W = ouWater(x, z); if (W.L) y = W.L.h + 1.1; }
      return { kind, s, i, side, off, x, z, rot, L: K[0], D: K[1], H: K[2], y };
    });
    for (const f of farms) if (f.kind !== 'lato') P.pads.push({ x: f.x, z: f.z, r: Math.max(f.L, f.D) * 0.62 + 2, b: 14, h: f.y });
    P.pads.push({ x: T.px[0] - T.tx[0] * 16, z: T.pz[0] - T.tz[0] * 16, r: 24, h: T.hy[0] - 0.3 });   // the service park behind the start
    const padE = { x: T.px[iE] + T.tx[iE] * 22, z: T.pz[iE] + T.tz[iE] * 22, r: 22, b: 26, h: T.hy[iE] - 0.3 }; P.pads.push(padE);   // past the stop control
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (ouCutMat)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // tree exclusion circles (buildings, crowds, yards), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const f of farms) exclPush(f.x, f.z, Math.max(f.L, f.D) * 0.62 + (f.kind === 'lato' ? 2 : 6));

    /* ---- terrain tiles, the lakes ---- */
    let nFar = 0;
    const gMat = new THREE.MeshLambertMaterial({ map: ouGTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = ouTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;   // (G.on: the full tiles, which get the forest)
        const m = new THREE.Mesh(ouTileGeo(ti, tj, on), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      const WO = { len: 1, amp: 0.8, refl: 0.25, land: 0.9, shal: 0.3, lap: 0.35, surf: 0 }, wMat = waterMat(tex, Object.assign({ vc: true }, WO));   // (less of the sky: the colours paint the lake's own mirror image)
      const deep = [0.19, 0.31, 0.44], sky = [0.37, 0.5, 0.63], wood = [0.09, 0.15, 0.13], shal = [0.31, 0.35, 0.29], bands = [];
      for (const L of P.lakes) {   // the water: a 5 m grid at the lake's level wherever the ground lies below it (the terrain rises out of it at the shore), coloured as a still
        // Finnish lake seen from the road: dark water, the pale sky mirrored across the middle, the forest on the far shore mirrored almost black, brown shallows
        const cs = 5, x0 = L.x0 - 10, z0 = L.z0 - 10, nx = Math.ceil((L.x1 - L.x0 + 20) / cs) + 1, nz = Math.ceil((L.z1 - L.z0 + 20) / cs) + 1, wet = new Uint8Array(nx * nz);
        for (let b = 0; b < nz; b++) for (let a = 0; a < nx; a++) wet[b * nx + a] = ouGround(x0 + a * cs, z0 + b * cs) < L.h + 0.4 ? 1 : 0;
        const colAt = (x, z) => { const e = ouWater(x, z).e, far = clamp((ouSeg(x, z).lat * L.side - L.gap) / L.depth, 0, 1), ks = 0.75 * sstep(0.06, 0.32, far) * sstep(0.9, 0.55, far);
          return [0, 1, 2].map(k => lerp(lerp(lerp(deep[k], sky[k], ks), wood[k], sstep(0.62, 0.93, far)), shal[k], sstep(10, 3, e))); };
        const cc = new Map(), wc = (a, b) => { const key = b * nx + a; let c = cc.get(key); if (c) return c; c = colAt(x0 + a * cs, z0 + b * cs); cc.set(key, c); return c; };
        const g = new GB(true), uv = (q) => [q[0] / 14, -q[2] / 14];
        for (let b = 0; b < nz - 1; b++) for (let a = 0; a < nx - 1; a++) {
          if (!(wet[b * nx + a] | wet[b * nx + a + 1] | wet[(b + 1) * nx + a] | wet[(b + 1) * nx + a + 1])) continue;
          const A = [x0 + a * cs, L.h, z0 + b * cs], B = [A[0] + cs, L.h, A[2]], C = [A[0] + cs, L.h, A[2] + cs], D = [A[0], L.h, A[2] + cs];
          g.quadUp(A, B, C, D, [wc(a, b), wc(a + 1, b), wc(a + 1, b + 1), wc(a, b + 1)], [uv(A), uv(B), uv(C), uv(D)]);
        }
        const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m);
        const i0 = Math.max(0, Math.floor((x0 - G.x0) / OUC)), j0 = Math.max(0, Math.floor((z0 - G.z0) / OUC)), i1 = Math.min(G.nx - 1, i0 + nx), j1 = Math.min(G.nz - 1, j0 + nz);   // the shore: where the terrain's own mesh meets the water
        bands.push(shoreBand(x0, z0, x0 + (nx - 1) * cs, z0 + (nz - 1) * cs, L.h + 0.015, waterline(ouGH, G.x0, G.z0, OUC, i0, i1, j0, j1, L.h), 14, { col: colAt }));
      }
      if (P.lakes.length) { out.dyn.water = tex.water; addShore(root, mergeBands(bands), wMat, WO); }
    }

    /* ---- the road: clay-bound gravel with two darker wheel tracks along the driving line and loose gravel on the crown and the shoulders,
       then the verge: mown grass, a ditch just past the barrier line, up onto the ground (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const rTex = ouRoadTex(), rMat = new THREE.MeshPhongMaterial({ map: rTex.map, bumpMap: rTex.bump, bumpScale: 0.05, shininess: 4, specular: 0x16130f, vertexColors: true }); out.asphaltMat = rMat;
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    // the verge's cross-section per sample and side: [offset, height above the road]: the grass shoulder, the ditch past the barrier line, then onto the ground
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], gAt = (o) => { const q = side * o; return ouGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; };
      const lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      return [[w, 0.01], [w + 0.9, -0.03], lift(Math.max(w + 1.5, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    {
      const tileL = 7, grav = [1.08, 1.07, 1.06], edge = [0.55, 0.68, 0.4];
      // the columns across the road at a sample: the edges, and around the driving line (T.rl) the two wheel tracks swept clean by the cars (0.7-1.2 m either
      // side of it), the loose gravel between and outside them (the line held 2.3 m inside the edges, so the columns stay in order)
      const cols = (i) => { const rl = clamp(T.rl[i], -w + 2.3, w - 2.3); return [-w, -w + 0.5, rl - 1.7, rl - 1.2, rl - 0.7, rl - 0.25, rl + 0.25, rl + 0.7, rl + 1.2, rl + 1.7, w - 0.5, w]; };
      const shade = (i, o) => { const a = Math.abs(o - T.rl[i]), trk = sstep(0.45, 0.72, a) * sstep(1.45, 1.18, a), ao = Math.abs(o);
        let k = 1.0 - 0.21 * trk + 0.06 * sstep(0.5, 0.2, a);   // the tracks darker and smoother, the loose crown between them lighter
        const outer = Math.sign(o) === -Math.sign(T.k[i]) ? sstep(1 / 400, 1 / 70, Math.abs(T.k[i])) : 0;   // on the outside of a bend the cars throw the loose gravel out
        k += (0.06 + 0.07 * outer) * sstep(w - 1.3 - 1.4 * outer, w - 0.3, ao) * (1 - trk);
        k *= 0.93 + 0.13 * P.n2(T.px[i] * 0.7 + 50, T.pz[i] * 0.7);   // long dusty and damp stretches
        const g = sstep(w - 0.45, w, ao) * 0.75;   // grass creeping in at the very edge
        return [lerp(grav[0] * k, edge[0], g), lerp(grav[1] * k, edge[1], g), lerp(grav[2] * k, edge[2], g)]; };
      const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
      const vergeC = (x, z) => { const m = P.n3(x, z), d = P.n4(x * 2, z * 2); return [0.26 + m * 0.05 + d * 0.06, 0.35 + m * 0.05 + d * 0.03, 0.14 + d * 0.02]; }, ditchC = [0.17, 0.23, 0.1];   // (dry, straw-coloured patches)
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) a.push(vp[si][i].map(([o], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
        if (k === 4) { const c = ouGCol(x, z); return [c[0] * ouGMean, c[1] * ouGMean, c[2] * ouGMean]; } if (k === 3) return ditchC; const c = vergeC(x, z); return k === 0 ? [c[0] * 1.08, c[1] * 1.04, c[2] * 0.95] : c; })); return a; });
      const wuv = (p) => [p[0] / 9, -p[2] / 9];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, oi = cols(i), oj = cols(j);
          for (let c = 0; c < oi.length - 1; c++) { const a0 = oi[c], a1 = oi[c + 1], b0 = oj[c], b1 = oj[c + 1];
            gr.quadUp(Pt(i, a0, 0.02), Pt(i, a1, 0.02), Pt(j, b1, 0.02), Pt(j, b0, 0.02), [shade(i, a0), shade(i, a1), shade(j, b1), shade(j, b0)], [[(a0 + w) / tileL, v0], [(a1 + w) / tileL, v0], [(b1 + w) / tileL, v1], [(b0 + w) / tileL, v1]]); }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, qi = vp[si][i], qj = vp[si][j], ci = vc[si][i], cj = vc[si][j];
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        addM(gr, rMat); addM(gv, gMat);
      }
      // a white line of lime across the road at the start and at the flying finish, a thinner one at each split point
      const gl = new GB(), wht = [0.96, 0.96, 0.94];
      for (const [s0, hw] of [[sStart, 0.4], [sFin, 0.4]].concat(T.cpS.map(s => [s, 0.2]))) { const a = atSf(s0 - hw, -w + 0.1), b = atSf(s0 - hw, w - 0.1), c = atSf(s0 + hw, w - 0.1), d = atSf(s0 + hw, -w + 0.1), y = (p) => T.hy[p[3]] + 0.04;
        gl.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      addM(gl, new THREE.MeshLambertMaterial({ vertexColors: true }));
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the stage's boards, ban2: the signs, ouAtlas2)
    const veg = new Chunks(110), UPN = [0, 1, 0];   // low plants, tapes, wires: no shadows (ouVegMat)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.14, 0.3, 0.72], [0.95, 0.95, 0.95], [0.2, 0.62, 0.3], [1, 0.55, 0.1], [0.12, 0.14, 0.2], [0.14, 0.3, 0.72], [0.95, 0.95, 0.95]];   // (Finnish blue and white twice)
    const CR = crowdCtx({ gH: ouGround, near: (x, z) => ouNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => ouWater(x, z).e > -4 }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb) => {   // double-sided text board (bottom centre cx, cy, cz) readable from both +t and -t; atlas cell u0..u1 x v0..v1 (0..1, v up); gb: ban2 for a sign
      const ux = tz, uz = -tx; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * 0.04 * f, oz = tz * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy, cz + oz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
        (gb || ban).quadO(A, B, C, D, W1, [cx - tx * f, cy + H / 2, cz - tz * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts beyond the verge, a beam, a text board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = w + 2.6, L2 = w + 2.6, g = scen.get(x, z), hd = T.hd[i];
      for (const o of [-L1, L2]) box(g, x + nx * o, y - 0.5, z + nz * o, 0.5, 7.0, 0.5, hd, postCol);
      box(g, x, y + 5.9, z, 0.5, 0.6, L1 + L2 + 0.5, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.2, z, T.tx[i], T.tz[i], 12.5, 1.56, v0, v1);
      const e = exclPush(x, z, w + 7); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, ouGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const flagAt = (x, z, rot, h) => { const g = scen.get(x, z); ouFlag(g, x, ouGround(x, z), z, rot, h || 7); };
    const carPk = (x, z, rot, col) => { const g = scen.get(x, z), y = ouGround(x, z), c = Math.cos(rot), s = Math.sin(rot);   // parked car
      box(g, x, y + 0.25, z, 4.3, 0.8, 1.85, rot, col, null, true); box(g, x - c * 0.35, y + 1.05, z - s * 0.35, 2.3, 0.62, 1.62, rot, [0.16, 0.2, 0.26], col, true);
      for (const [a, b] of [[1.35, 0.8], [1.35, -0.8], [-1.35, 0.8], [-1.35, -0.8]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.66, 0.66, 0.24, rot, [0.08, 0.08, 0.09], null, true); };
    const van = (x, z, rot, col) => { const g = scen.get(x, z), y = ouGround(x, z), c = Math.cos(rot), s = Math.sin(rot);   // camper van
      box(g, x, y + 0.3, z, 6.2, 2.5, 2.2, rot, [0.94, 0.94, 0.92], null, true); box(g, x + c * 2.2, y + 1.2, z + s * 2.2, 1.4, 0.8, 2.24, rot, [0.16, 0.2, 0.26], null, true);
      box(g, x, y + 1.0, z, 6.25, 0.3, 2.25, rot, col, null, true);
      for (const [a, b] of [[2.0, 0.95], [2.0, -0.95], [-1.8, 0.95], [-1.8, -0.95]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.7, 0.7, 0.26, rot, [0.08, 0.08, 0.09], null, true); };
    const tentS = (x, z, rot, col) => { const g = scen.get(x, z), y = ouGround(x, z); gable(g, x, y, z, 2.4, 2.2, 1.3, rot, col, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8]); };   // a small tent
    const smoke = [];   // [x, y, z, kind]: where smoke rises (1: a grill, 2: a sauna's chimney), built at the end
    const grill = (x, z) => { const g = scen.get(x, z), y = ouGround(x, z); for (const [a, b] of [[-0.25, 0], [0.25, 0]]) box(g, x + a, y, z + b, 0.06, 0.7, 0.06, 0, [0.2, 0.2, 0.2]); box(g, x, y + 0.7, z, 0.7, 0.2, 0.45, 0, [0.12, 0.12, 0.13], [0.3, 0.1, 0.05]); smoke.push([x, y + 1.0, z, 1]); };

    /* ---- buildings ---- */
    const red = [0.55, 0.13, 0.09], trim = [0.94, 0.93, 0.89], roofD = [0.22, 0.22, 0.23], roofR = [0.42, 0.14, 0.1], glass = [0.14, 0.18, 0.24], boards = [0.72, 0.6, 0.42];
    let nBld = 0;
    for (const f of farms) {
      const g = scen.get(f.x, f.z), { x, z, rot, L, D, H } = f; let y = f.y;
      if (f.kind === 'lato') { let lo = 1e9; for (const a of [-1, 1]) for (const b of [-1, 1]) lo = Math.min(lo, ouGround(x + Math.cos(rot) * a * L / 2 - Math.sin(rot) * b * D / 2, z + Math.sin(rot) * a * L / 2 + Math.cos(rot) * b * D / 2)); y = lo; }
      const vr = vary(red, R, 0.1);
      if (f.kind === 'house' || f.kind === 'house2') ouHouse(g, x, y, z, rot, L, D, H, { wall: vr, roof: R() < 0.5 ? roofD : roofR, door: [0.3, 0.2, 0.14], chim: [0.6, 0.25, 0.18], win: f.kind === 'house2' ? 4 : 3 });
      else if (f.kind === 'yellow') {   // the Yellow House: two storeys of yellow boards, white trim, a red roof; its big ground-floor windows boarded up for the rally
        ouHouse(g, x, y, z, rot, L, D, H, { wall: [0.95, 0.78, 0.26], roof: [0.5, 0.16, 0.11], door: [0.94, 0.93, 0.89], chim: [0.9, 0.9, 0.88], win: 4, glass: boards });
        const c = Math.cos(rot), s = Math.sin(rot);
        for (let k = 0; k < 4; k++) { const u = (k + 0.5 - 2) * (L / 4), px = x + c * u - s * (D / 2 + 0.05), pz = z + s * u + c * (D / 2 + 0.05); box(g, px, y + 3.4, pz, 0.9, 1.1, 0.1, rot, trim, null, true); box(g, px, y + 3.5, pz, 0.7, 0.9, 0.14, rot, glass, null, true); }   // upstairs windows
        const [fx, fz] = [x + c * (L / 2 + 3) - s * (D / 2 + 2), z + s * (L / 2 + 3) + c * (D / 2 + 2)]; flagAt(fx, fz, rot, 8);
      } else if (f.kind === 'barn') {   // red barn: long, white trim, big doors with white cross braces
        ouHouse(g, x, y, z, rot, L, D, H, { wall: vr, roof: roofD, win: 0, roofH: 2.6 });
        const c = Math.cos(rot), s = Math.sin(rot);
        for (const u of [-L / 4, L / 4]) { const px = x + c * u - s * (D / 2 + 0.06), pz = z + s * u + c * (D / 2 + 0.06); box(g, px, y + 0.2, pz, 3.2, 3.2, 0.12, rot, [0.4, 0.1, 0.07], null, true); box(g, px, y + 1.6, pz, 3.3, 0.18, 0.18, rot, trim, null, true); box(g, px, y + 0.2, pz, 0.18, 3.2, 0.18, rot, trim, null, true); }
      } else if (f.kind === 'aitta') ouHouse(g, x, y, z, rot, L, D, H, { wall: vr, roof: roofD, win: 0, door: [0.36, 0.1, 0.07], roofH: 1.2 });
      else if (f.kind === 'lato') {   // grey hay barn out on the field: weathered boards, walls leaning out, a low roof
        const gw = vary([0.5, 0.47, 0.42], R, 0.12); box(g, x, y - 0.2, z, L, H + 0.2, D, rot, gw, null, true); box(g, x, y + H - 0.6, z, L + 0.4, 0.6, D + 0.4, rot, [gw[0] * 0.92, gw[1] * 0.92, gw[2] * 0.92], null, true);
        gable(g, x, y + H, z, L + 1.0, D + 1.2, 1.3, rot, [0.33, 0.32, 0.3], gw);
      } else if (f.kind === 'sauna') {   // lakeside sauna: dark logs, a chimney pipe, a jetty out over the water
        ouHouse(g, x, y, z, rot, L, D, H, { wall: [0.34, 0.24, 0.16], trim: [0.3, 0.2, 0.13], roof: roofD, win: 1, roofH: 1.1 });
        const c = Math.cos(rot), s = Math.sin(rot), jx = x + s * (D / 2 + 1), jz = z - c * (D / 2 + 1), W = ouWater(x, z), wy = W.L ? W.L.h : y - 1;
        box(g, x + c * 1.2, y + H, z + s * 1.2, 0.3, 1.6, 0.3, rot, [0.12, 0.12, 0.12]); smoke.push([x + c * 1.2, y + H + 1.7, z + s * 1.2, 2]);   // (the sauna is being heated)
        for (let k = 0; k < 7; k++) { const px = jx + s * k * 2, pz = jz - c * k * 2; box(g, px, wy + 0.35, pz, 1.8, 0.12, 2.0, rot, [0.52, 0.42, 0.3], [0.62, 0.5, 0.36], true); if (k % 2) for (const b of [-0.8, 0.8]) box(g, px + c * b, wy - 1.2, pz + s * b, 0.14, 1.6, 0.14, rot, [0.3, 0.24, 0.18]); }
        const bx = jx + s * 9 + c * 2, bz = jz - c * 9 + s * 2; ouLog(g, bx, wy - 0.25, bz, rot + PI / 2 + 0.2, 0.45, 3.6, [0.24, 0.42, 0.26], [0.2, 0.34, 0.22]);   // a rowing boat
      } else if (f.kind === 'tent') {   // Kakaristo's big white marquee (the pop-up restaurant), open towards the road, benches inside
        const c = Math.cos(rot), s = Math.sin(rot); for (let a = -L / 2; a <= L / 2 + 0.01; a += L / 4) for (const b of [-D / 2, D / 2]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.14, H, 0.14, rot, [0.9, 0.9, 0.9]);
        gable(g, x, y + H, z, L + 0.3, D + 0.3, 2.2, rot, [0.96, 0.96, 0.95], [0.96, 0.96, 0.95]); box(g, x - s * (-D / 2 + 0.05), y + 0.1, z + c * (-D / 2 + 0.05), L, H - 0.1, 0.06, rot, [0.93, 0.93, 0.92], null, true);
        for (let a = -L / 2 + 2; a < L / 2 - 1; a += 3) for (const b of [-1.4, 1.4]) box(g, x + c * a - s * b, y, z + s * a + c * b, 2.2, 0.75, 0.8, rot, [0.5, 0.36, 0.22], [0.62, 0.46, 0.3], true);
        for (let k = 0; k < 18; k++) { const u = (R() - 0.5) * (L - 2), v = (R() - 0.5) * (D - 3); person(x + c * u - s * v, z + s * u + c * v, R() * TAU); }
        flagAt(x + c * (L / 2 + 1.5) + s * 2, z + s * (L / 2 + 1.5) - c * 2, rot, 8); flagAt(x - c * (L / 2 + 1.5) + s * 2, z - s * (L / 2 + 1.5) - c * 2, rot, 8);
      }
      else if (f.kind === 'shop' || f.kind === 'hall' || f.kind === 'school') {   // the village: the shop (pale yellow, big windows, a porch roof), the hall (two storeys of
        // ochre boards), the school (red, a long row of windows); each its board over the front (ouAtlas2's right column)
        const c = Math.cos(rot), s = Math.sin(rot), at = (u, v) => [x + c * u - s * v, z + s * u + c * v];
        if (f.kind === 'shop') ouHouse(g, x, y, z, rot, L, D, H, { wall: [0.95, 0.87, 0.6], roof: [0.42, 0.14, 0.1], door: [0.36, 0.22, 0.14], chim: [0.6, 0.25, 0.18], win: 3, glass: [0.22, 0.3, 0.36] });
        else if (f.kind === 'hall') ouHouse(g, x, y, z, rot, L, D, H, { wall: [0.85, 0.64, 0.3], roof: [0.3, 0.3, 0.32], door: [0.94, 0.93, 0.89], chim: [0.6, 0.25, 0.18], win: 6, roofH: 3.6 });
        else ouHouse(g, x, y, z, rot, L, D, H, { wall: vr, roof: roofD, door: [0.94, 0.93, 0.89], chim: [0.6, 0.25, 0.18], win: 7 });
        if (f.kind === 'hall') for (let k = 0; k < 6; k++) { const u = (k + 0.5 - 3) * (L / 6), [px, pz] = at(u, D / 2 + 0.05); box(g, px, y + 3.9, pz, 0.95, 1.2, 0.1, rot, trim, null, true); box(g, px, y + 4.0, pz, 0.72, 1.0, 0.14, rot, glass, null, true); }   // upstairs windows
        if (f.kind === 'shop') { const [px, pz] = at(0, D / 2 + 1.4); box(g, px, y + 2.6, pz, 5.4, 0.14, 2.8, rot, [0.32, 0.12, 0.09]); for (const u of [-2.5, 2.5]) { const [qx, qz] = at(u, D / 2 + 2.6); box(g, qx, y - 0.1, qz, 0.14, 2.7, 0.14, rot, trim); }   // the porch roof on posts
          const [bx, bz] = at(4, D / 2 + 1.6); box(g, bx, y, bz, 1.8, 0.45, 0.5, rot, [0.45, 0.3, 0.18], [0.55, 0.38, 0.22], true); }   // a bench
        const [sx, sz] = at(0, D / 2 + (f.kind === 'shop' ? 2.9 : 0.14)), rowK = f.kind === 'shop' ? 0 : f.kind === 'hall' ? 1 : 2;
        bannerQ(sx, y + (f.kind === 'shop' ? 2.75 : H - 1.0), sz, -s, c, f.kind === 'hall' ? 4.2 : 3.2, f.kind === 'hall' ? 0.8 : 0.72, 1 - (rowK + 1) / 8, 1 - rowK / 8, 0.5, 1, ban2);
        if (f.kind !== 'shop') { const [fx, fz] = at(L / 2 + 2, D / 2 + 3); flagAt(fx, fz, rot, 9); }
      } else if (f.kind === 'bus') {   // a bus stop shelter open to the road: back and side walls, a roof, a bench; the blue stop sign on a pole beside it
        const c = Math.cos(rot), s = Math.sin(rot), at = (u, v) => [x + c * u - s * v, z + s * u + c * v], wd = [0.55, 0.42, 0.28];
        { const [px, pz] = at(0, -D / 2); box(g, px, y - 0.1, pz, L, H, 0.12, rot, wd, null, true); }
        for (const u of [-L / 2, L / 2]) { const [px, pz] = at(u, 0); box(g, px, y - 0.1, pz, 0.12, H, D, rot, wd, null, true); }
        box(g, x, y + H - 0.1, z, L + 0.4, 0.14, D + 0.5, rot, [0.26, 0.26, 0.27]); { const [px, pz] = at(0, -D / 2 + 0.35); box(g, px, y, pz, L - 0.5, 0.45, 0.4, rot, [0.5, 0.36, 0.22], null, true); }
        const [px, pz] = at(L / 2 + 1.1, D / 2); box(g, px, y - 0.2, pz, 0.08, 2.8, 0.08, rot, [0.6, 0.61, 0.63]); bannerQ(px, y + 2.0, pz, -s, c, 0.6, 0.6, 0.5, 0.625, 0.5, 0.625, ban2);
      }
      if (f.kind === 'house' || f.kind === 'house2') {   // firewood stacked against the gable end under a lean-to roof (the cut ends out)
        const c = Math.cos(rot), s = Math.sin(rot), wx = x + c * (L / 2 + 0.85), wz = z + s * (L / 2 + 0.85);
        box(g, wx, y - 0.1, wz, 1.3, 1.55, D * 0.62, rot, [0.64, 0.49, 0.31], [0.46, 0.37, 0.26], true); box(g, wx + c * 0.2, y + 1.62, wz + s * 0.2, 1.9, 0.12, D * 0.62 + 0.7, rot, [0.24, 0.24, 0.25], null, true);
      }
      if (f.kind === 'house' || f.kind === 'house2' || f.kind === 'yellow') {   // a mailbox stand by the road where the drive leaves it
        const [mx, mz, mi] = onSide(f.s + 6, f.side, 0.9), my = ouGround(mx, mz), mg = scen.get(mx, mz), hd = T.hd[mi];
        box(mg, mx, my - 0.2, mz, 0.1, 1.25, 0.1, hd, [0.4, 0.3, 0.2]); box(mg, mx, my + 1.0, mz, 1.1, 0.08, 0.3, hd, [0.45, 0.34, 0.22]);
        for (const u of [-0.3, 0.3]) box(mg, mx + Math.cos(hd) * u, my + 1.08, mz + Math.sin(hd) * u, 0.42, 0.34, 0.28, hd, [0.36, 0.44, 0.38], [0.42, 0.5, 0.44]);
      }
      nBld++;
    }

    /* ---- START (Hämepohja): gantry with the start lights, the timing hut, Finnish flags, the service park behind the start ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.1, 0.2, 0.46]), nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z);
      box(g, x, y + 6.5, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);   // light panel on top of the beam
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.05, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 2.4), hy = ouGround(hx, hz), gh = scen.get(hx, hz);   // timing hut
      box(gh, hx, hy, hz, 3.6, 2.6, 2.6, T.hd[i], [0.93, 0.92, 0.88], [0.3, 0.3, 0.32], true); box(gh, hx, hy + 1.2, hz, 3.65, 0.8, 2.65, T.hd[i], [0.16, 0.24, 0.36], null, true);
      exclPush(hx, hz, 5);
      { const [bx, bz, bi] = onSide(sStart + 14, 1, 1.4), by = ouGround(bx, bz), gb = scen.get(bx, bz);   // the stage's banner on two posts beside the road after the line
        for (const o of [-3.1, 3.1]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 2.9, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        const ux = -T.nx[bi], uz = -T.nz[bi]; bannerQ(bx, by + 1.4, bz, ux, uz, 6.4, 1.28, 0, 1 / 8, 0, 0.625); exclPush(bx, bz, 5); }
      for (let s = sStart - 60; s < sStart + 70; s += 14) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.4); flagAt(px, pz, T.hd[ii], 6.5); }
      // the end of the road behind the service park: a row of logs across it
      const e0 = [T.px[0] - T.tx[0] * 1.2, T.pz[0] - T.tz[0] * 1.2];
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.2) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); ouLog(scen.get(bx, bz), bx, T.hy[0] - 0.2, bz, T.hd[0] + PI / 2, 0.35, 2.1, [0.46, 0.34, 0.22], [0.78, 0.66, 0.46]); }
      const hh = T.hd[0], ch = Math.cos(hh), sh = Math.sin(hh), pk = P.pads[P.pads.length - 2], at = (a, b) => [pk.x + ch * a - sh * b, pk.z + sh * a + ch * b];   // a: along the road, b: across
      for (let k = 0; k < 4; k++) { const [vx, vz] = at(-6 - (k % 2) * 7, -15 + k * 9); van(vx, vz, hh + PI / 2 + (R() - 0.5) * 0.2, fans[(k * 2) % fans.length]); }
      for (let k = 0; k < 5; k++) { const [cx, cz] = at(8 + (k % 2) * 5.5, -14 + k * 7); carPk(cx, cz, hh + PI / 2, vary(fans[(k * 3 + 1) % fans.length], R, 0.2)); }
      for (let k = 0; k < 22; k++) { const [px, pz] = at((R() - 0.5) * 30, (R() - 0.5) * 36); if (ouNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      exclPush(pk.x, pk.z, pk.r + 8);
    }

    /* ---- the split points: a blue gantry "CPn  x,x km" (the radio points of a rally stage are blue boards) ---- */
    const kmS = (s) => ((s - sStart) / 1000).toFixed(1).replace('.', ',') + ' km';
    T.cpS.forEach((s, k) => { arch(s, 2 + k, [0.86, 0.86, 0.88], [0.1, 0.2, 0.46]); });

    /* ---- FINISH: the yellow warning board, the flying finish (chequered gantry, timing hut), the red STOP board 200+ m on, marshals, the end of the road ---- */
    {
      const [x, y, z, i] = arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const [hx, hz] = onSide(sFin + 2, 1, 2.2), hy = ouGround(hx, hz), gh = scen.get(hx, hz);
      box(gh, hx, hy, hz, 3.4, 2.6, 2.6, T.hd[i], [0.93, 0.92, 0.88], [0.3, 0.3, 0.32], true); box(gh, hx, hy + 1.2, hz, 3.45, 0.8, 2.65, T.hd[i], [0.16, 0.24, 0.36], null, true); exclPush(hx, hz, 5);
      const sign = (s, side, u0, u1, v, W, H) => { const [px, pz, ii] = onSide(s, side, 0.9), py = ouGround(px, pz), gg = scen.get(px, pz);   // a board on two posts beside the road, facing the arriving cars
        for (const o of [-W * 0.35, W * 0.35]) box(gg, px + T.nx[ii] * o, py - 0.2, pz + T.nz[ii] * o, 0.1, 1.5, 0.1, T.hd[ii], [0.3, 0.3, 0.32]);
        const [v0, v1] = row(v); bannerQ(px, py + 1.3, pz, T.tx[ii], T.tz[ii], W, H, v0, v1, u0, u1); exclPush(px, pz, 3); };
      sign(sFin - 100, 1, 0.5, 0.75, 6, 1.8, 0.9);    // yellow board with a chequered flag: the finish is coming
      sign(sFin + 1, -1, 0.75, 1, 6, 1.8, 0.9);       // red board with a chequered flag: the flying finish
      const sStop = Math.min(T.len - 30, sFin + 215); sign(sStop, 1, 0, 0.5, 6, 3.2, 0.8); sign(sStop, -1, 0, 0.5, 6, 3.2, 0.8);   // STOP both sides
      for (let k = 0; k < 4; k++) { const [px, pz] = onSide(sStop + 4 + k * 3, k % 2 ? 1 : -1, 1.2 + R()); person(px, pz, T.hd[T.idx(sStop)] + PI, [1, 0.5, 0.1]); }   // marshals in orange
      const iS = T.idx(sStop), [tx, tz] = onSide(sStop - 8, -1, 2.6); box(scen.get(tx, tz), tx, ouGround(tx, tz), tz, 3, 2.3, 2.2, T.hd[iS], [0.93, 0.92, 0.88], [0.3, 0.3, 0.32], true);   // time control hut
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: logs across it, the service cars beyond
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.2) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; ouLog(scen.get(bx, bz), bx, T.hy[iE] - 0.2, bz, T.hd[iE] + PI / 2, 0.35, 2.1, [0.46, 0.34, 0.22], [0.78, 0.66, 0.46]); }
      const hh = T.hd[iE], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 6; k++) { const a = -12 + (k % 3) * 8, b = k < 3 ? -7 : 4, px = padE.x + c * b - sn * a, pz = padE.z + sn * b + c * a; if (ouNear(px, pz).dd < 1.5) continue; if (k % 3 === 1) van(px, pz, hh + PI / 2, fans[k % fans.length]); else carPk(px, pz, hh + PI / 2, vary(fans[(k * 3) % fans.length], R, 0.2)); }
      exclPush(padE.x, padE.z, padE.r + 8);
      for (const side of [-1, 1]) for (let s = sFin - 25; s < sFin + 10; s += 8) { const [px, pz, ii] = onSide(s, side, 1.5); flagAt(px, pz, T.hd[ii], 6); }
    }

    /* ---- junctions: the other road goes on straight past the corner (closed with tape and straw bales), a house on the corner ---- */
    const juncs = T.corners.filter(c => c.sev >= 3 && c.angle > 1.2);
    for (const c of juncs) {
      const i0 = c.i0, side = -c.dir, sm = ((c.i0 + c.i1) / 2) * T.ds, im = T.idx(sm);
      const bar = side > 0 ? T.br[im] : T.bl[im], ox = T.px[im] + T.nx[im] * side * (bar - 1), oz = T.pz[im] + T.nz[im] * side * (bar - 1);   // where the other road leaves the corner's outside
      const dx = T.tx[i0], dz = T.tz[i0], hw = 3.2, len = 70, gg = new GB(true), n = 14;   // (straight on, the way the stage came in)
      const col = [0.64, 0.56, 0.44];
      for (let k = 0; k < n; k++) { const a = k / n * len, b = (k + 1) / n * len, P0 = [ox + dx * a, oz + dz * a], P1 = [ox + dx * b, oz + dz * b], px = -dz, pz = dx;
        const Q = (p, o) => { const x = p[0] + px * o, z = p[1] + pz * o; return [x, Math.max(ouGround(x, z), T.hy[im] - 3) + 0.08, z]; };
        gg.quadUp(Q(P0, -hw), Q(P0, hw), Q(P1, hw), Q(P1, -hw), [col, col, col, col], [[0, a / 7], [1, a / 7], [1, b / 7], [0, b / 7]]);
        exclPush(ox + dx * (a + b) / 2, oz + dz * (a + b) / 2, hw + 3); }
      addM(gg, rMat);
      for (let o = -hw; o <= hw + 0.01; o += 1.35) { const x = ox + dx * 4 - dz * o, z = oz + dz * 4 + dx * o, y = ouGround(x, z), g = scen.get(x, z), r = Math.atan2(dz, dx) + PI / 2;   // straw bales across the closed road, a tape on posts
        box(g, x, y, z, 1.3, 0.85, 0.9, r, [0.8, 0.62, 0.3], [0.9, 0.74, 0.4]); box(g, x, y + 0.85, z, 1.3, 0.85, 0.9, r + 0.1, [0.8, 0.62, 0.3], [0.9, 0.74, 0.4]); }
      // on the corner's outside verge: knockable straw bale stacks where a car sliding wide ends up
      for (let d = -5.6; d <= 5.7; d += 2.8) { const s = sm + d, i = T.idx(s), room = (side > 0 ? T.br[i] : T.bl[i]) - w, [x, z, hd] = atSf(s, side * (w + Math.min(4.5, room - 1.2))); if (room < 3) continue; out.props.push({ kind: 'bstack', x, z, yaw: hd, col: 0, i }); }   // (a row on the apex's outside)
      for (const sd of [-1, 1]) { const x = ox + dx * 6 - dz * sd * (hw + 1.5), z = oz + dz * 6 + dx * sd * (hw + 1.5); flagAt(x, z, Math.atan2(dz, dx), 6.5); }
      { const bx = ox + dx * 7.5, bz = oz + dz * 7.5, by = ouGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(1);   // KIELLETTY ALUE on the closed road, read from the corner
        for (const o of [-1.25, 1.25]) box(gb, bx - dz * o, by - 0.2, bz + dx * o, 0.09, 2.3, 0.09, Math.atan2(dz, dx), [0.35, 0.3, 0.24]);
        bannerQ(bx, by + 1.25, bz, dx, dz, 3.2, 0.8, v0, v1, 0, 0.5, ban2); }
      for (const sd of [-1, 1]) person(ox + dx * 10 - dz * sd * 1.6, oz + dz * 10 + dx * sd * 1.6, Math.atan2(-dz, -dx) - PI / 2, [1, 0.5, 0.1]);   // marshals
      { const k = juncs.indexOf(c), sj = sm - 45, [px, pz, ii] = onSide(sj, 1, 1.4), py = ouGround(px, pz), gp = scen.get(px, pz);   // two blue direction signs on a post before the corner, facing the arriving cars
        box(gp, px, py - 0.2, pz, 0.1, 3.3, 0.1, T.hd[ii], [0.6, 0.61, 0.63]);
        for (let q = 0; q < 2; q++) { const [v0, v1] = row(2 + (k * 2 + q) % 4); bannerQ(px, py + 2.3 - q * 0.62, pz, T.tx[ii], T.tz[ii], 2.2, 0.55, v0, v1, 0, 0.5, ban2); }
        exclPush(px, pz, 2); }
      exclPush(ox, oz, 10);
    }

    /* ---- spectators: both sides of every jump (the Yellow House packed, the fans' jump-length boards), the junctions, Kakaristo, the start and the finish;
       Finnish flags on poles among them, tents and camper vans in the fields behind ---- */
    const jumpS = (def.bumps || []).map(b => clamp(b.at, 0, 1) * T.len).filter(s => s > sStart + 60 && s < sFin - 40);
    const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const M = { first: 3.0, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.12, keepBar: 1.6 };
    const TR = [0.86, 0.12, 0.1], TW = [0.95, 0.95, 0.93];
    const tape = (sa, sb, side, first) => {   // a red and white tape on thin posts between the road and a crowd: 0.5 m stripes, sagging a little between the posts
      const o0 = Math.max(1.2, first - 0.9); let prev = null, n = 0;
      for (let s = sa; s <= sb + 0.01; s += 3.4) { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + o0), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        if (ouNear(x, z).dd < o0 - 0.4 || hard(x, z) || ouWater(x, z).e > -3) { prev = null; continue; }
        const y = ouGround(x, z); box(scen.get(x, z), x, y - 0.15, z, 0.05, 1.2, 0.05, T.hd[i], [0.92, 0.92, 0.9]);
        if (prev) { const m = Math.max(1, Math.round(Math.hypot(x - prev[0], z - prev[2]) / 0.5)), g = veg.get(x, z), p0 = prev, at = (t, up) => [lerp(p0[0], x, t), lerp(p0[1], y, t) + 0.94 + up - 0.28 * t * (1 - t), lerp(p0[2], z, t)];
          for (let k = 0; k < m; k++) { const c = k % 2 ? TW : TR, a = at(k / m, 0), b = at((k + 1) / m, 0), bu = at((k + 1) / m, 0.09), au = at(k / m, 0.09);
            g.triN(a, b, bu, UPN, UPN, UPN, c, c, c); g.triN(a, bu, au, UPN, UPN, UPN, c, c, c); } }
        prev = [x, y, z]; n++; }
      return n; };
    const board2 = (s, side, off, rowK, W, H) => {   // a sign (a row of ouAtlas2) on two posts beside the road, facing it
      const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + off), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
      if (hard(x, z) || ouNear(x, z).dd < off - 0.5 || ouWater(x, z).e > -3) return false;
      const y = ouGround(x, z), g = scen.get(x, z), [v0, v1] = row(rowK);
      for (const u of [-W * 0.4, W * 0.4]) box(g, x + T.tx[i] * u, y - 0.2, z + T.tz[i] * u, 0.08, 1.1 + H, 0.08, T.hd[i], [0.35, 0.3, 0.24]);
      bannerQ(x, y + 0.85, z, T.nx[i], T.nz[i], W, H, v0, v1, 0, 0.5, ban2); exclPush(x, z, W / 2 + 0.5); CR.block(x, z, W, 0.4, T.hd[i]); return true; };   // (nobody stands in it)
    const run = (sa, sb, side, o) => { const a = Math.max(sa, sStart + 40), b = Math.min(sb, sFin - 30), first = (o && o.first) || M.first, n = crowdRun(CR, a, b, side, Object.assign({}, M, o));
      if (n >= 14 && tape(a - 3, b + 3, side, first) > 2 && n >= 40) board2(a - 5, side, Math.max(1.2, first - 0.9) + 0.3, 0, 2.6, 0.66);   // a big crowd stands behind a tape, a YLEISÖALUE sign where it begins
      return n; };
    const yh = farms.find(f => f.kind === 'yellow'), sY = yh ? jumpS.reduce((b, s) => (Math.abs(s - yh.s - 90) < Math.abs(b - yh.s - 90) ? s : b), jumpS[0]) : -1;
    jumpS.forEach((s0, k) => {
      const big = s0 === sY;
      for (const sd of [-1, 1]) run(s0 - (big ? 30 : 14), s0 + (big ? 80 : 40), sd, { rows: big ? 4 : 3, dens: big ? 0.8 : 0.45 + 0.15 * ((k + (sd > 0 ? 1 : 0)) % 2), label: 'OU jump ' + Math.round(s0 - sStart) });
      if (k % 2 === 0 || big) for (const sd of [-1, 1]) { const [px, pz, ii] = onSide(s0 + 8 + sd * 5, sd, 6 + R() * 3); if (!hard(px, pz)) flagAt(px, pz, T.hd[ii], 6 + R() * 2); }
    });
    if (sY > 0) {   // the fans' marks for the jump length past the Yellow House crest: 40, 50, 57 m (the record, 2003)
      [40, 50, 57].forEach((d, k) => { const [px, pz, ii] = onSide(sY + d, 1, 0.8), py = ouGround(px, pz), g = scen.get(px, pz); box(g, px, py - 0.2, pz, 0.09, 1.1, 0.09, T.hd[ii], [0.4, 0.3, 0.2]);
        bannerQ(px, py + 0.8, pz, T.tx[ii], T.tz[ii], 0.9, 0.9, 0, 1 / 8, 0.625 + k * 0.125, 0.75 + k * 0.125); });
    }
    for (const c of juncs) { const sm = ((c.i0 + c.i1) / 2) * T.ds; run(sm - 30, sm + 45, -c.dir, { first: 7, rows: 4, dens: 0.75, label: 'OU junction ' + Math.round(sm - sStart) }); run(sm - 10, sm + 30, c.dir, { first: 5, rows: 2, dens: 0.4, label: 'OU junction in' }); }
    for (const sd of [-1, 1]) { run(sStart - 10, sStart + 80, sd, { rows: 3, dens: 0.55, label: 'OU start' }); run(sFin - 70, sFin + 5, sd, { rows: 3, dens: 0.5, label: 'OU finish' }); }
    for (const nm of T.names) { const s0 = sStart + nm.d + 60; if (nm.n === 'Ouni') for (const sd of [-1, 1]) run(s0 - 40, s0 + 100, sd, { first: 2.5, rows: 2, dens: 0.4, label: 'OU Ouni' }); }
    for (let s = sStart + 150; s < sFin - 150; s += 170) { const sd = R() < 0.5 ? -1 : 1; run(s, s + 22, sd, { rows: 2, dens: 0.35, clump: 0.9, label: 'OU group' }); }
    for (const [a, b, sd, rows, dens] of def.crowds || []) run(sStart + a, sStart + b, sd, { rows, dens, first: 3.4, label: 'OU street ' + a });   // (the village: people along its street, behind the garden fences)
    // the TV: a scaffold camera tower behind the crowd across from the Yellow House (a cameraman on it), photographers with a MEDIA sign at the Yellow House and the Fast Crest
    const filmer = (x, y, z, fx, fz) => {   // someone filming (a spectator's pose comes from a hash of the spot: it is nudged until the hash says 'filming')
      for (let t = 0; t < 64; t++) { const jx = x + ((t & 7) - 3.5) * 0.08, jz = z + ((t >> 3) - 3.5) * 0.08, p = crH(jx, jz, 2); if (p >= 0.25 && p < 0.35) return crowdPut(CR, jx, y, jz, fx, fz, { flag: 0.05 }, 1); }
      return false; };
    const tower = (x, z, rot, h) => {   // four standards, ledgers, two braces, a plank deck with a rail; returns the deck's height (it stands behind the crowd: no footprint
      // for the crowd's cull, which would take the cameraman off its deck too)
      const y = ouGround(x, z), g = scen.get(x, z), c = Math.cos(rot), s = Math.sin(rot), sc = [0.7, 0.71, 0.73], at = (u, v, yy) => [x + c * u - s * v, y + yy, z + s * u + c * v], sq = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const [u, v] of sq) ouRod(g, at(u, v, -0.2), at(u, v, h + 1.1), 0.045, sc);
      for (const yy of [1.7, h / 2 + 0.85, h, h + 1.05]) for (let k = 0; k < 4; k++) { const [u0, v0] = sq[k], [u1, v1] = sq[(k + 1) % 4]; ouRod(g, at(u0, v0, yy), at(u1, v1, yy), 0.035, sc); }
      ouRod(g, at(-1, -1, 0.1), at(1, -1, h), 0.035, sc); ouRod(g, at(1, 1, 0.1), at(-1, 1, h), 0.035, sc);
      box(g, x, y + h, z, 2.3, 0.12, 2.3, rot, [0.5, 0.4, 0.28]); exclPush(x, z, 3.2); return y + h + 0.12; };
    const tvCam = (x, y, z, fx, fz) => { const g = scen.get(x, z); box(g, x, y, z, 0.1, 1.2, 0.1, 0, [0.15, 0.15, 0.16]); box(g, x, y + 1.2, z, 0.72, 0.4, 0.3, Math.atan2(fz, fx), [0.16, 0.16, 0.18], [0.3, 0.3, 0.32]);
      ouRod(g, [x + fx * 0.3, y + 1.4, z + fz * 0.3], [x + fx * 0.72, y + 1.4, z + fz * 0.72], 0.1, [0.07, 0.07, 0.08], 6); };
    if (sY > 0) { const sd = -yh.side, i = T.idx(sY + 30), o = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + 10.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
      if (!hard(x, z) && ouNear(x, z).dd > 8) { const yd = tower(x, z, T.hd[i], 5.2), fx = -T.nx[i] * sd, fz = -T.nz[i] * sd; tvCam(x + fx * 0.5 + T.tx[i] * 0.3, yd, z + fz * 0.5 + T.tz[i] * 0.3, fx, fz); filmer(x - T.tx[i] * 0.5, yd, z - T.tz[i] * 0.5, fx, fz); } }
    const media = (s0, side) => { if (!board2(s0, side, 2.6, 7, 1.6, 0.5)) return;
      for (let k = 0; k < 3; k++) { const i = T.idx(s0 + 3 + k * 2.2), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 2.7), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; if (!hard(x, z)) filmer(x, ouGround(x, z), z, -T.nx[i] * side - T.tx[i] * 0.6, -T.nz[i] * side - T.tz[i] * 0.6); } };
    if (sY > 0) media(sY + 64, yh.side);
    { const am = T.names.find(n => n.n === 'Fast Crest'); if (am) media(sStart + am.d + 40, 1); }
    // portable toilets in a row behind the big crowds: the Yellow House, Kakaristo, the start
    const wc = (x, z, rot, col) => { const g = scen.get(x, z), y = ouGround(x, z), c = Math.cos(rot), s = Math.sin(rot);   // a plastic cabin, a white roof, the door (local +z) to the road
      box(g, x, y - 0.1, z, 1.15, 2.35, 1.15, rot, col, null, true); box(g, x, y + 2.25, z, 1.28, 0.12, 1.28, rot, [0.93, 0.93, 0.92], null, true);
      box(g, x - s * 0.585, y + 0.05, z + c * 0.585, 0.78, 1.9, 0.03, rot, [col[0] * 0.75, col[1] * 0.75, col[2] * 0.75], null, true); CR.block(x, z, 1.2, 1.2, rot); exclPush(x, z, 1.4); };
    const wcRow = (s, side, off, n, col) => { for (let k = 0; k < n; k++) { const i = T.idx(s + k * 1.5), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + off), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
      if (hard(x, z) || ouNear(x, z).dd < off - 1 || ouWater(x, z).e > -3 || ouField(x, z) > 1) continue; wc(x, z, Math.atan2(side * T.nx[i], -side * T.nz[i]), col); } };
    if (sY > 0) wcRow(sY - 50, -yh.side, 11, 4, [0.12, 0.34, 0.74]);
    { const kk = T.names.find(n => n.n === 'Kakaristo'); if (kk) wcRow(sStart + kk.d + 150, 1, 12, 3, [0.2, 0.56, 0.3]); }
    wcRow(sStart + 50, -1, 13, 3, [0.12, 0.34, 0.74]);
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);   // the trees keep clear of the crowds
    // fans' camps in the fields: tents, vans, a grill, a flag
    for (const f of farms) if (f.kind === 'lato') { const c = Math.cos(f.rot), s = Math.sin(f.rot);
      for (let k = 0; k < 3; k++) { const u = 10 + k * 5, v = -6 + R() * 4, px = f.x + c * u - s * v, pz = f.z + s * u + c * v; if (ouNear(px, pz).dd < 4 || hard(px, pz)) continue; if (k === 1) van(px, pz, f.rot + 0.3, fans[k * 2 % fans.length]); else tentS(px, pz, f.rot + R(), fans[Math.floor(R() * fans.length)]); }
      const gx = f.x + c * 14 - s * 3, gz = f.z + s * 14 + c * 3; if (ouNear(gx, gz).dd > 4) { grill(gx, gz); for (let k = 0; k < 3; k++) person(gx + (R() - 0.5) * 4, gz + (R() - 0.5) * 4, R() * TAU); flagAt(gx + 3, gz + 1, f.rot, 7); } }

    /* ---- the fans' cars parked in rows on the fields by the Yellow House and at Kakaristo, a parking sign at the gate ---- */
    {
      const CARC = [[0.92, 0.92, 0.92], [0.7, 0.72, 0.74], [0.12, 0.12, 0.13], [0.16, 0.24, 0.45], [0.6, 0.1, 0.08], [0.42, 0.44, 0.46], [0.75, 0.62, 0.35]];
      const park = (d0, d1, side, o0, o1, seed) => { const RP = rng(seed); let n = 0;
        for (let d = d0; d < d1; d += 2.7) for (let o = o0; o < o1; o += 7.5) { const i = T.idx(sStart + d), x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o, r1 = RP(), r2 = RP(), r3 = RP();
          if (r1 < 0.2 || ouField(x, z) < 3 || ouNear(x, z).dd < 5 || excluded(x, z)) continue;
          carPk(x, z, Math.atan2(T.nz[i] * side, T.nx[i] * side) + (r2 - 0.5) * 0.12, vary(CARC[Math.floor(r3 * CARC.length)], RP, 0.14)); exclPush(x, z, 2.7); n++; }
        if (n) board2(sStart + d0 - 6, side, 2.2, 6, 2.2, 0.55);
        return n; };
      (def.parks || []).forEach(([a, b, sd, o0, o1], k) => park(a, b, sd, o0, o1, 7491 + k));   // (def.parks [s0, s1, side, from, to])
    }

    /* ---- the fields: rows of white silage bales, a stack by the road here and there ---- */
    {
      const RB = rng(7421), wrap = [0.93, 0.95, 0.9], wrapE = [0.86, 0.88, 0.82];
      for (const F of P.fields) {
        const n = Math.round((F.s1 - F.s0) * (F.depth - F.a) / 1500);
        for (let k = 0; k < n; k++) { const sf = lerp(F.s0, F.s1, RB()), i = T.idx(sf), u = F.side * lerp(F.a + 6, ouFieldFar(F, sf) - 6, RB()), x = T.px[i] + T.nx[i] * u, z = T.pz[i] + T.nz[i] * u, rot = RB() * TAU;
          if (ouField(x, z) < 6 || ouNear(x, z).dd < 5 || excluded(x, z)) continue;
          const m = 1 + Math.floor(RB() * 4), c = Math.cos(rot), s = Math.sin(rot);
          for (let q = 0; q < m; q++) { const bx = x + c * q * 1.9, bz = z + s * q * 1.9, y = ouGround(bx, bz); ouLog(scen.get(bx, bz), bx, y - 0.05, bz, rot + PI / 2, 0.62, 1.25, vary(wrap, RB, 0.05), wrapE); }
          exclPush(x, z, 4); }
      }
    }

    /* ---- knockable props: bale stacks at the junctions (above), marker posts round the outside of the bends ---- */
    ouniProps(out, vProf, excluded);

    /* ---- granite boulders left by the ice age: big ones in the forest, a few mossy ones right behind the ditch ---- */
    {
      const RK = rng(7431), granite = [[0.52, 0.48, 0.46], [0.46, 0.44, 0.43], [0.56, 0.5, 0.47]], moss = [0.3, 0.38, 0.2];
      API.ROCK_SMOOTH = true;   // (rounded, smooth-shaded boulders)
      for (let s = 10; s < T.len - 10; s += 9) for (const side of [-1, 1]) {
        if (RK() > 0.2) continue;
        const o = 2.5 + Math.pow(RK(), 1.5) * 60, [x, z] = onSide(s, side, o), sz = (0.6 + RK() * 1.6) * (o > 15 ? 1.4 : 1);
        if (ouNear(x, z).dd < sz + 1 || excluded(x, z) || ouField(x, z) > -3 || ouWater(x, z).e > -3) { RK(); RK(); continue; }
        const y = ouGround(x, z), g = scen.get(x, z), col = vary(granite[Math.floor(RK() * 3)], RK, 0.1);
        rock(g, x, y + sz * 0.35, z, sz * 1.2, sz, sz, RK() * TAU, col, RK, 0.3);
        ico(g, x, y + sz * 0.95, z, sz * 0.7, 0.25, moss, RK, 0.3);   // a cap of moss
      }
      API.ROCK_SMOOTH = false;
    }

    /* ---- the lake shores on the road's side: clumps of reeds at the water line, a few stones half in the water ---- */
    {
      const RL = rng(7451), reedC = [[0.3, 0.42, 0.16], [0.36, 0.45, 0.18], [0.45, 0.47, 0.24]], stoneC = [0.5, 0.48, 0.46];
      for (const L of P.lakes) {
        const n = Math.floor(L.poly.length / 2);   // (the near edge: the first half of the polygon, along the road)
        for (let k = 0; k < n - 1; k++) { const [x0, z0] = L.poly[k], [x1, z1] = L.poly[k + 1], len = Math.hypot(x1 - x0, z1 - z0); if (len < 0.5) continue;
          let px = -(z1 - z0) / len, pz = (x1 - x0) / len; if (ouWater(x0 + px * 6, z0 + pz * 6).e < ouWater(x0 - px * 6, z0 - pz * 6).e) { px = -px; pz = -pz; }   // (towards the water)
          for (let t = RL() * 4; t < len; t += 4 + RL() * 5) { const u = t / len; let x = lerp(x0, x1, u), z = lerp(z0, z1, u), m = 0;
            while (m < 24 && ouGround(x, z) > L.h + 0.05) { x += px * 0.5; z += pz * 0.5; m++; }   // out to the water line
            if (m >= 24 || excluded(x, z)) continue;
            const g = scen.get(x, z);
            if (RL() < 0.2) { const r = 0.5 + RL() * 0.8; rock(g, x + px * 1.2, L.h + r * 0.1, z + pz * 1.2, r * 1.2, r, r, RL() * TAU, vary(stoneC, RL, 0.12), RL, 0.3); continue; }
            const col = reedC[Math.floor(RL() * 3)];
            for (let q = 0, nq = 5 + Math.floor(RL() * 5); q < nq; q++) { const a = RL() * TAU, d = RL() * 1.6, rx = x + px * 0.8 + Math.cos(a) * d, rz = z + pz * 0.8 + Math.sin(a) * d;
              cone(g, rx, L.h - 0.3, rz, 0.05 + RL() * 0.04, 1.2 + RL() * 1.0, 3, vary(col, RL, 0.12), [0.62, 0.6, 0.36], RL() * TAU); } }
        }
      }
    }

    /* ---- the countryside: power lines on wooden poles along the fields (one crosses the road to the Ouni farm), roundpole fences (riukuaita) by the
       farms' fields, log piles waiting for the timber lorry on the forest verges, yellow warning signs before the sharp corners ---- */
    {
      const pc = [0.27, 0.21, 0.16], ins = [0.8, 0.82, 0.8], wire = [0.1, 0.1, 0.11], lines = [], RC = rng(7501);
      const pole = (x, z, rot) => { const y = ouGround(x, z), g = scen.get(x, z); cyl(g, x, y - 0.3, z, 0.15, 9.3, 5, pc, null, 0.12); box(g, x, y + 8.3, z, 2.6, 0.16, 0.16, rot, pc);
        const tops = []; for (const u of [-1.1, 0, 1.1]) { const px = x + Math.cos(rot) * u, pz = z + Math.sin(rot) * u; cyl(g, px, y + 8.46, pz, 0.05, 0.28, 4, ins); tops.push([px, y + 8.72, pz]); }
        exclPush(x, z, 2.5); return tops; };
      const span = (A, B) => { for (let k = 0; k < 3; k++) { const a = A[k], b = B[k], sag = Math.min(1.5, Math.hypot(b[0] - a[0], b[2] - a[2]) * 0.024); let pr = a;   // three wires, sagging
        for (let q = 1; q <= 6; q++) { const t = q / 6, p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - sag * 4 * t * (1 - t), lerp(a[2], b[2], t)]; ouRod(veg.get(p[0], p[2]), pr, p, 0.02, wire, 3); pr = p; } } };
      for (const [a, b, side, off, sp] of def.lines || []) { let prev = null; const L = [];   // (def.lines [s0, s1, side, beyond the barrier, span])
        for (let d = a; d <= b; d += sp) { const i = T.idx(sStart + d), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + off), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          if (ouNear(x, z).dd < 4 || excluded(x, z) || ouWater(x, z).e > -3) { prev = null; continue; }
          const tops = pole(x, z, T.hd[i] + PI / 2); if (prev) span(prev, tops); prev = tops; L.push({ d, tops }); }
        lines.push(L); }
      const ouF = farms.find(f => f.kind === 'house' && f.s > sStart + 1600 && f.s < sStart + 1760);   // the Ouni farmhouse: a line from the nearest pole over the road to its gable
      if (ouF && lines[0].length) { const c = Math.cos(ouF.rot), sn = Math.sin(ouF.rot), x = ouF.x + c * (ouF.L / 2 + 3), z = ouF.z + sn * (ouF.L / 2 + 3);
        if (ouNear(x, z).dd >= 2) { const P0 = lines[0].reduce((b, q) => (Math.abs(q.d + sStart - ouF.s) < Math.abs(b.d + sStart - ouF.s) ? q : b)), rot = Math.atan2(P0.tops[1][2] - z, P0.tops[1][0] - x) + PI / 2; span(P0.tops, pole(x, z, rot)); } }
      // fences (def.fences [s0, s1, side, style]): the roundpole riukuaita (0) just inside a field's edge, pairs of posts every 2.6 m and three slanting poles
      // from each pair to the next; white pickets (1) along the village's gardens, the people standing behind them (pointed boards in the plants' material)
      const wood = [0.45, 0.39, 0.31], WP = [0.93, 0.93, 0.9], inBld = (x, z) => farms.some(f => Math.hypot(x - f.x, z - f.z) < Math.max(f.L, f.D) * 0.62 + 1);
      for (const [a, b, side, style] of def.fences || []) { let prev = null;
        for (let d = a; d <= b; d += 2.6) { const i = T.idx(sStart + d), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 2.8), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          if (ouNear(x, z).dd < 2.2 || (style ? inBld(x, z) || ouWater(x, z).e > -3 : ouField(x, z) < 0.5 || excluded(x, z))) { prev = null; continue; }
          const y = ouGround(x, z), g = scen.get(x, z);
          if (style) {
            box(g, x, y - 0.2, z, 0.1, 1.3, 0.1, T.hd[i], WP);
            if (prev) { for (const h of [0.3, 0.78]) ouRod(g, [prev[0], prev[1] + h, prev[2]], [x, y + h, z], 0.03, WP, 4);
              const gv = veg.get(x, z), L = Math.hypot(x - prev[0], z - prev[2]) || 1, ux = (x - prev[0]) / L * 0.045, uz = (z - prev[2]) / L * 0.045;
              for (let q = 1; q < 8; q++) { const t = q / 8, px = lerp(prev[0], x, t), pz = lerp(prev[2], z, t), py = lerp(prev[1], y, t) - 0.05, BL = [px - ux, py, pz - uz], BR = [px + ux, py, pz + uz], TL = [px - ux, py + 1.0, pz - uz], TR = [px + ux, py + 1.0, pz + uz];
                gv.triN(BL, BR, TR, UPN, UPN, UPN, WP, WP, WP); gv.triN(BL, TR, TL, UPN, UPN, UPN, WP, WP, WP); gv.triN(TL, TR, [px, py + 1.12, pz], UPN, UPN, UPN, WP, WP, WP); } }
          } else {
            for (const u of [-0.11, 0.11]) ouRod(g, [x + T.nx[i] * u, y - 0.2, z + T.nz[i] * u], [x + T.nx[i] * u, y + 1.3, z + T.nz[i] * u], 0.045, [0.5, 0.44, 0.35]);
            if (prev) for (let q = 0; q < 3; q++) ouRod(g, [lerp(prev[0], x, -0.25 + q * 0.12), prev[1] + 0.1 + q * 0.3, lerp(prev[2], z, -0.25 + q * 0.12)], [lerp(prev[0], x, 1.15 + q * 0.12), y + 0.55 + q * 0.3, lerp(prev[2], z, 1.15 + q * 0.12)], 0.04, vary(wood, RC, 0.14));
          }
          prev = [x, y, z]; } }
      // log piles: 4-3-2 (or 5-4-3-2) spruce or pine logs along the road, pale cut ends
      for (const [d, side] of def.logs || []) {   // (def.logs [s, side])
        const i = T.idx(sStart + d), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 4.2), cx = T.px[i] + T.nx[i] * o, cz = T.pz[i] + T.nz[i] * o;
        if (ouNear(cx, cz).dd < 3 || excluded(cx, cz) || ouField(cx, cz) > -2 || ouWater(cx, cz).e > -3) continue;
        const rows = RC() < 0.5 ? [4, 3, 2] : [5, 4, 3, 2], pine = RC() < 0.5, bark = pine ? [0.5, 0.35, 0.23] : [0.36, 0.31, 0.25], end = [0.86, 0.74, 0.52], g = scen.get(cx, cz);
        let y0 = 1e9; for (const u of [-1.3, 1.3]) for (const v of [-2.4, 2.4]) y0 = Math.min(y0, ouGround(cx + T.nx[i] * u + T.tx[i] * v, cz + T.nz[i] * u + T.tz[i] * v));
        rows.forEach((n, rI) => { for (let k = 0; k < n; k++) { const u = (k - (n - 1) / 2) * 0.46, v = (RC() - 0.5) * 0.4;
          ouLog(g, cx + T.nx[i] * u + T.tx[i] * v, y0 - 0.05 + rI * 0.39, cz + T.nz[i] * u + T.tz[i] * v, T.hd[i], 0.2 + RC() * 0.05, 4.6 + RC() * 0.5, vary(bark, RC, 0.14), end); } });
        exclPush(cx, cz, 4.5); }
      // a yellow warning triangle with a red rim (and a '!') 110 m before each sharp corner, on the right as in Finland; grey back
      for (const c of T.corners) { const sw = c.i0 * T.ds - 110; if (c.sev < 3 || sw < sStart + 60 || sw > sFin - 40) continue;
        const [px, pz, ii] = onSide(sw, 1, 1.6); if (excluded(px, pz)) continue;
        const y = ouGround(px, pz), g = scen.get(px, pz), fx = -T.tx[ii], fz = -T.tz[ii], ux = -fz, uz = fx, hd = T.hd[ii];
        box(g, px, y - 0.2, pz, 0.07, 2.4, 0.07, hd, [0.6, 0.61, 0.63]);
        const tri = (r, off, col, back) => { const cx = px + fx * off, cy = y + 2.2, cz = pz + fz * off, inn = back ? [cx + fx, cy, cz + fz] : [cx - fx, cy, cz - fz];
          g.triO([cx - ux * r, cy - r * 0.577, cz - uz * r], [cx + ux * r, cy - r * 0.577, cz + uz * r], [cx, cy + r * 1.155, cz], col, inn); };
        tri(0.53, 0.03, [0.55, 0.56, 0.58], true); tri(0.53, 0.05, [0.8, 0.1, 0.08]); tri(0.4, 0.065, [0.98, 0.8, 0.12]);
        box(g, px + fx * 0.075, y + 2.12, pz + fz * 0.075, 0.06, 0.24, 0.012, hd + PI / 2, [0.08, 0.08, 0.08]); box(g, px + fx * 0.075, y + 2.0, pz + fz * 0.075, 0.06, 0.06, 0.012, hd + PI / 2, [0.08, 0.08, 0.08]);
        exclPush(px, pz, 1.5); }
    }

    /* ---- Finnish details: moose warning signs (def.moose.signs [s, side]: a yellow triangle with a moose, facing the arriving cars), a moose at a forest
       edge (def.moose.animals [s, side, beyond the barrier, angle, wading: out in a lake's shallows]), rowing boats full of fans sitting out on the lakes ---- */
    {
      const RM = rng(7521), mo = def.moose || {};
      for (const [d, side] of mo.signs || []) { const [px, pz, ii] = onSide(sStart + d, side, 1.6); if (excluded(px, pz)) continue;
        const y = ouGround(px, pz), g = scen.get(px, pz), fx = -T.tx[ii], fz = -T.tz[ii];
        box(g, px, y - 0.2, pz, 0.07, 2.5, 0.07, T.hd[ii], [0.6, 0.61, 0.63]); bannerQ(px + fx * 0.05, y + 1.7, pz + fz * 0.05, fx, fz, 1.15, 1.15, 0.375, 0.5, 0.5, 0.625, ban2); exclPush(px, pz, 1.5); }
      for (const [d, side, off, ang, wade] of mo.animals || []) { const i = T.idx(sStart + d); let o = side * ((side > 0 ? T.br[i] : T.bl[i]) + off), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        if (wade) {   // (wading: from there out into the lake, to where the water comes up to its knees)
          let ok = false; for (let k = 0; k < 120 && !ok; k++, o += side * 0.5) { x = T.px[i] + T.nx[i] * o; z = T.pz[i] + T.nz[i] * o; const W = ouWater(x, z); ok = !!W.L && W.e > 2 && W.L.h - ouGround(x, z) > 0.35; }
          if (!ok) continue; }
        if (excluded(x, z)) continue;
        const y = ouGround(x, z), g = scen.get(x, z), rot = T.hd[i] + (ang || 0), c = Math.cos(rot), sn = Math.sin(rot), at = (u, v, h) => [x + c * u - sn * v, y + h, z + sn * u + c * v];
        const fur = [0.23, 0.16, 0.11], legC = [0.35, 0.3, 0.25], ant = [0.66, 0.6, 0.47];   // a bull moose: dark body over long pale legs, a shoulder hump, the long head, palmate antlers
        box(g, x, y + 1.1, z, 2.5, 1.05, 0.95, rot, fur); { const [hx, , hz] = at(0.95, 0, 0); box(g, hx, y + 1.45, hz, 0.9, 0.95, 0.85, rot, fur); }
        ouRod(g, at(1.3, 0, 1.9), at(1.85, 0, 2.3), 0.22, fur, 4); { const [hx, , hz] = at(2.15, 0, 0); box(g, hx, y + 2.05, hz, 0.8, 0.45, 0.36, rot, fur); }
        for (const v of [-1, 1]) { ouRod(g, at(1.95, v * 0.12, 2.45), at(1.85, v * 0.55, 2.7), 0.05, ant, 3); const [ax, ay, az] = at(1.8, v * 0.75, 2.62); box(g, ax, ay, az, 0.5, 0.08, 0.5, rot + v * 0.35, ant); }
        for (const [u, v] of [[0.95, -0.3], [0.95, 0.3], [-0.95, -0.3], [-0.95, 0.3]]) ouRod(g, at(u, v, 1.2), at(u, v, -0.1), 0.09, legC, 4);
        exclPush(x, z, 5); }
      for (const L of P.lakes) for (let k = 0; k < 3; k++) {   // boats: a white hull with a green rim, three fans sitting in each, looking at the road
        let x = 0, z = 0, ok = false;
        for (let t = 0; t < 40 && !ok; t++) { x = lerp(L.x0, L.x1, RM()); z = lerp(L.z0, L.z1, RM()); ok = ouWater(x, z).e > 14 && ouGround(x, z) < L.h - 1.2 && !P.islands.some(I => Math.hypot(x - I.x, z - I.z) < I.r + 12); }
        if (!ok) continue;
        const q = ouSeg(x, z), rot = Math.atan2(T.tz[q.i], T.tx[q.i]) + (RM() - 0.5) * 0.7, g = scen.get(x, z), c = Math.cos(rot), sn = Math.sin(rot), y = L.h;
        box(g, x, y - 0.2, z, 3.8, 0.55, 1.3, rot, [0.9, 0.9, 0.88], [0.5, 0.4, 0.3]); box(g, x, y + 0.3, z, 3.9, 0.08, 1.36, rot, [0.2, 0.42, 0.28]);
        for (const u of [2.1, -2.1]) box(g, x + c * u, y - 0.15, z + sn * u, 0.5, 0.42, 0.7, rot, [0.9, 0.9, 0.88]);   // (blunt bow and stern)
        const fx = T.px[q.i] - x, fz = T.pz[q.i] - z;
        for (let m = 0; m < 3; m++) { const u = (m - 1) * 1.15; crowdPut(CR, x + c * u, y + 0.05, z + sn * u, fx, fz, { sit: 1 }, 0); }
      }
    }

    /* ---- low plants (their own chunks, casting no shadow): grass tufts and summer flowers on the verges and the ditch banks (lupins in drifts, pink fireweed in
       bands along the forest edge, cream umbels and yellow tansy), bilberry and ferns on the forest floor beside the road, water lilies in the shallows ---- */
    {
      const RV = rng(7511), grassC = [[0.25, 0.37, 0.12], [0.31, 0.41, 0.14], [0.38, 0.42, 0.18], [0.46, 0.45, 0.22]], tipC = [0.6, 0.62, 0.34];
      const tri = (g, a, b, c, ca, cb, cc) => g.triN(a, b, c, UPN, UPN, UPN, ca, cb || ca, cc || ca);
      const blade = (g, x, y, z, h, a, lean, bw, c0, c1) => { const ca = Math.cos(a), sa = Math.sin(a); tri(g, [x - sa * bw, y, z + ca * bw], [x + sa * bw, y, z - ca * bw], [x + ca * h * lean, y + h, z + sa * h * lean], c0, c0, c1); };
      const tuft = (g, x, y, z, h) => { const c0 = grassC[Math.floor(RV() * grassC.length)]; for (let k = 0; k < 3; k++) blade(g, x, y, z, h * (0.7 + RV() * 0.5), RV() * TAU, 0.2 + RV() * 0.3, 0.05 + RV() * 0.04, c0, tipC); };
      const spike = (g, x, y, z, h, wd, col, top) => {   // a flower spike (lupin, fireweed): one flat spindle, a green stem into the blossoms (larger than life, to read from the camera)
        const a = RV() * PI, ca = Math.cos(a) * wd, sa = Math.sin(a) * wd, mL = [x - ca, y + h * 0.5, z - sa], mR = [x + ca, y + h * 0.5, z + sa];
        tri(g, [x, y, z], mR, mL, [0.24, 0.36, 0.13], col, col); tri(g, mL, mR, [x, y + h, z], col, col, top); };
      const umbel = (g, x, y, z, h, col) => { blade(g, x, y, z, h, RV() * TAU, 0.05, 0.04, [0.24, 0.36, 0.13], [0.3, 0.42, 0.16]);   // a stem with a flat head of small flowers
        const r = 0.12 + RV() * 0.07, a0 = RV() * TAU, cy = y + h; for (let k = 0; k < 3; k++) { const a = a0 + k / 3 * TAU, b = a0 + (k + 1) / 3 * TAU; tri(g, [x, cy + 0.03, z], [x + Math.cos(a) * r, cy, z + Math.sin(a) * r], [x + Math.cos(b) * r, cy, z + Math.sin(b) * r], col); } };
      const LUP = [[0.42, 0.28, 0.74], [0.55, 0.36, 0.82], [0.84, 0.42, 0.68], [0.68, 0.3, 0.62]], FIRE = [0.86, 0.3, 0.6], FIRET = [0.94, 0.5, 0.7], WHITE = [0.95, 0.95, 0.91], CREAM = [0.9, 0.87, 0.74], YEL = [0.96, 0.8, 0.16];
      const vY = (i, side, o) => { const pr = vProf(i, side); if (o <= pr[0][0]) return T.hy[i];   // the verge ribbon's surface at offset o (its cross-section); beyond it the ground
        for (let k = 0; k < pr.length - 1; k++) if (o <= pr[k + 1][0]) return T.hy[i] + lerp(pr[k][1], pr[k + 1][1], (o - pr[k][0]) / (pr[k + 1][0] - pr[k][0]));
        return ouGround(T.px[i] + T.nx[i] * side * o, T.pz[i] + T.nz[i] * side * o); };
      const ok = (x, z, i) => { if (excluded(x, z)) return false; const nn = ouNear(x, z); return !(nn.i >= 0 && Math.abs(nn.i - i) * T.ds > 30 && nn.dd < 0.5); };   // (not on another part of the road)
      const sA = Math.max(4, sStart - 70), sB = T.len - 6;
      for (let s = sA; s < sB; s += 1.5) for (const side of [-1, 1]) {
        const i = T.idx(s + (RV() - 0.5) * 1.2), bar = side > 0 ? T.br[i] : T.bl[i], at = (o) => [T.px[i] + T.nx[i] * side * o, T.pz[i] + T.nz[i] * side * o];
        // a grass tuft somewhere from the grass shoulder over the ditch to the top of its far bank
        const o = w + 0.55 + RV() * (bar + 1.8 - w - 0.55), [x, z] = at(o), r1 = RV(), r2 = RV(), r3 = RV();
        if (!ok(x, z, i)) continue;
        const g = veg.get(x, z), y = vY(i, side, o), ditch = Math.abs(o - bar - 0.45) < 0.8;
        tuft(g, x, y, z, ditch ? 0.75 + r1 * 0.35 : 0.35 + r1 * 0.4);
        // lupins in drifts on the shoulder and the near bank (a colour per drift), cream umbels and yellow tansy here and there
        const drift = P.n4(s * 0.35 + side * 97, 11), lc = LUP[(Math.floor(s / 41) + (side > 0 ? 2 : 0)) % LUP.length], lt = [Math.min(1, lc[0] * 1.18), Math.min(1, lc[1] * 1.18), Math.min(1, lc[2] * 1.1)];
        if (drift > 0.58) { const n = 3 + Math.floor(RV() * 4 * sstep(0.58, 0.75, drift) + RV()); for (let q = 0; q < n; q++) { const oq = w + 0.8 + RV() * (bar - w - 0.6), [qx, qz] = at(oq); spike(g, qx + (RV() - 0.5) * 0.9, vY(i, side, oq) - 0.05, qz + (RV() - 0.5) * 0.9, 0.8 + RV() * 0.45, 0.11, lc, lt); } }
        else if (r2 < 0.16) { const n = 2 + Math.floor(RV() * 3); for (let q = 0; q < n; q++) { const qx = x + (RV() - 0.5) * 0.7, qz = z + (RV() - 0.5) * 0.7; if (r3 < 0.45) umbel(g, qx, y - 0.05, qz, 0.45 + RV() * 0.25, CREAM); else umbel(g, qx, y - 0.05, qz, 0.4 + RV() * 0.25, YEL); } }
        // fireweed in pink bands along the forest edge, just beyond the ditch (not by the fields)
        const band = P.n4(s * 0.3 + side * 211 + 40, 23);
        if (band > 0.5) { const oq = bar + 1.4 + RV() * 2.6, [fx, fz] = at(oq); if (ok(fx, fz, i) && ouField(fx, fz) < -1 && ouWater(fx, fz).e < -3) { const fy = vY(i, side, oq), n = 2 + Math.floor(RV() * 4 * sstep(0.5, 0.7, band));
          for (let q = 0; q < n; q++) spike(g, fx + (RV() - 0.5) * 1.4, fy - 0.05, fz + (RV() - 0.5) * 1.4, 1.2 + RV() * 0.6, 0.1, FIRE, FIRET); } }
      }
      const BIL = [[0.13, 0.26, 0.1], [0.16, 0.3, 0.11], [0.2, 0.32, 0.12]], FERN = [0.24, 0.42, 0.14], FERNT = [0.34, 0.5, 0.2];
      for (let s = sA; s < sB; s += 2.6) for (const side of [-1, 1]) {
        const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], o = bar + 2.4 + Math.pow(RV(), 1.4) * 14, x = T.px[i] + T.nx[i] * side * o + (RV() - 0.5) * 2, z = T.pz[i] + T.nz[i] * side * o + (RV() - 0.5) * 2, r1 = RV();
        if (excluded(x, z) || ouField(x, z) > -2 || ouWater(x, z).e > -2 || ouNear(x, z).dd < 1.8) continue;
        const y = ouGround(x, z) - 0.03, g = veg.get(x, z);
        if (r1 < 0.62) { const r = 0.35 + RV() * 0.35, h = 0.22 + RV() * 0.2, c = BIL[Math.floor(RV() * 3)], a0 = RV() * TAU, top = [x, y + h, z], cT = [c[0] * 1.25, c[1] * 1.2, c[2] * 1.2];   // bilberry: a low dome
          for (let k = 0; k < 6; k++) { const a = a0 + k / 6 * TAU, b = a0 + (k + 1) / 6 * TAU; tri(g, [x + Math.cos(a) * r, y, z + Math.sin(a) * r], [x + Math.cos(b) * r, y, z + Math.sin(b) * r], top, c, c, cT); }
        } else { const a0 = RV() * TAU, L = 0.5 + RV() * 0.4;   // a fern: five fronds arching out
          for (let k = 0; k < 5; k++) { const a = a0 + k / 5 * TAU + (RV() - 0.5) * 0.4, ca = Math.cos(a), sa = Math.sin(a); tri(g, [x - sa * 0.07, y + 0.05, z + ca * 0.07], [x + sa * 0.07, y + 0.05, z - ca * 0.07], [x + ca * L, y + L * 0.45, z + sa * L], FERN, FERN, FERNT); } }
      }
      const PAD = [0.2, 0.36, 0.14];
      for (const L of P.lakes) for (let k = 0; k < 400; k++) {   // water lilies: clusters of notched pads just off the shore, a white flower here and there
        const x = lerp(L.x0, L.x1, RV()), z = lerp(L.z0, L.z1, RV()), e = ouWater(x, z).e; if (e < 4 || e > 11 || ouGround(x, z) > L.h - 0.25) continue;
        const g = veg.get(x, z), n = 3 + Math.floor(RV() * 6);
        for (let q = 0; q < n; q++) { const px = x + (RV() - 0.5) * 3, pz = z + (RV() - 0.5) * 3, r = 0.2 + RV() * 0.2, a0 = RV() * TAU, c = vary(PAD, RV, 0.2), y = L.h + 0.03;
          for (let m = 1; m < 6; m++) { const a = a0 + m / 6 * TAU, b = a0 + (m + 1) / 6 * TAU; tri(g, [px, y, pz], [px + Math.cos(a) * r, y, pz + Math.sin(a) * r], [px + Math.cos(b) * r, y, pz + Math.sin(b) * r], c); }
          if (RV() < 0.18) { const a1 = RV() * TAU; for (let m = 0; m < 5; m++) { const a = a1 + m / 5 * TAU, b = a1 + (m + 1) / 5 * TAU; tri(g, [px, y + 0.1, pz], [px + Math.cos(a) * 0.1, y + 0.03, pz + Math.sin(a) * 0.1], [px + Math.cos(b) * 0.1, y + 0.03, pz + Math.sin(b) * 0.1], WHITE, WHITE, [0.98, 0.9, 0.5]); } } }
      }
    }

    /* ---- the forest: spruce in the damp hollows, pine on the dry ridges, birch at the edges of the fields and the road, young spruce in
       the undergrowth; right up to the ditch, thinner and bigger farther out (instanced per 96 m chunk) ---- */
    const tMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 3].map(k => new IChunks(ouTreeGeo(k), tMat, 96)), tkF = [0, 1, 2].map(k => new IChunks(ouTreeGeo(k, true), tMat, 96));   // (tkF: beyond 80 m, plain)
    let nTrees = 0;
    {
      const G = P.G, L = OUC * OUT, maxT = Math.round(120000 * dens), RT = rng(7441), SP = 5.4 / Math.sqrt(dens);   // (the cap is only a safety net)
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * L, za = G.z0 + tj * L;
        for (let zz = za; zz < za + L - 0.01; zz += SP) for (let xx = xa; xx < xa + L - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = ouTG(P.td, x, z); if (hd > 240) continue;
          const far = hd > 80; if (far && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // farther out every other spot (bigger trees: a closed canopy from above)
          const fd = ouField(x, z); if (fd > -1.5 && (fd < 6 || r1 > 0.004)) continue;   // (a lone tree now and then out on a field)
          const isle = P.islands.find(I => Math.hypot(x - I.x, z - I.z) < I.r + 3);   // (on an island: pines, where it is dry)
          if (ouWater(x, z).e > -5 && !(isle && ouGround(x, z) > isle.L.h + 0.9)) continue;
          const nn = ouNear(x, z); if (nn.i >= 0 && nn.dd < 2.6) continue; if (nn.i >= 0 && nn.dd < 6 && r2 < 0.3) continue;
          if (excluded(x, z) || r1 > 0.93) continue;
          const y = ouGround(x, z), trend = ouTG(P.th, x, z), rise = y - trend, edge = (nn.i >= 0 && nn.dd < 14) || (fd > -14);
          const pPine = clamp(0.25 + rise * 0.06 + (P.n2(x * 1.4 + 300, z * 1.4) - 0.5) * 0.9, 0.05, 0.85), pBirch = edge ? 0.35 : 0.1 + 0.15 * sstep(0.6, 0.8, P.n1(x * 2 + 70, z * 2));
          let sp = r3 < pBirch ? 2 : r3 < pBirch + (1 - pBirch) * pPine ? 1 : 0;
          if (sp === 0 && edge && r4 < 0.25) sp = 3;   // young spruce at the edges
          if (isle) sp = 1;
          const hgt = sp === 0 ? 13 + r4 * 8 : sp === 1 ? 15 + r4 * 9 : sp === 2 ? 11 + r4 * 6 : 2.5 + r4 * 3, big = far ? 1.15 : 1;
          const wid = hgt * (sp === 0 ? 0.52 + r2 * 0.14 : sp === 1 ? 0.8 + r2 * 0.3 : sp === 2 ? 0.85 + r2 * 0.25 : 0.7);
          const cv = 0.86 + r2 * 0.26; (far && sp < 3 ? tkF : tk)[sp].add(x, y - 0.15, z, r1 * 70, wid * big, hgt * big, [cv * (0.94 + r4 * 0.1), cv, cv * (0.94 + r3 * 0.1)]);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    for (const t of tk.concat(tkF)) t.addTo(root, true);

    /* ---- the puddles of a race in the rain (T.puddles, Render.setWet shows them and darkens the wet road and grass): the grey sky mirrored in
       the middle, darker towards a muddy rim, following the road's curve and height; one mesh, hidden in the dry ---- */
    if (T.puddles.length) {
      const g = new GB(), PP = (s, d) => { const f = s / T.ds, i = clamp(Math.floor(f), 0, T.N - 2), t = f - i, j = i + 1, nx = lerp(T.nx[i], T.nx[j], t), nz = lerp(T.nz[i], T.nz[j], t);
        return [lerp(T.px[i], T.px[j], t) + nx * d, lerp(T.hy[i], T.hy[j], t) + 0.035, lerp(T.pz[i], T.pz[j], t) + nz * d]; };
      const SKY = [0.55, 0.59, 0.63], MID = [0.38, 0.4, 0.42], RIM = [0.3, 0.27, 0.22], n = 14, RP = rng(7531);
      for (const [s, d, hl, hw] of T.puddles) {
        const c = PP(s, d), below = [c[0], c[1] - 5, c[2]], ph = RP() * TAU, wob = [];
        for (let k = 0; k < n; k++) { const a = k / n * TAU; wob.push([Math.cos(a), Math.sin(a), 0.84 + 0.16 * Math.sin(a * 3 + ph) * Math.cos(a * 2 - ph)]); }
        const ring = (f) => wob.map(([cx, sz, w]) => PP(s + cx * hl * w * f, d + sz * hw * w * f)), I = ring(0.62), O = ring(1);
        for (let k = 0; k < n; k++) { const m = (k + 1) % n;
          g.triO(c, I[k], I[m], SKY, below);
          g.triO(I[k], O[k], O[m], MID, below, RIM, RIM); g.triO(I[k], O[m], I[m], MID, below, RIM, MID); }
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true })); m.matrixAutoUpdate = false; m.visible = false; m.name = 'puddles'; root.add(m);
      out.dyn.wet = { puddles: m, road: rMat, ground: gMat, base: { sh: rMat.shininess, sp: rMat.specular.getHex() } };
    }

    /* ---- finish the meshes, the sky: cloud shadows and the TV helicopter (Pikes Peak's) ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: ouAtlas(T.cpS.map(kmS)), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: ouAtlas2(), side: THREE.FrontSide, alphaTest: 0.5 }), true); if (bm2) bm2.castShadow = false;   // (alphaTest: the triangular moose sign)
    { const vg = new THREE.Group(); vg.name = 'plants'; root.add(vg); veg.addTo(vg, ouVegMat(), false, true); }
    crowdFinish(CR, root, out);
    if (smoke.length) {   // thin smoke from the grills and the sauna chimneys, drifting in a light breeze (Red Bull Ring's plumes, fewer and smaller puffs)
      const PL = [null, { per: 9, life: 6, lifeV: 2, rise: 5, riseV: 2, flare: 0.16 }, { per: 12, life: 8, lifeV: 3, rise: 9, riseV: 4, flare: 0 }];
      const t = API.rbSmokeTex(); out.ownTex.push(t);
      root.add(API.rbSmoke(smoke.map(([x, y, z, k]) => [x, y - 0.5, z, k === 1 ? [0.74, 0.74, 0.76] : [0.62, 0.62, 0.64], k === 1 ? 0.45 : 0.7, PL[k]]), CR.U.uTime, t, [0.5, 0.3]));
    }
    pkSky({ root, tex, out, sStart, gH: ouGround, far: true });
    out.stats = { trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld };   // (read by the tests)
    return out;
  }

  Object.assign(API, { hjCutMat, ouCutMat, ouFlag, ouGTex, ouRoadTex, ouRod, ouVegMat });   // (what World and the other worlds use of this one)
  Object.defineProperties(API, { OU: { get: () => OU, set: (v) => { OU = v; } } });
  World.ext.ouni = (scene, tex, opts) => buildOuni(scene, tex, opts);
})();
