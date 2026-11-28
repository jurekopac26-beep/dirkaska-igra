/* =========================================================================
   WORLD — Mombasa, the roadside (grafika/mombasa-obcestje): what OpenStreetMap maps by the road and js/world-mombasa.js left to the
   ground's colours, laid on the ground's own triangles from 0.8 m beyond the barriers out to 62 m from the road's centre line (the
   60 m rule; the edges cut smoothly, the ponds whole, the golf course's lawn 6 m round them), 2 m off the sea:
   - the six car parks by the road (amenity=parking): none has a surface in OSM, so after PARK_B (the user's choice in the PR:
     (a) asphalt, faded and patched, (b) the red earth of the coast, murram);
   - the lawns (patches of dry grass in them) of the park in front of the fortress and of the park on the shore past the finish
     (leisure=park), and of the golf course (leisure=golf_course);
   - the golf course's two ponds (natural=water, golf=water_hazard): still, murky water.
   - the roads that lead to the car parks (the user's wish in the PR, 23. 11.): the OSM ways (service, parking aisles, the ring and
     its spurs by the hotels) from the barrier's gap to and through each car park, in the car parks' asphalt; P0 and P5 have no way
     in OSM, so a short drive from the road straight to them; P3 lies on the road itself;
   - the car parks' white stall lines (the user's wish in the PR, 23. 11.; OSM maps no stalls, so approximate): 2.5 × 5 m stalls
     in rows along the aisles' both sides and along the car parks' edges, kept off the roads, the barriers and the sea.
   Kept open (OSM has no shape for them, or they are not to be drawn): the golf course's fairways, greens, tees and bunkers (none in
   OSM), the memorial and the information points in the park (nodes), the car parks' signs, the paths and the service roads in the
   parks and on the golf course. Not drawn again: the houses, the walls, the trees and the crowd stay js/world-mombasa.js's;
   its filling houses, its trees and its crowd now keep off the car parks and the ponds, the filling houses also off the lawns (the
   trees and the crowd may stand on them).
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-22; metres, origin = the road's first point
   (js/data/mombasa.js: lat0 −4.0618471, lon0 39.6680345), x east, z south; the outlines simplified to 0.25 m.
   js/world-mombasa.js calls World.ext.mombasaOb once its ground's heights are set (before its tiles and houses), and .open() before its
   crowd and its trees.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.mombasa) return;
  const A = World.api;
  const PARK_B = false;   // the car parks without a surface in OSM: false (a) asphalt, true (b) the red earth, murram (the user's choice, PR)

  // the outlines [x0, z0, x1, z1, ...]: the car parks (amenity=parking), the lawns ([0 leisure=park | 1 leisure=golf_course, ...]), the ponds
  const PARK = [
    [390.1, 115.1, 421.1, 125.2, 420.0, 131.1, 425.7, 132.6, 422.3, 146.9, 384.2, 137.9],
    [922.6, 124.7, 953.3, 122.9, 961.7, 119.1, 951.2, 107.3, 920.5, 108.4],
    [1068.8, 83.4, 1071.3, 82.3, 1074.0, 81.9, 1076.6, 82.1, 1079.1, 83.1, 1081.3, 84.7, 1083.0, 86.7, 1084.1, 89.2, 1084.5, 91.8, 1084.2, 94.4, 1083.3, 96.9, 1081.8, 98.9, 1057.8, 114.9, 1055.1, 116.1, 1052.5, 116.5, 1049.8, 116.2, 1047.3, 115.3, 1045.1, 113.7, 1043.4, 111.7, 1042.3, 109.2, 1041.9, 106.6, 1042.2, 104.2, 1043.1, 102.3],
    [1173.3, 190.1, 1154.2, 192.6, 1094.8, 127.1, 1093.8, 113.3],
    [1345.0, 406.0, 1336.1, 381.9, 1243.3, 422.8, 1260.6, 463.1],
    [1180.3, 1106.0, 1200.7, 1088.5, 1212.1, 1091.0, 1211.7, 1134.2]];
  const LAWN = [
    [0, 1094.8, 127.1, 1062.8, 145.5, 1102.2, 212.4, 1112.7, 227.7, 1124.7, 232.6, 1132.3, 234.4, 1144.0, 234.7, 1157.5, 232.9, 1166.1, 230.3, 1174.0, 224.3, 1178.3, 216.8, 1179.5, 209.0, 1179.4, 199.2, 1173.3, 190.1, 1154.2, 192.6],
    [0, 395.3, 1905.2, 484.9, 1867.7, 427.5, 1823.8, 399.4, 1826.4, 379.6, 1827.4, 344.5, 1809.6, 281.3, 1797.7, 227.7, 1829.0, 173.3, 1833.7, 162.4, 1837.0, 156.1, 1835.1, 152.1, 1830.8, 145.8, 1832.1, 140.2, 1830.8, 120.9, 1813.6, 117.0, 1812.6, 18.9, 1747.7, -51.2, 1702.0, -54.5, 1693.2, -118.5, 1699.7, -124.3, 1807.2, -115.0, 1849.2, -73.2, 1881.9, -20.1, 1889.6, 30.3, 1907.0, 57.5, 1931.2, 165.1, 1927.5],
    [1, 1152.2, 1304.2, 1171.4, 1278.6, 1200.6, 1275.6, 1192.6, 1245.0, 1247.0, 1241.5, 1258.6, 1169.4, 1219.3, 1160.4, 1149.2, 1098.7, 1107.3, 1090.7, 1076.5, 1092.2, 1046.8, 1092.2, 1005.9, 1099.2, 983.7, 1109.3, 956.3, 1139.8, 941.6, 1176.2, 927.5, 1244.7, 909.2, 1284.5, 827.7, 1362.3, 880.6, 1396.1, 908.6, 1377.7, 1005.5, 1367.2, 1051.1, 1333.7, 1108.1, 1333.7]];
  const POND = [
    [960.6, 1162.4, 989.2, 1153.1, 1010.6, 1149.7, 1016.6, 1153.5, 1015.3, 1168.4, 1011.0, 1175.6, 999.1, 1180.2, 980.7, 1184.0, 965.8, 1182.8, 959.8, 1174.3, 957.6, 1167.9],
    [941.8, 1187.9, 937.6, 1205.7, 937.1, 1216.7, 941.0, 1235.4, 941.4, 1241.7, 959.3, 1243.9, 974.7, 1244.3, 981.6, 1234.1, 982.4, 1221.4, 979.4, 1215.0, 965.8, 1215.0, 957.2, 1218.8, 956.8, 1206.5, 958.9, 1192.1, 954.6, 1185.7, 949.5, 1183.6]];

  // the roads to the car parks ([[half width, x0, z0, x1, z1, ...] per way] per car park; open lines): OSM's highway ways where it maps them, cut to
  // what lies past the barriers and within the 62 m (the fields below); inside a car park a way is its aisle (the stalls along it, both sides).
  // The car park by the fortress (0) and the one by the golf course (5) have no way in OSM: a short drive from the nearer carriageway to the
  // middle of the car park's side facing it; the strip along the road past the roundabout (3) lies on the road itself (none)
  const ROAD = [
    [[3.0, 408.9, 108.3, 405.3, 121.2]],
    [[2.75, 930.6, 141.5, 931.2, 128.8, 932.4, 122.6, 932.3, 120.7, 932.9, 118.9, 934.6, 117.8, 952.0, 116.7, 953.7, 116.7, 955.4, 117.7, 957.4, 125.5, 961.2, 139.4]],
    [[3.5, 1068.0, 77.8, 1069.5, 77.2, 1071.1, 76.8, 1075.6, 76.0, 1076.4, 76.2, 1078.6, 76.8, 1081.2, 78.5, 1084.4, 80.8, 1086.9, 83.9, 1088.5, 87.5, 1089.1, 91.4, 1088.7, 95.3, 1079.9, 105.6, 1077.9, 106.8, 1059.8, 119.0, 1052.3, 121.2, 1048.3, 120.8, 1044.6, 119.4, 1041.3, 117.0, 1038.3, 112.5, 1038.3, 107.2, 1039.6, 101.5, 1044.6, 93.5, 1068.0, 77.8],
     [3.0, 1062.1, 52.3, 1066.0, 54.8, 1068.7, 57.7, 1072.1, 61.4, 1075.9, 64.6, 1076.7, 67.9, 1076.7, 71.3, 1075.6, 76.0],
     [3.0, 1068.0, 77.8, 1067.7, 71.6, 1066.9, 67.6, 1066.0, 64.1, 1064.9, 61.0, 1063.4, 57.4, 1062.1, 52.3],
     [3.0, 1076.4, 76.2, 1084.3, 65.6, 1093.4, 60.5, 1105.9, 58.1], [3.0, 1105.9, 58.1, 1084.4, 80.8],
     [3.5, 1038.3, 112.5, 1024.4, 113.0, 1017.1, 115.6], [3.5, 1017.1, 115.6, 1020.4, 111.1, 1026.0, 106.2, 1033.9, 100.2, 1044.6, 93.5],
     [3.5, 1059.8, 119.0, 1052.7, 141.5], [3.5, 1052.7, 141.5, 1044.6, 119.4],
     [3.0, 1015.4, 23.1, 1049.4, 38.2, 1055.7, 43.5, 1062.1, 52.3], [3.0, 1151.8, 42.5, 1125.7, 50.3, 1105.9, 58.1]],
    [],
    [[3.0, 1337.6, 379.4, 1312.5, 389.5, 1301.6, 392.9, 1270.8, 404.0, 1249.0, 413.0, 1243.4, 414.7, 1228.1, 421.6],
     [2.5, 1249.0, 413.0, 1254.2, 423.4, 1259.0, 426.9, 1266.3, 425.8, 1273.3, 423.8, 1290.2, 418.6, 1310.0, 411.2, 1315.2, 408.7, 1318.7, 404.2, 1317.9, 399.3, 1315.4, 395.3, 1312.5, 389.5],
     [2.5, 1259.0, 426.9, 1259.8, 436.3, 1262.5, 444.7, 1266.1, 451.0, 1272.0, 453.3, 1277.9, 452.5, 1284.0, 449.0, 1291.6, 443.6, 1294.6, 440.3, 1295.3, 436.4, 1295.2, 432.0, 1293.2, 425.3, 1290.2, 418.6]],
    [[3.0, 1190.2, 1126.9, 1196.6, 1119.3]]];

  // the colours (multiplying the pictures: the grass's is a bright green, ~0.34 0.57 0.23): dusty asphalt, the red earth (murram), the lawns
  // a dull green with dry patches, ~0.30 0.38 0.17 and ~0.48 0.44 0.24 (the golf course a little greener, fewer dry patches)
  const PK_ASP = [0.96, 0.92, 0.86], PK_MUR = [0.92, 0.64, 0.48], LW_GREEN = [[0.87, 0.67, 0.75], [0.8, 0.7, 0.68]], LW_DRY = [1.4, 0.77, 1.06];
  // smooth patches (value noise on a 9 m lattice, from the place alone: the same every time, no draw from the world's random numbers)
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => {
    const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
  const mix = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  const asphaltAt = (x, z) => { const f = 0.82 + 0.14 * patch(x + 500, z) + 0.08 * patch(3 * x, 3 * z - 400); return PK_ASP.map(c => c * f); };   // (patches of 9 m and 3 m)
  const murramAt = (x, z) => { const f = 0.92 + 0.12 * patch(x + 300, z - 200); return PK_MUR.map(c => c * f); };
  const lawnAt = (k) => (x, z) => mix(LW_GREEN[k], LW_DRY, Math.min(1, Math.max(0, patch(x - 700, z + 900) * 1.8 - (k ? 0.75 : 0.5))));
  const W1 = () => [1, 1, 1];

  let last = null;   // (the last build's numbers, for the stats)
  World.ext.mombasaOb = function (o) {
    const { eh, EHC, exclPush, seaD, inFort, root, tex } = o, { RB, nrGround, nrNear } = A, G = A.NR.G, X0 = G.x0, Z0 = G.z0;
    const st = { parkCells: 0, lawnCells: 0, pondCells: 0, roadCells: 0, stalls: 0, lines: 0, meshes: 0, pondDrop: [] };
    const ddAt = (x, z) => { const n = nrNear(x, z); return n.i < 0 ? 99 : n.dd; };
    // what is laid goes into a mesh per outline and material (0 asphalt, 1 murram, 2 lawn, 3 water): 11 meshes, each out of the draw when out of the frame
    const tiles = new Map(); let gid = 0;
    const rbAt = (mt) => { const key = mt + ',' + gid; let t = tiles.get(key); if (!t) tiles.set(key, t = { mt, rb: new RB(true), V: new Map() }); return t; };
    const area = (P) => { let s = 0; for (let k = 0; k < P.length; k += 2) { const j = (k + 2) % P.length; s += P[k] * P[j + 1] - P[j] * P[k + 1]; } return s / 2; };
    const clipHP = (P, a, b, c) => {   // the part of P where a x + b z + c >= 0 (Sutherland-Hodgman)
      if (!P) return null; const R = [], n = P.length / 2;
      for (let k = 0; k < n; k++) {
        const j = (k + 1) % n, px = P[2 * k], pz = P[2 * k + 1], qx = P[2 * j], qz = P[2 * j + 1], pv = a * px + b * pz + c, qv = a * qx + b * qz + c;
        if (pv >= 0) R.push(px, pz);
        if ((pv >= 0) !== (qv >= 0)) { const t = pv / (pv - qv); R.push(px + (qx - px) * t, pz + (qz - pz) * t); }
      }
      return R.length < 6 ? null : R;
    };
    // the squares on the ground's 8 m grid (4 m, by the edges halved and cut along them, below) and in each the ground's two triangles (the diagonal from
    // its north-east to its south-west corner, as nrGround's): every vertex on the ground's own plane, so the mesh lies on it as laid
    const lay = (Q, mt, colAt, lift, U, onCell, FL) => {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; gid++;
      for (let k = 0; k < Q.length; k += 2) { x0 = Math.min(x0, Q[k]); x1 = Math.max(x1, Q[k]); z0 = Math.min(z0, Q[k + 1]); z1 = Math.max(z1, Q[k + 1]); }
      const vtx = (t, x, z) => t.rb.row([[x, nrGround(x, z) + lift, z]], [colAt(x, z)], [[x / U, z / U]]);
      const cor = (t, x, z) => { const key = Math.round((x - X0) * 1000) * 1e7 + Math.round((z - Z0) * 1000); let v = t.V.get(key); if (v === undefined) t.V.set(key, v = vtx(t, x, z)); return v; };   // (one vertex per point, to the mm)
      const tris = (t, P) => {
        const n = P.length / 2; if (Math.abs(area(P)) < 0.01) return;
        const ix = Array.from({ length: n }, (_, k) => cor(t, P[2 * k], P[2 * k + 1]));
        for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(Array.from({ length: n }, (_, k) => new THREE.Vector2(P[2 * k], P[2 * k + 1])), [])) {
          const cr = (P[2 * b] - P[2 * a]) * (P[2 * c + 1] - P[2 * a + 1]) - (P[2 * b + 1] - P[2 * a + 1]) * (P[2 * c] - P[2 * a]);
          if (cr < 0) t.rb.I.push(ix[a], ix[b], ix[c]); else t.rb.I.push(ix[a], ix[c], ix[b]);   // (up-facing: x east, z south)
        }
      };
      const mid = (P) => { let x = 0, z = 0; for (let k = 0; k < P.length; k += 2) { x += P[k]; z += P[k + 1]; } return [2 * x / P.length, 2 * z / P.length]; };
      // the edges (FL: [field, smallest square, slack]; a field >= 0 where the ground is laid, its slope ~1 m per m): a square across one is halved down to
      // the smallest and that one cut along the field's line through its middle (straight: off the field's own line by no more than the slack)
      const sq = (Q, sx, sz, C) => {
        let P = clipHP(clipHP(clipHP(clipHP(Q, 1, 0, -sx), -1, 0, sx + C), 0, 1, -sz), 0, -1, sz + C); if (!P) return;
        const P0 = P, split = () => { const h = C / 2; sq(P0, sx, sz, h); sq(P0, sx + h, sz, h); sq(P0, sx, sz + h, h); sq(P0, sx + h, sz + h, h); };
        let [cx, cz] = mid(P);
        for (const [f, mc, sl] of FL) {
          const fc = f(cx, cz); if (fc >= 2 * C) continue; if (fc <= -2 * C) return;
          let mn = fc, mx = fc; for (let k = 0; k < P.length; k += 2) { const v = f(P[k], P[k + 1]); mn = Math.min(mn, v); mx = Math.max(mx, v); }
          if (mn >= 0) continue; if (mx < 0) return;
          if (C > mc) return split();
          const gx = f(cx + 0.5, cz) - f(cx - 0.5, cz), gz = f(cx, cz + 0.5) - f(cx, cz - 0.5), gl = Math.hypot(gx, gz);
          let R = gl < 0.7 || gl > 1.3 ? null : clipHP(P, gx, gz, fc - gx * cx - gz * cz);
          for (let k = 0; R && k < R.length; k += 2) if (f(R[k], R[k + 1]) < -sl) R = null;
          if (!R) { if (C > 1) return split(); if (fc < 0) return; continue; }   // (where two fields meet: the 1 m square whole or not by its middle)
          P = R; [cx, cz] = mid(P);
        }
        if (inFort(cx, cz, 2)) return;
        const t = rbAt(mt);
        if (Math.abs(Math.abs(area(P)) - C * C) < 1e-3 * C * C) { const a = cor(t, sx, sz), b = cor(t, sx + C, sz), c = cor(t, sx + C, sz + C), d = cor(t, sx, sz + C); t.rb.I.push(a, d, b, c, b, d); }
        else { const s = sx + sz + C; tris(t, clipHP(P, -1, -1, s) || [0, 0, 0, 0, 0, 0]); tris(t, clipHP(P, 1, 1, -s) || [0, 0, 0, 0, 0, 0]); }
        onCell(cx, cz, C);
      };
      for (let j = Math.floor((z0 - Z0) / 4); j <= Math.floor((z1 - Z0) / 4); j++) for (let i = Math.floor((x0 - X0) / 4); i <= Math.floor((x1 - X0) / 4); i++) sq(Q, X0 + i * 4, Z0 + j * 4, 4);
    };

    // the edges: 0.8 m beyond the barriers, 62 m from the road's centre line (the golf course's lawn round its ponds 6 m wide), 2 m off the sea
    const FAR = 62, fNear = (x, z) => ddAt(x, z) - 0.8, fSea = (x, z) => -2 - seaD(x, z);
    const fFar = (x, z) => { const n = nrNear(x, z); return FAR - (n.i < 0 ? 64 : n.d); };   // (nrNear sees the road only up to 64 m: flat beyond)
    const segD = (Q, x, z) => { let b = 1e9; const n = Q.length / 2; for (let k = 0; k < n; k++) { const j = (k + 1) % n, ax = Q[2 * k], az = Q[2 * k + 1], vx = Q[2 * j] - ax, vz = Q[2 * j + 1] - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1))); b = Math.min(b, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return b; };
    const inQ = (Q, x, z) => { let c = false; const n = Q.length / 2; for (let k = 0, j = n - 1; k < n; j = k++) { const xi = Q[2 * k], zi = Q[2 * k + 1], xj = Q[2 * j], zj = Q[2 * j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
    { const LQ = LAWN.map(Q => Q.slice(1)); World.ext.mombasaTrata = (x, z) => { for (const Q of LQ) if (inQ(Q, x, z)) return true; return false; }; }   // (on a park's or the golf course's lawn: js/world-chase-bt97.js keeps the wild grass off it)
    const pondD = (x, z) => { let b = 1e9; for (const Q of POND) b = Math.min(b, segD(Q, x, z) * (inQ(Q, x, z) ? -1 : 1)); return b; };
    const fGolf = (x, z) => Math.max(fFar(x, z), 6 - pondD(x, z));
    // the car parks and the ponds keep everything off for good; the lawns only the houses (their circles shrink to nothing in open())
    const held = new Set(), hold = (x, z, r) => { const e = { x, z, r, held: true };
      for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); held.add(k); } };
    for (const Q of PARK) lay(Q, PARK_B ? 1 : 0, PARK_B ? murramAt : asphaltAt, 0.08, PARK_B ? 4 : 3, (x, z, C) => { exclPush(x, z, 0.75 * C); st.parkCells++; }, [[fNear, 1, 0.05], [fFar, 4, 0.5], [fSea, 1, 0.3]]);
    for (const Q of LAWN) lay(Q.slice(1), 2, lawnAt(Q[0]), 0.06, 5, (x, z, C) => { hold(x, z, 0.75 * C); st.lawnCells++; }, [[fNear, 1, 0.05], [Q[0] ? fGolf : fFar, 4, 0.5], [fSea, 1, 0.3]]);
    for (const Q of POND) { let lo = 1e9, hi = -1e9;   // (whole: off the barriers and the sea only)
      lay(Q, 3, W1, 0.12, 8, (x, z, C) => { exclPush(x, z, 0.75 * C); st.pondCells++; const h = nrGround(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h); }, [[fNear, 1, 0.05], [fSea, 1, 0.3]]);
      if (hi >= lo) st.pondDrop.push(Math.round((hi - lo) * 100) / 100); }

    // the roads to the car parks: asphalt as the car parks' (a little darker), off the car parks and the lawns, a mesh per car park's roads
    const segO = (W, x, z) => { let b = 1e9; for (let k = 1; k + 3 < W.length; k += 2) { const ax = W[k], az = W[k + 1], vx = W[k + 2] - ax, vz = W[k + 3] - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1))); b = Math.min(b, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return b; };
    const fWays = (Ws) => (x, z) => { let b = -1e9; for (const W of Ws) b = Math.max(b, W[0] - segO(W, x, z)); return b; };
    const fOut = (x, z) => { let b = 1e9; for (const Q of PARK) b = Math.min(b, segD(Q, x, z) * (inQ(Q, x, z) ? -1 : 1)); for (const Q of LAWN) b = Math.min(b, segD(Q.slice(1), x, z) * (inQ(Q.slice(1), x, z) ? -1 : 1)); return b; };
    const roadAt = (x, z) => asphaltAt(x, z).map(c => c * 0.9);
    for (const Ws of ROAD) { if (!Ws.length) continue;
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (const W of Ws) for (let k = 1; k < W.length; k += 2) { x0 = Math.min(x0, W[k] - W[0]); x1 = Math.max(x1, W[k] + W[0]); z0 = Math.min(z0, W[k + 1] - W[0]); z1 = Math.max(z1, W[k + 1] + W[0]); }
      lay([x0, z0, x1, z0, x1, z1, x0, z1], 0, roadAt, 0.07, 3, (x, z, C) => { exclPush(x, z, 0.75 * C); st.roadCells++; }, [[fWays(Ws), 1, 0.05], [fOut, 1, 0.05], [fNear, 1, 0.05], [fFar, 4, 0.5], [fSea, 1, 0.3]]);
    }
    // the stalls' white lines (OSM maps no stalls: 2.5 by 5 m, as the usual, in rows along the aisles (the ways inside the car park, both sides) and
    // inward from the car park's sides; a stall whole inside the car park, off the aisles and the roads, past the barriers, within the 62 m and not
    // on another): a stall's two side lines, 12 cm wide, on the ground in 1 m pieces, those of neighbours once
    const fAll = fWays([].concat(...ROAD)), SW = 2.5, SD = 5, SH = [], LR = new RB(false), lk = new Set(), LCOL = [0.86, 0.86, 0.83];
    const okPt = (Q, x, z) => inQ(Q, x, z) && segD(Q, x, z) > 0.2 && fAll(x, z) < -0.25 && fNear(x, z) > 0.3 && fFar(x, z) > 0.5 && fSea(x, z) > 0.3 && !inFort(x, z, 2);
    const over = (a, b) => { for (const [ux, uz] of [[a.ux, a.uz], [-a.uz, a.ux], [b.ux, b.uz], [-b.uz, b.ux]]) {   // (the two rectangles' separating axes)
      const pr = (r) => SW / 2 * Math.abs(r.ux * ux + r.uz * uz) + SD / 2 * Math.abs(-r.uz * ux + r.ux * uz);
      if (Math.abs((a.x - b.x) * ux + (a.z - b.z) * uz) >= pr(a) + pr(b) - 0.05) return false; } return true; };
    const line = (ax, az, bx, bz) => {
      const key = Math.round((ax + bx) * 2.5) + ',' + Math.round((az + bz) * 2.5); if (lk.has(key)) return; lk.add(key);
      const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L)), px = -(bz - az) / L * 0.06, pz = (bx - ax) / L * 0.06; let r0 = -1;
      for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n, r = LR.row([[x - px, nrGround(x - px, z - pz) + 0.1, z - pz], [x + px, nrGround(x + px, z + pz) + 0.1, z + pz]], [LCOL, LCOL]);
        if (r0 >= 0) { const cr = (2 * px) * (z - (az + (bz - az) * (i - 1) / n)) - (2 * pz) * (x - (ax + (bx - ax) * (i - 1) / n)); if (cr < 0) LR.I.push(r0, r0 + 1, r, r0 + 1, r + 1, r); else LR.I.push(r0, r, r0 + 1, r0 + 1, r, r + 1); }
        r0 = r; }
      st.lines++;
    };
    const row = (Q, ax, az, bx, bz, nx, nz, o) => {   // a row of stalls along a→b, their fronts o m off it towards n
      const L = Math.hypot(bx - ax, bz - az); if (L < SW + 0.5) return; const ux = (bx - ax) / L, uz = (bz - az) / L, m = Math.floor((L - 0.4) / SW), t0 = (L - m * SW) / 2;
      for (let i = 0; i < m; i++) {
        const t = t0 + (i + 0.5) * SW, s = { x: ax + ux * t + nx * (o + SD / 2), z: az + uz * t + nz * (o + SD / 2), ux, uz };
        let ok = okPt(Q, s.x, s.z); for (const [p, q] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) ok = ok && okPt(Q, s.x + ux * p * SW / 2 + nx * q * SD / 2, s.z + uz * p * SW / 2 + nz * q * SD / 2);
        if (!ok || SH.some(r => over(r, s))) continue;
        SH.push(s); st.stalls++;
        for (const p of [-1, 1]) line(s.x + ux * p * SW / 2 - nx * SD / 2, s.z + uz * p * SW / 2 - nz * SD / 2, s.x + ux * p * SW / 2 + nx * SD / 2, s.z + uz * p * SW / 2 + nz * SD / 2);
      }
    };
    if (!PARK_B) PARK.forEach((Q, k) => {
      for (const W of ROAD[k]) for (let j = 1; j + 3 < W.length; j += 2) {   // the aisles: the ways' pieces inside the car park, both sides
        const ax = W[j], az = W[j + 1], bx = W[j + 2], bz = W[j + 3], L = Math.hypot(bx - ax, bz - az); if (!inQ(Q, (ax + bx) / 2, (az + bz) / 2)) continue;
        for (const sg of [-1, 1]) row(Q, ax, az, bx, bz, -sg * (bz - az) / L, sg * (bx - ax) / L, W[0] + 0.2);
      }
      const n = Q.length / 2, sides = [];
      for (let j = 0; j < n; j++) { const ax = Q[2 * j], az = Q[2 * j + 1], bx = Q[(2 * j + 2) % Q.length], bz = Q[(2 * j + 3) % Q.length]; sides.push([Math.hypot(bx - ax, bz - az), ax, az, bx, bz]); }
      for (const [L, ax, az, bx, bz] of sides.sort((p, q) => q[0] - p[0])) {   // the sides, the longest first: inward
        let nx = -(bz - az) / L, nz = (bx - ax) / L; if (!inQ(Q, (ax + bx) / 2 + nx * 0.5, (az + bz) / 2 + nz * 0.5)) { nx = -nx; nz = -nz; }
        row(Q, ax, az, bx, bz, nx, nz, 0.4);
      }
    });
    if (!LR.empty) { const m = new THREE.Mesh(LR.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -12 }));
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'roadside-lines'; root.add(m); st.meshes++; }

    const MAT = [[tex.asphalt, 'roadside-asphalt'], [tex.sand, 'roadside-murram'], [tex.grass, 'roadside-lawn'], [null, 'roadside-pond']], mats = [], off = { polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 };
    const matOf = (mt) => mats[mt] || (mats[mt] = mt === 3
      ? Object.assign(A.waterMat(tex, { plain: true, color: 0x4f5e3e, len: 0.5, amp: 0.3, refl: 0.38, land: 0.9, shal: 0, lap: 0.4, surf: 0 }), off, { polygonOffsetFactor: -4, polygonOffsetUnits: -10 })
      : new THREE.MeshLambertMaterial(Object.assign({ map: MAT[mt][0], vertexColors: true }, off)));
    for (const { mt, rb } of tiles.values()) {
      if (rb.empty) continue;
      const m = new THREE.Mesh(rb.geometry(), matOf(mt)); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = MAT[mt][1]; root.add(m); st.meshes++;
    }
    last = st;
    return { open: () => { for (const k of held) eh.set(k, eh.get(k).filter(e => !e.held)); held.clear(); } };   // (the lawns' circles out of the hash again)
  };

  // the numbers into the world's stats (read by the tests)
  const base = World.ext.mombasa;
  World.ext.mombasa = (scene, tex, opts) => { last = null; const out = base(scene, tex, opts); if (out && out.stats && last) out.stats.roadside = last; last = null; return out; };
})();
