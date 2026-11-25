/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixty-fifth group of the real tracks, a third pass:
   Bathurst and Kågeröd (both on the circuit builder, js/world-rbring.js). js/world-chase-bt33.js and js/world-chase-bt40.js gave them
   the edge bands and tussock groups ~30-60 m out; from behind the car the strip between ~8 and ~30 m and the ground near the horizon
   (~45-60 m) still read as one even colour. So here, in a few big meshes of their own (1 km chunks, marked userData.rob: the animals'
   and the people's tests of a free place leave them out; a handful of draw calls, no shadow of their own):
   on Bathurst (docs/proge/bathurst.md) the drier straw at the walls' and the fences' foot, the red-brown soil showing through the
   pasture, the gums' bark-and-leaf litter under the open forest and wide pasture patches, green in the hollows, toward the horizon;
   on Kågeröd (docs/proge/kagerod.md) the meadow's buttercup and cow-parsley at the fences' foot, the beech litter at the woods' edge,
   and out on the open land wide patches of the fields (ripening grain, the ploughed soil, the beet's green) and the meadow.
   Never on the pits' side along the pits, never on what the build keeps clear; the terrain, the road, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, sstep } = API;
  if (!BT || !BT.walk || !BT.tuft || !BT.soil || !BT.mix3 || !vary || !sstep) return;
  const { soil, tuft, walk, mix3 } = BT;

  const envOf = (ctx) => {
    const T = API.T, pd = T && T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, { nrNear } = API;
    const bad = (x, z) => { if (!ps) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
    const ex = ctx.excluded || (() => false);
    return { near: nrNear, excluded: (x, z) => ex(x, z) || bad(x, z), pit: (s, sd) => !!ps && sd === ps && !!T.pitAt(s) };
  };
  const soft = (ctx, size) => { const ch = new API.Chunks(size); return { get: (x, z) => ch.get(x, z), done() { const grp = new THREE.Group(); ch.addTo(grp, ctx.matV, false, true);
    for (const m of grp.children) { m.name = 'rob'; m.userData.rob = m.userData.lj = true; } if (grp.children.length) ctx.root.add(grp); } }; };
  const wrap = (id, fn) => {
    const L = (API.rbLook || {})[id]; if (!L) return;
    const base = L.extra;
    L.extra = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try { if (ctx.root && ctx.matV && API.Chunks && API.nrGround && API.nrNear && API.nrLC && API.nrSlope && API.T) { const S = soft(ctx, 1024); r.robBt65 = fn(S, envOf(ctx)); S.done(); } } catch (e) { console.error('chase-bt65 (' + id + '):', e); }
      return r;
    };
  };
  const noise = (f, a, b, lo, hi) => (x, z) => API.NR ? sstep(lo, hi, API.NR[f](x * 0.7 + a, z * 0.7 + b)) : 0.5;

  /* ---- Bathurst: spring pastures green and olive drying to straw, greener in the hollows, red-brown soil patches, open gum forest
     with wattles, concrete walls close to the road on the ridge ---- */
  const BA = { straw: [0.72, 0.66, 0.42], olive: [0.44, 0.47, 0.25], grass: [0.4, 0.5, 0.24], lush: [0.34, 0.5, 0.22],
    soil: [0.52, 0.35, 0.24], bark: [0.54, 0.45, 0.35], leaf: [0.5, 0.48, 0.32] };
  wrap('bathurst', (scen, env) => {
    const { nrGround: gH, nrLC, nrSlope } = API, st = { podnozje: 0, prst: 0, listje: 0, pas: 0, obzorje: 0 };
    const dry = noise('n3', 131, -57, 0.42, 0.72), open = (x, z) => { const c = nrLC(x, z); return c === 0 || c === 2; };
    // the walls' and the fences' foot: the straw the mower leaves, a red-brown bare spot now and then
    walk(env, 65101, 3.5, 2, 3.2, (x, z) => open(x, z) && nrSlope(x, z) < 1 ? 0.7 : 0, (gx, gz, k, R, free) => {
      if (R() < 0.22 && free(gx, gz, 3)) { soil(scen, gH, gx, gz, 0.7 + R() * 0.8, vary(BA.soil, R, 0.03), R, 0.05); st.prst++; }
      for (let q = 0, n = 2 + Math.floor(R() * 2); q < n; q++) {
        const x = gx + (R() - 0.5) * 3, z = gz + (R() - 0.5) * 3, h = R();
        if (!free(x, z, 2.6) || !open(x, z)) continue;
        tuft(scen.get(x, z), x, gH(x, z), z, 0.3 + h * 0.3, 0.3 + h * 0.3, vary(mix3(BA.olive, BA.straw, Math.min(1, 0.45 + dry(x, z) * 0.5)), R, 0.03), R, 5); st.podnozje++;
      } });
    // under the open gum forest: the bark strips' and the leaves' litter, pale
    walk(env, 65102, 5, 22, 4, (x, z) => nrLC(x, z) === 1 && nrSlope(x, z) < 1 ? 0.6 : 0, (gx, gz, k, R, free) => {
      if (free(gx, gz, 3)) { soil(scen, gH, gx, gz, 1.0 + R() * 1.3, vary(mix3(BA.bark, BA.leaf, R()), R, 0.03), R, 0.04); st.listje++; }
    });
    // ~8-30 m: the pasture in wide patches, the red soil showing through on the dry rises
    walk(env, 65103, 6, 22, 8, (x, z) => open(x, z) && nrSlope(x, z) < 0.9 ? 0.5 : 0, (gx, gz, k, R, free) => {
      if (!free(gx, gz, 4)) return;
      const d = dry(gx, gz), col = d > 0.75 && R() < 0.35 ? BA.soil : mix3(mix3(BA.lush, BA.grass, d * 1.6), BA.straw, Math.max(0, d - 0.4) * 0.9);
      soil(scen, gH, gx, gz, 1.6 + R() * 1.8, vary(col, R, 0.02), R, 0.05); st.pas++;
    });
    // ~42-60 m, toward the horizon: bigger, fewer patches; the hollows greener
    walk(env, 65104, 9, 18, 42, (x, z) => open(x, z) && nrSlope(x, z) < 0.8 ? 0.45 : 0, (gx, gz, k, R, free) => {
      if (!free(gx, gz, 6)) return;
      const d = dry(gx, gz);
      soil(scen, gH, gx, gz, 3 + R() * 3, vary(mix3(mix3(BA.lush, BA.olive, d), BA.straw, Math.max(0, d - 0.5)), R, 0.02), R, 0.06); st.obzorje++;
    });
    return st;
  });

  /* ---- Kågeröd: beech woods with spruce and birch, meadows with buttercup and cow-parsley, fields of beet, wheat, barley and the
     ploughed land; the fences more than 3 m from the road ---- */
  const KG = { grass: [0.36, 0.52, 0.22], lush: [0.3, 0.5, 0.2], butter: [0.82, 0.74, 0.24], parsley: [0.84, 0.84, 0.76],
    leaf: [0.5, 0.39, 0.27], grain: [0.7, 0.64, 0.38], plough: [0.5, 0.39, 0.29], beet: [0.32, 0.5, 0.22] };
  wrap('kagerod', (scen, env) => {
    const { nrGround: gH, nrLC, nrSlope } = API, st = { cvetje: 0, listje: 0, polja: 0, obzorje: 0 };
    const fld = noise('n1', -73, 211, 0.3, 0.7), open = (x, z) => nrLC(x, z) === 0;
    // the fences' foot (from ~3 m): taller meadow grass with buttercup and cow-parsley heads
    walk(env, 65201, 3.5, 2.5, 3.4, (x, z) => open(x, z) && nrSlope(x, z) < 1 ? 0.65 : 0, (gx, gz, k, R, free) => {
      for (let q = 0, n = 2 + Math.floor(R() * 3); q < n; q++) {
        const x = gx + (R() - 0.5) * 3.5, z = gz + (R() - 0.5) * 3.5, h = R(), f = R();
        if (!free(x, z, 3) || !open(x, z)) continue;
        const col = f < 0.18 ? KG.butter : f < 0.3 ? KG.parsley : mix3(KG.lush, KG.grass, R());
        tuft(scen.get(x, z), x, gH(x, z), z, 0.24 + h * 0.26, (f < 0.3 ? 0.42 : 0.3) + h * 0.28, vary(col, R, 0.03), R, 5); st.cvetje++;
      } });
    // the woods' edge: last year's beech leaves, copper-brown
    walk(env, 65202, 5, 18, 4, (x, z) => nrLC(x, z) === 1 && nrSlope(x, z) < 1 ? 0.6 : 0, (gx, gz, k, R, free) => {
      if (free(gx, gz, 3)) { soil(scen, gH, gx, gz, 1.0 + R() * 1.4, vary(KG.leaf, R, 0.03), R, 0.04); st.listje++; }
    });
    // ~8-60 m on the open land: the fields' patches by a slow noise (grain, ploughed soil, beet) and the meadow between
    const field = (x, z, R) => { const v = fld(x, z); return v < 0.25 ? mix3(KG.lush, KG.grass, R()) : v < 0.5 ? KG.beet : v < 0.75 ? KG.grain : KG.plough; };
    walk(env, 65203, 6, 24, 8, (x, z) => open(x, z) && nrSlope(x, z) < 0.9 ? 0.5 : 0, (gx, gz, k, R, free) => {
      if (free(gx, gz, 4)) { soil(scen, gH, gx, gz, 1.6 + R() * 1.8, vary(field(gx, gz, R), R, 0.02), R, 0.05); st.polja++; }
    });
    walk(env, 65204, 9, 18, 42, (x, z) => open(x, z) && nrSlope(x, z) < 0.8 ? 0.45 : 0, (gx, gz, k, R, free) => {
      if (free(gx, gz, 6)) { soil(scen, gH, gx, gz, 3 + R() * 3, vary(field(gx, gz, R), R, 0.02), R, 0.06); st.obzorje++; }
    });
    return st;
  });
})();
