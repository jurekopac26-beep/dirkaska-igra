/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighty-fifth group of the real tracks: Tuzla and Ella, a
   further pass on a circuit and a mountain road whose ground the earlier groups set (Tuzla: js/world-chase-bt6.js, js/world-chase-bt45.js,
   js/world-chase-bt59.js: burnt tufts from ~16 m, the verge's and the lawn's patches, wide flat patches to ~55 m, the worn edge and the
   uncut strip at the fence; Ella: js/world-chase-bt12.js, js/world-chase-bt29.js, js/world-chase-bt57.js, js/world-dolina-bt.js: the
   verge, the bank, tussocks and laterite to ~60 m). From behind the car, on Tuzla past the watered lawn the golden hills were flat patches
   with a few dark dots, nothing standing in the grass; on Ella the grassy slopes read as one even green with bright spikes and orange spots.
   So here:
   Tuzla (docs/proge/tuzla.md: »suhi travnati griči ob koncu poletja, trava zlata, v lisah bledejša in bolj rjava«), chained on the look's
   extra (js/world-rbring.js rbLook.tuzla), only where the watered lawn has ended (from ~20 m past the road's edge) out to ~60 m past the
   fence: standing tufts of the golden and the paler grass in loose groups, low grey-green thistle and spiny cushions, the maquis's dark
   cushions on the scrub (land cover 2), pale limestone stones; denser near, thinner far.
   Ella (docs/proge/ella.md: »travnata pobočja s posameznimi drevesi, temna tla gorskega gozda v grapah … Rdeča laterna zemlja ob robu
   ceste, v usekih …, sivi gnajs na golih stenah«), chained after World.ext.goreRob (js/world-ella.js calls it last): from ~3 m past the
   barrier line to ~60 m, on the grass flat patches of a darker wet and a paler sun-dried green so the slope is not one colour, soft
   broad tussocks in a mid green; at and under the forest (land cover 1) the dark leaf litter and low ferns; on bare ground (3) and on
   steep faces grey gneiss stones and the red laterite. And the earlier tussocks' green (js/world-chase-bt57.js) is muted toward its grey.
   Nothing in the tea rows, the fields or the town (Ella: 6, 7, 5), on built ground (Tuzla: 3), on the pits' side along the pits, in the
   builders' excluded places, where another leg's road is nearer, on a face too steep or far below the road. The horizon stays the builders'
   own DEM terrain. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers, the trees
   and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // (as js/world-chase-bt84.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.015), k);
  const T3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.03), k || 0.97);

  /* the band: every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m (denser near); each place a small
     group (C.grp things within C.spread m), so it reads as clumps on the ground, not as an even sprinkle. near(x, z) -> { i, lat } */
  const band = (soft, near, gT, slope, lc, bad, R, C, st) => {
    const T = API.T, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar, oo - T.wAt(i))) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (q.i < 0 || gap(q.i, i, N) * T.ds > oo + 12) continue;
          const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (on or by a road: this leg's or another's)
          if (bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
          const c = lc ? lc(x, z) : 0; if (C.skip && C.skip(c)) continue;
          const dE = Math.abs(q.lat) - T.wAt(q.i);
          const P = C.pick(R, oo - bar, s, c, dE), h = R(); if (!P) continue;
          if (P.k === 'p') soil(soft, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g' || P.k === 's') cushion(soft.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };

  /* ---- Tuzla: past the lawn, the golden hills (colours of js/world-chase-bt45.js TZ: gold, pale, brown, maquis, earth) ---- */
  const TZ = {
    gold: [[0.7, 0.58, 0.33], [0.78, 0.65, 0.38]], pale: [[0.78, 0.71, 0.49], [0.84, 0.76, 0.54]], brown: [[0.56, 0.45, 0.29], [0.62, 0.49, 0.32]],
    thistle: [[0.48, 0.52, 0.4], [0.55, 0.57, 0.45]], maq: [[0.28, 0.32, 0.19], [0.33, 0.36, 0.22]], stone: [[0.74, 0.71, 0.64], [0.8, 0.77, 0.69]],
  };
  const TZF = { step: 4.2, n: 2, grp: 3, spread: 3.5, from: 3.5, reach: 60, pw: 1.25, drop: 9, rise: 25, maxSl: 0.9,
    keep: (d, dE) => dE < 20 ? 0 : dE < 26 ? 0.45 : d < 35 ? 0.8 : 0.6,   // (nothing on the watered lawn: green to ~14 m, straw from ~24 m past the edge)
    skip: (c) => c === 3,
    pick: (R, d, s, c) => { const r = R(), w = d < 30 ? 1.5 : 1.9;
      if (c === 2) return r < 0.5 ? { c: 'makija', k: 'g', w: 0.8 * w, h: 0.55, col: T3(R, TZ.maq[0], TZ.maq[1]) }
        : r < 0.8 ? { c: 'sopi', k: 't', w: 0.32 * w, h: 0.5, col: T3(R, TZ.gold[0], TZ.gold[1]) } : { c: 'kamni', k: 's', w: 0.4, h: 0.22, col: T3(R, TZ.stone[0], TZ.stone[1], 0.95) };
      if (r < 0.5) return { c: 'sopi', k: 't', w: 0.3 * w, h: d < 30 ? 0.6 : 0.75, col: T3(R, ...(R() < 0.65 ? TZ.gold : TZ.pale)) };
      if (r < 0.66) return { c: 'sopi', k: 't', w: 0.26 * w, h: 0.38, col: T3(R, TZ.brown[0], TZ.brown[1]) };
      if (r < 0.82) return { c: 'osat', k: 'g', w: 0.42 * w, h: 0.3, col: T3(R, TZ.thistle[0], TZ.thistle[1]) };   // (thistles and spiny cushions, grey-green)
      if (r < 0.88) return { c: 'makija', k: 'g', w: 0.7 * w, h: 0.5, col: T3(R, TZ.maq[0], TZ.maq[1]) };
      if (r < 0.94) return { c: 'lise', k: 'p', r: 1.6 + R() * 2.2, col: C3(R, ...(R() < 0.5 ? TZ.pale : TZ.brown)) };   // (the paler and browner spots in the gold)
      return { c: 'kamni', k: 's', w: 0.38 * w, h: 0.2, col: T3(R, TZ.stone[0], TZ.stone[1], 0.95) }; } };

  const tuzla = (ctx) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear, nrLC } = API;
    if (!root || !matV || !T || !T.br || !T.wAt || !nrGround || !nrNear) return null;
    const N = T.px.length, ds = T.ds, pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const bad = (x, z) => { if (excluded(x, z)) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const slope = (x, z) => { const d = 1.0, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const near = (x, z) => nrNear(x, z);
    const R = rng(85100), soft = softScen(root, matV), st = {};
    band(soft, near, nrGround, slope, nrLC, bad, R, TZF, st);
    soft.done(); return st;
  };
  const L = API.rbLook || {};
  if (L.tuzla) chain(L.tuzla, (ctx) => { try { if (ctx.out) ctx.out.pasBt85 = tuzla(ctx); } catch (e) { console.error('chase-bt85 (tuzla):', e); } });

  /* ---- Ella: the grassy slopes, the forest's floor, the bare cuts (land cover of js/world-ella.js vrLC: 1 forest, 0 and 2 grass and
     scrub, 3 bare, 5 town, 6 tea, 7 fields) ---- */
  const EL = {
    wet: [[0.24, 0.4, 0.15], [0.27, 0.43, 0.17]], dry: [[0.42, 0.48, 0.24], [0.47, 0.5, 0.27]], mid: [[0.3, 0.44, 0.18], [0.36, 0.47, 0.21]],
    litter: [[0.3, 0.24, 0.15], [0.35, 0.28, 0.17]], fern: [[0.22, 0.38, 0.14], [0.26, 0.42, 0.16]], lat: [[0.5, 0.32, 0.22], [0.55, 0.36, 0.24]],
    gneiss: [[0.5, 0.5, 0.48], [0.56, 0.55, 0.52]],
  };
  const ELF = { step: 4.0, n: 2, grp: 3, spread: 4, from: 3, reach: 60, pw: 1.35, drop: 14, rise: 30, maxSl: 1.5,
    keep: (d) => d < 20 ? 0.6 : 0.75,
    skip: (c) => c === 5 || c === 6 || c === 7,
    pick: (R, d, s, c) => { const r = R(), w = d < 25 ? 1.3 : 1.8;
      if (c === 3 || s > 1.0) return r < 0.45 ? { c: 'kamni', k: 's', w: 0.45 * w, h: 0.3, col: T3(R, EL.gneiss[0], EL.gneiss[1], 0.95) }
        : r < 0.8 ? { c: 'laterit', k: 'p', r: (0.9 + R() * 1.1) * w, col: C3(R, EL.lat[0], EL.lat[1]) } : null;
      if (c === 1) return r < 0.5 ? { c: 'listje', k: 'p', r: (1.1 + R() * 1.4) * w, col: C3(R, EL.litter[0], EL.litter[1]) }
        : r < 0.85 ? { c: 'praprot', k: 'g', w: 0.6 * w, h: 0.38, col: T3(R, EL.fern[0], EL.fern[1]) } : { c: 'kamni', k: 's', w: 0.4, h: 0.26, col: T3(R, EL.gneiss[0], EL.gneiss[1], 0.9) };
      if (r < 0.28) return { c: 'zaplate', k: 'p', r: (1.4 + R() * 1.8) * w, col: C3(R, EL.wet[0], EL.wet[1]) };
      if (r < 0.48) return { c: 'zaplate', k: 'p', r: (1.2 + R() * 1.5) * w, col: C3(R, EL.dry[0], EL.dry[1]) };
      if (r < 0.88) return { c: 'trava', k: 't', w: 0.42 * w, h: 0.55, col: T3(R, EL.mid[0], EL.mid[1]), n: 6 };
      return { c: 'laterit', k: 'p', r: (0.8 + R() * 0.9) * w, col: C3(R, EL.lat[0], EL.lat[1]) }; } };

  const ella = (ctx, o) => {
    const T = API.T; if (!T || !T.br || !T.wAt || !ctx.out || !ctx.root || !ctx.out.matV) return null;
    const gT = o.gH || API.vrGround, slope = o.slope || API.vrSlope, near0 = o.near || API.vrNear, lc = o.lc || API.vrLC; if (!gT || !slope || !near0) return null;
    const ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || (o.bad && o.bad(x, z));
    const q2 = { i: -1, lat: 0 }, near = (x, z) => { const q = near0(x, z); q2.i = q.i;
      q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; };
    const R = rng(85200), soft = softScen(ctx.root, ctx.out.matV), st = {};
    band(soft, near, gT, slope, lc, bad, R, ELF, st);
    soft.done(); return st;
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'ella' && ctx && ctx.out) try { ctx.out.robBt85 = ella(ctx, o || {}); } catch (e) { console.error('chase-bt85 (ella):', e); }
      return r;
    };
    Object.assign(f, base);
    World.ext.goreRob = f;
  }
  void clamp;
})();
