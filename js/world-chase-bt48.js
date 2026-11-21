/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the forty-eighth group of the real tracks: Livorno and Styria, a
   second pass on two tracks whose roadside the seventeenth and eighteenth groups (js/world-chase-bt17.js, js/world-chase-bt18.js: the
   three bands of World.ext.goreRob, edge 0.5-3.5 m, mid 1-14 m, far 6-30 m) already set. From behind the car the ground past ~30 m was
   still one smooth colour up to the horizon: in Livorno the macchia hillside and the dry grass above the coast road, in Styria the
   unmown meadow past the mown lawns. So here a fourth band out to ~60 m. Livorno (its own corridor builder, js/world-livorno.js): wide
   low patches of dry straw grass, the macchia's brown-grey ground and pine-needle litter, and on the steeper ground (where the first
   pass put nothing) the pale sandstone bare (docs/proge/livorno.md: »peščenjak na strminah«), in meshes of their own (softScen). Styria
   (the shared builder, js/world-rbring.js): the meadow's tussock groups with their yellow and white flowering patches, and at the
   woods' edge the brown litter of needles and beech leaves, in the builder's own scenery chunks (no draw calls of their own). Nothing
   on the road, in the builders' excluded places (towns, stands, buildings, car parks), by the sea, on the bridges, on the mown lawns or
   on the pits' side along the pits. The terrain, the road, the walls, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, sstep } = API;
  if (!BT || !BT.tuft || !BT.walk || !BT.mix3 || !BT.soil || !BT.softScen || !vary || !rng || !sstep) return;
  const { tuft, walk, mix3, soil, softScen } = BT;

  /* Livorno: docs/proge/livorno.md: »makija«, »peščenjak na strminah«, pines and maritime pines above the coast. Every ~7 m on both
     sides a wide low patch between 8 and 55 m past the barrier: on the gentle ground the straw grass (the summer's), the macchia's
     grey-brown earth and the pines' rust needle litter; on the steep ground (slope 0.9-1.7) the pale sandstone. Never in the towns
     (land cover 3), where the ground lies far below the road (a valley under the fill), where another leg's road is nearer, or in the
     builder's own bad places (the sea, the beach, the bridges). */
  const LIV = { seed: 48101, step: 7, share: 0.55, from: 8, to: 55, drop: 9,
    straw: [0.74, 0.67, 0.44], earth: [0.56, 0.48, 0.36], needle: [0.55, 0.42, 0.28], sand: [0.72, 0.65, 0.5], sand2: [0.64, 0.58, 0.46] };
  const livBand = (ctx, o) => {
    const T = API.T, near = o.near, gT = o.gH, lc = o.lc, st = { pas: 0, pesc: 0 };
    if (!T || !T.br || !near || !gT || !lc || !ctx.root || !ctx.out || !ctx.out.matV) return st;
    const R = rng(LIV.seed), soft = softScen(ctx.root, ctx.out.matV), N = T.px.length, P = API.NR;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(LIV.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), r3 = R(), r4 = R(); if (r0 > LIV.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], off = bar + LIV.from + r1 * (LIV.to - LIV.from), a = (r2 - 0.5) * LIV.step;
      const x = T.px[i] + T.nx[i] * sd * off + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * off + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > off + 10) continue;   // (another leg's road is nearer)
      if (ctx.excluded(x, z) || (o.bad && o.bad(x, z))) continue;
      const c = lc(x, z); if (c === 3) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - LIV.drop)) continue;
      const sl = slope(x, z), k = 1 + 0.4 * (off - LIV.from) / (LIV.to - LIV.from);
      if (sl > 1.7) continue;
      if (sl > 0.9) { soil(soft, gT, x, z, (1.4 + r3 * 1.6) * k, vary(mix3(LIV.sand, LIV.sand2, r4), R, 0.025), R, 0.07); st.pesc++; continue; }   // (the sandstone bare on the steep ground)
      const dry = P ? sstep(0.4, 0.72, P.n3(x * 0.6 - 70, z * 0.6 + 150)) : 0.5;
      const col = c === 1 ? (r4 < 0.6 ? LIV.needle : LIV.earth) : c === 2 ? (r4 < 0.55 ? LIV.earth : mix3(LIV.straw, LIV.earth, 0.5)) : mix3(LIV.earth, LIV.straw, Math.min(1, dry * 0.8 + r4 * 0.3));
      soil(soft, gT, x, z, (1.3 + r3 * 1.4) * k, vary(col, R, 0.025), R, 0.06); st.pas++;
    }
    soft.done();
    return st;
  };
  /* the builder calls World.ext.goreRob(…, 'livorno', …) once (js/world-livorno.js); the band rides on that call */
  const GR = World.ext.goreRob;
  const goreRob48 = function (ctx, id, o) {
    const r = GR.apply(this, arguments);
    if (id === 'livorno') try { const s = livBand(ctx, o || {}); if (r && typeof r === 'object') r.pasBt48 = s; } catch (e) { console.error('chase-bt48 (livorno):', e); }
    return r;
  };
  Object.assign(goreRob48, GR);   // (LOOK and the rest stay reachable)
  World.ext.goreRob = goreRob48;

  /* Styria: docs/proge/rbring.md: »travniki (z rumenimi in belimi cvetočimi lisami)«, »smreke in bukve«; the mown stripes reach ~35 m past
     the fence. So from ~34 to ~60 m on the open meadow (land cover 0 and 2, slope under 0.8) loose tussock groups of the unmown grass, its
     colour drifting between the fresh green and the hay; among them low patches of the yellow (buttercup) and the white (daisy, yarrow)
     flowering; at the woods' edge (land cover 1) the brown litter of spruce needles and beech leaves in low patches. */
  const RB = { seed: 48201, k: 0.4, flower: 0.3, grass: [0.4, 0.52, 0.24], hay: [0.58, 0.58, 0.32], yellow: [0.86, 0.82, 0.42], white: [0.88, 0.88, 0.82], leaf: [0.46, 0.34, 0.22] };
  const rbFar = (ctx, env, st) => {
    const { nrGround: gH, nrLC, nrSlope } = API, scen = ctx.scen; if (!scen || !gH || !nrLC || !nrSlope) return;
    st.dalj = 0; st.cvet = 0; st.listje = 0;
    walk(env, RB.seed, 6, 26, 34, (x, z) => { const c = nrLC(x, z); return c <= 2 && nrSlope(x, z) < 0.8 ? (c === 1 ? 0.25 : RB.k) : 0; }, (gx, gz, k, R, free) => {
      const c = nrLC(gx, gz), P = API.NR;
      if (c === 1) { if (free(gx, gz, 4)) { soil(scen, gH, gx, gz, 1.3 + R() * 1.5, vary(RB.leaf, R, 0.03), R, 0.05); st.listje++; } return; }
      if (R() < RB.flower && free(gx, gz, 4)) { soil(scen, gH, gx, gz, 1.0 + R() * 1.4, vary(R() < 0.55 ? RB.yellow : RB.white, R, 0.025), R, 0.04); st.cvet++; }
      for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) {
        const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = R();
        if (!free(x, z, 3) || env.excluded(x, z) || nrLC(x, z) === 1 || nrLC(x, z) > 2) continue;
        const dry = P ? sstep(0.45, 0.75, P.n3(x * 0.7 - 30, z * 0.7 + 80)) : 0.3;
        tuft(scen.get(x, z), x, gH(x, z), z, 0.4 + h * 0.4, 0.4 + h * 0.4, vary(mix3(RB.grass, RB.hay, Math.min(1, dry * 0.8 + R() * 0.25)), R, 0.03), R, 5); st.dalj++;
      } });
  };
  const RBL = (API.rbLook || {}).rbring;
  if (RBL) {
    const base = RBL.extra;
    RBL.extra = function (ctx) {
      const r = base ? base.call(this, ctx) : null;
      if (API.THEME !== 'rbring') return r;   // (the tracks that borrow Styria's look keep theirs)
      try {
        const T = API.T, pd = T && T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, { nrNear } = API;
        const bad = (x, z) => { if (!ps) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
        const st = {};
        rbFar(ctx, { near: nrNear, excluded: (x, z) => ctx.excluded(x, z) || bad(x, z), pit: (s, sd) => !!ps && sd === ps && !!T.pitAt(s) }, st);
        if (r) r.robBt48 = st;
      } catch (e) { console.error('chase-bt48 (rbring):', e); }
      return r;
    };
  }
})();
