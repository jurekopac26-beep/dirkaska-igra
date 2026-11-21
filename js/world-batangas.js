/* =========================================================================
   WORLD — Batangas, Filipini (theme 'batangas'): the circuit on the plateau of Batangas province near Rosario, its own parts on the shared
   builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.batangas) goes on API.rbLook;
   World.ext.batangas builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md, the track: docs/proge/batangas.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.fl, LK.colMod): the trees of the plateau (coconut palms, the broadleaf mango
   trees, the bushes: btTreeGeo), its grass lush green in the wet tropics with the sugar cane's yellow-green in the fields and the red-brown
   earth bare in a few patches, the hills and the mountains on the horizon (def.far: Riverside's rsFar), the service roads round the circuit
   (def.sk.svc: OpenStreetMap) as plain asphalt on the ground, the houses and the marshals' huts by the circuit (def.sk.bld: OpenStreetMap),
   the Philippine flag among the fans' flags, red turn numbers. Only place names on its boards (no names of the circuit, its people, races
   or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, RB, TAU, box, cyl, ico, lerp, nrGround, nrLCf, nrNear, puff, rng, sstep } = API;
  // the text boards: place names (the province, the town by the circuit, the country, the province's towns, the lake and the volcano), the
  // grandstands' names (def.stands), the start line's, the DRS boards
  const BT_BAN = [['BATANGAS', '#0038a8', '#fff', '#ce1126'], ['ROSARIO', '#ce1126', '#fff', '#fcd116'], ['START · FINISH', '#16181c', '#fff', '#fcd116'], ['PILIPINAS', '#0038a8', '#fff', '#fcd116'],
    ['LIPA', '#1f6f8b', '#fff', '#fff'], ['IBAAN', '#2b4a2e', '#fff', '#fcd116'], ['PADRE GARCIA', '#0f3d5e', '#fff', '#ce1126'], ['SAN JUAN', '#1f6f8b', '#fff', '#ce1126'],
    ['TAAL', '#2b4a2e', '#fff', '#fff'], ['TAYSAN', '#0f3d5e', '#fff', '#fff'], ['MALVAR', '#ce1126', '#fff', '#fff'], ['LUZON', '#2b4a2e', '#fff', '#ce1126'],
    ['DRS', '#101114', '#fff', '#39c84a']];
  const BT_AT = { num: 0, brake: 13, ban: 16, rbr: 16, spielberg: 17 };   // atlas cells: the 13 turn numbers, the braking boards, the banners
  const BT_SHIRTS = [[0.84, 0.08, 0.12], [0.95, 0.95, 0.93], [0.8, 0.07, 0.12], [0.13, 0.13, 0.15], [0.16, 0.2, 0.36], [0.42, 0.44, 0.48], [0.97, 0.8, 0.14], [0.12, 0.42, 0.62],
    [0.92, 0.92, 0.9], [0.55, 0.42, 0.3], [0.18, 0.5, 0.3], [0.86, 0.1, 0.16]];   // the fans' shirts in the tropics: lots of red and white, black, navy and grey, a few yellow, blue and green
  const PH = [[0.0, 0.22, 0.66], [0.81, 0.07, 0.15]];   // the Philippine flag: blue over red (the white triangle left out)

  // ---- the trees (unit height 1, instanced; LK.woods): 0 a coconut palm (a slender ringed trunk leaning a little, a crown of drooping
  //      fronds, both faces), 1 a broadleaf tree of the wet tropics (a mango) (a short trunk, a wide crown of soft clumps in two tiers), 2 a bush
  //      (low green clumps); far from the road (k >= 3) plainer ----
  function btTreeGeo(kind, far) {
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
      const LF = [[0.16, 0.34, 0.11], [0.2, 0.4, 0.13], [0.24, 0.45, 0.15], [0.18, 0.37, 0.12]];
      const cl = far ? [[0, 0.64, 0, 0.38, 0.6], [0.1, 0.8, 0.05, 0.26, 0.6]]
        : [[0.24, 0.62, 0.1, 0.27, 0.7], [-0.22, 0.63, 0.12, 0.26, 0.7], [0, 0.62, -0.25, 0.26, 0.7], [0.02, 0.67, 0.26, 0.23, 0.7], [0.04, 0.8, 0.02, 0.27, 0.72]];   // (four round the lower tier, one on top)
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, LF[q % 4], R, 0.22, 0.5, 1.12, !far));
    } else {
      const cl = far ? [[0, 0.45, 0, 0.5, 0.8]] : [[0.12, 0.42, 0.05, 0.42, 0.8], [-0.16, 0.38, -0.06, 0.38, 0.8], [0.02, 0.5, -0.18, 0.34, 0.8]];
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, q % 2 ? [0.24, 0.4, 0.15] : [0.28, 0.45, 0.17], R, 0.28, 0.55, 1.08, false));
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // on the land cover (0 the grass and the fields, 1 the trees, 2 the scrub, 3 the villages and the car parks): the groves palms and broadleaf
  // trees with bushes under them; the scrub bushes, a tree here and there; lone palms, trees and bushes in the open; palms by the houses
  const BT_WOODS = {
    n: 3, geo: (k) => btTreeGeo(k % 3, k >= 3), cr: [0.3, 0.44, 0.42], p: [0.012, 0.6, 0.32, 0.03],
    pick(cl, R, far) {
      const r = R(), r2 = R(), r3 = R();
      const sp = cl === 1 ? (r < 0.4 ? 1 : r < 0.85 ? 0 : 2) : cl === 2 ? (r < 0.85 ? 2 : r < 0.95 ? 1 : 0) : cl === 3 ? (r < 0.7 ? 0 : 1) : r < 0.4 ? 0 : r < 0.6 ? 1 : 2;
      let h = sp === 0 ? 10 + r2 * 7 : sp === 1 ? 7 + r2 * 6 : 1.4 + r2 * 1.8; if (far) h *= 1.06;
      return [sp, h, h * (sp === 0 ? 0.42 + r3 * 0.12 : sp === 1 ? 1.05 + r3 * 0.3 : 1.3 + r3 * 0.4)];
    },
  };

  // the service roads round the circuit (def.sk.svc, sk.trk: OSM's highway=service and =track): plain asphalt 5 m wide (and compacted
  // earth 3.5 m wide) on the ground, three points across every 4 m (the terrain under it), 8 cm over it and drawn over
  // it; not inside the barriers nor within 4 m past them (the run-offs are the builder's), the trees and the people off them
  function btWays({ root, exclPush, CR }, S, HW, col, map, name, st) {
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

  // the horizon (def.far, Riverside's rsFar): the plateau's fields and groves, the wooded hills and the mountains of Batangas, in the humid
  // haze (the sea and the lake far below the plateau's rim: green-blue)
  const btFarCol = (h, d) => {
    const c = h < 2 ? [0.34, 0.5, 0.56] : h < 200 ? [0.3, 0.42, 0.22] : h < 600 ? [0.24, 0.36, 0.19] : [0.26, 0.34, 0.22], f = (1 - Math.exp(-d / 20000)) * 0.85;
    return c.map((v, k) => lerp(v, [0.8, 0.86, 0.88][k], f));
  };

  // LK.extra: the service roads, the houses and the huts by the circuit (OSM outlines as boxes: white or pale render, a grey or rusty red
  // roof), the horizon; before the crowds and the trees, which keep clear of them
  function btExtra(o) {
    const { scen, exclPush, CR, root, out, tex } = o, sk = API.T.def.sk || {}, R = rng(7341), st = { road: 0, buildings: 0, far: 0 };
    btWays(o, sk.svc || [], 2.5, [0.9, 0.9, 0.92], tex.asphalt, 'batangas service roads', st);
    btWays(o, sk.trk || [], 1.75, [0.98, 0.8, 0.66], tex.sand, 'batangas dirt tracks', st);
    const b6 = sk.bld || [], WALL = [[0.94, 0.93, 0.9], [0.9, 0.88, 0.82]], ROOF = [[0.5, 0.52, 0.54], [0.56, 0.3, 0.22]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, WALL[Math.floor(R() * 2)], ROOF[Math.floor(R() * 2)], true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    if (API.T.def.far && API.rsFar) { out.dyn.far = API.rsFar(root, API.T.def.far, 'summer', 6, btFarCol); st.far = 1; }   // (World.update: no car, back where it was built)
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    batangas: { ban: BT_BAN, at: BT_AT, nums: 13, numC: ['#ce1126', '#fff', '#fff'], shirts: BT_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.04, 1.06, 0.9], gravel: false, noVid: true,
      pitBox: [-175, 30, 1], mow: 0.7,   // (the pit buildings on the right of the main straight, their garages; fainter mowing stripes; no farms by the circuit)
      woods: BT_WOODS, extra: btExtra, lane: true, fl: { ph: PH }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      flags: { stand: [{ ph: 0.8, rb: 0.2 }, { ph: 0.7, tm: 0.15, rb: 0.15 }], ga: { ph: 0.8, tm: 0.2 }, camp: { ph: 0.85, tm: 0.15 }, pole: 'ph', podium: 'ph' },
      vid: [], poles: [-170, 30, -1], runoff: ['BATANGAS', 'ROSARIO', 'PILIPINAS'], straight: [-200, 300, -1],
      farm: { wall: [0.94, 0.92, 0.86], roof: [0.6, 0.3, 0.2], end: [0.9, 0.88, 0.82], barn: [0.55, 0.45, 0.35], barnRoof: [0.6, 0.3, 0.2], barnEnd: [0.52, 0.42, 0.32] },
      tvSkip: [3, 5, 9, 12], recov: [0, 7, 12], photo: [0, 2, 7, 10, 12], jets: [PH[0], [0.97, 0.97, 0.97], PH[1]],   // (TV towers at the big corners, not at the second parts of the double corners)
      colMod: (P) => {   // the plateau of Batangas in the wet tropics: the grass lush green, darker and lighter in patches, the sugar cane's yellow-green in the open fields away from the track, the red-brown earth bare in a few patches; the circuit's lawns by the track evenly green
        return (x, z, c, dd) => {
          const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.95 + (n - 0.5) * 0.16 + (m - 0.5) * 0.1;
          const fm = nrLCf(x, z, 0), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3), far = sstep(10, 30, dd == null ? 99 : dd), v = 0.92 + 0.12 * m;
          c[0] *= k * 0.94; c[1] *= k * 1.04; c[2] *= k * 0.92;
          const cane = sstep(0.45, 0.7, P.n3(x * 0.35 + 90, z * 0.35 - 40)) * fm * far;   // (the sugar cane's fields: yellow-green)
          if (cane > 0) { const q = sstep(0.3, 0.75, P.n1(x * 0.9 - 210, z * 0.9 + 75));
            c[0] = lerp(c[0], lerp(1.2, 1.4, q) * v, cane * 0.8); c[1] = lerp(c[1], lerp(1.35, 1.45, q) * v, cane * 0.8); c[2] = lerp(c[2], lerp(0.7, 0.85, q) * v, cane * 0.8); }
          const red = sstep(0.72, 0.86, P.n1(x * 1.3 + 40, z * 1.3 - 510)) * fm * far * 0.6;   // (the red-brown earth bare in a few patches)
          if (red > 0) { c[0] = lerp(c[0], 1.7 * v, red); c[1] = lerp(c[1], 1.0 * v, red); c[2] = lerp(c[2], 0.85 * v, red); }
          if (sc > 0) { const t = sc * 0.4; c[0] = lerp(c[0], 0.9 * v, t); c[1] = lerp(c[1], 1.1 * v, t); c[2] = lerp(c[2], 0.75 * v, t); }
          if (se > 0) { const t = se * 0.85 * far; c[0] = lerp(c[0], 1.7 * v, t); c[1] = lerp(c[1], 1.22 * v, t); c[2] = lerp(c[2], 2.2 * v, t); }
        };
      } },
  });
  World.keep('NR', 'batangas');   // (its grids kept between its builds; World.build frees the others')
  World.ext.batangas = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
