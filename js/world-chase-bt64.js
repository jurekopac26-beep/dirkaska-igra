/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixty-fourth group of the real tracks: Cusco and Ghoufi, a
   third pass on two roads whose near ground the eleventh, the twenty-ninth (Cusco) and the thirty-sixth (Ghoufi) groups already set.
   From behind the car what was left even was further out:
   - Cusco (js/world-chase-bt29.js stops ~7 m behind the barrier line): past the bank the puna's slopes up to the eucalyptus stood as one
     smooth olive face to ~60 m, with only the builder's few pale stones on it. So a sparse outer band from ~7.5 m to ~55 m on both sides:
     wide low patches of the puna's own ground (docs/proge/cusco.md: »drevesa (evkaliptusi), trava, skale«), the short grass a shade
     darker or lighter, the ichu drying to straw, the grey-brown soil, the eucalyptus' litter and, where it is steeper, grey stones;
     now and then an ichu tuft. Nothing by the terrace walls (the builder's excluded places) or where another leg's road is nearer.
   - Ghoufi (js/world-chase-bt36.js's outer band only goes where the ground rises from the road, by design): on the canyon's side, where
     the ground falls from the barrier line towards the village and the oasis (docs/proge/ghoufi.md: »Kanjon: ves čas levo od ceste«),
     the falling rim was one ochre colour. So there, from ~1.5 m behind the barrier line to ~35 m and only where the ground is lower than
     the road, the rim's own rock: darker ochre ledges, pale marl scree, the grey-ochre gravel washed down, dry grass in the gentler
     places and alfa tufts. Nothing in the village or by the viewpoint (the builder's excluded places) or on the very steep wall.
   All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.mix3 || !rng) return;
  const { soil, tuft, softScen, mix3 } = BT;
  const P = (R, a, b, r0, r1) => ({ col: vary(mix3(a, b, R()), R, 0.015), r: r0 + R() * r1 });
  // (as the twenty-fifth and thirty-sixth groups: a little way to grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const soft = (c, g, f) => { const l = (c[0] + c[1] + c[2]) / 3; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };

  /* the band: every `step` m along the road on both sides a place from C.from m past the barrier line to C.to m, only where this leg's
     road is the nearest, not in `bad`, where the ground is within C.below .. C.above m of the road's height there and its slope under
     C.maxSl; there a wide low patch (C.patch(R, sl)) or now and then a tuft (C.tuft(R)). C.side: only on that side (-1 left, 1 right) */
  const band = (root, matV, gT, near, bad, seed, C) => {
    const T = API.T, st = { pas: 0, pasSopi: 0 };
    if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), sc = softScen(root, matV), N = T.px.length;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R();
      if (C.side && sd !== C.side) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      const o = bar + C.from + Math.pow(r1, C.pow || 0.8) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (!q || q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || Math.abs(q.lat) < bar + C.from - 0.5) continue;
      if (bad(x, z)) continue;
      const y = gT(x, z), dy = y - T.hy[i]; if (!(dy > C.below && dy < C.above)) continue;
      const sl = slope(x, z); if (sl > C.maxSl) continue;
      if (r0 < C.share) { const p = C.patch(R, sl); soil(sc, gT, x, z, p.r, p.col, R, C.lift || 0.08); st.pas++; }
      else if (C.tuft && sl < (C.tuftSl || 1)) { const h = R(); tuft(sc.get(x, z), x, y, z, 0.26 + h * 0.22, 0.3 + h * 0.34, C.tuft(R), R, 5); st.pasSopi++; }
    }
    sc.done();
    return st;
  };

  /* Cusco: the puna's slopes behind the bank, 3530-3590 m. Colours from the twenty-ninth group's (the same ground), wider and a step
     softer further out; muted half way to grey as there. */
  const cuMute = (c) => soft(c, 0.3, 0.95);
  const CUP = { step: 2.6, from: 5, to: 55, pow: 1.15, share: 0.8, below: -40, above: 40, maxSl: 1.4, tuftSl: 0.9, lift: 0.1,
    patch: (R, sl) => { const r = R(), p = sl > 0.75 && r < 0.45 ? P(R, [0.52, 0.51, 0.47], [0.57, 0.55, 0.5], 1.2, 1.0)   // (grey stones on the steeper parts)
        : r < 0.28 ? P(R, [0.36, 0.42, 0.22], [0.39, 0.44, 0.23], 2.0, 1.2)   // (the short grass, a shade darker)
        : r < 0.5 ? P(R, [0.55, 0.56, 0.34], [0.58, 0.58, 0.36], 2.0, 1.2)   // (the short grass, a shade lighter and drier)
        : r < 0.72 ? P(R, [0.66, 0.62, 0.41], [0.7, 0.65, 0.43], 1.8, 1.0)   // (ichu drying to straw)
        : r < 0.88 ? P(R, [0.46, 0.42, 0.32], [0.5, 0.45, 0.34], 1.6, 1.0)   // (grey-brown stony soil)
        : P(R, [0.42, 0.37, 0.29], [0.46, 0.4, 0.31], 1.6, 1.0);   // (eucalyptus bark and leaf litter)
      return { col: cuMute(p.col), r: p.r }; },
    tuft: (R) => cuMute(vary(mix3([0.7, 0.64, 0.4], [0.58, 0.57, 0.33], R()), R, 0.03)) };

  /* Ghoufi: the canyon's falling rim. The ground's own warm ochre, only a quarter of the way to grey and a sixth darker, as the
     thirty-sixth group found (a greyer patch read as a grey sticker on this ochre). */
  const ghMute = (c) => soft(c, 0.2, 0.9);
  const GHK = { step: 2.6, from: 1.5, to: 35, pow: 1.2, share: 0.82, below: -60, above: -0.4, maxSl: 2.2, tuftSl: 1.1, lift: 0.1,
    patch: (R, sl) => { const r = R(), p = sl > 1.1 && r < 0.6 ? P(R, [0.5, 0.36, 0.23], [0.54, 0.39, 0.25], 1.3, 1.2)   // (darker ochre rock ledge)
        : r < 0.32 ? P(R, [0.58, 0.42, 0.27], [0.62, 0.45, 0.29], 1.4, 1.2)   // (ochre rock and soil)
        : r < 0.6 ? P(R, [0.78, 0.65, 0.47], [0.8, 0.67, 0.49], 1.0, 1.0)   // (pale marl scree)
        : r < 0.82 ? P(R, [0.7, 0.55, 0.37], [0.73, 0.58, 0.39], 1.0, 0.9)   // (grey-ochre gravel washed down)
        : P(R, [0.66, 0.56, 0.36], [0.63, 0.53, 0.34], 1.2, 1.0);   // (dry grass)
      return { col: ghMute(p.col), r: p.r }; },
    tuft: (R) => ghMute(vary(mix3([0.55, 0.56, 0.36], [0.66, 0.6, 0.41], R()), R, 0.03)) };   // (alfa)

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'cusco' || id === 'ghoufi') try {
        const out = ctx.out, gT = (o && o.gH) || API.vrGround, ex = ctx.excluded || (() => false);
        const bad = o && o.bad ? (x, z) => ex(x, z) || o.bad(x, z) : ex, near = (o && o.near) || API.vrNear;
        if (out && API.T) {
          if (id === 'cusco') out.pasBt64 = band(ctx.root, out.matV, gT, near, bad, 64101, CUP);
          else out.pasBt64 = band(ctx.root, out.matV, gT, near, bad, 64201, GHK);
        }
      } catch (e) { console.error('chase-bt64 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK, hjLC, pkLC and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
