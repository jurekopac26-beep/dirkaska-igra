/* =========================================================================
   WORLD — Sepang, Malezija (theme 'sepang'): the circuit among the oil palm estates south of Kuala Lumpur, its own parts on the shared
   builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.sepang) goes on API.rbLook;
   World.ext.sepang builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A13), the track: docs/proge/sepang.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.fl, LK.colMod): the trees of the lowlands of Selangor (the oil palms of the
   estates, young and grown, the wide rain trees and the secondary growth on the circuit's grounds: spTreeGeo), the lawns lush green, the
   service roads round the circuit (def.sk.svc: OpenStreetMap) as plain asphalt on the ground, the buildings by the circuit (def.sk.bld:
   OpenStreetMap), the lone trees (def.sk.tr: OpenStreetMap: palms in the courtyard of the big grandstand, broadleaved trees along the
   roads), the Malaysian flag among the fans' flags (rbFlags: cols.canton), navy and gold turn numbers, sand-coloured gravel traps
   (LK.gravel). Only place names on its boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, IChunks, RB, TAU, box, cyl, ico, lerp, nrGround, nrLCf, nrLump, nrNear, nrShade, rng, sstep, vary } = API;
  // the text boards: place names (the district, the state, the country, the towns round the circuit, the federal capital next door), the
  // grandstands' names (def.stands), the start line's (Malay), the DRS boards
  const SP_BAN = [['SEPANG', '#0b1f6b', '#fff', '#f5c400'], ['SELANGOR', '#c8102e', '#fff', '#f5c400'], ['MULA · TAMAT', '#16181c', '#fff', '#c8102e'], ['MALAYSIA', '#0b1f6b', '#f5c400', '#c8102e'],
    ['PUTRAJAYA', '#7a1f2b', '#fff', '#f5c400'], ['BANTING', '#0f5a3a', '#fff', '#fff'], ['NILAI', '#0b1f6b', '#fff', '#c8102e'], ['DENGKIL', '#0f5a3a', '#fff', '#f5c400'],
    ['SALAK TINGGI', '#c8102e', '#fff', '#fff'], ['DRS', '#101114', '#fff', '#39c84a']];
  const SP_AT = { num: 0, brake: 15, ban: 18, rbr: 18, spielberg: 19 };   // atlas cells: the 15 turn numbers, the braking boards, the banners
  const SP_SHIRTS = [[0.86, 0.1, 0.12], [0.96, 0.96, 0.94], [0.05, 0.13, 0.45], [0.99, 0.79, 0.06], [0.13, 0.13, 0.15], [0.84, 0.08, 0.12], [0.2, 0.34, 0.66], [0.93, 0.93, 0.9],
    [0.45, 0.47, 0.5], [0.98, 0.55, 0.1], [0.18, 0.5, 0.32], [0.1, 0.55, 0.7]];   // the fans' shirts in the heat: lots of red and white, navy, yellow, black, a few orange, green and teal
  const MY = Object.assign([[0.8, 0.06, 0.12], [0.96, 0.96, 0.95]], { canton: [[0.03, 0.1, 0.42], [1, 0.8, 0.0]] });   // the Malaysian flag: 14 red and white stripes, the blue canton with the yellow crescent and star (rbFlags: cols.canton)

  // ---- the trees (unit height 1, instanced; LK.woods): 0 an oil palm (a stout trunk, a fountain of long fronds arching out and down, folded
  //      along their ribs, both faces: the crowns are seen from below), 1 a rain tree (a short trunk, a wide umbrella of soft lumps), 2 a tree
  //      of the secondary growth (a round dark crown; squat: a bush); far from the road (k >= 3) plainer ----
  function spTreeGeo(kind, far) {
    const g = new GB(), R = rng(9131 + kind * 7 + (far ? 1 : 0)), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    if (kind === 0) {
      const top = 0.6, n = far ? 6 : 9;
      cyl(g, 0, -0.02, 0, 0.036, top + 0.04, far ? 3 : 5, [0.35, 0.3, 0.21], null, 0.03);
      for (let k = 0; k < n; k++) {
        const a = (k + R() * 0.4) / n * TAU, up = k % 3 === 0, ca = Math.cos(a), sa = Math.sin(a), L = (up ? 0.36 : 0.5) * (0.9 + R() * 0.15), w = 0.075 + R() * 0.015;
        const b = [ca * 0.025, top, sa * 0.025], m = [ca * L * 0.48, top + (up ? 0.24 : 0.13), sa * L * 0.48], t = [ca * L, top + (up ? 0.36 : -0.1 - R() * 0.12), sa * L];
        const pl = [m[0] - sa * w, m[1] - 0.05, m[2] + ca * w], pr = [m[0] + sa * w, m[1] - 0.05, m[2] - ca * w];   // (the leaflets either side, lower: the frond folded along its rib)
        const old = !up && k === n - 1, cU = old ? [0.47, 0.39, 0.18] : vary(up ? [0.25, 0.42, 0.13] : [0.19, 0.34, 0.1], R, 0.08), cD = old ? [0.42, 0.36, 0.18] : [cU[0] * 1.15 + 0.03, cU[1] * 1.1 + 0.02, cU[2] * 1.05];
        const below = [m[0], m[1] - 1, m[2]], above = [m[0], m[1] + 1, m[2]], tris = far ? [[b, pl, t], [b, t, pr]] : [[b, pl, m], [b, m, pr], [pl, t, pr]];
        for (const [p, q, r] of tris) { g.triO(p, q, r, cU, below); g.triO(p, q, r, cD, above); }
      }
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.045, 0.46, far ? 3 : 5, [0.36, 0.31, 0.25], null, 0.035);
      ico(g, 0, 0.68, 0, 0.44, 0.5, [0.22, 0.4, 0.15], R, far ? 0.14 : 0.22);
      if (!far) { nrLump(g, 0.22, 0.72, 0.1, 0.26, 0.55, [0.25, 0.44, 0.17], R, 0.2); nrLump(g, -0.2, 0.74, -0.14, 0.24, 0.55, [0.2, 0.37, 0.14], R, 0.2); }
    } else {
      cyl(g, 0, -0.02, 0, 0.05, 0.32, 3, [0.32, 0.28, 0.22], null, 0.035);
      ico(g, 0, 0.58, 0, 0.43, 0.7, [0.16, 0.3, 0.12], R, 0.28);
      if (!far) nrLump(g, 0.15, 0.68, 0.1, 0.24, 0.7, [0.19, 0.34, 0.13], R, 0.3);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // on the land cover (0 the lawns and the grass, 1 the oil palms, 2 the other trees, 3 the car parks and the town): the estates' palms in
  // blocks of one age (the noise: replanted blocks young and low, the others grown), a few trees of the secondary growth along them; on the
  // circuit's grounds palms, rain trees and the dark secondary growth (bushes in its clearings); lone rain trees and palms on the lawns
  const SP_WOODS = {
    n: 3, geo: (k) => spTreeGeo(k % 3, k >= 3), cr: [0.34, 0.42, 0.4], p: [0.006, 0.5, 0.42, 0.015],
    pick(cl, R, far, x, z) {
      const r = R(), r2 = R(), r3 = R(); let sp;
      if (cl === 1) sp = r < 0.93 ? 0 : r < 0.97 ? 2 : 1;
      else if (cl === 2) sp = r < 0.3 ? 0 : r < 0.6 ? 1 : 2;
      else sp = r < 0.45 ? 1 : r < 0.8 ? 0 : 2;
      if (sp === 0) {
        const young = cl === 1 && API.NR.n1(x * 0.8 + 77, z * 0.8 - 31) < 0.32, h = (young ? 4 + r2 * 2.5 : 8.5 + r2 * 4.5) * (far ? 1.04 : 1);
        return [0, h, h * (young ? 1.3 + r3 * 0.2 : 0.8 + r3 * 0.18)];
      }
      const bush = sp === 2 && cl === 2 && r3 < 0.5;
      let h = sp === 1 ? 11 + r2 * 7 : bush ? 2 + r2 * 2 : 7 + r2 * 5; if (far) h *= 1.06;
      return [sp, h, h * (sp === 1 ? 1.0 + r3 * 0.3 : bush ? 1.3 + r3 * 0.3 : 0.8 + r3 * 0.2)];
    },
  };

  // the service roads round the circuit (def.sk.svc: OSM's highway=service): plain asphalt 5 m wide on the ground, two points across at
  // every bend of the way and every 8 m between (the terrain under it: the flat estate needs no more), 8 cm over it and drawn over it; not
  // inside the barriers nor within 4 m past them (the run-offs are the builder's), the trees and the people off them (as Tuzla's; there
  // every 4 m and three across: here the two straights side by side show most of the ~10 km of them at once, a third of the vertices)
  function spRoads({ root, tex, exclPush, CR }, st) {
    const S = (API.T.def.sk || {}).svc || [], rb = new RB(true), col = [0.88, 0.88, 0.9], HW = 2.5;
    for (let k = 0; k < S.length;) {
      const n = S[k], p = []; for (let q = 0; q < n; q++) p.push([S[k + 1 + q * 2], S[k + 2 + q * 2]]); k += 1 + n * 2;
      const pts = []; for (let q = 0; q + 1 < n; q++) { const [ax, az] = p[q], [bx, bz] = p[q + 1], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 8)); for (let t = 0; t < m; t++) pts.push([lerp(ax, bx, t / m), lerp(az, bz, t / m)]); }
      pts.push(p[n - 1]);
      let prev = -1, along = 0;
      for (let q = 0; q < pts.length; q++) {
        const [x, z] = pts[q], a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)], dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1;
        if (q) along += Math.hypot(x - pts[q - 1][0], z - pts[q - 1][1]);
        const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 4 + HW) { prev = -1; continue; }
        const nx = -dz / dl, nz = dx / dl, row = [-HW, HW].map(o => { const px = x + nx * o, pz = z + nz * o; return [px, nrGround(px, pz) + 0.08, pz]; });   // (left to right in the way's direction: (nx, nz) its right)
        const r = rb.row(row, [col, col], row.map((e, j) => [j * HW / 2, along / 4]));
        if (prev >= 0) rb.link(prev, r, 0, 1); prev = r;
        exclPush(x, z, HW + 1.5); if (nn.i >= 0 && nn.dd < 70) CR.avoid(x, z, HW + 0.5);
        if (q) st.road += Math.hypot(x - pts[q - 1][0], z - pts[q - 1][1]);
      }
    }
    if (rb.empty) return;
    const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'sepang service roads'; root.add(m);
  }

  // the lone trees (def.sk.tr: [x, z, kind]: OSM natural=tree): the palms in the courtyard of the big grandstand, the broadleaved trees along
  // the service roads; not where the builder put a stand, a building or a road (excluded), nor by the track; one instanced draw a kind
  function spLoneTrees({ root, exclPush, excluded }, st) {
    const tr = (API.T.def.sk || {}).tr || [], R = rng(9139), mat = new THREE.MeshLambertMaterial({ vertexColors: true }), ch = [0, 1].map(k => new IChunks(spTreeGeo(k, false), mat, 4096));
    for (let k = 0; k + 2 < tr.length; k += 3) {
      const x = tr[k], z = tr[k + 1], kind = tr[k + 2], nn = nrNear(x, z);
      if ((nn.i >= 0 && nn.dd < 16) || excluded(x, z)) continue;
      const h = kind === 0 ? 9 + R() * 4 : 10 + R() * 6, w = h * (kind === 0 ? 0.75 + R() * 0.15 : 0.95 + R() * 0.3), cv = 0.9 + R() * 0.2;
      ch[kind ? 1 : 0].add(x, nrGround(x, z) - 0.1, z, R() * TAU, w, h, [cv, cv, cv]); nrShade(x, z, w * (kind === 0 ? 0.34 : 0.42), 1); exclPush(x, z, w * 0.4); st.trees++;
    }
    for (const c of ch) c.addTo(root, true);
  }

  // LK.extra: the service roads, the buildings by the circuit (OSM outlines as boxes: white, cream and grey render, grey cladding on the big
  // halls; flat roofs, grey, blue or red metal), the lone trees; before the crowds and the builder's trees, which keep clear of them
  function spExtra(o) {
    const { scen, exclPush, CR } = o, sk = API.T.def.sk || {}, R = rng(9137), st = { road: 0, buildings: 0, trees: 0 };
    spRoads(o, st);
    const b6 = sk.bld || [], WALL = [[0.94, 0.93, 0.9], [0.9, 0.87, 0.78], [0.84, 0.85, 0.86], [0.72, 0.74, 0.77]], ROOF = [[0.42, 0.44, 0.47], [0.24, 0.34, 0.52], [0.6, 0.26, 0.18]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      const wc = h > 6 ? WALL[3] : WALL[Math.floor(R() * 3)], rc = ROOF[h > 6 ? 0 : Math.floor(R() * 3)];
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, wc, rc, true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    spLoneTrees(o, st);
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    sepang: { ban: SP_BAN, at: SP_AT, nums: 15, numC: ['#0b1f6b', '#fff', '#f5c400'], shirts: SP_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.04, 1.0, 0.88], gravel: true, noVid: true,
      pitBox: [-30, 300, 1], mow: 0.8,   // (the pit building on the right of the main straight; sand-coloured gravel traps; no farms among the estates)
      woods: SP_WOODS, extra: spExtra, lane: true, fl: { my: MY }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      flags: { stand: [{ my: 0.8, tm: 0.2 }, { my: 0.7, tm: 0.2, rb: 0.1 }], ga: { my: 0.75, tm: 0.25 }, camp: { my: 0.85, tm: 0.15 }, pole: 'my', podium: 'my' },
      vid: [], poles: [-220, 300, -1], runoff: ['SEPANG', 'SELANGOR', 'MALAYSIA'], straight: [4520, 4680, 1],
      farm: { wall: [0.93, 0.92, 0.88], roof: [0.42, 0.44, 0.47], end: [0.9, 0.88, 0.84], barn: [0.55, 0.45, 0.35], barnRoof: [0.42, 0.44, 0.47], barnEnd: [0.52, 0.42, 0.32] },
      tvSkip: [5, 7, 9, 12], recov: [0, 3, 8, 14], photo: [0, 1, 3, 8, 14], jets: [[0.8, 0.06, 0.12], [0.96, 0.96, 0.95], [0.03, 0.1, 0.42]],   // (TV towers at the big corners, not at the second parts of the double corners)
      colMod: (P) => (x, z, c, dd) => {   // Selangor's lowlands: the lawns a deep, lush green in patches; the floor under the oil palms darker (their shade, the old fronds stacked between the rows); the secondary growth's floor dark; the car parks paved grey
        const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.95 + (n - 0.5) * 0.14 + (m - 0.5) * 0.08;
        const pl = nrLCf(x, z, 1), fo = nrLCf(x, z, 2), se = nrLCf(x, z, 3), far = sstep(8, 26, dd == null ? 99 : dd), v = 0.92 + 0.12 * m;
        c[0] *= k * 0.96; c[1] *= k * 1.02; c[2] *= k * 0.9;
        if (pl > 0) { const t = pl * 0.6; c[0] = lerp(c[0], 0.8 * v, t); c[1] = lerp(c[1], 0.84 * v, t); c[2] = lerp(c[2], 0.6 * v, t); }
        if (fo > 0) { const t = fo * 0.5; c[0] = lerp(c[0], 0.72 * v, t); c[1] = lerp(c[1], 0.78 * v, t); c[2] = lerp(c[2], 0.56 * v, t); }
        if (se > 0) { const t = se * 0.85 * far; c[0] = lerp(c[0], 1.8 * v, t); c[1] = lerp(c[1], 1.24 * v, t); c[2] = lerp(c[2], 2.4 * v, t); }
      } },
  });
  World.keep('NR', 'sepang');   // (its grids kept between its builds; World.build frees the others')
  World.ext.sepang = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
