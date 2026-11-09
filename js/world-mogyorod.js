/* =========================================================================
   WORLD — Mogyoród, Madžarska (theme 'mogyorod'): the circuit in the hills at Mogyoród north-east of Budapest, its own parts on the
   shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.mogyorod) goes on API.rbLook;
   World.ext.mogyorod builds it with World.ext.rbring. Plan: docs/dirkalisca-celine.md, the track: docs/proge/mogyorod.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.fl): the broadleaved woods of the Gödöllő hills (oak and locust as the
   builder's broadleaved trees, a few conifers in the plantations: js/world.js's nrTreeGeo), lone trees on the dry meadows and round the
   buildings; the Pannonian summer in the ground's colours (the grass burnt straw-yellow in patches, the fields golden with stubble or
   green with maize and sunflowers, the vineyards); the buildings round the circuit and its fences (def.sk.bld, def.sk.fence:
   OpenStreetMap); the Hungarian flag among the fans' flags. Only place names on its boards (no names of the circuit, its people, races
   or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, box, lerp, nrGround, nrLCf, rng, sstep } = API;
  // the text boards: place names (the village, the county, the country, the towns round the circuit, the river), the grandstands' names
  // (def.stands: the towns round it) and the start line's
  const MG_BAN = [['MOGYORÓD', '#c8102e', '#fff', '#fff'], ['PEST', '#2f5d3a', '#fff', '#c8102e'], ['START · CÉL', '#16181c', '#fff', '#c8102e'], ['MAGYARORSZÁG', '#2f5d3a', '#fff', '#fff'],
    ['GÖDÖLLŐ', '#1d3f6e', '#fff', '#c8102e'], ['FÓT', '#1d3f6e', '#fff', '#2f5d3a'], ['DUNA', '#1d3f6e', '#fff', '#fff'], ['KEREPES', '#3a3f46', '#fff', '#c8102e']];
  const MG_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const MG_SHIRTS = [[0.8, 0.12, 0.17], [0.95, 0.95, 0.93], [0.2, 0.42, 0.26], [0.12, 0.18, 0.36], [0.4, 0.42, 0.46], [0.14, 0.14, 0.16], [1, 0.5, 0.1], [0.98, 0.8, 0.14],
    [0.3, 0.55, 0.85], [0.92, 0.92, 0.9], [0.86, 0.32, 0.12], [0.56, 0.44, 0.32]];   // the fans' shirts in the summer heat: red, white and green, navy, grey and black, orange, yellow and light blue
  const HU = [[0.8, 0.16, 0.22], [0.95, 0.95, 0.94], [0.28, 0.44, 0.31]];   // the Hungarian flag: red, white, green

  // the trees (LK.woods, on the builder's land cover: 0 open, 1 the woods, 2 the fields and vineyards, 3 built-up): unit trees of js/world.js
  // (0 a conifer, 1 a broadleaved tree; 2, 3 the plainer ones far from the road); the woods broadleaved, a conifer here and there in the
  // plantations (the noise), lone trees on the meadows and the field edges, the gardens' trees round the buildings
  const MG_WOODS = {
    n: 2, geo: (k) => API.nrTreeGeo(k), cr: [0.3, 0.34], p: [0.014, 0.85, 0.004, 0.03],
    pick(cl, R, far, x, z) {
      const P = API.NR, r = R(), r2 = R(); let sp, h;
      if (cl === 1) { const blk = P.n1(x * 0.6 + 260, z * 0.6 - 410); sp = blk < 0.22 && r < 0.6 ? 0 : 1; h = sp === 0 ? 14 + r2 * 6 : 11 + r2 * 9; }
      else if (cl === 3) { sp = r < 0.15 ? 0 : 1; h = 7 + r2 * 6; }
      else { sp = 1; h = 7 + r2 * 7; }
      if (far) h *= 1.08;
      return [sp, h, h * (sp === 0 ? 0.42 + r2 * 0.1 : 0.62 + r2 * 0.2)];
    },
  };

  // LK.extra: the buildings by the circuit (OSM outlines as boxes: white or cream render, brick, grey cladding on the big halls; flat or
  // low roofs), its fences (chain link on posts; not where they would stand in the circuit's barriers or run-offs); before the crowds and
  // the trees, which keep clear of them
  function mgExtra({ root, tex, scen, exclPush, CR }) {
    const T = API.T, sk = T.def.sk || {}, R = rng(4381), st = { buildings: 0, fence: 0 };
    const b6 = sk.bld || [], WALL = [[0.93, 0.91, 0.86], [0.9, 0.84, 0.7], [0.66, 0.4, 0.3], [0.74, 0.75, 0.76]], ROOF = [[0.26, 0.27, 0.29], [0.42, 0.42, 0.44], [0.58, 0.3, 0.2]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      const wc = h > 6 ? WALL[3] : WALL[Math.floor(R() * 3)], rc = ROOF[h > 6 ? 0 : Math.floor(R() * 3)];
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, wc, rc, true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    const fg = new GB(true), keep = (x, z) => { const i = T.nearestIdx(x, z), o = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]; return Math.abs(o) > (o > 0 ? T.br[i] : T.bl[i]) + 2.5 && !T.pitAt(i * T.ds); };
    for (const f of sk.fence || []) {   // a fence: chain link 2 m high (the debris fences' picture), a post every 3 m
      let acc = 0;
      for (let k = 2; k < f.length; k += 2) {
        const ax = f[k - 2], az = f[k - 1], bx = f[k], bz = f[k + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 3));
        for (let q = 0; q < n; q++) {
          const x0 = ax + (bx - ax) * q / n, z0 = az + (bz - az) * q / n, x1 = ax + (bx - ax) * (q + 1) / n, z1 = az + (bz - az) * (q + 1) / n, d = L / n;
          if (!keep(x0, z0) || !keep(x1, z1)) { acc += d; continue; }
          const y0 = nrGround(x0, z0), y1 = nrGround(x1, z1), u0 = acc / 2.5, u1 = (acc + d) / 2.5, ins = [(x0 + x1) / 2 - (z1 - z0), y0 + 1, (z0 + z1) / 2 + (x1 - x0)];
          fg.quadO([x0, y0 + 0.05, z0], [x1, y1 + 0.05, z1], [x1, y1 + 2.05, z1], [x0, y0 + 2.05, z0], [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 0.8], [u0, 0.8]]);
          box(scen.get(x0, z0), x0, y0 - 0.2, z0, 0.08, 2.35, 0.08, Math.atan2(bz - az, bx - ax), [0.58, 0.6, 0.62]);
          acc += d; st.fence += d;
        }
      }
    }
    if (!fg.empty) { const m = new THREE.Mesh(fg.geometry(), new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'fences'; root.add(m); }
    st.fence = Math.round(st.fence);
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    mogyorod: { ban: MG_BAN, at: MG_AT, nums: 0, shirts: MG_SHIRTS, smoke: false, camps: 0, seC: [1.16, 1.04, 0.82], gravel: true, noVid: true,
      pitBox: [-38, 273, 1], vg: [0.98, 0.98, 0.8], edge: [1.12, 1.0, 0.86], mow: 0.6,   // (the long pit building on the right of the straight; the verge drier in the summer heat; fainter mowing stripes)
      woods: MG_WOODS, extra: mgExtra, lane: true, fl: { hu: HU }, ck: 2,   // (lane: the pit lane's asphalt past the pit building too, 690 m of it; ck: chunks twice as big: fewer draws where much of the circuit's bowl is in view)
      flags: { stand: [{ hu: 0.7, tm: 0.3 }, { hu: 0.55, tm: 0.25, or: 0.2 }], ga: { hu: 0.6, tm: 0.25, or: 0.15 }, camp: { hu: 0.7, tm: 0.3 }, pole: 'hu', podium: 'hu' },
      vid: [], poles: [-200, 200, -1], runoff: ['MOGYORÓD', 'PEST', 'MAGYARORSZÁG'], straight: [-220, 300, -1],
      farm: { wall: [0.94, 0.92, 0.86], roof: [0.62, 0.3, 0.2], end: [0.92, 0.9, 0.84], barn: [0.72, 0.62, 0.46], barnRoof: [0.5, 0.28, 0.2], barnEnd: [0.7, 0.6, 0.44] },   // a white farmhouse under red tiles, a barn of pale brick
      tvSkip: [1, 4, 6, 8, 10], recov: [0, 5, 11], photo: [0, 3, 9, 12], jets: [[0.8, 0.16, 0.22], [0.97, 0.97, 0.97], [0.28, 0.44, 0.31]],   // (TV towers at the hairpins, the spring corner, the long right, the chicane, Pest, the sharp right and the last corner)
      colMod: (P) => (x, z, c) => {   // the Pannonian summer: the grass dry and warm, burnt straw-yellow in patches; the fields golden with stubble, green with maize, dark with sunflowers
        const n = P.n5(x * 0.55 + 520, z * 0.55), m = P.n3(x * 1.6 + 140, z * 1.6), k = 0.93 + (n - 0.5) * 0.18 + (m - 0.5) * 0.1;
        c[0] *= k * 1.04; c[1] *= k * 0.98; c[2] *= k * 0.86;
        { const fm = nrLCf(x, z, 0), dry = sstep(0.42, 0.7, P.n3(x * 0.8 + 90, z * 0.8 - 40)) * 0.65 * fm;   // (the meadows: patches burnt straw-yellow)
          c[0] = lerp(c[0], c[0] * 1.28 + 0.05, dry); c[1] = lerp(c[1], c[1] * 1.08 + 0.02, dry); c[2] = lerp(c[2], c[2] * 0.98, dry); }
        const f = nrLCf(x, z, 2);
        if (f > 0) { const crop = P.n1(x * 0.35 + 1200, z * 0.35), col = crop < 0.36 ? [0.66, 0.84, 0.46] : crop < 0.62 ? [1.56, 1.16, 0.56] : [0.8, 0.82, 0.42];   // (maize, stubble, sunflowers and vines)
          c[0] = lerp(c[0], col[0], f * 0.85); c[1] = lerp(c[1], col[1], f * 0.85); c[2] = lerp(c[2], col[2], f * 0.85); }
      } },
  });
  World.keep('NR', 'mogyorod');   // (its grids kept between its builds; World.build frees the others')
  World.ext.mogyorod = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
