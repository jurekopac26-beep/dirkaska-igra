/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-third group of the real tracks: Batangas and
   Río Hondo, two flat circuits of the shared builder (js/world-rbring.js). Batangas had no group yet: past the barriers the plateau
   was the terrain's own colour and the trees, nothing on the ground. Río Hondo's ground the earlier groups set as flat patches
   (js/world-chase-bt55.js: the verge, the fence's foot, wide patches 16–60 m; js/world-chase-bt54.js: patches behind the barriers);
   from behind the car the plain past the lawns was still flat, nothing standing in the straw. So here, chained on the looks' extra
   (rbLook.batangas, rbLook.riohondo), the band of js/world-chase-bt85.js:
   Batangas (docs/proge/batangas.md: »zelena tropska planota: trate in polja sladkornega trsa (rumenkasto zelena), lise rdeče prsti,
   grmovje, gaji listavcev in kokosovih palm«): by the barriers the mown lawn's darker and lighter flat patches and a few worn ones;
   from ~12 m tufts of the lush uncut grass in loose groups, darker wet patches, the red-brown earth bare in spots; from ~30 m past
   the road's edge the tall yellow-green clumps of the cane's edge; on the scrub (land cover 2) dark bushes' cushions; at the groves
   (1) fallen leaves and low undergrowth.
   Río Hondo (docs/proge/riohondo.md: »pokošene trate ob ograjah, dlje suha slamnata trava z lisami gole zemlje; gozdiči suhega gozda
   (monte) … s trnatim grmičevjem, polja (strnišča, gola zemlja, zeleni posevki)«): nothing more on the mown lawns; from ~16 m past
   the road's edge standing tufts of the straw and the paler grass, low grey-olive thorny cushions, small spots of bare earth; in the
   monte (1) the thorny shrubs' cushions and dry leaves; in the fields (2) low pale stubble in groups. Nothing at the lake or its shore.
   Nothing on built ground (3) or water (6), on the pits' side along the pits, in the builder's excluded places, by another leg's road,
   on a face too steep. All of it in meshes of their own (softScen: 256 m chunks, no shadow), sparse: both circuits are near the
   phone's budget. The terrain, the road, the run-offs, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt84.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.015), k);
  const T3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.03), k || 0.97);

  /* the band (js/world-chase-bt85.js): every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m (denser
     near); each place a small group (C.grp things within C.spread m), so it reads as clumps on the ground, not as an even sprinkle */
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
          const P = C.pick(R, Math.abs(q.lat) - qb, s, c, dE), h = R(); if (!P) continue;
          if (P.k === 'p') soil(soft, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g') cushion(soft.get(x, z), x, y, z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };

  /* ---- Batangas: the green plateau (the look's colMod: lush grass, the cane's yellow-green, the red-brown earth) ---- */
  const BA = {
    mown: [[0.27, 0.45, 0.17], [0.31, 0.49, 0.2]], light: [[0.38, 0.54, 0.24], [0.42, 0.57, 0.26]], wet: [[0.21, 0.38, 0.14], [0.25, 0.42, 0.16]],
    grass: [[0.3, 0.5, 0.18], [0.38, 0.56, 0.22]], cane: [[0.5, 0.6, 0.26], [0.58, 0.64, 0.3]], red: [[0.5, 0.32, 0.22], [0.56, 0.36, 0.25]],
    worn: [[0.46, 0.42, 0.27], [0.5, 0.45, 0.3]], bush: [[0.2, 0.36, 0.14], [0.25, 0.41, 0.17]], leaf: [[0.36, 0.3, 0.18], [0.41, 0.34, 0.21]],
  };
  const BAF = { step: 5.5, n: 2, grp: 3, spread: 3.5, from: 0.7, reach: 60, pw: 1.3, drop: 8, rise: 20, maxSl: 0.9,
    keep: (d) => d < 12 ? 0.5 : d < 35 ? 0.62 : 0.5,
    skip: (c) => c === 3 || c === 6,
    pick: (R, d, s, c, dE) => { const r = R(), w = d < 25 ? 1.3 : 1.8;
      if (c === 1) return r < 0.45 ? { c: 'listje', k: 'p', r: (1.1 + R() * 1.3) * w, col: C3(R, BA.leaf) }
        : r < 0.8 ? { c: 'podrast', k: 'g', w: 0.6 * w, h: 0.4, col: T3(R, BA.bush) } : { c: 'sopi', k: 't', w: 0.34 * w, h: 0.5, col: T3(R, BA.grass), n: 6 };
      if (c === 2) return r < 0.5 ? { c: 'grmi', k: 'g', w: 0.75 * w, h: 0.6, col: T3(R, BA.bush) }
        : r < 0.85 ? { c: 'sopi', k: 't', w: 0.36 * w, h: 0.6, col: T3(R, BA.grass), n: 6 } : { c: 'prst', k: 'p', r: (0.9 + R() * 1.2) * w, col: C3(R, BA.red) };
      if (d < 12) return dE < 3 ? null   // the mown lawn by the barriers: flat patches only, nothing stands
        : r < 0.42 ? { c: 'trata', k: 'p', r: 1.3 + R() * 1.6, col: C3(R, BA.mown) } : r < 0.8 ? { c: 'trata', k: 'p', r: 1.2 + R() * 1.4, col: C3(R, BA.light) }
        : r < 0.93 ? { c: 'trata', k: 'p', r: 0.8 + R() * 0.9, col: C3(R, BA.worn) } : null;
      if (dE > 30 && r < 0.3) return { c: 'trs', k: 't', w: 0.5 * w, h: 1.15, col: T3(R, BA.cane), n: 6 };   // (the cane's edge: tall clumps)
      if (r < 0.62) return { c: 'sopi', k: 't', w: 0.36 * w, h: d < 30 ? 0.5 : 0.65, col: T3(R, BA.grass), n: 6 };
      if (r < 0.78) return { c: 'zaplate', k: 'p', r: (1.3 + R() * 1.6) * w, col: C3(R, BA.wet) };
      if (r < 0.9) return { c: 'prst', k: 'p', r: (0.9 + R() * 1.3) * w, col: C3(R, BA.red) };
      return { c: 'grmi', k: 'g', w: 0.6 * w, h: 0.45, col: T3(R, BA.bush) }; } };

  /* ---- Río Hondo: past the lawns the straw plain, the monte, the fields (colours of js/world-chase-bt55.js RH) ---- */
  const RH = {
    straw: [[0.68, 0.6, 0.4], [0.72, 0.64, 0.44]], pale: [[0.6, 0.6, 0.38], [0.66, 0.63, 0.42]], dry: [[0.52, 0.5, 0.3], [0.6, 0.55, 0.36]],
    thorn: [[0.47, 0.48, 0.3], [0.53, 0.51, 0.33]], bare: [[0.64, 0.54, 0.4], [0.68, 0.58, 0.43]], leaf: [[0.43, 0.37, 0.27], [0.47, 0.4, 0.29]],
    stub: [[0.74, 0.66, 0.45], [0.77, 0.69, 0.48]],
  };
  const RHF = { step: 5.0, n: 2, grp: 3, spread: 3.5, from: 3, reach: 60, pw: 1.2, drop: 6, rise: 15, maxSl: 0.8,
    keep: (d, dE) => dE < 16 ? 0 : dE < 22 ? 0.4 : d < 35 ? 0.72 : 0.55,   // (nothing on the mown lawns by the fences)
    skip: (c) => c === 3 || c === 6,
    pick: (R, d, s, c) => { const r = R(), w = d < 30 ? 1.4 : 1.9;
      if (c === 1) return r < 0.5 ? { c: 'trnje', k: 't', w: 0.7 * w, h: 0.5, col: T3(R, RH.thorn), n: 6 }
        : r < 0.75 ? { c: 'listje', k: 'p', r: (1.0 + R() * 1.2) * w, col: C3(R, RH.leaf) } : { c: 'sopi', k: 't', w: 0.3 * w, h: 0.5, col: T3(R, RH.dry) };
      if (c === 2) return r < 0.8 ? { c: 'strn', k: 't', w: 0.24 * w, h: 0.22, col: T3(R, RH.stub) } : { c: 'sopi', k: 't', w: 0.28 * w, h: 0.42, col: T3(R, RH.dry) };
      if (r < 0.5) return { c: 'sopi', k: 't', w: 0.3 * w, h: d < 30 ? 0.55 : 0.7, col: T3(R, R() < 0.65 ? RH.straw : RH.pale) };
      if (r < 0.68) return { c: 'sopi', k: 't', w: 0.26 * w, h: 0.36, col: T3(R, RH.dry) };
      if (r < 0.88) return { c: 'trnje', k: 't', w: 0.55 * w, h: 0.34, col: T3(R, RH.thorn), n: 6 };   // (low thorny cushions, grey-olive)
      return { c: 'prst', k: 'p', r: 0.9 + R() * 1.2, col: C3(R, RH.bare) }; } };

  const build = (ctx, C, seed, wet) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear, nrLC } = API;
    if (!root || !matV || !T || !T.br || !T.wAt || !nrGround || !nrNear) return null;
    const ds = T.ds, pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0, water = wet ? wet(T) : null;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const bad = (x, z) => { if (excluded(x, z) || (water && water(x, z))) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const slope = (x, z) => { const d = 1.0, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const R = rng(seed), soft = softScen(root, matV), st = {};
    band(soft, (x, z) => nrNear(x, z), nrGround, slope, nrLC, bad, R, C, st);
    soft.done(); return st;
  };
  const L = API.rbLook || {};
  const add = (id, C, seed, wet) => { if (L[id]) chain(L[id], (ctx) => { try { if (API.T && API.T.def && API.T.def.id === id && ctx.out) ctx.out.pasBt103 = build(ctx, C, seed, wet); } catch (e) { console.error('chase-bt103 (' + id + '):', e); } }); };
  add('batangas', BAF, 103100);
  // (the lake and its shore: the terrain at or under a metre over the lake's level, as js/world-chase-bt55.js)
  add('riohondo', RHF, 103200, (T) => { const LY = ((T.def.sk || {}).lake || {}).y; return LY == null || !API.nrDem ? null : (x, z) => API.nrDem(x, z) < LY + 1.0; });
})();
