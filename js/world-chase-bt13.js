/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the thirteenth group of the real tracks: Killar, Los Caracoles and
   Tianmen, three mountain roads on Vršič's corridor (vrPrep), each with its own ground (unGround, caGround, tmGround). They use the
   eleventh group's three bands (World.ext.goreRob, js/world-chase-bt11.js) with their own looks, called as the build's last step before
   out.stats, so its excluded places are all in. What is added goes into meshes of its own (softScen: 256 m chunks, no shadow), so only
   these three tracks change; nothing is driven on, all of it is behind the barrier line. What stands where follows docs/proge/<id>.md and
   each track's land cover: Killar 0 grass, 1 forest, 2 shrubs, 3 built-up, 4 bare rock and scree, 6 snow; Los Caracoles 0 bare scree,
   1 bunch grass, 2 shrubs, 3 built-up, 4 snow; Tianmen 0 forest, 1 scrub and grass, 2 bare rock, 3 built-up, 4 fields. (The bands'
   »wood« reads class 1 as trees, so these looks do not use it.)
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const BT = World.api.chaseBt, { vary } = World.api;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3 } = BT, LOOK = World.ext.goreRob.LOOK;

  /* Killar: docs/proge/killar.md: »suha olivna in slamnata pobočja, sivo rjav skrilavec in gnajs … melišča«. At the fence's foot the dry
     grass in olive and straw tufts on the grey-brown grit; behind it the grass and low grey-green shrubs, fallen slate in grey patches;
     further out the grass in loose groups. Nothing on the cliffs and the drop below the road (slope), in the villages or on the snow. */
  LOOK.killar = { seed: 13101, st: ['trava', 'grm', 'skrilavec'],
    edge: { ok: (c, sl) => (c === 0 || c === 2) && sl < 0.9 ? 0.6 : c === 4 && sl < 0.8 ? 0.3 : 0, n: [2, 3],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.28 + h * 0.2, 0.36 + h * 0.3, vary(mix3(S.c.olive, S.c.straw, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl) => (c === 0 || c === 2) && sl < 1.0 ? 0.7 : c === 4 && sl < 0.9 ? 0.3 : 0, n: [2, 4], litter: 0.35, lit: 'slate', lr: [0.8, 1.6], ln: 'skrilavec',
      put: (S, x, y, z, h, R) => { if (R() < 0.35) { cushion(S.g(x, z), x, y, z, 0.45 + h * 0.4, 0.3 + h * 0.22, vary(S.c.shrub, R, 0.025), R); S.st.grm++; }
        else { tuft(S.g(x, z), x, y, z, 0.34 + h * 0.24, 0.45 + h * 0.34, vary(mix3(S.c.olive, S.c.straw, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl) => (c === 0 || c === 2) && sl < 0.85 ? 0.4 : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.42 + h * 0.3, 0.55 + h * 0.4, vary(S.c.straw, R, 0.03), R, 5); S.st.trava++; } },
    col: { olive: [0.46, 0.47, 0.28], straw: [0.66, 0.59, 0.4], shrub: [0.42, 0.45, 0.33], slate: [0.47, 0.45, 0.42] } };

  /* Los Caracoles: docs/proge/caracoles.md: »ob cesti povsod drobno kamenje, šopi rumene trave (coirón) … nizko grmičevje, višje gor olivno
     zelene blazine (llareta), balvani«. At the barrier's foot the coirón's yellow tufts, sparse on the bare scree; behind them the tufts,
     low shrubs and here and there a llareta's olive cushion, the fine pale gravel between; further out the tufts in loose groups. Nothing
     in Portillo, on the snow or on the steep faces. */
  LOOK.caracoles = { seed: 13201, st: ['coiron', 'grm', 'llareta', 'kamenje'],
    edge: { ok: (c, sl) => c === 1 && sl < 0.9 ? 0.6 : (c === 0 || c === 2) && sl < 0.8 ? 0.3 : 0, n: [1, 3],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.26 + h * 0.2, 0.36 + h * 0.3, vary(mix3(S.c.coiron, S.c.dry, R() * 0.6), R, 0.03), R, 5); S.st.coiron++; } },
    mid: { ok: (c, sl) => (c === 1 || c === 2) && sl < 1.0 ? 0.6 : c === 0 && sl < 0.9 ? 0.25 : 0, n: [1, 3], litter: 0.45, lit: 'grav', lr: [0.8, 1.6], ln: 'kamenje',
      put: (S, x, y, z, h, R) => { const r = R();
        if (r < 0.12) { cushion(S.g(x, z), x, y, z, 0.6 + h * 0.5, 0.22 + h * 0.15, vary(S.c.llareta, R, 0.02), R); S.st.llareta++; }   // (a llareta: wide, flat, firm)
        else if (r < 0.35) { cushion(S.g(x, z), x, y, z, 0.4 + h * 0.35, 0.3 + h * 0.22, vary(S.c.shrub, R, 0.025), R); S.st.grm++; }
        else { tuft(S.g(x, z), x, y, z, 0.32 + h * 0.24, 0.42 + h * 0.34, vary(mix3(S.c.coiron, S.c.dry, R() * 0.6), R, 0.03), R, 5); S.st.coiron++; } } },
    far: { ok: (c, sl) => (c === 1 || c === 2) && sl < 0.85 ? 0.4 : 0, n: [1, 3],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.4 + h * 0.3, 0.5 + h * 0.36, vary(S.c.coiron, R, 0.03), R, 5); S.st.coiron++; } },
    col: { coiron: [0.7, 0.62, 0.38], dry: [0.6, 0.55, 0.4], shrub: [0.47, 0.47, 0.33], llareta: [0.44, 0.5, 0.26], grav: [0.6, 0.57, 0.52] } };

  /* Tianmen: docs/proge/tianmen.md: »gost subtropski gozd (zimzeleni listavci, bori, bambus nižje ob cesti, grmičevje na policah skal),
     skale ob cesti«. At the barrier's foot the green grass and ferns in dense tufts; under the forest ferns and broad-leaved undergrowth
     on the brown leaf litter; on the scrub the grass and low shrubs; further out the undergrowth. Nothing on the bare limestone and the
     steep faces, in the town or on the fields. */
  LOOK.tianmen = { seed: 13301, st: ['trava', 'praprot', 'listje'],
    edge: { ok: (c, sl) => (c === 0 || c === 1) && sl < 0.9 ? 0.75 : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.24, 0.45 + h * 0.4, vary(mix3(S.c.gr, S.c.gr2, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl) => c === 0 && sl < 1.1 ? 0.85 : c === 1 && sl < 1.0 ? 0.6 : 0, n: [2, 4], litter: 0.3, lit: 'leaf', lr: [0.8, 1.5], ln: 'listje',
      put: (S, x, y, z, h, R) => { if (R() < 0.55) { cushion(S.g(x, z), x, y, z, 0.55 + h * 0.55, 0.45 + h * 0.45, vary(R() < 0.55 ? S.c.fern : S.c.under, R, 0.03), R); S.st.praprot++; }
        else { tuft(S.g(x, z), x, y, z, 0.34 + h * 0.26, 0.5 + h * 0.45, vary(S.c.gr, R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl) => (c === 0 || c === 1) && sl < 0.9 ? 0.45 : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { cushion(S.g(x, z), x, y, z, 0.6 + h * 0.5, 0.5 + h * 0.4, vary(S.c.under, R, 0.03), R); S.st.praprot++; } },
    col: { gr: [0.32, 0.48, 0.19], gr2: [0.4, 0.52, 0.22], fern: [0.25, 0.44, 0.16], under: [0.24, 0.38, 0.17], leaf: [0.42, 0.33, 0.22] } };
})();
