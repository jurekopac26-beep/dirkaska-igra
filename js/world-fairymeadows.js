/* =========================================================================
   WORLD — Fairy Meadows, Pakistan (theme 'fairymeadows'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style;
   the tanker's road 2: the jeep track up the dry grey gorge, serpentines in the scree, a few pines; goats, a vulture over it. The ledge (S.ledge): a cliff below the brink of every drop (def.drops, no barrier), the rock cut back on the other
   side; no guardrails, poles, posts or signs. Made by tools/nova-proga.mjs, the style by hand.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  World.ext.fairymeadows = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 202, snow: 'none', ledge: true,
    ground: { grass: [0.5, 0.46, 0.35], forest: [0.3, 0.33, 0.22], shrub: [0.4, 0.42, 0.28], built: [0.55, 0.52, 0.46], rock: [0.4, 0.38, 0.36], dry: [0.67, 0.61, 0.5] },
    road: { line: 'none', gravel: [0.6, 0.56, 0.49] }, dust: [0.72, 0.68, 0.6],
    relief: { slab: [0.68, 0.65, 0.6], stone: [0.72, 0.7, 0.65], hole: [0.46, 0.43, 0.38], gully: [0.5, 0.47, 0.41] },   // (the road's relief, js/world-gore.js: blasted out of the pale granite, its slabs and boulders paler than the grit between them)
    trees: { kinds: ['pine'], forest: 0.12, open: 0.006, h: [7, 14], young: 0.025 },
    rails: false, poles: null, posts: false, signs: null, skiers: 0, nets: false, snowbanks: false, lifts: false,
    boards: { banner: 'TIME TRIAL' },
    animals: [{ kind: 'goat', n: 7 }, { kind: 'condor', n: 1 }],
  });
})();
