/* =========================================================================
   WORLD — realizem 15: Kildare, Irska (docs/realizem.md, »Postopek za vse proge«): what OpenStreetMap has within 60 m of the lap and the
   game did not draw yet. The circuit's part is chained onto its look's build hook (API.rbLook.kildare.build, the shared builder
   js/world-rbring.js calls it with the scenery's chunks), so its pieces go into the scenery's chunks. Loaded right after the circuit's own
   world (js/world-kildare.js, index.html). The side roads come with the roads' package (World.cesta.stranske), not from here.
   Data: © OpenStreetMap contributors, ODbL.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, lk = API.rbLook && API.rbLook.kildare;
  if (!lk) return;
  const part = (K) => {};   // (the circuit's pieces: added with the data)
  const prev = lk.build; lk.build = prev ? (K) => { prev(K); part(K); } : part;
})();
