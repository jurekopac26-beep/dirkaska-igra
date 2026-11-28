/* =========================================================================
   WORLD — Tuzla, Turčija (theme 'tuzla'): the circuit on the hills above Tuzla on the Asian side of Istanbul, its own parts on the shared
   builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.tuzla) goes on API.rbLook;
   World.ext.tuzla builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A12), the track: docs/proge/tuzla.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.build, LK.fl, LK.colMod): the trees of the dry hills by the Sea of Marmara
   (umbrella pines, Turkish red pines, the oaks and the bushes of the maquis: tzTreeGeo), the hills' grass burnt golden by the summer and the
   circuit's watered lawns green by the track, the roads round the circuit whole up to their ends or joins (TZ_WAYS: OpenStreetMap) as
   plain asphalt or bare earth on the ground, the short link across the infield and the drift course (TZ_LINK, TZ_DRIFT: OpenStreetMap), the buildings by the circuit
   (def.sk.bld) and 60-200 m off (TZ_BLD2: OpenStreetMap), the Turkish flag among the fans' flags (World.flagMesh's emblems, look.sym), red
   turn numbers. Only place names on its boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, RB, box, clamp, cyl, ico, lerp, nrGround, nrLCf, nrLump, nrNear, rng, sstep } = API;
  // the text boards: place names (the town, the city, the country, the villages and the district round the circuit, the region, the province
  // next door), the grandstands' names (def.stands), the start line's, the DRS boards
  const TZ_BAN = [['TUZLA', '#c8102e', '#fff', '#fff'], ['İSTANBUL', '#16213e', '#fff', '#c8102e'], ['BAŞLANGIÇ · BİTİŞ', '#16181c', '#fff', '#c8102e'], ['TÜRKİYE', '#c8102e', '#fff', '#fff'],
    ['AKFIRAT', '#16213e', '#fff', '#fff'], ['ANADOLU', '#1f5a8c', '#fff', '#fff'], ['MARMARA', '#1f5a8c', '#fff', '#c8102e'], ['KOCAELİ', '#16213e', '#fff', '#c8102e'],
    ['ORHANLI', '#2b4a2e', '#fff', '#fff'], ['DRS', '#101114', '#fff', '#39c84a']];
  const TZ_AT = { num: 0, brake: 14, ban: 17, rbr: 17, spielberg: 18 };   // atlas cells: the 14 turn numbers, the braking boards, the banners
  const TZ_SHIRTS = [[0.86, 0.1, 0.14], [0.95, 0.95, 0.93], [0.78, 0.08, 0.12], [0.14, 0.16, 0.3], [0.13, 0.13, 0.15], [0.4, 0.42, 0.46], [0.98, 0.82, 0.12], [0.2, 0.32, 0.62],
    [0.92, 0.92, 0.9], [0.55, 0.42, 0.3], [0.2, 0.46, 0.3], [0.86, 0.12, 0.16]];   // the fans' shirts at the end of the summer: lots of red and white, navy, black and grey, a few yellow, blue and green
  // the Turkish flag: red, the white crescent and star (World.flagMesh's emblems, look.sym), in the flag's height G: the crescent between the
  // circles of 0.25 G round 0.5 G from the pole and of 0.2 G round 0.5625 G, the star of 0.125 G round 0.8208 G, a point to the pole
  const TR = ((r, w) => Object.assign([r], { sym: [['moon', w, 0.5, 0.5, 0.25, 0.0625, 0.2], ['star', w, 0.8208, 0.5, 0.125, 0.0477, 5, Math.PI]] }))([0.86, 0.06, 0.1], [0.97, 0.97, 0.96]);

  // ---- the trees (unit height 1, instanced; LK.woods): 0 an umbrella pine (a bare trunk, a wide flat crown), 1 a Turkish red pine (a long
  //      trunk, orange high up, an open uneven crown of light green clumps), 2 an oak of the maquis (a short trunk, a round dark olive crown;
  //      squat: a bush); far from the road (k >= 3) plainer ----
  function tzTreeGeo(kind, far) {
    const g = new GB(), R = rng(9031 + kind * 7 + (far ? 1 : 0)), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.028, 0.76, far ? 3 : 4, [0.42, 0.32, 0.25], null, 0.02);
      ico(g, 0, 0.82, 0, 0.46, 0.3, [0.21, 0.33, 0.16], R, far ? 0.1 : 0.16);
      if (!far) { nrLump(g, 0.16, 0.88, 0.06, 0.26, 0.4, [0.18, 0.29, 0.14], R, 0.15); nrLump(g, -0.18, 0.86, -0.1, 0.22, 0.4, [0.23, 0.35, 0.17], R, 0.15); }
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.022, 0.42, 3, [0.36, 0.3, 0.25], null, 0.018); cyl(g, 0, 0.4, 0, 0.018, 0.48, 3, [0.64, 0.42, 0.25], null, 0.008);
      ico(g, 0.03, 0.8, 0, 0.21, 0.75, [0.27, 0.38, 0.17], R, 0.35);
      if (!far) { ico(g, -0.12, 0.66, 0.07, 0.16, 0.7, [0.24, 0.35, 0.15], R, 0.4); nrLump(g, 0.13, 0.6, -0.08, 0.14, 0.7, [0.26, 0.37, 0.16], R, 0.4); }
    } else {
      cyl(g, 0, -0.02, 0, 0.05, 0.3, 3, [0.33, 0.28, 0.23], null, 0.035);
      ico(g, 0, 0.56, 0, 0.42, 0.72, [0.22, 0.28, 0.14], R, 0.28);
      if (!far) nrLump(g, 0.16, 0.66, 0.1, 0.24, 0.7, [0.25, 0.31, 0.15], R, 0.3);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // on the land cover (0 the dry grass, 1 the groves, 2 the maquis, 3 the car parks and the town): the groves red pines in blocks of their
  // own (the noise), umbrella pines and oaks among them; the maquis bushes, a pine here and there; lone umbrella pines, pines and oaks on the
  // open hills and by the buildings
  const TZ_WOODS = {
    n: 3, geo: (k) => tzTreeGeo(k % 3, k >= 3), cr: [0.42, 0.26, 0.4], p: [0.006, 0.8, 0.35, 0.02],
    pick(cl, R, far, x, z) {
      const r = R(), r2 = R(), r3 = R(); let sp;
      if (cl === 1) sp = r < 0.15 ? 2 : API.NR.n1(x * 0.5 + 410, z * 0.5 - 230) < 0.45 ? 1 : 0;
      else if (cl === 2) sp = r < 0.85 ? 2 : 1;
      else sp = r < 0.45 ? 0 : r < 0.65 ? 1 : 2;
      const bush = sp === 2 && (cl === 2 || r3 < 0.5);
      let h = sp === 0 ? 9 + r2 * 6 : sp === 1 ? 12 + r2 * 7 : bush ? 1.6 + r2 * 1.8 : 6 + r2 * 4; if (far) h *= 1.06;
      return [sp, h, h * (sp === 0 ? 0.85 + r3 * 0.2 : sp === 1 ? 0.55 + r3 * 0.2 : bush ? 1.25 + r3 * 0.35 : 0.85 + r3 * 0.25)];
    },
  };

  // the circuit's own asphalt off the track (OpenStreetMap's highway=raceway: only the lines, no widths): the short link across the infield
  // (described there as for the shorter races: from the left of the track at 1,715 m to its right at 3,480 m), 12 m wide (the least for a
  // circuit's road), white edge lines; the drift course (sport=drifting), a closed loop of 364 m 74-164 m right of the track at 2,300 m,
  // 10 m wide (its hairpin's legs one asphalt wedge for ~37 m from the apex); x east, z south (m), as the track's
  const TZ_LINK = [559.3, -819.4, 531.5, -829.1, 521.5, -831.6, 514.4, -831.9, 507.2, -830.5, 499.9, -828.3, 490.4, -824.2, 479.4, -820.0, 467.6, -816.1, 455.1, -812.9,
    438.9, -810.4, 424.9, -809.7, 410.3, -810.8, 396.4, -813.5, 385.1, -816.7, 376.7, -819.5, 368.4, -823.4, 359.2, -828.2, 352.6, -832.2, 346.8, -836.8, 332.8, -848.9,
    326.5, -853.7, 318.9, -858.0, 310.1, -861.0, 301.0, -862.8, 291.9, -863.6, 280.8, -863.5, 272.2, -862.0, 264.9, -859.1, 258.1, -853.9, 254.4, -849.5, 250.6, -842.3, 243.9, -828.9];
  const TZ_DRIFT = [914.6, -801.5, 902.1, -831.4, 879.0, -849.3, 871.6, -850.7, 863.9, -849.8, 858.2, -846.4, 851.3, -839.0, 849.4, -831.7, 853.2, -825.5, 920.0, -764.2,
    926.5, -762.3, 938.9, -767.5, 947.7, -778.9, 952.5, -788.9, 956.8, -797.0, 958.7, -804.1, 958.9, -811.5, 956.8, -818.6, 948.9, -826.9, 939.9, -835.7, 929.8, -839.5,
    923.4, -841.4, 916.7, -840.0, 913.1, -833.6, 911.4, -826.9];
  const TZ_LW = 6, TZ_DW = 5;   // (half-widths)
  // the smaller buildings 60-200 m from the road (OpenStreetMap's building=yes, as def.sk.bld's within 60 m: [x, z, length, width, deg, height])
  const TZ_BLD2 = [-26.5, -440.5, 19.3, 12.8, -21, 5.5, 900.8, -868.0, 18.9, 11.8, -10, 5.5, -592.7, 18.8, 18.7, 12.1, 11, 5.5, 715.9, -311.4, 19.3, 12.4, 7, 5.5,
    155.1, -1045.3, 19.3, 12.8, -18, 5.5, 945.1, -709.6, 17.5, 12.4, 42, 5.5, 814.3, -1288.6, 100.0, 18.5, 10, 7.5, 75.5, -173.2, 41.9, 16.6, -11, 7.5,
    724.1, -1299.6, 17.6, 11.4, -9, 5.5, 353.8, -64.8, 19.0, 12.1, 78, 5.5, 361.8, -110.1, 35.5, 25.7, 53, 7.5, 380.9, -115.7, 21.2, 9.0, 52, 5.5,
    560.0, -214.0, 15.5, 5.3, 52, 3.2, 572.2, -203.2, 15.0, 11.6, 52, 5.5];
  // a way's points every ~4 m (a closed one back to its first)
  function tzPts(P, closed) {
    const p = []; for (let k = 0; k < P.length; k += 2) p.push([P[k], P[k + 1]]); if (closed) p.push(p[0]);
    const pts = []; for (let q = 0; q + 1 < p.length; q++) { const [ax, az] = p[q], [bx, bz] = p[q + 1], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4)); for (let t = 0; t < m; t++) pts.push([lerp(ax, bx, t / m), lerp(az, bz, t / m)]); }
    pts.push(p[p.length - 1]); return pts;
  }

  // LK.build: before the shared builder's marshal posts, TV towers, recovery trucks, photographers and car-park lots (each kept off what is
  // already kept clear): the link and the drift course (5 m past their edges: no trees, no huts; the people off them by the track), the
  // buildings by the circuit and 60-200 m off (11 m round one by the car parks' land cover: a lot's tents and cars reach ~10 m from where it
  // stands; 2 m round the others: the trees up to their walls; the people off them)
  function tzKeep({ def, exclPush, CR }) {
    for (const [P, hw, cl] of [[TZ_LINK, TZ_LW, false], [TZ_DRIFT, TZ_DW, true]]) {
      const pts = tzPts(P, cl);
      for (let q = 0; q < pts.length; q += 2) { const [x, z] = pts[q], nn = nrNear(x, z); exclPush(x, z, hw + 5); if (nn.i >= 0 && nn.dd < 70) CR.avoid(x, z, hw + 0.5); }
    }
    for (const B of [(def.sk || {}).bld || [], TZ_BLD2]) for (let k = 0; k < B.length; k += 6) {
      const [x, z, L, W, deg] = B.slice(k, k + 5), rot = deg * Math.PI / 180, n = Math.ceil(L / W), R = Math.hypot(L, W) / 2;   // (a long hall: a row of circles along it)
      let lot = false; for (let a = -R - 16; a <= R + 16 && !lot; a += 8) for (let b = -R - 16; b <= R + 16 && !lot; b += 8) lot = nrLCf(x + a, z + b, 3) > 0;   // (a lot stands on a car-park cell's centre: the share round it over 0 within a cell of it)
      for (let j = 0; j < n; j++) { const t = -L / 2 + L * (j + 0.5) / n; exclPush(x + Math.cos(rot) * t, z + Math.sin(rot) * t, Math.hypot(L / n, W) / 2 + (lot ? 11 : 2)); }
      CR.avoid(x, z, R + 1);
    }
  }

  // the roads round the circuit as in OpenStreetMap (2026-11-23, its main API), whole: the service roads (highway=service, the car parks'
  // aisles among them), the lanes and the residential streets they join (unclassified, residential) and the farm tracks (highway=track),
  // followed from those by the track along their joins up to 400 m from it (past that out of sight behind the hills), so that none ends
  // where OSM does not end it (the user's wish in the PR, 23. 11.); the tunnels under the track left out; [kind, x, z, ...]: 0 a service
  // road, 1 a lane or a street (asphalt), 2 a track or an unpaved way; x east, z south (m), as the track's
  const TZ_WAYS = [
    [0, 32.4, -986.3, 42, -985.3],
    [0, 23.2, -987.3, 32.4, -986.3],
    [2, 1201.8, -1370.9, 1173.9, -1343.9, 1156.3, -1297.6, 1152.5, -1275.5, 1156.9, -1149.4, 1167.8, -984, 1185.4, -770.6, 1185.9, -756.1, 1182.7, -740.9,
      1156.5, -638.2, 1110.6, -470.6, 1066.2, -315.2],
    [0, 494.8, -121.5, 490.9, -125, 373.9, -281.2],
    [0, 529.5, -272.7, 434.4, -200.4, 348.3, -132.5],
    [0, 327.2, -250.1, 391.9, -166.9, 442.1, -99.3],
    [0, 392.5, -286.7, 449.7, -212, 500.5, -143],
    [0, 358.7, -268.7, 420, -189, 469.6, -122.3],
    [0, 342, -261.2, 406.9, -178.7, 455.9, -110],
    [0, 314.3, -242, 428.1, -91.9],
    [0, 365.2, -145.8, 298.9, -233.2],
    [0, 350.9, -134.5, 285.4, -221.3],
    [0, 410.9, -290, 514.8, -151.5],
    [0, 529, -163.1, 475.9, -231.9, 427.4, -297.4],
    [0, 444.6, -300.3, 490.4, -243, 542, -174.3],
    [0, 553.6, -185.9, 503.4, -252.9, 463.7, -303.8],
    [0, 484, -308.9, 516.7, -263, 568, -193.8],
    [1, 1066.2, -315.2, 1071.3, -296.2],
    [0, -682.5, 187.7, -697.9, 174.6],
    [0, -49.5, 163.2, -41.2, 199.1, -62.8, 208.7, -88.2, 214.5],
    [0, -787.6, 312.9, -772.6, 297.1, -738.1, 264.3, -704.2, 236.6],
    [0, -749.6, 193.7, -780.1, 251.5, -802.5, 291.3],
    [2, -149.7, -911.5, -80.2, -856.7],
    [2, -22.4, -934.5, -47.7, -975.2, -55.2, -985.1, -61.7, -992],
    [2, -61.7, -992, -153.2, -1063.6],
    [0, 1030.1, -323.5, 1034.6, -336.4, 1035.7, -344.9, 1035, -361.3, 1030.9, -376, 1023.9, -393.5],
    [0, 607.9, -358.9, 597.2, -234.3, 608.3, -214.6, 612.8, -210.4, 621.6, -207.2],
    [0, 597.2, -234.3, 588.9, -199.4, 587.8, -195.7, 585.3, -191.6, 549.2, -162.8, 386, -38.8, 359.3, -19.3, 326, 1.8, 292.6, 20.7, 125.9, 109.9, 109.7, 116.6,
      69, 126.9, 1.3, 142.7, -168.6, 175.6, -200.2, 177.6, -213.7, 177.1, -276, 167.4, -379, 157.1, -450.8, 157.1, -502.3, 164.7, -563.7, 176.9, -620.7, 193.1,
      -638.9, 196.7, -657.2, 196.6, -672.9, 192.7, -682.5, 187.7],
    [0, -704.2, 236.6, -618.9, 200.4, -559.9, 185.5, -473.6, 167, -448.5, 163.5, -416.6, 161.8, -391.7, 162.6, -341.9, 166.4, -276, 174.8, -232.4, 183, -211.2,
      184.8, -193.4, 185.1, -167, 183.9, -95, 172.6, 55.4, 141.5, 107.3, 126.3, 121.2, 120.5, 197.5, 79.4, 318.6, 13.1, 351.5, -6.3, 385, -29.6, 579.1, -174.4,
      611.4, -199.1, 697.6, -267.2, 761.7, -309.4, 809.1, -324.8, 942.4, -350.8, 972.6, -358.9, 992.5, -369.2, 1006.6, -378.9, 1019.7, -389.6, 1029.6, -398.7,
      1052.1, -424.2, 1067, -447.6, 1086, -495.3, 1097.9, -566, 1113.7, -634.3, 1132.7, -778.8, 1143.1, -915.1, 1136.8, -1067.6, 1118.2, -1135.1, 1069.5,
      -1216.9, 1023.8, -1262.4, 949.8, -1307.4],
    [0, -422.9, -260.3, -430.1, -245.2, -429.6, -232.1],
    [0, -429.6, -232.1, -412.4, -201.5, -407.7, -190.2],
    [0, -284.8, -18.8, -286, -38.7, -296.8, -115.6, -290.6, -145.7, -197.9, -166.9, 21.6, -211.9, 88, -219.1, 103.2, -233.4, 109.7, -264.5, 128, -308.2, 155,
      -346.8, 174.3, -368.5, 195.3, -401.2, 209.3, -446.2, 216.3, -462.9, 235.1, -465.1, 258.7, -458.4, 288.5, -453, 334, -454.3, 430.2, -460.6, 475.1, -466.6,
      560.7, -480.3, 567.6, -480.3, 575, -479.3, 581.9, -476.8, 594.9, -469.2, 599.9, -465.2, 605.9, -458.4, 610.8, -449.7, 612.7, -441.6, 612, -433],
    [0, -767.4, 227.2, -774.7, 248.6, -775.6, 260.1, -768.8, 268.4, -760.2, 271.1, -750.9, 270.7, -738.1, 264.3],
    [0, -697.9, 174.6, -704.4, 169.3, -711.4, 168.1, -721.5, 168.8, -728.5, 172.5, -749.6, 193.7],
    [0, -704.2, 236.6, -684.8, 219.6, -677.5, 204.3, -677.9, 198.4, -682.5, 187.7],
    [0, -697.9, 174.6, -710.2, 155.6, -713.1, 147, -714.9, 135.8, -703, 53.6, -685.2, -24.7, -645.2, -92.1, -579.6, -157, -470.4, -226.2, -443.1, -236.2,
      -429.6, -232.1],
    [0, 670.5, -304, 658.5, -295.1, 654.4, -290.6, 652.9, -284.4, 655.6, -276.7, 664.2, -259.7, 663, -254.4, 658, -243.4, 642.5, -231.5, 612.8, -210.4],
    [0, -279.1, 30.9, -226.8, 24.5, 115.3, -44.1, 125.2, -49.2, 168.3, -62.4, 176.2, -67.5, 185, -78.1, 187.8, -91.1, 186.9, -108.6, 181.3, -130.9, 170.2,
      -163.2, 158.5, -188.2, 153, -205.8, 151.6, -218.7, 153.4, -236.3, 165.5, -270.1, 174.8, -290, 186.9, -309.9, 194.3, -318.7, 311.3, -387.6, 331.7, -401,
      345.7, -408.9, 404.4, -419.8, 498.2, -438.9, 581, -430.1, 661, -419.2, 670.9, -418.7, 681.3, -424.1, 689, -432.3, 692.8, -450.9, 694, -467.8, 673.1,
      -591.8, 673.7, -598.9, 693.4, -606, 756.5, -608.2, 822.3, -591.8, 828.9, -594.6, 832.2, -598.4, 834.3, -611, 831, -625.2, 825.6, -637.2, 815.7, -652.5,
      785.5, -678.7, 768.5, -687.4, 543.1, -796.7, 527.8, -798.3, 515.7, -794.5, 450.5, -787.4, 426.9, -787.4, 383.6, -791.8, 361.6, -792.3, 336.4, -796.7,
      299.1, -806, 279.9, -805.4, 273.3, -800.5, 264, -790.7, 237.7, -733.9, 100, -318.2, -350.2, -166.8, -360.6, -161.4, -372.7, -152.6, -508.7, -81.6,
      -514.7, -72.9, -510.4, -63.6, -499.4, -61.4, -421, -62.5, -413.8, -57.6, -413.8, -45.6, -425.9, 41.9, -425.3, 50.6, -417.8, 56.2, -407.8, 57.1, -279.1,
      30.9, -284.8, -18.8],
    [2, -181.7, -811.8, -91, -849.8, -80.2, -856.7],
    [2, -80.2, -856.7, -75.7, -861.1, -10, -952.1, 4.2, -971, 11.8, -978.2, 23.2, -987.3, 32.8, -998.1, 44.7, -1018.8, 59.2, -1053.2, 106.2, -1185.7, 117.9,
      -1213.1, 123.8, -1222.1, 135.5, -1236.4, 151.3, -1253.7, 187, -1288.5, 225.2, -1332.2, 253.1, -1365.3, 270.6, -1393.5, 276.9, -1406, 288.3, -1439.3,
      304.7, -1471.1],
    [2, 1142.7, -1436.2, 1141.6, -1400, 1148.4, -1382.8, 1164.5, -1355.9, 1173.9, -1343.9],
    [0, 950, -283.8, 1001.5, -302.4, 1008.9, -305.9, 1015.2, -310.4, 1026.3, -321, 1034.9, -325.7, 1039.9, -326.4, 1048.6, -325.3, 1057.3, -322.3, 1066.2,
      -315.2],
    [0, 1066.2, -315.2, 1049.6, -389.6],
    [0, 1023.9, -393.5, 1038.4, -395.4, 1044.9, -393.2, 1049.6, -389.6, 1050.3, -409.4, 1052.1, -424.2],
    [0, 42, -985.3, 91.2, -980.2],
    [2, -120.9, -888.8, -112.3, -905.6, -106.1, -915.5, -70.9, -964, -63.7, -980.6, -61.7, -992],
    [0, -250, 76.4, 150.5, -3.3, 299.2, -35.1, 312.3, -38.7, 314.1, -40.9, 315.6, -45, 315.4, -49.5, 313.1, -63.8, 310.1, -73.2, 306.4, -82.2, 298.7, -95.1,
      288.5, -109.6, 261, -145.5, 254.7, -154.3, 251.1, -160.5, 246, -171.9, 233.5, -207.9, 231.9, -216.4, 231.9, -223, 232.9, -228.9, 234.8, -234, 238.6,
      -239.1, 263.5, -265.1, 289.5, -288.2, 320, -307.2, 345.1, -319.6, 374.2, -332.3, 398.6, -340.1, 438.5, -350.1, 475.1, -358.1, 494.7, -361.1, 510.7,
      -362.1, 531.7, -360.2, 537.6, -360.8, 551, -363.5, 571.8, -364.9, 593, -365.1, 613.7, -363.3, 749.7, -346.3, 754.3, -346.7, 756.8, -348.6, 760.1, -354.1,
      768.4, -371.1, 776.7, -396.6, 780, -412.3, 782, -427.1, 782.8, -444.4, 781.4, -461.8, 781.4, -473.6, 782.4, -480.8, 785.7, -489.6, 789.8, -497.3, 794.8,
      -503.7, 802.2, -509.6, 809.5, -514.1, 815, -516.2, 822.9, -518.2, 832.9, -518.6, 846.1, -517, 858, -517, 867.9, -519, 874.2, -521.1, 882.8, -527, 892.7,
      -536.4, 902.1, -548, 910.3, -560.7, 915.3, -571.1, 919, -584, 920.6, -598.7, 920.8, -612, 919, -626.9, 915.1, -642.4, 909.4, -658.2, 899.9, -675.8,
      889.5, -690.1, 872, -708, 847.8, -729.7, 812.6, -754.8, 788.1, -770.6, 763.3, -785.3, 688.4, -813.5, 577.9, -853.1, 494.5, -880.9, 485.1, -886.3, 479.4,
      -891.6, 475.5, -898.3, 473.1, -906.9, 472.1, -916.3, 472.7, -921.2, 476.1, -928.1, 480.6, -933.2, 486.7, -936.7, 494.7, -939.8, 503.4, -942, 512.2,
      -942.9, 526.4, -941.6, 623.9, -923.4, 655.8, -916.1, 743.6, -890.3, 757.8, -886.9, 770, -885, 853.5, -878.9, 876.5, -878.1, 889.9, -878.5, 903.3, -881.6,
      917.2, -886.7, 926.5, -891.6, 935.3, -898.1, 945.1, -907.1, 953.8, -916.7, 961.5, -929.6, 969.1, -945.5, 976.8, -964.9, 980.7, -979.6, 983.1, -991.5,
      985.8, -1011.3, 986.8, -1030.3, 987, -1043.4, 986.2, -1055.7, 983.9, -1074.7, 981.6, -1086.1, 980.1, -1093.7, 975, -1109.8, 966.8, -1129.2, 956.5,
      -1149.1, 948.1, -1162.1, 940.4, -1172.1, 929, -1183.4, 902.1, -1204.7, 887.5, -1214.3, 871.8, -1222.8, 853.5, -1231.4, 834.9, -1238.6, 810.1, -1246.1,
      783.1, -1251.5, 772.7, -1251.9, 726.1, -1250.4, 711, -1249, 685.4, -1244.1, 662.6, -1238.8, 637.3, -1230, 571.6, -1200.6, 528, -1180.3, 462.3, -1151.5,
      308.6, -1087.3, 136.3, -1026.8, 132.6, -1025, 130.3, -1022.4, 129.9, -1019.5, 135.7, -987.8, 137.7, -980.9, 141.1, -974.7, 143.4, -971.7, 173.3, -959.2,
      186.5, -951.6, 191.4, -947.2, 210.5, -923.9, 215.2, -915.7, 217.7, -909.5, 218.9, -902.4, 218.7, -886.9, 200.2, -815.3, 192, -755, 189.2, -742.2, 184.5,
      -726.2, 116.3, -509.8, 112.9, -501, 109.4, -494.1, 94.1, -469.4, 86.6, -459.8, 76.6, -450.1, 68.3, -443, 57.5, -435, 46.3, -427.9, -126.1, -334.7,
      -332.3, -226.2, -385.4, -196.8, -461.5, -156.7, -545.3, -110.5, -645.5, -56.2, -648.9, -53.7, -650.6, -51.1, -649.8, -44.7, -644.5, -31.6, -638.2, -20.6,
      -634.1, -15.9, -629.4, -12.5, -617.2, -7.9, -581.8, 1.2, -547, 6.5, -530.9, 7.2, -522.8, 9, -516.9, 11.7, -511.1, 15.7, -505.9, 20.9, -503.6, 25.8,
      -502.4, 30.9, -502.8, 37, -506.8, 54.9, -507.2, 64.5, -506, 75.4, -503.8, 86.7, -500.9, 95.8, -496.9, 104.4, -491.8, 112.2, -486.6, 118.3, -478.3, 125.9,
      -469.6, 131.5, -462, 135.4, -453.5, 138.4, -443.1, 140.4, -431.6, 140.9, -420.8, 139.3, -411.1, 136.9, -401.7, 133.5, -327.9, 101, -306.5, 93.5, -250,
      76.4],
    [0, 949.8, -1307.4, 877.1, -1321.3, 817, -1325.8, 774.5, -1322.7, 677.4, -1307.8, 550.5, -1266, 452.9, -1222.8, 326.3, -1171, 208.6, -1123.8, 159.8,
      -1101.8, 125.5, -1070.7, 102.9, -1037.9, 94.7, -1007, 91.2, -980.2, 88.5, -946.1, 78.1, -886.3, 66.3, -832.3, 22.5, -716.7, -14.5, -645.6, -50.2, -584.9,
      -115.2, -491.7, -201.1, -407.6, -287.8, -339.7, -402.5, -271.3, -516.8, -209.6, -558.8, -182.2, -595.8, -152.5, -642.8, -104.8, -678.9, -57.1, -699.7,
      -15.7, -704.7, 18.5, -721.8, 118.4, -737.6, 169.7, -749.6, 193.7],
    [0, -378.6, -139, -356.9, -97.2, -342.9, -52.2, -337.9, -28.3, -327.5, -19.3, -312.2, -17.1, -292.7, -17.1, -284.8, -18.8],
    [0, 542.6, -361.8, 545.8, -304.7, 548.2, -293.5, 552.9, -283.7, 556.9, -278.5, 562.5, -273.7, 571.8, -268.6, 580.7, -265.8, 599.6, -262.5]
  ];

  // the roads round the circuit (TZ_WAYS: OSM): the service roads plain asphalt 5 m wide, the lanes and the streets 6 m, on the ground, three
  // points across every 4 m (the terrain under it), 8 cm over it and drawn over it; the tracks 3.5 m of bare earth, paler between the ruts
  // (their own mesh, no picture); not inside the barriers nor within 4 m past them (the run-offs are the
  // builder's), the trees and the people off them. In the same mesh the link and the drift course (TZ_LINK, TZ_DRIFT: five points across,
  // 10 cm over the ground, the circuit's darker asphalt; the link not within 1.5 m past the barriers: behind the track's, as its gates),
  // the drift course rising 4 cm along its loop (its hairpin's legs, one over the other near the apex, never in the same place); the
  // link's white edge lines in their own mesh (3 cm over its asphalt and drawn over it)
  function tzRoads({ root, tex, exclPush, CR }, st) {
    const rb = new RB(true), eb = new RB(true), col = [0.9, 0.9, 0.92], EA = [0.6, 0.47, 0.34], EM = [0.7, 0.57, 0.42];
    for (const W of TZ_WAYS) {
      const kind = W[0], HW = kind === 2 ? 1.75 : kind === 1 ? 3 : 2.5, B = kind === 2 ? eb : rb, C = kind === 2 ? [EA, EM, EA] : [col, col, col];
      const pts = tzPts(W.slice(1), false), rows = [];
      let along = 0;
      for (let q = 0; q < pts.length; q++) {
        const [x, z] = pts[q], a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)], dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1;
        if (q) along += Math.hypot(x - pts[q - 1][0], z - pts[q - 1][1]);
        const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 4 + HW) { rows.push(null); continue; }
        const nx = -dz / dl, nz = dx / dl;
        rows.push({ row: [-HW, 0, HW].map(o => { const px = x + nx * o, pz = z + nz * o; return [px, nrGround(px, pz) + 0.08, pz]; }), along });   // (left to right in the way's direction: (nx, nz) its right)
        if (q % 2 === 0) { exclPush(x, z, HW + 1.5); if (nn.i >= 0 && nn.dd < 70) CR.avoid(x, z, HW + 0.5); }
        st[kind === 2 ? 'track' : 'road'] += 4;
      }
      // the rows kept: from one kept row the next is the farthest (up to 24 m on) that the straight surface between them leaves within 3 cm
      // of every 4 m row between (its three points: the ground and the way's line), so a straight way over even ground takes few rows and a
      // bend or a hump all it has (the 8 cm lift never under the ground)
      const fits = (i, j) => { for (let k = i + 1; k < j; k++) { const t = (rows[k].along - rows[i].along) / (rows[j].along - rows[i].along || 1);
        for (let c = 0; c < 3; c++) for (let d = 0; d < 3; d++) if (Math.abs(lerp(rows[i].row[c][d], rows[j].row[c][d], t) - rows[k].row[c][d]) > 0.03) return false; } return true; };
      let prev = -1;
      for (let q = 0; q < rows.length;) {
        if (!rows[q]) { prev = -1; q++; continue; }
        const R = rows[q], r = B.row(R.row, C, R.row.map((e, j) => [j * HW / 4, R.along / 4]));
        if (prev >= 0) B.link(prev, r, 0, 2); prev = r;
        let j = q + 1; while (rows[j] && j + 1 < rows.length && rows[j + 1] && rows[j + 1].along - R.along <= 24 && fits(q, j + 1)) j++;   // (a row left out next to the track ends the strip: nothing is measured across it)
        q = j;
      }
    }
    if (!eb.empty) { const m = new THREE.Mesh(eb.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'tuzla tracks'; root.add(m); }
    const lb = new RB(), LC = [0.94, 0.94, 0.9], CE = [0.8, 0.8, 0.82], ED = [0.84, 0.84, 0.86];
    for (const [P, hw, cl] of [[TZ_LINK, TZ_LW, false], [TZ_DRIFT, TZ_DW, true]]) {
      const pts = tzPts(P, cl), n = pts.length, O = [-hw, -hw / 2, 0, hw / 2, hw], LO = [-(hw - 0.2), -(hw - 0.5), hw - 0.5, hw - 0.2];
      let prev = -1, lp = -1, along = 0;
      for (let q = 0; q < n; q++) {
        const [x, z] = pts[q], a = pts[q ? q - 1 : cl ? n - 2 : 0], b = pts[q < n - 1 ? q + 1 : cl ? 1 : q], dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1;
        if (q) along += Math.hypot(x - pts[q - 1][0], z - pts[q - 1][1]);
        const nx = -dz / dl, nz = dx / dl, up = 0.1 + (cl ? 0.04 * q / (n - 1) : 0);
        const row = O.map(o => { const px = x + nx * o, pz = z + nz * o; return [px, nrGround(px, pz) + up, pz]; });
        if (row.some(p => { const nn = nrNear(p[0], p[2]); return nn.i >= 0 && nn.dd < 1.5; })) { prev = lp = -1; continue; }
        const r = rb.row(row, [ED, CE, CE, CE, ED], O.map(o => [(o + hw) / 8, along / 8]));
        if (prev >= 0) rb.link(prev, r, 0, 4); prev = r;
        if (!cl) {   // (on the asphalt between its points across)
          const ln = LO.map(o => { const j = Math.min(3, Math.floor((o + hw) / (hw / 2))), t = (o - O[j]) / (hw / 2); return [x + nx * o, lerp(row[j][1], row[j + 1][1], t) + 0.03, z + nz * o]; });
          const l = lb.row(ln, [LC, LC, LC, LC]); if (lp >= 0) { lb.link(lp, l, 0, 1); lb.link(lp, l, 2, 3); } lp = l;
        }
        st[cl ? 'drift' : 'link'] += 4;
      }
    }
    if (!lb.empty) { const m = new THREE.Mesh(lb.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 }));
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'tuzla link lines'; root.add(m); }
    if (rb.empty) return;
    const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'tuzla service roads'; root.add(m);
  }

  // A building by the circuit. OSM holds its outline only (building=yes: no height, no roof, no use) and its height is the track data's
  // estimate by its footprint (tools/tuzla/build.py): what its walls and its roof carry is plain and generic, none of it surveyed
  // (docs/proge/tuzla.md), none of it a sign or a name. A darker plinth; windows in a row on the long walls and on the short ones, a door on
  // a long wall (panes and leaf a hand's width proud of the wall, the panes lighter toward their tops: the sky in them); then by its kind:
  //   0 a flat roof behind a parapet (its outer, top and inner faces), an air conditioner or two and a hatch on it; two rows of windows
  //     where it is tall enough for two storeys;
  //   1 a low hipped roof of tiles (18 degrees at most, the building's height its ridge's) over a 0.45 m eave with its fascia, in courses
  //     from the eave to the ridge, a shade lighter and darker in turn (seen from above: the rows), the eave's the darkest;
  //   2 a big hall: cladding, a band of glazing under the eaves of both long walls, roller doors along one, a ridged roof of metal sheets
  //     at 6 degrees (sheets 2.4 m wide, lighter and darker in turn, a rooflight in every fourth).
  // Hashed from where it stands (the world's random stream untouched); in the scenery's chunk (no draw of its own; ~300-450 vertices, the 100 m hall ~1000)
  const TZ_PANE = [[0.15, 0.19, 0.25], [0.31, 0.39, 0.49]], TZ_DOOR = [0.4, 0.36, 0.31], TZ_ROLL = [0.61, 0.65, 0.7], TZ_UNIT = [[0.76, 0.77, 0.78], [0.62, 0.64, 0.66]], TZ_LITE = [0.74, 0.79, 0.8];
  function tzBld(g, x, y, z, L, W, rot, h, wc, rc, kind) {
    if (W > L) return tzBld(g, x, y, z, W, L, rot + Math.PI / 2, h, wc, rc, kind);   // (the long side along local x)
    const c = Math.cos(rot), s = Math.sin(rot), P = (lx, ly, lz) => [x + lx * c - lz * s, y + ly, z + lx * s + lz * c], sc = (cl, k) => [cl[0] * k, cl[1] * k, cl[2] * k];
    const H = rng((Math.round(x * 10) * 73856093) ^ (Math.round(z * 10) * 19349663) ^ 4421), a = L / 2, b = W / 2, inn = [x, y + h / 2, z], PR = 0.07;
    // a pane on a wall: sd -1 / 1 the long walls (local z), -2 / 2 the short ones (local x); u along the wall, from y0 to y1 over the ground
    const pane = (sd, u, w, y0, y1, c0, c1, pr) => { const Q = Math.abs(sd) === 1 ? (uu, yy) => P(uu, yy, sd * (b + pr)) : (uu, yy) => P(sd / 2 * (a + pr), yy, uu);
      g.quadO(Q(u - w / 2, y0), Q(u + w / 2, y0), Q(u + w / 2, y1), Q(u - w / 2, y1), c0, inn, null, [c0, c0, c1, c1]); };
    const rise = kind === 1 ? Math.min((b + 0.45) * 0.325, h * 0.4) : kind === 2 ? (b + 0.3) * 0.105 : 0.42, he = h - rise;   // (the walls' top: the eave, the flat roof's deck)
    box(g, x, y - 0.4, z, L + 0.1, 0.95, W + 0.1, rot, sc(wc, 0.7), null, true);   // the plinth
    box(g, x, y - 0.4, z, L, he + 0.4, W, rot, wc, kind ? wc : rc, true);
    if (kind === 2) {
      // the hall: bays of ~4.8 m; glazing under the eave, a roller door in every third bay of one long wall (the first by its hash)
      const nb = Math.max(2, Math.round((L - 1.2) / 4.8)), bw = (L - 1.2) / nb, d0 = Math.floor(H() * 3);
      for (let k = 0; k < nb; k++) { const u = -a + 0.6 + bw * (k + 0.5);
        for (const sd of [-1, 1]) pane(sd, u, bw - 0.7, he - 1.7, he - 0.6, TZ_PANE[0], TZ_PANE[1], PR);
        if (k % 3 === d0 && bw > 4.2) pane(1, u, 3.7, 0.1, Math.min(4.3, he - 2.1), sc(TZ_ROLL, 0.86), TZ_ROLL, PR + 0.03); }
      // its roof: the gables' triangles flush with the short walls, the sheets from the eaves to the ridge
      const ae = a + 0.3, be = b + 0.3, ns = Math.max(2, Math.round(2 * ae / 2.4)), sw = 2 * ae / ns, top = [x, y + he - 3, z];
      for (const sd of [-1, 1]) g.triO(P(sd * a, he, -b), P(sd * a, he, b), P(sd * a, h, 0), wc, inn);
      for (let k = 0; k < ns; k++) for (const sd of [-1, 1]) { const u0 = -ae + sw * k, u1 = u0 + sw, f = (k % 2 ? 0.95 : 1.04) * (0.97 + 0.06 * H());
        g.quadO(P(u0, he - 0.03, sd * be), P(u1, he - 0.03, sd * be), P(u1, h, 0), P(u0, h, 0), sc(rc, f), top);
        if (k % 4 === 1) { const e = (t) => [he - 0.03 + (h - he + 0.03) * t + 0.05, sd * be * (1 - t)], [y0, z0] = e(0.22), [y1, z1] = e(0.8);
          g.quadO(P(u0 + 0.35, y0, z0), P(u1 - 0.35, y0, z0), P(u1 - 0.35, y1, z1), P(u0 + 0.35, y1, z1), TZ_LITE, top); } }
      return;
    }
    // the windows: every ~3.1 m along the long walls, ~3.4 m along the short ones; a door in place of one on a long wall's ground floor
    const rows = kind === 0 && he > 4.6 ? 2 : 1, st = he / rows, wy = Math.min(1.25, st - 0.95 - 0.3), nl = Math.max(1, Math.floor((L - 1.6) / 3.1)), ns = Math.floor((W - 1.6) / 3.4), dk = Math.floor(H() * nl), ds = H() < 0.5 ? -1 : 1;
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < nl; k++) for (const sd of [-1, 1]) { const u = -a + 0.8 + (L - 1.6) / nl * (k + 0.5);
        if (!r && k === dk && sd === ds) pane(sd, u, 1.15, 0.12, Math.min(2.2, he - 0.25), sc(TZ_DOOR, 0.85), TZ_DOOR, PR + 0.03);
        else if (wy > 0.45) pane(sd, u, 1.45, r * st + 0.95, r * st + 0.95 + wy, TZ_PANE[0], TZ_PANE[1], PR); }
      if (wy > 0.45) for (let k = 0; k < ns; k++) for (const sd of [-2, 2]) pane(sd, -b + 0.8 + (W - 1.6) / ns * (k + 0.5), 1.3, r * st + 0.95, r * st + 0.95 + wy, TZ_PANE[0], TZ_PANE[1], PR);
    }
    if (kind === 1) {
      // the hipped roof: the eave's rectangle shrinking to the ridge, a course at a time; the fascia under the eave
      const ae = a + 0.45, be = b + 0.45, n = Math.max(2, Math.min(5, Math.round(Math.hypot(be, rise) / 1.1))), low = [x, y + he - 3, z], fc = sc(wc, 0.62);
      const R4 = (t, dy) => { const u = ae - be * t, v = be * (1 - t), yy = he + rise * t + (dy || 0); return [P(-u, yy, -v), P(u, yy, -v), P(u, yy, v), P(-u, yy, v)]; };
      const F0 = R4(0, -0.18), F1 = R4(0); for (let e = 0; e < 4; e++) g.quadO(F0[e], F0[(e + 1) % 4], F1[(e + 1) % 4], F1[e], fc, inn);
      for (let k = 0; k < n; k++) { const A = R4(k / n), B = R4((k + 1) / n), f = k === 0 ? 0.84 : k === n - 1 ? 0.9 : k % 2 ? 0.94 : 1.03;
        for (let e = 0; e < 4; e++) { const cb = sc(rc, f * (e % 2 ? 0.96 : 1) * (e > 1 ? 1.03 : 1));
          if (k === n - 1 && e % 2) g.triO(A[e], A[(e + 1) % 4], B[e], cb, low);   // (a hip's last course: a triangle up to the ridge's end)
          else g.quadO(A[e], A[(e + 1) % 4], B[(e + 1) % 4], B[e], cb, low); } }
      return;
    }
    // the flat roof: the parapet round the deck (the walls carried up 0.42 m, a paler coping, the inner face in its own shade), what stands on it
    const pw = 0.26, C4 = [[-a, -b], [a, -b], [a, b], [-a, b]], I4 = C4.map(([u, v]) => [u - Math.sign(u) * pw, v - Math.sign(v) * pw]), up = [x, y + he - 3, z], mid = [x, y + h + 3, z];
    for (let e = 0; e < 4; e++) { const [u0, v0] = C4[e], [u1, v1] = C4[(e + 1) % 4], [i0, j0] = I4[e], [i1, j1] = I4[(e + 1) % 4];
      g.quadO(P(u0, he, v0), P(u1, he, v1), P(u1, h, v1), P(u0, h, v0), wc, inn);
      g.quadO(P(u0, h, v0), P(u1, h, v1), P(i1, h, j1), P(i0, h, j0), sc(wc, 1.04), up);
      g.quadO(P(i0, he, j0), P(i1, he, j1), P(i1, h, j1), P(i0, h, j0), sc(wc, 0.8), [(P(u0, h, v0)[0] + P(u1, h, v1)[0]) / 2 * 2 - mid[0], mid[1], (P(u0, h, v0)[2] + P(u1, h, v1)[2]) / 2 * 2 - mid[2]]); }
    const units = L > 8 && W > 6 ? 1 + Math.floor(H() * 2) : 0;
    for (let k = 0; k < units; k++) { const q = P((H() - 0.5) * (L - 4.5), he, (H() - 0.5) * (W - 4.5)); box(g, q[0], q[1], q[2], 0.95, 0.62, 0.72, rot + (H() < 0.5 ? 0 : Math.PI / 2), TZ_UNIT[0], TZ_UNIT[1], true); }
    if (units) { const q = P((H() < 0.5 ? -1 : 1) * (a - 1.6), he, (H() - 0.5) * (W - 3.5)); box(g, q[0], q[1], q[2], 0.95, 0.28, 0.95, rot, sc(TZ_UNIT[1], 0.92), TZ_UNIT[1], true); }
  }

  // the dry hills' own low growth past the barriers, ~8-55 m off (the land cover's dry grass and maquis, as the trees': def.lc, ESA
  // WorldCover; the lawns by the track watered and mown, the builder's tufts on them): on the dry grass straw tussocks, a tall dry stalk with
  // its spent seed head here and there, a low dark bush now and then; in the maquis mostly the bushes. Generic, none of it a surveyed plant:
  // the end of the summer's colours (the look: early September), as the ground's straw (colMod). Off the roads, the buildings, the lots and
  // every leg of the track (nrNear: beyond any barrier); in the scenery's chunks (no draw of its own), hashed (rng 9041: the world's stream
  // untouched); both faces of a blade, lit as the ground under it (its normals up)
  const TZ_UP = [0, 1, 0];
  function tzTussock(g, x, y, z, h, R) {   // 5 blades leaning out from a 0.12 m foot, darker straw at the foot, pale at the tips (30 vertices)
    const k = 0.9 + 0.2 * R(), base = [0.5 * k, 0.43 * k, 0.26 * k], tip = [0.86 * k, 0.76 * k, 0.5 * k], a0 = R() * 6.283;
    for (let b = 0; b < 5; b++) {
      const a = a0 + b * 1.2566 + (R() - 0.5) * 0.5, ca = Math.cos(a), sa = Math.sin(a), w = 0.09 * h + 0.03, lean = (0.35 + 0.3 * R()) * h, hh = h * (0.75 + 0.35 * R());
      const p = [x + ca * 0.12 - sa * w, y, z + sa * 0.12 + ca * w], q = [x + ca * 0.12 + sa * w, y, z + sa * 0.12 - ca * w], t = [x + ca * (0.12 + lean), y + hh, z + sa * (0.12 + lean)];
      g.triN(p, q, t, TZ_UP, TZ_UP, TZ_UP, base, base, tip); g.triN(q, p, t, TZ_UP, TZ_UP, TZ_UP, base, base, tip);
    }
  }
  function tzStalk(g, x, y, z, h, R) {   // a tall dry stalk, two thin crossed blades, its spent seed head a flat brown fan on top (39 vertices)
    const st = [0.62, 0.53, 0.34], hd = [0.46, 0.36, 0.22], hd2 = [0.6, 0.49, 0.31], a0 = R() * 3.14, w = 0.025, tx = (R() - 0.5) * 0.2, tz = (R() - 0.5) * 0.2, top = [x + tx, y + h, z + tz];
    for (const a of [a0, a0 + 1.571]) {
      const c = Math.cos(a) * w, s = Math.sin(a) * w, p = [x - c, y, z - s], q = [x + c, y, z + s];
      g.triN(p, q, top, TZ_UP, TZ_UP, TZ_UP, st); g.triN(q, p, top, TZ_UP, TZ_UP, TZ_UP, st);
    }
    const r = 0.14 + 0.1 * R(), c0 = [top[0], top[1] + 0.05, top[2]];
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * 6.283, b = (k + 1) / 9 * 6.283;
      g.triN(c0, [top[0] + Math.cos(b) * r, top[1], top[2] + Math.sin(b) * r], [top[0] + Math.cos(a) * r, top[1], top[2] + Math.sin(a) * r], TZ_UP, TZ_UP, TZ_UP, hd2, hd, hd);
    }
  }
  function tzVeg({ scen, excluded }, st) {
    const T = API.T, L = T.len, R = rng(9041), q = { i: -1 };
    let n = [0, 0, 0];
    for (let s = 0; s < L; s += 2.4) for (const side of [-1, 1]) for (let t = 0; t < 1; t++) {
      const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], u = R(), d = bar + 8 + 48 * Math.pow(u, 1.4);
      const x = T.px[i] + T.nx[i] * d * side + (R() - 0.5) * 2.4, z = T.pz[i] + T.nz[i] * d * side + (R() - 0.5) * 2.4, r1 = R(), r2 = R(), r3 = R();
      const dry = nrLCf(x, z, 0), mq = nrLCf(x, z, 2);
      if (r1 > (dry + mq) * (1 - 0.35 * u)) continue;
      const nn = nrNear(x, z), dd = nn.i >= 0 ? nn.dd : 99; if (r1 > (dry + mq) * sstep(6, 20, dd)) continue;   // (off the watered lawn by every leg: on the straw, as colMod's)
      if (excluded(x, z)) continue;
      const y = nrGround(x, z) - 0.03, g = scen.get(x, z);
      if (r2 < mq / (dry + mq + 1e-6) * 0.8 || r2 < 0.2) {   // a low bush of the maquis: one or two soft lumps, dark olive
        const h = 0.7 + 0.8 * r3, c = [0.22 + 0.04 * r3, 0.28 + 0.03 * r3, 0.14];
        nrLump(g, x, y + h * 0.35, z, h * 0.75, 0.75, c, R, 0.3);
        if (r3 > 0.5) nrLump(g, x + 0.5 * h, y + h * 0.2, z - 0.3 * h, h * 0.5, 0.7, [c[0] * 1.08, c[1] * 1.05, c[2]], R, 0.3);
        n[2]++;
      } else if (r2 < 0.36) { tzStalk(g, x, y, z, 1.1 + 0.8 * r3, R); n[1]++; }
      else { tzTussock(g, x, y, z, 0.85 + 0.6 * r3, R); n[0]++; }
    }
    st.tussocks = n[0]; st.stalks = n[1]; st.bushes = n[2];
  }

  // LK.extra: the service roads, the link, the drift course, the buildings by the circuit and 60-200 m off (OSM outlines: white or cream
  // render, grey cladding on the big halls; their roofs grey and flat or of terracotta tiles: tzBld); before the crowds and the trees (the
  // buildings kept clear in tzKeep)
  function tzExtra(o) {
    const { scen } = o, sk = API.T.def.sk || {}, R = rng(9037), st = { road: 0, track: 0, link: 0, drift: 0, buildings: 0, runoff: 0 };
    tzRunoff(o, st);   // (before the service roads: of the meshes under the root so far)
    tzRoads(o, st);
    const b6 = sk.bld || [], WALL = [[0.93, 0.91, 0.86], [0.9, 0.85, 0.74], [0.84, 0.82, 0.78], [0.72, 0.73, 0.75]], ROOF = [[0.36, 0.37, 0.39], [0.62, 0.32, 0.22], [0.48, 0.49, 0.5]];
    for (const B of [b6, TZ_BLD2]) for (let k = 0; k < B.length; k += 6) {
      const [x, z, L, W, deg, h] = B.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      const wc = h > 6 ? WALL[3] : WALL[Math.floor(R() * 3)], ri = h > 6 ? 0 : Math.floor(R() * 3);   // (the colours as they were drawn for the boxes)
      tzBld(scen.get(x, z), x, y, z, L, W, rot, h, wc, ROOF[ri], h > 6 ? 2 : ri === 1 ? 1 : 0);
      st.buildings++;
    }
    tzVeg(o, st);   // (after the buildings: they and the roads are kept clear already, tzKeep)
    return st;
  }

  // the shaders' hash and noise (the run-offs', the ground's)
  const TZ_FN = [
    'float tzHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }',   // (no sine: steady on phones' GPUs)
    'float tzNoise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(tzHash(i), tzHash(i + vec2(1.0, 0.0)), u.x), mix(tzHash(i + vec2(0.0, 1.0)), tzHash(i + vec2(1.0, 1.0)), u.x), u.y); }'].join('\n');

  /* ---- the paved run-offs: their own surface on the shared builder's one run-off material ----
     The circuit's run-offs are wide sheets of asphalt, and the chase camera fills the frame with them at every other corner. A sheet that
     size is laid by a paver in lanes along the track, each lane in a day's lengths: lanes 5.2 m wide in lengths of 58-88 m, staggered from
     lane to lane, each length its own shade (the mix, its age), a sealed joint between two of them (a thin dark line, spread over the
     pixel it falls in: no shimmer further out), the paver's faint streaks along the lane; the dust and the dry grit the wind leaves along
     the outer edge by the barrier; here and there the two dark lines of a car that ran wide and came back. All of it generic wear, none of it
     surveyed: OSM holds the run-offs' outlines at most (docs/proge/tuzla.md). No paint (the builder's green band and the words lie on top).
     The builder's quads carry the track's own frame in one more attribute (tzRo: metres across from the centreline, negative on the left;
     metres along; metres to the sheet's outer and inner edges): no extra draw, no extra vertices. The renderer's asphalt sheen and the rain
     chain on this material's shader after it (render.js, asphaltLook): only the colour changes here. */
  const TZ_RO_GLSL = [
    'varying vec4 vTzRo; varying vec2 vTzRw;', TZ_FN,
    // a line's cover of the pixel: d metres from its middle, hw its half width, aw the pixel's width across it
    'float tzLine(float d, float hw, float aw) { aw = max(aw, 1e-4); return clamp((hw + 0.5 * aw - d) / aw, 0.0, min(1.0, 2.0 * hw / aw)); }',
    // the marks of a car that ran wide: one per 110 m and side at most, a shallow arc out from the track's edge and back (s along, sd the side, di from the inner edge, aw the pixel)
    'float tzMark(float s, float sd, float di, float aw, float fk) {',
    '  float sb = s + fk * 47.0, b = floor(sb / 110.0), u = sb - b * 110.0; vec2 hs = vec2(b * 3.17 + sd * 41.0 + fk * 7.0, b * 1.31 + 5.0 + fk * 3.0);',
    '  float len = 40.0 + 45.0 * tzHash(hs + 19.7), t = (u - (110.0 - len) * tzHash(hs + 43.1)) / len, amp = len * (0.03 + 0.05 * tzHash(hs + 71.3));',
    '  float dd = abs(abs(di - (amp * 4.0 * t * (1.0 - t) - 0.5)) - 0.8);   // (the two wheels 1.6 m apart)',
    '  return step(tzHash(hs), 0.62) * step(0.0, t) * step(t, 1.0) * smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.7, 1.0, t)) * tzLine(dd, 0.11, aw) * (0.5 + 0.5 * tzNoise(vec2(u * 0.9, b * 13.0 + fk * 5.0)));',
    '}'].join('\n');
  function tzRunoff({ root, tex, out }, st) {
    const T = API.T, N = T.N, w = T.w, eps = 0.004;
    let mat = null;   // the run-offs' material: the asphalt's picture, neither the road's own nor a layer laid over it; told by its first vertex (the builder's colour, its 8 m picture)
    for (const m of root.children) {
      const mm = m.material; if (!m.isMesh || !mm || !mm.isMeshLambertMaterial || mm.map !== tex.asphalt || mm === out.asphaltMat || mm.polygonOffset) continue;
      const { color: C, uv: U, position: P } = m.geometry.attributes; if (!C || !U || !P || !P.count || P.count % 6) continue;
      if (Math.abs(C.getX(0) - 1.02) < eps && Math.abs(C.getZ(0) - 1.04) < eps && Math.abs(U.getX(0) - P.getX(0) / 8) < 0.01 && Math.abs(U.getY(0) + P.getZ(0) / 8) < 0.01) { mat = mm; break; }
    }
    if (!mat) return;
    const lat = (p, i) => (p[0] - T.px[i]) * T.nx[i] + (p[2] - T.pz[i]) * T.nz[i], gap = (p, q) => Math.hypot(p[0] - q[0], p[2] - q[2]), same = (p, q) => p[0] === q[0] && p[1] === q[1] && p[2] === q[2];
    const across = (p) => {   // the sample a point of the sheet's inner edge lies across from
      let bi = 0, bs = 1e9;
      for (let i = 0; i < N; i++) { const dx = p[0] - T.px[i], dz = p[2] - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], e = Math.max(0, Math.abs(dx * T.nx[i] + dz * T.nz[i]) - w - 4), q = al * al + e * e; if (q < bs) { bs = q; bi = i; } }
      return bi;
    };
    for (const m of root.children) {
      if (m.material !== mat) continue;
      const P = m.geometry.attributes.position.array, n = P.length / 3, A = new Float32Array(n * 4);
      for (let q = 0; q < n; q += 6) {   // a quad of the builder's: (a, b, c) and (a, c, d), either one perhaps turned over: a and b across from sample i (inner, outer), c and d from i + 1 (outer, inner)
        const v = [0, 1, 2, 3, 4, 5].map(k => [P[(q + k) * 3], P[(q + k) * 3 + 1], P[(q + k) * 3 + 2]]), set = (k, x, s, o, i) => A.set([x, s, o, i], (q + k) * 4);
        const c1 = same(v[1], v[4]) || same(v[1], v[5]) ? 1 : same(v[2], v[4]) || same(v[2], v[5]) ? 2 : 0;
        if (!c1 || !same(v[0], v[3])) { for (let k = 0; k < 6; k++) set(k, 2.6, 20, 99, 99); st.runoffOdd = (st.runoffOdd || 0) + 1; continue; }   // (not the builder's quad: plain, no joints, no dust)
        const b1 = 3 - c1, c2 = same(v[4], v[c1]) ? 4 : 5, d2 = 9 - c2, i = across(v[0]), j = (i + 1) % N, sd = lat(v[0], i) < 0 ? -1 : 1, wi = gap(v[0], v[b1]), wj = gap(v[d2], v[c1]);
        const la = Math.abs(lat(v[0], i)), lb = Math.abs(lat(v[b1], i)), lc = Math.abs(lat(v[c1], j)), ld = Math.abs(lat(v[d2], j)), s0 = i * T.ds, s1 = s0 + T.ds;
        set(0, sd * la, s0, wi, 0); set(3, sd * la, s0, wi, 0); set(b1, sd * lb, s0, 0, wi); set(c1, sd * lc, s1, 0, wj); set(c2, sd * lc, s1, 0, wj); set(d2, sd * ld, s1, wj, 0);
        st.runoff++;
      }
      m.geometry.setAttribute('tzRo', new THREE.BufferAttribute(A, 4));
    }
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      prev.call(mat, sh, r);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 tzRo; varying vec4 vTzRo; varying vec2 vTzRw;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvTzRo = tzRo; vTzRw = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + TZ_RO_GLSL).replace('#include <color_fragment>', `#include <color_fragment>
        {
          float rSd = step(0.0, vTzRo.x), rL = abs(vTzRo.x), rS = vTzRo.y, rAl = fwidth(vTzRo.x), rAs = fwidth(vTzRo.y), rAi = fwidth(vTzRo.w);
          float rLn = floor(rL / 5.2), rLf = rL - rLn * 5.2;   // the lane, the metres across it
          float rLen = 58.0 + 30.0 * tzHash(vec2(rLn * 7.13 + rSd * 31.7, 11.0)), rSo = rS + 90.0 * tzHash(vec2(rLn * 3.31 + rSd * 17.9, 23.0)), rB = floor(rSo / rLen), rBf = rSo - rB * rLen;   // the lane's lengths, staggered
          float rT1 = tzHash(vec2(rB * 1.37 + rLn * 17.0, rLn * 5.11 + rSd * 9.0 + 2.0)), rT2 = tzHash(vec2(rB * 2.11 + 5.0, rLn * 3.7 + rSd * 13.0 + 7.0));
          vec3 rC = (0.93 + 0.12 * rT1) * mix(vec3(0.98, 1.0, 1.025), vec3(1.03, 1.0, 0.965), rT2);   // a length's shade: darker and bluer the newer, paler and warmer the older
          rC *= 1.0 + (tzNoise(vec2(rL * 2.1 + rB * 7.0, rSo * 0.035 + rLn * 3.0)) - 0.5) * 0.06 * clamp(0.3 / max(rAl, 1e-4), 0.0, 1.0);   // the paver's streaks along the lane
          float rN = tzNoise(vTzRw * 0.31), rN2 = tzNoise(vTzRw * 0.071 + 13.0);
          rC *= 0.96 + 0.08 * rN2;   // (the sheet's own patches, 14 m)
          float rJ = max(tzLine(min(rLf, 5.2 - rLf), 0.035, rAl), tzLine(min(rBf, rLen - rBf), 0.035, rAs));   // the sealed joints: between two lanes, across a lane at a length's end
          rC *= 1.0 - 0.4 * rJ;
          rC *= 1.0 - 0.3 * max(tzMark(rS, rSd, vTzRo.w, rAi, 0.0), tzMark(rS, rSd, vTzRo.w, rAi, 1.0));
          float rDu = (1.0 - smoothstep(0.5, 9.0, vTzRo.z)) * (0.2 + 0.8 * rN) * (0.45 + 0.55 * rN2) + (1.0 - smoothstep(0.0, 1.4, vTzRo.z)) * 0.5;   // dust and grit toward the outer edge, a strip of it along the edge itself
          diffuseColor.rgb *= rC * mix(vec3(1.0), vec3(1.3, 1.2, 1.0), clamp(rDu, 0.0, 1.0) * 0.55);
        }`);
    };
    mat.customProgramCacheKey = () => 'tzRunoff';
    mat.extensions = { derivatives: true };   // (fwidth: WebGL 1 needs the extension)
    mat.needsUpdate = true;
  }

  /* ---- the ground (LK.ground): Tuzla's own, in place of World's grassLook (which leaves alone a material it finds marked) ----
     The chase camera looks down at the ground 5-80 m ahead: what counts there is the grain. One tileable 256 px detail picture, read in world
     space at two scales (2.3 m: the stalks and the grit under the car; 9 m: the same further out, bent by the patches' noise so that the tile
     does not show): r the grain (dry stalks lying every way, the gaps between them), g and b the relief's slope (clods, tussocks, stones: lit
     on the sun's side, dark on the far side, none in shadow), a the stones. No extra draw, no extra vertices: the shared builder's one ground
     material (the terrain's tiles, the mown verges). */
  let tzGPix = null, tzGMean = 0.5;
  function tzTex() {
    const S = 256;
    if (!tzGPix) {
      const R = rng(9041), A = new Float32Array(S * S), H = new Float32Array(S * S), B = new Float32Array(S * S);
      const pn = (cells, seed) => { const r = rng(seed), g = new Float32Array(cells * cells); for (let k = 0; k < g.length; k++) g[k] = r();   // (value noise that wraps: tileable)
        return (u, v) => { const fx = u * cells, fz = v * cells, i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, sa = a * a * (3 - 2 * a), sb = b * b * (3 - 2 * b), i0 = i % cells, j0 = j % cells, i1 = (i0 + 1) % cells, j1 = (j0 + 1) % cells;
          return lerp(lerp(g[j0 * cells + i0], g[j0 * cells + i1], sa), lerp(g[j1 * cells + i0], g[j1 * cells + i1], sa), sb); }; };
      const n1 = pn(5, 9042), n2 = pn(13, 9043), n3 = pn(37, 9044), n4 = pn(90, 9045);
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const k = j * S + i, u = i / S, v = j / S;
        A[k] = 0.5 + (n3(u, v) - 0.5) * 0.16 + (n4(u, v) - 0.5) * 0.14 + (R() - 0.5) * 0.1;
        H[k] = n1(u, v) * 6 + n2(u, v) * 4 + n3(u, v) * 1.6 + n4(u, v) * 0.5; }   // (the heights in texels: the clods)
      const at = (u, v) => (((v % S) + S) % S) * S + ((u % S) + S) % S;   // (wrapped at the edges)
      const dot = (px, py, w) => { const i = Math.floor(px), j = Math.floor(py), a = px - i, b = py - j;   // a soft point of a stalk: the grain, and a little height where it is a pale one
        for (const [di, dj, q] of [[0, 0, (1 - a) * (1 - b)], [1, 0, a * (1 - b)], [0, 1, (1 - a) * b], [1, 1, a * b]]) { const k = at(i + di, j + dj); A[k] += w * q; if (w > 0) H[k] += w * q * 1.3; } };
      for (const [n, len, w] of [[1500, 26, 0.2], [1300, 20, -0.17], [260, 34, 0.34], [240, 12, -0.3]])   // the dry stalks: pale ones lying every way, the dark gaps between them
        for (let k = 0; k < n; k++) { let x = R() * S, y = R() * S, a = R() * Math.PI * 2; const l = len * (0.45 + R() * 0.9), bend = (R() - 0.5) * 0.05, ww = w * (0.6 + R() * 0.8) * 0.7;
          for (let t = 0; t < l; t += 0.7) { a += bend; x += Math.cos(a) * 0.7; y += Math.sin(a) * 0.7; dot(x, y, ww); } }
      const mound = (px, py, rr, ht, stone) => {   // a tussock or a clod (a soft mound, paler on its top), or a stone (a dome, in the stones' channel, its own even tone)
        const tone = 0.46 + R() * 0.12;
        for (let v = Math.floor(py - rr - 1); v <= Math.ceil(py + rr + 1); v++) for (let u = Math.floor(px - rr - 1); u <= Math.ceil(px + rr + 1); u++) {
          const q = Math.hypot(u + 0.5 - px, v + 0.5 - py) / rr; if (q >= 1) continue;
          const k = at(u, v), dm = stone ? Math.sqrt(1 - q * q) : (1 - q * q) ** 2; H[k] += ht * dm;
          if (stone) { const cov = clamp((1 - q) * rr, 0, 1); B[k] = Math.max(B[k], cov); A[k] = lerp(A[k], tone, cov); } else A[k] += (dm - 0.3) * 0.1; } };
      for (let k = 0; k < 260; k++) { const rr = 2.5 + R() * 4.5; mound(R() * S, R() * S, rr, rr * (0.2 + R() * 0.25), false); }   // tussocks and clods
      for (let k = 0; k < 14; k++) { const rr = 1.6 + R() * 2; mound(R() * S, R() * S, rr, rr * 0.8, true); }   // stones
      for (let k = 0; k < 90; k++) { const rr = 0.7 + R() * 0.7; mound(R() * S, R() * S, rr, rr * 0.8, true); }   // grit
      const d = new Uint8Array(S * S * 4); let sum = 0;
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const k = j * S + i, o = k * 4, gx = (H[at(i + 1, j)] - H[at(i - 1, j)]) * 0.5, gz = (H[at(i, j + 1)] - H[at(i, j - 1)]) * 0.5;   // (the slope along the picture's u and v: the world's x and z)
        d[o] = Math.round(clamp(A[k], 0, 1) * 255); d[o + 1] = Math.round(clamp(0.5 + gx * 0.5, 0, 1) * 255); d[o + 2] = Math.round(clamp(0.5 + gz * 0.5, 0, 1) * 255); d[o + 3] = Math.round(B[k] * 255); sum += d[o]; }
      tzGPix = d; tzGMean = sum / (S * S) / 255;
    }
    const t = new THREE.DataTexture(tzGPix, S, S, THREE.RGBAFormat);   // (a DataTexture: a canvas would premultiply the stones' alpha into the other channels; its rows are the picture's v as they are)
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true; return t;
  }
  const TZ_GLSL = 'varying vec2 vTzW; varying float vTzD; uniform vec3 uTzAvg; uniform sampler2D uTzT; uniform float uNat; uniform float uPat;\n' + TZ_FN;
  function tzGround(m, ownTex) {
    const avg = (m.map && m.map.avgCol) || [0.35, 0.49, 0.22], t = ownTex(tzTex()), mean = tzGMean.toFixed(3), nat = (API.T && API.T.def && API.T.def.grassNat) || 0;
    m.userData.grassLook = true;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTzAvg = { value: new THREE.Vector3(avg[0], avg[1], avg[2]) }; sh.uniforms.uTzT = { value: t }; sh.uniforms.uNat = { value: nat }; sh.uniforms.uPat = m.userData.uPat || (m.userData.uPat = { value: 1 });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vTzW; varying float vTzD;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvTzW = (modelMatrix * vec4(transformed, 1.0)).xz; vTzD = -mvPosition.z;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + TZ_GLSL).replace('#include <color_fragment>', `#include <color_fragment>
        float tzE = 0.0;
        {
          const vec3 LUM = vec3(0.3, 0.59, 0.11);
          vec3 base = vColor * uTzAvg, gc = diffuseColor.rgb;   // (base: the colour the vertex colours mean, over the grass picture's average)
          float gg = clamp((base.g - max(base.r, base.b)) * 8.0, 0.0, 1.0), near = (1.0 - smoothstep(30.0, 90.0, vTzD)) * uPat, mid = (1.0 - smoothstep(110.0, 300.0, vTzD)) * uPat;
          float n1 = tzNoise(vTzW * 0.025) * 0.65 + tzNoise(vTzW * 0.07 + 13.1) * 0.35, n2 = tzNoise(vTzW * 0.045 + 57.3);
          vec2 uC = vTzW * 0.11 + (vec2(n1, n2) - 0.5) * 0.35 + vec2(0.61, 0.17), uD = vTzW * 0.43 + vec2(0.23, 0.71);
          vec4 tC = texture2D(uTzT, uC), tD = texture2D(uTzT, uD);
          float grain = (tD.r - ${mean}) * near, grainC = (tC.r - ${mean}) * mid;
          if (gg > 0.0) {   // the mown lawns (green vertex colours): grassLook's lighter, darker and drier patches, its clumps and its tone; the blades' grain on top
            gc *= mix(1.0, 0.84 + 0.3 * n1, gg * uPat);
            gc = mix(gc, gc * vec3(1.12, 1.04, 0.7), gg * smoothstep(0.62, 0.95, n2) * 0.6 * uPat);
            float cl = tzNoise(vTzW * 0.55 + 3.7) * 0.6 + tzNoise(vTzW * 1.7 + 9.1) * 0.4;
            gc *= 1.0 + gg * (cl - 0.5) * 0.22 * (1.0 - smoothstep(70.0, 160.0, vTzD));
            if (uNat > 0.0) { float L = dot(gc, LUM); gc = mix(gc, mix(vec3(L), gc, 0.72) * vec3(1.04, 0.96, 0.86), gg * uNat); }
            gc *= 1.0 + grain * vec3(0.44, 0.5, 0.3) + grainC * 0.22;
          }
          vec3 dry = gc;
          if (gg < 1.0) {   // the dry hills: paler and deeper patches tens of metres across, soil where the grass is thin, pale stones on it, the stalks
            float n3 = tzNoise(vTzW * 0.19 + 21.7) * 0.6 + tzNoise(vTzW * 0.53 + 5.3) * 0.4;
            float tl = dot(texelColor.rgb, LUM) / dot(uTzAvg, LUM), bare = smoothstep(0.54, 0.72, n3 * 0.62 + n2 * 0.3 + grainC * 0.5) * uPat;
            dry = diffuse * base * mix(1.0, 0.9 + 0.2 * n1, uPat); float dl = dot(dry, LUM);
            dry = mix(dry, dl * vec3(1.08, 0.9, 0.7) * 0.82, bare * 0.7);
            dry = mix(dry, dl * vec3(1.2, 1.17, 1.08), max(tD.a * near, tC.a * mid * 0.8) * (0.2 + 0.8 * bare) * 0.85);
            dry *= mix(1.0, tl, 0.3) * (1.0 + grain * vec3(0.62, 0.6, 0.42) * mix(1.0, 0.6, bare) + grainC * vec3(0.34, 0.33, 0.24));
          }
          diffuseColor.rgb = mix(dry, gc, gg);
          #if NUM_DIR_LIGHTS > 0
            vec3 tzL = (vec4(directionalLights[0].direction, 0.0) * viewMatrix).xyz; float tzOl = length(tzL.xz);   // (the sun's direction in the world)
            vec2 tzS = ((tD.gb - 0.502) * near + (tC.gb - 0.502) * mid * 0.8) * 2.0;   // (the relief's slope along the world's x and z)
            tzE = -dot(tzS, tzL.xz / max(tzOl, 1e-3)) * min(tzOl / max(tzL.y, 0.2), 2.5) * mix(1.0, 0.45, gg);
          #endif
        }`)
        .replace('reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();', 'reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask() * clamp( 1.0 + tzE, 0.45, 1.6 );');
    };
    m.customProgramCacheKey = () => 'tzGroundN';   // (N: the lawn toned as grassLook's natural grass; the look's test counts it)
    m.needsUpdate = true;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    tuzla: { ban: TZ_BAN, at: TZ_AT, nums: 14, numC: ['#c8102e', '#fff', '#fff'], shirts: TZ_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.1, 1.02, 0.84], gravel: false, noVid: true,
      pitBox: [-260, 90, -1], mow: 0.7,   // (the pit building on the left of the main straight, its garages from the pit entry's end to Turn 1's brakes; fainter mowing stripes; no farms on the circuit's hills)
      woods: TZ_WOODS, extra: tzExtra, build: tzKeep, ground: tzGround, lane: true, fl: { tr: TR }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      flags: { stand: [{ tr: 0.8, tm: 0.2 }, { tr: 0.7, tm: 0.2, rb: 0.1 }], ga: { tr: 0.75, tm: 0.25 }, camp: { tr: 0.85, tm: 0.15 }, pole: 'tr', podium: 'tr' },
      vid: [], poles: [-240, 120, 1], runoff: ['TUZLA', 'İSTANBUL', 'TÜRKİYE'], straight: [-300, 130, 1],
      farm: { wall: [0.93, 0.9, 0.84], roof: [0.62, 0.32, 0.22], end: [0.9, 0.87, 0.8], barn: [0.55, 0.45, 0.35], barnRoof: [0.62, 0.32, 0.22], barnEnd: [0.52, 0.42, 0.32] },
      tvSkip: [2, 4, 5, 10, 12], recov: [0, 7, 11], photo: [0, 3, 7, 8, 11], jets: [[0.86, 0.06, 0.1], [0.97, 0.97, 0.97], [0.86, 0.06, 0.1]],   // (TV towers at the big corners, not at the kinks and the second parts of the double corners)
      colMod: (P) => (x, z, c, dd) => {   // Istanbul at the end of the summer: the hills' grass burnt golden, in paler and browner patches; the circuit's watered lawns green by the track; the maquis dark olive
        const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.94 + (n - 0.5) * 0.18 + (m - 0.5) * 0.1;
        const fm = nrLCf(x, z, 0), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3), far = sstep(8, 26, dd == null ? 99 : dd), v = 0.92 + 0.12 * m;   // (the lawns by the track watered: green)
        c[0] *= k; c[1] *= k; c[2] *= k * 0.96;
        const dry = (0.9 + 0.1 * sstep(0.35, 0.7, P.n3(x * 0.7 + 90, z * 0.7 - 40))) * (fm + sc) * far;   // (the open hills and the ground between the maquis' bushes)
        if (dry > 0) { const q = sstep(0.3, 0.75, P.n1(x * 0.9 - 210, z * 0.9 + 75));   // (straw, paler and browner in patches: over the olive grass picture)
          c[0] = lerp(c[0], lerp(1.95, 2.3, q) * v, dry); c[1] = lerp(c[1], lerp(1.16, 1.42, q) * v, dry); c[2] = lerp(c[2], lerp(1.45, 2.1, q) * v, dry); }
        if (sc > 0) { const t = sc * 0.5; c[0] = lerp(c[0], 1.3 * v, t); c[1] = lerp(c[1], 1.0 * v, t); c[2] = lerp(c[2], 0.95 * v, t); }   // (the maquis' ground darker, olive brown)
        if (se > 0) { const t = se * 0.85 * far; c[0] = lerp(c[0], 1.8 * v, t); c[1] = lerp(c[1], 1.24 * v, t); c[2] = lerp(c[2], 2.4 * v, t); }   // (the big car parks round the circuit: paved, dusty grey)
      } },
  });
  World.keep('NR', 'tuzla');   // (its grids kept between its builds; World.build frees the others')
  World.ext.tuzla = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
