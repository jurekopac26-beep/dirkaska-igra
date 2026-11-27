/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fourteenth group of the real tracks: Katu and Isalo. Neither is on
   Vršič's corridor, so each hands the eleventh group's three bands (World.ext.goreRob, js/world-chase-bt11.js) its own land cover, nearest
   road point, ground and slope (o.lc, o.near, o.gH, o.slope): Katu its kt* grids, Isalo the nr* corridor. Called as the build's last step
   before out.stats, so its excluded places are all in. What is added goes into meshes of its own (softScen: 256 m chunks, no shadow), so
   only these two tracks change; nothing is driven on, all of it is behind the barrier line. What stands where follows docs/proge/<id>.md and
   each track's land cover (ESA WorldCover): 0 grass, 1 forest, 2 shrubs, 3 built-up (Katu: the camps), 4 bare rock, 5 water.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const BT = World.api.chaseBt, { vary } = World.api;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3 } = BT, LOOK = World.ext.goreRob.LOOK;

  /* Katu: docs/proge/katu.md: »sončna pobočja so suha stepa z grmi karagane in brinom … ob cesti rastejo šopi stepske bilnice in cvetje«,
     macesni na senčnih pobočjih. At the road's foot the steppe fescue's tufts in dry olive and straw; behind them the tufts, the caragana's
     and juniper's low grey-green bushes, pale schist grit between; under the larches the moss and the fallen needles; further out the fescue
     in loose groups. Nothing on the schist cliffs (slope), in the camps, by the river or in it. */
  LOOK.katu = { seed: 14101, st: ['bilnica', 'grm', 'mah', 'skrilavec'],
    edge: { ok: (c, sl) => (c === 0 || c === 2) && sl < 0.9 ? 0.65 : c === 1 && sl < 0.9 ? 0.4 : c === 4 && sl < 0.7 ? 0.2 : 0, n: [2, 3],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.26 + h * 0.2, 0.34 + h * 0.3, vary(mix3(S.c.olive, S.c.straw, R()), R, 0.03), R, 5); S.st.bilnica++; } },
    mid: { ok: (c, sl) => (c === 0 || c === 2) && sl < 1.0 ? 0.7 : c === 1 && sl < 1.0 ? 0.5 : c === 4 && sl < 0.8 ? 0.2 : 0, n: [2, 4], wood: true, litter: 0.35, lit: 'grit', lr: [0.8, 1.6], ln: 'skrilavec',
      put: (S, x, y, z, h, R, w) => { const r = R(), g = S.g(x, z);
        if (w > 0.3 && r < 0.4) { cushion(g, x, y, z, 0.6 + h * 0.4, 0.12 + h * 0.08, vary(S.c.moss, R, 0.03), R); S.st.mah++; }   // (under the larches: moss and needles, wide and flat)
        else if (r < 0.65) { cushion(g, x, y, z, 0.45 + h * 0.45, 0.32 + h * 0.3, vary(R() < 0.6 ? S.c.carag : S.c.junip, R, 0.025), R); S.st.grm++; }
        else { tuft(g, x, y, z, 0.32 + h * 0.24, 0.42 + h * 0.34, vary(mix3(S.c.olive, S.c.straw, R()), R, 0.03), R, 5); S.st.bilnica++; } } },
    far: { ok: (c, sl) => (c === 0 || c === 2) && sl < 0.85 ? 0.45 : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.4 + h * 0.3, 0.52 + h * 0.4, vary(S.c.straw, R, 0.03), R, 5); S.st.bilnica++; } },
    col: { olive: [0.62, 0.6, 0.34], straw: [0.82, 0.72, 0.46], carag: [0.5, 0.54, 0.36], junip: [0.42, 0.5, 0.36], moss: [0.5, 0.54, 0.3], grit: [0.56, 0.54, 0.5] } };

  /* Isalo: docs/proge/isalo.md: »zlata trava in rdeča prst, grmičevje … skale iz peščenjaka na pobočjih«. At the low earth bank's foot the
     golden grass in tufts; behind it the tufts and the scrub's low green-olive bushes, the red earth in bare patches between; further out
     the grass in loose groups. Nothing on the sandstone's steep faces, in the built-up places or the water. */
  LOOK.isalo = { seed: 14201, st: ['trava', 'grm', 'prst'],
    edge: { ok: (c, sl) => (c === 0 || c === 2) && sl < 0.9 ? 0.7 : c === 1 && sl < 0.9 ? 0.4 : 0, n: [2, 3],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.28 + h * 0.22, 0.38 + h * 0.32, vary(mix3(S.c.gold, S.c.pale, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl) => (c === 0 || c === 2) && sl < 1.0 ? 0.75 : c === 1 && sl < 1.0 ? 0.45 : 0, n: [2, 4], litter: 0.4, lit: 'earth', lr: [0.9, 1.8], ln: 'prst',
      put: (S, x, y, z, h, R) => { if (R() < 0.25) { cushion(S.g(x, z), x, y, z, 0.45 + h * 0.45, 0.35 + h * 0.3, vary(S.c.scrub, R, 0.025), R); S.st.grm++; }
        else { tuft(S.g(x, z), x, y, z, 0.36 + h * 0.26, 0.48 + h * 0.36, vary(mix3(S.c.gold, S.c.pale, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl) => (c === 0 || c === 2) && sl < 0.85 ? 0.45 : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.45 + h * 0.3, 0.6 + h * 0.4, vary(S.c.gold, R, 0.03), R, 5); S.st.trava++; } },
    col: { gold: [0.96, 0.8, 0.44], pale: [1.0, 0.9, 0.6], scrub: [0.6, 0.6, 0.34], earth: [0.8, 0.48, 0.32] } };
})();
