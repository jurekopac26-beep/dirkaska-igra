/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the forty-sixth group of the real tracks: Izoard and Lombok,
   a second pass on two tracks whose ground the seventh group (js/world-chase-bt7.js: Izoard's tufts, juniper and limestone ribs within
   ~24 m of the barriers) and the realism pass (js/world-realizem-bt3.js: Lombok's dry-season tufts and red earth 8-38 m past the fences)
   already set. From behind the car both still showed one even face beside the road: on Izoard the verge between the asphalt and the
   barrier line in the shoulder's one grey and the slope past the seventh group's band out to the horizon a smooth wash; on Lombok the
   watered lawn between the edge and the fence in one green and the first metres past the fences the builder's verge in one colour. So
   here, on those strips only:
   on Izoard (docs/proge/izoard.md: »redek gozd macesnov … na travnatih tleh«, više »suhi alpski pašniki z brinom in grmičevjem, bledo
   sivi in okrasti apnenec in dolomit …, široka melišča pod prelazom«) on the verge the shoulder's pale limestone grit, the dry grass going
   gold and, in the larch wood, the needles' rusty litter in patches, straw tufts at the barrier's foot; from ~18 m to ~60 m past the
   barriers wide low patches of the pale scree on the rock and the scree (land cover 4, 7), the dry pasture's gold and green-brown in the
   open, the needle litter and the grass under the larches (1). On Lombok (docs/proge/lombok.md: »trava slamnato zelena, z lisami rdeče
   prsti; tik ob progi zalite zelene trate«) on the lawn between the kerb and the fence its lusher, its lighter and its drier patches, the
   red earth showing at the fence's foot; past the fences to ~8 m the lawn going over into the dry plain's straw-green, the red earth in
   patches and the dry grass in tufts; out to ~55 m a sparse band of wide low patches of the straw, the paler grass and the red earth.
   Nothing on the asphalt, the kerbs, the asphalt run-offs or the pits' side along the pits, nothing on built ground or car parks (land
   cover 3), on Izoard nothing on the snow (5), nothing where another leg's road is nearer. All of it in meshes of their own (softScen:
   256 m chunks, no shadow); the terrain, the road, the barriers, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, softScen, mix3, chain } = BT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // (as the thirty-ninth group: a fifth of the way to their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const P = (R, a, b, r0, r1) => ({ col: mute(vary(mix3(a, b, R()), R, 0.015)), r: r0 + R() * r1 });
  const T_ = (R, a, b) => mute(vary(mix3(a, b, R()), R, 0.03), 0.95);
  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };

  /* past the barrier line on both sides, every C.step m: C.n places from C.from to C.to m past it, only where this leg's road is the
     nearest (near: {i, lat}), not in bad, not far below the road (C.drop) nor steeper than C.maxSl; C.put(soft, gT, x, y, z, o, R, lc, sl)
     lays the patch or the tuft and says what it was (a key of st) — the thirty-ninth group's walk (js/world-chase-bt39.js) */
  const outer = (root, matV, gT, near, lc, bad, seed, C, st) => {
    const T = API.T; if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length, loop = !!C.loop;
    const slope = (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) for (let k = 0; k < C.n; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + Math.pow(r1, C.pw || 1) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || (loop ? gap(q.i, i, N) : Math.abs(q.i - i)) * T.ds > o + 10 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0) continue;
      if (bad(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop)) continue;
      const sl = slope(x, z); if (sl > C.maxSl) continue;
      const c = lc ? lc(x, z) : 0; if (C.skipLC && C.skipLC(c)) continue;
      const kk = C.put(soft, gT, x, y, z, o - bar, R, c, sl); if (kk) st[kk] = (st[kk] || 0) + 1;
    }
    soft.done();
    return st;
  };

  /* ---- Izoard (the shared world of the passes, js/world-prelaz.js: its look's extra chained) ---- */
  const IZ = {
    grit: [[0.63, 0.62, 0.58], [0.68, 0.66, 0.6]], ochre: [[0.66, 0.6, 0.49], [0.7, 0.63, 0.51]], gold: [[0.62, 0.57, 0.37], [0.67, 0.6, 0.4]],
    dry: [[0.5, 0.5, 0.3], [0.55, 0.53, 0.33]], needle: [[0.5, 0.39, 0.26], [0.55, 0.42, 0.28]], forest: [[0.38, 0.44, 0.24], [0.42, 0.47, 0.27]],
    scree: [[0.7, 0.67, 0.6], [0.74, 0.71, 0.64]], tuft: [[0.62, 0.58, 0.37], [0.72, 0.65, 0.41]], tuftW: [[0.4, 0.46, 0.24], [0.48, 0.5, 0.28]],
  };
  const izoard = (ctx) => {
    const T = API.T, near = API.vrNear, lc = API.vrLC, gT = API.caGround || API.vrGround, ex = ctx.excluded || (() => false);
    if (!ctx.out || !ctx.root || !ctx.matV || !T || !T.br || !near || !gT || (T.def && T.def.id !== 'izoard')) return;
    const N = T.px.length, w = T.w, ds = T.ds, root = ctx.root, matV = ctx.matV;
    const wood = (c) => c === 1, rock = (c) => c === 4 || c === 7;
    const st = { zaplate: 0, sopi: 0 };
    // the verge between the asphalt and the barrier line (as the twenty-fourth group's strip, js/world-chase-bt24.js: its height the verge's profile)
    { const R = rng(46101), soft = softScen(root, matV), e0 = w + 0.9, step = 2.8;
      for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) {
        const r0 = R(), r1 = R(), r2 = R(), r3 = R(), bar = sd > 0 ? T.br[i] : T.bl[i], e1 = bar - 0.35;
        if (!(e1 - e0 > 0.9)) continue;
        const lip = Math.max(w + 1.1, bar - 0.7);
        const at = (o) => [T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o];
        const own = (x, z) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * ds < 12 && q.dd <= 0 && Math.abs(q.lat) < bar - 0.3 && !ex(x, z); };
        const sunk = (x, z) => gT(x, z) < T.hy[i] - 3;   // (a bridge or a high fill: the verge is not on the ground there)
        const gV = (x, z) => { const q = near(x, z), j = q.i >= 0 ? q.i : i, o = Math.abs(q.lat);
          const t = clamp((o - (w + 0.5)) / Math.max(0.3, lip - (w + 0.5)), 0, 1); return T.hy[j] - 0.02 - 0.1 * t; };
        const [bx, bz] = at(bar + 4), c = lc ? lc(bx, bz) : 0; if (c === 3 || c === 5) continue;   // (the land behind: the wood, the pasture or the rock)
        if (r0 < 0.5) {
          const o = e0 + r1 * (e1 - e0), [x, z] = at(o), u = R();
          const Pp = wood(c) ? (u < 0.45 ? P(R, IZ.needle[0], IZ.needle[1], 0.8, 1.0) : u < 0.7 ? P(R, IZ.forest[0], IZ.forest[1], 0.8, 1.0) : P(R, IZ.grit[0], IZ.grit[1], 0.6, 0.8))
            : u < 0.4 ? P(R, IZ.grit[0], IZ.grit[1], 0.7, 0.9) : u < 0.6 ? P(R, IZ.ochre[0], IZ.ochre[1], 0.6, 0.8) : u < 0.85 ? P(R, IZ.gold[0], IZ.gold[1], 0.8, 1.1) : P(R, IZ.dry[0], IZ.dry[1], 0.8, 1.0);
          const rr = Math.min(Pp.r, (e1 - e0) * 0.5, o - e0 + 0.4, e1 - o + 0.4);
          if (rr > 0.3 && own(x, z) && !sunk(x, z)) { soil(soft, gV, x, z, rr, Pp.col, R, 0.05); st.zaplate++; }
        }
        if (r2 < 0.26) for (let q = 0, n = 1 + Math.floor(r3 * 3); q < n; q++) {   // (straw tufts at the barrier's foot; greener under the larches)
          const o = e1 - 0.15 - R() * 0.4, [x0, z0] = at(o), x = x0 + T.tx[i] * (R() - 0.5) * 2.4, z = z0 + T.tz[i] * (R() - 0.5) * 2.4;
          if (!own(x, z) || sunk(x, z)) continue;
          const h = R(); tuft(soft.get(x, z), x, gV(x, z), z, 0.2 + h * 0.16, 0.24 + h * 0.24, wood(c) ? T_(R, IZ.tuftW[0], IZ.tuftW[1]) : T_(R, IZ.tuft[0], IZ.tuft[1]), R, 5); st.sopi++;
        }
      }
      soft.done(); }
    // ~18 to ~60 m past the barriers (the seventh group's band ends at ~24 m): wide low patches, so the slope reads as ground out to the horizon
    const pas = outer(root, matV, gT, near, lc, ex, 46102, { step: 6, n: 1, share: 0.55, from: 18, to: 60, drop: 14, maxSl: 1.2, skipLC: (c) => c === 3 || c === 5,
      put: (soft, g, x, y, z, o, R, c) => { const u = R(), k = 1 + 0.5 * Math.min(1, (o - 18) / 42);
        const Pp = wood(c) ? (u < 0.6 ? P(R, IZ.needle[0], IZ.needle[1], 1.6 * k, 1.4 * k) : P(R, IZ.forest[0], IZ.forest[1], 1.6 * k, 1.4 * k))
          : rock(c) ? (u < 0.7 ? P(R, IZ.scree[0], IZ.scree[1], 1.6 * k, 1.6 * k) : P(R, IZ.ochre[0], IZ.ochre[1], 1.4 * k, 1.4 * k))
          : u < 0.45 ? P(R, IZ.gold[0], IZ.gold[1], 1.6 * k, 1.6 * k) : u < 0.8 ? P(R, IZ.dry[0], IZ.dry[1], 1.6 * k, 1.6 * k) : P(R, IZ.scree[0], IZ.scree[1], 1.2 * k, 1.0 * k);
        soil(soft, g, x, z, Pp.r, Pp.col, R, 0.06); return 'pas'; } }, {});
    ctx.out.robBt46 = st; ctx.out.pasBt46 = pas;
  };
  const LK = API.PL_LOOK;
  if (LK && LK.izoard && chain) chain(LK.izoard, (ctx) => { try { izoard(ctx); } catch (e) { console.error('chase-bt46 (izoard):', e); } });

  /* ---- Lombok (the shared circuit builder, js/world-rbring.js: its look's extra chained) ---- */
  const LB = {
    lawn: [[0.31, 0.49, 0.2], [0.34, 0.52, 0.22]], lush: [[0.25, 0.42, 0.16], [0.28, 0.45, 0.18]], pale: [[0.42, 0.53, 0.25], [0.46, 0.55, 0.28]],
    straw: [[0.6, 0.57, 0.33], [0.66, 0.6, 0.36]], strawG: [[0.5, 0.52, 0.28], [0.55, 0.55, 0.31]], red: [[0.55, 0.32, 0.23], [0.6, 0.36, 0.26]],
    tuft: [[0.58, 0.56, 0.32], [0.68, 0.62, 0.4]], tuftG: [[0.36, 0.48, 0.2], [0.44, 0.52, 0.25]],
  };
  const lombok = (ctx) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrLC, nrNear } = API;
    if (!root || !matV || !T || !T.br || !nrGround || !nrLC || !nrNear || (T.def && T.def.id !== 'lombok')) return;
    const bankY = API.nrBankY || (() => 0), N = T.px.length, w = T.w, cw = T.curbW || 1, ds = T.ds;
    const pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const pit = (i, sd) => !!pd && sd === PSD && pitI(i);
    const badP = (x, z) => { if (excluded(x, z)) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    // the asphalt run-offs (T.gravL / gravR, tapering in and out): nothing on them nor within ~30 m of their ends
    const ro = (i, sd) => { const gv = sd > 0 ? T.gravR : T.gravL; if (!gv) return false; const m = Math.round(30 / ds);
      for (let d = -m; d <= m; d += Math.max(1, Math.round(4 / ds))) if (gv[(i + d + N) % N]) return true; return false; };
    // the verge as the builder draws it (js/world-rbring.js rbVerge, with a banked corner's tilt): [offset, height above the road]
    const prof = (i, sd) => { const bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], bk = (o) => bankY(i, sd * o), lift = (o, h) => [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) + 0.06 - y - bk(o))];
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)]; };
    const hAt = (i, sd, o) => { const Q = prof(i, sd); let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++; const a = Q[k], b = Q[k + 1];
      return T.hy[i] + bankY(i, sd * o) + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    const hV = (i0) => (x, z) => { const q = nrNear(x, z), j = q.i >= 0 && gap(q.i, i0, N) < 12 ? q.i : i0, sd = q.lat >= 0 ? 1 : -1; return hAt(j, sd, Math.abs(q.lat)); };
    const st = { zaplate: 0, prst: 0, sopi: 0 };
    const R = rng(46201), soft = softScen(root, matV), step = 5.0;
    for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) {
      if (pit(i, sd) || ro(i, sd)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      const e0 = w + (T.curb && T.curb[i] ? cw : 0.05) + 0.5, e1 = bar - 0.45, g = hV(i);
      const own = (x, z) => { const q = nrNear(x, z); return q.i >= 0 && gap(q.i, i, N) * ds < 12 && q.dd <= 0 && Math.abs(q.lat) > e0 - 0.3 && Math.abs(q.lat) < bar - 0.3 && q.lat * sd > 0 && !excluded(x, z); };
      // the watered lawn between the kerb and the fence: its lusher, lighter and drier patches; the red earth at the fence's foot
      if (e1 - e0 > 0.9) for (let k = 0, n = (e1 - e0) > 6 ? 2 : 1; k < n; k++) {
        const r0 = R(), o = e0 + R() * (e1 - e0), [x, z] = at(i, sd, o, (R() - 0.5) * step);
        if (r0 > 0.5) continue;
        const u = R(), red = R() < 0.14 && o > e1 - 2.0;
        const Pp = red ? P(R, LB.red[0], LB.red[1], 0.45, 0.6)
          : u < 0.38 ? P(R, LB.lush[0], LB.lush[1], 0.8, 1.2) : u < 0.72 ? P(R, LB.pale[0], LB.pale[1], 0.8, 1.2) : P(R, LB.strawG[0], LB.strawG[1], 0.7, 1.0);
        if (red) st.prst++;
        const rr = Math.min(Pp.r, (e1 - e0) * 0.5, o - e0 + 0.4, e1 - o + 0.4);
        if (rr > 0.3 && own(x, z)) { soil(soft, g, x, z, rr, Pp.col, R, 0.04); st.zaplate++; }
      }
      // the uncut grass at the fence's foot, on its road side
      if (R() < 0.12) { const o = bar - 0.35 - R() * 0.35, [x, z] = at(i, sd, o, (R() - 0.5) * 2.6);
        if (own(x, z)) { const h = R(); tuft(soft.get(x, z), x, g(x, z), z, 0.22 + h * 0.16, 0.26 + h * 0.24, T_(R, LB.tuftG[0], LB.tuftG[1]), R, 5); st.sopi++; } }
    }
    soft.done();
    const skipLC = (c) => c === 3;
    // past the fences to ~8 m (the realism pass's tufts start at ~8 m): the lawn going over into the dry plain, the red earth, tufts
    const breg = outer(root, matV, nrGround, nrNear, nrLC, badP, 46202, { loop: true, step: 4.0, n: 2, share: 0.7, from: 0.45, to: 9, pw: 1.2, drop: 1.5, maxSl: 1.0, skipLC,
      put: (soft, gT, x, y, z, o, R, c) => { const u = R();
        if (o < 3.2) return null;   // (the builder's own verge runs 3.2 m past the fence)
        if (u < 0.65) { const v = R(), Pp = c === 2 ? P(R, LB.strawG[0], LB.strawG[1], 0.9, 1.1)
            : v < 0.35 ? P(R, LB.strawG[0], LB.strawG[1], 0.9, 1.2) : v < 0.7 ? P(R, LB.straw[0], LB.straw[1], 0.9, 1.2) : P(R, LB.red[0], LB.red[1], 0.6, 0.9);
          soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.05); return 'breg'; }
        const h = R(); tuft(soft.get(x, z), x, y, z, 0.26 + h * 0.18, 0.3 + h * 0.26, T_(R, LB.tuft[0], LB.tuft[1]), R, 5); return 'bregSopi'; } }, {});
    // out to ~55 m: a sparse band of wide low patches, so the plain past the fences reads as ground, not one colour
    const pas = outer(root, matV, nrGround, nrNear, nrLC, badP, 46203, { loop: true, step: 6, n: 1, share: 0.5, from: 9, to: 55, drop: 4, maxSl: 1.0, skipLC,
      put: (soft, gT, x, y, z, o, R, c) => { const u = R(), k = 1 + 0.5 * Math.min(1, (o - 9) / 46);
        const Pp = u < 0.4 ? P(R, LB.straw[0], LB.straw[1], 1.6 * k, 1.6 * k) : u < 0.78 ? P(R, LB.strawG[0], LB.strawG[1], 1.6 * k, 1.6 * k) : P(R, LB.red[0], LB.red[1], 1.2 * k, 1.0 * k);
        soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.06); return 'pas'; } }, {});
    if (ctx.out) { ctx.out.robBt46 = st; ctx.out.bregBt46 = breg; ctx.out.pasBt46 = pas; }
  };
  const LL = (API.rbLook || {}).lombok;
  if (LL && chain) chain(LL, (ctx) => { try { lombok(ctx); } catch (e) { console.error('chase-bt46 (lombok):', e); } });
})();
