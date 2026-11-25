/* ===================================================================================================================================
   WORLD — Krásna Hôrka, Slovakia: the roadside from OpenStreetMap (23. 11. 2026), laid over the gore world js/world-krasnahorka.js builds
   -----------------------------------------------------------------------------------------------------------------------------------
   How: World.ext.krasnahorka is wrapped; while it runs, World.gore.build gets this file's keepOut (no trees on the ways and the
   furniture) and extra (their meshes) after its own. js/world-krasnahorka.js and js/tracks/krasnahorka.js are not changed.
   Drawn (OSM), every way out to 150 m from the road (the comment after each says how much of it that is):
     roads the route meets below the castle hill: w1537287677 (lanes=3: 9 m, 3 m a lane assumed) and w1187075392 (6 m, the class as
     tools/proga-uvoz.mjs gives it), asphalt (w1074458713 between them and the route lies under the game's own asphalt already);
     service roads at the bus parking and the castle car park (w1187075389, w4209126, w4631437, w1537314273: no width tagged, 4.8 m, the
     class; no surface tagged: asphalt, as the importer takes it);
     tracks (highway=track, no width tagged: 3 m assumed): tracktype=grade3 as gravel (w98243592, w130653663, w1537275011, w371790336),
     grade4, grade5 and untagged as earth with grass between the ruts (assumed) (w1214398626, w130653925, w1168112212, w130653683,
     w112475824, w1074457591, w589056750);
     footways from the bus parking up to the castle (w1537282643, w1537282644, w1537276183, w1537276182, w1537314271, w1537314272 and the
     steps w1537282645, drawn as the footway: treads and handrail not modelled): no width nor surface tagged, 2 m of gravel (assumed);
     paths (highway=path, no width tagged: 1.2 m of earth, the class): w130653777, w130653826, w589056749, w1177540602, w983797785,
     w43102471, w850258810, w1302914616, w1306889502, w1306890335;
     the road being built to the castle w1486339347 (highway=construction, construction=service, surface=gravel, width=5; OSM's note:
     the bed is ready, no base nor paving yet): 5 m of raw gravel;
     furniture, all blank (no text, no signs): the board n9855313827, the picnic table n9855313826, the firepit n9855313824 and the waste
     basket n9855313825 by the start, the pillar hydrant n14003123613 (red, as tagged); their looks are assumed, and one OSM has nearer
     the road than the barrier line (the game's road is wider there than OSM's: the car would drive through it) stands 0.8 m past that
     line on its own side: the board 8.8 m from the road's middle (OSM 5.9 m), the hydrant 10.1 m (OSM 6.3 m).
   A way stops at the asphalt's edge, at a car park's edge and at the edge of a wider way it meets; its free ends (and where the 150 m
   end) fade into the ground. The side roads the game draws already (def.sideRoads, w1168112211 among them) are left as they are; the ways
   stop at their edges too.
   Not drawn: the guard rail w1214398625 (OSM has it 2 to 7 m from the road's middle, the game's barrier line is 10 to 16 m out there:
   at the road's edge the car would drive through it, on the barrier line it would stand in the meadow), the hiking guidepost n1278281799
   (1.7 m from the road's middle: on the game's asphalt), the power lines (w972269670, w972269673: 625 m and more from the road),
   fences (172 m and more), the wall (312 m), the gate (175 m), the two tracks and the lift gate behind the start (w711107174,
   w130757822, n6685233601: behind the grid, never in the camera), the adit, survey points, passing places and signs, the parking
   w1537278790 (the game's own pull stands there), OSM's buildings (def.bld draws them).
   No new def.sideRoads, stubs or gaps: driving, physics and def.hills are unchanged.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), 23. 11. 2026
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.gore || !World.ext || typeof World.ext.krasnahorka !== 'function') return;
  const API = World.api, { GB, clamp, vrGround, vrNear } = API;

  // ---- the data: x east, z south, metres from the track's origin; [kind, x, z, ...] ----
  const WAYS = [
    [0, -748.2, 972.4, -766.0, 909.3],   // w1537287677
    [1, -726.9, 1048.7, -748.2, 972.4],   // w1187075392, 79 m of it
    [2, -882.0, 963.9, -902.1, 954.3, -910.2, 954.7, -915.4, 957.9, -919.2, 964.5, -921.5, 992.7, -924.3, 1001.2, -940.0, 1036.3, -961.9, 1088.0, -967.2, 1102.1, -966.2, 1106.0, -964.2, 1109.1, -956.4, 1114.5, -941.0, 1120.7],   // w1187075389
    [2, -1157.7, 1300.3, -1164.3, 1294.1, -1176.3, 1290.4, -1172.8, 1282.2, -1171.8, 1275.8, -1177.1, 1272.6, -1223.3, 1259.2, -1229.5, 1260.1, -1232.2, 1264.2, -1237.1, 1274.2, -1242.4, 1283.4, -1243.8, 1289.0],   // w4209126
    [2, -1243.8, 1289.0, -1242.3, 1293.5, -1237.2, 1296.5, -1192.9, 1310.1, -1187.1, 1309.5, -1181.8, 1304.8, -1176.3, 1290.4],   // w4631437
    [2, -1237.1, 1274.2, -1183.9, 1290.6, -1176.3, 1290.4],   // w1537314273
    [3, -821.0, 283.9, -816.3, 283.4, -777.0, 274.4, -753.5, 275.0, -718.6, 287.3, -706.9, 293.4, -694.7, 302.6, -676.9, 319.1, -670.8, 328.5],   // w98243592, 170 m of it
    [3, -795.1, 810.1, -754.8, 808.3, -721.4, 815.2, -631.5, 832.0],   // w130653663, 166 m of it
    [3, -1267.7, 1307.3, -1289.5, 1285.8, -1298.6, 1279.5, -1318.1, 1269.0, -1329.7, 1263.9, -1357.9, 1249.5, -1371.5, 1247.1],   // w1537275011
    [3, -1318.1, 1269.0, -1327.3, 1233.3, -1328.9, 1204.6, -1340.5, 1178.8, -1348.2, 1170.5, -1353.2, 1162.5],   // w371790336, 115 m of it
    [4, -197.2, -158.7, -188.7, -163.6, -180.9, -166.1, -151.4, -163.6, -144.1, -165.5, -138.3, -171.2, -125.4, -189.2, -107.7, -217.1, -95.9, -242.9, -93.0, -260.9],   // w1214398626, 165 m of it
    [4, -333.9, -292.0, -318.2, -271.8, -309.2, -258.1, -302.0, -242.8, -298.3, -226.4, -296.6, -215.0, -294.9, -208.2, -292.1, -201.5, -287.7, -195.0, -280.3, -186.5, -267.5, -176.3],   // w130653925, 137 m of it
    [4, -836.5, 41.6, -833.6, 33.4, -831.6, 29.1, -826.1, 5.6, -820.8, -10.0, -817.1, -23.3, -802.1, -55.5, -794.3, -67.6, -768.5, -103.6, -761.6, -109.9, -756.8, -118.7, -747.3, -139.9, -735.6, -169.2],   // w1168112212, 236 m of it
    [4, -825.7, 907.3, -852.0, 885.8, -858.5, 809.6, -946.3, 791.0],   // w130653683, 200 m of it
    [4, -1175.8, 1320.1, -1149.9, 1334.6, -1146.9, 1347.1, -1137.3, 1374.8, -1121.6, 1401.4, -1112.9, 1412.6, -1099.1, 1422.4, -1083.0, 1432.7],   // w112475824, 153 m of it
    [4, -18.6, -13.4, -31.4, 6.7, -37.7, 14.6],   // w1074457591
    [4, -1259.0, 1531.3, -1250.6, 1504.5, -1250.2, 1500.5, -1251.2, 1491.3, -1254.0, 1477.4, -1253.0, 1466.4, -1245.6, 1436.0, -1246.1, 1421.0, -1248.7, 1394.5, -1247.4, 1381.5, -1245.4, 1372.5],   // w589056750, 162 m of it
    [5, -975.0, 1103.9, -968.5, 1089.3, -965.4, 1079.7, -932.5, 997.9, -924.3, 1001.2],   // w1537282643
    [5, -967.2, 1102.1, -975.0, 1103.9],   // w1537282644
    [5, -975.0, 1103.9, -981.5, 1118.7],   // w1537282645
    [5, -981.5, 1118.7, -986.8, 1130.8, -993.5, 1142.8, -997.8, 1148.2, -1001.0, 1154.1, -1006.3, 1161.6, -1017.3, 1172.0, -1025.9, 1178.0],   // w1537276183
    [5, -1025.9, 1178.0, -1069.0, 1198.3, -1091.3, 1212.9, -1120.1, 1239.9, -1142.0, 1266.3, -1150.6, 1274.9, -1165.1, 1267.1],   // w1537276182
    [5, -1165.1, 1267.1, -1224.6, 1248.4, -1228.9, 1247.3, -1233.2, 1248.0, -1250.2, 1277.2, -1264.1, 1308.5],   // w1537314271
    [5, -1206.4, 1319.9, -1248.3, 1304.5, -1249.9, 1303.1, -1256.7, 1291.8],   // w1537314272
    [6, -855.9, 415.7, -842.4, 419.4, -819.0, 416.8, -806.8, 418.4, -797.0, 416.1, -782.8, 411.3, -755.4, 406.2, -746.0, 405.9, -735.9, 404.1, -712.4, 392.8, -694.4, 387.4],   // w130653777, 167 m of it
    [6, -852.6, 878.1, -795.1, 810.1],   // w130653826
    [6, -1245.4, 1372.5, -1207.6, 1327.0],   // w589056749
    [6, -1245.4, 1372.5, -1258.9, 1322.4, -1267.7, 1307.3],   // w1177540602
    [6, -1356.2, 1570.2, -1355.6, 1564.9, -1353.3, 1556.7, -1358.2, 1547.6, -1358.6, 1542.3, -1349.6, 1518.1, -1348.5, 1513.3, -1351.7, 1507.6, -1353.8, 1500.8, -1355.8, 1492.6, -1356.2, 1485.5, -1359.7, 1482.8, -1362.4, 1478.9, -1366.5, 1475.3, -1369.2, 1472.0, -1368.4, 1469.3, -1364.4, 1465.2, -1361.5, 1460.2, -1369.7, 1435.0, -1372.3, 1423.0],   // w983797785, 161 m of it
    [6, -1466.2, 1327.3, -1477.5, 1329.3, -1483.6, 1329.4, -1487.0, 1334.4, -1487.3, 1339.5, -1491.0, 1343.6, -1492.5, 1346.7, -1491.3, 1351.9, -1486.6, 1356.9, -1475.2, 1367.5, -1472.1, 1375.3, -1458.4, 1387.5, -1452.0, 1390.8, -1443.2, 1396.5, -1423.0, 1405.4, -1412.8, 1408.9, -1410.3, 1404.5],   // w43102471
    [6, -1410.3, 1404.5, -1401.6, 1399.1, -1392.0, 1389.5, -1378.1, 1355.7, -1378.0, 1347.5, -1379.7, 1343.1, -1391.2, 1327.7, -1395.7, 1323.6, -1405.1, 1321.4, -1420.5, 1322.6, -1431.3, 1326.3, -1435.4, 1325.8, -1440.7, 1323.4, -1454.3, 1324.9, -1456.4, 1325.9, -1466.2, 1327.3],   // w850258810
    [6, -1143.3, 1316.7, -1142.4, 1320.1, -1137.0, 1325.1, -1117.5, 1333.5, -1105.7, 1337.4, -1069.4, 1347.0, -1057.3, 1349.4, -1048.1, 1351.9, -1041.7, 1352.7, -1034.1, 1352.0, -1017.5, 1351.8, -1007.8, 1353.1],   // w1302914616, 144 m of it
    [6, -1023.5, 1294.3, -1031.3, 1285.4, -1052.4, 1271.2, -1066.6, 1262.6, -1085.5, 1252.8, -1093.0, 1251.1],   // w1306889502
    [6, -1149.9, 1334.6, -1145.6, 1322.7, -1142.4, 1320.1],   // w1306890335
    [7, -1429.0, 1219.4, -1403.8, 1230.5, -1371.5, 1247.1, -1347.2, 1262.6, -1334.1, 1275.6, -1328.5, 1283.6, -1323.1, 1293.4, -1319.0, 1305.5, -1316.9, 1309.8]   // w1486339347, 150 m of it
  ];
  const THINGS = [['board', -18.0, -5.9], ['table', -39.3, 24.4], ['fire', -37.1, 22.6], ['bin', -40.0, 21.1], ['hydrant', -1257.9, 1317.3]];
  // the ways' kinds: half width, the soft edge beyond it, colour (times the map), on the asphalt map, which lies over which where they meet,
  // the colour down the middle (the grass between a track's ruts) or null
  const GRAVEL = [0.58, 0.53, 0.44], EARTH = [0.5, 0.45, 0.36], ASPH = [0.8, 0.8, 0.81];
  const WK = [[4.5, 0.45, ASPH, 1, 8, null], [3.0, 0.45, ASPH, 1, 7, null], [2.4, 0.45, ASPH, 1, 6, null], [1.5, 0.4, GRAVEL, 0, 4, null], [1.5, 0.4, EARTH, 0, 3, [0.4, 0.43, 0.27]],
    [1.0, 0.3, [0.56, 0.52, 0.43], 0, 2, null], [0.6, 0.3, EARTH, 0, 1, null], [2.5, 0.5, [0.62, 0.57, 0.48], 0, 5, null]];
  const FADE = 8, TILE = 400, STEP = 1.5, FILL_T = [0.43, 0.39, 0.3], FILL_B = [0.4, 0.42, 0.28];
  const CO = World.krasnahorkaObcestje = { keepOut, extra, stats: null };

  // ---- helpers (no rng: the world's own random sequence stays as it was) ----
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => { const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1); return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv; };
  const tone = (c, x, z) => { const f = 0.95 + 0.08 * patch(x + 500, z); return [c[0] * f, c[1] * f, c[2] * f]; };
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  const sm = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const resample = (L, step) => {   // a flat x, z list -> points at most step m apart, its corners kept
    const out = [L[0], L[1]];
    for (let q = 0; q + 3 < L.length; q += 2) {
      const ax = L[q], az = L[q + 1], bx = L[q + 2], bz = L[q + 3], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
      for (let t = 1; t <= m; t++) out.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
    }
    return out;
  };
  const frame = (Q) => {   // per point: the unit normal (to the way's right), the tangent and the mitre (how much wider a corner must be)
    const n = Q.length / 2, F = [];
    const segN = (j) => { const dx = Q[2 * j + 2] - Q[2 * j], dz = Q[2 * j + 3] - Q[2 * j + 1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
    for (let k = 0; k < n; k++) {
      const a = k > 0 ? segN(k - 1) : null, b = k < n - 1 ? segN(k) : null, m = a && b ? [a[0] + b[0], a[1] + b[1]] : (a || b), l = Math.hypot(m[0], m[1]) || 1, nx = m[0] / l, nz = m[1] / l;
      F.push({ nx, nz, tx: nz, tz: -nx, mi: a && b ? 1 / Math.max(0.5, nx * a[0] + nz * a[1]) : 1 });
    }
    return F;
  };
  const along = (L, step, fn) => { const Q = resample(L, step); for (let k = 0; k < Q.length; k += 2) fn(Q[k], Q[k + 1]); };
  // each way's box (for the quick no) and the nearest any way of at least rank r comes to (x, z), less its half width (W itself left out)
  const BB = WAYS.map((W) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let q = 1; q + 1 < W.length; q += 2) { x0 = Math.min(x0, W[q]); x1 = Math.max(x1, W[q]); z0 = Math.min(z0, W[q + 1]); z1 = Math.max(z1, W[q + 1]); } return [x0, x1, z0, z1]; });
  const offWays = (x, z, r, W, cap) => {
    let best = cap;
    for (let v = 0; v < WAYS.length; v++) {
      const V = WAYS[v], K = WK[V[0]], B = BB[v], m = best + K[0]; if (V === W || K[4] < r || x < B[0] - m || x > B[1] + m || z < B[2] - m || z > B[3] + m) continue;
      for (let q = 1; q + 3 < V.length; q += 2) best = Math.min(best, segD(x, z, V[q], V[q + 1], V[q + 2], V[q + 3]) - K[0]);
    }
    return best;
  };
  // the verge's height at offset o from sample i on a side: js/world-gore.js vProf without snow or side-road mouths
  const vergeY = (T, i, side, o) => {
    const bar = side > 0 ? T.br[i] : T.bl[i], e = T.wAt ? T.wAt(i) : T.w, y = T.hy[i];
    const gAt = (q) => vrGround(T.px[i] + T.nx[i] * side * q, T.pz[i] + T.nz[i] * side * q) - y, lift = (q, h) => [q, Math.max(h, gAt(q) + 0.05)];
    const Q = [[e + 0.6, -0.02], lift(Math.max(e + 1.2, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]];
    let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++;
    const a = Q[k], b = Q[k + 1]; return y + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1);
  };
  // where a thing stands: OSM's place, or 0.8 m past the barrier line on its side when that is nearer the road; [x, z, the road's heading there]
  const stand = (T, x, z) => {
    const nr = vrNear(x, z); if (nr.i < 0) return [x, z, 0];
    const i = nr.i, side = nr.lat > 0 ? 1 : -1, more = (side > 0 ? T.br[i] : T.bl[i]) + 0.8 - Math.abs(nr.lat);
    return more > 0 ? [x + T.nx[i] * side * more, z + T.nz[i] * side * more, T.hd[i]] : [x, z, T.hd[i]];
  };

  // ---- no trees (nor rocks) on what is drawn here: gore.build calls this before it plants them (after vrPrep) ----
  function keepOut(push) {
    const T = API.T;
    for (const W of WAYS) { const hw = WK[W[0]][0]; along(W.slice(1), 3, (x, z) => push(x, z, hw + 1.2)); }
    for (const [, x, z] of THINGS) { const p = stand(T, x, z); push(p[0], p[1], 1.6); }
  }

  // ---- the meshes: gore.build calls this (ctx: its scenery chunks, root, car parks, buildings, crowd) after its own extra ----
  function extra(ctx, tex) {
    const st = CO.stats = { ways: 0, wayM: 0, fills: 0, meshes: 0, things: 0 };
    if (!ctx || !ctx.scen || !ctx.root) return;
    const T = API.T, pads = (ctx.P && ctx.P.pads) || [], blds = ctx.blds || [], CR = ctx.CR && typeof ctx.CR.avoid === 'function' ? ctx.CR : null;
    const U = {
      T, CR,
      inPad: (x, z, m) => { for (const p of pads) if (Math.hypot(x - p.x, z - p.z) < p.r + m) return true; return false; },
      inBld: (x, z, m) => { for (const b of blds) { const dx = x - b.x, dz = z - b.z, c = Math.cos(b.ang || 0), s = Math.sin(b.ang || 0);
        if (Math.abs(c * dx + s * dz) < b.L / 2 + m && Math.abs(-s * dx + c * dz) < b.W / 2 + m) return true; } return false; },
      dd: (x, z) => { const nr = vrNear(x, z); return nr.i < 0 ? 1e9 : nr.dd; },
      // on a side road the game draws (Track.stubs), out to its drawn end
      inStub: (x, z, m) => { for (const S of T.stubs || []) { if (!S || !S.x) continue; for (let j = 1; j < S.n; j++) if (segD(x, z, S.x[j - 1], S.z[j - 1], S.x[j], S.z[j]) < (S.hw || 2.2) + m) return true; } return false; },
    };
    lay(ctx, tex, st, U);
    things(ctx, st, U);
  }

  // the ways: rows across every 1.5 m (both soft edges, the half widths, the middle of the wide ones), on the ground; per 400 m square
  // one mesh for the asphalt's opaque middle, one see-through for its soft edges and fading stretches, one see-through for gravel and earth
  function lay(ctx, tex, st, U) {
    const T = U.T, R0 = (T.w || 3.8) + 0.05, tiles = new Map();
    const grit = typeof API.vrGritTex === 'function' ? API.vrGritTex() : null, asphT = (tex && tex.asphalt) || grit;
    const onRoad = (x, z) => { const nr = vrNear(x, z); return nr.i >= 0 && nr.d < R0; };
    // the cuts a way runs up to without fading: the asphalt, a car park, a side road, a way that lies over it
    const hardW = (W) => { const r = WK[W[0]][4] + 1; return (x, z) => onRoad(x, z) || U.inPad(x, z, 0.3) || U.inStub(x, z, 0) || offWays(x, z, r, W, 0.5) < -0.05; };
    const gbAt = (x, z, asph, fade) => { const key = (asph ? (fade ? 'af' : 'ao') : 'gf') + Math.floor(x / TILE) + ',' + Math.floor(z / TILE);
      let t = tiles.get(key); if (!t) tiles.set(key, t = { g: new GB(true, !asph || fade), asph, fade: !asph || fade }); return t.g; };
    const joined = (W, x, z) => { for (const V of WAYS) if (V !== W) for (let q = 1; q + 3 < V.length; q += 2) if (segD(x, z, V[q], V[q + 1], V[q + 2], V[q + 3]) < 1.5) return true; return false; };
    // the way's height at (x, z): on the ground, or over the verge a straight fill from the road's edge out to the ground past the ditch;
    // [height, the verge's height under it (NaN off the verge)]
    const ground = (x, z) => {
      const nr = vrNear(x, z), gy = vrGround(x, z);
      if (nr.i < 0) return [gy + 0.07, NaN];
      const i = nr.i, side = nr.lat > 0 ? 1 : -1, o = Math.abs(nr.lat), o1 = (side > 0 ? T.br[i] : T.bl[i]) + 1.9, hn = nr.hn, dh = hn - T.hy[i];
      if (o >= o1) return [gy + 0.07, NaN];
      const o0 = (T.wAt ? T.wAt(i) : T.w) + 0.6, yOut = vergeY(T, i, side, o1) + dh, yEdge = hn - 0.02, vb = vergeY(T, i, side, o) + dh;
      return [Math.max(yEdge + (yOut - yEdge) * clamp((o - o0) / Math.max(0.5, o1 - o0), 0, 1), vb) + 0.05, vb];
    };
    // a free end (not on another way) short of the asphalt but within 8 m of the road's middle (OSM's node is off the road's line):
    // carried on to the middle, so it is cut at the asphalt's edge like the others and does not fade out on the verge
    const toRoad = (W, x, z) => { if (joined(W, x, z)) return null; const nr = vrNear(x, z); return nr.i >= 0 && nr.d >= R0 && nr.d < 8 ? [x - T.nx[nr.i] * nr.lat, z - T.nz[nr.i] * nr.lat] : null; };
    WAYS.forEach((W, wi) => {
      let L = W.slice(1); const a = toRoad(W, L[0], L[1]); if (a) L = a.concat(L);
      const b = toRoad(W, L[L.length - 2], L[L.length - 1]); if (b) L = L.concat(b);
      const [hw, e, col, asph, rank, mid] = WK[W[0]], hard = hardW(W), Q = resample(L, STEP), n = Q.length / 2, F = frame(Q), up = 0.004 * rank + 0.002 * (wi % 3);
      const OF = hw > 1 ? [-hw - e, -hw, 0, hw, hw + e] : [-hw - e, -hw, hw, hw + e], AX = hw > 1 ? [0, 1, 1, 1, 0] : [0, 1, 1, 0];
      const s = [0], H = [], Sf = [], fd = new Float64Array(n);
      for (let k = 1; k < n; k++) s.push(s[k - 1] + Math.hypot(Q[2 * k] - Q[2 * k - 2], Q[2 * k + 1] - Q[2 * k - 1]));
      for (let k = 0; k < n; k++) { const x = Q[2 * k], z = Q[2 * k + 1]; H.push(hard(x, z)); Sf.push(!H[k] && U.inBld(x, z, 0.3)); }
      // how far to the nearest soft cut (a free end, a building): one pass forwards, one back; a hard cut resets it
      let c = !H[0] && !joined(W, Q[0], Q[1]) ? 0 : -1e9;
      for (let k = 0; k < n; k++) { if (H[k]) c = -1e9; else if (Sf[k]) c = s[k]; fd[k] = s[k] - c; }
      c = !H[n - 1] && !joined(W, Q[2 * n - 2], Q[2 * n - 1]) ? s[n - 1] : 1e9;
      for (let k = n - 1; k >= 0; k--) { if (H[k]) c = 1e9; else if (Sf[k]) c = s[k]; fd[k] = Math.min(fd[k], c - s[k]); }
      const rows = new Array(n).fill(null);
      for (let k = 0; k < n; k++) {
        if (H[k] || Sf[k]) continue;
        const f = F[k], x = Q[2 * k], z = Q[2 * k + 1], aL = sm(fd[k] / FADE);
        // near a hard cut each vertex slides along the way to its edge, so the end follows the asphalt's (or the car park's) edge
        let dir = 0, pull = false;
        for (let j = 1; j <= 5 && !dir; j++) { if (k - j >= 0 && H[k - j]) { dir = 1; pull = j === 1; } else if (k + j < n && H[k + j]) { dir = -1; pull = j === 1; } }
        const c3 = tone(col, x, z), cm = mid ? tone(mid, x, z) : c3, p = [], cl = [], uv = [], vb = [];
        for (let q = 0; q < OF.length; q++) {
          const o = OF[q] * f.mi; let vx = x + f.nx * o, vz = z + f.nz * o;
          if (dir) {
            const ux = f.tx * dir * 0.1, uz = f.tz * dir * 0.1;
            if (hard(vx, vz)) { for (let m = 0; m < 60 && hard(vx, vz); m++) { vx += ux; vz += uz; } }
            else if (pull) { for (let m = 0; m < 15 && !hard(vx - ux, vz - uz); m++) { vx -= ux; vz -= uz; } }
          }
          const gr = ground(vx, vz), cc = OF[q] === 0 ? cm : c3;
          p.push([vx, gr[0] + up, vz]); vb.push(gr[1]); cl.push([cc[0], cc[1], cc[2], AX[q] * aL]); uv.push(asph ? [(OF[q] + 4) / 8, s[k] / 8] : [OF[q] / 3, s[k] / 3]);
        }
        rows[k] = { p, cl, uv, vb, aL, x, z };
        if (U.CR && k % 2 === 0 && U.dd(x, z) < 60) U.CR.avoid(x, z, hw + 0.4);
      }
      let drawn = false;
      for (let k = 1; k < n; k++) {
        const r0 = rows[k - 1], r1 = rows[k]; if (!r0 || !r1) continue;
        const xm = (r0.x + r1.x) / 2, zm = (r0.z + r1.z) / 2, full = r0.aL > 0.999 && r1.aL > 0.999;
        for (let q = 0; q + 1 < OF.length; q++) {
          const g = gbAt(xm, zm, asph, !(full && AX[q] === 1 && AX[q + 1] === 1));
          g.quadUp(r0.p[q], r1.p[q], r1.p[q + 1], r0.p[q + 1], [r0.cl[q], r1.cl[q], r1.cl[q + 1], r0.cl[q + 1]], [r0.uv[q], r1.uv[q], r1.uv[q + 1], r0.uv[q + 1]]);
        }
        // over the verge: the fill's sides, down into the verge (the ditch under the way)
        for (const q of [0, OF.length - 1]) {
          const a = r0.p[q], b = r1.p[q], ya = isNaN(r0.vb[q]) ? vrGround(a[0], a[2]) : r0.vb[q], yb = isNaN(r1.vb[q]) ? vrGround(b[0], b[2]) : r1.vb[q];
          if (isNaN(r0.vb[q]) && isNaN(r1.vb[q])) continue;
          if (a[1] - ya < 0.08 && b[1] - yb < 0.08) continue;
          ctx.scen.get(xm, zm).quadO(a, b, [b[0], yb - 0.06, b[2]], [a[0], ya - 0.06, a[2]], FILL_T, [xm, (a[1] + b[1]) / 2 - 0.3, zm], null, [FILL_T, FILL_T, FILL_B, FILL_B]);
          st.fills++;
        }
        st.wayM += Math.hypot(r1.x - r0.x, r1.z - r0.z); drawn = true;
      }
      if (drawn) st.ways++;
    });
    const mats = {};
    const mat = (asph, fade) => { const key = (asph ? 'a' : 'g') + (fade ? 'f' : 'o');
      return mats[key] || (mats[key] = new THREE.MeshLambertMaterial(Object.assign({ map: asph ? asphT : grit, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 },
        fade ? { transparent: true, depthWrite: false } : {}))); };
    for (const t of tiles.values()) {
      if (t.g.empty) continue;
      const m = new THREE.Mesh(t.g.geometry(), mat(t.asph, t.fade));
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'roadside-ways'; if (t.fade) m.renderOrder = 1;
      ctx.root.add(m); st.meshes++;
    }
  }

  // the furniture: plain shapes, nothing written on them; each faces along the road (assumed)
  function things(ctx, st, U) {
    const T = U.T, box = API.box, cyl = API.cyl, WOOD = [0.47, 0.35, 0.22], WOOD_D = [0.39, 0.29, 0.18], PLATE = [0.87, 0.84, 0.75], RED = [0.76, 0.13, 0.1];
    for (const [what, x0, z0] of THINGS) {
      const [x, z, rot] = stand(T, x0, z0); if (U.inPad(x, z, 0) || U.inBld(x, z, 0.5)) continue;
      const y = vrGround(x, z) - 0.05, g = ctx.scen.get(x, z), c = Math.cos(rot), s = Math.sin(rot), P = (lx, lz) => [x + lx * c - lz * s, z + lx * s + lz * c];
      if (what === 'board') {
        for (const lx of [-0.7, 0.7]) { const q = P(lx, 0); box(g, q[0], y, q[1], 0.1, 2.1, 0.1, rot, WOOD, null, true); }
        box(g, x, y + 0.95, z, 1.3, 0.95, 0.05, rot, PLATE, PLATE); box(g, x, y + 2.08, z, 1.7, 0.06, 0.55, rot, WOOD_D, WOOD_D);
      } else if (what === 'table') {
        box(g, x, y + 0.72, z, 1.8, 0.05, 0.75, rot, WOOD, WOOD);
        for (const lz of [-0.68, 0.68]) { const q = P(0, lz); box(g, q[0], y + 0.42, q[1], 1.8, 0.05, 0.28, rot, WOOD, WOOD); }
        for (const lx of [-0.7, 0.7]) { const q = P(lx, 0); box(g, q[0], y, q[1], 0.08, 0.72, 0.6, rot, WOOD_D, null, true); box(g, q[0], y + 0.34, q[1], 0.08, 0.08, 1.6, rot, WOOD_D, WOOD_D); }
      } else if (what === 'fire') cyl(g, x, y, z, 0.55, 0.32, 8, [0.52, 0.51, 0.48], [0.22, 0.21, 0.2]);
      else if (what === 'bin') cyl(g, x, y, z, 0.2, 0.85, 8, [0.36, 0.44, 0.38], [0.27, 0.32, 0.29]);
      else if (what === 'hydrant') { cyl(g, x, y, z, 0.09, 0.82, 8, RED, RED); cyl(g, x, y + 0.82, z, 0.12, 0.09, 8, RED, RED); box(g, x, y + 0.55, z, 0.36, 0.09, 0.09, rot, RED, RED); }
      if (U.CR && U.dd(x, z) < 60) U.CR.avoid(x, z, 1.2);
      st.things++;
    }
  }

  // ---- the hook: World.ext.krasnahorka runs as before, with gore.build handed this file's keepOut and extra after its own ----
  const ext = World.ext, baseExt = ext.krasnahorka;
  ext.krasnahorka = function (scene, tex, opts) {
    const gore = World.gore, build = gore.build;
    gore.build = function (sc, tx, op, S) {
      gore.build = build;
      const S2 = Object.assign({}, S, {
        keepOut: (push) => { if (typeof S.keepOut === 'function') S.keepOut(push); keepOut(push); },
        extra: (ctx) => { const r = typeof S.extra === 'function' ? S.extra(ctx) : undefined; extra(ctx, tx); return r; },
      });
      return build.call(this, sc, tx, op, S2);
    };
    try { return baseExt.apply(this, arguments); } finally { gore.build = build; }
  };
})();
