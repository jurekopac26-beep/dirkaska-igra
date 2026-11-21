/* =========================================================================
   WORLD — realizem 14: Bathurst (the shared builder, js/world-rbring.js; outside the 15 tracks of the packages, docs/realizem.md) by
   OpenStreetMap within 60 m of its lap: the eleven houses that stand there in place of the street of houses the builder made up along
   the climb after the first corner (the look's `street`, switched off here: OSM has one house there, a campground, a vineyard and fences), eight other
   buildings by their outlines, a water tank and the fences that stand outside the game's barriers. OSM has the buildings' outlines and,
   for two of them, their levels; no heights, roofs, colours or materials. Assumed and said so in the pull request: a house is one storey
   (eaves 3 m) under a gable roof along its long side, drawn as the rectangle of its outline's own area in the builder's own Bathurst
   house colours; a level is 3.2 m; a building without levels is 4 m, a hall of over 1000 m² 7 m; flat roofs; fences 2 m; the tank 2.3 m.
   Not drawn: the walls (OSM's are the circuit's own first line, which the builder's barriers are: never drawn a second time), OSM's
   marshal posts (the builder stands its own every 360 m), the building in the paddock (the game's own pit building and yard stand
   there), the pit building and the grandstands (the game's own). No names anywhere: only OSM's way numbers.
   The part is chained onto the look's build hook (API.rbLook.bathurst.build, after a world's own): the buildings and the fences' posts
   go into the scenery's chunks, the chain link into one mesh. Loaded after js/world-rbring.js (index.html); chained when the builder is
   first called (World.ext.rbring, which every world's build calls), so the order the worlds' files load in does not matter.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«); x east and z south of the middle of the start line, in metres.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.rbring) return;
  const API = World.api, PART = {}, OFF = {}, DONE = new WeakSet();
  const chain = (id, fn, off) => { PART[id] = fn; OFF[id] = off || []; };   // (off: the look's made-up things this part stands in for)
  const hook = () => {
    const L = API.rbLook || {};
    for (const id in PART) {
      const lk = L[id]; if (!lk || DONE.has(lk)) continue;
      const prev = lk.build, fn = PART[id]; lk.build = prev ? (K) => { prev(K); fn(K); } : fn; DONE.add(lk);
      for (const k of OFF[id]) lk[k] = null;
    }
  };
  let TEX = null;   // (the builder's textures: the chain link's picture)
  const rb = World.ext.rbring; World.ext.rbring = (scene, tex, opts) => { TEX = tex; hook(); return rb(scene, tex, opts); };

  const pts = (f) => { const P = []; for (let k = 0; k + 1 < f.length; k += 2) P.push([f[k], f[k + 1]]); return P; };
  const mid = (P) => { let x = 0, z = 0; for (const p of P) { x += p[0] / P.length; z += p[1] / P.length; } return [x, z]; };
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  // the trees, the camps and the people off an outline: circles of r over it 8 m apart and along its edges (the people's 1 m less)
  function keepOff({ exclPush, CR }, P, r) {
    const put = (x, z) => { exclPush(x, z, r); CR.exclAdd(x, z, r - 1); };
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    for (let x = x0 + 4; x < x1; x += 8) for (let z = z0 + 4; z < z1; z += 8) if (inPoly(P, x, z)) put(x, z);
    for (let k = 0; k < P.length; k++) { const a = P[k], b = P[(k + 1) % P.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 8)); for (let q = 0; q < n; q++) put(...lerp2(a, b, q / n)); }
  }
  // the lowest and the highest ground under an outline's corners
  const span = (nrGround, P) => { let lo = 1e9, hi = -1e9; for (const [x, z] of P) { const y = nrGround(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };

  // the builder's own Bathurst houses' colours (js/world-rbring.js): weatherboard, cream, red and brown brick; red, grey and green iron, zinc
  const HW = [[0.93, 0.9, 0.82], [0.92, 0.92, 0.88], [0.7, 0.42, 0.32], [0.62, 0.38, 0.3], [0.86, 0.8, 0.66]], HR = [[0.62, 0.2, 0.14], [0.5, 0.54, 0.56], [0.3, 0.42, 0.34], [0.66, 0.68, 0.7]];
  const WALL = [0.9, 0.9, 0.89], GLASS = [0.3, 0.42, 0.55], ROOF = [0.62, 0.63, 0.66], PLAIN = [[0.86, 0.84, 0.78], [0.8, 0.8, 0.78]], ZINC = [0.66, 0.68, 0.7], POST = [0.58, 0.6, 0.62];
  const FLOOR = 3.2;

  // a house: [x, z of its outline's middle, long side, short side, the long side's direction in degrees]; its floor on the highest ground
  // under its corners, its walls down to the lowest, eaves 3 m up, a gable roof along the long side (0.45 m over the walls, about 22°)
  function house(K, [cx, cz, w, d, deg], k) {
    const { scen, nrGround } = K, { box, gable } = API, rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
    const P = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [cx + a * w / 2 * c - b * d / 2 * s, cz + a * w / 2 * s + b * d / 2 * c]);
    const [lo, hi] = span(nrGround, P), g = scen.get(cx, cz), wc = HW[k % HW.length];
    box(g, cx, lo - 0.4, cz, w, hi - lo + 3.4, d, rot, wc, null, true);
    gable(g, cx, hi + 2.95, cz, w + 0.9, d + 0.9, Math.min(3.2, Math.max(1.5, 0.2 * (d + 0.9))), rot, HR[(k * 3 + 1) % HR.length], wc);
    keepOff(K, P, 6);
  }

  // a flat roof over an outline that need not be convex: its ears cut off one by one
  function flat(g, P, y, col) {
    const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), inT = (p, a, b, c) => cr(a, b, p) >= 0 && cr(b, c, p) >= 0 && cr(c, a, p) >= 0;
    let A = 0; P.forEach((a, i) => { const b = P[(i + 1) % P.length]; A += a[0] * b[1] - b[0] * a[1]; });
    const V = A > 0 ? P.slice() : P.slice().reverse();
    for (let n = 0; V.length > 2 && n < 200; n++) {
      let i = 0;
      for (; i < V.length; i++) {
        const a = V[(i + V.length - 1) % V.length], b = V[i], c = V[(i + 1) % V.length];
        if (cr(a, b, c) > 0 && !V.some((p) => p !== a && p !== b && p !== c && inT(p, a, b, c))) { g.triUp([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], [col, col, col]); break; }
      }
      if (i === V.length) return; V.splice(i, 1);
    }
  }
  // a building by its outline: its floor on the highest ground under its corners, walls down to the lowest and h up, a flat roof; one with
  // levels: the pit building's white, its glass in a band on every floor (6 cm out of the wall, 0.8 m in from the corners)
  function block(K, f, h, floors, wc) {
    const { scen, nrGround } = K, P = pts(f), [cx, cz] = mid(P), g = scen.get(cx, cz), [lo, hi] = span(nrGround, P), y0 = lo - 0.4, y1 = hi + h;
    let A = 0; P.forEach((a, i) => { const b = P[(i + 1) % P.length]; A += a[0] * b[1] - b[0] * a[1]; });
    P.forEach((a, i) => {
      const b = P[(i + 1) % P.length], el = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, sg = A > 0 ? 1 : -1, nx = sg * (b[1] - a[1]) / el, nz = -sg * (b[0] - a[0]) / el;   // (out of the building)
      const ins = [(a[0] + b[0]) / 2 - nx, (y0 + y1) / 2, (a[1] + b[1]) / 2 - nz];
      g.quadO([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], wc, ins);
      if (!floors || el < 4) return;
      const A0 = lerp2(a, b, 0.8 / el), B0 = lerp2(a, b, 1 - 0.8 / el), ax = A0[0] + nx * 0.06, az = A0[1] + nz * 0.06, bx = B0[0] + nx * 0.06, bz = B0[1] + nz * 0.06;
      for (let k = 0; k < floors; k++) { const y = hi + 1 + k * FLOOR; g.quadO([ax, y, az], [bx, y, bz], [bx, y + 1.5, bz], [ax, y + 1.5, az], GLASS, ins); }
    });
    flat(g, P, y1, ROOF);
    keepOff(K, P, 6);
  }

  // true where a fence may stand: within 60 m of the lap, 2.5 m clear of the game's barrier, not by the pit lane or the builder's grandstands
  const keeper = ({ T, def, sAt }) => {
    const st = (def.stands || []).map(([a, b, sd]) => [sAt(a - 8), b - a + 16, sd]);
    return (x, z) => {
      const i = T.nearestIdx(x, z), o = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], s = i * T.ds;
      if (Math.hypot(x - T.px[i], z - T.pz[i]) > 60 || Math.abs(o) <= (o > 0 ? T.br[i] : T.bl[i]) + 2.5 || T.pitAt(s)) return false;
      for (const [s0, w, sd] of st) if (sd * o > 0 && (((s - s0) % T.len) + T.len) % T.len <= w) return false;
      return true;
    };
  };
  // true where the builder's own debris fence stands in front (its grandstands, spectator areas, walls, the outside of its hard corners,
  // the start straight), within 10 m of the barrier: OSM's fence there is the one the game already has
  const ownFence = ({ T, def, sAt, dS }) => {
    const N = T.px.length, F = [new Uint8Array(N), new Uint8Array(N)], si = (sd) => (sd > 0 ? 1 : 0);
    for (const [key, e] of [['stands', 24], ['ga', 10], ['walls', 20]]) for (const [a, b, sd] of def[key] || []) for (let d = a - e; d <= b + e; d += T.ds) F[si(sd)][T.idx(sAt(d))] = 1;
    for (const c of T.corners || []) {
      if (c.sev < 3) continue;
      const i1 = c.i1 < c.i0 ? c.i1 + N : c.i1, k2 = si(-c.dir), gr = k2 ? T.gravR : T.gravL;
      for (let k = c.i0 - 10; k <= i1 + 14; k++) { const ii = ((k % N) + N) % N; if (gr && gr[ii]) F[k2][ii] = 1; }
    }
    for (let i = 0; i < N; i++) { const d = dS(i * T.ds); if (d > -420 && d < 280) F[0][i] = F[1][i] = 1; }
    return (x, z) => { const i = T.nearestIdx(x, z), o = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]; return F[si(o)][i] === 1 && Math.abs(o) <= (o > 0 ? T.br[i] : T.bl[i]) + 10; };
  };
  // the fences: chain link 2 m high in pieces of about 3 m on posts, where one may stand; runs of under three pieces are left out
  function fences(K, list) {
    const { scen, nrGround, exclPush, CR, root } = K, { GB, cyl } = API, fg = new GB(true), keep = keeper(K), own = ownFence(K);
    const post = (x, z) => cyl(scen.get(x, z), x, nrGround(x, z) - 0.2, z, 0.055, 2.35, 3, POST);   // (a three-sided post, half a box's faces: from the road it reads the same)
    for (const f of list) {
      const P = [];   // (the line in pieces: x0, z0, x1, z1, length)
      for (let k = 2; k < f.length; k += 2) {
        const ax = f[k - 2], az = f[k - 1], bx = f[k], bz = f[k + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 3));
        for (let q = 0; q < n; q++) P.push([ax + (bx - ax) * q / n, az + (bz - az) * q / n, ax + (bx - ax) * (q + 1) / n, az + (bz - az) * (q + 1) / n, L / n]);
      }
      const ok = P.map(([x0, z0, x1, z1]) => keep(x0, z0) && keep(x1, z1) && !own((x0 + x1) / 2, (z0 + z1) / 2));
      for (let q = 0; q < ok.length;) { let e = q; while (e < ok.length && ok[e] === ok[q]) e++; if (ok[q] && e - q < 3 && e - q < ok.length) ok.fill(false, q, e); q = e; }
      let acc = 0;
      P.forEach(([x0, z0, x1, z1, d], q) => {
        if (ok[q]) {
          const y0 = nrGround(x0, z0), y1 = nrGround(x1, z1), u0 = acc / 2.5, u1 = (acc + d) / 2.5, ins = [(x0 + x1) / 2 - (z1 - z0), y0 + 1, (z0 + z1) / 2 + (x1 - x0)];
          fg.quadO([x0, y0 + 0.05, z0], [x1, y1 + 0.05, z1], [x1, y1 + 2.05, z1], [x0, y0 + 2.05, z0], [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 0.8], [u0, 0.8]]);
          post(x0, z0); if (!ok[q + 1]) post(x1, z1);   // (a run's last post)
          exclPush((x0 + x1) / 2, (z0 + z1) / 2, 2); CR.exclAdd((x0 + x1) / 2, (z0 + z1) / 2, 1.5);
        }
        acc += d;
      });
    }
    if (fg.empty || !TEX || !TEX.fence) return;
    const m = new THREE.Mesh(fg.geometry(), new THREE.MeshLambertMaterial({ map: TEX.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'osmFences'; root.add(m);
  }

  /* ---- Bathurst ---- */
  const BT14 = {
    // building=house: w442378918, w442378741, w442378740, w442378739, w442378923, w442378693, w442378691, w442378684, w442403951, w442403854, w442403855
    house: [[-329.9, 671.6, 24.0, 16.9, 102], [-691.7, 959.6, 18.3, 15.6, 63], [-759.1, 925.9, 27.7, 9.8, 57], [-881.9, 888.0, 23.1, 18.4, 49], [-939.0, 1048.2, 27.7, 15.7, 10], [37.8, 1862.0, 15.3, 15.0, 152],
      [-54.0, 1744.0, 14.0, 8.8, 46], [-48.2, 1677.0, 18.8, 10.5, 39], [28.4, 1332.7, 13.9, 12.7, 54], [56.1, 1167.0, 15.7, 14.5, 101], [21.4, 1159.9, 25.4, 19.4, 10]],
    // building=yes, [levels (0: none in OSM), height, outline]: w306191909 (building:levels=4), w130102153 (building:levels=2), w306191959, w1100780004, w1100780000, w1106797627, w1356187783, w80890306 (a hall of 2765 m²)
    block: [[4, 13.4, [299.2, 409.8, 280.6, 407.5, 284.2, 384.4, 259.1, 380.7, 258.2, 389.1, 263.0, 406.9, 283.2, 434.3, 273.3, 440.7, 247.3, 405.1, 243.9, 393.8, 243.6, 350.2, 244.7, 275.1, 259.3, 277.4, 257.4, 346.9, 273.4, 360.0, 288.1, 362.4, 290.9, 344.8, 311.6, 347.9]],
      [2, 7, [-655.8, 1836.6, -657.0, 1846.2, -669.7, 1844.7, -668.6, 1835.2]],
      [0, 4, [-125.4, 1978.1, -116.7, 1977.6, -116.8, 1976.0, -110.0, 1975.8, -108.9, 2000.8, -124.2, 2001.0]],
      [0, 4, [-1093.8, 1655.5, -1083.7, 1666.0, -1075.1, 1657.7, -1085.3, 1647.2]],
      [0, 4, [-975.3, 1819.2, -970.0, 1822.2, -973.6, 1828.7, -978.9, 1825.7]],
      [0, 4, [-251.1, 236.7, -251.4, 239.2, -246.7, 239.9, -246.4, 237.3]],
      [0, 4, [-313.9, 652.7, -315.6, 662.6, -308.3, 663.9, -306.6, 653.9]],
      [0, 7, [313.5, 56.4, 311.5, 68.9, 305.1, 67.9, 300.1, 98.3, 306.5, 99.3, 304.4, 112.4, 349.0, 119.6, 358.1, 63.5]]],
    tank: [-810.0, 938.5, 1.0],   // man_made=storage_tank, content=water: w1102791234 (x, z, radius)
    // barrier=fence: w1108462287, w1356158656, w1108462317, w1149000680, w1107940970, w1107940975, w1164791174, w1107940976, w1120533347, w1120533346, w1120533345, w1120533344
    fence: [[-195.6, 94.0, -198.2, 97.4, -205.3, 126.0, -227.3, 121.2, -206.4, -2.3], [-433.0, -60.2, -502.0, -70.8, -529.4, 80.6, -295.8, 122.4], [-276.3, 240.6, -268.7, 243.9, -277.6, 291.2, -328.4, 541.9, -344.1, 539.0], [-328.4, 541.9, -200.4, 564.6],
      [-445.0, 1118.3, -454.1, 1164.9, -473.1, 1151.3, -445.0, 1118.3], [-897.8, 1068.4, -867.9, 1073.4, -846.8, 1100.6, -842.3, 1138.4, -861.4, 1246.0, -884.9, 1275.6, -926.2, 1299.6, -932.5, 1305.9],
      [-946.8, 1243.0, -932.0, 1257.1, -931.5, 1258.3, -932.5, 1260.9, -956.1, 1281.9, -1001.9, 1275.1],
      [-915.4, 1293.4, -924.1, 1285.0, -927.0, 1283.9, -958.8, 1312.0, -1063.1, 1418.4, -1085.7, 1480.2, -1091.5, 1489.2, -1091.6, 1497.7, -1110.9, 1565.9, -1006.9, 1733.1, -962.7, 1800.7, -963.6, 1809.8, -958.3, 1810.0, -953.7, 1811.5, -923.9, 1840.9, -907.1, 1845.8, -899.5, 1848.8, -894.5, 1851.8, -886.0, 1859.1,
        -872.8, 1863.6, -834.4, 1859.9, -740.5, 1833.9, -677.0, 1833.4, -671.8, 1835.2, -671.6, 1831.2, -629.7, 1834.5, -573.2, 1865.8, -562.6, 1873.6, -502.6, 1863.1, -472.6, 1888.3, -470.3, 1926.6, -410.9, 1924.6, -388.1, 1945.1, -307.3, 2006.3, -251.5, 2029.6, -223.0, 2070.9, -204.1, 2114.3, -185.3, 2131.7, -156.1, 2142.2,
        -149.0, 2132.2, -70.0, 2192.6, -79.5, 2230.2, -219.4, 2137.3, -261.1, 2064.4, -296.4, 2038.9, -326.3, 2013.3, -347.1, 1993.6, -353.2, 1983.0, -377.9, 1961.6, -412.8, 1929.4, -470.7, 1938.8, -489.4, 1940.1, -507.4, 1938.6, -531.5, 1934.5, -532.9, 1938.1, -543.5, 1939.0, -549.8, 1941.9, -552.6, 1939.9, -583.4, 1945.0, -646.4, 1932.9],
      [309.5, 14.6, 277.8, 45.4, 261.9, 75.1, 224.1, 311.8], [133.2, 5.7, 151.9, 10.1, 174.1, 12.3, 193.4, 12.2, 221.8, 8.8, 251.9, 0.9, 266.4, -4.5, 295.0, -19.1, 317.8, -35.8, 337.1, -53.4, 339.1, -56.5], [122.1, 4.2, 133.2, 5.7], [-379.6, -76.6, -367.7, -78.2, -337.1, -72.4, 92.3, -0.0, 110.0, 1.7, 122.1, 4.2]],
  };
  chain('bathurst', (K) => {
    BT14.house.forEach((h, k) => house(K, h, k));
    BT14.block.forEach(([floors, h, f], k) => block(K, f, h, floors, floors ? WALL : PLAIN[k % PLAIN.length]));
    const [tx, tz, tr] = BT14.tank; API.cyl(K.scen.get(tx, tz), tx, K.nrGround(tx, tz) - 0.1, tz, tr, 2.3, 8, ZINC, [0.6, 0.62, 0.64]); K.exclPush(tx, tz, 2);
    fences(K, BT14.fence);
  }, ['street']);
})();
