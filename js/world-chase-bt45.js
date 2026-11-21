/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the forty-fifth group of the real tracks: Lusail and Tuzla, a
   second pass on the two circuits of the shared builder (js/world-rbring.js) whose ground past the fences the sixteenth and the sixth
   group already set (js/world-chase-bt16.js: Lusail's grey scrub, gravel and sand on the shared bands; js/world-chase-bt6.js: Tuzla's
   burnt grass tufts, bare earth and maquis from ~16 m out). From behind the car both still showed one even face beside the road: the
   green verge between the kerb and the fence in one colour, on Tuzla the watered lawns past the fences as one striped green out to
   ~25 m, on Lusail the gravel plain right past the fences a smooth wash. So here, on those strips only:
   on Lusail (docs/proge/lusail.md: »zelene trate« behind the kerbs, »ravna puščava«, »siva prodnata ravnina v velikih lisah, svetlejši in
   toplejši nanosi peska«) the irrigated verge in lighter, darker and sun-dried patches, the desert's sand blown onto it at the fence's
   foot; past the fences to ~12 m the gravel plain's darker and paler patches and the sand's drifts (on the lawns, class 1, the lawn's
   own patches); all of it sparse and with five-cornered patches, Lusail's busiest place being ~10k vertices under the 900k budget. On Tuzla (docs/proge/tuzla.md: »pokošena trava«, »tik ob
   progi (do ~25 m za ograjami) zalite zelene trate s pokošenimi pasovi«, »trava zlata, v lisah bledejša in bolj rjava«) the mown verge in
   lighter, darker and drier patches, uncut grass at the fence's foot; past the fences the watered lawn in patches (greener where the
   sprinklers reach, yellowed spots), turning to straw where the lawn ends (~14 to ~24 m past the road's edge, as the look's colMod);
   out to ~55 m wide low patches of the golden, paler and browner grass and the bare earth. Nothing on the asphalt, the kerbs, the
   asphalt run-offs (T.gravL / gravR) or the pits' side along the pits, nothing on built ground or car parks (land cover 3), nothing
   where another leg's road is nearer. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the
   fences, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.mix3 || !BT.chain || !rng || !vary) return;
  const { soil: soil7, tuft, softScen, mix3, chain } = BT;
  const TAU = Math.PI * 2;
  /* (as the sixth group's soil, with k corners: Lusail's patches with five, its busiest place being near CLAUDE.md's vertex budget) */
  const soilK = (k) => (scen, gH, gx, gz, rr, col, R, lift) => {
    const a0 = R() * TAU, rim = [col[0] * 0.9 + 0.05, col[1] * 0.9 + 0.07, col[2] * 0.9 + 0.03], g = scen.get(gx, gz), up = lift || 0.05, ctr = [gx, gH(gx, gz) + up + 0.02, gz], Q = [];
    for (let q = 0; q < k; q++) { const a = a0 + q / k * TAU, r = rr * (0.65 + R() * 0.6), x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r * 0.75; Q.push([x, gH(x, z) + up, z]); }
    for (let q = 0; q < k; q++) g.triO(ctr, Q[q], Q[(q + 1) % k], col, [gx, ctr[1] - 5, gz], rim, rim); };
  let soil = soil7;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // (as the thirty-ninth group: a fifth of the way to their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const P = (R, a, b, r0, r1) => ({ col: mute(vary(mix3(a[0], a[1], R()), R, 0.015)), r: r0 + R() * r1 });
  const T_ = (R, a) => mute(vary(mix3(a[0], a[1], R()), R, 0.03), 0.95);
  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };

  /* past the fence line on both sides, every C.step m: C.n places from C.from to C.to m past it, only where this leg's road is the
     nearest, not in bad, not far below the road (C.drop) nor steeper than C.maxSl, not on the land covers C.skipLC says;
     C.put(soft, gT, x, y, z, o, R, lc, i) lays the patch or the tuft and says what it was (a key of st) */
  const outer = (root, matV, gT, near, lc, bad, seed, C, st) => {
    const T = API.T; if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length;
    const slope = (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) for (let k = 0; k < C.n; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + Math.pow(r1, C.pw || 1) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || gap(q.i, i, N) * T.ds > o + 10 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0) continue;
      if (bad(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop)) continue;
      if (slope(x, z) > C.maxSl) continue;
      const c = lc ? lc(x, z) : 0; if (C.skipLC && C.skipLC(c)) continue;
      const kk = C.put(soft, gT, x, y, z, o - bar, R, c, o - T.w); if (kk) st[kk] = (st[kk] || 0) + 1;
    }
    soft.done();
    return st;
  };

  /* the strip between the kerb and the fence (both circuits): patches of the verge's grass (V.grass lighter, V.grassD darker, V.dry dried),
     V.sandy of them the blown-in V.sand at the fence's foot, V.foot of the places a tuft of uncut V.coast grass on the fence's road side;
     nothing on the asphalt run-offs nor on the pits' side along the pits. The verge's height as the builder draws it (rbVerge, with a
     banked corner's tilt). Returns [st, badP] (badP: the pits' side, for the bands past the fences) */
  const verge = (ctx, seed, V) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear } = API;
    if (!root || !matV || !T || !T.br || !nrGround || !nrNear) return null;
    const bankY = API.nrBankY || (() => 0), N = T.px.length, w = T.w, cw = T.curbW || 1, ds = T.ds;
    const pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const pit = (i, sd) => !!pd && sd === PSD && pitI(i);
    const badP = (x, z) => { if (excluded(x, z)) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const prof = (i, sd) => { const bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], bk = (o) => bankY(i, sd * o), lift = (o, h) => [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) + 0.06 - y - bk(o))];
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)]; };
    const hAt = (i, sd, o) => { const Q = prof(i, sd); let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++; const a = Q[k], b = Q[k + 1];
      return T.hy[i] + bankY(i, sd * o) + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    const hV = (i0) => (x, z) => { const q = nrNear(x, z), j = q.i >= 0 && gap(q.i, i0, N) < 12 ? q.i : i0, sd = q.lat >= 0 ? 1 : -1; return hAt(j, sd, Math.abs(q.lat)); };
    const st = { zaplate: 0, pesek: 0, sopi: 0 };
    const R = rng(seed), soft = softScen(root, matV), step = V.step || 5.0;
    for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) {
      if (pit(i, sd)) continue;
      const gv = sd > 0 ? T.gravR : T.gravL; if (gv && gv[i]) continue;   // (the asphalt run-offs: the builder's pale tarmac, nothing on it)
      const bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + (T.curb && T.curb[i] ? cw : 0.05) + 0.5, e1 = bar - 0.45, g = hV(i);
      const own = (x, z) => { const q = nrNear(x, z); return q.i >= 0 && gap(q.i, i, N) * ds < 12 && q.dd <= 0 && Math.abs(q.lat) > e0 - 0.3 && Math.abs(q.lat) < bar - 0.3 && q.lat * sd > 0 && !excluded(x, z); };
      if (e1 - e0 > 0.9) for (let k = 0, n = (e1 - e0) > 6 ? 2 : 1; k < n; k++) {
        const r0 = R(), o = e0 + R() * (e1 - e0), [x, z] = at(i, sd, o, (R() - 0.5) * step);
        if (r0 > V.share) continue;
        const u = R(), sandy = R() < V.sandy && o > e1 - 2.2;
        const Pp = sandy ? P(R, V.sand, null, 0.5, 0.8)
          : u < 0.36 ? P(R, V.grassD, null, 0.8, 1.2) : u < 0.7 ? P(R, V.grass, null, 0.8, 1.2) : P(R, V.dry, null, 0.7, 1.0);
        if (sandy) st.pesek++;
        const rr = Math.min(Pp.r, (e1 - e0) * 0.5, o - e0 + 0.4, e1 - o + 0.4);
        if (rr > 0.3 && own(x, z)) { soil(soft, g, x, z, rr, Pp.col, R, 0.04); st.zaplate++; }
      }
      if (R() < V.foot) { const o = bar - 0.35 - R() * 0.35, [x, z] = at(i, sd, o, (R() - 0.5) * 2.6);
        if (own(x, z)) { const h = R(); tuft(soft.get(x, z), x, g(x, z), z, 0.2 + h * 0.16, 0.26 + h * 0.24, T_(R, V.coast), R, 5); st.sopi++; } }
    }
    soft.done();
    return [st, badP];
  };
  // (P with one pair: a and b the pair's two ends)
  const P2 = (R, ab, r0, r1) => P(R, ab, null, r0, r1);

  /* ---- Lusail: the irrigated verge in the desert, the gravel plain and the sand past the fences ---- */
  const LU = {
    grass: [[0.42, 0.6, 0.25], [0.46, 0.62, 0.27]], grassD: [[0.33, 0.52, 0.2], [0.36, 0.55, 0.21]], dry: [[0.56, 0.56, 0.34], [0.6, 0.58, 0.37]],
    sand: [[0.82, 0.74, 0.58], [0.86, 0.78, 0.62]], coast: [[0.46, 0.54, 0.28], [0.62, 0.6, 0.38]],
    grav: [[0.6, 0.56, 0.5], [0.64, 0.6, 0.53]], gravD: [[0.5, 0.47, 0.42], [0.54, 0.5, 0.45]], drift: [[0.79, 0.71, 0.53], [0.83, 0.74, 0.56]],
  };
  const LU_FAR = false;   // (the far band left out on Lusail: its busiest place had only ~10k vertices to spare under CLAUDE.md's 900k)
  const lusail = (ctx) => {
    const v = verge(ctx, 45101, { step: 8, share: 0.3, sandy: 0.32, foot: 0.03, grass: LU.grass, grassD: LU.grassD, dry: LU.dry, sand: LU.sand, coast: LU.coast });
    if (!v) return;
    const [st, badP] = v, { nrGround, nrLC, nrNear } = API, skipLC = (c) => c === 3;
    // past the fences to ~12 m (the builder's own verge runs 3.2 m past the fence): the gravel plain's patches and the sand's drifts; on the lawns the lawn's own patches
    const breg = outer(ctx.root, ctx.matV, nrGround, nrNear, nrLC, badP, 45102, { step: 12, n: 1, share: 0.45, from: 3.2, to: 12, pw: 1.2, drop: 1.5, maxSl: 1.0, skipLC,
      put: (soft, gT, x, y, z, o, R, c) => { const u = R();
        const Pp = c === 1 ? (u < 0.5 ? P2(R, LU.grassD, 0.9, 1.1) : P2(R, LU.dry, 0.8, 1.0))
          : c === 2 ? (u < 0.6 ? P2(R, LU.drift, 1.0, 1.2) : P2(R, LU.grav, 0.8, 1.0))
          : u < 0.45 ? P2(R, LU.gravD, 0.9, 1.2) : u < 0.8 ? P2(R, LU.grav, 0.9, 1.2) : P2(R, LU.drift, 0.8, 1.0);
        soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.05); return c === 1 ? 'trata' : 'breg'; } }, {});
    // out to ~55 m: a sparse band of wide low patches of the same, so the plain reads as ground, not one colour
    const pas = LU_FAR && outer(ctx.root, ctx.matV, nrGround, nrNear, nrLC, badP, 45103, { step: 8, n: 1, share: 0.35, from: 12, to: 55, drop: 4, maxSl: 1.0, skipLC,
      put: (soft, gT, x, y, z, o, R, c) => { const u = R(), k = 1 + 0.5 * Math.min(1, (o - 12) / 43);
        const Pp = c === 1 ? P2(R, LU.grassD, 1.5 * k, 1.3 * k) : c === 2 || u < 0.3 ? P2(R, LU.drift, 1.6 * k, 1.6 * k) : u < 0.7 ? P2(R, LU.gravD, 1.6 * k, 1.6 * k) : P2(R, LU.grav, 1.6 * k, 1.6 * k);
        soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.06); return 'pas'; } }, {});
    if (ctx.out) { ctx.out.robBt45 = st; ctx.out.bregBt45 = breg; ctx.out.pasBt45 = pas; }
  };

  /* ---- Tuzla: the mown verge, the watered lawns past the fences turning to the hills' burnt grass ---- */
  const TZ = {
    grass: [[0.42, 0.6, 0.22], [0.46, 0.62, 0.24]], grassD: [[0.34, 0.52, 0.17], [0.37, 0.55, 0.19]], dry: [[0.56, 0.54, 0.3], [0.62, 0.57, 0.33]],
    sand: [[0.62, 0.5, 0.36], [0.66, 0.53, 0.38]], coast: [[0.42, 0.5, 0.24], [0.62, 0.58, 0.34]],
    gold: [[0.74, 0.62, 0.36], [0.8, 0.67, 0.4]], pale: [[0.82, 0.75, 0.52], [0.86, 0.78, 0.56]], brown: [[0.58, 0.46, 0.3], [0.62, 0.49, 0.32]],
    earth: [[0.56, 0.44, 0.32], [0.6, 0.47, 0.34]], maq: [[0.3, 0.33, 0.2], [0.34, 0.36, 0.22]],
  };
  const tuzla = (ctx) => {
    const v = verge(ctx, 45201, { share: 0.55, sandy: 0.1, foot: 0.14, grass: TZ.grass, grassD: TZ.grassD, dry: TZ.dry, sand: TZ.sand, coast: TZ.coast });
    if (!v) return;
    const [st, badP] = v, { nrGround, nrLC, nrNear } = API, skipLC = (c) => c === 3;
    const lawn = (dE) => 1 - clamp((dE - 14) / 10, 0, 1);   // (the watered lawn by the track: green to ~14 m past the road's edge, straw from ~24 m, as the look's colMod)
    // past the fences to ~24 m: the lawn's greener and yellowed patches, at its end the straw coming in; a few tufts where it is dry
    const breg = outer(ctx.root, ctx.matV, nrGround, nrNear, nrLC, badP, 45202, { step: 4.0, n: 2, share: 0.72, from: 3.2, to: 24, pw: 1.15, drop: 2.5, maxSl: 1.1, skipLC,
      put: (soft, gT, x, y, z, o, R, c, dE) => { const u = R(), l = lawn(dE);
        if (R() < l) { const Pp = u < 0.42 ? P2(R, TZ.grassD, 0.9, 1.3) : u < 0.78 ? P2(R, TZ.grass, 0.9, 1.3) : P2(R, TZ.dry, 0.8, 1.0);
          soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.05); return 'trata'; }
        if (u < 0.7) { const Pp = c === 2 ? P2(R, TZ.maq, 0.9, 1.1) : R() < 0.5 ? P2(R, TZ.gold, 1.0, 1.2) : R() < 0.6 ? P2(R, TZ.pale, 0.9, 1.1) : P2(R, TZ.earth, 0.7, 0.9);
          soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.05); return 'breg'; }
        const h = R(); tuft(soft.get(x, z), x, y, z, 0.3 + h * 0.3, 0.3 + h * 0.3, T_(R, R() < 0.3 ? TZ.brown : TZ.gold), R, 4); return 'bregSopi'; } }, {});
    // out to ~55 m: wide low patches of the golden, paler and browner grass and the bare earth (the sixth group's tufts stand among them)
    const pas = outer(ctx.root, ctx.matV, nrGround, nrNear, nrLC, badP, 45203, { step: 7, n: 1, share: 0.45, from: 16, to: 55, drop: 8, maxSl: 1.0, skipLC,
      put: (soft, gT, x, y, z, o, R, c, dE) => { if (lawn(dE) > 0.5) return null;
        const u = R(), k = 1 + 0.5 * Math.min(1, (o - 16) / 39);
        const Pp = c === 2 ? P2(R, TZ.maq, 1.4 * k, 1.2 * k) : u < 0.35 ? P2(R, TZ.pale, 1.6 * k, 1.6 * k) : u < 0.7 ? P2(R, TZ.brown, 1.6 * k, 1.6 * k) : u < 0.88 ? P2(R, TZ.gold, 1.6 * k, 1.6 * k) : P2(R, TZ.earth, 1.2 * k, 1.0 * k);
        soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.06); return 'pas'; } }, {});
    if (ctx.out) { ctx.out.robBt45 = st; ctx.out.bregBt45 = breg; ctx.out.pasBt45 = pas; }
  };

  const L = API.rbLook || {};
  if (L.lusail) chain(L.lusail, (ctx) => { try { soil = soilK(5); lusail(ctx); } catch (e) { console.error('chase-bt45 (lusail):', e); } });
  if (L.tuzla) chain(L.tuzla, (ctx) => { try { soil = soil7; tuzla(ctx); } catch (e) { console.error('chase-bt45 (tuzla):', e); } });
})();
