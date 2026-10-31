/* =========================================================================
   WORLD — Pikes Peak (theme 'pikes'): its own builder (World.ext.pikes), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, ICO_F, ICO_V, TAU, atSf, box, clamp, cone, crAt, crH, crowdAt, crowdCtx, crowdFinish, crowdMat, crowdPut, crowdRun, cyl, gable,
    hex, ico, lerp, pikesProps, rng, rock, sstep, valueNoise2, vary, waterMat
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= PIKES PEAK (theme 'pikes') =================
     An open 6.3 km mountain road (s = 0 at the bottom, T.len at the summit) that climbs ~440 m. Only a corridor around the road is built.
     Terrain: a height grid (5 m cells) cut into 100 m tiles. Near the road the height is blended from the nearby road samples (the ground
     sits at road height inside the barriers and slopes smoothly between stacked switchback legs); farther out it turns into a far field
     that rises west of the road (falls away on both sides along the ridge and at the summit), drops east into a valley with a reservoir,
     and falls away past both ends of the road. Hot loops live in these small functions (the big builder is not optimised by V8). */
  const PKC = 5, PKT = 20, PKHC = 32;          // terrain cell (m), tile size (cells), road-sample hash cell (m)
  let PK = null;                               // per-build data: sample hash, far-field grids, terrain height grid, pads, lake
  const PKN = { i: -1, d: 1e9, dd: 1e9, lat: 0, h: 0, hn: 0 };   // pkNear: nearest sample, its distance and lateral offset, distance beyond the barrier, blended and exact road height
  const PKCOL = [0, 0, 0];
  function pkPrep() {
    const N = T.N, M = 520; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    const P = PK = { bx0: x0, bx1: x1, bz0: z0, bz1: z1, pads: [], lk: null };
    x0 -= M; x1 += M; z0 -= M; z1 += M; P.x0 = x0; P.z0 = z0;
    // every 2nd road sample (and the last one) in a hash grid
    P.cx0 = Math.floor(x0 / PKHC); P.cz0 = Math.floor(z0 / PKHC); P.ncx = Math.floor(x1 / PKHC) - P.cx0 + 1; P.ncz = Math.floor(z1 / PKHC) - P.cz0 + 1; P.cells = new Array(P.ncx * P.ncz);
    const add = (i) => { const k = (Math.floor(T.pz[i] / PKHC) - P.cz0) * P.ncx + Math.floor(T.px[i] / PKHC) - P.cx0; (P.cells[k] || (P.cells[k] = [])).push(i); };
    for (let i = 0; i < N; i += 2) add(i); if ((N - 1) % 2) add(N - 1);
    // far-field trend: inverse-distance average of the road heights on a 16 m grid, and the distance to the road
    const tc = 16, tnx = Math.ceil((x1 - x0) / tc) + 1, tnz = Math.ceil((z1 - z0) / tc) + 1, th = new Float32Array(tnx * tnz), td = new Float32Array(tnx * tnz);
    const sx = [], sz = [], sy = []; for (let i = 0; i < N; i += 5) { sx.push(T.px[i]); sz.push(T.pz[i]); sy.push(T.hy[i]); }
    const S = sx.length;
    for (let j = 0; j < tnz; j++) for (let i = 0; i < tnx; i++) {
      const x = x0 + i * tc, z = z0 + j * tc; let ws = 0, hs = 0, dm = 1e18;
      for (let k = 0; k < S; k++) { const dx = x - sx[k], dz = z - sz[k], d2 = dx * dx + dz * dz; if (d2 < dm) dm = d2; const q = 1 / (d2 + 900), wq = q * q; ws += wq; hs += wq * sy[k]; }
      th[j * tnx + i] = hs / ws; td[j * tnx + i] = Math.sqrt(dm);
    }
    Object.assign(P, { tc, tnx, tnz, th, td });
    // mean road x per 10 m of z (the mountain's cross-slope is measured from it) and the cross-slope per band:
    // rising to the west (kW > 0) or falling (kW < 0: the ridge, the summit), falling to the east into the valley (kE)
    const nb = Math.ceil((z1 - z0) / 10) + 1, xs = new Float64Array(nb), xw = new Float64Array(nb), xc = new Float32Array(nb), kW = new Float32Array(nb), kE = new Float32Array(nb);
    for (let i = 0; i < N; i += 2) { const b = Math.round((T.pz[i] - z0) / 10); for (let q = Math.max(0, b - 6); q <= Math.min(nb - 1, b + 6); q++) { xs[q] += T.px[i]; xw[q]++; } }
    let first = -1; for (let q = 0; q < nb; q++) { if (xw[q] > 0) { xc[q] = xs[q] / xw[q]; if (first < 0) { first = q; for (let r = 0; r < q; r++) xc[r] = xc[q]; } } else if (first >= 0) xc[q] = xc[q - 1]; }
    for (let pass = 0; pass < 3; pass++) { const c2 = xc.slice(); for (let q = 0; q < nb; q++) { let s = 0, n = 0; for (let r = Math.max(0, q - 5); r <= Math.min(nb - 1, q + 5); r++) { s += c2[r]; n++; } xc[q] = s / n; } }
    const zAt = (s) => T.pz[T.idx(s)], zr0 = zAt(3950), zr1 = zAt(4850), zsm = zAt(5950);
    for (let q = 0; q < nb; q++) { const z = z0 + q * 10, rid = sstep(zr0 + 120, zr0 - 120, z) * sstep(zr1 - 120, zr1 + 120, z), sum = sstep(zsm + 80, zsm - 140, z);
      kW[q] = lerp(lerp(0.46, -0.32, rid), -0.3, sum); kE[q] = lerp(0.5, 0.36, sum); }
    Object.assign(P, { nb, xc, kW, kE });
    P.n1 = valueNoise2(301, 110); P.n2 = valueNoise2(302, 38); P.n3 = valueNoise2(303, 60); P.n4 = valueNoise2(304, 24);
    P.sx = T.px[0]; P.sz = T.pz[0]; P.stx = T.tx[0]; P.stz = T.tz[0]; P.ex = T.px[N - 1]; P.ez = T.pz[N - 1]; P.etx = T.tx[N - 1]; P.etz = T.tz[N - 1];
    // terrain height grid (filled lazily, NaN = not computed yet) and the distance beyond the nearest barrier at each vertex
    const G = P.G = { x0, z0 }; G.ntx = Math.ceil((x1 - x0) / (PKC * PKT)); G.ntz = Math.ceil((z1 - z0) / (PKC * PKT)); G.nx = G.ntx * PKT + 1; G.nz = G.ntz * PKT + 1;
    G.h = new Float32Array(G.nx * G.nz).fill(NaN); G.dd = new Float32Array(G.nx * G.nz); G.on = new Uint8Array(G.ntx * G.ntz); G.st = new Uint8Array(G.ntx * G.ntz);   // (G.st: the tile mesh's cell, in grid steps)
    // the reservoir in the valley below the first hairpins (seen ahead when the road turns east), a little below the ground around it
    let il = T.idx(1600); for (let s = 1600; s < 1900; s += 4) if (T.px[T.idx(s)] > T.px[il]) il = T.idx(s);   // the east tip of the hairpin
    const lx = T.px[il] + 150, lz = T.pz[il] - 10;
    P.lk = { x: lx, z: lz, rx: 75, rz: 110, y: pkFar(lx, lz, 200) - 3 };
  }
  function pkTG(a, x, z) {   // bilinear lookup in a far-field grid
    const P = PK, gx = clamp((x - P.x0) / P.tc, 0, P.tnx - 1.001), gz = clamp((z - P.z0) / P.tc, 0, P.tnz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = P.tnx;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function pkNear(x, z) {   // Shepard blend of the road heights around (x, z): weights fall with the distance beyond each sample's barrier, so stacked legs blend smoothly
    const P = PK, cx = Math.floor(x / PKHC) - P.cx0, cz = Math.floor(z / PKHC) - P.cz0, ds = T.ds;
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
    PKN.i = bi; PKN.d = bd; PKN.dd = bdd; PKN.lat = bl;
    if (bi < 0) return PKN;
    PKN.h = hs / ws;
    const f = clamp(bi + ba / ds, 0, T.N - 1), i0 = Math.min(T.N - 2, Math.floor(f)); PKN.hn = T.hy[i0] + (T.hy[i0 + 1] - T.hy[i0]) * (f - i0);   // road height across from the point
    return PKN;
  }
  function pkFar(x, z, dd) {   // the mountain away from the road
    const P = PK; let f = pkTG(P.th, x, z);
    const hd = pkTG(P.td, x, z), q = clamp((z - P.z0) / 10, 0, P.nb - 1.001), q0 = Math.floor(q), t = q - q0;
    const xc = P.xc[q0] + (P.xc[q0 + 1] - P.xc[q0]) * t, kW = P.kW[q0] + (P.kW[q0 + 1] - P.kW[q0]) * t, kE = P.kE[q0] + (P.kE[q0 + 1] - P.kE[q0]) * t, e = hd * sstep(10, 70, hd);
    const up = kW > 0 ? 95 * (1 - Math.exp(-kW * e / 95)) : Math.max(-150, kW * e), dn = Math.min(170, kE * e), bw = 25 + 0.4 * e;
    f += lerp(-dn, up, sstep(xc + bw, xc - bw, x));   // west of the road's mean line the mountain rises (or falls away on the ridge and at the top), east it drops into the valley; blended across the line (no wall)
    f += (P.n1(x, z) * 30 + P.n2(x, z) * 12 - 17) * sstep(4, 70, dd);                       // knolls, gullies and outcrops
    const e1 = (x - P.ex) * P.etx + (z - P.ez) * P.etz; if (e1 > 45) f -= 0.55 * (e1 - 45);   // the summit is the top: the mountain falls away beyond the road's end
    const e0 = (P.sx - x) * P.stx + (P.sz - z) * P.stz; if (e0 > 45) f -= 0.3 * (e0 - 45);   // and into the valley below the start
    const L = P.lk;
    if (L) { const ex = (x - L.x) / L.rx, ez = (z - L.z) / L.rz, r = Math.sqrt(ex * ex + ez * ez);
      if (r < 1.7) f = lerp(L.y + (r - 1) * 12 - 4 * Math.max(0, 1 - r * r), f, sstep(1.15, 1.7, r)); }   // reservoir basin with a shore just above the water
    return f;
  }
  function pkH(x, z) {   // terrain height
    const n = pkNear(x, z), i = n.i, dd = n.dd, hn = n.hn; let h;
    if (i < 0) h = pkFar(x, z, 200);
    else { const hr = lerp(hn, n.h, sstep(0, 6, dd)) - 0.3; h = dd <= 1 ? hr : lerp(hr, pkFar(x, z, dd), sstep(1, 45, dd)); }
    const pads = PK.pads; for (let k = 0; k < pads.length; k++) { const p = pads[k], d = Math.hypot(x - p.x, z - p.z); const pb = p.b || 16; if (d < p.r + pb) h = lerp(p.h, h, sstep(p.r, p.r + pb, d)); }   // flat paddock / car park
    if (i >= 0 && dd < 6) h = Math.min(h, hn - 0.3 + 0.12 * dd * dd);   // never above the road inside the barriers, and only a gentle rise right behind them
    PKN.dd = i >= 0 ? dd : 999;
    return h;
  }
  function pkGH(i, j) {   // terrain height at grid vertex (i, j), computed once
    const G = PK.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = pkH(G.x0 + i * PKC, G.z0 + j * PKC); G.dd[k] = PKN.dd; }
    return h;
  }
  function pkGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = PK.G, gx = clamp((x - G.x0) / PKC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / PKC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = pkGH(i, j); return a + u * (pkGH(i + 1, j) - a) + v * (pkGH(i, j + 1) - a); }
    const d = pkGH(i + 1, j + 1); return d + (1 - u) * (pkGH(i, j + 1) - d) + (1 - v) * (pkGH(i + 1, j) - d);
  }
  function pkGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in pkTileGeo)
    const G = PK.G, gx = clamp((x - G.x0) / PKC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / PKC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = pkGH(ii, jj);
      const nx = (pkGH(ii + 1, jj) - pkGH(ii - 1, jj)) / (2 * PKC), nz = (pkGH(ii, jj + 1) - pkGH(ii, jj - 1)) / (2 * PKC), c = pkCol(G.x0 + ii * PKC, G.z0 + jj * PKC, h, 1 / Math.hypot(nx, 1, nz), G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function pkSlope(x, z) { const a = pkGround(x - 2.5, z), b = pkGround(x + 2.5, z), c = pkGround(x, z - 2.5), d = pkGround(x, z + 2.5); return Math.hypot(b - a, d - c) / 5; }
  function pkTreeline(x, z) { return 186 + 34 * (PK.n1(x * 1.7, z * 1.7) - 0.5); }   // ~45 % of the climb, ragged
  function pkCol(x, z, h, ny, dd) {   // ground colour: forest floor (rust needle litter in patches), then pinkish granite gravel with olive grass and green-brown tundra, bare granite on steep slopes,
    // snow fields near the top (old snow lying on in the hollows, dirty wind-packed edges)
    const P = PK, m = P.n3(x, z), tl = pkTreeline(x, z), tun = sstep(tl - 14, tl + 22, h), n5 = P.n5 || (P.n5 = valueNoise2(9431, 9)), n6 = P.n6 || (P.n6 = valueNoise2(9432, 34)), q = n5(x, z), q2 = n6(x, z);
    let r = 0.15 + m * 0.07, g = 0.21 + m * 0.07, b = 0.11 + m * 0.035;
    const nl = sstep(0.52, 0.78, q) * 0.55; r = lerp(r, 0.26 + m * 0.05, nl); g = lerp(g, 0.2 + m * 0.04, nl); b = lerp(b, 0.12, nl);   // needle litter
    const gs = sstep(0.42, 0.75, P.n4(x, z)) * (1 - sstep(300, 420, h)) * 0.85, pk = (q2 - 0.5) * 0.12;   // (pk: pinker or greyer gravel)
    let ar = lerp(0.62 + m * 0.08 + pk, 0.5, gs), ag = lerp(0.43 + m * 0.05 - pk * 0.25, 0.47, gs), ab = lerp(0.33 + m * 0.03 + pk * 0.2, 0.27, gs);
    const tu = sstep(0.56, 0.76, n6(x * 0.6 + 40, z * 0.6)) * sstep(tl - 5, tl + 20, h) * (1 - sstep(290, 350, h)) * 0.6, tq = q - 0.5;   // tundra: mottled green-brown
    ar = lerp(ar, 0.45 + tq * 0.12, tu); ag = lerp(ag, 0.41 - tq * 0.04, tu); ab = lerp(ab, 0.27, tu);
    r = lerp(r, ar, tun); g = lerp(g, ag, tun); b = lerp(b, ab, tun);
    const sc = sstep(0.95, 0.8, ny) * tun * (0.5 + 0.5 * sstep(0.3, 0.7, q2)) * 0.85, sq = (q - 0.5) * 0.1;   // scree: loose grey-pink rubble on the middling slopes above the trees (paler, greyer than the gravel)
    r = lerp(r, 0.57 + m * 0.08 + sq, sc); g = lerp(g, 0.51 + m * 0.06 + sq, sc); b = lerp(b, 0.47 + m * 0.05 + sq * 0.8, sc);
    const st = sstep(0.8, 0.6, ny) * 0.9;
    r = lerp(r, 0.62 + m * 0.06, st); g = lerp(g, 0.53 + m * 0.05, st); b = lerp(b, 0.48 + m * 0.04, st);
    if (h > 322) { const sn = sstep(330, 445, h); let c = h > 330 ? sstep(0.72 - 0.22 * sn, 0.8 - 0.22 * sn, P.n4(x * 0.8 + 50, z * 0.8)) : 0;
      const cv = (pkGround(x + 8, z) + pkGround(x - 8, z) + pkGround(x, z + 8) + pkGround(x, z - 8)) / 4 - h;   // > 0 in a hollow
      c = Math.max(c, sstep(0.3, 1.3, cv) * sstep(322, 365, h) * sstep(0.25, 0.55, q) * sstep(3, 9, dd));
      c *= 1 - st * 0.7;
      r = lerp(r, 1.04, c); g = lerp(g, 1.06, c); b = lerp(b, 1.12, c);
      const e = 4 * c * (1 - c) * (0.45 + 0.3 * q); r = lerp(r, 0.76, e); g = lerp(g, 0.73, e); b = lerp(b, 0.7, e); }   // the dirty, wind-packed edge
    if (dd < 3) { const t = sstep(3, 0, dd) * 0.3; r = lerp(r, 0.6, t); g = lerp(g, 0.5, t); b = lerp(b, 0.42, t); }   // dusty verge
    { // soft ambient occlusion: the ground's curvature over 6 and 18 m (opposite pairs, so a plain slope cancels out): darker in gullies, at the foot of slopes and of the road's cut, a touch lighter on the ridges
      const G = pkGround, h0 = G(x, z), c6 = (G(x + 6, z) + G(x - 6, z) + G(x, z + 6) + G(x, z - 6) + G(x + 4.2, z + 4.2) + G(x - 4.2, z - 4.2) + G(x + 4.2, z - 4.2) + G(x - 4.2, z + 4.2)) / 8 - h0;
      const c18 = (G(x + 18, z) + G(x - 18, z) + G(x, z + 18) + G(x, z - 18)) / 4 - h0, o = sstep(0.1, 1.1, c6) * 0.55 + sstep(0.4, 4, c18) * 0.45, k = 1 - 0.44 * o + 0.06 * sstep(-0.15, -1.2, c6);
      r *= k; g *= k; b *= k * (1 + 0.04 * o); }   // (the shade a little bluer: skylight)
    PKCOL[0] = r; PKCOL[1] = g; PKCOL[2] = b; return PKCOL;
  }
  function pkTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells; deep in the haze, but the top of a tall portrait view looks that far down into the valleys),
    // 3: a forest tile far from the road (its nearest point 130+ m away: only far trees on it, seen in the haze) with 10 m cells
    const G = PK.G, L = PK.lk, x = G.x0 + (ti + 0.5) * PKT * PKC, z = G.z0 + (tj + 0.5) * PKT * PKC, d = pkTG(PK.td, x, z);
    const ex = (x - L.x) / L.rx, ez = (z - L.z) / L.rz; if (ex * ex + ez * ez < 2.6) return 1;
    if (d < 340) return d < 200 ? 1 : 3;
    return d < 470 ? 2 : 0;
  }
  function pkGroundS(x, z) {   // height of the terrain mesh surface where it has 10 m cells (G.st), else pkGround
    const G = PK.G, L = PKT * PKC, ti = clamp(Math.floor((x - G.x0) / L), 0, G.ntx - 1), tj = clamp(Math.floor((z - G.z0) / L), 0, G.ntz - 1);
    if (G.st[tj * G.ntx + ti] !== 2) return pkGround(x, z);
    const gx = (x - G.x0) / (2 * PKC), gz = (z - G.z0) / (2 * PKC), i = clamp(Math.floor(gx), ti * PKT / 2, ti * PKT / 2 + PKT / 2 - 1), j = clamp(Math.floor(gz), tj * PKT / 2, tj * PKT / 2 + PKT / 2 - 1), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = pkGH(2 * i, 2 * j); return a + u * (pkGH(2 * i + 2, 2 * j) - a) + v * (pkGH(2 * i, 2 * j + 2) - a); }
    const d = pkGH(2 * i + 2, 2 * j + 2); return d + (1 - u) * (pkGH(2 * i, 2 * j + 2) - d) + (1 - v) * (pkGH(2 * i + 2, 2 * j) - d);
  }
  function pkTileGeo(ti, tj, st, xs) {   // one 100 m terrain tile (every st-th grid vertex; st 0: none): indexed, normals from the shared grid (no seams between tiles);
    // xs: [textured GB (the verge), plain GB (far scenery: no grit, its colours divided by the grit's mean grey; casts no shadow)] merged in
    const G = PK.G, m = st ? PKT / st : 0, n = st ? m + 1 : 0, nb = n * n, na = xs ? xs[0].P.length / 3 : 0, nf = xs ? xs[1].P.length / 3 : 0, nv = nb + na + nf;
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), stp = new Float32Array(nv), i0 = ti * PKT, j0 = tj * PKT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * PKC, z = G.z0 + j * PKC, h = pkGH(i, j);
      let nx = -(pkGH(i + st, j) - pkGH(i - st, j)) / (2 * PKC * st), nz = -(pkGH(i, j + st) - pkGH(i, j - st)) / (2 * PKC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = pkCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);   // 0 up to ~39 deg, 1 from 60 deg (the texture fades out there)
    }
    if (xs) { const [v, f] = xs, o = nb + na, M = 1 / +pkGMean.toFixed(3);   // (the shader's own rounding of the mean)
      pos.set(v.P, nb * 3); nor.set(v.N, nb * 3); col.set(v.C, nb * 3); uv.set(v.U, nb * 2);
      pos.set(f.P, o * 3); nor.set(f.N, o * 3); for (let q = 0; q < nf * 3; q++) col[o * 3 + q] = f.C[q] * M; stp.fill(2, o); }   // (steep 2: plain, no grit, no relief)
    const idx = nv > 65535 ? new Uint32Array(m * m * 6 + na + nf) : new Uint16Array(m * m * 6 + na + nf); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    for (let q = nb; q < nv; q++) idx[k++] = q;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('steep', new THREE.BufferAttribute(stp, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }
  let pkGTex = null, pkGMean = 0.9, pkATex = null, pkAKey = '';   // the ground and board textures are made once and reused by every Pikes build (the world teardown frees materials, not maps)
  function pkTex() {   // ground grit in three channels (tileable): r the grey grit (the vertex colours give the hue): mottled, with light and dark stones; g its relief (the stones as domes,
    // for the sun-side emboss in pkGroundMat); b sparse glints (ice crystals, mica: the snow's sparkle)
    if (pkGTex) return pkGTex;
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(515), n = valueNoise2(516, 2), n2 = valueNoise2(517, 1), n3 = valueNoise2(518, 8);
    const A = new Float32Array(S * S), H = new Float32Array(S * S);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const k = j * S + i; A[k] = 0.8 + n(i, j) * 0.16 + n2(i, j) * 0.08 + (r() - 0.5) * 0.1; H[k] = 0.2 + n3(i, j) * 0.16 + n(i, j) * 0.1 + n2(i, j) * 0.04; }
    const stone = (px, py, rr, tone, al, ht) => {   // a round stone (wrapped at the edges): the grit towards tone, the relief a dome
      for (let v = Math.floor(py - rr - 1); v <= Math.ceil(py + rr + 1); v++) for (let u = Math.floor(px - rr - 1); u <= Math.ceil(px + rr + 1); u++) {
        const q = Math.hypot(u + 0.5 - px, v + 0.5 - py), cov = clamp(rr + 0.5 - q, 0, 1); if (cov <= 0) continue;
        const k = ((v + S) % S) * S + (u + S) % S, dm = Math.sqrt(Math.max(0, 1 - (q / (rr + 0.5)) ** 2)); A[k] = lerp(A[k], tone, cov * al); H[k] = Math.max(H[k], 0.28 + ht * dm); } };
    for (let k = 0; k < 80; k++) stone(r() * S, r() * S, 1.5 + r() * 2.2, 0.74 + r() * 0.3, 0.45, 0.3 + r() * 0.3);   // pebbles and cobbles (10-30 cm)
    for (let k = 0; k < 280; k++) stone(r() * S, r() * S, 0.6 + r() * 1.2, r() < 0.5 ? 0.3 : 1.1, 0.35, 0.12 + r() * 0.2);   // grit
    let sum = 0;
    for (let k = 0; k < S * S; k++) { const o = k * 4; d[o] = clamp(A[k], 0, 1) * 255; d[o + 1] = clamp(H[k], 0, 1) * 190; d[o + 2] = r() < 0.03 ? 120 + r() * 135 : 0; d[o + 3] = 255; sum += d[o]; }   // (g kept below r: the season code must not take the map for grass)
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    pkGMean = sum / (S * S) / 255;   // steep faces fade to this (pkGroundMat)
    return (pkGTex = t);
  }
  function pkGroundMat() {   // terrain tiles (one material): the grit (map r) times a second, ~58 m copy of it (breaks up the 10 m repeat); on steep faces (attribute 'steep', where the top-down
    // UVs would smear it) the grit projected sideways instead, stretched along the face like the granite's joints; the merged scenery (steep 2) takes the plain mean grey.
    // Relief: the grit's height (map g) against its height a little towards the sun: the stones' sun side lit, their far side dark (strong under the low sun, none in shadow).
    // Glints: bright, near-white ground (snow, ice; the winter's snow too) sparkles where the map's sparse b dots, shifted with the view, face the sun
    const t = pkTex(), m = new THREE.MeshLambertMaterial({ map: t, vertexColors: true }), mean = pkGMean.toFixed(3);
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float steep;\nvarying float vSteep;\nvarying float vPkY;\nvarying vec3 vPkN;\nvarying vec3 vPkV;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSteep = steep; vPkY = position.y;').replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\nvPkN = transformedNormal;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvPkV = -mvPosition.xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vSteep;\nvarying float vPkY;\nvarying vec3 vPkN;\nvarying vec3 vPkV;').replace('#include <map_fragment>', [
        'float pkE = 0.0, pkSc = step( 1.5, vSteep ), pkSt = min( vSteep, 1.0 ), pkW = smoothstep( 0.76, 0.9, min( vColor.r, min( vColor.g, vColor.b ) ) * mix( 1.0, ' + mean + ', pkSc ) );   // pkW: snow',
        '#ifdef USE_MAP',
        '  vec4 pkT = texture2D( map, vUv );',
        '  float pkG = pkT.r * mix( 1.0, texture2D( map, vUv * 0.173 + vec2( 0.31, 0.57 ) ).r / ' + mean + ', 0.55 );',
        '  if ( pkSt > 0.01 ) {',
        '    vec3 pkNw = ( vec4( vPkN, 0.0 ) * viewMatrix ).xyz; float pkWx = abs( pkNw.x ) / ( abs( pkNw.x ) + abs( pkNw.z ) + 1e-4 );',
        '    float pkR = mix( texture2D( map, vec2( vUv.x * 0.45, vPkY * 0.16 ) ).r, texture2D( map, vec2( vUv.y * 0.45 + 0.5, vPkY * 0.16 ) ).r, pkWx );',
        '    pkG = mix( pkG, mix( pkR, ' + mean + ', 0.25 ), pkSt );',
        '  }',
        '  diffuseColor.rgb *= mix( mix( pkG, ' + mean + ' * 1.04, pkW * 0.75 ), ' + mean + ', pkSc );',   // (snow: smoother)
        '  #if NUM_DIR_LIGHTS > 0',
        '    vec3 pkL = ( vec4( directionalLights[ 0 ].direction, 0.0 ) * viewMatrix ).xyz; vec2 pkO = vec2( pkL.x, -pkL.z ); float pkOl = length( pkO );',
        '    pkE = ( pkT.g - texture2D( map, vUv + pkO / max( pkOl, 1e-3 ) * 0.008 ).g ) * 1.6 * min( pkOl / max( pkL.y, 0.2 ), 2.5 ) * ( 1.0 - pkSt ) * ( 1.0 - pkSc ) * ( 1.0 - 0.85 * pkW );',
        '  #endif',
        '#endif'].join('\n'))
        .replace('reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();', 'reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask() * clamp( 1.0 + pkE, 0.4, 1.7 );')
        .replace('#include <envmap_fragment>', [
        '#include <envmap_fragment>',
        '#if defined( USE_MAP ) && defined( USE_COLOR ) && NUM_DIR_LIGHTS > 0',
        '  if ( pkW > 0.0 ) {',
        '    vec3 pkV = normalize( vPkV ), pkN = normalize( vPkN ), pkLd = directionalLights[ 0 ].direction, pkH = normalize( pkLd + pkV );',
        '    float pkS = texture2D( map, vUv * 0.61 + pkV.xy * 0.05 ).b;',
        '    outgoingLight += directionalLights[ 0 ].color * ( smoothstep( 0.45, 0.9, pkS ) * 2.6 * smoothstep( 0.3, 0.95, dot( pkN, pkH ) ) * step( 0.0, dot( pkN, pkLd ) ) * pkW * getShadowMask() );',
        '  }',
        '#endif'].join('\n'));
    };
    m.customProgramCacheKey = () => 'pkGround2';
    return m;
  }
  function pkAtlas(cps) {   // text boards (8 rows of 1024 x 128): START, CILJ, CP1-CP4 with altitude, the summit sign, the paddock banner
    if (pkATex && pkAKey === cps.join('|')) return pkATex;
    if (pkATex) pkATex.dispose(); pkAKey = cps.join('|');
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 104, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(312, 142, 400, 100); txt('CILJ', 512, 196, 96, '#111', 380);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#d8261e'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      x.beginPath(); x.arc(90, y + 50, 30, 0, TAU); x.fill(); x.beginPath(); x.moveTo(64, y + 64); x.lineTo(116, y + 64); x.lineTo(90, y + 112); x.fill(); x.fillStyle = '#d8261e'; x.beginPath(); x.arc(90, y + 50, 12, 0, TAU); x.fill();
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#fff', 520); });
    x.fillStyle = '#5a3a22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#efe3c8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('PIKES PEAK SUMMIT', 512, 812, 58, '#f3ead6', 900); txt('14,115 FT  ·  4301 m', 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#1d4f9a'; x.fillRect(0, 896, 1024, 128); txt('VZPON NA PIKES PEAK', 512, 964, 84, '#fff', 960);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (pkATex = t);
  }
  function pkPine(g, x, y, z, h, col, R, far, sp) {   // dark conifer: thin trunk (not on the far ones) + three stacked tiers (51-60 vertices); far 2: two tiers (33 vertices), 3: one cone (the same draws from R)
    // sp (species; always the same 4 draws from R, the rest hashed from where it stands): 1 Engelmann spruce (narrow, pointed, dark blue-green), 2 Douglas fir (fuller),
    // 3 limber pine (rounder, lighter), 4 a dead grey snag, 5 krummholz (wind-stunted flag tree at the treeline: the branches stream east, away from the west wind)
    // snow on the branches: each tier's tip takes an up-leaning normal (the season code takes it for ground: deep snow on the tips in winter, a dusting lower down); towards the
    // treeline some old snow lies on the tips all year (hashed per tree: no draws from R, every tree stays as it was)
    const hq = (((Math.round(x * 7) * 2654435761) ^ (Math.round(z * 7) * 40503)) >>> 0) % 1000 / 1000, tlp = pkTreeline(x, z), sn = sstep(tlp - 45, tlp + 5, y) * (0.2 + 0.55 * hq);
    const snw = (c, k) => sn > 0 ? [lerp(c[0], 0.9, sn * k), lerp(c[1], 0.93, sn * k), lerp(c[2], 0.98, sn * k)] : c;
    const tier = (g, cx, cy, cz, r, hh, sides, c0, cT, rot) => {   // a tier (as cone(), flat shaded) with the snowy tip
      if (hh <= 0 || sides < 4) return cone(g, cx, cy, cz, r, hh, sides, c0, cT, rot);   // (trunks, the undersides: as they were)
      const apex = [cx, cy + hh, cz], inn = [cx, cy + hh * 0.3, cz], L = Math.hypot(r, hh) || 1, ny = r / L, nh = hh / L, ct = snw(cT || c0, 1), cb = snw(c0, 0.2);
      for (let i = 0; i < sides; i++) { const a0 = rot + i / sides * TAU, a1 = rot + (i + 1) / sides * TAU, am = (a0 + a1) / 2, cx1 = Math.cos(am) * nh, cz1 = Math.sin(am) * nh, l = Math.hypot(cx1 * 0.45, 0.9, cz1 * 0.45), fn = [cx1, ny, cz1];
        g.triON([cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r], apex, [cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r], fn, [cx1 * 0.45 / l, 0.9 / l, cz1 * 0.45 / l], fn, inn, cb, ct, cb); }
    };
    if (sp) {
      const rot = R() * TAU, r0 = h * (0.24 + R() * 0.05), v1 = vary([1, 1, 1], R, 0.08), v2 = vary([1, 1, 1], R, 0.08), H = rng((Math.round(x * 10) * 73856093) ^ (Math.round(z * 10) * 19349663) ^ 4099);
      const tn = (c, a, b, d) => [c[0] * a, c[1] * b, c[2] * d], lit = (c) => [c[0] * 1.3, c[1] * 1.28, c[2] * 1.2], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k], bark = [0.3, 0.21, 0.14];
      const spike = (b, rb, t, cb, ct, a0) => { const inn = [(b[0] * 2 + t[0]) / 3, (b[1] * 2 + t[1]) / 3, (b[2] * 2 + t[2]) / 3];   // 3-sided tapering piece from a ring round b to the point t
        for (let k = 0; k < 3; k++) { const e0 = a0 + k / 3 * TAU, e1 = e0 + TAU / 3; g.triO([b[0] + Math.cos(e0) * rb, b[1], b[2] + Math.sin(e0) * rb], t, [b[0] + Math.cos(e1) * rb, b[1], b[2] + Math.sin(e1) * rb], cb, inn, ct, cb); } };
      const flag = (p, ux, uz, L, w, hu, hd, c) => {   // a wind-streamed tuft: a spindle from just upwind of p to L downwind (8 faces), lit on top, dark below
        const A = [p[0] - ux * L * 0.12, p[1], p[2] - uz * L * 0.12], E = [p[0] + ux * L, p[1] - L * 0.1, p[2] + uz * L], q = [p[0] + ux * L * 0.35, p[1], p[2] + uz * L * 0.35];
        const r = [[q[0], q[1] + hu, q[2]], [q[0] - uz * w, q[1], q[2] + ux * w], [q[0], q[1] - hd, q[2]], [q[0] + uz * w, q[1], q[2] - ux * w]], cs = [snw(lit(c), 1), c, sh(c, 0.6), c];
        for (let k = 0; k < 4; k++) { const j = (k + 1) % 4; g.triO(A, r[k], r[j], sh(c, 0.85), q, cs[k], cs[j]); g.triO(E, r[j], r[k], sh(c, 0.9), q, cs[j], cs[k]); } };
      if (sp === 1) {   // Engelmann spruce
        const c = tn(col, 0.78, 0.9, 1.22), rr = r0 * 0.66;
        if (far === 3) { tier(g, x, y + h * 0.1, z, rr * 0.95, h * 0.9, 6, c, lit(c), rot); return; }
        if (far === 2) { tier(g, x, y + h * 0.1, z, rr, h * 0.5, 6, c, lit(c), rot); tier(g, x, y + h * 0.4, z, rr * 0.62, h * 0.6, 5, tn(c, v1[0], v1[0], v1[0]), lit(c), rot + 0.5); return; }
        if (!far) tier(g, x, y - 0.3, z, h * 0.025 + 0.1, h * 0.3, 3, bark, null, rot);
        tier(g, x, y + h * 0.08, z, rr, h * 0.38, 6, c, lit(c), rot);
        tier(g, x, y + h * 0.3, z, rr * 0.78, h * 0.36, 6, sh(c, v1[0]), lit(c), rot + 0.5);
        tier(g, x, y + h * 0.5, z, rr * 0.52, h * 0.5, 5, sh(c, v2[0]), lit(c), rot + 1); return;
      }
      if (sp === 2) {   // Douglas fir
        const c = tn(col, 1.06, 1.08, 0.8), rr = r0 * 1.14;
        if (far === 3) { tier(g, x, y + h * 0.12, z, rr * 0.92, h * 0.88, 6, c, lit(c), rot); return; }
        if (far === 2) { tier(g, x, y + h * 0.12, z, rr, h * 0.48, 6, c, lit(c), rot); tier(g, x, y + h * 0.4, z, rr * 0.68, h * 0.6, 6, sh(c, v1[0]), lit(c), rot + 0.5); return; }
        if (!far) tier(g, x, y - 0.3, z, h * 0.03 + 0.14, h * 0.3, 3, bark, null, rot);
        tier(g, x, y + h * 0.1, z, rr, h * 0.44, 6, sh(c, 0.92), lit(c), rot);
        tier(g, x, y + h * 0.34, z, rr * 0.8, h * 0.4, 6, sh(c, v1[0]), lit(c), rot + 0.5);
        tier(g, x, y + h * 0.56, z, rr * 0.54, h * 0.44, 5, sh(c, v2[0] * 1.04), lit(c), rot + 1); return;
      }
      if (sp === 3) {   // limber pine: a rounded, lighter crown on a longer bare trunk (a bicone), often a side lobe
        const c = tn(col, 1.45, 1.22, 1.15), rr = r0 * 1.02, yc = y + h * 0.5;
        tier(g, x, yc, z, rr, h * 0.48, 6, sh(c, v1[0]), lit(c), rot);
        if (far === 3) return;
        tier(g, x, yc, z, rr, -h * 0.26, 6, sh(c, 0.72), null, rot);
        if (far) return;
        tier(g, x, y - 0.3, z, h * 0.03 + 0.12, h * 0.55, 3, [0.36, 0.3, 0.24], null, rot);
        const a = H() * TAU, o = rr * 0.75, lx = x + Math.cos(a) * o, lz = z + Math.sin(a) * o, ly = y + h * (0.32 + H() * 0.12);
        tier(g, lx, ly, lz, rr * 0.55, h * 0.26, 4, sh(c, v2[0]), lit(c), rot + 0.3); tier(g, lx, ly, lz, rr * 0.55, -h * 0.12, 4, sh(c, 0.7), null, rot + 0.3); return;
      }
      if (sp === 4) {   // a dead snag: a bare grey trunk, a broken top, a few stubs
        const c = vary([0.62, 0.6, 0.57], H, 0.16), cf = sh(c, 0.62), hh = h * (0.7 + H() * 0.35), rb = h * 0.028 + 0.12, a0 = H() * TAU;
        spike([x, y - 0.3, z], rb, [x + (H() - 0.5) * 0.4, y + hh, z + (H() - 0.5) * 0.4], cf, sh(c, 1.15), a0);
        if (far > 1) return;
        for (let k = 0; k < 3; k++) { const f = 0.35 + k * 0.2 + H() * 0.08, a = a0 + k * 2.2 + H(), L = h * (0.14 - k * 0.03);
          spike([x, y + hh * f, z], rb * (0.5 - k * 0.1), [x + Math.cos(a) * L, y + hh * f + L * 0.35, z + Math.sin(a) * L], sh(c, 0.8), c, a); }
        return;
      }
      // krummholz: a short trunk leaning downwind, a low mat and one or two flags streaming east (x+), away from the west wind
      const wa = (H() - 0.5) * 0.6, ux = Math.cos(wa), uz = Math.sin(wa), c = tn(col, 0.95, 1.0, 1.08), hk = h * (0.5 + H() * 0.2);
      flag([x - ux * r0 * 0.2, y + 0.15, z - uz * r0 * 0.2], ux, uz, r0 * 2.4, r0 * 0.9, 0.45 + h * 0.07, 0.2, sh(c, v1[0] * 0.9));
      if (far === 3) return;
      const tp = [x + ux * hk * 0.14, y + hk, z + uz * hk * 0.14];
      flag([tp[0], tp[1] - hk * 0.12, tp[2]], ux, uz, r0 * (1.2 + H() * 0.5), r0 * 0.35, r0 * 0.28, r0 * 0.18, sh(c, v2[0]));
      if (far === 2) return;
      spike([x, y - 0.3, z], 0.1 + h * 0.02, tp, [0.36, 0.3, 0.25], [0.52, 0.46, 0.4], rot);
      if (H() < 0.6) { const f = 0.45 + H() * 0.15; flag([x + ux * hk * 0.14 * f, y + hk * f, z + uz * hk * 0.14 * f], ux, uz, r0 * (1.0 + H() * 0.5), r0 * 0.3, r0 * 0.24, r0 * 0.16, sh(c, v1[0] * 1.05)); }
      return;
    }
    const rot = R() * TAU, rr = h * (0.24 + R() * 0.05), ct = [col[0] * 1.3, col[1] * 1.28, col[2] * 1.2];
    if (far === 3) { tier(g, x, y + h * 0.13, z, rr * 0.9, h * 0.87, 6, col, ct, rot); vary(col, R, 0.08); vary(col, R, 0.08); return; }   // (3: one cone, 18 vertices, deep in the haze)
    if (far === 2) { tier(g, x, y + h * 0.13, z, rr, h * 0.47, 6, col, ct, rot); tier(g, x, y + h * 0.42, z, rr * 0.64, h * 0.58, 5, vary(col, R, 0.08), ct, rot + 0.5); vary(col, R, 0.08); return; }
    if (!far) tier(g, x, y - 0.3, z, h * 0.03 + 0.12, h * 0.3, 3, [0.3, 0.21, 0.14], null, rot);
    tier(g, x, y + h * 0.13, z, rr, h * 0.42, 6, col, ct, rot);
    tier(g, x, y + h * 0.37, z, rr * 0.76, h * 0.38, 6, vary(col, R, 0.08), ct, rot + 0.5);
    tier(g, x, y + h * 0.59, z, rr * 0.5, h * 0.41, 5, vary(col, R, 0.08), ct, rot + 1);
  }
  function pkForest(scen, R, dens, excluded, flat) {   // conifer forest below the treeline, on a jittered grid over the corridor tiles; far from the road (flat(x, z): a GB that casts no shadow) simpler
    const G = PK.G, P = PK, step = 6.6 / Math.sqrt(dens), L = PKT * PKC, maxT = Math.round(15500 * dens);
    const pineCs = [[0.09, 0.2, 0.11], [0.11, 0.24, 0.12], [0.08, 0.18, 0.1], [0.13, 0.26, 0.14], [0.1, 0.22, 0.14]];
    // species on their own stream (R keeps its sequence, so every tree stands where it did): quaking aspen groves low down, bristlecone pines at the treeline
    const A = rng(9404), grove = valueNoise2(9405, 170), S = rng(9421);   // (S: the conifer species, heights of the young ones)
    const aspC = [[0.4, 0.54, 0.2], [0.36, 0.5, 0.17], [0.46, 0.57, 0.23]], gold = [0.82, 0.64, 0.16], barkA = [0.84, 0.84, 0.78], knotA = [0.3, 0.29, 0.27];
    const barkB = [0.74, 0.7, 0.64], footB = [0.46, 0.4, 0.34], snagB = [0.8, 0.78, 0.74], needB = [[0.11, 0.19, 0.16], [0.13, 0.22, 0.17], [0.1, 0.17, 0.15]];
    const sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const seg = (g, b, rb, t, rt, a0, a1, cb, ct) => {   // 3-sided trunk piece from ring b to ring t (a1 - a0: twist)
      const inn = [(b[0] + t[0]) / 2, (b[1] + t[1]) / 2, (b[2] + t[2]) / 2];
      for (let k = 0; k < 3; k++) { const p = (c, r, a) => [c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r], e0 = k / 3 * TAU, e1 = (k + 1) / 3 * TAU;
        g.quadO(p(b, rb, a0 + e0), p(t, rt, a1 + e0), p(t, rt, a1 + e1), p(b, rb, a0 + e1), cb, inn, null, [cb, ct, ct, cb]); }
    };
    const spike = (g, b, rb, t, a0, cb, ct) => { const inn = [(b[0] * 2 + t[0]) / 3, (b[1] * 2 + t[1]) / 3, (b[2] * 2 + t[2]) / 3];   // 3-sided tapering tip (leans towards t)
      for (let k = 0; k < 3; k++) { const e0 = a0 + k / 3 * TAU, e1 = a0 + (k + 1) / 3 * TAU; g.triO([b[0] + Math.cos(e0) * rb, b[1], b[2] + Math.sin(e0) * rb], t, [b[0] + Math.cos(e1) * rb, b[1], b[2] + Math.sin(e1) * rb], cb, inn, ct, cb); } };
    const blob = (g, x, y, z, r, up, dn, n, col) => {   // rounded crown / needle tuft: a jittered ring with a top and a bottom point (2n faces), lit on top, dark below
      const a0 = A() * TAU, ps = [], top = [x, y + r * up, z], bot = [x, y - r * dn, z], inn = [x, y, z], cb = sh(col, 0.62), tl = pkTreeline(x, z), sn = sstep(tl - 40, tl + 10, y) * (0.3 + 0.4 * (((Math.round(x * 9) * 73856093) ^ (Math.round(z * 9) * 19349663)) >>> 0) % 997 / 997);
      const ct = [lerp(col[0] * 1.25, 0.9, sn), lerp(col[1] * 1.25, 0.93, sn), lerp(col[2] * 1.25, 0.98, sn)];   // (the top: old snow on the tufts at the treeline; its normal leans up, so winter puts snow there)
      for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU, rr = r * (0.8 + A() * 0.35); ps.push([x + Math.cos(a) * rr, y + (A() - 0.5) * r * 0.3, z + Math.sin(a) * rr]); }
      for (let k = 0; k < n; k++) { const p = ps[k], q = ps[(k + 1) % n], mx = (p[0] + q[0]) / 2 - x, mz = (p[2] + q[2]) / 2 - z, ml = Math.hypot(mx, mz) || 1, lq = Math.hypot(up, 1), fn = [mx / ml * up / lq, 1 / lq, mz / ml * up / lq];
        g.triON(p, top, q, fn, [mx / ml * 0.35, 0.94, mz / ml * 0.35], fn, inn, col, ct, col); g.triO(p, q, bot, col, inn, col, cb); }
    };
    const ball = (g, x, y, z, r, sy, col) => {   // rounder crown: two staggered 4-rings between a top and a bottom point (16 faces)
      const a0 = A() * TAU, u = [], d = [], top = [x, y + r * sy, z], bot = [x, y - r * sy * 0.8, z], inn = [x, y, z], ct = sh(col, 1.18), cb = sh(col, 0.66);
      for (let k = 0; k < 4; k++) { const a = a0 + k / 4 * TAU, b = a + TAU / 8, ru = r * (0.75 + A() * 0.2), rd = r * (0.92 + A() * 0.2);
        u.push([x + Math.cos(a) * ru, y + r * sy * 0.45, z + Math.sin(a) * ru]); d.push([x + Math.cos(b) * rd, y - r * sy * 0.15, z + Math.sin(b) * rd]); }
      for (let k = 0; k < 4; k++) { const k1 = (k + 1) % 4;
        g.triO(u[k], top, u[k1], ct, inn, ct, ct); g.triO(u[k], u[k1], d[k], col, inn, col, col); g.triO(u[k1], d[k1], d[k], col, inn, col, col); g.triO(d[k], d[k1], bot, col, inn, col, cb); }
    };
    const aspen = (g, x, y, z, h, far) => {   // quaking aspen: one slender whitish trunk (dark at the foot, a dark band where it enters the crown), a rounded crown, some golden, some with a second lobe
      const a0 = A() * TAU, rb = 0.1 + h * 0.012, gd = A() < 0.12, col = vary(gd ? gold : aspC[Math.floor(A() * 3)], A, 0.12);
      if (!far) spike(g, [x, y - 0.3, z], rb, [x, y + h * 0.8, z], a0, knotA, barkA);
      ball(g, x, y + h * 0.72, z, h * 0.16, 1.7, col);
      if (A() < 0.4) { const a = A() * TAU, o = h * 0.12; blob(g, x + Math.cos(a) * o, y + h * (0.52 + A() * 0.12), z + Math.sin(a) * o, h * 0.11, 1.3, 1.1, 4, vary(col, A, 0.1)); }
    };
    const bristle = (g, x, y, z, h) => {   // bristlecone pine: a short, leaning, twisted pale trunk (some dead snags), sparse dark blue-green tufts
      const la = A() * TAU, lx = Math.cos(la), lz = Math.sin(la), lean = 0.18 + A() * 0.3, rb = 0.22 + h * 0.03, a0 = A() * TAU, dead = A() < 0.22, bk = vary(dead ? snagB : barkB, A, 0.1);
      const m = [x + lx * h * 0.45 * lean, y + h * 0.45, z + lz * h * 0.45 * lean], ba = la + (A() - 0.5) * 2.4, t = [m[0] + Math.cos(ba) * h * 0.25, y + h * (dead ? 0.95 : 0.85), m[2] + Math.sin(ba) * h * 0.25];
      seg(g, [x, y - 0.4, z], rb, m, rb * 0.6, a0, a0 + 0.9, footB, bk);
      spike(g, m, rb * 0.6, t, a0 + 0.9, bk, sh(bk, 1.08));
      const ab = ba + 2 + A(), br = [m[0] + Math.cos(ab) * h * 0.4, m[1] + h * 0.2, m[2] + Math.sin(ab) * h * 0.4];   // a side limb (bare on the snags)
      spike(g, [m[0], m[1] - h * 0.06, m[2]], rb * 0.35, br, a0, bk, sh(bk, 1.1));
      if (dead) return;
      const c = vary(needB[Math.floor(A() * 3)], A, 0.12), n = 2 + (A() < 0.5 ? 1 : 0);
      blob(g, t[0], t[1] - h * 0.05, t[2], h * 0.15, 1.2, 0.9, 4, c);   // (small tall tufts: wide flat ones read as umbrellas)
      blob(g, br[0], br[1], br[2], h * 0.13, 1.1, 0.9, 4, vary(c, A, 0.1));
      blob(g, (m[0] + t[0]) / 2 + (t[0] - m[0]) * 0.2, (m[1] + t[1]) / 2, (m[2] + t[2]) / 2 + (t[2] - m[2]) * 0.2, h * 0.12, 1.1, 0.9, 4, vary(c, A, 0.1));
      if (n > 2) blob(g, (m[0] + br[0]) / 2, (m[1] + br[1]) / 2 + h * 0.04, (m[2] + br[2]) / 2, h * 0.11, 1.1, 0.9, 4, vary(c, A, 0.1));
    };
    let n = 0;
    grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
      if (!G.on[tj * G.ntx + ti]) continue;
      const xa = G.x0 + ti * L, za = G.z0 + tj * L;
      for (let zz = za; zz < za + L - 0.01; zz += step) for (let xx = xa; xx < xa + L - 0.01; xx += step) {
        const x = xx + (R() - 0.5) * step * 0.9, z = zz + (R() - 0.5) * step * 0.9, r1 = R(), r2 = R();
        const hd = pkTG(P.td, x, z); if (hd > 205) continue;
        const y = pkGround(x, z), tl = pkTreeline(x, z); if (y > tl + 12) continue;
        const lx = (x - P.lk.x) / P.lk.rx, lz = (z - P.lk.z) / P.lk.rz; if (lx * lx + lz * lz < 1.3) continue;   // not in the reservoir
        let p = (0.35 + 0.6 * sstep(0.3, 0.62, P.n3(x * 1.3 + 100, z * 1.3))) * sstep(tl + 12, tl - 22, y);
        if (hd > 110) p *= 0.65;   // thinner far from the road (rarely in view)
        if (r1 > p) continue;
        const nn = pkNear(x, z); if (nn.i >= 0 && nn.dd < 3) continue;
        if (nn.i >= 0 && nn.dd < 8 && r2 < 0.2) continue;
        if (excluded(x, z) || pkSlope(x, z) > 0.95) continue;
        const hk = lerp(1, 0.45, sstep(tl - 45, tl + 8, y));   // stunted towards the treeline
        const h = (7.5 + R() * 6) * hk, col = vary(pineCs[Math.floor(R() * pineCs.length)], R, 0.14), far = hd > 140 ? 3 : hd > 80 ? 2 : nn.i < 0 || nn.dd > 30 ? 1 : 0, g = far > 1 ? flat(x, z) : scen.get(x, z);   // (beyond 80 m its shadow cannot reach the road's surroundings)
        const yp = far > 1 ? pkGroundS(x, z) : y;   // (on the far tiles' coarser mesh)
        const gv = grove(x, z), pa = y < 150 && y < tl - 35 ? (gv > 0.56 ? lerp(0.5, 0.82, sstep(0.56, 0.7, gv)) : 0.03) * sstep(150, 135, y) : 0;
        const pb = y > tl - 30 ? 0.5 * sstep(tl - 30, tl - 18, y) : 0, q = A();
        if (q < pa || q > 1 - pb) { R(); R(); R(); R();   // (the draws pkPine would have made)
          if (q < pa) aspen(g, x, yp, z, h * (0.62 + A() * 0.2), far); else bristle(g, x, yp, z, h * (0.75 + A() * 0.3)); }
        else {   // mixed conifers (own stream S): Douglas fir low down, Engelmann spruce and limber pine higher up, grey snags here and there, krummholz at the treeline
          const u = S(), rel = y - tl + 8 * P.n2(x * 2.3, z * 2.3), sp = rel > -10 ? (u < 0.08 ? 4 : u < 0.2 ? 1 : 5) : u < 0.05 ? 4 : y < 120 ? (u < 0.5 ? 2 : u < 0.78 ? 1 : u < 0.9 ? 3 : 0) : u < 0.52 ? 1 : u < 0.76 ? 3 : u < 0.88 ? 2 : 0;
          const hs = (sp === 3 ? 0.82 : 1) * (S() < 0.14 ? 0.55 + S() * 0.2 : 1);   // (some young ones)
          pkPine(g, x, yp, z, h * hs, sp === 1 || sp === 2 || sp === 0 ? col : vary(col, S, 0.12), R, far, sp); }
        if (++n >= maxT) break grid;
      }
    }
    // a few bristlecones scattered just above the treeline on the rocky slopes beside the road
    for (let s = 20; s < T.len - 20; s += 6) for (const side of [-1, 1]) {
      const i = T.idx(s), tl0 = pkTreeline(T.px[i], T.pz[i]); if (T.hy[i] < tl0 - 25 || T.hy[i] > tl0 + 60 || A() > 0.3) continue;
      const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 3 + Math.pow(A(), 1.4) * 38), x = T.px[i] + T.nx[i] * o + (A() - 0.5) * 4, z = T.pz[i] + T.nz[i] * o + (A() - 0.5) * 4;
      const y = pkGround(x, z), tl = pkTreeline(x, z); if (y < tl - 6 || y > tl + 35 - Math.abs(y - T.hy[i]) * 0.5) continue;
      if (pkNear(x, z).dd < 3 || excluded(x, z) || pkSlope(x, z) > 0.95) continue;
      bristle(scen.get(x, z), x, y, z, 2.6 + A() * 2.4); n++;
    }
    return n;
  }

  /* ---- real-course landmarks: the Halfway Picnic Grounds, the Glen Cove Inn, the Bottomless Pit overlook ----
     (K: the build's shared bits, see buildPikes; own random stream, so the rest of the scenery stays where it was) */
  function pkLandmarks(K) {
    const R = rng(9101), { scen, excl, sStart } = K, gy = pkGround, tb = K.txt(), W1 = [1, 1, 1], PI = Math.PI;
    const wood = [0.47, 0.32, 0.19], woodD = [0.31, 0.21, 0.13], stone = [0.55, 0.52, 0.48], stoneT = [0.6, 0.57, 0.52], gravC = [0.33, 0.3, 0.26];
    const carC = [[0.86, 0.86, 0.87], [0.55, 0.13, 0.11], [0.17, 0.25, 0.43], [0.29, 0.31, 0.3], [0.7, 0.62, 0.45], [0.2, 0.37, 0.31]];
    // local frame beyond the barrier at road s on 'side' (interpolated between the samples): at(u, v) -> [x, z], u along the road, v out from the barrier line;
    // dir(a): unit direction a rad from the road's heading towards +v, rot(a): the box rotation that lines a box's length up with it, P(u, v, y): a 3D point
    const fr = (s, side) => { const q = crAt(s), bar = side > 0 ? q.br : q.bl, tx = q.tx, tz = q.tz, ox = q.nx * side, oz = q.nz * side, x0 = q.px + ox * bar, z0 = q.pz + oz * bar;
      const dir = (a) => [tx * Math.cos(a || 0) + ox * Math.sin(a || 0), tz * Math.cos(a || 0) + oz * Math.sin(a || 0)], at = (u, v) => [x0 + tx * u + ox * v, z0 + tz * u + oz * v];
      return { at, dir, rot: (a) => { const d = dir(a); return Math.atan2(d[1], d[0]); }, P: (u, v, y) => { const p = at(u, v); return [p[0], y, p[1]]; } }; };
    const lowest = (F, u, v, a, b) => { let m = 1e9; for (const [p, q] of [[-a, -b], [a, -b], [a, b], [-a, b], [0, 0]]) { const [x, z] = F.at(u + p, v + q); m = Math.min(m, gy(x, z)); } return m; };   // lowest ground under a footprint (half sizes a along u, b along v)
    const clear = (F, u, v, a, b) => { for (const [p, q] of [[-a, -b], [a, -b], [a, b], [-a, b], [0, -b], [0, b], [-a, 0], [a, 0], [0, 0]]) { const [x, z] = F.at(u + p, v + q); if (pkNear(x, z).dd < 1.5 || K.excluded(x, z)) return false; } return true; };   // off the road and clear of the other scenery
    const bx = (F, u, v, y, su, sy, sv, col, top, a) => { const [x, z] = F.at(u, v); box(scen.get(x, z), x, y, z, su, sy, sv, F.rot(a), col, top, true); };   // box in the frame (su along the direction a, bottom at y), in its own chunk
    const quad = (a, b, c, d, col, inn) => scen.get(a[0], a[2]).quadO(a, b, c, d, col, inn);
    const ex = (F, u, v, r) => { const [x, z] = F.at(u, v); excl.push({ x, z, r }); };   // trees and later crowds keep off
    const guy = (F, u, v, a, y) => { const [x, z] = F.at(u, v), [fx, fz] = F.dir(a); crowdPut(K.CR, x, y == null ? gy(x, z) : y, z, fx, fz, { col: K.fans[Math.floor(R() * K.fans.length)] }, 1); };   // a visitor facing a
    const car = (F, u, v, a) => { const [x, z] = F.at(u, v); K.carPk(x, z, F.rot(a), vary(carC[Math.floor(R() * carC.length)], R, 0.15)); };
    const gravel = (side, s0, s1, v0, v1, col) => {   // gravel pull-out laid on the ground (2 m grid, 6 cm up); its outer ring takes the ground's own colour, so the edge fades out
      const nu = Math.max(2, Math.round((s1 - s0) / 2)), nv = Math.max(2, Math.round((v1 - v0) / 2)), V = [];
      for (let b = 0; b <= nv; b++) for (let a = 0; a <= nu; a++) { const [x, z] = fr(s0 + (s1 - s0) * a / nu, side).at(0, v0 + (v1 - v0) * b / nv), k = 0.93 + R() * 0.12, gc = pkGCol(x, z);
        V.push([[x, gy(x, z) + 0.06, z], a && b && a < nu && b < nv ? [col[0] * k, col[1] * k, col[2] * k] : [gc[0] * pkGMean, gc[1] * pkGMean, gc[2] * pkGMean]]); }
      for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) { const p = V[b * (nu + 1) + a], q = V[b * (nu + 1) + a + 1], r = V[(b + 1) * (nu + 1) + a + 1], d = V[(b + 1) * (nu + 1) + a];
        K.noShadow(p[0][0], p[0][2]).quadUp(p[0], q[0], r[0], d[0], [p[1], q[1], r[1], d[1]]); }
    };
    const tq = (cx, cy, cz, fx, fz, W, H, r, tilt, rb) => {   // text board (bottom centre cx, cy, cz) facing (fx, fz), its top leaning back by tilt; r: atlas rect [x0, y0, x1, y1] (px) of the front, rb: of the back (else the front again, readable from behind)
      const ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), ux = fz, uz = -fx, kx = -fx * H * sa, ky = H * ca, kz = -fz * H * sa;
      for (const f of [1, -1]) { const q = f > 0 || !rb ? r : rb, u0 = q[0] / 1024, u1 = q[2] / 1024, v1 = 1 - q[1] / 1024, v0 = 1 - q[3] / 1024, hw = W / 2 * f, ox = fx * ca * 0.03 * f, oy = sa * 0.03 * f, oz = fz * ca * 0.03 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        tb.quadO(A, B, C, D, W1, [cx + kx / 2 - fx * ca * f, cy + ky / 2 - sa * f, cz + kz / 2 - fz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const sign = (F, u, v, a, W, H, r) => {   // brown sign facing a (rad from the road's heading; pi + ~0.35: the arriving cars, turned a little towards the road), leaning back so the high cameras read it; a short post under its bottom edge and a tall one behind its top edge at each end
      const [x, z] = F.at(u, v), [fx, fz] = F.dir(a), y = lowest(F, u, v, W / 2, 0.6), g = scen.get(x, z), tl = 0.6, h0 = 0.75, lx = H * Math.sin(tl) + 0.08, pc = [0.3, 0.2, 0.12];
      for (const o of [-W * 0.38, W * 0.38]) { const px = x + fz * o, pz = z - fx * o; box(g, px - fx * 0.08, y - 0.3, pz - fz * 0.08, 0.14, h0 + 0.3, 0.14, Math.atan2(fz, fx), pc, null, true); box(g, px - fx * lx, y - 0.3, pz - fz * lx, 0.14, h0 + H * Math.cos(tl) + 0.36, 0.14, Math.atan2(fz, fx), pc, null, true); }
      tq(x, y + h0, z, fx, fz, W, H, r, tl); ex(F, u, v, W / 2 + 1.5);
    };
    const table = (F, u, v, a, y) => {   // wooden picnic table: top, two benches, two legs and a bench bearer at each end (2 m long; a: its heading from the road's)
      y = y == null ? lowest(F, u, v, 1, 0.8) - 0.04 : y; const ca = Math.cos(a), sa = Math.sin(a), P = (p, q) => [u + p * ca - q * sa, v + p * sa + q * ca], c = vary(wood, R, 0.12);   // p along the table, q across
      bx(F, u, v, y + 0.7, 2.0, 0.07, 0.78, c, [c[0] * 1.15, c[1] * 1.15, c[2] * 1.12], a);
      for (const q of [-0.66, 0.66]) { const [pu, pv] = P(0, q); bx(F, pu, pv, y + 0.42, 2.0, 0.05, 0.3, c, null, a); }
      for (const p of [-0.72, 0.72]) { let [pu, pv] = P(p, 0); bx(F, pu, pv, y + 0.34, 0.08, 0.07, 1.62, woodD, null, a); for (const q of [-0.36, 0.36]) { [pu, pv] = P(p, q); bx(F, pu, pv, y, 0.08, 0.72, 0.09, woodD, null, a); } }
    };
    const pine = (F, u, v, h) => { const [x, z] = F.at(u, v); pkPine(scen.get(x, z), x, gy(x, z), z, h, vary([0.1, 0.22, 0.12], R, 0.14), R); };

    /* Halfway Picnic Grounds (in the pines, on the flatter side): the entry sign, a gravel pull-out with parked cars, picnic tables and grills, an open shelter */
    {
      const s0 = sStart + 1000, fl = (sd) => { const p = K.onSide(s0, sd, 14); return Math.abs(gy(p[0], p[1]) - T.hy[p[2]]); }, side = fl(1) <= fl(-1) ? 1 : -1, at = (d) => fr(s0 + d, side);
      sign(at(-30), 0, 3.1, PI + 0.35, 4.4, 1.1, [0, 0, 1024, 256]);
      gravel(side, s0 - 26, s0 - 4, 1.6, 8.4, gravC);
      for (const d of [-20.5, -17.3, -12.8]) { const F = at(d); if (clear(F, 0, 4.4, 1.1, 2.3)) car(F, 0, 4.4, PI / 2 + (R() - 0.5) * 0.12); }
      for (const [d, v, a] of [[2.5, 3.6, 0.25], [7.5, 6.9, -0.2], [0.4, 9.6, 0.1], [12.2, 3.3, -0.35], [-6, 12.2, 0.45]]) { const F = at(d); if (clear(F, 0, v, 1.3, 1.3)) table(F, 0, v, a); }
      for (const [d, v] of [[5.2, 2.3], [-2.6, 6.8]]) { const F = at(d), [x, z] = F.at(0, v), y = gy(x, z), g = scen.get(x, z); box(g, x, y - 0.1, z, 0.1, 0.92, 0.1, F.rot(), [0.2, 0.2, 0.21]); box(g, x, y + 0.8, z, 0.62, 0.16, 0.44, F.rot(0.4), [0.12, 0.12, 0.13]); }   // pedestal grills
      { const F = at(-8); bx(F, 0, 2.3, gy(...F.at(0, 2.3)) - 0.1, 0.85, 1.15, 0.7, [0.24, 0.31, 0.25], [0.3, 0.37, 0.31]); }   // bear-proof bin
      { const F = at(19), vs = 6.4;   // open shelter: concrete slab, six posts, eave beams, a shingle gable roof over two tables
        if (clear(F, 0, vs, 4.2, 2.9)) { const y = lowest(F, 0, vs, 3.7, 2.4), L = 7, D = 4.4, H = 2.45, [x, z] = F.at(0, vs);
          bx(F, 0, vs, y - 0.2, L + 0.5, 0.36, D + 0.5, [0.6, 0.59, 0.56]);
          for (const p of [-L / 2, 0, L / 2]) for (const q of [-D / 2, D / 2]) bx(F, p, vs + q, y + 0.1, 0.2, H, 0.2, wood);
          for (const q of [-D / 2, D / 2]) bx(F, 0, vs + q, y + H, L + 0.5, 0.24, 0.26, woodD);
          gable(scen.get(x, z), x, y + H + 0.22, z, L + 1.1, D + 1.4, 1.5, F.rot(), [0.27, 0.2, 0.15], wood);
          table(F, -1.7, vs, PI / 2, y + 0.16); table(F, 1.7, vs, PI / 2, y + 0.16); ex(F, 0, vs, 6.5); } }
      for (const [d, v, h] of [[-9, 15.5, 11], [5.5, 14, 12.5], [11.5, 13.5, 10], [28.5, 12, 11.5], [-25, 13, 9.5], [-14, 12.2, 8]]) pine(at(d), 0, v, h);
      guy(at(3.4), 0, 5.0, -PI / 2 + 0.4); guy(at(1.6), 0, 2.2, PI / 2); guy(at(-15.1), 0, 2.4, PI / 2 + 0.6); guy(at(17.6), 0, 5.1, 0.3); guy(at(20.5), 0, 7.4, PI + 0.2); guy(at(8.8), 0, 5.3, PI);
      ex(at(0), 0, 7, 18); ex(at(-14), 0, 5, 13);
    }

    /* Glen Cove Inn, on the outside of the hairpin just below the treeline (the mountain rises behind it, the car braking for the hairpin looks straight at it):
       a log lodge on a stone base, a green metal roof, a covered porch facing the road, a stone chimney, its sign; the gravel car park along the exit */
    const hp = T.corners.find(c => c.sev >= 3 && Math.abs((c.i0 + c.i1) / 2 * T.ds - sStart - 2681) < 40);
    if (hp) {
      const sm = (hp.i0 + hp.i1) / 2 * T.ds, side = -hp.dir, F = fr(sm, side), P = F.P, at = (d) => fr(sm + d, side), L = 13, D = 8, vF = 4.9, vc = vF + D / 2, [cx, cz] = F.at(0, vc);
      if (clear(F, 0, 7.7, L / 2 + 1.2, 5.6)) {
        const yf = Math.max(...[[-L / 2, vF - 2.8], [L / 2, vF - 2.8], [-L / 2, vF], [L / 2, vF]].map(([u, v]) => gy(...F.at(u, v)))) + 0.45, yb = lowest(F, 0, vc - 1.4, L / 2 + 1, D / 2 + 1.4) - 0.3;
        const logA = [0.5, 0.33, 0.19], logB = [0.43, 0.28, 0.16], y0 = yf + 3.42, h = 2.7, ov = 0.75, rfA = [0.2, 0.38, 0.28], rfB = [0.17, 0.33, 0.24], stC = [0.52, 0.5, 0.47], trim = [0.84, 0.79, 0.66], glass = [0.16, 0.2, 0.25];
        bx(F, 0, vc, yb, L + 0.5, yf - yb + 0.08, D + 0.5, stone, stoneT);   // stone base (dug into the slope at the back)
        bx(F, 0, vc, yf, L - 0.1, 3.2, D - 0.1, [0.74, 0.68, 0.56]);   // chinking between the logs
        for (let k = 0; k < 8; k++) { const y = yf + 0.06 + k * 0.4, c = k % 2 ? logA : logB;   // log walls: the side walls' logs half a log lower, all crossing at the corners
          for (const q of [-1, 1]) { bx(F, 0, vc + q * D / 2, y, L + 0.8, 0.34, 0.3, c); bx(F, q * L / 2, vc, y - 0.2, 0.3, 0.34, D + 0.8, vary(c, R, 0.06)); } }
        // green metal roof: sheets in two shades (the seams), closed gable ends
        const n = Math.round((L + 2 * ov) / 0.75), kk = h / (D / 2), ye = y0 - ov * kk, inn = P(0, vc, y0);
        for (let q = 0; q < n; q++) { const a = -L / 2 - ov + (L + 2 * ov) * q / n, b = -L / 2 - ov + (L + 2 * ov) * (q + 1) / n, c = q % 2 ? rfA : rfB;
          for (const sg of [-1, 1]) quad(P(a, vc + sg * (D / 2 + ov), ye), P(b, vc + sg * (D / 2 + ov), ye), P(b, vc, y0 + h), P(a, vc, y0 + h), c, inn); }
        for (const sg of [-1, 1]) scen.get(cx, cz).triO(P(sg * L / 2, vc - D / 2, y0 - 0.25), P(sg * L / 2, vc + D / 2, y0 - 0.25), P(sg * L / 2, vc, y0 + h - 0.06), logB, inn);
        // porch: stone-sided deck, posts, a railing, a lean-to roof under the eaves
        bx(F, 0, vF - 1.4, yb, L - 0.4, yf - yb, 2.8, stone, [0.52, 0.38, 0.24]);
        for (let k = 0; k < 5; k++) bx(F, -L / 2 + 0.5 + k * (L - 1) / 4, vF - 2.6, yf, 0.22, 2.3, 0.22, wood);
        for (const k of [0, 3]) bx(F, -L / 2 + 0.5 + (k + 0.5) * (L - 1) / 4, vF - 2.6, yf + 0.86, (L - 1) / 4, 0.09, 0.09, woodD);
        quad(P(-L / 2 - 0.1, vF - 2.95, yf + 2.3), P(L / 2 + 0.1, vF - 2.95, yf + 2.3), P(L / 2 + 0.1, vF, yf + 2.95), P(-L / 2 - 0.1, vF, yf + 2.95), rfA, P(0, vF - 1.4, yf));
        bx(F, 0, vF - 2.6, yf + 2.08, L - 0.5, 0.22, 0.2, woodD);
        // windows and the door on the front, a window in the far gable
        for (const u of [-4.7, -2.3, 2.3, 4.7]) { bx(F, u, vF - 0.17, yf + 0.75, 1.4, 1.25, 0.08, trim); bx(F, u, vF - 0.21, yf + 0.87, 1.1, 1.0, 0.06, glass); }
        bx(F, 0, vF - 0.17, yf, 1.4, 2.25, 0.08, trim); bx(F, 0, vF - 0.21, yf, 1.05, 2.05, 0.06, [0.36, 0.2, 0.12]);
        bx(F, -L / 2 - 0.17, vc, yf + 0.9, 0.08, 1.2, 1.3, trim); bx(F, -L / 2 - 0.21, vc, yf + 1.0, 0.06, 1.0, 1.05, glass);
        // stone chimney at the near gable end, up through the eaves
        bx(F, L / 2 + 0.6, vc, yb, 1.1, yf + 2.4 - yb, 2.0, stC, stC); bx(F, L / 2 + 0.52, vc, yf + 2.4, 0.84, y0 + h + 0.9 - yf - 2.4, 1.2, stC); bx(F, L / 2 + 0.52, vc, y0 + h + 0.9, 1.0, 0.14, 1.36, [0.3, 0.29, 0.28]);
        K.CR.block(cx, cz, L + 1.2, D + 0.8, F.rot());   // (no spectator inside)
        guy(F, -3.4, vF - 1.3, -PI / 2 + 0.3, yf); guy(F, 3.1, vF - 1.6, -PI / 2 - 0.5, yf); guy(F, 1.2, vF - 2.3, -PI / 2 + 0.2, yf);
        if (clear(F, -9.6, 2.2, 2.6, 0.5)) sign(F, -9.6, 2.2, -PI / 2 - 0.3, 4.4, 1.1, [0, 256, 1024, 512]);   // facing the cars braking for the hairpin
        ex(F, 0, vc - 1.2, 12);
      }
      // the car park along the exit, where the mountain is still flat enough
      gravel(side, sm + 29, sm + 63, 2.5, 8.8, gravC);
      for (const d of [34, 37.2, 40.4, 46.6, 49.8, 56]) { const Fc = at(d); if (clear(Fc, 0, 4.9, 1.1, 2.3)) car(Fc, 0, 4.9, PI / 2 + (R() - 0.5) * 0.12); }
      guy(at(43.6), 0, 3.0, -0.4); guy(at(44.2), 0, 4.2, -0.6); guy(at(31), 0, 5.5, PI - 0.3);
      ex(at(38), 0, 5, 9.5); ex(at(54), 0, 5, 9.5);
    }

    /* the Bottomless Pit overlook on the ridge, on the side where the ground falls away: a gravel pull-out, a low dry-stone wall along its edge,
       a coin telescope, an interpretive board, visitors looking out over the drop */
    {
      const s0 = sStart + 4462, lo = (sd) => { const p = K.onSide(sStart + 4466, sd, 20); return gy(p[0], p[1]) - T.hy[p[2]]; }, side = lo(1) <= lo(-1) ? 1 : -1, at = (d) => fr(s0 + d, side), wc = [0.56, 0.5, 0.46];
      gravel(side, s0 - 17, s0 + 15, 1.6, 6.8, [0.5, 0.45, 0.4]);
      for (let d = -15; d < 13;) { const l = 0.85 + R() * 0.5, F = at(d + l / 2), y = lowest(F, 0, 7.0, l / 2, 0.32);   // the wall: big blocks, then a course of smaller ones on top
        bx(F, 0, 7.0, y - 0.3, l, 0.72 + R() * 0.08, 0.66, vary(wc, R, 0.2), null, (R() - 0.5) * 0.08); d += l + 0.03; }
      for (let d = -14.7; d < 12.6;) { const l = 0.5 + R() * 0.45, F = at(d + l / 2), y = lowest(F, 0, 7.0, l / 2, 0.25);
        bx(F, 0, 7.0 + (R() - 0.5) * 0.08, y + 0.4, l, 0.24 + R() * 0.1, 0.5, vary(wc, R, 0.22), null, (R() - 0.5) * 0.2); d += l + 0.06 + R() * 0.1; }
      { const F = at(2.5), [x, z] = F.at(0, 5.9), y = gy(x, z), r = F.rot(PI / 2), [fx, fz] = F.dir(PI / 2), g = scen.get(x, z);   // coin telescope on a post, looking out
        box(g, x, y - 0.2, z, 0.7, 0.32, 0.7, r, [0.6, 0.6, 0.58]); cyl(g, x, y + 0.1, z, 0.07, 1.0, 6, [0.22, 0.3, 0.28]);
        box(g, x, y + 1.06, z, 0.6, 0.34, 0.38, r, [0.16, 0.5, 0.42], [0.2, 0.56, 0.47], false); box(g, x - fx * 0.34, y + 1.12, z - fz * 0.34, 0.1, 0.22, 0.42, r, [0.08, 0.08, 0.09]);
        box(g, x + fx * 0.33, y + 1.1, z + fz * 0.33, 0.08, 0.26, 0.34, r, [0.1, 0.12, 0.14]); }
      { const F = at(-3.5), [x, z] = F.at(0, 5.2), y = gy(x, z), [fx, fz] = F.dir(-PI / 2), g = scen.get(x, z);   // interpretive board on a stone plinth, a lectern read from the pull-out
        box(g, x - fx * 0.45, y - 0.3, z - fz * 0.45, 0.9, 0.7, 2.7, F.rot(PI / 2), stone, stoneT);
        for (const o of [-0.8, 0.8]) box(g, x + fz * o - fx * 0.45, y + 0.3, z - fx * o - fz * 0.45, 0.12, 0.84, 0.12, 0, woodD);
        tq(x, y + 0.8, z, fx, fz, 2.4, 1.2, [0, 512, 512, 768], 0.85, [512, 512, 1024, 640]); }
      for (const d of [-12.5, -7]) { const F = at(d); if (clear(F, 0, 3.7, 2.3, 1.1)) car(F, 0, 3.7, (R() - 0.5) * 0.06); }   // parked along the wall
      guy(at(5), 0, 6.1, PI / 2); guy(at(6.3), 0, 6.0, PI / 2 + 0.35); guy(at(9.4), 0, 6.1, PI / 2 - 0.2); guy(at(2.5), 0, 5.2, PI / 2); guy(at(-3.3), 0, 4.4, PI / 2);
      // the near side (the barrier there is ~10 m from the road centre, in the chase camera's view): the name board at a gravel strip just beyond the
      // barrier, a second coin telescope aimed across the road into the pit, visitors looking over (own random stream: the rest of the scenery keeps its rolls)
      { const R2 = rng(9111), ns = -side, an = (d) => fr(s0 + d, ns), a0 = s0 - 14, a1 = s0 + 12, v0 = 1.6, v1 = 4.6, nu = Math.round((a1 - a0) / 2), nv = 3, V = [], gc0 = [0.5, 0.45, 0.4];
        for (let b = 0; b <= nv; b++) for (let a = 0; a <= nu; a++) { const [x, z] = fr(a0 + (a1 - a0) * a / nu, ns).at(0, v0 + (v1 - v0) * b / nv), k = 0.93 + R2() * 0.12, gc = pkGCol(x, z);   // (as gravel(): the outer ring fades out)
          V.push([[x, gy(x, z) + 0.06, z], a && b && a < nu && b < nv ? [gc0[0] * k, gc0[1] * k, gc0[2] * k] : [gc[0] * pkGMean, gc[1] * pkGMean, gc[2] * pkGMean]]); }
        for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) { const p = V[b * (nu + 1) + a], q = V[b * (nu + 1) + a + 1], r = V[(b + 1) * (nu + 1) + a + 1], d = V[(b + 1) * (nu + 1) + a];
          K.noShadow(p[0][0], p[0][2]).quadUp(p[0], q[0], r[0], d[0], [p[1], q[1], r[1], d[1]]); }
        sign(an(-17), 0, 3.0, PI + 0.35, 4.4, 1.1, [512, 640, 1024, 768]);   // its name, facing the arriving cars
        { const F = an(1), [x, z] = F.at(0, 3.0), y = gy(x, z), r = F.rot(-PI / 2), [fx, fz] = F.dir(-PI / 2), g = scen.get(x, z);   // coin telescope aimed across the road
          box(g, x, y - 0.2, z, 0.7, 0.32, 0.7, r, [0.6, 0.6, 0.58]); cyl(g, x, y + 0.1, z, 0.07, 1.0, 6, [0.22, 0.3, 0.28]);
          box(g, x, y + 1.06, z, 0.6, 0.34, 0.38, r, [0.16, 0.5, 0.42], [0.2, 0.56, 0.47], false); box(g, x - fx * 0.34, y + 1.12, z - fz * 0.34, 0.1, 0.22, 0.42, r, [0.08, 0.08, 0.09]);
          box(g, x + fx * 0.33, y + 1.1, z + fz * 0.33, 0.08, 0.26, 0.34, r, [0.1, 0.12, 0.14]); }
        { const F = an(-6), [x, z] = F.at(0, 4.2), y = gy(x, z) - 0.1, g = scen.get(x, z), c = vary(wood, R2, 0.1);   // a bench facing the pit
          box(g, x, y + 0.42, z, 1.8, 0.07, 0.42, F.rot(), c, [c[0] * 1.15, c[1] * 1.15, c[2] * 1.12]); for (const o of [-0.7, 0.7]) { const [px, pz] = F.at(o, 4.2); box(g, px, y, pz, 0.08, 0.44, 0.38, F.rot(), woodD); } }
        for (const [d, v, a] of [[2.6, 2.6, -PI / 2 + 0.2], [3.4, 3.4, -PI / 2 - 0.3], [-2.2, 2.4, -PI / 2 + 0.5], [-6.4, 3.2, -PI / 2], [-5.6, 3.5, -PI / 2 + 0.25], [7.5, 2.8, -PI / 2 - 0.4]]) {
          const F = an(d), [x, z] = F.at(0, v); if (pkNear(x, z).dd < 1.5) continue; const [fx, fz] = F.dir(a); crowdPut(K.CR, x, gy(x, z), z, fx, fz, { col: K.fans[Math.floor(R2() * K.fans.length)] }, 1); }
        ex(an(-1), 0, 3.2, 14.5); }
      ex(at(0), 0, 4, 17);
    }

    /* a small brown sign at the Devil's Playground (on the side where it stands closer to the road) */
    { const s0 = sStart + 4044, i = T.idx(s0), side = T.bl[i] <= T.br[i] ? -1 : 1; sign(fr(s0, side), 0, 3.1, PI + 0.35, 4.4, 1.1, [0, 768, 1024, 1024]); }

    /* the text boards: one canvas atlas (4 rows of 1024 x 256), one mesh */
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const c2 = cv.getContext('2d'), cream = '#efe3c6';
    const txt = (s, x, y, px, col, w) => { c2.fillStyle = col; c2.font = '700 ' + px + 'px Georgia, "Times New Roman", serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(s, x, y, w); };
    const plank = (x0, y0, w, h, col) => { c2.fillStyle = col; c2.fillRect(x0, y0, w, h); c2.strokeStyle = 'rgba(0,0,0,0.13)'; c2.lineWidth = 3;   // wood with a little grain
      for (let k = 0; k < 14; k++) { const y = y0 + R() * h; c2.beginPath(); c2.moveTo(x0, y); c2.bezierCurveTo(x0 + w * 0.3, y + (R() - 0.5) * 12, x0 + w * 0.7, y + (R() - 0.5) * 12, x0 + w, y + (R() - 0.5) * 8); c2.stroke(); } };
    const board = (y0) => { plank(0, y0, 1024, 256, '#5b3b21'); c2.strokeStyle = cream; c2.lineWidth = 10; c2.strokeRect(16, y0 + 16, 992, 224); };
    const ft = (m) => String(Math.round(m * 3.28084)).replace(/\B(?=(\d{3})+(?!\d))/g, ','), alt = (d) => Math.round(T.altAt ? T.altAt(T.hy[T.idx(sStart + d)]) : 0);
    board(0); c2.fillStyle = cream;   // HALFWAY PICNIC GROUNDS, with a picnic table pictogram
    c2.fillRect(62, 96, 150, 16); c2.fillRect(48, 140, 178, 12); for (const [a, b] of [[88, 150], [186, 124]]) { c2.beginPath(); c2.moveTo(a, 110); c2.lineTo(a + 12, 110); c2.lineTo(b + 12, 196); c2.lineTo(b, 196); c2.fill(); }
    txt('HALFWAY', 612, 96, 118, cream, 740); txt('PICNIC GROUNDS', 612, 186, 70, cream, 740);
    board(256); txt('GLEN COVE', 512, 256 + 104, 130, cream, 930); txt('INN  ·  GIFTS  ·  SNACKS', 512, 256 + 196, 50, cream, 860);
    plank(0, 512, 512, 256, '#3c2a1a'); c2.fillStyle = '#e8dcc0'; c2.fillRect(18, 530, 476, 220); c2.fillStyle = '#2f4a3a'; c2.fillRect(18, 530, 476, 60); txt('BOTTOMLESS PIT', 256, 562, 42, cream, 440);   // interpretive board
    c2.fillStyle = '#9cc2dc'; c2.fillRect(34, 604, 200, 130); c2.fillStyle = '#8a6a55'; c2.beginPath(); c2.moveTo(34, 734); c2.lineTo(34, 640); c2.lineTo(92, 626); c2.lineTo(118, 648); c2.lineTo(130, 724); c2.lineTo(150, 728); c2.lineTo(168, 650); c2.lineTo(234, 612); c2.lineTo(234, 734); c2.fill();
    c2.fillStyle = '#5d5048'; for (let k = 0; k < 6; k++) c2.fillRect(252, 612 + k * 18, k === 5 ? 120 : 220 - (k % 2) * 30, 8);
    txt(alt(4466) + ' m', 360, 730, 30, '#2f4a3a', 220);
    plank(512, 512, 512, 128, '#4a3220');   // the back of the interpretive board
    plank(512, 640, 512, 128, '#5b3b21'); c2.strokeStyle = cream; c2.lineWidth = 6; c2.strokeRect(520, 648, 496, 112); txt('BOTTOMLESS PIT', 768, 690, 58, cream, 470); txt('OVERLOOK  ·  ' + alt(4466) + ' m', 768, 738, 28, cream, 440);
    board(768); txt("DEVIL'S PLAYGROUND", 512, 768 + 100, 92, cream, 950); txt('ELEV. ' + ft(alt(4050)) + ' FT  ·  ' + alt(4050) + ' m', 512, 768 + 194, 48, cream, 860);
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; K.out.ownTex.push(tx);
    tb.addTo(new THREE.MeshLambertMaterial({ map: tx }));
  }

  /* ---- the cog railway at the summit: the station beside the summit house, a train at the platform, the track down the east face ----
     (own random stream) */
  function pkCog(K) {
    const R = rng(9202), { scen, excl, sFin } = K, ic = T.idx(sFin + 62), hd = T.hd[ic] + Math.PI, tx = Math.cos(hd), tz = Math.sin(hd), nx = -tz, nz = tx, o = T.br[ic] + 3.8;
    // station frame: on the outside of the last bend, straight along the road's heading there (in view ahead while the cars brake); u runs down the line
    // (from the buffer stop by the car park towards the south), v to its right (towards the road); the platform is on the far side
    const at = (u, v) => [T.px[ic] + T.nx[ic] * o + tx * u + nx * v, T.pz[ic] + T.nz[ic] * o + tz * u + nz * v];
    const uB = -17, uP0 = -16.5, uP1 = 17, kS = uP1 - uB + 3;   // buffer stop, platform ends, the last level sample of the line
    // the line (1 m steps): straight and level through the station, then steered down the east face past the summit sign, parallel to the road
    // below it and slowly drifting away (in view while the cars climb the last straight); it ends where it would meet the road or another landmark
    const X = [], Z = [], Hd = [], sp = K.CR.sp;
    const blocked = (x, z) => { if (pkNear(x, z).dd < 1.5) return true;   // the road, a hard exclusion (huts, pads, car parks; crowd areas only where somebody stands), a spectator
      for (const e of excl) if (!K.crSoft.has(e) && (x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true;
      const cx = Math.floor(x / 0.8), cz = Math.floor(z / 0.8);
      for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { const L = sp.get((cx + a) + ',' + (cz + b)); if (L) for (let q = 0; q < L.length; q += 2) if ((x - L[q]) ** 2 + (z - L[q + 1]) ** 2 < 4) return true; }
      return false; };
    { let [x, z] = at(uB, 0), h = hd;
      for (let d = 0; d <= 150; d++) { const ex = -Math.sin(h) * 1.8, ez = Math.cos(h) * 1.8;
        if (d > kS && [0, 1, -1].some(a => blocked(x + ex * a, z + ez * a))) break;
        X.push(x); Z.push(z); Hd.push(h); if (d > kS) { const q = pkNear(x, z), j = T.idx(q.i * T.ds - 12), L = 27 + 0.12 * (d - kS), a = Math.atan2(T.pz[j] + T.nz[j] * L - z, T.px[j] + T.nx[j] * L - x);
          h += clamp(Math.atan2(Math.sin(a - h), Math.cos(a - h)), -1 / 30, 1 / 30); }
        x += Math.cos(h); z += Math.sin(h); } }
    // its height: level through the station, then the ground under the rails smoothed from above: dips are bridged, humps followed
    const n = X.length, gC = new Float32Array(n), gM = new Float32Array(n), Y = new Float32Array(n);
    for (let k = 0; k < n; k++) { const ex = -Math.sin(Hd[k]) * 0.6, ez = Math.cos(Hd[k]) * 0.6; gC[k] = pkGround(X[k], Z[k]); gM[k] = Math.max(gC[k], pkGround(X[k] + ex, Z[k] + ez), pkGround(X[k] - ex, Z[k] - ez)); }
    const avg = (A, k, W) => { let s = 0, c = 0; W = Math.min(W, n - 1 - k); for (let j = k - W; j <= k + W; j++) { s += A[j]; c++; } return s / c; };
    let lev = -1e9; for (let k = 0; k <= kS; k++) lev = Math.max(lev, gM[k] + 0.22);
    for (let k = 0; k < n; k++) Y[k] = k <= kS ? lev : gM[k] + 0.22;
    for (let pass = 0; pass < 14; pass++) { const Y2 = Y.slice(); for (let k = kS + 1; k < n; k++) Y[k] = Math.max(avg(Y2, k, 4), gM[k] + 0.22); }
    const yR = lev + 0.3, yP = yR + 0.4;   // rail top, platform top

    /* ---- the track: ballast on a low embankment, sleepers, two running rails and the raised rack rail between them ---- */
    const Pt = (k, o, y) => [X[k] - Math.sin(Hd[k]) * o, Y[k] + y, Z[k] + Math.cos(Hd[k]) * o];
    const bal = [0.5, 0.48, 0.46], emb = [0.56, 0.41, 0.33], tieC = [0.34, 0.28, 0.23], railC = [0.4, 0.39, 0.38], railT = [0.74, 0.74, 0.76], rackC = [0.28, 0.28, 0.3];
    const foot = (k, sd) => { const p = Pt(k, sd * (1.3 + 1.4 * Math.max(0.35, Y[k] - gC[k])), 0); p[1] = pkGround(p[0], p[2]) - 0.3; return p; };
    for (let k = 0; k + 1 < n; k += 2) { const j = Math.min(n - 1, k + 2), g = scen.get(X[k], Z[k]), a0 = Pt(k, -1.3, 0), a1 = Pt(k, 1.3, 0), b0 = Pt(j, -1.3, 0), b1 = Pt(j, 1.3, 0), inn = Pt(k + 1, 0, -2);
      const ec = vary(emb, R, 0.06); g.quadO(a0, a1, b1, b0, bal, inn); g.quadO(a0, b0, foot(j, -1), foot(k, -1), ec, inn); g.quadO(a1, foot(k, 1), foot(j, 1), b1, ec, inn);
      for (const [o, hw, y0, y1, c, ct] of [[-0.5, 0.05, 0.14, 0.3, railC, railT], [0.5, 0.05, 0.14, 0.3, railC, railT], [0, 0.09, 0.12, 0.4, rackC, railC]]) {
        const ri = Pt(k + 1, o, y0);
        g.quadO(Pt(k, o - hw, y1), Pt(k, o + hw, y1), Pt(j, o + hw, y1), Pt(j, o - hw, y1), ct, ri);
        for (const sd of [-1, 1]) g.quadO(Pt(k, o + sd * hw, y0), Pt(j, o + sd * hw, y0), Pt(j, o + sd * hw, y1), Pt(k, o + sd * hw, y1), c, ri); } }
    for (let k = 0; k < n; k++) { const g = scen.get(X[k], Z[k]), c = vary(tieC, R, 0.2), ca = Math.cos(Hd[k]) * 0.12, sa = Math.sin(Hd[k]) * 0.12, inn = Pt(k, 0, -0.5);   // sleepers (top and long sides)
      const q = (a, o, y) => { const p = Pt(k, o, y); return [p[0] + ca * a, p[1], p[2] + sa * a]; };
      g.quadO(q(-1, -1.05, 0.14), q(1, -1.05, 0.14), q(1, 1.05, 0.14), q(-1, 1.05, 0.14), c, inn); for (const a of [-1, 1]) g.quadO(q(a, -1.05, -0.03), q(a, 1.05, -0.03), q(a, 1.05, 0.14), q(a, -1.05, 0.14), c, inn); }

    /* ---- the station: a raised concrete platform beside the track, a slim canopy on posts, benches, steps up at the top end, a buffer stop ---- */
    const box2 = (u, v, y, su, sy, sv, col, colTop) => { const [x, z] = at(u, v); box(scen.get(x, z), x, y, z, su, sy, sv, hd, col, colTop, true); };   // a box in the station frame (u, v: centre; y: bottom)
    const gLow = (u0, u1, v0, v1) => { let m = 1e9; for (let u = u0; u <= u1 + 0.01; u += (u1 - u0) / 6) for (const v of [v0, (v0 + v1) / 2, v1]) { const [x, z] = at(u, v); m = Math.min(m, pkGround(x, z)); } return m - 0.3; };
    const conc = [0.62, 0.61, 0.58], concT = [0.76, 0.75, 0.72], steel = [0.3, 0.32, 0.34], uc = (uP0 + uP1) / 2, yb = gLow(uP0 - 2, uP1, -5.8, -1.65), uC0 = uB + 3, uC1 = uB + 31;
    box2(uc, -3.72, yb, uP1 - uP0, yP - yb, 4.15, conc, concT); box2(uc, -1.97, yP, uP1 - uP0 - 0.3, 0.02, 0.3, [0.95, 0.78, 0.15]);   // the slab, a yellow line along its edge
    for (let q = 0; q < 8; q++) { const h = yP - 0.25 * (q + 1); if (h > yb + 0.1) box2(uP0 - 0.2 - 0.4 * q, -3.75, yb, 0.4, h - yb, 3.4, conc, concT); }   // steps down at the top end
    for (let u = uP0 + 0.2; u <= uP1 - 0.1; u += 2.4) box2(u, -5.7, yP, 0.07, 1.05, 0.07, steel); box2(uc, -5.7, yP + 1.0, uP1 - uP0 - 0.3, 0.07, 0.08, steel);   // railing on the far side
    for (let u = uC0 + 0.6; u < uC1; u += 6.8) box2(u, -4.9, yP, 0.2, 3.5, 0.2, [0.2, 0.26, 0.24]);
    { const [x, z] = at((uC0 + uC1) / 2, -3.95); box2((uC0 + uC1) / 2, -3.95, yP + 3.42, uC1 - uC0, 0.14, 4.3, [0.2, 0.26, 0.24]); gable(scen.get(x, z), x, yP + 3.56, z, uC1 - uC0, 4.3, 0.4, hd, [0.24, 0.38, 0.31], [0.2, 0.26, 0.24]); }   // canopy: a low green roof
    for (let u = uC0 + 4; u < uC1 - 2; u += 6.8) box2(u, -5.1, yP, 1.8, 0.45, 0.45, [0.42, 0.3, 0.2]);   // benches
    for (let q = 0; q < 9; q++) { const [x, z] = at(uC0 + 1 + R() * (uC1 - uC0 - 2), -2.4 - R() * 2); crowdPut(K.CR, x, yP, z, nx, nz, { col: K.fans[Math.floor(R() * K.fans.length)] }, 1); }   // passengers on the platform, watching the cars
    { const yb2 = gLow(uB - 2, uB - 0.3, -1.5, 1.5); box2(uB - 1.3, 0, yb2, 1.4, yR + 0.3 - yb2, 3, conc, concT); box2(uB - 0.5, 0, yR - 0.2, 0.3, 1.1, 2.4, [0.86, 0.14, 0.1], [0.95, 0.95, 0.92]); }   // buffer stop

    /* ---- the train: two red railcars with a white window band, sloped cab ends, roof boxes (no pantograph: diesel) ---- */
    const red = [0.8, 0.13, 0.1], wht = [0.94, 0.93, 0.9], win = [0.12, 0.15, 0.2], roofC = [0.62, 0.14, 0.12], dark = [0.13, 0.13, 0.14];
    const car = (u0, dir) => {   // a 15 m railcar centred at u0, its cab (sloped end) towards dir
      const L = 7.5, F = (a, y, b) => { const [x, z] = at(u0 + a * dir, b); return [x, yR + y, z]; }, g = scen.get(...at(u0, 0));
      const layer = (poly, bw, col) => {   // a side profile (a, y) extruded across the car
        const ca = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length, inn = F(ca, cy, 0);
        for (const b of [-bw, bw]) for (let q = 1; q + 1 < poly.length; q++) g.triO(F(poly[0][0], poly[0][1], b), F(poly[q][0], poly[q][1], b), F(poly[q + 1][0], poly[q + 1][1], b), col, inn);
        for (let q = 0; q < poly.length; q++) { const p0 = poly[q], p1 = poly[(q + 1) % poly.length]; g.quadO(F(p0[0], p0[1], -bw), F(p1[0], p1[1], -bw), F(p1[0], p1[1], bw), F(p0[0], p0[1], bw), col, inn); }
      };
      layer([[-L, 0.95], [L - 0.15, 0.95], [L, 1.25], [L, 1.95], [-L, 1.95]], 1.35, red);
      layer([[-L, 1.95], [L, 1.95], [L - 0.5, 2.95], [-L, 2.95]], 1.35, wht);
      layer([[-L, 2.95], [L - 0.5, 2.95], [L - 0.75, 3.3], [-L, 3.3]], 1.35, red);
      layer([[-L + 0.1, 3.3], [L - 0.75, 3.3], [L - 1.0, 3.45], [-L + 0.1, 3.45]], 1.22, roofC);
      const inn = F(0, 2, 0);
      for (const b of [-1.37, 1.37]) for (let a = -L + 0.5; a < L - 1.5; a += 1.55) g.quadO(F(a, 2.1, b), F(a + 1.2, 2.1, b), F(a + 1.2, 2.8, b), F(a, 2.8, b), win, inn);   // side windows
      g.quadO(F(L - 0.05, 2.07, -1.1), F(L - 0.05, 2.07, 1.1), F(L - 0.44, 2.85, 1.1), F(L - 0.44, 2.85, -1.1), win, inn);   // windscreen
      for (const b of [-0.85, 0.85]) g.quadO(F(L + 0.02, 1.4, b - 0.14), F(L + 0.02, 1.4, b + 0.14), F(L + 0.02, 1.62, b + 0.14), F(L + 0.02, 1.62, b - 0.14), [1, 0.96, 0.78], inn);   // headlights
      for (const a of [-4.8, 4.8]) { const p = F(a, -0.08, 0); box(g, p[0], p[1], p[2], 2.8, 0.85, 2.0, hd, dark, null, true); }   // bogies
      { const p = F(0, 0.65, 0); box(g, p[0], p[1], p[2], 2 * L - 0.8, 0.32, 2.4, hd, [0.22, 0.22, 0.24], null, true); }
      for (const a of [-3.4, 2.2]) { const p = F(a, 3.42, 0); box(g, p[0], p[1], p[2], 2.4, 0.36, 1.5, hd, [0.46, 0.48, 0.5], [0.6, 0.62, 0.64], true); }   // roof boxes
      { const p = F(-0.6, 3.42, 0.55); box(g, p[0], p[1], p[2], 0.25, 0.55, 0.25, hd, dark, null, true); }   // exhaust
    };
    car(uB + 8.7, -1); car(uB + 24.3, 1);
    { const [x, z] = at(uB + 16.5, 0); box(scen.get(x, z), x, yR + 1.0, z, 0.7, 2.0, 1.7, hd, dark, null, true); }   // gangway between the cars

    /* ---- the station's name board hung under the lower end of the canopy, both faces (its own small canvas: one extra mesh) ---- */
    { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d'), cream = '#efe3c8', grn = '#1f4034';
      x.fillStyle = grn; x.fillRect(0, 0, 512, 128); x.strokeStyle = cream; x.lineWidth = 6; x.strokeRect(8, 8, 496, 112);
      x.fillStyle = cream; x.font = '900 74px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SUMMIT', 256, 68, 320);
      for (const gx of [62, 450]) { x.beginPath(); for (let k = 0; k < 48; k++) { const a = (k + 0.5) / 48 * TAU, r = k % 4 < 2 ? 36 : 27; x.lineTo(gx + Math.cos(a) * r, 64 + Math.sin(a) * r); }   // cog wheels
        x.closePath(); x.fill(); x.fillStyle = grn; x.beginPath(); x.arc(gx, 64, 11, 0, TAU); x.fill(); x.fillStyle = cream; }
      const t = new THREE.CanvasTexture(c); t.anisotropy = 4; K.out.ownTex.push(t);
      const gb = new GB(true), W1 = [1, 1, 1], ub = uC1 - 0.25, y0 = yP + 2.45, y1 = yP + 3.35, ym = (y0 + y1) / 2;
      for (const f of [-1, 1]) { const [ax, az] = at(ub + f * 0.05, -3.75 + 2 * f), [bx, bz] = at(ub + f * 0.05, -3.75 - 2 * f), [ix, iz] = at(ub - f, -3.75);   // (the text reads left to right from either side)
        gb.quadO([ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], W1, [ix, ym, iz], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
      const m = new THREE.Mesh(gb.geometry(), new THREE.MeshLambertMaterial({ map: t })); m.matrixAutoUpdate = false; m.receiveShadow = true; K.root.add(m);
      box2(ub, -3.75, y0 - 0.06, 0.08, y1 - y0 + 0.12, 4.12, dark); for (const v of [-2.3, -5.2]) box2(ub, v, y1, 0.05, 0.16, 0.05, dark); }

    /* ---- keep the trees, boulders and later crowds off it ---- */
    for (let u = uB - 3; u <= uP1 + 3; u += 6) { const [x, z] = at(u, -2.5); excl.push({ x, z, r: 6.5 }); }
    for (let k = kS; k < n; k += 5) excl.push({ x: X[k], z: Z[k], r: 3 + 1.4 * Math.max(0.35, Y[k] - gC[k]) });
  }

  /* ---- race day: marshal posts with flags at the corners, safety and recovery vehicles, photographers, sponsor banners,
     mile markers and altitude boards (own random stream; text boards on this build's own texture) */
  function pkRaceOps(K) {
    const R = rng(9303), { scen, excl, excluded, onSide, sStart, sFin } = K, gy = pkGround, tg = K.txt(), W1 = [1, 1, 1];
    // own text atlas (1024 x 1024): six sponsor banners 512 x 128 (rows 0-383), mile posts MILE 8-19 128 x 160 (384-703), five altitude boards 341 x 160 (704-1023)
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const cx = cv.getContext('2d');
    const txt = (s, x, y, px, col, w, it) => { cx.fillStyle = col; cx.font = (it ? 'italic ' : '') + '900 ' + px + 'px Arial, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(s, x, y, w); };
    const rect = (x, y, w, h, col) => { cx.fillStyle = col; cx.fillRect(x, y, w, h); };
    const poly = (x, y, pts, col) => { cx.fillStyle = col; cx.beginPath(); pts.forEach(([a, b], k) => k ? cx.lineTo(x + a, y + b) : cx.moveTo(x + a, y + b)); cx.fill(); };
    const ring = (x, y, r, lw, col) => { cx.strokeStyle = col; cx.lineWidth = lw; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.stroke(); };
    const logos = [   // fictional brands: background, a small emblem on the left, the name
      (x, y) => { rect(x, y, 512, 128, '#121316'); for (let k = 0; k < 3; k++) poly(x + k * 26, y, [[18, 104], [40, 24], [54, 24], [32, 104]], '#e02a1f'); rect(x + 110, y + 104, 380, 8, '#e02a1f'); txt('REAL ROADS ATLAS', x + 300, y + 62, 46, '#fff', 390, 1); },
      (x, y) => { rect(x, y, 512, 128, '#f2c230'); poly(x, y, [[12, 106], [62, 20], [112, 106]], '#13306b'); poly(x, y, [[47, 46], [62, 20], [77, 46], [62, 38]], '#fff'); txt('SUMMIT OIL', x + 316, y + 68, 74, '#13306b', 370); },
      (x, y) => { rect(x, y, 512, 128, '#1b2f6e'); rect(x, y + 6, 512, 10, '#f2c230'); rect(x, y + 112, 512, 10, '#f2c230'); ring(x + 62, y + 64, 29, 20, '#0c0c0e'); ring(x + 62, y + 64, 12, 6, '#9aa0a8'); txt('ROCKY TYRES', x + 306, y + 66, 68, '#fff', 380); },
      (x, y) => { rect(x, y, 512, 128, '#1f8f3a'); poly(x, y, [[74, 10], [30, 72], [58, 72], [42, 120], [94, 50], [66, 50], [88, 10]], '#f5e23a'); txt('HIGH ALT', x + 300, y + 44, 54, '#fff', 380); txt('ENERGY', x + 300, y + 96, 48, '#f5e23a', 380); },
      (x, y) => { rect(x, y, 512, 128, '#4a2c1a'); rect(x + 26, y + 44, 58, 62, '#f0dcb4'); cx.strokeStyle = '#f0dcb4'; cx.lineWidth = 9; cx.beginPath(); cx.arc(x + 86, y + 74, 15, -1.4, 1.4); cx.stroke(); rect(x + 20, y + 106, 70, 8, '#f0dcb4'); txt('14ER COFFEE', x + 306, y + 68, 70, '#f0dcb4', 380); },
      (x, y) => { rect(x, y, 512, 128, '#f4f4f2'); rect(x, y, 512, 10, '#d8261e'); rect(x, y + 118, 512, 10, '#d8261e'); ring(x + 62, y + 70, 32, 9, '#d8261e'); rect(x + 55, y + 22, 14, 14, '#d8261e'); rect(x + 58, y + 46, 8, 26, '#111'); txt('PEAK TIMING', x + 306, y + 68, 68, '#111', 380); },
    ];
    logos.forEach((f, k) => f((k % 2) * 512, Math.floor(k / 2) * 128));
    for (let k = 0; k < 12; k++) { const x = (k % 8) * 128, y = 384 + Math.floor(k / 8) * 160;   // green highway mile posts
      rect(x, y, 128, 160, '#1d6b3c'); cx.strokeStyle = '#fff'; cx.lineWidth = 6; cx.strokeRect(x + 9, y + 9, 110, 142); txt('MILE', x + 64, y + 40, 34, '#fff', 100); txt(String(k + 8), x + 64, y + 104, 84, '#fff', 104); }
    const ALT = [10000, 11000, 12000, 13000, 14000];
    ALT.forEach((ft, k) => { const x = (k % 3) * 341, y = 704 + Math.floor(k / 3) * 160;   // brown National Forest style elevation boards, routed cream letters
      rect(x, y, 341, 160, '#6a4526'); cx.strokeStyle = '#efe0bf'; cx.lineWidth = 6; cx.strokeRect(x + 10, y + 10, 321, 140); txt('ELEV ' + ft / 1000 + ',000 FT', x + 170, y + 60, 52, '#efe0bf', 296); rect(x + 60, y + 92, 221, 4, '#efe0bf'); txt(Math.round(ft * 0.3048) + ' m', x + 170, y + 122, 40, '#efe0bf', 280); });
    const tt = new THREE.CanvasTexture(cv); tt.anisotropy = 4; K.out.ownTex.push(tt);
    const q = (x, y, w, h) => [(x + 2) / 1024, 1 - (y + h - 2) / 1024, (x + w - 2) / 1024, 1 - (y + 2) / 1024];   // atlas cell -> [u0, v0, u1, v1]

    // text board: bottom centre (bx, by, bz) facing (fx, fz), W x H, the top leaning back by tilt; the text quad on the atlas mesh, a plain back in the scenery; -> the board's centre
    const board = (bx, by, bz, fx, fz, W, H, tilt, uv, back) => {
      const ux = fz, uz = -fx, ca = Math.cos(tilt), sa = Math.sin(tilt), kx = -fx * sa * H, ky = ca * H, kz = -fz * sa * H, hw = W / 2, nX = fx * ca, nY = sa, nZ = fz * ca;
      const A = [bx - ux * hw, by, bz - uz * hw], B = [bx + ux * hw, by, bz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz], m = [bx + kx / 2, by + ky / 2, bz + kz / 2];
      tg.quadO(A, B, C, D, W1, [m[0] - nX, m[1] - nY, m[2] - nZ], [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]]);
      const sh = (p) => [p[0] - nX * 0.04, p[1] - nY * 0.04, p[2] - nZ * 0.04];
      scen.get(bx, bz).quadO(sh(A), sh(B), sh(C), sh(D), back, [m[0] + nX, m[1] + nY, m[2] + nZ]);
      return m;
    };
    const beam = (g, a, b, r, col) => {   // square rod from a to b (flag poles, the boom, monopods)
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
      let px = -dz, pz = dx, pl = Math.hypot(px, pz); if (pl < 1e-4) { px = 1; pz = 0; pl = 1; } px *= r / pl; pz *= r / pl;
      const ex = dy * pz / L, ey = (dz * px - dx * pz) / L, ez = -dy * px / L, cs = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      const rg = (p) => cs.map(([u, v]) => [p[0] + px * u + ex * v, p[1] + ey * v, p[2] + pz * u + ez * v]), P0 = rg(a), P1 = rg(b), inn = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      for (let k = 0; k < 4; k++) g.quadO(P0[k], P0[(k + 1) % 4], P1[(k + 1) % 4], P1[k], col, inn);
    };
    // footprint L (along the road) x W (across) centred at (x, z), sample i: all of it beyond the barrier (dd >= 1.5), free, not steep, not far below or above the road -> [lowest, highest ground]
    const fit = (x, z, i, L, W, dh) => { const tx = T.tx[i], tz = T.tz[i]; let lo = 1e9, hi = -1e9;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const px = x + tx * a * L / 2 - tz * b * W / 2, pz = z + tz * a * L / 2 + tx * b * W / 2;
        if (pkNear(px, pz).dd < 1.5 || excluded(px, pz)) return null; const h = gy(px, pz); lo = Math.min(lo, h); hi = Math.max(hi, h); }
      return hi - lo < dh && lo > T.hy[i] - 2.5 && hi < T.hy[i] + 3 ? [lo, hi] : null; };
    const spot = (s0, sides, es, L, W, span, dh) => {   // the first footprint that fits near s0: slides along the road, tries the sides (the nearer barrier first: in view) and the distances beyond the barrier (+1.5 m) in turn
      const i0 = T.idx(s0), sd = sides.slice().sort((a, b) => (a > 0 ? T.br[i0] : T.bl[i0]) - (b > 0 ? T.br[i0] : T.bl[i0]));
      for (let d = 0; d <= span; d += 2) for (const sg of d ? [-1, 1] : [1]) for (const side of sd) for (const e of es) {
        const s = s0 + d * sg, [x, z, i] = onSide(s, side, 1.5 + e + W / 2), f = fit(x, z, i, L, W, dh); if (f) return { x, z, i, s, side, lo: f[0], hi: f[1], nx: T.nx[i] * side, nz: T.nz[i] * side, tx: T.tx[i], tz: T.tz[i] }; }
      return null; };
    const spotN = (s0, sides, es, L, W, span, dh) => {   // the footprint nearest the road centre within s0 +- span (the barrier is 10.5-18 m out: the portrait chase camera sees ~12 m to each side), the nearer s wins a tie
      let b = null, bs = 1e9;
      for (let d = 0; d <= span; d += 2) for (const sg of d ? [-1, 1] : [1]) for (const side of sides) for (const e of es) {
        const s = s0 + d * sg, i = T.idx(s), sc = (side > 0 ? T.br[i] : T.bl[i]) + e + d * 0.012; if (sc >= bs) continue;
        const [x, z, j] = onSide(s, side, 1.5 + e + W / 2), f = fit(x, z, j, L, W, dh); if (!f) continue;
        bs = sc; b = { x, z, i: j, s, side, lo: f[0], hi: f[1], nx: T.nx[j] * side, nz: T.nz[j] * side, tx: T.tx[j], tz: T.tz[j] }; }
      return b; };
    const nrm = (a, b) => { const l = Math.hypot(a, b) || 1; return [a / l, b / l]; };
    const info = { posts: [], veh: [], ph: [] };   // (where things went, for the tests and the screenshot tools)

    const ORG = [1, 0.46, 0.08], LIME = [0.8, 0.96, 0.18], YEL = [1, 0.86, 0.1], RED = [0.84, 0.1, 0.08], WHT = [0.95, 0.95, 0.94], DARK = [0.14, 0.14, 0.16], GLASS = [0.16, 0.2, 0.26], TYRE = [0.08, 0.08, 0.09];
    const flags = [], lamps = [], own = [];   // the waving flags (arm + pole + cloth, one instanced mesh), the vehicles' flashing lamps (one instanced mesh), the crews' spots (spectator figures)
    // a race-day worker facing (fx, fz), in the spectators' own proportions and palettes (crowdGeo: 1.72 m, legs to 0.84 m, a broad shirt, a big head, the arms
    // at the shoulders; skin, trousers and hair hashed from the spot) with a reflective band round the shirt (vest: its colour): o.wave (a marshal: his right arm
    // and the flag are the animated instance), o.cam (kneeling photographer, a camera with a long white lens on a monopod), o.hat (a cap), o.y (on a platform)
    const SKIN = [[0.96, 0.78, 0.63], [0.86, 0.63, 0.47], [0.66, 0.45, 0.31], [0.42, 0.29, 0.2]], PANTS = [[0.19, 0.27, 0.44], [0.1, 0.1, 0.12], [0.5, 0.44, 0.33], [0.33, 0.34, 0.37]];
    const HAIR = [[0.1, 0.08, 0.06], [0.3, 0.19, 0.11], [0.68, 0.52, 0.28], [0.56, 0.55, 0.53]], SOLE = [0.12, 0.1, 0.09], BAND = [0.86, 0.87, 0.82], LENS = [0.88, 0.88, 0.86];
    const man = (x, z, fx, fz, vest, o) => {
      o = o || {}; const g = scen.get(x, z), y = o.y != null ? o.y : gy(x, z) - 0.04, h = (k) => crH(x, z, 40 + k), s = h(1), sc = 0.92 + 0.16 * h(4), sy = 0.94 + 0.12 * h(5), kc = 0.9 + 0.2 * h(6);
      const skin = SKIN[s < 0.42 ? 0 : s < 0.72 ? 1 : s < 0.9 ? 2 : 3], pants = PANTS[Math.floor(h(2) * 4)], hair = o.hat || HAIR[Math.floor(h(3) * 4)], shirt = [vest[0] * kc, vest[1] * kc, vest[2] * kc];
      const P = (a, b, c) => [x + (fx * a - fz * b) * sc, y + c * sy, z + (fz * a + fx * b) * sc];   // a forwards, b to his right, c up
      const cub = (a0, a1, b0, b1, c0, c1, cF, cB, cS, cT, cD) => { const inn = P((a0 + a1) / 2, (b0 + b1) / 2, (c0 + c1) / 2);   // a box in that frame; colours: front, back, sides, top, bottom (null: left out)
        if (cF) g.quadO(P(a1, b0, c0), P(a1, b1, c0), P(a1, b1, c1), P(a1, b0, c1), cF, inn); if (cB) g.quadO(P(a0, b0, c0), P(a0, b1, c0), P(a0, b1, c1), P(a0, b0, c1), cB, inn);
        if (cS) for (const b of [b0, b1]) g.quadO(P(a0, b, c0), P(a1, b, c0), P(a1, b, c1), P(a0, b, c1), cS, inn);
        if (cT) g.quadO(P(a0, b0, c1), P(a1, b0, c1), P(a1, b1, c1), P(a0, b1, c1), cT, inn); if (cD) g.quadO(P(a0, b0, c0), P(a1, b0, c0), P(a1, b1, c0), P(a0, b1, c0), cD, inn); };
      const head = (c) => cub(-0.12, 0.12, -0.11, 0.11, c, c + 0.26, skin, hair, skin, hair, null);   // face and ears; hair (or the cap) on top and at the back
      if (o.cam) {   // kneeling on the left knee, the right foot forwards, the camera at his eye on a monopod
        cub(-0.55, -0.08, -0.17, 0, 0, 0.14, pants, pants, pants, pants, null); cub(-0.1, 0.08, -0.17, 0, 0.06, 0.5, pants, pants, pants, null, null);   // left shin on the ground, thigh up
        cub(0.26, 0.44, 0, 0.17, 0, 0.5, pants, pants, pants, pants, SOLE); cub(-0.06, 0.44, 0, 0.17, 0.34, 0.5, pants, pants, pants, pants, null);   // right shin up, thigh forwards
        cub(-0.13, 0.13, -0.22, 0.22, 0.48, 1.06, shirt, shirt, shirt, shirt, null); cub(-0.135, 0.135, -0.225, 0.225, 0.72, 0.78, BAND, BAND, BAND, null, null); head(1.08);
        beam(g, P(0, 0.27, 1.0), P(0.2, 0.1, 1.12), 0.05, shirt); beam(g, P(0, -0.27, 1.0), P(0.46, -0.04, 1.1), 0.05, shirt);   // the arms up to the camera and under the lens
        cub(0.13, 0.3, -0.09, 0.09, 1.1, 1.27, DARK, DARK, DARK, DARK, DARK); cub(0.3, 0.86, -0.06, 0.06, 1.13, 1.25, LENS, null, LENS, [0.94, 0.94, 0.92], LENS); cub(0.86, 0.9, -0.065, 0.065, 1.12, 1.26, DARK, null, DARK, DARK, null);
        beam(g, P(0.55, 0, 1.13), P(0.62, 0, 0), 0.02, DARK); return;
      }
      cub(-0.11, 0.11, -0.17, 0.17, 0, 0.84, pants, pants, pants, null, SOLE);   // legs
      cub(-0.13, 0.13, -0.22, 0.22, 0.84, 1.42, shirt, shirt, shirt, shirt, null); cub(-0.135, 0.135, -0.225, 0.225, 1.1, 1.16, BAND, BAND, BAND, null, null); head(1.44);
      for (const b of o.wave ? [-1] : [-1, 1]) cub(-0.06, 0.06, b > 0 ? 0.22 : -0.32, b > 0 ? 0.32 : -0.22, 0.8, 1.4, shirt, shirt, shirt, null, skin);   // the arms, the hand at the end
      if (o.wave) { const p = P(0, 0.27, 1.37); flags.push({ x: p[0], y: p[1], z: p[2], fx, fz, lv: 0, fr: 0, ph: crH(p[0], p[2], 5) * TAU, on: true }); }
    };
    // a crew member by his vehicle: one of the spectators' own figures (instanced) in the crew's colour. crowdPut hashes the pose, the phase and the variant
    // from the spot, so it is nudged (a few cm) until that gives a plain standing figure that does not join the cheering when the car goes by
    const staff = (x, z, fx, fz, col) => {
      for (let q = 0; q < 81; q++) { const qx = x + ((q % 9) - 4) * 0.025, qz = z + (Math.floor(q / 9) - 4) * 0.025, h = (k) => crH(qx, qz, k), sk = h(11);
        if (h(2) < 0.46 || h(3) < 0.05 || pkNear(qx, qz).dd < 1.5) continue;   // (standing, not a kid, off the road)
        const e = h(9) * 0.998 * 6.2832 * 2.713 + ((sk < 0.42 ? 0 : sk < 0.72 ? 1 : sk < 0.9 ? 2 : 3) + 4 * Math.floor(h(10) * 256)) * 0.0171; if (e - Math.floor(e) > 0.25) continue;   // (the shader's cheering test)
        if (crowdPut(K.CR, qx, gy(qx, qz), qz, fx, fz, { col, flag: 0 }, 1)) { own.push(qx, qz); return; } }
    };
    const ext = (g, x, z, hd) => { if (pkNear(x, z).dd < 1.5) return; const y = gy(x, z) - 0.05; cyl(g, x, y, z, 0.11, 0.55, 6, RED, RED); box(g, x, y + 0.55, z, 0.08, 0.12, 0.08, hd, DARK); };   // red extinguisher

    /* marshal posts: every hairpin and every other severity-2 bend, on the spot of the bend where the barrier is nearest the road (the inside, where the car
       passes closest): a raised scaffold platform under a high orange canopy at the hairpins, elsewhere a raised wooden stand with a tall striped pole or a
       high pop-up canopy; marshals in orange wave their yellow flags as the car comes by (pkOpsUpdate); a red extinguisher, a radio mast at the hairpins */
    let n2 = 0;
    for (const c of T.corners) {
      const sm = (c.i0 + c.i1) / 2 * T.ds; if (c.sev < 2 || sm < sStart + 80 || sm > sFin - 60) continue;
      const hp = c.sev >= 3; if (!hp && n2++ % 2) continue;
      const p = spotN((c.s0 + sm) / 2, [c.dir, -c.dir], [0.1, 0.8, 2], 3.2, 2.8, 60, 0.9); if (!p) continue;
      const { nx, nz, tx, tz, i } = p, hd = T.hd[i], g = scen.get(p.x, p.z), [fx, fz] = nrm(-nx * 0.85 - tx * 0.5, -nz * 0.85 - tz * 0.5), bx = p.x + nx * 0.3, bz = p.z + nz * 0.3;
      const P = (a, b) => [bx + tx * a - nx * b, bz + tz * a - nz * b];   // a along the road, b towards it
      info.posts.push([Math.round(p.s), p.side, +Math.hypot(p.x - T.px[i], p.z - T.pz[i]).toFixed(1)]);
      if (hp) {   // scaffold platform: grey tubes, an orange deck edged white, a rail, a ladder at the back, a high canopy over the back half, two marshals
        const deck = p.hi + 1.3, top = deck + 2.4, SC = [0.62, 0.63, 0.66];
        for (const [a, b] of [[1.35, 1.15], [1.35, -1.15], [-1.35, 1.15], [-1.35, -1.15]]) { const [lx, lz] = P(a, b), ly = gy(lx, lz) - 0.15; box(g, lx, ly, lz, 0.08, deck - ly, 0.08, hd, SC, null, true); }
        { const [x, z] = P(0, 0); box(g, x, deck - 0.14, z, 2.9, 0.14, 2.5, hd, WHT, [0.72, 0.5, 0.3], true); box(g, x, deck - 0.9, z, 2.8, 0.06, 2.4, hd, SC, null, true); }
        for (const b of [-1.15]) { const [x, z] = P(0, b); box(g, x, deck + 0.95, z, 2.9, 0.07, 0.07, hd, SC); }
        for (const a of [-1.4, 1.4]) { const [x, z] = P(a, 0); box(g, x, deck + 0.95, z, 0.07, 0.07, 2.4, hd, SC); }
        for (let k = 0; k < 4; k++) { const [x, z] = P(0.6, -1.3); box(g, x, deck - 1.2 + k * 0.32, z, 0.5, 0.05, 0.06, hd, SC, null, true); }   // ladder rungs
        for (const [a, b] of [[1.35, -1.15], [-1.35, -1.15], [1.35, 0.05], [-1.35, 0.05]]) { const [x, z] = P(a, b); box(g, x, deck, z, 0.06, top - deck, 0.06, hd, [0.82, 0.82, 0.84], null, true); }
        { const [x, z] = P(0, -0.55); box(g, x, top - 0.22, z, 3.0, 0.22, 1.5, hd, ORG, WHT, true); const [rx, rz] = P(0, -0.55); box(g, rx, top, rz, 3.0, 0.12, 1.5, hd, ORG, [1, 0.56, 0.18], true); }   // flat orange roof (reads from above)
        { const [x, z] = P(0.9, -0.7); box(g, x, deck, z, 0.9, 0.75, 0.5, hd, [0.9, 0.9, 0.9], null, true); }   // table with the radio
        { const [x, z] = P(-0.5, 0.75); man(x, z, fx, fz, ORG, { wave: 1, y: deck, hat: WHT }); }
        { const [x, z] = P(1.9, 1.2); if (pkNear(x, z).dd >= 1.5) man(x, z, fx, fz, ORG, { hat: ORG, wave: 1 }); }
        { const [mx, mz] = P(-1.35, -1.15), my = deck + 2.4; cyl(g, mx, my, mz, 0.04, 3.4, 4, [0.7, 0.7, 0.72]); box(g, mx, my + 3.4, mz, 0.5, 0.06, 0.06, hd, DARK); }   // radio mast
        { const [x, z] = P(-1.9, 0.9); ext(g, x, z, hd); }
      } else if (n2 % 4 === 1) {   // high pop-up canopy (roof 3.1 m up) behind the marshal, a folding table under it
        const top = p.hi + 3.1;
        for (const [a, b] of [[1.3, 0], [1.3, -2.4], [-1.3, 0], [-1.3, -2.4]]) { const [lx, lz] = P(a, b + 0.8), ly = gy(lx, lz) - 0.15; box(g, lx, ly, lz, 0.07, top - ly, 0.07, hd, [0.82, 0.82, 0.84], null, true); }
        { const [x, z] = P(0, -0.4); box(g, x, top - 0.24, z, 2.7, 0.24, 2.5, hd, ORG, WHT, true); cone(g, x, top, z, 1.84, 0.5, 4, WHT, [0.9, 0.9, 0.9], hd + Math.PI / 4);
          box(g, x, p.lo - 0.1, z, 1.6, p.hi - p.lo + 0.85, 0.6, hd, [0.9, 0.9, 0.9], null, true); }
        { const [x, z] = P(-0.5, 0.95); man(x, z, fx, fz, ORG, { wave: 1 }); }
        { const [x, z] = P(1.6, 0.9); ext(g, x, z, hd); }
      } else {   // raised wooden stand with a rail, the marshal on it; a tall orange and white striped pole with an orange board on top
        const top = p.hi + 1.2, wood = [0.55, 0.38, 0.22], [sx, sz] = P(0, -0.1);
        box(g, sx, p.lo - 0.15, sz, 2.0, top - p.lo + 0.15, 1.6, hd, wood, [0.64, 0.46, 0.28]);
        for (const a of [-0.9, 0.9]) { const [x, z] = P(a, -0.8); box(g, x, top, z, 0.08, 0.95, 0.08, hd, wood); }
        { const [x, z] = P(0, -0.8); box(g, x, top + 0.85, z, 1.8, 0.08, 0.08, hd, wood); }
        { const [x, z] = P(-0.2, 0.3); man(x, z, fx, fz, ORG, { wave: 1, y: top }); }
        { const [x, z] = P(1.3, -0.75), y = gy(x, z) - 0.2; for (let k = 0; k < 6; k++) box(g, x, y + k * 0.9, z, 0.12, 0.9, 0.12, hd, k % 2 ? WHT : ORG, null, true);
          box(g, x, y + 5.4, z, 0.9, 0.62, 0.9, hd, ORG, WHT); box(g, x, y + 6.02, z, 0.5, 0.05, 0.5, hd, ORG); }   // a marker cube: white top, orange cross-square
        { const [x, z] = P(-1.4, 0.6); ext(g, x, z, hd); }
      }
      excl.push({ x: p.x, z: p.z, r: 4.2 });
    }

    /* safety and recovery vehicles, about every 1.2 km on the spot within +-60 m where the barrier is nearest the road: tow truck, ambulance, fire / rescue
       pickup, each with its crew and a light bar whose lamps flash (pkOpsUpdate) */
    [650, 1850, 3050, 4250, 5450].forEach((d, k) => {
      const kind = k % 3, p = spotN(sStart + d, [1, -1], [0.1, 1, 2.5], 9.2, 2.8, 60, 1.0) || spot(sStart + d, [1, -1], [0.1, 1.5, 3.5], 7.4, 3.8, 90, 0.5); if (!p) return;
      const { nx, nz, tx, tz } = p, fl = R() < 0.5 ? 1 : -1, hd = Math.atan2(tz * fl, tx * fl), c = Math.cos(hd), s = Math.sin(hd), vx = p.x + nx * 0.1, vz = p.z + nz * 0.1, y0 = p.hi - p.lo > 0.2 ? p.hi + 0.04 : p.lo - 0.08, g = scen.get(vx, vz);
      const vb = (a, b, h, L, H, W, col, top) => box(g, vx + c * a - s * b, y0 + h, vz + s * a + c * b, L, H, W, hd, col, top, true), V = (a, b, h) => [vx + c * a - s * b, y0 + h, vz + s * a + c * b];
      const crew = (a, b, fx, fz, col) => staff(p.x + tx * a - nx * b, p.z + tz * a - nz * b, fx, fz, col);   // at the vehicle's ends
      const wheels = (as) => { for (const a of as) for (const b of [-0.96, 0.96]) vb(a, b, 0, 0.9, 0.9, 0.3, TYRE); };
      const bar = (a, h, cols) => { vb(a, 0, h, 0.34, 0.1, 1.7, DARK); cols.forEach((cl, q) => { const b = -0.6 + 1.2 * q / Math.max(1, cols.length - 1); lamps.push({ p: V(a, b, h + 0.1), hd, cl, k: q + k }); }); };   // the lamps sit on a dark base
      info.veh.push([Math.round(p.s), p.side, +Math.hypot(p.x - T.px[p.i], p.z - T.pz[p.i]).toFixed(1)]);
      if (p.hi - p.lo > 0.2) box(g, vx, p.lo - 0.3, vz, 7.6, p.hi - p.lo + 0.34, 2.8, hd, [0.42, 0.38, 0.33], [0.52, 0.48, 0.42], true);   // a levelled gravel pad on the slope
      if (kind === 0) {   // tow truck: yellow cab, flat body, a boom over the back with a hook, the wheel lift below
        const Y = [0.96, 0.72, 0.1], GR = [0.42, 0.43, 0.46];
        vb(0, 0, 0.35, 6.8, 0.3, 1.9, DARK); vb(2.85, 0, 0.6, 1.1, 0.75, 2.0, Y); vb(1.6, 0, 0.6, 1.5, 1.55, 2.2, Y); vb(1.62, 0, 1.38, 1.53, 0.56, 2.22, GLASS, Y); bar(1.6, 2.15, [[1, 0.62, 0.08], [1, 0.62, 0.08], [1, 0.62, 0.08]]);
        vb(-1.3, 0, 0.65, 3.6, 0.7, 2.2, Y, GR); vb(-0.3, 0, 1.35, 0.8, 0.5, 0.8, GR); beam(g, V(-0.3, 0, 1.7), V(-3.4, 0, 2.9), 0.15, GR); beam(g, V(-3.4, 0, 2.8), V(-3.45, 0, 1.25), 0.02, DARK);
        vb(-3.45, 0, 1.0, 0.15, 0.25, 0.15, DARK); vb(-3.7, 0, 0.25, 0.7, 0.18, 1.6, DARK); wheels([2.4, -0.9, -2.1]);
        crew(4.2 * fl, 0.4, -nx, -nz, ORG); crew(3.9 * fl, -0.7, -nx + tx * fl, -nz + tz * fl, ORG);
      } else if (kind === 1) {   // ambulance: white box body with a red stripe, red lights, a red cross on the roof
        vb(0, 0, 0.3, 6.2, 0.3, 1.9, DARK); vb(2.6, 0, 0.55, 1.0, 0.8, 2.0, WHT); vb(1.55, 0, 0.55, 1.2, 1.55, 2.05, WHT); vb(1.6, 0, 1.32, 1.23, 0.6, 2.07, GLASS, WHT); vb(1.55, 0, 0.95, 1.22, 0.2, 2.07, RED);
        vb(-1.0, 0, 0.55, 4.0, 2.2, 2.35, WHT); vb(-1.0, 0, 1.05, 4.02, 0.32, 2.37, RED); vb(3.11, 0, 0.9, 0.02, 0.2, 2.0, RED); bar(1.55, 2.1, [[1, 0.12, 0.1], [0.2, 0.4, 1], [1, 0.12, 0.1]]);
        for (const b of [-0.95, 0.95]) lamps.push({ p: V(0.95, b, 2.75), hd, cl: [1, 0.12, 0.1], k: b > 0 ? 1 : 0 }); vb(-1.0, 0, 2.75, 1.5, 0.03, 0.45, RED); vb(-1.0, 0, 2.75, 0.45, 0.03, 1.5, RED); wheels([2.1, -1.9]);
        const cr = [0.18, 0.3, 0.46]; crew(-3.9 * fl, 0.5, -nx, -nz, cr); crew(-4.2 * fl, -0.4, tx * fl, tz * fl, cr);
      } else {   // fire / rescue pickup: red, a white stripe, a light bar, equipment box in the bed
        vb(0, 0, 0.3, 5.4, 0.3, 1.8, DARK); vb(0, 0, 0.5, 5.4, 0.75, 2.0, RED); vb(0.5, 0, 1.25, 2.3, 0.75, 1.9, RED); vb(0.5, 0, 1.3, 2.32, 0.5, 1.92, GLASS, RED);
        vb(0, 0, 0.9, 5.42, 0.12, 2.02, WHT); bar(0.9, 2.0, [[1, 0.12, 0.1], [0.2, 0.4, 1], [1, 0.12, 0.1]]); vb(-1.7, 0, 1.25, 1.6, 0.55, 1.8, [0.88, 0.88, 0.88]); wheels([1.7, -1.7]);
        const tan = [0.78, 0.62, 0.3]; crew(3.5 * fl, 0.4, -nx, -nz, tan); crew(-3.5 * fl, 0.3, -nx - tx * fl, -nz - tz * fl, tan);
      }
      excl.push({ x: p.x, z: p.z, r: 6.8 });   // (no pine over the boom, nobody in the ambulance)
    });

    /* photographers at five of the hairpins: kneeling just beyond the barrier where it is nearest the road, in a hi-vis bib, camera on a monopod */
    { const hps = T.corners.filter(c => { const sm = (c.i0 + c.i1) / 2 * T.ds; return c.sev >= 3 && sm > sStart + 80 && sm < sFin - 60; });
      let n = 0; for (const k of hps.map((c, k) => k).sort((a, b) => a % 2 - b % 2 || a - b)) { if (n >= 5) break;
        const c = hps[k], p = spotN((c.i0 + c.i1) / 2 * T.ds + 4, [c.dir, -c.dir], [0.05, 0.5], 1, 1, 40, 0.6); if (!p) continue;
        const [fx, fz] = nrm(-p.nx + p.tx * 0.3, -p.nz + p.tz * 0.3); man(p.x, p.z, fx, fz, LIME, { cam: 1, hat: DARK }); excl.push({ x: p.x, z: p.z, r: 1.2 }); info.ph.push([Math.round(p.s), p.side, +Math.hypot(p.x - T.px[p.i], p.z - T.pz[p.i]).toFixed(1)]); n++; } }

    /* Pikes Peak Highway mile posts: the race starts at Mile 7, the real course is 19.99 km; small green boards on the right going up, facing the cars */
    for (let m = 8; m <= 19; m++) {
      const p = spot(sStart + (m - 7) * 1609.34 * (sFin - sStart) / 19990, [1], [0.05, 0.6], 1, 1, 24, 0.6); if (!p) continue;
      const [fx, fz] = nrm(-p.tx * 0.7 - p.nx * 0.7, -p.tz * 0.7 - p.nz * 0.7), k = m - 8, g = scen.get(p.x, p.z);
      const mid = board(p.x, p.hi + 1.2, p.z, fx, fz, 1.3, 1.625, 0.55, q((k % 8) * 128, 384 + Math.floor(k / 8) * 160, 128, 160), [0.12, 0.3, 0.18]);
      box(g, mid[0] - fx * 0.08, p.lo - 0.2, mid[2] - fz * 0.08, 0.12, mid[1] - p.lo + 0.2, 0.12, Math.atan2(fz, fx), [0.62, 0.63, 0.66], null, true);
      excl.push({ x: p.x, z: p.z, r: 1.2 });
    }

    /* altitude boards where the course first reaches 10,000 ... 14,000 ft */
    ALT.forEach((ft, k) => {
      let i0 = 0; while (i0 < T.N - 1 && T.altAt(T.hy[i0]) < ft * 0.3048) i0++;
      const p = spot(i0 * T.ds, [1, -1], [0.1, 1.2], 3.4, 4.6, 44, 0.9); if (!p) return;
      const [fx, fz] = nrm(-p.tx * 0.65 - p.nx * 0.76, -p.tz * 0.65 - p.nz * 0.76), g = scen.get(p.x, p.z), ux = fz, uz = -fx, wood = [0.34, 0.22, 0.12];
      const mid = board(p.x, p.hi + 0.9, p.z, fx, fz, 4.2, 1.97, 0.5, q((k % 3) * 341, 704 + Math.floor(k / 3) * 160, 341, 160), [0.36, 0.24, 0.14]);
      for (const o of [-1.5, 1.5]) box(g, mid[0] - fx * 0.1 + ux * o, p.lo - 0.2, mid[2] - fz * 0.1 + uz * o, 0.2, mid[1] - p.lo + 0.2, 0.2, Math.atan2(fz, fx), wood, null, true);
      excl.push({ x: p.x, z: p.z, r: 2.6 });
    });

    /* sponsor banners (fictional brands) on frames just beyond the barrier, facing the road: after the start, around each checkpoint gantry, before the finish */
    const row = (sa, sb, side) => { let b = Math.floor(R() * 6);
      for (let s = sa; s < sb; s += 5.4) { const p = spot(s, [side], [0.05, 0.5], 4.8, 0.8, 0, 0.8); if (!p) continue; b = (b + 1) % 6;
        const g = scen.get(p.x, p.z), mid = board(p.x, p.hi + 0.45, p.z, -p.nx, -p.nz, 4.4, 1.1, 0.6, q((b % 2) * 512, Math.floor(b / 2) * 128, 512, 128), [0.3, 0.3, 0.32]);
        for (const o of [-1.7, 1.7]) box(g, mid[0] + p.nx * 0.07 + p.tx * o, p.lo - 0.2, mid[2] + p.nz * 0.07 + p.tz * o, 0.1, mid[1] - p.lo + 0.2, 0.1, T.hd[p.i], [0.42, 0.43, 0.46], null, true);
        excl.push({ x: p.x, z: p.z, r: 2.5 }); } };
    for (const side of [-1, 1]) { row(sStart + 70, sStart + 150, side); row(sFin - 150, sFin - 44, side); for (const s0 of T.cpS) row(s0 - 50, s0 + 46, side); }

    tg.addTo(new THREE.MeshLambertMaterial({ map: tt }));

    /* the animated parts (pkOpsUpdate): the flags as one instanced mesh (the right arm from the shoulder up, the pole, a two-sided yellow cloth that hangs
       off the pole towards the road; each instance turns about its shoulder), the vehicles' lamps as one instanced box with a colour each; hidden when far */
    const ops = { t: 0, F: flags, L: lamps, fm: null, lm: null, root: K.root, hp: null, info, own };
    // a flag's instance matrix (column-major, at E[o]): the shoulder's frame (x: the marshal's facing, y up, z his right), the arm tilted forwards by phi
    // (0 straight up, -1.7 held out low with the cloth hanging), then swung sideways by th about the facing
    ops.flagM = (E, o, f, th, phi) => { const cp = Math.cos(phi), sp = Math.sin(phi), ct = Math.cos(th), st = Math.sin(th), fx = f.fx, fz = f.fz;
      const M = [[cp, -sp, 0], [ct * sp, ct * cp, -st], [st * sp, st * cp, ct]];
      for (let c = 0; c < 3; c++) { E[o + c * 4] = fx * M[0][c] - fz * M[2][c]; E[o + c * 4 + 1] = M[1][c]; E[o + c * 4 + 2] = fz * M[0][c] + fx * M[2][c]; E[o + c * 4 + 3] = 0; }
      E[o + 12] = f.x; E[o + 13] = f.y; E[o + 14] = f.z; E[o + 15] = 1; };
    ops.hp = T.corners.filter(c => c.sev >= 3).map(c => { const i = T.idx((c.i0 + c.i1) / 2 * T.ds); return { x: T.px[i] + T.nx[i] * c.dir * 4, z: T.pz[i] + T.nz[i] * c.dir * 4, it: null, st: false }; });   // the hairpins' crowds cheer harder (pkOpsUpdate)
    if (flags.length) {
      const gf = new GB(), cl = YEL, cl2 = [0.93, 0.76, 0.06];
      box(gf, 0, -0.03, 0, 0.12, 0.6, 0.1, 0, ORG, [0.86, 0.63, 0.47]);   // the sleeve as the spectators' arms (the hand its end)
      beam(gf, [0.03, 0.4, 0], [0.03, 1.9, 0], 0.02, [0.86, 0.86, 0.88]);
      const A = [0.05, 1.88, 0], B = [1.0, 1.8, 0.14], C = [0.97, 1.16, -0.12], D = [0.05, 1.2, 0], M = [0.5, 1.5, 0];   // the cloth, a little twisted (it reads from above too)
      for (const sd of [-1, 1]) gf.quadO(A, B, C, D, sd > 0 ? cl : cl2, [M[0], M[1], M[2] - sd]);
      const fm = new THREE.InstancedMesh(gf.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }), flags.length);
      fm.frustumCulled = false; fm.matrixAutoUpdate = false; fm.visible = false; fm.name = 'pkFlags'; K.root.add(fm); ops.fm = fm;
      flags.forEach((f, k) => ops.flagM(fm.instanceMatrix.array, k * 16, f, 0, -1.7));
    }
    if (lamps.length) {
      const lm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.2, 0.46), new THREE.MeshBasicMaterial(), lamps.length), m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), c3 = new THREE.Color();
      lamps.forEach((l, k) => { m4.compose(new THREE.Vector3(l.p[0], l.p[1] + 0.08, l.p[2]), qt.setFromAxisAngle(up, -l.hd), new THREE.Vector3(1, 1, 1)); lm.setMatrixAt(k, m4); lm.setColorAt(k, c3.setRGB(l.cl[0] * 0.3, l.cl[1] * 0.3, l.cl[2] * 0.3)); });
      lm.frustumCulled = false; lm.matrixAutoUpdate = false; lm.visible = false; lm.name = 'pkLamps'; K.root.add(lm); ops.lm = lm;
    }
    K.out.dyn.pkOps = ops;
  }

  /* ---- late-June snow: plowed banks behind the barriers high up (own random stream) ---- */
  function pkSnow(K) {
    const R = rng(9404), { scen, excl, crSoft, excluded, sFin } = K, ds = T.ds, lump = valueNoise2(9407, 9), top = [0.98, 1.0, 1.06], back = [0.86, 0.9, 0.99], backF = [0.76, 0.79, 0.86], dirt = [0.6, 0.58, 0.58], foot = [0.44, 0.39, 0.36];
    const busy = (s) => s > sFin - 100 || T.cpS.some(c => Math.abs(s - c) < 30) || T.corners.some(c => c.sev >= 3 && Math.abs(s - (c.i0 + c.i1) / 2 * ds) < 26);   // crowds stand there (placed later)
    const P = (i, o, dy) => { const x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; return [x, pkGround(x, z) + dy, z]; };
    // plowed banks: a lumpy ridge (4 faces per road sample) 0.6 m+ beyond the barrier line, in pieces with gaps, mostly on the uphill side
    const mine = [], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    for (const side of [-1, 1]) {
      let run = 0, gap = R() * 10, prev = null, s0 = 0, len = 0, e = 0, tone = 1;
      for (let s = 20; s < T.len - 20; s += ds) {
        const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], sn = sstep(333, 350, T.hy[i]);
        const up = pkGround(T.px[i] + T.nx[i] * side * (bar + 5), T.pz[i] + T.nz[i] * side * (bar + 5)) > T.hy[i] + 0.1;
        let sec = null;
        if (run > 0) {   // inside a piece: its cross-section here (tapered at both ends, lumpy along)
          const t = (s - s0) / len, env = Math.pow(Math.sin(Math.PI * clamp(t, 0.05, 0.95)), 0.5), b0 = bar + 0.8 + lump(s, side * 7) * 0.4 + R() * 0.15, W = (1.9 + lump(s * 0.7, side * 3 + 20) * 1.3) * (0.55 + 0.45 * env), H = Math.min(W * 0.38, e * env * (0.5 + lump(s * 2.5, side + 40) * 0.6 + R() * 0.3));   // (no steeper than ~40 deg: taller reads as a wall)
          const pts = [P(i, side * b0, -0.2), P(i, side * (b0 + W * (0.18 + R() * 0.08)), H * (0.5 + R() * 0.2)), P(i, side * (b0 + W * (0.42 + R() * 0.12)), H), P(i, side * (b0 + W * (0.72 + R() * 0.08)), H * (0.55 + R() * 0.25)), P(i, side * (b0 + W), -0.25)];
          if (pts.every(p => pkNear(p[0], p[2]).dd >= 0.6) && !excluded(pts[2][0], pts[2][2]) && !busy(s)) sec = pts; else run = 0;
          if (sec) { run -= ds; sec.k = tone * (0.95 + R() * 0.08); if (Math.floor((s - s0) / 8) !== Math.floor((s - s0 - ds) / 8)) mine.push({ x: pts[2][0], z: pts[2][2], r: 3.2 }); }
        } else if (sn > 0 && (gap -= ds) <= 0 && !busy(s) && R() < sn * (up ? 0.95 : 0.35)) { run = len = 8 + R() * 18; s0 = s; e = 0.45 + R() * 0.75; gap = 3 + R() * 10; tone = 0.93 + R() * 0.08; }
        const cs = (k) => [sh(foot, k), sh(dirt, k), sh(top, k), sh(back, k), sh(backF, k)];
        if (sec && prev) {   // road-facing flank dirty grey fading up to white, bright crest, blue-white back
          const g = scen.get(sec[2][0], sec[2][2]), a = cs(prev.k), b = cs(sec.k), inn = [(sec[0][0] + sec[4][0] + prev[0][0] + prev[4][0]) / 4, Math.min(sec[0][1], prev[0][1], sec[4][1], prev[4][1]) - 0.8, (sec[0][2] + sec[4][2] + prev[0][2] + prev[4][2]) / 4];
          for (let k = 0; k < 4; k++) g.quadO(prev[k], sec[k], sec[k + 1], prev[k + 1], a[k], inn, null, [a[k], b[k], b[k + 1], a[k + 1]]);
        } else if (sec && !prev || !sec && prev) {   // end cap: a fan from the crest
          const c = sec || prev, f = sec ? 3 : -3, inn = [(c[0][0] + c[4][0]) / 2 + T.tx[i] * f, (c[0][1] + c[4][1]) / 2, (c[0][2] + c[4][2]) / 2 + T.tz[i] * f], g = scen.get(c[2][0], c[2][2]), q = cs(c.k);   // (inn: a point inside the piece)
          g.triO(c[0], c[1], c[2], q[0], inn, q[1], q[2]); g.triO(c[0], c[2], c[4], q[0], inn, q[2], q[4]); g.triO(c[2], c[3], c[4], q[2], inn, q[3], q[4]);
        }
        prev = sec;
      }
    }
    for (const c of mine) { excl.push(c); crSoft.add(c); }   // (keeps boulders and shrubs off the banks, not the crowds)
    // old dirty drifts lying on in hollows farther out
    for (let s = 20; s < T.len - 20; s += 7) for (const side of [-1, 1]) {
      const i = T.idx(s); if (T.hy[i] < 338 || R() > 0.35) continue;
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 6 + R() * 34), x = T.px[i] + T.nx[i] * o + (R() - 0.5) * 6, z = T.pz[i] + T.nz[i] * o + (R() - 0.5) * 6, y = pkGround(x, z);
      const rim = (pkGround(x + 6, z) + pkGround(x - 6, z) + pkGround(x, z + 6) + pkGround(x, z - 6)) / 4; if (rim < y + 0.25 || pkSlope(x, z) > 0.45 || excluded(x, z)) continue;   // only in a hollow
      const r = 2 + R() * 3.5, n = 7, a0 = R() * TAU, c = vary([0.9, 0.91, 0.96], R, 0.08), cr = vary([0.74, 0.72, 0.72], R, 0.08), ps = [];
      for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU, rr = r * (0.6 + R() * 0.5) * (k % 2 ? 1 : 1.25), px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr; ps.push([px, pkGround(px, pz) + 0.08, pz]); }
      if (ps.some(p => pkNear(p[0], p[2]).dd < 1.5)) continue;
      const mid = [x, y + 0.2 + r * 0.06, z], g = K.noShadow(x, z);   // (flat on the ground: no shadow)
      for (let k = 0; k < n; k++) g.triO(ps[k], ps[(k + 1) % n], mid, cr, [x, y - 5, z], cr, c);
    }
  }

  /* ---- more of the real course: Crystal Reservoir by the start, the toll gate, the old ski lift at the Ski Area hairpin,
     the crowded ladder of the W's, the Summit Visitor Center (own random stream) ---- */
  function pkLandmarks2(K) {
    const R = rng(9551), { scen, excl, sStart } = K, gy = pkGround, tb = K.txt(), W1 = [1, 1, 1], PI = Math.PI;
    const stone = [0.55, 0.51, 0.47], stoneT = [0.6, 0.57, 0.52], wood = [0.47, 0.32, 0.19], woodD = [0.31, 0.21, 0.13], cream = [0.9, 0.86, 0.76];
    // local frame beyond the barrier at road s on 'side' (as in pkLandmarks): at(u, v) -> [x, z], u along the road, v out from the barrier line
    const fr = (s, side) => { const q = crAt(s), bar = side > 0 ? q.br : q.bl, tx = q.tx, tz = q.tz, ox = q.nx * side, oz = q.nz * side, x0 = q.px + ox * bar, z0 = q.pz + oz * bar;
      const dir = (a) => [tx * Math.cos(a || 0) + ox * Math.sin(a || 0), tz * Math.cos(a || 0) + oz * Math.sin(a || 0)], at = (u, v) => [x0 + tx * u + ox * v, z0 + tz * u + oz * v];
      return { at, dir, rot: (a) => { const d = dir(a); return Math.atan2(d[1], d[0]); }, hy: q.hy }; };
    const lowest = (F, u, v, a, b) => { let m = 1e9; for (const [p, q] of [[-a, -b], [a, -b], [a, b], [-a, b], [0, 0]]) { const [x, z] = F.at(u + p, v + q); m = Math.min(m, gy(x, z)); } return m; };
    const bx = (F, u, v, y, su, sy, sv, col, top, a) => { const [x, z] = F.at(u, v); box(scen.get(x, z), x, y, z, su, sy, sv, F.rot(a), col, top, true); };
    const ex = (x, z, r) => excl.push({ x, z, r });
    const free = (x, z, r) => { for (const [p, q] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) if (pkNear(x + p, z + q).dd < 1.5 || K.excluded(x + p, z + q)) return false; return true; };
    const gcol = (x, z, k) => { const c = pkGCol(x, z), m = pkGMean * (k || 1); return [c[0] * m, c[1] * m, c[2] * m]; };   // the terrain's own shade there
    const beam = (g, a, b, w, h, col) => {   // square bar from a to b (w wide, h deep): cables, lift arms, the raised barrier arm
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[2]);
      const s = l > 1e-4 ? [-d[2] / l, 0, d[0] / l] : [1, 0, 0], L = Math.hypot(...d) || 1, f = [d[0] / L, d[1] / L, d[2] / L];
      const u = [s[1] * f[2] - s[2] * f[1], s[2] * f[0] - s[0] * f[2], s[0] * f[1] - s[1] * f[0]];
      const P = (p, i, j) => [p[0] + s[0] * i * w / 2 + u[0] * j * h / 2, p[1] + s[1] * i * w / 2 + u[1] * j * h / 2, p[2] + s[2] * i * w / 2 + u[2] * j * h / 2];
      const inn = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      for (const [i0, j0, i1, j1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) g.quadO(P(a, i0, j0), P(a, i1, j1), P(b, i1, j1), P(b, i0, j0), col, inn);
    };
    const tq = (cx, cy, cz, fx, fz, W, H, r, tilt) => {   // text board (bottom centre cx, cy, cz) facing (fx, fz), its top leaning back by tilt; r: atlas rect [x0, y0, x1, y1] (px), the same on the back
      const ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), ux = fz, uz = -fx, kx = -fx * H * sa, ky = H * ca, kz = -fz * H * sa;
      for (const f of [1, -1]) { const u0 = r[0] / 1024, u1 = r[2] / 1024, v1 = 1 - r[1] / 1024, v0 = 1 - r[3] / 1024, hw = W / 2 * f, ox = fx * ca * 0.03 * f, oy = sa * 0.03 * f, oz = fz * ca * 0.03 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        tb.quadO(A, B, C, D, W1, [cx + kx / 2 - fx * ca * f, cy + ky / 2 - sa * f, cz + kz / 2 - fz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const sign = (F, u, v, a, W, H, r, pc) => {   // sign on two short and two tall posts, leaning back so the high cameras read it (as in pkLandmarks)
      const [x, z] = F.at(u, v), [fx, fz] = F.dir(a), y = lowest(F, u, v, W / 2, 0.6), g = scen.get(x, z), tl = 0.6, h0 = 0.75, lx = H * Math.sin(tl) + 0.08; pc = pc || [0.3, 0.2, 0.12];
      for (const o of [-W * 0.38, W * 0.38]) { const px = x + fz * o, pz = z - fx * o; box(g, px - fx * 0.08, y - 0.3, pz - fz * 0.08, 0.14, h0 + 0.3, 0.14, Math.atan2(fz, fx), pc, null, true); box(g, px - fx * lx, y - 0.3, pz - fz * lx, 0.14, h0 + H * Math.cos(tl) + 0.36, 0.14, Math.atan2(fz, fx), pc, null, true); }
      tq(x, y + h0, z, fx, fz, W, H, r, tl); ex(x, z, W / 2 + 1.5);
    };
    const pine = (x, z, h) => pkPine(scen.get(x, z), x, gy(x, z), z, h, vary([0.1, 0.22, 0.12], R, 0.14), R);
    const guy = (x, z, a) => K.putPerson(x, z, a, K.fans[Math.floor(R() * K.fans.length)]);   // a visitor facing yaw a (0: +z)
    const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);   // the yaw that faces (tx, tz)

    /* Crystal Reservoir, below the road on the right just after the start: a lake sunk into the shelf beside the road. The ground is carved into a basin
       under it (the height grid and the terrain tiles it touches are rebuilt; the verge keeps its ground, the bank on the road side runs up to its outer
       edge), so its shores are natural banks rising from the water to the ground around; only where the ground falls away (the downhill end) an earth dam
       holds it: riprap, a gravel crest and a concrete spillway with its creek down into the valley. Reeds, rocks and pines on the shore */
    {
      const side = 1, s0 = sStart + 205, uc = 6, ru = 26, rv = 8.6, yw = T.hy[T.idx(s0)] - 2.2, G = PK.G, vE = 1.45;   // vE: the verge's outer edge (1.4 m beyond the barrier line)
      const L = (u, v) => fr(s0 + u, side).at(0, v);   // follows the road's bend
      const UV = (x, z) => { const n = pkNear(x, z); if (n.i < 0) return null; const s = n.i * T.ds + (x - T.px[n.i]) * T.tx[n.i] + (z - T.pz[n.i]) * T.tz[n.i], q = crAt(s);   // (its inverse)
        return q ? [s - s0, (x - q.px) * q.nx + (z - q.pz) * q.nz - q.br] : null; };
      const Rf = (t) => 1 + 0.08 * Math.sin(2 * t + 0.9) + 0.06 * Math.sin(3 * t + 2.3) + 0.04 * Math.sin(5 * t + 0.4);   // the shoreline (x the ellipse), lumpy
      let vm = 1e9; for (let k = 0; k < 72; k++) vm = Math.min(vm, rv * Rf(k / 72 * TAU) * Math.sin(k / 72 * TAU)); const vc = 3.9 - vm;   // the near shore 3.9 m beyond the barrier (the chase camera sees it)
      const bed = (d) => Math.max(yw - 1.4, yw + 0.5 * d), mix = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
      // per angle round the shore: the shoreline point, its outward normal; a dam where the ground 2.5-4 m out is too low for a natural bank, else how far
      // out the bank (rising 1:2 from the water) meets the ground; on the road side where it reaches the verge's edge instead (dv), and that edge's height and colour
      const NA = 72, A = [];
      for (let k = 0; k < NA; k++) {
        const t = k / NA * TAU, Rt = Rf(t), bu = uc + ru * Rt * Math.cos(t), bv = vc + rv * Rt * Math.sin(t); let nu = Math.cos(t) / ru, nv = Math.sin(t) / rv; const nl = Math.hypot(nu, nv); nu /= nl; nv /= nl;
        const T0 = (d) => gy(...L(bu + nu * d, bv + nv * d)), dam = Math.min(T0(2.5), T0(4)) < yw + 0.6;
        let dr = 7; if (!dam) for (let d = 0; d <= 7; d += 0.25) if (yw + 0.5 * d >= T0(d) - 0.02) { dr = d; break; }
        let toe = 6; if (dam) { for (let q = 0; q < 4; q++) toe = Math.min(15, 5.2 + Math.max(0.4, yw + 1.2 - T0(toe)) / 0.55); while (toe > 6 && pkNear(...L(bu + nu * toe, bv + nv * toe)).dd < 1.6) toe -= 0.3; }   // where the dam's outer face meets the ground
        let dv = nv < -0.05 ? (vE - bv) / nv : 1e9; if (dv >= 8.4) dv = 1e9;
        const e = dv < 1e9 ? L(bu + nu * dv, bv + nv * dv) : null, yv = e ? Math.max(T.hy[T.idx(s0 + bu + nu * dv)] - 0.62, gy(e[0], e[1]) + 0.05) : 0, gv = e ? pkGCol(e[0], e[1]).map(c => c * pkGMean) : null;
        A.push({ t, bu, bv, nu, nv, dam, dr: Math.min(dr, dv), toe, dv, yv, gv });
      }
      // the basin: the grid vertices under the lake down below its bed, under the natural banks below the bank, out to where it meets the ground; between the
      // water and the verge well below the bank (5 m cells: the triangles down from the verge stay under it). The verge's own ground is left as it is
      // (the terrain tiles are made at the end of buildPikes, from the carved grid)
      let xa = 1e9, xb = -1e9, za = 1e9, zb = -1e9;
      for (const a of A) { const [x, z] = L(a.bu + a.nu * 10, a.bv + a.nv * 10); xa = Math.min(xa, x); xb = Math.max(xb, x); za = Math.min(za, z); zb = Math.max(zb, z); }
      for (let j = Math.floor((za - G.z0) / PKC); j <= Math.ceil((zb - G.z0) / PKC); j++) for (let i = Math.floor((xa - G.x0) / PKC); i <= Math.ceil((xb - G.x0) / PKC); i++) {
        const q = UV(G.x0 + i * PKC, G.z0 + j * PKC); if (!q) continue;
        const U = (q[0] - uc) / ru, V = (q[1] - vc) / rv, t = Math.atan2(V, U), d = (Math.hypot(U, V) - Rf(t)) * Math.hypot(ru * Math.cos(t), rv * Math.sin(t)), a = A[Math.round((t + TAU) / TAU * NA) % NA];
        if (d > (a.dam ? 0 : a.dr)) continue;
        const k = j * G.nx + i, tg = (d < 0 ? bed(d) : a.dv < 1e9 ? yw - 2.5 : yw + 0.5 * d) - 0.3, h = pkGH(i, j), wf = G.dd[k] >= vE ? 1 : 0;
        if (h <= tg || wf <= 0) continue;
        G.h[k] = h - wf * (h - tg);
      }
      // the shore round it (rings out along the normal): natural: the bed, the waterline, the bank up to the ground (silt, wet earth, then grass into the
      // ground's own colour); the dam: riprap, the gravel crest, the grassed outer face down to the ground
      const D = [-2.2, -1.0, 0, 0.8, 1.7, 2.7, 3.9, 5.2, 6.6, 8.4], nD = D.length, sil = [0.2, 0.22, 0.16], mud = [0.27, 0.24, 0.19], bank = [0.3, 0.3, 0.19], rip = [0.43, 0.41, 0.38], grav = [0.5, 0.46, 0.38], grass = [0.32, 0.33, 0.19];
      const ring = A.map((a) => { const rc = vary(rip, R, 0.18); return D.map((d0, q) => {
        const d = a.dam && q >= nD - 2 ? (q === nD - 1 ? a.toe : (5.2 + a.toe) / 2) : Math.min(d0, a.dv);   // (the dam's outer face runs down to its toe; on the road side the bank ends at the verge)
        const [x, z] = L(a.bu + a.nu * d, a.bv + a.nv * d), gt = gy(x, z), gc = a.gv || gcol(x, z); let y, c;   // (by the road: the verge's colour)
        if (d >= a.dv) return [[x, Math.max(a.yv, yw + 0.5 * d), z], gc];   // (meets the verge's outer edge)
        if (q === nD - 1) return [[x, gt - (a.dam ? 0.1 : 0.3), z], gc];
        if (a.dam) { y = d < 2.4 ? yw + 0.5 * d : d < 5.2 ? yw + 1.2 : yw + 1.2 - 0.55 * (d - 5.2); if (y < gt) return [[x, gt - 0.25, z], gc];
          c = d < 2.4 ? rc : d < 5.3 ? grav : mix(grass, gc, sstep(5.2, a.toe, d)); return [[x, Math.max(y, gt + 0.03), z], c]; }
        if (d > a.dr) return [[x, gt - 0.25, z], gc];
        y = Math.max(d < 0 ? bed(d) : yw + 0.5 * d, gt + 0.03); const hh = y - yw;
        c = hh < -0.08 ? sil : hh < 0.12 ? mud : hh < 0.45 ? mix(mud, bank, sstep(0.12, 0.45, hh)) : mix(bank, gc, sstep(0.45, 1.2, hh));
        return [[x, y, z], c]; }); });
      for (let k = 0; k < NA; k++) { const P = ring[k], Q = ring[(k + 1) % NA], g = K.noShadow(P[2][0][0], P[2][0][2]);   // (the shore lies on the ground: no shadow)
        for (let q = 0; q < nD - 1; q++) g.quadUp(P[q][0], Q[q][0], Q[q + 1][0], P[q + 1][0], [P[q][1], Q[q][1], Q[q + 1][1], P[q + 1][1]]); }
      // the water: a polar grid out a little under the shore; teal, darker in the deep middle, lighter over the shallows (uv in metres: the texture scrolls, out.dyn.water)
      const wg = new GB(true), WR = [0.12, 0.35, 0.58, 0.77, 0.9, 0.96, 1.0, 1.06], NW = 60, wc = [[0.74, 0.8, 0.8], [0.76, 0.82, 0.82], [0.83, 0.88, 0.87], [0.96, 1.0, 0.95], [1.14, 1.17, 1.02], [1.23, 1.25, 1.05], [1.32, 1.33, 1.08], [1.32, 1.33, 1.08]];
      const WF = [0, 0, 0, 0, 0, 0.5, 1, 1], fm = new Map(), fk = (x, z) => x.toFixed(2) + ',' + z.toFixed(2);   // the foam line along the shore (per ring; looked up per vertex by its position)
      const wp = WR.map((f, q) => { const row = []; for (let k = 0; k < NW; k++) { const t = k / NW * TAU, r = Rf(t) * f, [x, z] = L(uc + ru * r * Math.cos(t), vc + rv * r * Math.sin(t)); row.push([x, yw, z]); fm.set(fk(x, z), WF[q]); } return row; });
      const wuv = (p) => [p[0] / 12, p[2] / 12], [mx0, mz0] = L(uc, vc), m0 = [mx0, yw, mz0];
      for (let k = 0; k < NW; k++) { const a = wp[0][k], b = wp[0][(k + 1) % NW]; wg.triO(m0, a, b, wc[0], [mx0, yw - 5, mz0], wc[0], wc[0], wuv(m0), wuv(a), wuv(b)); }
      for (let r = 0; r < WR.length - 1; r++) for (let k = 0; k < NW; k++) { const a = wp[r][k], b = wp[r][(k + 1) % NW], c = wp[r + 1][(k + 1) % NW], d = wp[r + 1][k];
        wg.quadUp(a, b, c, d, [wc[r], wc[r], wc[r + 1], wc[r + 1]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
      // its shader (the map's scrolling offset, out.dyn.water, is the clock: every wave's phase an integer number of turns per wrap, so no jump): wavelets ruffle the
      // normal (the sun glints off them), the sky mirrored by a Fresnel term (paler toward the far side, where the view grazes it), a warm sheen towards the low sun
      // where no shadow falls, the foam line lapping at the shore
      const wgm = wg.geometry(), pa = wgm.attributes.position, fo = new Float32Array(pa.count); for (let k = 0; k < pa.count; k++) fo[k] = fm.get(fk(pa.getX(k), pa.getZ(k))) || 0; wgm.setAttribute('foam', new THREE.BufferAttribute(fo, 1));
      const wmt = new THREE.MeshPhongMaterial({ map: K.tex.water, color: 0x80865c, shininess: 70, specular: 0x5d7a80, vertexColors: true }), f3 = (v) => v.toFixed(3);
      const wav = [[0.8, 0.6, 3.1, 14, 0.028], [-0.5, 0.87, 1.9, 19, 0.018], [0.97, -0.26, 1.2, 29, 0.01], [-0.9, -0.44, 0.75, 41, 0.006]].map(([dx, dz, l, n, a]) => { const f = TAU / l;
        return 'pkG += ' + f3(a * f) + ' * vec2( ' + f3(dx) + ', ' + f3(dz) + ' ) * cos( dot( vLw.xy, vec2( ' + f3(dx * f) + ', ' + f3(dz * f) + ' ) ) + pkPh * ' + n.toFixed(1) + ' );\n'; }).join('');
      wmt.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float foam;\nvarying float vFoam;\nvarying vec3 vLw;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFoam = foam;\nvLw = vec3( position.x - ' + f3(mx0) + ', position.z - ' + f3(mz0) + ', uvTransform[ 2 ].x );');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFoam;\nvarying vec3 vLw;')
          .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nfloat pkPh = 6.2831853 * vLw.z;\nvec2 pkG = vec2( 0.0 );\n' + wav +
            'pkG *= 1.0 - 0.6 * vFoam;\nnormal = normalize( ( viewMatrix * vec4( -pkG.x, 1.0, -pkG.y, 0.0 ) ).xyz );')
          .replace('#include <envmap_fragment>', [
            'vec3 pkR = reflect( -geometry.viewDir, normal ), pkRw = ( vec4( pkR, 0.0 ) * viewMatrix ).xyz;',
            'float pkF = pow( 1.0 - clamp( dot( normal, geometry.viewDir ), 0.0, 1.0 ), 1.7 );',
            'vec3 pkSky = mix( vec3( 0.86, 0.84, 0.82 ), vec3( 0.55, 0.68, 0.9 ), smoothstep( 0.05, 0.75, pkRw.y ) );',
            'outgoingLight = mix( outgoingLight, pkSky, clamp( 0.04 + 0.95 * pkF, 0.0, 0.65 ) );',
            '#if NUM_DIR_LIGHTS > 0',
            'vec3 pkU = max( dot( normal, directionalLights[ 0 ].direction ), 0.0 ) * directionalLights[ 0 ].color * diffuseColor.rgb;',
            'float pkSh = clamp( dot( reflectedLight.directDiffuse, vec3( 1.0 ) ) / max( dot( pkU, vec3( 1.0 ) ), 1e-4 ), 0.0, 1.0 ), pkSd = max( dot( pkR, directionalLights[ 0 ].direction ), 0.0 );',
            'outgoingLight += directionalLights[ 0 ].color * pkSh * ( 0.16 * pow( pkSd, 5.0 ) + 1.4 * pow( pkSd, 90.0 ) );',
            '#endif',
            'float pkFo = smoothstep( 0.45, 0.95, vFoam + 0.14 * sin( pkPh * 9.0 + vLw.x * 0.9 + vLw.y * 1.3 ) ) * ( 0.7 + 0.3 * sin( vLw.x * 3.1 - vLw.y * 2.3 ) );',
            'vec3 pkL = ( reflectedLight.directDiffuse + reflectedLight.indirectDiffuse ) / max( diffuseColor.rgb, vec3( 0.03 ) );',
            'outgoingLight = mix( outgoingLight, vec3( 0.8, 0.82, 0.8 ) * pkL, 0.85 * pkFo );'].join('\n'));
      };
      wmt.customProgramCacheKey = () => 'pkLake';
      const wm = new THREE.Mesh(wgm, wmt);
      wm.receiveShadow = true; wm.matrixAutoUpdate = false; K.root.add(wm); K.out.dyn.water = K.tex.water;
      // the spillway where the dam's outer face drops the most (towards the valley): a concrete lip at the water, a slab across the crest, the chute with its
      // walls down the face, a stilling basin at the foot, rocks, the creek winding on down the slope
      let sp = null; for (const a of A) if (a.dam && a.nv > 0.3) { const h = yw + 1.2 - gy(...L(a.bu + a.nu * 8.4, a.bv + a.nv * 8.4)); if (!sp || h > sp.h) sp = Object.assign({ h }, a); }
      if (sp) { const [bx, bz] = L(sp.bu, sp.bv), [ox, oz] = L(sp.bu + sp.nu, sp.bv + sp.nv), nl = Math.hypot(ox - bx, oz - bz), nx = (ox - bx) / nl, nz = (oz - bz) / nl, rot = Math.atan2(nz, nx), g = scen.get(bx, bz), conc = [0.72, 0.71, 0.68], cw = 2.6;
        const P = (d, w) => [bx + nx * d - nz * w, bz + nz * d + nx * w];
        { const [x, z] = P(-0.3, 0); box(g, x, yw - 0.62, z, 1.2, 0.74, cw + 0.8, rot, conc); }   // the lip
        { const [x, z] = P(3.8, 0); box(g, x, yw + 0.96, z, 3.2, 0.3, cw + 0.8, rot, conc, [0.6, 0.6, 0.58]); }   // across the crest
        let d1 = 5.2; while (d1 < 16 && gy(...P(d1, 0)) < yw + 1.2 - 0.55 * (d1 - 5.2)) d1 += 0.4;   // the foot of the face
        const n = Math.max(3, Math.round((d1 - 5.2) / 1.3)), L1 = (d1 - 5.2) / n + 0.12;
        for (let q = 0; q < n; q++) { const d = 5.2 + (d1 - 5.2) * (q + 0.5) / n, y = yw + 1.2 - 0.55 * (d - 5.2), [x, z] = P(d, 0);
          box(g, x, y - 0.5, z, L1, 0.5, cw, rot, conc, [0.52, 0.6, 0.62]); for (const w of [-1, 1]) { const [x2, z2] = P(d, w * (cw / 2 + 0.15)); box(g, x2, y - 0.5, z2, L1, 1.0, 0.3, rot, conc); } }
        const [px2, pz2] = P(d1 + 1.7, 0); box(g, px2, gy(px2, pz2) - 0.3, pz2, 3.2, 0.4, cw + 1.4, rot, conc, [0.3, 0.44, 0.48]);
        for (let q = 0; q < 5; q++) { const a = R() * TAU, dd = 2.4 + R() * 1.6, x = px2 + Math.cos(a) * dd, z = pz2 + Math.sin(a) * dd; rock(g, x, gy(x, z) + 0.1, z, 0.5 + R() * 0.4, 0.45, 0.5 + R() * 0.3, R() * TAU, vary([0.52, 0.47, 0.43], R, 0.15), R, 0.3); }
        { let x = px2 + nx * 1.8, z = pz2 + nz * 1.8, hx = nx, hz = nz, prev = null; const cw2 = [0.13, 0.24, 0.25], cb = [0.3, 0.27, 0.2];   // the creek, downhill
          for (let q = 0; q < 14; q++) { const gxx = gy(x + 1, z) - gy(x - 1, z), gzz = gy(x, z + 1) - gy(x, z - 1), gl = Math.hypot(gxx, gzz) || 1; hx = hx * 0.6 - gxx / gl * 0.4; hz = hz * 0.6 - gzz / gl * 0.4; const hl = Math.hypot(hx, hz); hx /= hl; hz /= hl;
            const w = 0.45 + 0.1 * Math.sin(q * 1.7), cur = [-w - 0.5, -w, w, w + 0.5].map((o) => [x - hz * o, gy(x - hz * o, z + hx * o) + 0.05, z + hx * o]);
            if (prev) { const gg = K.noShadow(x, z); gg.quadUp(prev[0], prev[1], cur[1], cur[0], [cb, cw2, cw2, cb]); gg.quadUp(prev[1], prev[2], cur[2], cur[1], [cw2, cw2, cw2, cw2]); gg.quadUp(prev[2], prev[3], cur[3], cur[2], [cw2, cb, cb, cw2]); }
            if (q % 3 === 0) ex(x, z, 2.5); prev = cur; x += hx * 1.7; z += hz * 1.7; if (pkNear(x, z).dd < 3) break; } }
        ex(px2, pz2, 5); }
      // reeds in the shallows and rocks at the water's edge on the natural shores, grass tufts on the banks, pines round the rim, two anglers on the road side
      const reedC = [[0.42, 0.45, 0.2], [0.5, 0.47, 0.24], [0.36, 0.41, 0.19], [0.55, 0.5, 0.27]], tuftC = [[0.46, 0.47, 0.24], [0.4, 0.44, 0.2], [0.52, 0.5, 0.28]];
      for (let k = 0; k < NA; k += 2) { const a = A[k]; if (a.dam || R() > 0.5) continue;
        const d0 = -0.6 + R() * 0.6, [cx, cz] = L(a.bu + a.nu * d0, a.bv + a.nv * d0), g = K.noShadow(cx, cz), n = 5 + Math.floor(R() * 5); if (pkNear(cx, cz).dd < 2.5) continue;
        for (let q = 0; q < n; q++) { const x = cx + (R() - 0.5) * 1.5, z = cz + (R() - 0.5) * 1.5, y = Math.max(gy(x, z), yw - 0.35), c = reedC[Math.floor(R() * 4)];
          cone(g, x, y, z, 0.035 + R() * 0.025, yw - y + 0.7 + R() * 0.75, 3, c, [c[0] * 1.3, c[1] * 1.22, c[2] * 1.1], R() * TAU); } }
      for (let k = 1; k < NA; k += 4) { const a = A[k]; if (a.dam || R() > 0.55) continue; const d = -0.5 + R() * 1.5, [x, z] = L(a.bu + a.nu * d, a.bv + a.nv * d); if (pkNear(x, z).dd < 2.5) continue;
        rock(scen.get(x, z), x, Math.max(gy(x, z), yw - 0.25) + 0.15, z, 0.5 + R() * 0.7, 0.45 + R() * 0.35, 0.5 + R() * 0.6, R() * TAU, vary([0.54, 0.49, 0.45], R, 0.14), R, 0.3); }
      for (let k = 0; k < 40; k++) { const a = A[Math.floor(R() * NA)]; if (a.dam || a.dr < 0.8) continue; const d = 0.4 + R() * (a.dr - 0.3), [x, z] = L(a.bu + a.nu * d, a.bv + a.nv * d); if (pkNear(x, z).dd < 2) continue;
        const y = gy(x, z), c = tuftC[Math.floor(R() * 3)], g = K.noShadow(x, z); for (let q = 0; q < 2; q++) cone(g, x + (R() - 0.5) * 0.5, y, z + (R() - 0.5) * 0.5, 0.12 + R() * 0.1, 0.3 + R() * 0.35, 4, vary(c, R, 0.12), [c[0] * 1.25, c[1] * 1.2, c[2] * 1.1], R() * TAU); }
      for (let k = 0; k < 30; k++) { const a = A[Math.floor(R() * NA)]; if (a.dam) continue; const d = a.dr + 1.5 + R() * 7, [x, z] = L(a.bu + a.nu * d, a.bv + a.nv * d);
        if (gy(x, z) < yw + 0.4 || !free(x, z, 1.5)) continue; pine(x, z, 6 + R() * 5.5); }
      for (const t of [-1.75, -1.35]) { const a = A[Math.round((t + TAU) / TAU * NA) % NA]; if (a.dam) continue; const d = Math.min(a.dr, 1.4) - 0.3, [x, z] = L(a.bu + a.nu * d, a.bv + a.nv * d);
        if (pkNear(x, z).dd >= 2) guy(x, z, face(x, z, ...L(a.bu - a.nu * 5, a.bv - a.nv * 5))); }
      for (let u = uc - ru - 4; u <= uc + ru + 4; u += 8) { const [x, z] = L(u, vc); ex(x, z, rv + 5.5); }
      for (let k = 0; k < NA; k += 4) if (A[k].dam) { const a = A[k], [x, z] = L(a.bu + a.nu * 5.5, a.bv + a.nv * 5.5); ex(x, z, 4.5); }   // (no trees on the dam)
      sign(fr(s0 + uc - ru - 9, side), 0, 2.6, PI + 0.35, 4.4, 1.1, [0, 256, 1024, 512]);
    }

    /* the toll gate at the foot of the highway, behind the start: a canopy on stone pillars high over the road ("PIKES PEAK HIGHWAY" on its fascia),
       a log booth on the left with its barrier arm raised clear of the road */
    {
      const s0 = 17.5, q = crAt(s0), hd = Math.atan2(q.tz, q.tx), y = q.hy, FL = fr(s0, -1), FR = fr(s0, 1), yT = y + 6.1;
      const pil = [0.54, 0.5, 0.46], roofT = [0.22, 0.32, 0.25], fas = [0.36, 0.24, 0.15];
      for (const [F, v] of [[FL, 4.9], [FR, 1.9]]) for (const u of [-2.2, 2.2]) { const [x, z] = F.at(u, v), g = scen.get(x, z), yb = gy(x, z) - 0.4;
        box(g, x, yb, z, 0.9, 1.4, 0.9, hd, vary(pil, R, 0.06)); box(g, x, yb + 1.4, z, 0.7, yT - yb - 1.4, 0.7, hd, vary(pil, R, 0.06)); }
      const L1 = q.bl + 5.5, L2 = q.br + 2.7, cx = q.px + q.nx * (L2 - L1) / 2, cz = q.pz + q.nz * (L2 - L1) / 2, g = scen.get(q.px, q.pz);
      box(g, cx, yT, cz, 5.6, 0.2, L1 + L2, hd, [0.7, 0.66, 0.6]);   // soffit
      box(g, cx, yT + 0.2, cz, 6.2, 1.15, L1 + L2 + 0.6, hd, fas, roofT);   // fascia and the green metal roof
      for (const f of [1, -1]) tq(q.px + q.tx * f * 3.14, yT + 0.25, q.pz + q.tz * f * 3.14, q.tx * f, q.tz * f, 8.4, 1.05, [0, 0, 1024, 128], 0);
      for (const o of [-4.6, 4.6]) box(g, q.px + q.nx * o, yT + 1.3, q.pz + q.nz * o, 0.2, 1.3, 0.2, hd, [0.2, 0.2, 0.2]);
      tq(q.px - q.tx * 0.3, yT + 1.4, q.pz - q.tz * 0.3, -q.tx, -q.tz, 11.2, 1.4, [0, 0, 1024, 128], 0.55);   // and on a board on the roof, leaning back (read from the cars coming up the paddock)
      // the booth: log walls, a band of windows all round, a gable roof; the barrier arm on its post, raised
      const [bx0, bz0] = FL.at(0, 2.95), by = gy(bx0, bz0) - 0.2, rb = FL.rot(), gb = scen.get(bx0, bz0);
      box(gb, bx0, by - 0.2, bz0, 4.0, 0.6, 3.0, rb, stone, stoneT); box(gb, bx0, by + 0.4, bz0, 3.6, 2.5, 2.6, rb, [0.5, 0.34, 0.2]);
      box(gb, bx0, by + 1.35, bz0, 3.66, 0.95, 2.66, rb, [0.17, 0.22, 0.27]); gable(gb, bx0, by + 2.9, bz0, 4.4, 3.4, 1.0, rb, [0.2, 0.3, 0.23], [0.5, 0.34, 0.2]);
      { const [fx, fz] = FL.dir(-PI / 2), [x, z] = FL.at(0, 2.95 - 1.34); tq(x, by + 0.55, z, fx, fz, 2.4, 0.3, [512, 128, 1024, 192], 0); }
      const [px, pz] = FL.at(-2.6, 1.7), py = gy(px, pz), [ox, oz] = FL.dir(-PI / 2), ang = 1.3, Lr = 4.4, p0 = [px, py + 1.0, pz], gp = scen.get(px, pz);
      box(gp, px, py - 0.2, pz, 0.4, 1.3, 0.4, rb, [0.95, 0.78, 0.1]); box(gp, px, py + 0.85, pz, 0.62, 0.35, 0.62, rb, [0.18, 0.18, 0.2]);
      for (let k = 0; k < 6; k++) { const a0 = k / 6 * Lr, a1 = (k + 1) / 6 * Lr, P = (a) => [px + ox * Math.cos(ang) * a, p0[1] + Math.sin(ang) * a, pz + oz * Math.cos(ang) * a];
        beam(gp, P(a0), P(a1), 0.13, 0.13, k % 2 ? [0.85, 0.12, 0.1] : [0.95, 0.95, 0.93]); }
      ex(bx0, bz0, 5);
    }

    /* the old ski lift of the Ski Area, on the flat ground outside the hairpin, straight ahead of the cars braking for it (the chase camera looks right at
       it): the faded sign and a rack of old single chairs facing them, the bottom terminal's bull wheel under its rusty gantry, the operator's hut, rusty
       T-towers up the gentle slope beyond with the haul rope and a few chairs still hanging, the top terminal. The line is a cleared swath through the forest */
    const hpS = T.corners.find(c => c.sev >= 3 && Math.abs((c.i0 + c.i1) / 2 * T.ds - sStart - 1959) < 40);
    if (hpS) {
      const sA = (hpS.i0 + hpS.i1) / 2 * T.ds, side = -hpS.dir, F = fr(sA, side);   // the apex's frame: u along the road there, v out beyond the barrier (away from the bend)
      const rust = [0.44, 0.3, 0.22], rustD = [0.34, 0.23, 0.17], steel = [0.5, 0.48, 0.45], dk = [0.12, 0.12, 0.13], conc = [0.58, 0.56, 0.53], wc = [0.42, 0.3, 0.2], roofC = [0.36, 0.37, 0.38];
      const chC = [[0.56, 0.28, 0.22], [0.33, 0.43, 0.52], [0.58, 0.53, 0.33], [0.37, 0.47, 0.35]];   // faded red, blue, yellow, green
      const uL = -3, rW = 1.8, [wx, wz] = F.at(uL, 5.2), [gx, gz] = F.dir(PI / 2), [px, pz] = F.dir(0), rl = Math.atan2(gz, gx);   // the bull wheel; the line straight out (+p: along the road at the apex)
      const at = (d, w) => [wx + gx * d + px * w, wz + gz * d + pz * w];
      const chair = (g, x, y, z, fx, fz, c) => { const r = Math.atan2(fz, fx), bx = x - fx * 0.3, bz = z - fz * 0.3;   // an old single chair on the grip at (x, y, z), its rider facing (fx, fz)
        beam(g, [x, y, z], [x, y - 0.35, z], 0.05, 0.05, dk); beam(g, [x, y - 0.35, z], [bx, y - 1.3, bz], 0.05, 0.05, dk);   // the grip, the hanger bar down behind the back
        box(g, x - fx * 0.02, y - 1.92, z - fz * 0.02, 0.5, 0.07, 0.56, r, c); box(g, bx, y - 1.92, bz, 0.07, 0.62, 0.56, r, c);   // seat, back
        beam(g, [x + fx * 0.24, y - 1.9, z + fz * 0.24], [x + fx * 0.36, y - 2.35, z + fz * 0.36], 0.03, 0.03, dk); };   // the foot bar
      const terminal = (d, top) => {   // the bull wheel on its drive shaft under a rusty gantry (a leg either side); a plank hut beside it, away from the road
        const [cx, cz] = at(d, 0), yW = gy(cx, cz) + 3.3, g = scen.get(cx, cz);
        for (const w of [-2.25, 2.25]) { const [x, z] = at(d, w), y = gy(x, z); box(g, x, y - 0.4, z, 0.6, 0.55, 0.6, rl, conc); box(g, x, y, z, 0.32, yW + 0.95 - y, 0.32, rl, vary(rust, R, 0.12)); }
        box(g, cx, yW + 0.6, cz, 0.55, 0.42, 5.0, rl, rustD, rust);   // the head beam across
        cyl(g, cx, yW - 0.12, cz, rW, 0.28, 16, dk, steel); cyl(g, cx, yW + 0.16, cz, 0.16, 0.5, 6, rustD);   // the wheel, its shaft
        const [hx, hz] = at(d + (top ? 1.2 : -0.8), 4.6), hy = gy(hx, hz) - 0.3, c = vary(wc, R, 0.1);
        box(g, hx, hy, hz, 3.2, 2.6, 2.8, rl, c); box(g, hx - px * 1.42, hy + 1.2, hz - pz * 1.42, 1.3, 0.75, 0.06, rl, [0.16, 0.18, 0.2]); box(g, hx + px * 1.42, hy + 0.3, hz + pz * 1.42, 0.06, 2.0, 0.9, rl, [0.3, 0.21, 0.14]);   // window, door
        gable(g, hx, hy + 2.6, hz, 3.6, 3.4, 0.9, rl + PI / 2, roofC, c); ex(hx, hz, 4.5);
        return [cx, yW, cz]; };
      const rackOK = free(...at(0.3, -6.2), 2.6);   // (before the terminal's own exclusion)
      // the bottom terminal, a plank loading deck on the up side where the chairs swing round
      const bot = terminal(0, false); { const [x, z] = at(1.9, -1.8); box(scen.get(x, z), x, gy(x, z) - 0.2, z, 2.6, 0.5, 2.0, rl, [0.4, 0.3, 0.2], [0.5, 0.38, 0.25]); } ex(wx, wz, 5.5);
      // the towers, the rope in a straight line from wheel to wheel (the towers as tall as it needs, 6.5-9.5 m), the top terminal
      const dT = 46, [tx0, tz0] = at(dT, 0), freeT = free(tx0, tz0, 2.5), yT = gy(tx0, tz0) + 3.3, tops = [[bot[0], bot[1] + 0.12, bot[2], rW]];
      for (const d of [11, 23, 35]) { const [x, z] = at(d, 0); if (!free(x, z, 1.5)) break;
        const y = gy(x, z), H = clamp(bot[1] + (yT - bot[1]) * d / dT - y + 0.5, 6.5, 9.5), g = scen.get(x, z), cr = vary(rust, R, 0.12);
        box(g, x, y - 0.5, z, 0.9, 0.7, 0.9, rl, conc); box(g, x, y, z, 0.46, H + 0.3, 0.46, rl, cr);
        beam(g, [x - px * 0.1 - gx * 0.28, y + 1.2, z - pz * 0.1 - gz * 0.28], [x - px * 0.1 - gx * 0.28, y + H - 0.4, z - pz * 0.1 - gz * 0.28], 0.07, 0.07, rustD);   // a ladder rail
        box(g, x, y + H, z, 0.38, 0.38, 5.0, rl, vary(rust, R, 0.1), rustD);   // the crossarm
        for (const w of [-2.2, 2.2]) box(g, x + px * w, y + H - 0.42, z + pz * w, 1.5, 0.3, 0.22, rl, dk);   // sheave trains
        tops.push([x, y + H - 0.35, z, 2.2]); ex(x, z, 5); }
      if (freeT && tops.length === 4) { const e = terminal(dT, true); tops.push([e[0], e[1] + 0.12, e[2], rW]); ex(tx0, tz0, 5.5); }
      for (let k = 0; k + 1 < tops.length; k++) for (const w of [-1, 1]) {   // the rope: the +w strand goes up (the chairs facing up the line), the other comes down
        const a = tops[k], b = tops[k + 1], A = [a[0] + px * w * a[3], a[1], a[2] + pz * w * a[3]], B = [b[0] + px * w * b[3], b[1], b[2] + pz * w * b[3]];
        const sag = Math.hypot(B[0] - A[0], B[2] - A[2]) * 0.025, M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - sag, (A[2] + B[2]) / 2], g = scen.get(A[0], A[2]);
        beam(g, A, M, 0.08, 0.08, dk); beam(g, M, B, 0.08, 0.08, dk);
        for (const f of w > 0 ? [0.3, 0.75] : [0.52]) { if (R() < 0.3) continue;   // (some chairs long gone)
          const P = f < 0.5 ? [A[0] + (M[0] - A[0]) * f * 2, A[1] + (M[1] - A[1]) * f * 2, A[2] + (M[2] - A[2]) * f * 2] : [M[0] + (B[0] - M[0]) * (f * 2 - 1), M[1] + (B[1] - M[1]) * (f * 2 - 1), M[2] + (B[2] - M[2]) * (f * 2 - 1)];
          chair(g, P[0], P[1], P[2], gx * w, gz * w, chC[Math.floor(R() * chC.length)]); } }
      for (let d = 4; d < (tops.length > 4 ? dT : 35) + 4; d += 6) { const [x, z] = at(d, 0); ex(x, z, 6); }   // the cleared lift line
      // beside the terminal, facing the cars coming up to the hairpin: the rack of old chairs (a rail on two posts, three chairs on it), the faded sign before it
      { const [fx, fz] = F.dir(-PI / 2), [x0, z0] = at(0.3, -6.2), g = scen.get(x0, z0), rr = Math.atan2(pz, px), P = (w) => at(0.3, -6.2 + w);
        let yR = 1e9; for (const w of [-2.5, 0, 2.5]) yR = Math.min(yR, gy(...P(w))); yR += 2.55;
        if (rackOK) { for (const w of [-2.3, 2.3]) { const [x, z] = P(w), y = gy(x, z); box(g, x, y - 0.3, z, 0.16, yR - y + 0.45, 0.16, rr, rustD); }
          { const [ax, az] = P(-2.5), [bx, bz] = P(2.5); beam(g, [ax, yR + 0.08, az], [bx, yR + 0.08, bz], 0.1, 0.14, rust); }
          for (const w of [-1.55, -0.52, 1.55]) { const [x, z] = P(w); chair(g, x, yR, z, fx, fz, vary(chC[Math.floor(R() * chC.length)], R, 0.12)); }   // (one gone)
          ex(x0, z0, 3.5); } }
      sign(F, uL - 15, 3.4, -PI / 2 + 0.3, 5.2, 1.3, [0, 512, 1024, 768], [0.28, 0.26, 0.24]);
    }

    /* the W's: fans camp on the slopes between the legs of the ladder: tents, flags on tall poles, cars parked on the flatter shelves, groups watching */
    {
      const a0 = sStart + 2880, a1 = sStart + 3450, camps = [], flagC = [[[0.85, 0.12, 0.1], [0.95, 0.95, 0.95], [0.15, 0.3, 0.75]], [[0.1, 0.45, 0.2], [0.95, 0.95, 0.95], [0.85, 0.12, 0.1]], [[0.98, 0.8, 0.1], [0.12, 0.12, 0.14], [0.98, 0.8, 0.1]], [[0.15, 0.35, 0.8], [0.98, 0.8, 0.1], [0.15, 0.35, 0.8]], [[0.95, 0.5, 0.1], [0.95, 0.95, 0.95], [0.2, 0.6, 0.3]]];
      const wind = 2.2;   // the flags all stream the same way
      const flag = (x, z, h) => { const y = gy(x, z), g = scen.get(x, z), c = flagC[Math.floor(R() * flagC.length)], wx = Math.cos(wind), wz = Math.sin(wind);
        cyl(g, x, y - 0.2, z, 0.05, h + 0.2, 5, [0.82, 0.82, 0.84]);
        (K.out.pkFl || (K.out.pkFl = [])).push([x + wx * 0.05, y + h - 0.03, z + wz * 0.05, wind, [[c[0]], [c[1]], [c[2]]], 2.2, 1.26]); };   // (the cloth: pkAmbient's waving flags)
      for (let s = a0; s < a1; s += 11) for (const side of [-1, 1]) for (const v of [4, 8.5, 14, 21]) {
        if (R() > 0.45) continue;
        const [x, z] = fr(s, side).at((R() - 0.5) * 8, v), nn = pkNear(x, z); if (nn.dd < 3.5 || nn.i < 0) continue;
        const y = gy(x, z); if (y < T.hy[nn.i] - 1.5 || pkSlope(x, z) > 0.36 || K.excluded(x, z)) continue;
        if (camps.some(c => (c[0] - x) ** 2 + (c[1] - z) ** 2 < 15 * 15)) continue;
        const ri = nn.i, rx = T.px[ri], rz = T.pz[ri], yaw = face(x, z, rx, rz), rot = Math.atan2(rz - z, rx - x) + PI / 2;   // (tents and cars side-on to the road)
        camps.push([x, z]);
        if (free(x, z, 2.2)) { K.tent(x, z, rot, K.fans[Math.floor(R() * K.fans.length)]); K.CR.block(x, z, 3.6, 3.6, rot); }
        const fx = x + Math.cos(rot) * 2.8, fz = z + Math.sin(rot) * 2.8; if (free(fx, fz, 0.5)) flag(fx, fz, 5.2 + R() * 1.5);
        const cxp = x - Math.cos(rot) * 5.2, czp = z - Math.sin(rot) * 5.2;
        if (R() < 0.6 && pkSlope(cxp, czp) < 0.3 && free(cxp, czp, 2.6)) { K.carPk(cxp, czp, rot, vary(K.fans[Math.floor(R() * K.fans.length)], R, 0.2)); K.CR.block(cxp, czp, 4.8, 2.4, rot); }
        const tx = x + (rx - x) * 0.25, tz = z + (rz - z) * 0.25;   // the group: between the tent and the road, facing it
        for (let k = 0, n = 3 + Math.floor(R() * 5); k < n; k++) { const qx = tx + (R() - 0.5) * 5, qz = tz + (R() - 0.5) * 5; if (pkNear(qx, qz).dd < 1.6) continue; guy(qx, qz, yaw + (R() - 0.5) * 0.8); }
        ex(x, z, 5.5);
      }
      for (let s = a0 + 5; s < a1; s += 23) { const side = R() < 0.5 ? 1 : -1, [x, z] = fr(s, side).at(0, 2.2 + R() * 2); if (free(x, z, 0.6) && pkSlope(x, z) < 0.8) flag(x, z, 4.6 + R() * 1.2); }   // single flags by the barriers
    }

    /* the Summit Visitor Center (2021) on the summit house's pad left of the road: long and low, set into the slope, stone walls, a band of dark
       glass towards the road, a big glass front and a terrace facing the view, a flat green roof with a raised clerestory */
    {
      const pd = K.padH, ih = pd.i, hd = T.hd[ih], tx = T.tx[ih], tz = T.tz[ih], nx = T.nx[ih], nz = T.nz[ih];   // +n: towards the road
      const at = (a, b) => [pd.x + tx * a + nx * b, pd.z + tz * a + nz * b], Lb = 34, Db = 12, c0 = -2.5, y0 = pd.h + 0.15, H = 4.6;
      const g = scen.get(pd.x, pd.z), B = (a, b, y, sa, sy, sb, col, top) => { const [x, z] = at(a, b); box(g, x, y, z, sa, sy, sb, hd, col, top, true); };
      const stn = [0.5, 0.45, 0.41], stnL = [0.6, 0.55, 0.5], glass = [0.1, 0.13, 0.16], glassR = [0.2, 0.26, 0.3], mull = [0.3, 0.3, 0.31], roofG = [0.33, 0.42, 0.2];
      let lo = 1e9; for (let a = -Lb / 2; a <= Lb / 2; a += 4) for (let b = c0 - Db / 2 - 6; b <= c0 + Db / 2; b += 3) lo = Math.min(lo, gy(...at(a, b)));
      B(0, c0 - 3, lo - 0.5, Lb + 1, y0 - lo + 0.5, Db + 6.4, stn, [0.62, 0.6, 0.57]);   // the plinth under the building and its terrace, down to the slope
      B(0, c0, y0, Lb, H, Db, glass);   // the glass body
      B(0, c0 + Db / 2 - 0.35, y0, Lb + 0.2, H - 0.05, 0.8, stn);   // stone wall towards the road, a band of dark glass high in it (right of the name)
      B(6.5, c0 + Db / 2 + 0.02, y0 + 2.9, 15, 0.85, 0.12, glassR);
      for (const sa of [-1, 1]) B(sa * (Lb / 2 - 0.4), c0, y0, 0.9, H - 0.05, Db + 0.3, stn);   // the end walls
      for (let k = -2; k <= 2; k++) B(k * 7.4, c0 - Db / 2 - 0.1, y0, 0.9, H - 0.05, 0.7, stnL);   // stone piers in the glass front
      for (let k = -8; k <= 8; k++) if (k % 4) B(k * 1.85, c0 - Db / 2 - 0.05, y0, 0.1, H - 0.1, 0.12, mull);   // mullions
      B(0, c0 - Db / 2 - 0.05, y0 + 2.6, Lb - 1, 0.1, 0.14, mull);
      // entrance: a glazed recess, a flat canopy over it
      B(5, c0 + Db / 2 + 0.08, y0, 6, 2.7, 0.1, glassR); B(5, c0 + Db / 2 + 1.5, y0 + 2.75, 7, 0.22, 3, [0.28, 0.28, 0.29], [0.4, 0.4, 0.4]);
      for (const a of [2, 8]) B(a, c0 + Db / 2 + 2.7, y0, 0.2, 2.75, 0.2, mull);
      // the flat roof: dark fascia, green sedum top in patches, the raised clerestory in the middle
      B(0, c0 - 0.9, y0 + H, Lb + 1.6, 0.5, Db + 2.8, [0.2, 0.2, 0.21], roofG);
      for (let k = 0; k < 14; k++) { const a = (R() - 0.5) * (Lb - 4), b = c0 - 0.9 + (R() - 0.5) * (Db - 1), w = 2 + R() * 4; B(a, b, y0 + H + 0.5, w, 0.05, w * (0.5 + R() * 0.6), vary(R() < 0.3 ? [0.52, 0.46, 0.24] : roofG, R, 0.2)); }
      B(-4, c0, y0 + H + 0.5, 11, 1.2, 5.5, glassR); B(-4, c0, y0 + H + 1.7, 12, 0.3, 6.5, [0.2, 0.2, 0.21], vary(roofG, R, 0.1));
      // the terrace: paving, a glass balustrade on slim posts, benches, visitors looking out
      B(0, c0 - Db / 2 - 3.2, y0 - 0.1, Lb - 2, 0.12, 6, [0.62, 0.6, 0.57]);
      B(0, c0 - Db / 2 - 6.15, y0, Lb - 2, 1.05, 0.06, [0.52, 0.62, 0.66]); B(0, c0 - Db / 2 - 6.15, y0 + 1.05, Lb - 2, 0.07, 0.12, mull);
      for (const sa of [-1, 1]) { B(sa * (Lb / 2 - 1), c0 - Db / 2 - 3.1, y0, 0.06, 1.05, 6.1, [0.52, 0.62, 0.66]); }
      for (const a of [-9, 0, 9]) B(a, c0 - Db / 2 - 1.5, y0, 2.2, 0.45, 0.5, woodD);
      for (let k = 0; k < 9; k++) { const [x, z] = at((R() - 0.5) * (Lb - 5), c0 - Db / 2 - 4.5 - R() * 1.2); const [vx, vz] = at(0, -100); guy(x, z, face(x, z, vx, vz) + (R() - 0.5) * 0.9); }
      // its name, self-lit (the material below) so it reads in the shade of the low sun: a bronze band on the road side of the wall, the same big on the
      // flat roof (the cameras look down), and a stone monument by the road just past the line, facing the arriving cars
      B(-8.3, c0 + Db / 2 + 0.07, y0 + 2.78, 15.5, 1.18, 0.14, [0.24, 0.18, 0.12]);
      { const [x, z] = at(-8.3, c0 + Db / 2 + 0.17); tq(x, y0 + 2.9, z, nx, nz, 15, 0.94, [0, 192, 1024, 256], 0); }
      { const [x, z] = at(0.5, c0 + 5.95); tq(x, y0 + H + 0.58, z, nx, nz, 29, 1.81, [0, 192, 1024, 256], PI / 2); }   // (flat, its top away from the road)
      { const [x, z] = at(0, c0); K.CR.block(x, z, Lb + 2, Db + 14, hd); }
    }
    { const Fm = fr(K.sFin + 17, -1), [fx, fz] = Fm.dir(PI + 0.35), ux = fz, uz = -fx, W = 7.2, Hs = 1.8, tl = 0.75;
      const clear = (v) => { const [x, z] = Fm.at(0, v); for (let p = 0; p <= 4; p++) for (let q = 0; q <= 16; q++) { const a = -1.4 + p * 0.5, b = -4.1 + q * 0.5125; if (pkNear(x + fx * a + ux * b, z + fz * a + uz * b).dd < 1.5) return false; } return true; };   // (the plinth's whole footprint clear of the barrier line)
      let v = 2.9; while (v < 12 && !clear(v)) v += 0.1;
      const [mx, mz] = Fm.at(0, v), g = scen.get(mx, mz);
      let yb = 1e9; for (const o of [-4, 0, 4]) for (const q of [-1.3, 0.6]) yb = Math.min(yb, gy(mx + ux * o + fx * q, mz + uz * o + fz * q));
      const ym = yb + 0.62, kx = -fx * Hs * Math.sin(tl), ky = Hs * Math.cos(tl), kz = -fz * Hs * Math.sin(tl), hw = W / 2 + 0.25, cN = [fx * Math.cos(tl) * 0.02, Math.sin(tl) * 0.02, fz * Math.cos(tl) * 0.02];
      box(g, mx - fx * 0.4, yb - 0.35, mz - fz * 0.4, 2.0, 0.97, W + 1.0, Math.atan2(fz, fx), stone, stoneT);   // the plinth
      const A = [mx - ux * hw - cN[0], ym - cN[1], mz - uz * hw - cN[2]], Bq = [mx + ux * hw - cN[0], ym - cN[1], mz + uz * hw - cN[2]], Ct = [Bq[0] + kx, Bq[1] + ky + 0.12, Bq[2] + kz], Dt = [A[0] + kx, A[1] + ky + 0.12, A[2] + kz];
      const Cb = [Ct[0], ym, Ct[2]], Db2 = [Dt[0], ym, Dt[2]], inn = [mx + kx * 0.5, ym + ky * 0.3, mz + kz * 0.5];
      g.quadO(A, Bq, Ct, Dt, stoneT, inn); g.quadO(Db2, Cb, Ct, Dt, stone, inn); g.triO(A, Db2, Dt, stone, inn); g.triO(Bq, Cb, Ct, stone, inn);   // the sloped stone face, its back and cheeks
      tq(mx, ym + 0.06, mz, fx, fz, W, Hs, [0, 768, 1024, 1024], tl); ex(mx, mz, 4.6); { const [ox, oz] = Fm.at(0, 2.9); ex(ox, oz, 4.6); } }   // (the spot it first stood on stays clear too: the rocks' random streams run on as they did)

    /* the text boards: one canvas atlas, one mesh */
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const c2 = cv.getContext('2d'), crm = '#efe3c6';
    const txt = (s, x, y, px, col, w, font) => { c2.fillStyle = col; c2.font = (font || '700 ' + px + 'px Georgia, "Times New Roman", serif'); c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(s, x, y, w); };
    const plank = (x0, y0, w, h, col) => { c2.fillStyle = col; c2.fillRect(x0, y0, w, h); c2.strokeStyle = 'rgba(0,0,0,0.13)'; c2.lineWidth = 3;
      for (let k = 0; k < 14; k++) { const y = y0 + R() * h; c2.beginPath(); c2.moveTo(x0, y); c2.bezierCurveTo(x0 + w * 0.3, y + (R() - 0.5) * 12, x0 + w * 0.7, y + (R() - 0.5) * 12, x0 + w, y + (R() - 0.5) * 8); c2.stroke(); } };
    const ft = (m) => String(Math.round(m * 3.28084)).replace(/\B(?=(\d{3})+(?!\d))/g, ','), alt = (s) => Math.round(T.altAt ? T.altAt(T.hy[T.idx(s)]) : 0);
    plank(0, 0, 1024, 128, '#4a2f1c'); c2.strokeStyle = crm; c2.lineWidth = 6; c2.strokeRect(10, 10, 1004, 108); txt('PIKES PEAK HIGHWAY', 512, 68, 80, crm, 900);   // the canopy fascia
    c2.fillStyle = '#23452f'; c2.fillRect(512, 128, 512, 64); txt('ENTRANCE STATION', 768, 162, 42, '#f2eee2', 490);
    plank(0, 256, 1024, 256, '#5b3b21'); c2.strokeStyle = crm; c2.lineWidth = 10; c2.strokeRect(16, 272, 992, 224);   // Crystal Reservoir
    c2.fillStyle = crm; c2.beginPath(); c2.moveTo(60, 440); c2.lineTo(120, 330); c2.lineTo(160, 390); c2.lineTo(190, 350); c2.lineTo(240, 440); c2.fill();
    c2.fillStyle = '#6fa7cf'; c2.fillRect(52, 446, 196, 24);
    txt('CRYSTAL', 630, 350, 118, crm, 720); txt('RESERVOIR  ·  ' + ft(alt(sStart + 205)) + ' FT', 630, 444, 52, crm, 720);
    { const y0 = 512; c2.fillStyle = '#b9b3a2'; c2.fillRect(0, y0, 1024, 256);   // the old ski area sign: faded paint on grey boards, peeling
      for (let k = 0; k < 5; k++) { c2.fillStyle = k % 2 ? '#aaa493' : '#c2bcaa'; c2.fillRect(0, y0 + k * 51, 1024, 50); }
      c2.fillStyle = '#8a9fb0'; c2.fillRect(24, y0 + 24, 976, 208);
      txt('PIKES PEAK', 512, y0 + 86, 96, '#e9e4d6', 900, '900 96px Arial, sans-serif'); txt('SKI AREA', 512, y0 + 180, 88, '#b04a35', 900, '900 88px Arial, sans-serif');
      for (let k = 0; k < 90; k++) { c2.fillStyle = R() < 0.6 ? 'rgba(190,184,168,0.85)' : 'rgba(120,112,98,0.5)'; c2.fillRect(R() * 1024, y0 + R() * 256, 6 + R() * 50, 3 + R() * 12); }   // peeling
      c2.fillStyle = 'rgba(90,70,50,0.25)'; for (let k = 0; k < 8; k++) c2.fillRect(R() * 1024, y0, 3 + R() * 5, 256); }
    // the Summit Visitor Center's name, cream on dark bronze with a brass rule: the band for its wall and roof (rows 192-256), the monument (rows 768-1024)
    const bronze = (y0, h, lw) => { const gr = c2.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#4c3826'); gr.addColorStop(1, '#2c2015'); c2.fillStyle = gr; c2.fillRect(0, y0, 1024, h);
      c2.strokeStyle = '#c8a266'; c2.lineWidth = lw; c2.strokeRect(lw * 1.5, y0 + lw * 1.5, 1024 - lw * 3, h - lw * 3); };
    bronze(192, 64, 3); txt('SUMMIT VISITOR CENTER', 512, 226, 56, '#f6ebcd', 970, '900 56px Arial, sans-serif');
    bronze(768, 256, 7); txt('SUMMIT', 512, 864, 150, '#f6ebcd', 900, '900 150px Arial, sans-serif'); txt('VISITOR CENTER', 512, 970, 76, '#f6ebcd', 920, '900 76px Arial, sans-serif');
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; K.out.ownTex.push(tx);
    { const mt = new THREE.MeshLambertMaterial({ map: tx });
      mt.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <envmap_fragment>',   // those two rows keep their own colours whatever the light (self-lit)
        '#include <envmap_fragment>\n  outgoingLight = mix( outgoingLight, diffuseColor.rgb, step( vUv.y, 0.2495 ) + step( 0.7505, vUv.y ) * step( vUv.y, 0.812 ) );'); };
      mt.customProgramCacheKey = () => 'pkSignLit';
      tb.addTo(mt); }
  }

  /* ---- mountain weather by altitude: sun in the forest, low cloud drifting over the ridge, light snowfall near the summit;
     wet road below the melting snow banks (built at the end of buildPikes; pkWeatherUpdate runs every frame) ---- */
  function pkWeather(K) {
    const out = K.out, root = K.root, w = K.w, ds = T.ds, s0 = T.startS;   // (the course's d = s - s0)
    // one tileable cloud-noise texture: 4 octaves of periodic value noise (own random stream)
    const NT = 256, cv = document.createElement('canvas'); cv.width = cv.height = NT;
    {
      const R = rng(6611), cx = cv.getContext('2d'), im = cx.createImageData(NT, NT), acc = new Float32Array(NT * NT); let amp = 1, tot = 0;
      for (let o = 0, P = 4; o < 4; o++, P *= 2, amp *= 0.5) {
        const g = new Float32Array(P * P); for (let k = 0; k < g.length; k++) g[k] = R(); tot += amp;
        for (let y = 0; y < NT; y++) for (let x = 0; x < NT; x++) {
          const fx = x / NT * P, fy = y / NT * P, xi = Math.floor(fx), yi = Math.floor(fy), u = fx - xi, v = fy - yi, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v), x1 = (xi + 1) % P, y1 = (yi + 1) % P;
          acc[y * NT + x] += amp * lerp(lerp(g[yi * P + xi], g[yi * P + x1], su), lerp(g[y1 * P + xi], g[y1 * P + x1], su), sv);
        }
      }
      let lo = 1e9, hi = -1e9; for (const v of acc) { lo = Math.min(lo, v); hi = Math.max(hi, v); }   // (stretched to the full range: the octaves average out to a flat grey)
      for (let k = 0; k < NT * NT; k++) { const v = Math.round((acc[k] - lo) / (hi - lo) * 255); im.data[k * 4] = im.data[k * 4 + 1] = im.data[k * 4 + 2] = v; im.data[k * 4 + 3] = 255; }
      cx.putImageData(im, 0, 0);
    }
    const ntex = new THREE.CanvasTexture(cv); ntex.wrapS = ntex.wrapT = THREE.RepeatWrapping; out.ownTex.push(ntex);

    // low cloud over the ridge (Devil's Playground .. Bottomless Pit): two thin blankets draped 3.5 m and 9 m over the ground, their noise drifting with the wind (1 draw)
    const cU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]); let cm = null;
    {
      const sa = s0 + 4010, sb = s0 + 4520, sm = s0 + 4260, along = (s) => sstep(sa, sa + 110, s) * (1 - sstep(sb - 110, sb, s)) * (0.5 + 0.5 * Math.exp(-(((s - sm) / 120) ** 2)));
      const ia = T.idx(sa - 80), ib = T.idx(sb + 80), rs = []; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let i = ia; i <= ib; i += 2) { const a = along(i * ds); rs.push([T.px[i], T.pz[i], T.hy[i], a]); x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
      const C = 8, M = 80, nx = Math.ceil((x1 - x0 + 2 * M) / C) + 1, nz = Math.ceil((z1 - z0 + 2 * M) / C) + 1, bx = x0 - M, bz = z0 - M;
      const env = new Float32Array(nx * nz), gy = new Float32Array(nx * nz);
      for (let b = 0; b < nz; b++) for (let a = 0; a < nx; a++) {
        const x = bx + a * C, z = bz + b * C, y = pkGround(x, z); let e = 0;
        for (const r of rs) { if (!r[3]) continue; const d = Math.hypot(x - r[0], z - r[1]); if (d < 78) e = Math.max(e, r[3] * sstep(78, 38, d) * sstep(-45, -18, y - r[2]) * sstep(60, 30, y - r[2])); }
        env[b * nx + a] = e * sstep(0.9, 0.45, pkSlope(x, z)); gy[b * nx + a] = Math.max(y, pkGround(x + 5, z), pkGround(x - 5, z), pkGround(x, z + 5), pkGround(x, z - 5));   // (the highest ground around: the blanket stays clear of bumps between its vertices)
      }
      const pos = [], ae = [], al = [], idx = [];
      for (let L = 0; L < 2; L++) {
        const vi = new Int32Array(nx * nz).fill(-1), vtx = (k) => { if (vi[k] < 0) { vi[k] = pos.length / 3; pos.push(bx + (k % nx) * C, gy[k] + (L ? 9 : 3.5), bz + Math.floor(k / nx) * C); ae.push(env[k]); al.push(L); } return vi[k]; };
        for (let b = 0; b < nz - 1; b++) for (let a = 0; a < nx - 1; a++) {
          const k = b * nx + a; if (Math.max(env[k], env[k + 1], env[k + nx], env[k + nx + 1]) < 0.02) continue;
          const p = vtx(k), q = vtx(k + 1), r = vtx(k + nx + 1), s = vtx(k + nx); idx.push(p, s, r, p, r, q);
        }
      }
      if (idx.length) {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(ae, 1)); g.setAttribute('aL', new THREE.Float32BufferAttribute(al, 1)); g.setIndex(idx); g.computeBoundingSphere();
        Object.assign(cU, { uTex: { value: ntex }, uC0: { value: new THREE.Vector2((x0 + x1) / 2, (z0 + z1) / 2) }, uO0: { value: new THREE.Vector2() }, uO1: { value: new THREE.Vector2() }, uO2: { value: new THREE.Vector2() } });
        const mat = new THREE.ShaderMaterial({ uniforms: cU, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          vertexShader: 'uniform vec2 uC0, uO0, uO1, uO2; attribute float aE, aL; varying vec2 vA, vB; varying float vE, vL;\n#include <fog_pars_vertex>\n' +
            'void main() { vec2 q = position.xz - uC0; vA = aL > 0.5 ? q / 95.0 + uO2 : q / 70.0 + uO0; vB = q / 26.0 + uO1 + aL * 0.37; vE = aE; vL = aL;\n' +
            'vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
          fragmentShader: 'uniform sampler2D uTex; varying vec2 vA, vB; varying float vE, vL;\n#include <fog_pars_fragment>\n' +
            'void main() { float n = texture2D(uTex, vA).r * 0.65 + texture2D(uTex, vB).r * 0.35; float c = smoothstep(0.6 - 0.2 * vE, 0.78 - 0.1 * vE, n);\n' +
            'gl_FragColor = vec4(mix(vec3(0.74, 0.77, 0.82), vec3(0.97, 0.98, 1.0), smoothstep(0.45, 0.85, n)), c * vE * (vL > 0.5 ? 0.55 : 0.72));\n#include <fog_fragment>\n}' });
        cm = new THREE.Mesh(g, mat); cm.renderOrder = 5; cm.matrixAutoUpdate = false; root.add(cm);
      }
    }

    // light snowfall near the summit: a box of flakes (84 x 27 x 84 m) that follows the car, recycled in the shader; more of them shown the higher the car is (1 draw)
    const NF = 2600, fp = new Float32Array(NF * 3), fr = new Float32Array(NF), BX = 84, BY = 27;
    { const R = rng(6623); for (let k = 0; k < NF; k++) { fp[k * 3] = R() * BX; fp[k * 3 + 1] = R() * BY; fp[k * 3 + 2] = R() * BX; fr[k] = R(); } }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(fp, 3)); sg.setAttribute('aR', new THREE.BufferAttribute(fr, 1)); sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    // (round 7: wind-blown flurries: uWo the wind's drift so far (m, wrapped by the box), uG the gusts' strength, uCol the flakes' colour in the light of the moment (pkLight))
    const sU = { uC: { value: new THREE.Vector3() }, uT: { value: 0 }, uD: { value: 0 }, uS: { value: 400 }, uWo: { value: new THREE.Vector2() }, uG: { value: 0 }, uCol: { value: new THREE.Color(0.97, 0.98, 1.0) } };
    const snow = new THREE.Points(sg, new THREE.ShaderMaterial({ uniforms: sU, transparent: true, depthWrite: false,
      vertexShader: 'uniform vec3 uC; uniform vec2 uWo; uniform float uT, uD, uS, uG; attribute float aR; varying float vA;\n' +
        'void main() { vec3 B = vec3(' + BX.toFixed(1) + ', ' + BY.toFixed(1) + ', ' + BX.toFixed(1) + '); float ph = aR * 43.7, gw = 0.6 + 1.6 * uG;\n' +
        'vec3 p = position + vec3(uWo.x + sin(uT * 0.9 + ph) * gw, -uT * (0.8 + 0.5 * fract(ph)) + sin(uT * 2.3 + ph * 3.1) * 0.5 * uG, uWo.y + cos(uT * 0.7 + ph * 1.3) * gw);\n' +
        'vec3 lo = uC - vec3(B.x * 0.5, 5.0, B.z * 0.5); p = lo + mod(p - lo, B); vec3 r = (p - lo) / B;\n' +
        'vec4 mv = modelViewMatrix * vec4(p, 1.0); float z = -mv.z;\n' +
        'vA = step(aR, uD) * smoothstep(0.0, 0.12, r.x) * smoothstep(1.0, 0.88, r.x) * smoothstep(0.0, 0.12, r.z) * smoothstep(1.0, 0.88, r.z) * smoothstep(0.0, 0.06, r.y) * smoothstep(1.0, 0.8, r.y) * smoothstep(6.0, 14.0, z);\n' +
        'gl_PointSize = vA > 0.0 ? clamp((0.13 + 0.12 * fract(ph * 7.0)) * uS / max(1.0, z), 1.6, 10.0) : 0.0; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uCol; varying float vA; void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; gl_FragColor = vec4(uCol, vA * 0.92 * (1.0 - r * r)); }' }));
    snow.frustumCulled = false; snow.renderOrder = 8; snow.visible = false; root.add(snow);
    snow.onBeforeRender = (r, sc, cam) => { sU.uS.value = r.domElement.height * cam.projectionMatrix.elements[5] / 2; };   // (pixels per metre at 1 m, as Render's particles)

    // wet road below the snow banks, where a bank lies behind the edge (pkSnow's exclusion circles on the bank crests): a dark wet film along the edge and over
    // the gravel strip, puddles in it mirroring the pale morning sky, meltwater rivulets running down across the lane. One mesh: its vertex colours are unlit
    // (wet asphalt and the sky it mirrors look the same in the sun and in the shade), only the sun's glint on the water is lit
    {
      const R = rng(6637), R2 = rng(6653), gw = new GB(false, true), lump = valueNoise2(6641, 7), wet = [new Float32Array(T.N), new Float32Array(T.N)], i0 = T.idx(s0 + 4400);
      const WA = [0.06, 0.068, 0.085], SKY = [0.66, 0.73, 0.86], DEEP = [0.13, 0.16, 0.22], C = (c, a) => [c[0], c[1], c[2], a], pud = [];
      for (const e of K.excl) {
        if (e.r !== 3.2 || !K.crSoft.has(e)) continue;
        let bi = -1, bd = 1e9; for (let i = i0; i < T.N; i++) { const d = (e.x - T.px[i]) ** 2 + (e.z - T.pz[i]) ** 2; if (d < bd) { bd = d; bi = i; } }
        if (bi < 0 || bd > 22 * 22) continue;
        const sd = (e.x - T.px[bi]) * T.nx[bi] + (e.z - T.pz[bi]) * T.nz[bi] > 0 ? 1 : 0, n = Math.round(9 / ds);
        for (let k = -n; k <= n; k++) { const i = bi + k; if (i >= 0 && i < T.N) wet[sd][i] = Math.max(wet[sd][i], 1 - sstep(n * 0.25, n, Math.abs(k))); }
        pud.push(bi, sd);
        if (R() < 0.3) {   // a rivulet: from the edge downhill (towards the start) and across the lane, meandering, now wider, now thinner; soft edges
          const side = sd ? 1 : -1, acr = 3 + R() * 8, L = acr * (1.3 + R() * 1.6), wd = 0.45 + R() * 0.4, ph = R() * TAU, m = 1 + R() * 1.5, st = Math.max(1, Math.round(1 / ds)), a0 = 0.6 + R() * 0.15;
          let prev = null;
          for (let k = 0; k * ds <= L; k += st) {
            const u = k * ds / L, i = bi - k; if (i < 1) break;
            const o = side * (w - 0.3 - u * acr) + Math.sin(u * TAU * m + ph) * 0.35, hw = wd * (1 - u * 0.4) * (0.55 + 0.9 * lump(k * ds * 1.3, 40 + ph * 9)), y = T.hy[i] + 0.05, a = 0.85 * a0 * (1 - sstep(0.6, 1, u)) * sstep(0, 0.08, u + 0.02);
            const P = (dl) => [T.px[i] + T.nx[i] * (o + dl), y, T.pz[i] + T.nz[i] * (o + dl)], cur = [P(-hw), P(-hw * 0.3), P(hw * 0.3), P(hw), a];
            if (prev) { const p = prev[4], cs = [[C(WA, 0), C(WA, 0)], [C(WA, p), C(WA, a)], [C(WA, p), C(WA, a)], [C(WA, 0), C(WA, 0)]];
              for (let q = 0; q < 3; q++) gw.quadUp(prev[q], prev[q + 1], cur[q + 1], cur[q], [cs[q][0], cs[q + 1][0], cs[q + 1][1], cs[q][1]]); }
            prev = cur;
          }
        }
      }
      // the film along the edges (2 m steps): over the gravel strip, full at the edge line, feathered out 1.3-4.3 m into the lane; in patches
      const st = Math.max(1, Math.round(2 / ds));
      for (const sd of [0, 1]) {
        const side = sd ? 1 : -1, W = wet[sd]; let prev = null;
        for (let i = i0; i < T.N; i += st) {
          const a = W[i] * 0.72 * sstep(0.12, 0.62, lump(i * ds * 0.8, side * 5 + 3)); if (a <= 0 && (!prev || prev[4] <= 0)) { prev = null; continue; }
          const s = i * ds, wd = 1.3 + 3 * lump(s, side * 11), y = T.hy[i] + 0.05, P = (o) => [T.px[i] + T.nx[i] * side * o, y, T.pz[i] + T.nz[i] * side * o], cur = [P(w + 0.8), P(w - 0.02), P(w - wd * 0.6), P(w - wd), a];
          if (prev) { const p = prev[4], cs = [[C(WA, p * 0.7), C(WA, a * 0.7)], [C(WA, p), C(WA, a)], [C(WA, p * 0.9), C(WA, a * 0.9)], [C(WA, 0), C(WA, 0)]];
            for (let q = 0; q < 3; q++) gw.quadUp(prev[q], prev[q + 1], cur[q + 1], cur[q], [cs[q][0], cs[q + 1][0], cs[q + 1][1], cs[q][1]]); }
          prev = cur;
        }
      }
      // puddles in the film by about every third bank piece's stretch: long and lopsided along the edge, a dark wet rim, the water dark where it mirrors the
      // ground and pale with the sky towards its northern edge (the high cameras look north), a soft edge
      for (let k = 0; k < pud.length; k += 2) {
        if (R2() > 0.36) continue;
        const bi = pud[k], side = pud[k + 1] ? 1 : -1, i = clamp(bi + Math.round((R2() - 0.5) * 6 / ds), 1, T.N - 2), o = side * (w - 0.45 - R2() * 1.6), L = 1.4 + R2() * 1.8, Wd = 0.38 + R2() * 0.4;
        if (wet[pud[k + 1]][i] < 0.5) continue;
        const cx = T.px[i] + T.nx[i] * o, cz = T.pz[i] + T.nz[i] * o, y = T.hy[i] + 0.055, n = 14, p1 = R2() * TAU, p2 = R2() * TAU, rr = [];
        for (let q = 0; q < n; q++) { const t = q / n * TAU; rr.push([Math.cos(t), Math.sin(t), 1 + 0.2 * Math.sin(2 * t + p1) + 0.12 * Math.sin(3 * t + p2)]); }   // a lopsided blob
        const ring = (f) => rr.map(([c0, s0, r]) => { const c = c0 * L * r * f, d = s0 * Wd * r * f; return [cx + T.tx[i] * c + T.nx[i] * d, y, cz + T.tz[i] * c + T.nz[i] * d]; });
        const A = ring(0.8), B = ring(1.0), D = ring(1.4), mid = [cx, y, cz], mx = (f) => [DEEP[0] + (SKY[0] - DEEP[0]) * f, DEEP[1] + (SKY[1] - DEEP[1]) * f, DEEP[2] + (SKY[2] - DEEP[2]) * f];
        const nr = Math.max(...A.map(p => cz - p[2])) || 1, sk = (q) => { const f = clamp(0.5 + 0.5 * (cz - A[q][2]) / nr, 0, 1); return C(mx(0.12 + 0.88 * f * f), 0.66); }, cB = C(WA, 0.55), cD = C(WA, 0);
        for (let q = 0; q < n; q++) { const q1 = (q + 1) % n;
          gw.triO(mid, A[q], A[q1], C(mx(0.38), 0.64), [cx, y - 5, cz], sk(q), sk(q1)); gw.quadUp(A[q], B[q], B[q1], A[q1], [sk(q), cB, cB, sk(q1)]); gw.quadUp(B[q], D[q], D[q1], B[q1], [cB, cD, cD, cB]); }
      }
      if (!gw.empty) {
        const mt = new THREE.MeshPhongMaterial({ vertexColors: true, transparent: true, depthWrite: false, shininess: 28, specular: 0x9aa3ae, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
        mt.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <envmap_fragment>', 'outgoingLight = diffuseColor.rgb + reflectedLight.directSpecular;'); };   // (unlit colour + the sun's glint)
        mt.customProgramCacheKey = () => 'pkWet';
        const m = new THREE.Mesh(gw.geometry(), mt); m.receiveShadow = true; m.renderOrder = 1; m.matrixAutoUpdate = false; root.add(m); }
    }
    // (round 7) the weather of the altitude, visual only; pkWeatherUpdate picks it per run from the race's seed (pkLight hands it over with the season and the rain).
    // A band of mist over the middle of the course (Glen Cove .. the W's, ground 168-266 m): two thin blankets draped 2.5 m and 7 m over the ground, drawn only
    // between the run's cloud base and top (uY) with soft edges, their noise drifting across the road with the wind (1 draw, only near the band on a misty run)
    const mU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]); let mm = null;
    {
      let i0 = -1, i1 = -1; for (let i = 0; i < T.N; i++) if (T.hy[i] > 160 && T.hy[i] < 274) { if (i0 < 0) i0 = i; i1 = i; }
      const st = Math.max(1, Math.round(5 / ds)), C = 8, M = 82; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let i = i0; i <= i1; i += st) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
      const nx = Math.ceil((x1 - x0 + 2 * M) / C) + 1, nz = Math.ceil((z1 - z0 + 2 * M) / C) + 1, bx = x0 - M, bz = z0 - M, dm = new Float32Array(nx * nz).fill(1e9), dh = new Float32Array(nx * nz);
      for (let i = i0; i <= i1; i += st) {   // (the nearest road sample of each grid point within 78 m: stamped around the road)
        const a0 = Math.max(0, Math.floor((T.px[i] - 78 - bx) / C)), a1 = Math.min(nx - 1, Math.ceil((T.px[i] + 78 - bx) / C)), b0 = Math.max(0, Math.floor((T.pz[i] - 78 - bz) / C)), b1 = Math.min(nz - 1, Math.ceil((T.pz[i] + 78 - bz) / C));
        for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) { const k = b * nx + a, d = Math.hypot(bx + a * C - T.px[i], bz + b * C - T.pz[i]); if (d < dm[k]) { dm[k] = d; dh[k] = T.hy[i]; } }
      }
      const env = new Float32Array(nx * nz), gy = new Float32Array(nx * nz);
      for (let k = 0; k < nx * nz; k++) { if (dm[k] > 78) continue; const x = bx + (k % nx) * C, z = bz + Math.floor(k / nx) * C, y = pkGround(x, z);
        env[k] = sstep(78, 34, dm[k]) * sstep(-45, -18, y - dh[k]) * sstep(55, 28, y - dh[k]) * sstep(0.9, 0.45, pkSlope(x, z));
        if (env[k] > 0) gy[k] = Math.max(y, pkGround(x + 5, z), pkGround(x - 5, z), pkGround(x, z + 5), pkGround(x, z - 5)); }
      const pos = [], ae = [], al = [], idx = [], qc = [];
      for (let L = 0; L < 2; L++) {
        const vi = new Int32Array(nx * nz).fill(-1), vtx = (k) => { if (vi[k] < 0) { vi[k] = pos.length / 3; pos.push(bx + (k % nx) * C, gy[k] + (L ? 7 : 2.5), bz + Math.floor(k / nx) * C); ae.push(env[k]); al.push(L); } return vi[k]; };
        for (let b = 0; b < nz - 1; b++) for (let a = 0; a < nx - 1; a++) {
          const k = b * nx + a; if (Math.min(env[k], env[k + 1], env[k + nx], env[k + nx + 1]) <= 0 || Math.max(env[k], env[k + 1], env[k + nx], env[k + nx + 1]) < 0.02) continue;
          const p = vtx(k), q = vtx(k + 1), r = vtx(k + nx + 1), s = vtx(k + nx); idx.push(p, s, r, p, r, q); qc.push(bx + (a + 0.5) * C, bz + (b + 0.5) * C, (gy[k] + gy[k + 1] + gy[k + nx] + gy[k + nx + 1]) / 4);
        }
      }
      if (idx.length) {   // (all the quads in qi, [x, z, ground] of each in qc; the index buffer holds those near the car in the run's band: pkWeatherUpdate)
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(ae, 1)); g.setAttribute('aL', new THREE.Float32BufferAttribute(al, 1));
        const ix = new THREE.BufferAttribute(new Uint32Array(idx.length), 1); ix.setUsage(THREE.DynamicDrawUsage); g.setIndex(ix); g.setDrawRange(0, 0); g.computeBoundingSphere(); mU.qi = new Uint32Array(idx); mU.qc = new Float32Array(qc);
        Object.assign(mU, { uTex: { value: ntex }, uC0: { value: new THREE.Vector2((x0 + x1) / 2, (z0 + z1) / 2) }, uO0: { value: new THREE.Vector2() }, uO1: { value: new THREE.Vector2() }, uY: { value: new THREE.Vector2(200, 220) }, uA: { value: 0 }, uCol: { value: new THREE.Color(0.85, 0.87, 0.9) } });
        const mat = new THREE.ShaderMaterial({ uniforms: mU, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          vertexShader: 'uniform vec2 uC0, uO0, uO1, uY; attribute float aE, aL; varying vec2 vA, vB; varying float vE, vL;\n#include <fog_pars_vertex>\n' +
            'void main() { vec2 q = position.xz - uC0; vA = vec2(q.x * 0.8 - q.y * 0.6, q.x * 0.6 + q.y * 0.8) * vec2(1.0 / 60.0, 1.0 / 26.0) + uO0 + aL * 0.41; vB = q / 17.0 + uO1 + aL * 0.23;\n' +   // (wisps stretched along the wind)
            'float gh = position.y - (aL > 0.5 ? 7.0 : 2.5); vE = aE * smoothstep(uY.x - 10.0, uY.x + 4.0, gh) * (1.0 - smoothstep(uY.y - 4.0, uY.y + 10.0, gh)); vL = aL;\n' +
            'vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
          fragmentShader: 'uniform sampler2D uTex; uniform vec3 uCol; uniform float uA; varying vec2 vA, vB; varying float vE, vL;\n#include <fog_pars_fragment>\n' +
            'void main() { float n = texture2D(uTex, vA).r * 0.6 + texture2D(uTex, vB).r * 0.4; float c = smoothstep(0.42 - 0.12 * vE, 0.74 - 0.08 * vE, n);\n' +
            'gl_FragColor = vec4(uCol * (0.94 + 0.1 * smoothstep(0.5, 0.85, n)), c * vE * uA * (vL > 0.5 ? 0.36 : 0.44));\n#include <fog_fragment>\n}' });
        mm = new THREE.Mesh(g, mat); mm.renderOrder = 5; mm.matrixAutoUpdate = false; mm.visible = false; root.add(mm);
      }
    }
    // spindrift near the summit (road above ~322 m): streaks of snow dust blown across the road and its shoulders, a strip lying on the road (flat across it, as
    // the road), its noise stretched along the wind and racing with it (1 draw, only up there)
    const dU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]); let dmesh = null;
    {
      let i0 = T.N; for (let i = 0; i < T.N; i++) if (T.hy[i] > 322) { i0 = i; break; }
      const st = Math.max(1, Math.round(3 / ds)), W = w + 2.4, X = [-1, -0.5, 0, 0.5, 1], pos = [], ax = [], idx = []; let n = 0, cx = 0, cz = 0;
      for (let i = i0; i < T.N; i += st, n++) { for (const f of X) { pos.push(T.px[i] + T.nx[i] * f * W, T.hy[i] + 0.16, T.pz[i] + T.nz[i] * f * W); ax.push(f); } cx += T.px[i]; cz += T.pz[i];
        if (n) { const o = (n - 1) * 5; for (let q = 0; q < 4; q++) idx.push(o + q, o + q + 5, o + q + 6, o + q, o + q + 6, o + q + 1); } }
      if (n > 1) {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aX', new THREE.Float32BufferAttribute(ax, 1)); g.setIndex(idx); g.computeBoundingSphere();
        Object.assign(dU, { uTex: { value: ntex }, uC0: { value: new THREE.Vector2(cx / n, cz / n) }, uO: { value: new THREE.Vector2() }, uA: { value: 0 }, uCol: { value: new THREE.Color(0.95, 0.97, 1.0) } });
        const mat = new THREE.ShaderMaterial({ uniforms: dU, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
          vertexShader: 'uniform vec2 uC0, uO; attribute float aX; varying vec2 vA, vB; varying float vE;\n#include <fog_pars_vertex>\n' +
            'void main() { vec2 q = position.xz - uC0, r = vec2(q.x * 0.8 - q.y * 0.6, q.x * 0.6 + q.y * 0.8);\n' +   // (r.x along the wind, r.y across it)
            'vA = vec2(r.x / 38.0 - uO.x, r.y / 4.5); vB = vec2(r.x / 15.0 - uO.y, r.y / 2.2 + 0.37); vE = (1.0 - smoothstep(0.7, 1.0, abs(aX))) * smoothstep(322.0, 338.0, position.y);\n' +
            'vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
          fragmentShader: 'uniform sampler2D uTex; uniform vec3 uCol; uniform float uA; varying vec2 vA, vB; varying float vE;\n#include <fog_pars_fragment>\n' +
            'void main() { float n = texture2D(uTex, vA).r * 0.55 + texture2D(uTex, vB).r * 0.45; float c = smoothstep(0.58 - 0.08 * uA, 0.84, n);\n' +
            'gl_FragColor = vec4(uCol, c * vE * uA * 0.45);\n#include <fog_fragment>\n}' });
        dmesh = new THREE.Mesh(g, mat); dmesh.renderOrder = 2; dmesh.matrixAutoUpdate = false; dmesh.visible = false; root.add(dmesh); dU.rows = [i0, st, n, T];   // (the rows near the car are drawn: pkWeatherUpdate)
      }
    }
    out.dust = [0.86, 0.76, 0.62];   // Render: pale granite dust behind wheels off the asphalt
    out.dyn.pkWx = { cU, cm, sU, snow, mU, mm, dU, dm: dmesh };
  }

  function pkWeatherUpdate(wx, t, car) {
    const fr = (v) => v - Math.floor(v);
    if (wx.cm) {   // the cloud noise drifts with the wind (~4 m/s towards the north-east, as the cloud shadows); the detail at another speed, so the banks change shape
      wx.cU.uO0.value.set(fr(-t * 3.2 / 70), fr(t * 2.5 / 70)); wx.cU.uO2.value.set(fr(-t * 4.1 / 95), fr(t * 3.0 / 95)); wx.cU.uO1.value.set(fr(-t * 2.4 / 26), fr(t * 3.1 / 26));
    }
    // (round 7) the run's weather on the way up, visual only: picked from the race's seed (wx.env: seed, winter, rain, handed over by Render's pkLight);
    // eased in time, set at once when the car jumps (start, rescue, another car)
    const dt = clamp(t - (wx.t == null ? t : wx.t), 0, 0.25), E = wx.env || {}, r = E.r || 0; wx.t = t;
    if (wx.sd !== (E.seed | 0) || !wx.pk) { const sd = wx.sd = E.seed | 0, h = (k) => { let x = Math.imul(sd ^ 0x5bd1e995, 374761393) + Math.imul(k, 668265263) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
      const y0 = 172 + h(2) * 58; wx.pk = { mist: h(1), y0, y1: y0 + 18 + h(3) * 14, mA: 0.75 + 0.25 * h(4), fl: h(5), p1: h(6) * TAU, p2: h(7) * TAU }; wx.jmp = true; }
    const P = wx.pk, y = car ? car.roadY || 0 : 0, jmp = !car || wx.jmp || (car.x - wx.cx) ** 2 + (car.z - wx.cz) ** 2 > 2500, ez = (v, g, k) => jmp ? g : v + (g - v) * Math.min(1, dt * k);
    wx.jmp = false; if (car) { wx.cx = car.x; wx.cz = car.z; }
    // the band of mist (about half the runs, most in the rain): the blankets between its base and top; wx.mist, the car in it, thins the view (pkLight)
    wx.mA = ez(wx.mA || 0, P.mist < (r > 0 ? 0.85 : 0.5) ? P.mA : 0, 0.4);
    wx.mist = ez(wx.mist || 0, car ? wx.mA * sstep(P.y0 - 9, P.y0 + 3, y) * (1 - sstep(P.y1 - 3, P.y1 + 9, y)) : 0, 1.2);
    // flurries above ~330 m: in patches along the way (dry: not every run, and then not everywhere), more in winter, always in the rain (it snows up there)
    const alt = sstep(328, 346, y) * lerp(0.35, 1, sstep(346, 430, y)), g = sstep(0.3, 0.72, 0.5 + 0.32 * Math.sin(y / 6 + P.p1) + 0.2 * Math.sin(y / 2.3 + P.p2));
    const fl = wx.fl = ez(wx.fl || 0, car ? alt * Math.max(E.win ? 0.5 + 0.5 * g : P.fl < 0.3 ? 0.15 * g : g * (0.45 + 0.55 * P.fl), Math.min(1, r * 2)) : 0, 0.7);
    const sp = wx.sp = ez(wx.sp || 0, car ? Math.min(1, sstep(322, 342, y) * (E.win ? 0.55 : 0.28) + 0.75 * fl) : 0, 0.7);   // spindrift: the wind lifts the lying snow, the more in a flurry
    const ws = wx.ws = ez(wx.ws || 2.5, 2.5 + 7 * fl + 2 * sp, 0.5), wo = wx.sU.uWo.value;   // the wind (m/s, towards the south-east as the flakes always blew)
    wo.set((wo.x + 0.8 * ws * dt) % 84, (wo.y - 0.6 * ws * dt) % 84);
    const d = fl > 0.01 ? fl : 0;
    wx.snow.visible = d > 0; wx.sU.uD.value = d; wx.sU.uG.value = fl;
    if (d > 0) { wx.sU.uC.value.set(car.x, y, car.z); wx.sU.uT.value = t % 1000; }
    if (wx.mm) { const on = wx.mm.visible = wx.mA > 0.01 && y > P.y0 - 120 && y < P.y1 + 120, U = wx.mU;
      if (on) { U.uY.value.set(P.y0, P.y1); U.uA.value = wx.mA; U.uO0.value.set(fr(-t * 1.6 / 60), fr(t * 0.2 / 26)); U.uO1.value.set(fr(-t * 1.1 / 17), fr(t * 0.8 / 17));
        if (wx.mq !== P || (car.x - wx.mx) ** 2 + (car.z - wx.mz) ** 2 > 400) {   // (the quads within 170 m of the car, in the band: again after every 20 m)
          wx.mq = P; wx.mx = car.x; wx.mz = car.z; const ix = wx.mm.geometry.index, D = ix.array, qi = U.qi, qc = U.qc; let n = 0;
          for (let q = 0, m = qc.length / 3; q < m; q++) { const gh = qc[q * 3 + 2]; if (gh < P.y0 - 14 || gh > P.y1 + 14 || (qc[q * 3] - car.x) ** 2 + (qc[q * 3 + 1] - car.z) ** 2 > 28900) continue; for (let j = 0; j < 6; j++) D[n++] = qi[q * 6 + j]; }
          ix.updateRange.offset = 0; ix.updateRange.count = n; ix.needsUpdate = true; wx.mm.geometry.setDrawRange(0, n); wx.mn = n; }
        wx.mm.visible = wx.mn > 0; } }
    if (wx.dm) { const on = wx.dm.visible = sp > 0.01 && y > 300, U = wx.dU;
      if (on) { U.uA.value = sp; wx.dO = (wx.dO || 0) + ws * dt; U.uO.value.set(fr(wx.dO * 1.3 / 38), fr(wx.dO * 1.6 / 15));
        const [i0, st, n, TT] = U.rows, row = Math.round((TT.idx(car.q ? car.q.s : 0) - i0) / st), a = clamp(row - 60, 0, n - 1), b = clamp(row + 60, 0, n - 1);   // (the rows within ~180 m)
        wx.dm.geometry.setDrawRange(a * 24, (b - a) * 24); wx.dm.visible = b > a; } }
  }

  /* ---- race-day animation: the marshals wave their flags as the car goes by (pkOpsUpdate runs every frame when out.dyn.pkOps is set) ---- */
  function pkOpsCast(ops, cam, car) {   // (out.dyn.afterCam: Render.frame calls it once the camera has moved for this frame, so a jump of the camera (rescue, start, restart, another view) casts right away)
    if (ops.cast) {   // the scenery chunks cast their shadows only where these can fall into the view: the chunk swept 60 m away from the sun meets the camera's
      // frustum (the sun's shadow map covers a box much larger than the view, a low sun's far longer still). Everything casts without a car or a camera
      const C = ops.cast; cam = cam && cam.isCamera ? cam : null;
      if (!C.sun && cam && typeof Render !== 'undefined' && Render.scene) Render.scene.traverse(o => { if (o.isDirectionalLight && o.castShadow) C.sun = o; });
      const all = !car || !cam || !C.sun;
      if (!all) { cam.updateMatrixWorld(); C.fr.setFromProjectionMatrix(C.pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)); C.v.subVectors(C.sun.position, C.sun.target.position).normalize(); }
      for (const [m, b] of C.list) { if (all) { m.castShadow = true; continue; } C.sp.center.copy(b.center).addScaledVector(C.v, -30); C.sp.radius = b.radius + 30; m.castShadow = C.fr.intersectsSphere(C.sp); }
    }
  }
  function pkOpsUpdate(ops, t, car) {
    const dt = clamp(t - ops.t, 0, 0.1); ops.t = t;
    if (!car) { pkOpsCast(ops, null, null); return; }   // (no car: everything casts, as built; the world's fingerprint does not depend on the last view)
    const cx = car.x, cz = car.z, vx = car.vx || 0, vz = car.vz || 0;
    if (ops.fm) {   // flags: held out low; from ~60 m the arm goes up and waves, frantic while the car comes (and right by it), calmer once it has passed
      const E = ops.fm.instanceMatrix.array; let vis = false, ch = false;
      for (let k = 0; k < ops.F.length; k++) { const f = ops.F[k], dx = f.x - cx, dz = f.z - cz, d2 = dx * dx + dz * dz;
        if (d2 > 25000) { if (f.on) { f.lv = f.fr = 0; ops.flagM(E, k * 16, f, 0, -1.7); f.on = false; ch = true; } continue; }
        vis = true; const d = Math.sqrt(d2), goal = 1 - sstep(52, 66, d), fg = d < 16 || dx * vx + dz * vz > 0 ? 1 : 0;
        f.lv += (goal - f.lv) * Math.min(1, dt * 3.5); f.fr += (fg * goal - f.fr) * Math.min(1, dt * 2.2); f.ph += dt * lerp(4, 12, f.fr);
        if (f.lv < 0.002 && !f.on) continue;
        const th = f.lv * lerp(0.4, 0.85, f.fr) * Math.sin(f.ph), phi = lerp(-1.7, -0.18, f.lv) + f.lv * f.fr * 0.15 * Math.sin(f.ph * 2 + 1);
        ops.flagM(E, k * 16, f, th, phi); f.on = f.lv >= 0.002; ch = true; }
      ops.fm.visible = vis; if (ch) ops.fm.instanceMatrix.needsUpdate = true;
    }
    if (ops.lm) {   // light bars: the lamps flash in turn (double flash), only those near the car are updated
      const C = ops.lm.instanceColor.array; let vis = false;
      for (let k = 0; k < ops.L.length; k++) { const l = ops.L[k], dx = l.p[0] - cx, dz = l.p[2] - cz; if (dx * dx + dz * dz > 40000) continue;
        vis = true; const ph = (t * 1.8 + (l.k % 2) * 0.5) % 1, on = ph < 0.16 || (ph > 0.26 && ph < 0.44), b = on ? 1.4 : 0.28;
        C[k * 3] = Math.min(1, l.cl[0] * b); C[k * 3 + 1] = Math.min(1, l.cl[1] * b); C[k * 3 + 2] = Math.min(1, l.cl[2] * b); }
      ops.lm.visible = vis; if (vis) ops.lm.instanceColor.needsUpdate = true;
    }
    if (ops.hp) {   // the hairpins' crowds: when the car is near, the ones on the grass stand up and everyone near joins the cheering (the shared crowd shader
      // leaves ~28% out by a phase hash: their phase is nudged); pose + phase are per instance (aCrowd.x), swapped back when the car has gone
      if (!ops.hpInit) { ops.hpInit = true; const grp = ops.root.getObjectByName('crowds');
        if (grp) for (const im of grp.children) { const at = im.geometry && im.geometry.getAttribute('aCrowd'); if (!at || !im.isInstancedMesh) continue; const M = im.instanceMatrix.array, A = at.array, ox = im.position.x, oz = im.position.z;
          for (let q = 0; q < im.count; q++) { const x = M[q * 16 + 12] + ox, z = M[q * 16 + 14] + oz, W = ops.own;
            let crew = false; if (W) for (let k = 0; k < W.length; k += 2) if (Math.abs(W[k] - x) < 0.01 && Math.abs(W[k + 1] - z) < 0.01) crew = true; if (crew) continue;   // (the vehicles' crews keep calm)
            for (const h of ops.hp) { if ((x - h.x) ** 2 + (z - h.z) ** 2 > 1100) continue;
              const a0 = A[q * 2], v = A[q * 2 + 1], pose = Math.floor(a0); if (pose === 5) break;
              const ok = (fr) => { const e = fr * 6.2832 * 2.713 + v * 0.0171, u = e - Math.floor(e); return u > 0.36 && u < 0.97; };
              let fr = a0 - pose; for (let n = 0; n < 60 && !ok(fr); n++) fr = (fr + 0.0137) % 0.997;
              const a1 = (pose === 6 ? 1 : pose) + fr; if (a1 !== a0) { if (!h.it) h.it = []; h.it.push(A, q * 2, a0, a1, at); } break; } } } }
      for (const h of ops.hp) { if (!h.it) continue; const on = (h.x - cx) ** 2 + (h.z - cz) ** 2 < 8100; if (on === h.st) continue; h.st = on;
        for (let k = 0; k < h.it.length; k += 5) { h.it[k][h.it[k + 1]] = on ? h.it[k + 3] : h.it[k + 2]; h.it[k + 4].needsUpdate = true; } }
    }
  }

  /* ---- round 3 of the real course: boards with the real turn numbers at the bigger corners (T.def.turnNos), the timing tower and the
     podium at the summit, more named places (Engineer's Corner, Brown Bush, Cove Creek, the rocks of Devil's Playground); own random stream ---- */
  function pkLandmarks3(K) {
    const R = rng(9811), { scen, excl, sStart: S0, sFin, CR } = K, gy = pkGround, tb = K.txt(), W1 = [1, 1, 1], PI = Math.PI;
    // local frame beyond the barrier at road s on 'side' (as in pkLandmarks): at(u, v) -> [x, z], u along the road, v out from the barrier line; dir(a): a rad from the road's heading towards +v
    const fr = (s, side) => { const q = crAt(clamp(s, 0, T.len - 0.01)), bar = side > 0 ? q.br : q.bl, tx = q.tx, tz = q.tz, ox = q.nx * side, oz = q.nz * side, x0 = q.px + ox * bar, z0 = q.pz + oz * bar, hy = q.hy;
      const dir = (a) => [tx * Math.cos(a || 0) + ox * Math.sin(a || 0), tz * Math.cos(a || 0) + oz * Math.sin(a || 0)], at = (u, v) => [x0 + tx * u + ox * v, z0 + tz * u + oz * v];
      return { at, dir, rot: (a) => { const d = dir(a); return Math.atan2(d[1], d[0]); }, hy, bar }; };
    const hard = (x, z, skip) => { for (const e of excl) if (e !== skip && !K.crSoft.has(e) && (x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };   // buildings, pads, landmarks (not the crowds' tree-only circles)
    const busy = (x, z, r) => { const cx = Math.floor(x / 0.8), cz = Math.floor(z / 0.8), n = Math.ceil(r / 0.8);   // a spectator within r
      for (let a = -n; a <= n; a++) for (let b = -n; b <= n; b++) { const L = CR.sp.get((cx + a) + ',' + (cz + b)); if (L) for (let q = 0; q < L.length; q += 2) if ((x - L[q]) ** 2 + (z - L[q + 1]) ** 2 < r * r) return true; }
      return false; };
    const free = (P, strict, skip) => P.every(([x, z]) => pkNear(x, z).dd >= 1.5 && (strict ? !K.excluded(x, z) : !hard(x, z, skip) && !busy(x, z, 0.9)));   // off the road; clear of all the scenery (strict) or of the buildings and the people
    const lo = (P) => Math.min(...P.map(p => gy(p[0], p[1]))), hi = (P) => Math.max(...P.map(p => gy(p[0], p[1])));
    const ring = (x, z, r) => [[x, z], [x + r, z], [x - r, z], [x, z + r], [x, z - r]];
    const ex = (x, z, r) => excl.push({ x, z, r });
    const info = K.out.pkL3 = { turns: [], signs: [], tors: 0, culv: [], eng: [] }, where = (x, z) => { const n = pkNear(x, z); return [Math.round(n.i * T.ds), +n.lat.toFixed(1)]; };   // (where things went, for the tests and the screenshot tools: [s, lateral])
    const sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k], gcol = (x, z) => sh(pkGCol(x, z), pkGMean);   // (gcol: the terrain's own shade there)
    const rod = (g, a, b, w, col) => {   // square bar from a to b, w thick
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[2]), s = l > 1e-4 ? [-d[2] / l, 0, d[0] / l] : [1, 0, 0], L = Math.hypot(...d) || 1, f = [d[0] / L, d[1] / L, d[2] / L];
      const u = [s[1] * f[2] - s[2] * f[1], s[2] * f[0] - s[0] * f[2], s[0] * f[1] - s[1] * f[0]], P = (p, i, j) => [p[0] + (s[0] * i + u[0] * j) * w / 2, p[1] + (s[1] * i + u[1] * j) * w / 2, p[2] + (s[2] * i + u[2] * j) * w / 2];
      const inn = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      for (const [i0, j0, i1, j1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) g.quadO(P(a, i0, j0), P(a, i1, j1), P(b, i1, j1), P(b, i0, j0), col, inn); };
    const bush = (g, x, y, z, r, sy, col) => {   // a clump of twigs and leaves, domed, its edge a little ragged (24 faces): six lobes round it, darker in the dips between them, lit on top, dark below; y: its foot
      const a0 = R() * TAU, h = r * sy, yc = y + h * 0.42, top = [x + (R() - 0.5) * r * 0.25, yc + h * 0.62, z + (R() - 0.5) * r * 0.25], bot = [x, yc - h * 0.42, z], inn = [x, yc, z], ps = [], cs = [], ct = sh(col, 1.18), cb = sh(col, 0.55);
      for (let k = 0; k < 12; k++) { const a = a0 + (k + (R() - 0.5) * 0.3) / 12 * TAU, lobe = k % 2 === 0, rr = r * (lobe ? 0.95 + R() * 0.2 : 0.8);
        ps.push([x + Math.cos(a) * rr, yc + (lobe ? 0.02 : 0.12) * h + (R() - 0.5) * h * 0.12, z + Math.sin(a) * rr]); cs.push(sh(col, lobe ? 1 : 0.84)); }
      for (let k = 0; k < 12; k++) { const j = (k + 1) % 12; g.triO(ps[k], top, ps[j], cs[k], inn, ct, cs[j]); g.triO(ps[k], ps[j], bot, cs[k], inn, cs[j], cb); } };
    const peb = (g, x, y, z, r, col) => {   // a stone lying on the ground: a low five-sided cap (5 faces), sunk a little
      const a0 = R() * TAU, top = [x + (R() - 0.5) * r * 0.3, y + r * (0.3 + R() * 0.22), z + (R() - 0.5) * r * 0.3], ps = [], inn = [x, y - r, z], ct = sh(col, 1.12), cb = sh(col, 0.72);
      for (let k = 0; k < 5; k++) { const a = a0 + k / 5 * TAU, rr = r * (0.75 + R() * 0.45); ps.push([x + Math.cos(a) * rr, y - 0.04, z + Math.sin(a) * rr]); }
      for (let k = 0; k < 5; k++) g.triO(ps[k], top, ps[(k + 1) % 5], cb, inn, ct, cb); };
    // atlas cells (px): the turn boards 128 x 80 (8 a row, rows 0-4; the podium's step numbers the last three), the brown signs 512 x 128, the tower's fascia 512 x 48,
    // the results screen and the podium's backdrop 512 x 256
    const cell = (k) => [(k % 8) * 128 + 1, Math.floor(k / 8) * 80 + 1, (k % 8) * 128 + 127, Math.floor(k / 8) * 80 + 79], ins = (r) => [r[0] + 2, r[1] + 2, r[2] - 2, r[3] - 2];
    const AT = { eng: [0, 400, 512, 528], brown: [512, 400, 1024, 528], cove: [0, 528, 512, 656], fascia: [512, 528, 1024, 576], screen: [0, 656, 512, 912], back: [512, 656, 1024, 912] };
    const tq = (cx, cy, cz, fx, fz, W, H, r, tilt, back) => {   // text board (bottom centre cx, cy, cz) facing (fx, fz), its top leaning back by tilt; r: atlas rect [x0, y0, x1, y1] (px);
      // back: a plain colour for its back (in the scenery), 0: none (on a wall), else the text again (readable from behind)
      const ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), ux = fz, uz = -fx, kx = -fx * H * sa, ky = H * ca, kz = -fz * H * sa, nX = fx * ca, nY = sa, nZ = fz * ca;
      const u0 = r[0] / 1024, u1 = r[2] / 1024, v1 = 1 - r[1] / 1024, v0 = 1 - r[3] / 1024, m = [cx + kx / 2, cy + ky / 2, cz + kz / 2];
      const Q = (f, o) => { const hw = W / 2 * f, A = [cx + nX * o - ux * hw, cy + nY * o, cz + nZ * o - uz * hw], B = [cx + nX * o + ux * hw, cy + nY * o, cz + nZ * o + uz * hw]; return [A, B, [B[0] + kx, B[1] + ky, B[2] + kz], [A[0] + kx, A[1] + ky, A[2] + kz]]; };
      for (const f of back != null ? [1] : [1, -1]) { const [A, B, C, D] = Q(f, 0.03 * f); tb.quadO(A, B, C, D, W1, [m[0] - nX * f, m[1] - nY * f, m[2] - nZ * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
      if (back) { const [A, B, C, D] = Q(1, -0.03); scen.get(cx, cz).quadO(A, B, C, D, back, [m[0] + nX, m[1] + nY, m[2] + nZ]); }
    };
    const sign = (F, v, a, r) => {   // brown National Forest board (4.4 x 1.1 m, as in pkLandmarks) on two short and two tall posts, leaning back so the high cameras read it
      const W = 4.4, H = 1.1, [x, z] = F.at(0, v), [fx, fz] = F.dir(a), tl = 0.6, h0 = 0.75, lx = H * Math.sin(tl) + 0.08, pc = [0.3, 0.2, 0.12], ro = Math.atan2(fz, fx), g = scen.get(x, z), P = [[x, z]];
      for (const o of [-W * 0.38, W * 0.38]) P.push([x + fz * o - fx * 0.08, z - fx * o - fz * 0.08], [x + fz * o - fx * lx, z - fx * o - fz * lx]);
      const y = lo(P);
      for (const o of [-W * 0.38, W * 0.38]) { const px = x + fz * o, pz = z - fx * o; box(g, px - fx * 0.08, y - 0.3, pz - fz * 0.08, 0.14, h0 + 0.3, 0.14, ro, pc, null, true); box(g, px - fx * lx, y - 0.3, pz - fz * lx, 0.14, h0 + H * Math.cos(tl) + 0.36, 0.14, ro, pc, null, true); }
      tq(x, y + h0, z, fx, fz, W, H, ins(r), tl); ex(x, z, W / 2 + 1.5); };
    const signAt = (s0, s1, side, v, r) => {   // the sign at the first spot from s0 towards s1 where it fits, facing the arriving cars (turned a little towards the road); -> its s
      const st = s1 > s0 ? 1 : -1;
      for (let s = s0; st * (s1 - s) >= 0; s += st) { const F = fr(s, side), [x, z] = F.at(0, v), [fx, fz] = F.dir(PI + 0.35), P = [[x, z]];
        for (const o of [-1.68, 1.68]) P.push([x + fz * o - fx * 0.08, z - fx * o - fz * 0.08], [x + fz * o - fx * 0.72, z - fx * o - fz * 0.72]);   // (its four posts)
        if (free(P, true)) { sign(F, v, PI + 0.35, r); info.signs.push(where(x, z)); return s; } }
      return null; };

    /* ---- turn boards: the real course's number of every modelled corner (T.def.turnNos: 2 ... 154 of its 156 turns), 25-45 m before the corner on the side where
       the barrier is nearest the road (in view of the portrait chase camera): a white board with the number and a red arrow the way it turns (round a U at the
       hairpins), leaning back, facing the arriving cars ---- */
    const TN = (T.def && T.def.turnNos ? T.def.turnNos(T) : []).slice(0, 37), BW = 2.9, BH = 1.8, BT = 0.55, BA = PI + 0.3;
    const bPts = (F, v) => { const [x, z] = F.at(0, v), [fx, fz] = F.dir(BA), lx = BH * Math.sin(BT) + 0.06, P = [[x, z]];
      for (const o of [-BW / 2, BW / 2]) P.push([x + fz * o, z - fx * o], [x + fz * o * 0.72 - fx * lx, z - fx * o * 0.72 - fz * lx]); return P; };
    TN.forEach((t, k) => {
      const C = [];   // the spots, nearest the road first (the barrier's distance, how far beyond it, a little off 32 m before the corner): the first that fits is taken
      for (let d = 25; d <= 45; d++) for (const side of [-1, 1]) { const s = t.s - d; if (s < S0 + 6) continue; const bar = side > 0 ? T.br[T.idx(s)] : T.bl[T.idx(s)];
        for (const e of [0, 0.8, 1.8, 3, 4.5]) C.push([bar + e + Math.abs(d - 32) * 0.03, s, side, e]); }
      C.sort((p, q) => p[0] - q[0]);
      let b = null;
      for (const strict of [true, false]) {   // (clear of everything; else only of the buildings and the people)
        for (const [, s, side, e] of C) { if (strict && e > 2) continue;
          const F = fr(s, side), v = 1.6 + e + BW * 0.47, P = bPts(F, v); if (!free(P, strict)) continue;
          const l = lo(P), h = hi(P); if (h - l > 1.1 || l < F.hy - 2.2 || h > F.hy + 2.2) continue;
          b = { F, v, y: l }; break; }
        if (b) break; }
      if (!b) return;
      const [x, z] = b.F.at(0, b.v), [fx, fz] = b.F.dir(BA), g = scen.get(x, z), h0 = 1.05, lx = BH * Math.sin(BT) + 0.06, ro = Math.atan2(fz, fx), pc = [0.58, 0.6, 0.62];
      for (const o of [-BW * 0.36, BW * 0.36]) { const px = x + fz * o, pz = z - fx * o;   // galvanised posts: a short one under the bottom edge, a tall one behind the top edge
        box(g, px - fx * 0.06, b.y - 0.3, pz - fz * 0.06, 0.1, h0 + 0.36, 0.1, ro, pc, null, true);
        box(g, px - fx * lx, b.y - 0.3, pz - fz * lx, 0.1, h0 + BH * Math.cos(BT) + 0.3, 0.1, ro, pc, null, true); }
      tq(x, b.y + h0, z, fx, fz, BW, BH, cell(k), BT, [0.17, 0.18, 0.2]);
      ex(x, z, BW / 2 + 1.8); info.turns.push([t.n, ...where(x, z)]);
    });

    // a culvert's end just beyond the barrier (frame F; its pipe runs under the road, the mouth faces away from it): a stone headwall with flared wing walls, the pipe's dark
    // mouth half in the ground (steel: a corrugated steel pipe sticking out of the wall); -> [x, y, z] where its water comes out (or goes in), its exclusion, the way out from the road
    const stone = [0.55, 0.52, 0.48], stoneT = [0.63, 0.6, 0.55], dark = [0.05, 0.05, 0.06];
    const culvert = (F, steel, CV) => {   // (CV: the headwall's distance beyond the barrier line)
      const [x, z] = F.at(0, CV), g = scen.get(x, z), ro = F.rot(), y = lo([F.at(-1.8, CV - 0.25), F.at(1.8, CV - 0.25), F.at(-1.8, CV + 0.35), F.at(1.8, CV + 0.35), F.at(0, CV + 0.95)]), [tx, tz] = F.dir(0), [ox, oz] = F.dir(PI / 2);
      box(g, x, y - 0.5, z, 3.6, 1.5, 0.6, ro, stone, stoneT, true);
      for (const sg of [-1, 1]) { const [wx, wz] = F.at(sg * 2.15, CV + 0.55); box(g, wx, y - 0.5, wz, 0.45, 1.15, 1.5, F.rot(sg * 0.45), vary(stone, R, 0.08), stoneT, true); }
      const r = steel ? 0.58 : 0.62, o = CV + (steel ? 1.1 : 0.32), n = 8, pt = (a, rr, v) => [x + tx * Math.cos(a) * rr + ox * (v - CV), y + 0.02 + Math.sin(a) * rr, z + tz * Math.cos(a) * rr + oz * (v - CV)], c = pt(0, 0, o - 1), ax = pt(0, 0, (CV + 0.25 + o) / 2);
      for (let k = 0; k < n; k++) { const a0 = PI * k / n, a1 = PI * (k + 1) / n;
        g.triO(pt(a0, 0, o), pt(a0, r, o), pt(a1, r, o), dark, c);   // the mouth, dark inside
        if (steel) { g.quadO(pt(a0, r, CV + 0.25), pt(a1, r, CV + 0.25), pt(a1, r, o), pt(a0, r, o), k % 2 ? [0.62, 0.63, 0.62] : [0.54, 0.55, 0.55], ax); g.quadO(pt(a0, r, o), pt(a1, r, o), pt(a1, r + 0.07, o), pt(a0, r + 0.07, o), [0.72, 0.73, 0.72], c); }
        else g.quadO(pt(a0, r, o), pt(a1, r, o), pt(a1, r + 0.22, o), pt(a0, r + 0.22, o), vary([0.44, 0.42, 0.39], R, 0.1), c); }   // (the arch's voussoirs)
      const e = { x, z, r: 4.5 }; excl.push(e); info.culv.push(where(x, z));
      const [px, pz] = F.at(0, o + 0.15); return [px, y + 0.02, pz, e, Math.atan2(oz, ox)];   // (its watercourse may cross its own exclusion)
    };
    const culverts = (s, up, steel) => {   // a pipe under the road near s (moved a little either way, and out from the barrier where it widens, until both ends fit): -> [the upper end, the lower end]
      const fit = (F, v) => free([F.at(-2.4, v - 0.15), F.at(2.4, v - 0.15), F.at(-2.5, v + 1.3), F.at(2.5, v + 1.3), F.at(0, v - 0.3)], false) && hi([F.at(-2.4, v), F.at(2.4, v)]) - lo([F.at(-2.4, v), F.at(2.4, v)]) < 0.9;
      for (const du of [0, 2, -2, 4, -4, 6, -6, 8, -8]) { const A = fr(s + du, up), B = fr(s + du, -up), va = [2.4, 3, 3.6].find(v => fit(A, v)), vb = [2.4, 3, 3.6].find(v => fit(B, v));
        if (va && vb) return [culvert(A, steel, va), culvert(B, steel, vb)]; }
      return [null, null]; };
    // a watercourse from a culvert's mouth [x, y, z, its exclusion] out along the fall line (dn 1: downhill; -1: up the slope, where it comes from): 1 m steps, steered a little at a time
    // towards the steepest way down (up) 3 m ahead, off the road and the buildings; -> the points [x, z]
    const course = (p0, len, dn) => {
      let x = p0[0], z = p0[2], a = p0[4]; const P = [];
      for (let k = 0; k <= len; k++) { P.push([x, z]); let best = null, bv = 1e9;
        for (const da of [-0.45, -0.2, 0, 0.2, 0.45]) { const b = a + da, qx = x + Math.cos(b) * 3, qz = z + Math.sin(b) * 3; if (pkNear(qx, qz).dd < 2.5 || hard(qx, qz, p0[3])) continue; const v = dn * gy(qx, qz) + Math.abs(da) * 0.12; if (v < bv) { bv = v; best = b; } }
        if (best == null) break; a += clamp(best - a, -0.16, 0.16) + (R() - 0.5) * 0.14; x += Math.cos(a); z += Math.sin(a); }
      return P; };
    // its bed on the ground along the points (the edges take the ground's colour, so it fades in), cobbles along the banks; wet: a dark bed, a strip of water on it,
    // willow scrub on the banks
    const cwg = new GB(true);   // the running water of the wet beds (Cove Creek): one mesh (uv: across 0-1, metres downstream)
    const bed = (P, wet) => {
      const n = P.length; if (n < 3) return;
      const L = P.map((p, k) => { const a = P[Math.max(0, k - 1)], b = P[Math.min(n - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
      const E = (k, o, lift) => { const x = P[k][0] + L[k][0] * o, z = P[k][1] + L[k][1] * o; return [x, gy(x, z) + lift, z]; }, G = (k, o) => gcol(P[k][0] + L[k][0] * o, P[k][1] + L[k][1] * o);
      const bc = wet ? [0.27, 0.26, 0.25] : [0.55, 0.51, 0.46], Wb = (k) => (wet ? 2.5 : 1.9) * (0.85 + 0.25 * Math.sin(k * 0.61 + 1.3)) * Math.min(1, 0.55 + k * 0.15), Ww = (k) => (0.75 + 0.3 * Math.sin(k * 0.47)) * Math.min(1, 0.6 + k * 0.12);
      const cols = P.map((p, k) => { const w = Wb(k), c = vary(bc, R, 0.1); return [G(k, -w / 2), c, c, G(k, w / 2)]; }), keep = [];
      const fl = wet && gy(...P[0]) < gy(...P[n - 1]) ? -1 : 1, cwd = [0], cwc = [];   // (the water flows downhill: fl; its distance along the bed and its colour per point: white over the drops, fading in and out)
      if (wet) { for (let k = 1; k < n; k++) cwd.push(cwd[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
        const dr = P.map((p, k) => { const a = P[Math.max(0, k - 1)], b = P[Math.min(n - 1, k + 1)]; return Math.abs(gy(...a) - gy(...b)) / Math.max(1, (k > 0) + (k < n - 1)); });
        for (let k = 0; k < n; k++) { const r = sstep(0.07, 0.17, Math.max(dr[k], 0.7 * (dr[k - 1] || 0), 0.7 * (dr[k + 1] || 0))); cwc.push([lerp(0.3, 0.84, r), lerp(0.45, 0.89, r), lerp(0.52, 0.9, r)]); } }
      for (let k = 0; k + 1 < n; k++) { const g = K.noShadow(P[k][0], P[k][1]), w0 = Wb(k), w1 = Wb(k + 1), A = [-w0 / 2, -w0 / 4, w0 / 4, w0 / 2].map((o, i) => E(k, o, i % 3 ? 0.05 : 0.03)), B = [-w1 / 2, -w1 / 4, w1 / 4, w1 / 2].map((o, i) => E(k + 1, o, i % 3 ? 0.05 : 0.03));
        for (let q = 0; q < 3; q++) g.quadUp(A[q], A[q + 1], B[q + 1], B[q], [cols[k][q], cols[k][q + 1], cols[k + 1][q + 1], cols[k + 1][q]]);
        if (wet) { const v0 = Ww(k), v1 = Ww(k + 1), fall = gy(...P[k]) - gy(...P[k + 1]), wc = fall > 0.16 ? [0.82, 0.88, 0.9] : vary([0.3, 0.45, 0.52], R, 0.06);   // the water, white where it drops
          const wi = cwc[k], wj = cwc[k + 1], ua = cwd[k] * fl, ub = cwd[k + 1] * fl;   // (its own mesh, the flow animated: see creek below)
          cwg.quadUp(E(k, -v0 / 2, 0.08), E(k, v0 / 2, 0.08), E(k + 1, v1 / 2, 0.08), E(k + 1, -v1 / 2, 0.08), [wi, wi, wj, wj], [[0, ua], [1, ua], [1, ub], [0, ub]]); }
        if (k % 3 === 0) keep.push([P[k][0], P[k][1], Math.max(w0, 2.2)]); }
      for (let k = 1; k < n; k++) for (const sd of [-1, 1]) { if (R() > 0.55) continue;   // cobbles
        const w = Wb(k), r = 0.1 + R() * (wet ? 0.28 : 0.2), [x, y, z] = E(k, sd * (w / 2 - 0.1 - R() * 0.5), 0); if (pkNear(x, z).dd < r * 1.7 + 1.5) continue;
        peb(K.noShadow(x, z), x, y, z, r * 1.2, vary(wet ? [0.46, 0.45, 0.44] : [0.64, 0.6, 0.55], R, 0.18)); }
      if (wet) for (let k = 3; k < n; k += 3) for (const sd of [-1, 1]) { if (R() > 0.5) continue;   // willow scrub: low, grey-green clumps along the banks
        const w = Wb(k), [x, y, z] = E(k, sd * (w / 2 + 0.7 + R() * 1.6), 0), g = scen.get(x, z), c = vary([[0.36, 0.44, 0.3], [0.42, 0.48, 0.33], [0.31, 0.39, 0.27]][Math.floor(R() * 3)], R, 0.1);
        if (pkNear(x, z).dd < 3.4 || hard(x, z)) continue;   // (the clumps spread ~1.9 m)
        for (let q = 0, m = 2 + Math.floor(R() * 2); q < m; q++) { const rr = 0.5 + R() * 0.35, qa = R() * TAU, qd = q ? 0.55 + R() * 0.45 : 0; ico(g, x + Math.cos(qa) * qd, y + rr * 0.72, z + Math.sin(qa) * qd, rr, 1.05 + R() * 0.3, sh(c, 0.9 + R() * 0.2), R, 0.3); }   // (rounded, soft clumps)
        ex(x, z, 1.6); }
      for (const [x, z, r] of keep) ex(x, z, r);   // (trees, boulders and the later crowds keep off it)
    };

    /* ---- Engineer's Corner: just past the bend, on its uphill side (here its inside, the barrier near the road), the brown sign and the road builders' benchmark: a stone cairn
       with a striped survey pole, a brass-capped concrete marker, a surveyor at his level on its tripod; then an old stone culvert taking a dry wash under the road ---- */
    {
      const s0 = S0 + 578, hs = (sd) => { const p = K.onSide(s0 + 40, sd, 22); return gy(p[0], p[1]); }, up = hs(-1) > hs(1) ? -1 : 1, sc = s0 + 44;   // (sc: the culvert)
      const one = (L, rr, f) => { for (const [s, v] of L) { const F = fr(s0 + s, up), [x, z] = F.at(0, v); if (!free(ring(x, z, rr), true)) continue; f(F, x, z); info.eng.push(where(x, z)); return; } };   // at the first of the spots where it fits
      signAt(s0 + 16, s0 + 30, up, 3.1, AT.eng);
      one([[23.5, 2.6], [24.5, 3.4], [26, 2.8], [22, 3.8], [28, 3.2]], 1.1, (F, x, z) => { const g = scen.get(x, z), c = [0.6, 0.57, 0.53]; let y = lo(ring(x, z, 0.9)) - 0.15;   // the cairn
        for (const [r, h] of [[0.9, 0.55], [0.7, 0.5], [0.5, 0.42], [0.32, 0.34]]) { rock(g, x + (R() - 0.5) * 0.1, y + 0.4 * h, z + (R() - 0.5) * 0.1, r, h, r * 0.9, R() * TAU, vary(c, R, 0.12), R, 0.2, 0.55); y += h * 0.88; }
        for (let q = 0; q < 6; q++) box(g, x, y - 0.1 + q * 0.4, z, 0.08, 0.4, 0.08, 0, q % 2 ? [0.95, 0.95, 0.93] : [0.86, 0.12, 0.1]);   // the survey pole, red and white
        ex(x, z, 1.8); });
      one([[27.5, 1.9], [28.5, 2.4], [21, 2], [30, 2.2], [26, 4.6]], 0.4, (F, x, z) => { const g = scen.get(x, z), y = gy(x, z);   // the benchmark: a concrete post, a brass cap
        box(g, x, y - 0.3, z, 0.3, 0.95, 0.3, F.rot(), [0.7, 0.69, 0.66], [0.74, 0.73, 0.7]); cyl(g, x, y + 0.65, z, 0.1, 0.04, 8, [0.72, 0.55, 0.22], [0.86, 0.68, 0.3]); ex(x, z, 0.9); });
      one([[32, 2.9], [33, 3.6], [31, 4.2], [35, 3]], 1.2, (F, x, z) => { const g = scen.get(x, z), y = gy(x, z), hd = [x, y + 1.42, z], leg = [0.78, 0.62, 0.3], [fx, fz] = F.dir(-PI / 2 - 0.5);   // the level on its tripod, sighting across the road
        for (let q = 0; q < 3; q++) { const a = q / 3 * TAU + 0.4; rod(g, [x + Math.cos(a) * 0.55, y - 0.05, z + Math.sin(a) * 0.55], hd, 0.05, leg); }
        box(g, x, y + 1.42, z, 0.36, 0.2, 0.2, Math.atan2(fz, fx), [0.93, 0.74, 0.12]); box(g, x + fx * 0.22, y + 1.47, z + fz * 0.22, 0.16, 0.1, 0.1, Math.atan2(fz, fx), [0.12, 0.12, 0.13]);
        crowdPut(CR, x - fx * 0.75, gy(x - fx * 0.75, z - fz * 0.75), z - fz * 0.75, fx, fz, { col: [1, 0.55, 0.1], flag: 0, staff: true }, 1); ex(x, z, 1.9); });   // the surveyor, in hi-vis orange
      { const [x, z] = fr(s0 + 27, up).at(0, 3.4); ex(x, z, 6.5); }   // a clearing round them (no tree crown over them)
      const [pi, po] = culverts(sc, up, false);
      if (pi) bed(course(pi, 16, -1), false); if (po) bed(course(po, 18, 1), false);
    }

    /* ---- Brown Bush Corner, the first big hairpin: its sign on the approach, a thicket of brown scrub on the inside ---- */
    {
      const c = T.corners.find(q => q.sev >= 3 && q.s0 > S0 + 1600 && q.s0 < S0 + 1800);
      if (c) {
        const sm = (c.i0 + c.i1) / 2 * T.ds, side = c.dir, brn = [[0.36, 0.25, 0.16], [0.42, 0.31, 0.2], [0.3, 0.21, 0.14], [0.4, 0.33, 0.21], [0.47, 0.36, 0.25], [0.33, 0.3, 0.18], [0.37, 0.34, 0.2]], bs = [];   // (dull browns, some olive: the low sun warms them)
        signAt(c.s0 - 12, c.s0 - 34, side, 3.1, AT.brown);
        for (let s = c.s0 - 16; s < sm + 24; s += 1.6) for (let q = 0; q < 4; q++) {   // (a thicket: the clumps close together, some touching)
          const r = 0.6 + R() * 0.8, v = 0.9 + Math.pow(R(), 0.9) * 8, [x, z] = fr(s + (R() - 0.5) * 1.6, side).at(0, v + r), keep = R() < 0.6;
          if (!keep || pkNear(x, z).dd < r * 1.6 + 1.5 || K.excluded(x, z) || bs.some(b => (b[0] - x) ** 2 + (b[1] - z) ** 2 < ((b[2] + r) * 0.62) ** 2)) continue;   // (the bush spreads ~1.6 r)
          const y = gy(x, z), g = scen.get(x, z), col = brn[Math.floor(R() * brn.length)];   // a bush: a big clump and two or three smaller ones round it
          for (let q = 0, m = 2 + (r > 0.85 ? 1 : 0); q < m; q++) { const a = R() * TAU, d = q ? r * (0.5 + R() * 0.3) : 0; bush(g, x + Math.cos(a) * d, y - 0.08, z + Math.sin(a) * d, r * (q ? 0.55 + R() * 0.2 : 0.8), q ? 0.62 + R() * 0.15 : 0.75, vary(col, R, 0.14)); }
          bs.push([x, z, r]); }
        for (const b of bs) ex(b[0], b[1], b[2] + 0.35);
      }
    }

    /* ---- Cove Creek: a mountain stream comes down the high side of the bend, runs under the road through a culvert and on down the low side over the stones,
       willow scrub along it; the sign just before it on the near side ---- */
    {
      const s0 = S0 + 3568, hs = (sd) => { const p = K.onSide(s0, sd, 30); return gy(p[0], p[1]); }, up = hs(-1) > hs(1) ? -1 : 1, i0 = T.idx(s0), near = T.bl[i0] <= T.br[i0] ? -1 : 1;
      signAt(s0 - 11, s0 - 30, near, 3.1, AT.cove);
      const [pi, po] = culverts(s0, up, true);
      if (pi) bed(course(pi, 40, -1), true); if (po) bed(course(po, 44, 1), true);
      // the creek's water: two layers of the water texture streaming downhill along the bed (the map's scrolling offset, out.dyn.water, as the clock: a whole number
      // of repeats per wrap), a steady ripple across; white where it drops (vertex colour), foam streaks and flecks there; lit, no shadow of its own
      if (!cwg.empty) {
        const cm = new THREE.MeshLambertMaterial({ map: K.tex.water, vertexColors: true });
        cm.onBeforeCompile = (sh) => {
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec4 vFl;\nvarying float vAc;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
            'float pkT = uvTransform[ 2 ].x;\nvAc = uv.x;\nvFl = vec4( uv.x * 0.35 + 0.1 * sin( uv.y * 0.9 ), uv.y / 4.0 - pkT * 40.0, uv.x * 0.6 + 0.3, uv.y / 2.3 - pkT * 84.0 );');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vFl;\nvarying float vAc;')
            .replace('#include <map_fragment>', 'vec4 pkA = texture2D( map, vFl.xy ), pkB = texture2D( map, vFl.zw );\ndiffuseColor.rgb *= 0.8 + 0.5 * ( pkA.b + pkB.b - 1.2 );')
            .replace('#include <color_fragment>', ['#include <color_fragment>',
              'float pkW = smoothstep( 0.55, 0.8, vColor.g ), pkC = max( smoothstep( 0.28, 0.42, pkA.r ), smoothstep( 0.28, 0.42, pkB.r ) ), pkE = abs( vAc - 0.5 );',
              'diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.93, 0.95, 0.95 ), clamp( pkC * ( 0.3 + 0.7 * pkW ) + pkW * 0.35 * smoothstep( 0.3, 0.5, pkE ), 0.0, 1.0 ) );'].join('\n'));
        };
        cm.customProgramCacheKey = () => 'pkCreek';
        const m = new THREE.Mesh(cwg.geometry(), cm); m.receiveShadow = true; m.matrixAutoUpdate = false; K.root.add(m); K.out.dyn.water = K.tex.water; }
    }

    /* ---- Devil's Playground: weathered granite tors on the bare ridge (stacks of rounded blocks, pillars, low domes with boulders on top, scree at their feet):
       a row of smaller ones right beyond the barriers on both sides (in view of the chase camera), bigger ones farther out on the slopes ---- */
    {
      const s0 = S0 + 4050, gran = [[0.66, 0.55, 0.49], [0.61, 0.51, 0.46], [0.7, 0.6, 0.53], [0.58, 0.49, 0.45]], tors = [];
      const tor = (x, z, sz, kind) => {   // a jumble of rounded blocks: kind 0 a cluster of two or three with one on top, 1 a tall block with one or two perched on it, 2 a low dome with a boulder on it
        const g = scen.get(x, z), c = vary(gran[Math.floor(R() * gran.length)], R, 0.08), y0 = lo(ring(x, z, sz * 0.8)) - 0.3, a0 = R() * TAU, tops = [];
        const blk = (bx, by, bz, rx, ry, k) => { const rz = rx * (0.7 + R() * 0.3), fl = 0.5 + R() * 0.2; rock(g, bx, by + 0.4 * ry, bz, rx, ry, rz, R() * TAU, sh(c, k * (0.95 + R() * 0.1)), R, 0.22, fl); tops.push([bx, by + ry * (0.4 + fl) - 0.1, bz, Math.min(rx, rz)]); };
        if (kind === 0) for (let q = 0, m = 2 + (R() < 0.25 ? 1 : 0); q < m; q++) { const a = a0 + q / m * TAU, d = sz * 0.55, rx = sz * (0.6 + R() * 0.25); blk(x + Math.cos(a) * d, y0, z + Math.sin(a) * d, rx, rx * (0.75 + R() * 0.3), 0.92); }
        else if (kind === 1) blk(x, y0, z, sz * 0.8, sz * (1.3 + R() * 0.4), 0.92);
        else blk(x, y0, z, sz * 1.3, sz * 0.62, 0.92);
        for (let q = 0, m = kind === 1 && R() < 0.3 ? 2 : 1; q < m; q++) {   // blocks perched on the highest ones
          const t = tops.reduce((p, u) => u[1] > p[1] ? u : p), rx = t[3] * (0.6 + R() * 0.25), a = R() * TAU, d = t[3] * 0.25 * R();
          blk(t[0] + Math.cos(a) * d, t[1], t[2] + Math.sin(a) * d, rx, rx * (0.7 + R() * 0.35), 1.04); }
        for (let q = 0, m = 1 + Math.floor(R() * 2); q < m; q++) { const a = R() * TAU, d = sz * (1.3 + R() * 0.7), bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d, r = 0.25 + R() * 0.3 * sz;   // scree
          if (pkNear(bx, bz).dd < r * 1.6 + 1.5) continue; peb(g, bx, gy(bx, bz), bz, r * 1.3, sh(c, 0.9 + R() * 0.15)); } };
      const put = (s, side, v0, v1, z0, z1) => { for (let tries = 0; tries < 12; tries++) {   // one tor near road s on 'side', v0-v1 beyond the barrier, sz0-sz1 across (a few tries round the spot)
        const sz = z0 + R() * (z1 - z0), e = sz * 1.45, [x, z] = fr(s + (R() - 0.5) * 8, side).at(0, v0 + R() * (v1 - v0) + e);   // (e: how far its blocks spread)
        if (pkNear(x, z).dd < e + 1.5 || !free(ring(x, z, e), true) || tors.some(t => (t[0] - x) ** 2 + (t[1] - z) ** 2 < (t[2] + e + 1.5) ** 2) || pkSlope(x, z) > 0.7) continue;
        tor(x, z, sz, Math.floor(R() * 3)); tors.push([x, z, e]); ex(x, z, e + 0.8); info.tors++; return; } };
      for (let s = s0 - 30, k = 0; s < s0 + 112; s += 8 + R() * 4, k++) { const sd = k % 2 ? 1 : -1;   // both sides, staggered: a row right beyond the barrier (the chase camera's edges),
        put(s, sd, 1.6, 2.6, 1.4, 2.1); put(s + 5, -sd, 3.5, 9, 2.2, 3.3); if (k % 4 === 0) put(s + 3, sd, 11, 28, 3, 4.5); }   // bigger ones behind them (the upper part of the view), the biggest farther out
    }

    /* ---- the timing & scoring tower just past the finish line, on the Summit Visitor Center's side between the finish crowd and the center: three storeys, the top one
       the glazed control room with a balcony towards the road (officials watching the line), "TIMING & SCORING" on the fascia, the big results screen facing the
       arriving cars; the block turned a little towards the road ---- */
    {
      const side = K.padH.lat < 0 ? -1 : 1, th = 0.5, L = 6.2, D = 4.4, bw = 1.3;
      let tw = null;
      for (const [sa, sb] of [[14, 26], [4, 13.5]]) for (let vc = 3.5; vc <= 9 && !tw; vc += 0.25) for (let s = sFin + sa; s <= sFin + sb && !tw; s += 0.5) {   // (the nearest the road that fits: in view of the chase camera; else just past the finish gantry, when the Visitor Center's monument stands in the first spot)
        const F = fr(s, side), [cx, cz] = F.at(0, vc), e1 = F.dir(PI + th), e2 = F.dir(1.5 * PI + th), P = (a, b) => [cx + e1[0] * a + e2[0] * b, cz + e1[1] * a + e2[1] * b], pts = [], pb = [];
        for (const a of [-L / 2, 0, L / 2]) { for (const b of [-D / 2, 0, D / 2]) pts.push(P(a, b)); pb.push(P(a, D / 2 + bw + 0.1)); }
        // (the walls on the ground clear of the road and of the buildings, the block below culls anyone inside; the balcony, 6 m up, only reaches out over the verge beyond the barrier)
        if (!pts.every(([x, z]) => pkNear(x, z).dd >= 1.5 && !hard(x, z)) || !pb.every(([x, z]) => pkNear(x, z).dd >= 0.3 && !hard(x, z)) || hi(pts) - lo(pts) > 1.6) continue;
        tw = { P, e1, e2, cx, cz, y0: hi(pts) + 0.12, yl: lo(pts), s, vc };
      }
      if (tw) {
        const { P, e1, e2, y0, yl } = tw, g = scen.get(tw.cx, tw.cz), ro = Math.atan2(e1[1], e1[0]), B = (a, b, y, sa, sy, sb, col, top) => { const [x, z] = P(a, b); box(g, x, y, z, sa, sy, sb, ro, col, top, true); };
        const wht = [0.9, 0.9, 0.88], grey = [0.66, 0.66, 0.65], glass = [0.13, 0.16, 0.2], glassB = [0.17, 0.24, 0.3], rail = [0.55, 0.66, 0.72], red = [0.84, 0.12, 0.1];
        B(0, 0, yl - 0.3, L + 0.5, y0 - yl + 0.3, D + 0.5, [0.55, 0.54, 0.52], [0.62, 0.61, 0.59]);   // plinth
        B(0, 0, y0, L, 3.0, D, grey, grey); B(L / 2 + 0.02, -D / 2 + 1.0, y0, 0.06, 2.2, 1.1, [0.24, 0.27, 0.31]);   // ground floor, its door
        B(0, 0, y0 + 3, L, 3.0, D, wht, wht); B(0, 0, y0 + 3.9, L + 0.05, 1.2, D + 0.05, glass);   // first floor, a band of windows round it
        B(0, 0, y0 + 5.95, L + 0.3, 0.2, D + 0.3, wht, wht);
        B(0, 0, y0 + 6.15, L + 0.2, 2.6, D + 0.2, glassB);   // the control room: glass all round, white corner posts and mullions
        for (const a of [-1, 1]) for (const b of [-1, 1]) B(a * (L / 2 + 0.05), b * (D / 2 + 0.05), y0 + 6.15, 0.2, 2.6, 0.2, wht);
        for (let q = 1; q < 4; q++) for (const b of [-1, 1]) B(-L / 2 + q * L / 4, b * (D / 2 + 0.11), y0 + 6.15, 0.08, 2.6, 0.04, wht);
        for (let q = 1; q < 3; q++) B(-L / 2 - 0.11, -D / 2 + q * D / 3, y0 + 6.15, 0.04, 2.6, 0.08, wht);
        B(0, 0, y0 + 8.65, L + 0.92, 0.12, D + 0.92, red); B(0, 0, y0 + 8.75, L + 0.9, 0.9, D + 0.9, wht, [0.72, 0.72, 0.7]);   // the roof: a red line under a deep white fascia
        B(-1.5, -1.0, y0 + 9.65, 1.6, 0.7, 1.2, [0.8, 0.8, 0.79], [0.86, 0.86, 0.85]);   // plant, antennas
        for (const [a, b, h] of [[2.1, -1.5, 3.4], [2.5, 1.3, 2.4]]) B(a, b, y0 + 9.65, 0.07, h, 0.07, [0.45, 0.45, 0.47]);
        // the balcony towards the road: deck, a glass railing, two struts under it; officials watching the line
        const bb = D / 2 + 0.1 + bw / 2;
        B(0, bb, y0 + 5.95, L, 0.2, bw + 0.2, wht, [0.6, 0.58, 0.55]); B(0, bb + bw / 2, y0 + 6.15, L, 1.0, 0.05, rail); B(0, bb + bw / 2, y0 + 7.12, L + 0.06, 0.07, 0.1, wht);
        for (const a of [-1, 1]) { B(a * L / 2, bb, y0 + 6.15, 0.05, 1.0, bw, rail); B(a * L / 2, bb, y0 + 7.12, 0.1, 0.07, bw, wht);
          const [x0, z0] = P(a * (L / 2 - 0.4), D / 2), [x1, z1] = P(a * (L / 2 - 0.4), D / 2 + bw); rod(g, [x0, y0 + 4.3, z0], [x1, y0 + 5.95, z1], 0.14, wht); }
        { const fx = e2[0] * 0.85 + e1[0] * 0.53, fz = e2[1] * 0.85 + e1[1] * 0.53;
          for (const [a, col] of [[-1.9, [0.95, 0.95, 0.94]], [-0.2, [0.98, 0.52, 0.1]], [1.7, [0.14, 0.2, 0.38]]]) { const [x, z] = P(a, bb + 0.1); crowdPut(CR, x, y0 + 6.15, z, fx, fz, { col, flag: 0 }, 1); } }
        // the results screen on the front (the face towards the arriving cars), in a black frame; the name on the fascia (front and road side)
        B(L / 2 + 0.14, 0, y0 + 3.1, 0.24, 2.5, D + 0.2, [0.08, 0.08, 0.09]);
        { const [x, z] = P(L / 2 + 0.27, 0); tq(x, y0 + 3.3, z, e1[0], e1[1], D - 0.2, (D - 0.2) / 2, ins(AT.screen), 0, 0); }
        { const [x, z] = P(L / 2 + 0.46, 0); tq(x, y0 + 8.88, z, e1[0], e1[1], D + 0.5, 0.64, ins(AT.fascia), 0, 0); }
        { const [x, z] = P(0, D / 2 + 0.46); tq(x, y0 + 8.88, z, e2[0], e2[1], L + 0.6, 0.64, ins(AT.fascia), 0, 0); }
        ex(tw.cx, tw.cz, Math.hypot(L, D) / 2 + 1.5); CR.block(tw.cx, tw.cz, L + 0.5, D + 0.5, ro); info.tower = [Math.round(tw.s), tw.vc];   // (nobody inside it)
      }
    }

    /* ---- the winners' podium on the summit, where the portrait chase camera looks once the car has stopped past the line (the game brakes it straight on, ~46 m):
       in the upper part of that view, beside the last metres of the road, clear of the cog railway, the car park and the crowds, on a stage where the ground slopes;
       three steps with their numbers, the sponsor backdrop "RACE TO THE CLOUDS" between two chequered flags, a red carpet, the three winners on the steps, officials
       beside them, photographers and fans in front; facing the stopped car (or turned towards the road where that fits better) ---- */
    {
      const iF = T.idx(sFin), hx = T.tx[iF], hz = T.tz[iF], nx = -hz, nz = hx, ax = T.px[iF] + hx * 46, az = T.pz[iF] + hz * 46, pE = K.padE;
      const park = excl.find(e => e.x === pE.x && e.z === pE.z), C = [];   // (the car park's own wide circle: the podium may stand inside it, clear of the pad itself)
      for (let d = 22; d <= 72; d += 1.5) for (let o = -24; o <= 30; o += 1.5) for (let t = 0; t <= 3; t++) C.push([d, o, t, Math.abs(o - 3) * 1.2 + Math.abs(d - 42) * 0.5 + t * 2.5]);
      C.sort((p, q) => p[3] - q[3]);   // (d ahead of the stopped car, o to its right: nearest the upper middle of its view first; t: turned from the car towards the road)
      const ok = (x, z) => pkNear(x, z).dd >= 1.5 && !hard(x, z, park);
      let pd = null;
      for (const [d, o, t] of C) {
        const cx = ax + hx * d + nx * o, cz = az + hz * d + nz * o, n = pkNear(cx, cz); if (n.i < 0 || n.dd < 3 || Math.hypot(cx - pE.x, cz - pE.z) < pE.r + 5) continue;
        const sg = n.lat > 0 ? 1 : -1, l = Math.hypot(ax - cx, az - cz), k = t / 3, fx = (ax - cx) / l * (1 - k) - T.nx[n.i] * sg * k, fz = (az - cz) / l * (1 - k) - T.nz[n.i] * sg * k, fl = Math.hypot(fx, fz) || 1;
        const f = [fx / fl, fz / fl], r = [f[1], -f[0]], P = (a, b) => [cx + f[0] * a + r[0] * b, cz + f[1] * a + r[1] * b], pts = [P(3.8, -1.3), P(3.8, 1.3)];
        for (const a of [1.3, 0, -2.4]) for (const b of [-5, -2.5, 0, 2.5, 5]) pts.push(P(a, b));
        const st = [P(1.3, -5.2), P(1.3, 5.2), P(-2.5, -5.2), P(-2.5, 5.2), P(0, 0)], l0 = lo(st), h0 = hi(st);
        if (free(pts, false, park) && h0 - l0 < 1.4 && hi(pts) - lo(pts) < 2.2) { pd = { cx, cz, P, f, y: h0 - l0 > 0.25 ? h0 + 0.12 : l0, yl: l0 }; break; }
      }
      if (pd) {
        const { P, y, f } = pd, g = scen.get(pd.cx, pd.cz), ro = Math.atan2(f[1], f[0]), B = (a, b, yb, sa, sy, sb, col, top) => { const [x, z] = P(a, b); box(g, x, yb, z, sa, sy, sb, ro, col, top, true); };
        const blu = [0.1, 0.2, 0.45], wht = [0.95, 0.95, 0.93], steps = [[0, 1.05, 0], [-1.65, 0.72, 1], [1.65, 0.48, 2]];   // (across, height, place): the winner in the middle, second on the audience's left
        if (y > pd.yl) B(-0.6, 0, pd.yl - 0.3, 3.8, y - pd.yl + 0.3, 10.4, [0.12, 0.15, 0.28], [0.46, 0.46, 0.48]);   // a stage where the ground slopes: a blue skirt, grey boards
        for (const [b, h] of steps) B(0, b, y - 0.1, 1.65, h + 0.1, 1.62, blu, wht);
        for (const [b, h, k] of steps) { const [x, z] = P(0.84, b); tq(x, y + h - 0.46, z, f[0], f[1], 0.64, 0.4, cell(37 + k), 0, 0); }
        { const c = [0.6, 0.07, 0.1], Q = (a, b) => { const [x, z] = P(a, b); return [x, a < 1.3 ? y + 0.035 : gy(x, z) + 0.05, z]; };   // the carpet, from the steps down the stage and out over the ground
          g.quadUp(Q(0.83, -2.6), Q(0.83, 2.6), Q(1.25, 2.4), Q(1.25, -2.4), [c, c, c, c]); g.quadUp(Q(1.35, -2.4), Q(1.35, 2.4), Q(3.8, 1.3), Q(3.8, -1.3), [c, c, c, c]); }
        for (const b of [-3.75, 3.75]) B(-1.62, b, y - 0.2, 0.3, 4.45, 0.3, [0.62, 0.63, 0.66]);   // the backdrop on its truss posts
        B(-1.62, 0, y + 0.4, 0.1, 3.75, 7.5, [0.1, 0.12, 0.18]);
        { const [x, z] = P(-1.55, 0); tq(x, y + 0.48, z, f[0], f[1], 7.2, 3.6, ins(AT.back), 0, 0); }
        for (const b of [-4.7, 4.7]) { const [x, z] = P(-1.3, b); cyl(g, x, y - 0.2, z, 0.05, 5.6, 5, [0.85, 0.85, 0.88]);   // chequered flags, flying out to the sides
          const sg = Math.sign(b), [qx, qz] = P(-1.3, b + sg * 0.05), K0 = [0.08, 0.08, 0.08], W0 = [0.96, 0.96, 0.96]; (K.out.pkFl || (K.out.pkFl = [])).push([qx, y + 5.25, qz, Math.atan2(-f[0] * sg, f[1] * sg), [[W0, K0, W0, K0], [K0, W0, K0, W0], [W0, K0, W0, K0]], 1.2, 0.9]); }   // (pkAmbient's waving flags)
        for (const [b, h, k] of steps) { const [x, z] = P(0.05, b); crowdPut(CR, x, y + h, z, f[0], f[1], { col: [[0.86, 0.12, 0.1], [0.15, 0.35, 0.8], [0.95, 0.95, 0.95]][k], flag: 0 }, 1); }   // the winners in their race suits
        for (const [a, b] of [[0.7, -3.3], [0.5, 3.4]]) { const [x, z] = P(a, b); crowdPut(CR, x, y, z, f[0], f[1], { col: [0.12, 0.13, 0.16], flag: 0 }, 1); }   // officials
        for (const [a, b] of [[3.2, -2.4], [3.6, 0.2], [3.3, 2.6], [4.5, -1.1], [4.7, 1.4], [2.6, -4.2], [2.7, 4.3]]) { const [x, z] = P(a, b), [px, pz] = P(0, b * 0.3); if (ok(x, z)) crowdPut(CR, x, gy(x, z), z, px - x, pz - z, {}, 1); }   // photographers and fans
        ex(pd.cx, pd.cz, 6.5); info.podium = where(pd.cx, pd.cz);
      }
    }

    /* ---- the text: one canvas atlas (1024 x 1024), one mesh ---- */
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const c2 = cv.getContext('2d'), cream = '#efe3c6', GEO = 'px Georgia, "Times New Roman", serif';
    const txt = (s, x, y, px, col, w, font) => { c2.fillStyle = col; c2.font = font || '900 ' + px + 'px Arial, sans-serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(s, x, y, w); };
    const rect = (x, y, w, h, col) => { c2.fillStyle = col; c2.fillRect(x, y, w, h); };
    const poly = (pts, col) => { c2.fillStyle = col; c2.beginPath(); pts.forEach(([a, b], k) => k ? c2.lineTo(a, b) : c2.moveTo(a, b)); c2.closePath(); c2.fill(); };
    TN.forEach((t, k) => { const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 80, dl = t.dir < 0;   // turn boards: black edge, white face, the number, a red arrow (drawn for a right turn, mirrored for a left one)
      rect(x0, y0, 128, 80, '#16171a'); rect(x0 + 5, y0 + 5, 118, 70, '#f5f4ef'); txt(String(t.n), x0 + (dl ? 81 : 47), y0 + 43, 54, '#101114', 80);
      c2.save(); c2.translate(x0 + (dl ? 27 : 101), y0 + 40); if (dl) c2.scale(-1, 1); c2.strokeStyle = '#d42219'; c2.lineWidth = 8; c2.lineJoin = 'round'; c2.beginPath();
      if (t.sev >= 3) { c2.moveTo(-9, 27); c2.lineTo(-9, -9); c2.arc(0, -9, 9, PI, 0); c2.lineTo(9, 3); c2.stroke(); poly([[0, 3], [18, 3], [9, 21]], '#d42219'); }   // round a U
      else { c2.moveTo(-8, 27); c2.lineTo(-8, -2); c2.quadraticCurveTo(-8, -14, 4, -14); c2.stroke(); poly([[3, -26], [19, -14], [3, -2]], '#d42219'); }
      c2.restore(); });
    ['1', '2', '3'].forEach((n, k) => { const q = 37 + k, x0 = (q % 8) * 128, y0 = Math.floor(q / 8) * 80; rect(x0, y0, 128, 80, '#0f2a60'); rect(x0 + 4, y0 + 4, 120, 72, '#1a4390'); txt(n, x0 + 64, y0 + 43, 66, ['#f2c230', '#dfe3e8', '#d58a48'][k], 100); });   // the podium's step numbers
    const plank = (x0, y0, w, h, col) => { rect(x0, y0, w, h, col); c2.strokeStyle = 'rgba(0,0,0,0.13)'; c2.lineWidth = 2;   // wood with a little grain (as pkLandmarks)
      for (let k = 0; k < 10; k++) { const y = y0 + R() * h; c2.beginPath(); c2.moveTo(x0, y); c2.bezierCurveTo(x0 + w * 0.3, y + (R() - 0.5) * 8, x0 + w * 0.7, y + (R() - 0.5) * 8, x0 + w, y + (R() - 0.5) * 6); c2.stroke(); } };
    const ft = (m) => String(Math.round(m * 3.28084)).replace(/\B(?=(\d{3})+(?!\d))/g, ','), alt = (d) => Math.round(T.altAt ? T.altAt(T.hy[T.idx(S0 + d)]) : 0);
    const brown = (r, name, d) => { const [x0, y0] = r, a = alt(d); plank(x0, y0, 512, 128, '#5b3b21'); c2.strokeStyle = cream; c2.lineWidth = 5; c2.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(name, x0 + 256, y0 + 51, 46, cream, 470, '700 46' + GEO); txt('ELEV. ' + ft(a) + ' FT  ·  ' + a + ' m', x0 + 256, y0 + 97, 24, cream, 430, '700 24' + GEO); };
    brown(AT.eng, "ENGINEER'S CORNER", 578); brown(AT.brown, 'BROWN BUSH CORNER', 1720); brown(AT.cove, 'COVE CREEK', 3564);
    { const [x0, y0] = AT.fascia; rect(x0, y0, 512, 48, '#14306a'); rect(x0, y0 + 41, 512, 7, '#d8261e'); txt('TIMING & SCORING', x0 + 256, y0 + 21, 32, '#fff', 490); }
    { const [x0, y0] = AT.screen; rect(x0, y0, 512, 256, '#050607'); rect(x0, y0, 512, 46, '#1a1c21'); txt('RESULTS', x0 + 256, y0 + 24, 30, '#ffb61e', 470);   // the results screen: LED yellow on black
      txt('1', x0 + 64, y0 + 116, 104, '#ffd426', 90); txt('YOU', x0 + 292, y0 + 116, 104, '#ffd426', 330); rect(x0 + 18, y0 + 176, 476, 3, '#ffb61e');
      txt((T.def.alt ? T.def.alt[1] : 4301) + ' m', x0 + 132, y0 + 216, 36, '#79e2ff', 220); txt('07:42', x0 + 390, y0 + 216, 40, '#f4f4f4', 200);
      c2.fillStyle = 'rgba(0,0,0,0.4)'; for (let y = y0 + 46; y < y0 + 256; y += 4) c2.fillRect(x0, y, 512, 1); for (let x = x0; x < x0 + 512; x += 4) c2.fillRect(x, y0 + 46, 1, 210); }
    { const [x0, y0] = AT.back, gr = c2.createLinearGradient(0, y0, 0, y0 + 256); gr.addColorStop(0, '#2a67b8'); gr.addColorStop(1, '#0f2b5e'); c2.fillStyle = gr; c2.fillRect(x0, y0, 512, 256);   // the podium's backdrop
      poly([[x0, y0 + 196], [x0, y0 + 176], [x0 + 110, y0 + 118], [x0 + 172, y0 + 146], [x0 + 256, y0 + 84], [x0 + 332, y0 + 138], [x0 + 402, y0 + 110], [x0 + 512, y0 + 170], [x0 + 512, y0 + 196]], 'rgba(255,255,255,0.2)');   // the peak
      txt('RACE TO THE', x0 + 256, y0 + 50, 46, '#fff', 430, 'italic 900 46px Arial, sans-serif'); txt('CLOUDS', x0 + 256, y0 + 118, 88, '#fff', 470, 'italic 900 88px Arial, sans-serif');
      rect(x0, y0 + 196, 512, 60, '#f2f2f0'); [['REAL ROADS ATLAS', '#e02a1f'], ['SUMMIT OIL', '#13306b'], ['ROCKY TYRES', '#1b2f6e'], ['14ER COFFEE', '#4a2c1a']].forEach(([n, col], k) => txt(n, x0 + 64 + k * 128, y0 + 226, n.length > 12 ? 19 : 22, col, 116)); }   // (fictional sponsors, as the banners)
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; K.out.ownTex.push(tx);
    tb.addTo(new THREE.MeshLambertMaterial({ map: tx }));
  }

  /* ---- wildlife above the treeline: yellow-bellied marmots on the boulders, a band of bighorn sheep on the slopes
     (own random stream; pkWildlifeUpdate runs every frame when out.dyn.pkLife is set) ---- */
  function pkWildlife(K) {
    const R = rng(9671), { scen, excl, excluded, sFin } = K, gy = pkGround, PI = Math.PI;
    const mix = (a, b, f) => { f = clamp(f, 0, 1); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; };
    /* the animals: one instanced mesh per species, posed in the vertex shader. Model space: +x forward, y up, the feet on y = 0; every part is a GB of its own with
       the joint it turns about (attribute aPart: part, joint x, joint y). Per instance aPose: x head yaw, y head pitch (both about the head's joint), z the legs'
       swing (parts 2 and 3 in opposite phase; a marmot's torso is part 2: how far it rears up, the head riding on it), w the horns (4: a ram's curls, scaled
       by w; 5: a ewe's short horns, shown when w = 0) */
    const egg = (g, c, r, pit, n, m, col) => {   // smooth ellipsoid along its own x axis pitched by pit, n around, m bands pole to pole; col(u, v): the colour at a point of the unit sphere (u forward, v up)
      const cp = Math.cos(pit), sp = Math.sin(pit), V = [];
      for (let j = 0; j <= m; j++) { const th = j / m * PI, row = [];
        for (let k = 0; k < (j === 0 || j === m ? 1 : n); k++) { const ph = k / n * TAU, u = Math.cos(th), v = Math.sin(th) * Math.cos(ph), w = Math.sin(th) * Math.sin(ph), x = u * r[0], y = v * r[1], a = u / r[0], b = v / r[1], d = w / r[2], l = Math.hypot(a, b, d) || 1;
          row.push({ p: [c[0] + x * cp - y * sp, c[1] + x * sp + y * cp, c[2] + w * r[2]], n: [(a * cp - b * sp) / l, (a * sp + b * cp) / l, d / l], c: col(u, v) }); }
        V.push(row); }
      const tri = (a, b, d) => g.triON(a.p, b.p, d.p, a.n, b.n, d.n, c, a.c, b.c, d.c);
      for (let j = 0; j < m; j++) { const A = V[j], B = V[j + 1];
        for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; if (A.length === 1) tri(A[0], B[k], B[k1]); else if (B.length === 1) tri(A[k], A[k1], B[0]); else { tri(A[k], A[k1], B[k1]); tri(A[k], B[k1], B[k]); } } }
    };
    const tube = (g, pts, rad, n, col) => {   // tapered tube through pts (n sides, radius rad[k], colour col(k)); a zero radius ends it in a point. The rings lie across the path, one side along z
      const rg = pts.map((p, k) => { const q = pts[Math.min(k + 1, pts.length - 1)], o = pts[Math.max(k - 1, 0)]; let tx = q[0] - o[0], ty = q[1] - o[1], tz = q[2] - o[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        const ul = Math.hypot(tx, ty) || 1, ux = ty / ul, uy = -tx / ul, vx = tz * tx / ul, vy = tz * ty / ul, vz = -(tx * tx + ty * ty) / ul, out = [];
        for (let j = 0; j < n; j++) { const a = j / n * TAU, c = Math.cos(a), s = Math.sin(a), nx = ux * c + vx * s, ny = uy * c + vy * s, nz = vz * s; out.push({ p: [p[0] + nx * rad[k], p[1] + ny * rad[k], p[2] + nz * rad[k]], n: [nx, ny, nz] }); }
        out.t = [tx, ty, tz]; return out; });
      for (let k = 1; k < pts.length; k++) { const A = rg[k - 1], B = rg[k], ca = col(k - 1), cb = col(k), inn = [(pts[k - 1][0] + pts[k][0]) / 2, (pts[k - 1][1] + pts[k][1]) / 2, (pts[k - 1][2] + pts[k][2]) / 2];
        for (let j = 0; j < n; j++) { const a = A[j], b = A[(j + 1) % n], c = B[(j + 1) % n], d = B[j];
          if (rad[k] > 0) { g.triON(a.p, b.p, c.p, a.n, b.n, c.n, inn, ca, ca, cb); g.triON(a.p, c.p, d.p, a.n, c.n, d.n, inn, ca, cb, cb); } else g.triON(a.p, b.p, pts[k], a.n, b.n, B.t, inn, ca, ca, cb); } }
    };
    const VS = 'attribute vec3 aPart;\nattribute vec4 aPose;\nuniform vec3 uHip;\nuniform vec3 uHead;\n' +
      'vec3 lfR(vec3 p, vec2 o, float yw, float pt) { p.xy -= o; float c = cos(yw), s = sin(yw); p.xz = vec2(c * p.x + s * p.z, c * p.z - s * p.x); c = cos(pt); s = sin(pt); p.xy = vec2(c * p.x - s * p.y, s * p.x + c * p.y); p.xy += o; return p; }\n' +
      'vec3 lfPose(vec3 p, float q) { float k = aPart.x; if (k < 0.5) return p;\n  if (k > 1.5 && k < 3.5) return lfR(p, aPart.yz * q, 0.0, k < 2.5 ? aPose.z : -aPose.z);\n' +
      '  if (k > 3.5 && q > 0.5) p = uHead + (p - uHead) * (k < 4.5 ? max(aPose.w, 0.0) : 1.0 - step(0.001, abs(aPose.w)));\n' +
      '  p = lfR(p, aPart.yz * q, aPose.x, aPose.y); if (uHip.z > 0.5) p = lfR(p, uHip.xy * q, 0.0, aPose.z); return p; }\n';
    const mesh = (list, cap, hip, head, name) => {   // [[GB, part, joint x, joint y]] -> the instanced mesh (cap instances; count and visibility set by pkWildlifeUpdate), its shadow posed the same way
      let nv = 0; for (const [g] of list) nv += g.P.length / 3;
      const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), C = new Float32Array(nv * 3), J = new Float32Array(nv * 3); let o = 0;
      for (const [g, k, jx, jy] of list) { P.set(g.P, o * 3); N.set(g.N, o * 3); C.set(g.C, o * 3); const n = g.P.length / 3; for (let q = o; q < o + n; q++) { J[q * 3] = k; J[q * 3 + 1] = jx; J[q * 3 + 2] = jy; } o += n; }
      const G = new THREE.BufferGeometry(), ap = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4); ap.setUsage(THREE.DynamicDrawUsage);
      G.setAttribute('position', new THREE.BufferAttribute(P, 3)); G.setAttribute('normal', new THREE.BufferAttribute(N, 3)); G.setAttribute('color', new THREE.BufferAttribute(C, 3)); G.setAttribute('aPart', new THREE.BufferAttribute(J, 3)); G.setAttribute('aPose', ap); G.computeBoundingSphere();
      const U = { uHip: { value: new THREE.Vector3(hip[0], hip[1], hip[2]) }, uHead: { value: new THREE.Vector3(head[0], head[1], head[2]) } };
      const hook = (m, key) => { m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VS)
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n\tobjectNormal = lfPose(objectNormal, 0.0);').replace('#include <begin_vertex>', 'vec3 transformed = lfPose(vec3(position), 1.0);'); }; m.customProgramCacheKey = () => key; return m; };
      const mat = hook(new THREE.MeshLambertMaterial({ vertexColors: true }), 'pkLife'), dm = hook(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), 'pkLifeD');
      mat.addEventListener('dispose', () => dm.dispose());   // (the world's teardown frees the mesh's own material only)
      const im = new THREE.InstancedMesh(G, mat, cap); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.customDepthMaterial = dm;
      im.count = 0; im.visible = false; im.frustumCulled = false; im.matrixAutoUpdate = false; im.castShadow = im.receiveShadow = true; im.name = name; K.root.add(im); return im;
    };

    // yellow-bellied marmot, life size (drawn MS = 2.2x: a real one is a few pixels in the high cameras): grizzled dark brown back, yellow-orange belly and chest,
    // a dark cap, a pale muzzle. 0: haunches and tail, 2: torso and forepaws (rears up about the hip: the sentinel's upright pose), 1: the head (on the torso)
    const MS = 2.2, mBack = [0.3, 0.23, 0.17], mDark = [0.22, 0.17, 0.13], mBelly = [0.95, 0.7, 0.28], mBuff = [0.7, 0.53, 0.33], mCap = [0.23, 0.18, 0.14], mMuz = [0.8, 0.76, 0.69], mPaw = [0.22, 0.17, 0.13];
    const mParts = [[new GB(), 0, 0, 0], [new GB(), 2, -0.1, 0.1], [new GB(), 1, 0.2, 0.15]];
    egg(mParts[0][0], [-0.1, 0.125, 0], [0.155, 0.125, 0.15], 0, 5, 3, (u, v) => mix(mBelly, mBack, v * 1.4 + 0.6));
    tube(mParts[0][0], [[-0.2, 0.14, 0], [-0.37, 0.07, 0]], [0.05, 0], 3, (k) => k ? mDark : mBack);
    egg(mParts[1][0], [0.07, 0.13, 0], [0.16, 0.115, 0.13], 0, 5, 3, (u, v) => mix(mBelly, mBack, v * 1.6 + 0.5));
    egg(mParts[1][0], [0.17, 0.04, 0], [0.055, 0.04, 0.09], 0, 4, 2, () => mPaw);
    egg(mParts[2][0], [0.27, 0.16, 0], [0.085, 0.072, 0.08], 0, 5, 3, (u, v) => u > 0.62 ? mMuz : v > 0.25 ? mCap : mBuff);
    // Rocky Mountain bighorn, ram size (ewes and lambs smaller): brown coat, white rump patch, belly and muzzle, dark hooves; the ram's heavy curls, the ewe's
    // short horns. 0: body and tail, 1: neck and head, 2 / 3: the legs (diagonal pairs), 4 / 5: the horns
    const sCoat = [0.47, 0.37, 0.27], sDark = [0.36, 0.28, 0.2], sWht = [0.9, 0.87, 0.8], sHorn = [0.8, 0.7, 0.52], sHornT = [0.6, 0.51, 0.37], sHoof = [0.15, 0.12, 0.1], JN = [0.52, 0.7];
    const sParts = [[new GB(), 0, 0, 0], [new GB(), 1, JN[0], JN[1]]];
    egg(sParts[0][0], [0, 0.74, 0], [0.66, 0.32, 0.29], 0, 6, 4, (u, v) => u < -0.6 && v < 0.5 ? sWht : v < -0.6 ? mix(sCoat, sWht, 0.7) : mix(sCoat, sDark, (u - 0.2) * 1.5));
    tube(sParts[0][0], [[-0.6, 0.88, 0], [-0.72, 0.7, 0]], [0.055, 0], 3, () => sDark);
    egg(sParts[1][0], [0.68, 0.9, 0], [0.25, 0.16, 0.15], 0.8, 5, 3, (u, v) => v < -0.5 ? mix(sDark, sWht, 0.45) : sDark);
    egg(sParts[1][0], [0.9, 1.1, 0], [0.2, 0.11, 0.095], -0.5, 5, 3, (u) => u > 0.55 ? sWht : mix(sCoat, sDark, 0.3));
    for (const [x, z, k] of [[0.42, 0.15, 2], [-0.44, -0.15, 2], [0.42, -0.15, 3], [-0.44, 0.15, 3]]) { const g = new GB(); tube(g, [[x, 0.6, z], [x, 0, z]], [0.085, 0.048], 4, (q) => q ? sHoof : sCoat); sParts.push([g, k, x, 0.6]); }
    for (const sd of [-1, 1]) { const pts = [], rad = []; for (let k = 0; k <= 5; k++) { const f = k / 5, a = PI / 2 + f * 1.6 * PI, r = 0.19 * (1 - 0.35 * f); pts.push([0.78 + Math.cos(a) * r, 1.07 + Math.sin(a) * r, sd * (0.08 + 0.2 * f)]); rad.push(k === 5 ? 0 : 0.1 * (1 - 0.65 * f)); }
      const g = new GB(); tube(g, pts, rad, 3, (k) => mix(sHorn, sHornT, k / 5)); sParts.push([g, 4, JN[0], JN[1]]); }
    for (const sd of [-1, 1]) { const g = new GB(); tube(g, [[0.84, 1.18, sd * 0.05], [0.77, 1.29, sd * 0.07], [0.68, 1.33, sd * 0.085]], [0.032, 0.024, 0], 3, () => sHornT); sParts.push([g, 5, JN[0], JN[1]]); }

    const clear = (x, z, r, dd) => { for (let k = 0; k < 7; k++) { const a = k * TAU / 6, px = x + (k ? Math.cos(a) * r : 0), pz = z + (k ? Math.sin(a) * r : 0); if (pkNear(px, pz).dd < dd || excluded(px, pz)) return false; } return true; };   // a round footprint beyond the barriers, free
    const info = { cols: [], bands: [] };   // (where they went: for the tests and the screenshot tools)
    const busy = (s, r) => s > sFin - 110 || T.cpS.some(c => Math.abs(s - c) < 38) || T.corners.some(c => c.sev >= 3 && Math.abs(s - (c.i0 + c.i1) / 2 * T.ds) < r);   // (the checkpoints, the hairpins' crowds, the summit)

    /* bighorn bands (4-8: a ram or two, ewes, a lamb now and then) grazing on a slope beside the road: the spot within [sa, sb] with the best slope a few metres
       beyond the barrier; each sheep has two or three spots a slow step apart (it walks between them), each checked for its whole turning circle */
    const SS = 1.1, S = [], bands = [];   // (the sheep a little over life size: they read from the high cameras)
    const stand = (x, z, h, sc) => { const L = 1.05 * sc * SS; if (!clear(x, z, L, 2.2) || pkSlope(x, z) > 0.8) return null;   // -> the ground under the lowest hoof (the others sink a little), or null
      const c = Math.cos(h), s = Math.sin(h), a = 0.43 * sc * SS, b = 0.13 * sc * SS; let lo = 1e9, hi = -1e9;
      for (const [p, q] of [[a, b], [a, -b], [-a, b], [-a, -b]]) { const y = gy(x + c * p - s * q, z + s * p + c * q); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      if (hi - lo > 0.28 * sc || S.some(o => o.st.some(p => (p[0] - x) ** 2 + (p[2] - z) ** 2 < 4))) return null;
      return lo - 0.03; };
    const band = (sa, sb) => {
      let best = null;
      for (let s = sa; s <= sb; s += 5) for (const side of [-1, 1]) for (const e of [3.5, 5, 7, 9, 12]) { if (busy(s, 34)) continue;
        const [x, z, i] = K.onSide(s, side, e), y = gy(x, z), sl = pkSlope(x, z), dh = y - T.hy[i]; if (sl > 0.7 || dh < -3 || dh > 10 || !clear(x, z, 1.5, 2.2)) continue;
        const sc = -Math.abs(sl - 0.3) - e * 0.04 - ((side > 0 ? T.br[i] : T.bl[i]) - 10.5) * 0.06 - Math.max(0, -dh) * 0.15 - Math.max(0, dh - 5) * 0.06; if (!best || sc > best.sc) best = { x, z, i, s, side, sc }; }
      if (!best) return;
      const n = 4 + Math.floor(R() * 5), i = best.i, tx = T.tx[i], tz = T.tz[i], ox = T.nx[i] * best.side, oz = T.nz[i] * best.side, b = { x: best.x, z: best.z, a0: S.length, a1: 0 };
      for (let k = 0, tries = 0; k < n && tries < 90; tries++) {
        const u = (R() - 0.5) * 16, v = (R() - 0.5) * 7, x = best.x + tx * u + ox * v, z = best.z + tz * u + oz * v, kind = k < (n > 5 ? 2 : 1) ? 0 : R() < 0.22 ? 2 : 1, sc = [1.1, 0.88, 0.56][kind];   // rams, ewes, lambs
        const gx = gy(x + 1, z) - gy(x - 1, z), gz = gy(x, z + 1) - gy(x, z - 1), h = (Math.hypot(gx, gz) > 0.15 ? Math.atan2(gx, -gz) + (R() < 0.5 ? PI : 0) : R() * TAU) + (R() - 0.5) * 0.8;   // across the slope
        const y = stand(x, z, h, sc); if (y === null) continue;
        const st = [[x, y, z, h]];
        for (let q = 0; q < 2; q++) { const p = st[st.length - 1], a = p[3] + (R() - 0.5) * 1.1, d = 0.9 + R() * 0.7, px = p[0] + Math.cos(a) * d, pz = p[2] + Math.sin(a) * d, py = stand(px, pz, a, sc); if (py === null) break; st.push([px, py, pz, a]); }
        S.push({ st, k: 0, nk: 0, x, y, z, h, sc: sc * SS, w: kind ? (kind === 1 ? 0 : -1) : k ? 0.8 : 1, hp: -1.6, hy: 0, lg: 0, md: 0, u: 0, D: 1, tS: 0, tn: 2 + R() * 9, ty: 0, ph: R() * TAU }); k++; }
      b.a1 = S.length; if (b.a1 === b.a0) return;
      let r = 0; for (let k = b.a0; k < b.a1; k++) for (const p of S[k].st) r = Math.max(r, Math.hypot(p[0] - b.x, p[2] - b.z));
      excl.push({ x: b.x, z: b.z, r: r + 5 }); bands.push(b); info.bands.push([Math.round(best.s), best.side, b.a1 - b.a0]);   // (a wide margin: the boulders placed later check their centres only)
    };
    band(3330, 3470);   // above the W's
    band(4050, 4210);   // Devil's Playground
    band(4980, 5090);   // below Boulder Park

    /* marmot colonies: a granite rock or two with a burrow under the big one's foot (a dark hole, a fan of dug-out soil), 2-11 m beyond the barrier; a sentinel
       sitting up on the top (or one lying there), sometimes a second one on the small rock or beside the hole, now and then a young one */
    const M = [], cols = [], graniteC = [[0.54, 0.44, 0.39], [0.48, 0.42, 0.39], [0.58, 0.48, 0.43]], holeC = [0.09, 0.07, 0.055], dirtC = [0.52, 0.41, 0.31];
    const colony = (s, x, z, i, side, rr, sl, yc) => {
      const ry = 0.5 + R() * 0.3 + sl * rr * 1.1, nm = R(), yng = R();   // (a wide sunning rock; taller on a slope: the top stays clear of the ground above it)
      let ym = yc; for (let k = 0; k < 6; k++) { const a = k * TAU / 6; ym = Math.min(ym, gy(x + Math.cos(a) * rr, z + Math.sin(a) * rr)); }
      const g = scen.get(x, z), col = vary(graniteC[Math.floor(R() * 3)], R, 0.1), yb = ym + (yc - ym) * 0.3 - 0.12, top = yb + ry;
      rock(g, x, yb + 0.4 * ry, z, rr, ry, rr * (0.72 + R() * 0.25), R() * TAU, col, R, 0.25);
      const ox = T.nx[i] * side, oz = T.nz[i] * side, ab = Math.atan2(oz, ox) + (R() - 0.5) * 1.8, bd = rr * 0.9 + 0.1, hx = x + Math.cos(ab) * bd, hz = z + Math.sin(ab) * bd, hy = gy(hx, hz);   // the burrow: on the far side
      const disc = (cx, cz, r, dy, c, n, el) => { const ps = []; for (let k = 0; k < n; k++) { const a = ab + k / n * TAU, rk = r * (1 + el * Math.cos(a - ab)), px = cx + Math.cos(a) * rk, pz = cz + Math.sin(a) * rk; ps.push([px, gy(px, pz) + dy, pz]); }
        const mid = [cx, gy(cx, cz) + dy, cz], gd = K.noShadow(cx, cz); for (let k = 0; k < n; k++) gd.triO(ps[k], ps[(k + 1) % n], mid, c, [cx, mid[1] - 5, cz]); };
      disc(hx + Math.cos(ab) * 0.36, hz + Math.sin(ab) * 0.36, 0.62, 0.03, vary(dirtC, R, 0.08), 7, 0.3); disc(hx, hz, 0.34, 0.05, holeC, 6, 0.15);
      const tops = [], n2 = R() < 0.4 ? 2 : 1;
      for (let k = 0; k < n2; k++) { const a = Math.atan2(oz, ox) + (k % 2 ? 1 : -1) * (0.9 + R() * 0.8), r2 = 0.3 + R() * 0.3, d = rr + r2 * 0.6, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, py = gy(px, pz);   // (beside and behind the big one)
        if (Math.abs(Math.atan2(Math.sin(a - ab), Math.cos(a - ab))) < 0.75) continue;   // (not on the burrow)
        ico(g, px, py + r2 * 0.12, pz, r2, 0.72, vary(col, R, 0.1), R, 0.35); tops.push([px, py + r2 * 0.62, pz]); }
      const face = Math.atan2(-oz, -ox), c0 = M.length;   // (facing the road, give or take)
      const add = (px, py, pz, h, up, sc) => M.push({ x: px, y: py, z: pz, h, bx: hx, by: hy, bz: hz, up, sc, fl: 22 + R() * 8, ph: R() * TAU, st: 0, tS: 0, wt: 0, pk: 0,
        ax: px, ay: py, az: pz, ah: h, ra: up ? 1.3 : 0, hy: 0, hp: 0, sk: 0, ty: 0, tn: R() * 2, bob: 0, sit: 0, fx: px, fy: py, fz: pz });
      const beside = (sc, up) => { const a = ab + (R() < 0.5 ? 1 : -1) * (1 + R() * 0.7), px = hx + Math.cos(a) * 1, pz = hz + Math.sin(a) * 1; if (pkNear(px, pz).dd > 2) add(px, gy(px, pz), pz, face + (R() - 0.5) * 2, up, sc); };
      add(x, top, z, face + (R() - 0.5) * 1.8, R() < 0.62 ? 1 : 0, MS * (0.93 + R() * 0.14));
      if (nm < 0.4 && tops.length) { const p = tops[0]; add(p[0], p[1], p[2], face + (R() - 0.5) * 2.4, R() < 0.5 ? 1 : 0, MS * (0.88 + R() * 0.14)); }
      else if (nm < 0.58) beside(MS * (0.9 + R() * 0.12), 1);
      if (yng < 0.15) beside(MS * 0.62, R() < 0.5 ? 1 : 0);
      cols.push({ x, z, m0: c0, m1: M.length, on: false }); excl.push({ x, z, r: rr * 1.8 + 3 }); info.cols.push([Math.round(s), side, M.length - c0]);
    };
    const fits = (x, z, ox, oz, rr, rc, dd) => {   // the big rock's side towards the road (rr + 0.2) and the far side with the small rocks and the burrow (rc): beyond the barriers, free
      const a0 = Math.atan2(oz, ox); if (pkNear(x, z).dd < dd) return false;
      for (const u of [0, -3, 3, -6, 6]) if (excluded(x - oz * u, z + ox * u)) return false;   // (along the road too: the snow banks' circles are 8 m apart)
      for (let k = 0; k < 9; k++) { const a = a0 + (k < 4 ? PI + (k - 1.5) * 0.7 : (k - 6) * 0.8), d = k < 4 ? rr + 0.2 : rc, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (pkNear(px, pz).dd < dd || excluded(px, pz)) return false; }
      return true; };
    const site = (s, sd, e0) => {   // a colony near road s: the first spot that fits (the nearer barrier's side first: in view of the chase camera), then the other side and farther out
      const rr = 1.05 + R() * 0.45, rc = rr * 1.8 + 0.3, i0 = T.idx(s); if (Math.abs(T.bl[i0] - T.br[i0]) > 2) sd = T.br[i0] < T.bl[i0] ? 1 : -1;
      for (const [side, e] of [[sd, e0], [sd, e0 + 1.5], [sd, e0 + 3.5], [-sd, e0], [-sd, e0 + 2], [sd, e0 + 6], [-sd, e0 + 5]]) {
        const [x, z, i] = K.onSide(s, side, rr + 1.7 + e), yc = gy(x, z), sl = pkSlope(x, z), ox = T.nx[i] * side, oz = T.nz[i] * side;
        if (sl > 0.6 || yc < T.hy[i] - 4 || yc > T.hy[i] + 9 || !fits(x, z, ox, oz, rr, rc, 1.5)) continue;
        colony(s, x, z, i, side, rr, sl, yc); return; }
    };
    for (const [a, b, step, p] of [[3100, 3470, 34, 0.8], [3470, 4040, 95, 0.6], [4040, 4260, 30, 0.9], [4260, 5150, 100, 0.6], [5150, 5985, 30, 0.95], [5985, 6100, 55, 0.6]])   // the W's upper legs, Devil's Playground, Boulder Park
      for (let s = a; s < b; s += step) { const s1 = s + R() * step * 0.6, sd = R() < 0.5 ? -1 : 1, e = Math.pow(R(), 2.5) * 5; if (R() > p || busy(s1, 20)) continue; site(s1, sd, e); }

    const lf = { t: 0, r: rng(9679), aM: 70, aS: 75, M, cols, S, bands, info, mm: M.length ? mesh(mParts, M.length, [-0.1, 0.1, 1], [0, 0, 0], 'pkMarmots') : null, sm: S.length ? mesh(sParts, S.length, [0, 0, 0], [0.9, 1.1, 0], 'pkSheep') : null };
    lf.put = (im, k, x, y, z, h, s, a, b, c, d) => {   // instance k: at (x, y, z) facing h (model +x), scaled s, pose (a, b, c, d)
      const E = im.instanceMatrix.array, Q = im.geometry.attributes.aPose.array, o = k * 16, co = Math.cos(h) * s, si = Math.sin(h) * s;
      E[o] = co; E[o + 1] = 0; E[o + 2] = si; E[o + 3] = 0; E[o + 4] = 0; E[o + 5] = s; E[o + 6] = 0; E[o + 7] = 0; E[o + 8] = -si; E[o + 9] = 0; E[o + 10] = co; E[o + 11] = 0; E[o + 12] = x; E[o + 13] = y; E[o + 14] = z; E[o + 15] = 1;
      Q[k * 4] = a; Q[k * 4 + 1] = b; Q[k * 4 + 2] = c; Q[k * 4 + 3] = d; };
    lf.fin = (im, n) => { if (!im) return; im.count = n; im.visible = n > 0; if (!n) return;   // draw the first n (only those are sent to the GPU)
      const A = im.instanceMatrix, B = im.geometry.attributes.aPose; A.updateRange.offset = B.updateRange.offset = 0; A.updateRange.count = n * 16; B.updateRange.count = n * 4; A.needsUpdate = B.needsUpdate = true; };
    lf.home = (m) => { m.st = 0; m.tS = 0; m.ax = m.x; m.ay = m.y; m.az = m.z; m.ah = m.h; m.ra = m.up ? 1.3 : 0; m.sk = 0; m.hy = m.hp = 0; };
    K.out.dyn.pkLife = lf;
  }

  function pkWildlifeUpdate(lf, t, car) {
    const dt = clamp(t - lf.t, 0, 0.1); lf.t = t; if (!car) return;
    const cx = car.x, cz = car.z, r = lf.r, PI = Math.PI, M = lf.M, S = lf.S, ez = (v, g, k) => v + (g - v) * Math.min(1, dt * k), W = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    /* marmots (only the colonies within 100 m are posed and drawn; a colony left behind goes back to its rocks): on the rock the sentinel sits up and looks
       about, now and then ducks; a lying one lifts its head, sits up now and then; everyone sits up and watches a car coming (70 m). Within ~25 m: drop, dash
       to the burrow, dive in; out again a few seconds after the car has gone (45 m): the head and shoulders first, a look round, then back up onto the rock */
    let n = 0;
    for (const c of lf.cols) {
      if ((c.x - cx) ** 2 + (c.z - cz) ** 2 > 10000) { if (c.on) { c.on = false; for (let k = c.m0; k < c.m1; k++) lf.home(M[k]); } continue; }
      c.on = true;
      for (let k = c.m0; k < c.m1; k++) { const m = M[k], dx = cx - m.ax, dz = cz - m.az, d = Math.sqrt(dx * dx + dz * dz), T0 = 0.12;
        let gr = 0, gY = 0, gP = 0, gH = m.ah, kr = 7, kh = 2.5; m.tS += dt;
        if (m.st === 4) {   // back to the rock: out of the hole, a scamper and a hop up
          const D = Math.hypot(m.x - m.bx, m.z - m.bz), u = Math.min(1, m.tS / Math.max(0.8, D / 1.1)), f = sstep(0.45, 0.95, u);
          m.ax = lerp(m.bx, m.x, u); m.az = lerp(m.bz, m.z, u); m.ay = lerp(m.by, m.y, f) + Math.sin(PI * f) * 0.15; m.sk = ez(m.sk, 0, 8); gH = Math.atan2(m.z - m.bz, m.x - m.bx); kh = 8;
          if (d < m.fl) { m.st = 1; m.tS = 0; m.fx = m.ax; m.fy = m.ay; m.fz = m.az; } else if (u >= 1) { m.st = 0; m.tS = 0; }
        }
        if (m.st === 0) {   // on its rock
          m.ax = m.x; m.ay = m.y; m.az = m.z; m.sk = ez(m.sk, 0, 8);
          if (d < m.fl) { m.st = 1; m.tS = 0; m.fx = m.x; m.fy = m.y; m.fz = m.z; }
          else { const al = d < lf.aM; m.tn -= dt; m.bob -= dt; m.sit -= dt;
            if (m.tn <= 0) { m.tn = 0.6 + r() * 2.2; m.ty = (r() - 0.5) * 2.2; const q = r(); if (m.up && q < 0.3) m.bob = 0.4; if (!m.up && q < 0.22) m.sit = 2 + r() * 2.5; }
            gr = m.up || al || m.sit > 0 ? (m.bob > 0 && !al ? 0.45 : 1.3) : 0;
            const a = Math.atan2(dz, dx); gY = al ? clamp(W(m.ah - a), -1.2, 1.2) : m.ty; gH = al ? m.h + clamp(W(a - m.h), -1.3, 1.3) : m.h;
            gP = gr > 0.2 ? 0.08 * Math.sin(t * 1.7 + m.ph) : -0.28 + 0.12 * Math.sin(t * 2.3 + m.ph); }
        }
        if (m.st === 1) {   // flight: drop, dash to the burrow, dive in head first
          const D = Math.hypot(m.bx - m.fx, m.bz - m.fz), Tr = Math.max(0.4, D / 3), hd = D > 0.05 ? Math.atan2(m.bz - m.fz, m.bx - m.fx) : m.ah; kr = 14; kh = 14;
          if (m.tS < T0) gH = hd;
          else if (m.tS < T0 + Tr) { const u = (m.tS - T0) / Tr; m.ax = lerp(m.fx, m.bx, u); m.az = lerp(m.fz, m.bz, u); m.ay = lerp(m.fy, m.by, sstep(0.1, 0.9, u)) + Math.sin(PI * u) * 0.2 + Math.abs(Math.sin(m.tS * 20)) * 0.06; gr = -0.12; gH = hd; }
          else { const u = (m.tS - T0 - Tr) / 0.3; m.ax = m.bx; m.ay = m.by; m.az = m.bz; m.sk = Math.max(m.sk, Math.min(1, u) * 0.75 * m.sc); gr = -0.7; kr = 10;
            if (u >= 1) { m.st = 2; m.tS = 0; m.wt = 2.5 + r() * 3; } }
        }
        if (m.st === 2) { if (m.tS > m.wt && d > 45) { m.st = 3; m.tS = 0; m.pk = 1.3 + r() * 1.8; } else continue; }   // down the burrow (not drawn)
        if (m.st === 3) {   // peeking out: head and shoulders, glancing about
          m.ax = m.bx; m.ay = m.by; m.az = m.bz; m.sk = ez(m.sk, 0.3 * m.sc, 3); gr = 1.3; m.tn -= dt; if (m.tn <= 0) { m.tn = 0.4 + r() * 0.9; m.ty = (r() - 0.5) * 2.4; } gY = m.ty;
          if (d < m.fl + 5) { m.st = 1; m.fx = m.bx; m.fy = m.by; m.fz = m.bz; m.tS = T0 + 0.4; } else if (m.tS > m.pk) { m.st = 4; m.tS = 0; }   // (a car again: straight back down)
        }
        m.ra = ez(m.ra, gr, kr); m.hy = ez(m.hy, gY, 6); m.hp = ez(m.hp, gP, 5); m.ah += W(gH - m.ah) * Math.min(1, dt * kh);
        lf.put(lf.mm, n++, m.ax, m.ay - m.sk, m.az, m.ah, m.sc, m.hy, m.hp - Math.max(0, m.ra) * 0.9, m.ra, 0);
      }
    }
    lf.fin(lf.mm, n);
    /* bighorn sheep (the bands within 130 m): heads down grazing (chewing), now and then a look round or a slow step to the next spot; heads up, watching the car
       while it is within 75 m */
    n = 0;
    for (const b of lf.bands) {
      if ((b.x - cx) ** 2 + (b.z - cz) ** 2 > 16900) continue;
      for (let k = b.a0; k < b.a1; k++) { const q = S[k], dx = cx - q.x, dz = cz - q.z, al = dx * dx + dz * dz < lf.aS * lf.aS;
        let gP = -1.6 + 0.06 * Math.sin(t * 5 + q.ph), gY = 0.25 * Math.sin(t * 0.37 + q.ph); q.tS += dt;
        if (q.md === 2) {   // a slow step: turn towards the next spot, walk (0.45 m/s), legs swinging
          const A = q.st[q.k], B = q.st[q.nk], e = W(Math.atan2(B[2] - A[2], B[0] - A[0]) - q.h); q.h += e * Math.min(1, dt * 1.6);
          if (Math.abs(e) < 0.35) q.u += dt * 0.45 / q.D;
          const u = Math.min(1, q.u); q.x = lerp(A[0], B[0], u); q.y = lerp(A[1], B[1], u); q.z = lerp(A[2], B[2], u); q.lg = 0.36 * Math.sin(q.tS * 6.5); gP = -0.35; gY = 0;
          if (q.u >= 1) { q.k = q.nk; q.md = 0; q.tn = 6 + r() * 10; }
        } else { q.tn -= dt; q.lg = ez(q.lg, 0, 6);
          if (q.tn <= 0) { if (q.md === 1 || q.st.length < 2 || r() < 0.5) { q.md = q.md === 1 ? 0 : 1; q.tn = q.md ? 1.5 + r() * 2.5 : 5 + r() * 9; q.ty = (r() - 0.5) * 1.6; }
            else { const L = q.st.length, fw = q.k === L - 1 ? false : q.k === 0 ? true : r() < 0.5; q.nk = q.k + (fw ? 1 : -1); q.md = 2; q.u = 0; q.tS = 0; q.D = Math.max(0.3, Math.hypot(q.st[q.nk][0] - q.x, q.st[q.nk][2] - q.z)); } }
          if (q.md === 1) { gP = 0.05; gY = q.ty; } }
        if (al && q.md !== 2) { gP = 0.08; gY = clamp(W(q.h - Math.atan2(dz, dx)), -1.25, 1.25); }
        q.hp = ez(q.hp, gP, 2.2); q.hy = ez(q.hy, gY, 2.5);
        lf.put(lf.sm, n++, q.x, q.y, q.z, q.h, q.sc, q.hy, q.hp, q.lg, q.w);
      }
    }
    lf.fin(lf.sm, n);
  }

  /* ---- round 4, the air and the details: haze layered in the valleys, the distant peaks where the view opens (the Bottomless Pit),
     flags fluttering in the wind, dust in the air, smoke from the grills at the picnic grounds (built at the end of buildPikes;
     pkAmbientUpdate runs every frame when out.dyn.pkAmb is set) ---- */
  function pkAmbient(K) {
    const out = K.out, root = K.root, P = K.P, G = P.G, uT = { value: 0 }, WD = 2.2, wx = Math.cos(WD), wz = Math.sin(WD);   // (the wind: the way the W's camp flags stream)
    const am = { uT };

    // flags on poles waving in the wind (the cloth that the start, the finish, the W's camps and the podium left in out.pkFl): [x, y (the cloth's top at the pole), z,
    // the way it flies (rad from +x), its cells in rows top to bottom, width, height]; pushed out of its plane in the vertex shader, more towards the free end and
    // higher up the mountain, the phase by position. One material, a mesh per place (the start, the W's, the summit; culled)
    const FL = out.pkFl || []; delete out.pkFl;
    if (FL.length) {
      const fm = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), cells = new Map();
      fm.onBeforeCompile = (sh) => { sh.uniforms.uT = uT;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aFl;\nuniform float uT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
          '{ float u = aFl.x, ph = aFl.y, g = 0.75 + 0.25 * sin(uT * 0.9 + ph * 0.3), w = sin(uT * 7.0 - u * 6.5 + ph) + 0.45 * sin(uT * 11.3 - u * 11.0 + ph * 1.7);\n' +
          '  transformed += objectNormal * w * aFl.z * g * u; transformed.y -= (0.6 - 0.4 * g) * aFl.z * 1.5 * u * u; }'); };
      fm.customProgramCacheKey = () => 'pkFlag';
      for (const [x, y, z, rot, rows, W, H] of FL) {
        const k = y < 100 ? 0 : y < 330 ? 1 : 2; let c = cells.get(k); if (!c) cells.set(k, c = { P: [], N: [], C: [], F: [], I: [] });
        const cs = Math.cos(rot), sn = Math.sin(rot), nc = Math.max(...rows.map(r => r.length)), sub = Math.ceil(4 / nc), ph = (x * 0.37 + z * 0.23) % TAU + (y % 7), amp = W * (0.055 + 0.05 * sstep(0, 440, y));
        rows.forEach((row, r) => { for (let q = 0; q < nc; q++) { const col = row[q % row.length], v = c.P.length / 3;
          for (let m = 0; m <= sub; m++) { const u = (q + m / sub) / nc;
            for (const f of [r / rows.length, (r + 1) / rows.length]) { c.P.push(x + cs * W * u, y - H * f - u * u * 0.06 * H, z + sn * W * u); c.N.push(-sn, 0, cs); c.C.push(col[0], col[1], col[2]); c.F.push(u, ph, amp); } }
          for (let m = 0; m < sub; m++) { const a = v + m * 2; c.I.push(a, a + 2, a + 3, a, a + 3, a + 1); } } });
      }
      for (const c of cells.values()) {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(c.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(c.N, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(c.C, 3)); g.setAttribute('aFl', new THREE.Float32BufferAttribute(c.F, 3)); g.setIndex(c.I); g.computeBoundingSphere(); g.boundingSphere.radius += 1;
        const m = new THREE.Mesh(g, fm); m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'pkFlags'; root.add(m);
      }
    }

    // soft haze lying in the valleys below the road, in three layers 20, 42 and 75 m under the road's height trend there (never within 12 m of a road within 80 m), draped
    // over the ground where it rises into them, thick where the ground lies deep below; lit warm by the low sun, drifting with the wind. Precomputed on a 20 m field over the
    // corridor; drawn as a 480 m grid ahead of the camera, rebuilt when that moves a cell (pkAmbientUpdate); one draw where there is haze in it.
    // (No distant peaks: a ring of ridge silhouettes round the camera, even at 0.6 of the fog's end, was never seen in any camera anywhere on the road: the views look
    // down, and the nearer ground always fills the top of the frame)
    const FS = 4, SC = FS * PKC, fnx = Math.floor((G.nx - 1) / FS) + 1, fnz = Math.floor((G.nz - 1) / FS) + 1, NL = 3, DL = [20, 42, 75], AL = [0.3, 0.36, 0.42];
    const minR = new Float32Array(fnx * fnz).fill(1e9), LY = new Float32Array(fnx * fnz * NL), LA = new Float32Array(fnx * fnz * NL);
    for (let i = 0; i < T.N; i += 3) { const cx = (T.px[i] - G.x0) / SC, cz = (T.pz[i] - G.z0) / SC, hy = T.hy[i];
      for (let b = Math.max(0, Math.ceil(cz - 4)); b <= Math.min(fnz - 1, Math.floor(cz + 4)); b++) for (let a = Math.max(0, Math.ceil(cx - 4)); a <= Math.min(fnx - 1, Math.floor(cx + 4)); a++) {
        if ((a - cx) ** 2 + (b - cz) ** 2 > 16) continue; const k = b * fnx + a; if (hy < minR[k]) minR[k] = hy; } }
    for (let b = 0; b < fnz; b++) for (let a = 0; a < fnx; a++) {
      const k = b * fnx + a, x = G.x0 + a * SC, z = G.z0 + b * SC, ref = pkTG(P.th, x, z), far = pkTG(P.td, x, z) > 480;
      let gm = -1e9, dd = 999;
      if (!far) { const i = a * FS, j = b * FS; for (const [p, q] of [[0, 0], [-2, -2], [2, -2], [-2, 2], [2, 2], [0, -2], [0, 2], [-2, 0], [2, 0]]) gm = Math.max(gm, pkGH(i + p, j + q)); dd = G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]; }
      for (let L = 0; L < NL; L++) { const yl = Math.min(ref - DL[L], minR[k] - 12 - L * 6), o = k * NL + L;
        if (far) { LY[o] = yl; LA[o] = 0; continue; }
        LY[o] = Math.max(yl, gm + 1.2); LA[o] = AL[L] * sstep(2, 24, yl - gm) * sstep(6, 28, dd); }
    }
    const NG = 24, NV = (NG + 1) * (NG + 1), hp = new Float32Array(NV * NL * 3), ha = new Float32Array(NV * NL * 2), hi = new Uint16Array(NG * NG * NL * 6);
    for (let L = 0; L < NL; L++) for (let k = 0; k < NV; k++) ha[(L * NV + k) * 2 + 1] = L;
    const ht = (() => {   // soft haze noise (tileable, 128 px; own stream)
      const n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n; const cx = cv.getContext('2d'), im = cx.createImageData(n, n), acc = new Float32Array(n * n), R = rng(7753); let lo = 1e9, hi2 = -1e9;
      for (let o = 0, Q = 4, amp = 1; o < 3; o++, Q *= 2, amp *= 0.5) { const g = new Float32Array(Q * Q); for (let k = 0; k < g.length; k++) g[k] = R();
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const fx = x / n * Q, fy = y / n * Q, xi = Math.floor(fx), yi = Math.floor(fy), u = sstep(0, 1, fx - xi), w = sstep(0, 1, fy - yi), x1 = (xi + 1) % Q, y1 = (yi + 1) % Q;
          acc[y * n + x] += amp * lerp(lerp(g[yi * Q + xi], g[yi * Q + x1], u), lerp(g[y1 * Q + xi], g[y1 * Q + x1], u), w); } }
      for (const v of acc) { lo = Math.min(lo, v); hi2 = Math.max(hi2, v); }
      for (let k = 0; k < n * n; k++) { const v = Math.round((acc[k] - lo) / (hi2 - lo) * 255); im.data[k * 4] = im.data[k * 4 + 1] = im.data[k * 4 + 2] = v; im.data[k * 4 + 3] = 255; }
      cx.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; out.ownTex.push(t); return t; })();
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(hp, 3)); hg.setAttribute('aH', new THREE.BufferAttribute(ha, 2)); hg.setIndex(new THREE.BufferAttribute(hi, 1));
    hg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); hg.setDrawRange(0, 0);
    const hU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTex: { value: null }, uO: { value: new THREE.Vector4() } }]);
    hU.uTex.value = ht;
    const hm = new THREE.Mesh(hg, new THREE.ShaderMaterial({ uniforms: hU, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'uniform vec4 uO; attribute vec2 aH; varying vec2 vW, vA, vB; varying float vFd;\n' +
        'void main() { float L = aH.y; vW = aH; vA = position.xz / 150.0 + (L > 1.5 ? uO.xy : uO.zw) + L * 0.31; vB = position.xz / 55.0 + uO.zw * 1.7 - uO.xy + L * 0.17;\n' +
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0); vFd = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D uTex; uniform vec3 fogColor; uniform float fogNear, fogFar; varying vec2 vW, vA, vB; varying float vFd;\n' +
        'void main() { float n = texture2D(uTex, vA).r * 0.65 + texture2D(uTex, vB).r * 0.35, a = vW.x * smoothstep(0.2, 0.75, n);\n' +
        '  vec3 c = mix(vec3(1.0, 0.88, 0.72), vec3(0.93, 0.87, 0.86), vW.y * 0.5) * (0.92 + 0.14 * n);\n' +   // (warm in the low sun; the deeper layers greyer)
        '  gl_FragColor = vec4(mix(c, fogColor, smoothstep(fogNear, fogFar, vFd)), a); }' }));
    hm.frustumCulled = false; hm.renderOrder = 3; hm.matrixAutoUpdate = false; hm.visible = false; hm.name = 'pkHaze'; root.add(hm);
    const hz = { hm, hg, hp, ha, hi, hU, NG, NV, NL, fnx, fnz, SC, LY, LA, cx: 1e9, cz: 1e9, dir: [0, -1], cam: null, x0: G.x0, z0: G.z0 };
    hz.grid = (ca, cb) => {   // (pkAmbientUpdate: the haze grid's positions and alphas from the precomputed field, its cells where there is haze)
      hz.cx = ca; hz.cz = cb;
      const W = NG + 1; let q = 0;
      for (let L = NL - 1; L >= 0; L--) {   // (the deepest layer first)
        const v0 = L * NV;
        for (let b = 0; b <= NG; b++) for (let a = 0; a <= NG; a++) {
          const fa = clamp(ca + a, 0, fnx - 1), fb = clamp(cb + b, 0, fnz - 1), k = (fb * fnx + fa) * NL + L, v = v0 + b * W + a, inn = fa === ca + a && fb === cb + b;
          hp[v * 3] = G.x0 + (ca + a) * SC; hp[v * 3 + 1] = LY[k]; hp[v * 3 + 2] = G.z0 + (cb + b) * SC; ha[v * 2] = inn ? LA[k] : 0; }
        for (let b = 0; b < NG; b++) for (let a = 0; a < NG; a++) { const v = v0 + b * W + a;
          if (ha[v * 2] + ha[(v + 1) * 2] + ha[(v + W) * 2] + ha[(v + W + 1) * 2] < 0.01) continue;
          hi[q] = v; hi[q + 1] = v + W; hi[q + 2] = v + W + 1; hi[q + 3] = v; hi[q + 4] = v + W + 1; hi[q + 5] = v + 1; q += 6; }
      }
      hg.attributes.position.needsUpdate = true; hg.attributes.aH.needsUpdate = true; hg.index.needsUpdate = true; hg.setDrawRange(0, q); hm.visible = q > 0;
      if (q < (hz.q || 0)) hi.fill(0, q, hz.q); hz.q = q;   // (no stale cells past the draw range: the buffer is the same for the same place)
    };
    am.hz = hz;

    // in the air round the car (one Points, recycled in a box that follows it): a few sunlit motes in the forest, dust wisps blowing low across the road on the bare heights; and the grill smoke at the Halfway Picnic Grounds (puffs rising from the two pedestal grills,
    // drifting with the wind, growing and thinning)
    const grills = [];
    { const s0 = K.sStart + 1000, fl = (sd) => { const p = K.onSide(s0, sd, 14); return Math.abs(pkGround(p[0], p[1]) - T.hy[p[2]]); }, side = fl(1) <= fl(-1) ? 1 : -1;   // (as pkLandmarks)
      for (const [d, v] of [[5.2, 2.3], [-2.6, 6.8]]) { const q = crAt(s0 + d), o = side * ((side > 0 ? q.br : q.bl) + v), x = q.px + q.nx * o, z = q.pz + q.nz * o; grills.push([x, pkGround(x, z) + 1.0, z]); } }
    const NA = 150, ND = 80, NS = 22, np = NA + ND + NS * grills.length, pp = new Float32Array(np * 3), pk = new Float32Array(np * 4), BX = 56, BY = 18;
    { const R = rng(7759); let v = 0;
      for (let k = 0; k < NA + ND; k++, v++) { pp[v * 3] = R() * BX; pp[v * 3 + 1] = R() * BY; pp[v * 3 + 2] = R() * BX; pk[v * 4] = k < NA ? 0 : 1; pk[v * 4 + 1] = R(); pk[v * 4 + 2] = R(); pk[v * 4 + 3] = R(); }
      for (const [x, y, z] of grills) for (let k = 0; k < NS; k++, v++) { pp[v * 3] = x + (R() - 0.5) * 0.3; pp[v * 3 + 1] = y; pp[v * 3 + 2] = z + (R() - 0.5) * 0.3; pk[v * 4] = 2; pk[v * 4 + 1] = (k + R() * 0.5) / NS; pk[v * 4 + 2] = R(); pk[v * 4 + 3] = R(); } }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('aK', new THREE.BufferAttribute(pk, 4)); pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const pU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uC: { value: new THREE.Vector3() }, uW: { value: new THREE.Vector2(wx, wz) }, uS: { value: 400 }, uF: { value: new THREE.Vector3() } }]);
    pU.uT = uT;
    const pts = new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: pU, fog: true, transparent: true, depthWrite: false,
      vertexShader: 'uniform vec3 uC, uF; uniform vec2 uW; uniform float uT, uS; attribute vec4 aK; varying vec4 vC; varying float vK, vQ, vFd; varying vec2 vD;\n' +
        'void main() { vec3 p; float sz, a, ph = aK.z * 6.2832, t = uT; vec3 col; vK = aK.x; vQ = 1.0; vD = vec2(1.0, 0.0);\n' +
        '  if (aK.x > 1.5) {\n' +   // grill smoke: aK.y its phase
        '    float life = 7.0 + 3.0 * aK.w, u = fract(t / life + aK.y), age = u * life;\n' +
        '    p = position + vec3(0.0, 6.5 * (1.0 - (1.0 - u) * (1.0 - u)), 0.0); p.xz += uW * age * (0.15 + 0.55 * u) + vec2(sin(age * 0.8 + ph), cos(age * 0.7 + ph)) * 0.6 * u;\n' +
        '    sz = 0.5 + 2.8 * sqrt(u); a = smoothstep(0.0, 0.1, u) * pow(1.0 - u, 1.4) * 0.55; col = mix(vec3(0.6, 0.64, 0.72), vec3(0.8, 0.82, 0.86), u);\n' +
        '  } else {\n' +
        '    vec3 B = vec3(' + BX.toFixed(1) + ', ' + BY.toFixed(1) + ', ' + BX.toFixed(1) + '), q, lo;\n' +
        '    if (aK.x < 0.5) {\n' +   // motes (share uF.y): slow, swaying
        '      q = position + vec3(uW.x * t * 1.2 + sin(t * 0.9 + ph) * 1.6, -t * 0.12, uW.y * t * 1.2 + cos(t * 0.75 + ph) * 1.6);\n' +
        '      lo = uC - vec3(B.x * 0.5, 2.0, B.z * 0.5); p = lo + mod(q - lo, B);\n' +
        '      sz = 0.12; a = step(aK.y, uF.y) * 0.55 * (0.6 + 0.4 * sin(t * 1.7 + ph)); col = vec3(1.0, 0.94, 0.78); vK = 1.0; }\n' +
        '    else {\n' +   // dust wisps: fast, low over the road, in gusts
        '      q = position * vec3(1.0, 0.12, 1.0) + vec3(uW.x * t * 7.0, 0.9 + sin(t * 1.3 + ph) * 0.4, uW.y * t * 7.0);\n' +
        '      lo = uC - vec3(B.x * 0.5, 0.0, B.z * 0.5); p = lo + mod(q - lo, B); p.y = uC.y + q.y;\n' +
        '      float gu = sin(dot(p.xz, uW) * 0.09 - t * 0.9 + aK.w * 2.0);\n' +
        '      sz = 4.0 + 4.0 * aK.w; a = uF.z * 0.3 * smoothstep(-0.3, 0.6, gu); col = vec3(0.95, 0.86, 0.72); vK = 3.0;\n' +
        '      vec4 s0 = modelViewMatrix * vec4(p, 1.0), s1 = modelViewMatrix * vec4(p + vec3(uW.x, 0.0, uW.y), 1.0); vec2 e = s1.xy / max(0.1, -s1.z) - s0.xy / max(0.1, -s0.z); vD = length(e) > 1e-5 ? normalize(e) : vec2(1.0, 0.0); }\n' +
        '    vec3 r = (p - lo) / B; a *= smoothstep(0.0, 0.1, r.x) * smoothstep(1.0, 0.9, r.x) * smoothstep(0.0, 0.1, r.z) * smoothstep(1.0, 0.9, r.z);\n' +
        '    if (aK.x < 0.5) a *= smoothstep(0.0, 0.08, r.y) * smoothstep(1.0, 0.85, r.y);\n' +
        '  }\n' +
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0); float z = -mv.z; vFd = z; a *= smoothstep(4.0, 12.0, z);\n' +
        '  gl_PointSize = a > 0.003 ? clamp(sz * uS / max(1.0, z), 1.5, 128.0) : 0.0; gl_Position = projectionMatrix * mv; vC = vec4(col, a); }',
      fragmentShader: 'uniform vec3 fogColor; uniform float fogNear, fogFar; varying vec4 vC; varying float vK, vQ, vFd; varying vec2 vD;\n' +
        'void main() { vec2 d = gl_PointCoord - 0.5; float a;\n' +
        '  if (vK > 2.5) { d = vec2(d.x * vD.x - d.y * vD.y, (d.x * vD.y + d.y * vD.x) * 3.6); }\n' +   // a dust wisp: a streak along the wind (point coords run down the screen)
        '  float r = dot(d, d) * 4.0; if (r > 1.0) discard; a = (1.0 - r) * (1.0 - r); if (vK > 2.5) a *= 1.0 - r;\n' +
        '  gl_FragColor = vec4(mix(vC.rgb, fogColor, smoothstep(fogNear, fogFar, vFd)), vC.a * a); }' }));
    pts.frustumCulled = false; pts.renderOrder = 7; pts.matrixAutoUpdate = false; pts.name = 'pkAir'; root.add(pts);
    pts.onBeforeRender = (r, sc, cam) => { pU.uS.value = r.domElement.height * cam.projectionMatrix.elements[5] / 2;   // (pixels per metre at 1 m; and where the camera looks from, for the haze grid)
      const e = cam.matrixWorld.elements, h = am.hz, fl = Math.hypot(e[8], e[10]); if (fl > 1e-3) { h.dir[0] = -e[8] / fl; h.dir[1] = -e[10] / fl; } h.cam = h.cam || [0, 0]; h.cam[0] = e[12]; h.cam[1] = e[14]; };
    am.pU = pU; am.pts = pts; am.grills = grills;
    out.dyn.pkAmb = am;
  }

  function pkAmbientUpdate(am, t, car) {
    am.uT.value = t % 1000;
    const hz = am.hz, y = car ? car.roadY || 0 : 0, fr = (v) => v - Math.floor(v);
    if (car) {   // what is in the air here: motes in the forest, dust on the bare heights (no falling leaves: taken out at the player's wish)
      const mote = 0.35 * sstep(200, 175, y);
      am.pU.uF.value.set(0, mote, sstep(195, 235, y) * (1 - 0.4 * sstep(330, 400, y))); am.pU.uC.value.set(car.x, y, car.z);
    }
    hz.hU.uO.value.set(fr(t * 0.9 / 150), fr(-t * 1.2 / 150), fr(-t * 0.6 / 150), fr(t * 0.8 / 150));   // (the haze drifts slowly with the wind, its layers each their own way)
    if (!car) { if (hz.cx !== 0 || hz.cz !== 0) hz.grid(0, 0); return; }   // (no car: the grid at a fixed place, so the world's fingerprint does not depend on the last view)
    if (!hz.cam) return;
    // the haze grid: 480 m round a point 150 m ahead of the camera along the view, rebuilt when that moves a cell
    const ca = Math.round((hz.cam[0] + hz.dir[0] * 150 - hz.x0) / hz.SC) - hz.NG / 2, cb = Math.round((hz.cam[1] + hz.dir[1] * 150 - hz.z0) / hz.SC) - hz.NG / 2;
    if (ca !== hz.cx || cb !== hz.cz) hz.grid(ca, cb);
  }

  /* ---- round 5: roadside details: guardrails with reflectors and rust, stones and drains along the road (own random stream) ---- */
  function pkRoadside(K) {
    const R = rng(9561), { scen, sStart, sFin } = K, gy = pkGround, glow = K.out.pkGlow, out = K.out;
    const fr = (s, side, v) => { const q = crAt(s), o = side * ((side > 0 ? q.br : q.bl) + v); return [q.px + q.nx * o, q.pz + q.nz * o, q.i]; };   // a point v beyond the barrier line at s (interpolated)
    const free = (x, z, d) => pkNear(x, z).dd >= (d == null ? 1.5 : d) && !K.excluded(x, z);
    // (an exclusion circle that cannot move a tree: the forest draws its random stream per accepted tree, so one tree less would re-roll the whole forest;
    // only where no tree can grow: above the treeline, within 3 m of the barrier, or where the circles already there keep them off)
    const safeEx = (x, z, r) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]].map(([u, w]) => [x + u * r, z + w * r]).every(([a, b]) => gy(a, b) > pkTreeline(a, b) + 13 || pkNear(a, b).dd < 3 || K.excluded(a, b));
    const sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const lowY = (x, z, r) => Math.min(gy(x, z), gy(x + r, z), gy(x - r, z), gy(x, z + r), gy(x, z - r));
    const stoneC = [[0.52, 0.46, 0.42], [0.45, 0.43, 0.41], [0.57, 0.51, 0.46], [0.4, 0.38, 0.36], [0.6, 0.53, 0.47]];
    // a loose stone: a jittered ring on the ground (sunk a little), a smaller ring higher up, a point on top (n = 5: 45 vertices); a pebble (n = 4, no middle ring: 12)
    const stone = (x, z, r, h, col, n) => {
      const g = K.noShadow(x, z), y0 = lowY(x, z, r) - 0.05 - r * 0.15, a0 = R() * TAU, B = [], M = [];   // (no shadow: baked into the terrain tiles)
      for (let k = 0; k < n; k++) { const a = a0 + (k + (R() - 0.5) * 0.6) / n * TAU, rr = r * (0.8 + R() * 0.4); B.push([x + Math.cos(a) * rr, y0, z + Math.sin(a) * rr]); M.push([x + Math.cos(a) * rr * 0.8, y0 + h * (0.5 + R() * 0.2), z + Math.sin(a) * rr * 0.8]); }
      const top = [x + (R() - 0.5) * r * 0.4, y0 + h, z + (R() - 0.5) * r * 0.4], inn = [x, y0 + h * 0.3, z], c = vary(col, R, 0.16);
      for (let k = 0; k < n; k++) { const j = (k + 1) % n;
        if (n > 4) { g.quadO(B[k], B[j], M[j], M[k], sh(c, 0.8), inn); g.triO(M[k], M[j], top, sh(c, 1.02), inn); } else g.triO(B[k], B[j], top, sh(c, 0.9 + 0.1 * (k % 2)), inn); }
    };

    /* ---- stones and rock debris on the verge: fallen from the cuts on the high side, pushed off the road by the graders; more above the treeline ---- */
    let nSt = 0;
    for (const side of [-1, 1]) for (let s = sStart + 20; s < sFin + 30; s += 9 + R() * 10) {
      const [x0, z0, i] = fr(s, side, 0), up = gy(...fr(s, side, 8)) > T.hy[i] + 1, bare = T.hy[i] > pkTreeline(x0, z0), p = (bare ? 0.75 : 0.45) * (up ? 1.2 : 0.8);
      if (R() > p) continue;
      const v = 1.8 + R() * 2.4, [x, z] = fr(s, side, v); if (!free(x, z) || pkSlope(x, z) > 1.1) continue;
      const col = stoneC[Math.floor(R() * stoneC.length)], gc = pkGCol(x, z), c = [lerp(col[0], gc[0], 0.25), lerp(col[1], gc[1], 0.25), lerp(col[2], gc[2], 0.25)];
      const r0 = 0.3 + R() * R() * 0.55; stone(x, z, r0, r0 * (0.7 + R() * 0.5), c, 5); nSt++;   // a rock, and a smaller one or two beside it
      for (let k = Math.floor(R() * 2.6); k > 0; k--) { const a = R() * TAU, d = r0 + 0.2 + R() * 0.7, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (!free(px, pz)) continue; const r = 0.14 + R() * 0.2; stone(px, pz, r, r * (0.7 + R() * 0.6), vary(c, R, 0.1), 4 + (R() < 0.5 ? 1 : 0)); nSt++; }
    }

    // and gravel and small stones on the shoulder between the road and the barrier line (flat, off the asphalt: debris the cars pass by)
    for (const side of [-1, 1]) for (let s = sStart + 20; s < sFin + 30; s += 6 + R() * 8) {
      const q = crAt(s); if (!q) continue; const bar = side > 0 ? q.br : q.bl, room = bar - K.w - 0.9; if (room < 0.6 || R() < 0.35) continue;
      const lat = K.w + 0.7 + R() * Math.min(room, 3.5), x = q.px + q.nx * side * lat, z = q.pz + q.nz * side * lat; if (K.excluded(x, z)) continue;
      const c = stoneC[Math.floor(R() * stoneC.length)], r = 0.1 + R() * 0.14; stone(x, z, r, r * (0.5 + R() * 0.4), c, 4); nSt++; }

    /* ---- drains: where a gully comes down the high side to the road, a concrete ditch along the verge into a grated catch basin; the pipe under the road
       comes out on the low side through a concrete headwall, stones below its mouth ---- */
    const conc = [0.64, 0.63, 0.6], concD = [0.5, 0.49, 0.47], dark = [0.07, 0.07, 0.08], grate = [0.16, 0.16, 0.17], pipeC = [0.44, 0.45, 0.47];
    const drains = [];
    {
      const i0 = T.idx(sStart + 90), i1 = T.idx(sFin - 90), off = (i, side, v) => { const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + v); return gy(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) - T.hy[i]; };
      const cand = [];   // gullies: the ground up the high side dips (a local low along the road), the ground falls away on the other side
      for (const side of [-1, 1]) { const G = new Float32Array(K.N); for (let i = i0 - 10; i <= i1 + 10; i++) G[i] = off(i, side, 10);
        for (let i = i0; i <= i1; i++) { const lo = off(i, -side, 10); if (G[i] - lo < 2) continue;
          let mn = true, mx = -1e9; for (let k = -6; k <= 6; k++) { if (k && G[i + k] < G[i]) { mn = false; break; } mx = Math.max(mx, G[i + k]); }
          if (mn) cand.push({ i, side, d: mx - G[i] + (G[i] - lo) * 0.05 }); } }
      cand.sort((a, b) => b.d - a.d); for (const c of cand) if (!drains.some(d => Math.abs(d.i - c.i) < 55)) drains.push(c);
    }
    const V = (i, side, v, y, u) => { const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + v), uu = u || 0; return [T.px[i] + T.nx[i] * o + T.tx[i] * uu, y, T.pz[i] + T.nz[i] * o + T.tz[i] * uu]; };
    let nDr = 0;
    for (const d of drains) {
      const { i, side } = d, [bx, , bz] = V(i, side, 2.2, 0), [hx, , hz] = V(i, -side, 2.6, 0);
      if (!free(bx, bz) || !free(hx, hz, 1.2) || !safeEx(hx, hz, 2.6) || !safeEx(bx, bz, 1.6)) continue;
      nDr++;
      // the ditch: a shallow V of concrete slabs along the verge, 16 m up the road and 10 m down to the basin, following the ground
      for (let k = -8; k < 5; k++) { const a = i + k, b = a + 1, g = scen.get(T.px[a], T.pz[a]); if (k === 0 || k === -1) continue;
        const P = (j, v, dy) => { const p = V(j, side, v, 0); p[1] = gy(p[0], p[2]) + 0.05 + dy; return p; };
        const inn = [T.px[a], T.hy[a] - 3, T.pz[a]];
        g.quadO(P(a, 1.6, 0), P(b, 1.6, 0), P(b, 2.2, -0.12), P(a, 2.2, -0.12), concD, inn); g.quadO(P(a, 2.2, -0.12), P(b, 2.2, -0.12), P(b, 2.8, 0), P(a, 2.8, 0), conc, inn); }
      { const y = lowY(bx, bz, 0.8), g = scen.get(bx, bz);   // the catch basin: a concrete box, its grate
        box(g, bx, y - 0.3, bz, 1.3, 0.42, 1.3, T.hd[i], conc, [0.6, 0.59, 0.56], true); box(g, bx, y + 0.1, bz, 0.9, 0.03, 0.9, T.hd[i], grate, [0.13, 0.13, 0.14], true); }
      // the stones the water brought down the gully above it
      for (let k = 0; k < 5; k++) { const [x, , z] = V(i + Math.round((R() - 0.5) * 3), side, 3.4 + R() * 5, 0); if (free(x, z)) { const r = 0.15 + R() * 0.3; stone(x, z, r, r, stoneC[k % 5], 5); } }
      // the headwall on the low side: a concrete wall across the slope, the pipe's mouth in it, a wet dark fan of stones below
      { const nx = -side * T.nx[i], nz = -side * T.nz[i], tx = T.tx[i], tz = T.tz[i], pT = V(i, -side, 1.9, 0), yT = gy(pT[0], pT[2]) + 0.2;
        const [fx, , fz] = V(i, -side, 3.3, 0), yF = gy(fx, fz), yM = Math.min(yF + 0.55, yT - 0.45), g = scen.get(hx, hz);
        box(g, hx, Math.min(yF, yM - 0.6) - 0.3, hz, 2.8, yT - Math.min(yF, yM - 0.6) + 0.3, 0.35, T.hd[i], conc, [0.68, 0.67, 0.64], true);
        for (const e of [-1.5, 1.5]) box(g, hx + tx * e + nx * 0.5, Math.min(yF, yM - 0.6) - 0.3, hz + tz * e + nz * 0.5, 0.3, yT - 0.3 - Math.min(yF, yM - 0.6), 1.2, T.hd[i], concD, null, true);   // wing walls
        const c0 = [hx + nx * 0.17, yM, hz + nz * 0.17], ring = (k, r, e) => { const a = k / 8 * TAU; return [c0[0] + tx * Math.cos(a) * r + nx * e, c0[1] + Math.sin(a) * r, c0[2] + tz * Math.cos(a) * r + nz * e]; };
        for (let k = 0; k < 8; k++) { g.quadO(ring(k, 0.42, 0), ring(k + 1, 0.42, 0), ring(k + 1, 0.42, 0.28), ring(k, 0.42, 0.28), pipeC, c0);   // corrugated pipe end
          g.quadO(ring(k, 0.42, 0.28), ring(k + 1, 0.42, 0.28), ring(k + 1, 0.34, 0.28), ring(k, 0.34, 0.28), sh(pipeC, 1.15), [c0[0] + nx, c0[1], c0[2] + nz]);
          g.triO(ring(k, 0.34, 0.2), ring(k + 1, 0.34, 0.2), [c0[0] + nx * 0.2, c0[1], c0[2] + nz * 0.2], dark, [c0[0] + nx * 3, c0[1], c0[2] + nz * 3]); }
        for (let k = 0; k < 7; k++) { const a = (R() - 0.5) * 1.6, v = 0.6 + R() * 2.8, x = fx + tx * a + nx * v, z = fz + tz * a + nz * v, r = 0.18 + R() * 0.25; stone(x, z, r, r * 0.8, [0.34, 0.33, 0.31], 5); }
      }
      { K.excl.push({ x: hx, z: hz, r: 2.6 }); K.excl.push({ x: bx, z: bz, r: 1.6 }); }
    }

    /* ---- snow poles above the treeline: tall red-orange and black striped sticks, one side then the other, a reflector near the top (glows at night) ---- */
    const poleO = [0.95, 0.27, 0.07], poleK = [0.09, 0.09, 0.1];
    let nPole = 0;
    for (let s = sStart + 60, k = 0; s < sFin - 30; s += 34 + R() * 8, k++) {
      const i = T.idx(s); if (T.hy[i] < 250) continue;
      const side = k % 2 ? 1 : -1, [x, z] = fr(s, side, 0.75); if (pkNear(x, z).dd < 0.3 || K.excluded(x, z)) continue;
      const y0 = gy(x, z) - 0.15, H = 2.7, n = 7, w = 0.035, g = scen.get(x, z), tx = T.tx[i], tz = T.tz[i], nx = T.nx[i], nz = T.nz[i];
      const C = (a, b, y) => [x + tx * a + nx * b, y, z + tz * a + nz * b];
      for (let b = 0; b < n; b++) { const ya = y0 + H * b / n, yb = y0 + H * (b + 1) / n, c = b % 2 ? poleK : poleO, inn = [x, (ya + yb) / 2, z];
        for (const [p, q] of [[[-w, -w], [w, -w]], [[w, -w], [0, w * 1.3]], [[0, w * 1.3], [-w, -w]]]) g.quadO(C(p[0], p[1], ya), C(q[0], q[1], ya), C(q[0], q[1], yb), C(p[0], p[1], yb), c, inn); }
      const f = -side * (w + 0.01);
      K.out.pkRefl(C(0, f, y0 + H - 0.05), tx, tz, side * nx, side * nz, 0.07, [1, 1, 1]);
      nPole++;
    }

    /* ---- kilometre posts: every km from the start, a green plate with the km and the altitude on a steel post, facing the cars coming up ---- */
    // the text (plates here, the fans' banners in pkFans5): one canvas atlas 1024 x 1024 and one mesh, made in pkFans5; plates in the bottom quarter (256 x 128 each)
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const c2 = cv.getContext('2d'), tb = new GB(true);
    out.pk5 = { cv, c2, tb, stats: { stones: nSt, drains: nDr, poles: nPole } };
    const plate = (x, y, z, fx, fz, W, H, r, tilt) => {   // a two-sided board (bottom centre x, y, z) facing (fx, fz), leaning back by tilt; r: atlas rect [x0, y0, x1, y1] (px); the back plain
      const ca = Math.cos(tilt), sa = Math.sin(tilt), ux = fz, uz = -fx, kx = -fx * H * sa, ky = H * ca, kz = -fz * H * sa;
      for (const f of [1, -1]) { const u0 = r[0] / 1024, u1 = r[2] / 1024, v1 = 1 - r[1] / 1024, v0 = 1 - r[3] / 1024, hw = W / 2 * f, ox = fx * ca * 0.02 * f, oy = sa * 0.02 * f, oz = fz * ca * 0.02 * f;
        const A = [x + ox - ux * hw, y + oy, z + oz - uz * hw], B = [x + ox + ux * hw, y + oy, z + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        const uv = f > 0 ? [[u0, v0], [u1, v0], [u1, v1], [u0, v1]] : [[1012 / 1024, 4 / 1024], [1020 / 1024, 4 / 1024], [1020 / 1024, 12 / 1024], [1012 / 1024, 12 / 1024]];
        tb.quadO(A, B, C, D, [1, 1, 1], [x + kx / 2 - fx * ca * f, y + ky / 2 - sa * f, z + kz / 2 - fz * ca * f], uv); }
    };
    for (let km = 1; km <= 6; km++) {
      const s = sStart + km * 1000; if (s > sFin - 20) continue;
      let done = false;
      for (const side of [1, -1]) { if (done) break;
        for (const ds of [0, 6, -6, 12, -12, 18]) { const [x, z, i] = fr(s + ds, side, 1.9); if (!free(x, z) || !safeEx(x, z, 1.2)) continue;
          const y = gy(x, z), a = Math.atan2(-T.tz[i], -T.tx[i]) - side * 0.45, fx = Math.cos(a), fz = Math.sin(a), g = scen.get(x, z);   // facing the arriving cars, turned towards the road
          box(g, x - fx * 0.05, y - 0.3, z - fz * 0.05, 0.09, 1.9, 0.09, a, [0.55, 0.57, 0.6], null, true);
          const col = km - 1, r = [(col % 4) * 256, 768 + Math.floor(col / 4) * 128, (col % 4) * 256 + 256, 768 + Math.floor(col / 4) * 128 + 128];
          plate(x, y + 0.95, z, fx, fz, 1.3, 0.65, r, 0.5);
          c2.fillStyle = '#1d5a3c'; c2.fillRect(r[0], r[1], 256, 128); c2.strokeStyle = '#f2f2ea'; c2.lineWidth = 6; c2.strokeRect(r[0] + 7, r[1] + 7, 242, 114);
          c2.fillStyle = '#f2f2ea'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.font = '900 60px Arial, sans-serif'; c2.fillText('KM ' + km, r[0] + 128, r[1] + 50, 230);
          c2.font = '700 30px Arial, sans-serif'; c2.fillText(String(Math.round(T.altAt ? T.altAt(T.hy[i]) : 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' m', r[0] + 128, r[1] + 98, 230);
          K.excl.push({ x, z, r: 1.2 }); done = true; break; }
      }
    }
    c2.fillStyle = '#1d5a3c'; c2.fillRect(1008, 1008, 16, 16);   // (the plates' plain green backs)
  }

  /* ---- round 5: race-day people: varied spectators (blankets, chairs, dogs), fan banners, lit hut windows (own random stream) ---- */
  function pkFans5(K) {
    const R = rng(9571), { scen, sStart, sFin, CR } = K, gy = pkGround, out = K.out, glow = out.pkGlow, PI = Math.PI;
    const { cv, c2, tb } = out.pk5;
    const nRef = glow.P.length / 3;   // (the reflectors so far: lit by the headlights; the windows below glow on their own)
    const hard = (x, z) => { for (const e of K.excl) if (!K.crSoft.has(e) && (x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };   // buildings, pads, landmarks (not the crowds' tree-only circles)
    // (an exclusion circle that cannot move a tree: the forest draws its random stream per accepted tree, so one tree less would re-roll the whole forest;
    // only where no tree can grow: above the treeline, within 3 m of the barrier, or where the circles already there keep them off)
    const safeEx = (x, z, r) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]].map(([u, w]) => [x + u * r, z + w * r]).every(([a, b]) => gy(a, b) > pkTreeline(a, b) + 13 || pkNear(a, b).dd < 3 || K.excluded(a, b));
    const busy = (x, z, r) => { const L = CR.ppl.map.get(Math.floor(x / CR.ppl.size) + ',' + Math.floor(z / CR.ppl.size)); if (!L) return false; for (let q = 0; q < L.length; q += 9) if ((L[q] - x) ** 2 + (L[q + 2] - z) ** 2 < r * r) return true; return false; };
    const fr = (s, side, v) => { const q = crAt(s), o = side * ((side > 0 ? q.br : q.bl) + v); return [q.px + q.nx * o, q.pz + q.nz * o, q.i]; };
    const sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const pick = (a) => a[Math.floor(R() * a.length)];
    const shirt = () => K.fans[Math.floor(R() * K.fans.length)];
    // a spectator at (x, z) facing (fx, fz), sitting (on the ground, or on a seat dy up) or standing: -> [its yaw jitter applied facing (sx, sz), height scale] or null
    const pers = (x, z, fx, fz, sit, dy) => {
      if (!crowdPut(CR, x, gy(x, z) + (dy || 0), z, fx, fz, { col: shirt(), sit: sit ? 1 : 0 }, 0)) return null;
      const a = Math.atan2(fx, fz) + (crH(x, z, 8) - 0.5) * 0.5, kid = crH(x, z, 3) < 0.04;
      return [Math.sin(a), Math.cos(a), kid ? 0.7 : 0.9 + 0.2 * crH(x, z, 5), a];
    };

    /* ---- the props: blankets (laid on the ground, no shadow), camping chairs, coolers, dogs, cameras; all in the scenery chunks ---- */
    const blanketC = [[[0.72, 0.12, 0.1], [0.88, 0.84, 0.76]], [[0.15, 0.22, 0.48], [0.86, 0.82, 0.72]], [[0.8, 0.62, 0.12], [0.14, 0.2, 0.42]], [[0.62, 0.1, 0.22], [0.12, 0.12, 0.14]], [[0.85, 0.35, 0.08], [0.9, 0.88, 0.82]]];
    const blanket = (x, z, tx, tz, L, D) => {   // a 3 x 3 check laid over the ground (L along t, D across), 4 cm up
      const [ca, cb] = pick(blanketC), nx = -tz, nz = tx, P = (a, b) => { const px = x + tx * a + nx * b, pz = z + tz * a + nz * b; return [px, gy(px, pz) + 0.05, pz]; }, g = K.noShadow(x, z);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const u0 = -L / 2 + L * a / 3, u1 = u0 + L / 3, v0 = -D / 2 + D * b / 3, v1 = v0 + D / 3, c = (a + b) % 2 ? ca : cb;
        g.quadUp(P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1), [c, c, c, c]); }
    };
    const chairC = [[0.16, 0.3, 0.62], [0.7, 0.14, 0.12], [0.2, 0.22, 0.24], [0.1, 0.42, 0.48], [0.62, 0.12, 0.4]], frameC = [0.2, 0.2, 0.22];
    const chair = (x, z, fx, fz) => { // a folding camping chair facing (fx, fz): fabric seat, back and arms on a thin frame
      const y = gy(x, z), g = K.noShadow(x, z), r = Math.atan2(fz, fx), c = pick(chairC), ax = -fz, az = fx, P = (u, w) => [x + fx * u + ax * w, z + fz * u + az * w];
      box(g, x, y + 0.36, z, 0.46, 0.07, 0.5, r, c, sh(c, 1.1), true);
      { const [bx, bz] = P(-0.25, 0); box(g, bx, y + 0.4, bz, 0.06, 0.55, 0.5, r, sh(c, 0.9), null, true); }
      for (const w of [-0.27, 0.27]) { const [bx, bz] = P(0, w); box(g, bx, y - 0.05, bz, 0.46, 0.66, 0.035, r, frameC, null, true); }   // (the side frames, arms on top)
    };
    const coolerC = [[0.78, 0.12, 0.1], [0.14, 0.32, 0.7], [0.12, 0.5, 0.5], [0.9, 0.9, 0.88]];
    const cooler = (x, z, rot) => { const y = gy(x, z), g = K.noShadow(x, z), c = pick(coolerC); box(g, x, y - 0.03, z, 0.58, 0.36, 0.38, rot, c, c, true); box(g, x, y + 0.33, z, 0.6, 0.06, 0.4, rot, [0.93, 0.93, 0.9], [0.95, 0.95, 0.93], true); };
    const dogC = [[[0.1, 0.09, 0.08], [0.1, 0.09, 0.08]], [[0.55, 0.16, 0.07], [0.55, 0.16, 0.07]], [[0.1, 0.09, 0.08], [0.9, 0.89, 0.86]], [[0.9, 0.89, 0.86], [0.9, 0.89, 0.86]]];
    let nDog = 0;
    const dog = (x, z, hx, hz, sit) => {   // a dog heading (hx, hz): body, chest, head and snout, ears, four legs, the tail
      const y = gy(x, z) - 0.02, g = K.noShadow(x, z), r = Math.atan2(hz, hx), [c, cc] = pick(dogC), ax = -hz, az = hx, P = (u, w) => [x + hx * u + ax * w, z + hz * u + az * w], k = 0.85 + R() * 0.3;
      const B = (u, w, yb, sx, sy, sz, col) => { const [px, pz] = P(u * k, w * k); box(g, px, y + yb * k, pz, sx * k, sy * k, sz * k, r, col, null, true); };
      if (sit) { B(-0.1, 0, 0.12, 0.42, 0.34, 0.28, c); B(0.1, 0, 0.3, 0.2, 0.3, 0.26, cc); B(0.18, 0, 0.58, 0.26, 0.22, 0.2, c); B(0.36, 0, 0.6, 0.14, 0.1, 0.12, c); for (const w of [-0.08, 0.08]) { B(0.16, w, 0.78, 0.06, 0.1, 0.05, c); B(0.15, w, 0, 0.07, 0.3, 0.07, c); } B(-0.36, 0, 0.02, 0.24, 0.06, 0.07, c); }
      else { B(0, 0, 0.3, 0.66, 0.26, 0.26, c); B(0.27, 0, 0.26, 0.14, 0.28, 0.24, cc); B(0.4, 0, 0.5, 0.24, 0.22, 0.2, c); B(0.58, 0, 0.52, 0.14, 0.1, 0.12, c); for (const w of [-0.08, 0.08]) B(0.36, w, 0.7, 0.06, 0.1, 0.05, c);
        for (const [u, w] of [[0.24, 0.08], [0.24, -0.08], [-0.25, 0.08], [-0.25, -0.08]]) B(u, w, 0, 0.07, 0.32, 0.07, c); B(-0.4, 0, 0.5, 0.2, 0.06, 0.06, c); }
      nDog++;
    };
    let nCam = 0;
    const camera = (x, z, p, tripod) => {   // a camera held up to the face of the spectator p (or on a tripod in front of him), a long lens pointing where he looks
      const [sx, sz, sy] = p, y = gy(x, z), g = K.noShadow(x, z), r = Math.atan2(sz, sx), hy = tripod ? y + 1.42 * sy : y + 1.5 * sy, cx = x + sx * (tripod ? 0.45 : 0.2), cz = z + sz * (tripod ? 0.45 : 0.2);
      box(g, cx, hy - 0.06, cz, 0.12, 0.12, 0.16, r, [0.08, 0.08, 0.09], null, false); box(g, cx + sx * 0.14, hy - 0.04, cz + sz * 0.14, 0.18, 0.08, 0.08, r, tripod ? [0.86, 0.86, 0.82] : [0.12, 0.12, 0.13], null, false);
      if (tripod) { const yb = gy(cx, cz), top = [cx, hy - 0.08, cz], inn = [cx, yb - 1, cz]; for (let k = 0; k < 3; k++) { const a = r + k / 3 * TAU + 0.5, fx = cx + Math.cos(a) * 0.36, fz = cz + Math.sin(a) * 0.36, ex = Math.cos(a + PI / 2) * 0.025, ez = Math.sin(a + PI / 2) * 0.025;
        g.quadO([fx - ex, yb - 0.05, fz - ez], [fx + ex, yb - 0.05, fz + ez], [top[0] + ex, top[1], top[2] + ez], [top[0] - ex, top[1], top[2] - ez], [0.15, 0.15, 0.16], [cx, hy - 0.8, cz]); } }
      nCam++;
    };

    /* ---- the fans' camps: a blanket with people sitting on it, camping chairs, a cooler, now and then a dog; a photographer nearer the road; a banner behind ---- */
    const BAN = ['GO GO GO', 'PIKES 2026', 'KING OF THE HILL', 'NAPREJ!', 'DAJ GAS!', 'FULL SEND', '156 TURNS', 'HI MOM!', 'SUMMIT OR BUST', 'FLAT OUT!', 'GAS GAS GAS', 'ALLEZ!'];
    const plate = (x, y, z, fx, fz, W, H, slot, tilt) => {   // a two-sided cloth (bottom centre x, y, z) facing (fx, fz), its top leaning back by tilt; its atlas slot (512 x 128 cells, 2 per row), the back mirrored
      const r = [(slot % 2) * 512, Math.floor(slot / 2) * 128, (slot % 2) * 512 + 512, Math.floor(slot / 2) * 128 + 128];
      const ca = Math.cos(tilt), sa = Math.sin(tilt), ux = fz, uz = -fx, kx = -fx * H * sa, ky = H * ca, kz = -fz * H * sa;
      for (const f of [1, -1]) { const u0 = r[0] / 1024, u1 = r[2] / 1024, v1 = 1 - r[1] / 1024, v0 = 1 - r[3] / 1024, hw = W / 2 * f, ox = fx * ca * 0.015 * f, oy = sa * 0.015 * f, oz = fz * ca * 0.015 * f;
        const A = [x + ox - ux * hw, y + oy, z + oz - uz * hw], B = [x + ox + ux * hw, y + oy, z + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        tb.quadO(A, B, C, D, [1, 1, 1], [x + kx / 2 - fx * ca * f, y + ky / 2 - sa * f, z + kz / 2 - fz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    let nBan = 0, nCamp = 0, ban0 = Math.floor(R() * BAN.length);
    const banner = (x, z, fx, fz, W) => {   // on two poles stuck in the slope, facing (fx, fz)
      const ux = fz, uz = -fx, pa = [x - ux * W / 2, z - uz * W / 2], pb = [x + ux * W / 2, z + uz * W / 2];
      if (![pa, pb].every(([a, b]) => pkNear(a, b).dd >= 1.5 && !hard(a, b))) return false;
      const H = W / 4, ya = gy(...pa), yb = gy(...pb), y0 = Math.max(ya, yb) + 0.7, tl = 0.3, g = K.noShadow(x, z);
      for (const [[px, pz], yy] of [[pa, ya], [pb, yb]]) box(g, px, yy - 0.2, pz, 0.06, y0 - yy + H * Math.cos(tl) + 0.35, 0.06, 0, [0.35, 0.3, 0.25], null, true);
      plate(x - fx * 0.0, y0, z, fx, fz, W - 0.1, H, ban0++ % BAN.length, tl); nBan++; return true;
    };
    const camp = (s, side, v, withBan) => {
      const q = crAt(s); if (!q) return false; const tx = q.tx, tz = q.tz, fx = -side * q.nx, fz = -side * q.nz;   // (f: towards the road)
      const [x, z] = fr(s, side, v), L = (u, w) => [x + tx * u + fx * w, z + tz * u + fz * w];
      const key = [[0, 0], [-1.4, -0.9], [1.4, -0.9], [-2.4, 0], [2.6, 0.3], [0, 1.2], [0, -1.2]].map(([u, w]) => L(u, w));
      if (pkSlope(x, z) > 0.5 || !key.every(([a, b]) => pkNear(a, b).dd >= 1.5 && !hard(a, b) && !busy(a, b, 1.1))) return false;
      if (!safeEx(x, z, 3.3)) return false;
      const th = Math.atan2(tz, tx);
      blanket(x, z, tx, tz, 2.2, 1.7);
      const n = 1 + Math.floor(R() * 2);   // sitting on it, facing the road
      for (let k = 0; k < n; k++) { const [px, pz] = L(-0.6 + k * 0.6 + (R() - 0.5) * 0.2, 0.1 + 0.55); pers(px, pz, fx + tx * (R() - 0.5) * 0.4, fz + tz * (R() - 0.5) * 0.4, true); }
      { const [cx, cz] = L(1.45 * (R() < 0.5 ? 1 : -1), -0.5); cooler(cx, cz, th + (R() - 0.5) * 0.6); }
      for (const u of R() < 0.6 ? [-2.2, 2.4] : [R() < 0.5 ? -2.2 : 2.4]) {   // camping chairs, most with someone in them
        const [px, pz] = L(u, 0.25 + 0.55), p = R() < 0.8 ? pers(px, pz, fx - tx * u * 0.08, fz - tz * u * 0.08, true, 0.29) : null;
        if (p) chair(px - p[0] * 0.55, pz - p[1] * 0.55, p[0], p[1]); else { const [cx, cz] = L(u, 0.25); chair(cx, cz, fx, fz); } }
      if (R() < 0.35) { const [dx, dz] = L(0.8 + R(), 1.1), a = R() * TAU, sit = R() < 0.5; if (!hard(dx, dz)) dog(dx, dz, sit ? fx : Math.cos(a), sit ? fz : Math.sin(a), sit); }
      if (R() < 0.6) {   // the photographer, a few metres nearer the road
        for (const u of [-1, 1.5, 3]) { const w = v - 2.4, [px, pz] = L(u, w), tr = R() < 0.35; if (pkNear(px, pz).dd < 1.6 || hard(px, pz) || busy(px, pz, 0.8)) continue;
          const lk = (R() - 0.5) * 0.8, p = pers(px, pz, fx + tx * (lk + (tr ? 0 : 0.4)), fz + tz * (lk + (tr ? 0 : 0.4)), false); if (p) camera(px, pz, p, tr); break; }
      }
      if (withBan) { const [bx, bz] = L((R() - 0.5) * 2, -2.6 - R()); banner(bx, bz, fx, fz, 3.6 + R() * 1.2); }
      K.excl.push({ x, z, r: 3.3 }); nCamp++; return true;
    };
    const tryCamp = (s, side, withBan) => { for (const ds of [0, 7, -7, 14, -14]) for (const v of [7.5, 10, 13]) if (camp(s + ds, side, v, withBan)) return true; return false; };
    const upSide = (s) => { const [xa, za] = fr(s, 1, 8), [xb, zb] = fr(s, -1, 8); return gy(xa, za) > gy(xb, zb) ? 1 : -1; };
    // the hairpins (behind the rows of spectators, on the high side, and now and then on the low side too), the W's, Glen Cove, Devil's Playground, Boulder Park, the summit
    T.corners.forEach((c, k) => { if (c.sev < 3) return; const sm = (c.i0 + c.i1) / 2 * T.ds; if (sm < sStart + 80 || sm > sFin - 60) return;
      const up = upSide(sm); tryCamp(sm + (k % 2 ? 24 : -24), up, true); if (k % 4 === 0) tryCamp(sm - (k % 2 ? 28 : -28), -up, false); });
    for (const d of [2650, 3090, 3330, 4020, 4110, 5340, 6040]) { const s = sStart + d; tryCamp(s, upSide(s), d % 3 !== 0); }   // Glen Cove, the W's, Devil's Playground, Boulder Park, the summit
    for (const d of [3000, 3150, 3330, 4050, 5360]) { const s = sStart + d, sd = upSide(s); for (const ds of [0, 10, -10, 20]) { const [x, z] = fr(s + ds, sd, 15 + R() * 5), q = crAt(s + ds); if (safeEx(x, z, 2.9) && banner(x, z, -sd * q.nx, -sd * q.nz, 4.8)) { K.excl.push({ x, z, r: 2.9 }); break; } } }   // bigger banners up the slope

    /* ---- lit windows: the glass of the huts, the inn, the booth, the timing tower, the visitor center and the train (found by its colour in the scenery chunks),
       drawn again a few cm out in the glow mesh: warm light at dusk and at night, a faint warm tint by day ---- */
    const GL = [[0.16, 0.2, 0.25, 0], [0.16, 0.18, 0.2, 0], [0.17, 0.22, 0.27, 0], [0.1, 0.13, 0.16, 0], [0.2, 0.26, 0.3, 0], [0.13, 0.16, 0.2, 1], [0.17, 0.24, 0.3, 1], [0.12, 0.15, 0.2, 1]];   // [r, g, b, cool light]
    const warm = [[1, 0.84, 0.56], [1, 0.9, 0.68], [1, 0.8, 0.5], [1, 0.87, 0.62]], cool = [[0.95, 0.97, 1], [0.9, 0.94, 1]];
    let nWin = 0;
    for (const g of scen.map.values()) { const P = g.P, Nn = g.N, C = g.C, n = P.length;
      for (let t = 0; t < n; t += 9) { if (Math.abs(Nn[t + 1]) > 0.3) continue;
        let m = -1; for (let k = 0; k < GL.length; k++) { const c = GL[k]; let ok = true; for (let v = 0; v < 9 && ok; v += 3) ok = Math.abs(C[t + v] - c[0]) < 0.004 && Math.abs(C[t + v + 1] - c[1]) < 0.004 && Math.abs(C[t + v + 2] - c[2]) < 0.004; if (ok) { m = k; break; } }
        if (m < 0) continue;
        const o = 0.03, V = [0, 3, 6].map(v => [P[t + v] + Nn[t + v] * o, P[t + v + 1] + Nn[t + v + 1] * o, P[t + v + 2] + Nn[t + v + 2] * o]), pal = GL[m][3] ? cool : warm;
        const cl = V.map(p => pal[Math.floor(crH(Math.floor(p[0] / 2.4), Math.floor(p[1] / 2.2), Math.floor(p[2] / 2.4)) * pal.length)]);
        glow.tri(V[0], V[1], V[2], cl[0], cl[1], cl[2]); nWin++; } }

    /* ---- the text atlas: the fans' banners (bed sheets and painted cloth, hand-lettered) above the km plates (pkRoadside) ---- */
    const bg = ['#f4f1e8', '#f3d23a', '#c8231d', '#1d3f8f', '#141416', '#f4f1e8', '#2a7a3a', '#f08a1c', '#f4f1e8', '#c8231d', '#141416', '#1d3f8f'], ink = ['#c8231d', '#141416', '#f4f1e8', '#f3d23a', '#f3d23a', '#1d3f8f', '#f4f1e8', '#141416', '#141416', '#f3d23a', '#f08a1c', '#f4f1e8'];
    for (let k = 0; k < 12; k++) { const x0 = (k % 2) * 512, y0 = Math.floor(k / 2) * 128;
      c2.fillStyle = bg[k]; c2.fillRect(x0, y0, 512, 128);
      c2.fillStyle = 'rgba(0,0,0,0.08)'; for (let q = 0; q < 5; q++) c2.fillRect(x0 + R() * 512, y0, 6 + R() * 20, 128);   // (folds in the cloth)
      if (k % 3 === 1) { c2.strokeStyle = ink[k]; c2.lineWidth = 6; c2.strokeRect(x0 + 10, y0 + 10, 492, 108); }
      c2.save(); c2.translate(x0 + 256, y0 + 66); c2.rotate((R() - 0.5) * 0.06); c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.font = (k % 4 === 2 ? 'italic ' : '') + '900 ' + (BAN[k].length > 11 ? 58 : 80) + 'px Impact, "Arial Black", Arial, sans-serif';
      c2.lineWidth = 8; c2.strokeStyle = 'rgba(0,0,0,0.25)'; c2.strokeText(BAN[k], 3, 3, 470); c2.fillStyle = ink[k]; c2.fillText(BAN[k], 0, 0, 470); c2.restore(); }
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; out.ownTex.push(tx);
    if (!tb.empty) { const m = new THREE.Mesh(tb.geometry(), new THREE.MeshLambertMaterial({ map: tx })); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); K.root.add(m); }

    /* ---- the glow mesh (the reflectors of the guardrail block and pkRoadside, the windows above): its own light by the time of day, read from the fog colour
       (night: dark, dusk: warm), 1 draw; reflectors (aK = 1) lit full by day and brightest near the camera (the headlights) ---- */
    if (!glow.empty) {
      const gg = glow.geometry(), nv = gg.attributes.position.count, aK = new Float32Array(nv); aK.fill(1, 0, nRef); gg.setAttribute('aK', new THREE.BufferAttribute(aK, 1));
      const U = { uGlow: { value: 0.07 }, uDim: { value: 0.22 } }, gm = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
      gm.onBeforeCompile = (s) => { s.uniforms.uGlow = U.uGlow; s.uniforms.uDim = U.uDim;
        s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float aK; varying float vK; varying float vD;').replace('#include <project_vertex>', '#include <project_vertex>\nvK = aK; vD = -mvPosition.z;');
        s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlow; uniform float uDim; varying float vK; varying float vD;')
          .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= mix(uDim, 1.0, vK);')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor * uGlow * mix(1.0, 2.2 * clamp(1.7 - vD / 90.0, 0.45, 1.0), vK);'); };
      gm.customProgramCacheKey = () => 'pkGlow5';
      const m = new THREE.Mesh(gg, gm); m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'pkGlow';
      m.onBeforeRender = (r, sc) => { const f = sc.fog && sc.fog.color; if (!f) return; const l = 0.3 * f.r + 0.59 * f.g + 0.11 * f.b, night = l < 0.2, dusk = !night && f.r - f.b > 0.17;
        U.uGlow.value = night ? 1 : dusk ? 0.6 : 0.07; U.uDim.value = night ? 0.1 : dusk ? 0.18 : 0.22; };
      K.root.add(m);
    }
    out.pk5stats = Object.assign(out.pk5.stats, { dents: (glow.dents || []).length, camps: nCamp, banners: nBan, dogs: nDog, cams: nCam, winTris: nWin, glowV: glow.P.length / 3, reflV: nRef });
    delete out.pk5; delete out.pkGlow; delete out.pkRefl;
  }

  /* ---- round 6: plants that move: grass and shrubs swaying by the road, alpine flowers on the tundra, aspen groves, more fallen logs and rocks (own random stream) ---- */
  function pkVeg(K) {
    const R = rng(9601), { root, out, scen, excluded, onSide, P } = K, WD = 2.2, wx = Math.cos(WD), wz = Math.sin(WD);   // (the wind: as pkAmbient's flags)
    const n6 = P.n6 || (P.n6 = valueNoise2(9432, 34)), grove = valueNoise2(9405, 170), flw = valueNoise2(9611, 18), flc = valueNoise2(9612, 45), mead = valueNoise2(9613, 30);
    const sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    // plants: one instanced mesh of 5-blade pieces (15 vertices); a piece is a grass tuft (blades from a small ring, leaning out) or, with the shrub form (aQ), a low mound of
    // 5 leafy wedges from a raised centre. Kinds: 0 grass, 1 shrub (dwarf willow above the trees), 2 flower spikes, 3 aspen suckers (the groves' undergrowth), 4 flower cushion.
    // The season: the 'color' attribute is a green probe the render's season code recolours (it is ground: normals up), the shader reads it back (green: summer, straw:
    // autumn, near white: winter) and takes its own colours: iC summer, iA autumn (flowers: the petals). Winter: most grass under the snow, the rest and the shrubs low and
    // snow-capped, no flowers; autumn: straw, rust and gold, no flowers. Only the pieces within ~60 m of where the camera looks are drawn (one draw, refilled per 8 m)
    const pos = [], aQ = [], aB = [], aN = [], nrm = [], col = [], G = rng(9602);
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * TAU + (G() - 0.5) * 0.5, ca = Math.cos(a), sa = Math.sin(a), lk = 0.7 + G() * 0.3, r0 = 0.05, rt = 0.3 + G() * 0.12, n = [ca * 0.45, 1, sa * 0.45], nl = Math.hypot(n[0], 1, n[2]);
      const w0 = a - 0.62, w1 = a + 0.62, e0 = 0.85 + G() * 0.3, e1 = 0.85 + G() * 0.3, y0 = 0.25 + G() * 0.15, y1 = 0.25 + G() * 0.15, cy = 0.9 + G() * 0.1;
      const T3 = [[r0 * ca, 0, r0 * sa, 0, -sa, ca], [r0 * ca, 0, r0 * sa, 0, sa, -ca], [rt * ca, lk, rt * sa, lk, 0, 0]], S3 = [[ca * 0.06, cy, sa * 0.06, 1], [Math.cos(w0) * e0, y0, Math.sin(w0) * e0, y0], [Math.cos(w1) * e1, y1, Math.sin(w1) * e1, y1]];
      for (let v = 0; v < 3; v++) { const t = T3[v], q = S3[v]; pos.push(t[0], t[1], t[2]); aB.push(t[3], t[4], t[5], 0); aQ.push(q[0], q[1], q[2], q[3]); aN.push(n[0] / nl, 1 / nl, n[2] / nl); nrm.push(0, 1, 0); col.push(0.3, 0.5, 0.2); }
    }
    const base = new THREE.InstancedBufferGeometry();
    base.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); base.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); base.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    base.setAttribute('aQ', new THREE.Float32BufferAttribute(aQ, 4)); base.setAttribute('aB', new THREE.Float32BufferAttribute(aB, 4)); base.setAttribute('aN', new THREE.Float32BufferAttribute(aN, 3));
    // where they grow: along the road, 1.8-42 m beyond the barriers, not in the snow zone, not on the crags; meadows (thin forest; grass and tundra patches above the trees) denser
    const L = [], tl0 = (x, z) => pkTreeline(x, z), add = (x, y, z, rot, sp, h, w, kind, c, a) => L.push(x, y, z, rot, sp, h, w, kind + R() * 0.98, c[0], c[1], c[2], a[0], a[1], a[2]);
    const grassB = [0.3, 0.4, 0.16], grassA = [0.44, 0.45, 0.23], strawB = [0.68, 0.56, 0.3], strawA = [0.62, 0.47, 0.3], shrubB = [0.17, 0.3, 0.12], willow = [0.3, 0.38, 0.19];
    const shrubAut = [[0.64, 0.26, 0.1], [0.74, 0.5, 0.13], [0.55, 0.2, 0.12]], aspS = [0.27, 0.41, 0.14], aspA = [[0.93, 0.72, 0.13], [0.95, 0.62, 0.1], [0.88, 0.76, 0.2]];
    const petals = [[0.58, 0.32, 0.8], [0.97, 0.8, 0.14], [0.96, 0.96, 0.92], [0.92, 0.46, 0.66], [0.38, 0.52, 0.92]], flStem = [0.28, 0.4, 0.17];
    const nK = [0, 0, 0, 0, 0];
    const piece = (x, z, big) => {   // one plant at (x, z) (big: a meadow's centre), false where none may grow
      const nn = pkNear(x, z), dd = nn.dd, hn = nn.hn, vg = dd < 1.8; if (nn.i < 0 || dd > 42 || vg && nn.d < K.w + 1.7) return false;   // (vg: inside the barrier line, on the verge beyond the gravel: grass only)
      const y = vg ? Math.max(pkGround(x, z) + 0.05, hn - 0.12) : pkGround(x, z); if (y > 332 || excluded(x, z)) return false;
      const sl = vg ? 0 : pkSlope(x, z); if (sl > 0.85) return false;
      const tl = tl0(x, z), above = y > tl - 6, r2 = R(), r3 = R(), rot = R() * TAU, sink = 0.05 + sl * 0.3;
      const gv = grove(x, z), inGrove = y < 150 && y < tl - 35 && gv > 0.55;
      let kind = 0;
      if (vg) kind = 0; else if (inGrove && r2 < 0.2 + 0.5 * sstep(0.55, 0.66, gv)) kind = 3;
      else if (above && y < 322 && flw(x, z) > 0.58 && r2 < 0.75) kind = r3 < 0.55 ? 2 : 4;
      else if (r2 < (above ? 0.1 : 0.22)) kind = 1;
      nK[kind]++;
      if (kind === 0) { const hk = (above ? 0.75 : 1) * (big ? 1.15 : 1); add(x, y - 0.04, z, rot, 1.3 + R() * 0.7, (0.4 + R() * 0.4) * hk, 0.09 + R() * 0.05, 0, vary(above ? grassA : grassB, R, 0.22), vary(above ? strawA : strawB, R, 0.18)); }
      else if (kind === 1) { const s = above ? 0.4 + R() * 0.3 : 0.55 + R() * 0.5; add(x, y - sink * s * 2, z, rot, s, above ? 0.28 + R() * 0.15 : 0.45 + R() * 0.45, 0, 1, vary(above ? willow : shrubB, R, 0.2), vary(shrubAut[Math.floor(R() * 3)], R, 0.15)); }
      else if (kind === 3) { const s = 0.5 + R() * 0.45; add(x, y - sink * s * 2, z, rot, s, 1 + R() * 1.1, 0, 3, vary(aspS, R, 0.18), vary(aspA[Math.floor(R() * 3)], R, 0.1)); }
      else { const pi = R() < 0.8 ? Math.floor(flc(x, z) * 9.999) % 5 : Math.floor(R() * 5), pc = vary(petals[pi], R, 0.1);
        if (kind === 2) add(x, y - 0.03, z, rot, 0.6 + R() * 0.3, 0.26 + R() * 0.16, 0.04, 2, vary(flStem, R, 0.2), pc);
        else add(x, y - 0.03 - sl * 0.1, z, rot, 0.22 + R() * 0.16, 0.1 + R() * 0.06, 0, 4, vary(willow, R, 0.2), pc); }
      return true;
    };
    for (let s = 12; s < T.len - 12; s += 1.1) for (const side of [-1, 1]) for (let q = 0; q < 3; q++) {
      const o = 1.8 + Math.pow(R(), 1.7) * 40, jx = (R() - 0.5) * 3, jz = (R() - 0.5) * 3, r1 = R(), [x0, z0] = onSide(s, side, o), x = x0 + jx, z = z0 + jz;
      const i = T.idx(s), tl = tl0(x, z), above = T.hy[i] > tl - 6, far = sstep(42, 20, o);
      const m = above ? Math.max(sstep(0.42, 0.75, P.n4(x, z)), sstep(0.56, 0.76, n6(x * 0.6 + 40, z * 0.6)), sstep(0.55, 0.72, mead(x, z))) : Math.max(sstep(0.42, 0.28, P.n3(x * 1.3 + 100, z * 1.3)), sstep(0.6, 0.75, mead(x, z)) * 0.8);
      const p = (0.2 + 0.8 * m + 0.35 * sstep(9, 2, o)) * far * sstep(334, 316, T.hy[i]);
      if (r1 > p || !piece(x, z, m > 0.6)) continue;
      const nc = Math.floor(R() * (1.5 + 4 * m));   // (a clump round it)
      for (let k = 0; k < nc; k++) { const a = R() * TAU, d = 0.5 + R() * 1.4; piece(x + Math.cos(a) * d, z + Math.sin(a) * d, false); }
    }
    for (let s = 12; s < T.len - 12; s += 0.8) for (const side of [-1, 1]) {   // the verge strip: tufts in clumps just beyond the gravel
      const i = T.idx(s), lo = K.w + 1.8 - (side > 0 ? T.br[i] : T.bl[i]), o = lo + Math.pow(R(), 1.3) * (10 - lo), [x0, z0] = onSide(s, side, o), x = x0 + (R() - 0.5) * 1.5, z = z0 + (R() - 0.5) * 1.5, r1 = R();
      const m = Math.max(sstep(0.35, 0.7, mead(x, z)), sstep(0.42, 0.75, P.n4(x, z)));
      if (r1 > (0.45 + 0.45 * m) * sstep(334, 316, T.hy[i]) || !piece(x, z, false)) continue;
      const nc = Math.floor(R() * (1.5 + 2.5 * m));
      for (let k = 0; k < nc; k++) { const a = R() * TAU, d = 0.4 + R() * 1.1; piece(x + Math.cos(a) * d, z + Math.sin(a) * d, false); }
    }
    // stored by 16 m cells (each cell's pieces together), drawn nearest cells first up to CAP
    const NI = L.length / 14, CS = 16, cells = new Map(), key = (cx, cz) => (cx + 4096) * 8192 + cz + 4096;
    for (let k = 0; k < NI; k++) { const c = key(Math.floor(L[k * 14] / CS), Math.floor(L[k * 14 + 2] / CS)); let a = cells.get(c); if (!a) cells.set(c, a = []); a.push(k); }
    const sP = new Float32Array(NI * 4), sS = new Float32Array(NI * 4), sC = new Float32Array(NI * 3), sA = new Float32Array(NI * 3), span = new Map(); let o = 0;
    for (const [c, a] of cells) { span.set(c, [o, a.length]); for (const k of a) { const b = k * 14; sP.set(L.slice(b, b + 4), o * 4); sS.set(L.slice(b + 4, b + 8), o * 4); sC.set(L.slice(b + 8, b + 11), o * 3); sA.set(L.slice(b + 11, b + 14), o * 3); o++; } }
    const CAP = 680, RW = 60, ring = [];
    for (let b = -5; b <= 5; b++) for (let a = -5; a <= 5; a++) { const d = Math.hypot(a, b) * CS; if (d < RW + CS * 0.7) ring.push([a, b, d]); }
    ring.sort((p, q) => p[2] - q[2]);
    const mk = (n) => { const at = new THREE.InstancedBufferAttribute(new Float32Array(CAP * n), n); at.setUsage(THREE.DynamicDrawUsage); return at; };
    const iP = mk(4), iS = mk(4), iC = mk(3), iA = mk(3);
    base.setAttribute('iP', iP); base.setAttribute('iS', iS); base.setAttribute('iC', iC); base.setAttribute('iA', iA); base.instanceCount = 0; base.setDrawRange(0, 0);
    const uT0 = { value: 0 }, mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uT = (out.dyn.pkAmb && out.dyn.pkAmb.uT) || uT0;   // (pkAmbient's clock)
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aQ;\nattribute vec4 aB;\nattribute vec3 aN;\nattribute vec4 iP;\nattribute vec4 iS;\nattribute vec3 iC;\nattribute vec3 iA;\nuniform float uT;\nvarying vec3 vPkC;')
        .replace('#include <beginnormal_vertex>', [
        'float pkK = floor( iS.w ), pkSd = fract( iS.w ), pkF = step( 0.5, pkK ) * ( 1.0 - step( 1.5, pkK ) ) + step( 2.5, pkK );   // pkF: the shrub form (kinds 1, 3, 4)',
        'float pkWn = step( 0.7, min( color.r, min( color.g, color.b ) ) ), pkSu = ( 1.0 - pkWn ) * step( color.r * 1.3, color.g ), pkAu = 1.0 - pkWn - pkSu;   // the season (the probe)',
        'float pkFl = step( 1.5, pkK ) * ( 1.0 - step( 2.5, pkK ) ) + step( 3.5, pkK );   // flowers',
        'float pkH = mix( aB.x, aQ.w, pkF ), pkC = cos( iP.w ), pkS = sin( iP.w );',
        'float pkVis = 1.0 - pkFl * ( 1.0 - pkSu ) - ( 1.0 - pkF ) * pkWn * step( 0.4, pkSd );   // (no flowers but in summer; winter: most grass under the snow)',
        'float pkHy = iS.y * mix( 1.0, mix( 0.45, 0.7, pkF ), pkWn ) * pkVis;',
        'vec3 pkL = mix( vec3( position.x * iS.x + aB.y * iS.z, position.y, position.z * iS.x + aB.z * iS.z ), vec3( aQ.x * iS.x, aQ.y, aQ.z * iS.x ), pkF ) * vec3( pkVis, pkHy, pkVis );',
        'vec3 objectNormal = mix( aN, normalize( vec3( aQ.x * 0.8, 1.0, aQ.z * 0.8 ) ), pkF );',
        'objectNormal = vec3( objectNormal.x * pkC - objectNormal.z * pkS, objectNormal.y, objectNormal.x * pkS + objectNormal.z * pkC );',
        '#ifdef USE_TANGENT\nvec3 objectTangent = vec3( tangent.xyz );\n#endif',
        '{ vec3 c1 = mix( iC * ( 0.5 + 0.8 * pkH ) + vec3( 0.1, 0.08, 0.0 ) * pkH, iA, smoothstep( 0.5, 0.85, pkH ) * pkFl ), c2 = iA * ( 0.6 + 0.5 * pkH );',
        '  vec3 sn = vec3( 0.9, 0.93, 0.98 ), c3 = mix( mix( sn, iA * 0.8, smoothstep( 0.25, 1.0, pkH ) ), mix( iA * 0.4 + 0.06, sn, smoothstep( 0.55, 0.9, pkH ) ), pkF );',
        '  vPkC = c1 * pkSu + c2 * pkAu + c3 * pkWn; }'].join('\n'))
        .replace('#include <begin_vertex>', [
        'vec3 transformed = vec3( pkL.x * pkC - pkL.z * pkS, pkL.y, pkL.x * pkS + pkL.z * pkC );',
        '{ vec2 pkW = vec2( ' + wx.toFixed(4) + ', ' + wz.toFixed(4) + ' ); float ph = dot( iP.xz, pkW ) * 0.09;   // (gusts roll downwind)',
        '  float g = 0.55 + 0.35 * sin( uT * 1.2 - ph ) + 0.2 * sin( uT * 2.9 - ph * 1.7 + pkSd * 3.0 ), fl = sin( uT * 4.7 + pkSd * 40.0 ) * ( 0.25 + 0.5 * step( 2.5, pkK ) * ( 1.0 - step( 3.5, pkK ) ) );',
        '  float a = ( 0.1 + 0.2 * smoothstep( 0.0, 420.0, iP.y ) ) * pkH * pkH * pkHy * mix( 1.0, 0.45, pkF );   // (stronger higher up)',
        '  transformed.xz += pkW * a * g + vec2( -pkW.y, pkW.x ) * a * fl * 0.5; transformed.y -= a * a * 0.8; }',
        'transformed += iP.xyz;'].join('\n'));
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vPkC;').replace('#include <color_fragment>', 'diffuseColor.rgb *= vPkC;')
        .replace('( gl_FrontFacing ) ? vLightFront : vLightBack', 'vLightFront').replace('( gl_FrontFacing ) ? vIndirectFront : vIndirectBack', 'vIndirectFront');   // (both sides of a blade lit alike)
    };
    mat.customProgramCacheKey = () => 'pkVeg';
    const mesh = new THREE.Mesh(base, mat); mesh.frustumCulled = false; mesh.receiveShadow = true; mesh.name = 'pkVeg'; root.add(mesh);
    // refill when the point the camera looks at moves to another 8 m cell: the camera's ray to the ground (not far ahead of a low camera); the new pieces are drawn
    // from the next frame (their buffers go up to the GPU before it draws: count and data stay in step)
    const st = { key: null, pend: -1 };
    const fill = (fx, fz) => {
      const c0 = Math.floor(fx / CS), c1 = Math.floor(fz / CS); let n = 0;
      for (const [a, b] of ring) { const sp = span.get(key(c0 + a, c1 + b)); if (!sp) continue; const m = Math.min(sp[1], CAP - n); if (m <= 0) break;
        const s0 = sp[0]; iP.array.set(sP.subarray(s0 * 4, (s0 + m) * 4), n * 4); iS.array.set(sS.subarray(s0 * 4, (s0 + m) * 4), n * 4); iC.array.set(sC.subarray(s0 * 3, (s0 + m) * 3), n * 3); iA.array.set(sA.subarray(s0 * 3, (s0 + m) * 3), n * 3); n += m; }
      for (const at of [iP, iS, iC, iA]) { at.updateRange.offset = 0; at.updateRange.count = Math.max(1, n) * at.itemSize; at.needsUpdate = true; }
      return n;
    };
    mesh.onBeforeRender = (r, sc, cam) => {
      if (st.pend >= 0) { base.instanceCount = st.pend; base.setDrawRange(0, st.pend ? Infinity : 0); st.pend = -1; }
      const e = cam.matrixWorld.elements, cx = e[12], cy = e[13], cz = e[14], fx = -e[8], fy = -e[9], fz = -e[10], gy = pkGround(cx, cz);
      let d = Math.min(160, Math.max(0, cy - gy) / Math.max(0.02, -fy)); if (cy - gy < 6) d = Math.min(d, 30);
      const px = cx + fx * d, pz = cz + fz * d, k = Math.floor(px / 8) + ',' + Math.floor(pz / 8);
      if (k !== st.key) { st.key = k; st.pend = fill(px, pz); }
    };
    out.dyn.pkVeg = () => {   // (World.update without a car: the buffers in a fixed state, so the world's fingerprint does not depend on the last view)
      for (const at of [iP, iS, iC, iA]) at.array.fill(0); const n = fill(0, 0); base.instanceCount = n; base.setDrawRange(0, n ? Infinity : 0); st.pend = -1; st.key = null; };
    // more fallen logs and scattered rocks in the forest near the road (merged into the scenery; own stream)
    const logC = [0.46, 0.4, 0.33], moss = [0.3, 0.36, 0.17], graniteF = [[0.5, 0.47, 0.44], [0.46, 0.44, 0.42], [0.54, 0.49, 0.45]];
    let nLog = 0, nRock = 0;
    const log = (x, z, L, rb, a0) => {   // a weathered log lying across the slope (along the contour), mossy on top, a broken stub or two
      const gx = pkGround(x + 2, z) - pkGround(x - 2, z), gz = pkGround(x, z + 2) - pkGround(x, z - 2), ga = Math.hypot(gx, gz) > 0.2 ? Math.atan2(gz, gx) + Math.PI / 2 : a0, a = ga + (R() - 0.5) * 0.6;
      const ca = Math.cos(a), sa = Math.sin(a), p0 = [x - ca * L / 2, 0, z - sa * L / 2], p1 = [x + ca * L / 2, 0, z + sa * L / 2];
      if (pkNear(p0[0], p0[2]).dd < 2 || pkNear(p1[0], p1[2]).dd < 2 || excluded(p0[0], p0[2]) || excluded(p1[0], p1[2])) return false;
      p0[1] = pkGround(p0[0], p0[2]) + rb * 0.55; p1[1] = pkGround(p1[0], p1[2]) + rb * 0.5; const ym = pkGround(x, z) + rb * 0.55;
      if (Math.abs((p0[1] + p1[1]) / 2 - ym) > 0.3) return false;   // (no bridges over hollows)
      const g = scen.get(x, z), c = vary(logC, R, 0.2), mc = vary(moss, R, 0.2), cm = [lerp(c[0], mc[0], 0.6), lerp(c[1], mc[1], 0.6), lerp(c[2], mc[2], 0.6)], cb = sh(c, 0.55), end = [0.7, 0.58, 0.42], n = 5, px = -sa, pz = ca;
      const ring = (p, r) => { const o = []; for (let k = 0; k < n; k++) { const t = k / n * TAU + 0.3; o.push([p[0] + px * Math.cos(t) * r, p[1] + Math.sin(t) * r, p[2] + pz * Math.cos(t) * r]); } return o; };
      const A0 = ring(p0, rb), A1 = ring(p1, rb * 0.75), mid = [x, (p0[1] + p1[1]) / 2, z], cl = (p, q) => p[1] > q[1] + rb * 0.5 ? cm : p[1] < q[1] - rb * 0.3 ? cb : c;
      for (let k = 0; k < n; k++) { const j = (k + 1) % n; g.quadO(A0[k], A1[k], A1[j], A0[j], null, mid, null, [cl(A0[k], p0), cl(A1[k], p1), cl(A1[j], p1), cl(A0[j], p0)]); }
      for (let k = 1; k < n - 1; k++) { g.triO(A0[0], A0[k], A0[k + 1], end, mid); g.triO(A1[0], A1[k], A1[k + 1], sh(end, 0.85), mid); }
      if (R() < 0.6) { const f = 0.3 + R() * 0.4, q = [lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f) + rb * 0.4, lerp(p0[2], p1[2], f)], sd = R() < 0.5 ? -1 : 1, bl = 0.5 + R() * 0.7;   // a broken branch stub
        const t = [q[0] + px * sd * bl * 0.7 + ca * bl * 0.3, q[1] + bl * 0.6, q[2] + pz * sd * bl * 0.7 + sa * bl * 0.3], rr = rb * 0.3;
        for (let k = 0; k < 3; k++) { const e0 = k / 3 * TAU, e1 = e0 + TAU / 3; g.triO([q[0] + Math.cos(e0) * rr, q[1], q[2] + Math.sin(e0) * rr], t, [q[0] + Math.cos(e1) * rr, q[1], q[2] + Math.sin(e1) * rr], c, [q[0], q[1] - 1, q[2]], sh(c, 1.15), c); } }
      nLog++; return true;
    };
    const stone = (x, z, r) => {   // a grey granite stone, half sunk, lichen and moss on top (a 5-sided ring, a bulge, a top point: 15 faces)
      const y = pkGround(x, z) - r * 0.2 - pkSlope(x, z) * r * 0.5, g = scen.get(x, z), c = vary(graniteF[Math.floor(R() * 3)], R, 0.14), mc = vary(moss, R, 0.25), a0 = R() * TAU, B = [], M = [], sy = 0.55 + R() * 0.3;
      for (let k = 0; k < 5; k++) { const a = a0 + k / 5 * TAU, rb = r * (0.85 + R() * 0.3), rm = r * (0.75 + R() * 0.3); B.push([x + Math.cos(a) * rb, y, z + Math.sin(a) * rb]); M.push([x + Math.cos(a + 0.4) * rm, y + r * sy * (0.75 + R() * 0.3), z + Math.sin(a + 0.4) * rm]); }
      const top = [x + (R() - 0.5) * r * 0.4, y + r * sy * (1.2 + R() * 0.3), z + (R() - 0.5) * r * 0.4], inn = [x, y + r * 0.3, z], cB = sh(c, 0.72), cT = R() < 0.6 ? [lerp(c[0], mc[0], 0.55), lerp(c[1], mc[1], 0.55), lerp(c[2], mc[2], 0.55)] : sh(c, 1.1);
      for (let k = 0; k < 5; k++) { const j = (k + 1) % 5; g.quadO(B[k], B[j], M[j], M[k], null, inn, null, [cB, cB, c, c]); g.triO(M[k], M[j], top, c, inn, c, cT); }
      nRock++;
    };
    for (let s = 10; s < T.len - 10; s += 9) for (const side of [-1, 1]) {
      const i = T.idx(s), u = R(), o = 2.2 + Math.pow(R(), 1.3) * 24, [x, z] = onSide(s, side, o), a0 = R() * TAU, L = 3 + R() * 6, rb = 0.14 + R() * 0.16, nS = 1 + Math.floor(R() * 3);
      const y = pkGround(x, z), tl = pkTreeline(x, z); if (y > tl - 8 || u > 0.32 || excluded(x, z) || pkSlope(x, z) > 0.8 || pkNear(x, z).dd < 2) continue;
      if (u < 0.17) log(x, z, L, rb, a0);
      else for (let k = 0; k < nS; k++) { const a = R() * TAU, d = k ? 0.8 + R() * 2.5 : 0, sx = x + Math.cos(a) * d, sz = z + Math.sin(a) * d, r = (k ? 0.15 + R() * 0.3 : 0.3 + R() * 0.45);
        if (pkNear(sx, sz).dd >= 1.5 + r && !excluded(sx, sz)) stone(sx, sz, r); }
    }
    out.pkVegStats = { plants: NI, kinds: nK, cells: cells.size, logs: nLog, rocks: nRock };
  }

  // the side roads (pkJunctions; buildPikes breaks the Highway's white edge line across their mouths): where the real course has them, as far as the modelled mountain allows (s, side, the angle they leave at; picked by
  // trying route() along the stretch: the least climb, clear of the scenery, off the rails and the tight bends)
  const PK_JN = [
    { s: 310, sd: 1, a: 1.2, L: 46, W: 6, fl: 4, lot: 5.5, cars: 5, close: 'bar', marshal: 1, name: 'CRYSTAL CREEK', sub: 'Visitor Center · Reservoir' },
    { s: 580, sd: -1, a: 2.3, L: 46, W: 4.2, fl: 2.5, gravel: 1, close: 'gate', vol: 1, name: 'FOREST ROAD 330', sub: 'Catamount Trail', col: '#1f5a3a' },
    { s: 1078, sd: 1, a: 1.2, L: 44, W: 5.4, fl: 2.5, close: 'bar', vol: 1, name: 'HALFWAY PICNIC GROUND', sub: 'Picnic loop · Restrooms' },
    { s: 1602, sd: 1, a: 1.95, L: 46, W: 4.2, fl: 2.5, gravel: 1, close: 'gate', name: 'FOREST ROAD 334', sub: 'Limber Pine Trail', col: '#1f5a3a' },
    { s: 2078, sd: -1, a: 1.95, L: 50, W: 4.6, fl: 3, gravel: 1, close: 'gate', vol: 1, name: 'SKI AREA ROAD', sub: 'Service vehicles only', col: '#1f5a3a' },
    { s: 2232, cross: 1, a: 1.3, L: 18, W: 1.8, fl: 0.8, dirt: 1, name: 'ELK PARK TRAIL' },
    { s: 2779, sd: -1, a: Math.PI / 2, apron: 2.2, W: 5.2, fl: 2, close: 'tape', vol: 1, name: 'GLEN COVE', sub: 'Inn · Gift shop · Parking' },
    { s: 3642, sd: 1, a: 1.57, L: 40, W: 4.4, fl: 3, gravel: 1, lot: 4, cars: 3, close: 'tape', vol: 1, name: 'ELK PARK TRAILHEAD', sub: 'Barr Trail · Hikers' },
    { s: 4020, sd: -1, a: 1.57, L: 40, W: 6, fl: 4, lot: 5.5, cars: 6, close: 'bar', marshal: 1, name: "DEVIL'S PLAYGROUND", sub: 'Parking · Crags Trail' },
    { s: 6244, sd: -1, a: 1.2, L: 36, W: 6, fl: 4, lot: 5.5, cars: 5, close: 'bar', marshal: 1, name: 'SUMMIT PARKING', sub: 'Lot B · Shuttle' },
  ];
  /* ---- round 6: side roads: junctions, turn-offs and car-park entrances along the course, closed for the race (own random stream) ---- */
  function pkJunctions(K) {
    const R = rng(9621), { scen, w, N } = K, gy = pkGround, out = K.out, PI = Math.PI, ds = T.ds;
    const rail = out.pkRail || [new Uint8Array(N), new Uint8Array(N)]; delete out.pkRail;
    const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const near = (x, z) => { const n = pkNear(x, z); return { i: n.i, dd: n.i < 0 ? 999 : n.dd, lat: n.lat }; };
    const gcol = (x, z) => sh(pkGCol(x, z), pkGMean);   // the ground's own colour (as the gravel pull-outs' outer ring: no seam where they meet)
    // the surface the side roads lie on: the asphalt (flat across), the gravel strip, the verge (its cross-section per sample as buildPikes lays it, lifted onto the ground), the terrain
    const vc = new Map(), sw = 0.9;
    const vProf = (i, sd) => { const k = i * 2 + (sd > 0 ? 1 : 0); let p = vc.get(k); if (p) return p;
      const bar = sd > 0 ? T.br[i] : T.bl[i], lift = (o, h) => { const q = sd * o; return [o, Math.max(h, gy(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.05 - T.hy[i])]; };
      p = [[w, 0.02], [w + sw, -0.02], lift(Math.max(w + sw + 0.6, bar - 2.5), -0.02 - 0.2 * (1 - 2.5 / Math.max(2.6, bar - w - sw))), lift(bar, -0.22), lift(bar + 1.4, -0.62)]; vc.set(k, p); return p; };
    const vAt = (i, sd, o) => { const p = vProf(i, sd); if (o <= w) return 0.02; for (let k = 0; k + 1 < p.length; k++) if (o <= p[k + 1][0]) return lerp(p[k][1], p[k + 1][1], (o - p[k][0]) / Math.max(1e-6, p[k + 1][0] - p[k][0])); return -1e9; };
    const under = (x, z) => { const n = pkNear(x, z), i = n.i, lat = n.lat; if (i < 0) return gy(x, z);
      const sd = lat > 0 ? 1 : -1, o = Math.abs(lat), f = clamp(i + ((x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i]) / ds, 0, N - 1.001), i0 = Math.floor(f), t = f - i0;
      return Math.max(gy(x, z), lerp(T.hy[i0] + vAt(i0, sd, o), T.hy[i0 + 1] + vAt(i0 + 1, sd, o), t)); };
    const frame = (s) => { const q = crAt(clamp(s, 0.5, T.len - 0.5)); return { s, i: q.i, px: q.px, pz: q.pz, tx: q.tx, tz: q.tz, nx: q.nx, nz: q.nz, bl: q.bl, br: q.br, hy: q.hy }; };
    const latOf = (x, z, F0, sd) => { const F = frame(F0.s + (x - F0.px) * F0.tx + (z - F0.pz) * F0.tz); return ((x - F.px) * F.nx + (z - F.pz) * F.nz) * sd; };   // offset from the Highway's centre line near the mouth

    // a side road's centre line: from the Highway's edge at s on side sd, leaving at angle a from its heading; straight across the verge, then steered
    // 2 m at a time along the contour (the least climb over the next metres), clear of the road's other legs and of the scenery; ends where it runs out of room
    const route = (J) => {
      const F = frame(J.s), sd = J.sd, a = J.a, bar = sd > 0 ? F.br : F.bl, sa = Math.sin(a), tM = (bar - w) / sa + 2.5;   // (tM: just past the barrier line)
      let x = F.px + F.nx * sd * w, z = F.pz + F.nz * sd * w, hx = F.tx * Math.cos(a) + F.nx * sd * sa, hz = F.tz * Math.cos(a) + F.nz * sd * sa, t = 0, gmax = 0, gsum = 0;
      const P = [[x, z]];
      while (t < J.L - 1e-6) {
        let best = null; const cand = t < tM || J.straight ? [0] : [-0.14, -0.07, 0, 0.07, 0.14], y0 = gy(x, z), d0 = near(x, z).dd;
        for (const dl of cand) { const c = Math.cos(dl), s = Math.sin(dl), ux = hx * c - hz * s, uz = hx * s + hz * c; let k = Math.abs(dl) * 1.5 + (J.turn || 0) * dl;
          for (const la of [4, 9]) { const qx = x + ux * la, qz = z + uz * la, n = near(qx, qz); k += Math.abs(gy(qx, qz) - y0) / la * 10;
            if (t >= tM - 2) { if (n.dd < 3) k += 50; if (n.dd < d0 - 0.3 && d0 < 14) k += 6; if (K.excluded(qx, qz)) k += 50; } }
          if (!best || k < best.k) best = { k, ux, uz }; }
        if (best.k >= 40) break;
        hx = best.ux; hz = best.uz; const nx = x + hx * 2, nz = z + hz * 2, gr = Math.abs(gy(nx, nz) - y0) / 2;
        if (t >= tM) { gmax = Math.max(gmax, gr); gsum += gr; }
        x = nx; z = nz; t += 2; P.push([x, z]);
      }
      return { P, t, gmax, gavg: gsum / Math.max(1, (t - tM) / 2), tM, F, sd, bar, a };
    };

    /* ---- laying a side road: its surface (asphalt, gravel or a dirt trail; the mouth flared out to the Highway's edge, the far end fading into the ground
       or widening into a car park), draped on the verge and the ground, merged into the terrain tiles (no shadow, no draw call of its own) ---- */
    const asphC = [0.26, 0.285, 0.34], gravC = [0.44, 0.39, 0.33], dirtC = [0.4, 0.32, 0.23], W1 = [1, 1, 1];
    // (the season code snows over grey (saturation < 0.12), soil- and plant-coloured ground: the asphalt a cool slate grey (hue 0.61, saturation 0.13) stays plowed in winter;
    // the gravel roads' two wheel tracks of packed pink grit (hue < 0.04, saturation 0.14) stay dark ruts in the winter's snow)
    const trkC = [0.4, 0.32, 0.3];
    const lay = (J, r) => {
      const hm = J.W / 2, F = r.F, sd = r.sd, h0x = (r.P[1][0] - r.P[0][0]) / 2, h0z = (r.P[1][1] - r.P[0][1]) / 2, sa = Math.sin(r.a), ca = Math.abs(Math.cos(r.a));
      const nb = Math.ceil(((hm + J.fl + 0.8) * ca / sa + 1) / 2), P = [], dN = (F.nx * h0x + F.nz * h0z) * sd;   // (nb sections start inside the road: the mouth's corners slide out onto its edge)
      for (let q = nb; q > 0; q--) P.push([r.P[0][0] - h0x * 2 * q, r.P[0][1] - h0z * 2 * q]);
      P.push(...r.P);
      const n = P.length, Lf = r.tM + 1, S = [], base = J.dirt ? dirtC : J.gravel ? gravC : asphC;
      for (let k = 0; k < n; k++) {
        const a = P[Math.max(0, k - 1)], b = P[Math.min(n - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, hx = (b[0] - a[0]) / l, hz = (b[1] - a[1]) / l, mx = -hz, mz = hx, t = (k - nb) * 2;
        let hw = hm + J.fl * Math.max(0, 1 - Math.max(0, t) / Lf) ** 2; if (J.lot) hw += J.lot * sstep(r.t - 16, r.t - 11, t);
        const fade = J.lot || J.apron ? 0 : sstep(r.t - 10, r.t, t), us = J.gravel ? [-hw - 0.8, -hw, -hm, -1.06, -0.96, -0.6, -0.5, 0, 0.5, 0.6, 0.96, 1.06, hm, hw, hw + 0.8] : [-hw - 0.8, -hw, -hm, 0, hm, hw, hw + 0.8], ne = us.length - 1;
        const pts = us.map((u, j) => { let x = P[k][0] + mx * u, z = P[k][1] + mz * u; const lt = latOf(x, z, F, sd);
          if (lt < w + 0.03 && dN > 0.2) { x += h0x * (w + 0.03 - lt) / dN; z += h0z * (w + 0.03 - lt) / dN; }   // (slid out along the side road onto the Highway's edge)
          const edge = j === 0 || j === ne, y = under(x, z) + (edge ? 0.012 : 0.035 + 0.03 * sstep(0, 2, near(x, z).dd)), g = gcol(x, z), trk = J.gravel && Math.abs(Math.abs(u) - 0.78) < 0.2;
          return [x, y, z, edge ? g : mix(sh(trk ? trkC : base, 0.93 + 0.14 * crH(x, z, 31)), g, J.lot && k === n - 1 ? 0.6 : fade)]; });
        S.push({ t, hx, hz, mx, mz, hw, us, pts });
      }
      for (let k = 0; k + 1 < n; k++) { const A = S[k].pts, B = S[k + 1].pts;
        for (let j = 0; j + 1 < A.length; j++) { const a = A[j], b = A[j + 1], c = B[j + 1], d = B[j]; if (Math.hypot(a[0] - b[0], a[2] - b[2]) + Math.hypot(d[0] - c[0], d[2] - c[2]) < 0.02) continue;
          K.noShadow(a[0], a[2]).quadUp(a, b, c, d, [a[3], b[3], c[3], d[3]]); } }
      return S;
    };
    const sec = (S, t) => { let k = 0; while (k + 1 < S.length && Math.abs(S[k + 1].t - t) < Math.abs(S[k].t - t)) k++; return S[k]; };
    const at = (S, t, u, dy) => {   // a point on the side road's surface: t along it from the Highway's edge, u across (+: its left going out)
      let k = 0; while (k + 2 < S.length && S[k + 1].t < t) k++; const A = S[k], B = S[k + 1], f = clamp((t - A.t) / (B.t - A.t), 0, 1);
      const pu = (Q) => { const us = Q.us, p = Q.pts; let j = 0; while (j + 2 < us.length && us[j + 1] < u) j++; const g = clamp((u - us[j]) / Math.max(1e-6, us[j + 1] - us[j]), 0, 1); return [lerp(p[j][0], p[j + 1][0], g), lerp(p[j][1], p[j + 1][1], g), lerp(p[j][2], p[j + 1][2], g)]; };
      const a = pu(A), b = pu(B); return [lerp(a[0], b[0], f), lerp(a[1], b[1], f) + (dy || 0), lerp(a[2], b[2], f)]; };
    const paint = (S, t0, t1, u0, u1, col) => { const ts = [t0]; for (const q of S) if (q.t > t0 + 0.05 && q.t < t1 - 0.05) ts.push(q.t); ts.push(t1);   // a paint stripe, following the surface
      for (let k = 0; k + 1 < ts.length; k++) { const a = at(S, ts[k], u0, 0.016), b = at(S, ts[k], u1, 0.016), c = at(S, ts[k + 1], u1, 0.016), d = at(S, ts[k + 1], u0, 0.016); K.noShadow(a[0], a[2]).quadUp(a, b, c, d, [col, col, col, col]); } };

    /* ---- the text: one canvas atlas (1024 x 1024: 512 x 128 cells, 2 per row), one mesh ---- */
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const c2 = cv.getContext('2d'), tb = new GB(true);
    const cell = (k) => [(k % 2) * 512, Math.floor(k / 2) * 128, (k % 2) * 512 + 512, Math.floor(k / 2) * 128 + 128];
    const uvR = (r) => [(r[0] + 3) / 1024, 1 - (r[3] - 3) / 1024, (r[2] - 3) / 1024, 1 - (r[1] + 3) / 1024];   // [u0, v0, u1, v1] (inset: no bleeding from the next cell)
    const BACK = [1016, 1016, 1020, 1020];   // (the boards' plain backs: grey steel)
    const plate = (x, y, z, fx, fz, Wd, H, r, tilt, back) => {   // a board (bottom centre x, y, z) facing (fx, fz), leaning back by tilt; r: atlas rect; its back plain (or rect back)
      const ca = Math.cos(tilt), sa = Math.sin(tilt), ux = fz, uz = -fx, kx = -fx * H * sa, ky = H * ca, kz = -fz * H * sa;
      for (const f of [1, -1]) { const q = uvR(f > 0 ? r : back || BACK), hw = Wd / 2 * f, ox = fx * ca * 0.02 * f, oy = sa * 0.02 * f, oz = fz * ca * 0.02 * f;
        const A = [x + ox - ux * hw, y + oy, z + oz - uz * hw], B = [x + ox + ux * hw, y + oy, z + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        tb.quadO(A, B, C, D, W1, [x + kx / 2 - fx * ca * f, y + ky / 2 - sa * f, z + kz / 2 - fz * ca * f], [[q[0], q[1]], [q[2], q[1]], [q[2], q[3]], [q[0], q[3]]]); } };
    c2.fillStyle = '#6b6e72'; c2.fillRect(1008, 1008, 16, 16);
    const TXT = (s, x, y, px, col, max, wt) => { c2.fillStyle = col; c2.font = (wt || 800) + ' ' + px + 'px Arial, sans-serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(s, x, y, max); };
    const arrow = (x, y, dir, col) => { c2.save(); c2.translate(x, y); c2.scale(dir, 1); c2.fillStyle = col; c2.beginPath(); c2.moveTo(-30, -9); c2.lineTo(8, -9); c2.lineTo(8, -26); c2.lineTo(34, 0); c2.lineTo(8, 26); c2.lineTo(8, 9); c2.lineTo(-30, 9); c2.closePath(); c2.fill(); c2.restore(); };
    let nCell = 0;
    const GA = 416;   // (a guide cell: the name panel 0..GA, bordered all round; the arrow panel GA..512, pointing right, its border on the outer edge only: guide() lays them either way round)
    const guideCell = (a, b, col) => {   // a guide sign: brown (recreation) or green (forest roads), a white border, the name, a second line, the arrow towards the side road
      const k = nCell++, [x0, y0] = cell(k), bg = col || '#5b3a21';
      c2.fillStyle = bg; c2.fillRect(x0, y0, 512, 128); c2.strokeStyle = '#efe6d2'; c2.lineWidth = 5; c2.strokeRect(x0 + 7, y0 + 7, GA - 14, 114);
      c2.beginPath(); c2.moveTo(x0 + GA - 4, y0 + 7); c2.lineTo(x0 + 505, y0 + 7); c2.lineTo(x0 + 505, y0 + 121); c2.lineTo(x0 + GA - 4, y0 + 121); c2.stroke();
      const tx = x0 + GA / 2; TXT(a, tx, y0 + 50, a.length > 16 ? 44 : 52, '#f3ecd8', GA - 40, 900); TXT(b, tx, y0 + 97, 30, '#efe6d2', GA - 40, 700);
      arrow(x0 + GA + 46, y0 + 64, 1, '#f3ecd8'); return cell(k); };
    const CLOSED = (() => { const k = nCell++, [x0, y0] = cell(k);   // the barricades' board: ROAD CLOSED / ZAPRTO, orange and white stripes at the ends
      c2.fillStyle = '#f4f3ee'; c2.fillRect(x0, y0, 512, 128);
      for (const e of [x0, x0 + 452]) { c2.save(); c2.beginPath(); c2.rect(e, y0, 60, 128); c2.clip(); c2.fillStyle = '#ef6a12'; for (let q = -4; q < 8; q++) { c2.beginPath(); c2.moveTo(e + q * 30, y0 + 128); c2.lineTo(e + q * 30 + 40, y0); c2.lineTo(e + q * 30 + 55, y0); c2.lineTo(e + q * 30 + 15, y0 + 128); c2.fill(); } c2.restore(); } c2.strokeStyle = '#141414'; c2.lineWidth = 4; c2.strokeRect(x0 + 3, y0 + 3, 506, 122);
      TXT('ROAD CLOSED', x0 + 256, y0 + 48, 58, '#141414', 380, 900); TXT('ZAPRTO', x0 + 256, y0 + 100, 36, '#c81e14', 380, 900); return cell(k); })();
    const XING = (() => { const k = nCell++, [x0, y0] = cell(k);   // the trail crossing's warning sign: yellow, a walking hiker, TRAIL XING
      c2.fillStyle = '#f2c81c'; c2.fillRect(x0, y0, 512, 128); c2.strokeStyle = '#141414'; c2.lineWidth = 6; c2.strokeRect(x0 + 8, y0 + 8, 496, 112);
      c2.fillStyle = '#141414'; c2.beginPath(); c2.arc(x0 + 80, y0 + 32, 11, 0, TAU); c2.fill(); c2.lineWidth = 10; c2.lineCap = 'round'; c2.strokeStyle = '#141414'; c2.beginPath();
      c2.moveTo(x0 + 78, y0 + 48); c2.lineTo(x0 + 72, y0 + 80); c2.lineTo(x0 + 58, y0 + 108); c2.moveTo(x0 + 72, y0 + 80); c2.lineTo(x0 + 90, y0 + 108); c2.moveTo(x0 + 78, y0 + 52); c2.lineTo(x0 + 96, y0 + 70); c2.moveTo(x0 + 76, y0 + 52); c2.lineTo(x0 + 58, y0 + 72); c2.stroke();
      c2.lineWidth = 4; c2.beginPath(); c2.moveTo(x0 + 100, y0 + 50); c2.lineTo(x0 + 110, y0 + 110); c2.stroke();   // (the hiking pole)
      TXT('TRAIL', x0 + 300, y0 + 44, 54, '#141414', 330, 900); TXT('CROSSING', x0 + 300, y0 + 96, 50, '#141414', 330, 900); return cell(k); })();
    const STOP = (() => { const k = nCell++, [x0, y0] = cell(k);   // painted on the side roads' asphalt (the cell's ground clear: cut out by the alpha test)
      c2.clearRect(x0, y0, 512, 128); TXT('STOP', x0 + 256, y0 + 68, 118, '#ecebe6', 470, 900); return cell(k); })();
    const GATE = (() => { const k = nCell++, [x0, y0] = cell(k);   // the plate on the forest roads' gates
      c2.fillStyle = '#b8231a'; c2.fillRect(x0, y0, 512, 128); c2.strokeStyle = '#f4f3ee'; c2.lineWidth = 6; c2.strokeRect(x0 + 8, y0 + 8, 496, 112);
      TXT('ZAPRTO', x0 + 256, y0 + 50, 60, '#f4f3ee', 460, 900); TXT('ROAD CLOSED · RACE DAY', x0 + 256, y0 + 99, 30, '#f4f3ee', 460, 800); return cell(k); })();

    /* ---- the props: barricades, gates, tape, cones, marshals' cars, direction signs, parked cars (merged into the scenery chunks) ---- */
    const orange = [0.95, 0.4, 0.07], white = [0.94, 0.94, 0.92], red = [0.86, 0.12, 0.1], yel = [0.93, 0.74, 0.1], steel = [0.4, 0.41, 0.43], postB = [0.33, 0.23, 0.15];
    const carC = [[0.86, 0.86, 0.87], [0.55, 0.13, 0.11], [0.17, 0.25, 0.43], [0.29, 0.31, 0.3], [0.7, 0.62, 0.45], [0.2, 0.37, 0.31], [0.1, 0.1, 0.11]];
    const vest = [1, 0.5, 0.06], vest2 = [0.78, 0.95, 0.2];
    const free = (p) => near(p[0], p[2]).dd >= 1.5;   // nothing stands inside the barrier line
    const cone0 = (p) => { const g = scen.get(p[0], p[2]); box(g, p[0], p[1] - 0.02, p[2], 0.42, 0.05, 0.42, 0, [0.1, 0.1, 0.1], null, true); cone(g, p[0], p[1] + 0.03, p[2], 0.17, 0.66, 6, orange, white, 0); };
    const rail3 = (S, t, hw, ys, cols, th, seg) => {   // striped bars across the side road at t (u from -hw to hw), at heights ys above its centre
      const q = sec(S, t), rot = Math.atan2(q.mz, q.mx), c0 = at(S, t, 0), g = scen.get(c0[0], c0[2]), n = Math.max(2, Math.round(hw * 2 / seg)), L = hw * 2 / n, ya = at(S, t, -hw)[1], yb = at(S, t, hw)[1];
      for (const yy of ys) for (let k = 0; k < n; k++) { const f = (k + 0.5) / n, p = at(S, t, -hw + f * hw * 2); box(g, p[0], lerp(ya, yb, f) + yy, p[2], L + 0.005, th, 0.035, rot, cols[k % cols.length], null); } };
    const barricade = (S, t, hw) => { const q = sec(S, t), rot = Math.atan2(q.mz, q.mx), c0 = at(S, t, 0), g = scen.get(c0[0], c0[2]);   // Type III: legs, three striped rails, the board on top
      for (const u of [-hw + 0.3, hw - 0.3]) { const p = at(S, t, u); box(g, p[0], p[1] - 0.05, p[2], 0.08, 1.55, 0.08, rot, white); box(g, p[0], p[1] - 0.03, p[2], 0.1, 0.07, 0.9, rot, [0.2, 0.2, 0.2], null, true); }
      rail3(S, t, hw, [0.3, 0.68, 1.06], [orange, white], 0.2, 0.6);
      const ya = Math.max(at(S, t, -hw)[1], at(S, t, hw)[1]); plate(c0[0] - q.hx * 0.06, ya + 1.3, c0[2] - q.hz * 0.06, -q.hx, -q.hz, 1.9, 0.475, CLOSED, 0.12); };
    const gate = (S, t, hw) => { const q = sec(S, t), rot = Math.atan2(q.mz, q.mx), c0 = at(S, t, 0), g = scen.get(c0[0], c0[2]);   // a swing gate of yellow steel pipe between two posts, its plate
      for (const u of [-hw, hw]) { const p = at(S, t, u); box(g, p[0], p[1] - 0.2, p[2], 0.17, 1.4, 0.17, rot, steel, [0.3, 0.3, 0.32]); }
      rail3(S, t, hw - 0.1, [0.95, 0.5], [yel], 0.08, 20);
      for (const f of [-0.5, 0, 0.5]) { const p = at(S, t, f * hw); box(g, p[0], p[1] + 0.5, p[2], 0.06, 0.5, 0.06, rot, yel, null, true); }
      plate(c0[0] - q.hx * 0.06, c0[1] + 0.56, c0[2] - q.hz * 0.06, -q.hx, -q.hz, 1.2, 0.3, GATE, 0); };
    const tape = (S, t, hw) => { const q = sec(S, t), rot = Math.atan2(q.mz, q.mx), c0 = at(S, t, 0), g = scen.get(c0[0], c0[2]);   // red and white tape between two stakes
      for (const u of [-hw, hw]) { const p = at(S, t, u); box(g, p[0], p[1] - 0.1, p[2], 0.07, 1.12, 0.07, rot, white, red); }
      rail3(S, t, hw, [0.88], [red, white], 0.075, 0.45); };
    const marshalCar = (x, z, rot) => { K.carPk(x, z, rot, [0.93, 0.93, 0.92]); const y = gy(x, z), c = Math.cos(rot), s = Math.sin(rot), g = scen.get(x, z);   // white, an orange stripe, a light bar
      box(g, x, y + 0.6, z, 4.34, 0.14, 1.89, rot, orange, null, true); box(g, x - c * 0.35, y + 1.67, z - s * 0.35, 0.32, 0.13, 1.3, rot, [1, 0.62, 0.1], [1, 0.7, 0.2], true); };
    const person = (p, fx, fz, col, staff) => { if (free(p) && !K.excluded(p[0], p[2])) K.putPerson(p[0], p[2], Math.atan2(-fx, fz), col, staff); };   // facing (fx, fz)
    const post2 = (x, z, fx, fz, Wd, H, h0, rc, tilt, col, two) => {   // a board on two posts beside the road (two: a guide board, both faces: face2's side)
      const y = gy(x, z), ux = fz, uz = -fx, g = scen.get(x, z), an = Math.atan2(fz, fx);
      for (const e of [-Wd * 0.38, Wd * 0.38]) box(g, x + ux * e - fx * 0.07, y - 0.3, z + uz * e - fz * 0.07, 0.1, h0 + H * 0.9 + 0.3, 0.1, an, col || postB, null, true);
      if (two) face2(x, y + h0, z, fx, fz, Wd, H, rc, tilt, two); else plate(x, y + h0, z, fx, fz, Wd, H, rc, tilt); };
    const face2 = (x, y, z, fx, fz, Wd, H, r, tilt, sd) => {   // a guide board, the same both ways (the high cameras see many from behind): the name, the arrow towards the side road
      // (on the side road's side, the right way from either side: its panel mirrored on the back), leaning back by tilt
      const ca = Math.cos(tilt), sa = Math.sin(tilt), kx = -fx * H * sa, ky = H * ca, kz = -fz * H * sa, q = uvR(r), uA = (r[0] + GA) / 1024, aw = Wd * (512 - GA) / 512;
      for (const f of [1, -1]) { const ux = fz * f, uz = -fx * f, ox = fx * ca * 0.02 * f, oy = sa * 0.02 * f, oz = fz * ca * 0.02 * f, rt = f * sd > 0, e = Wd / 2, m = rt ? e - aw : aw - e;   // (u: the viewer's right)
        const P = (l) => [x + ox + ux * l, y + oy, z + oz + uz * l], inn = [x + kx / 2 - fx * ca * f, y + ky / 2 - sa * f, z + kz / 2 - fz * ca * f];
        const Q = (l0, l1, u0, u1) => { const A = P(l0), B = P(l1); tb.quadO(A, B, [B[0] + kx, B[1] + ky, B[2] + kz], [A[0] + kx, A[1] + ky, A[2] + kz], W1, inn, [[u0, q[1]], [u1, q[1]], [u1, q[3]], [u0, q[3]]]); };
        if (rt) { Q(-e, m, q[0], uA); Q(m, e, uA, q[2]); } else { Q(-e, m, q[2], uA); Q(m, e, q[0], uA); } } };   // (left of the name: the arrow panel mirrored, pointing left)
    const guide = (J, rc) => {   // the direction sign before the mouth, on the verge beyond the barrier, facing the cars coming up and turned a little towards the road
      for (let b = 0; b <= 30; b += 3) { const s = J.s - (J.W / 2 + J.fl + 5 + b), q = frame(s), o = J.sd * ((J.sd > 0 ? q.br : q.bl) + 2.4), x = q.px + q.nx * o, z = q.pz + q.nz * o;
        if (near(x, z).dd < 1.8 || K.excluded(x, z) || pkSlope(x, z) > 0.7) continue;
        const an = Math.atan2(-q.tz, -q.tx) - J.sd * 0.45; post2(x, z, Math.cos(an), Math.sin(an), 3.4, 0.85, 1.25, rc, 0.3, null, J.sd); K.excl.push({ x, z, r: 2.2 }); return 1; }
      return 0; };

    /* ---- the side roads (PK_JN, above) ---- */
    const JN = PK_JN.map(J => Object.assign({}, J, T.def.roadSurface === 'makadam' && !J.dirt ? { gravel: 1 } : null));   // (own copies: one() sets J.L on the aprons; the historic gravel road's side roads: gravel too)
    const Wc = [0.93, 0.93, 0.9], Yc = [0.95, 0.72, 0.12], st = { roads: 0, signs: 0, cars: 0, marshals: 0 };
    const one = (J) => {   // one side road with all its parts; returns its sections
      if (J.apron) { const F = frame(J.s); J.L = (J.sd > 0 ? F.br : F.bl) - w + J.apron; J.straight = 1; }
      const r = route(J); if (r.P.length < 3) return null; const ex0 = K.excl.length, exOld = (x, z) => { for (let k = 0; k < ex0; k++) { const e = K.excl[k]; if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; } return false; };
      const S = lay(J, r), hm = J.W / 2, sa = Math.sin(r.a), ca = Math.abs(Math.cos(r.a)); st.roads++;
      for (const q of S) if (q.t >= r.tM - 3 && q.t % 4 === 0) { const c = at(S, q.t, 0); K.excl.push({ x: c[0], z: c[2], r: q.hw + 1.2 }); }   // keep the trees, the later crowds and scenery off it
      if (!J.gravel && !J.dirt) {   // the mouth's paint: the stop line across the lane coming out, STOP, edge lines, the double yellow centre line
        const tS = (1.4 + hm * ca) / sa, tE = Math.min(r.t - 1, tS + 16);
        paint(S, tS, tS + 0.45, -hm + 0.15, -0.12, Wc);
        if (!J.apron) for (const e of [-1, 1]) { paint(S, tS, tE, e * (hm - 0.33), e * (hm - 0.2), Wc); paint(S, tS + 0.45, Math.min(tE, tS + 13), e * 0.08, e * 0.2, Yc); }
        if (!J.apron) { const t0 = tS + 1.1, t1 = tS + 3.7, u0 = -hm + 0.45, u1 = -0.4, q = uvR(STOP), A = at(S, t1, u1, 0.022), B = at(S, t1, u0, 0.022), C = at(S, t0, u0, 0.022), D = at(S, t0, u1, 0.022);
        tb.quadUp(A, B, C, D, [W1, W1, W1, W1], [[q[0], q[1]], [q[2], q[1]], [q[2], q[3]], [q[0], q[3]]]); }
      }
      // closed for the race: just past the barrier line
      let tC = r.tM - 1.5; const hwC = () => Math.min(sec(S, tC).hw, hm + 0.6);
      while (tC < r.t - 1 && [-1, 0, 1].some(e => { const p = at(S, tC, e * (hwC() + 0.4)); return near(p[0], p[2]).dd < 1.6; })) tC += 0.5;
      const q = sec(S, tC), hc = hwC();
      if (J.close === 'bar') { barricade(S, tC, hc); for (const u of [-hc + 0.5, 0, hc - 0.5]) { const p = at(S, tC - 1.3, u); if (free(p)) cone0(p); } }
      else if (J.close === 'gate') gate(S, tC, hc + 0.2);
      else tape(S, tC, hc + 0.15);
      if (J.marshal && tC + 8 < r.t) { const c = at(S, tC + 6.5, hm * 0.45); marshalCar(c[0], c[2], Math.atan2(-q.hz, -q.hx)); st.marshals++; }
      if (J.marshal || J.vol) person(at(S, tC + 0.6, hc + 0.9), -q.hx, -q.hz, J.marshal ? vest : vest2, true);
      if (J.marshal && J.vol !== 0) person(at(S, tC + 1.2, -hc - 0.8), -q.hx * 0.7 + q.mx * 0.7, -q.hz * 0.7 + q.mz * 0.7, vest2, true);
      if (J.name && !J.cross) st.signs += guide(J, guideCell(J.name, J.sub, J.col));
      if (J.cars) { let n = 0; for (let t = r.t - 10; t <= r.t - 1.5 && n < J.cars; t += 2.7) for (const sg of [1, -1]) { if (n >= J.cars || R() < 0.2) continue;   // parked across the car park, both rows
        const qq = sec(S, t), u = sg * (qq.hw - 2.6), p = at(S, t, u); if (near(p[0], p[2]).dd < 2.6 || exOld(p[0], p[2]) || pkSlope(p[0], p[2]) > 0.35) continue;
        K.carPk(p[0], p[2], Math.atan2(qq.mz, qq.mx) + (sg > 0 ? 0 : PI) + (R() - 0.5) * 0.1, vary(carC[Math.floor(R() * carC.length)], R, 0.15)); n++; st.cars++; } }
      return { S, r, tC };
    };
    for (const J of JN) {
      if (!J.cross) { one(J); continue; }
      // a hiking trail across the Highway: a dirt path each side, taped off with hikers waiting, the painted crossing, a warning sign before it
      for (const sd of [-1, 1]) { const X = Object.assign({}, J, { sd, a: sd > 0 ? J.a : PI - J.a, close: 'tape', vol: sd > 0 ? 1 : 0, cross: 0, name: null }), o = one(X);
        if (o) for (const k of [0, 1]) { const p = at(o.S, o.tC + 1.4 + k * 0.9, (k - 0.5) * 0.9); person(p, -o.r.P[1][0] + o.r.P[0][0], -o.r.P[1][1] + o.r.P[0][1], K.fans[(k * 3 + (sd > 0 ? 1 : 4)) % K.fans.length]); } }
      for (let o = -w + 0.55; o < w - 0.5; o += 1.2) { const s1 = J.s - 1.6, s2 = J.s + 1.6, ts = [s1]; for (let q = Math.ceil(s1 / ds) * ds; q < s2 - 0.05; q += ds) if (q > s1 + 0.05) ts.push(q); ts.push(s2);   // (continental bars, over the lines)
        const P = (s, oo) => { const q = crAt(s); return [q.px + q.nx * oo, q.hy + 0.042, q.pz + q.nz * oo]; };
        for (let k = 0; k + 1 < ts.length; k++) { const a = P(ts[k], o), b = P(ts[k], o + 0.6), c = P(ts[k + 1], o + 0.6), d = P(ts[k + 1], o); K.noShadow(a[0], a[2]).quadUp(a, b, c, d, [Wc, Wc, Wc, Wc]); } }
      for (let b = 0; b <= 24; b += 4) { const q = frame(J.s - 45 - b), o = (q.br + 2.2), x = q.px + q.nx * o, z = q.pz + q.nz * o; if (near(x, z).dd < 1.8 || K.excluded(x, z)) continue;
        const an = Math.atan2(-q.tz, -q.tx) - 0.45; post2(x, z, Math.cos(an), Math.sin(an), 2.2, 0.55, 1.35, XING, 0.2, steel); K.excl.push({ x, z, r: 1.6 }); st.signs++; break; }
    }

    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; out.ownTex.push(tx);
    if (!tb.empty) { const m = new THREE.Mesh(tb.geometry(), new THREE.MeshLambertMaterial({ map: tx, alphaTest: 0.5 })); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); K.root.add(m); }
    out.pkJnStats = st;
    // for the render's sun shafts (pkRays): -1 on the road and its verge (within 1 m of the barrier line), else pkForest's tree density there (0 above the tree line, in the car parks, the camps ...)
    const P = K.P;
    out.pkWood = (x, z, road) => { if (PK !== P) return 0; const n = pkNear(x, z); if (n.i >= 0 && n.dd < 1) return -1; if (road) return 0;   // (road: only that)
      if (pkTG(P.td, x, z) > 205 || K.excluded(x, z) || pkSlope(x, z) > 0.95) return 0; const y = gy(x, z), tl = pkTreeline(x, z); if (y > tl + 12) return 0;
      return (0.35 + 0.6 * sstep(0.3, 0.62, P.n3(x * 1.3 + 100, z * 1.3))) * sstep(tl + 12, tl - 22, y); };
  }

  /* ---- round 6: the summit on race day (chimney smoke, sponsor flags, the car park, team tents) and the sea of clouds in the valleys below the upper road
     (own random stream; pkSummitUpdate runs every frame when out.dyn.pkSum is set) ---- */
  function pkSummit6(K) {
    const out = K.out, root = K.root, P = K.P, G = P.G, R = rng(9611), gy = pkGround;
    const WD = 2.2, wx = Math.cos(WD), wz = Math.sin(WD), uT = { value: 0 }, sm = { uT, tod: '', wet: -1, k: 0 };   // (the wind: as pkAmbient's)

    /* ---- the sea of clouds: a soft, bright layer filling the deep valleys below the upper road (the W's and up), its top a little under the road's height
       trend there and under any road within 75 m (the cameras look steeply down: a deeper layer would only be seen far off), only where the ground falls away
       below it, never within 12 m of a barrier nor over the camps, huts and car parks; lit pink-white by the low sun from the east, drifting slowly with the wind. Precomputed on a 15 m field; drawn as a 390 m grid round where the camera looks, rebuilt
       when that moves a cell (pkSummitUpdate); one draw where there is cloud in it (pkAmbient's haze lies above and below it, thinner and warmer) ---- */
    const FS = 3, SC = FS * PKC, fnx = Math.floor((G.nx - 1) / FS) + 1, fnz = Math.floor((G.nz - 1) / FS) + 1, RC = 5;
    const minR = new Float32Array(fnx * fnz).fill(1e9), LY = new Float32Array(fnx * fnz), LA = new Float32Array(fnx * fnz);
    for (let i = 0; i < T.N; i += 3) { const cx = (T.px[i] - G.x0) / SC, cz = (T.pz[i] - G.z0) / SC, hy = T.hy[i];
      for (let b = Math.max(0, Math.ceil(cz - RC)); b <= Math.min(fnz - 1, Math.floor(cz + RC)); b++) for (let a = Math.max(0, Math.ceil(cx - RC)); a <= Math.min(fnx - 1, Math.floor(cx + RC)); a++) {
        if ((a - cx) ** 2 + (b - cz) ** 2 > RC * RC) continue; const k = b * fnx + a; if (hy < minR[k]) minR[k] = hy; } }
    let nCl = 0;
    for (let b = 0; b < fnz; b++) for (let a = 0; a < fnx; a++) {
      const k = b * fnx + a, x = G.x0 + a * SC, z = G.z0 + b * SC, ref = pkTG(P.th, x, z), td = pkTG(P.td, x, z), yl = Math.min(ref - 4, minR[k] - 3.5); LY[k] = yl;
      if (td > 470 || ref < 172) continue;
      const i = a * FS, j = b * FS; let gm = -1e9; for (const [p, q] of [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]) gm = Math.max(gm, pkGH(i + p, j + q));
      const dd = G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)];
      LA[k] = sstep(172, 215, ref) * sstep(0.5, 6, yl - gm) * sstep(12, 26, dd) * sstep(470, 390, td);
      if (LA[k] > 0 && [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5]].some(([u, w]) => K.excluded(x + u, z + w))) LA[k] = 0;   // (not over the fans' camps, the huts, the car parks)
      if (LA[k] > 0) nCl++;
    }
    const NG = 26, W1 = NG + 1, NV = W1 * W1, cp = new Float32Array(NV * 3), ca = new Float32Array(NV), ci = new Uint16Array(NG * NG * 6);
    const ctex = (() => {   // soft cloud noise (tileable, 128 px; own stream): billows
      const n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n; const cx = cv.getContext('2d'), im = cx.createImageData(n, n), acc = new Float32Array(n * n), Q0 = rng(9613); let lo = 1e9, hi = -1e9;
      for (let o = 0, Q = 4, amp = 1; o < 4; o++, Q *= 2, amp *= 0.5) { const g = new Float32Array(Q * Q); for (let k = 0; k < g.length; k++) g[k] = Q0();
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const fx = x / n * Q, fy = y / n * Q, xi = Math.floor(fx), yi = Math.floor(fy), u = sstep(0, 1, fx - xi), w = sstep(0, 1, fy - yi), x1 = (xi + 1) % Q, y1 = (yi + 1) % Q;
          acc[y * n + x] += amp * lerp(lerp(g[yi * Q + xi], g[yi * Q + x1], u), lerp(g[y1 * Q + xi], g[y1 * Q + x1], u), w); } }
      for (const v of acc) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      for (let k = 0; k < n * n; k++) { const v = Math.round((acc[k] - lo) / (hi - lo) * 255); im.data[k * 4] = im.data[k * 4 + 1] = im.data[k * 4 + 2] = v; im.data[k * 4 + 3] = 255; }
      cx.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; out.ownTex.push(t); return t; })();
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); cg.setAttribute('aA', new THREE.BufferAttribute(ca, 1)); cg.setIndex(new THREE.BufferAttribute(ci, 1));
    cg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); cg.setDrawRange(0, 0);
    const cU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTex: { value: null }, uO: { value: new THREE.Vector4() }, uL: { value: new THREE.Color(1, 0.93, 0.9) }, uS: { value: new THREE.Color(0.7, 0.72, 0.84) }, uK: { value: 1 } }]);
    cU.uTex.value = ctex;
    const cm = new THREE.Mesh(cg, new THREE.ShaderMaterial({ uniforms: cU, fog: true, transparent: true, depthWrite: false,
      vertexShader: 'attribute float aA; varying float vA, vFd; varying vec2 vP;\n' +
        'void main() { vA = aA; vP = position.xz; vec4 mv = modelViewMatrix * vec4(position, 1.0); vFd = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D uTex; uniform vec4 uO; uniform vec3 uL, uS, fogColor; uniform float uK, fogNear, fogFar; varying float vA, vFd; varying vec2 vP;\n' +
        'void main() { vec2 p = vP / 210.0 + uO.xy, q = vP / 76.0 + uO.zw, e = vec2(0.866, -0.5);\n' +   // (e: towards the sun, low in the east)
        '  float n = texture2D(uTex, p).r * 0.62 + texture2D(uTex, q).r * 0.38, ns = texture2D(uTex, p + e * 0.022).r * 0.62 + texture2D(uTex, q + e * 0.06).r * 0.38;\n' +
        '  float a = smoothstep(0.3, 0.58, n + (vA - 0.55) * 0.8) * min(1.0, vA * 2.2) * uK;\n' +   // (thick inside, torn into billows at the edges)
        '  vec3 c = mix(uS, uL, clamp(0.62 + (n - ns) * 7.0 + (n - 0.5) * 0.5, 0.0, 1.0));\n' +   // (the billows' sides towards the sun lit, the far sides in their own shade)
        '  gl_FragColor = vec4(mix(c, fogColor, smoothstep(fogNear, fogFar, vFd)), a * 0.93); }' }));
    cm.frustumCulled = false; cm.renderOrder = 4; cm.matrixAutoUpdate = false; cm.visible = false; cm.name = 'pkCloudSea'; root.add(cm);
    Object.assign(sm, { cm, cg, cU, cp, ca, ci, NG, W1, fnx, fnz, SC, LY, LA, cx: 1e9, cz: 1e9, q: 0, x0: G.x0, z0: G.z0, nCl });
    sm.grid = (ga, gb) => {   // (pkSummitUpdate: the grid's positions and alphas from the field, its cells where there is cloud)
      sm.cx = ga; sm.cz = gb; let q = 0;
      for (let b = 0; b <= NG; b++) for (let a = 0; a <= NG; a++) { const fa = clamp(ga + a, 0, fnx - 1), fb = clamp(gb + b, 0, fnz - 1), k = fb * fnx + fa, v = b * W1 + a;
        cp[v * 3] = G.x0 + (ga + a) * SC; cp[v * 3 + 1] = LY[k]; cp[v * 3 + 2] = G.z0 + (gb + b) * SC; ca[v] = fa === ga + a && fb === gb + b ? LA[k] : 0; }
      for (let b = 0; b < NG; b++) for (let a = 0; a < NG; a++) { const v = b * W1 + a;
        if (ca[v] + ca[v + 1] + ca[v + W1] + ca[v + W1 + 1] < 0.01) continue;
        ci[q] = v; ci[q + 1] = v + W1; ci[q + 2] = v + W1 + 1; ci[q + 3] = v; ci[q + 4] = v + W1 + 1; ci[q + 5] = v + 1; q += 6; }
      if (q < sm.q) ci.fill(0, q, sm.q); sm.q = q;
      cg.attributes.position.needsUpdate = true; cg.attributes.aA.needsUpdate = true; cg.index.needsUpdate = true; cg.setDrawRange(0, q);
    };

    /* ---- the summit on race day: merged into the scenery chunks already built there (no draw calls of their own; they cast their shadows with them) ---- */
    const cast = out.dyn.pkOps && out.dyn.pkOps.cast, gbs = new Map();
    const at = (x, z) => {   // the GB for the scenery chunk mesh nearest (x, z)
      let best = null, bd = 1e18; for (const e of cast ? cast.list : []) { const c = e[0].geometry.boundingSphere.center, d = (c.x - x) ** 2 + (c.z - z) ** 2; if (d < bd) { bd = d; best = e; } }
      if (!best) return new GB(); let g = gbs.get(best); if (!g) gbs.set(best, g = new GB()); return g; };
    const pE = K.padE, iE = K.iE, hh = T.hd[iE], hc = Math.cos(hh), hs = Math.sin(hh), padAt = (a, b) => [pE.x + hc * b - hs * a, pE.z + hs * b + hc * a];   // (b along the road beyond its end, a across)
    const park = K.excl.find(e => e.x === pE.x && e.z === pE.z);
    const hard = (x, z, r) => { for (const e of K.excl) { if (e === park || e.r > 30) continue; const d = Math.hypot(x - e.x, z - e.z); if (d < e.r * 0.6 + r) return true; } return false; };
    const free = (x, z, r) => { for (const [u, w] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (pkNear(x + u * r, z + w * r).dd < 1.5) return false; return !hard(x, z, r) && pkSlope(x, z) < 0.25; };
    const vcol = [[0.86, 0.1, 0.1], [0.98, 0.78, 0.08], [0.1, 0.34, 0.86], [0.95, 0.95, 0.94], [0.08, 0.08, 0.1], [0.62, 0.64, 0.68], [0.16, 0.62, 0.28], [1, 0.48, 0.06],
      [0.06, 0.58, 0.62], [0.52, 0.14, 0.62], [0.42, 0.74, 0.96], [0.62, 0.08, 0.2], [0.6, 0.84, 0.12], [0.94, 0.36, 0.56]];
    const glass = [0.13, 0.16, 0.21], tyre = [0.07, 0.07, 0.08];
    const vehicle = (x, z, rot, kind, col) => {   // a parked car (0), an SUV (1), a pickup (2), a van (3): length along rot
      const g = at(x, z), y = gy(x, z), c = Math.cos(rot), s = Math.sin(rot), L = (u, w) => [x + c * u - s * w, z + s * u + c * w];
      const B = (u, w, yb, lu, hy, lw, col2, top) => { const [px, pz] = L(u, w); box(g, px, y + yb, pz, lu, hy, lw, rot, col2, top, true); };
      const wh = kind ? 0.74 : 0.66, ax = [[1.35, 1.5, 1.6, 1.8][kind], [1.35, 1.4, 1.75, 1.75][kind]], half = [0.8, 0.84, 0.86, 0.88][kind];
      if (kind === 0) { B(0, 0, 0.25, 4.3, 0.8, 1.85, col); B(-0.35, 0, 1.05, 2.3, 0.62, 1.62, glass, col); }
      else if (kind === 1) { B(0, 0, 0.32, 4.6, 0.95, 1.95, col); B(-0.3, 0, 1.27, 3.0, 0.72, 1.8, glass, col); B(-0.3, 0, 2.0, 2.4, 0.08, 1.5, [0.12, 0.12, 0.13]); }
      else if (kind === 2) { B(0, 0, 0.35, 5.2, 0.8, 1.95, col); B(0.75, 0, 1.15, 1.9, 0.75, 1.85, glass, col); for (const w of [-0.93, 0.93]) B(-1.35, w, 1.15, 2.5, 0.35, 0.1, col); B(-2.55, 0, 1.15, 0.1, 0.35, 1.95, col); }
      else { B(0, 0, 0.35, 5.2, 2.0, 2.0, col, [0.92, 0.92, 0.92]); B(2.57, 0, 1.3, 0.08, 0.8, 1.8, glass); }
      for (const u of [ax[0], -ax[1]]) for (const w of [half, -half]) { const [px, pz] = L(u, w); box(g, px, y, pz, wh, wh, 0.26, rot, tyre, null, true); } };
    const flags = [];   // the cloth for pkAmbient's summit flags mesh: [x, y (top at the pole), z, rot, rows, W, H]
    let nVeh = 0, nTent = 0, nFlag = 0;

    // more cars in the car park, of every kind and colour: a third row beyond the other two, and the ends of those rows
    { const spots = [];
      for (let k = 0; k < 6; k++) spots.push([-16 + k * 6.4, 10.5]);
      for (const b of [-12, -1]) for (const a of [-20.5, 18.5]) spots.push([a, b]);
      for (const [a, b] of spots) { const [x, z] = padAt(a + (R() - 0.5) * 0.5, b), kind = [0, 1, 2, 3, 1, 0][Math.floor(R() * 6)], col = vcol[Math.floor(R() * vcol.length)];
        if (!free(x, z, 2.6)) continue; vehicle(x, z, hh + Math.PI / 2 + (R() - 0.5) * 0.12, kind, vary(col, R, 0.12)); nVeh++; } }

    // the paddock: pop-up team tents in their colours beyond the barriers of the last straight, open towards the road (where the cameras look as the car stops),
    // the rest at the far end of the car park; a van of the team's colour beside some, tyres and tool chests, the team's flag
    const occ = [], clear = (x, z, r) => free(x, z, r) && occ.every(([a, b, q]) => Math.hypot(x - a, z - b) > q + r);
    { const teams = [[[0.86, 0.1, 0.12], [0.96, 0.96, 0.96]], [[0.08, 0.2, 0.62], [0.98, 0.8, 0.1]], [[0.1, 0.1, 0.12], [1, 0.46, 0.05]], [[0.06, 0.55, 0.3], [0.95, 0.95, 0.95]], [[0.5, 0.12, 0.6], [0.42, 0.78, 0.96]]];
      const leg = [0.3, 0.3, 0.32], spots = [];
      for (let s = K.sFin + 50; s < K.sFin + 104 && spots.length < teams.length; s += 1.5) for (const side of [1, -1]) for (const v of [4.2, 5.5, 7]) {
        const [x, z, i] = K.onSide(s, side, v), ro = Math.atan2(-T.nz[i] * side, -T.nx[i] * side);
        if (spots.length < teams.length && clear(x, z, 2.4)) { spots.push([x, z, ro]); occ.push([x, z, 3.6]); break; } }
      for (let k = spots.length, a = -18; k < teams.length; k++, a += 9) { const [x, z] = padAt(a, 21); if (clear(x, z, 2.4)) { spots.push([x, z, hh + Math.PI]); occ.push([x, z, 2.4]); } }
      spots.forEach(([x, z, ro], k) => { const [c1, c2] = teams[k];
        const g = at(x, z), y = gy(x, z) - 0.05, c = Math.cos(ro), s = Math.sin(ro), L = (u, w) => [x + c * u - s * w, z + s * u + c * w], H = 2.15, S = 1.55;
        for (const [u, w] of [[S, S], [S, -S], [-S, S], [-S, -S]]) { const [px, pz] = L(u, w); box(g, px, y, pz, 0.07, H, 0.07, ro, leg, null, true); }
        { const [px, pz] = L(0, 0); box(g, px, y + H - 0.28, pz, 2 * S + 0.06, 0.3, 2 * S + 0.06, ro, c1, c1, false); }   // the valance round the top
        const ap = [x, y + H + 0.7, z], cr = [[S, S], [S, -S], [-S, -S], [-S, S]].map(([u, w]) => { const [px, pz] = L(u * 1.02, w * 1.02); return [px, y + H + 0.02, pz]; }), inn = [x, y + H - 1, z];
        for (let q = 0; q < 4; q++) g.triO(cr[q], cr[(q + 1) % 4], ap, q % 2 ? c2 : c1, inn);   // the peaked roof in the team's two colours
        { const [px, pz] = L(-S + 0.03, 0); box(g, px, y, pz, 0.06, H - 0.3, 2 * S, ro, c1, null, true); }   // the back wall
        { const [px, pz] = L(-0.7, -0.4); box(g, px, y, pz, 0.6, 0.78, 1.7, ro, [0.92, 0.92, 0.9], null, true); }   // a table
        { const [px, pz] = L(-1.05, 1.0); box(g, px, y, pz, 0.55, 0.95, 0.75, ro, [0.8, 0.1, 0.08], [0.25, 0.25, 0.27], true); }   // the tool chest
        for (const w of [0.5, 1.15]) { const [px, pz] = L(0.9, w); cyl(g, px, y, pz, 0.32, 0.26 * 3, 6, tyre, [0.16, 0.16, 0.17]); }   // stacked tyres
        for (const w of [4.6, -4.6]) { const [vx, vz] = L(-0.3, w); if (k % 2 === 0 && clear(vx, vz, 2.7)) { vehicle(vx, vz, ro + Math.PI / 2, 3, c1); occ.push([vx, vz, 2.7]); nVeh++; break; } }   // the team's van
        nTent++;
        const [fx, fz] = L(1.9, -S - 0.3); cyl(g, fx, y, fz, 0.05, 6.2, 5, [0.85, 0.85, 0.88]); flags.push([fx, y + 6.1, fz, WD + (R() - 0.5) * 0.3, [[c1, c1, c2], [c1, c2, c1]], 1.8, 1.05]); nFlag++;   // the team's flag at the tent's corner
      }); }

    // the sponsors' flags on tall poles behind the barriers of the last straight, both sides, and along the car park's edge by the road's end (fictional brands: their colours)
    { const pats = [[[[0.98, 0.82, 0.1]], [[0.1, 0.1, 0.12]]], [[[0.1, 0.34, 0.86], [0.95, 0.95, 0.95], [0.1, 0.34, 0.86]]], [[[0.86, 0.1, 0.1]], [[0.95, 0.95, 0.95]], [[0.86, 0.1, 0.1]]],
        [[[1, 0.48, 0.06], [1, 0.48, 0.06], [0.1, 0.1, 0.12]]], [[[0.16, 0.62, 0.28], [0.95, 0.95, 0.95]], [[0.95, 0.95, 0.95], [0.16, 0.62, 0.28]]], [[[0.52, 0.14, 0.62]], [[0.42, 0.74, 0.96]]]];
      const pole = (x, z, k) => { const y = gy(x, z) - 0.1, hgt = 7.6 + R() * 0.8; occ.push([x, z, 0.6]);
        cyl(at(x, z), x, y, z, 0.06, hgt, 5, [0.88, 0.88, 0.9], [0.95, 0.8, 0.3]); flags.push([x, y + hgt - 0.15, z, WD + (R() - 0.5) * 0.25, pats[k % pats.length], 2.6, 1.5]); nFlag++; };
      let k = 0;
      for (let s = K.sFin + 30; s < K.sFin + 104; s += 9) { const side = k % 2 ? 1 : -1; for (let v = 2; v < 5; v += 0.5) { const [x, z] = K.onSide(s, side, v); if (clear(x, z, 0.6)) { pole(x, z, k++); break; } } }
      for (let q = 0; q < 7; q++) { const a = -21 + q * 7 + (R() - 0.5); let b = -22; while (b < -15.5 && !clear(...padAt(a, b), 0.8)) b += 0.5; const [x, z] = padAt(a, b); if (clear(x, z, 0.8)) pole(x, z, k++); } }

    // the chimney: a steel flue on the visitor center's roof (at its far end, away from the road); its smoke rises and drifts with the wind
    const smk = (() => { const pd = K.padH, ih = pd.i, tx = T.tx[ih], tz = T.tz[ih], nx = T.nx[ih], nz = T.nz[ih], x = pd.x + tx * 12.5 + nx * -5.2, z = pd.z + tz * 12.5 + nz * -5.2, y0 = pd.h + 0.15 + 4.6 + 0.5, g = at(x, z);
      box(g, x, y0, z, 1.2, 0.35, 1.2, T.hd[ih], [0.36, 0.36, 0.37], null, true); cyl(g, x, y0 + 0.3, z, 0.26, 2.5, 7, [0.66, 0.67, 0.7]); cyl(g, x, y0 + 2.8, z, 0.42, 0.18, 7, [0.3, 0.3, 0.32], [0.14, 0.14, 0.15]);
      return [x, y0 + 3.0, z]; })();

    // the scenery chunks with the new parts merged in (their shadows: pkOpsCast, by the same list)
    for (const [e, g] of gbs) { if (g.empty) continue;
      const m = e[0], og = m.geometry, add = g.geometry(), ng = new THREE.BufferGeometry();
      for (const a of ['position', 'normal', 'color']) { const A = og.attributes[a], Bq = add.attributes[a]; if (A.itemSize !== Bq.itemSize) continue; const arr = new Float32Array(A.array.length + Bq.array.length); arr.set(A.array); arr.set(Bq.array, A.array.length); ng.setAttribute(a, new THREE.BufferAttribute(arr, A.itemSize)); }
      ng.computeBoundingSphere(); m.geometry = ng; e[1] = ng.boundingSphere; og.dispose(); add.dispose(); }

    // the flags' cloth: into pkAmbient's summit flags mesh (the same vertex shader waves them; no draw call of its own)
    if (flags.length) {
      const fl = root.children.filter(o => o.name === 'pkFlags' && o.isMesh).sort((p, q) => q.geometry.boundingSphere.center.y - p.geometry.boundingSphere.center.y)[0];
      if (fl) { const og = fl.geometry, c = { P: Array.from(og.attributes.position.array), N: Array.from(og.attributes.normal.array), C: Array.from(og.attributes.color.array), F: Array.from(og.attributes.aFl.array), I: Array.from(og.index.array) };
        for (const [x, y, z, rot, rows, W, H] of flags) {   // (as pkAmbient)
          const cs = Math.cos(rot), sn = Math.sin(rot), nc = Math.max(...rows.map(r => r.length)), sub = Math.ceil(4 / nc), ph = (x * 0.37 + z * 0.23) % TAU + (y % 7), amp = W * (0.055 + 0.05 * sstep(0, 440, y));
          rows.forEach((row, r) => { for (let q = 0; q < nc; q++) { const col = row[q % row.length], v = c.P.length / 3;
            for (let m = 0; m <= sub; m++) { const u = (q + m / sub) / nc;
              for (const f of [r / rows.length, (r + 1) / rows.length]) { c.P.push(x + cs * W * u, y - H * f - u * u * 0.06 * H, z + sn * W * u); c.N.push(-sn, 0, cs); c.C.push(col[0], col[1], col[2]); c.F.push(u, ph, amp); } }
            for (let m = 0; m < sub; m++) { const a = v + m * 2; c.I.push(a, a + 2, a + 3, a, a + 3, a + 1); } } });
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(c.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(c.N, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(c.C, 3)); g.setAttribute('aFl', new THREE.Float32BufferAttribute(c.F, 3)); g.setIndex(c.I); g.computeBoundingSphere(); g.boundingSphere.radius += 1;
        fl.geometry = g; og.dispose(); }
    }

    // the smoke: soft puffs from the flue (one Points; culled)
    const NS = 18, sp = new Float32Array(NS * 3), sk = new Float32Array(NS * 2);
    for (let k = 0; k < NS; k++) { sp[k * 3] = smk[0] + (R() - 0.5) * 0.2; sp[k * 3 + 1] = smk[1]; sp[k * 3 + 2] = smk[2] + (R() - 0.5) * 0.2; sk[k * 2] = (k + R() * 0.5) / NS; sk[k * 2 + 1] = R(); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aK', new THREE.BufferAttribute(sk, 2));
    sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(smk[0] + wx * 8, smk[1] + 5, smk[2] + wz * 8), 16);
    const sU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uW: { value: new THREE.Vector2(wx, wz) }, uS: { value: 400 }, uC: { value: new THREE.Color(0.9, 0.88, 0.88) }, uA: { value: 0.62 } }]);
    sU.uT = uT;
    const pts = new THREE.Points(sg, new THREE.ShaderMaterial({ uniforms: sU, fog: true, transparent: true, depthWrite: false,
      vertexShader: 'uniform vec2 uW; uniform float uT, uS, uA; uniform vec3 uC; attribute vec2 aK; varying vec4 vC; varying float vFd;\n' +
        'void main() { float life = 9.0 + 3.0 * aK.y, u = fract(uT / life + aK.x), age = u * life, ph = aK.y * 6.2832;\n' +
        '  vec3 p = position + vec3(0.0, 7.0 * (1.0 - (1.0 - u) * (1.0 - u)), 0.0); p.xz += uW * age * (0.25 + 0.9 * u) + vec2(sin(age * 0.7 + ph), cos(age * 0.6 + ph)) * 0.7 * u;\n' +
        '  float sz = 0.5 + 3.4 * sqrt(u), a = smoothstep(0.0, 0.08, u) * pow(1.0 - u, 1.5) * uA;\n' +
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0); vFd = -mv.z; gl_PointSize = clamp(sz * uS / max(1.0, vFd), 1.5, 160.0); gl_Position = projectionMatrix * mv; vC = vec4(uC * (0.9 + 0.12 * u), a); }',
      fragmentShader: 'uniform vec3 fogColor; uniform float fogNear, fogFar; varying vec4 vC; varying float vFd;\n' +
        'void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; gl_FragColor = vec4(mix(vC.rgb, fogColor, smoothstep(fogNear, fogFar, vFd)), vC.a * (1.0 - r) * (1.0 - r)); }' }));
    pts.renderOrder = 7; pts.matrixAutoUpdate = false; pts.name = 'pkSmoke'; root.add(pts);
    pts.onBeforeRender = (r, sc, cam) => { sU.uS.value = r.domElement.height * cam.projectionMatrix.elements[5] / 2; };
    Object.assign(sm, { sU, pts });
    out.pkSum6 = { veh: nVeh, tents: nTent, flags: nFlag, cloudCells: nCl };   // (for the tests and the screenshot tools)
    out.dyn.pkSum = sm;
  }
  function pkSummitUpdate(sm, t, car) {
    sm.uT.value = t % 1000;
    const fr = (v) => v - Math.floor(v), Rn = typeof Render !== 'undefined' ? Render : null, A = Rn && Rn.atmos, key = A ? A.tod + A.season : 'daysummer', wet = Rn && Rn.raining ? 1 : 0;
    if (key !== sm.tod || wet !== sm.wet) {   // the light of the time of day: the sea of clouds pink-white at dawn, thinner and orange at dusk, none at night or in a storm; the smoke with it
      sm.tod = key; sm.wet = wet; const tod = A ? A.tod : 'day', win = A && A.season === 'winter', U = sm.cU;
      sm.k = wet || tod === 'night' ? 0 : tod === 'dusk' ? 0.6 : 1; U.uK.value = sm.k;
      if (tod === 'dusk') { U.uL.value.setRGB(1, 0.76, 0.62); U.uS.value.setRGB(0.5, 0.49, 0.64); sm.sU.uC.value.setRGB(0.82, 0.72, 0.68); sm.sU.uA.value = 0.5; }
      else if (tod === 'night') { sm.sU.uC.value.setRGB(0.24, 0.26, 0.32); sm.sU.uA.value = 0.35; }
      else { U.uL.value.setRGB(1, win ? 0.97 : 0.93, win ? 0.98 : 0.9); U.uS.value.setRGB(0.7, win ? 0.75 : 0.72, win ? 0.88 : 0.84); sm.sU.uC.value.setRGB(0.9, 0.88, 0.88); sm.sU.uA.value = 0.62; }
    }
    const cm = sm.cm; if (sm.k <= 0) { cm.visible = false; return; }
    sm.cU.uO.value.set(fr(-t * 1.3 * 0.59 / 210), fr(t * 1.3 * 0.81 / 210), fr(-t * 1.9 * 0.59 / 76 + t * 0.4 / 76), fr(t * 1.9 * 0.81 / 76));   // (drifting with the wind, the billows slowly changing shape)
    if (!car) { if (sm.cx !== 0 || sm.cz !== 0) sm.grid(0, 0); cm.visible = sm.q > 0; return; }   // (no car: the grid at a fixed place, so the world's fingerprint does not depend on the last view)
    const cam = Rn && Rn.camera; if (!cam || !cam.isCamera) return;
    // the grid: 390 m round the point where the camera's view meets the road's height, rebuilt when that moves a cell
    const e = cam.matrixWorld.elements, dy = -e[9], tt = clamp((e[13] - (car.roadY || 0)) / Math.max(0.15, -dy), 0, 200), NG = sm.NG;
    const ga = Math.round((e[12] - e[8] * tt - sm.x0) / sm.SC) - NG / 2, gb = Math.round((e[14] - e[10] * tt - sm.z0) / sm.SC) - NG / 2;
    if (ga !== sm.cx || gb !== sm.cz) sm.grid(ga, gb);
    cm.visible = sm.q > 0;
  }

  /* ---- round 7: the spectators react to the car. The shared crowd shader (every track: arms up and a hop within ~50 m of uCar, ~28% calm by a phase
     hash) extended for Pikes Peak only, by its own material (program key 'crowdPk'): the reaction reaches ~62 m (3D, so the leg above in the W's
     does not cheer for the car below), four ways of cheering (both arms up and jumping, one arm waving wide, a fist pumping, clapping over the head),
     the photographers (the filming pose) keep their cameras up, and everyone within ~75 m turns to follow the car (all from uCar in the vertex
     shader: no per-instance JS). Camera flashes: one Points mesh with every photographer's camera, each flashing in its own rhythm while the car
     is within ~60 m (uTime, uCar: the crowd's own uniforms, nothing per frame). out.dyn.pkCheer: the crowd groups (x, y, z, weight) for the
     cheer's sound (Sfx atmoSpots), heavier at the hairpins, the W's and the summit ---- */
  function pkCrowd7(K) {
    const grp = K.root.getObjectByName('crowds'), U = K.CR.U; if (!grp) return;
    const ims = grp.children.filter(o => o.isInstancedMesh && o.name === 'crowd'); if (!ims.length) return;
    const old = ims[0].material, m = crowdMat(U), ob = m.onBeforeCompile;
    m.onBeforeCompile = (sh) => { ob(sh);
      sh.vertexShader = sh.vertexShader
        .replace('smoothstep(14.0, 52.0, length(crW.xz - uCar.xz))', 'smoothstep(18.0, 62.0, length(crW - uCar))')
        .replace('mat3 crM = mat3(1.0);', [
          'float crHop = crEx * max(0.0, sin(uTime * 8.0 + crPh)) * 0.16;',
          'float crCam = abs(crPose - 3.0) < 0.5 ? 1.0 : crPose < 0.5 && fract(crV * 0.618034 + 0.13) < 0.3 ? crEx : 0.0;',   // the photographers (filming, and some who stood): the camera up at the eyes
          'if (crCam > 0.0) { rL = mix(rL, -0.3, crCam); rR = mix(rR, -0.3, crCam); fL = mix(fL, 1.45, crCam); fR = mix(fR, 1.45, crCam); crHop *= 1.0 - crCam; }',
          'else if (crEx > 0.001 && (crPose < 4.5 || crSit > 0.5)) { float k = fract(crPh * 5.31 + crV * 0.013), tt = uTime * (0.9 + 0.2 * fract(crPh * 7.1)) + crPh;',
          '  if (k < 0.34) crHop = crEx * max(0.0, sin(tt * 7.0)) * 0.3;',   // both arms up, jumping
          '  else if (k < 0.58) { rR = mix(rR, 1.95 + 0.85 * sin(tt * 5.0), crEx); fR = mix(fR, -0.1, crEx); rL = mix(rL, 0.35, crEx); fL = mix(fL, 0.25, crEx); }',   // one arm waving wide
          '  else if (k < 0.78) { float p = max(0.0, sin(tt * 9.0)); rR = mix(rR, 2.3 + 0.55 * p, crEx); fR = mix(fR, 0.2, crEx); rL = mix(rL, 0.3, crEx); fL = mix(fL, 0.5, crEx); crHop = crEx * p * 0.08; }',   // a fist pumping
          '  else { float c = abs(sin(tt * 6.5)); rL = mix(rL, 2.68 - 0.3 * c, crEx); rR = mix(rR, 2.68 - 0.3 * c, crEx); fL = mix(fL, 0.05, crEx); fR = mix(fR, 0.05, crEx); } }',   // clapping over the head
          'mat3 crM = mat3(1.0);'].join('\n'))
        .replace('if (crBone < 4.5) objectNormal = crM * objectNormal;', [
          'if (crBone < 4.5) objectNormal = crM * objectNormal;',
          'vec3 crDv = uCar - crW, crIa = instanceMatrix[0].xyz, crIc = instanceMatrix[2].xyz;',   // the car in the figure's own frame (x its right, z its facing)
          'float crLx = dot(crIa, crDv) / dot(crIa, crIa), crLz = dot(crIc, crDv) / dot(crIc, crIc), crLd = max(0.01, length(vec2(crLx, crLz)));',
          'float crYa = clamp(atan(crLx, crLz), -1.3, 1.3) * (1.0 - smoothstep(30.0, 75.0, length(crDv))) * smoothstep(-0.6, 0.2, crLz / crLd);',   // (fades out towards behind: no flip)
          'float crYc = cos(crYa), crYs = sin(crYa); mat3 crY = mat3(crYc, 0.0, -crYs, 0.0, 1.0, 0.0, crYs, 0.0, crYc);',
          'objectNormal = crY * objectNormal;'].join('\n'))
        .replace('else transformed.y += crEx * max(0.0, sin(uTime * 8.0 + crPh)) * 0.16;', 'else transformed.y += crHop;\ntransformed = crY * transformed;');
    };
    m.customProgramCacheKey = () => 'crowdPk';
    for (const o of grp.children) if (o.material === old) o.material = m;
    old.dispose();
    // the photographers' cameras (head height, per instance: a flash phase and period from a position hash) and the crowd groups for the sound
    const P = [], F = [], S = [], hp = T.corners.filter(c => c.sev >= 3).map(c => { const i = T.idx((c.i0 + c.i1) / 2 * T.ds); return [T.px[i], T.pz[i]]; }).flat();
    const wS = [], sm = [];   // road samples along the W's (d 2918-3411) and the last 160 m below the summit
    for (let s = T.startS + 2918; s <= T.startS + 3411; s += 16) { const i = T.idx(s); wS.push(T.px[i], T.pz[i]); }
    for (let s = T.finishS - 160; s <= T.len - 2; s += 16) { const i = T.idx(s); sm.push(T.px[i], T.pz[i]); }
    const fr = (u) => u - Math.floor(u), nearL = (L, x, z, r) => { for (let k = 0; k < L.length; k += 2) if ((L[k] - x) ** 2 + (L[k + 1] - z) ** 2 < r * r) return true; return false; };
    for (const im of ims) {
      const M = im.instanceMatrix.array, A = im.geometry.getAttribute('aCrowd').array, ox = im.position.x, oz = im.position.z; let sy = 0;
      for (let q = 0; q < im.count; q++) { const o = q * 16; sy += M[o + 13];
        const a0 = A[q * 2], v = A[q * 2 + 1], pose = Math.floor(a0), x = M[o + 12] + ox, z = M[o + 14] + oz, h = Math.hypot(M[o + 4], M[o + 5], M[o + 6]);
        if (pose !== 3) { if (pose || fr(v * 0.618034 + 0.13) >= 0.3) continue;   // (as the shader: the filming pose, or 30% of those who stood (by the variant)
          if (fr((a0 - pose) * 6.2832 * 2.713 + v * 0.0171) < 0.28 && !nearL(hp, x, z, 33)) continue; }   // who cheer: not the calm ones, but at the hairpins all do: pkOpsUpdate)
        P.push(x, M[o + 13] + 1.5 * h, z); F.push(crH(x, z, 21), 1.2 + 2.2 * crH(x, z, 22)); }
      const x = ox, z = oz, n = im.count, heat = nearL(sm, x, z, 45) ? 1.5 : nearL(hp, x, z, 50) ? 1.4 : nearL(wS, x, z, 40) ? 1.3 : 1;
      S.push(x, sy / n, z, Math.min(1.6, (0.25 + 0.75 * Math.min(1, n / 45)) * heat));
    }
    K.out.dyn.pkCheer = { spots: Float32Array.from(S) };
    if (!P.length) return;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 2));
    const fU = { uTime: U.uTime, uCar: U.uCar, uH: { value: 400 } };
    const fm = new THREE.ShaderMaterial({ uniforms: fU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: ['attribute vec2 aF; uniform float uTime, uH; uniform vec3 uCar; varying float vB;',
        'void main() { vec3 p = position, d = uCar - p; float dl = length(d), f = fract(uTime / aF.y + aF.x) * aF.y;',
        '  float b = (1.0 - smoothstep(40.0, 62.0, dl)) * step(5.0, dl) * max(0.0, 1.0 - f / 0.085);',   // one flash per period, 85 ms
        '  p.xz += d.xz / max(0.1, length(d.xz)) * 0.36; vB = b; vec4 mv = modelViewMatrix * vec4(p, 1.0);',   // (the camera held towards the car)
        '  gl_Position = b > 0.0 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);',
        '  gl_PointSize = b > 0.0 ? clamp(4.0 * (0.55 + 0.45 * b) * uH * projectionMatrix[1][1] / max(1.0, -mv.z), 9.0 * b, 90.0) : 0.0; }'].join('\n'),
      fragmentShader: ['varying float vB;',
        'void main() { vec2 q = gl_PointCoord * 2.0 - 1.0; float r = length(q);',
        '  float a = smoothstep(0.4, 0.0, r) + 0.45 * exp(-r * r * 6.0) + 0.55 * (max(0.0, 1.0 - abs(q.x) * 10.0) + max(0.0, 1.0 - abs(q.y) * 10.0)) * max(0.0, 1.0 - r);',   // core, glow, a four-point star
        '  a *= vB * (1.0 - smoothstep(0.75, 1.0, r)); if (a < 0.004) discard; gl_FragColor = vec4(1.0, 0.97, 0.92, min(1.0, a)); }'].join('\n') });
    const pts = new THREE.Points(g, fm), v2 = new THREE.Vector2(); pts.name = 'pkFlash'; pts.frustumCulled = false; pts.renderOrder = 5;
    pts.onBeforeRender = (r) => { fU.uH.value = r.getDrawingBufferSize(v2).y * 0.5; };
    K.root.add(pts);
  }

  /* ---- round 9: the modern race on the asphalt (not on the gravel variant): safety foam blocks and catch fences, TV camera towers and cranes,
     the modern paddock at the start (team trucks, EV chargers, inflatable arches, a big screen), rescue vehicles and the helipad (own random stream) ---- */
  function pkModern(K) {
    const R = rng(9907), { scen, CR, sStart, sFin } = K, gy = pkGround, PI = Math.PI, W1 = [1, 1, 1], out = K.out, tg = new Chunks(250, true);
    const info = out.pkMod = { foam: 0, fence: 0, tv: [], jib: [], ph: [], trucks: 0, ev: 0, heli: null, resc: [], screen: null, arch: null };   // (where things went: the tests and the screenshot tools)
    const hard = (x, z) => { for (const e of K.excl) if (!K.crSoft.has(e) && (x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };   // buildings, pads, landmarks (not the crowds' tree-only circles)
    const busy = (x, z, r) => { const S = CR.ppl.size; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = CR.ppl.map.get((Math.floor(x / S) + a) + ',' + (Math.floor(z / S) + b)); if (L) for (let q = 0; q < L.length; q += 9) if ((L[q] - x) ** 2 + (L[q + 2] - z) ** 2 < r * r) return true; } return false; };
    const ex = (x, z, r) => K.excl.push({ x, z, r });
    const nrm = (a, b) => { const l = Math.hypot(a, b) || 1; return [a / l, b / l]; }, sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const DARK = [0.13, 0.13, 0.15], STEEL = [0.66, 0.67, 0.7], WHT = [0.95, 0.95, 0.94], RED = [0.84, 0.1, 0.08], TYRE = [0.08, 0.08, 0.09], GLASS = [0.16, 0.2, 0.26], LIME = [0.8, 0.96, 0.18], ORG = [1, 0.46, 0.08];
    const beam = (g, a, b, r, col) => {   // square rod from a to b
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
      let px = -dz, pz = dx, pl = Math.hypot(px, pz); if (pl < 1e-4) { px = 1; pz = 0; pl = 1; } px *= r / pl; pz *= r / pl;
      const ex2 = dy * pz / L, ey = (dz * px - dx * pz) / L, ez = -dy * px / L, cs = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      const rg = (p) => cs.map(([u, v]) => [p[0] + px * u + ex2 * v, p[1] + ey * v, p[2] + pz * u + ez * v]), P0 = rg(a), P1 = rg(b), inn = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      for (let k = 0; k < 4; k++) g.quadO(P0[k], P0[(k + 1) % 4], P1[(k + 1) % 4], P1[k], col, inn);
    };

    /* ---- the atlas (1024 x 1024; the rows above 256 px glow at night: the screens): the big screen's live picture 512 x 256, the chargers' screens, the
       timing ticker, the inflatable arch's print 1024 x 128, four team liveries 512 x 128, the helipad's H, the catch fence's mesh (transparent), the TV
       channel's board, the charging canopy's fascia; fictional brands only ---- */
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const cx = cv.getContext('2d');
    const txt = (s, x, y, px, col, mw, it) => { cx.fillStyle = col; cx.font = (it ? 'italic ' : '') + '900 ' + px + 'px Arial, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(s, x, y, mw); };
    const rect = (x, y, w2, h, col) => { cx.fillStyle = col; cx.fillRect(x, y, w2, h); };
    const poly = (pts, col) => { cx.fillStyle = col; cx.beginPath(); pts.forEach(([a, b], k) => k ? cx.lineTo(a, b) : cx.moveTo(a, b)); cx.fill(); };
    const AT = { scr: [0, 0, 512, 256], ev: [512, 0, 256, 128], led: [512, 128, 512, 128], arch: [0, 256, 1024, 128],
      liv: [[0, 384, 512, 128], [512, 384, 512, 128], [0, 512, 512, 128], [512, 512, 512, 128]], hpad: [0, 640, 256, 256], mesh: [256, 640, 256, 256], tv: [512, 640, 512, 64], amb: [512, 704, 512, 64], zone: [0, 896, 1024, 128] };
    const uv = (c, ins) => { const e = ins == null ? 2 : ins; return [(c[0] + e) / 1024, 1 - (c[1] + c[3] - e) / 1024, (c[0] + c[2] - e) / 1024, 1 - (c[1] + e) / 1024]; };   // atlas cell -> [u0, v0, u1, v1]
    { // the big screen: the live picture (the car on the road under the summit), the LIVE bug, a timing bar
      const [x0, y0] = AT.scr, gr = cx.createLinearGradient(0, y0, 0, y0 + 256); gr.addColorStop(0, '#3a7fd0'); gr.addColorStop(0.55, '#a9d2f2'); cx.fillStyle = gr; cx.fillRect(x0, y0, 512, 256);
      poly([[x0, y0 + 170], [x0 + 140, y0 + 70], [x0 + 230, y0 + 120], [x0 + 330, y0 + 40], [x0 + 512, y0 + 150], [x0 + 512, y0 + 256], [x0, y0 + 256]], '#8f7d76');
      poly([[x0 + 300, y0 + 58], [x0 + 330, y0 + 40], [x0 + 365, y0 + 62], [x0 + 340, y0 + 70]], '#f4f6f8');
      poly([[x0, y0 + 205], [x0 + 512, y0 + 160], [x0 + 512, y0 + 256], [x0, y0 + 256]], '#6d8a4a');
      poly([[x0 + 120, y0 + 256], [x0 + 300, y0 + 168], [x0 + 350, y0 + 168], [x0 + 330, y0 + 256]], '#4a4c52');
      rect(x0 + 238, y0 + 188, 40, 20, '#e8e8ea'); rect(x0 + 242, y0 + 180, 30, 12, '#1d3f8f'); rect(x0 + 236, y0 + 206, 10, 6, '#111'); rect(x0 + 270, y0 + 206, 10, 6, '#111');
      rect(x0 + 14, y0 + 14, 74, 30, '#d8261e'); txt('LIVE', x0 + 51, y0 + 30, 22, '#fff', 66);
      rect(x0, y0 + 222, 512, 34, 'rgba(10,12,16,0.85)'); txt('#21  ROCKY TYRES EV   3:42.18   -1.27', x0 + 256, y0 + 240, 22, '#ffd23a', 490);
      // the chargers' screens: a green plug, the charge
      { const [a, b] = AT.ev; rect(a, b, 256, 128, '#062218'); txt('EV', a + 70, b + 64, 64, '#39e07a', 110); rect(a + 140, b + 30, 96, 68, '#39e07a'); rect(a + 146, b + 36, 50, 56, '#0b4a2a'); txt('84%', a + 190, b + 66, 30, '#062218', 80); }
      { const [a, b] = AT.led; rect(a, b, 512, 128, '#050607'); txt('LIVE TIMING', a + 256, b + 40, 40, '#ffb61e', 480); txt('SPLIT 2   2:06.94', a + 256, b + 92, 40, '#39e07a', 480); }
    }
    { const [a, b] = AT.arch; rect(a, b, 1024, 128, '#e8231c'); rect(a, b + 8, 1024, 6, '#fff'); rect(a, b + 114, 1024, 6, '#fff'); txt('CLOUDLINE ENERGY', a + 512, b + 66, 92, '#fff', 980, 1); }
    const LIV = [['#0e1a2b', '#38e0c8', 'VOLTWERK RACING', '#fff'], ['#f2f2ee', '#d8261e', 'NORDIC GRAVITY', '#141416'], ['#121316', '#e02a1f', 'REAL ROADS ATLAS', '#fff'], ['#f2c230', '#13306b', 'HIGHLINE MOTORSPORT', '#13306b']];
    LIV.forEach(([bg, ac, nm, ink], k) => { const [a, b] = AT.liv[k]; rect(a, b, 512, 128, bg); poly([[a, b + 128], [a + 150, b], [a + 210, b], [a + 60, b + 128]], ac); poly([[a + 452, b + 128], [a + 512, b + 40], [a + 512, b + 128]], ac); txt(nm, a + 300, b + 64, 50, ink, 380, 1); });
    { const [a, b] = AT.hpad; rect(a, b, 256, 256, '#3c3f44'); cx.strokeStyle = '#f2c230'; cx.lineWidth = 8; cx.strokeRect(a + 8, b + 8, 240, 240);
      cx.strokeStyle = '#f4f4f2'; cx.lineWidth = 12; cx.beginPath(); cx.arc(a + 128, b + 128, 92, 0, TAU); cx.stroke(); rect(a + 86, b + 74, 20, 108, '#f4f4f2'); rect(a + 150, b + 74, 20, 108, '#f4f4f2'); rect(a + 106, b + 118, 44, 20, '#f4f4f2'); }
    { const [a, b] = AT.mesh; cx.clearRect(a, b, 256, 256); cx.save(); cx.beginPath(); cx.rect(a, b, 256, 256); cx.clip(); cx.strokeStyle = 'rgba(214,218,222,0.95)'; cx.lineWidth = 2.2;   // the chain-link mesh (the rest of the cell stays transparent)
      for (let k = -256; k <= 256; k += 16) { cx.beginPath(); cx.moveTo(a + k, b); cx.lineTo(a + k + 256, b + 256); cx.stroke(); cx.beginPath(); cx.moveTo(a + k + 256, b); cx.lineTo(a + k, b + 256); cx.stroke(); }
      rect(a, b, 256, 7, 'rgba(70,74,78,1)'); rect(a, b + 249, 256, 7, 'rgba(70,74,78,1)'); rect(a, b + 84, 256, 3, 'rgba(150,154,158,1)'); rect(a, b + 168, 256, 3, 'rgba(150,154,158,1)'); cx.restore(); }   // (tension wires)
    { const [a, b] = AT.tv; rect(a, b, 512, 64, '#13306b'); rect(a, b, 120, 64, '#f2c230'); txt('S·TV', a + 60, b + 33, 36, '#13306b', 110); txt('SUMMIT TV  LIVE', a + 316, b + 33, 38, '#fff', 370); }
    { const [a, b] = AT.amb; rect(a, b, 512, 64, '#f4f4f2'); rect(a, b + 4, 512, 6, '#d8261e'); rect(a, b + 54, 512, 6, '#d8261e'); txt('RACE RESCUE', a + 256, b + 33, 40, '#d8261e', 480); }
    { const [a, b] = AT.zone; rect(a, b, 1024, 128, '#0e1a2b'); rect(a, b + 112, 1024, 16, '#38e0c8'); txt('CHARGE ZONE  ·  ELECTRIC CLASS', a + 560, b + 60, 66, '#fff', 860); poly([[a + 70, b + 14], [a + 30, b + 70], [a + 62, b + 70], [a + 46, b + 114], [a + 100, b + 50], [a + 68, b + 50], [a + 90, b + 14]], '#38e0c8'); }
    // a textured quad A B C D (bottom left, bottom right, top right, top left as read from its front) with the atlas cell c; the back (if col) a plain quad in the scenery
    const tq = (A, B, C, D, c, back, ins) => { const u = uv(c, ins), nx = (B[1] - A[1]) * (D[2] - A[2]) - (B[2] - A[2]) * (D[1] - A[1]), ny = (B[2] - A[2]) * (D[0] - A[0]) - (B[0] - A[0]) * (D[2] - A[2]), nz = (B[0] - A[0]) * (D[1] - A[1]) - (B[1] - A[1]) * (D[0] - A[0]), l = Math.hypot(nx, ny, nz) || 1;
      const m = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2, (A[2] + C[2]) / 2];
      tg.get(A[0], A[2]).quadO(A, B, C, D, W1, [m[0] - nx / l, m[1] - ny / l, m[2] - nz / l], [[u[0], u[1]], [u[2], u[1]], [u[2], u[3]], [u[0], u[3]]]);
      if (back) { const o = 0.03, s2 = (p) => [p[0] - nx / l * o, p[1] - ny / l * o, p[2] - nz / l * o]; scen.get(A[0], A[2]).quadO(s2(A), s2(B), s2(C), s2(D), back, [m[0] + nx / l, m[1] + ny / l, m[2] + nz / l]); } };
    // an upright board: bottom centre (bx, by, bz), facing (fx, fz), W x H
    const board = (bx, by, bz, fx, fz, W, H, c, back) => { const ux = fz, uz = -fx, hw = W / 2;
      tq([bx - ux * hw, by, bz - uz * hw], [bx + ux * hw, by, bz + uz * hw], [bx + ux * hw, by + H, bz + uz * hw], [bx - ux * hw, by + H, bz - uz * hw], c, back); };

    // footprint L along (ux, uz) x W across centred at (x, z): beyond the barrier (dd >= 1.5), clear of buildings and people, not steep, near the road's height (y0) -> [lowest, highest ground] or null
    const fit = (x, z, ux, uz, L, W, dh, y0, dn, up) => { let lo = 1e9, hi = -1e9;
      for (let a = -1; a <= 1; a += 0.5) for (let b = -1; b <= 1; b += 0.5) { const px = x + ux * a * L / 2 - uz * b * W / 2, pz = z + uz * a * L / 2 + ux * b * W / 2;
        if (pkNear(px, pz).dd < 1.5 || hard(px, pz) || busy(px, pz, 0.9)) return null; const h = gy(px, pz); lo = Math.min(lo, h); hi = Math.max(hi, h); }
      return hi - lo < dh && lo > y0 - (dn || 3) && hi < y0 + (up || 4) ? [lo, hi] : null; };
    // the footprint nearest the road within s0 +- span, on the sides (the first preferred) and the distances es beyond the barrier (+1.5 m and half its width)
    const spot = (s0, sides, es, L, W, span, dh) => { let b = null, bs = 1e9;
      for (let d = 0; d <= span; d += 2) for (const sg of d ? [-1, 1] : [1]) for (const side of sides) for (const e of es) {
        const sc = e + d * 0.06 + (side === sides[0] ? 0 : 3); if (sc >= bs) continue;
        const q = crAt(s0 + d * sg); if (!q) continue; const o = side * ((side > 0 ? q.br : q.bl) + 1.5 + e + W / 2), x = q.px + q.nx * o, z = q.pz + q.nz * o, tx = q.tx, tz = q.tz, nx = q.nx * side, nz = q.nz * side, hy = q.hy, i = q.i;
        const f = fit(x, z, tx, tz, L, W, dh, hy); if (!f) continue;
        bs = sc; b = { x, z, s: s0 + d * sg, side, i, lo: f[0], hi: f[1], nx, nz, tx, tz, hy }; }
      return b; };
    const apex = (s) => { const q = crAt(s); return [q.px, q.hy, q.pz]; };

    /* ---- people: crew figures in the scenery (on the towers and the crane; 150 vertices), photographers as spectator figures in hi-vis ---- */
    const SKIN = [[0.96, 0.78, 0.63], [0.86, 0.63, 0.47], [0.66, 0.45, 0.31], [0.42, 0.29, 0.2]], PANTS = [[0.19, 0.27, 0.44], [0.1, 0.1, 0.12], [0.33, 0.34, 0.37]];
    const man = (g, x, y, z, fx, fz, shirt, o) => {   // facing (fx, fz), standing at height y; o.up: the hands forwards on the camera's handles, o.hat
      o = o || {}; const h = (k) => crH(x, z, 60 + k), skin = SKIN[Math.floor(h(1) * 4)], pants = PANTS[Math.floor(h(2) * 3)], r = Math.atan2(fz, fx), ax = -fz, az = fx;
      const B = (a, b, yb, sx, sy, sz, col, top) => box(g, x + fx * a + ax * b, y + yb, z + fz * a + az * b, sx, sy, sz, r, col, top, true);
      B(0, 0, 0, 0.22, 0.84, 0.34, pants); B(0, 0, 0.84, 0.26, 0.58, 0.44, shirt); B(0, 0, 1.43, 0.24, 0.26, 0.22, skin, o.hat || [0.12, 0.1, 0.08]);
      if (o.up) for (const b of [-0.2, 0.2]) B(0.18, b, 1.2, 0.4, 0.1, 0.1, shirt, null); else for (const b of [-0.27, 0.27]) B(0, b, 0.8, 0.12, 0.6, 0.1, shirt);
    };
    const tvCam = (g, x, y, z, fx, fz, legs) => {   // a broadcast camera pointing (fx, fz): the body, the big lens, the viewfinder; on a tripod (legs) with its head at y + 1.35
      const r = Math.atan2(fz, fx), ax = -fz, az = fx, hy = y + (legs ? 1.32 : 0);
      if (legs) for (let k = 0; k < 3; k++) { const a = r + PI + (k - 1) * 2.1; beam(g, [x, hy, z], [x + Math.cos(a) * 0.5, y, z + Math.sin(a) * 0.5], 0.022, DARK); }
      box(g, x, hy, z, 0.64, 0.34, 0.28, r, [0.22, 0.23, 0.25], [0.32, 0.33, 0.35]); box(g, x + fx * 0.5, hy + 0.05, z + fz * 0.5, 0.4, 0.24, 0.24, r, [0.06, 0.06, 0.07]);
      box(g, x - fx * 0.12 + ax * 0.19, hy + 0.24, z - fz * 0.12 + az * 0.19, 0.22, 0.15, 0.1, r, DARK); box(g, x - fx * 0.1, hy + 0.34, z - fz * 0.1, 0.36, 0.03, 0.05, r, RED, null, true);   // (a red tally strip)
    };
    // a photographer: one of the spectator figures (instanced) in a hi-vis bib, nudged a few cm until crowdPut's hashes give the filming pose (the camera at the eyes: pkCrowd7's
    // flashes too), a camera with a long white lens on a monopod just in front of him
    const photog = (x, z, fx, fz, col) => {
      for (let q = 0; q < 121; q++) { const qx = x + ((q % 11) - 5) * 0.03, qz = z + (Math.floor(q / 11) - 5) * 0.03, h = (k) => crH(qx, qz, k);
        if (h(2) < 0.25 || h(2) >= 0.35 || h(3) < 0.04 || pkNear(qx, qz).dd < 1.5) continue;
        if (!K.putPerson(qx, qz, Math.atan2(-fx, fz), col, true)) continue;
        const a = Math.atan2(fx, fz) + (h(8) - 0.5) * 0.5, sx = Math.sin(a), sz = Math.cos(a), sy = 0.9 + 0.2 * h(5), y = gy(qx, qz), g = scen.get(qx, qz), r = Math.atan2(sz, sx), px = qx + sx * 0.36, pz = qz + sz * 0.36, cy = y + 1.47 * sy;
        box(g, px, cy - 0.07, pz, 0.14, 0.13, 0.16, r, [0.08, 0.08, 0.09]); box(g, px + sx * 0.22, cy - 0.05, pz + sz * 0.22, 0.3, 0.1, 0.1, r, [0.88, 0.88, 0.85], [0.94, 0.94, 0.92]); beam(g, [px + sx * 0.1, cy - 0.08, pz + sz * 0.1], [px + sx * 0.14, y, pz + sz * 0.14], 0.016, DARK);
        CR.avoid(qx, qz, 0.8); info.ph.push([Math.round(pkNear(qx, qz).i * T.ds), +pkNear(qx, qz).dd.toFixed(1)]); return true; }
      return false; };

    /* ---- 1. safety: foam block walls (blue and white) along the rail on the outside of the hairpins and of the fast bends, just in front of it ---- */
    const foamC = [[0.12, 0.3, 0.76], [0.92, 0.92, 0.9]], foamT = [[0.2, 0.42, 0.88], [0.98, 0.98, 0.96]];
    const foam = (s0, s1, side) => { const pts = [];   // (no shadow: in the terrain tiles; only the faces that show: the front, the top, the row's two ends; 12-18 vertices a block)
      for (let s = s0; s <= s1; s += 0.25) { const q = crAt(s); if (!q) continue; const o = side * ((side > 0 ? q.br : q.bl) + 0.05); pts.push([q.px + q.nx * o, q.hy, q.pz + q.nz * o, q.nx * side * 0.23, q.nz * side * 0.23]); }
      const F = (p, e, y) => [p[0] - p[3] * e, y, p[2] - p[4] * e];   // e: +1 the front (towards the road), -1 the back
      let a = 0, k = 0;
      for (let b = 1; b < pts.length; b++) { const A = pts[a], B = pts[b], L = Math.hypot(B[0] - A[0], B[2] - A[2]); if (L < 1.5 && b < pts.length - 1) continue; if (L < 0.8) break;
        const y0 = Math.min(A[1], B[1]) - 0.38, y1 = y0 + 1.26, g = K.noShadow(A[0], A[2]), inn = [(A[0] + B[0]) / 2, y0 + 0.6, (A[2] + B[2]) / 2], c = foamC[k % 2];
        g.quadO(F(A, 1, y0), F(B, 1, y0), F(B, 1, y1), F(A, 1, y1), c, inn); g.quadO(F(A, 1, y1), F(B, 1, y1), F(B, -1, y1), F(A, -1, y1), foamT[k % 2], inn);
        if (a === 0) g.quadO(F(A, 1, y0), F(A, -1, y0), F(A, -1, y1), F(A, 1, y1), c, inn); if (b === pts.length - 1) g.quadO(F(B, 1, y0), F(B, -1, y0), F(B, -1, y1), F(B, 1, y1), c, inn);
        k++; a = b; }
      info.foam += k; };
    const hp = T.corners.filter(c => { const sm = (c.i0 + c.i1) / 2 * T.ds; return sm > sStart + 80 && sm < sFin - 60; });
    for (const c of hp) { const sm = (c.i0 + c.i1) / 2 * T.ds, d = sm - sStart;
      if (c.sev >= 3 || [578, 1460, 4590, 5840].some(q => Math.abs(q - d) < 40)) foam(c.i0 * T.ds - 6, c.i1 * T.ds + 6, -c.dir); }   // (the hairpins; Engineer's, the bends before Brown Bush, Double Cut, Olympic)

    /* ---- tall catch fences in front of the spectators at the hairpins (both sides): posts every ~3.4 m 1.7 m beyond the barrier, the chain-link panels (transparent,
       in the atlas mesh: both faces) between them; broken where a marshal post, a camp or a building stands (posts and foam: no shadow, in the terrain tiles) ---- */
    const FH = 3.6, postC = [0.2, 0.24, 0.22];
    const fence = (s0, s1, side) => { let last = null;
      for (let s = s0; s <= s1; s += 0.4) { const q = crAt(s); if (!q) continue; const o = side * ((side > 0 ? q.br : q.bl) + 1.7), x = q.px + q.nx * o, z = q.pz + q.nz * o;
        if (last && Math.hypot(x - last[0], z - last[2]) < 3.4) continue;
        const ok = pkNear(x, z).dd >= 1.5 && !hard(x, z) && gy(x, z) > q.hy - 2.2 && gy(x, z) < q.hy + 3;
        if (!ok) { last = null; continue; }
        const y = gy(x, z), p = [x, y, z], g = K.noShadow(x, z); box(g, x, y - 0.3, z, 0.1, FH + 0.4, 0.1, Math.atan2(q.tz, q.tx), postC, null, true);
        if (last && Math.hypot(x - last[0], z - last[2]) < 4.6) { const a = last, b = p;
          if (Math.abs(a[1] - b[1]) < 0.9) { const A = [a[0], a[1] + 0.05, a[2]], B = [b[0], b[1] + 0.05, b[2]], C = [b[0], b[1] + FH, b[2]], D = [a[0], a[1] + FH, a[2]];
            tq(A, B, C, D, AT.mesh, null, 0.5); tq(B, A, D, C, AT.mesh, null, 0.5); beam(g, [a[0], a[1] + FH, a[2]], [b[0], b[1] + FH, b[2]], 0.03, postC); info.fence++; } }
        last = p; } };
    for (const c of hp) { if (c.sev < 3) continue; const sm = (c.i0 + c.i1) / 2 * T.ds; for (const sd of [-1, 1]) fence(sm - 21, sm + 21, sd); }

    /* ---- 2. TV production: camera towers (a braced scaffold, the deck 4.5-5.5 m up, the camera and its operator, the channel's board towards the road) at
       Engineer's Corner, the W's, Devil's Playground and Boulder Park; camera cranes at the W's and at the finish; photographers in hi-vis at the fast bends ---- */
    const SC = [0.7, 0.71, 0.74], plank = [0.5, 0.42, 0.32], crew = [0.13, 0.3, 0.6];
    const tower = (d, sides, aimD) => {
      const p = spot(sStart + d, sides, [0.5, 1.5, 3, 5], 2.8, 2.8, 50, 1.6); if (!p) return;
      const { tx, tz, nx, nz } = p, g = scen.get(p.x, p.z), hd = Math.atan2(tz, tx), deck = p.hi + 4.6 + R() * 0.8, P = (a, b) => [p.x + tx * a - nx * b, p.z + tz * a - nz * b];   // a along the road, b towards it
      const C4 = [[1.25, 1.25], [1.25, -1.25], [-1.25, -1.25], [-1.25, 1.25]], foot = C4.map(([a, b]) => { const [x, z] = P(a, b); return [x, gy(x, z) - 0.2, z]; });
      for (const [x, y, z] of foot) box(g, x, y, z, 0.11, deck - y, 0.11, hd, SC, null, true);
      for (let k = 0; k < 4; k++) { const A = foot[k], B = foot[(k + 1) % 4], mid = (A[1] + deck) / 2; beam(g, [A[0], A[1] + 0.5, A[2]], [B[0], mid, B[2]], 0.035, SC); beam(g, [A[0], mid, A[2]], [B[0], deck - 0.3, B[2]], 0.035, SC); }   // (zig-zag bracing on each face)
      { const [x, z] = P(0, 0); box(g, x, deck - 0.16, z, 2.8, 0.16, 2.8, hd, [0.55, 0.56, 0.6], plank); }
      for (const [a, b, L, W] of [[0, 1.33, 2.8, 0.06], [1.37, 0, 0.06, 2.7], [-1.37, 0.4, 0.06, 1.9]]) { const [x, z] = P(a, b); box(g, x, deck + 1.0, z, L, 0.06, W, hd, SC); box(g, x, deck + 0.5, z, L, 0.05, W, hd, SC); }
      { const [x, z] = P(-0.75, -1.42), y = gy(x, z) - 0.1; for (const e of [-0.27, 0.27]) box(g, x + tx * e, y, z + tz * e, 0.05, deck - y, 0.05, hd, SC, null, true);
        for (let k = 1; k * 0.6 < deck - y; k++) box(g, x, y + k * 0.6, z, 0.55, 0.05, 0.05, hd, SC, null, true); }   // the ladder at the back
      const [ax, , az] = apex(sStart + aimD), [cx0, cz0] = P(0.1, 0.35), [fx, fz] = nrm(ax - cx0, az - cz0);
      tvCam(g, cx0, deck, cz0, fx, fz, 1); man(g, cx0 - fx * 0.75, deck, cz0 - fz * 0.75, fx, fz, crew, { up: 1, hat: DARK });
      { const [x, z] = P(0, 1.38); board(x, deck + 0.42, z, -nx, -nz, 2.6, 0.33, AT.tv, sh(crew, 0.6)); }
      { const [x, z] = P(1.0, -0.9); box(g, x, deck, z, 0.5, 0.5, 0.4, hd, [0.2, 0.22, 0.25]); box(g, x, deck + 0.5, z, 0.42, 0.04, 0.34, hd, [0.85, 0.85, 0.85]); }   // a flight case with a laptop
      ex(p.x, p.z, 2.4); info.tv.push([Math.round(p.s - sStart), p.side, +(p.hi - p.lo).toFixed(1)]);
    };
    const jib = (d, sides, aimD) => {   // a camera crane: a dolly on wheels, a column, the boom tilted up out over the verge (counterweights at its back), the remote head at its tip, the operator with a monitor behind
      const p = spot(sStart + d, sides, [3.2, 4.5, 6], 2.6, 2.6, 40, 1.0); if (!p) return;
      const [ax, , az] = apex(sStart + aimD), [dx, dz] = nrm(ax - p.x, az - p.z), r = Math.atan2(dz, dx), g = scen.get(p.x, p.z), y = p.hi, sx = -dz, sz = dx;
      box(g, p.x, p.lo - 0.25, p.z, 2.0, y - p.lo + 0.55, 2.0, r, [0.3, 0.31, 0.33], [0.4, 0.41, 0.43]);
      for (const [a, b] of [[0.9, 0.9], [0.9, -0.9], [-0.9, 0.9], [-0.9, -0.9]]) box(g, p.x + dx * a + sx * b, y - 0.05, p.z + dz * a + sz * b, 0.36, 0.36, 0.16, r + PI / 2, TYRE, null, true);
      box(g, p.x, y + 0.3, p.z, 0.32, 2.1, 0.32, r, [0.82, 0.82, 0.84]);
      const el = 0.22, L1 = 8.2, L0 = 2.8, py = y + 2.5, ce = Math.cos(el), se = Math.sin(el), tip = [p.x + dx * L1 * ce, py + L1 * se, p.z + dz * L1 * ce], back = [p.x - dx * L0 * ce, py - L0 * se, p.z - dz * L0 * ce];
      beam(g, back, tip, 0.15, [0.78, 0.79, 0.83]); beam(g, [back[0], back[1] - 0.4, back[2]], [tip[0], tip[1] - 0.12, tip[2]], 0.05, [0.6, 0.61, 0.65]);   // (a truss: the top chord, a lower one) beam(g, [p.x, py + 1.1, p.z], tip, 0.03, DARK); beam(g, [p.x, py + 1.1, p.z], back, 0.03, DARK); box(g, p.x, py, p.z, 0.08, 1.15, 0.08, r, DARK);   // (the boom, the stay cables over a king post)
      box(g, back[0], back[1] - 0.45, back[2], 0.6, 0.6, 0.5, r, [0.15, 0.15, 0.17], [0.3, 0.3, 0.32]);   // counterweights
      beam(g, tip, [tip[0], tip[1] - 0.45, tip[2]], 0.04, DARK); tvCam(g, tip[0], tip[1] - 0.82, tip[2], dx, dz, 0);
      const ox = p.x - dx * 1.9 + sx * 1.0, oz = p.z - dz * 1.9 + sz * 1.0; if (pkNear(ox, oz).dd >= 1.5) { const oy = gy(ox, oz); man(g, ox, oy, oz, dx, dz, crew, { up: 1, hat: DARK }); box(g, ox + dx * 0.55, oy, oz + dz * 0.55, 0.1, 1.2, 0.1, r, DARK); box(g, ox + dx * 0.55, oy + 1.2, oz + dz * 0.55, 0.08, 0.32, 0.5, r, [0.06, 0.06, 0.07]); }   // the monitor on a stand
      if (Math.hypot(tip[0] - p.x, tip[2] - p.z) > 0) info.jib.push([Math.round(p.s - sStart), p.side, +pkNear(tip[0], tip[2]).dd.toFixed(1)]);
      ex(p.x, p.z, 3.2);
    };
    tower(578, [1, -1], 572); tower(3168, [-1, 1], 3168); tower(4050, [-1, 1], 4050); tower(5356, [-1, 1], 5356);
    jib(2924, [1, -1], 2924); jib(sFin - sStart - 12, [1, -1], sFin - sStart);
    for (const [d, sd, n] of [[560, -1, 2], [1430, 1, 2], [4590, 1, 2], [4060, 1, 1], [5835, -1, 2]]) {   // photographers in hi-vis (lime, orange) on the inside of the bends
      let k = 0; for (let t = 0; t < 14 && k < n; t++) { const s = sStart + d + (t % 2 ? -1 : 1) * Math.floor(t / 2) * 3.5 + k * 4, q = crAt(s), o = sd * ((sd > 0 ? q.br : q.bl) + 1.9), x = q.px + q.nx * o, z = q.pz + q.nz * o, fx = -q.nx * sd + q.tx * 0.5, fz = -q.nz * sd + q.tz * 0.5;
        if (hard(x, z) || busy(x, z, 1.2)) continue; const [ux, uz] = nrm(fx, fz); if (photog(x, z, ux, uz, k % 2 ? ORG : LIME)) k++; } }

    /* ---- 3. the modern paddock beside the old one below the start (the +n side of its pad): two team transporters with their awnings, the charging canopy for the
       electric class, the inflatable arch over the paddock lane; the big screen by the start straight for the spectators ---- */
    const pd = K.P.pads[0], hh = T.hd[0], ch = Math.cos(hh), shh = Math.sin(hh), at = (a, b) => [pd.x + ch * a - shh * b, pd.z + shh * a + ch * b];   // a along the road, b across (+n)
    const okAt = (a, b) => { const [x, z] = at(a, b); return pkNear(x, z).dd >= 1.5; };
    const clear = (a0, a1, b0, b1) => CR.ppl.cull((x, z) => { const dx = x - pd.x, dz = z - pd.z, a = dx * ch + dz * shh, b = -dx * shh + dz * ch; return a > a0 && a < a1 && b > b0 && b < b1; });   // (the old paddock's visitors out of the new things' way)
    const truck = (a, b, k, flip) => {   // a transporter (tractor + 13.6 m trailer, 4 m high) along the road, the cab towards +a (flip: -a); the team's livery on both sides of the trailer
      const [x, z] = at(a, b), r = hh + (flip ? PI : 0), c = Math.cos(r), s = Math.sin(r), y = gy(x, z) - 0.08, g = scen.get(x, z), col = hex([0x0e1a2b, 0xf2f2ee, 0x121316, 0xf2c230][k]), acc = hex([0x38e0c8, 0xd8261e, 0xe02a1f, 0x13306b][k]);
      const V = (u, v, h) => [x + c * u - s * v, y + h, z + s * u + c * v], vb = (u, v, h, L, H, W, cl, top) => { const p = V(u, v, h); box(g, p[0], p[1], p[2], L, H, W, r, cl, top, true); };
      vb(-1.5, 0, 1.05, 13.6, 2.95, 2.55, col, sh(col, 1.06)); vb(-1.5, 0, 0.55, 13.2, 0.5, 2.3, DARK); vb(-1.5, 0, 3.75, 13.62, 0.22, 2.57, acc);
      vb(7.0, 0, 0.5, 2.4, 2.45, 2.5, col, sh(col, 1.06)); vb(7.2, 0, 1.75, 2.0, 0.95, 2.52, GLASS, col); vb(7.0, 0, 2.95, 2.2, 0.55, 2.3, acc); vb(6.0, 0, 0.35, 3.0, 0.4, 2.2, DARK);   // the cab, its windscreen band, the roof spoiler, the chassis
      for (const u of [7.6, 5.4, -5.0, -6.3, -7.6]) for (const v of [-1.13, 1.13]) vb(u, v, 0, 1.0, 1.0, 0.32, TYRE);
      for (const sd of [-1, 1]) { const A = V(-7.3, sd * 1.3, 1.25), B = V(4.3, sd * 1.3, 1.25), C = V(4.3, sd * 1.3, 3.65), D = V(-7.3, sd * 1.3, 3.65); if (sd > 0) tq(B, A, D, C, AT.liv[k]); else tq(A, B, C, D, AT.liv[k]); }
      tq(V(-6.2, 1.1, 4.03), V(3.2, 1.1, 4.03), V(3.2, -1.1, 4.03), V(-6.2, -1.1, 4.03), AT.liv[k]);   // (and on the roof, for the high cameras)
      info.trucks++;
      return { V, g, r, col, acc };
    };
    const awning = (T0, sd, k) => {   // an awning out from the trailer's roof on side sd, on two legs, a crew member and a tyre rack under it
      const { V, g, acc } = T0, A = V(-6.8, sd * 1.3, 3.6), B = V(3.6, sd * 1.3, 3.6), C = V(3.6, sd * 4.3, 3.05), D = V(-6.8, sd * 4.3, 3.05);
      g.quadO(A, B, C, D, sh(acc, 0.95), [(A[0] + C[0]) / 2, A[1] - 3, (A[2] + C[2]) / 2]); g.quadO(A, B, C, D, sh(acc, 0.7), [(A[0] + C[0]) / 2, A[1] + 3, (A[2] + C[2]) / 2]);
      for (const u of [-6.6, 3.4]) { const p = V(u, sd * 4.2, 0); box(g, p[0], p[1] - 0.1, p[2], 0.08, 3.12, 0.08, T0.r, STEEL, null, true); }
      for (let q = 0; q < 4; q++) { const p = V(-4.5 + q * 0.75, sd * 2.0, 0); cyl(g, p[0], p[1], p[2], 0.33, 0.85, 7, TYRE, [0.18, 0.18, 0.2]); }   // a stack of race tyres
      { const p = V(1.2, sd * 3.0, 0); K.putPerson(p[0], p[2], hh + (sd > 0 ? 0 : PI), sh(T0.acc, 1)); }
    };
    if (okAt(-14, 18.5) && okAt(2, 18.5)) { clear(-24.5, 11.5, 17, 23); const t0 = truck(-15.5, 18.6, 0); awning(t0, 1, 0); const t1 = truck(2.6, 18.6, 1); awning(t1, 1, 1); ex(...at(-6, 19), 13); }
    if (okAt(-15, 30) && okAt(-3, 30)) { clear(-16, -2, 27.5, 34);   // the charging canopy: a flat solar roof on four posts over four bays, the chargers (glowing screens), two cars on charge
      const [x, z] = at(-9, 30.5), y = gy(x, z), g = scen.get(x, z), L = 13, D = 5.2, top = y + 3.3, fx = -shh, fz = ch;   // (fx, fz: across, towards the lane)
      for (const [a, b] of [[-6, -2.3], [6, -2.3], [-6, 2.3], [6, 2.3]]) { const [px, pz] = at(-9 + a, 30.5 + b); box(g, px, gy(px, pz) - 0.2, pz, 0.18, top - gy(px, pz) + 0.2, 0.18, hh, STEEL, null, true); }
      box(g, x, top, z, L, 0.28, D, hh, [0.9, 0.9, 0.9], [0.13, 0.17, 0.3]);
      for (let q = 0; q < 6; q++) { const [px, pz] = at(-9 - 5.4 + q * 2.16, 30.5); box(g, px, top + 0.28, pz, 0.06, 0.02, D - 0.2, hh, [0.6, 0.62, 0.68], null, true); }   // (the panels' seams)
      for (const sd of [-1, 1]) { const [bx, bz] = at(-9, 30.5 + sd * (D / 2 + 0.04)); board(bx, top - 0.5, bz, fx * sd, fz * sd, 8.4, 1.05, AT.zone, [0.06, 0.1, 0.18]); }
      for (let q = 0; q < 4; q++) { const [px, pz] = at(-13.5 + q * 3, 28.6), py = gy(px, pz);
        box(g, px, py - 0.1, pz, 0.42, 1.95, 0.36, hh, WHT, [0.22, 0.88, 0.48], true); board(px - fx * 0.19, py + 1.05, pz - fz * 0.19, -fx, -fz, 0.38, 0.19, AT.ev, null);
        info.ev++;
        if (q % 2 === 0) { const [cxp, czp] = at(-13.5 + q * 3, 31.3); K.carPk(cxp, czp, hh + PI / 2, q ? [0.85, 0.87, 0.9] : [0.1, 0.55, 0.62]); beam(g, [px - fx * 0.1, py + 1.2, pz - fz * 0.1], [cxp - fx * 1.9, py + 0.7, czp - fz * 1.9], 0.025, DARK); } }
      ex(x, z, 8);
    }
    { // the inflatable arch over the paddock lane (between the transporters and the charging canopy), its legs anchored on sand bags
      const a0 = [13.5, -27.5].find(a => okAt(a, 20.4) && okAt(a, 28.6)), b0 = 24.5; if (a0 != null) { clear(a0 - 1.5, a0 + 1.5, 19.5, 29.5);
        const [cx0, cz0] = at(a0, b0), ux = -shh, uz = ch, fx = ch, fz = shh, y0 = gy(cx0, cz0) - 0.15, rr = 3.6, tr = 0.6, n = 16, m = 8, g = scen.get(cx0, cz0), red = [0.9, 0.14, 0.11], wh = [0.96, 0.96, 0.95];
        const ring = (k) => { const th = PI * k / n, ct = Math.cos(th), st = Math.sin(th), c = [cx0 + ux * rr * ct, y0 + 1.2 + rr * 1.15 * st, cz0 + uz * rr * ct], dl = Math.hypot(ct, st / 1.15), d = [ux * ct / dl, st / 1.15 / dl, uz * ct / dl];   // centre, outward normal of the ellipse
          return { c, d, P: Array.from({ length: m }, (_, j) => { const ph = j / m * TAU, a = Math.cos(ph) * tr, b = Math.sin(ph) * tr; return [c[0] + d[0] * a + fx * b, c[1] + d[1] * a, c[2] + d[2] * a + fz * b]; }) }; };
        const Rg = []; for (let k = 0; k <= n; k++) Rg.push(ring(k));
        for (let k = 0; k < n; k++) for (let j = 0; j < m; j++) { const A = Rg[k].P[j], B = Rg[k].P[(j + 1) % m], C = Rg[k + 1].P[(j + 1) % m], D = Rg[k + 1].P[j], inn = [(Rg[k].c[0] + Rg[k + 1].c[0]) / 2, (Rg[k].c[1] + Rg[k + 1].c[1]) / 2, (Rg[k].c[2] + Rg[k + 1].c[2]) / 2]; g.quadO(A, B, C, D, j === 0 || j === 4 ? wh : red, inn); }
        for (const e of [-1, 1]) { const lx = cx0 + ux * rr * e, lz = cz0 + uz * rr * e; cyl(g, lx, y0, lz, tr, 1.25, 8, red, null); box(g, lx, y0 - 0.05, lz, 1.5, 0.3, 1.5, hh, [0.55, 0.5, 0.36]); }   // the legs, the sand bags
        for (const sd of [-1, 1]) { const k0 = 3, k1 = n - 3;   // the print along the curve on both faces (read left to right from either side)
          for (let k = k0; k < k1; k++) { const P0 = Rg[k], P1 = Rg[k + 1], o = sd * (tr + 0.03), Q = (Rr, e) => [Rr.c[0] + fx * o + Rr.d[0] * e, Rr.c[1] + Rr.d[1] * e, Rr.c[2] + fz * o + Rr.d[2] * e];
            const ua = sd > 0 ? (k1 - k) / (k1 - k0) : (k - k0) / (k1 - k0), ub = sd > 0 ? (k1 - k - 1) / (k1 - k0) : (k + 1 - k0) / (k1 - k0), c = AT.arch, u0 = (c[0] + 2 + ua * (c[2] - 4)) / 1024, u1 = (c[0] + 2 + ub * (c[2] - 4)) / 1024, v0 = 1 - (c[1] + c[3] - 2) / 1024, v1 = 1 - (c[1] + 2) / 1024;
            tg.get(P0.c[0], P0.c[2]).quadO(Q(P0, -0.5), Q(P1, -0.5), Q(P1, 0.5), Q(P0, 0.5), W1, [P0.c[0] - fx * sd, P0.c[1], P0.c[2] - fz * sd], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); } }
        for (const e of [-1, 1]) CR.avoid(cx0 + ux * rr * e, cz0 + uz * rr * e, 1.2);
        info.arch = [a0, b0];
      } }
    { // the paddock lane: a gravel strip from the arch past the transporters (laid on the ground, no shadow)
      const lc = [0.5, 0.45, 0.4];
      for (let a = -26; a < 16; a += 2) { const P4 = [[a, 22.8], [a + 2, 22.8], [a + 2, 26.4], [a, 26.4]].map(([u, v]) => { const [x, z] = at(u, v); return [x, gy(x, z) + 0.04, z]; }); if (!okAt(a + 1, 24.6)) continue;
        K.noShadow(P4[0][0], P4[0][2]).quadUp(P4[0], P4[1], P4[2], P4[3], [lc, sh(lc, 1.04), lc, sh(lc, 0.96)]); } }
    { // the big screen for the start straight's spectators: a 7.2 x 3.6 m LED wall on two truss legs, turned half towards the start line (the crowds and the cars coming
      // up see it), its bottom 2.6 m up (over the crowd's heads); the timing board under it, a generator beside it
      const p = spot(sStart + 34, [1, -1], [7, 9, 11], 8, 1.6, 26, 1.8);
      if (p) { const g = scen.get(p.x, p.z), [fx, fz] = nrm(-p.nx - p.tx * 0.8, -p.nz - p.tz * 0.8), rx = fz, rz = -fx, hd = Math.atan2(rz, rx), yb = p.hi + 2.6, W = 7.2, H = 3.6;
        for (const a of [-2.6, 2.6]) { const x = p.x + rx * a, z = p.z + rz * a, y = gy(x, z) - 0.2; box(g, x, y, z, 0.36, yb + H + 0.3 - y, 0.36, hd, [0.25, 0.26, 0.28]); for (let k = 0; k < 4; k++) box(g, x, y + 0.4 + k * (yb + H - y) / 4, z, 0.38, 0.05, 0.38, hd, STEEL, null, true); }
        box(g, p.x - fx * 0.25, yb - 0.15, p.z - fz * 0.25, W + 0.4, H + 0.3, 0.42, hd, [0.08, 0.08, 0.09], [0.16, 0.16, 0.18]); box(g, p.x - fx * 0.2, yb - 1.25, p.z - fz * 0.2, 4.0, 1.05, 0.3, hd, [0.08, 0.08, 0.09]);
        board(p.x, yb - 1.17, p.z, fx, fz, 3.6, 0.9, AT.led, null); board(p.x, yb, p.z, fx, fz, W, H, AT.scr, null);
        { const lx = p.x + rx * 4.8 - fx * 0.8, lz = p.z + rz * 4.8 - fz * 0.8, ly = gy(lx, lz); if (pkNear(lx, lz).dd >= 1.5) box(g, lx, ly - 0.1, lz, 0.9, 1.5, 0.7, hd, [0.86, 0.86, 0.84], [0.5, 0.52, 0.55]); }   // the generator
        ex(p.x, p.z, 4.8); info.screen = [Math.round(p.s - sStart), p.side];
      } }

    /* ---- 4. rescue: a fire engine and an ambulance by the paddock (the -n side, behind the road's end), a fire engine at Devil's Playground; the helipad at Glen Cove
       beyond the barrier (a levelled concrete deck, the H, edge lights, a windsock) with an ambulance waiting ---- */
    const vehicle = (x, z, r, kind) => {   // 0 ambulance, 1 fire engine; heading r, standing on the ground at (x, z)
      const c = Math.cos(r), s = Math.sin(r), y = gy(x, z) - 0.06, g = scen.get(x, z), V = (u, v, h) => [x + c * u - s * v, y + h, z + s * u + c * v], vb = (u, v, h, L, H, W, cl, top) => { const p = V(u, v, h); box(g, p[0], p[1], p[2], L, H, W, r, cl, top, true); };
      const lamp = (u, h, L) => { vb(u, 0, h, 0.34, 0.14, L, DARK); vb(u, -L / 4, h + 0.12, 0.3, 0.12, L / 2 - 0.05, [1, 0.25, 0.2]); vb(u, L / 4, h + 0.12, 0.3, 0.12, L / 2 - 0.05, [0.35, 0.55, 1]); };
      if (kind === 0) {
        vb(0, 0, 0.3, 6.2, 0.3, 1.9, DARK); vb(2.6, 0, 0.55, 1.0, 0.8, 2.0, WHT); vb(1.55, 0, 0.55, 1.2, 1.55, 2.05, WHT); vb(1.6, 0, 1.32, 1.23, 0.6, 2.07, GLASS, WHT);
        vb(-1.0, 0, 0.55, 4.0, 2.2, 2.35, [0.96, 0.9, 0.2], WHT); vb(-1.0, 0, 1.05, 4.02, 0.32, 2.37, [0.12, 0.35, 0.75]); lamp(1.55, 2.12, 1.7); vb(-1.0, 0, 2.75, 1.5, 0.03, 0.45, RED); vb(-1.0, 0, 2.75, 0.45, 0.03, 1.5, RED);
        for (const u of [2.1, -1.9]) for (const v of [-0.96, 0.96]) vb(u, v, 0, 0.9, 0.9, 0.3, TYRE);
        for (const sd of [-1, 1]) { const A = V(-2.9, sd * 1.19, 1.45), B = V(0.9, sd * 1.19, 1.45), C = V(0.9, sd * 1.19, 1.92), D = V(-2.9, sd * 1.19, 1.92); if (sd > 0) tq(B, A, D, C, AT.amb); else tq(A, B, C, D, AT.amb); }
      } else {
        const FR = [0.78, 0.07, 0.06];
        vb(0, 0, 0.35, 8.4, 0.35, 2.2, DARK); vb(3.1, 0, 0.6, 2.2, 2.4, 2.5, FR, sh(FR, 1.1)); vb(3.25, 0, 1.75, 1.92, 0.8, 2.52, GLASS, FR); vb(-1.2, 0, 0.6, 6.0, 2.5, 2.5, FR, [0.7, 0.7, 0.72]);
        vb(-1.2, 0, 1.0, 6.02, 0.14, 2.52, WHT); for (let q = 0; q < 3; q++) vb(-3.4 + q * 2.0, 0, 1.3, 1.6, 1.4, 2.53, [0.62, 0.62, 0.64]);   // a white stripe, the lockers' roller doors
        for (const v of [-0.55, 0.55]) beam(g, V(-4.2, v, 3.25), V(2.0, v, 3.25), 0.07, [0.85, 0.85, 0.86]); for (let q = 0; q < 7; q++) vb(-3.9 + q * 0.95, 0, 3.22, 0.06, 0.06, 1.1, [0.85, 0.85, 0.86]);   // the ladder on the roof
        lamp(3.2, 3.0, 2.0); for (const u of [3.0, -2.6, -3.8]) for (const v of [-1.0, 1.0]) vb(u, v, 0, 1.05, 1.05, 0.36, TYRE);
      }
      info.resc.push([kind, Math.round(pkNear(x, z).i * T.ds - sStart)]);
    };
    if (okAt(9, -15) && okAt(9, -21)) { clear(4.5, 13.5, -22, -13); const [x1, z1] = at(9, -14.5), [x2, z2] = at(9, -20.5); vehicle(x1, z1, hh, 1); vehicle(x2, z2, hh, 0); ex(...at(9, -17.5), 6.5); }
    { const p = spot(sStart + 3890, [1, -1], [0.5, 2, 4], 8.6, 2.8, 60, 0.8); if (p) { vehicle(p.x, p.z, Math.atan2(p.tz, p.tx), 1); ex(p.x, p.z, 5); } }
    { // the helipad: the flattest 17 m square within +-150 m of Glen Cove, 3-30 m beyond the barrier
      let b = null; const s0 = sStart + 2688;
      for (let d = 0; d <= 200 && !b; d += 4) for (const sg of d ? [-1, 1] : [1]) for (const side of [-1, 1]) for (const e of [3, 7, 12, 18, 25, 32, 40]) { if (b) break;
        const q = crAt(s0 + d * sg); if (!q) continue; const o = side * ((side > 0 ? q.br : q.bl) + 1.5 + e + 8.5), x = q.px + q.nx * o, z = q.pz + q.nz * o, tx = q.tx, tz = q.tz, hy = q.hy, nx = q.nx * side, nz = q.nz * side;
        const f = fit(x, z, tx, tz, 17, 17, 4.5, hy, 9, 6); if (f) b = { x, z, tx, tz, nx, nz, lo: f[0], hi: f[1], s: s0 + d * sg, side }; }
      if (b) { const g = scen.get(b.x, b.z), hd = Math.atan2(b.tz, b.tx), top = b.hi + 0.25, P = (a, c) => [b.x + b.tx * a - b.nx * c, b.z + b.tz * a - b.nz * c];
        box(g, b.x, b.lo - 0.5, b.z, 16, top - b.lo + 0.5, 16, hd, [0.6, 0.6, 0.58], [0.42, 0.43, 0.45]);
        { const A = P(-7.6, 7.6), B = P(7.6, 7.6), C = P(7.6, -7.6), D = P(-7.6, -7.6); tq([A[0], top + 0.02, A[1]], [B[0], top + 0.02, B[1]], [C[0], top + 0.02, C[1]], [D[0], top + 0.02, D[1]], AT.hpad); }
        for (let k = 0; k < 12; k++) { const t = k / 12 * 4, sgn = Math.floor(t), f = t - sgn, [a, c] = [[-7.8 + f * 15.6, 7.8], [7.8, 7.8 - f * 15.6], [7.8 - f * 15.6, -7.8], [-7.8, -7.8 + f * 15.6]][sgn], [x, z] = P(a, c); box(g, x, top, z, 0.22, 0.12, 0.22, hd, [0.3, 0.9, 0.4], [0.75, 1, 0.8], true); }   // edge lights
        { const [x, z] = P(9.4, -7.4), y = gy(x, z); if (pkNear(x, z).dd >= 1.5) { cyl(g, x, y - 0.2, z, 0.05, 5.2, 5, STEEL); const sx = x + 0.2, sz = z; for (let k = 0; k < 3; k++) cyl(g, sx + 0.35 + k * 0.5, y + 4.6, sz, 0.32 - k * 0.07, 0.5, 6, k % 2 ? WHT : ORG, null, 0.32 - (k + 1) * 0.07); } }   // windsock (upright cones: hung limp)
        { const [x, z] = P(-2, -11.4); if (pkNear(x, z).dd >= 1.5 && !hard(x, z)) vehicle(x, z, hd, 0); }
        ex(b.x, b.z, 12.5); info.heli = [Math.round(b.s - sStart), b.side, +(b.hi - b.lo).toFixed(1)];
      } }

    /* ---- the atlas mesh: the boards, the liveries, the screens, the fences' mesh (transparent: drawn with blending), 250 m chunks; the screens glow by
       the time of day (read from the fog colour, as pkGlow) ---- */
    const tt = new THREE.CanvasTexture(cv); tt.anisotropy = 4; out.ownTex.push(tt);
    const U = { uGlow: { value: 0.35 } }, mat = new THREE.MeshLambertMaterial({ map: tt, transparent: true, alphaTest: 0.02 });
    mat.onBeforeCompile = (s) => { s.uniforms.uGlow = U.uGlow; s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uGlow * step( 0.751, vUv.y );'); };
    mat.customProgramCacheKey = () => 'pkMod9';
    const grp = new THREE.Group(); grp.name = 'pkModern'; K.root.add(grp); tg.addTo(grp, mat, false, true);
    const glowSet = (r, sc) => { const f = sc.fog && sc.fog.color; if (!f) return; const l = 0.3 * f.r + 0.59 * f.g + 0.11 * f.b; U.uGlow.value = l < 0.2 ? 1.1 : f.r - f.b > 0.17 ? 0.75 : 0.35; };
    for (const m of grp.children) m.onBeforeRender = glowSet;
  }

  /* ---- round 9: the historic race on the gravel variant (1990s-2000s): hay bales, wooden fences and drums, period cars and camper vans,
     wooden timing huts and a hand-written board, the old Summit House, a TV van, GRAVEL ROAD signs (own random stream) ---- */
  function pkHistoric(K) {
    const R = rng(9901), { scen, excl, crSoft, CR, sStart, sFin, root } = K, gy = pkGround, PI = Math.PI, W1 = [1, 1, 1], tb = new GB(true);   // (all the text in one mesh: one draw call wherever it is seen)
    const st = K.out.pkHist = { bales: 0, fence: 0, drums: 0, cars: 0, huts: 0, signs: 0, foto: 0, vc: 0 };   // (counts, for the tests and the screenshot tools)
    // the hard exclusions (not the crowds' and gantries' soft ones) in a 16 m grid; ex() adds ours (the forest, the later crowds and pkSummit6 keep off them too)
    const EG = new Map(), egAdd = (e) => { for (let a = Math.floor((e.x - e.r) / 16); a <= Math.floor((e.x + e.r) / 16); a++) for (let b = Math.floor((e.z - e.r) / 16); b <= Math.floor((e.z + e.r) / 16); b++) { const k = a + ',' + b; let L = EG.get(k); if (!L) EG.set(k, L = []); L.push(e); } };
    for (const e of excl) if (!crSoft.has(e)) egAdd(e);
    const hard = (x, z, mr) => { const L = EG.get(Math.floor(x / 16) + ',' + Math.floor(z / 16)); if (L) for (const e of L) if (e.r >= (mr || 0) && (x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };
    const SG = (x, z) => { const g = scen.map.get(Math.floor(x / 110) + ',' + Math.floor(z / 110)); return g && !g.empty ? g : K.noShadow(x, z); };   // the scenery chunk there; where there is none yet, no new mesh (two draws with its shadow): the ground's, no shadow
    const ex = (x, z, r) => { const e = { x, z, r }; excl.push(e); egAdd(e); };
    const ok = (x, z, mr) => pkNear(x, z).dd >= 1.5 && !hard(x, z, mr);   // (mr: only the exclusions this big count: the bales and fences may stand by a chair or a cooler)
    const L4 = (x, z, rot) => { const c = Math.cos(rot), s = Math.sin(rot); return (u, w) => [x + c * u - s * w, z + s * u + c * w]; };   // local frame: u along rot, w across
    const fits = (x, z, rot, hl, hw, mr) => { const L = L4(x, z, rot); for (const [u, w] of [[0, 0], [hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw], [hl, 0], [-hl, 0], [0, hw], [0, -hw]]) { const [px, pz] = L(u, w); if (!ok(px, pz, mr)) return false; } return true; };
    const lowest = (x, z, rot, hl, hw) => { const L = L4(x, z, rot); let m = gy(x, z); for (const [u, w] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw]]) m = Math.min(m, gy(...L(u, w))); return m; };
    const tang = (q) => Math.atan2(q.tz, q.tx);   // the road's direction as a box rotation

    /* ---- the text atlas (1024 x 1024; rects in px [x0, y0, x1, y1]): the Summit House, the TV van, the old road signs, the hand-written time board, the timing huts' boards ---- */
    const A = { sh: [0, 0, 1024, 128], don: [0, 128, 512, 256], tv: [512, 128, 1024, 256], grv: [0, 256, 512, 512], pph: [512, 256, 1024, 512], brd: [0, 512, 512, 1024],
      spd: [538, 520, 742, 768], d1: [768, 512, 1024, 768], d2: [512, 768, 768, 1024], hut: (k) => [768, 768 + k * 48, 1024, 816 + k * 48], back: [772, 1010, 1020, 1022] };
    const UV = (r) => { const u0 = r[0] / 1024, u1 = r[2] / 1024, v1 = 1 - r[1] / 1024, v0 = 1 - r[3] / 1024; return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]; };
    const face = (a, b, c, d, r, inn) => tb.quadO(a, b, c, d, W1, inn, UV(r));   // one side of a board (a, b: bottom left, right as seen; c, d: top right, left)
    // a board (bottom centre cx, cy, cz) facing (fx, fz), its top leaning back by tilt; r: its rect, rb: the back's (the plain back of a road sign) or the same text
    const tq = (cx, cy, cz, fx, fz, W, H, r, tilt, rb) => {
      const ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), ux = fz, uz = -fx, kx = -fx * H * sa, ky = H * ca, kz = -fz * H * sa;
      for (const f of [1, -1]) { const hw = W / 2 * f, ox = fx * ca * 0.03 * f, oy = sa * 0.03 * f, oz = fz * ca * 0.03 * f;
        const a = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], b = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], c = [b[0] + kx, b[1] + ky, b[2] + kz], d = [a[0] + kx, a[1] + ky, a[2] + kz];
        face(a, b, c, d, f > 0 ? r : (rb || r), [cx + kx / 2 - fx * ca * f, cy + ky / 2 - sa * f, cz + kz / 2 - fz * ca * f]); }
    };
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const c2 = cv.getContext('2d');
    const txt = (s, x, y, font, col, w) => { c2.fillStyle = col; c2.font = font; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(s, x, y, w); };
    const rr = (x, y, w, h, r, fill, stroke, lw) => { c2.beginPath(); c2.moveTo(x + r, y); c2.arcTo(x + w, y, x + w, y + h, r); c2.arcTo(x + w, y + h, x, y + h, r); c2.arcTo(x, y + h, x, y, r); c2.arcTo(x, y, x + w, y, r); c2.closePath();
      if (fill) { c2.fillStyle = fill; c2.fill(); } if (stroke) { c2.strokeStyle = stroke; c2.lineWidth = lw; c2.stroke(); } };
    const grain = (x0, y0, w, h, n, a) => { for (let k = 0; k < n; k++) { c2.fillStyle = `rgba(${R() < 0.5 ? '255,250,235' : '40,25,10'},${a * R()})`; c2.fillRect(x0 + R() * w, y0 + R() * h, 2 + R() * w * 0.2, 1 + R() * 3); } };
    const SANS = (px, wt) => (wt || 700) + ' ' + px + 'px "Highway Gothic", "DejaVu Sans Condensed", "Arial Narrow", Arial, sans-serif';
    { // SUMMIT HOUSE: cream letters routed into a stained board, a thin rule
      c2.fillStyle = '#4b2c18'; c2.fillRect(0, 0, 1024, 128); grain(0, 0, 1024, 128, 160, 0.18); rr(8, 8, 1008, 112, 10, null, '#e8d9b4', 5);
      txt('SUMMIT  HOUSE', 512, 68, '900 92px Georgia, "Times New Roman", serif', '#f1e3bf', 960); }
    { // the gift shop's board: red with cream letters
      c2.fillStyle = '#8c2a1e'; c2.fillRect(0, 128, 512, 128); rr(6, 134, 500, 116, 8, null, '#f3e6c4', 4);
      txt('FAMOUS DONUTS', 256, 172, '900 50px Georgia, serif', '#f6ead0', 470); txt('GIFTS  ·  RESTAURANT', 256, 222, '700 34px Georgia, serif', '#f6ead0', 470); }
    { // the TV van's side: a 1990s station logo (fictional)
      c2.fillStyle = '#eef0f2'; c2.fillRect(512, 128, 512, 128); c2.fillStyle = '#1d3f8f'; c2.fillRect(512, 214, 512, 26); c2.fillStyle = '#c8231d'; c2.fillRect(512, 240, 512, 10);
      c2.fillStyle = '#1d3f8f'; c2.beginPath(); c2.arc(586, 172, 40, 0, TAU); c2.fill(); txt('11', 586, 174, 'italic 900 46px Arial, sans-serif', '#fff', 70);
      txt('KPKT', 742, 160, 'italic 900 58px Arial, sans-serif', '#1d3f8f', 220); txt('SPORTS', 742, 200, 'italic 700 30px Arial, sans-serif', '#c8231d', 220);
      txt('LIVE · SATELLITE', 908, 180, '700 22px Arial, sans-serif', '#555', 200); }
    { // GRAVEL ROAD NEXT 12 MILES: black on a white plate, black rim (weathered)
      c2.fillStyle = '#7a7a76'; c2.fillRect(0, 256, 512, 256); rr(8, 264, 496, 240, 18, '#efeee6', '#151515', 12);
      txt('GRAVEL ROAD', 256, 330, SANS(70, 800), '#151515', 450); txt('NEXT', 256, 400, SANS(52, 800), '#151515', 440); txt('12 MILES', 256, 462, SANS(66, 800), '#151515', 450); grain(16, 272, 480, 224, 60, 0.12); }
    { // PIKES PEAK HIGHWAY: the forest service's brown with white letters and rule
      c2.fillStyle = '#5b3a22'; c2.fillRect(512, 256, 512, 256); rr(524, 268, 488, 232, 14, null, '#f2ede0', 6);
      c2.fillStyle = '#f2ede0'; c2.beginPath(); c2.moveTo(560, 470); c2.lineTo(620, 372); c2.lineTo(650, 412); c2.lineTo(676, 386); c2.lineTo(730, 470); c2.fill();
      txt('PIKES PEAK', 860, 336, SANS(60, 800), '#f2ede0', 290); txt('HIGHWAY', 860, 410, SANS(60, 800), '#f2ede0', 290); txt('ELEV. 14,110 FT', 860, 466, SANS(26, 700), '#f2ede0', 290); grain(512, 256, 512, 256, 80, 0.14); }
    { // SPEED LIMIT 25: the white regulatory plate
      c2.fillStyle = '#7a7a76'; c2.fillRect(512, 512, 256, 256); rr(542, 524, 196, 240, 14, '#f4f4ee', '#151515', 8);
      txt('SPEED', 640, 572, SANS(40, 800), '#151515', 170); txt('LIMIT', 640, 618, SANS(40, 800), '#151515', 170); txt('25', 640, 700, SANS(104, 800), '#151515', 170); }
    const diamond = (x0, y0, draw) => {   // a yellow warning diamond: the quad is built as a diamond (its corners at the square's), so the picture is drawn turned 45 degrees
      c2.fillStyle = '#222'; c2.fillRect(x0, y0, 256, 256); rr(x0 + 6, y0 + 6, 244, 244, 16, '#f0c419', '#151515', 9);
      c2.save(); c2.translate(x0 + 128, y0 + 128); c2.rotate(PI / 4); c2.fillStyle = '#151515'; c2.strokeStyle = '#151515'; draw(); c2.restore(); grain(x0, y0, 256, 256, 40, 0.1); };
    diamond(768, 512, () => { c2.lineWidth = 22; c2.lineCap = 'butt'; c2.beginPath(); c2.moveTo(-26, 80); c2.lineTo(-26, -6); c2.quadraticCurveTo(-26, -40, 8, -40); c2.lineTo(18, -40); c2.stroke();   // a sharp bend right
      c2.beginPath(); c2.moveTo(16, -72); c2.lineTo(62, -40); c2.lineTo(16, -8); c2.fill(); });
    diamond(512, 768, () => { c2.lineWidth = 16; c2.beginPath(); c2.moveTo(-40, 84); c2.lineTo(-40, 40); c2.bezierCurveTo(-40, 6, 30, 30, 30, -4); c2.bezierCurveTo(30, -38, -36, -16, -36, -50); c2.lineTo(-36, -54); c2.stroke();   // switchbacks
      c2.beginPath(); c2.moveTo(-62, -48); c2.lineTo(-36, -86); c2.lineTo(-10, -48); c2.fill(); });
    { // the hand-written results board: a whiteboard in a wooden frame, marker in black, blue and red (fictional drivers)
      const x0 = 0, y0 = 512; c2.fillStyle = '#6b4a2c'; c2.fillRect(x0, y0, 512, 512); c2.fillStyle = '#f4f3ee'; c2.fillRect(x0 + 16, y0 + 16, 480, 480);
      c2.fillStyle = 'rgba(120,130,150,0.10)'; for (let k = 0; k < 8; k++) c2.fillRect(x0 + 16 + R() * 400, y0 + 16 + R() * 420, 40 + R() * 120, 6 + R() * 18);   // smudges of wiped marker
      const HW = (px) => 'italic 700 ' + px + 'px "Comic Sans MS", "Segoe Print", "Bradley Hand", cursive';
      c2.save(); c2.translate(x0 + 256, y0 + 54); c2.rotate(-0.015); txt('UNLIMITED  -  OFFICIAL', 0, 0, HW(36), '#c8231d', 460); c2.restore();
      c2.strokeStyle = '#c8231d'; c2.lineWidth = 3; c2.beginPath(); c2.moveTo(x0 + 50, y0 + 80); c2.lineTo(x0 + 462, y0 + 76); c2.stroke();
      const rows = [['1.', 'T. HALVORSEN', '10:11.42'], ['2.', 'M. DUCHESNE', '10:19.87'], ['3.', 'J. OKAFOR', '10:27.15'], ['4.', 'B. KRANJC', '10:41.03'], ['5.', 'L. VANTERPOOL', '10:58.60'],
        ['6.', 'D. MAREK', '11:06.21'], ['7.', 'K. ODEGAARD', '11:22.94'], ['8.', 'P. RENWICK', '11:40.08']];
      rows.forEach(([n, who, t], k) => { const y = y0 + 120 + k * 46, ink = k < 3 ? '#1b2a8a' : '#141414';
        c2.save(); c2.translate(0, y); c2.rotate((R() - 0.5) * 0.02); c2.fillStyle = ink; c2.font = HW(30); c2.textBaseline = 'middle';
        c2.textAlign = 'left'; c2.fillText(n, x0 + 34, 0); c2.fillText(who, x0 + 74, 0, 250); c2.textAlign = 'right'; c2.fillText(t, x0 + 482, 0); c2.restore(); });
      c2.strokeStyle = '#141414'; c2.lineWidth = 3; c2.beginPath(); c2.moveTo(x0 + 380, y0 + 304); c2.lineTo(x0 + 486, y0 + 296); c2.stroke();   // a time struck through, the right one above it
      c2.save(); c2.translate(x0 + 430, y0 + 272); c2.rotate(-0.05); txt('10:41.30', 0, 0, HW(20), '#c8231d', 110); c2.restore();
      c2.save(); c2.translate(x0 + 256, y0 + 476); c2.rotate(0.01); txt('PIKES PEAK INT\'L HILL CLIMB', 0, 0, HW(26), '#1b2a8a', 440); c2.restore(); }
    ['TIMING  ·  CP 1', 'TIMING  ·  CP 2', 'TIMING  ·  CP 3', 'TIMING  ·  CP 4', 'FINISH  TIMING'].forEach((s, k) => { const y0 = 768 + k * 48;   // the timing huts' boards: white letters on green
      c2.fillStyle = k === 4 ? '#7d1d16' : '#244a2e'; c2.fillRect(768, y0, 256, 48); c2.strokeStyle = '#efe6cc'; c2.lineWidth = 3; c2.strokeRect(772, y0 + 4, 248, 40); txt(s, 896, y0 + 26, SANS(28, 800), '#f3ecd6', 236); });
    c2.fillStyle = '#8b8d8f'; c2.fillRect(768, 1008, 256, 16);   // the plain grey back of a road sign

    /* ---- the old Summit House (the summit's building until 2021) on the visitor center's pad: the Summit Visitor Center (pkLandmarks2, 2021), its name and its monument
       by the road and its lit windows (pkFans5) are taken out of the chunks and meshes already built (found by place and colour, or by their rows of pkLandmarks2's atlas) ---- */
    const pd = K.padH, ih = pd.i, htx = T.tx[ih], htz = T.tz[ih], hnx = T.nx[ih], hnz = T.nz[ih], hrot = Math.atan2(htz, htx);
    {
      const inBox = (x, z) => { const dx = x - pd.x, dz = z - pd.z, a = dx * htx + dz * htz, b = dx * hnx + dz * hnz; return Math.abs(a) < 18.2 && b > -15.4 && b < 7.4; };
      const like = (r, g, b, L) => L.some(c => { const k = r / c[0]; return k > 0.84 && k < 1.16 && Math.abs(g - c[1] * k) < 0.004 && Math.abs(b - c[2] * k) < 0.004; });
      const vcC = [[0.5, 0.45, 0.41], [0.62, 0.6, 0.57], [0.1, 0.13, 0.16], [0.2, 0.26, 0.3], [0.6, 0.55, 0.5], [0.3, 0.3, 0.31], [0.2, 0.2, 0.21], [0.33, 0.42, 0.2], [0.52, 0.46, 0.24], [0.28, 0.28, 0.29], [0.4, 0.4, 0.4], [0.52, 0.62, 0.66], [0.31, 0.21, 0.13], [0.24, 0.18, 0.12]];
      const cutGB = (g, drop) => { const n = g.P.length / 9, nc = g.A ? 12 : 9; let w = 0;   // drop(P, C, t): leave triangle t out
        for (let t = 0; t < n; t++) { if (drop(g.P, g.C, t, nc)) continue; if (w !== t) { for (let q = 0; q < 9; q++) { g.P[w * 9 + q] = g.P[t * 9 + q]; g.N[w * 9 + q] = g.N[t * 9 + q]; } for (let q = 0; q < nc; q++) g.C[w * nc + q] = g.C[t * nc + q]; if (g.U) for (let q = 0; q < 6; q++) g.U[w * 6 + q] = g.U[t * 6 + q]; } w++; }
        g.P.length = g.N.length = w * 9; g.C.length = w * nc; if (g.U) g.U.length = w * 6; return n - w; };
      const cutMesh = (m, drop) => { const G = m.geometry, n = G.attributes.position.count / 3, keep = []; for (let t = 0; t < n; t++) if (!drop(G, t)) keep.push(t); if (keep.length === n) return 0;
        const ng = new THREE.BufferGeometry(); for (const k in G.attributes) { const a = G.attributes[k], s = a.itemSize, arr = new Float32Array(keep.length * 3 * s); keep.forEach((t, j) => arr.set(a.array.subarray(t * 3 * s, (t + 1) * 3 * s), j * 3 * s)); ng.setAttribute(k, new THREE.BufferAttribute(arr, s)); }
        ng.computeBoundingSphere(); m.geometry = ng; G.dispose(); return n - keep.length; };
      st.vc += cutGB(scen.get(pd.x, pd.z), (P, C, t, nc) => { for (let v = 0; v < 3; v++) if (!inBox(P[t * 9 + v * 3], P[t * 9 + v * 3 + 2]) || P[t * 9 + v * 3 + 1] < pd.h - 12) return false; return like(C[t * nc], C[t * nc + 1], C[t * nc + 2], vcC); });
      let mon = null;   // its name (rows 192-256 of pkLandmarks2's atlas) and the monument's face (rows 768-1024): only they use those rows (its self-lit material tells the mesh)
      for (const m of root.children.slice()) { if (!m.isMesh || !m.material || !m.material.customProgramCacheKey || m.material.customProgramCacheKey() !== 'pkSignLit') continue;
        const vrow = (G, t) => { const U = G.attributes.uv.array; let lo = 1, hi = 0; for (let v = 0; v < 3; v++) { lo = Math.min(lo, U[(t * 3 + v) * 2 + 1]); hi = Math.max(hi, U[(t * 3 + v) * 2 + 1]); } return hi <= 0.2501 ? 1 : lo >= 0.7499 && hi <= 0.8126 ? 2 : 0; };
        { const G = m.geometry, Pp = G.attributes.position.array; let sx = 0, sz = 0, n = 0; for (let t = 0; t < Pp.length / 9; t++) if (vrow(G, t) === 1) for (let v = 0; v < 3; v++) { sx += Pp[t * 9 + v * 3]; sz += Pp[t * 9 + v * 3 + 2]; n++; } if (n) mon = [sx / n, sz / n]; }
        st.vc += cutMesh(m, (G, t) => vrow(G, t) > 0); }
      if (mon) for (const g of new Set([[-6, -6], [6, -6], [-6, 6], [6, 6]].map(([p, q]) => scen.get(mon[0] + p, mon[1] + q)))) st.vc += cutGB(g, (P, C, t, nc) => { for (let v = 0; v < 3; v++) if (Math.hypot(P[t * 9 + v * 3] - mon[0], P[t * 9 + v * 3 + 2] - mon[1]) > 5.8) return false; return like(C[t * nc], C[t * nc + 1], C[t * nc + 2], [[0.55, 0.51, 0.47], [0.6, 0.57, 0.52]]); });
      const gl = root.getObjectByName('pkGlow');   // the visitor center's lit windows
      if (gl) st.vc += cutMesh(gl, (G, t) => { const Pp = G.attributes.position.array; return inBox((Pp[t * 9] + Pp[t * 9 + 3] + Pp[t * 9 + 6]) / 3, (Pp[t * 9 + 2] + Pp[t * 9 + 5] + Pp[t * 9 + 8]) / 3); });
      st.mon = mon;
    }
    {
      // long and low (the 1960s house): a stone base, weathered board walls with a row of windows, a low pitched roof of green steel; the big name on the roof slope
      // towards the road (the cameras look down), the gift shop's board over the porch; the restaurant's windows and a deck face the view (away from the road)
      const at = (a, b) => [pd.x + htx * a + hnx * b, pd.z + htz * a + hnz * b], c0 = -2.5, Lb = 32, Db = 12, y0 = pd.h + 0.15, g = scen.get(pd.x, pd.z);
      const B = (a, b, y, sa, sy, sb, col, top, nb) => { const [x, z] = at(a, b); box(g, x, y, z, sa, sy, sb, hrot, col, top, nb !== false); };
      const stone = [0.52, 0.48, 0.44], stoneT = [0.6, 0.57, 0.52], board = [0.47, 0.36, 0.25], trim = [0.86, 0.82, 0.72], glass = [0.12, 0.14, 0.16], roofC = [0.27, 0.36, 0.3], wood = [0.36, 0.25, 0.16];
      let lo = 1e9; for (let a = -Lb / 2; a <= Lb / 2; a += 4) for (let b = c0 - Db / 2 - 5; b <= c0 + Db / 2 + 2; b += 2.5) lo = Math.min(lo, gy(...at(a, b)));
      B(0, -4.45, lo - 0.5, Lb + 1.5, y0 - lo + 0.5, 17.7, stone, stoneT);   // the stone plinth (the deck's too), down to the slope
      B(0, c0, y0, Lb, 1.25, Db, stone);   // the stone base of the walls
      B(0, c0, y0 + 1.25, Lb - 0.1, 2.45, Db - 0.1, board);   // board walls
      B(0, c0, y0 + 3.6, Lb + 0.1, 0.16, Db + 0.1, trim);   // the eaves' trim
      for (let k = -4; k <= 4; k++) { if (k === -1) continue; B(k * 3.4, c0 + Db / 2 + 0.03, y0 + 1.6, 2.1, 1.15, 0.1, glass); B(k * 3.4, c0 + Db / 2 + 0.06, y0 + 1.5, 2.3, 0.1, 0.12, trim); }   // windows to the road, white sills
      for (let k = -3; k <= 3; k++) B(k * 4.4, c0 - Db / 2 - 0.03, y0 + 1.35, 3.6, 1.75, 0.1, glass);   // the restaurant's big windows to the view
      for (const sa of [-1, 1]) B(sa * (Lb / 2 + 0.03), c0, y0 + 1.6, 0.1, 1.2, 3.2, glass);
      gable(g, ...(() => { const [x, z] = at(0, c0); return [x, y0 + 3.7, z]; })(), Lb + 1.6, Db + 2.2, 1.9, hrot, roofC, board);   // the low pitched roof (ridge along the house)
      B(12.5, -5.2, y0 + 3.75, 1.5, 1.45, 1.5, stone, stoneT);   // the chimney's stone stack (pkSummit6 stands its steel flue and smoke on it, at the visitor center's roof height)
      B(-3.4, c0 + Db / 2 + 0.06, y0, 2.2, 2.4, 0.12, [0.32, 0.2, 0.12]);   // the door, the porch roof on two posts over it
      B(-3.4, c0 + Db / 2 + 1.3, y0 + 2.75, 6, 0.18, 2.6, wood, roofC);
      for (const a of [-6, -0.8]) B(a, c0 + Db / 2 + 2.4, y0, 0.2, 2.75, 0.2, wood);
      B(0, c0 - Db / 2 - 2.2, y0 - 0.02, Lb - 2, 0.1, 4.2, [0.44, 0.33, 0.22]);   // the deck to the view, its rail
      B(0, c0 - Db / 2 - 4.2, y0 + 0.9, Lb - 2, 0.1, 0.12, wood); for (let k = -7; k <= 7; k++) B(k * 2.1, c0 - Db / 2 - 4.2, y0, 0.12, 1.0, 0.12, wood);
      for (const a of [-9, -3, 3, 9]) { B(a, c0 - Db / 2 - 2.2, y0 + 0.08, 1.8, 0.72, 0.8, [0.55, 0.42, 0.28]); }   // picnic tables
      { const yR = y0 + 3.7 + 1.9 * (1 - 4.1 / (Db / 2 + 1.1)), [x, z] = at(1.5, c0 + 4.1); tq(x, yR - 0.15, z, hnx, hnz, 17, 2.1, A.sh, 0.62); B(1.5, c0 + 3.9, yR - 0.25, 17.4, 0.3, 0.3, wood); }   // the name on the roof
      { const [x, z] = at(-3.4, c0 + Db / 2 + 2.62); tq(x, y0 + 2.94, z, hnx, hnz, 5, 1.25, A.don, 0.25); }   // the gift shop's board on the porch roof
      { const [x, z] = at(0, c0); CR.block(x, z, Lb + 2, Db + 9, hrot); }
    }

    /* ---- builders: a hay bale, an oil drum, a stretch of post-and-rail fence, the period cars, a timing hut, a road sign (the thin things, the drums, fences and
       tripods, cast no shadow: K.noShadow, in the ground's tiles, so they cost no draws and no shadow pass) ---- */
    const straw = [[0.8, 0.69, 0.4], [0.76, 0.64, 0.36], [0.84, 0.74, 0.46]], strawT = [0.88, 0.8, 0.54];
    const bale = (x, y, z, rot, e0, e1) => {   // 1.25 x 0.62, 0.52 high: its long sides and top (its neighbours in the row hide its ends; e0, e1: draw the end)
      const g = SG(x, z), c = Math.cos(rot), s = Math.sin(rot), P = (u, h, w) => [x + c * u - s * w, y + h, z + s * u + c * w], inn = [x, y + 0.26, z], col = vary(straw[Math.floor(R() * 3)], R, 0.08), H = 0.52, U = 0.625, W = 0.31;
      g.quadO(P(-U, 0, -W), P(U, 0, -W), P(U, H, -W), P(-U, H, -W), col, inn); g.quadO(P(-U, 0, W), P(U, 0, W), P(U, H, W), P(-U, H, W), col, inn); g.quadO(P(-U, H, -W), P(U, H, -W), P(U, H, W), P(-U, H, W), strawT, inn);
      if (e0) g.quadO(P(-U, 0, -W), P(-U, 0, W), P(-U, H, W), P(-U, H, -W), col, inn); if (e1) g.quadO(P(U, 0, -W), P(U, 0, W), P(U, H, W), P(U, H, -W), col, inn); st.bales++; };
    const drum = (x, z) => { const g = K.noShadow(x, z), y = gy(x, z) - 0.04, red = [0.74, 0.12, 0.1], wh = [0.92, 0.9, 0.86];
      cyl(g, x, y, z, 0.29, 0.31, 7, red); cyl(g, x, y + 0.31, z, 0.29, 0.27, 7, wh); cyl(g, x, y + 0.58, z, 0.29, 0.3, 7, red, [0.3, 0.08, 0.06]); st.drums++; };
    const beam = (g, a, b, w, h, col) => {   // a square bar from a to b (the fences' rails)
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[2]) || 1, s = [-d[2] / l * w / 2, 0, d[0] / l * w / 2], inn = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], P = (p, i, j) => [p[0] + s[0] * i, p[1] + j * h / 2, p[2] + s[2] * i];
      for (const [i0, j0, i1, j1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) g.quadO(P(a, i0, j0), P(a, i1, j1), P(b, i1, j1), P(b, i0, j0), col, inn); };
    const fence = (s0, s1, side, v) => {   // post-and-rail, v beyond the barrier line: posts every 2.6 m, two rails between neighbours that both stood
      let prev = null; const wd = [0.45, 0.37, 0.28];
      for (let s = s0; s <= s1; s += 2.6) { const q = crAt(s); if (!q) { prev = null; continue; }
        const o = (side > 0 ? q.br : q.bl) + v, x = q.px + q.nx * side * o, z = q.pz + q.nz * side * o;
        if (!ok(x, z, 2) || gy(x, z) < q.hy - 2.5) { prev = null; continue; }
        const y = gy(x, z), g = K.noShadow(x, z), c = vary(wd, R, 0.12); box(g, x, y - 0.25, z, 0.14, 1.4, 0.14, tang(q), c, null, true); st.fence++;
        if (prev) for (const h of [0.42, 0.92]) { const a = [prev[0], prev[1] + h, prev[2]], b = [x, y + h, z], d = [(a[0] + b[0]) / 2 + q.nx * side, (a[1] + b[1]) / 2 - 0.3, (a[2] + b[2]) / 2 + q.nz * side];   // a rail: its face to the road and its top
          g.quadO([a[0], a[1] - 0.07, a[2]], [b[0], b[1] - 0.07, b[2]], [b[0], b[1] + 0.07, b[2]], [a[0], a[1] + 0.07, a[2]], c, d);
          const ox = q.nx * side * 0.08, oz = q.nz * side * 0.08; g.quadO([a[0], a[1] + 0.07, a[2]], [b[0], b[1] + 0.07, b[2]], [b[0] + ox, b[1] + 0.07, b[2] + oz], [a[0] + ox, a[1] + 0.07, a[2] + oz], c, [a[0], a[1] - 1, a[2]]); }
        prev = [x, y, z]; } };
    const glass = [0.13, 0.15, 0.17], tyre = [0.08, 0.08, 0.09], cream = [0.86, 0.83, 0.74];
    const faded = [[0.62, 0.55, 0.42], [0.58, 0.3, 0.24], [0.4, 0.45, 0.32], [0.46, 0.54, 0.6], [0.55, 0.42, 0.28], [0.72, 0.7, 0.64], [0.36, 0.28, 0.22], [0.7, 0.55, 0.28], [0.5, 0.5, 0.48], [0.3, 0.38, 0.48], [0.62, 0.38, 0.22], [0.48, 0.2, 0.18]];
    const pcar = (x, z, rot, kind, col) => {   // 0 an estate (woodgrain sides now and then), 1 a pickup (some with a camper shell), 2 a camper van (two-tone), 3 a motorhome, 4 a boxy saloon; length along rot
      const g = SG(x, z), L = L4(x, z, rot), hl = [2.4, 2.55, 2.25, 3.6, 2.3][kind], y = lowest(x, z, rot, hl, 0.9) - 0.05;
      const Bx = (u, w, yb, lu, hy, lw, c, top) => { const [px, pz] = L(u, w); box(g, px, y + yb, pz, lu, hy, lw, rot, c, top, true); };
      if (kind === 0) { Bx(0, 0, 0.28, 4.7, 0.7, 1.76, col); Bx(-0.4, 0, 0.98, 3.1, 0.6, 1.62, glass, col); Bx(-0.5, 0, 1.58, 2.0, 0.07, 1.3, [0.16, 0.16, 0.17]);
        if (R() < 0.45) for (const w of [-0.89, 0.89]) Bx(-0.2, w, 0.42, 3.6, 0.36, 0.03, [0.42, 0.27, 0.15]); }
      else if (kind === 1) { Bx(0, 0, 0.36, 5.0, 0.74, 1.86, col); Bx(0.85, 0, 1.1, 1.6, 0.72, 1.76, glass, col);
        if (R() < 0.5) Bx(-1.25, 0, 1.1, 2.45, 0.68, 1.84, vary(cream, R, 0.1), vary(cream, R, 0.1)); else { for (const w of [-0.88, 0.88]) Bx(-1.25, w, 1.1, 2.4, 0.34, 0.1, col); Bx(-2.45, 0, 1.1, 0.1, 0.34, 1.86, col); } }
      else if (kind === 2) { Bx(0, 0, 0.3, 4.5, 0.86, 1.8, col); Bx(0, 0, 1.16, 4.45, 0.92, 1.78, cream, cream); Bx(-0.25, 0, 1.36, 3.5, 0.5, 1.82, glass); Bx(2.23, 0, 1.32, 0.04, 0.56, 1.5, glass);
        if (R() < 0.4) Bx(-0.3, 0, 2.08, 2.6, 0.32, 1.6, vary(cream, R, 0.08)); }   // a pop-top on some
      else if (kind === 3) { Bx(-0.5, 0, 0.4, 6.2, 2.5, 2.3, cream, [0.8, 0.79, 0.75]); Bx(-0.5, 0, 1.2, 6.22, 0.24, 2.32, col); Bx(-0.5, 0, 1.5, 6.22, 0.08, 2.32, vary(col, R, 0.3));
        Bx(3.0, 0, 0.4, 1.3, 1.35, 2.1, cream); Bx(3.62, 0, 1.0, 0.06, 0.62, 1.8, glass); Bx(2.75, 0, 1.75, 1.8, 0.95, 2.26, cream); Bx(-1.4, 0, 1.75, 1.5, 0.6, 2.34, glass); }
      else { Bx(0, 0, 0.3, 4.5, 0.68, 1.72, col); Bx(-0.25, 0, 0.98, 2.2, 0.56, 1.56, glass, col); }
      const ax = [[1.45, 1.4], [1.65, 1.7], [1.4, 1.35], [2.6, 1.9], [1.4, 1.35]][kind], half = kind === 3 ? 0.95 : 0.8;
      for (const u of kind === 3 ? [ax[0], -ax[1], -ax[1] - 0.75] : [ax[0], -ax[1]]) { const [px, pz] = L(u, 0); box(g, px, y, pz, 0.66, 0.62, half * 2 + 0.24, rot, tyre, null, true); }   // (a dark box per axle: its wheels)
      st.cars++; };
    const carKinds = [0, 0, 1, 1, 2, 2, 4, 4, 3];
    const parkRow = (sa, sb, side, nMax, vMax) => {   // spectators' cars parked along the road beyond the barrier where the ground is flat, nose to tail
      let n = 0; for (let s = sa; s < sb && n < nMax;) { const q = crAt(s); if (!q) break; const rot = tang(q) + (R() < 0.5 ? PI : 0), kind = carKinds[Math.floor(R() * carKinds.length)], hl = kind === 3 ? 3.9 : 2.8, bar = side > 0 ? q.br : q.bl;
        let done = false;
        for (let v = 2.6; v <= (vMax || 9) && !done; v += 0.7) { const x = q.px + q.nx * side * (bar + v), z = q.pz + q.nz * side * (bar + v);
          if (!fits(x, z, rot, hl + 0.2, 1.4) || pkSlope(x, z) > 0.3 || gy(x, z) < q.hy - 2.2 || gy(x, z) > q.hy + 2.5) continue;
          pcar(x, z, rot, kind, vary(faded[Math.floor(R() * faded.length)], R, 0.12)); ex(x, z, hl + 0.4); CR.block(x, z, hl * 2, 2.2, rot); n++; done = true; }
        s += done ? hl * 2 + 0.6 + R() * 2.5 : 1.5; }
      return n; };
    const hut = (x, z, rot, slot) => {   // a small timing hut: board walls, a window to the road, a tin roof, its board over the window; rot: the side facing the road is +w
      const g = SG(x, z), L = L4(x, z, rot), y = lowest(x, z, rot, 1.3, 1.1) - 0.1, wd = [0.5, 0.37, 0.24], fx = -Math.sin(rot), fz = Math.cos(rot);
      box(g, x, y, z, 2.5, 2.4, 2.1, rot, wd, null, true);
      { const [px, pz] = L(0.2, 1.06); box(g, px, y + 1.05, pz, 1.5, 0.72, 0.06, rot, [0.12, 0.13, 0.15], null, true); box(g, px, y + 0.98, pz + 0, 1.7, 0.08, 0.2, rot, [0.82, 0.78, 0.68], null, true); }   // the window, its sill
      { const [px, pz] = L(-1.26, 0.2); box(g, px, y, pz, 0.06, 1.95, 0.85, rot, [0.33, 0.22, 0.13], null, true); }   // the door
      gable(g, x, y + 2.4, z, 2.9, 2.6, 0.55, rot, [0.56, 0.57, 0.58], wd);
      { const [px, pz] = L(0, 1.08); tq(px, y + 1.87, pz, fx, fz, 2.3, 0.43, A.hut(slot), 0); }
      { const [px, pz] = L(0.3, 1.6); K.putPerson(px, pz, Math.atan2(fx, fz), [0.32, 0.34, 0.3]); }   // the timekeeper with a stopwatch, at the window
      ex(x, z, 2.4); CR.block(x, z, 2.9, 2.5, rot); st.huts++; };
    const spotNear = (sa, sb, sides, vs, hl, hw, rotF) => {   // the first spot that fits: [x, z, rot, q-frame values]
      for (let s = sa; s <= sb; s += 1) for (const side of sides) for (let v = vs[0]; v <= vs[1]; v += 0.5) { const q = crAt(s); if (!q) continue;
        const o = (side > 0 ? q.br : q.bl) + v, x = q.px + q.nx * side * o, z = q.pz + q.nz * side * o, rot = rotF(q, side);
        if (fits(x, z, rot, hl, hw) && pkSlope(x, z) < 0.45 && gy(x, z) > q.hy - 2) return { x, z, rot, side, s, fx: -q.nx * side, fz: -q.nz * side, tx: q.tx, tz: q.tz }; }
      return null; };
    const post = (g, x, y, z, h, col) => box(g, x, y - 0.3, z, 0.12, h + 0.3, 0.12, 0, col, null, true);
    const sign = (s0, side, kind) => {   // an old road sign beside the road at about s0, facing the cars coming up, leaning back so the high cameras read it
      const W = [3.2, 3.2, 1.25, 1.5, 1.5][kind], H = [1.6, 1.6, 1.55, 1.5, 1.5][kind], r = [A.pph, A.grv, A.spd, A.d1, A.d2][kind], tl = 0.5;
      const sp = spotNear(s0, s0 + 24, [side, -side], [W / 2 + 0.2, W / 2 + 2.5], W / 2 + 0.3, 0.45, (q) => Math.atan2(q.nz, q.nx)); if (!sp) return;
      const fx = -sp.tx * 0.955 + sp.fx * 0.296, fz = -sp.tz * 0.955 + sp.fz * 0.296, a = Math.atan2(fz, fx), ux = fz, uz = -fx, y = lowest(sp.x, sp.z, a, 0.4, W / 2), g = SG(sp.x, sp.z);   // (facing back down the road, turned a little to its middle; sp.fx: towards the road)
      const pc = kind === 0 ? [0.36, 0.25, 0.15] : [0.55, 0.56, 0.58], h0 = kind >= 3 ? 1.3 : 1.0, lx = H * Math.sin(tl);
      if (kind >= 3) {   // a diamond on one post: the quad's corners at the diamond's points
        const hd = H / Math.SQRT2 * 1.0, cx = sp.x, cz = sp.z, kx = -fx * Math.sin(tl), ky = Math.cos(tl), kz = -fz * Math.sin(tl), yc = y + h0 + hd * ky;
        post(g, cx - fx * (0.08 + hd * Math.sin(tl)), y, cz - fz * (0.08 + hd * Math.sin(tl)), h0 + hd * 1.6, pc);
        for (const f of [1, -1]) { const ox = fx * 0.03 * f, oz = fz * 0.03 * f, u = [ux * hd * f, 0, uz * hd * f], k = [kx * hd, ky * hd, kz * hd], c = [cx + ox, yc, cz + oz];
          const P = (i, j) => [c[0] + u[0] * i + k[0] * j, c[1] + k[1] * j, c[2] + u[2] * i + k[2] * j];
          face(P(0, -1), P(1, 0), P(0, 1), P(-1, 0), f > 0 ? r : A.back, [cx - fx * f, yc, cz - fz * f]); }
      } else {
        for (const o of [-W * 0.33, W * 0.33]) { const px = sp.x + ux * o, pz = sp.z + uz * o; post(g, px - fx * 0.1, y, pz - fz * 0.1, h0 + 0.3, pc); post(g, px - fx * (lx + 0.08), y, pz - fz * (lx + 0.08), h0 + H * Math.cos(tl) + 0.1, pc); }
        tq(sp.x, y + h0, sp.z, fx, fz, W, H, r, tl, kind === 0 ? r : A.back);
      }
      ex(sp.x, sp.z, W / 2 + 0.8); st.signs++; };
    const foto = (x, z, tx, tz) => { if (!ok(x, z)) return; const g = K.noShadow(x, z), y = gy(x, z), col = [[0.46, 0.42, 0.3], [0.24, 0.3, 0.42], [0.16, 0.17, 0.18], [0.36, 0.3, 0.22]][Math.floor(R() * 4)], ro = R() * PI;   // a photographer (film camera, a bag at his feet; no hi-vis then): khaki, denim or a dark jacket
      if (!K.putPerson(x, z, Math.atan2(tx - x, tz - z), col)) return; box(g, x + 0.45, y - 0.02, z + 0.3, 0.38, 0.26, 0.24, ro, [0.1, 0.1, 0.11], null, true);
      const d = Math.hypot(tx - x, tz - z) || 1, fx = (tx - x) / d, fz = (tz - z) / d, cx = x + fx * 0.55, cz = z + fz * 0.55, top = [cx, y + 1.42, cz], blk = [0.09, 0.09, 0.1];   // the camera on its tripod in front of him
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + ro; beam(g, [cx + Math.cos(a) * 0.32, y - 0.05, cz + Math.sin(a) * 0.32], top, 0.04, 0.04, [0.2, 0.2, 0.21]); }
      box(g, cx, y + 1.42, cz, 0.16, 0.13, 0.12, Math.atan2(fz, fx) + PI / 2, blk, null, true); box(g, cx + fx * 0.12, y + 1.44, cz + fz * 0.12, 0.12, 0.08, 0.08, Math.atan2(fz, fx), [0.16, 0.16, 0.17], null, true); st.foto++; };

    /* ---- the corners: hay bales stacked two high behind the barrier on the outside of the hairpins and the fast bends, red and white drums at their ends;
       a post-and-rail fence in front of the spectators on the inside of the hairpins, a photographer or two by it ---- */
    for (const c of T.corners) { const sm = (c.i0 + c.i1) / 2 * T.ds; if (sm < sStart + 60 || sm > sFin - 40) continue;
      const fast = c.sev === 1 && c.angle > 0.75; if (c.sev < 2 && !fast) continue;
      const side = -c.dir, len = c.sev === 3 ? 13 : 7, row = [];
      for (let s = sm - len; s <= sm + len; s += 1.29) { const q = crAt(s); if (!q) continue; const rot = tang(q), o = (side > 0 ? q.br : q.bl) + 2.15, x = q.px + q.nx * side * o, z = q.pz + q.nz * side * o;
        if (!fits(x, z, rot, 0.64, 0.32, 2) || gy(x, z) < q.hy - 1.4 || pkSlope(x, z) > 0.6) { row.push(null); continue; }
        row.push([x, lowest(x, z, rot, 0.62, 0.3) - 0.06, z, rot]); }
      const lay = (L) => L.forEach((b, k) => { if (b) bale(b[0], b[1], b[2], b[3], !L[k - 1], !L[k + 1]); });
      lay(row); if (c.sev === 3) lay(row.slice(0, -1).map((p, k) => { const q2 = row[k + 1]; return p && q2 ? [(p[0] + q2[0]) / 2, Math.max(p[1], q2[1]) + 0.51, (p[2] + q2[2]) / 2, (p[3] + q2[3]) / 2] : null; }));   // stacked two high at the hairpins
      const ends = row.filter(Boolean); if (ends.length > 3) for (const e of [ends[0], ends[ends.length - 1]]) { drum(e[0] + Math.cos(e[3]) * (e === ends[0] ? -1.1 : 1.1), e[2] + Math.sin(e[3]) * (e === ends[0] ? -1.1 : 1.1)); }
      if (ends.length) { const e = ends[ends.length - 1]; ex(e[0], e[2], 1.2); ex(ends[0][0], ends[0][2], 1.2); }
      if (c.sev === 3) { fence(sm - 15, sm + 15, c.dir, 1.75);
        for (const d of [-6, 7]) { const q = crAt(sm + d); if (!q) continue; const o = (c.dir > 0 ? q.br : q.bl) + 2.3; foto(q.px + q.nx * c.dir * o, q.pz + q.nz * c.dir * o, q.px, q.pz); } }
    }

    /* ---- the checkpoints and the finish: a timing hut beside the line, the fence in front of the spectators; at the finish the hand-written results board,
       the TV station's outside-broadcast van with its dish, photographers by the line ---- */
    [...T.cpS, sFin].forEach((s0, k) => {
      const sp = spotNear(s0 + 3, s0 + 22, [1, -1], [2.4, 6], 1.5, 1.35, (q, side) => Math.atan2(q.nx * side, -q.nz * side));   // (its +w, the window, towards the road)
      if (sp) hut(sp.x, sp.z, sp.rot, k);
      for (const side of [1, -1]) fence(s0 - 30, s0 - 2, side, 1.75);
    });
    { const F = (s, side, v) => { const q = crAt(s), o = (side > 0 ? q.br : q.bl) + v; return [q.px + q.nx * side * o, q.pz + q.nz * side * o, q]; };
      // the results board where the visitor center's monument stood: on two legs, leaning back a little, facing the arriving cars
      { const mon = st.mon || F(sFin + 17, -1, 6).slice(0, 2), q = crAt(sFin + 17), fx = -q.tx * 0.94 + q.nx * 0.34, fz = -q.tz * 0.94 + q.nz * 0.34, a = Math.atan2(fz, fx), ux = fz, uz = -fx, W = 4.4, H = 4.4, tl = 0.3;
        const x = mon[0], z = mon[1], y = lowest(x, z, a, 0.4, W / 2) - 0.05, g = SG(x, z), lx = H * Math.sin(tl);
        for (const o of [-W / 2 + 0.2, W / 2 - 0.2]) { const px = x + ux * o, pz = z + uz * o; box(g, px - fx * 0.1, y - 0.3, pz - fz * 0.1, 0.16, 1.2, 0.16, a, [0.42, 0.3, 0.2], null, true); box(g, px - fx * (lx + 0.06), y - 0.3, pz - fz * (lx + 0.06), 0.16, 0.9 + H * Math.cos(tl) + 0.3, 0.16, a, [0.42, 0.3, 0.2], null, true); }
        tq(x, y + 0.9, z, fx, fz, W, H, A.brd, tl, A.back); ex(x, z, 3); CR.block(x, z, 1.5, W + 0.6, a + PI / 2);
        for (let k = 0; k < 3; k++) { const px = x + fx * (2.2 + k * 0.5) + ux * (k - 1) * 1.2, pz = z + fz * (2.2 + k * 0.5) + uz * (k - 1) * 1.2; if (ok(px, pz)) K.putPerson(px, pz, Math.atan2(-fx, -fz) + (R() - 0.5) * 0.6, K.fans[Math.floor(R() * K.fans.length)]); } }
      // the TV van behind the finish crowd: a white box truck, the station's name on its sides, a dish on the roof aimed up at the sky, a cable reel
      { const sp = spotNear(sFin - 34, sFin + 6, [1, -1], [8, 15], 3.9, 1.6, (q) => Math.atan2(q.tz, q.tx));
        if (sp) { const g = SG(sp.x, sp.z), L = L4(sp.x, sp.z, sp.rot), y = lowest(sp.x, sp.z, sp.rot, 3.6, 1.2) - 0.05, wht = [0.9, 0.9, 0.88];
          const Bx = (u, w, yb, lu, hy, lw, c, top) => { const [px, pz] = L(u, w); box(g, px, y + yb, pz, lu, hy, lw, sp.rot, c, top, true); };
          Bx(-0.7, 0, 0.5, 5.6, 2.7, 2.35, wht, [0.82, 0.82, 0.8]); Bx(2.75, 0, 0.45, 1.7, 1.75, 2.2, wht); Bx(3.62, 0, 1.25, 0.05, 0.75, 1.9, glass); Bx(2.75, 0, 0.45, 1.72, 0.3, 2.22, [0.11, 0.25, 0.56]);
          Bx(-0.7, 0, 0.45, 5.62, 0.28, 2.37, [0.11, 0.25, 0.56]);
          for (const [u, w] of [[2.6, 1.0], [2.6, -1.0], [-2.3, 1.0], [-2.3, -1.0], [-1.4, 1.0], [-1.4, -1.0]]) { const [px, pz] = L(u, w); box(g, px, y, pz, 0.78, 0.78, 0.28, sp.rot, tyre, null, true); }
          { const [px, pz] = L(-1.6, 0); cyl(g, px, y + 3.2, pz, 0.12, 0.5, 6, [0.6, 0.6, 0.62]); const dx = -Math.sin(sp.rot) * -sp.side, dz = Math.cos(sp.rot) * -sp.side, el = 0.75, ax = [dx * Math.cos(el), Math.sin(el), dz * Math.cos(el)], c0 = [px, y + 4.35, pz];   // the dish: a shallow bowl 2.3 m across, aimed up over the road (its white face to the cameras)
            const e1 = [-dz, 0, dx], e2 = [ax[1] * dx, -(ax[2] * dz + ax[0] * dx), ax[1] * dz], rim = [], dc = [0.93, 0.93, 0.91], bc = [0.62, 0.63, 0.64];
            for (let k = 0; k < 10; k++) { const t = k / 10 * TAU, cs = Math.cos(t) * 1.15, sn = Math.sin(t) * 1.15; rim.push([c0[0] + e1[0] * cs + e2[0] * sn + ax[0] * 0.3, c0[1] + e2[1] * sn + ax[1] * 0.3, c0[2] + e1[2] * cs + e2[2] * sn + ax[2] * 0.3]); }
            for (let k = 0; k < 10; k++) { const a = rim[k], b = rim[(k + 1) % 10]; g.triO(c0, a, b, dc, [c0[0] - ax[0], c0[1] - ax[1], c0[2] - ax[2]]); g.triO(c0, a, b, bc, [c0[0] + ax[0], c0[1] + ax[1], c0[2] + ax[2]]); }
            box(g, px, y + 3.2, pz, 0.5, 1.15, 0.5, sp.rot, [0.5, 0.5, 0.52], null, true); beam(g, rim[0], [c0[0] + ax[0] * 1.1, c0[1] + ax[1] * 1.1, c0[2] + ax[2] * 1.1], 0.06, 0.06, [0.3, 0.3, 0.32]); }   // its mount, the feed arm
          { const [px, pz] = L(0.6, 0); box(g, px, y + 3.2, pz, 1.2, 0.35, 0.9, sp.rot, [0.7, 0.7, 0.7], null, true); }   // the air conditioner
          for (const f of [1, -1]) { const [px, pz] = L(-0.9, f * 1.19), nx = -Math.sin(sp.rot) * f, nz = Math.cos(sp.rot) * f; tq(px, y + 1.4, pz, nx, nz, 4.6, 1.15, A.tv, 0); }
          { const [px, pz] = L(-0.5, sp.side > 0 ? -2.3 : 2.3); if (ok(px, pz)) { const g2 = SG(px, pz); cyl(g2, px, gy(px, pz), pz, 0.45, 0.5, 8, [0.2, 0.2, 0.22], [0.6, 0.15, 0.1]); } }
          ex(sp.x, sp.z, 4.6); CR.block(sp.x, sp.z, 7.6, 2.8, sp.rot); st.tv = [Math.round(sp.s), sp.side];
          { const [px, pz] = L(1.0, (sp.side > 0 ? -1 : 1) * 2.0); K.putPerson(px, pz, sp.rot, [0.24, 0.3, 0.42]); } } }
      // photographers by the line, both sides, behind the barrier
      for (const [d, side] of [[2, 1], [4.5, -1], [6, 1], [8, -1], [10.5, 1]]) { const [x, z, q] = F(sFin + d, side, 1.9); foto(x, z, q.px - q.tx * 30, q.pz - q.tz * 30); }
    }

    /* ---- the old road signs: the highway's brown sign, GRAVEL ROAD NEXT 12 MILES and SPEED LIMIT 25 after the start, more 25s up the road, warning diamonds before the hairpins ---- */
    sign(sStart + 236, -1, 0); sign(sStart + 258, 1, 1); sign(sStart + 284, 1, 2);
    for (const d of [1500, 2900, 4300, 5500]) sign(sStart + d, 1, 2);
    { let k = 0; for (const c of T.corners) { if (c.sev < 3) continue; const sm = c.i0 * T.ds; if (sm < sStart + 300 || sm > sFin - 80) continue; if (k++ % 2) continue; sign(sm - 46, -c.dir, c.angle > 2.4 ? 4 : 3); } }

    /* ---- the spectators' cars and camper vans, parked along the road at the picnic grounds, Glen Cove, Devil's Playground and Boulder Park, and below the reservoir ---- */
    for (const [d, side, n] of [[120, -1, 5], [180, 1, 4], [950, 1, 6], [950, -1, 6], [1660, 1, 5], [1660, -1, 4], [2600, 1, 5], [2600, -1, 5], [3980, 1, 6], [3980, -1, 6], [5300, 1, 4], [5300, -1, 4]]) parkRow(sStart + d, sStart + d + 150, side, n);

    /* ---- the text: one atlas, one mesh ---- */
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; K.out.ownTex.push(tx);
    if (!tb.empty) { const m = new THREE.Mesh(tb.geometry(), new THREE.MeshLambertMaterial({ map: tx })); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'pkHistText'; root.add(m); }
  }

  /* ---- round 9: moving race-day machines: LED split boards (asphalt), the water truck and a grader, dust over the
     switchbacks (gravel). pkMovingUpdate runs every frame when out.dyn.pkMov is set ---- */
  function pkMoving(K) {
    const { excl, sStart, sFin, out, root, mk } = K, gy = pkGround, PI = Math.PI;
    // the scenery chunks are meshes already (this runs last): the ones these parts go into get their geometry again at the end (the same meshes, so the
    // shadow casters' list stays right); tc: chunk -> its vertex count before
    const tc = new Map(), scen = { get: (x, z) => { const g = K.scen.get(x, z); if (!tc.has(g)) tc.set(g, g.P.length / 3); return g; } };
    const reChunk = () => { const sg = root.children.find(o => o.isGroup && o.children.length && o.children[0].material === K.matV), used = new Set();
      for (const [g, n0] of tc) { if (g.P.length / 3 === n0) continue; const ng = g.geometry();
        let m = sg && n0 ? sg.children.find(o => !used.has(o) && o.geometry.attributes.position.count === n0 && o.geometry.attributes.position.array[0] === g.P[0] && o.geometry.attributes.position.array[2] === g.P[2]) : null;
        if (!m && sg) { m = new THREE.Mesh(new THREE.BufferGeometry(), K.matV); m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; sg.add(m); const C = out.dyn.pkOps && out.dyn.pkOps.cast; if (C) C.list.push([m, m.geometry.boundingSphere = new THREE.Sphere()]); }
        if (!m) continue; used.add(m);
        for (const a of ['position', 'normal', 'color', 'uv']) if (ng.attributes[a]) m.geometry.setAttribute(a, ng.attributes[a]);
        if (!m.geometry.boundingSphere) m.geometry.boundingSphere = new THREE.Sphere(); m.geometry.boundingSphere.copy(ng.boundingSphere); } };
    const mv = { mk, t: null, wx: out.dyn.pkWx || null, info: { boards: [], parked: [] } };
    // a local model (+x forward, y up from the ground) stamped into a GB turned by rot about y
    const stamp = (src, dst, x, y, z, rot) => { const c = Math.cos(rot), s = Math.sin(rot), P = src.P, N = src.N;
      for (let k = 0; k < P.length; k += 3) { dst.P.push(x + P[k] * c - P[k + 2] * s, y + P[k + 1], z + P[k] * s + P[k + 2] * c); dst.N.push(N[k] * c - N[k + 2] * s, N[k + 1], N[k] * s + N[k + 2] * c);
        if (dst.U) dst.U.push(0, 0); }
      if (dst.A) for (let k = 0; k < src.C.length; k += 3) dst.C.push(src.C[k], src.C[k + 1], src.C[k + 2], 1); else for (const v of src.C) dst.C.push(v); };
    const wheel = (g, x, y, z, r, w, col, hub) => {   // a wheel on an axle across the model (along z), 8 sides
      const inn = [x, y, z]; for (let k = 0; k < 8; k++) { const a0 = k / 8 * TAU, a1 = (k + 1) / 8 * TAU, p = (a, o) => [x + Math.cos(a) * r, y + Math.sin(a) * r, z + o];
        g.quadO(p(a0, -w / 2), p(a1, -w / 2), p(a1, w / 2), p(a0, w / 2), col, inn); for (const o of [-w / 2, w / 2]) g.triO([x, y, z + o], p(a0, o), p(a1, o), hub, [x, y, z - o]); } };
    const tank = (g, x0, x1, y, r, col, colE) => {   // a lying tank along x, 8 sides
      const inn = [(x0 + x1) / 2, y, 0]; for (let k = 0; k < 8; k++) { const a0 = (k + 0.5) / 8 * TAU, a1 = (k + 1.5) / 8 * TAU, p = (a, x) => [x, y + Math.sin(a) * r, Math.cos(a) * r];
        g.quadO(p(a0, x0), p(a1, x0), p(a1, x1), p(a0, x1), col, inn); g.triO([x0 - 0.12, y, 0], p(a0, x0), p(a1, x0), colE, inn); g.triO([x1 + 0.12, y, 0], p(a0, x1), p(a1, x1), colE, inn); } };
    const ptsMat = (vs, fs, U) => { const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, U]); return new THREE.ShaderMaterial({ uniforms: u, fog: true, transparent: true, depthWrite: false, vertexShader: vs, fragmentShader: fs }); };

    if (!mk) {
      /* ---- the asphalt: LED split boards past the checkpoints (no camera drones over the road: taken out at the player's wish) ---- */
      // the LED split boards ~55 m past each checkpoint, just beyond the barrier, turned to the oncoming car: a dark housing on two posts (in the scenery),
      // the screen (one 256 x 512 canvas: a 256 x 128 row per board, redrawn only when its text changes; unlit, so it glows at night)
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; const cx = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4; out.ownTex.push(tex);
      const sm = new THREE.MeshBasicMaterial({ map: tex, fog: true }), alts = T.cpS.map(s => String(Math.round(T.altAt ? T.altAt(T.hy[T.idx(s)]) : 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m');
      mv.cv = cx; mv.tex = tex; mv.alts = alts; mv.bd = [];
      const fitB = (x, z, ux, uz, hw) => { let lo = 1e9, hi = -1e9; for (const o of [-hw, 0, hw]) { const px = x + ux * o, pz = z + uz * o; if (pkNear(px, pz).dd < 1.5 || K.excluded(px, pz)) return null; const h = gy(px, pz); lo = Math.min(lo, h); hi = Math.max(hi, h); } return [lo, hi]; };
      T.cpS.forEach((s0, k) => {
        let best = null;
        for (let d = 0; d <= 40 && !best; d += 4) for (const sg of d ? [1, -1] : [1]) { const s = s0 + 55 + d * sg, q = crAt(s); if (!q) continue;
          for (const side of (q.br < q.bl ? [1, -1] : [-1, 1])) { if (best) break; for (const e of [2.6, 3.8, 5.2]) {
            const o = side * ((side > 0 ? q.br : q.bl) + e), x = q.px + q.nx * o, z = q.pz + q.nz * o; let fx = -q.tx * 0.55 - q.nx * side * 0.83, fz = -q.tz * 0.55 - q.nz * side * 0.83; const l = Math.hypot(fx, fz); fx /= l; fz /= l;
            const f = fitB(x, z, fz, -fx, 2.6); if (!f || f[1] - f[0] > 2.2 || Math.abs(f[1] - q.hy) > 4) continue; best = { x, z, fx, fz, lo: f[0], hy: Math.max(q.hy, f[1]), s }; break; } } }
        if (!best) return;
        const { x, z, fx, fz, lo } = best, ux = fz, uz = -fx, y0 = best.hy + 1.7, W = 4.8, Hh = 2.4, g = scen.get(x, z), rot = Math.atan2(fz, fx);
        for (const o of [-1.7, 1.7]) box(g, x + ux * o - fx * 0.12, lo - 0.3, z + uz * o - fz * 0.12, 0.16, y0 - lo + 0.4, 0.16, rot, [0.3, 0.31, 0.33], null, true);
        box(g, x, y0 - 0.14, z, 0.3, Hh + 0.3, W + 0.3, rot, [0.08, 0.08, 0.09], [0.12, 0.12, 0.13]);
        box(g, x - fx * 0.05, y0 + Hh + 0.16, z - fz * 0.05, 0.42, 0.1, W + 0.5, rot, [0.86, 0.12, 0.1], null);   // (a red cap)
        excl.push({ x, z, r: 3 });
        const v0 = 1 - (k + 1) / 4, v1 = 1 - k / 4, cX = x + fx * 0.16, cZ = z + fz * 0.16, hw = W / 2;
        const sg = new THREE.BufferGeometry();
        sg.setAttribute('position', new THREE.Float32BufferAttribute([cX - ux * hw, y0, cZ - uz * hw, cX + ux * hw, y0, cZ + uz * hw, cX + ux * hw, y0 + Hh, cZ + uz * hw, cX - ux * hw, y0 + Hh, cZ - uz * hw], 3));
        sg.setAttribute('uv', new THREE.Float32BufferAttribute([0, v0, 1, v0, 1, v1, 0, v1], 2)); sg.setIndex([0, 1, 2, 0, 2, 3]); sg.computeBoundingSphere();
        const m = new THREE.Mesh(sg, sm); m.name = 'pkSplitBoard'; m.matrixAutoUpdate = false; root.add(m);
        mv.bd[k] = { key: '', t0: -1 }; mv.info.boards.push({ k, s: Math.round(best.s), x: +x.toFixed(1), z: +z.toFixed(1) });
      });
      mv.draw = (k, a, b, bc) => {   // board k's row: line a (white or amber), line b in colour bc, then the LED dot grid over it
        const c = mv.cv, y = k * 128; c.fillStyle = '#050607'; c.fillRect(0, y, 256, 128);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 50px Arial, sans-serif'; c.fillStyle = bc ? '#f4f4ee' : '#ffb21e'; c.fillText(a, 128, y + 38, 236);
        c.font = '900 44px Arial, sans-serif'; c.fillStyle = bc || '#ffb21e'; c.fillText(b, 128, y + 92, 236);
        c.fillStyle = 'rgba(0,0,0,0.5)'; for (let q = 0; q < 256; q += 4) c.fillRect(q, y, 1, 128); for (let q = 0; q < 128; q += 4) c.fillRect(0, y + q, 256, 1);
        c.fillStyle = '#1b1c1f'; c.fillRect(0, y, 256, 3); c.fillRect(0, y + 125, 256, 3); mv.tex.needsUpdate = true; };
      mv.bd.forEach((b, k) => { if (b) { b.key = 'i'; mv.draw(k, 'CP' + (k + 1), alts[k], null); } });
    } else {
      /* ---- the gravel road (the historic race): a water truck and road graders parked at pull-offs, the truck spraying the verge; another truck
         driving slowly down the road while the course is closed before the start (the flyover: 160-460 m past the start line); the dust hanging over the switchbacks ---- */
      // the period tanker lorry (~8.4 m): a yellow cab, a grey tank, the spray bar at the back
      const wt = new GB(), YC = [0.92, 0.66, 0.1], TY = [0.07, 0.07, 0.08], HUB = [0.5, 0.5, 0.52], DK = [0.16, 0.16, 0.17], TK = [0.68, 0.7, 0.72], GL = [0.14, 0.18, 0.24];
      for (const x of [2.7, -1.5, -2.8]) for (const z of [-0.95, 0.95]) wheel(wt, x, 0.5, z, 0.5, 0.36, TY, HUB);
      box(wt, -0.3, 0.62, 0, 7.6, 0.32, 1.0, 0, DK);
      box(wt, 3.1, 0.82, 0, 1.7, 1.1, 2.3, 0, YC); box(wt, 2.95, 1.92, 0, 1.4, 0.82, 2.2, 0, GL, YC); box(wt, 2.95, 2.74, 0, 1.45, 0.12, 2.25, 0, YC);
      box(wt, 4.02, 0.72, 0, 0.12, 0.72, 2.0, 0, [0.62, 0.62, 0.6]); box(wt, 4.0, 0.5, 0, 0.2, 0.2, 2.35, 0, [0.3, 0.3, 0.3]);
      tank(wt, -3.7, 1.95, 1.95, 1.0, TK, [0.58, 0.6, 0.62]); for (const x of [-2.6, -0.6, 1.4]) box(wt, x, 0.88, 0, 0.14, 2.12, 2.06, 0, [0.3, 0.31, 0.32]);
      box(wt, -0.85, 2.9, 0, 0.7, 0.18, 0.7, 0, [0.5, 0.52, 0.54]);   // (the filler hatch)
      for (const x of [-2.15, 2.7]) box(wt, x, 1.0, 0, 1.5, 0.12, 2.3, 0, DK);   // (mudguards)
      box(wt, -3.95, 0.55, 0, 0.14, 0.14, 2.5, 0, [0.25, 0.25, 0.26]);   // (the spray bar)
      // the motor grader (~8.6 m): a long yellow frame from the cab over the tandem to the front axle, the blade under its middle
      const gr = new GB(), GY = [0.93, 0.7, 0.08];
      for (const x of [-3.1, -1.8]) for (const z of [-1.0, 1.0]) wheel(gr, x, 0.62, z, 0.62, 0.42, TY, HUB);
      for (const z of [-0.95, 0.95]) wheel(gr, 3.6, 0.62, z, 0.62, 0.4, TY, HUB);
      box(gr, -2.75, 0.9, 0, 1.9, 1.15, 1.6, 0, GY); box(gr, -1.25, 1.1, 0, 1.3, 0.9, 1.7, 0, GY); box(gr, -1.25, 2.0, 0, 1.2, 1.15, 1.6, 0, GL, GY); box(gr, -1.25, 3.15, 0, 1.6, 0.12, 1.9, 0, GY);
      box(gr, 1.2, 1.55, 0, 4.9, 0.45, 0.5, 0, GY); box(gr, 3.6, 1.0, 0, 0.5, 0.75, 1.6, 0, GY); box(gr, -3.65, 0.9, 0, 0.3, 0.6, 1.4, 0, DK);
      box(gr, 0.5, 0.08, 0, 0.3, 0.62, 3.7, 0.38, [0.36, 0.36, 0.38]); box(gr, 0.5, 0.65, 0, 0.8, 0.9, 0.2, 0, DK);   // (the blade on its ring)
      // pull-offs: a level spot a little beyond the barrier, above the treeline (no tree stands there), off the crowded places (the hairpins, the W's, the ridge, the checkpoints)
      const busy = (s) => s < sStart + 150 || s > sFin - 120 || T.cpS.some(c => Math.abs(s - c) < 60) || (s > sStart + 2600 && s < sStart + 3460) || (s > sStart + 3680 && s < sStart + 4480) || T.corners.some(c => c.sev >= 3 && Math.abs(s - (c.i0 + c.i1) / 2 * T.ds) < 40);
      const fit = (x, z, rot, L, W, hy) => { const c = Math.cos(rot), s = Math.sin(rot); let lo = 1e9, hi = -1e9;
        for (const a of [-0.5, -0.25, 0, 0.25, 0.5]) for (const b of [-0.5, 0, 0.5]) { const px = x + c * a * L - s * b * W, pz = z + s * a * L + c * b * W;
          if (pkNear(px, pz).dd < 1.5 || K.excluded(px, pz)) return null; const h = gy(px, pz); if (h < pkTreeline(px, pz) + 8) return null; lo = Math.min(lo, h); hi = Math.max(hi, h); }
        return hi - lo < 0.8 && Math.abs(hi - hy) < 3.5 ? [lo, hi] : null; };
      const pull = (s0, s1, L, W) => { let b = null, bo = 1e9;   // (the one nearest the road: in view)
        for (let s = s0; s < s1; s += 4) { if (busy(s)) continue; const q = crAt(s); if (!q) continue;
          for (const side of [1, -1]) for (const e of [0.4, 1.4, 2.6]) { const ob = (side > 0 ? q.br : q.bl) + 1.5 + e + W / 2; if (ob >= bo) continue;
            const o = side * ob, x = q.px + q.nx * o, z = q.pz + q.nz * o, rot = Math.atan2(q.tz, q.tx), f = fit(x, z, rot, L, W, q.hy);
            if (f) { bo = ob; b = { x, z, rot, y: (f[0] + f[1]) / 2 - 0.12, s, side, nx: q.nx * side, nz: q.nz * side }; } } }
        return b; };
      const park = (src, p, flip, L) => { if (!p) return; const rot = p.rot + (flip ? PI : 0), c = Math.cos(rot), s = Math.sin(rot); stamp(src, scen.get(p.x, p.z), p.x, p.y, p.z, rot); excl.push({ x: p.x, z: p.z, r: L / 2 + 1 }); mv.info.parked.push({ s: Math.round(p.s), x: +p.x.toFixed(1), z: +p.z.toFixed(1) }); return [c, s]; };
      const pw = pull(sStart + 1900, sStart + 2600, 9, 3) || pull(sStart + 4480, sStart + 5300, 9, 3), g1 = pull(sStart + 3460, sStart + 3680, 9, 3.8) || pull(sStart + 4480, sStart + 5000, 9, 3.8), g2 = pull(sStart + 5000, sFin - 150, 9, 3.8);
      const wd = park(wt, pw, false, 9); park(gr, g1, true, 9); park(gr, g2, false, 9);
      // the moving truck (its own mesh; shown only while the car waits on the grid): down the road from 460 m to 160 m past the start, 2.5 m/s
      const tm = new THREE.Mesh(wt.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); tm.name = 'pkWaterTruck'; tm.visible = false; tm.castShadow = true; tm.matrixAutoUpdate = false; root.add(tm);
      // spray (two emitters: the parked truck's bar onto the verge, the moving one's across the road behind it) and the dust over the switchbacks: one Points
      const NS = 80, ND = 160, np = NS * 2 + ND, pp = new Float32Array(np * 3), pk = new Float32Array(np * 4), R = rng(9661);
      for (let k = 0; k < NS * 2; k++) { pk[k * 4] = k < NS ? 0 : 1; pk[k * 4 + 1] = R(); pk[k * 4 + 2] = R() * 2 - 1; pk[k * 4 + 3] = R(); }
      for (let k = NS * 2; k < np; k++) { pk[k * 4] = 2; pk[k * 4 + 1] = -1e6; pk[k * 4 + 2] = R(); pk[k * 4 + 3] = R(); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('aK', new THREE.BufferAttribute(pk, 4)); pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      const pU = { uT: { value: 0 }, uS: { value: 400 }, uL: { value: 1 }, uE: { value: new THREE.Vector2() }, uN0: { value: new THREE.Vector4() }, uD0: { value: new THREE.Vector4() }, uN1: { value: new THREE.Vector4() }, uD1: { value: new THREE.Vector4() }, uW: { value: new THREE.Vector2(Math.cos(2.2), Math.sin(2.2)) } };
      const pm = ptsMat('uniform float uT, uS, uL; uniform vec2 uE, uW; uniform vec4 uN0, uD0, uN1, uD1; attribute vec4 aK; varying vec4 vC; varying float vFd, vK;\n' +
        'void main() { vec3 p; float sz, a; vec3 col; vK = aK.x;\n' +
        '  if (aK.x < 1.5) { bool e1 = aK.x > 0.5; vec4 N = e1 ? uN1 : uN0, D = e1 ? uD1 : uD0;\n' +   // spray: N the bar's middle (w: on), D.xz out of the bar, D.w its half length; the bar runs across D
        '    float life = 1.0, u = fract(uT / life + aK.y), age = u * life; vec2 ac = vec2(-D.z, D.x);\n' +
        '    p = N.xyz + vec3(ac.x, 0.0, ac.y) * aK.z * D.w + vec3(D.x, 0.0, D.z) * age * (3.4 + 2.6 * aK.w) + vec3(0.0, age * (1.2 + 0.8 * aK.w) - 4.9 * age * age * 0.55, 0.0);\n' +
        '    sz = 0.16 + 0.75 * u; a = N.w * 0.6 * smoothstep(0.0, 0.08, u) * (1.0 - u) * step(N.y - 0.7, p.y); col = vec3(0.86, 0.9, 0.95) * uL;\n' +
        '  } else {\n' +   // the dust: a puff left where the car went by (aK.y: when), growing, rising a little and drifting for ~22 s
        '    float age = uT - aK.y, u = clamp(age / 22.0, 0.0, 1.0);\n' +
        '    p = position + vec3(uW.x, 0.0, uW.y) * age * (0.45 + 0.3 * aK.z) + vec3(sin(age * 0.21 + aK.z * 6.3), 0.0, cos(age * 0.17 + aK.w * 6.3)) * 1.5 * u; p.y += 2.6 * sqrt(u);\n' +
        '    sz = (4.5 + 3.0 * aK.w) * (0.55 + 1.3 * sqrt(u)); a = (age > 0.0 && age < 22.0 ? 1.0 : 0.0) * 0.2 * smoothstep(0.0, 1.5, age) * (1.0 - smoothstep(10.0, 22.0, age)); col = vec3(0.86, 0.77, 0.63) * uL;\n' +
        '  }\n' +
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0); vFd = -mv.z; a *= smoothstep(3.0, 9.0, vFd); vC = vec4(col, a);\n' +
        '  gl_PointSize = a > 0.003 ? clamp(sz * uS / max(1.0, vFd), 1.5, 220.0) : 0.0; gl_Position = projectionMatrix * mv; }',
        'uniform vec3 fogColor; uniform float fogNear, fogFar; varying vec4 vC; varying float vFd, vK;\n' +
        'void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; float a = vK > 1.5 ? (1.0 - r) * (1.0 - r) * (1.0 - r) : smoothstep(1.0, 0.3, r);\n' +
        '  gl_FragColor = vec4(mix(vC.rgb, fogColor, smoothstep(fogNear, fogFar, vFd)), vC.a * a); }', pU);
      const pts = new THREE.Points(pg, pm); pts.frustumCulled = false; pts.renderOrder = 7; pts.matrixAutoUpdate = false; pts.name = 'pkSpray'; root.add(pts);
      const U = pm.uniforms;
      pts.onBeforeRender = (r, sc, cam) => { U.uS.value = r.domElement.height * cam.projectionMatrix.elements[5] / 2; const f = sc.fog ? sc.fog.color : null; U.uL.value = f ? clamp((f.r * 0.3 + f.g * 0.55 + f.b * 0.15) * 1.35, 0.14, 1) : 1; };
      if (pw && wd) { const bx = pw.x - wd[0] * 3.95, bz = pw.z - wd[1] * 3.95; U.uN0.value.set(bx + pw.nx * 0.6, pw.y + 0.6, bz + pw.nz * 0.6, 1); U.uD0.value.set(pw.nx * 0.8 - wd[0] * 0.6, 0, pw.nz * 0.8 - wd[1] * 0.6, 1.2); }   // (out to the verge and back)
      // the switchbacks: the W's and every hairpin (+- 45 m)
      const zs = [[sStart + 2880, sStart + 3440]]; for (const c of T.corners) if (c.sev >= 3) { const sm = (c.i0 + c.i1) / 2 * T.ds; zs.push([sm - 45, sm + 45]); }
      Object.assign(mv, { tm, pts, U, pg, pp, pk, NS, ND, dk: 0, zs, lx: null, lz: 0, tw: new THREE.Matrix4(), tq: new THREE.Quaternion(), te: new THREE.Euler(0, 0, 0, 'YXZ'), tv: new THREE.Vector3(), t1: new THREE.Vector3(1, 1, 1) });
    }
    reChunk();
    out.pkMovInfo = mv.info;   // (where things went: the screenshot tools)
    out.dyn.pkMov = mv;
  }
  function pkMovingUpdate(mv, t, car) {
    const cj = !!car && mv.cx != null && (car.x - mv.cx) ** 2 + (car.z - mv.cz) ** 2 > 1600; if (car) { mv.cx = car.x; mv.cz = car.z; }   // (the car jumped: a rescue, a restart, the replay's seek)
    const dt = mv.t == null ? 0 : clamp(t - mv.t, 0, 0.25), jump = cj || mv.t == null || t < mv.t || t - mv.t > 1.5; mv.t = t;
    const s = car && car.q ? car.q.s : -1e9, gy = pkGround;
    if (!mv.mk) {
      // the split boards: for ~8 s after the car passed its checkpoint (and while it is not 450 m on), its time there and the difference to the class best (game.js: mv.best)
      for (let k = 0; k < mv.bd.length; k++) { const b = mv.bd[k]; if (!b) continue;
        const sp = car && car.splits ? car.splits[k] : NaN, on = car && sp >= 0 && s >= T.cpS[k] && s < T.cpS[k] + 450;
        if (!on) b.t0 = -1; else if (b.t0 < 0 || b.t0 > t) b.t0 = t;
        const show = on && t - b.t0 < 8, bs = mv.best && mv.best[k] > 0 ? mv.best[k] : NaN, d = sp - bs, key = show ? 's' + sp + '|' + bs : 'i';
        if (key === b.key) continue; b.key = key;
        if (!show) { mv.draw(k, 'CP' + (k + 1), mv.alts[k], null); continue; }
        const m = Math.floor(sp / 60), tt = m + ':' + (sp - m * 60).toFixed(2).padStart(5, '0');
        mv.draw(k, 'CP' + (k + 1) + ' ' + tt, isFinite(d) ? (d < 0 ? '−' : '+') + Math.abs(d).toFixed(2) : '–', isFinite(d) ? (d < 0 ? '#3cf36c' : '#ff4a3a') : '#f4f4ee');
      }
      return;
    }
    // gravel: the parked truck sprays (a few seconds on, a few off), the moving one only before the start
    const U = mv.U; U.uT.value = t;
    U.uN0.value.w = U.uD0.value.w > 0 && Math.sin(t * 0.35) > -0.55 ? 1 : 0;
    const pre = !!car && s < T.startS + 2 && car.locked !== false && Math.hypot(car.vx || 0, car.vz || 0) < 1 && !(car.cp > 0);   // (on the grid before the green light: the flyover, the intro)
    if (pre) { const sm = T.startS + 160 + (300 - (t * 2.5) % 300), q = crAt(sm); if (q) {
      const fx = -q.tx, fz = -q.tz, o = 2.6, x = q.px + q.nx * o, z = q.pz + q.nz * o, ya = Math.atan2(fz, fx), qa = crAt(sm + 3), qb = crAt(sm - 3), pit = qa && qb ? Math.atan2(qa.hy - qb.hy, 6) : 0;
      mv.te.set(0, -ya, -pit); mv.tq.setFromEuler(mv.te); mv.tw.compose(mv.tv.set(x, q.hy + 0.02, z), mv.tq, mv.t1); mv.tm.matrix.copy(mv.tw); mv.tm.matrixWorldNeedsUpdate = true;
      U.uN1.value.set(x - fx * 4.0, q.hy + 0.55, z - fz * 4.0, 1); U.uD1.value.set(-fx * 0.7, 0, -fz * 0.7, 1.5); } }
    mv.tm.visible = pre; if (!pre) U.uN1.value.w = 0;
    if (!car) { mv.tm.matrix.identity(); mv.tm.matrixWorldNeedsUpdate = true; return; }   // (no car: the moving truck put away, so the world's fingerprint does not depend on the last view)
    // the dust over the switchbacks: a puff every 5 m the car drives through one fast on the dry road (not in the rain, not in winter, not in a flurry)
    if (!car) return;
    const dx = car.x - mv.lx, dz = car.z - mv.lz, d2 = mv.lx == null ? 1e9 : dx * dx + dz * dz;
    if (d2 > 900) { mv.lx = car.x; mv.lz = car.z; return; }
    if (d2 < 25) return;
    mv.lx = car.x; mv.lz = car.z;
    const E = mv.wx && mv.wx.env || {}, dry = !(E.r > 0.02) && !E.win && !(mv.wx && mv.wx.fl > 0.1), spd = Math.hypot(car.vx || 0, car.vz || 0);
    if (!dry || spd < 7 || !mv.zs.some(z => s > z[0] && s < z[1])) return;
    const k = mv.NS * 2 + (mv.dk++ % mv.ND), j = (k * 0.618) % 1;
    mv.pp[k * 3] = car.x + (j - 0.5) * 3; mv.pp[k * 3 + 1] = (car.roadY || car.y || 0) + 0.6; mv.pp[k * 3 + 2] = car.z + (((k * 0.414) % 1) - 0.5) * 3; mv.pk[k * 4 + 1] = t;
    mv.pg.attributes.position.needsUpdate = true; mv.pg.attributes.aK.needsUpdate = true;
  }

  function buildPikes(scene, tex, opts) {
    const R = rng(7311), N = T.N, w = T.w, dens = opts.density || 1;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: pkGround, camFloor: pkGround, props: [], farClip: true, ownTex: [] };   // (farClip: nothing past the fog is drawn; it is all fog colour there anyway)
    pkPrep();
    const P = PK, iE = N - 1, sStart = T.startS, sFin = T.finishS;
    // flat ground: the paddock below the start, the car park at the summit (behind the road's end), the summit house's plot
    P.pads.push({ x: T.px[0] - T.tx[0] * 18, z: T.pz[0] - T.tz[0] * 18, r: 30, h: T.hy[0] - 0.3 });
    const padE = { x: T.px[iE] + T.tx[iE] * 30, z: T.pz[iE] + T.tz[iE] * 30, r: 28, b: 36, h: T.hy[iE] - 0.3 }; P.pads.push(padE);
    const padH = (() => { const i = T.idx(sFin + 44), lat = -(T.bl[i] + 4 + 7.5); return { i, lat, x: T.px[i] + T.nx[i] * lat, z: T.pz[i] + T.nz[i] * lat, r: 19, h: T.hy[i] - 0.3 }; })(); P.pads.push(padH);   // the summit house, left of the road after the line
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [];   // tree exclusion circles (landmarks, crowds)
    const excluded = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };

    /* ---- terrain tiles (their meshes are made at the end: the verge and the far scenery that casts no shadow are merged into them, no draw calls of their own) ---- */
    let nFar = 0;   // coarse outer tiles
    const tMat = pkGroundMat();   // terrain tiles (and the verge in them)
    const tiles = [], flat = new Map();   // [ti, tj, st] of every tile; per tile: [textured GB (the verge), plain GB (far scenery)]
    const flatAt = (x, z) => { const G = P.G, L = PKT * PKC, k = clamp(Math.floor((z - G.z0) / L), 0, G.ntz - 1) * G.ntx + clamp(Math.floor((x - G.x0) / L), 0, G.ntx - 1); let f = flat.get(k); if (!f) flat.set(k, f = [new GB(true), new GB()]); return f; };
    const noShadow = (x, z) => flatAt(x, z)[1];   // a GB for scenery that casts no shadow (drawn in the ground's material, which casts none: colours as in matV)
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = pkTileOn(ti, tj); if (!on) continue; if (on !== 2) G.on[tj * G.ntx + ti] = 1; else nFar++;   // (G.on: the full tiles, which get the forest)
        const st = on === 1 ? 1 : 2; G.st[tj * G.ntx + ti] = st; tiles.push([ti, tj, st]);
      }
      // the reservoir far below in the valley
      const L = P.lk, wg = new THREE.CircleGeometry(1, 40); wg.rotateX(-Math.PI / 2); wg.scale(L.rx * 1.04, 1, L.rz * 1.04); wg.translate(L.x, L.y, L.z);
      const uvw = wg.attributes.uv; for (let k = 0; k < uvw.count; k++) uvw.setXY(k, uvw.getX(k) * L.rx / 12, uvw.getY(k) * L.rz / 12);
      const lake = new THREE.Mesh(wg, waterMat(tex, { color: 0x3a7fc0, len: 2, refl: 0.45, land: 0.5 })); lake.receiveShadow = true; lake.matrixAutoUpdate = false; lake.updateMatrix(); root.add(lake); out.dyn.water = tex.water;
    }

    /* ---- road: asphalt with its paint (double yellow centre line, white edge lines, the checkpoints' lines) in one mesh, a strip of gravel, then the verge
       (ground-coloured, in the terrain tiles) out to the barriers (150 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    // draping thin layers exactly onto a triangulated surface: a convex polygon of points [x, z, lift, r, g, b(, u, v)] is cut at one of the surface's triangles A ([x, y, z] x 3;
    // Sutherland-Hodgman in x-z, the rest interpolated along) and each piece laid on A's plane (or hAt(x, z)) + its lift; returns the vertices added
    const planeY = (A, x, z, any) => {   // the height of triangle A's plane at (x, z); null outside it (unless any)
      const d = (A[1][2] - A[2][2]) * (A[0][0] - A[2][0]) + (A[2][0] - A[1][0]) * (A[0][2] - A[2][2]); if (!d) return null;
      const l1 = ((A[1][2] - A[2][2]) * (x - A[2][0]) + (A[2][0] - A[1][0]) * (z - A[2][2])) / d, l2 = ((A[2][2] - A[0][2]) * (x - A[2][0]) + (A[0][0] - A[2][0]) * (z - A[2][2])) / d, l3 = 1 - l1 - l2;
      return any || (l1 > -1e-4 && l2 > -1e-4 && l3 > -1e-4) ? l1 * A[0][1] + l2 * A[1][1] + l3 * A[2][1] : null;
    };
    const drape = (g, poly, A, hAt) => {
      const sg = Math.sign((A[1][0] - A[0][0]) * (A[2][2] - A[0][2]) - (A[1][2] - A[0][2]) * (A[2][0] - A[0][0])); if (!sg) return 0;
      for (let e = 0; e < 3 && poly.length > 2; e++) { const pa = A[e], pb = A[(e + 1) % 3], ex = pb[0] - pa[0], ez = pb[2] - pa[2], side = (p) => sg * (ex * (p[1] - pa[2]) - ez * (p[0] - pa[0])), np = [];
        for (let k = 0; k < poly.length; k++) { const p = poly[k], q = poly[(k + 1) % poly.length], dp = side(p), dq = side(q);
          if (dp >= 0) np.push(p); if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); np.push(p.map((v, m) => v + (q[m] - v) * t)); } }
        poly = np.filter((p, k) => { const q = np[(k + 1) % np.length]; return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) > 1e-5; }); }
      if (poly.length < 3) return 0;
      let ar = 0; for (let k = 1; k + 1 < poly.length; k++) ar += Math.abs((poly[k][0] - poly[0][0]) * (poly[k + 1][1] - poly[0][1]) - (poly[k][1] - poly[0][1]) * (poly[k + 1][0] - poly[0][0]));
      if (ar < 2e-5) return 0;
      const pts = poly.map(p => [p[0], (hAt ? hAt(p[0], p[1]) : planeY(A, p[0], p[1], 1)) + p[2], p[1]]), cs = poly.map(p => [p[3], p[4], p[5]]), us = poly[0].length > 6 ? poly.map(p => [p[6], p[7]]) : null, dn = [pts[0][0], pts[0][1] - 5, pts[0][2]];
      for (let k = 1; k + 1 < pts.length; k++) g.triO(pts[0], pts[k], pts[k + 1], cs[0], dn, cs[k], cs[k + 1], us && us[0], us && us[k], us && us[k + 1]);
      return (pts.length - 2) * 3;
    };
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    aMat.onBeforeCompile = (sh) => {   // the paint (attribute paint = 1) takes its vertex colour only, without the asphalt's grain (faded paint 0.5-1: some grain; patches 0.02, asphalt 0);
      // from the raw uv (lateral offset (o + w) / 8, s / 8; the vertex shader is highp): the asphalt polished lighter in the wheel tracks of each lane (the wear varying along the road), a darker edge outside the white line
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float paint;\nvarying float vPaint;\nvarying vec2 vRd;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaint = paint;\n' +
        'float pkS = uv.y * 8.0;\nvRd = vec2( uv.x * 8.0 - 7.0, clamp( 0.45 + 0.35 * sin( pkS * 0.0213 + 1.3 ) + 0.3 * sin( pkS * 0.0571 + 0.4 ), 0.0, 1.0 ) );');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPaint;\nvarying vec2 vRd;').replace('#include <map_fragment>',
        '#ifdef USE_MAP\n  vec4 texelColor = mapTexelToLinear( texture2D( map, vUv ) );\n  diffuseColor *= mix( texelColor, vec4( 1.0 ), vPaint );\n#endif\n' +
        'float pkO = abs( vRd.x ), pkT = exp( -pow( ( pkO - 2.6 ) * 1.9, 2.0 ) ) + exp( -pow( ( pkO - 4.4 ) * 1.9, 2.0 ) );\n' +
        'diffuseColor.rgb *= 1.0 + ( 1.0 - step( 0.01, vPaint ) ) * 0.24 * pkT * vRd.y - ( 1.0 - step( 0.03, vPaint ) ) * 0.42 * smoothstep( 6.73, 6.84, pkO );');
    };
    aMat.customProgramCacheKey = () => 'pkRoad';
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    // the historic gravel road (def.roadSurface 'makadam': 'pikesg', the Highway as it was until 2011): the same road mesh, in a material of its own: the gravel
    // picture (an own copy of the texture: the season code keeps it uncovered, like the asphalt, and the rain darkens it: userData.wear) half greyed, the pink of
    // the granite from the vertex colours; from the raw uv (lateral offset, s; the vertex shader is highp): two packed wheel ruts in each lane, smoother and
    // darker, wandering a little; a windrow of loose stones along each edge; washboard ripples across the road in stretches. No paint but the checkpoints'
    const mk = T.def.roadSurface === 'makadam';
    let gMat = null;
    if (mk) {
      const gT = tex.makadam.clone(); gT.needsUpdate = true; out.ownTex.push(gT);
      gMat = new THREE.MeshPhongMaterial({ map: gT, bumpMap: tex.makadamBump, bumpScale: 0.05, shininess: 4, specular: 0x14110d, vertexColors: true }); gMat.userData.wear = true;
      gMat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float paint;\nvarying float vPaint;\nvarying vec2 vRd;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaint = paint;\nvRd = vec2( uv.x * 8.0 - 7.0, uv.y * 8.0 );');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPaint;\nvarying vec2 vRd;').replace('#include <map_fragment>',
          '#ifdef USE_MAP\n  vec4 texelColor = mapTexelToLinear( texture2D( map, vUv ) );\n' +
          '  float pkL = dot( texelColor.rgb, vec3( 0.3, 0.59, 0.11 ) ), pkW = vRd.x + 0.35 * sin( vRd.y * 0.021 ) + 0.15 * sin( vRd.y * 0.093 + 1.1 ), pkA = abs( pkW );\n' +
          '  float pkR = ( exp( -pow( ( pkA - 1.65 ) * 1.7, 2.0 ) ) + exp( -pow( ( pkA - 3.5 ) * 1.7, 2.0 ) ) ) * ( 0.55 + 0.45 * sin( vRd.y * 0.047 + pkW * 0.3 ) * sin( vRd.y * 0.0171 + 2.0 ) ), pkB = smoothstep( 5.6, 6.6, abs( vRd.x ) );\n' +
          '  vec3 pkT = mix( mix( texelColor.rgb, vec3( pkL ), 0.78 ), vec3( pkL * 0.9 + 0.04 ), 0.4 * pkR );\n' +
          '  pkT = mix( pkT, pkT * pkT * 2.1, 0.45 * pkB );\n' +
          '  float pkWb = clamp( 0.45 + 0.7 * sin( vRd.y * 0.031 + 1.7 ) * sin( vRd.y * 0.0113 + 0.4 ), 0.0, 1.0 );\n' +
          '  float pkF = 1.3 * ( 1.0 - 0.14 * pkR + 0.06 * pkB ) * ( 1.0 + 0.07 * pkWb * ( 1.0 - pkB ) * sin( vRd.y * 8.98 + pkW * 0.5 ) );\n' +
          '  diffuseColor.rgb *= mix( pkT * pkF, vec3( 1.0 ), vPaint );\n#endif\n');
      };
      gMat.customProgramCacheKey = () => 'pkGrav';
    }
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = mk ? (i, o) => { const rl = T.rl[i], k = 0.9 - 0.07 * Math.exp(-((o - rl) * (o - rl)) / 5.5); return [k, k * 0.91, k * 0.885]; }   // (the gravel: pink granite, a hue the winter leaves uncovered; packed a little darker on the line)
        : (i, o) => { const rl = T.rl[i]; let k = 0.84 - 0.15 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.9) k -= 0.03; return [k, k, k * 1.02]; };
      const yel = [0.98, 0.74, 0.1], wht = [0.95, 0.95, 0.92], gc = [0.92, 0.84, 0.78], sw = 0.9;
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      // verge cross-section per sample and side: [offset, height above the road] from the gravel strip out past the barrier, lifted onto the ground where the slope starts to rise
      const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o, g = pkGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.05 - y; return [o, Math.max(h, g)]; };
        a.push([[w + sw, -0.02], lift(Math.max(w + sw + 0.6, bar - 2.5), -0.02 - 0.2 * (1 - 2.5 / Math.max(2.6, bar - w - sw))), lift(bar, -0.22), lift(bar + 1.4, -0.62)]); } return a; });
      // verge colours per cross-section point = the ground's there (dusty near the road; the outer edge takes the terrain mesh's colour there, snow patches included, so no seam)
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o, sl = k === 2 ? pkSlope(x, z) : 0; if (k === 3) return pkGCol(x, z); const c = pkCol(x, z, T.hy[i] + y, 1 / Math.sqrt(1 + sl * sl), Math.max(0, o - bar)).slice();
          if (k === 0) for (let q = 0; q < 3; q++) c[q] = lerp(c[q], [0.56, 0.45, 0.35][q], 0.35);   // (gravel dust spilt onto the verge's inner edge: a soft transition)
          return c; })); } return a; });
      const RC = 75, cpI = T.cpS.map(s => T.idx(s));   // (samples per chunk; the checkpoints' samples)
      // a worn public road: dark fresh patches (pothole patches, trenches across a lane, strips along the edge) and black crack-seal lines (across the road,
      // along the centre joint and the wheel tracks) as thin quads just above the asphalt, in its chunk's mesh; faded paint in places and on the inside of the
      // tight bends (the cars cut them); own random stream
      const XR = rng(4471), XN = Math.ceil((N - 1) / RC), xP = [], xC = [], ruv = (s, o) => [(o + w) / tileL, s / tileL];
      for (let c = 0; c < XN; c++) { xP.push(new GB(true)); xC.push(new GB(true)); }
      const PF = (s, o, y) => { const f = clamp(s / T.ds, 0, N - 1.001), i = Math.floor(f), t = f - i, l = (a) => a[i] + (a[i + 1] - a[i]) * t; return [l(T.px) + l(T.nx) * o, l(T.hy) + y, l(T.pz) + l(T.nz) * o]; };
      const xAt = (s) => Math.min(XN - 1, Math.floor(clamp(s / T.ds, 0, N - 2) / RC)), keep = (s0, s1) => ![sStart, sFin].concat(T.cpS).some(q => s1 > q - 4 && s0 < q + 4);
      // a decal quad [s, o] x 4 (up-facing order) draped on the asphalt: cut at its triangles (the offs columns, the samples, each quad's a-c diagonal, as built below), lifted by y over them
      // (a flat quad between the samples' heights sank up to ~9 mm into the asphalt on the twisted cells of the tight graded bends)
      const aTri = (i, c, h) => { const j = i + 1, a = Pt(i, offs[c], 0.02), b = Pt(i, offs[c + 1], 0.02), d = Pt(j, offs[c + 1], 0.02), e = Pt(j, offs[c], 0.02); return h ? [a, d, e] : [a, b, d]; };
      const decal = (g, Q, col, y, uvs, tol) => { const V = Q.map(([s, o]) => PF(s, o, 0)), S = Q.map(q => q[0]), O = Q.map(q => q[1]), s0 = Math.min(...S), s1 = Math.max(...S), o0 = Math.min(...O), o1 = Math.max(...O);
        const i0 = clamp(Math.floor(s0 / T.ds) - 1, 0, N - 2), i1 = clamp(Math.floor(s1 / T.ds) + 1, 0, N - 2), U = uvs || Q.map(([s, o]) => ruv(s, o)), C = Array.isArray(col[0]) ? col : [col, col, col, col], poly = V.map((p, k) => [p[0], p[2], y, ...C[k], ...U[k]]), TT = [], tg = new GB(true); let nv = 0;   // (col: one colour or one per corner; returns the vertices added)
        for (let i = i0; i <= i1; i++) for (let c = 0; c < 4; c++) { if (offs[c + 1] < o0 - 0.3 || offs[c] > o1 + 0.3) continue; for (let h = 0; h < 2; h++) TT.push(aTri(i, c, h)); }
        for (const A of TT) nv += drape(tg, poly, A);
        // where the asphalt is flat enough (most of the road) the plain quad, its corners on the asphalt + y, stays within tol of that everywhere (checked at the corners of its own two
        // triangles' pieces, where the creases of both surfaces cross): 6 vertices instead of the pieces
        const aH = (x, z) => { for (const A of TT) { const h = planeY(A, x, z); if (h != null) return h; } return null; }, Pq = V.map(p => { const h = aH(p[0], p[2]); return h == null ? null : [p[0], h + y, p[2]]; });
        if (Pq.every(p => p)) { let ok = true;
          for (const [p, q, r] of [[0, 1, 2], [0, 2, 3]]) { const tq = new GB(true), A = [Pq[p], Pq[q], Pq[r]]; for (const B of TT) drape(tq, [poly[p], poly[q], poly[r]], B);
            for (let k = 0; k < tq.P.length && ok; k += 3) ok = planeY(A, tq.P[k], tq.P[k + 2], 1) >= tq.P[k + 1] - tol; }
          if (ok) { g.quadUp(Pq[0], Pq[1], Pq[2], Pq[3], C, U); return 6; } }
        g.P.push(...tg.P); g.N.push(...tg.N); g.C.push(...tg.C); g.U.push(...tg.U); return nv; };
      const patch = (s0, s1, o0, o1, col) => { if (!keep(s0, s1)) return; const g = xP[xAt(s0)], ss = [s0]; for (let s = (Math.floor(s0 / T.ds) + 1) * T.ds; s < s1 - 0.2; s += T.ds) ss.push(s); ss.push(s1);
        for (let k = 0; k + 1 < ss.length; k++) { const a = ss[k], b = ss[k + 1]; decal(g, [[a, o0], [a, o1], [b, o1], [b, o0]], col, 0.007, null, 0.001); } };
      const seal = [0.2, 0.2, 0.21], crack = (P, cw) => { if (!keep(P[0][0], P[P.length - 1][0])) return; const g = xC[xAt(P[0][0])];   // P: [s, o] points
        for (let k = 0; k + 1 < P.length; k++) { const [s0, o0] = P[k], [s1, o1] = P[k + 1], l = Math.hypot(s1 - s0, o1 - o0) || 1, ps = -(o1 - o0) / l * cw / 2, po = (s1 - s0) / l * cw / 2, e = 0.02 / l, a = s0 - (s1 - s0) * e, b = s1 + (s1 - s0) * e, oa = o0 - (o1 - o0) * e, ob = o1 + (o1 - o0) * e;
          decal(g, [[a - ps, oa - po], [a + ps, oa + po], [b + ps, ob + po], [b - ps, ob - po]], seal, 0.011, [ruv(a, oa - po), ruv(a, oa + po), ruv(b, ob + po), ruv(b, ob - po)], 0.001); } };
      if (mk) {   // the gravel: loose stones thrown out of the ruts, little heaps of them by the edges and on the crown (own random stream)
        const XS = rng(4481), sc = [[0.95, 0.86, 0.84], [0.62, 0.55, 0.53], [0.8, 0.66, 0.6], [0.5, 0.47, 0.47]];
        for (let s = 14; s < T.len - 14; s += 2.5 + XS() * 4) { if (!keep(s - 2, s + 2)) continue;
          const u = XS(), oc = u < 0.4 ? (XS() < 0.5 ? -1 : 1) * (5.6 + XS() * 1.1) : u < 0.65 ? (XS() - 0.5) * 1.2 : (XS() - 0.5) * 2 * (w - 0.6), n = 2 + Math.floor(XS() * 4);
          for (let k = 0; k < n; k++) { const sz = 0.07 + XS() * XS() * 0.2, s0 = s + (XS() - 0.5) * 1.6, o0 = clamp(oc + (XS() - 0.5) * 1.2, -w + 0.2, w - 0.2), c = sc[Math.floor(XS() * sc.length)], a = XS() * 1.5;
            const ca = Math.cos(a) * sz, sa = Math.sin(a) * sz * 0.8; decal(xP[xAt(s0)], [[s0 - ca, o0 - sa], [s0 + sa, o0 - ca], [s0 + ca, o0 + sa], [s0 - sa, o0 + ca]], c, 0.012, null, 0.002); } }
      } else {
      for (let s = 30 + XR() * 20; s < T.len - 40;) {   // patches (never overlapping)
        const r = XR(), sd = XR() < 0.5 ? -1 : 1, tone = 0.5 + XR() * 0.2, col = [tone, tone, tone * 1.04]; let L;
        if (r < 0.55) { L = 1.2 + XR() * 3; const W = 0.9 + XR() * 1.6, oc = 0.45 + W / 2 + XR() * (w - 1.3 - W); patch(s, s + L, sd * (oc - W / 2), sd * (oc + W / 2), col); }   // a pothole patch
        else if (r < 0.8) { L = 0.8 + XR() * 0.9; patch(s, s + L, sd * 0.36, sd * (w - 0.6), col); }   // a trench across the lane
        else { L = 8 + XR() * 22; const W = 0.8 + XR() * 1.0; patch(s, s + L, sd * (w - 0.56 - W), sd * (w - 0.56), col); }   // the edge repaired along the shoulder
        s += L + 14 + XR() * 50; }
      for (let s = 20 + XR() * 10; s < T.len - 20; s += 9 + XR() * 30) {   // cracks across (the whole road or one lane), a little wavy and skewed
        const full = XR() < 0.55, sd = XR() < 0.5 ? -1 : 1, oa = full || sd < 0 ? -(w - 0.35) : 0.3, ob = full || sd > 0 ? w - 0.35 : -0.3, n = Math.max(2, Math.round((ob - oa) / 0.6)), sk = (XR() - 0.5) * 0.6, P = []; let d = 0;
        for (let k = 0; k <= n; k++) { const o = oa + (ob - oa) * k / n; P.push([s + d + sk * o / w, o]); d += (XR() - 0.5) * 0.3; }
        crack(P, 0.09); }
      for (let s = 15 + XR() * 30; s < T.len - 50; s += 20 + XR() * 55) {   // cracks along: the centre joint beside the yellow lines, the wheel tracks
        const L = 6 + XR() * 30, joint = XR() < 0.5, sd = XR() < 0.5 ? -1 : 1, P = []; let o = sd * (joint ? 0.42 + XR() * 0.15 : 1.6 + XR() * 3.8);
        for (let q = 0; q <= L; q += 1.1) { P.push([s + q, o]); o += (XR() - 0.5) * 0.16; if (joint) o = sd * clamp(o * sd, 0.36, 0.7); }
        crack(P, 0.08); }
      }
      const nF = valueNoise2(4473, 1), fade = [0, 1, 2, 3].map(q => { const a = new Float32Array(N), sd = q < 2 ? 0 : q === 2 ? -1 : 1;   // paint wear per line (the two yellow, the left and right white) and sample
        for (let i = 0; i < N; i++) a[i] = Math.min(0.8, 0.62 * sstep(0.52, 0.8, nF(i * T.ds / 45, q * 7.3)) + (sd ? 0.5 * sstep(1 / 70, 1 / 22, sd * T.k[i]) : 0)); return a; });
      const fc = (c, f) => [lerp(c[0], 0.4, f), lerp(c[1], 0.4, f), lerp(c[2], 0.41, f)];
      const gv = (i, k) => { const q = 0.9 + 0.2 * nF(i * T.ds / 9, 40 + k); return [gc[0] * q, gc[1] * q, gc[2] * q]; }, gIn = [0.66, 0.63, 0.6];   // the gravel's tone varies along it, greyer where it meets the asphalt
      // the side roads' mouths (PK_JN): the white edge line broken across them, [side, s0, s1] (the mouth's flared edges meet the Highway's edge at s -+ half its width / sin of its angle)
      const jGap = PK_JN.filter(J => J.sd).map(J => { const h = (J.W / 2 + J.fl) / Math.sin(J.a); return [J.sd, J.s - h, J.s + h]; });
      const jCut = (a, b, sd) => { let P = [[a, b]]; for (const [g, g0, g1] of jGap) if (g === sd && g1 > a && g0 < b) P = [].concat(...P.map(([x, y]) => [[x, Math.min(y, g0)], [Math.max(x, g1), y]].filter(([u, v]) => v - u > 0.05))); return P; };
      let gs = null;   // (the gravel strip: few vertices, chunks 4 times as long)
      for (let c0 = 0; c0 < N - 1; c0 += RC) {
        const gr = new GB(true), gl = new GB(true), pp = []; if (c0 % (RC * 4) === 0) gs = new GB(true);
        for (let i = c0; i < Math.min(c0 + RC, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          if (!mk) [[-0.27, -0.12, yel], [0.12, 0.27, yel], [-(w - 0.28), -(w - 0.5), wht], [w - 0.5, w - 0.28, wht]].forEach(([o0, o1, col], q) => { const fi = fade[q][i], fj = fade[q][j], ci = fc(col, fi), cj = fc(col, fj), si = i * T.ds, sj = j * T.ds;
            for (const [a, b] of q < 2 ? [[si, sj]] : jCut(si, sj, q === 3 ? 1 : -1)) { const ca = ci.map((v, m) => lerp(v, cj[m], (a - si) / T.ds)), cb = ci.map((v, m) => lerp(v, cj[m], (b - si) / T.ds));
              pp.push([decal(gl, [[a, o0], [a, o1], [b, o1], [b, o0]], [ca, ca, cb, cb], 0.016, null, 0.004), 1 - 0.5 * Math.max(fi, fj)]); } });   // (pp: [vertices, paint] per piece of line)
          for (const side of [-1, 1]) {
            const ci = vc[side > 0 ? 1 : 0][i], cj = vc[side > 0 ? 1 : 0][j];
            const ga = gv(i, side), gb = gv(j, side), gai = [ga[0] * gIn[0] * 1.15, ga[1] * gIn[1] * 1.15, ga[2] * gIn[2] * 1.15], gbi = [gb[0] * gIn[0] * 1.15, gb[1] * gIn[1] * 1.15, gb[2] * gIn[2] * 1.15];   // (coarse: the texture's stones ~5-25 cm)
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gai, ga, gb, gbi], [[0, s0 * 6 / 7], [sw / 7, s0 * 6 / 7], [sw / 7, s1 * 6 / 7], [0, s1 * 6 / 7]]);
            const qi = vp[side > 0 ? 1 : 0][i], qj = vp[side > 0 ? 1 : 0][j];
            for (let k = 0; k < 3; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              flatAt(a[0], a[2])[0].quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        cpI.forEach((ic, k) => { if (ic < c0 || ic >= c0 + RC) return; const s0 = T.cpS[k], z4 = [[0, 0], [0, 0], [0, 0], [0, 0]];   // a white line at the checkpoint
          decal(gl, [[s0 - 0.25, -w + 0.1], [s0 - 0.25, w - 0.1], [s0 + 0.25, w - 0.1], [s0 + 0.25, -w + 0.1]], wht, 0.018, z4, 0.004); });
        if (!gr.empty) {   // the asphalt, its patches and crack seals and its paint: one mesh
          const L = [gr, xP[c0 / RC], xC[c0 / RC], gl], n = L.map(q => q.P.length / 3), g = new THREE.BufferGeometry(), paint = new Float32Array(n[0] + n[1] + n[2] + n[3]).fill(1);
          paint.fill(0, 0, n[0]); paint.fill(0.02, n[0], n[0] + n[1]); { let k0 = n[0] + n[1] + n[2]; for (const [nv, v] of pp) { paint.fill(v, k0, k0 + nv); k0 += nv; } }
          const cat = (f) => [].concat(...L.map(f));
          g.setAttribute('position', new THREE.Float32BufferAttribute(cat(q => q.P), 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(cat(q => q.N), 3));
          g.setAttribute('color', new THREE.Float32BufferAttribute(cat(q => q.C), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(cat(q => q.U), 2)); g.setAttribute('paint', new THREE.BufferAttribute(paint, 1)); g.computeBoundingSphere();
          const m = new THREE.Mesh(g, mk ? gMat : aMat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
        if ((c0 + RC) % (RC * 4) === 0 || c0 + RC >= N - 1) addM(gs, sMat);
      }
      // chequered start and finish lines (a mesh each: drawn only there)
      const qMat = new THREE.MeshLambertMaterial({ map: tex.checker }), uM = Math.round(w * 2 / 0.8) / 16; tex.checker.repeat.set(1, 1);
      for (const s0 of [sStart, sFin]) { const gq = new GB(true), a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.04, W1 = [1, 1, 1];
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); addM(gq, qMat); }
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), W1 = [1, 1, 1];
    const txt = () => { const C = new Chunks(250, true); return { quadO: (...a) => C.get(a[0][0], a[0][2]).quadO(...a), addTo: (mat) => C.addTo(root, mat, false, true) }; };   // text boards: 250 m chunks (each one a mesh drawn only near them)
    const ban = txt();
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.2, 0.7, 0.3], [1, 0.55, 0.1], [0.15, 0.5, 0.55], [0.7, 0.2, 0.5], [0.12, 0.14, 0.2]];
    const CR = crowdCtx({ gH: pkGround, near: (x, z) => pkNear(x, z).dd, excluded, maxSlope: 0.6 }), crSoft = new Set();   // spectators (instanced); crSoft: tree-only exclusions (crowds, gantries)
    const person = (x, z, ro) => { const sc = fans[Math.floor(R() * fans.length)]; R(); crowdPut(CR, x, pkGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: sc }, 1); };   // (two draws, as the old merged figure)
    const crowd = (sa, sb, side, rows, dens0, extra) => {   // spectators on the ground behind the barrier, facing the road
      for (let s = sa; s < sb; s += 1.1) for (let row = 0; row < rows; row++) { if (R() > dens0 - row * 0.12) continue;
        const ex = (extra || 2.6) + row * 1.1 + (R() - 0.5) * 0.4, [x, z] = onSide(s, side, ex); if (pkNear(x, z).dd < 1.2) continue;
        const sc = fans[Math.floor(R() * fans.length)]; R(); crowdAt(CR, s, side, ex, x, z, { col: sc }, row, (a, b) => pkNear(a, b).dd >= 1.2); }
      const [x, z] = onSide((sa + sb) / 2, side, 5), e = { x, z, r: (sb - sa) / 2 + 6 }; excl.push(e); crSoft.add(e);
    };
    const carPk = (x, z, rot, col) => { const g = scen.get(x, z), y = pkGround(x, z), c = Math.cos(rot), s = Math.sin(rot);   // parked car
      box(g, x, y + 0.25, z, 4.3, 0.8, 1.85, rot, col, null, true); box(g, x - c * 0.35, y + 1.05, z - s * 0.35, 2.3, 0.62, 1.62, rot, [0.16, 0.2, 0.26], col, true);
      for (const [a, b] of [[1.35, 0.8], [1.35, -0.8], [-1.35, 0.8], [-1.35, -0.8]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.66, 0.66, 0.24, rot, [0.08, 0.08, 0.09], null, true); };
    const tent = (x, z, rot, col) => { const g = scen.get(x, z), y = pkGround(x, z); box(g, x, y, z, 3.2, 2.0, 3.2, rot, [0.94, 0.94, 0.92], null, true); gable(g, x, y + 2.0, z, 3.5, 3.5, 1.0, rot, col, col); };
    const bannerQ = (cx, cy, cz, tx, tz, W, H, slot, tilt) => {   // double-sided text board (bottom centre cx, cy, cz), readable from both +t and -t; tilt (rad) leans its top towards +t (a lectern read from -t)
      const v1 = 1 - slot / 8, v0 = v1 - 1 / 8, ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        ban.quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[0, v0], [1, v0], [1, v1], [0, v1]]); }
    };
    const arch = (s, slot, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a text board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.5, z - nz * L1, 0.7, 7.3, 0.7, hd, postCol); box(g, x + nx * L2, y - 0.5, z + nz * L2, 0.7, 7.3, 0.7, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.6, 0.7, L1 + L2 + 0.7, hd, beamCol);
      bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 13.6, 1.7, slot);
      const e = { x, z, r: Math.max(L1, L2) + 6 }; excl.push(e); crSoft.add(e); return [x, y, z, i];
    };
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt ? T.altAt(T.hy[T.idx(s)]) : 0));

    /* ---- START: gantry with the start lights, timing hut, paddock with team tents, trailers, cars and spectators ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z);
      box(g, x, y + 6.8, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);   // light panel on top of the beam
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.35, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      // timing hut beside the line, flags along the start straight
      const [hx, hz] = onSide(sStart - 4, -1, 4.5), hy = pkGround(hx, hz), gh = scen.get(hx, hz);
      box(gh, hx, hy, hz, 4.2, 2.7, 3, T.hd[i], [0.92, 0.9, 0.84], [0.5, 0.3, 0.2], true); box(gh, hx, hy + 1.3, hz, 4.25, 0.9, 3.05, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.6, 3.4, 1.1, T.hd[i], [0.62, 0.2, 0.14], [0.92, 0.9, 0.84]);
      excl.push({ x: hx, z: hz, r: 6 });
      for (let s = 4; s < sStart + 60; s += 9) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.6), py = pkGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5.4, 5, [0.85, 0.85, 0.88]); (out.pkFl || (out.pkFl = [])).push([px, py + 5.0, pz, T.hd[ii], [[fans[Math.floor(R() * fans.length)]]], 1.1, 0.8]); }   // (the cloth: pkAmbient's waving flags)
      crowd(sStart - 4, sStart + 60, 1, 3, 0.7, 2.8); crowd(sStart + 6, sStart + 60, -1, 3, 0.65, 2.8);
      // the end of the road: concrete blocks across it (the cars cannot go past), the paddock behind
      const i0 = 0, e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];
      for (let o = -T.bl[i0]; o < T.br[i0]; o += 2.05) { const bx = e0[0] + T.nx[i0] * (o + 1), bz = e0[1] + T.nz[i0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[i0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      const pd = P.pads[0], hh = T.hd[0], ch = Math.cos(hh), sh = Math.sin(hh), at = (a, b) => [pd.x + ch * a - sh * b, pd.z + sh * a + ch * b];   // a: along the road, b: across
      const tcol = [[0.85, 0.16, 0.14], [0.15, 0.36, 0.8], [0.95, 0.75, 0.12], [0.2, 0.62, 0.3]];
      for (let k = 0; k < 4; k++) { const [tx, tz] = at(-10 + k * 1.2, -20 + k * 11); const gg = scen.get(tx, tz), ty = pkGround(tx, tz);   // team trailers
        box(gg, tx, ty + 0.4, tz, 12, 3.2, 2.5, hh, [0.93, 0.93, 0.95], null, true); box(gg, tx, ty + 1.6, tz, 12.05, 0.5, 2.55, hh, tcol[k], null, true); }
      for (let k = 0; k < 6; k++) { const [tx, tz] = at(-2 + (k % 2) * 5, -24 + Math.floor(k / 2) * 5.5); tent(tx, tz, hh, tcol[k % 4]); }
      for (let k = 0; k < 7; k++) { const [cx, cz] = at(-24 - (k % 2) * 6, -18 + k * 5.2); carPk(cx, cz, hh + Math.PI / 2, vary(fans[k % fans.length], R, 0.2)); }
      for (let k = 0; k < 26; k++) { const [px, pz] = at(-6 - R() * 16, -22 + R() * 44); if (pkNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      { const [bx, bz] = at(-30, 0), by = pkGround(bx, bz), gg = scen.get(bx, bz);   // paddock banner
        for (const o of [-6, 6]) box(gg, bx - sh * o, by, bz + ch * o, 0.3, 4.2, 0.3, 0, [0.3, 0.3, 0.33]);
        bannerQ(bx, by + 2.4, bz, ch, sh, 12, 1.5, 7); }
      excl.push({ x: pd.x, z: pd.z, r: pd.r + 12 });
    }

    /* ---- checkpoints: gantry with a red board "CPn  altitude" and a big red map pin on top ---- */
    T.cpS.forEach((s, k) => {
      const [x, y, z, i] = arch(s, 2 + k, [0.86, 0.86, 0.88], [0.8, 0.14, 0.12]), g = scen.get(x, z), red = [0.86, 0.12, 0.1];
      cone(g, x, y + 10.2, z, 1.5, -3.4, 10, red, red, 0);   // the pin: a cone point down, a ball on top, a white dot
      ico(g, x, y + 10.35, z, 1.75, 1, red, R, 0.02); ico(g, x, y + 11.75, z, 0.75, 0.55, [0.98, 0.98, 0.98], R, 0.02);
      const side = T.br[i] > T.bl[i] ? 1 : -1; crowd(s - 14, s + 10, side, 2, 0.55); crowd(s - 10, s + 6, -side, 1, 0.4);
    });

    /* ---- FINISH: chequered gantry and flags, then the summit: car park, visitor centre, summit sign ---- */
    {
      const [x, y, z, i] = arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 30; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.5), py = pkGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        const K0 = [0.08, 0.08, 0.08], W0 = [0.96, 0.96, 0.96]; (out.pkFl || (out.pkFl = [])).push([px + T.tx[ii] * 0.085, py + 4.9, pz + T.tz[ii] * 0.085, T.hd[ii], [[K0, W0, K0], [W0, K0, W0]], 1.65, 1.1]); }   // chequered flags (pkAmbient's waving flags)
      crowd(sFin - 40, sFin + 14, 1, 3, 0.6); crowd(sFin - 36, sFin + 10, -1, 2, 0.5);
      // end of the road: a row of granite boulders
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.2) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; rock(scen.get(bx, bz), bx, T.hy[iE] + 0.2, bz, 1.0, 0.8, 0.9, R() * TAU, vary([0.58, 0.5, 0.45], R, 0.1), R, 0.3); }
      // the summit's visitor centre stands on its own flat pad (built in pkLandmarks2); its visitors in front of it, towards the road
      { const { x: hx, z: hz, i: ih } = padH, nx = T.nx[ih], nz = T.nz[ih];
        excl.push({ x: hx, z: hz, r: 24 });
        for (let k = 0; k < 14; k++) { const a = (R() - 0.5) * 30, b = -padH.lat - T.bl[ih] - 1.2 - R() * 2.6, px = hx + T.tx[ih] * a + nx * b, pz = hz + T.tz[ih] * a + nz * b; if (pkNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); } }
      // summit sign by the road just past the line: a board on posts leaning back, facing the arriving cars (readable from the high cameras)
      const [sx, sz, si] = onSide(sFin + 24, 1, 5.4), sy = pkGround(sx, sz), gs = scen.get(sx, sz), tl = 0.95, W2 = 9, H2 = W2 / 8;
      for (const o of [-3.8, 3.8]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.28, 1.3, 0.28, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.28, 1.25 + H2 * Math.cos(tl), 0.28, T.hd[si], [0.36, 0.24, 0.14]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.6, 0.65, W2 + 1.2, T.hd[si], [0.5, 0.46, 0.43], [0.58, 0.54, 0.5]);   // stone plinth
      bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, 6, tl);
      // parked cars and visitors on the summit car park
      const hh = T.hd[iE], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 10; k++) { const a = -14 + (k % 5) * 6.5, b = k < 5 ? -12 : -1, px = padE.x + c * b - sn * a, pz = padE.z + sn * b + c * a; if (pkNear(px, pz).dd < 1.5) continue; carPk(px, pz, hh + Math.PI / 2, vary(fans[(k * 3) % fans.length], R, 0.2)); }
      for (let k = 0; k < 24; k++) { const a = (R() - 0.5) * 36, b = (R() - 0.5) * 12, px = padE.x + c * b - sn * a, pz = padE.z + sn * b + c * a; if (pkNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      excl.push({ x: padE.x, z: padE.z, r: padE.r + 10 });
    }

    /* ---- spectators at the hairpins (uphill side), straw bales on their inside ---- */
    {
      const hp = T.corners.filter(c => c.sev >= 3);
      hp.forEach((c, k) => {
        const sm = (c.i0 + c.i1) / 2 * T.ds; if (sm < sStart + 80 || sm > sFin - 60) return;
        const inner = c.dir, [xi, zi] = onSide(sm, inner, 6), [xo, zo] = onSide(sm, -inner, 6), up = pkGround(xi, zi) > pkGround(xo, zo) ? inner : -inner;
        if (k % 2 === 0) crowd(sm - 14, sm + 14, up, 2, 0.5, 3);
        const im = T.idx(sm), barIn = inner > 0 ? T.br[im] : T.bl[im];
        for (const ds of [-2.4, 2.4]) { const [x, z, hd] = atSf(sm + ds, inner * Math.min(barIn - 0.9, w + 2.6)); out.props.push({ kind: 'bstack', x, z, yaw: hd, col: 0 }); }
      });
    }

    /* ---- guardrails on the outside of the bends and wherever the ground drops away, marker posts elsewhere ---- */
    let nRail = 0;   // (share of the road sides with a rail, for the tests)
    {
      const mkPosts = [];   // [i, side] where a marker post goes
      const need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 10); k <= Math.min(N - 1, c.i1 + 10); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];   // a drop: 2.8 m within 9 m of the barrier, or a fall-off farther out (a flat shelf, then the slope down to the leg below)
        for (const d of [5, 9, 14, 19, 25, 31]) { const o = side * (bar + d);
          if (pkGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 9 ? 2.8 : 2.8 + (d - 9) * 0.33)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 64), iS1 = T.idx(sFin - 44), steel = [0.78, 0.8, 0.82], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52];
      // round 5: weathering (old runs dull and rusty, rust streaks running down from the bolts), a few rails bent outward at the hairpins, reflectors on the
      // posts (out.pkGlow: one mesh with the lit windows, glowing at dusk and at night; built in pkFans5); hashes only, R is not drawn from
      const glow = out.pkGlow = new GB(), refl = (c, tx, tz, rx, rz, w, col) => {   // a reflector plate at c (its lower edge, w either side along t) tilted back away from the road (r), so the high cameras see it too
        const a = [c[0] - tx * w, c[1], c[2] - tz * w], b = [c[0] + tx * w, c[1], c[2] + tz * w], d = [a[0] + rx * 0.16, c[1] + 0.2, a[2] + rz * 0.16], e = [b[0] + rx * 0.16, c[1] + 0.2, b[2] + rz * 0.16];
        glow.quadO(a, b, e, d, col, [c[0] + rx, c[1] - 0.5, c[2] + rz]); };
      out.pkRefl = refl;
      const rN = valueNoise2(9551, 9), hq = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
      const rustA = [0.5, 0.29, 0.16], rustB = [0.36, 0.22, 0.14], oldF = [0.64, 0.64, 0.61], oldB = [0.47, 0.47, 0.45], refW = [1, 1, 1], refA = [1, 0.75, 0.42];
      const dent = [new Float32Array(N), new Float32Array(N)];   // outward offset of the beam (m) per side
      { let k = 0; for (const c of T.corners) { if (c.sev < 3) continue; if (k++ % 3 !== 1) continue;   // every third hairpin: a car went into it once
        const sd = -c.dir > 0 ? 1 : 0, im = Math.round((c.i0 + c.i1) / 2 + (hq(c.i0, 3) - 0.5) * (c.i1 - c.i0)), L = 2 + Math.round(hq(c.i0, 4) * 2), a = 0.4 + 0.25 * hq(c.i0, 5);
        (glow.dents || (glow.dents = [])).push(im); for (let q = -L; q <= L; q++) { const j = im + q; if (j >= 0 && j < N) dent[sd][j] = Math.max(dent[sd][j], a * (1 - (q / (L + 1)) ** 2)); } } }
      const rcol = (i, sd, c, old, low) => {   // the beam's colour at sample i: galvanised steel, rust patches (more on the old runs), streaks down from the bottom edge
        const x = T.px[i], z = T.pz[i], n = rN(x + sd * 37, z), st = hq(i, sd + 7), d = dent[sd > 0 ? 1 : 0][i];
        let r = old ? sstep(0.38, 0.72, n) * 0.75 : sstep(0.64, 0.82, n) * 0.3; r = Math.min(0.9, r * (low ? 1 : 0.55) + (st > 0.72 ? (low ? 0.35 : 0.12) : 0) + (d > 0.05 ? 0.25 : 0));
        const base = old ? (c === steel ? oldF : oldB) : c, ru = st > 0.5 ? rustA : rustB; return [lerp(base[0], ru[0], r), lerp(base[1], ru[1], r), lerp(base[2], ru[2], r)]; };
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1) nd[i] = 0;   // start and summit areas stay open (crowds, car parks)
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 14) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }   // close short gaps
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 8) for (let k = i; k < j; k++) nd[k] = 0; i = j; }   // drop tiny bits
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        const dn = dent[side > 0 ? 1 : 0], Qd = (i, y) => Q(i, y - dn[i] * 0.3 * (y > 0.6 ? 1 : 0), dn[i] * (y > 0.6 ? 1.5 : 1));   // (a bent beam: pushed out, its top edge more and a little down)
        let old = false;
        for (let i = 0; i < N - 1; i++) {
          if (nd[i] && nd[i + 1]) {   // W-beam: a front and a back face, posts every 4 m
            if (!nd[i - 1]) old = mk || hq(i, side) < 0.45;   // (a run of rail: old and weathered, or newer; on the historic gravel road all of them)
            const g = scen.get(T.px[i], T.pz[i]), a = Qd(i, 0.45), b = Qd(i + 1, 0.45), c = Qd(i + 1, 0.8), d = Qd(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins, null, [rcol(i, side, steel, old, 1), rcol(i + 1, side, steel, old, 1), rcol(i + 1, side, steel, old, 0), rcol(i, side, steel, old, 0)]);
            g.quadO(a, b, c, d, steelB, ino, null, [rcol(i, side, steelB, old, 1), rcol(i + 1, side, steelB, old, 1), rcol(i + 1, side, steelB, old, 0), rcol(i, side, steelB, old, 0)]);
            if (i % 2 === 0) { const p = Q(i, -0.3, 0.14 + dn[i]), pc = mk ? [0.34, 0.26, 0.18] : old ? [0.42, 0.4, 0.38] : postC; box(g, p[0], p[1], p[2], 0.13, 1.08, 0.13, T.hd[i], pc, null, true);   // (the historic gravel road's posts: wooden)
              if (i % 8 === 0 && dn[i] < 0.05) refl(Q(i, 0.8, -0.03), T.tx[i], T.tz[i], side * T.nx[i], side * T.nz[i], 0.18, side > 0 ? refW : refA); }   // a reflector on the beam at the post
          } else if (!nd[i] && i % 12 === 0 && i > 2) mkPosts.push([i, side]);   // a marker post (below)
        }
      }
      out.pkRail = need;   // (per side and sample: a rail; pkJunctions keeps its junction mouths off them)
      const kp = pikesProps(out, mkPosts).spots;   // knockable where they fit on the verge; the rest stay fixed beside the barrier line:
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]), tall = T.hy[i] > 330 ? 1.9 : 1;
        // white marker post with a black band and an orange reflector (taller snow poles near the top)
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2 * tall, 0.13, T.hd[i], tall > 1 ? [0.95, 0.5, 0.12] : [0.94, 0.94, 0.92], null, true);
        box(g, p[0], p[1] + 0.72 * tall, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
        refl([p[0] - side * T.nx[i] * 0.07, p[1] - 0.2 + 1.2 * tall, p[2] - side * T.nz[i] * 0.07], T.tx[i], T.tz[i], side * T.nx[i], side * T.nz[i], 0.08, refA);   // its reflector on top (glows at night)
      }
    }

    /* ---- the real course's landmarks and race-day details (each in its own function above, on its own random stream: R is not drawn from) ---- */
    const K = { root, out, tex, dens, N, w, P, scen, noShadow, matV, txt, excl, crSoft, excluded, onSide, carPk, tent, fans, CR, sStart, sFin, iE, padE, padH, mk,
      mats: { tMat, aMat, sMat, matV },
      putPerson: (x, z, ro, col, staff) => crowdPut(CR, x, pkGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col, staff }, 1) };   // (staff: a marshal or a photographer, kept on the real tracks: World's fansOn)   // a spectator facing ro (no draws from R)
    pkLandmarks(K);
    pkCog(K);
    pkRaceOps(K);
    pkSnow(K);
    pkLandmarks2(K);
    pkLandmarks3(K);
    pkWildlife(K);
    pkRoadside(K);
    pkFans5(K);
    pkJunctions(K);
    pkVeg(K);
    if (K.mk) pkHistoric(K); else pkModern(K);

    /* ---- more spectators (instanced, hashed: no draws from R): both sides of every hairpin, the insides of the forest bends, the "W's" ladder,
       more rows at the checkpoints, the start and the finish, small groups on the high side along the ridge; only where the ground is not below the road ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };   // huts, pads, car parks
      const M = { first: 2.8, gap: 1.05, below: 0.6, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.08, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, sStart + 70), Math.min(sb, sFin - 50), side, Object.assign({}, M, o));
      for (const c of T.corners) { if (c.sev < 3) continue; const sm = (c.i0 + c.i1) / 2 * T.ds; for (const sd of [-1, 1]) run(sm - 20, sm + 20, sd, { rows: 3, dens: 0.6, flag: 0.2, label: 'PK hairpin ' + Math.round(sm - sStart) }); }
      for (const d of [306, 546, 810, 1312, 1404]) { const c = T.corners.find(q => Math.abs(q.s0 - sStart - d) < 20); if (c) run(c.s0 - 8, c.s0 + 46, c.dir, { rows: 3, dens: 0.6, label: 'PK bend ' + d }); }
      for (const sd of [-1, 1]) run(sStart + 2640, sStart + 3400, sd, { rows: 2, dens: 0.2, clump: 0.8, label: "PK W's" });
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 26, s0 + 22, side, { first: 4.9, rows: 2, dens: 0.6, label: 'PK cp+' }); run(s0 - 22, s0 + 18, -side, { first: 3.8, rows: 2, dens: 0.5, label: 'PK cp-' }); });
      for (const sd of [-1, 1]) run(sStart + 3700, sStart + 4450, sd, { rows: 2, dens: 0.3, clump: 0.95, below: 0.2, label: 'PK ridge' });
      for (const sd of [-1, 1]) { crowdRun(CR, sStart + 60, sStart + 120, sd, Object.assign({}, M, { rows: 3, dens: 0.55, label: 'PK after start' })); crowdRun(CR, sFin - 90, sFin - 40, sd, Object.assign({}, M, { rows: 3, dens: 0.6, label: 'PK before finish' })); crowdRun(CR, sFin - 40, sFin + 12, sd, Object.assign({}, M, { first: 6.2, rows: 2, dens: 0.55, label: 'PK finish back' })); }
    }

    for (const e of CR.circ) excl.push(e);   // the trees, shrubs and boulders keep clear of the new crowds too

    /* ---- vegetation and rock ---- */
    const nTrees = pkForest(scen, R, dens, excluded, noShadow);
    {
      const bushC = [[0.13, 0.25, 0.11], [0.17, 0.28, 0.12], [0.21, 0.28, 0.11]], tuftC = [[0.5, 0.5, 0.26], [0.58, 0.54, 0.3], [0.44, 0.46, 0.22]], graniteC = [[0.54, 0.44, 0.39], [0.48, 0.42, 0.39], [0.58, 0.48, 0.43]], greyC = [0.44, 0.43, 0.41];
      // the rocks' shapes, lichen, scree and snow, the undergrowth: own streams (Q, U); R keeps its sequence (skip: the draws the old boulders made), so everything stands where it did
      const Q = rng(9433), U = rng(9436), nat = out.pkNat = { kin: 0, jun: 0, log: 0, krum: 0, block: 0, scree: 0, lee: 0, skipU: 0, screeAt: [], dv: 0 },   // (counts, for the tests and the screenshot tools)
        skip = (k) => { for (let q = 0; q < k; q++) R(); }, sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
      const lichO = valueNoise2(9434, 1.4), lichG = valueNoise2(9435, 2.2), orange = [0.8, 0.5, 0.17], sage = [0.58, 0.63, 0.44], blk = [0.2, 0.19, 0.18];
      const sc = (p, yb, yt, col, up) => {   // a rock vertex's colour: darker at the foot, lichen blotches (orange, pale sage green, a few black streaks) where the weather reaches
        const t = clamp((p[1] - yb) / Math.max(0.2, yt - yb), 0, 1), k = 0.7 + 0.42 * t; let r = col[0] * k, g = col[1] * k, b = col[2] * k;
        if (up > -0.3) { const a = lichO(p[0] + p[1] * 0.6, p[2] - p[1] * 0.4), o = sstep(0.58, 0.66, a) * 0.9 * (0.5 + 0.5 * t), c = lichG(p[0] - 31, p[2] + p[1]), e = sstep(0.3, 0.2, c) * 0.5, d = sstep(0.88, 0.95, c) * 0.5;
          r = lerp(lerp(lerp(r, orange[0], o), sage[0], e), blk[0], d); g = lerp(lerp(lerp(g, orange[1], o), sage[1], e), blk[1], d); b = lerp(lerp(lerp(b, orange[2], o), sage[2], e), blk[2], d); }
        return [r, g, b];
      };
      const round = (g, cx, cy, cz, r, sy, col) => {   // a rounded granite boulder (an icosahedron, jittered, flat-bottomed; 60 vertices)
        const yb = cy - r * sy * 0.75, vs = ICO_V.map(v => { const k = 1 + (Q() - 0.5) * 0.4; return [cx + v[0] * r * k, Math.max(yb, cy + v[1] * r * sy * k), cz + v[2] * r * k]; }), inn = [cx, cy, cz], yt = cy + r * sy;
        const cs = vs.map((p, k) => sc(p, yb, yt, col, ICO_V[k][1]));
        for (const f of ICO_F) g.triO(vs[f[0]], vs[f[1]], vs[f[2]], cs[f[0]], inn, cs[f[1]], cs[f[2]]);
      };
      const block = (g, cx, y0, cz, sx, sy, sz, rot, col, tip) => {   // a weathered granite block: 5 sunk foot corners on a rounded box outline, a bulging middle ring, an inset domed top (75 vertices); tip: lean of the top (x, z per m of height)
        nat.block++; const c = Math.cos(rot), s = Math.sin(rot), tx = tip ? tip[0] * sy : 0, tz = tip ? tip[1] * sy : 0, n = 5, a0 = Q() * 0.5, cor = [];
        for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU + (Q() - 0.5) * 0.3, ca = Math.cos(a), sa = Math.sin(a); cor.push([Math.sign(ca) * Math.pow(Math.abs(ca), 0.55), Math.sign(sa) * Math.pow(Math.abs(sa), 0.55)]); }   // (a squarish outline with rounded corners)
        const P = (a, b, y, f, ly) => { const lx = a * sx / 2 * f * (1 + (Q() - 0.5) * 0.16), lz = b * sz / 2 * f * (1 + (Q() - 0.5) * 0.16); return [cx + lx * c - lz * s + tx * ly, y, cz + lx * s + lz * c + tz * ly]; };
        const yt = y0 + sy, B = cor.map(([a, b]) => P(a, b, y0 - 0.3, 0.88, 0)), M = cor.map(([a, b]) => P(a, b, y0 + sy * (0.5 + (Q() - 0.5) * 0.2), 1, 0.5)), Tp = cor.map(([a, b]) => P(a, b, yt - sy * (0.08 + Q() * 0.14), 0.66, 0.92));
        const inn = [cx + tx * 0.5, y0 + sy * 0.45, cz + tz * 0.5], cl = (p, u) => sc(p, y0, yt, col, u), top = [cx + tx, yt, cz + tz], dn = [cx, y0 - 5, cz], ct = cl(top, 1);
        for (let k = 0; k < n; k++) { const j = (k + 1) % n; g.quadO(B[k], B[j], M[j], M[k], null, inn, null, [cl(B[k], 0), cl(B[j], 0), cl(M[j], 0), cl(M[k], 0)]); g.quadO(M[k], M[j], Tp[j], Tp[k], null, inn, null, [cl(M[k], 0.5), cl(M[j], 0.5), cl(Tp[j], 1), cl(Tp[k], 1)]);
          g.triO(Tp[k], Tp[j], top, cl(Tp[k], 1), dn, cl(Tp[j], 1), ct); }
      };
      const groundMin = (x, z, r) => Math.min(pkGround(x - r, z - r), pkGround(x + r, z - r), pkGround(x + r, z + r), pkGround(x - r, z + r), pkGround(x, z));
      const drapeG = (g, poly) => {   // a thin triangle (points [x, z, lift, r, g, b]) laid on the terrain mesh (flat fans up to ~20 m across sank up to 1-2 m into it on the crags):
        // plain, its corners on the ground + lift, where that stays within half the lift of the mesh everywhere (checked at the corners of its pieces cut at the mesh's triangles: 5 m cells
        // split u + v = 1, which also cut the 10 m cells' triangles), else those pieces, each exactly on its triangle + the lift (fewer vertices than splitting it smaller)
        const G = PK.G, X = poly.map(p => (p[0] - G.x0) / PKC), Z = poly.map(p => (p[1] - G.z0) / PKC), i0 = Math.max(0, Math.floor(Math.min(...X))), i1 = Math.min(G.nx - 2, Math.floor(Math.max(...X))), j0 = Math.max(0, Math.floor(Math.min(...Z))), j1 = Math.min(G.nz - 2, Math.floor(Math.max(...Z)));
        const cut = (gg) => { for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = G.x0 + i * PKC, z = G.z0 + j * PKC, a = [x, 0, z], b = [x + PKC, 0, z], c = [x, 0, z + PKC], d = [x + PKC, 0, z + PKC];
          drape(gg, poly, [a, b, c], pkGroundS); drape(gg, poly, [d, c, b], pkGroundS); } };
        const tq = new GB(false), A = poly.map(p => [p[0], pkGroundS(p[0], p[1]) + p[2], p[1]]), tol = Math.min(poly[0][2], poly[1][2], poly[2][2]) * 0.5; cut(tq); let ok = true;
        for (let k = 0; k < tq.P.length && ok; k += 3) ok = planeY(A, tq.P[k], tq.P[k + 2], 1) >= tq.P[k + 1] - tol;
        if (ok) { g.triO(A[0], A[1], A[2], poly[0].slice(3), [A[0][0], A[0][1] - 5, A[0][2]], poly[1].slice(3), poly[2].slice(3)); nat.dv += 3; return; }
        cut(g); nat.dv += tq.P.length / 3;
      };
      const patch = (x, z, pts, lift, cIn, t) => {   // a patch lying on the ground (scree, snow, a mat): a fan from (x, z) out to pts [[x, z]], its rim the ground's colour there, mixed with cIn by t (it fades in)
        const g = noShadow(x, z), n = pts.length, rc = pts.map(([px, pz]) => { const q = pkGCol(px, pz); return [lerp(q[0], cIn[0], t), lerp(q[1], cIn[1], t), lerp(q[2], cIn[2], t)]; });
        for (let k = 0; k < n; k++) { const j = (k + 1) % n; drapeG(g, [[pts[k][0], pts[k][1], lift, ...rc[k]], [pts[j][0], pts[j][1], lift, ...rc[j]], [x, z, lift * 1.6, ...cIn]]); }
      };
      const clearRing = (x, z, r, n) => { for (let k = 0; k < n; k++) { const a = k / n * TAU; if (pkNear(x + Math.cos(a) * r, z + Math.sin(a) * r).dd < 1.5) return false; } return true; };
      const leeSnow = (x, z, r) => {   // snow lying in the lee (east, x+) of a rock above ~335 m: a tapering drift on the ground
        const L = r * (1.8 + Q() * 1.4), w = r * (0.75 + Q() * 0.3), cx = x + L * 0.45, pts = [];
        for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, ca = Math.cos(a), f = 0.85 + Q() * 0.3; pts.push([cx + ca * L * 0.62 * f, z + Math.sin(a) * w * (1 - 0.55 * Math.max(0, ca)) * f]); }   // (a teardrop, tapering downwind)
        if (pts.some(([a, b]) => pkNear(a, b).dd < 1.5 || excluded(a, b))) return;
        patch(cx, z, pts, 0.07, [0.97, 0.99, 1.05], 0.5); nat.lee++;
      };
      const scree = (x, z, r, far) => {   // a talus fan below a crag: pale granite gravel down the fall line, the stones getting bigger towards its foot
        const gx = pkGround(x + 3, z) - pkGround(x - 3, z), gz = pkGround(x, z + 3) - pkGround(x, z - 3), l = Math.hypot(gx, gz); if (l < 1.2) return;
        const ux = -gx / l, uz = -gz / l, ox = x + ux * r * 0.8, oz = z + uz * r * 0.8, L = 7 + Q() * 9 + r, sp = 0.35 + Q() * 0.2, pts = [];
        for (let k = 0; k <= 6; k++) { const a = Math.atan2(uz, ux) + (k / 6 - 0.5) * 2 * sp, d = L * (k === 0 || k === 6 ? 0.55 : 0.85 + Q() * 0.25); pts.push([ox + Math.cos(a) * d, oz + Math.sin(a) * d]); }
        pts.push([ox - uz * r * 0.6, oz + ux * r * 0.6]); pts.unshift([ox + uz * r * 0.6, oz - ux * r * 0.6]);
        let ok = pts.every(([a, b]) => pkNear(a, b).dd >= 1.5 && !excluded(a, b)); if (!ok) return;
        patch(ox + ux * L * 0.3, oz + uz * L * 0.3, pts, 0.09, vary([0.64, 0.57, 0.53], Q, 0.08), 0.25);
        const g = noShadow(ox, oz), nS = far ? 4 : 9; nat.scree++;
        for (let k = 0; k < nS; k++) { const f = Math.pow(Q(), 0.7), a = Math.atan2(uz, ux) + (Q() - 0.5) * 2 * sp * 0.9, d = L * f * 0.9, px = ox + Math.cos(a) * d, pz = oz + Math.sin(a) * d, rs = 0.18 + f * 0.55 + Q() * 0.2;
          const py = pkGround(px, pz) - rs * 0.25, a0 = Q() * TAU, col = vary(graniteC[Math.floor(Q() * 3)], Q, 0.16), tp = [px + (Q() - 0.5) * rs * 0.4, py + rs * (0.6 + Q() * 0.5), pz + (Q() - 0.5) * rs * 0.4];   // (a jagged stone: a tetrahedron, 12 vertices)
          const b = [0, 1, 2].map(q => [px + Math.cos(a0 + q * 2.1) * rs, py, pz + Math.sin(a0 + q * 2.1) * rs]), inn = [px, py + rs * 0.2, pz], ct = sc(tp, py, tp[1], col, 1), cb = sh(col, 0.72);
          for (let q = 0; q < 3; q++) g.triO(b[q], b[(q + 1) % 3], tp, cb, inn, cb, ct); }
      };
      for (let s = 2; s < T.len - 2; s += 3.2) for (const side of [-1, 1]) {
        const i = T.idx(s), y0 = T.hy[i], tl = pkTreeline(T.px[i], T.pz[i]), above = y0 > tl, boulderPark = s > 5150 && s < 5980;
        const r = R();
        if (!above && r < 0.25) {   // shrubs and young firs right behind the barrier
          const [x, z] = onSide(s, side, 1.2 + R() * 7); if (pkNear(x, z).dd < 0.8 || excluded(x, z)) continue;
          const y = pkGround(x, z), g = scen.get(x, z);
          if (R() < 0.6) ico(g, x, y + 0.35, z, 0.7 + R() * 0.7, 0.75, vary(bushC[Math.floor(R() * 3)], R, 0.15), R, 0.3);
          else { const q = Q(); pkPine(g, x, y, z, 2.5 + R() * 3, vary([0.12, 0.26, 0.13], R, 0.12), R, 0, q < 0.45 ? 1 : q < 0.75 ? 2 : q < 0.9 ? 3 : 0); }
        } else if (above && r < 0.45) {   // alpine grass tufts along the verge
          const [x, z] = onSide(s, side, 0.6 + R() * 5); if (pkNear(x, z).dd < 0.3 || excluded(x, z)) continue;
          const y = pkGround(x, z), g = noShadow(x, z), col = tuftC[Math.floor(R() * 3)];   // (small: their shadows are a pixel or two)
          for (let q = 0; q < 2; q++) cone(g, x + (R() - 0.5) * 0.6, y, z + (R() - 0.5) * 0.6, 0.12 + R() * 0.1, 0.35 + R() * 0.4, 4, vary(col, R, 0.12), [col[0] * 1.25, col[1] * 1.2, col[2] * 1.1], R() * TAU);
        }
        if ((above && R() < 0.34) || (boulderPark && R() < 0.5) || (!above && R() < 0.05)) {   // granite boulders (rounded, split blocks, slabs), big ones in Boulder Park
          const o = 2 + Math.pow(R(), 1.6) * (boulderPark ? 40 : 70), [x, z] = onSide(s, side, o), sz = (boulderPark ? 0.9 + R() * 1.9 : 0.5 + R() * 1.3) * (o > 20 ? 1.3 : 1); if (pkNear(x, z).dd < sz + 0.5 || excluded(x, z)) continue;
          const y = pkGround(x, z), col = vary(above ? graniteC[Math.floor(R() * 3)] : greyC, R, 0.12), g = o > 40 ? noShadow(x, z) : scen.get(x, z);   // (a boulder's short shadow does not reach the road's surroundings from 40 m out)
          const sy = 0.62 + R() * 0.3, kd = Q(); skip(12);
          if (kd < 0.5 || sz < 1.1 || pkNear(x, z).dd < sz * 1.4 + 1.5) round(g, x, y + sz * 0.25, z, sz, sy, col);
          else if (kd < 0.75) {   // a block split in two, the halves leaning apart
            const rot = Q() * TAU, c = Math.cos(rot), sn = Math.sin(rot), gp = 0.1 + sz * 0.08, w = sz * 0.95, hh = sz * (0.9 + Q() * 0.5), y1 = groundMin(x, z, sz * 0.7) + 0.1;
            for (const f of [-1, 1]) block(g, x + c * f * (w / 2 + gp), y1, z + sn * f * (w / 2 + gp), w, hh * (f > 0 ? 1 : 0.85 + Q() * 0.1), sz * 1.6, rot, vary(col, Q, 0.06), [c * f * 0.12, sn * f * 0.12]);
          } else { const rot = Q() * TAU, y1 = groundMin(x, z, sz * 0.8) + 0.1, tl2 = Q() < 0.5;   // a squat block (a slab tilted up on one side), sometimes a rounded stone on top: a small tor
            block(g, x, y1, z, sz * 2, sz * (tl2 ? 0.7 : 1.1), sz * 1.5, rot, col, tl2 ? [Math.cos(rot) * 0.3, Math.sin(rot) * 0.3] : null);
            if (!tl2 && sz > 1.2 && Q() < 0.6) round(g, x + (Q() - 0.5) * sz * 0.4, y1 + sz * 1.1 + sz * 0.12, z + (Q() - 0.5) * sz * 0.5, sz * 0.55, 0.75, vary(col, Q, 0.08)); }
          if (y > 335 && Q() < 0.7) leeSnow(x, z, sz);
          if (R() < 0.4) { const bx = x + (R() - 0.5) * sz * 2.2, bz = z + (R() - 0.5) * sz * 2.2, c2 = vary(col, R, 0.1); skip(12);
            if (pkNear(bx, bz).dd >= sz * 0.6 + 0.3) round(g, bx, y + sz * 0.1, bz, sz * 0.6, 0.7, c2); }
        }
      }
      // granite outcrops and crags where the slope is steep: weathered blocks, split blocks and stacked tors, a scree fan below
      for (let s = 10; s < T.len - 10; s += 16) for (const side of [-1, 1]) {
        if (R() < 0.5) continue;
        const [x, z] = onSide(s, side, 10 + R() * 70), nd = pkNear(x, z); if (excluded(x, z) || nd.dd < 6) continue; const far = nd.i < 0 || nd.dd > 60;
        const sl = pkSlope(x, z); if (sl < 0.55) continue;
        const y = pkGround(x, z), g = far ? noShadow(x, z) : scen.get(x, z), n = 2 + Math.floor(R() * 3), base = vary(graniteC[Math.floor(R() * 3)], R, 0.1); let rm = 0;
        for (let q = 0; q < n; q++) { const r0 = 2.2 + R() * 3.5, qx = x + (R() - 0.5) * 7, qz = z + (R() - 0.5) * 7, qy = pkGround(qx, qz); if (pkNear(qx, qz).dd < r0 + 1) continue;
          const ry = r0 * (0.8 + R() * 0.8), rz = r0 * (0.7 + R() * 0.4), rot = R() * TAU, col = vary(base, R, 0.08); skip(63); if (pkNear(qx, qz).dd < r0 * 1.3 + 1.5) continue; rm = Math.max(rm, r0);
          const y1 = groundMin(qx, qz, r0 * 0.75) + 0.1, top = Math.max(qy + ry * 0.55, y1 + ry * 0.7) - y1, kd = Q();
          if (kd < 0.5) block(g, qx, y1, qz, r0 * 1.7, top, rz * 1.7, rot, col, [(Q() - 0.5) * 0.3, (Q() - 0.5) * 0.3]);
          else if (kd < 0.8) { const c = Math.cos(rot), sn = Math.sin(rot), w = r0 * 0.85, gp = 0.15 + Q() * 0.2;   // split
            for (const f of [-1, 1]) block(g, qx + c * f * (w / 2 + gp), y1, qz + sn * f * (w / 2 + gp), w, top * (f > 0 ? 1 : 0.8), rz * 1.6, rot, vary(col, Q, 0.06), [c * f * 0.15, sn * f * 0.15]); }
          else { const h1 = top * 0.62; block(g, qx, y1, qz, r0 * 1.8, h1, rz * 1.7, rot, col);   // a tor: blocks stacked smaller upwards, a rounded cap
            const r2 = r0 * (0.6 + Q() * 0.15); block(g, qx + (Q() - 0.5) * 0.6, y1 + h1 - 0.25, qz + (Q() - 0.5) * 0.6, r2 * 1.8, r2 * 0.9, r2 * 1.5, rot + 0.4 + Q(), vary(col, Q, 0.06));
            if (Q() < 0.4) round(g, qx + (Q() - 0.5) * 0.5, y1 + h1 - 0.25 + r2 * 1.1, qz + (Q() - 0.5) * 0.5, r2 * 0.6, 0.7, vary(col, Q, 0.06)); }
          if (qy > 335 && Q() < 0.6) leeSnow(qx, qz, r0);
        }
        if (rm) { const k = nat.scree; scree(x, z, rm, far); if (nat.scree > k) nat.screeAt.push([s, side * Math.round(nd.dd)]); }
      }
      // undergrowth between the trees near the road (below the treeline): kinnikinnick mats, juniper patches, fallen logs; krummholz mats and flag trees in the ragged band just above it
      const kinC = [[0.15, 0.29, 0.1], [0.13, 0.26, 0.09], [0.18, 0.31, 0.11]], bronze = [0.36, 0.21, 0.11], junC = [[0.18, 0.29, 0.22], [0.21, 0.31, 0.21], [0.16, 0.27, 0.21]], logC = [0.48, 0.42, 0.35];
      for (let s = 4; s < T.len - 4; s += 3) for (const side of [-1, 1]) {
        const i = T.idx(s), tl = pkTreeline(T.px[i], T.pz[i]), rel = T.hy[i] - tl, u = U(), o0 = U(), a0 = U() * TAU;
        if (rel > 34 || s < T.startS + 30 && s > T.startS - 60) continue;
        const [x, z] = onSide(s, side, 1.6 + Math.pow(o0, 1.7) * 22), y = pkGround(x, z); if (excluded(x, z)) { nat.skipU++; continue; }
        if (rel > -8) {   // the ragged treeline: low krummholz, fewer higher up
          if (u > 0.4 * sstep(34, 0, rel) || !clearRing(x, z, 2.5, 6) || pkSlope(x, z) > 0.9) continue;
          const n = 1 + Math.floor(U() * 3);
          for (let k = 0; k < n; k++) { const kx = x + (U() - 0.5) * 5, kz = z + (U() - 0.5) * 5; if (pkNear(kx, kz).dd < 2.5 || excluded(kx, kz)) continue;
            nat.krum++; pkPine(scen.get(kx, kz), kx, pkGround(kx, kz), kz, (2.4 + U() * 2.6) * (1 - 0.4 * sstep(0, 30, rel)), vary([0.1, 0.21, 0.13], U, 0.2), U, 0, 5); }
          continue;
        }
        if (u < 0.3) {   // kinnikinnick: a glossy dark green mat hugging the ground, bronze-red at the edges
          const rr = 0.8 + U() * 1.3; if (!clearRing(x, z, rr, 5)) continue; const pts = [];
          for (let k = 0; k < 8; k++) { const a = a0 + k / 8 * TAU, d = rr * (0.5 + U() * 0.6); pts.push([x + Math.cos(a) * d, z + Math.sin(a) * d]); }
          nat.kin++; const g = noShadow(x, z), c = vary(kinC[Math.floor(U() * 3)], U, 0.15), rc = pts.map(([a, b]) => { const q = U() < 0.2 ? vary(bronze, U, 0.2) : sh(c, 0.85), gc = pkGCol(a, b); return [lerp(q[0], gc[0], 0.3), lerp(q[1], gc[1], 0.3), lerp(q[2], gc[2], 0.3)]; });
          for (let k = 0; k < 8; k++) { const j = (k + 1) % 8; drapeG(g, [[pts[k][0], pts[k][1], 0.03, ...rc[k]], [pts[j][0], pts[j][1], 0.03, ...rc[j]], [x, z, 0.08, ...c]]); }
        } else if (u < 0.5) {   // common juniper: a low, spreading blue-green mound
          const rr = 1 + U() * 1.3, hh = 0.25 + U() * 0.25, ex = 1 + U() * 0.5; if (!clearRing(x, z, rr * ex, 6)) continue;
          nat.jun++; const g = noShadow(x, z), c = vary(junC[Math.floor(U() * 3)], U, 0.14), top = [x, y + hh, z], B = [], M = [], n = 6, inn = [x, y + hh * 0.3, z];
          for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU, d = rr * (0.75 + U() * 0.4), ca = Math.cos(a) * d * ex, sa = Math.sin(a) * d, px = x + ca * Math.cos(a0) - sa * Math.sin(a0), pz = z + ca * Math.sin(a0) + sa * Math.cos(a0);
            B.push([px, pkGround(px, pz) + 0.02, pz]); M.push([x + (px - x) * 0.6, y + hh * (0.6 + U() * 0.25), z + (pz - z) * 0.6]); }
          const cB = sh(c, 0.62), cM = c, cT = sh(c, 1.12);
          for (let k = 0; k < n; k++) { const j = (k + 1) % n; g.quadO(B[k], B[j], M[j], M[k], null, inn, null, [cB, cB, cM, cM]); g.triO(M[k], M[j], top, cM, inn, cM, cT); }
        } else if (u < 0.58) {   // a fallen, weathered log (its root plate on some), across the slope
          const L = 3 + U() * 5.5, rb = 0.14 + U() * 0.14, ca = Math.cos(a0), sa = Math.sin(a0), p0 = [x - ca * L / 2, 0, z - sa * L / 2], p1 = [x + ca * L / 2, 0, z + sa * L / 2];
          p0[1] = pkGround(p0[0], p0[2]) + rb * 0.75; p1[1] = pkGround(p1[0], p1[2]) + rb * 0.75;
          if (Math.abs((p0[1] + p1[1]) / 2 - y - rb * 0.75) > 0.35 || pkNear(p0[0], p0[2]).dd < 1.8 || pkNear(p1[0], p1[2]).dd < 1.8 || pkNear(x, z).dd < 1.8 || excluded(p0[0], p0[2]) || excluded(p1[0], p1[2])) continue;
          nat.log++; const g = scen.get(x, z), c = vary(logC, U, 0.18), ct = sh(c, 1.25), cb = sh(c, 0.55), end = [0.72, 0.6, 0.44], n = 5, px = -sa, pz = ca, ring = (p, r) => { const a = []; for (let k = 0; k < n; k++) { const t = k / n * TAU + 0.3; a.push([p[0] + px * Math.cos(t) * r, p[1] + Math.sin(t) * r, p[2] + pz * Math.cos(t) * r]); } return a; };
          const A0 = ring(p0, rb), A1 = ring(p1, rb * 0.8), mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], cl = (p, q) => p[1] > q[1] + 0.02 ? ct : p[1] < q[1] - rb * 0.3 ? cb : c;
          for (let k = 0; k < n; k++) { const j = (k + 1) % n; g.quadO(A0[k], A1[k], A1[j], A0[j], null, mid, null, [cl(A0[k], p0), cl(A1[k], p1), cl(A1[j], p1), cl(A0[j], p0)]); }
          for (let k = 1; k < n - 1; k++) { g.triO(A0[0], A0[k], A0[k + 1], end, mid); g.triO(A1[0], A1[k], A1[k + 1], sh(end, 0.9), mid); }
          if (U() < 0.3) { const rp = rb * 4, q = [p0[0] - ca * 0.1, p0[1] - rb * 0.2, p0[2] - sa * 0.1], rs = [];   // the root plate: a ragged disc standing up at one end
            for (let k = 0; k < 6; k++) { const t = k / 6 * TAU; rs.push([q[0] + px * Math.cos(t) * rp * (0.7 + U() * 0.4), Math.max(pkGround(q[0], q[2]) - 0.1, q[1] + Math.sin(t) * rp * (0.7 + U() * 0.4)), q[2] + pz * Math.cos(t) * rp * (0.7 + U() * 0.4)]); }
            const rc = [0.36, 0.28, 0.2], ic = [q[0] + ca, q[1], q[2] + sa], oc = [q[0] - ca, q[1], q[2] - sa];
            for (let k = 0; k < 6; k++) { const j = (k + 1) % 6; g.triO(rs[k], rs[j], q, rc, ic); g.triO(rs[k], rs[j], q, sh(rc, 0.8), oc); } }
        }
      }
    }

    /* ---- knockable props' kinds are Core's; finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    out.dyn.pkOps.cast = { list: sceneryGroup.children.map(m => [m, m.geometry.boundingSphere]), fr: new THREE.Frustum(), pm: new THREE.Matrix4(), v: new THREE.Vector3(), sp: new THREE.Sphere(), sun: null };   // (pkOpsCast: which chunks cast)
    { const ops = out.dyn.pkOps; out.dyn.afterCam = (cam, car) => pkOpsCast(ops, cam, car); }
    { const G = P.G, grp = out.ground, add = (g) => { const m = new THREE.Mesh(g, tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); };   // the terrain tiles, the verge and the far scenery in them
      const blocks = new Map();   // the coarse tiles far from the road in blocks of 2 x 2 (one draw call; deep in the haze, only the portrait chase view looks that far)
      for (const [ti, tj, st] of tiles) { const k = tj * G.ntx + ti, g = pkTileGeo(ti, tj, st, flat.get(k)); flat.delete(k);
        if (st === 1) { add(g); continue; } const b = Math.floor(ti / 2) + ',' + Math.floor(tj / 2); let L = blocks.get(b); if (!L) blocks.set(b, L = []); L.push(g); }
      for (const L of blocks.values()) {
        if (L.length === 1) { add(L[0]); continue; }
        let nv = 0, ni = 0; for (const g of L) { nv += g.attributes.position.count; ni += g.index.count; }
        const m = new THREE.BufferGeometry(), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni); let o = 0, oi = 0;
        for (const [a, n] of [['position', 3], ['normal', 3], ['color', 3], ['uv', 2], ['steep', 1]]) { const A = new Float32Array(nv * n); let q = 0; for (const g of L) { A.set(g.attributes[a].array, q); q += g.attributes[a].array.length; } m.setAttribute(a, new THREE.BufferAttribute(A, n)); }
        for (const g of L) { const I = g.index.array; for (let q = 0; q < I.length; q++) idx[oi++] = I[q] + o; o += g.attributes.position.count; g.dispose(); }
        m.setIndex(new THREE.BufferAttribute(idx, 1)); m.computeBoundingSphere(); add(m); }
      for (const f of flat.values()) add(pkTileGeo(0, 0, 0, f)); }   // (on a tile that is not built: a mesh of its own)
    ban.addTo(new THREE.MeshLambertMaterial({ map: pkAtlas(cpAlt), side: THREE.FrontSide }));
    crowdFinish(CR, root, out);
    { // the spectators in smaller cells than the shared layer's 128 m chunks: a view only ~60 m across sees a tenth of such a chunk's people in the W's, and the vertices are paid per chunk
      const grp = root.getObjectByName('crowds'), C = 40, m4 = new THREE.Matrix4(), c3 = new THREE.Color();
      for (const im of grp.children.slice()) {
        if (!im.isInstancedMesh || im.name !== 'crowd') continue;
        const M = im.instanceMatrix.array, A = im.geometry.getAttribute('aCrowd').array, IC = im.instanceColor.array, ox = im.position.x, oz = im.position.z, cells = new Map();
        for (let q = 0; q < im.count; q++) { const k = Math.floor((M[q * 16 + 12] + ox) / C) + ',' + Math.floor((M[q * 16 + 14] + oz) / C); let L = cells.get(k); if (!L) cells.set(k, L = []); L.push(q); }
        if (cells.size < 2) continue;
        const base = im.geometry, fg = new THREE.BufferGeometry(); fg.setAttribute('position', base.attributes.position); fg.computeBoundingSphere(); const bs = fg.boundingSphere;   // (the figure's own sphere)
        grp.remove(im);
        for (const L of cells.values()) {   // (as IChunks: the instances round the cell's centre, a sphere round them scaled by the largest instance)
          let cx = 0, cz = 0, y0 = 1e9, y1 = -1e9, r = 0, sm = 0;
          for (const q of L) { const o = q * 16; cx += M[o + 12] + ox; cz += M[o + 14] + oz; y0 = Math.min(y0, M[o + 13]); y1 = Math.max(y1, M[o + 13]); sm = Math.max(sm, Math.hypot(M[o], M[o + 1], M[o + 2]), Math.hypot(M[o + 4], M[o + 5], M[o + 6])); }
          cx /= L.length; cz /= L.length; for (const q of L) r = Math.max(r, Math.hypot(M[q * 16 + 12] + ox - cx, M[q * 16 + 14] + oz - cz));
          const g = new THREE.BufferGeometry(); for (const a in base.attributes) if (a !== 'aCrowd') g.setAttribute(a, base.attributes[a]); if (base.index) g.setIndex(base.index);
          const ac = new Float32Array(L.length * 2), n = new THREE.InstancedMesh(g, im.material, L.length);
          L.forEach((q, t) => { m4.fromArray(M, q * 16); m4.elements[12] += ox - cx; m4.elements[14] += oz - cz; n.setMatrixAt(t, m4); ac[t * 2] = A[q * 2]; ac[t * 2 + 1] = A[q * 2 + 1]; n.setColorAt(t, c3.setRGB(IC[q * 3], IC[q * 3 + 1], IC[q * 3 + 2])); });
          g.setAttribute('aCrowd', new THREE.InstancedBufferAttribute(ac, 2)); const ym = (y0 + y1) / 2;
          g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, ym + bs.center.y * sm, 0), Math.hypot(r + bs.radius * sm, (y1 - y0) / 2 + bs.radius * sm));
          n.name = 'crowd'; n.frustumCulled = true; n.castShadow = false; n.receiveShadow = true; n.position.set(cx, 0, cz); n.updateMatrix(); n.matrixAutoUpdate = false; grp.add(n);
        }
      }
    }

    pkCrowd7(K);   // (round 7: the spectators react to the car, camera flashes, the groups for the cheer's sound)

    pkWeather(K);

    pkAmbient(K);

    pkSummit6(K);

    pkMoving(K);

    out.stats = { trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, rails: +(nRail / (2 * N)).toFixed(3) };   // (read by the tests)
    return out;
  }

  Object.assign(API, { pkAmbientUpdate, pkGround, pkGroundMat, pkMovingUpdate, pkOpsUpdate, pkSummitUpdate, pkTex, pkWeatherUpdate, pkWildlifeUpdate });   // (what World and the other worlds use of this one)
  Object.defineProperties(API, { PK: { get: () => PK, set: (v) => { PK = v; } }, pkGMean: { get: () => pkGMean, set: (v) => { pkGMean = v; } } });
  World.ext.pikes = (scene, tex, opts) => buildPikes(scene, tex, opts);
})();
