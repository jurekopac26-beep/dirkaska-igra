// WORLD — Lombok, Indonesia: what OpenStreetMap maps beside the circuit within ~60 m of its asphalt that the world does not draw yet
// (docs/proge/lombok.md, »Ob cesti«). Hooked by wrapping RB_LOOK.lombok.extra (js/world-lombok.js: the service roads, the building past the
// pit lane, the streams, the sea), after it and before the crowds and the trees, which keep clear of it; loaded after js/world-lombok.js.
// Drawn (OSM; the object, its tags, where it is: metres after the start line, its side, its distance from the asphalt):
//   way 1194049492, amenity=parking, parking=surface, surface=concrete (403, left, 50 m): the concrete car park beside the long building past
//     the pit lane (def.sk.bld, OSM way 1041715029, already drawn), its outline as OSM has it, on the ground, its edge a low kerb;
//   nodes 9590200527 (3502, left, 62 m) and 9590200559 (3518, left, 66 m), barrier=gate, access=no: the gates on the two one-way service
//     roads at the back of the circuit (OSM ways 1041715076 and 27727498, drawn by js/world-lombok.js), shut.
// Not drawn, said in the pull request: the buildings 68-71 m off (OSM ways 1154505261, 1154505262), the car parks 86-115 m off, the
//   demolished:building outlines (not there any more), every name.
// Assumed and said so in the pull request (OSM maps neither): the car park plain concrete without markings, a kerb 12 cm high round it; the
//   gates as two leaves of galvanised steel tube 1.2 m high across the 5 m service road, a post each side.
// Drawn into the builder's scenery chunks (scen.get): no new draw calls, only vertices. Graphics only: the terrain, the circuit, its barriers
// and the driving are untouched.
// Data: © OpenStreetMap contributors, ODbL 1.0, read 23. 11. 2026 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.rbLook || !World.api.rbLook.lombok) return;
  const API = World.api, L = API.rbLook.lombok, base = L.extra;
  const { box, nrGround } = API;

  // the car park (way 1194049492): its outline in the game's metres (x east, z south; the start line at 0, 0)
  const PARK = [396.1, -152.8, 448.1, -166.1, 445.5, -180.1, 447.3, -201.5, 438.9, -195.4, 392.5, -181.6, 391.1, -177.7, 387.3, -176.6];
  // the gates (nodes 9590200527, 9590200559): x, z, then the way's direction through them (the points before and after it on the way)
  const GATES = [[-497.4, 113.3, -481.8, 116.1, -511.3, 113.0], [-506.0, 97.4, -514.3, 102.4, -498.3, 86.7]];
  const LIFT = 0.1, KERB = 0.12, EDGE = 3;   // (the slab over the ground, the kerb over the slab, the longest edge of its triangles: the terrain under it)
  const CON = [0.68, 0.67, 0.64], KC = [0.82, 0.81, 0.78], STEEL = [0.66, 0.68, 0.7], POST = [0.6, 0.62, 0.64];

  function park({ scen, exclPush, CR }, st) {
    const n = PARK.length / 2, P = []; for (let k = 0; k < n; k++) P.push([PARK[k * 2], PARK[k * 2 + 1]]);
    const tris = THREE.ShapeUtils.triangulateShape(P.map(([x, z]) => new THREE.Vector2(x, z)), []);
    const top = (x, z) => [x, nrGround(x, z) + LIFT, z];
    const tone = ([x, z]) => { const k = 0.97 + 0.03 * Math.sin(x * 0.11 + 1.3) * Math.cos(z * 0.13 - 0.4); return CON.map(v => v * k); };   // (the concrete a little uneven in tone, smoothly, not by the triangle)
    const split = (a, b, c) => {   // (each triangle halved at its longest edge until none is longer than EDGE: the slab on the terrain)
      const d = [[a, b, c], [b, c, a], [c, a, b]].map(([p, q, r]) => [Math.hypot(q[0] - p[0], q[1] - p[1]), p, q, r]).sort((u, v) => v[0] - u[0])[0];
      if (d[0] <= EDGE) {
        const g = scen.get((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3);
        g.triUp(top(a[0], a[1]), top(b[0], b[1]), top(c[0], c[1]), [tone(a), tone(b), tone(c)]); st.obcPark++; return;
      }
      const [, p, q, r] = d, m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; split(p, m, r); split(m, q, r);
    };
    for (const [i, j, k] of tris) split(P[i], P[j], P[k]);
    for (let k = 0; k < n; k++) {   // (the kerb: its top KERB over the slab's edge, its outer face down into the ground)
      const [ax, az] = P[k], [bx, bz] = P[(k + 1) % n], len = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(len / EDGE));
      for (let t = 0; t < m; t++) {
        const x = ax + (bx - ax) * (t + 0.5) / m, z = az + (bz - az) * (t + 0.5) / m, y = nrGround(x, z);
        box(scen.get(x, z), x, y - 0.2, z, len / m + 0.02, LIFT + KERB + 0.2, 0.15, Math.atan2(bz - az, bx - ax), KC, KC, true);
      }
    }
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const inside = (x, z) => { let c = false; for (let a = 0, b = n - 1; a < n; b = a++) { const [xa, za] = P[a], [xb, zb] = P[b]; if ((za > z) !== (zb > z) && x < (xb - xa) * (z - za) / (zb - za) + xa) c = !c; } return c; };
    for (let x = x0; x <= x1; x += 5) for (let z = z0; z <= z1; z += 5) if (inside(x, z)) { exclPush(x, z, 4.5); CR.avoid(x, z, 4); }   // (no tree, bush or spectator on it)
  }

  function gates({ scen, exclPush }, st) {
    for (const [x, z, ax, az, bx, bz] of GATES) {
      const h = Math.atan2(bz - az, bx - ax), c = Math.cos(h), s = Math.sin(h), nx = -s, nz = c, rot = h + Math.PI / 2, g = scen.get(x, z);   // (rot: the gate's line across the way)
      for (const o of [-2.75, 2.75]) { const px = x + nx * o, pz = z + nz * o; box(g, px, nrGround(px, pz) - 0.3, pz, 0.12, 1.7, 0.12, rot, POST, POST, true); }
      for (const side of [-1, 1]) {   // (two leaves, each from its post to the middle, shut)
        const ox = x + nx * side * 1.36, oz = z + nz * side * 1.36, y = nrGround(ox, oz);
        for (const hy of [0.15, 0.62, 1.15]) box(g, ox, y + hy, oz, 2.6, 0.05, 0.05, rot, STEEL, STEEL, false);
        for (const e of [-1.27, 1.27]) { const vx = ox + nx * e, vz = oz + nz * e; box(g, vx, y + 0.15, vz, 0.05, 1.05, 0.05, rot, STEEL, STEEL, true); }
      }
      exclPush(x, z, 4); st.obcGates++;
    }
  }

  L.extra = (o) => {
    const st = base ? base(o) || {} : {};
    st.obcPark = 0; st.obcGates = 0;
    park(o, st); gates(o, st);
    return st;
  };
})();
