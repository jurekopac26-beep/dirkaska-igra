/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventy-third group of the real tracks: Porto Moniz and
   Savusavu, a further pass on two of the passes' roads (js/world-prelaz.js) whose ground the earlier groups set only near the road
   (js/world-chase-bt7.js, js/world-chase-bt44.js: Porto Moniz's verge, bank to ~8 m and a sparse band to ~55 m; js/world-chase-bt8.js,
   js/world-chase-bt30.js: Savusavu's verge and bank to ~8 m). From behind the car the asphalt's edge met the verge in one clean line, and
   past the near bands the slopes stood in one even sheet. So here, as the seventy-first group did (js/world-chase-bt71.js), on both a worn
   edge (grit and dust off the asphalt and washed down onto it, 0.05-0.75 m past its edge, under the rail too, thin and broken) and a
   band from ~3 m to ~60 m past the barrier line, thinning with distance (from 9 m it lay outside the chase camera's frame). Savusavu (docs/proge/savusavu.md): »rdečerjav prah vulkanske prsti, ki ga dež spere na
   rob asfalta« on the edge; the plateau's grass, the grass the sun bleached, the red-brown soil of the cuts, the dark basalt's grit, the
   dark low bushes of the gardens and the forest's edge, lush tufts. Porto Moniz (docs/proge/portomoniz.md): the dark basalt grit of the
   shoulder on the edge; the terraces' pasture, the red-brown tuff earth, the basalt's scree on the steeper parts, lush tufts, the dark
   heath and laurel scrub in low cushions. Nothing at or below the sea, nothing where another leg's road is nearer, in the builder's
   excluded places (houses, viewpoints, the town) or on a face too steep. The horizon stays the existing sea and DEM terrain. All of it
   in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers, the walls, the trees and the driving
   stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API, LK = API.PL_LOOK;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !LK || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const latOf = (T, near) => { const q2 = { i: -1, lat: 0 }; return (x, z) => { const q = near(x, z); q2.i = q.i;
    q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; }; };
  // (as js/world-chase-bt30.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.015), k);

  /* the worn edge: every E.step m on both sides a short flat patch just past the asphalt's edge, at the road's height or the ground's */
  const edge = (soft, near, gT, bad, R, E) => {
    const T = API.T, N = T.px.length, step = Math.max(1, Math.round(E.step / T.ds)); let n = 0;
    const gE = (x, z) => { const q = near(x, z), g = gT(x, z); return q.i >= 0 ? Math.max(g, T.hy[q.i] - 0.03) : g; };
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      if (R() > E.share) continue;
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], o = w + 0.05 + R() * 0.7; if (o > bar + 0.5) continue;   // (flat, so it may lie under the barrier's rail)
      const a = (R() - 0.5) * E.step, x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 6 || Math.abs(q.lat) < T.wAt(q.i) || bad(x, z)) continue;
      const g = gT(x, z); if (!(g > T.hy[i] - 1.2) || !(g < T.hy[i] + 1.2)) continue;
      soil(soft, gE, x, z, Math.min(0.55, 0.3 + R() * 0.35), E.col(R), R, 0.04); n++;
    }
    return n;
  };

  /* the far band: every `step` m on both sides `n` tries between `from` m past the barrier line and `reach` m (denser near) */
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
        const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (another leg nearer)
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

  /* Savusavu: the colours of js/world-chase-bt30.js. On the edge the red-brown dust the rain washes onto the asphalt's edge, now and then
     the dark basalt grit; further out, over and past bt30's bank, the grass, the bleached grass, the red-brown soil where it is steep, lush tufts
     and the dark low bushes, the wider patches further away. */
  const SVE = { step: 2.2, share: 0.75,
    col: (R) => R() < 0.75 ? C3(R, [0.5, 0.34, 0.22], [0.55, 0.38, 0.25]) : C3(R, [0.3, 0.29, 0.27], [0.34, 0.32, 0.3]) };
  const SVF = { step: 3.4, n: 3, from: 3, reach: 60, pw: 1.5, drop: 8, rise: 40, maxSl: 1.3,
    keep: (d) => d < 25 ? 0.85 : 0.6,
    pick: (R, d, s) => { const r = R(), w = d < 25 ? 1 : 1.5;
      if (s > 0.9) return r < 0.65 ? { k: 'p', r: (1.0 + R() * 1.6) * w, col: C3(R, [0.48, 0.3, 0.21], [0.54, 0.35, 0.24]) } : null;   // (red-brown soil in the cut)
      if (r < 0.3) return { k: 'p', r: (1.3 + R() * 1.8) * w, col: C3(R, [0.27, 0.48, 0.15], [0.33, 0.51, 0.19]) };   // (grass)
      if (r < 0.5) return { k: 'p', r: (1.2 + R() * 1.6) * w, col: C3(R, [0.45, 0.54, 0.26], [0.5, 0.57, 0.29]) };   // (bleached grass)
      if (r < 0.58) return { k: 'p', r: (0.9 + R() * 1.1) * w, col: C3(R, [0.5, 0.34, 0.22], [0.55, 0.38, 0.25]) };   // (red-brown soil)
      if (r < 0.78) return { k: 't', w: 0.34, h: 0.5, col: mute(vary(mix3([0.22, 0.46, 0.14], [0.32, 0.51, 0.19], R()), R, 0.03)) };   // (lush tufts)
      return { k: 'g', w: d < 25 ? 0.8 : 1.1, h: 0.6, col: mute(vary(R() < 0.6 ? [0.12, 0.29, 0.1] : [0.16, 0.32, 0.12], R, 0.025), 0.97) }; } };   // (garden, forest-edge bushes)

  /* Porto Moniz: the colours of js/world-chase-bt44.js. On the edge the dark basalt grit of the shoulder and the red-brown tuff earth
     washed down from the terraces; further out, over bt44's bank and between and past its sparse band, the terraces' pasture (lush and sun-dried), the
     tuff earth, the basalt's scree on the steeper parts, lush tufts and the dark heath and laurel scrub in low cushions. */
  const PME = { step: 2.2, share: 0.75,
    col: (R) => R() < 0.65 ? C3(R, [0.46, 0.44, 0.4], [0.5, 0.47, 0.42]) : C3(R, [0.46, 0.36, 0.28], [0.5, 0.39, 0.3]) };   // (the grit's dust lighter than the asphalt)
  const PMF = { step: 3.6, n: 3, from: 3, reach: 60, pw: 1.5, drop: 6, rise: 45, maxSl: 1.35,
    keep: (d) => d < 25 ? 0.8 : 0.6,
    pick: (R, d, s) => { const r = R(), w = d < 25 ? 1 : 1.5;
      if (s > 0.9) return r < 0.7 ? { k: 'p', r: (1.0 + R() * 1.6) * w, col: C3(R, [0.37, 0.35, 0.32], [0.42, 0.39, 0.35]) } : null;   // (basalt scree)
      if (r < 0.28) return { k: 'p', r: (1.3 + R() * 1.8) * w, col: C3(R, [0.27, 0.43, 0.17], [0.31, 0.46, 0.2]) };   // (pasture, lush)
      if (r < 0.46) return { k: 'p', r: (1.2 + R() * 1.6) * w, col: C3(R, [0.45, 0.47, 0.28], [0.49, 0.49, 0.3]) };   // (pasture, sun-dried)
      if (r < 0.56) return { k: 'p', r: (0.9 + R() * 1.1) * w, col: C3(R, [0.43, 0.33, 0.26], [0.47, 0.37, 0.29]) };   // (red-brown tuff earth)
      if (r < 0.76) return { k: 't', w: 0.34, h: 0.48, col: mute(vary(mix3([0.27, 0.44, 0.17], [0.4, 0.47, 0.24], R()), R, 0.03)) };   // (lush tufts)
      return { k: 'g', w: d < 25 ? 0.8 : 1.1, h: 0.55, col: mute(vary(R() < 0.6 ? [0.15, 0.26, 0.12] : [0.2, 0.3, 0.15], R, 0.025), 0.97) }; } };   // (heath, laurel scrub)

  const add = (id, E, C, seed) => { if (LK[id]) chain(LK[id], (ctx) => {
    if (!ctx.out) return;
    try {
      const gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false), sea = ctx.out.sea;
      const bad = typeof sea === 'number' ? (x, z) => ex(x, z) || !(gT(x, z) > sea + 0.8) : ex;
      ctx.out.robBt73 = run(ctx.root, ctx.matV || ctx.out.matV, gT, API.vrNear, bad, seed, E, C);
    } catch (e) { console.error('chase-bt73 (' + id + '):', e); }
  }); };
  add('portomoniz', PME, PMF, 73100);
  // add('savusavu', SVE, SVF, 73200);   (in the aggregate branch Savusavu's far band comes from the seventy-second group, js/world-chase-bt72.js; only Porto Moniz here)
})();
