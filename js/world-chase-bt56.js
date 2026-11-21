/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fifty-sixth group of the real tracks, a second pass: Kildare
   (the shared circuit builder, js/world-rbring.js: its look's LK.extra chained) and El Jem (its own builder, js/world-eljem.js: after the
   thirty-eighth group's World.ext.eljemRob). From behind the car Kildare's verges were one even mown green from the gravel's edge to the
   fences and on to the horizon, the rallycross's gravel ending on the grass in a clean line; El Jem's asphalt met the ochre strip in a clean
   line too, and past the thirty-eighth group's band (~55 m) the open ground was bare.
   Kildare (docs/proge/kildare.md: »pašniki in žive meje«, gravel at ~58–130 m and ~582–817 m, the run-offs grass): along the gravel the
   stones thrown onto the verge and the grass worn to mud where the cars cut; along the tarmac, past the kerbs, the worn and the lush grass
   in patches; on the run-off clover and buttercup; behind the fences to ~60 m the rush tussocks of the wet hollows (the colMod's own wet
   noise), the unmown grass's tussocks and the flowering patches of the pasture.
   El Jem (docs/proge/eljem.md: »oljke in palme na suhih okrastih tleh«): the sand blown onto the asphalt's edge in thin drifts, the pale
   limestone stones on the open ground behind the barriers, the olive groves' plough furrows in rows (land cover 2) and out to ~62 m the
   halfa tussocks and wide low patches past the thirty-eighth group's band.
   All of it in meshes of their own (softScen: no shadow, no obstacle); the terrain, the road, the barriers, the houses, the trees, the
   horizon and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, sstep } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.walk || !BT.softScen || !BT.mix3 || !BT.rbEnv || !rng || !vary || !sstep) return;
  const { soil, tuft, cushion, walk, softScen, mix3, rbEnv } = BT;

  /* a thin low streak lying on the ground along (ax, az): `len` long, `wid` wide, tapering to both ends (a sand drift, a furrow, a spray
     of thrown stones) */
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

  /* ---- Kildare ---- */
  const KD = {
    stone: [0.53, 0.46, 0.37], stone2: [0.58, 0.51, 0.42], mud: [0.47, 0.42, 0.31], worn: [0.45, 0.51, 0.29], lush: [0.34, 0.5, 0.22],
    clover: [0.56, 0.66, 0.46], cup: [0.6, 0.64, 0.3], rush: [0.3, 0.42, 0.2], rushTip: [0.5, 0.5, 0.3], grass: [0.38, 0.52, 0.24], hay: [0.56, 0.56, 0.32],
  };
  const kdRob = (ctx) => {
    const T = API.T, { nrGround, nrLC, nrSlope, nrNear } = API, P = API.NR, st = { gramoz: 0, blato: 0, rob: 0, izlet: 0, sit: 0, sopi: 0, cvet: 0 };
    if (!T || !T.br || !T.sf || !nrGround || !nrLC || !nrSlope || !nrNear || !ctx.root || !(ctx.matV || (ctx.out && ctx.out.matV))) return st;
    const soft = softScen(ctx.root, ctx.matV || ctx.out.matV), ex = ctx.excluded || (() => false), R = rng(56101), N = T.px.length;
    const pd = T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, pitSide = (i, sd) => !!ps && sd === ps && !!T.pitAt(i * T.ds);
    // (the builder's verge, rbVerge: w 0, w + 1.2 -0.04, to the barrier line - 0.4 at -0.1, lifted onto the ground where it rises)
    const vY = (i, o, sd) => { const w = T.w, b = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], q = sd * o, g = nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q);
      const h = o <= w + 1.2 ? -0.04 * Math.max(0, o - w) / 1.2 : -0.04 - 0.06 * Math.min(1, (o - w - 1.2) / Math.max(0.5, b - 0.4 - w - 1.2));
      return Math.max(y + h, g + 0.06); };
    const own = (x, z, i) => { const q = nrNear(x, z); return q.i >= 0 && Math.abs(q.i - i) * T.ds < 10; };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    const step = Math.max(1, Math.round(2.5 / T.ds));
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      if (pitSide(i, sd)) continue;
      const w = T.w, bar = sd > 0 ? T.br[i] : T.bl[i], grav = T.sf[i] === 5, gY = (x, z) => { const q = nrNear(x, z); return q.i >= 0 ? vY(q.i, Math.abs(q.lat), q.lat < 0 ? -1 : 1) : nrGround(x, z) + 0.06; };
      if (grav) {   // the gravel thrown onto the verge in sprays along the edge, and the grass worn to mud where the cars cut
        for (let k = 0, n = 1 + (R() < 0.5 ? 1 : 0); k < n; k++) {
          const o = w + 0.1 + Math.pow(R(), 1.5) * 2.2, [x, z] = at(i, sd, o, (R() - 0.5) * 2.4);
          if (o > bar - 0.4 || !own(x, z, i) || ex(x, z)) continue;
          streak(soft, gY, x, z, T.tx[i], T.tz[i], 0.8 + R() * 1.4, 0.3 + R() * 0.45 * (1 - (o - w) / 3), vary(mix3(KD.stone, KD.stone2, R()), R, 0.02), R, 0.03); st.gramoz++;
        }
        if (R() < 0.3) { const o = w + 0.8 + R() * 3, [x, z] = at(i, sd, o, (R() - 0.5) * 2.4);
          if (o < bar - 0.5 && own(x, z, i) && !ex(x, z)) { soil(soft, gY, x, z, 0.5 + R() * 0.8, vary(R() < 0.6 ? KD.mud : KD.worn, R, 0.02), R, 0.035); st.blato++; } }
      } else if (R() < 0.35) {   // past the kerbs the worn and the lush grass in patches
        const o = w + 1.4 + R() * 2.6, [x, z] = at(i, sd, o, (R() - 0.5) * 2.4);
        if (o < bar - 0.5 && own(x, z, i) && !ex(x, z)) { soil(soft, gY, x, z, 0.5 + R() * 0.8, vary(R() < 0.55 ? KD.worn : KD.lush, R, 0.02), R, 0.035); st.rob++; }
      }
      if (bar - w > 7 && R() < 0.22) {   // on the run-off's grass clover and buttercup
        const o = w + 4 + R() * (bar - w - 4.6), [x, z] = at(i, sd, o, (R() - 0.5) * 2.4);
        if (own(x, z, i) && !ex(x, z) && nrSlope(x, z) < 0.8) { soil(soft, gY, x, z, 0.4 + R() * 0.6, vary(R() < 0.6 ? KD.clover : KD.cup, R, 0.02), R, 0.04); st.izlet++; }
      }
    }
    // behind the fences to ~60 m on the pasture (land cover 0 and 2): the rushes of the wet hollows (colMod's own wet noise), elsewhere the
    // unmown grass's tussocks and the flowering patches
    const wet = (x, z) => P ? sstep(0.62, 0.84, P.n1(x * 1.1 + 140, z * 1.1 - 260)) : 0;
    walk(rbEnv((x, z) => ex(x, z)), 56102, 5, 58, 1.2, (x, z) => { const c = nrLC(x, z); return (c === 0 || c === 2) && nrSlope(x, z) < 0.8 ? 0.55 : 0; }, (gx, gz, k, R2, free) => {
      const wt = wet(gx, gz);
      if (wt > 0.3) {   // a clump of rushes: tall, thin, dark green with straw tips
        for (let q = 0, n = 4 + Math.floor(R2() * 5); q < n; q++) {
          const x = gx + (R2() - 0.5) * 3, z = gz + (R2() - 0.5) * 3, h = R2(); if (!free(x, z, 3)) continue;
          tuft(soft.get(x, z), x, nrGround(x, z), z, 0.2 + h * 0.14, 0.5 + h * 0.35, vary(mix3(KD.rush, KD.rushTip, R2() * 0.35), R2, 0.025), R2, 5); st.sit++;
        }
        return;
      }
      if (R2() < 0.35 && free(gx, gz, 4)) { soil(soft, nrGround, gx, gz, 0.6 + R2() * 0.9, vary(R2() < 0.55 ? KD.cup : KD.clover, R2, 0.02), R2, 0.05); st.cvet++; }
      for (let q = 0, n = 2 + Math.floor(R2() * 3); q < n; q++) {
        const x = gx + (R2() - 0.5) * 5, z = gz + (R2() - 0.5) * 5, h = R2(); if (!free(x, z, 3)) continue;
        const dry = P ? sstep(0.45, 0.75, P.n3(x * 0.7 - 30, z * 0.7 + 80)) : 0.3;
        tuft(soft.get(x, z), x, nrGround(x, z), z, 0.3 + h * 0.3, 0.3 + h * 0.3, vary(mix3(KD.grass, KD.hay, Math.min(1, dry * 0.7 + R2() * 0.2)), R2, 0.025), R2, 5); st.sopi++;
      } });
    soft.done();
    return st;
  };
  const LK = (API.rbLook || {}).kildare;
  if (LK) {
    const base = LK.extra;
    LK.extra = function (ctx) {
      const r = base ? base.call(this, ctx) : null;
      if (API.THEME !== 'kildare') return r;
      try { const s = kdRob(ctx || {}); if (r && typeof r === 'object') r.robBt56 = s; } catch (e) { console.error('chase-bt56 (kildare):', e); }
      return r;
    };
  }

  /* ---- El Jem ---- */
  const EJ = {
    sand: [0.82, 0.7, 0.52], sand2: [0.78, 0.64, 0.45], stone: [0.8, 0.76, 0.67], stone2: [0.74, 0.69, 0.6],
    furrow: [0.6, 0.45, 0.31], ridge: [0.7, 0.55, 0.38], halfa: [0.7, 0.65, 0.42], halfa2: [0.62, 0.6, 0.36], ochre: [0.67, 0.5, 0.33], dust: [0.75, 0.6, 0.42],
  };
  const ejRob = (ctx) => {
    const T = API.T, { nrGround, nrLC, nrNear } = API, st = { pesek: 0, kamni: 0, brazde: 0, halfa: 0, pas: 0 };
    if (!T || !T.br || !T.wAt || !nrGround || !nrLC || !nrNear || !ctx.root || !ctx.matV) return st;
    const soft = softScen(ctx.root, ctx.matV), ex = ctx.excluded || (() => false), fort = ctx.inFort || (() => false), R = rng(56201), N = T.px.length;
    const bad = (x, z) => ex(x, z) || fort(x, z) || nrLC(x, z) === 3 || nrLC(x, z) === 5;
    const slope = (x, z) => { const d = 0.8, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    // (on the asphalt and the first 0.8 m of the strip: the road's height and the builder's -0.04 fall, js/world-chase-bt38.js's prof)
    const rY = (x, z) => { const q = nrNear(x, z); if (q.i < 0) return nrGround(x, z); const o = Math.abs(q.lat), w = T.wAt(q.i); return T.hy[q.i] - (o <= w ? 0 : 0.04 * Math.min(1, (o - w) / 0.8)); };
    const step = Math.max(1, Math.round(3 / T.ds));
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i];
      if (R() < 0.6) {   // the sand blown onto the asphalt's edge: a thin drift along it, over the edge line
        const o = w - 0.45 + R() * 0.6, [x, z] = at(i, sd, o, (R() - 0.5) * 2.4), q = nrNear(x, z);
        if (q.i >= 0 && Math.abs(q.i - i) * T.ds < 8 && !ex(x, z) && !fort(x, z)) { streak(soft, rY, x, z, T.tx[i], T.tz[i], 2 + R() * 3, 0.45 + R() * 0.5, vary(mix3(EJ.sand, EJ.sand2, R()), R, 0.015), R, 0.025); st.pesek++; }
      }
      if (R() < 0.4) for (let k = 0, n = 1 + Math.floor(R() * 3); k < n; k++) {   // pale limestone stones on the open ground behind the barriers
        const o = bar + 1 + Math.pow(R(), 1.3) * 12, [x, z] = at(i, sd, o, (R() - 0.5) * 3), q = nrNear(x, z);
        if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 6 || q.dd < 0.8 || bad(x, z) || slope(x, z) > 0.9) continue;
        const s = R(); cushion(soft.get(x, z), x, nrGround(x, z), z, 0.2 + s * 0.28, 0.12 + s * 0.12, vary(mix3(EJ.stone, EJ.stone2, R()), R, 0.02), R); st.kamni++;
      }
    }
    // the olive groves' plough furrows (land cover 2), 12-60 m out: three or four parallel rows, the grove's own way (one per ~40 m cell)
    const fs = Math.max(1, Math.round(7 / T.ds));
    for (let i = 0; i < N; i += fs) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.5) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + 12 + r1 * 46, [x, z] = at(i, sd, o, (r2 - 0.5) * 6), q = nrNear(x, z);
      if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || q.dd < 8 || nrLC(x, z) !== 2 || bad(x, z) || slope(x, z) > 0.6) continue;
      const cx = Math.floor(x / 40), cz = Math.floor(z / 40), a = ((Math.sin(cx * 12.9898 + cz * 78.233) * 43758.5453) % 1 + 1) % 1 * Math.PI, ax = Math.cos(a), az = Math.sin(a);
      for (let k = 0, n = 3 + Math.floor(R() * 2); k < n; k++) {
        const u = (k - (n - 1) / 2) * 1.3, px = x - az * u, pz = z + ax * u;
        if (bad(px, pz)) continue;
        streak(soft, nrGround, px, pz, ax, az, 4 + R() * 4, 0.45 + R() * 0.2, vary(k % 2 ? EJ.ridge : EJ.furrow, R, 0.015), R, 0.05); st.brazde++;
      }
    }
    // out to ~62 m, past the thirty-eighth group's band: the halfa's low tussocks and wide patches of the ochre and the dust
    const bs = Math.max(1, Math.round(6 / T.ds));
    for (let i = 0; i < N; i += bs) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.6) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + 48 + r1 * 14, [x, z] = at(i, sd, o, (r2 - 0.5) * 6), q = nrNear(x, z);
      if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || q.dd < 30 || bad(x, z) || slope(x, z) > 0.8) continue;
      if (R() < 0.5) { soil(soft, nrGround, x, z, 2 + R() * 2, vary(R() < 0.5 ? EJ.ochre : EJ.dust, R, 0.015), R, 0.06); st.pas++; }
      for (let k = 0, n = 2 + Math.floor(R() * 3); k < n; k++) {
        const tx = x + (R() - 0.5) * 6, tz = z + (R() - 0.5) * 6, h = R(); if (bad(tx, tz)) continue;
        tuft(soft.get(tx, tz), tx, nrGround(tx, tz), tz, 0.3 + h * 0.25, 0.3 + h * 0.3, vary(mix3(EJ.halfa, EJ.halfa2, R()), R, 0.025), R, 5); st.halfa++;
      }
    }
    soft.done();
    return st;
  };
  {
    const base = World.ext && World.ext.eljemRob;   // (js/world-chase-bt38.js's, which calls the builder's own first)
    if (World.ext && base) World.ext.eljemRob = (ctx) => {
      const r = base(ctx) || {};
      try { if (ctx && ctx.root && ctx.matV) r.robBt56 = ejRob(ctx); } catch (e) { console.error('chase-bt56 (eljem):', e); }
      return r;
    };
  }
})();
