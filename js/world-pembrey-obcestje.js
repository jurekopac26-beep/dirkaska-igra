/* =====================================================================================================================================
   WORLD — Pembrey, Wales: what lies by the road past the barriers (grafika ob progi), from OpenStreetMap, on js/world-pembrey.js
   (the builder's hook LK.extra wrapped: what is here is laid out first, so the gorse, the trees and the crowds keep clear of it, then
   js/world-pembrey.js's own parts (the buildings, the gorse, the horizon), then this is drawn).
   Drawn: the circuit's other tarmac (OSM highway=raceway off the lap, within ~85 m of the road: the links of the shorter loops and the
     other tracks beside it), each as wide as OSM's outline of it (area:highway=raceway: the median width along it); the service roads
     (highway=service: no width, no surface in OSM: 4 m of asphalt, assumed); the paddock (amenity=parking, raceway=paddock) and the car
     park beside it (amenity=parking), their whole outlines: no surface in OSM, after PAD_B (the user's choice in the PR: (a) asphalt,
     (b) light concrete).
   Kept open (docs/realizem.md: only from sources): the paddock's and the car park's surface (the choice above), the service roads'
     width. The builder's camps (its tents, caravans and cars) stand where they stood, now on the paddock and the car park (the pads are
     laid whole under them); the ways keep off the builder's own ground (the garages, the stands, the screens, the camps).
   Not drawn again: the buildings, the gorse and the horizon (js/world-pembrey.js), the gravel traps, the barriers and the run-off (the
     builder's; they belong to the driving); a way inside the barriers (where it joins the lap); the service roads that lie mostly on the
     paddock or the car park, and a way's stretch more than 3 m inside them (the pad is drawn there).
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-22; metres, origin = the finish line, x east, z south
   (tools/pembrey/pembrey.json's lat0/lon0); the lines simplified to 0.25 m.
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.pembrey;
  if (!LK || typeof LK.extra !== 'function') return;

  const PAD_B = false;   // the paddock and the car park (no surface in OSM): false (a) asphalt, true (b) light concrete (the user's choice, PR)
  // the ways: [kind (0 the circuit's other tarmac, 1 a service road), half the width (m), x0, z0, x1, z1, ...];
  // the pads: [0 the paddock, 1 the car park, outline x0, z0, x1, z1, ...]
  const WAYS = [
    [0,4.9,198.4,129.4,223.3,141.4,243.3,150.4,318.2,183,332.3,186.5,336.6,184.7,341.8,179.8,344.4,173.4,345.6,166.7,346.1,157.9,346.1,148.2,345.6,139.6],
    [0,4.4,230.6,364.4,211,355.2,170.7,333.8,165.8,332.1,160.9,332.3,153.9,334.2,135,342.7,118.3,349.4,109.2,352.5],
    [0,4.7,318.2,183,346.9,195.8],
    [0,4.8,345.6,139.6,347.8,143.9,350,146.6,354.9,149.1,363.9,149.9,374.1,153.2,381.7,156.7,389.7,161.3,400.4,172.7,408.3,183.8,412.2,197.2],
    [0,4.8,297.9,273.5,295.4,275.6,292,279.8,289.4,285.3,284.5,307.1,280.8,314.6,276.1,320.9,269.4,325.7,260.5,330.4,251.6,332.1,239.7,333.2,222.3,327.6,187.1,312.6,162.1,304.9,148.2,302.4,132.4,302.9,118.2,305,96.8,309.4,69.5,318.8,60.1,321.2],
    [0,4.8,498.2,178.9,496.7,201.3,494.1,220.2,493.4,230.5,493.4,239.7,495.6,252.8,498.8,262.2,528.7,275.8,534,279.1,538,282.4,547.7,298.2],
    [0,4.7,430.9,233.3,498.8,262.2],
    [0,4.2,148.8,-124.8,113,-127.8,106.7,-129.4,102.8,-131.4,98.9,-135.9,97.1,-140.8,96,-147.7,95.5,-171],
    [0,4.9,247.4,363,238.4,355.1,235.6,348.4,235.6,342.2,239.7,333.2],
    [0,4.9,69.7,-108.1,74.9,-112.2,79.4,-111.6,87.9,-81.5,95.4,-66.3],
    [0,2.8,426.5,225.1,435.3,242],
    [0,2.8,428.5,263.1,426.3,266.4,422.7,269.4,415.6,271.2,407.8,271.7,362.5,267.2],
    [0,4.7,346.1,128.7,348.1,120.3,350.7,114.2,354.2,109.1],
    [0,5.8,346.1,128.7,345.6,139.6],
    [0,5,333.8,112.6,340.5,115,343.5,117.6,344.6,120.9,346.1,128.7],
    [1,2,152.8,147.5,171.3,116.1,201.5,68.3,217.6,44.1],
    [1,2,130.3,159.4,106,145.1,79.1,121.5,64.2,101,45.9,56.2,33,12.8,29,1.8,65,-65.8],
    [1,2,8.2,149.5,-24,131.9,3.3,80.7,16.9,74.8,33.3,61.4,45.9,56.2],
    [1,2,147.7,167.6,158.4,180.4,262,211.7],
    [1,2,3.4,263.6,35.6,276.9,44.6,276.5],
    [1,2,140.1,-371.6,158.4,-375.9,168.2,-380,197.1,-394.4]
  ];
  const PADS = [
    [0,52.1,71.7,34.4,81.7,-41.2,210.7,35.8,272.3,30.4,277.4,31.2,282.3,73.9,307.1,80.1,308.7,87.1,306.8,87.4,295.5,90.3,289.1,214.6,274.3,241.2,221,225.6,211.7,203.6,204.5,185.4,199.9,167.6,196.6,162.3,193.8,154.1,184.6,171.2,157.7,136.4,139.7,135,129.6,143.5,116.4,108.6,106.7],
    [1,173.1,67.7,210.9,90.6,250.1,31.2,210.3,8.9]
  ];
  // the colour over the asphalt's picture: the circuit's other tarmac, the service roads (a shade darker); the pads: asphalt faded
  // lighter than the circuit's, or concrete (the asphalt's picture lit up to a pale grey: the game has no picture of concrete)
  const WC = [[0.92, 0.92, 0.94], [0.88, 0.88, 0.9]], PD_ASP = [1.02, 1.02, 1.04], PD_CON = [1.75, 1.72, 1.64];
  // smooth patches (value noise on a 9 m lattice, from the place alone: the same every time, no draw from the world's random numbers)
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => {
    const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
  const padAt = (x, z) => { const f = 0.94 + 0.1 * patch(x + 500, z); return (PAD_B ? PD_CON : PD_ASP).map(c => c * f); };
  const POLY = PADS.map(Q => { const P = []; for (let k = 1; k + 1 < Q.length; k += 2) P.push([Q[k], Q[k + 1]]); return P; });
  const deep = (x, z, m) => POLY.some(P => A.inPoly(P, x, z) && A.polyDist(P, x, z) > m);   // (more than m inside a pad)

  const base = LK.extra;
  LK.extra = function (o) { const mine = lay(o); const st = base(o) || {}; st.roadside = mine; return st; };

  function lay(o) {
    const { root, exclPush, excluded, CR, tex } = o, { RB, nrGround, nrNear } = A;
    const st = { ways: 0, wayM: 0, padCells: 0, meshes: 0 };
    const past = (x, z, m) => { const n = nrNear(x, z); return n.i < 0 || n.dd >= m; };
    const near = (x, z, m) => { const n = nrNear(x, z); return n.i >= 0 && n.dd < m; };
    // the builder's own ground (its garages, stands, screens and camps, kept clear of the trees before this): the ways keep off it, the pads
    // go under it (the camps stand on them); what is laid here is kept clear of the gorse, the trees and the crowds once all of it is laid
    // (so `excluded` while laying is the builder's alone)
    const later = [], keep = (x, z, r) => later.push(x, z, r), free = (x, z) => !(excluded && excluded(x, z));
    // what is laid on the ground goes into a mesh per 120 m square, so three.js leaves out of the frame what is out of view
    const TILE = 120, tiles = new Map();
    const rbAt = (x, z) => { const key = Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let rb = tiles.get(key); if (!rb) tiles.set(key, rb = new RB(true)); return rb; };

    // the ways: rows of two across (the left and the right edge), every 2.5 m along, on the ground; cut where they run inside the barriers,
    // over the builder's own ground or deep in a pad; a stretch goes into the tile of the row it ends at (the row before it copied there
    // when the tile changes)
    for (const W of WAYS) {
      const col = WC[W[0]], hw = W[1], lift = W[0] ? 0.1 : 0.12, U = 3, pts = [];
      for (let q = 2; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 2.5));
        for (let t = q > 2 ? 1 : 0; t <= m; t++) pts.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
      }
      let prev = null, pi = -1, prb = null, along = 0, pAl = 0;
      for (let k = 0; k < pts.length; k += 2) {
        const x = pts[k], z = pts[k + 1];
        if (k) along += Math.hypot(x - pts[k - 2], z - pts[k - 1]);
        if (!past(x, z, hw + 1.2) || !free(x, z) || deep(x, z, 3)) { prev = null; continue; }
        const k0 = Math.max(0, k - 2), k1 = Math.min(pts.length - 2, k + 2), dx = pts[k1] - pts[k0], dz = pts[k1 + 1] - pts[k0 + 1], dl = Math.hypot(dx, dz) || 1;
        const nx = -dz / dl, nz = dx / dl, row = [-hw, hw].map(f => [x + nx * f, nrGround(x + nx * f, z + nz * f) + lift, z + nz * f]);
        const cols = [col, col], uvs = [[-hw / U, along / U], [hw / U, along / U]], rb = rbAt(x, z);
        if (prev && rb !== prb) pi = rb.row(prev[0], prev[1], prev[2]);
        const r = rb.row(row, cols, uvs);
        if (prev) { rb.link(pi, r, 0, 1); st.wayM += along - pAl; } else st.ways++;
        prev = [row, cols, uvs]; pi = r; prb = rb; pAl = along; keep(x, z, hw + 1);
        if (k % 4 === 0 && near(x, z, 45)) CR.avoid(x, z, hw + 0.4);
      }
    }

    // the paddock and the car park: laid on the ground in 4 m cells (whole ones share their corners within a tile; the edge ones cut to
    // the outline, Sutherland-Hodgman, and triangulated), each in the tile of its centre; none inside the barriers (whole under the builder's camps: they stand on them)
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
    const drape = (Q, C, colAt, lift, U, onCell) => {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (let k = 0; k < Q.length; k += 2) { x0 = Math.min(x0, Q[k]); x1 = Math.max(x1, Q[k]); z0 = Math.min(z0, Q[k + 1]); z1 = Math.max(z1, Q[k + 1]); }
      const i0 = Math.floor(x0 / C), i1 = Math.floor(x1 / C), j0 = Math.floor(z0 / C), j1 = Math.floor(z1 / C), V = new Map();
      const vtx = (rb, x, z) => rb.row([[x, nrGround(x, z) + lift, z]], [colAt(x, z)], [[x / U, z / U]]);
      const cor = (rb, i, j) => { let M = V.get(rb); if (!M) V.set(rb, M = new Map()); const key = i * 100003 + j; let v = M.get(key); if (v === undefined) M.set(key, v = vtx(rb, i * C, j * C)); return v; };
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
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
        onCell(cx, cz);
      }
    };
    for (const Q of PADS) drape(Q.slice(1), 4, padAt, 0.07, 3, (x, z) => { keep(x, z, 3); st.padCells++; });

    for (let k = 0; k < later.length; k += 3) exclPush(later[k], later[k + 1], later[k + 2]);
    const mat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
    for (const rb of tiles.values()) {
      if (rb.empty) continue;
      const m = new THREE.Mesh(rb.geometry(), mat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'roadside-asphalt'; root.add(m); st.meshes++;
    }
    st.wayM = Math.round(st.wayM);
    return st;
  }
})();
