/* =========================================================================
   WORLD — realizem 13: four more real circuits on the shared builder (js/world-rbring.js) outside the 15 tracks of the packages
   (docs/realizem.md): Silkeborg, Kågeröd, Sosnová and Pembrey, what the chase camera sees along them as it is in OSM. Each circuit's part
   is chained onto its look's build hook (API.rbLook.<id>.build, after a world's own) and drawn into the scenery's chunks (no draw calls of
   its own). Loaded after js/world-rbring.js (index.html); chained when the builder is first called for a look (World.ext.rbring, which every
   world's build calls), so a world loaded later (lazily) gets its part too. The same way as realizem 6 (Tuzla, Lusail).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.rbring) return;
  const API = World.api, PART = {}, DONE = new WeakSet();
  // a circuit's part after its world's own build (K: the shared builder's hook, js/world-rbring.js LK.build): chained once per look, when the
  // builder is called (the look is on API.rbLook by then, however its world was loaded)
  const chain = (id, fn) => { PART[id] = fn; };
  const hook = () => {
    const L = API.rbLook || {};
    for (const id in PART) {
      const lk = L[id]; if (!lk || DONE.has(lk)) continue;
      const prev = lk.build, fn = PART[id]; lk.build = prev ? (K) => { prev(K); fn(K); } : fn; DONE.add(lk);
    }
  };
  const rb = World.ext.rbring; World.ext.rbring = (scene, tex, opts) => { hook(); return rb(scene, tex, opts); };
  void chain;   // (the circuits' parts follow)
})();
