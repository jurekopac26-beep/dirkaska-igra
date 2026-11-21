/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the thirty-first group of the real tracks: Katu and Isalo, a second
   pass on the two roads whose ground the fourteenth group (js/world-chase-bt14.js: the eleventh group's three bands with each track's own
   land cover) already set. From behind the car both still showed one even face beside the road: on Katu the shoulder between the gravel
   and the posts or the parapet in the shoulder's one brown, and on the mountain's side, past the ditch, the cut's steep schist face in one
   smooth brown (the bands leave every steep face bare); on Isalo the sandy strip several metres wide between the asphalt and the low earth
   bank, and the bank itself, in one pale sand. Neither builder is on Vršič's corridor, so BT.verge and BT.bank (js/world-chase-bt24.js,
   js/world-chase-bt25.js: Vršič's nearest road point and verge profile) do not fit them; here the same strip and bank walks with each
   track's own nearest road point (o.near), ground (o.gH) and verge cross-section (js/world-katu.js vProf, js/world-isalo.js vergeRow), so
   every patch lies on the verge as drawn. What lies where follows docs/proge/katu.md and docs/proge/isalo.md. Nothing within 0.35 m of
   the barrier line on the road's side, nothing where another leg's road is nearer, in the builders' excluded places (Katu's camps, car
   parks and kiosks), by the river or in it. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road,
   the verges, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.mix3 || !rng) return;
  const { soil, tuft, cushion, softScen, mix3 } = BT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // (as the twenty-fifth group: the colours toward their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  // (here only a fifth of the way: half way read blue-grey against Katu's straw and Isalo's terracotta in the warm light)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const P = (R, a, b, r0, r1) => ({ col: mute(vary(mix3(a, b, R()), R, 0.015)), r: r0 + R() * r1 });
  const T_ = (R, a, b) => mute(vary(mix3(a, b, R()), R, 0.03), 0.95);

  /* the verge's height at (x, z): the nearest sample's cross-section (C.prof(i, side) gives its points [offset, height above the road]) */
  const profAt = (Q, o) => { let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++; const a = Q[k], b = Q[k + 1]; return a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); };
  const vergeH = (T, near, C) => {
    const cache = [new Map(), new Map()];
    const Q = (i, sd) => { const m = cache[sd > 0 ? 1 : 0]; let q = m.get(i); if (!q) { q = C.prof(i, sd); m.set(i, q); } return q; };
    return (x, z, i0) => { const q = near(x, z), j = q.i >= 0 ? q.i : i0, lat = q.lat; return T.hy[j] + profAt(Q(j, lat >= 0 ? 1 : -1), Math.abs(lat)); };
  };

  /* the strip between the road's edge and the barrier line on both sides, every `step` m: low patches (C.patch(R, i, x, z)) between
     C.e0(i) and C.e1(i, bar), and at its outer edge a few low tufts (C.tuft(R, i)); only on this leg's own strip, not on a bridge or a fill */
  const strip = (root, matV, T, near, gT, seed, C) => {
    const st = { zaplate: 0, sopi: 0 }, R = rng(seed), soft = softScen(root, matV), gV = vergeH(T, near, C), N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), r3 = R(), bar = sd > 0 ? T.br[i] : T.bl[i], e0 = C.e0(i), e1 = C.e1(i, bar);
      if (!(e1 - e0 > 0.7)) continue;
      const at = (o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
      const own = (x, z) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * T.ds < 12 && q.dd <= 0 && Math.abs(q.lat) < bar - 0.3 && q.lat * sd > 0; };
      const sunk = (x, z) => gT(x, z) < T.hy[i] - 3;   // (a bridge or a high fill: the strip is not on the ground there)
      const g = (x, z) => gV(x, z, i);
      if (r0 < C.share) {   // a patch on the strip
        const o = e0 + r1 * (e1 - e0), [x, z] = at(o, (R() - 0.5) * C.step), Pp = C.patch(R, i, x, z), rr = Math.min(Pp.r, (e1 - e0) * 0.55, o - e0 + 0.4, e1 - o + 0.4);
        if (rr > 0.3 && own(x, z) && !sunk(x, z) && !(C.skip && C.skip(x, z))) { soil(soft, g, x, z, rr, Pp.col, R, 0.04); st.zaplate++; }
      }
      if (r2 < C.foot) {   // low tufts at the strip's outer edge
        const n = 1 + Math.floor(r3 * 2);
        for (let q = 0; q < n; q++) { const o = e1 - 0.1 - R() * 0.45, [x, z] = at(o, (R() - 0.5) * 2.4);
          if (!own(x, z) || sunk(x, z) || (C.skip && C.skip(x, z))) continue;
          const h = R(); tuft(soft.get(x, z), x, g(x, z), z, 0.22 + h * 0.16, 0.24 + h * 0.22, C.tuft(R, i), R, 5); st.sopi++; }
      }
    }
    soft.done();
    return st;
  };

  /* the ground past the barrier line on both sides, every `step` m `n` places from C.o0(bar) to C.o0(bar) + C.reach: on gentle ground patches,
     tufts and low cushions (C.bush), on the steep faces up to C.maxSl only C.rock's patches (lying on the face) and at a face's foot a few
     stones (C.stone); not where the ground falls away from the road, not where another leg is nearer. C.h(x, z, i) the height there. */
  const face = (root, matV, T, near, gT, slope, bad, seed, C) => {
    const st = { breg: 0, skala: 0, sopi: 0, grmi: 0, kamni: 0 }, R = rng(seed), soft = softScen(root, matV), N = T.px.length, rock = API.rock;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i], o0 = C.o0(bar);
      for (let k = 0; k < C.n; k++) {
        const r0 = R(), r1 = R(), r2 = R(), r3 = R();
        const o = o0 + Math.pow(r1, 1.3) * C.reach, a = (r2 - 0.5) * C.step;
        const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 14 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0) continue;   // (this leg's side, past its barrier line)
        if (bad(x, z) || (C.skip && C.skip(x, z, i))) continue;
        const gy = gT(x, z); if (!(gy > T.hy[i] - (C.drop || 0.6))) continue;   // (the ground falls away here: nothing seen from the road)
        const sl = slope(x, z), y = C.h ? C.h(x, z, i) : gy;
        if (sl > C.maxSl) continue;
        const g = C.h ? (xx, zz) => C.h(xx, zz, i) : gT;
        if (sl > C.steep) {   // a steep face: the rock's own patches, larger, and at its foot a few stones
          if (r0 < C.rockShare) { const Pp = C.rock(R, sl, i); soil(soft, g, x, z, Pp.r, Pp.col, R, 0.06); st.skala++; }
          if (rock && C.stone && r3 < C.stoneShare && o < o0 + 3) { const s = 0.14 + R() * 0.22; rock(soft.get(x, z), x, y + s * 0.3, z, s * 1.2, s * 0.7, s, R() * 6.283, C.stone(R), R, 0.2); st.kamni++; }
          continue;
        }
        if (r0 < C.share) { const Pp = C.patch(R, sl, i, x, z); soil(soft, g, x, z, Pp.r, Pp.col, R, 0.05); st.breg++; }
        else if (C.bush && sl < C.sl && r3 < C.bushShare && (!C.bushAt || C.bushAt(x, z))) { const h = R(); cushion(soft.get(x, z), x, y, z, 0.45 + h * 0.45, 0.3 + h * 0.3, C.bush(R, x, z), R); st.grmi++; }
        else { const h = R(); tuft(soft.get(x, z), x, y, z, 0.24 + h * 0.18, 0.28 + h * 0.26, C.tuft(R, x, z), R, 5); st.sopi++; }
      }
    }
    soft.done();
    return st;
  };

  /* Katu: docs/proge/katu.md: »makadam iz zdrobljenega rjavega skrilavca … za avtom se dviga prah«, »ob cesti rastejo šopi stepske bilnice in
     cvetje«, »strma pobočja so skalnata (rjavo siv skrilavec)«, »sončna pobočja so suha stepa z grmi karagane in brinom«, larches on the shady
     slopes. On the shoulder the crushed schist's grit in browner and greyer patches, the pale dust the cars throw onto it, the dry steppe grass
     reaching in from the outer edge, the fescue's olive and straw tufts at the posts' foot (under the larches the moss's green and the fallen
     needles). Past the ditch, on the cut's steep faces, the schist itself in grey-brown, rusty and darker patches, a few fallen stones at their
     foot; where the bank is gentle the steppe's grass and bare grit in patches, the fescue's tufts, the caragana's and juniper's low bushes. */
  const KT_PROF = (T, gT) => (i, sd) => {   // (js/world-katu.js vProf, without its side roads' mouths: ex is the ground as the strips draw it)
    const w = T.wAt ? T.wAt(i) : T.w, bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], ex = (o) => gT(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) - y, L = Math.max(w + 1.2, bar - 0.7);
    return [[w + 0.6, -0.03], [L, clamp(ex(L) + 0.05, -0.12, 0.3)], [bar + 0.45, clamp(ex(bar + 0.45) - 0.25, -1, -0.42)], [bar + 1.15, clamp(ex(bar + 1.15) + 0.03, -1.3, 0.8)]]; };
  const KTV = (lc) => ({ step: 3.2, share: 0.6, foot: 0.08,
    e0: () => 0, e1: (i, bar) => bar - 0.35,
    patch: (R, i, x, z) => { const r = R(), wood = lc && lc(x, z) === 1;
      if (wood && r < 0.45) return P(R, [0.42, 0.44, 0.27], [0.47, 0.38, 0.27], 0.6, 0.7);   // (moss and fallen larch needles)
      return r < 0.35 ? P(R, [0.6, 0.55, 0.47], [0.64, 0.58, 0.5], 0.5, 0.7)   // (the schist grit, browner)
        : r < 0.6 ? P(R, [0.6, 0.55, 0.47], [0.63, 0.58, 0.5], 0.5, 0.7)   // (greyer)
        : r < 0.78 ? P(R, [0.76, 0.71, 0.62], [0.8, 0.74, 0.65], 0.5, 0.6)   // (the pale dust)
        : P(R, [0.6, 0.58, 0.36], [0.7, 0.63, 0.43], 0.6, 0.7); },   // (dry steppe grass from the edge)
    tuft: (R) => T_(R, [0.62, 0.6, 0.34], [0.82, 0.72, 0.46]) });
  const KTB = (lc) => ({ step: 4.2, n: 2, reach: 12, share: 0.85, maxSl: 3.2, steep: 1.0, rockShare: 0.75, stoneShare: 0.04, sl: 0.8, bushShare: 0.1,
    o0: (bar) => bar + 2.0,
    rock: (R, sl) => { const r = R();
      return r < 0.4 ? P(R, [0.56, 0.49, 0.4], [0.6, 0.53, 0.43], 1.0, 1.1)   // (grey-brown schist)
        : r < 0.7 ? P(R, [0.56, 0.47, 0.38], [0.6, 0.5, 0.4], 0.9, 1.0)   // (rusty)
        : P(R, [0.46, 0.41, 0.34], [0.5, 0.45, 0.37], 0.8, 0.9 + 0.2 * Math.min(1, sl - 1)); },   // (darker, the shade of its ribs)
    stone: (R) => vary([0.5, 0.47, 0.43], R, 0.06),
    patch: (R, sl, i, x, z) => { const r = R(), wood = lc && lc(x, z) === 1;
      if (wood) return r < 0.5 ? P(R, [0.42, 0.44, 0.27], [0.46, 0.47, 0.3], 0.9, 1.1) : P(R, [0.47, 0.38, 0.27], [0.5, 0.41, 0.3], 0.8, 1.0);   // (moss, needles)
      return r < 0.4 ? P(R, [0.64, 0.57, 0.46], [0.68, 0.6, 0.48], 0.8, 1.0)   // (bare grit)
        : P(R, [0.62, 0.6, 0.36], [0.74, 0.66, 0.44], 0.9, 1.2); },   // (the steppe's dry grass)
    tuft: (R) => T_(R, [0.62, 0.6, 0.34], [0.82, 0.72, 0.46]),
    bush: (R) => mute(vary(R() < 0.6 ? [0.5, 0.54, 0.36] : [0.42, 0.5, 0.36], R, 0.025), 0.97),   // (caragana, juniper)
    bushAt: (x, z) => !lc || lc(x, z) !== 1,
    skip: (x, z) => { const c = lc ? lc(x, z) : 0; return c === 3 || c === 5; } });

  /* Isalo: docs/proge/isalo.md: »zlata trava in rdeča prst, grmičevje … nizek zemeljski nasip ob robovih«. On the sandy strip between the
     asphalt and the bank the red earth the rain washes down off the bank in low patches, paler sand, flattened golden grass, at the bank's
     foot the grass's golden tufts; on the low earth bank and just past it the golden grass in tufts and patches, the red earth bare between
     them, here and there the scrub's low green-olive bush. Nothing on the sandstone's steep faces, in the built-up places or the water. */
  const NR_PROF = (T, gT) => (i, sd) => {   // (js/world-isalo.js vergeRow: the bank lifted onto the ground where it rises)
    const w = T.wAt ? T.wAt(i) : T.w, bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => [o, Math.max(h, gT(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) + 0.06 - y)];
    return [[w, 0.0], [w + 0.8, -0.04], lift(Math.max(w + 1.2, bar - 0.5), -0.08), lift(bar + 2.6, -0.2), lift(bar + 4.2, -0.4)]; };
  const NRV = { step: 2.6, share: 0.6, foot: 0.2,
    e0: (i) => 0, e1: (i, bar) => bar - 0.55,
    patch: (R) => { const r = R();
      return r < 0.4 ? P(R, [0.84, 0.46, 0.3], [0.88, 0.5, 0.32], 0.6, 0.8)   // (red earth washed down)
        : r < 0.65 ? P(R, [0.96, 0.78, 0.54], [0.98, 0.82, 0.58], 0.6, 0.7)   // (paler sand)
        : P(R, [0.92, 0.74, 0.4], [0.96, 0.8, 0.46], 0.6, 0.8); },   // (flattened golden grass)
    tuft: (R) => T_(R, [0.96, 0.8, 0.44], [0.9, 0.78, 0.5]) };
  const NRB = (lc) => ({ step: 3.0, n: 2, reach: 4.0, share: 0.6, maxSl: 1.2, steep: 9, sl: 0.8, bushShare: 0.15, drop: 1.0,
    o0: (bar) => bar - 0.3,
    patch: (R) => R() < 0.55 ? P(R, [0.84, 0.46, 0.3], [0.88, 0.5, 0.32], 0.7, 0.8) : P(R, [0.9, 0.76, 0.44], [0.95, 0.8, 0.5], 0.7, 0.9),   // (red earth, golden grass)
    tuft: (R) => T_(R, [0.96, 0.8, 0.44], [1.0, 0.9, 0.6]),
    bush: (R) => mute(vary([0.6, 0.6, 0.34], R, 0.025), 0.97),   // (the scrub)
    skip: (x, z) => { const c = lc ? lc(x, z) : 0; return c === 3 || c === 4 || c === 5; } });

  const run = (ctx, id, o) => {
    const out = ctx.out, T = API.T, near = o && o.near, gT = o && o.gH;
    if (!out || !out.matV || !ctx.root || !T || !T.br || !near || !gT) return;
    const ex = ctx.excluded || (() => false), slope = o.slope || ((x, z) => { const d = 0.8; return Math.hypot(gT(x + d, z) - gT(x - d, z), gT(x, z + d) - gT(x, z - d)) / (2 * d); });
    const bad = (x, z) => ex(x, z) || (o.bad ? o.bad(x, z) : false);
    if (id === 'katu') {
      const C = Object.assign(KTV(o.lc), { prof: KT_PROF(T, gT), e0: (i) => (T.wAt ? T.wAt(i) : T.w) + 0.9 });
      out.robBt31 = strip(ctx.root, out.matV, T, near, gT, 31101, Object.assign(C, { skip: bad }));
      const B = KTB(o.lc); out.bregBt31 = face(ctx.root, out.matV, T, near, gT, slope, bad, 31102, B);
    } else if (id === 'isalo') {
      const prof = NR_PROF(T, gT), C = Object.assign({}, NRV, { prof, e0: (i) => (T.wAt ? T.wAt(i) : T.w) + 0.9, skip: bad });
      out.robBt31 = strip(ctx.root, out.matV, T, near, gT, 31201, C);
      const hV = vergeH(T, near, { prof }), B = Object.assign(NRB(o.lc), { h: (x, z, i) => { const q = near(x, z), b = q.i >= 0 ? (q.lat > 0 ? T.br[q.i] : T.bl[q.i]) : 0;
        return Math.abs(q.lat) < b + 4.2 ? hV(x, z, i) : gT(x, z); } });   // (on the bank its own cross-section, past it the ground)
      out.bregBt31 = face(ctx.root, out.matV, T, near, gT, slope, bad, 31202, B);
    }
  };

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'katu' || id === 'isalo') try { run(ctx, id, o); } catch (e) { console.error('chase-bt31 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
