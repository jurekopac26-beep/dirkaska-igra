/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixty-sixth group of the real tracks: Los Caracoles and
   Santo Antão, a third pass. The thirteenth and twenty-eighth groups (js/world-chase-bt13.js, js/world-chase-bt28.js) set Los Caracoles'
   verge and the bank to ~8 m, the twelfth and thirtieth (js/world-chase-bt12.js, js/world-chase-bt30.js) Santo Antão's; from behind the
   car past ~9 m both slopes still read as one face up to the horizon: on Los Caracoles one grey-ochre scree, on Santo Antão one olive
   (and the bank stopped where the ground falls, which on Delgadim's ridge is most of the view). So here a sparser band of wider low
   patches, a few tufts and cushions from ~9 m to ~55 m past the barrier line, with what lies there (docs/proge/caracoles.md,
   docs/proge/santoantao.md): on Los Caracoles the grey, rusty and ochre scree, the pale ash, darker rock bands on the steeper parts, the
   coirón's tufts and higher up the llareta; on Santo Antão the olive and straw grass, the red-brown soil, the dark basalt bands on the
   steeper parts, the low grey-green shrubs, and here also on the slopes that fall below the road (only where they are not sheer). Never
   on the snowfields or in Portillo (land cover 4 and 3), on built ground or water, where another leg's road is nearer, in the builders'
   excluded places (the galleries, the viewpoints, the houses). All of it in meshes of their own (softScen: 256 m chunks, no shadow); the
   terrain, the road, the walls, the barriers and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.mix3 || !BT.muted || !vary || !rng) return;
  const { soil, tuft, cushion, softScen, mix3, muted } = BT;
  const P = (R, a, b, r0, r1) => ({ col: vary(mix3(a, b, R()), R, 0.015), r: r0 + R() * r1 });

  /* the far band: every C.step m on both sides C.n places from C.from to C.reach m past the barrier line (denser near, by r^1.2);
     only this leg's ground (no other leg's road nearer), not a face steeper than C.maxSl, and below the road only with C.fall
     (down to C.drop m under it: the slope the chase camera looks down on, not the valley's floor) */
  const far = (root, matV, gT, bad, seed, C) => {
    const T = API.T, near = API.vrNear, st = { dal: 0, dalSopi: 0, dalGrmi: 0 };
    if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length, span = C.reach - C.from;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const r0 = R(), r1 = R(), r2 = R(), r3 = R(), u = Math.pow(r1, 1.2);
        const o = bar + C.from + u * span, a = (r2 - 0.5) * C.step;
        const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || Math.abs(q.lat) < bar + C.from - 0.5) continue;
        if (bad(x, z) || (C.skip && C.skip(x, z, i))) continue;
        const y = gT(x, z), dy = y - T.hy[i];
        if (!(dy > -0.6) && !(C.fall && dy > -C.drop)) continue;
        const sl = slope(x, z); if (sl > C.maxSl) continue;
        const kk = 1 + 0.6 * u;   // (wider further out: the same patch reads smaller there)
        if (r0 < C.share) { const p = C.patch(R, sl, i); soil(soft, gT, x, z, p.r * kk, p.col, R, 0.06); st.dal++; }
        else if (C.bush && sl < C.sl && r3 < C.bushShare && (!C.bushAt || C.bushAt(i))) { const h = R(); cushion(soft.get(x, z), x, y, z, (0.5 + h * 0.5) * kk, 0.3 + h * 0.3, C.bush(R, i), R); st.dalGrmi++; }
        else if (u < 0.45) { const h = R(); tuft(soft.get(x, z), x, y, z, 0.26 + h * 0.2, 0.3 + h * 0.28, C.tuft(R, i), R, 5); st.dalSopi++; }
      }
    }
    soft.done();
    return st;
  };
  BT.far = far;   // (for the later groups: the same band on another road)
  // (in the far band the flat patches came out lighter than the shaded terrain around them: a little darker, as skupina 44 did)
  const dim = (C, k) => Object.assign({}, C, { patch: (R, sl, i) => { const p = C.patch(R, sl, i); return { col: p.col.map(v => v * k), r: p.r }; } });

  /* Los Caracoles: docs/proge/caracoles.md: »Gola pobočja iz sivega, rjastega in okrastega melišča in skal, ponekod svetla od vulkanskega
     pepela, plasti kamnine na strmih …«, »šopi rumene trave (coirón) … nizko grmičevje, višje gor olivno zelene blazine (llareta)«. The
     scree in its three colours in wide flat patches, the pale ash rarer, the darker rock bands where it is steep; the coirón's tufts near,
     on the upper third the llareta's cushions, else the low grey-olive shrubs (sparse: the climb is 10.8 km). */
  const CA = { n: 0 };
  const CAF = { step: 6, n: 3, from: 9, reach: 55, share: 0.72, maxSl: 1.5, sl: 0.8, bushShare: 0.35, fall: false,
    patch: (R, sl) => { const r = R();
      return sl > 0.9 && r < 0.4 ? P(R, [0.46, 0.43, 0.4], [0.5, 0.46, 0.42], 1.4, 1.6)   // (darker rock bands on the steep parts)
        : r < 0.35 ? P(R, [0.57, 0.55, 0.51], [0.61, 0.58, 0.53], 1.6, 1.8)   // (grey scree)
        : r < 0.62 ? P(R, [0.6, 0.5, 0.4], [0.63, 0.53, 0.42], 1.5, 1.6)   // (rusty scree)
        : r < 0.88 ? P(R, [0.65, 0.57, 0.42], [0.68, 0.6, 0.45], 1.5, 1.6)   // (ochre)
        : P(R, [0.7, 0.68, 0.63], [0.73, 0.71, 0.66], 1.2, 1.3); },   // (the pale volcanic ash)
    tuft: (R) => vary(mix3([0.7, 0.62, 0.38], [0.6, 0.55, 0.4], R() * 0.6), R, 0.03),
    bush: (R, i) => vary(i > CA.n * 0.66 && R() < 0.6 ? [0.44, 0.5, 0.26] : [0.47, 0.47, 0.33], R, 0.02),
    skip: (x, z) => { const c = API.vrLC ? API.vrLC(x, z) : 0; return c === 3 || c === 4 || c === 5; } };

  /* Santo Antão: docs/proge/santoantao.md: »Travnata in grmovnata vulkanska pobočja v olivno zeleni in slamnati barvi, vmes rdečerjava
     prst; na strmih pobočjih pasovi temnega bazalta in rdečkastega tufa«, »grmičevje, agave in šopi trave«. On the slopes above and below
     the ridge road the olive and the straw grass in wide patches, the red-brown soil, the dark basalt and the reddish tuff where it is
     steep, the straw tufts near and the low grey-green shrubs. */
  const SAF = { step: 6, n: 2, from: 9, reach: 55, share: 0.65, maxSl: 1.4, sl: 0.85, bushShare: 0.4, fall: true, drop: 40,
    patch: (R, sl) => { const r = R();
      return sl > 0.9 && r < 0.3 ? P(R, [0.3, 0.29, 0.27], [0.34, 0.32, 0.3], 1.3, 1.4)   // (dark basalt bands)
        : sl > 0.9 && r < 0.45 ? P(R, [0.55, 0.4, 0.31], [0.58, 0.42, 0.33], 1.3, 1.4)   // (reddish tuff)
        : r < 0.5 ? P(R, [0.41, 0.44, 0.24], [0.45, 0.47, 0.26], 1.6, 1.8)   // (olive grass)
        : r < 0.8 ? P(R, [0.6, 0.55, 0.36], [0.64, 0.58, 0.39], 1.5, 1.6)   // (straw grass)
        : P(R, [0.51, 0.35, 0.25], [0.55, 0.38, 0.27], 1.3, 1.4); },   // (red-brown soil)
    tuft: (R) => vary(mix3([0.64, 0.58, 0.38], [0.5, 0.5, 0.3], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.36, 0.41, 0.27] : [0.4, 0.44, 0.31], R, 0.025),
    skip: (x, z) => { const c = API.vrLC ? API.vrLC(x, z) : 0; return c === 1 || c === 3 || c === 5 || c === 6; } };   // (not under the trees, on built ground, water or the fields: their builders paint them)

  const LOOK = { caracoles: { C: CAF, seed: 66100, k: 0.96 }, santoantao: { C: SAF, seed: 66200, k: 0.96 } };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o), L = LOOK[id];
      if (L) try {
        const out = ctx.out, gT = (o && o.gH) || API.vrGround, ex = ctx.excluded || (() => false);
        if (out && API.T) { CA.n = API.T.px.length; out.dalBt66 = far(ctx.root, out.matV, gT, ex, L.seed, dim(muted(L.C), L.k)); }
      } catch (e) { console.error('chase-bt66 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
