/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fifty-fifth group of the real tracks: Sepang and Termas de
   Río Hondo, a second pass on two circuits of the shared builder (js/world-rbring.js) whose ground from behind the car still showed one
   even face: the verge between the asphalt and the fence in the builder's one lawn, and the ground past the fences out to the horizon a
   smooth wash of the land cover's colour. So here, on those strips only (the same two strips as the fifty-third group's Sosnová,
   js/world-chase-bt53.js):
   on Sepang (docs/proge/sepang.md: »bujne tropske trate s pokošenimi pasovi, zalite do ograj in dlje; peščeni lovilci … nasadi oljnih
   palm …, v vlažnih kotih temno grmičevje sekundarnega gozda«) on the verge the lush lawn in its deeper, its paler (mown) and its wet
   patches, the sand of the traps blown to the fence's foot; past the fences to ~60 m on the lawns (land cover 0) the lush and the mown
   green, under the oil palms (1) their dark floor and the old fronds' brown stacked between the rows, in the secondary growth (2) its dark
   undergrowth.
   On Termas de Río Hondo (docs/proge/riohondo.md: »pokošene trate ob ograjah, dlje suha slamnata trava z lisami gole zemlje; gozdiči
   suhega gozda (monte) …, polja (strnišča, gola zemlja, zeleni posevki) … blatna obala«) on the mown lawn by the fences its greener, its
   paler and its dry patches, the dust at the fence's foot; past the fences out to ~60 m the plain's straw grass with bare grey-brown
   earth, under the monte its dust and fallen leaves, on the fields stubble, bare earth and green crops; nothing on the lake or its shore.
   Nothing on the asphalt, the kerbs, the run-offs (T.gravL / gravR: Sepang's gravel, Río Hondo's asphalt) or the pits' side along the
   pits, nothing on built ground (land cover 3) or the water (6), nothing where another leg's road is nearer. All of it in meshes of their
   own (softScen: 256 m chunks, no shadow); the terrain, the road, the fences, the trees and the driving stay.
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
     L.far(R, o, c, k) -> a patch for the band past the fences (L.from to L.to m), L.wet(x, z) -> true where nothing goes (a lake); seeds L.seed, L.seed + 1 */
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
      for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) { if (L.skipI && L.skipI(i * ds, sd)) continue;
        if (pit(i, sd) || ro(i, sd)) continue;
        const bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + (T.curb && T.curb[i] ? cw : 0.05) + 0.5, e1 = bar - 0.45, g = hV(i);
        const [bx, bz] = at(i, sd, bar + 4, 0), c = lc ? lc(bx, bz) : 0; if (skip(c)) continue;
        const own = (x, z) => { const q = near(x, z); return q.i >= 0 && gap(q.i, i, N) * ds < 12 && q.dd <= 0 && Math.abs(q.lat) > e0 - 0.3 && Math.abs(q.lat) < bar - 0.3 && q.lat * sd > 0 && !excluded(x, z); };
        if (e1 - e0 > 0.9) for (let k = 0, n = (e1 - e0) > 6 ? 2 : 1; k < n; k++) {
          const r0 = R(), o = e0 + R() * (e1 - e0), [x, z] = at(i, sd, o, (R() - 0.5) * step);
          if (r0 > L.share) continue;
          const Pp = L.verge(R, o, e0, e1, c, x, z); if (!Pp) continue;
          const rr = Math.min(Pp.r, (e1 - e0) * 0.5, o - e0 + 0.4, e1 - o + 0.4);
          if (rr > 0.3 && own(x, z)) { soil(soft, g, x, z, rr, Pp.col, R, 0.04); st.zaplate++; }
        }
        if (R() < L.foot) { const o = bar - 0.35 - R() * 0.35, [x, z] = at(i, sd, o, (R() - 0.5) * 2.6);
          if (own(x, z)) { const h = R(); tuft(soft.get(x, z), x, g(x, z), z, 0.22 + h * 0.16, 0.26 + h * 0.24, T_(R, c === 1 ? L.tuftW : L.tuft), R, 5); st.sopi++; } }
      }
      soft.done(); }
    // past the fences, L.from to L.to m: wide low patches (larger the farther), so the ground reads as ground out to the horizon
    { const R = rng(L.seed + 1), soft = softScen(root, matV), step = L.farStep;
      const slope = (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
      for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) { if (L.skipI && L.skipI(i * ds, sd)) continue;
        const r0 = R(), r1 = R(), r2 = R(); if (r0 > L.farShare) continue;
        const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + L.from + r1 * (L.to - L.from), a = (r2 - 0.5) * step;
        const [x, z] = at(i, sd, o, a), q = near(x, z);
        if (q.i < 0 || gap(q.i, i, N) * ds > o + 10 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0 || badP(x, z)) continue;
        const y = gT(x, z); if (!(y > T.hy[i] - L.drop) || slope(x, z) > 1.0) continue;
        const c = lc ? lc(x, z) : 0; if (skip(c) || (L.wet && L.wet(x, z))) continue;
        const Pp = L.far(R, o - bar, c, 1 + 0.6 * Math.min(1, (o - bar - L.from) / (L.to - L.from)), x, z); if (!Pp) continue;
        soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.06); st.pas++;
      }
      soft.done(); }
    return st;
  };

  /* ---- Sepang (the shared circuit builder, js/world-rbring.js: its look's extra chained) ---- */
  const SP = {
    lawn: [[0.3, 0.47, 0.18], [0.34, 0.5, 0.2]], lush: [[0.22, 0.4, 0.14], [0.25, 0.43, 0.16]], mown: [[0.4, 0.55, 0.24], [0.44, 0.58, 0.27]],
    wet: [[0.2, 0.33, 0.14], [0.23, 0.36, 0.16]], sand: [[0.7, 0.62, 0.46], [0.74, 0.66, 0.5]], worn: [[0.52, 0.44, 0.32], [0.56, 0.48, 0.35]],
    palmF: [[0.22, 0.25, 0.13], [0.26, 0.28, 0.15]], frond: [[0.42, 0.34, 0.2], [0.47, 0.38, 0.23]], under: [[0.17, 0.27, 0.12], [0.2, 0.3, 0.14]],
    tuft: [[0.3, 0.46, 0.18], [0.4, 0.52, 0.24]], tuftW: [[0.22, 0.38, 0.14], [0.28, 0.42, 0.18]],
  };
  const LSP = { seed: 55101, step: 9.0, share: 0.4, foot: 0.05, farStep: 14, farShare: 0.4, from: 16, to: 60, drop: 8,
    verge: (R, o, e0, e1, c) => { const u = R(), lip = o > e1 - 1.2;
      return lip && u < 0.1 ? P(R, SP.worn, 1, 0.45, 0.5) : u < 0.34 ? P(R, SP.lush, 1, 0.8, 1.2) : u < 0.7 ? P(R, SP.mown, 1, 0.8, 1.2) : u < 0.88 ? P(R, SP.wet, 1, 0.7, 1.0) : P(R, SP.lawn, 1, 0.8, 1.0); },
    tuft: SP.tuft, tuftW: SP.tuftW,
    far: (R, o, c, k) => { const u = R();
      return c === 1 ? (u < 0.6 ? P(R, SP.palmF, k, 1.6, 1.4) : P(R, SP.frond, k, 1.2, 1.2))
        : c === 2 ? (u < 0.7 ? P(R, SP.under, k, 1.6, 1.4) : P(R, SP.palmF, k, 1.4, 1.2))
        : u < 0.4 ? P(R, SP.lush, k, 1.6, 1.6) : u < 0.78 ? P(R, SP.mown, k, 1.6, 1.6) : P(R, SP.wet, k, 1.4, 1.4); } };

  /* ---- Termas de Río Hondo (the same builder) ---- */
  const RH = {
    lawn: [[0.4, 0.5, 0.24], [0.44, 0.53, 0.27]], lush: [[0.32, 0.44, 0.19], [0.35, 0.47, 0.21]], pale: [[0.52, 0.55, 0.32], [0.56, 0.58, 0.35]],
    dry: [[0.62, 0.57, 0.38], [0.66, 0.6, 0.41]], dust: [[0.6, 0.53, 0.43], [0.64, 0.57, 0.46]], straw: [[0.68, 0.6, 0.4], [0.72, 0.64, 0.44]],
    bare: [[0.56, 0.49, 0.4], [0.6, 0.52, 0.43]], leaf: [[0.43, 0.37, 0.27], [0.47, 0.4, 0.29]], stub: [[0.74, 0.66, 0.45], [0.77, 0.69, 0.48]],
    crop: [[0.34, 0.46, 0.2], [0.38, 0.5, 0.22]],
    tuft: [[0.52, 0.53, 0.3], [0.68, 0.62, 0.4]], tuftW: [[0.44, 0.44, 0.26], [0.52, 0.48, 0.3]],
  };
  const LRH = { seed: 55201, step: 5.0, share: 0.5, foot: 0.14, farStep: 7, farShare: 0.55, from: 16, to: 60, drop: 4,
    verge: (R, o, e0, e1, c) => { const u = R(), lip = o > e1 - 1.4;
      return lip && u < 0.14 ? P(R, RH.dust, 1, 0.45, 0.5) : u < 0.34 ? P(R, RH.lush, 1, 0.8, 1.2) : u < 0.7 ? P(R, RH.pale, 1, 0.8, 1.2) : P(R, RH.dry, 1, 0.7, 1.0); },
    tuft: RH.tuft, tuftW: RH.tuftW,
    far: (R, o, c, k) => { const u = R();
      return c === 1 ? (u < 0.55 ? P(R, RH.dust, k, 1.4, 1.2) : P(R, RH.leaf, k, 1.4, 1.2))
        : c === 2 ? (u < 0.45 ? P(R, RH.stub, k, 1.8, 1.6) : u < 0.75 ? P(R, RH.bare, k, 1.6, 1.4) : P(R, RH.crop, k, 1.6, 1.4))
        : u < 0.45 ? P(R, RH.straw, k, 1.6, 1.6) : u < 0.7 ? P(R, RH.dry, k, 1.6, 1.4) : u < 0.88 ? P(R, RH.bare, k, 1.4, 1.4) : P(R, RH.pale, k, 1.4, 1.4); } };

  BT.edges55 = edges;   // (the sixty-eighth group's Quezaltepeque and Kildare reuse the two strips; L.verge and L.far also get the patch's x, z)
  const LK = API.rbLook || {};
  const add = (id, L, wet) => { if (LK[id] && chain) chain(LK[id], (ctx) => { try {
    const T = API.T, { nrGround, nrLC, nrNear } = API;
    if (!T || (T.def && T.def.id !== id) || !ctx.out) return;
    ctx.out.robBt55 = edges(ctx, { root: ctx.root, matV: ctx.matV, excluded: ctx.excluded, gT: nrGround, near: nrNear, lc: nrLC, bankY: API.nrBankY }, wet ? Object.assign({ wet: wet(T) }, L) : L);
  } catch (e) { console.error('chase-bt55 (' + id + '):', e); } }); };
  // (Sepang: nothing by the big grandstand between the two straights, where the phone's busiest frame already is: its walls stand 2.5 m
  //  from the road there, so the verge is a strip; the two big stands' [from, to] (metres from the start line) from the track's file, 40 m on either end, both sides)
  add('sepang', Object.assign({ skipI: (d, sd) => { const T = API.T, Lt = T && T.len, S = (T && T.def && T.def.stands) || [];
    if (!Lt) return false; d -= T.startS || 0; for (const s of S) { if (s[3] < 12) continue; const a = s[0] - 40, b = s[1] + 40;
      for (const dd of [d, d - Lt, d + Lt]) if (dd > a && dd < b) return true; } return false; } }, LSP));
  // (Río Hondo's lake: nothing below a metre above its level, so its muddy shore stays the builder's)
  add('riohondo', LRH, (T) => { const LY = ((T.def.sk || {}).lake || {}).y; return LY == null || !API.nrDem ? null : (x, z) => API.nrDem(x, z) < LY + 1.0; });
})();
