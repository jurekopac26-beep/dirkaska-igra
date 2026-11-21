/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighty-fourth group of the real tracks: Pikes Peak (asphalt,
   'pikes') and Ngorongoro, a further pass on two of the mountain roads whose ground the earlier groups set (Pikes Peak: js/world-chase-bt16.js,
   js/world-chase-bt39.js: tufts and cushions behind the barrier, flat patches to ~10 m and a sparse flat band to ~55 m; Ngorongoro:
   js/world-chase-bt20.js, js/world-chase-bt50.js, js/world-chase-bt51.js: the shoulder from 0.5 m past the setts, the slope to ~12 m and a
   band to ~55 m). From behind the car the asphalt's and the setts' edge still met the verge in one clean line, and past ~10 m Pikes Peak's
   slope was flat colour only, with nothing standing on it, while on Ngorongoro the band thinned to a few tufts past ~20 m.
   So here, both chained after World.ext.goreRob (the builders call it last: js/world-pikes.js, js/world-ngorongoro.js):
   a worn edge 0.05-0.75 m past the road's edge (flat and thin, so it may lie under the rail or by the kerbstones), and a band from
   ~3 m to ~60 m past the barrier line with things that stand (tufts, low cushions, scattered stones), thinning with the distance.
   Pikes Peak (docs/proge/pikes.md, the builder's ground pkCol and land cover pkLC: forest, treeline, tundra, steep rock, the summit): on the
   edge the pink granite's grit and dust; in the forest the needle litter and low juniper, at the treeline the bristlecone's krummholz in low
   cushions, on the tundra olive grass tufts, the alpine cushion plants and pink-grey granite stones; on the summit's boulder field only
   stones. Ngorongoro (docs/proge/ngorongoro.md: »grobe sivo-rjave kamnite kocke z rdečim prahom v fugah«, »rumeno-rjava trava, slama, kjer je
   suho, … rdeče-rjava vulkanska prst, temnejše grmičevje«): on the edge the red dust washed out of the joints; out to ~60 m tawny
   tussocks, straw patches, the red-brown earth and here and there a dark low shrub, the greener grass by the streams.
   Nothing where another leg's road is nearer, in the builders' excluded places (Ngorongoro: its streams, path and the animals' places),
   on a face too steep or far below the road. The horizon stays the builders' own DEM terrain. All of it in meshes of their own (softScen:
   256 m chunks, no shadow); the terrain, the road, the barriers, the trees, the animals and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;

  const latOf = (T, near) => { const q2 = { i: -1, lat: 0 }; return (x, z) => { const q = near(x, z); q2.i = q.i;
    q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; }; };
  // (as js/world-chase-bt73.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.015), k);

  /* the worn edge: every E.step m on both sides a short flat patch just past the road's edge, at the road's height or the ground's */
  const edge = (soft, near, gT, bad, R, E) => {
    const T = API.T, N = T.px.length, step = Math.max(1, Math.round(E.step / T.ds)); let n = 0;
    const gE = (x, z) => { const q = near(x, z), g = gT(x, z); return q.i >= 0 ? Math.max(g, T.hy[q.i] - 0.03) : g; };
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      if (R() > E.share) continue;
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], o = w + 0.05 + R() * E.reach; if (o > bar + 0.5) continue;
      const a = (R() - 0.5) * E.step, x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 6 || Math.abs(q.lat) < T.wAt(q.i) || bad(x, z)) continue;
      const g = gT(x, z); if (!(g > T.hy[i] - 1.2) || !(g < T.hy[i] + 1.2)) continue;
      soil(soft, gE, x, z, Math.min(0.55, 0.28 + R() * 0.32), E.col(R), R, 0.04); n++;
    }
    return n;
  };

  /* the band: every C.step m on both sides C.n tries between C.from m past the barrier line and C.reach m (denser near) */
  const band = (soft, near, gT, slope, lc, bad, R, C) => {
    const T = API.T, st = { zaplate: 0, grmi: 0, sopi: 0, kamni: 0 }, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const x = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > oo + 10) continue;
        const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (another leg nearer)
        if (bad(x, z)) continue;
        const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
        const c = lc ? lc(x, z) : 0; if (C.skip && C.skip(c)) continue;
        const P = C.pick(R, oo - bar, s, c), h = R(); if (!P) continue;
        if (P.k === 'p') { soil(soft, gT, x, z, P.r, P.col, R, 0.05); st.zaplate++; }
        else if (P.k === 'g') { cushion(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.5), P.h * (0.8 + h * 0.5), P.col, R); st.grmi++; }
        else if (P.k === 's') { cushion(soft.get(x, z), x, y - 0.05, z, P.w * (0.7 + h * 0.7), P.h * (0.7 + h * 0.6), P.col, R); st.kamni++; }
        else { tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, 5); st.sopi++; }
      }
    }
    return st;
  };

  /* Pikes Peak: the colours of js/world-chase-bt39.js (PK), the land cover of js/world-chase-bt16.js (pkLC: 1 forest, 2 treeline,
     0 tundra, 4 steep rock, 5 the summit). */
  const PKE = { step: 2.4, share: 0.7, reach: 0.7,
    col: (R) => R() < 0.6 ? C3(R, [0.62, 0.53, 0.46], [0.66, 0.56, 0.48]) : C3(R, [0.6, 0.51, 0.43], [0.63, 0.53, 0.44]) };   // (pink granite grit, the road's dust)
  const PKF = { step: 3.4, n: 3, from: 3, reach: 60, pw: 1.5, drop: 10, rise: 40, maxSl: 1.2,
    keep: (d) => d < 25 ? 0.8 : 0.55,
    skip: (c) => c === 3,
    pick: (R, d, s, c) => { const r = R(), w = d < 25 ? 1 : 1.4;
      const stone = () => ({ k: 's', w: d < 25 ? 0.45 : 0.65, h: 0.32, col: mute(vary(mix3([0.6, 0.52, 0.47], [0.55, 0.5, 0.47], R()), R, 0.025), 0.97) });   // (pink-grey granite)
      if (c === 5 || c === 4 || s > 0.9) return r < 0.55 ? stone() : r < 0.8 ? { k: 'p', r: (0.9 + R() * 1.2) * w, col: C3(R, [0.6, 0.52, 0.46], [0.64, 0.55, 0.48]) } : null;   // (boulder field, scree)
      if (c === 1) {   // (forest: needle litter, low juniper, the odd stone)
        if (r < 0.4) return { k: 'p', r: (1.1 + R() * 1.4) * w, col: C3(R, [0.4, 0.31, 0.21], [0.44, 0.34, 0.23]) };
        if (r < 0.75) return { k: 'g', w: d < 25 ? 0.7 : 0.95, h: 0.42, col: mute(vary(mix3([0.24, 0.33, 0.2], [0.29, 0.36, 0.23], R()), R, 0.025), 0.97) };
        if (r < 0.88) return { k: 't', w: 0.28, h: 0.4, col: mute(vary(mix3([0.46, 0.46, 0.26], [0.56, 0.52, 0.32], R()), R, 0.03)) };
        return stone();
      }
      if (c === 2) {   // (treeline: the krummholz in low cushions, olive grass)
        if (r < 0.4) return { k: 'g', w: d < 25 ? 0.85 : 1.1, h: 0.5, col: mute(vary(mix3([0.26, 0.34, 0.21], [0.31, 0.37, 0.24], R()), R, 0.025), 0.97) };
        if (r < 0.65) return { k: 't', w: 0.3, h: 0.42, col: mute(vary(mix3([0.48, 0.47, 0.27], [0.58, 0.53, 0.33], R()), R, 0.03)) };
        if (r < 0.85) return { k: 'p', r: (1.1 + R() * 1.5) * w, col: C3(R, [0.48, 0.47, 0.27], [0.55, 0.51, 0.31]) };
        return stone();
      }
      // (tundra: olive and green-brown grass tufts, the alpine cushion plants, granite stones and gravel)
      if (r < 0.35) return { k: 't', w: 0.26, h: 0.32, col: mute(vary(mix3([0.46, 0.46, 0.26], [0.6, 0.55, 0.36], R()), R, 0.03)) };
      if (r < 0.55) return { k: 'g', w: 0.45, h: 0.16, col: mute(vary(mix3([0.4, 0.42, 0.25], [0.46, 0.43, 0.28], R()), R, 0.025), 0.97) };
      if (r < 0.75) return { k: 'p', r: (1.1 + R() * 1.5) * w, col: R() < 0.5 ? C3(R, [0.4, 0.41, 0.25], [0.46, 0.41, 0.27]) : C3(R, [0.62, 0.52, 0.45], [0.66, 0.55, 0.47]) };
      return stone(); } };

  /* Ngorongoro: the colours of js/world-chase-bt50.js and js/world-chase-bt51.js. On the edge the red dust out of the setts' joints, now
     and then the grey-brown grit; out to ~60 m the tawny tussocks, straw, the red-brown earth, dark low shrubs, greener by the streams (6). */
  const NGE = { step: 2.2, share: 0.75, reach: 0.45,
    col: (R) => R() < 0.7 ? C3(R, [0.52, 0.34, 0.23], [0.56, 0.38, 0.26]) : C3(R, [0.5, 0.46, 0.4], [0.54, 0.49, 0.42]) };
  const NGF = { step: 3.4, n: 3, from: 3, reach: 60, pw: 1.3, drop: 10, rise: 30, maxSl: 0.9,
    keep: (d) => d < 20 ? 0.55 : 0.75,   // (the near strip already full from bt50/bt51: more of it farther out)
    skip: (c) => c === 3 || c === 5,
    pick: (R, d, s, c) => { const r = R(), w = d < 25 ? 1 : 1.5;
      if (c === 6) return r < 0.5 ? { k: 'p', r: (1.1 + R() * 1.4) * w, col: C3(R, [0.38, 0.45, 0.22], [0.43, 0.48, 0.25]) }
        : { k: 't', w: 0.32, h: 0.5, col: mute(vary(mix3([0.4, 0.47, 0.22], [0.48, 0.5, 0.27], R()), R, 0.03)) };   // (greener by the streams)
      if (r < 0.25) return { k: 'p', r: (1.3 + R() * 1.8) * w, col: C3(R, [0.6, 0.53, 0.34], [0.64, 0.57, 0.37]) };   // (straw)
      if (r < 0.38) return { k: 'p', r: (1.0 + R() * 1.3) * w, col: C3(R, [0.5, 0.33, 0.23], [0.55, 0.37, 0.25]) };   // (red-brown earth)
      if (r < 0.82) return { k: 't', w: d < 25 ? 0.3 : 0.38, h: d < 25 ? 0.45 : 0.55, col: mute(vary(mix3([0.6, 0.5, 0.29], [0.68, 0.6, 0.37], R()), R, 0.03), 0.98) };   // (tawny tussocks)
      return { k: 'g', w: d < 25 ? 0.8 : 1.05, h: 0.55, col: mute(vary(mix3([0.27, 0.31, 0.17], [0.32, 0.35, 0.19], R()), R, 0.025), 0.98) }; } };   // (dark shrubs, mid tone)

  const CFG = { pikes: { seed: 84100, E: PKE, F: PKF }, ngorongoro: { seed: 84200, E: NGE, F: NGF } };

  const run = (ctx, id, o) => {
    const T = API.T, C = CFG[id]; if (!C || !T || !T.br || !T.wAt || !ctx.out || !ctx.root || !ctx.out.matV) return null;
    if (id === 'pikes' && T.def && T.def.id !== 'pikes') return null;   // (pikesg: the same builder and id, its own def.id: stays as it is)
    const gT = o.gH || API.vrGround, slope = o.slope || API.vrSlope, near0 = o.near || API.vrNear; if (!gT || !slope || !near0) return null;
    const ex = ctx.excluded || (() => false), water = o.water;
    const bad = (x, z) => ex(x, z) || (o.bad && o.bad(x, z)) || (water && water(x, z).e > -1);
    const near = latOf(T, near0), R = rng(C.seed), soft = softScen(ctx.root, ctx.out.matV);
    const st = band(soft, near, gT, slope, o.lc, bad, R, C.F); st.rob = edge(soft, near, gT, bad, R, C.E);
    soft.done(); return st;
  };

  const base = World.ext.goreRob;
  const f = function (ctx, id, o) {
    const r = base.call(this, ctx, id, o);
    if (CFG[id] && ctx && ctx.out) try { ctx.out.robBt84 = run(ctx, id, o || {}); } catch (e) { console.error('chase-bt84 (' + id + '):', e); }
    return r;
  };
  Object.assign(f, base);
  World.ext.goreRob = f;
})();
