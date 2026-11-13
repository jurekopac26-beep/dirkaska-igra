/* =========================================================================
   WORLD — Tuzla, Turčija (theme 'tuzla'): the circuit on the hills above Tuzla on the Asian side of Istanbul, its own parts on the shared
   builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.tuzla) goes on API.rbLook;
   World.ext.tuzla builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A12), the track: docs/proge/tuzla.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.fl, LK.colMod): the trees of the dry hills by the Sea of Marmara (umbrella
   pines, Turkish red pines, the oaks and the bushes of the maquis: tzTreeGeo), the hills' grass burnt golden by the summer and the circuit's
   watered lawns green by the track, the service roads round the circuit (def.sk.svc: OpenStreetMap) as plain asphalt on the ground, the
   buildings by the circuit (def.sk.bld: OpenStreetMap), the Turkish flag among the fans' flags (World.flagMesh's emblems, look.sym), red turn numbers. Only
   place names on its boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, RB, box, cyl, ico, lerp, nrGround, nrLCf, nrLump, nrNear, rng, sstep } = API;
  // the text boards: place names (the town, the city, the country, the villages and the district round the circuit, the region, the province
  // next door), the grandstands' names (def.stands), the start line's, the DRS boards
  const TZ_BAN = [['TUZLA', '#c8102e', '#fff', '#fff'], ['İSTANBUL', '#16213e', '#fff', '#c8102e'], ['BAŞLANGIÇ · BİTİŞ', '#16181c', '#fff', '#c8102e'], ['TÜRKİYE', '#c8102e', '#fff', '#fff'],
    ['AKFIRAT', '#16213e', '#fff', '#fff'], ['ANADOLU', '#1f5a8c', '#fff', '#fff'], ['MARMARA', '#1f5a8c', '#fff', '#c8102e'], ['KOCAELİ', '#16213e', '#fff', '#c8102e'],
    ['ORHANLI', '#2b4a2e', '#fff', '#fff'], ['DRS', '#101114', '#fff', '#39c84a']];
  const TZ_AT = { num: 0, brake: 14, ban: 17, rbr: 17, spielberg: 18 };   // atlas cells: the 14 turn numbers, the braking boards, the banners
  const TZ_SHIRTS = [[0.86, 0.1, 0.14], [0.95, 0.95, 0.93], [0.78, 0.08, 0.12], [0.14, 0.16, 0.3], [0.13, 0.13, 0.15], [0.4, 0.42, 0.46], [0.98, 0.82, 0.12], [0.2, 0.32, 0.62],
    [0.92, 0.92, 0.9], [0.55, 0.42, 0.3], [0.2, 0.46, 0.3], [0.86, 0.12, 0.16]];   // the fans' shirts at the end of the summer: lots of red and white, navy, black and grey, a few yellow, blue and green
  // the Turkish flag: red, the white crescent and star (World.flagMesh's emblems, look.sym), in the flag's height G: the crescent between the
  // circles of 0.25 G round 0.5 G from the pole and of 0.2 G round 0.5625 G, the star of 0.125 G round 0.8208 G, a point to the pole
  const TR = ((r, w) => Object.assign([r], { sym: [['moon', w, 0.5, 0.5, 0.25, 0.0625, 0.2], ['star', w, 0.8208, 0.5, 0.125, 0.0477, 5, Math.PI]] }))([0.86, 0.06, 0.1], [0.97, 0.97, 0.96]);

  // ---- the trees (unit height 1, instanced; LK.woods): 0 an umbrella pine (a bare trunk, a wide flat crown), 1 a Turkish red pine (a long
  //      trunk, orange high up, an open uneven crown of light green clumps), 2 an oak of the maquis (a short trunk, a round dark olive crown;
  //      squat: a bush); far from the road (k >= 3) plainer ----
  function tzTreeGeo(kind, far) {
    const g = new GB(), R = rng(9031 + kind * 7 + (far ? 1 : 0)), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.028, 0.76, far ? 3 : 4, [0.42, 0.32, 0.25], null, 0.02);
      ico(g, 0, 0.82, 0, 0.46, 0.3, [0.21, 0.33, 0.16], R, far ? 0.1 : 0.16);
      if (!far) { nrLump(g, 0.16, 0.88, 0.06, 0.26, 0.4, [0.18, 0.29, 0.14], R, 0.15); nrLump(g, -0.18, 0.86, -0.1, 0.22, 0.4, [0.23, 0.35, 0.17], R, 0.15); }
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.022, 0.42, 3, [0.36, 0.3, 0.25], null, 0.018); cyl(g, 0, 0.4, 0, 0.018, 0.48, 3, [0.64, 0.42, 0.25], null, 0.008);
      ico(g, 0.03, 0.8, 0, 0.21, 0.75, [0.27, 0.38, 0.17], R, 0.35);
      if (!far) { ico(g, -0.12, 0.66, 0.07, 0.16, 0.7, [0.24, 0.35, 0.15], R, 0.4); nrLump(g, 0.13, 0.6, -0.08, 0.14, 0.7, [0.26, 0.37, 0.16], R, 0.4); }
    } else {
      cyl(g, 0, -0.02, 0, 0.05, 0.3, 3, [0.33, 0.28, 0.23], null, 0.035);
      ico(g, 0, 0.56, 0, 0.42, 0.72, [0.22, 0.28, 0.14], R, 0.28);
      if (!far) nrLump(g, 0.16, 0.66, 0.1, 0.24, 0.7, [0.25, 0.31, 0.15], R, 0.3);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // on the land cover (0 the dry grass, 1 the groves, 2 the maquis, 3 the car parks and the town): the groves red pines in blocks of their
  // own (the noise), umbrella pines and oaks among them; the maquis bushes, a pine here and there; lone umbrella pines, pines and oaks on the
  // open hills and by the buildings
  const TZ_WOODS = {
    n: 3, geo: (k) => tzTreeGeo(k % 3, k >= 3), cr: [0.42, 0.26, 0.4], p: [0.006, 0.8, 0.35, 0.02],
    pick(cl, R, far, x, z) {
      const r = R(), r2 = R(), r3 = R(); let sp;
      if (cl === 1) sp = r < 0.15 ? 2 : API.NR.n1(x * 0.5 + 410, z * 0.5 - 230) < 0.45 ? 1 : 0;
      else if (cl === 2) sp = r < 0.85 ? 2 : 1;
      else sp = r < 0.45 ? 0 : r < 0.65 ? 1 : 2;
      const bush = sp === 2 && (cl === 2 || r3 < 0.5);
      let h = sp === 0 ? 9 + r2 * 6 : sp === 1 ? 12 + r2 * 7 : bush ? 1.6 + r2 * 1.8 : 6 + r2 * 4; if (far) h *= 1.06;
      return [sp, h, h * (sp === 0 ? 0.85 + r3 * 0.2 : sp === 1 ? 0.55 + r3 * 0.2 : bush ? 1.25 + r3 * 0.35 : 0.85 + r3 * 0.25)];
    },
  };

  // the service roads round the circuit (def.sk.svc: OSM's highway=service): plain asphalt 5 m wide on the ground, three points across every
  // 4 m (the terrain under it), 8 cm over it and drawn over it; not inside the barriers nor within 4 m past them (the run-offs are the
  // builder's), the trees and the people off them
  function tzRoads({ root, tex, exclPush, CR }, st) {
    const S = (API.T.def.sk || {}).svc || [], rb = new RB(true), col = [0.9, 0.9, 0.92], HW = 2.5;
    for (let k = 0; k < S.length;) {
      const n = S[k], p = []; for (let q = 0; q < n; q++) p.push([S[k + 1 + q * 2], S[k + 2 + q * 2]]); k += 1 + n * 2;
      const pts = []; for (let q = 0; q + 1 < n; q++) { const [ax, az] = p[q], [bx, bz] = p[q + 1], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4)); for (let t = 0; t < m; t++) pts.push([lerp(ax, bx, t / m), lerp(az, bz, t / m)]); }
      pts.push(p[n - 1]);
      let prev = -1, along = 0;
      for (let q = 0; q < pts.length; q++) {
        const [x, z] = pts[q], a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)], dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1;
        if (q) along += Math.hypot(x - pts[q - 1][0], z - pts[q - 1][1]);
        const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 4 + HW) { prev = -1; continue; }
        const nx = -dz / dl, nz = dx / dl, row = [-HW, 0, HW].map(o => { const px = x + nx * o, pz = z + nz * o; return [px, nrGround(px, pz) + 0.08, pz]; });   // (left to right in the way's direction: (nx, nz) its right)
        const r = rb.row(row, [col, col, col], row.map((e, j) => [j * HW / 4, along / 4]));
        if (prev >= 0) rb.link(prev, r, 0, 2); prev = r;
        if (q % 2 === 0) { exclPush(x, z, HW + 1.5); if (nn.i >= 0 && nn.dd < 70) CR.avoid(x, z, HW + 0.5); }
        st.road += 4;
      }
    }
    if (rb.empty) return;
    const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'tuzla service roads'; root.add(m);
  }

  // LK.extra: the service roads, the buildings by the circuit (OSM outlines as boxes: white or cream render, grey cladding on the big halls;
  // flat roofs, grey or terracotta); before the crowds and the trees, which keep clear of them
  function tzExtra(o) {
    const { scen, exclPush, CR } = o, sk = API.T.def.sk || {}, R = rng(9037), st = { road: 0, buildings: 0 };
    tzRoads(o, st);
    const b6 = sk.bld || [], WALL = [[0.93, 0.91, 0.86], [0.9, 0.85, 0.74], [0.84, 0.82, 0.78], [0.72, 0.73, 0.75]], ROOF = [[0.36, 0.37, 0.39], [0.62, 0.32, 0.22], [0.48, 0.49, 0.5]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      const wc = h > 6 ? WALL[3] : WALL[Math.floor(R() * 3)], rc = ROOF[h > 6 ? 0 : Math.floor(R() * 3)];
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, wc, rc, true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    tuzla: { ban: TZ_BAN, at: TZ_AT, nums: 14, numC: ['#c8102e', '#fff', '#fff'], shirts: TZ_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.1, 1.02, 0.84], gravel: false, noVid: true,
      pitBox: [-260, 90, -1], mow: 0.7,   // (the pit building on the left of the main straight, its garages from the pit entry's end to Turn 1's brakes; fainter mowing stripes; no farms on the circuit's hills)
      woods: TZ_WOODS, extra: tzExtra, lane: true, fl: { tr: TR }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      flags: { stand: [{ tr: 0.8, tm: 0.2 }, { tr: 0.7, tm: 0.2, rb: 0.1 }], ga: { tr: 0.75, tm: 0.25 }, camp: { tr: 0.85, tm: 0.15 }, pole: 'tr', podium: 'tr' },
      vid: [], poles: [-240, 120, 1], runoff: ['TUZLA', 'İSTANBUL', 'TÜRKİYE'], straight: [-300, 130, 1],
      farm: { wall: [0.93, 0.9, 0.84], roof: [0.62, 0.32, 0.22], end: [0.9, 0.87, 0.8], barn: [0.55, 0.45, 0.35], barnRoof: [0.62, 0.32, 0.22], barnEnd: [0.52, 0.42, 0.32] },
      tvSkip: [2, 4, 5, 10, 12], recov: [0, 7, 11], photo: [0, 3, 7, 8, 11], jets: [[0.86, 0.06, 0.1], [0.97, 0.97, 0.97], [0.86, 0.06, 0.1]],   // (TV towers at the big corners, not at the kinks and the second parts of the double corners)
      colMod: (P) => (x, z, c, dd) => {   // Istanbul at the end of the summer: the hills' grass burnt golden, in paler and browner patches; the circuit's watered lawns green by the track; the maquis dark olive
        const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.94 + (n - 0.5) * 0.18 + (m - 0.5) * 0.1;
        const fm = nrLCf(x, z, 0), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3), far = sstep(8, 26, dd == null ? 99 : dd), v = 0.92 + 0.12 * m;   // (the lawns by the track watered: green)
        c[0] *= k; c[1] *= k; c[2] *= k * 0.96;
        const dry = (0.9 + 0.1 * sstep(0.35, 0.7, P.n3(x * 0.7 + 90, z * 0.7 - 40))) * (fm + sc) * far;   // (the open hills and the ground between the maquis' bushes)
        if (dry > 0) { const q = sstep(0.3, 0.75, P.n1(x * 0.9 - 210, z * 0.9 + 75));   // (straw, paler and browner in patches: over the olive grass picture)
          c[0] = lerp(c[0], lerp(1.95, 2.3, q) * v, dry); c[1] = lerp(c[1], lerp(1.16, 1.42, q) * v, dry); c[2] = lerp(c[2], lerp(1.45, 2.1, q) * v, dry); }
        if (sc > 0) { const t = sc * 0.5; c[0] = lerp(c[0], 1.3 * v, t); c[1] = lerp(c[1], 1.0 * v, t); c[2] = lerp(c[2], 0.95 * v, t); }   // (the maquis' ground darker, olive brown)
        if (se > 0) { const t = se * 0.85 * far; c[0] = lerp(c[0], 1.8 * v, t); c[1] = lerp(c[1], 1.24 * v, t); c[2] = lerp(c[2], 2.4 * v, t); }   // (the big car parks round the circuit: paved, dusty grey)
      } },
  });
  World.keep('NR', 'tuzla');   // (its grids kept between its builds; World.build frees the others')
  World.ext.tuzla = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
