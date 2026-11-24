/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the twelfth group of the real tracks: Santo Antão and Ella, the two
   tracks on Vršič's corridor (vrPrep) with Los Caracoles' ground (caGround, caSlope). They use the eleventh group's three bands
   (World.ext.goreRob, js/world-chase-bt11.js) with their own ground and their own looks, called as the build's last step before
   out.stats, so its excluded places are all in. What is added goes into meshes of its own (softScen: 256 m chunks, no shadow), so only
   these two tracks change; nothing is driven on, all of it is behind the barrier line. What stands where follows docs/proge/<id>.md and
   each track's land cover (0 grass, 1 trees, 2 shrubs, 3 built-up, 4 bare rock, 5 water; Santo Antão 6 fields; Ella 6 tea, 7 fields).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const BT = World.api.chaseBt, { vary } = World.api;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3 } = BT, LOOK = World.ext.goreRob.LOOK;

  /* Santo Antão: docs/proge/santoantao.md: »travnata in grmovnata vulkanska pobočja v olivno zeleni in slamnati barvi, vmes rdečerjava
     prst; pasovi temnega bazalta … terase s polji«, »agave, šopi trave«. At the barrier's foot the dry grass in olive and straw tufts;
     behind it low grey-green shrub cushions and the agaves' blue-grey rosettes on the red-brown soil; further out the grass in loose
     groups. Nothing on the terraced fields (their crops are the build's), in the villages, on the bare basalt or the steep faces. */
  LOOK.santoantao = { seed: 12101, st: ['trava', 'grm', 'agava', 'prst'],
    edge: { ok: (c, sl) => (c === 0 || c === 2 || c === 6) && sl < 0.9 ? 0.65 : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.22, 0.4 + h * 0.32, vary(mix3(S.c.olive, S.c.straw, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl) => (c === 0 || c === 2) && sl < 1.0 ? 0.7 : c === 1 && sl < 1.0 ? 0.35 : 0, n: [2, 4], litter: 0.3, lit: 'soil', lr: [0.8, 1.5], ln: 'prst',
      put: (S, x, y, z, h, R) => { const r = R();
        if (r < 0.14) { const g = S.g(x, z), col = vary(S.c.agave, R, 0.02);   // (an agave: a low wide rosette and its taller narrow heart)
          cushion(g, x, y, z, 0.65 + h * 0.4, 0.42 + h * 0.25, col, R); tuft(g, x, y + 0.2, z, 0.32 + h * 0.15, 0.55 + h * 0.3, col, R, 6); S.st.agava++; }
        else if (r < 0.5) { cushion(S.g(x, z), x, y, z, 0.5 + h * 0.45, 0.32 + h * 0.25, vary(S.c.shrub, R, 0.025), R); S.st.grm++; }
        else { tuft(S.g(x, z), x, y, z, 0.36 + h * 0.26, 0.48 + h * 0.36, vary(mix3(S.c.olive, S.c.straw, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => (c === 0 || c === 2) && sl < 0.9 ? 0.45 * (1 - w * 0.6) : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { if (R() < 0.35) { cushion(S.g(x, z), x, y, z, 0.6 + h * 0.5, 0.38 + h * 0.3, vary(S.c.shrub, R, 0.025), R); S.st.grm++; }
        else { tuft(S.g(x, z), x, y, z, 0.45 + h * 0.3, 0.6 + h * 0.4, vary(S.c.straw, R, 0.03), R, 5); S.st.trava++; } } },
    col: { olive: [0.47, 0.5, 0.27], straw: [0.68, 0.6, 0.38], shrub: [0.4, 0.46, 0.3], agave: [0.5, 0.56, 0.47], soil: [0.5, 0.39, 0.28] } };

  /* Ella: docs/proge/ella.md: »travnata pobočja s posameznimi drevesi, temna tla gorskega gozda v grapah … čajni vrtovi v vrstah. Rdeča
     laterna zemlja ob robu ceste … potoki, ob bregovih grmičevje«. At the barrier's foot the wet hills' tall green grass in dense tufts;
     the red laterite bare between them; under the trees and at the forest's edge ferns and broad-leaved undergrowth; the streams' banks
     shrubby. Nothing in the tea gardens' rows or the fields (both the build's), in the town or in a stream's bed. */
  LOOK.ella = { seed: 12201, st: ['trava', 'praprot', 'laterit'],
    edge: { ok: (c, sl) => (c === 0 || c === 1 || c === 2) && sl < 0.9 ? 0.8 : c === 6 && sl < 0.9 ? 0.4 : 0, n: [3, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.32 + h * 0.26, 0.5 + h * 0.45, vary(mix3(S.c.gr, S.c.gr2, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => (c === 0 || c === 1 || c === 2) && sl < 1.1 ? (w > 0.25 || c === 1 ? 0.9 : 0.5) : 0, n: [2, 4], litter: 0.3, lit: 'lat', lr: [0.8, 1.5], ln: 'laterit', wood: true,
      put: (S, x, y, z, h, R, w) => { if (w > 0.25 || R() < 0.3) { cushion(S.g(x, z), x, y, z, 0.6 + h * 0.6, 0.48 + h * 0.5, vary(R() < 0.6 ? S.c.fern : S.c.under, R, 0.03), R); S.st.praprot++; }
        else { tuft(S.g(x, z), x, y, z, 0.36 + h * 0.26, 0.55 + h * 0.45, vary(S.c.gr, R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => (c === 0 || c === 2) && sl < 0.9 ? 0.5 * (1 - w) : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.45 + h * 0.3, 0.8 + h * 0.6, vary(S.c.gr2, R, 0.03), R, 5); S.st.trava++; } },
    col: { gr: [0.28, 0.45, 0.17], gr2: [0.34, 0.47, 0.2],   /* (muted by the eighty-fifth group: no bright spikes) */ fern: [0.23, 0.45, 0.14], under: [0.21, 0.37, 0.15], lat: [0.5, 0.33, 0.24] } };
})();
