/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the thirty-second group of the real tracks: Hakone and Rio do Rastro,
   a second pass on the two mountain roads whose ground the tenth group (js/world-chase-bt10.js: ferns, sasa and pampas grass past the
   barrier line) and the fifteenth (js/world-chase-bt15.js: the eleventh group's three bands) already set. From behind the car both still
   showed one even face beside the asphalt: the verge between the shoulder and the barrier line in its one colour and, on the mountain's
   side, the bank just past the barrier bare until the plants further out. So here, as the thirty-first group did (js/world-chase-bt31.js:
   BT.strip and BT.face with each track's own nearest road point, ground and verge cross-section, here the builders' own vp rows), on the
   verge's strip low patches and at its outer edge a few low tufts, on the bank low patches, tufts and, on the steep faces, the rock's own
   patches. What lies where follows docs/proge/hakone.md and docs/proge/rastro.md. Nothing within 0.35 m of the barrier line on the road's
   side, nothing where another leg's road is nearer, in the builders' excluded places (Hakone's villages, its railway's bed, the lakes;
   Rio do Rastro's yards, the viewpoint, the falls), on a bridge or above a retaining wall. All of it in meshes of their own (softScen:
   256 m chunks, no shadow); the terrain, the road, the verges, the barriers, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary } = API;
  if (!BT || !BT.strip || !BT.face || !BT.mix3) return;
  const { strip, face, mix3 } = BT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // (as the thirty-first group: a fifth of the way to their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const P = (R, a, b, r0, r1) => ({ col: mute(vary(mix3(a, b, R()), R, 0.015)), r: r0 + R() * r1 });
  const T_ = (R, a, b) => mute(vary(mix3(a, b, R()), R, 0.03), 0.95);
  const ownSlope = (gT) => (x, z) => { const d = 0.8; return Math.hypot(gT(x + d, z) - gT(x - d, z), gT(x, z + d) - gT(x, z - d)) / (2 * d); };

  /* Hakone: docs/proge/hakone.md: »ob cesti nizek bambus sasa«, »listavci, manj kriptomerij … javorji ob cesti (jeseni rdeči)«, the build's
     ground (js/world-hakone.js hkCol): the mown verge, under the forest its dark floor of ferns and sasa, grey-brown andesite and soil on the
     steep faces. On the verge the mown grass in greener and yellower patches, the shoulder's grey grit washed onto it, under the trees the
     dark leaf litter and moss (in autumn the maples' red and the fresh fallen brown leaves), at the barrier's foot the uncut grass in tufts;
     on the bank the litter and moss in the woods, the grass and bare soil on the open ground, on the cuts' steep faces the andesite and the
     soil in grey-brown and darker patches with moss in their seams. Nothing in the villages (lc 3), the water (4) or on the railway's bed. */
  const hkV = (lc, su) => ({ step: 3.0, share: 0.55, foot: 0.22,
    e1: (i, bar) => bar - 0.35,
    patch: (R, i, x, z) => { const r = R(), wood = lc && lc(x, z) === 1;
      if (wood && r < 0.5) return su ? P(R, [0.3, 0.27, 0.18], [0.33, 0.36, 0.2], 0.6, 0.7) : (R() < 0.35 ? P(R, [0.6, 0.3, 0.18], [0.64, 0.36, 0.2], 0.5, 0.6) : P(R, [0.5, 0.36, 0.2], [0.55, 0.4, 0.22], 0.6, 0.7));   // (litter, moss; the maples' red)
      return r < 0.4 ? (su ? P(R, [0.38, 0.52, 0.2], [0.44, 0.55, 0.24], 0.6, 0.8) : P(R, [0.56, 0.52, 0.3], [0.6, 0.55, 0.32], 0.6, 0.8))   // (mown grass, the fresher)
        : r < 0.7 ? (su ? P(R, [0.5, 0.54, 0.28], [0.55, 0.56, 0.3], 0.6, 0.7) : P(R, [0.66, 0.58, 0.36], [0.7, 0.62, 0.4], 0.6, 0.7))   // (the drier, yellower)
        : P(R, [0.62, 0.61, 0.57], [0.66, 0.64, 0.6], 0.4, 0.5); },   // (the shoulder's grey grit)
    tuft: (R) => su ? T_(R, [0.36, 0.52, 0.18], [0.52, 0.56, 0.3]) : T_(R, [0.62, 0.54, 0.3], [0.76, 0.66, 0.42]) });
  const hkB = (lc, su) => ({ step: 4.0, n: 2, reach: 9, share: 0.75, maxSl: 3.0, steep: 1.05, rockShare: 0.7, stoneShare: 0.03, sl: 0.8, bushShare: 0,
    o0: (bar) => bar + 1.2,
    rock: (R, sl) => { const r = R();
      return r < 0.45 ? P(R, [0.52, 0.48, 0.42], [0.56, 0.52, 0.45], 0.9, 1.0)   // (grey-brown andesite)
        : r < 0.75 ? P(R, [0.5, 0.42, 0.32], [0.54, 0.45, 0.34], 0.8, 0.9)   // (its soil)
        : P(R, [0.34, 0.4, 0.24], [0.38, 0.43, 0.26], 0.7, 0.8 + 0.2 * Math.min(1, sl - 1)); },   // (moss in the seams)
    stone: (R) => vary([0.46, 0.45, 0.42], R, 0.06),
    patch: (R, sl, i, x, z) => { const r = R(), wood = lc && lc(x, z) === 1;
      if (wood) return r < 0.55 ? (su ? P(R, [0.3, 0.27, 0.18], [0.34, 0.3, 0.2], 0.9, 1.1) : P(R, [0.5, 0.36, 0.2], [0.56, 0.38, 0.22], 0.9, 1.1)) : P(R, [0.3, 0.37, 0.2], [0.34, 0.4, 0.22], 0.8, 1.0);   // (litter, moss)
      return r < 0.35 ? P(R, [0.5, 0.42, 0.32], [0.54, 0.45, 0.34], 0.7, 0.9)   // (bare soil)
        : su ? P(R, [0.38, 0.5, 0.2], [0.46, 0.54, 0.26], 0.9, 1.1) : P(R, [0.62, 0.55, 0.33], [0.68, 0.6, 0.38], 0.9, 1.1); },   // (grass)
    tuft: (R) => su ? T_(R, [0.36, 0.52, 0.18], [0.5, 0.55, 0.28]) : T_(R, [0.62, 0.54, 0.3], [0.78, 0.68, 0.44]),
    skip: (x, z) => { const c = lc ? lc(x, z) : 0; return c === 3 || c === 4 || c === 5; } });

  /* Rio do Rastro: docs/proge/rastro.md: »Atlantski deževni gozd … bambus in grmovje ob robovih«, »Pečine: navpične stene iz temnega bazalta
     (zgoraj) in rožnatega peščenjaka (spodaj) v plasteh, z mahom v razpokah«, »Planota: travišče«; the build's ground (js/world-rastro.js
     rrCol): the red earth of a trodden verge. On the verge the red earth in low patches, the wet dark moss and the forest's brown litter by
     the trees, the basalt's grey grit, at the barrier's foot the lush green grass (on the plateau straw-tinged) in tufts; on the bank the
     litter and moss in the forest, the red earth and grass on the open ground, on the steep cuts the rock in its layers: dark basalt above
     ~1150 m, the pink and ochre sandstone below, moss in the cracks. Nothing in the yards (lc 3), the water (5) or where the ground falls to the valley. */
  const rrV = (lc, alt) => ({ step: 2.8, share: 0.55, foot: 0.25,
    e1: (i, bar) => bar - 0.35,
    patch: (R, i, x, z) => { const r = R(), wood = lc && lc(x, z) === 1;
      if (wood && r < 0.5) return R() < 0.5 ? P(R, [0.4, 0.29, 0.2], [0.44, 0.32, 0.22], 0.6, 0.7) : P(R, [0.24, 0.32, 0.16], [0.28, 0.36, 0.18], 0.5, 0.7);   // (leaf litter, wet moss)
      return r < 0.45 ? P(R, [0.56, 0.34, 0.24], [0.6, 0.38, 0.27], 0.6, 0.8)   // (red earth)
        : r < 0.7 ? P(R, [0.45, 0.44, 0.42], [0.5, 0.48, 0.45], 0.4, 0.6)   // (basalt grit)
        : alt(i) > 1360 ? P(R, [0.6, 0.57, 0.33], [0.56, 0.55, 0.3], 0.6, 0.7) : P(R, [0.3, 0.45, 0.18], [0.36, 0.48, 0.2], 0.6, 0.7); },   // (grass: plateau straw, lush below)
    tuft: (R, i) => alt(i) > 1360 ? T_(R, [0.4, 0.5, 0.22], [0.64, 0.6, 0.38]) : T_(R, [0.28, 0.46, 0.16], [0.4, 0.52, 0.22]) });
  const rrB = (lc, alt) => ({ step: 3.6, n: 2, reach: 10, share: 0.75, maxSl: 3.4, steep: 1.0, rockShare: 0.7, stoneShare: 0.04, sl: 0.8, bushShare: 0,
    o0: (bar) => bar + 1.6,
    rock: (R, sl, i) => { const r = R(), hi = alt(i) > 1150;
      if (r < 0.25) return P(R, [0.28, 0.36, 0.2], [0.32, 0.4, 0.22], 0.6, 0.7);   // (moss in the cracks)
      return hi ? (r < 0.65 ? P(R, [0.34, 0.33, 0.32], [0.38, 0.37, 0.35], 0.9, 1.1) : P(R, [0.42, 0.4, 0.37], [0.46, 0.43, 0.4], 0.8, 1.0))   // (dark basalt, weathered)
        : (r < 0.65 ? P(R, [0.66, 0.52, 0.46], [0.7, 0.56, 0.48], 0.9, 1.1) : P(R, [0.66, 0.56, 0.38], [0.7, 0.6, 0.42], 0.8, 1.0)); },   // (pink, ochre sandstone)
    stone: (R, ) => vary([0.38, 0.37, 0.35], R, 0.06),
    patch: (R, sl, i, x, z) => { const r = R(), wood = lc && lc(x, z) === 1;
      if (wood) return r < 0.55 ? P(R, [0.4, 0.29, 0.2], [0.44, 0.32, 0.22], 0.9, 1.1) : P(R, [0.24, 0.33, 0.16], [0.28, 0.37, 0.18], 0.8, 1.0);   // (litter, moss)
      return r < 0.4 ? P(R, [0.56, 0.35, 0.25], [0.6, 0.38, 0.27], 0.8, 1.0)   // (red earth)
        : alt(i) > 1360 ? P(R, [0.6, 0.57, 0.33], [0.52, 0.53, 0.28], 0.9, 1.1) : P(R, [0.3, 0.45, 0.18], [0.36, 0.48, 0.2], 0.9, 1.1); },   // (grass)
    tuft: (R, x, z) => T_(R, [0.3, 0.46, 0.17], [0.46, 0.52, 0.26]),
    skip: (x, z) => { const c = lc ? lc(x, z) : 0; return c === 3 || c === 5; } });

  const run = (ctx, id, o) => {
    const out = ctx.out, T = API.T, near = o.near, gT = o.gH;
    if (!out || !out.matV || !ctx.root || !T || !T.br || !near || !gT || !o.prof) return;
    const ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || (o.bad ? o.bad(x, z) : false), slope = o.slope || ownSlope(gT);
    const wAt = (i) => (T.wAt ? T.wAt(i) : T.w), C0 = { prof: o.prof, skip: bad };
    if (id === 'hakone') {
      C0.e0 = (i) => wAt(i) + 0.9;
      out.robBt32 = strip(ctx.root, out.matV, T, near, gT, 32101, Object.assign(hkV(o.lc, o.summer), C0));
      out.bregBt32 = face(ctx.root, out.matV, T, near, gT, slope, bad, 32102, hkB(o.lc, o.summer));
    } else if (id === 'rastro') {
      const base = API.VR && API.VR.D ? API.VR.D.base : 0, alt = (i) => T.hy[clamp(i, 0, T.hy.length - 1)] + base;
      C0.e0 = (i) => wAt(i) + 0.8;
      out.robBt32 = strip(ctx.root, out.matV, T, near, gT, 32201, Object.assign(rrV(o.lc, alt), C0));
      out.bregBt32 = face(ctx.root, out.matV, T, near, gT, slope, bad, 32202, rrB(o.lc, alt));
    }
  };

  World.ext = World.ext || {};
  if (World.ext.hakoneRob) {   // (Hakone's own builder: js/world-hakone.js calls it after its plants with its vp rows)
    const base = World.ext.hakoneRob;
    World.ext.hakoneRob = function (ctx) {
      const r = base.call(this, ctx);
      try { if (ctx && ctx.prof) run(Object.assign({}, ctx, { out: ctx.out }), 'hakone', { near: API.vrNear, gH: API.vrGround, slope: API.vrSlope, lc: API.vrLC, summer: ctx.summer, prof: ctx.prof,
        bad: (x, z) => (ctx.railD && ctx.railD(x, z) < 3.2) || (API.vrWater && API.vrWater(x, z).e > -1) }); } catch (e) { console.error('chase-bt32 (hakone):', e); }
      return r;
    };
  }
  if (World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'rastro' && o && o.prof) try { run(ctx, id, o); } catch (e) { console.error('chase-bt32 (rastro):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
