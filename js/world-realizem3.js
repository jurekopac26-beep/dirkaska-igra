/* =========================================================================
   WORLD — realizem, skupina 3 (Montréal, Štajerska, Chapman's Peak; docs/realizem.md; Medvode is pending, so frozen): what the chase camera
   sees of these real tracks, on top of their own worlds: World.ext.montreal, .rbring and .chapman wrapped as js/world-realizem1.js and
   js/world-realizem2.js wrap theirs, loaded after them (index.html). The track's own builder runs first and stays as it is; this changes only
   what is listed here. Sources: OSM and the public elevation models only.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.ext) return;

  // (World.ext.rbring is the shared builder of many circuits (js/world-bathurst.js, -batangas.js, ...), which call it by name: so the change
  // goes only on the track whose id is asked, read off the track the world is built for)
  const trackId = (api) => { const T = (api && api.T) || (World.api && World.api.T); return T && T.def ? T.def.id : ''; };
  const wrap = (id, fn) => {
    const base = World.ext[id]; if (!base) return;
    World.ext[id] = function (scene, tex, opts, api) {
      const out = base.call(this, scene, tex, opts, api);
      if (trackId(api) === id) try { fn(out, (api && api.T) || World.api.T); } catch (e) { console.error('realizem3 (' + id + '):', e); }
      return out;
    };
  };

  wrap('montreal', (out) => { (out.stats = out.stats || {}).kamera3 = {}; });
  wrap('rbring', (out) => { (out.stats = out.stats || {}).kamera3 = {}; });
  wrap('chapman', (out) => { (out.stats = out.stats || {}).kamera3 = {}; });
})();
