/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixty-ninth group of the real tracks: Silkeborg and
   Llogara, a second pass on the two tracks the later groups had touched least. Silkeborg (the circuit builder, js/world-rbring.js) has
   the forty-seventh group's straw at the fences' foot, the needle litter and the tussock groups (js/world-chase-bt47.js); from behind
   the car two things still read as drawn: where the asphalt meets the grass one clean green edge, and past ~30 m, between the tussock
   groups, the heath one even colour up to the trees. Llogara (the pass builder, js/world-prelaz.js) has the sixth group's karst and the
   twenty-eighth's verge and bank to ~8 m (js/world-chase-bt6.js, js/world-chase-bt28.js); past them the forest floor and the south face
   were one smooth wash out to the horizon. So here: on Silkeborg (docs/proge/silkeborg.md: »resava z reso (vijolično-rjava) in nizkimi
   bori, suha trava in peščene zaplate«) the first metre past the asphalt worn to the heath's pale sand and grit going over into a
   yellowed green, in broken lengths, and from ~8 to ~58 m wide low patches of heather (purple-brown), of straw, of the bare pale sand and,
   under the plantations, of the rust-brown needle litter; on Llogara (docs/proge/llogara.md: »Severna stran je gozd jelke in črnega
   bora … Južno pobočje je golo sivo apnenčasto skalovje v rebrih in meliščih, vmes suha trava in temne zaplate makije«) from ~8 to ~58 m
   on the north side the litter and the shaded grass, on the south face and over the pass the grey limestone grit and scree, the gold
   grass and the maquis's dark low clumps. Everything in the builders' own scenery chunks (no draw calls of their own: Llogara has 15 to
   spare), never on the sand run-offs, the pits' side along the pits, the town or the water, not where another leg's road is nearer; the
   terrain, the road, the fences, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, sstep } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.mix3 || !BT.chain || !BT.walk || !vary || !rng) return;
  const { soil, tuft, cushion, mix3, chain, walk } = BT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  const C_ = (R, ab) => vary(mix3(ab[0], ab[1], R()), R, 0.012);
  const P = (R, a, b, r0, r1) => ({ col: vary(mix3(a, b, R()), R, 0.015), r: r0 + R() * r1 });

  /* ---- Silkeborg ---- */
  /* answer 2 to chase-skupina-69: colours half way to the grass (~[0.42, 0.5, 0.26]), fewer and smaller sand patches */
  const SK = { dust: [[0.55, 0.55, 0.36], [0.57, 0.57, 0.38]], edge: [[0.46, 0.515, 0.28], [0.48, 0.53, 0.3]],
    heath: [0.42, 0.39, 0.28], bloom: [0.45, 0.39, 0.35], straw: [0.53, 0.55, 0.31], straw2: [0.5, 0.53, 0.3],
    sand: [0.58, 0.58, 0.39], needle: [0.42, 0.38, 0.24], moss: [0.36, 0.45, 0.23] };

  /* the worn edge (as js/world-chase-bt59.js's, its first line only): from the asphalt's edge (or the kerb's) out 0.65-1.35 m, in
     lengths of 6-22 m with gaps, on the verge as the builder draws it; never on the run-offs (nor ~30 m past their ends) or by the pits */
  const worn = (ctx, seed, V) => {
    const excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear } = API, scen = ctx.scen;
    if (!scen || !T || !T.br || !nrGround || !nrNear) return null;
    const bankY = API.nrBankY || (() => 0), N = T.px.length, w = T.w, cw = T.curbW || 1, ds = T.ds;
    const pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const pit = (i, sd) => !!pd && sd === PSD && pitI(i);
    const ro = (i, sd) => { const gv = sd > 0 ? T.gravR : T.gravL; if (!gv) return false; const m = Math.round(30 / ds);
      for (let d = -m; d <= m; d += Math.max(1, Math.round(4 / ds))) if (gv[(i + d + N) % N]) return true; return false; };
    const prof = (i, sd) => { const bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], bk = (o) => bankY(i, sd * o), lift = (o, h) => [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) + 0.06 - y - bk(o))];
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)]; };
    const hAt = (i, sd, o) => { const Q = prof(i, sd); let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++; const a = Q[k], b = Q[k + 1];
      return T.hy[i] + bankY(i, sd * o) + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); };
    const own = (i, sd, x, z, bar) => { const q = nrNear(x, z); return q.i >= 0 && gap(q.i, i, N) * ds < 8 && q.dd <= 0 && Math.abs(q.lat) < bar - 0.2 && q.lat * sd > 0 && !excluded(x, z); };
    const R = rng(seed), st = { rob: 0 };
    const pt = (i, sd, o, lift) => { const x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o; return [x, hAt(i, sd, o) + lift, z]; };
    const step = Math.max(1, Math.round(1.6 / ds));
    for (const sd of [-1, 1]) {
      let i = Math.floor(R() * N * 0.02), prevO = null, cI = null, cO = null, left = 0, wid = 0;
      for (let n = 0; n < N + step; n += step, i = (i + step) % N) {
        if (left <= 0) {
          prevO = null;
          if (R() > 0.7) { left = (3 + R() * 11) / ds; cI = null; continue; }
          left = (6 + R() * 16) / ds; cI = C_(R, V.dust); cO = C_(R, V.edge); wid = 0.75 + R() * 0.35;
        }
        left -= step;
        if (!cI) continue;
        const bar = sd > 0 ? T.br[i] : T.bl[i], a = w + (T.curb && T.curb[i] ? cw : 0.02), b0 = a + 1.0 + 0.35 * Math.sin(i * 0.37), b = a + (b0 - a) * wid * (0.85 + R() * 0.3);
        if (pit(i, sd) || ro(i, sd) || !(b - a > 0.15) || b > bar - 0.15) { prevO = null; continue; }
        const A = pt(i, sd, a, 0.032), B = pt(i, sd, b, 0.032);
        if (!own(i, sd, (A[0] + B[0]) / 2, (A[2] + B[2]) / 2, bar)) { prevO = null; continue; }
        const dI = vary(cI, R, 0.01), dO = vary(cO, R, 0.012);
        if (prevO) { scen.get(A[0], A[2]).quadUp(prevO[0], prevO[1], B, A, [prevO[2], prevO[3], dO, dI]); st.rob++; }
        prevO = [A, B, dI, dO];
      }
    }
    return st;
  };

  /* ~8 to ~58 m past the fences: wide low patches on the open heath and the dry grass (land cover 0 and 2) and under the plantations (1),
     a low heather cushion now and then; never on the sand run-offs' own sand (js/world-silkeborg.js's mask: there the patch is the sand) */
  const skBand = (ctx, env, st) => {
    const { nrGround: gH, nrLC, nrSlope, NR } = API, scen = ctx.scen, sand = API.skSand || (() => 0); if (!scen || !gH || !nrLC || !nrSlope) return;
    st.resa = 0; st.slama = 0; st.pesek = 0; st.iglice = 0; st.grmi = 0;
    const bl = (x, z) => NR && sstep ? sstep(0.38, 0.66, NR.n1(x * 0.9 + 40, z * 0.9 - 60)) : 0.4;
    walk(env, 69101, 3, 50, 8, (x, z) => { const c = nrLC(x, z); return (c === 0 || c === 1 || c === 2) && nrSlope(x, z) < 0.8 && !(sand(x, z) > 0.2) ? 0.75 : 0; }, (gx, gz, k, R, free) => {
      if (!free(gx, gz, 4)) return;
      const c = nrLC(gx, gz), r = R(), y = gH(gx, gz);
      if (c === 1) { if (r < 0.7) { soil(scen, gH, gx, gz, 1.6 + R() * 2.2, vary(mix3(SK.needle, SK.moss, R() * 0.4), R, 0.02), R, 0.05); st.iglice++; } return; }
      if (c === 2 ? r < 0.5 : r < 0.2) { soil(scen, gH, gx, gz, 1.8 + R() * 2.4, vary(mix3(SK.heath, SK.bloom, bl(gx, gz)), R, 0.02), R, 0.05); st.resa++; }
      else if (r < 0.75) { soil(scen, gH, gx, gz, 1.6 + R() * 2.0, vary(mix3(SK.straw, SK.straw2, R()), R, 0.02), R, 0.05); st.slama++; }
      else if (r < 0.82) { soil(scen, gH, gx, gz, 0.8 + R() * 1.0, vary(SK.sand, R, 0.02), R, 0.05); st.pesek++; }
      else if (c === 2) { const h = R(); cushion(scen.get(gx, gz), gx, y + 0.02, gz, 0.5 + h * 0.4, 0.24 + h * 0.14, vary(mix3(SK.heath, SK.bloom, bl(gx, gz) * 0.9), R, 0.03), R); st.grmi++; }
    });
  };
  const SL = (API.rbLook || {}).silkeborg;
  if (SL) chain(SL, (ctx, r) => {
    const T = API.T; if (!T || (T.def && T.def.id !== 'silkeborg') || !API.nrNear) return;
    const pd = T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, { nrNear } = API;
    const bad = (x, z) => { if (!ps) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
    const ex = ctx.excluded || (() => false), st = {};
    skBand(ctx, { near: nrNear, excluded: (x, z) => ex(x, z) || bad(x, z), pit: (s, sd) => !!ps && sd === ps && !!T.pitAt(s) }, st);
    st.rob = (worn(ctx, 69102, SK) || {}).rob || 0;
    const o = ctx.out || r; if (o) o.robBt69 = st;
  });

  /* ---- Llogara: the far band (as js/world-chase-bt67.js's, in the builder's own chunks): every C.step m on both sides C.n places
     from C.from to C.reach m past the barrier line, denser near; only this leg's ground, not steeper than C.maxSl, not far below the road ---- */
  const far = (scen, gT, bad, seed, C) => {
    const T = API.T, near = API.vrNear, st = { dal: 0, dalSopi: 0, dalGrmi: 0 };
    if (!T || !T.br || !near || !scen) return st;
    const R = rng(seed), N = T.px.length, span = C.reach - C.from;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const r0 = R(), r1 = R(), r2 = R(), r3 = R(), u = Math.pow(r1, 1.2);
        const o = bar + C.from + u * span, a = (r2 - 0.5) * C.step;
        const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || Math.abs(q.lat) < bar + C.from - 0.5) continue;
        if (bad(x, z)) continue;
        const y = gT(x, z), dy = y - T.hy[i];
        if (!(dy > -C.drop)) continue;
        const sl = slope(x, z); if (sl > C.maxSl) continue;
        const kk = 1 + 0.6 * u;
        if (r0 < C.share) { const p = C.patch(R, sl, i, x, z); soil(scen, gT, x, z, p.r * kk, p.col, R, 0.06); st.dal++; }
        else if (sl < C.sl && r3 < C.bushShare && C.bushAt(i)) { const h = R(); cushion(scen.get(x, z), x, y, z, (0.5 + h * 0.5) * kk, 0.3 + h * 0.3, C.bush(R), R); st.dalGrmi++; }
        else if (u < 0.4) { const h = R(); tuft(scen.get(x, z), x, y, z, 0.28 + h * 0.2, 0.32 + h * 0.3, C.tuft(R, i), R, 5); st.dalSopi++; }
      }
    }
    return st;
  };
  const LG = { top: 0 };
  const north = (i) => i < LG.top;
  const LGF = { step: 6, n: 3, from: 8, reach: 58, share: 0.72, maxSl: 1.4, sl: 0.85, bushShare: 0.45, drop: 8,
    patch: (R, sl, i) => { const r = R();
      if (north(i)) return r < 0.5 ? P(R, [0.44, 0.35, 0.25], [0.49, 0.39, 0.28], 1.5, 1.8)   // (needle litter)
        : r < 0.85 ? P(R, [0.34, 0.4, 0.22], [0.39, 0.43, 0.25], 1.5, 1.8)   // (shaded forest grass)
        : P(R, [0.52, 0.5, 0.45], [0.56, 0.54, 0.49], 1.0, 1.2);   // (a grey rock showing through)
      return sl > 0.9 || r < 0.4 ? P(R, [0.6, 0.59, 0.55], [0.66, 0.64, 0.59], 1.3, 1.6)   // (limestone grit, scree)
        : r < 0.8 ? P(R, [0.58, 0.53, 0.36], [0.62, 0.56, 0.39], 1.6, 1.9)   // (gold grass)
        : P(R, [0.48, 0.47, 0.33], [0.52, 0.5, 0.35], 1.4, 1.6); },   // (the greener grass in the hollows)
    tuft: (R, i) => vary(north(i) ? mix3([0.34, 0.42, 0.21], [0.4, 0.45, 0.25], R()) : mix3([0.6, 0.54, 0.36], [0.54, 0.51, 0.34], R()), R, 0.03),
    bush: (R) => vary(R() < 0.6 ? [0.24, 0.3, 0.17] : [0.28, 0.33, 0.19], R, 0.025), bushAt: (i) => !north(i) };   // (the maquis: south only)
  const LK = API.PL_LOOK || {};
  if (LK.llogara) chain(LK.llogara, (ctx) => {
    if (!ctx.out || !API.T || !ctx.scen) return;
    const T = API.T, gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false), lc = API.vrLC;
    let top = 0; for (let i = 1; i < T.hy.length; i++) if (T.hy[i] > T.hy[top]) top = i;
    LG.top = Math.max(0, top - Math.round(40 / T.ds));
    const bad = (x, z) => { if (ex(x, z)) return true; const c = lc ? lc(x, z) : 0; return c === 3 || c === 5; };
    ctx.out.dalBt69 = far(ctx.scen, gT, bad, 69201, LGF);
  });
})();
