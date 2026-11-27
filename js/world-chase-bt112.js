/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-twelfth group of the real tracks, a further pass:
   Killar (its own builder, js/world-killar.js: after js/world-chase-bt13.js, js/world-chase-bt50.js and js/world-chase-bt81.js on
   World.ext.goreRob). From behind the car the slope below the road (past the wooden fence, on the drop's side for two thirds of the track)
   still fell away as one bare tan face, because the eighty-first group kept everything to the uphill side; and on the uphill side the
   ground between the fallen slate at the cut's foot (to ~4 m) and the far band (from ~12 m) had no scrub.
   Killar (docs/proge/killar.md: »suha olivna in slamnata pobočja, sivo rjav skrilavec in gnajs, melišča … grmičevje, šopi trave, kamenje
   ob cesti«): on the downhill side, from ~1 m to ~24 m past the fence line, the slate's ledges and loose stones lying on the slope, straw
   tufts, low dry scrub and a few pale scree patches, thinning with distance (on the steep face itself only small outcrops, tufts and a
   little scrub in the cracks); on the uphill side, from ~4 m to ~13 m,
   low dry scrub with a straw tuft or two beside it. Everything lies on the DEM ground itself (nothing hangs over the drop); nothing on the
   snow, in the villages, at the fort, where another leg's road is nearer or on a face too steep. All of it in meshes of their own
   (softScen: 256 m chunks, no shadow); the terrain, the road, the fence, the nets, the trees and the driving stay as they are. Colours mid
   tones (nothing dark). (Luanda, the group's other track, is left out: its roadside is being changed on another branch.)
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;
  // (as js/world-chase-bt81.js: a third of the way toward the colour's grey, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.015), k);
  const at = (T, i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];

  const KL = { slate: [0.53, 0.51, 0.47], slate2: [0.6, 0.57, 0.52], scree: [0.63, 0.6, 0.55], straw: [0.65, 0.59, 0.4], olive: [0.52, 0.51, 0.33],
    scrub: [0.47, 0.49, 0.31], scrub2: [0.56, 0.52, 0.34] };
  const klRob = (ctx, o) => {
    const T = API.T, st = { police: 0, kamni: 0, sopi: 0, grmi: 0, melisca: 0 };
    const gH = o.gH || API.vrGround, slope = o.slope || API.vrSlope, near = o.near || API.vrNear, lc = o.lc || API.vrLC;
    if (!T || !T.br || !T.wAt || !gH || !slope || !near || !lc || !ctx.root || !ctx.out || !ctx.out.matV) return st;
    const ex = ctx.excluded || (() => false), R = rng(112201), N = T.px.length, soft = softScen(ctx.root, ctx.out.matV);
    const bad = (x, z) => { if (ex(x, z) || (o.bad && o.bad(x, z))) return true; const c = lc(x, z); return c === 3 || c === 5 || c === 6; };
    // (only this leg's own ground: the nearest point of the road is this one, at about the distance asked for)
    const own = (x, z, i, o2) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * T.ds < o2 + 8 && Math.abs(q.lat) > o2 - 2.5; };
    const bush = (x, z, s) => { const g = soft.get(x, z), y = gH(x, z), c = C3(R, KL.scrub, KL.scrub2, 1);
      cushion(g, x, y, z, 0.32 + s * 0.38, 0.24 + s * 0.26, c, R);
      if (R() < 0.5) { const a = R() * 6.283, d = 0.3 + s * 0.3, bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d;
        cushion(g, bx, gH(bx, bz), bz, 0.2 + s * 0.22, 0.16 + s * 0.16, [c[0] * 1.05, c[1] * 1.04, c[2] * 1.02], R); }
      st.grmi++; };
    const straw = (x, z) => { const h = R(); tuft(soft.get(x, z), x, gH(x, z), z, 0.26 + h * 0.22, 0.3 + h * 0.3, vary(mix3(KL.straw, KL.olive, R() * 0.6), R, 0.03), R, 5); st.sopi++; };
    const step = Math.max(1, Math.round(1.5 / T.ds));
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const w = T.wAt(i), bar = Math.max(sd > 0 ? T.br[i] : T.bl[i], w + 0.8), hy = T.hy[i];
      const [ux, uz] = at(T, i, sd, Math.max(bar, w + 3) + 6, 0), dy = gH(ux, uz) - hy;
      if (dy < -0.6) {   // the downhill side: the slope below the fence, thinning with distance (nearer denser, so the edge reads from the car)
        const r0 = R(), o2 = bar + 0.9 + Math.pow(R(), 1.6) * 23, [x, z] = at(T, i, sd, o2, (R() - 0.5) * 3);
        if (r0 > 0.85 || !own(x, z, i, o2) || bad(x, z)) continue;
        const sl = slope(x, z); if (sl > 3.2) continue;
        if (sl > 1.7) {   // the steep face itself: only what holds on it, small slate outcrops, straw tufts and a little scrub in the cracks
          const r = R(), q = R();
          if (r < 0.4) { cushion(soft.get(x, z), x, gH(x, z) - 0.1, z, 0.16 + q * 0.2, 0.1 + q * 0.1, C3(R, KL.slate, KL.slate2, 1), R); st.police++; }
          else if (r < 0.8) for (let j = 0, n = 1 + Math.floor(R() * 2); j < n; j++) { const [tx, tz] = at(T, i, sd, o2 + (R() - 0.5) * 0.3, (R() - 0.5) * 2.6); if (!bad(tx, tz)) straw(tx, tz); }
          else { cushion(soft.get(x, z), x, gH(x, z) - 0.08, z, 0.2 + q * 0.16, 0.2 + q * 0.14, C3(R, KL.scrub, KL.scrub2, 1), R); st.grmi++; }
          continue;
        }
        const k = 1 + 0.6 * (o2 - bar) / 24, r = R();
        if (r < 0.3) {   // a slate ledge: a low wide slab with a stone or two below it
          const s = R(); cushion(soft.get(x, z), x, gH(x, z) - 0.03, z, (0.45 + s * 0.5) * k, 0.1 + s * 0.12, C3(R, KL.slate, KL.slate2, 1), R); st.police++;
          for (let j = 0, n = Math.floor(R() * 3); j < n; j++) { const [sx, sz] = at(T, i, sd, o2 + 0.5 + R() * 1.6, (R() - 0.5) * 2.4), q = R();
            if (!bad(sx, sz)) { cushion(soft.get(sx, sz), sx, gH(sx, sz), sz, 0.12 + q * 0.2, 0.07 + q * 0.1, C3(R, KL.slate2, KL.scree, 1), R); st.kamni++; } }
        } else if (r < 0.62) {   // straw tufts in a loose clump
          for (let j = 0, n = 1 + Math.floor(R() * 3); j < n; j++) { const tx = x + (R() - 0.5) * 2.6, tz = z + (R() - 0.5) * 2.6; if (!bad(tx, tz)) straw(tx, tz); }
        } else if (r < 0.9) {   // low dry scrub (not on the steepest faces), a tuft beside it
          if (sl < 1.25) { bush(x, z, R() * k * 0.8); if (R() < 0.4) { const tx = x + (R() - 0.5) * 1.8, tz = z + (R() - 0.5) * 1.8; if (!bad(tx, tz)) straw(tx, tz); } }
        } else if (sl > 0.45 && o2 > bar + 2.5) {   // a pale patch of scree lying down the fall line
          soil(soft, gH, x, z, (0.9 + R() * 1.1) * k, C3(R, KL.scree, KL.slate2, 0.95), R, 0.06); st.melisca++;
        }
      } else if (dy > 0.3) {   // the uphill side: scrub between the cut's fallen slate and the far band
        if (R() > 0.28) continue;
        const o2 = Math.max(bar, w + 3) + 4 + R() * 9, [x, z] = at(T, i, sd, o2, (R() - 0.5) * 3);
        if (!own(x, z, i, o2) || bad(x, z) || slope(x, z) > 1.1) continue;
        bush(x, z, R()); if (R() < 0.5) { const tx = x + (R() - 0.5) * 2, tz = z + (R() - 0.5) * 2; if (!bad(tx, tz)) straw(tx, tz); }
      }
    }
    soft.done();
    return st;
  };
  {
    const base = World.ext.goreRob;   // (js/world-chase-bt81.js's, which calls bt50's and bt13's)
    if (base) {
      const f = function (ctx, id, o) {
        let r = base.call(this, ctx, id, o);
        if (id === 'killar') try { r = r || {}; r.bt112 = klRob(ctx, o || {}); if (ctx.out) ctx.out.rob = r; } catch (e) { console.error('chase-bt112 (killar):', e); }
        return r;
      };
      Object.assign(f, base);   // (LOOK and the other properties stay the same objects)
      World.ext.goreRob = f;
    }
  }
})();
