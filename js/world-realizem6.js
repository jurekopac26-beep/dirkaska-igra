/* =========================================================================
   WORLD — realizem 6: the real circuits on the shared builder (js/world-rbring.js) outside the 15 tracks of the packages (docs/realizem.md),
   what the chase camera sees along them as it is in OSM: the grandstands, the pits' buildings, the kerbs, the fences and the walls, the run-offs
   by their outlines. Each circuit's part is chained onto its look's build hook (API.rbLook.<id>.build, after a world's own: js/world-aguascalientes.js)
   and drawn into the scenery's chunks (no draw calls of its own). Loaded after js/world-rbring.js (index.html); chained when the builder is
   first called for a look (World.ext.rbring, which every world's build calls), so a world loaded later (lazily) gets its part too. Before the
   builder's lots, its world's extra, the people and the trees, which keep off what is drawn here.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.rbring) return;
  const API = World.api, PART = {}, DONE = new WeakSet();
  // a circuit's part after its world's own build (K: the shared builder's hook, js/world-rbring.js LK.build): chained once per look, when the
  // builder is called (the look is on API.rbLook by then, however its world was loaded)
  const chain = (id, fn) => { PART[id] = fn; };
  const hook = () => {
    const L = API.rbLook || {};
    for (const id in PART) {
      const lk = L[id]; if (!lk || DONE.has(lk)) continue;
      const prev = lk.build, fn = PART[id]; lk.build = prev ? (K) => { prev(K); fn(K); } : fn; DONE.add(lk);
    }
  };
  const rb = World.ext.rbring; World.ext.rbring = (scene, tex, opts) => { hook(); return rb(scene, tex, opts); };
  const pts = (f) => { const P = []; for (let k = 0; k + 1 < f.length; k += 2) P.push([f[k], f[k + 1]]); return P; };
  const mid = (P) => { let x = 0, z = 0; for (const p of P) { x += p[0] / P.length; z += p[1] / P.length; } return [x, z]; };
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  // the trees, the lots and the people off an outline: circles of r over it 8 m apart and along its edges (the people's 1 m less)
  function keepOff({ exclPush, CR }, P, r) {
    const put = (x, z) => { exclPush(x, z, r); CR.exclAdd(x, z, r - 1); };
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    for (let x = x0 + 4; x < x1; x += 8) for (let z = z0 + 4; z < z1; z += 8) if (inPoly(P, x, z)) put(x, z);
    for (let k = 0; k < P.length; k++) { const a = P[k], b = P[(k + 1) % P.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 8)); for (let q = 0; q < n; q++) put(...lerp2(a, b, q / n)); }
  }

  // the builder's colours: the pit building's white and its glass (js/world-rbring.js WH, GLS), its stands' concrete (TC: tread, back, riser)
  const WALL = [0.9, 0.9, 0.89], GLASS = [0.3, 0.42, 0.55], ROOF = [0.62, 0.63, 0.66], TREAD = [0.7, 0.71, 0.74], BACK = [0.58, 0.59, 0.62], RISER = [0.62, 0.63, 0.66],
    CONCRETE = [0.76, 0.76, 0.74], SAND = [0.88, 0.82, 0.7];   // (SAND: the sand-coloured walls of js/world-lusail.js's buildings)

  // a building:part by its outline, up to its height over the lowest ground under it: walls of the pit building's white, its glass in a band on
  // every floor (4 m; 6 cm out of the wall, 0.8 m in from the corners), a flat roof
  function tower(K, f, h) {
    const { scen, nrGround } = K, P = pts(f), [cx, cz] = mid(P);
    let yg = 1e9; for (const [x, z] of P) yg = Math.min(yg, nrGround(x, z));
    const y0 = yg - 0.5, y1 = yg + h, g = scen.get(cx, cz), IN = [cx, (y0 + y1) / 2, cz];
    for (let k = 0; k < P.length; k++) {
      const a = P[k], b = P[(k + 1) % P.length], el = Math.hypot(b[0] - a[0], b[1] - a[1]);
      g.quadO([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], WALL, IN);
      g.triUp([cx, y1, cz], [a[0], y1, a[1]], [b[0], y1, b[1]], [ROOF, ROOF, ROOF]);
      if (el < 4) continue;
      let nx = (b[1] - a[1]) / el, nz = -(b[0] - a[0]) / el; if (nx * ((a[0] + b[0]) / 2 - cx) + nz * ((a[1] + b[1]) / 2 - cz) < 0) { nx = -nx; nz = -nz; }
      const A = lerp2(a, b, 0.8 / el), B = lerp2(a, b, 1 - 0.8 / el), ax = A[0] + nx * 0.06, az = A[1] + nz * 0.06, bx = B[0] + nx * 0.06, bz = B[1] + nz * 0.06;
      for (let y = yg + 4.6; y + 2.4 < y1 - 1.2; y += 4) g.quadO([ax, y, az], [bx, y, bz], [bx, y + 2.4, bz], [ax, y + 2.4, az], GLASS, IN);
    }
  }

  // a bleacher by its outline (p0 -> p1 its edge to the track, p3 -> p2 its back): the builder's stands' concrete tiers rising from the track's
  // side, about 1.2 m deep, up to 10 m, no people; in pieces of at most 36 m along it, the first tier 0.7 m over the highest ground at the
  // piece's front, its walls down to the lowest under it
  function bleacher(K, f) {
    const { scen, nrGround } = K, p = pts(f), len = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]);
    const dep = (Math.hypot(p[3][0] - p[0][0], p[3][1] - p[0][1]) + Math.hypot(p[2][0] - p[1][0], p[2][1] - p[1][1])) / 2;
    const rows = Math.max(3, Math.round(dep / 1.2)), rise = Math.min(0.55, 10 / rows), np = Math.ceil(len / 36);
    for (let j = 0; j < np; j++) {
      const F0 = lerp2(p[0], p[1], j / np), F1 = lerp2(p[0], p[1], (j + 1) / np), B0 = lerp2(p[3], p[2], j / np), B1 = lerp2(p[3], p[2], (j + 1) / np);
      const at = (t, u) => lerp2(lerp2(F0, F1, t), lerp2(B0, B1, t), u), V = (t, u, y) => { const [x, z] = at(t, u); return [x, y, z]; };   // (t along the piece, u from its front to its back)
      let y0 = 1e9, yf = -1e9; for (const [t, u] of [[0, 0], [0.5, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]]) { const y = nrGround(...at(t, u)); y0 = Math.min(y0, y); if (!u) yf = Math.max(yf, y); }
      y0 -= 0.3; yf += 0.7;
      const [mx, mz] = at(0.5, 0.5), g = scen.get(mx, mz), yt = (k) => yf + k * rise;
      for (let k = 0; k < rows; k++) {
        const u0 = k / rows, u1 = (k + 1) / rows, y = yt(k), yb = k ? yt(k - 1) : y0, inE = V(0.5, (u0 + u1) / 2, (y0 + y) / 2);
        g.quadUp(V(0, u0, y), V(1, u0, y), V(1, u1, y), V(0, u1, y), [TREAD, TREAD, TREAD, TREAD]);
        g.quadO(V(0, u0, yb), V(1, u0, yb), V(1, u0, y), V(0, u0, y), k ? RISER : BACK, V(0.5, u0 + 0.5 / rows, (yb + y) / 2));   // (its riser; the first: the front wall)
        g.quadO(V(0, u0, y0), V(0, u1, y0), V(0, u1, y), V(0, u0, y), BACK, inE);   // (its ends)
        g.quadO(V(1, u0, y0), V(1, u1, y0), V(1, u1, y), V(1, u0, y), BACK, inE);
      }
      const yl = yt(rows - 1);
      g.quadO(V(0, 1, y0), V(1, 1, y0), V(1, 1, yl), V(0, 1, yl), BACK, V(0.5, 0.5, (y0 + yl) / 2));   // (the back wall)
    }
  }

  // a concrete helipad by its outline: two rings round its middle, 25 cm over the ground (no grass through it)
  function pad(K, f) {
    const { scen, nrGround } = K, P = pts(f), c = mid(P), g = scen.get(c[0], c[1]), V = ([x, z]) => [x, nrGround(x, z) + 0.25, z], cols = [CONCRETE, CONCRETE, CONCRETE, CONCRETE];
    for (let k = 0; k < P.length; k++) {
      const a = P[k], b = P[(k + 1) % P.length], am = lerp2(c, a, 0.5), bm = lerp2(c, b, 0.5);
      g.triUp(V(c), V(am), V(bm), cols); g.quadUp(V(am), V(a), V(b), V(bm), cols);
    }
  }

  // a wall by its line (x, z pairs; closed: its first point again at its end): 25 cm thick, h over the ground under it (followed in pieces of
  // at most 8 m; a line's first and last piece half the thickness longer, so that its corners close), its two faces and its top in col, its
  // ends where it is open; the trees, the lots and the people 3 m off it
  function wall(K, f, h, col) {
    const { scen, nrGround, exclPush, CR } = K, P = pts(f), t = 0.125, cols = [col, col, col, col], L = P.length - 1;
    const open = Math.hypot(P[L][0] - P[0][0], P[L][1] - P[0][1]) > 0.05;
    for (let k = 0; k < L; k++) {
      const a = P[k], b = P[k + 1], el = Math.hypot(b[0] - a[0], b[1] - a[1]); if (el < 0.05) continue;
      const ux = (b[0] - a[0]) / el, uz = (b[1] - a[1]) / el, nx = -uz * t, nz = ux * t, n = Math.ceil(el / 8);
      for (let q = 0; q < n; q++) {
        const e0 = q ? q / n * el : -t, e1 = q + 1 < n ? (q + 1) / n * el : el + t;
        const x0 = a[0] + ux * e0, z0 = a[1] + uz * e0, x1 = a[0] + ux * e1, z1 = a[1] + uz * e1, g0 = nrGround(x0, z0), g1 = nrGround(x1, z1);
        const V = (x, z, y, s) => [x + s * nx, y, z + s * nz], C = [(x0 + x1) / 2, (g0 + g1 + h) / 2, (z0 + z1) / 2], g = scen.get(C[0], C[2]);
        for (const s of [-1, 1]) g.quadO(V(x0, z0, g0 - 0.3, s), V(x1, z1, g1 - 0.3, s), V(x1, z1, g1 + h, s), V(x0, z0, g0 + h, s), col, C);
        g.quadUp(V(x0, z0, g0 + h, -1), V(x1, z1, g1 + h, -1), V(x1, z1, g1 + h, 1), V(x0, z0, g0 + h, 1), cols);
        if (open && !k && !q) g.quadO(V(x0, z0, g0 - 0.3, -1), V(x0, z0, g0 - 0.3, 1), V(x0, z0, g0 + h, 1), V(x0, z0, g0 + h, -1), col, C);
        if (open && k === L - 1 && q === n - 1) g.quadO(V(x1, z1, g1 - 0.3, -1), V(x1, z1, g1 - 0.3, 1), V(x1, z1, g1 + h, 1), V(x1, z1, g1 + h, -1), col, C);
        for (const [x, z] of [[x0, z0], [C[0], C[2]]]) { exclPush(x, z, 3); CR.exclAdd(x, z, 2); }
      }
    }
  }

  /* ---------------- Tuzla (OSM under ODbL, its ways by number; the ground the track's own: Copernicus WorldDEM-30) ----------------
     the pit building's two towers (building:part, height=37: w1505790332 at its west end, w1505790333 at its east end), the four bleachers
     round the circuit (leisure=bleachers: w1505764620, w1118611038, w1505764624, w1505764627; OSM gives them no height nor rows), the three
     concrete helipads 0.9 km on, by the circuit's outside (aeroway=helipad, surface=concrete: w1545229367, w1545229368, w1545229369).
     The outlines as x, z (m: east, south of the start line's middle); a bleacher's from its edge to the track */
  const TZ6 = {
    tower: [[-258.6, -10.0, -226.5, -15.1, -221.5, 15.9, -253.7, 21.0], [85.8, -43.3, 116.2, -49.5, 109.6, -81.8, 80.8, -75.4, 79.2, -75.1]],
    stand: [[-548.3, 17.6, -482.4, 140.4, -503.6, 153.2, -570.7, 27.6], [809.4, -418.6, 883.5, -450.8, 892.0, -431.4, 817.9, -399.3],
      [147.5, -955.8, 211.8, -876.4, 194.5, -862.6, 130.2, -941.9], [957.2, -1205.0, 875.8, -1264.6, 888.7, -1282.1, 970.1, -1222.5]],
    heli: [[638.0, -244.6, 649.6, -251.1, 652.9, -263.0, 645.6, -274.0, 633.9, -277.2, 623.0, -271.0, 619.8, -259.1, 626.0, -248.3],
      [675.0, -266.0, 686.5, -272.1, 689.6, -283.8, 683.3, -295.3, 670.1, -298.2, 660.7, -292.8, 656.8, -280.7, 663.3, -268.7],
      [653.5, -303.2, 664.8, -309.1, 668.1, -320.9, 661.5, -332.4, 649.0, -335.5, 638.1, -329.4, 635.9, -316.3, 642.4, -305.4]]
  };
  chain('tuzla', (K) => {
    for (const f of TZ6.tower) { tower(K, f, 37); keepOff(K, pts(f), 6); }
    for (const f of TZ6.stand) { bleacher(K, f); keepOff(K, pts(f), 7); }
    for (const f of TZ6.heli) { pad(K, f); keepOff(K, pts(f), 5); }
  });

  /* ---------------- Lusail (OSM under ODbL, its ways by number) ----------------
     the walls within about 40 m of the track, all 6 m or more past its barriers (barrier=wall; OSM gives them no height nor colour: 2 m, the
     sand of the circuit's buildings, js/world-lusail.js): the yards by the buildings round the circuit (w1443691425, w1568227986, w1568429327,
     w1568445691, w1568445695, w1568445696, w1569354859; the side that is a building's wall (def.sk.bld) left out), the side of the compound
     by 1.0 km which faces the track and the wall across it (w1434858524 to its corners, w1567611459), the two walls by the service roads at
     2.8 km to 58 m from the track (w1436401474, w1436401479) and two short ones by 1.3 and 1.4 km (w1568450343, w1568450348). Its fences
     (barrier=fence) are the catch fences at the run-offs' ends, which the builder draws on its own barriers' line; its grandstands are the
     track's (def.stands). The lines as x, z (m: east, south of the start line's middle) */
  const LU6 = [
    [-163.9, -193.6, -168.5, -191.1, -160.2, -176.1, -148.9, -182.3, -157.3, -197.3],
    [507.7, 453.0, 500.6, 464.2, 512.0, 471.3, 519.0, 460.0, 507.7, 453.0],
    [490.2, -184.7, 484.3, -174.0, 497.2, -166.9, 503.2, -177.6, 490.2, -184.7],
    [648.4, -601.5, 638.7, -588.3, 649.8, -580.3, 659.5, -593.5, 648.4, -601.5],
    [495.1, -638.2, 504.6, -643.0, 504.9, -644.8, 513.3, -648.3, 517.1, -640.3, 498.7, -631.7],
    [193.0, -633.9, 189.5, -637.0, 177.9, -624.0, 183.8, -618.9, 195.4, -631.8],
    [336.8, 503.2, 323.7, 510.3, 327.8, 517.7, 340.9, 510.6, 336.8, 503.2],
    [49.3, -516.4, 62.3, -516.6, 62.1, -537.2, 60.6, -638.5], [49.3, -516.4, 49.1, -537.0, 62.1, -537.2],
    [432.6, -338.6, 432.6, -335.3, 433.4, -332.0, 435.1, -329.0, 437.5, -326.6, 440.4, -324.9, 443.7, -323.9, 447.7, -323.7, 451.9, -324.5],
    [392.2, -307.7, 391.1, -325.7],
    [287.0, -774.1, 301.0, -790.5, 303.9, -791.0], [361.6, -836.3, 354.0, -830.4]
  ];
  chain('lusail', (K) => { for (const f of LU6) wall(K, f, 2, SAND); });
})();
