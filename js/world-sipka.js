/* =========================================================================
   WORLD — Šipka, Bulgaria (docs/proge/sipka.md): the north side of the road over the Shipka Pass and the old road up to the summit of Šipka,
   built by the shared world of the mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its own (PL_LOOK.sipka), trees of their
   own (L.treeGeo, L.tree) in place of the shared builder's spruce and one landmark (L.pre, L.extra): the beech forest of the Balkan range's
   northern slopes (Fagus sylvatica, the tall smooth grey trunks under the oval crowns), a few conifers of the plantings between them, and on
   the summit above the finish the stone tower of the monument on its stepped plinth, after OpenStreetMap's footprint (~16 m square; its
   height from the sources, ~31 m) — a shape only: no inscription, no figure, no name. Places from OpenStreetMap (ODbL 1.0); the trees' places
   the land cover's (the shared builder's), not the real ones; the species from the sources (README »Zasluge«), their shares estimated
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { box, caGround, cyl, rng, vary } = API;

  /* ---- the look: the Balkan range in summer: the deep green beech forest on the north slopes, the meadows of the ridge going pale in the
     dry weeks, grey sandstone and schist in the cuttings; Bulgaria's road markings (white, the centre line dashed 3 m / 6 m on the main road)
     and its signs (the warning triangles, the red and white chevrons), a steel barrier on the drop ---- */
  const LOOK = API.PL_LOOK.sipka = {
    seed: 6600, board: 'SHIPKA', sub: 'STARA PLANINA', banner: ['SHIPKA PASS', '4 HAIRPINS · SHIPKA PEAK'],
    grass: [0.4, 0.5, 0.25], grassDry: [0.56, 0.55, 0.34], grassLush: [0.32, 0.47, 0.2], shrub: [0.17, 0.27, 0.13],
    rock: [0.52, 0.5, 0.46], rockWarm: [0.58, 0.53, 0.46], lichen: [0.38, 0.39, 0.33], scree: [0.6, 0.58, 0.54],
    sat: 0.55, satV: 1.25, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.5, 0.49, 0.46], [0.56, 0.54, 0.5], [0.44, 0.43, 0.41], [0.6, 0.57, 0.52], [0.48, 0.46, 0.42], [0.46, 0.46, 0.43]],   // (the sandstone and the schist of the cuttings: grey, a little warm)
    centre: [0.95, 0.95, 0.92], dash: [3, 6], solidNear: 70,
    chev: ['#d8261c', '#ffffff'], warn: 'tri', rail: 'steel', shoulder: [0.52, 0.51, 0.48],
    fans: [[0.95, 0.95, 0.95], [0.16, 0.5, 0.3], [0.84, 0.14, 0.14], [0.98, 0.82, 0.14], [0.14, 0.3, 0.62], [0.95, 0.5, 0.14], [0.55, 0.62, 0.7], [0.5, 0.36, 0.22]],
    cars: [[0.9, 0.9, 0.88], [0.72, 0.73, 0.74], [0.18, 0.32, 0.6], [0.66, 0.16, 0.14], [0.55, 0.56, 0.58], [0.7, 0.66, 0.56]],   // (no black or very dark car: CLAUDE.md)
    roofs: [[0.55, 0.26, 0.17], [0.36, 0.36, 0.37], [0.48, 0.22, 0.15], [0.3, 0.3, 0.32]],
    sheep: 0, portal: 0,
    // (the far slopes: the beech forest to ~1,400 m on the north side, the meadows of the ridge above it, the plain of Gabrovo hazy below)
    far: { lo: [0.34, 0.44, 0.24], hi: [0.46, 0.5, 0.32], dw: [0.18, 0.28, 0.14], snow: 9000, tree: [1500, 1400], fc: [0.15, 0.25, 0.12] },
  };

  /* ---- the monument's footprint on the summit (OpenStreetMap, game metres: x east, z south from the start line; ~47 m west of the line) ---- */
  const TOWER = [888.6, 2463.0], TW = 15.6, TH = 31;

  /* ---- the trees in the soft look of the game's trees (Drevesa A, docs/drevesa-a.md: AB, aPuff, aTrunk); unit height 1, the instances
     scale and tint them ---- */
  function beechGeo() {   // the beech of the high forest: a tall smooth grey trunk, bare to about half its height, under a tall oval crown of green clumps (74 vertices)
    const b = new API.AB(), R = rng(6611), col = [0.2, 0.34, 0.13];
    API.aTrunk(b, 0, -0.02, 0, 0.028, 0.62, 5, [0.62, 0.62, 0.58], 0.02);
    for (const [x, y, z, r, sy] of [[0, 0.82, 0, 0.24, 0.85], [0.16, 0.7, 0.06, 0.2, 0.8], [-0.15, 0.71, -0.07, 0.2, 0.8], [0.04, 0.6, -0.17, 0.18, 0.8], [-0.05, 0.6, 0.17, 0.18, 0.8], [0, 0.95, 0, 0.14, 0.8]])
      API.aPuff(b, x, y, z, r, sy, vary(col, R, 0.08), R, 0.3, 0.55, 1.12);
    return b.geometry();
  }
  function edgeGeo() {   // a beech on the forest's edge or on its own in the meadow: a short trunk under a wide low dome (66 vertices)
    const b = new API.AB(), R = rng(6613), col = [0.22, 0.36, 0.14];
    API.aTrunk(b, 0, -0.02, 0, 0.04, 0.38, 5, [0.6, 0.6, 0.56], 0.028);
    for (const [x, y, z, r, sy] of [[0, 0.66, 0, 0.32, 0.6], [0.26, 0.54, 0.06, 0.24, 0.62], [-0.25, 0.55, -0.08, 0.24, 0.62], [0.05, 0.5, -0.26, 0.22, 0.65], [-0.07, 0.5, 0.25, 0.22, 0.65]])
      API.aPuff(b, x, y, z, r, sy, vary(col, R, 0.09), R, 0.3, 0.55, 1.12);
    return b.geometry();
  }

  let PP = null, st = null;   // (the build's terrain (its noise) and what it planted and built: the tests)
  LOOK.pre = ({ P, exclPush }) => {
    PP = P; st = { beech: 0, edge: 0, conifer: 0, towers: 0 };
    exclPush(TOWER[0], TOWER[1], TW * 0.75 + 3);   // (the summit clear of trees round the tower)
  };
  LOOK.treeGeo = () => [beechGeo(), edgeGeo()];   // (the kinds own, own + 1 of LOOK.tree)

  /* ---- each tree the shared builder plants (its place by the land cover, its random numbers r2..r4): the forest's tall trees (lc 1) are
     beech, about one in seven of them left the shared conifers (the plantings of spruce and pine in patches, a slow noise); on the meadows
     (lc 0) a few lone beeches; the shrubs as the shared builder's ---- */
  LOOK.tree = (x, z, c, sp, hgt, wid, col, r2, r3, r4, own) => {
    if (c === 1 && sp === 0) {
      const u = r3 / 0.7;   // (sp 0 in the forest: r3 < 0.7)
      if (PP && PP.n2(x * 0.4 + 210, z * 0.4 - 90) + (r4 - 0.5) * 0.25 > 0.68) { st.conifer++; return [sp, hgt, wid, col]; }
      st.beech++; const h = 18 + r4 * 12; return [own, h, h * (0.42 + r2 * 0.12), [0.88 + r2 * 0.16, 0.92 + r4 * 0.12, 0.86 + u * 0.12]];
    }
    if (c === 0 && r2 < 0.05) { const v = r2 / 0.05; st.edge++; const h = 10 + r4 * 8; return [own + 1, h, h * (0.75 + v * 0.2), [0.9 + v * 0.14, 0.93 + r4 * 0.1, 0.86]]; }
    return [sp, hgt, wid, col];
  };

  /* ---- the tower of the monument: a square tower of grey stone, a little narrower towards the top, on a three-stepped plinth, a plain
     cornice and a low parapet; no inscription, no figure, no name ---- */
  LOOK.extra = ({ scen, out }) => {
    const RL = rng(LOOK.seed + 71), [x, z] = TOWER, g = scen.get(x, z);
    let y = Infinity; for (const [u, v] of [[0, 0], [-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, caGround(x + u * TW / 2, z + v * TW / 2));
    const stone = [0.62, 0.6, 0.55], stoneD = [0.5, 0.49, 0.45], hd = -0.26;   // (the footprint's turn from OpenStreetMap)
    for (let k = 0; k < 3; k++) box(g, x, y - 1.2 + k * 0.9, z, TW - k * 1.6, 1.6, TW - k * 1.6, hd, vary(stoneD, RL, 0.03), vary(stone, RL, 0.03));
    const y0 = y + 1.6, w0 = TW - 6.2, w1 = w0 * 0.84, n = 5, hh = (TH - 4.5) / n;
    for (let k = 0; k < n; k++) { const w = w0 + (w1 - w0) * k / (n - 1); box(g, x, y0 + k * hh, z, w, hh + 0.02, w, hd, vary(stone, RL, 0.025)); }
    const yt = y0 + n * hh;
    box(g, x, yt, z, w1 + 1.0, 0.7, w1 + 1.0, hd, stoneD, stone);   // (the cornice)
    box(g, x, yt + 0.7, z, w1 + 0.6, 1.1, w1 + 0.6, hd, vary(stone, RL, 0.03), [0.46, 0.45, 0.42]);   // (the parapet)
    cyl(g, x, yt + 1.8, z, 0.08, 1.2, 4, [0.55, 0.57, 0.6]);   // (the lightning rod)
    st.towers++;
    out.sipka = st;   // (what was planted and built: the tests)
  };

  World.ext.sipka = (scene, tex, opts) => API.buildPrelaz(scene, tex, opts, LOOK);
})();
