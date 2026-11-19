// Realizem, kamera za avtom, skupina 4 (Bâlea, Katu-Jaryk, Los Caracoles; docs/realizem.md): what the chase camera sees on these three real
// roads. Wraps World.ext.<id> as js/world-realizem1.js and js/world-realizem2.js do: the track's own builder runs first and stays as it is, this
// changes only what is listed here (the buildings, the road's marks and what grows are the packages S, E and G, in their own files). Suzuka (in
// the group 1) is a test track since 9. 11. 2026 (docs/odlocitve.md) and stays as it is
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.ext) return;

  const wrap = (id, fn) => {
    const base = World.ext[id]; if (!base) return;
    World.ext[id] = function (scene, tex, opts, api) {
      const out = base.call(this, scene, tex, opts, api);
      try { fn(out, api || World.api); } catch (e) { console.error('realizem4 (' + id + '):', e); }
      return out;
    };
  };

  wrap('balea', (out) => { (out.stats = out.stats || {}).kamera4 = {}; });
  wrap('katu', (out) => { (out.stats = out.stats || {}).kamera4 = {}; });
  wrap('caracoles', (out) => { (out.stats = out.stats || {}).kamera4 = {}; });
})();
