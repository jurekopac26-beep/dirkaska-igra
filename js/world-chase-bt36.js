/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the thirty-sixth group of the real tracks: Ghoufi and Harju, a
   second pass on the two roads whose ground the eleventh and the nineteenth group already set (js/world-chase-bt11.js, js/world-chase-
   bt19.js). Seen from behind the car the verge and the ground behind the barrier line were still one even face on each side: on Ghoufi
   the ochre rock and dry grass of the canyon's rim, in Harju the needles and the lawns of the park on the gravel ridge.
   So here, after the bands of those groups: on Ghoufi the twenty-fourth group's verge (BT.verge) and the twenty-fifth group's bank
   (BT.bank) with what lies on the rim (docs/proge/ghoufi.md), and past the bank a sparse outer band of wide low patches to ~55 m on the
   ground that rises from the road (never where it falls to the canyon: there the drop stays the rock it is). In Harju (a town park, its
   own builder: js/world-harju.js gives its ground, its land cover and its nearest-road function) a bank of its own past the verge's ribbon
   (from 2 m behind the barrier line) to ~10 m and a sparse band of wide patches to ~45 m, only on the lawns, under the pines and in the
   wetland (hjLC 0, 1, 2), never on the paved, built or sports ground (3) or in the builder's excluded places.
   All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.verge || !BT.bank || !rng) return;
  const { soil, tuft, cushion, softScen, mix3, verge, bank } = BT;
  const P = (R, a, b, r0, r1) => ({ col: vary(mix3(a, b, R()), R, 0.015), r: r0 + R() * r1 });
  const soften = (C, g, f) => { const m = (c) => { const l = (c[0] + c[1] + c[2]) / 3; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
    return Object.assign({}, C, { patch: (R, sl) => { const q = C.patch(R, sl); return { col: m(q.col), r: q.r }; }, tuft: (R) => m(C.tuft(R)), bush: C.bush ? (R) => m(C.bush(R)) : null }); };

  /* a sparse outer band: every `step` m along the road on both sides a place from C.from m past the barrier line to C.to m, only where
     this leg's road is the nearest (near: the track's own nearest-road function), not in `bad`, where the ground is not below the road by
     more than C.drop m and its slope is under C.maxSl; there a wide low patch (C.patch(R, sl)) or now and then a tuft (C.tuft(R)) */
  const band = (root, matV, gT, near, bad, seed, C) => {
    const T = API.T, st = { pas: 0, pasSopi: 0 };
    if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), bar = sd > 0 ? T.br[i] : T.bl[i];
      const o = bar + C.from + Math.pow(r1, 0.8) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || Math.abs(q.lat) < bar + C.from - 0.5) continue;
      if (bad(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop)) continue;
      const sl = slope(x, z); if (sl > C.maxSl) continue;
      if (r0 < C.share) { const p = C.patch(R, sl, x, z); soil(soft, gT, x, z, p.r, p.col, R, 0.06); st.pas++; }
      else if (C.tuft) { const h = R(); tuft(soft.get(x, z), x, y, z, 0.26 + h * 0.2, 0.3 + h * 0.3, C.tuft(R, x, z), R, 5); st.pasSopi++; }
    }
    soft.done();
    return st;
  };

  /* Ghoufi: docs/proge/ghoufi.md: the road on the rim of the canyon in the Aurès, the canyon always on the left below the road, the stone
     village on its wall; the rim's ochre rock and marl, the alfa grass in dry tussocks, wormwood, the road's grey-ochre gravel. On the
     verge the gravel and the fine ochre dust, the marl's pale chips and dry grass; at the barrier's foot alfa tufts. On the bank the
     ochre and the pale marl in patches, the dry grass, alfa tufts and the low grey-green wormwood cushions where it is gentle; past it a
     sparse band of ochre and straw to ~55 m. Not muted to grey as on the other tracks: on this warm, saturated ochre a greyed patch read
     as a grey sticker (the first pictures), so the colours are the ground's own ochre, a little lighter or darker,
     only a quarter of the way to grey and a sixth darker (soften: the flat patches otherwise read lighter than the shaded ground). */
  const GHV = { step: 2.6, share: 0.5, foot: 0.3,
    patch: (R) => { const r = R();
      return r < 0.4 ? P(R, [0.7, 0.54, 0.36], [0.74, 0.58, 0.39], 0.8, 1.0)   // (grey-ochre gravel and dust)
        : r < 0.72 ? P(R, [0.78, 0.64, 0.46], [0.8, 0.67, 0.49], 0.6, 0.8)   // (pale marl chips)
        : P(R, [0.66, 0.55, 0.35], [0.62, 0.52, 0.33], 0.7, 0.9); },   // (dry grass)
    tuft: (R) => vary(mix3([0.57, 0.57, 0.37], [0.66, 0.6, 0.4], R()), R, 0.03) };
  const GHB = { step: 2.4, n: 3, reach: 8, share: 0.48, maxSl: 1.5, sl: 0.8, bushShare: 0.45,
    patch: (R, sl) => { const r = R();
      return r < 0.4 || sl > 1.0 ? P(R, [0.66, 0.49, 0.31], [0.62, 0.46, 0.29], 0.9, 1.1)   // (ochre rock and soil)
        : r < 0.7 ? P(R, [0.78, 0.64, 0.46], [0.75, 0.61, 0.44], 0.8, 1.0)   // (pale marl)
        : P(R, [0.66, 0.55, 0.35], [0.62, 0.53, 0.34], 1.0, 1.2); },   // (dry grass)
    tuft: (R) => vary(mix3([0.55, 0.56, 0.36], [0.66, 0.6, 0.41], R()), R, 0.03),
    bush: (R) => vary(R() < 0.65 ? [0.58, 0.6, 0.5] : [0.52, 0.55, 0.42], R, 0.025) };   // (wormwood, a darker alfa clump)
  const GHP = { step: 3.2, from: 8, to: 55, share: 0.8, drop: 0.5, maxSl: 1.2,
    patch: (R, sl) => { const r = R();
      return r < 0.45 || sl > 0.8 ? P(R, [0.66, 0.5, 0.32], [0.62, 0.47, 0.3], 2.0, 2.4)   // (ochre ground)
        : r < 0.75 ? P(R, [0.68, 0.57, 0.37], [0.64, 0.54, 0.35], 2.2, 2.6)   // (dry grass)
        : P(R, [0.6, 0.55, 0.4], [0.57, 0.53, 0.39], 1.6, 1.8); },   // (wormwood scrub)
    tuft: (R) => vary(mix3([0.55, 0.56, 0.36], [0.66, 0.6, 0.41], R()), R, 0.03) };

  /* Harju: docs/proge/harju.md: a summer evening in the town's park on the gravel ridge, the old Scots pines, their needles, moss, the
     ridge's pale sand, bilberry, lingonberry and heather under the pines, mown lawns beside the paths. Behind the verge's ribbon on the
     lawns the mown grass in lighter and darker patches and the worn sand along the path's edge; under the pines the needles, moss and
     the pale sand, low bilberry and lingonberry cushions; in the wetland the moss. Past that a sparse band of the same, wider. */
  const hjPatch = (R, c, wide) => { const r = R(), k = wide ? 1.9 : 1;
    if (c === 2) return P(R, [0.36, 0.42, 0.2], [0.4, 0.44, 0.24], 1.0 * k, 1.2 * k);   // (wet moss)
    if (c === 1) return r < 0.4 ? P(R, [0.46, 0.39, 0.25], [0.5, 0.42, 0.27], 0.9 * k, 1.1 * k)   // (needles)
      : r < 0.65 ? P(R, [0.62, 0.58, 0.46], [0.66, 0.61, 0.48], 0.7 * k, 0.9 * k)   // (the ridge's pale sand)
      : r < 0.85 ? P(R, [0.36, 0.42, 0.22], [0.4, 0.45, 0.25], 0.9 * k, 1.0 * k)   // (moss)
      : P(R, [0.5, 0.42, 0.36], [0.47, 0.4, 0.34], 0.7 * k, 0.8 * k);   // (heather)
    return r < 0.4 ? P(R, [0.4, 0.48, 0.22], [0.43, 0.5, 0.24], 1.0 * k, 1.3 * k)   // (fresh mown lawn)
      : r < 0.75 ? P(R, [0.47, 0.5, 0.27], [0.5, 0.52, 0.3], 1.0 * k, 1.2 * k)   // (drier lawn)
      : P(R, [0.6, 0.56, 0.42], [0.63, 0.58, 0.44], 0.6 * k, 0.8 * k); };   // (worn sand)
  const hjTuft = (R, c) => vary(c === 0 ? mix3([0.44, 0.5, 0.24], [0.56, 0.55, 0.34], R()) : mix3([0.42, 0.46, 0.24], [0.54, 0.52, 0.32], R()), R, 0.03);
  const hjBush = (R) => vary(R() < 0.55 ? [0.26, 0.36, 0.16] : [0.24, 0.32, 0.15], R, 0.025);   // (bilberry, lingonberry)
  const hjBank = (root, matV, o, bad, seed) => {
    const T = API.T, near = o.near, gT = o.gH, lc = o.lc, st = { breg: 0, bregSopi: 0, bregGrmi: 0 };
    if (!T || !T.br || !near || !gT || !lc || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length, step = 2.4;
    const slope = o.slope ? (x, z) => o.slope(x, z) : (x, z) => { const d = 0.8; return Math.hypot(gT(x + d, z) - gT(x - d, z), gT(x, z + d) - gT(x, z - d)) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < 3; k++) {
        const r0 = R(), r1 = R(), r2 = R(), r3 = R();
        const of = bar + 2.0 + Math.pow(r1, 1.3) * 8, a = (r2 - 0.5) * step;
        const x = T.px[i] + T.nx[i] * sd * of + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * of + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 14 || Math.abs(q.lat) < bar + 1.9) continue;
        if (bad(x, z)) continue;
        const c = lc(x, z); if (c === 3) continue;
        const sl = slope(x, z); if (!(sl < 1.2)) continue;
        const y = gT(x, z);
        if (r0 < 0.5) { const p = hjPatch(R, c, false); soil(soft, gT, x, z, p.r, mute(p.col), R, 0.05); st.breg++; }
        else if (c === 1 && sl < 0.7 && r3 < 0.5) { const h = R(); cushion(soft.get(x, z), x, y, z, 0.4 + h * 0.4, 0.22 + h * 0.18, mute(hjBush(R), 0.97), R); st.bregGrmi++; }
        else { const h = R(); tuft(soft.get(x, z), x, y, z, 0.2 + h * 0.16, 0.22 + h * 0.2, mute(hjTuft(R, c), 0.95), R, 5); st.bregSopi++; }
      }
    }
    soft.done();
    return st;
  };
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.9; return [(c[0] * 0.5 + l * 0.5) * f, (c[1] * 0.5 + l * 0.5) * f, (c[2] * 0.5 + l * 0.5) * f]; };

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'ghoufi') try {
        const out = ctx.out, gT = (o && o.gH) || API.vrGround, ex = ctx.excluded || (() => false), bad = o && o.bad ? (x, z) => ex(x, z) || o.bad(x, z) : ex;
        if (out && API.T) {
          out.robBt36 = verge(ctx.root, out.matV, gT, 36101, soften(GHV, 0.25, 0.84));
          out.bregBt36 = bank(ctx.root, out.matV, gT, bad, 36102, soften(GHB, 0.25, 0.84));
          out.pasBt36 = band(ctx.root, out.matV, gT, (o && o.near) || API.vrNear, bad, 36103, soften(GHP, 0.25, 0.84));
        }
      } catch (e) { console.error('chase-bt36 (ghoufi):', e); }
      else if (id === 'harju') try {
        const out = ctx.out, ex = ctx.excluded || (() => false);
        if (out && API.T && o && o.near && o.gH && o.lc) {
          out.bregBt36 = hjBank(ctx.root, out.matV, o, ex, 36201);
          const lc = o.lc, bad = (x, z) => ex(x, z) || lc(x, z) === 3;
          const HJP = { step: 3.4, from: 10, to: 45, share: 0.85, drop: 3, maxSl: 0.9,   // (the class read at the place itself, the colours muted here)
            patch: (R, sl, x, z) => { const p = hjPatch(R, lc(x, z), true); return { col: mute(p.col), r: p.r }; }, tuft: (R, x, z) => mute(hjTuft(R, lc(x, z)), 0.95) };
          out.pasBt36 = band(ctx.root, out.matV, o.gH, o.near, bad, 36202, HJP);
        }
      } catch (e) { console.error('chase-bt36 (harju):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK, hjLC and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
