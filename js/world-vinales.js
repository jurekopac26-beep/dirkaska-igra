/* =========================================================================
   WORLD — Viñales, Kuba (theme 'vinales'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra. Made by tools/nova-proga.mjs (the style from tools/predogled/proge.json).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  World.ext.vinales = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1717, snow: 'none',
    road: { line: 'white' },
    trees: { kinds: ['broad'], forest: 0.14 },
    skiers: 0, nets: false, snowbanks: false,
    animals: [],
  });
})();
