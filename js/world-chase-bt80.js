/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eightieth group of the real tracks: Medeu and Canaries (both
   pass-builder roads, js/world-prelaz.js), a third pass on two tracks whose verge, bank and outer band the twentieth and thirty-fifth
   groups (js/world-chase-bt35.js: Medeu) and the eighth and thirty-eighth (js/world-chase-bt38.js: Canaries) already set. From behind
   the car both still showed the asphalt's edge as one clean line and, past the first bands, only sparse flat patches on one smooth face
   out to ~60 m. So here, as the seventy-fifth group did (js/world-chase-bt75.js): the asphalt's edge in short streaks and the shoulder's
   grit inside the barrier; past it out to ~60 m wide low patches and what stands on them. Medeu (docs/proge/medeu.md: »travniki, ki
   rumenijo, z divjo jablano, glogom in brinom; siv granit z rožnatim odtenkom v pečinah in skalnih podorih«, the spruces on the shady
   slopes): the granite's grey-pink grit on the edge, the yellowing meadow's straw and green, the low juniper and hawthorn, the spruces'
   needle litter, the granite's blocks and scree on the steep. Canaries (docs/proge/canaries.md: »gost listnat gozd …, palme, grmovje in
   trava«, »rdeče-rjava prst v vsekih, sivo-rjav andezit v pečinah«, »prst, ki jo dež spere na cesto«): the red-brown earth washed onto
   the edge, the andesite's grit, the forest's leaf litter and undergrowth, the lush grass with tall tufts in the open, the andesite's
   blocks on the steep. Nothing on built ground (land cover 3), in the water, where another leg's road is nearer, far below the road (the
   sea under Canaries' drop) or in the builder's excluded places. All in meshes of their own (softScen: 256 m chunks, no shadow); the
   terrain, the road, the barriers, the trees, the horizon and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API, LK = API.PL_LOOK;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.softScen || !BT.mix3 || !BT.chain || !rng || !vary) return;
  const { soil, tuft, cushion, softScen, mix3, chain } = BT;
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const C_ = (R, ab, j) => mute(vary(mix3(ab[0], ab[1], R()), R, j || 0.015));

  /* a thin low streak lying on the ground along (ax, az), tapering to both ends (the seventy-fifth group's) */
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

  /* E: near, ground (gT), road cross-section (rY), land cover (lc), the places to leave out (bad, wet). The asphalt's edge and the
     shoulder: every K.step m on each side by chance a short streak just inside the edge (K.rim, K.worn) and one on the shoulder (K.grit,
     K.stone), never past 0.35 m short of the barrier, not in the towns; only where this leg's road is the nearest. */
  const edge = (ctx, E, seed, K) => {
    const T = API.T, st = { rob: 0, gramoz: 0 }, { near, gT, rY, bad, wet, lc } = E;
    if (!T || !T.br || !near || !gT) return st;
    const N = T.px.length, ds = T.ds, R = rng(seed), soft = softScen(ctx.root, ctx.matV);
    for (let i = 0; i < N; i += Math.max(1, Math.round((K.step || 3) / ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), a = (R() - 0.5) * 2.4, w = T.wAt ? T.wAt(i) : T.w, bar = sd > 0 ? T.br[i] : T.bl[i];
      const at = (o) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
      const ok = (x, z, o) => { if (o > bar - 0.4) return false; const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * ds < 6 && q.lat * sd > 0 && !bad(x, z) && !(gT(x, z) < T.hy[i] - 3) && !wet(x, z) && !(lc && lc(x, z) === 3); };
      if (r0 < K.rim) { const o = w - 0.12 - r1 * 0.12, [x, z] = at(o);
        if (ok(x, z, o)) { streak(soft, rY, x, z, T.tx[i], T.tz[i], 1.4 + R() * 2.4, 0.22 + R() * 0.2, C_(R, K.worn), R, 0.01, K.seg); st.rob++; } }
      if (r2 < K.grit) { const o = w + 0.05 + R() * K.sh, [x, z] = at(o);
        if (ok(x, z, o)) { streak(soft, rY, x, z, T.tx[i], T.tz[i], 1.2 + R() * 2.2, 0.3 + R() * 0.35, C_(R, K.stone, 0.02), R, 0.012, K.seg); st.gramoz++; } }
      // the verge between the shoulder and the barrier (where it is wider than ~1.5 m): K.verge patches, K.vt tufts at the barrier's foot
      const vw = bar - w - K.sh - 0.9;
      if (K.verge && vw > 0.6 && R() < K.verge) { const o = w + K.sh + 0.5 + R() * vw, [x, z] = at(o);
        if (ok(x, z, o)) { soil(soft, gT, x, z, Math.min(vw * 0.5, 0.6 + R() * 1.0), C_(R, R() < 0.5 ? K.vA : K.vB), R, 0.04); st.ob = (st.ob || 0) + 1; } }
      if (K.vt && vw > 0.3 && R() < K.vt) { const o = bar - 0.45 - R() * 0.25, [x, z] = at(o);
        if (ok(x, z, o + 0.01)) { const h = R(); tuft(soft.get(x, z), x, gT(x, z), z, 0.3 + h * 0.25, 0.3 + h * 0.3, C_(R, K.vtC, 0.03), R, 5); st.sopi = (st.sopi || 0) + 1; } }
    }
    soft.done();
    return st;
  };

  /* past the barrier line on both sides, every C.step m: C.n places from C.from to C.to m past it, only where this leg's road is the
     nearest, not in the excluded places, the water, far below the road (C.drop) nor steeper than C.maxSl, not on built ground or water */
  const outer = (ctx, E, seed, C, st) => {
    const T = API.T, { near, gT, lc, bad, wet } = E;
    if (!T || !T.br || !near || !gT) return st;
    const R = rng(seed), soft = softScen(ctx.root, ctx.matV), N = T.px.length;
    const slope = E.slope || ((x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); });
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) for (let k = 0; k < C.n; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + Math.pow(r1, C.pw || 1) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0) continue;
      if (bad(x, z) || wet(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop)) continue;
      const sl = slope(x, z); if (sl > C.maxSl) continue;
      const c = lc ? lc(x, z) : 0; if (c === 3 || c === 5) continue;
      const kk = C.put(soft, gT, x, y, z, o - bar, R, c, sl); if (kk) st[kk] = (st[kk] || 0) + 1;
    }
    soft.done();
    return st;
  };
  const roadY = (near, gT, sw) => (x, z) => { const T = API.T, q = near(x, z); if (q.i < 0) return gT(x, z); const w = T.wAt ? T.wAt(q.i) : T.w, o = Math.abs(q.lat), y = T.hy[q.i];
    return o < w ? y + 0.02 : o < w + sw ? y + 0.012 - 0.032 * (o - w) / sw : Math.max(gT(x, z), y - 0.02); };
  /* the pass builder's look hook: ctx = { root, matV, out, excluded } */
  const hook = (id, seedA, seedB, K, C) => { if (LK && LK[id]) chain(LK[id], (ctx) => {
    if (!ctx.out || !ctx.root || !ctx.matV) return;
    try {
      const near = API.vrNear, gT = API.caGround || API.vrGround, lc = API.vrLC, ex = ctx.excluded || (() => false);
      if (!near || !gT) return;
      const E = { near, gT, rY: roadY(near, gT, 0.5), lc, bad: ex, wet: (x, z) => (lc ? lc(x, z) === 5 : false), slope: API.caSlope || API.vrSlope }, m = { root: ctx.root, matV: ctx.matV };
      ctx.out.robBt80 = edge(m, E, seedA, K);
      ctx.out.pasBt80 = outer(m, E, seedB, C, {});
    } catch (e) { console.error('chase-bt80 (' + id + '):', e); }
  }); };

  /* ---- Medeu ---- */
  const MD = {
    worn: [[0.56, 0.53, 0.51], [0.6, 0.56, 0.54]], stone: [[0.62, 0.57, 0.55], [0.66, 0.6, 0.57]],   // (the granite's grey-pink grit)
    straw: [[0.62, 0.58, 0.37], [0.67, 0.61, 0.39]], green: [[0.5, 0.53, 0.32], [0.54, 0.56, 0.35]], earth: [[0.5, 0.43, 0.34], [0.54, 0.46, 0.36]],
    needle: [[0.46, 0.39, 0.3], [0.5, 0.42, 0.32]], juniper: [[0.3, 0.38, 0.25], [0.34, 0.41, 0.27]], haw: [[0.38, 0.42, 0.26], [0.42, 0.45, 0.28]],
    tuft: [[0.64, 0.59, 0.36], [0.5, 0.54, 0.29]], granite: [[0.6, 0.56, 0.54], [0.66, 0.6, 0.57]],
  };
  hook('medeu', 80101, 80102,
    { step: 3, seg: 3, rim: 0.5, grit: 0.6, sh: 0.45, worn: MD.worn, stone: MD.stone, verge: 0.55, vA: MD.earth, vB: MD.straw, vt: 0.5, vtC: MD.tuft },
    { step: 3.5, n: 4, share: 0.75, from: 1.5, to: 60, pw: 1.25, drop: 20, maxSl: 1.8,
      put: (soft, g, x, y, z, d, R, c, sl) => { const u = R(), h = R(), k = 1.2 + 1.0 * Math.min(1, d / 55);
        if (sl > 0.9 || c === 4) {   // »siv granit z rožnatim odtenkom v pečinah in skalnih podorih«
          if (u < 0.55) { cushion(soft.get(x, z), x, y + 0.05, z, (0.35 + h * 0.6) * k, 0.25 + h * 0.35, C_(R, MD.granite, 0.02), R); return 'bloki'; }
          soil(soft, g, x, z, (1.0 + R() * 1.2) * k, C_(R, MD.granite, 0.025), R, 0.06); return 'pesc'; }
        if (c === 1) {   // under the spruces: the needle litter and low juniper
          if (u < 0.6) { soil(soft, g, x, z, (1.4 + R() * 1.6) * k, C_(R, R() < 0.7 ? MD.needle : MD.earth), R, 0.05); return 'iglice'; }
          cushion(soft.get(x, z), x, y, z, (0.5 + h * 0.6) * k, 0.35 + h * 0.4, C_(R, MD.juniper, 0.025), R); return 'grmi'; }
        if (u < 0.6) { const v = R(), col = v < 0.5 ? C_(R, MD.straw) : v < 0.82 ? C_(R, MD.green) : C_(R, MD.earth);
          soil(soft, g, x, z, (1.8 + R() * 2.0) * k, col, R, 0.06); return 'zaplate'; }
        if (u < 0.74 && sl < 0.8) { cushion(soft.get(x, z), x, y, z, (0.5 + h * 0.6) * k, 0.35 + h * 0.4, C_(R, R() < 0.5 ? MD.juniper : MD.haw, 0.025), R); return 'grmi'; }
        tuft(soft.get(x, z), x, y, z, (0.35 + h * 0.35) * k, 0.4 + h * 0.4, C_(R, MD.tuft, 0.03), R, 5); return 'sopi'; } });

  /* ---- Canaries ---- */
  const CN = {
    worn: [[0.52, 0.42, 0.33], [0.56, 0.45, 0.35]], stone: [[0.55, 0.52, 0.45], [0.59, 0.55, 0.48]],   // (the red-brown earth washed on, the andesite's grit)
    earth: [[0.54, 0.42, 0.3], [0.58, 0.45, 0.32]], gr: [[0.42, 0.5, 0.26], [0.46, 0.53, 0.28]], lime: [[0.48, 0.54, 0.29], [0.52, 0.57, 0.31]],
    leaf: [[0.5, 0.44, 0.32], [0.54, 0.47, 0.34]], under: [[0.26, 0.38, 0.19], [0.3, 0.42, 0.21]], tall: [[0.32, 0.47, 0.2], [0.4, 0.52, 0.24]],
    andesite: [[0.5, 0.47, 0.41], [0.56, 0.52, 0.45]],
  };
  hook('canaries', 80201, 80202,
    { step: 4, seg: 2, rim: 0.55, grit: 0.55, sh: 0.45, worn: CN.worn, stone: CN.stone, verge: 0.55, vA: CN.earth, vB: CN.gr, vt: 0.5, vtC: CN.tall },
    { step: 4.5, n: 2, share: 0.7, from: 1.5, to: 60, pw: 1.25, drop: 18, maxSl: 1.6,   // (the forest's trees already fill the busiest place: fewer here)

      put: (soft, g, x, y, z, d, R, c, sl) => { const u = R(), h = R(), k = 1.2 + 1.0 * Math.min(1, d / 55);
        if (sl > 0.95 || c === 4) {   // »rdeče-rjava prst v vsekih, sivo-rjav andezit v pečinah«
          if (u < 0.45) { cushion(soft.get(x, z), x, y + 0.05, z, (0.35 + h * 0.55) * k, 0.25 + h * 0.3, C_(R, CN.andesite, 0.02), R); return 'bloki'; }
          soil(soft, g, x, z, (1.0 + R() * 1.2) * k, C_(R, CN.earth, 0.025), R, 0.06); return 'vsek'; }
        if (c === 1) {   // under the dense broadleaf forest: the leaf litter and the undergrowth
          if (u < 0.5) { soil(soft, g, x, z, (1.2 + R() * 1.4) * k, C_(R, R() < 0.7 ? CN.leaf : CN.earth), R, 0.05); return 'listje'; }
          cushion(soft.get(x, z), x, y, z, (0.55 + h * 0.6) * k, 0.4 + h * 0.45, C_(R, CN.under, 0.025), R); return 'grmi'; }
        if (u < 0.55) { const v = R(), col = v < 0.5 ? C_(R, CN.gr) : v < 0.8 ? C_(R, CN.lime) : C_(R, CN.earth);
          soil(soft, g, x, z, (1.8 + R() * 2.0) * k, col, R, 0.06); return 'zaplate'; }
        if (u < 0.72 && sl < 0.9) { cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.7) * k, 0.4 + h * 0.45, C_(R, CN.under, 0.025), R); return 'grmi'; }
        tuft(soft.get(x, z), x, y, z, (0.4 + h * 0.35) * k, 0.45 + h * 0.4, C_(R, CN.tall, 0.03), R, 5); return 'sopi'; } });
})();
