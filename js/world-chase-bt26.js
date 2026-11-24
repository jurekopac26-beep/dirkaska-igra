/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the twenty-sixth group of the real tracks: Bâlea and Furka, a
   second pass on two of the passes' roads (js/world-prelaz.js) whose pasture the eighth group (js/world-chase-bt8.js) and the passes' own
   build already set. Seen from behind the car both still showed one even face on each side: the wide verge between the asphalt and the
   steel barrier in one pale olive, and on the mountain's side the bank above it in the pasture's single green. So here, as the twenty-fifth
   group did on Gudauri (js/world-chase-bt25.js): on the verge's strip the twenty-fourth group's patches and tufts (BT.verge) with what lies
   there in each place (docs/proge/balea.md, docs/proge/furka.md), and on the bank that rises behind the barrier line (not where the ground
   falls) low patches lying on the terrain, tufts and, where it is gentle, the dark mats of the dwarf shrubs (BT.bank). Nothing within 0.4 m
   past the barrier line, nothing where another leg's road is nearer, in the builder's excluded places (the lake's huts and stalls, the car
   parks, the hotel, the lookout) or in the water. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the
   road, the barriers, the walls and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary } = API, LK = API.PL_LOOK;
  if (!BT || !BT.verge || !BT.bank || !BT.muted || !BT.chain || !LK || !vary) return;
  const { mix3, chain, verge, bank, muted } = BT;

  /* Bâlea: docs/proge/balea.md: »alpski pašniki s šopi trave … in nizkim cvetjem, v zaplatah ruševje in brin … Sivo-rjav kristalinski
     skrilavec v pečinah, ploščah in balvanih, melišča pod stenami«. On the wide verge the shoulder's grey-brown schist grit, the pasture's
     short grass grazed and going to straw, here and there bare brown earth; at the barrier's foot tufts of the pasture's grass. On the bank
     the pasture in greener and straw patches, the schist's scree on the steeper parts, tufts, and the dark dwarf pine and juniper mats. */
  const BLV = { step: 3.6, share: 0.6, foot: 0.15,
    patch: (R) => { const r = R();
      return r < 0.4 ? { col: vary(mix3([0.56, 0.55, 0.34], [0.6, 0.58, 0.36], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (short grass going to straw)
        : r < 0.75 ? { col: vary(mix3([0.5, 0.48, 0.44], [0.54, 0.51, 0.47], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (schist grit)
        : { col: vary([0.47, 0.42, 0.34], R, 0.015), r: 0.7 + R() * 0.8 }; },   // (bare brown earth)
    tuft: (R) => vary(mix3([0.44, 0.52, 0.25], [0.56, 0.55, 0.32], R()), R, 0.03) };
  const BLB = { step: 5, n: 2, reach: 7, share: 0.75, maxSl: 1.5, sl: 0.8, bushShare: 0.2,
    patch: (R, sl) => { const r = R();
      return sl > 1.0 && r < 0.5 ? { col: vary(mix3([0.5, 0.48, 0.45], [0.55, 0.53, 0.49], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (schist scree)
        : r < 0.55 ? { col: vary(mix3([0.38, 0.48, 0.22], [0.34, 0.46, 0.2], R()), R, 0.015), r: 1.0 + R() * 1.3 }   // (pasture, greener)
        : { col: vary(mix3([0.55, 0.55, 0.32], [0.52, 0.53, 0.31], R()), R, 0.015), r: 1.0 + R() * 1.2 }; },   // (pasture, straw)
    tuft: (R) => vary(mix3([0.55, 0.55, 0.32], [0.4, 0.5, 0.24], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.17, 0.27, 0.14] : [0.22, 0.3, 0.18], R, 0.025) };   // (dwarf pine, juniper)

  /* Furka: docs/proge/furka.md: »alpski pašniki s šopi trave in nizkim cvetjem, v zaplatah grmičevje … Svetlo siv granit in gnajs v
     pečinah, ploščah in balvanih, obsežna melišča in ledeniško poliran skalni svet«. On the wide verge the light grey granite grit and
     gravel, the short grass going to straw, the sparse green of the turf; at the barrier's foot tufts. On the bank the pasture in green and
     straw patches, the pale granite scree on the steeper parts, tufts, and the low alpine rose and juniper mats where it is gentle. Paler
     and greyer than Bâlea: the Aar massif's granite, not the brown schist. */
  const FKV = { step: 3.6, share: 0.6, foot: 0.15,
    patch: (R) => { const r = R();
      return r < 0.4 ? { col: vary(mix3([0.6, 0.6, 0.57], [0.64, 0.63, 0.6], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (granite grit and gravel)
        : r < 0.75 ? { col: vary(mix3([0.57, 0.56, 0.35], [0.6, 0.58, 0.37], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (short grass going to straw)
        : { col: vary(mix3([0.42, 0.5, 0.26], [0.45, 0.52, 0.28], R()), R, 0.015), r: 0.9 + R() * 1.0 }; },   // (green turf)
    tuft: (R) => vary(mix3([0.45, 0.52, 0.26], [0.57, 0.56, 0.34], R()), R, 0.03) };
  const FKB = { step: 5, n: 2, reach: 7, share: 0.75, maxSl: 1.5, sl: 0.8, bushShare: 0.15,
    patch: (R, sl) => { const r = R();
      return sl > 0.9 && r < 0.55 ? { col: vary(mix3([0.6, 0.6, 0.58], [0.64, 0.63, 0.61], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (granite scree)
        : r < 0.55 ? { col: vary(mix3([0.41, 0.5, 0.25], [0.36, 0.48, 0.22], R()), R, 0.015), r: 1.0 + R() * 1.3 }   // (pasture, greener)
        : { col: vary(mix3([0.56, 0.55, 0.34], [0.53, 0.53, 0.33], R()), R, 0.015), r: 1.0 + R() * 1.2 }; },   // (pasture, straw)
    tuft: (R) => vary(mix3([0.56, 0.55, 0.34], [0.41, 0.5, 0.25], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.2, 0.28, 0.16] : [0.26, 0.3, 0.2], R, 0.025) };   // (alpine rose, juniper)

  const add = (id, C, seed) => { if (LK[id]) chain(LK[id], (ctx) => {
    if (!ctx.out) return;
    const gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    ctx.out.robBt26 = verge(ctx.root, ctx.matV, gT, seed + 1, muted(C.v));
    ctx.out.bregBt26 = bank(ctx.root, ctx.matV, gT, ex, seed + 2, muted(C.b));
  }); };
  add('balea', { v: BLV, b: BLB }, 26100);
  add('furka', { v: FKV, b: FKB }, 26200);
})();
