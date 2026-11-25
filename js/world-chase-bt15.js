/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fifteenth group of the real tracks: Rio do Rastro and
   Chapman's Peak, two roads on Vršič's corridor (vrPrep) with a ground of their own (caGround, chGround). They use the eleventh group's
   three bands (World.ext.goreRob, js/world-chase-bt11.js) with their own looks, called as the build's last step before out.stats, so
   its excluded places are all in. What is added goes into meshes of its own (softScen: 256 m chunks, no shadow), so only these two
   tracks change; nothing is driven on, all of it is behind the barrier line. What stands where follows docs/proge/<id>.md and each
   track's land cover: Rio do Rastro 0 grass, 1 forest, 2 shrubs, 3 built-up; Chapman's Peak 0 bare rock, 1 fynbos, 2 trees,
   3 gardens, 4 sand. (The bands' »wood« reads class 1 as trees: Chapman's look does not use it.)
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const BT = World.api.chaseBt, { vary } = World.api;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3 } = BT, LOOK = World.ext.goreRob.LOOK;

  /* Rio do Rastro: docs/proge/rastro.md: »Atlantski deževni gozd … drevesne praproti v grapah, bambus in grmovje ob robovih … Planota:
     travišče z araukarijami«. At the barrier's foot the lush verge grass in dense green tufts; at the forest's edge and under it the
     ferns and broad-leaved undergrowth in low clumps on the red-brown leaf litter; on the open grass tufts and bracken; further out the
     undergrowth by the forest, the grass on the plateau. Nothing on the basalt and sandstone faces (slope), at the falls or in the yards. */
  LOOK.rastro = { seed: 15101, st: ['trava', 'praprot', 'listje'],
    edge: { ok: (c, sl) => (c === 0 || c === 1 || c === 2) && sl < 1.0 ? 0.85 : 0, n: [3, 5],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.24, 0.45 + h * 0.4, vary(mix3(S.c.gr, S.c.gr2, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => (c === 3 || sl > 1.1) ? 0 : c === 1 || w > 0.3 ? 0.9 : 0.65, n: [3, 5], wood: true, litter: 0.3, lit: 'leaf', lr: [0.8, 1.5], ln: 'listje', litW: true,
      put: (S, x, y, z, h, R, w) => { if (w > 0.3 || R() < 0.3) { cushion(S.g(x, z), x, y, z, 0.55 + h * 0.55, 0.45 + h * 0.45, vary(R() < 0.55 ? S.c.fern : S.c.under, R, 0.03), R); S.st.praprot++; }
        else { tuft(S.g(x, z), x, y, z, 0.34 + h * 0.26, 0.5 + h * 0.45, vary(mix3(S.c.gr, S.c.straw, R() * 0.4), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => (c === 0 || c === 1 || c === 2) && sl < 0.9 ? 0.45 : 0, n: [2, 4],
      put: (S, x, y, z, h, R, w) => { if (w > 0.3) { cushion(S.g(x, z), x, y, z, 0.6 + h * 0.5, 0.5 + h * 0.4, vary(S.c.under, R, 0.03), R); S.st.praprot++; }
        else { tuft(S.g(x, z), x, y, z, 0.42 + h * 0.3, 0.55 + h * 0.4, vary(mix3(S.c.gr2, S.c.straw, R() * 0.5), R, 0.03), R, 5); S.st.trava++; } } },
    col: { gr: [0.3, 0.48, 0.18], gr2: [0.4, 0.52, 0.22], straw: [0.64, 0.6, 0.38], fern: [0.24, 0.44, 0.15], under: [0.22, 0.37, 0.15], leaf: [0.43, 0.3, 0.2] } };

  /* Chapman's Peak: docs/proge/chapman.md: »tla so mozaik sivo-zelenega grmičevja, temno olivnih goščav, rjastih leh restij, srebrnkastih
     zaplat in suhih okrastih tal s peščeno potjo med grmi«. At the barrier's foot the restios in rusty and olive tufts; behind them the
     low grey-green, silvery and darker fynbos cushions with the restio tufts between, the sandy grey soil in patches; further out the
     darker thickets. Nothing on the granite and sandstone faces (slope), in the sea, on the beach or in Hout Bay's gardens. */
  LOOK.chapman = { seed: 15201, st: ['restija', 'grm', 'pesek'],
    edge: { ok: (c, sl) => (c === 1 || c === 2) && sl < 1.1 ? 0.8 : c === 0 && sl < 0.9 ? 0.35 : 0, n: [3, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.26 + h * 0.2, 0.36 + h * 0.3, vary(mix3(S.c.restio, S.c.olive, R()), R, 0.03), R, 5); S.st.restija++; } },
    mid: { ok: (c, sl) => c === 1 && sl < 1.2 ? 0.85 : c === 2 && sl < 1.1 ? 0.5 : c === 0 && sl < 0.9 ? 0.25 : 0, n: [3, 5], litter: 0.35, lit: 'sand', lr: [0.6, 1.2], ln: 'pesek',
      put: (S, x, y, z, h, R) => { const r = R();
        if (r < 0.55) { cushion(S.g(x, z), x, y, z, 0.45 + h * 0.45, 0.32 + h * 0.3, vary(r < 0.2 ? S.c.silver : r < 0.4 ? S.c.grey : S.c.dark, R, 0.025), R); S.st.grm++; }
        else { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.22, 0.42 + h * 0.34, vary(mix3(S.c.restio, S.c.olive, R()), R, 0.03), R, 5); S.st.restija++; } } },
    far: { ok: (c, sl) => c === 1 && sl < 1.1 ? 0.55 : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { cushion(S.g(x, z), x, y, z, 0.6 + h * 0.5, 0.45 + h * 0.4, vary(R() < 0.5 ? S.c.dark : S.c.grey, R, 0.025), R); S.st.grm++; } },
    col: { restio: [0.55, 0.42, 0.28], olive: [0.47, 0.47, 0.3], grey: [0.5, 0.54, 0.44], silver: [0.62, 0.64, 0.58], dark: [0.34, 0.37, 0.24], sand: [0.55, 0.53, 0.46] } };
})();
