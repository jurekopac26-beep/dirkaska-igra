/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the ninety-first group of the real tracks: Furka and Gudauri, a
   further pass on two of the passes' roads (js/world-prelaz.js) whose ground the earlier groups set (Furka: js/world-chase-bt7.js,
   js/world-chase-bt26.js: tussocks, slabs and ribs to ~22 m, the verge and the bank to 7 m; Gudauri: js/world-chase-bt7.js,
   js/world-chase-bt25.js, js/world-chase-bt58.js: the verge, the bank, flat patches, single tufts and cushions to ~58 m). From behind the
   car Furka's pasture past ~22 m was the terrain's one green with nothing on it, cut off in a line where the near band ended; Gudauri's
   slopes past the bank were flat patches with single bright spikes, little standing in the grass and no stone on the steep parts.
   So here, by each track's land cover (js/tracks/<id>.js lc: 0 alpine grass, 2 dwarf shrubs, 4 rock faces, 7 scree; ESA WorldCover,
   Sentinel-2, the canopy-height map):
   Furka (docs/proge/furka.md: »alpski pašniki s šopi trave in nizkim cvetjem, v zaplatah grmičevje … Svetlo siv granit in gnajs v
   pečinah, ploščah in balvanih, obsežna melišča«): from ~3 m past the barrier line to ~60 m, on the grass flat patches of a greener and
   a straw pasture, tussocks in loose groups (green, some going to straw), a few pale granite stones; on the shrubs' ground the low dark
   mats of alpine rose and juniper; on rock, scree and steep faces the pale granite's stones and grit.
   Gudauri (docs/proge/gudauri.md, late summer: »alpski travniki in pašniki, v zaplatah grmovje … v strminah pečine in melišča«): from
   ~4 m to ~60 m, low tussocks of the grazed yellowing meadow in loose groups (straw and olive, toned toward the ground, not the bright
   spikes), the grey-brown shale's stones and grit on the steep parts, the rock and the scree, the rhododendron and juniper mats on the
   shrubs' ground.
   Nothing on built ground, water, snow or forest (3, 5, 6, 1), in the builder's excluded places (the hotel, the huts, the car parks, the
   village), where another leg's road is nearer, on a face too steep or far below the road. All of it in meshes of their own (softScen:
   256 m chunks, no shadow); the terrain, the road, the barriers and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API, LK = API.PL_LOOK;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng || !LK) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt84.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, c, k) => mute(vary(mix3(c[0], c[1], R()), R, 0.015), k);
  const T3 = (R, c, k) => mute(vary(mix3(c[0], c[1], R()), R, 0.03), k || 0.97);

  /* the band (as js/world-chase-bt85.js): every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m (denser
     near); each place a small group (C.grp things within C.spread m), so it reads as clumps on the ground, not as an even sprinkle */
  const band = (ctx, seed, C) => {
    const T = API.T, gT = API.caGround || API.vrGround, near0 = API.vrNear, lc = API.vrLC, matV = ctx.matV || (ctx.out && ctx.out.matV), st = {};
    if (!T || !T.br || !gT || !near0 || !lc || !ctx.root || !matV) return st;
    const ex = ctx.excluded || (() => false), N = T.px.length, R = rng(seed), soft = softScen(ctx.root, matV);
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near0(x, z); if (q.i < 0 || gap(q.i, i, N) * T.ds > oo + 12) continue;
          const lat = Math.abs((x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i]), sgn = (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] > 0;
          if (lat < (sgn ? T.br[q.i] : T.bl[q.i]) + C.from * 0.7) continue;   // (another leg's road is nearer: its own near bands stand there)
          if (ex(x, z)) continue;
          const c = lc(x, z); if (c === 1 || c === 3 || c === 5 || c === 6) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
          const P = C.pick(R, oo - bar, s, c), h = R(); if (!P) continue;
          if (P.k === 'p') soil(soft, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g' || P.k === 's') cushion(soft.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    soft.done(); return st;
  };

  /* ---- Furka: the colours of js/world-chase-bt26.js (the pasture's green and straw, the Aar massif's pale granite, alpine rose, juniper) ---- */
  const FK = {
    green: [[0.41, 0.5, 0.25], [0.36, 0.48, 0.22]], straw: [[0.56, 0.55, 0.34], [0.53, 0.53, 0.33]], tuft: [[0.45, 0.52, 0.26], [0.57, 0.56, 0.34]],
    granite: [[0.66, 0.66, 0.64], [0.72, 0.71, 0.69]], grit: [[0.6, 0.6, 0.58], [0.64, 0.63, 0.61]], shrub: [[0.2, 0.28, 0.16], [0.26, 0.3, 0.2]],
  };
  const FKF = { step: 4.0, n: 3, grp: 3, spread: 4, from: 3, reach: 60, pw: 1.6, drop: 16, rise: 40, maxSl: 1.4,
    keep: (d) => d < 25 ? 0.8 : 0.6,
    pick: (R, d, s, c) => { const r = R(), w = d < 25 ? 1.2 : 1.8;
      if (c === 4 || c === 7 || s > 0.9) return r < 0.5 ? { c: 'kamni', k: 's', w: 0.5 * w, h: 0.32, col: T3(R, FK.granite, 1.0) }
        : r < 0.85 ? { c: 'grusc', k: 'p', r: (1.0 + R() * 1.4) * w, col: C3(R, FK.grit, 1.0) } : null;
      if (c === 2) return r < 0.55 ? { c: 'grmi', k: 'g', w: 0.75 * w, h: 0.42, col: T3(R, FK.shrub) }
        : r < 0.85 ? { c: 'sopi', k: 't', w: 0.32 * w, h: 0.45, col: T3(R, FK.tuft) } : { c: 'kamni', k: 's', w: 0.42 * w, h: 0.26, col: T3(R, FK.granite, 1.0) };
      if (r < 0.2) return { c: 'zaplate', k: 'p', r: (1.3 + R() * 1.7) * w, col: C3(R, FK.green) };
      if (r < 0.38) return { c: 'zaplate', k: 'p', r: (1.2 + R() * 1.5) * w, col: C3(R, FK.straw) };
      if (r < 0.82) return { c: 'sopi', k: 't', w: 0.34 * w, h: 0.48, col: T3(R, FK.tuft), n: 6 };
      if (r < 0.9) return { c: 'grmi', k: 'g', w: 0.6 * w, h: 0.36, col: T3(R, FK.shrub) };
      return { c: 'kamni', k: 's', w: 0.4 * w, h: 0.25, col: T3(R, FK.granite, 1.0) }; } };

  /* ---- Gudauri: the colours of js/world-chase-bt25.js and js/world-chase-bt58.js (the grazed meadow's straw and olive, the grey-brown
     shale and andesite, rhododendron and juniper) ---- */
  const GD = {
    straw: [[0.56, 0.54, 0.33], [0.6, 0.57, 0.36]], olive: [[0.43, 0.48, 0.25], [0.47, 0.5, 0.28]],
    shale: [[0.46, 0.44, 0.41], [0.52, 0.5, 0.46]], grit: [[0.5, 0.49, 0.46], [0.55, 0.53, 0.49]], shrub: [[0.26, 0.34, 0.19], [0.3, 0.36, 0.24]],
  };
  const GDF = { step: 3.6, n: 3, grp: 3, spread: 3.5, from: 4, reach: 60, pw: 1.5, drop: 18, rise: 45, maxSl: 1.4,
    keep: (d) => d < 25 ? 0.75 : 0.6,
    pick: (R, d, s, c) => { const r = R(), w = d < 25 ? 1.3 : 1.8;
      if (c === 4 || c === 7 || s > 0.75) return r < 0.5 ? { c: 'kamni', k: 's', w: 0.46 * w, h: 0.28, col: T3(R, GD.shale, 0.95) }
        : r < 0.8 ? { c: 'grusc', k: 'p', r: (0.9 + R() * 1.3) * w, col: C3(R, GD.grit) } : null;
      if (c === 2) return r < 0.6 ? { c: 'grmi', k: 'g', w: 0.8 * w, h: 0.45, col: T3(R, GD.shrub) } : { c: 'sopi', k: 't', w: 0.34 * w, h: 0.4, col: T3(R, GD.straw) };
      if (r < 0.52) return { c: 'sopi', k: 't', w: 0.36 * w, h: 0.4, col: T3(R, GD.straw), n: 6 };
      if (r < 0.84) return { c: 'sopi', k: 't', w: 0.34 * w, h: 0.34, col: T3(R, GD.olive), n: 6 };
      if (r < 0.93) return { c: 'kamni', k: 's', w: 0.36 * w, h: 0.22, col: T3(R, GD.shale, 0.95) };
      return { c: 'grmi', k: 'g', w: 0.6 * w, h: 0.36, col: T3(R, GD.shrub) }; } };

  const add = (id, C, seed) => { if (LK[id]) chain(LK[id], (ctx) => {
    try { if (ctx.out) ctx.out.pasBt91 = band(ctx, seed, C); } catch (e) { console.error('chase-bt91 (' + id + '):', e); }
  }); };
  add('furka', FKF, 91100);
  add('gudauri', GDF, 91200);
})();
