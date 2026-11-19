// Realizem, skupina 5 (docs/realizem.md, »Postopek za vse proge«): real roads on main outside the 15 tracks of the packages, the ones the
// chase camera showed least like the real place (scores in the PR): Isuna (Bhutan), Ghoufi (Algeria), Santo Antão (Cabo Verde), Ujarrás
// (Costa Rica). Wraps World.ext.<id> as js/world-aguascalientes.js and js/world-realizem1.js do: the track's own builder runs first and stays
// as it is, this only adds or changes what is listed here, from the sources only (OSM, ESA WorldCover 2021, Copernicus DEM GLO-30; README.md,
// »Zasluge«). Side roads and road lines are package E (their own files), the physics and the collisions are not touched.
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;

  const wrap = (id, fn) => {
    const base = World.ext[id]; if (typeof base !== 'function') return;
    World.ext[id] = function (scene, tex, opts, api) {
      const out = base.call(this, scene, tex, opts, api);
      if (out && out.root) fn(out, scene, tex, opts);
      return out;
    };
  };

  // (the fixes per track follow, each from its own data)
  void wrap;
})();
