/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the twenty-ninth group of the real tracks: Cusco and Ella, a
   second pass on the two roads whose ground the eleventh group (js/world-chase-bt11.js, Cusco's puna) and the twelfth
   (js/world-chase-bt12.js, Ella's wet hills) already set. From behind the car both still showed one even face beside the asphalt: the
   verge between the road and the barrier line in the shoulder's one colour and the bank above it bare until the tufts further out. So
   here, as the twenty-fifth and twenty-eighth groups did (js/world-chase-bt25.js, js/world-chase-bt28.js): on the verge's strip the
   patches and tufts of BT.verge (js/world-chase-bt24.js), on the bank that rises behind the barrier line BT.bank's low patches, tufts
   and, where it is gentle, low cushions, with what lies there in each place (docs/proge/cusco.md, docs/proge/ella.md). Nothing within
   0.4 m past the barrier line, nothing where another leg's road is nearer, in the builders' excluded places (Cusco's terrace walls,
   Ella's town), in Ella's streams, tea rows and fields. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the
   terrain, the road, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary } = API;
  if (!BT || !BT.verge || !BT.bank || !BT.mix3) return;
  const { mix3, verge, bank } = BT;
  // (as the twenty-fifth group: the colours half way to their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.9; return [(c[0] * 0.5 + l * 0.5) * f, (c[1] * 0.5 + l * 0.5) * f, (c[2] * 0.5 + l * 0.5) * f]; };
  const muted = (C) => Object.assign({}, C, { patch: (R, a, b) => { const P = C.patch(R, a, b); return { col: mute(P.col), r: P.r }; },
    tuft: (R, i) => mute(C.tuft(R, i), 0.95), bush: C.bush ? (R, i) => mute(C.bush(R, i), 0.97) : null });
  const P = (R, a, b, r0, r1) => ({ col: vary(mix3(a, b, R()), R, 0.015), r: r0 + R() * r1 });

  /* Cusco: docs/proge/cusco.md: »drevesa (evkaliptusi), trava, skale«, 3530-3590 m above the town, the road 7.6 m wide with no kerbs.
     On the verge the puna's grey-brown stony soil worn bare by the shoulder, the short green-olive grass of the open slopes and the ichu
     drying to straw, its straw tufts at the barrier's foot; on the bank the same soil and grass, the grey-brown bark and leaf litter of
     the eucalyptus, grey stones on the steeper parts, the ichu's tufts and, where it is gentle, here and there the blue-grey agave's low
     rosette (as bt11 has it further out). Nothing by the terrace walls (the builder's excluded places). */
  const CUV = { step: 2.6, share: 0.55, foot: 0.3,
    patch: (R) => { const r = R();
      return r < 0.35 ? P(R, [0.46, 0.42, 0.32], [0.5, 0.45, 0.34], 0.7, 0.9)   // (grey-brown stony soil)
        : r < 0.7 ? P(R, [0.47, 0.5, 0.29], [0.52, 0.53, 0.32], 0.8, 1.0)   // (short puna grass)
        : P(R, [0.58, 0.56, 0.36], [0.62, 0.59, 0.38], 0.7, 1.0); },   // (ichu drying to straw)
    tuft: (R) => vary(mix3([0.7, 0.64, 0.4], [0.58, 0.57, 0.33], R()), R, 0.03) };
  const CUB = { step: 2.6, n: 3, reach: 8, share: 0.5, maxSl: 1.5, sl: 0.85, bushShare: 0.2,
    patch: (R, sl) => { const r = R();
      return sl > 0.9 && r < 0.5 ? P(R, [0.52, 0.51, 0.47], [0.56, 0.54, 0.5], 0.6, 0.8)   // (grey stones)
        : r < 0.3 ? P(R, [0.46, 0.42, 0.32], [0.5, 0.45, 0.34], 0.9, 1.1)   // (soil)
        : r < 0.6 ? P(R, [0.46, 0.5, 0.29], [0.51, 0.53, 0.32], 0.9, 1.2)   // (puna grass)
        : r < 0.8 ? P(R, [0.42, 0.37, 0.29], [0.46, 0.4, 0.31], 0.9, 1.2)   // (eucalyptus bark and leaf litter)
        : P(R, [0.58, 0.56, 0.36], [0.62, 0.58, 0.38], 0.9, 1.1); },   // (straw ichu)
    tuft: (R) => vary(mix3([0.7, 0.64, 0.4], [0.58, 0.57, 0.33], R()), R, 0.03),
    bush: (R) => vary([0.46, 0.56, 0.54], R, 0.02) };   // (the agave's blue-grey rosette)

  /* Ella: docs/proge/ella.md: »travnata pobočja s posameznimi drevesi, temna tla gorskega gozda v grapah … Rdeča laterna zemlja ob robu
     ceste, v usekih in na dvoriščih, siva gnajs na golih stenah«, a drainage ditch and a strip of red earth along the edge. On the verge
     the red laterite in patches (it is the edge's own), the wet hills' short green grass and, in the forest (land cover 1), its dark
     litter, the tall green tufts at the barrier's foot; on the bank the laterite of the cuts, the grey gneiss grit on the steeper faces,
     the grass, the forest's dark litter under the trees, green tufts and, where it is gentle, ferns' low cushions. Nothing in a stream's
     bed (the builder's bad), in the tea rows, the fields or the town (land cover 6, 7, 5). */
  const lc = (x, z) => (API.vrLC ? API.vrLC(x, z) : 0);
  const ELV = { step: 2.6, share: 0.55, foot: 0.32,
    patch: (R) => { const r = R();
      return r < 0.4 ? P(R, [0.52, 0.34, 0.24], [0.56, 0.37, 0.26], 0.7, 0.9)   // (red laterite)
        : r < 0.8 ? P(R, [0.3, 0.46, 0.17], [0.36, 0.5, 0.2], 0.8, 1.0)   // (short wet grass)
        : P(R, [0.27, 0.27, 0.17], [0.31, 0.3, 0.19], 0.7, 0.9); },   // (dark forest litter)
    tuft: (R) => vary(mix3([0.3, 0.5, 0.17], [0.4, 0.55, 0.21], R()), R, 0.03) };
  const ELB = { step: 2.6, n: 3, reach: 8, share: 0.5, maxSl: 1.5, sl: 0.85, bushShare: 0.35,
    patch: (R, sl) => { const r = R();
      return sl > 0.9 && r < 0.45 ? P(R, [0.47, 0.45, 0.42], [0.52, 0.5, 0.46], 0.7, 0.9)   // (grey gneiss grit)
        : r < 0.35 ? P(R, [0.52, 0.34, 0.24], [0.56, 0.37, 0.26], 0.9, 1.1)   // (laterite of the cuts)
        : r < 0.7 ? P(R, [0.29, 0.45, 0.16], [0.35, 0.49, 0.2], 0.9, 1.2)   // (grass)
        : P(R, [0.25, 0.26, 0.16], [0.29, 0.29, 0.18], 0.9, 1.2); },   // (forest litter)
    tuft: (R) => vary(mix3([0.3, 0.5, 0.17], [0.4, 0.55, 0.21], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.23, 0.45, 0.14] : [0.21, 0.37, 0.15], R, 0.025),   // (fern, broad-leaved undergrowth)
    skip: (x, z) => { const c = lc(x, z); return c === 5 || c === 6 || c === 7; } };

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'cusco' || id === 'ella') try {
        const out = ctx.out, gT = (o && o.gH) || API.vrGround, ex = ctx.excluded || (() => false);
        const bad = o && o.bad ? (x, z) => ex(x, z) || o.bad(x, z) : ex;
        if (out && API.T) {
          if (id === 'cusco') { out.robBt29 = verge(ctx.root, out.matV, gT, 29101, muted(CUV)); out.bregBt29 = bank(ctx.root, out.matV, gT, bad, 29102, muted(CUB)); }
          else { out.robBt29 = verge(ctx.root, out.matV, gT, 29201, muted(ELV)); out.bregBt29 = bank(ctx.root, out.matV, gT, bad, 29202, muted(ELB)); }
        }
      } catch (e) { console.error('chase-bt29 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
