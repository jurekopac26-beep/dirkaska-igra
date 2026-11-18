/* =========================================================================
   WORLD — Pembrey, Wales (theme 'pembrey'): the circuit on the old airfield by the village of Pembrey on Carmarthen Bay (Carmarthenshire),
   its own parts on the shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.pembrey)
   goes on API.rbLook; World.ext.pembrey builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A4), the track: docs/proge/pembrey.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.pad, LK.lane, LK.fl): the pine plantations of the coast (Corsican pine in
   blocks, birch at their edges: js/world-harju.js's hjTreeGeo), gorse in yellow flower in clumps on the rough grass of the old airfield;
   the ground under the whole pit lane level with it; the buildings round the paddock and the marshals' huts round the lap (def.sk.bld:
   OpenStreetMap); the hills of Carmarthenshire and the Gower across the estuary on the horizon (def.far: Riverside's rsFar, Marrakesh's
   too); the Welsh flag among the fans' flags (World.flagMesh's grid); no air show (LK.air false: a club circuit). Only place names on its
   boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { IChunks, TAU, box, lerp, nrDist, nrGround, nrLC, nrLCf, nrNear, rng, sstep } = API;
  // the text boards: place names (the village in English and in Welsh, the country in both, the town and the harbour village by it, the
  // county in Welsh), the grandstands' names (def.stands) and the start line's
  const PE_BAN = [['PEMBREY', '#00843d', '#fff', '#d30731'], ['CYMRU', '#d30731', '#fff', '#fff'], ['START · FINISH', '#16181c', '#fff', '#d30731'], ['WALES', '#00843d', '#fff', '#fff'],
    ['PEN-BRE', '#1d3f6e', '#fff', '#d30731'], ['BURRY PORT', '#1d3f6e', '#fff', '#00843d'], ['LLANELLI', '#245a3a', '#fff', '#fff'], ['SIR GÂR', '#245a3a', '#fff', '#d30731']];
  const PE_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const PE_SHIRTS = [[0.84, 0.06, 0.16], [0.95, 0.95, 0.93], [0.0, 0.5, 0.25], [0.12, 0.14, 0.2], [0.4, 0.42, 0.46], [0.14, 0.14, 0.16], [0.84, 0.06, 0.16], [0.2, 0.3, 0.5],
    [0.98, 0.82, 0.12], [0.9, 0.9, 0.88], [0.5, 0.42, 0.32], [0.3, 0.5, 0.75]];   // the fans' shirts: the national red, white and green, navy, grey and black, a daffodil yellow, a few others
  const WL = ((w, g, r) => ({ grid: [[0, 0.24, 0.76, 1], [0, 0.2, 0.5, 0.84, 1], [[w, w, w], [w, r, w], [g, r, g], [g, g, g]]] }))([0.96, 0.96, 0.95], [0.0, 0.6, 0.29], [0.83, 0.04, 0.13]);   // the Welsh flag: white over green, the red dragon across both (World.flagMesh's grid, twelve cells)

  // the trees (LK.woods, on the builder's land cover: 0 open, 1 the woods, 2 the fields, 3 built-up): 0 pine (the Corsican pines of the
  // coast's plantations: js/world-harju.js's pine, taller and darker), 1 silver birch; 2-3 the plainer ones far from the road. The woods
  // nearly all pine, birch at their edges; on the open land of the airfield lone birches and low wind-bent pines, birches by the buildings
  const PE_WOODS = {
    n: 2, geo: (k) => API.hjTreeGeo([1, 2][k % 2], k >= 2),
    cr: [0.28, 0.3], p: [0.012, 0.9, 0.004, 0.02],
    pick(cl, R, far, x, z) {
      const r = R(), r2 = R(); let sp, h;
      if (cl === 1) { sp = r < 0.1 ? 1 : 0; h = sp === 0 ? 15 + r2 * 7 : 11 + r2 * 5; }
      else if (cl === 3) { sp = r < 0.75 ? 1 : 0; h = 7 + r2 * 6; }
      else { sp = r < 0.55 ? 1 : 0; h = sp === 0 ? 6 + r2 * 6 : 8 + r2 * 6; }   // (on the open land the wind off the bay keeps them low)
      if (far) h *= 1.08;
      return [sp, h, h * (sp === 0 ? 0.58 + r2 * 0.22 : 0.56 + r2 * 0.2)];
    },
  };

  // LK.pad: the ground under the whole pit lane level with it (the builder levels it by the pit building), easing out 10 m past it
  function pePad(pad0) {
    const T = API.T, NRN = API.NRN, pd = T.def.pit, sd = pd && pd[0] < 0 ? -1 : 1;
    return (x, z, h) => {   // (NRN: the nearest road sample of the point being built, its offset and its distance past the barriers: js/world.js nrH)
      h = pad0(x, z, h);
      if (pd && NRN.i >= 0) {
        const s = NRN.i * T.ds, p = T.pitAt(s), q = NRN.lat * sd;
        if (p && q > 0) { const f = sstep(p.o + 14, p.o + 4, q); if (f > 0) h = lerp(h, T.elevAt(API.wrapS(s)).y - 0.14, f); }
      }
      return h;
    };
  }

  // gorse: a low round bush (an icosahedron squashed, its foot in the ground), dark green, yellow with flowers in spring and summer; one
  // instanced mesh per 512 m (IChunks), on the open grass of the old airfield in clumps (the noise), 12-58 m past the barriers, not by the
  // pit lane, the buildings, the stands
  function peBushGeo() {
    const g = new THREE.IcosahedronGeometry(0.5, 0).toNonIndexed(), p = g.attributes.position, c = [], R = rng(6023);
    for (let k = 0; k < p.count; k++) p.setY(k, Math.max(-0.1, p.getY(k)) + 0.4);
    for (let k = 0; k < p.count; k += 3) { const top = p.getY(k) + p.getY(k + 1) + p.getY(k + 2) > 1.5, fl = top && R() < 0.4, v = 0.8 + R() * 0.35;   // (the flowers on a few faces on top, among the spines)
      const col = fl ? [0.66 * v, 0.6 * v, 0.1] : [0.17 * v, 0.27 * v, 0.1 * v];
      for (let q = 0; q < 3; q++) c.push(col[0], col[1], col[2]); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); g.computeVertexNormals(); return g;
  }
  function peGorse({ root, excluded, exclPush, CR }, st) {
    const T = API.T, P = API.NR, pd = T.def.pit, PSD = pd && pd[0] < 0 ? -1 : 1, R = rng(6029);
    const ic = new IChunks(peBushGeo(), new THREE.MeshLambertMaterial({ vertexColors: true }), 512);
    for (let s = 0; s < T.len; s += 4.5) {
      const i = T.idx(s);
      for (const sd of [-1, 1]) {
        if (sd === PSD && pd && T.pitAt(s)) continue;
        const o = (sd > 0 ? T.br[i] : T.bl[i]) + 12 + R() * 46, x0 = T.px[i] + T.nx[i] * sd * o, z0 = T.pz[i] + T.nz[i] * sd * o;
        const cl = sstep(0.55, 0.7, P.n4(x0, z0) * 0.6 + P.n3(x0 + 77, z0 - 31) * 0.4); if (R() > cl) continue;
        for (let b = 0, nb = 2 + Math.floor(R() * 3); b < nb; b++) {   // (a clump: two to four bushes grown together)
          const x = x0 + (R() - 0.5) * 5, z = z0 + (R() - 0.5) * 5, q = nrNear(x, z); if (q.i >= 0 && q.dd < 10) continue;
          if (nrLC(x, z) !== 0 || nrDist(x, z) > 64 || excluded(x, z)) continue;
          const w = 1.7 + R() * 1.3, h = 0.9 + R() * 0.6, cv = 0.88 + R() * 0.2;
          ic.add(x, nrGround(x, z) - 0.15, z, R() * TAU, w, h * 1.6, [cv, cv, cv * 0.95]);
          exclPush(x, z, w * 0.5 + 0.5); CR.avoid(x, z, w * 0.5); st.gorse++;
        }
      }
    }
    ic.addTo(root, true);
  }

  // the horizon (def.far, Riverside's rsFar): the land's colours by height (the sea's grey-blue, the pasture of the coastal flats, the
  // moorland and the conifers of the hills), in the haze off the bay
  const peFarCol = (h, d) => {
    const c = h < 1.5 ? [0.38, 0.47, 0.52] : h < 50 ? [0.3, 0.42, 0.24] : h < 130 ? [0.28, 0.37, 0.22] : [0.4, 0.4, 0.27], f = (1 - Math.exp(-d / 24000)) * 0.85;
    return c.map((v, k) => lerp(v, [0.72, 0.77, 0.83][k], f));
  };

  // LK.extra: the gorse, the buildings round the paddock and by the pits (OSM outlines as boxes: white or grey render under dark slate,
  // the hall in green-grey cladding; the marshals' huts round the lap, white with a band of windows under a flat roof), the horizon;
  // before the crowds and the trees, which keep clear of them
  function peExtra(o) {
    const { scen, exclPush, CR, root, out } = o, T = API.T, sk = T.def.sk || {}, R = rng(6011), st = { gorse: 0, buildings: 0, huts: 0, far: 0 };
    const b7 = sk.bld || [], WALL = [[0.93, 0.93, 0.9], [0.8, 0.8, 0.78], [0.88, 0.86, 0.8]], ROOF = [[0.27, 0.28, 0.31], [0.36, 0.37, 0.39]];
    for (let k = 0; k < b7.length; k += 7) {
      const [x, z, L, W, deg, h, kind] = b7.slice(k, k + 7), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot), g = scen.get(x, z);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      if (kind === 4) {   // a marshals' hut: white walls, a band of windows all round, a flat roof with a lip
        const Lh = Math.max(L, 2.4), Wh = Math.max(W, 2.2);
        box(g, x, y - 0.3, z, Lh, h + 0.3, Wh, rot, [0.93, 0.93, 0.91], [0.32, 0.33, 0.35], true);
        box(g, x, y + h * 0.5, z, Lh + 0.04, 0.8, Wh + 0.04, rot, [0.22, 0.28, 0.34]);
        box(g, x, y + h, z, Lh + 0.4, 0.16, Wh + 0.4, rot, [0.86, 0.38, 0.1], [0.3, 0.3, 0.32]);
        exclPush(x, z, Math.hypot(Lh, Wh) / 2 + 1.5); CR.avoid(x, z, Math.hypot(Lh, Wh) / 2 + 0.5); st.huts++; continue;
      }
      const wc = kind === 5 ? [0.56, 0.6, 0.56] : WALL[Math.floor(R() * 3)], rc = kind === 5 ? [0.4, 0.43, 0.42] : ROOF[Math.floor(R() * 2)];
      box(g, x, y - 0.4, z, L, h + 0.4, W, rot, wc, rc, true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    peGorse(o, st);
    if (T.def.far && API.rsFar) { out.dyn.far = API.rsFar(root, T.def.far, 'summer', 6, peFarCol); st.far = 1; }   // (World.update: no car, back where it was built)
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    pembrey: { ban: PE_BAN, at: PE_AT, nums: 0, shirts: PE_SHIRTS, smoke: false, camps: 0, seC: [1.06, 1.04, 0.9], gravel: true, noVid: true,
      pitBox: [-140, -10, 1], mow: 0.6,   // (the garages on the right of the straight; fainter mowing stripes)
      woods: PE_WOODS, extra: peExtra, pad: pePad, lane: true, fl: { wl: WL }, ck: 2, air: false,   // (ck: chunks twice as big: from most places much of the short circuit is in view)
      flags: { stand: [{ wl: 0.7, tm: 0.2, rb: 0.1 }, { wl: 0.6, tm: 0.25, rb: 0.15 }], ga: { wl: 0.65, tm: 0.25, rb: 0.1 }, camp: { wl: 0.8, tm: 0.2 }, pole: 'wl', podium: 'wl' },
      vid: [], poles: [-100, 100, -1], runoff: ['PEMBREY', 'CYMRU', 'WALES'], straight: [-150, 120, -1],
      farm: { wall: [0.93, 0.92, 0.88], roof: [0.26, 0.27, 0.3], end: [0.92, 0.91, 0.87], barn: [0.52, 0.54, 0.52], barnRoof: [0.3, 0.33, 0.31], barnEnd: [0.52, 0.54, 0.52] },   // a white farmhouse under slate, a grey barn under dark sheeting
      tvSkip: [1, 3, 4, 6, 8], recov: [0, 5], photo: [0, 5, 9], jets: [[0.83, 0.04, 0.13], [0.95, 0.95, 0.95], [0.0, 0.6, 0.29]],   // (TV towers at the north hairpin, the long left, the east hairpin, the right by the woods and the long right)
      colMod: (P) => (x, z, c) => {   // the coast in summer: the grass lush and damp, in lighter and darker patches, dry and sandy here and there, rushes in the wet hollows; the old aprons weathered
        const n = P.n5(x * 0.55 - 410, z * 0.55 + 260), m = P.n3(x * 1.6 + 90, z * 1.6), k = 0.93 + (n - 0.5) * 0.2 + (m - 0.5) * 0.1;
        c[0] *= k * 0.96; c[1] *= k * 1.03; c[2] *= k * 0.95;
        { const fm = nrLCf(x, z, 0), dry = sstep(0.6, 0.82, P.n3(x * 0.8 + 340, z * 0.8 - 120)) * 0.45 * fm, wet = sstep(0.64, 0.84, P.n1(x * 1.2 - 60, z * 1.2 + 230)) * 0.4 * fm;
          c[0] = lerp(c[0], c[0] * 1.25 + 0.06, dry); c[1] = lerp(c[1], c[1] * 1.1 + 0.03, dry); c[2] = lerp(c[2], c[2] * 0.85 + 0.02, dry);
          c[0] = lerp(c[0], c[0] * 0.8, wet); c[1] = lerp(c[1], c[1] * 0.9, wet); c[2] = lerp(c[2], c[2] * 0.75, wet); }
        const f = nrLCf(x, z, 2);   // the fields: pasture, a silage field cut paler
        if (f > 0) { const cut = sstep(0.55, 0.7, P.n1(x * 0.3 + 900, z * 0.3)), col = cut > 0.5 ? [1.12, 1.1, 0.7] : [0.86, 1.04, 0.74];
          c[0] = lerp(c[0], c[0] * col[0], f * 0.8); c[1] = lerp(c[1], c[1] * col[1], f * 0.8); c[2] = lerp(c[2], c[2] * col[2], f * 0.8); }
        const a = nrLCf(x, z, 3);   // the paddock and the old aprons: the concrete grey through the grass
        if (a > 0) { const g = 0.5 + (m - 0.5) * 0.1; c[0] = lerp(c[0], g, a * 0.55); c[1] = lerp(c[1], g, a * 0.55); c[2] = lerp(c[2], g * 0.97, a * 0.55); }
      } },
  });
  World.keep('NR', 'pembrey');   // (its grids kept between its builds; World.build frees the others')
  World.ext.pembrey = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
