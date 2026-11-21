/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eightieth group of the real tracks: Portobelo and Livorno,
   a third pass on two tracks whose verge and bank the twenty-third and forty-third groups (js/world-chase-bt43.js: Portobelo's strip to
   the barrier, the bank to ~8 m and wide patches to ~55 m) and the eighteenth and forty-eighth (js/world-chase-bt48.js: Livorno's
   patches 6-55 m past the barrier) already set. From behind the car both still showed the asphalt's edge as one clean line and, past
   the first bands, only flat patches on one smooth face out to ~60 m. So here, as the seventy-fifth group did (js/world-chase-bt75.js):
   the asphalt's edge in short streaks and the shoulder's grit inside the barrier; past ~8 m out to ~60 m wide low patches and what
   stands on them. Portobelo (docs/proge/portobelo.md: »temne krošnje deževnega gozda in visoka drevesa nad zelenimi tlemi«, »temne
   skale ob zalivu«): the wet brown earth on the edge, the forest's leaf litter, ferns and undergrowth, the green and lime grass with
   tall tufts in the open, the dark (mid grey-brown, none near black) rocks only near the bay. Livorno (docs/proge/livorno.md:
   »gozd, makija, naselja, peščenjak na strminah«, »pinije, primorski bori, črnike, ciprese in grmičje makije«): the pale dust on the
   edge, the sandstone grit on the shoulder, the pines' needle litter, the macchia's low grey-green shrubs, the summer straw tufts and
   the sandstone's blocks on the steep. Nothing in the towns (land cover 3), in the water, where another leg's road is nearer, far below
   the road or on the steep, in the builders' excluded places (Portobelo: the sea, the fort, the glade; Livorno: the sea, the beaches,
   the bridges). All in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers, the trees, the
   horizon and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.softScen || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, cushion, softScen, mix3 } = BT;
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

  /* ---- Portobelo (js/world-portobelo.js: World.ext.portobeloRob({ scen, excluded, seaD, inFort, inGlade, root, out })) ---- */
  const PB = {
    worn: [[0.44, 0.37, 0.29], [0.48, 0.4, 0.31]], stone: [[0.5, 0.46, 0.4], [0.54, 0.5, 0.44]],   // (the wet brown earth on the edge, the grey grit)
    gr: [[0.3, 0.45, 0.2], [0.34, 0.49, 0.22]], lime: [[0.38, 0.5, 0.24], [0.42, 0.53, 0.26]], earth: [[0.44, 0.36, 0.27], [0.48, 0.39, 0.29]],
    leaf: [[0.5, 0.39, 0.26], [0.54, 0.42, 0.28]], fern: [[0.24, 0.43, 0.17], [0.29, 0.48, 0.2]], tall: [[0.3, 0.48, 0.19], [0.4, 0.54, 0.23]],
    bush: [[0.22, 0.38, 0.16], [0.27, 0.43, 0.18]], rock: [[0.38, 0.36, 0.33], [0.43, 0.4, 0.36]],
  };
  const portobelo = (ctx) => {
    const T = API.T; if (!ctx.out || !ctx.root || !ctx.out.matV || !T || !T.br) return null;
    const near = API.nrNear, gT = API.nrGround, lc = API.nrLC; if (!near || !gT) return null;
    const { seaD, inFort, inGlade } = ctx, ex = ctx.excluded || (() => false);
    const bad = (x, z) => ex(x, z) || (inFort && inFort(x, z, 6)) || (inGlade && inGlade(x, z));
    const wet = (x, z) => !!seaD && seaD(x, z) > -1.5;   // (the barrier keeps the road side; the verge to it reaches the shore)
    const E = { near, gT, rY: roadY(near, gT, 0.6), lc, bad, wet, slope: API.nrSlope }, m = { root: ctx.root, matV: ctx.out.matV };
    const st = { rob: edge(m, E, 80101, { step: 3, seg: 3, rim: 0.55, grit: 0.6, sh: 0.5, worn: PB.worn, stone: PB.stone, verge: 0.6, vA: PB.earth, vB: PB.lime, vt: 0.5, vtC: PB.tall }) };
    // past the barrier out to ~60 m (the forty-third group's bank only scattered small things to ~8 m)
    st.pas = outer(m, E, 80102, { step: 3.5, n: 4, share: 0.75, from: 1.5, to: 60, pw: 1.25, drop: 18, maxSl: 1.4,
      put: (soft, g, x, y, z, o, R, c, sl) => { const u = R(), h = R(), k = 1.2 + 1.0 * Math.min(1, o / 55), bay = !!seaD && seaD(x, z) > -14;
        if (bay && u < 0.45) { cushion(soft.get(x, z), x, y + 0.04, z, (0.35 + h * 0.5) * k, 0.25 + h * 0.3, C_(R, PB.rock, 0.02), R); return 'skale'; }   // (»temne skale ob zalivu«)
        if (c === 1) {   // under the rainforest: the leaf litter, the ferns, the undergrowth
          if (u < 0.45) { soil(soft, g, x, z, (1.0 + R() * 1.2) * k, C_(R, R() < 0.7 ? PB.leaf : PB.earth), R, 0.05); return 'listje'; }
          if (u < 0.75) { tuft(soft.get(x, z), x, y, z, (0.4 + h * 0.35) * k, 0.35 + h * 0.3, C_(R, PB.fern, 0.03), R, 6); return 'praprot'; }
          cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.6) * k, 0.4 + h * 0.4, C_(R, PB.bush, 0.025), R); return 'grmi'; }
        if (u < 0.55) { const v = R(), col = v < 0.5 ? C_(R, PB.gr) : v < 0.82 ? C_(R, PB.lime) : C_(R, PB.earth);
          soil(soft, g, x, z, (1.8 + R() * 2.0) * k, col, R, 0.06); return 'zaplate'; }
        if (u < 0.72 && sl < 0.9) { cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.7) * k, 0.4 + h * 0.4, C_(R, PB.bush, 0.025), R); return 'grmi'; }
        tuft(soft.get(x, z), x, y, z, (0.4 + h * 0.35) * k, 0.45 + h * 0.4, C_(R, PB.tall, 0.03), R, 5); return 'sopi'; } }, {});
    return st;
  };
  {
    const base = World.ext && World.ext.portobeloRob;
    if (World.ext) World.ext.portobeloRob = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try { const s = portobelo(ctx); if (s) { r.robBt80 = s.rob; r.pasBt80 = s.pas; } } catch (e) { console.error('chase-bt80 (portobelo):', e); }
      return r;
    };
  }

  /* ---- Livorno (js/world-livorno.js: goreRob(…, 'livorno', { gH, slope, lc, near, bad })) ---- */
  const LV = {
    worn: [[0.56, 0.53, 0.47], [0.6, 0.57, 0.5]], stone: [[0.64, 0.6, 0.5], [0.68, 0.63, 0.53]],   // (the pale dust on the edge, the sandstone grit)
    straw: [[0.66, 0.62, 0.42], [0.72, 0.67, 0.46]], earth: [[0.56, 0.51, 0.4], [0.6, 0.55, 0.43]], needle: [[0.54, 0.45, 0.33], [0.58, 0.48, 0.35]],
    macchia: [[0.34, 0.4, 0.26], [0.39, 0.44, 0.29]], holm: [[0.28, 0.36, 0.22], [0.32, 0.4, 0.25]], green: [[0.42, 0.48, 0.28], [0.47, 0.52, 0.31]],
    tuft: [[0.62, 0.6, 0.4], [0.7, 0.65, 0.44]], sand: [[0.7, 0.65, 0.53], [0.75, 0.7, 0.57]],
  };
  const livorno = (ctx, o) => {
    const T = API.T, out = ctx.out; if (!out || !out.matV || !ctx.root || !T || !T.br || !o || !o.near || !o.gH) return null;
    const near = o.near, gT = o.gH, lc = o.lc, ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || (o.bad ? o.bad(x, z) : false);
    const E = { near, gT, rY: roadY(near, gT, 0.5), lc, bad, wet: (x, z) => (lc ? lc(x, z) === 5 : false), slope: o.slope }, m = { root: ctx.root, matV: out.matV };
    const st = { rob: edge(m, E, 80201, { step: 4, seg: 2, rim: 0.5, grit: 0.55, sh: 0.45, worn: LV.worn, stone: LV.stone, verge: 0.5, vA: LV.earth, vB: LV.straw, vt: 0.45, vtC: LV.tuft }) };
    // past the barrier out to ~60 m (the forty-eighth group's flat patches from ~6 m); the road is 19 km long, so a step a little wider
    st.pas = outer(m, E, 80202, { step: 4.5, n: 3, share: 0.7, from: 1.5, to: 60, pw: 1.2, drop: 18, maxSl: 1.7,
      put: (soft, g, x, y, z, d, R, c, sl) => { const u = R(), h = R(), k = 1.2 + 1.0 * Math.min(1, d / 55);
        if (sl > 0.9) {   // »peščenjak na strminah«: the sandstone's blocks and its pale scree
          if (u < 0.55) { cushion(soft.get(x, z), x, y + 0.05, z, (0.35 + h * 0.6) * k, 0.25 + h * 0.35, C_(R, LV.sand, 0.02), R); return 'bloki'; }
          soil(soft, g, x, z, (1.0 + R() * 1.2) * k, C_(R, LV.sand, 0.025), R, 0.06); return 'pesc'; }
        if (c === 1) {   // under the pines and the holm oaks: the needle litter, low holm-oak and macchia shrubs
          if (u < 0.55) { soil(soft, g, x, z, (1.4 + R() * 1.6) * k, C_(R, R() < 0.7 ? LV.needle : LV.earth), R, 0.05); return 'iglice'; }
          cushion(soft.get(x, z), x, y, z, (0.55 + h * 0.6) * k, 0.4 + h * 0.45, C_(R, R() < 0.5 ? LV.holm : LV.macchia, 0.025), R); return 'grmi'; }
        if (c === 2) {   // the macchia: grey-green shrubs on the brown-grey ground
          if (u < 0.55) { cushion(soft.get(x, z), x, y, z, (0.6 + h * 0.7) * k, 0.4 + h * 0.5, C_(R, LV.macchia, 0.025), R); return 'makija'; }
          soil(soft, g, x, z, (1.4 + R() * 1.6) * k, C_(R, R() < 0.6 ? LV.earth : LV.straw), R, 0.05); return 'zaplate'; }
        if (u < 0.6) { const v = R(), col = v < 0.55 ? C_(R, LV.straw) : v < 0.85 ? C_(R, LV.earth) : C_(R, LV.green);
          soil(soft, g, x, z, (1.8 + R() * 2.0) * k, col, R, 0.06); return 'zaplate'; }
        if (u < 0.75 && sl < 0.8) { cushion(soft.get(x, z), x, y, z, (0.5 + h * 0.6) * k, 0.35 + h * 0.4, C_(R, LV.macchia, 0.025), R); return 'grmi'; }
        tuft(soft.get(x, z), x, y, z, (0.35 + h * 0.35) * k, 0.4 + h * 0.4, C_(R, LV.tuft, 0.03), R, 5); return 'sopi'; } }, {});
    return st;
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'livorno' && o) try { const s = livorno(ctx, o); if (s && r && typeof r === 'object') { r.robBt80 = s.rob; r.pasBt80 = s.pas; } } catch (e) { console.error('chase-bt80 (livorno):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
