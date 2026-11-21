/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighty-fourth group of the real tracks: Biķernieki and
   Ngorongoro, a further pass on top of the earlier groups (Biķernieki: js/world-chase-bt41.js, js/world-chase-bt60.js: flat patches
   from 0.6 m behind the barriers to ~60 m and the lawn's mown stripes; Ngorongoro: js/world-chase-bt20.js, js/world-chase-bt50.js,
   js/world-chase-bt51.js: the shoulder from 0.5 m past the setts, the slope to ~12 m and a band to ~55 m). From behind the car the
   asphalt's and the setts' edge still met the verge in one clean line; past the barriers Biķernieki's woods and wet hollows had only
   flat colour on the ground, nothing standing, and on Ngorongoro the band thinned to a few tufts past ~20 m.
   Biķernieki (docs/proge/bikernieki.md: »asfalt z rdeče-belimi robniki; v ovinkih peščeni izletni pasovi, drugod pokošena trava«,
   »borov gozd s smrekovimi sestoji in brezami, na odprtem pokošene trate s peščenimi zaplatami, v mokrih kotanjah visoka trava«;
   chained on its look's LK.extra, js/world-rbring.js): on the grass edge past the asphalt (never on a kerb, a sand trap or the pits'
   side) the worn pale sand showing through the mown grass; from ~2 m behind the barriers to ~60 m in the woods the young spruces and
   pines in low dark cushions with grass tufts at the woods' edge, in the wet hollows the tall grass in tufts; the open mown lawn stays
   mown (only a few low tufts on its sand). All in the builder's own scenery chunks (no draw is added).
   Ngorongoro (docs/proge/ngorongoro.md: »grobe sivo-rjave kamnite kocke z rdečim prahom v fugah«, »rumeno-rjava trava, slama, kjer je
   suho, … rdeče-rjava vulkanska prst, temnejše grmičevje«; chained after World.ext.goreRob, which js/world-ngorongoro.js calls last): a
   worn edge 0.05-0.5 m past the setts with the red dust washed out of the joints; from ~3 m to ~60 m past the barrier line tawny
   tussocks, straw patches, the red-brown earth and here and there a dark low shrub, greener by the streams; in meshes of its own
   (softScen: 256 m chunks, no shadow). Nothing where another leg's road is nearer, in the builders' excluded places (Ngorongoro: its
   streams, path and the animals' places), on a face too steep or far below the road. The horizon stays the builders' own DEM terrain;
   the terrain, the road, the barriers, the trees, the animals and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
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

  const CFG = { ngorongoro: { seed: 84200, E: NGE, F: NGF } };

  const run = (ctx, id, o) => {
    const T = API.T, C = CFG[id]; if (!C || !T || !T.br || !T.wAt || !ctx.out || !ctx.root || !ctx.out.matV) return null;
    const gT = o.gH || API.vrGround, slope = o.slope || API.vrSlope, near0 = o.near || API.vrNear; if (!gT || !slope || !near0) return null;
    const ex = ctx.excluded || (() => false), water = o.water;
    const bad = (x, z) => ex(x, z) || (o.bad && o.bad(x, z)) || (water && water(x, z).e > -1);
    const near = latOf(T, near0), R = rng(C.seed), soft = softScen(ctx.root, ctx.out.matV);
    const st = band(soft, near, gT, slope, o.lc, bad, R, C.F); st.rob = edge(soft, near, gT, bad, R, C.E);
    soft.done(); return st;
  };

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (CFG[id] && ctx && ctx.out) try { ctx.out.robBt84 = run(ctx, id, o || {}); } catch (e) { console.error('chase-bt84 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);
    World.ext.goreRob = f;
  }

  /* ---- Biķernieki, on the shared circuit builder (js/world-rbring.js): its look's LK.extra chained, as js/world-chase-bt41.js ---- */
  const BKC = {
    sand: (R) => C3(R, [0.74, 0.68, 0.52], [0.68, 0.63, 0.47], 0.97),     // (the pale dune sand through the grass)
    worn: (R) => C3(R, [0.52, 0.56, 0.33], [0.58, 0.58, 0.38], 0.97),     // (thin, sandy grass)
    spruce: (R) => mute(vary(mix3([0.17, 0.27, 0.16], [0.21, 0.31, 0.18], R()), R, 0.02), 1.0),
    pine: (R) => mute(vary(mix3([0.24, 0.33, 0.18], [0.28, 0.37, 0.2], R()), R, 0.02), 1.0),
    grass: (R) => mute(vary(mix3([0.38, 0.5, 0.22], [0.46, 0.55, 0.26], R()), R, 0.03), 0.98),
    tall: (R) => mute(vary(mix3([0.4, 0.5, 0.24], [0.52, 0.55, 0.3], R()), R, 0.03), 0.98),
  };
  const bik = (ctx) => {
    const T = API.T, { nrGround, nrNear, nrSlope, nrLC, nrLCf } = API, st = { rob: 0, grmi: 0, sopi: 0, zaplate: 0 };
    if (!T || !T.br || !T.k || !nrGround || !nrNear || !nrLC || !ctx || !ctx.scen) return st;
    const scen = ctx.scen, ex = ctx.excluded || (() => false), N = T.px.length, w = T.w, cw = T.curbW || 1;
    const pd = T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pit = (s, sd) => ps && sd === ps && (!!T.pitAt(s) || (T.pitLead ? T.pitLead(s) >= 0 : false));
    const kerb = (i, sd) => !!(T.curb && T.curb[i]) && (sd * T.k[i] > 0 || Math.abs(T.k[i]) > 1 / 70);   // (as js/world-rbring.js draws them)
    const trap = (i, sd) => { const g = sd > 0 ? T.gravR : T.gravL; if (!g) return false; for (let d = -4; d <= 4; d++) if (g[((i + d) % N + N) % N]) return true; return false; };
    const R = rng(84300);
    // the circuit's verge ribbon lies over the terrain (js/world-rbring.js, rbVerge; nrNear: d from the centre line, dd past the nearest barrier: 0 at the edge, -4 cm at 1.2 m, -10 cm, at least 6 cm over
    // the ground): the patches go on it, not under it
    const gV = (x, z) => { const q = nrNear(x, z), g = nrGround(x, z) + 0.06; if (q.i < 0) return g; const e = q.d - w;
      return Math.max(g, T.hy[q.i] + (e <= 0 ? 0 : e <= 1.2 ? -0.04 * e / 1.2 : -0.04 - 0.06 * Math.min(1, (e - 1.2) / 0.6))); };
    // the worn edge: past the asphalt's edge (no kerb there), a flat patch of the sand through the mown grass
    for (let i = 0; i < N; i += Math.max(1, Math.round(2.6 / T.ds))) for (const sd of [-1, 1]) {
      if (R() > 0.6) continue;
      let kk = false; for (let d = -3; d <= 3 && !kk; d++) kk = kerb(((i + d) % N + N) % N, sd);
      if (kk || trap(i, sd) || pit(i * T.ds, sd)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], r = 0.3 + R() * 0.35, o = w + 0.08 + r + R() * 0.5; if (o + r > bar - 0.5) continue;
      const a = (R() - 0.5) * 2.6, x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = nrNear(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 6 || q.d < w + r * 0.7 || q.dd > 0 || ex(x, z)) continue;
      soil(scen, gV, x, z, r, R() < 0.55 ? BKC.worn(R) : BKC.sand(R), R, 0.02); st.rob++;
    }
    // behind the barriers, ~2 to ~60 m: what stands in the woods and the wet hollows
    for (let i = 0; i < N; i += Math.max(1, Math.round(3.2 / T.ds))) for (const sd of [-1, 1]) {
      if (pit(i * T.ds, sd)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < 2; k++) {
        const d = 2 + Math.pow(R(), 1.4) * 58, oo = bar + d, a = (R() - 0.5) * 5, h = R(), r = R();
        if (R() > (d < 20 ? 0.8 : 0.5)) continue;
        const x = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        const q = nrNear(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > oo + 10 || q.dd < 1.6 || ex(x, z)) continue;
        if (nrSlope && nrSlope(x, z) > 0.55) continue;
        const c = nrLC(x, z); if (c !== 0 && c !== 1 && c !== 2) continue;
        const wet = c === 2 || (nrLCf ? nrLCf(x, z, 2) : 0) > 0.2, wood = c === 1 || (nrLCf ? nrLCf(x, z, 1) : 0) > 0.4, y = nrGround(x, z);
        if (wet) { tuft(scen.get(x, z), x, y, z, 0.32 + h * 0.15, 0.7 + h * 0.35, BKC.tall(R), R, 5); st.sopi++; }   // (the tall grass of the wet hollows)
        else if (wood) {
          if (r < 0.5) { cushion(scen.get(x, z), x, y, z, 0.6 + h * 0.5, 0.55 + h * 0.5, r < 0.3 ? BKC.spruce(R) : BKC.pine(R), R); st.grmi++; }   // (young spruces and pines)
          else if (r < 0.85) { tuft(scen.get(x, z), x, y, z, 0.28 + h * 0.12, 0.35 + h * 0.2, BKC.grass(R), R, 5); st.sopi++; }
          else { soil(scen, gV, x, z, 0.8 + h * 0.8, BKC.worn(R), R, 0.04); st.zaplate++; }
        } else if (r < 0.12) { tuft(scen.get(x, z), x, y, z, 0.22 + h * 0.1, 0.2 + h * 0.12, BKC.grass(R), R, 5); st.sopi++; }   // (the mown lawn: a rare low tuft)
      }
    }
    return st;
  };
  { const L = (API.rbLook || {}).bikernieki;
    if (L) { const prev = L.extra;
      L.extra = function (ctx) {
        const r = (prev ? prev.call(this, ctx) : null) || {};
        try { r.robBt84 = bik(ctx); } catch (e) { console.error('chase-bt84 (bikernieki):', e); }
        return r;
      }; } }
})();
