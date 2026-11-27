/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the ninety-fifth group of the real tracks: Llogara and Lombok, a
   further pass on a pass road and a circuit whose ground the earlier groups set (Llogara: js/world-chase-bt6.js, js/world-chase-bt28.js,
   js/world-chase-bt69.js: the karst, the verge's and the bank's patches to ~8 m, wide flat patches, a few tufts and maquis clumps to
   ~58 m; Lombok: js/world-chase-bt46.js, js/world-chase-bt59.js, js/world-chase-bt79.js: the lawn's patches, the worn edge, the fence's
   foot, the straw band of flat patches to ~55 m). From behind the car, on Llogara the wide verge between the asphalt and the barrier was
   flat patches with nothing standing in it, and past the barrier the forest floor and the south face flat patches between the builder's
   rocks and maquis; on Lombok past the watered lawn the dry plain was flat straw and red patches with a few dots.
   So here:
   Llogara (docs/proge/llogara.md: »Severna stran je gozd jelke in črnega bora … Južno pobočje je golo sivo apnenčasto skalovje v rebrih
   in meliščih, vmes suha trava in temne zaplate makije«), chained on the look's extra (js/world-prelaz.js PL_LOOK.llogara), in the
   builder's own scenery chunks (no draw calls of its own): on the verge from ~1 m past the asphalt to the barrier low tufts and small
   stones, sparse (north the shaded forest grass and grey stones, south and over the pass the dry gold grass and pale limestone); past
   the barrier to ~60 m in loose groups, north the forest grass's tufts and low tussocks, the needle litter and grey stones, south the
   gold and the paler tufts, limestone stones, scree on the steep and, where it is gentle, the maquis's dark low cushions.
   Lombok (docs/proge/lombok.md: »trava slamnato zelena, z lisami rdeče prsti; tik ob progi zalite zelene trate s pokošenimi pasovi …
   grmi«), chained on the look's extra (js/world-rbring.js rbLook.lombok), only where the watered lawn has ended (from ~14 m past the
   road's edge) out to ~60 m past the fence: standing tufts of the straw and the straw-green grass in loose groups, lower browner tufts,
   the dry scrub's dark olive cushions on the scrub (land cover 2), small spots of the red earth; denser near, thinner far.
   Nothing on built ground, on the pits' side along the pits, in the builders' excluded places, where another leg's road is nearer, on a
   face too steep or far below the road. All of Lombok's in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the
   road, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt84.js, js/world-chase-bt85.js: a third of the way toward the colour's grey and a little darker, so it reads as ground)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, ab, k) => mute(vary(mix3(ab[0], ab[1], R()), R, 0.015), k);
  const T3 = (R, ab, k) => mute(vary(mix3(ab[0], ab[1], R()), R, 0.03), k || 1.04);

  const put = (scen, gT, x, y, z, P, R) => { const h = R();
    if (P.k === 'p') soil(scen, gT, x, z, P.r, P.col, R, 0.05);
    else if (P.k === 'g' || P.k === 's') cushion(scen.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
    else tuft(scen.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5); };

  /* the band (js/world-chase-bt85.js's): every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m (denser
     near); each place a small group (C.grp things within C.spread m), so it reads as clumps on the ground, not as an even sprinkle.
     near(x, z) -> { i, lat }; C.pick(R, past the barrier, slope, land cover, past the asphalt, the road's index) */
  const band = (scen, near, gT, slope, lc, bad, R, C, st) => {
    const T = API.T, N = T.px.length, wAt = (i) => T.wAt ? T.wAt(i) : T.w;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar, oo - wAt(i))) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (q.i < 0 || (C.loop ? gap(q.i, i, N) : Math.abs(q.i - i)) * T.ds > oo + 12) continue;
          const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (on or by a road: this leg's or another's)
          if (bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
          const c = lc ? lc(x, z) : 0; if (C.skip && C.skip(c)) continue;
          const P = C.pick(R, oo - bar, s, c, Math.abs(q.lat) - wAt(q.i), q.i); if (!P) continue;
          put(scen, gT, x, y, z, P, R);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };
  const slopeOf = (gT) => (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };

  /* ---- Llogara (colours of js/world-chase-bt28.js, js/world-chase-bt69.js: the forest grass, the needle litter, the grey rock; the
     limestone grit, the gold grass, the maquis). The side of the pass is the road's index against its highest point, as there ---- */
  const LG = { top: 0,
    fgrass: [[0.46, 0.55, 0.29], [0.52, 0.58, 0.33]], fdark: [[0.38, 0.47, 0.25], [0.43, 0.51, 0.28]], litter: [[0.44, 0.35, 0.25], [0.49, 0.39, 0.28]],
    rock: [[0.58, 0.57, 0.53], [0.64, 0.62, 0.58]], lime: [[0.66, 0.65, 0.61], [0.73, 0.71, 0.66]], scree: [[0.6, 0.59, 0.55], [0.66, 0.64, 0.59]],
    gold: [[0.72, 0.64, 0.42], [0.78, 0.69, 0.46]], pale: [[0.8, 0.75, 0.55], [0.85, 0.79, 0.59]], hollow: [[0.54, 0.56, 0.35], [0.58, 0.59, 0.38]],
    maq: [[0.24, 0.3, 0.17], [0.28, 0.33, 0.19]],
  };
  const north = (i) => i < LG.top;
  const LGF = { step: 3.6, n: 3, grp: 3, spread: 3.5, from: 1.2, reach: 60, pw: 1.3, drop: 10, rise: 28, maxSl: 1.4,
    keep: (d) => d < 25 ? 0.8 : 0.6,
    pick: (R, d, s, c, dE, i) => { const r = R(), w = d < 25 ? 1.3 : 1.8;
      if (north(i)) {
        if (r < 0.42) return { c: 'gozdSopi', k: 't', w: 0.4 * w, h: 0.5, col: T3(R, LG.fgrass) };
        if (r < 0.6) return { c: 'gozdBlazine', k: 'g', w: 0.5 * w, h: 0.24, col: T3(R, LG.fdark) };   // (a low tussock of the shaded grass)
        if (r < 0.8) return { c: 'iglice', k: 'p', r: (0.9 + R() * 1.1) * w, col: C3(R, LG.litter) };
        return { c: 'kamni', k: 's', w: 0.4 * w, h: 0.24, col: T3(R, LG.rock, 0.93) };
      }
      if (s > 0.9) return r < 0.55 ? { c: 'kamni', k: 's', w: 0.45 * w, h: 0.28, col: T3(R, LG.lime, 0.95) } : r < 0.85 ? { c: 'melisce', k: 'p', r: (0.9 + R() * 1.0) * w, col: C3(R, LG.scree) } : null;
      if (r < 0.44) return { c: 'sopi', k: 't', w: 0.4 * w, h: 0.6, col: T3(R, R() < 0.65 ? LG.gold : LG.pale) };
      if (r < 0.56) return { c: 'sopi', k: 't', w: 0.34 * w, h: 0.4, col: T3(R, LG.hollow) };   // (the greener grass in the hollows)
      if (r < 0.72) return s < 0.6 ? { c: 'makija', k: 'g', w: 0.7 * w, h: 0.45, col: T3(R, LG.maq) } : null;
      return { c: 'kamni', k: 's', w: 0.42 * w, h: 0.24, col: T3(R, LG.lime, 0.95) }; } };
  // the verge between the asphalt and the barrier: low and sparse, from ~1 m past the asphalt
  const verge = (scen, near, gT, bad, R, st) => {
    const T = API.T, N = T.px.length, step = 1.8, wAt = (i) => T.wAt ? T.wAt(i) : T.w;
    for (let i = 0; i < N; i += Math.max(1, Math.round(step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.6) continue;
      const w = wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], lo = w + 1.0, hi = bar - 0.5; if (hi - lo < 0.5) continue;
      const o = lo + r1 * (hi - lo), a = (r2 - 0.5) * step, n = north(i);
      const gx = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      for (let m = 0, cnt = 1 + Math.floor(R() * 3); m < cnt; m++) {   // (a small clump)
        const x = gx + (m ? (R() - 0.5) * 1.4 : 0), z = gz + (m ? (R() - 0.5) * 1.4 : 0), r3 = R();
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 8 || q.lat * sd <= 0 || Math.abs(q.lat) < lo - 0.2 || Math.abs(q.lat) > hi + 0.2 || bad(x, z)) continue;
        const y = gT(x, z); if (Math.abs(y - T.hy[i]) > 1.5) continue;
        const P = r3 < 0.7 ? { c: 'robSopi', k: 't', w: 0.42, h: 0.34, col: T3(R, n ? LG.fgrass : R() < 0.7 ? LG.gold : LG.pale) }
          : { c: 'robKamni', k: 's', w: 0.26, h: 0.16, col: T3(R, n ? LG.rock : LG.lime, 0.94) };
        put(scen, gT, x, y, z, P, R); st[P.c] = (st[P.c] || 0) + 1;
      }
    }
    return st;
  };
  const LK = API.PL_LOOK || {};
  if (LK.llogara) chain(LK.llogara, (ctx) => { try {
    const T = API.T, gT = API.caGround || API.vrGround, near0 = API.vrNear, lc = API.vrLC;
    if (!ctx.out || !ctx.scen || !T || !T.br || !gT || !near0) return;
    const ex = ctx.excluded || (() => false);
    let top = 0; for (let i = 1; i < T.hy.length; i++) if (T.hy[i] > T.hy[top]) top = i;
    LG.top = Math.max(0, top - Math.round(40 / T.ds));
    const bad = (x, z) => { if (ex(x, z)) return true; const c = lc ? lc(x, z) : 0; return c === 3 || c === 5; };
    const q2 = { i: -1, lat: 0 }, near = (x, z) => { const q = near0(x, z); q2.i = q.i;
      q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; };
    const R = rng(95100), st = {};
    verge(ctx.scen, near, gT, bad, R, st);
    band(ctx.scen, near, gT, slopeOf(gT), null, bad, R, LGF, st);
    ctx.out.robBt95 = st;
  } catch (e) { console.error('chase-bt95 (llogara):', e); } });

  /* ---- Lombok: past the watered lawn, the dry plain (colours of js/world-chase-bt46.js LB: straw, straw-green, red earth; the scrub's
     ground dark olive, js/world-lombok.js). Land cover: 1 trees, 2 scrub, 3 built ---- */
  const LB = {
    straw: [[0.7, 0.65, 0.39], [0.77, 0.7, 0.45]], strawG: [[0.58, 0.6, 0.33], [0.64, 0.64, 0.37]], brown: [[0.5, 0.42, 0.27], [0.56, 0.46, 0.3]],
    green: [[0.36, 0.46, 0.2], [0.42, 0.5, 0.24]], scrub: [[0.27, 0.32, 0.17], [0.32, 0.36, 0.2]], red: [[0.55, 0.33, 0.24], [0.6, 0.37, 0.27]],
  };
  const LBF = { loop: true, step: 3.6, n: 3, grp: 3, spread: 3.5, from: 3.5, reach: 60, pw: 1.25, drop: 5, rise: 14, maxSl: 0.8,
    keep: (d, dE) => dE < 14 ? 0 : dE < 26 ? 0.4 : d < 35 ? 0.8 : 0.6,   // (nothing on the watered lawn: green to ~8 m, straw from ~26 m past the track)
    skip: (c) => c === 3,
    pick: (R, d, s, c) => { const r = R(), w = d < 30 ? 1.4 : 1.8;
      if (c === 2) return r < 0.5 ? { c: 'grmi', k: 'g', w: 0.8 * w, h: 0.5, col: T3(R, LB.scrub) } : r < 0.85 ? { c: 'sopi', k: 't', w: 0.3 * w, h: 0.5, col: T3(R, LB.strawG) } : null;
      if (c === 1) return r < 0.5 ? { c: 'sopi', k: 't', w: 0.28 * w, h: 0.4, col: T3(R, R() < 0.5 ? LB.strawG : LB.green) } : null;   // (under the trees lower and greener)
      if (r < 0.42) return { c: 'sopi', k: 't', w: 0.4 * w, h: d < 30 ? 0.6 : 0.75, col: T3(R, LB.straw) };
      if (r < 0.7) return { c: 'sopi', k: 't', w: 0.38 * w, h: 0.55, col: T3(R, LB.strawG) };
      if (r < 0.82) return { c: 'sopi', k: 't', w: 0.26 * w, h: 0.34, col: T3(R, LB.brown) };
      if (r < 0.9) return { c: 'grmi', k: 'g', w: 0.6 * w, h: 0.38, col: T3(R, LB.scrub) };
      return { c: 'prst', k: 'p', r: 0.7 + R() * 0.9, col: C3(R, LB.red) }; } };
  const lombok = (ctx) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear, nrLC } = API;
    if (!root || !matV || !T || !T.br || !nrGround || !nrNear || (T.def && T.def.id !== 'lombok')) return null;
    const ds = T.ds, pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const bad = (x, z) => { if (excluded(x, z)) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const R = rng(95200), soft = softScen(root, matV), st = {};
    band(soft, (x, z) => nrNear(x, z), nrGround, slopeOf(nrGround), nrLC, bad, R, LBF, st);
    soft.done(); return st;
  };
  const LL = (API.rbLook || {}).lombok;
  if (LL) chain(LL, (ctx) => { try { const st = lombok(ctx); if (st && ctx.out) ctx.out.pasBt95 = st; } catch (e) { console.error('chase-bt95 (lombok):', e); } });
})();
