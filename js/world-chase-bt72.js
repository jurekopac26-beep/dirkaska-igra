/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventy-second group of the real tracks: Savusavu and Isalo, a
   third pass on the two roads whose ground the eighth and thirtieth groups (js/world-chase-bt8.js, js/world-chase-bt30.js: Savusavu's
   verge and bank to ~8 m past the barrier line) and the fourteenth and thirty-first (js/world-chase-bt14.js, js/world-chase-bt31.js:
   Isalo's sandy strip and low earth bank to ~4 m) already set. From behind the car both still showed the asphalt's edge as one clean line
   and, past those bands, one smooth face of the land cover's colour out to ~60 m: on Savusavu one green, on Isalo one gold. So here, as the
   seventieth group did (js/world-chase-bt70.js): on both the edge of the asphalt in short streaks (docs/proge/savusavu.md: »rdečerjav prah
   vulkanske prsti, ki ga dež spere na rob asfalta«; docs/proge/isalo.md: »zlata trava in rdeča prst«: the red earth and the sand the wind
   and the rain bring onto it), the shoulder's grit; past the earlier bands out to ~60 m wide low patches and on them what stands there:
   Savusavu the grass, the sun-bleached grass, the red-brown soil, the leaf litter and the ferns under the forest, the dark bushes of the
   gardens and the forest's edge, now and then a dark basalt stone; Isalo the golden grass and the red earth in patches, the paler sand,
   the golden tussocks, the scrub's low green-olive bushes and the sandstone's blocks where the rock comes out. Nothing on built ground (3),
   in the water (5), where another leg's road is nearer, far below the road or on the steep, in the builders' excluded places. All of it in
   meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers, the trees, the horizon and the driving stay.
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

  /* E: the track's own nearest road point (near), ground (gT), road cross-section (rY), land cover (lc), the places to leave out (bad, wet).
     The asphalt's edge and the shoulder: every ~3 m on each side by chance a short streak just inside the edge (K.rim, K.worn) and one on
     the shoulder (K.grit, K.stone); only where this leg's road is the nearest. */
  const edge = (ctx, E, seed, K) => {
    const T = API.T, st = { rob: 0, gramoz: 0 }, { near, gT, rY, bad, wet } = E;
    if (!T || !T.br || !near || !gT) return st;
    const N = T.px.length, ds = T.ds, R = rng(seed), soft = softScen(ctx.root, ctx.matV);
    for (let i = 0; i < N; i += Math.max(1, Math.round(3 / ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), a = (R() - 0.5) * 2.4, w = T.wAt ? T.wAt(i) : T.w;
      const at = (o) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
      const ok = (x, z) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * ds < 6 && q.lat * sd > 0 && !bad(x, z) && !(gT(x, z) < T.hy[i] - 3) && !wet(x, z); };
      if (r0 < K.rim) { const [x, z] = at(w - 0.12 - r1 * 0.12);
        if (ok(x, z)) { streak(soft, rY, x, z, T.tx[i], T.tz[i], 0.8 + R() * 1.8, 0.1 + R() * 0.12, C_(R, K.worn), R, 0.01); st.rob++; } }
      if (r2 < K.grit) { const [x, z] = at(w + 0.05 + R() * K.sh);
        if (ok(x, z)) { streak(soft, rY, x, z, T.tx[i], T.tz[i], 0.6 + R() * 1.4, 0.18 + R() * 0.22, C_(R, K.stone, 0.02), R, 0.012); st.gramoz++; } }
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

  /* ---- Savusavu: the wet island's green grass, the red-brown volcanic soil, the dark basalt (docs/proge/savusavu.md) ---- */
  const SV = {
    worn: [[0.52, 0.38, 0.29], [0.57, 0.42, 0.32]], stone: [[0.5, 0.34, 0.24], [0.55, 0.38, 0.27]],   // (the red-brown dust on the edge, washed soil on the shoulder)
    green: [[0.29, 0.48, 0.17], [0.34, 0.51, 0.2]], bleach: [[0.45, 0.56, 0.26], [0.5, 0.58, 0.29]], soilR: [[0.5, 0.34, 0.22], [0.55, 0.38, 0.25]],
    litter: [[0.34, 0.33, 0.2], [0.4, 0.36, 0.22]], fern: [[0.2, 0.42, 0.14], [0.26, 0.47, 0.17]], tuft: [[0.24, 0.46, 0.15], [0.33, 0.52, 0.2]],
    bush: [[0.16, 0.32, 0.12], [0.2, 0.36, 0.14]], basalt: [[0.32, 0.31, 0.29], [0.37, 0.35, 0.32]],
  };
  const savusavu = (ctx) => {
    const T = API.T; if (!ctx.out || !ctx.root || !ctx.matV || !T || (T.def && T.def.id !== 'savusavu')) return;
    const near = API.vrNear, gT = API.caGround || API.vrGround; if (!near || !gT) return;
    const ex = ctx.excluded || (() => false), wet = API.vrWater ? (x, z) => { const q = API.vrWater(x, z); return q && q.e > -4; } : () => false;
    // (the passes' road: asphalt at +0.02 to w, the shoulder from +0.012 at w to -0.02 at w + 0.45, then the ground)
    const rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const o = Math.abs(q.lat), y = T.hy[q.i];
      return o < T.w ? y + 0.02 : o < T.w + 0.45 ? y + 0.012 - 0.032 * (o - T.w) / 0.45 : Math.max(gT(x, z), y - 0.02); };
    const E = { near, gT, rY, lc: API.vrLC, bad: ex, wet };
    ctx.out.robBt72 = edge(ctx, E, 72101, { rim: 0.32, grit: 0.4, sh: 0.6, worn: SV.worn, stone: SV.stone });
    // past the thirtieth group's bank (~8 m) out to ~60 m
    ctx.out.pasBt72 = outer(ctx, E, 72102, { step: 4.5, n: 3, share: 0.65, from: 8, to: 60, pw: 1.1, drop: 14, maxSl: 1.3,
      put: (soft, g, x, y, z, o, R, c, sl) => { const u = R(), h = R(), k = 1 + 0.6 * Math.min(1, (o - 8) / 52);
        if (c === 1) {   // under the forest: leaf litter, ferns, the dark undergrowth
          if (u < 0.45) { soil(soft, g, x, z, (1.0 + R() * 1.2) * k, C_(R, R() < 0.7 ? SV.litter : SV.soilR), R, 0.05); return 'listje'; }
          if (u < 0.75) { tuft(soft.get(x, z), x, y, z, (0.4 + h * 0.35) * k, 0.35 + h * 0.3, C_(R, SV.fern, 0.03), R, 6); return 'praprot'; }
          cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.6) * k, 0.4 + h * 0.4, C_(R, SV.bush, 0.025), R); return 'grmi'; }
        if (u < 0.55) { const v = R();
          const col = (sl > 0.9 || rock(c)) && v < 0.6 ? C_(R, SV.soilR) : v < 0.5 ? C_(R, SV.green) : v < 0.85 ? C_(R, SV.bleach) : C_(R, SV.soilR);
          soil(soft, g, x, z, (1.3 + R() * 1.5) * k, col, R, 0.06); return 'zaplate'; }
        if (u < 0.62 || (rock(c) && u < 0.8)) { cushion(soft.get(x, z), x, y + 0.04, z, (0.3 + h * 0.45) * k, 0.22 + h * 0.3, C_(R, SV.basalt, 0.02), R); return 'bazalt'; }
        if (u < 0.78 && sl < 0.9) { cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.7) * k, 0.4 + h * 0.4, C_(R, SV.bush, 0.025), R); return 'grmi'; }
        tuft(soft.get(x, z), x, y, z, (0.35 + h * 0.3) * k, 0.35 + h * 0.35, C_(R, SV.tuft, 0.03), R, 5); return 'sopi'; } }, {});
  };
  if (LK && LK.savusavu && chain) chain(LK.savusavu, (ctx) => { try { savusavu(ctx); } catch (e) { console.error('chase-bt72 (savusavu):', e); } });

  /* ---- Isalo: the golden grass, the red earth, the sand and the sandstone (docs/proge/isalo.md) ---- */
  const NR = {
    worn: [[0.74, 0.5, 0.36], [0.8, 0.56, 0.4]], stone: [[0.86, 0.66, 0.46], [0.9, 0.72, 0.5]],   // (the red earth drifted onto the edge, the sand on the shoulder)
    gold: [[0.88, 0.72, 0.4], [0.94, 0.78, 0.46]], earth: [[0.8, 0.46, 0.31], [0.85, 0.5, 0.33]], sand: [[0.88, 0.72, 0.5], [0.91, 0.75, 0.53]],
    tuft: [[0.94, 0.78, 0.44], [0.9, 0.76, 0.5]], scrub: [[0.56, 0.57, 0.32], [0.6, 0.6, 0.35]], block: [[0.78, 0.6, 0.45], [0.84, 0.66, 0.5]],
  };
  const isalo = (ctx, o) => {
    const T = API.T, out = ctx.out; if (!out || !out.matV || !ctx.root || !T || !T.br || !o || !o.near || !o.gH) return;
    const near = o.near, gT = o.gH, ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || (o.bad ? o.bad(x, z) : false), lc = o.lc;
    // (js/world-isalo.js: the asphalt at +0.02 to w, the verge from 0 at w to -0.04 at w + 0.8, then lifted onto the ground: vergeRow)
    const rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const w = T.wAt ? T.wAt(q.i) : T.w, a = Math.abs(q.lat), y = T.hy[q.i];
      return a < w ? y + 0.02 : a < w + 0.8 ? Math.max(gT(x, z) + 0.06, y - 0.04 * (a - w) / 0.8) : gT(x, z) + 0.06; };
    const E = { near, gT, rY, lc, bad, wet: (x, z) => (lc ? lc(x, z) === 5 : false), slope: o.slope };
    const m = { root: ctx.root, matV: out.matV, excluded: ctx.excluded };
    out.robBt72 = edge(m, E, 72201, { rim: 0.35, grit: 0.4, sh: 0.6, worn: NR.worn, stone: NR.stone });
    // past the thirty-first group's low earth bank (~4 m) out to ~60 m
    out.pasBt72 = outer(m, E, 72202, { step: 5, n: 2, share: 0.62, from: 4.5, to: 60, pw: 1.1, drop: 12, maxSl: 1.2,
      put: (soft, g, x, y, z, d, R, c, sl) => { const u = R(), h = R(), k = 1 + 0.6 * Math.min(1, (d - 4.5) / 55);
        if (rock(c) || sl > 0.85) {   // where the sandstone comes out: its weathered blocks and the sand between
          if (u < 0.5) { cushion(soft.get(x, z), x, y + 0.05, z, (0.35 + h * 0.6) * k, 0.25 + h * 0.35, C_(R, NR.block, 0.02), R); return 'bloki'; }
          soil(soft, g, x, z, (1.0 + R() * 1.2) * k, C_(R, NR.sand), R, 0.05); return 'pesek'; }
        if (u < 0.5) { const v = R(); soil(soft, g, x, z, (1.3 + R() * 1.6) * k, C_(R, v < 0.4 ? NR.earth : v < 0.75 ? NR.gold : NR.sand), R, 0.06); return 'zaplate'; }
        if (u < 0.66 || c === 2 && u < 0.8) { cushion(soft.get(x, z), x, y, z, (0.5 + h * 0.6) * k, 0.3 + h * 0.35, C_(R, NR.scrub, 0.025), R); return 'grmi'; }
        tuft(soft.get(x, z), x, y, z, (0.35 + h * 0.35) * k, 0.4 + h * 0.4, C_(R, NR.tuft, 0.03), R, 5); return 'sopi'; } }, {});
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'isalo') try { isalo(ctx, o); } catch (e) { console.error('chase-bt72 (isalo):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
