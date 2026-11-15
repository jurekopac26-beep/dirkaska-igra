/* =========================================================================
   WORLD — Učka, Hrvaška (theme 'ucka'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra. Made by tools/nova-proga.mjs (the style from tools/predogled/proge.json).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  World.ext.ucka = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1818, snow: 'none',
    road: { line: 'none' },
    trees: { kinds: ['gum'], forest: 0.34 },
    skiers: 0, nets: false, snowbanks: false,
    animals: [],
  });
})();
