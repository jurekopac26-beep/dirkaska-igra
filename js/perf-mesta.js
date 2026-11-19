// Fewer draw calls and vertices on the busiest real circuits and city tracks (NIZKA, 844x390, the chase camera: the measurements are
// in the pull request's description, tests/golden/perf.json stays as it is), with the picture unchanged: World.build wrapped, and the
// world of a track listed in BY tidied once it is built (before Render's season, lights and asphalt see it). The mountain and open
// roads have their own module (js/perf-gore.js).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.build) return;
  const BY = {};   // track id -> function (world, track, opts): that world's tidying
  const build = World.build;
  World.build = function (scene, track, tex, opts) {
    const w = build.apply(this, arguments);
    const id = track && track.def && track.def.id, f = id && BY[id];
    if (f && w && w.root) { try { f(w, track, opts || {}); } catch (e) { console.warn('perf-mesta', id, e); } }
    return w;
  };
  World.perfMesta = { BY };
})();
