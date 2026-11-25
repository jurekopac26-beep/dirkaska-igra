/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventy-seventh group of the real tracks: Nürburg and Štajerska,
   a third pass on two circuits whose verge and far band the seventeenth (js/world-chase-bt17.js), the forty-eighth (js/world-chase-bt48.js,
   Štajerska's meadow out to ~60 m) and the fifty-third group (js/world-chase-bt53.js, Nürburg's verge and band) already set. From behind
   the car two things still read as drawn, not as ground: the asphalt's edge, where the grass met the white line in one clean straight cut,
   and the grass between the fence and ~60 m, one even green under a few sharp patches. So here, on those only:
   - the road's edge (rob ceste): outside the white line (past the kerb where one is) a narrow ragged strip, 0.2 to 0.8 m, of the dust and
     grit the wheels throw off and the worn grass behind it, its width and its shade wandering along the lap (docs/proge/nring.md: the
     verges »pokošena trava«; docs/proge/rbring.md: the lawns mown to the asphalt); none on the run-offs, the pits' side, the kerbs;
   - the grass to ~60 m: wide soft patches, their middle a shade lusher, paler or drier and their rim nearly the lawn's own colour, so the
     lawn reads as one mown field with its wetter and drier hollows rather than as stickers (Nürburg: the meadow and, under the trees, the
     dark litter; Štajerska: the mown lawns and, past ~35 m, the hay meadow).
   Nothing on the asphalt, the kerbs, the run-offs (T.gravL / gravR, and 30 m either way), the pits' side, built ground (land cover 3) or
   water (6), nothing where another leg's road is nearer. One mesh set of its own per track (softScen: 256 m chunks, no shadow); the
   terrain, the road, the fences, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, TAU } = API;
  if (!BT || !BT.softScen || !BT.mix3 || !rng || !vary) return;
  const { softScen, mix3, chain } = BT, dk = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // a smooth wander along the lap, 0–1 (three sines of random phase; the longest ~90 m)
  const wander = (R) => { const p = [R() * TAU, R() * TAU, R() * TAU]; return (s) => clamp(0.5 + 0.22 * Math.sin(s / 14.3 + p[0]) + 0.17 * Math.sin(s / 6.1 + p[1]) + 0.11 * Math.sin(s / 2.7 + p[2]), 0, 1); };

  // (the meshes carry no grass texture, so they render lighter than the textured lawn under them: L.dim and L.edgeDim bring them down to it)
  const run = (G, L) => {
    const T = API.T, { root, matV } = G, excluded = G.excluded || (() => false), gT = G.gT, near = G.near, lc = G.lc;
    if (!root || !matV || !T || !T.br || !gT || !near) return null;
    const bankY = G.bankY || (() => 0), N = T.px.length, w = T.w, cw = T.curbW || 1, ds = T.ds;
    const pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const pit = (i, sd) => !!pd && sd === PSD && pitI(i);
    const ro = (i, sd) => { const gv = sd > 0 ? T.gravR : T.gravL; if (!gv) return false; const m = Math.round(30 / ds);
      for (let d = -m; d <= m; d += Math.max(1, Math.round(4 / ds))) if (gv[(i + d + N) % N]) return true; return false; };
    const skip = (c) => c === 3 || c === 6;
    // the builders' kerbs (js/world-nring.js, js/world-rbring.js): inside of every bend, outside only in the tighter ones
    const curbAt = (i, sd) => !!(T.curb && T.curb[i]) && (sd * T.k[i] > 0 || Math.abs(T.k[i]) > 1 / 70);
    // the verge as the builders lay it (js/world-nring.js, js/world-rbring.js; as js/world-chase-bt53.js): [offset, height above the road]
    const yV = (i, sd, o) => { const y = T.hy[i] + bankY(i, sd * o); return y + (o <= w ? 0 : o >= w + 1.2 ? -0.04 : -0.04 * (o - w) / 1.2); };
    const at = (i, sd, o) => [T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o];
    const st = { rob: 0, zaplate: 0 };
    const soft = softScen(root, matV);

    // ---- the road's edge: quads every `step` m, a strip from the asphalt (or the kerb) out by its wandering width ----
    { const R = rng(L.seed), step = Math.max(1, Math.round(L.edgeStep / ds));
      for (const sd of [-1, 1]) {
        const wd = wander(R), sh = wander(R); let prev = null;
        for (let i = 0; i <= N; i += step) {
          const ii = i % N, s = ii * ds, bar = sd > 0 ? T.br[ii] : T.bl[ii];
          const o0 = w + (curbAt(ii, sd) ? cw : 0.04) + 0.02, o1 = o0 + L.edgeW[0] + wd(s) * (L.edgeW[1] - L.edgeW[0]);
          let ok = !pit(ii, sd) && !ro(ii, sd) && bar - o1 > 0.6;
          if (ok) { const [cx, cz] = at(ii, sd, o1 + 0.5), c = lc ? lc(cx, cz) : 0; if (skip(c) || excluded(cx, cz)) ok = false;
            else { const q = near(cx, cz); if (q.i < 0 || gap(q.i, ii, N) > 12 || q.lat * sd < 0) ok = false; } }
          if (!ok) { prev = null; continue; }
          const [ax, az] = at(ii, sd, o0), [bx, bz] = at(ii, sd, o1), u = sh(s);
          const cIn = dk(vary(mix3(L.grit[0], L.grit[1], u), R, 0.02), L.edgeDim), cOut = dk(vary(mix3(L.worn[0], L.worn[1], 1 - u), R, 0.02), L.edgeDim);
          const cur = { A: [ax, yV(ii, sd, o0) + 0.025, az], B: [bx, yV(ii, sd, o1) + 0.03, bz], cIn, cOut };
          if (prev) { const g = soft.get((ax + prev.A[0]) / 2, (az + prev.A[2]) / 2), ref = [ax, cur.A[1] - 5, az];
            g.triO(prev.A, prev.B, cur.B, prev.cIn, ref, prev.cOut, cur.cOut); g.triO(prev.A, cur.B, cur.A, prev.cIn, ref, cur.cOut, cur.cIn); st.rob++; }
          prev = cur;
        }
      } }

    // ---- the grass out to ~60 m: soft patches, the middle the shade, the rim melting into the lawn ----
    { const R = rng(L.seed + 1), step = Math.max(1, Math.round(L.farStep / ds));
      const slope = (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
      const patch = (g, x, z, r, col, rim) => {   // a fan of two rings: the middle and the inner ring in col, the outer ring in rim
        const k = 9, a0 = R() * TAU, up = 0.05, C = [x, gT(x, z) + up + 0.015, z], I = [], O = [], ref = [x, C[1] - 5, z];
        for (let q = 0; q < k; q++) { const a = a0 + q / k * TAU, f = 0.75 + R() * 0.5, ri = r * 0.5 * f, rr = r * f * (0.9 + R() * 0.2);
          const xi = x + Math.cos(a) * ri, zi = z + Math.sin(a) * ri * 0.8, xo = x + Math.cos(a) * rr, zo = z + Math.sin(a) * rr * 0.8;
          I.push([xi, gT(xi, zi) + up + 0.01, zi]); O.push([xo, gT(xo, zo) + up, zo]); }
        for (let q = 0; q < k; q++) { const n = (q + 1) % k;
          g.triO(C, I[q], I[n], col, ref, col, col); g.triO(I[q], O[q], O[n], col, ref, rim, rim); g.triO(I[q], O[n], I[n], col, ref, rim, col); } };
      for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) for (let kk = 0; kk < L.farN; kk++) {
        const r0 = R(), r1 = R(), r2 = R(); if (r0 > L.farShare) continue;
        const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + L.from + Math.pow(r1, 0.8) * (L.to - L.from), a = (r2 - 0.5) * L.farStep;
        const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a, q = near(x, z);
        if (q.i < 0 || gap(q.i, i, N) * ds > o + 10 || Math.abs(q.lat) < bar + 2.5 || q.lat * sd < 0 || pit(q.i, sd) || excluded(x, z)) continue;
        const y = gT(x, z); if (!(y > T.hy[i] - L.drop) || slope(x, z) > 0.8) continue;
        const c = lc ? lc(x, z) : 0; if (skip(c)) continue;
        const pick = L.far(R, o - bar, c); if (!pick) continue;
        const col = dk(vary(mix3(pick[0][0], pick[0][1], R()), R, 0.012), L.dim), rim = mix3(col, dk(pick[1], L.dim), 0.85);
        const r = L.r[0] + R() * L.r[1] * (1 + 0.5 * clamp((o - bar) / L.to, 0, 1));
        patch(soft.get(x, z), x, z, r, col, rim); st.zaplate++;
      } }
    soft.done();
    return st;
  };

  /* ---- Nürburg (its own builder calls World.ext.goreRob(…, 'nring', …) once its ground is laid) ---- */
  const NR = {
    grit: [[0.5, 0.48, 0.43], [0.56, 0.53, 0.47]], worn: [[0.44, 0.47, 0.28], [0.5, 0.5, 0.32]],
    lawn: [0.37, 0.49, 0.23], lush: [[0.29, 0.43, 0.18], [0.32, 0.46, 0.2]], pale: [[0.45, 0.53, 0.28], [0.48, 0.55, 0.3]],
    dry: [[0.5, 0.52, 0.31], [0.53, 0.54, 0.33]], litter: [[0.3, 0.27, 0.19], [0.34, 0.3, 0.21]], floor: [0.27, 0.3, 0.18],
  };
  const LNR = { seed: 77101, edgeStep: 2, edgeW: [0.15, 0.6], edgeDim: 0.82, dim: 0.7, grit: NR.grit, worn: NR.worn,
    farStep: 9, farN: 2, farShare: 0.7, from: 3.5, to: 60, drop: 12, r: [3.2, 3.6],
    far: (R, o, c) => { const u = R();
      if (c === 1) return u < 0.7 ? [NR.litter, NR.floor] : [NR.lush, NR.floor];
      return u < 0.42 ? [NR.lush, NR.lawn] : u < 0.8 ? [NR.pale, NR.lawn] : [NR.dry, NR.lawn]; } };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'nring') try {
        const T = API.T, out = ctx.out;
        if (out && T && T.def && T.def.id === 'nring') out.robBt77 = run({ root: ctx.root, matV: out.matV, excluded: ctx.excluded, gT: o.gH, near: o.near, lc: o.lc, bankY: API.nrBankY }, LNR);
      } catch (e) { console.error('chase-bt77 (nring):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the other groups hang on it)
    World.ext.goreRob = f;
  }

  /* ---- Štajerska (the shared circuit builder, js/world-rbring.js: its look's extra chained) ---- */
  const RB = {
    grit: [[0.52, 0.5, 0.45], [0.58, 0.55, 0.49]], worn: [[0.42, 0.5, 0.26], [0.47, 0.52, 0.29]],
    lawn: [0.36, 0.52, 0.22], lush: [[0.28, 0.45, 0.17], [0.31, 0.48, 0.19]], pale: [[0.43, 0.55, 0.26], [0.46, 0.57, 0.28]],
    hay: [[0.5, 0.54, 0.3], [0.54, 0.56, 0.32]], meadow: [0.42, 0.53, 0.25], litter: [[0.34, 0.3, 0.2], [0.38, 0.33, 0.22]], floor: [0.29, 0.34, 0.19],
  };
  const LRB = { seed: 77201, edgeStep: 2, edgeW: [0.15, 0.55], edgeDim: 0.8, dim: 0.68, grit: RB.grit, worn: RB.worn,
    farStep: 9, farN: 2, farShare: 0.7, from: 3.5, to: 60, drop: 6, r: [3.2, 3.6],
    far: (R, o, c) => { const u = R();
      if (c === 1) return u < 0.7 ? [RB.litter, RB.floor] : [RB.lush, RB.floor];
      if (o > 35) return u < 0.5 ? [RB.hay, RB.meadow] : [RB.lush, RB.meadow];
      return u < 0.5 ? [RB.lush, RB.lawn] : [RB.pale, RB.lawn]; } };
  const LS = (API.rbLook || {}).rbring;
  if (LS && chain) chain(LS, (ctx) => { try {
    const T = API.T, { nrGround, nrLC, nrNear } = API;
    if (!T || (T.def && T.def.id !== 'rbring') || !ctx.out) return;
    ctx.out.robBt77 = run({ root: ctx.root, matV: ctx.matV, excluded: ctx.excluded, gT: nrGround, near: nrNear, lc: nrLC, bankY: API.nrBankY }, LRB);
  } catch (e) { console.error('chase-bt77 (rbring):', e); } });
})();
