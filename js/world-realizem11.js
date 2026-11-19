/* =========================================================================
   WORLD — Realizem 11 (docs/realizem.md, »vse kot v resnici, samo po virih«): the country along four real mountain roads that have no
   package of their own and that no open pull request touches: Kotor (Črna gora), Llogara (Albanija), Gudauri (Gruzija) and Porto Moniz
   (Portugalska, Madeira). From the chase camera: the fields, the terraces and their dry-stone walls, the vines and the orchards, the
   pastures and their fences, the villages' gardens by the road, the kerbs and the roadside posts, each from a source named by it
   (OpenStreetMap, ODbL: landuse, crop, trees, barrier; ESA WorldCover 2021, CC BY 4.0; Copernicus DEM GLO-30), in the manner of
   js/world-aguascalientes.js. It changes neither js/world.js, js/render.js, the shared builder of the passes (js/world-prelaz.js) nor the
   track files: all four are passes, so it hooks into their looks (API.PL_LOOK[theme].pre and .extra, which run after whatever the look
   already has) and draws into the passes' scenery chunks (scen.get), so it adds no draw calls of its own. Its own random numbers come
   from a seeded generator, so the pictures and the tests repeat.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const API = World.api;

  // a seeded Math.random for this module's own placements (three.js and the builders' helpers use Math.random)
  const uu = { s: 104729 };
  const own = (fn) => { const r = Math.random; Math.random = () => (uu.s = (uu.s * 48271) % 2147483647) / 2147483647; try { return fn(); } finally { Math.random = r; } };

  // the four passes: after the look's own hooks
  const R11 = {};
  const passes = () => {
    const PL = API.PL_LOOK; if (!PL) return;
    for (const th of Object.keys(R11)) {
      const L = PL[th], mine = R11[th]; if (!L || !mine) continue;
      const pre0 = L.pre, extra0 = L.extra;
      if (mine.pre) L.pre = function (k) { if (pre0) pre0.call(this, k); uu.s = 104729; own(() => mine.pre(k)); };
      if (mine.extra) L.extra = function (k) { if (extra0) extra0.call(this, k); uu.s = 15485863; own(() => mine.extra(k)); };
    }
  };

  passes();
})();
