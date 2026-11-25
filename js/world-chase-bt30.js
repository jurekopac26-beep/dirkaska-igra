/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the thirtieth group of the real tracks: Savusavu and Santo Antão, a
   second pass on the two roads whose ground the eighth group (js/world-chase-bt8.js, Savusavu's tropical coast) and the twelfth
   (js/world-chase-bt12.js, Santo Antão's olive and straw slopes) already set. From behind the car both still showed one even face beside
   the road: on Savusavu the verge several metres wide (on average 6.8 m to the track's edge) in one light green, on Santo Antão the strip
   between the setts and the low basalt walls in one olive. So here, as the twenty-fifth and the twenty-eighth group did (js/world-chase-
   bt25.js, js/world-chase-bt28.js): on the verge's strip the patches and tufts of BT.verge (js/world-chase-bt24.js), on the bank that rises
   behind the barrier line (not where the ground falls) BT.bank's low patches, tufts and, where it is gentle, low cushions, with what lies
   there in each place (docs/proge/savusavu.md, docs/proge/santoantao.md). Nothing within 0.4 m past the barrier line, nothing where another
   leg's road is nearer, in the builders' excluded places (houses, the viewpoints). All of it in meshes of their own (softScen: 256 m chunks,
   no shadow); the terrain, the road, the walls, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary } = API;
  if (!BT || !BT.verge || !BT.bank || !BT.mix3) return;
  const { mix3, chain, verge, bank } = BT;
  // (as the twenty-fifth group: the colours toward their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  // (here only a third of the way and less darker: both verges are lighter and greener than the passes', a half-grey patch read as a grey sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const muted = (C) => Object.assign({}, C, { patch: (R, a, b) => { const P = C.patch(R, a, b); return { col: mute(P.col), r: P.r }; },
    tuft: (R, i) => mute(C.tuft(R, i), 0.95), bush: C.bush ? (R, i) => mute(C.bush(R, i), 0.97) : null });
  const P = (R, a, b, r0, r1) => ({ col: vary(mix3(a, b, R()), R, 0.015), r: r0 + R() * r1 });

  /* Savusavu: docs/proge/savusavu.md: »trava na planoti. Rdečerjava vulkanska prst v usekih, temen bazalt v redkih pečinah«, »rdečerjav prah
     vulkanske prsti, ki ga dež spere na rob asfalta«, a wet tropical island. On the wide verge the green grass, the grass the sun bleached in
     lighter patches and the red-brown soil the rain washed out of the cuts, lush tufts at the barrier's foot; on the bank the grass, the
     red-brown soil where the cut is steep, now and then the dark basalt's grit, tufts and the dark low bushes of the gardens and the forest's
     edge. */
  const SVV = { step: 2.4, share: 0.6, foot: 0.35,
    patch: (R) => { const r = R();
      return r < 0.45 ? P(R, [0.3, 0.5, 0.17], [0.35, 0.53, 0.2], 1.0, 1.3)   // (green grass)
        : r < 0.8 ? P(R, [0.46, 0.58, 0.26], [0.5, 0.6, 0.29], 0.9, 1.1)   // (sun-bleached grass)
        : P(R, [0.5, 0.34, 0.22], [0.55, 0.38, 0.25], 0.6, 0.8); },   // (red-brown volcanic soil)
    tuft: (R) => vary(mix3([0.22, 0.46, 0.14], [0.32, 0.52, 0.19], R()), R, 0.03) };
  const SVB = { step: 2.6, n: 3, reach: 8, share: 0.5, maxSl: 1.5, sl: 0.9, bushShare: 0.45,
    patch: (R, sl) => { const r = R();
      return sl > 1.0 && r < 0.5 ? P(R, [0.48, 0.3, 0.21], [0.54, 0.35, 0.24], 0.9, 1.1)   // (red-brown soil in the cut)
        : r < 0.6 ? P(R, [0.27, 0.48, 0.15], [0.33, 0.51, 0.19], 1.0, 1.3)   // (grass)
        : r < 0.88 ? P(R, [0.45, 0.52, 0.26], [0.5, 0.55, 0.29], 0.9, 1.1)   // (drier grass)
        : P(R, [0.3, 0.29, 0.27], [0.34, 0.32, 0.3], 0.6, 0.7); },   // (basalt grit)
    tuft: (R) => vary(mix3([0.22, 0.46, 0.14], [0.32, 0.5, 0.19], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.12, 0.29, 0.1] : [0.16, 0.32, 0.12], R, 0.025) };
  const LK = API.PL_LOOK;
  if (LK && LK.savusavu && chain) chain(LK.savusavu, (ctx) => {
    if (!ctx.out) return;
    const gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    ctx.out.robBt30 = verge(ctx.root, ctx.matV, gT, 30101, muted(SVV));
    ctx.out.bregBt30 = bank(ctx.root, ctx.matV, gT, ex, 30102, muted(SVB));
  });

  /* Santo Antão: docs/proge/santoantao.md: »Travnata in grmovnata vulkanska pobočja v olivno zeleni in slamnati barvi, vmes rdečerjava prst;
     na strmih pobočjih pasovi temnega bazalta in rdečkastega tufa«, »grmičevje, agave in šopi trave«. On the verge between the setts and the
     low walls the olive grass, the straw grass and the red-brown soil in low patches, the dark basalt's grit from the road's edge stones,
     tufts of the straw grass at the wall's foot; on the bank the same grass and soil, the reddish tuff where it is steep, tufts and the low
     grey-green shrubs where it is gentle. */
  const SAV = { step: 2.4, share: 0.55, foot: 0.32,
    patch: (R) => { const r = R();
      return r < 0.38 ? P(R, [0.42, 0.45, 0.25], [0.46, 0.48, 0.27], 0.9, 1.1)   // (olive grass)
        : r < 0.68 ? P(R, [0.6, 0.56, 0.34], [0.64, 0.59, 0.37], 0.8, 1.0)   // (straw grass)
        : r < 0.88 ? P(R, [0.52, 0.36, 0.26], [0.56, 0.39, 0.28], 0.7, 0.8)   // (red-brown soil)
        : P(R, [0.33, 0.32, 0.3], [0.37, 0.35, 0.33], 0.6, 0.6); },   // (basalt grit)
    tuft: (R) => vary(mix3([0.64, 0.58, 0.38], [0.5, 0.5, 0.3], R()), R, 0.03) };
  const SAB = { step: 2.6, n: 3, reach: 8, share: 0.5, maxSl: 1.5, sl: 0.85, bushShare: 0.4,
    patch: (R, sl) => { const r = R();
      return sl > 1.0 && r < 0.45 ? P(R, [0.56, 0.4, 0.31], [0.6, 0.43, 0.33], 0.9, 1.0)   // (reddish tuff)
        : r < 0.45 ? P(R, [0.41, 0.44, 0.24], [0.45, 0.47, 0.26], 1.0, 1.2)   // (olive grass)
        : r < 0.8 ? P(R, [0.61, 0.56, 0.37], [0.65, 0.59, 0.4], 0.9, 1.1)   // (straw grass)
        : P(R, [0.51, 0.35, 0.25], [0.55, 0.38, 0.27], 0.8, 0.9); },   // (red-brown soil)
    tuft: (R) => vary(mix3([0.64, 0.58, 0.38], [0.5, 0.5, 0.3], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.36, 0.41, 0.27] : [0.4, 0.44, 0.31], R, 0.025) };   // (grey-green low shrubs)
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'santoantao') try {
        const out = ctx.out, gT = (o && o.gH) || API.vrGround, ex = ctx.excluded || (() => false);
        if (out && API.T) { out.robBt30 = verge(ctx.root, out.matV, gT, 30201, muted(SAV)); out.bregBt30 = bank(ctx.root, out.matV, gT, ex, 30202, muted(SAB)); }
      } catch (e) { console.error('chase-bt30 (santoantao):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
