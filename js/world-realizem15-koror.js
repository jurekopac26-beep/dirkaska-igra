// WORLD — realizem 15: Koror, Palau (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road that the world does not draw yet: the furniture of the park by the lagoon 0.60–0.65 km after
// the start line (the picnic tables, the two shelters, the fitness station, the toilets, the showers) and the shower by the water at 0.28 km. Hooked by
// wrapping PL_LOOK.koror.pre (their room: no palm, tree or rock on them) and .extra (the drawing), loaded after js/world-prelaz.js.
// In the game the park's shore and the shower's spot are still lagoon (the elevation model has them under the sea; OSM's coastline 23715425
//   runs outside them), so nothing stands there yet: each piece is drawn once the ground under it is dry land (package G, the terrain).
// Drawn (OSM nodes):
//   picnic tables (amenity=picnic_table) 6139875158, 6139893755, 6139893753 (right, 29–39 m) and 6139898039 (left, 43 m);
//   shelters (amenity=shelter, no shelter_type) 6139893756 and 6139893750 (left, 35 and 57 m);
//   the fitness station (leisure=fitness_station, no fitness_station=*) 6139893749 (right, 14 m);
//   toilets (amenity=toilets) 6139901317 (left, 22 m);
//   showers (amenity=shower) 9530541686 and 9530541685 (left, 20 and 46 m), 9530541684 (s 0.44 km, left, 19 m).
// Not drawn again (the game has them): the stream 548645036 (def.streams), the pond 548387865 (def.lakes), the dock 9530541655 (a house of def.bld).
// Not drawn at all, said in the pull request: the picnic tables 6139893752 and 6139893754 and the toilets 9530541683 (on the game's road,
//   0–3 m from its centre line); the playground 1164303722 (no equipment, no surface mapped); the slide 9530541664 (height=10, its form and
//   its direction not mapped); the floating piers 1034571514 and 1034571515 (from 53 and 60 m: nearly all beyond the band); the islet
//   904153255 (the terrain is untouched); the steps 655298668; the village green 655298669 and the park 1164303721 (the ground is green
//   already); the viewpoint 6139874057 (a bare point); the businesses (food, lodging, a shop); the names.
// Assumed and said so in the pull request (OSM maps the points only): the tables of wood, 1.8 m, along the road; the shelters open pavilions
//   (a 4 × 4 m slab, four posts, a gable roof of corrugated iron in the island's colours, L.roofs); the fitness station a frame of galvanised
//   bars (three posts, two bars); the toilets a painted block hut (3.2 × 2.6 m), its door to the road, a roof of corrugated iron; the showers
//   a steel pole with its arm and head on a concrete pad. Each turned along the road.
// Room (exclPush): their footprints and 0.8 m round them; none within 2 m of the road's barrier line, in the sea or in the pond.
// Drawn into the scenery chunks (scen.get): no new draw calls, only vertices. The terrain, the road and the driving are untouched.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.koror) return;
  const API = World.api, L = API.PL_LOOK.koror;
  const { box, caGround, caH, cyl, gable, rng, vrNear, vrWater } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // [node, kind, x, z]: 0 picnic table, 1 shelter, 2 fitness station, 3 toilets, 4 shower
  const ITEMS = [
    [6139875158, 0, -565.0, 206.1], [6139893755, 0, -571.1, 209.5], [6139893753, 0, -575.1, 221.2], [6139898039, 0, -532.4, 282.1],
    [6139893756, 1, -533.9, 274.4], [6139893750, 1, -533.5, 298.0],
    [6139893749, 2, -597.0, 248.3],
    [6139901317, 3, -582.3, 281.9],
    [9530541686, 4, -587.1, 281.7], [9530541685, 4, -580.3, 307.3], [9530541684, 4, -248.0, 130.8],
  ];
  const ROOM = [1.2, 2.9, 1.2, 2.2, 0.75], HALF = [0.85, 2.2, 0.3, 1.5, 0.5];   // the footprint's radius; its half-depth across the road
  const CLEAR = 2.0;
  const WOOD = [0.5, 0.36, 0.22], WOOD_TOP = [0.6, 0.45, 0.3], CONC = [0.66, 0.64, 0.6], CONC_TOP = [0.74, 0.72, 0.68], POST = [0.8, 0.78, 0.74],
    WALL = [0.86, 0.84, 0.78], STEEL = [0.66, 0.68, 0.7], DOOR = [0.34, 0.52, 0.6];

  function place({ P, exclPush }) {
    const items = [];
    for (const [, kind, x, z] of ITEMS) {
      if (P.sea !== null && caH(x, z) < P.sea + 0.4) continue;   // (in the lagoon; before the terrain, so on caH, which keeps nothing: caGround would
      // fill the terrain's grid before the walls' banks are known)
      if (vrWater(x, z).e > -ROOM[kind] - 1) continue;   // (in the pond, the stream)
      const v = vrNear(x, z); if (v.i < 0 || v.dd < CLEAR + HALF[kind]) continue;
      const i = v.i, side = v.lat > 0 ? 1 : -1;
      items.push({ kind, x, z, side, rot: Math.atan2(T.tz[i], T.tx[i]), e: exclPush(x, z, ROOM[kind] + 0.8) });
    }
    return items;
  }

  // the place's frame (u along the road, v across it, +v to the road's right) and the ground under its footprint
  function site(o, hu, hv) {
    const c = Math.cos(o.rot), s = Math.sin(o.rot), at = (u, v) => [o.x + u * c - v * s, o.z + u * s + v * c];
    let lo = 1e9, hi = -1e9;
    for (const [u, v] of [[-hu, -hv], [hu, -hv], [hu, hv], [-hu, hv], [0, 0]]) { const [x, z] = at(u, v), y = caGround(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    return { at, lo, hi };
  }

  function table(g, o) {
    const { at, lo, hi } = site(o, 0.9, 0.8), y = (lo + hi) / 2, r = o.rot;
    { const [x, z] = at(0, 0); box(g, x, y + 0.71, z, 1.8, 0.05, 0.74, r, WOOD, WOOD_TOP, true); }   // (the top)
    for (const v of [-0.62, 0.62]) { const [x, z] = at(0, v); box(g, x, y + 0.41, z, 1.8, 0.05, 0.28, r, WOOD, WOOD_TOP, true); }   // (the benches)
    for (const u of [-0.68, 0.68]) {
      { const [x, z] = at(u, 0); box(g, x, y + 0.35, z, 0.07, 0.06, 1.5, r, WOOD, null, true); }   // (the rail under the benches)
      for (const v of [-0.34, 0.34]) { const [x, z] = at(u, v); box(g, x, lo - 0.05, z, 0.07, y + 0.71 - lo + 0.05, 0.08, r, WOOD, null, true); }   // (the legs)
    }
  }

  function shelter(g, o, R) {
    const { at, lo, hi } = site(o, 2, 2), top = hi + 0.12, r = o.rot, [x, z] = at(0, 0);
    box(g, x, lo - 0.25, z, 4, top - lo + 0.25, 4, r, CONC, CONC_TOP, true);   // (the slab)
    for (const u of [-1.78, 1.78]) for (const v of [-1.78, 1.78]) { const [px, pz] = at(u, v); box(g, px, top, pz, 0.16, 2.5, 0.16, r, POST, null, true); }   // (the posts)
    box(g, x, top + 2.5, z, 4.3, 0.14, 4.3, r, POST);   // (the eaves)
    gable(g, x, top + 2.64, z, 4.7, 4.7, 1.2, r, L.roofs[Math.floor(R() * L.roofs.length)], POST);
  }

  function fitness(g, o) {
    const { at, lo, hi } = site(o, 1.05, 0.1), y = (lo + hi) / 2, r = o.rot;
    for (const [u, h] of [[-1, 2.3], [0, 2.3], [1, 1.6]]) { const [x, z] = at(u, 0), gy = caGround(x, z) - 0.15; cyl(g, x, gy, z, 0.055, y + h - gy, 6, STEEL, STEEL); }   // (the posts)
    { const [x, z] = at(-0.5, 0); box(g, x, y + 2.17, z, 1.0, 0.05, 0.05, r, STEEL); }   // (the high bar)
    { const [x, z] = at(0.5, 0); box(g, x, y + 1.47, z, 1.0, 0.05, 0.05, r, STEEL); }   // (the low bar)
  }

  function toilets(g, o, R) {
    const { at, lo, hi } = site(o, 1.7, 1.4), base = hi + 0.1, r = o.rot, [x, z] = at(0, 0);
    box(g, x, lo - 0.25, z, 3.4, base - lo + 0.25, 2.8, r, CONC, CONC_TOP, true);   // (the plinth)
    box(g, x, base, z, 3.2, 2.5, 2.6, r, WALL, WALL, true);   // (the walls)
    { const [dx, dz] = at(0, -o.side * 1.31); box(g, dx, base, dz, 0.9, 2.05, 0.05, r, DOOR, null, true); }   // (the door, to the road)
    gable(g, x, base + 2.5, z, 3.7, 3.1, 0.8, r, L.roofs[Math.floor(R() * L.roofs.length)], WALL);
  }

  function shower(g, o) {
    const { at, lo, hi } = site(o, 0.5, 0.5), top = hi + 0.08, r = o.rot, [x, z] = at(0, 0);
    box(g, x, lo - 0.2, z, 1, top - lo + 0.2, 1, r, CONC, CONC_TOP, true);   // (the pad)
    { const [px, pz] = at(0, o.side * 0.36); cyl(g, px, top, pz, 0.04, 2.3, 6, STEEL, STEEL); }   // (the pole, at the pad's back edge)
    { const [ax, az] = at(0, o.side * 0.17); box(g, ax, top + 2.24, az, 0.05, 0.05, 0.42, r, STEEL); }   // (the arm)
    { const [hx, hz] = at(0, -o.side * 0.02); cyl(g, hx, top + 2.14, hz, 0.1, 0.08, 6, STEEL, STEEL, 0.07); }   // (the head)
  }

  const DRAW = [table, shelter, fitness, toilets, shower];
  const pre0 = L.pre, extra0 = L.extra; let cur = null;
  L.pre = function (k) { if (pre0) pre0.call(this, k); cur = place(k); };
  L.extra = function (k) {
    if (extra0) extra0.call(this, k);
    if (!cur) return;
    const items = cur, r0 = items.map(o => o.e.r); cur = null;
    for (const o of items) o.e.r = 0;
    const ok = items.filter(o => !k.excluded(o.x, o.z) && !(k.P.sea !== null && caGround(o.x, o.z) < k.P.sea + 0.4));   // (a house, a crowd or a plot of
    // the game's on the spot, or the finished terrain's lagoon: not drawn)
    items.forEach((o, i) => { o.e.r = r0[i]; });
    const R = rng(L.seed + 1503);
    for (const o of ok) DRAW[o.kind](k.scen.get(o.x, o.z), o, R);
  };
})();
