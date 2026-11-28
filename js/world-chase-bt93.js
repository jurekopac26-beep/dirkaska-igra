/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the ninety-third group of the real tracks: Kildare and Koror, a
   further pass on a circuit and a road whose ground the earlier groups set (Kildare: js/world-chase-bt56.js, js/world-chase-bt68.js: the
   gravel's sprays, the verge's stripes, rushes in the wet hollows, tussocks and wide flat patches past the fences to ~60 m; Koror:
   js/world-chase-bt8.js, js/world-chase-bt27.js, js/world-chase-bt67.js: the tropical ground, the verge's and the bank's patches to ~9 m,
   wide flat patches to ~55 m). From behind the car, past Kildare's fences the pasture was flat patches with a few small tufts, nothing
   standing in the grass, the fields and the wood's floor one wash; on Koror the wide verge between the asphalt and the barriers and the
   hill's grass were flat patches too, the forest's floor bare between the trunks.
   So here:
   Kildare (docs/proge/kildare.md: »med pašniki in živimi mejami ravnice«, »pašniki v irskih zelenih tonih, vlažne kotanje, polja«,
   »žive meje z jesenom in javorjem, smreke v nasadih«), chained on the look's extra (js/world-rbring.js rbLook.kildare), only behind
   the fences (the run-offs stay mown) out to ~60 m: on the pasture standing tufts of the rank grass in loose groups, greener and paler
   going to seed, broad low clumps of the ungrazed grass; on the fields (land cover 2) short pale stubble; in the wood (1) the brown leaf
   litter and low dark undergrowth.
   Koror (docs/proge/koror.md: »vlažen tropski gozd na griču, palme in grmovje, trava ob cesti«), chained on PL_LOOK.koror: from ~2 m
   past the asphalt's edge (past the gravel shoulder) to ~60 m: on the verge and the hill's grass standing tufts of the roadside grass
   in its lush and its sun-dried green, low dark bush cushions; under the forest (land cover 1) low ferns, the brown frond and leaf
   litter; now and then the islands' pale limestone (the look's own rock) as low stones. Never in the town (3), the water (5), down at
   the sea (ground under 1.5 m: the causeways' slopes) or far under the road.
   Nothing on built ground, in the builders' excluded places (the other layouts' roads, the side roads, the houses), where another leg's
   road is nearer, on a face too steep. The horizon stays the builders' own. All of it in meshes of their own (softScen: 256 m chunks,
   no shadow); the terrain, the road, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt85.js: a third of the way toward the colour's grey and a little darker, so a thing reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.015), k);
  // (standing things: the helpers darken a tuft's foot and the faces away from the sun, so their colour is lifted, or they read as dark specks)
  const T3 = (R, a, k) => { const c = vary(mix3(a[0], a[1], R()), R, 0.03), f = (k || 1) * 1.32; return [Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f)]; };

  // (Koror's pale verge: the lifted colour a little toward its grey, so the tufts do not glow on it)
  const M3 = (R, a, k) => mute(T3(R, a, k), 0.9);

  /* the band (as js/world-chase-bt85.js's): every C.step m on both sides C.n tries from C.from m past the base line (the barrier line,
     or with C.edge the asphalt's edge) to C.reach m (denser near); each place a small group (C.grp things within C.spread m), so it
     reads as clumps on the ground, not as an even sprinkle. near(x, z) -> { i, lat } */
  const band = (soft, near, gT, slope, lc, bad, R, C, st) => {
    const T = API.T, N = T.px.length, open = !!(T.def && T.def.open);
    const base = (i, sd) => C.edge ? T.wAt(i) : (sd > 0 ? T.br[i] : T.bl[i]);
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = base(i, sd);
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (q.i < 0 || (open ? Math.abs(q.i - i) : gap(q.i, i, N)) * T.ds > oo + 12) continue;
          if (Math.abs(q.lat) < base(q.i, q.lat > 0 ? 1 : -1) + C.from * 0.8) continue;   // (on or by a road: this leg's or another's)
          if (bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[q.i] - C.drop) || !(y < T.hy[q.i] + C.rise) || s > C.maxSl) continue;
          const c = lc ? lc(x, z) : 0; if (C.skip && C.skip(c)) continue;
          const P = C.pick(R, Math.abs(q.lat) - base(q.i, q.lat > 0 ? 1 : -1), s, c), h = R(); if (!P) continue;
          if (P.k === 'p') soil(soft, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g' || P.k === 's') cushion(soft.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };
  const slopeOf = (gT) => (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };

  /* ---- Kildare: behind the fences, the plain's pastures, fields and wood (colours of js/world-chase-bt68.js KD: grazed, rank, hay,
     stubble, floor; land cover: 0 pasture, 1 wood, 2 fields, 3 built) ---- */
  const KD = {
    rank: [[0.3, 0.44, 0.19], [0.35, 0.48, 0.22]], grazed: [[0.38, 0.52, 0.24], [0.43, 0.55, 0.27]], seed: [[0.55, 0.57, 0.34], [0.62, 0.61, 0.39]],
    clump: [[0.25, 0.39, 0.17], [0.29, 0.43, 0.19]], stub: [[0.66, 0.6, 0.4], [0.72, 0.66, 0.45]], litter: [[0.38, 0.31, 0.2], [0.43, 0.35, 0.22]],
    under: [[0.2, 0.31, 0.15], [0.24, 0.35, 0.17]],
  };
  const KDF = { step: 4.0, n: 5, grp: 3, spread: 3.5, from: 1.6, reach: 60, pw: 1.3, drop: 4, rise: 8, maxSl: 0.8,
    keep: (d) => d < 30 ? 0.8 : 0.6,
    skip: (c) => c === 3,
    pick: (R, d, s, c) => { const r = R(), w = d < 28 ? 2.1 : 2.7, hh = 1.35;
      if (c === 1) return r < 0.45 ? { c: 'listje', k: 'p', r: (1.0 + R() * 1.2) * w, col: C3(R, KD.litter) }
        : r < 0.85 ? { c: 'podrast', k: 'g', w: 0.6 * w, h: (0.4) * hh, col: T3(R, KD.under) } : null;
      if (c === 2) return r < 0.75 ? { c: 'strnisce', k: 't', w: 0.4 * w, h: (0.2) * hh, col: T3(R, KD.stub, 0.85), n: 6 } : null;
      if (r < 0.4) return { c: 'sopi', k: 't', w: 0.46 * w, h: (d < 28 ? 0.5 : 0.62) * hh, col: T3(R, KD.rank) };
      if (r < 0.6) return { c: 'sopi', k: 't', w: 0.44 * w, h: (0.4) * hh, col: T3(R, KD.grazed) };
      if (r < 0.78) return { c: 'semena', k: 't', w: 0.36 * w, h: (d < 28 ? 0.6 : 0.72) * hh, col: T3(R, KD.seed), n: 4 };   // (the grass gone to seed, paler)
      return { c: 'kupi', k: 'g', w: 0.8 * w, h: (0.3) * hh, col: T3(R, KD.clump) }; } };   // (broad low clumps of the ungrazed grass)

  const kildare = (ctx) => {
    const root = ctx.root, matV = ctx.matV || (ctx.out && ctx.out.matV), excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear, nrLC } = API;
    if (!root || !matV || !T || (T.def && T.def.id !== 'kildare') || !T.br || !T.wAt || !nrGround || !nrNear) return null;
    const R = rng(93100), soft = softScen(root, matV), st = {};
    band(soft, (x, z) => nrNear(x, z), nrGround, slopeOf(nrGround), nrLC, (x, z) => excluded(x, z), R, KDF, st);
    soft.done(); return st;
  };
  const L = API.rbLook || {};
  if (L.kildare) chain(L.kildare, (ctx) => { try { if (ctx && ctx.out) ctx.out.pasBt93 = kildare(ctx); } catch (e) { console.error('chase-bt93 (kildare):', e); } });

  /* ---- Koror: the verge, the hill's grass and the forest's floor (colours of js/world-chase-bt67.js KR: the grass, the humid darker
     grass, the sun-dried grass, the litter; land cover of the pass builder: 1 forest, 3 town, 5 water) ---- */
  const KR = {
    lush: [[0.22, 0.44, 0.15], [0.27, 0.49, 0.17]], dry: [[0.38, 0.5, 0.21], [0.45, 0.53, 0.25]], bush: [[0.13, 0.29, 0.11], [0.17, 0.34, 0.13]],
    fern: [[0.17, 0.37, 0.13], [0.21, 0.42, 0.15]], litter: [[0.4, 0.31, 0.2], [0.46, 0.36, 0.23]], lime: [[0.72, 0.71, 0.66], [0.79, 0.77, 0.71]],
  };
  const KRF = { edge: true, step: 4.0, n: 5, grp: 3, spread: 3, from: 2.0, reach: 60, pw: 1.5, drop: 3, rise: 30, maxSl: 1.3,
    keep: (d) => d < 12 ? 0.85 : 0.6,
    skip: (c) => c === 3 || c === 5,
    pick: (R, d, s, c) => { const r = R(), w = d < 20 ? 1.9 : 2.7, hh = 1.35;
      if (c === 1 && d > 6) return r < 0.45 ? { c: 'praprot', k: 'g', w: 0.6 * w, h: (0.4) * hh, col: M3(R, KR.fern) }
        : r < 0.75 ? { c: 'listje', k: 'p', r: (0.9 + R() * 1.2) * w, col: C3(R, KR.litter) }
        : r < 0.92 ? { c: 'trava', k: 't', w: 0.45 * w, h: (0.45) * hh, col: M3(R, KR.lush, 0.95) } : { c: 'apnenec', k: 's', w: 0.4 * w, h: 0.24, col: T3(R, KR.lime, 0.8) };
      if (r < 0.45) return { c: 'trava', k: 't', w: 0.46 * w, h: (d < 8 ? 0.36 : 0.55) * hh, col: M3(R, KR.lush) };
      if (r < 0.78) return { c: 'trava', k: 't', w: 0.44 * w, h: (d < 8 ? 0.32 : 0.48) * hh, col: M3(R, KR.dry) };
      if (r < 0.93) return d < 5 ? null : { c: 'grmi', k: 'g', w: 0.6 * w, h: (0.42) * hh, col: M3(R, KR.bush) };
      return { c: 'apnenec', k: 's', w: 0.36 * w, h: 0.2, col: T3(R, KR.lime, 0.8) }; } };

  const koror = (ctx) => {
    const T = API.T, near0 = API.vrNear, lc = API.vrLC, gT = API.caGround || API.vrGround, matV = ctx.matV || (ctx.out && ctx.out.matV);
    if (!T || (T.def && T.def.id !== 'koror') || !T.br || !T.wAt || !ctx.root || !matV || !near0 || !gT) return null;
    const ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || !(gT(x, z) > 1.5);
    const q2 = { i: -1, lat: 0 }, near = (x, z) => { const q = near0(x, z); q2.i = q.i;
      q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; };
    const R = rng(93200), soft = softScen(ctx.root, matV), st = {};
    band(soft, near, gT, slopeOf(gT), lc, bad, R, KRF, st);
    soft.done(); return st;
  };
  const LK = API.PL_LOOK || {};
  if (LK.koror) chain(LK.koror, (ctx) => { try { if (ctx && ctx.out) ctx.out.pasBt93 = koror(ctx); } catch (e) { console.error('chase-bt93 (koror):', e); } });
})();
