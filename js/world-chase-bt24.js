/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the twenty-fourth group of the real tracks: Tianmen and Sa Calobra,
   a second pass on the two serpentines whose ground behind the barrier the eighth and the thirteenth group already set (js/world-chase-
   bt8.js, js/world-chase-bt13.js). Seen from behind the car the verge between the asphalt's edge and the barrier (or the wall) was one even
   olive face several metres wide on both. So here, on that strip only, low flat patches of what lies there in each place (docs/proge/
   tianmen.md, docs/proge/sacalobra.md) and at the barrier's foot a few low tufts; nothing on the asphalt (from 0.4 m past its edge line
   to 0.35 m before the barrier), nothing where another leg's road is nearer, on the bridges or above a fill or a retaining wall. The
   patches lie 5 cm over the verge as drawn (its profile: -0.02 m at the edge, -0.12 m at the ditch's lip) in meshes of their own
   (softScen: 256 m chunks, no shadow); the terrain, the road, its verge, the barriers and the walls stay as they are, the driving too.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !rng) return;
  const { soil, tuft, softScen, mix3, chain } = BT;

  /* the verge's strip on both sides of the whole track: every `step` m a place between the edge and the barrier where the strip is wide
     enough, its height the verge's profile there; C.patch(R) gives a patch's colour and radius, C.tuft(R) a tuft's colour at the foot */
  const verge = (root, matV, gT, seed, C) => {
    const T = API.T, near = API.vrNear, st = { zaplate: 0, sopi: 0 };
    if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), w = T.w, e0 = w + 0.9, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), r3 = R(), bar = sd > 0 ? T.br[i] : T.bl[i], e1 = bar - 0.35;
      if (!(e1 - e0 > 0.9)) continue;
      const lip = Math.max(w + 1.1, bar - 0.7);
      const at = (o) => [T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o];
      const own = (x, z) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * T.ds < 12 && q.dd <= 0 && Math.abs(q.lat) < bar - 0.3; };   // (this leg's verge, no other road nearer: inside its barrier dd is 0)
      const sunk = (x, z) => gT(x, z) < T.hy[i] - 3;   // (a bridge or a high fill: the verge is not on the ground there)
      const gV = (x, z) => { const q = near(x, z), j = q.i >= 0 ? q.i : i, o = Math.abs(q.lat);
        const t = Math.min(1, Math.max(0, (o - (w + 0.5)) / Math.max(0.3, lip - (w + 0.5)))); return T.hy[j] - 0.02 - 0.1 * t; };
      if (r0 < C.share) {   // a patch on the strip
        const o = e0 + r1 * (e1 - e0), [x, z] = at(o), P = C.patch(R), rr = Math.min(P.r, (e1 - e0) * 0.5, o - e0 + 0.4, e1 - o + 0.4);
        if (rr > 0.3 && own(x, z) && !sunk(x, z)) { soil(soft, gV, x, z, rr, P.col, R, 0.05); st.zaplate++; }
      }
      if (r2 < C.foot) {   // low tufts at the barrier's foot
        const n = 1 + Math.floor(r3 * 3);
        for (let q = 0; q < n; q++) { const o = e1 - 0.15 - R() * 0.4, [x0, z0] = at(o), x = x0 + T.tx[i] * (R() - 0.5) * 2.4, z = z0 + T.tz[i] * (R() - 0.5) * 2.4;
          if (!own(x, z) || sunk(x, z)) continue;
          const h = R(); tuft(soft.get(x, z), x, gV(x, z), z, 0.22 + h * 0.16, 0.24 + h * 0.22, C.tuft(R), R, 5); st.sopi++; }
      }
    }
    soft.done();
    for (const g of root.children) if (g.isGroup) for (const m of g.children) if (m.userData.rob && m.name === 'rob') m.castShadow = false;
    return st;
  };
  BT.verge = verge;   // (the twenty-fifth group's tracks use the same strip: js/world-chase-bt25.js)

  /* Tianmen: docs/proge/tianmen.md: »gost subtropski gozd …, skale ob cesti«, the mountain's wet air (its mist). On the verge the damp
     ground shows: dark moss in streaks, the forest's brown fallen leaves blown to the barrier, wet grey-brown earth; at the barrier's and
     the wall's foot the green grass in low tufts. */
  const TM = { step: 2.4, share: 0.5, foot: 0.35,
    patch: (R) => { const r = R();
      return r < 0.4 ? { col: vary(mix3([0.33, 0.37, 0.21], [0.37, 0.4, 0.23], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (moss)
        : r < 0.75 ? { col: vary(mix3([0.42, 0.36, 0.25], [0.46, 0.39, 0.27], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (fallen leaves)
        : { col: vary([0.37, 0.34, 0.28], R, 0.015), r: 0.8 + R() * 0.9 }; },   // (wet earth)
    tuft: (R) => vary(mix3([0.32, 0.48, 0.19], [0.4, 0.52, 0.22], R()), R, 0.03) };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'tianmen') try { if (ctx.out) ctx.out.robBt24 = verge(ctx.root, ctx.out.matV, (o && o.gH) || API.vrGround, 24301, TM); } catch (e) { console.error('chase-bt24 (tianmen):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }

  /* Sa Calobra: docs/proge/sacalobra.md: »sive apnenčaste stene in skale, … suha sredozemska makija, šopi trave càrritx …, rdeča zemlja
     (terra rossa) na brežinah ob cesti«. On the verge the red earth washed down from the banks in low patches, the limestone's pale grit
     and fallen chips, dry straw-coloured grass; at the low stone walls' foot the càrritx in sparse dry tufts. */
  const SC = { step: 2.8, share: 0.45, foot: 0.22,
    patch: (R) => { const r = R();
      return r < 0.45 ? { col: vary(mix3([0.55, 0.41, 0.3], [0.58, 0.45, 0.33], R()), R, 0.015), r: 0.9 + R() * 1.2 }   // (terra rossa)
        : r < 0.8 ? { col: vary(mix3([0.6, 0.58, 0.52], [0.64, 0.62, 0.55], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (limestone grit)
        : { col: vary([0.6, 0.56, 0.4], R, 0.015), r: 0.8 + R() * 0.9 }; },   // (dry grass)
    tuft: (R) => vary(mix3([0.62, 0.59, 0.4], [0.76, 0.68, 0.42], R()), R, 0.03) };
  const LK = API.PL_LOOK;
  if (LK && LK.sacalobra && chain) chain(LK.sacalobra, (ctx) => { if (ctx.out) ctx.out.robBt24 = verge(ctx.root, ctx.matV, API.caGround || API.vrGround, 24302, SC); });
})();
