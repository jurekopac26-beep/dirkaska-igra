/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-eleventh group of the real tracks: Isuna, a
   fourth pass on a valley road whose ground the earlier groups set (js/world-chase-bt11.js, js/world-chase-bt42.js,
   js/world-chase-bt76.js: the verge, the bank to ~9 m, the worn edge, and to ~60 m flat patches, needle litter, wormwood cushions,
   bushes, a few tufts and rocks). From behind the car the grazed valley floor still read as flat patches with cushions, almost nothing
   standing in the grass; under the forest the ground was litter only; and the Paro Chhu's banks were the same grass right to the water.
   So here (docs/proge/isuna.md: »Na eni strani reka Paro Chhu pod cesto, na drugi pobočje z gozdom modrega bora … krave na pašnikih«;
   the river from OSM, the forest from the public land cover, both as the track's def carries them), chained after World.ext.goreRob
   (js/world-isuna.js calls it with no o, on Vršič's corridor's API):
   - on the pasture from ~2.5 m past the barrier line to ~60 m: short grazed tufts of grass in loose groups, among them paler dry
     seed-heads and a few taller ungrazed tussocks; denser near, thinner far;
   - at and under the forest (land cover 1): young blue pines (low blue-green cones, 0.7–1.6 m) and low ferns between the needle litter;
   - along the river, on the ~7 m of bank the earlier groups kept free, within ~65 m of the road: the river's rounded grey cobbles in
     small groups and pale bars of sand and gravel.
   Hiva, the group's other track, is left out: an open pull request of another account (#1079, the realism of Hiva's roadside) changes
   the same ground. Nothing on built ground or water (3, 5), on rock (4, 7) and steep faces, in the builders' excluded places, where
   another leg's road is nearer or far below the road. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain,
   the road, the barriers, the trees, the river and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;

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

  /* ---- Isuna (land cover of Vršič's corridor, API.vrLC: 1 forest, 3 and 5 built and water, 4 and 7 rock, else the grazed floor) ---- */
  const IS = {
    grass: [[0.33, 0.45, 0.18], [0.4, 0.5, 0.22]], seed: [[0.6, 0.57, 0.36], [0.67, 0.62, 0.4]], tall: [[0.36, 0.44, 0.2], [0.44, 0.48, 0.24]],
    pine: [[0.2, 0.34, 0.25], [0.25, 0.4, 0.29]], fern: [[0.25, 0.4, 0.17], [0.3, 0.44, 0.2]],   // (the blue pine's blue-green)
    cobble: [[0.5, 0.5, 0.49], [0.62, 0.61, 0.59]], sand: [[0.63, 0.6, 0.5], [0.7, 0.66, 0.56]],
  };
  const rock = (c) => c === 4 || c === 7;
  const ISF = { step: 4.0, n: 3, grp: 4, spread: 3.2, from: 2.5, reach: 60, pw: 1.35, drop: 12, rise: 30, maxSl: 1.1,
    keep: (d) => d < 22 ? 0.85 : 0.65,
    skip: (c) => c === 3 || c === 5 || rock(c),
    pick: (R, d, s, c) => { const r = R(), w = d < 25 ? 1.25 : 1.7;
      if (s > 0.9) return null;
      if (c === 1) return r < 0.4 ? { c: 'bori', k: 't', w: 0.55 * w, h: 1.15, col: T3(R, IS.pine[0], IS.pine[1]), n: 6 }
        : r < 0.75 ? { c: 'praprot', k: 'g', w: 0.55 * w, h: 0.34, col: T3(R, IS.fern[0], IS.fern[1]) } : null;
      if (r < 0.55) return { c: 'trava', k: 't', w: 0.46 * w, h: 0.4, col: T3(R, IS.grass[0], IS.grass[1]) };
      if (r < 0.78) return { c: 'bilke', k: 't', w: 0.32 * w, h: 0.62, col: T3(R, IS.seed[0], IS.seed[1]), n: 4 };
      if (r < 0.9) return { c: 'sopi', k: 't', w: 0.62 * w, h: 0.78, col: T3(R, IS.tall[0], IS.tall[1]), n: 6 };
      return null; } };

  const riverTest = (def) => {   // (the river beds of the track's def in 16 m cells, as js/world-chase-bt76.js keeps them free)
    const cells = new Map(), G = 16;
    for (const a of (def && def.riverBeds) || []) { const hw = a[0] / 2;
      for (let k = 1; k + 1 < a.length; k += 2) { const x = a[k], z = a[k + 1], i = Math.floor(x / G), j = Math.floor(z / G);
        for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) { const key = (i + u) + ',' + (j + v); let L = cells.get(key); if (!L) cells.set(key, L = []); L.push(x, z, hw); } } }
    if (!cells.size) return null;
    return (x, z, m) => { const L = cells.get(Math.floor(x / G) + ',' + Math.floor(z / G)); if (!L) return false;
      for (let k = 0; k < L.length; k += 3) { const dx = x - L[k], dz = z - L[k + 1], r = L[k + 2] + m; if (dx * dx + dz * dz < r * r) return true; } return false; };
  };

  /* the river's banks: along each bed's line every ~3 m, on both sides from the bed's edge to ~7 m past it, only within C.reach m of
     the road's barrier line, out of the water itself */
  const banks = (soft, E, R, C, st) => {
    const T = API.T, { near, gT, slope, ex, riv, wat } = E;
    for (const a of (T.def && T.def.riverBeds) || []) { const hw = a[0] / 2;
      for (let k = 1; k + 3 < a.length; k += 2) {
        const x0 = a[k], z0 = a[k + 1], dx = a[k + 2] - x0, dz = a[k + 3] - z0, L = Math.hypot(dx, dz); if (!(L > 0.01)) continue;
        for (let t = 0; t < L; t += C.step) for (const sd of [-1, 1]) {
          if (R() > C.share) continue;
          const o = hw + C.from + Math.pow(R(), 1.4) * C.wide, u = t + (R() - 0.5) * C.step;
          const gx = x0 + dx / L * u - dz / L * sd * o, gz = z0 + dz / L * u + dx / L * sd * o;
          for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
            const x = gx + (m ? (R() - 0.5) * 2.2 : 0), z = gz + (m ? (R() - 0.5) * 2.2 : 0);
            if (riv(x, z, C.from * 0.5) || ex(x, z)) continue;
            if (wat) { const w = wat(x, z); if (w && w.e > -0.5) continue; }
            const q = near(x, z); if (q.i < 0) continue;
            const bar = q.lat > 0 ? T.br[q.i] : T.bl[q.i], d = Math.abs(q.lat) - bar; if (d < 2 || d > C.reach) continue;
            const c = E.lc ? E.lc(x, z) : 0; if (c === 3) continue;
            if (slope(x, z) > 1.2) continue;
            const y = gT(x, z), h = R();
            if (R() < 0.6) { cushion(soft.get(x, z), x, y - 0.04, z, 0.45 + h * 0.7, 0.26 + h * 0.26, T3(R, IS.cobble[0], IS.cobble[1], 0.96), R); st.prodniki = (st.prodniki || 0) + 1; }
            else { soil(soft, gT, x, z, 1.0 + R() * 1.4, C3(R, IS.sand[0], IS.sand[1]), R, 0.05); st.prod = (st.prod || 0) + 1; }
          }
        }
      } }
    return st;
  };

  const isuna = (ctx) => {
    const T = API.T; if (!ctx.out || !ctx.root || !ctx.out.matV || !T || !T.br || !T.wAt) return null;
    const near = API.vrNear, gT = API.vrGround; if (!near || !gT) return null;
    const slope = API.vrSlope || ((x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); });
    const ex = ctx.excluded || (() => false), riv = riverTest(T.def), wat = API.vrWater;
    const bad = (x, z) => { if (ex(x, z) || (!!riv && riv(x, z, 6))) return true; if (!wat) return false; const q = wat(x, z); return !!q && q.e > -3; };
    const R = rng(111100), soft = softScen(ctx.root, ctx.out.matV), st = {};
    band(soft, near, gT, slope, API.vrLC, bad, R, ISF, st);
    if (riv) banks(soft, { near, gT, slope, ex, riv, wat, lc: API.vrLC }, rng(111200), { step: 3, share: 0.75, grp: 3, from: 0.6, wide: 6.5, reach: 65 }, st);
    soft.done(); return st;
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'isuna' && ctx && ctx.out) try { ctx.out.robBt111 = isuna(ctx); } catch (e) { console.error('chase-bt111 (isuna):', e); }
      return r;
    };
    Object.assign(f, base);
    World.ext.goreRob = f;
  }
  void clamp;
})();
