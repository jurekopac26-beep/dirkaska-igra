/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventeenth group of the real tracks: Styria (the shared
   circuit builder, js/world-rbring.js: the look's own LK.extra chained) and Nürburg (its own builder, js/world-nring.js: it calls
   World.ext.goreRob before its scenery is closed). Both on the shared bands of js/world-chase-bt11.js (goreRob) with the corridor's
   ground, slope, land cover and nearest road (nrGround, nrSlope, nrLC, nrNear). What stands where follows the tracks' descriptions
   (docs/proge/rbring.md, docs/proge/nring.md): nothing on the road, the built ground or the water, and nothing on the pits' side
   along the pits; the terrain, the road, the trees and the fences stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const API = World.api, BT = API.chaseBt, { vary } = API;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3 } = BT, LOOK = World.ext.goreRob.LOOK;

  /* how far past the barrier (m) the point (x, z) lies: the shared builder's mown lawns reach 20-36 m past it */
  const past = (x, z) => { const q = API.nrNear(x, z); return q.i >= 0 ? q.dd : 1e9; };

  /* Styria: docs/proge/rbring.md: »Gozdovi (smreke in bukve), travniki (z rumenimi in belimi cvetočimi lisami) in polja« and »trava ob
     progi in zelenice za ogrado so pokošene v pasove (do ~35 m od ograde; ne pod tribunami, v gozdu in grmovju)«. So the mown lawns
     stay as they are (no tufts on them, the TV look) but for the uncut strip at the fence's foot; what the camera behind the car saw as a flat colour was the woods' edge and the
     scrub by the fences. There (land cover 1 and 2) the grass in tufts along the barrier's foot, the brown litter of spruce needles and
     beech leaves in low patches under the trees, low green cushions of young growth among the grass, and out past the mown lawns the
     unmown meadow's grass in tufts with its yellow and white flowering patches. */
  const rbOpen = (c, x, z) => c === 0 || c === 2 ? Math.min(1, Math.max(0, (past(x, z) - 24) / 8)) : 0;   // (the meadow out past the mown lawns: their stripes fade out 20-36 m past the barrier)
  LOOK.rbring = { seed: 17101, st: ['trava', 'blazine', 'listje', 'cvetje'],
    edge: { ok: (c, sl) => sl >= 0.9 ? 0 : c === 1 || c === 2 ? 0.65 : c === 0 ? 0.45 : 0, n: [2, 4],   // (on the lawns only the strip at the fence's foot the mower leaves)
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.26 + h * 0.2, 0.32 + h * 0.3, vary(mix3(S.c.grass, S.c.grass2, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => sl > 1.0 ? 0 : c === 1 ? 0.65 : Math.max(c === 2 ? 0.6 : 0, 0.6 * rbOpen(c, x, z)), n: [2, 4], litter: 0.45, lit: 'leaf', lr: [1.0, 2.2], ln: 'listje', wood: true, litW: true,
      put: (S, x, y, z, h, R, w) => { if (w > 0.3 && R() < 0.4) { cushion(S.g(x, z), x, y, z, 0.4 + h * 0.4, 0.16 + h * 0.14, vary(mix3(S.c.young, S.c.grass2, R()), R, 0.03), R); S.st.blazine++; }
        else { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.24, 0.38 + h * 0.34, vary(mix3(S.c.grass, S.c.grass2, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => sl > 0.9 ? 0 : Math.max(c === 2 ? 0.5 : 0, 0.6 * rbOpen(c, x, z) * (1 - w * 0.5)), n: [3, 5], litter: 0.35, lit: 'flower', lr: [1.0, 2.0], ln: 'cvetje',
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.36 + h * 0.3, 0.44 + h * 0.36, vary(mix3(S.c.grass, S.c.hay, R()), R, 0.03), R, 5); S.st.trava++; } },
    col: { grass: [0.4, 0.52, 0.24], grass2: [0.47, 0.56, 0.28], young: [0.34, 0.46, 0.22], hay: [0.58, 0.58, 0.32], leaf: [0.44, 0.32, 0.2], flower: [0.86, 0.82, 0.42] } };

  /* Nürburg: docs/proge/nring.md: »gozd ima smreke, bukve, macesne in suhe smreke, ob robu grmovje in mlado drevje, tla pod krošnjami
     so temna«; the verges are the Eifel's unmown meadow grass (the builder's own: no mowing stripes). From the camera behind the car
     the ground past the fences was a colour along the lap's 20.7 km. So the long meadow grass in tufts at the barrier's foot, under the
     trees the dark needle litter in low patches and the low cushions of young growth, and out in the open the grass in looser tufts
     with low cushions of scrub at the woods' edge (land cover 2). (The lap is five times as long as a circuit's: the budget per frame holds, the camera sees only its piece.) */
  LOOK.nring = { seed: 17201, st: ['trava', 'blazine', 'iglice'],
    edge: { ok: (c, sl) => (c === 0 || c === 1 || c === 2) && sl < 0.9 ? 0.8 : 0, n: [3, 5],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.26 + h * 0.2, 0.34 + h * 0.3, vary(mix3(S.c.grass, S.c.dry, R() * 0.6), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => c >= 3 || sl > 1.0 ? 0 : c === 1 || w > 0.3 ? 0.7 : 0.65, n: [3, 5], litter: 0.45, lit: 'needle', lr: [1.0, 2.0], ln: 'iglice', wood: true, litW: true,
      put: (S, x, y, z, h, R, w) => { if (w > 0.3 && R() < 0.45) { cushion(S.g(x, z), x, y, z, 0.4 + h * 0.4, 0.16 + h * 0.14, vary(mix3(S.c.young, S.c.grass, R()), R, 0.03), R); S.st.blazine++; }
        else { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.24, 0.4 + h * 0.34, vary(mix3(S.c.grass, S.c.dry, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => sl > 0.9 ? 0 : c === 2 ? 0.6 : c === 0 ? 0.5 * (1 - w * 0.4) : 0, n: [3, 4], litter: 0.3, lit: 'needle', lr: [1.2, 2.4], ln: 'iglice', litW: true,
      put: (S, x, y, z, h, R, w) => { if (w > 0.2 || R() < 0.3) { cushion(S.g(x, z), x, y, z, 0.6 + h * 0.6, 0.24 + h * 0.24, vary(mix3(S.c.scrub, S.c.young, R()), R, 0.03), R); S.st.blazine++; }
        else { tuft(S.g(x, z), x, y, z, 0.34 + h * 0.28, 0.42 + h * 0.36, vary(mix3(S.c.grass, S.c.dry, R()), R, 0.03), R, 5); S.st.trava++; } } },
    col: { grass: [0.4, 0.5, 0.25], dry: [0.6, 0.58, 0.36], young: [0.3, 0.42, 0.2], scrub: [0.34, 0.4, 0.22], needle: [0.3, 0.24, 0.17] } };

  /* Styria: the look's own LK.extra chained; the bands on the shared builder's ground, never on the pits' side along the pits */
  const RBL = (API.rbLook || {}).rbring;
  if (RBL) {
    const base = RBL.extra;
    RBL.extra = function (ctx) {
      const r = base ? base.call(this, ctx) : null;
      if (API.THEME !== 'rbring') return r;   // (the tracks without a look of their own borrow Styria's: theirs stays as it is)
      try {
        const T = API.T, pd = T && T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, { nrGround, nrSlope, nrLC, nrNear } = API;
        const bad = (x, z) => { if (!ps) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
        const st = World.ext.goreRob({ excluded: ctx.excluded, root: ctx.root, out: ctx.out }, 'rbring', { gH: nrGround, slope: nrSlope, lc: nrLC, near: nrNear, bad });
        if (r) r.robBt = st;
      } catch (e) { console.error('chase-bt17:', e); }
      return r;
    };
  }
})();
