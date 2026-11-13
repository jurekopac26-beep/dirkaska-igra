/* =========================================================================
   WORLD — Quezaltepeque, Salvador (theme 'quezaltepeque'): the circuit on the lava plain at the foot of the San Salvador volcano, its own
   parts on the shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.quezaltepeque)
   goes on API.rbLook; World.ext.quezaltepeque builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md, the track:
   docs/proge/quezaltepeque.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.fl, LK.colMod): the trees of the valley (the broadleaf trees, the palms, the
   bushes: qzTreeGeo), its grass green in the wet tropics with the dry season's yellow in patches, the old lava flow (def.sk.lava: OSM's
   bare rock) black-brown and rough on the ground with only scrub on it, the volcano and the ranges on the horizon (def.far: Riverside's
   rsFar), the service roads round the circuit (def.sk.svc: OpenStreetMap) as plain asphalt on the ground, the houses and the marshals'
   huts by the circuit (def.sk.bld: OpenStreetMap), the flag of El Salvador among the fans' flags, blue turn numbers. Only place names on
   its boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, RB, TAU, box, cyl, ico, lerp, nrGround, nrLCf, nrNear, puff, rng, sstep } = API;
  // the text boards: place names (the town by the circuit, the country, the department, the towns round the valley and the volcano), the
  // grandstands' names (def.stands), the start line's, the DRS boards
  const QZ_BAN = [['QUEZALTEPEQUE', '#0047ab', '#fff', '#fff'], ['OPICO', '#2b4a2e', '#fff', '#fff'], ['START · FINISH', '#16181c', '#fff', '#0047ab'], ['EL SALVADOR', '#0047ab', '#fff', '#fff'],
    ['LA LIBERTAD', '#1f6f8b', '#fff', '#fff'], ['SAN SALVADOR', '#0f3d5e', '#fff', '#fff'], ['APOPA', '#2b4a2e', '#fff', '#0047ab'], ['NEJAPA', '#1f6f8b', '#fff', '#fff'],
    ['SAN JUAN OPICO', '#0f3d5e', '#fff', '#0047ab'], ['LOURDES', '#2b4a2e', '#fff', '#fff'], ['EL PLAYÓN', '#3a2f2a', '#fff', '#fff'], ['CENTROAMÉRICA', '#0047ab', '#fff', '#fff'],
    ['DRS', '#101114', '#fff', '#39c84a']];
  const QZ_AT = { num: 0, brake: 11, ban: 14, rbr: 14, spielberg: 15 };   // atlas cells: the 11 turn numbers, the braking boards, the banners
  const QZ_SHIRTS = [[0.0, 0.28, 0.67], [0.95, 0.95, 0.93], [0.1, 0.36, 0.72], [0.13, 0.13, 0.15], [0.16, 0.2, 0.36], [0.42, 0.44, 0.48], [0.97, 0.8, 0.14], [0.8, 0.1, 0.14],
    [0.92, 0.92, 0.9], [0.55, 0.42, 0.3], [0.18, 0.5, 0.3], [0.0, 0.3, 0.7]];   // the fans' shirts in the tropics: lots of blue and white, black, navy and grey, a few yellow, red and green
  const SV = [[0.0, 0.28, 0.67], [0.97, 0.97, 0.97], [0.0, 0.28, 0.67]];   // the flag of El Salvador: blue, white, blue (the coat of arms left out)

  // the old lava flow (def.sk.lava: World's land-cover grid, run-length coded as def.lc: 1 the lava), decoded once per build; its share
  // round (x, z), bilinear over the cell centres (the soft edge of the black rock)
  let qzLv = null, qzLvK = null;
  function qzLava(x, z) {
    const NR = API.NR, L = NR && NR.L, S = (API.T.def.sk || {}).lava; if (!L || !S) return 0;
    if (qzLvK !== L) { qzLvK = L; qzLv = new Uint8Array(L.nx * L.nz); const A = API.NR_A64;
      for (let p = 0, k = 0; k < qzLv.length && p < S.length;) { const v = A.indexOf(S[p++]); let n = (v & 15) + 1; if ((v & 15) === 15) { let e; do { e = A.indexOf(S[p++]); n += e; } while (e === 63); } qzLv.fill(v >> 4, k, Math.min(qzLv.length, k + n)); k += n; } }
    const fx = (x - L.x0) / L.cell - 0.5, fz = (z - L.z0) / L.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const at = (a, b) => (a < 0 || b < 0 || a >= L.nx || b >= L.nz ? 0 : qzLv[b * L.nx + a]);
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v;
  }

  // ---- the trees (unit height 1, instanced; LK.woods): 0 a palm (a slender ringed trunk leaning a little, a crown of drooping fronds,
  //      both faces), 1 a broadleaf tree of the valley (a short trunk, a wide crown of soft clumps in two tiers), 2 a bush (low green clumps);
  //      far from the road (k >= 3) plainer ----
  function qzTreeGeo(kind, far) {
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
  // on the land cover (0 the grass and the fields, 1 the trees, 2 the scrub, 3 the houses and the car parks): the groves broadleaf trees with
  // palms and bushes; the scrub bushes, a tree here and there; on the old lava only low bushes, few; lone trees, palms and bushes in the open
  const QZ_WOODS = {
    n: 3, geo: (k) => qzTreeGeo(k % 3, k >= 3), cr: [0.3, 0.44, 0.42], p: [0.012, 0.6, 0.32, 0.03],
    pick(cl, R, far, x, z) {
      const r = R(), r2 = R(), r3 = R();
      if (x != null && qzLava(x, z) > 0.5) return [2, 0.7 + r2 * 1.1, 1.3 + r3 * 0.6];   // (on the lava: low bushes only)
      const sp = cl === 1 ? (r < 0.65 ? 1 : r < 0.85 ? 0 : 2) : cl === 2 ? (r < 0.85 ? 2 : r < 0.95 ? 1 : 0) : cl === 3 ? (r < 0.5 ? 0 : 1) : r < 0.25 ? 0 : r < 0.6 ? 1 : 2;
      let h = sp === 0 ? 10 + r2 * 7 : sp === 1 ? 7 + r2 * 6 : 1.4 + r2 * 1.8; if (far) h *= 1.06;
      return [sp, h, h * (sp === 0 ? 0.42 + r3 * 0.12 : sp === 1 ? 1.05 + r3 * 0.3 : 1.3 + r3 * 0.4)];
    },
  };

  // the service roads round the circuit (def.sk.svc, sk.trk: OSM's highway=service and =track): plain asphalt 5 m wide (and compacted
  // earth 3.5 m wide) on the ground, three points across every 4 m (the terrain under it), 8 cm over it and drawn over
  // it; not inside the barriers nor within 4 m past them (the run-offs are the builder's), the trees and the people off them
  function qzWays({ root, exclPush, CR }, S, HW, col, map, name, st) {
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

  // the horizon (def.far, Riverside's rsFar): the valley's fields and groves, the wooded slopes of the San Salvador volcano and the ranges
  // round the valley, in the humid haze (the lake to the north: green-blue)
  const qzFarCol = (h, d) => {
    const c = h < 2 ? [0.34, 0.5, 0.56] : h < 200 ? [0.3, 0.42, 0.22] : h < 600 ? [0.24, 0.36, 0.19] : [0.26, 0.34, 0.22], f = (1 - Math.exp(-d / 20000)) * 0.85;
    return c.map((v, k) => lerp(v, [0.8, 0.86, 0.88][k], f));
  };

  // LK.extra: the service roads, the houses and the huts by the circuit (OSM outlines as boxes: white or pale render, a grey or rusty red
  // roof of sheet metal), the horizon; before the crowds and the trees, which keep clear of them
  function qzExtra(o) {
    const { scen, exclPush, CR, root, out, tex } = o, sk = API.T.def.sk || {}, R = rng(7341), st = { road: 0, buildings: 0, far: 0 };
    qzWays(o, sk.svc || [], 2.5, [0.9, 0.9, 0.92], tex.asphalt, 'quezaltepeque service roads', st);
    qzWays(o, sk.trk || [], 1.75, [0.98, 0.8, 0.66], tex.sand, 'quezaltepeque dirt tracks', st);
    const b6 = sk.bld || [], WALL = [[0.94, 0.93, 0.9], [0.9, 0.88, 0.82]], ROOF = [[0.5, 0.52, 0.54], [0.56, 0.3, 0.22]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, WALL[Math.floor(R() * 2)], ROOF[Math.floor(R() * 2)], true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    if (API.T.def.far && API.rsFar) { out.dyn.far = API.rsFar(root, API.T.def.far, 'summer', 6, qzFarCol); st.far = 1; }   // (World.update: no car, back where it was built)
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    quezaltepeque: { ban: QZ_BAN, at: QZ_AT, nums: 11, numC: ['#0047ab', '#fff', '#fff'], shirts: QZ_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.04, 1.06, 0.9], gravel: false, noVid: true,
      pitBox: [-72, 72, 1], mow: 0.7,   // (the pit building on the right of the main straight, its garages; fainter mowing stripes; no farms by the circuit)
      woods: QZ_WOODS, extra: qzExtra, lane: true, fl: { sv: SV }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      flags: { stand: [{ sv: 0.8, rb: 0.2 }, { sv: 0.7, tm: 0.15, rb: 0.15 }], ga: { sv: 0.8, tm: 0.2 }, camp: { sv: 0.85, tm: 0.15 }, pole: 'sv', podium: 'sv' },
      vid: [], poles: [-70, 70, -1], runoff: ['QUEZALTEPEQUE', 'EL SALVADOR', 'OPICO'], straight: [-250, 300, -1],
      farm: { wall: [0.94, 0.92, 0.86], roof: [0.6, 0.3, 0.2], end: [0.9, 0.88, 0.82], barn: [0.55, 0.45, 0.35], barnRoof: [0.6, 0.3, 0.2], barnEnd: [0.52, 0.42, 0.32] },
      tvSkip: [2, 3, 6], recov: [0, 7, 10], photo: [0, 4, 7, 8, 10], jets: [SV[0], SV[1], SV[0]],   // (TV towers at the big corners, not at the second parts of the double corners)
      colMod: (P) => {   // the valley in the wet tropics: the grass green, darker and lighter in patches, the dry season's yellow in patches away from the track, the old lava black-brown and rough, the scrub darker, the houses' ground pale
        return (x, z, c, dd) => {
          const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.95 + (n - 0.5) * 0.16 + (m - 0.5) * 0.1;
          const fm = nrLCf(x, z, 0), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3), far = sstep(10, 30, dd == null ? 99 : dd), v = 0.92 + 0.12 * m;
          c[0] *= k * 0.95; c[1] *= k * 1.03; c[2] *= k * 0.92;
          const dry = sstep(0.5, 0.75, P.n3(x * 0.35 + 90, z * 0.35 - 40)) * fm * far;   // (the dry season's grass: yellow-green)
          if (dry > 0) { const q = sstep(0.3, 0.75, P.n1(x * 0.9 - 210, z * 0.9 + 75));
            c[0] = lerp(c[0], lerp(1.2, 1.4, q) * v, dry * 0.7); c[1] = lerp(c[1], lerp(1.25, 1.35, q) * v, dry * 0.7); c[2] = lerp(c[2], lerp(0.7, 0.82, q) * v, dry * 0.7); }
          if (sc > 0) { const t = sc * 0.4; c[0] = lerp(c[0], 0.9 * v, t); c[1] = lerp(c[1], 1.1 * v, t); c[2] = lerp(c[2], 0.75 * v, t); }
          if (se > 0) { const t = se * 0.85 * far; c[0] = lerp(c[0], 1.6 * v, t); c[1] = lerp(c[1], 1.5 * v, t); c[2] = lerp(c[2], 1.4 * v, t); }
          const lv = qzLava(x, z) * sstep(6, 14, dd == null ? 99 : dd);   // (the old lava: black-brown rock, rough, a little moss and grass in its cracks)
          if (lv > 0) { const r = 0.25 + 0.15 * P.n1(x * 2.6 + 30, z * 2.6 - 80) + 0.08 * m, g = sstep(0.62, 0.8, P.n3(x * 1.1 - 400, z * 1.1 + 70)) * 0.35;
            c[0] = lerp(c[0], lerp(r * 1.5, 0.8, g), lv); c[1] = lerp(c[1], lerp(r, 0.9, g), lv); c[2] = lerp(c[2], lerp(r * 1.7, 0.6, g), lv); }   // (on the green ground colour: grey-brown)
        };
      } },
  });
  World.keep('NR', 'quezaltepeque');   // (its grids kept between its builds; World.build frees the others')
  World.ext.quezaltepeque = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
