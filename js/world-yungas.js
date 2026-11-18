/* =========================================================================
   WORLD — Yungas, Bolivija (theme 'yungas'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style;
   the tanker's road 4: one lane cut in the wet green wall of the valley, the cloud forest over and under it; condors. The ledge (S.ledge): a cliff below the brink of every drop (def.drops, no barrier), the rock cut back on the other
   side; no guardrails, poles, posts or signs. Made by tools/nova-proga.mjs, the style by hand.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  World.ext.yungas = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 808, snow: 'none', ledge: true,
    ground: { grass: [0.3, 0.45, 0.22], forest: [0.16, 0.29, 0.13], shrub: [0.24, 0.37, 0.17], built: [0.5, 0.48, 0.42], rock: [0.4, 0.4, 0.36], dry: [0.46, 0.43, 0.36] },
    road: { line: 'none', gravel: [0.5, 0.46, 0.4] }, dust: [0.6, 0.56, 0.5],
    relief: { rut: [0.35, 0.3, 0.23], mud: [0.27, 0.22, 0.16], water: [0.26, 0.24, 0.2], hole: [0.31, 0.27, 0.21], stone: [0.46, 0.46, 0.43], berm: [0.44, 0.35, 0.25] },   // (the road's relief, js/world-gore.js: the cloud forest's wet mud in the ruts, the streams over the road, the wet grey stones, the landslides' fresh earth)
    trees: { kinds: ['broad'], forest: 0.42, open: 0.05, h: [6, 14] },
    rails: false, poles: null, posts: false, signs: null, skiers: 0, nets: false, snowbanks: false, lifts: false,
    boards: { banner: 'TIME TRIAL' },
    animals: [{ kind: 'condor', n: 2 }, { kind: 'coati', n: 3 }],
  });
})();
