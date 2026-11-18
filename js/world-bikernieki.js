/* =========================================================================
   WORLD — Biķernieki, Latvija (theme 'bikernieki'): the circuit in the Biķernieki forest park on the east side of Riga, its own parts on
   the shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.bikernieki) goes on
   API.rbLook; World.ext.bikernieki builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A6), the track: docs/proge/bikernieki.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.pad, LK.fl): the pine woods on the old dunes (Scots pine, a block of Norway
   spruce here and there, birch: js/world-harju.js's hjTreeGeo), sandy patches on the open land; the lake Linezers and the ponds round
   the circuit (def.sk.lakes: OpenStreetMap) as still water in their dug beds, their shallows and the foam at the waterline (World's
   waterMat, shoreBand), the reedbeds on the lake's shore (def.sk.reeds: OpenStreetMap) and reeds along it by the road; the buildings
   by the circuit (def.sk.bld: OpenStreetMap); the Latvian flag among the fans' flags. Only place names on its boards (no names of the
   circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, NRC, TAU, addShore, box, clamp, cone, inPoly, lerp, mergeBands, nrDem, nrGH, nrGround, nrLCf, nrNear, polyDist, rng, shoreBand, sstep, vary, waterMat, waterline } = API;
  // the text boards: place names (the forest park, the city, the country, the districts round the park, the lake, the region), the
  // grandstands' names (def.stands) and the start line's
  const BK_BAN = [['BIĶERNIEKI', '#9e3039', '#fff', '#fff'], ['RĪGA', '#1d3f6e', '#fff', '#9e3039'], ['STARTS · FINIŠS', '#16181c', '#fff', '#9e3039'], ['LATVIJA', '#9e3039', '#fff', '#fff'],
    ['MEŽCIEMS', '#245a3a', '#fff', '#fff'], ['PURVCIEMS', '#1d3f6e', '#fff', '#fff'], ['LINEZERS', '#245a3a', '#fff', '#9e3039'], ['VIDZEME', '#3a3f46', '#fff', '#9e3039']];
  const BK_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const BK_SHIRTS = [[0.62, 0.19, 0.22], [0.95, 0.95, 0.93], [0.12, 0.18, 0.36], [0.4, 0.42, 0.46], [0.14, 0.14, 0.16], [0.2, 0.48, 0.3], [0.3, 0.55, 0.85], [0.92, 0.92, 0.9],
    [0.56, 0.44, 0.32], [0.86, 0.32, 0.12], [0.98, 0.8, 0.12], [0.7, 0.12, 0.16]];   // the fans' shirts in summer: carmine and white, navy, grey and black, a few green, blue and bright ones
  const LV = [[0.62, 0.19, 0.22], [0.62, 0.19, 0.22], [0.95, 0.95, 0.94], [0.62, 0.19, 0.22], [0.62, 0.19, 0.22]];   // the Latvian flag: carmine, a white band, carmine (2 : 1 : 2)

  // the trees (LK.woods, on the builder's land cover: 0 open, 1 the woods, 2 the lakes and the reeds, 3 built-up): 0 Norway spruce, 1 Scots
  // pine, 2 silver birch (js/world-harju.js's); 3-5 the plainer ones far from the road. The woods tall old pines on the dunes, spruce in
  // blocks of their own (the noise), birch among them; birches and young pines on the open land and by the buildings; none in the water
  const BK_WOODS = {
    n: 3, geo: (k) => API.hjTreeGeo(k % 3, k >= 3), cr: [0.26, 0.33, 0.3], p: [0.014, 0.9, 0, 0.03],
    pick(cl, R, far, x, z) {
      const P = API.NR, r = R(), r2 = R(); let sp, h;
      if (cl === 1) { const blk = P.n1(x * 0.6 + 520, z * 0.6 - 180); sp = r < 0.18 ? 2 : blk < 0.3 ? 0 : 1; h = sp === 0 ? 16 + r2 * 7 : sp === 1 ? 19 + r2 * 8 : 13 + r2 * 5; }
      else if (cl === 3) { sp = r < 0.55 ? 2 : 1; h = 8 + r2 * 6; }
      else { sp = r < 0.5 ? 2 : 1; h = 9 + r2 * 7; }
      if (far) h *= 1.08;
      return [sp, h, h * (sp === 0 ? 0.46 + r2 * 0.12 : sp === 1 ? 0.5 + r2 * 0.18 : 0.58 + r2 * 0.2)];
    },
  };

  // the lakes (def.sk.lakes: [name, x, z, ...]) per build: the outline, its box, the water's level: a little under the ground round its
  // shore (the lowest quarter of the terrain model there), under the road by it (0.9 m below the road within 40 m)
  let BKL = [];
  function bkLakes() {
    const T = API.T, out = [];
    for (const L of (T.def.sk || {}).lakes || []) {
      const poly = []; for (let k = 1; k + 1 < L.length; k += 2) poly.push([L[k], L[k + 1]]);
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      const hs = poly.map(([x, z]) => nrDem(x, z)).sort((a, b) => a - b); let lvl = hs[Math.floor(hs.length / 4)] - 0.3;
      for (let i = 0; i < T.N; i++) { const x = T.px[i], z = T.pz[i]; if (x > x0 - 50 && x < x1 + 50 && z > z0 - 50 && z < z1 + 50 && polyDist(poly, x, z) < 40) lvl = Math.min(lvl, T.hy[i] - 0.9); }
      out.push({ name: L[0], poly, b: [x0, x1, z0, z1], lvl });
    }
    return out;
  }
  // LK.pad (the builder's ground round the circuit, before it is built): the lakes' beds dug and the land kept above the water, both on one
  // even slope through the shore (0.1 m per metre from the outline: the terrain's 10 m cells then cut the water along the outline, not in
  // steps along the cells), the bed shelving on to 2 m, the land back to its own height within 10 m; not inside the barriers, fully only
  // 6 m past them
  function bkPad(pad0) {
    BKL = bkLakes();
    const NRN = API.NRN;
    return (x, z, h) => {   // (NRN: the nearest road sample of the point being built, its offset and its distance past the barriers: js/world.js nrH)
      h = pad0(x, z, h);
      for (const L of BKL) {
        const b = L.b; if (x < b[0] - 8 || x > b[1] + 8 || z < b[2] - 8 || z > b[3] + 8) continue;
        const d = polyDist(L.poly, x, z), f = sstep(1, 6, NRN.dd);
        if (inPoly(L.poly, x, z)) return lerp(h, Math.min(h, L.lvl - Math.min(2, 0.1 * d + 0.02 * d * d)), f);
        if (d < 10) { const t = L.lvl + 0.1 * d; return lerp(h, lerp(t, Math.max(h, t), sstep(0, 10, d)), f); }
      }
      return h;
    };
  }

  // the water: flat at each lake's level (World's waterMat: a lake among trees, wavelets, the sky mirrored, darker near the land round
  // it), a shore band round each (the shallows, the foam at the waterline: where the terrain meets the water); nothing stands in it
  function bkWater({ root, tex, exclPush, CR, out }, st) {
    if (!BKL.length) return;
    const G = API.NR.G, gw = new GB(true), wc = [1, 1, 1], bands = [], gi = (v, o, n) => clamp(Math.floor((v - o) / NRC), 0, n - 1);
    for (const L of BKL) {
      const y = L.lvl, Q = (p) => [p[0], y, p[1]], uv = (p) => [p[0] / 16, -p[1] / 16];
      for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(L.poly.map(p => new THREE.Vector2(p[0], p[1])), [])) {
        const A = L.poly[a], B = L.poly[b], C = L.poly[c]; gw.triO(Q(A), Q(B), Q(C), wc, [A[0], y - 5, A[1]], wc, wc, uv(A), uv(B), uv(C)); }
      const [x0, x1, z0, z1] = L.b;
      for (let z = z0 + 6; z < z1; z += 12) for (let x = x0 + 6; x < x1; x += 12) if (inPoly(L.poly, x, z) && polyDist(L.poly, x, z) > 4) { exclPush(x, z, 9); CR.avoid(x, z, 8); }   // (no tree, nobody in it)
      for (const [x, z] of L.poly) exclPush(x, z, 2);
      const wl = waterline(nrGH, G.x0, G.z0, NRC, gi(x0 - 14, G.x0, G.nx), gi(x1 + 22, G.x0, G.nx), gi(z0 - 14, G.z0, G.nz), gi(z1 + 22, G.z0, G.nz), y);   // (where the terrain meets the water)
      const sd = (x, z) => { const d = polyDist(L.poly, x, z); return Math.min(inPoly(L.poly, x, z) ? d : -d, wl(x, z)); };
      bands.push(shoreBand(x0 - 6, z0 - 6, x1 + 6, z1 + 6, y + 0.015, sd, 16));
      st.lakes++;
    }
    const WO = { len: 0.9, amp: 0.6, refl: 0.5, land: 0.8, shal: 0.5, lap: 0.5, surf: 0 }, wm = new THREE.Mesh(gw.geometry(), waterMat(tex, Object.assign({ color: 0x56707a }, WO)));
    wm.receiveShadow = true; wm.matrixAutoUpdate = false; wm.updateMatrix(); root.add(wm); out.dyn.water = tex.water;
    addShore(root, mergeBands(bands), wm.material, WO);
  }

  // the reeds: tufts of stems (green, the tips paler) on a 3 m grid in the reedbeds (def.sk.reeds: OSM), and along the named lake's shore
  // within 90 m of the road, at the waterline every 5-10 m in stretches with gaps; not inside the barriers
  function bkReeds({ scen, exclPush }, st) {
    const T = API.T, R = rng(5741), C = [[0.34, 0.45, 0.17], [0.4, 0.48, 0.2], [0.48, 0.5, 0.25]], tip = [0.66, 0.6, 0.4];
    const near = (x, z) => { const q = nrNear(x, z); return q.i >= 0 && q.dd < 2; }, far = (x, z) => { const i = T.nearestIdx(x, z); return Math.hypot(x - T.px[i], z - T.pz[i]) > 90; };
    const clump = (x, z, y) => {
      const g = scen.get(x, z), col = C[Math.floor(R() * 3)];
      for (let q = 0, n = 3 + Math.floor(R() * 3); q < n; q++) { const a = R() * TAU, d = R() * 1.2; cone(g, x + Math.cos(a) * d, y - 0.25, z + Math.sin(a) * d, 0.2 + R() * 0.14, 1.4 + R() * 1.0, 3, vary(col, R, 0.12), tip, R() * TAU); }   // (tufts, not single stems: seen from the chase camera)
      exclPush(x, z, 1.6); st.reeds++;
    };
    const lvlAt = (x, z) => { let L = null, bd = 1e9; for (const Lk of BKL) { const d = polyDist(Lk.poly, x, z); if (d < bd) { bd = d; L = Lk; } } return L ? L.lvl : -1e9; };
    for (const r of (T.def.sk || {}).reeds || []) {
      const poly = []; for (let k = 0; k + 1 < r.length; k += 2) poly.push([r[k], r[k + 1]]);
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let z = z0; z <= z1; z += 3) for (let x = x0; x <= x1; x += 3) {
        const px = x + (R() - 0.5) * 2.4, pz = z + (R() - 0.5) * 2.4; if (!inPoly(poly, px, pz) || near(px, pz) || far(px, pz)) continue;
        clump(px, pz, Math.max(nrGround(px, pz), lvlAt(px, pz) - 0.3)); }
    }
    for (const L of BKL) {
      if (!L.name) continue;
      const n = L.poly.length;
      for (let k = 0; k < n; k++) {
        const [ax, az] = L.poly[k], [bx, bz] = L.poly[(k + 1) % n], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
        let px = -(bz - az) / len, pz = (bx - ax) / len; if (!inPoly(L.poly, (ax + bx) / 2 + px * 1.5, (az + bz) / 2 + pz * 1.5)) { px = -px; pz = -pz; }   // (towards the water)
        for (let t = R() * 5; t < len; t += 5 + R() * 5) {
          if (R() < 0.3) continue;
          const u = t / len, o = 0.4 + R() * 1.2, x = lerp(ax, bx, u) + px * o, z = lerp(az, bz, u) + pz * o;
          if (near(x, z) || far(x, z)) continue;
          clump(x, z, L.lvl);
        }
      }
    }
  }

  // LK.extra: the lakes, the reeds, the buildings by the circuit (OSM outlines as boxes: white or grey render, yellow brick, grey cladding
  // on the big halls; flat roofs, dark or grey); before the crowds and the trees, which keep clear of them
  function bkExtra(o) {
    const { scen, exclPush, CR } = o, sk = API.T.def.sk || {}, R = rng(5737), st = { lakes: 0, reeds: 0, buildings: 0 };
    bkWater(o, st); bkReeds(o, st);
    const b6 = sk.bld || [], WALL = [[0.9, 0.89, 0.85], [0.78, 0.78, 0.76], [0.84, 0.74, 0.52], [0.7, 0.71, 0.72]], ROOF = [[0.24, 0.25, 0.27], [0.4, 0.41, 0.43], [0.32, 0.3, 0.28]];
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
    bikernieki: { ban: BK_BAN, at: BK_AT, nums: 0, shirts: BK_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.08, 1.04, 0.9], gravel: true, noVid: true,
      pitBox: [-55, 75, -1], mow: 0.6,   // (the pit building on the left of the straight; fainter mowing stripes; no farms in the city's forest park)
      woods: BK_WOODS, extra: bkExtra, pad: bkPad, lane: true, fl: { lv: LV }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      flags: { stand: [{ lv: 0.75, tm: 0.25 }, { lv: 0.6, tm: 0.25, rb: 0.15 }], ga: { lv: 0.65, tm: 0.25, rb: 0.1 }, camp: { lv: 0.8, tm: 0.2 }, pole: 'lv', podium: 'lv' },
      vid: [], poles: [-100, 100, 1], runoff: ['BIĶERNIEKI', 'RĪGA', 'LATVIJA'], straight: [-150, 120, 1],
      farm: { wall: [0.9, 0.88, 0.82], roof: [0.3, 0.31, 0.33], end: [0.88, 0.86, 0.8], barn: [0.5, 0.4, 0.3], barnRoof: [0.3, 0.31, 0.33], barnEnd: [0.48, 0.38, 0.28] },
      tvSkip: [0, 2, 3, 4, 8, 9, 11], recov: [1, 6], photo: [1, 5, 7, 10], jets: [[0.62, 0.19, 0.22], [0.97, 0.97, 0.97], [0.62, 0.19, 0.22]],   // (TV towers at the hairpin, the left by the lake, the west and the north corners, the right before the straight)
      colMod: (P) => (x, z, c) => {   // Riga in early summer: the lawns lush, in lighter and darker patches, the sand of the old dunes showing through the thin grass here and there
        const n = P.n5(x * 0.55 + 300, z * 0.55), m = P.n3(x * 1.6 + 800, z * 1.6), k = 0.93 + (n - 0.5) * 0.18 + (m - 0.5) * 0.1;
        c[0] *= k * 0.99; c[1] *= k * 1.01; c[2] *= k * 0.94;
        { const fm = nrLCf(x, z, 0), sa = sstep(0.64, 0.84, P.n3(x * 0.8 - 130, z * 0.8 + 60)) * 0.5 * fm;   // (the sand)
          c[0] = lerp(c[0], 1.32 + 0.08 * m, sa); c[1] = lerp(c[1], 1.16 + 0.06 * m, sa); c[2] = lerp(c[2], 0.86 + 0.05 * m, sa); }
        const w = nrLCf(x, z, 2);   // (the lakes' margins and the reedbeds: dark, wet, rank grass)
        if (w > 0) { c[0] = lerp(c[0], 0.74, w * 0.7); c[1] = lerp(c[1], 0.86, w * 0.7); c[2] = lerp(c[2], 0.56, w * 0.7); }
      } },
  });
  World.keep('NR', 'bikernieki');   // (its grids kept between its builds; World.build frees the others')
  World.ext.bikernieki = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
