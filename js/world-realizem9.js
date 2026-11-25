/* =========================================================================
   WORLD — Realizem 9 (docs/realizem.md, »vse kot v resnici, samo po virih«): the desert and high-mountain roads that have no package of
   their own and that no open pull request touches: Cusco (Peru, 3500 m) and Isalo (Madagaskar, the dry south-west). From the chase
   camera: the colour of the ground and the rock, the plants or their absence, each from a source named by it (ESA WorldCover 2021,
   CC BY 4.0; Copernicus Sentinel-2 L2A, sampled on both sides of the road by WorldCover's classes: tools/realizem9/s2barve.py with
   tools/cusco/config.json, tools/isalo/config.json), in the manner of js/world-aguascalientes.js. The seasons are the place's (the game's
   are local; out.ownSeason, as js/world-townsville.js): both roads lie in the southern tropics, where summer is the wet season and
   autumn its green end (Sentinel-2 of 28. 4. 2024 in Cusco and of 28. 3. 2025 in Isalo: as green as January), winter the dry season;
   and neither has snow (out.noSnow, as js/world-chapman.js: rain instead): none is classified near either road on any of ten scenes,
   among them Cusco's five of the dry season (3. 6. 2023, 7. 6. 2024, 17. 7. 2024, 16. 8. 2024, 4. 7. 2025, within 600 m).
   Looked at and left as they are: Furka (Švica, 2429 m) and Izoard (Francija, 2360 m), whose ground has had
   the satellite's colours on main already (Sentinel-2, 8. 8. and 9. 7. 2025), and along whose roads OpenStreetMap maps no barriers but a
   few retaining walls (87 m and 132 m), which the pass builder draws already wherever the ground drops away under the barrier. It
   changes neither js/world.js, js/render.js, the shared builders (js/world-prelaz.js, js/world-gore.js) nor the tracks' files: Cusco by
   wrapping World.ext.cusco (as js/world-realizem5.js), Isalo through its builder's hook (World.isaloHooks.colFn). The satellite's colours are the
   builders' (reflectance^(1/2.2), tools/proga/proga.py), all of a road in a season times one factor that keeps the mean brightness (luma)
   of what the camera sees: the scene's exposure stays the builder's (January's sun and July's stand at different heights), the hue and
   the relative brightness of the classes are the satellite's.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const API = World.api;

  // ---- the seasons (out.ownSeason): wet in summer and autumn, dry in winter, built again when it changes (out.paintFor); never snow ----
  const wetOf = (opts) => !(opts && opts.season === 'winter');
  const seasons = (out, wet) => {
    if (!out || out.paintFor || out.ownSeason) return;
    out.ownSeason = true; out.season = 'r9-' + (wet ? 'wet' : 'dry'); out.paintFor = (s) => 'r9-' + (s === 'winter' ? 'dry' : 'wet'); out.noSnow = true;
  };

  /* ---- Cusco: the ground of the wet and of the dry season ----
     The medians of WorldCover's classes within 600 m of the road. Wet: Sentinel-2 L2A of 9. 1. 2024 (no cloud near the road), times
     1.265; dry: of 4. 7. 2025 (cloud 0.25 %), times 1.398: either way the land within 120 m (tree cover 7674 pixels, grassland 5257,
     cropland 2067, built-up 1555) then has the builder's mean luma (0.401). The builder's own (World.gore's DEF.ground) are a green
     meadow's: the grassland is an olive green in January (R/G 0.93), tan in July (R/G 1.13, B/G 0.83), its trees greyer than the
     builder's forest floor in both. */
  const CUSCO_WET = {
    grass: [0.398, 0.43, 0.339],     // grassland (30): 0.315/0.34/0.268 (cropland, 40: 0.325/0.347/0.273)
    dry: [0.447, 0.464, 0.377],      // the grassland's brightest quarter (its q3: 0.353/0.367/0.298)
    forest: [0.354, 0.367, 0.297],   // tree cover (10): 0.28/0.29/0.235
    shrub: [0.312, 0.321, 0.253],    // shrubland (20, 68 pixels): 0.247/0.254/0.2
    built: [0.586, 0.506, 0.452],    // built-up (50): 0.463/0.4/0.357
    rock: [0.596, 0.531, 0.49],      // bare and sparse (60, 141 pixels): 0.471/0.42/0.387
  };
  const CUSCO_DRY = {
    grass: [0.51, 0.452, 0.373],     // grassland (30): 0.365/0.323/0.267 (cropland, 40, which the land cover counts as grass: 0.377/0.329/0.271)
    dry: [0.57, 0.503, 0.426],       // the grassland's brightest quarter (its q3: 0.408/0.36/0.305), the builder's dry patches
    forest: [0.333, 0.329, 0.256],   // tree cover (10): 0.238/0.235/0.183
    shrub: [0.371, 0.344, 0.275],    // shrubland (20): 0.265/0.246/0.197
    built: [0.577, 0.485, 0.426],    // built-up (50): 0.413/0.347/0.305
    rock: [0.646, 0.522, 0.461],     // bare and sparse (60): 0.462/0.373/0.33
  };
  const cuscoOn = () => {
    const base = World.ext.cusco; if (typeof base !== 'function' || !World.gore || typeof World.gore.build !== 'function') return;
    World.ext.cusco = function (scene, tex, opts, api) {
      const G = World.gore, gb = G.build, wet = wetOf(opts), GR = wet ? CUSCO_WET : CUSCO_DRY;
      G.build = function (s, t, o, look) { return gb.call(this, s, t, o, Object.assign({}, look, { ground: Object.assign({}, look && look.ground, GR) })); };
      let out; try { out = base.call(this, scene, tex, opts, api); } finally { G.build = gb; }
      seasons(out, wet); return out;
    };
  };

  /* ---- Isalo: the savanna of the wet and of the dry season ----
     Within 120 m of the road: grassland 28727 pixels, shrubland 2034, tree cover 185, bare none. Wet: Sentinel-2 L2A of 12. 1. 2025 (no
     cloud near the road); dry: of 10. 8. 2025 (cloud 0 %). The builder's grass (its colour times the straw map's mean 0.764/0.700/0.571:
     0.749/0.574/0.285) is an orange (B/G 0.50); the satellite's is a pale buff (in August 0.388/0.332/0.284, B/G 0.86), less red in
     January (0.398/0.371/0.309, R/G 1.07 against August's 1.17). Each season's times one factor (1.586 wet, 1.734 dry: the grass keeps the
     builder's luma), then divided by the straw map's mean, as the builder's colours multiply it. The structure is the builder's
     (js/world-isalo.js, its colFn): the same noises and weights, only the colours are the satellite's. Left as they were, having no source
     finer than the satellite's 10 m: the ground under the crowns (cov) and the red dust of the verges. */
  const IS_T = [0.764, 0.700, 0.571];
  const isv = (c) => [c[0] / IS_T[0], c[1] / IS_T[1], c[2] / IS_T[2]];
  const IS_WET = {
    grass: isv([0.631, 0.588, 0.49]),     // grassland (30), the median: 0.398/0.371/0.309
    pale: isv([0.717, 0.663, 0.557]),     // its brightest quarter (q3: 0.452/0.418/0.351)
    red: isv([0.726, 0.649, 0.544]),      // its reddest tenth (R/G > 1.246 in reflectance, its 90th percentile: 0.458/0.409/0.343), thin grass on the earth
    scrub: isv([0.474, 0.465, 0.363]),    // shrubland (20): 0.299/0.293/0.229
    canopy: isv([0.393, 0.43, 0.298]),    // tree cover (10) within 900 m (5203 pixels): 0.248/0.271/0.188
    rock: isv([0.961, 0.885, 0.787]),     // bare and sparse (60) within 900 m (283 pixels): 0.606/0.558/0.496
  };
  const IS_DRY = {
    grass: isv([0.673, 0.576, 0.492]),    // grassland (30), the median: 0.388/0.332/0.284
    pale: isv([0.733, 0.635, 0.544]),     // its brightest quarter (q3: 0.423/0.366/0.314), the builder's paler grass
    red: isv([0.614, 0.505, 0.435]),      // its reddest tenth (R/G > 1.5 in reflectance, 10 % of it: 0.354/0.291/0.251), the builder's red earth
    scrub: isv([0.572, 0.498, 0.414]),    // shrubland (20): 0.33/0.287/0.239
    canopy: isv([0.437, 0.449, 0.34]),    // tree cover (10) within 900 m (5203 pixels): 0.252/0.259/0.196
    rock: isv([0.969, 0.89, 0.782]),      // bare and sparse (60) within 900 m (283 pixels): 0.559/0.513/0.451, the sandstone paler than the grass
  };
  const isaloCol = (P, A) => {
    const { clamp, lerp, nrLCf, sstep } = API;
    return (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2);
      let r = A.grass[0] * (1 + (m - 0.5) * 0.16), g = A.grass[1] * (1 + (m - 0.5) * 0.15 + (q - 0.5) * 0.07), b = A.grass[2] * (1 + (q - 0.5) * 0.16);
      const pale = sstep(0.55, 0.85, P.n2(x, z)) * 0.5; r = lerp(r, A.pale[0], pale); g = lerp(g, A.pale[1], pale); b = lerp(b, A.pale[2], pale);
      const red = sstep(0.62, 0.86, P.n7(x, z)) * 0.7; r = lerp(r, A.red[0], red); g = lerp(g, A.red[1], red); b = lerp(b, A.red[2], red);
      r = lerp(r, A.scrub[0], sc * 0.5); g = lerp(g, A.scrub[1], sc * 0.5); b = lerp(b, A.scrub[2], sc * 0.5);
      const cv = clamp(cov, 0, 1), can = fo * (1 - cv);
      r = lerp(r, A.canopy[0] * (0.96 + m * 0.08), can * 0.8); g = lerp(g, A.canopy[1] * (0.96 + m * 0.08), can * 0.8); b = lerp(b, A.canopy[2], can * 0.8);
      r = lerp(r, 0.66, cv * 0.7); g = lerp(g, 0.56, cv * 0.7); b = lerp(b, 0.38, cv * 0.7);   // (the builder's: the ground under the crowns)
      const rk = sstep(0.92, 0.7, ny) * 0.95, rq = 0.97 + q * 0.06;
      r = lerp(r, A.rock[0] * rq, rk); g = lerp(g, A.rock[1] * rq, rk); b = lerp(b, A.rock[2] * rq, rk);
      if (dd < 4) { const t = sstep(4, 0.5, dd); r = lerp(r, 0.9, t); g = lerp(g, 0.7, t); b = lerp(b, 0.52, t); }   // (the builder's: the verges' red dust)
      o[0] = r; o[1] = g; o[2] = b; return o;
    };
  };
  // The world's builder asks World.isaloHooks.colFn(P, opts) for its ground colours right after its own (js/world-isalo.js): the same
  // structure on its grid P, the satellite's colours of the season.
  const isaloOn = () => {
    const base = World.ext.isalo; if (typeof base !== 'function' || !API.clamp || !API.lerp || !API.nrLCf || !API.sstep) return;
    World.isaloHooks = Object.assign(World.isaloHooks || {}, {
      colFn: (P, opts) => (P && P.n2 && P.n3 && P.n4 && P.n7 ? isaloCol(P, wetOf(opts) ? IS_WET : IS_DRY) : null),
    });
    World.ext.isalo = function (scene, tex, opts, api) {
      const out = base.call(this, scene, tex, opts, api);
      seasons(out, wetOf(opts)); return out;
    };
  };

  cuscoOn();
  isaloOn();
})();
