/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-first group of the real tracks: Sosnová and Tapini.
   Sosnová is a third pass on a circuit whose ground the earlier groups set (js/world-chase-bt21.js: late-summer tufts at the fences' foot,
   yarrow and knapweed, the pines' needles; js/world-chase-bt53.js: the lawn's and the meadow's flat patches to ~60 m). Tapini is its first:
   the short-roads builder (js/world-gore.js) drew its valley side as one even green from the road's edge to the horizon.
   From behind the car on Sosnová the ground past the fences (the infield and the meadows) was flat patches with nothing standing in them
   beyond the fence's foot; on Tapini nothing at all lay or stood between the earth road and the trees.
   So here:
   Sosnová (docs/proge/sosnova.md: »borov gozd peščene pokrajine okoli Česke Lípe (rdeči bor, ob robovih in na odprtem breze),
   poznopoletni travniki z rmanom in glavincem, strnišča«), chained on the look's extra (js/world-rbring.js rbLook.sosnova): from ~3 m
   past the fences out to ~60 m, in loose groups, the uncut late-summer grass in tufts (green going to straw), the yarrow's low white
   cushions and the knapweed's purple-tipped stems, in the scrub and at the wood's edge young birch, under the pines the low bilberry
   green and the sandy soil showing in small patches; denser near, thinner far. Nothing on the mown lawn inside the fences.
   Tapini (docs/proge/tapini.md: »deževni gozd z listavci, trava na grebenih«, »rjava zemlja«, land cover ESA WorldCover), chained on the
   style's S.extra (World.gore.build wrapped for this road only): from ~1.5 m past the road's edge line to ~60 m, on the grass of the
   spurs tall pale tussocks in groups and patches of a darker and a paler green; under the forest the dark leaf litter, ferns and low
   broad-leaved undergrowth; on bare ground and on steep faces the brown clay and grey-brown stones; the clay spilling off the road's
   edge in small patches. Nothing far below the road (the drop's face stays the builder's cliff) or on a face too steep.
   Nothing on built ground or the water, on the pits' side along the pits, in the builders' excluded places or where another leg's road
   is nearer. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the fences, the trees and the
   driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt85.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.015), k);
  const T3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.03), k || 0.97);

  /* the band (as js/world-chase-bt85.js): every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m (denser
     near); each place a small group (C.grp things within C.spread m), so it reads as clumps, not an even sprinkle. near(x, z) -> { i, lat } */
  const band = (soft, near, gT, slope, lc, bad, R, C, st) => {
    const T = API.T, N = T.px.length, open = !!(T.def && T.def.open);
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (q.i < 0 || (open ? Math.abs(q.i - i) : gap(q.i, i, N)) * T.ds > oo + 12) continue;
          const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (on or by a road: this leg's or another's)
          if (bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[q.i] - C.drop) || !(y < T.hy[q.i] + C.rise) || s > C.maxSl) continue;
          const c = lc ? lc(x, z) : 0; if (C.skip && C.skip(c)) continue;
          const P = C.pick(R, Math.abs(q.lat) - qb, s, c), h = R(); if (!P) continue;
          if (P.k === 'p') soil(soft, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g' || P.k === 's') cushion(soft.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };

  /* ---- Sosnová: past the fences, the late-summer meadow (colours of js/world-chase-bt21.js LOOK.sosnova and js/world-chase-bt53.js SO;
     land cover of js/world-rbring.js nrLC: 0 grass, 1 wood, 2 scrub, 3 built, 6 water) ---- */
  const SO = {
    grass: [[0.38, 0.52, 0.22], [0.48, 0.54, 0.27]], straw: [[0.62, 0.59, 0.36], [0.7, 0.64, 0.38]], yarrow: [[0.84, 0.83, 0.76], [0.88, 0.87, 0.8]],
    knap: [[0.52, 0.4, 0.5], [0.6, 0.38, 0.58]], birch: [[0.38, 0.5, 0.22], [0.42, 0.54, 0.25]], bil: [[0.24, 0.36, 0.17], [0.28, 0.4, 0.19]],
    sand: [[0.64, 0.58, 0.43], [0.68, 0.61, 0.46]],
  };
  const SOF = { step: 4.2, n: 3, grp: 3, spread: 3.4, from: 3, reach: 60, pw: 1.3, drop: 4, rise: 8, maxSl: 0.9,
    keep: (d) => d < 24 ? 0.85 : 0.6,
    skip: (c) => c === 3 || c === 6,
    pick: (R, d, s, c) => { const r = R(), w = d < 28 ? 1.7 : 2.3;
      if (c === 1) return r < 0.45 ? { c: 'borovnica', k: 'g', w: 0.6 * w, h: 0.26, col: T3(R, SO.bil) }
        : r < 0.7 ? { c: 'breza', k: 'g', w: 0.5 * w, h: 0.5, col: T3(R, SO.birch) }
        : r < 0.88 ? { c: 'trava', k: 't', w: 0.28 * w, h: 0.42, col: T3(R, SO.straw), n: 4 } : { c: 'pesek', k: 'p', r: 0.7 + R() * 0.8, col: C3(R, SO.sand) };
      if (c === 2 && r < 0.35) return { c: 'breza', k: 'g', w: 0.6 * w, h: 0.6, col: T3(R, SO.birch) };
      if (r < 0.5) return { c: 'trava', k: 't', w: 0.3 * w, h: d < 28 ? 0.5 : 0.62, col: T3(R, R() < 0.5 ? SO.grass : SO.straw), n: 4 };
      if (r < 0.68) return { c: 'trava', k: 't', w: 0.24 * w, h: 0.36, col: T3(R, SO.straw), n: 4 };
      if (r < 0.82) return { c: 'rman', k: 'g', w: 0.26 * w, h: 0.2, col: T3(R, SO.yarrow, 0.95) };   // (yarrow: low white heads)
      if (r < 0.93) return { c: 'glavinec', k: 't', w: 0.2 * w, h: 0.52, col: T3(R, SO.knap), n: 4 };   // (knapweed: stems tipped purple)
      return { c: 'pesek', k: 'p', r: 0.6 + R() * 0.7, col: C3(R, SO.sand) }; } };

  const sosnova = (ctx) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear, nrLC } = API;
    if (!root || !matV || !T || !T.br || !nrGround || !nrNear || (T.def && T.def.id !== 'sosnova')) return null;
    const ds = T.ds, pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const bad = (x, z) => { if (excluded(x, z)) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const slope = (x, z) => { const d = 1.0, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const R = rng(101100), soft = softScen(root, matV), st = {};
    band(soft, (x, z) => nrNear(x, z), nrGround, slope, nrLC, bad, R, SOF, st);
    soft.done(); return st;
  };
  const L = API.rbLook || {};
  if (L.sosnova) chain(L.sosnova, (ctx) => { try { if (ctx.out) ctx.out.pasBt101 = sosnova(ctx); } catch (e) { console.error('chase-bt101 (sosnova):', e); } });

  /* ---- Tapini: the valley side (colours from the style's own ground, js/world-tapini.js: grass, forest, shrub, rock, dry; land cover
     of js/world-gore.js vrLC: 1 forest, 0 and 2 grass and scrub, 3 bare, 5 built) ---- */
  const TP = {
    kunai: [[0.5, 0.56, 0.27], [0.58, 0.58, 0.3]], wet: [[0.26, 0.4, 0.16], [0.3, 0.44, 0.18]], pale: [[0.46, 0.54, 0.26], [0.5, 0.56, 0.28]],
    shrub: [[0.24, 0.38, 0.15], [0.3, 0.42, 0.18]], fern: [[0.2, 0.37, 0.13], [0.25, 0.42, 0.16]], litter: [[0.25, 0.25, 0.13], [0.3, 0.27, 0.15]],
    clay: [[0.5, 0.36, 0.25], [0.56, 0.41, 0.28]], rock: [[0.42, 0.37, 0.32], [0.48, 0.42, 0.36]],
  };
  const TPF = { step: 2.0, n: 4, grp: 4, spread: 3.4, from: 1.5, reach: 60, pw: 1.5, drop: 16, rise: 34, maxSl: 1.6,
    keep: (d) => d < 18 ? 0.85 : 0.7,
    skip: (c) => c === 5,
    pick: (R, d, s, c) => { const r = R(), w = d < 20 ? 1.6 : 2.3;
      if (d < 3.5 && r < 0.3) return { c: 'glina', k: 'p', r: 0.5 + R() * 0.7, col: C3(R, TP.clay) };   // (the road's clay spilt over its edge)
      if (c === 3 || s > 1.05) return r < 0.45 ? { c: 'kamni', k: 's', w: 0.45 * w, h: 0.3, col: T3(R, TP.rock, 0.95) }
        : r < 0.8 ? { c: 'glina', k: 'p', r: 0.8 + R() * 1.0, col: C3(R, TP.clay) } : { c: 'praprot', k: 'g', w: 0.5 * w, h: 0.34, col: T3(R, TP.fern) };
      if (c === 1) return r < 0.34 ? { c: 'listje', k: 'p', r: (0.6 + R() * 0.8) * w, col: C3(R, TP.litter) }
        : r < 0.68 ? { c: 'praprot', k: 'g', w: 0.62 * w, h: 0.4, col: T3(R, TP.fern) }
        : r < 0.92 ? { c: 'podrast', k: 'g', w: 0.8 * w, h: 0.7, col: T3(R, TP.shrub) } : { c: 'kamni', k: 's', w: 0.4, h: 0.26, col: T3(R, TP.rock, 0.9) };
      if (r < 0.42) return { c: 'trava', k: 't', w: 0.42 * w, h: d < 20 ? 0.75 : 0.95, col: T3(R, TP.kunai), n: 6 };   // (the spurs' tall grass)
      if (r < 0.58) return { c: 'zaplate', k: 'p', r: (1.2 + R() * 1.6) * w, col: C3(R, TP.wet) };
      if (r < 0.72) return { c: 'zaplate', k: 'p', r: (1.1 + R() * 1.4) * w, col: C3(R, TP.pale) };
      if (r < 0.9) return { c: 'podrast', k: 'g', w: 0.7 * w, h: 0.55, col: T3(R, TP.shrub) };
      return { c: 'praprot', k: 'g', w: 0.5 * w, h: 0.34, col: T3(R, TP.fern) }; } };

  const tapini = (ctx) => {
    const T = API.T, out = ctx.out, gT = API.vrGround, slope = API.vrSlope, near0 = API.vrNear, lc = API.vrLC;
    if (!T || !T.br || !out || !ctx.root || !out.matV || !gT || !slope || !near0 || (T.def && T.def.id !== 'tapini')) return null;
    const ex = ctx.excluded || (() => false);
    const q2 = { i: -1, lat: 0 }, near = (x, z) => { const q = near0(x, z); q2.i = q.i;
      q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; };
    const R = rng(101200), soft = softScen(ctx.root, out.matV), st = {};
    band(soft, near, gT, slope, lc, ex, R, TPF, st);
    soft.done(); return st;
  };
  /* Tapini's style has no S.extra of its own: the builder's build wrapped while World.ext.tapini runs, the style's extra chained */
  if (World.gore && World.gore.build && World.ext && World.ext.tapini) {
    const ext0 = World.ext.tapini, build0 = World.gore.build;
    let on = false;
    World.gore.build = function (scene, tex, opts, S) {
      if (!on || !S) return build0.apply(this, arguments);
      on = false;
      const e0 = S.extra, S2 = Object.assign({}, S, { extra(ctx) { if (typeof e0 === 'function') e0.call(this, ctx);
        try { if (ctx && ctx.out) ctx.out.robBt101 = tapini(ctx); } catch (e) { console.error('chase-bt101 (tapini):', e); } } });
      return build0.call(this, scene, tex, opts, S2);
    };
    World.ext.tapini = function () { on = true; try { return ext0.apply(this, arguments); } finally { on = false; } };
  }
})();
