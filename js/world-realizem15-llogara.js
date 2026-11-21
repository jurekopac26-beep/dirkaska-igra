// WORLD — realizem 15: Llogara, Albanija (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road and the pass's own world (js/world-llogara.js, PL_LOOK.llogara) does not draw yet.
// Hooked by wrapping the look's own hooks: loaded right after the pass's own world.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.llogara) return;
})();
