/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fifty-seventh group of the real tracks: Kotor and Ella, a
   third look at the two mountain roads whose verge and bank the sixth, twelfth, twenty-seventh and twenty-ninth groups set
   (js/world-chase-bt6.js, js/world-chase-bt12.js, js/world-chase-bt27.js, js/world-chase-bt29.js). Seen from behind the car, past those
   strips (the karst within ~20 m on Kotor, the verge and the bank to ~9 m on both) the ground out to the next bend still read as one
   smooth face: on Kotor the open karst between the hairpins one olive grey, on Ella the grassy slopes one green. So here, as on
   Silkeborg and Quezaltepeque (js/world-chase-bt47.js): on the wide verge between the asphalt and the barrier line (where the camera
   looks most) loose stones and dry tufts on Kotor, green tussocks and red laterite on Ella, in loose groups; and past the barrier a far
   band ~20-60 m out of loose groups (what lies there in each place, docs/proge/kotor.md, docs/proge/ella.md). All of it in a few big
   meshes of its own (1024 m chunks, no shadow); the terrain, the road, the walls, the barriers, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, sstep } = API;
  if (!BT || !BT.walk || !BT.tuft || !BT.cushion || !BT.soil || !BT.mix3 || !vary || !sstep) return;
  const { soil, tuft, cushion, walk, mix3 } = BT;

  /* the tufts and the stones in meshes of their own, as js/world-chase-bt47.js: big chunks, a draw call or two more at most */
  const soft = (root, matV) => { const ch = new API.Chunks(1024); return { get: (x, z) => ch.get(x, z), done() { const grp = new THREE.Group(); ch.addTo(grp, matV, false, true);   // (no shadow of their own: low, and the shadow pass would draw them twice)
    for (const m of grp.children) { m.name = 'rob'; m.userData.rob = m.userData.lj = true; } if (grp.children.length) root.add(grp); } }; };
  const grp = (x, z, ox, sc) => { const P = API.VR; return P ? 0.45 + 0.55 * sstep(0.3, 0.7, P.c2((x + ox) / sc, (z - ox) / sc)) : 0.7; };   // (in loose groups, not an even carpet)

  /* the verge between the asphalt and the barrier line (where the camera behind the car looks most): every `step` m on both sides, where
     the strip is wide, a few places on it, their height the verge's own profile (as BT.verge, js/world-chase-bt24.js); only this leg's
     strip (no other road nearer), not on a bridge or a high fill. put(x, y, z, R, o): o the metres from the asphalt's edge */
  const inner = (gT, seed, step, gate, put) => {
    const T = API.T, near = API.vrNear; if (!T || !T.br || !T.bl || !T.hy || !near || !API.rng) return;
    const R = API.rng(seed), w = T.w, e0 = w + 1.3, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i], e1 = bar - 0.55, n = Math.min(8, Math.floor((e1 - e0) / 1.4));
      const lip = Math.max(w + 1.1, bar - 0.7);
      for (let q = 0; q < n; q++) {
        const o = e0 + R() * (e1 - e0), a = (R() - 0.5) * step, g = R();
        const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
        if (g > gate(x, z)) continue;
        const k = near(x, z), lat = Math.abs(k.lat);
        if (!(k.i >= 0 && Math.abs(k.i - i) * T.ds < 12 && k.dd <= 0 && lat < bar - 0.45 && lat > w + 1.1)) continue;
        if (gT(x, z) < T.hy[i] - 3) continue;
        const t = Math.min(1, Math.max(0, (lat - (w + 0.5)) / Math.max(0.3, lip - (w + 0.5))));
        put(x, T.hy[k.i] - 0.02 - 0.1 * t, z, R, lat - w);
      }
    }
  };

  /* ---- Kotor: docs/proge/kotor.md: »Svetlo siv apnenec v rebrih, ploščah in golih kraških tleh, med njimi suho kraško grmovje (temno),
     zaplate suhe trave«, a clear summer afternoon. Near the road, between the earlier grit patches, the loose pale stones of the karst
     and the dry grass in tufts; ~20-60 m out on the open karst between the hairpins the pale limestone boulders half in the ground, the
     dark low scrub in loose groups and the dry grass going gold; in the forest (land cover 1) only its litter and a few stones ---- */
  const KT = { lime: [[0.72, 0.71, 0.66], [0.68, 0.67, 0.62], [0.76, 0.74, 0.69], [0.63, 0.62, 0.57]], dry: [0.66, 0.61, 0.42], gold: [0.76, 0.69, 0.44],
    scrub: [0.22, 0.29, 0.16], scrub2: [0.28, 0.33, 0.19], karst: [0.56, 0.54, 0.48], litter: [0.38, 0.35, 0.27] };
  const kotor = (ctx) => {
    const { vrNear, vrLC, rock } = API, gH = API.caGround || API.vrGround, sl = API.caSlope || API.vrSlope || (() => 0), st = { kamni: 0, trava: 0, grmi: 0, tla: 0 };
    if (!vrNear || !vrLC || !gH || !API.T || !ctx.root || !ctx.matV) return st;
    const S = soft(ctx.root, ctx.matV), env = { near: vrNear, excluded: ctx.excluded || (() => false) }, smooth0 = API.ROCK_SMOOTH;
    const open = (x, z) => { const c = vrLC(x, z); return c === 0 || c === 2 || c === 4; };
    const stone = (x, y, z, w, R) => { if (rock) { API.ROCK_SMOOTH = false; rock(S.get(x, z), x, y + w * 0.12, z, w * 1.5, w * 0.6, w * 1.1, R() * Math.PI * 2, vary(KT.lime[Math.floor(R() * KT.lime.length)], R, 0.02), R, 0.3, 0.35); st.kamni++; } };
    // the wide verge before the low walls: the karst's loose pale stones and the dry grass in tufts between the earlier patches
    inner(gH, 57101, 2.4, (x, z) => 0.5 * grp(x, z, 30, 23), (x, y, z, R) => {
      const h = R();
      if (R() < 0.1) stone(x, y, z, 0.16 + Math.pow(h, 1.6) * 0.4, R);
      else { tuft(S.get(x, z), x, y, z, 0.32 + h * 0.3, 0.42 + h * 0.38, vary(mix3(KT.dry, KT.gold, R()), R, 0.03), R, 3); st.trava++; }
    });
    // ~20-60 m out: the open karst between the hairpins, boulders half in the ground, dark scrub, dry grass; the forest's litter
    walk(env, 57102, 5, 40, 20, (x, z) => { const c = vrLC(x, z); return (open(x, z) || c === 1) && sl(x, z) < 1.5 ? (c === 1 ? 0.3 : 0.6) * grp(x, z, -70, 31) : 0; }, (gx, gz, k, R, free) => {
      const wood = vrLC(gx, gz) === 1;
      if (free(gx, gz, 3) && R() < (wood ? 0.6 : 0.35)) { soil(S, gH, gx, gz, 1.2 + R() * 1.6, vary(wood ? KT.litter : KT.karst, R, 0.02), R, 0.05); st.tla++; }
      for (let q = 0, n = wood ? 1 + Math.floor(R() * 2) : 3 + Math.floor(R() * 4); q < n; q++) {
        const x = gx + (R() - 0.5) * 8, z = gz + (R() - 0.5) * 8, h = R();
        if (!free(x, z, 2.5)) continue;
        const r = R();
        if (r < 0.35 || wood) stone(x, gH(x, z), z, 0.3 + Math.pow(h, 1.5) * 0.7, R);
        else if (r < 0.65) { cushion(S.get(x, z), x, gH(x, z), z, 0.5 + h * 0.6, 0.35 + h * 0.35, vary(R() < 0.6 ? KT.scrub : KT.scrub2, R, 0.025), R); st.grmi++; }
        else { tuft(S.get(x, z), x, gH(x, z), z, 0.4 + h * 0.3, 0.38 + h * 0.34, vary(mix3(KT.dry, KT.gold, R()), R, 0.03), R, 5); st.trava++; }
      } });
    API.ROCK_SMOOTH = smooth0;
    S.done();
    return st;
  };
  if (API.PL_LOOK && API.PL_LOOK.kotor && BT.chain) BT.chain(API.PL_LOOK.kotor, (ctx) => { if (ctx.out) ctx.out.dalBt57 = kotor(ctx); });

  /* ---- Ella: docs/proge/ella.md: »travnata pobočja s posameznimi drevesi, temna tla gorskega gozda v grapah … Rdeča laterna zemlja ob
     robu ceste, v usekih«. Near the road the wet hills' grass in tussocks with the red laterite bare between them; ~20-60 m out on the
     grassy slopes taller tussocks in loose groups with the laterite showing where the grass is worn, at the forest's edge (land cover 1
     near) ferns and broad-leaved undergrowth in low clumps. Nothing in the tea rows, the fields or the town (land cover 6, 7, 5), nor
     in a stream's bed (the builder's bad) ---- */
  const EL = { gr: [0.28, 0.45, 0.17], gr2: [0.34, 0.47, 0.2], seed: [0.45, 0.48, 0.28],   // (gr, gr2, seed muted toward grey by the eighty-fifth group: no bright spikes)
                fern: [0.23, 0.45, 0.14], under: [0.21, 0.37, 0.15], lat: [0.52, 0.34, 0.24] };
  const ella = (ctx, o) => {
    const vrLC = API.vrLC, vrNear = API.vrNear, gH = (o && o.gH) || API.vrGround, sl = (o && o.slope) || API.vrSlope || (() => 0), st = { trava: 0, praprot: 0, laterit: 0 };
    const out = ctx.out; if (!vrLC || !vrNear || !gH || !API.T || !ctx.root || !out || !out.matV) return st;
    const ex = ctx.excluded || (() => false), bad = o && o.bad ? (x, z) => ex(x, z) || o.bad(x, z) : ex;
    const S = soft(ctx.root, out.matV), env = { near: vrNear, excluded: bad };
    const green = (x, z) => { const c = vrLC(x, z); return c === 0 || c === 2; };
    const edge = (x, z) => { let a = 0; for (const [u, v] of [[10, 0], [-10, 0], [0, 10], [0, -10]]) if (vrLC(x + u, z + v) === 1) a++; return a / 4; };
    // the verge between the asphalt and the barrier: tussocks of the wet grass, the red laterite bare between them
    inner(gH, 57201, 2, (x, z) => (green(x, z) ? 0.85 : 0.35) * grp(x, z, 50, 19), (x, y, z, R) => {
      const h = R();
      if (R() < 0.18) { soil(S, () => y, x, z, 0.7 + h * 0.8, vary(EL.lat, R, 0.02), R, 0.04); st.laterit++; }
      else { tuft(S.get(x, z), x, y, z, 0.4 + h * 0.34, 0.5 + h * 0.5, vary(mix3(EL.gr, EL.gr2, R()), R, 0.03), R, 5); st.trava++; }
    });
    // ~20-60 m out: the grassy slopes, taller tussocks in groups, the laterite where the grass is worn; ferns at the forest's edge
    walk(env, 57202, 5, 40, 20, (x, z) => green(x, z) && sl(x, z) < 1.2 ? 0.6 * grp(x, z, -40, 29) : 0, (gx, gz, k, R, free) => {
      const w = edge(gx, gz);
      if (R() < 0.25 && free(gx, gz, 3)) { soil(S, gH, gx, gz, 1.0 + R() * 1.4, vary(EL.lat, R, 0.02), R, 0.05); st.laterit++; }
      for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) {
        const x = gx + (R() - 0.5) * 8, z = gz + (R() - 0.5) * 8, h = R();
        if (!free(x, z, 2.5) || !green(x, z)) continue;
        if (R() < 0.15 + w * 0.6) { cushion(S.get(x, z), x, gH(x, z), z, 0.55 + h * 0.6, 0.42 + h * 0.4, vary(R() < 0.6 ? EL.fern : EL.under, R, 0.03), R); st.praprot++; }
        else { tuft(S.get(x, z), x, gH(x, z), z, 0.42 + h * 0.34, 0.6 + h * 0.6, vary(mix3(EL.gr2, EL.seed, R() * 0.5), R, 0.03), R, 5); st.trava++; }
      } });
    S.done();
    return st;
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'ella') try { if (ctx.out) ctx.out.dalBt57 = ella(ctx, o); } catch (e) { console.error('chase-bt57 (ella):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
