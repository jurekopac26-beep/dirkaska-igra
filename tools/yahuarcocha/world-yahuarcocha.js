/* =========================================================================
   WORLD — Yahuarcocha, Ekvador (theme 'yahuarcocha'): the circuit by the lake Yahuarcocha in the Andes north-east of Ibarra, its own
   parts on the shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.yahuarcocha)
   goes on API.rbLook; World.ext.yahuarcocha builds it with World.ext.rbring. Plan: docs/dirkalisca-celine.md, the track:
   docs/proge/yahuarcocha.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.pad, LK.fl): the valley's dry grass and pastures, the fields and the paddock
   in the ground's colours; tall eucalyptus trees in woods and rows, pepper trees and shrubs; the lake (def.sk.sea: the shared builder's
   API.rbSea) with reeds along its shore, agaves on the dry slopes; the volcanoes on the horizon (def.far: Riverside's API.rsFar, as
   Pembrey's and Kildare's); the Ecuadorian flag among the fans' flags. Only place names on its boards (no names of the circuit, its
   people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, IChunks, TAU, clamp, cone, lerp, nrDist, nrGround, nrLCf, puff, rng, sstep } = API;
  // the text boards: place names (the lake, the town, the province, the country, the towns and the volcano round the valley), the grandstands'
  // names (def.stands: the lake and the town) and the start line's (in Spanish, the country's language)
  const YA_BAN = [['YAHUARCOCHA', '#034ea2', '#fff', '#ffd100'], ['IBARRA', '#16181c', '#fff', '#ed1c24'], ['SALIDA · LLEGADA', '#16181c', '#fff', '#ffd100'], ['ECUADOR', '#ed1c24', '#fff', '#ffd100'],
    ['IMBABURA', '#1d3f6e', '#fff', '#ffd100'], ['OTAVALO', '#0e5a7a', '#fff', '#fff'], ['COTACACHI', '#2f5d34', '#fff', '#ffd100'], ['ATUNTAQUI', '#1d3f6e', '#fff', '#ed1c24']];
  const YA_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const YA_SHIRTS = [[1.0, 0.82, 0.0], [0.01, 0.31, 0.64], [0.93, 0.11, 0.14], [0.95, 0.95, 0.93], [0.12, 0.18, 0.36], [0.3, 0.55, 0.85], [0.86, 0.32, 0.12], [0.56, 0.24, 0.5],
    [0.14, 0.14, 0.16], [0.98, 0.7, 0.1], [0.2, 0.55, 0.3], [0.95, 0.95, 0.93]];   // the fans' shirts: yellow, blue and red, white, navy, light blue, orange, purple, black, gold, green
  const EC = [[1.0, 0.82, 0.0], [1.0, 0.82, 0.0], [0.01, 0.31, 0.64], [0.93, 0.11, 0.14]];   // the Ecuadorian flag: yellow (half its height), blue, red (World.rbFlags: its arms left out)

  // a tapered limb between two points (a prism of the given sides), its faces outwards
  function limb(g, A, B, r0, r1, sides, col) {
    const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]), t = d.map(v => v / L);
    const up = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let u = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]; const ul = Math.hypot(u[0], u[1], u[2]); u = u.map(v => v / ul);
    const w = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]], inn = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
    const ring = (C, r, a) => [C[0] + (u[0] * Math.cos(a) + w[0] * Math.sin(a)) * r, C[1] + (u[1] * Math.cos(a) + w[1] * Math.sin(a)) * r, C[2] + (u[2] * Math.cos(a) + w[2] * Math.sin(a)) * r];
    for (let i = 0; i < sides; i++) { const a0 = i / sides * TAU, a1 = (i + 1) / sides * TAU; g.quadO(ring(A, r0, a0), ring(B, r1, a0), ring(B, r1, a1), ring(A, r0, a1), col, inn); }
  }
  // unit trees (height 1, the instances scale them): 0 a eucalyptus, 1 a pepper tree (low: a shrub); 2, 3 the cheaper ones far from the road
  function yaTreeGeo(kind) {
    const g = new GB(), R = rng(3600 + kind), k = kind % 2, cheap = kind >= 2;
    if (k === 0) {   // the eucalyptus: a tall pale trunk, bare low down, an open narrow crown of hanging grey-green leaves high up
      const bark = [0.78, 0.74, 0.66], lean = (R() - 0.5) * 0.06;
      limb(g, [0, -0.02, 0], [lean, 0.72, 0], 0.02, 0.009, cheap ? 4 : 6, bark);
      const LF = [[0.4, 0.48, 0.42], [0.46, 0.53, 0.44], [0.36, 0.44, 0.38]], cl = cheap ? [[0, 0.72, 0, 0.17, 1.7]] :
        [[0.06, 0.56, 0.02, 0.1, 1.4], [-0.07, 0.62, 0.05, 0.11, 1.5], [0.03, 0.72, -0.06, 0.12, 1.5], [-0.02, 0.84, 0.03, 0.1, 1.5], [0.05, 0.93, 0.0, 0.07, 1.4]];
      if (!cheap) for (let q = 0; q < 3; q++) { const a = q / 3 * TAU + R(), c = Math.cos(a), s = Math.sin(a); limb(g, [lean * 0.7, 0.5, 0], [lean + c * 0.09, 0.66, s * 0.09], 0.007, 0.003, 3, bark); }
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x + lean, y, z, r, sy, LF[q % 3], R, 0.3, 0.55, 1.1, !cheap));
    } else {   // the pepper tree: a short gnarled trunk, a wide rounded crown of drooping bright leaves
      const bark = [0.42, 0.36, 0.3];
      limb(g, [0, -0.02, 0], [0.03, 0.34, 0], 0.05, 0.035, cheap ? 4 : 5, bark);
      const LF = [[0.34, 0.48, 0.24], [0.4, 0.53, 0.27], [0.3, 0.44, 0.22]], cl = cheap ? [[0, 0.62, 0, 0.42, 0.8]] :
        [[0.18, 0.6, 0.05, 0.27, 0.75], [-0.17, 0.62, 0.08, 0.26, 0.75], [0.02, 0.6, -0.2, 0.26, 0.75], [-0.03, 0.62, 0.2, 0.25, 0.75], [0.0, 0.74, 0.0, 0.3, 0.7]];
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, LF[q % 3], R, 0.25, 0.55, 1.1, !cheap));
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the trees (LK.woods, on the builder's land cover: 0 dry grass and pasture, 1 woods, trees and shrubs, 2 fields, 3 built-up): eucalyptus
  // woods and pepper trees and shrubs among them, a few trees alone on the pastures, eucalyptus rows along the fields, pepper trees by the houses
  const YA_WOODS = {
    n: 2, geo: yaTreeGeo, cr: [0.16, 0.42], p: [0.01, 0.2, 0.008, 0.014],
    pick(cl, R) {
      const r = R(), r2 = R(), sp = cl === 1 ? (r < 0.7 ? 0 : 1) : cl === 2 ? (r < 0.6 ? 0 : 1) : cl === 3 ? (r < 0.3 ? 0 : 1) : (r < 0.4 ? 0 : 1);
      const h = sp === 0 ? 16 + r2 * 14 : cl === 1 && r < 0.9 ? 2.5 + r2 * 2.5 : 5 + r2 * 4;   // (a eucalyptus 16-30 m; in the woods the pepper trees as shrubs 2.5-5 m; a pepper tree 5-9 m)
      return [sp, h, h * (sp === 0 ? 0.62 + r2 * 0.12 : 1.1 + r2 * 0.3)];
    },
  };

  // a reed tuft (unit height): thin blades, pale at the tips; an agave: a rosette of thick grey-blue leaves
  function yaReedGeo() {
    const g = new GB(), R = rng(3610);
    for (let q = 0; q < 7; q++) { const a = R() * TAU, d = R() * 0.32, h = 0.6 + R() * 0.4; cone(g, Math.cos(a) * d, -0.05, Math.sin(a) * d, 0.09, h, 3, [0.3, 0.38, 0.18], [0.62, 0.6, 0.38], R() * TAU); }   // (thick enough to be seen from the road)
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function yaAgaveGeo() {
    const g = new GB(), R = rng(3620), C = [0.42, 0.53, 0.5], D = [0.36, 0.46, 0.44];
    for (let q = 0; q < 11; q++) { const a = q / 11 * TAU + R() * 0.3, up = q < 4 ? 0.85 : 0.45 + R() * 0.25, L = 0.6 + R() * 0.25, c = Math.cos(a), s = Math.sin(a);
      limb(g, [c * 0.04, 0.05, s * 0.04], [c * L * (1 - up * 0.6), up * L, s * L * (1 - up * 0.6)], 0.07, 0.006, 3, q % 2 ? C : D); }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  // LK.extra: the lake (the shared builder's water, its colour green-brown: a shallow lake, reeds along it), the reeds along its shore within
  // sight of the track, agaves on the dry grass past the barriers, the volcanoes on the horizon
  const YA_SEA = { color: 0x55765e, wo: { len: 1.2, amp: 0.35, refl: 0.5, land: 0.55, shal: 0.7, lap: 0.35, surf: 0 } };
  const yaFarCol = (h, d) => {   // the far hills: the dry valley's ochre, the farmed and wooded slopes olive, the paramo high up tawny, bare rock, snow on the highest tops, the haze of the distance
    let c = h < 2600 ? [0.6, 0.55, 0.4] : h < 3300 ? [0.38, 0.43, 0.3] : h < 4100 ? [0.52, 0.49, 0.36] : [0.47, 0.45, 0.42];
    if (h >= 2600 && h < 2900) { const t = (h - 2600) / 300; c = c.map((v, k) => lerp([0.6, 0.55, 0.4][k], v, t)); }
    const sn = sstep(4380, 4560, h), f = (1 - Math.exp(-d / 45000)) * 0.85;
    c = c.map((v, k) => lerp(v, [0.95, 0.96, 0.99][k], sn));
    return c.map((v, k) => lerp(v, [0.7, 0.77, 0.86][k], f * (1 - 0.4 * sn)));
  };
  function yaExtra(o) {
    const { root, scen, exclPush, CR, excluded, out } = o, T = API.T, R = rng(3630), st = { water: 0, reeds: 0, agaves: 0 }, sea = API.rbSea;
    sea.water(o, st, YA_SEA);
    const S = (T.def.sk || {}).sea, mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    if (S) {   // the reeds: tufts in the shallows and on the wet shore, 2-3 m, in clumps; only within 150 m of the road (beyond it the water's edge is far enough)
      const rc = new IChunks(yaReedGeo(), mat, 8), x1 = S.x0 + (S.nx - 1) * S.cell, z1 = S.z0 + (S.nz - 1) * S.cell, clump = API.nrPN(24, 3640);   // (clump: their beds along the shore, gaps between)
      for (let z = S.z0; z < z1; z += 2.2) for (let x = S.x0; x < x1; x += 2.2) {
        const px = x + (R() - 0.5) * 2.2, pz = z + (R() - 0.5) * 2.2, d = sea.d(px, pz);
        if (d < -3 || d > 30 || nrDist(px, pz) > 150 || clump((px - S.x0) / 1200, (pz - S.z0) / 1200) < 0.3 || st.reeds > 900) continue;
        const gy = nrGround(px, pz); if (gy > S.lv + 0.4 || gy < S.lv - 0.9) continue;   // (only at the waterline as the ground meets the water: by the road the land stands above the lake)
        const h = 1.8 + R() * 1.0, cv = 0.9 + R() * 0.15;
        rc.add(px, Math.max(gy, S.lv) - 0.3, pz, R() * TAU, h * 1.3, h, [cv, cv, cv * 0.95]); st.reeds++;
      }
      rc.addTo(root, false);
    }
    const keep = (x, z) => { const i = T.nearestIdx(x, z), of = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]; return Math.abs(of) > (of > 0 ? T.br[i] : T.bl[i]) + 6 && !T.pitAt(i * T.ds) && !T.pitAt(i * T.ds + 30) && !T.pitAt(i * T.ds - 30); };
    const ac = new IChunks(yaAgaveGeo(), mat, 8);
    for (let tries = 0; tries < 500 && st.agaves < 90; tries++) {   // along the lap, 8-50 m out on either side, on the dry grass, in twos and threes
      const i = Math.floor(R() * T.N), side = R() < 0.5 ? -1 : 1, oo = (side > 0 ? T.br[i] : T.bl[i]) + 8 + R() * 42, x = T.px[i] + T.nx[i] * oo * side, z = T.pz[i] + T.nz[i] * oo * side;
      if (!keep(x, z) || (excluded && excluded(x, z)) || nrLCf(x, z, 0) < 0.6 || sea.d(x, z) > -4) continue;
      for (let q = 0, n = 1 + Math.floor(R() * 3); q < n; q++) {
        const ax = x + (R() - 0.5) * 6, az = z + (R() - 0.5) * 6, s = 1.0 + R() * 0.8, cv = 0.9 + R() * 0.15;
        ac.add(ax, nrGround(ax, az) - 0.05, az, R() * TAU, s * 1.1, s, [cv, cv, cv]); exclPush(ax, az, s + 0.8); CR.avoid(ax, az, s + 0.5); st.agaves++;
      }
    }
    ac.addTo(root, true);
    if (T.def.far && API.rsFar) { out.dyn.far = API.rsFar(root, T.def.far, 'summer', 6, yaFarCol); st.far = 1; }   // (World.update: no car, back where it was built)
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    yahuarcocha: { ban: YA_BAN, at: YA_AT, nums: 0, shirts: YA_SHIRTS, smoke: false, camps: 0, seC: [1.04, 1.0, 0.9], gravel: true, noVid: true,
      pitBox: [-62, 72, 1], vg: [1.06, 0.98, 0.8], edge: [1.08, 1.0, 0.84], mow: 0.35,   // (the pit building on the right of the straight; the verges dry, faint stripes)
      woods: YA_WOODS, extra: yaExtra, pad: (p0) => API.rbSea.pad(p0), lane: true, fl: { ec: EC }, ck: 2,   // (lane: the pit lane's asphalt past the pit building too; ck: chunks twice as big: fewer draws)
      flags: { stand: [{ ec: 0.75, tm: 0.25 }, { ec: 0.6, tm: 0.25, or: 0.15 }], ga: { ec: 0.65, tm: 0.25, or: 0.1 }, camp: { ec: 0.7, tm: 0.3 }, pole: 'ec', podium: 'ec' },
      vid: [], poles: [-90, 60, -1], runoff: ['YAHUARCOCHA', 'ECUADOR', 'IBARRA'], straight: [-220, 160, -1],
      farm: { wall: [0.92, 0.9, 0.84], roof: [0.66, 0.34, 0.24], end: [0.9, 0.88, 0.82], barn: [0.74, 0.62, 0.48], barnRoof: [0.6, 0.6, 0.58], barnEnd: [0.72, 0.6, 0.46] },   // white walls under clay tiles, an adobe shed under sheeting
      tvSkip: [0, 2, 4, 6, 9, 11], recov: [3, 5, 12], photo: [1, 5, 10, 12], jets: [[1.0, 0.82, 0.0], [0.01, 0.31, 0.64], [0.93, 0.11, 0.14]],   // (TV towers at the long right, the sharp right, the left hairpin, the right by the wood, the long left, the esses and the hairpin by the lake)
      colMod: (P) => (x, z, c) => {   // the dry season in the valley: the grass straw-olive with greener patches, the woods' floor darker, the fields brown earth in rows, the paddock trodden
        const n = P.n5(x * 0.4 + 360, z * 0.4), m = P.n3(x * 1.3 + 40, z * 1.3), k = 0.97 + (n - 0.5) * 0.16 + (m - 0.5) * 0.08, dry = sstep(0.3, 0.7, P.n3(x * 0.25 - 90, z * 0.25 + 30));
        c[0] *= k * lerp(1.04, 1.16, dry); c[1] *= k * lerp(0.96, 0.96, dry); c[2] *= k * lerp(0.76, 0.58, dry);
        const wd = nrLCf(x, z, 1), fld = nrLCf(x, z, 2), pad = nrLCf(x, z, 3), row = 0.92 + 0.08 * Math.sin((x * 0.5 - z * 0.4) * 1.9);
        c[0] = lerp(c[0], c[0] * 0.8, wd * 0.5); c[1] = lerp(c[1], c[1] * 0.84, wd * 0.5); c[2] = lerp(c[2], c[2] * 0.8, wd * 0.5);
        c[0] = lerp(c[0], k * 0.74 * row, fld * 0.75); c[1] = lerp(c[1], k * 0.6 * row, fld * 0.75); c[2] = lerp(c[2], k * 0.44 * row, fld * 0.75);
        c[0] = lerp(c[0], k * 0.8, pad * 0.6); c[1] = lerp(c[1], k * 0.74, pad * 0.6); c[2] = lerp(c[2], k * 0.64, pad * 0.6);
        const wt = API.rbSea.d(x, z); if (wt > -12) { const f = sstep(-12, -1, wt) * 0.5; c[0] *= 1 - f * 0.35; c[1] *= 1 - f * 0.22; c[2] *= 1 - f * 0.3; }   // (the wet shore greener and darker)
        c[0] = clamp(c[0], 0, 2); c[1] = clamp(c[1], 0, 2); c[2] = clamp(c[2], 0, 2);
      } },
  });
  World.keep('NR', 'yahuarcocha');   // (its grids kept between its builds; World.build frees the others')
  World.ext.yahuarcocha = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
