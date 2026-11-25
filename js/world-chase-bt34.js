/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the thirty-fourth group of the real tracks: Zandvoort and Ujarrás,
   a second pass on the two tracks whose ground behind the barriers the sixth and the eleventh group already set (js/world-chase-bt6.js:
   the marram, scrub and sand on Zandvoort's dunes; js/world-chase-bt11.js: Ujarrás's three bands). From behind the car both still showed
   one even face beside the road: on Zandvoort the mown verge several metres wide between the kerb and the guard rail in its two greens,
   the sand traps in one flat pale sand, and the first metres past the rail (the mowing starts 3.5 m out, the dunes' tufts further); on
   Ujarrás the verge between the asphalt and the barrier, metres wide on the big bends, in one pale olive, and the bank past it bare up to
   the forest. So here, on those strips only: on Zandvoort (docs/proge/zandvoort.md: mown grass, sand traps, the dunes' marram, sea
   buckthorn and blown sand) the mown grass in lighter, darker and late-summer drier patches, the sand blown in from the dunes where they
   lie behind the rail, the uncut grass's tufts at the rail's foot; on the traps the raked sand in darker, damp and paler patches; past the
   rail the uncut strip at its foot, on the dunes the sand and the marram right up to it. On Ujarrás (docs/proge/ujarras.md: »trava ob cesti«,
   tropical broadleaf forest, the valley's dark volcanic soil) the verge's grass in greener and yellower patches, the dark earth bare where
   the cars cut the bends, the forest's brown leaves blown down to the barrier, the tall grass in tufts at its foot; on the bank the grass,
   the dark earth and the leaf litter in patches, tall grass, ferns' low clumps. Nothing on the asphalt, the kerbs or the pit side along the
   pits, nothing where another leg's road is nearer, round the lookout, on a banked corner's tilt off its own height. All of it in meshes of
   their own (softScen: 256 m chunks, no shadow); the terrain, the road, its verges, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.mix3 || !rng) return;
  const { soil, tuft, cushion, softScen, mix3, chain } = BT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // (as the thirty-first group: a fifth of the way to their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const P = (R, a, b, r0, r1) => ({ col: mute(vary(mix3(a, b, R()), R, 0.015)), r: r0 + R() * r1 });
  const T_ = (R, a, b) => mute(vary(mix3(a, b, R()), R, 0.03), 0.95);

  /* ---- Zandvoort (the shared circuit builder, js/world-rbring.js: its look's extra chained) ---- */
  const ZV = {
    grass: [[0.34, 0.5, 0.19], [0.37, 0.52, 0.2]], grassD: [[0.25, 0.39, 0.14], [0.28, 0.42, 0.15]], dry: [[0.48, 0.5, 0.25], [0.52, 0.52, 0.27]],
    sand: [[0.82, 0.76, 0.6], [0.86, 0.8, 0.64]], damp: [[0.66, 0.6, 0.47], [0.7, 0.64, 0.5]], pale: [[0.9, 0.86, 0.72], [0.93, 0.89, 0.76]],
    marram: [[0.5, 0.56, 0.36], [0.74, 0.7, 0.46]], uncut: [[0.38, 0.5, 0.24], [0.5, 0.56, 0.32]], buck: [0.44, 0.5, 0.36],
  };
  const zandvoort = (ctx, r) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrLC, nrSlope, nrNear } = API;
    if (!root || !matV || !T || !T.br || !nrGround || !nrLC || !nrNear) return;
    const bankY = API.nrBankY || (() => 0), N = T.px.length, w = T.w, cw = T.curbW || 1, ds = T.ds;
    const pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pit = (i, sd) => !!pd && sd === PSD && !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25));
    const gap = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
    // the verge as the builder draws it (js/world-rbring.js rbVerge, with a banked corner's tilt): [offset, height above the road]
    const prof = (i, sd) => { const bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], bk = (o) => bankY(i, sd * o), lift = (o, h) => [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) + 0.06 - y - bk(o))];
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)]; };
    const hAt = (i, sd, o) => { const Q = prof(i, sd); let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++; const a = Q[k], b = Q[k + 1];
      return T.hy[i] + bankY(i, sd * o) + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    const hV = (i0) => (x, z) => { const q = nrNear(x, z), j = q.i >= 0 && gap(q.i, i0) < 12 ? q.i : i0, sd = q.lat >= 0 ? 1 : -1; return hAt(j, sd, Math.abs(q.lat)); };
    const dune = (i, sd, bar) => { let n = 0; for (const o of [3, 6, 10]) { const [x, z] = at(i, sd, bar + o, 0); if (nrLC(x, z) === 2) n++; } return n / 3; };   // (the dunes right behind the rail)
    const st = { zaplate: 0, sopi: 0, pesek: 0, breg: 0, bregSopi: 0, grmi: 0 };
    const R = rng(34101), soft = softScen(root, matV), step = 6.0;
    for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) {
      if (pit(i, sd)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], trap = !!(sd > 0 ? T.gravR : T.gravL)[i], e0 = w + (T.curb && T.curb[i] ? cw : 0.05) + 0.5, e1 = bar - (trap ? 1.0 : 0.45);
      const du = dune(i, sd, bar), g = hV(i);
      const own = (x, z) => { const q = nrNear(x, z); return q.i >= 0 && gap(q.i, i) * ds < 12 && q.dd <= 0 && Math.abs(q.lat) > e0 - 0.3 && Math.abs(q.lat) < bar - 0.3 && q.lat * sd > 0 && !excluded(x, z); };
      // the strip between the kerb and the rail: on a trap the raked sand, elsewhere the mown grass
      if (e1 - e0 > 0.9) for (let k = 0, n = (e1 - e0) > 7 && !trap ? 2 : 1; k < n; k++) {
        const r0 = R(), o = e0 + R() * (e1 - e0), [x, z] = at(i, sd, o, (R() - 0.5) * step);
        if (r0 > (trap ? 0.5 : 0.55)) continue;
        let Pp, lift = 0.04, gg = g;
        if (trap) { const u = R(); Pp = u < 0.45 ? P(R, ZV.damp[0], ZV.damp[1], 0.7, 1.0) : u < 0.75 ? P(R, ZV.pale[0], ZV.pale[1], 0.7, 1.0) : P(R, ZV.sand[0], ZV.sand[1], 0.8, 1.2);
          gg = (xx, zz) => g(xx, zz) + 0.03; lift = 0.035; }   // (over the trap's own sand, 2.8 cm above the verge)
        else { const u = R(), sandy = du > 0.3 && R() < 0.25 + du * 0.4 && o > e1 - 2.5;
          Pp = sandy ? P(R, ZV.sand[0], ZV.sand[1], 0.5, 0.7)   // (blown in from the dunes, at the rail's foot)
            : u < 0.38 ? P(R, ZV.grassD[0], ZV.grassD[1], 0.8, 1.2)   // (lusher, darker)
            : u < 0.7 ? P(R, ZV.grass[0], ZV.grass[1], 0.8, 1.2)   // (lighter)
            : P(R, ZV.dry[0], ZV.dry[1], 0.7, 1.0); if (sandy) st.pesek++; }   // (late summer, drier)
        const rr = Math.min(Pp.r, (e1 - e0) * 0.5, o - e0 + 0.4, e1 - o + 0.4);
        if (rr > 0.3 && own(x, z)) { soil(soft, gg, x, z, rr, Pp.col, R, lift); st.zaplate++; }
      }
      // the uncut grass at the rail's foot (marram where the dunes come up to it), on both of its sides
      if (!trap && R() < 0.1 + du * 0.35) for (let q = 0, n = 1 + Math.floor(R() * 2); q < n; q++) {
        const o = bar - 0.35 - R() * 0.35, [x, z] = at(i, sd, o, (R() - 0.5) * 2.6); if (!own(x, z)) continue;
        const h = R(), m = du > 0.3 && R() < du; tuft(soft.get(x, z), x, g(x, z), z, 0.22 + h * 0.16, 0.26 + h * 0.24, m ? T_(R, ZV.marram[0], ZV.marram[1]) : T_(R, ZV.uncut[0], ZV.uncut[1]), R, 5); st.sopi++;
      }
      // past the rail, up to where the mowing and the dunes' tufts begin: the uncut strip on the lawns, sand and marram on the dunes
      for (let k = 0; k < 1; k++) {
        if (R() < 0.35) continue;
        const r0 = R(), o = bar + 0.45 + Math.pow(R(), 1.2) * 4.0, [x, z] = at(i, sd, o, (R() - 0.5) * step);
        const q = nrNear(x, z); if (q.i < 0 || gap(q.i, i) * ds > 14 || Math.abs(q.lat) < bar + 0.35 || q.lat * sd < 0 || excluded(x, z)) continue;
        const c = nrLC(x, z); if (c === 1 || c === 3 || (nrSlope && nrSlope(x, z) > 0.9)) continue;   // (the woods and the built-up places keep their own ground)
        const y = o < bar + 3.2 ? g(x, z) : nrGround(x, z), gg = o < bar + 3.2 ? g : nrGround;
        if (c === 2) {
          if (r0 < 0.45) { const Pp = P(R, ZV.sand[0], ZV.sand[1], 0.7, 1.0); soil(soft, gg, x, z, Pp.r, Pp.col, R, 0.05); st.breg++; }
          else if (r0 < 0.5) { const h = R(); cushion(soft.get(x, z), x, y, z, 0.45 + h * 0.3, 0.28 + h * 0.25, mute(vary(ZV.buck, R, 0.025), 0.97), R); st.grmi++; }
          else { const h = R(); tuft(soft.get(x, z), x, y, z, 0.3 + h * 0.2, 0.34 + h * 0.3, T_(R, ZV.marram[0], ZV.marram[1]), R, 5); st.bregSopi++; }
        } else {
          if (r0 < 0.45) { const Pp = P(R, ZV.uncut[0], ZV.uncut[1], 0.7, 1.0); soil(soft, gg, x, z, Pp.r, Pp.col, R, 0.05); st.breg++; }
          else if (r0 < 0.75) { const h = R(); tuft(soft.get(x, z), x, y, z, 0.24 + h * 0.16, 0.28 + h * 0.22, T_(R, ZV.uncut[0], ZV.uncut[1]), R, 5); st.bregSopi++; }
        }
      }
    }
    soft.done();
    if (ctx.out) ctx.out.robBt34 = st;
  };
  const LZ = (API.rbLook || {}).zandvoort;
  if (LZ && chain) chain(LZ, (ctx, r) => zandvoort(ctx, r));

  /* ---- Ujarrás (the shared mountain-road builder, js/world-gore.js: World.ext.goreRob called last, on Vršič's corridor's API) ---- */
  const UJ = {
    gr: [[0.36, 0.5, 0.2], [0.42, 0.54, 0.22]], grY: [[0.46, 0.5, 0.26], [0.5, 0.52, 0.28]], earth: [[0.34, 0.26, 0.19], [0.38, 0.29, 0.21]],
    leaf: [[0.4, 0.31, 0.2], [0.44, 0.34, 0.22]], tall: [[0.34, 0.5, 0.18], [0.46, 0.56, 0.24]], fern: [0.24, 0.42, 0.16],
  };
  const UJV = { step: 3.2, share: 0.5, foot: 0.25,
    patch: (R) => { const r = R();
      return r < 0.34 ? P(R, UJ.gr[0], UJ.gr[1], 0.9, 1.3)   // (the verge's grass, greener)
        : r < 0.58 ? P(R, UJ.grY[0], UJ.grY[1], 0.8, 1.1)   // (yellower, sun-dried)
        : r < 0.8 ? P(R, UJ.earth[0], UJ.earth[1], 0.6, 0.9)   // (the dark volcanic earth, bare where the bends are cut)
        : P(R, UJ.leaf[0], UJ.leaf[1], 0.6, 0.8); },   // (the forest's leaves blown down)
    tuft: (R) => T_(R, UJ.tall[0], UJ.tall[1]) };
  const UJB = (look) => ({ step: 3.6, n: 2, reach: 8, share: 0.45, maxSl: 1.4, sl: 0.9, bushShare: 0.25,
    patch: (R, sl) => { const r = R();
      return r < 0.4 ? P(R, UJ.gr[0], UJ.gr[1], 0.9, 1.2) : r < 0.7 || sl > 0.9 ? P(R, UJ.earth[0], UJ.earth[1], 0.8, 1.0) : P(R, UJ.leaf[0], UJ.leaf[1], 0.8, 1.0); },
    tuft: (R) => T_(R, UJ.tall[0], UJ.tall[1]),
    bush: (R) => mute(vary(UJ.fern, R, 0.025), 0.97),   // (the ferns' and the undergrowth's low clumps)
    skip: (x, z) => !!look && Math.hypot(x - look.x, z - look.z) < 16 });
  const ujarras = (ctx) => {
    if (!ctx.out || !ctx.root || !ctx.out.matV || !BT.verge || !BT.bank || !API.vrGround) return;
    const gT = API.vrGround, ex = ctx.excluded || (() => false), look = ctx.out.ujarras && ctx.out.ujarras.lookout;
    const C = UJB(look), bad = (x, z) => ex(x, z) || C.skip(x, z);
    ctx.out.robBt34 = BT.verge(ctx.root, ctx.out.matV, gT, 34201, UJV);
    ctx.out.bregBt34 = BT.bank(ctx.root, ctx.out.matV, gT, bad, 34202, C);
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'ujarras') try { ujarras(ctx); } catch (e) { console.error('chase-bt34 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);
    World.ext.goreRob = f;
  }
})();
