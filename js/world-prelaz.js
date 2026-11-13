/* =========================================================================
   WORLD — the shared world of the mountain passes (docs/nove-proge.md: Bâlea, Furka, Gudauri, Llogara, Porto Moniz, Yungas; docs/nove-proge-1-0.md:
   Izoard, Sa Calobra, Kotor): one builder
   (buildPrelaz) for every pass, read from the track file's data (made by tools/proga/proga.py: def.dem, def.lc, def.col, def.bld, def.lakes,
   def.streams, def.cables, def.pylons, def.pulls, def.farDem, def.trees) and a look of each road's own (PL_LOOK[theme]: the colours of its
   ground and rock, the snow line, the plants, the signs and markings of its country, its landmarks). A new pass: its data from the tool, a
   PL_LOOK entry, World.ext[theme] below. What it uses of World comes from World.api (as the other worlds in files of their own).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caCar, caGH, caGround, caSlope, clamp, cone, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl,
    gable, ico, lerp, ouCutMat, ouRod, pkGroundMat, propFloorTable, rng, roadsideProps, rock, rpHash, sstep, starCone, tuftWindMat, valueNoise2,
    vary, vrDist, vrFar, vrGritTex, vrLC, vrLCf, vrNear, vrPrep
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ---- the looks of the passes. Land cover classes (def.lc, tools/proga): 0 alpine grass, 1 forest, 2 dwarf pine and shrubs, 3 built-up,
     4 rock faces, 5 water, 6 snow, 7 scree and bare ground ---- */
  const PL_LOOK = {
    // Furka (Switzerland, the west side of the pass above Gletsch): green alpine pasture on the slope above the Rhône Glacier, mats of alpine rose,
    // juniper and green alder in the gullies, the light grey granite and gneiss of the Aar massif in ice-worn slabs, crags and boulder fields,
    // grey scree under the Furkastock, the last snow high in the shady gullies; the glacier's lake below the old hotel, the glacier itself on the
    // horizon in the north (def.farDem.ice: plFarIce); the closed hotel by the hairpin (def.hotel: its shape, no name or lettering), the old
    // milestone by the road (def.milestone); the Swiss signs: black chevrons on white in the hairpins, the centre line in 4 m dashes; sheep on
    // the pasture, no tunnel at the end (the road goes on over the pass)
    furka: {
      seed: 4900, board: 'FURKA', sub: 'WALLIS', banner: ['FURKASTRASSE', '7 KEHREN · GLETSCH – FURKA'],
      grass: [0.41, 0.5, 0.25], grassDry: [0.56, 0.55, 0.34], grassLush: [0.34, 0.48, 0.21], shrub: [0.17, 0.26, 0.14],
      rock: [0.58, 0.58, 0.56], rockWarm: [0.61, 0.58, 0.53], lichen: [0.4, 0.41, 0.38], scree: [0.62, 0.62, 0.6],
      sat: 0.5, satV: 1.35, snowLine: 2500, snowC: [1.0, 1.02, 1.06],
      rockCols: [[0.58, 0.58, 0.57], [0.64, 0.63, 0.61], [0.5, 0.5, 0.5], [0.61, 0.59, 0.55], [0.54, 0.55, 0.53], [0.46, 0.47, 0.46]],   // (the granite and the gneiss: light grey, a little warm, lichened)
      centre: [0.95, 0.95, 0.92], dash: [4, 8], solidNear: 40,   // (the Swiss centre line: 4 m dashes, 8 m gaps; solid through the hairpins)
      chev: ['#f6f6f2', '#16181c'], warn: 'tri', rail: 'steel', shoulder: [0.52, 0.52, 0.5],
      fans: [[0.86, 0.1, 0.12], [0.96, 0.96, 0.96], [0.12, 0.24, 0.62], [0.98, 0.82, 0.12], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.12, 0.14, 0.2], [0.55, 0.62, 0.7]],
      cars: [[0.88, 0.88, 0.86], [0.2, 0.22, 0.25], [0.6, 0.62, 0.64], [0.14, 0.26, 0.5], [0.66, 0.12, 0.1], [0.74, 0.72, 0.66]],
      roofs: [[0.28, 0.29, 0.31], [0.36, 0.35, 0.34], [0.24, 0.25, 0.27], [0.4, 0.3, 0.22]],   // (grey stone slabs and metal, a few of old larch)
      sheep: 1, portal: 0, far: { lo: [0.38, 0.46, 0.27], hi: [0.52, 0.51, 0.48], dw: [0.18, 0.26, 0.16], snow: 2950 },
    },
    // Bâlea (the Făgăraș Mountains, Romania): the glacial valley of the Bâlea under the cirque, green alpine pasture on the slopes with mats of
    // dwarf pine and juniper, grey-brown crystalline schist in crags, slabs and scree under the walls, snow lying on into the summer in the shady
    // gullies high up; the lake in the cirque with the huts and the stalls by it, the cable car up the valley, the tunnel's portal at the end
    balea: {
      seed: 4100, board: 'LACUL BÂLEA', sub: 'FĂGĂRAȘ', banner: ['TRANSFĂGĂRĂȘAN', '6 SERPENTINE · LACUL BÂLEA'],
      grass: [0.4, 0.5, 0.24], grassDry: [0.55, 0.55, 0.32], grassLush: [0.33, 0.48, 0.2], shrub: [0.17, 0.27, 0.14],
      rock: [0.5, 0.48, 0.45], rockWarm: [0.56, 0.5, 0.44], lichen: [0.34, 0.34, 0.3], scree: [0.62, 0.6, 0.56],
      sat: 0.5, satV: 1.35, snowLine: 2120, snowC: [1.0, 1.02, 1.06],
      rockCols: [[0.47, 0.47, 0.46], [0.53, 0.52, 0.5], [0.41, 0.41, 0.41], [0.57, 0.56, 0.54], [0.46, 0.44, 0.42], [0.44, 0.45, 0.42]],   // (the schist: grey, a little brown, lichened)
      centre: [0.95, 0.95, 0.92], dash: [3, 6], solidNear: 70,   // (white centre line: dashed 3 m / 6 m, solid through the hairpins)
      chev: ['#d8261c', '#ffffff'], warn: 'tri', rail: 'steel', shoulder: [0.5, 0.51, 0.49],
      fans: [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.12, 0.24, 0.62], [0.98, 0.82, 0.12], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.12, 0.14, 0.2], [0.55, 0.62, 0.7]],
      cars: [[0.85, 0.85, 0.83], [0.62, 0.12, 0.1], [0.14, 0.26, 0.5], [0.16, 0.16, 0.18], [0.5, 0.52, 0.55], [0.72, 0.7, 0.66]],
      roofs: [[0.32, 0.18, 0.12], [0.26, 0.27, 0.28], [0.44, 0.2, 0.14], [0.2, 0.24, 0.22]],
      sheep: 1, portal: 1, far: { lo: [0.36, 0.44, 0.26], hi: [0.5, 0.49, 0.45], dw: [0.18, 0.26, 0.16], snow: 2250 },
    },
    // Izoard (the Hautes-Alpes, France): the north side of the col above Le Laus: an open forest of larch with Swiss stone pine on a grassy floor,
    // the trees lower and sparser towards the treeline (~2250 m); above it dry alpine pasture with juniper and rhododendron, pale grey and ochre
    // limestone and dolomite in crags and in wide scree slopes under the col, hardly any snow left in summer; the refuge by the road, the stalls at
    // the col, the power line along the road (def.power), the col's stone obelisk (def.obelisk); the French signs: white chevrons on blue in the
    // hairpins, the centre line in short dashes; the shrubs drawn only within 120 m of the road (shrubR: the phone's load, the forest has many)
    izoard: {
      seed: 4300, board: "COL D'IZOARD", sub: 'HAUTES-ALPES', banner: ["ROUTE DU COL D'IZOARD", '18 LACETS · HAUTES-ALPES'],
      grass: [0.46, 0.5, 0.27], grassDry: [0.62, 0.58, 0.36], grassLush: [0.37, 0.49, 0.22], shrub: [0.22, 0.3, 0.16],
      rock: [0.62, 0.6, 0.56], rockWarm: [0.68, 0.6, 0.48], lichen: [0.45, 0.44, 0.39], scree: [0.71, 0.68, 0.61],
      sat: 0.5, satV: 1.35, snowLine: 2700, snowC: [1.0, 1.02, 1.06],
      rockCols: [[0.62, 0.6, 0.57], [0.68, 0.66, 0.61], [0.55, 0.54, 0.52], [0.7, 0.62, 0.5], [0.61, 0.57, 0.51], [0.66, 0.64, 0.6]],   // (the limestone and the dolomite: pale grey, a little ochre)
      centre: [0.95, 0.95, 0.92], dash: [3, 10], solidNear: 40,   // (the French centre line: 3 m dashes, 10 m gaps; solid through the hairpins)
      chev: ['#1f4f9e', '#ffffff'], warn: 'tri', rail: 'steel', shoulder: [0.56, 0.55, 0.51],
      fans: [[0.12, 0.26, 0.62], [0.95, 0.95, 0.95], [0.84, 0.14, 0.14], [0.98, 0.82, 0.12], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.12, 0.14, 0.2], [0.55, 0.62, 0.7]],
      cars: [[0.85, 0.85, 0.83], [0.2, 0.22, 0.25], [0.6, 0.62, 0.64], [0.14, 0.24, 0.46], [0.62, 0.14, 0.12], [0.74, 0.72, 0.66]],
      roofs: [[0.3, 0.32, 0.34], [0.42, 0.26, 0.17], [0.24, 0.26, 0.28], [0.5, 0.48, 0.44]],   // (grey slate and metal, old larch shingles)
      sheep: 0, portal: 0, forest: 'larch', treeline: 2250, power: 1, shrubR: 120,
      far: { lo: [0.42, 0.47, 0.28], hi: [0.6, 0.58, 0.54], dw: [0.24, 0.31, 0.18], snow: 2950, tree: [2250, 2050], fc: [0.16, 0.25, 0.13], rk: [2400, 2750], dwb: [2150, 2300, 2650, 2450] },
    },
    // Sa Calobra (Mallorca, the Serra de Tramuntana): the karst of the north coast: pale grey limestone in walls, ribs and bare pavements (lc 7: the
    // bare rock with a few plants in its cracks), weathered warm ochre where it faces the sun; between them the dry Mediterranean scrub, the
    // macchia (lc 2: mastic, holm oak and wild olive bushes, dark), tussocks of càrritx on the dry grass (lc 0) and Aleppo pines with holm oaks
    // lower down (lc 1; def.forest 'med'); no snow; the road edged with low stone parapets (rail 'stone'), the knot's stone arch bridge over the
    // road below (Track.cross); the Spanish signs: white chevrons on blue in the hairpins, the centre line in 3.5 m dashes; no hairpin numbers on
    // the road (plates 0); the sea beyond the mountains to the north (far.wet: the far land's water, deep blue), the far mountains deeper in
    // the haze than the passes' (far.hz: irFar's [floor, rise]; the near world's own haze before them)
    sacalobra: {
      seed: 4500, board: 'SA CALOBRA', sub: 'SERRA DE TRAMUNTANA', banner: ['CARRETERA DE SA CALOBRA', 'MA-2141 · SERRA DE TRAMUNTANA'],
      grass: [0.5, 0.5, 0.38], grassDry: [0.6, 0.57, 0.45], grassLush: [0.38, 0.44, 0.27], shrub: [0.22, 0.27, 0.16],
      rock: [0.6, 0.59, 0.56], rockWarm: [0.66, 0.58, 0.48], lichen: [0.48, 0.48, 0.43], scree: [0.62, 0.61, 0.57],
      bank: [0.52, 0.42, 0.33], flowers: 0.3,   // (the steep banks by the road: the red earth of the karst, terra rossa; few flowers in the dry summer)
      sat: 0.35, satV: 1.1, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
      rockCols: [[0.56, 0.55, 0.52], [0.62, 0.61, 0.57], [0.5, 0.49, 0.47], [0.63, 0.56, 0.46], [0.56, 0.52, 0.45], [0.6, 0.59, 0.56]],   // (the limestone: pale grey, a little ochre)
      centre: [0.95, 0.95, 0.92], dash: [3.5, 9], solidNear: 40,   // (the Spanish centre line: 3.5 m dashes, 9 m gaps; solid through the hairpins)
      chev: ['#1f4f9e', '#ffffff'], warn: 'tri', rail: 'stone', plates: 0, shoulder: [0.6, 0.58, 0.53], hills: 1,
      fans: [[0.95, 0.95, 0.95], [0.12, 0.26, 0.62], [0.84, 0.14, 0.14], [0.98, 0.82, 0.12], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.12, 0.14, 0.2], [0.55, 0.62, 0.7]],
      cars: [[0.9, 0.9, 0.88], [0.2, 0.22, 0.25], [0.62, 0.64, 0.66], [0.14, 0.3, 0.55], [0.7, 0.16, 0.12], [0.8, 0.78, 0.72]],
      roofs: [[0.62, 0.36, 0.24], [0.56, 0.32, 0.22], [0.52, 0.5, 0.46], [0.68, 0.44, 0.3]],   // (the island's terracotta tiles, the stone)
      sheep: 0, portal: 0, forest: 'med', treeline: 9000, shrubR: 110,
      far: { lo: [0.44, 0.45, 0.36], hi: [0.64, 0.63, 0.6], dw: [0.3, 0.33, 0.23], snow: 9000, tree: [550, 200], fc: [0.21, 0.27, 0.17], rk: [350, 800], dwb: [0, 150, 900, 650], wet: [0.1, 0.3, 0.48], hz: [0.5, 0.35] },
    },
    // Kotor (Montenegro, the Bay of Kotor): the steep karst slope over the bay under Krstac: pale grey limestone in ribs, slabs and bare
    // pavements (lc 7) and in the walls of the gullies (lc 4), the dry karst scrub between them (lc 2: hornbeam, downy oak, juniper and
    // Christ's thorn, dark), patches of dry grass (lc 0) and the oak and hornbeam woods in the hollows (lc 1; def.forest 'med'); no snow; the
    // road held up the slope by dry-stone retaining walls and edged with low stone parapets (rail 'stone'); red and white chevrons in the
    // hairpins, the centre line in 3 m dashes; no hairpin numbers (plates 0: the real road's own run from the bay up, not the game's); the
    // bay below to the north and west (far.wet: the far land's water, deep green-blue), the mountains round it in the sea haze (far.hz)
    kotor: {
      seed: 4700, board: 'KOTORSKE SERPENTINE', sub: 'BOKA KOTORSKA', banner: ['KOTOR · NJEGUŠI · CETINJE', '13 SERPENTINA · BOKA KOTORSKA'],
      grass: [0.5, 0.5, 0.36], grassDry: [0.6, 0.57, 0.44], grassLush: [0.36, 0.45, 0.25], shrub: [0.2, 0.27, 0.15],
      rock: [0.63, 0.62, 0.59], rockWarm: [0.67, 0.61, 0.51], lichen: [0.49, 0.49, 0.45], scree: [0.65, 0.64, 0.6],
      bank: [0.54, 0.42, 0.32], flowers: 0.35,   // (the banks by the road: the karst's red earth; few flowers in the dry summer)
      sat: 0.4, satV: 1.15, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
      rockCols: [[0.6, 0.59, 0.56], [0.67, 0.66, 0.62], [0.54, 0.53, 0.51], [0.66, 0.6, 0.5], [0.6, 0.57, 0.5], [0.64, 0.63, 0.6]],   // (the limestone: pale grey, a little ochre)
      centre: [0.95, 0.95, 0.92], dash: [3, 6], solidNear: 40,   // (the centre line: 3 m dashes, 6 m gaps; solid through the hairpins)
      chev: ['#d8261c', '#ffffff'], warn: 'tri', rail: 'stone', plates: 0, shoulder: [0.6, 0.58, 0.54],
      fans: [[0.8, 0.12, 0.12], [0.95, 0.95, 0.95], [0.92, 0.74, 0.18], [0.12, 0.26, 0.62], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.12, 0.14, 0.2], [0.55, 0.62, 0.7]],
      cars: [[0.9, 0.9, 0.88], [0.2, 0.22, 0.25], [0.62, 0.64, 0.66], [0.14, 0.3, 0.55], [0.7, 0.16, 0.12], [0.8, 0.78, 0.72]],
      roofs: [[0.64, 0.36, 0.24], [0.58, 0.32, 0.21], [0.52, 0.5, 0.46], [0.68, 0.44, 0.3]],   // (the Boka's terracotta tiles, the stone)
      sheep: 0, portal: 0, forest: 'med', treeline: 9000, shrubR: 110, bkCap: 4, view: 1,   // (bkCap: the walls between the legs at most 4 m, a steep bank of rock and scrub below; view: the viewpoints' wall, cars, people)
      far: { lo: [0.4, 0.44, 0.31], hi: [0.64, 0.63, 0.6], dw: [0.26, 0.32, 0.2], snow: 9000, tree: [900, 350], fc: [0.19, 0.27, 0.15], rk: [800, 1500], dwb: [0, 150, 1300, 1000], wet: [0.09, 0.27, 0.36], hz: [0.3, 0.4] },
    },
  };
  // Gudauri (Georgia, the Greater Caucasus): the open slopes above the deep valley of the White Aragvi, late-summer alpine meadow, yellowing,
  // grazed short, with mats of Caucasian rhododendron and juniper, the pine planted round the lower village (lc 1), dark grey-brown andesite and
  // shale in crags and in scree on the steep faces, no snow left in summer this low; the ski village along the road (L.hotels: the hotels and the
  // apartment blocks, storeys of plaster with bands of windows and balconies, the guesthouses, under roofs of coloured metal), the ski slopes'
  // chair lifts and drag lifts above it (L.chairs), the power line across the road (def.power), the first avalanche gallery at the end of the road
  // (portal 2); the Georgian signs: white chevrons on red in the hairpins, the centre line in 3 m dashes; sheep on the pasture
  PL_LOOK.gudauri = {
    seed: 5100, board: 'GUDAURI', sub: 'MTSKHETA-MTIANETI', banner: ['GEORGIAN MILITARY ROAD', '4 HAIRPINS · GUDAURI'],
    grass: [0.45, 0.5, 0.26], grassDry: [0.62, 0.58, 0.35], grassLush: [0.36, 0.48, 0.21], shrub: [0.2, 0.28, 0.15],
    rock: [0.44, 0.42, 0.4], rockWarm: [0.52, 0.46, 0.39], lichen: [0.37, 0.37, 0.33], scree: [0.52, 0.5, 0.47],
    sat: 0.55, satV: 1.3, snowLine: 3300, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.42, 0.41, 0.4], [0.48, 0.46, 0.43], [0.36, 0.35, 0.35], [0.52, 0.47, 0.42], [0.44, 0.4, 0.37], [0.4, 0.4, 0.38]],   // (the andesite and the shale: dark grey, a little brown)
    centre: [0.95, 0.95, 0.92], dash: [3, 9], solidNear: 40,   // (the centre line: 3 m dashes, 9 m gaps; solid through the hairpins)
    chev: ['#d8261c', '#ffffff'], warn: 'tri', rail: 'steel', shoulder: [0.5, 0.5, 0.47],
    fans: [[0.9, 0.12, 0.14], [0.96, 0.96, 0.96], [0.12, 0.24, 0.6], [0.98, 0.82, 0.12], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.12, 0.14, 0.2], [0.55, 0.62, 0.7]],
    cars: [[0.9, 0.9, 0.88], [0.18, 0.2, 0.22], [0.62, 0.64, 0.66], [0.76, 0.75, 0.71], [0.55, 0.12, 0.1], [0.16, 0.26, 0.45]],
    roofs: [[0.6, 0.17, 0.14], [0.2, 0.36, 0.27], [0.22, 0.33, 0.5], [0.34, 0.35, 0.37], [0.5, 0.27, 0.18]],   // (the coloured metal of the village's roofs)
    sheep: 1, portal: 2, power: 1, hotels: 1, chairs: 1,
    far: { lo: [0.43, 0.47, 0.27], hi: [0.47, 0.45, 0.42], dw: [0.23, 0.3, 0.17], snow: 3350, tree: [1900, 1650], fc: [0.19, 0.27, 0.15], rk: [2700, 3100], dwb: [1900, 2100, 2500, 2300] },
  };

  let L = PL_LOOK.balea;   // (the look of the build under way)
  const PLCOL = [0, 0, 0], PLBANK = [0.5, 0.47, 0.36];   // (PLBANK: the banks' earth, unless the look has its own: L.bank)
  let SAT = null;          // the satellite colours on the terrain grid (def.col), RGB, NaN outside the rows near the road
  function plPrep() {   // the satellite colours (def.col: RGB 5-6-5 in each row's span of the 32 m grid, as the terrain's residuals)
    const D = T.def.dem, Cd = T.def.col; SAT = null; if (!Cd) return;
    const b = atob(Cd.b64), a = new Float32Array(D.nx * D.nz * 3).fill(NaN); let q = 0;
    for (let j = 0; j < D.nz; j++) { const [s, n] = D.rows[j]; for (let i = s; i < s + n; i++) { const v = b.charCodeAt(q) * 256 + b.charCodeAt(q + 1); q += 2; const k = (j * D.nx + i) * 3;
      a[k] = (v >> 11) / 31; a[k + 1] = ((v >> 5) & 63) / 63; a[k + 2] = (v & 31) / 31; } }
    SAT = a;
  }
  const SC = [0, 0, 0];
  function plSat(x, z) {   // the satellite colour at (x, z), bilinear (null outside)
    if (!SAT) return null; const D = T.def.dem, gx = (x - D.x0) / D.cell, gz = (z - D.z0) / D.cell, i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (i < 0 || j < 0 || i >= D.nx - 1 || j >= D.nz - 1) return null;
    let w = 0; SC[0] = SC[1] = SC[2] = 0;
    for (const [a, b, f] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const k = ((j + b) * D.nx + i + a) * 3; if (SAT[k] !== SAT[k] || f <= 0) continue; SC[0] += SAT[k] * f; SC[1] += SAT[k + 1] * f; SC[2] += SAT[k + 2] * f; w += f; }
    if (w < 0.3) return null; SC[0] /= w; SC[1] /= w; SC[2] /= w; return SC;
  }
  function plSnow(x, z, A, ny, sz, sx) {   // how much of the old snow lies at (x, z): above the look's snow line on the shady north- and east-facing slopes (higher on
    // the sunny ones), in patches and in the hollows, off the steepest faces; and the snowfields of the land cover (lc 6)
    const P = API.VR, face = clamp(-sz * 2.2 - (sx || 0) * 0.8, -1, 1), line = L.snowLine + 160 - 200 * face + (P.c4(x, z) - 0.5) * 160;
    const k = sstep(line, line + 60, A) * sstep(0.45, 0.72, ny) * sstep(0.62, 0.78, P.c5(x, z) + 0.2 * sstep(line, line + 300, A));
    return Math.max(k, vrLCf(x, z, 6) * sstep(0.32, 0.6, ny));
  }
  function plCol(x, z, h, ny, sz, dd, sx) {   // ground colour (times the grey grit map): the pasture (fresh, lush and dry patches), the satellite's colour over it,
    // the dwarf pine's dark mats, the scree, the rock (every steep face too) in bands with lichen, the snow, a gravel verge by the road
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), f = P.n4(x, z);
    const sh = vrLCf(x, z, 2) + vrLCf(x, z, 1), rk = vrLCf(x, z, 4), sc = vrLCf(x, z, 7), vi = vrLCf(x, z, 3);
    const dry = sstep(0.55, 0.82, m) * 0.7, lush = sstep(0.6, 0.85, q) * (1 - dry);
    let R = lerp(lerp(L.grass[0], L.grassDry[0], dry), L.grassLush[0], lush), G = lerp(lerp(L.grass[1], L.grassDry[1], dry), L.grassLush[1], lush), B = lerp(lerp(L.grass[2], L.grassDry[2], dry), L.grassLush[2], lush);
    const s = plSat(x, z); if (s) { const k = L.sat, m3 = (s[0] + s[1] + s[2]) / 3, sv = L.satV || 1.3; R = lerp(R, m3 + (s[0] - m3) * sv, k); G = lerp(G, m3 + (s[1] - m3) * sv, k); B = lerp(B, m3 + (s[2] - m3) * sv, k); }
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.08; B += (f - 0.5) * 0.06;
    R = lerp(R, L.shrub[0], sh * 0.75); G = lerp(G, L.shrub[1], sh * 0.75); B = lerp(B, L.shrub[2], sh * 0.75);
    R = lerp(R, 0.55, vi * 0.5); G = lerp(G, 0.52, vi * 0.5); B = lerp(B, 0.46, vi * 0.5);
    if (sc > 0) { const k = sc * (0.7 + 0.3 * P.n3(x, z)); R = lerp(R, L.scree[0], k); G = lerp(G, L.scree[1], k); B = lerp(B, L.scree[2], k); }
    // the rock: the faces of the land cover and the steepest ground away from the road; the steep banks between the hairpins' legs and by the road stay
    // grass over earth (in streaks down the fall line)
    const nearR = sstep(30, 12, dd), st = Math.max(sstep(0.66, 0.48, ny) * (1 - 0.8 * nearR), rk * (0.6 + 0.4 * sstep(0.35, 0.65, P.n3(x, z))));
    const bank = sstep(0.86, 0.62, ny) * (1 - st); if (bank > 0) { const e = bank * (0.35 + 0.35 * P.n2(x * 1.3, z * 1.3)), bc = L.bank || PLBANK; R = lerp(R, bc[0], e); G = lerp(G, bc[1], e); B = lerp(B, bc[2], e); }
    if (st > 0) { const w = sstep(0.45, 0.75, P.c3(x, z)), li = sstep(0.55, 0.8, P.n2(x * 1.7, z * 1.7)) * 0.5, band = 0.88 + 0.12 * Math.sin(A / 4.5 + P.c2(x * 0.4, z * 0.4) * 6);
      const r0 = lerp(L.rock[0], L.rockWarm[0], w) * band, g0 = lerp(L.rock[1], L.rockWarm[1], w) * band, b0 = lerp(L.rock[2], L.rockWarm[2], w) * band;
      R = lerp(R, lerp(r0, L.lichen[0], li), st); G = lerp(G, lerp(g0, L.lichen[1], li), st); B = lerp(B, lerp(b0, L.lichen[2], li), st); }
    const sn = plSnow(x, z, A, ny, sz, sx); R = lerp(R, L.snowC[0], sn); G = lerp(G, L.snowC[1], sn); B = lerp(B, L.snowC[2], sn);
    if (dd < 2) { const t = sstep(2, 0.3, dd) * 0.45 * (1 - sn); R = lerp(R, 0.56, t); G = lerp(G, 0.55, t); B = lerp(B, 0.5, t); }
    PLCOL[0] = R; PLCOL[1] = G; PLCOL[2] = B; return PLCOL;
  }
  function plGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in plTileGeo)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = plCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, nz / l, G.dd[jj * G.nx + ii], nx / l);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function plTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells, in the haze)
    const G = API.VR.G, Lt = VRC * VRT, x = G.x0 + (ti + 0.5) * Lt, z = G.z0 + (tj + 0.5) * Lt, d = vrDist(x, z);
    return d < 300 ? 1 : d < 440 ? 2 : 0;
  }
  function plTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by plCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = plCol(x, z, h, ny, nz, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)], nx); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? plTileOn(a, b) : 0);
      const fix = (k0, dk) => { for (let q = 1; q < m; q += 2) { const a = k0 + (q - 1) * dk, b = k0 + (q + 1) * dk; pos[(k0 + q * dk) * 3 + 1] = (pos[a * 3 + 1] + pos[b * 3 + 1]) / 2; } };
      if (nb(ti, tj - 1) === 2) fix(0, 1); if (nb(ti, tj + 1) === 2) fix(m * n, 1); if (nb(ti - 1, tj) === 2) fix(0, n); if (nb(ti + 1, tj) === 2) fix(m, n);
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('steep', new THREE.BufferAttribute(stp, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }
  let plWT = null;
  function plWallTex() {   // the retaining walls' masonry on a 3.5 m tile (256 px, seamless): courses of rough schist blocks of the valley's greys and
    // brown-greys, each stone its own tone with a lit top edge and a shadowed foot, dark mortar joints, lichen and damp streaks
    if (plWT) return plWT;
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(7307);
    x.fillStyle = '#3c3a35'; x.fillRect(0, 0, S, S);
    const hs = []; let tot = 0; for (let k = 0; k < 9; k++) { const h = 0.6 + r() * 0.9; hs.push(h); tot += h; }
    let y = 0;
    for (let k = 0; k < hs.length; k++) {
      const hh = hs[k] / tot * S, nB = 4 + Math.floor(r() * 3), ws = []; let tw = 0; for (let q = 0; q < nB; q++) { const w = 0.5 + r(); ws.push(w); tw += w; }
      let xx = r() * S;
      for (let q = 0; q < nB; q++) {
        const ww = ws[q] / tw * S, L0 = 112 + r() * 70, wm = (r() - 0.4) * 14, g = 2 + r() * 2.5, col = (l) => `rgb(${Math.round(l + wm)},${Math.round(l + wm * 0.4)},${Math.round(l - wm * 0.3)})`;
        const w0 = ww - 2 * g, h0 = hh - 2 * g, jt = [r() * 3, r() * 2, r() * 3, r() * 2, r() * 2, r() * 3, r() * 2, r() * 2], dt = [];   // (every stone's random values once: the copy past the edge the same)
        for (let d = 0; d < 10; d++) dt.push([r() < 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)', r() * w0, r() * h0, 1 + r() * 4, 1 + r() * 2]);
        const lc = r() < 0.25 ? [r() * w0 * 0.5, r() * h0 * 0.4] : null;
        if (w0 >= 2 && h0 >= 2) for (const ox of [0, -S]) {
          const x0 = xx + ox + g, y0 = y + g;
          x.fillStyle = col(L0); x.beginPath(); x.moveTo(x0 + jt[0], y0 + jt[1]); x.lineTo(x0 + w0 - jt[2], y0 + jt[3]); x.lineTo(x0 + w0 - jt[4], y0 + h0 - jt[5]); x.lineTo(x0 + jt[6], y0 + h0 - jt[7]); x.closePath(); x.fill();
          x.fillStyle = 'rgba(255,255,255,0.13)'; x.fillRect(x0 + 2, y0 + 1, w0 - 4, Math.max(1.5, h0 * 0.12));   // (the lit top)
          x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(x0 + 1, y0 + h0 * 0.8, w0 - 2, h0 * 0.2);   // (the shadowed foot)
          for (const [c, a, b, e, f] of dt) { x.fillStyle = c; x.fillRect(x0 + a, y0 + b, e, f); }
          if (lc) { x.fillStyle = 'rgba(150,160,96,0.28)'; x.fillRect(x0 + lc[0], y0 + lc[1], w0 * 0.3, h0 * 0.35); }   // (lichen)
        }
        xx = (xx + ww) % S;
      }
      y += hh;
    }
    for (let d = 0; d < 7; d++) { const sx = r() * S, sw = 4 + r() * 10; x.fillStyle = 'rgba(20,18,14,0.12)'; x.fillRect(sx, 0, sw, S); x.fillRect(sx - S, 0, sw, S); }   // (damp streaks down the face)
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return (plWT = t);
  }
  // the glaciers on the horizon (def.farDem.ice: WorldCover's snow and ice as runs over the far mesh's nodes, tools/proga; Furka's Rhône Glacier
  // in the north): the nodes are the far mesh's first vertices, in the grid's order (irFar), so they are coloured over here once it is made:
  // white under the firn high up, grey with the rock flour down the tongue, a cold blue on the steep icefall; a lake's nodes left as they are
  function plFarIce(F) {
    const D = T.def.farDem, nx = D.nx, nz = D.nz, n = nx * nz, C = F.mesh.geometry.attributes.color, base = API.VR.D.base, m = [new Uint8Array(n), new Uint8Array(n)];
    [D.lake || [], D.ice].forEach((runs, r) => { for (let k = 0, p = 0, v = 0; k < runs.length; k++) { if (v) m[r].fill(1, p, p + runs[k]); p += runs[k]; v ^= 1; } });
    const y = (i, j) => F.P0[3 * (Math.min(nz - 1, Math.max(0, j)) * nx + Math.min(nx - 1, Math.max(0, i))) + 1];
    for (let k = 0; k < n; k++) { if (!m[1][k] || m[0][k]) continue;
      const i = k % nx, j = (k - i) / nx, A = F.P0[3 * k + 1] + base, q = rpHash(i, j) - 0.5, sl = Math.hypot(y(i + 1, j) - y(i - 1, j), y(i, j + 1) - y(i, j - 1)) / (2 * D.cell);
      const hi = sstep(2300, 2800, A), bl = sstep(0.3, 0.6, sl) * 0.6;
      C.setXYZ(k, lerp(lerp(0.64, 0.92, hi) + q * 0.04, 0.66, bl), lerp(lerp(0.67, 0.95, hi) + q * 0.04, 0.8, bl), lerp(lerp(0.7, 0.98, hi) + q * 0.03, 0.9, bl)); }
    C.needsUpdate = true;
  }
  const plATex = {};   // (the board atlases of each look, made once and reused by every build of the road)
  function plAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the pass's board, the race's banner
    const key = L.seed + '|' + cps.join('|') + '|' + finA; if (plATex.a && plATex.ak === key) return plATex.a;
    if (plATex.a) plATex.a.dispose(); plATex.ak = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(292, 142, 440, 100); txt('FINISH', 512, 196, 92, '#111', 420);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#23466e'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#4a3a2a'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f1e6cc'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt(L.board, 512, 812, 60, '#f3ead6', 900); txt(finA, 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#f2f2ee'; x.fillRect(0, 896, 1024, 64); x.fillStyle = '#23466e'; x.fillRect(0, 960, 1024, 64);
    txt(L.banner[0], 512, 930, 54, '#16181c', 960); txt(L.banner[1], 512, 994, 44, '#fff', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (plATex.a = t);
  }
  function plAtlas2() {   // the small signs (8 x 8 cells of 128): 0-1 the bend warning (a red-bordered triangle with the bent arrow, right and left), 2-3 the
    // chevrons (the look's colours, right and left), 4 the speed limit (40), 5 the end of the limit; 8-31 the hairpins' numbers (1-24) on a small white plate
    if (plATex.b && plATex.bk === L.seed) return plATex.b;
    if (plATex.b) plATex.b.dispose(); plATex.bk = L.seed;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 110); };
    for (const [k, dir] of [[0, 1], [1, -1]]) {   // the triangle: white, a red border, the black arrow bending the road's way
      const x0 = k * 128; x.fillStyle = '#c8201a'; x.beginPath(); x.moveTo(x0 + 64, 6); x.lineTo(x0 + 124, 116); x.lineTo(x0 + 4, 116); x.fill();
      x.fillStyle = '#f6f6f2'; x.beginPath(); x.moveTo(x0 + 64, 30); x.lineTo(x0 + 106, 104); x.lineTo(x0 + 22, 104); x.fill();
      x.strokeStyle = '#16181c'; x.lineWidth = 8; x.beginPath(); x.moveTo(x0 + 64 - 8 * dir, 98); x.lineTo(x0 + 64 - 8 * dir, 70); x.quadraticCurveTo(x0 + 64 - 8 * dir, 54, x0 + 64 + 10 * dir, 54); x.stroke();
      x.fillStyle = '#16181c'; x.beginPath(); x.moveTo(x0 + 64 + 8 * dir, 44); x.lineTo(x0 + 64 + 24 * dir, 54); x.lineTo(x0 + 64 + 8 * dir, 64); x.fill(); }
    for (const [k, dir] of [[2, 1], [3, -1]]) {   // the chevrons
      const x0 = k * 128; x.fillStyle = L.chev[0]; x.fillRect(x0, 0, 128, 128); x.fillStyle = L.chev[1];
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, 22); x.lineTo(cx + 18 * dir, 64); x.lineTo(cx - 14 * dir, 106); x.lineTo(cx - 34 * dir, 106); x.lineTo(cx - 2 * dir, 64); x.lineTo(cx - 34 * dir, 22); x.closePath(); x.fill(); } }
    { const x0 = 512; x.fillStyle = '#c8201a'; x.beginPath(); x.arc(x0 + 64, 64, 60, 0, TAU); x.fill(); x.fillStyle = '#f6f6f2'; x.beginPath(); x.arc(x0 + 64, 64, 46, 0, TAU); x.fill(); txt('40', x0 + 64, 68, 56, '#16181c', 80); }
    { const x0 = 640; x.fillStyle = '#f6f6f2'; x.beginPath(); x.arc(x0 + 64, 64, 60, 0, TAU); x.fill(); x.strokeStyle = '#16181c'; x.lineWidth = 3; x.stroke(); txt('40', x0 + 64, 68, 54, '#8a8a8a', 80);
      x.strokeStyle = '#16181c'; x.lineWidth = 7; x.beginPath(); x.moveTo(x0 + 24, 104); x.lineTo(x0 + 104, 24); x.stroke(); }
    for (let k = 0; k < 24; k++) { const x0 = (k % 8) * 128, y0 = 128 * (1 + (k >> 3)); x.fillStyle = '#16181c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f6f6f2'; x.fillRect(x0 + 6, y0 + 6, 116, 116); txt(String(k + 1), x0 + 64, y0 + 68, 84, '#16181c', 110); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (plATex.b = t);
  }
  function plTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them): 0 Norway spruce (a narrow dark spire), 1 dwarf pine (a low mat of
    // crooked branches with dark tufts), 2 juniper (a smaller, flatter, grey-green mat), 3 European larch (an airy cone of soft light-green tiers,
    // drooping, the trunk showing under them), 4 Swiss stone pine (a dense dark blue-green crown, rounded, in clumps on a short trunk); the
    // Mediterranean's (forest 'med'): 5 Aleppo pine (a tall bare grey trunk under an open, flat-topped crown of light green clumps), 6 a bush of
    // the macchia (mastic, wild olive, holm oak scrub: dark rounded clumps), 7 a tussock of càrritx (a fountain of stiff leaves, straw at the
    // tips), 8 holm oak (a dense rounded crown of the darkest green on a short trunk)
    const g = new GB(), R = rng(4140 + kind), rs = API.ROCK_SMOOTH;
    if (kind === 5) {
      const col = [0.25, 0.35, 0.17], bark = [0.42, 0.37, 0.33];
      cyl(g, 0, 0, 0, 0.028, 0.7, 5, bark, null, 0.018);
      API.ROCK_SMOOTH = true;
      for (const [x, y, z, r, sy] of [[0, 0.8, 0, 0.3, 0.4], [0.21, 0.74, 0.1, 0.21, 0.45], [-0.19, 0.76, -0.08, 0.22, 0.42], [0.05, 0.9, -0.13, 0.17, 0.45], [-0.07, 0.87, 0.18, 0.16, 0.45]]) ico(g, x, y, z, r, sy, vary(col, R, 0.12), R, 0.35);
    } else if (kind === 8) {
      const col = [0.13, 0.2, 0.11], bark = [0.32, 0.28, 0.24];
      cyl(g, 0, 0, 0, 0.05, 0.34, 5, bark, null, 0.04);
      API.ROCK_SMOOTH = true;
      for (const [x, y, z, r, sy] of [[0, 0.56, 0, 0.36, 0.75], [0.2, 0.5, 0.12, 0.24, 0.8], [-0.18, 0.52, -0.1, 0.25, 0.8], [0.04, 0.78, 0, 0.22, 0.8]]) ico(g, x, y, z, r, sy, vary(col, R, 0.1), R, 0.3);
    } else if (kind === 7) {
      starCone(g, 0, 0, 0, 0.5, 0.95, 7, [0.38, 0.42, 0.22], [0.74, 0.68, 0.45], 0, 0.1);
      starCone(g, 0.04, 0, -0.03, 0.34, 0.75, 5, [0.42, 0.45, 0.24], [0.8, 0.74, 0.5], 0.6, 0.08);
    } else if (kind === 3) {
      const col = [0.3, 0.42, 0.18], tip = [0.46, 0.58, 0.27], bark = [0.34, 0.24, 0.17];
      cyl(g, 0, 0, 0, 0.032, 0.42, 5, bark, null, 0.02);
      [[0.16, 0.27, 0.2, 0.07], [0.31, 0.24, 0.19, 0.065], [0.45, 0.2, 0.18, 0.055], [0.58, 0.155, 0.17, 0.045], [0.7, 0.11, 0.16, 0.035]].forEach(([y, r, h, dr], k) => {
        const kk = k % 2 ? 1.12 : 0.94; starCone(g, 0, y, 0, r, h, 5, [col[0] * kk, col[1] * kk, col[2] * kk], tip, k * 1.1, dr); });
      cone(g, 0, 0.82, 0, 0.05, 0.18, 4, col, tip, 0.3);
    } else if (kind === 4) {
      const col = [0.11, 0.2, 0.13], bark = [0.3, 0.23, 0.18];
      cyl(g, 0, 0, 0, 0.05, 0.3, 5, bark, null, 0.035);
      API.ROCK_SMOOTH = true;
      for (const [x, y, z, r, sy] of [[0, 0.38, 0, 0.32, 0.85], [0.07, 0.62, 0.04, 0.24, 0.9], [-0.04, 0.82, -0.03, 0.15, 0.9]]) ico(g, x, y, z, r, sy, vary(col, R, 0.12), R, 0.3);
    } else if (kind === 0) {
      const col = [0.08, 0.15, 0.1], tip = [0.14, 0.25, 0.17];
      [[0.0, 0.24, 0.3, 0.05], [0.18, 0.2, 0.27, 0.045], [0.36, 0.17, 0.24, 0.04], [0.52, 0.13, 0.22, 0.035], [0.67, 0.09, 0.2, 0.03]].forEach(([y, r, h, dr], k) => {
        const kk = k % 2 ? 1.1 : 1; starCone(g, 0, y, 0, r, h, 6, [col[0] * kk, col[1] * kk, col[2] * kk], tip, k * 0.7, dr); });
      cone(g, 0, 0.84, 0, 0.04, 0.16, 4, col, tip, 0.4);
    } else {
      API.ROCK_SMOOTH = true; const col = kind === 1 ? [0.1, 0.2, 0.11] : kind === 6 ? [0.16, 0.23, 0.12] : [0.2, 0.28, 0.2], n = kind === 1 ? 6 : kind === 6 ? 5 : 4;
      for (let k = 0; k < n; k++) { const a = k / n * TAU + R() * 0.5, d = k ? 0.32 : 0; ico(g, Math.cos(a) * d, 0.4 - d * 0.45, Math.sin(a) * d, 0.32, 0.7, vary(col, R, 0.18), R, 0.35); }
    }
    if (kind === 9) {   // a light clump of scrub (two lumps: the banks between Kotor's legs, many of them, L.bkCap)
      API.ROCK_SMOOTH = true; const col = [0.17, 0.24, 0.12];
      ico(g, 0, 0.42, 0, 0.38, 0.72, vary(col, R, 0.12), R, 0.3); ico(g, 0.32, 0.34, 0.14, 0.27, 0.75, vary(col, R, 0.16), R, 0.35);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function plSheepGeo() {   // a sheep (cream fleece, dark face and legs): x forward, ~1.2 m long
    const g = new GB(), R = rng(4151), fl = [0.88, 0.85, 0.76], dk = [0.16, 0.13, 0.12], rs = API.ROCK_SMOOTH;
    API.ROCK_SMOOTH = true; ico(g, 0, 0.72, 0, 0.44, 0.8, fl, R, 0.15); ico(g, -0.26, 0.7, 0, 0.38, 0.85, fl, R, 0.15); API.ROCK_SMOOTH = rs;
    box(g, 0.56, 0.86, 0, 0.32, 0.22, 0.2, 0, dk);
    for (const [u, v] of [[0.3, -0.13], [0.3, 0.13], [-0.4, -0.13], [-0.4, 0.13]]) box(g, u, 0, v, 0.08, 0.5, 0.08, 0, dk);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function plFarCol(A, sl, q) {   // the land beyond the corridor (irFar): the pasture green low down, grey-brown rock higher up and on the steep faces, the dwarf pine darker
    // on the lower slopes, snow in the high gullies (the look's bands: far.tree the forest's upper edge [top, full], far.dwb the dwarf pine's
    // [from, full, to, full], far.rk the rock's [from, full]; far.fc the forest's colour)
    const F = L.far, B = F.dwb || [1500, 1700, 2100, 1850], Rk = F.rk || [2050, 2350], Tl = F.tree || [1650, 1450], fc = F.fc || [0.12, 0.2, 0.12];
    const dw = sstep(B[0], B[1], A) * sstep(B[2], B[3], A) * 0.6, rk = Math.min(1, sstep(Rk[0], Rk[1], A) * 0.8 + sstep(0.55, 0.95, sl) * 0.8);
    let c = [F.lo[0] + q * 0.04, F.lo[1] + q * 0.05, F.lo[2] + q * 0.03];
    const fo = sstep(Tl[0], Tl[1], A); c = [lerp(c[0], fc[0], fo), lerp(c[1], fc[1], fo), lerp(c[2], fc[2], fo)];   // the forest below the treeline
    c = [lerp(c[0], F.dw[0], dw), lerp(c[1], F.dw[1], dw), lerp(c[2], F.dw[2], dw)];
    c = [lerp(c[0], F.hi[0], rk), lerp(c[1], F.hi[1], rk), lerp(c[2], F.hi[2], rk)];
    const sn = sstep(F.snow, F.snow + 150, A) * sstep(0.9, 0.5, sl) * (0.5 + q); return [lerp(c[0], 0.95, sn), lerp(c[1], 0.96, sn), lerp(c[2], 0.98, sn)];
  }

  function buildPrelaz(scene, tex, opts, look) {
    L = look;
    const R = rng(L.seed), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.7, 0.68, 0.62] };
    vrPrep(); plPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    const holds = L.hills ? [] : null, hold = (x, z, r) => { if (holds) holds.push([x, z, r]); };   // (L.hills: what stands near the road past its barrier line, [x, z, radius]: the soft limits there stop short of it, tools/sacalobra-hribi.mjs)
    P.c1 = valueNoise2(L.seed + 11, 140); P.c2 = valueNoise2(L.seed + 12, 60); P.c3 = valueNoise2(L.seed + 13, 190); P.c4 = valueNoise2(L.seed + 14, 110); P.c5 = valueNoise2(L.seed + 15, 24);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the buildings (def.bld [x, z, length, width, angle, height, kind 0 a hut / 1 a stall or shed / 2 a big house]), clear of the road
    const blds = [];
    for (let [x, z, Lb, Wb, ang, hb, kind] of def.bld || []) { if (Lb < 2 || Wb < 2) continue; const c = Math.cos(ang), s = Math.sin(ang); let ok = true, hit = null;
      if (L.hotels) { Lb = Math.min(Lb, 34); Wb = Math.min(Wb, 20); }   // (L.hotels: the footprint as it is drawn)
      for (let k = 0; k < (L.hotels ? 5 : 1); k++) {   // (L.hotels, Gudauri's: a house the game's wider road would cut is moved back from it, up to 10 m: the
        // village's hotels and guesthouses stand close along the real road)
        if (hit) { const i = hit.i, sd = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] >= 0 ? 1 : -1; x += T.nx[i] * sd * 2.5; z += T.nz[i] * sd * 2.5; hit = null; }
        for (const [u, v] of [[0, 0], [-Lb / 2, -Wb / 2], [Lb / 2, -Wb / 2], [Lb / 2, Wb / 2], [-Lb / 2, Wb / 2]]) { const n = vrNear(x + c * u - s * v, z + s * u + c * v); if (n.i >= 0 && n.dd < 1.2) { ok = false; hit = hit || n; } }
        if (!hit) { ok = true; break; } }
      if (ok && vrDist(x, z) < 430) blds.push({ x, z, L: Math.min(Lb, 34), W: Math.min(Wb, 20), ang, h: hb, kind }); }
    // the car parks by the road (def.pulls [x, z, radius, distance]): a level plot at the road's height
    const pulls = [];
    for (let [x, z, r] of def.pulls || []) { const n = vrNear(x, z); if (n.i < 0) continue; let i = n.i; const s = i * T.ds; if (s < 30 || s > T.len - 20) continue;
      if (L.view) {   // (L.view, Kotor's viewpoints at the hairpins' tips: the plot at the tip itself, on its outside, a terrace out over the slope towards
        // the view; inside the hairpin, where OpenStreetMap has the car park, the game's wider road leaves no room between the walls of its legs)
        const cv = (def.curves || []).find(c => Math.abs(sStart + c[0] - s) < 60); if (cv) i = T.idx(sStart + cv[0]);
        r = Math.min(r, 6.5); const a = Math.max(0, i - 4), b = Math.min(N - 1, i + 4), turn = Math.sign(T.tx[a] * T.tz[b] - T.tz[a] * T.tx[b]) || 1, sd = -turn, o = (sd > 0 ? T.br[i] : T.bl[i]) + 3;
        x = T.px[i] + T.nx[i] * sd * o; z = T.pz[i] + T.nz[i] * sd * o; }
      const pad = { x, z, r: Math.max(5, Math.min(r, 22)), b: 12, h: T.hy[i] - 0.25, i, view: !!L.view }; P.pads.push(pad); pulls.push(pad); }
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 14, h: T.hy[i] - 0.25, sd, i }; };
    const padF = pulls.find(p => Math.abs(p.i * T.ds - sFin) < 160) || padBeside(sFin + 60, 12); if (!padF.sd) { const i = padF.i, sd = (padF.x - T.px[i]) * T.nx[i] + (padF.z - T.pz[i]) * T.nz[i] > 0 ? 1 : -1; padF.sd = sd; }
    if (P.pads.indexOf(padF) < 0) P.pads.push(padF);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the rocks and trees between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the rocks, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lq = eh.get(k); if (!Lq) eh.set(k, Lq = []); Lq.push(e); } return e; };
    const excluded = (x, z) => { const Lq = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lq) return false; for (let k = 0; k < Lq.length; k++) { const e = Lq[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const inLake = (x, z) => { for (const Lk of P.lakes) if (x > Lk.x0 - 2 && x < Lk.x1 + 2 && z > Lk.z0 - 2 && z < Lk.z1 + 2 && API.vrWater(x, z).e > -2) return true; return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    if (def.hotel) { const [x, z, Lh, Wh, a] = def.hotel; for (let u = -Lh / 2; u <= Lh / 2 + 0.01; u += Lh / Math.ceil(Lh / 6)) exclPush(x + Math.cos(a) * u, z + Math.sin(a) * u, Wh / 2 + 3); }   // (the hotel, drawn with the buildings)
    for (const p of pulls) exclPush(p.x, p.z, p.r + 2);
    exclPush(padF.x, padF.z, padF.r + 4);
    if (L.pre) L.pre({ P, exclPush, blds });   // (a pass's own landmarks, before the terrain: their level plots in P.pads, their room; out of blds the houses they replace)
    out.marks = {};   // (where the landmarks stand: the tests look for them)

    /* ---- the retaining walls between the legs of the hairpins: the game's road is wider than the real one (11 m against ~7 m), so where two
       legs lie close the lower one's barrier comes within a few metres of the upper one's (or under its verge) and ~10-25 m of the climb fall
       in between: the terrain's 5 m grid could only draw that as a dark sheer face over jagged teeth. There, as on the real road where it is
       built into the hillside, a masonry wall stands under the upper verge's edge (bar + 0.42), battered 1 in 20, its foot on a level shelf at
       the lower leg's height; from the road alone, before the terrain, and the terrain kept down to the shelf from under the upper verge out
       to the lower leg's barrier (API.caBank in caH), so no tooth of the grid shows in front of it. bk[si][i]: { p: [[offset, height above the
       road] top, foot], o1: where the level shelf ends, hl: the lower leg's height, bank: the bank under a wall the look keeps low (L.bkCap, Kotor's:
       the real road's walls a few metres high, the slope between the legs steep rock and scrub), [[offset, height] top, toe] } or null ---- */
    const xPair = (i, j) => { for (const c of T.cross) if (Math.abs(i - c.up) * T.ds < 40 && Math.abs(j - c.lo) * T.ds < 40) return true; return false; };   // (where the road passes under itself: no bank, the bridge below)
    const BKC = 24, BKH = new Map(), bk = [-1, 1].map((side, si) => { const a = new Array(N).fill(null);
      for (let i = 0; i < N; i++) {
        const bar = side > 0 ? T.br[i] : T.bl[i], o0 = bar + 0.42, y = T.hy[i], at = (o) => [T.px[i] + T.nx[i] * side * o, T.pz[i] + T.nz[i] * side * o];
        const other = (o) => { const [x, z] = at(o), n = vrNear(x, z); return n.i >= 0 && Math.abs(n.i - i) * T.ds > 40 && T.hy[n.i] < y - 4 && !xPair(i, n.i) ? n : null; };
        if (![1, 6, 12, 18].some(d => { const n = other(o0 + d); return n && n.dd < 3; })) continue;   // (a quick look first: most of the road has no leg below it)
        let oL = -1, hl = 0;
        for (let o = o0; o < o0 + 26; o += 0.5) { const n = other(o); if (n && n.dd < 0.5) { oL = o; hl = T.hy[n.i]; break; } }
        const H = y - hl; if (oL < 0 || H / Math.max(0.5, oL - o0) < 1.2) continue;
        const ob = Math.max(o0, Math.min(o0 + 0.05 * H, oL - 0.5)); a[i] = { p: [[o0, -0.08], [ob, -H - 0.6]], o1: Math.max(ob + 0.8, oL + 0.4), hl };
        if (L.bkCap && H + 0.6 > L.bkCap + 1.5) { const cw = L.bkCap, of = Math.max(o0, Math.min(o0 + 0.05 * cw, oL - 0.5)), toe = Math.max(of + 0.6, oL - 0.3);   // (L.bkCap: the wall only so high, a steep bank of rock and scrub from its foot down to the lower leg)
          a[i].p = [[o0, -0.08], [of, -cw]]; a[i].bank = [[of, -cw], [toe, -H - 0.6]]; a[i].o1 = Math.max(toe + 0.8, oL + 0.4); } }
      for (let i = 1; i < N - 1; i++) if (a[i] && !a[i - 1] && !a[i + 1]) a[i] = null;   // (no lone slivers)
      for (let i = 0; i < N; i++) if (a[i]) { const o0 = a[i].p[0][0];   // (hashed by the cells the shelf crosses, for the terrain's look-up)
        for (const o of [o0 - 6, o0, a[i].o1]) { const k = Math.floor((T.px[i] + T.nx[i] * side * o) / BKC) * 65536 + Math.floor((T.pz[i] + T.nz[i] * side * o) / BKC);
          for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) { const kk = k + da * 65536 + db; let Lq = BKH.get(kk); if (!Lq) BKH.set(kk, Lq = []); if (Lq[Lq.length - 1] !== si * N + i) Lq.push(si * N + i); } } }
      return a; });
    // the terrain at a wall: at most the lower leg's shelf, from under the upper verge (6 m in from the wall: out of sight under it) to the lower barrier
    API.caBank = !BKH.size ? null : { T, f: (x, z, h) => {
      const Lq = BKH.get(Math.floor(x / BKC) * 65536 + Math.floor(z / BKC)); if (!Lq) return h;
      for (let q = 0; q < Lq.length; q++) { const si = Lq[q] >= N ? 1 : 0, i = Lq[q] - si * N, side = si ? 1 : -1, b = bk[si][i], dx = x - T.px[i], dz = z - T.pz[i];
        if (Math.abs(dx * T.tx[i] + dz * T.tz[i]) > T.ds * 0.75) continue;
        const o = (dx * T.nx[i] + dz * T.nz[i]) * side; if (o < b.p[0][0] - 6 || o > b.o1) continue;
        if (b.hl - 0.35 < h) h = b.hl - 0.35; }
      return h; } };

    /* ---- terrain tiles; the lakes (def.lakes: OpenStreetMap's shores, the water a little below them) ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = plTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(plTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 70, specular: 0x2a3a44 });
      for (const Lk of P.lakes) {   // a 4 m grid near the road, 8 m farther out: the glacial lake's deep blue-green, paler at the shore, the sky in it
        const deep = [0.05, 0.2, 0.26], shal = [0.22, 0.4, 0.4], sky = [0.5, 0.62, 0.74];
        const g = new GB(true), uv = (q) => [q[0] / 14, -q[2] / 14], cc = new Map();
        const wc = (x, z) => { const key = Math.round(x) + ',' + Math.round(z); let c = cc.get(key); if (c) return c;
          const e = API.vrWater(x, z).e, ks = 0.35 * sstep(0.55, 0.8, P.n2(x * 2.2, z * 2.2)); c = [0, 1, 2].map(k => lerp(lerp(shal[k], deep[k], sstep(2, 26, e)), sky[k], ks)); cc.set(key, c); return c; };
        for (let z0 = Math.floor((Lk.z0 - 8) / 8) * 8; z0 < Lk.z1 + 8; z0 += 8) for (let x0 = Math.floor((Lk.x0 - 8) / 8) * 8; x0 < Lk.x1 + 8; x0 += 8) {
          const d = vrDist(x0 + 4, z0 + 4); if (d > 600) continue;
          const cs = d < 320 ? 4 : 8;
          for (let zz = z0; zz < z0 + 8; zz += cs) for (let xx = x0; xx < x0 + 8; xx += cs) {
            if (!(caGround(xx, zz) < Lk.h + 0.4 || caGround(xx + cs, zz) < Lk.h + 0.4 || caGround(xx, zz + cs) < Lk.h + 0.4 || caGround(xx + cs, zz + cs) < Lk.h + 0.4)) continue;
            const A = [xx, Lk.h, zz], B = [xx + cs, Lk.h, zz], C = [xx + cs, Lk.h, zz + cs], D = [xx, Lk.h, zz + cs];
            g.quadUp(A, B, C, D, [wc(A[0], A[2]), wc(B[0], B[2]), wc(C[0], C[2]), wc(D[0], D[2])], [uv(A), uv(B), uv(C), uv(D)]); }
        }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); out.dyn.water = tex.water; }
      }
      const big = P.lakes.reduce((a, b) => (!a || b.area > a.area ? b : a), null); if (big) out.marks.lake = [big.cx, big.cz];
    }

    /* ---- the road: asphalt with white edge lines and the country's centre line (dashed; solid through the hairpins), a gravel shoulder, then the verge out to a
       ditch past the barrier line, up or down onto the ground (120 m chunks); where the ground drops away below the barrier a dry-stone retaining wall ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.45;
    /* ---- the bridge where the road passes under itself (Track.cross: Sa Calobra's knot, the road looping round and under its own bridge): over the lower
       road a stone arch, segmental, springing 3.2 m above it at its barriers; the upper road's verges end at the deck's edge (kn), its face walls go down
       from there to the arch and, either side of it, to the ground, as far as the ground lies more than 2.6 m below the road (the masonry in the road's
       block, the parapets with the rails); KN: each bridge's frame (the lower road's across u and along t from c.lo), its arch and its stretch of the
       upper road (p: fractional samples) ---- */
    const kn = [new Uint8Array(N), new Uint8Array(N)], KN = [], fadeI = new Uint8Array(N);
    for (const c of T.cross) {
      const il = Math.round(c.lo), iu = Math.round(c.up), ox = T.px[il], oz = T.pz[il], nlx = T.nx[il], nlz = T.nz[il], tlx = T.tx[il], tlz = T.tz[il];
      const A = Math.min(T.bl[il], T.br[il]) - 0.06, uOf = (x, z) => (x - ox) * nlx + (z - oz) * nlz, tOf = (x, z) => (x - ox) * tlx + (z - oz) * tlz;
      const yL = (t) => { const f = clamp(il + t / T.ds, 0, N - 1.001), i0 = Math.floor(f); return T.hy[i0] + (T.hy[i0 + 1] - T.hy[i0]) * (f - i0); };
      const fp = (p, side, e, y) => { const i = clamp(Math.floor(p), 0, N - 2), f = p - i, j = i + 1, b = side > 0 ? T.br : T.bl, o = side * (lerp(b[i], b[j], f) + e);
        return [lerp(T.px[i], T.px[j], f) + lerp(T.nx[i], T.nx[j], f) * o, lerp(T.hy[i], T.hy[j], f) + y, lerp(T.pz[i], T.pz[j], f) + lerp(T.nz[i], T.nz[j], f) * o]; };
      const uAt = (p) => { const i = clamp(Math.floor(p), 0, N - 2), f = p - i; return uOf(lerp(T.px[i], T.px[i + 1], f), lerp(T.pz[i], T.pz[i + 1], f)); };   // (the upper road's centre line across the lower road)
      const cut = (u0) => { let a = c.up - 20 / T.ds, b = c.up + 20 / T.ds; if ((uAt(a) - u0) * (uAt(b) - u0) > 0) return -1;   // (where the upper road's centre line crosses u0)
        for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if ((uAt(a) - u0) * (uAt(m) - u0) <= 0) b = m; else a = m; } return (a + b) / 2; };
      const pA = cut(uAt(c.up - 1) < uAt(c.up + 1) ? -A : A), pB = cut(uAt(c.up - 1) < uAt(c.up + 1) ? A : -A); if (pA < 0 || pB < 0 || A < 3) continue;
      let dyMin = 1e9; for (const side of [-1, 1]) { const q = fp((pA + pB) / 2, side, 0.42, -0.08); dyMin = Math.min(dyMin, q[1] - yL(tOf(q[0], q[2]))); }
      const hc = Math.min(9.5, dyMin - 1.0), hs = Math.min(3.2, hc - 1.5); if (hc - hs < 1) continue;
      const rr = (A * A + (hc - hs) * (hc - hs)) / (2 * (hc - hs)), yc = hc - rr, arch = (u) => { u = clamp(u, -A, A); return yc + Math.sqrt(Math.max(0, rr * rr - u * u)); };
      const ret = (i, side) => { const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.45); return caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) - T.hy[i] < -2.6; };
      const K = { c, A, hs, hc, arch, yL, uOf, tOf, fp, pA, pB, z: [] }, ts = [pA, pB].flatMap(p => [-1, 1].map(sd => { const q = fp(p, sd, 0.42, 0); return tOf(q[0], q[2]); }));
      K.t0 = Math.min(...ts); K.t1 = Math.max(...ts); K.s0 = il * T.ds + K.t0; K.s1 = il * T.ds + K.t1;
      for (let i = Math.max(0, Math.floor(Math.min(pA, pB)) - 3); i <= Math.min(N - 1, Math.ceil(Math.max(pA, pB)) + 3); i++) fadeI[i] = 1;   // (the deck over the lower road: it fades while the followed car drives under it)
      for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0, a = kn[si], in0 = Math.floor(Math.min(pA, pB)), in1 = Math.ceil(Math.max(pA, pB));
        let i0 = in0, i1 = in1; for (let i = in0; i <= in1; i++) a[i] = 1;
        while (i0 > 1 && (c.up - i0) * T.ds < 60 && ret(i0 - 1, side) && !bk[si][i0 - 1]) a[--i0] = 1;
        while (i1 < N - 2 && (i1 - c.up) * T.ds < 60 && ret(i1 + 1, side) && !bk[si][i1 + 1]) a[++i1] = 1;
        K.z[si] = [i0, i1]; }
      KN.push(K);
    }
    const railNeed = () => {   // (where a rail or wall stands along each side, [left, right] per sample: the bends' outsides, the drops, the bridges; not near the ends, the pull-ins, the viewpoints)
      const need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const noRail = [new Uint8Array(N), new Uint8Array(N)];   // (the bridges: parapets along the upper road's barriers, low walls along the lower road's, none in the arch where its abutments stand)
      for (const K of KN) { const c = K.c;
        for (let i = 0; i < N; i++) { if (Math.abs(i - c.up) * T.ds < c.upZ || kn[0][i] || kn[1][i]) need[0][i] = need[1][i] = 1; if (Math.abs(i - c.lo) * T.ds < c.loZ + 24) need[0][i] = need[1][i] = 1; }
        for (let i = 0; i < N; i++) { const t = (i - Math.round(c.lo)) * T.ds; if (t > K.t0 - 0.6 && t < K.t1 + 0.6 && Math.abs(i - c.lo) * T.ds < 30) noRail[0][i] = noRail[1][i] = 1; } }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), near = (i, side) => { for (const p of pulls) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 6 && !(L.hills && ((p.x - T.px[i]) * T.nx[i] + (p.z - T.pz[i]) * T.nz[i]) * side < 0)) return true; return false; };   // (L.hills: the wall across the road from a pull-in goes on)
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || near(i, side)) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < (L.hills ? 14 : 12)) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        const nearV = (i) => { const o = side * (bar[i] + 0.12), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; for (const p of pulls) if (p.view && Math.hypot(x - p.x, z - p.z) < p.r - 0.3) return true; return false; };
        for (let i = 0; i < N; i++) if (noRail[side > 0 ? 1 : 0][i] || (L.view && nearV(i))) nd[i] = 0;   // (L.view: the viewpoints' plots open to the road, their gaps not closed)
      }
      return need; };
    const RN = L.hills ? railNeed() : null;   // (L.hills: known here already, the verge without its ditch where no rail stands, the hills' soft limits there)
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (bk[side > 0 ? 1 : 0][i] || kn[side > 0 ? 1 : 0][i]) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, -0.08], [bar + 0.42, -0.08], [bar + 0.42, -0.08]];   // (a bank down to the leg below, or a bridge: the wall's coping, then the bank or the face)
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      if (RN && !RN[side > 0 ? 1 : 0][i]) return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.06), lift(bar + 0.45, -0.07), lift(bar + 1.15, -0.1), [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (L.hills: no rail, no ditch: the verge runs on at the road's level into the ground)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    const hairS = (def.curves || []).map(([d]) => sStart + d);
    let wallG = null, wallMat = null;   // (the walls' masonry: one mesh, finished after the stone parapets where there are any)
    const FB = KN.length ? { gr: new GB(true), gl: new GB(), gs: new GB(true), gv: new GB(true), gw: new GB(true) } : null;   // (the bridges' deck, verges, masonry and parapets: their own meshes, they fade)
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.84 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; k *= 0.96 + 0.08 * P.n2(T.px[i] * 0.5 + o, T.pz[i] * 0.5); return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], gc = L.shoulder;
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (kn[si][i] && k === 0) { const q = 0.92 + 0.1 * rpHash(i >> 1, 45 + si); return [0.6 * q, 0.58 * q, 0.54 * q]; }   // (the bridge's paved verge)
          const wl = vp[si][i][2][1] < -2.6 || bk[si][i] || kn[si][i]; if (wl && (k === 1 || k === 2)) { const q = 0.9 + 0.14 * rpHash(i >> 1, 43 + si); return k === 1 ? [0.62 * q, 0.6 * q, 0.56 * q] : [0.47 * q, 0.45 * q, 0.42 * q]; }   // (the wall's coping, its stones)
          if (k === 4) return plGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return plCol(x, z, T.hy[i] + y, 1 / l, 0, Math.max(0, o - bar), 0).slice(); })); } return a; });
      // the retaining walls (between the legs and wherever the ground drops away under the barrier): one mesh of masonry for the whole road, the
      // stones' picture on 3.5 m along the road and up the face, a little lighter at the coping and darker and damper at the foot
      const gW = new GB(true), wMat2 = new THREE.MeshLambertMaterial({ map: plWallTex(), vertexColors: true }); out.ownTex.push(wMat2.map);
      const wallQ = (i, j, ti, bi, tj, bj, side, gq) => { const si = side > 0 ? 1 : 0, s0 = i * T.ds / 3.5, s1 = j * T.ds / 3.5, a = Pt(i, side * ti[0], ti[1]), b = Pt(i, side * bi[0], bi[1]), c = Pt(j, side * bj[0], bj[1]), d = Pt(j, side * tj[0], tj[1]);
        const q = (k) => 0.92 + 0.12 * rpHash(k >> 2, 47 + si), top = [1.38 * q(i), 1.36 * q(i), 1.32 * q(i)], foot = [1.05 * q(i), 1.04 * q(i), 1.0 * q(i)], topj = [1.38 * q(j), 1.36 * q(j), 1.32 * q(j)], footj = [1.05 * q(j), 1.04 * q(j), 1.0 * q(j)];
        (gq || gW).quadO(a, b, c, d, null, Pt(i, side * (ti[0] - 3), (ti[1] + bi[1]) / 2), [[s0, a[1] / 3.5], [s0, b[1] / 3.5], [s1, c[1] / 3.5], [s1, d[1] / 3.5]], [top, foot, footj, topj]); };
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      const solid = (s) => hairS.some(h => Math.abs(s - h) < L.solidNear) || s < sStart + 20 || s > sFin - 10;
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr0 = new GB(true), gl0 = new GB(), gs0 = new GB(true), gv0 = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const fb = FB && fadeI[i], gr = fb ? FB.gr : gr0, gl = fb ? FB.gl : gl0, gs = fb ? FB.gs : gs0, gv = fb ? FB.gv : gv0;
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const [o0, o1] of [[-(w - 0.3), -(w - 0.45)], [w - 0.45, w - 0.3]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          { const sm = (i + 0.5) * T.ds, ph = ((sm % (L.dash[0] + L.dash[1])) + (L.dash[0] + L.dash[1])) % (L.dash[0] + L.dash[1]);
            if (solid(sm) || ph < L.dash[0]) gl.quadUp(Pt(i, -0.07, 0.036), Pt(i, 0.07, 0.036), Pt(j, 0.07, 0.036), Pt(j, -0.07, 0.036), [L.centre, L.centre, L.centre, L.centre]); }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6) && !bk[si][i] && !bk[si][j] && !kn[si][i] && !kn[si][j]) wallQ(i, j, qi[1], qi[2], qj[1], qj[2], side);   // (the wall's face: out, towards the slope below)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
            const bi = bk[si][i], bj = bk[si][j];
            if (bi || bj) { const pe = (k, d) => { const o = (side > 0 ? T.br[k] : T.bl[k]) + 0.42; return [[o, -0.08], [o - 0.05 * d, d]]; }, pi = bi ? bi.p : pe(i, bj.p[1][1]), pj = bj ? bj.p : pe(j, bi.p[1][1]); wallQ(i, j, pi[0], pi[1], pj[0], pj[1], side); }   // (a wall down to the leg below; at its ends down to that depth too)
            if ((bi && bi.bank) || (bj && bj.bank)) {   // (the bank under a low wall: rock and scrub, darker at its toe; at its ends the same shape from this barrier)
              const bOf = (b, k, ob) => { if (b) return b.bank || [b.p[1], b.p[1]]; const o = (side > 0 ? T.br[k] : T.bl[k]) + 0.42, d = o - ob.p[0][0]; return [[ob.bank[0][0] + d, ob.bank[0][1]], [ob.bank[1][0] + d, ob.bank[1][1]]]; };
              // three rows down the bank (its top, a ledge of rock or a clump of scrub a little out from the straight line, its toe), in patches
              // of grey limestone and dark scrub along it (~6-12 m), darker towards the toe
              const ba = bOf(bi, i, bj), bb = bOf(bj, j, bi), rc = L.rockCols, sh = L.shrub, P3 = (k, e) => { const t = e[0], f = e[1], h = 0.45 + 0.12 * (rpHash(k >> 2, 65 + si) - 0.5);
                return [t, [lerp(t[0], f[0], h) + (0.5 + 1.1 * (P.n2(k * T.ds / 7, si * 9.1) - 0.5)) * 0.6, lerp(t[1], f[1], h)], f]; };
              const bc = (k, r) => { const z = sstep(0.6, 0.76, P.n2(k * T.ds / 9, 3.3 + si * 5.7)), w = P.n2(k * T.ds / 5, 7.7 + si * 3.1), g = [0, 1, 2].map(c => lerp(rc[0][c], rc[3][c], w)), m = lerp(0.2, 0.92, 1 - z) * (r === 1 ? 1 : 0.85), dk = [0.94, 0.86, 0.7][r] * (0.92 + 0.12 * rpHash(k >> 1, 63 + si));
                return [lerp(g[0], sh[0], m) * dk, lerp(g[1], sh[1], m) * dk, lerp(g[2], sh[2], m) * dk]; };
              const pa = P3(i, ba), pb = P3(j, bb), u0 = i * T.ds / 4, u1 = j * T.ds / 4;
              for (let r = 0; r < 2; r++) { const a = Pt(i, side * pa[r][0], pa[r][1]), b = Pt(i, side * pa[r + 1][0], pa[r + 1][1]), c = Pt(j, side * pb[r + 1][0], pb[r + 1][1]), d = Pt(j, side * pb[r][0], pb[r][1]);
                gv.quadUp(a, b, c, d, [bc(i, r), bc(i, r + 1), bc(j, r + 1), bc(j, r)], [[u0, a[1] / 4], [u0, b[1] / 4], [u1, c[1] / 4], [u1, d[1] / 4]]); } }
          }
        }
        addM(gr0, aMat); addM(gl0, lMat); addM(gs0, sMat); addM(gv0, gMat);
      }
      // the bridges (KN): the face walls under the upper road's verges (to the arch, with a ring of lighter dressed stones round it, and either side of it to
      // the ground; at the ends on to the verge's ditch), the arch's barrel, darker, and its abutments at the lower road's barriers
      for (const K of KN) {
        const { A, hs, arch, yL, uOf, tOf, fp, pA, pB } = K, ring = 0.7, M = Math.max(8, Math.ceil((pB - pA) * T.ds / 0.7));
        const shade = (k, f) => { const q = 0.92 + 0.12 * rpHash(k, 49); return [lerp(1.05, 1.38, f) * q, lerp(1.04, 1.36, f) * q, lerp(1.0, 1.32, f) * q]; }, ringC = [1.56, 1.52, 1.43], barC = [0.86, 0.85, 0.82];
        const inArch = (p) => p >= pA - 1e-6 && p <= pB + 1e-6;
        const bot = (q, a) => a ? yL(tOf(q[0], q[2])) + arch(uOf(q[0], q[2])) : caGround(q[0], q[2]) - 0.6;
        const face = (side, p0, p1, a) => {   // one stretch of a face wall: from the deck's edge down to the arch or the ground
          const t0 = fp(p0, side, 0.42, -0.08), t1 = fp(p1, side, 0.42, -0.08), b0 = [t0[0], bot(t0, a), t0[2]], b1 = [t1[0], bot(t1, a), t1[2]], s0 = p0 * T.ds / 3.5, s1 = p1 * T.ds / 3.5;
          const ins = fp((p0 + p1) / 2, side, 0.42 - 3, -2), k = Math.floor(p0), gq = fadeI[Math.floor((p0 + p1) / 2)] ? FB.gw : gW;
          const q = (A0, B0, B1, A1, c0, c1) => gq.quadO(A0, B0, B1, A1, null, ins, [[s0, A0[1] / 3.5], [s0, B0[1] / 3.5], [s1, B1[1] / 3.5], [s1, A1[1] / 3.5]], [c0, c1, c1, c0]);
          if (!a) { q(t0, b0, b1, t1, shade(k, 1), shade(k, 0)); return; }
          const r0 = [b0[0], Math.min(b0[1] + ring, t0[1] - 0.12), b0[2]], r1 = [b1[0], Math.min(b1[1] + ring, t1[1] - 0.12), b1[2]];
          q(r0, b0, b1, r1, ringC, ringC); q(t0, r0, r1, t1, shade(k, 1), shade(k, 0.3)); };
        const ps = []; for (const [i0, i1] of K.z) for (let i = i0; i <= i1; i++) ps.push(i);
        for (let m = 0; m <= M; m++) ps.push(pA + (pB - pA) * m / M);
        const P = [...new Set(ps.map(p => Math.round(p * 1e4) / 1e4))].sort((a, b) => a - b);
        for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0, [i0, i1] = K.z[si];
          for (let k = 0; k + 1 < P.length; k++) { const p0 = P[k], p1 = P[k + 1]; if (p0 < i0 - 1e-6 || p1 > i1 + 1e-6) continue; face(side, p0, p1, inArch(p0) && inArch(p1)); }
          for (const [i, j] of [[i0, i0 - 1], [i1, i1 + 1]]) { if (j < 0 || j >= N) continue;   // (the ends: on to the next sample's verge, its ditch or its own retaining wall)
            const bar = side > 0 ? T.br[i] : T.bl[i], q = vp[si][j], gj = (o) => caGround(T.px[j] + T.nx[j] * side * o, T.pz[j] + T.nz[j] * side * o) - T.hy[j], fq = fp(i, side, 0.42, 0), gi = caGround(fq[0], fq[2]) - T.hy[i];
            const wl = q[2][1] < -2.6; wallQ(i, j, [bar + 0.42, -0.08], [bar + 0.42, gi - 0.6], wl ? q[1] : q[2], wl ? q[2] : [q[2][0], gj(q[2][0]) - 0.6], side, fadeI[i] && fadeI[j] ? FB.gw : null); } }
        for (let k = 0; k + 1 < P.length; k++) { const p0 = P[k], p1 = P[k + 1]; if (!(inArch(p0) && inArch(p1))) continue;   // the barrel: from face to face, facing down
          const a = fp(p0, -1, 0.42, 0), b = fp(p0, 1, 0.42, 0), c = fp(p1, 1, 0.42, 0), d = fp(p1, -1, 0.42, 0); for (const v of [a, b, c, d]) v[1] = bot(v, true);
          const uv = (v) => [tOf(v[0], v[2]) / 3.5, uOf(v[0], v[2]) / 3.5], up = [(a[0] + c[0]) / 2, Math.max(a[1], c[1]) + 3, (a[2] + c[2]) / 2];
          FB.gw.quadO(a, b, c, d, null, up, [uv(a), uv(b), uv(c), uv(d)], [barC, barC, barC, barC]); }
        for (const p of [pA, pB]) {   // the abutments: from the ground to the springing, facing the lower road
          const a0 = fp(p, -1, 0.42, 0), b0 = fp(p, 1, 0.42, 0), ya = yL(tOf(a0[0], a0[2])), yb = yL(tOf(b0[0], b0[2]));
          const a = [a0[0], ya - 0.4, a0[2]], b = [b0[0], yb - 0.4, b0[2]], c = [b0[0], yb + hs, b0[2]], d = [a0[0], ya + hs, a0[2]], mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2, sg = Math.sign(uOf(mx, mz)) || 1;
          const uv = (v) => [tOf(v[0], v[2]) / 3.5, v[1] / 3.5];
          FB.gw.quadO(a, b, c, d, null, [mx + sg * 3 * T.nx[Math.round(K.c.lo)], (ya + yb) / 2 + 1, mz + sg * 3 * T.nz[Math.round(K.c.lo)]], [uv(a), uv(b), uv(c), uv(d)], [shade(1, 0), shade(1, 0), shade(1, 0.5), shade(1, 0.5)]); }
      }
      wallMat = wMat2; if (L.rail === 'stone') wallG = gW; else addM(gW, wMat2);
      // chequered start and finish lines, a white line at each checkpoint
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = L.fans;
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: inLake, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, Wd, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = Wd / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const cell = (k) => { const u0 = (k % 8) / 8, v1 = 1 - Math.floor(k / 8) / 8; return [v1 - 1 / 8, v1, u0, u0 + 1 / 8]; };   // a small sign of the second atlas
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol); hold(x - nx * L1, z - nz * L1, 0.3); hold(x + nx * L2, z + nz * L2, 0.3);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const signPost = (s, side, extra, k, Wd, H, tall) => {   // a sign of the second atlas on a steel post beside the road, facing the cars coming up
      const [px, pz, ii] = onSide(s, side, extra); if (excluded(px, pz)) return null; const py = caGround(px, pz), g = scen.get(px, pz), c = cell(k); hold(px, pz, 0.1);
      box(g, px, py - 0.2, pz, 0.08, (tall || 2.1) + 0.2, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
      bannerQ(px, py + (tall || 2.1) - H * 0.4, pz, -T.tx[ii], -T.tz[ii], Wd, H, c[0], c[1], c[2], c[3], ban2); exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); return [px, py, pz, ii];
    };
    const carCols = L.cars;
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the buildings (OpenStreetMap's footprints, generic: no names or signs): the huts of stone and timber under steep metal roofs, the big houses
       (a hut's two storeys), the stalls and sheds (timber, a tarp or a low roof) ---- */
    let nBld = 0;
    {
      const RB = rng(L.seed + 21), stone = [[0.58, 0.56, 0.52], [0.52, 0.5, 0.47], [0.62, 0.6, 0.56]], wood = [[0.46, 0.32, 0.2], [0.4, 0.28, 0.18], [0.54, 0.4, 0.26]], tarps = [[0.2, 0.34, 0.6], [0.7, 0.16, 0.14], [0.86, 0.86, 0.84], [0.22, 0.46, 0.3]];
      const PLASTER = [[0.88, 0.85, 0.77], [0.9, 0.9, 0.87], [0.85, 0.75, 0.58], [0.8, 0.64, 0.52], [0.7, 0.7, 0.68], [0.54, 0.4, 0.27]], GLASS = [0.15, 0.19, 0.23], BALC = [[0.74, 0.73, 0.7], [0.3, 0.26, 0.22]];   // (L.hotels: the walls' plaster, a few of timber; the windows; the balconies' slabs and rails)
      for (const b of blds) {
        const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = caGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); }
        if (L.hotels && b.kind !== 1) {   // (L.hotels, Gudauri's) the hotels and the apartment blocks (a big house: 3-6 storeys, or as many as OpenStreetMap's height
          // gives), the guesthouses (2-3): plastered walls over a stone plinth, a dark band of windows along each storey (beyond ~220 m none), balconies
          // along the long sides of the big ones, a low roof of coloured metal
          const big = b.kind === 2, FL = 3, nF = b.h > 0 ? clamp(Math.round(b.h / FL), 2, 8) : big ? 3 + Math.floor(RB() * 4) : 2 + (RB() < 0.35 ? 1 : 0);
          const wl = vary(PLASTER[Math.floor(RB() * PLASTER.length)], RB, 0.05), rf = vary(L.roofs[Math.floor(RB() * L.roofs.length)], RB, 0.08), y0 = hi + 0.5, det = vrDist(b.x, b.z) < 220;
          box(g, b.x, lo - 0.4, b.z, b.L + 0.3, y0 - lo + 0.4, b.W + 0.3, b.ang, vary(stone[nBld % 3], RB, 0.08), null, true);   // the plinth
          box(g, b.x, y0, b.z, b.L, nF * FL, b.W, b.ang, wl, null, true);   // the storeys
          if (det) for (let f = 0; f < nF; f++) { const wy = y0 + f * FL + 0.9;
            for (const sd of [-1, 1]) { const v = sd * (b.W / 2 + 0.03);
              box(g, b.x - s * v, wy, b.z + c * v, b.L - 1.6, 1.3, 0.06, b.ang, GLASS, null, true);   // (the windows)
              if (big && f > 0) { const v1 = sd * (b.W / 2 + 0.6), v2 = sd * (b.W / 2 + 1.17);   // (a balcony: its slab and its rail)
                box(g, b.x - s * v1, wy - 0.95, b.z + c * v1, b.L - 1.2, 0.18, 1.2, b.ang, BALC[0]);
                box(g, b.x - s * v2, wy - 0.77, b.z + c * v2, b.L - 1.2, 0.95, 0.05, b.ang, BALC[1], null, true); } }
            if (b.W > 7) for (const sd of [-1, 1]) { const u = sd * (b.L / 2 + 0.03); box(g, b.x + c * u, wy, b.z + s * u, 0.06, 1.3, b.W - 2.4, b.ang, GLASS, null, true); }
          }
          gable(g, b.x, y0 + nF * FL, b.z, b.L + 1.0, b.W + 1.0, Math.min(b.W, 18) * 0.3, b.ang, rf, wl);
        } else if (b.kind === 1) {   // a stall: timber walls, a tarp roof
          box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 2.5, b.W, b.ang, vary(wood[nBld % 3], RB, 0.1), null, true);
          gable(g, b.x, hi + 2.2, b.z, b.L + 0.5, b.W + 0.6, 0.5, b.ang, vary(tarps[Math.floor(RB() * tarps.length)], RB, 0.08), vary(wood[0], RB, 0.1));
        } else {
          const H1 = b.kind === 2 ? 6.2 : 3.2, st = vary(stone[nBld % 3], RB, 0.08), wd = vary(wood[nBld % 3], RB, 0.1), rf = vary(L.roofs[Math.floor(RB() * L.roofs.length)], RB, 0.08);
          box(g, b.x, lo - 0.4, b.z, b.L, hi - lo + 0.4 + H1 * 0.45, b.W, b.ang, st, null, true);
          box(g, b.x, hi + H1 * 0.45 - 0.02, b.z, b.L, H1 * 0.55, b.W, b.ang, wd, null, true);
          for (const f of [-1, 1]) for (let q = -1; q <= 1; q++) { if (b.L < 7 && q) continue; const u = q * b.L * 0.28, v = f * (b.W / 2 + 0.03);   // (windows on the long sides)
            box(g, b.x + c * u - s * v, hi + H1 * 0.55, b.z + s * u + c * v, 1.0, 0.9, 0.06, b.ang, [0.14, 0.17, 0.2]); }
          gable(g, b.x, hi + H1, b.z, b.L + 0.8, b.W + 0.8, Math.min(b.W, 12) * 0.42, b.ang, rf, wd);
        }
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++;
      }
      // the closed hotel at a hairpin (def.hotel [x, z, length, width, angle], Furka's: between the legs of the fifth hairpin, the road round
      // it on three sides; smaller than its footprint in OpenStreetMap, 49 x 11 m, to fit between the game's wider road, whose barriers close
      // in to its walls there, def.narrow): three storeys of plastered walls on a stone plinth, the windows' frames round closed shutters, a
      // mansard roof of slate with its dormers and chimneys; its shape only, no name or lettering
      if (def.hotel) {
        const [x, z, Lh, Wh, a] = def.hotel, g = scen.get(x, z), c = Math.cos(a), s = Math.sin(a), P = (u, v) => [x + c * u - s * v, z + s * u + c * v], RH = rng(L.seed + 23);
        let lo = 1e9; for (const [u, v] of [[-Lh / 2, -Wh / 2], [Lh / 2, -Wh / 2], [Lh / 2, Wh / 2], [-Lh / 2, Wh / 2], [0, 0]]) lo = Math.min(lo, caGround(...P(u, v)));
        const plinth = [0.56, 0.55, 0.52], wall = [0.92, 0.86, 0.7], frame = [0.92, 0.91, 0.87], shut = [0.3, 0.37, 0.31], slate = [0.25, 0.26, 0.29], zinc = [0.42, 0.43, 0.45];
        const FL = 3.2, H0 = 1.3, top = lo + H0 + 3 * FL, nW = Math.max(2, Math.round((Lh - 4.4) / 3.2)), du = (Lh - 4.4) / nW;
        box(g, x, lo - 1.5, z, Lh + 0.3, H0 + 1.5, Wh + 0.3, a, plinth, null, true);
        box(g, x, lo + H0, z, Lh, 3 * FL, Wh, a, wall, null, true);
        box(g, x, top - 0.1, z, Lh + 0.4, 0.3, Wh + 0.4, a, frame, frame, true);   // (the cornice)
        for (let f = 0; f < 3; f++) { const wy = lo + H0 + f * FL + 0.75;
          for (const sd of [-1, 1]) {
            for (let k = 0; k <= nW; k++) { const u = -Lh / 2 + 2.2 + k * du, [fx, fz] = P(u, sd * (Wh / 2 + 0.03)), [sx, sz] = P(u, sd * (Wh / 2 + 0.07));
              box(g, fx, wy - 0.12, fz, 1.3, 1.95, 0.06, a, frame, null, true); box(g, sx, wy, sz, 1.0, 1.7, 0.05, a, vary(shut, RH, 0.06), null, true); }
            for (const v of [-Wh / 4, Wh / 4]) { const [fx, fz] = P(sd * (Lh / 2 + 0.03), v), [sx, sz] = P(sd * (Lh / 2 + 0.07), v);
              box(g, fx, wy - 0.12, fz, 0.06, 1.95, 1.3, a, frame, null, true); box(g, sx, wy, sz, 0.05, 1.7, 1.0, a, vary(shut, RH, 0.06), null, true); } } }
        const ring = (yy, e) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([p, q]) => { const [rx, rz] = P(p * (Lh / 2 + e), q * (Wh / 2 + e)); return [rx, yy, rz]; });
        const r0 = ring(top + 0.2, 0.35), r1 = ring(top + 2.9, -0.75), inn = [x, top, z];
        for (let k = 0; k < 4; k++) g.quadO(r0[k], r0[(k + 1) % 4], r1[(k + 1) % 4], r1[k], k % 2 ? vary(slate, RH, 0.04) : slate, inn);   // (the mansard's steep slopes)
        g.quadO(r1[0], r1[1], r1[2], r1[3], zinc, [x, top, z]);   // (its low top, sheeted)
        for (const sd of [-1, 1]) for (let k = 0; k < nW; k += 2) { const u = -Lh / 2 + 2.2 + (k + 0.5) * du, [dx, dz] = P(u, sd * (Wh / 2 - 0.45)), [wx, wz] = P(u, sd * (Wh / 2 + 0.17));   // the dormers
          box(g, dx, top + 0.5, dz, 1.4, 1.5, 1.2, a, wall, null, true); gable(g, dx, top + 2.0, dz, 1.4, 1.7, 0.7, a + Math.PI / 2, slate, wall); box(g, wx, top + 0.75, wz, 0.9, 1.0, 0.05, a, vary(shut, RH, 0.06), null, true); }
        for (const u of [-Lh * 0.3, 0, Lh * 0.3]) { const [hx, hz] = P(u, (RH() - 0.5) * Wh * 0.3); box(g, hx, top + 2.4, hz, 0.9, 1.7, 0.6, a, [0.62, 0.56, 0.5], [0.16, 0.15, 0.15]); }   // (the chimneys)
        CR.block(x, z, Lh + 1, Wh + 1, a); nBld++; out.marks.hotel = [x, top + 3, z];
      }
      // the old milestone by the road (def.milestone [s after the start, side]: Furka's, of granite from the 19th century): a stone a metre high
      // with a rounded top, just past the barrier
      if (def.milestone) { const [mx, mz, mi] = onSide(T.startS + def.milestone[0], def.milestone[1], 0.7), my = caGround(mx, mz), g = scen.get(mx, mz), gr = [0.7, 0.69, 0.66]; hold(mx, mz, 0.4);
        box(g, mx, my - 0.3, mz, 0.5, 1.2, 0.36, T.hd[mi], gr, [0.76, 0.75, 0.72]); box(g, mx, my + 0.9, mz, 0.4, 0.14, 0.3, T.hd[mi], gr, [0.78, 0.77, 0.74]); exclPush(mx, mz, 1.2); CR.avoid(mx, mz, 0.8); out.marks.milestone = [mx, my, mz]; }
      // a viewpoint past the barrier (def.lookout [s after the start, side]: Furka's, over the glacier's valley): a bench and a coin telescope on a
      // gravel plot, facing out from the road
      if (def.lookout) { const s0 = T.startS + def.lookout[0], sd = def.lookout[1], [bx, bz, bi] = onSide(s0, sd, 1.6), [tx, tz] = onSide(s0 + 3.2, sd, 1.4), by = caGround(bx, bz), ty = caGround(tx, tz), g = scen.get(bx, bz), h = T.hd[bi], nx = T.nx[bi] * sd, nz = T.nz[bi] * sd;
        box(g, (bx + tx) / 2, Math.min(by, ty) - 0.3, (bz + tz) / 2, 6.0, 0.36, 2.6, h, [0.6, 0.58, 0.53], null, true);   // (the plot)
        box(g, bx, by + 0.42, bz, 1.8, 0.08, 0.45, h, [0.5, 0.36, 0.22]); box(g, bx - nx * 0.22, by + 0.5, bz - nz * 0.22, 1.8, 0.45, 0.07, h, [0.5, 0.36, 0.22]);   // (the bench: seat and back)
        for (const o of [-0.75, 0.75]) box(g, bx + T.tx[bi] * o, by, bz + T.tz[bi] * o, 0.08, 0.45, 0.4, h, [0.24, 0.25, 0.27]);
        cyl(g, tx, ty - 0.1, tz, 0.07, 1.3, 6, [0.24, 0.3, 0.26]); box(g, tx + nx * 0.1, ty + 1.2, tz + nz * 0.1, 0.32, 0.3, 0.62, h, [0.24, 0.3, 0.26]);   // (the telescope)
        exclPush((bx + tx) / 2, (bz + tz) / 2, 4); CR.avoid(bx, bz, 1.5); out.marks.lookout = [bx, by, bz]; }
    }

    /* ---- START: gantry with the start lights, the timing hut, pennants along the grid, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz); hold(hx, hz, 2.2);   // the timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.62, 0.44, 0.28], [0.4, 0.28, 0.18], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.1, T.hd[i], [0.3, 0.32, 0.3], [0.62, 0.44, 0.28]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const pc = [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.14, 0.26, 0.6], [0.95, 0.72, 0.16]];
      for (let s = 8, k = 0; s < sStart + 50; s += 12, k++) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3); if (excluded(px, pz) && s > sStart - 8) continue; hold(px, pz, 0.1);   // pennants on poles
        const g = scen.get(px, pz), py = caGround(px, pz); cyl(g, px, py - 0.2, pz, 0.05, 5.2, 5, [0.9, 0.9, 0.92]);
        const tri = (yy, c) => { const a = [px, py + yy, pz], b = [px, py + yy - 1.0, pz], cc = [px + T.tx[ii] * 1.6, py + yy - 0.5, pz + T.tz[ii] * 1.6]; g.triO(a, b, cc, c, [px - T.nx[ii], py + yy, pz - T.nz[ii]]); g.triO(a, cc, b, c, [px + T.nx[ii], py + yy, pz + T.nz[ii]]); };
        tri(4.9, pc[(k + (side > 0 ? 1 : 0)) % 4]); }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road below: concrete barriers across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) { box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]); hold(bx + T.tx[bi] * o, bz + T.tz[bi] * o, 0.1); }
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }

    /* ---- the checkpoints: a blue gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.14, 0.27, 0.43]));

    /* ---- FINISH: chequered gantry and flags, the pass's board, the car park with cars, people about; the end of the road (the tunnel's portal, def.portal,
       or concrete barriers) ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4); if (excluded(px, pz) && Math.abs(s - sFin) > 8) continue; hold(px, pz, 0.15); const py = caGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 14, -sdP, 2.4), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the board: timber on posts leaning back, on a stone plinth
      if (!excluded(sx, sz)) {
        for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; hold(px, pz, 0.6); box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.36, 0.24, 0.14]); }
        box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.58, 0.56, 0.52], [0.64, 0.62, 0.58]);
        { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
        exclPush(sx, sz, 5); }
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh), RC = rng(L.seed + 41);
      for (let k = 0; k < 10; k++) { const a = -14 + (k % 5) * 7, b = (k < 5 ? -4.5 : 4.5), px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || inLake(px, pz)) continue;
        if (k !== 4) { hold(px, pz, 2.3); } if (k !== 4) caCar(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[Math.floor(RC() * carCols.length)], R, 0.15)); }
      for (let k = 0; k < 16; k++) { const px = padF.x + (R() - 0.5) * 26, pz = padF.z + (R() - 0.5) * 26; if (vrNear(px, pz).dd < 1 || inLake(px, pz)) continue; person(px, pz, R() * TAU); }
      if (L.view) for (const p of pulls) { if (p === padF) continue;   // the viewpoints (L.view, Kotor's): the low dry-stone wall round the plot's far edge, a few cars
        // parked nose to it, people at it looking out over the view (the plot's far half: the road's barrier is left open to it)
        const i = p.i, dx = p.x - T.px[i], dz = p.z - T.pz[i], dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl, tx = -uz, tz = ux, RV = rng(L.seed + 71 + i);
        const g = scen.get(p.x, p.z), st = L.rockCols, n = Math.max(10, Math.round(p.r * 3));
        for (let k = 0; k <= n; k++) { const a = (k / n - 0.5) * 4.1, ca = Math.cos(a), sa = Math.sin(a), wx = ux * ca + tx * sa, wz = uz * ca + tz * sa, r = p.r - 0.3, px = p.x + wx * r, pz = p.z + wz * r;
          if (vrNear(px, pz).dd < 0.8) continue; const c = st[Math.floor(RV() * st.length)];
          box(g, px, caGround(px, pz) - 0.1, pz, 0.55, 0.95 + RV() * 0.1, r * 4.1 / n + 0.12, Math.atan2(wz, wx), [c[0] * 0.92, c[1] * 0.92, c[2] * 0.92], [c[0] * 1.05, c[1] * 1.05, c[2] * 1.05]); }
        for (let k = 0; k < 3; k++) { const a = (k - 1) * 0.42, ca = Math.cos(a), sa = Math.sin(a), wx = ux * ca + tx * sa, wz = uz * ca + tz * sa, px = p.x + wx * (p.r - 3.0), pz = p.z + wz * (p.r - 3.0);
          if (RV() < 0.25 || vrNear(px, pz).dd < 1.6) continue; hold(px, pz, 2.3); caCar(scen.get(px, pz), px, caGround(px, pz), pz, Math.atan2(wz, wx), vary(carCols[Math.floor(RV() * carCols.length)], R, 0.15)); }
        for (let k = 0; k < 4; k++) { const a = (RV() - 0.5) * 1.8, ca = Math.cos(a), sa = Math.sin(a), wx = ux * ca + tx * sa, wz = uz * ca + tz * sa, px = p.x + wx * (p.r - 1.1), pz = p.z + wz * (p.r - 1.1);
          if (vrNear(px, pz).dd < 1) continue; person(px, pz, Math.atan2(-wx, wz) + (RV() - 0.5) * 0.6); } }
      const eX = T.px[iE] + T.tx[iE] * 1.0, eZ = T.pz[iE] + T.tz[iE] * 1.0, eY = T.hy[iE];
      if (L.portal === 2) {   // (Gudauri's) the avalanche gallery over the road beyond: a concrete roof on a solid wall up the slope and a row of square pillars on
        // the valley side, dark in under it, earth heaped on its roof against the slides and grassed over, the portal's lintel across the road
        const g = scen.get(eX, eZ), hd = T.hd[iE], tx = T.tx[iE], tz = T.tz[iE], nx = T.nx[iE], nz = T.nz[iE], con = [0.68, 0.67, 0.64], con2 = [0.6, 0.59, 0.56], dk = [0.05, 0.05, 0.055];
        const up = caGround(eX + nx * (w + 12), eZ + nz * (w + 12)) > caGround(eX - nx * (w + 12), eZ - nz * (w + 12)) ? 1 : -1, Lg = 40, Hg = 6.4, hw = w + 1.4, at = (u, v) => [eX + tx * u + nx * v, eZ + tz * u + nz * v];
        { const [cx, cz] = at(Lg / 2, 0); box(g, cx, eY - 0.3, cz, Lg, Hg - 0.1, w * 2 + 0.4, hd, dk, dk); }   // the dark inside, the road going in
        { const [cx, cz] = at(Lg / 2, up * (hw + 0.5)); box(g, cx, eY - 1.5, cz, Lg, Hg + 1.5, 1.4, hd, con2); }   // the wall up the slope
        for (let u = 1.2; u < Lg; u += 4.5) { const [px, pz] = at(u, -up * (hw - 0.2)), gy = Math.min(eY, caGround(px, pz)); box(g, px, gy - 0.6, pz, 0.9, eY + Hg - gy + 0.6, 0.9, hd, con); }   // the pillars
        { const [cx, cz] = at(Lg / 2 + 0.3, 0); box(g, cx, eY + Hg - 0.2, cz, Lg + 0.6, 1.0, hw * 2 + 1.6, hd, con, con2);   // the roof, the earth on it
          box(g, cx + nx * up * 1.2, eY + Hg + 0.8, cz + nz * up * 1.2, Lg - 2, 1.4, hw * 2 - 1, hd, [0.42, 0.36, 0.28], L.grass); }
        { const [cx, cz] = at(0.2, 0); box(g, cx, eY + Hg - 1.6, cz, 1.0, 1.6, hw * 2 + 1.6, hd, con); }   // the lintel
        for (let u = 0; u <= Lg; u += 8) { const [x, z] = at(u, 0); exclPush(x, z, hw + 4); }
        out.marks.portal = [eX, eZ];
      } else if (L.portal) {   // the tunnel's portal: a concrete face across the road's end, the dark mouth of the tunnel in it, the rock of the mountain over it
        const g = scen.get(eX, eZ), hd = T.hd[iE], Wp = w * 2 + 5, Hp = 8.5, tx = T.tx[iE], tz = T.tz[iE], nx = T.nx[iE], nz = T.nz[iE], con = [0.7, 0.69, 0.66], dk = [0.03, 0.03, 0.035];
        box(g, eX + tx * 6, eY - 0.3, eZ + tz * 6, 12, 6.3, w * 2 + 0.6, hd, dk, dk);   // the mouth: a dark box going in
        for (const f of [-1, 1]) box(g, eX + nx * f * (w + 1.6) + tx * 0.5, eY - 0.6, eZ + nz * f * (w + 1.6) + tz * 0.5, 2.0, Hp + 0.6, 3.0, hd, con);   // the sides
        box(g, eX + tx * 0.5, eY + 5.6, eZ + tz * 0.5, 2.0, Hp - 5.6 + 0.4, Wp, hd, con, [0.64, 0.63, 0.6]);   // the lintel
        box(g, eX + tx * 0.6, eY + Hp, eZ + tz * 0.6, 2.4, 0.6, Wp + 0.6, hd, [0.6, 0.6, 0.58]);
        const RV = rng(L.seed + 47);
        for (let k = 0; k < 9; k++) { const a = (k / 8 - 0.5) * 2.6, d = 14 + RV() * 8, r0 = 8 + RV() * 7; rock(g, eX + tx * (d * Math.cos(a) * 0.6 + 8) + nx * d * Math.sin(a), eY + Hp + r0 * 0.25 - 2, eZ + tz * (d * Math.cos(a) * 0.6 + 8) + nz * d * Math.sin(a), r0 * 1.2, r0, r0, RV() * TAU, vary(L.rockCols[k % L.rockCols.length], RV, 0.06), RV, 0.3); }
        exclPush(eX, eZ, 16); out.marks.portal = [eX, eZ];
      } else for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, eY - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
    }

    /* ---- guardrails where the ground falls away and round the outside of the bends; chevrons on the outside of every hairpin, the bend warning and the
       hairpin's number before each (the game's numbering); the speed limit at the start ---- */
    let nRail = 0;
    {
      const need = RN || railNeed();
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), steel = [0.8, 0.82, 0.84], steelB = [0.56, 0.58, 0.6], postC = [0.5, 0.52, 0.54], stone = L.rail === 'stone' && wallG, wallG0 = wallG;
      const near = (i) => { for (const p of pulls) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 6) return true; return false; };
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        if (stone) {   // a low wall of the limestone's masonry (Sa Calobra's): the inner face, its top, the outer face down to the ground (to the wall or the bridge's face below, where one is)
          const si = side > 0 ? 1 : 0, ob = (k) => (kn[si][k] || bk[si][k] || vp[si][k][2][1] < -2.6) ? -0.06 : -0.6, q = (k) => 0.9 + 0.14 * rpHash(k >> 1, 53 + si);
          const cF = (k) => [1.12 * q(k), 1.1 * q(k), 1.04 * q(k)], cT = (k) => [1.44 * q(k), 1.4 * q(k), 1.32 * q(k)], cC = (k) => [1.6 * q(k), 1.56 * q(k), 1.47 * q(k)];
          for (let i = 0; i < N - 1; i++) {
            if (!(nd[i] && nd[i + 1])) continue; const j = i + 1, s0 = i * T.ds / 3.5, s1 = j * T.ds / 3.5, inn = Q(i, 0.2, 0.06), wallG = FB && fadeI[i] ? FB.gw : wallG0;
            const a = Q(i, -0.4, -0.18), b = Q(j, -0.4, -0.18), c = Q(j, 0.8, -0.18), d = Q(i, 0.8, -0.18), a2 = Q(i, ob(i), 0.3), b2 = Q(j, ob(j), 0.3), c2 = Q(j, 0.8, 0.3), d2 = Q(i, 0.8, 0.3);
            wallG.quadO(a, b, c, d, null, inn, [[s0, a[1] / 3.5], [s1, b[1] / 3.5], [s1, c[1] / 3.5], [s0, d[1] / 3.5]], [cF(i), cF(j), cT(j), cT(i)]);
            wallG.quadO(a2, b2, c2, d2, null, inn, [[s0, a2[1] / 3.5], [s1, b2[1] / 3.5], [s1, c2[1] / 3.5], [s0, d2[1] / 3.5]], [cF(i), cF(j), cT(j), cT(i)]);
            wallG.quadO(d, c, c2, d2, null, inn, [[s0, 0], [s1, 0], [s1, 0.14], [s0, 0.14]], [cC(i), cC(j), cC(j), cC(i)]);
            for (const [k, kk, e] of [[i, j, i === 0 || !nd[i - 1]], [j, i, j + 1 >= N || !nd[j + 1]]]) if (e) {   // (the ends of a stretch)
              const p = Q(k, -0.4, -0.18), p2 = Q(k, ob(k), 0.3), p3 = Q(k, 0.8, 0.3), p4 = Q(k, 0.8, -0.18);
              wallG.quadO(p, p2, p3, p4, null, Q(kk, 0.2, 0.06), [[0, p[1] / 3.5], [0.14, p2[1] / 3.5], [0.14, p3[1] / 3.5], [0, p4[1] / 3.5]], [cF(k), cF(k), cT(k), cT(k)]); }
          }
          continue;
        }
        for (let i = 0; i < N - 1; i++) {
          if (!(nd[i] && nd[i + 1])) continue; const g = scen.get(T.px[i], T.pz[i]);   // W-beam: a front and a back face, a steel post every 4 m
          const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
          g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
          if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.12, 1.13, 0.12, T.hd[i], postC, null, true); }
        }
      }
      if (wallG) addM(wallG, wallMat);
      if (FB) {   // the bridges' own meshes and materials: they fade while the followed car drives under (Render: dyn.tunnel; Sfx: the engine rings under the arch)
        const mA = aMat.clone(), mL = lMat.clone(), mS = sMat.clone(), mG = gMat.clone(), mW = wallMat.clone();
        addM(FB.gr, mA); addM(FB.gl, mL); addM(FB.gs, mS); addM(FB.gv, mG); addM(FB.gw, mW);
        const under = (car, m) => { const s = car && car.q ? car.q.s : -1e9; return KN.some(K => m != null ? s > K.s0 - m && s < K.s1 + m : s > K.s0 - 5 && s < K.s1 + 14); };   // (the fade: from just before the arch until the camera behind is past it; the ring: m, under it)
        out.dyn.tunnel = { mat: mW, mats: [mA, mL, mS, mG, mW], s0: Math.min(...KN.map(K => K.s0)), s1: Math.max(...KN.map(K => K.s1)), test: under };
      }
      out.propR = 150; out.propFloor = propFloorTable(null, (i, side) => { const si = side > 0 ? 1 : 0, b = bk[si][i], q = vp[si][i]; return b ? [q[0], q[1], q[2], [b.p[1][0] + 0.01, b.p[1][1]], ...(b.bank ? [b.bank[1]] : []), [b.o1, b.hl - T.hy[i] - 0.35]] : q; });   // (at a wall between the legs: down its face (and its bank) to the shelf)
      const spots = [];
      for (let i = T.idx(sStart + 30); i < T.idx(sFin - 30); i += 25) for (const side of [-1, 1]) if (!need[side > 0 ? 1 : 0][i] && !near(i)) spots.push([i, side]);   // (white delineator posts where there is no rail)
      out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
        floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sStart + 30 || s > sFin - 30; } });
    }
    (def.curves || []).forEach(([d, , turn], k) => {
      const r = signPost(sStart + d - 90, 1, 0.9, turn > 0 ? 0 : 1, 0.95, 0.85, 2.3);
      if (r && k < 24 && L.plates !== 0) { const [px, py, pz, ii] = r, c2 = cell(8 + k); bannerQ(px, py + 0.2, pz, -T.tx[ii], -T.tz[ii], 0.5, 0.5, c2[0], c2[1], c2[2], c2[3], ban2); }
      const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 6 && sStart + d <= q.i1 * T.ds + 6); if (!c || c.sev < 2) return;
      const out_ = -turn, cc = cell(turn > 0 ? 2 : 3);
      for (const o of [-14, 0, 14]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.7); if (excluded(cx, cz)) continue; hold(cx, cz, 0.1);
        const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
        box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
        bannerQ(cx, cy + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, cc[0], cc[1], cc[2], cc[3], ban2); CR.avoid(cx, cz, 0.6); }
    });
    signPost(sStart + 40, 1, 1.2, 4, 0.8, 0.8, 2.2);   // the speed limit up the pass

    /* ---- the cable car (def.cables, def.pylons: OpenStreetMap): steel pylons along the line, the two ropes sagging between them, a cabin on each, the
       stations at the ends as plain concrete blocks; the ski slopes' lifts (L.chairs, Gudauri's, by cb.k): a chair lift's lower pylons (a steel tube,
       the cross-arm with a sheave train at each end), the loop of its rope with the chairs hanging every ~24 m, a pylon at least every ~110 m (where
       OpenStreetMap has the stations only, the pylons between them evenly), its stations a hut under the bull wheel's housing; a drag lift lower
       still, without the chairs; the conveyors on the slope not drawn ---- */
    let nPyl = 0;
    const ROPE_CLEAR = 7;   // m: the ropes over the road, at least (the asphalt and 2 m past its edge)
    if ((def.cables || []).length) {
      const gp = new GB(), steel = [0.42, 0.44, 0.46], rope = [0.12, 0.12, 0.13], top = [], seat = [0.22, 0.3, 0.5], frame = [0.3, 0.31, 0.33];
      const pyl = []; for (let k = 0; k + 2 < (def.pylons || []).length; k += 3) pyl.push(def.pylons.slice(k, k + 3));
      for (const cb of def.cables) {
        const ch = !L.chairs ? 0 : cb.k === 'chair_lift' ? 1 : cb.k === 'magic_carpet' ? 3 : /drag|platter|t-bar|j-bar|rope_tow/.test(cb.k || '') ? 2 : 0;   // (1 a chair lift, 2 a drag lift, 3 a conveyor)
        if (ch === 3) continue;
        const p = cb.p, pts = [];
        for (let k = 0; k < p.length / 2; k++) { const q = [p[2 * k], p[2 * k + 1]], a = pts[pts.length - 1];
          if (ch && a) { const m = Math.ceil(Math.hypot(q[0] - a[0], q[1] - a[1]) / (ch === 1 ? 110 : 70)); for (let j = 1; j < m; j++) pts.push([lerp(a[0], q[0], j / m), lerp(a[1], q[1], j / m)]); }
          pts.push(q); }
        const n = pts.length;
        const dir = (k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
        const H = (k) => (ch ? (k === 0 || k === n - 1 ? 5 : ch === 1 ? 9 + 4 * rpHash(k, 91) : 6) : k === 0 || k === n - 1 ? 9 : 18 + 6 * rpHash(k, 91)), end = (k) => k === 0 || k === n - 1;   // (the stations' rope height, the pylons')
        const RO = ch ? 2.3 : 4.2, SG = ch ? 0.02 : 0.035;   // (the ropes' half gauge, their sag)
        for (let k = 0; k < n; k++) { const [x, z] = pts[k], [dx, dz] = dir(k); top.push([x, vrFar(x, z) + H(k), z, dx, dz]); }
        // the ropes clear the road: where a span crosses it (the asphalt and 2 m past its edge), both its ropes stay ROPE_CLEAR m above the road. Its
        // ends go up: a pylon by all of it, a station (whose rope deck rises with it) by a quarter as much, so the pylon by a station grows the most
        // (S19, docs/pregled-sveta.md: on Balea the last span hung 1-6 m over the road). A few rounds: a lifted end changes its other span too
        const ropeY = (A, B, t, span) => lerp(A[1], B[1], t) - span * SG * 4 * t * (1 - t);
        for (let it = 0, up = 1; it < 4 && up; it++) { up = 0; for (let k = 0; k + 1 < n; k++) {
          const A = top[k], B = top[k + 1]; let need = 0.05, tw = 0;
          for (const f of [-1, 1]) { const o = RO * f, ax = A[0] - A[4] * o, az = A[2] + A[3] * o, bx = B[0] - B[4] * o, bz = B[2] + B[3] * o, span = Math.hypot(bx - ax, bz - az), m = Math.ceil(span);
            for (let q = 1; q < m; q++) { const t = q / m, x = lerp(ax, bx, t), z = lerp(az, bz, t); if (vrDist(x, z) > 16) continue;
              const r = vrNear(x, z); if (r.i < 0 || r.dd > 2) continue;
              const nd = ROPE_CLEAR - (ropeY(A, B, t, span) - r.hn); if (nd > need) { need = nd; tw = t; } } }
          if (tw > 0) { const wa = end(k) ? 0.25 : 1, wb = end(k + 1) ? 0.25 : 1, s = need / ((1 - tw) * wa + tw * wb); A[1] += s * wa; B[1] += s * wb; up = 1; }
        } }
        for (let k = 0; k < n; k++) { const [x, z] = pts[k], y = vrFar(x, z), [dx, dz] = dir(k), dist = vrDist(x, z), hh = top[k][1] - y;
          if (end(k) && ch) { if (dist < 600) { const g = scen.get(x, z), a = Math.atan2(dz, dx);   // (a lift's station: the hut, the bull wheel's housing over the loop)
            box(g, x, y - 0.5, z, 6, 4.2, 5, a, [0.72, 0.71, 0.68], [0.5, 0.5, 0.5], true); box(g, x, y + 3.7, z, 8.5, 1.3, 6.2, a, [0.84, 0.82, 0.78], [0.42, 0.44, 0.47]); exclPush(x, z, 7); } continue; }
          if (end(k)) { if (dist < 600) { box(scen.get(x, z), x, y - 0.5, z, 14, hh + 0.5, 9, Math.atan2(dz, dx), [0.72, 0.71, 0.68], [0.5, 0.5, 0.5], true); exclPush(x, z, 10); } continue; }
          if (dist > 900) continue;
          const g = scen.get(x, z), a = Math.atan2(dz, dx);   // a pylon: a tapering steel mast, the cross-arm with the two rope saddles
          if (ch) { cyl(g, x, y - 0.4, z, 0.34, hh + 0.4, 6, steel, steel, 0.24); box(g, x, y + hh - 0.3, z, 0.4, 0.4, 5.2, a, steel, null, true);   // (a lift's: the tube, the cross-arm, the sheaves)
            for (const o of [-2.3, 2.3]) box(g, x - dz * o, y + hh - 0.45, z + dx * o, 2.2, 0.3, 0.3, a, [0.26, 0.27, 0.29], null, true);
            exclPush(x, z, 2); nPyl++; continue; }
          for (let q = 0; q < 4; q++) { const f0 = q / 4, f1 = (q + 1) / 4, r0 = lerp(1.6, 0.6, f0), r1 = lerp(1.6, 0.6, f1); box(g, x, y + hh * f0 - (q ? 0 : 0.5), z, r0 * 0.9 + r1 * 0.1, hh / 4 + (q ? 0 : 0.5), r0 * 0.9 + r1 * 0.1, a, steel, null, true); }
          box(g, x, y + hh, z, 0.6, 0.5, 9, a, steel, null, true); exclPush(x, z, 3); nPyl++; }
        for (const f of [-1, 1]) for (let k = 0; k + 1 < top.length; k++) {   // the ropes: ~16 segments each span, sagging
          const A = top[k], B = top[k + 1], o = RO * f, ax = A[0] - A[4] * o, az = A[2] + A[3] * o, bx = B[0] - B[4] * o, bz = B[2] + B[3] * o, span = Math.hypot(bx - ax, bz - az);
          if (Math.min(vrDist(ax, az), vrDist(bx, bz)) > 1100) continue;
          let px = ax, py = A[1], pz = az;
          for (let q = 1; q <= 16; q++) { const t = q / 16, x = lerp(ax, bx, t), z = lerp(az, bz, t), y = lerp(A[1], B[1], t) - span * SG * 4 * t * (1 - t);
            ouRod(gp, [px, py, pz], [x, y, z], 0.06, rope, 3); px = x; py = y; pz = z; }
          if (ch === 1 && Math.min(vrDist(ax, az), vrDist(bx, bz)) < 700) {   // (a chair lift's chairs: the hanger, the seat across the line, its back)
            const m = Math.max(1, Math.round(span / 24)), a = Math.atan2(bz - az, bx - ax), hx = (bx - ax) / (span || 1) * f * 0.28, hz = (bz - az) / (span || 1) * f * 0.28;
            for (let q = 0; q < m; q++) { const t = (q + 0.5) / m, x = lerp(ax, bx, t), z = lerp(az, bz, t), y = lerp(A[1], B[1], t) - span * SG * 4 * t * (1 - t), g = scen.get(x, z);
              ouRod(gp, [x, y, z], [x, y - 2.3, z], 0.035, frame, 3); box(g, x, y - 2.45, z, 0.6, 0.12, 1.9, a, seat, null); box(g, x - hx, y - 2.4, z - hz, 0.07, 0.62, 1.9, a, seat, null, true); } }
        }
        top.length = 0;
        if (!ch) { const k = Math.floor(n * 0.4), A = pts[k], B = pts[Math.min(n - 1, k + 1)], x = lerp(A[0], B[0], 0.5), z = lerp(A[1], B[1], 0.5), y = (vrFar(A[0], A[1]) + vrFar(B[0], B[1])) / 2 + 12, a = Math.atan2(B[1] - A[1], B[0] - A[0]);   // a cabin
          const g = scen.get(x, z); box(g, x, y, z, 4.2, 2.6, 2.6, a, [0.8, 0.14, 0.12], [0.86, 0.86, 0.84], true); box(g, x, y + 1.1, z, 4.25, 0.9, 2.65, a, [0.18, 0.22, 0.26], null, true); ouRod(g, [x, y + 2.6, z], [x, y + 5.6, z], 0.08, steel, 4); }
      }
      addM(gp, lMat, false);
      out.marks.cable = pyl.length ? [pyl[0][0], pyl[0][1]] : null;
    }

    /* ---- the power line along the road (def.power: OpenStreetMap's line, a pole at each of its points; def.poles: which are steel towers): wooden
       poles with a steel cross-arm and three insulators, the three wires sagging between them, high over the road where the line crosses it; a pole
       that would stand on the road or its verge moved out past the barrier (or left out: the wires span its place) ---- */
    let nPole = 0, wireD = null;   // (wireD(x, z): the distance to the line on the ground, for the trees: its cleared strip through the forest)
    if (L.power && (def.power || []).length) {
      const WC = 40, wh = new Map(), segs = [];
      for (const ln of def.power) for (let k = 0; k + 3 < ln.p.length; k += 2) { const s = [ln.p[k], ln.p[k + 1], ln.p[k + 2], ln.p[k + 3]], q = segs.push(s) - 1;
        for (let a = Math.floor((Math.min(s[0], s[2]) - 8) / WC); a <= Math.floor((Math.max(s[0], s[2]) + 8) / WC); a++) for (let b = Math.floor((Math.min(s[1], s[3]) - 8) / WC); b <= Math.floor((Math.max(s[1], s[3]) + 8) / WC); b++) {
          const key = a * 65536 + b; let Lq = wh.get(key); if (!Lq) wh.set(key, Lq = []); Lq.push(q); } }
      wireD = (x, z) => { const Lq = wh.get(Math.floor(x / WC) * 65536 + Math.floor(z / WC)); let d = 1e9; if (!Lq) return d;
        for (const q of Lq) { const [ax, az, bx, bz] = segs[q], ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez || 1, t = clamp(((x - ax) * ex + (z - az) * ez) / l2, 0, 1); d = Math.min(d, Math.hypot(x - ax - ex * t, z - az - ez * t)); }
        return d; };
      const gw = new GB(), wood = [0.4, 0.3, 0.21], steel = [0.5, 0.52, 0.54], ins = [0.74, 0.77, 0.8], wire = [0.13, 0.13, 0.14], RW = rng(L.seed + 51);
      const tow = new Set(); for (let k = 0; k + 2 < (def.poles || []).length; k += 3) if (def.poles[k + 2]) tow.add(Math.round(def.poles[k]) + ',' + Math.round(def.poles[k + 1]));
      for (const ln of def.power) {
        const p = ln.p, n = p.length / 2, top = [];
        for (let k = 0; k < n; k++) {
          let x = p[2 * k], z = p[2 * k + 1];
          const a = [p[2 * Math.max(0, k - 1)], p[2 * Math.max(0, k - 1) + 1]], b = [p[2 * Math.min(n - 1, k + 1)], p[2 * Math.min(n - 1, k + 1) + 1]], dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, dx = (b[0] - a[0]) / dl, dz = (b[1] - a[1]) / dl;
          let nn = vrNear(x, z), ok = true;
          if (nn.i >= 0 && nn.dd < 2) { const i = nn.i, sd = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] >= 0 ? 1 : -1, o = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + 3.5);
            x = T.px[i] + T.nx[i] * o; z = T.pz[i] + T.nz[i] * o; nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2) ok = false; }
          const big = tow.has(Math.round(p[2 * k]) + ',' + Math.round(p[2 * k + 1])), H = big ? 16 : 9.5 + RW() * 1.5, y = caGround(x, z);
          top.push([x, y + H - 0.3, z, dx, dz]);
          if (!ok || vrDist(x, z) > 420 || excluded(x, z)) continue;
          const g = scen.get(x, z), ang = Math.atan2(dz, dx);
          if (big) { for (let q = 0; q < 3; q++) box(g, x, y + H * q / 3 - (q ? 0 : 0.5), z, 1.4 - q * 0.35, H / 3 + (q ? 0 : 0.5), 1.4 - q * 0.35, ang, steel, null, true); }
          else cyl(g, x, y - 0.4, z, 0.14, H + 0.4, 5, wood, wood, 0.1);
          box(g, x, y + H - 0.62, z, 0.1, 0.12, 2.1, ang, steel, null, true);   // the cross-arm, across the line
          for (const o of [-0.85, 0, 0.85]) cyl(g, x - dz * o, y + H - 0.5, z + dx * o, 0.06, 0.3, 4, ins, ins, 0.045);   // the insulators
          exclPush(x, z, 1.6); CR.avoid(x, z, 0.8); if (!nPole) out.marks.power = [x, z]; nPole++;
        }
        for (const o of [-0.85, 0, 0.85]) for (let k = 0; k + 1 < top.length; k++) {   // the wires: ~10 segments a span, sagging (less over a hump of the ground)
          const A = top[k], B = top[k + 1], ax = A[0] - A[4] * o, az = A[2] + A[3] * o, bx = B[0] - B[4] * o, bz = B[2] + B[3] * o, span = Math.hypot(bx - ax, bz - az);
          if (Math.min(vrDist(ax, az), vrDist(bx, bz)) > 600) continue;
          let sag = span * 0.025; const mid = caGround((ax + bx) / 2, (az + bz) / 2), cl = (A[1] + B[1]) / 2 - sag - mid; if (cl < 6) sag = Math.max(0, sag - (6 - cl));
          let px = ax, py = A[1], pz = az;
          for (let q = 1; q <= 10; q++) { const t = q / 10, x = lerp(ax, bx, t), z = lerp(az, bz, t), y = lerp(A[1], B[1], t) - sag * 4 * t * (1 - t);
            ouRod(gw, [px, py, pz], [x, y, z], 0.03, wire, 3); px = x; py = y; pz = z; }
        }
      }
      addM(gw, lMat, false);
    }

    /* ---- the col's obelisk (def.obelisk: OpenStreetMap's memorial at the top): a plain stone obelisk on a stepped plinth, no inscription ---- */
    if (def.obelisk) {
      const [x, z] = def.obelisk, y = caGround(x, z), g = scen.get(x, z), rot = PI / 4, st = [0.68, 0.65, 0.6], st2 = [0.6, 0.57, 0.52];   // (rot: the plinth's faces square with the shaft's four)
      box(g, x, y - 0.6, z, 3.4, 1.0, 3.4, rot, st2, [0.64, 0.61, 0.56]);   // the steps
      box(g, x, y + 0.35, z, 2.5, 0.55, 2.5, rot, st2, st);
      box(g, x, y + 0.9, z, 1.5, 1.2, 1.5, rot, st, st);   // the pedestal
      cyl(g, x, y + 2.1, z, 0.6, 5.2, 4, st, null, 0.36);   // the shaft, tapering (four faces)
      cone(g, x, y + 7.3, z, 0.36, 0.6, 4, st, [0.74, 0.72, 0.68], 0);   // the pyramidion
      exclPush(x, z, 4); CR.block(x, z, 3.6, 3.6, rot); out.marks.obelisk = [x, z];
    }

    /* ---- spectators: the start and the finish, the checkpoints, both sides of every hairpin, a few groups along the road ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return inLake(x, z); };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.12, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'PL start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'PL finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.55, label: 'PL cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.4, label: 'PL cp-' }); });
      (def.curves || []).forEach(([d, , turn], k) => { const sm = sStart + d; for (const sd of [-1, 1]) run(sm - 22, sm + 22, sd, { rows: 3, dens: sd === turn ? 0.5 : 0.35, flag: 0.18, label: 'PL hairpin ' + (k + 1) }); });
      for (let s = sStart + 400; s < sFin - 300; s += 600) { const sd = rpHash(Math.round(s), 7) < 0.5 ? -1 : 1; run(s, s + 24, sd, { rows: 2, dens: 0.35, clump: 0.9, label: 'PL group' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the trees and shrubs (instanced per 96 m chunk): spruce in the forest (lc 1), dwarf pine and juniper in mats (lc 2), a few dwarf pines on the
       pasture; none on the rock, the scree, the snow or the cliffs ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const larch = L.forest === 'larch', med = L.forest === 'med';   // (the forest's tall trees first: the spruce, or the larch and then the stone pine in tk[3]; the Mediterranean's: the Aleppo pine, the macchia, the càrritx, the holm oak)
    const tk = (larch ? [3, 1, 2, 4] : med ? [5, 6, 7, 8] : [0, 1, 2]).map(k => new IChunks(plTreeGeo(k), tMatT, 96));
    let nTrees = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(70000 * dens), RT = rng(L.seed + 61), SP = 3.6 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(240)) continue;
          if (hd > LOD.radius(90) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot)
          const c = vrLC(x, z), p = med ? (c === 1 ? 0.5 : c === 2 ? 0.55 : c === 0 ? 0.16 : c === 7 ? 0.07 : c === 4 ? 0.02 : 0)   // (the karst: shrubs and tussocks in the grass, a few in the cracks of the bare rock)
            : c === 1 ? 0.55 : c === 2 ? 0.62 : c === 0 ? 0.015 + 0.05 * sstep(0.62, 0.8, P.n5(x * 1.3 + 40, z * 1.3)) : 0;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.2) continue; if (holds && nn.i >= 0 && nn.dd < 7) hold(x, z, 0.35);
          if (excluded(x, z) || inLake(x, z)) continue;
          const sl = caSlope(x, z); if (sl > 1.1) continue;
          const y = caGround(x, z); if (plSnow(x, z, y + base, 1 / Math.sqrt(1 + sl * sl), 0, 0) > 0.4) continue;
          let sp = med ? (c === 1 ? (r3 < 0.6 ? 0 : r3 < 0.8 ? 3 : 1) : c === 2 ? (r3 < 0.08 ? 3 : r3 < 0.8 ? 1 : 2) : c === 0 ? (r3 < 0.03 ? 0 : r3 < 0.08 ? 3 : r3 < 0.45 ? 1 : 2) : r3 < 0.5 ? 1 : 2)
            : c === 1 && r3 < 0.7 ? 0 : r3 < 0.75 ? 1 : 2;
          if (larch && c === 0 && r3 < 0.3 && y + base < L.treeline + 60) sp = 0;   // (the larch forest: lone larches and stone pines on the pasture up to the treeline)
          if (larch && sp === 0 && P.n2(x * 0.8 + 70, z * 0.8 - 40) + (r4 - 0.5) * 0.3 > 0.6) sp = 3;   // (the stone pine: in clumps, about a third of the trees)
          if ((sp === 0 || sp === 3) && wireD && wireD(x, z) < 7) continue;   // (none under the power line: its strip is kept clear)
          if (L.shrubR && (sp === 1 || sp === 2) && hd > LOD.radius(L.shrubR)) continue;   // (shrubR: the dwarf pine and the juniper only so far from the road, beyond it the ground's own shrub colour; the phone's load where they are many)
          let hgt, wid, col;
          if (sp === 0) { hgt = 10 + r4 * 12; wid = hgt * (0.3 + r2 * 0.08); col = [0.9 + r2 * 0.2, 0.92 + r4 * 0.16, 0.92 + r3 * 0.16]; }
          else if (sp === 1) { hgt = 0.9 + r4 * 1.4; wid = 2.2 + r2 * 3.2; col = [0.9 + r3 * 0.2, 0.95 + r4 * 0.1, 0.9]; }
          else { hgt = 0.5 + r4 * 0.6; wid = 1.4 + r2 * 2; col = [0.95 + r3 * 0.1, 0.98, 0.95]; }
          if (med) {   // the Aleppo pine (tall, its crown wide and flat), the holm oak (round, dark), the macchia's bushes and the càrritx's tussocks
            if (sp === 0) { hgt = 7 + r4 * 8; wid = hgt * (0.6 + r2 * 0.2); col = [0.9 + r2 * 0.2, 0.92 + r4 * 0.16, 0.9 + r3 * 0.14]; }
            else if (sp === 3) { hgt = 4 + r4 * 4; wid = hgt * (0.8 + r2 * 0.2); col = [0.9 + r3 * 0.16, 0.92 + r4 * 0.14, 0.92 + r2 * 0.12]; }
            else if (sp === 1) { hgt = 0.8 + r4 * 1.4; wid = 1.6 + r2 * 2; col = [0.88 + r3 * 0.24, 0.92 + r4 * 0.16, 0.9 + r2 * 0.12]; }
            else { hgt = 0.6 + r4 * 0.5; wid = 0.9 + r2 * 0.7; col = [0.92 + r3 * 0.16, 0.95 + r4 * 0.1, 0.95]; }
          }
          if (larch && (sp === 0 || sp === 3)) {   // the larch and the stone pine: broader than the spruce, lower and stunted towards the treeline
            const tl = sstep(L.treeline + 100, L.treeline - 150, y + base);
            if (sp === 0) { hgt = (9 + r4 * 11) * (0.5 + 0.5 * tl); wid = hgt * (0.36 + r2 * 0.1); col = [0.9 + r2 * 0.2, 0.92 + r4 * 0.14, 0.86 + r3 * 0.14]; }
            else { hgt = (6 + r4 * 7) * (0.55 + 0.45 * tl); wid = hgt * (0.52 + r2 * 0.12); col = [0.9 + r3 * 0.16, 0.94 + r4 * 0.12, 0.94 + r2 * 0.12]; }
          }
          tk[sp].add(x, y - 0.15, z, r1 * 70, wid, hgt, col);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    if (L.bkCap && med) {   // the scrub on the banks under the low walls between the legs (L.bkCap, Kotor's): the macchia's bushes every few metres down
      // the bank, now and then a small holm oak on its lower half (the real slope between the legs is green with them)
      const RB = rng(L.seed + 67), clump = new IChunks(plTreeGeo(9), tMatT, 96);
      for (const [si, side] of [[0, -1], [1, 1]]) for (let i = 0; i < N; i++) { const b = bk[si][i]; if (!b || !b.bank) continue;
        const r1 = RB(), r2 = RB(), r3 = RB(), r4 = RB(); if (r1 < 0.5) continue;
        const [t, f] = b.bank, oak = r3 < 0.08 && f[1] < -6, u = oak ? 0.55 + 0.25 * r2 : 0.15 + 0.7 * r2, o = lerp(t[0], f[0], u) + 0.35, yy = T.hy[i] + lerp(t[1], f[1], u) - 0.3;
        const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
        if (oak) { const hgt = 3.8 + r4 * 3; tk[3].add(x, yy, z, r1 * 70, hgt * (0.75 + r2 * 0.2), hgt, [0.9 + r3 * 0.16, 0.92 + r4 * 0.14, 0.92 + r2 * 0.12]); }
        else clump.add(x, yy, z, r1 * 70, 3.6 + r2 * 2.8, 2.0 + r4 * 1.8, [0.86 + r3 * 0.26, 0.9 + r4 * 0.18, 0.88 + r2 * 0.14]);
        nTrees++; }
      clump.addTo(root, true); }
    for (const t of tk) t.addTo(root, true);

    /* ---- the pasture's plants (instanced per 96 m chunk): tufts of grass, cushions of flowers, boulders; stones on the scree and by the road ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);   // (the grass: in the wind, and the cut)
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    const pk = [0, 1, 2, 3].map(k => new IChunks(API.btPlantGeo(k), k === 0 ? wMat : pMat, k === 3 ? 64 : 96));
    const flowerC = [[1.0, 0.92, 0.35], [0.66, 0.5, 0.95], [1, 1, 1], [0.95, 0.5, 0.75], [0.5, 0.65, 1.0]];
    let nPlants = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(60000 * dens), RT = rng(L.seed + 71), SP = 3.4 / Math.sqrt(dens);
      const rc = L.rockCols;
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(220)) continue;
          if (hd > LOD.radius(70) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;
          const c = vrLC(x, z);
          let kind = -1;
          if (c === 0) kind = r1 < 0.5 ? 0 : r1 < 0.58 ? 1 : r1 < 0.62 ? 2 : -1;
          else if (c === 2) kind = r1 < 0.2 ? 0 : -1;
          else if (c === 4) kind = r1 < 0.16 ? 2 : r1 < 0.2 ? 0 : -1;
          else if (c === 7) kind = r1 < 0.12 ? 2 : r1 < 0.4 ? 3 : -1;
          else if (c === 1) kind = r1 < 0.05 ? 0 : -1;
          if (kind === 1 && L.flowers != null && RT() > L.flowers) continue;   // (L.flowers: fewer cushions of flowers, Sa Calobra's dry summer)
          if (kind < 0) continue;
          const y0 = caGround(x, z), sl = caSlope(x, z); if (sl > (kind >= 2 ? 1.1 : 0.85)) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 1.6) continue;
          if (excluded(x, z) || inLake(x, z)) continue;
          const ny = 1 / Math.sqrt(1 + sl * sl); if (plSnow(x, z, y0 + base, ny, 0, 0) > 0.35) continue;
          if (kind === 0) pk[0].add(x, y0 - 0.05, z, r2 * TAU, 0.45 + r3 * 0.5, 0.25 + r4 * 0.3, [0.92 + r2 * 0.16, 0.95 + r3 * 0.1, 0.9 + r4 * 0.16]);
          else if (kind === 1) pk[1].add(x, y0 - 0.06, z, r2 * TAU, 0.4 + r3 * 0.6, 0.25 + r4 * 0.25, flowerC[Math.floor(r4 * flowerC.length)]);
          else { const q = rc[Math.floor(r2 * rc.length)], k = (0.85 + r3 * 0.3) / 0.62; pk[kind].add(x, y0 - (kind === 2 ? 0.15 : 0.04), z, r4 * TAU, kind === 2 ? 0.6 + r3 * 1.8 : 0.8 + r3, kind === 2 ? 0.45 + r4 * 1.2 : 0.8 + r4, [q[0] * k, q[1] * k, q[2] * k]); }
          if (++nPlants >= maxT) break grid;
        }
      }
      const RS = rng(L.seed + 77), maxS = Math.round(16000 * dens); let nS = 0;   // the stones by the road: little clusters strewn beside it, thinning out over ~30 m
      edge: for (let s = 12; s < T.len - 12; s += 1.3 / dens) for (const side of [-1, 1]) {
        const o = 1.7 + Math.pow(RS(), 2) * 30, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z) || inLake(x, z)) continue;
        const y0 = caGround(x, z), sl = caSlope(x, z), c = vrLC(x, z); if (sl > 1.15 || (c !== 4 && c !== 7 && r1 < 0.5)) continue;
        const q = rc[Math.floor(r2 * rc.length)], k = (0.84 + r3 * 0.28) / 0.62, sc = 0.8 + r1 * 1.1; pk[3].add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [q[0] * k, q[1] * k, q[2] * k]);
        if (++nS >= maxS) break edge;
      }
    }
    for (const t of pk) t.addTo(root, false);

    /* ---- the slopes: blocks at the foot of the cuts, crags and slabs where the slope rises steep beside the road, old snow in the shady gullies high up ---- */
    let nSnow = 0;
    {
      const RV = rng(L.seed + 81), rc = L.rockCols;
      for (let s = 10; s < T.len - 10; s += 6) for (const side of [-1, 1]) {   // blocks at the foot of the cuts
        if (RV() > 0.32) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 36, [x, z] = onSide(s, side, o), sz = 0.4 + RV() * 1.4; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || inLake(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = caGround(x, z), sl = caSlope(x, z), c = vrLC(x, z); if (sl < 0.3 && c !== 4 && c !== 7) continue; hold(x, z, sz * 0.65);
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.25, sz, sz, RV() * TAU, vary(rc[Math.floor(RV() * rc.length)], RV, 0.1), RV, 0.28);
      }
      for (let s = 16; s < T.len - 16; s += 14) for (const side of [-1, 1]) {   // crags and slabs where the slope is steep (the schist: flatter, tilted slabs)
        if (RV() < 0.4) continue;
        const [x, z] = onSide(s, side, 8 + RV() * 80); if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(110)) continue;
        const sl = caSlope(x, z); if (sl < 0.6 && vrLC(x, z) !== 4) continue;
        const y = caGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(rc[Math.floor(RV() * rc.length)], RV, 0.06);
        for (let q = 0; q < n; q++) { const r0 = 2 + RV() * 4, qx = x + (RV() - 0.5) * 9, qz = z + (RV() - 0.5) * 9, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.15, qz, r0 * 1.3, r0 * (0.4 + RV() * 0.3), r0 * (0.8 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.06), RV, 0.22); }
      }
      API.ROCK_SMOOTH = true;
      const G = P.G, Lt = VRC * VRT;   // the old snow: flat white patches where the snow lies, on the full tiles
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        for (let k = 0; k < 6; k++) { const x = G.x0 + (ti + RV()) * Lt, z = G.z0 + (tj + RV()) * Lt, y = caGround(x, z), sl = caSlope(x, z), nn = vrNear(x, z);
          if (nn.i >= 0 && nn.dd < 4) continue; const sn = plSnow(x, z, y + base, 1 / Math.sqrt(1 + sl * sl), 0, 0); if (sn < 0.6) continue;
          ico(scen.get(x, z), x, y - 0.4, z, 3 + RV() * 4, 0.16, L.snowC, RV, 0.1); nSnow++; }
      }
      API.ROCK_SMOOTH = false;
    }

    /* ---- the flocks: sheep grazing on the pasture, a shepherd with each ---- */
    let nSheep = 0;
    if (L.sheep) {
      const RF = rng(L.seed + 91), sh = new IChunks(plSheepGeo(), pMat, 96);
      for (const f of [0.18, 0.55, 0.82]) {
        for (let tries = 0; tries < 30; tries++) { const s = sStart + f * (sFin - sStart) + (RF() - 0.5) * 200, side = RF() < 0.5 ? -1 : 1, [cx, cz] = onSide(s, side, 25 + RF() * 60);
          if (excluded(cx, cz) || inLake(cx, cz) || vrLC(cx, cz) !== 0 || caSlope(cx, cz) > 0.5) continue;
          const n = 14 + Math.floor(RF() * 14); let placed = 0;
          for (let k = 0; k < n * 3 && placed < n; k++) { const x = cx + (RF() - 0.5) * 40, z = cz + (RF() - 0.5) * 40, nn = vrNear(x, z); if ((nn.i >= 0 && nn.dd < 4) || excluded(x, z) || inLake(x, z) || caSlope(x, z) > 0.6) continue;
            sh.add(x, caGround(x, z), z, RF() * TAU, 0.9 + RF() * 0.25, 0.9 + RF() * 0.2, [1, 1, 1]); placed++; nSheep++; }
          person(cx + 6, cz - 4, RF() * TAU, [0.32, 0.26, 0.2]); exclPush(cx, cz, 24); break; }
      }
      sh.addTo(root, true);
    }

    if (L.extra) L.extra({ scen, root, out, P, excluded, onSide, matV });   // (a pass's own landmarks, built by its own file: js/world-medeu.js)

    /* ---- the puddles of a race in the rain (T.puddles; as Sani Pass') ---- */
    if (T.puddles && T.puddles.length) {
      const g = new GB(), PP = (s, d) => { const f = s / T.ds, i = clamp(Math.floor(f), 0, T.N - 2), t = f - i, j = i + 1, nx = lerp(T.nx[i], T.nx[j], t), nz = lerp(T.nz[i], T.nz[j], t);
        return [lerp(T.px[i], T.px[j], t) + nx * d, lerp(T.hy[i], T.hy[j], t) + 0.035, lerp(T.pz[i], T.pz[j], t) + nz * d]; };
      const SKY = [0.55, 0.59, 0.63], MID = [0.36, 0.36, 0.37], RIM = [0.3, 0.3, 0.31], n = 14, RP = rng(L.seed + 97);
      for (const [s, d, hl, hw] of T.puddles) {
        const c = PP(s, d), below = [c[0], c[1] - 5, c[2]], ph = RP() * TAU, wob = [];
        for (let k = 0; k < n; k++) { const a = k / n * TAU; wob.push([Math.cos(a), Math.sin(a), 0.84 + 0.16 * Math.sin(a * 3 + ph) * Math.cos(a * 2 - ph)]); }
        const ring = (f) => wob.map(([cx, sz, ww]) => PP(s + cx * hl * ww * f, d + sz * hw * ww * f)), I = ring(0.62), O = ring(1);
        for (let k = 0; k < n; k++) { const m = (k + 1) % n; g.triO(c, I[k], I[m], SKY, below); g.triO(I[k], O[k], O[m], MID, below, RIM, RIM); g.triO(I[k], O[m], I[m], MID, below, RIM, MID); }
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true })); m.matrixAutoUpdate = false; m.visible = false; m.name = 'puddles'; root.add(m);
      out.dyn.wet = { puddles: m, road: aMat, ground: gMat, base: { sh: 0, sp: 0 } };
    }

    /* ---- the view beyond the corridor (def.farDem: the ridges of the cirque, the valley below; irFar, World.update moves it with the camera); finish the meshes ---- */
    const FAR = API.irFar ? API.irFar(L.far.wet || L.far.hz ? Object.assign((A, sl, q) => plFarCol(A, sl, q), { wet: L.far.wet, hz: L.far.hz }) : plFarCol) : null; if (FAR) { FAR.mesh.visible = false; root.add(FAR.mesh); out.dyn.irFar = FAR; }   // (hidden until the first World.update)
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    if (FAR && def.farDem.ice) plFarIce(FAR);   // (the glaciers on the horizon)
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: plAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: plAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    if (RN) out.hillProbe = { holds, rail: RN, bk, kn,   // (L.hills: the ground a car finds past the barrier line, o m from the centre line: the verge as drawn, the terrain past it; where no hill may be; tools/sacalobra-hribi.mjs)
      g: (i, side, o) => { const si = side > 0 ? 1 : 0, v = vp[si][i]; if (o <= v[v.length - 1][0]) { let k = 1; while (k < v.length - 1 && o > v[k][0]) k++; const [o0, y0] = v[k - 1], [o1, y1] = v[k]; return y0 + (y1 - y0) * Math.max(0, Math.min(1, (o - o0) / Math.max(1e-6, o1 - o0))); }
        const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - T.hy[i]; },
      skip: (i, side) => { const si = side > 0 ? 1 : 0; return !!(RN[si][i] || bk[si][i] || kn[si][i] || vp[si][i][2][1] < -2.6); } };
    out.stats = { trees: nTrees, plants: nPlants, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), snow: nSnow, sheep: nSheep, pylons: nPyl, poles: nPole, lakes: P.lakes.length, pulls: pulls.length, sat: !!SAT };   // (read by the tests)
    return out;
  }

  Object.assign(API, { PL_LOOK, buildPrelaz });   // (what World and the other worlds use of this one)
  for (const th of Object.keys(PL_LOOK)) World.keep('caBank', th);   // (the walls' terrain kept between the passes' builds; World.build frees it for the other worlds: caBank.f's closure holds this build's whole world)
  for (const th of Object.keys(PL_LOOK)) World.ext[th] = (scene, tex, opts) => buildPrelaz(scene, tex, opts, PL_LOOK[th]);
})();
