/* =========================================================================
   WORLD — Mombasa, the roadside (grafika/mombasa-obcestje): what OpenStreetMap maps by the road and js/world-mombasa.js left to the
   ground's colours, laid on the ground's own triangles from 0.8 m beyond the barriers out to ~62 m (the 60 m rule):
   - the six car parks by the road (amenity=parking): none has a surface in OSM, so after PARK_B (the user's choice in the PR:
     (a) asphalt, faded and patched, (b) the red earth of the coast, murram);
   - the lawns (patches of dry grass in them) of the park in front of the fortress and of the park on the shore past the finish
     (leisure=park), and of the golf course (leisure=golf_course);
   - the golf course's two ponds (natural=water, golf=water_hazard): still, murky water.
   Kept open (OSM has no shape for them, or they are not to be drawn): the golf course's fairways, greens, tees and bunkers (none in
   OSM), the memorial and the information points in the park (nodes), the car parks' lines and signs, the paths and the service roads
   in the parks and on the golf course. Not drawn again: the houses, the walls, the trees and the crowd stay js/world-mombasa.js's;
   its filling houses and its trees now keep off the car parks and the ponds, the filling houses also off the lawns (the trees may stand on them).
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-22; metres, origin = the road's first point
   (js/data/mombasa.js: lat0 −4.0618471, lon0 39.6680345), x east, z south; the outlines simplified to 0.25 m.
   js/world-mombasa.js calls World.ext.mombasaOb once its ground's heights are set (before its tiles and houses), and .open() before its trees.
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

  // the colours (multiplying the pictures): faded asphalt, the red earth (murram), the lawns green with dry patches (the golf course greener)
  const PK_ASP = [1.04, 1.02, 1.0], PK_MUR = [0.92, 0.64, 0.48], LW_GREEN = [[0.74, 0.98, 0.5], [0.64, 0.98, 0.46]], LW_DRY = [1.0, 0.9, 0.56];
  // smooth patches (value noise on a 9 m lattice, from the place alone: the same every time, no draw from the world's random numbers)
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => {
    const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
  const mix = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  const asphaltAt = (x, z) => { const f = 0.93 + 0.1 * patch(x + 500, z); return PK_ASP.map(c => c * f); };
  const murramAt = (x, z) => { const f = 0.92 + 0.12 * patch(x + 300, z - 200); return PK_MUR.map(c => c * f); };
  const lawnAt = (k) => (x, z) => mix(LW_GREEN[k], LW_DRY, Math.min(1, Math.max(0, patch(x - 700, z + 900) * 1.8 - (k ? 0.75 : 0.5))));
  const W1 = () => [1, 1, 1];

  let last = null;   // (the last build's numbers, for the stats)
  World.ext.mombasaOb = function (o) {
    const { eh, EHC, exclPush, seaD, inFort, root, tex } = o, { RB, nrGround, nrNear } = A, G = A.NR.G, X0 = G.x0, Z0 = G.z0;
    const st = { parkCells: 0, lawnCells: 0, pondCells: 0, meshes: 0, pondDrop: [] };
    const ddAt = (x, z) => { const n = nrNear(x, z); return n.i < 0 ? 99 : n.dd; };
    // what is laid goes into a mesh per material (0 asphalt, 1 murram, 2 lawn, 3 water) and 120 m square (out of the frame, out of the draw)
    const TILE = 120, tiles = new Map();
    const rbAt = (mt, x, z) => { const key = mt + ',' + Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let t = tiles.get(key); if (!t) tiles.set(key, t = { mt, rb: new RB(true), V: new Map() }); return t; };
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
    // the squares on the ground's 8 m grid (4 m, halved to 1 m by the barriers) and in each the ground's two triangles (the diagonal from
    // its north-east to its south-west corner, as nrGround's): every vertex on the ground's own plane, so the mesh lies on it as laid
    const lay = (Q, mt, colAt, lift, U, onCell) => {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (let k = 0; k < Q.length; k += 2) { x0 = Math.min(x0, Q[k]); x1 = Math.max(x1, Q[k]); z0 = Math.min(z0, Q[k + 1]); z1 = Math.max(z1, Q[k + 1]); }
      const vtx = (t, x, z) => t.rb.row([[x, nrGround(x, z) + lift, z]], [colAt(x, z)], [[x / U, z / U]]);
      const cor = (t, x, z) => { const key = Math.round(x - X0) * 100003 + Math.round(z - Z0); let v = t.V.get(key); if (v === undefined) t.V.set(key, v = vtx(t, x, z)); return v; };
      const tris = (t, P) => {
        const n = P.length / 2, b0 = t.rb.n; if (Math.abs(area(P)) < 0.01) return;
        for (let k = 0; k < n; k++) vtx(t, P[2 * k], P[2 * k + 1]);
        for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(Array.from({ length: n }, (_, k) => new THREE.Vector2(P[2 * k], P[2 * k + 1])), [])) {
          const cr = (P[2 * b] - P[2 * a]) * (P[2 * c + 1] - P[2 * a + 1]) - (P[2 * b + 1] - P[2 * a + 1]) * (P[2 * c] - P[2 * a]);
          if (cr < 0) t.rb.I.push(b0 + a, b0 + b, b0 + c); else t.rb.I.push(b0 + a, b0 + c, b0 + b);   // (up-facing: x east, z south)
        }
      };
      const sq = (Q, sx, sz, C) => {
        const P = clipHP(clipHP(clipHP(clipHP(Q, 1, 0, -sx), -1, 0, sx + C), 0, 1, -sz), 0, -1, sz + C); if (!P) return;
        let cx = 0, cz = 0; for (let k = 0; k < P.length; k += 2) { cx += P[k]; cz += P[k + 1]; } cx /= P.length / 2; cz /= P.length / 2;
        const dc = ddAt(cx, cz); if (dc > 62) return;
        if (dc < 0.8 + 0.75 * C) {   // (by the barrier: every corner 0.8 m beyond it, or the square halved)
          let mn = dc; for (let k = 0; k < P.length && mn >= 0.8; k += 2) mn = Math.min(mn, ddAt(P[k], P[k + 1]));
          if (mn < 0.8) { if (C > 1) { const h = C / 2; sq(P, sx, sz, h); sq(P, sx + h, sz, h); sq(P, sx, sz + h, h); sq(P, sx + h, sz + h, h); } return; }
        }
        if (seaD(cx, cz) > -2 || inFort(cx, cz, 2)) return;
        const t = rbAt(mt, cx, cz);
        if (Math.abs(Math.abs(area(P)) - C * C) < 1e-3 * C * C) { const a = cor(t, sx, sz), b = cor(t, sx + C, sz), c = cor(t, sx + C, sz + C), d = cor(t, sx, sz + C); t.rb.I.push(a, d, b, c, b, d); }
        else { const s = sx + sz + C; tris(t, clipHP(P, -1, -1, s) || [0, 0, 0, 0, 0, 0]); tris(t, clipHP(P, 1, 1, -s) || [0, 0, 0, 0, 0, 0]); }
        onCell(cx, cz, C);
      };
      for (let j = Math.floor((z0 - Z0) / 4); j <= Math.floor((z1 - Z0) / 4); j++) for (let i = Math.floor((x0 - X0) / 4); i <= Math.floor((x1 - X0) / 4); i++) sq(Q, X0 + i * 4, Z0 + j * 4, 4);
    };

    // the car parks and the ponds keep everything off for good; the lawns only the houses (their circles shrink to nothing in open())
    const held = new Set(), hold = (x, z, r) => { const e = { x, z, r, held: true };
      for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); held.add(k); } };
    for (const Q of PARK) lay(Q, PARK_B ? 1 : 0, PARK_B ? murramAt : asphaltAt, 0.08, PARK_B ? 4 : 3, (x, z, C) => { exclPush(x, z, 0.75 * C); st.parkCells++; });
    for (const Q of LAWN) lay(Q.slice(1), 2, lawnAt(Q[0]), 0.06, 2, (x, z, C) => { hold(x, z, 0.75 * C); st.lawnCells++; });
    for (const Q of POND) { let lo = 1e9, hi = -1e9;
      lay(Q, 3, W1, 0.12, 8, (x, z, C) => { exclPush(x, z, 0.75 * C); st.pondCells++; const h = nrGround(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h); });
      if (hi >= lo) st.pondDrop.push(Math.round((hi - lo) * 100) / 100); }

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
