/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the twenty-fifth group of the real tracks: Chapman's Peak and
   Gudauri, a second pass on the two roads whose ground the fifteenth group (js/world-chase-bt15.js) and Vršič's passes (js/world-prelaz.js)
   already set. Seen from behind the car both still showed one even face on each side: on Gudauri the wide verge between the asphalt and
   the barrier in one pale olive, on Chapman's Peak the narrow verge and, on the mountain's side, the cut bank above it in one sandy colour.
   So here: on the verge's strip the twenty-fourth group's patches and tufts (BT.verge, js/world-chase-bt24.js) with what lies there in
   each place (docs/proge/chapman.md, docs/proge/gudauri.md), and on the bank that rises behind the barrier line (not where the ground
   falls) low patches lying on the terrain, tufts and, where it is not too steep, low cushions. Nothing within 0.4 m past the barrier
   line, nothing where another leg's road is nearer, in the builder's excluded places (lookouts, car parks, the village's yards) or in the
   sea. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.verge || !rng) return;
  const { soil, tuft, cushion, softScen, mix3, chain, verge } = BT;
  /* the patches' colours drawn flat came out more saturated and lighter than the terrain's shaded ones around them (a confetti of yellow and
     green): each look's colours are taken half way to their grey and a little darker, so a patch reads as a change of ground, not a sticker */
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.9; return [(c[0] * 0.5 + l * 0.5) * f, (c[1] * 0.5 + l * 0.5) * f, (c[2] * 0.5 + l * 0.5) * f]; };
  const muted = (C) => Object.assign({}, C, { patch: (R, sl) => { const P = C.patch(R, sl); return { col: mute(P.col), r: P.r }; }, tuft: (R) => mute(C.tuft(R), 0.95) });

  /* the bank behind the barrier line on both sides: every `step` m a few places from 0.4 m past the barrier to `reach` m, only where the
     ground there is not below the road (a bank, not a drop) and its slope under C.maxSl (a sheer face stays the rock it is); C.patch(R),
     C.tuft(R), C.bush(R) give the colours (C.bush: null = no cushion there), C.sl the slope up to which a cushion stands */
  const bank = (root, matV, gT, bad, seed, C) => {
    const T = API.T, near = API.vrNear, st = { breg: 0, bregSopi: 0, bregGrmi: 0 };
    if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length;
    const slope = (x, z) => { const d = 0.8, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const r0 = R(), r1 = R(), r2 = R(), r3 = R();
        const o = bar + 0.4 + Math.pow(r1, 1.3) * C.reach, a = (r2 - 0.5) * C.step;
        const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 14 || Math.abs(q.lat) < bar + 0.35) continue;   // (this leg's bank, past its barrier line)
        if (bad(x, z) || (C.skip && C.skip(x, z, i))) continue;
        const y = gT(x, z); if (!(y > T.hy[i] - 0.6)) continue;   // (the ground falls away here: no bank)
        const sl = slope(x, z); if (sl > C.maxSl) continue;
        if (r0 < C.share) { const P = C.patch(R, sl, i); soil(soft, gT, x, z, P.r, P.col, R, 0.05); st.breg++; }
        else if (C.bush && sl < C.sl && r3 < C.bushShare && (!C.bushAt || C.bushAt(i))) { const h = R(), col = C.bush(R, i); cushion(soft.get(x, z), x, y, z, 0.45 + h * 0.45, 0.3 + h * 0.3, col, R); st.bregGrmi++; }
        else { const h = R(); tuft(soft.get(x, z), x, y, z, 0.24 + h * 0.18, 0.28 + h * 0.26, C.tuft(R, i), R, 5); st.bregSopi++; }
      }
    }
    soft.done();
    return st;
  };
  BT.bank = bank; BT.muted = muted;   // (the twenty-sixth group's passes use the same bank and the same muting: js/world-chase-bt26.js; for the later groups, js/world-chase-bt28.js: C.patch, C.tuft and C.bush also get the road's index i, C.skip(x, z, i) leaves a place out, C.bushAt(i) where cushions stand)

  /* Chapman's Peak: docs/proge/chapman.md: »vsek v skalo, spodaj siv granit, višje … rjave plasti peščenjaka … s sivo-zelenimi lišaji«,
     »odpadlo kamenje na bankini pod lovilnimi mrežami«, »tla so mozaik sivo-zelenega grmičevja, temno olivnih goščav, rjastih leh restij,
     srebrnkastih zaplat in suhih okrastih tal s peščeno potjo med grmi«. On the verge the ochre sandy soil, the fallen grey granite grit
     and the rusty restio litter in low patches, at its outer edge restio tufts; on the bank the grey-green lichen and the ochre soil in
     patches, restio tufts and the grey-green and silvery fynbos cushions where it is gentle enough. */
  const CPV = { step: 2.6, share: 0.5, foot: 0.3,
    patch: (R) => { const r = R();
      return r < 0.4 ? { col: vary(mix3([0.66, 0.58, 0.44], [0.7, 0.62, 0.47], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (ochre sandy soil)
        : r < 0.75 ? { col: vary(mix3([0.55, 0.55, 0.52], [0.6, 0.6, 0.56], R()), R, 0.015), r: 0.6 + R() * 0.8 }   // (granite grit)
        : { col: vary([0.56, 0.44, 0.31], R, 0.015), r: 0.7 + R() * 0.8 }; },   // (restio litter)
    tuft: (R) => vary(mix3([0.55, 0.42, 0.28], [0.47, 0.47, 0.3], R()), R, 0.03) };
  const CPB = { step: 2.4, n: 3, reach: 7, share: 0.45, maxSl: 1.6, sl: 0.9, bushShare: 0.55,
    patch: (R, sl) => { const r = R();
      return r < 0.45 ? { col: vary(mix3([0.5, 0.53, 0.44], [0.55, 0.57, 0.48], R()), R, 0.015), r: 0.9 + R() * 1.2 }   // (grey-green lichen, low fynbos)
        : r < 0.8 || sl > 1.1 ? { col: vary(mix3([0.62, 0.53, 0.4], [0.66, 0.57, 0.43], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (ochre soil, sandstone grit)
        : { col: vary([0.54, 0.43, 0.3], R, 0.015), r: 0.7 + R() * 0.8 }; },   // (restio)
    tuft: (R) => vary(mix3([0.55, 0.42, 0.28], [0.47, 0.47, 0.3], R()), R, 0.03),
    bush: (R) => { const r = R(); return vary(r < 0.4 ? [0.5, 0.54, 0.44] : r < 0.7 ? [0.62, 0.64, 0.58] : [0.4, 0.43, 0.29], R, 0.025); } };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'chapman') try {
        const out = ctx.out, gT = (o && o.gH) || API.vrGround, ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || (o && o.bad ? o.bad(x, z) : false);
        if (out) { out.robBt25 = verge(ctx.root, out.matV, gT, 25101, muted(CPV)); out.bregBt25 = bank(ctx.root, out.matV, gT, bad, 25102, muted(CPB)); }
      } catch (e) { console.error('chase-bt25 (chapman):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }

  /* Gudauri: docs/proge/gudauri.md and its look (js/world-prelaz.js): »alpski travniki in pašniki, v zaplatah grmovje … v strminah pečine
     in melišča«, late summer, the meadow grazed short and yellowing, mats of Caucasian rhododendron and juniper, grey-brown andesite and
     shale. On the wide verge the shoulder's grey gravel, the short yellowing grass and the shale's grit in low patches, at the barrier's
     foot yellowing tufts; on the bank the meadow in green and straw patches, the scree's grey on the steeper parts, tufts, and the dark
     rhododendron and juniper mats where it is gentle. */
  const GDV = { step: 2.6, share: 0.55, foot: 0.3,
    patch: (R) => { const r = R();
      return r < 0.4 ? { col: vary(mix3([0.6, 0.57, 0.36], [0.64, 0.6, 0.38], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (dry yellowing grass)
        : r < 0.7 ? { col: vary(mix3([0.43, 0.49, 0.25], [0.47, 0.52, 0.28], R()), R, 0.015), r: 0.9 + R() * 1.1 }   // (short green grass)
        : { col: vary(mix3([0.5, 0.49, 0.46], [0.55, 0.53, 0.49], R()), R, 0.015), r: 0.7 + R() * 0.9 }; },   // (shale and gravel)
    tuft: (R) => vary(mix3([0.56, 0.55, 0.32], [0.46, 0.52, 0.26], R()), R, 0.03) };
  const GDB = { step: 2.6, n: 3, reach: 8, share: 0.5, maxSl: 1.5, sl: 0.8, bushShare: 0.35,
    patch: (R, sl) => { const r = R();
      return sl > 1.0 && r < 0.5 ? { col: vary(mix3([0.5, 0.48, 0.45], [0.55, 0.52, 0.48], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (scree)
        : r < 0.55 ? { col: vary(mix3([0.42, 0.48, 0.24], [0.38, 0.47, 0.22], R()), R, 0.015), r: 1.0 + R() * 1.3 }   // (meadow, greener)
        : { col: vary(mix3([0.6, 0.57, 0.35], [0.56, 0.54, 0.33], R()), R, 0.015), r: 1.0 + R() * 1.2 }; },   // (meadow, straw)
    tuft: (R) => vary(mix3([0.56, 0.55, 0.32], [0.42, 0.5, 0.24], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.26, 0.34, 0.19] : [0.3, 0.36, 0.24], R, 0.025) };
  const LK = API.PL_LOOK;
  if (LK && LK.gudauri && chain) chain(LK.gudauri, (ctx) => {
    if (!ctx.out) return;
    const gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    ctx.out.robBt25 = verge(ctx.root, ctx.matV, gT, 25201, muted(GDV));
    ctx.out.bregBt25 = bank(ctx.root, ctx.matV, gT, ex, 25202, muted(GDB));
  });
})();
