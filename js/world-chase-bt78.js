/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventy-eighth group of the real tracks: Pembrey and Kanaba,
   a further pass on two tracks whose ground the earlier groups set (js/world-chase-bt21.js, js/world-chase-bt39.js: Pembrey's verge,
   the run-offs' sand, the bank to ~10 m and a sparse band of wide patches to ~55 m, one every 6 m on half of the places;
   js/world-chase-bt7.js, js/world-chase-bt40.js: Kanaba's tufts, the red dust on the strip, the bank to ~8 m and a sparse band to ~55 m).
   From behind the car the asphalt's (on Pembrey the kerb's) edge met the verge in one clean line, and between the sparse band's patches the
   ground out to the horizon's DEM terrain stood in one even sheet. So here, as the seventy-third group did (js/world-chase-bt73.js), on
   both a worn edge (0.05-0.75 m past the asphalt's or the kerb's edge, thin and broken) and a denser band from the bank's end to ~60 m past
   the barrier line, thinning with distance. Kanaba (docs/proge/kanaba.md): »obrabljen asfalt z rdečim prahom ob robu« on the edge; »zelena
   polja in pašniki na rdeči prsti, gozdni pasovi in grmičevje, rdeče-rjava preperela kamnina v useku« further out. Pembrey
   (docs/proge/pembrey.md): the sand blown from the dunes onto the verge and the mown grass worn bare at the kerb's foot on the edge;
   »obalna trava v suhih in vlažnih lisah«, »pašniki in pokošena silaža«, the pines' needles where the woods come up further out (the
   builder's gorse, 12-58 m out, stays as it is). Nothing on the pits' side along the pits, on the run-offs, on built ground (land cover 3),
   in the builder's excluded places, nowhere another leg's road is nearer, nor on a face too steep. The horizons stay as they are (Pembrey's
   rings, js/world-riverside.js rsFar; Kanaba's DEM terrain). All of it in meshes of their own (softScen: 256 m chunks, no shadow); the
   terrain, the road, the kerbs, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API, LK = API.PL_LOOK;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const gap = (a, b, N, loop) => { const d = Math.abs(a - b); return loop ? Math.min(d, N - d) : d; };

  // (as js/world-chase-bt73.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.015), k);
  const TC = (R, a, b) => mute(vary(mix3(a, b, R()), R, 0.03));

  /* the far band: every C.step m on both sides C.n tries between C.from m past the barrier line and C.reach m (denser near), only where this
     leg's road is the nearest (near: {i, lat}), not in bad, not far below or above the road, not steeper than C.maxSl; C.pick says what */
  const band = (soft, near, gT, bad, lc, R, C) => {
    const T = API.T, st = { zaplate: 0, grmi: 0, sopi: 0 }, N = T.px.length, loop = !!C.loop;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      if (C.skip && C.skip(i, sd)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const x = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || gap(q.i, i, N, loop) * T.ds > oo + 10 || q.lat * sd < 0) continue;
        const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (another leg nearer)
        if (bad(x, z)) continue;
        const c = lc ? lc(x, z) : 0; if (C.skipLC && C.skipLC(c)) continue;
        const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
        const P = C.pick(R, oo - bar, s, c), h = R(); if (!P) continue;
        if (P.k === 'p') { soil(soft, gT, x, z, P.r, P.col, R, 0.05); st.zaplate++; }
        else if (P.k === 'g') { cushion(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.5), P.h * (0.8 + h * 0.5), P.col, R); st.grmi++; }
        else { tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, 5); st.sopi++; }
      }
    }
    return st;
  };

  /* ---- Kanaba (a pass-builder road, js/world-prelaz.js: its look's extra chained). On the edge (as js/world-chase-bt73.js) every E.step m
     on both sides a short flat patch just past the asphalt's edge, at the road's height or the ground's: the red dust worn and washed onto
     it, now and then the weathered rock's paler grit. Further out, over bt40's bank and between and past its sparse band: the pasture (green
     and drier), the red earth showing through, the cuttings' red-brown rock on the steeper parts, tufts of the pasture's grass, the scrub's
     green bushes in low cushions and the forest strips' darker ones (not dark: as bt40's scrub). ---- */
  const latOf = (T, near) => { const q2 = { i: -1, lat: 0 }; return (x, z) => { const q = near(x, z); q2.i = q.i;
    q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; }; };
  const edgePass = (soft, near, gT, bad, R, E) => {
    const T = API.T, N = T.px.length, step = Math.max(1, Math.round(E.step / T.ds)); let n = 0;
    const gE = (x, z) => { const q = near(x, z), g = gT(x, z); return q.i >= 0 ? Math.max(g, T.hy[q.i] - 0.03) : g; };
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      if (R() > E.share) continue;
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], o = w + 0.05 + R() * 0.7; if (o > bar + 0.5) continue;   // (flat, so it may lie under the barrier's rail)
      const a = (R() - 0.5) * E.step, x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 6 || Math.abs(q.lat) < T.wAt(q.i) || bad(x, z)) continue;
      const g = gT(x, z); if (!(g > T.hy[i] - 1.2) || !(g < T.hy[i] + 1.2)) continue;
      soil(soft, gE, x, z, Math.min(0.55, 0.3 + R() * 0.35), E.col(R), R, 0.04); n++;
    }
    return n;
  };
  const KNE = { step: 2.2, share: 0.75,
    col: (R) => R() < 0.78 ? C3(R, [0.54, 0.35, 0.25], [0.58, 0.38, 0.27]) : C3(R, [0.55, 0.43, 0.35], [0.58, 0.46, 0.37]) };   // (red dust; weathered grit)
  const KNF = { step: 3.4, n: 3, from: 3, reach: 60, pw: 1.5, drop: 8, rise: 40, maxSl: 1.3,
    keep: (d) => d < 25 ? 0.85 : 0.6,
    pick: (R, d, s) => { const r = R(), w = d < 25 ? 1 : 1.5;
      if (s > 0.9) return r < 0.65 ? { k: 'p', r: (1.0 + R() * 1.6) * w, col: C3(R, [0.5, 0.33, 0.25], [0.54, 0.35, 0.26]) } : null;   // (the cutting's red-brown rock)
      if (r < 0.3) return { k: 'p', r: (1.3 + R() * 1.8) * w, col: C3(R, [0.3, 0.44, 0.18], [0.35, 0.47, 0.2]) };   // (pasture)
      if (r < 0.48) return { k: 'p', r: (1.2 + R() * 1.6) * w, col: C3(R, [0.41, 0.45, 0.21], [0.45, 0.47, 0.23]) };   // (drier grass)
      if (r < 0.58) return { k: 'p', r: (0.9 + R() * 1.1) * w, col: C3(R, [0.5, 0.33, 0.23], [0.55, 0.36, 0.25]) };   // (the red earth showing through)
      if (r < 0.8) return { k: 't', w: 0.34, h: 0.48, col: TC(R, [0.3, 0.44, 0.17], [0.4, 0.48, 0.22]) };   // (the pasture's tufts)
      return { k: 'g', w: d < 25 ? 0.8 : 1.1, h: 0.6, col: mute(vary(R() < 0.6 ? [0.22, 0.34, 0.14] : [0.19, 0.31, 0.13], R, 0.025), 0.97) }; } };   // (scrub, the forest strips' edge)
  if (LK && LK.kanaba) chain(LK.kanaba, (ctx) => {
    if (!ctx.out) return;
    try {
      const T = API.T, gT = API.caGround || API.vrGround, near0 = API.vrNear, root = ctx.root, matV = ctx.matV || ctx.out.matV;
      if (!T || !T.br || !T.wAt || !gT || !near0 || !root || !matV) return;
      const near = latOf(T, near0), R = rng(78100), soft = softScen(root, matV), bad = ctx.excluded || (() => false);
      const st = band(soft, near, gT, bad, null, R, KNF); st.rob = edgePass(soft, near, gT, bad, R, KNE);
      soft.done(); ctx.out.robBt78 = st;
    } catch (e) { console.error('chase-bt78 (kanaba):', e); }
  });

  /* ---- Pembrey (the shared circuit builder, js/world-rbring.js: its look's extra chained). On the edge every 2.2 m on both sides a short
     flat patch on the verge just past the kerb (or the asphalt where there is none), on the verge's own cross-section (js/world-rbring.js
     rbVerge): the dunes' sand blown onto it and the mown grass worn to bare sandy earth; nothing on the run-offs (their sand is bt39's) or
     on the pits' side along the pits. Further out, from 10 m (bt39's bank) to ~60 m: the coastal grass in dry and damp patches, the
     pasture and the mown silage, bare sand now and then, the pines' needles where the woods come up (land cover 1), tufts of the coastal
     grass and the rushes in the damp patches. ---- */
  const PB = {
    sand: [[0.74, 0.68, 0.52], [0.78, 0.71, 0.55]], worn: [[0.56, 0.52, 0.4], [0.6, 0.55, 0.42]],
    grass: [[0.38, 0.51, 0.22], [0.41, 0.53, 0.24]], grassD: [[0.29, 0.42, 0.17], [0.32, 0.45, 0.18]], dry: [[0.54, 0.54, 0.31], [0.58, 0.56, 0.34]],
    silage: [[0.47, 0.53, 0.27], [0.5, 0.55, 0.29]], coast: [[0.44, 0.53, 0.26], [0.66, 0.63, 0.4]], rush: [[0.3, 0.42, 0.19], [0.36, 0.46, 0.22]],
    needle: [[0.46, 0.35, 0.22], [0.5, 0.38, 0.24]],
  };
  const PBF = { loop: true, step: 4, n: 3, from: 10, reach: 60, pw: 1.4, drop: 3, rise: 6, maxSl: 1.1, skipLC: (c) => c === 3,
    keep: (d) => d < 30 ? 0.75 : 0.55,
    pick: (R, d, s, c) => { const r = R(), w = d < 30 ? 1 : 1.4;
      if (c === 1) return r < 0.75 ? { k: 'p', r: (1.2 + R() * 1.4) * w, col: C3(R, PB.needle[0], PB.needle[1]) }   // (under the pines)
        : { k: 't', w: 0.3, h: 0.38, col: TC(R, PB.grassD[0], PB.grassD[1]) };
      if (r < 0.22) return { k: 'p', r: (1.3 + R() * 1.7) * w, col: C3(R, PB.dry[0], PB.dry[1]) };   // (the coastal grass, dry)
      if (r < 0.42) return { k: 'p', r: (1.3 + R() * 1.7) * w, col: C3(R, PB.grassD[0], PB.grassD[1]) };   // (the coastal grass, damp)
      if (r < 0.56) return { k: 'p', r: (1.4 + R() * 1.8) * w, col: C3(R, r < 0.49 ? PB.silage[0] : PB.grass[0], r < 0.49 ? PB.silage[1] : PB.grass[1]) };   // (pasture, silage)
      if (r < 0.62) return { k: 'p', r: (0.8 + R() * 1.0) * w, col: C3(R, PB.sand[0], PB.sand[1]) };   // (bare sand)
      if (r < 0.9) return { k: 't', w: 0.3, h: 0.4, col: TC(R, PB.coast[0], PB.coast[1]) };   // (coastal grass tufts)
      return { k: 't', w: 0.26, h: 0.6, col: TC(R, PB.rush[0], PB.rush[1]) }; } };   // (rushes)
  const pembrey = (ctx) => {
    const T = API.T, { nrGround, nrLC, nrNear } = API, root = ctx.root, matV = ctx.matV || (ctx.out && ctx.out.matV);
    if (!ctx.out || !root || !matV || !T || !T.br || !nrGround || !nrNear) return;
    const excluded = ctx.excluded || (() => false), bankY = API.nrBankY || (() => 0), N = T.px.length, w = T.w, cw = T.curbW || 1, ds = T.ds;
    const pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const pit = (i, sd) => !!pd && sd === PSD && pitI(i);
    const bad = (x, z) => { if (excluded(x, z)) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const R = rng(78200), soft = softScen(root, matV), st = { rob: 0 };
    // the worn edge on the verge's first row (rbVerge: 0 at the road's edge, -0.04 m 1.2 m out), the patch's centre at least 0.3 m in
    const vH = (x, z) => { const q = nrNear(x, z); if (q.i < 0) return nrGround(x, z); const o = Math.abs(q.lat);
      return T.hy[q.i] + bankY(q.i, q.lat) - 0.04 * clamp((o - w) / 1.2, 0, 1); };
    for (let i = 0, step = Math.max(1, Math.round(2.2 / ds)); i < N; i += step) for (const sd of [-1, 1]) {
      if (pit(i, sd) || R() > 0.72) continue;
      const gv = sd > 0 ? T.gravR : T.gravL; if (gv && gv[i]) continue;   // (the run-off's sand: bt39)
      const bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + (T.curb && T.curb[i] ? cw : 0) + 0.05, o = e0 + 0.25 + R() * 0.5; if (o > bar - 0.4) continue;
      const a = (R() - 0.5) * 2.2, x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = nrNear(x, z); if (q.i < 0 || gap(q.i, i, N, true) * ds > 6 || q.lat * sd < 0 || Math.abs(q.lat) < e0 || bad(x, z)) continue;
      const col = R() < 0.55 ? C3(R, PB.sand[0], PB.sand[1]) : C3(R, PB.worn[0], PB.worn[1]);
      soil(soft, vH, x, z, Math.min(0.5, 0.28 + R() * 0.3, o - e0 + 0.15), col, R, 0.035); st.rob++;
    }
    Object.assign(st, band(soft, nrNear, nrGround, bad, nrLC, R, Object.assign({ skip: pit }, PBF)));
    soft.done(); ctx.out.robBt78 = st;
  };
  const LP = (API.rbLook || {}).pembrey;
  if (LP) chain(LP, (ctx) => { try { pembrey(ctx); } catch (e) { console.error('chase-bt78 (pembrey):', e); } });
})();
