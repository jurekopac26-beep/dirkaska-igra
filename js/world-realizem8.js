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

  /* ---- each road's own parts (filled road by road; empty: the look as it was) ---- */
  const R8 = {};

  /* ---- hooked onto the looks: a road's own parts after those its look already has ---- */
  for (const th of ['canaries', 'koror', 'savusavu', 'sacalobra']) {
    const L = API.PL_LOOK[th], own = R8[th];
    if (!L || !own) continue;
    const pre0 = L.pre, extra0 = L.extra;
    if (own.pre) L.pre = function (k) { if (pre0) pre0.call(this, k); own.pre(k); };
    if (own.extra) L.extra = function (k) { if (extra0) extra0.call(this, k); own.extra(k); };
  }
})();
