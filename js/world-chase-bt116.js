/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), group one hundred and sixteen of the real tracks: Ella, a third
   pass on a mountain road whose ground the earlier groups set (js/world-chase-bt12.js, js/world-chase-bt29.js, js/world-chase-bt57.js,
   js/world-chase-bt85.js, js/world-dolina-bt.js: the verge, the bank, tussocks, flat patches of wet and dry grass, leaf litter and ferns
   under the forest, gneiss and laterite to ~60 m). From behind the car the slopes past the barrier were still short grass only: no low
   scrub anywhere on the scrub cover, the forest ended in a sharp line with clean grass right up to the trunks, the foot of the parapet
   was mown like a lawn, and the steep cuts were one dry colour. So here (docs/proge/ella.md: »Travnata pobočja s posameznimi drevesi,
   temna tla gorskega gozda v grapah … Ob bregovih je grmičevje … ob robu odtočni jarek in pas rdeče zemlje«; the doc's approximations:
   »grmičevje … in kamni so razporejeni po rabi tal, bližini potokov in naklonu, ne po resničnih legah«), chained after World.ext.goreRob:
   - the foot of the barrier line, ~0.4-3 m past it: the uncut strip, taller and darker tussocks with a few seed-pale ones;
   - ~4-60 m: on the scrub cover (land cover 2) low broad dark bushes in loose groups with paler young ones, a few on the grass (0);
   - the forest's edge (grass within ~10 m of land cover 1): the leaf litter and the ferns carried out onto the grass, so the forest
     does not end in a line; under the forest itself low dark broad-leaved undergrowth between the earlier litter and ferns;
   - steep faces and bare ground (3): dark wet seep patches and moss cushions between the earlier groups' gneiss and laterite.
   Nothing in the tea rows, the fields or the town (6, 7, 5), in a stream's bed (the builder's bad), in the builder's excluded places
   (side roads included), where another leg's road is nearer, on a face too steep or far below the road. The second track of this group,
   Tuzla, is left out: another open change is setting its ground. All of it in meshes of its own (softScen: 256 m chunks, no shadow);
   the terrain, the road, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt85.js: a third of the way toward the colour's grey and a little darker, so it reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.015), k);
  const T3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.03), k || 0.97);

  /* the band of js/world-chase-bt85.js: every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m (denser
     near); each place a small group (C.grp things within C.spread m). near(x, z) -> { i, lat }; pick gets the forest's nearness too */
  const band = (soft, near, gT, slope, lc, edge, bad, R, C, st) => {
    const T = API.T, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        const e = C.edge ? edge(gx, gz) : 0;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (q.i < 0 || gap(q.i, i, N) * T.ds > oo + 12) continue;
          const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (on or by a road: this leg's or another's)
          if (bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
          const c = lc ? lc(x, z) : 0; if (c === 5 || c === 6 || c === 7) continue;
          const P = C.pick(R, oo - bar, s, c, e), h = R(); if (!P) continue;
          if (P.k === 'p') soil(soft, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g') cushion(soft.get(x, z), x, y, z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };

  /* ---- Ella (land cover of js/world-ella.js vrLC: 1 forest, 0 and 2 grass and scrub, 3 bare, 5 town, 6 tea, 7 fields) ---- */
  const EL = {
    rank: [[0.22, 0.36, 0.14], [0.27, 0.41, 0.17]], seed: [[0.44, 0.46, 0.27], [0.5, 0.5, 0.31]],
    bush: [[0.13, 0.33, 0.08], [0.17, 0.39, 0.1]], young: [[0.24, 0.47, 0.12], [0.3, 0.52, 0.15]],
    litter: [[0.3, 0.24, 0.15], [0.35, 0.28, 0.17]], fern: [[0.22, 0.38, 0.14], [0.26, 0.42, 0.16]],
    seep: [[0.25, 0.22, 0.17], [0.3, 0.26, 0.2]], moss: [[0.24, 0.33, 0.14], [0.29, 0.37, 0.17]],
  };
  // the foot of the barrier line: the uncut strip
  const FOOT = { step: 2.6, n: 1, grp: 3, spread: 1.4, from: 0.4, reach: 3, pw: 1, drop: 4, rise: 4, maxSl: 1.2,
    keep: () => 0.75,
    pick: (R, d, s, c) => c === 3 ? null
      : R() < 0.8 ? { c: 'rob', k: 't', w: 0.44, h: 0.62, col: T3(R, EL.rank), n: 6 } : { c: 'rob', k: 't', w: 0.34, h: 0.75, col: T3(R, EL.seed), n: 5 } };
  // the slopes: scrub, the forest's edge, the wet faces
  const FAR = { step: 4.5, n: 3, grp: 3, spread: 4.5, from: 4, reach: 60, pw: 1.3, drop: 14, rise: 30, maxSl: 1.5, edge: true,
    keep: (d) => d < 20 ? 0.6 : 0.7,
    pick: (R, d, s, c, e) => { const r = R(), w = d < 25 ? 1.0 : 1.35;
      if (c === 3 || s > 0.9) return r < 0.4 ? { c: 'mokro', k: 'p', r: (0.8 + R() * 1.0) * w, col: C3(R, EL.seep) }
        : r < 0.65 ? { c: 'mah', k: 'g', w: 0.6 * w, h: 0.2, col: T3(R, EL.moss) } : null;
      if (c === 1) return r < 0.3 ? { c: 'podrast', k: 'g', w: 0.95 * w, h: 0.6, col: T3(R, R() < 0.7 ? EL.bush : EL.fern) } : null;   // (the undergrowth; the litter and the ferns: js/world-chase-bt85.js)
      if (e > 0 && r < 0.3 + e * 0.5) return R() < 0.5 ? { c: 'listje', k: 'p', r: (1.0 + R() * 1.2) * w, col: C3(R, EL.litter) }
        : { c: 'praprot', k: 'g', w: 0.65 * w, h: 0.4, col: T3(R, EL.fern) };
      if (c === 2) return r < 0.75 ? { c: 'grmi', k: 'g', w: 1.25 * w, h: 0.85, col: T3(R, R() < 0.7 ? EL.bush : EL.young) } : null;
      return r < 0.3 ? { c: 'grmi', k: 'g', w: 1.05 * w, h: 0.7, col: T3(R, R() < 0.5 ? EL.bush : EL.young) } : null; } };

  const ella = (ctx, o) => {
    const T = API.T; if (!T || !T.br || !T.wAt || !ctx.out || !ctx.root || !ctx.out.matV) return null;
    const gT = o.gH || API.vrGround, slope = o.slope || API.vrSlope, near0 = o.near || API.vrNear, lc = o.lc || API.vrLC; if (!gT || !slope || !near0) return null;
    const ex = ctx.excluded || (() => false), bad = (x, z) => ex(x, z) || (o.bad && o.bad(x, z));
    const q2 = { i: -1, lat: 0 }, near = (x, z) => { const q = near0(x, z); q2.i = q.i;
      q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; };
    const edge = (x, z) => { if (!lc) return 0; let a = 0; for (const [u, v] of [[9, 0], [-9, 0], [0, 9], [0, -9]]) if (lc(x + u, z + v) === 1) a++; return a / 4; };
    const R = rng(116200), soft = softScen(ctx.root, ctx.out.matV), st = {};
    band(soft, near, gT, slope, lc, edge, bad, R, FOOT, st);
    band(soft, near, gT, slope, lc, edge, bad, R, FAR, st);
    soft.done(); return st;
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'ella' && ctx && ctx.out) try { ctx.out.robBt116 = ella(ctx, o || {}); } catch (e) { console.error('chase-bt116 (ella):', e); }
      return r;
    };
    Object.assign(f, base);
    World.ext.goreRob = f;
  }
})();
