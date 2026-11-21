// WORLD — realizem 15: Hiva, Uzbekistan (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road and the track's own world (js/world-hiva.js) does not draw yet.
// Hooked by wrapping the track's own builder (World.ext.hiva): loaded right after it. The beginning: the module and its line in index.html;
// the geometry follows in this pull request.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.hiva) return;

  function add(out) {
    if (!out || !out.root || !out.matV) return;
  }

  const base = World.ext.hiva;
  World.ext.hiva = (...a) => { const out = base(...a); add(out); return out; };
})();
