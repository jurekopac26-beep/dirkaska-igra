/* =========================================================================
   WORLD — Sneg (the snow the chase camera sees in winter) on real roads where, by the sources, the snow lies all winter: Medeu,
   Kazahstan (the Tian Shan spruce of the Malaya Almatinka valley), Gudauri, Gruzija (the ski slopes over the Georgian Military Road)
   and Koli, Finska (the crown snow on the spruce of the hill). Only the picture: the driving does not change (CLAUDE.md, »Fizika vožnje
   se ne spreminja«). Hooks (no change to js/world.js, js/render.js or the roads' own files): World.build and the scene's onBeforeRender.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || typeof THREE === 'undefined' || !World.build) return;

  // per road: what winter adds (filled in by the next commits; the sources in docs/proge/<id>.md, »Sneg pozimi«)
  const LOOK = { medeu: {}, gudauri: {}, koli: {} };

  const build = World.build;
  World.build = function (scene, track, tex, opts) {
    const o = build.apply(this, arguments), L = LOOK[track && track.def && track.def.id];
    if (L && o && o.root) o.sneg = { L };
    return o;
  };
  World.sneg = { LOOK };
})();
