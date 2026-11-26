/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-fourth group of the real tracks: Sepang, a
   further pass on a circuit whose ground the fifty-fifth group set (js/world-chase-bt55.js: the verge's lush, mown and wet patches inside
   the fences, tufts at the fences' foot, and wide flat patches from 16 m to ~60 m past them). From behind the car the strip right
   behind the fences, the first ~16 m that the camera sees best, was still the builder's even striped lawn with nothing on it, and
   under the palms and in the secondary growth the ground there was the same green.
   So here (docs/proge/sepang.md: »bujne tropske trate s pokošenimi pasovi, zalite do ograj in dlje … palme, v vlažnih kotih temno
   grmičevje sekundarnega gozda«), chained on the look's extra (js/world-rbring.js rbLook.sepang), from ~1.2 m to ~16 m past the fence:
   on the lawns (land cover 0) low flat patches of the lush, the mown and the wet green and a few low tufts of uncut grass; under the oil
   palms (1) the brown floor, fallen dry fronds and low ferns; in the secondary growth (2) dark low cushions and the dark floor.
   Sparse (the phone's busiest frame on this circuit stands at 899 of 900 thousand vertices: tests/golden/perf.json), and nothing within
   330 m of the two big grandstands, where that frame is (it gains ~0.4 thousand: 899.9); nothing on built ground or water (3, 6), on the pits' side along the pits, in
   the builder's excluded places, where another leg's road is nearer, on a steep face or far below the road. Hakone, the group's other
   track, is left as it is here. All of it in meshes of its own (softScen: 256 m chunks, no shadow); the terrain, the road, the fences,
   the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt85.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.015), k);
  const T3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.03), k || 0.97);

  // (the colours of js/world-chase-bt55.js SP, so the strip joins the verge inside the fence and the band past 16 m)
  const SP = {
    lush: [[0.22, 0.4, 0.14], [0.25, 0.43, 0.16]], mown: [[0.4, 0.55, 0.24], [0.44, 0.58, 0.27]], wet: [[0.2, 0.33, 0.14], [0.23, 0.36, 0.16]],
    palmF: [[0.22, 0.25, 0.13], [0.26, 0.28, 0.15]], frond: [[0.42, 0.34, 0.2], [0.47, 0.38, 0.23]], under: [[0.17, 0.27, 0.12], [0.2, 0.3, 0.14]],
    fern: [[0.2, 0.36, 0.14], [0.24, 0.4, 0.16]], tuft: [[0.3, 0.46, 0.18], [0.4, 0.52, 0.24]],
  };
  const SKIP = 330;   // (m either end of a big stand along the lap, both sides)
  const C = { step: 14, from: 1.2, reach: 16, keep: 0.5, drop: 6, rise: 8, maxSl: 0.8,
    pick: (R, d, c) => { const r = R();
      if (c === 1) return r < 0.5 ? { c: 'tla', k: 'p', r: 1.3 + R() * 1.2, col: C3(R, SP.palmF) } : r < 0.82 ? { c: 'listi', k: 'p', r: 0.8 + R() * 0.7, col: C3(R, SP.frond) }
        : { c: 'praprot', k: 'g', w: 0.6, h: 0.3, col: T3(R, SP.fern) };
      if (c === 2) return r < 0.55 ? { c: 'tla', k: 'p', r: 1.3 + R() * 1.3, col: C3(R, SP.under) } : { c: 'grmi', k: 'g', w: 0.8, h: 0.42, col: T3(R, SP.under) };
      if (r < 0.34) return { c: 'zaplate', k: 'p', r: 1.3 + R() * 1.5, col: C3(R, SP.lush) };
      if (r < 0.66) return { c: 'zaplate', k: 'p', r: 1.3 + R() * 1.5, col: C3(R, SP.mown) };
      if (r < 0.86) return { c: 'zaplate', k: 'p', r: 1.1 + R() * 1.2, col: C3(R, SP.wet) };
      return { c: 'sopi', k: 't', w: 0.3, h: 0.26, col: T3(R, SP.tuft), n: 5 }; } };

  const sepang = (ctx) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear, nrLC } = API;
    if (!root || !matV || !T || !T.br || !T.bl || !nrGround || !nrNear || (T.def && T.def.id !== 'sepang')) return null;
    const N = T.px.length, ds = T.ds, Lt = T.len, pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0, S = (T.def && T.def.stands) || [];
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const byStand = (i) => { if (!Lt) return false; const d = i * ds - (T.startS || 0);
      for (const s of S) { if (s[3] < 12) continue; for (const dd of [d, d - Lt, d + Lt]) if (dd > s[0] - SKIP && dd < s[1] + SKIP) return true; } return false; };
    const slope = (x, z) => { const a = nrGround(x + 1, z) - nrGround(x - 1, z), b = nrGround(x, z + 1) - nrGround(x, z - 1); return Math.hypot(a, b) / 2; };
    const R = rng(104100), soft = softScen(root, matV), st = {};
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R();
      if (r0 > C.keep || byStand(i) || (sd === PSD && pitI(i))) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + r1 * (C.reach - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a, q = nrNear(x, z);
      if (q.i < 0 || gap(q.i, i, N) * ds > o + 12 || q.lat * sd < 0 || byStand(q.i) || excluded(x, z)) continue;
      const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + 0.8) continue;   // (on or by a road: this leg's or another's)
      if (PSD && Math.sign(q.lat) === PSD && pitI(q.i)) continue;
      const y = nrGround(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || slope(x, z) > C.maxSl) continue;
      const c = nrLC ? nrLC(x, z) : 0; if (c === 3 || c === 6) continue;
      const P = C.pick(R, o - bar, c), h = R(); if (!P) continue;
      if (P.k === 'p') soil(soft, nrGround, x, z, Math.min(P.r, Math.abs(q.lat) - qb + 0.2), P.col, R, 0.05);
      else if (P.k === 'g') cushion(soft.get(x, z), x, y, z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
      else tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
      st[P.c] = (st[P.c] || 0) + 1;
    }
    soft.done(); return st;
  };
  const L = API.rbLook || {};
  if (L.sepang) chain(L.sepang, (ctx) => { try { if (ctx.out) ctx.out.pasBt104 = sepang(ctx); } catch (e) { console.error('chase-bt104 (sepang):', e); } });
})();
