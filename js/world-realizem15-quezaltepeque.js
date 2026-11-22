/* =========================================================================
   REALIZEM 15 — Quezaltepeque, Salvador: what OpenStreetMap maps within 60 m of the circuit that its world (js/world-quezaltepeque.js on
   js/world-rbring.js) does not draw yet. Loaded after js/world-quezaltepeque.js (index.html); it wraps RB_LOOK.quezaltepeque's extra hook.
   Drawn: the kart track in the infield (OSM highway=raceway, sport=karting, and the 20 m raceway that joins it) as asphalt on the ground
     where it comes within 60 m: on the right from Turns 6-7 to the lava straight, and before Turn 10; the fences of the circuit's grounds
     (OSM barrier=fence: chain link on posts) on the left of most of the lap; the walls by the service road on the left of the lava straight,
     Turn 9 and before Turn 11 (OSM barrier=wall); 4 of the 8 lone trees OSM maps (natural=tree: two on the right after Turn 9, one on the
     left before Turn 10 and one after it); 3 of the 12 picnic tables behind the grandstand outside the long left of Turn 5
     (leisure=picnic_table). The fences, the walls, the trees and the tables only 1.5 m past the barriers, the kart track not within 4 m of
     them (the run-offs and the joins are the builder's): the other 4 trees and 9 tables are inside the barrier line the world draws there
     (the run-offs of the lava straight, Turn 10 and Turn 5). The scenery and the people are kept off all of it.
   Kept open (docs/realizem): the service roads OSM tags unpaved or paving stones, which the world draws as asphalt; the colours of the
     towers by the main straight (OSM building:colour); the underpass of the unpaved service road under the circuit before Turn 11; the
     83 m raceway OSM maps across the infield at Turn 10 (highway=raceway, sport=motor, no surface).
   Not drawn again (the world has them): the grandstands (OSM bleachers: def.stands), the service roads and the dirt tracks (def.sk.svc,
     sk.trk), the houses and the towers (def.sk.bld), the old lava (def.sk.lava), the grass (OSM landuse=grass: the land cover), the pit lane.
   Not drawn at all: points without an outline (the car parks, the toilets, the helipad, the gates), the viewpoints, any names.
   Assumed (OSM has no tags for them): the kart track 7 m wide; the fences 2 m high, galvanised chain link with posts every 3 m; the walls
     2 m high, grey concrete blocks; the trees broadleaf, 9 m high; the tables timber, 1.8 m long, along the road like the grandstand.
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-22; metres, origin = the finish line, x east, z south.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.quezaltepeque;
  if (!LK || typeof LK.extra !== 'function') return;
  const KART = [[264.6, 157.3, 260, 160.4, 250.1, 161.5, 245.2, 160.6, 241, 157.8, 239.4, 154.9, 232.7, 128.5, 229.1, 118.6, 222.8, 113.6, 219.6, 112.2, 213.6, 111.7, 207.8, 112.8, 201.2, 117, 192.3, 129.4, 191.7, 134.9, 192.5, 139.3, 196.5, 143, 215.6, 153.6, 221.8, 162.2, 268.4, 215.5, 270.2, 218.5, 270.8, 222.6, 269.3, 226.2, 266.9, 227.8, 263.9, 228.9, 260.7, 228.3, 257.4, 226.8, 254.3, 223.7, 247.3, 214.5, 243.8, 212.7, 240.5, 212.3, 237.8, 213.2, 235.5, 214.6, 228.4, 226.6, 220.9, 236.8, 213.6, 243.3, 198.1, 254.5, 184.1, 259.9, 174.1, 262.7, 168.8, 266.5, 167.9, 269.6, 168.1, 272.3, 170, 274.4, 172.7, 275.9, 175.8, 276.5, 203.4, 268.3, 222.2, 260.1, 237.9, 245.7, 246.6, 242.8, 252.7, 244, 256.1, 246, 259.1, 249.2, 260.3, 251.7, 260.9, 253.7, 258.2, 267.8], [262.3, 208.5, 279.8, 199.8]];
  const FENCE = [[422.2, -221.6, 406.6, -232, 399.8, -231.1, 377.4, -221.2, 339.9, -201.9, 292.6, -179.9, 247.5, -154.9], [-191.4, 279.1, -218, 238.7, -239, 250.2, -263.6, 259.8, -276.8, 261.5, -301.5, 251.9, -319, 231.8, -327.8, 207.4, -327.8, 191.6, -309.4, 158.4, -284.7, 141.8, -176.3, 83.2, -199.6, 42.6], [-93.9, -16.6, -69.8, -20.4, -58.8, -22.5, -46.5, -25.9, -37, -29.2, -26.3, -33.8, 13.7, -51.3, 26.5, -59.1, 51.8, -77, 74.8, -96.7, 88.9, -109.8, 107.9, -80.9, 247.5, -154.9], [-140.7, 296.2, -132, 301.7, -80.7, 307.7, -58.4, 306, -47.9, 283, -42.7, 275.7, -36.6, 271.4, -21.3, 266.8, -3.6, 265.4, 13.5, 267.1, 58.8, 275.7, 66, 278.6, 73.3, 284.7, 93, 309.2, 242.9, 306.9, 313.1, 285.8, 318, 283.2, 320.7, 280.1, 321.8, 276, 321.5, 270.9, 302.7, 166.8, 299.5, 153.3], [283.8, 192.1, 256.3, 106.9, 250.7, 94.2, 245.3, 87, 220.1, 66.2, 215.7, 55.8, 214.8, 50.1, 216.2, 43.9, 222.4, 39.3, 226.5, 38, 232.8, 38.3, 238.6, 39.1, 252.8, 43, 261.3, 42.7, 271, 40.8, 279.5, 36.9, 300.1, 26.5, 317.9, 23.2, 326.7, 22.3, 352, 25.6, 361.8, 27.9, 370.3, 33.9, 378.5, 41.1, 397.6, 43.5, 406.7, 42.3, 410.8, 40.8, 422, 33.4, 430.6, 26.7, 435.3, 19.4, 443, 4.1, 474.7, -84.1, 476.5, -92.6, 476.7, -100.7, 475.4, -108.3, 471.1, -117.4, 467, -122.7, 447.1, -140.7, 440.4, -148.1, 436.5, -155.1, 434.6, -163.7, 429.8, -197.6, 426.3, -212.3, 422.2, -221.6]];
  const WALL = [[-363.7, 251.7, -352.4, 256.3, -320.8, 274.6, -275.1, 291.2, -240.8, 296.5, -222.3, 297.8], [-147.5, 303.6, -137.8, 307.3, -129.2, 309.3, -29, 314.2], [37.1, 317.5, 261.4, 328.9], [228.4, 339.8, 190.3, 339.4, 77.3, 333.6], [-48.8, 325.5, -118.8, 321, -121.5, 321.6, -122.3, 324.4, -121.2, 328.5, -117.5, 335.6]];
  const TREE = [-14.6, 178.6, 166.2, 215.7, -67, 223.6, -86.3, 225.6, 91.3, 236.6, 88.6, 251.1, 92.9, 258.7, 99.3, 244.5];
  const TABLE = [87.5, 98.8, 50, 90.3, 94, 50, 92.2, 89.6, 53, 95.9, 86.8, 53, 96.9, 90.1, 50, 99, 92.8, 50, 100.4, 87.7, 50, 98.4, 85, 53, 101, 82.5, 53, 98.3, 79.9, 53, 96.2, 81.9, 53, 94.9, 78.5, 56];
  const base = LK.extra;
  LK.extra = function (o) { const st = base(o) || {}; add(o, st); return st; };

  function add(o, st) {
    const { root, scen, exclPush, CR, tex } = o, { RB, GB, nrGround, nrNear, box } = A;
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

    // the fences: chain link 2 m high (one mesh), a post every 3 m
    const fg = new GB(true), FC = [0.8, 0.82, 0.84], POST = [0.62, 0.64, 0.66]; let fp = null; st.fence = 0;
    runs(FENCE, 3, (x, z, dx, dz, along, first) => {
      const y = nrGround(x, z), ok = past(x, z, 1.5), pt = { x, z, y, along, ok };
      if (fp && !first && ok && fp.ok) {
        fg.quadO([fp.x, fp.y, fp.z], [x, y, z], [x, y + 2, z], [fp.x, fp.y + 2, fp.z], FC, [x - dz, y + 1, z + dx], [[fp.along / 2.5, 0], [along / 2.5, 0], [along / 2.5, 0.81], [fp.along / 2.5, 0.81]]);
        st.fence += along - fp.along;
      }
      if (ok) { box(scen.get(x, z), x, y - 0.3, z, 0.07, 2.4, 0.07, Math.atan2(dz, dx), POST, POST, true); CR.avoid(x, z, 0.8); }
      fp = pt;
    });
    if (fg.P.length) {
      const m = new THREE.Mesh(fg.geometry(), new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }));
      m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'quezaltepeque grounds fences'; root.add(m);
    }

    // the walls: grey concrete blocks 2 m high, 0.2 m thick, in pieces of at most 4 m on the ground
    const WC = [0.66, 0.65, 0.62], WT = [0.58, 0.57, 0.54]; let wp = null; st.wall = 0;
    runs(WALL, 4, (x, z, dx, dz, along, first) => {
      if (wp && !first && past(x, z, 1.5) && past(wp.x, wp.z, 1.5)) {
        const mx = (x + wp.x) / 2, mz = (z + wp.z) / 2, y = Math.min(nrGround(x, z), nrGround(wp.x, wp.z), nrGround(mx, mz));
        box(scen.get(mx, mz), mx, y - 0.3, mz, Math.hypot(x - wp.x, z - wp.z) + 0.05, 2.3, 0.2, Math.atan2(dz, dx), WC, WT, true);
        exclPush(mx, mz, 2.5); CR.avoid(mx, mz, 2.2); st.wall += Math.hypot(x - wp.x, z - wp.z);
      }
      wp = { x, z };
    });
    st.fence = Math.round(st.fence); st.wall = Math.round(st.wall);

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

    // the lone trees: the valley's broadleaf tree (the world's own, LK.woods), 9 m high, instanced
    const pts = []; for (let k = 0; k < TREE.length; k += 2) if (past(TREE[k], TREE[k + 1], 1.5)) pts.push([TREE[k], TREE[k + 1]]);
    st.trees = pts.length;
    if (pts.length && LK.woods && LK.woods.geo) {
      const im = new THREE.InstancedMesh(LK.woods.geo(1), new THREE.MeshLambertMaterial({ vertexColors: true }), pts.length), mx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
      pts.forEach(([x, z], k) => {
        q.setFromAxisAngle(up, k * 2.4); mx.compose(new THREE.Vector3(x, nrGround(x, z) - 0.1, z), q, new THREE.Vector3(9.5, 9, 9.5)); im.setMatrixAt(k, mx);
        exclPush(x, z, 5); CR.avoid(x, z, 2);
      });
      im.castShadow = true; im.name = 'quezaltepeque lone trees'; root.add(im);
    }
  }
})();
