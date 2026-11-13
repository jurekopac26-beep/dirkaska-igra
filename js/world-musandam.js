/* =========================================================================
   WORLD — Musandam, Oman (docs/proge/musandam.md): the coast road along the bay and up the limestone cliffs above it, built by the shared world
   of the mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its own (PL_LOOK.musandam) and its own landmarks (L.pre, L.extra): the
   sea of the bay (one sheet of water at the sea's level, the model's sea floor dug down under it; the far view's
   water in the Gulf's blue-green), the fishing skiffs pulled up on the shingle and the wooden boats at anchor, the date palms of the village at
   the shore, the flat-roofed houses of the hamlet on the climb (OpenStreetMap's footprints, in place of the shared builder's huts) and a few by
   the bay, the acacias of the dry wadis, the viewpoint over the bay. The steel guardrails on the side of the drop are the shared builder's; the
   car cannot fall (no def.drops, the user's decision of 13. 11. 2026). Places from OpenStreetMap (ODbL 1.0); all generic: no names, letters
   or signs
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { Chunks, GB, IChunks, TAU, box, caGround, caSlope, clamp, cyl, lerp, rng, rpHash, sstep, vary, vrDist, vrNear } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ---- the look: the Musandam peninsula in late autumn: the bare pale limestone of the cliffs, beige and grey, the brown scree and the gravel
     of the wadis, a few dry shrubs, no forest; Oman's road markings (white, the centre line dashed) and signs (black and yellow chevrons, the
     red warning triangles) ---- */
  const LOOK = API.PL_LOOK.musandam = {
    seed: 6810, board: 'MUSANDAM', sub: 'OMAN', banner: ['BAY · SUMMIT', '9 M → 188 M · 3.9 KM'],
    grass: [0.56, 0.5, 0.39], grassDry: [0.62, 0.55, 0.42], grassLush: [0.47, 0.45, 0.32], shrub: [0.36, 0.36, 0.24],
    rock: [0.6, 0.55, 0.47], rockWarm: [0.66, 0.56, 0.44], lichen: [0.56, 0.53, 0.47], scree: [0.58, 0.52, 0.43],
    sat: 0.55, satV: 1.12, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.62, 0.57, 0.49], [0.68, 0.61, 0.51], [0.55, 0.52, 0.47], [0.71, 0.6, 0.47], [0.58, 0.5, 0.42], [0.64, 0.6, 0.55]],   // (the limestone: pale grey, beige, the rust of the weathered faces)
    centre: [0.95, 0.95, 0.92], dash: [4, 10], solidNear: 70,
    chev: ['#16161a', '#f2c418'], warn: 'tri', rail: 'steel', shoulder: [0.6, 0.56, 0.48],
    fans: [[0.95, 0.95, 0.94], [0.92, 0.9, 0.84], [0.3, 0.32, 0.36], [0.62, 0.12, 0.12], [0.18, 0.4, 0.3], [0.78, 0.7, 0.55], [0.2, 0.26, 0.5], [0.55, 0.5, 0.42]],
    cars: [[0.94, 0.94, 0.93], [0.78, 0.79, 0.8], [0.9, 0.9, 0.88], [0.16, 0.16, 0.18], [0.72, 0.66, 0.55], [0.5, 0.52, 0.55]],
    roofs: [[0.82, 0.78, 0.7], [0.76, 0.72, 0.65], [0.86, 0.83, 0.77]],   // (the flat roofs' concrete: the shared builder's huts are taken over)
    sheep: 0, portal: 0,
    // (the far slopes: the pale limestone, the brown scree lower down, no forest and no snow; the sea: the Gulf's blue-green)
    far: { lo: [0.6, 0.53, 0.42], hi: [0.66, 0.61, 0.53], dw: [0.55, 0.5, 0.4], snow: 9000, tree: [9500, 9400], fc: [0.5, 0.46, 0.36], dwb: [9000, 9100, 9800, 9700], rk: [120, 600], wet: [0.12, 0.38, 0.44] },
  };

  const marks = [];   // (the build under way: [what, x, z, the road's heading, the side, the road's index])
  let HOUSES = [], LC0 = null;   // (OpenStreetMap's buildings, taken from the shared builder; the land cover as the data has it)
  const VIEW_S = 2385, PALM_S = [760, 1340], BAY_S = [380, 1160], VILLAGE_S = [700, 1400];   // (metres from the start line: the viewpoint, the village's palms, the boats, its houses)

  // a place beside the road at s metres from the start line, o metres beyond the barrier on the side sd (+1 the right): [x, z, heading, sd, i]
  function atS(s, sd, o) {
    const i = T.idx(T.startS + s), bar = sd > 0 ? T.br[i] : T.bl[i], d = sd * (bar + o);
    return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i], sd, i];
  }

  /* ---- before the terrain: the sea floor dug down under the water, the forest and the snow of the land cover (there is none: noise in the
     data) left to the shrubs and the rock, the shared builder's huts taken over (the flat-roofed houses: L.extra), the viewpoint's level plot ---- */
  LOOK.pre = function ({ P, exclPush, blds }) {
    marks.length = 0; HOUSES = blds.splice(0, blds.length);
    const seaY = -P.D.base;
    // (the model's sea at 0 m: the floor ~8 m under the water; only the low ground joined to the open sea at the grid's edge: a dry wadi's bed at
    // a metre behind the beach stays land, lifted just above the water)
    { const D = P.D, nx = D.nx, nz = D.nz, dem = P.dem, low = (k) => dem[k] < seaY + 1.2, seen = new Uint8Array(nx * nz), q = [];
      for (let i = 0; i < nx; i++) for (const j of [0, nz - 1]) { const k = j * nx + i; if (low(k) && !seen[k]) { seen[k] = 1; q.push(k); } }
      for (let j = 0; j < nz; j++) for (const i of [0, nx - 1]) { const k = j * nx + i; if (low(k) && !seen[k]) { seen[k] = 1; q.push(k); } }
      while (q.length) { const k = q.pop(), i = k % nx, j = (k - i) / nx;
        for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const kk = jj * nx + ii; if (!seen[kk] && low(kk)) { seen[kk] = 1; q.push(kk); } } }
      for (let k = 0; k < dem.length; k++) if (low(k)) dem[k] = seen[k] ? seaY - 8 : seaY + 1.3; }
    const lc = P.lc; LC0 = Uint8Array.from(lc);
    for (let k = 0; k < lc.length; k++) { if (lc[k] === 1) lc[k] = 2; else if (lc[k] === 6) lc[k] = 4; }
    for (let k = P.lakes.length - 1; k >= 0; k--) if (P.lakes[k].h < seaY + 12) P.lakes.splice(k, 1);   // (the pools at the shore: the sea's)
    const pad = (x, z, i, r) => { P.pads.push({ x, z, r, b: 8, h: T.hy[i] - 0.25 }); exclPush(x, z, r + 2); };
    { const [x, z, hd, sd, i] = atS(VIEW_S, 1, 4.5); pad(x, z, i, 6); marks.push(['view', x, z, hd, sd, i]); }
  };

  /* ---- the plants and the boats in the soft look of the game's trees (Drevesa A, docs/drevesa-a.md: AB, aPuff, aTrunk); unit height 1 (a
     boat: unit length), the instances scale and tint them ---- */
  function dateGeo() {   // a date palm: a slender ringed trunk, a crown of stiff fronds rising and arching out, a few dry ones hanging below
    const g = new GB(), tr = [0.5, 0.42, 0.32], fr = [0.3, 0.38, 0.2], dead = [0.58, 0.5, 0.34];
    cyl(g, 0, 0, 0, 0.032, 0.84, 7, tr, tr, 0.028);
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * TAU + (k % 2) * 0.25, ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca, d = k % 4 === 3, c = d ? dead : fr;
      const pts = d ? [[0.02, 0.83], [0.09, 0.72], [0.12, 0.58]] : k % 2 ? [[0.02, 0.84], [0.12, 1.0], [0.22, 1.06], [0.32, 1.02]] : [[0.02, 0.84], [0.17, 0.94], [0.31, 0.92], [0.4, 0.82]];
      for (let q = 0; q + 1 < pts.length; q++) {
        const [r0, y0] = pts[q], [r1, y1] = pts[q + 1], w0 = 0.055 * (1 - q / pts.length), w1 = 0.055 * (1 - (q + 1) / pts.length) + 0.004;
        const A = [ca * r0 - px * w0, y0, sa * r0 - pz * w0], B = [ca * r0 + px * w0, y0, sa * r0 + pz * w0], C = [ca * r1 + px * w1, y1, sa * r1 + pz * w1], D = [ca * r1 - px * w1, y1, sa * r1 - pz * w1];
        const mid = [(r0 + r1) / 2 * ca, (y0 + y1) / 2, (r0 + r1) / 2 * sa];
        g.quadO(A, B, C, D, c, [mid[0], mid[1] - 1, mid[2]]); g.quadO(A, D, C, B, c, [mid[0], mid[1] + 1, mid[2]]);
      }
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function acaciaGeo() {   // an acacia of the wadis: a short forked trunk under a wide flat crown of grey-green (~80 faces)
    const b = new API.AB(), R = rng(6817), col = [0.36, 0.4, 0.24];
    API.aTrunk(b, 0, -0.02, 0, 0.04, 0.5, 5, [0.42, 0.36, 0.3]);
    for (const [x, y, z, r, sy] of [[0, 0.74, 0, 0.42, 0.32], [0.3, 0.68, 0.12, 0.3, 0.34], [-0.28, 0.7, -0.14, 0.32, 0.34], [0.06, 0.66, -0.3, 0.28, 0.36]])
      API.aPuff(b, x, y, z, r, sy, vary(col, R, 0.08), R, 0.3, 0.5, 1.1);
    return b.geometry();
  }
  function boatGeo(dhow) {   // a boat along +x, unit length: the fishing skiff (a white fibreglass hull, low, an outboard at the stern) or the wooden boat
    // at anchor (a brown hull with a raised bow, a cabin aft)
    const g = new GB(), hull = dhow ? [0.52, 0.36, 0.22] : [0.93, 0.93, 0.9], band = dhow ? [0.86, 0.82, 0.72] : [0.16, 0.36, 0.6], inside = dhow ? [0.42, 0.3, 0.2] : [0.3, 0.4, 0.48];
    const W = dhow ? 0.15 : 0.17, H = dhow ? 0.12 : 0.15, bow = dhow ? 0.2 : 0.1;
    const P = (x, y, z) => [x, y, z];
    // (the sides: from the stern at -0.5 to the bow at +0.5, pointed at the bow, the sheer rising to it)
    const st = [[-0.5, W * 0.85], [-0.2, W], [0.15, W * 0.95], [0.38, W * 0.6], [0.5, 0]];
    for (let k = 0; k + 1 < st.length; k++) {
      const [x0, w0] = st[k], [x1, w1] = st[k + 1], t0 = H + bow * sstep(0.1, 0.5, x0), t1 = H + bow * sstep(0.1, 0.5, x1);
      for (const s of [-1, 1]) {
        g.quadO(P(x0, 0, s * w0 * 0.7), P(x1, 0, s * w1 * 0.7), P(x1, t1, s * w1), P(x0, t0, s * w0), hull, [(x0 + x1) / 2, H / 2, s]);
        g.quadO(P(x0, t0 - 0.02, s * w0), P(x1, t1 - 0.02, s * w1), P(x1, t1, s * w1), P(x0, t0, s * w0), band, [(x0 + x1) / 2, H, s * 2]);
      }
      g.quadO(P(x0, 0.03, -w0 * 0.8), P(x1, 0.03, -w1 * 0.8), P(x1, 0.03, w1 * 0.8), P(x0, 0.03, w0 * 0.8), inside, [(x0 + x1) / 2, 1, 0]);
    }
    g.quadO(P(-0.5, 0, -W * 0.6), P(-0.5, 0, W * 0.6), P(-0.5, H, W * 0.85), P(-0.5, H, -W * 0.85), hull, [-1, H / 2, 0]);   // (the transom)
    if (dhow) { box(g, -0.24, 0.04, 0, 0.26, 0.16, 0.2, 0, [0.84, 0.8, 0.7], [0.5, 0.36, 0.22]); box(g, -0.3, 0.2, 0, 0.2, 0.02, 0.24, 0, [0.6, 0.48, 0.32]); }
    else box(g, -0.53, -0.04, 0, 0.05, 0.14, 0.05, 0, [0.14, 0.14, 0.16]);   // (the outboard)
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  /* ---- the landmarks, the houses, the plants, the boats and the sea, after the rest of the road is built ---- */
  LOOK.extra = function ({ scen, root, out, P, excluded, matV }) {
    const RL = rng(LOOK.seed + 71), G = (x, z) => caGround(x, z), seaY = -P.D.base, dens = Math.min(1, LOD.dens != null ? LOD.dens : 1), sFin = T.finishS;
    const st = { houses: 0, windows: 0, tanks: 0, palms: 0, acacias: 0, skiffs: 0, dhows: 0, views: 0, sea: 0, farSea: 0 };
    const lime = [0.86, 0.82, 0.74], stoneP = [0.66, 0.6, 0.5];
    const lcAt = (x, z) => { const L = P.L, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell); return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? 0 : LC0[j * L.nx + i]; };
    for (const [what, x, z, hd, sd, i] of marks) {
      const g = scen.get(x, z), c = Math.cos(hd), s = Math.sin(hd), nx = -s * sd, nz = c * sd;   // (nx, nz: the way from the road out to it)
      if (what === 'view') {   // the viewpoint: a paved lay-by beside the road, a low limestone parapet on its outer edge, a shade of two posts and a flat roof
        const yy = T.hy[i] - 0.25;
        for (let k = -3; k <= 3; k++) { const u = k * 1.6, px = x + c * u + nx * 4.4, pz = z + s * u + nz * 4.4;
          box(g, px, Math.min(yy, G(px, pz)) - 0.6, pz, 1.7, yy - Math.min(yy, G(px, pz)) + 1.4, 0.45, hd, lime, stoneP); }
        for (const u of [-1.8, 1.8]) box(g, x + c * u + nx * 1.5, yy, z + s * u + nz * 1.5, 0.14, 2.5, 0.14, hd, [0.5, 0.5, 0.52]);
        box(g, x + nx * 1.5, yy + 2.5, z + nz * 1.5, 4.4, 0.12, 2.6, hd, [0.86, 0.84, 0.78], [0.72, 0.7, 0.66]);
        box(g, x + nx * 2.2, yy, z + nz * 2.2, 2.0, 0.45, 0.5, hd, stoneP);
        st.views++;
      }
      out.marks[what] = (out.marks[what] || 0) + 1;
    }

    // the houses: OpenStreetMap's footprints (the hamlet on the climb, the village across the bay) and a few more by the shore at the village of
    // the bay (the map has none there): flat-roofed blocks of rendered concrete in sand and white on a plinth down the slope, a parapet round the
    // roof, a water tank on some, the small dark windows of those near the road
    {
      const RB = rng(LOOK.seed + 21), WALL = [[0.9, 0.86, 0.77], [0.94, 0.92, 0.87], [0.84, 0.76, 0.62], [0.88, 0.8, 0.66], [0.8, 0.72, 0.6], [0.92, 0.9, 0.84]];
      const list = HOUSES.slice();
      const room = (x, z, r) => list.every(b => Math.hypot(b.x - x, b.z - z) > r + Math.hypot(b.L, b.W) / 2);
      for (let s = VILLAGE_S[0]; s < VILLAGE_S[1]; s += 9 + RB() * 8) for (const sd of [-1, 1]) { if (list.length >= HOUSES.length + 18) break;   // (the village: either side, beyond the barrier, where the ground is dry and gentle)
        const o = 7 + RB() * 20, [x, z, hd, , i] = atS(s, sd, o), L = 8 + RB() * 7, W = 6 + RB() * 4;
        if (G(x, z) < seaY + 1.5 || caSlope(x, z) > 0.3 || excluded(x, z) || !room(x, z, Math.hypot(L, W) / 2 + 3)) continue;
        list.push({ x, z, L, W, ang: hd + (RB() - 0.5) * 0.15, h: 0, kind: 0, i });
      }
      for (const b of list) {
        const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang), d = vrDist(b.x, b.z); let lo = 1e9, hi = -1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const yq = G(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, yq); hi = Math.max(hi, yq); }
        if (lo < seaY + 0.6) continue;   // (none in the water)
        const area = b.L * b.W, fl = b.h > 0 ? clamp(Math.round(b.h / 3.2), 1, 3) : area > 200 && RB() < 0.5 ? 2 : 1, H = fl * 3.2;
        const wc = vary(WALL[Math.floor(RB() * WALL.length)], RB, 0.03), rc = vary(LOOK.roofs[Math.floor(RB() * LOOK.roofs.length)], RB, 0.04);
        box(g, b.x, lo - 0.6, b.z, b.L + 0.2, hi - lo + 1.0, b.W + 0.2, b.ang, [0.62, 0.58, 0.5], null, true);
        box(g, b.x, hi + 0.4, b.z, b.L, H - 0.4, b.W, b.ang, wc, rc, true);
        for (const [u, v, l, w] of [[0, -b.W / 2, b.L, 0.22], [0, b.W / 2, b.L, 0.22], [-b.L / 2, 0, 0.22, b.W], [b.L / 2, 0, 0.22, b.W]])   // (the parapet)
          box(g, b.x + c * u - s * v, hi + H, b.z + s * u + c * v, l + 0.1, 0.6, w + 0.1, b.ang, wc, wc, true);
        if (RB() < 0.45) { const u = (RB() - 0.5) * b.L * 0.5, v = (RB() - 0.5) * b.W * 0.5; cyl(g, b.x + c * u - s * v, hi + H, b.z + s * u + c * v, 0.7, 1.3, 8, [0.92, 0.92, 0.9], [0.86, 0.86, 0.84]); st.tanks++; }
        if (d < 110) { const n = Math.max(1, Math.min(3, Math.floor(b.L / 3.6)));
          for (let f = 0; f < fl; f++) for (const sd of [-1, 1]) for (let q = 0; q < n; q++) { const u = (q - (n - 1) / 2) * b.L / n, v = sd * (b.W / 2 + 0.03);
            box(g, b.x + c * u - s * v, hi + 1.2 + f * 3.2, b.z + s * u + c * v, 0.8, 1.0, 0.07, b.ang, [0.16, 0.15, 0.14], null, true); st.windows++; } }
        st.houses++;
      }
    }

    // the date palms of the village (both sides, beyond the barrier, in its gardens on the dry ground) and the acacias of the wadis (on the shrubs'
    // and the bare ground's cells, sparse, low down, off the steep faces), instanced per 160 m chunk
    {
      const tp = new IChunks(dateGeo(), matV, 160), ta = new IChunks(acaciaGeo(), matV, 160), RT = rng(LOOK.seed + 61);
      for (let s = PALM_S[0]; s < PALM_S[1]; s += 3.5 / Math.sqrt(dens)) for (const sd of [-1, 1]) {
        if (RT() > 0.4) continue;
        const [x, z] = atS(s, sd, 2 + RT() * 30), y = G(x, z);
        if (y < seaY + 1.2 || excluded(x, z) || caSlope(x, z) > 0.5) continue;
        const n = vrNear(x, z); if (n.i >= 0 && n.dd < 2.5) continue;
        const r = RT(); tp.add(x, y - 0.1, z, r * TAU, 6 + r * 3, 8 + r * 6, [0.92 + r * 0.16, 0.95, 0.9]); st.palms++;
      }
      const maxA = Math.round(900 * dens);
      for (let s = Math.max(6, T.startS - 150); s < Math.min(T.len - 6, sFin + 150) && st.acacias < maxA; s += 5) {
        const i = T.idx(s);
        for (const sd of [-1, 1]) {
          if (RT() > 0.16) continue;
          const o = (sd > 0 ? T.br[i] : T.bl[i]) + 4 + RT() * 110, x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o, y = G(x, z), c = lcAt(x, z);
          if (!(c === 0 || c === 2 || c === 3 || (c === 7 && RT() < 0.5)) || y < seaY + 2 || y > seaY + 420 || caSlope(x, z) > 0.55 || excluded(x, z)) continue;
          const n = vrNear(x, z); if (n.i >= 0 && n.dd < 3.5) continue;
          const r = RT(), h = 3 + r * 3; ta.add(x, y - 0.15, z, r * TAU, h * (1.3 + RT() * 0.3), h, [0.92 + r * 0.16, 0.95 + RT() * 0.08, 0.9]); st.acacias++;
        }
      }
      tp.addTo(root, true); ta.addTo(root, true);
    }

    // the boats of the bay: the fishing skiffs pulled up on the shingle at the water line and a few wooden boats at anchor offshore, on the sea's
    // side of the road along the shore (the first wet ground out from the barrier)
    {
      const tk = new IChunks(boatGeo(false), matV, 160), td = new IChunks(boatGeo(true), matV, 160), RS = rng(LOOK.seed + 91);
      for (let s = BAY_S[0]; s < BAY_S[1]; s += 26 + RS() * 30) {
        const i = T.idx(T.startS + s), bar = T.br[i];
        let wo = -1; for (let o = bar + 4; o < bar + 90; o += 2) { const x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; if (G(x, z) < seaY + 0.1) { wo = o; break; } }
        if (wo < 0) continue;
        const r = RS();
        if (r < 0.62) {   // (a skiff on the beach, its bow up the shingle, now and then two side by side)
          for (let q = 0; q < (RS() < 0.35 ? 2 : 1); q++) {
            const o = wo - 2.5, x = T.px[i] + T.nx[i] * o + T.nz[i] * q * 2.2, z = T.pz[i] + T.nz[i] * o - T.nx[i] * q * 2.2, y = Math.max(G(x, z), seaY + 0.1);
            const L = 5.5 + RS() * 1.5; tk.add(x, y - 0.02, z, Math.atan2(T.nz[i], -T.nx[i]) + (RS() - 0.5) * 0.4, L, L, [1, 1, 1]);   // (rotation.y a: +x to (cos a, -sin a), the bow up the beach)
            st.skiffs++;
          }
        } else {   // (a wooden boat at anchor, 15-50 m out, heading into the light breeze off the sea)
          const o = wo + 15 + RS() * 35, x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          if (G(x, z) > seaY - 1.5) continue;
          const L = 12 + RS() * 6; td.add(x, seaY - 0.35, z, RS() * TAU, L, L, [0.9 + RS() * 0.2, 0.95, 0.95]); st.dhows++;
        }
      }
      tk.addTo(root, true); td.addTo(root, true);
    }

    // the sea: one sheet of water at the sea's level (0 m) wherever the ground is under it, out to ~1.1 km from the road (8 m cells along the
    // shore near the road, 24 m farther out, 72 m out in the bay): the turquoise over the shingle near the shore, the bay's deep blue-green
    // farther out
    {
      const D = P.D, F = T.def.farDem, fb = atob(F.b64), fH = new Float32Array(F.nx * F.nz);
      for (let k = 0; k < fH.length; k++) fH[k] = F.lo + (fb.charCodeAt(2 * k) * 256 + fb.charCodeAt(2 * k + 1)) / 2;
      const bil = (a, nx, nz, x0, z0, cs, x, z) => { const gx = clamp((x - x0) / cs, 0, nx - 1.001), gz = clamp((z - z0) / cs, 0, nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
        return (a[j * nx + i] * (1 - u) + a[j * nx + i + 1] * u) * (1 - v) + (a[(j + 1) * nx + i] * (1 - u) + a[(j + 1) * nx + i + 1] * u) * v; };
      const inD = (x, z) => x > D.x0 && z > D.z0 && x < D.x0 + (D.nx - 1) * D.cell && z < D.z0 + (D.nz - 1) * D.cell;
      const ground = (x, z) => vrDist(x, z) < 500 ? G(x, z) : inD(x, z) ? bil(P.dem, D.nx, D.nz, D.x0, D.z0, D.cell, x, z) : bil(fH, F.nx, F.nz, F.x0, F.z0, F.cell, x, z) - D.base - 3;
      const wet = (x, z) => ground(x, z) < seaY + 0.25;
      const deep = [0.04, 0.24, 0.32], shal = [0.16, 0.5, 0.5], sky = [0.5, 0.66, 0.74], cc = new Map();
      const wc = (x, z) => { const key = Math.round(x) + ',' + Math.round(z); let c = cc.get(key); if (c) return c;
        const dp = seaY - ground(x, z), ks = 0.22 * sstep(0.55, 0.85, P.n2(x * 0.6, z * 0.6)); c = [0, 1, 2].map(k => lerp(lerp(shal[k], deep[k], sstep(1.5, 8.5, dp)), sky[k], ks)); cc.set(key, c); return c; };
      const uv = (x, z) => [x / 14, -z / 14];
      const open8 = (x, z) => { for (let a = -8; a <= 16; a += 8) for (let b = -8; b <= 16; b += 8) if (ground(x + a, z + b) < seaY - 1.5) return true; return false; };   // (a small cell only by the open water: none in a dip ashore)
      const sea = new Chunks(900, true), wMat = new THREE.MeshPhongMaterial({ map: tex0(out), vertexColors: true, shininess: 70, specular: 0x2a3a44 });
      const quad = (x0, z0, cs) => { const A = [x0, seaY, z0], B = [x0 + cs, seaY, z0], C = [x0 + cs, seaY, z0 + cs], E = [x0, seaY, z0 + cs];
        sea.get(x0, z0).quadUp(A, B, C, E, [wc(A[0], A[2]), wc(B[0], B[2]), wc(C[0], C[2]), wc(E[0], E[2])], [uv(x0, z0), uv(x0 + cs, z0), uv(x0 + cs, z0 + cs), uv(x0, z0 + cs)]); st.sea++; };
      const X0 = Math.floor((P.bx0 - 1100) / 72) * 72, X1 = P.bx1 + 1100, Z0 = Math.floor((P.bz0 - 1100) / 72) * 72, Z1 = P.bz1 + 1100;
      for (let z0 = Z0; z0 < Z1; z0 += 72) for (let x0 = X0; x0 < X1; x0 += 72) {
        const d = vrDist(x0 + 36, z0 + 36); if (d > 1150) continue;
        let n = 0; for (const [a, b] of [[0, 0], [72, 0], [0, 72], [72, 72], [36, 36]]) if (wet(x0 + a, z0 + b)) n++;
        if (n === 5 && d > 560) { quad(x0, z0, 72); continue; }
        for (let zb = z0; zb < z0 + 72; zb += 24) for (let xb = x0; xb < x0 + 72; xb += 24) {
          let m = 0; for (const [a, b] of [[0, 0], [24, 0], [0, 24], [24, 24], [12, 12]]) if (wet(xb + a, zb + b)) m++;
          if (!m) continue;
          if (m === 5 || vrDist(xb + 12, zb + 12) > 450) { quad(xb, zb, 24); continue; }
          for (let zc = zb; zc < zb + 24; zc += 8) for (let xc = xb; xc < xb + 24; xc += 8) if ((wet(xc, zc) || wet(xc + 8, zc) || wet(xc, zc + 8) || wet(xc + 8, zc + 8) || wet(xc + 4, zc + 4)) && open8(xc, zc)) quad(xc, zc, 8);
        }
      }
      sea.addTo(root, wMat, false, true); out.sea = seaY;
    }

    // the far view's water (the bay and the open sea out to the edge of its grid, irFar) in the sea's own blue-green instead of the grey-green of
    // the tarns the shared far view paints every wet node, once, at the first update (irFar is built after this)
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
    out.musandam = st;   // (what was built: the tests)
  };
  // (the water's moving picture: the shared builder's, World.update scrolls it: out.dyn.water)
  function tex0(out) { return out.dyn.water || (out.dyn.water = API.TEX && API.TEX.water); }

  World.ext.musandam = (scene, tex, opts) => { API.TEX = tex; return API.buildPrelaz(scene, tex, opts, LOOK); };
})();
