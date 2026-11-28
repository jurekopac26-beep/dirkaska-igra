/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the ninety-second group of the real tracks: Izoard and Kanaba, a
   further pass on two pass roads (js/world-prelaz.js) whose ground the earlier groups set (Izoard: js/world-chase-bt7.js,
   js/world-chase-bt46.js: tufts, juniper and limestone ribs to ~22 m past the barriers, one patch on the verge every ~3 m, wide flat
   patches 18-60 m out; Kanaba: js/world-chase-bt7.js, js/world-chase-bt40.js, js/world-chase-bt78.js: the red dust at the asphalt's edge,
   the bank, patches, tufts and scrub to ~60 m). From behind the car what was left in one even face is the wide verge: in the hairpins and
   on the outside of the bends the barrier line stands 4-10 m off the asphalt, and that ground showed one colour with a patch here and
   there; and on Izoard, past the seventh group's band (~22 m), the slope had flat patches only, nothing standing. So here:
   the verge, on both, only where it is wider than ~1.6 m (more places the wider it is): flat patches across it and, on its outer part
   toward the barrier, low tufts in small groups.
   Izoard (docs/proge/izoard.md: »redek gozd macesnov … na travnatih tleh«, više »suhi alpski pašniki z brinom in grmičevjem, bledo sivi
   in okrasti apnenec in dolomit v pečinah, široka melišča pod prelazom«): on the verge the pale limestone grit, the ochre, the dry grass
   going gold and green-brown, under the larches the needles' rusty litter; from ~22 m to ~60 m past the barriers standing tufts of the
   dry grass in loose groups, low cushions of juniper, pale limestone stones; on the rock and the scree (land cover 4, 7) stones and
   few tufts, under the larches (1) greener tufts and the litter. Nothing on built ground (3) or the snow (5).
   Kanaba (docs/proge/kanaba.md: »zelena polja in pašniki na rdeči prsti«, »obrabljen asfalt z rdečim prahom ob robu«): on the verge the
   red dust and the red earth trodden bare, the short pasture grass and its drier patches, the weathered rock's grit; low green tufts
   toward the barrier.
   Nothing on the asphalt or within ~0.9 m of it, nothing in the builders' excluded places, where another leg's road is nearer, on a
   bridge or a high fill, on a face too steep or far below the road. All of it in meshes of their own (softScen: 256 m chunks, no
   shadow), none of it is hit; the terrain, the road, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API, LK = API.PL_LOOK;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng || !LK) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b) => Math.abs(a - b);   // (open roads: no wrap)
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // (as js/world-chase-bt85.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.015), k);
  const T3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.03), k || 0.97);
  const latOf = (T, near) => { const q2 = { i: -1, lat: 0, dd: 0 }; return (x, z) => { const q = near(x, z); q2.i = q.i; q2.dd = q.dd || 0;
    q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; }; };

  /* the wide verge (the height as js/world-chase-bt46.js: the verge's profile from the road's edge to the barrier's lip): every V.step m
     on both sides, where the strip from 0.9 m past the asphalt to the barrier line is wider than V.min, one try per V.per m of its
     width (to V.max): a flat patch, or on the outer part toward the barrier a small group of low tufts */
  const verge = (soft, near, gT, ex, lc, R, V, st) => {
    const T = API.T, N = T.px.length, ds = T.ds, wAt = (i) => T.wAt ? T.wAt(i) : T.w;
    for (let i = 0; i < N; i += Math.max(1, Math.round(V.step / ds))) for (const sd of [-1, 1]) {
      const w = wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + 0.9, e1 = bar - 0.35, W = e1 - e0;
      if (!(W > V.min)) continue;
      const lip = Math.max(w + 1.1, bar - 0.7);
      const at = (o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
      const own = (x, z) => { const q = near(x, z); return q.i >= 0 && gap(q.i, i) * ds < 12 && !(q.dd > 0) && q.lat * sd > wAt(q.i) + 0.6 && Math.abs(q.lat) < bar - 0.3 && !ex(x, z); };
      const sunk = (x, z) => gT(x, z) < T.hy[i] - 3;   // (a bridge or a high fill: the verge is not on the ground there)
      const gV = (x, z) => { const q = near(x, z), j = q.i >= 0 ? q.i : i, o = Math.abs(q.lat);
        const t = clamp((o - (w + 0.5)) / Math.max(0.3, lip - (w + 0.5)), 0, 1); return T.hy[j] - 0.02 - 0.1 * t; };
      const b4 = at(bar + 4, 0), c = lc ? lc(b4[0], b4[1]) : 0; if (V.skip && V.skip(c)) continue;   // (the land behind the barrier)
      for (let k = 0, n = clamp(Math.round(W / V.per), 1, V.max); k < n; k++) {
        const r0 = R(), r1 = R(), r2 = R(), r3 = R(); if (r0 > V.share) continue;
        const o = e0 + r1 * W, a = (r2 - 0.5) * V.step, [x, z] = at(o, a);
        if (W > 3 && o > e0 + W * 0.5 && r3 < V.tufts) {
          for (let m = 0, mm = 1 + Math.floor(R() * (V.grp || 3)); m < mm; m++) {
            const tx = x + (R() - 0.5) * 1.6, tz = z + (R() - 0.5) * 1.6, h = R(); if (!own(tx, tz) || sunk(tx, tz)) continue;
            tuft(soft.get(tx, tz), tx, gV(tx, tz), tz, 0.18 + h * 0.14, 0.14 + h * 0.14, V.tuft(R, c), R, 5); st.sopi = (st.sopi || 0) + 1;
          }
          continue;
        }
        const P = V.patch(R, c), rr = Math.min(P.r, W * 0.5, o - e0 + 0.4, e1 - o + 0.4);
        if (rr > 0.3 && own(x, z) && !sunk(x, z)) { soil(soft, gV, x, z, rr, P.col, R, 0.05); st.zaplate = (st.zaplate || 0) + 1; }
      }
    }
    return st;
  };

  /* the band past the barriers (as js/world-chase-bt85.js): every C.step m on both sides C.n tries from C.from m past the barrier line to
     C.reach m (denser near), each a small group (C.grp things within C.spread m) */
  const band = (soft, near, gT, lc, bad, R, C, st) => {
    const T = API.T, N = T.px.length, wAt = (i) => T.wAt ? T.wAt(i) : T.w;
    const slope = (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (q.i < 0 || gap(q.i, i) * T.ds > oo + 12) continue;
          const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < Math.max(qb, wAt(q.i)) + 2) continue;   // (on or by a road: this leg's or another's)
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

  /* ---- Izoard (colours of js/world-chase-bt46.js IZ; juniper as js/world-chase-bt7.js's shrub; land cover: 1 the larch wood, 4 and 7
     the rock and the scree, 3 built, 5 snow) ---- */
  const IZ = {
    grit: [[0.63, 0.62, 0.58], [0.68, 0.66, 0.6]], ochre: [[0.66, 0.6, 0.49], [0.7, 0.63, 0.51]], gold: [[0.62, 0.57, 0.37], [0.67, 0.6, 0.4]],
    dry: [[0.5, 0.5, 0.3], [0.55, 0.53, 0.33]], needle: [[0.5, 0.39, 0.26], [0.55, 0.42, 0.28]], forest: [[0.38, 0.44, 0.24], [0.42, 0.47, 0.27]],
    scree: [[0.7, 0.67, 0.6], [0.74, 0.71, 0.64]], tuft: [[0.62, 0.58, 0.37], [0.72, 0.65, 0.41]], tuftW: [[0.4, 0.46, 0.24], [0.48, 0.5, 0.28]],
    juniper: [[0.2, 0.3, 0.17], [0.24, 0.33, 0.19]], stone: [[0.7, 0.68, 0.62], [0.77, 0.74, 0.66]],
  };
  const wood = (c) => c === 1, rock = (c) => c === 4 || c === 7;
  const IZV = { step: 2.6, min: 1.6, per: 1.5, max: 6, share: 0.7, tufts: 0.4, skip: (c) => c === 3 || c === 5,
    patch: (R, c) => { const u = R(), P = (a, r0, r1) => ({ col: C3(R, a), r: r0 + R() * r1 });
      if (wood(c)) return u < 0.4 ? P(IZ.needle, 0.6, 0.9) : u < 0.7 ? P(IZ.forest, 0.7, 0.9) : u < 0.88 ? P(IZ.dry, 0.6, 0.8) : P(IZ.grit, 0.5, 0.6);
      if (rock(c)) return u < 0.5 ? P(IZ.grit, 0.6, 0.9) : u < 0.8 ? P(IZ.ochre, 0.6, 0.8) : P(IZ.gold, 0.6, 0.8);
      return u < 0.3 ? P(IZ.grit, 0.6, 0.8) : u < 0.48 ? P(IZ.ochre, 0.5, 0.8) : u < 0.76 ? P(IZ.gold, 0.7, 1.0) : P(IZ.dry, 0.7, 0.9); },
    tuft: (R, c) => T3(R, wood(c) ? IZ.tuftW : IZ.tuft, 0.95) };
  const IZF = { step: 4.4, n: 2, grp: 3, spread: 3.5, from: 22, reach: 60, pw: 1.2, drop: 14, rise: 40, maxSl: 1.2, keep: 0.7,
    skip: (c) => c === 3 || c === 5,
    pick: (R, d, s, c) => { const r = R(), w = d < 38 ? 1.5 : 1.9;
      if (rock(c) || s > 0.95) return r < 0.5 ? { c: 'kamni', k: 's', w: 0.5 * w, h: 0.3, col: T3(R, IZ.stone, 0.95) }
        : r < 0.72 ? { c: 'sopi', k: 't', w: 0.26 * w, h: 0.4, col: T3(R, IZ.tuft) } : r < 0.84 ? { c: 'brin', k: 'g', w: 0.6 * w, h: 0.4, col: T3(R, IZ.juniper) } : null;
      if (wood(c)) return r < 0.5 ? { c: 'sopi', k: 't', w: 0.3 * w, h: 0.42, col: T3(R, IZ.tuftW) }
        : r < 0.72 ? { c: 'iglice', k: 'p', r: (0.9 + R() * 1.1) * w, col: C3(R, IZ.needle) } : r < 0.86 ? { c: 'brin', k: 'g', w: 0.6 * w, h: 0.42, col: T3(R, IZ.juniper) } : null;
      if (r < 0.58) return { c: 'sopi', k: 't', w: 0.3 * w, h: 0.5, col: T3(R, R() < 0.7 ? IZ.tuft : IZ.dry) };
      if (r < 0.78) return { c: 'brin', k: 'g', w: 0.7 * w, h: 0.45, col: T3(R, IZ.juniper) };
      if (r < 0.92) return { c: 'kamni', k: 's', w: 0.42 * w, h: 0.26, col: T3(R, IZ.stone, 0.95) };
      return { c: 'zaplate', k: 'p', r: (0.8 + R() * 1.0) * w, col: C3(R, IZ.scree) }; } };

  /* ---- Kanaba (colours of js/world-chase-bt78.js: the red dust, the pasture and its drier grass, the weathered grit) ---- */
  const KN = {
    dust: [[0.54, 0.35, 0.25], [0.58, 0.38, 0.27]], earth: [[0.5, 0.33, 0.23], [0.55, 0.36, 0.25]], grass: [[0.3, 0.44, 0.18], [0.35, 0.47, 0.2]],
    dryG: [[0.41, 0.45, 0.21], [0.45, 0.47, 0.23]], grit: [[0.55, 0.43, 0.35], [0.58, 0.46, 0.37]], tuft: [[0.3, 0.44, 0.17], [0.4, 0.48, 0.22]],
  };
  const KNV = { step: 4, min: 1.6, per: 1.8, max: 4, share: 0.65, tufts: 0.45, grp: 2,   // (sparser than Izoard: the track is near the phone's limit of vertices)
    patch: (R) => { const u = R(), P = (a, r0, r1) => ({ col: C3(R, a), r: r0 + R() * r1 });
      return u < 0.24 ? P(KN.dust, 0.6, 0.9) : u < 0.4 ? P(KN.earth, 0.5, 0.8) : u < 0.68 ? P(KN.grass, 0.7, 1.0) : u < 0.9 ? P(KN.dryG, 0.7, 0.9) : P(KN.grit, 0.5, 0.6); },
    tuft: (R) => T3(R, KN.tuft) };

  const run = (id, key, seed, V, F) => {
    if (!LK[id]) return;
    chain(LK[id], (ctx) => {
      if (!ctx.out) return;
      try {
        const T = API.T, gT = API.caGround || API.vrGround, near0 = API.vrNear, root = ctx.root, matV = ctx.matV || ctx.out.matV;
        if (!T || !T.br || !gT || !near0 || !root || !matV || (T.def && T.def.id !== id)) return;
        const near = latOf(T, near0), R = rng(seed), soft = softScen(root, matV), ex = ctx.excluded || (() => false), lc = F ? API.vrLC : (V.skip ? API.vrLC : null);
        const st = verge(soft, near, gT, ex, lc, R, V, {});
        if (F) band(soft, near, gT, lc, ex, R, F, st);
        soft.done(); ctx.out[key] = st;
      } catch (e) { console.error('chase-bt92 (' + id + '):', e); }
    });
  };
  run('izoard', 'robBt92', 92100, IZV, IZF);
  run('kanaba', 'robBt92', 92200, KNV, null);
})();
