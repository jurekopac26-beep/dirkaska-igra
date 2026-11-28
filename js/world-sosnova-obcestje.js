/* =====================================================================================================================================
   WORLD — Sosnová, Češka: the roads by the circuit (grafika ob progi), from OpenStreetMap, on js/world-sosnova.js (the builder's hook
   LK.extra wrapped: what is here is laid out first, so the alders, the woods' trees and the crowds keep clear of it, then
   js/world-sosnova.js's own parts: the streams, the power lines, the paddock's buildings).
   Drawn: the public roads round the circuit (OSM highway=primary/tertiary/unclassified/service within ~160 m), as OSM has them run and
     meet (every road ends at a node it shares with the next one: the junctions as in OSM): the main road I/9 to the west (surface=asphalt;
     2 lanes, its one-lane roadways either side of the islands, 4 lanes at the crossroads to the north), the local road 00913 round the
     north and the east (surface=asphalt, lane_markings=no: no lines; one lane each way round an island at the crossroads), the asphalt
     roads to the south (unclassified, lane_markings=no), the service roads (no surface tag: asphalt, assumed) and the car park by the road
     to the north (OSM amenity=parking, parking=street_side, no surface tag: asphalt, as its aisle, assumed); the bus stops' poles with a
     blank plate (OSM highway=bus_stop within ~60 m, shelter=no, bench=no; no text).
     Widths (OSM has no width tags here): made as the main road's are, from OSM's lanes tag × the lane widths of ČSN 73 6101 (the I/9: 3.5 m
     lanes and 0.75 m of paved edge each side, so 5.0, 8.5 and 15.5 m for 1, 2 and 4 lanes; the 00913: 2.75 m lanes and 0.25 m, 6.0 m for
     its 2); with no lanes tag by the road's class (the unclassified 4.8 m, the service roads 3.5 m, the aisle 5.0 m: assumed). Where a road
     meets narrower ones end to end it narrows to them over up to 30 m, and where it splits in two these start side by side across its
     end, not both on the one point OSM joins them at (assumed: the lanes' own tapers are not in OSM).
   Kept open (docs/realizem.md: only from sources): the I/9's bridge west of the circuit (OSM bridge=yes, layer=1: no height; the terrain
     model there holds only a few metres of it), so the main road is drawn only where it lies on the ground (its embankment too).
   Also drawn: the noise barrier by the I/9 and the two fences nearest the circuit at the west (OSM wall=noise_barrier, barrier=fence; no
     height in OSM: 3 m and 2 m, assumed; docs/proge/sosnova-raziskava.md).
   Not drawn again: the raceway's own links across the infield (deliberately left out, js/tracks/sosnova.js), the streams, the power lines
     and the buildings (js/world-sosnova.js); a road inside the barriers.
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-22; metres, origin = the junction where the route
   starts, x east, z south (tools/sosnova/sosnova.json's lat0/lon0); the lines simplified to 0.25 m.
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.sosnova;
  if (!LK || typeof LK.extra !== 'function') return;

  // the bus stops: x, z, ...; the car park: its outline; the roads: [class, lanes, x0, z0, ...]: class 0 the I/9 (OSM primary), 1 the local
  // road 00913 (tertiary), 2 the asphalt roads without a class (unclassified), 3 the service roads, 4 the car park's aisle; lanes as OSM's
  // lanes tag (0: none)
  // the noise barrier by the I/9 (OSM wall=noise_barrier, w909569871: no height, no material tag: 3 m of grey panels, assumed) and the two
  // fences nearest the circuit (OSM barrier=fence, ~15 m and ~35 m from the road at the west: no height, no material: a 2 m wire fence on
  // steel posts, assumed); the third fence of the data, round the north and the east, is ~96 m off and left out (beyond the 60 m)
  const WALL = [-297.7,-11,-292.8,-53.1,-287.5,-89.3,-283.2,-112.7,-278.5,-134.1,-273.3,-154.1];
  const FENCE = [[-284.3,-56.7,-277.6,-115,-254,-189], [-128,34.5,-244.7,25.6,-271.4,3.9,-284.3,-56.7]];
  const STOP = [-82.1, -286.5, 175.4, -41.2, 204.2, -4.7];
  const PARK = [[-71.9,-295.5,-37.9,-284.5,-34.7,-273.2,-77.8,-286.6,-75.6,-293.1]];
  const WAYS = [
    [1,0,-150,-302.2,-111.7,-289.4,-15.3,-258.6,13.5,-243.9,40.9,-220.6,70.1,-186.7,85.2,-158,110.4,-100.1,138.4,-65,209.4,-7.9,244,6.6,300.5,17.6,368,25.4],
    [0,4,-228.3,-275.2,-204.7,-315.4],
    [0,1,-228.3,-275.2,-254.2,-237.7,-279.6,-191.3],
    [0,2,-322.8,-28.7,-323.6,3.2,-325.5,36.5,-327.9,64.6,-331.5,94.5],
    [0,2,-317.8,100.6,-305.8,4.3],
    [2,0,-377.1,91,-349,96.2,-310.6,112.4],
    [2,0,59.4,59.6,137.8,86.3,156.3,87.2,180.4,83.3,197.1,79.7,202,59.6,200.7,32.6,182.7,-29.4],
    [2,0,-268.5,130.6,-249.1,131.7,-197.4,121.5,-183.6,104.3,-155.6,46.3,-134.1,35.2,59.4,59.6],
    [0,1,-333.6,112.1,-351.6,218.1],
    [0,1,-344.4,218.4,-333.6,112.1],
    [3,0,-334.4,-124.2,-310.9,-164.3,-305.7,-194.9,-299.7,-209.4,-258.8,-256.4,-242.6,-283.8,-236.8,-301.6,-239.1,-323.5,-239,-327.5],
    [3,0,-17.3,-392.6,21.7,-300,28.6,-281.5,27.2,-272.5,18,-259.7,7.3,-247],
    [4,0,-111.7,-289.4,-108.6,-298.4,-96,-296.4,-75.9,-290.9,-40.9,-277.2,-39.6,-266.4],
    [0,2,-352.9,104.4,-353.6,124.2],
    [0,2,-279.6,-191.3,-313.7,-126,-326.4,-95.9,-335.3,-68.1,-344.2,-32,-348.5,4.3],
    [0,4,-199.6,-323.3,-124.4,-429.7],
    [0,1,-290.9,-98,-284.6,-128.3,-274.9,-163.4,-268.3,-182.9,-257.6,-211.4,-228.3,-275.2],
    [1,1,-199.6,-323.3,-235.2,-332.8,-254.1,-339],
    [2,0,-310.6,112.4,-301.4,117.8,-268.5,130.6],
    [0,4,-204.7,-315.4,-199.6,-323.3],
    [1,1,-204.7,-315.4,-187.4,-309.4,-150,-302.2],
    [1,1,-150,-302.2,-168.3,-311.3,-199.6,-323.3],
    [1,1,-275.1,-337.7,-258.2,-333.6,-239,-327.5,-204.7,-315.4],
    [0,2,-305.8,4.3,-299.5,-47.5,-295.9,-71.7,-290.9,-98],
    [0,2,-331,190.5,-320.2,117.7],
    [0,2,-348.5,4.3,-350.3,25.3,-352.6,88]
  ];
  // each class: its lane's width and its paved edge each side, as the main road's are made (ČSN 73 6101: the I/9 as S 9.5, 3.5 m lanes, a
  // 0.25 m guiding strip and a 0.5 m paved shoulder; the 00913 as S 6.5, 2.75 m lanes and a 0.25 m strip), its width with no lanes tag (the
  // 00913: 2 lanes; the others assumed), its colour over the asphalt's picture (the I/9 of 2011 darker and even, the small roads paler)
  const CL = [[3.5, 0.75, 8.5, [0.8, 0.8, 0.83]], [2.75, 0.25, 6, [0.9, 0.9, 0.92]], [0, 0, 4.8, [0.95, 0.95, 0.96]], [0, 0, 3.5, [0.99, 0.98, 0.97]],
    [0, 0, 5, [1, 1, 1]]];
  // the 00913's one-lane branches at the junction with the I/9 (each arm split in two round an island): 0 by the rule above (3.25 m,
  // picture a); 5 as wide as the I/9's one-lane roadways (picture b)
  const BRANCH = 0;
  // a road's width: its lanes × its class's lane width and the two paved edges; with no lanes tag, its class's width
  const wide = (W) => { const [lw, e, w0] = CL[W[0]]; return W[0] === 1 && W[1] === 1 && BRANCH ? BRANCH : W[1] ? W[1] * lw + 2 * e : w0; };
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  const PK = [1.02, 1.02, 1.04], POLE = [0.62, 0.64, 0.66], PLATE = [0.94, 0.94, 0.92];
  // smooth patches (value noise on a 9 m lattice, from the place alone: the same every time, no draw from the world's random numbers)
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => {
    const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
  const tone = (c, x, z) => { const f = 0.95 + 0.08 * patch(x + 500, z); return [c[0] * f, c[1] * f, c[2] * f]; };

  const base = LK.extra;
  LK.extra = function (o) { const mine = lay(o); const st = base(o) || {}; st.roadside = mine; return st; };
  // the car parks' camp cells (js/world-rbring.js lays them before this scenery) keep off these roads: none whose 16 m square (11 m to its
  // corners) would reach the asphalt (the land cover's built-up cells lie over the I/9 at the junction and along it to the south-west)
  LK.lotOk = (x, z) => { for (const W of WAYS) { const m = wide(W) / 2 + 11; for (let q = 2; q + 3 < W.length; q += 2) if (segD(x, z, W[q], W[q + 1], W[q + 2], W[q + 3]) < m) return false; } return true; };

  function lay(o) {
    const { root, scen, exclPush, CR, tex } = o, { RB, nrGround, nrNear, box } = A, cyl = A.cyl;
    const st = { ways: 0, wayM: 0, narrowed: 0, split: 0, parkCells: 0, stops: 0, meshes: 0 };
    const past = (x, z, m) => { const n = nrNear(x, z); return n.i < 0 || n.dd >= m; };
    const near = (x, z, m) => { const n = nrNear(x, z); return n.i >= 0 && n.dd < m; };
    // what is laid on the ground goes into a mesh per 120 m square, so three.js leaves out of the frame what is out of view
    const TILE = 120, tiles = new Map();
    const rbAt = (x, z) => { const key = Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let t = tiles.get(key); if (!t) tiles.set(key, t = new RB(true)); return t; };

    // the roads: rows of two across (the left and the right edge), every 2.5 m along, on the ground; cut where they run inside the barriers;
    // a stretch goes into the tile of the row it ends at (the row before it copied there when the tile or the mesh changes). Within FADE m
    // of a cut or of a free end (one that meets no other road drawn here: the I/9 at its bridge, the edge of the data) the asphalt fades
    // out: those stretches go into a see-through mesh per tile, so no road stops with a hard edge in the grass
    const FADE = 20, tilesF = new Map();
    const rbFade = (x, z) => { const key = Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let t = tilesF.get(key); if (!t) tilesF.set(key, t = new RB(true, true)); return t; };
    const joined = (W, x, z) => {   // the parking aisles end in the car park; any other end must meet another way
      if (W[0] === 4) return true;
      for (const V of WAYS) if (V !== W) for (let q = 2; q + 3 < V.length; q += 2) if (segD(x, z, V[q], V[q + 1], V[q + 2], V[q + 3]) < 1.5) return true;
      return false;
    };
    // at an end, the width of the roads of its class that end there too, together (0: none): where a road meets narrower ones end to end
    // (the I/9's 4 lanes split into its two one-lane roadways, its 2 lanes merged into 1) it narrows to that over up to 30 m (half of it)
    const endW = (W, x, z) => { let w = 0; for (const V of WAYS) if (V !== W && V[0] === W[0]) for (const q of [2, V.length - 2]) if (Math.hypot(V[q] - x, V[q + 1] - z) < 0.5) w += wide(V); return w; };
    // at an end where a road splits in two narrower ones of its class (the I/9's 4 lanes into its two one-lane roadways round an island,
    // the 00913's 2 lanes into its junction branches; OSM starts both at one point): the other one, how far apart their lines must be to
    // lie side by side over the wider one's end, and which way across (along the rows' normal) this one keeps clear of the other (null:
    // no split there). They keep that far apart until OSM's lines are, then follow them: the island opens where they part
    const split = (W, atEnd) => {
      const q = atEnd ? W.length - 2 : 2, x = W[q], z = W[q + 1], at = [];
      for (const V of WAYS) if (V[0] === W[0]) for (const p of [2, V.length - 2]) if (Math.hypot(V[p] - x, V[p + 1] - z) < 0.5) {
        const r = p === 2 ? 4 : V.length - 4, ux = V[r] - x, uz = V[r + 1] - z, l = Math.hypot(ux, uz) || 1;
        at.push({ V, w: wide(V), ux: ux / l, uz: uz / l });
      }
      const B = at.reduce((b, a) => (a.w > b.w ? a : b), at[0]), sib = at.filter(a => a.w < B.w - 0.2), me = sib.find(a => a.V === W);
      if (!me || sib.length !== 2) return null;
      const Q = sib[sib[0] === me ? 1 : 0], lx = B.uz, lz = -B.ux, dx = atEnd ? -me.ux : me.ux, dz = atEnd ? -me.uz : me.uz, two = me.w + Q.w;
      const sg = (me.ux * lx + me.uz * lz > Q.ux * lx + Q.uz * lz ? 1 : -1) * Math.sign(-dz * lx + dx * lz || 1);
      return { Q: Q.V, d: Math.min(B.w, two) - two / 2 - 0.3, sg };   // (0.3: a little overlap, no seam of grass between them)
    };
    for (const W of WAYS) {
      const col = CL[W[0]][3], w = wide(W), U = 3, pts = [], ok = [], s = [];
      for (let q = 2; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 2.5));
        for (let t = q > 2 ? 1 : 0; t <= m; t++) pts.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
      }
      const n = pts.length / 2, cut = new Float64Array(n), hw = new Float64Array(n);
      for (let k = 0; k < n; k++) s.push(k ? s[k - 1] + Math.hypot(pts[2 * k] - pts[2 * k - 2], pts[2 * k + 1] - pts[2 * k - 1]) : 0);
      const S = s[n - 1], LT = Math.min(30, S / 2), e0 = endW(W, W[2], W[3]), e1 = endW(W, W[W.length - 2], W[W.length - 1]);
      const w0 = e0 && e0 < w - 0.2 ? e0 : w, w1 = e1 && e1 < w - 0.2 ? e1 : w;
      const P0 = pts.slice();   // (moved across along the line's normal, as the rows below are laid)
      for (const [o, back] of [[split(W, false), false], [split(W, true), true]]) if (o) {
        for (let i = 0; i < n; i++) {
          const k = back ? n - 1 - i : i, x = P0[2 * k], z = P0[2 * k + 1]; let D = 1e9;
          for (let q = 2; q + 3 < o.Q.length; q += 2) D = Math.min(D, segD(x, z, o.Q[q], o.Q[q + 1], o.Q[q + 2], o.Q[q + 3]));
          if (D >= o.d || i > n / 2) break;
          const k0 = Math.max(0, k - 1), k1 = Math.min(n - 1, k + 1), dx = P0[2 * k1] - P0[2 * k0], dz = P0[2 * k1 + 1] - P0[2 * k0 + 1], dl = Math.hypot(dx, dz) || 1;
          const f = o.sg * (o.d - D) / 2; pts[2 * k] -= dz / dl * f; pts[2 * k + 1] += dx / dl * f;
        }
        st.split++;
      }
      if (w0 < w || w1 < w) st.narrowed++;
      for (let k = 0; k < n; k++) {
        hw[k] = Math.min(w0 + (w - w0) * Math.min(1, s[k] / LT), w1 + (w - w1) * Math.min(1, (S - s[k]) / LT)) / 2;
        ok.push(past(pts[2 * k], pts[2 * k + 1], hw[k] + 1.2));
      }
      let c0 = joined(W, W[2], W[3]) ? -1e9 : 0;   // the distance along to the nearest cut or free end: one pass forwards, one back
      for (let k = 0; k < n; k++) { if (!ok[k]) c0 = s[k]; cut[k] = s[k] - c0; }
      c0 = joined(W, W[W.length - 2], W[W.length - 1]) ? 1e9 : s[n - 1];
      for (let k = n - 1; k >= 0; k--) { if (!ok[k]) c0 = s[k]; cut[k] = Math.min(cut[k], c0 - s[k]); }
      let prev = null;
      for (let k = 0; k < n; k++) {
        if (!ok[k]) { prev = null; continue; }
        const x = pts[2 * k], z = pts[2 * k + 1], k0 = Math.max(0, k - 1), k1 = Math.min(n - 1, k + 1), h = hw[k];
        const dx = pts[2 * k1] - pts[2 * k0], dz = pts[2 * k1 + 1] - pts[2 * k0 + 1], dl = Math.hypot(dx, dz) || 1, nx = -dz / dl, nz = dx / dl;
        const row = [-h, h].map(f => [x + nx * f, nrGround(x + nx * f, z + nz * f) + 0.1, z + nz * f]);
        const t = Math.min(1, cut[k] / FADE), a = t * t * (3 - 2 * t), c = tone(col, x, z), c4 = [c[0], c[1], c[2], a];
        const cur = { row, cols: [c4, c4], uvs: [[-h / U, s[k] / U], [h / U, s[k] / U]], a, s: s[k], rb: null, i: -1 };
        if (prev) {
          const rb = prev.a < 1 || a < 1 ? rbFade(x, z) : rbAt(x, z), pi = prev.rb === rb ? prev.i : rb.row(prev.row, prev.cols, prev.uvs);
          cur.rb = rb; cur.i = rb.row(row, cur.cols, cur.uvs); rb.link(pi, cur.i, 0, 1); st.wayM += cur.s - prev.s;
        } else st.ways++;
        prev = cur; exclPush(x, z, h + 1);
        if (k % 2 === 0 && near(x, z, 45)) CR.avoid(x, z, h + 0.4);
      }
    }

    // the car park: laid on the ground in 4 m cells (whole ones share their corners within a tile; the edge ones cut to the outline,
    // Sutherland-Hodgman, and triangulated), each in the tile of its centre; none inside the barriers
    const area = (P) => { let s = 0; for (let k = 0; k < P.length; k += 2) { const j = (k + 2) % P.length; s += P[k] * P[j + 1] - P[j] * P[k + 1]; } return s / 2; };
    const clip = (Q, x0, z0, x1, z1) => {
      let P = Q;
      for (const [ax, c, s] of [[0, x0, 1], [0, x1, -1], [1, z0, 1], [1, z1, -1]]) {
        const R = [], n = P.length / 2;
        for (let k = 0; k < n; k++) {
          const j = (k + 1) % n, px = P[2 * k], pz = P[2 * k + 1], qx = P[2 * j], qz = P[2 * j + 1];
          const pv = ((ax ? pz : px) - c) * s, qv = ((ax ? qz : qx) - c) * s;
          if (pv >= 0) R.push(px, pz);
          if ((pv >= 0) !== (qv >= 0)) { const t = pv / (pv - qv); R.push(px + (qx - px) * t, pz + (qz - pz) * t); }
        }
        if (R.length < 6) return null; P = R;
      }
      return P;
    };
    const C = 4, U = 3, vtx = (rb, x, z) => rb.row([[x, nrGround(x, z) + 0.08, z]], [tone(PK, x, z)], [[x / U, z / U]]);
    for (const Q of PARK) {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (let k = 0; k < Q.length; k += 2) { x0 = Math.min(x0, Q[k]); x1 = Math.max(x1, Q[k]); z0 = Math.min(z0, Q[k + 1]); z1 = Math.max(z1, Q[k + 1]); }
      const V = new Map(), cor = (rb, i, j) => { let M = V.get(rb); if (!M) V.set(rb, M = new Map()); const key = i * 100003 + j; let v = M.get(key); if (v === undefined) M.set(key, v = vtx(rb, i * C, j * C)); return v; };
      for (let j = Math.floor(z0 / C); j <= Math.floor(z1 / C); j++) for (let i = Math.floor(x0 / C); i <= Math.floor(x1 / C); i++) {
        const P = clip(Q, i * C, j * C, (i + 1) * C, (j + 1) * C); if (!P) continue;
        let cx = 0, cz = 0; for (let k = 0; k < P.length; k += 2) { cx += P[k]; cz += P[k + 1]; } cx /= P.length / 2; cz /= P.length / 2;
        if (!past(cx, cz, 1.5)) continue;
        const rb = rbAt(cx, cz);
        if (Math.abs(Math.abs(area(P)) - C * C) < 1e-3) { const a = cor(rb, i, j), b = cor(rb, i + 1, j), c = cor(rb, i + 1, j + 1), d = cor(rb, i, j + 1); rb.I.push(a, c, b, a, d, c); }
        else {
          const n = P.length / 2, b0 = rb.n; if (Math.abs(area(P)) < 0.01) continue;
          for (let k = 0; k < n; k++) vtx(rb, P[2 * k], P[2 * k + 1]);
          const tri = THREE.ShapeUtils.triangulateShape(Array.from({ length: n }, (_, k) => new THREE.Vector2(P[2 * k], P[2 * k + 1])), []);
          for (const [a, b, c] of tri) {
            const cr = (P[2 * b] - P[2 * a]) * (P[2 * c + 1] - P[2 * a + 1]) - (P[2 * b + 1] - P[2 * a + 1]) * (P[2 * c] - P[2 * a]);
            if (cr < 0) rb.I.push(b0 + a, b0 + b, b0 + c); else rb.I.push(b0 + a, b0 + c, b0 + b);   // (up-facing: x east, z south)
          }
        }
        exclPush(cx, cz, 3); st.parkCells++;
      }
    }

    // the bus stops: a grey pole with a blank plate across the nearest road (no text, no shelter, no bench: as in OSM)
    for (let s = 0; s + 1 < STOP.length; s += 2) {
      const x = STOP[s], z = STOP[s + 1]; if (!cyl || !past(x, z, 2)) continue;
      let best = 1e9, ang = 0;
      for (const W of WAYS) for (let q = 2; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], dx = W[q + 2] - ax, dz = W[q + 3] - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
        const d = Math.hypot(ax + dx * t - x, az + dz * t - z); if (d < best) { best = d; ang = Math.atan2(dz, dx); }
      }
      const g = scen.get(x, z), y = nrGround(x, z) - 0.2;
      cyl(g, x, y, z, 0.035, 2.75, 6, POLE, POLE);
      box(g, x, y + 2.1, z, 0.5, 0.6, 0.04, ang + Math.PI / 2, PLATE, PLATE);
      exclPush(x, z, 1.2); CR.avoid(x, z, 1); st.stops++;
    }

    // the noise barrier and the fences (WALL, FENCE): along their OSM lines on the ground, a panel or a bay per step; none inside the
    // barriers or on a road here (a piece within 8 m of the circuit's centre line is left out)
    const WALLC = [0.6, 0.6, 0.57], WALLT = [0.7, 0.7, 0.68], RAIL = [0.56, 0.58, 0.6];
    st.wall = 0; st.fence = 0;
    const along = (P, step, fn) => { for (let q = 0; q + 3 < P.length; q += 2) { const ax = P[q], az = P[q + 1], dx = P[q + 2] - ax, dz = P[q + 3] - az, L = Math.hypot(dx, dz), n = Math.max(1, Math.round(L / step)), ang = Math.atan2(dz, dx);
      for (let k = 0; k < n; k++) { const x = ax + dx * (k + 0.5) / n, z = az + dz * (k + 0.5) / n; if (past(x, z, 8)) fn(x, z, L / n, ang); } } };
    along(WALL, 4, (x, z, l, ang) => { const g = scen.get(x, z), y = nrGround(x, z) - 0.3; box(g, x, y, z, l + 0.02, 3.3, 0.16, ang, WALLC, WALLT, true); exclPush(x, z, 2.5); CR.avoid(x, z, 2); st.wall++; });
    for (const F of FENCE) along(F, 3, (x, z, l, ang) => { const g = scen.get(x, z), y = nrGround(x, z) - 0.2, c = Math.cos(ang), sn = Math.sin(ang);
      box(g, x - c * l / 2, y, z - sn * l / 2, 0.06, 2.2, 0.06, ang, POLE, POLE, true);   // (the post at the bay's start)
      for (const h of [0.25, 1.15, 2.1]) box(g, x, y + h, z, l, 0.03, 0.02, ang, RAIL, RAIL, true);   // (the wires: bottom, middle, top)
      exclPush(x, z, 1.5); CR.avoid(x, z, 1); st.fence++; });

    const opt = { map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 };
    const mat = new THREE.MeshLambertMaterial(opt), matF = new THREE.MeshLambertMaterial(Object.assign({ transparent: true, depthWrite: false }, opt));
    for (const [T, M] of [[tiles, mat], [tilesF, matF]]) for (const rb of T.values()) {
      if (rb.empty) continue;
      const m = new THREE.Mesh(rb.geometry(), M); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'roadside-asphalt'; root.add(m); st.meshes++;
    }
    st.wayM = Math.round(st.wayM);
    return st;
  }
})();
