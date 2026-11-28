/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighty-eighth group of the real tracks: Aguascalientes and
   Bâlea, a further pass on a circuit and a mountain road whose ground the earlier groups set (Aguascalientes: js/world-chase-bt23.js,
   js/world-chase-bt33.js, js/world-chase-bt67.js: tufts by the track, the verge's bands, flat olive and earth patches to ~58 m; Bâlea:
   js/world-chase-bt8.js, js/world-chase-bt26.js: tussocks, mats and schist ribs within ~24 m of the barriers, the verge and the bank).
   From behind the car, on Aguascalientes the plateau past the verge was flat patches with small tufts, wide plain gold between and
   nothing standing in loose clumps; on Bâlea past ~24 m from the barriers the pasture was one smooth green up the valley's sides.
   So here:
   Aguascalientes (docs/proge/aguascalientes.md: »suha trava planote (zlata z olivnimi krpami, ob jarkih bolj zelena)«, »huizache«,
   »mezquite«, »nopal«), chained on the look's extra (js/world-rbring.js rbLook.aguascalientes), from ~7 m past the road's edge out to
   ~60 m past the barrier line: standing tufts of the golden and the paler grass in loose groups, shorter olive ones, low grey-green
   cushions of the thorn scrub (more of them on the scrub, land cover 2), a few paler and browner spots and pale stones.
   Bâlea (docs/proge/balea.md: »alpski pašniki s šopi trave in nizkim cvetjem, v zaplatah ruševje in brin. Sivo-rjav kristalinski
   skrilavec v pečinah, ploščah in balvanih, melišča pod stenami«), chained on the look's extra (js/world-prelaz.js PL_LOOK.balea), from
   ~3 m past the barrier line (thinner to ~24 m, where the earlier group is dense) to ~60 m: flat patches of a darker damp and a paler straw green so the
   pasture is not one colour, broad tussocks in loose groups, low pale cushions of the flowers, dark mats of the dwarf pine and the
   juniper on the shrub (land cover 2) and a few on the grass, grey-brown schist stones and grit on bare, snowy-edge and steep ground.
   Nothing on built ground (Aguascalientes: 3), on the pits' side along the pits, in the forest, the town or the water (Bâlea: 1, 3, 5,
   the lakes), on the snow (6), in the builders' excluded places, where another leg's road is nearer, on a face too steep or far below the
   road. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers, the trees and the
   driving stay as they are.
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

  /* ---- Aguascalientes: the dry plateau (colours of js/world-chase-bt67.js AG: olive, earth, scrub; the gold of the builder's grass) ---- */
  const AG = {
    gold: [[0.68, 0.6, 0.34], [0.75, 0.66, 0.38]], pale: [[0.76, 0.71, 0.47], [0.82, 0.76, 0.52]], olive: [[0.44, 0.46, 0.25], [0.5, 0.5, 0.27]],
    scrub: [[0.4, 0.45, 0.3], [0.46, 0.5, 0.34]], dark: [[0.3, 0.35, 0.2], [0.35, 0.39, 0.23]], earth: [[0.56, 0.44, 0.32], [0.62, 0.5, 0.36]],
    stone: [[0.66, 0.62, 0.55], [0.72, 0.68, 0.6]],
  };
  const AGF = { step: 4.0, n: 4, grp: 4, spread: 3.2, from: 3, reach: 60, pw: 1.7, drop: 8, rise: 20, maxSl: 0.9,
    keep: (d, dE) => dE < 7 ? 0 : dE < 11 ? 0.5 : d < 35 ? 0.9 : 0.6,   // (the mown verge by the track stays the earlier groups')
    skip: (c) => c === 3,
    pick: (R, d, s, c) => { const r = R(), w = d < 30 ? 1.4 : 1.85;
      if (c === 2) return r < 0.45 ? { c: 'grmi', k: 'g', w: 0.8 * w, h: 0.55, col: T3(R, AG.dark[0], AG.dark[1]) }
        : r < 0.65 ? { c: 'grmi', k: 'g', w: 0.55 * w, h: 0.4, col: T3(R, AG.scrub[0], AG.scrub[1]) }
        : r < 0.9 ? { c: 'sopi', k: 't', w: 0.3 * w, h: 0.5, col: T3(R, AG.gold[0], AG.gold[1]) } : { c: 'kamni', k: 's', w: 0.36, h: 0.2, col: T3(R, AG.stone[0], AG.stone[1], 0.95) };
      if (r < 0.48) return { c: 'sopi', k: 't', w: 0.3 * w, h: d < 30 ? 0.55 : 0.7, col: T3(R, ...(R() < 0.6 ? AG.gold : AG.pale)) };
      if (r < 0.66) return { c: 'sopi', k: 't', w: 0.27 * w, h: 0.36, col: T3(R, AG.olive[0], AG.olive[1]) };
      if (r < 0.8) return { c: 'grmi', k: 'g', w: 0.5 * w, h: 0.34, col: T3(R, AG.scrub[0], AG.scrub[1]) };   // (low thorn scrub, grey-green)
      if (r < 0.85) return { c: 'grmi', k: 'g', w: 0.75 * w, h: 0.5, col: T3(R, AG.dark[0], AG.dark[1]) };
      if (r < 0.94) return { c: 'lise', k: 'p', r: 1.5 + R() * 2.0, col: C3(R, ...(R() < 0.5 ? AG.olive : AG.earth)) };
      return { c: 'kamni', k: 's', w: 0.34 * w, h: 0.18, col: T3(R, AG.stone[0], AG.stone[1], 0.95) }; } };

  const agua = (ctx) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear, nrLC } = API;
    if (!root || !matV || !T || !T.br || !T.wAt || !nrGround || !nrNear) return null;
    const ds = T.ds, pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const bad = (x, z) => { if (excluded(x, z)) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const slope = (x, z) => { const d = 1.0, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const R = rng(88100), soft = softScen(root, matV), st = {};
    band(soft, (x, z) => nrNear(x, z), nrGround, slope, nrLC, bad, R, AGF, st);
    soft.done(); return st;
  };
  const L = API.rbLook || {};
  if (L.aguascalientes) chain(L.aguascalientes, (ctx) => { try { if (ctx.out) ctx.out.pasBt88 = agua(ctx); } catch (e) { console.error('chase-bt88 (aguascalientes):', e); } });

  /* ---- Bâlea: the pasture of the glacial valley past the earlier group's ~24 m (land cover of js/world-prelaz.js vrLC: 0 grass,
     1 forest, 2 shrub, 3 town, 4 bare rock, 5 water, 6 snow, 7 bare; colours beside js/world-chase-bt26.js) ---- */
  const BL = {
    damp: [[0.3, 0.43, 0.19], [0.34, 0.46, 0.21]], straw: [[0.5, 0.53, 0.3], [0.56, 0.56, 0.33]], mid: [[0.36, 0.47, 0.22], [0.42, 0.51, 0.25]],
    gold: [[0.58, 0.57, 0.33], [0.64, 0.62, 0.36]], flower: [[0.62, 0.62, 0.42], [0.7, 0.66, 0.5]], pine: [[0.14, 0.24, 0.12], [0.18, 0.28, 0.14]],
    schist: [[0.47, 0.44, 0.4], [0.56, 0.53, 0.48]], grit: [[0.5, 0.47, 0.42], [0.57, 0.54, 0.49]],
  };
  const BLF = { step: 4.0, n: 3, grp: 4, spread: 3.6, from: 3, reach: 60, pw: 1.6, drop: 16, rise: 34, maxSl: 1.5,
    keep: (d) => d < 6 ? 0.3 : d < 24 ? 0.55 : d < 40 ? 0.85 : 0.65,   // (to ~24 m the earlier group's tussocks and ribs)
    skip: (c) => c === 1 || c === 3 || c === 5 || c === 6,
    pick: (R, d, s, c) => { const r = R(), w = d < 30 ? 1.4 : 1.9;
      if (c === 4 || c === 7 || s > 1.0) return r < 0.5 ? { c: 'skrilavec', k: 's', w: 0.5 * w, h: 0.32, col: T3(R, BL.schist[0], BL.schist[1], 0.95) }
        : r < 0.8 ? { c: 'grus', k: 'p', r: (0.9 + R() * 1.2) * w, col: C3(R, BL.grit[0], BL.grit[1]) }
        : r < 0.92 ? { c: 'sopi', k: 't', w: 0.34 * w, h: 0.4, col: T3(R, BL.gold[0], BL.gold[1]) } : null;
      if (c === 2) return r < 0.6 ? { c: 'rusevje', k: 'g', w: 1.0 * w, h: 0.6, col: T3(R, BL.pine[0], BL.pine[1]) }
        : r < 0.85 ? { c: 'sopi', k: 't', w: 0.4 * w, h: 0.5, col: T3(R, BL.mid[0], BL.mid[1]), n: 6 } : { c: 'skrilavec', k: 's', w: 0.45, h: 0.28, col: T3(R, BL.schist[0], BL.schist[1], 0.95) };
      if (r < 0.14) return { c: 'zaplate', k: 'p', r: (1.4 + R() * 1.8) * w, col: C3(R, BL.damp[0], BL.damp[1]) };
      if (r < 0.27) return { c: 'zaplate', k: 'p', r: (1.2 + R() * 1.6) * w, col: C3(R, BL.straw[0], BL.straw[1]) };
      if (r < 0.66) return { c: 'sopi', k: 't', w: 0.42 * w, h: 0.5, col: T3(R, BL.mid[0], BL.mid[1]), n: 6 };
      if (r < 0.78) return { c: 'sopi', k: 't', w: 0.36 * w, h: 0.42, col: T3(R, BL.gold[0], BL.gold[1]) };
      if (r < 0.85) return { c: 'cvetje', k: 'g', w: 0.4 * w, h: 0.16, col: T3(R, BL.flower[0], BL.flower[1]) };   // (low flowers: pale cushions, no bright dots)
      if (r < 0.93) return { c: 'rusevje', k: 'g', w: 0.85 * w, h: 0.5, col: T3(R, BL.pine[0], BL.pine[1]) };
      return { c: 'skrilavec', k: 's', w: 0.42 * w, h: 0.26, col: T3(R, BL.schist[0], BL.schist[1], 0.95) }; } };

  const balea = (ctx) => {
    const T = API.T, root = ctx.root, matV = ctx.matV || (ctx.out && ctx.out.matV); if (!T || !T.br || !T.wAt || !root || !matV) return null;
    const gT = API.caGround || API.vrGround, slope = API.vrSlope, near0 = API.vrNear, lc = API.vrLC; if (!gT || !slope || !near0) return null;
    const ex = ctx.excluded || (() => false), lakes = (ctx.P && ctx.P.lakes) || [], vrWater = API.vrWater;
    const bad = (x, z) => { if (ex(x, z)) return true;
      for (const Lk of lakes) if (x > Lk.x0 - 3 && x < Lk.x1 + 3 && z > Lk.z0 - 3 && z < Lk.z1 + 3 && (!vrWater || vrWater(x, z).e > -3)) return true;
      return false; };
    const q2 = { i: -1, lat: 0 }, near = (x, z) => { const q = near0(x, z); q2.i = q.i;
      q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; };
    const R = rng(88200), soft = softScen(root, matV), st = {};
    band(soft, near, gT, slope, lc, bad, R, BLF, st);
    soft.done(); return st;
  };
  const LK = API.PL_LOOK || {};
  if (LK.balea) chain(LK.balea, (ctx) => { try { if (ctx.out) ctx.out.dalBt88 = balea(ctx); } catch (e) { console.error('chase-bt88 (balea):', e); } });
  void clamp;
})();
