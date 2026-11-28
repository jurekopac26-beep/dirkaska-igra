/* =========================================================================
   WORLD — Pikes Peak on its historic gravel road ('pikesg', js/tracks/pikesg.js): its own roadside plants, from the place itself
   (docs/proge/pikesg.md, »Kraj«). Until 2011 the graders kept the Highway's pink granite gravel (grus of the Pikes Peak granite) loose,
   and every car left a cloud of it on the plants beside the road; the summer storms washed the gravel off the road down the slopes.
   So, along the road on its own builder's ground (js/world-pikes.js: goreRob(ctx, 'pikes', { gH, slope, lc, near })), only for def.id 'pikesg':
     - below the treeline (land cover 1 forest, 2 the treeline band): low common juniper mounds, kinnikinnick mats and shrubby cinquefoil,
       powdered with the road's pinkish grey dust, heavier by the road, fading out by ~20 m;
     - above it (0, the alpine tundra): moss campion cushions and sedge tufts among the bare grus, dusted near the road;
     - below the road where the slope falls away: fans of the washed-off gravel (the erosion that had the road paved), every ~70 m.
   Nothing on the snow (5), the bare steep granite (4), built ground or where another leg's road is nearer. All of it in one soft scene
   (256 m chunks, no shadow: one draw call per chunk in view). Pikes Peak on asphalt ('pikes') stays as it is; the driving stays.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, TAU } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, cushion, softScen, mix3 } = BT;
  const tau = TAU || Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // the colours: the plants' own and the road's dust (the gravel's pinkish grey, as the road's material: js/world-pikes.js, gMat)
  const C = {
    dust: [0.66, 0.58, 0.53],
    juniper: [[0.17, 0.25, 0.16], [0.22, 0.3, 0.19]],          // common juniper: dark blue-green mounds
    kinni: [[0.24, 0.3, 0.15], [0.32, 0.33, 0.17]],            // kinnikinnick (bearberry): a glossy green mat, reddish in places
    cinque: [[0.36, 0.4, 0.22], [0.44, 0.45, 0.25]],           // shrubby cinquefoil: grey-green, small yellow flowers in July
    campion: [[0.3, 0.38, 0.2], [0.36, 0.42, 0.24]],           // moss campion: a tight bright cushion (pink flowers in early summer)
    sedge: [[0.45, 0.43, 0.28], [0.52, 0.48, 0.32]],           // the tundra's sedges and grasses, dry tips
    grus: [[0.6, 0.5, 0.45], [0.66, 0.56, 0.5]],               // the washed-off gravel
  };
  const dusted = (R, pair, d) => { const c = vary(mix3(pair[0], pair[1], R()), R, 0.02); return mix3(c, C.dust, clamp(d, 0, 0.7)); };

  const build = (ctx, o) => {
    const T = API.T;
    if (!ctx.out || !ctx.root || !ctx.out.matV || !o || !o.gH || !o.near || !T || !T.br || !T.def || T.def.id !== 'pikesg') return;
    const gH = o.gH, near = o.near, lc = o.lc || (() => 1), bad = ctx.excluded || (() => false);
    const R = rng(64701), soft = softScen(ctx.root, ctx.out.matV), N = T.px.length, st = { brin: 0, medvednica: 0, petoprstnik: 0, blazinice: 0, sasi: 0, vrsaji: 0 };
    const slope = (x, z) => { const a = gH(x + 1, z) - gH(x - 1, z), b = gH(x, z + 1) - gH(x, z - 1); return Math.hypot(a, b) / 2; };
    const mine = (x, z, i, sd, bar) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * T.ds < 14 + Math.abs(q.lat) && Math.abs(q.lat) > bar + 0.3 && q.lat * sd > 0 && !bad(x, z); };
    const pos = (i, sd, off, a) => [T.px[i] + T.nx[i] * sd * off + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * off + T.tz[i] * a];
    const step = Math.max(1, Math.round(7 / T.ds));
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      // the plants: two places a side every ~7 m, from the barrier line out to ~22 m, more of them near the road (where the verge is open)
      for (let k = 0; k < 2; k++) {
        const r0 = R(), r1 = R(), r2 = R(), r3 = R(); if (r0 > 0.6) continue;
        const off = bar + 0.6 + r1 * r1 * 21, [x, z] = pos(i, sd, off, (r2 - 0.5) * 7);
        if (!mine(x, z, i, sd, bar)) continue;
        const y = gH(x, z); if (!(y > T.hy[i] - 4) || slope(x, z) > 1.1) continue;
        const c = lc(x, z); if (c === 3 || c === 4 || c === 5) continue;
        const d = 0.62 * Math.exp(-(off - bar) / 7);   // the dust on the leaves: heavy by the road, gone by ~20 m
        const g = soft.get(x, z);
        if (c === 1 || c === 2) {
          if (r3 < 0.45) { const s = 0.5 + R() * 0.7; cushion(g, x, y, z, s, s * (c === 2 ? 0.35 : 0.5), dusted(R, C.juniper, d), R); st.brin++; }
          else if (r3 < 0.75) { soil(soft, gH, x, z, 0.5 + R() * 0.6, dusted(R, C.kinni, d * 0.8), R, 0.04); st.medvednica++; }
          else { const s = 0.3 + R() * 0.25; tuft(g, x, y, z, s, s * 1.3, dusted(R, C.cinque, d), R, 6); st.petoprstnik++; }
        } else {
          if (r3 < 0.5) { const s = 0.18 + R() * 0.2; cushion(g, x, y, z, s, s * 0.32, dusted(R, C.campion, d * 0.7), R); st.blazinice++; }
          else { const s = 0.14 + R() * 0.12; tuft(g, x, y, z, s, s * 1.8, dusted(R, C.sedge, d * 0.6), R, 5); st.sasi++; }
        }
      }
      // a fan of washed-off gravel below the road, where the ground at ~6 m out lies well under it (every ~70 m a side, at random)
      if (R() < 0.1) {
        const [x0, z0] = pos(i, sd, bar + 1.5, 0), [x1, z1] = pos(i, sd, bar + 7, 0);
        if (!mine(x0, z0, i, sd, bar) || gH(x1, z1) > T.hy[i] - 2 || lc(x1, z1) === 5) continue;
        const L = 7 + R() * 9;
        for (let q = 0; q < 6; q++) {
          const t = q / 5, w = 0.8 + t * 3.2, off = bar + 1.2 + t * L, [x, z] = pos(i, sd, off, (R() - 0.5) * w);
          if (!mine(x, z, i, sd, bar)) break;
          soil(soft, gH, x, z, 0.7 + t * 1.6, mix3(vary(mix3(C.grus[0], C.grus[1], R()), R, 0.015), C.dust, 0.25), R, 0.05);
        }
        st.vrsaji++;
      }
    }
    soft.done();
    ctx.out.pikesgRastje = st;
  };

  const base = World.ext.goreRob;
  const f = function (ctx, id, o) {
    const r = base.call(this, ctx, id, o);
    if (id === 'pikes') try { build(ctx, o); } catch (e) { console.error('world-pikesg:', e); }
    return r;
  };
  Object.assign(f, base);
  World.ext.goreRob = f;
})();
