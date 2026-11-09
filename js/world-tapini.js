/* =========================================================================
   WORLD — Tapini, Papua Nova Gvineja (theme 'tapini'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style;
   the tanker's road 5: the brown earth road along the steep forested valley side, grass on the spurs; parrots. The ledge (S.ledge): a cliff below the brink of every drop (def.drops, no barrier), the rock cut back on the other
   side; no guardrails, poles, posts or signs. Made by tools/nova-proga.mjs, the style by hand.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  World.ext.tapini = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 505, snow: 'none', ledge: true,
    ground: { grass: [0.42, 0.52, 0.24], forest: [0.16, 0.3, 0.12], shrub: [0.3, 0.42, 0.18], built: [0.52, 0.46, 0.38], rock: [0.46, 0.4, 0.34], dry: [0.56, 0.41, 0.28] },
    road: { line: 'none', gravel: [0.58, 0.44, 0.32] }, dust: [0.66, 0.5, 0.36],
    trees: { kinds: ['broad'], forest: 0.4, open: 0.04, h: [7, 15] },
    rails: false, poles: null, posts: false, signs: null, skiers: 0, nets: false, snowbanks: false, lifts: false,
    boards: { banner: 'TIME TRIAL' },
    animals: [{ kind: 'parrot', n: 8 }],
  });
})();
