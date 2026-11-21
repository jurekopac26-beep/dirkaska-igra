/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the thirty-seventh group of the real tracks: Sakhir and Seoul, a
   second pass. From behind the car both still showed one even face beside the road: on Sakhir the desert past the barriers in one pale
   sand to the horizon (the darker grit only a colour on it, the stones of js/world-realizem-bt3.js few and small at that distance); on
   Seoul the strip between the kerb and the street race's blocks in one colour and, past the blocks, the forest's floor in one smooth face
   (the undergrowth of js/world-realizem-bt.js in groups, the ground between them even).
   So here: on Sakhir (the shared circuit builder, js/world-rbring.js: its look's LK.extra chained) low flat patches of what lies in the
   desert (docs/proge/sakhir.md) from 0.6 m behind the barriers to ~16 m and, sparser and wider, out to ~60 m: the darker grit and
   stones, the paler drifts of sand, the bare crust between them; only on the sand (land cover 0), never on the lawns, the car parks,
   the built ground or the pits' side along the pits, never inside the barriers (the asphalt run-offs drive as asphalt). On Seoul (its own
   builder, js/world-seoul.js: World.ext.seoulRob chained) on the strip from the kerb to 0.3 m before the blocks, as the builder's verge
   cross-section lies (vergeRow), the forest's needles, its fallen oak leaves and its moss, the park's grass and bare earth; at the blocks'
   foot low tufts; behind the blocks to ~10 m the forest floor's litter, moss and tufts and, out to ~45 m, wide patches of the litter on
   the slope. Nothing in the town (land cover 3), at the crossings, by the buildings or the landmarks (noTree). All of it in the builders'
   own scenery chunks (no draw is added); the terrain, the road, the verges, the barriers and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.mix3 || !vary || !rng) return;
  const { soil, tuft, cushion, mix3 } = BT;

  /* ---- Sakhir: docs/proge/sakhir.md: »puščava spomladi: bled pesek, temnejši grušč in kamenje v lisah, svetlejši nanosi peska«.
     Behind the barriers on the sand: patches of the darker grey-brown grit (more where the ground's own colour is grit: the same noise as
     the look's colMod), the paler drifts of wind-blown sand, a few of the bare beige crust; out to ~60 m the same, wider and fewer ---- */
  const SK = {
    grit: (R) => vary(mix3([0.52, 0.45, 0.36], [0.46, 0.4, 0.33], R()), R, 0.015),
    drift: (R) => vary(mix3([0.92, 0.85, 0.68], [0.89, 0.82, 0.66], R()), R, 0.015),
    crust: (R) => vary(mix3([0.7, 0.57, 0.42], [0.66, 0.54, 0.4], R()), R, 0.015),
  };
  const skPatch = (R, g) => { const r = R();
    return r < 0.25 + 0.45 * g ? SK.grit(R) : r < 0.8 ? SK.drift(R) : SK.crust(R); };
  const skRob = (ctx) => {
    const T = API.T, { nrGround, nrLC, nrNear, nrSlope, NR: P } = API, st = { zaplate: 0, pas: 0, kamencki: 0 };
    if (!T || !T.br || !nrGround || !nrLC || !nrNear || !ctx.scen) return st;
    const scen = ctx.scen, ex = ctx.excluded || (() => false), pd = T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pit = (s, sd) => ps && sd === ps && (!!T.pitAt(s) || (T.pitLead ? T.pitLead(s) >= 0 : false));
    const gritK = (x, z) => P && P.n1 ? Math.min(1, Math.max(0, (P.n1(x * 0.35 + 510, z * 0.35 + 90) - 0.42) / 0.28)) : 0.3;
    const sand = (x, z, r) => { const q = nrNear(x, z); return q.i >= 0 && q.dd > r && (c => c !== 1 && c !== 3)(nrLC(x, z)) && !ex(x, z) && (!nrSlope || nrSlope(x, z) < 0.6); };
    const at = (i, sd, o, a) => { const d = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + o); return [T.px[i] + T.nx[i] * d + T.tx[i] * a, T.pz[i] + T.nz[i] * d + T.tz[i] * a]; };
    const R = rng(37101), N = T.px.length;
    const near = Math.max(1, Math.round(3.2 / T.ds)), far = Math.max(1, Math.round(8 / T.ds));
    for (let i = 0; i < N; i += near) for (const sd of [-1, 1]) {   // behind the barriers: 0.6 to ~16 m
      for (let k = 0; k < 2; k++) {
        const r0 = R(), r1 = R(), r2 = R(); if (pit(i * T.ds, sd) || r0 > 0.75) continue;
        const o = 0.6 + Math.pow(r1, 1.25) * 15, [x, z] = at(i, sd, o, (r2 - 0.5) * 3.2), rr = 0.7 + R() * (0.6 + o * 0.06);
        if (!sand(x, z, Math.min(o, 0.5 + rr * 0.6))) continue;
        const g = gritK(x, z); soil(scen, nrGround, x, z, rr, skPatch(R, g), R, 0.04); st.zaplate++;
        if (g > 0.3 && R() < 0.35) for (let q = 0, n = 2 + Math.floor(R() * 3); q < n; q++) {   // a few pebbles of the grit on it
          const px = x + (R() - 0.5) * rr * 1.4, pz = z + (R() - 0.5) * rr * 1.4, h = R();
          if (!sand(px, pz, 0.5)) continue;
          cushion(scen.get(px, pz), px, nrGround(px, pz) + 0.04, pz, 0.1 + h * 0.12, 0.05 + h * 0.05, vary(mix3([0.5, 0.44, 0.37], [0.6, 0.52, 0.43], R()), R, 0.02), R); st.kamencki++; }
      }
    }
    for (let i = 0; i < N; i += far) for (const sd of [-1, 1]) {   // out to ~60 m: wider and fewer
      const r0 = R(), r1 = R(), r2 = R(); if (pit(i * T.ds, sd) || r0 > 0.55) continue;
      const o = 16 + r1 * 44, [x, z] = at(i, sd, o, (r2 - 0.5) * 8), q = nrNear(x, z);
      if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || !sand(x, z, 10)) continue;   // (another leg nearer: its own band)
      const k = 1 + 0.5 * (o - 16) / 44; soil(scen, nrGround, x, z, (1.6 + R() * 1.6) * k, skPatch(R, gritK(x, z)), R, 0.05); st.pas++;
    }
    return st;
  };
  {
    const L = (API.rbLook || {}).sakhir;
    if (L) {
      const base = L.extra;
      L.extra = function (ctx) {
        const r = (base ? base.call(this, ctx) : null) || {};
        try { r.robBt37 = skRob(ctx); } catch (e) { console.error('chase-bt37 (sakhir):', e); }
        return r;
      };
    }
  }

  /* ---- Seoul: docs/proge/seoul.md: »gozd rdečega bora in hrasta po rabi tal (tla iglice in listje z zelenim podrastjem)«, »trate v
     parku«, »betonski bloki ulične dirke … 1,6–7,5 m od roba asfalta«. On the strip to the blocks the pines' rusty needles, the oaks'
     brown leaves blown to the blocks and the dark green moss under the woods, the park's grass and its bare trodden earth in the open;
     at the blocks' foot low tufts of the undergrowth's green. Behind the blocks the forest floor ---- */
  const SE = {
    needle: (R) => vary(mix3([0.5, 0.38, 0.25], [0.55, 0.41, 0.27], R()), R, 0.015),
    leaf: (R) => vary(mix3([0.48, 0.4, 0.28], [0.52, 0.43, 0.3], R()), R, 0.015),
    moss: (R) => vary(mix3([0.34, 0.4, 0.22], [0.38, 0.43, 0.24], R()), R, 0.015),
    grass: (R) => vary(mix3([0.4, 0.5, 0.25], [0.45, 0.53, 0.28], R()), R, 0.015),
    earth: (R) => vary([0.52, 0.45, 0.36], R, 0.015),
    tuft: (R) => vary(mix3([0.28, 0.42, 0.18], [0.36, 0.48, 0.22], R()), R, 0.03),
  };
  const sePatch = (R, wood) => { const r = R();
    return wood ? (r < 0.4 ? SE.needle(R) : r < 0.72 ? SE.leaf(R) : SE.moss(R)) : (r < 0.6 ? SE.grass(R) : SE.earth(R)); };
  const seRob = ({ scen, noTree, nearCross }) => {
    const T = API.T, { nrGround, nrLC, nrNear } = API, st = { zaplate: 0, sopi: 0, breg: 0, bregSopi: 0, pas: 0 };
    if (!T || !T.br || !T.wAt || !nrGround || !nrLC || !nrNear || !scen) return st;
    const R = rng(37201), N = T.px.length, step = Math.max(1, Math.round(2.6 / T.ds)), farS = Math.max(1, Math.round(7 / T.ds));
    /* the builder's verge (vergeRow): the kerb to w + 0.5 at +0.05, then to the blocks' line - 0.2 and on to + 0.8 lifted onto the ground
       (+0.06) where it rises, to -0.12 at + 3 */
    const prof = (i, o, side) => { const w = T.wAt(i), b = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i];
      const lift = (oo, h) => { const q = side * oo; return [oo, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y)]; };
      const Pp = [[w, 0], [w + 0.5, 0.05], lift(Math.max(w + 0.9, b - 0.2), 0), lift(b + 0.8, 0), lift(b + 3, -0.12)];
      if (o <= Pp[0][0]) return 0; for (let k = 1; k < Pp.length; k++) if (o <= Pp[k][0]) { const t = (o - Pp[k - 1][0]) / Math.max(0.01, Pp[k][0] - Pp[k - 1][0]); return Pp[k - 1][1] + (Pp[k][1] - Pp[k - 1][1]) * t; }
      return null; };
    const gV = (x, z) => { const q = nrNear(x, z), g = nrGround(x, z); if (q.i < 0) return g; const side = q.lat < 0 ? -1 : 1, h = prof(q.i, Math.abs(q.lat), side);
      return h == null ? g : Math.max(T.hy[q.i] + h, g - 0.02); };
    const own = (x, z, i, lo, hi) => { const q = nrNear(x, z), o = Math.abs(q.lat); return q.i >= 0 && Math.abs(q.i - i) * T.ds < 12 && o > lo && o < hi; };
    const slope = (x, z) => { const d = 0.8, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const s = i * T.ds; if (nearCross(s, 10)) { R(); R(); R(); R(); continue; }
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + 0.9, e1 = bar - 0.3, r0 = R(), r1 = R(), r2 = R(), r3 = R();
      const [cx, cz] = at(i, sd, (e0 + e1) / 2, 0), c = nrLC(cx, cz); if (c === 3 || noTree(cx, cz)) continue;
      const wood = c === 1;
      if (e1 - e0 > 0.7 && r0 < (wood ? 0.6 : 0.45)) {   // a patch on the strip
        const o = e0 + r1 * (e1 - e0), [x, z] = at(i, sd, o, (r2 - 0.5) * 2), rr = Math.min(0.7 + R() * 0.9, (e1 - e0) * 0.5 + 0.2, o - e0 + 0.35, e1 - o + 0.35);
        if (rr > 0.3 && own(x, z, i, e0 - 0.1, e1 + 0.1)) { soil(scen, gV, x, z, rr, sePatch(R, wood), R, 0.04); st.zaplate++; }
      }
      if (r3 < (wood ? 0.4 : 0.25)) for (let q = 0, n = 1 + Math.floor(R() * 3); q < n; q++) {   // tufts at the blocks' foot
        const o = e1 - 0.1 - R() * 0.3, [x, z] = at(i, sd, o, (R() - 0.5) * 2.4);
        if (!own(x, z, i, e0, bar - 0.2)) continue;
        const h = R(); tuft(scen.get(x, z), x, gV(x, z), z, 0.2 + h * 0.16, 0.22 + h * 0.2, SE.tuft(R), R, 5); st.sopi++; }
      for (let k = 0; k < 2; k++) {   // behind the blocks to ~10 m: the forest floor (the park's lawn in the open)
        const q0 = R(), q1 = R(), q2 = R(), o = bar + 0.9 + Math.pow(q1, 1.3) * 9, [x, z] = at(i, sd, o, (q2 - 0.5) * 2.6);
        if (!own(x, z, i, bar + 0.6, 1e9) || noTree(x, z)) continue;
        const cc = nrLC(x, z); if (cc === 3 || slope(x, z) > 1.3 || Math.abs(nrGround(x, z) - T.hy[i]) > 5) continue;
        if (q0 < 0.55) { soil(scen, nrGround, x, z, 0.8 + R() * 1.1, sePatch(R, cc === 1), R, 0.05); st.breg++; }
        else { const h = R(); tuft(scen.get(x, z), x, nrGround(x, z), z, 0.24 + h * 0.2, 0.26 + h * 0.24, SE.tuft(R), R, 5); st.bregSopi++; }
      }
    }
    for (let i = 0; i < N; i += farS) for (const sd of [-1, 1]) {   // out to ~45 m: wide patches of the litter on the forest's slope
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.6 || nearCross(i * T.ds, 12)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + 9 + r1 * 36, [x, z] = at(i, sd, o, (r2 - 0.5) * 7), q = nrNear(x, z);
      if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || q.dd < 8 || nrLC(x, z) !== 1 || noTree(x, z) || slope(x, z) > 1.1) continue;
      const k = 1 + 0.4 * (o - bar - 9) / 36; soil(scen, nrGround, x, z, (1.3 + R() * 1.3) * k, sePatch(R, true), R, 0.06); st.pas++;
    }
    return st;
  };
  {
    const base = World.ext && World.ext.seoulRob;
    if (World.ext) World.ext.seoulRob = (ctx) => {
      if (base) base(ctx);
      try { if (ctx && ctx.out) ctx.out.robBt37 = seRob(ctx); } catch (e) { console.error('chase-bt37 (seoul):', e); }
    };
  }
})();
