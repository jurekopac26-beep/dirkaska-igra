/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the tenth group of the real tracks: Hakone (its own builder calls
   World.ext.hakoneRob after its plants, as Spa's World.ext.spaRob: js/world-chase-bt9.js). What is added goes into meshes of its own
   (the sixth group's softScen: 256 m chunks that cast no shadow and that the animals' and the people's tests of a free place leave out),
   so only Hakone changes. What stands where follows docs/proge/hakone.md. Nothing here is driven on: all of it is behind the barrier
   line, off what the build keeps clear (its excluded places, the villages' plots, the railway's bed, the water); the terrain, the road,
   the barriers and the trees stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, sstep } = API;
  if (!BT || !BT.walk) return;
  const { walk, tuft, cushion, soil, softScen, mix3 } = BT;
  World.ext = World.ext || {};
  const hh = (i, j) => { const t = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return t - Math.floor(t); };
  const vn = (x, z) => { const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);   // (a smooth value noise of its own)
    return (hh(i, j) * (1 - a) + hh(i + 1, j) * a) * (1 - b) + (hh(i, j + 1) * (1 - a) + hh(i + 1, j + 1) * a) * b; };

  /* Hakone: docs/proge/hakone.md: »listavci, manj kriptomerij … ob cesti nizek bambus sasa … travniki«; the build's ground colours
     (js/world-hakone.js hkCol): »under the forest by the road its dark floor of ferns and sasa … early summer's fresh grass, in autumn
     straw and pampas gold«. From the camera behind the car that floor and those meadows were one smooth colour between the sparse
     sasa clumps. So at the forest's edge and under it the ferns and the sasa stand in low clumps on the dark leaf litter, on the open
     verges the uncut grass stands at the barrier's foot, and farther out on the meadows the pampas grass (susuki) in loose groups,
     gold-plumed in autumn. */
  World.ext.hakoneRob = (ctx) => {
    const { vrLC, vrGround: gH, vrSlope, vrNear, vrWater } = API, st = { praprot: 0, sasa: 0, listje: 0, sopi: 0, susuki: 0 };
    if (!vrLC || !gH || !vrNear || !API.T) return st;
    const { excluded, railD, root, matV, summer } = ctx, soft = softScen(root, matV);
    const bad = (x, z) => excluded(x, z) || (railD && railD(x, z) < 3.2) || (vrWater && vrWater(x, z).e > -1);
    const env = { near: vrNear, excluded: bad };
    const f = (x, z, ox, oz, sc) => 0.5 + 0.5 * sstep(0.3, 0.7, vn((x + ox) / sc, (z + oz) / sc));   // (in loose groups, not an even carpet)
    const wood = (x, z) => { let a = 0; for (const [u, v] of [[12, 0], [-12, 0], [0, 12], [0, -12], [9, 9], [-9, -9], [9, -9], [-9, 9]]) if (vrLC(x + u, z + v) === 1) a++; return a / 8; };
    const FERN = summer ? [0.3, 0.52, 0.14] : [0.56, 0.4, 0.17], SASA = summer ? [0.27, 0.46, 0.15] : [0.3, 0.44, 0.17];   // (sasa: green the year round; the ferns rust in autumn)
    const LIT = summer ? [0.25, 0.21, 0.13] : [0.42, 0.29, 0.15];   // (the leaf litter: dark, in autumn fresh fallen and redder)
    const GR = summer ? [0.36, 0.52, 0.18] : [0.6, 0.52, 0.28], SEED = summer ? [0.6, 0.6, 0.34] : [0.74, 0.64, 0.4];
    const SUS = summer ? [0.36, 0.5, 0.2] : [0.7, 0.6, 0.36], PLUME = summer ? [0.52, 0.52, 0.36] : [0.86, 0.78, 0.6];
    // the forest's edge and floor (1-14 m past the barrier line): ferns and sasa in low clumps, the litter between them
    walk(env, 10701, 2.4, 12, 1.4, (x, z) => { const c = vrLC(x, z); if (c === 3 || c === 4 || c === 5 || vrSlope(x, z) > 1.1) return 0; const e = c === 1 ? 1 : c === 2 ? 0.8 : wood(x, z); return e > 0.25 ? Math.min(1, e) * 0.85 * f(x, z, 40, -90, 19) : 0; }, (gx, gz, k, R, free) => {
      if (R() < 0.45 && free(gx, gz, 2.5)) { soil(soft, gH, gx, gz, 1.2 + R() * 1.6, vary(LIT, R, 0.02), R, 0.05); st.listje++; }
      for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) {
        const x = gx + (R() - 0.5) * 4.5, z = gz + (R() - 0.5) * 4.5, h = R();
        if (!free(x, z, 1.0) || bad(x, z)) continue;
        if (R() < 0.55) { cushion(soft.get(x, z), x, gH(x, z), z, 0.55 + h * 0.5, 0.45 + h * 0.4, vary(FERN, R, 0.03), R); st.praprot++; }
        else { cushion(soft.get(x, z), x, gH(x, z), z, 0.7 + h * 0.6, 0.5 + h * 0.35, vary(SASA, R, 0.025), R); st.sasa++; }
      }
    });
    // the uncut strip at the barrier's foot (0.5-3.5 m behind the line) on the open verges, not in the villages
    walk(env, 10711, 1.8, 1.0, 2.2, (x, z) => { const c = vrLC(x, z); return c === 0 && vrSlope(x, z) < 0.8 ? 0.7 * f(x, z, -30, 60, 21) * (1 - wood(x, z)) : 0; }, (gx, gz, k, R, free) => {
      for (let q = 0, n = 3 + Math.floor(R() * 3); q < n; q++) {
        const x = gx + (R() - 0.5) * 3.2, z = gz + (R() - 0.5) * 3.2, h = R();
        if (!free(x, z, 0.5) || free(x, z, 3.5) || bad(x, z)) continue;
        tuft(soft.get(x, z), x, gH(x, z), z, 0.3 + h * 0.28, 0.45 + h * 0.4, vary(mix3(GR, SEED, R() * 0.5), R, 0.03), R, 4); st.sopi++;
      }
    });
    // the meadows farther out (6-30 m): the pampas grass in loose groups, tall and narrow, its plumes lighter
    walk(env, 10721, 5, 24, 6, (x, z) => { const c = vrLC(x, z); return c === 0 && vrSlope(x, z) < 0.9 ? 0.5 * f(x, z, 110, 35, 27) * (1 - wood(x, z)) : 0; }, (gx, gz, k, R, free) => {
      for (let q = 0, n = 2 + Math.floor(R() * 4); q < n; q++) {
        const x = gx + (R() - 0.5) * 5, z = gz + (R() - 0.5) * 5, h = R();
        if (!free(x, z, 4) || bad(x, z)) continue;
        const y = gH(x, z), g = soft.get(x, z);
        tuft(g, x, y, z, 0.42 + h * 0.3, 0.9 + h * 0.6, vary(SUS, R, 0.03), R, 4);
        tuft(g, x + (R() - 0.5) * 0.3, y + 0.55 + h * 0.4, z + (R() - 0.5) * 0.3, 0.22 + h * 0.12, 0.45 + h * 0.3, vary(PLUME, R, 0.03), R, 3); st.susuki++;
      }
    });
    soft.done();
    if (root) for (const g of root.children) if (g.isGroup) for (const m of g.children) if (m.userData.rob && m.name === 'rob') m.castShadow = false;   // (knee-high plants: no second draw in the shadow pass)
    return st;
  };
})();
