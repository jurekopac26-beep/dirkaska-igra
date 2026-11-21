// WORLD — realizem 15: Termas de Río Hondo, Argentina (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps beside the lap and the circuit's own world (js/world-riohondo.js) does not draw. Hooked by wrapping the look's
// extra (API.rbLook.riohondo.extra): loaded right after the circuit's own world and before the shared builder (js/world-rbring.js).
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, lk = API.rbLook && API.rbLook.riohondo;
  if (!lk || !lk.extra) return;
})();
