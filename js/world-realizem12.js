/* =========================================================================
   WORLD — realizem 12: the roadside, seen from the chase camera, of the real tracks no other package covers: Furka (Švica) and Izoard
   (Francija) first. Only what OpenStreetMap (ODbL) maps within 60 m of the asphalt, on the heights of the public elevation model the
   tracks already use (Copernicus GLO-30): the guard rails, the walls, the fences, the posts and the stones as they stand there, each
   pass its own character. Placed along the road (station, side, distance), not by the map's coordinates, so they keep to the verge.
   Hooks: a pass's PL_LOOK[theme].extra (js/world-prelaz.js), wrapped: the pass's own scenery first, then these. Drawn into the scenery
   chunks (scen.get): no new draw calls, only vertices.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  let LOD, T; API.sync.push(() => { ({ LOD, T } = API); });

  const R12 = {};   // theme → { extra(k, L) }: filled per track below

  for (const th in R12) {
    const L = API.PL_LOOK[th], own = R12[th]; if (!L || !own) continue;
    const extra0 = L.extra;
    if (own.extra) L.extra = function (k) { if (extra0) extra0.call(this, k); own.extra(k, L); };
  }
})();
