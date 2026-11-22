/* =====================================================================================================================================
   WORLD — Sosnová, Češka: the roads by the circuit (grafika ob progi), from OpenStreetMap, on js/world-sosnova.js (the builder's hook
   LK.extra wrapped: what is here is laid out first, so the alders, the woods' trees and the crowds keep clear of it, then
   js/world-sosnova.js's own parts: the streams, the power lines, the paddock's buildings).
   Drawn: the public roads round the circuit (OSM highway=primary/tertiary/unclassified/service within ~160 m): the main road I/9 to the
     west (2 lanes, its one-lane slip roads, surface=asphalt), the local road 00913 round the north and the east (surface=asphalt,
     lane_markings=no: no lines), the asphalt roads to the south (unclassified, lane_markings=no), the service roads (no surface tag:
     asphalt, assumed) and the car park by the road to the north (OSM amenity=parking, parking=street_side, no surface tag: asphalt,
     as its aisle, assumed); the bus stops' poles with a blank plate (OSM highway=bus_stop within ~60 m, shelter=no, bench=no; no text).
     The roads' widths are not in OSM: from their kind (assumed).
   Kept open (docs/realizem.md: only from sources): the I/9's bridge west of the circuit (OSM bridge=yes, layer=1: no height; the terrain
     model there holds only a few metres of it), so the main road is drawn only where it lies on the ground (its embankment too).
   Not drawn again: the raceway's own links across the infield (deliberately left out, js/tracks/sosnova.js), the noise barrier and the
     fence (#844), the streams, the power lines and the buildings (js/world-sosnova.js); a road inside the barriers.
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-22; metres, origin = the junction where the route
   starts, x east, z south (tools/sosnova/sosnova.json's lat0/lon0); the lines simplified to 0.25 m.
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.sosnova;
  if (!LK || typeof LK.extra !== 'function') return;

  // the bus stops: x, z, ...; the car park: its outline; the roads: [kind, x0, z0, ...]: 0 the I/9 (2 lanes), 1 its one-lane slip roads,
  // 2 the local road 00913, 3 the asphalt roads without a class, 4 the service roads, 5 the car park's aisle
  const STOP = [-82.1, -286.5, 175.4, -41.2, 204.2, -4.7];
  const PARK = [[-71.9,-295.5,-37.9,-284.5,-34.7,-273.2,-77.8,-286.6,-75.6,-293.1]];
  const WAYS = [
    [2,-150,-302.2,-111.7,-289.4,-15.3,-258.6,13.5,-243.9,40.9,-220.6,70.1,-186.7,85.2,-158,110.4,-100.1,138.4,-65,209.4,-7.9,244,6.6,300.5,17.6,368,25.4],
    [0,-228.3,-275.2,-204.7,-315.4],
    [1,-228.3,-275.2,-254.2,-237.7,-279.6,-191.3],
    [0,-322.8,-28.7,-323.6,3.2,-325.5,36.5,-327.9,64.6,-331.5,94.5],
    [0,-317.8,100.6,-305.8,4.3],
    [3,-377.1,91,-349,96.2,-310.6,112.4],
    [3,59.4,59.6,137.8,86.3,156.3,87.2,180.4,83.3,197.1,79.7,202,59.6,200.7,32.6,182.7,-29.4],
    [3,-268.5,130.6,-249.1,131.7,-197.4,121.5,-183.6,104.3,-155.6,46.3,-134.1,35.2,59.4,59.6],
    [1,-333.6,112.1,-351.6,218.1],
    [1,-344.4,218.4,-333.6,112.1],
    [4,-334.4,-124.2,-310.9,-164.3,-305.7,-194.9,-299.7,-209.4,-258.8,-256.4,-242.6,-283.8,-236.8,-301.6,-239.1,-323.5,-239,-327.5],
    [4,-17.3,-392.6,21.7,-300,28.6,-281.5,27.2,-272.5,18,-259.7,7.3,-247],
    [5,-111.7,-289.4,-108.6,-298.4,-96,-296.4,-75.9,-290.9,-40.9,-277.2,-39.6,-266.4],
    [0,-352.9,104.4,-353.6,124.2],
    [0,-279.6,-191.3,-313.7,-126,-326.4,-95.9,-335.3,-68.1,-344.2,-32,-348.5,4.3],
    [0,-199.6,-323.3,-124.4,-429.7],
    [1,-290.9,-98,-284.6,-128.3,-274.9,-163.4,-268.3,-182.9,-257.6,-211.4,-228.3,-275.2],
    [2,-199.6,-323.3,-235.2,-332.8,-254.1,-339],
    [3,-310.6,112.4,-301.4,117.8,-268.5,130.6],
    [0,-204.7,-315.4,-199.6,-323.3],
    [2,-204.7,-315.4,-187.4,-309.4,-150,-302.2],
    [2,-150,-302.2,-168.3,-311.3,-199.6,-323.3],
    [2,-275.1,-337.7,-258.2,-333.6,-239,-327.5,-204.7,-315.4],
    [0,-305.8,4.3,-299.5,-47.5,-295.9,-71.7,-290.9,-98],
    [0,-331,190.5,-320.2,117.7],
    [0,-348.5,4.3,-350.3,25.3,-352.6,88]
  ];
  // each kind of road: half its width, its colour over the asphalt's picture (the I/9 of 2011 darker and even, the small roads paler)
  const WK = [[4.25, [0.8, 0.8, 0.83]], [2.75, [0.83, 0.83, 0.86]], [3, [0.9, 0.9, 0.92]], [2.4, [0.95, 0.95, 0.96]], [1.75, [0.99, 0.98, 0.97]],
    [2.5, [1, 1, 1]]];
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

  function lay(o) {
    const { root, scen, exclPush, CR, tex } = o, { RB, nrGround, nrNear, box } = A, cyl = A.cyl;
    const st = { ways: 0, wayM: 0, parkCells: 0, stops: 0, meshes: 0 };
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
    const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
    const joined = (W, x, z) => {   // the parking aisles end in the car park; any other end must meet another way
      if (W[0] === 5) return true;
      for (const V of WAYS) if (V !== W) for (let q = 1; q + 3 < V.length; q += 2) if (segD(x, z, V[q], V[q + 1], V[q + 2], V[q + 3]) < 1.5) return true;
      return false;
    };
    for (const W of WAYS) {
      const [hw, col] = WK[W[0]], U = 3, pts = [], ok = [], s = [];
      for (let q = 1; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 2.5));
        for (let t = q > 1 ? 1 : 0; t <= m; t++) pts.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
      }
      const n = pts.length / 2, cut = new Float64Array(n);
      for (let k = 0; k < n; k++) { s.push(k ? s[k - 1] + Math.hypot(pts[2 * k] - pts[2 * k - 2], pts[2 * k + 1] - pts[2 * k - 1]) : 0); ok.push(past(pts[2 * k], pts[2 * k + 1], hw + 1.2)); }
      let c0 = joined(W, W[1], W[2]) ? -1e9 : 0;   // the distance along to the nearest cut or free end: one pass forwards, one back
      for (let k = 0; k < n; k++) { if (!ok[k]) c0 = s[k]; cut[k] = s[k] - c0; }
      c0 = joined(W, W[W.length - 2], W[W.length - 1]) ? 1e9 : s[n - 1];
      for (let k = n - 1; k >= 0; k--) { if (!ok[k]) c0 = s[k]; cut[k] = Math.min(cut[k], c0 - s[k]); }
      let prev = null;
      for (let k = 0; k < n; k++) {
        if (!ok[k]) { prev = null; continue; }
        const x = pts[2 * k], z = pts[2 * k + 1], k0 = Math.max(0, k - 1), k1 = Math.min(n - 1, k + 1);
        const dx = pts[2 * k1] - pts[2 * k0], dz = pts[2 * k1 + 1] - pts[2 * k0 + 1], dl = Math.hypot(dx, dz) || 1, nx = -dz / dl, nz = dx / dl;
        const row = [-hw, hw].map(f => [x + nx * f, nrGround(x + nx * f, z + nz * f) + 0.1, z + nz * f]);
        const t = Math.min(1, cut[k] / FADE), a = t * t * (3 - 2 * t), c = tone(col, x, z), c4 = [c[0], c[1], c[2], a];
        const cur = { row, cols: [c4, c4], uvs: [[-hw / U, s[k] / U], [hw / U, s[k] / U]], a, s: s[k], rb: null, i: -1 };
        if (prev) {
          const rb = prev.a < 1 || a < 1 ? rbFade(x, z) : rbAt(x, z), pi = prev.rb === rb ? prev.i : rb.row(prev.row, prev.cols, prev.uvs);
          cur.rb = rb; cur.i = rb.row(row, cur.cols, cur.uvs); rb.link(pi, cur.i, 0, 1); st.wayM += cur.s - prev.s;
        } else st.ways++;
        prev = cur; exclPush(x, z, hw + 1);
        if (k % 2 === 0 && near(x, z, 45)) CR.avoid(x, z, hw + 0.4);
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
      for (const W of WAYS) for (let q = 1; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], dx = W[q + 2] - ax, dz = W[q + 3] - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
        const d = Math.hypot(ax + dx * t - x, az + dz * t - z); if (d < best) { best = d; ang = Math.atan2(dz, dx); }
      }
      const g = scen.get(x, z), y = nrGround(x, z) - 0.2;
      cyl(g, x, y, z, 0.035, 2.75, 6, POLE, POLE);
      box(g, x, y + 2.1, z, 0.5, 0.6, 0.04, ang + Math.PI / 2, PLATE, PLATE);
      exclPush(x, z, 1.2); CR.avoid(x, z, 1); st.stops++;
    }

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
