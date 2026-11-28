/* =========================================================================
   WORLD — Bâlea, Romania (docs/proge/balea.md, docs/proge/balea-raziskava.md): the top of the Transfăgărășan from the hairpins of the Bâlea
   valley up the cirque to Bâlea Lake, built by the shared world of the mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its
   own (PL_LOOK.balea) and its own roadside: the last stunted spruces low in the valley and above them the dwarf pine's mats, the juniper and
   the alpine rose on the pasture; the buildings at the lake (OpenStreetMap's footprints, kind and levels) each as what it is: the cable
   car's top station (a concrete base, the glazed hall, the cable's mouth), the motel of the 1970s (storeys of plaster on a schist plinth),
   the single-storey hotel, the mountain rescue's house, the weather station (WMO 15279, 2070 m: its hut, the fenced instrument plot with the
   louvred screen, the mast and the rain gauge), the huts (a schist ground floor, timber over it, steep tin roofs), the stalls (timber
   frames under tarps), the open shelter; the snow fences on the slope over the valley (OpenStreetMap's barrier=fence, fence_type=snow), the
   two masts above the lake, the metal cross by the lake, the barrier of the side road, the picnic tables. Positions from OpenStreetMap
   (ODbL); the styles general knowledge of the place (the assumptions: docs/proge/balea-raziskava.md); all generic: no names, letters or signs
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { box, gable, cyl, caGround, rng, vary, vrDist, vrNear } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ---- the look (as it was in js/world-prelaz.js's PL_LOOK until this file) ---- */
  // Bâlea (the Făgăraș Mountains, Romania): the glacial valley of the Bâlea under the cirque, green alpine pasture on the slopes with mats of
  // dwarf pine and juniper, grey-brown crystalline schist in crags, slabs and scree under the walls, snow lying on into the summer in the shady
  // gullies high up; the lake in the cirque with the huts and the stalls by it, the cable car up the valley, the tunnel's portal at the end
  const LOOK = API.PL_LOOK.balea = {
    seed: 4100, board: 'LACUL BÂLEA', sub: 'FĂGĂRAȘ', banner: ['TRANSFĂGĂRĂȘAN', '6 SERPENTINE · LACUL BÂLEA'],
    grass: [0.4, 0.5, 0.24], grassDry: [0.55, 0.55, 0.32], grassLush: [0.33, 0.48, 0.2], shrub: [0.17, 0.27, 0.14],
    rock: [0.5, 0.48, 0.45], rockWarm: [0.56, 0.5, 0.44], lichen: [0.34, 0.34, 0.3], scree: [0.62, 0.6, 0.56],
    sat: 0.5, satV: 1.35, snowLine: 2120, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.47, 0.47, 0.46], [0.53, 0.52, 0.5], [0.41, 0.41, 0.41], [0.57, 0.56, 0.54], [0.46, 0.44, 0.42], [0.44, 0.45, 0.42]],   // (the schist: grey, a little brown, lichened)
    centre: [0.95, 0.95, 0.92], dash: [3, 6], solidNear: 70,   // (white centre line: dashed 3 m / 6 m, solid through the hairpins)
    // edgeL: the left edge line's colour when it is not white (a divided road's median edge: yellow in the Emirates; Jebel Hafeet)
    chev: ['#d8261c', '#ffffff'], warn: 'tri', rail: 'steel', shoulder: [0.5, 0.51, 0.49],
    fans: [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.12, 0.24, 0.62], [0.98, 0.82, 0.12], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.12, 0.14, 0.2], [0.55, 0.62, 0.7]],
    cars: [[0.85, 0.85, 0.83], [0.62, 0.12, 0.1], [0.14, 0.26, 0.5], [0.16, 0.16, 0.18], [0.5, 0.52, 0.55], [0.72, 0.7, 0.66]],
    roofs: [[0.32, 0.18, 0.12], [0.26, 0.27, 0.28], [0.44, 0.2, 0.14], [0.2, 0.24, 0.22]],
    sheep: 1, portal: 1, far: { lo: [0.36, 0.44, 0.26], hi: [0.5, 0.49, 0.45], dw: [0.18, 0.26, 0.16], snow: 2250 },
  };

  /* ---- the roadside from OpenStreetMap (game metres: x east, z south from the start line) ---- */
  // the buildings that are something of their own (their footprint's centre; the rest huts, stalls and the motels' annexes by kind)
  const SPEC = [[153.7, 656.1, 'station'], [15.1, 791.8, 'motel'], [281.2, 642.0, 'motel'], [300.5, 737.7, 'motel'], [220.5, 617.5, 'hotel'],
    [-37.8, 664.0, 'rescue'], [2.1, 748.0, 'meteo'], [-27.5, 937.9, 'shelter']];
  // the snow fences on the slope over the valley (barrier=fence, fence_type=snow)
  const SNOW = [[[-616.2, 181.2], [-617.1, 194.0]], [[-595.1, 180.0], [-597.6, 196.2]], [[-575.8, 178.5], [-578.2, 199.6]], [[-549.3, 231.9], [-536.5, 245.0], [-527.5, 270.7]],
    [[-562.7, 179.6], [-558.9, 203.3]], [[-543.6, 178.1], [-539.9, 188.7], [-542.4, 205.2], [-538.0, 221.3], [-528.8, 231.9], [-520.8, 246.1]],
    [[-527.7, 158.9], [-523.1, 209.2], [-510.6, 231.5]], [[-495.3, 229.8], [-498.6, 215.2], [-513.3, 181.7], [-515.4, 159.7]], [[-375.2, 117.2], [-353.0, 158.5]],
    [[-386.6, 119.5], [-368.1, 160.0]], [[-405.1, 115.7], [-404.7, 131.2], [-397.0, 161.2], [-382.3, 187.1]], [[-388.0, 217.3], [-400.1, 207.9], [-425.2, 156.0], [-427.7, 136.2], [-425.0, 115.1]],
    [[-436.3, 169.5], [-428.8, 207.5], [-421.9, 219.8], [-405.3, 228.8]], [[-437.3, 124.5], [-440.9, 138.9], [-438.6, 153.3]], [[-453.2, 205.8], [-462.9, 179.6], [-470.4, 148.1]],
    [[-439.2, 248.4], [-449.3, 236.5], [-453.5, 222.5]], [[-454.5, 256.5], [-467.5, 241.5], [-489.0, 190.2], [-493.8, 155.2]]];
  const METEO = [3.7, 707.6], MASTS = [[77.6, 713.2], [87.9, 712.8]], CROSS = [-64.2, 723.2], GATE = [-38.3, 827.9], TABLES = [[372.5, 679.6], [-126.6, 906.3], [-152.3, 919.3]];

  let PP = null, st = null, own = [];

  /* ---- before the terrain: out of the shared builder's buildings the ones drawn here (all of them); the room of the small things ---- */
  LOOK.pre = ({ P, exclPush, blds }) => {
    PP = P; own = blds.splice(0, blds.length);
    exclPush(METEO[0], METEO[1], 7); exclPush(CROSS[0], CROSS[1], 2); exclPush(GATE[0], GATE[1], 3);
    for (const [x, z] of MASTS) exclPush(x, z, 4);
    for (const [x, z] of TABLES) exclPush(x, z, 3);
    st = { spruce: 0, mugo: 0, juniper: 0, rose: 0, huts: 0, stalls: 0, big: 0, station: 0, meteo: 0, fencePosts: 0, masts: 0, tables: 0 };
  };

  /* ---- the trees: the shared kinds only (no draw calls of their own). Low in the valley, below ~1780-1820 m, the last spruces, stunted
     (the forest's edge is below the track's start); above them the dwarf pine (Pinus mugo) in wide low mats; the shrubs juniper and, a
     few, the alpine rose (Rhododendron myrtifolium) in a redder green. No random draws of its own: the shared draws (r2-r4) ---- */
  LOOK.tree = (x, z, c, sp, hgt, wid, col, r2, r3, r4) => {
    const alt = caGround(x, z) + PP.D.base;
    if (sp === 0) {
      if (alt < 1780 + 40 * r2) { st.spruce++; const k = 0.5 + r4 * 0.25; return [0, hgt * k, wid * k, col]; }
      st.mugo++; return [1, 1.1 + r4 * 1.3, 3.4 + r2 * 3.6, [0.84 + r3 * 0.12, 0.92 + r4 * 0.1, 0.82 + r2 * 0.08]];
    }
    if (sp === 1) { st.mugo++; return [1, hgt * (alt > 2000 ? 0.7 : 1), wid * 1.15, col]; }
    if (sp === 2) {
      if (r4 < 0.18) { st.rose++; return [2, hgt * 0.8, wid, [1.04, 0.88 + r2 * 0.06, 0.86]]; }
      st.juniper++; return [2, hgt, wid, [0.86 + r3 * 0.1, 0.94, 0.9 + r2 * 0.1]];
    }
    return [sp, hgt, wid, col];
  };

  /* ---- the buildings' materials: schist, plaster, timber, galvanised and painted tin; no very dark colours ---- */
  const SCHIST = [0.52, 0.5, 0.47], CONC = [0.66, 0.65, 0.62], GLASS = [0.3, 0.37, 0.44], FRAME = [0.6, 0.62, 0.64], WIN = [0.28, 0.33, 0.38];
  const PLASTER = [[0.9, 0.87, 0.8], [0.86, 0.84, 0.78], [0.92, 0.9, 0.86], [0.84, 0.8, 0.7]];
  const TIMBER = [[0.5, 0.36, 0.24], [0.56, 0.42, 0.28], [0.44, 0.33, 0.24], [0.6, 0.5, 0.38]];
  const TIN = [[0.6, 0.62, 0.64], [0.55, 0.25, 0.17], [0.32, 0.45, 0.34], [0.48, 0.49, 0.5], [0.5, 0.3, 0.22]];
  const TARP = [[0.8, 0.2, 0.16], [0.2, 0.4, 0.7], [0.9, 0.9, 0.88], [0.26, 0.52, 0.34], [0.92, 0.7, 0.2]];
  const WOODG = [0.58, 0.54, 0.48];   // (weathered timber: the snow fences, the tables)

  // a row of windows along a wall (u from -L/2 to L/2 at v, the face out at side sd), at y
  function windows(g, at, ang, L, v, y, h, w, step, col) {
    const n = Math.max(1, Math.floor(L / step));
    for (let k = 0; k < n; k++) { const [x, z] = at((k + 0.5) / n * L - L / 2, v); box(g, x, y, z, w, h, 0.08, ang, col, null, true); }
  }

  LOOK.extra = ({ scen, out }) => {
    const RL = rng(LOOK.seed + 71), G = (x, z) => caGround(x, z);
    for (const b of own) {
      const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang), at = (u, v) => [b.x + c * u - s * v, b.z + s * u + c * v];
      let lo = 1e9, hi = -1e9; for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const [x, z] = at(u, v), y = G(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const det = vrDist(b.x, b.z) < 260, sp = SPEC.find(q => Math.hypot(q[0] - b.x, q[1] - b.z) < 6), what = sp ? sp[2] : b.kind === 1 ? 'stall' : b.kind === 2 && b.L * b.W > 120 ? 'annex' : 'hut';
      const y0 = hi + 0.2, tin = vary(TIN[Math.floor(RL() * TIN.length)], RL, 0.05), L = b.L, W = b.W, wl = Math.min(L, W);
      if (what === 'stall') {   // a stall: four timber posts, the counter, a tarp over a ridge pole (open at the front)
        const tim = vary(TIMBER[Math.floor(RL() * TIMBER.length)], RL, 0.05), tarp = vary(TARP[Math.floor(RL() * TARP.length)], RL, 0.05), H = 2.2;
        for (const u of [-L / 2 + 0.1, L / 2 - 0.1]) for (const v of [-W / 2 + 0.1, W / 2 - 0.1]) { const [x, z] = at(u, v), yg = G(x, z); box(g, x, yg - 0.2, z, 0.12, y0 + H - yg + 0.2, 0.12, b.ang, tim, null, true); }
        box(g, b.x, lo - 0.2, b.z, L, y0 - lo + 1.0, W, b.ang, tim, [0.66, 0.56, 0.42], true);   // (the counter and the goods' table)
        gable(g, b.x, y0 + H, b.z, L + 0.4, W + 0.6, Math.max(0.6, W * 0.3), b.ang, tarp, tarp);
        st.stalls++; continue;
      }
      if (what === 'shelter') {   // the open shelter (a roof on posts)
        const tim = TIMBER[1], n = Math.max(2, Math.round(L / 4) + 1);
        for (let k = 0; k < n; k++) for (const v of [-W / 2 + 0.2, W / 2 - 0.2]) { const [x, z] = at(-L / 2 + 0.2 + k * (L - 0.4) / (n - 1), v), yg = G(x, z); box(g, x, yg - 0.2, z, 0.2, y0 + 2.6 - yg + 0.2, 0.2, b.ang, tim, null, true); }
        gable(g, b.x, y0 + 2.6, b.z, L + 0.6, W + 0.8, W * 0.3, b.ang, tin, tim); st.huts++; continue;
      }
      // the plinth: schist (concrete under the station), down to the lowest corner
      box(g, b.x, lo - 0.5, b.z, L, y0 - lo + 0.5 + (what === 'station' ? 3.0 : 0.6), W, b.ang, what === 'station' ? CONC : SCHIST, null, true);
      let yT = y0 + (what === 'station' ? 3.0 : 0.6);
      if (what === 'station') {   // the glazed hall over the base, its frame bands, the flat roof with its eaves, the cable's mouth at both ends
        box(g, b.x, yT, b.z, L - 0.6, 5.0, W - 0.6, b.ang, GLASS, null, true);
        if (det) for (let k = 1; k < 4; k++) { const n = Math.max(2, Math.round(L / 3)); for (let q = 0; q <= n; q++) for (const v of [-(W - 0.6) / 2 - 0.05, (W - 0.6) / 2 + 0.05]) { const [x, z] = at(-(L - 0.6) / 2 + q * (L - 0.6) / n, v); if (k === 1) box(g, x, yT, z, 0.18, 5.0, 0.12, b.ang, FRAME, null, true); } }
        box(g, b.x, yT + 5.0, b.z, L + 1.2, 0.5, W + 1.2, b.ang, FRAME);
        for (const su of [-1, 1]) { const [x, z] = at(su * (L / 2 - 0.25), 0); box(g, x, yT + 0.8, z, 0.12, 3.6, Math.min(8, W * 0.4), b.ang, WIN, null, true); }
        st.station++; continue;
      }
      if (what === 'motel' || what === 'annex' || what === 'rescue' || what === 'hotel') {   // storeys of plaster (the hotel one storey, timber clad), window bands, a low tin roof
        const nS = what === 'hotel' ? 1 : what === 'rescue' ? 2 : what === 'annex' ? 2 : 3, H = 2.9 * nS, wall = what === 'hotel' ? vary(TIMBER[3], RL, 0.04) : vary(PLASTER[Math.floor(RL() * PLASTER.length)], RL, 0.03);
        box(g, b.x, yT, b.z, L, H, W, b.ang, wall, null, true);
        if (det) for (let k = 0; k < nS; k++) { const yy = yT + 0.9 + k * 2.9, wh = what === 'hotel' ? 1.6 : 1.3;
          for (const v of [-W / 2 - 0.04, W / 2 + 0.04]) windows(g, at, b.ang, L - 1, v, yy, wh, what === 'hotel' ? 2.4 : 1.2, what === 'hotel' ? 3.2 : 2.6, WIN);
          if (what === 'rescue' && k === 0) { const [x, z] = at(0, W / 2 + 0.05); box(g, x, yT, z, 3.0, 2.8, 0.1, b.ang, [0.62, 0.6, 0.58], null, true); } }   // (the rescue's garage door)
        if (what !== 'hotel') box(g, b.x, yT + H - 0.35, b.z, L + 0.1, 0.35, W + 0.1, b.ang, vary(TIMBER[0], RL, 0.04), null, true);   // (the eaves' timber band)
        gable(g, b.x, yT + H, b.z, L + 1.0, W + 1.2, Math.min(wl, 14) * 0.22, b.ang, tin, wall);
        st.big++; continue;
      }
      if (what === 'meteo') {   // the weather station's house: white, one storey, a flat roof
        box(g, b.x, yT, b.z, L, 2.8, W, b.ang, [0.92, 0.92, 0.9], [0.62, 0.62, 0.62], true);
        if (det) for (const v of [-W / 2 - 0.04, W / 2 + 0.04]) windows(g, at, b.ang, L - 1, v, yT + 0.9, 1.2, 1.1, 2.6, WIN);
        st.meteo++; continue;
      }
      // a hut: a schist ground floor, timber over it, a steep tin roof (the snow), windows on the long sides
      const tim = vary(TIMBER[Math.floor(RL() * TIMBER.length)], RL, 0.05), two = wl > 6 && RL() < 0.6;
      if (two) { box(g, b.x, yT, b.z, L, 2.5, W, b.ang, vary(SCHIST, RL, 0.04), null, true); }
      const yU = yT + (two ? 2.5 : 0); box(g, b.x, yU, b.z, L, 2.5, W, b.ang, tim, null, true);
      if (det) for (const v of [-W / 2 - 0.04, W / 2 + 0.04]) windows(g, at, b.ang, L - 0.6, v, yU + 0.8, 1.0, 0.9, 2.8, WIN);
      gable(g, b.x, yU + 2.5, b.z, L + 0.8, W + 0.9, Math.min(wl, 10) * 0.45, b.ang, tin, tim);
      st.huts++;
    }

    // the weather station's instrument plot (WMO 15279): a low fence round a square, the louvred screen on its legs, the rain gauge, the mast
    { const [mx, mz] = METEO, g = scen.get(mx, mz), y = G(mx, mz), a = 0.6, ca = Math.cos(a), sa = Math.sin(a), at = (u, v) => [mx + ca * u - sa * v, mz + sa * u + ca * v], R = 5, WH = [0.94, 0.94, 0.92];
      for (let k = 0; k < 4; k++) { const u0 = [-R, R, R, -R][k], v0 = [-R, -R, R, R][k], u1 = [R, R, -R, -R][k], v1 = [-R, R, R, -R][k];
        for (let q = 0; q < 4; q++) { const [x, z] = at(u0 + (u1 - u0) * q / 4, v0 + (v1 - v0) * q / 4); box(g, x, G(x, z) - 0.1, z, 0.1, 1.4, 0.1, a, WH, null, true); }
        const [x, z] = at((u0 + u1) / 2, (v0 + v1) / 2); box(g, x, y + 1.1, z, k % 2 ? 0.05 : 2 * R, 0.08, k % 2 ? 2 * R : 0.05, a, WH, null, true); }
      { const [x, z] = at(-1.5, 0); for (const [du, dv] of [[-0.4, -0.3], [0.4, -0.3], [0.4, 0.3], [-0.4, 0.3]]) { const [px, pz] = at(-1.5 + du, dv); box(g, px, y, pz, 0.08, 1.2, 0.08, a, WH, null, true); }
        box(g, x, y + 1.2, z, 1.0, 0.8, 0.8, a, WH); gable(g, x, y + 2.0, z, 1.2, 1.0, 0.2, a, WH, WH); }
      { const [x, z] = at(2, -2); cyl(g, x, y, z, 0.12, 1.1, 6, [0.7, 0.72, 0.74], [0.4, 0.42, 0.44]); }
      { const [x, z] = at(2, 2.5); cyl(g, x, y, z, 0.07, 10, 5, [0.74, 0.74, 0.72]); box(g, x, y + 9.6, z, 1.4, 0.06, 0.06, a, [0.74, 0.74, 0.72]); cyl(g, x, y + 9.7, z, 0.1, 0.25, 6, [0.8, 0.8, 0.8]); }
      st.meteo++; }

    // the two masts above the lake: steel lattice (in the far view a tapered three-sided shaft), a platform, two dishes (their height ~18 m: an assumption)
    for (const [x, z] of MASTS) { const g = scen.get(x, z), y = G(x, z), ST = [0.72, 0.72, 0.7];
      cyl(g, x, y - 0.3, z, 0.9, 18.3, 3, ST, ST, 0.25); box(g, x, y + 14, z, 1.6, 0.12, 1.6, 0, ST);
      for (const [dx, dz, r] of [[0.5, 0, 0], [0, 0.5, 1.6]]) { const yy = y + 15.2; box(g, x + dx, yy, z + dz, 0.12, 0.9, 0.9, r, [0.88, 0.88, 0.86]); }
      st.masts++; }

    // the metal cross by the lake (generic; no name), the side road's barrier (red and white), the picnic tables (benches on both sides)
    { const [x, z] = CROSS, g = scen.get(x, z), y = G(x, z), M = [0.62, 0.62, 0.64]; box(g, x, y - 0.2, z, 0.14, 3.2, 0.14, 0.3, M); box(g, x, y + 2.2, z, 1.4, 0.14, 0.14, 0.3, M); }
    { const [x, z] = GATE, g = scen.get(x, z), y = G(x, z), n = vrNear(x, z), ang = n.i >= 0 ? T.hd[n.i] : 0, c = Math.cos(ang), s = Math.sin(ang);
      box(g, x, y - 0.1, z, 0.25, 1.2, 0.25, ang, [0.66, 0.66, 0.66]);
      for (let k = 0; k < 6; k++) { const u = 0.4 + k * 0.6; box(g, x + c * u, y + 0.95, z + s * u, 0.6, 0.12, 0.12, ang, k % 2 ? [0.95, 0.95, 0.93] : [0.82, 0.16, 0.14], null, true); } }
    for (const [x, z] of TABLES) { const g = scen.get(x, z), y = G(x, z), a = (x * 0.13 + z * 0.07) % 3;
      box(g, x, y + 0.72, z, 1.8, 0.06, 0.8, a, WOODG); box(g, x, y - 0.1, z, 0.12, 0.82, 0.6, a, [0.5, 0.46, 0.4], null, true);
      for (const v of [-0.7, 0.7]) box(g, x - Math.sin(a) * v, y + 0.42, z + Math.cos(a) * v, 1.8, 0.05, 0.28, a, WOODG);
      st.tables++; }

    // the snow fences: timber posts every ~2.5 m, three boards between them (both faces), on the ground; far off (beyond ~650 m) left out
    for (const way of SNOW) {
      if (Math.min(...way.map(([x, z]) => vrDist(x, z))) > 650) continue;
      for (let k = 0; k + 1 < way.length; k++) { const [ax, az] = way[k], [bx, bz] = way[k + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 2.5)), ang = Math.atan2(bz - az, bx - ax);
        const nx = -Math.sin(ang) * 0.6, nz = Math.cos(ang) * 0.6;
        for (let q = 0; q <= n; q++) { const t = q / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = G(x, z), g = scen.get(x, z);
          if (q < n || k + 2 === way.length) { box(g, x, y - 0.3, z, 0.14, 2.6, 0.14, ang, [0.5, 0.46, 0.4], null, true); st.fencePosts++; }
          if (q === n) continue;
          const x1 = ax + (bx - ax) * (q + 1) / n, z1 = az + (bz - az) * (q + 1) / n, y1 = G(x1, z1);
          for (const h of [0.7, 1.3, 1.9]) { const A = [x, y + h, z], B = [x1, y1 + h, z1], C = [x1, y1 + h + 0.32, z1], D = [x, y + h + 0.32, z];
            const m = [(x + x1) / 2, (y + y1) / 2 + h, (z + z1) / 2]; g.quadO(A, B, C, D, WOODG, [m[0] + nx, m[1], m[2] + nz]); g.quadO(A, B, C, D, [0.52, 0.48, 0.43], [m[0] - nx, m[1], m[2] - nz]); } } } }
    out.balea = st;   // (what was planted and built: the tests)
  };

  World.keep('caBank', 'balea');   // (the walls' terrain kept between its builds, as the passes' in js/world-prelaz.js)
  World.ext.balea = (scene, tex, opts) => API.buildPrelaz(scene, tex, opts, LOOK);
})();
