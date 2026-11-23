/* =====================================================================================================================================
   WORLD — Sepang, Malezija: what lies by the road past the barriers (grafika ob progi), from OpenStreetMap, on js/world-sepang.js (the
   builder's hook LK.extra wrapped: what is here is laid out first, so js/world-sepang.js's trees, roads and buildings, the builder's
   trees and the crowds keep clear of it, then js/world-sepang.js's own parts, with the trees OSM has that its list lacks).
   Drawn: the tyre walls (OSM barrier=wall, material=tyres, 31 parts 2-60 m past the barriers, the second line behind the run-offs; no
     height in OSM: 0.95 m, 0.8 m deep, the builder's tyre texture, assumed); the guard rail (OSM barrier=guard_rail, its parts more than
     4 m past the barriers: a W-beam 0.75 m up on steel posts, assumed); the fences (OSM barrier=fence; no height or build in OSM: 2 m of
     chain-link mesh on steel posts, assumed); the gates (OSM barrier=gate, 18: shut, assumed; 3 m across a pedestrian way, 5 m across a
     road, 4 m in a fence); the paddock's walkways (OSM highway=pedestrian, access=private; no width or surface in OSM: 3 m of paving,
     assumed; the covered bits without their roofs, whose build OSM does not give); the car parks (OSM amenity=parking, their parts within
     60 m: plain asphalt, under the service roads); 45 trees OSM maps (natural=tree, within 60 m) that the track's list (def.sk.tr) has
     none of within 1.5 m: broadleaved, as its trees along the service roads.
   Kept open (docs/realizem.md: only from sources): the car parks' markings, the roofs of the covered walkways (not in OSM).
   Not drawn again: the circuit's paved area, the barriers, the run-off and the grandstands (the builder's), the service roads, the
     buildings and the lawns (js/world-sepang.js); nothing within the barriers; the wall without a material along the barriers (the
     builder's); the toilets (OSM amenity=toilets: within the grandstands' buildings), the roof (OSM building=roof), the track (OSM
     highway=track, no surface), the eateries and the clinic (OSM amenity=*: not drawn, no names); no names of the circuit, its gates,
     its car parks or its operators.
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-23; metres, origin = the finish line, x east, z south
   (tools/sepang/sepang.json's lat0/lon0); the lines simplified to 0.25 m.
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.sepang;
  if (!LK || typeof LK.extra !== 'function') return;

  // the lines [x0, z0, x1, z1, ...] each; the car parks' outlines (closed); the gates [x, z, the angle of the gate's line, its width, 1 when
  // it stands in a fence's line]; the trees OSM has that def.sk.tr lacks [x, z, kind, ...]
  const TYRES = [[437.0,55.4,435.1,26.9],
    [435.0,23.9,434.4,15.1,432.0,0.3,423.7,-16.0,416.0,-27.6,408.3,-37.0,397.6,-46.5],
    [505.4,156.0,522.3,147.7,541.4,131.1,562.9,108.6,587.4,71.2],
    [424.0,-39.3,390.0,-69.5,374.5,-77.2,371.0,-72.5],
    [230.2,-77.1,285.6,-97.2,299.6,-95.5],
    [420.9,-164.6,384.0,-253.0,372.5,-275.1],
    [161.0,-25.1,179.6,-32.5,262.7,-68.4],
    [438.8,92.6,299.9,100.3],
    [459.1,-96.7,431.1,-149.3,424.8,-164.6],
    [367.3,165.4,421.5,177.3,440.0,179.1,461.5,176.1,491.9,166.6,501.5,163.1],
    [397.1,-50.6,358.2,-70.1],
    [-23.7,-422.0,-7.9,-499.9,-6.9,-512.5,-7.6,-520.1,-11.2,-534.0],
    [-25.8,-149.1,-31.5,-169.3],
    [-641.9,-48.9,-654.3,-44.1,-666.0,-38.2,-674.3,-33.1,-684.5,-25.3,-691.4,-18.5,-699.1,-8.9],
    [-525.6,159.5,-506.2,162.0],
    [-485.6,162.5,-443.9,161.9,-389.4,158.2],
    [-603.8,246.6,-602.6,230.6,-596.6,210.5,-585.9,189.7,-565.0,171.4,-546.5,165.4,-527.4,166.0],
    [-696.3,-5.3,-699.2,0.3,-701.1,6.8,-703.2,18.1,-702.8,30.4,-700.7,52.8,-697.7,61.9,-693.8,69.7],
    [-552.5,-30.7,-558.7,-33.6],
    [45.5,-95.3,23.5,-102.0,8.1,-110.6,-16.0,-129.8,-25.6,-138.6],
    [-29.4,232.4,-44.9,221.1,-55.6,206.9,-61.0,191.5,-63.4,171.4],
    [-57.4,166.6,-51.5,149.4],
    [366.6,-273.4,357.7,-285.3,345.7,-295.7,333.9,-303.0,316.3,-309.4,299.3,-313.2,280.4,-314.0,264.6,-312.9,245.5,-309.0,221.8,-300.7],
    [-429.4,-435.4,-440.8,-435.2],
    [-491.4,-423.3,-512.9,-413.0,-531.3,-402.0,-548.6,-389.8,-566.1,-371.9,-576.2,-360.1,-588.5,-345.0],
    [-359.2,355.1,-378.3,365.7,-392.6,372.3,-410.3,379.3,-431.4,383.6,-449.4,384.8,-473.1,381.7,-485.7,376.4],
    [-378.9,253.1,-371.8,242.5,-348.5,220.5,-329.4,208.7,-306.2,201.6,-283.5,200.4],
    [-40.7,496.6,-25.8,506.7,-12.7,510.9,6.4,513.8,24.3,513.8,49.9,504.3,78.0,488.0],
    [-118.9,392.9,-103.4,410.7,-65.8,471.2,-54.5,490.7,-44.3,499.0],
    [54.1,265.0,-35.4,240.7],
    [144.8,367.5,149.5,349.1,149.5,312.4,145.4,288.7,138.2,261.4,131.0,252.5]];
  const RAIL = [[-475.1,18.8,-479.8,20.1],
    [-602.6,30.8,-604.5,28.8,-606.1,23.7]];
  const FENCES = [[100.0,-34.2,108.5,-35.2,230.2,-77.1],
    [309.8,-75.8,255.5,-55.1],
    [235.1,-49.4,164.4,-25.5],
    [326.1,-86.8,314.2,-84.0],
    [300.1,-80.2,281.1,-74.9,262.7,-68.4],
    [333.9,-89.3,340.0,-94.5,346.3,-100.8],
    [344.0,-128.6,344.0,-140.4,342.0,-156.0,339.7,-169.6],
    [-29.2,-296.9,-29.1,-302.7,-27.9,-316.2],
    [-77.2,-515.6,-53.0,-526.4,-22.5,-538.1],
    [-31.1,-321.5,-29.5,-362.3,-27.7,-383.0,-25.1,-400.3,-21.1,-417.3],
    [-237.6,-451.8,-237.0,-449.7,-291.8,-439.3,-320.3,-436.8,-336.9,-437.8],
    [-212.6,-458.3,-237.9,-453.3,-237.6,-451.8],
    [108.3,-181.8,93.3,-178.3,84.9,-177.3],
    [47.9,-181.4,40.9,-184.1,31.2,-188.7,22.7,-193.2],
    [224.3,-296.9,216.9,-288.4,205.8,-274.6],
    [-424.3,-439.0,-416.7,-438.2,-385.3,-436.5,-336.9,-434.9]];
  const FOOT = [[-314.3,120.4,-309.0,118.4,-304.7,115.5,-300.5,111.8,-296.1,109.9,-246.6,101.3,-138.3,84.1,-98.5,78.2,-53.0,68.0,-15.6,57.3,11.6,54.2,27.3,51.9,38.8,47.9,47.2,46.0,57.5,45.6,84.4,50.8,97.5,51.1,108.9,49.3,127.2,39.1,136.9,34.7,146.7,32.4,158.9,32.1,176.8,32.7,187.2,31.9,249.6,21.8],
    [-320.6,74.3,-296.5,73.6,-289.2,72.9,-247.0,70.8,-207.2,66.4,-142.0,61.4,-119.9,58.8,-55.3,54.2,-15.6,57.3],
    [-357.8,101.7,-332.5,94.0,-319.8,92.3],
    [-319.1,97.7,-315.5,97.2],
    [-357.8,101.7,-330.6,107.0,-318.1,105.8],
    [-357.8,101.7,-329.6,113.8,-317.2,112.8],
    [-313.5,112.3,-300.5,111.8],
    [-317.2,112.8,-313.5,112.3],
    [-314.4,105.4,-300.5,111.8],
    [-318.1,105.8,-314.4,105.4],
    [-317.1,84.8,-295.2,82.2],
    [-320.7,85.4,-317.1,84.8],
    [-316.2,91.9,-294.2,88.8],
    [-319.8,92.3,-316.2,91.9],
    [-315.5,97.2,-304.5,96.2,-293.3,94.5],
    [-357.8,101.7,-319.1,97.7],
    [-357.8,101.7,-333.3,87.2,-320.7,85.4],
    [-296.5,73.6,-291.1,108.9],
    [-247.0,70.8,-231.7,87.4],
    [-207.2,66.4,-204.0,94.5],
    [-142.0,61.4,-138.3,84.1],
    [-246.6,101.3,-231.7,87.4,-224.4,82.8,-213.8,78.2,-206.1,76.6,-196.2,76.6,-185.3,78.2,-173.7,81.7,-162.0,88.1]];
  const PARK = [[-192.3,-585.8,-188.1,-593.5,-148.4,-597.0,-144.4,-540.8,-170.1,-538.1,-183.2,-535.9,-188.7,-539.4],
    [100.0,-34.2,97.3,-67.9,34.3,-63.7,27.6,-63.7,3.5,-95.5,-18.0,-107.4,-24.8,-111.8,-37.2,-122.8,-42.0,-127.7,-45.5,-132.1,-49.0,-139.0,-75.3,-210.5,-375.5,-186.6,-448.3,-181.2,-437.0,-27.7,-354.4,-33.5,-352.5,-4.9,-334.1,-6.4,-333.7,-0.6,-324.1,-1.2,-325.6,-2.5,-326.7,-4.0,-327.4,-5.9,-327.6,-7.8,-327.3,-9.7,-326.5,-11.5,-325.3,-13.0,-321.9,-15.0,-320.0,-15.1,-320.8,-27.0,-323.0,-26.8,-324.8,-39.0,-184.1,-50.1,-43.6,-60.5,-43.2,-47.9,15.6,-52.5,17.0,-33.6,51.8,-36.5,50.9,-48.0,86.3,-50.7,87.6,-33.3],
    [-254.6,207.4,-170.3,265.3,-155.8,272.9,-143.9,275.7,-129.4,276.2,-115.2,273.1,-105.0,269.5,-94.6,262.4,-84.4,252.4,-78.8,242.6,-75.0,233.1,-71.6,222.3,-71.0,211.2,-71.0,199.2,-72.2,185.0,-107.8,190.8,-109.7,180.9]];
  const GATES = [[-314.3,120.4,1.21,3,0],[-65.2,153.6,3.88,5,0],[-237.6,-451.8,1.27,4,1],[-207.1,-503.5,3.06,5,0],[-226.3,-492.6,1.2,5,0],[-190.9,-500.7,1.23,5,0],[-81.8,-534.5,4.19,5,0],[-320.6,74.3,1.5,5,0],[-318.9,85.1,1.42,3,0],[-318.0,92.0,1.47,3,0],[-317.3,97.5,1.44,3,0],[-316.1,105.6,1.48,3,0],[-315.4,112.6,1.44,3,0],[71.0,-66.2,-0.05,5,0],[-342.2,-5.7,-0.08,5,0],[94.0,-33.7,3.08,5,0],[36.5,-35.1,-0.07,5,0],[-261.5,209.6,-0.97,5,0]];
  const TREES = [-219.0,-370.0,1,-169.5,-386.0,1,138.5,-269.0,1,-231.5,-498.5,1,-255.0,-488.0,1,-265.5,-485.0,1,-271.5,-483.0,1,-282.0,-480.0,1,-290.0,-478.5,1,-300.0,-475.5,1,-60.0,-538.5,1,-87.0,-546.5,1,-76.5,-543.5,1,-108.5,-547.0,1,-116.5,-545.0,1,-125.0,-542.0,1,-303.5,-36.5,1,-269.0,91.5,1,-170.0,74.0,1,-105.5,-54.0,1,-121.5,-51.5,1,-80.5,-55.5,1,-65.5,-58.0,1,-59.5,-58.5,1,-51.0,-58.0,1,-138.0,-50.5,1,-161.0,-48.5,1,-177.5,-47.0,1,-212.5,-45.0,1,-218.0,-45.0,1,-229.5,-44.0,1,-234.5,-44.0,1,-249.5,-42.0,1,-273.5,-40.0,1,-289.5,-39.5,1,-285.0,-40.0,1,-98.0,-215.5,1,-91.5,-216.5,1,-47.5,-58.5,1,-194.0,-46.5,1,-307.5,-473.5,1,-377.0,-447.5,1,-359.5,-447.5,1,-198.5,366.5,1,-186.5,382.0,1];
  const TKEY = 'tr', TSTEP = 3, HW = 1.5;

  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => {   // smooth value noise on a 9 m lattice, 0..1
    const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };

  // what is laid here first, then the track's own parts with its tree list lengthened by TREES for the while (the list itself kept as it is)
  const base = LK.extra;
  LK.extra = function (o) {
    const mine = lay(o), sk = A.T && A.T.def && A.T.def.sk, t0 = sk ? sk[TKEY] : null;
    if (sk && TREES.length) sk[TKEY] = (t0 || []).concat(TREES);
    let st; try { st = base(o) || {}; } finally { if (sk) sk[TKEY] = t0; }
    mine.osmTrees = TREES.length / TSTEP; st.roadside = mine; return st;
  };

  function lay(o) {
    const { root, scen, exclPush: exPush, excluded, CR, tex } = o, { RB, nrGround, nrNear, box } = A, cyl = A.cyl;
    const st = { walls: 0, wallM: 0, wallSkip: 0, fences: 0, fenceM: 0, posts: 0, gates: 0, ways: 0, wayM: 0, parkCells: 0, lamps: 0, meshes: 0 };
    // the clearances of what is laid here are pushed at the end, so that while it is laid out the builder's list holds only what was there
    // before it (and what is laid here does not take its own clearances for another's)
    const later = [], exclPush = (x, z, r) => { later.push(x, z, r); };
    const past = (x, z, m) => { const n = nrNear(x, z); return n.i < 0 || n.dd >= m; };
    const near = (x, z, m) => { const n = nrNear(x, z); return n.i >= 0 && n.dd < m; };
    // what is laid on the ground goes into a mesh per material and 120 m square, so three.js leaves out of the frame what is out of view
    const TILE = 120, tiles = new Map();
    const rbAt = (mt, x, z) => { const key = mt + ',' + Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let t = tiles.get(key); if (!t) tiles.set(key, t = { mt, rb: new RB(true) }); return t.rb; };
    const area = (P) => { let s = 0; for (let k = 0; k < P.length; k += 2) { const j = (k + 2) % P.length; s += P[k] * P[j + 1] - P[j] * P[k + 1]; } return s / 2; };
    // a polygon [x0, z0, ...] cut to the cell x0..x1, z0..z1 (Sutherland-Hodgman), null when nothing of it is left
    const clip = (Q, x0, z0, x1, z1) => { let P = Q;
      for (const [ax, c, s] of [[0, x0, 1], [0, x1, -1], [1, z0, 1], [1, z1, -1]]) { const R = [], n = P.length / 2;
        for (let k = 0; k < n; k++) { const j = (k + 1) % n, px = P[2 * k], pz = P[2 * k + 1], qx = P[2 * j], qz = P[2 * j + 1];
          const pv = ((ax ? pz : px) - c) * s, qv = ((ax ? qz : qx) - c) * s;
          if (pv >= 0) R.push(px, pz);
          if ((pv >= 0) !== (qv >= 0)) { const t = pv / (pv - qv); R.push(px + (qx - px) * t, pz + (qz - pz) * t); } }
        if (R.length < 6) return null; P = R; }
      return P; };
    // a polygon laid on the ground in cells of C m (a whole cell two triangles on its shared corners, a cut one triangulated), lift m up,
    // its colour after colAt, the texture U m a tile; only the cells whose middle lies 1.5 to 60 m past the barriers
    const drape = (mt, Q, C, colAt, lift, U, onCell) => {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (let k = 0; k < Q.length; k += 2) { x0 = Math.min(x0, Q[k]); x1 = Math.max(x1, Q[k]); z0 = Math.min(z0, Q[k + 1]); z1 = Math.max(z1, Q[k + 1]); }
      const i0 = Math.floor(x0 / C), i1 = Math.floor(x1 / C), j0 = Math.floor(z0 / C), j1 = Math.floor(z1 / C), V = new Map();
      const vtx = (rb, x, z) => rb.row([[x, nrGround(x, z) + lift, z]], [colAt(x, z)], [[x / U, z / U]]);
      const cor = (rb, i, j) => { let M = V.get(rb); if (!M) V.set(rb, M = new Map()); const key = i * 100003 + j; let v = M.get(key); if (v === undefined) M.set(key, v = vtx(rb, i * C, j * C)); return v; };
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const P = clip(Q, i * C, j * C, (i + 1) * C, (j + 1) * C); if (!P) continue;
        let cx = 0, cz = 0; for (let k = 0; k < P.length; k += 2) { cx += P[k]; cz += P[k + 1]; } cx /= P.length / 2; cz /= P.length / 2;
        if (!past(cx, cz, 1.5) || !near(cx, cz, 60)) continue;
        const rb = rbAt(mt, cx, cz);
        if (Math.abs(Math.abs(area(P)) - C * C) < 1e-3) { const a = cor(rb, i, j), b = cor(rb, i + 1, j), c = cor(rb, i + 1, j + 1), d = cor(rb, i, j + 1); rb.I.push(a, c, b, a, d, c); }
        else {
          const n = P.length / 2, b0 = rb.n; if (Math.abs(area(P)) < 0.01) continue;
          for (let k = 0; k < n; k++) vtx(rb, P[2 * k], P[2 * k + 1]);
          const tri = THREE.ShapeUtils.triangulateShape(Array.from({ length: n }, (_, k) => new THREE.Vector2(P[2 * k], P[2 * k + 1])), []);
          for (const [a, b, c] of tri) {
            const cr = (P[2 * b] - P[2 * a]) * (P[2 * c + 1] - P[2 * a + 1]) - (P[2 * b + 1] - P[2 * a + 1]) * (P[2 * c] - P[2 * a]);
            if (cr < 0) rb.I.push(b0 + a, b0 + b, b0 + c); else rb.I.push(b0 + a, b0 + c, b0 + b);   // (up-facing: x east, z south)
          }
        }
        onCell(cx, cz);
      }
    };
    // the points every ~step m along a line (its own points kept), each with its distance along the line: [x, z, acc, ...]
    const walk = (W, step) => { const P = [W[0], W[1], 0]; let acc = 0;
      for (let q = 0; q + 3 < W.length; q += 2) { const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / step));
        for (let t = 1; t <= m; t++) P.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m, acc + L * t / m);
        acc += L; }
      return P; };
    // a strip along a line, its cross-section prof(x, z, g, nx, nz) a row of points (with its colours and its v texture coordinates) every
    // ~step m, into material mt; a row within m0 m past the barriers left out (the strip broken there); onRow(x, z, g, acc) for each row
    const strip = (W, step, m0, mt, prof, onRow) => {
      const P = walk(W, step); let prev = null, pi = -1, prb = null, L = 0;
      for (let k = 0; k < P.length; k += 3) {
        const x = P[k], z = P[k + 1], acc = P[k + 2];
        if (!past(x, z, m0)) { prev = null; continue; }
        const k0 = Math.max(0, k - 3), k1 = Math.min(P.length - 3, k + 3), dx = P[k1] - P[k0], dz = P[k1 + 1] - P[k0 + 1], dl = Math.hypot(dx, dz) || 1;
        const g = nrGround(x, z), [pts, cols, vs] = prof(x, z, g, -dz / dl, dx / dl), uvs = vs.map(v => [acc / 3, v]), rb = rbAt(mt, x, z);
        if (prev && rb !== prb) pi = rb.row(prev[0], prev[1], prev[2]);
        const r = rb.row(pts, cols, uvs);
        if (prev) { rb.link(pi, r, 0, pts.length - 1); L += acc - prev[3]; }
        prev = [pts, cols, uvs, acc]; pi = r; prb = rb; onRow(x, z, g, acc);
      }
      return L;
    };
    const FEN_C = [0.8, 0.82, 0.84], POST_C = [0.6, 0.61, 0.64];

    // the tyre walls: rows every ~2 m along, each the bottom and the top of one face, the top's far edge and the other face (0.8 m apart,
    // 0.95 m high), the builder's tyre texture on both faces, the top dark; a row within 2 m past the barriers left out
    const W1 = [1, 1, 1], DK = [0.3, 0.3, 0.32];
    for (const W of TYRES) {
      const L = strip(W, 2, 2, 4, (x, z, g, nx, nz) => { const a = [x - nx * 0.4, z - nz * 0.4], b = [x + nx * 0.4, z + nz * 0.4];
        return [[[a[0], g - 0.1, a[1]], [a[0], g + 0.95, a[1]], [b[0], g + 0.95, b[1]], [b[0], g - 0.1, b[1]]], [W1, W1, DK, W1], [0.02, 0.98, 0.98, 0.02]]; }, (x, z) => {
        exclPush(x, z, 1.4); if (near(x, z, 45)) CR.avoid(x, z, 0.9); });
      if (L > 0) { st.walls++; st.wallM += L; }
    }

    // the guard rail: a W-beam 0.32 m deep, 0.45-0.77 m up, on a steel post every ~2 m (0.9 m high), galvanised grey; boxes per 2 m piece
    const RAIL_C = [0.78, 0.8, 0.83], RAIL_T = [0.88, 0.9, 0.92];
    for (const W of RAIL) {
      const P = walk(W, 2);
      for (let k = 3; k < P.length; k += 3) {
        const x0 = P[k - 3], z0 = P[k - 2], x1 = P[k], z1 = P[k + 1], mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
        if (!past(mx, mz, 2)) continue;
        const g = scen.get(mx, mz), y = nrGround(mx, mz), rot = Math.atan2(z1 - z0, x1 - x0);
        box(g, mx, y + 0.45, mz, Math.hypot(x1 - x0, z1 - z0) + 0.02, 0.32, 0.08, rot, RAIL_C, RAIL_T, true);
        box(scen.get(x1, z1), x1, nrGround(x1, z1) - 0.2, z1, 0.1, 1.1, 0.1, rot, POST_C, POST_C, true);
        exclPush(mx, mz, 1.2); if (near(mx, mz, 45)) CR.avoid(mx, mz, 0.8); st.wallM += Math.hypot(x1 - x0, z1 - z0);
      }
    }

    // the fences: chain-link mesh 2 m high (the builder's fence texture, as on its catch fences) on rows every ~2.5 m along, on the ground;
    // a steel post every ~5 m; a row within 2 m past the barriers left out
    for (const W of FENCES) {
      let lastPost = -1e9;
      const L = strip(W, 2.5, 2, 1, (x, z, g) => [[[x, g - 0.05, z], [x, g + 2, z]], [FEN_C, FEN_C], [0, 0.76]], (x, z, g, acc) => {
        if (cyl && acc - lastPost > 4.9) { cyl(scen.get(x, z), x, g - 0.1, z, 0.04, 2.1, 3, POST_C); lastPost = acc; st.posts++; }
        exclPush(x, z, 1.2); if (near(x, z, 45)) CR.avoid(x, z, 0.8); });
      if (L > 0) { st.fences++; st.fenceM += L; }
    }

    // the gates: two steel posts, a rail at the foot and one at the top, the mesh between them where the gate does not stand in a fence's line
    for (const [x, z, ang, w, inF] of GATES) {
      if (!past(x, z, 1.5)) continue;
      const g = scen.get(x, z), y = nrGround(x, z), c = Math.cos(ang), s = Math.sin(ang);
      for (const f of [-0.5, 0.5]) box(g, x + c * w * f, y - 0.2, z + s * w * f, 0.1, 2.3, 0.1, ang, POST_C, POST_C, true);
      for (const h of [0.1, 1.95]) box(g, x, y + h, z, w, 0.06, 0.06, ang, POST_C, POST_C, true);
      if (!inF) {
        const rb = rbAt(1, x, z), ends = [-0.5, 0.5].map(f => [x + c * w * f, z + s * w * f]);
        const r0 = rb.row([[ends[0][0], y + 0.12, ends[0][1]], [ends[0][0], y + 1.95, ends[0][1]]], [FEN_C, FEN_C], [[0, 0], [0, 0.68]]);
        const r1 = rb.row([[ends[1][0], y + 0.12, ends[1][1]], [ends[1][0], y + 1.95, ends[1][1]]], [FEN_C, FEN_C], [[w / 3, 0], [w / 3, 0.68]]);
        rb.link(r0, r1, 0, 1);
      }
      exclPush(x, z, w / 2 + 1); if (near(x, z, 45)) CR.avoid(x, z, w / 2 + 0.5); st.gates++;
    }

    // the ways: paving HW * 2 m wide on rows of two across (the left and the right edge) every ~2.5 m along, 0.1 m over the ground, a
    // little patchy; cut where they run within the barriers
    for (const W of FOOT) {
      const L = strip(W, 2.5, HW + 1.2, 2, (x, z, g, nx, nz) => { const f = 0.95 + 0.08 * patch(x, z), col = [0.95 * f, 0.94 * f, 0.92 * f];
        return [[-HW, HW].map(e => [x + nx * e, nrGround(x + nx * e, z + nz * e) + 0.1, z + nz * e]), [col, col], [-HW / 2, HW / 2]]; }, (x, z, g, acc) => {
        exclPush(x, z, HW + 1); if (Math.round(acc) % 5 === 0 && near(x, z, 45)) CR.avoid(x, z, HW + 0.4); });
      if (L > 0) { st.ways++; st.wayM += L; }
    }

    // the car parks: plain asphalt in 6 m cells, a little patchy, 0.03 m over the ground (the service roads, 0.08 m up, over them)
    const parkAt = (x, z) => { const f = 0.9 + 0.12 * patch(x + 300, z); return [0.78 * f, 0.78 * f, 0.8 * f]; }, pc = new Set();
    for (const Q of PARK) drape(3, Q, 6, parkAt, 0.03, 3, (cx, cz) => {
      const key = Math.floor(cx / 6) + ',' + Math.floor(cz / 6); if (!pc.has(key)) { pc.add(key); st.parkCells++; } });

    // the meshes: the paving over the ground (polygon offset), the car parks' asphalt under the service roads, the mesh of the fences and
    // the gates seen from both sides; MT4 the track's own (the tyre walls)
    const MAT = [null, [tex.fence, 'roadside-fence'], [tex.paving || tex.asphalt, 'roadside-paving'], [tex.asphalt, 'roadside-asphalt'], [tex.tires, 'roadside-tyres']], mats = [];
    for (const { mt, rb } of tiles.values()) {
      if (rb.empty) continue;
      const mat = mats[mt] || (mats[mt] = mt === 1 ? new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide })
        : mt === 4 ? new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true, side: THREE.DoubleSide })
        : new THREE.MeshLambertMaterial({ map: MAT[mt][0], vertexColors: true, polygonOffset: true, polygonOffsetFactor: mt === 3 ? -1 : -3, polygonOffsetUnits: mt === 3 ? -2 : -6 }));
      const m = new THREE.Mesh(rb.geometry(), mat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = MAT[mt][1]; root.add(m); st.meshes++;
    }
    for (let k = 0; k < later.length; k += 3) exPush(later[k], later[k + 1], later[k + 2]);
    st.wallM = Math.round(st.wallM); st.fenceM = Math.round(st.fenceM); st.wayM = Math.round(st.wayM);
    return st;
  }
})();
