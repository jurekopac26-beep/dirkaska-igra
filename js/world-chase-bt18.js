/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighteenth group of the real tracks: Livorno (on the shared
   corridor, nrPrep: nrGround, nrLC, nrNear) and Montréal (its own island grid, mtGround and mtKind). They use the eleventh group's three
   bands (World.ext.goreRob, js/world-chase-bt11.js) with their own looks, called as each build's last step before out.stats (Livorno) or
   after its scenery (Montréal), so their excluded places are all in. What is added goes into meshes of its own (softScen: 256 m chunks,
   no shadow), so only these two tracks change; nothing is driven on, all of it is behind the barrier line. What stands where follows
   docs/proge/<id>.md and each track's land cover: Livorno 0 open, 1 forest, 2 scrub (macchia), 3 settlement; Montréal (mtKind) 0 grass,
   1 trees, 2 built-up, 3 water, 4 sand, 5 car parks, 6 gardens, 7 pitches, 8 plazas.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const BT = World.api.chaseBt, { vary } = World.api;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3 } = BT, LOOK = World.ext.goreRob.LOOK;

  /* Livorno: docs/proge/livorno.md: »ob cesti nizki kamniti zidovi … teren iz višin (gozd, makija, naselja, peščenjak na strminah,
     plaže)«; docs/proge-pregled.md: pinije, obmorski bori, črničevje, cipresa in makija. At the walls' foot the dry Tuscan verge in
     straw and olive tufts; behind it the macchia's low dark and grey-green cushions on the open land and the scrub, under the pines the
     brown needles in patches; further out the macchia by the woods. Nothing in the towns (class 3), on the sandstone banks (slope), on
     the beaches or in the sea. */
  LOOK.livorno = { seed: 18101, st: ['trava', 'makija', 'iglice'],
    edge: { ok: (c, sl) => c !== 3 && sl < 0.9 ? 0.7 : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.28 + h * 0.22, 0.36 + h * 0.34, vary(mix3(S.c.straw, S.c.olive, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => (c === 3 || sl > 1.0) ? 0 : c === 2 ? 0.9 : c === 1 || w > 0.3 ? 0.7 : 0.4, n: [2, 4], wood: true, litter: 0.3, lit: 'needle', lr: [0.8, 1.6], ln: 'iglice', litW: true,
      put: (S, x, y, z, h, R, w) => { const r = R();
        if (r < (w > 0.3 ? 0.65 : 0.45)) { cushion(S.g(x, z), x, y, z, 0.5 + h * 0.5, 0.38 + h * 0.4, vary(r < 0.25 ? S.c.grey : S.c.dark, R, 0.025), R); S.st.makija++; }
        else { tuft(S.g(x, z), x, y, z, 0.32 + h * 0.24, 0.42 + h * 0.36, vary(mix3(S.c.straw, S.c.olive, R() * 0.6), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl) => (c === 1 || c === 2) && sl < 0.9 ? 0.42 : 0, n: [2, 3],
      put: (S, x, y, z, h, R) => { cushion(S.g(x, z), x, y, z, 0.65 + h * 0.55, 0.5 + h * 0.45, vary(R() < 0.6 ? S.c.dark : S.c.grey, R, 0.025), R); S.st.makija++; } },
    col: { straw: [0.72, 0.66, 0.42], olive: [0.5, 0.52, 0.3], dark: [0.3, 0.37, 0.2], grey: [0.43, 0.47, 0.33], needle: [0.52, 0.4, 0.26] } };

  /* Montréal: docs/proge/montreal.md: »drevesa po rabi tal (ESA WorldCover: javorji, topoli, vrbe), parkovne ceste in poti … navijači na
     travi«: the island is a mown park. Behind the concrete walls the short lawn's edge in low green tufts (the mower leaves them along
     the walls' foot); under the maples and poplars the shrubs in low cushions on last year's leaves; further out the undergrowth by the
     trees only. Nothing on the island's roads, paths, car parks, plazas, pitches or the beach, in the junctions' legs, on the rip-rap of
     the banks or in the water. */
  LOOK.montreal = { seed: 18201, st: ['trava', 'grmovje', 'listje'],
    edge: { ok: (c) => c === 0 || c === 1 || c === 6 ? 0.7 : 0, n: [3, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.24 + h * 0.18, 0.26 + h * 0.22, vary(mix3(S.c.gr, S.c.gr2, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => c === 1 || w > 0.4 ? 0.75 : c === 0 || c === 6 ? 0.22 : 0, n: [2, 4], wood: true, litter: 0.3, lit: 'leaf', lr: [0.8, 1.5], ln: 'listje', litW: true,
      put: (S, x, y, z, h, R, w) => { if (w > 0.4 || R() < 0.25) { cushion(S.g(x, z), x, y, z, 0.5 + h * 0.5, 0.4 + h * 0.4, vary(R() < 0.5 ? S.c.shrub : S.c.shrub2, R, 0.03), R); S.st.grmovje++; }
        else { tuft(S.g(x, z), x, y, z, 0.26 + h * 0.2, 0.3 + h * 0.26, vary(mix3(S.c.gr, S.c.gr2, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c) => c === 1 ? 0.45 : 0, n: [2, 3],
      put: (S, x, y, z, h, R) => { cushion(S.g(x, z), x, y, z, 0.6 + h * 0.5, 0.45 + h * 0.4, vary(S.c.shrub, R, 0.03), R); S.st.grmovje++; } },
    col: { gr: [0.4, 0.56, 0.26], gr2: [0.47, 0.6, 0.3], shrub: [0.28, 0.42, 0.2], shrub2: [0.34, 0.46, 0.22], leaf: [0.48, 0.38, 0.24] } };
})();
