/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventy-ninth group of the real tracks: Livorno and Lombok,
   a further pass on two tracks whose roadside the eighteenth and forty-eighth groups (js/world-chase-bt18.js, js/world-chase-bt48.js:
   Livorno's tufts at the walls' foot, the macchia and the band of patches to ~55 m) and the forty-sixth and fifty-ninth groups
   (js/world-chase-bt46.js, js/world-chase-bt59.js: Lombok's lawn patches, the worn line at the edge and the fence's foot, the straw band
   to ~55 m) already set. From behind the car two things still read as drawn: the asphalt's edge as one clean line, and on Livorno the
   verge between the asphalt and the low stone walls one smooth beige face (in the towns, where the first pass put nothing, all the way).
   So here, as the seventy-fifth group did (js/world-chase-bt75.js): on both the asphalt's edge in short streaks; on Livorno
   (docs/proge/livorno.md: the coast road between low stone walls, the macchia, the dust of the towns) the verge's dust and fine grit in
   streaks, low patches of the dry grass and, at the wall's foot, the weeds the brush cutter leaves (in the towns only dust and a few
   weeds); on Lombok (docs/proge/lombok.md: »trava slamnato zelena, z lisami rdeče prsti; tik ob progi zalite zelene trate«) the rubber
   and the red laterite dust on the edge and, past the kerbs where the cars run wide out of the corners, the worn grass and the earth
   showing in short scars along the line. Nothing on the driven asphalt's middle, the kerbs, the asphalt run-offs or the pits' side along
   the pits (Lombok), the bridges, the sea or the start's white walls (Livorno), nowhere another leg's road is nearer. All of it in
   meshes of its own (softScen: 256 m chunks, no shadow); the terrain, the road, the walls, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.softScen || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, softScen, mix3, chain } = BT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const C_ = (R, ab, j) => mute(vary(mix3(ab[0], ab[1], R()), R, j || 0.015));
  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };

  /* a thin low streak lying on the ground along (ax, az), tapering to both ends (the seventieth and seventy-fifth groups') */
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

  /* the height of the road and its verge at (x, z) from a builder's cross-section prof(i, sd) = [[offset, height above the road], …] */
  const profH = (T, near, prof, bankY) => (x, z) => {
    const q = near(x, z); if (q.i < 0) return null;
    const i = q.i, sd = q.lat >= 0 ? 1 : -1, o = Math.abs(q.lat), Q = prof(i, sd), w = T.wAt ? T.wAt(i) : T.w, bk = bankY ? bankY(i, sd * o) : 0;
    if (o < w) return T.hy[i] + bk + 0.012;
    let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++; const a = Q[k], b = Q[k + 1];
    return T.hy[i] + bk + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1);
  };

  /* ---- Livorno (js/world-livorno.js: goreRob(ctx, 'livorno', { gH, slope, lc, near, bad }); its verge vergeRow) ---- */
  const LV = {
    worn: [[0.62, 0.58, 0.5], [0.7, 0.65, 0.55]], dust: [[0.8, 0.73, 0.57], [0.86, 0.79, 0.63]],   // (the bleached asphalt's edge, the verge's pale dust)
    grit: [[0.5, 0.47, 0.42], [0.57, 0.53, 0.47]], straw: [[0.62, 0.56, 0.3], [0.7, 0.62, 0.35]], olive: [[0.38, 0.43, 0.22], [0.45, 0.48, 0.26]],
    earth: [[0.52, 0.42, 0.3], [0.58, 0.47, 0.33]], weed: [[0.34, 0.42, 0.2], [0.46, 0.5, 0.26]], weedD: [[0.62, 0.56, 0.32], [0.7, 0.62, 0.38]],
  };
  const livorno = (ctx, o) => {
    const T = API.T, out = ctx.out, st = { rob: 0, prah: 0, zaplate: 0, pleveli: 0 };
    if (!out || !out.matV || !ctx.root || !T || !T.br || !o || !o.near || !o.gH) return st;
    const near = o.near, gT = o.gH, lc = o.lc, N = T.px.length, ds = T.ds, ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || (o.bad ? o.bad(x, z) : false);
    const prof = (i, sd) => { const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (q, h) => [q, Math.max(h, gT(T.px[i] + T.nx[i] * sd * q, T.pz[i] + T.nz[i] * sd * q) + 0.06 - y)];
      return [[w, 0.0], [w + 0.8, -0.04], lift(Math.max(w + 1.2, bar - 0.3), -0.08), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)]; };
    const hP = profH(T, near, prof), hV = (x, z) => { const h = hP(x, z); return h == null ? gT(x, z) : h; };
    // (the start's white walls and the catch fence run from ~320 m before the line to ~140 m after it: js/world-livorno.js)
    const sAt = (i) => i * ds, s0 = T.startIdx != null ? T.startIdx * ds : 0, L = N * ds;
    const startArea = (i) => { let d = sAt(i) - s0; if (!T.open) { d = ((d % L) + L) % L; if (d > L / 2) d -= L; } return d > -330 && d < 150; };
    const R = rng(79101), soft = softScen(ctx.root, out.matV), step = 3;
    for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) {
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], a = () => (R() - 0.5) * step;
      if (startArea(i)) { R(); R(); R(); R(); continue; }
      const at = (q, b) => [T.px[i] + T.nx[i] * sd * q + T.tx[i] * b, T.pz[i] + T.nz[i] * sd * q + T.tz[i] * b];
      const own = (x, z, lo, hi) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * ds < 6 && q.lat * sd > 0 && Math.abs(q.lat) > lo && Math.abs(q.lat) < hi && !bad(x, z); };
      const town = lc ? lc(T.px[i] + T.nx[i] * sd * (bar + 2), T.pz[i] + T.nz[i] * sd * (bar + 2)) === 3 : false;
      // the asphalt's edge: the grit and the crumbled asphalt just past the edge line
      if (R() < 0.55) { const [x, z] = at(w + 0.12 + R() * 0.2, a()); if (own(x, z, w - 0.1, w + 0.6)) { streak(soft, hV, x, z, T.tx[i], T.tz[i], 1.5 + R() * 3.0, 0.25 + R() * 0.25, C_(R, R() < 0.6 ? LV.grit : LV.worn), R, 0.014, 4); st.rob++; } }
      else R();
      const vw = bar - 0.35 - (w + 0.1); if (vw < 0.3) { R(); R(); continue; }
      // the verge: the dust and the fine grit in streaks, in the open the dry grass in low patches
      if (R() < 0.85) { const [x, z] = at(w + 0.4 + R() * Math.max(0.1, vw - 0.3), a());
        if (own(x, z, w + 0.05, bar - 0.25)) { const u = R();
          if (town || u < 0.45) { streak(soft, hV, x, z, T.tx[i], T.tz[i], 2.0 + R() * 3.5, Math.min(vw, 0.5 + R() * 0.7), C_(R, R() < 0.6 ? LV.dust : LV.grit, 0.02), R, 0.012, 3); st.prah++; }
          else { const r = Math.min(vw * 0.5 + 0.2, 0.8 + R() * 0.9); soil(soft, hV, x, z, r, C_(R, u < 0.8 ? LV.straw : u < 0.92 ? LV.olive : LV.earth), R, 0.03); st.zaplate++; } } }
      else R();
      // the weeds at the wall's foot (sparser in the towns)
      if (R() < (town ? 0.15 : 0.5)) { const [x, z] = at(bar - 0.22 - R() * 0.3, a());
        if (own(x, z, w + 0.3, bar - 0.1)) { const h = R(); tuft(soft.get(x, z), x, hV(x, z), z, 0.3 + h * 0.25, 0.35 + h * 0.4, C_(R, h < 0.5 ? LV.weed : LV.weedD, 0.03), R, 5); st.pleveli++; } }
    }
    soft.done();
    return st;
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.apply(this, arguments);
      if (id === 'livorno') try { const s = livorno(ctx, o || {}); if (ctx.out) ctx.out.robBt79 = s; } catch (e) { console.error('chase-bt79 (livorno):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }

  /* ---- Lombok (js/world-rbring.js with its look's extra chained, as the forty-sixth group; the verge rbVerge) ---- */
  const LB = {
    rubber: [[0.24, 0.24, 0.25], [0.29, 0.29, 0.3]], red: [[0.55, 0.34, 0.25], [0.6, 0.38, 0.28]],   // (the rubber and the laterite dust on the edge)
    scar: [[0.4, 0.36, 0.22], [0.46, 0.41, 0.25]], earth: [[0.55, 0.32, 0.22], [0.6, 0.36, 0.25]], thin: [[0.52, 0.53, 0.28], [0.58, 0.57, 0.32]],
  };
  const lombok = (ctx) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear } = API, st = { rob: 0, brazgotine: 0 };
    if (!root || !matV || !T || !T.br || !nrGround || !nrNear || (T.def && T.def.id !== 'lombok')) return st;
    const bankY = API.nrBankY || (() => 0), N = T.px.length, w = T.w, cw = T.curbW || 1, ds = T.ds;
    const pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const pit = (i, sd) => !!pd && sd === PSD && pitI(i);
    const ro = (i, sd, mm) => { const gv = sd > 0 ? T.gravR : T.gravL; if (!gv) return false; const m = Math.round((mm || 30) / ds);
      for (let d = -m; d <= m; d += Math.max(1, Math.round(4 / ds))) if (gv[(i + d + N) % N]) return true; return false; };
    const prof = (i, sd) => { const bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], bk = (q) => bankY(i, sd * q), lift = (q, h) => [q, Math.max(h, nrGround(T.px[i] + T.nx[i] * sd * q, T.pz[i] + T.nz[i] * sd * q) + 0.06 - y - bk(q))];
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)]; };
    const hP = profH(T, nrNear, prof, bankY), hV = (x, z) => { const h = hP(x, z); return h == null ? nrGround(x, z) : h; };
    const R = rng(79201), soft = softScen(root, matV), step = 3;
    // where the cars run wide: the outside of a corner, from its apex to ~60 m past it (the curvature still high a few metres back)
    const kAt = (i) => T.k ? T.k[(i + N) % N] : 0;
    const wide = (i, sd) => { const back = Math.round(40 / ds); for (let d = 0; d <= back; d += Math.max(1, Math.round(5 / ds))) { const k = kAt(i - d); if (Math.abs(k) > 1 / 90 && sd * k < 0) return true; } return false; };
    for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) {
      const a = () => (R() - 0.5) * step;
      if (pit(i, sd) || ro(i, sd, 6)) { R(); R(); continue; }
      const far = !ro(i, sd);   // (the asphalt's edge only clear of the run-offs by ~30 m, as the forty-sixth group)
      const bar = sd > 0 ? T.br[i] : T.bl[i], kerb = T.curb && T.curb[i] ? cw : 0.05;
      const at = (q, b) => [T.px[i] + T.nx[i] * sd * q + T.tx[i] * b, T.pz[i] + T.nz[i] * sd * q + T.tz[i] * b];
      const own = (x, z, lo, hi) => { const q = nrNear(x, z); return q.i >= 0 && gap(q.i, i, N) * ds < 6 && q.lat * sd > 0 && Math.abs(q.lat) > lo && Math.abs(q.lat) < hi && !excluded(x, z); };
      // the asphalt's edge: the rubber off the cars and the laterite dust blown onto it
      if (R() < 0.45 && far) { const [x, z] = at(w - 0.12 - R() * 0.2, a());
        if (own(x, z, w - 0.45, w + 0.05)) { streak(soft, hV, x, z, T.tx[i], T.tz[i], 1.5 + R() * 3.0, 0.16 + R() * 0.16, C_(R, R() < 0.55 ? LB.rubber : LB.red), R, 0.008, 3); st.rob++; } }
      else R();
      // past the kerb on the outside of a corner's exit: the worn grass and the earth in short scars along the line
      if ((wide(i, sd) || (T.curb && T.curb[i])) && R() < 0.55) { const lo = w + kerb + 0.15, hi = Math.min(bar - 0.5, lo + 3.2);
        if (hi - lo > 0.4) { const [x, z] = at(lo + Math.pow(R(), 1.4) * (hi - lo), a());
          if (own(x, z, lo - 0.1, hi + 0.1)) { const u = R(); streak(soft, hV, x, z, T.tx[i], T.tz[i], 3.0 + R() * 4.0, 0.4 + R() * 0.5, C_(R, u < 0.45 ? LB.scar : u < 0.75 ? LB.thin : LB.earth, 0.02), R, 0.015, 4); st.brazgotine++; } } }
      else R();
    }
    soft.done();
    if (ctx.out) ctx.out.robBt79 = st;
    return st;
  };
  const LL = (API.rbLook || {}).lombok;
  if (LL && chain) chain(LL, (ctx) => { try { lombok(ctx); } catch (e) { console.error('chase-bt79 (lombok):', e); } });
})();
