/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the ninety-seventh group of the real tracks: Medeu and Mombasa,
   a further pass on a mountain road and a town circuit whose ground the earlier groups set (Medeu: js/world-chase-bt20.js: ribs,
   tussocks and juniper within ~22 m; js/world-chase-bt35.js: the verge, the bank to 9 m, sparse flat patches to ~55 m; Mombasa:
   js/world-chase-bt22.js, js/world-chase-bt35.js: the strip, the bank and flat patches to ~40 m; js/world-chase-bt71.js: the worn
   edge and the far band 36-60 m). From behind the car, on Medeu the meadows past ~22 m were flat patches with nothing standing in the
   grass; on Mombasa the reddish ground between the bank and the far band (8-36 m) was flat patches with a few dots. So here:
   Medeu (docs/proge/medeu.md: »rumeneče gorske livade z divjo jablano, glogom in brinjem«, »siv granit z rožnatim odtenkom«, late
   summer), chained on the look's extra (js/world-prelaz.js PL_LOOK.medeu): from ~6 m past the barrier line to ~60 m (thinner to ~18 m), standing tufts
   of the yellowing and the straw grass in loose groups, a few still green, low juniper cushions (a muted green, not dark) and small
   grey-pink granite stones; under the spruce (land cover 1) thinner: needle litter and a few low ferns; on rock and scree (4, 7)
   stones and thin grass only. Nothing in the town, on the dam or the water (3, 5, 6) nor on the paths and side streets (excluded).
   Mombasa (docs/proge/mombasa.md: »palme in drevesa na rdečkastih tleh«), chained after World.ext.mombasaRob: from ~7 m to ~38 m past
   the barrier line, standing dry and green grass tufts in loose groups, low green bushes and a few pale coral-limestone stones, the
   colours of js/world-chase-bt35.js darkened as there. Nothing on the houses, yards, car parks, ponds and their roads (excluded), on
   the parks' and the golf course's lawns (World.ext.mombasaTrata of js/world-mombasa-obcestje.js), the sea or the fortress.
   Nowhere where another leg's road is nearer, on a face too steep or far below the road. The horizon stays the builders' own terrain.
   All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers, the trees and the driving
   stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  const latOf = (T, near) => { const q2 = { i: -1, lat: 0 }; return (x, z) => { const q = near(x, z); q2.i = q.i;
    q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; }; };
  const slopeOf = (gT) => (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
  // (as js/world-chase-bt84.js: a third of the way toward the colour's grey and a little darker, so it reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const dk = (c, f) => [c[0] * f, c[1] * f, c[2] * f];

  /* the band (as js/world-chase-bt85.js): every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m
     (denser near); each place a small group (C.grp things within C.spread m), so it reads as clumps, not as an even sprinkle */
  const band = (soft, near, gT, slope, lc, bad, R, C, st) => {
    const T = API.T, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
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

  /* ---- Medeu: the yellowing meadows, the spruce's floor, the granite (land cover of js/world-prelaz.js vrLC) ---- */
  const MD = {
    straw: [[0.74, 0.66, 0.42], [0.8, 0.72, 0.47]], yel: [[0.66, 0.63, 0.36], [0.72, 0.66, 0.38]], green: [[0.47, 0.55, 0.3], [0.53, 0.59, 0.33]],
    jun: [[0.36, 0.45, 0.31], [0.42, 0.5, 0.34]], stone: [[0.64, 0.6, 0.59], [0.72, 0.66, 0.64]], litter: [[0.5, 0.42, 0.3], [0.56, 0.47, 0.33]],
    fern: [[0.42, 0.5, 0.29], [0.47, 0.54, 0.31]],
  };
  const M3 = (R, p, k) => mute(vary(mix3(p[0], p[1], R()), R, 0.03), k || 0.97);
  const MDF = { step: 3.6, n: 3, grp: 4, spread: 4.2, from: 6, reach: 60, pw: 1.2, drop: 14, rise: 40, maxSl: 1.0,
    keep: (d) => d < 18 ? 0.5 : d < 38 ? 0.8 : 0.6,   // (thinner where js/world-chase-bt20.js already stands)
    skip: (c) => c === 3 || c === 5 || c === 6,
    pick: (R, d, s, c) => { const r = R(), w = d < 34 ? 2.2 : 2.8;
      if (c === 4 || c === 7 || s > 0.75) return r < 0.25 ? { c: 'kamni', k: 's', w: 0.5 + R() * 0.5, h: 0.3, col: M3(R, MD.stone, 0.95) }
        : r < 0.6 ? { c: 'sopi', k: 't', w: 0.26 * w, h: 0.55, col: M3(R, MD.straw) } : null;
      if (c === 1) return r < 0.3 ? { c: 'zaplate', k: 'p', r: 1.0 + R() * 1.6, col: M3(R, MD.litter, 0.95) }
        : r < 0.48 ? { c: 'praprot', k: 'g', w: 0.5 * w, h: 0.3, col: M3(R, MD.fern) } : r < 0.56 ? { c: 'kamni', k: 's', w: 0.4, h: 0.22, col: M3(R, MD.stone, 0.95) } : null;
      if (r < 0.46) return { c: 'sopi', k: 't', w: 0.3 * w, h: d < 34 ? 0.75 : 0.95, col: M3(R, R() < 0.6 ? MD.straw : MD.yel) };
      if (r < 0.62) return { c: 'sopi', k: 't', w: 0.27 * w, h: 0.6, col: M3(R, MD.green) };
      if (r < 0.8) return { c: 'brin', k: 'g', w: 0.42 * w, h: 0.55, col: M3(R, MD.jun) };   // (low juniper cushions)
      if (r < 0.9) return { c: 'kamni', k: 's', w: 0.45 + R() * 0.45, h: 0.28, col: M3(R, MD.stone, 0.95) };
      return null; } };

  const LK = API.PL_LOOK;
  if (LK && LK.medeu) chain(LK.medeu, (ctx) => {
    if (!ctx.out || !ctx.root || !ctx.matV) return;
    const T = API.T, gT = API.caGround || API.vrGround, near0 = API.vrNear; if (!T || !T.br || !T.wAt || !gT || !near0) return;
    const ex = ctx.excluded || (() => false), soft = softScen(ctx.root, ctx.matV);
    ctx.out.pasBt97 = band(soft, latOf(T, near0), gT, API.vrSlope || slopeOf(gT), API.vrLC, ex, rng(97101), MDF, { sopi: 0, brin: 0, kamni: 0 });
    soft.done();
  });

  /* ---- Mombasa: the reddish ground between the bank and the far band (colours of js/world-chase-bt35.js, darkened as there) ---- */
  const MB = {
    dry: [[0.8, 0.69, 0.47], [0.74, 0.65, 0.44]], green: [[0.5, 0.56, 0.28], [0.56, 0.6, 0.3]], bush: [[0.36, 0.48, 0.24], [0.42, 0.53, 0.24]],
    coral: [[0.8, 0.76, 0.66], [0.86, 0.81, 0.7]],
  };
  const B3 = (R, p, f) => dk(vary(mix3(p[0], p[1], R()), R, 0.025), f || 0.92);
  const MBF = { step: 3.6, n: 3, grp: 4, spread: 3.6, from: 7, reach: 38, pw: 1.15, drop: 4, rise: 12, maxSl: 0.6,
    keep: (d) => d < 22 ? 0.8 : 0.65,
    pick: (R, d) => { const r = R(), w = d < 20 ? 2.0 : 2.6;
      if (r < 0.4) return { c: 'sopi', k: 't', w: 0.3 * w, h: 0.7, col: B3(R, MB.dry) };
      if (r < 0.64) return { c: 'sopi', k: 't', w: 0.28 * w, h: 0.6, col: B3(R, MB.green) };
      if (r < 0.82) return { c: 'grmi', k: 'g', w: 0.6 * w, h: 0.75, col: B3(R, MB.bush) };
      if (r < 0.9) return { c: 'kamni', k: 's', w: 0.4 + R() * 0.35, h: 0.26, col: B3(R, MB.coral, 0.88) };
      return null; } };

  const mBase = World.ext && World.ext.mombasaRob;
  if (World.ext) World.ext.mombasaRob = function (ctx) {
    const r = (mBase ? mBase.call(this, ctx) : null) || {};
    try {
      const T = API.T, gT = API.nrGround, near0 = API.nrNear, { seaD, inFort } = ctx, ex = ctx.excluded || (() => false), lawn = World.ext.mombasaTrata;
      const bad = (x, z) => ex(x, z) || (seaD && seaD(x, z) > -4) || (inFort && inFort(x, z, 6)) || (lawn && lawn(x, z));
      if (ctx.root && ctx.out && ctx.out.matV && T && T.br && T.wAt && gT && near0) {
        const soft = softScen(ctx.root, ctx.out.matV);
        r.robBt97 = band(soft, latOf(T, near0), gT, API.nrSlope || slopeOf(gT), null, bad, rng(97201), MBF, { sopi: 0, grmi: 0, kamni: 0 });
        soft.done();
      }
    } catch (e) { console.error('chase-bt97 (mombasa):', e); }
    return r;
  };
})();
