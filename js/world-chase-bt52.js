/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fifty-second group of the real tracks: Koli and Pikes Peak on
   its historic gravel (pikesg), a second pass on two tracks whose roadside the nineteenth group (js/world-chase-bt19.js: Koli's stalks
   and young spruces under their crown snow within ~30 m) and the sixteenth group (js/world-chase-bt16.js: the shared Pikes look) already
   set. The thirty-ninth group (js/world-chase-bt39.js) left pikesg as it was. From behind the car both still showed one even face
   beside the road: on Koli the ploughed bank between the asphalt and the barrier line one clean white and the snow past the nineteenth
   group's band out to the horizon a smooth wash; on pikesg the gravel road's edge running straight into the brown slope, the slope's
   one colour past ~10 m. So here, on those strips only:
   on Koli (docs/proge/koli.md: »zgrnjen sneg ob cesti, cesta brez črt (zbit sneg na splužen asfalt), gozd smrek in borov«) at the foot
   of the ploughed bank the snow the plough and the wheels throw up, greyed by the road's grit, in patches; on the bank the blue shade of
   its hollows; ~4 to ~60 m past the barrier line stones under their snow caps (a grey foot, a white top), on the open snow and at the
   forest's edge more young spruces under their crown snow, so the slope reads as ground out to the trees. On pikesg (js/tracks/pikesg.js:
   »rožnato sivem granitnem gramozu s kolesnicami in valovi … prah in kamenje za avtom«; the builder's ground pkCol, js/world-pikes.js) the
   grader's low windrow of loose pink granite gravel along both edges, the grass and the litter by the road under its pink dust; to ~10 m
   the granite grit, the dusty olive grass and the needle litter with tufts; out to ~55 m wide low patches of the gravel, the tundra's
   green-brown and the litter. Nothing on the road, on built ground or car parks (land cover 3), in the water (Koli 5) or on the ski runs
   (Koli 6), on pikesg nothing on the snow (5) or the bare steep granite (4), nothing where another leg's road is nearer. Pikes Peak on
   asphalt ('pikes') stays as it is. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the
   barriers, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, cone, TAU } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.mix3 || !rng || !vary || !cone) return;
  const { soil, tuft, softScen, mix3 } = BT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // (as the thirty-ninth group: a fifth of the way to their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const P = (R, a, b, r0, r1) => ({ col: mute(vary(mix3(a, b, R()), R, 0.015)), r: r0 + R() * r1 });
  const T_ = (R, a, b) => mute(vary(mix3(a, b, R()), R, 0.03), 0.95);
  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  const tau = TAU || Math.PI * 2;

  /* past the barrier line on both sides, every C.step m: C.n places from C.from to C.to m past it, only where this leg's road is the
     nearest, not in bad, not far below the road (C.drop) nor steeper than C.maxSl; C.put lays the patch and says what it was — the
     thirty-ninth group's walk (js/world-chase-bt39.js) */
  const outer = (root, matV, gT, near, lc, bad, seed, C, st) => {
    const T = API.T; if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length, loop = !!C.loop;
    const slope = (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) for (let k = 0; k < C.n; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + Math.pow(r1, C.pw || 1) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || (loop ? gap(q.i, i, N) : Math.abs(q.i - i)) * T.ds > o + 10 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0) continue;
      if (bad(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop)) continue;
      const sl = slope(x, z); if (sl > C.maxSl) continue;
      const c = lc ? lc(x, z) : 0; if (C.skipLC && C.skipLC(c)) continue;
      const kk = C.put(soft, gT, x, y, z, o - bar, R, c, sl); if (kk) st[kk] = (st[kk] || 0) + 1;
    }
    soft.done();
    return st;
  };
  /* the strip between the road's edge and the barrier line, every step m on both sides: put(soft, x, z, o, e0, e1, R, i, sd) with
     o the way from the centre line, e0..e1 the strip; only where this leg is the nearest and the ground is not far below the road */
  const verge = (root, matV, gT, near, bad, seed, step, e0f, put) => {
    const T = API.T; if (!T || !T.br) return;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length, w = T.w, ds = T.ds;
    for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + e0f, e1 = bar - 0.3;
      const own = (x, z) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * ds < 12 && Math.abs(q.lat) > w + 0.05 && Math.abs(q.lat) < bar && q.lat * sd > 0 && !bad(x, z) && !(gT(x, z) < T.hy[i] - 3); };
      put(soft, R, i, sd, e0, e1, own);
    }
    soft.done();
  };
  const at = (i, sd, o, a) => { const T = API.T; return [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a]; };
  // a stone under its snow cap: a low wide cone, its foot the grey rock, its top the snow
  const capStone = (g, x, y, z, w, h, rock, snow, R) => { cone(g, x, y - 0.08, z, w, h * 0.7, 6, rock, rock, R() * tau); cone(g, x, y + h * 0.4, z, w * 0.55, h * 0.42, 6, snow, snow, R() * tau); };

  /* ---- Koli (World.gore: its S.extra calls World.ext.goreRob(ctx, 'koli'); the ground vrGround, the land cover vrLC) ---- */
  const KO = {
    grit: [[0.6, 0.57, 0.52], [0.66, 0.63, 0.58]], slush: [[0.55, 0.55, 0.56], [0.6, 0.6, 0.61]], shade: [[0.8, 0.84, 0.92], [0.84, 0.87, 0.94]],
    snow: [0.93, 0.94, 0.97], rock: [[0.42, 0.42, 0.43], [0.5, 0.49, 0.48]], spruce: [0.2, 0.3, 0.2], blue: [0.76, 0.81, 0.9],
  };
  const koli = (ctx) => {
    const T = API.T, near = API.vrNear, lc = API.vrLC, gT = API.vrGround, ex = ctx.excluded || (() => false);
    if (!ctx.out || !ctx.root || !ctx.out.matV || !T || !T.br || !near || !gT || (T.def && T.def.id !== 'koli')) return;
    const root = ctx.root, matV = ctx.out.matV, water = API.vrWater;
    const bad = (x, z) => ex(x, z) || (water && water(x, z).e > -1);
    const st = { siva: 0, senca: 0 };
    // the ploughed bank: the grey snow at its foot (the plough's and the wheels' spray with the road's grit), the blue of its hollows higher up
    verge(root, matV, gT, near, bad, 52101, 2.6, 0.15, (soft, R, i, sd, e0, e1, own) => {
      const c = lc ? lc(...at(i, sd, e1 + 3, 0)) : 0; if (c === 3 || c === 5 || c === 6) return;
      const r0 = R(), r1 = R(), r2 = R();
      const ramp = (x, z) => Math.max(gT(x, z) + 0.05, T.hy[i] + 0.03);   // (the ramp of World.gore's verge: js/world-gore.js vProf)
      if (r0 < 0.62) { const o = e0 + r1 * Math.min(1.4, Math.max(0.3, e1 - e0)), [x, z] = at(i, sd, o, (R() - 0.5) * 2.6), u = R();
        const Pp = u < 0.6 ? P(R, KO.grit[0], KO.grit[1], 0.5, 0.6) : P(R, KO.slush[0], KO.slush[1], 0.35, 0.4);
        if (own(x, z)) { soil(soft, ramp, x, z, Pp.r, Pp.col, R, 0.04); st.siva++; } }
      if (r2 < 0.3 && e1 - e0 > 1.6) { const o = e0 + 1.0 + R() * (e1 - e0 - 1.0), [x, z] = at(i, sd, o, (R() - 0.5) * 2.6), Pp = P(R, KO.shade[0], KO.shade[1], 0.5, 0.5);
        if (own(x, z)) { soil(soft, ramp, x, z, Pp.r, Pp.col, R, 0.05); st.senca++; } }
    });
    const skipLC = (c) => c === 3 || c === 5 || c === 6;
    // ~4 to ~60 m: stones under their snow caps, and on the open snow and at the forest's edge young spruces under their crown snow
    const pas = outer(root, matV, gT, near, lc, bad, 52102, { step: 3.5, n: 2, share: 0.8, from: 4.5, to: 60, pw: 1.1, drop: 12, maxSl: 1.0, skipLC,
      put: (soft, g, x, y, z, o, R, c) => { const u = R(), h = R(), k = 1 + 0.6 * Math.min(1, (o - 4.5) / 55.5), gg = soft.get(x, z);
        if (u < 0.45) { capStone(gg, x, y, z, (0.5 + h * 0.55) * k, (0.45 + h * 0.4) * k, mute(vary(mix3(KO.rock[0], KO.rock[1], R()), R, 0.02), 0.95), KO.snow, R); return 'kamni'; }
        if (c === 4) return null;
        const ht = (1.3 + h * 2.0) * k, wd = (0.45 + h * 0.35) * k;
        tuft(gg, x, y - 0.05, z, wd, ht, vary(KO.spruce, R, 0.025), R, 6);
        cone(gg, x, y + ht * 0.56, z, wd * 0.6, ht * 0.5, 6, vary(KO.blue, R, 0.012), KO.snow, R() * tau); return 'smreke'; } }, {});
    ctx.out.robBt52 = st; ctx.out.pasBt52 = pas;
  };

  /* ---- Pikes Peak on gravel (its own builder, js/world-pikes.js: goreRob(ctx, 'pikes', o) with its ground; only for def.id 'pikesg') ---- */
  const PG = {
    gravel: [[0.6, 0.51, 0.46], [0.65, 0.55, 0.49]], stone: [[0.52, 0.44, 0.4], [0.57, 0.48, 0.43]], dust: [[0.64, 0.56, 0.49], [0.68, 0.59, 0.51]],
    grit: [[0.62, 0.52, 0.45], [0.66, 0.55, 0.47]], olive: [[0.53, 0.5, 0.36], [0.58, 0.53, 0.4]], needle: [[0.42, 0.33, 0.24], [0.47, 0.36, 0.26]],
    tundra: [[0.4, 0.41, 0.25], [0.46, 0.41, 0.27]], tuft: [[0.55, 0.52, 0.4], [0.62, 0.56, 0.44]],
  };
  const pikesg = (ctx, o) => {
    const T = API.T;
    if (!ctx.out || !ctx.root || !ctx.out.matV || !o || !o.gH || !o.near || !T || !T.br || !T.def || T.def.id !== 'pikesg') return;
    const gT = o.gH, near = o.near, lc = o.lc, ex = ctx.excluded || (() => false), root = ctx.root, matV = ctx.out.matV;
    const skipLC = (c) => c === 3 || c === 4 || c === 5;
    const wood = (c) => c === 1 || c === 2;
    const st = { nasip: 0, prah: 0 };
    // the grader's windrow along both edges (a low ridge of loose gravel), the grass beside it under the road's pink dust
    verge(root, matV, gT, near, ex, 52201, 1.6, 0.05, (soft, R, i, sd, e0, e1, own) => {
      const c = lc ? lc(...at(i, sd, e0 + 2, 0)) : 0; if (c === 3 || c === 5) return;
      const lip = (x, z) => Math.max(gT(x, z) + 0.05, T.hy[i] - 0.02);   // (the verge's inner edge as the builder lays it: js/world-pikes.js, vp)
      const o0 = e0 + 0.25 + R() * 0.35;   // (the windrow: overlapping low heaps along the edge, so it reads as one ridge, not beads)
      for (let q = 0; q < 3; q++) if (R() < 0.85) { const o = o0 + (R() - 0.5) * 0.3, [x, z] = at(i, sd, o, (q - 1) * 0.55 + (R() - 0.5) * 0.3), u = R();
        const Pp = u < 0.75 ? P(R, PG.gravel[0], PG.gravel[1], 0.42, 0.22) : P(R, PG.stone[0], PG.stone[1], 0.3, 0.2);
        if (own(x, z)) { soil(soft, lip, x, z, Pp.r, Pp.col, R, 0.04 + R() * 0.04); st.nasip++; } }
      if (R() < 0.18 && e1 - e0 > 1.4) { const o = e0 + 0.9 + R() * Math.min(2.5, e1 - e0 - 0.9), [x, z] = at(i, sd, o, (R() - 0.5) * 1.6);
        if (own(x, z)) { const h = R(); tuft(soft.get(x, z), x, lip(x, z), z, 0.2 + h * 0.14, 0.22 + h * 0.2, T_(R, PG.dust[0], PG.tuft[1]), R, 5); st.prah++; } }
    });
    // to ~10 m past the barrier line: the granite grit and the road's dust, the dusty olive grass, the needle litter under the trees; tufts
    const breg = outer(root, matV, gT, near, lc, ex, 52202, { step: 4.0, n: 2, share: 0.75, from: 0.4, to: 10, pw: 1.3, drop: 3, maxSl: 1.3, skipLC,
      put: (soft, g, x, y, z, oo, R, c) => { const u = R();
        if (u < 0.68) { const Pp = wood(c) && R() < 0.55 ? P(R, PG.needle[0], PG.needle[1], 0.9, 1.1)
            : oo < 4 && R() < 0.6 ? P(R, PG.dust[0], PG.dust[1], 0.8, 0.9) : R() < 0.5 ? P(R, PG.grit[0], PG.grit[1], 0.8, 1.1) : P(R, PG.olive[0], PG.olive[1], 0.9, 1.1);
          soil(soft, g, x, z, Pp.r, Pp.col, R, 0.05); return 'breg'; }
        const h = R(); tuft(soft.get(x, z), x, y, z, 0.22 + h * 0.18, 0.26 + h * 0.24, T_(R, oo < 4 ? PG.dust[1] : PG.tuft[0], PG.tuft[1]), R, 5); return 'bregSopi'; } }, {});
    // out to ~55 m: wide low patches of the gravel, the tundra's green-brown and the litter
    const pas = outer(root, matV, gT, near, lc, ex, 52203, { step: 7, n: 1, share: 0.45, from: 10, to: 55, drop: 12, maxSl: 1.1, skipLC,
      put: (soft, g, x, y, z, oo, R, c) => { const u = R(), k = 1 + 0.5 * clamp((oo - 10) / 45, 0, 1);
        const Pp = wood(c) ? P(R, PG.needle[0], PG.needle[1], 1.6 * k, 1.4 * k) : u < 0.5 ? P(R, PG.grit[0], PG.grit[1], 1.6 * k, 1.6 * k) : P(R, PG.tundra[0], PG.tundra[1], 1.6 * k, 1.6 * k);
        soil(soft, g, x, z, Pp.r, Pp.col, R, 0.06); return 'pas'; } }, {});
    ctx.out.robBt52 = st; ctx.out.bregBt52 = breg; ctx.out.pasBt52 = pas;
  };

  const base = World.ext.goreRob;
  const f = function (ctx, id, o) {
    const r = base.call(this, ctx, id, o);
    if (id === 'koli') try { koli(ctx); } catch (e) { console.error('chase-bt52 (koli):', e); }
    if (id === 'pikes') try { pikesg(ctx, o); } catch (e) { console.error('chase-bt52 (pikesg):', e); }
    return r;
  };
  Object.assign(f, base);
  World.ext.goreRob = f;
})();
