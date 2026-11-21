// WORLD — realizem 15: Hiva, Uzbekistan (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road and the track's own world (js/world-hiva.js) does not draw yet.
// Hooked by four calls in the track's own builder (js/world-hiva.js; this file loads right after it and is called while the world is built):
// World.api.hvPad (the ground under the pond), hvFree (no trees on the water, the parking and the small things), hvHouse (the building by
// the pond) and hvDraw (all the rest).
// Drawn: the pond (way 699881027: level water, the ground under it and round it shaped to that level), the building on its western shore
// by its own outline instead of the world's box over the water (way 785693077), the ground of the park (785714852) with the dry fountain
// (785693079), of the asphalt parking (785714853), of the seven gardens (380415572, 380415576, 380415577, 380415578, 380415580, 380415582,
// 380415583), of the three grass areas (785714839, 785714840, 1038066627) and of the paved square (380277865), the walls (380415570,
// 1039133969, 1039133970, 1039133976, 1039133980, 1039133981, 1092293978) and the fences (1039133971, 1039133972, 1039133982) as far as
// 60 m from the road, the five shelters (nodes 11945330687, 11945330721, 11945330737, 11945330761, 11945330762) and the three benches
// (nodes 14173575859, 14173618375, 14173639892).
// Not drawn again (the Hiva world has them): the houses, the city walls with their towers and gates, the minarets, the retaining wall
// (380415568), the piece of the wall 1039133981 by the road, the trees and the bushes, the crossings; the side roads are Realizem E (#793).
// Not drawn at all, said in the pull request: the venues (the legal rule), the footways and the steps, the reservoir (1075109641, 58.6 m
// away behind a building), the cemeteries, the playground, the memorials, the bus stops, the gate leaves, the block and the bumps on the road.
// Assumed and said so in the pull request: the level of the water and its colour, the greener ground of the park, the gardens and the
// grass, the tones of the asphalt and of the paving, the height of the walls (as the world's mud-brick wall), the form of the fences, of
// the shelters and of the benches.
// Drawn into the scenery chunks (scen.get): one new draw call (the water), else only vertices.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, { GB, NRC, box, clamp, inPoly, nrDist, nrGH, nrGround, nrNear, polyDist, rng, valueNoise2, vary, waterMat } = A;
  let T; A.sync.push(() => { ({ T } = A); });
  const pts = (f) => { const o = []; for (let i = 0; i < f.length; i += 2) o.push([f[i], f[i + 1]]); return o; };

  /* ---- the outlines and the points of OSM (metres from the start line, x east, z south; the closed ones without the last point again) ---- */
  const POND = pts([320.3, -565.7, 341.8, -568, 358.4, -569.6, 362.7, -570.1, 364.8, -569.5, 365.6, -567.8, 366.6, -562.2, 368.5, -546.8, 369.8, -537.6, 370.5, -529.7, 370.4, -526.5, 369.2, -524.9, 366.8, -524.5, 361.4, -524, 338.8, -522.2, 319.5, -520.8, 313.9, -520.3, 312.5, -520.6, 311.6, -521.9, 311.1, -525.1, 311.2, -527, 311.9, -528.4, 313.2, -528.9, 317.3, -529.5, 320.7, -530.2, 323.6, -532.8, 325.6, -536, 326, -540.4, 325.3, -544.6, 322.9, -547.7, 319.8, -550.5, 315.3, -552.2, 312.3, -553.4, 310.9, -555.1, 310, -558.1, 309.8, -562.2, 310.2, -563.9, 311.8, -564.8, 314.2, -565.2]);
  const HOUSE = pts([307.7, -565.5, 339.2, -569.4, 338.3, -577.1, 306.6, -574, 307.3, -567.2, 304.1, -566.5, 301.9, -583.3, 260.8, -568.6, 258.2, -532.2, 308.2, -530.4, 313.7, -530.1, 320.2, -531.6, 322.9, -536.5, 323.3, -541.1, 322.2, -546.3, 317.8, -549.6, 312.4, -550.2, 308.9, -550.6]);
  const FOUNTAIN = pts([197.1, -516.7, 197.2, -514, 195.3, -511.6, 198.1, -509.4, 198, -506.9, 200.3, -506.8, 201.9, -505, 204, -506.9, 207.1, -506.9, 207.1, -510, 209.4, -511.6, 207.1, -513.3, 207.2, -516.4, 204.1, -516.5, 202.6, -518.9, 201, -516.8]);
  const PARK = pts([103, -497.7, 102.4, -493.7, 200.1, -491.3, 209.4, -493.2, 220.4, -498.9, 230.2, -507.1, 233.6, -510.4, 259.6, -508.9, 261.1, -527.8, 236.3, -530.3, 238.4, -559.1]);
  const PARKING = pts([76.8, -188.8, 100.8, -178.8, 102.2, -186.6, 104.7, -194, 110.2, -198.7, 113.5, -200.2, 115.2, -209, 111, -211.5, 109.4, -222, 102, -225.4, 94.5, -228.8, 81.7, -200]);
  const GARDENS = [
    [37.6, -166.4, 31, -148.8, 41.8, -144.1, 44.1, -148.7, 49.7, -161.9],
    [16, -167.4, 12.1, -156.9, 27.6, -150.2, 34, -167.8, 25.2, -171.1, 21.1, -167.9],
    [-1.3, -181.1, -7.5, -165.4, 8.3, -158.6, 12.3, -169, 8.8, -172.7, 7.4, -177.8],
    [54.9, -196.1, 45.5, -187.2, 39.9, -172.5, 52.2, -167.9, 59.2, -184.6, 62.8, -193.1],
    [25.8, -193.9, 22.7, -185.7, 26.2, -182.5, 27.2, -177.2, 36.2, -173.8, 41.6, -188.6],
    [6.2, -200.4, 0.9, -186.9, 9.6, -183.7, 14.1, -186.4, 19.1, -187, 22.2, -195.1],
    [3.2, -201.5, -5.4, -204.3, -13.7, -192.3, -2.4, -188.1]].map(pts);
  const GRASS = [
    [374, -547.7, 376.9, -512, 412.6, -514.7, 404.2, -539.9, 396.6, -542.5, 391.3, -546.4, 387.1, -548.6],
    [419.2, -552.8, 416.8, -546.8, 413.7, -543.5, 423.6, -515.8, 429.4, -516.2, 443.2, -555.5],
    [848.8, 38.4, 849.1, 44.4, 973.1, 38.6, 972.9, 32.6]].map(pts);
  const PAVING = pts([30, -73.2, 37.5, -70.4, 43.2, -68.3, 53.2, -95.5, 56.8, -94.2, 64.2, -115.7, 60.9, -116.9, 68.5, -137.6, 77.1, -134.7, 78.9, -139, 76.4, -138.8, 74.3, -139.3, 73.1, -141.2, 74.8, -146.2, 78.2, -147, 78.6, -147.8, 80, -150.7, 79, -151.7, 78, -153.6, 79, -155.5, 80.4, -156.2, 83.2, -156.7, 84.3, -155.6, 84.4, -154.7, 92.3, -152, 95.2, -155.8, 98.6, -158.6, 106.5, -175.2, 62.8, -193.1, 59.2, -184.6, 52.2, -167.9, 51, -164.9, 49.7, -161.9, 44.1, -148.7, 41.8, -144.1, 53.9, -136.8, 30.4, -74.3]);
  const WALLS = [   // (1092293978 is a closed line; of 1039133981 only the piece the world does not draw)
    [139.1, -213.6, 178.3, -193.5],
    [74.8, 443.6, 122.7, 301.1],
    [198.1, 510.3, 209.2, 495.2, 236.5, 419.8, 263.1, 345.5],
    [-149.8, 233.7, -177, 225.6, -199.7, 284.4, -102.6, 322.5, -99, 310.8, -96.2, 301.5, -82.3, 256, -91.4, 252.9],
    [-99, 310.8, -42.9, 332.3, -27.2, 275.3],
    [647.5, -358.7, 579.5, -175.1, 581.9, -169.7, 579.5, -161.2, 674.4, -116.8, 696.1, -146, 808.4, -81.6, 826, -132.8, 768.2, -227.9, 757.4, -211.7, 748.8, -217.8, 727.1, -182.9, 670.3, -222.2, 729.5, -313, 647.5, -358.7],
    [-82.3, 256, -76.5, 254.8]];
  const FENCES = [   // (1039133982 with a 3 m gap at its gate, node 9569246625)
    [122.7, 301.1, 183.4, 321.3],
    [263.1, 345.5, 237, 336.7],
    [-70.7, 236.1, -58.6, 239.8],
    [-55.8, 240.6, -20.7, 251.3, -27.2, 275.3]];
  const SHELTERS = [[202, 278.6], [125.4, 253.1], [53.6, 229.1], [-37, 181.6], [-7.2, 85.8]];
  const BENCHES = [[73.8, -70], [83.8, -93.9], [86, -106.2]];
  const WIN = [[0.3, 0.28, 0.26], [0.36, 0.32, 0.28], [0.28, 0.36, 0.4]];   // (the windows of the world's houses)
  const LIFT = 0.04;   // (the patches over the ground: under the verges, +0.06, and under the side roads of Realizem E, +0.07)

  /* ---- polygons: triangles, clipping, the pieces lying in one triangle of the terrain mesh each ---- */
  const area = (p) => { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += p[j][0] * p[i][1] - p[i][0] * p[j][1]; return Math.abs(a) / 2; };
  const tris = (con, holes) => {
    const all = con.concat(...(holes || [])), V = (p) => new THREE.Vector2(p[0], p[1]);
    return THREE.ShapeUtils.triangulateShape(con.map(V), (holes || []).map(h => h.map(V))).map(([a, b, c]) => [all[a], all[b], all[c]]);
  };
  const cut = (poly, a, b, c) => {   // the part of a convex polygon where a·x + b·z + c ≥ 0
    const o = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], dp = a * p[0] + b * p[1] + c, dq = a * q[0] + b * q[1] + c;
      if (dp >= 0) o.push(p);
      if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); o.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return o;
  };
  const pieces = (G, tri, fn) => {   // fn(piece, i, j, half): the terrain cell (i, j) and which of its two triangles (as nrGround)
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of tri) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    const i0 = Math.floor((x0 - G.x0) / NRC), i1 = Math.floor((x1 - G.x0) / NRC), j0 = Math.floor((z0 - G.z0) / NRC), j1 = Math.floor((z1 - G.z0) / NRC);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const xa = G.x0 + i * NRC, za = G.z0 + j * NRC, p = cut(cut(cut(cut(tri, 1, 0, -xa), -1, 0, xa + NRC), 0, 1, -za), 0, -1, za + NRC); if (p.length < 3) continue;
      const a = cut(p, -1, -1, xa + za + NRC), b = cut(p, 1, 1, -(xa + za + NRC));
      if (a.length >= 3) fn(a, i, j, 0);
      if (b.length >= 3) fn(b, i, j, 1);
    }
  };
  const off = (x, z) => { const n = nrNear(x, z); return (n.i < 0 ? 999 : n.dd) - 3.3; };   // (≥ 0: off the road, its barriers and its verges)
  const cutOff = (poly) => {   // the part of a small polygon off the road
    const f = poly.map(p => off(p[0], p[1])); if (f.every(v => v >= 0)) return poly; if (f.every(v => v < 0)) return [];
    const o = [];
    for (let i = 0; i < poly.length; i++) {
      const k = (i + 1) % poly.length, p = poly[i], q = poly[k];
      if (f[i] >= 0) o.push(p);
      if ((f[i] >= 0) !== (f[k] >= 0)) {
        let a = p, b = q; const fa = f[i] >= 0;
        for (let s = 0; s < 8; s++) { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if ((off(m[0], m[1]) >= 0) === fa) a = m; else b = m; }
        o.push(fa ? a : b);
      }
    }
    return o;
  };

  /* ---- the pond: level water under the lowest ground beside it; the grid of the terrain shaped to it (the shore on the outline of OSM) ---- */
  let pond = null;   // (of the build in hand: the level and the triangles of the water)
  A.hvPad = (P) => {
    const G = P.G, p0 = P.pad, tr = tris(POND), ov = new Map(), tg = new Map(), cand = new Set();
    for (const t of tr) pieces(G, t, (p, i, j, h) => { const k = (j * G.nx + i) * 2 + h; ov.set(k, (ov.get(k) || 0) + area(p)); });
    for (const [k2, a] of ov) if (a > 0.5) { const c = k2 >> 1; for (const k of (k2 & 1 ? [c + G.nx + 1, c + G.nx, c + 1] : [c, c + 1, c + G.nx])) cand.add(k); }
    const X = (k) => G.x0 + (k % G.nx) * NRC, Z = (k) => G.z0 + Math.floor(k / G.nx) * NRC;
    let W = 1e9;   // (the lowest ground round the water, the building's side left out: the elevation model is not the ground there)
    for (const c of cand) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const k = c + dj * G.nx + di, x = X(k), z = Z(k); if (inPoly(POND, x, z) || inPoly(HOUSE, x, z) || polyDist(HOUSE, x, z) < 4) continue;
      W = Math.min(W, nrGH(k % G.nx, Math.floor(k / G.nx)));
    }
    W -= 0.15;
    for (const k of cand) {   // in the water down to 0.3 m under it, on the shore up to 0.3 m over it, under the building no lower than the shore
      const x = X(k), z = Z(k), d = Math.min(0.3, 0.1 * polyDist(POND, x, z));
      tg.set(k, inPoly(HOUSE, x, z) ? [1, W + 0.15] : inPoly(POND, x, z) ? [-1, W - d] : [0, W + d]); G.h[k] = NaN;
    }
    pond = { W, tr };
    return (x, z, h) => {
      if (p0) h = p0(x, z, h);
      const t = tg.get(Math.round((z - G.z0) / NRC) * G.nx + Math.round((x - G.x0) / NRC));
      return !t ? h : t[0] > 0 ? Math.max(h, t[1]) : t[0] < 0 ? Math.min(h, t[1]) : t[1];
    };
  };

  /* ---- where the world's trees do not grow: the water, the asphalt of the parking, the fountain, the shelters and the benches ---- */
  A.hvFree = () => {
    const o = [];
    const fill = (poly, r, pad) => {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of poly) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      for (let x = x0; x < x1 + 4; x += 4) for (let z = z0; z < z1 + 4; z += 4) if (inPoly(poly, x, z) || polyDist(poly, x, z) < pad) o.push([x, z, r]);
    };
    fill(POND, 3.6, 1.5); fill(PARKING, 3.2, 0); o.push([202, -511.6, 7.5]);
    for (const [x, z] of SHELTERS) o.push([x, z, 2.5]);
    for (const [x, z] of BENCHES) o.push([x, z, 2.5]);
    return o;
  };

  /* ---- the building by the pond (way 785693077) by its outline; the height, the colours and the windows as the world's house box ---- */
  A.hvHouse = (g, bx, bz, y0, hh, wc, R) => {
    if (Math.abs(bx - 299) > 0.5 || Math.abs(bz + 557.1) > 0.5) return false;
    R();   // (the one draw of the world's house box: the colours of the houses after it stay as they were)
    const n = HOUSE.length, win = WIN[Math.floor(A.crH(bx, bz, 13) * WIN.length)], par = wc.map(v => v * 0.93);
    let sa = 0, yb = y0 - 0.5;
    for (let i = 0; i < n; i++) { const p = HOUSE[i], q = HOUSE[(i + 1) % n]; sa += p[0] * q[1] - q[0] * p[1]; yb = Math.min(yb, nrGround(p[0], p[1]) - 0.3, nrGround((p[0] + q[0]) / 2, (p[1] + q[1]) / 2) - 0.3); }
    const lv = [[yb, wc]]; for (let f = 1; f <= Math.round(hh / 3.1); f++) { const a = y0 + f * 3.1 - 1.9; lv.push([a, win], [a + 0.9, wc]); }   // (the rows of windows)
    lv.push([y0 + hh, par], [y0 + hh + 0.5, null]);
    for (let i = 0; i < n; i++) {
      const p = HOUSE[i], q = HOUSE[(i + 1) % n], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, s = sa > 0 ? 1 : -1, ox = s * (q[1] - p[1]) / l, oz = -s * (q[0] - p[0]) / l;   // (out of the building)
      for (let k = 0; k + 1 < lv.length; k++) {
        const ya = lv[k][0], yc = lv[k + 1][0];
        g.quadO([p[0], ya, p[1]], [q[0], ya, q[1]], [q[0], yc, q[1]], [p[0], yc, p[1]], lv[k][1], [(p[0] + q[0]) / 2 - ox, (ya + yc) / 2, (p[1] + q[1]) / 2 - oz]);
      }
    }
    const top = [0.72, 0.64, 0.52], yt = y0 + hh + 0.5;
    for (const [a, b, c] of tris(HOUSE)) g.triUp([a[0], yt, a[1]], [b[0], yt, b[1]], [c[0], yt, c[1]], [top, top, top]);
    return true;
  };

  /* ---- the rest, into the scenery chunks: the ground patches, the water, the walls, the fences, the shelters, the benches ---- */
  A.hvDraw = (scen, out, tex) => {
    const G = A.NR.G, R = rng(1860), n1 = valueNoise2(1861, 6), n2 = valueNoise2(1862, 21);
    const cov = (x, z) => {   // the trees' crowns over the ground (the grid of the terrain's own shade)
      const C = G.cov; if (!C) return 0;
      const gx = clamp((x - G.x0) / NRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / NRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, k = j * G.nx + i;
      return clamp((C[k] * (1 - u) + C[k + 1] * u) * (1 - v) + (C[k + G.nx] * (1 - u) + C[k + G.nx + 1] * u) * v, 0, 1);
    };
    const tone = (c, amt) => (x, z) => { const k = (1 + (n1(x, z) - 0.5) * amt + (n2(x, z) - 0.5) * amt) * (1 - 0.25 * cov(x, z)); return [c[0] * k, c[1] * k, c[2] * k]; };
    const put = (poly, colf) => {   // a small polygon in one triangle of the terrain, laid on it
      if (poly.length < 3) return;
      const v = poly.map(p => [p[0], nrGround(p[0], p[1]) + LIFT, p[1]]), c = poly.map(p => colf(p[0], p[1])), g = scen.get(poly[0][0], poly[0][1]);
      for (let i = 1; i + 1 < v.length; i++) {
        if (Math.abs((v[i][0] - v[0][0]) * (v[i + 1][2] - v[0][2]) - (v[i + 1][0] - v[0][0]) * (v[i][2] - v[0][2])) < 2e-3) continue;
        g.triUp(v[0], v[i], v[i + 1], [c[0], c[i], c[i + 1]]);
      }
    };
    const patch = (con, holes, col, amt) => {   // an area of OSM as a patch on the terrain: a whole triangle of the mesh where the area covers it
      const B = new Map(), colf = tone(col, amt), H = NRC * NRC / 2;
      for (const t of tris(con, holes)) pieces(G, t, (p, i, j, h) => { const k = (j * G.nx + i) * 2 + h; let b = B.get(k); if (!b) B.set(k, b = { a: 0, p: [], i, j, h }); b.a += area(p); b.p.push(p); });
      for (const b of B.values()) {
        const xa = G.x0 + b.i * NRC, za = G.z0 + b.j * NRC;
        if (b.a > H - 0.01) put(cutOff(b.h ? [[xa + NRC, za + NRC], [xa, za + NRC], [xa + NRC, za]] : [[xa, za], [xa + NRC, za], [xa, za + NRC]]), colf);
        else for (const p of b.p) put(cutOff(p), colf);
      }
    };
    patch(PARKING, null, [0.4, 0.4, 0.41], 0.06);
    for (const p of GARDENS) patch(p, null, [0.4, 0.47, 0.25], 0.16);
    patch(PARK, [FOUNTAIN], [0.43, 0.5, 0.27], 0.14);
    patch(FOUNTAIN, null, [0.76, 0.73, 0.68], 0.05);   // (fountain=dry: flat stone, no water)
    for (const p of GRASS) patch(p, null, [0.46, 0.52, 0.28], 0.14);
    patch(PAVING, null, [0.7, 0.67, 0.62], 0.06);

    if (pond) {   // the water: the game's shared water (waterMat), one mesh
      const gw = new GB(true), wc = [1, 1, 1], W = pond.W, Q = (p) => [p[0], W, p[1]], uv = (p) => [p[0] / 16, -p[1] / 16];
      for (const [a, b, c] of pond.tr) gw.triO(Q(a), Q(b), Q(c), wc, [a[0], W - 5, a[1]], wc, wc, uv(a), uv(b), uv(c));
      const wm = new THREE.Mesh(gw.geometry(), waterMat(tex, { plain: true, color: 0x41554a, len: 0.7, amp: 0.7, refl: 0.45, land: 0.9, shal: 0, lap: 0.4, surf: 0 }));   // (standing water: a murky green, hardly a wave)
      wm.receiveShadow = true; wm.matrixAutoUpdate = false; wm.updateMatrix(); wm.name = 'hiva pond'; out.root.add(wm); out.dyn.water = tex.water;
    }

    // the lines: in pieces, those within 60 m of the road and clear of its barriers
    const line = (f, step, fn) => {
      for (let q = 0; q + 3 < f.length; q += 2) {
        const ax = f[q], az = f[q + 1], dx = f[q + 2] - ax, dz = f[q + 3] - az, n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / step));
        for (let k = 0; k < n; k++) fn(ax + dx * k / n, az + dz * k / n, ax + dx * (k + 1) / n, az + dz * (k + 1) / n);
      }
    };
    const clear = (x, z) => { const n = nrNear(x, z); return !(n.i >= 0 && n.dd < 0.8); };
    const near = (ax, az, bx, bz) => nrDist((ax + bx) / 2, (az + bz) / 2) <= 60 && clear(ax, az) && clear(bx, bz) && clear((ax + bx) / 2, (az + bz) / 2);
    for (const f of WALLS) line(f, 6, (ax, az, bx, bz) => {   // the walls, as the world's mud-brick wall
      if (!near(ax, az, bx, bz)) return;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2, gm = nrGround(mx, mz), y = Math.min(gm, nrGround(ax, az), nrGround(bx, bz)) - 0.4;
      box(scen.get(mx, mz), mx, y, mz, Math.hypot(bx - ax, bz - az) + 0.2, gm + 1.4 - y, 0.45, Math.atan2(bz - az, bx - ax), vary([0.82, 0.7, 0.54], R, 0.04), [0.86, 0.75, 0.58], true);
    });
    const FC = [0.62, 0.62, 0.6];
    const post = (g, x, z, ang) => box(g, x, nrGround(x, z) - 0.2, z, 0.09, 1.8, 0.09, ang, FC, null, true);
    let ex = NaN, ez = NaN;   // (the end of the piece drawn last: its post stands already)
    for (const f of FENCES) line(f, 6, (ax, az, bx, bz) => {   // the fences: posts every ~3 m and two rails
      if (!near(ax, az, bx, bz)) return;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2, g = scen.get(mx, mz), ang = Math.atan2(bz - az, bx - ax), len = Math.hypot(bx - ax, bz - az), y = (nrGround(ax, az) + nrGround(bx, bz)) / 2;
      if (!(Math.abs(ax - ex) < 0.01 && Math.abs(az - ez) < 0.01)) post(g, ax, az, ang);
      post(g, mx, mz, ang); post(g, bx, bz, ang); ex = bx; ez = bz;
      for (const h of [0.5, 1.2]) box(g, mx, y + h, mz, len, 0.07, 0.04, ang, FC, null, true);
    });

    const BL = typeof HV_DATA !== 'undefined' && HV_DATA.bld || [];
    const inHouse = (x, z) => {   // (in one of the world's house boxes)
      for (const [bx, bz, Lb, Wb, ang] of BL) { const dx = x - bx, dz = z - bz, c = Math.cos(ang), s = Math.sin(ang); if (Math.abs(dx * c + dz * s) < Lb / 2 + 0.6 && Math.abs(dz * c - dx * s) < Wb / 2 + 0.6) return true; }
      return false;
    };
    for (const [x, z] of SHELTERS) {   // the shelters: four posts and a flat roof, along the road
      const n = nrNear(x, z), i = n.i; if (i < 0 || n.dd < 1.5 || inHouse(x, z)) continue;
      const ang = Math.atan2(T.tz[i], T.tx[i]), c = Math.cos(ang), s = Math.sin(ang), y = nrGround(x, z), g = scen.get(x, z);
      for (const [lx, lz] of [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]]) { const px = x + lx * c - lz * s, pz = z + lx * s + lz * c, yp = nrGround(px, pz) - 0.2; box(g, px, yp, pz, 0.1, y + 2.3 - yp, 0.1, ang, [0.56, 0.56, 0.57], null, true); }
      box(g, x, y + 2.3, z, 3.4, 0.12, 2.4, ang, vary([0.85, 0.83, 0.78], R, 0.04), null);
    }
    for (const [x, z] of BENCHES) {   // the benches: a seat and a back, along the road and facing it
      const n = nrNear(x, z), i = n.i; if (i < 0 || n.dd < 1 || inHouse(x, z)) continue;
      const ang = Math.atan2(T.tz[i], T.tx[i]), c = Math.cos(ang), s = Math.sin(ang), y = nrGround(x, z), g = scen.get(x, z), wood = vary([0.52, 0.38, 0.24], R, 0.06);
      const back = (-s * (x - T.px[i]) + c * (z - T.pz[i])) >= 0 ? 0.2 : -0.2;   // (the side away from the road)
      box(g, x, y + 0.4, z, 1.8, 0.06, 0.45, ang, wood, null, true);
      box(g, x - back * s, y + 0.46, z + back * c, 1.8, 0.4, 0.05, ang, wood, null, true);
      for (const lx of [-0.8, 0.8]) box(g, x + lx * c, y - 0.1, z + lx * s, 0.06, 0.5, 0.4, ang, [0.4, 0.4, 0.42], null, true);
    }
  };
})();
