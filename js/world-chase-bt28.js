/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the twenty-eighth group of the real tracks: Llogara and Los
   Caracoles, a second pass on the two roads whose ground the sixth group (js/world-chase-bt6.js, Llogara's karst) and the thirteenth
   (js/world-chase-bt13.js, Los Caracoles' three bands) already set. From behind the car both still showed one even face beside the
   asphalt: the verge between the road and the barrier line in the shoulder's one colour and, on the mountain's side, the bank above it
   bare until the bands further out. So here, as the twenty-fifth group did (js/world-chase-bt25.js): on the verge's strip the patches and
   tufts of BT.verge (js/world-chase-bt24.js), on the bank that rises behind the barrier line (not where the ground falls) BT.bank's low
   patches, tufts and, where it is gentle, low cushions, with what lies there in each place (docs/proge/llogara.md, docs/proge/caracoles.md).
   Nothing within 0.4 m past the barrier line, nothing where another leg's road is nearer, in the builders' excluded places (the pass's
   houses and car parks, Portillo), on Los Caracoles' snowfields. All of it in meshes of their own (softScen: 256 m chunks, no shadow);
   the terrain, the road, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary } = API;
  if (!BT || !BT.verge || !BT.bank || !BT.mix3) return;
  const { mix3, chain, verge, bank } = BT;
  // (as the twenty-fifth group: the colours half way to their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.9; return [(c[0] * 0.5 + l * 0.5) * f, (c[1] * 0.5 + l * 0.5) * f, (c[2] * 0.5 + l * 0.5) * f]; };
  const muted = (C) => Object.assign({}, C, { patch: (R, a, b) => { const P = C.patch(R, a, b); return { col: mute(P.col), r: P.r }; },
    tuft: (R, i) => mute(C.tuft(R, i), 0.95), bush: C.bush ? (R, i) => mute(C.bush(R, i), 0.97) : null });
  const P = (R, a, b, r0, r1) => ({ col: vary(mix3(a, b, R()), R, 0.015), r: r0 + R() * r1 });

  /* Llogara: docs/proge/llogara.md: »Severna stran je gozd jelke in črnega bora … Južno pobočje je golo sivo apnenčasto skalovje v rebrih in
     meliščih, vmes suha trava in temne zaplate makije«. The road climbs the north side to the pass and runs down the open south face, so
     the side of the pass is the road's index against its highest point (40 m short of it the pines stop by the road). North: on the verge
     the shoulder's grey grit, the brown needle litter of the pines and firs and the shaded forest grass, green tufts at the barrier's foot;
     on the bank the litter and the grass in patches, tufts, no shrubs under the trees. South and over the pass: on the verge the pale
     limestone grit and the dry grass going gold, straw tufts; on the bank the grit and the scree, the gold grass, tufts and the maquis's
     dark low clumps where it is gentle. */
  const LG = { top: 0 };
  const north = (i) => i < LG.top;
  const LGV = { step: 2.6, share: 0.55, foot: 0.32,
    patch: (R, i) => { const r = R();
      if (north(i)) return r < 0.4 ? P(R, [0.47, 0.38, 0.27], [0.52, 0.42, 0.3], 0.8, 1.0)   // (needle litter)
        : r < 0.7 ? P(R, [0.38, 0.43, 0.24], [0.42, 0.46, 0.27], 0.8, 1.0)   // (shaded forest grass)
        : P(R, [0.56, 0.55, 0.51], [0.6, 0.58, 0.54], 0.6, 0.8);   // (the shoulder's grit)
      return r < 0.45 ? P(R, [0.64, 0.63, 0.59], [0.69, 0.67, 0.62], 0.7, 0.9)   // (limestone grit)
        : P(R, [0.6, 0.55, 0.37], [0.65, 0.58, 0.4], 0.8, 1.1); },   // (dry grass going gold)
    tuft: (R, i) => vary(north(i) ? mix3([0.36, 0.44, 0.22], [0.42, 0.47, 0.26], R()) : mix3([0.62, 0.55, 0.36], [0.55, 0.52, 0.34], R()), R, 0.03) };
  const LGB = { step: 2.6, n: 3, reach: 8, share: 0.5, maxSl: 1.5, sl: 0.85, bushShare: 0.4,
    patch: (R, sl, i) => { const r = R();
      if (north(i)) return r < 0.55 ? P(R, [0.46, 0.37, 0.26], [0.5, 0.41, 0.29], 0.9, 1.2)   // (needle litter)
        : P(R, [0.36, 0.42, 0.23], [0.41, 0.45, 0.26], 0.9, 1.2);   // (forest grass)
      return sl > 0.9 || r < 0.45 ? P(R, [0.62, 0.61, 0.57], [0.68, 0.66, 0.61], 0.8, 1.1)   // (limestone grit, scree)
        : P(R, [0.6, 0.55, 0.37], [0.64, 0.58, 0.4], 0.9, 1.2); },   // (gold grass)
    tuft: (R, i) => vary(north(i) ? mix3([0.36, 0.44, 0.22], [0.42, 0.47, 0.26], R()) : mix3([0.62, 0.55, 0.36], [0.55, 0.52, 0.34], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.25, 0.31, 0.18] : [0.29, 0.34, 0.2], R, 0.025), bushAt: (i) => !north(i) };   // (the maquis: south only)
  const LK = API.PL_LOOK;
  if (LK && LK.llogara && chain) chain(LK.llogara, (ctx) => {
    if (!ctx.out || !API.T) return;
    const T = API.T, gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    let top = 0; for (let i = 1; i < T.hy.length; i++) if (T.hy[i] > T.hy[top]) top = i;
    LG.top = Math.max(0, top - Math.round(40 / T.ds));
    ctx.out.robBt28 = verge(ctx.root, ctx.matV, gT, 28101, muted(LGV));
    ctx.out.bregBt28 = bank(ctx.root, ctx.matV, gT, ex, 28102, muted(LGB));
  });

  /* Los Caracoles: docs/proge/caracoles.md: »gola pobočja iz sivega, rjastega in okrastega melišča in skal, ponekod svetla od vulkanskega
     pepela … ob cesti povsod drobno kamenje, šopi rumene trave (coirón) … nizko grmičevje, višje gor olivno zelene blazine (llareta)«. On
     the verge the fine stones in grey, rusty and ochre patches, the coirón's yellow tufts at the barrier's foot; on the bank the same scree
     with the pale ash here and there, the coirón's tufts, low grey-olive shrubs and, on the upper third of the climb, the llareta's olive
     cushions, sparser than on Llogara (the climb is 10.8 km: at Llogara's spacing it added 640 thousand vertices). Nothing on the snowfields
     and in Portillo (land cover 4 and 3). */
  const CA = { n: 0 };
  const CAV = { step: 3.4, share: 0.55, foot: 0.3,
    patch: (R) => { const r = R();
      return r < 0.45 ? P(R, [0.58, 0.56, 0.52], [0.62, 0.59, 0.54], 0.7, 0.9)   // (grey fine stones)
        : r < 0.75 ? P(R, [0.6, 0.5, 0.4], [0.64, 0.54, 0.43], 0.7, 0.9)   // (rusty)
        : P(R, [0.66, 0.58, 0.42], [0.69, 0.61, 0.45], 0.7, 0.9); },   // (ochre)
    tuft: (R) => vary(mix3([0.7, 0.62, 0.38], [0.6, 0.55, 0.4], R() * 0.6), R, 0.03) };
  const CAB = { step: 3.4, n: 2, reach: 8, share: 0.5, maxSl: 1.5, sl: 0.85, bushShare: 0.3,
    patch: (R, sl) => { const r = R();
      return r < 0.35 ? P(R, [0.57, 0.55, 0.51], [0.62, 0.59, 0.54], 0.9, 1.2)   // (grey scree)
        : r < 0.6 ? P(R, [0.6, 0.5, 0.4], [0.64, 0.53, 0.42], 0.9, 1.1)   // (rusty scree)
        : r < 0.85 || sl > 1.0 ? P(R, [0.66, 0.58, 0.42], [0.69, 0.61, 0.45], 0.9, 1.1)   // (ochre)
        : P(R, [0.71, 0.69, 0.64], [0.74, 0.72, 0.67], 0.8, 1.0); },   // (the pale volcanic ash)
    tuft: (R) => vary(mix3([0.7, 0.62, 0.38], [0.6, 0.55, 0.4], R() * 0.6), R, 0.03),
    bush: (R, i) => vary(i > CA.n * 0.66 && R() < 0.55 ? [0.44, 0.5, 0.26] : [0.47, 0.47, 0.33], R, 0.02),   // (llareta up high, else the low shrubs)
    skip: (x, z) => { const c = API.vrLC ? API.vrLC(x, z) : 0; return c === 3 || c === 4; } };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'caracoles') try {
        const out = ctx.out, gT = (o && o.gH) || API.vrGround, ex = ctx.excluded || (() => false);
        if (out && API.T) { CA.n = API.T.px.length;
          out.robBt28 = verge(ctx.root, out.matV, gT, 28201, muted(CAV)); out.bregBt28 = bank(ctx.root, out.matV, gT, ex, 28202, muted(CAB)); }
      } catch (e) { console.error('chase-bt28 (caracoles):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
