/* =========================================================================
   REALIZEM 15 — Quezaltepeque, Salvador: what OpenStreetMap maps within 60 m of the circuit that its world (js/world-quezaltepeque.js on
   js/world-rbring.js) does not draw yet. Loaded after js/world-quezaltepeque.js (index.html); it wraps RB_LOOK.quezaltepeque's extra hook.
   Drawn: the kart track in the infield (OSM highway=raceway, sport=karting, and the 20 m raceway that joins it) as asphalt on the ground
     where it comes within 60 m: on the right from Turns 6-7 to the lava straight, and before Turn 10; (IZBIRA 'b' only) 4 of the 8 lone trees OSM maps
     (natural=tree: two on the right after Turn 9, one on the left before Turn 10 and one after it); 3 of the 12 picnic tables behind the
     grandstand outside the long left of Turn 5 (leisure=picnic_table). The trees and the tables only 1.5 m past the barriers, the kart track
     not within 4 m of them (the run-offs and the joins are the builder's): the other 4 trees and 9 tables are inside the barrier line the
     world draws there (the run-offs of the lava straight, Turn 10 and Turn 5). The scenery and the people are kept off all of it.
   The observation tower by the main straight in its OSM colours (building:colour, the user's choice b on 23. 11.): OSM maps it as five
     parts one on the other (def.sk.bld, 3, 6, 9, 12 and 15 m high), light grey (#e1dfdf) up to 6 m and from 9 to 12 m, dark blue (#16106a)
     from 6 to 9 m and from 12 to 15 m and on the top; each part's band (from the part under it to its own top) a shell 4 cm outside the
     world's white box of that part.
   Kept open (docs/realizem): the service roads OSM tags unpaved or paving stones, which the world draws as asphalt; the underpass of the unpaved service road under the circuit before Turn 11; the
     83 m raceway OSM maps across the infield at Turn 10 (highway=raceway, sport=motor, no surface).
   Not drawn again (the world has them): the grandstands (OSM bleachers: def.stands), the service roads and the dirt tracks (def.sk.svc,
     sk.trk), the houses and the towers (def.sk.bld), the old lava (def.sk.lava), the grass (OSM landuse=grass: the land cover), the pit lane.
   Left to realizem 13 (PR #844, js/world-realizem13.js): the fences and the walls of the grounds (OSM barrier=fence, barrier=wall).
   Not drawn at all: points without an outline (the car parks, the toilets, the helipad, the gates), the viewpoints, any names.
   Assumed (OSM has no tags for them): the kart track 7 m wide; the trees broadleaf, 6 m high; the tables timber, 1.8 m long, along the road
     like the grandstand.
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-22; metres, origin = the finish line, x east, z south.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.quezaltepeque;
  if (!LK || typeof LK.extra !== 'function') return;
  const KART = [[264.6, 157.3, 260, 160.4, 250.1, 161.5, 245.2, 160.6, 241, 157.8, 239.4, 154.9, 232.7, 128.5, 229.1, 118.6, 222.8, 113.6, 219.6, 112.2, 213.6, 111.7, 207.8, 112.8, 201.2, 117, 192.3, 129.4, 191.7, 134.9, 192.5, 139.3, 196.5, 143, 215.6, 153.6, 221.8, 162.2, 268.4, 215.5, 270.2, 218.5, 270.8, 222.6, 269.3, 226.2, 266.9, 227.8, 263.9, 228.9, 260.7, 228.3, 257.4, 226.8, 254.3, 223.7, 247.3, 214.5, 243.8, 212.7, 240.5, 212.3, 237.8, 213.2, 235.5, 214.6, 228.4, 226.6, 220.9, 236.8, 213.6, 243.3, 198.1, 254.5, 184.1, 259.9, 174.1, 262.7, 168.8, 266.5, 167.9, 269.6, 168.1, 272.3, 170, 274.4, 172.7, 275.9, 175.8, 276.5, 203.4, 268.3, 222.2, 260.1, 237.9, 245.7, 246.6, 242.8, 252.7, 244, 256.1, 246, 259.1, 249.2, 260.3, 251.7, 260.9, 253.7, 258.2, 267.8], [262.3, 208.5, 279.8, 199.8]];
  const TREE = [-14.6, 178.6, 166.2, 215.7, -67, 223.6, -86.3, 225.6, 91.3, 236.6, 88.6, 251.1, 92.9, 258.7, 99.3, 244.5];
  const TABLE = [87.5, 98.8, 50, 90.3, 94, 50, 92.2, 89.6, 53, 95.9, 86.8, 53, 96.9, 90.1, 50, 99, 92.8, 50, 100.4, 87.7, 50, 98.4, 85, 53, 101, 82.5, 53, 98.3, 79.9, 53, 96.2, 81.9, 53, 94.9, 78.5, 56];
  const base = LK.extra;
  LK.extra = function (o) { const st = base(o) || {}; add(o, st); return st; };

  function add(o, st) {
    const { root, scen, exclPush, CR, tex } = o, { RB, nrGround, nrNear, box } = A;
    const runs = (S, step, f) => S.forEach(p => {   // each run's points every <= step m: f(x, z, dx, dz, along, first)
      let along = 0;
      for (let q = 0; q + 2 < p.length; q += 2) {
        const ax = p[q], az = p[q + 1], bx = p[q + 2], bz = p[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / step));
        for (let t = q ? 1 : 0; t <= m; t++) f(ax + (bx - ax) * t / m, az + (bz - az) * t / m, (bx - ax) / L, (bz - az) / L, along + L * t / m, !q && !t);
        along += L;
      }
    });
    const past = (x, z, m) => { const n = nrNear(x, z); return n.i < 0 || n.dd >= m; };

    // the kart track: asphalt 7 m wide on the ground, three points across every 3 m, over the service roads it meets
    const rb = new RB(true), HW = 3.5, KC = [0.84, 0.84, 0.86]; let prev = -1, pa = 0; st.kart = 0;
    runs(KART, 3, (x, z, dx, dz, along, first) => {
      if (first) prev = -1;
      if (!past(x, z, 4 + HW)) { prev = -1; return; }
      const row = [-HW, 0, HW].map(f => { const px = x - dz * f, pz = z + dx * f; return [px, nrGround(px, pz) + 0.1, pz]; });
      const r = rb.row(row, [KC, KC, KC], row.map((e, j) => [j * HW / 4, along / 4]));
      if (prev >= 0) { rb.link(prev, r, 0, 2); st.kart += along - pa; }
      prev = r; pa = along;
      exclPush(x, z, HW + 1.5); CR.avoid(x, z, HW + 0.5);
    });
    st.kart = Math.round(st.kart);
    if (!rb.empty) {
      const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }));
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'quezaltepeque kart track'; root.add(m);
    }

    // the picnic tables: a top and two benches on trestles, timber
    const TC = [0.58, 0.42, 0.27], TD = [0.48, 0.34, 0.21]; st.tables = 0;
    for (let k = 0; k < TABLE.length; k += 3) {
      const x = TABLE[k], z = TABLE[k + 1], rot = TABLE[k + 2] * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot), y = nrGround(x, z);
      if (!past(x, z, 1.5)) continue;
      const g = scen.get(x, z), at = (a, b) => [x + a * c - b * s, z + a * s + b * c];
      box(g, x, y + 0.7, z, 1.8, 0.05, 0.75, rot, TC, TC, true);
      for (const b of [-0.6, 0.6]) { const [bx, bz] = at(0, b); box(g, bx, y + 0.4, bz, 1.8, 0.05, 0.28, rot, TC, TC, true); }
      for (const a of [-0.7, 0.7]) { const [lx, lz] = at(a, 0); box(g, lx, y - 0.1, lz, 0.08, 0.8, 1.45, rot, TD, TD, true); }
      exclPush(x, z, 2); CR.avoid(x, z, 1.5); st.tables++;
    }

    // the observation tower (OSM w1222268361-w1222268364, w421840935): its parts' bands in their OSM colours; [x, z, length, width, angle,
    // top, colour] as def.sk.bld has the parts (js/tracks/quezaltepeque.js), the bottom of each band the top of the part under it
    const GREY = [0.882, 0.875, 0.875], BLUE = [0.086, 0.063, 0.416];
    const TOWER = [[-57.3, 58.5, 4.9, 4.8, -28, 3, GREY], [-57.2, 58.4, 9.4, 7.9, -27, 6, GREY], [-57.7, 57.3, 9.4, 7.9, -25, 9, BLUE], [-55.8, 57.7, 9.4, 7.9, -25, 12, GREY], [-58.7, 58.9, 9.4, 7.9, -25, 15, BLUE]];
    st.tower = 0; let lo = 0;
    for (const [x, z, L, W, deg, h, col] of TOWER) {
      const rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      const b0 = lo ? y + lo : y - 0.4; box(scen.get(x, z), x, b0, z, L + 0.08, y + h + 0.02 - b0, W + 0.08, rot, col, col, true); lo = h; st.tower++;
    }

    // the lone trees: the valley's broadleaf tree (the world's own, LK.woods), instanced. The user found the second picture of the PR (the tree
    // by the barrier at 1890 m) not right on 23. 11.; the user chose on 25. 11. (docs/slike/quezaltepeque): IZBIRA 'b' all four smaller (6 m high, a narrower
    // crown); 'a' would draw none; 9 m (the picture the user turned down) is no longer drawn
    const IZBIRA = 'b', sc = [5.5, 6, 5.5];
    const pts = []; if (IZBIRA === 'b') for (let k = 0; k < TREE.length; k += 2) if (past(TREE[k], TREE[k + 1], 1.5)) pts.push([TREE[k], TREE[k + 1]]);
    st.trees = pts.length;
    if (pts.length && LK.woods && LK.woods.geo) {
      const im = new THREE.InstancedMesh(LK.woods.geo(1), new THREE.MeshLambertMaterial({ vertexColors: true }), pts.length), mx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
      pts.forEach(([x, z], k) => {
        q.setFromAxisAngle(up, k * 2.4); mx.compose(new THREE.Vector3(x, nrGround(x, z) - 0.1, z), q, new THREE.Vector3(...sc)); im.setMatrixAt(k, mx);
        exclPush(x, z, 5); CR.avoid(x, z, 2);
      });
      im.castShadow = true; im.name = 'quezaltepeque lone trees'; root.add(im);
    }
  }
})();
