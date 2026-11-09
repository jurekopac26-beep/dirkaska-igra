/* =========================================================================
   WORLD — Kågeröd, Švedska (theme 'kagerod'): the circuit in the woods by the Vege å river west of Kågeröd (Skåne), its own parts on the
   shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.kagerod) goes on API.rbLook;
   World.ext.kagerod builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A2), the track: docs/proge/kagerod.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.pad, LK.lane, LK.fl): the woods of Skåne (beech, blocks of Norway spruce,
   birch: js/world.js's nrTreeGeo, js/world-harju.js's hjTreeGeo), the farmland round them in summer; the Vege å (def.sk.river:
   OpenStreetMap) in its bed, brown with the peat of the bogs upstream, alders on its banks, under the circuit twice in culverts (concrete
   headwalls at their mouths); the ground under the whole pit lane level with it, the lane's asphalt all along; the buildings round the
   paddock (def.sk.bld: OpenStreetMap); the Swedish flag and Skåne's among the fans' flags. Only place names on its boards (no names of
   the circuit, of the castle by it, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { Chunks, IChunks, TAU, box, brookMat, clamp, lerp, nrDist, nrGround, nrLC, nrLCf, nrNear, rng, sstep } = API;
  // the text boards: place names (the village, the municipality, the villages and the ridge round the circuit, the river, the region, the
  // country), the grandstands' names (def.stands) and the start line's
  const KG_BAN = [['KÅGERÖD', '#005293', '#fff', '#fecb00'], ['SKÅNE', '#c8102e', '#fff', '#fecb00'], ['START · MÅL', '#16181c', '#fff', '#fecb00'], ['SVERIGE', '#005293', '#fecb00', '#fecb00'],
    ['SVALÖV', '#1d3f6e', '#fff', '#fecb00'], ['RÖSTÅNGA', '#1d3f6e', '#fff', '#c8102e'], ['VEGE Å', '#245a3a', '#fff', '#fff'], ['SÖDERÅSEN', '#245a3a', '#fff', '#fecb00']];
  const KG_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const KG_SHIRTS = [[0.1, 0.34, 0.66], [0.98, 0.8, 0.12], [0.95, 0.95, 0.93], [0.12, 0.18, 0.36], [0.4, 0.42, 0.46], [0.14, 0.14, 0.16], [0.78, 0.1, 0.16], [0.2, 0.48, 0.3],
    [0.3, 0.55, 0.85], [0.92, 0.92, 0.9], [0.56, 0.44, 0.32], [0.86, 0.32, 0.12]];   // the fans' shirts in summer: blue and yellow, white, navy, grey and black, a few red and bright ones
  const nordic = (f, c, u0, u1, v0, v1) => ({ grid: [[0, u0, u1, 1], [0, v0, v1, 1], [[f, c, f], [c, c, c], [f, c, f]]] });   // (a Nordic cross: World.flagMesh's grid, the cross c from u0 to u1 along the flag (0 at the pole) and from v0 to v1 down it, the field f)
  const SE = nordic([0.0, 0.33, 0.6], [1.0, 0.8, 0.05], 5 / 16, 7 / 16, 4 / 10, 6 / 10);   // the Swedish flag: a yellow Nordic cross on blue
  const SC = nordic([0.8, 0.07, 0.15], [1.0, 0.8, 0.05], 5 / 16, 7 / 16, 4 / 10, 6 / 10);   // Skåne's: the yellow cross on red

  // the trees (LK.woods, on the builder's land cover: 0 open, 1 the woods, 2 the fields, 3 built-up): 0 beech (js/world.js's), 1 Norway
  // spruce, 2 silver birch (js/world-harju.js's); 3-5 the plainer ones far from the road. The woods mostly beech, the spruce planted in
  // blocks of their own (the noise), birch at their edges and here and there; lone beeches and birches on the open land and by the buildings
  const KG_WOODS = {
    n: 3, geo: (k) => { const sp = k % 3, far = k >= 3; return sp === 0 ? API.nrTreeGeo(far ? 3 : 1) : API.hjTreeGeo(sp === 1 ? 0 : 2, far); },
    cr: [0.33, 0.26, 0.3], p: [0.014, 0.9, 0.004, 0.025],
    pick(cl, R, far, x, z) {
      const P = API.NR, r = R(), r2 = R(); let sp, h;
      if (cl === 1) { const blk = P.n1(x * 0.6 - 310, z * 0.6 + 140); sp = r < 0.1 ? 2 : blk < 0.34 ? 1 : 0; h = sp === 0 ? 18 + r2 * 8 : sp === 1 ? 17 + r2 * 7 : 12 + r2 * 5; }
      else if (cl === 3) { sp = r < 0.45 ? 2 : 0; h = 8 + r2 * 7; }
      else { sp = r < 0.55 ? 0 : 2; h = 10 + r2 * 8; }
      if (far) h *= 1.08;
      return [sp, h, h * (sp === 0 ? 0.95 + r2 * 0.25 : sp === 1 ? 0.46 + r2 * 0.12 : 0.58 + r2 * 0.2)];
    },
  };

  // the Vege å's bed (LK.pad: the builder's ground round the circuit, before it is built): the terrain lowered along the river's course
  // (def.sk.river), 1.5 m under it, easing out 11 m from it; not inside the barriers (the run-offs, the culverts under the road), fully only
  // 5 m past them. kgRiv: the course's segments in a 16 m hash, the distance to the nearest
  let kgRiv = null;
  function kgRivDist(x, z) {
    const H = kgRiv; let best = 1e9;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = H.get((Math.floor(x / 16) + a) + ',' + (Math.floor(z / 16) + b)); if (!L) continue;
      for (let q = 0; q < L.length; q += 4) { const ax = L[q], az = L[q + 1], dx = L[q + 2] - ax, dz = L[q + 3] - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
        best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } }
    return best;
  }
  function kgPad(pad0) {
    const rv = (API.T.def.sk || {}).river || []; kgRiv = new Map();
    for (let k = 0; k + 3 < rv.length; k += 2) {   // (each segment in every 16 m cell its box touches)
      const ax = rv[k], az = rv[k + 1], bx = rv[k + 2], bz = rv[k + 3];
      for (let i = Math.floor(Math.min(ax, bx) / 16); i <= Math.floor(Math.max(ax, bx) / 16); i++) for (let j = Math.floor(Math.min(az, bz) / 16); j <= Math.floor(Math.max(az, bz) / 16); j++) {
        const key = i + ',' + j; let L = kgRiv.get(key); if (!L) kgRiv.set(key, L = []); L.push(ax, az, bx, bz); } }
    const T = API.T, NRN = API.NRN, pd = T.def.pit, sd = pd && pd[0] < 0 ? -1 : 1;
    return (x, z, h) => {   // (NRN: the nearest road sample of the point being built, its offset and its distance past the barriers: js/world.js nrH)
      h = pad0(x, z, h);
      if (pd && NRN.i >= 0) {   // the ground under the pit lane level with it all along (the builder levels it by the pit building), easing out 10 m past it
        const s = NRN.i * T.ds, p = T.pitAt(s), q = NRN.lat * sd;
        if (p && q > 0) { const f = sstep(p.o + 14, p.o + 4, q); if (f > 0) h = lerp(h, T.elevAt(API.wrapS(s)).y - 0.14, f); }
      }
      if (!kgRiv.size) return h;
      const d = kgRivDist(x, z); if (d >= 11) return h;
      return h - 1.5 * sstep(1, 5, NRN.dd) * sstep(11, 2, d);   // (the river bed: not inside the barriers)
    };
  }

  // the river's water: js/world.js's brookMat, the sky in it darker and weaker (a stream between trees: much of what it mirrors is their green)
  function kgWaterMat(U) {
    const m = brookMat(U), ob = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => { ob(sh, r); sh.fragmentShader = sh.fragmentShader.replace('sky * fr * 0.6', 'mix(sky, vec3(0.14, 0.18, 0.1), 0.65) * fr * 0.36'); };
    m.customProgramCacheKey = () => 'brook1kg';
    return m;
  }

  // the Vege å (def.sk.river: from upstream east of the circuit to downstream north-west, through its two culverts under the circuit): the
  // water brown with peat, level across its bed (a little over its lowest point, eased along the course; the bed's sides cut it into its
  // banks), flowing downstream (js/world.js's brookMat: out.dyn.brook), its banks mud and rank grass; concrete headwalls at the culverts'
  // mouths (where the course goes under the road: within 3 m past its barriers); within 240 m of the road
  function kgRiver({ root, scen, exclPush, excluded, CR, out }, st) {
    const rv = (API.T.def.sk || {}).river || []; if (rv.length < 4) return;
    const pts = [];   // the course resampled every 3 m
    for (let k = 0; k + 3 < rv.length; k += 2) { const ax = rv[k], az = rv[k + 1], bx = rv[k + 2], bz = rv[k + 3], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 3));
      for (let m = 0; m < n; m++) pts.push([ax + (bx - ax) * m / n, az + (bz - az) * m / n]); }
    pts.push([rv[rv.length - 2], rv[rv.length - 1]]);
    const n = pts.length, nrm = pts.map((p, k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
    const bed = pts.map(([x, z], k) => { let m = 1e9; for (const o of [-2, -1, 0, 1, 2]) m = Math.min(m, nrGround(x + nrm[k][0] * o, z + nrm[k][1] * o)); return m; });
    const lvS = bed.map((v, k) => { let s = 0, c = 0; for (let q = Math.max(0, k - 6); q <= Math.min(n - 1, k + 6); q++) { s += bed[q]; c++; } return s / c; });   // (the bed eased along the course)
    const lv = bed.map((v, k) => Math.max(lvS[k], v + 0.1) + 0.25);   // (the water's level: over the bed everywhere)
    const wg = new Chunks(512, true), HW = 3.2, BW = 5.2, mud = [0.27, 0.25, 0.17], rank = [0.33, 0.39, 0.2], tea = [0.32, 0.25, 0.12], deep = [0.12, 0.1, 0.05], conc = [0.6, 0.6, 0.58];
    const under = (x, z) => { const q = nrNear(x, z); return q.i >= 0 && q.dd < 3; }, far = (x, z) => nrDist(x, z) > 240;
    const mouth = []; for (let k = 0; k < n - 1; k++) if (under(pts[k][0], pts[k][1]) !== under(pts[k + 1][0], pts[k + 1][1])) mouth.push(pts[k]);   // (white water by them)
    let dist = 0;
    for (let k = 0; k < n - 1; k++) {
      const [ax, az] = pts[k], [bx, bz] = pts[k + 1], ua = under(ax, az), ub = under(bx, bz), d0 = dist; dist += Math.hypot(bx - ax, bz - az);
      if (far(ax, az) || far(bx, bz)) continue;
      if (ua !== ub) {   // a culvert's mouth: a concrete headwall across the water where the river goes under the road, its wing walls along the banks
        const [cx, cz] = ua ? [bx, bz] : [ax, az], hd = Math.atan2(bz - az, bx - ax), y = Math.min(nrGround(cx, cz), lv[ua ? k + 1 : k]), c = Math.cos(hd), s = Math.sin(hd), g = scen.get(cx, cz);
        box(g, cx, y - 0.8, cz, 0.5, 2.6, HW * 2 + 1.6, hd, conc, [0.68, 0.68, 0.66]);
        for (const sd of [-1, 1]) box(g, cx - s * sd * (HW + 0.6) + c * (ua ? 1.4 : -1.4), y - 0.8, cz + c * sd * (HW + 0.6) + s * (ua ? 1.4 : -1.4), 2.6, 2.0, 0.4, hd, conc, [0.68, 0.68, 0.66]);
        exclPush(cx, cz, 5); CR.avoid(cx, cz, 4); st.culverts++; }
      if (ua || ub) continue;
      const l = Math.hypot(bx - ax, bz - az) || 1, [nax, naz] = nrm[k], [nbx, nbz] = nrm[k + 1];
      const W = (x, z, nx, nz, o, y) => [x + nx * o, y, z + nz * o], Gb = (x, z, nx, nz, o, dy) => { const X = x + nx * o, Z = z + nz * o; return [X, nrGround(X, Z) + dy, Z]; };
      const g = wg.get(ax, az), w0 = W(ax, az, nax, naz, -HW, lv[k]), m0 = W(ax, az, nax, naz, 0, lv[k]), w1 = W(ax, az, nax, naz, HW, lv[k]), w2 = W(bx, bz, nbx, nbz, HW, lv[k + 1]), m1 = W(bx, bz, nbx, nbz, 0, lv[k + 1]), w3 = W(bx, bz, nbx, nbz, -HW, lv[k + 1]);
      const sp = Math.max(clamp((lvS[k] - lvS[k + 1]) / l / 0.06, 0, 1), mouth.some(c => (c[0] - ax) ** 2 + (c[1] - az) ** 2 < 49) ? 0.7 : 0), S2 = 2 * Math.round(sp * 10), d1 = d0 + l;   // (steep, or by a culvert: white water)
      g.quadUp(w0, m0, m1, w3, [tea, deep, deep, tea], [[S2, d0], [S2 + 0.5, d0], [S2 + 0.5, d1], [S2, d1]]); g.quadUp(m0, w1, w2, m1, [deep, tea, tea, deep], [[S2 + 0.5, d0], [S2 + 1, d0], [S2 + 1, d1], [S2 + 0.5, d1]]);   // (paler at the sides, dark in the middle)
      const b = scen.get(ax, az);
      for (const sd of [-1, 1]) b.quadUp(Gb(ax, az, nax, naz, sd * (HW - 0.8), 0.05), Gb(ax, az, nax, naz, sd * BW, 0.05), Gb(bx, bz, nbx, nbz, sd * BW, 0.05), Gb(bx, bz, nbx, nbz, sd * (HW - 0.8), 0.05), [mud, rank, rank, mud]);
      if (k % 2 === 0) exclPush(ax, az, BW + 0.8);   // (no tree in the water)
      CR.block((ax + bx) / 2, (az + bz) / 2, l + 0.4, BW * 2 + 0.6, Math.atan2(bz - az, bx - ax));   // (nobody standing in it)
      st.river += l;
    }
    out.dyn.brook = { uT: { value: 0 } }; wg.addTo(root, kgWaterMat(out.dyn.brook), false, true);   // (World.update makes it flow)
    st.river = Math.round(st.river);
    // alders along its banks where the land is open (the woods have their own trees), in clumps with gaps; within 80 m of the road, not
    // inside its barriers (js/world.js's beech, darker)
    const al = new IChunks(API.nrTreeGeo(1), new THREE.MeshLambertMaterial({ vertexColors: true }), 512), RA = rng(5629);
    for (let k = 2; k < n - 2; k += 3) {
      if (RA() < 0.35) continue;
      const sd = RA() < 0.5 ? -1 : 1, o = sd * (BW + 1.2 + RA() * 2.2), x = pts[k][0] + nrm[k][0] * o, z = pts[k][1] + nrm[k][1] * o, q = nrNear(x, z);
      if (nrDist(x, z) > 80 || nrLC(x, z) === 1 || (q.i >= 0 && q.dd < 4) || excluded(x, z)) continue;
      const h = 9 + RA() * 6, cv = 0.78 + RA() * 0.12;
      al.add(x, nrGround(x, z) - 0.1, z, RA() * TAU, h * (0.72 + RA() * 0.2), h, [cv * 0.92, cv, cv * 0.9]);
      exclPush(x, z, 2.5); CR.avoid(x, z, 2); st.alders++;
    }
    al.addTo(root, true);
  }

  // LK.extra: the river, the buildings round the paddock (OSM outlines as boxes: Falu-red or white weatherboard, a yellow render, grey
  // cladding on the big halls; black, grey or red-tiled roofs); before the crowds and the trees, which keep clear of them
  function kgExtra(o) {
    const { scen, exclPush, CR } = o, sk = API.T.def.sk || {}, R = rng(5623), st = { river: 0, culverts: 0, alders: 0, buildings: 0 };
    kgRiver(o, st);
    const b6 = sk.bld || [], WALL = [[0.55, 0.16, 0.12], [0.92, 0.91, 0.87], [0.86, 0.74, 0.46], [0.7, 0.71, 0.72]], ROOF = [[0.17, 0.17, 0.19], [0.32, 0.33, 0.35], [0.55, 0.22, 0.15]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      const wc = h > 6 ? WALL[3] : WALL[Math.floor(R() * 3)], rc = ROOF[h > 6 ? 1 : Math.floor(R() * 3)];
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, wc, rc, true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    kagerod: { ban: KG_BAN, at: KG_AT, nums: 0, shirts: KG_SHIRTS, smoke: false, camps: 0, seC: [1.1, 1.04, 0.86], gravel: true, noVid: true,
      pitBox: [-55, 75, 1], mow: 0.7,   // (the pit building on the right of the straight; fainter mowing stripes)
      woods: KG_WOODS, extra: kgExtra, pad: kgPad, lane: true, fl: { se: SE, sc: SC }, ck: 2,   // (ck: chunks twice as big: from most places much of the short circuit is in view)
      flags: { stand: [{ se: 0.65, sc: 0.2, tm: 0.15 }, { se: 0.5, sc: 0.2, tm: 0.15, rb: 0.15 }], ga: { se: 0.55, sc: 0.2, tm: 0.15, rb: 0.1 }, camp: { se: 0.7, sc: 0.3 }, pole: 'se', podium: 'se' },
      vid: [], poles: [-100, 100, -1], runoff: ['KÅGERÖD', 'SKÅNE', 'SVERIGE'], straight: [-150, 120, -1],
      farm: { wall: [0.94, 0.93, 0.88], roof: [0.55, 0.22, 0.15], end: [0.93, 0.92, 0.87], barn: [0.55, 0.15, 0.12], barnRoof: [0.2, 0.2, 0.22], barnEnd: [0.53, 0.15, 0.12] },   // a white farmhouse under red tiles, a Falu-red barn under a dark roof
      tvSkip: [1, 3, 4, 6, 8, 9, 10], recov: [0, 5], photo: [0, 5, 7, 11], jets: [[0.1, 0.4, 0.85], [1, 0.82, 0.1], [0.1, 0.4, 0.85]],   // (TV towers at the double right, the long right, the hairpin, the right over the river and the last corner)
      colMod: (P) => (x, z, c) => {   // Skåne in summer: the meadows lush, in lighter and darker patches, buttercups and cow parsley; the farmland's crops
        const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.92 + (n - 0.5) * 0.2 + (m - 0.5) * 0.1;
        c[0] *= k * 0.98; c[1] *= k * 1.01; c[2] *= k * 0.95;
        { const fm = nrLCf(x, z, 0), yf = sstep(0.58, 0.78, P.n3(x * 0.9 + 90, z * 0.9 - 40)) * 0.6 * fm, wf = sstep(0.62, 0.82, P.n1(x * 1.3 - 210, z * 1.3 + 75)) * 0.4 * fm;
          c[0] = lerp(c[0], c[0] * 1.3 + 0.08, yf); c[1] = lerp(c[1], c[1] * 1.12 + 0.04, yf); c[2] = lerp(c[2], c[2] * 0.6, yf);
          c[0] = lerp(c[0], c[0] * 1.15 + 0.12, wf); c[1] = lerp(c[1], c[1] * 1.05 + 0.1, wf); c[2] = lerp(c[2], c[2] * 1.2 + 0.14, wf); }
        const f = nrLCf(x, z, 2);   // the fields: sugar beet dark green, wheat golden, barley paler, a field ploughed
        if (f > 0) { const crop = P.n1(x * 0.3 + 1200, z * 0.3), col = crop < 0.38 ? [0.58, 0.88, 0.46] : crop < 0.62 ? [1.52, 1.12, 0.52] : crop < 0.8 ? [1.3, 1.04, 0.68] : [1.06, 0.84, 0.66];
          c[0] = lerp(c[0], col[0], f * 0.85); c[1] = lerp(c[1], col[1], f * 0.85); c[2] = lerp(c[2], col[2], f * 0.85); }
      } },
  });
  World.keep('NR', 'kagerod');   // (its grids kept between its builds; World.build frees the others')
  World.ext.kagerod = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
