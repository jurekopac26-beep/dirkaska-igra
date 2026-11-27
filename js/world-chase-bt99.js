/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the ninety-ninth group of the real tracks: Styria and Sa Calobra,
   a further pass on a circuit and a mountain road whose ground the earlier groups set (Styria: js/world-chase-bt17.js,
   js/world-chase-bt48.js, js/world-chase-bt77.js: the three bands at the edge, the far meadow's tussocks and flower patches from ~34 m,
   the ragged strip and the soft lawn patches; Sa Calobra: js/world-chase-bt8.js, js/world-chase-bt24.js, js/world-chase-bt44.js: the
   verge's patches and tufts, the bank and the far band where the ground rises). From behind the car, on Styria the woods met the mown lawn
   with bare even ground and a few brown patches under the trees; on Sa Calobra the slopes read as one even beige with flat patches,
   little standing on them, and nothing at all where the ground falls away from the road.
   So here:
   Styria (docs/proge/rbring.md: »Gozdovi (smreke in bukve), travniki … in polja«), chained on the look's extra (js/world-rbring.js
   rbLook.rbring), only at and under the woods (land cover 1) from ~2 m past the fence to ~60 m: the needle and beech-leaf litter in
   muted brown patches, low dark-green undergrowth, tufts of the paler shade grass; denser near, thinner far. Nothing on the mown lawns,
   the meadows and the fields, on built ground, on the pits' side along the pits.
   Sa Calobra (docs/proge/sacalobra.md: »Sive apnenčaste stene in skale (ponekod okraste), med njimi suha sredozemska makija (temni
   grmi), šopi trave càrritx na suhi travi, … rdeča zemlja (terra rossa) na brežinah ob cesti«), chained on the look's extra
   (js/world-prelaz.js PL_LOOK.sacalobra), on both sides, also where the ground falls away, from ~1.5 m past the wall line to ~48 m:
   standing green-straw tussocks of càrritx in loose groups, the maquis's dark cushions, pale limestone stones, a little terra rossa on the steeper
   banks near the road. The colours are those of js/world-chase-bt44.js, muted (the càrritx greener, as the living tussock).
   Nothing in the builders' excluded places (the cliffs, the terraces, the walls, the viewpoints), where another leg's road is nearer, on
   a face too steep. All of it in the builders' own scenery chunks (no mesh of its own, so no draw call more), sparse within the phone's
   vertex bound; the terrain, the road, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt85.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.015), k);
  const T3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.03), k || 0.97);

  /* the band (as js/world-chase-bt85.js, into the builder's own chunks): every C.step m on both sides C.n tries from C.from m past the
     barrier line to C.reach m (denser near); each place a small group (C.grp things within C.spread m). near(x, z) -> { i, lat } */
  const band = (scen, near, gT, slope, lc, bad, R, C, st) => {
    const T = API.T, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (!q || q.i < 0 || gap(q.i, i, N) * T.ds > oo + 12) continue;
          const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (on or by a road: this leg's or another's)
          if (bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
          const c = lc ? lc(x, z) : 0; if (C.skip && C.skip(c, x, z)) continue;
          const P = C.pick(R, oo - bar, s, c), h = R(); if (!P) continue;
          if (P.k === 'p') soil(scen, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g' || P.k === 's') cushion(scen.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(scen.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };
  const slopeOf = (gT) => (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };

  /* ---- Styria: under the woods at the lawn's edge ---- */
  const ST = {
    litter: [[0.36, 0.29, 0.2], [0.43, 0.34, 0.22]], under: [[0.2, 0.3, 0.16], [0.25, 0.35, 0.19]], shade: [[0.31, 0.41, 0.2], [0.38, 0.47, 0.25]],
  };
  const STF = { seed: 9917, step: 3.5, n: 4, grp: 3, spread: 3.2, from: 2, reach: 60, pw: 1.3, drop: 12, rise: 25, maxSl: 0.9,
    keep: (d) => d < 34 ? 0.9 : 0.5,
    skip: (c) => c !== 1,
    pick: (R, d) => { const r = R(), w = d < 30 ? 1 : 1.3;
      if (r < 0.3) return { c: 'stelja', k: 'p', r: 1.1 + R() * 1.6, col: C3(R, ST.litter[0], ST.litter[1]) };   // (spruce needles and beech leaves)
      if (r < 0.68) return { c: 'podrast', k: 'g', w: 1.0 * w, h: 0.45, col: T3(R, ST.under[0], ST.under[1]) };   // (low undergrowth)
      return { c: 'sopi', k: 't', w: 0.5 * w, h: 0.5, col: T3(R, ST.shade[0], ST.shade[1]) }; } };

  const styria = (ctx) => {
    const T = API.T, { nrGround, nrNear, nrLC } = API, scen = ctx.scen, excluded = ctx.excluded || (() => false);
    if (!scen || !T || !T.br || !T.wAt || !nrGround || !nrNear || !nrLC) return null;
    const pd = T.def && T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const bad = (x, z) => { if (excluded(x, z)) return true; if (!ps || !T.pitAt) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
    return band(scen, nrNear, nrGround, slopeOf(nrGround), nrLC, bad, rng(STF.seed), STF, { stelja: 0, podrast: 0, sopi: 0 });
  };

  /* ---- Sa Calobra: the dry limestone slopes (colours of js/world-chase-bt44.js) ---- */
  const SC = {
    carritx: [[0.57, 0.57, 0.34], [0.68, 0.63, 0.4]], straw: [[0.58, 0.55, 0.4], [0.63, 0.59, 0.43]], maq: [[0.22, 0.27, 0.16], [0.27, 0.31, 0.2]],
    stone: [[0.55, 0.54, 0.5], [0.66, 0.65, 0.6]], rossa: [[0.48, 0.37, 0.29], [0.52, 0.4, 0.3]],
  };
  const SCF = { seed: 9931, step: 5.5, n: 2, grp: 3, spread: 3.8, from: 1.5, reach: 48, pw: 1.35, drop: 28, rise: 30, maxSl: 1.15,
    keep: (d) => d < 30 ? 0.85 : 0.6,
    pick: (R, d, s) => { const r = R(), w = d < 25 ? 1 : 1.35;
      if (s > 0.75) return r < 0.6 ? { c: 'kamni', k: 's', w: 0.8 * w, h: 0.4, col: T3(R, SC.stone[0], SC.stone[1], 0.95) } : { c: 'carritx', k: 't', w: 0.7 * w, h: 0.8, col: T3(R, SC.carritx[0], SC.carritx[1]) };
      if (r < 0.46) return { c: 'carritx', k: 't', w: 0.9 * w, h: 1.0, col: T3(R, SC.carritx[0], SC.carritx[1]) };   // (càrritx: a broad standing tussock)
      if (r < 0.6) return { c: 'sopi', k: 't', w: 0.5 * w, h: 0.55, col: T3(R, SC.straw[0], SC.straw[1]) };
      if (r < 0.8) return { c: 'makija', k: 'g', w: 1.5 * w, h: 0.85, col: T3(R, SC.maq[0], SC.maq[1]) };
      if (r < 0.95 || d > 9 || s < 0.25) return { c: 'kamni', k: 's', w: 0.7 * w, h: 0.36, col: T3(R, SC.stone[0], SC.stone[1], 0.95) };
      return { c: 'rossa', k: 'p', r: 0.9 + R() * 1.1, col: C3(R, SC.rossa[0], SC.rossa[1], 0.9) }; } };

  const sacalobra = (ctx) => {
    const T = API.T, gT = API.caGround || API.vrGround, near = API.vrNear, scen = ctx.scen, excluded = ctx.excluded || (() => false);
    if (!scen || !T || !T.br || !T.wAt || !gT || !near || !T.def || T.def.id !== 'sacalobra') return null;
    return band(scen, near, gT, slopeOf(gT), null, excluded, rng(SCF.seed), SCF, { carritx: 0, sopi: 0, makija: 0, kamni: 0, rossa: 0 });
  };

  const RBL = (API.rbLook || {}).rbring, PLL = (API.PL_LOOK || {}).sacalobra;
  if (RBL) chain(RBL, (ctx) => { if (API.THEME !== 'rbring') return;   // (the tracks that borrow Styria's look keep theirs)
    try { const s = styria(ctx); if (s && ctx.out) ctx.out.pasBt99 = s; } catch (e) { console.error('chase-bt99 (rbring):', e); } });
  if (PLL) chain(PLL, (ctx) => { try { const s = sacalobra(ctx); if (s && ctx.out) ctx.out.pasBt99 = s; } catch (e) { console.error('chase-bt99 (sacalobra):', e); } });
})();
