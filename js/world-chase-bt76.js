/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventy-sixth group of the real tracks: Isuna and Portobelo,
   a third pass on the two roads whose verge and bank the eleventh and forty-second groups (js/world-chase-bt11.js,
   js/world-chase-bt42.js: Isuna's verge, bank to ~10 m and a sparse band to ~55 m) and the twenty-third and forty-third
   (js/world-chase-bt23.js, js/world-chase-bt43.js: Portobelo's strip, bank to ~8 m and a sparse band to ~55 m) already set. From behind
   the car both still showed the asphalt's edge as one clean line and, past the near bands, one smooth face out to ~60 m. So here, as the
   seventy-fifth group did (js/world-chase-bt75.js; its streak, edge and outer walks are copied, that branch is not on the collecting
   one yet): the asphalt's edge in short streaks and the shoulder's grit; past the near bands out to ~60 m wide low patches and what
   stands on them. Isuna (docs/proge/isuna.md: by the Paro Chhu, under the blue pine forest, firs and pines on the slopes, cows): the
   valley's grey dust and gravel on the edge and shoulder; the grazed grass green and sun-dried, the grey earth, the blue pines' rust
   needles under the forest, wormwood's grey-green cushions and low shrubs, grey rocks where the slope is steep; nothing in or by the
   river's bed. Portobelo (docs/proge/portobelo.md: the rainforest's dark crowns over green ground, the wet tropics, the concrete
   barriers): the wet brown earth and the grey grit on the edge; the lush and lime grass, the red-brown clay, the fallen leaves and ferns
   under the forest, broad-leaved green clumps; nothing by the sea, at the fort, in its glade or on built ground. Nothing where another
   leg's road is nearer, far below the road or on the steep. All in meshes of their own (softScen: 256 m chunks, no shadow); the
   terrain, the road, the barriers, the trees, the horizon and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.softScen || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, cushion, softScen, mix3 } = BT;
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const C_ = (R, ab, j) => mute(vary(mix3(ab[0], ab[1], R()), R, j || 0.015));

  /* a thin low streak lying on the ground along (ax, az), tapering to both ends (the seventieth group's) */
  const streak = (scen, gH, x, z, ax, az, len, wid, col, R, lift, seg) => {
    const g = scen.get(x, z), bx = -az, bz = ax, n = seg || 4, up = lift || 0.04, rim = [col[0] * 0.92 + 0.04, col[1] * 0.92 + 0.05, col[2] * 0.92 + 0.03], L = [], P = [], C = [];
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

  /* E: the track's own nearest road point (near), ground (gT), road cross-section (rY), land cover (lc), the places to leave out (bad, wet).
     The asphalt's edge and the shoulder: every ~3 m on each side by chance a short streak just inside the edge (K.rim, K.worn) and one on
     the shoulder (K.grit, K.stone); only where this leg's road is the nearest. */
  const edge = (ctx, E, seed, K) => {
    const T = API.T, st = { rob: 0, gramoz: 0 }, { near, gT, rY, bad, wet } = E;
    if (!T || !T.br || !near || !gT) return st;
    const N = T.px.length, ds = T.ds, R = rng(seed), soft = softScen(ctx.root, ctx.matV);
    for (let i = 0; i < N; i += Math.max(1, Math.round((K.step || 3) / ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), a = (R() - 0.5) * 2.4, w = T.wAt ? T.wAt(i) : T.w;
      const at = (o) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
      const ok = (x, z) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * ds < 6 && q.lat * sd > 0 && !bad(x, z) && !(gT(x, z) < T.hy[i] - 3) && !wet(x, z); };
      if (r0 < K.rim) { const [x, z] = at(w - 0.12 - r1 * 0.12);
        if (ok(x, z)) { streak(soft, rY, x, z, T.tx[i], T.tz[i], 0.8 + R() * 1.8, 0.1 + R() * 0.12, C_(R, K.worn), R, 0.01, K.seg); st.rob++; } }
      if (r2 < K.grit) { const [x, z] = at(w + 0.05 + R() * K.sh);
        if (ok(x, z)) { streak(soft, rY, x, z, T.tx[i], T.tz[i], 0.6 + R() * 1.4, 0.18 + R() * 0.22, C_(R, K.stone, 0.02), R, 0.012, K.seg); st.gramoz++; } }
    }
    soft.done();
    return st;
  };

  /* past the barrier line on both sides, every C.step m: C.n places from C.from to C.to m past it, only where this leg's road is the
     nearest, not in the excluded places, the water, far below the road (C.drop) nor steeper than C.maxSl, not on built ground or water */
  const outer = (ctx, E, seed, C, st) => {
    const T = API.T, { near, gT, lc, bad, wet } = E;
    if (!T || !T.br || !near || !gT) return st;
    const R = rng(seed), soft = softScen(ctx.root, ctx.matV), N = T.px.length;
    const slope = E.slope || ((x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); });
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) for (let k = 0; k < C.n; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + Math.pow(r1, C.pw || 1) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0) continue;
      if (bad(x, z) || wet(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop)) continue;
      const sl = slope(x, z); if (sl > C.maxSl) continue;
      const c = lc ? lc(x, z) : 0; if (c === 3 || c === 5) continue;
      const kk = C.put(soft, gT, x, y, z, o - bar, R, c, sl); if (kk) st[kk] = (st[kk] || 0) + 1;
    }
    soft.done();
    return st;
  };
  const rock = (c) => c === 4 || c === 7;

  /* ---- Isuna (js/world-isuna.js: goreRob(ctx, 'isuna') with no o, on Vršič's corridor's API; the shoulder ~0.6 m) ---- */
  const IS = {
    worn: [[0.5, 0.48, 0.42], [0.55, 0.52, 0.46]], stone: [[0.52, 0.5, 0.45], [0.58, 0.55, 0.5]],   // (the valley's grey dust, the gravel)
    gr: [[0.35, 0.44, 0.17], [0.39, 0.47, 0.19]], dry: [[0.52, 0.5, 0.3], [0.56, 0.53, 0.33]], earth: [[0.44, 0.42, 0.33], [0.48, 0.45, 0.36]],
    needle: [[0.46, 0.34, 0.2], [0.5, 0.37, 0.22]], tuft: [[0.38, 0.48, 0.22], [0.5, 0.54, 0.3]], worm: [[0.5, 0.54, 0.42], [0.54, 0.57, 0.45]],
    bush: [[0.24, 0.36, 0.17], [0.29, 0.4, 0.2]], rock: [[0.46, 0.45, 0.42], [0.52, 0.5, 0.47]],
  };
  const riverTest = (def) => {   // (the river beds of the track's def in 16 m cells, as js/world-chase-bt42.js keeps them free)
    const cells = new Map(), G = 16;
    for (const a of (def && def.riverBeds) || []) { const hw = a[0] / 2;
      for (let k = 1; k + 1 < a.length; k += 2) { const x = a[k], z = a[k + 1], i = Math.floor(x / G), j = Math.floor(z / G);
        for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) { const key = (i + u) + ',' + (j + v); let L = cells.get(key); if (!L) cells.set(key, L = []); L.push(x, z, hw); } } }
    if (!cells.size) return null;
    return (x, z, m) => { const L = cells.get(Math.floor(x / G) + ',' + Math.floor(z / G)); if (!L) return false;
      for (let k = 0; k < L.length; k += 3) { const dx = x - L[k], dz = z - L[k + 1], r = L[k + 2] + m; if (dx * dx + dz * dz < r * r) return true; } return false; };
  };
  const isuna = (ctx) => {
    const T = API.T; if (!ctx.out || !ctx.root || !ctx.out.matV || !T || !T.br) return;
    const near = API.vrNear, gT = API.vrGround; if (!near || !gT) return;
    const ex = ctx.excluded || (() => false), riv = riverTest(T.def), wat = API.vrWater;
    const bad = (x, z) => ex(x, z) || (!!riv && riv(x, z, 6));
    const wet = (x, z) => { if (!wat) return false; const q = wat(x, z); return !!q && q.e > -3; };
    const sw = 0.6, rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const w = T.wAt ? T.wAt(q.i) : T.w, o = Math.abs(q.lat), y = T.hy[q.i];
      return o < w ? y + 0.02 : o < w + sw ? y + 0.012 - 0.032 * (o - w) / sw : Math.max(gT(x, z), y - 0.02); };
    const m = { root: ctx.root, matV: ctx.out.matV }, E = { near, gT, rY, lc: API.vrLC, bad, wet, slope: API.vrSlope };
    ctx.out.robBt76 = edge(m, E, 76101, { step: 3.5, seg: 3, rim: 0.5, grit: 0.6, sh: 0.6, worn: IS.worn, stone: IS.stone });
    // past the forty-second group's bank (~10 m) out to ~60 m
    ctx.out.pasBt76 = outer(m, E, 76102, { step: 4.2, n: 3, share: 0.7, from: 10, to: 60, pw: 1.1, drop: 12, maxSl: 1.35,
      put: (soft, g, x, y, z, o, R, c, sl) => { const u = R(), h = R(), k = 1 + 0.6 * Math.min(1, (o - 10) / 50);
        if (rock(c) || sl > 0.95) {   // where the slope's rock comes out: grey blocks, the grey earth between
          if (u < 0.5) { cushion(soft.get(x, z), x, y + 0.04, z, (0.35 + h * 0.55) * k, 0.25 + h * 0.35, C_(R, IS.rock, 0.02), R); return 'kamni'; }
          soil(soft, g, x, z, (1.0 + R() * 1.2) * k, C_(R, IS.earth), R, 0.05); return 'zaplate'; }
        if (c === 1) {   // under the blue pines and firs: the needle litter, a little grass, low shrubs
          if (u < 0.6) { soil(soft, g, x, z, (1.4 + R() * 1.6) * k, C_(R, R() < 0.75 ? IS.needle : IS.gr), R, 0.05); return 'iglice'; }
          if (u < 0.8) { cushion(soft.get(x, z), x, y, z, (0.5 + h * 0.55) * k, 0.35 + h * 0.4, C_(R, IS.bush, 0.025), R); return 'grmi'; }
          tuft(soft.get(x, z), x, y, z, (0.35 + h * 0.3) * k, 0.3 + h * 0.3, C_(R, IS.tuft, 0.03), R, 5); return 'sopi'; }
        if (u < 0.62) { const v = R(), col = v < 0.5 ? C_(R, IS.gr) : v < 0.8 ? C_(R, IS.dry) : C_(R, IS.earth);   // the grazed valley floor
          soil(soft, g, x, z, (1.8 + R() * 2.0) * k, col, R, 0.06); return 'zaplate'; }
        if (u < 0.78 && sl < 0.8) { cushion(soft.get(x, z), x, y, z, (0.3 + h * 0.35) * k, 0.2 + h * 0.2, C_(R, IS.worm, 0.02), R); return 'pelin'; }
        if (u < 0.86 && sl < 0.9) { cushion(soft.get(x, z), x, y, z, (0.5 + h * 0.55) * k, 0.35 + h * 0.4, C_(R, IS.bush, 0.025), R); return 'grmi'; }
        tuft(soft.get(x, z), x, y, z, (0.35 + h * 0.3) * k, 0.35 + h * 0.35, C_(R, IS.tuft, 0.03), R, 5); return 'sopi'; } }, {});
  };

  /* ---- Portobelo (js/world-chase-bt23.js: goreRob(ctx, 'portobelo', o) from portobeloRob, o.near / gH / slope / lc / bad: the builder's
     nearest road point, ground, slope and land cover, the sea's edge, the fort and its glade; the verge drawn as vergeRow: -0.04 m at
     0.8 m past the asphalt) ---- */
  const PB = {
    worn: [[0.44, 0.36, 0.27], [0.49, 0.4, 0.3]], stone: [[0.5, 0.48, 0.44], [0.56, 0.53, 0.48]],   // (the wet earth washed on the edge, the grey grit)
    gr: [[0.3, 0.45, 0.2], [0.34, 0.49, 0.22]], lime: [[0.39, 0.51, 0.24], [0.43, 0.54, 0.26]], clay: [[0.5, 0.36, 0.26], [0.55, 0.4, 0.29]],
    leaf: [[0.48, 0.37, 0.24], [0.53, 0.41, 0.27]], fern: [[0.22, 0.42, 0.16], [0.27, 0.47, 0.19]], tall: [[0.3, 0.48, 0.19], [0.4, 0.55, 0.23]],
    bush: [[0.19, 0.36, 0.15], [0.24, 0.41, 0.17]], rock: [[0.4, 0.38, 0.35], [0.45, 0.43, 0.4]],
  };
  const portobelo = (ctx, o) => {
    const T = API.T, out = ctx.out; if (!out || !out.matV || !ctx.root || !T || !T.br || !o || !o.near || !o.gH) return;
    const near = o.near, gT = o.gH, lc = o.lc, ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || (o.bad ? o.bad(x, z) : false);
    const rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const w = T.wAt ? T.wAt(q.i) : T.w, a = Math.abs(q.lat), y = T.hy[q.i];
      return a < w ? y + 0.02 : a < w + 0.8 ? y + 0.012 - 0.04 * (a - w) / 0.8 : Math.max(gT(x, z), y - 0.03); };
    const E = { near, gT, rY, lc, bad, wet: (x, z) => (lc ? lc(x, z) === 5 : false), slope: o.slope };
    const m = { root: ctx.root, matV: out.matV };
    out.robBt76 = edge(m, E, 76201, { step: 3.5, seg: 3, rim: 0.5, grit: 0.55, sh: 0.6, worn: PB.worn, stone: PB.stone });
    // past the barrier (~3 m: the forty-third group's bank is thin) out to ~60 m
    out.pasBt76 = outer(m, E, 76202, { step: 4.0, n: 3, share: 0.7, from: 3, to: 60, pw: 1.2, drop: 12, maxSl: 1.3,
      put: (soft, g, x, y, z, d, R, c, sl) => { const u = R(), h = R(), k = 1 + 0.6 * Math.min(1, (d - 3) / 57);
        if (c === 1) {   // the rainforest's floor: the fallen leaves, the red-brown clay, ferns, the broad-leaved undergrowth
          if (u < 0.5) { soil(soft, g, x, z, (1.2 + R() * 1.5) * k, C_(R, R() < 0.7 ? PB.leaf : PB.clay), R, 0.05); return 'listje'; }
          if (u < 0.78) { tuft(soft.get(x, z), x, y, z, (0.45 + h * 0.4) * k, 0.35 + h * 0.35, C_(R, PB.fern, 0.03), R, 6); return 'praprot'; }
          cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.7) * k, 0.45 + h * 0.45, C_(R, PB.bush, 0.025), R); return 'grmi'; }
        if (rock(c) && u < 0.4) { cushion(soft.get(x, z), x, y + 0.04, z, (0.3 + h * 0.4) * k, 0.2 + h * 0.3, C_(R, PB.rock, 0.02), R); return 'kamni'; }
        if (u < 0.6) { const v = R(), col = v < 0.48 ? C_(R, PB.gr) : v < 0.8 ? C_(R, PB.lime) : C_(R, sl > 0.8 ? PB.clay : PB.leaf);
          soil(soft, g, x, z, (1.6 + R() * 1.8) * k, col, R, 0.06); return 'zaplate'; }
        if (u < 0.78 && sl < 0.9) { cushion(soft.get(x, z), x, y, z, (0.55 + h * 0.6) * k, 0.4 + h * 0.4, C_(R, PB.bush, 0.025), R); return 'grmi'; }
        tuft(soft.get(x, z), x, y, z, (0.4 + h * 0.35) * k, 0.45 + h * 0.4, C_(R, PB.tall, 0.03), R, 5); return 'sopi'; } }, {});
  };

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'isuna') try { isuna(ctx); } catch (e) { console.error('chase-bt76 (isuna):', e); }
      if (id === 'portobelo' && o) try { portobelo(ctx, o); } catch (e) { console.error('chase-bt76 (portobelo):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
