/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixty-eighth group of the real tracks, a second pass:
   Quezaltepeque and Kildare, both on the shared circuit builder (js/world-rbring.js), on the two strips of the fifty-fifth group
   (js/world-chase-bt55.js, BT.edges55: the verge between the asphalt and the fence, and wide low patches past the fences to ~60 m).
   From behind the car both still showed the builder's one mown lawn between the kerbs and the fences, and past the forty-seventh
   (Quezaltepeque) and fifty-sixth (Kildare) groups' tufts and bushes one smooth wash of the land cover's colour out to the horizon.
   Quezaltepeque (docs/proge/quezaltepeque.md: »zelen hribovit svet s suhimi rumenimi lisami: trate, grmovje, gaji listavcev in palm«,
   »stara lava (temna, siva in rjava kamnita tla z nizkim grmovjem)«, »drugod pokošena trava«): on the verge the mown lawn in its
   greener, its paler and its dry yellow patches, the dust at the fence's foot; past the fences the green and the dry yellow patches of
   the hills, under the groves the leaf litter, on the scrubland its darker ground, on the old flow its grey and brown stony ground.
   Kildare (docs/proge/kildare.md: »med pašniki in živimi mejami ravnice«, pastures, fields and wood by the land cover): on the verge
   by the tarmac the mown grass's greener and paler stripes (none on the gravel, where the fifty-sixth group's sprays lie); past the
   fences the pasture's grazed and rank grass, the paler hay-cut ground, the trodden darker ground and the fields' stubble.
   Nothing on the asphalt, the kerbs, the run-offs, the pits' side along the pits, built ground or water, nothing where another leg's
   road is nearer (BT.edges55's own tests). The terrain, the road, the fences, the trees, the horizon rings and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.edges55 || !BT.mix3 || !BT.chain || !rng || !vary) return;
  const { edges55, mix3, chain } = BT;
  // (as the fifty-fifth group: a fifth of the way to their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const P = (R, a, k, r0, r1) => ({ col: mute(vary(mix3(a[0], a[1], R()), R, 0.015)), r: (r0 + R() * r1) * (k || 1) });

  /* ---- Quezaltepeque: the lava plain at the volcano's foot, green with dry yellow patches ---- */
  const QZ = {
    lawn: [[0.36, 0.5, 0.21], [0.4, 0.53, 0.23]], green: [[0.3, 0.46, 0.17], [0.33, 0.49, 0.19]], pale: [[0.48, 0.55, 0.28], [0.52, 0.58, 0.31]],
    dry: [[0.68, 0.63, 0.36], [0.73, 0.67, 0.4]], dust: [[0.56, 0.48, 0.37], [0.6, 0.52, 0.4]], litter: [[0.44, 0.38, 0.26], [0.48, 0.41, 0.28]],
    scrub: [[0.3, 0.38, 0.19], [0.34, 0.41, 0.21]], lava: [[0.36, 0.34, 0.31], [0.42, 0.37, 0.32]], ash: [[0.46, 0.41, 0.35], [0.5, 0.45, 0.38]],
    tuft: [[0.36, 0.5, 0.2], [0.62, 0.6, 0.36]], tuftW: [[0.3, 0.44, 0.18], [0.4, 0.48, 0.22]],
  };
  const qzLava = (x, z) => (API.qzLava ? API.qzLava(x, z) : 0);
  const LQZ = { seed: 68101, step: 7.0, share: 0.45, foot: 0.08, farStep: 9, farShare: 0.5, from: 14, to: 60, drop: 8,
    verge: (R, o, e0, e1, c, x, z) => { const u = R(), lip = o > e1 - 1.2;
      if (qzLava(x, z) > 0.5) return u < 0.5 ? P(R, QZ.ash, 1, 0.6, 0.8) : P(R, QZ.dust, 1, 0.5, 0.7);
      return lip && u < 0.12 ? P(R, QZ.dust, 1, 0.45, 0.5) : u < 0.32 ? P(R, QZ.green, 1, 0.8, 1.2) : u < 0.62 ? P(R, QZ.pale, 1, 0.8, 1.2) : u < 0.86 ? P(R, QZ.dry, 1, 0.7, 1.1) : P(R, QZ.lawn, 1, 0.8, 1.0); },
    tuft: QZ.tuft, tuftW: QZ.tuftW,
    far: (R, o, c, k, x, z) => { const u = R();
      if (qzLava(x, z) > 0.5) return u < 0.55 ? P(R, QZ.lava, k, 1.4, 1.4) : u < 0.85 ? P(R, QZ.ash, k, 1.4, 1.2) : P(R, QZ.scrub, k, 1.2, 1.0);
      return c === 1 ? (u < 0.6 ? P(R, QZ.litter, k, 1.4, 1.2) : P(R, QZ.scrub, k, 1.4, 1.2))
        : c === 2 ? (u < 0.55 ? P(R, QZ.scrub, k, 1.6, 1.4) : u < 0.8 ? P(R, QZ.dry, k, 1.4, 1.4) : P(R, QZ.dust, k, 1.2, 1.0))
        : u < 0.36 ? P(R, QZ.green, k, 1.6, 1.6) : u < 0.68 ? P(R, QZ.dry, k, 1.6, 1.6) : u < 0.88 ? P(R, QZ.pale, k, 1.4, 1.4) : P(R, QZ.dust, k, 1.2, 1.2); } };

  /* ---- Kildare: the plain's pastures and fields between the hedgerows, the rallycross's gravel ---- */
  const KD = {
    lawn: [[0.36, 0.5, 0.23], [0.4, 0.53, 0.25]], stripe: [[0.42, 0.56, 0.27], [0.46, 0.59, 0.3]], lush: [[0.3, 0.46, 0.2], [0.33, 0.49, 0.22]],
    worn: [[0.46, 0.5, 0.31], [0.5, 0.53, 0.34]], grazed: [[0.4, 0.54, 0.25], [0.44, 0.57, 0.28]], rank: [[0.32, 0.45, 0.21], [0.35, 0.48, 0.23]],
    hay: [[0.58, 0.58, 0.36], [0.62, 0.61, 0.39]], trod: [[0.44, 0.43, 0.3], [0.48, 0.46, 0.33]], stub: [[0.68, 0.62, 0.42], [0.72, 0.66, 0.46]],
    floor: [[0.34, 0.36, 0.22], [0.38, 0.39, 0.24]],
    tuft: [[0.34, 0.48, 0.22], [0.5, 0.54, 0.3]], tuftW: [[0.3, 0.42, 0.2], [0.38, 0.46, 0.24]],
  };
  const kdGravel = (d) => { const T = API.T; if (!T || !T.sf) return false; const N = T.sf.length, i = Math.round(d / T.ds);
    for (let k = -6; k <= 6; k += 3) if (T.sf[((i + k) % N + N) % N] === 5) return true; return false; };
  const LKD = { seed: 68201, step: 5.0, share: 0.4, foot: 0.12, farStep: 6, farShare: 0.6, from: 12, to: 60, drop: 4, skipI: (d) => kdGravel(d),
    verge: (R, o, e0, e1, c) => { const u = R(), lip = o > e1 - 1.2;
      return lip && u < 0.12 ? P(R, KD.worn, 1, 0.45, 0.5) : u < 0.4 ? P(R, KD.stripe, 1, 0.8, 1.2) : u < 0.7 ? P(R, KD.lush, 1, 0.8, 1.2) : P(R, KD.lawn, 1, 0.8, 1.0); },
    tuft: KD.tuft, tuftW: KD.tuftW,
    far: (R, o, c, k) => { const u = R();
      return c === 1 ? (u < 0.7 ? P(R, KD.floor, k, 1.4, 1.2) : P(R, KD.rank, k, 1.2, 1.0))
        : c === 2 ? (u < 0.5 ? P(R, KD.stub, k, 1.8, 1.6) : u < 0.8 ? P(R, KD.hay, k, 1.6, 1.4) : P(R, KD.trod, k, 1.4, 1.2))
        : u < 0.34 ? P(R, KD.grazed, k, 1.6, 1.6) : u < 0.64 ? P(R, KD.rank, k, 1.6, 1.6) : u < 0.84 ? P(R, KD.hay, k, 1.4, 1.4) : P(R, KD.trod, k, 1.2, 1.2); } };

  const LK = API.rbLook || {};
  const add = (id, L) => { if (LK[id]) chain(LK[id], (ctx) => { try {
    const T = API.T, { nrGround, nrLC, nrNear } = API;
    if (!T || (T.def && T.def.id !== id) || !ctx.out) return;
    ctx.out.robBt68 = edges55(ctx, { root: ctx.root, matV: ctx.matV || ctx.out.matV, excluded: ctx.excluded, gT: nrGround, near: nrNear, lc: nrLC, bankY: API.nrBankY }, L);
  } catch (e) { console.error('chase-bt68 (' + id + '):', e); } }); };
  add('quezaltepeque', LQZ);
  add('kildare', LKD);
})();
