/* =========================================================================
   WORLD — Rio do Rastro, Brazil: what stands along the SC-390 by the road (docs/proge/rastro.md, »Obcestje«), drawn into the scenery of
   Rio do Rastro's own builder (js/world-rastro.js calls API.rrObcestje before it places the spectators, so they keep off it). Places and
   lines from OpenStreetMap (ODbL 1.0, read 23. 11. 2026), only within 60 m of the road; all generic: no names, letters or signs.
   The street lamps at the top, the two gates of the side ways, the wire fence and the footpath up by the viewpoint, the memorial's stone.
   Graphics only, into the scenery's chunks (no new draw calls); the driving, physics and def.hills untouched. The game's road and its
   barriers are wider than the real road: what OpenStreetMap puts inside them is moved out past the barrier, a line is cut where it meets
   the barrier (docs/proge/rastro.md, Približki). The walls along the road (barrier=wall) are the game's own barriers already.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { box, cyl, caGround, ouRod, vrNear } = API;

  // [kind, x, z] in the game's metres (x east, z south, from the start line); OpenStreetMap's nodes
  const ITEMS = [
    ['gate', -668.0, -149.8],    // n3613610903 barrier=gate
    ['gate', -731.9, 737.0],     // n6552527710 barrier=gate
    ['lamp', -631.5, -228.1],    // n6552527720 highway=street_lamp
    ['lamp', -606.4, -140.0],    // n6552527723 highway=street_lamp
    ['lamp', -595.2, -168.3],    // n6552527724 highway=street_lamp
    ['lamp', -627.6, -194.9],    // n6552527725 highway=street_lamp
    ['lamp', -600.0, -196.1],    // n6552527728 highway=street_lamp
    ['lamp', -610.1, -204.5],    // n6552527731 highway=street_lamp
    ['memorial', -629.8, 410.2], // n4289350797 historic=memorial (its text left out)
  ];
  const CLEAR = { gate: 1.5, lamp: 0.7, memorial: 1.4 };   // past the barrier (m)
  const ROOM = { gate: 2.4, lamp: 1.0, memorial: 1.6 };    // the trees, the rocks and the spectators kept off (m)

  // lines: [kind, OpenStreetMap way, x0, z0, x1, z1, ...] (clipped to 60 m from the road)
  const LINES = [
    ['path', 696149366, [-590.0, -102.0, -587.7, -109.0, -585.7, -115.6, -583.3, -122.0, -580.5, -128.0, -578.1, -134.4, -575.1, -140.6, -571.4, -146.4, -568.0, -150.6, -565.2, -152.5]],   // highway=footway
    ['fence', 697719415, [-562.8, -145.0, -567.8, -140.2, -573.0, -135.7, -569.6, -130.0, -566.3, -124.3, -562.9, -118.6, -558.1, -123.1, -555.7, -125.3]],   // barrier=fence, fence_type=chain_link
  ];
  const PATH_W = 0.9, CUT = 0.5, POST = 2.5;   // the path's width; how far past the barrier a line starts again; the fence's post spacing (m)

  const STEEL = [0.62, 0.64, 0.67], GALV = [0.7, 0.71, 0.7], PAINT = [0.86, 0.8, 0.22], LAMP = [0.92, 0.9, 0.82], CONC = [0.66, 0.65, 0.62], CONC_T = [0.72, 0.71, 0.68];
  const EARTH = [0.46, 0.36, 0.27];

  let T;
  const near = (x, z) => { const n = vrNear(x, z); if (n.i < 0) return null; return { i: n.i, lat: n.lat, sd: n.lat >= 0 ? 1 : -1 }; };
  const bar = (i, sd) => (sd > 0 ? T.br[i] : T.bl[i]);
  const onRoad = (x, z) => { const n = near(x, z); return !!n && Math.abs(n.lat) < bar(n.i, n.sd) + CUT; };
  const hitB = (blds, x, z, r) => (blds || []).some((b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang), dx = x - b.x, dz = z - b.z;
    return Math.abs(dx * c + dz * s) < b.L / 2 + r && Math.abs(-dx * s + dz * c) < b.W / 2 + r; });

  function place(blds) {
    const out = [];
    for (const [k, x0, z0] of ITEMS) {
      const n = near(x0, z0); if (!n) continue;
      const i = n.i, lim = bar(i, n.sd) + CLEAR[k]; let x = x0, z = z0;
      if (Math.abs(n.lat) < lim) { const d = n.sd * lim - n.lat; x += T.nx[i] * d; z += T.nz[i] * d; }
      for (let t = 0; t < 16 && hitB(blds, x, z, 0.8); t++) { x += T.nx[i] * n.sd * 0.5; z += T.nz[i] * n.sd * 0.5; }   // (clear of a house: farther out)
      out.push({ k, x, z, a: Math.atan2(T.tz[i], T.tx[i]), sd: n.sd });
    }
    return out;
  }

  // called by js/world-rastro.js with its scenery chunks and its exclusion circles, before the spectators and the forest
  API.rrObcestje = function ({ scen, exclPush, blds, out }) {
    T = API.T; if (!T || !scen) return;
    const st = { gate: 0, lamp: 0, memorial: 0, pathM: 0, fenceM: 0, posts: 0 };
    for (const p of place(blds)) { exclPush(p.x, p.z, ROOM[p.k]); item(scen, p); st[p.k]++; }
    for (const [k, , L] of LINES) {
      for (let j = 0; j + 3 < L.length; j += 2) {
        const x0 = L[j], z0 = L[j + 1], x1 = L[j + 2], z1 = L[j + 3];
        if (onRoad(x0, z0) || onRoad(x1, z1) || onRoad((x0 + x1) / 2, (z0 + z1) / 2)) continue;
        const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz); if (len < 0.2) continue;
        const g = scen.get((x0 + x1) / 2, (z0 + z1) / 2);
        if (k === 'path') {   // a strip of red earth a few cm over the ground
          const px = -dz / len * PATH_W / 2, pz = dx / len * PATH_W / 2, y0 = caGround(x0, z0) + 0.06, y1 = caGround(x1, z1) + 0.06;
          g.quadUp([x0 - px, y0, z0 - pz], [x1 - px, y1, z1 - pz], [x1 + px, y1, z1 + pz], [x0 + px, y0, z0 + pz], [EARTH, EARTH, EARTH, EARTH]);
          st.pathM += len;
        } else {   // galvanised posts every ~2.5 m, a top rail and two wires (the mesh itself too fine to draw)
          const n = Math.max(1, Math.round(len / POST));
          let prev = null;
          for (let q = 0; q <= n; q++) {
            const t = q / n, x = x0 + dx * t, z = z0 + dz * t, y = caGround(x, z) - 0.05;
            if (q > 0 || j === 0) { cyl(g, x, y, z, 0.03, 1.85, 4, GALV); st.posts++; }
            if (prev) { ouRod(g, [prev[0], prev[1] + 1.85, prev[2]], [x, y + 1.85, z], 0.02, GALV, 3);
              for (const h of [0.15, 1.0]) ouRod(g, [prev[0], prev[1] + h, prev[2]], [x, y + h, z], 0.008, STEEL, 3); }
            prev = [x, y, z];
          }
          st.fenceM += len;
        }
        for (const [ex, ez] of [[x0, z0], [x1, z1]]) exclPush(ex, ez, k === 'path' ? 1.2 : 0.8);
      }
    }
    st.pathM = Math.round(st.pathM); st.fenceM = Math.round(st.fenceM);
    if (out) out.rastroRoadside = st;
  };

  function item(scen, p) {
    const { k, x, z, a, sd } = p, c = Math.cos(a), s = Math.sin(a), g = scen.get(x, z), y = caGround(x, z) - 0.04;
    const at = (u, v) => [x + c * u - s * v, z + s * u + c * v];   // (u along the road, v across it)
    if (k === 'gate') {   // two posts and a painted steel bar along the road, closing the side way
      for (const u of [-1.9, 1.9]) { const [px, pz] = at(u, 0); cyl(g, px, caGround(px, pz) - 0.04, pz, 0.06, 1.15, 6, STEEL); }
      const [ax, az] = at(-1.9, 0), [bx, bz] = at(1.9, 0); ouRod(g, [ax, y + 1.0, az], [bx, y + 1.0, bz], 0.04, PAINT, 4);
      ouRod(g, [ax, y + 0.55, az], [bx, y + 0.55, bz], 0.03, PAINT, 4);
    } else if (k === 'lamp') {   // a grey pole of 8 m, an arm over the road's side, the lamp's head
      cyl(g, x, y, z, 0.09, 8, 6, STEEL, STEEL, 0.06);
      const [hx, hz] = at(0, -sd * 1.4); ouRod(g, [x, y + 7.7, z], [hx, y + 8.1, hz], 0.04, STEEL, 4);
      box(g, hx, y + 7.95, hz, 0.25, 0.12, 0.55, a + Math.PI / 2, LAMP, STEEL);
    } else if (k === 'memorial') {   // a plain concrete plinth, a smaller block on it
      box(g, x, y, z, 1.1, 0.5, 1.1, a, CONC, CONC_T);
      box(g, x, y + 0.5, z, 0.6, 1.1, 0.4, a, CONC, CONC_T);
    }
  }
})();
