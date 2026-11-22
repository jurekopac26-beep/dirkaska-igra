// Realizem 15 (partyslo a): Kanaba, Uganda – what OpenStreetMap maps within 60 m of the road that js/world-prelaz.js does not draw yet.
// Drawn: the unpaved side roads and the footpaths that leave the road, as earth strips laid on the ground, as far as 60 m from the road:
//   highway=tertiary surface=unpaved w841185883; highway=unclassified surface=unpaved w1249344225, w1280824562, w1284644179;
//   highway=path surface=unpaved w1281978708, w1281978710, w1281978712, w1281978714; highway=path (no surface=) w1249344224, w1249344227.
// Kept open: the road, its verges and barriers (no strip until 0.8 m beyond them; the side roads meet the road's own verge).
// Not drawn again: the 27 buildings (def.bld), the land cover, the streams and the lakes (js/world-prelaz.js already draws them).
// Not drawn at all: the shops, the hotel, the money agent and the camp site (no names or signs), the viewpoint (no structure in OSM), the
// wetland's edge (1 % of it within 60 m).
// Assumed: the widths (side road 4 m, footpath 1.2 m: OSM has no width=), the two paths without surface= as earth like the others, the colour
// of the earth: the red-brown of the pass's own shoulder and cuttings (PL_LOOK.kanaba in js/world-prelaz.js), matched to them on screen.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«); OSM's ways moved by the track's own alignment (0.16 m, -0.17 m).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.kanaba) return;
  const A = World.api, { Chunks, rng, vary } = A;
  const ROADS = [   // [width m, colour, [[x, z], ...]] (x east, z south; m from the start)
    [4, 0, [[-1501.3, -842.3], [-1516.0, -874.8], [-1525.2, -890.2], [-1595.3, -1077.5]]],   // w841185883 tertiary
    [4, 0, [[-1488.4, -754.1], [-1491.1, -802.5], [-1503.9, -837.0], [-1501.3, -842.3]]],   // w1249344225 unclassified
    [4, 0, [[-2544.5, -864.4], [-2543.9, -878.7], [-2540.3, -887.0], [-2537.9, -889.9], [-2530.2, -901.2], [-2524.2, -918.4], [-2521.8, -944.5], [-2525.1, -961.0]]],   // w1280824562
    [4, 0, [[-2674.4, -941.1], [-2655.5, -930.9], [-2649.6, -900.0], [-2740.3, -844.3]]],   // w1284644179
    [1.2, 1, [[-505.3, -203.2], [-486.6, -158.7], [-483.6, -75.1]]],   // w1249344224 path
    [1.2, 1, [[-1073.4, -722.7], [-1054.3, -676.5], [-1028.4, -660.5]]],   // w1249344227
    [1.2, 1, [[-2253.7, -881.1], [-2245.4, -889.9], [-2242.4, -902.4], [-2238.2, -913.7], [-2217.9, -929.1], [-2206.0, -930.9], [-2191.1, -950.4]]],   // w1281978708
    [1.2, 1, [[-2478.1, -995.2], [-2471.7, -977.1], [-2468.1, -965.3], [-2465.1, -953.4], [-2460.3, -942.1], [-2453.2, -930.9], [-2443.6, -922.6]]],   // w1281978710
    [1.2, 1, [[-2490.9, -1078.7], [-2491.4, -1091.6], [-2497.3, -1116.5], [-2501.5, -1128.3], [-2503.9, -1140.2], [-2509.9, -1150.9], [-2518.8, -1161.0], [-2530.2, -1166.3], [-2542.7, -1169.3]]],   // w1281978712
    [1.2, 1, [[-2810.8, -1145.5], [-2799.4, -1151.5], [-2788.7, -1155.6], [-2776.7, -1156.2], [-2768.4, -1147.9], [-2764.8, -1136.1], [-2763.6, -1124.2], [-2757.0, -1114.1], [-2751.1, -1104.0], [-2744.6, -1093.4]]]   // w1281978714
  ];
  const COL = [[0.46, 0.29, 0.19], [0.4, 0.26, 0.17]];   // the side road's packed earth, the path's (darker: worn, not graded)
  function add(out) {
    if (!out || !out.root || !out.matV || !A.vrNear || typeof out.groundH !== 'function') return;
    const ch = new Chunks(512), R = rng(15515), gh = out.groundH;
    // the ground's own normal: the strips shade as the slope they lie on (no flat, sunlit plank of their own)
    const nrm = (x, z) => { const e = 1.5, hx = gh(x + e, z) - gh(x - e, z), hz = gh(x, z + e) - gh(x, z - e), L = Math.hypot(hx, 2 * e, hz); return [-hx / L, 2 * e / L, -hz / L]; };
    const ok = (x, z) => { const n = A.vrNear(x, z); return n.i >= 0 && n.d <= 60 && n.dd >= 0.8; };   // within 60 m of the road, clear of its barriers
    let segs = 0;
    for (const [w, ci, P] of ROADS) {
      for (let k = 0; k + 1 < P.length; k++) {
        const [ax, az] = P[k], [bx, bz] = P[k + 1], L = Math.hypot(bx - ax, bz - az); if (L < 0.5) continue;
        const ux = (bx - ax) / L, uz = (bz - az) / L, px = -uz * w / 2, pz = ux * w / 2, n = Math.max(1, Math.ceil(L / 2));
        for (let j = 0; j < n; j++) {
          const t0 = j / n, t1 = (j + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
          if (!ok(x0, z0) || !ok(x1, z1) || !ok((x0 + x1) / 2 + px, (z0 + z1) / 2 + pz) || !ok((x0 + x1) / 2 - px, (z0 + z1) / 2 - pz)) continue;
          const at = (x, z) => [x, gh(x, z) + 0.1, z];   // (on the terrain's own surface, a little above it: no flicker)
          const c = vary(COL[ci], R, 0.03), c2 = vary(COL[ci], R, 0.03), n0 = nrm(x0, z0), n1 = nrm(x1, z1), a = at(x0 - px, z0 - pz);
          ch.get(x0, z0).quadON(a, at(x0 + px, z0 + pz), at(x1 + px, z1 + pz), at(x1 - px, z1 - pz), n0, n0, n1, n1, [(x0 + x1) / 2, a[1] - 5, (z0 + z1) / 2], c, c, c2, c2);
          segs++;
        }
      }
    }
    if (segs) ch.addTo(out.root, out.matV, false, true);
  }
  const base = World.ext.kanaba;
  World.ext.kanaba = (...a) => { const out = base(...a); add(out); return out; };
})();
