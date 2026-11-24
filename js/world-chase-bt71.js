/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventy-first group of the real tracks: Chapman's Peak and
   Mombasa, a second pass on two tracks whose ground the earlier groups set only near the road (js/world-chase-bt25.js: Chapman's verge
   and bank to ~7 m; js/world-chase-bt35.js: Mombasa's strip, bank and patches to ~40 m). From behind the car the asphalt's edge met the
   ground in one clean line, and past the near bands the slopes stood in one even sheet. Here on both a worn edge (fine grit and dust
   off the asphalt, 0.05-0.75 m past its edge, thin and broken) and a far band out to ~60 m past the barrier, thinning with distance.
   Chapman's Peak (docs/proge/chapman.md): the fynbos mosaic on the slope above the road, grey-green shrubs, rusty restio tufts, silvery
   patches and ochre sandy soil, grey granite grit on the steep parts; nothing far below the road (the cliffs to the sea stay bare) and
   nothing on the sea. Mombasa (docs/proge/mombasa.md): reddish earth, green and dry grass, low bushes, the colours of bt35 darkened the
   same way; nothing on the houses and yards (the builder's excluded), the sea or the fortress. The horizon stays the existing sea and
   terrain. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;

  const latOf = (T, near) => { const q2 = { i: -1, lat: 0 }; return (x, z) => { const q = near(x, z); q2.i = q.i;
    q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; }; };
  const dk = (c, f) => [c[0] * f, c[1] * f, c[2] * f];

  /* the worn edge: every ~2.4 m on both sides a short flat patch just past the asphalt's edge, at the road's height or the ground's */
  const edge = (soft, near, gT, bad, R, E) => {
    const T = API.T, N = T.px.length, step = Math.max(1, Math.round(E.step / T.ds)); let n = 0;
    const gE = (x, z) => { const q = near(x, z), g = gT(x, z); return q.i >= 0 ? Math.max(g, T.hy[q.i] - 0.03) : g; };
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      if (R() > E.share) continue;
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], o = w + 0.05 + R() * 0.7; if (o > bar - 0.2) continue;
      const a = (R() - 0.5) * E.step, x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 6 || Math.abs(q.lat) < T.wAt(q.i) || bad(x, z)) continue;
      const g = gT(x, z); if (!(g > T.hy[i] - 1.2) || !(g < T.hy[i] + 1.2)) continue;
      soil(soft, gE, x, z, Math.min(0.55, 0.3 + R() * 0.35), E.col(R), R, 0.04); n++;
    }
    return n;
  };

  /* the far band: every `step` m on both sides `n` tries between `from` m past the barrier and `reach` m (denser near) */
  const band = (soft, near, gT, bad, R, C) => {
    const T = API.T, st = { zaplate: 0, grmi: 0, sopi: 0 }, N = T.px.length;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const x = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > oo + 10) continue;
        const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + C.from * 0.7) continue;   // (another leg nearer)
        if (bad(x, z)) continue;
        const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
        const P = C.pick(R, oo - bar, s), h = R(); if (!P) continue;
        if (P.k === 'p') { soil(soft, gT, x, z, P.r, P.col, R, 0.05); st.zaplate++; }
        else if (P.k === 'g') { cushion(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.5), P.h * (0.8 + h * 0.5), P.col, R); st.grmi++; }
        else { tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, 5); st.sopi++; }
      }
    }
    return st;
  };

  const run = (root, matV, gT, near0, bad, seed, E, C) => {
    const T = API.T; if (!T || !T.br || !T.wAt || !gT || !near0 || !root || !matV) return null;
    const near = latOf(T, near0), R = rng(seed), soft = softScen(root, matV);
    const st = band(soft, near, gT, bad, R, C); st.rob = edge(soft, near, gT, bad, R, E);
    soft.done(); return st;
  };

  /* Chapman's Peak: the colours of js/world-chase-bt25.js (ochre sand, granite grit, restio litter, grey-green lichen and shrubs) */
  const CPE = { step: 2.4, share: 0.55, col: (R) => R() < 0.6 ? vary(mix3([0.55, 0.55, 0.52], [0.6, 0.6, 0.56], R()), R, 0.015) : vary(mix3([0.66, 0.58, 0.44], [0.7, 0.62, 0.47], R()), R, 0.015) };
  const CPF = { step: 3.4, n: 3, from: 6, reach: 58, pw: 1.25, drop: 6, rise: 45, maxSl: 1.4,
    keep: (d) => d < 20 ? 0.85 : 0.6,
    pick: (R, d, s) => { const r = R();
      if (s > 0.8) return r < 0.7 ? { k: 'p', r: 1.2 + R() * 2.2, col: vary(mix3([0.55, 0.55, 0.52], [0.6, 0.6, 0.56], R()), R, 0.015) } : null;   // (granite grit, scree)
      if (r < 0.34) return { k: 'p', r: 1.4 + R() * (d < 15 ? 2 : 3.6), col: R() < 0.55 ? vary(mix3([0.66, 0.58, 0.44], [0.7, 0.62, 0.47], R()), R, 0.015) : vary(mix3([0.5, 0.53, 0.44], [0.55, 0.57, 0.48], R()), R, 0.015) };   // (sandy soil, lichen)
      if (r < 0.44) return { k: 'p', r: 0.9 + R() * 1.4, col: vary([0.56, 0.44, 0.31], R, 0.02) };   // (restio litter)
      if (r < 0.66) return { k: 't', w: 0.32, h: 0.5, col: vary(mix3([0.55, 0.42, 0.28], [0.47, 0.47, 0.3], R()), R, 0.025) };   // (restio tufts)
      const c = R(); return { k: 'g', w: d < 15 ? 0.7 : 1.0, h: 0.5, col: vary(c < 0.45 ? [0.5, 0.54, 0.44] : c < 0.75 ? [0.62, 0.64, 0.58] : [0.4, 0.43, 0.29], R, 0.02) }; } };   // (fynbos shrubs)

  /* Mombasa: the colours of js/world-chase-bt35.js, darkened as there (the reddish ground is saturated) */
  const MBE = { step: 2.4, share: 0.5, col: (R) => dk(vary(mix3([0.74, 0.65, 0.52], [0.68, 0.49, 0.34], R()), R, 0.015), 0.82) };
  const MBF = { step: 3.6, n: 2, from: 36, reach: 60, pw: 1.2, drop: 4, rise: 12, maxSl: 0.6,
    keep: (d) => d < 48 ? 0.7 : 0.5,
    pick: (R, d, s) => { const r = R();
      if (r < 0.4) return { k: 'p', r: 1.8 + R() * 3.4, col: dk(vary(mix3([0.68, 0.49, 0.34], [0.72, 0.52, 0.36], R()), R, 0.015), 0.82) };   // (reddish earth)
      if (r < 0.66) return { k: 'p', r: 1.8 + R() * 3, col: dk(R() < 0.6 ? vary(mix3([0.66, 0.58, 0.37], [0.62, 0.57, 0.36], R()), R, 0.015) : vary([0.8, 0.69, 0.47], R, 0.015), 0.82) };   // (green, dry grass)
      if (r < 0.84) return { k: 't', w: 0.3, h: 0.36, col: dk(vary([0.8, 0.69, 0.47], R, 0.025), 0.92) };   // (dry tufts)
      return { k: 'g', w: 0.9, h: 0.55, col: dk(vary(mix3([0.36, 0.48, 0.24], [0.42, 0.53, 0.24], R()), R, 0.02), 0.92) }; } };   // (low bushes)

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      try {
        if (id === 'chapman' && ctx.out && o && o.gH) {
          const ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || (o.bad && o.bad(x, z));
          ctx.out.robBt71 = run(ctx.root, ctx.out.matV, o.gH, o.near || API.vrNear, bad, 71101, CPE, CPF);
        }
      } catch (e) { console.error('chase-bt71 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);
    World.ext.goreRob = f;
  }

  const mBase = World.ext && World.ext.mombasaRob;
  if (World.ext) World.ext.mombasaRob = function (ctx) {
    const r = (mBase ? mBase.call(this, ctx) : null) || {};
    try {
      const { seaD, inFort } = ctx, ex = ctx.excluded || (() => false);
      const bad = (x, z) => ex(x, z) || (seaD && seaD(x, z) > -4) || (inFort && inFort(x, z, 6));
      if (ctx.root && ctx.out) r.robBt71 = run(ctx.root, ctx.out.matV, API.nrGround, API.nrNear, bad, 71201, MBE, MBF);
    } catch (e) { console.error('chase-bt71 (mombasa):', e); }
    return r;
  };
})();
