/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighty-sixth group of the real tracks: Katu-Yaryk and Tianmen, a
   further pass on the two roads whose verge and bands the earlier groups set (Katu: js/world-chase-bt14.js, js/world-chase-bt31.js,
   js/world-chase-bt61.js; Tianmen: js/world-chase-bt13.js, js/world-chase-bt24.js, js/world-chase-bt51.js). From behind the car both still
   showed the road's edge as one clean line and, past the barrier, nothing standing out of the low cover:
   - Katu (docs/proge/katu.md: »makadam iz zdrobljenega rjavega skrilavca z dvema kolesnicama«, »sončna pobočja so suha stepa z grmi
     karagane in brinom, strma pobočja so skalnata (rjavo siv skrilavec)«): at the gravel's edge the loose gravel the cars push out into low
     paler windrows (more on the outside of the bends), darker fresh chips between them; on the shoulder the schist's flakes and the pale
     dust, a few fallen stones; past the far band's start out to ~55 m the caragana's and juniper's low bushes and the schist's blocks.
   - Tianmen (docs/proge/tianmen.md: »asfaltna (bele robne črte)«, »gost subtropski gozd«, »skale ob cesti«, the limestone grey »z rjastimi
     in temnimi progami, kjer teče voda«): between the white edge line and the asphalt's edge the wet road's dark grime, moss and the
     forest's fallen leaves in thin streaks, on the grit shoulder the darker wet grit and leaves; past the barrier out to ~40 m the
     limestone's boulders in grey, rusty and dark-streaked tones, with moss at their foot, also on the steeper ground the bands leave bare.
   Nothing on another leg's road, on a bridge or high fill (ground more than 3 m below the road), in the builders' excluded places, Katu's
   camps (3) and the water (5, the river). All of it in one set of meshes per track (softScen: 256 m chunks, no shadow); the terrain, the
   road, the barriers, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.cushion || !BT.softScen || !BT.mix3 || !rng || !vary) return;
  const { soil, cushion, softScen, mix3 } = BT;
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const C_ = (R, ab, j) => mute(vary(mix3(ab[0], ab[1], R()), R, j || 0.015));

  /* a thin low streak lying on the surface along (ax, az), tapering to both ends (the seventy-second group's, three segments) */
  const streak = (scen, gH, x, z, ax, az, len, wid, col, R, lift) => {
    const g = scen.get(x, z), bx = -az, bz = ax, n = 3, up = lift || 0.04, rim = [col[0] * 0.92 + 0.04, col[1] * 0.92 + 0.05, col[2] * 0.92 + 0.03], L = [], P = [], C = [];
    for (let k = 0; k <= n; k++) {
      const u = (k / n - 0.5) * len, t = Math.sin(Math.PI * k / n), hw = wid * 0.5 * (0.2 + 0.8 * t) * (0.8 + R() * 0.4), j = (R() - 0.5) * wid * 0.3;
      const cx = x + ax * u + bx * j, cz = z + az * u + bz * j;
      L.push([cx + bx * hw, gH(cx + bx * hw, cz + bz * hw) + up, cz + bz * hw]); P.push([cx - bx * hw, gH(cx - bx * hw, cz - bz * hw) + up, cz - bz * hw]); C.push([cx, gH(cx, cz) + up + 0.006 + (t > 0.5 ? up * 0.5 : 0), cz]);
    }
    for (let k = 0; k < n; k++) {
      const inn = [C[k][0], C[k][1] - 5, C[k][2]];
      g.triO(C[k], L[k], L[k + 1], col, inn, rim, rim); g.triO(C[k], L[k + 1], C[k + 1], col, inn, rim, col);
      g.triO(C[k], P[k + 1], P[k], col, inn, rim, rim); g.triO(C[k], C[k + 1], P[k + 1], col, inn, col, rim);
    }
  };

  /* the road's edge and the shoulder: every K.step m on each side by chance a streak on the road just inside its edge (from K.in0 to K.in1
     m inside it, K.rim; on the outside of a bend K.outer more) and one on the shoulder (K.sh0 to K.sh1 m past the edge, K.grit), now and
     then a small stone on the shoulder (K.stone); only where this leg's road is the nearest and on the ground */
  const edge = (soft, E, seed, K) => {
    const T = API.T, st = { rob: 0, bankina: 0, kamni: 0 }, { near, gT, rY, bad } = E, R = rng(seed), N = T.px.length, ds = T.ds;
    for (let i = 0; i < N; i += Math.max(1, Math.round(K.step / ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), r3 = R(), a = (R() - 0.5) * K.step * 0.8, w = T.wAt ? T.wAt(i) : T.w;
      const out = K.outer && T.k && sd === -Math.sign(T.k[i]) ? Math.min(1, Math.abs(T.k[i]) * 70) * K.outer : 0;
      const at = (o) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
      const ok = (x, z) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * ds < 6 && q.lat * sd > 0 && !bad(x, z) && !(gT(x, z) < T.hy[i] - 3); };
      if (r0 < K.rim + out) { let o = K.in1 + r1 * (K.in0 - K.in1); if (K.gap && o > K.gap[0] && o < K.gap[1]) o = o - K.gap[0] < K.gap[1] - o ? K.gap[0] - 0.02 : K.gap[1] + 0.02;   // (not on the edge line)
        const [x, z] = at(w - o);
        if (ok(x, z)) { const P = K.onRoad(R, out); streak(soft, rY, x, z, T.tx[i], T.tz[i], P.len, P.wid, P.col, R, P.lift); st.rob++; } }
      if (r2 < K.grit) { const [x, z] = at(w + K.sh0 + R() * (K.sh1 - K.sh0));
        if (ok(x, z)) { const P = K.onShoulder(R); streak(soft, rY, x, z, T.tx[i], T.tz[i], P.len, P.wid, P.col, R, 0.012); st.bankina++; } }
      if (r3 < K.stone) { const [x, z] = at(w + K.sh0 + 0.1 + R() * (K.sh1 - K.sh0));
        if (ok(x, z)) { const h = R(); cushion(soft.get(x, z), x, rY(x, z) - 0.02, z, 0.1 + h * 0.16, 0.07 + h * 0.1, K.stoneCol(R), R); st.kamni++; } }
    }
    return st;
  };

  /* past the barrier line on both sides, every C.step m: C.n places from C.from to C.to m past it (denser near: r^pw), only where this leg's
     road is the nearest, not in the excluded places, not more than C.drop m below the road nor steeper than C.maxSl; C.put lays one */
  const outer = (soft, E, seed, C, st) => {
    const T = API.T, { near, gT, lc, bad } = E, R = rng(seed), N = T.px.length;
    const slope = E.slope || ((x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); });
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) for (let k = 0; k < C.n; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + Math.pow(r1, C.pw || 1) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || Math.abs(q.lat) < bar + 0.4 || q.lat * sd < 0) continue;
      if (bad(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + (C.rise || 60))) continue;
      const sl = slope(x, z); if (sl > C.maxSl) continue;
      const c = lc ? lc(x, z) : 0; if (C.skip && C.skip(c)) continue;
      const kk = C.put(soft, gT, x, y, z, o - bar, R, c, sl); if (kk) st[kk] = (st[kk] || 0) + 1;
    }
    return st;
  };

  /* ---- Katu: the crushed brown schist, the steppe, the caragana and the juniper (docs/proge/katu.md) ---- */
  const KT = {
    loose: [[0.73, 0.67, 0.57], [0.78, 0.72, 0.61]], chips: [[0.46, 0.41, 0.35], [0.5, 0.45, 0.38]],   // (the loose gravel's windrows, the fresh chips)
    flake: [[0.58, 0.53, 0.45], [0.62, 0.56, 0.47]], dust: [[0.76, 0.71, 0.62], [0.8, 0.74, 0.65]], stone: [[0.5, 0.46, 0.41], [0.56, 0.5, 0.44]],
    schist: [[0.56, 0.49, 0.4], [0.6, 0.53, 0.43]], rust: [[0.58, 0.48, 0.38], [0.62, 0.51, 0.4]], dark: [[0.46, 0.41, 0.34], [0.5, 0.45, 0.37]],
    caragana: [[0.44, 0.5, 0.3], [0.5, 0.54, 0.34]], juniper: [[0.3, 0.38, 0.26], [0.34, 0.42, 0.29]], straw: [[0.66, 0.61, 0.4], [0.74, 0.67, 0.46]],
  };
  const katu = (ctx, o) => {
    const T = API.T, out = ctx.out; if (!out || !out.matV || !ctx.root || !T || !T.br || !o || !o.near || !o.gH) return;
    const near = o.near, gT = o.gH, lc = o.lc, ex = ctx.excluded || (() => false);
    const bad = (x, z) => ex(x, z) || (o.bad ? o.bad(x, z) : false) || (lc ? lc(x, z) === 3 || lc(x, z) === 5 : false);
    // (js/world-katu.js: the gravel at +0.02 to w, the shoulder from +0.01 at w to -0.03 at w + 0.6, then the verge onto the ground)
    const rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const w = T.wAt ? T.wAt(q.i) : T.w, a = Math.abs(q.lat), y = T.hy[q.i];
      return a < w ? y + 0.02 : a < w + 0.6 ? y + 0.01 - 0.04 * (a - w) / 0.6 : Math.max(gT(x, z), y - 0.03); };
    const E = { near, gT, rY, lc, bad, slope: o.slope }, soft = softScen(ctx.root, out.matV);
    const st = edge(soft, E, 86101, { step: 3.0, rim: 0.5, outer: 0.35, in0: 0.7, in1: 0.08, grit: 0.25, sh0: 0.06, sh1: 0.5, stone: 0.07,
      onRoad: (R, ou) => R() < 0.72 + ou * 0.3   // (the paler loose gravel heaped low; between them the darker fresh chips, flat)
        ? { len: 2.0 + R() * 3.0, wid: 0.32 + R() * 0.3, col: C_(R, KT.loose), lift: 0.03 }
        : { len: 1.0 + R() * 1.6, wid: 0.18 + R() * 0.16, col: C_(R, KT.chips), lift: 0.01 },
      onShoulder: (R) => ({ len: 0.7 + R() * 1.3, wid: 0.2 + R() * 0.22, col: C_(R, R() < 0.55 ? KT.flake : KT.dust, 0.02) }),
      stoneCol: (R) => C_(R, KT.stone, 0.03) });
    // past the far band's start (~13 m) out to ~55 m: the steppe's low bushes and the schist's blocks
    outer(soft, E, 86102, { step: 7, n: 2, share: 0.32, from: 12, to: 55, pw: 1.15, drop: 16, maxSl: 2.4,
      put: (soft, g, x, y, z, d, R, c, sl) => { const u = R(), h = R(), k = 1 + 0.5 * Math.min(1, (d - 12) / 43);
        if (sl > 1.0 || c === 4) {   // (on the steep faces: the schist's blocks standing out)
          if (u < 0.6) { cushion(soft.get(x, z), x, y + 0.04, z, (0.35 + h * 0.6) * k, 0.25 + h * 0.4, C_(R, u < 0.25 ? KT.schist : u < 0.45 ? KT.rust : KT.dark, 0.02), R); return 'bloki'; }
          return null; }
        if (c === 1) { if (u < 0.3) { cushion(soft.get(x, z), x, y + 0.03, z, (0.3 + h * 0.4) * k, 0.2 + h * 0.25, C_(R, KT.dark, 0.02), R); return 'bloki'; } return null; }   // (under the larches: a few stones)
        if (u < (c === 2 ? 0.75 : 0.42)) { const jun = R() < 0.35;   // (caragana olive and airy, juniper darker and flatter)
          cushion(soft.get(x, z), x, y, z, (jun ? 0.8 + h * 0.8 : 0.5 + h * 0.5) * k, jun ? 0.3 + h * 0.25 : 0.45 + h * 0.4, C_(R, jun ? KT.juniper : KT.caragana, 0.025), R); return 'grmi'; }
        if (u < 0.62) { cushion(soft.get(x, z), x, y + 0.04, z, (0.25 + h * 0.45) * k, 0.18 + h * 0.3, C_(R, u < 0.52 ? KT.schist : KT.rust, 0.02), R); return 'bloki'; }
        soil(soft, g, x, z, (1.4 + R() * 1.6) * k, C_(R, KT.straw, 0.03), R, 0.07); return 'zaplate'; } }, st);
    soft.done();
    out.robBt86 = st;
  };

  /* ---- Tianmen: the wet asphalt's edge, the grit shoulder, the limestone (docs/proge/tianmen.md) ---- */
  const TM = {
    grime: [[0.2, 0.2, 0.19], [0.24, 0.24, 0.22]], moss: [[0.24, 0.32, 0.15], [0.28, 0.36, 0.17]], leaf: [[0.46, 0.35, 0.2], [0.52, 0.4, 0.23]],
    wgrit: [[0.42, 0.41, 0.37], [0.46, 0.44, 0.4]], stone: [[0.52, 0.51, 0.48], [0.58, 0.57, 0.53]],
    lime: [[0.62, 0.61, 0.57], [0.68, 0.67, 0.62]], rust: [[0.6, 0.53, 0.43], [0.64, 0.56, 0.45]], streaked: [[0.43, 0.43, 0.41], [0.48, 0.47, 0.44]],
    mossG: [[0.25, 0.33, 0.17], [0.3, 0.37, 0.2]],
  };
  const tianmen = (ctx, o) => {
    const T = API.T, out = ctx.out, near = API.vrNear, gT = (o && o.gH) || API.vrGround;
    if (!out || !out.matV || !ctx.root || !T || !T.br || !near || !gT) return;
    const ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z);
    // (js/world-tianmen.js: the asphalt at +0.02 to w, the grit shoulder from +0.012 at w to -0.02 at w + 0.5, then the verge)
    const rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const w = T.w, a = Math.abs(q.lat), y = T.hy[q.i];
      return a < w ? y + 0.02 : a < w + 0.5 ? y + 0.012 - 0.032 * (a - w) / 0.5 : Math.max(gT(x, z), y - 0.02); };
    const E = { near, gT, rY, lc: null, bad, slope: o && o.slope }, soft = softScen(ctx.root, out.matV);
    // (on the asphalt by its edge, 1 m inside it, but not on the white edge line, w - 0.4 to w - 0.25: the wheels keep further in)
    const st = edge(soft, E, 86201, { step: 3.4, rim: 0.45, in0: 1.0, in1: 0.06, gap: [0.2, 0.45], grit: 0.25, sh0: 0.05, sh1: 0.45, stone: 0.05,
      onRoad: (R) => { const v = R(); return { len: 1.2 + R() * 2.4, wid: 0.12 + R() * 0.08, lift: 0.008, col: C_(R, v < 0.5 ? TM.grime : v < 0.75 ? TM.moss : TM.leaf) }; },
      onShoulder: (R) => { const v = R(); return { len: 0.6 + R() * 1.4, wid: 0.18 + R() * 0.2, col: C_(R, v < 0.5 ? TM.wgrit : v < 0.8 ? TM.leaf : TM.moss, 0.02) }; },
      stoneCol: (R) => C_(R, TM.stone, 0.03) });
    // past the barrier out to ~40 m: the limestone's boulders, moss at their foot (also on the steeper ground)
    outer(soft, E, 86202, { step: 10, n: 1, share: 0.3, from: 0.9, to: 40, pw: 1.5, drop: 12, rise: 40, maxSl: 2.2,
      put: (soft, g, x, y, z, d, R, c, sl) => { const u = R(), h = R(), k = 1 + 0.6 * Math.min(1, d / 40);
        const col = C_(R, u < 0.5 ? TM.lime : u < 0.75 ? TM.rust : TM.streaked, 0.02);
        cushion(soft.get(x, z), x, y + 0.05, z, (0.35 + h * 0.75) * k, (0.3 + h * 0.55) * (sl > 1 ? 0.8 : 1), col, R);
        if (R() < 0.45 && sl < 1.2) soil(soft, g, x + (R() - 0.5) * 1.2, z + (R() - 0.5) * 1.2, (0.7 + R() * 0.8) * k, C_(R, TM.mossG, 0.02), R, 0.05);
        return 'skale'; } }, st);
    soft.done();
    out.robBt86 = st;
  };

  const base = World.ext.goreRob;
  const f = function (ctx, id, o) {
    const r = base.apply(this, arguments);
    if ((id === 'katu' || id === 'tianmen') && ctx) try { (id === 'katu' ? katu : tianmen)(ctx, o || {}); } catch (e) { console.error('chase-bt86 (' + id + '):', e); }
    return r;
  };
  Object.assign(f, base);   // (LOOK, hjLC and whatever else the later groups hang on it)
  World.ext.goreRob = f;
})();
