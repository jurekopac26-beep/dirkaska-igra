/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventy-fifth group of the real tracks: Ujarrás and Rio do
   Rastro, a third pass on the two roads whose verge and bank the eleventh and thirty-fourth groups (js/world-chase-bt11.js,
   js/world-chase-bt34.js: Ujarrás to ~8 m past the barrier line) and the fifteenth and thirty-second (js/world-chase-bt15.js,
   js/world-chase-bt32.js: Rio do Rastro to ~10 m) already set. From behind the car both still showed the asphalt's edge as one clean line
   and, past those bands, one smooth face of the land cover's colour out to ~60 m. So here, as the seventy-second group did
   (js/world-chase-bt72.js): the asphalt's edge in short streaks and the shoulder's grit; past the earlier bands out to ~60 m wide low
   patches and what stands on them. Ujarrás (docs/proge/ujarras.md: the wet broadleaf forest, the grass by the road, the dark volcanic
   earth): the dark earth washed onto the edge, the grass green and sun-dried, the leaf litter and ferns under the forest, the
   undergrowth's clumps, tall grass tufts; nothing round the lookout. Rio do Rastro (docs/proge/rastro.md: the Atlantic forest, the basalt
   over the sandstone, the plateau's grassland): the red earth on the edge, the basalt grit on the shoulder, the forest's litter, ferns
   and shrubs, the lush grass low and the plateau's straw high, the basalt and the pink sandstone's blocks where the rock comes out.
   Nothing on built ground (3), in the water (5), where another leg's road is nearer (the switchbacks' legs 12–15 m apart), far below the
   road or on the steep, in the builders' excluded places. All in meshes of their own (softScen: 256 m chunks, no shadow); the terrain,
   the road, the barriers, the trees, the horizon and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API, LK = API.PL_LOOK;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.softScen || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, cushion, softScen, mix3, chain } = BT;
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

  /* ---- Ujarrás (js/world-gore.js: goreRob called with no o, on Vršič's corridor's API; the shoulder 0.6 m) ---- */
  const UJ = {
    worn: [[0.36, 0.29, 0.22], [0.41, 0.33, 0.25]], stone: [[0.4, 0.33, 0.26], [0.46, 0.38, 0.3]],   // (the dark earth on the edge, the washed grit on the shoulder)
    gr: [[0.34, 0.49, 0.19], [0.4, 0.53, 0.22]], grY: [[0.46, 0.5, 0.26], [0.5, 0.52, 0.28]], earth: [[0.34, 0.26, 0.19], [0.39, 0.3, 0.22]],
    leaf: [[0.4, 0.31, 0.2], [0.45, 0.35, 0.23]], fern: [[0.22, 0.41, 0.15], [0.27, 0.46, 0.18]], tall: [[0.34, 0.5, 0.18], [0.44, 0.55, 0.23]],
    bush: [[0.17, 0.33, 0.13], [0.21, 0.37, 0.15]], basalt: [[0.33, 0.31, 0.29], [0.38, 0.35, 0.32]],
  };
  const ujarras = (ctx) => {
    const T = API.T; if (!ctx.out || !ctx.root || !ctx.out.matV || !T || !T.br) return;
    const near = API.vrNear, gT = API.vrGround; if (!near || !gT) return;
    const ex = ctx.excluded || (() => false), look = ctx.out.ujarras && ctx.out.ujarras.lookout;
    const bad = (x, z) => ex(x, z) || (!!look && Math.hypot(x - look.x, z - look.z) < 16);
    const wet = API.vrWater ? (x, z) => { const q = API.vrWater(x, z); return q && q.e > -4; } : () => false;
    const sw = 0.6, rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const w = T.wAt ? T.wAt(q.i) : T.w, o = Math.abs(q.lat), y = T.hy[q.i];
      return o < w ? y + 0.02 : o < w + sw ? y + 0.012 - 0.032 * (o - w) / sw : Math.max(gT(x, z), y - 0.02); };
    const m = { root: ctx.root, matV: ctx.out.matV }, E = { near, gT, rY, lc: API.vrLC, bad, wet, slope: API.vrSlope };
    ctx.out.robBt75 = edge(m, E, 75101, { step: 3.5, seg: 3, rim: 0.5, grit: 0.6, sh: 0.7, worn: UJ.worn, stone: UJ.stone });
    // past the thirty-fourth group's bank (~8 m) out to ~60 m
    ctx.out.pasBt75 = outer(m, E, 75102, { step: 4.0, n: 3, share: 0.7, from: 8, to: 60, pw: 1.1, drop: 14, maxSl: 1.35,
      put: (soft, g, x, y, z, o, R, c, sl) => { const u = R(), h = R(), k = 1 + 0.6 * Math.min(1, (o - 8) / 52);
        if (c === 1) {   // under the forest: the leaf litter, the ferns, the undergrowth
          if (u < 0.45) { soil(soft, g, x, z, (1.0 + R() * 1.2) * k, C_(R, R() < 0.7 ? UJ.leaf : UJ.earth), R, 0.05); return 'listje'; }
          if (u < 0.75) { tuft(soft.get(x, z), x, y, z, (0.4 + h * 0.35) * k, 0.35 + h * 0.3, C_(R, UJ.fern, 0.03), R, 6); return 'praprot'; }
          cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.6) * k, 0.4 + h * 0.4, C_(R, UJ.bush, 0.025), R); return 'grmi'; }
        if (u < 0.55) { const v = R();
          const col = (sl > 0.9 || rock(c)) && v < 0.6 ? C_(R, UJ.earth) : v < 0.5 ? C_(R, UJ.gr) : v < 0.82 ? C_(R, UJ.grY) : C_(R, UJ.earth);
          soil(soft, g, x, z, (1.8 + R() * 2.0) * k, col, R, 0.06); return 'zaplate'; }
        if (rock(c) && u < 0.8) { cushion(soft.get(x, z), x, y + 0.04, z, (0.3 + h * 0.45) * k, 0.22 + h * 0.3, C_(R, UJ.basalt, 0.02), R); return 'kamni'; }
        if (u < 0.72 && sl < 0.9) { cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.7) * k, 0.4 + h * 0.4, C_(R, UJ.bush, 0.025), R); return 'grmi'; }
        tuft(soft.get(x, z), x, y, z, (0.4 + h * 0.35) * k, 0.45 + h * 0.4, C_(R, UJ.tall, 0.03), R, 5); return 'sopi'; } }, {});
  };

  /* ---- Rio do Rastro (js/world-rastro.js: goreRob with its own near, ground, slope and land cover; the shoulder 0.5 m) ---- */
  const RR = {
    worn: [[0.52, 0.34, 0.25], [0.57, 0.38, 0.28]], stone: [[0.44, 0.43, 0.41], [0.49, 0.47, 0.45]],   // (the red earth on the edge, the basalt grit)
    lush: [[0.29, 0.44, 0.17], [0.34, 0.48, 0.2]], straw: [[0.58, 0.55, 0.32], [0.63, 0.59, 0.35]], red: [[0.54, 0.33, 0.23], [0.59, 0.37, 0.26]],
    litter: [[0.38, 0.28, 0.19], [0.43, 0.32, 0.22]], fern: [[0.22, 0.4, 0.15], [0.27, 0.45, 0.18]], moss: [[0.23, 0.31, 0.15], [0.27, 0.35, 0.18]],
    tuft: [[0.3, 0.46, 0.17], [0.42, 0.51, 0.24]], tuftH: [[0.6, 0.56, 0.33], [0.66, 0.6, 0.36]], bush: [[0.17, 0.32, 0.13], [0.22, 0.37, 0.15]],
    basalt: [[0.34, 0.33, 0.32], [0.4, 0.39, 0.37]], sand: [[0.64, 0.5, 0.44], [0.68, 0.54, 0.47]],
  };
  const rastro = (ctx, o) => {
    const T = API.T, out = ctx.out; if (!out || !out.matV || !ctx.root || !T || !T.br || !o || !o.near || !o.gH) return;
    const near = o.near, gT = o.gH, ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || (o.bad ? o.bad(x, z) : false), lc = o.lc;
    const base = API.VR && API.VR.D ? API.VR.D.base : 0, N = T.hy.length, alt = (i) => T.hy[Math.max(0, Math.min(N - 1, i))] + base;
    const sw = 0.5, rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const w = T.wAt ? T.wAt(q.i) : T.w, a = Math.abs(q.lat), y = T.hy[q.i];
      return a < w ? y + 0.02 : a < w + sw ? y + 0.012 - 0.032 * (a - w) / sw : Math.max(gT(x, z), y - 0.02); };
    const E = { near, gT, rY, lc, bad, wet: (x, z) => (lc ? lc(x, z) === 5 : false), slope: o.slope };
    const m = { root: ctx.root, matV: out.matV };
    out.robBt75 = edge(m, E, 75201, { step: 5, seg: 2, rim: 0.5, grit: 0.55, sh: 0.45, worn: RR.worn, stone: RR.stone });
    // past the thirty-second group's face (~10 m) out to ~60 m
    out.pasBt75 = outer(m, E, 75202, { step: 4.8, n: 3, share: 0.6, from: 10, to: 60, pw: 1.15, drop: 16, maxSl: 1.4,
      put: (soft, g, x, y, z, d, R, c, sl) => { const u = R(), h = R(), k = 1 + 0.6 * Math.min(1, (d - 10) / 50), q = near(x, z), hi = alt(q.i) > 1360;
        if (rock(c) || sl > 0.95) {   // where the rock comes out: the basalt above, the pink sandstone below, moss between
          if (u < 0.5) { cushion(soft.get(x, z), x, y + 0.05, z, (0.35 + h * 0.6) * k, 0.25 + h * 0.35, C_(R, alt(q.i) > 1150 ? RR.basalt : RR.sand, 0.02), R); return 'bloki'; }
          soil(soft, g, x, z, (0.9 + R() * 1.1) * k, C_(R, u < 0.75 ? RR.moss : RR.red), R, 0.05); return 'mah'; }
        if (c === 1) {   // the forest's floor: the litter, the ferns, the shrubs at its edge
          if (u < 0.6) { soil(soft, g, x, z, (1.4 + R() * 1.6) * k, C_(R, R() < 0.7 ? RR.litter : RR.red), R, 0.05); return 'listje'; }
          if (u < 0.82) { tuft(soft.get(x, z), x, y, z, (0.4 + h * 0.4) * k, 0.35 + h * 0.35, C_(R, RR.fern, 0.03), R, 6); return 'praprot'; }
          cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.6) * k, 0.4 + h * 0.45, C_(R, RR.bush, 0.025), R); return 'grmi'; }
        if (u < 0.72) { const v = R(), col = v < 0.62 ? C_(R, hi ? RR.straw : RR.lush) : v < 0.85 ? C_(R, hi ? RR.lush : RR.red) : C_(R, RR.red);
          soil(soft, g, x, z, (1.8 + R() * 2.0) * k, col, R, 0.06); return 'zaplate'; }
        if (u < 0.82 && (c === 2 || !hi) && sl < 0.9) { cushion(soft.get(x, z), x, y, z, (0.55 + h * 0.6) * k, 0.35 + h * 0.4, C_(R, RR.bush, 0.025), R); return 'grmi'; }
        tuft(soft.get(x, z), x, y, z, (0.35 + h * 0.35) * k, 0.4 + h * 0.4, C_(R, hi ? RR.tuftH : RR.tuft, 0.03), R, 5); return 'sopi'; } }, {});
  };

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'ujarras') try { ujarras(ctx); } catch (e) { console.error('chase-bt75 (ujarras):', e); }
      if (id === 'rastro' && o) try { rastro(ctx, o); } catch (e) { console.error('chase-bt75 (rastro):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
