/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixty-third group of the real tracks: Zandvoort and Spa.
   From behind the car both still showed, past the bands of the earlier groups, one smooth face to the horizon: in Zandvoort the dunes
   past ~35 m (js/world-chase-bt6.js's marram and scrub thin out by there, js/world-chase-bt34.js stops ~4.5 m past the rail), in Spa
   the meadows and the wood floor past ~40 m (js/world-chase-bt9.js's uncut strip, wood edge and hay stop there).
   So here, out to ~60 m: Zandvoort (shared builder js/world-rbring.js, LK.extra chained; docs/proge/zandvoort.md: »sipine s šopi trave,
   grmi rakitovca in razpihani peščeni žepi«, »borovci in breze v redkih sestojih«) the grey dune's moss and lichen ground, blown sand
   pockets, loose drifts of marram and cushions of sea buckthorn, the pines' needle litter, a few uncut tussocks; never in the ponds,
   the excluded places, the built ground or on the pits' side. Spa (js/world-spa.js, World.ext.spaRob wrapped after bt9's; docs/proge/
   spa.md: »sveži zeleni pašniki in senožeti«, smreke v ravnih vrstah, posekane jase s praprotjo in mladjem, tla pod smrekami rjava od
   iglic) taller hay in loose groups on the meadows, the needles' brown under the spruce rows, bracken and young growth on the glades;
   never in the brook, on steep ground or the built ground. Both in the builders' own scenery chunks; the terrain, the road, the
   barriers, the horizon and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, sstep } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.mix3 || !vary || !rng || !sstep) return;
  const { soil, tuft, cushion, mix3 } = BT;

  const chain = (id, key, fn) => {
    const L = (API.rbLook || {})[id]; if (!L) return;
    const base = L.extra;
    L.extra = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      if (API.THEME === id) try { r[key] = fn(ctx); } catch (e) { console.error('chase-bt63 (' + id + '):', e); }
      return r;
    };
  };
  const pitSide = (T) => { const pd = T.def.pit; return pd ? (pd[0] < 0 ? -1 : 1) : 0; };

  /* ---- Zandvoort: every ~5 m on both sides a place 30-60 m past the barrier ---- */
  const ZF = { seed: 63101, step: 5, share: 0.7, from: 30, to: 60,
    grey: [0.6, 0.6, 0.47], grey2: [0.52, 0.55, 0.4], sand: [0.84, 0.78, 0.6], sand2: [0.8, 0.74, 0.57],
    marram: [0.5, 0.56, 0.36], straw: [0.74, 0.7, 0.46], buck: [0.42, 0.48, 0.32], needle: [0.5, 0.42, 0.3], uncut: [0.42, 0.52, 0.26], hay: [0.56, 0.56, 0.32] };
  // the ponds of def.sk.pond (5 m cells, the run-length mask js/world-zandvoort.js reads): any wet cell within a cell's reach
  const pondMask = (def) => {
    const P = def.sk && def.sk.pond, A = API.NR_A64; if (!P || !A) return () => false;
    const { x0, z0, nx, nz, cell: C } = P, n = nx * nz, M = new Uint8Array(n);
    for (let p = 0, k = 0; k < n && p < P.rle.length;) { const v = A.indexOf(P.rle[p++]); let r = (v & 31) + 1; if ((v & 31) === 31) { let e; do { e = A.indexOf(P.rle[p++]); r += e; } while (e === 63); } M.fill(v >> 5, k, Math.min(n, k + r)); k += r; }
    return (x, z) => { const i = Math.floor((x - x0) / C), j = Math.floor((z - z0) / C);
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const I = i + a, J = j + b; if (I >= 0 && J >= 0 && I < nx && J < nz && M[J * nx + I]) return true; }
      return false; };
  };
  chain('zandvoort', 'robBt63', (ctx) => {
    const T = API.T, { nrGround: gH, nrLC, nrSlope, nrNear, NR: P } = API, scen = ctx.scen;
    const st = { siva: 0, pesek: 0, sopi: 0, grmi: 0, iglice: 0, trava: 0 };
    if (!T || !T.br || !gH || !nrLC || !nrNear || !scen || !P) return st;
    const ex = ctx.excluded || (() => false), pond = pondMask(T.def), ps = pitSide(T), N = T.px.length;
    const gap = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
    const free = (x, z, r) => { const q = nrNear(x, z); return q.i >= 0 && q.dd > r && !ex(x, z) && !pond(x, z); };
    const R = rng(ZF.seed);
    for (let i = 0; i < N; i += Math.max(1, Math.round(ZF.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), r3 = R(), r4 = R(); if (r0 > ZF.share) continue;
      if (ps && sd === ps && T.pitAt(i * T.ds)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], off = bar + ZF.from + r1 * (ZF.to - ZF.from), a = (r2 - 0.5) * ZF.step;
      const x = T.px[i] + T.nx[i] * sd * off + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * off + T.tz[i] * a;
      const q = nrNear(x, z); if (q.i < 0 || gap(q.i, i) * T.ds > off + 10 || !free(x, z, 12)) continue;   // (another leg's road is nearer: its own band)
      const c = nrLC(x, z), sl = nrSlope ? nrSlope(x, z) : 0; if (c === 3 || sl > 1.2) continue;
      const k = 1 + 0.4 * (off - bar - ZF.from) / (ZF.to - ZF.from);
      if (c === 1) { soil(scen, gH, x, z, (1.4 + r3 * 1.4) * k, vary(ZF.needle, R, 0.03), R, 0.05); st.iglice++; continue; }
      if (c === 0) {   // the rough grass between the dunes: a few uncut tussocks, browner where the look's noise dries it
        const dry = sstep(0.4, 0.75, P.n3(x * 0.6 + 40, z * 0.6));
        for (let t = 0, n = 2 + Math.floor(r3 * 3); t < n; t++) { const tx = x + (R() - 0.5) * 5, tz = z + (R() - 0.5) * 5, h = R();
          if (!free(tx, tz, 8) || nrLC(tx, tz) !== 0) continue;
          tuft(scen.get(tx, tz), tx, gH(tx, tz), tz, 0.35 + h * 0.35, 0.32 + h * 0.3, vary(mix3(ZF.uncut, ZF.hay, Math.min(1, dry * 0.7 + R() * 0.3)), R, 0.03), R, 5); st.trava++; }
        continue;
      }
      if (c !== 2) continue;
      // the dunes: the ground first (the blown sand on the gentler slopes, else the grey dune's moss and lichen), then a drift on it
      const sc = sstep(0.55, 0.78, P.n2(x * 0.9 - 130, z * 0.9 + 70)), dry = P.n3(x * 0.6 + 40, z * 0.6);
      if (sl < 0.4 && r4 < 0.3) { soil(scen, gH, x, z, (1.5 + r3 * 1.8) * k, vary(mix3(ZF.sand, ZF.sand2, R()), R, 0.02), R, 0.05); st.pesek++; }
      else { soil(scen, gH, x, z, (1.6 + r3 * 1.8) * k, vary(mix3(ZF.grey, ZF.grey2, R()), R, 0.025), R, 0.05); st.siva++; }
      for (let t = 0, n = 2 + Math.floor(R() * 4); t < n; t++) {
        const tx = x + (R() - 0.5) * 8, tz = z + (R() - 0.5) * 8, h = R(), b = R();
        if (!free(tx, tz, 8) || nrLC(tx, tz) !== 2) continue;
        if (b < 0.35 * sc) { cushion(scen.get(tx, tz), tx, gH(tx, tz), tz, 0.8 + h * 0.8, 0.4 + h * 0.4, vary(ZF.buck, R, 0.025), R); st.grmi++; }
        else { tuft(scen.get(tx, tz), tx, gH(tx, tz), tz, 0.4 + h * 0.4, 0.42 + h * 0.45, vary(mix3(ZF.marram, ZF.straw, Math.min(1, dry * 0.8 + b * 0.4)), R, 0.03), R, 3); st.sopi++; }
      }
    }
    return st;
  });

  /* ---- Spa: past js/world-chase-bt9.js's bands (the barrier's uncut strip, the woods' edge to ~28 m, the hay to ~40 m) out to ~60 m ---- */
  const SP = { seed: 63301, step: 4, from: 40, reach: 20,
    hay: [0.4, 0.55, 0.24], seed2: [0.66, 0.64, 0.38], need: [[0.36, 0.29, 0.2], [0.42, 0.33, 0.22]], fern: [0.34, 0.56, 0.14], young: [0.2, 0.36, 0.17] };
  const base = (World.ext || {}).spaRob;
  if (base && BT.walk && BT.softScen && BT.rbEnv) World.ext.spaRob = (ctx) => {
    const r = base(ctx) || {};
    try { r.bt63 = spaFar(ctx); } catch (e) { console.error('chase-bt63 (spa):', e); }
    return r;
  };
  const vn = (x, z) => { const h = (i, j) => { const t = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return t - Math.floor(t); };
    const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
    return (h(i, j) * (1 - a) + h(i + 1, j) * a) * (1 - b) + (h(i, j + 1) * (1 - a) + h(i + 1, j + 1) * a) * b; };
  function spaFar(ctx) {
    const { nrLC, nrGround: gH, nrSlope, nrGCol } = API, st = { seno: 0, iglice: 0, praprot: 0, mlade: 0 };
    if (!nrLC || !gH || !API.T) return st;
    const { excluded, inBrook, root, matV } = ctx, soft = BT.softScen(root, matV);
    const env = BT.rbEnv((x, z) => excluded(x, z) || (inBrook ? inBrook(x, z, 3) : false));
    const sl = (x, z) => (nrSlope ? nrSlope(x, z) : 0);
    const gc = (x, z) => { const c = nrGCol ? nrGCol(x, z) : [0.4, 0.55, 0.3]; return [c[0] * 0.95, c[1] * 1.02, c[2] * 0.9]; };
    const up = (c, k) => [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)];
    BT.walk(env, SP.seed, SP.step, SP.reach, SP.from, (x, z) => { const c = nrLC(x, z); if (c === 3 || sl(x, z) > 1.1) return 0;
      return c === 0 ? 0.55 * (0.4 + 0.6 * sstep(0.3, 0.7, vn(x / 27 + 11, z / 27 - 5))) : 0.8; }, (gx, gz, k, R, free) => {
      const c = nrLC(gx, gz);
      if (c === 0) {   // the hay meadow: taller grass in loose groups, seed heads catching the light
        for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) { const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = R();
          if (!free(x, z, 34)) continue;
          tuft(soft.get(x, z), x, gH(x, z), z, 0.5 + h * 0.5, 0.38 + h * 0.36, vary(up(mix3(mix3(gc(x, z), SP.hay, 0.4), SP.seed2, 0.15 + R() * 0.3), 1.28), R, 0.03), R, 4); st.seno++; }
        return;
      }
      // the spruce rows (1) and the felled glades (2): the needles' brown, on the glades the bracken and young growth on it
      if (free(gx, gz, 34)) { soil(soft, gH, gx, gz, 1.8 + R() * 2.4, vary(mix3(SP.need[0], SP.need[1], R()), R, 0.02), R, 0.05); st.iglice++; }
      const glade = c === 2, n = glade ? 3 + Math.floor(R() * 4) : (R() < 0.35 ? 1 + Math.floor(R() * 2) : 0);
      for (let q = 0; q < n; q++) { const x = gx + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 6, h = R();
        if (!free(x, z, 34)) continue;
        if (glade && R() < 0.3) { cushion(soft.get(x, z), x, gH(x, z), z, 0.8 + h * 0.6, 0.9 + h * 0.7, vary(mix3(SP.young, gc(x, z), 0.2), R, 0.03), R); st.mlade++; }
        else { cushion(soft.get(x, z), x, gH(x, z), z, 0.7 + h * 0.6, 0.55 + h * 0.4, vary(mix3(SP.fern, gc(x, z), 0.15), R, 0.03), R); st.praprot++; }
      }
    });
    soft.done();
    if (root) for (const g of root.children) if (g.isGroup) for (const m of g.children) if (m.userData.rob && m.name === 'rob') m.castShadow = false;
    return st;
  }
})();
