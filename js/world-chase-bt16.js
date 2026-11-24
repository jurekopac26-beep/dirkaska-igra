/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixteenth group of the real tracks: Pikes Peak (its own
   builder, js/world-pikes.js, for the asphalt and the gravel version alike: it calls World.ext.goreRob last) and Lusail (the shared
   circuit builder, js/world-rbring.js: the look's own LK.extra chained). Both on the shared bands of js/world-chase-bt11.js (goreRob)
   with their own ground, slope, land cover and nearest road. What stands where follows the tracks' descriptions (docs/proge/pikes.md,
   the ground of js/world-pikes.js pkCol; docs/proge/lusail.md): nothing on the road, the built ground, the lawns or the car parks, and
   nothing on the pits' side along the pits; the terrain, the road and the fences stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const API = World.api, BT = API.chaseBt, { vary } = API;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3 } = BT, LOOK = World.ext.goreRob.LOOK;

  /* Pikes Peak: the builder's ground (pkCol): below the treeline the forest floor with rust needle litter in patches, then pinkish granite
     gravel with olive grass and the green-brown tundra above the trees, bare granite on the steep slopes, old snow near the top. From
     the camera behind the car the ground between the builder's trees, shrubs and rocks was mostly a colour. So: the olive grass in
     tufts along the verge, the needle litter in low rust patches under the trees, pink granite gravel in patches in the open, and above
     the trees the tundra's low green-brown cushions among the grass. Land cover from the builder's own ground (pkLC below): 1 the forest
     below the treeline, 2 its ragged edge, 0 the open tundra and gravel, 4 the steep bare granite, 5 the snow near the top (left free). */
  LOOK.pikes = { seed: 16101, st: ['trava', 'blazine', 'iglice', 'gramoz'],
    edge: { ok: (c, sl) => (c === 0 || c === 1 || c === 2) && sl < 0.9 ? 0.7 : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.24 + h * 0.2, 0.3 + h * 0.28, vary(mix3(S.c.olive, S.c.dry, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => c === 4 || c === 5 || sl > 1.0 ? 0 : c === 1 || w > 0.3 ? 0.65 : 0.7, n: [2, 4], litter: 0.45, lit: 'needle', lr: [1.0, 2.0], ln: 'iglice', wood: true, litW: true,
      put: (S, x, y, z, h, R, w) => { if (w < 0.3 && R() < 0.4) { cushion(S.g(x, z), x, y, z, 0.45 + h * 0.4, 0.14 + h * 0.12, vary(mix3(S.c.tundra, S.c.tundra2, R()), R, 0.03), R); S.st.blazine++; }
        else { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.24, 0.36 + h * 0.34, vary(w > 0.3 ? S.c.olive : mix3(S.c.olive, S.c.dry, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => (c === 0 || c === 2) && sl < 0.8 ? 0.5 * (1 - w * 0.8) : 0, n: [2, 3], litter: 0.4, lit: 'gravel', lr: [1.2, 2.4], ln: 'gramoz',
      put: (S, x, y, z, h, R) => { cushion(S.g(x, z), x, y, z, 0.55 + h * 0.5, 0.16 + h * 0.14, vary(mix3(S.c.tundra, S.c.tundra2, R()), R, 0.03), R); S.st.blazine++; } },
    col: { olive: [0.5, 0.48, 0.27], dry: [0.62, 0.55, 0.36], tundra: [0.4, 0.42, 0.24], tundra2: [0.47, 0.4, 0.27], needle: [0.42, 0.3, 0.2], gravel: [0.66, 0.53, 0.45] } };

  /* Lusail: docs/proge/lusail.md: »za njimi puščava: siva prodnata ravnina v velikih lisah, svetlejši in toplejši nanosi peska«, »nizko sivo
     grmičevje v puščavi (po rabi tal)«. Behind the fences the plain was a smooth colour from the camera behind the car. So on it (the
     land cover's class 0, never the lawns 1 nor the paved 3) the low grey scrub in loose groups, darker gravel lying in low patches, and
     on the drifts of sand (class 2) paler patches of the sand and fewer, smaller scrub. */
  LOOK.lusail = { seed: 16201, st: ['grmicevje', 'prod', 'pesek'],
    edge: { ok: (c) => c === 0 ? 0.5 : c === 2 ? 0.3 : 0, n: [1, 2],
      put: (S, x, y, z, h, R) => { cushion(S.g(x, z), x, y, z, 0.3 + h * 0.25, 0.16 + h * 0.14, vary(mix3(S.c.scrub, S.c.scrub2, R()), R, 0.03), R); S.st.grmicevje++; } },
    mid: { ok: (c) => c === 0 ? 0.6 : c === 2 ? 0.4 : 0, n: [2, 3], litter: 0.45, lit: 'pebble', lr: [1.0, 2.2], ln: 'prod',
      put: (S, x, y, z, h, R) => { cushion(S.g(x, z), x, y, z, 0.5 + h * 0.5, 0.26 + h * 0.24, vary(mix3(S.c.scrub, S.c.scrub2, R()), R, 0.03), R); S.st.grmicevje++; } },
    far: { ok: (c) => c === 0 ? 0.42 : c === 2 ? 0.3 : 0, n: [2, 3], litter: 0.4, lit: 'sand', lr: [1.6, 3.0], ln: 'pesek',
      put: (S, x, y, z, h, R) => { cushion(S.g(x, z), x, y, z, 0.7 + h * 0.6, 0.3 + h * 0.3, vary(mix3(S.c.scrub, S.c.scrub2, R()), R, 0.03), R); S.st.grmicevje++; } },
    col: { scrub: [0.56, 0.56, 0.47], scrub2: [0.49, 0.5, 0.4], pebble: [0.6, 0.57, 0.52], sand: [0.88, 0.8, 0.64] } };

  /* Pikes Peak's land cover for the bands, from the builder's own ground (its treeline, its slope, the snow's height) */
  World.ext.goreRob.pkLC = (gH, slope, treeline) => (x, z) => {
    const h = gH(x, z), tl = treeline(x, z);
    if (h > 335) return 5;
    if (slope(x, z) > 0.95) return 4;
    return h < tl - 8 ? 1 : h < tl + 10 ? 2 : 0;
  };

  /* Lusail: the look's own LK.extra chained; the bands on the shared builder's ground, never on the pits' side along the pits */
  const LU = (API.rbLook || {}).lusail;
  if (LU) {
    const base = LU.extra;
    LU.extra = function (ctx) {
      const r = base ? base.call(this, ctx) : null;
      try {
        const T = API.T, pd = T && T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, { nrGround, nrSlope, nrLC, nrNear } = API;
        const bad = (x, z) => { if (!ps) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
        const st = World.ext.goreRob({ excluded: ctx.excluded, root: ctx.root, out: ctx.out }, 'lusail', { gH: nrGround, slope: nrSlope, lc: nrLC, near: nrNear, bad });
        if (r) r.robBt = st;
      } catch (e) { console.error('chase-bt16:', e); }
      return r;
    };
  }
})();
