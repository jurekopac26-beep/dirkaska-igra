/* =========================================================================
   WORLD — Manchewe, Malavi (theme 'manchewe'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style;
   the tanker's road 3: the red earth road down the escarpment in two serpentines, the woodland round it; goats. The ledge (S.ledge): a cliff below the brink of every drop (def.drops, no barrier), the rock cut back on the other
   side; no guardrails, poles, posts or signs. Made by tools/nova-proga.mjs, the style by hand.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  World.ext.manchewe = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 303, snow: 'none', ledge: true,
    ground: { grass: [0.42, 0.5, 0.24], forest: [0.24, 0.33, 0.16], shrub: [0.34, 0.42, 0.2], built: [0.56, 0.44, 0.34], rock: [0.5, 0.4, 0.33], dry: [0.62, 0.43, 0.29] },
    road: { line: 'none', gravel: [0.6, 0.39, 0.27] }, dust: [0.68, 0.46, 0.32],
    relief: { rut: [0.5, 0.3, 0.2], gully: [0.44, 0.22, 0.13], hole: [0.43, 0.25, 0.16], water: [0.38, 0.23, 0.15], stone: [0.58, 0.5, 0.42], berm: [0.58, 0.35, 0.23] },   // (the road's relief, js/world-gore.js: red laterite, the rains' gullies deep red, the puddles red-brown, quartz pebbles, the water bars' packed earth)
    trees: { kinds: ['broad'], forest: 0.3, open: 0.03, h: [5, 11] },
    rails: false, poles: null, posts: false, signs: null, skiers: 0, nets: false, snowbanks: false, lifts: false,
    boards: { banner: 'TIME TRIAL' },
    animals: [{ kind: 'goat', n: 6 }],
  });
})();
