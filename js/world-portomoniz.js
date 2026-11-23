/* =========================================================================
   WORLD — Porto Moniz, Portugal (docs/proge/portomoniz.md): the regional road ER101 from Santa down the north slope of Madeira to the town by
   the sea, built by the shared world of the mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its own (PL_LOOK.portomoniz) and
   its own landmarks (L.pre, L.extra): the Atlantic (one sheet of water at the sea's level with the surf along the black lava of the shore, the
   model's sea floor dug down under it; the far view's ocean in its blue), the islet with its lighthouse off the point, the white houses under
   their orange tiles (OpenStreetMap's footprints, in place of the shared builder's huts), the terraces' dry-stone walls along the slope, the
   vines in their windbreaks of dry heather on the lower slopes, the eucalyptus and laurel of the woods (instead of the shared builder's
   spruce), the palms of the town, the agapanthus along the verges, the two viewpoints, the wayside shrine and the fountain with the statue in
   the roundabout at the line. Places from OpenStreetMap (ODbL 1.0); all generic: no names, letters or signs
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { Chunks, GB, IChunks, TAU, box, caGround, caSlope, clamp, cyl, gable, ico, lerp, rng, rpHash, sstep, vary, vrDist, vrLC, vrNear } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ---- the look: Madeira's north coast in summer: the green of the terraces and the woods, the dark basalt of the cliffs and the scree, the
     orange tile roofs; Portugal's road markings (white, the centre line dashed 4 m / 10 m) and signs (the red chevrons, the warning triangles) ---- */
  const LOOK = API.PL_LOOK.portomoniz = {
    seed: 5310, board: 'PORTO MONIZ', sub: 'MADEIRA', banner: ['SANTA · PORTO MONIZ', '465 M → 29 M · 8 CURVAS'],
    grass: [0.33, 0.46, 0.21], grassDry: [0.49, 0.49, 0.3], grassLush: [0.26, 0.44, 0.17], shrub: [0.15, 0.26, 0.12],
    rock: [0.35, 0.33, 0.31], rockWarm: [0.45, 0.37, 0.31], lichen: [0.42, 0.43, 0.36], scree: [0.4, 0.37, 0.33],
    sat: 0.5, satV: 1.15, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.34, 0.33, 0.31], [0.4, 0.37, 0.34], [0.29, 0.28, 0.27], [0.46, 0.41, 0.36], [0.37, 0.33, 0.3], [0.31, 0.3, 0.29]],   // (the basalt: dark grey, a little brown, the red-brown of the tuff)
    centre: [0.95, 0.95, 0.92], dash: [4, 10], solidNear: 70,
    chev: ['#d8261c', '#ffffff'], warn: 'tri', rail: 'steel', shoulder: [0.5, 0.49, 0.47],
    fans: [[0.86, 0.1, 0.1], [0.12, 0.42, 0.2], [0.95, 0.95, 0.95], [0.98, 0.82, 0.14], [0.14, 0.32, 0.62], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.55, 0.62, 0.7]],
    cars: [[0.9, 0.9, 0.88], [0.72, 0.73, 0.74], [0.12, 0.12, 0.14], [0.16, 0.2, 0.32], [0.6, 0.12, 0.1], [0.42, 0.43, 0.45]],
    roofs: [[0.72, 0.36, 0.2], [0.66, 0.31, 0.18], [0.78, 0.43, 0.25], [0.6, 0.28, 0.17]],
    sheep: 0, portal: 0,
    // (the far slopes: the woods of laurel, eucalyptus and pine up to ~1,250 m, the heath of the plateau above them, the basalt on the steep
    // faces; the sea: wet, the far land's water, the Atlantic's deep blue where the shared far view takes a look's own (irFar))
    far: { lo: [0.3, 0.42, 0.2], hi: [0.36, 0.34, 0.3], dw: [0.36, 0.36, 0.24], snow: 9000, tree: [1350, 1150], fc: [0.13, 0.24, 0.11], dwb: [1200, 1350, 1900, 1750], rk: [1750, 1900], wet: [0.2, 0.35, 0.52] },
  };

  /* ---- the places of the landmarks (OpenStreetMap, game metres: x east, z south from the start line) ---- */
  const VIEW1 = [524, -407], SHRINE = [482, -426], VIEW2 = [322, -508];   // (the viewpoint above the town and the wayside shrine by it, the viewpoint over the coast lower down)
  const ROUND = [1043, -810], LIGHT = [1362, -1231];   // (the roundabout at the line, its fountain and statue; the lighthouse on the islet off the point)
  const PALMS = [[1001, -797], [985, -790], [1060, -792], [1072, -805], [1018, -828], [1090, -836], [962, -772], [1110, -850]];   // (the town's palms round the line)
  const marks = [];   // (the build under way: [what, x, z, the road's heading, the side, the road's index])
  let HOUSES = [], LC0 = null;   // (OpenStreetMap's buildings, taken from the shared builder; the land cover as the data has it, before L.pre's changes)
  const SCRUB = 0.5;   // (the scrub's cells where the noise is below this: the pasture's grass)

  // a place by the road beyond its barrier: the map's point, moved out along the road's normal when it lies within the road's room (o: metres
  // beyond the barrier); [x, z, the road's heading there, the side, the road's index]
  function besideRoad(x0, z0, o) {
    const n = vrNear(x0, z0); let x = x0, z = z0; if (n.i < 0) return [x, z, 0, 1, -1];
    const i = n.i, sd = n.lat >= 0 ? 1 : -1, bar = sd > 0 ? T.br[i] : T.bl[i];
    if (Math.abs(n.lat) < bar + o) { const to = sd * (bar + o); x += T.nx[i] * (to - n.lat); z += T.nz[i] * (to - n.lat); }
    return [x, z, T.hd[i], sd, i];
  }

  /* ---- before the terrain: the sea floor dug down under the water, the land cover's forest left to this file's own trees, the natural pools
     at the shore left to the sea, the shared builder's huts taken over (the white houses: L.extra), the landmarks' level plots and room ---- */
  LOOK.pre = function ({ P, exclPush, blds }) {
    marks.length = 0; HOUSES = blds.splice(0, blds.length);
    const seaY = -P.D.base;
    for (let k = 0; k < P.dem.length; k++) if (P.dem[k] < seaY + 1.2) P.dem[k] = seaY - 8;   // (the model's sea at 0 m: the floor ~8 m under the water)
    // (the land cover for the shared builder: the forest a class it plants nothing on (5: its lakes are def.lakes', not the cover's), this file's
    // eucalyptus and laurel there over the satellite's colour; the scrub in patches, about half of it the pasture's grass (fewer of the shared
    // builder's mats: the phone's load); no snow (the surf, a pale cliff): the rock)
    const lc = P.lc, L = P.L; LC0 = Uint8Array.from(lc);
    for (let j = 0; j < L.nz; j++) for (let i = 0; i < L.nx; i++) { const k = j * L.nx + i, c = lc[k];
      if (c === 1) lc[k] = 5; else if (c === 6) lc[k] = 4;
      else if (c === 2 && P.n5(L.x0 + (i + 0.5) * L.cell, L.z0 + (j + 0.5) * L.cell) < SCRUB) lc[k] = 0; }
    for (let k = P.lakes.length - 1; k >= 0; k--) if (P.lakes[k].h < seaY + 12) P.lakes.splice(k, 1);   // (the pools in the lava: the sea's)
    const pad = (x, z, i, r) => { const p = { x, z, r, b: 8, h: T.hy[i] - 0.25 }; P.pads.push(p); exclPush(x, z, r + 2); };
    { const [x, z, hd, sd, i] = besideRoad(VIEW1[0], VIEW1[1], 4.5); if (i >= 0) { pad(x, z, i, 6); marks.push(['view', x, z, hd, sd, i]); } }
    { const [x, z, hd, sd, i] = besideRoad(SHRINE[0], SHRINE[1], 1.2); marks.push(['shrine', x, z, hd, sd, i]); exclPush(x, z, 1.8); }
    { const [x, z, hd, sd, i] = besideRoad(VIEW2[0], VIEW2[1], 4.0); if (i >= 0) { pad(x, z, i, 5); marks.push(['view', x, z, hd, sd, i]); } }
    { const [x, z, hd, sd, i] = besideRoad(ROUND[0], ROUND[1], 5.0); if (i >= 0) { pad(x, z, i, 5); marks.push(['round', x, z, hd, sd, i]); } }
    marks.push(['light', LIGHT[0], LIGHT[1], 0, 1, -1]); exclPush(LIGHT[0], LIGHT[1], 7);
    for (const [x0, z0] of PALMS) { const [x, z, hd, sd, i] = besideRoad(x0, z0, 1.5); marks.push(['palm', x, z, hd, sd, i]); exclPush(x, z, 1.6); }
  };

  /* ---- the plants and the lighthouse's islet in the soft look of the game's trees (Drevesa A, docs/drevesa-a.md: AB, aPuff, aTrunk); unit
     height 1, the instances scale and tint them ---- */
  function eucGeo() {   // the eucalyptus: a tall pale trunk, bare to half its height, under a loose crown of grey-green clumps (~110 faces)
    const b = new API.AB(), R = rng(5317), col = [0.3, 0.39, 0.28];
    API.aTrunk(b, 0, -0.02, 0, 0.022, 0.74, 5, [0.68, 0.64, 0.57]);
    for (const [x, y, z, r, sy] of [[0, 0.88, 0, 0.17, 0.75], [0.13, 0.74, 0.06, 0.15, 0.8], [-0.12, 0.7, -0.07, 0.15, 0.8], [0.04, 0.62, -0.13, 0.13, 0.85], [-0.05, 0.58, 0.13, 0.12, 0.85]])
      API.aPuff(b, x, y, z, r, sy, vary(col, R, 0.08), R, 0.35, 0.55, 1.15);
    return b.geometry();
  }
  function laurelGeo() {   // the laurel and the til of the old woods, the fruit trees by the houses: a short trunk under a dense round crown (~100 faces)
    const b = new API.AB(), R = rng(5319), col = [0.12, 0.24, 0.1];
    API.aTrunk(b, 0, -0.02, 0, 0.035, 0.42, 5, [0.36, 0.3, 0.24]);
    for (const [x, y, z, r, sy] of [[0, 0.66, 0, 0.36, 0.72], [0.24, 0.52, 0.1, 0.27, 0.72], [-0.22, 0.54, -0.12, 0.28, 0.72], [0.05, 0.5, -0.25, 0.25, 0.75]])
      API.aPuff(b, x, y, z, r, sy, vary(col, R, 0.1), R, 0.3, 0.55, 1.12);
    return b.geometry();
  }
  function palmGeo() {   // a Canary palm: a stout ringed trunk, a crown of long fronds arching out and down (both faces), a few dead ones hanging below
    const g = new GB(), tr = [0.48, 0.42, 0.34], fr = [0.2, 0.36, 0.14], dead = [0.55, 0.47, 0.3];
    cyl(g, 0, 0, 0, 0.05, 0.86, 7, tr, tr, 0.042);
    for (let k = 0; k < 11; k++) {
      const a = k / 11 * TAU + (k % 2) * 0.2, ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca, d = k % 3 === 2, c = d ? dead : fr;
      const pts = d ? [[0.02, 0.84], [0.1, 0.7], [0.13, 0.52]] : [[0.02, 0.86], [0.2, 0.96], [0.36, 0.92], [0.47, 0.78]];
      for (let q = 0; q + 1 < pts.length; q++) {
        const [r0, y0] = pts[q], [r1, y1] = pts[q + 1], w0 = 0.07 * (1 - q / pts.length), w1 = 0.07 * (1 - (q + 1) / pts.length) + 0.005;
        const A = [ca * r0 - px * w0, y0, sa * r0 - pz * w0], B = [ca * r0 + px * w0, y0, sa * r0 + pz * w0], C = [ca * r1 + px * w1, y1, sa * r1 + pz * w1], D = [ca * r1 - px * w1, y1, sa * r1 - pz * w1];
        const mid = [(r0 + r1) / 2 * ca, (y0 + y1) / 2, (r0 + r1) / 2 * sa];
        g.quadO(A, B, C, D, c, [mid[0], mid[1] - 1, mid[2]]); g.quadO(A, D, C, B, c, [mid[0], mid[1] + 1, mid[2]]);
      }
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function agaGeo() {   // an agapanthus: a fountain of strap leaves, three stalks with their round heads of blue flowers (36 faces)
    const g = new GB(), R = rng(5323), lf = [0.2, 0.36, 0.13], fl = [0.4, 0.45, 0.88], st = [0.28, 0.42, 0.18];
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, ca = Math.cos(a), sa = Math.sin(a), px = -sa * 0.05, pz = ca * 0.05;
      const A = [-px, 0, -pz], B = [px, 0, pz], C = [ca * 0.42, 0.34, sa * 0.42], c = vary(lf, R, 0.1); g.triO(A, B, C, c, [0, 1, 0]); g.triO(A, C, B, c, [0, -1, 0]); }
    for (const [x, z, h] of [[0.05, 0.02, 0.92], [-0.08, 0.06, 0.8], [0.03, -0.09, 0.86]]) {
      const A = [x - 0.02, 0, z], B = [x + 0.02, 0, z], C = [x, h, z]; g.triO(A, B, C, st, [x, h / 2, z + 1]); g.triO(A, C, B, st, [x, h / 2, z - 1]);   // (the stalk: a thin blade, both sides)
      const c = vary(fl, R, 0.08), top = [x, h + 0.13, z], bot = [x, h - 0.06, z], ring = [0, 1, 2].map(q => { const a = q / 3 * TAU + x * 9; return [x + Math.cos(a) * 0.11, h + 0.04, z + Math.sin(a) * 0.11]; });
      for (let q = 0; q < 3; q++) { const a = ring[q], b = ring[(q + 1) % 3], m = [x, h + 0.04, z]; g.triO(a, b, top, c, m); g.triO(a, b, bot, c, m); }   // (the head: a little double pyramid)
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  /* ---- the landmarks, the houses, the terraces, the plants and the sea, after the rest of the road is built ---- */
  LOOK.extra = function ({ scen, root, out, P, excluded, matV }) {
    const RL = rng(LOOK.seed + 71), G = (x, z) => caGround(x, z), seaY = -P.D.base, dens = Math.min(1, LOD.dens != null ? LOD.dens : 1), sFin = T.finishS;
    const st = { houses: 0, windows: 0, walls: 0, corrals: 0, eucalyptus: 0, laurels: 0, palms: 0, agapanthus: 0, views: 0, shrines: 0, rounds: 0, lights: 0, sea: 0, surf: 0, farSea: 0 };
    const white = [0.93, 0.92, 0.88], basalt = [0.3, 0.29, 0.28], stoneP = [0.62, 0.6, 0.56];
    const lcAt = (x, z) => { const L = P.L, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell); return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? 0 : LC0[j * L.nx + i]; };
    const tp = new IChunks(palmGeo(), matV, 160);
    for (const [what, x, z, hd, sd, i] of marks) {
      const g = scen.get(x, z), y = G(x, z), c = Math.cos(hd), s = Math.sin(hd), nx = -s * sd, nz = c * sd;   // (nx, nz: the way from the road out to it)
      if (what === 'view') {   // a viewpoint: a paved terrace beside the road, a low whitewashed parapet with a basalt coping on its outer edge, two benches
        const yy = T.hy[i] - 0.25;
        for (let k = -3; k <= 3; k++) { const u = k * 1.6, px = x + c * u + nx * 4.4, pz = z + s * u + nz * 4.4;
          box(g, px, Math.min(yy, G(px, pz)) - 0.6, pz, 1.7, yy - Math.min(yy, G(px, pz)) + 1.5, 0.4, hd, white, basalt); }
        for (const u of [-2.6, 2.6]) { const bx = x + c * u + nx * 2.6, bz = z + s * u + nz * 2.6;
          box(g, bx, yy, bz, 1.7, 0.45, 0.45, hd, [0.5, 0.36, 0.22]); box(g, bx + nx * 0.22, yy + 0.45, bz + nz * 0.22, 1.7, 0.45, 0.07, hd, [0.5, 0.36, 0.22]); }
        st.views++;
      } else if (what === 'shrine') {   // a wayside shrine: a small whitewashed pillar with a niche under a little tiled roof
        box(g, x, y - 0.3, z, 0.8, 1.9, 0.6, hd, white);
        box(g, x - nx * 0.28, y + 0.95, z - nz * 0.28, 0.42, 0.5, 0.06, hd, [0.14, 0.16, 0.22]);
        gable(g, x, y + 1.6, z, 1.0, 0.8, 0.3, hd, LOOK.roofs[0], white);
        st.shrines++;
      } else if (what === 'round') {   // the roundabout at the line: a round island with a basalt kerb, a fountain's basin and on a plinth a bronze figure (a shape only)
        cyl(g, x, y - 0.3, z, 4.4, 0.55, 20, [0.86, 0.86, 0.84], [0.32, 0.46, 0.2]);
        cyl(g, x, y + 0.2, z, 2.7, 0.55, 16, stoneP, [0.2, 0.42, 0.5], 2.7);
        cyl(g, x, y + 0.2, z, 0.6, 1.5, 8, stoneP, stoneP);
        cyl(g, x, y + 1.7, z, 0.26, 1.1, 7, [0.33, 0.27, 0.18], [0.33, 0.27, 0.18], 0.2);
        ico(g, x, y + 2.95, z, 0.2, 1.1, [0.33, 0.27, 0.18], RL, 0.05);
        st.rounds++;
      } else if (what === 'light') {   // the lighthouse on the islet: a white tower, a gallery, the lantern under a red cap
        const yb = Math.max(y, seaY + 4);
        cyl(g, x, yb - 1, z, 2.0, 10.5, 10, [0.94, 0.94, 0.92], null, 1.6);
        cyl(g, x, yb + 9.5, z, 2.0, 0.35, 10, [0.3, 0.3, 0.32], [0.3, 0.3, 0.32]);
        cyl(g, x, yb + 9.85, z, 1.1, 1.4, 10, [0.62, 0.7, 0.66], null, 1.1);
        cyl(g, x, yb + 11.25, z, 1.3, 0.9, 10, [0.72, 0.12, 0.1], [0.72, 0.12, 0.1], 0.15);
        st.lights++;
      } else if (what === 'palm') { const r = RL(); tp.add(x, y - 0.1, z, r * TAU, 7 + r * 3, 9 + r * 5, [0.92 + r * 0.16, 0.95, 0.9]); st.palms++; continue; }
      out.marks[what] = (out.marks[what] || 0) + 1;
    }
    out.marks.palm = st.palms;
    tp.addTo(root, true);

    // the houses (OpenStreetMap's footprints): white walls on a basalt plinth down the slope, orange tiles (the big blocks of the town: a flat
    // roof), the shutters on the long sides of those near the road
    {
      const RB = rng(LOOK.seed + 21), WALL = [[0.94, 0.93, 0.89], [0.96, 0.94, 0.87], [0.91, 0.91, 0.89], [0.95, 0.91, 0.82], [0.93, 0.86, 0.72], [0.9, 0.92, 0.9]];
      const shut = [[0.14, 0.3, 0.2], [0.16, 0.22, 0.3], [0.42, 0.24, 0.14], [0.13, 0.15, 0.17]];
      for (const b of HOUSES) {
        const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang), d = vrDist(b.x, b.z); let lo = 1e9, hi = -1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const yq = G(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, yq); hi = Math.max(hi, yq); }
        if (lo < seaY + 0.6) continue;   // (none in the water)
        const area = b.L * b.W, fl = b.h > 0 ? clamp(Math.round(b.h / 3), 1, 5) : area > 160 ? 2 + (RB() < 0.4 ? 1 : 0) : area > 55 && RB() < 0.45 ? 2 : 1, H = fl * 3.0;
        const wc = vary(WALL[Math.floor(RB() * WALL.length)], RB, 0.03), flat = b.L > 22 || area > 320;
        box(g, b.x, lo - 0.6, b.z, b.L + 0.1, hi - lo + 1.05, b.W + 0.1, b.ang, basalt, null, true);
        box(g, b.x, hi + 0.45, b.z, b.L, H - 0.45, b.W, b.ang, wc, null, true);
        if (flat) box(g, b.x, hi + H, b.z, b.L + 0.3, 0.35, b.W + 0.3, b.ang, [0.82, 0.81, 0.78], [0.62, 0.6, 0.57], true);
        else gable(g, b.x, hi + H, b.z, b.L + 0.7, b.W + 0.7, Math.min(b.W, 11) * 0.3, b.ang, vary(LOOK.roofs[Math.floor(RB() * LOOK.roofs.length)], RB, 0.06), wc);
        if (d < 110) { const n = Math.max(1, Math.min(3, Math.floor(b.L / 3.4))), sc = shut[Math.floor(RB() * shut.length)];
          for (let f = 0; f < Math.min(fl, 3); f++) for (const sd of [-1, 1]) for (let q = 0; q < n; q++) { const u = (q - (n - 1) / 2) * b.L / n, v = sd * (b.W / 2 + 0.03);
            box(g, b.x + c * u - s * v, hi + 1.0 + f * 3.0, b.z + s * u + c * v, 0.95, 1.25, 0.07, b.ang, sc, null, true); st.windows++; } }
        st.houses++;
      }
    }

    // the terraces: dry-stone walls of dark basalt along the contours where the fields and the scrub step down the slope, from the road out to
    // ~34 m. On a 4 m grid round the road: in each cell the nearest of the terraces' levels (every 2.3 m of height) where it crosses the cell, a
    // wall through it along the contour, so the walls of the neighbouring cells join into the terrace's line; its face down the slope, its top
    // flush with the terrace above, its foot a little in the ground (the shared builder's walls between the hairpins' legs left alone)
    {
      const RW = rng(LOOK.seed + 31), maxW = Math.round(2600 * dens), lvl = 2.3, C4 = 4, seen = new Set();
      for (let s = T.startS - 120; s < Math.min(T.len - 4, sFin + 180) && st.walls < maxW; s += C4) {
        const i = T.idx(s);
        for (const side of [-1, 1]) {
          const bar = side > 0 ? T.br[i] : T.bl[i];
          for (let o = bar + 4; o < bar + 34 && st.walls < maxW; o += C4) {
            const ci = Math.floor((T.px[i] + T.nx[i] * side * o) / C4), cj = Math.floor((T.pz[i] + T.nz[i] * side * o) / C4), key = ci + ',' + cj;
            if (seen.has(key)) continue; seen.add(key);
            const xc = (ci + 0.5) * C4, zc = (cj + 0.5) * C4, yc = G(xc, zc), sl = caSlope(xc, zc);
            if (sl < 0.25 || sl > 1.0 || yc < seaY + 15) continue;
            const gx = G(xc + 1, zc) - G(xc - 1, zc), gz = G(xc, zc + 1) - G(xc, zc - 1), gl = Math.hypot(gx, gz); if (gl < 0.1) continue;
            const ux = gx / gl, uz = gz / gl, t = (Math.round((yc - seaY) / lvl) * lvl + seaY - yc) / (gl / 2);   // (t: metres up the slope to the level)
            if (Math.abs(t) > C4 / 2) continue;
            const x = xc + ux * t, z = zc + uz * t, c = lcAt(x, z), n = vrNear(x, z);
            if (!(c === 0 || c === 3 || (c === 2 && RW() < 0.6)) || n.i < 0 || n.dd < 3 || excluded(x, z) || RW() > 0.85) continue;
            const yUp = G(x + ux * 0.9, z + uz * 0.9), y0 = G(x - ux * 0.9, z - uz * 0.9) - 0.45, q = RW();
            box(scen.get(x, z), x + ux * -0.3, y0, z + uz * -0.3, 4.7, Math.max(0.7, yUp + 0.12 - y0), 0.55, Math.atan2(-ux, uz), vary([0.34 + q * 0.06, 0.32 + q * 0.05, 0.29 + q * 0.04], RW, 0.04), [0.36, 0.43, 0.25], true); st.walls++;
          }
        }
      }
    }

    // the vines on the lower slopes: small plots in windbreaks of dry heather (brushwood fences, brown), the vines in rows on low trellises inside
    {
      const RV = rng(LOOK.seed + 41), heath = [0.47, 0.36, 0.23], vine = [0.25, 0.41, 0.14], maxC = Math.round(110 * dens);
      for (let s = T.startS + 1900; s < Math.min(T.len - 4, sFin - 150) && st.corrals < maxC; s += 9) {
        const i = T.idx(s);
        for (const side of [-1, 1]) {
          if (RV() > 0.42) continue;
          const bar = side > 0 ? T.br[i] : T.bl[i], o = bar + 7 + RV() * 26, x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o, y = G(x, z);
          const c = lcAt(x, z), n = vrNear(x, z); if (!(c === 0 || c === 2 || c === 3) || n.i < 0 || n.dd < 4 || excluded(x, z)) continue;
          if (y > seaY + 240 || caSlope(x, z) > 0.6) continue;
          const Lp = 7 + RV() * 4, Wp = 4.5 + RV() * 2, hd = T.hd[i] + (RV() - 0.5) * 0.2, cc = Math.cos(hd), ss = Math.sin(hd), g = scen.get(x, z), hc = vary(heath, RV, 0.08);
          let ok = true; for (const [u, v] of [[-Lp / 2, -Wp / 2], [Lp / 2, -Wp / 2], [Lp / 2, Wp / 2], [-Lp / 2, Wp / 2]]) { const qx = x + cc * u - ss * v, qz = z + ss * u + cc * v, m = vrNear(qx, qz); if ((m.i >= 0 && m.dd < 3) || excluded(qx, qz)) ok = false; }
          if (!ok) continue;
          const at = (u, v) => [x + cc * u - ss * v, z + ss * u + cc * v];
          for (const v of [-Wp / 2, Wp / 2]) { const [qx, qz] = at(0, v); box(g, qx, G(qx, qz) - 0.3, qz, Lp, 1.75, 0.22, hd, hc, null, true); }
          for (const u of [-Lp / 2, Lp / 2]) { const [qx, qz] = at(u, 0); box(g, qx, G(qx, qz) - 0.3, qz, 0.22, 1.75, Wp, hd, hc, null, true); }
          for (let r = 0; r < 2; r++) { const v = (r - 0.5) * Wp * 0.45, [qx, qz] = at(0, v); box(g, qx, G(qx, qz) + 0.15, qz, Lp - 1.2, 0.75, 0.75, hd, vary(vine, RV, 0.08), null, true); }
          st.corrals++;
        }
      }
    }

    // the trees (instanced per 160 m chunk): eucalyptus and laurel where the data has the woods, a few laurels and fruit trees among the fields
    // and the houses; none on the rock, the steepest slopes, by the road or in the landmarks' room
    {
      const te = new IChunks(eucGeo(), matV, 160), tl = new IChunks(laurelGeo(), matV, 160), RT = rng(LOOK.seed + 61), SP = 6.5 / Math.sqrt(dens), G0 = P.G, Lt = API.VRC * API.VRT, maxT = Math.round(9000 * dens);
      grid: for (let tj = 0; tj < G0.ntz; tj++) for (let ti = 0; ti < G0.ntx; ti++) {
        if (!G0.on[tj * G0.ntx + ti]) continue;
        const xa = G0.x0 + ti * Lt, za = G0.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(230)) continue;
          const c = lcAt(x, z), p = c === 1 ? 0.6 : c === 3 ? 0.07 : c === 0 || c === 2 ? 0.035 : 0;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 3.2) continue;
          if (excluded(x, z) || caSlope(x, z) > 1.0) continue;
          const y = G(x, z); if (y < seaY + 2) continue;
          if (c === 1 && r2 < 0.55) { const h = 16 + r3 * 12; te.add(x, y - 0.2, z, r1 * 40, h * (0.42 + r2 * 0.2), h, [0.9 + r3 * 0.2, 0.94 + r2 * 0.12, 0.92 + r1 * 0.1]); st.eucalyptus++; }
          else { const h = c === 1 ? 9 + r3 * 7 : 5 + r3 * 4; tl.add(x, y - 0.2, z, r1 * 40, h * (0.8 + r2 * 0.25), h, [0.88 + r3 * 0.24, 0.92 + r2 * 0.16, 0.88 + r1 * 0.14]); st.laurels++; }
          if (st.eucalyptus + st.laurels >= maxT) break grid;
        }
      }
      te.addTo(root, true); tl.addTo(root, true);
    }

    // the agapanthus along the verges (Madeira's roadside flower): clumps on both sides beyond the barrier, now and then a run of them
    {
      const ta = new IChunks(agaGeo(), matV, 160), RA = rng(LOOK.seed + 81), sp = 3.4 / Math.sqrt(dens);
      for (let s = Math.max(6, T.startS - 100); s < Math.min(T.len - 6, sFin + 180); s += sp) {
        const i = T.idx(s);
        for (const side of [-1, 1]) {
          if (RA() > 0.5 + 0.4 * Math.sin(s * 0.013 + side)) continue;
          const o = (side > 0 ? T.br[i] : T.bl[i]) + 0.9 + RA() * 2.2, x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          const n = vrNear(x, z); if (n.i >= 0 && Math.abs(n.i - i) * T.ds > 12) continue;
          if (excluded(x, z) || caSlope(x, z) > 1.1) continue;
          const r = RA(), w = r < 0.18 ? [1.5, 1.5, 1.3] : [0.92 + r * 0.16, 0.95, 0.95 + r * 0.1];   // (one in six white)
          ta.add(x, G(x, z) - 0.05, z, r * TAU, 0.9 + r * 0.5, 0.8 + r * 0.4, w); st.agapanthus++;
        }
      }
      ta.addTo(root, false);
    }

    // the sea: one sheet of water at the sea's level (0 m) wherever the ground is under it, out to ~1.1 km from the road (8 m cells along the
    // shore near the road, 24 m farther out, 72 m out to sea): the turquoise over the lava near the shore, the Atlantic's deep blue farther out;
    // the surf: a white band along the water line within ~450 m of the road (as Chapman's Peak's), in the water's own moving picture
    {
      const D = P.D, F = T.def.farDem, fb = atob(F.b64), fH = new Float32Array(F.nx * F.nz);
      for (let k = 0; k < fH.length; k++) fH[k] = F.lo + (fb.charCodeAt(2 * k) * 256 + fb.charCodeAt(2 * k + 1)) / 2;
      const bil = (a, nx, nz, x0, z0, cs, x, z) => { const gx = clamp((x - x0) / cs, 0, nx - 1.001), gz = clamp((z - z0) / cs, 0, nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
        return (a[j * nx + i] * (1 - u) + a[j * nx + i + 1] * u) * (1 - v) + (a[(j + 1) * nx + i] * (1 - u) + a[(j + 1) * nx + i + 1] * u) * v; };
      const inD = (x, z) => x > D.x0 && z > D.z0 && x < D.x0 + (D.nx - 1) * D.cell && z < D.z0 + (D.nz - 1) * D.cell;
      const ground = (x, z) => vrDist(x, z) < 500 ? G(x, z) : inD(x, z) ? bil(P.dem, D.nx, D.nz, D.x0, D.z0, D.cell, x, z) : bil(fH, F.nx, F.nz, F.x0, F.z0, F.cell, x, z) - D.base - 3;
      const wet = (x, z) => ground(x, z) < seaY + 0.25;
      const deep = [0.05, 0.2, 0.34], shal = [0.13, 0.36, 0.42], sky = [0.46, 0.6, 0.72], cc = new Map();
      const wc = (x, z) => { const key = Math.round(x) + ',' + Math.round(z); let c = cc.get(key); if (c) return c;
        const dp = seaY - ground(x, z), ks = 0.25 * sstep(0.55, 0.85, P.n2(x * 0.6, z * 0.6)); c = [0, 1, 2].map(k => lerp(lerp(shal[k], deep[k], sstep(1.5, 8.5, dp)), sky[k], ks)); cc.set(key, c); return c; };
      const uv = (x, z) => [x / 14, -z / 14];
      const sea = new Chunks(900, true), wMat = new THREE.MeshPhongMaterial({ map: tex0(out), vertexColors: true, shininess: 70, specular: 0x2a3a44 });
      const quad = (x0, z0, cs) => { const A = [x0, seaY, z0], B = [x0 + cs, seaY, z0], C = [x0 + cs, seaY, z0 + cs], E = [x0, seaY, z0 + cs];
        sea.get(x0, z0).quadUp(A, B, C, E, [wc(A[0], A[2]), wc(B[0], B[2]), wc(C[0], C[2]), wc(E[0], E[2])], [uv(x0, z0), uv(x0 + cs, z0), uv(x0 + cs, z0 + cs), uv(x0, z0 + cs)]); st.sea++; };
      const X0 = Math.floor((P.bx0 - 1100) / 72) * 72, X1 = P.bx1 + 1100, Z0 = Math.floor((P.bz0 - 1100) / 72) * 72, Z1 = P.bz1 + 400;
      for (let z0 = Z0; z0 < Z1; z0 += 72) for (let x0 = X0; x0 < X1; x0 += 72) {
        const d = vrDist(x0 + 36, z0 + 36); if (d > 1150) continue;
        let n = 0; for (const [a, b] of [[0, 0], [72, 0], [0, 72], [72, 72], [36, 36]]) if (wet(x0 + a, z0 + b)) n++;
        if (n === 5 && d > 560) { quad(x0, z0, 72); continue; }
        for (let zb = z0; zb < z0 + 72; zb += 24) for (let xb = x0; xb < x0 + 72; xb += 24) {
          let m = 0; for (const [a, b] of [[0, 0], [24, 0], [0, 24], [24, 24], [12, 12]]) if (wet(xb + a, zb + b)) m++;
          if (!m) continue;
          if (m === 5 || vrDist(xb + 12, zb + 12) > 450) { quad(xb, zb, 24); continue; }
          for (let zc = zb; zc < zb + 24; zc += 8) for (let xc = xb; xc < xb + 24; xc += 8) if (wet(xc, zc) || wet(xc + 8, zc) || wet(xc, zc + 8) || wet(xc + 8, zc + 8) || wet(xc + 4, zc + 4)) quad(xc, zc, 8);
        }
      }
      sea.addTo(root, wMat, false, true); out.sea = seaY;
      const fc = new Chunks(900, true), fm = new THREE.MeshBasicMaterial({ map: tex0(out), vertexColors: true, transparent: true, depthWrite: false }), cs = 4, Fw = (al) => [0.97, 0.99, 1, al];
      const wet2 = (a, b) => G(a, b) < seaY + 0.15;
      for (let z0 = Math.floor((P.bz0 - 460) / cs) * cs; z0 < P.bz1 + 200; z0 += cs) for (let x0 = Math.floor((P.bx0 - 460) / cs) * cs; x0 < P.bx1 + 460; x0 += cs) {
        if (vrDist(x0, z0) > 450) { x0 += 28; continue; }
        const n = (wet2(x0, z0) ? 1 : 0) + (wet2(x0 + cs, z0) ? 1 : 0) + (wet2(x0, z0 + cs) ? 1 : 0) + (wet2(x0 + cs, z0 + cs) ? 1 : 0);
        let al = n > 0 && n < 4 ? 0.85 : 0;
        if (!al && n === 4) { const m = (wet2(x0 - cs, z0) ? 1 : 0) + (wet2(x0 + 2 * cs, z0) ? 1 : 0) + (wet2(x0, z0 - cs) ? 1 : 0) + (wet2(x0, z0 + 2 * cs) ? 1 : 0); if (m < 4) al = 0.4; }
        if (!al) continue;
        const y = seaY + 0.06, q = 0.6 * rpHash(Math.round(x0), Math.round(z0)), A = [x0, y, z0], B = [x0 + cs, y, z0], C = [x0 + cs, y, z0 + cs], E = [x0, y, z0 + cs], c = Fw(al * (0.7 + q));
        const gq = fc.get(x0, z0); gq.A = true; gq.quadUp(A, B, C, E, [c, c, c, c], [uv(x0 * 3, z0 * 3), uv((x0 + cs) * 3, z0 * 3), uv((x0 + cs) * 3, (z0 + cs) * 3), uv(x0 * 3, (z0 + cs) * 3)]); st.surf++;
      }
      fc.addTo(root, fm, false, false);
    }

    // the far view's water (the Atlantic from the shore out to the edge of its grid, irFar) in the ocean's own blue instead of the grey-green of
    // the cirques' tarns the shared far view paints every wet node, once, at the first update (irFar is built after this)
    {
      const WET = new Float32Array([0.18, 0.27, 0.3]), to = LOOK.far.wet, prev = out.dyn.ext;
      let done = false;
      out.dyn.ext = (t, car, cam) => {
        if (prev) prev(t, car, cam);
        if (done || !out.dyn.irFar) return; done = true;
        const a = out.dyn.irFar.mesh.geometry.attributes.color, c = a.array; let n = 0;
        for (let k = 0; k < c.length; k += 3) if (c[k] === WET[0] && c[k + 1] === WET[1] && c[k + 2] === WET[2]) { c[k] = to[0]; c[k + 1] = to[1]; c[k + 2] = to[2]; n++; }
        if (n) a.needsUpdate = true; st.farSea = n;
      };
    }
    out.portomoniz = st;   // (what was built: the tests)
  };
  // (the water's moving picture: the shared builder's, World.update scrolls it: out.dyn.water)
  function tex0(out) { return out.dyn.water || (out.dyn.water = API.TEX && API.TEX.water); }

  World.ext.portomoniz = (scene, tex, opts) => { API.TEX = tex; return API.buildPrelaz(scene, tex, opts, LOOK); };
})();
