/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-ninth group of the real tracks, a further pass:
   El Jem (its own builder, js/world-eljem.js: after js/world-chase-bt38.js, js/world-chase-bt56.js and js/world-chase-bt81.js on
   World.ext.eljemRob). Ghoufi, the group's other track, is left out here: its roadside is in another open change (the second pass of
   js/world-ghoufi-obcestje.js, the strip right along the road over the whole length).
   From behind the car the concrete barriers still stood on the ochre ground in one clean line on both sides, and the first ~14 m behind
   them were bare along most of the lap: the map has the whole town around the track as built ground (land cover 3), where the
   thirty-eighth and the fifty-sixth group put nothing, and the eighty-first group's band starts ~14 m out.
   El Jem (docs/proge/eljem.md: »oljke in palme na suhih okrastih tleh, betonske ločilne ograje mestnih cest«): the sand the wind lays
   against the barriers' foot in thin tongues along them, on the road's side and behind; on the town's open ground from the barriers to
   ~14 m low patches of the pale dust and the ochre earth, the halfa's tussocks in small clumps and a few pale limestone stones, denser
   near the barriers. The houses, the amphitheatre, the viewpoints (the builder's excluded places) and the water stay free; nothing where
   another leg's road is nearer or on a face too steep. The horizon stays the existing DEM terrain. All of it in one set of meshes of its
   own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers, the houses, the trees and the driving stay as they are.
   Colours mid tones (nothing dark).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;

  /* a thin low tongue lying on the ground along (ax, az), tapering to both ends (as js/world-chase-bt81.js's streak) */
  const streak = (scen, gH, x, z, ax, az, len, wid, col, R, lift) => {
    const g = scen.get(x, z), bx = -az, bz = ax, n = 4, up = lift || 0.04, rim = [col[0] * 0.92 + 0.04, col[1] * 0.92 + 0.05, col[2] * 0.92 + 0.03], L = [], P = [], C = [];
    for (let k = 0; k <= n; k++) {
      const u = (k / n - 0.5) * len, t = Math.sin(Math.PI * k / n), hw = wid * 0.5 * (0.2 + 0.8 * t) * (0.8 + R() * 0.4), j = (R() - 0.5) * wid * 0.3;
      const cx = x + ax * u + bx * j, cz = z + az * u + bz * j;
      L.push([cx + bx * hw, gH(cx + bx * hw, cz + bz * hw) + up, cz + bz * hw]); P.push([cx - bx * hw, gH(cx - bx * hw, cz - bz * hw) + up, cz - bz * hw]); C.push([cx, gH(cx, cz) + up + 0.008, cz]);
    }
    for (let k = 0; k < n; k++) {
      const inn = [C[k][0], C[k][1] - 5, C[k][2]];
      g.triO(C[k], L[k], L[k + 1], col, inn, rim, rim); g.triO(C[k], L[k + 1], C[k + 1], col, inn, rim, col);
      g.triO(C[k], P[k + 1], P[k], col, inn, rim, rim); g.triO(C[k], C[k + 1], P[k + 1], col, inn, col, rim);
    }
  };

  /* ---- El Jem ---- */
  const EJ = { ochre: [0.68, 0.52, 0.35], dust: [0.77, 0.64, 0.46], sand: [0.8, 0.68, 0.49], halfa: [0.7, 0.65, 0.42], halfa2: [0.63, 0.6, 0.37],
    earth: [0.64, 0.48, 0.32], stone: [0.8, 0.76, 0.67], stone2: [0.73, 0.68, 0.59] };
  const ejRob = (ctx) => {
    const T = API.T, { nrGround, nrLC, nrNear } = API, st = { pesek: 0, zaplate: 0, halfa: 0, kamni: 0 };
    if (!T || !T.br || !T.bl || !T.wAt || !nrGround || !nrLC || !nrNear || !ctx.root || !ctx.matV) return st;
    const soft = softScen(ctx.root, ctx.matV), ex = ctx.excluded || (() => false), fort = ctx.inFort || (() => false), R = rng(109101), N = T.px.length;
    const bad = (x, z) => ex(x, z) || fort(x, z) || nrLC(x, z) === 5;
    const slope = (x, z) => { const d = 0.8, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    // (the builder's verge, as js/world-chase-bt38.js's prof: w 0, w + 0.8 -0.04, to the barrier line - 0.3 at -0.08 lifted onto the ground,
    // + 0.8 at -0.16, + 3.2 at -0.4; past it the ground itself)
    const prof = (i, o, side) => { const w = T.wAt(i), b = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i];
      const lift = (oo, h) => { const q = side * oo; return [oo, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y)]; };
      const Pp = [[w, 0], [w + 0.8, -0.04], lift(Math.max(w + 1.2, b - 0.3), -0.08), lift(b + 0.8, -0.16), lift(b + 3.2, -0.4)];
      if (o <= Pp[0][0]) return 0; for (let k = 1; k < Pp.length; k++) if (o <= Pp[k][0]) { const t = (o - Pp[k - 1][0]) / Math.max(0.01, Pp[k][0] - Pp[k - 1][0]); return Pp[k - 1][1] + (Pp[k][1] - Pp[k - 1][1]) * t; }
      return null; };
    const gV = (x, z) => { const q = nrNear(x, z), g = nrGround(x, z); if (q.i < 0) return g; const h = prof(q.i, Math.abs(q.lat), q.lat < 0 ? -1 : 1);
      return h == null ? g : Math.max(T.hy[q.i] + h + 0.02, g - 0.02); };
    const own = (x, z, i, lo) => { const q = nrNear(x, z); return q.i >= 0 && Math.abs(q.i - i) * T.ds < 12 && Math.abs(q.lat) > lo; };
    const step = Math.max(1, Math.round(3 / T.ds));
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i];
      // the sand the wind lays against the barriers' foot: a thin tongue along them, on the road's side (where the strip is wide enough) or behind
      if (R() < 0.5) {
        const inner = R() < 0.4 && bar - w > 1.6, o = inner ? bar - 0.42 - R() * 0.25 : bar + 0.4 + R() * 0.35, [x, z] = at(i, sd, o, (R() - 0.5) * 2.4);
        if (own(x, z, i, w + 0.6) && !bad(x, z) && Math.abs(gV(x, z) - T.hy[i]) < 1.2) {
          streak(soft, gV, x, z, T.tx[i], T.tz[i], 1.8 + R() * 3.2, 0.4 + R() * 0.45, vary(mix3(EJ.sand, EJ.dust, R() * 0.5), R, 0.015), R, 0.03); st.pesek++; }
      }
      // on the town's open ground (land cover 3, bare so far) from the barriers to ~14 m: small clumps, denser near the barriers
      for (let k = 0; k < 2; k++) {
        const q0 = R(), q1 = R(), q2 = R(), o = bar + 1 + Math.pow(q1, 1.4) * 13;
        if (q0 > 0.62 - 0.25 * (o - bar) / 14) continue;
        const [x, z] = at(i, sd, o, (q2 - 0.5) * 3), q = nrNear(x, z);
        if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 6 || Math.abs(q.lat) < bar + 0.7 || nrLC(x, z) !== 3 || bad(x, z) || slope(x, z) > 0.8 || Math.abs(nrGround(x, z) - T.hy[i]) > 4) continue;
        const r = R();
        if (r < 0.5) { soil(soft, gV, x, z, 0.8 + R() * 1.3, vary(mix3(EJ.ochre, EJ.dust, 0.25 + R() * 0.45), R, 0.015), R, 0.05); st.zaplate++; }
        if (r > 0.3) for (let j = 0, n = 1 + Math.floor(R() * 3); j < n; j++) {
          const tx = x + (R() - 0.5) * 2.6, tz = z + (R() - 0.5) * 2.6, h = R(), tq = nrNear(tx, tz);
          if (bad(tx, tz) || tq.i < 0 || Math.abs(tq.lat) < bar + 0.5) continue;
          tuft(soft.get(tx, tz), tx, gV(tx, tz), tz, 0.24 + h * 0.22, 0.24 + h * 0.28, vary(mix3(EJ.halfa, EJ.halfa2, R()), R, 0.025), R, 5); st.halfa++;
        }
        if (R() < 0.3) { const sx = x + (R() - 0.5) * 2.4, sz = z + (R() - 0.5) * 2.4, s = R(), sq = nrNear(sx, sz);
          if (!bad(sx, sz) && sq.i >= 0 && Math.abs(sq.lat) > bar + 0.5) { cushion(soft.get(sx, sz), sx, gV(sx, sz), sz, 0.18 + s * 0.26, 0.1 + s * 0.12, vary(mix3(EJ.stone, EJ.stone2, R()), R, 0.02), R); st.kamni++; } }
      }
    }
    soft.done();
    return st;
  };
  {
    const base = World.ext.eljemRob;   // (js/world-chase-bt81.js's, which calls bt56's, bt38's and the builder's first)
    if (base) World.ext.eljemRob = (ctx) => {
      const r = base(ctx) || {};
      try { if (ctx && ctx.root && ctx.matV) r.robBt109 = ejRob(ctx); } catch (e) { console.error('chase-bt109 (eljem):', e); }
      return r;
    };
  }
})();
