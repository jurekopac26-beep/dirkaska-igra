/* =========================================================================
   WORLD — Lombok, Indonezija (theme 'lombok'): the circuit by the beaches of the south coast of Lombok near Kuta, its own parts on the
   shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.lombok) goes on API.rbLook;
   World.ext.lombok builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A14), the track: docs/proge/lombok.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.fl, LK.colMod): the trees of the coastal plain (coconut palms, the broadleaf
   trees, the bushes of the dry scrub: lbTreeGeo), the plain's grass straw-green at the end of the dry season with the red earth bare in
   patches and the circuit's watered lawns green by the track, the sand of the beaches, the sea to the south with the surf along the shore
   (def.sk.sea: its level, the terrain's sea lowered under it), the hills on the horizon (def.far: Riverside's rsFar), the service roads and
   the dirt tracks round the circuit (def.sk.svc, sk.trk: OpenStreetMap) as plain asphalt and earth on the ground, the long building past
   the end of the pit lane (def.sk.bld: OpenStreetMap), the Indonesian flag among the fans' flags, red turn numbers. Only place names on its
   boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, NRC, RB, TAU, addShore, box, cyl, ico, lerp, nrDem, nrDist, nrGH, nrGround, nrLCf, nrNear, puff, rng, shoreBand, sstep, waterMat, waterline } = API;
  // the text boards: place names (the island, the village by the circuit, the country, the province's towns and villages, the bays, the hill
  // and the cape by the circuit, the volcano), the grandstands' names (def.stands), the start line's, the DRS boards
  const LB_BAN = [['LOMBOK', '#ce1126', '#fff', '#fff'], ['KUTA', '#0f3d5e', '#fff', '#ce1126'], ['START · FINIS', '#16181c', '#fff', '#ce1126'], ['INDONESIA', '#ce1126', '#fff', '#fff'],
    ['PRAYA', '#0f3d5e', '#fff', '#fff'], ['PUJUT', '#1f6f8b', '#fff', '#fff'], ['SEGER', '#1f6f8b', '#fff', '#ce1126'], ['SENGKOL', '#2b4a2e', '#fff', '#fff'],
    ['GERUPUK', '#0f3d5e', '#fff', '#ce1126'], ['MERESE', '#2b4a2e', '#fff', '#ce1126'], ['TANJUNG', '#1f6f8b', '#fff', '#fff'], ['RINJANI', '#2b4a2e', '#fff', '#fff'],
    ['DRS', '#101114', '#fff', '#39c84a']];
  const LB_AT = { num: 0, brake: 17, ban: 20, rbr: 20, spielberg: 21 };   // atlas cells: the 17 turn numbers, the braking boards, the banners
  const LB_SHIRTS = [[0.84, 0.08, 0.12], [0.95, 0.95, 0.93], [0.8, 0.07, 0.12], [0.13, 0.13, 0.15], [0.16, 0.2, 0.36], [0.42, 0.44, 0.48], [0.97, 0.8, 0.14], [0.12, 0.42, 0.62],
    [0.92, 0.92, 0.9], [0.55, 0.42, 0.3], [0.18, 0.5, 0.3], [0.86, 0.1, 0.16]];   // the fans' shirts in the tropics: lots of red and white, black, navy and grey, a few yellow, blue and green
  const ID = [[0.81, 0.07, 0.12], [0.96, 0.96, 0.95]];   // the Indonesian flag: red over white

  // ---- the trees (unit height 1, instanced; LK.woods): 0 a coconut palm (a slender ringed trunk leaning a little, a crown of drooping
  //      fronds, both faces), 1 a broadleaf tree of the dry tropics (a short trunk, a wide crown of soft clumps in two tiers), 2 a bush of the
  //      scrub (low grey-green clumps); far from the road (k >= 3) plainer ----
  function lbTreeGeo(kind, far) {
    const g = new GB(), R = rng(7331 + kind * 7 + (far ? 1 : 0)), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.52, 0.45, 0.36], barkD = [0.41, 0.35, 0.28];
    if (kind === 0) {
      const lean = 0.06, seg = far ? 2 : 4;
      for (let s = 0; s < seg; s++) { const y0 = 0.9 * s / seg, y1 = 0.9 * (s + 1) / seg; cyl(g, lean * y0 * y0, y0, 0, 0.028 - 0.008 * s / seg, y1 - y0 + 0.01, far ? 3 : 5, s % 2 ? bark : barkD, null, 0.028 - 0.008 * (s + 1) / seg); }
      const cx = lean * 0.81, n = far ? 6 : 9, fr = [0.36, 0.5, 0.19], frD = [0.23, 0.34, 0.13];
      for (let f = 0; f < n; f++) {
        const a = f / n * TAU + (R() - 0.5) * 0.4, c = Math.cos(a), sn = Math.sin(a), up = f % 2 ? 0.05 : 0, L = 0.4 + R() * 0.1, dr = 0.17 + R() * 0.1 - up;
        const B = [cx + c * 0.02, 0.91, sn * 0.02], M = [cx + c * L * 0.5, 0.97 + up, sn * L * 0.5], Tp = [cx + c * L, 0.91 - dr, sn * L], w = 0.06 + R() * 0.02;
        const Ml = [M[0] - sn * w, M[1] - 0.02, M[2] + c * w], Mr = [M[0] + sn * w, M[1] - 0.02, M[2] - c * w];
        for (const [p, q, r] of [[B, Mr, M], [B, M, Ml], [M, Mr, Tp], [M, Tp, Ml]]) { g.tri(p, q, r, fr); g.tri(p, r, q, frD); }
      }
      if (!far) for (let q = 0; q < 3; q++) { const a = q / 3 * TAU + 0.5; ico(g, cx + Math.cos(a) * 0.03, 0.88, Math.sin(a) * 0.03, 0.022, 1, [0.4, 0.33, 0.14], R, 0.2); }   // (the coconuts)
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.05, 0.46, far ? 4 : 5, barkD, null, 0.04);
      const LF = [[0.22, 0.36, 0.14], [0.27, 0.42, 0.16], [0.31, 0.46, 0.18], [0.24, 0.39, 0.15]];
      const cl = far ? [[0, 0.64, 0, 0.38, 0.6], [0.1, 0.8, 0.05, 0.26, 0.6]]
        : [[0.24, 0.62, 0.1, 0.27, 0.7], [-0.22, 0.63, 0.12, 0.26, 0.7], [0, 0.62, -0.25, 0.26, 0.7], [0.02, 0.67, 0.26, 0.23, 0.7], [0.04, 0.8, 0.02, 0.27, 0.72]];   // (four round the lower tier, one on top)
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, LF[q % 4], R, 0.22, 0.5, 1.12, !far));
    } else {
      const cl = far ? [[0, 0.45, 0, 0.5, 0.8]] : [[0.12, 0.42, 0.05, 0.42, 0.8], [-0.16, 0.38, -0.06, 0.38, 0.8], [0.02, 0.5, -0.18, 0.34, 0.8]];
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, q % 2 ? [0.3, 0.37, 0.18] : [0.34, 0.41, 0.2], R, 0.28, 0.55, 1.08, false));
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // on the land cover (0 the grass and the bare earth, 1 the trees, 2 the scrub, 3 the villages and the car parks): the groves broadleaf trees
  // and palms with bushes under them; the scrub bushes, a tree here and there; lone palms, trees and bushes on the open plain; palms by the houses
  const LB_WOODS = {
    n: 3, geo: (k) => lbTreeGeo(k % 3, k >= 3), cr: [0.3, 0.44, 0.42], p: [0.012, 0.6, 0.32, 0.03],
    pick(cl, R, far) {
      const r = R(), r2 = R(), r3 = R();
      const sp = cl === 1 ? (r < 0.45 ? 1 : r < 0.8 ? 0 : 2) : cl === 2 ? (r < 0.85 ? 2 : r < 0.95 ? 1 : 0) : cl === 3 ? (r < 0.7 ? 0 : 1) : r < 0.4 ? 0 : r < 0.6 ? 1 : 2;
      let h = sp === 0 ? 10 + r2 * 7 : sp === 1 ? 7 + r2 * 6 : 1.4 + r2 * 1.8; if (far) h *= 1.06;
      return [sp, h, h * (sp === 0 ? 0.42 + r3 * 0.12 : sp === 1 ? 1.05 + r3 * 0.3 : 1.3 + r3 * 0.4)];
    },
  };

  // the service roads and the dirt tracks round the circuit (def.sk.svc, sk.trk: OSM's highway=service and =track): plain asphalt 5 m wide
  // and compacted red-brown earth 3.5 m wide on the ground, three points across every 4 m (the terrain under it), 8 cm over it and drawn over
  // it; not inside the barriers nor within 4 m past them (the run-offs are the builder's), the trees and the people off them
  function lbWays({ root, exclPush, CR }, S, HW, col, map, name, st) {
    const rb = new RB(true);
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
    const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = name; root.add(m);
  }

  // the sea (def.sk.sea: y its level, z0 the plane's north edge): one plane south of the coast out past the far clip (north of z0 the land; the
  // terrain hides it where it stands above the water), the surf along the shore (the band at the waterline of the terrain grid: the shallows'
  // colour, the foam); the trees and the people off the water and the beach
  function lbSea({ root, tex, exclPush, out }, st) {
    const S = (API.T.def.sk || {}).sea, G = API.NR && API.NR.G; if (!S || !G) return;
    const Y = S.y, WO = { len: 2.4, amp: 1.1, refl: 0.42, shal: 0.85, lap: 1, surf: 0.85 };
    const g = new THREE.PlaneGeometry(9000, 4600, 1, 1).rotateX(-Math.PI / 2);
    const sea = new THREE.Mesh(g, waterMat(tex, Object.assign({ color: 0x5aaabb }, WO))); sea.position.set(S.x, Y, S.z0 + 2300); sea.receiveShadow = true; sea.matrixAutoUpdate = false; sea.updateMatrix(); sea.name = 'lombok sea'; root.add(sea);
    out.dyn.water = tex.water;
    addShore(root, shoreBand(G.x0, G.z0, G.x0 + (G.nx - 1) * NRC, G.z0 + (G.nz - 1) * NRC, Y + 0.015, waterline(nrGH, G.x0, G.z0, NRC, 0, G.nx - 1, 0, G.nz - 1, Y), 22, { F: 4 }), sea.material, WO);
    for (let j = 0; j < G.nz; j += 3) for (let i = 0; i < G.nx; i += 3) {
      const x = G.x0 + i * NRC, z = G.z0 + j * NRC; if (nrGH(i, j) < Y + 0.8 && nrDist(x, z) < 320) { exclPush(x, z, NRC * 2.3); st.sea++; }
    }
  }

  // the horizon (def.far, Riverside's rsFar): the sea's blue, the plain's dry grass, the wooded hills of the south of the island, in the haze
  // off the sea
  const lbFarCol = (h, d) => {
    const c = h < 1.5 ? [0.34, 0.52, 0.6] : h < 40 ? [0.4, 0.44, 0.26] : h < 160 ? [0.29, 0.38, 0.2] : [0.31, 0.36, 0.22], f = (1 - Math.exp(-d / 22000)) * 0.85;
    return c.map((v, k) => lerp(v, [0.78, 0.84, 0.88][k], f));
  };

  // LK.extra: the service roads and the dirt tracks, the building past the pit lane (an OSM outline as a box: white render, a grey roof), the
  // sea, the horizon; before the crowds and the trees, which keep clear of them
  function lbExtra(o) {
    const { scen, exclPush, CR, root, out, tex } = o, sk = API.T.def.sk || {}, R = rng(7337), st = { road: 0, buildings: 0, sea: 0, far: 0 };
    lbWays(o, sk.svc || [], 2.5, [0.9, 0.9, 0.92], tex.asphalt, 'lombok service roads', st);
    lbWays(o, sk.trk || [], 1.75, [0.98, 0.8, 0.66], tex.sand, 'lombok dirt tracks', st);
    const b6 = sk.bld || [], WALL = [[0.94, 0.93, 0.9], [0.9, 0.88, 0.82]], ROOF = [[0.5, 0.52, 0.54], [0.38, 0.4, 0.42]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, WALL[Math.floor(R() * 2)], ROOF[Math.floor(R() * 2)], true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    lbSea(o, st);
    if (API.T.def.far && API.rsFar) { out.dyn.far = API.rsFar(root, API.T.def.far, 'summer', 6, lbFarCol); st.far = 1; }   // (World.update: no car, back where it was built)
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    lombok: { ban: LB_BAN, at: LB_AT, nums: 17, numC: ['#ce1126', '#fff', '#fff'], shirts: LB_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.12, 1.02, 0.86], gravel: false, noVid: true,
      pitBox: [-230, 190, -1], mow: 0.7,   // (the pit building on the left of the main straight, its garages from the pit entry's end to Turn 1's brakes; fainter mowing stripes; no farms by the circuit)
      woods: LB_WOODS, extra: lbExtra, lane: true, fl: { id: ID }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      flags: { stand: [{ id: 0.8, rb: 0.2 }, { id: 0.7, tm: 0.15, rb: 0.15 }], ga: { id: 0.8, tm: 0.2 }, camp: { id: 0.85, tm: 0.15 }, pole: 'id', podium: 'id' },
      vid: [], poles: [-240, 130, 1], runoff: ['LOMBOK', 'KUTA', 'INDONESIA'], straight: [-300, 140, 1],
      farm: { wall: [0.94, 0.92, 0.86], roof: [0.6, 0.3, 0.2], end: [0.9, 0.88, 0.82], barn: [0.55, 0.45, 0.35], barnRoof: [0.6, 0.3, 0.2], barnEnd: [0.52, 0.42, 0.32] },
      tvSkip: [3, 5, 8, 11, 13], recov: [0, 9, 15], photo: [0, 2, 9, 15, 16], jets: [ID[0], [0.97, 0.97, 0.97], ID[0]],   // (TV towers at the big corners, not at the kinks and the second parts of the double corners)
      colMod: (P) => {   // the south coast of Lombok at the end of the dry season: the plain's grass straw-green, paler and browner in patches, the red earth bare in places; the circuit's watered lawns green by the track; the scrub's ground dark olive; the car parks dusty grey; the beaches' pale sand
        const SY = ((API.T.def.sk || {}).sea || {}).y;
        return (x, z, c, dd) => {
          const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.95 + (n - 0.5) * 0.16 + (m - 0.5) * 0.1;
          const fm = nrLCf(x, z, 0), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3), far = sstep(8, 26, dd == null ? 99 : dd), v = 0.92 + 0.12 * m;   // (the lawns by the track watered: green)
          c[0] *= k; c[1] *= k; c[2] *= k * 0.96;
          const dry = (0.7 + 0.3 * sstep(0.35, 0.7, P.n3(x * 0.7 + 90, z * 0.7 - 40))) * (fm + sc) * far;
          if (dry > 0) { const q = sstep(0.3, 0.75, P.n1(x * 0.9 - 210, z * 0.9 + 75));   // (straw-green, paler and browner in patches)
            c[0] = lerp(c[0], lerp(1.45, 1.8, q) * v, dry); c[1] = lerp(c[1], lerp(1.18, 1.3, q) * v, dry); c[2] = lerp(c[2], lerp(1.05, 1.45, q) * v, dry); }
          const red = sstep(0.64, 0.82, P.n1(x * 1.3 + 40, z * 1.3 - 510)) * fm * far * 0.75;   // (the red earth bare in patches)
          if (red > 0) { c[0] = lerp(c[0], 1.95 * v, red); c[1] = lerp(c[1], 1.02 * v, red); c[2] = lerp(c[2], 0.95 * v, red); }
          if (sc > 0) { const t = sc * 0.5; c[0] = lerp(c[0], 1.2 * v, t); c[1] = lerp(c[1], 1.0 * v, t); c[2] = lerp(c[2], 0.9 * v, t); }
          if (se > 0) { const t = se * 0.85 * far; c[0] = lerp(c[0], 1.8 * v, t); c[1] = lerp(c[1], 1.24 * v, t); c[2] = lerp(c[2], 2.4 * v, t); }
          if (SY != null) { const sand = sstep(1.8, 0.6, nrDem(x, z) - SY) * far;   // (the beaches: pale sand down to the water)
            if (sand > 0) { c[0] = lerp(c[0], 2.3 * v, sand); c[1] = lerp(c[1], 1.75 * v, sand); c[2] = lerp(c[2], 2.3 * v, sand); } }
        };
      } },
  });
  World.keep('NR', 'lombok');   // (its grids kept between its builds; World.build frees the others')
  World.ext.lombok = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
