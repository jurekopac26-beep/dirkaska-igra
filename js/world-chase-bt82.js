/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighty-second group of the real tracks: Seoul and Pikes Peak
   on its historic gravel (pikesg), a further pass on two tracks whose roadside the thirty-seventh and sixtieth groups (Seoul:
   js/world-chase-bt37.js, js/world-chase-bt60.js: the strip to the blocks, the litter's drift, the forest floor's undergrowth) and the
   fifty-second (js/world-chase-bt52.js: pikesg's windrow, its grit to ~10 m and flat patches to ~55 m) already set.
   From behind the car Seoul's asphalt still ran clean to the kerb in one even grey, and in the town (land cover 3) and on the park's
   lawns (2) the ground between the blocks and the houses was one smooth face: the earlier passes laid nothing there. So here, on the
   asphalt (docs/proge/seoul.md: parkovne ceste in mestna ulica) the gutter's grit in short streaks between the edge line and the kerb and,
   now and then, a mid-grey patch of newer asphalt in a lane (both below the lines' paint); in the town the kerb's drain grates (pale
   steel grey, never near black), the paving's lighter and darker slabs between the kerb and the blocks and, past the blocks to ~60 m
   (not in the buildings, the landmarks or at the crossings: noTree, nearCross), the pavement's slabs and the round covers; on the lawns
   the mown grass in lighter and deeper patches and the bare worn earth, clover-green tufts at the blocks' foot. All of it in Seoul's own
   scenery chunks (no draw is added).
   On pikesg (js/tracks/pikesg.js: »rožnato sivem granitnem gramozu s kolesnicami in valovi … prah in kamenje za avtom«; the builder's
   ground pkCol, js/world-pikes.js: rust needle litter under the trees, pink granite gravel with olive grass, green-brown tundra above
   the trees, grey-pink scree and bare granite on the steep) the gravel's edge was still one clean line and past the first ~10 m only flat
   patches. So here the loose pink gravel thrown to the edge and the coarser stones in short streaks just inside it; past the barrier
   line from ~1.5 to ~60 m what stands on that ground: the pink granite's boulders, low limber- and bristlecone-pine shrubs and the
   needle litter under the trees, the tundra's low cushions and dry tufts above them, the scree's patches on the steeper slopes. Nothing
   on built ground (3), the bare steep granite (4) or the snow (5), nothing where another leg's road is nearer; Pikes Peak on asphalt
   ('pikes') stays. In meshes of their own (softScen: 256 m chunks, no shadow).
   The terrain, the road, the barriers, the trees, the horizon and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.softScen || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, cushion, softScen, mix3 } = BT;
  // (a fifth of the way to their grey and a little darker, as the thirty-ninth group: a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const C_ = (R, ab, j) => mute(vary(mix3(ab[0], ab[1], R()), R, j || 0.015));

  /* a thin low streak lying on the ground along (ax, az), tapering to both ends (the seventy-fifth group's) */
  const streak = (g, gH, x, z, ax, az, len, wid, col, R, lift, seg) => {
    const bx = -az, bz = ax, n = seg || 4, up = lift || 0.04, rim = [col[0] * 0.92 + 0.04, col[1] * 0.92 + 0.05, col[2] * 0.92 + 0.03], L = [], P = [], C = [];
    for (let k = 0; k <= n; k++) {
      const u = (k / n - 0.5) * len, t = Math.sin(Math.PI * k / n), hw = wid * 0.5 * (0.2 + 0.8 * t) * (0.8 + R() * 0.4), j = (R() - 0.5) * wid * 0.3;
      const cx = x + ax * u + bx * j, cz = z + az * u + bz * j;
      L.push([cx + bx * hw, gH(cx + bx * hw, cz + bz * hw) + up, cz + bz * hw]); P.push([cx - bx * hw, gH(cx - bx * hw, cz - bz * hw) + up, cz - bz * hw]); C.push([cx, gH(cx, cz) + up + 0.006, cz]);
    }
    for (let k = 0; k < n; k++) {
      const inn = [C[k][0], C[k][1] - 5, C[k][2]];
      g.triO(C[k], L[k], L[k + 1], col, inn, rim, rim); g.triO(C[k], L[k + 1], C[k + 1], col, inn, rim, col);
      g.triO(C[k], P[k + 1], P[k], col, inn, rim, rim); g.triO(C[k], C[k + 1], P[k + 1], col, inn, col, rim);
    }
  };
  /* a flat rectangle on a surface at height gH + lift, centred at (x, z), its long side along (ax, az); `rim` its edge's colour */
  const slab = (g, gH, x, z, ax, az, L, W, col, rim, lift) => {
    const bx = -az, bz = ax, P = (u, v) => { const px = x + ax * u + bx * v, pz = z + az * u + bz * v; return [px, gH(px, pz) + lift, pz]; };
    const a = P(-L / 2, -W / 2), b = P(L / 2, -W / 2), c = P(L / 2, W / 2), d = P(-L / 2, W / 2), m = P(0, 0), inn = [x, m[1] - 5, z], r = rim || col;
    g.triO(m, a, b, col, inn, r, r); g.triO(m, b, c, col, inn, r, r); g.triO(m, c, d, col, inn, r, r); g.triO(m, d, a, col, inn, r, r);
  };
  /* a flat disc (a cover): n wedges round (x, z) */
  const disc = (g, gH, x, z, rad, col, rim, lift, n) => {
    const k = n || 8, y = gH(x, z) + lift, m = [x, y, z], inn = [x, y - 5, z];
    for (let q = 0; q < k; q++) { const a0 = q / k * Math.PI * 2, a1 = (q + 1) / k * Math.PI * 2;
      g.triO(m, [x + Math.cos(a0) * rad, y, z + Math.sin(a0) * rad], [x + Math.cos(a1) * rad, y, z + Math.sin(a1) * rad], col, inn, rim, rim); }
  };

  /* ==== Seoul (its own builder, js/world-seoul.js: World.ext.seoulRob({ scen, noTree, nearCross, out }) chained again) ==== */
  const SE = {
    grit: [[0.5, 0.48, 0.44], [0.55, 0.52, 0.47]], leaf: [[0.5, 0.41, 0.29], [0.46, 0.39, 0.28]],   // (the gutter's grey grit; under the woods its leaves)
    patch: [[0.4, 0.4, 0.41], [0.45, 0.45, 0.46]],   // (newer asphalt: a mid grey, darker than the worn lanes, never near black)
    grate: [[0.46, 0.47, 0.48], [0.5, 0.51, 0.52]],   // (the drain grates: pale steel grey)
    paveL: [[0.84, 0.83, 0.8], [0.8, 0.79, 0.76]], paveD: [[0.68, 0.67, 0.64], [0.72, 0.7, 0.67]], paveR: [[0.72, 0.6, 0.54], [0.68, 0.58, 0.53]],   // (the slabs: pale, greyer, the brick-red ones of the pavements)
    cover: [[0.52, 0.52, 0.52], [0.57, 0.56, 0.54]],
    lawnL: [[0.5, 0.64, 0.33], [0.54, 0.66, 0.35]], lawnD: [[0.36, 0.52, 0.25], [0.4, 0.55, 0.27]], earth: [[0.56, 0.48, 0.37], [0.6, 0.51, 0.39]],
    clover: [[0.36, 0.54, 0.26], [0.42, 0.58, 0.29]],
  };
  const seoul = ({ scen, noTree, nearCross }) => {
    const T = API.T, { nrGround, nrLC, nrNear } = API, st = { zlebovi: 0, krpe: 0, resetke: 0, plosce: 0, pokrovi: 0, trata: 0, sopi: 0 };
    if (!T || !T.br || !T.wAt || !T.hy || !nrGround || !nrLC || !nrNear || !scen) return st;
    const N = T.px.length, ds = T.ds, R = rng(82101);
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    const own = (x, z, i, sd) => { const q = nrNear(x, z); return q.i >= 0 && Math.abs(q.i - i) * ds < 6 && q.lat * sd > 0; };
    // the road's surface (js/world-seoul.js: the asphalt at +0.02, the lines' paint at +0.034); the verge's top from the kerb to the blocks
    // (vergeRow: +0.05 at w + 0.5, then on the ground, lifted to it)
    const asph = (x, z) => { const q = nrNear(x, z); return q.i >= 0 ? T.hy[q.i] : nrGround(x, z); };
    const top = (x, z) => { const q = nrNear(x, z); return q.i >= 0 ? Math.max(T.hy[q.i] + 0.05, nrGround(x, z) + 0.06) : nrGround(x, z) + 0.06; };
    const step = Math.max(1, Math.round(3 / ds));
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const s = i * ds; if (nearCross(s, 9)) continue;
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], a = (R() - 0.5) * 2.4, r0 = R(), r1 = R(), r2 = R(), r3 = R();
      const [cx, cz] = at(i, sd, w + 1, 0), c = nrLC(cx, cz);
      // the gutter between the edge line (to w - 0.22) and the kerb: short streaks of grit (and leaves under the woods)
      if (r0 < 0.55) { const o = w - 0.1, [x, z] = at(i, sd, o, a);
        if (own(x, z, i, sd)) { streak(scen.get(x, z), asph, x, z, T.tx[i], T.tz[i], 1.2 + R() * 2.6, 0.13 + R() * 0.07, C_(R, c === 1 && R() < 0.6 ? SE.leaf : SE.grit), R, 0.027, 3); st.zlebovi++; } }
      // now and then a patch of newer asphalt in a lane (below the paint)
      if (r1 < 0.035) { const o = w * (0.25 + R() * 0.45), [x, z] = at(i, sd, o, a);
        if (own(x, z, i, sd)) { const col = C_(R, SE.patch, 0.01); slab(scen.get(x, z), asph, x, z, T.tx[i], T.tz[i], 1.4 + R() * 2.8, 0.9 + R() * 1.2, col, [col[0] * 1.06, col[1] * 1.06, col[2] * 1.06], 0.026); st.krpe++; } }
      if (c === 3) {   // the town
        if (r2 < 0.2) { const [x, z] = at(i, sd, w - 0.12, a);   // a drain grate at the kerb's foot (in the gutter, flush)
          if (own(x, z, i, sd)) { const g = scen.get(x, z), col = C_(R, SE.grate, 0.008), dk = [col[0] * 0.82, col[1] * 0.82, col[2] * 0.82];
            slab(g, asph, x, z, T.tx[i], T.tz[i], 0.9, 0.36, dk, col, 0.029); for (let k = -1; k <= 1; k++) slab(g, asph, x + T.tx[i] * k * 0.26, z + T.tz[i] * k * 0.26, T.nx[i], T.nz[i], 0.3, 0.05, col, col, 0.031); st.resetke++; } }
        // the paving's slabs between the kerb and the blocks (where the strip is wider than ~1.4 m)
        const vw = bar - 0.3 - (w + 0.6);
        if (vw > 0.8 && r3 < 0.7) for (let k = 0; k < 2; k++) { const o = w + 0.6 + R() * vw, [x, z] = at(i, sd, o, (R() - 0.5) * 3);
          if (!own(x, z, i, sd) || noTree(x, z)) continue;
          const u = R(), col = C_(R, u < 0.45 ? SE.paveL : u < 0.8 ? SE.paveD : SE.paveR, 0.01), sz = 0.5 + R() * 0.4;
          slab(scen.get(x, z), top, x, z, T.tx[i], T.tz[i], sz * (1 + R()), sz, col, null, 0.012); st.plosce++; }
      } else if (c === 2 || c === 0) {   // the park's lawns and the open grass: clover-green tufts at the blocks' foot
        if (r2 < 0.35 && bar - w > 1.6) { const [x, z] = at(i, sd, bar - 0.45 - R() * 0.25, a);
          if (own(x, z, i, sd) && !noTree(x, z)) { const h = R(); tuft(scen.get(x, z), x, top(x, z) - 0.02, z, 0.22 + h * 0.18, 0.18 + h * 0.18, C_(R, SE.clover, 0.025), R, 5); st.sopi++; } }
      }
    }
    // past the blocks out to ~60 m: in the town the pavement's slabs and the round covers, on the lawns the mown patches and the bare earth
    const slope = (x, z) => { const d = 0.8, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const st2 = Math.max(1, Math.round(3.5 / ds));
    for (let i = 0; i < N; i += st2) for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.7 || nearCross(i * ds, 10)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + 1.2 + Math.pow(r1, 1.3) * 58, [x, z] = at(i, sd, o, (r2 - 0.5) * 3.5), q = nrNear(x, z);
      if (q.i < 0 || Math.abs(q.i - i) * ds > o + 10 || q.dd < 1.0 || q.lat * sd < 0 || noTree(x, z) || slope(x, z) > 0.9 || Math.abs(nrGround(x, z) - T.hy[i]) > 10) continue;
      const c = nrLC(x, z), u = R(), kk = 1 + 0.7 * Math.min(1, (o - bar) / 55), g = scen.get(x, z), gr = (xx, zz) => nrGround(xx, zz);
      if (c === 3) {
        if (u < 0.16) { const col = C_(R, SE.cover, 0.01); disc(g, gr, x, z, 0.32 + R() * 0.1, col, [col[0] * 0.9, col[1] * 0.9, col[2] * 0.9], 0.025, 8); st.pokrovi++; continue; }
        const v = R(), col = C_(R, v < 0.45 ? SE.paveL : v < 0.8 ? SE.paveD : SE.paveR, 0.012), sz = (0.9 + R() * 1.1) * kk;
        slab(g, gr, x, z, T.tx[i], T.tz[i], sz * (1 + R() * 0.8), sz, col, null, 0.03); st.plosce++;
      } else if (c === 2 || c === 0) {
        if (u < 0.15) { soil(scen, gr, x, z, (0.6 + R() * 0.8) * kk, C_(R, SE.earth), R, 0.045); st.trata++; continue; }
        soil(scen, gr, x, z, (1.2 + R() * 1.6) * kk, C_(R, R() < 0.55 ? SE.lawnL : SE.lawnD, 0.012), R, 0.045); st.trata++;
      }
    }
    return st;
  };
  {
    const base = World.ext && World.ext.seoulRob;
    if (World.ext) World.ext.seoulRob = (ctx) => {
      if (base) base(ctx);
      try { if (ctx && ctx.out) ctx.out.robBt82 = seoul(ctx); } catch (e) { console.error('chase-bt82 (seoul):', e); }
    };
  }

  /* ==== Pikes Peak on gravel (js/world-pikes.js: goreRob(ctx, 'pikes', { gH, slope, lc, near }); only for def.id 'pikesg') ==== */
  const PG = {
    loose: [[0.66, 0.56, 0.5], [0.7, 0.6, 0.53]], coarse: [[0.55, 0.47, 0.43], [0.6, 0.5, 0.45]],   // (the loose pink gravel at the edge, the coarser stones)
    granite: [[0.62, 0.5, 0.45], [0.56, 0.47, 0.44]], scree: [[0.58, 0.52, 0.48], [0.62, 0.55, 0.5]],
    pine: [[0.2, 0.3, 0.17], [0.25, 0.34, 0.2]], bristle: [[0.27, 0.33, 0.22], [0.31, 0.36, 0.24]], needle: [[0.4, 0.36, 0.26], [0.43, 0.38, 0.28]],
    cush: [[0.36, 0.4, 0.22], [0.42, 0.44, 0.26]], tundra: [[0.42, 0.4, 0.26], [0.46, 0.42, 0.28]], dry: [[0.6, 0.56, 0.4], [0.66, 0.6, 0.44]],
  };
  const pikesg = (ctx, o) => {
    const T = API.T, out = ctx.out;
    if (!out || !out.matV || !ctx.root || !o || !o.gH || !o.near || !T || !T.br || !T.def || T.def.id !== 'pikesg') return null;
    const gT = o.gH, near = o.near, lc = o.lc, ex = ctx.excluded || (() => false), N = T.px.length, ds = T.ds;
    const slope = o.slope || ((x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); });
    const skip = (c) => c === 3 || c === 4 || c === 5, st = { rob: 0, kamni: 0 };
    const rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const w = T.wAt ? T.wAt(q.i) : T.w, oo = Math.abs(q.lat); return oo < w ? T.hy[q.i] + 0.02 : Math.max(gT(x, z), T.hy[q.i] - 0.02); };
    // the edge: the loose gravel the wheels throw out and the coarser stones in short streaks just inside it
    {
      const R = rng(82201), soft = softScen(ctx.root, out.matV);
      for (let i = 0; i < N; i += Math.max(1, Math.round(3 / ds))) for (const sd of [-1, 1]) {
        const w = T.wAt ? T.wAt(i) : T.w, a = (R() - 0.5) * 2.4, r0 = R(), r1 = R();
        const at = (oo) => [T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a];
        const ok = (x, z) => { const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * ds >= 6 || q.lat * sd <= 0 || ex(x, z)) return false; const c = lc ? lc(x, z) : 0; return !(c === 3); };
        if (r0 < 0.6) { const [x, z] = at(w - 0.15 - R() * 0.2); if (ok(x, z)) { streak(soft.get(x, z), rY, x, z, T.tx[i], T.tz[i], 1.4 + R() * 2.6, 0.25 + R() * 0.25, C_(R, PG.loose), R, 0.012, 3); st.rob++; } }
        if (r1 < 0.3) { const [x, z] = at(w - 0.45 - R() * 0.5); if (ok(x, z)) { streak(soft.get(x, z), rY, x, z, T.tx[i], T.tz[i], 0.8 + R() * 1.4, 0.14 + R() * 0.12, C_(R, PG.coarse, 0.02), R, 0.014, 2); st.kamni++; } }
      }
      soft.done();
    }
    // past the barrier line from ~1.5 to ~60 m: what stands on the ground
    const R = rng(82202), soft = softScen(ctx.root, out.matV), pas = {};
    for (let i = 0; i < N; i += Math.max(1, Math.round(4 / ds))) for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.7) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], oo = bar + 1.5 + Math.pow(r1, 1.25) * 58.5, a = (r2 - 0.5) * 4;
      const x = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * ds > oo + 10 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0 || ex(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - 18)) continue;
      const sl = slope(x, z); if (sl > 1.4) continue;
      const c = lc ? lc(x, z) : 0; if (skip(c)) continue;
      const u = R(), h = R(), kk = 1.1 + 0.9 * Math.min(1, (oo - bar) / 55), g = soft.get(x, z); let kind;
      if (sl > 0.75) {   // the steeper slopes: the scree's patches and the granite's blocks
        if (u < 0.5) { cushion(g, x, y + 0.04, z, (0.3 + h * 0.55) * kk, 0.22 + h * 0.3, C_(R, PG.granite, 0.02), R); kind = 'bloki'; }
        else { soil(soft, gT, x, z, (1.0 + R() * 1.3) * kk, C_(R, PG.scree, 0.02), R, 0.06); kind = 'grusc'; }
      } else if (c === 1 || c === 2) {   // under and between the trees: the needle litter, low pines, a boulder now and then
        if (u < 0.3) { soil(soft, gT, x, z, (0.7 + R() * 0.9) * kk, C_(R, PG.needle), R, 0.05); kind = 'iglice'; }
        else if (u < 0.75) { cushion(g, x, y, z, (0.5 + h * 0.6) * kk, 0.45 + h * 0.5, C_(R, R() < 0.6 ? PG.pine : PG.bristle, 0.02), R); kind = 'bori'; }
        else { cushion(g, x, y + 0.04, z, (0.35 + h * 0.5) * kk, 0.25 + h * 0.3, C_(R, PG.granite, 0.02), R); kind = 'skale'; }
      } else {   // the open ground and the tundra: low cushions, dry tufts, the granite's boulders
        if (u < 0.3) { cushion(g, x, y, z, (0.3 + h * 0.35) * kk, 0.14 + h * 0.12, C_(R, R() < 0.6 ? PG.cush : PG.tundra, 0.02), R); kind = 'blazine'; }
        else if (u < 0.58) { tuft(g, x, y, z, (0.25 + h * 0.25) * kk, 0.25 + h * 0.3, C_(R, PG.dry, 0.03), R, 5); kind = 'sopi'; }
        else if (u < 0.78) { cushion(g, x, y + 0.04, z, (0.3 + h * 0.6) * kk, 0.22 + h * 0.35, C_(R, PG.granite, 0.02), R); kind = 'skale'; }
        else { soil(soft, gT, x, z, (0.8 + R() * 1.0) * kk, C_(R, R() < 0.5 ? PG.tundra : PG.scree), R, 0.055); kind = 'zaplate'; }
      }
      pas[kind] = (pas[kind] || 0) + 1;
    }
    soft.done();
    st.pas = pas;
    return st;
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'pikes' && o && ctx && ctx.out) try { const s = pikesg(ctx, o); if (s) { ctx.out.robBt82 = s.rob; ctx.out.pasBt82 = s.pas; } } catch (e) { console.error('chase-bt82 (pikesg):', e); }
      return r;
    };
    Object.assign(f, base);   // (pkLC, LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
