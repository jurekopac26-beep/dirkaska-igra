/* =========================================================================
   WORLD — Svalvogar, Islandija (theme 'svalvogar'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style;
   the tanker's road 1 (docs/proge-cisterna.md): a gravel ledge in the sea cliffs of the fjords, no trees, moss and scree, dark basalt; sheep. The ledge (S.ledge): a cliff below the brink of every drop (def.drops, no barrier), the rock cut back on the other
   side; no guardrails, poles, posts or signs. Made by tools/nova-proga.mjs, the style by hand.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  World.ext.svalvogar = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 101, snow: 'none', ledge: true, sea: true,
    ground: { grass: [0.37, 0.45, 0.25], forest: [0.3, 0.36, 0.2], shrub: [0.34, 0.4, 0.23], built: [0.5, 0.5, 0.46], rock: [0.29, 0.29, 0.29], dry: [0.47, 0.45, 0.39] },
    road: { line: 'none', gravel: [0.5, 0.47, 0.42] }, dust: [0.6, 0.58, 0.54],
    relief: { rut: [0.39, 0.37, 0.34], hole: [0.31, 0.3, 0.28], water: [0.24, 0.27, 0.3], stone: [0.27, 0.27, 0.28], berm: [0.31, 0.3, 0.29] },   // (the road's relief, js/world-gore.js: the basalt gravel grey, its ruts packed darker, the holes' water the sky's grey, the stones black basalt, the windrows' loose gravel fresher)
    trees: { kinds: ['broad'], forest: 0, open: 0 },
    rails: false, poles: null, posts: false, signs: null, skiers: 0, nets: false, snowbanks: false, lifts: false,
    boards: { banner: 'TIME TRIAL' },
    animals: [{ kind: 'sheep', n: 9 }],
  });
})();
