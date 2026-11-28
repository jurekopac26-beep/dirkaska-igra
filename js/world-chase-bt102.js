/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-second group of the real tracks: Vaoala and
   Zandvoort. Vaoala (js/world-prelaz.js, PL_LOOK.vaoala) had no group of its own yet: from behind the car, past the road's red-brown
   dust, the grass lay in one even green with the builder's few bushes and stones, and the forest's floor in one dark sheet. Zandvoort
   (shared builder js/world-rbring.js) is a further pass: js/world-chase-bt34.js stops ~4.5 m past the rail, js/world-chase-bt6.js
   stands marram and scrub only on the dunes (land cover 2), js/world-chase-bt63.js begins 30 m out; between them the rough grass
   (land cover 0) was one smooth green and the dunes between the drifts one sand colour.
   So here:
   Vaoala (docs/proge/vaoala.md: »gost tropski gozd na slemenu, palme in grmovje ob vaseh, trava ob cesti«; the look: the wet ridge,
   darker and lusher than the coast, dark basalt under a red-brown soil), from ~3 m past the barrier line to ~60 m, thinning with
   distance: on the grass flat patches of a lusher wet green and of a paler grass, lush tufts in loose groups, low dark bushes; at and
   under the forest (land cover 1) the dark leaf litter and low ferns; on the steep cuts the red-brown soil and dark basalt stones.
   Zandvoort (docs/proge/zandvoort.md: »sipine s šopi trave, grmi rakitovca in razpihani peščeni žepi«, »pokošene trate samo tik ob
   progi«), 4.5-30 m past the barrier line: on the rough grass darker and drier flat patches and loose groups of uncut tussocks; on the
   dunes the grey dune's moss and lichen ground and, on the gentler ground, pockets of blown sand (flat patches only: bt6's marram
   already stands there). Never in the ponds, the woods, the built ground, the excluded places or on the pits' side along the pits.
   Nothing where another leg's road is nearer, in the builders' excluded places, on a face too steep or far below the road. The horizon
   stays the builders' own DEM terrain. Vaoala in meshes of its own (softScen: 256 m chunks, no shadow), Zandvoort in the builder's own
   scenery chunks (no new draw calls); the terrain, the road, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N, loop) => { const d = Math.abs(a - b); return loop ? Math.min(d, N - d) : d; };
  // (as js/world-chase-bt85.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.015), k);
  const T3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.03), k || 0.97);

  /* the band (as js/world-chase-bt85.js): every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m
     (denser near); each place a small group (C.grp things within C.spread m). near(x, z) -> { i, lat }; get(x, z): the chunk */
  const band = (S, near, gT, slope, lc, bad, R, C, st, loop) => {
    const T = API.T, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      if (C.side && !C.side(i, sd)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (q.i < 0 || gap(q.i, i, N, loop) * T.ds > oo + 12) continue;
          const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (on or by a road: this leg's or another's)
          if (bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
          const c = lc ? lc(x, z) : 0; if (C.skip && C.skip(c)) continue;
          const P = C.pick(R, oo - bar, s, c, x, z), h = R(); if (!P) continue;
          if (P.k === 'p') soil(S, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g' || P.k === 's') cushion(S.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(S.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };

  /* ---- Vaoala: the wet ridge's grass, the forest's floor, the red-brown soil and the basalt (the colours of PL_LOOK.vaoala: grass,
     grassLush, grassDry, shrub, rock, rockWarm; land cover of the passes' builder: 1 forest, 0 and 2 grass and scrub, 3 bare, 5 built) ---- */
  const VA = {
    lush: [[0.27, 0.46, 0.17], [0.31, 0.5, 0.2]], pale: [[0.37, 0.48, 0.21], [0.42, 0.5, 0.24]], tuft: [[0.2, 0.44, 0.13], [0.3, 0.5, 0.18]],
    bush: [[0.12, 0.28, 0.1], [0.16, 0.32, 0.12]], litter: [[0.27, 0.24, 0.15], [0.32, 0.27, 0.17]], fern: [[0.17, 0.39, 0.12], [0.22, 0.44, 0.15]],
    soilR: [[0.46, 0.33, 0.25], [0.5, 0.37, 0.28]], basalt: [[0.3, 0.3, 0.29], [0.36, 0.35, 0.33]],
  };
  const VAF = { step: 4.0, n: 2, grp: 3, spread: 4, from: 3, reach: 60, pw: 1.4, drop: 12, rise: 35, maxSl: 1.4,
    keep: (d) => d < 22 ? 0.7 : 0.6,
    skip: (c) => c === 5,
    pick: (R, d, s, c) => { const r = R(), w = d < 25 ? 1.2 : 1.7;
      if (c === 3 || s > 1.0) return r < 0.5 ? { c: 'prst', k: 'p', r: (0.6 + R() * 0.8) * w, col: C3(R, VA.soilR[0], VA.soilR[1]) }
        : r < 0.8 ? { c: 'bazalt', k: 's', w: 0.42 * w, h: 0.28, col: T3(R, VA.basalt[0], VA.basalt[1], 0.95) } : null;
      if (c === 1) return r < 0.5 ? { c: 'listje', k: 'p', r: (1.1 + R() * 1.4) * w, col: C3(R, VA.litter[0], VA.litter[1]) }
        : r < 0.88 ? { c: 'praprot', k: 'g', w: 0.6 * w, h: 0.36, col: T3(R, VA.fern[0], VA.fern[1]) } : { c: 'bazalt', k: 's', w: 0.4, h: 0.24, col: T3(R, VA.basalt[0], VA.basalt[1], 0.9) };
      if (r < 0.27) return { c: 'zaplate', k: 'p', r: (0.9 + R() * 1.1) * w, col: C3(R, VA.lush[0], VA.lush[1]) };
      if (r < 0.45) return { c: 'zaplate', k: 'p', r: (1.2 + R() * 1.5) * w, col: C3(R, VA.pale[0], VA.pale[1]) };
      if (r < 0.8) return { c: 'sopi', k: 't', w: 0.4 * w, h: 0.55, col: T3(R, VA.tuft[0], VA.tuft[1]), n: 6 };
      if (r < 0.93) return { c: 'grmi', k: 'g', w: 0.75 * w, h: 0.55, col: T3(R, VA.bush[0], VA.bush[1]) };
      return { c: 'prst', k: 'p', r: (0.4 + R() * 0.5) * w, col: C3(R, VA.soilR[0], VA.soilR[1]) }; } };   // (the soil showing through the grass)

  const vaoala = (ctx) => {
    const T = API.T, matV = ctx.matV || (ctx.out && ctx.out.matV);
    if (!T || !T.br || !T.wAt || !ctx.out || !ctx.root || !matV || (T.def && T.def.id !== 'vaoala')) return null;
    const gT = API.caGround || API.vrGround, near0 = API.vrNear, lc = API.vrLC; if (!gT || !near0) return null;
    const ex = ctx.excluded || (() => false), wet = API.vrWater ? (x, z) => { const q = API.vrWater(x, z); return !!q && q.e > -4; } : () => false;
    const slope = API.vrSlope || ((x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); });
    const q2 = { i: -1, lat: 0 }, near = (x, z) => { const q = near0(x, z); q2.i = q.i;
      q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; };
    const R = rng(102100), soft = softScen(ctx.root, matV), st = {};
    band(soft, near, gT, slope, lc, (x, z) => ex(x, z) || wet(x, z), R, VAF, st, false);
    soft.done(); return st;
  };
  const LK = API.PL_LOOK;
  if (LK && LK.vaoala) chain(LK.vaoala, (ctx) => { try { if (ctx.out) ctx.out.robBt102 = vaoala(ctx); } catch (e) { console.error('chase-bt102 (vaoala):', e); } });

  /* ---- Zandvoort: between the rail's strip and the far dunes (the colours of js/world-chase-bt34.js ZV and js/world-chase-bt63.js ZF;
     land cover of the shared builder: 0 rough grass, 1 woods, 2 dunes, 3 built) ---- */
  const ZD = {
    dark: [[0.27, 0.41, 0.15], [0.31, 0.44, 0.17]], dry: [[0.47, 0.5, 0.25], [0.52, 0.52, 0.28]], uncut: [[0.4, 0.51, 0.25], [0.55, 0.56, 0.32]],
    grey: [[0.6, 0.6, 0.47], [0.52, 0.55, 0.4]], sand: [[0.84, 0.78, 0.6], [0.8, 0.74, 0.57]],
  };
  // the ponds of def.sk.pond (as js/world-chase-bt63.js: 5 m cells, the run-length mask js/world-zandvoort.js reads): any wet cell within a cell's reach
  const pondMask = (def) => {
    const P = def.sk && def.sk.pond, A = API.NR_A64; if (!P || !A) return () => false;
    const { x0, z0, nx, nz, cell: C } = P, n = nx * nz, M = new Uint8Array(n);
    for (let p = 0, k = 0; k < n && p < P.rle.length;) { const v = A.indexOf(P.rle[p++]); let r = (v & 31) + 1; if ((v & 31) === 31) { let e; do { e = A.indexOf(P.rle[p++]); r += e; } while (e === 63); } M.fill(v >> 5, k, Math.min(n, k + r)); k += r; }
    return (x, z) => { const i = Math.floor((x - x0) / C), j = Math.floor((z - z0) / C);
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const I = i + a, J = j + b; if (I >= 0 && J >= 0 && I < nx && J < nz && M[J * nx + I]) return true; }
      return false; };
  };
  const ZDF = { step: 5.0, n: 2, grp: 2, spread: 4.5, from: 4.5, reach: 30, pw: 1.1, drop: 8, rise: 14, maxSl: 1.0,
    keep: () => 0.7,
    skip: (c) => c === 1 || c === 3,
    pick: (R, d, s, c) => { const r = R();
      if (c === 2) return r < 0.45 ? { c: 'siva', k: 'p', r: 1.4 + R() * 1.6, col: C3(R, ZD.grey[0], ZD.grey[1]) }   // (the grey dune's moss and lichen)
        : r < 0.62 && s < 0.4 ? { c: 'pesek', k: 'p', r: 1.1 + R() * 1.4, col: C3(R, ZD.sand[0], ZD.sand[1], 1.0) } : null;
      if (c !== 0) return null;
      if (r < 0.32) return { c: 'zaplate', k: 'p', r: 1.3 + R() * 1.6, col: C3(R, ZD.dark[0], ZD.dark[1]) };
      if (r < 0.54) return { c: 'zaplate', k: 'p', r: 1.2 + R() * 1.4, col: C3(R, ZD.dry[0], ZD.dry[1]) };
      if (r < 0.9) return { c: 'trava', k: 't', w: 0.42, h: 0.42, col: T3(R, ZD.uncut[0], ZD.uncut[1]) };
      return null; } };

  const zandvoort = (ctx) => {
    const T = API.T, { nrGround, nrLC, nrSlope, nrNear } = API, scen = ctx.scen;
    if (!T || !T.br || !nrGround || !nrLC || !nrNear || !scen || (T.def && T.def.id !== 'zandvoort')) return null;
    const ex = ctx.excluded || (() => false), pond = pondMask(T.def), ds = T.ds, pd = T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25));
    const bad = (x, z) => { if (ex(x, z) || pond(x, z)) return true; const q = nrNear(x, z); return q.i < 0 || !(q.dd > 4) || (PSD && Math.sign(q.lat) === PSD && pitI(q.i)); };
    const slope = nrSlope || (() => 0);
    const C = Object.assign({ side: (i, sd) => !(PSD && sd === PSD && pitI(i)) }, ZDF), st = {};
    band(scen, nrNear, nrGround, slope, nrLC, bad, rng(102200), C, st, true);
    return st;
  };
  const LZ = (API.rbLook || {}).zandvoort;
  if (LZ) chain(LZ, (ctx, r) => { try { const st = zandvoort(ctx); if (ctx.out) ctx.out.robBt102 = st; else if (r) r.robBt102 = st; } catch (e) { console.error('chase-bt102 (zandvoort):', e); } });
})();
