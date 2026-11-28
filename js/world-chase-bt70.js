/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventieth group of the real tracks: Furka and Izoard, a
   third pass on two of the passes' roads (js/world-prelaz.js) whose ground the seventh group (js/world-chase-bt7.js: ribs, slabs, tufts
   and shrubs within ~22 m), the twenty-sixth (js/world-chase-bt26.js: Furka's verge and bank to ~7 m) and the forty-sixth
   (js/world-chase-bt46.js: Izoard's verge and wide patches 18-60 m) already set. From behind the car what was left even: the asphalt's
   edge and the gravel shoulder in one clean line along the whole road, and on Furka the slope past the bank out to the horizon one smooth
   wash of the pasture's colour, on Izoard the band past ~22 m patches only, flat, with nothing standing on them. So here:
   on both, along the asphalt's edge the worn and ravelled rim in short pale streaks and the shoulder's grit thrown onto it in sprays
   (light grey granite on Furka, pale limestone on Izoard), only on open road (not on bridges, in the excluded places or by the water);
   on Furka (docs/proge/furka.md: »alpski pašniki s šopi trave in nizkim cvetjem, v zaplatah grmičevje … Svetlo siv granit in gnajs …,
   obsežna melišča in ledeniško poliran skalni svet«) from ~9 m to ~60 m past the barriers wide low patches of the pasture's green and
   straw, the pale granite scree on the rock (land cover 4, 7), and standing on them tussocks, the low alpine rose and juniper mats and
   grey granite boulders; on Izoard (docs/proge/izoard.md: »redek gozd macesnov … na travnatih tleh«, više »suhi alpski pašniki z brinom …,
   široka melišča pod prelazom«) from ~22 m to ~60 m the dry pasture's gold tussocks and the juniper cushions in the open, the scree in
   downslope streaks on the rock, green tufts and needle litter under the larches. Nothing on built ground (3), on the snow (5), in the
   water, where another leg's road is nearer, far below the road or on the steep. All of it in meshes of their own (softScen: 256 m
   chunks, no shadow); the terrain, the road, the barriers, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API, LK = API.PL_LOOK;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.softScen || !BT.mix3 || !BT.chain || !LK || !rng || !vary) return;
  const { soil, tuft, cushion, softScen, mix3, chain } = BT;
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const C_ = (R, ab, j) => mute(vary(mix3(ab[0], ab[1], R()), R, j || 0.015));

  /* a thin low streak lying on the ground along (ax, az), tapering to both ends (the fifty-sixth group's, js/world-chase-bt56.js) */
  const streak = (scen, gH, x, z, ax, az, len, wid, col, R, lift) => {
    const g = scen.get(x, z), bx = -az, bz = ax, n = 4, up = lift || 0.04, rim = [col[0] * 0.92 + 0.04, col[1] * 0.92 + 0.05, col[2] * 0.92 + 0.03], L = [], P = [], C = [];
    for (let k = 0; k <= n; k++) {
      const u = (k / n - 0.5) * len, t = Math.sin(Math.PI * k / n), hw = wid * 0.5 * (0.2 + 0.8 * t) * (0.8 + R() * 0.4), j = (R() - 0.5) * wid * 0.3;
      const cx = x + ax * u + bx * j, cz = z + az * u + bz * j;
      L.push([cx + bx * hw, gH(cx + bx * hw, cz + bz * hw) + up, cz + bz * hw]); P.push([cx - bx * hw, gH(cx - bx * hw, cz - bz * hw) + up, cz - bz * hw]); C.push([cx, gH(cx, cz) + up + 0.006, cz]);
    }
    for (let k = 0; k < n; k++) {
      const inn = [C[k][0], C[k][1] - 5, C[k][2]];
      g.triO(C[k], L[k], L[k + 1], col, inn, rim, rim); g.triO(C[k], L[k + 1], C[k + 1], col, inn, rim, col);
      g.triO(C[k], P[k + 1], P[k], col, inn, rim, rim); g.triO(C[k], C[k + 1], P[k + 1], col, inn, col, rim);
    }
  };

  /* the asphalt's edge and the shoulder (the passes' road: asphalt at +0.02 to w, the gravel shoulder from +0.012 at w to -0.02 at w + 0.45):
     every ~3 m on each side by chance the worn rim in a short pale streak just inside the edge, and the grit thrown from the shoulder */
  const edge = (ctx, seed, K) => {
    const T = API.T, near = API.vrNear, gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false), st = { rob: 0, gramoz: 0 };
    if (!T || !T.br || !near || !gT) return st;
    const N = T.px.length, w = T.w, ds = T.ds, R = rng(seed), soft = softScen(ctx.root, ctx.matV);
    const wet = API.vrWater ? (x, z) => { const q = API.vrWater(x, z); return q && q.e > -4; } : () => false;
    const rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const o = Math.abs(q.lat), y = T.hy[q.i];
      return o < w ? y + 0.02 : o < w + 0.45 ? y + 0.012 - 0.032 * (o - w) / 0.45 : y - 0.02; };
    for (let i = 0; i < N; i += Math.max(1, Math.round(3 / ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), a = (R() - 0.5) * 2.4;
      const at = (o) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
      const ok = (x, z) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * ds < 6 && q.lat * sd > 0 && !ex(x, z) && !(gT(x, z) < T.hy[i] - 3) && !wet(x, z); };
      if (r0 < K.rim) { const [x, z] = at(w - 0.12 - r1 * 0.1);
        if (ok(x, z)) { streak(soft, rY, x, z, T.tx[i], T.tz[i], 0.7 + R() * 1.6, 0.1 + R() * 0.1, C_(R, K.worn), R, 0.01); st.rob++; } }
      if (r2 < K.grit) { const [x, z] = at(w + 0.05 + R() * 0.3);
        if (ok(x, z)) { streak(soft, rY, x, z, T.tx[i], T.tz[i], 0.6 + R() * 1.4, 0.16 + R() * 0.2, C_(R, K.stone, 0.02), R, 0.012); st.gramoz++; } }
    }
    soft.done();
    return st;
  };

  /* past the barrier line on both sides, every C.step m: C.n places from C.from to C.to m past it (the forty-sixth group's walk), only
     where this leg's road is the nearest, not in the excluded places, the water, far below the road (C.drop) nor steeper than C.maxSl */
  const outer = (ctx, seed, C, st) => {
    const T = API.T, near = API.vrNear, lc = API.vrLC, gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    if (!T || !T.br || !near || !gT) return st;
    const wet = API.vrWater ? (x, z) => { const q = API.vrWater(x, z); return q && q.e > -4; } : () => false;
    const R = rng(seed), soft = softScen(ctx.root, ctx.matV), N = T.px.length;
    const slope = (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) for (let k = 0; k < C.n; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + Math.pow(r1, C.pw || 1) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0) continue;
      if (ex(x, z) || wet(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop)) continue;
      const sl = slope(x, z); if (sl > C.maxSl) continue;
      const c = lc ? lc(x, z) : 0; if (c === 3 || c === 5) continue;
      const kk = C.put(soft, gT, x, y, z, o - bar, R, c, sl, i); if (kk) st[kk] = (st[kk] || 0) + 1;
    }
    soft.done();
    return st;
  };
  const rock = (c) => c === 4 || c === 7;

  /* ---- Furka: the Aar massif's light grey granite, the pasture's green and straw ---- */
  const FK = {
    worn: [[0.5, 0.5, 0.49], [0.55, 0.55, 0.53]], stone: [[0.6, 0.6, 0.57], [0.66, 0.65, 0.61]],
    green: [[0.41, 0.5, 0.25], [0.37, 0.47, 0.22]], straw: [[0.56, 0.55, 0.34], [0.6, 0.58, 0.37]], scree: [[0.62, 0.62, 0.59], [0.67, 0.66, 0.62]],
    tuft: [[0.56, 0.55, 0.34], [0.43, 0.51, 0.26]], rose: [[0.22, 0.3, 0.17], [0.28, 0.32, 0.2]], boulder: [[0.6, 0.6, 0.58], [0.68, 0.67, 0.64]],
  };
  const furka = (ctx) => {
    const T = API.T; if (!ctx.out || !ctx.root || !ctx.matV || !T || (T.def && T.def.id !== 'furka')) return;
    ctx.out.robBt70 = edge(ctx, 70101, { rim: 0.3, grit: 0.35, worn: FK.worn, stone: FK.stone });
    // past the twenty-sixth group's bank (~7 m) out to ~60 m: wide low patches and, on them, what stands on an alpine pasture
    ctx.out.pasBt70 = outer(ctx, 70102, { step: 5, n: 2, share: 0.6, from: 8, to: 60, pw: 1.1, drop: 16, maxSl: 1.3,
      put: (soft, g, x, y, z, o, R, c, sl) => { const u = R(), k = 1 + 0.6 * Math.min(1, (o - 8) / 52);
        if (u < 0.55) { const v = R(), stony = rock(c) || sl > 0.9;
          const col = stony && v < 0.7 ? C_(R, FK.scree) : v < 0.55 ? C_(R, FK.green) : C_(R, FK.straw);
          soil(soft, g, x, z, (1.2 + R() * 1.4) * k, col, R, 0.06); return 'zaplate'; }
        const h = R();
        if (u < 0.72 || (rock(c) && u < 0.85)) { cushion(soft.get(x, z), x, y + 0.05, z, (0.35 + h * 0.6) * k, 0.25 + h * 0.35, C_(R, FK.boulder, 0.02), R); return 'skale'; }
        if (u < 0.86 && sl < 0.8) { cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.6) * k, 0.25 + h * 0.2, C_(R, FK.rose, 0.025), R); return 'grmi'; }
        tuft(soft.get(x, z), x, y, z, (0.35 + h * 0.3) * k, 0.3 + h * 0.3, C_(R, FK.tuft, 0.03), R, 5); return 'sopi'; } }, {});
  };

  /* ---- Izoard: pale and ochre limestone and dolomite, the dry pasture's gold, the larch wood ---- */
  const IZ = {
    worn: [[0.52, 0.51, 0.48], [0.57, 0.56, 0.52]], stone: [[0.64, 0.62, 0.57], [0.69, 0.66, 0.6]],
    gold: [[0.62, 0.57, 0.37], [0.7, 0.63, 0.41]], juniper: [[0.22, 0.3, 0.18], [0.27, 0.33, 0.21]], scree: [[0.7, 0.67, 0.6], [0.66, 0.6, 0.49]],
    tuftW: [[0.4, 0.46, 0.24], [0.48, 0.5, 0.28]], needle: [[0.5, 0.39, 0.26], [0.55, 0.42, 0.28]],
  };
  const izoard = (ctx) => {
    const T = API.T; if (!ctx.out || !ctx.root || !ctx.matV || !T || (T.def && T.def.id !== 'izoard')) return;
    const gT = API.caGround || API.vrGround;
    ctx.out.robBt70 = edge(ctx, 70201, { rim: 0.3, grit: 0.35, worn: IZ.worn, stone: IZ.stone });
    // past the seventh group's band (~22 m) out to ~60 m: on the forty-sixth group's flat patches what stands there
    ctx.out.pasBt70 = outer(ctx, 70202, { step: 5, n: 2, share: 0.6, from: 22, to: 60, drop: 16, maxSl: 1.3,
      put: (soft, g, x, y, z, o, R, c, sl, i) => { const u = R(), h = R(), k = 1 + 0.5 * Math.min(1, (o - 22) / 38);
        if (rock(c) || sl > 1.0) {   // the scree lies in streaks down the slope
          const d = 0.8, ax = gT(x + d, z) - gT(x - d, z), az = gT(x, z + d) - gT(x, z - d), m = Math.hypot(ax, az);
          const [dx, dz] = m > 1e-3 ? [ax / m, az / m] : [T.nx[i], T.nz[i]];
          streak(soft, g, x, z, dx, dz, (3 + R() * 4) * k, (0.8 + R() * 0.9) * k, C_(R, IZ.scree), R, 0.05); return 'melisca'; }
        if (c === 1) {   // under the larches: needle litter and green tufts
          if (u < 0.45) { soil(soft, g, x, z, (0.9 + R() * 1.0) * k, C_(R, IZ.needle), R, 0.05); return 'iglice'; }
          tuft(soft.get(x, z), x, y, z, (0.3 + h * 0.3) * k, 0.3 + h * 0.3, C_(R, IZ.tuftW, 0.03), R, 5); return 'sopi'; }
        if (u < 0.3 && sl < 0.8) { cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.7) * k, 0.3 + h * 0.3, C_(R, IZ.juniper, 0.025), R); return 'brin'; }
        tuft(soft.get(x, z), x, y, z, (0.35 + h * 0.35) * k, 0.3 + h * 0.35, C_(R, IZ.gold, 0.03), R, 5); return 'sopi'; } }, {});
  };

  if (LK.furka) chain(LK.furka, (ctx) => { try { furka(ctx); } catch (e) { console.error('chase-bt70 (furka):', e); } });
  if (LK.izoard) chain(LK.izoard, (ctx) => { try { izoard(ctx); } catch (e) { console.error('chase-bt70 (izoard):', e); } });
})();
