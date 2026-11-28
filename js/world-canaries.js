/* =========================================================================
   WORLD — Canaries, Saint Lucia (docs/proge/canaries.md, docs/proge/canaries-raziskava.md): the west coast road north from the village of
   Canaries past Anse La Verdue over the forested ridge, built by the shared world of the mountain passes (js/world-prelaz.js, buildPrelaz)
   with a look of its own (PL_LOOK.canaries) and its own trees and houses: the lowland rainforest of the Caribbean's volcanic islands in
   place of the shared builder's broadleaf (tall trees with pale trunks under layered umbrella crowns, a few emergents over the canopy),
   the coconut palms along the shore and on the low slopes above the bay, the banana plots by the houses; the houses of the village
   (OpenStreetMap's footprints, kind and size) as the island's: timber and block walls painted in bright colours, on concrete piers where
   the slope falls away, a veranda along the side towards the road, louvred shutters, hipped roofs of corrugated tin (red oxide, green,
   blue, galvanised, some rusting); the bay's fishing boats pulled up on the beach (OpenStreetMap's natural=beach). The sea from the
   track's def.sea (the shared sea plane). The species, the houses' style and the boats general knowledge of the island (the assumptions:
   docs/proge/canaries-raziskava.md); all generic: no names, letters or signs
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { TAU, box, caGround, rng, vary, vrDist, vrNear } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ---- the look (as it was in js/world-prelaz.js's PL_LOOK until this file): the green of the wet season's forest on the slopes, the dry
     grass by the road, the warm grey of the volcanic rock; Saint Lucia's road markings (white, the centre line dashed 3 m / 9 m), black and
     white chevrons, warning triangles, steel barriers ---- */
  const LOOK = API.PL_LOOK.canaries = {
    seed: 5600, board: 'CANARIES', sub: 'SAINT LUCIA', banner: ['CANARIES', 'ANSE LA VERDUE'], trop: 1,
    grass: [0.32, 0.5, 0.17], grassDry: [0.5, 0.52, 0.26], grassLush: [0.24, 0.47, 0.14], shrub: [0.13, 0.3, 0.1],
    rock: [0.48, 0.44, 0.4], rockWarm: [0.58, 0.44, 0.34], lichen: [0.36, 0.36, 0.3], scree: [0.6, 0.48, 0.38],
    sat: 0.58, satV: 1.3, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.5, 0.47, 0.44], [0.56, 0.52, 0.48], [0.42, 0.4, 0.38], [0.6, 0.48, 0.38], [0.46, 0.44, 0.41], [0.53, 0.5, 0.46]],
    centre: [0.95, 0.95, 0.92], dash: [3, 9], solidNear: 70,
    chev: ['#1c1c1c', '#f4f4f0'], warn: 'tri', rail: 'steel', shoulder: [0.55, 0.47, 0.38],
    fans: [[0.98, 0.84, 0.12], [0.12, 0.3, 0.7], [0.95, 0.95, 0.95], [0.84, 0.14, 0.14], [0.2, 0.55, 0.32], [0.95, 0.5, 0.14], [0.12, 0.14, 0.2], [0.4, 0.75, 0.85]],
    cars: [[0.92, 0.92, 0.9], [0.62, 0.12, 0.1], [0.14, 0.26, 0.5], [0.16, 0.16, 0.18], [0.55, 0.57, 0.6], [0.2, 0.42, 0.3]],
    roofs: [[0.62, 0.22, 0.16], [0.5, 0.52, 0.54], [0.2, 0.38, 0.5], [0.3, 0.46, 0.28]],
    sheep: 0, portal: 0,
    far: { lo: [0.15, 0.3, 0.12], hi: [0.36, 0.42, 0.28], dw: [0.11, 0.24, 0.09], snow: 9000 }
  };

  /* ---- the beach of the bay at Canaries (OpenStreetMap natural=beach; game metres: x east, z south from the start line) ---- */
  const BEACH = [[-95.0, -184.9], [-119.3, -121.9], [-189.3, -52.4], [-258.1, -4.0], [-326.3, 42.7], [-365.3, 53.0], [-378.9, 31.2], [-366.1, 32.7], [-353.7, 33.2],
    [-335.4, 25.8], [-316.3, 16.3], [-291.5, -1.4], [-226.8, -47.5], [-225.4, -48.6], [-223.7, -49.9], [-179.4, -86.5], [-150.7, -115.3]];
  function inPoly(R, x, z) { let inside = false;
    for (let i = 0, j = R.length - 1; i < R.length; j = i++) { const xi = R[i][0], zi = R[i][1], xj = R[j][0], zj = R[j][1];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside; }
    return inside; }

  /* ---- the trees in the soft look of the game's trees (Drevesa A, docs/drevesa-a.md: AB, aPuff, aTrunk); unit height 1, the instances
     scale them (wid across, hgt up) and tint them ---- */
  function tube(b, a, e, ra, rb, n, col) {   // a slim tube from a to b (n sides, 2n vertices), darker at a: a palm's trunk, a limb, a banana's stem
    const dx = e[0] - a[0], dy = e[1] - a[1], dz = e[2] - a[2], l = Math.hypot(dx, dy, dz) || 1, ux = dx / l, uy = dy / l, uz = dz / l;
    let px = -uz, pz = ux, pl = Math.hypot(px, pz); if (pl < 1e-6) { px = 1; pz = 0; pl = 1; } px /= pl; pz /= pl;
    const py = 0, qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px, lo = [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], bot = [], top = [];
    for (let k = 0; k < n; k++) {
      const an = k / n * TAU + 0.3, c = Math.cos(an), s = Math.sin(an), nx = px * c + qx * s, ny = py * c + qy * s, nz = pz * c + qz * s;
      bot.push(b.v(a[0] + nx * ra, a[1] + ny * ra, a[2] + nz * ra, nx, ny, nz, lo)); top.push(b.v(e[0] + nx * rb, e[1] + ny * rb, e[2] + nz * rb, nx, ny, nz, col));
    }
    const i1 = [a[0] + dx / 3, a[1] + dy / 3, a[2] + dz / 3], i2 = [a[0] + dx * 2 / 3, a[1] + dy * 2 / 3, a[2] + dz * 2 / 3];
    for (let k = 0; k < n; k++) { const j = (k + 1) % n; b.t(bot[k], bot[j], top[j], i1); b.t(bot[k], top[j], top[k], i2); }
  }
  // a frond or a leaf (both its faces, lit from above): from its base along a, rising, then drooping to its tip (as Ella's)
  function frond(b, cx, cy, cz, a, L, lift, droop, wd, col, tip) {
    const ux = Math.cos(a), uz = Math.sin(a), px = -uz * wd, pz = ux * wd, mx = cx + ux * L * 0.5, mz = cz + uz * L * 0.5, my = cy + lift, k = Math.hypot(0.25, 0.8);
    const i0 = b.v(cx, cy, cz, ux * 0.25 / k, 0.8 / k, uz * 0.25 / k, col), i1 = b.v(mx + px, my - wd * 0.3, mz + pz, 0, 1, 0, col), i2 = b.v(mx - px, my - wd * 0.3, mz - pz, 0, 1, 0, col);
    const i3 = b.v(cx + ux * L, cy + lift - droop, cz + uz * L, ux * 0.3, 0.95, uz * 0.3, tip), above = [mx, my + 1, mz], below = [mx, my - 1, mz];
    b.t(i0, i1, i3, below); b.t(i0, i3, i2, below); b.t(i0, i1, i3, above); b.t(i0, i3, i2, above);
  }
  function rainGeo() {   // the rainforest's canopy tree (gommier, chatanier, laurier: the pale smooth trunk bare to over half its height, two
    // limbs, a broad flat-topped crown in layers; 78 vertices: lighter than the shared broadleaf's 92)
    const b = new API.AB(), R = rng(5611), col = [0.15, 0.3, 0.11], bark = [0.72, 0.7, 0.64];
    API.aTrunk(b, 0, -0.02, 0, 0.035, 0.52, 5, bark);
    tube(b, [0, 0.42, 0], [0.2, 0.6, 0.06], 0.02, 0.012, 3, bark); tube(b, [0, 0.44, 0], [-0.17, 0.62, -0.1], 0.018, 0.011, 3, bark);
    API.aPuff(b, 0, 0.78, 0, 0.38, 0.4, col, R, 0.25, 0.5, 1.3);
    API.aPuff(b, 0.26, 0.64, 0.1, 0.26, 0.5, vary(col, R, 0.1), R, 0.3, 0.5, 1.25, -0.2);
    API.aPuff(b, -0.24, 0.66, -0.14, 0.26, 0.5, vary(col, R, 0.1), R, 0.3, 0.5, 1.25, -0.2);
    API.aPuff(b, 0.04, 0.6, -0.27, 0.24, 0.5, vary(col, R, 0.1), R, 0.3, 0.5, 1.25, -0.2);
    API.aPuff(b, -0.06, 0.58, 0.26, 0.22, 0.5, vary(col, R, 0.1), R, 0.3, 0.5, 1.25, -0.2);
    return b.geometry();
  }
  function palmGeo() {   // the coconut palm: a slim grey trunk curving away from the wind, the crown of long arching fronds (9), the nuts'
    // dark cluster under them (52 vertices)
    const b = new API.AB(), R = rng(5613), bark = [0.6, 0.55, 0.47];
    const P = [[0, -0.02, 0], [0.025, 0.34, 0], [0.07, 0.66, 0], [0.11, 0.93, 0]];
    for (let k = 0; k < 3; k++) tube(b, P[k], P[k + 1], 0.024 - k * 0.003, 0.021 - k * 0.003, 4, bark);
    API.aPuff(b, 0.11, 0.9, 0, 0.035, 0.9, [0.38, 0.34, 0.12], R, 0.3, 0.7, 1.0);
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + R() * 0.4, L = 0.44 + R() * 0.1;
      frond(b, 0.11, 0.93, 0, a, L, 0.03 + R() * 0.03, 0.12 + R() * 0.06, 0.07, k % 2 ? [0.26, 0.42, 0.14] : [0.33, 0.48, 0.17], [0.52, 0.52, 0.26]); }
    return b.geometry();
  }
  function bananaGeo() {   // a banana stool: three pseudostems of a height and their broad paddle leaves, arching out, the old ones torn
    // and yellowing at the tips (46 vertices)
    const b = new API.AB(), R = rng(5617), stem = [0.42, 0.5, 0.26];
    for (const [x, z, h] of [[0, 0, 0.6], [0.12, 0.08, 0.5], [-0.1, 0.1, 0.42]]) tube(b, [x, -0.02, z], [x * 1.1, h, z * 1.1], 0.05, 0.035, 3, stem);
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.5, h = k < 4 ? 0.6 : 0.48;
      frond(b, 0, h, 0, a, 0.4 + R() * 0.12, 0.22, 0.32, 0.13, k % 3 ? [0.36, 0.58, 0.16] : [0.44, 0.62, 0.2], k % 2 ? [0.62, 0.58, 0.24] : [0.44, 0.56, 0.2]); }
    return b.geometry();
  }

  let PP = null, st = null, own = [], hc = null;
  const HC = 24, hKey = (i, j) => i * 100003 + j;   // (the houses' cells: a banana plot, a palm or a fruit tree near a house)
  const nearHouse = (x, z) => hc.has(hKey(Math.floor(x / HC), Math.floor(z / HC)));

  /* ---- before the terrain: out of the shared builder's buildings the houses drawn here (all of them), their cells ---- */
  LOOK.pre = ({ P, blds }) => {
    PP = P; own = blds.splice(0, blds.length); hc = new Set();
    for (const b of own) { const i0 = Math.floor(b.x / HC), j0 = Math.floor(b.z / HC); for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) hc.add(hKey(i0 + di, j0 + dj)); }
    st = { rain: 0, emergent: 0, fruit: 0, palm: 0, banana: 0, houses: 0, piers: 0, verandas: 0, boats: 0, fern: 0, heli: 0, wild: 0, croton: 0, culverts: 0, shelters: 0 };
  };
  LOOK.treeGeo = () => [rainGeo(), palmGeo(), bananaGeo()];   // (the kinds own, own + 1, own + 2 of LOOK.tree)

  /* ---- the trees: every one of the shared builder's tall trees one of these (its kind left empty: no draw calls of its own), by the height
     above the sea (alt) and the houses near: the palms on the low slopes above the bay (below ~16-26 m), by the houses the banana plots, the
     palms and the fruit trees (breadfruit, mango: the rain tree's shape, lower and rounder); elsewhere the rainforest, its canopy 8-22 m and a
     tree in a dozen an emergent (to ~28 m; the canopy height map's tallest 27 m). Of the shrubs, on the shore a young palm. No random draws of its own: the shared draws (r2-r4) and the world's noise ---- */
  LOOK.tree = (x, z, c, sp, hgt, wid, col, r2, r3, r4, own) => {
    const alt = caGround(x, z) + PP.D.base, nh = nearHouse(x, z), lowC = 16 + 10 * PP.n2(x * 0.02 + 31, z * 0.02 - 17);
    const palm = (h) => { st.palm++; return [own + 1, h, 6.5 + r2 * 3.5, [0.92 + r3 * 0.16, 0.94 + r4 * 0.12, 0.9 + r2 * 0.1]]; };
    const banana = () => { st.banana++; return [own + 2, 3.0 + r4 * 2.6, 3.2 + r2 * 2.2, [0.92 + r2 * 0.16, 0.95 + r4 * 0.1, 0.9]]; };
    if (sp === 0) {
      if (alt < lowC) return palm(10 + r4 * 13);
      if (nh) { const q = r3 / 0.7;
        if (q < (alt < 70 ? 0.34 : 0.4)) return banana();
        if (q < 0.56 && alt < 70) return palm(9 + r4 * 11);   // (the palms by the houses of the bay; up the ridge the breadfruit and the mango)
        st.fruit++; const h = 6 + r4 * 6; return [own, h, h * (1.0 + r2 * 0.25), [0.86 + r2 * 0.2, 0.96 + r4 * 0.12, 0.86 + r3 * 0.1]]; }
      if (r2 > 0.92) { st.emergent++; const h = 22 + r4 * 6; return [own, h, h * (0.78 + (r2 - 0.92) * 2), [0.96 + r4 * 0.1, 0.98 + r3 * 0.08, 0.92]]; }
      st.rain++; const h = 8 + r4 * 14, sh = PP.n2(x * 0.05 - 7, z * 0.05 + 11);   // (the canopy's patches: some greener, some greyer)
      return [own, h, h * (0.72 + r2 * 0.24), [0.86 + sh * 0.2 + r3 * 0.06, 0.9 + r4 * 0.16, 0.84 + (1 - sh) * 0.18]];
    }
    if (sp === 1 && alt < 12 && r4 < 0.2) return palm(4 + r2 * 8);   // (a young palm on the shore; by the houses the tall trees' plots only: each own kind in a chunk a draw call and its shadow's)
    return [sp, hgt, wid, col];
  };

  /* ---- the houses and the boats, after the rest of the pass is built ---- */
  const WALLS = [[0.96, 0.86, 0.46], [0.52, 0.8, 0.76], [0.95, 0.68, 0.62], [0.72, 0.86, 0.52], [0.62, 0.74, 0.92], [0.95, 0.93, 0.86], [0.93, 0.76, 0.52], [0.86, 0.62, 0.78]];
  const SHUT = [[0.16, 0.5, 0.46], [0.6, 0.22, 0.16], [0.95, 0.95, 0.92], [0.2, 0.36, 0.62], [0.46, 0.33, 0.2]];
  const TIN = [[0.64, 0.22, 0.15], [0.22, 0.44, 0.32], [0.66, 0.68, 0.7], [0.2, 0.38, 0.58], [0.64, 0.24, 0.16], [0.6, 0.62, 0.64]], RUST = [0.5, 0.28, 0.16];
  const TRIM = [0.95, 0.95, 0.92], CONC = [0.64, 0.63, 0.6], BLOCK = [0.76, 0.74, 0.7], DOOR = [0.36, 0.26, 0.18], DARK = [0.16, 0.17, 0.18];
  // a hipped roof of corrugated tin (its eaves at cy): the slopes in strips from the eave to the ridge, lighter and darker in turn (the
  // corrugations seen from above), now and then a rusty sheet; far off (det false) the four faces only
  function tinRoof(g, cx, cy, cz, L, D, h, rot, col, R, det) {
    if (L < D) { const t = L; L = D; D = t; rot += Math.PI / 2; }
    const c = Math.cos(rot), s = Math.sin(rot), P = (lx, ly, lz) => [cx + lx * c - lz * s, cy + ly, cz + lx * s + lz * c], r = (L - D) / 2, inn = [cx, cy + h * 0.3, cz];
    const sheet = (cc, k) => { const rs = R() < 0.1, f = k % 2 ? 0.94 : 1.02, b = rs ? [0, 1, 2].map(q => cc[q] * 0.5 + RUST[q] * 0.5) : cc; return [b[0] * f, b[1] * f, b[2] * f]; };
    const far = [col[0] * 0.9, col[1] * 0.9, col[2] * 0.9];
    if (!det) { const b0 = P(-L / 2, 0, -D / 2), b1 = P(L / 2, 0, -D / 2), b2 = P(L / 2, 0, D / 2), b3 = P(-L / 2, 0, D / 2), r0 = P(-r, h, 0), r1 = P(r, h, 0);
      g.quadO(b0, b1, r1, r0, col, inn); g.quadO(b2, b3, r0, r1, far, inn); g.triO(b1, b2, r1, far, inn); g.triO(b3, b0, r0, col, inn); return; }
    for (const [sd, cc] of [[-1, col], [1, far]]) { const n = Math.max(3, Math.round(L / 0.9));
      for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n;
        g.quadO(P(-L / 2 + t0 * L, 0, sd * D / 2), P(-L / 2 + t1 * L, 0, sd * D / 2), P(-r + t1 * 2 * r, h, 0), P(-r + t0 * 2 * r, h, 0), sheet(cc, k), inn); } }
    for (const [su, cc] of [[-1, col], [1, far]]) { const m = Math.max(2, Math.round(D / 0.9)), tip = P(su * r, h, 0);
      for (let k = 0; k < m; k++) g.triO(P(su * L / 2, 0, -D / 2 + k / m * D), P(su * L / 2, 0, -D / 2 + (k + 1) / m * D), tip, sheet(cc, k), inn); }
    box(g, P(0, 0, 0)[0], cy + h - 0.06, P(0, 0, 0)[2], Math.max(0.3, 2 * r + 0.2), 0.12, 0.22, rot, [col[0] * 0.75, col[1] * 0.75, col[2] * 0.75]);   // (the ridge cap)
  }
  // a fishing boat of the bay (a pirogue: a long narrow open hull, pointed bow, square stern), pulled up on the sand, its bow up the beach;
  // the hull in one bright colour, a band of another under the gunwale, the inside dark; front +x along rot
  function boat(g, x, y, z, rot, col, band) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (u, yy, v) => [x + c * u - s * v, y + yy, z + s * u + c * v], inn = [x, y + 0.4, z];
    const G = [P(-2.9, 0.75, -0.66), P(0.5, 0.78, -0.74), P(3.1, 0.95, 0), P(0.5, 0.78, 0.74), P(-2.9, 0.75, 0.66)];   // (the gunwale)
    const M = [P(-2.85, 0.58, -0.62), P(0.5, 0.6, -0.7), P(2.95, 0.8, 0), P(0.5, 0.6, 0.7), P(-2.85, 0.58, 0.62)];   // (the band's foot)
    const K = [P(-2.7, 0.06, -0.34), P(0.5, 0.0, -0.36), P(2.7, 0.3, 0), P(0.5, 0.0, 0.36), P(-2.7, 0.06, 0.34)];   // (the bottom)
    for (let k = 0; k < 4; k++) { g.quadO(G[k], G[k + 1], M[k + 1], M[k], band, inn); g.quadO(M[k], M[k + 1], K[k + 1], K[k], col, inn); }
    g.quadO(G[0], G[4], K[4], K[0], col, inn);   // (the transom)
    const F = [P(-2.75, 0.35, -0.5), P(0.5, 0.35, -0.56), P(2.6, 0.55, 0), P(0.5, 0.35, 0.56), P(-2.75, 0.35, 0.5)], dn = [x, y - 3, z];
    g.quadO(F[0], F[1], F[3], F[4], DARK, dn); g.triO(F[1], F[2], F[3], DARK, dn);   // (the floor inside, seen over the gunwale)
    for (const u of [-1.3, 0.9]) box(g, P(u, 0, 0)[0], y + 0.5, P(u, 0, 0)[2], 0.22, 0.06, 1.3, rot, [0.6, 0.5, 0.36]);   // (the thwarts)
  }

  /* ---- round 2: by the road (docs/proge/canaries-raziskava.md). The ground, the red earth of the cuttings, the grass tufts and the low
     undergrowth are the shared chase packages' (js/world-chase-bt8.js, bt38.js); here the taller plants of the road's edge, 1.5-14 m off
     the asphalt: in the forest tree ferns (Cyathea), heliconias (the red bracts of the wild ones on the wet slopes) and wild bananas; in
     the village and the hamlet the gardens' crotons and hibiscus; the two culverts where OpenStreetMap's streams pass under the road (their
     concrete parapets); a bus shelter at the village and one at the hamlet (an assumption: the island's minibuses stop along the highway,
     OpenStreetMap maps no stops here). Only into the scenery chunks the world already fills (no new draw call), but the two shelters and
     the culverts ---- */
  const hh = (a, b) => { let h = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const FERN = [0.2, 0.38, 0.12], FERN2 = [0.27, 0.44, 0.15], TRUNKF = [0.22, 0.18, 0.14], HELI = [0.2, 0.4, 0.13], BRACT = [0.84, 0.16, 0.1], BRACTY = [0.92, 0.74, 0.16];
  const WILD = [0.3, 0.5, 0.15], WILDS = [0.4, 0.46, 0.24], CROTON = [[0.6, 0.24, 0.12], [0.68, 0.56, 0.14], [0.28, 0.4, 0.12], [0.52, 0.16, 0.18]], HIB = [0.14, 0.3, 0.1];
  const CONC2 = [0.66, 0.64, 0.6], SHELTER = [[0.86, 0.82, 0.62], [0.6, 0.78, 0.82], [0.9, 0.74, 0.6]];
  function leaf(g, A, B, C, D, col) { const m = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2, (A[2] + C[2]) / 2]; g.quadO(A, B, C, D, col, [m[0], m[1] - 1, m[2]]); g.quadO(A, B, C, D, col, [m[0], m[1] + 1, m[2]]); }
  // a crown of n fronds from (x, y, z): each out L, its middle up by lift, its tip down by drop, wd wide
  function crown(g, x, y, z, n, L, lift, drop, wd, c1, c2, a0) {
    for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU, ux = Math.cos(a), uz = Math.sin(a), px = -uz * wd, pz = ux * wd, mx = x + ux * L * 0.5, mz = z + uz * L * 0.5;
      leaf(g, [x, y, z], [mx + px, y + lift, mz + pz], [x + ux * L, y + lift - drop, z + uz * L], [mx - px, y + lift, mz - pz], k % 2 ? c1 : c2); }
  }
  function treeFern(g, x, y, z, h, q) { box(g, x, y - 0.2, z, 0.2, h + 0.2, 0.2, q * 3, TRUNKF); crown(g, x, y + h, z, 7, 1.7 + 0.7 * q, 0.35, 0.75, 0.32, FERN, FERN2, q * 9); st.fern++; }
  function wildBanana(g, x, y, z, h, q) { box(g, x, y - 0.2, z, 0.24, h + 0.2, 0.24, q * 3, WILDS); crown(g, x, y + h, z, 6, 1.9, 0.6, 0.9, 0.42, WILD, vary(WILD, rng(q * 1e4 | 0), 0.08), q * 7); st.wild++; }
  function heliconia(g, x, y, z, q) {   // a clump of upright paddle leaves, two hanging red bracts tipped yellow
    for (let k = 0; k < 5; k++) { const a = q * 11 + k * 1.26, ux = Math.cos(a), uz = Math.sin(a), px = -uz * 0.24, pz = ux * 0.24, hb = 0.7 + 0.25 * k % 0.6, r0 = 0.1, r1 = 0.75;
      leaf(g, [x + ux * r0, y + hb, z + uz * r0], [x + ux * 0.45 + px, y + hb + 0.6, z + uz * 0.45 + pz], [x + ux * r1, y + hb + 1.3, z + uz * r1], [x + ux * 0.45 - px, y + hb + 0.6, z + uz * 0.45 - pz], k % 2 ? HELI : FERN2); }
    for (let k = 0; k < 2; k++) { const a = q * 5 + k * 3.1, bx = x + Math.cos(a) * 0.3, bz = z + Math.sin(a) * 0.3, px = -Math.sin(a) * 0.12, pz = Math.cos(a) * 0.12;
      leaf(g, [bx - px, y + 1.75, bz - pz], [bx + px, y + 1.75, bz + pz], [bx + px * 0.4, y + 1.2, bz + pz * 0.4], [bx - px * 0.4, y + 1.2, bz - pz * 0.4], BRACT);
      leaf(g, [bx - px * 0.4, y + 1.2, bz - pz * 0.4], [bx + px * 0.4, y + 1.2, bz + pz * 0.4], [bx, y + 1.0, bz], [bx, y + 1.0, bz], BRACTY); }
    st.heli++;
  }
  function shrub(g, x, y, z, q) {   // a garden's croton (its leaves red, yellow and green) or a hibiscus with its red flowers: two rosettes of leaves
    const hib = q < 0.4, col = hib ? HIB : CROTON[Math.floor(q * 97) % CROTON.length], col2 = hib ? FERN2 : vary(col, rng(q * 1e4 | 0), 0.14), w = 0.75 + q * 0.4;
    crown(g, x, y + 0.05, z, 7, w, 0.45, -0.35, 0.26, col, col2, q * 9);
    crown(g, x, y + 0.35, z, 5, w * 0.75, 0.45, -0.3, 0.22, col2, col, q * 9 + 0.6);
    if (hib) for (let k = 0; k < 4; k++) { const a = q * 13 + k * 1.6; box(g, x + Math.cos(a) * w * 0.6, y + 0.65 + 0.12 * (k % 2), z + Math.sin(a) * w * 0.6, 0.18, 0.12, 0.18, a, BRACT); }
    st.croton++;
  }
  function roadside(scen, excluded, onSide) {
    if (!onSide || !T || !T.idx) return;
    const G = (x, z) => caGround(x, z), base = PP.D.base;
    const chunk = (x, z) => { const g = scen.map.get(Math.floor(x / scen.size) + ',' + Math.floor(z / scen.size)); return g && !g.empty ? g : null; };
    const inHouse = (x, z, r) => own.some(b => Math.abs(b.x - x) < b.L / 2 + b.W / 2 + r && Math.abs(b.z - z) < b.L / 2 + b.W / 2 + r && Math.hypot(b.x - x, b.z - z) < Math.max(b.L, b.W) / 2 + r);
    const slope = (x, z) => Math.hypot(G(x + 1, z) - G(x - 1, z), G(x, z + 1) - G(x, z - 1)) / 2;
    const village = (s) => s < 330 || (s > 2560 && s < 2860);
    const s0 = T.startS || 0, sF = T.finishS || T.len;
    for (let s = s0 + 25; s < sF - 25; s += 2.9) for (const side of [-1, 1]) {
      const q = hh(Math.round(s * 10), side + 31), q2 = hh(Math.round(s * 7), side + 43), o = 1.6 + q * q * 12.5, [x, z] = onSide(s, side, o);
      if (excluded(x, z)) continue;
      const g = chunk(x, z); if (!g) continue;
      const y = G(x, z); if (y + base < 2.5 || slope(x, z) > 1.1 || inHouse(x, z, 1.2)) continue;
      if (village(s) || nearHouse(x, z)) { if (q2 < 0.34) shrub(g, x, y, z, q); else if (q2 < 0.42 && o > 3) wildBanana(g, x, y, z, 2.2 + q, q); continue; }
      const hi = y + base > 70;
      if (q2 < (hi ? 0.2 : 0.1)) treeFern(g, x, y, z, 2 + 3 * q, q);
      else if (q2 < (hi ? 0.36 : 0.3)) heliconia(g, x, y, z, q);
      else if (q2 < 0.44 && o > 2.5) wildBanana(g, x, y, z, 2.2 + 1.2 * q, q);
    }
    // the culverts: where a stream of OpenStreetMap's (def.streams) passes under the road, a concrete parapet each side behind the edge
    const done = [];
    for (const sm of T.def.streams || []) { const p = sm.p || [];
      for (let j = 0; j + 3 < p.length; j += 2) { const ax = p[j], az = p[j + 1], bx = p[j + 2], bz = p[j + 3], n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 2));
        for (let m = 0; m <= n; m++) { const x = ax + (bx - ax) * m / n, z = az + (bz - az) * m / n, r = vrNear(x, z); if (r.i < 0 || r.d > 4) continue;
          const sc = r.i * T.ds; if (sc < s0 + 40 || sc > sF - 20 || done.some(d => Math.abs(d - sc) < 40)) continue; done.push(sc);
          const i = T.idx(sc), hd = T.hd[i];
          for (const side of [-1, 1]) { const [cx, cz] = onSide(sc, side, 1.15), cy = G(cx, cz); box(scen.get(cx, cz), cx, cy - 0.3, cz, 7, 1.05, 0.32, hd, vary(CONC2, rng(i + side), 0.04));
            for (const e of [-3.6, 3.6]) { const [ex, ez] = [cx + Math.cos(hd) * e, cz + Math.sin(hd) * e]; box(scen.get(ex, ez), ex, G(ex, ez) - 0.3, ez, 0.4, 1.25, 0.4, hd, [0.9, 0.9, 0.88]); } }
          st.culverts++; } } }
    // the bus shelters: on the left of the northbound road (the island drives on the left), on the first level spot near s
    for (const sw of [150, 2720]) for (let d = 0; d < 80; d += 4) {
      const sc = sw + d, [x, z] = onSide(sc, -1, 2.2); if (excluded(x, z) || slope(x, z) > 0.25 || inHouse(x, z, 2)) continue;
      const i = T.idx(sc), hd = T.hd[i], g = scen.get(x, z), y = G(x, z), c = Math.cos(hd), s = Math.sin(hd), nx = -s, nz = c, at = (u, v) => [x + c * u + nx * v, z + s * u + nz * v];
      const wall = SHELTER[st.shelters % SHELTER.length], tin = [0.62, 0.24, 0.17], [bx, bz] = at(0, -1.1);
      box(g, x, y - 0.3, z, 3.4, 0.45, 2.0, hd, CONC);   // (the slab)
      box(g, bx, y, bz, 3.4, 2.3, 0.18, hd, wall, null, true);   // (the back wall, away from the road)
      for (const u of [-1.6, 1.6]) { const [px, pz] = at(u, -0.4); box(g, px, y, pz, 0.16, 2.3, 1.3, hd, wall, null, true); }
      const [kx, kz] = at(0, -0.75); box(g, kx, y + 0.42, kz, 2.8, 0.08, 0.4, hd, [0.55, 0.4, 0.26]);   // (the bench)
      const A = at(-1.9, -1.4), B = at(1.9, -1.4), C2 = at(1.9, 1.0), D = at(-1.9, 1.0);
      g.quadO([A[0], y + 2.45, A[1]], [B[0], y + 2.45, B[1]], [C2[0], y + 2.2, C2[1]], [D[0], y + 2.2, D[1]], tin, [x, y, z]);
      g.quadO([A[0], y + 2.45, A[1]], [B[0], y + 2.45, B[1]], [C2[0], y + 2.2, C2[1]], [D[0], y + 2.2, D[1]], vary(tin, rng(7), 0.1), [x, y + 5, z]);
      st.shelters++; break;
    }
  }

  LOOK.extra = ({ scen, out, excluded, onSide }) => {
    const RL = rng(LOOK.seed + 71), G = (x, z) => caGround(x, z);
    for (const b of own) {
      const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang), at = (u, v) => [b.x + c * u - s * v, b.z + s * u + c * v];
      let lo = 1e9, hi = -1e9; for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const [x, z] = at(u, v), y = G(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const det = vrDist(b.x, b.z) < 260, piers = hi - lo > 0.7, y0 = hi + (piers ? 0.6 : 0.3);
      // the foot: on a slope the concrete piers and the floor's slab over them, on the level a low plinth
      if (piers) { st.piers++;
        const us = b.L > 7 ? [-b.L / 2 + 0.25, 0, b.L / 2 - 0.25] : [-b.L / 2 + 0.25, b.L / 2 - 0.25];
        for (const u of us) for (const v of [-b.W / 2 + 0.25, b.W / 2 - 0.25]) { const [x, z] = at(u, v), yg = G(x, z); box(g, x, yg - 0.3, z, 0.4, y0 - yg + 0.1, 0.4, b.ang, CONC, null, true); }
        box(g, b.x, y0 - 0.25, b.z, b.L, 0.25, b.W, b.ang, CONC);
      } else box(g, b.x, lo - 0.4, b.z, b.L, y0 - lo + 0.4, b.W, b.ang, CONC, null, true);
      const wi = Math.floor(RL() * WALLS.length), wall = vary(WALLS[wi], RL, 0.05), shut = SHUT[(wi + 1 + Math.floor(RL() * (SHUT.length - 1))) % SHUT.length], tin = vary(TIN[Math.floor(RL() * TIN.length)], RL, 0.06);
      if (b.kind === 1) {   // a shed or a stall: walls of tin sheet, a lean-to roof
        const H = 2.3; box(g, b.x, y0, b.z, b.L, H, b.W, b.ang, vary([0.6, 0.6, 0.58], RL, 0.08), null, true);
        const A = at(-b.L / 2 - 0.3, -b.W / 2 - 0.4), B = at(b.L / 2 + 0.3, -b.W / 2 - 0.4), C = at(b.L / 2 + 0.3, b.W / 2 + 0.4), D = at(-b.L / 2 - 0.3, b.W / 2 + 0.4);
        g.quadO([A[0], y0 + H + 0.45, A[1]], [B[0], y0 + H + 0.45, B[1]], [C[0], y0 + H, C[1]], [D[0], y0 + H, D[1]], tin, [b.x, y0, b.z]);
        st.houses++; continue;
      }
      // the side towards the road (the veranda's): the long side facing it
      const n = vrNear(b.x, b.z), vs = n.i >= 0 && (-s * (T.px[n.i] - b.x) + c * (T.pz[n.i] - b.z)) < 0 ? -1 : 1;
      const big = b.kind === 2 && b.L * b.W > 55, dv = b.W >= 5.5 ? Math.min(2.2, b.W * 0.3) : 0, Wc = b.W - dv, [ex, ez] = at(0, -vs * dv / 2);
      let yT = y0;
      if (big) { box(g, ex, y0, ez, b.L, 2.8, Wc, b.ang, vary(BLOCK, RL, 0.04), null, true); yT += 2.8; }   // (a big house's block ground floor)
      box(g, ex, yT, ez, b.L, 2.7, Wc, b.ang, wall, null, true);
      const yTop = yT + 2.7;
      if (dv > 0) { st.verandas++;   // the veranda: its floor (upstairs over the block floor), the posts to the roof, the white railing
        const ve = vs * (b.W / 2 - 0.1), [vx, vz] = at(0, vs * (b.W / 2 - dv / 2));
        if (big) box(g, vx, yT - 0.2, vz, b.L, 0.2, dv, b.ang, CONC);
        const np = Math.max(2, Math.round(b.L / 2.6) + 1);
        for (let k = 0; k < np; k++) { const [x, z] = at(-b.L / 2 + 0.15 + k * (b.L - 0.3) / (np - 1), ve); box(g, x, y0, z, 0.16, yTop - y0, 0.16, b.ang, TRIM, null, true); }
        if (det) { const [x, z] = at(0, ve); box(g, x, yT + 0.05, z, b.L - 0.3, 0.85, 0.06, b.ang, TRIM, null, true); }
      }
      if (det) {   // the windows' louvred shutters (and the door onto the veranda): on the long sides and on the ends of the bigger houses
        const nw = Math.max(1, Math.floor(b.L / 3.2));
        for (const yy of big ? [y0 + 0.9, yT + 0.8] : [y0 + 0.8]) {
          for (const v of [-vs * (b.W / 2 + 0.03), vs * (b.W / 2 - dv + 0.03)]) for (let k = 0; k < nw; k++) {
            const u = (k + 0.5) / nw * b.L - b.L / 2, door = v * vs > 0 && k === Math.floor(nw / 2) && yy === (big ? yT + 0.8 : y0 + 0.8), [x, z] = at(u, v);
            box(g, x, door ? yy - 0.75 : yy, z, door ? 1.0 : 0.95, door ? 2.05 : 1.2, 0.06, b.ang, door ? DOOR : shut, null, true); }
          if (b.W > 5) for (const su of [-1, 1]) { const [x, z] = at(su * (b.L / 2 + 0.03), -vs * dv / 2); box(g, x, yy, z, 0.06, 1.2, 0.95, b.ang, shut, null, true); }
        }
      }
      tinRoof(g, b.x, yTop, b.z, b.L + 0.8, b.W + 0.8, Math.min(Math.min(b.L, b.W), 10) * 0.3, b.ang, tin, RL, det);
      st.houses++;
    }
    // the fishing boats on the beach of the bay: on the sand above the water (0.3-1.6 m above the sea), their bows up the beach
    { const RB = rng(LOOK.seed + 73), base = PP.D.base, HULL = [[0.92, 0.92, 0.88], [0.18, 0.46, 0.7], [0.86, 0.72, 0.16], [0.72, 0.2, 0.16], [0.24, 0.58, 0.46]];
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of BEACH) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      const placed = [];
      for (let k = 0; k < 400 && placed.length < 7; k++) {
        const x = x0 + RB() * (x1 - x0), z = z0 + RB() * (z1 - z0), r1 = RB(), r2 = RB(), r3 = RB();
        if (!inPoly(BEACH, x, z)) continue;
        const a = G(x, z) + base; if (a < 0.3 || a > 1.6) continue;
        if (placed.some(([px, pz]) => Math.hypot(px - x, pz - z) < 5)) continue;
        const gx = G(x + 1, z) - G(x - 1, z), gz = G(x, z + 1) - G(x, z - 1), rot = Math.atan2(gz, gx) + (r1 - 0.5) * 0.6;   // (up the beach)
        const col = HULL[Math.floor(r2 * HULL.length)], band = HULL[(Math.floor(r2 * HULL.length) + 1 + Math.floor(r3 * 3)) % HULL.length];
        boat(scen.get(x, z), x, G(x, z) - 0.05, z, rot, col, band); placed.push([x, z]); st.boats++;
      }
    }
    roadside(scen, excluded || (() => false), onSide);
    out.canaries = st;   // (what was planted and built: the tests)
  };

  World.keep('caBank', 'canaries');   // (the walls' terrain kept between its builds, as the passes' in js/world-prelaz.js)
  World.ext.canaries = (scene, tex, opts) => API.buildPrelaz(scene, tex, opts, LOOK);
})();
