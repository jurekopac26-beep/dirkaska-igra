/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fifty-third group of the real tracks: Nürburg and Sosnová,
   a second pass on two tracks whose ground the seventeenth (js/world-chase-bt17.js: Nürburg's tufts, needle litter and young growth
   within ~24 m of the fences) and the twenty-first group (js/world-chase-bt21.js: Sosnová's late-summer tufts, yarrow and knapweed, the
   pines' needles) already set. From behind the car both still showed one even face beside the road: the verge between the asphalt and
   the fence in the builder's one green, and the ground past the fences out to the horizon a smooth wash. So here, on those strips only:
   on Nürburg (docs/proge/nring.md: »gozd ima smreke, bukve, macesne in suhe smreke, ob robu grmovje in mlado drevje, tla pod krošnjami
   so temna«) on the verge the mown grass in its lusher, paler and worn patches, the bare earth and grit where the wheels cut it, tufts of
   uncut grass at the fence's foot; past the fences to ~60 m under the trees (land cover 1) the dark needle litter and the beeches' brown
   leaves, at the wood's edge and in the scrub (2) the young growth's green, on the open meadows (0) the grass in green and hay patches.
   On Sosnová (docs/proge/sosnova.md: »pokošena trava« inside the fences, »borov gozd peščene pokrajine …, poznopoletni travniki z rmanom
   in glavincem, strnišča«) on the mown lawn between the kerb and the fence its greener, its paler and its dry patches, the sand showing
   at the fence's foot; past the fences out to ~60 m the late-summer meadow's straw and green, the stubble's pale gold, the sandy soil
   and, under the pines, the rusty needle litter.
   Nothing on the asphalt, the kerbs, the run-offs (T.gravL / gravR) or the pits' side along the pits, nothing on built ground (land cover
   3) or the water (6), nothing where another leg's road is nearer. All of it in meshes of their own (softScen: 256 m chunks, no shadow);
   the terrain, the road, the fences, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, softScen, mix3, chain } = BT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // (as the thirty-ninth group: a fifth of the way to their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const P = (R, a, k, r0, r1) => ({ col: mute(vary(mix3(a[0], a[1], R()), R, 0.015)), r: (r0 + R() * r1) * (k || 1) });
  const T_ = (R, a) => mute(vary(mix3(a[0], a[1], R()), R, 0.03), 0.95);
  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };

  /* the two strips on a circuit's own ground (gT, near, lc, bankY: the builder's), with a look L:
     L.verge(R, o, e0, e1, c) -> a patch {col, r} or null; L.foot: the tufts' share at the fence's foot and L.tuft their colours;
     L.far(R, o, c) -> a patch for the band past the fences (L.from to L.to m); seeds L.seed, L.seed + 1 */
  const edges = (ctx, G, L) => {
    const T = API.T, { root, matV } = G, excluded = G.excluded || (() => false), gT = G.gT, near = G.near, lc = G.lc;
    if (!root || !matV || !T || !T.br || !gT || !near) return null;
    const bankY = G.bankY || (() => 0), N = T.px.length, w = T.w, cw = T.curbW || 1, ds = T.ds;
    const pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const pit = (i, sd) => !!pd && sd === PSD && pitI(i);
    const badP = (x, z) => { if (excluded(x, z)) return true; if (!PSD) return false; const q = near(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const ro = (i, sd) => { const gv = sd > 0 ? T.gravR : T.gravL; if (!gv) return false; const m = Math.round(30 / ds);
      for (let d = -m; d <= m; d += Math.max(1, Math.round(4 / ds))) if (gv[(i + d + N) % N]) return true; return false; };
    const skip = (c) => c === 3 || c === 6;
    // the verge as the builders draw it (js/world-nring.js vergeRow, js/world-rbring.js rbVerge): [offset, height above the road]
    const prof = (i, sd) => { const bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], bk = (o) => bankY(i, sd * o), lift = (o, h) => [o, Math.max(h, gT(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) + 0.06 - y - bk(o))];
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)]; };
    const hAt = (i, sd, o) => { const Q = prof(i, sd); let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++; const a = Q[k], b = Q[k + 1];
      return T.hy[i] + bankY(i, sd * o) + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    const hV = (i0) => (x, z) => { const q = near(x, z), j = q.i >= 0 && gap(q.i, i0, N) < 12 ? q.i : i0, sd = q.lat >= 0 ? 1 : -1; return hAt(j, sd, Math.abs(q.lat)); };
    const st = { zaplate: 0, sopi: 0, pas: 0 };
    { const R = rng(L.seed), soft = softScen(root, matV), step = L.step;
      for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) {
        if (pit(i, sd) || ro(i, sd)) continue;
        const bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + (T.curb && T.curb[i] ? cw : 0.05) + 0.5, e1 = bar - 0.45, g = hV(i);
        const [bx, bz] = at(i, sd, bar + 4, 0), c = lc ? lc(bx, bz) : 0; if (skip(c)) continue;
        const own = (x, z) => { const q = near(x, z); return q.i >= 0 && gap(q.i, i, N) * ds < 12 && q.dd <= 0 && Math.abs(q.lat) > e0 - 0.3 && Math.abs(q.lat) < bar - 0.3 && q.lat * sd > 0 && !excluded(x, z); };
        if (e1 - e0 > 0.9) for (let k = 0, n = (e1 - e0) > 3 ? 2 : 1; k < n; k++) {
          const r0 = R(), o = e0 + R() * (e1 - e0), [x, z] = at(i, sd, o, (R() - 0.5) * step);
          if (r0 > L.share) continue;
          const Pp = L.verge(R, o, e0, e1, c); if (!Pp) continue;
          const rr = Math.min(Pp.r, (e1 - e0) * 0.5, o - e0 + 0.4, e1 - o + 0.4);
          if (rr > 0.3 && own(x, z)) { soil(soft, g, x, z, rr, Pp.col, R, 0.04); st.zaplate++; }
        }
        if (R() < L.foot) { const o = bar - 0.35 - R() * 0.35, [x, z] = at(i, sd, o, (R() - 0.5) * 2.6);
          if (own(x, z)) { const h = R(); tuft(soft.get(x, z), x, g(x, z), z, 0.22 + h * 0.16, 0.26 + h * 0.24, T_(R, c === 1 ? L.tuftW : L.tuft), R, 5); st.sopi++; } }
      }
      soft.done(); }
    // past the fences, L.from to L.to m (the builders' verge ends ~3.2 m past them), L.farN tries a slot: wide low patches (larger the farther), so the ground reads as ground out to the horizon
    { const R = rng(L.seed + 1), soft = softScen(root, matV), step = L.farStep;
      const slope = (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
      for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) for (let kk = 0; kk < (L.farN || 1); kk++) {
        const r0 = R(), r1 = R(), r2 = R(); if (r0 > L.farShare) continue;
        const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + L.from + r1 * (L.to - L.from), a = (r2 - 0.5) * step;
        const [x, z] = at(i, sd, o, a), q = near(x, z);
        if (q.i < 0 || gap(q.i, i, N) * ds > o + 10 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0 || badP(x, z)) continue;
        const y = gT(x, z); if (!(y > T.hy[i] - L.drop) || slope(x, z) > 1.0) continue;
        const c = lc ? lc(x, z) : 0; if (skip(c)) continue;
        const Pp = L.far(R, o - bar, c, 1 + 0.6 * Math.min(1, (o - bar - L.from) / (L.to - L.from))); if (!Pp) continue;
        soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.06); st.pas++;
      }
      soft.done(); }
    return st;
  };

  /* ---- Nürburg (its own builder, js/world-nring.js: it calls World.ext.goreRob(…, 'nring', …) once its ground is laid) ---- */
  const NR = {
    lawn: [[0.36, 0.48, 0.23], [0.4, 0.51, 0.25]], lush: [[0.22, 0.34, 0.14], [0.25, 0.37, 0.16]], pale: [[0.52, 0.56, 0.32], [0.56, 0.58, 0.35]],
    worn: [[0.5, 0.45, 0.33], [0.55, 0.49, 0.36]], grit: [[0.52, 0.5, 0.46], [0.57, 0.55, 0.5]], hay: [[0.5, 0.52, 0.31], [0.54, 0.54, 0.33]],
    needle: [[0.3, 0.24, 0.17], [0.34, 0.27, 0.19]], leaf: [[0.45, 0.33, 0.2], [0.5, 0.37, 0.23]], young: [[0.3, 0.42, 0.2], [0.34, 0.45, 0.22]],
    tuft: [[0.42, 0.5, 0.26], [0.56, 0.56, 0.34]], tuftW: [[0.32, 0.42, 0.2], [0.4, 0.46, 0.24]],
  };
  const LNR = { seed: 53101, step: 3.0, share: 0.85, foot: 0.2, farStep: 4, farN: 2, farShare: 0.8, from: 3.6, to: 60, drop: 12,
    verge: (R, o, e0, e1, c) => { const u = R(), lip = o > e1 - 1.2;
      return lip && u < 0.12 ? P(R, NR.worn, 1, 0.45, 0.5) : o < e0 + 1.0 && u < 0.2 ? P(R, NR.grit, 1, 0.4, 0.5)
        : u < 0.4 ? P(R, NR.lush, 1, 0.8, 1.2) : u < 0.72 ? P(R, NR.pale, 1, 0.8, 1.2) : c === 1 && u < 0.86 ? P(R, NR.needle, 1, 0.6, 0.8) : P(R, NR.lawn, 1, 0.8, 1.0); },
    tuft: NR.tuft, tuftW: NR.tuftW,
    far: (R, o, c, k) => { const u = R();
      return c === 1 ? (u < 0.5 ? P(R, NR.needle, k, 1.6, 1.4) : u < 0.8 ? P(R, NR.leaf, k, 1.4, 1.4) : P(R, NR.young, k, 1.4, 1.2))
        : c === 2 ? (u < 0.6 ? P(R, NR.young, k, 1.6, 1.4) : P(R, NR.lush, k, 1.6, 1.4))
        : u < 0.4 ? P(R, NR.lush, k, 1.6, 1.6) : u < 0.75 ? P(R, NR.pale, k, 1.6, 1.6) : P(R, NR.hay, k, 1.0, 1.0); } };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'nring') try {
        const T = API.T, out = ctx.out;
        if (out && T && T.def && T.def.id === 'nring') out.robBt53 = edges(ctx, { root: ctx.root, matV: out.matV, excluded: ctx.excluded, gT: o.gH, near: o.near, lc: o.lc, bankY: API.nrBankY }, LNR);
      } catch (e) { console.error('chase-bt53 (nring):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }

  /* ---- Sosnová (the shared circuit builder, js/world-rbring.js: its look's extra chained) ---- */
  const SO = {
    lawn: [[0.38, 0.52, 0.22], [0.42, 0.54, 0.25]], lush: [[0.25, 0.39, 0.15], [0.28, 0.42, 0.17]], pale: [[0.45, 0.54, 0.26], [0.48, 0.56, 0.28]],
    dry: [[0.54, 0.55, 0.32], [0.58, 0.57, 0.34]], sand: [[0.64, 0.58, 0.43], [0.68, 0.61, 0.46]], straw: [[0.6, 0.58, 0.35], [0.64, 0.6, 0.37]],
    stub: [[0.66, 0.62, 0.4], [0.7, 0.64, 0.42]], needle: [[0.5, 0.36, 0.22], [0.54, 0.39, 0.24]],
    tuft: [[0.48, 0.54, 0.28], [0.66, 0.62, 0.38]], tuftW: [[0.36, 0.48, 0.2], [0.44, 0.52, 0.25]],
  };
  const LSO = { seed: 53201, step: 2.6, share: 0.85, foot: 0.2, farStep: 3.5, farN: 2, farShare: 0.8, from: 3.6, to: 60, drop: 4,
    verge: (R, o, e0, e1, c) => { const u = R(), lip = o > e1 - 1.4;
      return lip && u < 0.14 ? P(R, SO.sand, 1, 0.45, 0.5) : u < 0.45 ? P(R, SO.lush, 1, 0.6, 0.9) : u < 0.85 ? P(R, SO.pale, 1, 0.6, 0.9) : P(R, SO.dry, 1, 0.5, 0.7); },
    tuft: SO.tuft, tuftW: SO.tuftW,
    far: (R, o, c, k) => { const u = R();
      return c === 1 ? (u < 0.6 ? P(R, SO.needle, k, 1.6, 1.4) : u < 0.8 ? P(R, SO.sand, k, 1.2, 1.0) : P(R, SO.lush, k, 1.4, 1.2))
        : u < 0.32 ? P(R, SO.straw, k, 1.6, 1.6) : u < 0.6 ? P(R, SO.lawn, k, 1.6, 1.6) : u < 0.8 ? P(R, SO.stub, k, 1.8, 1.6) : u < 0.92 ? P(R, SO.dry, k, 1.4, 1.4) : P(R, SO.sand, k, 1.0, 1.0); } };
  const LS = (API.rbLook || {}).sosnova;
  if (LS && chain) chain(LS, (ctx) => { try {
    const T = API.T, { nrGround, nrLC, nrNear } = API;
    if (!T || (T.def && T.def.id !== 'sosnova') || !ctx.out) return;
    ctx.out.robBt53 = edges(ctx, { root: ctx.root, matV: ctx.matV, excluded: ctx.excluded, gT: nrGround, near: nrNear, lc: nrLC, bankY: API.nrBankY }, LSO);
  } catch (e) { console.error('chase-bt53 (sosnova):', e); } });
})();
