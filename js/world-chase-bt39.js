/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the thirty-ninth group of the real tracks: Pembrey and Pikes Peak,
   a second pass on the two tracks whose ground behind the barriers the twenty-first and the sixteenth group already set
   (js/world-chase-bt21.js: Pembrey's coastal grass, rushes and needle litter; js/world-chase-bt16.js: Pikes Peak's grass, needles, gravel
   and tundra cushions). From behind the car both still showed one even face beside the road: on Pembrey the mown verge between the kerb
   and the fence in one green, the sand run-offs in one flat sand, the open airfield grass past the fences; on Pikes Peak the bank above
   and below the road in the builder's one colour, and the slope out to the horizon a smooth wash. So here, on those strips only:
   on Pembrey (docs/proge/pembrey.md: »peščeni izletni pasovi v ovinkih, drugod pokošena trava«, »obalna trava v suhih in vlažnih lisah«,
   »med borovim gozdom in sipinami ob morju«) the mown grass in lighter, darker and drier patches, the sand blown onto it at the fence's
   foot, the run-offs' sand in damp and paler patches; past the fences to ~10 m the dry and the damp patches of the coastal grass, bare sand
   and the pines' needles where the woods come up; out to ~55 m a sparse band of wide low patches of the same. On Pikes Peak
   (docs/proge/pikes.md, the builder's ground pkCol: forest floor, pink granite gravel, olive grass, tundra) to ~10 m past the barriers the
   granite's grit, the olive grass and the needle litter under the trees in patches, with tufts; out to ~55 m wide low patches of the
   gravel, the tundra's green-brown and the litter. Nothing on the asphalt, the kerbs or the pits' side along the pits, nothing on built
   ground or car parks (land cover 3), on Pikes nothing on the snow (5) or the bare steep granite (4), nothing where another leg's road is
   nearer. pikesg (the gravel version, same builder) stays as it is. All of it in meshes of their own (softScen: 256 m chunks, no shadow);
   the terrain, the road, the barriers, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, softScen, mix3, chain } = BT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // (as the thirty-first group: a fifth of the way to their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const P = (R, a, b, r0, r1) => ({ col: mute(vary(mix3(a, b, R()), R, 0.015)), r: r0 + R() * r1 });
  const T_ = (R, a, b) => mute(vary(mix3(a, b, R()), R, 0.03), 0.95);
  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };

  /* past the barrier line on both sides, every C.step m: C.n places from C.from to C.to m past it, only where this leg's road is the
     nearest (near: {i, lat}), not in bad, not far below the road (C.drop) nor steeper than C.maxSl; C.put(soft, gT, x, y, z, o, R, lc, sl)
     lays the patch or the tuft and says what it was (a key of st) */
  const outer = (root, matV, gT, near, lc, bad, seed, C, st) => {
    const T = API.T; if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length, loop = !!C.loop;   // (C.loop: a circuit, its indices wrap)
    const slope = (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) for (let k = 0; k < C.n; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > C.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + C.from + Math.pow(r1, C.pw || 1) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || (loop ? gap(q.i, i, N) : Math.abs(q.i - i)) * T.ds > o + 10 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0) continue;
      if (bad(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - C.drop)) continue;
      const sl = slope(x, z); if (sl > C.maxSl) continue;
      const c = lc ? lc(x, z) : 0; if (C.skipLC && C.skipLC(c)) continue;
      const kk = C.put(soft, gT, x, y, z, o - bar, R, c, sl); if (kk) st[kk] = (st[kk] || 0) + 1;
    }
    soft.done();
    return st;
  };

  /* ---- Pembrey (the shared circuit builder, js/world-rbring.js: its look's extra chained) ---- */
  const PB = {
    grass: [[0.38, 0.51, 0.22], [0.41, 0.53, 0.24]], grassD: [[0.29, 0.42, 0.17], [0.32, 0.45, 0.18]], dry: [[0.54, 0.54, 0.31], [0.58, 0.56, 0.34]],
    sand: [[0.74, 0.68, 0.52], [0.78, 0.71, 0.55]], damp: [[0.6, 0.55, 0.43], [0.64, 0.58, 0.45]], pale: [[0.82, 0.77, 0.62], [0.85, 0.8, 0.66]],
    coast: [[0.44, 0.53, 0.26], [0.66, 0.63, 0.4]], rush: [[0.3, 0.42, 0.19], [0.36, 0.46, 0.22]], needle: [[0.46, 0.35, 0.22], [0.5, 0.38, 0.24]],
  };
  const pembrey = (ctx) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrLC, nrSlope, nrNear } = API;
    if (!root || !matV || !T || !T.br || !nrGround || !nrLC || !nrNear) return;
    const bankY = API.nrBankY || (() => 0), N = T.px.length, w = T.w, cw = T.curbW || 1, ds = T.ds;
    const pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const pit = (i, sd) => !!pd && sd === PSD && pitI(i);
    const badP = (x, z) => { if (excluded(x, z)) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    // the verge as the builder draws it (js/world-rbring.js rbVerge, with a banked corner's tilt): [offset, height above the road]
    const prof = (i, sd) => { const bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], bk = (o) => bankY(i, sd * o), lift = (o, h) => [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) + 0.06 - y - bk(o))];
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)]; };
    const hAt = (i, sd, o) => { const Q = prof(i, sd); let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++; const a = Q[k], b = Q[k + 1];
      return T.hy[i] + bankY(i, sd * o) + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    const hV = (i0) => (x, z) => { const q = nrNear(x, z), j = q.i >= 0 && gap(q.i, i0, N) < 12 ? q.i : i0, sd = q.lat >= 0 ? 1 : -1; return hAt(j, sd, Math.abs(q.lat)); };
    const st = { zaplate: 0, pesek: 0, sopi: 0 };
    const R = rng(39101), soft = softScen(root, matV), step = 5.0;
    for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) {
      if (pit(i, sd)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], gv = sd > 0 ? T.gravR : T.gravL, trap = !!(gv && gv[i]);
      const e0 = w + (T.curb && T.curb[i] ? cw : 0.05) + 0.5, e1 = bar - (trap ? 1.0 : 0.45), g = hV(i);
      const own = (x, z) => { const q = nrNear(x, z); return q.i >= 0 && gap(q.i, i, N) * ds < 12 && q.dd <= 0 && Math.abs(q.lat) > e0 - 0.3 && Math.abs(q.lat) < bar - 0.3 && q.lat * sd > 0 && !excluded(x, z); };
      // the strip between the kerb and the fence: on a run-off its sand, elsewhere the mown grass
      if (e1 - e0 > 0.9) for (let k = 0, n = (e1 - e0) > 6 && !trap ? 2 : 1; k < n; k++) {
        const r0 = R(), o = e0 + R() * (e1 - e0), [x, z] = at(i, sd, o, (R() - 0.5) * step);
        if (r0 > (trap ? 0.5 : 0.55)) continue;
        let Pp, lift = 0.04, gg = g;
        if (trap) { const u = R(); Pp = u < 0.45 ? P(R, PB.damp[0], PB.damp[1], 0.7, 1.0) : u < 0.75 ? P(R, PB.pale[0], PB.pale[1], 0.7, 1.0) : P(R, PB.sand[0], PB.sand[1], 0.8, 1.2);
          gg = (xx, zz) => g(xx, zz) + 0.03; lift = 0.035; }   // (over the run-off's own sand, a little above the verge)
        else { const u = R(), sandy = R() < 0.18 && o > e1 - 2.2;
          Pp = sandy ? P(R, PB.sand[0], PB.sand[1], 0.5, 0.7)   // (blown in from the dunes, at the fence's foot)
            : u < 0.36 ? P(R, PB.grassD[0], PB.grassD[1], 0.8, 1.2)   // (lusher, darker: the damp patches)
            : u < 0.7 ? P(R, PB.grass[0], PB.grass[1], 0.8, 1.2)   // (lighter)
            : P(R, PB.dry[0], PB.dry[1], 0.7, 1.0); if (sandy) st.pesek++; }   // (the dry patches)
        const rr = Math.min(Pp.r, (e1 - e0) * 0.5, o - e0 + 0.4, e1 - o + 0.4);
        if (rr > 0.3 && own(x, z)) { soil(soft, gg, x, z, rr, Pp.col, R, lift); st.zaplate++; }
      }
      // the uncut coastal grass at the fence's foot, on its road side
      if (!trap && R() < 0.14) { const o = bar - 0.35 - R() * 0.35, [x, z] = at(i, sd, o, (R() - 0.5) * 2.6);
        if (own(x, z)) { const h = R(); tuft(soft.get(x, z), x, g(x, z), z, 0.22 + h * 0.16, 0.28 + h * 0.26, T_(R, PB.coast[0], PB.coast[1]), R, 5); st.sopi++; } }
    }
    soft.done();
    const skipLC = (c) => c === 3;
    // past the fences to ~10 m: the coastal grass's dry and damp patches, bare sand, the pines' needles; tufts and rushes between
    const breg = outer(root, matV, nrGround, nrNear, nrLC, badP, 39102, { loop: true, step: 4.0, n: 2, share: 0.75, from: 0.45, to: 10, pw: 1.3, drop: 1.5, maxSl: 1.2, skipLC,
      put: (soft, gT, x, y, z, o, R, c) => { const u = R();
        if (o < 3.2) return null;   // (the builder's own verge runs 3.2 m past the fence: the first group's tufts there)
        if (u < 0.62) { const Pp = c === 1 ? (R() < 0.7 ? P(R, PB.needle[0], PB.needle[1], 0.9, 1.1) : P(R, PB.grassD[0], PB.grassD[1], 0.8, 1.0))
            : R() < 0.35 ? P(R, PB.dry[0], PB.dry[1], 0.9, 1.2) : R() < 0.5 ? P(R, PB.grassD[0], PB.grassD[1], 0.9, 1.2) : P(R, PB.sand[0], PB.sand[1], 0.6, 0.9);
          soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.05); return 'breg'; }
        const h = R(), rs = c !== 1 && R() < 0.3;
        tuft(soft.get(x, z), x, y, z, 0.26 + h * 0.18, rs ? 0.45 + h * 0.3 : 0.3 + h * 0.26, rs ? T_(R, PB.rush[0], PB.rush[1]) : T_(R, PB.coast[0], PB.coast[1]), R, 5); return rs ? 'locje' : 'bregSopi'; } }, {});
    // out to ~55 m: a sparse band of wide low patches of the same, so the airfield's grass reads as ground, not one colour
    const pas = outer(root, matV, nrGround, nrNear, nrLC, badP, 39103, { loop: true, step: 6, n: 1, share: 0.5, from: 10, to: 55, drop: 4, maxSl: 1.1, skipLC,
      put: (soft, gT, x, y, z, o, R, c) => { const u = R(), k = 1 + 0.5 * Math.min(1, (o - 10) / 45);
        const Pp = c === 1 ? P(R, PB.needle[0], PB.needle[1], 1.6 * k, 1.4 * k) : u < 0.4 ? P(R, PB.dry[0], PB.dry[1], 1.6 * k, 1.6 * k)
          : u < 0.8 ? P(R, PB.grassD[0], PB.grassD[1], 1.6 * k, 1.6 * k) : P(R, PB.sand[0], PB.sand[1], 1.2 * k, 1.0 * k);
        soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.06); return 'pas'; } }, {});
    if (ctx.out) { ctx.out.robBt39 = st; ctx.out.bregBt39 = breg; ctx.out.pasBt39 = pas; }
  };
  const LP = (API.rbLook || {}).pembrey;
  if (LP && chain) chain(LP, (ctx) => { try { pembrey(ctx); } catch (e) { console.error('chase-bt39 (pembrey):', e); } });

  /* ---- Pikes Peak (its own builder, js/world-pikes.js: World.ext.goreRob called last with its ground, only for 'pikes') ---- */
  const PK = {
    grit: [[0.62, 0.52, 0.45], [0.66, 0.55, 0.47]], olive: [[0.48, 0.47, 0.27], [0.56, 0.52, 0.32]], needle: [[0.4, 0.3, 0.2], [0.44, 0.33, 0.22]],
    tundra: [[0.4, 0.41, 0.25], [0.46, 0.41, 0.27]], dust: [[0.6, 0.51, 0.43], [0.63, 0.53, 0.44]], tuft: [[0.46, 0.46, 0.26], [0.6, 0.55, 0.36]],
  };
  const pikes = (ctx, o) => {
    if (!ctx.out || !ctx.root || !ctx.out.matV || !o || !o.gH || !o.near || !API.T || (API.T.def && API.T.def.id !== 'pikes')) return;   // (pikesg: the same builder and id here, its own def.id: stays as it is)
    const gT = o.gH, near = o.near, lc = o.lc, ex = ctx.excluded || (() => false);
    const skipLC = (c) => c === 3 || c === 4 || c === 5;
    const wood = (c) => c === 1 || c === 2;
    // to ~10 m past the barriers: the granite's grit and the road's dust, the olive grass, the needle litter under the trees; tufts between
    ctx.out.bregBt39 = outer(ctx.root, ctx.out.matV, gT, near, lc, ex, 39201, { step: 4.0, n: 2, share: 0.8, from: 0.4, to: 10, pw: 1.3, drop: 3, maxSl: 1.3, skipLC,
      put: (soft, g, x, y, z, oo, R, c) => { const u = R();
        if (u < 0.65) { const Pp = wood(c) && R() < 0.6 ? P(R, PK.needle[0], PK.needle[1], 0.9, 1.1)
            : oo < 3 && R() < 0.5 ? P(R, PK.dust[0], PK.dust[1], 0.7, 0.9) : R() < 0.5 ? P(R, PK.grit[0], PK.grit[1], 0.8, 1.1) : P(R, PK.olive[0], PK.olive[1], 0.9, 1.1);
          soil(soft, g, x, z, Pp.r, Pp.col, R, 0.05); return 'breg'; }
        const h = R(); tuft(soft.get(x, z), x, y, z, 0.22 + h * 0.18, 0.26 + h * 0.24, T_(R, PK.tuft[0], PK.tuft[1]), R, 5); return 'bregSopi'; } }, {});
    // out to ~55 m: wide low patches of the gravel, the tundra's green-brown and the litter
    ctx.out.pasBt39 = outer(ctx.root, ctx.out.matV, gT, near, lc, ex, 39202, { step: 6, n: 1, share: 0.5, from: 10, to: 55, drop: 12, maxSl: 1.1, skipLC,
      put: (soft, g, x, y, z, oo, R, c) => { const u = R(), k = 1 + 0.5 * Math.min(1, (oo - 10) / 45);
        const Pp = wood(c) ? P(R, PK.needle[0], PK.needle[1], 1.6 * k, 1.4 * k) : u < 0.5 ? P(R, PK.grit[0], PK.grit[1], 1.6 * k, 1.6 * k) : P(R, PK.tundra[0], PK.tundra[1], 1.6 * k, 1.6 * k);
        soil(soft, g, x, z, Pp.r, Pp.col, R, 0.06); return 'pas'; } }, {});
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'pikes') try { pikes(ctx, o); } catch (e) { console.error('chase-bt39 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);
    World.ext.goreRob = f;
  }
})();
