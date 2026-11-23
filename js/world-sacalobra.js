/* =========================================================================
   WORLD — Sa Calobra, Spain (docs/proge/sacalobra.md): the limestone by the road, in the shared world of the mountain passes
   (js/world-prelaz.js: PL_LOOK.sacalobra, its L.extra). The cliffs OpenStreetMap maps within ~220 m of the road (natural=cliff: the line
   along the top, the face on the right of the way) as grey limestone faces, the dark streaks the water leaves down them, ochre stains,
   the garrigue on their crests; how high from the public elevation model (Copernicus DEM GLO-30: the drop across each line, a little more
   than half of it standing as rock, the rest left to the terrain's own slope). With them the dry-stone terraces (barrier=retaining_wall:
   a face of 1.2–2.2 m, as OSM gives no height; the level strip behind it) and the field walls (barrier=wall, ~1.2 m). Only to look at:
   nothing stands where a car can go (behind the stone walls along the road, 1.2 m past the barrier line; 7 m where none stands and the
   soft hills of def.hills go on, at the ends, by the plots); all in the scenery's own chunks, hardly a draw call more. Data: OSM (ODbL 1.0)
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.sacalobra) return;
  const API = World.api;
  const { caGround, clamp, vrDist, vrNear } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });
  const LOOK = API.PL_LOOK.sacalobra;

  // the cliffs: [the drop by the DEM (m), x,z, x,z, …] (OSM natural=cliff: the line along the top, the face right of the way it is drawn)
  const CLIFF = [
    [26, 525.1,-107,499.8,-86.9,490.2,-58.5,488.3,-32.4,474.6,-8.2,450.7,11.5,413.9,38.9,401.1,39.8,385.5,50.3,372.6,48.5,354.7,57.7,316.6,57.7,267.9,17.4,249.1,18.8,228.4,37.1,201.8,61.8,173.3,71.8,137,80.1,107.6,85.1,81.9,93.8,54.4,110.3], // s≈-119 D
    [28, 249.1,18.8,222.5,25.2,175.6,49.9,153.6,47.6,119.1,47.6,96.2,31.6,90.7,44.4,63.6,49,25,61.8], // s≈-65 D
    [35, -84.2,-12.3,-84.3,0.4,-92.7,36.7,-84.6,63.5,-78.5,75.2], // s≈239 D
    [19, -64.8,198.5,-69,223.6,-64.6,234,-57,257.3,-62,266.5,-73.3,270.6,-74.9,259.1,-83.8,254.6,-99.5,258.5,-117.8,271.2,-126.9,279,-135.5,287,-140.7,302.4,-145.4,313.2,-147.7,323.4], // s≈579 L
    [16, 36.9,296,-13.6,312.4,-27.8,335.3,-39.3,343.1,-48.5,330.3,-80.2,349.5,-93,377.4,-111.4,375.1,-120.1,376.9,-161.9,408,-172.5,411.2], // s≈579 L
    [22, -69.6,465.2,-98.1,468.4,-110,477.6,-106.4,492.7], // s≈634 L
    [22, -6.2,460.6,-52.6,484.9,-74.7,481.2,-106.4,492.7,-126.1,503.6,-144.9,502.7,-159.6,505,-140.8,492.7,-123.8,485.3,-154.1,481.2,-168.8,485.8,-183.5,485.8,-205.1,484.4,-228.3,479.8], // s≈639 L
    [1, -223.9,424.5,-276.3,416.3,-286.4,421.3,-302.9,413.5,-319.4,425,-345.1,419.9], // s≈644 L
    [25, -181.7,279,-216.6,273.1,-238.1,255.3,-275.8,265.3,-287.3,272.6,-303.8,265.3,-324,290], // s≈654 L
    [33, -112.5,-176.9,-152.1,-107.2,-158.3,-89], // s≈1348 D
    [13, -92.1,-463.6,-98.4,-452.8,-97.4,-433.8,-107.8,-403.4,-114.6,-378.9,-128.5,-357.2,-143.8,-342.3,-163.4,-321.5], // s≈1448 D
    [38, -532,162.9,-544.9,139.1,-561.4,151.4,-570.1,161,-589,149.1,-599.1,145.5,-616.5,165.1,-629.8,168.8,-652.8,161,-667.5,165.6,-672.6,175.7,-692.3,178.4,-708.4,178,-724.4,192.1,-738.7,202.7], // s≈2502 L
    [28, -534.3,48.5,-571.5,53.5,-603.2,68.6,-621.1,72.8,-639.5,65.4,-661.1,73.7,-673.5,74.6], // s≈2572 D
    [30, -296,16.5,-328.1,11.5,-363.5,21.5,-364,64.5,-369.9,91.5,-387.8,140.9,-409,135,-420.4,176.6,-461.3,161.5,-510,153.3,-532,162.9,-552.9,257.8,-572.4,300.7,-607.3,298.5,-660.2,268.5,-713.4,228.3,-738.7,202.7,-790.6,194.9,-781.8,214.1,-813.5,237,-806.2,204.5,-813.5,178,-839.7,222.3,-879.2,202.2,-903.1,236,-920.1,250.2,-919.2,267.1,-951.3,263,-965.1,239.7,-987.1,234.7,-1003.6,243.4,-1009.6,283.6,-989,295.5,-985.4,310.8,-989.5,325.7,-1012.7,344.2,-1036.7,361.2,-1039.6,387.9,-1064.1,396.6,-1086.8,387.6,-1092.3,425.4,-1090.9,445.1,-1100.5,466.6,-1165.7,480.3,-1178.6,494,-1213,532.3,-1216.5,563.9], // s≈3310 L
    [13, -938.1,-88.3,-967.6,-107.9,-992.5,-133.8,-1002.9,-139.6,-1010.8,-138.6,-1025,-125.9,-1035.4,-116.2,-1052.7,-107.2], // s≈4000 D
    [12, -1197.8,-472.4,-1196.6,-506.4,-1180.1,-537.9,-1174,-574.9,-1153.9,-557.9,-1164.9,-591.9,-1164.9,-622.9,-1153.9,-645.9,-1152.1,-662.9,-1155.2,-679.3,-1139.3,-687.8], // s≈4429 L
    [13, -1090.7,-449.8,-1095.5,-468.4,-1093.4,-477.7,-1087.1,-479.5,-1085,-484.8], // s≈4509 L
    [20, -1098.5,-366.6,-1096.1,-386.1,-1108.1,-410.3,-1101.2,-419.6,-1100.3,-440], // s≈4509 D
  ];
  // the terraces' retaining walls (OSM barrier=retaining_wall: the lower side on the right)
  const TERR = [
    [-1068.8,147.4,-1082.6,153],
    [-1078,137.6,-1094.5,135.7],
    [-1079.1,103.9,-1108.2,115.9],
    [-1076.9,117.7,-1102.8,123.6],
    [-1102.5,96.2,-1121,109.9],
    [-1108.5,75.4,-1126.5,86.3,-1145.2,100.5],
    [-1099.1,64.2,-1104.8,70.4],
    [-1126.3,72.8,-1153.1,88.2],
    [-1091.5,48.4,-1085.9,78.4],
    [-1141.4,62.7,-1157.1,70.2],
    [-1101.1,43.7,-1099,55.5,-1096.3,63.8],
    [-1102.2,30.8,-1103.1,43.3],
    [-1150.4,55.2,-1158.4,59.8],
    [-1112.1,32.5,-1111.7,52.7,-1119.4,54.4,-1127,58.8],
    [-1258.6,33.9,-1266.2,30],
    [-1211.5,8.7,-1246.1,10.9],
    [-1215.1,-0.3,-1249.1,2.4],
    [-1128.2,-19.7,-1124.2,5.7],
    [-1183.1,-15.3,-1194.3,-26.7,-1226.3,-8.2],
    [-1227.4,-3.8,-1252.8,-14.1],
    [-1221,-16.3,-1243.5,-18.1],
    [-1143.9,-38.3,-1150.9,-16],
    [-1211.7,-25,-1252.5,-26.3],
    [-1197.9,-31.6,-1210,-33.1],
    [-1092,-54.7,-1098.5,-35.3],
    [-1113.7,-52.6,-1115.4,-34.1,-1113.5,-21.6],
    [-1101.2,-65.9,-1107.5,-48.2],
    [-1205.1,-45,-1227.6,-41.9],
    [-1160.9,-60.8,-1164.1,-48.8,-1181.7,-54.5],
    [-1122.8,-77,-1131,-49.4],
    [-1227.4,-59.7,-1255.1,-54.9],
    [-1135.1,-77.6,-1140.8,-47.2],
    [-1150.4,-76.5,-1150.7,-42.6,-1159.4,-27.7],
    [-1176,-82.3,-1186.9,-78.5],
    [-1208.3,-76.4,-1233.3,-85],
    [-1232.8,-70.1,-1256.7,-75.3],
    [-1226.5,-76,-1242.5,-83.5,-1253.2,-89.7],
    [-1148.4,-153.2,-1157.4,-135.3,-1155.9,-127.6,-1143.7,-99.1],
    [-1109.1,-109.2,-1108.5,-91.6,-1106.4,-71.7],
    [-1113.9,-114.2,-1115.4,-98.7],
    [-1169.9,-103.5,-1171.2,-97.5,-1171.2,-82.7,-1169.2,-71.8,-1187.6,-63.2],
    [-1138.6,-120.1,-1138,-87.9],
    [-1180.1,-114.2,-1182.1,-91.1],
    [-1127.2,-131.5,-1122.4,-93],
    [-1176.4,-138.6,-1180.5,-135,-1180.9,-129.2,-1178.2,-122.6],
    [-1163,-181.4,-1165.5,-166.7,-1164.1,-153.2],
    [-1172,-182.1,-1174.5,-163.6,-1173.3,-151.8],
    [-1150.9,-198.1,-1155.1,-169.3,-1151.5,-155.3],
    [-1110.1,-169.5,-1112.1,-158.3,-1112.6,-149.7],
    [-1119.4,-172.6,-1123.5,-161.9],
    [-1139.6,-191.4,-1138.8,-185.7,-1132.9,-171.8],
    [-923.5,-116.7,-957.9,-145],
    [-925.9,-131.4,-963.6,-172.8],
    [-961.6,-178.1,-977.9,-193.7],
    [-1061.9,-257.9,-1073.4,-216.9],
    [-1163.2,-209.3,-1165.1,-186.1],
    [-1168.9,-210.9,-1171.2,-205.9,-1167.9,-194.7],
    [-996.3,-343.2,-1011.8,-359.2],
    [-978.2,-334.3,-1002.3,-362.2],
    [-960.7,-310,-979.9,-326.5],
    [-910.2,-275.7,-952.8,-306.3],
    [-906.8,-171.1,-924.6,-187.3,-948.4,-203.6],
    [-899.5,-185.1,-932.6,-210.6,-938.5,-213.2],
    [-911.2,-138.2,-945.8,-173.1],
    [-907.2,-151.8,-925.7,-174.4],
    [-894,-141.5,-900.6,-163.8],
    [-884.3,-139.7,-885.9,-159.7],
    [-852.6,-152.4,-853,-156.6,-866,-178.1],
    [-847.1,-164.3,-854.6,-181.4],
    [-864.1,-152.9,-873.7,-167.8],
    [-902.6,-557.2,-929.3,-611.4,-934.4,-628.8,-943.2,-653.5,-952.9,-676.9,-952.4,-695.4,-955.4,-725.4,-953.2,-737.8,-951.1,-748.4],
    [-849.2,-608.4,-859,-580.7],
  ];
  // the field walls (OSM barrier=wall)
  const WALL = [
    [249.1,389,161.7,288.9,116.3,216.8,109.8,206.8],
    [-666.2,882.1,-663.4,878.4,-659,870.6,-636.2,835.4,-624.5,793.1,-588.5,757.2,-561.8,722.5,-512.9,684.9,-496.1,660,-403.7,572.6,-307.2,539,-228.3,479.8,-206.9,467.5,-199.8,456.7,-194.6,449.9,-183.4,412.2,-157.8,363],
    [-1168.2,38.7,-1148.3,36.4,-1118.8,30.5,-1094.2,23.1],
    [-1178,40,-1223.2,45.9],
    [-985,-183.7,-978.3,-200.6,-995.8,-246.5,-1008.2,-250.7,-1011.8,-253.3],
    [-891.7,-117.8,-884.9,-125,-821.3,-173.6],
    [-785.3,-285.1,-785.8,-281.4,-791.1,-264.2],
    [-786.4,-318,-781.4,-333.3,-778.1,-364.5,-780.1,-399,-775.8,-424.2,-764.9,-463.5,-761.5,-482.6,-761.1,-487.4,-765.1,-498.2],
    [-831.3,-665.5,-836.7,-678.2,-840.1,-710.6,-845.6,-739.7,-855.8,-751.9,-861,-765.9,-874.8,-784.4],
  ];

  const hsh = (a, b) => { let h = Math.imul((a | 0) ^ 0x27d4eb2d, 0x9e3779b1) ^ Math.imul(((b | 0) + 0x165667b1) | 0, 0x85ebca77); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; return (h >>> 0) / 4294967296; };
  const n1 = (s, k) => { const i = Math.floor(s), f = s - i, u = f * f * (3 - 2 * f); return hsh(i, k) * (1 - u) + hsh(i + 1, k) * u; };   // (value noise along a line, 0..1)
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

  // a line (flat x, z, … from index o) at an even step, with its tangent: [{ x, z, s, tx, tz }], .tot its length
  function resample(a, o, step) {
    const P = [], out = [];
    for (let k = o; k + 1 < a.length; k += 2) { const q = [a[k], a[k + 1]], l = P[P.length - 1]; if (!l || Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.05) P.push(q); }
    if (P.length < 2) return out;
    const L = [0]; for (let k = 1; k < P.length; k++) L.push(L[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
    const tot = L[L.length - 1], n = Math.max(1, Math.round(tot / step));
    for (let q = 0, g = 0; q <= n; q++) {
      const s = tot * q / n; while (g < P.length - 2 && L[g + 1] < s) g++;
      const f = clamp((s - L[g]) / (L[g + 1] - L[g] || 1), 0, 1);
      out.push({ x: P[g][0] + (P[g + 1][0] - P[g][0]) * f, z: P[g][1] + (P[g + 1][1] - P[g][1]) * f, s, tx: 0, tz: 0 });
    }
    for (let q = 0; q < out.length; q++) { const A = out[Math.max(0, q - 1)], B = out[Math.min(out.length - 1, q + 1)], dx = B.x - A.x, dz = B.z - A.z, l = Math.hypot(dx, dz) || 1; out[q].tx = dx / l; out[q].tz = dz / l; }
    out.tot = tot; return out;
  }
  // the runs of a line's stations that stand (null: dropped), each station given e: how far (m) to the nearer end of its run
  function runs(S, min) {
    for (let q = 0; q < S.length;) {
      if (!S[q]) { q++; continue; } let j = q; while (j < S.length && S[j]) j++;
      if (j - q < min) for (let k = q; k < j; k++) S[k] = null;
      else for (let k = q; k < j; k++) S[k].e = Math.min(S[k].s - S[q].s, S[j - 1].s - S[k].s);
      q = j;
    }
  }

  // the room the road keeps past its barrier line: 1.2 m where a stone wall stands along it; 7 m where none does (under a steep hill, as
  // world-prelaz.js's railNeed decides it, where the soft hills of def.hills go on 6 m; the ends; by the plots and the buildings)
  let ST = null, iS0 = 0, iS1 = 0, EXC = null;
  function steepRuns() {
    const N = T.N, m = Math.round(16 / T.ds), st = [new Uint8Array(N), new Uint8Array(N)];
    for (const side of [-1, 1]) {
      const a = st[side > 0 ? 1 : 0];
      for (let i = 0; i < N; i++) {
        const bar = side > 0 ? T.br[i] : T.bl[i], gAt = (d) => { const o = side * (bar + d); return caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) - T.hy[i]; };
        a[i] = gAt(3) > -0.6 && gAt(8) > 1.5 && gAt(12) > 3.5 ? 1 : 0;
      }
      for (let i = 0; i < N;) { if (!a[i]) { i++; continue; } let j = i; while (j < N && a[j]) j++; if (j - i < m) for (let k = i; k < j; k++) a[k] = 0; i = j; }
    }
    return st;
  }
  function push(x, z) {   // null: clear of the road; else [how far still, ax, az]: the way out
    const r = vrNear(x, z); if (r.i < 0) return null;
    const i = r.i, dd = r.dd, side = r.lat > 0 ? 1 : -1, bar = side > 0 ? T.br[i] : T.bl[i];
    const soft = ST[side > 0 ? 1 : 0][i] || i < iS0 || i > iS1 || EXC(T.px[i] + T.nx[i] * side * bar, T.pz[i] + T.nz[i] * side * bar);
    const need = soft ? 7 : 1.2;
    return dd >= need ? null : [need - dd + 0.3, T.nx[i] * side, T.nz[i] * side];
  }

  // the cliffs: per station (every ~3.2 m along the line) a column of four points from the foot (buried 1.5 m) up the face, leaning back a
  // little, to the crest; then a rounded shoulder and the crest's back into the slope (till the ground comes up to it, at most 10.5 m,
  // never toward the road; where it does not, its back falls to the ground, bare rock). A station too near the road moves away from it (at
  // most 14 m), else it drops; the faces taper to the ends of a run
  function cliffs(scen, st) {
    const R = LOOK.rockCols, warm = LOOK.rockWarm, lich = LOOK.lichen, shrub = LOOK.shrub, rows = [0, 0.38, 0.72, 1];
    CLIFF.forEach((c, ci) => {
      const pts = resample(c, 1, 3.2), H0 = clamp(c[0] * 0.55, 4, 18);
      const S = pts.map((p) => {
        const nx = -p.tz, nz = p.tx;   // (the face: right of the way)
        if (vrDist(p.x, p.z) > LOD.cap(260)) return null;
        let ox = 0, oz = 0, ok = false;
        for (let it = 0; it < 4 && !ok; it++) {
          let w = null;
          for (const o of [1.4, 0, -0.18 * H0 * 1.25]) { const q = push(p.x + nx * o + ox, p.z + nz * o + oz); if (q && (!w || q[0] > w[0])) w = q; }
          if (!w) ok = true; else { ox += w[1] * w[0]; oz += w[2] * w[0]; }
        }
        if (!ok || Math.hypot(ox, oz) > 14 || EXC(p.x + ox, p.z + oz)) { st.dropped++; return null; }
        if (ox || oz) st.moved++;
        return { x: p.x + ox, z: p.z + oz, s: p.s, nx, nz, e: 0 };
      });
      runs(S, 3);
      for (const A of S) {
        if (!A) continue;
        const { x, z, nx, nz } = A, u = clamp(A.e / 12, 0, 1), k10 = Math.round(A.s * 10);
        let H = H0 * (0.12 + 0.88 * u * u * (3 - 2 * u)) * (0.75 + 0.5 * n1(A.s / 9, ci * 7 + 1));
        const g0 = caGround(x, z), gF = caGround(x + nx * 1.4, z + nz * 1.4);
        let yT = g0 + H;
        const r = vrNear(x, z); if (r.i >= 0 && (T.px[r.i] - x) * nx + (T.pz[r.i] - z) * nz < 0) yT = Math.min(yT, T.hy[r.i] - 0.9);   // (a road along the top: the rock not above it)
        H = Math.max(0.6, yT - g0); yT = g0 + H;
        const yF = Math.min(g0, gF) - 1.5, lean = 0.18 * H, fx = x + nx * 1.4, fz = z + nz * 1.4, tx = x - nx * lean, tz = z - nz * lean, V = [];
        for (let k = 0; k < 4; k++) {
          const t = rows[k], j = k === 1 || k === 2 ? 1 : 0, a = (hsh(k10, ci * 31 + k) - 0.5) * j, b = (hsh(k10, ci * 37 + k) - 0.5) * j;
          V.push([fx + (tx - fx) * t + nx * a * 1.2, k ? yF + (yT - yF) * t + b * 0.8 : yF, fz + (tz - fz) * t + nz * a * 1.2]);
        }
        let bk = 0, yE = null;
        for (let d = 1.5; d <= 10.5; d += 1.5) { const qx = tx - nx * d, qz = tz - nz * d; if (push(qx, qz)) break; bk = d; const g = caGround(qx, qz); if (g >= yT - 0.3) { yE = g - 0.25; break; } }
        if (bk < 1.5) bk = 1.2;
        const ex = tx - nx * bk, ez = tz - nz * bk, sh = Math.min(1.6, bk * 0.4);
        A.flat = yE != null;   // (the crest runs into the slope behind; else its back falls to the ground, bare rock)
        if (yE == null) yE = caGround(ex, ez) - 0.5;
        V.push([tx - nx * sh, yT + 0.2 + 0.35 * hsh(k10, ci * 41), tz - nz * sh], [ex, yE, ez]);
        A.V = V;
      }
      for (let q = 0; q + 1 < S.length; q++) {
        const A = S[q], B = S[q + 1]; if (!A || !B) continue;
        const sm = (A.s + B.s) / 2, g = scen.get((A.x + B.x) / 2, (A.z + B.z) / 2), base = R[Math.floor(hsh(Math.round(sm / 7), ci * 13) * R.length)];
        const streak = 0.8 + 0.2 * n1(sm / 2.3, ci * 17 + 3), ochre = clamp((n1(sm / 15, ci * 19 + 5) - 0.55) * 3, 0, 0.7);
        const inside = [(A.V[1][0] + B.V[1][0]) / 2 - (A.nx + B.nx) * 4, (A.V[1][1] + B.V[1][1] + A.V[2][1] + B.V[2][1]) / 4, (A.V[1][2] + B.V[1][2]) / 2 - (A.nz + B.nz) * 4];
        for (let k = 0; k < 3; k++) g.quadO(A.V[k], B.V[k], B.V[k + 1], A.V[k + 1], mul(mix(base, warm, ochre * (k === 1 ? 1 : 0.6)), streak * [0.82, 0.95, 1.04][k]), inside);
        // the crest: the rock's own grey with lichen; where it runs into the slope, a little of the garrigue on it, else its back bare rock
        const crest = mix(base, lich, 0.35), green = clamp((n1(sm / 11, ci * 23 + 7) - 0.45) * 1.2, 0, 0.35), bare = mul(mix(base, lich, 0.2), 0.9);
        const backA = A.flat ? mix(crest, shrub, green) : bare, backB = B.flat ? mix(crest, shrub, green) : bare;
        g.quadUp(A.V[3], B.V[3], B.V[4], A.V[4], [crest, crest, crest, crest]);
        g.quadUp(A.V[4], B.V[4], B.V[5], A.V[5], [crest, crest, backB, backA]);
        st.faceM += B.s - A.s;
      }
      st.cliffs++;
    });
  }

  // the terraces: the dry-stone face (leaning back a tenth) from the lower ground up 1.2–2.2 m, the level strip behind it back till the slope
  // comes up to it (at most 9 m); the high side the way the elevation model has it (a line drawn the wrong way turned round)
  function terraces(scen, st) {
    const R = LOOK.rockCols, soil = [0.56, 0.49, 0.38], dry = LOOK.grassDry;
    TERR.forEach((c, ci) => {
      const pts = resample(c, 0, 2); if (pts.length < 2) return;
      let up = 0; for (const p of pts) up += caGround(p.x + p.tz * 5, p.z - p.tx * 5) - caGround(p.x - p.tz * 5, p.z + p.tx * 5);
      const fl = up < -0.3 * pts.length ? -1 : 1;
      const S = pts.map((p) => {
        const nx = -p.tz * fl, nz = p.tx * fl;
        if (vrDist(p.x, p.z) > LOD.cap(240) || EXC(p.x, p.z)) return null;
        const hw = 1.2 + 1.0 * n1(p.s / 14, ci * 11 + 2), gL = caGround(p.x + nx * 0.6, p.z + nz * 0.6), yT = gL + hw, lean = 0.1 * hw;
        const fx = p.x + nx * 0.3, fz = p.z + nz * 0.3, tx = p.x - nx * lean, tz = p.z - nz * lean;
        if (push(fx, fz) || push(tx, tz)) return null;
        let bk = 0, yE = null;
        for (let d = 1; d <= 9; d++) { const qx = tx - nx * d, qz = tz - nz * d; if (push(qx, qz)) break; bk = d; const g = caGround(qx, qz); if (g >= yT - 0.05) { yE = g - 0.08; break; } }
        if (bk < 1) return null;
        const ex = tx - nx * bk, ez = tz - nz * bk; if (yE == null) yE = Math.min(yT, caGround(ex, ez)) - 0.3;
        return { x: p.x, z: p.z, s: p.s, nx, nz, e: 0, V: [[fx, gL - 0.5, fz], [tx, yT, tz], [ex, yE, ez]] };
      });
      runs(S, 2);
      for (let q = 0; q + 1 < S.length; q++) {
        const A = S[q], B = S[q + 1]; if (!A || !B) continue;
        const g = scen.get((A.x + B.x) / 2, (A.z + B.z) / 2), sm = Math.round((A.s + B.s) / 2), stone = mul(R[Math.floor(hsh(sm, ci * 7 + 3) * R.length)], 0.8 + 0.12 * hsh(sm, ci * 5));
        const inside = [(A.x + B.x) / 2 - (A.nx + B.nx) * 3, (A.V[0][1] + A.V[1][1]) / 2, (A.z + B.z) / 2 - (A.nz + B.nz) * 3];
        g.quadO(A.V[0], B.V[0], B.V[1], A.V[1], stone, inside);
        const strip = mix(soil, dry, 0.25 + 0.5 * n1(sm / 9, ci * 3 + 1)), edge = mix(stone, strip, 0.5);
        g.quadUp(A.V[1], B.V[1], B.V[2], A.V[2], [edge, edge, strip, strip]);
        st.terraceM += B.s - A.s;
      }
    });
  }

  // the field walls: dry stone ~1.2 m high, 0.64 m thick at the foot, a little narrower at the top, following the ground; closed at the ends
  function walls(scen, st) {
    const R = LOOK.rockCols;
    WALL.forEach((c, ci) => {
      const pts = resample(c, 0, 2); if (pts.length < 2) return;
      const S = pts.map((p) => {
        const nx = -p.tz, nz = p.tx;
        if (vrDist(p.x, p.z) > LOD.cap(220) || EXC(p.x, p.z) || push(p.x + nx * 0.32, p.z + nz * 0.32) || push(p.x - nx * 0.32, p.z - nz * 0.32)) return null;
        const g = Math.min(caGround(p.x + nx * 0.32, p.z + nz * 0.32), caGround(p.x - nx * 0.32, p.z - nz * 0.32)), y1 = caGround(p.x, p.z) + 1.05 + 0.25 * n1(p.s / 6, ci * 5 + 1);
        return { x: p.x, z: p.z, s: p.s, e: 0, V: [[p.x + nx * 0.32, g - 0.4, p.z + nz * 0.32], [p.x + nx * 0.24, y1, p.z + nz * 0.24], [p.x - nx * 0.24, y1, p.z - nz * 0.24], [p.x - nx * 0.32, g - 0.4, p.z - nz * 0.32]] };
      });
      runs(S, 2);
      for (let q = 0; q + 1 < S.length; q++) {
        const A = S[q], B = S[q + 1]; if (!A || !B) continue;
        const g = scen.get((A.x + B.x) / 2, (A.z + B.z) / 2), sm = Math.round((A.s + B.s) / 2), stone = mul(R[Math.floor(hsh(sm, ci * 7 + 9) * R.length)], 0.78 + 0.14 * hsh(sm, ci * 3 + 1)), cap = mul(stone, 1.12);
        const inside = [(A.x + B.x) / 2, (A.V[0][1] + A.V[1][1]) / 2, (A.z + B.z) / 2];
        g.quadO(A.V[0], B.V[0], B.V[1], A.V[1], stone, inside);
        g.quadO(A.V[3], B.V[3], B.V[2], A.V[2], stone, inside);
        g.quadUp(A.V[1], B.V[1], B.V[2], A.V[2], [cap, cap, cap, cap]);
        for (const [E, F] of [[A, S[q - 1]], [B, S[q + 2]]]) if (!F) g.quadO(E.V[0], E.V[1], E.V[2], E.V[3], stone, [(A.x + B.x) / 2, E.V[1][1] - 0.6, (A.z + B.z) / 2]);
        st.wallM += B.s - A.s;
      }
    });
  }

  const prev = LOOK.extra;
  LOOK.extra = function (ctx) {
    if (prev) prev(ctx);
    const { scen, out, excluded } = ctx;
    EXC = excluded; ST = steepRuns(); iS0 = T.idx(T.startS + 40); iS1 = T.idx(T.finishS - 40);
    const st = { cliffs: 0, faceM: 0, moved: 0, dropped: 0, terraceM: 0, wallM: 0 };
    cliffs(scen, st);
    terraces(scen, st); walls(scen, st);   // (the user's choice b, 23. 11. 2026: the 72 terraces and the 9 walls with the cliffs)
    for (const k of ['faceM', 'terraceM', 'wallM']) st[k] = Math.round(st[k]);
    out.sacalobra = st;   // (what was built: Render.world.sacalobra in the page, for tools/shot.mjs and a check by hand)
  };
})();
