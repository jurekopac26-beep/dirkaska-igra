/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fiftieth group of the real tracks (the second pass): Killar and
   Ngorongoro, both on Vršič's corridor with a ground of their own and both calling World.ext.goreRob (js/world-chase-bt11.js) as the
   build's last step (Killar js/world-killar.js, Ngorongoro js/world-ngorongoro.js after its animals). The first pass (js/world-chase-bt13.js,
   js/world-chase-bt20.js) put tufts and cushions behind the barrier line; from the camera the ground under them still read as one even
   green. So, chained after goreRob for these two ids only: on the strip from the asphalt's edge to the barrier (or to 3 m where there is
   none) the shoulder's grit, dust and dry grass in low patches and a few tufts at its outer edge; past it to ~12 m the dry slope's own
   patches (straw, olive grass, bare earth, scree), more tufts and low shrubs; out to ~55 m a sparse band of wide patches, only where the
   ground there is not far below the road (nothing over the drop, on the cliffs or in a valley under a fill). All of it in one mesh set of
   its own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers, the animals and the driving stay. Colours follow
   docs/proge/<id>.md, all mid tones (nothing dark).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;

  /* Killar: docs/proge/killar.md: »en sam pas makadama na polici … suha olivna in slamnata pobočja, sivo rjav skrilavec in gnajs …
     melišča«, the grey-brown dust behind the cars. The shoulder: the track's grey-brown grit spread off the gravel, pale dust and dry straw
     grass in patches, straw tufts at its edge. The slope: straw and olive grass, the grey-brown slate's fallen grit and the scree's paler
     stones in patches, olive-straw tufts, low grey-green shrubs. Nothing on snow (class 6), in the villages (3) or on the steep faces. */
  const KIL = { seed: 50101, dim: 0.8, cls: (c) => c !== 3 && c !== 5 && c !== 6,
    V: { share: 0.75, foot: 0.45, reach: 3,
      patch: (R) => { const r = R();
        return r < 0.45 ? { col: vary(mix3([0.56, 0.51, 0.43], [0.6, 0.55, 0.46], R()), R, 0.015), r: 0.7 + R() * 0.9 }   // (grey-brown grit off the gravel)
          : r < 0.75 ? { col: vary(mix3([0.66, 0.6, 0.47], [0.69, 0.63, 0.5], R()), R, 0.015), r: 0.6 + R() * 0.8 }   // (pale dust)
          : { col: vary(mix3([0.64, 0.58, 0.38], [0.6, 0.56, 0.36], R()), R, 0.015), r: 0.7 + R() * 0.8 }; },   // (dry straw grass)
      tuft: (R) => vary(mix3([0.66, 0.59, 0.4], [0.5, 0.5, 0.3], R() * 0.7), R, 0.03) },
    B: { n: 2, reach: 10, share: 0.5, maxSl: 0.95, sl: 0.6, bushShare: 0.22,
      patch: (R) => { const r = R();
        return r < 0.35 ? { col: vary(mix3([0.64, 0.58, 0.38], [0.6, 0.55, 0.36], R()), R, 0.015), r: 1.0 + R() * 1.3 }   // (straw grass)
          : r < 0.6 ? { col: vary(mix3([0.5, 0.5, 0.31], [0.54, 0.53, 0.33], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (olive grass)
          : r < 0.85 ? { col: vary(mix3([0.5, 0.48, 0.44], [0.54, 0.51, 0.46], R()), R, 0.015), r: 0.8 + R() * 1.1 }   // (fallen slate grit)
          : { col: vary([0.6, 0.57, 0.52], R, 0.015), r: 0.9 + R() * 1.2 }; },   // (scree's pale stones)
      tuft: (R) => vary(mix3([0.66, 0.59, 0.4], [0.48, 0.49, 0.29], R()), R, 0.03),
      bush: (R) => vary(mix3([0.42, 0.45, 0.33], [0.46, 0.48, 0.35], R()), R, 0.025) },
    F: { step: 7, share: 0.4, from: 8, to: 55, drop: 6, maxSl: 0.85,
      patch: (R, o) => { const r = R(), k = 1 + 0.45 * (o - 8) / 47;   // (farther out wider, so they still read from the road)
        return r < 0.45 ? { col: vary(mix3([0.64, 0.58, 0.38], [0.6, 0.55, 0.36], R()), R, 0.015), r: (1.4 + R() * 1.4) * k }   // (straw grass)
          : r < 0.75 ? { col: vary(mix3([0.5, 0.5, 0.31], [0.54, 0.53, 0.33], R()), R, 0.015), r: (1.4 + R() * 1.3) * k }   // (olive grass)
          : { col: vary(mix3([0.52, 0.5, 0.45], [0.58, 0.55, 0.5], R()), R, 0.015), r: (1.1 + R() * 1.1) * k }; } } };   // (slate and scree)

  /* Ngorongoro: docs/proge/ngorongoro.md: »grobe sivo-rjave kamnite kocke z rdečim prahom v fugah … bankina do jarka«, the dry season's
     yellow-brown grass, the red-brown volcanic soil bare in patches, greener by the streams. The shoulder: the red dust off the setts, the
     murram's red-brown earth and the grey-brown grit, tawny tufts at its edge. The slope: tawny and straw grass, the red soil bare, a
     greener patch where the map has the streams' margins (class 6, its own colour), tufts and the dark-ish (mid) shrubs' cushions. Nothing
     on the built ground (3), water (5), steep rock, in the stream beds or where the animals are (the builder's o.bad). */
  const NGO = { seed: 50201, dim: 0.8, cls: (c) => c !== 3 && c !== 5,
    V: { share: 0.75, foot: 0.45, reach: 3,
      patch: (R) => { const r = R();
        return r < 0.45 ? { col: vary(mix3([0.6, 0.42, 0.3], [0.63, 0.45, 0.32], R()), R, 0.015), r: 0.7 + R() * 0.9 }   // (red dust off the setts)
          : r < 0.75 ? { col: vary(mix3([0.56, 0.5, 0.42], [0.6, 0.53, 0.44], R()), R, 0.015), r: 0.6 + R() * 0.8 }   // (grey-brown grit)
          : { col: vary(mix3([0.64, 0.55, 0.36], [0.6, 0.52, 0.33], R()), R, 0.015), r: 0.7 + R() * 0.8 }; },   // (tawny grass)
      tuft: (R) => vary(mix3([0.6, 0.5, 0.3], [0.68, 0.61, 0.39], R()), R, 0.03) },
    B: { n: 2, reach: 10, share: 0.5, maxSl: 1.0, sl: 0.6, bushShare: 0.25, wet: [0.42, 0.5, 0.24],
      patch: (R) => { const r = R();
        return r < 0.4 ? { col: vary(mix3([0.6, 0.5, 0.3], [0.64, 0.54, 0.33], R()), R, 0.015), r: 1.0 + R() * 1.3 }   // (tawny grass)
          : r < 0.65 ? { col: vary(mix3([0.67, 0.6, 0.39], [0.7, 0.62, 0.41], R()), R, 0.015), r: 1.0 + R() * 1.2 }   // (straw)
          : { col: vary(mix3([0.55, 0.37, 0.26], [0.58, 0.4, 0.28], R()), R, 0.015), r: 0.8 + R() * 1.1 }; },   // (red-brown soil)
      tuft: (R) => vary(mix3([0.6, 0.5, 0.3], [0.68, 0.61, 0.39], R()), R, 0.03),
      bush: (R) => vary(mix3([0.3, 0.36, 0.2], [0.34, 0.38, 0.22], R()), R, 0.025) },
    F: { step: 7, share: 0.4, from: 8, to: 55, drop: 8, maxSl: 0.9, wet: [0.42, 0.5, 0.24],
      patch: (R, o) => { const r = R(), k = 1 + 0.45 * (o - 8) / 47;
        return r < 0.45 ? { col: vary(mix3([0.6, 0.5, 0.3], [0.64, 0.54, 0.33], R()), R, 0.015), r: (1.4 + R() * 1.4) * k }   // (tawny grass)
          : r < 0.75 ? { col: vary(mix3([0.67, 0.6, 0.39], [0.7, 0.62, 0.41], R()), R, 0.015), r: (1.4 + R() * 1.3) * k }   // (straw)
          : { col: vary(mix3([0.55, 0.37, 0.26], [0.58, 0.4, 0.28], R()), R, 0.015), r: (1.1 + R() * 1.1) * k }; } } };   // (red-brown soil)

  const CFG = { killar: KIL, ngorongoro: NGO };

  /* the three rows for one track, in one softScen; o: goreRob's own options (the track's ground, slope, nearest leg, land cover, bad) */
  const add = (ctx, C, o) => {
    const T = API.T, st = { rob: 0, robSopi: 0, breg: 0, bregSopi: 0, bregGrmi: 0, pas: 0 };
    const gH = o.gH || API.vrGround, slope = o.slope || API.vrSlope, near = o.near || API.vrNear, lc = o.lc || API.vrLC, water = o.lc ? o.water : API.vrWater;
    if (!T || !T.br || !T.wAt || !gH || !slope || !near || !lc || !ctx.root || !ctx.out || !ctx.out.matV) return st;
    const ex = ctx.excluded || (() => false);
    const bad = (x, z) => ex(x, z) || (o.bad && o.bad(x, z)) || (water && water(x, z).e > -1) || !C.cls(lc(x, z));
    const R = rng(C.seed), soft = softScen(ctx.root, ctx.out.matV), N = T.px.length, step = Math.max(1, Math.round(3 / T.ds));
    /* the verge's own height (the road mesh's shoulder, a little above the ground: as js/world-chase-bt43.js), so the shoulder's patches
       lie on it and not under it */
    const prof = (i, o2, side) => { const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i];
      const P = [[w, 0], [w + 0.8, -0.04], [Math.max(w + 1.2, bar - 0.3), -0.08], [bar + 0.8, -0.16], [bar + 3.2, -0.4]];
      if (o2 <= P[0][0]) return 0; for (let k = 1; k < P.length; k++) if (o2 <= P[k][0]) { const t = (o2 - P[k - 1][0]) / Math.max(0.01, P[k][0] - P[k - 1][0]); return P[k - 1][1] + (P[k][1] - P[k - 1][1]) * t; }
      return null; };
    const gV = (x, z) => { const q = near(x, z), g = gH(x, z); if (q.i < 0) return g; const h = prof(q.i, Math.abs(q.lat), q.lat < 0 ? -1 : 1);
      return h == null ? g : Math.max(T.hy[q.i] + h, g + 0.06) - 0.02; };
    const dim = (P) => ({ col: [P.col[0] * C.dim, P.col[1] * C.dim, P.col[2] * C.dim], r: P.r });   // (the flat patches face the sun: a shade under the plants' colours, so they lie in the ground)
    const own = (x, z, i, lo, hi) => { const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 12) return false; const a = Math.abs(q.lat); return a > lo && a < hi; };
    const wetCol = (P, B, x, z) => (B.wet && lc(x, z) === 6 ? { col: vary(B.wet, R, 0.015), r: P.r } : P);   // (by the streams the greener grass)
    const { V, B, F } = C;
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + 0.5, e1 = Math.min(bar - 0.3, w + V.reach), hy = T.hy[i];
      const at = (o2, a) => [T.px[i] + T.nx[i] * sd * o2 + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o2 + T.tz[i] * a];
      if (e1 - e0 > 0.5) {   // the shoulder from the asphalt's edge to the barrier (or 3 m)
        const r0 = R(), r1 = R(), r2 = R(), r3 = R();
        if (r0 < V.share) { const o2 = e0 + r1 * (e1 - e0), [x, z] = at(o2, (R() - 0.5) * 2), P = dim(V.patch(R)), rr = Math.min(P.r, Math.max(0.35, (e1 - e0) * 0.6));
          const y = gV(x, z); if (own(x, z, i, w + 0.3, bar) && !bad(x, z) && y > hy - 1.2 && y < hy + 1.2) { soil(soft, gV, x, z, rr, P.col, R, 0.04); st.rob++; } }
        if (r2 < V.foot) for (let k = 0, n = 1 + Math.floor(r3 * 3); k < n; k++) { const [x, z] = at(e1 - 0.1 - R() * 0.5, (R() - 0.5) * 2.6);
          if (!own(x, z, i, w + 0.5, bar) || bad(x, z)) continue; const y = gV(x, z); if (!(y > hy - 1.2)) continue;
          const h = R(); tuft(soft.get(x, z), x, y, z, 0.22 + h * 0.16, 0.26 + h * 0.24, V.tuft(R), R, 5); st.robSopi++; }
      }
      for (let k = 0; k < B.n; k++) {   // the slope past it, to ~12 m
        const r0 = R(), r1 = R(), r2 = R(), r3 = R(), o2 = Math.max(bar, w + V.reach) + 0.4 + Math.pow(r1, 1.3) * B.reach, [x, z] = at(o2, (r2 - 0.5) * 3);
        if (!own(x, z, i, Math.min(bar, w + V.reach), 1e9) || bad(x, z)) continue;
        const sl = slope(x, z), y = gV(x, z); if (sl > B.maxSl || !(y > hy - 1.5)) continue;
        if (r0 < B.share) { const P = dim(wetCol(B.patch(R), B, x, z)); soil(soft, gV, x, z, P.r, P.col, R, 0.05); st.breg++; }
        else if (sl < B.sl && r3 < B.bushShare) { const h = R(); cushion(soft.get(x, z), x, y, z, 0.45 + h * 0.45, 0.3 + h * 0.3, B.bush(R), R); st.bregGrmi++; }
        else { const h = R(); tuft(soft.get(x, z), x, y, z, 0.26 + h * 0.2, 0.32 + h * 0.3, B.tuft(R), R, 5); st.bregSopi++; }
      }
    }
    for (let i = 0; i < N; i += Math.max(1, Math.round(F.step / T.ds))) for (const sd of [-1, 1]) {   // the sparse outer band to ~55 m
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > F.share) continue;
      const bar = Math.max(sd > 0 ? T.br[i] : T.bl[i], T.wAt(i) + V.reach), o2 = bar + F.from + r1 * (F.to - F.from), a = (r2 - 0.5) * F.step;
      const x = T.px[i] + T.nx[i] * sd * o2 + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o2 + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > o2 + 10) continue;   // (another leg's road is nearer: its own band)
      if (bad(x, z)) continue;
      const y = gH(x, z); if (!(y > T.hy[i] - F.drop) || slope(x, z) > F.maxSl) continue;
      const P = dim(wetCol(F.patch(R, o2), F, x, z)); soil(soft, gH, x, z, P.r, P.col, R, 0.06); st.pas++;
    }
    soft.done();
    for (const g of ctx.root.children) if (g.isGroup) for (const m of g.children) if (m.userData.rob && m.name === 'rob') m.castShadow = false;   // (flat patches and knee-high plants: no shadow pass)
    return st;
  };

  /* goreRob chained for these two ids (LOOK and the other properties stay the same objects); what is added counts in out.stats.rob.bt50 */
  const base = World.ext.goreRob;
  const f = function (ctx, id, o) {
    let r = base.call(this, ctx, id, o);
    if (CFG[id]) try { r = r || {}; r.bt50 = add(ctx, CFG[id], o || {}); if (ctx.out) ctx.out.rob = r; } catch (e) { console.error('chase-bt50 (' + id + '):', e); }
    return r;
  };
  Object.assign(f, base);   // (LOOK, pkLC, hjLC and whatever else the earlier groups hang on it: Pikes and Harju call goreRob only when theirs is there)
  World.ext.goreRob = f;
})();
