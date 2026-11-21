// WORLD — realizem 15: Portobelo, Panama (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road and the track's own world (js/world-portobelo.js) does not draw yet.
// Hooked by wrapping the track's own builder (World.ext.portobelo): loaded right after it.
// (the beginning: the module and its line in index.html; the drawing follows on this branch)
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.portobelo) return;
})();
