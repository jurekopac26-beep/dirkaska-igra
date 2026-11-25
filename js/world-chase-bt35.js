/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the thirty-fifth group of the real tracks: Medeu and Mombasa, a
   second pass on the two roads whose ground the twentieth group (js/world-chase-bt20.js: Medeu's granite ribs, tussocks and juniper)
   and the twenty-second group (js/world-chase-bt22.js: Mombasa's three bands) already set. From behind the car both still showed one even
   face beside the asphalt: on Medeu the verge to the steel barrier in one pale grey and, past it, the meadow in one smooth yellow-green to
   the spruce; on Mombasa the dusty strip to the concrete separator in one light brown and the reddish ground past it in one colour.
   So here: on Medeu (Vršič's corridor, js/world-prelaz.js) the twenty-fourth and twenty-fifth groups' strip and bank (BT.verge, BT.bank)
   and, out to ~55 m, a sparse band of wide low patches on the meadow, so the slope reads as grazed meadow, dry grass, bare earth and
   grey-pink granite grit, not as one colour; on Mombasa (a builder of its own, js/world-mombasa.js) the same strip and bank walked with
   the builder's nearest road point (nrNear), ground (nrGround) and verge cross-section (vergeRow: the patches lie on the verge as drawn).
   What lies where follows docs/proge/medeu.md and docs/proge/mombasa.md. Nothing within 0.35 m of the barrier line on the road's side,
   nothing where another leg's road is nearer, in the builders' excluded places (Medeu's lookouts and car parks, Mombasa's houses, yards
   and squares), by the sea or at the fortress. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the
   road, the verges, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API, LK = API.PL_LOOK;
  if (!BT || !BT.verge || !BT.bank || !BT.muted || !BT.chain || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, chain, verge, bank, muted, soil, softScen, tuft, cushion } = BT;

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

  /* Medeu: docs/proge/medeu.md: late summer, »rumeneče gorske livade z divjo jablano, glogom in brinjem«, on the shady slopes Tian Shan
     spruce, »siv granit z rožnatim odtenkom«, steel barriers. On the verge the shoulder's grey-pink granite grit, short grass going to
     straw and bare brown earth; at the barrier's foot the meadow's yellowing tufts. On the bank the meadow in greener and straw patches,
     the granite's scree on the steeper parts, tufts, and low juniper and hawthorn cushions (green, never near black). Out to ~55 m wide
     patches of the meadow's own shades (grazed green, dry straw, bare earth by the paths, grey-pink grit where the rock comes through). */
  const MDV = { step: 3.2, share: 0.6, foot: 0.2,
    patch: (R) => { const r = R();
      return r < 0.4 ? { col: vary(mix3([0.6, 0.56, 0.54], [0.64, 0.58, 0.56], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (grey-pink granite grit)
        : r < 0.78 ? { col: vary(mix3([0.6, 0.57, 0.36], [0.64, 0.6, 0.38], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (short grass going to straw)
        : { col: vary([0.5, 0.42, 0.33], R, 0.015), r: 0.7 + R() * 0.8 }; },   // (bare brown earth)
    tuft: (R) => vary(mix3([0.62, 0.58, 0.34], [0.48, 0.53, 0.27], R()), R, 0.03) };
  const MDB = { step: 4.5, n: 3, reach: 9, share: 0.7, maxSl: 1.5, sl: 0.8, bushShare: 0.25,
    patch: (R, sl) => { const r = R();
      return sl > 0.85 && r < 0.55 ? { col: vary(mix3([0.6, 0.56, 0.54], [0.66, 0.6, 0.58], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (granite scree)
        : r < 0.5 ? { col: vary(mix3([0.52, 0.54, 0.34], [0.55, 0.56, 0.36], R()), R, 0.015), r: 1.0 + R() * 1.3 }   // (meadow, greener)
        : { col: vary(mix3([0.66, 0.6, 0.37], [0.6, 0.56, 0.34], R()), R, 0.015), r: 1.0 + R() * 1.2 }; },   // (meadow, yellowing)
    tuft: (R) => vary(mix3([0.64, 0.59, 0.36], [0.47, 0.52, 0.27], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.3, 0.38, 0.24] : [0.38, 0.42, 0.26], R, 0.025) };   // (juniper, hawthorn)
  const MDF = { step: 7, share: 0.6, from: 9, to: 55, drop: 14, maxSl: 0.9,
    patch: (R, o) => { const r = R(), k = 1 + 0.4 * (o - 9) / 46;   // (farther out wider, so they still read from the road)
      return r < 0.4 ? { col: vary(mix3([0.53, 0.55, 0.35], [0.5, 0.53, 0.33], R()), R, 0.015), r: (1.2 + R() * 1.2) * k }   // (grazed meadow)
        : r < 0.78 ? { col: vary(mix3([0.66, 0.62, 0.44], [0.62, 0.59, 0.41], R()), R, 0.015), r: (1.2 + R() * 1.4) * k }   // (dry straw)
        : r < 0.9 ? { col: vary([0.52, 0.44, 0.34], R, 0.015), r: (0.9 + R() * 0.8) * k }   // (bare earth by the paths)
        : { col: vary([0.62, 0.57, 0.55], R, 0.015), r: (0.9 + R() * 0.9) * k }; } };   // (grey-pink grit, rock coming through)
  if (LK && LK.medeu) chain(LK.medeu, (ctx) => {
    if (!ctx.out) return;
    const gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    ctx.out.robBt35 = verge(ctx.root, ctx.matV, gT, 35101, muted(MDV));
    ctx.out.bregBt35 = bank(ctx.root, ctx.matV, gT, ex, 35102, muted(MDB));
    ctx.out.pasBt35 = band(ctx.root, ctx.matV, gT, API.vrNear, ex, 35103, muted(Object.assign({ tuft: () => [0, 0, 0] }, MDF)));
  });

  /* Mombasa: docs/proge/mombasa.md: »palme in drevesa na rdečkastih tleh«, »ločilne ograje mestnih cest«, the island's coral rock by the
     fortress and the shore. On the strip to the concrete separator the dusty verge's reddish earth, the pale grey grit and dust off the
     asphalt and the tree's fallen brown leaves; at the separator's foot the coast's green grass in tufts (straw where it is dry). On the
     ground past the barrier the reddish earth, the green and the dry grass in patches, tufts, and low green bushes where it is flat. Out
     to ~40 m wide patches of the same, fewer where the houses stand (the builder's excluded keeps them and their yards clear). */
  const MBV = { share: 0.65, foot: 0.25,
    patch: (R) => { const r = R();
      return r < 0.45 ? { col: vary(mix3([0.7, 0.5, 0.35], [0.73, 0.53, 0.37], R()), R, 0.015), r: 0.8 + R() * 1.0 }   // (reddish earth)
        : r < 0.75 ? { col: vary(mix3([0.74, 0.65, 0.52], [0.77, 0.68, 0.55], R()), R, 0.015), r: 0.7 + R() * 0.8 }   // (grey grit and dust)
        : { col: vary([0.56, 0.45, 0.32], R, 0.015), r: 0.6 + R() * 0.7 }; },   // (fallen leaves)
    tuft: (R) => vary(mix3([0.42, 0.53, 0.24], [0.72, 0.66, 0.42], R() < 0.35 ? 0.4 + R() * 0.6 : R() * 0.3), R, 0.03) };
  const MBB = { n: 2, reach: 8, share: 0.65, maxSl: 1.2, sl: 0.6, bushShare: 0.3,
    patch: (R) => { const r = R();
      return r < 0.45 ? { col: vary(mix3([0.68, 0.49, 0.34], [0.72, 0.52, 0.36], R()), R, 0.015), r: 0.9 + R() * 1.2 }   // (reddish earth)
        : r < 0.75 ? { col: vary(mix3([0.66, 0.58, 0.37], [0.62, 0.57, 0.36], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (green grass)
        : { col: vary(mix3([0.8, 0.69, 0.47], [0.77, 0.66, 0.45], R()), R, 0.015), r: 0.9 + R() * 1.0 }; },   // (dry grass)
    tuft: (R) => vary(mix3([0.42, 0.53, 0.24], [0.55, 0.6, 0.3], R()), R, 0.03),
    bush: (R) => vary(mix3([0.36, 0.48, 0.24], [0.42, 0.53, 0.24], R()), R, 0.025) };
  const MBF = { step: 7, share: 0.45, from: 8, to: 40, drop: 6, maxSl: 0.9,
    patch: (R) => { const r = R();
      return r < 0.45 ? { col: vary(mix3([0.68, 0.49, 0.34], [0.72, 0.52, 0.36], R()), R, 0.015), r: 1.3 + R() * 1.3 }   // (reddish earth)
        : r < 0.8 ? { col: vary(mix3([0.66, 0.58, 0.37], [0.62, 0.57, 0.36], R()), R, 0.015), r: 1.3 + R() * 1.3 }   // (green grass)
        : { col: vary([0.8, 0.69, 0.47], R, 0.015), r: 1.1 + R() * 1.1 }; } };   // (dry grass)

  /* the reddish ground is saturated: a muted patch (half way to grey) read as grey on it, a patch in the colour as listed read lighter than
     the shaded ground; so here only darker, the hue kept */
  const dk = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
  const dim = (C) => Object.assign({}, C, { patch: (R, sl) => { const P = C.patch(R, sl); return { col: dk(P.col, 0.82), r: P.r }; }, tuft: C.tuft && ((R) => dk(C.tuft(R), 0.92)), bush: C.bush && ((R) => dk(C.bush(R), 0.92)) });

  /* Mombasa's strip and bank: the builder's verge cross-section (js/world-mombasa.js vergeRow: from the asphalt's edge w to bar - 0.3 it
     falls to -0.08, to bar + 3.2 to -0.4, lifted to the ground where that is higher), so a patch's height follows the verge as drawn */
  const mbStrip = (ctx, bad) => {
    const T = API.T, { nrGround, nrNear } = API, st = { zaplate: 0, sopi: 0, breg: 0, bregSopi: 0, bregGrmi: 0 };
    if (!T || !T.br || !T.wAt || !nrGround || !nrNear || !ctx.root || !ctx.out || !ctx.out.matV) return st;
    const R = rng(35201), soft = softScen(ctx.root, ctx.out.matV), N = T.px.length, step = Math.max(1, Math.round(3 / T.ds));
    const prof = (i, o, side) => { const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i];
      const P = [[w, 0], [w + 0.8, -0.04], [Math.max(w + 1.2, bar - 0.3), -0.08], [bar + 0.8, -0.16], [bar + 3.2, -0.4]];
      if (o <= P[0][0]) return 0; for (let k = 1; k < P.length; k++) if (o <= P[k][0]) { const t = (o - P[k - 1][0]) / Math.max(0.01, P[k][0] - P[k - 1][0]); return P[k - 1][1] + (P[k][1] - P[k - 1][1]) * t; }
      return null; };
    const gV = (x, z) => { const q = nrNear(x, z), g = nrGround(x, z); if (q.i < 0) return g; const side = q.lat < 0 ? -1 : 1, h = prof(q.i, Math.abs(q.lat), side);
      return h == null ? g : Math.max(T.hy[q.i] + h, g + 0.06) - 0.02; };
    const slope = (x, z) => { const d = 0.8, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const own = (x, z, i, lo, hi) => { const q = nrNear(x, z), o = Math.abs(q.lat); return q.i >= 0 && Math.abs(q.i - i) * T.ds < 12 && o > lo && o < hi; };
    const V = dim(MBV), B = dim(MBB);
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

  /* the builder's hook chained (after js/world-realizem-bt4.js's and js/world-chase-bt22.js's); what it counts in out.stats.rob.robBt35 */
  const base = World.ext && World.ext.mombasaRob;
  if (World.ext) World.ext.mombasaRob = function (ctx) {
    const r = (base ? base.call(this, ctx) : null) || {};
    try {
      const { seaD, inFort } = ctx, ex = ctx.excluded || (() => false);
      const bad = (x, z) => ex(x, z) || (seaD && seaD(x, z) > -4) || (inFort && inFort(x, z, 6));
      if (ctx.root && ctx.out) {
        r.robBt35 = mbStrip(ctx, bad);
        r.pasBt35 = band(ctx.root, ctx.out.matV, API.nrGround, API.nrNear, bad, 35203, dim(MBF));
      }
    } catch (e) { console.error('chase-bt35 (mombasa):', e); }
    return r;
  };
})();
