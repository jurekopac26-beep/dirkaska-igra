/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the ninety-fourth group of the real tracks: Kotor and Krásna Hôrka.
   Kotor is a further pass on a mountain road whose ground the earlier groups set (js/world-chase-bt6.js: the karst's ribs, slabs and
   tufts to ~24 m; js/world-chase-bt27.js: the verge and the bank; js/world-chase-bt57.js: the verge's stones and dry tufts, boulders,
   dark scrub and dry grass ~20-60 m out). Krásna Hôrka has had no group yet (js/world-krasnahorka.js builds through World.gore.build
   and does not call World.ext.goreRob), so this is its first pass. From behind the car, on Kotor the ground between the hairpins was
   one olive green under the stones, where the karst is pale and dry; on Krásna Hôrka the meadows on both sides were one even green
   from the road's edge to the trees, nothing standing in the grass.
   So here:
   Kotor (docs/proge/kotor.md: »Svetlo siv apnenec v rebrih, ploščah in golih kraških tleh, med njimi suho kraško grmovje (temno),
   zaplate suhe trave«), chained on the look's extra (API.PL_LOOK.kotor): from ~3 m past the barrier line to ~45 m, on the open karst
   flat patches of the bare pale-grey ground and of the dry straw grass, so the green is broken, and between them the dark low scrub
   in loose groups; in the pines' wood (land cover 1) its litter, the karst showing through in smaller patches and a little scrub. Sparse: the track is near its budget of vertices, so most
   of it is flat patches.
   Krásna Hôrka (docs/proge/krasnahorka.md: grass with patchy cover, deciduous trees, the road down into the valley and the castle's
   access road; ESA WorldCover for the land cover), by wrapping World.ext.krasnahorka and adding to the builder's extra: from ~2.5 m
   past the road's edge to ~55 m, on the meadows flat patches of a darker damp and a paler sun-dried green and of straw, the uncut
   grass standing in tufts and loose clumps (taller further from the mown edge), low dark-green herb cushions; at and under the
   deciduous wood (land cover 1, most of the roadside) darker patches of last year's leaves and of damp ground, low undergrowth
   in cushions, the wood's grass in tufts and a rare grey limestone stone.
   Nothing on built ground, in the fields, in the builders' excluded places (the castle's hill top), on or by a road (this leg's or
   another's), on a face too steep or far below the road. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the
   terrain, the road, the trees, the castle and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt85.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.015), k);
  const T3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.03), k || 0.97);

  /* the band (as js/world-chase-bt85.js): every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m
     (denser near); each place a small group (C.grp things within C.spread m), so it reads as clumps, not as an even sprinkle */
  const band = (soft, near, gT, slope, lc, bad, R, C, st) => {
    const T = API.T, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar, oo - T.wAt(i))) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (q.i < 0 || gap(q.i, i, N) * T.ds > oo + 12) continue;
          const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (on or by a road: this leg's or another's)
          if (bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
          const c = lc ? lc(x, z) : 0; if (C.skip && C.skip(c)) continue;
          const P = C.pick(R, oo - bar, s, c), h = R(); if (!P) continue;
          if (P.k === 'p') soil(soft, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g' || P.k === 's') cushion(soft.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };
  const run = (root, matV, ex, o, seed, C) => {
    const T = API.T; if (!T || !T.br || !T.bl || !T.wAt || !root || !matV) return null;
    const gT = o.gH, slope = o.slope || (() => 0), near0 = o.near, lc = o.lc; if (!gT || !near0) return null;
    const q2 = { i: -1, lat: 0 }, near = (x, z) => { const q = near0(x, z); q2.i = q.i;
      q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; };
    const R = rng(seed), soft = softScen(root, matV), st = {};
    band(soft, near, gT, slope, lc, ex || (() => false), R, C, st);
    soft.done(); return st;
  };

  /* ---- Kotor: the pale bare karst and the straw grass breaking the green, dark scrub between (colours of js/world-chase-bt57.js KT) ---- */
  const KT = { karst: [[0.6, 0.58, 0.52], [0.68, 0.66, 0.6]], straw: [[0.62, 0.57, 0.39], [0.7, 0.64, 0.42]], scrub: [[0.22, 0.29, 0.16], [0.28, 0.33, 0.19]],
    litter: [[0.36, 0.33, 0.25], [0.4, 0.36, 0.27]] };
  const KTF = { step: 5, n: 3, grp: 2, spread: 4.5, from: 3, reach: 45, pw: 1.3, drop: 12, rise: 22, maxSl: 1.3,
    keep: (d) => d < 20 ? 0.75 : 0.55,
    skip: (c) => !(c === 0 || c === 1 || c === 2 || c === 4),
    pick: (R, d, s, c) => { const r = R(), w = d < 20 ? 1 : 1.35;
      if (c === 1) return r < 0.34 ? { c: 'listje', k: 'p', r: (1.2 + R() * 1.4) * w, col: C3(R, KT.litter[0], KT.litter[1], 0.9) }   // (the pines' wood: its litter, the karst showing through, a little scrub)
        : r < 0.56 ? { c: 'kras', k: 'p', r: (0.9 + R() * 1.2) * w, col: C3(R, KT.karst[0], KT.karst[1], 0.9) }
        : r < 0.6 && d < 22 ? { c: 'grmi', k: 'g', w: 0.65 * w, h: 0.42, col: T3(R, KT.scrub[0], KT.scrub[1]) } : null;
      if (r < 0.42) return { c: 'kras', k: 'p', r: (1.3 + R() * 1.9) * w, col: C3(R, KT.karst[0], KT.karst[1]) };
      if (r < 0.74) return { c: 'slama', k: 'p', r: (1.2 + R() * 1.6) * w, col: C3(R, KT.straw[0], KT.straw[1]) };
      if (r < 0.78 && d < 22) return { c: 'grmi', k: 'g', w: 0.7 * w, h: 0.45, col: T3(R, KT.scrub[0], KT.scrub[1]) };
      return null; } };
  const kotor = (ctx) => run(ctx.root, ctx.matV, ctx.excluded,
    { gH: API.caGround || API.vrGround, slope: API.caSlope || API.vrSlope, near: API.vrNear, lc: API.vrLC }, 94100, KTF);
  if (API.PL_LOOK && API.PL_LOOK.kotor) chain(API.PL_LOOK.kotor, (ctx) => { try { if (ctx.out) ctx.out.tlaBt94 = kotor(ctx); } catch (e) { console.error('chase-bt94 (kotor):', e); } });

  /* ---- Krásna Hôrka: the meadows' patches and uncut grass, the deciduous forest's floor (land cover of js/world-gore.js vrLC:
     1 forest, 0 and 2 grass and scrub, 3 bare; nothing on the rest) ---- */
  const KH = {
    damp: [[0.3, 0.42, 0.18], [0.34, 0.45, 0.2]], sun: [[0.48, 0.55, 0.3], [0.53, 0.57, 0.32]], straw: [[0.6, 0.57, 0.36], [0.66, 0.61, 0.39]],
    grass: [[0.36, 0.47, 0.21], [0.43, 0.52, 0.25]], seed: [[0.56, 0.56, 0.33], [0.62, 0.6, 0.37]], herb: [[0.24, 0.36, 0.16], [0.28, 0.4, 0.18]],
    litter: [[0.3, 0.27, 0.17], [0.34, 0.29, 0.18]], under: [[0.2, 0.33, 0.14], [0.25, 0.38, 0.17]], wgrass: [[0.36, 0.44, 0.2], [0.42, 0.48, 0.23]], stone: [[0.62, 0.61, 0.57], [0.7, 0.69, 0.64]],
  };
  const KHF = { step: 4.2, n: 2, grp: 3, spread: 4, from: 2.5, reach: 55, pw: 1.35, drop: 12, rise: 25, maxSl: 1.1,
    keep: (d) => d < 18 ? 0.7 : 0.8,
    skip: (c) => !(c === 0 || c === 1 || c === 2 || c === 3),
    pick: (R, d, s, c) => { const r = R(), w = d < 22 ? 1.2 : 1.7;
      if (c === 3) return r < 0.4 ? { c: 'kamni', k: 's', w: 0.4 * w, h: 0.24, col: T3(R, KH.stone[0], KH.stone[1], 0.95) } : null;
      if (c === 1) return r < 0.26 ? { c: 'listje', k: 'p', r: (1.3 + R() * 1.7) * w, col: C3(R, KH.litter[0], KH.litter[1], 0.88) }   // (the open deciduous wood: last year's leaves, darker than the floor)
        : r < 0.36 ? { c: 'zaplate', k: 'p', r: (1.2 + R() * 1.5) * w, col: C3(R, KH.damp[0], KH.damp[1], 0.8) }
        : r < 0.68 ? { c: 'podrast', k: 'g', w: 0.85 * w, h: 0.5, col: T3(R, KH.under[0], KH.under[1]) }
        : r < 0.97 ? { c: 'trava', k: 't', w: 0.4 * w, h: 0.55, col: T3(R, KH.wgrass[0], KH.wgrass[1]), n: 6 } : { c: 'kamni', k: 's', w: 0.4, h: 0.24, col: T3(R, KH.stone[0], KH.stone[1], 0.9) };
      if (r < 0.2) return { c: 'zaplate', k: 'p', r: (1.5 + R() * 1.9) * w, col: C3(R, KH.damp[0], KH.damp[1]) };
      if (r < 0.36) return { c: 'zaplate', k: 'p', r: (1.3 + R() * 1.6) * w, col: C3(R, KH.sun[0], KH.sun[1]) };
      if (r < 0.44) return { c: 'zaplate', k: 'p', r: (1.0 + R() * 1.2) * w, col: C3(R, KH.straw[0], KH.straw[1]) };
      if (r < 0.74) return { c: 'trava', k: 't', w: 0.38 * w, h: d < 8 ? 0.4 : 0.6, col: T3(R, KH.grass[0], KH.grass[1]), n: 6 };
      if (r < 0.88) return d < 6 ? null : { c: 'trava', k: 't', w: 0.3 * w, h: 0.8, col: T3(R, KH.seed[0], KH.seed[1]), n: 5 };   // (the uncut grass gone to seed, past the mown edge)
      return { c: 'zeli', k: 'g', w: 0.5 * w, h: 0.28, col: T3(R, KH.herb[0], KH.herb[1]) }; } };
  const hrad = (ctx) => run(ctx.root, ctx.out && ctx.out.matV, ctx.excluded,
    { gH: API.vrGround, slope: API.vrSlope, near: API.vrNear, lc: API.vrLC }, 94200, KHF);
  const ext = World.ext, baseExt = ext && ext.krasnahorka;
  if (typeof baseExt === 'function' && World.gore && World.gore.build) ext.krasnahorka = function (scene, tex, opts) {
    const gore = World.gore, build = gore.build;
    gore.build = function (sc, tx, op, S) {
      gore.build = build;
      const S2 = Object.assign({}, S, { extra: (ctx) => {
        const r = typeof S.extra === 'function' ? S.extra(ctx) : undefined;
        try { if (ctx && ctx.out) ctx.out.tlaBt94 = hrad(ctx); } catch (e) { console.error('chase-bt94 (krasnahorka):', e); }
        return r; } });
      return build.call(this, sc, tx, op, S2);
    };
    try { return baseExt.apply(this, arguments); } finally { gore.build = build; }
  };
})();
