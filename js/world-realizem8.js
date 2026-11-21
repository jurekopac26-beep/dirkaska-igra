/* =========================================================================
   WORLD — Realizem 8 (docs/realizem.md, as the chase camera sees the road): the island and coast roads that have no package, on the shared
   world of the mountain passes (js/world-prelaz.js, buildPrelaz) through the hooks of their looks (API.PL_LOOK[theme].pre and .extra, as
   js/world-medeu.js): Canaries (Saint Lucia), Koror (Palau), Savusavu (Vanua Levu, Fiji) and Sa Calobra (Mallorca). It changes neither
   js/world.js, js/world-prelaz.js nor the track files (the open pull requests of package E add the side roads to the track files).
   Each road's own parts go in R8[theme] = { pre, extra } and run after whatever its look already has; a road with no entry keeps its
   look untouched. Everything only from the sources: OpenStreetMap (ODbL 1.0), ESA WorldCover (CC BY 4.0), Copernicus DEM; no names,
   letters, firms or people.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;

  const { caGround, caSlope, cone, ico, rng, vary, vrLC, vrNear, vrWater } = API;
  let LOD, T; API.sync.push(() => { ({ LOD, T } = API); });
  const THEMES = ['canaries', 'koror', 'savusavu', 'sacalobra'];

  /* ---- the cars parked by these roads: none black or very dark (the game's rule for car colours) ---- */
  for (const th of THEMES) { const L = API.PL_LOOK[th]; if (L && L.cars) L.cars = L.cars.filter(c => Math.max(c[0], c[1], c[2]) >= 0.3); }

  /* ---- the verge (docs/realizem.md, steps 4 and 6): what grows (or lies) in the first metres beyond the asphalt, by the ESA WorldCover
     class under each spot, in the share the class has along the road (measured on each road's own WorldCover in 0-6 m and 6-30 m from the
     centre line). The look's trees stand from about 6 m on; the band nearer the road was bare grass, which WorldCover rarely shows there
     (Canaries: forest 43 %, shrubs 29 %, grass 0 %). Merged into the scenery's chunks (a few new draw calls only where a chunk had nothing). p[class] = [bush, clump, stone]
     chances (0 grass, 1 forest, 2 shrubs, 3 built-up, 4 bare rock, 7 bare ground); a class with no entry gets nothing (5 water, 6 snow). ---- */
  const SPEC = {
    // Saint Lucia, the west coast road: wet tropical forest to the asphalt, its edge a wall of broadleaf bushes, tall grass in the gaps
    canaries: { seed: 8101, d0: 2.6, d1: 8.5, step: 2.6, slope: 1.0, bush: [1.1, 2.2], bushSy: 0.78, clump: [0.4, 0.7, 0.9, 1.7], stone: [0.3, 0.7],
      p: { 0: [0.1, 0.6, 0], 1: [0.8, 0.1, 0], 2: [0.7, 0.2, 0], 3: [0.15, 0.15, 0], 4: [0.1, 0, 0.3], 7: [0.05, 0.25, 0.05] } },
    // Palau, Main Street: shrubs and the forest edge between the houses and the water, the limestone in the cuttings
    koror: { seed: 8203, d0: 2.6, d1: 8.5, step: 2.6, slope: 1.0, bush: [1.0, 2.0], bushSy: 0.78, clump: [0.4, 0.65, 0.8, 1.5], stone: [0.3, 0.8],
      p: { 0: [0.1, 0.5, 0], 1: [0.75, 0.1, 0], 2: [0.7, 0.15, 0], 3: [0.12, 0.12, 0], 4: [0.1, 0, 0.4], 7: [0.05, 0.2, 0.1] } },
    // Vanua Levu, the coast road by the town: gardens, mown grass and the bush between them
    savusavu: { seed: 8307, d0: 2.6, d1: 8.5, step: 2.6, slope: 1.0, bush: [0.9, 1.9], bushSy: 0.8, clump: [0.35, 0.6, 0.7, 1.4], stone: [0.3, 0.6],
      p: { 0: [0.08, 0.45, 0], 1: [0.75, 0.1, 0], 2: [0.65, 0.2, 0], 3: [0.12, 0.1, 0], 4: [0.1, 0, 0.3], 7: [0.05, 0.2, 0.05] } },
    // Mallorca, the Serra de Tramuntana: low macchia, tussocks of the tall grass of the karst, the pale limestone breaking through
    sacalobra: { seed: 8411, d0: 2.2, d1: 7, step: 2.4, slope: 1.1, bush: [0.6, 1.3], bushSy: 0.7, clump: [0.45, 0.7, 0.7, 1.2], stone: [0.3, 0.9], med: 1,
      p: { 0: [0.1, 0.5, 0.05], 1: [0.6, 0.15, 0], 2: [0.55, 0.25, 0.05], 3: [0.05, 0.1, 0.1], 4: [0.05, 0.05, 0.6], 7: [0.05, 0.15, 0.35] } },
  };

  function verge(S) {
    return function ({ scen, P, excluded, onSide }, L) {
      const R = rng(S.seed), RJ = rng(S.seed + 1), keep = LOD.count(1000) / 1000;   // (SREDNJA, NIZKA: fewer of the same spots)
      const lakes = P.lakes || [], bridges = (T.def && T.def.bridges) || [];
      const wet = (x, z) => (P.sea != null && caGround(x, z) < P.sea + 0.4) || lakes.some(k => x > k.x0 && x < k.x1 && z > k.z0 && z < k.z1 && vrWater(x, z).e > -2);
      const lush = L.grassLush || L.grass, sh = L.shrub, mid = [0, 1, 2].map(i => sh[i] + (lush[i] - sh[i]) * 0.3);   // (the look's own bush green, a little toward the lush grass: the new bushes are of the same thicket)
      const bushC = S.med ? [sh, [0.3, 0.33, 0.22], [0.26, 0.3, 0.19]] : [sh, mid, [sh[0] * 1.06, sh[1] * 1.1, sh[2] * 1.04]];
      const clumpC = S.med ? [[0.4, 0.44, 0.27], [0.62, 0.6, 0.42]] : [L.grass, L.grassDry || L.grass];   // (the karst's tussocks: green blades, straw tips)
      const stoneC = L.rockCols || [L.rock];
      for (let s = S.step / 2; s < T.len - 1; s += S.step) for (let side = -1; side <= 1; side += 2) {
        const r0 = R(), a = R(), b = R(), c = R(), d = R(), e = R();   // (always six draws: the same spots at every tier)
        if (r0 > keep || bridges.some(q => s > q[0] - 10 && s < q[1] + 10)) continue;
        const [x, z] = onSide(Math.max(0, s + (b - 0.5) * S.step), side, S.d0 + a * (S.d1 - S.d0)), nn = vrNear(x, z);
        if (nn.i < 0 || nn.dd < S.d0 - 0.4 || excluded(x, z) || wet(x, z)) continue;
        const p = S.p[vrLC(x, z)]; if (!p) continue;
        const sl = caSlope(x, z); if (sl > S.slope) continue;
        const y = caGround(x, z), g = scen.get(x, z);
        if (c < p[0]) {   // a bush (a broadleaf thicket in the tropics, macchia in the karst): smaller on a steep bank
          const rad = (S.bush[0] + d * (S.bush[1] - S.bush[0])) * (sl > 0.6 ? 0.65 : 1), col = vary(bushC[(e * bushC.length) | 0], RJ, 0.14);
          ico(g, x, y + rad * S.bushSy * 0.45, z, rad, S.bushSy, col, RJ, 0.2);
          if (rad > 1.4 && e < 0.5) ico(g, x + rad * 0.7, y + rad * S.bushSy * 0.3, z - rad * 0.4, rad * 0.6, S.bushSy, vary(col, RJ, 0.1), RJ, 0.2);
        } else if (c < p[0] + p[1]) {   // a clump of tall grass (a tussock)
          const cr = S.clump[0] + d * (S.clump[1] - S.clump[0]), h = S.clump[2] + e * (S.clump[3] - S.clump[2]);
          cone(g, x, y - 0.05, z, cr, h, 5, vary(clumpC[0], RJ, 0.12), clumpC[1], d * 6.28);
        } else if (c < p[0] + p[1] + p[2]) {   // a stone of the rock under the soil, half sunk
          const rr = S.stone[0] + d * (S.stone[1] - S.stone[0]);
          ico(g, x, y + rr * 0.1, z, rr, 0.55, vary(stoneC[(e * stoneC.length) | 0], RJ, 0.1), RJ, 0.3);
        }
      }
    };
  }

  /* ---- each road's own parts ---- */
  const R8 = {};
  for (const th of THEMES) R8[th] = { extra: verge(SPEC[th]) };

  /* ---- hooked onto the looks: a road's own parts after those its look already has ---- */
  for (const th of THEMES) {
    const L = API.PL_LOOK[th], own = R8[th];
    if (!L || !own) continue;
    const pre0 = L.pre, extra0 = L.extra;
    if (own.pre) L.pre = function (k) { if (pre0) pre0.call(this, k); own.pre(k, L); };
    if (own.extra) L.extra = function (k) { if (extra0) extra0.call(this, k); own.extra(k, L); };
  }
})();
