/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the nineteenth group of the real tracks: Koli (World.gore,
   its extra calls World.ext.goreRob) and Harju (its own builder, js/world-harju.js: it calls World.ext.goreRob last, with its own
   ground, slope, land cover and nearest leg). They use the eleventh group's three bands (js/world-chase-bt11.js) with their own looks.
   What is added goes into meshes of its own (softScen: 256 m chunks, no shadow), so only these two tracks change; nothing is driven
   on, all of it is behind the barrier line. What stands where follows docs/proge/<id>.md: Koli the gore land cover (0 grass, 1 forest,
   2 shrubs, 3 built-up, 4 rock, 5 water) under snow; Harju its ground types read as 0 open grass, 1 under the pines, 2 the wetland,
   3 paved, built or sports ground (World.ext.goreRob.hjLC).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const BT = World.api.chaseBt, { vary } = World.api;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3 } = BT, LOOK = World.ext.goreRob.LOOK, { cone, TAU } = World.api;
  const spruce = (S, g, x, y, z, ht, wd, R) => { tuft(g, x, y - 0.05, z, wd, ht, vary(S.c.spruce, R, 0.025), R, 6);   // a young spruce, its upper half under the crown snow
    cone(g, x, y + ht * 0.56, z, wd * 0.6, ht * 0.5, 6, vary(S.c.blue, R, 0.012), S.c.snow, R() * TAU); S.st.smrecice++; };

  /* Koli: docs/proge/koli.md: snow all year on the ploughed road, the spruce and pine forest of the national park. At the barrier's foot
     the dry grass stalks poking through the ploughed bank; behind them more stalks and the young spruces under their crown snow
     (tykky: a dark green cone with its white cap), in groups at the forest's edge. Nothing on
     the steep slopes, in the water or in the yards. (No low drifts or flat patches: on the snowy slope they show as stars.) */
  LOOK.koli = { seed: 19101, st: ['bilke', 'smrecice'],
    edge: { ok: (c, sl) => (c === 0 || c === 1 || c === 2) && sl < 1.0 ? 0.7 : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y - 0.05, z, 0.14 + h * 0.12, 0.34 + h * 0.34, vary(mix3(S.c.straw, S.c.stalk, R()), R, 0.03), R, 4); S.st.bilke++; } },
    mid: { ok: (c, sl, x, z, w) => (c === 3 || c === 4 || c === 5 || c === 6 || sl > 1.0) ? 0 : c === 1 || w > 0.3 ? 0.85 : 0.5, n: [2, 4], wood: true,
      put: (S, x, y, z, h, R, w) => { const g = S.g(x, z);
        if ((w > 0.3 || R() < 0.25) && R() < 0.55) spruce(S, g, x, y, z, 0.9 + h * 1.4, 0.35 + h * 0.3, R);
        else { tuft(g, x, y - 0.05, z, 0.14 + h * 0.12, 0.4 + h * 0.36, vary(mix3(S.c.straw, S.c.stalk, R()), R, 0.03), R, 4); S.st.bilke++; } } },
    far: { ok: (c, sl, x, z, w) => (c === 0 || c === 1 || c === 2) && sl < 0.9 ? 0.45 : 0, n: [2, 3],
      put: (S, x, y, z, h, R, w) => { const g = S.g(x, z);
        if (w > 0.3 && R() < 0.6) spruce(S, g, x, y, z, 1.4 + h * 1.6, 0.45 + h * 0.35, R);
        else if (R() < 0.5) spruce(S, g, x, y, z, 0.7 + h * 0.8, 0.3 + h * 0.2, R); } },
    col: { snow: [0.9, 0.92, 0.95], blue: [0.76, 0.81, 0.9], shade: [0.78, 0.82, 0.9], spruce: [0.2, 0.3, 0.2], straw: [0.62, 0.55, 0.38], stalk: [0.5, 0.44, 0.32] } };

  /* Harju: docs/proge/harju.md: the old Scots pines on the gravel ridge in town, the park and the lawns. At the barrier's foot the
     verge grass (late July: green with dry straw tips) in tufts; under the pines the wavy hair-grass in fine tufts, the lingonberry and
     the bilberry in low cushions, the brown needle litter between; on the open lawns and the park a tuft here and there. Nothing on
     the paved ground, the buildings, the pitch, the running track, the car parks or the squares (class 3), nor on the steep banks. */
  LOOK.harju = { seed: 19201, st: ['trava', 'masni', 'brusnice', 'iglice'],
    edge: { ok: (c, sl) => (c === 0 || c === 1 || c === 2) && sl < 0.9 ? 0.85 : 0, n: [3, 5],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y - 0.03, z, 0.26 + h * 0.2, 0.4 + h * 0.36, vary(mix3(S.c.gr, S.c.straw, R() * 0.6), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => (c === 3 || sl > 0.9) ? 0 : c === 1 ? 0.9 : c === 2 ? 0.55 : 0.3, n: [3, 5], litter: 0.45, lit: 'ndl', lr: [0.9, 1.7], ln: 'iglice', litW: true, wood: true,
      put: (S, x, y, z, h, R, w) => { const r = R();
        if (w > 0.3 && r < 0.5) { cushion(S.g(x, z), x, y - 0.04, z, 0.5 + h * 0.45, 0.2 + h * 0.16, vary(r < 0.25 ? S.c.ling : S.c.bil, R, 0.025), R); S.st.brusnice++; }
        else if (w > 0.3) { tuft(S.g(x, z), x, y - 0.03, z, 0.2 + h * 0.14, 0.26 + h * 0.2, vary(S.c.hair, R, 0.03), R, 5); S.st.masni++; }
        else { tuft(S.g(x, z), x, y - 0.03, z, 0.24 + h * 0.18, 0.3 + h * 0.28, vary(mix3(S.c.gr, S.c.straw, R() * 0.5), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => (c === 1 || c === 2) && sl < 0.8 ? 0.45 : 0, n: [1, 3],
      put: (S, x, y, z, h, R) => { cushion(S.g(x, z), x, y - 0.04, z, 0.5 + h * 0.4, 0.2 + h * 0.15, vary(R() < 0.6 ? S.c.bil : S.c.ling, R, 0.025), R); S.st.brusnice++; } },
    col: { gr: [0.34, 0.42, 0.17], straw: [0.62, 0.58, 0.36], hair: [0.48, 0.5, 0.26], bil: [0.18, 0.32, 0.12], ling: [0.15, 0.26, 0.11], ndl: [0.42, 0.35, 0.22] } };

  /* Harju's ground types (G.gt, js/world-harju.js) as the bands' classes: 9 the woods and the pine canopy over a lawn, the park or a yard
     → 1; 13 the wetland → 2; 0 lawn, 10 park, 12 the ski slope (summer grass) → 0; the paved, the buildings and the rest → 3 */
  World.ext.goreRob.hjLC = (gt, gIdx, can, paved) => (x, z) => {
    const k = gIdx(x, z); if (k < 0 || paved(x, z)) return 3;
    const t = gt[k]; if (t === 9) return 1; if (t === 13) return 2;
    if (t === 0 || t === 10 || t === 255) return can(x, z) >= 1 ? 1 : t === 255 ? 3 : 0;
    return t === 12 ? 0 : 3;
  };
})();
