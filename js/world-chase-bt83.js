/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighty-third group of the real tracks: Montréal, a second
   pass on a track whose ground the earlier groups set (js/world-chase-bt18.js, tufts and shrubs by the walls and trees,
   js/world-chase-bt58.js, the mower's patches to ~55 m). From behind the car Montréal's asphalt met the grass in one clean line and its
   lawn read as a few flat pale polygons on one even green. So here:
   Montréal (docs/proge/montreal.md: »parkovne ceste … navijači na travi«, the island a mown park; a circuit used once a year): just inside
   the asphalt's edge, off the racing line, short streaks of the grey dust and the worn rubber's marbles (mid grey, none near black); on the
   grass strip between the asphalt and the walls and out to ~60 m past them the mower's long stripes, a little lighter and a little darker
   than the lawn, lying along the road; low tufts and a few worn bare spots at the walls' foot. The mower's patches of js/world-chase-bt58.js
   are toned closer to the lawn there.
   Pikes Peak on gravel (pikesg) was here too, but js/world-chase-bt82.js already lays its roadside (the edge's stones, the boulders,
   tundra and litter to ~60 m): one pass is enough, so it stays with the eighty-second group alone. Nothing on the built ground, the
   water, or in the builders' excluded places. All in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the
   barriers, the trees, the horizon and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.softScen || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, cushion, softScen, mix3 } = BT;
  const C_ = (R, ab, j) => vary(mix3(ab[0], ab[1], R()), R, j || 0.015);

  /* the lateral offset of (x, z) at the nearest sample, whatever the track's own near() gives (the fifty-eighth group's) */
  const latOf = (T, near) => { const q2 = { i: -1, lat: 0 }; return (x, z) => { const q = near(x, z); q2.i = q.i;
    q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; }; };

  /* a thin low streak lying on the ground along (ax, az), tapering to both ends (the seventy-fifth and eightieth groups') */
  const streak = (scen, gH, x, z, ax, az, len, wid, col, R, lift, seg) => {
    const g = scen.get(x, z), bx = -az, bz = ax, n = seg || 4, up = lift || 0.04, rim = [col[0] * 0.95 + 0.02, col[1] * 0.95 + 0.03, col[2] * 0.95 + 0.015], L = [], P = [], C = [];
    for (let k = 0; k <= n; k++) {
      const u = (k / n - 0.5) * len, t = Math.sin(Math.PI * k / n), hw = wid * 0.5 * (0.2 + 0.8 * t) * (0.85 + R() * 0.3), j = (R() - 0.5) * wid * 0.2;
      const cx = x + ax * u + bx * j, cz = z + az * u + bz * j;
      L.push([cx + bx * hw, gH(cx + bx * hw, cz + bz * hw) + up, cz + bz * hw]); P.push([cx - bx * hw, gH(cx - bx * hw, cz - bz * hw) + up, cz - bz * hw]); C.push([cx, gH(cx, cz) + up + 0.004, cz]);
    }
    for (let k = 0; k < n; k++) {
      const inn = [C[k][0], C[k][1] - 5, C[k][2]];
      g.triO(C[k], L[k], L[k + 1], col, inn, rim, rim); g.triO(C[k], L[k + 1], C[k + 1], col, inn, rim, col);
      g.triO(C[k], P[k + 1], P[k], col, inn, rim, rim); g.triO(C[k], C[k + 1], P[k + 1], col, inn, col, rim);
    }
  };

  /* walk both sides every K.step m; K.put(soft, i, sd, w, bar, R, at, own) lays what it wants. own(x, z, o) is true where this leg's
     road is the nearest on this side, the place is not excluded (E.bad), not far below the road nor on water or built ground (E.off) */
  const walk = (root, matV, E, seed, K) => {
    const T = API.T, st = {};
    if (!T || !T.br || !E.near || !E.gT || !root || !matV) return st;
    const N = T.px.length, ds = T.ds, R = rng(seed), soft = softScen(root, matV), near = latOf(T, E.near);
    for (let i = 0; i < N; i += Math.max(1, Math.round(K.step / ds))) for (const sd of [-1, 1]) {
      const w = T.wAt ? T.wAt(i) : T.w, bar = sd > 0 ? T.br[i] : T.bl[i];
      const at = (o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
      const own = (x, z, o) => { const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * ds > Math.max(6, o + 10) || q.lat * sd <= 0) return false;
        if (o > bar && Math.abs(q.lat) < (q.lat > 0 ? T.br[q.i] : T.bl[q.i]) + 0.35) return false;   // (another leg nearer, or inside its barrier)
        if (E.bad(x, z) || (E.off && E.off(x, z))) return false;
        return !(E.gT(x, z) < T.hy[i] - (E.drop || 12)); };
      const k = K.put(soft, i, sd, w, bar, R, at, own); if (k) for (const n in k) st[n] = (st[n] || 0) + k[n];
    }
    soft.done();
    return st;
  };
  const roadY = (near, gT, sw) => { const T = API.T, nq = latOf(T, near); return (x, z) => { const q = nq(x, z); if (q.i < 0) return gT(x, z);
    const w = T.wAt ? T.wAt(q.i) : T.w, o = Math.abs(q.lat), y = T.hy[q.i];
    return o < w ? y + 0.02 : o < w + sw ? y + 0.012 - 0.032 * (o - w) / sw : Math.max(gT(x, z), y - 0.02); }; };
  const slopeOf = (gT) => (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };

  /* ---- Montréal (js/world-montreal.js: goreRob(…, 'montreal', { gH, slope, lc, near, bad })) ----
     the lawn of js/world-chase-bt18.js (gr, gr2); land cover 2, 3, 4, 5, 7, 8 the built ground, water, sand, car parks, pitches, plazas */
  const MT = {
    dust: [[0.42, 0.41, 0.39], [0.47, 0.46, 0.43]], rubber: [[0.34, 0.33, 0.32], [0.38, 0.37, 0.35]],
    light: [[0.29, 0.52, 0.13], [0.31, 0.54, 0.14]], dark: [[0.21, 0.42, 0.09], [0.23, 0.44, 0.1]], tuft: [[0.3, 0.5, 0.16], [0.36, 0.55, 0.2]],
    bare: [[0.42, 0.37, 0.27], [0.46, 0.4, 0.29]], clover: [[0.22, 0.46, 0.13], [0.25, 0.48, 0.15]],
  };
  const MT_OFF = { 2: 1, 3: 1, 4: 1, 5: 1, 7: 1, 8: 1 };
  const montreal = (ctx, o) => {
    const T = API.T, out = ctx.out; if (!out || !out.matV || !ctx.root || !T || !T.br || !o || !o.near || !o.gH || !o.lc) return null;
    const gT = o.gH, lc = o.lc, ex = ctx.excluded || (() => false), slope = o.slope || slopeOf(gT);
    const E = { near: o.near, gT, drop: 6, bad: (x, z) => ex(x, z) || (o.bad ? o.bad(x, z) : false), off: (x, z) => !!MT_OFF[lc(x, z)] };
    const rY = roadY(o.near, gT, 0.4), tr = (x, z) => lc(x, z) === 1;
    const st = {};
    // the asphalt's edge (off the racing line: the dust and the marbles) and the grass strip to the walls
    st.rob = walk(ctx.root, out.matV, E, 83101, { step: 3, put: (soft, i, sd, w, bar, R, at, own) => { const c = {};
      if (R() < 0.5) { const oo = w - 0.15 - R() * 0.5, [x, z] = at(oo, (R() - 0.5) * 2);
        if (own(x, z, oo)) { streak(soft, rY, x, z, T.tx[i], T.tz[i], 1.6 + R() * 3, 0.25 + R() * 0.3, C_(R, R() < 0.6 ? MT.dust : MT.rubber), R, 0.008, 3); c.prah = 1; } }
      const vw = bar - w - 0.6;
      if (vw > 1.2 && R() < 0.55) { const oo = w + 0.6 + R() * (vw - 0.6), [x, z] = at(oo, (R() - 0.5) * 2);
        if (own(x, z, oo)) { streak(soft, gT, x, z, T.tx[i], T.tz[i], 5 + R() * 5, Math.min(vw * 0.6, 1.2 + R() * 0.8), C_(R, R() < 0.5 ? MT.light : MT.dark, 0.01), R, 0.035, 4); c.pasovi = 1; } }
      if (vw > 0.4 && R() < 0.6) { const oo = bar - 0.35 - R() * 0.3, [x, z] = at(oo, (R() - 0.5) * 2.5);
        if (own(x, z, oo)) { const h = R(); tuft(soft.get(x, z), x, gT(x, z), z, 0.22 + h * 0.16, 0.24 + h * 0.2, C_(R, MT.tuft, 0.03), R, 5); c.sopi = 1; } }
      return c; } });
    // past the walls out to ~60 m: the mower's stripes along the road (denser near), clover patches, worn bare spots at the walls' foot
    // where the crowd stands, low tufts; under and by the trees left to js/world-chase-bt18.js
    st.pas = walk(ctx.root, out.matV, E, 83102, { step: 4, put: (soft, i, sd, w, bar, R, at, own) => { const c = {};
      for (let k = 0; k < 4; k++) {
        const d = 0.8 + Math.pow(R(), 1.3) * 59, oo = bar + d, [x, z] = at(oo, (R() - 0.5) * 4), u = R();
        if (R() > (d < 15 ? 0.85 : 0.6) || !own(x, z, oo) || tr(x, z) || slope(x, z) > 0.5) continue;
        const kk = 1 + 0.6 * Math.min(1, d / 50);
        if (d < 3 && u < 0.3) { soil(soft, gT, x, z, 0.5 + R() * 0.6, C_(R, MT.bare, 0.02), R, 0.04); c.gola = (c.gola || 0) + 1; }
        else if (u < 0.72) { streak(soft, gT, x, z, T.tx[i], T.tz[i], (6 + R() * 8) * kk, (1.6 + R() * 1.0) * kk, C_(R, R() < 0.5 ? MT.light : MT.dark, 0.01), R, 0.045, 4); c.pasovi = (c.pasovi || 0) + 1; }
        else if (u < 0.85) { soil(soft, gT, x, z, (0.8 + R() * 1.2) * kk, C_(R, MT.clover, 0.012), R, 0.05); c.detelja = (c.detelja || 0) + 1; }
        else { const h = R(); tuft(soft.get(x, z), x, gT(x, z), z, (0.22 + h * 0.18) * kk, 0.24 + h * 0.22, C_(R, MT.tuft, 0.03), R, 5); c.sopi = (c.sopi || 0) + 1; }
      }
      return c; } });
    return st;
  };

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      try {
        if (id === 'montreal' && ctx.out) { const s = montreal(ctx, o); if (s) { ctx.out.robBt83 = s.rob; ctx.out.pasBt83 = s.pas; } }
      } catch (e) { console.error('chase-bt83 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK, pkLC and whatever else the earlier groups hang on it: Pikes calls goreRob only when pkLC is there)
    World.ext.goreRob = f;
  }
})();
