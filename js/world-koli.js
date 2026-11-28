/* =========================================================================
   WORLD — Koli, Finska (theme 'koli'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's own style and
   its own things in S.extra (decision O-28-11, docs/proge/koli-dodelava.md). Sources: OpenStreetMap (the road, the buildings, the lifts, the
   runs), Copernicus DEM GLO-30 (the ridge), ESA WorldCover 2021 (the forest), nationalparks.fi/koli (the rock, the tykky, the trees).
   The upper Ylä-Kolintie climbs out of the taiga to Ylä-Koli under the bare summit of Ukko-Koli (347 m, 253 m over the lake Pielinen). Its own
   things, all merged into the scenery's chunks (no draw calls of their own):
   - the quartzite: the white quartzite of Ukko-Koli and Akka-Koli in tilted slabs, stepping down the dip in clusters, a thin snow cap on the flatter
     ones; thick on the ridge east of the finish (x 1050-1350, z 450-1000 in the game: crest over ~310 m) and beside the upper road where it is
     steep or high (the second half of the track, 4-60 m off the asphalt);
   - the tykky: tall spruces under thick crown snow and rime, bent into white columns with a little green showing, above ~270 m (the village, the
     ridge, the summit), 5-150 m off the road; lower down the shared builder's snowy spruces;
   - the birches of the lower slopes: bare white trunks with dark marks and a black foot, thin dark twigs, in groups of one to three at the forest's
     edge beside the first half of the road (6-40 m out);
   - the taiga itself (S.trees): denser, spruce before pine 2 : 1, taller (9-19 m); the summit's bare rock kept clear of trees;
   - Ylä-Koli's buildings (S.bld): walls in the Finnish red and yellow ochre, white and grey timber; dark and grey sheet roofs.
   - the places by the road from OpenStreetMap (O-28-49, the second round): the 60 m lattice mast by the finish, the funicular over the hairpin
     on its low deck, the concrete stairs with handrails (117, 70, 58 and 10 steps), the zebra crossing and the bicycle stands at the upper car
     park, the hotel's retaining wall, the ski tracks' map at the start, the groomed ski tracks (a skating lane and a classic track), and the bare
     quartzite and cliffs the map has beside the upper road (OSM)
   No signs, inscriptions or names. The roadside ground of the chase camera stays js/world-chase-bt*.js's (goreRob).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  const QZ = [[0.78, 0.78, 0.77], [0.72, 0.72, 0.71], [0.84, 0.83, 0.81], [0.66, 0.66, 0.66]];   // quartzite: pale to mid grey (against the snow)
  const SNOWC = [0.93, 0.95, 0.99], RIME = [0.88, 0.91, 0.96], NEEDLE = [0.16, 0.26, 0.17], NEEDLE2 = [0.2, 0.31, 0.2];
  const BIRCH = [0.9, 0.89, 0.85], BIRCH2 = [0.84, 0.83, 0.79], FOOT = [0.3, 0.27, 0.25], MARK = [0.2, 0.19, 0.18], TWIG = [0.34, 0.25, 0.24];   // (the winter crown of the birch: a red-brown haze)
  const SUMMIT = [1210, 770];   // Ukko-Koli's top in the game's DEM (x east, z south)
  let PLAN = null;   // (the positions keepOut chose, drawn by extra)

  /* ---- the places by the road from OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0; the map of 28. 11. 2026, api.openstreetmap.org),
     in the game's metres (the import's origin, tools/proga-uvoz.mjs geo()); only those within ~60 m of the road ---- */
  const OSM = {
    // the funicular from the lower car park over the hairpin up to the hotel (railway=funicular, layer 1), and its stairs (117 steps, handrail)
    funi: [[923.8, 601.8], [925.6, 598.1], [966.7, 567.5], [1009, 534.7]],
    // the concrete stairs with handrails: beside the funicular; up from the finish to the summit's path (70 and 58 steps); at the hotel's wall
    steps: [[[921.9, 608.6], [966.7, 567.5], 117], [[1089.4, 586.3], [1108.4, 605.8], 70], [[1116.6, 613.5], [1137.7, 626], 58], [[1012.4, 523.4], [1010.6, 517.1], 10]],
    mast: [1057.2, 669.1, 60],   // (man_made=mast, a lattice tower, 60 m)
    zebra: [913.7, 587.4],   // (highway=crossing, crossing:markings=yes: from the bus stop to the upper car park)
    bikes: [918.1, 587.2, 12],   // (bicycle_parking=stands, 12 places)
    board: [-67.9, -32.1],   // (tourism=information, information=map: the ski tracks' map at the start, no text drawn)
    wall: [[999.4, 507.7], [1004.8, 519.8], [1010.6, 517.1], [1011.7, 516.6], [1017.6, 529.2]],   // (barrier=retaining_wall)
    // the groomed ski tracks (piste:type=nordic, classic and skating), the parts near the road
    ski: [[[1067.9, 617.2], [1063.8, 633.8], [1068, 664.3], [1068.8, 672.2], [1075.9, 682.6], [1080.7, 688.2], [1084.1, 694.3], [1093, 700.2], [1097.6, 706.4], [1103.8, 717.6]],
      [[907.2, 309.3], [892.5, 301.2], [883.1, 296.3], [878.1, 291.7], [872.8, 288.1], [866.7, 282.8], [858.1, 275.4], [848.5, 270.6], [834.8, 265.1], [796, 268.4], [791.2, 281.6], [788.9, 292], [786.9, 318.7], [784.2, 345.6], [783.6, 351.9], [781.7, 365.6], [779.5, 376.5], [777.8, 389.6], [775.2, 403.5], [771.5, 414.6], [770.2, 420.9], [772.5, 431], [767.3, 440.6], [768.1, 454.1], [764.4, 461], [758.8, 473.2], [755.2, 484.7], [744.1, 498.1], [721, 516.6], [710.3, 525.4]],
      [[959.8, 448.2], [955.1, 458], [952.9, 464], [952.5, 473.8], [953.3, 481.1], [958.1, 493.1]]],
    // the bare quartzite (natural=bare_rock) and its cliffs (natural=cliff) near the upper road
    rock: [[[963.9, 628.7], [967.9, 645.5], [975.2, 658.2], [985.3, 669.8], [989.6, 678.8], [998.3, 695], [1001.8, 713.7], [1001.5, 727.2], [994.7, 738.3], [986.9, 741.5], [971.4, 739.1], [964.7, 735.3], [955.2, 713.9], [953, 696.1], [951.7, 686.9], [949, 674.4], [945.2, 659.6], [938.1, 646.6], [934.3, 629.5], [932.4, 615.7], [929.7, 608.1], [922.7, 589.5], [917.3, 573.2], [914.8, 563], [914.8, 557.8], [913.9, 547.3], [911.6, 535.9], [912.5, 534.8], [914.6, 538.4], [920.7, 557.3], [929.7, 570], [935.1, 576.5], [940, 579.5], [952.5, 593.3], [959.2, 607.1], [963, 617.1]],
      [[1109.9, 593.3], [1118.8, 598.7], [1121.2, 607.3], [1122.9, 624.7], [1122.6, 632.2], [1120.4, 642.5], [1117.7, 654.1], [1113.4, 661.7], [1106.9, 663.9], [1099.3, 661.2], [1094.4, 652.5], [1088.7, 641.7], [1087, 632.6], [1087, 606.7], [1093.7, 597.1], [1102.8, 590.3]],
      [[938.1, 480.6], [940.2, 489.4], [943.1, 499.1], [942.7, 508.7], [941.8, 517.1], [940, 524.1], [937.3, 524], [935.1, 520.1], [933.1, 515.3], [932.4, 500.5], [932.3, 488.2], [931.8, 478.8], [928.5, 474.1], [920.5, 464.3], [915.9, 458.8], [917.7, 456.8], [920.6, 455.4], [927.6, 460.3], [931.6, 466.1], [937.2, 474.1]],
      [[1130.7, 609.5], [1132.9, 619.8], [1134.2, 633.8], [1134, 640.9], [1134.8, 652.2], [1137.5, 660.4], [1139.7, 669.8], [1139.9, 678], [1137.8, 684.2], [1132.6, 680.1], [1130.5, 670.4], [1127.2, 661.7], [1126.4, 652.5], [1124.8, 639.8], [1126.4, 628.4], [1126.4, 624.1], [1127.2, 614.6], [1127.2, 608.4]],
      [[982.4, 447.7], [978.5, 454.2], [974, 460.6], [969.4, 468.4], [971, 476.1], [972.5, 479.9], [976.9, 487.5], [978.3, 493.7], [977.1, 499.1], [973.9, 502.5], [968.1, 499.5], [964.4, 496], [959.7, 481.4], [959.2, 473.8], [960.7, 463], [962.6, 456.5], [968.6, 447.3], [970.4, 441.2], [973, 437.9], [986.4, 438.2], [998.4, 440.1], [1013.3, 447.8], [1019.4, 449.2], [1027.4, 451.8], [1033.3, 457.7], [1034.6, 469.5], [1034.3, 476.9], [1029.4, 474.8], [1022.1, 469.6], [1015.7, 461.1], [1010.3, 451.6], [1001.2, 446.5], [993, 445.1], [987.1, 444.9]]],
    cliff: [[[957.5, 659.2], [982.7, 719.8]], [[934.6, 472.2], [934.6, 512.9]], [[912.4, 535.8], [926.4, 581.6]], [[1093.7, 597.1], [1087, 606.7], [1087, 632.6]]],
  };
  const inPoly = (x, z, pl) => { let c = false; for (let i = 0, j = pl.length - 1; i < pl.length; j = i++) { const a = pl[i], b = pl[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  // (along a polyline every step metres: [x, z, heading, the metres so far])
  function along(pl, step) {
    const out = []; let acc = 0;
    for (let k = 0; k + 1 < pl.length; k++) {
      const a = pl[k], b = pl[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), h = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (let t = k ? (step - (acc % step)) % step : 0; t < L; t += step) out.push([a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L, h, acc + t]);
      acc += L;
    }
    const e = pl[pl.length - 1], q = pl[pl.length - 2]; out.push([e[0], e[1], Math.atan2(e[1] - q[1], e[0] - q[0]), acc]);
    return out;
  }

  const STEEL = [0.6, 0.62, 0.65], STEEL2 = [0.48, 0.5, 0.53], CONC = [0.62, 0.62, 0.6], CONC2 = [0.52, 0.52, 0.5], GROOVE = [0.76, 0.81, 0.9], LANE = [0.86, 0.9, 0.96];
  const WOOD = [0.42, 0.3, 0.2], BOARD = [0.86, 0.87, 0.83];

  // the lattice mast: three legs closing from a 4.5 m triangle at its foot to 1 m at its top, a horizontal and an X of bracing on each face every
  // 5 m, a small platform near the top with a few panel antennas
  function mast(g, x, z, H, A) {
    const y0 = A.vrGround(x, z) - 0.3, rod = A.ouRod, leg = (k, t) => { const r = 2.6 - 2.0 * t, a = k * A.TAU / 3 + 0.3; return [x + Math.cos(a) * r, y0 + H * t, z + Math.sin(a) * r]; };
    const n = Math.round(H / 5);
    let rods = 0;
    for (let j = 0; j < n; j++) {
      const t0 = j / n, t1 = (j + 1) / n;
      for (let k = 0; k < 3; k++) {
        const a0 = leg(k, t0), a1 = leg(k, t1), b0 = leg((k + 1) % 3, t0), b1 = leg((k + 1) % 3, t1);
        rod(g, a0, a1, 0.13 - 0.06 * t0, STEEL, 4); rod(g, a1, b1, 0.05, STEEL2, 3); rod(g, a0, b1, 0.04, STEEL2, 3); rod(g, b0, a1, 0.04, STEEL2, 3); rods += 4;
      }
    }
    const tp = y0 + H * 0.9;
    A.cyl(g, x, tp, z, 1.6, 0.12, 6, STEEL2, STEEL);
    for (let k = 0; k < 3; k++) { const a = k * A.TAU / 3 + 0.3 + Math.PI / 3; A.box(g, x + Math.cos(a) * 1.2, tp + 0.4, z + Math.sin(a) * 1.2, 0.3, 1.8, 0.12, a + Math.PI / 2, [0.84, 0.85, 0.86]); }
    rod(g, [x, y0 + H, z], [x, y0 + H + 3, z], 0.05, STEEL, 3);
    return rods;
  }

  // the funicular: two rails on a narrow steel deck on piers ~1 m over the ground (its OSM line, layer 1), left out within 7 m of the road (how
  // it meets the road the map does not say)
  function funicular(scen, A, roadOff) {
    const pts = along(OSM.funi, 3), gH = A.vrGround, ys = pts.map(p => gH(p[0], p[1]) + 1.1);
    for (let it = 0; it < 3; it++) for (let k = 1; k + 1 < ys.length; k++) ys[k] = Math.max(gH(pts[k][0], pts[k][1]) + 0.6, (ys[k - 1] + ys[k] * 2 + ys[k + 1]) / 4);
    let n = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1];
      if (roadOff(a[0], a[1]) < 7 || roadOff(b[0], b[1]) < 7) continue;
      const g = scen.get(a[0], a[1]), h = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(h), nz = Math.cos(h);
      for (const sd of [-0.55, 0.55]) A.ouRod(g, [a[0] + nx * sd, ys[k] + 0.12, a[1] + nz * sd], [b[0] + nx * sd, ys[k + 1] + 0.12, b[1] + nz * sd], 0.05, STEEL, 3);
      const p = [a[0] + nx * 0.62, ys[k] - 0.1, a[1] + nz * 0.62], q = [a[0] - nx * 0.62, ys[k] - 0.1, a[1] - nz * 0.62], p2 = [b[0] + nx * 0.62, ys[k + 1] - 0.1, b[1] + nz * 0.62], q2 = [b[0] - nx * 0.62, ys[k + 1] - 0.1, b[1] - nz * 0.62];
      g.quadUp(p, q, q2, p2, [SNOWC, SNOWC, SNOWC, SNOWC]);
      if (k % 2 === 0) A.box(g, a[0], gH(a[0], a[1]) - 0.3, a[1], 0.3, ys[k] - gH(a[0], a[1]) + 0.2, 1.3, h, STEEL2);
      n++;
    }
    return n;
  }

  // concrete stairs under snow: a step each ~0.5 m along the OSM line (the map's count of steps), the steps' tops on the ground and never
  // going down, the treads snow; a steel handrail on posts each side
  function stairs(scen, A, st) {
    const [a, b, nSteps] = st, gH = A.vrGround, L = Math.hypot(b[0] - a[0], b[1] - a[1]), h = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const up = gH(b[0], b[1]) >= gH(a[0], a[1]), [p0, p1] = up ? [a, b] : [b, a], hh = up ? h : h + Math.PI, nx = -Math.sin(hh), nz = Math.cos(hh);
    const n = Math.max(2, Math.min(nSteps, Math.round(L / 0.45))), step = L / n, rail = [[], []];
    let y = gH(p0[0], p0[1]);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, x = p0[0] + (p1[0] - p0[0]) * t, z = p0[1] + (p1[1] - p0[1]) * t, gy = gH(x, z);
      y = Math.max(y, gy + 0.05); const g = scen.get(x, z);
      A.box(g, x, Math.min(gy, y) - 0.4, z, step + 0.02, y - Math.min(gy, y) + 0.4, 1.6, hh, CONC2, SNOWC, true);
      if (k % 6 === 0 || k === n - 1) for (const sd of [0, 1]) { const o = sd ? 0.75 : -0.75; rail[sd].push([x + nx * o, y + 0.95, z + nz * o]); A.ouRod(g, [x + nx * o, y, z + nz * o], [x + nx * o, y + 0.95, z + nz * o], 0.025, STEEL, 3); }
    }
    for (const r of rail) for (let k = 0; k + 1 < r.length; k++) A.ouRod(scen.get(r[k][0], r[k][2]), r[k], r[k + 1], 0.025, STEEL, 3);
    return n;
  }

  // the zebra: stripes 0.5 m wide, 0.5 m apart across the road, each 3 m along it (on the asphalt, 0.036 m up as at Bangsaen)
  function zebra(scen, A) {
    const T = A.T, [x, z] = OSM.zebra, i = A.vrNear(x, z).i; if (i < 0) return 0;
    const h = T.hd[i], fx = Math.cos(h), fz = Math.sin(h), nx = T.nx[i], nz = T.nz[i], y = T.hy[i] + 0.036, w = T.w, cx = T.px[i], cz = T.pz[i], g = scen.get(cx, cz), wc = [0.95, 0.95, 0.93];
    let n = 0;
    for (let o = -w + 0.4; o + 0.5 < w - 0.3; o += 1.0, n++) {
      const P = (u, v) => [cx + fx * u + nx * v, y, cz + fz * u + nz * v];
      g.quadUp(P(-1.5, o), P(-1.5, o + 0.5), P(1.5, o + 0.5), P(1.5, o), [wc, wc, wc, wc]);
    }
    return n;
  }

  // the bicycle stands: hoops of steel tube in a row, two places to each, beside the road (snow on the ground round them)
  function bikes(scen, A) {
    const T = A.T, [x0, z0, places] = OSM.bikes, nr = A.vrNear(x0, z0); if (nr.i < 0) return 0;
    const i = nr.i, h = T.hd[i], fx = Math.cos(h), fz = Math.sin(h), side = (x0 - T.px[i]) * T.nx[i] + (z0 - T.pz[i]) * T.nz[i] >= 0 ? 1 : -1;
    const o = Math.max(T.w + 2.2, Math.abs(nr.dd)), cx = T.px[i] + T.nx[i] * side * o, cz = T.pz[i] + T.nz[i] * side * o, y = A.vrGround(cx, cz), g = scen.get(cx, cz), n = Math.ceil(places / 2);
    for (let k = 0; k < n; k++) {
      const u = (k - (n - 1) / 2) * 0.9, bx = cx + fx * u, bz = cz + fz * u, ex = T.nx[i] * 0.35, ez = T.nz[i] * 0.35;
      A.ouRod(g, [bx - ex, y - 0.1, bz - ez], [bx - ex, y + 0.75, bz - ez], 0.03, STEEL, 3); A.ouRod(g, [bx + ex, y - 0.1, bz + ez], [bx + ex, y + 0.75, bz + ez], 0.03, STEEL, 3);
      A.ouRod(g, [bx - ex, y + 0.75, bz - ez], [bx + ex, y + 0.75, bz + ez], 0.03, STEEL, 3);
    }
    return n;
  }

  // the retaining wall at the hotel: 1.6 m of concrete along its OSM line, a snow top
  function wall(scen, A) {
    const gH = A.vrGround; let n = 0;
    for (let k = 0; k + 1 < OSM.wall.length; k++) {
      const a = OSM.wall[k], b = OSM.wall[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2;
      if (L < 0.3) continue;
      A.box(scen.get(cx, cz), cx, Math.min(gH(a[0], a[1]), gH(b[0], b[1])) - 0.4, cz, L + 0.35, 2.0, 0.4, Math.atan2(b[1] - a[1], b[0] - a[0]), CONC, SNOWC); n++;
    }
    return n;
  }

  // the ski tracks' map at the start: a pale board on two wooden posts under a little roof, facing the road; on it only coloured lines (the
  // tracks), no text
  function board(scen, A) {
    const T = A.T, [x, z] = OSM.board, nr = A.vrNear(x, z); if (nr.i < 0) return 0;
    const i = nr.i, face = Math.atan2(T.pz[i] - z, T.px[i] - x), rot = face + Math.PI / 2, y = A.vrGround(x, z), g = scen.get(x, z), c = Math.cos(rot), s = Math.sin(rot);
    for (const u of [-0.8, 0.8]) A.box(g, x + c * u, y - 0.2, z + s * u, 0.12, 2.3, 0.12, rot, WOOD);
    A.box(g, x, y + 1.0, z, 1.6, 1.0, 0.06, rot, BOARD);
    A.box(g, x, y + 2.1, z, 1.9, 0.08, 0.6, rot, WOOD, SNOWC);
    const fx = Math.cos(face), fz = Math.sin(face), P = (u, v) => [x + c * u + fx * 0.04, y + v, z + s * u + fz * 0.04];
    const lines = [[[-0.65, 1.2], [-0.2, 1.55], [0.3, 1.4], [0.6, 1.8]], [[-0.6, 1.8], [-0.1, 1.3], [0.55, 1.15]], [[-0.5, 1.1], [0, 1.85]]], cols = [[0.2, 0.36, 0.7], [0.72, 0.18, 0.15], [0.2, 0.5, 0.25]];
    lines.forEach((ln, j) => { for (let k = 0; k + 1 < ln.length; k++) A.ouRod(g, P(ln[k][0], ln[k][1]), P(ln[k + 1][0], ln[k + 1][1]), 0.02, cols[j], 3); });
    return 1;
  }

  // the groomed ski tracks: a skating lane of combed snow and beside it the two grooves of the classic track, on the ground along the OSM line
  // (only 4-60 m from the road)
  function skiTracks(scen, A, roadOff) {
    const gH = A.vrGround; let n = 0;
    for (const pl of OSM.ski) {
      const pts = along(pl, 2.5);
      for (let k = 0; k + 1 < pts.length; k++) {
        const a = pts[k], b = pts[k + 1], ra = roadOff(a[0], a[1]), rb = roadOff(b[0], b[1]);
        if (Math.min(ra, rb) < 4 || Math.max(ra, rb) > 60) continue;
        const h = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(h), nz = Math.cos(h), ya = gH(a[0], a[1]) + 0.07, yb = gH(b[0], b[1]) + 0.07, g = scen.get(a[0], a[1]);
        const strip = (o0, o1, col) => g.quadUp([a[0] + nx * o0, ya, a[1] + nz * o0], [a[0] + nx * o1, ya, a[1] + nz * o1], [b[0] + nx * o1, yb, b[1] + nz * o1], [b[0] + nx * o0, yb, b[1] + nz * o0], [col, col, col, col]);
        strip(-2.2, 0.2, LANE);
        for (const o of [0.7, 1.25, 1.75, 2.3]) strip(o, o + 0.1, GROOVE);
        n++;
      }
    }
    return n;
  }

  // a slab of quartzite: a box tilted down its dip (rot: the strike's heading, dip: the tilt down the direction (-sin rot, cos rot)), its top face
  // snow when it is flat enough, else the bare rock; the sides darker
  function slab(g, c, L, W, H, rot, dip, col, top) {
    const e1 = [Math.cos(rot), 0, Math.sin(rot)], d = [-Math.sin(rot), 0, Math.cos(rot)], cd = Math.cos(dip), sd = Math.sin(dip);
    const e2 = [d[0] * cd, -sd, d[2] * cd], e3 = [d[0] * sd, cd, d[2] * sd];
    const P = (a, b, h) => [c[0] + e1[0] * a * L / 2 + e2[0] * b * W / 2 + e3[0] * h * H / 2, c[1] + e2[1] * b * W / 2 + e3[1] * h * H / 2, c[2] + e1[2] * a * L / 2 + e2[2] * b * W / 2 + e3[2] * h * H / 2];
    const side = [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8];
    const v = [P(-1, -1, -1), P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1), P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)];
    g.quadO(v[4], v[5], v[6], v[7], top, c);
    g.quadO(v[0], v[1], v[5], v[4], side, c); g.quadO(v[1], v[2], v[6], v[5], side, c);
    g.quadO(v[2], v[3], v[7], v[6], col, c); g.quadO(v[3], v[0], v[4], v[7], side, c);
    g.quadO(v[0], v[1], v[2], v[3], side, c);
  }

  // a cluster of 2-4 slabs stepping down the dip from (x, z), half buried; the dip follows the slope with some noise
  function outcrop(g, x, z, size, R, A) {
    const gH = A.vrGround, gx = gH(x + 2, z) - gH(x - 2, z), gz = gH(x, z + 2) - gH(x, z - 2), sl = Math.hypot(gx, gz) / 4;
    const down = sl > 0.02 ? Math.atan2(-gz, -gx) : R() * A.TAU, rot = down - Math.PI / 2 + (R() - 0.5) * 0.5;
    const dip = Math.min(0.75, Math.atan(sl) * 0.6 + 0.08 + R() * 0.3), n = 2 + Math.floor(R() * 3), dx = Math.cos(down), dz = Math.sin(down);
    let k = 0;
    for (; k < n; k++) {
      const L = size * (0.8 + R() * 0.6), W = size * (0.5 + R() * 0.4), H = 0.45 + size * (0.18 + R() * 0.1), o = k * W * 0.75;
      const px = x + dx * o + (R() - 0.5) * size * 0.4, pz = z + dz * o + (R() - 0.5) * size * 0.4, col = QZ[Math.floor(R() * QZ.length)];
      const top = dip < 0.6 && R() < 0.75 ? SNOWC : [col[0] * 1.04, col[1] * 1.04, col[2] * 1.04];
      slab(g, [px, gH(px, pz) + H * 0.2, pz], L, W, H, rot + (R() - 0.5) * 0.2, dip * (0.85 + R() * 0.3), col, top);
    }
    return k;
  }

  // a spruce under tykky: a stack of white rime-snow blobs tapering up a leaning column, a green core showing between them, a white cap
  function tykky(g, x, y, z, h, R, A) {
    const la = R() * A.TAU, lean = R() * 0.05, lx = Math.cos(la) * lean, lz = Math.sin(la) * lean;
    A.ico(g, x + lx * h * 0.3 + (R() - 0.5) * h * 0.08, y + h * 0.36, z + lz * h * 0.3 + (R() - 0.5) * h * 0.08, h * 0.15, 2.4, R() < 0.5 ? NEEDLE : NEEDLE2, R, 0.3);
    for (let k = 0; k < 4; k++) {
      const f = 0.18 + k * 0.2, r = h * (0.2 - k * 0.035), w = 0.95 + R() * 0.05, col = k === 1 && R() < 0.4 ? RIME : SNOWC;
      A.ico(g, x + lx * h * f, y + h * f, z + lz * h * f, r, 1.25, [col[0] * w, col[1] * w, col[2] * w], R, 0.35);
    }
    A.ico(g, x + lx * h * 0.92, y + h * 0.9, z + lz * h * 0.92, h * 0.06, 1.7, SNOWC, R, 0.25);
  }

  // a birch in winter: a white trunk (its foot black, two dark marks), a lean, thin dark twigs reaching up and out from its upper half
  function birch(g, x, y, z, h, R, A) {
    const la = R() * A.TAU, lean = R() * 0.07, lx = Math.cos(la) * lean, lz = Math.sin(la) * lean, ouRod = A.ouRod;
    const at = (f) => [x + lx * h * f, y + h * f, z + lz * h * f], col = R() < 0.5 ? BIRCH : BIRCH2;
    ouRod(g, [x, y - 0.2, z], at(0.08), 0.17, FOOT, 5);
    ouRod(g, at(0.08), at(0.55), 0.14, col, 5); ouRod(g, at(0.55), at(1), 0.08, col, 5);
    for (let k = 0; k < 3; k++) { const f = 0.15 + R() * 0.5; ouRod(g, at(f), at(f + 0.03), f < 0.55 ? 0.15 : 0.09, MARK, 5); }
    for (let k = 0; k < 8; k++) {
      const f = 0.4 + k * 0.07 + R() * 0.05, a = R() * A.TAU, L = h * (0.22 + R() * 0.12), p = at(Math.min(0.95, f));
      ouRod(g, p, [p[0] + Math.cos(a) * L * 0.7, p[1] + L * 0.75, p[2] + Math.sin(a) * L * 0.7], 0.06, TWIG, 3);
    }
  }

  // the plan, made in keepOut (before the trees): where each thing stands, kept free of the buildings, the lifts, the runs, the water and the road
  function plan(push) {
    const A = World.api, T = A.T, def = T.def, gH = A.vrGround, R = A.rng(17171), S0 = T.startS || 0;
    const blds = (def.bld || []).map(b => [b[0], b[1], Math.max(b[2], b[3]) / 2 + 4]);
    const lines = [];
    for (const L of def.lifts || []) { const p = L[2] || []; for (let k = 0; k + 5 < p.length; k += 3) lines.push([p[k], p[k + 1], p[k + 3], p[k + 4]]); }
    const segD = (x, z, s) => { const vx = s[2] - s[0], vz = s[3] - s[1], l2 = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((x - s[0]) * vx + (z - s[1]) * vz) / l2)); return Math.hypot(x - s[0] - vx * t, z - s[1] - vz * t); };
    const roadOff = (x, z) => { const n = A.vrNear(x, z); return n.i < 0 ? 1e9 : n.dd; };
    const free = (x, z, r) => {
      if (roadOff(x, z) < 4 + r) return false;
      const lc = A.vrLC(x, z); if (lc === 5 || lc === 6 || lc === 3) return false;
      if (A.vrWater && A.vrWater(x, z).e > -3) return false;
      for (const b of blds) if (Math.hypot(x - b[0], z - b[1]) < b[2] + r) return false;
      for (const s of lines) if (segD(x, z, s) < 8 + r) return false;
      for (const p of def.pulls || []) if (Math.hypot(x - p[0], z - p[1]) < Math.max(p[2], p[3]) / 2 + 4 + r) return false;
      return true;
    };
    const P = { rock: [], tyk: [], bir: [] }, taken = [];
    const clash = (x, z, r) => taken.some(t => Math.hypot(x - t[0], z - t[1]) < t[2] + r);
    const take = (x, z, r, e) => { taken.push([x, z, r]); push(x, z, e); };
    // the summit's bare rock: no trees on its top
    push(SUMMIT[0], SUMMIT[1], 35);
    // the quartzite of the ridge: a jittered grid over the crest (high, or steep and high), within the terrain's reach of the road
    for (let gx = 1050; gx <= 1350; gx += 13) for (let gz = 450; gz <= 1000; gz += 13) {
      const x = gx + (R() - 0.5) * 11, z = gz + (R() - 0.5) * 11, h = gH(x, z), sl = A.vrSlope(x, z);
      if (h < 150 || !(sl > 0.25 || h > 165) || A.vrDist(x, z) > 185 || R() > 0.55) continue;
      const size = 2.2 + R() * 3.2; if (!free(x, z, size) || clash(x, z, size)) continue;
      P.rock.push([x, z, size]); take(x, z, size, size * 0.8);
    }
    // the quartzite beside the upper road: where it is steep, high or rock (9-60 m out)
    const sEnd = S0 + T.len;
    for (let s = S0 + 1100; s < sEnd; s += 8) for (const sd of [-1, 1]) {
      if (R() > 0.5) continue;
      const i = T.idx(s), o = 9 + Math.pow(R(), 1.3) * 50, x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o, h = gH(x, z);
      if (!(A.vrSlope(x, z) > 0.3 || h > 140 || A.vrLC(x, z) === 4)) continue;
      const size = 1.6 + R() * (o < 18 ? 1.4 : 2.6); if (!free(x, z, size) || clash(x, z, size)) continue;
      P.rock.push([x, z, size]); take(x, z, size, size * 0.8);
    }
    // the tykky spruces: above ~270 m (h 110 over the DEM's base), forest or open, off the runs, not too steep, 5-150 m from the road
    const cand = [];
    for (let gx = 680; gx <= 1360; gx += 8) for (let gz = 380; gz <= 1010; gz += 8) {
      const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = gH(x, z), lc = A.vrLC(x, z), dr = A.vrDist(x, z);
      if (h < 110 || (lc !== 0 && lc !== 1) || dr > 150 || A.vrSlope(x, z) > 0.9 || Math.hypot(x - SUMMIT[0], z - SUMMIT[1]) < 30) continue;
      if (lc === 0 && R() < 0.6) continue;
      cand.push([x, z, roadOff(x, z)]);
    }
    for (let k = cand.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)), t = cand[k]; cand[k] = cand[j]; cand[j] = t; }
    // (first those 7-45 m from the road, which the camera behind the car sees, then the rest out to the ridge)
    cand.sort((a, b) => (a[2] >= 7 && a[2] <= 45 ? 0 : 1) - (b[2] >= 7 && b[2] <= 45 ? 0 : 1));
    for (const [x, z] of cand) { if (P.tyk.length >= 110) break; if (!free(x, z, 1.5) || roadOff(x, z) < 5 || clash(x, z, 2)) continue; P.tyk.push([x, z, 7 + R() * 6]); take(x, z, 2, 2.5); }
    // the birches: in groups of 1-3 at the forest's edge beside the first half of the road (6-40 m out)
    for (let s = S0; s < S0 + 1100 && P.bir.length < 120; s += 6) for (const sd of [-1, 1]) {
      if (R() > 0.35) continue;
      const i = T.idx(s), o = 6 + R() * 34, x0 = T.px[i] + T.nx[i] * sd * o, z0 = T.pz[i] + T.nz[i] * sd * o, lc = A.vrLC(x0, z0);
      if (lc > 2) continue;
      const n = 1 + Math.floor(R() * 3);
      for (let k = 0; k < n; k++) { const x = x0 + (R() - 0.5) * 5, z = z0 + (R() - 0.5) * 5; if (!free(x, z, 0.5) || roadOff(x, z) < 6 || clash(x, z, 0.8)) continue; P.bir.push([x, z, 8 + R() * 6]); take(x, z, 0.8, 1.6); }
    }
    // the OSM places: the trees kept off them
    const line = (pl, r) => { for (const p of along(pl, 3)) push(p[0], p[1], r); };
    push(OSM.mast[0], OSM.mast[1], 6); push(OSM.board[0], OSM.board[1], 3); push(OSM.bikes[0], OSM.bikes[1], 6);
    line(OSM.funi, 3); line(OSM.wall, 2); for (const st of OSM.steps) line([st[0], st[1]], 2.5);
    for (const pl of OSM.ski) for (const p of along(pl, 4)) { const o = roadOff(p[0], p[1]); if (o > 3 && o < 70) push(p[0], p[1], 3.5); }
    // the bare quartzite the map has beside the upper road (natural=bare_rock): its outcrops on a jittered grid inside each polygon, 5-60 m out;
    // its cliffs (natural=cliff) a row of tall slabs along the line
    P.osmRock = 0; P.cliff = [];
    for (const pl of OSM.rock) {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pl) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let gx = x0; gx <= x1; gx += 6.5) for (let gz = z0; gz <= z1; gz += 6.5) {
        const x = gx + R() * 6, z = gz + R() * 6, o = roadOff(x, z);
        if (!inPoly(x, z, pl) || o < 8 || o > 60 || R() > 0.75) continue;
        const size = 1.4 + R() * (o < 20 ? 1.2 : 2.2); if (!free(x, z, size) || clash(x, z, size)) continue;
        P.rock.push([x, z, size]); take(x, z, size, size * 0.8); P.osmRock++;
      }
    }
    for (const cl of OSM.cliff) for (const p of along(cl, 4.2)) {
      const x = p[0] + (R() - 0.5), z = p[1] + (R() - 0.5), o = roadOff(x, z);
      if (o < 10 || o > 70 || clash(x, z, 1.2)) continue;
      P.cliff.push([x, z, p[2], (o < 25 ? 1.3 : 2.2) + R() * 1.4]); take(x, z, 1.5, 3);
    }
    return P;
  }

  function extra(ctx) {
    const { scen, out } = ctx, A = World.api, gH = A.vrGround, R = A.rng(27172);
    const P = PLAN || { rock: [], tyk: [], bir: [], cliff: [] };
    let slabs = 0;
    for (const [x, z, size] of P.rock) slabs += outcrop(scen.get(x, z), x, z, size, R, A);
    const rs = A.ROCK_SMOOTH; A.ROCK_SMOOTH = true;   // (the snow round and soft)
    for (const [x, z, h] of P.tyk) tykky(scen.get(x, z), x, gH(x, z) - 0.3, z, h, R, A);
    A.ROCK_SMOOTH = rs;
    for (const [x, z, h] of P.bir) birch(scen.get(x, z), x, gH(x, z), z, h, R, A);
    for (const [x, z, h, H] of P.cliff || []) {   // (the cliff: a tall slab, its face to the road's side, bare grey, the snow on its top)
      const col = QZ[Math.floor(R() * QZ.length)]; slab(scen.get(x, z), [x, gH(x, z) + H * 0.25, z], 4.4 + R(), 1.6 + R(), H, h, 0.12 + R() * 0.15, col, SNOWC); slabs++;
    }
    const roadOff = (x, z) => { const n = A.vrNear(x, z); return n.i < 0 ? 1e9 : n.dd; };
    const osm = { mast: mast(scen.get(OSM.mast[0], OSM.mast[1]), OSM.mast[0], OSM.mast[1], OSM.mast[2], A), funicular: funicular(scen, A, roadOff),
      steps: OSM.steps.reduce((a, st) => a + stairs(scen, A, st), 0), zebra: zebra(scen, A), bikes: bikes(scen, A), wall: wall(scen, A), board: board(scen, A),
      ski: skiTracks(scen, A, roadOff), rock: P.osmRock || 0, cliff: (P.cliff || []).length };
    out.koli = { outcrops: P.rock.length, slabs, tykky: P.tyk.length, birches: P.bir.length, osm };
    World.ext.koli.plan = P;   // (for the checks: tests/browser)
    if (World.ext.goreRob) World.ext.goreRob(ctx, 'koli');   // (the roadside ground from the chase camera: js/world-chase-bt*.js)
  }

  World.ext.koli = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1717, snow: 'all',
    road: { line: 'none' },
    trees: { kinds: ['fir', 'pine'], forest: 0.4, h: [9, 19] },
    bld: { walls: [[0.55, 0.16, 0.12], [0.8, 0.62, 0.3], [0.88, 0.87, 0.83], [0.5, 0.42, 0.34], [0.7, 0.7, 0.68], [0.6, 0.2, 0.15]],
      roofs: [[0.28, 0.29, 0.31], [0.4, 0.18, 0.14], [0.5, 0.52, 0.54]] },
    skiers: 50, nets: true, snowbanks: true,
    animals: [],
    keepOut: (push) => { PLAN = plan(push); },
    extra,
  });
})();
