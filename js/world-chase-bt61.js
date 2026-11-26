/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixty-first group of the real tracks: Harju and Katu-Yaryk, a
   third pass on the two roads whose ground the nineteenth and thirty-sixth groups (Harju: js/world-chase-bt19.js, js/world-chase-bt36.js)
   and the fourteenth and thirty-first groups (Katu: js/world-chase-bt14.js, js/world-chase-bt31.js) already set. From behind the car the
   ground past their last band was still one smooth face up to the horizon: in Harju past the earlier strips the park's lawns and the pine litter on the
   ridge, on Katu past ~14 m the steppe slopes above the road and the schist faces falling to the canyon. So here a far band out to ~55-60 m.
   Harju (docs/proge/harju.md: the old Scots pines on the gravel ridge, their needles, moss, the pale sand, bilberry and heather, the mown
   lawns): from 22 to 55 m (nearer than ~40 m the park's other legs of road leave little room) wide low patches of the lawn in its lighter and darker stripes, under the pines the needle litter, the moss and
   the ridge's bare sand, in the wetland the wet moss; never on the paved, built or sports ground (hjLC 3) or in the builder's excluded places.
   Katu (docs/proge/katu.md: »sončna pobočja so suha stepa z grmi karagane in brinom«, »strma pobočja so skalnata (rjavo siv skrilavec)«, the
   larches on the shady slopes): from 13 to 60 m on the gentle ground the steppe's straw grass and bare grit in wide patches with fescue's
   tufts, by the shrubs (land cover 2) their darker olive ground, in the larch wood (1) the moss and the fallen needles, on the steep faces
   (where the earlier bands left the slope one smooth brown) the schist in grey-brown, rusty and darker patches; never on the camps (3),
   in the water (5), by the river or where the ground lies far below the road (the canyon under the traverse).
   All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, sstep } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.mix3 || !vary || !rng) return;
  const { soil, tuft, softScen, mix3 } = BT;
  const mute = (c, g, f) => { const l = (c[0] + c[1] + c[2]) / 3; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const noise = (x, z, a, b) => { const P = API.NR; return P && sstep ? sstep(0.35, 0.7, P.n3(x * 0.05 + a, z * 0.05 + b)) : 0.5; };

  /* the far band: every C.step m along the road on both sides a place from C.from to C.to m past the barrier line; only where this leg's
     road is the nearest, not in ex/bad, the ground not more than C.drop m below the road and its slope under C.maxSl; C.each(...) lays it */
  const band = (ctx, o, C) => {
    const T = API.T, near = o.near, gT = o.gH, st = { pas: 0, sopi: 0, skala: 0, near: 0, ex: 0, drop: 0, sl: 0 };
    if (!T || !T.br || !near || !gT || !ctx.root || !ctx.out || !ctx.out.matV) return st;
    const R = rng(C.seed), soft = softScen(ctx.root, ctx.out.matV), N = T.px.length, ex = ctx.excluded || (() => false);
    const slope = o.slope || ((x, z) => { const d = 1.2; return Math.hypot(gT(x + d, z) - gT(x - d, z), gT(x, z + d) - gT(x, z - d)) / (2 * d); });
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], off = bar + C.from + Math.pow(r1, C.pow || 1) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * off + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * off + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > off + 10 || Math.abs(q.lat) < bar + C.from - 1) { st.near++; continue; }   // (another leg's road is nearer)
      if (ex(x, z) || (o.bad && o.bad(x, z))) { st.ex++; continue; }
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop)) { st.drop++; continue; }
      const sl = slope(x, z); if (!(sl < C.maxSl)) { st.sl++; continue; }
      const k = 1 + 0.5 * (off - bar - C.from) / (C.to - C.from);   // (wider further out: the same share of the picture)
      C.each(soft, gT, x, y, z, sl, k, R, st);
    }
    soft.done();
    return st;
  };

  /* Harju: hjLC 0 lawn, 1 under the pines, 2 wetland, 3 paved, built or sports ground */
  const HJ = { lawn: [0.36, 0.45, 0.19], lawn2: [0.52, 0.55, 0.3], needle: [0.46, 0.39, 0.26], sand: [0.62, 0.58, 0.46], moss: [0.37, 0.43, 0.22], heath: [0.48, 0.41, 0.35], wet: [0.36, 0.42, 0.21] };
  const harju = (ctx, o) => {
    const lc = o.lc; if (!lc) return null;
    return band(ctx, o, { seed: 61101, step: 2.0, share: 0.95, from: 22, to: 55, pow: 1.3, drop: 6, maxSl: 1.0,
      each: (soft, gT, x, y, z, sl, k, R, st) => {
        const c = lc(x, z); if (c === 3) return;
        const r = R(); let col;
        if (c === 2) col = HJ.wet;
        else if (c === 1) col = r < 0.45 ? HJ.needle : r < 0.68 ? HJ.moss : r < 0.86 ? HJ.sand : HJ.heath;
        else col = mix3(HJ.lawn, HJ.lawn2, Math.min(1, noise(x, z, 11, -7) * 0.8 + r * 0.3));   // (the mown stripes drift between fresh and drier)
        soil(soft, gT, x, z, (2.2 + R() * 2.2) * k, mute(vary(col, R, 0.04), 0.25, 0.92), R, 0.06); st.pas++;
      } });
  };

  /* Katu: land cover 0 steppe, 1 larch wood, 2 shrub, 3 camps, 4 rock, 5 water */
  const KT = { straw: [0.66, 0.61, 0.4], straw2: [0.74, 0.67, 0.46], grit: [0.64, 0.57, 0.46], shrub: [0.5, 0.5, 0.34], moss: [0.42, 0.44, 0.27], needle: [0.47, 0.39, 0.28],
    schist: [0.62, 0.56, 0.47], rust: [0.64, 0.53, 0.41], dark: [0.52, 0.47, 0.4], fescue: [0.66, 0.62, 0.36], fescue2: [0.8, 0.71, 0.46] };
  const katu = (ctx, o) => {
    const lc = o.lc; if (!lc) return null;
    return band(ctx, o, { seed: 61201, step: 2.4, share: 0.9, from: 13, to: 60, pow: 1.2, drop: 14, maxSl: 2.6,
      each: (soft, gT, x, y, z, sl, k, R, st) => {
        const c = lc(x, z); if (c === 3 || c === 5) return;
        const r = R();
        if (sl > 1.0 || c === 4) {   // (the steep schist faces, bare)
          const col = r < 0.4 ? KT.schist : r < 0.7 ? KT.rust : KT.dark;
          soil(soft, gT, x, z, (2.0 + R() * 2.2) * k, mute(vary(col, R, 0.04), 0.15, 0.95), R, 0.08); st.skala++; return;
        }
        let col;
        if (c === 1) col = r < 0.55 ? KT.moss : KT.needle;
        else if (c === 2) col = r < 0.6 ? KT.shrub : KT.grit;
        else col = r < 0.3 ? KT.grit : mix3(KT.straw, KT.straw2, Math.min(1, noise(x, z, -23, 41) * 0.8 + R() * 0.3));
        soil(soft, gT, x, z, (2.0 + R() * 2.2) * k, mute(vary(col, R, 0.04), 0.15, 0.95), R, 0.06); st.pas++;
        if (c === 0 && R() < 0.6) {   // (the fescue's tufts beside the patch)
          const tx = x + (R() - 0.5) * 3, tz = z + (R() - 0.5) * 3, h = R();
          tuft(soft.get(tx, tz), tx, gT(tx, tz), tz, 0.3 + h * 0.25, 0.3 + h * 0.3, mute(vary(mix3(KT.fescue, KT.fescue2, R()), R, 0.03), 0.2, 0.93), R, 5); st.sopi++;
        }
      } });
  };

  const base = World.ext.goreRob;
  const f = function (ctx, id, o) {
    const r = base.apply(this, arguments);
    if ((id === 'harju' || id === 'katu') && ctx && o) try {
      const s = id === 'harju' ? harju(ctx, o) : katu(ctx, o);
      if (s && ctx.out) ctx.out.pasBt61 = s;
    } catch (e) { console.error('chase-bt61 (' + id + '):', e); }
    return r;
  };
  Object.assign(f, base);   // (LOOK, hjLC and whatever else the later groups hang on it)
  World.ext.goreRob = f;
})();
