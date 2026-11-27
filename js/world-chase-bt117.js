/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-seventeenth group of the real tracks: Hakone, a
   further pass on the ground the earlier groups set (js/world-chase-bt10.js: ferns and sasa on the forest's floor to ~12 m past the
   barrier line, the uncut grass at the barrier's foot, the pampas grass on the meadows 6-30 m out; js/world-chase-bt32.js: the verge's
   strip and the bank to ~9 m). From behind the car what was left in one even face is the band farther out: past ~10 m the forest's floor,
   the scrub and the rock showed the build's ground colour only, the meadows past ~30 m nothing standing. So here, from ~10 m past the
   barrier line to ~52 m (within ~60 m of the road), on both sides, in small loose groups (denser near):
   docs/proge/hakone.md (»listavci, manj kriptomerij … ob cesti nizek bambus sasa«, »travniki«) and docs/proga-hakone.md (the land cover:
   0 open, 1 forest, 2 scrub, 3 settlement, 4 rock, 5 water; the build's ground, js/world-hakone.js hkCol: »sasa na grmovju«, »andezit na
   strminah«, the meadows' drier and lusher patches):
   - the forest (1): sasa and ferns in low clumps on its floor (the ferns rust in autumn, sasa green the year round), no flat patches (the
     build colours that ground as the canopy seen from above);
   - the scrub (2): sasa in denser, taller clumps;
   - the open ground (0): on the meadows the grass in tufts and in drier and lusher patches, past ~30 m the pampas grass (susuki) with its
     lighter plumes, gold in autumn;
   - the rock (4) and the steep faces: grey-brown andesite stones, its soil in patches, a few tufts.
   Nothing in the villages (3), the water (5), on the railway's bed, in the builders' excluded places, where another leg's road is nearer, on
   a face too steep or far below the road. All of it in meshes of their own (softScen: 256 m chunks, no shadow), none of it is hit; the
   terrain, the road, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;

  // (as js/world-chase-bt92.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a) => mute(vary(mix3(a[0], a[1], R()), R, 0.015));
  const T3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.03), k || 0.97);

  /* the colours (the summer's and the autumn's): as js/world-chase-bt10.js (FERN, SASA, GR, SUS, PLUME) and js/world-chase-bt32.js
     (the mown grass, its drier patches, the andesite and its soil) */
  const COL = (su) => ({
    sasa: su ? [[0.26, 0.44, 0.14], [0.3, 0.48, 0.17]] : [[0.29, 0.42, 0.16], [0.32, 0.45, 0.18]],
    fern: su ? [[0.28, 0.5, 0.13], [0.33, 0.53, 0.16]] : [[0.52, 0.37, 0.16], [0.58, 0.42, 0.18]],
    grass: su ? [[0.36, 0.5, 0.18], [0.42, 0.54, 0.22]] : [[0.58, 0.52, 0.3], [0.63, 0.55, 0.32]],
    dry: su ? [[0.48, 0.52, 0.27], [0.54, 0.55, 0.3]] : [[0.66, 0.58, 0.36], [0.7, 0.62, 0.4]],
    lush: su ? [[0.28, 0.42, 0.15], [0.32, 0.45, 0.17]] : [[0.5, 0.46, 0.26], [0.54, 0.49, 0.28]],
    tuft: su ? [[0.34, 0.5, 0.17], [0.48, 0.54, 0.27]] : [[0.6, 0.52, 0.29], [0.74, 0.65, 0.41]],
    sus: su ? [[0.34, 0.48, 0.19], [0.4, 0.52, 0.22]] : [[0.66, 0.57, 0.34], [0.72, 0.62, 0.38]],
    plume: su ? [[0.5, 0.5, 0.35], [0.55, 0.54, 0.38]] : [[0.82, 0.74, 0.56], [0.88, 0.8, 0.62]],
    andesite: [[0.5, 0.47, 0.42], [0.56, 0.52, 0.46]], soil: [[0.5, 0.42, 0.32], [0.54, 0.45, 0.34]],
  });

  /* what stands at d m past the barrier line on ground of class c and slope s */
  const pick = (K) => (R, d, s, c) => {
    const r = R(), w = d < 30 ? 1 : 1.25;
    if (c === 4 || s > 1.0) return r < 0.5 ? { c: 'kamni', k: 's', w: 0.5 * w, h: 0.3, col: T3(R, K.andesite, 0.95) }
      : r < 0.75 ? { c: 'zaplate', k: 'p', r: (0.8 + R() * 0.9) * w, col: C3(R, r < 0.62 ? K.soil : K.andesite) }
      : r < 0.88 ? { c: 'sopi', k: 't', w: 0.26 * w, h: 0.4, col: T3(R, K.tuft) } : null;
    if (c === 1) return r < 0.5 ? { c: 'sasa', k: 'g', w: 0.75 * w, h: 0.55, col: T3(R, K.sasa) }
      : r < 0.82 ? { c: 'praprot', k: 'g', w: 0.6 * w, h: 0.5, col: T3(R, K.fern) } : null;
    if (c === 2) return r < 0.8 ? { c: 'sasa', k: 'g', w: 0.9 * w, h: 0.7, col: T3(R, K.sasa) } : { c: 'sopi', k: 't', w: 0.3 * w, h: 0.5, col: T3(R, K.tuft) };
    // the open ground: the meadows
    if (d > 30 && r < 0.3) return { c: 'susuki', k: 'u', w: 0.5 * w, h: 1.1, col: T3(R, K.sus), pl: T3(R, K.plume) };
    if (r < 0.62) return { c: 'sopi', k: 't', w: 0.3 * w, h: 0.48, col: T3(R, K.tuft) };
    return { c: 'zaplate', k: 'p', r: (0.9 + R() * 1.1) * w, col: C3(R, r < 0.82 ? K.dry : K.lush) };
  };

  /* the band past the barriers (as js/world-chase-bt92.js band, on a closed lap): every C.step m on both sides C.n tries from C.from m
     past the barrier line to C.reach m (denser near), each a small group (C.grp things within C.spread m) */
  const C = { step: 3.2, n: 3, grp: 3, spread: 3.5, from: 10, reach: 50, pw: 1.5, drop: 14, rise: 30, maxSl: 1.3, keep: 0.8 };
  const band = (soft, gT, lc, bad, R, P, st) => {
    const T = API.T, N = T.px.length, near = API.vrNear, wAt = (i) => T.wAt ? T.wAt(i) : T.w;
    const gap = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N - d); };   // (a closed lap)
    const slope = API.vrSlope || ((x, z) => { const d = 1.0; return Math.hypot(gT(x + d, z) - gT(x - d, z), gT(x, z + d) - gT(x, z - d)) / (2 * d); });
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
          const c = lc ? lc(x, z) : 0; if (c === 3 || c === 5 || bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
          const p = P(R, oo - bar, s, c), h = R(); if (!p) continue;
          if (p.k === 'p') soil(soft, gT, x, z, p.r, p.col, R, 0.05);
          else if (p.k === 'g' || p.k === 's') cushion(soft.get(x, z), x, y - (p.k === 's' ? 0.05 : 0), z, p.w * (0.75 + h * 0.55), p.h * (0.75 + h * 0.55), p.col, R);
          else if (p.k === 'u') { const g = soft.get(x, z), hh = p.h * (0.8 + h * 0.5);
            tuft(g, x, y, z, p.w * (0.8 + h * 0.4), hh, p.col, R, 4);
            tuft(g, x + (R() - 0.5) * 0.3, y + hh * 0.6, z + (R() - 0.5) * 0.3, p.w * 0.5, hh * 0.45, p.pl, R, 3); }
          else tuft(soft.get(x, z), x, y, z, p.w * (0.8 + h * 0.4), p.h * (0.8 + h * 0.5), p.col, R, 4);
          st[p.c] = (st[p.c] || 0) + 1;
        }
      }
    }
    return st;
  };

  World.ext = World.ext || {};
  if (World.ext.hakoneRob) {   // (Hakone's own builder: js/world-hakone.js calls it after its plants)
    const base = World.ext.hakoneRob;
    World.ext.hakoneRob = function (ctx) {
      const r = base.call(this, ctx);
      try {
        const T = API.T, gT = API.vrGround, out = ctx && ctx.out;
        if (out && ctx.root && ctx.matV && T && T.br && gT && API.vrNear) {
          const ex = ctx.excluded || (() => false), rd = ctx.railD, wa = API.vrWater;
          const bad = (x, z) => ex(x, z) || (rd && rd(x, z) < 3.2) || (wa && wa(x, z).e > -1);
          const soft = softScen(ctx.root, ctx.matV);
          out.robBt117 = band(soft, gT, API.vrLC, bad, rng(117100), pick(COL(ctx.summer !== false)), {});
          soft.done();
        }
      } catch (e) { console.error('chase-bt117 (hakone):', e); }
      return r;
    };
  }
})();
