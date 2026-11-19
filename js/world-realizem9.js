/* =========================================================================
   WORLD — Realizem 9 (docs/realizem.md, »vse kot v resnici, samo po virih«): the desert and high-mountain roads that have no package of
   their own and that no open pull request touches: Cusco (Peru, 3500 m), Furka (Švica, 2429 m), Izoard (Francija, 2360 m), Killar
   (Indija, Pangi) and Isalo (Madagaskar, the dry south-west). From the chase camera: the colour of the ground and the rock, the plants or
   their absence, the snow above its line, the dust, the barriers and the road's edges, each from a source named by it (OpenStreetMap, ODbL;
   ESA WorldCover 2021, CC BY 4.0; Copernicus DEM GLO-30), in the manner of js/world-aguascalientes.js. It changes neither js/world.js,
   js/render.js, the shared builder of the passes (js/world-prelaz.js) nor the track files: the passes through the hooks of their looks
   (API.PL_LOOK[theme].pre and .extra, which run after whatever the look already has), the others by wrapping World.ext[theme] (as
   js/world-realizem5.js). Its own random numbers come from a seeded generator, so the pictures and the tests repeat.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const API = World.api;

  // a seeded Math.random for this module's own placements (three.js and the builders' helpers use Math.random)
  const uu = { s: 104729 };
  const own = (fn) => { const r = Math.random; Math.random = () => (uu.s = (uu.s * 48271) % 2147483647) / 2147483647; try { return fn(); } finally { Math.random = r; } };

  // after the base world of a track has been built: fn(out, scene, tex, opts) on its root
  const wrap = (id, fn) => {
    const base = World.ext[id]; if (typeof base !== 'function') return;
    World.ext[id] = function (scene, tex, opts, api) {
      const out = base.call(this, scene, tex, opts, api);
      if (out && out.root) { uu.s = 104729; own(() => fn(out, scene, tex, opts)); }
      return out;
    };
  };

  // the passes: after the look's own hooks
  const R9 = {};
  const passes = () => {
    const PL = API.PL_LOOK; if (!PL) return;
    for (const th of Object.keys(R9)) {
      const L = PL[th], mine = R9[th]; if (!L || !mine) continue;
      const pre0 = L.pre, extra0 = L.extra;
      if (mine.pre) L.pre = function (k) { if (pre0) pre0.call(this, k); uu.s = 104729; own(() => mine.pre(k)); };
      if (mine.extra) L.extra = function (k) { if (extra0) extra0.call(this, k); uu.s = 15485863; own(() => mine.extra(k)); };
    }
  };

  passes();
  void wrap;
})();
