/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fortieth group of the real tracks, a second pass: Kanaba
   (a pass-builder road, js/world-prelaz.js) and Kågeröd (the circuit builder, js/world-rbring.js). The seventh group
   (js/world-chase-bt7.js) gave Kanaba tufts, red soil and scrub within ~20 m, and js/world-realizem-bt.js gave Kågeröd's meadows
   buttercup and cow-parsley tufts; from behind the car both still showed one even face past the barrier line: on Kanaba the pasture's
   slope in one green and the cuttings in one red-brown, on Kågeröd the mown grass to the fences and the fields behind them in one green.
   So here, as the thirty-third and the thirty-eighth groups did: on Kanaba patches of the red dust and the grass on the strip with tufts
   at the barrier's foot, the bank to ~10 m and a sparse band of wide low patches out to ~55 m; on Kågeröd the three bands of the
   corridor's looks (World.ext.goreRob) and a fourth of tussock groups ~30-60 m out. All of it in meshes of their own (no shadow); the
   terrain, the road, the barriers, the houses, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, sstep } = API, LK = API.PL_LOOK;
  if (!BT || !BT.verge || !BT.bank || !BT.muted || !BT.chain || !BT.soil || !BT.softScen || !BT.walk || !BT.tuft || !BT.cushion || !rng || !vary) return;
  const { soil, tuft, cushion, walk, softScen, mix3, chain, verge, bank } = BT;

  /* a sparse outer band (as js/world-chase-bt38.js): every `step` m on both sides a wide low patch between `from` m past the barrier line
     and `to` m, only where this leg's road is the nearest, not in `bad`, not far below the road and not steeper than C.maxSl */
  const band = (root, matV, gT, near, bad, seed, C) => {
    const T = API.T, st = { pas: 0 };
    if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + r1 * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10) continue;
      if (bad(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop) || slope(x, z) > C.maxSl) continue;
      const P = C.patch(R, o); soil(soft, gT, x, z, P.r, P.col, R, 0.06); st.pas++;
    }
    soft.done();
    return st;
  };

  /* ---- Kanaba: docs/proge/kanaba.md: »zelena polja in pašniki na rdeči prsti, gozdni pasovi in grmičevje, rdeče-rjava preperela
     kamnina v useku«, the asphalt's edge worn and red with the dust. On the strip the red dust washed to the edge, the pasture grass and
     the weathered rock's grit; at the barrier's foot tufts of it. On the bank the cuttings' red-brown rock, the grass and the scrub's
     green bushes; out to ~55 m wide patches of the pasture, its drier grass and the red earth showing through ---- */
  const KNV = { step: 3.4, share: 0.6, foot: 0.25,
    patch: (R) => { const r = R();
      return r < 0.4 ? { col: vary(mix3([0.54, 0.35, 0.25], [0.57, 0.37, 0.27], R()), R, 0.015), r: 0.9 + R() * 1.1 }   // (red dust)
        : r < 0.75 ? { col: vary(mix3([0.34, 0.46, 0.2], [0.38, 0.48, 0.21], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (pasture grass)
        : { col: vary(mix3([0.55, 0.42, 0.34], [0.58, 0.45, 0.36], R()), R, 0.015), r: 0.7 + R() * 0.9 }; },   // (weathered grit)
    tuft: (R) => vary(mix3([0.3, 0.44, 0.17], [0.4, 0.48, 0.22], R()), R, 0.03) };
  const KNB = { step: 4.5, n: 2, reach: 8, share: 0.7, maxSl: 1.6, sl: 1.0, bushShare: 0.3,
    patch: (R, sl) => { const r = R();
      return sl > 0.9 && r < 0.6 ? { col: vary(mix3([0.5, 0.33, 0.25], [0.54, 0.35, 0.26], R()), R, 0.015), r: 0.9 + R() * 1.1 }   // (the cutting's red-brown rock)
        : r < 0.25 ? { col: vary(mix3([0.42, 0.46, 0.22], [0.45, 0.47, 0.23], R()), R, 0.015), r: 1.0 + R() * 1.3 }   // (drier grass)
        : { col: vary(mix3([0.32, 0.45, 0.19], [0.36, 0.47, 0.2], R()), R, 0.015), r: 1.0 + R() * 1.2 }; },   // (pasture)
    tuft: (R) => vary(mix3([0.3, 0.44, 0.17], [0.4, 0.48, 0.22], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.22, 0.34, 0.14] : [0.26, 0.38, 0.16], R, 0.025) };   // (scrub: green, not dark)
  const KNF = { step: 6, share: 0.4, from: 8, to: 55, drop: 8, maxSl: 1.3,
    patch: (R, o) => { const r = R(), k = 1 + 0.5 * Math.min(1, (o - 8) / 47);
      return r < 0.55 ? { col: vary(mix3([0.3, 0.43, 0.18], [0.34, 0.45, 0.19], R()), R, 0.015), r: (1.6 + R() * 1.6) * k }   // (pasture)
        : r < 0.82 ? { col: vary(mix3([0.41, 0.45, 0.21], [0.44, 0.46, 0.22], R()), R, 0.015), r: (1.6 + R() * 1.5) * k }   // (drier grass)
        : { col: vary([0.5, 0.33, 0.23], R, 0.015), r: (1.0 + R() * 1.0) * k }; } };   // (the red earth showing through)
  /* the patches show lighter than the shaded terrain around them: darkened, and only a quarter of the muting's greying (BT.muted greys
     the green pasture to beige) */
  const dim = (c) => { const l = (c[0] + c[1] + c[2]) / 3; return [(c[0] * 0.75 + l * 0.25) * 0.66, (c[1] * 0.75 + l * 0.25) * 0.66, (c[2] * 0.75 + l * 0.25) * 0.66]; };
  const dimmed = (C) => Object.assign({}, C, { patch: (R, a) => { const P = C.patch(R, a); return { col: dim(P.col), r: P.r }; } });
  if (LK && LK.kanaba) chain(LK.kanaba, (ctx) => {
    if (!ctx.out) return;
    const gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    ctx.out.robBt40 = verge(ctx.root, ctx.matV, gT, 40101, dimmed(KNV));
    ctx.out.bregBt40 = bank(ctx.root, ctx.matV, gT, ex, 40102, dimmed(KNB));
    ctx.out.pasBt40 = band(ctx.root, ctx.matV, gT, API.vrNear, ex, 40103, dimmed(KNF));
  });

  /* ---- Kågeröd: docs/proge/kagerod.md: beech woods with blocks of spruce and birch, »travniki z zlaticami in krebuljico«, fields of
     beet, wheat, barley and ploughed land; mown grass outside the bends, the fences >3 m off the road. So at the fences' foot the uncut
     grass in tufts with a buttercup's yellow now and then; under the woods the beech's brown leaf litter with low green undergrowth; on
     the meadows taller tussocks in loose groups, and ~30-60 m out tussock groups with the fields' brown soil bare between them. Never on
     the pits' side along the pits ---- */
  if (World.ext && World.ext.goreRob && World.ext.goreRob.LOOK) {
    const LOOK = World.ext.goreRob.LOOK;
    const cov = (c, grass, wood, shrub, built, bare) => c === 0 ? grass : c === 1 ? wood : c === 2 ? shrub : c === 3 ? built : c === 4 ? bare : 0;
    LOOK.kagerod = { seed: 40201, st: ['trava', 'grmi', 'listje', 'prst'],
      edge: { ok: (c, sl) => sl >= 0.9 ? 0 : cov(c, 0.85, 0.6, 0.8, 0, 0.3), n: [3, 4],
        put: (S, x, y, z, h, R) => { const yel = R() < 0.12;
          tuft(S.g(x, z), x, y, z, 0.28 + h * 0.22, 0.3 + h * 0.28, vary(yel ? S.c.butter : mix3(S.c.grass, S.c.seed, R() * 0.4), R, 0.03), R, 5); S.st.trava++; } },
      mid: { ok: (c, sl, x, z, w) => sl > 1.0 ? 0 : c === 1 || w > 0.3 ? 0.7 : cov(c, 0.55, 0, 0.75, 0, 0.3), n: [2, 3], litter: 0.45, lit: 'leaf', lr: [1.0, 2.2], ln: 'listje', wood: true, litW: true,
        put: (S, x, y, z, h, R, w) => { if (w > 0.3 && R() < 0.5) { cushion(S.g(x, z), x, y, z, 0.45 + h * 0.4, 0.25 + h * 0.2, vary(S.c.under, R, 0.03), R); S.st.grmi++; }
          else { tuft(S.g(x, z), x, y, z, 0.32 + h * 0.24, 0.36 + h * 0.3, vary(mix3(S.c.grass, S.c.lush, R()), R, 0.03), R, 5); S.st.trava++; } } },
      far: { ok: (c, sl, x, z, w) => sl > 0.9 ? 0 : cov(c, 0.5, 0.3, 0.55, 0, 0.3) * (1 - w * 0.4), n: [2, 4], litter: 0.25, lit: 'soil', lr: [1.0, 2.0], ln: 'prst',
        put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.4 + h * 0.3, 0.42 + h * 0.36, vary(mix3(S.c.lush, S.c.seed, R() * 0.5), R, 0.03), R, 5); S.st.trava++; } },
      col: { grass: [0.36, 0.52, 0.22], lush: [0.3, 0.5, 0.2], seed: [0.56, 0.56, 0.32], butter: [0.82, 0.74, 0.24], under: [0.26, 0.42, 0.18], leaf: [0.46, 0.36, 0.25], soil: [0.46, 0.36, 0.26] } };
    const F = { seed: 40251, k: 0.38, bare: 0.25, h: [0.38, 0.38], w: [0.45, 0.42], soil: [0.45, 0.35, 0.25],
      col: (x, z, R) => { const P = API.NR, dry = P ? sstep(0.5, 0.76, P.n3(x * 0.8 + 140, z * 0.8 - 70)) : 0.3;
        return mix3([0.32, 0.5, 0.2], [0.58, 0.56, 0.32], Math.min(1, dry * 0.8 + R() * 0.2)); } };
    const far2 = (ctx, env, st) => {
      const { nrGround: gH, nrLC, nrSlope } = API, scen = ctx.scen; if (!scen || !gH) return;
      st.dalj = 0; st.daljPrst = 0;
      walk(env, F.seed, 6, 30, 30, (x, z) => { const c = nrLC(x, z); return (c === 0 || c === 2) && nrSlope(x, z) < 0.8 ? F.k : 0; }, (gx, gz, k, R, free) => {
        if (R() < F.bare && free(gx, gz, 4)) { soil(scen, gH, gx, gz, 1.2 + R() * 1.6, vary(F.soil, R, 0.03), R, 0.05); st.daljPrst++; }
        for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) {
          const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = R();
          if (!free(x, z, 3) || env.excluded(x, z) || nrLC(x, z) > 2) continue;
          tuft(scen.get(x, z), x, gH(x, z), z, F.w[0] + h * F.w[1], F.h[0] + h * F.h[1], vary(F.col(x, z, R), R, 0.03), R, 5); st.dalj++;
        } });
    };
    const L = (API.rbLook || {}).kagerod;
    if (L) {
      const base = L.extra;
      L.extra = function (ctx) {
        const r = (base ? base.call(this, ctx) : null) || {};
        try {
          const T = API.T, pd = T && T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, { nrGround, nrSlope, nrLC, nrNear } = API;
          const bad = (x, z) => { if (!ps) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
          r.robBt40 = World.ext.goreRob({ excluded: ctx.excluded, root: ctx.root, out: ctx.out }, 'kagerod', { gH: nrGround, slope: nrSlope, lc: nrLC, near: nrNear, bad });
          far2(ctx, { near: nrNear, excluded: (x, z) => ctx.excluded(x, z) || bad(x, z), pit: (s, sd) => !!ps && sd === ps && !!T.pitAt(s) }, r.robBt40);
        } catch (e) { console.error('chase-bt40 (kagerod):', e); }
        return r;
      };
    }
  }
})();
