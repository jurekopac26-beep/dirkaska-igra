/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the forty-third group of the real tracks: Luanda and Portobelo, a
   second pass on the two city roads whose ground the twenty-second and twenty-third groups (js/world-chase-bt22.js, js/world-chase-bt23.js:
   three bands past the barrier) already set. From behind the car both still showed one even face beside the asphalt: in Luanda the dusty
   strip to the concrete separator in one light sand, in Portobelo the strip to the barrier in one olive grey. So here, as the thirty-fifth
   group did on Mombasa (a builder of the same kind): the strip and the bank walked with the builder's nearest road point (nrNear), ground
   (nrGround) and verge cross-section (vergeRow: the patches lie on the verge as drawn), and out to ~55 m a sparse band of wide low patches.
   What lies where follows docs/proge/luanda.md and docs/proge/portobelo.md. Nothing within 0.35 m of the barrier on the road's side,
   nothing where another leg's road is nearer, in the builders' excluded places (houses, yards, squares), by the sea, at the fortress or (in
   Portobelo) in the forest's glades. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the
   verges, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;

  /* a sparse outer band: every `step` m on both sides a wide low patch between `from` m past the barrier and `to` m, only where the
     ground there is not far below the road (the patches lie on the meadow the camera sees, not in a valley under a fill), its slope under
     maxSl, outside the builder's excluded places and where no other leg is nearer */
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

  const strip = (ctx, bad, seed, V, B) => {
    const T = API.T, { nrGround, nrNear } = API, st = { zaplate: 0, sopi: 0, breg: 0, bregSopi: 0, bregGrmi: 0 };
    if (!T || !T.br || !T.wAt || !nrGround || !nrNear || !ctx.root || !ctx.out || !ctx.out.matV) return st;
    const R = rng(seed), soft = softScen(ctx.root, ctx.out.matV), N = T.px.length, step = Math.max(1, Math.round(3 / T.ds));
    const prof = (i, o, side) => { const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i];
      const P = [[w, 0], [w + 0.8, -0.04], [Math.max(w + 1.2, bar - 0.3), -0.08], [bar + 0.8, -0.16], [bar + 3.2, -0.4]];
      if (o <= P[0][0]) return 0; for (let k = 1; k < P.length; k++) if (o <= P[k][0]) { const t = (o - P[k - 1][0]) / Math.max(0.01, P[k][0] - P[k - 1][0]); return P[k - 1][1] + (P[k][1] - P[k - 1][1]) * t; }
      return null; };
    const gV = (x, z) => { const q = nrNear(x, z), g = nrGround(x, z); if (q.i < 0) return g; const side = q.lat < 0 ? -1 : 1, h = prof(q.i, Math.abs(q.lat), side);
      return h == null ? g : Math.max(T.hy[q.i] + h, g + 0.06) - 0.02; };
    const slope = (x, z) => { const d = 0.8, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const own = (x, z, i, lo, hi) => { const q = nrNear(x, z), o = Math.abs(q.lat); return q.i >= 0 && Math.abs(q.i - i) * T.ds < 12 && o > lo && o < hi; };
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + 0.9, e1 = bar - 0.35;
      const at = (o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
      if (e1 - e0 > 0.9) {   // the strip between the asphalt and the separator
        const r0 = R(), r1 = R(), r2 = R(), r3 = R();
        if (r0 < V.share) { const o = e0 + r1 * (e1 - e0), [x, z] = at(o, 0), P = V.patch(R), rr = Math.min(P.r, (e1 - e0) * 0.5, o - e0 + 0.4, e1 - o + 0.4);
          if (rr > 0.3 && own(x, z, i, w + 0.5, bar - 0.3) && !bad(x, z)) { soil(soft, gV, x, z, rr, P.col, R, 0.05); st.zaplate++; } }
        if (r2 < V.foot) for (let k = 0, n = 1 + Math.floor(r3 * 3); k < n; k++) { const [x, z] = at(e1 - 0.15 - R() * 0.4, (R() - 0.5) * 2.4);
          if (!own(x, z, i, w + 0.5, bar - 0.3) || bad(x, z)) continue;
          const h = R(); tuft(soft.get(x, z), x, gV(x, z), z, 0.22 + h * 0.16, 0.24 + h * 0.22, V.tuft(R), R, 5); st.sopi++; }
      }
      for (let k = 0; k < B.n; k++) {   // the ground past the separator
        const r0 = R(), r1 = R(), r2 = R(), r3 = R(), o = bar + 0.4 + Math.pow(r1, 1.3) * B.reach, [x, z] = at(o, (r2 - 0.5) * 3);
        if (!own(x, z, i, bar + 0.35, 1e9) || bad(x, z) || slope(x, z) > B.maxSl) continue;
        const y = gV(x, z); if (!(y > T.hy[i] - 1.5)) continue;
        if (r0 < B.share) { const P = B.patch(R); soil(soft, gV, x, z, P.r, P.col, R, 0.05); st.breg++; }
        else if (slope(x, z) < B.sl && r3 < B.bushShare) { const h = R(); cushion(soft.get(x, z), x, y, z, 0.45 + h * 0.45, 0.3 + h * 0.3, B.bush(R), R); st.bregGrmi++; }
        else { const h = R(); tuft(soft.get(x, z), x, y, z, 0.26 + h * 0.2, 0.3 + h * 0.28, B.tuft(R), R, 5); st.bregSopi++; }
      }
    }
    soft.done();
    return st;
  };


  /* Luanda: docs/proge/luanda.md: »hiše, palme, okroglokrošnjata drevesa in baobabi na suhih rdečih tleh«, concrete separators, rocks and
     sand by the bay. On the strip to the separator the dry red laterite dust, the pale grey grit and dust off the asphalt, and the trees'
     fallen brown leaves; at the separator's foot dry grass in straw tufts (a few green). Past the barrier the red earth, straw grass and the
     bay's pale sand in patches, tufts, and low grey-green scrub where it is flat. Out to ~55 m wide patches of the same. The ground is
     saturated orange: colours kept in its hue and a little darker (a muted grey patch reads as a hole on it). */
  const LDV = { share: 0.65, foot: 0.3,
    patch: (R) => { const r = R();
      return r < 0.45 ? { col: vary(mix3([0.64, 0.4, 0.26], [0.68, 0.44, 0.28], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (red laterite dust)
        : r < 0.75 ? { col: vary(mix3([0.6, 0.52, 0.42], [0.63, 0.55, 0.45], R()), R, 0.015), r: 0.7 + R() * 0.8 }   // (grey grit and dust)
        : { col: vary([0.5, 0.38, 0.26], R, 0.015), r: 0.6 + R() * 0.7 }; },   // (fallen leaves)
    tuft: (R) => vary(R() < 0.75 ? mix3([0.7, 0.6, 0.36], [0.64, 0.54, 0.32], R()) : [0.44, 0.5, 0.26], R, 0.03) };
  const LDB = { n: 2, reach: 8, share: 0.65, maxSl: 1.2, sl: 0.6, bushShare: 0.3,
    patch: (R) => { const r = R();
      return r < 0.45 ? { col: vary(mix3([0.62, 0.38, 0.24], [0.66, 0.42, 0.27], R()), R, 0.015), r: 0.9 + R() * 1.2 }   // (red earth)
        : r < 0.8 ? { col: vary(mix3([0.6, 0.5, 0.32], [0.57, 0.47, 0.3], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (straw grass)
        : { col: vary([0.64, 0.52, 0.38], R, 0.015), r: 0.9 + R() * 1.0 }; },   // (pale sand)
    tuft: (R) => vary(mix3([0.7, 0.6, 0.36], [0.5, 0.52, 0.28], R()), R, 0.03),
    bush: (R) => vary(mix3([0.4, 0.46, 0.28], [0.46, 0.5, 0.3], R()), R, 0.025) };   // (grey-green scrub)
  const LDF = { step: 7, share: 0.5, from: 8, to: 55, drop: 8, maxSl: 0.9,
    patch: (R, o) => { const r = R(), k = 1 + 0.4 * (o - 8) / 47;   // (farther out wider, so they still read from the road)
      return r < 0.45 ? { col: vary(mix3([0.62, 0.38, 0.24], [0.66, 0.42, 0.27], R()), R, 0.015), r: (1.3 + R() * 1.3) * k }   // (red earth)
        : r < 0.85 ? { col: vary(mix3([0.6, 0.5, 0.32], [0.57, 0.47, 0.3], R()), R, 0.015), r: (1.3 + R() * 1.3) * k }   // (straw grass)
        : { col: vary([0.56, 0.42, 0.3], R, 0.015), r: (1.0 + R() * 1.0) * k }; } };   // (bare trodden earth)

  /* Portobelo: docs/proge/portobelo.md: »temne krošnje deževnega gozda in visoka drevesa nad zelenimi tlemi«, concrete barriers, dark rocks
     by the bay, wet tropics. On the strip to the barrier the short wet grass, the brown wet earth where it is worn and the forest's fallen
     leaves; at the barrier's foot lush green tufts. Past the barrier greener and lime grass, leaf litter and wet earth in patches, tufts,
     and low green bushes where it is flat. Out to ~55 m wide patches of the same (none near black: the darkest is a mid brown). */
  const PBV = { share: 0.7, foot: 0.35,
    patch: (R) => { const r = R();
      return r < 0.45 ? { col: vary(mix3([0.4, 0.5, 0.26], [0.44, 0.54, 0.28], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (short wet grass)
        : r < 0.75 ? { col: vary(mix3([0.46, 0.38, 0.28], [0.5, 0.41, 0.3], R()), R, 0.015), r: 0.7 + R() * 0.8 }   // (worn wet earth)
        : { col: vary([0.52, 0.4, 0.26], R, 0.015), r: 0.6 + R() * 0.7 }; },   // (fallen leaves)
    tuft: (R) => vary(mix3([0.3, 0.48, 0.2], [0.42, 0.56, 0.24], R()), R, 0.03) };
  const PBB = { n: 2, reach: 8, share: 0.6, maxSl: 1.3, sl: 0.7, bushShare: 0.35,
    patch: (R) => { const r = R();
      return r < 0.4 ? { col: vary(mix3([0.3, 0.45, 0.2], [0.33, 0.48, 0.22], R()), R, 0.015), r: 0.9 + R() * 1.2 }   // (green grass)
        : r < 0.7 ? { col: vary(mix3([0.38, 0.5, 0.24], [0.41, 0.52, 0.25], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (lime grass)
        : r < 0.88 ? { col: vary([0.52, 0.4, 0.26], R, 0.015), r: 0.8 + R() * 1.0 }   // (leaf litter)
        : { col: vary([0.44, 0.36, 0.27], R, 0.015), r: 0.7 + R() * 0.8 }; },   // (wet earth)
    tuft: (R) => vary(mix3([0.28, 0.46, 0.19], [0.4, 0.55, 0.23], R()), R, 0.03),
    bush: (R) => vary(mix3([0.26, 0.42, 0.18], [0.32, 0.48, 0.2], R()), R, 0.025) };
  const PBF = { step: 7, share: 0.5, from: 8, to: 55, drop: 8, maxSl: 0.9,
    patch: (R, o) => { const r = R(), k = 1 + 0.4 * (o - 8) / 47;
      return r < 0.4 ? { col: vary(mix3([0.3, 0.45, 0.2], [0.33, 0.48, 0.22], R()), R, 0.015), r: (1.3 + R() * 1.3) * k }   // (green grass)
        : r < 0.75 ? { col: vary(mix3([0.38, 0.5, 0.24], [0.41, 0.52, 0.25], R()), R, 0.015), r: (1.3 + R() * 1.3) * k }   // (lime grass)
        : { col: vary([0.5, 0.4, 0.27], R, 0.015), r: (1.0 + R() * 1.0) * k }; } };   // (leaf litter)

  /* the builders' hooks chained (after the earlier groups' ones); what they count in out.stats.rob.robBt43, pasBt43 */
  const hook = (name, seed, V, B, F, glade) => {
    const base = World.ext && World.ext[name];
    if (World.ext) World.ext[name] = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try {
        const { seaD, inFort, inGlade } = ctx, ex = ctx.excluded || (() => false);
        const bad = (x, z) => ex(x, z) || (seaD && seaD(x, z) > -4) || (inFort && inFort(x, z, 6)) || (glade && inGlade && inGlade(x, z));
        if (ctx.root && ctx.out) {
          r.robBt43 = strip(ctx, bad, seed, V, B);
          r.pasBt43 = band(ctx.root, ctx.out.matV, API.nrGround, API.nrNear, bad, seed + 2, F);
        }
      } catch (e) { console.error('chase-bt43 (' + name + '):', e); }
      return r;
    };
  };
  hook('luandaRob', 43101, LDV, LDB, LDF, false);
  hook('portobeloRob', 43201, PBV, PBB, PBF, true);
})();
