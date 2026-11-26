/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), group 105 of the real tracks: Kågeröd and Koli, a further pass on
   a circuit and a mountain road whose ground the earlier groups set (Kågeröd: js/world-chase-bt40.js, js/world-chase-bt65.js: uncut
   grass with buttercup, cow-parsley at the fences' foot, beech litter at the woods' edge, field patches to ~60 m; Koli:
   js/world-chase-bt19.js, js/world-chase-bt52.js: stalks through the ploughed bank, grit and slush at its foot, shade patches,
   snow-capped stones and young spruces to ~60 m). From behind the car, on Kågeröd the meadow between the fence and the woods was flat
   patches with dark dots and the woods' floor one green past the first metres; on Koli the snow between the trees and on the open
   ground by the village was one even white. So here:
   Kågeröd (docs/proge/kagerod.md: beech woods with spruce and birch, meadows with buttercup and cow-parsley), chained on the look's
   extra (js/world-rbring.js rbLook.kagerod), from ~3.5 m past the barrier line to ~60 m: on the grass (land cover 0) standing seed
   grass in loose groups, cow-parsley and buttercup heads farther out, broad low tussocks of the damper, darker grass; in the woods (1) the
   copper beech litter deeper in, low green undergrowth, darker needle patches under the spruces; on the scrub (2) dark low bushes.
   Koli (docs/proge/koli.md: ploughed snow, a forest of spruce and pine), chained after World.ext.goreRob (js/world-koli.js): from ~4 m
   past the barrier line to ~60 m soft snow hummocks (buried stones, stumps and bushes), in the forest (1) small dark spots of fallen
   needles and twigs under the trees and bare twigs of the undergrowth through the snow, on open ground (0, 2) dry stalks and bare
   twigs, on rock (4) and steep faces grey stones. No wide flat patches (on the snowy slope they show as stars: js/world-chase-bt19.js).
   Nothing on built ground (3), on Koli's water and ski runs (5, 6), on the pits' side along the pits, in the builders' excluded
   places, where another leg's road is nearer, on a face too steep or far below the road. All of it in meshes of their own (softScen:
   256 m chunks, no shadow); the terrain, the road, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // (as js/world-chase-bt84.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.015), k);
  const T3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.03), k || 0.97);

  /* the band: every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m (denser near); each place a small
     group (C.grp things within C.spread m), so it reads as clumps on the ground, not as an even sprinkle. near(x, z) -> { i, lat } */
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
          const dE = Math.abs(q.lat) - T.wAt(q.i);
          const P = C.pick(R, oo - bar, s, c, dE), h = R(); if (!P) continue;
          if (P.k === 'p') soil(soft, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g' || P.k === 's') cushion(soft.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };


  /* ---- Kågeröd (colours of js/world-chase-bt65.js KG: grass, lush, butter, parsley, leaf) ---- */
  const KG = {
    seed: [[0.5, 0.55, 0.3], [0.58, 0.6, 0.34]], lush: [[0.28, 0.46, 0.19], [0.33, 0.5, 0.21]], dry: [[0.42, 0.52, 0.25], [0.47, 0.55, 0.28]],
    butter: [[0.8, 0.72, 0.24], [0.84, 0.76, 0.28]], parsley: [[0.82, 0.82, 0.74], [0.86, 0.86, 0.78]], leaf: [[0.46, 0.36, 0.25], [0.52, 0.4, 0.27]],
    under: [[0.22, 0.38, 0.16], [0.27, 0.43, 0.18]], needle: [[0.33, 0.27, 0.19], [0.37, 0.3, 0.21]], bush: [[0.2, 0.33, 0.15], [0.25, 0.37, 0.17]],
  };
  const KGF = { step: 4.0, n: 3, grp: 3, spread: 3.5, from: 3.5, reach: 60, pw: 1.6, drop: 9, rise: 22, maxSl: 0.9,
    keep: (d) => d < 22 ? 0.6 : 0.72,
    skip: (c) => c === 3 || c === 4,
    pick: (R, d, s, c) => { const r = R(), w = d < 28 ? 1.3 : 1.8;
      if (c === 1) return r < 0.42 ? { c: 'listje', k: 'p', r: (0.9 + R() * 1.3) * w, col: C3(R, KG.leaf[0], KG.leaf[1]) }
        : r < 0.8 ? { c: 'podrast', k: 'g', w: 0.8 * w, h: 0.4, col: T3(R, KG.under[0], KG.under[1]) }
        : { c: 'iglice', k: 'p', r: (0.8 + R() * 1.0) * w, col: C3(R, KG.needle[0], KG.needle[1]) };
      if (c === 2) return r < 0.6 ? { c: 'grmi', k: 'g', w: 0.8 * w, h: 0.5, col: T3(R, KG.bush[0], KG.bush[1]) }
        : { c: 'sopi', k: 't', w: 0.3 * w, h: 0.55, col: T3(R, KG.seed[0], KG.seed[1]) };
      if (r < 0.4) return { c: 'sopi', k: 't', w: 0.42 * w, h: d < 28 ? 0.6 : 0.75, col: T3(R, ...(R() < 0.6 ? KG.seed : KG.lush)), n: 6 };
      if (r < 0.52) return { c: 'cvetje', k: 't', w: 0.4 * w, h: 0.7, col: T3(R, KG.parsley[0], KG.parsley[1], 1) };
      if (r < 0.6) return { c: 'cvetje', k: 't', w: 0.34 * w, h: 0.42, col: T3(R, KG.butter[0], KG.butter[1], 1) };
      if (r < 0.85) return { c: 'sopi', k: 'g', w: 0.7 * w, h: 0.3, col: T3(R, KG.lush[0], KG.lush[1], 1) };   // (broad low tussocks of the darker, damper grass)
      return { c: 'sopi', k: 't', w: 0.36 * w, h: 0.5, col: T3(R, KG.dry[0], KG.dry[1], 1), n: 6 }; } };

  const kagerod = (ctx) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear, nrLC } = API;
    if (!root || !matV || !T || !T.br || !T.wAt || !nrGround || !nrNear) return null;
    const ds = T.ds, pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const bad = (x, z) => { if (excluded(x, z)) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const slope = (x, z) => { const d = 1.0, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const R = rng(105100), soft = softScen(root, matV), st = {};
    band(soft, (x, z) => nrNear(x, z), nrGround, slope, nrLC, bad, R, KGF, st);
    soft.done(); return st;
  };
  const L = API.rbLook || {};
  if (L.kagerod) chain(L.kagerod, (ctx) => { try { if (ctx.out) ctx.out.pasBt105 = kagerod(ctx); } catch (e) { console.error('chase-bt105 (kagerod):', e); } });

  /* ---- Koli: the snow between the trees and on the open ground (land cover of js/world-koli.js vrLC: 0 grass, 1 forest, 2 shrubs,
     3 built, 4 rock, 5 water, 6 ski runs; colours of js/world-chase-bt52.js KO) ---- */
  const KO = {
    snow: [[0.76, 0.81, 0.92], [0.83, 0.87, 0.95]], needle: [[0.38, 0.32, 0.26], [0.45, 0.38, 0.31]], twig: [[0.3, 0.24, 0.2], [0.36, 0.29, 0.23]],
    stalk: [[0.62, 0.54, 0.38], [0.68, 0.6, 0.43]], rock: [[0.46, 0.47, 0.49], [0.53, 0.54, 0.55]],
  };
  const KOF = { step: 3.4, n: 3, grp: 3, spread: 3, from: 4, reach: 60, pw: 1.9, drop: 14, rise: 30, maxSl: 1.4,
    keep: (d) => d < 22 ? 0.55 : 0.7,
    skip: (c) => c === 3 || c === 5 || c === 6,
    pick: (R, d, s, c) => { const r = R(), w = d < 25 ? 1.2 : 1.7;
      if (c === 4 || s > 0.9) return r < 0.5 ? { c: 'skale', k: 's', w: 0.9 * w, h: 0.5, col: T3(R, KO.rock[0], KO.rock[1], 0.95) }
        : r < 0.85 ? { c: 'kupi', k: 's', w: 1.5 * w, h: 0.4, col: C3(R, KO.snow[0], KO.snow[1], 1) } : null;
      if (c === 1) return r < 0.4 ? { c: 'kupi', k: 's', w: 1.7 * w, h: 0.42, col: C3(R, KO.snow[0], KO.snow[1], 1) }
        : r < 0.68 ? { c: 'iglice', k: 'p', r: 0.3 + R() * 0.3, col: C3(R, KO.needle[0], KO.needle[1], 1) }
        : { c: 'vejice', k: 't', w: 0.42 * w, h: 0.55, col: T3(R, KO.twig[0], KO.twig[1]), n: 6 };
      if (r < 0.5) return { c: 'kupi', k: 's', w: 1.9 * w, h: 0.45, col: C3(R, KO.snow[0], KO.snow[1], 1) };
      if (r < 0.78) return { c: 'bilke', k: 't', w: 0.4 * w, h: 0.6, col: T3(R, KO.stalk[0], KO.stalk[1]), n: 6 };
      return { c: 'vejice', k: 't', w: 0.5 * w, h: 0.75, col: T3(R, KO.twig[0], KO.twig[1]), n: 6 }; } };

  const koli = (ctx, o) => {
    const T = API.T; if (!T || !T.br || !T.wAt || !ctx.out || !ctx.root || !ctx.out.matV) return null;
    const gT = o.gH || API.vrGround, slope = o.slope || API.vrSlope, near0 = o.near || API.vrNear, lc = o.lc || API.vrLC; if (!gT || !slope || !near0) return null;
    const ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || (o.bad && o.bad(x, z));
    const q2 = { i: -1, lat: 0 }, near = (x, z) => { const q = near0(x, z); q2.i = q.i;
      q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; };
    const R = rng(105200), soft = softScen(ctx.root, ctx.out.matV), st = {};
    band(soft, near, gT, slope, lc, bad, R, KOF, st);
    soft.done(); return st;
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'koli' && ctx && ctx.out) try { ctx.out.robBt105 = koli(ctx, o || {}); } catch (e) { console.error('chase-bt105 (koli):', e); }
      return r;
    };
    Object.assign(f, base);
    World.ext.goreRob = f;
  }
  void clamp;
})();
