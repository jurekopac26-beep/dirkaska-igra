/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixty-seventh group of the real tracks: Koror and
   Aguascalientes, a third pass. Koror (the pass builder, js/world-prelaz.js) has the eighth group's tropical ground and the twenty-
   seventh's verge and bank to ~9 m (js/world-chase-bt8.js, js/world-chase-bt27.js); past them the hill's grass was one even green up to
   the trees. Aguascalientes (the shared builder, js/world-rbring.js) has the twenty-third and the thirty-third groups' tufts and bands
   (js/world-chase-bt33.js); between the tufts the plain was still one smooth gold, without the olive patches, the greener ditches and the
   bare earth docs/proge/aguascalientes.md names. So here a far band of wide low patches to ~55-60 m on both. Koror: docs/proge/koror.md:
   »vlažen tropski gozd na griču, palme in grmovje, trava ob cesti«; the grass in its tones, the darker humid grass, the red-brown soil
   and under the trees the brown palm-frond and leaf litter, a few dark low bush cushions; never on the causeways (the sea), in the water
   or the town. Aguascalientes: »suha trava planote (zlata z olivnimi krpami, ob jarkih bolj zelena), grmičevje«; olive patches, greener
   ones in the hollows, the brown earth bare and the low grey-green scrub, in the builder's own scenery chunks (no draw calls of their
   own), never on the pits' side along the pits. The terrain, the road, the walls, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, sstep } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.mix3 || !BT.chain || !BT.walk || !vary || !rng) return;
  const { soil, tuft, cushion, softScen, mix3, chain, walk } = BT;
  const P = (R, a, b, r0, r1) => ({ col: vary(mix3(a, b, R()), R, 0.015), r: r0 + R() * r1 });

  /* the far band (as js/world-chase-bt66.js's, copied so this group does not wait on it): every C.step m on both sides C.n places
     from C.from to C.reach m past the barrier line, denser near; only this leg's ground, not steeper than C.maxSl, not below the road */
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
        if (!(dy > -C.drop)) continue;
        const sl = slope(x, z); if (sl > C.maxSl) continue;
        const kk = 1 + 0.6 * u;   // (wider further out: the same patch reads smaller there)
        if (r0 < C.share) { const p = C.patch(R, sl, x, z); soil(soft, gT, x, z, p.r * kk, p.col.map(v => v * C.dim), R, 0.06); st.dal++; }
        else if (sl < C.sl && r3 < C.bushShare) { const h = R(); cushion(soft.get(x, z), x, y, z, (0.5 + h * 0.5) * kk, 0.3 + h * 0.3, C.bush(R), R); st.dalGrmi++; }
        else if (u < 0.45) { const h = R(); tuft(soft.get(x, z), x, y, z, 0.28 + h * 0.2, 0.32 + h * 0.3, C.tuft(R), R, 5); st.dalSopi++; }
      }
    }
    soft.done();
    return st;
  };

  /* Koror: the colours of js/world-chase-bt27.js and the look (Sentinel-2): the grass green in several tones, the humid darker grass,
     the red-brown soil, under the trees (land cover 1) the brown frond and leaf litter; dark low bushes. Never in the town (3), the
     water (5), down at the sea (the causeways: ground under 1.5 m) or more than 3 m under the road. */
  const KR = { step: 5, n: 4, from: 8, reach: 55, share: 0.7, maxSl: 1.3, sl: 0.9, bushShare: 0.4, drop: 3, dim: 0.96,
    patch: (R, sl, x, z) => { const c = API.vrLC ? API.vrLC(x, z) : 0, r = R();
      if (c === 1) return r < 0.6 ? P(R, [0.4, 0.31, 0.2], [0.46, 0.36, 0.23], 1.4, 1.6) : P(R, [0.2, 0.36, 0.13], [0.24, 0.4, 0.15], 1.6, 1.8);   // (frond and leaf litter, the shaded grass)
      return sl > 0.8 && r < 0.35 ? P(R, [0.5, 0.36, 0.26], [0.54, 0.39, 0.28], 1.3, 1.4)   // (the red-brown soil where it is steeper)
        : r < 0.4 ? P(R, [0.26, 0.47, 0.16], [0.3, 0.5, 0.18], 1.7, 1.9)   // (the grass)
        : r < 0.7 ? P(R, [0.18, 0.4, 0.12], [0.21, 0.44, 0.14], 1.6, 1.8)   // (the humid, darker grass)
        : r < 0.88 ? P(R, [0.36, 0.5, 0.2], [0.4, 0.52, 0.22], 1.5, 1.6)   // (the sun-dried grass)
        : P(R, [0.48, 0.35, 0.25], [0.52, 0.38, 0.27], 1.2, 1.3); },   // (the bare red-brown soil)
    tuft: (R) => vary(mix3([0.28, 0.5, 0.17], [0.2, 0.46, 0.14], R()), R, 0.03),
    bush: (R) => vary(mix3([0.12, 0.28, 0.1], [0.16, 0.33, 0.12], R()), R, 0.02),
    skip: (x, z) => { const c = API.vrLC ? API.vrLC(x, z) : 0, g = API.caGround || API.vrGround; return c === 3 || c === 5 || !(g(x, z) > 1.5); } };
  const LK = API.PL_LOOK || {};
  if (LK.koror) chain(LK.koror, (ctx) => {
    if (!ctx.out) return;
    const gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    ctx.out.dalBt67 = far(ctx.root, ctx.matV, gT, ex, 67101, KR);
  });

  /* Aguascalientes: from ~8 to ~58 m past the walls on the open plain (land cover 0 and 2, slope under 0.8): wide low patches of the
     olive grass, of the greener grass where the ground lies low (a ditch), of the bare brown earth; now and then a low grey-green scrub
     cushion. In the builder's own chunks. */
  const AG = { seed: 67201, olive: [0.5, 0.5, 0.27], olive2: [0.44, 0.46, 0.25], green: [0.4, 0.5, 0.25], earth: [0.56, 0.44, 0.32], earth2: [0.5, 0.4, 0.3], scrub: [0.46, 0.5, 0.34] };
  const agBand = (ctx, env, st) => {
    const { nrGround: gH, nrLC, nrSlope } = API, scen = ctx.scen; if (!scen || !gH || !nrLC || !nrSlope) return;
    st.krpe = 0; st.jarki = 0; st.prst = 0; st.grmi = 0;
    walk(env, AG.seed, 3, 50, 8, (x, z) => { const c = nrLC(x, z); return (c === 0 || c === 2) && nrSlope(x, z) < 0.8 ? 0.8 : 0; }, (gx, gz, k, R, free) => {
      if (!free(gx, gz, 4)) return;
      const y = gH(gx, gz), low = (gH(gx + 6, gz) + gH(gx - 6, gz) + gH(gx, gz + 6) + gH(gx, gz - 6)) / 4 > y + 0.25, r = R(), NR = API.NR;
      const dry = NR && sstep ? sstep(0.4, 0.7, NR.n3(gx * 0.5 - 40, gz * 0.5 + 90)) : 0.5;
      if (low && r < 0.7) { soil(scen, gH, gx, gz, 1.8 + R() * 2.2, vary(mix3(AG.green, AG.olive2, R() * 0.5), R, 0.02), R, 0.05); st.jarki++; }
      else if (r < 0.62 - dry * 0.25) { soil(scen, gH, gx, gz, 1.8 + R() * 2.6, vary(mix3(AG.olive, AG.olive2, R()), R, 0.02), R, 0.05); st.krpe++; }
      else if (r < 0.85) { soil(scen, gH, gx, gz, 1.2 + R() * 1.6, vary(mix3(AG.earth, AG.earth2, R()), R, 0.02), R, 0.05); st.prst++; }
      else if (nrLC(gx, gz) === 2 || R() < 0.5) { const h = R(); cushion(scen.get(gx, gz), gx, y, gz, 0.5 + h * 0.5, 0.3 + h * 0.3, vary(AG.scrub, R, 0.03), R); st.grmi++; }
    });
  };
  const AL = (API.rbLook || {}).aguascalientes;
  if (AL) {
    const base = AL.extra;
    AL.extra = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try {
        const T = API.T, pd = T && T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, { nrNear } = API;
        const bad = (x, z) => { if (!ps) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
        const st = {};
        agBand(ctx, { near: nrNear, excluded: (x, z) => ctx.excluded(x, z) || bad(x, z), pit: (s, sd) => !!ps && sd === ps && !!T.pitAt(s) }, st);
        r.robBt67 = st;
      } catch (e) { console.error('chase-bt67 (aguascalientes):', e); }
      return r;
    };
  }
})();
