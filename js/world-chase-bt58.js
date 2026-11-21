/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fifty-eighth group of the real tracks: Gudauri and Montréal, a
   second pass on two tracks whose ground the earlier groups set only near the road (js/world-chase-bt25.js: Gudauri's bank to 8 m;
   js/world-chase-bt18.js: Montréal's bands to ~24 m). From behind the car Gudauri's slopes past ~8 m stood in one even yellow sheet where
   the real late-summer pass (docs/proge/gudauri.md: Sentinel-2, 31. 8. 2025; ESA WorldCover) is a patchwork of short green pasture,
   yellowing straw, grey scree on the steep parts and low dark cushions of rhododendron and juniper; Montréal's island (docs/proge/
   montreal.md) is a mown park, whose lawn read as one flat green past the near bands: here the mower's lighter and darker patches, the
   leaf litter under the trees and a few low tufts by them. On both a band out to ~55 m past the barrier, thinning with the distance;
   nothing on steep rock (slope over maxSl), far below the road, where another leg's road is nearer, in the builders' excluded places, on
   Montréal's roads, paths, car parks, plazas, pitches, beach, water and junction legs (its land cover and its own bad()). All of it in
   meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  /* the lateral offset of (x, z) at the nearest sample, whatever the track's own near() gives */
  const latOf = (T, near) => { const q2 = { i: -1, lat: 0 }; return (x, z) => { const q = near(x, z); q2.i = q.i;
    q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; }; };

  /* every `step` m on both sides `n` tries between `from` m past the barrier and `reach` m (denser near); each a patch, a cushion or a
     tuft by C.pick(R, d, s, x, z); C.skip(x, z) leaves a place out */
  const band = (root, matV, excluded, o, seed, C) => {
    const T = API.T, st = { zaplate: 0, grmi: 0, sopi: 0 }, gT = o.gH;
    if (!T || !T.br || !o.near || !gT || !root || !matV) return st;
    const near = latOf(T, o.near), R = rng(seed), soft = softScen(root, matV), N = T.px.length;
    const bad = (x, z) => (excluded && excluded(x, z)) || (o.bad && o.bad(x, z)) || (C.skip && C.skip(x, z));
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const x = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > oo + 10) continue;
        const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + C.from * 0.7) continue;   // (another leg nearer, or inside a barrier)
        if (bad(x, z)) continue;
        const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
        const P = C.pick(R, oo - bar, s, x, z), h = R(); if (!P) continue;
        if (P.k === 'p') { soil(soft, gT, x, z, P.r, P.col, R, 0.05); st.zaplate++; }
        else if (P.k === 'g') { cushion(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.5), P.h * (0.8 + h * 0.5), P.col, R); st.grmi++; }
        else { tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, 5); st.sopi++; }
      }
    }
    soft.done();
    return st;
  };

  /* Gudauri: docs/proge/gudauri.md (late summer): alpine pasture and meadow, patches of shrubs (rhododendron, juniper; under 3.5 m by
     the canopy-height map), scree and rock on the steep parts. The colours of js/world-chase-bt25.js: the short green pasture, the
     yellowing straw, the grey shale; the shrubs low and dark, mostly on the gentler slopes away from the road. */
  const GD = { step: 3.4, n: 3, from: 6, reach: 58, pw: 1.25, drop: 18, rise: 45, maxSl: 1.3,
    keep: (d) => d < 20 ? 0.85 : 0.6,
    pick: (R, d, s) => { const r = R();
      if (s > 0.75) return r < 0.7 ? { k: 'p', r: 1.2 + R() * 2.4, col: vary(mix3([0.5, 0.49, 0.46], [0.55, 0.53, 0.49], R()), R, 0.015) } : null;   // (scree on the steep parts)
      if (r < 0.52) return { k: 'p', r: 1.6 + R() * (d < 15 ? 2.2 : 4), col: R() < 0.65 ? vary(mix3([0.4, 0.47, 0.23], [0.45, 0.5, 0.26], R()), R, 0.015) : vary(mix3([0.5, 0.49, 0.32], [0.53, 0.51, 0.34], R()), R, 0.015) };   // (green pasture, straw)
      if (r < 0.6) return { k: 'p', r: 0.9 + R() * 1.6, col: vary(mix3([0.5, 0.49, 0.46], [0.55, 0.53, 0.49], R()), R, 0.015) };   // (bare shale)
      if (r < 0.76) return { k: 't', w: 0.32, h: 0.4, col: vary(mix3([0.58, 0.55, 0.34], [0.64, 0.6, 0.38], R()), R, 0.025) };   // (yellowing tufts)
      return { k: 'g', w: d < 15 ? 0.7 : 1.0, h: 0.45, col: vary(mix3([0.26, 0.34, 0.19], [0.3, 0.36, 0.24], R()), R, 0.02) }; } };   // (rhododendron, juniper)

  /* Montréal: docs/proge/montreal.md: the island a mown park, trees in groups. The lawn's colours of js/world-chase-bt18.js (gr, gr2):
     the mower's lighter and darker patches, wide and flat; under and by the trees (land cover 1) the leaf litter and low shrubs. Nothing
     on the built ground, water, sand, car parks, pitches, plazas (land cover 2, 3, 4, 5, 7, 8). */
  const MT_OFF = { 2: 1, 3: 1, 4: 1, 5: 1, 7: 1, 8: 1 };
  const mtLook = (lc) => ({ step: 3.6, n: 2, from: 2.5, reach: 55, pw: 1.3, drop: 6, rise: 12, maxSl: 0.5,
    keep: (d) => d < 15 ? 0.8 : 0.55,
    skip: (x, z) => !!MT_OFF[lc(x, z)],
    pick: (R, d, s, x, z) => { const r = R(), tr = lc(x, z) === 1;
      if (tr) { if (r < 0.55) return { k: 'p', r: 1.0 + R() * 2.2, col: vary(mix3([0.44, 0.36, 0.23], [0.48, 0.38, 0.24], R()), R, 0.015) };   // (leaf litter)
        return { k: 'g', w: 0.8, h: 0.6, col: vary(mix3([0.28, 0.42, 0.2], [0.34, 0.46, 0.22], R()), R, 0.02) }; }   // (shrubs by the trees)
      if (r < 0.88) return { k: 'p', r: 2.2 + R() * (d < 12 ? 2 : 4.5), col: R() < 0.5 ? vary(mix3([0.47, 0.62, 0.31], [0.5, 0.64, 0.33], R()), R, 0.012) : vary(mix3([0.32, 0.47, 0.2], [0.35, 0.5, 0.22], R()), R, 0.012) };   // (mown lighter, darker)
      return { k: 't', w: 0.26, h: 0.28, col: vary(mix3([0.4, 0.56, 0.26], [0.47, 0.6, 0.3], R()), R, 0.02) }; } });   // (an unmown tuft)

  const LK = API.PL_LOOK;
  if (LK && LK.gudauri) chain(LK.gudauri, (ctx) => {
    const gT = API.caGround || API.vrGround, near = API.vrNear;
    if (ctx.out) ctx.out.robBt58 = band(ctx.root, ctx.matV || (ctx.out && ctx.out.matV), ctx.excluded, { gH: gT, near }, 58201, GD);
  });

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      try {
        if (id === 'montreal' && ctx.out && o && o.lc) ctx.out.robBt58 = band(ctx.root, ctx.out.matV, ctx.excluded, o, 58202, mtLook(o.lc));
      } catch (e) { console.error('chase-bt58 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);
    World.ext.goreRob = f;
  }
})();
