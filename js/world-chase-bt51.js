/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fifty-first group of the real tracks: Tianmen and Ngorongoro, a
   second pass on the two mountain roads whose ground the thirteenth, twentieth and twenty-fourth groups already set (js/world-chase-bt13.js,
   js/world-chase-bt20.js, js/world-chase-bt24.js). From behind the car Tianmen's ground past the barrier was still bare and even where the
   real road runs through a dense subtropical forest down to its edge (docs/realizem.md, Tianmen G), and Ngorongoro's crater rim stood in one
   green meadow where the dry season shows yellow-brown grass, straw and red-brown volcanic earth (docs/proge/ngorongoro.md). So here, on
   both, a band out to ~55 m past the barrier: knee- to chest-high undergrowth, tufts and wide low patches of what lies there, thinning
   with the distance; nothing on steep rock (slope over maxSl), nothing far below the road (a valley under a fill or a wall), nothing where
   another leg's road is nearer, in the builders' excluded places, on Ngorongoro's streams, path and the animals' places (its own bad()).
   The ground colours themselves: js/world-tianmen.js (the verge's damp earth) and js/world-ngorongoro.js (the dry season's base). All of it
   in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;

  /* every `step` m on both sides `n` tries between `from` m past the barrier and `reach` m (denser near: o = from + r^pw * reach); each
     a patch, a shrub or a tuft by C.pick(R, o) */
  const band = (ctx, o, seed, C) => {
    const T = API.T, near = o.near || API.vrNear, gT = o.gH || API.vrGround, st = { zaplate: 0, grmi: 0, sopi: 0 };
    if (!T || !T.br || !near || !gT || !ctx.root || !ctx.out || !ctx.out.matV) return st;
    const bad = (x, z) => (ctx.excluded && ctx.excluded(x, z)) || (o.bad && o.bad(x, z));
    const R = rng(seed), soft = softScen(ctx.root, ctx.out.matV), N = T.px.length;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i], e0 = T.w + 2.5, e1 = bar - 0.6;
      if (C.inner && e1 - e0 > 1.5 && R() < C.inner) {   // a wide verge inside the barrier (a hairpin's inside): a low shrub or a tuft on it, never nearer the asphalt than 2.5 m
        const oo = e0 + R() * (e1 - e0), a = (R() - 0.5) * C.step, x = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a, q = near(x, z);
        if (q.i >= 0 && Math.abs(q.i - i) * T.ds < 12 && Math.abs(q.lat) > T.w + 2.3 && Math.abs(q.lat) < bar - 0.5 && !bad(x, z) && !(gT(x, z) < T.hy[q.i] - 3)) {
          const y = T.hy[q.i] - 0.1, h = R(), P = C.pick(R, 0, 0);
          if (P.k === 'p') { soil(soft, () => y, x, z, Math.min(P.r, (e1 - e0) * 0.5), P.col, R, 0.05); st.zaplate++; }
          else if (P.k === 'g') { cushion(soft.get(x, z), x, y, z, P.w * (0.7 + h * 0.4), P.h * (0.6 + h * 0.4), P.col, R); st.grmi++; }
          else { tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.7 + h * 0.4), P.col, R, 5); st.sopi++; }
        }
      }
      for (let k = 0; k < C.n; k++) {
        const r1 = R(), r2 = R(), oo = bar + C.from + Math.pow(r1, C.pw) * (C.reach - C.from), a = (r2 - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const x = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > oo + 10 || Math.abs(q.lat) < bar + 0.4) continue;   // (another leg nearer, or inside a barrier)
        if (bad(x, z)) continue;
        const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
        const P = C.pick(R, oo - bar, s), h = R();
        if (P.k === 'p') { soil(soft, gT, x, z, P.r, P.col, R, 0.06); st.zaplate++; }
        else if (P.k === 'g') { cushion(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.5), P.h * (0.8 + h * 0.5), P.col, R); st.grmi++; }
        else { tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, 5); st.sopi++; }
      }
    }
    soft.done();
    return st;
  };

  /* Tianmen: docs/proge/tianmen.md: »gost subtropski gozd (zimzeleni listavci, bori, nižje ob cesti bambus), grmičevje na policah«, the wet
     mountain air; docs/realizem.md: down to the road a dense forest. Past the barrier the evergreen undergrowth in dark rounded shrubs, the
     bamboo's and the ferns' tall light-green tufts near the road, the fallen brown leaves and the dark wet earth between them; on the
     ledges (steeper ground) fewer and lower. */
  const TM = { step: 2.6, n: 3, inner: 0.7, from: 0.6, reach: 50, pw: 1.7, drop: 14, rise: 40, maxSl: 1.25,
    keep: (d) => d < 12 ? 0.9 : 0.55,
    pick: (R, d, s) => { const r = R();
      if (r < 0.3) return { k: 'p', r: 1.0 + R() * (d < 10 ? 1.2 : 2.6), col: R() < 0.55 ? vary(mix3([0.33, 0.28, 0.19], [0.39, 0.32, 0.21], R()), R, 0.015) : vary(mix3([0.24, 0.27, 0.17], [0.28, 0.3, 0.18], R()), R, 0.015) };   // (fallen leaves, wet dark earth)
      if (r < 0.75 || s > 0.8) return { k: 'g', w: d < 6 ? 0.7 : 1.0, h: s > 0.8 ? 0.5 : 0.85, col: vary(mix3([0.16, 0.24, 0.12], [0.22, 0.3, 0.14], R()), R, 0.02) };   // (evergreen undergrowth)
      return { k: 't', w: 0.35, h: d < 10 ? 1.1 : 0.8, col: vary(mix3([0.3, 0.42, 0.18], [0.36, 0.47, 0.2], R()), R, 0.025) }; } };   // (bamboo, ferns)

  /* Ngorongoro: docs/proge/ngorongoro.md: the dry season, »rumeno-rjava trava, slama, kjer je suho, zelenejše v kotanjah, rdeče-rjava
     vulkanska prst, temnejše grmičevje«. Past the barrier the straw and the tawny grass in wide low patches, the red-brown earth bared in
     between, tawny tussocks and here and there a dark low shrub. */
  const NG = { step: 3.2, n: 3, inner: 0.25, from: 0.8, reach: 55, pw: 1.4, drop: 10, rise: 30, maxSl: 0.9,
    keep: (d) => d < 15 ? 0.8 : 0.5,
    pick: (R, d) => { const r = R();
      if (r < 0.5) return { k: 'p', r: 1.2 + R() * (d < 10 ? 1.4 : 3.2), col: R() < 0.65 ? vary(mix3([0.6, 0.53, 0.34], [0.64, 0.57, 0.37], R()), R, 0.015) : vary(mix3([0.5, 0.33, 0.23], [0.55, 0.37, 0.25], R()), R, 0.015) };   // (straw, red earth)
      if (r < 0.85) return { k: 't', w: 0.3, h: 0.45, col: vary(mix3([0.6, 0.5, 0.29], [0.68, 0.6, 0.37], R()), R, 0.025) };   // (tawny tussocks)
      return { k: 'g', w: 0.8, h: 0.55, col: vary(mix3([0.24, 0.29, 0.15], [0.3, 0.33, 0.17], R()), R, 0.02) }; } };   // (dark shrubs)

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      try {
        if (id === 'tianmen' && ctx.out) ctx.out.robBt51 = band(ctx, o || {}, 51301, TM);
        else if (id === 'ngorongoro' && ctx.out) ctx.out.robBt51 = band(ctx, o || {}, 51302, NG);
      } catch (e) { console.error('chase-bt51 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);
    World.ext.goreRob = f;
  }
})();
