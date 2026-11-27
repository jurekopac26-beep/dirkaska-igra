/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-eighth group of the real tracks: Pikes Peak on
   its historic gravel (pikesg) and Rio do Rastro, a further pass on two tracks whose roadside the fifty-second and eighty-second groups
   (pikesg: js/world-chase-bt52.js, js/world-chase-bt82.js: the windrow, the grit and the dust to ~10 m, the edge's loose gravel, the
   boulders, pines, cushions and scree to ~60 m) and the fifteenth, thirty-second and seventy-fifth (Rio do Rastro:
   js/world-chase-bt15.js, js/world-chase-bt32.js, js/world-chase-bt75.js: the face to ~10 m, the edge's red earth and basalt grit, the
   patches, ferns, shrubs and blocks to ~60 m) already set.
   From behind the car pikesg's gravel itself was still one even face between its edges and the verge's first metres only the windrow
   and a dusty tuft. So here (js/tracks/pikesg.js: »rožnato sivem granitnem gramozu s kolesnicami in valovi … prah in kamenje za avtom«)
   the wheel tracks: two packed, slightly paler lines wandering a little along the road with a loose ridge beside them now and then;
   the stones the wheels throw out lying on the verge from the edge to ~1.4 m past the barrier line; and the road's pale dust in wider
   fans on the verge at the outside of the bends. Nothing on built ground (3) or the snow (5); Pikes Peak on asphalt ('pikes') stays.
   On Rio do Rastro the verge between the shoulder and the barrier line was one smooth green face. So here (docs/proge/rastro.md:
   »Atlantski deževni gozd … grmovje ob robovih«, »Pečine … iz temnega bazalta (zgoraj) in rožnatega peščenjaka (spodaj) … z mahom v
   razpokah, skalni bloki ob cesti«, »Planota: travišče«) on the verge and to ~1.4 m past the barrier line: uncut grass tufts (straw on
   the plateau above ~1360 m), under the forest the fallen leaves drifted in short streaks along the shoulder, at the foot of the
   uphill side the small fallen stones (basalt above ~1150 m, the pink sandstone below) and the moss's damp patches. Nothing on built
   ground (3) or water (5), nothing where another leg's road is nearer, nothing within 0.35 m of the barrier line on the road's side.
   Each track's additions in one set of meshes of their own (softScen: 256 m chunks, no shadow).
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
  /* how sharply the road turns at i and to which side (> 0: towards +n), from the tangents ~12 m apart */
  const turn = (T, i, N) => { const k = Math.max(1, Math.round(6 / T.ds)), a = Math.max(0, i - k), b = Math.min(N - 1, i + k);
    return (T.tx[a] * T.tz[b] - T.tz[a] * T.tx[b]) * (T.nx[i] * -T.tz[i] + T.nz[i] * T.tx[i] >= 0 ? 1 : -1); };

  /* ==== Pikes Peak on gravel (js/world-pikes.js: goreRob(ctx, 'pikes', { gH, slope, lc, near }); only for def.id 'pikesg') ==== */
  const PG = {
    packed: [[0.66, 0.58, 0.53], [0.7, 0.61, 0.55]], ridge: [[0.6, 0.51, 0.46], [0.64, 0.54, 0.48]],   // (the packed wheel tracks, the loose ridge beside them)
    stone: [[0.58, 0.48, 0.44], [0.64, 0.53, 0.47]], grey: [[0.55, 0.52, 0.5], [0.6, 0.56, 0.53]], dust: [[0.53, 0.5, 0.41], [0.58, 0.53, 0.44]],   // (the dust on the grass: the builder's dusty olive, not the bare gravel)
  };
  const pikesg = (ctx, o) => {
    const T = API.T, out = ctx.out;
    if (!out || !out.matV || !ctx.root || !o || !o.gH || !o.near || !T || !T.br || !T.def || T.def.id !== 'pikesg') return null;
    const gT = o.gH, near = o.near, lc = o.lc, ex = ctx.excluded || (() => false), N = T.px.length, ds = T.ds;
    const st = { kolesnice: 0, greben: 0, kamni: 0, prah: 0 }, soft = softScen(ctx.root, out.matV);
    const rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const w = T.wAt ? T.wAt(q.i) : T.w; return Math.abs(q.lat) < w ? T.hy[q.i] + 0.02 : Math.max(gT(x, z), T.hy[q.i] - 0.02); };
    const lip = (i) => (x, z) => Math.max(gT(x, z) + 0.05, T.hy[i] - 0.02);   // (the verge as the builder lays it: js/world-chase-bt52.js)
    const built = (x, z) => { const c = lc ? lc(x, z) : 0; return c === 3 || c === 5; };
    // the wheel tracks on the gravel: two packed lines ~1.7 m apart, wandering slowly across the road's middle
    {
      const R = rng(108101), step = Math.max(1, Math.round(5 / ds));
      for (let i = step; i < N - step; i += step) {
        const w = T.wAt ? T.wAt(i) : T.w, s = i * ds, mid = Math.sin(s / 61) * 0.22 * w + Math.sin(s / 23 + 1.3) * 0.08 * w;
        for (const sd of [-1, 1]) {
          const r0 = R(), r1 = R(), oo = mid + sd * (0.85 + (r1 - 0.5) * 0.12); if (r0 > 0.85 || Math.abs(oo) > w - 0.9) continue;
          const x = T.px[i] + T.nx[i] * oo, z = T.pz[i] + T.nz[i] * oo; if (ex(x, z)) continue;
          const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * ds >= 6) continue;
          streak(soft.get(x, z), rY, x, z, T.tx[i], T.tz[i], 5.5 + R() * 3.5, 0.3 + R() * 0.1, C_(R, PG.packed, 0.01), R, 0.01, 3); st.kolesnice++;
          if (R() < 0.3) { const o2 = oo + sd * (0.32 + R() * 0.12), x2 = T.px[i] + T.nx[i] * o2, z2 = T.pz[i] + T.nz[i] * o2;
            if (Math.abs(o2) < w - 0.7) { streak(soft.get(x2, z2), rY, x2, z2, T.tx[i], T.tz[i], 1.6 + R() * 2.2, 0.16 + R() * 0.1, C_(R, PG.ridge, 0.02), R, 0.016, 2); st.greben++; } }
        }
      }
    }
    // the verge: the stones thrown out by the wheels, the dust's fans at the outside of the bends
    {
      const R = rng(108102), step = Math.max(1, Math.round(3 / ds));
      for (let i = 0; i < N; i += step) { const tn = turn(T, i, N);
        for (const sd of [-1, 1]) {
          const w = T.wAt ? T.wAt(i) : T.w, bar = sd > 0 ? T.br[i] : T.bl[i], e1 = bar + 1.4, r0 = R(), r1 = R(), r2 = R(), a = (R() - 0.5) * 2.6;
          const at = (oo) => [T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a];
          const ok = (x, z, oo) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * ds < 6 && q.lat * sd > 0 && !ex(x, z) && !built(x, z) && !(Math.abs(oo - bar) < 0.35 && oo < bar) && gT(x, z) > T.hy[i] - 3; };
          const outside = tn * sd < -0.05;   // (the dust and the stones fly to the outside of the bend)
          if (r0 < (outside ? 0.8 : 0.4)) { const oo = w + 0.45 + Math.pow(r1, 1.6) * Math.max(0.4, e1 - w - 0.45), [x, z] = at(oo);
            if (ok(x, z, oo)) { const h = R(); cushion(soft.get(x, z), x, lip(i)(x, z) + 0.05, z, 0.09 + h * 0.13, 0.05 + h * 0.07, C_(R, R() < 0.7 ? PG.stone : PG.grey, 0.02), R); st.kamni++; } }
          if (outside && r2 < 0.55) { const oo = w + 0.9 + R() * Math.max(0.3, Math.min(3.2, e1 - w - 0.9)), [x, z] = at(oo);
            if (ok(x, z, oo)) { soil(soft, lip(i), x, z, 0.7 + R() * 0.8, C_(R, PG.dust), R, 0.035); st.prah++; } }
        }
      }
    }
    soft.done();
    return st;
  };

  /* ==== Rio do Rastro (js/world-rastro.js: goreRob with its own near, ground, slope and land cover; the shoulder 0.5 m) ==== */
  const RR = {
    tuft: [[0.3, 0.46, 0.17], [0.42, 0.51, 0.24]], tuftH: [[0.6, 0.56, 0.33], [0.66, 0.6, 0.36]], litter: [[0.4, 0.3, 0.2], [0.46, 0.34, 0.23]],
    leaf: [[0.5, 0.42, 0.22], [0.55, 0.45, 0.25]], moss: [[0.23, 0.31, 0.15], [0.27, 0.35, 0.18]],
    basalt: [[0.36, 0.35, 0.34], [0.42, 0.41, 0.39]], sand: [[0.64, 0.5, 0.44], [0.68, 0.54, 0.47]],
  };
  const rastro = (ctx, o) => {
    const T = API.T, out = ctx.out; if (!out || !out.matV || !ctx.root || !T || !T.br || !o || !o.near || !o.gH) return null;
    const near = o.near, gT = o.gH, ex = ctx.excluded || (() => false), lc = o.lc, N = T.px.length, ds = T.ds;
    const base = API.VR && API.VR.D ? API.VR.D.base : 0, alt = (i) => T.hy[i] + base;
    const sw = 0.5, rY = (x, z) => { const q = near(x, z); if (q.i < 0) return gT(x, z); const w = T.wAt ? T.wAt(q.i) : T.w, a = Math.abs(q.lat), y = T.hy[q.i];
      return a < w ? y + 0.02 : a < w + sw ? y + 0.012 - 0.032 * (a - w) / sw : Math.max(gT(x, z), y - 0.02); };
    const st = { sopi: 0, listje: 0, kamni: 0, mah: 0 }, soft = softScen(ctx.root, out.matV), R = rng(108201), step = Math.max(1, Math.round(5 / ds));   // (every ~5 m: the track's vertex budget, tests/golden/perf.json)
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const w = T.wAt ? T.wAt(i) : T.w, bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + sw + 0.2, e1 = bar + 1.4, hi = alt(i) > 1360;
      const r0 = R(), r1 = R(), r2 = R(), r3 = R(), a = (R() - 0.5) * 2.6;
      const at = (oo, aa) => [T.px[i] + T.nx[i] * sd * oo + T.tx[i] * (aa === undefined ? a : aa), T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * (aa === undefined ? a : aa)];
      const ok = (x, z, oo) => { const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * ds >= 6 || q.lat * sd <= 0 || ex(x, z)) return false;
        if (oo < bar && oo > bar - 0.35) return false; const c = lc ? lc(x, z) : 0; return !(c === 3 || c === 5) && rY(x, z) > T.hy[i] - 2.5; };
      const [ux, uz] = at(bar + 3, 0), up = gT(ux, uz) > T.hy[i] + 1.0, cv = lc ? lc(ux, uz) : 0;   // (the uphill side; the cover just past the barrier line)
      // uncut grass: tufts on the verge, thicker at the barrier line's foot
      const nT = Math.max(2, Math.min(4, Math.round((e1 - e0) / 2.2)));   // (a wide verge takes more of them, so it does not thin out)
      for (let k = 0; k < nT; k++) { const u = R(), v = R(), h = R(); if (u > 0.5) continue;
        const oo = k > 0 ? e0 + v * Math.max(0.2, e1 - e0) : bar + 0.25 + v * 0.9, [x, z] = at(oo, (R() - 0.5) * 3);
        if (ok(x, z, oo)) { tuft(soft.get(x, z), x, rY(x, z), z, 0.24 + h * 0.22, 0.28 + h * 0.34, C_(R, hi ? RR.tuftH : RR.tuft, 0.03), R, 4); st.sopi++; } }
      // under the forest: the fallen leaves drifted along the shoulder
      if (cv === 1 && r0 < 0.5) { const oo = e0 + 0.05 + r1 * 0.5, [x, z] = at(oo);
        if (ok(x, z, oo)) { streak(soft.get(x, z), rY, x, z, T.tx[i], T.tz[i], 1.2 + R() * 2.2, 0.22 + R() * 0.2, C_(R, R() < 0.65 ? RR.litter : RR.leaf, 0.02), R, 0.02, 2); st.listje++; } }
      // the uphill side's foot: the small fallen stones, the moss's damp patches
      if (up && !hi) {
        if (r2 < 0.4) { const oo = Math.max(e0, bar - 2.2) + R() * 1.8, [x, z] = at(oo), h = R();
          if (ok(x, z, oo)) { cushion(soft.get(x, z), x, rY(x, z) + 0.05, z, 0.1 + h * 0.2, 0.06 + h * 0.12, C_(R, alt(i) > 1150 ? RR.basalt : RR.sand, 0.02), R); st.kamni++; } }
        if (r3 < 0.3) { const oo = Math.max(e0 + 0.5, bar - 1.6) + R() * 1.2, [x, z] = at(oo);
          if (ok(x, z, oo) && ok(...at(oo + 0.6), oo + 0.6)) { soil(soft, rY, x, z, 0.45 + R() * 0.5, C_(R, RR.moss), R, 0.03); st.mah++; } }
      }
    }
    soft.done();
    return st;
  };

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'pikes' && o && ctx && ctx.out) try { const s = pikesg(ctx, o); if (s) ctx.out.robBt108 = s; } catch (e) { console.error('chase-bt108 (pikesg):', e); }
      if (id === 'rastro' && o && ctx && ctx.out) try { const s = rastro(ctx, o); if (s) ctx.out.robBt108 = s; } catch (e) { console.error('chase-bt108 (rastro):', e); }
      return r;
    };
    Object.assign(f, base);   // (pkLC, LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
