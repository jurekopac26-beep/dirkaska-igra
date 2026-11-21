/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the forty-fourth group of the real tracks: Porto Moniz and Sa Calobra,
   a second pass on two of the passes' roads (js/world-prelaz.js) whose ground the seventh and the eighth group (js/world-chase-bt7.js,
   js/world-chase-bt8.js) and, on Sa Calobra's verge, the twenty-fourth group (js/world-chase-bt24.js) already set. Seen from behind the car
   Porto Moniz still showed its verge between the asphalt and the steel barrier in one even face, and on both the slope that rises behind the
   barrier (or the low stone wall) read as one colour from the barrier's foot up to the far trees. So here, as the twenty-fifth group did
   (js/world-chase-bt25.js): on Porto Moniz's verge the twenty-fourth group's patches and tufts (BT.verge) with what lies there (docs/proge/
   portomoniz.md); on the bank of both, from 0.4 m past the barrier line to ~8 m, low patches lying on the terrain, tufts and, where it is
   gentle, low cushions of the scrub (BT.bank); and from ~9 m to ~55 m a sparser band of wider patches and cushions (the same bank, its near
   part left out), so the slope up to the trees changes in places the way the ground does. Only where the ground rises (not where it falls
   to the sea), nothing where another leg's road is nearer, in the builder's excluded places (the viewpoints, the shrine, the town, the knot's
   bridge) or on a face too steep. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers,
   the walls, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary } = API, LK = API.PL_LOOK;
  if (!BT || !BT.verge || !BT.bank || !BT.muted || !BT.chain || !LK || !vary) return;
  const { mix3, chain, verge, bank, muted } = BT;
  // the far band: the bank's places nearer than `from` m past the barrier line left out (the near bank has them)
  const farBand = (C, from) => Object.assign({}, C, { skip: (x, z, i) => {
    const q = API.vrNear(x, z), T = API.T; if (q.i < 0) return true;
    return Math.abs(q.lat) < (q.lat > 0 ? T.br[i] : T.bl[i]) + from;
  } });

  /* Porto Moniz: docs/proge/portomoniz.md: »Strmo pobočje je v terasah: suhi kamniti zidovi teras po plastnicah, med njimi pašniki in
     grmišča … Gozd so sestoji evkaliptov in lovorja … ob robu ceste modri agapanti«; the look (js/world-portomoniz.js): the terraces'
     green, the dark basalt, the red-brown of the tuff. On the verge the dark basalt grit of the shoulder, the red-brown earth washed down
     from the terraces and the lush pasture grass in low patches, at the barrier's foot lush green tufts (the agapanthus stand there
     already). On the bank the terraces' pasture in a greener and a sun-dried face, the red-brown tuff earth, the basalt's scree on the
     steeper parts, lush tufts and the dark heath and laurel scrub in low cushions; further up the same in wider, fewer patches. */
  const PMV = { step: 3, share: 0.55, foot: 0.25,
    patch: (R) => { const r = R();
      return r < 0.35 ? { col: vary(mix3([0.38, 0.37, 0.35], [0.42, 0.4, 0.37], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (basalt grit)
        : r < 0.65 ? { col: vary(mix3([0.44, 0.35, 0.28], [0.48, 0.38, 0.3], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (red-brown tuff earth)
        : { col: vary(mix3([0.3, 0.45, 0.19], [0.35, 0.48, 0.22], R()), R, 0.015), r: 1.0 + R() * 1.1 }; },   // (lush grass)
    tuft: (R) => vary(mix3([0.27, 0.44, 0.17], [0.36, 0.48, 0.22], R()), R, 0.03) };
  const PMB = { step: 3, n: 3, reach: 8, share: 0.5, maxSl: 1.5, sl: 0.9, bushShare: 0.4,
    patch: (R, sl) => { const r = R();
      return sl > 1.0 && r < 0.45 ? { col: vary(mix3([0.37, 0.35, 0.32], [0.42, 0.39, 0.35], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (basalt scree)
        : r < 0.45 ? { col: vary(mix3([0.27, 0.43, 0.17], [0.31, 0.46, 0.2], R()), R, 0.015), r: 1.0 + R() * 1.3 }   // (pasture, lush)
        : r < 0.75 ? { col: vary(mix3([0.45, 0.47, 0.28], [0.49, 0.49, 0.3], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (pasture, sun-dried)
        : { col: vary(mix3([0.43, 0.33, 0.26], [0.47, 0.37, 0.29], R()), R, 0.015), r: 0.8 + R() * 0.9 }; },   // (red-brown tuff earth)
    tuft: (R) => vary(mix3([0.27, 0.44, 0.17], [0.4, 0.47, 0.24], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.15, 0.26, 0.12] : [0.2, 0.3, 0.15], R, 0.025) };   // (heath, laurel scrub)
  const PMF = farBand(Object.assign({}, PMB, { step: 6, n: 3, reach: 55, share: 0.6, maxSl: 1.3, bushShare: 0.45,
    patch: (R, sl) => { const P = PMB.patch(R, sl); return { col: P.col, r: P.r * 1.8 }; } }), 9);

  /* Sa Calobra: docs/proge/sacalobra.md: »Sive apnenčaste stene in skale (ponekod okraste), med njimi suha sredozemska makija (temni
     grmi), šopi trave càrritx na suhi travi, … rdeča zemlja (terra rossa) na brežinah ob cesti«, the look (js/world-prelaz.js): the bank's
     red earth, the pale limestone. Behind the low stone walls, where the slope rises: the terra rossa in low patches, the pale limestone
     grit and the fallen chips on the steeper parts, the dry straw grass, the càrritx in dry pale tufts and the dark maquis in cushions;
     further up the same in wider, fewer patches, more limestone and maquis, less red earth (the red lies on the banks by the road). */
  const SCB = { step: 3, n: 3, reach: 8, share: 0.5, maxSl: 1.6, sl: 0.9, bushShare: 0.45,
    patch: (R, sl) => { const r = R();
      return (sl > 1.0 && r < 0.5) || r < 0.25 ? { col: vary(mix3([0.6, 0.59, 0.55], [0.65, 0.63, 0.58], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (limestone grit)
        : r < 0.6 ? { col: vary(mix3([0.54, 0.4, 0.3], [0.58, 0.44, 0.33], R()), R, 0.015), r: 0.9 + R() * 1.2 }   // (terra rossa)
        : { col: vary(mix3([0.6, 0.57, 0.42], [0.64, 0.6, 0.45], R()), R, 0.015), r: 1.0 + R() * 1.2 }; },   // (dry straw grass)
    tuft: (R) => vary(mix3([0.66, 0.62, 0.42], [0.74, 0.67, 0.44], R()), R, 0.03),   // (càrritx)
    bush: (R) => vary(R() < 0.6 ? [0.22, 0.27, 0.16] : [0.27, 0.31, 0.2], R, 0.025) };   // (maquis: mastic, holm oak scrub)
  const SCF = farBand(Object.assign({}, SCB, { step: 6, n: 3, reach: 55, share: 0.6, maxSl: 1.4, bushShare: 0.5,
    patch: (R, sl) => { const r = R();
      const P = r < 0.5 ? { col: vary(mix3([0.6, 0.59, 0.55], [0.65, 0.63, 0.58], R()), R, 0.015), r: 1.6 + R() * 1.8 }   // (limestone)
        : r < 0.7 ? { col: vary(mix3([0.54, 0.41, 0.31], [0.57, 0.44, 0.33], R()), R, 0.015), r: 1.4 + R() * 1.6 }   // (terra rossa)
        : { col: vary(mix3([0.58, 0.56, 0.42], [0.62, 0.59, 0.45], R()), R, 0.015), r: 1.8 + R() * 2.0 };   // (dry grass)
      return P; } }), 9);

  const add = (id, C, seed) => { if (LK[id]) chain(LK[id], (ctx) => {
    if (!ctx.out) return;
    const gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    if (C.v) ctx.out.robBt44 = verge(ctx.root, ctx.matV, gT, seed + 1, muted(C.v));
    ctx.out.bregBt44 = bank(ctx.root, ctx.matV, gT, ex, seed + 2, muted(C.b));
    ctx.out.dalBt44 = bank(ctx.root, ctx.matV, gT, ex, seed + 3, muted(C.f));
  }); };
  add('portomoniz', { v: PMV, b: PMB, f: PMF }, 44100);
  add('sacalobra', { b: SCB, f: SCF }, 44200);
})();
