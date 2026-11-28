/* =========================================================================
   WORLD — Krásna Hôrka, Slovaška (theme 'krasnahorka'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra. Made by tools/nova-proga.mjs (the style from tools/predogled/proge.json).
   The castle on the hill at the top (Matej, 15. 11. 2026: "grad naredi podrobno po resnični obliki ... kot cel grad (strehe, stolpi), samo od
   zunaj"): its walls after the castle's outline in OpenStreetMap (ways 112611305 and the buildings in it), its height after the hill's peak
   (485 m), whole as before the fire of 2012, from outside only: white walls, dark shingle roofs, round bastions, the main tower, the chapel with
   its apse, the gate tower at the end of the road. No inscriptions, statues, coats of arms or ornaments. The surface model (Copernicus DSM) has
   the castle's roofs in it: the hilltop is levelled under it first (S.pads), the castle's own buildings left out of the import's (S.bldOmit),
   no trees on the hill (S.excl).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  // the castle's literals below are in the frame of the first, short import (its start by the castle); the road now starts 3.4 km away on II/549
  // (22. 11. 2026), so castle() draws in the old frame and shifts every point by D (the new origin, DEM base 623.84 m instead of 452.12 m)
  const DX = -918.0, DY = -171.72, DZ = 1033.4;
  const CX = -516, CZ = 331;   // (the castle's middle, in the old frame)
  // the castle's outer wall (OSM way 112611305, in the track's metres: x east, z south)
  const RING = [[-565.5, 299.4], [-563.9, 298.3], [-562.5, 297.8], [-560.9, 297.7], [-559.5, 298], [-558.2, 298.7], [-556.7, 300.1], [-535.6, 297.3], [-488.5, 295.6],
    [-487.9, 294.1], [-487, 292.5], [-485.8, 291.4], [-484.2, 290.6], [-483.2, 290.3], [-481.3, 290.2], [-480.7, 291.3], [-477.8, 291.5], [-475.7, 292.8], [-474, 295.1],
    [-473.2, 297.9], [-473.6, 301.2], [-475.2, 303.5], [-465.4, 315.7], [-464.3, 315.6], [-464.1, 316.8], [-465.1, 317.1], [-467.3, 326.3], [-473, 337.5], [-479.1, 353.5],
    [-488.5, 360.6], [-488.1, 361.4], [-494.8, 371.8], [-528.7, 357.3], [-550.1, 341.3], [-556.1, 334.3], [-551.6, 331.7], [-560.3, 309.1], [-560.8, 309.3], [-561.8, 309.3],
    [-563.3, 309], [-564.6, 308.3], [-566.1, 306.9], [-566.6, 306.1], [-567.2, 304.1], [-567.1, 302.6], [-566.9, 301.4]];
  const T0 = 35;   // (the top of the castle's terrace: the hill's peak, 485 m, is about 32.7)
  const WALL = [0.86, 0.84, 0.78], WALL2 = [0.8, 0.78, 0.72], STONE = [0.55, 0.52, 0.47], STONE2 = [0.44, 0.42, 0.38], ROOF = [0.3, 0.27, 0.25], ROOF2 = [0.26, 0.24, 0.23],
    WIN = [0.15, 0.14, 0.13], GATE = [0.1, 0.09, 0.09];
  // the wings (the spines of the buildings in OSM): the points, the width, the eave
  const WINGS = [
    [[[-556, 300.8], [-507, 300]], 6, 45],   // north
    [[[-556.1, 307.5], [-547.4, 330.1]], 8.5, 45],   // west
    [[[-530.5, 300], [-530, 320]], 9, 47],   // the upper castle's palace
    [[[-508.5, 300], [-506, 334]], 7, 44],
    [[[-541, 324.5], [-512, 340.5]], 8, 43],
    [[[-549.5, 337.6], [-527.4, 354.3], [-497, 366.5]], 7, 41],   // south
    [[[-490, 299.5], [-478.5, 305.5], [-470.5, 317], [-472.5, 327.5], [-477.5, 339], [-483.5, 352.5]], 6, 40],   // the lower castle along the east wall
  ];

  function castle(ctx) {
    const { box, cyl, cone, gable } = World.api, gH0 = ctx.out.groundH, g0 = ctx.scen.get(CX + DX, CZ + DZ);
    const gH = (x, z) => gH0(x + DX, z + DZ) - DY, S = p => [p[0] + DX, p[1] + DY, p[2] + DZ];
    const g = Object.create(g0);   // (every triangle goes through tri/triN: shift its points there)
    g.tri = (a, b, c, ...r) => g0.tri(S(a), S(b), S(c), ...r);
    g.triN = (a, b, c, ...r) => g0.triN(S(a), S(b), S(c), ...r);
    // the terrace: the outer wall from the hill up to T0 (stone, darker at its foot), its top, a parapet round it
    let A = 0; for (let i = 0; i < RING.length; i++) { const p = RING[i], q = RING[(i + 1) % RING.length]; A += p[0] * q[1] - q[0] * p[1]; }
    const sg = A > 0 ? 1 : -1;
    for (let i = 0; i < RING.length; i++) {
      const p = RING[i], q = RING[(i + 1) % RING.length], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz) || 1;
      const nx = -dz / L * sg, nz = dx / L * sg, mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2;   // (n: inward)
      const yp = gH(p[0], p[1]) - 1.5, yq = gH(q[0], q[1]) - 1.5;
      g.quadO([p[0], yp, p[1]], [q[0], yq, q[1]], [q[0], T0, q[1]], [p[0], T0, p[1]], STONE, [mx + nx, (T0 + yp) / 2, mz + nz], null, [STONE2, STONE2, STONE, STONE]);
      if (L > 0.8) {   // the parapet (higher along the lower castle's east side: its curtain wall)
        const hi = mx > -505 ? 4.5 : 1.3;
        box(g, mx + nx * 0.35, T0, mz + nz * 0.35, L + 0.5, hi, 0.7, Math.atan2(dz, dx), WALL2, STONE, true);
      }
    }
    const tri = THREE.ShapeUtils.triangulateShape(RING.map(p => new THREE.Vector2(p[0], p[1])), []), up = [STONE, STONE, STONE];
    for (const [a, b, c] of tri) g.triUp([RING[a][0], T0, RING[a][1]], [RING[b][0], T0, RING[b][1]], [RING[c][0], T0, RING[c][1]], up);

    // a wing: white walls from the terrace to the eave, rows of dark windows on both long sides, a steep roof
    const wing = (pts, w, ye) => {
      for (let i = 0; i + 1 < pts.length; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), rot = Math.atan2(dz, dx), ux = dx / L, uz = dz / L;
        const cx = (ax + bx) / 2, cz = (az + bz) / 2, hgt = ye - T0;
        box(g, cx, T0, cz, L + w * 0.9, hgt, w, rot, WALL, WALL, true);
        gable(g, cx, ye, cz, L + w * 0.9 + 0.8, w + 1, w * 0.6, rot, i % 2 ? ROOF2 : ROOF, WALL);
        for (const sd of [-1, 1]) {   // (the windows: every 3.2 m, a floor every 3 m from 2.4 m over the terrace)
          const ox = -uz * sd * (w / 2 + 0.04), oz = ux * sd * (w / 2 + 0.04), inn = [cx, (T0 + ye) / 2, cz];
          for (let y = T0 + 2.4; y + 1.6 < ye - 0.8; y += 3) for (let t = -L / 2 + 1.6; t <= L / 2 - 1.2; t += 3.2) {
            const px = cx + ux * t + ox, pz = cz + uz * t + oz, hx = ux * 0.55, hz = uz * 0.55;
            g.quadO([px - hx, y, pz - hz], [px + hx, y, pz + hz], [px + hx, y + 1.6, pz + hz], [px - hx, y + 1.6, pz - hz], WIN, inn);
          }
        }
      }
    };
    for (const [pts, w, ye] of WINGS) wing(pts, w, ye);

    // the main tower on the peak: square, a pyramid roof
    box(g, -521, T0, 319, 7.5, 56 - T0, 7.5, 0, WALL, WALL, true);
    for (const [ox, oz] of [[0, -3.79], [0, 3.79], [-3.79, 0], [3.79, 0]]) for (let y = 47; y < 55; y += 3.5) {
      const vx = oz ? 0.45 : 0, vz = ox ? 0.45 : 0, px = -521 + ox, pz = 319 + oz;
      g.quadO([px - vx, y, pz - vz], [px + vx, y, pz + vz], [px + vx, y + 1.4, pz + vz], [px - vx, y + 1.4, pz - vz], WIN, [-521, y, 319]);
    }
    cone(g, -521, 56, 319, 7.5 / Math.SQRT2 + 0.5, 10, 4, ROOF, ROOF2, Math.PI / 4);
    box(g, -521, 66, 319, 0.25, 1.6, 0.25, 0, ROOF2);   // (the finial)

    // the chapel: its nave across the south of the upper castle, the apse to the east, a turret on the ridge
    const cr = Math.atan2(6.5, 14.9), ccx = -504, ccz = 347.25;
    box(g, ccx, T0, ccz, 16, 43 - T0, 12.5, cr, WALL, WALL, true);
    gable(g, ccx, 43, ccz, 16.8, 13.5, 7, cr, ROOF, WALL);
    cyl(g, -496.5, T0, 350.5, 6, 43 - T0, 10, WALL);
    cone(g, -496.5, 43, 350.5, 6.6, 5.5, 10, ROOF, ROOF2, 0);
    for (let k = 0; k < 3; k++) { const a = cr - 0.9 + k * 0.9, px = -496.5 + Math.cos(a) * 6.04, pz = 350.5 + Math.sin(a) * 6.04, vx = -Math.sin(a) * 0.5, vz = Math.cos(a) * 0.5;   // (tall windows of the apse)
      g.quadO([px - vx, 37, pz - vz], [px + vx, 37, pz + vz], [px + vx, 41, pz + vz], [px - vx, 41, pz - vz], WIN, [-496.5, 39, 350.5]); }
    box(g, ccx, 47, ccz, 1.8, 4.5, 1.8, cr, WALL);
    cone(g, ccx, 51.5, ccz, 1.6, 4.5, 8, ROOF, ROOF2, 0);

    // the round bastions (from the hill, over the terrace) and their cone roofs
    for (const [x, z, r, top, rh] of [[-561.8, 303.5, 5.5, 43, 6.5], [-479.8, 296.5, 7, 41, 7.5], [-553.5, 336, 3.5, 42, 5]]) {
      const y0 = gH(x, z) - 1.5;
      cyl(g, x, y0, z, r, T0 - y0, 12, STONE);
      cyl(g, x, T0, z, r, top - T0, 12, WALL);
      cone(g, x, top, z, r + 0.6, rh, 12, ROOF, ROOF2, 0);
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3, px = x + Math.cos(a) * (r + 0.04), pz = z + Math.sin(a) * (r + 0.04), vx = -Math.sin(a) * 0.4, vz = Math.cos(a) * 0.4;
        g.quadO([px - vx, top - 3, pz - vz], [px + vx, top - 3, pz + vz], [px + vx, top - 1.8, pz + vz], [px - vx, top - 1.8, pz - vz], WIN, [x, top - 2, z]); }
    }

    // the gate tower at the end of the road: the gateway dark, facing out
    const gr = Math.atan2(371.8 - 361.4, -494.8 + 488.1), gx = -492.5, gz = 365.5, gy0 = gH(gx, gz) - 1.5;
    box(g, gx, gy0, gz, 7, 44 - gy0, 6, gr, WALL, WALL, true);
    cone(g, gx, 44, gz, 5.2, 7, 4, ROOF, ROOF2, gr + Math.PI / 4);
    const ux = Math.cos(gr), uz = Math.sin(gr);
    let ox = -uz, oz = ux; if ((gx - CX) * ox + (gz - CZ) * oz < 0) { ox = -ox; oz = -oz; }   // (o: out of the castle)
    const fx = gx + ox * 3.05, fz = gz + oz * 3.05, ry = gH(fx + ox * 2, fz + oz * 2);
    g.quadO([fx - ux * 1.8, ry - 0.3, fz - uz * 1.8], [fx + ux * 1.8, ry - 0.3, fz + uz * 1.8], [fx + ux * 1.8, ry + 4.2, fz + uz * 1.8], [fx - ux * 1.8, ry + 4.2, fz - uz * 1.8], GATE, [gx, ry + 2, gz]);
    for (const t of [-1.8, 0, 1.8]) { const px = fx + ux * t, pz = fz + uz * t;
      g.quadO([px - ux * 0.4, 39, pz - uz * 0.4], [px + ux * 0.4, 39, pz + uz * 0.4], [px + ux * 0.4, 40.4, pz + uz * 0.4], [px - ux * 0.4, 40.4, pz - uz * 0.4], WIN, [gx, 40, gz]); }
  }

  /* ---- the road's surroundings after OpenStreetMap (dodelava 28. 11. 2026, docs/proge/krasnahorka.md): all in the new frame (the start's metres) ----
     The ground 2.5–55 m past the asphalt (the meadows' patches, the forest's litter) is js/world-chase-bt94.js's (#1150): nothing here lies on it. */
  // the village Krásnohorské Podhradie below the castle: the OSM buildings 225–370 m from the road, [x, z, length, width, angle] each (the 103 of 837)
  const VAS = [-1712,1595,16.4,14.1,3.13,-1713,1576,12.6,11.9,0.01,-1696,1577,12.1,6,-1.55,-1710,1558,12.5,12.2,0.03,-1738,1557,14.1,13,1.6,-1738,1576,11.9,11.4,0.07,-1735,1538,12.2,11.3,0.03,-1709,1541,12.9,12.3,0.03,-1693,1538,6.5,6.1,3.1,-1707,1521,12.2,12.1,1.61,-1733,1499,11.9,11.3,0.07,-1734,1518,12,11.5,3.13,-1746,1520,7.5,5,-1.53,-1685,1461,6.7,4.7,-0.09,-1714,1448,10.7,5.9,-2.97,-1719,1441,9.7,4.1,0.09,-1748,1427,5.7,5.5,0.27,-1733,1450,10,5.2,-1.43,-1749,1403,16.4,10.6,-0.24,-1737,1398,6,5.5,-0.22,-1728,1423,14.4,13.5,-3,-1690,1381,16.6,5.3,1.39,-1692,1371,5.2,3.9,-0.18,-1737,1366,6.6,4.2,-0.24,-1747,1378,12.9,10,2.91,-1746,1351,10.9,10,-1.22,-1686,1345,8.2,6.8,3.01,-1712,1332,14.9,10,-1.73,-1690,1311,4.9,4.6,3.14,-1699,1298,16.3,7,-1.45,-1710,1298,6.8,5,-1.62,-1707,1309,5.6,4.6,1.33,-1726,1308,24.1,5.8,1.51,-1741,1306,26.9,12.8,1.45,-1728,1294,7.5,4.7,-0.07,-1723,1243,10.1,7.6,3.12,-1745,1264,5.7,4.6,2.78,-1705,1231,19.7,11.6,-1.61,-1708,1187,6.6,5.6,1.45,-1707,1199,18.4,5.6,1.45,-1670,1181,17.8,16.5,0.25,-1650,1193,8.4,4.2,1.68,-1634,1205,16.3,6.7,0.48,-1612,1224,7.9,5.5,0.2,-1642,1233,6.6,3.2,1.42,-1674,1263,12.2,5.5,1.61,-1662,1269,10.5,3.8,-1.95,-1683,1280,8.1,4.1,1.61,-1661,1292,9.3,7.1,3.06,-1642,1290,11.8,9.5,0.02,-1679,1300,13,9.3,-3.07,-1684,1322,6.4,6.3,-3.09,-1684,1333,10,6.9,1.53,-1685,1404,4.5,4.5,-3.12,-1681,1416,11.1,8.5,-0.2,-1678,1444,7.9,5.1,1.32,-1649,1502,12.9,12.8,3.13,-1669,1520,8.3,6.6,1.62,-1647,1522,12.9,12.7,-3.07,-1674,1540,15,12.5,-3.11,-1670,1552,6.7,4.6,0.03,-1648,1541,12.4,12.3,-3.11,-1082,1663,5.5,5.2,2.13,-1073,1670,18.1,7.7,-2.58,-1062,1660,11.3,9.9,-2.53,-1016,1639,10.3,10.2,-0.43,-1001,1630,22.2,6.6,-0.43,-1648,1561,12.1,11.9,-1.52,-1673,1560,12.1,11.7,0.03,-1674,1578,12.3,12,-3.12,-1646,1579,12.7,12.1,-3.11,-1672,1596,12.4,12,-3.11,-1641,1632,40.2,18.5,-0.05,-1634,1660,9.5,6.8,-1.61,-1615,1657,13.5,12.7,-0.04,-1579,1672,22,10.1,2.42,-1565,1675,7.7,4,-0.92,-1553,1653,5.5,4.1,-0.8,-1590,1665,5.7,4.5,-0.26,-1586,1647,13,10.7,2.58,-1567,1641,20,9.6,-2.4,-1529,1671,7.8,7.3,-1.25,-1518,1690,5.6,3.8,2,-1529,1698,6.6,5.1,0.41,-1547,1691,5.8,5.7,-2.75,-1534,1692,6.2,4.3,0.39,-1551,1702,16.2,10.3,1.96,-1533,1709,17.1,10.4,2,-1516,1719,11.4,10,1.97,-1568,1734,12.1,12.1,0.18,-1570,1694,11.7,10.1,-0.92,-1567,1686,5.6,5.3,-2.46,-1611,1686,12.8,8.9,1.46,-1614,1704,11.8,11.8,1.44,-1624,1684,6.1,6.1,-1.67,-1649,1685,8.3,3,-0.05,-1548,1752,6.8,3.6,-3.1,-1541,1752,6.5,4.1,0.06,-1522,1750,13,11.5,-1.53,-1500,1750,6.2,5.8,-1.33,-1478,1716,7.5,4.3,1.54,-1499,1727,10.9,10.2,-1.2,-1503,1709,6.6,4.6,1.95];
  // the guard rail on the right after the first hairpins (OSM barrier=guard_rail, 97 m), the bridge over the brook (OSM bridge, 5 m)
  const RAIL = [[-289.5, -153.6], [-271.7, -155.7], [-264.7, -159.6], [-246.7, -162.6], [-237.2, -162.6], [-221.2, -166.1], [-212.9, -167.6], [-208.3, -167.6], [-203.2, -166.8], [-198.8, -165.3], [-194.9, -163.4]];
  const BRIDGE = [[-696.4, 398.6], [-695.4, 393.3]];
  // the small things on the verge (OSM nodes): bus stops, two information boards (generic: no text), a fire hydrant
  const STOPS = [[-774.2, 906.2], [-1207.6, 1327.0], [-1267.7, 1307.3]], BOARDS = [[-18, -5.9], [-1175.1, 1320.6]], HYDRANT = [-1257.9, 1317.3];
  const CHAPEL = [-1390.3, 1399.5];   // (the wayside chapel under the castle: def.bld's, drawn here)
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  function okolica(ctx) {
    const A = World.api, { box, cyl, cone, gable } = A, T = A.T, gH = ctx.out.groundH, scen = ctx.scen;
    const near = (x, z) => { const n = A.vrNear(x, z); return { i: n.i, dd: n.dd, lat: n.lat }; };
    const edge = (i, side, e) => { const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + e); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o]; };
    // a point on the verge across from (x, z): at least e m past the barrier line
    const verge = (x, z, e) => { const n = near(x, z); if (n.i < 0) return [x, z, 0]; const side = n.lat > 0 ? 1 : -1; if (n.dd >= e) return [x, z, T.hd[n.i]]; const p = edge(n.i, side, e); return [p[0], p[1], T.hd[n.i]]; };

    // the village: plastered walls (white, cream, pale ochre), roofs of red-brown tiles; two storeys on the bigger ones
    const WALLS = [[0.9, 0.89, 0.85], [0.91, 0.86, 0.74], [0.87, 0.84, 0.79], [0.89, 0.81, 0.66]], ROOFS = [[0.58, 0.29, 0.2], [0.5, 0.27, 0.21], [0.45, 0.3, 0.25], [0.62, 0.34, 0.24]];
    for (let k = 0; k < VAS.length; k += 5) {
      const x = VAS[k], z = VAS[k + 1], L = Math.min(VAS[k + 2], 30), W = Math.min(VAS[k + 3], 18), a = VAS[k + 4], c = Math.cos(a), s = Math.sin(a);
      let y = 1e9; for (const [u, v] of [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) y = Math.min(y, gH(x + c * u - s * v, z + s * u + c * v));
      const h = L * W > 150 ? 5.8 : 3.1, wc = WALLS[(hash(k, 3) * 4) | 0], rc = ROOFS[(hash(k, 7) * 4) | 0], g = scen.get(x, z);
      box(g, x, y - 0.4, z, L, h + 0.4, W, a, wc, wc, true);
      gable(g, x, y + h, z, L + 0.5, W + 0.7, Math.min(W * 0.42, 4.5), a, rc, wc);
    }

    // the guard rail: steel on posts at the barrier line, over the road's samples across from OSM's line
    const rail = (pts) => { let i0 = 1e9, i1 = -1, side = 1;
      for (const [x, z] of pts) { const n = near(x, z); if (n.i < 0) continue; i0 = Math.min(i0, n.i); i1 = Math.max(i1, n.i); side = n.lat > 0 ? 1 : -1; }
      return [i0, i1, side]; };
    { const [i0, i1, side] = rail(RAIL), steel = [0.8, 0.82, 0.84], steelB = [0.56, 0.58, 0.6], postC = [0.56, 0.57, 0.6];
      const Q = (i, y, e) => { const p = edge(i, side, 0.12 + (e || 0)); return [p[0], T.hy[i] + y, p[1]]; };
      for (let i = i0; i < i1; i++) { const g = scen.get(T.px[i], T.pz[i]), a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8);
        g.quadO(a, b, c, d, steel, Q(i, 0.6, 3)); g.quadO(a, b, c, d, steelB, Q(i, 0.6, -3));
        if ((i - i0) % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); } } }
    // the bridge: a low concrete parapet on each side, a metre past its ends
    { const [i0, i1] = rail(BRIDGE), m = Math.ceil(1 / T.ds), con = [0.7, 0.69, 0.66], conT = [0.78, 0.77, 0.74];
      for (const side of [-1, 1]) for (let i = Math.max(0, i0 - m); i <= Math.min(T.N - 2, i1 + m); i++) {
        const p = edge(i, side, 0.2), q = edge(i + 1, side, 0.2), y = Math.min(T.hy[i], T.hy[i + 1]) - 0.3;
        box(scen.get(p[0], p[1]), (p[0] + q[0]) / 2, y, (p[1] + q[1]) / 2, Math.hypot(q[0] - p[0], q[1] - p[1]) + 0.05, 1.05, 0.3, Math.atan2(q[1] - p[1], q[0] - p[0]), con, conT, true);
      } }

    // the bus stops: a grey pole, a plain blue plate with a white rim; the information boards: two wooden posts, a brown board; the red hydrant
    for (const [ox, oz] of STOPS) { const [x, z, hd] = verge(ox, oz, 1.2), y = gH(x, z) - 0.2, g = scen.get(x, z);
      box(g, x, y, z, 0.07, 2.7, 0.07, hd, [0.62, 0.63, 0.65], null, true);
      box(g, x, y + 2.15, z, 0.5, 0.5, 0.04, hd + Math.PI / 2, [0.94, 0.95, 0.96]); box(g, x, y + 2.19, z, 0.42, 0.42, 0.06, hd + Math.PI / 2, [0.12, 0.33, 0.66]); }
    for (const [ox, oz] of BOARDS) { const [x, z, hd] = verge(ox, oz, 1.8), y = gH(x, z) - 0.2, g = scen.get(x, z), r = hd + Math.PI / 2, c = Math.cos(r), s = Math.sin(r);
      for (const t of [-0.7, 0.7]) box(g, x + c * t, y, z + s * t, 0.1, 2.0, 0.1, r, [0.42, 0.3, 0.2], null, true);
      box(g, x, y + 0.95, z, 1.6, 0.95, 0.08, r, [0.4, 0.29, 0.2], [0.36, 0.26, 0.18]); box(g, x, y + 1.95, z, 1.85, 0.12, 0.35, r, [0.36, 0.26, 0.18]); }
    { const [x, z] = verge(HYDRANT[0], HYDRANT[1], 1.0), y = gH(x, z) - 0.1, g = scen.get(x, z);
      cyl(g, x, y, z, 0.11, 0.75, 8, [0.78, 0.14, 0.12]); cone(g, x, y + 0.75, z, 0.13, 0.14, 8, [0.78, 0.14, 0.12], [0.7, 0.12, 0.1], 0); }

    // the wayside chapel under the castle (OSM, 3.6 x 3.2 m): white walls, a steep dark roof, the dark doorway facing the road
    { const [x, z] = CHAPEL, a = -0.022, g = scen.get(x, z), y = Math.min(gH(x - 1.8, z - 1.6), gH(x + 1.8, z + 1.6), gH(x - 1.8, z + 1.6), gH(x + 1.8, z - 1.6)) - 0.3;
      box(g, x, y, z, 3.6, 3.4, 3.2, a, [0.92, 0.91, 0.87], [0.92, 0.91, 0.87], true);
      gable(g, x, y + 3.4, z, 4.0, 3.7, 2.4, a, [0.3, 0.27, 0.25], [0.92, 0.91, 0.87]);
      const n = near(x, z), ux = Math.cos(a), uz = Math.sin(a), sd = n.i >= 0 && ((T.px[n.i] - x) * ux + (T.pz[n.i] - z) * uz) < 0 ? -1 : 1;   // (the gable end nearer the road)
      const fx = x + ux * sd * 1.82, fz = z + uz * sd * 1.82, vx = -uz * 0.5, vz = ux * 0.5;
      g.quadO([fx - vx, y + 0.3, fz - vz], [fx + vx, y + 0.3, fz + vz], [fx + vx, y + 2.5, fz + vz], [fx - vx, y + 2.5, fz - vz], [0.16, 0.14, 0.13], [x, y + 1.5, z]); }

    // the castle's hill: bare limestone, grey rock breaking through the dry grass, on its slopes 60–150 m from the castle and over 64 m from the road
    { const cx = CX + DX, cz = CZ + DZ, RK = [[0.73, 0.72, 0.68], [0.66, 0.65, 0.61], [0.6, 0.59, 0.56]];
      for (let k = 0, n = 0; k < 220 && n < 60; k++) {
        const ang = hash(k, 11) * Math.PI * 2, r = 60 + hash(k, 13) * 90, x = cx + Math.cos(ang) * r, z = cz + Math.sin(ang) * r;
        if (near(x, z).i >= 0 || ctx.excluded(x, z)) continue; const lc = A.vrLC(x, z); if (lc === 1 || lc === 3 || lc === 5) continue;
        const L = 1.4 + hash(k, 17) * 3, W = 0.9 + hash(k, 19) * 1.6, H = 0.35 + hash(k, 23) * 0.8, rot = hash(k, 29) * Math.PI, g = scen.get(x, z), y = gH(x, z) - 0.3, col = RK[(hash(k, 31) * 3) | 0];
        box(g, x, y, z, L, H, W, rot, col, col, true);
        if (hash(k, 37) < 0.6) box(g, x + Math.cos(rot) * L * 0.45, y, z + Math.sin(rot) * L * 0.45, L * 0.5, H * 0.7, W * 0.8, rot + 0.5, RK[2], RK[1], true);
        n++;
      } }
  }

  World.ext.krasnahorka = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1717, snow: 'none',
    road: { line: 'none' },
    trees: { kinds: ['broad'], forest: 0.14 },
    skiers: 0, nets: false, snowbanks: false,
    animals: [],
    rails: false, fans: 0.3,
    pads: () => [{ x: -512, z: 324, r: 38, b: 24, h: 32.5 }, { x: -464, z: 336, r: 12, b: 16, h: 31.5 }, { x: -456, z: 305, r: 10, b: 14, h: 31 }]
      .map(p => ({ ...p, x: p.x + DX, z: p.z + DZ, h: p.h + DY })),
    excl: [[CX + DX, CZ + DZ, 60]],
    bldOmit: (x, z) => Math.hypot(x - DX - CX, z - DZ - CZ) < 58 && Math.hypot(x - DX + 472.2, z - DZ - 366) > 1,   // (the castle's own; the small chapel below the gate stays)
    tileR2: 400,   // (the coarse terrain out to the village below the castle: its houses stand 225–370 m from the road)
    ownBld: (x, z) => Math.hypot(x - CHAPEL[0], z - CHAPEL[1]) < 1,
    extra: (ctx) => { castle(ctx); okolica(ctx); },
  });
})();
