/* =========================================================================
   WORLD — Darvaz (Tajikistan): the road along the Panj in the gorge of the Darvaz range is built by the shared world of the passes
   (js/world-prelaz.js, buildPrelaz) from the track's data (tools/proga/proga.py); this file adds only its look (PL_LOOK.darvaz) and registers
   the builder for the theme. The gorge: grey-brown and ochre rock in walls, ribs and slabs over the road, screes and fans of rubble down to it,
   sparse dry grass and a few shrubs on the ledges, the Panj below in its silty grey-brown; the far bank is terrain only (no labels, no line).
   The drop to the river: the steel rail where the ground falls away (buildPrelaz's rails) and the track's wall keep every car on the road.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  API.PL_LOOK.darvaz = {
    seed: 4700, board: 'DARVAZ', sub: 'PANJ', banner: ['DARVAZ', 'M41 · PANJ'],
    grass: [0.6, 0.55, 0.36], grassDry: [0.68, 0.6, 0.42], grassLush: [0.46, 0.5, 0.28], shrub: [0.3, 0.33, 0.2],
    rock: [0.46, 0.42, 0.38], rockWarm: [0.56, 0.47, 0.37], lichen: [0.42, 0.4, 0.35], scree: [0.64, 0.6, 0.53],
    sat: 0.52, satV: 1.2, snowLine: 4600, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.5, 0.46, 0.41], [0.56, 0.5, 0.43], [0.44, 0.41, 0.38], [0.6, 0.54, 0.46], [0.48, 0.43, 0.37], [0.53, 0.49, 0.45]],   // (schist and sandstone: grey-brown, ochre in places)
    centre: [0.95, 0.95, 0.92], dash: [3, 9], solidNear: 70,   // (white centre line: dashed 3 m / 9 m, solid through the tight bends)
    chev: ['#d8261c', '#ffffff'], warn: 'tri', rail: 'steel', shoulder: [0.56, 0.53, 0.47],
    fans: [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.12, 0.3, 0.62], [0.98, 0.8, 0.14], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.14, 0.14, 0.18], [0.55, 0.62, 0.7]],
    cars: [[0.9, 0.9, 0.88], [0.62, 0.62, 0.6], [0.16, 0.16, 0.18], [0.56, 0.14, 0.12], [0.2, 0.3, 0.5], [0.76, 0.72, 0.62]],
    roofs: [[0.6, 0.6, 0.58], [0.5, 0.42, 0.34], [0.36, 0.38, 0.4], [0.56, 0.3, 0.2]],
    water: { map: false, deep: [0.3, 0.29, 0.24], shal: [0.42, 0.4, 0.33], sky: [0.5, 0.52, 0.5] },   // (the Panj: silty, grey-brown, no lake's blue)
    sheep: 0, portal: 0,
    // the land beyond the corridor: dry slopes low down, bare rock higher and on the steep faces, a little scrub and juniper in between, no
    // forest; snow only on the high peaks
    far: { lo: [0.55, 0.49, 0.38], hi: [0.52, 0.48, 0.43], dw: [0.38, 0.38, 0.27], snow: 4500, tree: [900, 800], fc: [0.3, 0.32, 0.22], dwb: [1500, 1800, 3000, 2600], rk: [2400, 3300] },
  };
  World.keep('caBank', 'darvaz');   // (the walls' terrain kept between the passes' builds, as the other passes')
  World.ext.darvaz = (scene, tex, opts) => API.buildPrelaz(scene, tex, opts, API.PL_LOOK.darvaz);
})();
