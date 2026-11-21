// WORLD — realizem 15: Hakone, Japonska (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road and the track's own world (js/world-hakone.js) does not draw yet.
// Loaded right after the track's own world builder, which calls World.api.hkRealizem15 once per build
// (before the forest, so that the trees keep clear of the new things).
//
// Drawn (into the existing scenery chunks and the existing wire mesh: no new draw calls, no collision bodies):
//  - power line way 409754427 (66 kV, two circuits, six cables): lattice towers n4116178947 … n5403738898 (14) and the 13 spans
//    between them (tower:type anchor / suspension and design three-level as tagged);
//  - power line way 324868961 (77 kV, two circuits, six cables): the three spans that come within 60 m of the road and the towers
//    that carry them, n3822448588–n3822448587 (design donau) and n3822448574–n3822448573–n3822448572 (three-level);
//  - bus stops (highway=bus_stop, 105 nodes up to 16 m from the centre line): a pole with a blank round plate and a blank board,
//    a shelter where shelter=yes (6), a bench where bench=yes (8);
//  - marked pedestrian crossings on the road itself (highway=crossing with markings, 17 nodes): white stripes.
// Not drawn again (the world has them): buildings, railway, platforms, torii, the paving of the old road, lakes, rivers, trees,
//  utility poles.
// Not drawn at all (said in the PR): car parks, streams, culverts, waterfalls, pipelines, the substation and its feeders, power
//  lines whose spans stay farther than 60 m and the two lines beyond the towers above, traffic signals (nodes only, no masts),
//  guard rails, hedges, the bypass road and its viaducts (no deck heights), side roads, paths and steps (#779), boards and
//  anything with text, shops and other premises, unmarked crossings, bus stops farther than 16 m.
// Assumed (said in the PR): OSM has no heights for the towers → 29.5 m (66 kV), 32.5 m (77 kV three-level), 37 m (77 kV donau);
//  the shape of n4116178947 (no design tag) as its neighbours; the sag of the wires (catenary constant 1500 m, less where a wire
//  would come closer than 7 m to the game's ground or 9 m to its road); a tower whose wires could not keep that distance even
//  when drawn tight is taller (n4116178947 in the valley: +15 m); a tower or a bus stop that the game's wider road would swallow
//  stands just beyond its barrier; no plant of the forest stands within a tower, a shelter or a bus stop (no cutline under the
//  wires: OSM has none); plates and boards carry no text, colours are neutral.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.hakone) return;
  const API = World.api;

  // Metres from the start line, x east, z south.
  // Towers: [OSM node, x, z, heading of the line (radians from +x towards +z), 1 = suspension tower].
  // Bus stops: [OSM node, x, z, 1 = shelter + 2 = bench]. Crossings: [OSM node, x, z].
  const L66 = [
    [4116178947, -4592.3, 3367.1, 3.092, 0], [5403738910, -4850.3, 3412.3, 2.946, 0], [5403738909, -4994.4, 3444.2, 2.935, 1], [5403738908, -5111.8, 3467.4, 3.139, 0],
    [5403738907, -5267.1, 3437.4, -2.942, 1], [5403738906, -5414.4, 3406.3, -2.670, 0], [5403738905, -5523.9, 3307.1, -2.251, 0], [5403738904, -5579.7, 3210.9, -2.098, 1],
    [5403738903, -5641.9, 3104.6, -2.635, 0], [5403738902, -5903.5, 3111.8, -3.035, 0], [5403738901, -6077.8, 3069, -2.890, 0], [5403738900, -6176.4, 3042.6, 2.954, 0],
    [5403738899, -6264.5, 3107.7, 2.060, 0], [5403738898, -6268, 3186.9, 1.616, 0]
  ];
  const L77A = [
    [3822448588, -1799.4, -512.1, 1.769, 0], [3822448587, -1945.6, 182.2, 2.215, 0]
  ];
  const L77B = [
    [3822448574, -4476.2, 2857.3, 1.310, 0], [3822448573, -4396.6, 3094.1, 1.389, 0], [3822448572, -4386.4, 3360.2, 1.764, 0]
  ];
  const BUS = [
    [2440023144, 2.9, 8.8, 0], [2440023148, -8, 11.5, 0], [2440023147, -18.7, 14.6, 1], [2440023142, -58.6, 46.6, 0], [2440023145, -95.3, 52.6, 0], [3399485910, -110, 69.3,
    0], [2440023146, -125.4, 86.5, 0], [13004002424, -133.4, 86.6, 0], [3399485904, -311.5, 206, 0], [3399485903, -375.4, 222.1, 0], [3399485668, -811.8, 85.8, 0],
    [3399485667, -858.4, 105.2, 0], [3721211077, -1053.9, 86.4, 0], [3399485654, -1070.1, 79.9, 0], [3399485664, -1637.2, -9.7, 0], [3399485665, -1646.6, -26.5, 0],
    [5338854693, -2815.3, -544.1, 0], [3399485670, -2803.5, -545.5, 2], [12609580787, -2867.4, -487.7, 0], [3399485669, -3026.5, -552.8, 2], [3399485671, -3814.3, -1032.2,
    1], [3027270613, -3830.8, -1031.6, 0], [3755583574, -3999.9, -1142.2, 0], [3399485672, -4042.1, -1155.5, 0], [3399485647, -4157.2, -1249.7, 0], [3399485646, -4167.3,
    -1236.5, 0], [5061788321, -4299.6, -1166.5, 0], [5351009788, -4306, -1141.9, 0], [5061787522, -4457.4, -969, 1], [5351009769, -4444.9, -956.6, 0], [5338854685, -4568.1,
    -863.1, 0], [5351009750, -4587.8, -845.5, 0], [5061788221, -4645.2, -719.9, 0], [3399485658, -5039.4, -817.4, 3], [5351009780, -5055.9, -820.3, 3], [3634091833,
    -5286.2, -628.7, 2], [3399485679, -5297.2, -623.9, 0], [3634091832, -5288, -609.7, 0], [5061776422, -5218, -339.5, 0], [5351009792, -5208.2, -342.3, 0], [5061776225,
    -4919.1, 282, 0], [5351009774, -4929.5, 313, 0], [5061776224, -5088, 450.6, 0], [5351009756, -5077.1, 485.4, 0], [5061776223, -5065.7, 902.7, 0], [5351009786, -5054.1,
    904.8, 0], [5351009748, -4934.7, 1360.7, 0], [5061776321, -4967, 1332.8, 0], [5061776222, -5477.4, 1420.5, 0], [5351009778, -5473, 1441, 0], [5351009760, -5682, 1530.4,
    0], [5351009791, -5686.7, 1559.2, 0], [5351009772, -6103.9, 1940.7, 0], [5061776221, -6114.5, 1930.5, 0], [5351009784, -6223.7, 2240.8, 0], [5351009754, -6247.6,
    2272.3, 0], [5351009766, -6172, 2559.4, 0], [4380439990, -6473.1, 3164.6, 0], [4380488090, -6469.8, 3152.7, 0], [11358504853, -6331.9, 3112.1, 0], [11358504854,
    -6298.9, 3092.7, 0], [11358504858, -5989.8, 3117.4, 0], [11358504859, -5950.7, 3113.9, 0], [11358504860, -5505.1, 3311.6, 0], [11358504861, -5497.7, 3329.7, 0],
    [3721211081, -5092.6, 3504.5, 0], [3571899705, -5069.9, 3490, 0], [11358533271, -4635.8, 3293, 0], [11358533270, -4629.7, 3277.6, 0], [11358504867, -4347, 2798.4, 0],
    [11358504866, -4332.3, 2766.2, 0], [11358533273, -4168.1, 2741.2, 0], [11358533274, -4169.5, 2697.3, 0], [3721336769, -3983.3, 2449, 0], [3721336770, -3964.7, 2436.4,
    0], [3721336771, -3824.8, 2407.1, 2], [3721336772, -3806.8, 2378.2, 2], [11358533312, -3709.5, 2254.4, 0], [11358533314, -3703.1, 2244.6, 0], [11358533317, -3157.9,
    1734.9, 0], [11358533316, -3159.5, 1730.6, 0], [11358533327, -2938.2, 1464, 0], [11358533333, -2927.8, 1531.3, 0], [11358533357, -2659.3, 1400.1, 0], [11358533371,
    -2326.3, 1354.8, 0], [11358533372, -2196.1, 1293, 0], [11358533386, -1700.4, 1189.4, 0], [11358533387, -1689.5, 1198, 0], [11358533392, -1521.1, 1088.4, 0],
    [11358533393, -1495.5, 1086.6, 0], [11358533405, -1313.3, 976, 0], [11358533406, -1306.1, 966.5, 3], [4857190227, -764.3, 598.7, 0], [11358533481, -504.9, 581.3, 0],
    [6134899372, -473.3, 577.3, 0], [5549593421, -257.5, 518.8, 0], [6138238010, -12.9, 461.3, 0], [11358533486, 15.6, 445.7, 0], [11358533488, 158.6, 337.5, 0],
    [11358533489, 168, 336.6, 0], [6138275576, 353.6, 152.7, 0], [11358533503, 349.2, 149.4, 0], [3399485653, 358.4, -34.1, 0], [3399485652, 337, -29.4, 0], [2440023149,
    12.8, 5.9, 0]
  ];
  const ZEB = [
    [4111834855, -229.3, 188], [10790759519, -358.7, 218.1], [2605669468, -641.6, 106], [10831925819, -659.8, 104.3], [10831925821, -724.5, 67.8], [12503861924, -833.4,
    100.9], [10156070298, -2876.8, -498.4], [4772538167, -4011.9, -1143.1], [5251915549, -4111.9, -1242.5], [8831970245, -4139.7, -1251.6], [5251915538, -4261, -1208],
    [6685437765, -4658.7, -722.9], [11358504855, -6248.2, 3075.7], [1435640861, -4648.7, 3299.1], [11358533484, 65.1, 433.2], [11358533504, 367.7, 115.5], [4168406905,
    370.8, -21.6]
  ];

  // tower shapes: waist height, arms [height, offsets of the conductors on one side of the line], height of the earth wire
  const SHAPE = {
    a: { H: 29.5, yW: 14, arms: [[18, [3.2]], [21.5, [3.6]], [25, [3.2]]] },     // three-level, 66 kV
    b: { H: 32.5, yW: 15, arms: [[20, [3.4]], [23.8, [3.8]], [27.6, [3.4]]] },   // three-level, 77 kV
    c: { H: 37, yW: 17, arms: [[26, [3.2, 6]], [31, [4.4]]] }                    // donau, 77 kV
  };
  const B0 = 2.4, BW = 0.95, BT = 0.6;      // half-width of the tower's body at the ground, at the waist and at the top
  const TL = 0.1, TB = 0.055, TI = 0.11;    // half-thickness of the legs, of the bracing and of the insulator strings
  const CAT = 1500, CAT_MAX = 4000;         // catenary constant of the wires (m): sag = span² / (8 · CAT); the tightest a wire is drawn
  const CLR = 7, CLR_ROAD = 9;              // the least a wire keeps above the ground and above the road (m)
  const STEEL = [0.62, 0.64, 0.66], INS = [0.8, 0.8, 0.76], CONC = [0.68, 0.68, 0.66], POLE = [0.55, 0.57, 0.6];
  const PLATE = [0.9, 0.9, 0.87], BOARD = [0.82, 0.83, 0.82], ROOF = [0.5, 0.52, 0.54], PANEL = [0.74, 0.76, 0.76];
  const WOOD = [0.56, 0.44, 0.31], WHITE = [0.86, 0.86, 0.84], WH4 = [WHITE, WHITE, WHITE, WHITE];
  const K = [[1, 1], [1, -1], [-1, -1], [-1, 1]];

  API.hkRealizem15 = function (W) {
    const { T, scen, sag, excluded, onBr, out } = W;
    // where no plant stands (out.r15x): the module's own list, in 16 m cells, so that the world's own exclusions stay as they were
    const keepG = new Map(), cell = (x, z) => (Math.floor(x / 16) + 4096) * 8192 + Math.floor(z / 16) + 4096;
    const keep = (x, z, r) => {
      for (let cx = x - r; cx < x + r + 16; cx += 16) for (let cz = z - r; cz < z + r + 16; cz += 16) {
        const k = cell(Math.min(cx, x + r), Math.min(cz, z + r)); let a = keepG.get(k);
        if (!a) keepG.set(k, a = []);
        a.push(x, z, r * r);
      }
    };
    const kept = out.r15x = (x, z) => {
      const a = keepG.get(cell(x, z));
      if (a) for (let i = 0; i < a.length; i += 3) { const dx = x - a[i], dz = z - a[i + 1]; if (dx * dx + dz * dz < a[i + 2]) return true; }
      return false;
    };
    const { box, cyl, vrNear, vrGround, lerp, clamp, TAU, GB } = API;
    const N = T.N, Wi = (i) => (i % N + N) % N;
    const st = { towers: 0, spans: 0, towersMoved: 0, towersBlocked: 0, bus: 0, busMoved: 0, busShifted: 0, busSkipped: 0, shelters: 0, benches: 0,
      zebra: 0, zebraSkipped: 0, towersRaised: 0, spansTight: 0, clearRoad: 1e9, clearGround: 1e9 };

    // an existing scenery chunk: the thing's own cell, otherwise the nearest one that already has something (no new mesh)
    const chunkFor = (x, z) => {
      const own = scen.map.get(Math.floor(x / scen.size) + ',' + Math.floor(z / scen.size));
      if (own && !own.empty) return own;
      let best = null, bd = Infinity;
      for (const [k, c] of scen.map) {
        if (c.empty) continue;
        const p = k.split(','), dx = (+p[0] + 0.5) * scen.size - x, dz = (+p[1] + 0.5) * scen.size - z, d = dx * dx + dz * dz;
        if (d < bd) { bd = d; best = c; }
      }
      return best || scen.get(x, z);
    };
    // inside a building (its exact footprint and m metres around) or inside something the world keeps clear (poles, crowds)
    const blocked = (x, z, m) => {
      if (excluded(x, z) || kept(x, z)) return true;
      for (const b of out.bldBoxes) {
        const dx = x - b[0], dz = z - b[1], r = (b[2] + b[3]) / 2 + m;
        if (Math.abs(dx) > r || Math.abs(dz) > r) continue;
        const c = Math.cos(b[4]), s = Math.sin(b[4]);
        if (Math.abs(dx * c + dz * s) < b[2] / 2 + m && Math.abs(-dx * s + dz * c) < b[3] / 2 + m) return true;
      }
      return false;
    };
    // a steel member: a three-sided bar between two points
    const bar = (g, a, b, t, col) => {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], l = Math.hypot(ux, uy, uz);
      if (l < 1e-4) return;
      const dx = ux / l, dy = uy / l, dz = uz / l;
      let px = -dz, py = 0, pz = dx;
      if (Math.abs(dy) > 0.95) { px = 0; py = dz; pz = -dy; }
      const pl = Math.hypot(px, py, pz); px /= pl; py /= pl; pz /= pl;
      const qx = dy * pz - dz * py, qy = dz * px - dx * pz, qz = dx * py - dy * px;
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], A = [], B = [];
      for (let k = 0; k < 3; k++) {
        const c = Math.cos(k * TAU / 3) * t, s = Math.sin(k * TAU / 3) * t, ox = px * c + qx * s, oy = py * c + qy * s, oz = pz * c + qz * s;
        A.push([a[0] + ox, a[1] + oy, a[2] + oz]); B.push([b[0] + ox, b[1] + oy, b[2] + oz]);
      }
      for (let k = 0; k < 3; k++) { const j = (k + 1) % 3; g.quadO(A[k], A[j], B[j], B[k], col, mid); }
    };

    // ---- power lines: lattice towers and the wires between them
    // (ext: metres of body extension below the waist; dry: only where it stands and where its wires hang, nothing drawn)
    const tower = (row, S0, ext, dry) => {
      const S = ext ? { H: S0.H + ext, yW: S0.yW + ext, arms: S0.arms.map(a => [a[0] + ext, a[1]]) } : S0, b0 = B0 + (ext || 0) * (B0 - BW) / S0.yW;
      let x = row[1], z = row[2];
      const h = row[3], susp = row[4], ax = Math.cos(h), az = Math.sin(h), cx = -az, cz = ax;   // along the line, across the line
      const q = vrNear(x, z), qi = q.i, lat = q.lat;
      if (qi >= 0) {   // the game's road is wider than the real one: a tower it would swallow stands just beyond the barrier
        const nx = T.nx[qi], nz = T.nz[qi];
        const need = (lat > 0 ? T.br[qi] : T.bl[qi]) + 0.6 + b0 * (Math.abs(ax * nx + az * nz) + Math.abs(cx * nx + cz * nz));
        if (Math.abs(lat) < need) { const m = (need - Math.abs(lat)) * (lat > 0 ? 1 : -1); x += nx * m; z += nz * m; if (!dry) st.towersMoved++; }
      }
      if (!dry && blocked(x, z, b0)) st.towersBlocked++;
      const g = dry ? new GB() : chunkFor(x, z), y0 = vrGround(x, z), yW = S.yW, yT = S.arms[S.arms.length - 1][0] + 1.1;
      const bw = (y) => y <= yW ? b0 + (BW - b0) * y / yW : BW + (BT - BW) * (y - yW) / (yT - yW);
      const P = (y, a, c) => [x + ax * a + cx * c, y0 + y, z + az * a + cz * c];
      const C = (y, k) => { const b = bw(y); return P(y, K[k][0] * b, K[k][1] * b); };
      const lv = [0];
      for (let k = 1, m = Math.ceil((ext || 0) / 5); k <= m; k++) lv.push(ext * k / m);
      for (const f of [0.32, 0.59, 0.81, 1]) lv.push((ext || 0) + f * S0.yW);
      let last = yW;
      for (const arm of S.arms) {
        const ya = arm[0], n = Math.ceil((ya - last) / 3.2);
        for (let k = 1; k < n; k++) lv.push(last + (ya - last) * k / n);
        lv.push(ya, ya + 1.1); last = ya + 1.1;
      }
      for (let k = 0; k < 4; k++) {   // legs with their footings, the peak
        const f = C(0, k), gy = vrGround(f[0], f[2]);
        if (gy < y0) bar(g, [f[0], gy - 0.5, f[2]], f, TL, STEEL);
        cyl(g, f[0], gy - 0.3, f[2], 0.3, 0.7, 8, CONC, CONC);   // (a round stub, too thin for a contact shadow: no new shadow mesh)
        bar(g, f, C(yW, k), TL, STEEL); bar(g, C(yW, k), C(yT, k), TL, STEEL);
        bar(g, C(yT, k), P(S.H, 0, 0), TB, STEEL);
      }
      for (let p = 0; p + 1 < lv.length; p++) {   // rings and bracing
        const y1 = lv[p], y2 = lv[p + 1];
        for (let k = 0; k < 4; k++) {
          const j = (k + 1) % 4;
          bar(g, C(y2, k), C(y2, j), TB, STEEL);
          if (y2 <= yW + 1e-6) { bar(g, C(y1, k), C(y2, j), TB, STEEL); bar(g, C(y1, j), C(y2, k), TB, STEEL); }
          else if (y2 - y1 > 1.5) { if (p % 2) bar(g, C(y1, k), C(y2, j), TB, STEEL); else bar(g, C(y1, j), C(y2, k), TB, STEEL); }
        }
      }
      const att = [];
      for (const sd of [-1, 1]) for (const arm of S.arms) {   // cross-arms and where the conductors hang
        const ya = arm[0], offs = arm[1], Lr = offs[offs.length - 1], tip = P(ya, 0, sd * Lr), b1 = bw(ya), b2 = bw(ya + 1.1);
        for (const a of [-1, 1]) { bar(g, P(ya, a * b1, sd * b1), tip, TB, STEEL); bar(g, P(ya + 1.1, a * b2, sd * b2), tip, TB, STEEL); }
        for (const o of offs) {
          if (o < Lr) { const wd = b1 * (Lr - o) / (Lr - b1); bar(g, P(ya, -wd, sd * o), P(ya, wd, sd * o), TB, STEEL); }
          let p = P(ya, 0, sd * o);
          if (susp) { const lo = [p[0], p[1] - 1.1, p[2]]; bar(g, lo, p, TI, INS); p = lo; }
          att.push(p);
        }
      }
      if (!dry) { keep(x, z, b0 + 4.1); st.towers++; if (ext) st.towersRaised++; }   // (no crown of the forest reaches into the lattice)
      return { x, z, y0, g, susp, att, top: P(S.H, 0, 0) };
    };
    // the wires of one span: their ends (beyond the tension strings) and the sag that the game's ground and road allow
    const span = (A, B) => {
      const L = Math.hypot(B.x - A.x, B.z - A.z), n = clamp(Math.round(L / 22), 6, 24), ends = [];
      let s = L * L / (8 * CAT);
      for (let k = 0; k < B.att.length; k++) {
        const a = A.att[k], b = B.att[k], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], u = 1.1 / Math.hypot(dx, dy, dz);
        const a2 = A.susp ? a : [a[0] + dx * u, a[1] + dy * u, a[2] + dz * u], b2 = B.susp ? b : [b[0] - dx * u, b[1] - dy * u, b[2] - dz * u];
        ends.push([a, a2, b2, b]);
        for (let j = 1; j < 2 * n; j++) {   // less sag where the ground or the road would come too close to a wire
          const f = j / (2 * n), x = lerp(a2[0], b2[0], f), z = lerp(a2[2], b2[2], f), q = vrNear(x, z);
          const need = Math.max(vrGround(x, z) + CLR, q.i >= 0 && q.d < T.w + 2 ? q.hn + CLR_ROAD : -1e9);
          s = Math.min(s, (lerp(a2[1], b2[1], f) - need) / (4 * f * (1 - f)));
        }
      }
      return { L, n, s, tight: L * L / (8 * CAT_MAX), ends };
    };
    const line = (rows, S) => {
      // a tower as tall as its wires need (OSM has no heights): where even the tightest wire would come too close to the game's
      // ground, the tower of the span that stands lower grows by 3 m of body at a time
      const ext = rows.map(() => 0);
      for (let r = 1; r < rows.length; r++) for (let it = 0; it < 8; it++) {
        const A = tower(rows[r - 1], S, ext[r - 1], true), B = tower(rows[r], S, ext[r], true), sp = span(A, B);
        if (sp.s >= sp.tight) break;
        ext[A.y0 < B.y0 ? r - 1 : r] += 3;
      }
      let prev = null;
      rows.forEach((row, r) => {
        const t = tower(row, S, ext[r]);
        if (prev) {
          const sp = span(prev, t), s = Math.max(sp.s, sp.tight), n = sp.n;
          if (s > sp.s) st.spansTight++;
          for (const [a, a2, b2, b] of sp.ends) {
            if (!prev.susp) bar(prev.g, a, a2, TI, INS);   // tension strings
            if (!t.susp) bar(t.g, b2, b, TI, INS);
            sag(a2, b2, s, n);
            for (let j = 1; j < 2 * n; j++) {   // the lowest clearances above the road and above the ground (for the checks)
              const f = j / (2 * n), x = lerp(a2[0], b2[0], f), z = lerp(a2[2], b2[2], f), y = lerp(a2[1], b2[1], f) - s * 4 * f * (1 - f), q = vrNear(x, z);
              if (q.i >= 0 && q.d < T.w) st.clearRoad = Math.min(st.clearRoad, y - q.hn);
              st.clearGround = Math.min(st.clearGround, y - vrGround(x, z));
            }
          }
          sag(prev.top, t.top, s * 0.8, n); st.spans++;
        }
        prev = t;
      });
    };
    line(L66, SHAPE.a); line(L77A, SHAPE.c); line(L77B, SHAPE.b);

    // ---- bus stops: where OSM has them, on their side of the road, just beyond the barrier of the game's wider road
    for (const row of BUS) {
      const q = vrNear(row[1], row[2]), i0 = q.i, lat = q.lat, sd = lat > 0 ? 1 : -1, fl = row[3];
      let done = false;
      if (i0 >= 0) for (const sh of [0, 1, -1, 2, -2, 3, -3]) {   // inside a building or a pole: a few metres along the road
        const i = Wi(i0 + sh);
        if (onBr[i]) continue;
        const nx = T.nx[i] * sd, nz = T.nz[i] * sd, tx = T.tx[i], tz = T.tz[i], hd = T.hd[i];
        const off = Math.max(Math.abs(lat), (sd > 0 ? T.br[i] : T.bl[i]) + 0.9), mv = off - Math.abs(lat);
        const x = sh ? T.px[i] + nx * off : row[1] + nx * mv, z = sh ? T.pz[i] + nz * off : row[2] + nz * mv;
        const sx = x + nx * 1.5, sz = z + nz * 1.5;
        if (blocked(x, z, 0.3) || ((fl & 1) && blocked(sx, sz, 1.4))) continue;
        const g = chunkFor(x, z), y = vrGround(x, z);
        cyl(g, x, y - 0.1, z, 0.2, 0.22, 8, CONC);
        cyl(g, x, y, z, 0.035, 2.3, 6, POLE);
        box(g, x, y + 1.15, z, 0.03, 0.55, 0.42, hd, BOARD);
        for (const e of [-1, 1]) {   // the round plate, blank, facing both ways along the road
          const c = [x + tx * 0.02 * e, y + 2.3, z + tz * 0.02 * e], R = (a) => [c[0] + nx * Math.cos(a) * 0.24, c[1] + Math.sin(a) * 0.24, c[2] + nz * Math.cos(a) * 0.24];
          for (let k = 0; k < 10; k++) g.triO(c, R(k / 10 * TAU), R((k + 1) / 10 * TAU), PLATE, [x, y + 2.3, z]);
        }
        if (fl & 1) {   // shelter: roof, four posts, back panel, open towards the road
          const gy = vrGround(sx, sz), px = sx + nx * 0.7, pz = sz + nz * 0.7;
          const pb = Math.max(gy, vrGround(px + tx * 1.6, pz + tz * 1.6), vrGround(px - tx * 1.6, pz - tz * 1.6)) + 0.45;   // (the panel's lower edge clear of the ground: no new shadow mesh)
          box(g, sx, gy + 2.3, sz, 3.4, 0.08, 1.6, hd, ROOF);
          for (const a of [-1.6, 1.6]) for (const c of [-0.7, 0.7]) box(g, sx + tx * a + nx * c, gy - 0.4, sz + tz * a + nz * c, 0.07, 2.7, 0.07, hd, POLE);
          box(g, px, pb, pz, 3.2, Math.max(0.6, gy + 2.25 - pb), 0.04, hd, PANEL);
          keep(sx, sz, 2.4); st.shelters++;
        }
        if (fl & 2) {   // bench: under the shelter, otherwise beside the pole
          const bx = (fl & 1) ? sx + nx * 0.35 : x + tx * 1.5 + nx * 0.5, bz = (fl & 1) ? sz + nz * 0.35 : z + tz * 1.5 + nz * 0.5;
          if ((fl & 1) || !blocked(bx, bz, 0.5)) {
            const by = vrGround(bx, bz);
            box(g, bx, by + 0.4, bz, 1.5, 0.05, 0.38, hd, WOOD);
            for (const a of [-0.6, 0.6]) box(g, bx + tx * a, by - 0.1, bz + tz * a, 0.06, 0.5, 0.24, hd, POLE);
            if (!(fl & 1)) keep(bx, bz, 1);
            st.benches++;
          }
        }
        keep(x, z, 1); st.bus++;
        if (sh) st.busShifted++; else if (mv > 0.01) st.busMoved++;
        done = true; break;
      }
      if (!done) st.busSkipped++;
    }

    // ---- marked crossings: white stripes along the driving direction, on the road surface
    const roadPt = (s, o) => {
      const f = s / T.ds, i0 = Math.floor(f), t = f - i0, i = Wi(i0), j = Wi(i0 + 1);
      return [lerp(T.px[i], T.px[j], t) + lerp(T.nx[i], T.nx[j], t) * o, lerp(T.hy[i], T.hy[j], t) + 0.05, lerp(T.pz[i], T.pz[j], t) + lerp(T.nz[i], T.nz[j], t) * o];
    };
    for (const row of ZEB) {
      const q = vrNear(row[1], row[2]), i = q.i;
      if (i < 0 || q.d > 2.5) { st.zebraSkipped++; continue; }
      const s0 = i * T.ds + (row[1] - T.px[i]) * T.tx[i] + (row[2] - T.pz[i]) * T.tz[i], g = chunkFor(row[1], row[2]);
      for (let k = -5; k <= 5; k++) for (let u = -2; u < 2; u++) {
        const o = k * 0.9;
        g.quadUp(roadPt(s0 + u, o - 0.225), roadPt(s0 + u, o + 0.225), roadPt(s0 + u + 1, o + 0.225), roadPt(s0 + u + 1, o - 0.225), WH4);
      }
      st.zebra++;
    }

    st.clearRoad = Math.round(st.clearRoad * 10) / 10; st.clearGround = Math.round(st.clearGround * 10) / 10;
    out.r15 = st;
  };
})();
