/* =========================================================================
   WORLD — Montréal, Canada: what the island keeps beside the circuit and its own builder does not draw yet (docs/proge/montreal.md,
   »Oprema ob progi«), on top of js/world-montreal.js (its hook World.api.mtObc, called before the trees). Places from OpenStreetMap
   (ODbL 1.0, read 23. 11. 2026), only the nodes within 60 m of the road: the single trees OpenStreetMap maps (broadleaved; along the
   lagoon walk and by the rowing basin's lawn), the picnic tables (wooden ones on the basin's bank) and the two bicycle racks (one under
   a roof). The hydrants, benches, bollards, boards and drinking fountains the builder already draws from its own data (D.fur) are left
   to it. All generic: no names or letters. Graphics only, into the builder's scenery chunks and its tree instances (no new draw calls);
   the driving and the physics untouched. Whatever OpenStreetMap puts inside the game's barriers is moved out past them.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const { box, cyl } = World;
  const TAU = Math.PI * 2;

  // [kind, x, z] in the game's metres (x east, z south, from the start line); OpenStreetMap's nodes
  const ITEMS = [
    ['rack', -458.6, -686.7],     // n14262298904 amenity=bicycle_parking, covered=yes
    ['rack', -364.8, 162.5],      // n11815850272 amenity=bicycle_parking
    ['table', -424.7, 48.5],      // n11815832768 leisure=picnic_table
    ['table', -402.3, 95.7],      // n11565461063 leisure=picnic_table
    ['table', -393.7, 107.0],     // n11565461064 leisure=picnic_table
    ['table', -390.4, 114.7],     // n11565461065 leisure=picnic_table
    ['table', -380.9, 134.7],     // n11815850269 leisure=picnic_table
    ['table', -377.4, -999.9],    // n11574850003 leisure=picnic_table, material=wood
    ['table', -369.9, -1025.2],   // n11574850002 leisure=picnic_table, material=wood
    ['table', -368.0, -158.7],    // n11615113209 leisure=picnic_table
    ['table', -367.5, 158.3],     // n11565461066 leisure=picnic_table
    ['table', -364.8, -1055.7],   // n11574850000 leisure=picnic_table, material=wood
    ['table', -359.9, -1075.6],   // n11574849999 leisure=picnic_table, material=wood
    ['table', -341.2, -1098.3],   // n11574849998 leisure=picnic_table, material=wood
    ['tree', -155.2, -624.0],     // n13194331381 natural=tree, leaf_type=broadleaved
    ['tree', -145.6, -620.4],     // n13194331332 natural=tree, leaf_type=broadleaved
    ['tree', -144.7, -631.0],     // n13194331333 natural=tree, leaf_type=broadleaved
    ['tree', -140.3, -611.9],     // n13194331331 natural=tree, leaf_type=broadleaved
    ['tree', -139.4, -640.2],     // n13194331340 natural=tree, leaf_type=broadleaved
    ['tree', -139.4, -625.7],     // n13194331334 natural=tree, leaf_type=broadleaved
    ['tree', -137.1, -603.3],     // n13194331330 natural=tree, leaf_type=broadleaved
    ['tree', -136.5, -529.6],     // n13194331374 natural=tree, leaf_type=broadleaved
    ['tree', -136.3, -595.1],     // n13194331329 natural=tree, leaf_type=broadleaved
    ['tree', -134.6, -619.0],     // n13194331335 natural=tree, leaf_type=broadleaved
    ['tree', -132.4, -636.5],     // n13194331339 natural=tree, leaf_type=broadleaved
    ['tree', -131.4, -648.9],     // n13194331341 natural=tree, leaf_type=broadleaved
    ['tree', -131.0, -612.8],     // n13194331336 natural=tree, leaf_type=broadleaved
    ['tree', -130.0, -528.1],     // n13194331373 natural=tree, leaf_type=broadleaved
    ['tree', -129.6, -642.0],     // n13194331342 natural=tree, leaf_type=broadleaved
    ['tree', -129.2, -521.8],     // n13194331376 natural=tree, leaf_type=broadleaved
    ['tree', -128.3, -632.2],     // n13194331338 natural=tree, leaf_type=broadleaved
    ['tree', -125.3, -635.9],     // n13194331343 natural=tree, leaf_type=broadleaved
    ['tree', -124.3, -625.4],     // n13194331337 natural=tree, leaf_type=broadleaved
    ['tree', -122.5, -562.4],     // n13194331323 natural=tree, leaf_type=broadleaved
    ['tree', -120.8, -569.2],     // n13194331324 natural=tree, leaf_type=broadleaved
    ['tree', -119.8, -518.7],     // n13194331377 natural=tree, leaf_type=broadleaved
    ['tree', -119.7, -576.3],     // n13194331325 natural=tree, leaf_type=broadleaved
    ['tree', -118.9, -582.9],     // n13194331326 natural=tree, leaf_type=broadleaved
    ['tree', -117.7, -590.0],     // n13194331327 natural=tree, leaf_type=broadleaved
    ['tree', -117.5, -525.3],     // n13194331372 natural=tree, leaf_type=broadleaved
    ['tree', -117.2, -596.8],     // n13194331328 natural=tree, leaf_type=broadleaved
    ['tree', -113.1, -617.7],     // n13194331344 natural=tree, leaf_type=broadleaved
    ['tree', -112.7, -612.2],     // n13194331345 natural=tree, leaf_type=broadleaved
    ['tree', -106.0, -582.1],     // n13194331350 natural=tree, leaf_type=broadleaved
    ['tree', -105.7, -575.0],     // n13194331349 natural=tree, leaf_type=broadleaved
    ['tree', -105.0, -568.6],     // n13194331348 natural=tree, leaf_type=broadleaved
    ['tree', -105.0, -561.3],     // n13194331347 natural=tree, leaf_type=broadleaved
    ['tree', -104.6, -555.4],     // n13194331346 natural=tree, leaf_type=broadleaved
    ['tree', -96.9, -501.7],      // n13194331385 natural=tree, leaf_type=broadleaved
    ['tree', -93.0, -496.4],      // n13194331386 natural=tree, leaf_type=broadleaved
    ['tree', -89.3, -491.2],      // n13194331387 natural=tree, leaf_type=broadleaved
    ['tree', -85.9, -484.7],      // n13194331388 natural=tree, leaf_type=broadleaved
    ['tree', -83.8, -478.2],      // n13194331389 natural=tree, leaf_type=broadleaved
    ['tree', -81.6, -472.4],      // n13194331390 natural=tree, leaf_type=broadleaved
    ['tree', -81.2, -465.0],      // n13194331391 natural=tree, leaf_type=broadleaved
    ['tree', -79.9, -458.6],      // n13194331392 natural=tree, leaf_type=broadleaved
    ['tree', -78.2, -452.0],      // n13194331393 natural=tree, leaf_type=broadleaved
    ['tree', -76.8, -444.6],      // n13194331394 natural=tree, leaf_type=broadleaved
  ];
  const CLEAR = { tree: 2.5, table: 1.8, rack: 1.2 };   // past the barrier (m)
  const ROOM = { tree: 4.5, table: 2.6, rack: 2.6 };    // the land cover's trees kept off (m)
  const COVERED = { '-458.6,-686.7': 1 };               // (covered=yes: a small roof over the rack)

  const WOOD = [0.56, 0.43, 0.29], WOOD_T = [0.63, 0.5, 0.34], WOOD_D = [0.42, 0.32, 0.22], STEEL = [0.62, 0.64, 0.67], ROOF = [0.58, 0.6, 0.62];
  const hash = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };

  World.api.mtObc = function (C, ground) {
    const { T, scen, near, exclPush, excluded } = C, st = { tree: 0, table: 0, rack: 0 }, trees = [];
    for (const [k, x0, z0] of ITEMS) {
      const q = near(x0, z0); if (q.i < 0) continue;
      const i = q.i, sd = q.lat >= 0 ? 1 : -1, lim = q.bar + CLEAR[k]; let x = x0, z = z0;
      if (Math.abs(q.lat) < lim) { const d = sd * lim - q.lat; x += T.nx[i] * d; z += T.nz[i] * d; }
      if (excluded(x, z)) continue;   // (inside a building's footprint, the pit lane or a junction's mouth: left out)
      const a = Math.atan2(T.tz[i], T.tx[i]), c = Math.cos(a), s = Math.sin(a), y = ground(x, z) - 0.03, g = scen.get(x, z);
      const at = (u, v) => [x + c * u - s * v, z + s * u + c * v];   // (u along the road, v across it)
      st[k]++;
      if (k === 'tree') { const h = 10 + hash(x0, z0) * 5, tone = 0.88 + 0.22 * hash(z0, x0); trees.push([x, z, hash(x0 + 1, z0) * TAU, h, [tone, tone, tone * 0.95]]); }
      else if (k === 'table') {   // a plank top, a bench on each side, the two trestles
        box(g, x, y + 0.72, z, 1.9, 0.06, 0.78, a, WOOD, WOOD_T);
        for (const v of [-0.62, 0.62]) { const [bx, bz] = at(0, v); box(g, bx, y + 0.42, bz, 1.9, 0.05, 0.26, a, WOOD, WOOD_T); }
        for (const u of [-0.72, 0.72]) { const [lx, lz] = at(u, 0); box(g, lx, y, lz, 0.07, 0.72, 1.4, a, WOOD_D); }
      } else if (k === 'rack') {   // five steel hoops along the road (each a bar 0.8 m up on two legs)
        for (let j = -2; j <= 2; j++) { const [px, pz] = at(j * 0.8, 0), [l0x, l0z] = at(j * 0.8 - 0.35, 0), [l1x, l1z] = at(j * 0.8 + 0.35, 0);
          cyl(g, l0x, y, l0z, 0.03, 0.8, 4, STEEL, STEEL); cyl(g, l1x, y, l1z, 0.03, 0.8, 4, STEEL, STEEL); box(g, px, y + 0.77, pz, 0.74, 0.05, 0.05, a, STEEL, STEEL); }
        if (COVERED[x0 + ',' + z0]) {   // the roof: four posts, a flat sheet
          for (const u of [-2.3, 2.3]) for (const v of [-0.9, 0.9]) { const [px, pz] = at(u, v); cyl(g, px, y, pz, 0.05, 2.3, 6, STEEL, STEEL); }
          box(g, x, y + 2.3, z, 5, 0.06, 2.1, a, ROOF, ROOF);
        }
      }
      exclPush(x, z, ROOM[k]);
    }
    C.realTrees = trees;
    if (C.out) C.out.mtRoadside = st;
    return st;
  };
})();
