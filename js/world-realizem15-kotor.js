// WORLD — realizem 15: Kotor, Črna gora (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road and the pass's own world (js/world-prelaz.js, PL_LOOK.kotor) does not draw yet.
// Hooked by wrapping the look's own hooks (PL_LOOK.kotor.pre, .extra): loaded right after the shared world of the passes.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.kotor) return;
})();
