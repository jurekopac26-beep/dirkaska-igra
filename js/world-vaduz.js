/* =========================================================================
   WORLD — Vaduz, Liechtenstein (docs/proge/vaduz.md): the winding road up from the town to the castle on its rock above the Rhine valley,
   built by the shared world of the mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its own (PL_LOOK.vaduz) and its own
   landmark (L.pre, L.extra): the castle beside the last bends, from OpenStreetMap's building parts (their footprints and heights, ODbL 1.0):
   the walls of grey stone and of white plaster, the hipped roofs of red tile, the pyramid roofs of the keep and of the round bastion, the small
   dark windows on the faces toward the road. From the outside alone: no letters, arms, flags, statues or works of art. The road: two lanes,
   the white dashed centre line and white edges; the steel guardrails are the shared builder's; the car cannot fall (no def.drops)
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { GB, caGround, clamp, vrDist } = API;

  /* ---- the look: the Rhine valley in late summer: the green meadows and the beech and spruce woods on the slopes above the town, the
     grey limestone of the Alps behind it, snow only on the high peaks far off ---- */
  const LOOK = API.PL_LOOK.vaduz = {
    seed: 4870, board: 'VADUZ', sub: 'LIECHTENSTEIN', banner: ['TOWN · CASTLE', '522 M → 585 M · 0.8 KM'],
    grass: [0.36, 0.5, 0.22], grassDry: [0.5, 0.54, 0.3], grassLush: [0.3, 0.48, 0.19], shrub: [0.18, 0.3, 0.14],
    rock: [0.6, 0.58, 0.54], rockWarm: [0.64, 0.6, 0.53], lichen: [0.46, 0.46, 0.4], scree: [0.66, 0.64, 0.6],
    sat: 0.6, satV: 1.2, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.62, 0.6, 0.56], [0.68, 0.66, 0.6], [0.54, 0.53, 0.5], [0.7, 0.66, 0.58], [0.58, 0.56, 0.52], [0.64, 0.63, 0.6]],   // (the limestone: light grey, a little warm)
    centre: [0.95, 0.95, 0.92], dash: [3, 6], solidNear: 40,   // (white centre line: dashed 3 m / 6 m, solid through the hairpins)
    chev: ['#16161a', '#ffffff'], warn: 'tri', rail: 'steel', shoulder: [0.52, 0.52, 0.5],
    fans: [[0.95, 0.95, 0.94], [0.12, 0.22, 0.52], [0.78, 0.14, 0.14], [0.3, 0.32, 0.36], [0.2, 0.44, 0.3], [0.9, 0.78, 0.2], [0.55, 0.6, 0.68], [0.16, 0.16, 0.2]],
    cars: [[0.9, 0.9, 0.89], [0.16, 0.16, 0.18], [0.55, 0.57, 0.6], [0.14, 0.24, 0.48], [0.6, 0.12, 0.1], [0.74, 0.74, 0.72]],
    roofs: [[0.6, 0.27, 0.18], [0.52, 0.24, 0.17], [0.66, 0.32, 0.2], [0.36, 0.34, 0.33]],   // (the red tiles of the town's roofs, a few grey)
    sheep: 0, portal: 0,
    // (the far view: the valley's green floor, the woods up to ~1600 m, the dwarf pine and the grey rock of the high Alps, snow on the peaks)
    far: { lo: [0.36, 0.46, 0.24], hi: [0.56, 0.55, 0.52], dw: [0.2, 0.3, 0.17], snow: 2450, tree: [1750, 1550], fc: [0.13, 0.22, 0.12], dwb: [1600, 1800, 2300, 2100], rk: [1950, 2300] },
  };

  /* ---- the castle: OpenStreetMap's building parts, in the game's metres (x east, z south of the start line): [height, the wall (0 grey
     stone, 1 white plaster, 2 grey render, 3 grey plaster), the roof (0 hipped, 1 a pyramid), the outline x, z, …] ---- */
  const CASTLE = [
    [10.5, 0, 0, [54.5, 594.8, 53.1, 597.4, 56.9, 600.1, 59.1, 601.5, 61.8, 595.1]],
    [6, 0, 0, [51.5, 594.6, 51.9, 597.2, 52.9, 599.9, 53.9, 601, 56.3, 602, 56.9, 600.1, 59.1, 601.5, 57.5, 604.9, 54.9, 603.8, 50.9, 601, 49.6, 596.4, 49.4, 594.6]],
    [9, 1, 0, [42.1, 589.8, 42.1, 596.9, 45.4, 596.6, 47, 596.4, 49.6, 596.4, 49.4, 594.6, 48.8, 589.9, 47.3, 589.9, 44.5, 589.8]],
    [15, 0, 0, [64.7, 595.1, 72.8, 595.2, 80.6, 594.2, 79.9, 586.9, 77.9, 587.2, 77.7, 585.5, 74.7, 585.7, 74.6, 584.4, 66.5, 584.5, 66.6, 585.5, 64.1, 585.6, 63.9, 595.1]],
    [15, 1, 0, [49.4, 594.6, 48.8, 589.9, 49.2, 580.2, 54.9, 579.9, 64, 580.4, 64.1, 585.6, 63.9, 595.1, 61.8, 595.1, 54.5, 594.8, 51.5, 594.6]],
    [12, 1, 0, [67.3, 559.2, 65.3, 580.5, 64, 580.4, 54.9, 579.9, 54.8, 569.6, 57.4, 557.1, 63.2, 558.4]],
    [10.5, 1, 0, [56, 555.8, 63, 554.2, 63.1, 556.4, 63.2, 558.4, 57.4, 557.1, 56.7, 556.5]],
    [6, 3, 0, [43.5, 563.8, 46.9, 564.4, 45.9, 569.4, 44.2, 569.6, 42.7, 569.7]],
    [9, 1, 0, [52.2, 544.9, 53.5, 555.9, 49.6, 564.6, 46.9, 564.4, 43.5, 563.8, 45.1, 550.6, 47.3, 544.6]],
    [10.5, 1, 0, [52.2, 544.9, 53.5, 555.9, 56, 555.8, 63, 554.2, 68.7, 552.3, 75.7, 546.4, 66.2, 542.1, 56.6, 543.5]],
    [12, 1, 0, [83.2, 556, 80.7, 552.1, 75.7, 546.4, 68.7, 552.3, 72.6, 557.7, 74.8, 559.8]],
    [25, 0, 1, [90.7, 585.1, 93.4, 587.2, 94.4, 590.5, 94.6, 592.8, 94.8, 596.4, 94.7, 600.3, 92.8, 604.7, 89.6, 606.9, 86.5, 608.1, 80.9, 607.8, 76.6, 605, 73.8, 601.7, 72.8, 595.2, 80.6, 594.2, 79.9, 586.9]],
    [12, 0, 0, [86.8, 561.5, 89.8, 560, 93.5, 556.4, 95.8, 548.5, 95.2, 542.9, 92.1, 538.6, 88.1, 534.4, 84.5, 532.7, 76.1, 532.5, 70.3, 535.7, 66.2, 542.1, 75.7, 546.4, 79.5, 542.9, 81.6, 542.9, 83.5, 544.1, 84.5, 546, 84, 549.1, 80.7, 552.1, 83.2, 556]],
    [15, 2, 0, [76.6, 572.7, 72.4, 561.5, 74.8, 559.8, 83.2, 556, 86.8, 561.5, 87.9, 571.7]],
    [35, 0, 1, [77.7, 585.5, 77.9, 587.2, 79.9, 586.9, 90.7, 585.1, 87.9, 571.7, 76.6, 572.7, 76, 572.8]],
  ];
  const BOX = [38, 528, 100, 612];   // (the castle's ground: the shared builder's houses there are taken out)
  const WALL = [[0.66, 0.64, 0.6], [0.9, 0.87, 0.8], [0.7, 0.69, 0.66], [0.78, 0.77, 0.74]], PLINTH = [0.56, 0.54, 0.5];
  const TILE = [0.58, 0.25, 0.17], TILE_D = [0.46, 0.2, 0.14], WIN = [0.16, 0.15, 0.15];

  LOOK.pre = function ({ blds }) {
    for (let k = blds.length - 1; k >= 0; k--) { const b = blds[k]; if (b.x > BOX[0] && b.x < BOX[2] && b.z > BOX[1] && b.z < BOX[3]) blds.splice(k, 1); }
  };

  function inPoly(x, z, p) {   // (p: x, z, … flat)
    let r = false;
    for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) { const xi = p[i], zi = p[i + 1], xj = p[j], zj = p[j + 1];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) r = !r; }
    return r;
  }
  function triUp(g, a, b, c, col) {   // a triangle facing up, whatever its winding
    const ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]);
    if (ny >= 0) g.tri(a, b, c, col); else g.tri(a, c, b, col);
  }

  // one part of the castle into g: its walls from below the ground to the eaves (a plinth of rough stone at the foot), the roof (hipped: a
  // ring of slopes up to an inset outline closed flat on top; a pyramid: the slopes up to one apex), the windows on the faces toward the road
  function castlePart(g, part, all, base, st) {
    const [h, wk, rk, flat] = part, n = flat.length / 2;
    let pts = []; for (let k = 0; k < n; k++) pts.push([flat[2 * k], flat[2 * k + 1]]);
    let A = 0; for (let k = 0; k < n; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[(k + 1) % n]; A += x0 * z1 - x1 * z0; }
    if (A > 0) pts.reverse();   // (wound so that each edge's outward normal is (-dz, dx): GB.tri's front face)
    let lo = 1e9, hi = -1e9, cx = 0, cz = 0, rMin = 1e9;
    for (const [x, z] of pts) { const y = caGround(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); cx += x / n; cz += z / n; }
    for (const [x, z] of pts) rMin = Math.min(rMin, Math.hypot(x - cx, z - cz));
    const rMean = pts.reduce((a, [x, z]) => a + Math.hypot(x - cx, z - cz), 0) / n;
    const rH = rk ? rMean * 0.95 : clamp(rMin * 0.55, 1.6, 4.2) * 0.9, eave = Math.max(base + h - (rk ? rH * 0.4 : rH * 0.5), hi + 3.2);
    const bot = lo - 1.6, pl = Math.min(eave - 1, hi + 0.8), wc = WALL[wk];
    for (let k = 0; k < n; k++) {   // the walls: the plinth, the wall above it
      const [x0, z0] = pts[k], [x1, z1] = pts[(k + 1) % n];
      g.tri([x0, bot, z0], [x1, bot, z1], [x1, pl, z1], PLINTH); g.tri([x0, bot, z0], [x1, pl, z1], [x0, pl, z0], PLINTH);
      g.tri([x0, pl, z0], [x1, pl, z1], [x1, eave, z1], wc); g.tri([x0, pl, z0], [x1, eave, z1], [x0, eave, z0], wc);
    }
    if (rk) {   // a pyramid: the keep's and the round bastion's
      const ap = [cx, eave + rH, cz];
      for (let k = 0; k < n; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[(k + 1) % n]; g.tri([x0, eave, z0], [x1, eave, z1], ap, k % 2 ? TILE : TILE_D); }
    } else {   // hipped: the slopes up to the outline inset by d, flat on top
      const d = clamp(rMin * 0.55, 1.6, 4.2), yt = eave + d * 0.9, inn = [];
      for (let k = 0; k < n; k++) {
        const [xp, zp] = pts[(k + n - 1) % n], [x, z] = pts[k], [xn, zn] = pts[(k + 1) % n];
        let ax = x - xp, az = z - zp, bx = xn - x, bz = zn - z; const la = Math.hypot(ax, az) || 1, lb = Math.hypot(bx, bz) || 1; ax /= la; az /= la; bx /= lb; bz /= lb;
        const n1 = [az, -ax], n2 = [bz, -bx];   // (the inward normals of the two edges)
        const q = 1 + n1[0] * n2[0] + n1[1] * n2[1];   // (the miter: (n1 + n2) / (1 + n1·n2) · d, d / cos of half the turn, at most 2.2 d)
        let mx = (n1[0] + n2[0]) / Math.max(q, 0.05) * d, mz = (n1[1] + n2[1]) / Math.max(q, 0.05) * d;
        const f = Math.min(1, 2.2 * d / (Math.hypot(mx, mz) || 1), rMin * 0.9 / (Math.hypot(mx, mz) || 1));
        inn.push([x + mx * f, z + mz * f]);
      }
      for (let k = 0; k < n; k++) {
        const [x0, z0] = pts[k], [x1, z1] = pts[(k + 1) % n], [u0, v0] = inn[k], [u1, v1] = inn[(k + 1) % n], c = k % 2 ? TILE : TILE_D;
        g.tri([x0, eave, z0], [x1, eave, z1], [u1, yt, v1], c); g.tri([x0, eave, z0], [u1, yt, v1], [u0, yt, v0], c);
      }
      const tris = THREE.ShapeUtils.triangulateShape(inn.map(([x, z]) => new THREE.Vector2(x, z)), []);
      for (const [a, b, c] of tris) triUp(g, [inn[a][0], yt, inn[a][1]], [inn[b][0], yt, inn[b][1]], [inn[c][0], yt, inn[c][1]], TILE);
    }
    // the windows: small and dark, in rows below the eaves, on the outer faces near the road (not where another part stands against the wall)
    for (let k = 0; k < n; k++) {
      const [x0, z0] = pts[k], [x1, z1] = pts[(k + 1) % n], len = Math.hypot(x1 - x0, z1 - z0); if (len < 3.5) continue;
      const ex = (x1 - x0) / len, ez = (z1 - z0) / len, ox = -ez, oz = ex, mxp = (x0 + x1) / 2, mzp = (z0 + z1) / 2;
      if (vrDist(mxp, mzp) > 70 || all.some(q => q !== part && inPoly(mxp + ox * 1.2, mzp + oz * 1.2, q[3]))) continue;
      const step = wk === 0 ? 5.5 : 3.4, m = Math.floor(len / step), ang = Math.atan2(ez, ex), ww = wk === 0 ? 0.45 : 0.9, wh = wk === 0 ? 1.1 : 1.35;
      for (let q = 0; q < m; q++) {
        const u = (q + 0.5) * len / m, x = x0 + ex * u + ox * 0.04, z = z0 + ez * u + oz * 0.04, gy = caGround(x, z);
        for (let r = 0, y = eave - 2.3; r < (wk === 0 ? 3 : 4) && y > gy + 1.6; r++, y -= 3.2) { API.box(g, x, y, z, ww, wh, 0.1, ang, WIN); st.windows++; }
      }
    }
    st.parts++;
  }

  /* ---- the landmark, after the rest of the road is built: the castle, one mesh in its chunk ---- */
  LOOK.extra = function ({ scen, out }) {
    const st = { parts: 0, windows: 0, base: 0 }, ys = [];
    for (const p of CASTLE) for (let k = 0; k < p[3].length; k += 2) ys.push(caGround(p[3][k], p[3][k + 1]));
    ys.sort((a, b) => a - b); const base = ys[Math.floor(ys.length / 2)];
    const g = scen.get((BOX[0] + BOX[2]) / 2, (BOX[1] + BOX[3]) / 2);
    for (const p of CASTLE) castlePart(g, p, CASTLE, base, st);
    st.base = Math.round(base * 10) / 10;
    out.vaduz = st;   // (what was built: the tests)
  };

  World.ext.vaduz = (scene, tex, opts) => { API.TEX = tex; return API.buildPrelaz(scene, tex, opts, LOOK); };
})();
