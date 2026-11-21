// WORLD — realizem 15: Seul, Južna Koreja (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road and the track's own world (js/world-seoul.js) does not draw yet.
// Loaded right after the track's own world builder, which calls World.api.seRealizem15 once per build (before the lamps and the trees, so
// that they keep clear of the new things).
// Drawn (into the world's existing scenery chunks: no collision bodies, the driving is untouched):
//  - by the tower: the wooden deck (way 1214950314: highway=pedestrian, area, surface=wood), the paved squares (ways 1214950315,
//    surface=paving_stones, and 1214950320) and the car park (way 1214950313), each in its own outline, laid on the ground of the
//    elevation model;
//  - the fitness station (way 369969740, fitness_station=box): its two flower beds (ways 1572430695, 1572430694), its three benches
//    (nodes 14325223294, 14325212362, 14325223293) and one set of three jump boxes;
//  - four benches by the road (nodes 14138452844, 14143393984, 14138496087, 14138496086);
//  - the bicycle docking station (node 11155393006, capacity=12): twelve plain docks in a row, no bicycles, no words, no colours of anyone;
//  - past the finish: a shelter (node 13948974301) and two benches (nodes 14138585850, 14138585849).
// Not drawn again (the world has them): the tower and the building at its foot, the pavilion, the bus park, the old city wall and the other
//   walls, the bus stops, the crossings and the signals, the buildings, the other streets, and the world's own six points (three lookouts,
//   a stone, a statue, a shelter).
// Not drawn at all (said in the PR): what OSM has inside the outline of the building way 1554012455 (five benches, drinking water, a waste
//   basket, two bollards, a lookout), since the world draws that outline as a building; the side paths and steps (#779); boards, guideposts
//   and maps (words); cafes, restaurants and offices (venues); statues, artwork and memorials (the legal filter); a bollard in the woods, a
//   gate in the road, a water tap and four benches before the start.
// Assumed (said in the PR): the square 1214950320 has no surface tag and is paved like its neighbour; the car park is plain asphalt without
//   bays; the benches are plain seats without backs, lengthwise to the road (no direction is mapped); the two benches 14138496087 and
//   14138496086 lie inside the race's barriers and are moved out behind them, like the world's own points; the docks stand lengthwise to the
//   road; the jump boxes (their number, size and place: OSM maps only the station's outline and kind); the colours of the flowers.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.seoul) return;
  const API = World.api, { box, gable, inPoly, nrGround, nrNear, rng, vary } = API;

  // Metres from the tool's first point (the world's own frame), x east, z south.
  const AREAS = [   // [OSM way, kind, outline]
    [1214950314, 'wood', [[-844.8, -645.0], [-807.1, -656.0], [-807.9, -660.5], [-802.8, -661.7], [-781.8, -666.8], [-782.1, -667.7], [-760.9, -673.7], [-759.4, -666.4],
      [-783.2, -659.2], [-783.8, -656.1], [-823.3, -645.5], [-821.7, -639.5], [-835.1, -635.8], [-835.7, -641.4], [-840.8, -640.0], [-843.8, -639.0]]],
    [1214950315, 'paving', [[-806.8, -684.6], [-806.3, -682.0], [-802.8, -661.7], [-781.8, -666.8], [-782.1, -667.7], [-785.4, -681.4], [-787.3, -689.3]]],
    [1214950320, 'paving', [[-785.4, -681.4], [-763.9, -687.2], [-761.8, -678.3], [-760.9, -673.7], [-782.1, -667.7]]],
    [1214950313, 'asphalt', [[-868.3, -639.3], [-867.1, -623.1], [-840.2, -629.5], [-840.8, -640.0], [-843.8, -639.0], [-844.8, -645.0], [-865.6, -639.9]]],
  ];
  const BEDS = [   // [OSM way, outline]
    [1572430695, [[-396.1, -497.7], [-398.0, -495.6], [-386.7, -487.7], [-384.9, -490.2]]],
    [1572430694, [[-409.0, -503.3], [-398.4, -495.8], [-396.5, -497.9], [-407.3, -505.1]]],
  ];
  const BENCHES = [   // [OSM node, x, z]
    [14138452844, -367.4, -261.5], [14143393984, -367.3, -265.8], [14325223294, -395.4, -505.5], [14325212362, -397.6, -506.3], [14325223293, -404.6, -508.3],
    [14138496087, -478.6, -561.8], [14138496086, -482.6, -563.9], [14138585850, -1585.2, -1057.2], [14138585849, -1581.5, -1059.5],
  ];
  const DOCKS = [11155393006, -1386.9, -804.9, 12];   // OSM node, x, z, capacity
  const SHELTER = [13948974301, -1635.6, -1000.8];    // OSM node, x, z
  const BOXES = [369969740, -392.0, -501.0];          // OSM way, the free middle of its outline

  const KIND = {   // the top's colour and how much it wanders, the rim's colour, how high it lies over the ground
    wood: [[0.6, 0.47, 0.33], 0.12, [0.42, 0.32, 0.22], 0.12],
    paving: [[0.69, 0.68, 0.64], 0.07, [0.55, 0.54, 0.51], 0.12],
    asphalt: [[0.42, 0.42, 0.43], 0.04, [0.36, 0.36, 0.37], 0.1],
  };
  const WOOD = [0.6, 0.45, 0.3], WOODD = [0.5, 0.36, 0.24], METAL = [0.46, 0.47, 0.49], DOCK = [0.72, 0.73, 0.75], DOCKT = [0.82, 0.83, 0.85], PAD = [0.66, 0.65, 0.62];
  const PLY = [0.66, 0.54, 0.38], PLYT = [0.74, 0.62, 0.44], POST = [0.62, 0.16, 0.12], TILE = [0.27, 0.28, 0.3], SOIL = [0.4, 0.31, 0.22], LEAF = [0.27, 0.42, 0.2];
  const FLOWERS = [[0.86, 0.5, 0.6], [0.92, 0.88, 0.82], [0.9, 0.78, 0.3], [0.78, 0.36, 0.42]];

  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  // A triangle cut at the middle of its longest side until no side is longer than `max`: a side is always halved, so neighbours (and the rim)
  // meet in the same points.
  function split(a, b, c, max, emit) {
    const ab = len(a, b), bc = len(b, c), ca = len(c, a), m = Math.max(ab, bc, ca);
    if (m <= max) { emit(a, b, c); return; }
    if (m === ab) { const p = mid(a, b); split(a, p, c, max, emit); split(p, b, c, max, emit); }
    else if (m === bc) { const p = mid(b, c); split(a, b, p, max, emit); split(a, p, c, max, emit); }
    else { const p = mid(c, a); split(a, b, p, max, emit); split(p, b, c, max, emit); }
  }
  function cut(a, b, max, to) { if (len(a, b) <= max) { to.push(a); return; } const p = mid(a, b); cut(a, p, max, to); cut(p, b, max, to); }

  API.seRealizem15 = function (W) {
    const { T, scen, out, exclPush, inBld, bar } = W, R = rng(15882), st = { areas: 0, beds: 0, tris: 0, benches: 0, docks: 0, shelters: 0, boxes: 0, skipped: [] };   // (skipped: the OSM ids left out, since they fall inside a building the world draws)
    const inRace = (x, z) => { const n = nrNear(x, z); return n.i >= 0 && n.dd < 0.8; };

    // a flat thing in an outline of OSM, laid on the ground: its top `lift` over it, a rim down into it; nothing may be planted on it
    const surface = (pts, lift, max, rim, colour) => {
      const vs = new Map();
      const V = (p) => { const k = Math.round(p[0] * 100) + ',' + Math.round(p[1] * 100); let v = vs.get(k);
        if (!v) { const y = nrGround(p[0], p[1]); vs.set(k, v = { p: [p[0], y + lift, p[1]], f: [p[0], y - 0.08, p[1]], c: colour() }); } return v; };
      const emit = (a, b, c) => { const mx = (a[0] + b[0] + c[0]) / 3, mz = (a[1] + b[1] + c[1]) / 3; if (inRace(mx, mz)) return;
        const A = V(a), B = V(b), C = V(c); scen.get(mx, mz).triUp(A.p, B.p, C.p, [A.c, B.c, C.c]); st.tris++; };
      for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p[0], p[1])), [])) split(pts[a], pts[b], pts[c], max, emit);
      for (let k = 0; k < pts.length; k++) {
        const a = pts[k], b = pts[(k + 1) % pts.length], l = len(a, b); if (l < 0.05) continue;
        const nx = -(b[1] - a[1]) / l * 0.05, nz = (b[0] - a[0]) / l * 0.05, m = mid(a, b), sg = inPoly(pts, m[0] + nx, m[1] + nz) ? 1 : -1, row = [];
        cut(a, b, max, row); row.push(b);
        for (let q = 0; q + 1 < row.length; q++) { const u = V(row[q]), v = V(row[q + 1]), mx = (u.p[0] + v.p[0]) / 2, mz = (u.p[2] + v.p[2]) / 2; if (inRace(mx, mz)) continue;
          scen.get(mx, mz).quadO(u.p, v.p, v.f, u.f, rim, [mx + nx * sg * 20, (u.p[1] + v.p[1]) / 2, mz + nz * sg * 20]); }
      }
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let x = x0; x <= x1; x += 2) for (let z = z0; z <= z1; z += 2) if (inPoly(pts, x, z)) exclPush(x, z, 2.0);
    };

    // a point of OSM by the road: where it falls inside the race's barriers, moved out behind them along its own station (as the world does)
    const place = (x, z, behind) => {
      const n = nrNear(x, z); if (n.i < 0) return null;
      const i = n.i; if (n.dd >= behind) return { x, z, i, sd: n.lat >= 0 ? 1 : -1 };
      const sd = n.lat >= 0 ? 1 : -1, al = (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i], o = sd * (bar(i, sd) + behind);
      return { x: T.px[i] + T.tx[i] * al + T.nx[i] * o, z: T.pz[i] + T.tz[i] * al + T.nz[i] * o, i, sd };
    };
    const seat = (g, x, y, z, i, L) => {
      box(g, x, y + 0.4, z, L, 0.06, 0.42, T.hd[i], WOODD, WOOD);
      for (const a of [-L / 2 + 0.18, L / 2 - 0.18]) box(g, x + T.tx[i] * a, y - 0.1, z + T.tz[i] * a, 0.07, 0.5, 0.34, T.hd[i], METAL);
    };

    /* ---- the benches: a plain seat on two legs ---- */
    for (const [id, x0, z0] of BENCHES) {
      const p = place(x0, z0, 1.2); if (!p) { st.skipped.push(id); continue; }
      const { x, z, i } = p; if ([-0.8, 0, 0.8].some(a => inBld(x + T.tx[i] * a, z + T.tz[i] * a))) { st.skipped.push(id); continue; }
      seat(scen.get(x, z), x, nrGround(x, z), z, i, 1.6); exclPush(x, z, 1.4); st.benches++;
    }

    /* ---- the bicycle docking station: as many docks as its capacity, each on its own small pad ---- */
    {
      const [id, x0, z0, n] = DOCKS, p = place(x0, z0, 1.5);
      if (p) for (let k = 0; k < n; k++) {
        const a = (k - (n - 1) / 2) * 0.7, x = p.x + T.tx[p.i] * a, z = p.z + T.tz[p.i] * a, y = nrGround(x, z), g = scen.get(x, z); if (inBld(x, z)) { st.skipped.push(id); continue; }
        box(g, x, y - 0.06, z, 0.72, 0.12, 1.5, T.hd[p.i], PAD); box(g, x, y + 0.06, z, 0.14, 0.78, 0.36, T.hd[p.i], DOCK, DOCKT);
        exclPush(x, z, 1.6); st.docks++;
      }
    }

    /* ---- the fitness station's jump boxes: three of rising height in a row ---- */
    {
      const [id, x0, z0] = BOXES, p = place(x0, z0, 1.5);
      if (p) [0.3, 0.45, 0.6].forEach((h, k) => {
        const a = (k - 1) * 1.3, x = p.x + T.tx[p.i] * a, z = p.z + T.tz[p.i] * a; if (inBld(x, z)) { st.skipped.push(id); return; }
        box(scen.get(x, z), x, nrGround(x, z) - 0.05, z, 0.76, h + 0.05, 0.6, T.hd[p.i], PLY, PLYT); exclPush(x, z, 1.4); st.boxes++;
      });
    }

    /* ---- the shelter past the finish: four posts, a gabled roof of dark tiles, a bench (the shape of the world's own shelter) ---- */
    {
      const [id, x0, z0] = SHELTER, p = place(x0, z0, 2.5);
      if (!p || inBld(p.x, p.z)) st.skipped.push(id);
      else {
        const { x, z, i, sd } = p, y = nrGround(x, z), g = scen.get(x, z), ang = T.hd[i], ox = T.nx[i] * sd, oz = T.nz[i] * sd;   // (ox, oz: away from the road)
        for (const [u, v] of [[-1.6, -1.0], [1.6, -1.0], [-1.6, 1.0], [1.6, 1.0]]) box(g, x + T.tx[i] * u + ox * v, y - 0.2, z + T.tz[i] * u + oz * v, 0.16, 2.6, 0.16, ang, POST);
        gable(g, x, y + 2.4, z, 4.0, 2.9, 1.0, ang, TILE, [0.5, 0.36, 0.26]);
        box(g, x + ox * 0.7, y + 0.42, z + oz * 0.7, 2.6, 0.08, 0.45, ang, WOOD);
        exclPush(x, z, 3); st.shelters++;
      }
    }

    /* ---- the flower beds: low heaps of soil, planted ---- */
    for (const [, pts] of BEDS) { surface(pts, 0.22, 0.7, SOIL, () => R() < 0.36 ? vary(FLOWERS[Math.floor(R() * FLOWERS.length) % FLOWERS.length], R, 0.12) : vary(LEAF, R, 0.3)); st.beds++; }

    /* ---- the deck, the squares and the car park by the tower ---- */
    for (const [, kind, pts] of AREAS) { const [col, amt, rim, lift] = KIND[kind]; surface(pts, lift, 2.5, rim, () => vary(col, R, amt)); st.areas++; }

    out.r15 = st;
  };
})();
