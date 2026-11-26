/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventy-fourth group of the real tracks: Hiva and Luanda, a
   further pass on the two city roads whose ground the earlier groups set (js/world-chase-bt6.js, js/world-chase-bt42.js: Hiva's strip,
   the barriers' foot, the open ground to ~10 m and a sparse band of patches to ~55 m; js/world-realizem-bt4.js, js/world-chase-bt22.js,
   js/world-chase-bt43.js: Luanda's strip to the separator, the ground past it and a sparse band to ~55 m). From behind the car the asphalt's
   edge still met the strip in one clean line, and between the near patches and ~60 m the ground lay in one even sheet (on Hiva one loess
   yellow, on Luanda one orange). So here, as the seventy-first and seventy-third groups did (js/world-chase-bt71.js, js/world-chase-bt73.js),
   on both a worn edge (the asphalt's grey grit and the dust blown onto it, 0.05-0.75 m past the asphalt's edge, thin and broken) and a band
   from ~3 m to ~60 m past the barrier line, denser near and thinning with distance. What lies where follows docs/proge/hiva.md (»puhlično
   rumena tla«, the gardens of the oasis by ESA WorldCover, the dry grass the builder's ground already shows) and docs/proge/luanda.md
   (»suha rdeča tla«, »pesek ob zalivu«). Nothing on the houses, walls, gates and minarets (the builders' excluded places), in built or
   water cover, in the sea or by its edge, at the fortress, or where another leg's road is nearer. The horizon stays the builders' own
   (Hiva: the DEM terrain; Luanda: the sea and the far land). All of it in meshes of their own (softScen: 256 m chunks, no shadow); the
   terrain, the road, the verges, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !vary || !rng) return;
  const { mix3, soil, softScen, tuft } = BT;
  const C3 = (R, a, b, k) => vary(mix3(a, b, R()), R, k || 0.015);

  /* the builders' verge cross-section (vergeRow, as js/world-chase-bt43.js reads it): 0 at the asphalt's edge, -0.04 at +0.8 m, -0.08 at the
     barrier line - 0.3, -0.16 at + 0.8, -0.4 at + 3.2; past it the ground. gV: the height a patch lies at, never under the ground */
  const mkGV = () => {
    const T = API.T, { nrGround, nrNear } = API;
    const prof = (i, o, side) => { const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i];
      const P = [[w, 0], [w + 0.8, -0.04], [Math.max(w + 1.2, bar - 0.3), -0.08], [bar + 0.8, -0.16], [bar + 3.2, -0.4]];
      if (o <= P[0][0]) return 0; for (let k = 1; k < P.length; k++) if (o <= P[k][0]) { const t = (o - P[k - 1][0]) / Math.max(0.01, P[k][0] - P[k - 1][0]); return P[k - 1][1] + (P[k][1] - P[k - 1][1]) * t; }
      return null; };
    return (x, z) => { const q = nrNear(x, z), qi = q.i, lat = q.lat, g = nrGround(x, z); if (qi < 0) return g; const h = prof(qi, Math.abs(lat), lat < 0 ? -1 : 1);
      return h == null ? g : Math.max(T.hy[qi] + h + 0.01, g + 0.04); };
  };

  /* the worn edge: every E.step m on both sides (share E.share) a short flat patch 0.05-0.75 m past the asphalt's edge, now and then two in a
     row so it reads as a streak; only on this leg's own strip (not past the barrier line, not where another leg is nearer) */
  const edge = (soft, gV, bad, R, E) => {
    const T = API.T, { nrNear } = API, N = T.px.length, step = Math.max(1, Math.round(E.step / T.ds)); let n = 0;
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      if (R() > E.share) continue;
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], reps = R() < 0.35 ? 2 : 1, a0 = (R() - 0.5) * E.step;
      for (let k = 0; k < reps; k++) {
        const o = w + 0.05 + R() * 0.7; if (o > bar - 0.3) continue;
        const a = a0 + k * (0.7 + R() * 0.4), x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
        const q = nrNear(x, z), qi = q.i, ql = Math.abs(q.lat); if (qi < 0 || Math.abs(qi - i) * T.ds > 6 || ql < T.wAt(qi) || bad(x, z)) continue;
        soil(soft, gV, x, z, Math.min(0.5, 0.26 + R() * 0.3, o - w + 0.25), E.col(R), R, 0.03); n++;
      }
    }
    return n;
  };

  /* the far band: every C.step m on both sides C.n tries between C.from m past the barrier line and C.reach m (denser near: pw > 1); on the
     ground where this leg is nearest, not in bad, not far below or above the road, not steep. C.pick hands back a patch or a tuft */
  const band = (soft, bad, R, C) => {
    const T = API.T, { nrGround, nrNear } = API, st = { zaplate: 0, sopi: 0 }, N = T.px.length;
    const slope = (x, z) => { const d = 1.2, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const d = C.from + Math.pow(R(), C.pw) * (C.reach - C.from), oo = bar + d, a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(d)) continue;
        const x = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        const q = nrNear(x, z), qi = q.i, qdd = q.dd, ql = Math.abs(q.lat);   // (nrNear hands back one shared object: read it at once)
        if (qi < 0 || Math.abs(qi - i) * T.ds > oo + 10) continue;
        const qb = q.lat > 0 ? T.br[qi] : T.bl[qi]; if (ql < qb + 2 || qdd < 3) continue;   // (another leg nearer, or on the verge)
        if (bad(x, z)) continue;
        const y = nrGround(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
        const P = C.pick(R, d, x, z); if (!P) continue;
        const h = R();
        if (P.k === 'p') { soil(soft, nrGround, x, z, P.r, P.col, R, 0.05); st.zaplate++; }
        else { tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, 5); st.sopi++; }
      }
    }
    return st;
  };

  const run = (root, matV, bad, seed, E, C) => {
    const T = API.T; if (!T || !T.br || !T.wAt || !API.nrGround || !API.nrNear || !root || !matV) return null;
    const R = rng(seed), soft = softScen(root, matV), gV = mkGV();
    const st = band(soft, bad, R, C); st.rob = edge(soft, gV, bad, R, E);
    soft.done(); return st;
  };

  /* ---- Hiva: the loess oasis (docs/proge/hiva.md). On the edge the asphalt's grey grit and the pale loess dust the wind lays on it. In the
     band the loess in darker trodden, greyer and paler dried patches (the crust), the dry grass in straw patches and tufts, and where
     WorldCover has the oasis' gardens (nrLCf class 2, the same share the builder's ground greens with) their duller green-brown; wider
     and fewer farther out ---- */
  const HVE = { step: 2.0, share: 0.7,
    col: (R) => { const r = R(); return r < 0.5 ? C3(R, [0.58, 0.55, 0.5], [0.62, 0.59, 0.53])   // (grey grit off the asphalt)
      : r < 0.85 ? C3(R, [0.8, 0.68, 0.48], [0.84, 0.72, 0.52]) : C3(R, [0.7, 0.6, 0.44], [0.73, 0.63, 0.46]); } };   // (pale loess dust; trodden)
  const HVB = { step: 3.0, n: 3, from: 3, reach: 60, pw: 1.5, drop: 4, rise: 4, maxSl: 0.9,
    keep: (d) => d < 20 ? 0.9 : d < 40 ? 0.7 : 0.5,
    pick: (R, d, x, z) => {
      const k = 1 + 0.7 * (d - 3) / 57, gd = API.nrLCf ? API.nrLCf(x, z, 2) : 0, r = R();
      if (gd > 0.4 && r < 0.45) return { k: 'p', col: C3(R, [0.6, 0.6, 0.38], [0.55, 0.56, 0.34]), r: (1.2 + R() * 1.2) * k };   // (the gardens)
      if (d < 25 && r > 0.82) return { k: 't', col: C3(R, [0.74, 0.66, 0.4], [0.66, 0.6, 0.36], 0.03), w: 0.26, h: 0.3 };   // (dry grass tufts)
      const s = R();
      return { k: 'p', r: (0.9 + R() * 1.1) * k, col: s < 0.32 ? C3(R, [0.72, 0.58, 0.4], [0.75, 0.61, 0.42])   // (trodden darker loess)
        : s < 0.55 ? C3(R, [0.74, 0.64, 0.48], [0.77, 0.66, 0.5])   // (greyer loess)
        : s < 0.8 ? C3(R, [0.72, 0.64, 0.38], [0.75, 0.66, 0.4])   // (dry grass, straw)
        : C3(R, [0.88, 0.78, 0.6], [0.9, 0.8, 0.62]) }; } };   // (the paler dried crust)

  /* ---- Luanda: the dry red ground (docs/proge/luanda.md). On the edge the asphalt's grey grit and the red laterite dust. In the band the
     red earth in a deeper and a duller red, the trodden brown, straw grass in patches and tufts; within ~40 m of the bay the pale sand
     (»pesek ob zalivu«) ---- */
  const LDE = { step: 2.0, share: 0.7,
    col: (R) => { const r = R(); return r < 0.5 ? C3(R, [0.56, 0.52, 0.48], [0.6, 0.55, 0.5])   // (grey grit off the asphalt)
      : C3(R, [0.66, 0.44, 0.3], [0.7, 0.48, 0.33]); } };   // (red laterite dust)
  const ldPick = (seaD) => (R, d, x, z) => {
    const k = 1 + 0.7 * (d - 3) / 57, r = R(), sd = seaD ? seaD(x, z) : -1e9;
    if (sd > -40 && r < 0.5) return { k: 'p', col: C3(R, [0.74, 0.64, 0.5], [0.78, 0.68, 0.54]), r: (1.0 + R() * 1.2) * k };   // (the bay's pale sand)
    if (d < 25 && r > 0.84) return { k: 't', col: C3(R, [0.7, 0.6, 0.36], [0.6, 0.54, 0.3], 0.03), w: 0.26, h: 0.3 };   // (straw grass tufts)
    const s = R();
    return { k: 'p', r: (0.9 + R() * 1.1) * k, col: s < 0.35 ? C3(R, [0.6, 0.34, 0.22], [0.64, 0.37, 0.24])   // (deeper red earth)
      : s < 0.58 ? C3(R, [0.62, 0.46, 0.34], [0.65, 0.49, 0.36])   // (duller, dusty red)
      : s < 0.8 ? C3(R, [0.52, 0.38, 0.26], [0.55, 0.4, 0.28])   // (trodden brown)
      : C3(R, [0.64, 0.54, 0.34], [0.67, 0.56, 0.36]) }; };   // (straw grass)

  /* the builders' hooks chained after the earlier groups' (what they count in the stats: rob.robBt74) */
  {
    const base = World.ext && World.ext.hivaRob;
    if (World.ext) World.ext.hivaRob = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try {
        const ex = (ctx && ctx.excluded) || (() => false), lc = API.nrLC;
        const bad = (x, z) => ex(x, z) || (lc && lc(x, z) === 5);   // (the oasis town is built cover all round: the builder's excluded keeps its houses and walls free)
        if (ctx && ctx.root && ctx.matV) r.robBt74 = run(ctx.root, ctx.matV, bad, 74101, HVE, HVB);
      } catch (e) { console.error('chase-bt74 (hiva):', e); }
      return r;
    };
  }
  {
    const base = World.ext && World.ext.luandaRob;
    if (World.ext) World.ext.luandaRob = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try {
        const { seaD, inFort } = ctx || {}, ex = (ctx && ctx.excluded) || (() => false), lc = API.nrLC;
        const bad = (x, z) => ex(x, z) || (seaD && seaD(x, z) > -4) || (inFort && inFort(x, z, 6)) || (lc && lc(x, z) === 5);
        const C = Object.assign({}, HVB, { pick: ldPick(seaD), drop: 6, rise: 5 });
        if (ctx && ctx.root && ctx.out && ctx.out.matV) r.robBt74 = run(ctx.root, ctx.out.matV, bad, 74201, LDE, C);
      } catch (e) { console.error('chase-bt74 (luanda):', e); }
      return r;
    };
  }
})();
