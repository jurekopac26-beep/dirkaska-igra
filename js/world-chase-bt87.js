/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighty-seventh group of the real tracks: Harju, a fourth pass
   on the town park's road whose ground the nineteenth, thirty-sixth and sixty-first groups already set (js/world-chase-bt19.js: the
   verge grass, the hair-grass, the bilberry and lingonberry; js/world-chase-bt36.js: a bank to ~10 m and a sparse band to ~45 m;
   js/world-chase-bt61.js: the lawns' stripes and the needle litter from 22 to 55 m). From behind the car the asphalt's and the gravel's
   edge still met the verge in one clean line, and the park's ground held no colour but greens and browns. So here, from
   docs/proge/harju.md (»svetel pesek in drobni gramoz grebena, rumenkast prah«; »iglice, mah in pesek, ob progi rastejo borovnice,
   brusnice in vresje, trave in poznopoletno cvetje (ozkolistni vrbovec, rman, zvončice)«):
   - a worn edge: by the asphalt (T.sf 0) on a grass verge (T.vg 2) the grey-brown grit and dust 0.05-0.75 m past its edge, under the
     pines the needles washed onto it; by the gravel (T.sf 5) or on a gravel verge (T.vg 3, 5) the ridge's pale sand and yellowish dust
     spilt 0.05-1.2 m past it; never by the cobbles (T.sf 4), on the kerbed pavements (T.vg 4), where another road meets it (T.vg 0) or
     in the builder's excluded places;
   - from ~3 to ~60 m past the barrier line, thinning with distance: under the pines (hjLC 1) the heather in low purplish cushions and the
     late-summer flowers in small clumps (fireweed tall and pink, yarrow low and white, harebells low and blue), on the open ground (0) the
     flowers only in the unmown strip to ~12 m, in the wetland (2) the sedge's tufts. Never on class 3, in ex, or on the steep banks.
   The horizon stays the builder's far ring and lakes (the chase camera's short far plane: js/world-harju.js, farClip).
   All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the barriers, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.mix3 || !vary || !rng) return;
  const { soil, tuft, cushion, softScen, mix3 } = BT;
  const mute = (c, g, f) => { const l = (c[0] + c[1] + c[2]) / 3; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const C3 = (R, a, b, g, f) => mute(vary(mix3(a, b, R()), R, 0.015), g, f);

  const HJ = { grit: [0.5, 0.48, 0.43], dust: [0.56, 0.52, 0.44], needle: [0.45, 0.36, 0.24], sand: [0.68, 0.62, 0.48], ydust: [0.7, 0.63, 0.44],
    heath: [0.4, 0.3, 0.32], heath2: [0.46, 0.34, 0.38], fire: [0.66, 0.36, 0.52], fireG: [0.3, 0.38, 0.18], yarrow: [0.84, 0.82, 0.72],
    bell: [0.46, 0.46, 0.7], sedge: [0.42, 0.48, 0.24], sedge2: [0.5, 0.52, 0.3] };

  /* the worn edge: every 2 m on both sides a short flat patch just past the road's edge, at the road's height or the ground's */
  const edge = (soft, o, lc, ex, R, st) => {
    const T = API.T, N = T.px.length, step = Math.max(1, Math.round(2.0 / T.ds)), SF = T.sf, VG = T.vg, near = o.near, gT = o.gH;
    const hw = (i) => T.wa ? T.wa[i] : T.wAt ? T.wAt(i) : T.w;
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const s = SF ? SF[i] : 0, v = VG ? VG[sd > 0 ? 1 : 0][i] : 2; if (s === 4 || !(v === 2 || v === 3 || v === 5)) continue;   // (not the cobbles, the kerbed pavements or another road)
      const gr = s === 5 || v !== 2; if (R() > (gr ? 0.85 : 0.7)) continue;
      const w = hw(i), bar = sd > 0 ? T.br[i] : T.bl[i], o2 = w + 0.05 + R() * (gr ? 1.15 : 0.7); if (o2 > bar + 0.5) continue;
      const a = (R() - 0.5) * 2.0, x = T.px[i] + T.nx[i] * sd * o2 + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o2 + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 6 || Math.abs(q.lat) < hw(q.i)) continue;
      if (ex(x, z)) continue;
      const c = lc(x + T.nx[i] * sd * 2.5, z + T.nz[i] * sd * 2.5);   // (the class just past the verge's ribbon: the ribbon itself reads as paved)
      const g = gT(x, z), hy = T.hy[i]; if (!(g > hy - 1.2) || !(g < hy + 1.2)) continue;
      const gE = (px, pz) => Math.max(gT(px, pz), hy - 0.03);
      const col = gr ? (R() < 0.6 ? C3(R, HJ.sand, HJ.ydust, 0.2, 0.95) : C3(R, HJ.ydust, HJ.dust, 0.2, 0.95))
        : c === 1 && R() < 0.55 ? C3(R, HJ.needle, HJ.dust, 0.2, 0.93) : C3(R, HJ.grit, HJ.dust, 0.25, 0.95);
      soil(soft, gE, x, z, Math.min(gr ? 0.7 : 0.55, 0.3 + R() * (gr ? 0.45 : 0.3)), col, R, 0.04); st.rob++;
    }
  };

  /* the band: every 3.2 m on both sides three tries from 3 m past the barrier line to 60 m (denser near) */
  const band = (soft, o, lc, ex, R, st) => {
    const T = API.T, N = T.px.length, near = o.near, gT = o.gH;
    const slope = o.slope || ((x, z) => { const d = 1.2; return Math.hypot(gT(x + d, z) - gT(x - d, z), gT(x, z + d) - gT(x, z - d)) / (2 * d); });
    for (let i = 0; i < N; i += Math.max(1, Math.round(3.2 / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < 3; k++) {
        const d = 3 + Math.pow(R(), 1.6) * 57, oo = bar + d, a = (R() - 0.5) * 5;
        if (R() > (d < 20 ? 0.85 : 0.5)) continue;
        const x = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > oo + 10) continue;
        const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + 2) continue;   // (another leg nearer)
        const c = lc(x, z); if (c === 3 || ex(x, z)) continue;
        const y = gT(x, z); if (!(y > T.hy[i] - 6) || !(y < T.hy[i] + 25) || !(slope(x, z) < 0.9)) continue;
        const r = R(), h = R(), w = d < 25 ? 1 : 1.35;
        if (c === 2) { tuft(soft.get(x, z), x, y - 0.03, z, 0.3 * w + h * 0.15, 0.4 + h * 0.3, C3(R, HJ.sedge, HJ.sedge2, 0.15, 0.95), R, 5); st.sara++; continue; }
        if (c === 0 && d > 12) continue;   // (the mown lawns: flowers only in the unmown strip by the road)
        if (c === 1 && r < 0.35) { cushion(soft.get(x, z), x, y - 0.04, z, (0.55 + h * 0.4) * w, 0.18 + h * 0.14, C3(R, HJ.heath, HJ.heath2, 0.15, 0.95), R); st.vresje++; }
        else if (r < 0.6) {   // (fireweed: a green clump with its pink spikes over it)
          const g = soft.get(x, z), hh = 0.55 + h * 0.45;
          tuft(g, x, y - 0.03, z, 0.2 + h * 0.1, hh * 0.75, C3(R, HJ.fireG, HJ.fireG, 0.1, 0.95), R, 5);
          tuft(g, x, y + hh * 0.45, z, 0.12 + h * 0.06, hh * 0.45, C3(R, HJ.fire, HJ.heath2, 0.1, 0.97), R, 4); st.vrbovec++;
        } else if (r < 0.82) { tuft(soft.get(x, z), x, y - 0.03, z, 0.18 + h * 0.1, 0.25 + h * 0.15, C3(R, HJ.yarrow, HJ.sedge2, 0.1, 0.95), R, 5); st.rman++; }
        else { tuft(soft.get(x, z), x, y - 0.03, z, 0.14 + h * 0.08, 0.2 + h * 0.12, C3(R, HJ.bell, HJ.fireG, 0.1, 0.95), R, 4); st.zvoncice++; }
      }
    }
  };

  const base = World.ext.goreRob;
  const f = function (ctx, id, o) {
    const r = base.apply(this, arguments);
    if (id === 'harju' && ctx && o && o.lc && o.near && o.gH && ctx.root && ctx.out && ctx.out.matV && API.T && API.T.br) try {
      const R = rng(87101), soft = softScen(ctx.root, ctx.out.matV), ex = ctx.excluded || (() => false), st = { rob: 0, vresje: 0, vrbovec: 0, rman: 0, zvoncice: 0, sara: 0 };
      edge(soft, o, o.lc, ex, R, st); band(soft, o, o.lc, ex, R, st);
      soft.done(); ctx.out.robBt87 = st;
    } catch (e) { console.error('chase-bt87 (harju):', e); }
    return r;
  };
  Object.assign(f, base);   // (LOOK, hjLC and whatever else the later groups hang on it)
  World.ext.goreRob = f;
})();
