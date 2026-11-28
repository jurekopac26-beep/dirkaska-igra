/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-fifteenth group of the real tracks: Ujarrás, a
   fourth pass on the road whose verge, bank and the ground out to ~60 m the eleventh, thirty-fourth and seventy-fifth groups already
   set (js/world-chase-bt11.js: three bands; js/world-chase-bt34.js: the verge and the bank to ~8 m; js/world-chase-bt75.js: the
   asphalt's edge and the patches, ferns and clumps from ~8 to ~60 m). From behind the car the grass between those patches and clumps
   was still one smooth face, and the patches lay on it alone. So here, on that face only (docs/proge/ujarras.md: »ob cesti trava«, the
   wet broadleaf forest by ESA WorldCover, the valley's dark volcanic earth): the grass's own short tufts in the ground's greens, thick
   by the road and thinner out to ~60 m, with sun-dried ones among them; wide low shades of the same grass, a little darker and a
   little yellower, so the earlier patches no longer lie alone; under the forest the fallen branches and the drifts of brown leaves;
   on the steeper and the rocky ground the dark volcanic stones in small groups. Nothing on built ground (3), in the water (5), where
   another road is nearer, round the lookout, far below the road or on the steep, in the builder's excluded places (the side roads
   too). All in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers, the trees, the horizon
   and the driving stay. (Portobelo, the group's other track, is left out: its roadside is being changed elsewhere.)
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.softScen || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, cushion, softScen, mix3 } = BT;
  // (as js/world-chase-bt84.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C_ = (R, ab, j, k) => mute(vary(mix3(ab[0], ab[1], R()), R, j || 0.015), k);

  /* a fallen branch: a thin dark streak lying on the ground along (ax, az), bent a little, tapering to its ends */
  const branch = (scen, gH, x, z, ax, az, len, wid, col, R) => {
    const g = scen.get(x, z), bx = -az, bz = ax, n = 3, up = 0.05, dk = [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], bend = (R() - 0.5) * len * 0.25, L = [], P = [];
    for (let k = 0; k <= n; k++) {
      const u = (k / n - 0.5) * len, j = bend * Math.sin(Math.PI * k / n), hw = wid * 0.5 * (1 - 0.6 * k / n);
      const cx = x + ax * u + bx * j, cz = z + az * u + bz * j, y = gH(cx, cz) + up;
      L.push([cx + bx * hw, y, cz + bz * hw]); P.push([cx - bx * hw, y, cz - bz * hw]);
    }
    for (let k = 0; k < n; k++) {
      const inn = [(L[k][0] + P[k][0]) / 2, L[k][1] - 5, (L[k][2] + P[k][2]) / 2];
      g.triO(L[k], P[k], P[k + 1], col, inn, dk, dk); g.triO(L[k], P[k + 1], L[k + 1], col, inn, dk, col);
    }
  };

  /* past the barrier line on both sides, every C.step m: C.n places from C.from to C.to m past it (C.pw > 1: more of them near), only
     where this leg's road is the nearest, not in the excluded places, far below the road (C.drop) nor steeper than C.maxSl, not on built
     ground or water (the seventy-fifth group's walk) */
  const outer = (ctx, E, seed, C, st) => {
    const T = API.T, { near, gT, lc, bad, slope } = E;
    const R = rng(seed), soft = softScen(ctx.root, ctx.matV), N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) for (let k = 0; k < C.n; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + Math.pow(r1, C.pw || 1) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0) continue;
      if (bad(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop)) continue;
      const sl = slope(x, z); if (sl > C.maxSl) continue;
      const c = lc ? lc(x, z) : 0; if (c === 3 || c === 5) continue;
      const kk = C.put(soft, gT, x, y, z, o - bar, R, c, sl, T.tx[i], T.tz[i]); if (kk) st[kk] = (st[kk] || 0) + 1;
    }
    soft.done();
    return st;
  };
  const rock = (c) => c === 4 || c === 7;

  /* ---- Ujarrás (js/world-gore.js: goreRob called with no o, on Vršič's corridor's API) ---- */
  const UJ = {
    gr: [[0.27, 0.42, 0.14], [0.34, 0.48, 0.17]], dry: [[0.47, 0.49, 0.25], [0.52, 0.52, 0.28]],   // (the grass's own tufts: the ground's greens, the sun-dried)
    shade: [[0.3, 0.42, 0.17], [0.35, 0.46, 0.19]], pale: [[0.43, 0.5, 0.23], [0.47, 0.52, 0.25]],   // (the wide low shades of the same grass)
    leaf: [[0.4, 0.31, 0.2], [0.46, 0.36, 0.23]], wood: [[0.3, 0.24, 0.18], [0.36, 0.29, 0.21]],   // (the brown leaves' drifts, the fallen branches)
    stone: [[0.3, 0.29, 0.28], [0.37, 0.35, 0.33]],   // (the dark volcanic stones)
  };
  const ujarras = (ctx) => {
    const T = API.T; if (!ctx.out || !ctx.root || !ctx.out.matV || !T || !T.br) return;
    const near = API.vrNear, gT = API.vrGround; if (!near || !gT) return;
    const ex = ctx.excluded || (() => false), look = ctx.out.ujarras && ctx.out.ujarras.lookout;
    const wet = API.vrWater ? (x, z) => { const q = API.vrWater(x, z); return q && q.e > -4; } : () => false;
    const bad = (x, z) => ex(x, z) || wet(x, z) || (!!look && Math.hypot(x - look.x, z - look.z) < 16);
    const slope = API.vrSlope || ((x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); });
    const m = { root: ctx.root, matV: ctx.out.matV }, E = { near, gT, lc: API.vrLC, bad, slope };
    // the wide low shades first (they lie lowest), from the barrier's foot out to ~60 m
    ctx.out.senceBt115 = outer(m, E, 115101, { step: 5.5, n: 3, share: 0.6, from: 1.5, to: 60, pw: 1.4, drop: 14, maxSl: 1.2,
      put: (soft, g, x, y, z, o, R, c) => { if (c === 1 && R() < 0.5) return null;
        soil(soft, g, x, z, 1.5 + R() * 1.9, C_(R, R() < 0.6 ? UJ.shade : UJ.pale, 0.012, 0.98), R, 0.035); return 'sence'; } }, {});
    // the grass's own short tufts on the open ground; under the forest the branches and the leaves; the stones on the steep and the rock
    ctx.out.travaBt115 = outer(m, E, 115102, { step: 2.6, n: 5, share: 0.75, from: 0.8, to: 60, pw: 1.6, drop: 14, maxSl: 1.35,
      put: (soft, g, x, y, z, o, R, c, sl, tx, tz) => { const u = R(), h = R(), k = 1 + 0.5 * Math.min(1, o / 60);
        if (c === 1) {   // under the forest
          if (u < 0.3) { const a = R() * Math.PI, ax = Math.cos(a), az = Math.sin(a); branch(soft, g, x, z, ax, az, 1.2 + h * 1.6, 0.09 + R() * 0.07, C_(R, UJ.wood, 0.02), R); return 'veje'; }
          if (u < 0.55) { soil(soft, g, x, z, (0.5 + h * 0.6) * k, C_(R, UJ.leaf, 0.02), R, 0.045); return 'listje'; }
          if (u < 0.8) { tuft(soft.get(x, z), x, y, z, (0.24 + h * 0.16) * k, 0.26 + h * 0.2, C_(R, UJ.gr, 0.025, 0.9), R, 4); return 'trava'; }
          return null; }
        if ((rock(c) || sl > 0.8) && u < 0.3) {   // the dark stones, two or three together
          for (let j = 0, n = 1 + Math.floor(R() * 3); j < n; j++) { const dx = j ? (R() - 0.5) * 1.6 : 0, dz = j ? (R() - 0.5) * 1.6 : 0, s = 0.16 + R() * 0.22;
            cushion(soft.get(x, z), x + dx, g(x + dx, z + dz) + 0.02, z + dz, s, s * (0.5 + R() * 0.3), C_(R, UJ.stone, 0.02), R); }
          return 'kamni'; }
        if (u < 0.07 && o > 3) { const s = 0.14 + R() * 0.16; cushion(soft.get(x, z), x, y + 0.02, z, s, s * 0.6, C_(R, UJ.stone, 0.02), R); return 'kamni'; }
        tuft(soft.get(x, z), x, y, z, (0.24 + h * 0.18) * k, 0.26 + h * 0.24, C_(R, R() < 0.78 ? UJ.gr : UJ.dry, 0.025), R, 4); return 'trava'; } }, {});
  };

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'ujarras') try { ujarras(ctx); } catch (e) { console.error('chase-bt115 (ujarras):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
