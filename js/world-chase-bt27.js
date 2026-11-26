/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the twenty-seventh group of the real tracks: Kotor and Koror, a
   second pass on the two roads whose ground behind the barrier the sixth and the eighth group already set (js/world-chase-bt6.js,
   js/world-chase-bt8.js). Seen from behind the car both still showed one even face on each side: on Kotor the verge between the asphalt
   and the low stone walls several metres wide in one olive grey, and above the upper walls the cut bank in one green; on Koror the
   verge along the causeways and the hill in one pale sand or one even green. So here, as on Chapman's Peak and Gudauri (js/world-chase-
   bt25.js): on the verge's strip the twenty-fourth group's patches and tufts (BT.verge) with what lies there in each place (docs/proge/
   kotor.md, docs/proge/koror.md), and on the bank that rises behind the barrier line (BT.bank: not where the ground falls, not in the sea)
   low patches lying on the terrain, tufts and, where it is not too steep, low cushions. All of it in meshes of their own (softScen: 256 m
   chunks, no shadow); the terrain, the road, the walls, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, LK = API.PL_LOOK, { vary } = API;
  if (!BT || !BT.verge || !BT.bank || !BT.muted || !BT.chain || !LK) return;
  const { mix3, chain, verge, bank, muted } = BT;

  /* Kotor: docs/proge/kotor.md: »Svetlo siv apnenec v rebrih, ploščah in golih kraških tleh, med njimi suho kraško grmovje (temno),
     zaplate suhe trave«, a clear summer afternoon. On the wide verge before the low walls the pale limestone grit, the bare grey karst
     ground and the dry grass in low patches, at the wall's foot tufts of the dry grass going gold; on the bank above the walls the pale
     bare limestone and the karst ground in patches, the dry grass in tufts and the dark low cushions of the karst scrub where it is
     gentle enough. */
  const KTV = { step: 2.4, share: 0.55, foot: 0.32,
    patch: (R) => { const r = R();
      return r < 0.38 ? { col: vary(mix3([0.7, 0.69, 0.64], [0.74, 0.72, 0.67], R()), R, 0.015), r: 0.7 + R() * 0.9 }   // (limestone grit)
        : r < 0.7 ? { col: vary(mix3([0.64, 0.6, 0.42], [0.68, 0.62, 0.43], R()), R, 0.015), r: 0.9 + R() * 1.1 }   // (dry grass)
        : { col: vary(mix3([0.55, 0.53, 0.47], [0.58, 0.55, 0.49], R()), R, 0.015), r: 0.8 + R() * 0.9 }; },   // (bare karst ground)
    tuft: (R) => vary(mix3([0.66, 0.6, 0.4], [0.74, 0.67, 0.42], R()), R, 0.03) };
  const KTB = { step: 2.6, n: 3, reach: 9, share: 0.5, maxSl: 1.6, sl: 0.9, bushShare: 0.4,
    patch: (R, sl) => { const r = R();
      return r < 0.4 || sl > 1.1 ? { col: vary(mix3([0.69, 0.68, 0.63], [0.73, 0.71, 0.66], R()), R, 0.015), r: 0.8 + R() * 1.1 }   // (bare limestone)
        : r < 0.75 ? { col: vary(mix3([0.63, 0.59, 0.41], [0.67, 0.61, 0.42], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (dry grass)
        : { col: vary([0.54, 0.52, 0.46], R, 0.015), r: 0.8 + R() * 0.9 }; },   // (karst ground)
    tuft: (R) => vary(mix3([0.66, 0.6, 0.4], [0.58, 0.58, 0.36], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.22, 0.29, 0.16] : [0.27, 0.32, 0.19], R, 0.025) };

  /* Koror: docs/proge/koror.md: »palme in grmovje, trava ob cesti«, »ob mostu in nasipih nizek zid in jeklena ograja, takoj za njima
     morsko dno«; its rock (the look's own) the islands' pale limestone, the soil the red-brown of the eighth group's bare patches. On the
     verge the green grass and the grass the sun dried in low patches, the pale limestone gravel of the fill and the red-brown soil here
     and there, at the barrier's foot lush tufts; on the bank on the hill the grass in green patches, the soil where the rain washes it,
     tufts and the dark low bushes. On the causeways the ground behind the wall falls to the seabed: no bank there. */
  const KRV = { step: 2.4, share: 0.55, foot: 0.35,
    patch: (R) => { const r = R();
      return r < 0.4 ? { col: vary(mix3([0.3, 0.5, 0.18], [0.34, 0.52, 0.2], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (green grass)
        : r < 0.65 ? { col: vary(mix3([0.46, 0.51, 0.26], [0.5, 0.53, 0.28], R()), R, 0.015), r: 0.9 + R() * 1.0 }   // (sun-dried grass)
        : r < 0.85 ? { col: vary(mix3([0.66, 0.64, 0.57], [0.7, 0.67, 0.6], R()), R, 0.015), r: 0.7 + R() * 0.8 }   // (limestone gravel)
        : { col: vary([0.5, 0.36, 0.26], R, 0.015), r: 0.6 + R() * 0.7 }; },   // (red-brown soil)
    tuft: (R) => vary(mix3([0.24, 0.48, 0.15], [0.34, 0.52, 0.2], R()), R, 0.03) };
  const KRB = { step: 2.6, n: 3, reach: 8, share: 0.45, maxSl: 1.4, sl: 0.9, bushShare: 0.5,
    patch: (R) => { const r = R();
      return r < 0.6 ? { col: vary(mix3([0.26, 0.48, 0.15], [0.32, 0.5, 0.19], R()), R, 0.015), r: 1.0 + R() * 1.3 }   // (grass)
        : r < 0.85 ? { col: vary(mix3([0.44, 0.5, 0.24], [0.48, 0.52, 0.26], R()), R, 0.015), r: 0.9 + R() * 1.0 }   // (drier grass)
        : { col: vary([0.5, 0.36, 0.26], R, 0.015), r: 0.7 + R() * 0.8 }; },   // (red-brown soil)
    tuft: (R) => vary(mix3([0.22, 0.46, 0.14], [0.32, 0.5, 0.19], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.12, 0.28, 0.1] : [0.16, 0.31, 0.12], R, 0.025) };

  const add = (id, seed, CV, CB) => { if (LK[id]) chain(LK[id], (ctx) => {
    if (!ctx.out) return;
    const gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    ctx.out.robBt27 = verge(ctx.root, ctx.matV, gT, seed, muted(CV));
    ctx.out.bregBt27 = bank(ctx.root, ctx.matV, gT, ex, seed + 1, muted(CB));
  }); };
  add('kotor', 27101, KTV, KTB);
  add('koror', 27201, KRV, KRB);
})();
