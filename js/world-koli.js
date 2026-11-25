/* =========================================================================
   WORLD — Koli, Finska (theme 'koli'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra. Made by tools/nova-proga.mjs (the style from tools/predogled/proge.json).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  World.ext.koli = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1717, snow: 'all',
    road: { line: 'none' },   // (the ploughed road under packed snow: no lines to see)
    trees: { kinds: ['fir', 'pine'], forest: 0.4, h: [8, 16] },   // (the boreal forest of the national park: spruce and pine)
    skiers: 50, nets: true, snowbanks: true,
    animals: [],
    extra: (ctx) => { if (World.ext.goreRob) World.ext.goreRob(ctx, 'koli'); },   // (the roadside ground for the chase camera: js/world-chase-bt19.js)
  });
})();
