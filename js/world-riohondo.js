/* =========================================================================
   WORLD — Termas de Río Hondo, Argentina (theme 'riohondo'): the circuit on the plain of the Gran Chaco west of the town of Termas de Río
   Hondo, by the reservoir behind the dam on the river, its own parts on the shared builder of js/world-rbring.js (World.ext.rbring), loaded
   before it (index.html). Its look (RB_LOOK.riohondo) goes on API.rbLook; World.ext.riohondo builds it with World.ext.rbring. Plan:
   docs/nove-proge-1-0.md (Del 3, A19), the track: docs/proge/riohondo.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.fl, LK.colMod): the trees of the monte (the wide flat crowns of the carob trees,
   the taller loose crowns of the quebrachos, the thorny shrubs: rhTreeGeo), the plain's grass going straw-green in the autumn, the fields
   round the circuit (stubble, bare earth, green crops), the circuit's lawns by the track; the lake to the south and the east (def.sk.lake:
   its level, its water from the ground model, ESA WorldCover and OpenStreetMap; the terrain's water cells lowered under it in the track's
   file) with its muddy shore and the lapping at the waterline; the service roads round the circuit (def.sk.svc: OpenStreetMap), the flat
   horizon of the plain with the lake in it (def.far: Riverside's rsFar), the Argentine flag among the fans' flags, blue turn numbers.
   Only place names on its boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, NRC, RB, TAU, addShore, cyl, lerp, nrDem, nrDist, nrGH, nrGround, nrLCf, nrNear, puff, rng, shoreBand, sstep, waterMat, waterline } = API;
  // the text boards: place names (the town, the country, the start line's, the province's capital and towns, the neighbouring province, the
  // plain), the grandstands' names (def.stands), the DRS boards
  const RH_BAN = [['RÍO HONDO', '#5b97cf', '#fff', '#fff'], ['ARGENTINA', '#5b97cf', '#fff', '#f6b40e'], ['LARGADA · LLEGADA', '#16181c', '#fff', '#5b97cf'], ['SANTIAGO', '#1f3a5f', '#fff', '#f6b40e'],
    ['LAS TERMAS', '#1f3a5f', '#fff', '#fff'], ['TUCUMÁN', '#2f4a2a', '#fff', '#fff'], ['LA BANDA', '#1f3a5f', '#fff', '#5b97cf'], ['FRÍAS', '#2f4a2a', '#fff', '#f6b40e'],
    ['LORETO', '#1f3a5f', '#fff', '#fff'], ['GRAN CHACO', '#6b4a2a', '#fff', '#fff'], ['DRS', '#101114', '#fff', '#39c84a']];
  const RH_AT = { num: 0, brake: 14, ban: 17, rbr: 17, spielberg: 18 };   // atlas cells: the 14 turn numbers, the braking boards, the banners
  const RH_SHIRTS = [[0.46, 0.68, 0.88], [0.95, 0.95, 0.93], [0.16, 0.2, 0.36], [0.13, 0.13, 0.15], [0.46, 0.68, 0.88], [0.42, 0.44, 0.48], [0.97, 0.78, 0.14], [0.92, 0.92, 0.9],
    [0.78, 0.12, 0.16], [0.2, 0.42, 0.78], [0.55, 0.42, 0.3], [0.2, 0.45, 0.28]];   // the fans' shirts: lots of light blue and white, navy, black and grey, a few yellow, red and green
  // the Argentine flag: light blue, white, light blue, the golden Sun of May in the middle (World.flagMesh's emblems, look.sym, as
  // assets/flags/argentina.svg): in the flag's height G, the middle of the cloth 0.75 G from the pole (the flags here are 3:2), 32 rays
  // (two stars of 16 points, straight and shorter flaming ones in turn, 5/18 G across), their solid middles the face
  const AR = ((b, w, g) => Object.assign([b, w, b], { sym: [['star', g, 0.75, 0.5, 0.139, 0.062, 16, -Math.PI / 2], ['star', g, 0.75, 0.5, 0.118, 0.062, 16, -Math.PI / 2 + Math.PI / 16]] }))(
    [0.46, 0.68, 0.88], [0.96, 0.96, 0.97], [0.96, 0.71, 0.06]);

  // ---- the trees (unit height 1, instanced; LK.woods): 0 a carob tree of the monte (a short trunk forking low, a wide flat crown of fine
  //      light leaves in loose clumps), 1 a quebracho (a taller straight trunk, a loose grey-green crown in clumps, higher than wide), 2 a
  //      thorny shrub (low olive clumps); far from the road (k >= 3) plainer ----
  function rhTreeGeo(kind, far) {
    const g = new GB(), R = rng(8411 + kind * 7 + (far ? 1 : 0)), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.42, 0.36, 0.3], barkD = [0.33, 0.28, 0.23];
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.055, 0.3, far ? 4 : 5, barkD, null, 0.045);
      if (!far) for (const [x, z] of [[0.09, 0.03], [-0.08, 0.05], [0.01, -0.09]]) cyl(g, x * 0.5, 0.26, z * 0.5, 0.03, 0.3, 4, bark, null, 0.02);   // (the trunk forked low into three limbs)
      const LF = [[0.37, 0.45, 0.21], [0.41, 0.49, 0.23], [0.34, 0.42, 0.2], [0.39, 0.47, 0.22]];
      const cl = far ? [[0, 0.62, 0, 0.46, 0.45], [0.06, 0.74, 0.04, 0.3, 0.45]]
        : [[0.28, 0.6, 0.06, 0.28, 0.48], [-0.27, 0.59, 0.1, 0.27, 0.48], [0.03, 0.6, -0.3, 0.27, 0.48], [0.04, 0.62, 0.3, 0.26, 0.5], [0, 0.72, 0, 0.32, 0.5]];   // (four round the edge of the flat crown, one on top)
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, LF[q % 4], R, 0.24, 0.5, 1.12, !far));
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.032, 0.58, far ? 3 : 5, bark, null, 0.022);
      const LF = [[0.31, 0.38, 0.25], [0.35, 0.42, 0.28], [0.29, 0.36, 0.23]];
      const cl = far ? [[0, 0.7, 0, 0.36, 0.85], [0.04, 0.88, 0.02, 0.24, 0.8]]
        : [[0.14, 0.6, 0.04, 0.24, 0.8], [-0.15, 0.66, -0.06, 0.23, 0.82], [0.02, 0.74, 0.14, 0.22, 0.8], [-0.04, 0.86, -0.02, 0.22, 0.85], [0.12, 0.5, -0.12, 0.17, 0.7]];   // (loose clumps up the crown, one hanging low)
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, LF[q % 3], R, 0.28, 0.55, 1.1, !far));
    } else {
      const cl = far ? [[0, 0.42, 0, 0.5, 0.75]] : [[0.12, 0.4, 0.05, 0.42, 0.75], [-0.16, 0.36, -0.06, 0.38, 0.75], [0.02, 0.48, -0.18, 0.32, 0.78]];
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, q % 2 ? [0.36, 0.38, 0.22] : [0.41, 0.42, 0.25], R, 0.3, 0.55, 1.08, false));
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // on the land cover (0 the lawns and the grass, 1 the monte, 2 the fields and the lake's shore, 3 the houses and the car parks): the monte
  // carob trees and quebrachos with shrubs among them; on the grass lone carob trees and shrubs; in the fields a carob tree left standing here
  // and there; trees by the houses
  const RH_WOODS = {
    n: 3, geo: (k) => rhTreeGeo(k % 3, k >= 3), cr: [0.46, 0.36, 0.42], p: [0.022, 0.5, 0.006, 0.05],
    pick(cl, R, far) {
      const r = R(), r2 = R(), r3 = R();
      const sp = cl === 1 ? (r < 0.45 ? 0 : r < 0.72 ? 1 : 2) : cl === 2 ? (r < 0.7 ? 0 : r < 0.85 ? 1 : 2) : cl === 3 ? (r < 0.5 ? 0 : r < 0.8 ? 1 : 2) : r < 0.45 ? 0 : r < 0.6 ? 1 : 2;
      let h = sp === 0 ? 6 + r2 * 4.5 : sp === 1 ? 9 + r2 * 6 : 1.5 + r2 * 1.8; if (far) h *= 1.06;
      return [sp, h, h * (sp === 0 ? 1.25 + r3 * 0.3 : sp === 1 ? 0.65 + r3 * 0.2 : 1.3 + r3 * 0.4)];
    },
  };

  // the service roads round the circuit (def.sk.svc: OSM's highway=service and =unclassified): plain asphalt 5 m wide on the ground, its two
  // edges every 4 m (the terrain under them), 8 cm over it and drawn over it; not inside the barriers nor within 4 m past them (the
  // run-offs are the builder's), the trees and the people off them
  function rhWays({ root, exclPush, CR }, S, HW, col, map, name, st) {
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
        const nx = -dz / dl, nz = dx / dl, row = [-HW, HW].map(o => { const px = x + nx * o, pz = z + nz * o; return [px, nrGround(px, pz) + 0.08, pz]; });   // (left to right in the way's direction: (nx, nz) its right)
        const r = rb.row(row, [col, col], row.map((e, j) => [j * HW / 2, along / 4]));
        if (prev >= 0) rb.link(prev, r, 0, 1); prev = r;
        if (q % 2 === 0) { exclPush(x, z, HW + 1.5); if (nn.i >= 0 && nn.dd < 70) CR.avoid(x, z, HW + 0.5); }
        st.road += 4;
      }
    }
    if (rb.empty) return;
    const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = name; root.add(m);
  }

  // the lake (def.sk.lake: y its level; near, far: [x0, z0, cell, [row, first, last + 1, ...]] its water as runs of cells, the terrain's and
  // past it the horizon's): one flat mesh at its level (World's waterMat: wavelets, the sky mirrored; a grey-green lake of the plain), the
  // terrain's water cells lowered under it in the track's file (the land by it above it: the terrain hides the water's edge); the lapping
  // along the shore (the band at the waterline of the terrain grid: the shallows' colour, a little foam); the trees and the people off it
  function rhLake({ root, tex, exclPush, out }, st) {
    const L = (API.T.def.sk || {}).lake, G = API.NR && API.NR.G; if (!L || !G) return;
    const Y = L.y, gw = new GB(true), wc = [1, 1, 1];
    for (const [x0, z0, c, runs] of [L.near, L.far]) for (let k = 0; k + 2 < runs.length; k += 3) {
      const j = runs[k], xa = x0 + runs[k + 1] * c, xb = x0 + runs[k + 2] * c, za = z0 + j * c, zb = za + c, uv = (x, z) => [x / 16, -z / 16];
      const A = [xa, Y, za], B = [xb, Y, za], C = [xb, Y, zb], D = [xa, Y, zb], below = [(xa + xb) / 2, Y - 5, (za + zb) / 2];
      gw.triO(A, B, C, wc, below, wc, wc, uv(xa, za), uv(xb, za), uv(xb, zb)); gw.triO(A, C, D, wc, below, wc, wc, uv(xa, za), uv(xb, zb), uv(xa, zb)); st.lake++;
    }
    if (!st.lake) return;
    const WO = { len: 1.6, amp: 0.8, refl: 0.5, land: 0.7, shal: 0.7, lap: 0.6, surf: 0.25 }, wm = new THREE.Mesh(gw.geometry(), waterMat(tex, Object.assign({ color: 0x6b8580 }, WO)));
    wm.receiveShadow = true; wm.matrixAutoUpdate = false; wm.updateMatrix(); wm.name = 'riohondo lake'; root.add(wm); out.dyn.water = tex.water;
    addShore(root, shoreBand(G.x0, G.z0, G.x0 + (G.nx - 1) * NRC, G.z0 + (G.nz - 1) * NRC, Y + 0.015, waterline(nrGH, G.x0, G.z0, NRC, 0, G.nx - 1, 0, G.nz - 1, Y), 18, { F: 3 }), wm.material, WO);
    for (let j = 0; j < G.nz; j += 3) for (let i = 0; i < G.nx; i += 3) {
      const x = G.x0 + i * NRC, z = G.z0 + j * NRC; if (nrGH(i, j) < Y + 0.8 && nrDist(x, z) < 340) exclPush(x, z, NRC * 2.3);
    }
  }

  // the horizon (def.far, Riverside's rsFar): the lake's grey-blue (the pale sky in it), the plain's monte and fields, flat to the edge of
  // sight, in the dusty haze: all of the flat plain lies within a few degrees of the horizon, past the near view's haze, so even its
  // inner rings are mostly haze, a little brighter than the fog's colour (rsFar darkens its curtain's foot and the side away from the
  // sun; darker, the curtain stood as a dark wall over the hazy near ground in a view from above: the menu's corner camera)
  const rhFarCol = (h, d) => {
    const c = h < 273 ? [0.62, 0.7, 0.74] : h < 300 ? [0.36, 0.38, 0.24] : [0.33, 0.35, 0.25], f = 0.75 + 0.2 * (1 - Math.exp(-d / 6000));
    return c.map((v, k) => lerp(v, [1.0, 1.0, 0.97][k], f));
  };

  // LK.extra: the service roads, the lake, the horizon; before the crowds and the trees, which keep clear of them
  function rhExtra(o) {
    const { root, out, tex } = o, sk = API.T.def.sk || {}, st = { road: 0, lake: 0, far: 0 };
    rhWays(o, sk.svc || [], 2.5, [0.9, 0.9, 0.92], tex.asphalt, 'riohondo service roads', st);
    rhLake(o, st);
    if (API.T.def.far && API.rsFar) { out.dyn.far = API.rsFar(root, API.T.def.far, 'summer', 6, rhFarCol); st.far = 1; }   // (World.update: no car, back where it was built)
    return st;
  }

  // the fields of the plain: big rectangles (110-190 m by 240 m) on a grid turned 6 degrees from north, each its own: the stubble of the
  // harvested soy pale gold, the bare earth ploughed brown, a green crop, the dry grass of a fallow field
  const FIELD = [[1.62, 1.26, 1.06], [1.5, 1.08, 0.96], [0.84, 0.97, 0.72], [1.3, 1.14, 0.9], [1.7, 1.32, 1.12]];
  const hsh = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const FC = Math.cos(0.1), FS = Math.sin(0.1), FQ = [0, 0, 0];
  function field(x, z, P) {
    const u = x * FC + z * FS, v = -x * FS + z * FC, row = Math.floor(v / 240), hr = hsh(row, 41), wd = 110 + 80 * hr, col = Math.floor((u + hr * 173) / wd), r = hsh(row * 29 + 3, col);
    const C = FIELD[r < 0.3 ? 0 : r < 0.5 ? 1 : r < 0.68 ? 2 : r < 0.86 ? 3 : 4], j = 0.95 + 0.1 * hsh(col, row) + (P.n4(x * 0.5, z * 0.5) - 0.5) * 0.1;
    FQ[0] = C[0] * j; FQ[1] = C[1] * j; FQ[2] = C[2] * j; return FQ;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    riohondo: { ban: RH_BAN, at: RH_AT, nums: 14, numC: ['#5b97cf', '#fff', '#fff'], shirts: RH_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.12, 1.04, 0.9], gravel: false, noVid: true,
      pitBox: [-140, 150, -1], mow: 0.4,   // (the pit garages on the left of the main straight; faint mowing stripes; no farms by the circuit)
      woods: RH_WOODS, extra: rhExtra, lane: true, fl: { ar: AR }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      flags: { stand: [{ ar: 0.8, tm: 0.2 }, { ar: 0.7, tm: 0.15, rb: 0.15 }], ga: { ar: 0.8, tm: 0.2 }, camp: { ar: 0.85, tm: 0.15 }, pole: 'ar', podium: 'ar' },
      vid: [], poles: [-200, 160, 1], runoff: ['RÍO HONDO', 'ARGENTINA', 'SANTIAGO'], straight: [-210, 170, 1],
      farm: { wall: [0.93, 0.9, 0.84], roof: [0.55, 0.32, 0.24], end: [0.9, 0.87, 0.8], barn: [0.55, 0.45, 0.35], barnRoof: [0.6, 0.62, 0.64], barnEnd: [0.52, 0.42, 0.32] },
      tvSkip: [1, 5, 7, 9, 11], recov: [0, 4, 12], photo: [0, 2, 4, 6, 10, 12], jets: [AR[0], [0.97, 0.97, 0.97], AR[0]],   // (TV towers at the big corners, not at the kinks and the second parts of the long rights)
      colMod: (P) => {   // the plain in the autumn: the circuit's lawns by the track still green; the grass of the plain straw-green, paler and browner in patches; the monte's floor dark and dusty; the fields a patchwork of stubble, bare earth and green crops; the lake's shore muddy; the car parks dusty grey
        const LY = ((API.T.def.sk || {}).lake || {}).y;
        return (x, z, c, dd) => {
          dd = dd == null ? 99 : dd;
          const m = P.n3(x * 1.6 + 300, z * 1.6), v = 0.92 + 0.12 * m, k = 0.95 + (P.n5(x * 0.55 + 700, z * 0.55) - 0.5) * 0.14 + (m - 0.5) * 0.1;
          c[0] *= k; c[1] *= k; c[2] *= k * 0.97;
          const gr = nrLCf(x, z, 0), mt = nrLCf(x, z, 1), fd = nrLCf(x, z, 2), se = nrLCf(x, z, 3), far = sstep(6, 22, dd);
          const lawn = gr * sstep(40, 12, dd) * 0.7;   // (the lawns by the track: kept green within a few metres of the barriers)
          if (lawn > 0) { c[0] = lerp(c[0], 1.02 * v, lawn); c[1] = lerp(c[1], 1.05 * v, lawn); c[2] = lerp(c[2], 0.82 * v, lawn); }
          const dry = gr * far * (1 - lawn) * (0.7 + 0.3 * sstep(0.35, 0.7, P.n3(x * 0.7 + 90, z * 0.7 - 40)));   // (the plain's grass: straw-green, paler and browner in patches)
          if (dry > 0) { const q = sstep(0.3, 0.75, P.n1(x * 0.9 - 210, z * 0.9 + 75));
            c[0] = lerp(c[0], lerp(1.34, 1.66, q) * v, dry); c[1] = lerp(c[1], lerp(1.17, 1.26, q) * v, dry); c[2] = lerp(c[2], lerp(0.92, 1.14, q) * v, dry); }
          const bare = sstep(0.62, 0.8, P.n1(x * 1.2 + 40, z * 1.2 - 510)) * (gr + mt) * far * 0.7;   // (the pale grey-brown earth of the plain bare in patches)
          if (bare > 0) { c[0] = lerp(c[0], 1.72 * v, bare); c[1] = lerp(c[1], 1.36 * v, bare); c[2] = lerp(c[2], 1.3 * v, bare); }
          if (mt > 0) { const t = mt * 0.6 * far; c[0] = lerp(c[0], 1.08 * v, t); c[1] = lerp(c[1], 1.0 * v, t); c[2] = lerp(c[2], 0.78 * v, t); }   // (the monte's floor: dust and fallen leaves under the thorny scrub)
          if (fd > 0) { const t = fd * far; const q = field(x, z, P); c[0] = lerp(c[0], q[0] * v, t); c[1] = lerp(c[1], q[1] * v, t); c[2] = lerp(c[2], q[2] * v, t); }
          if (se > 0) { const t = se * 0.8 * far; c[0] = lerp(c[0], 1.75 * v, t); c[1] = lerp(c[1], 1.3 * v, t); c[2] = lerp(c[2], 2.1 * v, t); }
          if (LY != null) { const mud = sstep(1.6, 0.4, nrDem(x, z) - LY) * far;   // (the lake's shore: grey-brown mud down to the water)
            if (mud > 0) { c[0] = lerp(c[0], 1.5 * v, mud); c[1] = lerp(c[1], 1.18 * v, mud); c[2] = lerp(c[2], 1.12 * v, mud); } }
        };
      } },
  });
  World.keep('NR', 'riohondo');   // (its grids kept between its builds; World.build frees the others')
  World.ext.riohondo = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
