/* =========================================================================
   WORLD — realizem 6: the real circuits on the shared builder (js/world-rbring.js) outside the 15 tracks of the packages (docs/realizem.md),
   what the chase camera sees along them as it is in OSM: the grandstands, the pits' buildings, the kerbs, the fences, the run-offs by their
   outlines. Each circuit's part is chained onto its look's build hook (API.rbLook.<id>.build, after a world's own: js/world-aguascalientes.js)
   and drawn into the scenery's chunks (no draw calls of its own). Loaded after js/world-rbring.js (index.html): the looks are the same
   objects as its RB_LOOK's.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.rbLook) return;
  const API = World.api, LOOK = API.rbLook;
  // a circuit's part after its world's own build (K: the shared builder's hook, js/world-rbring.js LK.build)
  const chain = (id, fn) => { const lk = LOOK[id]; if (!lk) return; const prev = lk.build; lk.build = prev ? (K) => { prev(K); fn(K); } : fn; };
  void chain;
})();
