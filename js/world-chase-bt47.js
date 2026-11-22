/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the forty-seventh group of the real tracks, a second pass:
   Silkeborg and Quezaltepeque (both on the circuit builder, js/world-rbring.js). js/world-realizem-bt.js gave them dry-grass tufts,
   heather cushions and lava stones within ~30-55 m; from behind the car the fences' foot, the plantations' floor and everything past
   ~30 m still showed one even colour. So here, in a few big meshes of their own (Silkeborg has little room for more draw calls): on Silkeborg the uncut straw at the fences' foot with heather where the heath comes close, under the plantations of
   pine and spruce the needles' rust-brown litter with low green undergrowth, and ~30-60 m out loose tussock groups with a young pine
   now and then; on Quezaltepeque tall green and dry-season grass at the fences' foot, the scrub's bushes on the scrubland, and ~30-60 m
   out grass groups and bushes, with the old flow's stones out there too. Never on the sand, never on the pits' side along the pits;
   the terrain, the road, the fences, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, sstep } = API;
  if (!BT || !BT.walk || !BT.tuft || !BT.cushion || !BT.soil || !BT.mix3 || !rng || !vary || !sstep) return;
  const { soil, tuft, cushion, walk, mix3 } = BT;

  /* the builder's own tests: the pits' side along the pits (def.pit), what the build keeps clear */
  const envOf = (ctx) => {
    const T = API.T, pd = T && T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, { nrNear } = API;
    const bad = (x, z) => { if (!ps) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
    const ex = ctx.excluded || (() => false);
    return { near: nrNear, excluded: (x, z) => ex(x, z) || bad(x, z), pit: (s, sd) => !!ps && sd === ps && !!T.pitAt(s) };
  };
  /* the tufts in meshes of their own, as BT.softScen (userData.rob: the animals' and the people's tests of a free place leave them out),
     but in big chunks: a few meshes for the whole short circuit, so a draw call or two more at most */
  const soft = (ctx, size) => { const ch = new API.Chunks(size); return { get: (x, z) => ch.get(x, z), done() { const grp = new THREE.Group(); ch.addTo(grp, ctx.matV, false, true);   // (no shadow of their own: low, and the shadow pass would draw them twice)
    for (const m of grp.children) { m.name = 'rob'; m.userData.rob = m.userData.lj = true; } if (grp.children.length) ctx.root.add(grp); } }; };
  const wrap = (id, size, fn) => {
    const L = (API.rbLook || {})[id]; if (!L) return;
    const base = L.extra;
    L.extra = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try { if (ctx.root && ctx.matV && API.Chunks && API.nrGround && API.nrNear && API.nrLC && API.T) { const S = soft(ctx, size); r.robBt47 = fn(S, envOf(ctx)); S.done(); } } catch (e) { console.error('chase-bt47 (' + id + '):', e); }
      return r;
    };
  };

  /* ---- Silkeborg: docs/proge/silkeborg.md: »resava z reso (vijolično-rjava) in nizkimi bori, suha trava in peščene zaplate«,
     »nasadi rdečega bora in smreke z brezami«, low chain-link fences. Late summer: the straw pale, the heather purple and brown ---- */
  const SK = { straw: [0.7, 0.64, 0.4], grn: [0.4, 0.5, 0.24], bloom: [0.5, 0.31, 0.5], old: [0.42, 0.32, 0.24],
    needle: [0.48, 0.34, 0.22], under: [0.3, 0.44, 0.2], fern: [0.36, 0.48, 0.22], pine: [0.3, 0.44, 0.24], sand: [0.8, 0.73, 0.54] };
  wrap('silkeborg', 1024, (scen, env) => {
    const { nrGround: gH, nrLC, nrSlope, NR: P } = API, sand = API.skSand || (() => 0), st = { rob: 0, resa: 0, iglice: 0, podrast: 0, dalj: 0, bori: 0 };
    const open = (x, z) => { const c = nrLC(x, z); return (c === 0 || c === 2) && !(sand(x, z) > 0.2); };
    const dry = (x, z) => P ? sstep(0.45, 0.74, P.n3(x * 0.8 + 90, z * 0.8 - 40)) : 0.5;
    const bl = (x, z) => P ? sstep(0.38, 0.66, P.n1(x * 0.9 + 40, z * 0.9 - 60)) : 0.4;
    // the fences' foot: the mower leaves a strip of straw along the wire, heather where the heath reaches it
    walk(env, 47101, 3, 1.2, 2.6, (x, z) => open(x, z) && nrSlope(x, z) < 1 ? 0.85 : 0, (gx, gz, k, R, free) => {
      for (let q = 0, n = 2 + Math.floor(R() * 3); q < n; q++) {
        const x = gx + (R() - 0.5) * 4, z = gz + (R() - 0.5) * 4, h = R();
        if (!free(x, z, 0.3) || !open(x, z)) continue;
        if (nrLC(x, z) === 2 && R() < 0.6) { cushion(scen.get(x, z), x, gH(x, z) + 0.02, z, 0.35 + h * 0.35, 0.22 + h * 0.14, vary(mix3(SK.old, SK.bloom, bl(x, z) * 0.9), R, 0.03), R); st.resa++; }
        else { tuft(scen.get(x, z), x, gH(x, z), z, 0.26 + h * 0.24, 0.34 + h * 0.3, vary(mix3(SK.grn, SK.straw, Math.min(1, 0.4 + dry(x, z) * 0.45 + R() * 0.2)), R, 0.03), R, 5); st.rob++; }
      } });
    // under the plantations: the needles' litter, low undergrowth (bilberry, bracken) in patches
    walk(env, 47102, 4, 20, 2.6, (x, z) => nrLC(x, z) === 1 && nrSlope(x, z) < 1 ? 0.75 : 0, (gx, gz, k, R, free) => {
      if (free(gx, gz, 2)) { soil(scen, gH, gx, gz, 1.0 + R() * 1.4, vary(SK.needle, R, 0.03), R, 0.04); st.iglice++; }
      for (let q = 0, n = 1 + Math.floor(R() * 3); q < n; q++) {
        const x = gx + (R() - 0.5) * 5, z = gz + (R() - 0.5) * 5, h = R();
        if (!free(x, z, 1) || nrLC(x, z) !== 1) continue;
        if (R() < 0.55) cushion(scen.get(x, z), x, gH(x, z), z, 0.4 + h * 0.4, 0.22 + h * 0.18, vary(SK.under, R, 0.03), R);
        else tuft(scen.get(x, z), x, gH(x, z), z, 0.4 + h * 0.3, 0.32 + h * 0.26, vary(SK.fern, R, 0.03), R, 6);
        st.podrast++;
      } });
    // ~30-60 m out: loose tussock groups on the dry grass and the heath, a young pine of the heath now and then
    walk(env, 47103, 6, 30, 30, (x, z) => open(x, z) && nrSlope(x, z) < 0.8 ? 0.4 : 0, (gx, gz, k, R, free) => {
      if (R() < 0.18 && free(gx, gz, 4)) { const h = R(); tuft(scen.get(gx, gz), gx, gH(gx, gz), gz, 0.5 + h * 0.4, 1.0 + h * 0.9, vary(SK.pine, R, 0.025), R, 6); st.bori++; }
      for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) {
        const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = R();
        if (!free(x, z, 3) || !open(x, z)) continue;
        if (nrLC(x, z) === 2) cushion(scen.get(x, z), x, gH(x, z) + 0.02, z, 0.5 + h * 0.5, 0.26 + h * 0.16, vary(mix3(SK.old, SK.bloom, bl(x, z)), R, 0.03), R);
        else tuft(scen.get(x, z), x, gH(x, z), z, 0.42 + h * 0.36, 0.4 + h * 0.36, vary(mix3(SK.grn, SK.straw, Math.min(1, 0.35 + dry(x, z) * 0.5 + R() * 0.2)), R, 0.03), R, 5);
        st.dalj++;
      } });
    return st;
  });

  /* ---- Quezaltepeque: docs/proge/quezaltepeque.md: »zelen hribovit svet s suhimi rumenimi lisami: trate, grmovje, gaji listavcev in
     palm«, »stara lava (temna, siva in rjava kamnita tla z nizkim grmovjem)«, mown grass, the fences >3 m off the road ---- */
  const QZ = { grn: [0.56, 0.8, 0.3], lush: [0.3, 0.46, 0.17], dry: [0.74, 0.68, 0.38], bush: [0.5, 0.74, 0.28], bush2: [0.58, 0.74, 0.32],
    lava: [[0.3, 0.29, 0.28], [0.38, 0.32, 0.27], [0.26, 0.25, 0.24], [0.42, 0.36, 0.3]], ash: [0.4, 0.36, 0.31] };
  wrap('quezaltepeque', 256, (scen, env) => {
    const { nrGround: gH, nrLC, nrSlope, qzLava, NR: P, rock } = API, lava = qzLava || (() => 0), st = { rob: 0, grmi: 0, dalj: 0, kamni: 0 };
    const dry = (x, z) => P ? sstep(0.5, 0.75, P.n3(x * 0.35 + 90, z * 0.35 - 40)) : 0.3;
    const green = (x, z) => { const c = nrLC(x, z); return (c === 0 || c === 2) && lava(x, z) < 0.3; };
    // the fences' foot: the grass the mower does not reach, tall and green, dry yellow where the ground is
    walk(env, 47201, 3, 1.2, 2.6, (x, z) => green(x, z) && nrSlope(x, z) < 1 ? 0.85 : 0, (gx, gz, k, R, free) => {
      for (let q = 0, n = 2 + Math.floor(R() * 3); q < n; q++) {
        const x = gx + (R() - 0.5) * 4, z = gz + (R() - 0.5) * 4, h = R();
        if (!free(x, z, 0.3) || !green(x, z)) continue;
        tuft(scen.get(x, z), x, gH(x, z), z, 0.3 + h * 0.26, 0.42 + h * 0.4, vary(mix3(QZ.lush, QZ.dry, Math.min(1, dry(x, z) * 0.7 + R() * 0.25)), R, 0.03), R, 5); st.rob++;
      } });
    // the scrubland within ~30 m: the bushes in loose groups with grass between
    walk(env, 47202, 5, 26, 3, (x, z) => nrLC(x, z) === 2 && lava(x, z) < 0.3 && nrSlope(x, z) < 1 ? 0.7 : 0, (gx, gz, k, R, free) => {
      for (let q = 0, n = 2 + Math.floor(R() * 3); q < n; q++) {
        const x = gx + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 6, h = R();
        if (!free(x, z, 2) || nrLC(x, z) !== 2) continue;
        if (R() < 0.6) { cushion(scen.get(x, z), x, gH(x, z), z, 0.55 + h * 0.6, 0.4 + h * 0.4, vary(R() < 0.6 ? QZ.bush : QZ.bush2, R, 0.03), R); st.grmi++; }
        else { tuft(scen.get(x, z), x, gH(x, z), z, 0.4 + h * 0.3, 0.45 + h * 0.4, vary(mix3(QZ.grn, QZ.dry, dry(x, z) * 0.6), R, 0.03), R, 5); st.rob++; }
      } });
    // ~30-60 m out: grass groups and bushes on the green land, the old flow's stones and its low scrub
    const smooth0 = API.ROCK_SMOOTH;
    walk(env, 47203, 6, 30, 30, (x, z) => { const c = nrLC(x, z); return (c === 0 || c === 2) && nrSlope(x, z) < 0.9 ? (lava(x, z) > 0.5 ? 0.45 : 0.3) : 0; }, (gx, gz, k, R, free) => {
      if (lava(gx, gz) > 0.5) {
        if (free(gx, gz, 3)) { soil(scen, gH, gx, gz, 1.2 + R() * 1.4, vary(QZ.ash, R, 0.03), R, 0.04); }
        for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) {
          const x = gx + (R() - 0.5) * 8, z = gz + (R() - 0.5) * 8, w = 0.3 + Math.pow(R(), 2) * 0.8;
          if (!free(x, z, 2.5 + w) || lava(x, z) < 0.5) continue;
          if (rock && R() < 0.7) { API.ROCK_SMOOTH = false; rock(scen.get(x, z), x, gH(x, z) + w * 0.18, z, w * 1.4, w * 0.7, w, R() * Math.PI * 2, vary(QZ.lava[Math.floor(R() * QZ.lava.length)], R, 0.03), R, 0.34, 0.35); st.kamni++; }
          else { cushion(scen.get(x, z), x, gH(x, z), z, 0.4 + w * 0.4, 0.3 + w * 0.2, vary(QZ.bush2, R, 0.03), R); st.grmi++; }
        }
        API.ROCK_SMOOTH = smooth0;
        return;
      }
      for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) {
        const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = R();
        if (!free(x, z, 3) || !green(x, z)) continue;
        if (R() < (nrLC(x, z) === 2 ? 0.55 : 0.2)) cushion(scen.get(x, z), x, gH(x, z), z, 0.6 + h * 0.7, 0.45 + h * 0.45, vary(QZ.bush, R, 0.03), R);
        else tuft(scen.get(x, z), x, gH(x, z), z, 0.5 + h * 0.4, 0.5 + h * 0.45, vary(mix3(QZ.grn, QZ.dry, Math.min(1, dry(x, z) * 0.8 + R() * 0.2)), R, 0.03), R, 5);
        st.dalj++;
      } });
    API.ROCK_SMOOTH = smooth0;
    return st;
  });
})();
