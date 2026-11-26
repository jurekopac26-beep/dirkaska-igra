/* =========================================================================
   WORLD — Kudowa-Zdrój, Poland (docs/proge/kudowa.md): the lower part of the Road of a Hundred Bends (DW387) in the Stołowe Mountains,
   raced downhill from below Lisia Przełęcz to the first houses of Kudowa Górna, built by the shared world of the mountain passes
   (js/world-prelaz.js, buildPrelaz) with a look of its own (PL_LOOK.kudowa): the dense spruce forest of the table mountains close on both sides
   of the narrow road (the default forest), the clearings' meadows, the pale sandstone where the slope breaks out of the trees, the houses of
   Kudowa Górna with their steep roofs of red and brown tiles at the bottom (OpenStreetMap's footprints, the shared builder's houses). A centre
   line, timber and steel barriers in the bends; the car cannot fall (no def.drops). Places from OpenStreetMap (ODbL 1.0); all generic: no names,
   letters, signs or symbols
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;

  /* ---- the look: the Stołowe Mountains in high summer: the deep green of the spruce, the brighter beech by the stream, the lush meadows of
     the clearings, the sandstone pale grey and ochre, the ridges blue in the haze beyond, no snow ---- */
  const LOOK = API.PL_LOOK.kudowa = {
    seed: 3871, board: 'KUDOWA-ZDRÓJ', sub: 'POLSKA', banner: ['PRZEŁĘCZ · DOLINA', '779 M → 435 M · 7.5 KM'],
    grass: [0.36, 0.46, 0.22], grassDry: [0.5, 0.52, 0.3], grassLush: [0.28, 0.44, 0.18], shrub: [0.24, 0.34, 0.16],
    rock: [0.66, 0.63, 0.56], rockWarm: [0.7, 0.62, 0.48], lichen: [0.56, 0.58, 0.5], scree: [0.6, 0.57, 0.5],
    bank: [0.44, 0.38, 0.28], flowers: 0.3,
    sat: 0.7, satV: 1.05, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.7, 0.66, 0.58], [0.76, 0.7, 0.58], [0.62, 0.6, 0.55], [0.72, 0.62, 0.46], [0.66, 0.6, 0.5], [0.8, 0.76, 0.68]],   // (the Stołowe sandstone: pale grey, cream, ochre where weathered)
    centre: [0.95, 0.95, 0.92], dash: [3, 9], solidNear: 40,
    chev: ['#c41e1e', '#f4f4f0'], warn: 'tri', rail: 'steel', shoulder: [0.42, 0.38, 0.3], hills: 1,
    fans: [[0.95, 0.95, 0.94], [0.82, 0.14, 0.16], [0.16, 0.3, 0.62], [0.9, 0.72, 0.16], [0.24, 0.46, 0.3], [0.72, 0.66, 0.55], [0.34, 0.36, 0.4], [0.58, 0.5, 0.4]],
    cars: [[0.94, 0.94, 0.93], [0.78, 0.79, 0.8], [0.62, 0.64, 0.66], [0.7, 0.16, 0.14], [0.2, 0.32, 0.58], [0.66, 0.6, 0.5]],
    roofs: [[0.6, 0.24, 0.18], [0.46, 0.26, 0.2], [0.52, 0.5, 0.48], [0.66, 0.3, 0.2]],   // (red and brown tiles, the odd grey sheet roof)
    sheep: 0, portal: 0, treeline: 9000, shrubR: 80,
    // (the far view: the forested table mountains and the valley round Kudowa, the meadows on the Czech side, no snow)
    far: { lo: [0.3, 0.4, 0.2], hi: [0.36, 0.44, 0.26], dw: [0.22, 0.3, 0.16], snow: 9000, tree: [1200, 300], fc: [0.16, 0.26, 0.14], dwb: [0, 150, 900, 700], rk: [900, 1200], wet: [0.12, 0.3, 0.42] },
  };

  World.ext.kudowa = (scene, tex, opts) => { API.TEX = tex; return API.buildPrelaz(scene, tex, opts, LOOK); };
})();
