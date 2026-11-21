/* =========================================================================
   WORLD — realizem 15: Biķernieki, Latvija (docs/realizem.md, »Postopek za vse proge«) by OpenStreetMap within 60 m of its lap.
   Hooked by wrapping the look's extra (API.rbLook.bikernieki.extra): loaded right after the circuit's own world (js/world-bikernieki.js)
   and before the shared builder (js/world-rbring.js). A module of its own (js/world-realizem15.js is Kildare's).
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«); x east and z south of the middle of the start line, in metres.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, lk = API.rbLook && API.rbLook.bikernieki;
  if (!lk || !lk.extra) return;
  const prev = lk.extra;
  lk.extra = (o) => prev(o);   // the circuit's own part; the parts by OpenStreetMap follow
})();
