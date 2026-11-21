/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the thirty-eighth group of the real tracks, a second pass: Canaries
   (a pass-builder road, js/world-prelaz.js) and El Jem (its own builder, js/world-eljem.js). The eighth group (js/world-chase-bt8.js) gave
   Canaries a few tufts and bushes within ~16 m and js/world-realizem-bt4.js gave El Jem sparse straw tufts within ~30 m; from behind the car
   both still showed one even face on each side: on Canaries the verge to the barrier line in one pale brown and the forest's slope in one
   green, on El Jem the strip to the concrete barriers and the open ground behind them in one ochre. So here, as the twenty-sixth and the
   thirty-seventh groups did: on the strip low patches of what lies there and tufts at the barrier's foot, behind it the bank or the open
   ground to ~10 m, and out to ~55 m a sparse band of wide low patches on the terrain. All of it in meshes of their own (no shadow); the
   terrain, the road, the barriers, the houses, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API, LK = API.PL_LOOK;
  if (!BT || !BT.verge || !BT.bank || !BT.muted || !BT.chain || !BT.soil || !BT.softScen || !rng || !vary) return;
  const { soil, tuft, softScen, mix3, chain, verge, bank, muted } = BT;

  /* a sparse outer band: every `step` m on both sides a wide low patch between `from` m past the barrier line and `to` m, only where this
     leg's road is the nearest, not in `bad`, not far below the road (C.drop: the sea under a cliff, a gorge) and not steeper than C.maxSl */
  const band = (root, matV, gT, near, bad, seed, C) => {
    const T = API.T, st = { pas: 0 };
    if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + r1 * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10) continue;   // (another leg's road is nearer: its own band)
      if (bad(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop) || slope(x, z) > C.maxSl) continue;
      const P = C.patch(R, o); soil(soft, gT, x, z, P.r, P.col, R, 0.06); st.pas++;
    }
    soft.done();
    return st;
  };

  /* ---- Canaries: docs/proge/canaries.md: »gost listnat gozd …, palme, grmovje in trava po rabi tal …; rdeče-rjava prst v vsekih,
     sivo-rjav andezit v pečinah«, »prst, ki jo dež spere na cesto«. On the verge the red-brown earth washed down, the andesite's grit and
     the lush grass; at the barrier's foot tufts of it. On the bank above the road the red-brown earth of the cuttings, the forest's brown
     leaf litter, the grass, tufts and the dark bushes of the undergrowth; out to ~55 m wide patches of the litter and the grass under the
     forest, the red earth showing through ---- */
  const CNV = { step: 3.4, share: 0.6, foot: 0.25,
    patch: (R) => { const r = R();
      return r < 0.4 ? { col: vary(mix3([0.54, 0.43, 0.31], [0.57, 0.45, 0.33], R()), R, 0.015), r: 0.9 + R() * 1.1 }   // (red-brown earth)
        : r < 0.7 ? { col: vary(mix3([0.46, 0.52, 0.28], [0.5, 0.54, 0.3], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (lush grass)
        : { col: vary(mix3([0.56, 0.53, 0.45], [0.6, 0.56, 0.47], R()), R, 0.015), r: 0.7 + R() * 0.9 }; },   // (andesite grit)
    tuft: (R) => vary(mix3([0.26, 0.44, 0.15], [0.34, 0.5, 0.2], R()), R, 0.03) };
  const CNB = { step: 4.5, n: 2, reach: 8, share: 0.7, maxSl: 1.6, sl: 1.0, bushShare: 0.35,
    patch: (R, sl) => { const r = R();
      return sl > 0.9 && r < 0.55 ? { col: vary(mix3([0.54, 0.42, 0.3], [0.57, 0.44, 0.32], R()), R, 0.015), r: 0.9 + R() * 1.1 }   // (the cutting's red earth)
        : r < 0.45 ? { col: vary(mix3([0.5, 0.45, 0.33], [0.53, 0.47, 0.35], R()), R, 0.015), r: 1.0 + R() * 1.3 }   // (leaf litter)
        : { col: vary(mix3([0.44, 0.51, 0.27], [0.48, 0.53, 0.29], R()), R, 0.015), r: 1.0 + R() * 1.2 }; },   // (grass)
    tuft: (R) => vary(mix3([0.26, 0.44, 0.15], [0.34, 0.5, 0.2], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.18, 0.33, 0.13] : [0.22, 0.37, 0.16], R, 0.025) };   // (the undergrowth: green, not dark)
  const CNF = { step: 6, share: 0.45, from: 8, to: 55, drop: 6, maxSl: 1.3,
    patch: (R, o) => { const r = R(), k = 1 + 0.5 * Math.min(1, (o - 8) / 47);
      return r < 0.45 ? { col: vary(mix3([0.5, 0.46, 0.34], [0.53, 0.48, 0.36], R()), R, 0.015), r: (1.6 + R() * 1.5) * k }   // (leaf litter)
        : r < 0.8 ? { col: vary(mix3([0.45, 0.5, 0.28], [0.48, 0.52, 0.3], R()), R, 0.015), r: (1.6 + R() * 1.6) * k }   // (grass)
        : { col: vary([0.55, 0.44, 0.32], R, 0.015), r: (1.2 + R() * 1.2) * k }; } };   // (the red earth showing through)
  if (LK && LK.canaries) chain(LK.canaries, (ctx) => {
    if (!ctx.out) return;
    const gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    ctx.out.robBt38 = verge(ctx.root, ctx.matV, gT, 38101, muted(CNV));
    ctx.out.bregBt38 = bank(ctx.root, ctx.matV, gT, ex, 38102, muted(CNB));
    ctx.out.pasBt38 = band(ctx.root, ctx.matV, gT, API.vrNear, ex, 38103, muted(Object.assign({ tuft: () => [0, 0, 0] }, CNF)));
  });

  /* ---- El Jem: docs/proge/eljem.md: »oljke in palme na suhih okrastih tleh, betonske ločilne ograje mestnih cest«. On the strip between
     the asphalt and the barriers the dust and sand blown to them, the ochre ground and the dry grass; at the barriers' foot low straw
     tufts. Behind the barriers to ~10 m on open ground (not built: ESA WorldCover) the ochre earth, the pale dust and the olive groves'
     ploughed brown; out to ~55 m wide patches of the same, so the Sahel's dry ground reads as ground, not one colour ---- */
  const EJ = {
    dust: (R) => vary(mix3([0.74, 0.58, 0.4], [0.77, 0.6, 0.42], R()), R, 0.015),
    ochre: (R) => vary(mix3([0.66, 0.49, 0.32], [0.69, 0.51, 0.33], R()), R, 0.015),
    plough: (R) => vary(mix3([0.6, 0.44, 0.3], [0.63, 0.46, 0.31], R()), R, 0.015),
    straw: (R) => vary(mix3([0.68, 0.58, 0.37], [0.71, 0.6, 0.38], R()), R, 0.015),
    tuft: (R) => vary(mix3([0.66, 0.62, 0.38], [0.58, 0.58, 0.32], R()), R, 0.03),
  };
  const ejPatch = (R) => { const r = R(); return r < 0.35 ? EJ.ochre(R) : r < 0.6 ? EJ.dust(R) : r < 0.82 ? EJ.plough(R) : EJ.straw(R); };
  const ejRob = ({ scen, excluded, inFort }) => {
    const T = API.T, { nrGround, nrLC, nrNear } = API, st = { zaplate: 0, sopi: 0, breg: 0, bregSopi: 0, pas: 0 };
    if (!T || !T.br || !T.wAt || !nrGround || !nrLC || !nrNear || !scen) return st;
    const ex = excluded || (() => false), fort = inFort || (() => false);
    const R = rng(38201), N = T.px.length, step = Math.max(1, Math.round(3 / T.ds)), farS = Math.max(1, Math.round(6 / T.ds));
    // (the builder's verge, vergeRow: w 0, w + 0.8 -0.04, to the barrier line - 0.3 at -0.08 lifted onto the ground, + 0.8 at -0.16, + 3.2 at -0.4)
    const prof = (i, o, side) => { const w = T.wAt(i), b = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i];
      const lift = (oo, h) => { const q = side * oo; return [oo, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y)]; };
      const Pp = [[w, 0], [w + 0.8, -0.04], lift(Math.max(w + 1.2, b - 0.3), -0.08), lift(b + 0.8, -0.16), lift(b + 3.2, -0.4)];
      if (o <= Pp[0][0]) return 0; for (let k = 1; k < Pp.length; k++) if (o <= Pp[k][0]) { const t = (o - Pp[k - 1][0]) / Math.max(0.01, Pp[k][0] - Pp[k - 1][0]); return Pp[k - 1][1] + (Pp[k][1] - Pp[k - 1][1]) * t; }
      return null; };
    const gV = (x, z) => { const q = nrNear(x, z), g = nrGround(x, z); if (q.i < 0) return g; const side = q.lat < 0 ? -1 : 1, h = prof(q.i, Math.abs(q.lat), side);
      return h == null ? g : Math.max(T.hy[q.i] + h + 0.02, g - 0.02); };
    const own = (x, z, i, lo, hi) => { const q = nrNear(x, z), o = Math.abs(q.lat); return q.i >= 0 && Math.abs(q.i - i) * T.ds < 12 && o > lo && o < hi; };
    const slope = (x, z) => { const d = 0.8, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    const bad = (x, z) => ex(x, z) || fort(x, z) || nrLC(x, z) === 3 || nrLC(x, z) === 5;
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + 0.9, e1 = bar - 0.35, r0 = R(), r1 = R(), r2 = R(), r3 = R();
      if (e1 - e0 > 0.7 && r0 < 0.5) {   // a patch on the strip
        const o = e0 + r1 * (e1 - e0), [x, z] = at(i, sd, o, (r2 - 0.5) * 2), rr = Math.min(0.7 + R() * 0.9, (e1 - e0) * 0.5 + 0.2, o - e0 + 0.35, e1 - o + 0.35);
        if (rr > 0.3 && own(x, z, i, e0 - 0.1, e1 + 0.1) && !ex(x, z) && !fort(x, z)) { soil(scen, gV, x, z, rr, R() < 0.55 ? EJ.dust(R) : EJ.ochre(R), R, 0.04); st.zaplate++; }
      }
      if (r3 < 0.22) for (let q = 0, n = 1 + Math.floor(R() * 3); q < n; q++) {   // tufts at the barriers' foot
        const o = e1 - 0.05 - R() * 0.3, [x, z] = at(i, sd, o, (R() - 0.5) * 2.4);
        if (!own(x, z, i, e0, bar - 0.25) || ex(x, z)) continue;
        const h = R(); tuft(scen.get(x, z), x, gV(x, z), z, 0.2 + h * 0.16, 0.22 + h * 0.2, EJ.tuft(R), R, 5); st.sopi++; }
      for (let k = 0; k < 2; k++) {   // behind the barriers to ~10 m on the open ground
        const q0 = R(), q1 = R(), q2 = R(), o = bar + 1.0 + Math.pow(q1, 1.3) * 9, [x, z] = at(i, sd, o, (q2 - 0.5) * 2.8);
        if (!own(x, z, i, bar + 0.7, 1e9) || bad(x, z) || slope(x, z) > 0.9 || Math.abs(nrGround(x, z) - T.hy[i]) > 4) continue;
        if (q0 < 0.65) { soil(scen, nrGround, x, z, 0.9 + R() * 1.2, ejPatch(R), R, 0.05); st.breg++; }
        else { const h = R(); tuft(scen.get(x, z), x, nrGround(x, z), z, 0.24 + h * 0.2, 0.26 + h * 0.24, EJ.tuft(R), R, 5); st.bregSopi++; }
      }
    }
    for (let i = 0; i < N; i += farS) for (const sd of [-1, 1]) {   // out to ~55 m: wide low patches on the open ground
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.6) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + 9 + r1 * 44, [x, z] = at(i, sd, o, (r2 - 0.5) * 6), q = nrNear(x, z);
      if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || q.dd < 6 || bad(x, z) || slope(x, z) > 0.8) continue;
      const k = 1 + 0.5 * (o - bar - 9) / 44; soil(scen, nrGround, x, z, (1.5 + R() * 1.5) * k, ejPatch(R), R, 0.06); st.pas++;
    }
    return st;
  };
  {
    const base = World.ext && World.ext.eljemRob;
    if (World.ext) World.ext.eljemRob = (ctx) => {
      const r = (base ? base(ctx) : null) || {};
      try {
        if (ctx && ctx.root && ctx.matV) {   // (in a mesh of its own that casts no shadow)
          const soft = softScen(ctx.root, ctx.matV);
          r.robBt38 = ejRob(Object.assign({}, ctx, { scen: soft }));
          soft.done();
        } else if (ctx && ctx.scen) r.robBt38 = ejRob(ctx);
      } catch (e) { console.error('chase-bt38 (eljem):', e); }
      return r;
    };
  }
})();
