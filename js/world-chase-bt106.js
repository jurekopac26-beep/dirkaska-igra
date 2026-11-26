/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-sixth group of the real tracks: Sakhir and
   Silkeborg, a further pass on two circuits whose ground the earlier groups set (Sakhir: js/world-chase-bt37.js, js/world-chase-bt62.js:
   flat patches of grit, drifts and crust past the barriers to ~60 m, the strip between the asphalt and the barriers; Silkeborg:
   js/world-chase-bt47.js, js/world-chase-bt69.js: straw at the fences, the worn first metre, wide flat patches of heather, straw, sand
   and needles to ~58 m). From behind the car, on Sakhir the desert past the barriers was still a plain with flat spots, nothing standing
   on it; on Silkeborg the mown grass between the asphalt and the barriers was one even green and the heath past them flat patches with
   a few dots. So here, both chained on the looks' extra (js/world-rbring.js rbLook) and in the builder's own chunks (no new draw calls):
   Sakhir (docs/proge/sakhir.md: »puščava spomladi: bled pesek, temnejši grušč in kamenje v lisah, svetlejši nanosi peska … puščavsko
   grmičevje«), from ~2.5 m past the barrier line to ~46 m, only on the sand (never land cover 1 and 3): low dusty desert shrubs in loose groups,
   dry pale tufts, standing stones by the grit, and now and then a paler drift; thin, as a desert is.
   Silkeborg (docs/proge/silkeborg.md: »resava z reso (vijolično-rjava) in nizkimi bori, suha trava in peščene zaplate«): on the grass
   between the asphalt and the barriers low patches of a drier yellowed and a darker damp green; from ~3 m past the barrier line to
   ~58 m standing tufts of the dry grass, heather cushions (more on the heath, land cover 2), a low young pine now and then, and under
   the plantations (1) low moss and bilberry-green cushions.
   Nothing on the lawns, the car parks and the built ground (Sakhir: 1, 3), on the sand run-offs (Silkeborg's mask), on the pits' side
   along the pits, in the builders' excluded places, where another leg's road is nearer, on a face too steep. The terrain, the road, the
   barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt85.js: a third of the way toward the colour's grey, so a thing reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, ab, k) => mute(vary(mix3(ab[0], ab[1], R()), R, 0.015), k);
  const T3 = (R, ab, k) => mute(vary(mix3(ab[0], ab[1], R()), R, 0.03), k || 0.97);

  /* the band (as js/world-chase-bt85.js's): every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m
     (denser near); each place a small group (C.grp things within C.spread m), so it reads as clumps, not as an even sprinkle */
  const band = (scen, near, gT, slope, lc, bad, R, C, st) => {
    const T = API.T, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (q.i < 0 || gap(q.i, i, N) * T.ds > oo + 12) continue;
          const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (on or by a road: this leg's or another's)
          if (bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
          const c = lc ? lc(x, z) : 0; if (C.skip && C.skip(c)) continue;
          const P = C.pick(R, oo - bar, s, c, x, z), h = R(); if (!P) continue;
          if (P.k === 'p') soil(scen, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g' || P.k === 's') cushion(scen.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(scen.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };
  const env = (ctx) => {
    const T = API.T, { nrGround, nrNear, nrLC } = API;
    if (!ctx || !ctx.scen || !T || !T.br || !T.wAt || !nrGround || !nrNear || !nrLC) return null;
    const ex = ctx.excluded || (() => false), ds = T.ds, pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const pit = (x, z) => { if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const slope = (x, z) => { const d = 1.0, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    return { T, scen: ctx.scen, gH: nrGround, near: nrNear, lc: nrLC, slope, bad: (x, z) => ex(x, z) || pit(x, z), PSD, pitI };
  };

  /* ---- Sakhir: the desert past the barriers (colours of js/world-chase-bt62.js SK: drift, dusty, stone, tuft) ---- */
  const SA = { drift: [[0.9, 0.83, 0.66], [0.87, 0.8, 0.63]], shrub: [[0.5, 0.5, 0.36], [0.57, 0.55, 0.4]], twig: [[0.55, 0.47, 0.34], [0.6, 0.52, 0.38]],
    stone: [[0.5, 0.44, 0.37], [0.6, 0.52, 0.43]], tuft: [[0.62, 0.6, 0.42], [0.7, 0.66, 0.46]] };
  const SAF = { step: 6.5, n: 2, grp: 3, spread: 5, from: 2.5, reach: 46, pw: 1.6, drop: 6, rise: 10, maxSl: 0.6,
    keep: (d) => d < 26 ? 0.78 : 0.3,   // (sparser far out: the vertex budget on the phone)
    skip: (c) => c === 1 || c === 3,
    pick: (R, d) => { const r = R(), w = d < 28 ? 1.3 : 1.8;
      if (r < 0.34) return { c: 'grmi', k: 'g', w: 0.8 * w, h: 0.42, col: T3(R, SA.shrub) };   // (low dusty desert shrubs)
      if (r < 0.46) return { c: 'grmi', k: 'g', w: 0.6 * w, h: 0.32, col: T3(R, SA.twig) };   // (dry, leafless)
      if (r < 0.72) return { c: 'sopi', k: 't', w: 0.32 * w, h: 0.42, col: T3(R, SA.tuft) };
      if (r < 0.9) return { c: 'kamni', k: 's', w: 0.42 * w, h: 0.22, col: T3(R, SA.stone, 0.95) };
      return { c: 'nanosi', k: 'p', r: 1.4 + R() * 2.0, col: C3(R, SA.drift, 0.98) }; } };
  const sakhir = (ctx) => {
    const E = env(ctx); if (!E) return null;
    return band(E.scen, E.near, E.gH, E.slope, E.lc, E.bad, rng(106100), SAF, {});
  };

  /* ---- Silkeborg (colours of js/world-chase-bt69.js SK: heath, bloom, straw, moss, edge) ---- */
  const SI = { heath: [[0.42, 0.31, 0.3], [0.48, 0.32, 0.44]], straw: [[0.66, 0.6, 0.38], [0.58, 0.56, 0.34]], pine: [[0.2, 0.33, 0.19], [0.24, 0.37, 0.21]],
    moss: [[0.34, 0.42, 0.22], [0.3, 0.4, 0.2]], dry: [[0.46, 0.52, 0.25], [0.52, 0.54, 0.29]], damp: [[0.24, 0.4, 0.14], [0.27, 0.43, 0.16]] };
  const SIF = { step: 4.5, n: 4, grp: 3, spread: 3.5, from: 3, reach: 58, pw: 1.3, drop: 8, rise: 14, maxSl: 0.8,
    keep: (d) => d < 25 ? 0.8 : 0.62,
    skip: (c) => c !== 0 && c !== 1 && c !== 2,
    pick: (R, d, s, c) => { const r = R(), w = d < 25 ? 1.3 : 1.8;
      if (c === 1) return r < 0.6 ? { c: 'mah', k: 'g', w: 0.7 * w, h: 0.22, col: T3(R, SI.moss) } : null;   // (the plantations' floor: moss, bilberry)
      const hp = c === 2 ? 0.5 : 0.22;
      if (r < hp) return { c: 'resa', k: 'g', w: 0.75 * w, h: 0.34, col: T3(R, SI.heath) };
      if (r < hp + 0.45) return { c: 'sopi', k: 't', w: 0.36 * w, h: 0.5, col: T3(R, SI.straw) };
      if (c === 2 && r > 0.95) return { c: 'bori', k: 't', w: 0.55 * w, h: 1.2, col: T3(R, SI.pine), n: 6 };   // (a low young pine)
      return null; } };
  /* the mown grass between the asphalt and the barriers: low patches of a drier and a damper green, 1.6 m past the edge to 0.8 m
     before the barrier, where the strip is wide enough; never on the sand run-offs or along the pits */
  const lawn = (E, sand, R, st) => {
    const T = E.T, N = T.px.length, bankY = API.nrBankY || (() => 0), w0 = T.w, cl = (v) => v < 0 ? 0 : v > 1 ? 1 : v; st.trata = 0;
    // (the verge's own surface, as js/world-chase-bt69.js's profile: the road's height falling a little to the barrier, never under the terrain)
    const prof = (i, sd) => { const bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => [o, Math.max(h, E.gH(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) + 0.06 - y - bankY(i, sd * o))];
      return [[w0, 0.0], [w0 + 1.2, -0.04], lift(Math.max(w0 + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16)]; };
    const hAt = (i, sd, o) => { const Q = prof(i, sd); let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++; const a = Q[k], b = Q[k + 1];
      return T.hy[i] + bankY(i, sd * o) + a[1] + (b[1] - a[1]) * cl((o - a[0]) / Math.max(1e-3, b[0] - a[0])); };
    const hV = (i0) => (x, z) => { const q = E.near(x, z), j = q.i >= 0 && gap(q.i, i0, N) < 12 ? q.i : i0; return hAt(j, q.lat >= 0 ? 1 : -1, Math.abs(q.lat)); };
    const ro = (i, sd) => { const gv = sd > 0 ? T.gravR : T.gravL; if (!gv) return false; const m = Math.round(12 / T.ds);
      for (let d = -m; d <= m; d += Math.max(1, Math.round(4 / T.ds))) if (gv[(i + d + N) % N]) return true; return false; };
    for (let i = 0; i < N; i += Math.max(1, Math.round(3.2 / T.ds))) for (const sd of [-1, 1]) {
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], r0 = R(), r1 = R(), r2 = R(), r3 = R();
      if (bar - w < 4 || r0 > 0.8 || (E.PSD === sd && E.pitI(i)) || ro(i, sd)) continue;
      const o = w + 1.6 + r1 * (bar - w - 2.4), a = (r2 - 0.5) * 3;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = E.near(x, z); if (q.i < 0 || gap(q.i, i, N) * T.ds > 8 || Math.sign(q.lat) !== sd || Math.abs(q.lat) < T.wAt(q.i) + 1.2) continue;
      if (Math.abs(q.lat) > (sd > 0 ? T.br[q.i] : T.bl[q.i]) - 0.6) continue;
      if (E.bad(x, z) || sand(x, z) > 0.15 || E.lc(x, z) === 3 || E.slope(x, z) > 0.6) continue;
      const rr = Math.min(0.9 + r3 * 1.4, (bar - o) * 0.9, (o - w - 0.5) * 0.9); if (rr < 0.5) continue;
      soil(E.scen, hV(i), x, z, rr, C3(R, R() < 0.6 ? SI.dry : SI.damp, 0.98), R, 0.035); st.trata++;
    }
  };
  const silkeborg = (ctx) => {
    const E = env(ctx); if (!E) return null;
    const sand = API.skSand || (() => 0), bad = (x, z) => E.bad(x, z) || sand(x, z) > 0.2, st = {};
    band(E.scen, E.near, E.gH, E.slope, E.lc, bad, rng(106200), SIF, st);
    lawn(E, sand, rng(106201), st);
    return st;
  };

  const L = API.rbLook || {};
  const on = (id, f) => { if (L[id]) chain(L[id], (ctx, r) => { const T = API.T; if (!T || (T.def && T.def.id !== id)) return;
    try { const o = (ctx && ctx.out) || r; const st = f(ctx); if (o) o.robBt106 = st; } catch (e) { console.error('chase-bt106 (' + id + '):', e); } }); };
  on('sakhir', sakhir);
  on('silkeborg', silkeborg);
})();
