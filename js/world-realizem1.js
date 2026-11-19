/* =========================================================================
   WORLD — realizem, skupina 1 (Nürburg, Pikes Peak, Tianmen; docs/realizem.md): what the chase camera sees of these real tracks (the
   horizon, the road, its edges, the ground), on top of their own worlds: World.ext.nring, .pikes and .tianmen wrapped as
   js/world-aguascalientes.js wraps the shared builder, loaded after them (index.html). Sources: OSM and the public elevation models only.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
})();
