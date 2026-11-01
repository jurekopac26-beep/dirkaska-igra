/* =========================================================================
   WORLD — the data-driven builder of the short roads (docs/gorske-proge.md): World.gore.build(scene, tex, opts, S) builds a whole world from
   the track's data (tools/proga-uvoz.mjs: def.dem, def.lc, def.bld, def.lifts, def.zones, def.lakes, def.pulls, def.sideRoads, def.surf) and
   its style S (js/world-<id>.js: a few lines, the track's own things in S.extra). Vršič's corridor helpers (vrPrep and the rest, World.api)
   give the terrain round the road; on it: the road and its verges (lines by S.road, gravel by def.surf, snowbanks), the side roads, guardrails,
   snow poles and guide posts, the buildings (OSM footprints, snow on the roofs in a snowy world), the lifts (towers, stations, cables, chairs or
   T-bars moving), the ski runs (def.lc class 6, groomed snow), skiers, safety nets where a run meets the road, trees by the land cover, rocks,
   animals (S.animals), the race's gantries and crowds. The camera behind the car sees ~60 m beside the road (the plan's measure), so the
   detail is there and the terrain stops ~200 m out (fog). No names of firms anywhere: the boards are generic (S.boards).
   Land cover classes (def.lc): 0 open, 1 forest, 2 shrubs, 3 built-up, 4 rock and scree, 5 water, 6 ski run, 7 snow and ice.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caCar, clamp, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl, gable, ico, lerp, ouCutMat, ouRod,
    pkGroundMat, propFloorTable, puff, rng, roadsideProps, rock, rpHash, sstep, stubExcl, stubGeo, stubProps, stubRails, stubVerge, vary, vrDist,
    vrFar, vrGH, vrGritTex, vrGround, vrLC, vrLCf, vrNear, vrPrep, vrSlope, vrStubAt, vrStubs, vrWater
  } = API;
  let T, LOD;   // (World's, for the build under way)
  API.sync.push(() => { ({ T, LOD } = API); });

  /* ---------------- the style: what a track does not give is this (a snowy ski road; a green one: snow 'none') ---------------- */
  const DEF = {
    seed: 1, snow: 'all',   // 'all': a ski resort in the season (snow everywhere, the roads ploughed), 'none', or a number: snow above that altitude
    ground: { grass: [0.42, 0.52, 0.26], forest: [0.3, 0.32, 0.2], shrub: [0.36, 0.4, 0.22], built: [0.5, 0.5, 0.46], rock: [0.56, 0.55, 0.52], dry: [0.62, 0.56, 0.38] },
    road: { line: 'white', centre: 'dash', double: true, edge: true, shoulder: [0.66, 0.66, 0.65], gravel: [0.62, 0.56, 0.46], paveC: [0.8, 0.8, 0.82] },
    tileR: 190, tileR2: 290, snowbanks: true, rails: true, poles: { col: [0.95, 0.4, 0.08], band: [0.09, 0.09, 0.1], every: 15, h: 3.4 }, posts: true,
    trees: { kinds: ['gum'], forest: 0.34, open: 0.03, near: 2.4, h: [6, 12] }, rocks: true, nets: true, skiers: 50, lifts: true,
    bld: { walls: [[0.52, 0.36, 0.22], [0.66, 0.5, 0.32], [0.86, 0.84, 0.78], [0.42, 0.46, 0.4], [0.62, 0.32, 0.22], [0.72, 0.7, 0.64], [0.3, 0.38, 0.34]],
      roofs: [[0.22, 0.32, 0.26], [0.5, 0.18, 0.14], [0.3, 0.32, 0.34], [0.62, 0.64, 0.66], [0.16, 0.2, 0.26]] },
    boards: { start: 'START', finish: 'FINISH', banner: 'HILL CLIMB', cp: '#8c1d1d', closed: 'ROAD CLOSED', gate: 'CLOSED' },
    signs: 'diamond', crowd: [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.14, 0.26, 0.6], [0.2, 0.5, 0.32], [0.95, 0.72, 0.16], [0.46, 0.66, 0.86], [0.12, 0.14, 0.2], [0.9, 0.45, 0.14]],
    animals: [], dust: null, extra: null,
  };
  const SNOW = [0.93, 0.95, 0.99], PISTE = [0.97, 0.98, 1.0], SLUSH = [0.62, 0.62, 0.63];
  let S = DEF, SN = 1, SNL = 1e9;   // (the style of the build under way; snow everywhere (1) or above SNL)
  const GCOL = [0, 0, 0];

  /* ---------------- the ground's colour (times the grit map): snow (blue in the hollows, rock showing on the steep faces, the ski runs groomed and
     brighter, the village's ploughed patches greyer, a slushy verge) or, where there is none, the land cover's own colours ---------------- */
  function snowAt(x, z, A, ny) {
    if (SN) return sstep(0.42, 0.62, ny);
    const P = API.VR, line = SNL + (P.n5(x, z) - 0.5) * 120; return sstep(line, line + 80, A) * sstep(0.5, 0.74, ny);
  }
  function gCol(x, z, h, ny, dd) {
    const P = API.VR, m = P.n3(x, z), q = P.n4(x, z), A = h + P.D.base, G = S.ground;
    const fo = vrLCf(x, z, 1), sh = vrLCf(x, z, 2), bu = vrLCf(x, z, 3), rk = vrLCf(x, z, 4), wa = vrLCf(x, z, 5), pi = vrLCf(x, z, 6);
    let r = G.grass[0] + (m - 0.5) * 0.1 + (q - 0.5) * 0.06, g = G.grass[1] + (m - 0.5) * 0.08 + (q - 0.5) * 0.05, b = G.grass[2] + (m - 0.5) * 0.05;
    const dr = sstep(0.4, 0.75, P.n2(x, z)) * 0.5; r = lerp(r, G.dry[0], dr); g = lerp(g, G.dry[1], dr); b = lerp(b, G.dry[2], dr);
    r = lerp(r, G.forest[0] + m * 0.05, fo); g = lerp(g, G.forest[1] + m * 0.04, fo); b = lerp(b, G.forest[2], fo);
    r = lerp(r, G.shrub[0], sh * 0.8); g = lerp(g, G.shrub[1], sh * 0.8); b = lerp(b, G.shrub[2], sh * 0.8);
    r = lerp(r, G.built[0], bu * 0.7); g = lerp(g, G.built[1], bu * 0.7); b = lerp(b, G.built[2], bu * 0.7);
    const st = Math.max(rk * 0.85, sstep(0.78, 0.55, ny) * 0.95); r = lerp(r, G.rock[0] + m * 0.06, st); g = lerp(g, G.rock[1] + m * 0.05, st); b = lerp(b, G.rock[2] + m * 0.05, st);
    let sn = snowAt(x, z, A, ny);
    if (sn > 0) {   // the snow: a cool blue in the hollows and under the trees, groomed and brighter on the runs, trodden grey in the village
      const hol = sstep(0.58, 0.3, P.n7(x * 0.8, z * 0.8)) * 0.5 + fo * 0.35, k = 0.97 + (m - 0.5) * 0.04;
      let sr = SNOW[0] * k - 0.05 * hol, sg = SNOW[1] * k - 0.03 * hol, sb = SNOW[2] * k;
      sr = lerp(sr, PISTE[0], pi); sg = lerp(sg, PISTE[1], pi); sb = lerp(sb, PISTE[2], pi);
      sr = lerp(sr, 0.8, bu * 0.45); sg = lerp(sg, 0.8, bu * 0.45); sb = lerp(sb, 0.81, bu * 0.45);
      sn *= 1 - 0.75 * Math.max(0, rk - pi) * sstep(0.45, 0.75, P.n6(x, z));   // (rock showing through on the scree)
      r = lerp(r, sr, sn); g = lerp(g, sg, sn); b = lerp(b, sb, sn);
    }
    r = lerp(r, sn > 0.5 ? 0.76 : 0.24, wa * 0.9); g = lerp(g, sn > 0.5 ? 0.82 : 0.32, wa * 0.9); b = lerp(b, sn > 0.5 ? 0.88 : 0.36, wa * 0.9);   // (a lake: ice and snow, or dark water under the surface mesh)
    if (dd < 4) { const t = sstep(4, 0.6, dd) * 0.45; r = lerp(r, sn > 0.5 ? SLUSH[0] : 0.5, t); g = lerp(g, sn > 0.5 ? SLUSH[1] : 0.48, t); b = lerp(b, sn > 0.5 ? SLUSH[2] : 0.4, t); }   // (the trodden, ploughed verge)
    GCOL[0] = r; GCOL[1] = g; GCOL[2] = b; return GCOL;
  }
  function gColAt(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = vrGH(ii, jj);
      const nx = (vrGH(ii + 1, jj) - vrGH(ii - 1, jj)) / (2 * VRC), nz = (vrGH(ii, jj + 1) - vrGH(ii, jj - 1)) / (2 * VRC), c = gCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / Math.hypot(nx, 1, nz), G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }

  /* ---------------- terrain tiles: 100 m, full within S.tileR of the road (or in a zone: the lifts' stations and lower towers), coarse to S.tileR2;
     merged four to a mesh (fewer draw calls) ---------------- */
  let ZN = [];
  function tileOn(ti, tj) {
    const G = API.VR.G, L = VRC * VRT, x = G.x0 + (ti + 0.5) * L, z = G.z0 + (tj + 0.5) * L, d = vrDist(x, z);
    let dz = 1e9; for (const [zx, zz, r] of ZN) dz = Math.min(dz, Math.hypot(x - zx, z - zz) - r);
    return d < S.tileR || dz < 60 ? 1 : d < S.tileR2 || dz < 150 ? 2 : 0;
  }
  function tileGeo(ti, tj, st, pos, nor, col, uv, stp, idx, vo) {   // one tile (every st-th grid vertex) into the arrays at vertex vo; returns the vertex count
    const G = API.VR.G, m = VRT / st, n = m + 1, i0 = ti * VRT, j0 = tj * VRT;
    let k = vo;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = vrGH(i, j);
      let nx = -(vrGH(i + st, j) - vrGH(i - st, j)) / (2 * VRC * st), nz = -(vrGH(i, j + st) - vrGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos.push(x, h, z); nor.push(nx, ny, nz);
      const c = gCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col.push(c[0], c[1], c[2]);
      uv.push(x / 10, -z / 10); stp.push(sstep(0.78, 0.5, ny));
    }
    if (st === 1) {   // an edge shared with a coarse tile runs straight between every other vertex there: the fine tile's in-between vertices onto that line (no cracks)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? tileOn(a, b) : 0);
      const fix = (k0, dk) => { for (let q = 1; q < m; q += 2) { const a = vo + k0 + (q - 1) * dk, b = vo + k0 + (q + 1) * dk; pos[(vo + k0 + q * dk) * 3 + 1] = (pos[a * 3 + 1] + pos[b * 3 + 1]) / 2; } };
      if (nb(ti, tj - 1) === 2) fix(0, 1); if (nb(ti, tj + 1) === 2) fix(m * n, 1); if (nb(ti - 1, tj) === 2) fix(0, n); if (nb(ti + 1, tj) === 2) fix(m, n);
    }
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = vo + b * n + a, q = p + 1, c = p + n, d = c + 1; idx.push(p, c, q, q, c, d); }
    return n * n;
  }

  /* ---------------- the trees (unit height, the instances scale and tint them); snow on their crowns in a snowy world ---------------- */
  function treeGeo(kind, snowy) {
    const g = new GB(), R = rng(9100 + kind.length * 7 + (snowy ? 1 : 0)), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const cap = (x, y, z, r, sy) => { if (snowy) ico(g, x + r * 0.12, y + r * sy * 0.62, z - r * 0.08, r * 0.62, sy * 0.4, vary([0.95, 0.97, 1.0], R, 0.05), R, 0.3); };
    if (kind === 'gum') {   // a snow gum: three crooked, leaning stems, the bark pale and streaked; a broken grey-green crown in clumps
      const bark = [[0.86, 0.82, 0.74], [0.78, 0.74, 0.7], [0.82, 0.72, 0.66]];
      for (let s = 0; s < 3; s++) { const a = s / 3 * TAU + R() * 0.6, lx = Math.cos(a) * 0.12, lz = Math.sin(a) * 0.12;
        ouRod(g, [0, 0, 0], [lx, 0.32, lz], 0.03, bark[s], 5); ouRod(g, [lx, 0.32, lz], [lx * 1.9, 0.58, lz * 1.9], 0.022, bark[(s + 1) % 3], 4); }
      const leaf = [0.36, 0.44, 0.32];
      for (const [x, y, z, r, sy] of [[0, 0.74, 0, 0.3, 0.42], [0.22, 0.62, 0.1, 0.22, 0.48], [-0.2, 0.64, -0.12, 0.23, 0.46], [0.06, 0.6, -0.26, 0.2, 0.5], [-0.1, 0.62, 0.24, 0.2, 0.5]]) {
        ico(g, x, y, z, r, sy, vary(leaf, R, 0.16), R, 0.38); cap(x, y, z, r, sy); }
    } else if (kind === 'fir') {   // a spruce or fir: tiers of drooping branches up a dark trunk, snow along the tiers
      cyl(g, 0, -0.02, 0, 0.035, 0.3, 5, [0.3, 0.24, 0.2], null, 0.03);
      for (let t = 0; t < 5; t++) { const y = 0.16 + t * 0.16, r = 0.36 * (1 - t / 5.6), c = vary([0.16, 0.27, 0.17], R, 0.12);
        ico(g, 0, y + 0.08, 0, r, 0.42, c, R, 0.2); if (snowy) ico(g, 0, y + 0.12, 0, r * 0.82, 0.22, [0.94, 0.96, 1.0], R, 0.2); }
      ico(g, 0, 0.96, 0, 0.08, 1.2, [0.16, 0.27, 0.17], R, 0.1);
    } else if (kind === 'pine') {   // a pine: a tall bare trunk, a flat-topped crown
      cyl(g, 0, -0.02, 0, 0.03, 0.7, 5, [0.42, 0.3, 0.22], null, 0.02);
      for (const [x, y, z, r] of [[0, 0.82, 0, 0.26], [0.18, 0.76, 0.08, 0.18], [-0.16, 0.78, -0.1, 0.18]]) { ico(g, x, y, z, r, 0.4, vary([0.2, 0.32, 0.16], R, 0.14), R, 0.3); cap(x, y, z, r, 0.4); }
    } else {   // 'broad': a round leafy crown on a short trunk
      cyl(g, 0, -0.02, 0, 0.035, 0.42, 5, [0.34, 0.28, 0.22], null, 0.024);
      for (const [x, y, z, r, sy] of [[0, 0.66, 0, 0.32, 0.72], [0.16, 0.54, 0.06, 0.22, 0.8], [-0.15, 0.56, -0.08, 0.22, 0.8]]) { ico(g, x, y, z, r, sy, vary([0.24, 0.38, 0.16], R, 0.16), R, 0.32); cap(x, y, z, r, sy); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  /* ---------------- the animals (S.animals: [{ kind, n }]; unit size, x forward): sheep, goat, mule, cow, monkey, coati, parrot, condor; the birds fly
     (World.update), the others stand by the road in small groups ---------------- */
  const AN = {   // [body colour, length, height, legs]
    sheep: [[0.88, 0.86, 0.8], 1.3, 0.9, [0.16, 0.15, 0.15]], goat: [[0.7, 0.62, 0.52], 1.2, 0.85, [0.3, 0.26, 0.22]], mule: [[0.42, 0.3, 0.22], 2.1, 1.5, [0.2, 0.15, 0.12]],
    cow: [[0.5, 0.32, 0.2], 2.3, 1.45, [0.24, 0.18, 0.14]], monkey: [[0.5, 0.42, 0.34], 0.7, 0.55, [0.36, 0.3, 0.24]], coati: [[0.56, 0.38, 0.22], 0.9, 0.38, [0.24, 0.18, 0.12]],
    parrot: [[0.3, 0.5, 0.22], 0.5, 0.3, null], condor: [[0.1, 0.1, 0.11], 1.2, 0.3, null],
  };
  function animalGeo(kind) {
    const g = new GB(), A = AN[kind] || AN.sheep, [c, L, H, lc] = A, R = rng(9200 + kind.length);
    if (!lc) {   // a bird in flight: a body and two wide wings (the condor's white collar; the parrot's red head)
      const span = kind === 'condor' ? 3.0 : 0.9; box(g, 0, -0.06, 0, L, 0.16, 0.18, 0, c);
      for (const sd of [-1, 1]) g.quadO([-0.1 * L, 0, sd * 0.08], [0.2 * L, 0, sd * 0.08], [0.05 * L, 0.04, sd * span / 2], [-0.3 * L, 0.04, sd * span / 2], c, [0, -1, 0]);
      box(g, L * 0.52, -0.04, 0, 0.18, 0.14, 0.14, 0, kind === 'condor' ? [0.9, 0.88, 0.84] : [0.85, 0.15, 0.1]);
    } else {
      const bh = H * 0.42, by = H * 0.46; box(g, 0, by, 0, L * 0.72, bh, L * 0.32, 0, c);   // body
      for (const [a, b] of [[0.26, 0.11], [0.26, -0.11], [-0.26, 0.11], [-0.26, -0.11]]) box(g, L * a, 0, L * b, L * 0.08, by + 0.02, L * 0.08, 0, lc);   // legs
      const hx = L * 0.42, hy = kind === 'monkey' ? by + bh : by + bh * 0.85; box(g, hx, hy - H * 0.06, 0, L * 0.22, H * 0.24, L * 0.18, 0, kind === 'sheep' ? [0.2, 0.18, 0.17] : vary(c, R, 0.1));   // head
      if (kind === 'goat' || kind === 'cow') for (const sd of [-1, 1]) box(g, hx - L * 0.03, hy + H * 0.16, sd * L * 0.06, L * 0.04, H * 0.14, L * 0.04, 0, [0.85, 0.82, 0.74]);   // horns
      if (kind === 'mule') for (const sd of [-1, 1]) box(g, hx - L * 0.04, hy + H * 0.16, sd * L * 0.05, L * 0.04, H * 0.2, L * 0.03, 0, c);   // long ears
      if (kind === 'monkey' || kind === 'coati') ouRod(g, [-L * 0.36, by + bh * 0.5, 0], [-L * 0.75, by + bh * (kind === 'coati' ? 1.6 : 0.2), 0], L * 0.035, kind === 'coati' ? [0.36, 0.26, 0.18] : c, 4);   // tail
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  /* ---------------- the skiers (one figure, ~1.8 m, facing +x; the instances tint the jacket): legs, jacket, helmet, skis and poles ---------------- */
  function skierGeo() {
    const g = new GB(), dark = [0.14, 0.15, 0.18], jk = [1, 1, 1];
    box(g, 0.02, 0.05, 0, 1.7, 0.04, 0.09, 0, [0.2, 0.2, 0.22]); box(g, 0.02, 0.05, 0.22, 1.7, 0.04, 0.09, 0, [0.2, 0.2, 0.22]);   // skis
    box(g, 0.05, 0.08, 0.11, 0.24, 0.62, 0.36, 0, dark);   // legs, bent
    box(g, 0.12, 0.68, 0.11, 0.3, 0.62, 0.42, 0, jk); box(g, 0.16, 1.32, 0.11, 0.24, 0.24, 0.24, 0, [0.92, 0.92, 0.94]);   // jacket (tinted), helmet
    ouRod(g, [0.2, 0.9, -0.12], [-0.2, 0.08, -0.16], 0.015, dark, 3); ouRod(g, [0.2, 0.9, 0.34], [-0.2, 0.08, 0.38], 0.015, dark, 3);   // poles
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  /* ---------------- the lifts (def.lifts: [kind, seats, [x, z, t, ...]] bottom station first, t 1 a pylon, 2 a station; kinds gondola, chair,
     drag, platter, rope, carpet): steel towers on the pylons (or every ~70 m), the stations (a shed and the bull wheel), the two cables sagging
     between the towers, the chairs, gondola cabins or T-bars moving up one side and down the other (World.update: out.dyn.ext) ---------------- */
  const LK = { gondola: { h: 14, gw: 3.0, gap: 36, v: 5 }, chair: { h: 9.5, gw: 2.3, gap: 24, v: 2.4 }, drag: { h: 6.5, gw: 1.2, gap: 14, v: 3 }, platter: { h: 6, gw: 1.0, gap: 14, v: 3 }, rope: { h: 1.6, gw: 0.6, gap: 0, v: 0 }, carpet: { h: 0, gw: 0, gap: 0, v: 0 } };
  const JACKETS = [[0.86, 0.12, 0.12], [0.12, 0.3, 0.7], [0.95, 0.75, 0.1], [0.1, 0.1, 0.12], [0.2, 0.62, 0.36], [0.95, 0.95, 0.95], [0.9, 0.4, 0.62], [0.36, 0.7, 0.88]];
  function chairGeo(kind, seats, riders) {
    const g = new GB(), dark = [0.18, 0.19, 0.2], seat = [0.22, 0.26, 0.34];
    if (riders && kind === 'chair') { const w = 0.55 * Math.max(2, seats);   // (skiers on the seats: jacket, helmet, legs to the footrest, the skis hanging)
      for (let q = 0; q < seats; q++) { if ((q * 7 + riders * 3) % 5 === 4) continue; const z = -w / 2 + (q + 0.5) * w / seats, jk = JACKETS[(q * 3 + riders * 5) % JACKETS.length];
        box(g, -0.02, -2.68, z, 0.34, 0.62, 0.4, 0, jk); box(g, 0.0, -2.06, z, 0.24, 0.24, 0.24, 0, [0.92, 0.92, 0.94]); box(g, 0.28, -2.66, z, 0.5, 0.16, 0.3, 0, [0.14, 0.15, 0.18]);
        box(g, 0.5, -3.12, z, 0.14, 0.5, 0.26, 0, [0.14, 0.15, 0.18]); box(g, 0.62, -3.2, z - 0.09, 1.6, 0.04, 0.08, 0, [0.2, 0.2, 0.22]); box(g, 0.62, -3.2, z + 0.09, 1.6, 0.04, 0.08, 0, [0.2, 0.2, 0.22]); } }
    if (kind === 'gondola') { ouRod(g, [0, 0, 0], [0, -2.2, 0], 0.05, dark, 4); box(g, 0, -4.4, 0, 2.0, 2.2, 1.8, 0, [0.82, 0.14, 0.1], [0.86, 0.86, 0.88]); box(g, 0, -3.5, 0, 2.04, 0.9, 1.84, 0, [0.12, 0.16, 0.22]); }
    else if (kind === 'chair') { const w = 0.55 * Math.max(2, seats); ouRod(g, [0, 0, 0], [0, -2.4, 0], 0.04, dark, 4); ouRod(g, [0, -2.4, -w / 2], [0, -2.4, w / 2], 0.035, dark, 4);
      box(g, 0.1, -2.75, 0, 0.6, 0.1, w, 0, seat); box(g, -0.18, -2.75, 0, 0.1, 0.62, w, 0, seat); ouRod(g, [0.42, -2.3, -w / 2], [0.42, -2.3, w / 2], 0.03, dark, 4); }
    else { ouRod(g, [0, 0, 0], [0, -2.5, 0], 0.03, dark, 3); if (kind === 'platter') cyl(g, 0, -2.65, 0, 0.18, 0.06, 7, [0.2, 0.2, 0.22], [0.2, 0.2, 0.22]); else ouRod(g, [0, -2.5, -0.5], [0, -2.5, 0.5], 0.035, dark, 3); }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function liftLine(L, gH) {   // the line's tops (where the cable runs over each tower and station) and its length along them
    const [kind, , flat] = L, K = LK[kind] || LK.chair, pts = []; for (let k = 0; k < flat.length; k += 3) pts.push([flat[k], flat[k + 1], flat[k + 2]]);
    const towers = [];   // the towers: the pylons, else every ~70 m between the ends
    const hasP = pts.some(p => p[2] === 1);
    for (let k = 0; k < pts.length; k++) { const end = k === 0 || k === pts.length - 1; if (end || !hasP || pts[k][2] === 1) towers.push({ x: pts[k][0], z: pts[k][1], end }); }
    if (!hasP && towers.length === 2) { const a = towers[0], b = towers[1], n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.z - a.z) / 70)); towers.length = 0; for (let k = 0; k <= n; k++) towers.push({ x: a.x + (b.x - a.x) * k / n, z: a.z + (b.z - a.z) * k / n, end: k === 0 || k === n }); }
    for (const t of towers) { t.y = gH(t.x, t.z); t.top = t.y + (t.end ? Math.min(K.h, 5.2) : K.h); }
    let len = 0; for (let k = 1; k < towers.length; k++) { const a = towers[k - 1], b = towers[k]; b.s = (len += Math.hypot(b.x - a.x, b.z - a.z)); } towers[0].s = 0;
    return { kind, K, towers, len, seats: L[1] || 4 };
  }
  function liftAt(LN, s, side, out) {   // a point of the cable s metres up the line on its side (+1 the up line), with its sag
    const T2 = LN.towers; let k = 1; while (k < T2.length - 1 && T2[k].s < s) k++;
    const a = T2[k - 1], b = T2[k], u = clamp((s - a.s) / Math.max(0.01, b.s - a.s), 0, 1), dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, px = -dz / l, pz = dx / l, gw = LN.K.gw;
    out[0] = a.x + dx * u + px * gw * side; out[1] = a.top + (b.top - a.top) * u - Math.sin(u * Math.PI) * Math.min(1.6, l * 0.012); out[2] = a.z + dz * u + pz * gw * side; out[3] = Math.atan2(dz, dx); return out;
  }

  /* ---------------- the boards: START, FINISH, CP1-4 with the altitude, the race's banner (8 rows of 1024 x 128); the curve signs (a yellow diamond with
     the bent arrow, both ways, or a red-rimmed triangle) ---------------- */
  let atTex = null, atKey = '';
  function atlas(B, cps) {
    const key = JSON.stringify([B, cps]); if (atTex && atKey === key) return atTex; if (atTex) atTex.dispose(); atKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt(B.start, 512, 68, 104, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(272, 142, 480, 100); txt(B.finish, 512, 196, 90, '#111', 460);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = B.cp; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    // row 6: the curve signs (two diamonds, two triangles) and the advisory plates; row 7: the banner
    const dia = (cx, cy, r, dir) => { x.save(); x.translate(cx, cy); x.rotate(Math.PI / 4); x.fillStyle = '#16181c'; x.fillRect(-r, -r, 2 * r, 2 * r); x.fillStyle = '#f2c21b'; x.fillRect(-r + 6, -r + 6, 2 * r - 12, 2 * r - 12); x.restore(); arrow(cx, cy, dir, '#16181c'); };
    const tri = (cx, cy, r, dir) => { x.fillStyle = '#c4161c'; x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * 1.05, cy + r * 0.8); x.lineTo(cx - r * 1.05, cy + r * 0.8); x.fill(); x.fillStyle = '#f6f5f0'; x.beginPath(); x.moveTo(cx, cy - r + 16); x.lineTo(cx + r * 0.8, cy + r * 0.66); x.lineTo(cx - r * 0.8, cy + r * 0.66); x.fill(); arrow(cx, cy + 12, dir, '#16181c', 0.7); };
    const arrow = (cx, cy, dir, col, s) => { s = s || 1; x.strokeStyle = col; x.lineWidth = 9 * s; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - 6 * dir * s, cy + 30 * s); x.lineTo(cx - 6 * dir * s, cy - 2 * s); x.quadraticCurveTo(cx - 6 * dir * s, cy - 18 * s, cx + 12 * dir * s, cy - 20 * s); x.stroke();
      x.fillStyle = col; x.beginPath(); x.moveTo(cx + 26 * dir * s, cy - 20 * s); x.lineTo(cx + 8 * dir * s, cy - 32 * s); x.lineTo(cx + 8 * dir * s, cy - 8 * s); x.fill(); };
    dia(64, 832, 44, 1); dia(192, 832, 44, -1); tri(320, 828, 52, 1); tri(448, 828, 52, -1);
    x.fillStyle = '#f2f0ea'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#c4161c'; x.fillRect(0, 900, 1024, 10); x.fillRect(0, 1010, 1024, 10); txt(B.banner, 512, 962, 76, '#c4161c', 960);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (atTex = t);
  }

  /* ================= the builder ================= */
  function build(scene, tex, opts, style) {
    S = Object.assign({}, DEF, style || {}); for (const k of ['ground', 'road', 'poles', 'trees', 'bld', 'boards']) if (S[k] && DEF[k] && style && style[k]) S[k] = Object.assign({}, DEF[k], style[k]);
    SN = S.snow === 'all' ? 1 : 0; SNL = typeof S.snow === 'number' ? S.snow : 1e9;
    const R = rng(S.seed * 7 + 1), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI, snowy = SN > 0 || SNL < 1e8;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: vrGround, camFloor: vrGround, props: [], farClip: true, ownTex: [], dust: S.dust || (SN ? [0.9, 0.92, 0.96] : [0.7, 0.64, 0.54]), noBirds: true };
    if (SN) { out.ownSeason = true; out.season = 'winter'; }   // (a ski resort in the season: as built in every season, the render's winter adds the falling snow)
    vrPrep(); vrStubs();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    ZN = def.zones || [];
    const isRun = (x, z) => vrLC(x, z) === 6;   // (a ski run: land cover class 6)
    // the buildings (def.bld [x, z, length, width, angle, height (0: unknown), kind]), clear of the road and the side roads
    const blds = [];
    for (const b of def.bld || []) { const [x, z, L, W, ang, hgt, kind] = b; if (L < 2.5 || W < 2.5) continue;
      const c = Math.cos(ang), s = Math.sin(ang); let ok = true;
      for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const px = x + c * u - s * v, pz = z + s * u + c * v, n = vrNear(px, pz); if ((n.i >= 0 && n.dd < 1.5) || vrStubAt(px, pz, 0.8)) ok = false; }
      if (ok) blds.push({ x, z, L: Math.min(L, 46), W: Math.min(W, 26), ang, hgt, kind }); }
    // the car parks (def.pulls [x, z, radius, distance]): a level plot at the road's height
    const pulls = [];
    for (const [x, z, r] of def.pulls || []) { const n = vrNear(x, z); if (n.i < 0) continue; const i = n.i, s = i * T.ds; if (s < 30 || s > T.len - 30) continue;
      if (blds.some(b => Math.hypot(b.x - x, b.z - z) < Math.max(b.L, b.W) / 2 + r * 0.6)) continue;
      const pad = { x, z, r: Math.max(6, Math.min(r, 22)), b: 12, h: T.hy[i] - 0.25, i }; P.pads.push(pad); pulls.push(pad); }
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees and the buildings between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots, lifts) for the trees and the skiers, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    for (const p of pulls) exclPush(p.x, p.z, p.r + 2);
    stubExcl(exclPush);

    /* ---- terrain tiles (four to a mesh), the lakes (ice in a snowy world) ---- */
    let nFar = 0, nTile = 0;
    const tMat = pkGroundMat();
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj += 2) for (let ti = 0; ti < G.ntx; ti += 2) {
        const pos = [], nor = [], col = [], uv = [], stp = [], idx = []; let nv = 0;
        for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) { const i = ti + a, j = tj + b; if (i >= G.ntx || j >= G.ntz) continue; const on = tileOn(i, j); if (!on) continue;
          if (on === 1) { G.on[j * G.ntx + i] = 1; nTile++; } else nFar++; nv += tileGeo(i, j, on, pos, nor, col, uv, stp, idx, nv); }
        if (!nv) continue;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('steep', new THREE.Float32BufferAttribute(stp, 1)); g.setIndex(nv > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1)); g.computeBoundingSphere();
        const m = new THREE.Mesh(g, tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      const wMat = SN ? new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 30, specular: 0x30343a }) : new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 50, specular: 0x24303a });
      const deep = SN ? [0.78, 0.84, 0.9] : [0.1, 0.2, 0.26], shal = SN ? [0.9, 0.92, 0.96] : [0.3, 0.38, 0.36];   // (a snowy world's lake frozen: ice and drifted snow)
      for (const L of P.lakes) {
        const cs = 4, x0 = L.x0 - 8, z0 = L.z0 - 8, nx = Math.ceil((L.x1 - L.x0 + 16) / cs) + 1, nz = Math.ceil((L.z1 - L.z0 + 16) / cs) + 1, wet = new Uint8Array(nx * nz);
        for (let b = 0; b < nz; b++) for (let a = 0; a < nx; a++) wet[b * nx + a] = vrGround(x0 + a * cs, z0 + b * cs) < L.h + 0.4 ? 1 : 0;
        const wc = (a, b) => { const e = vrWater(x0 + a * cs, z0 + b * cs).e; return [0, 1, 2].map(k => lerp(shal[k], deep[k], sstep(1, 10, e))); };
        const g = new GB(true), uv = (q) => [q[0] / 14, -q[2] / 14];
        for (let b = 0; b < nz - 1; b++) for (let a = 0; a < nx - 1; a++) {
          if (!(wet[b * nx + a] | wet[b * nx + a + 1] | wet[(b + 1) * nx + a] | wet[(b + 1) * nx + a + 1])) continue;
          const A = [x0 + a * cs, L.h, z0 + b * cs], B = [A[0] + cs, L.h, A[2]], C = [A[0] + cs, L.h, A[2] + cs], D = [A[0], L.h, A[2] + cs];
          g.quadUp(A, B, C, D, [wc(a, b), wc(a + 1, b), wc(a + 1, b + 1), wc(a, b + 1)], [uv(A), uv(B), uv(C), uv(D)]); }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); }
        exclPush(L.cx, L.cz, Math.max(L.x1 - L.x0, L.z1 - L.z0) / 2 + 6);
      }
      if (P.lakes.length && !SN) out.dyn.water = tex.water;
    }

    /* ---- the road: asphalt with its lines (S.road: white or yellow, a broken centre line, the double unbroken one through the sharper bends, the
       edge lines), gravel where def.surf says (pale with packed snow in a snowy world, no lines), the shoulder, then the verge out past the barrier
       line: a ploughed snowbank in a snowy world (S.snowbanks), else the ditch; the side roads' mouths (120 m chunks) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    const addM = (g, mat, cast, grp) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; (grp || root).add(m); return m; };
    const sw = 0.6, RD = S.road, lineC = RD.line === 'yellow' ? [0.93, 0.74, 0.12] : [0.95, 0.95, 0.92], wht = [0.95, 0.95, 0.92];
    const grv = new Uint8Array(N); if (T.sf) for (let i = 0; i < N; i++) grv[i] = T.sf[i] === 5 ? 1 : 0;
    const gravC = SN ? [0.84, 0.85, 0.88] : RD.gravel, snowRd = [0.83, 0.84, 0.88];
    const SB = stubGeo({ gCol: gColAt, edge: 'dash', line: RD.line === 'none' ? 'none' : 'dash', paveC: RD.paveC, gravC, shC: SN ? [0.8, 0.8, 0.81] : RD.gravel });
    const bankH = (i, side) => (S.snowbanks && SN ? 0.55 + 0.35 * rpHash(i >> 3, side + 5) : 0);
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = T.wAt ? T.wAt(i) : w;
      const ms = stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;
      const y = T.hy[i], gAt = (o) => { const q = side * o; return vrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      const bk = bankH(i, side); if (bk > 0) return [[e + sw, -0.02], [e + sw + 0.7, bk], [Math.max(e + sw + 1.6, bar - 0.3), bk * 0.8], lift(bar + 1.15, -0.1), [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (the snowbank, ploughed off the road)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    const bendAt = new Uint8Array(N);
    if (RD.double) for (const c of T.corners) if (c.sev >= 2) for (let k = Math.max(0, c.i0 - 25); k <= Math.min(N - 1, c.i1 + 25); k++) bendAt[k] = 1;
    {
      const tileL = 8, gc = SN ? [0.66, 0.67, 0.69] : RD.shoulder;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.84 - 0.13 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i], bk = bankH(i, side) > 0 && !SB.mouthV[si][i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (bk && k <= 2) return k === 0 ? [0.66, 0.66, 0.67] : k === 1 ? [0.9, 0.91, 0.94] : [0.95, 0.96, 0.99];   // (the bank: grey slush at its foot, white on top)
          if (k === 4) return gColAt(x, z);
          const sl = k === 2 ? vrSlope(x, z) : 0; return gCol(x, z, T.hy[i] + y, 1 / Math.sqrt(1 + sl * sl), Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, wi = T.wAt ? T.wAt(i) : w, wj = T.wAt ? T.wAt(j) : w, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6, gv2 = grv[i] || grv[j];
          const nq = gv2 && SN ? 8 : 4;
          for (let c = 0; c < nq; c++) { const f0 = c / nq * 2 - 1, f1 = (c + 1) / nq * 2 - 1, a0 = f0 * wi, a1 = f1 * wi, b0 = f0 * wj, b1 = f1 * wj;
            if (gv2 && SN) { const tc = (f, q) => { const k = (0.97 + 0.04 * rpHash(q, Math.round(f * 8) + 20)) * (1 - 0.13 * Math.exp(-(((Math.abs(f) - 0.5) / 0.16) ** 2))); return [snowRd[0] * k, snowRd[1] * k, snowRd[2] * k]; };   // (packed snow, the wheels' tracks darker)
              gv.quadUp(Pt(i, a0, 0.02), Pt(i, a1, 0.02), Pt(j, b1, 0.02), Pt(j, b0, 0.02), [tc(f0, i), tc(f1, i), tc(f1, j), tc(f0, j)], [wuv(Pt(i, a0, 0)), wuv(Pt(i, a1, 0)), wuv(Pt(j, b1, 0)), wuv(Pt(j, b0, 0))]); }
            else if (gv2) { const k0 = 0.92 + 0.08 * rpHash(i, c), cc = [gravC[0] * k0, gravC[1] * k0, gravC[2] * k0]; gs.quadUp(Pt(i, a0, 0.02), Pt(i, a1, 0.02), Pt(j, b1, 0.02), Pt(j, b0, 0.02), [cc, cc, cc, cc], [[a0 / 4, s0], [a1 / 4, s0], [b1 / 4, s1], [b0 / 4, s1]]); }
            else gr.quadUp(Pt(i, a0, 0.02), Pt(i, a1, 0.02), Pt(j, b1, 0.02), Pt(j, b0, 0.02), [shade(i, a0), shade(i, a1), shade(j, b1), shade(j, b0)], [[(a0 + wi) / tileL, v0], [(a1 + wi) / tileL, v0], [(b1 + wj) / tileL, v1], [(b0 + wj) / tileL, v1]]); }
          if (!gv2 && RD.line !== 'none') {
            const ln = RD.edge ? [...SB.edges(i, j, [[-(wi - 0.3), -(wi - 0.45)], [wi - 0.45, wi - 0.3]])] : [];
            if (bendAt[i] || bendAt[j]) ln.push([-0.26, -0.14], [0.14, 0.26]); else if (i % 6 < 2) ln.push([-0.06, 0.06]);   // (the double unbroken line; the broken one: 4 m dashes, 8 m gaps)
            for (const [o0, o1] of ln) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1 * wj / wi, 0.036), Pt(j, o0 * wj / wi, 0.036), [lineC, lineC, lineC, lineC]);
          }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            (SN ? gv : gs).quadUp(Pt(i, side * wi, 0.012), Pt(i, side * (wi + sw), -0.02), Pt(j, side * (wj + sw), -0.02), Pt(j, side * wj, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 0 && qi[1][1] > 0.2) gv.quadO(a, b, c, d, null, Pt(i, side * (qi[0][0] + 3), -2), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the bank's face to the road)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        SB.emit(c0, c0 + 60, gr, SN ? gv : gs, gl);   // (in a snowy world the side roads' gravel and shoulders packed snow on the grit)
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // chequered start and finish lines, a white line at each checkpoint
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- scenery (vertex coloured, 130 m chunks) ---- */
    const scen = new Chunks(130), fac = new Chunks(130, true), ban = new GB(true), W1 = [1, 1, 1];
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const CR = crowdCtx({ gH: vrGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => vrWater(x, z).e > -4, shirts: S.crowd }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        ban.quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol, SN ? [0.94, 0.95, 0.98] : null);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], Math.min(12.8, L1 + L2 - 1), 1.6 * Math.min(12.8, L1 + L2 - 1) / 12.8, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const carCols = [[0.86, 0.86, 0.84], [0.62, 0.12, 0.1], [0.14, 0.26, 0.5], [0.16, 0.16, 0.18], [0.5, 0.52, 0.55], [0.24, 0.36, 0.26], [0.76, 0.66, 0.5], [0.94, 0.94, 0.92]];
    const parked = (g, x, y, z, rot, RC) => { caCar(g, x, y, z, rot, vary(carCols[Math.floor(RC() * carCols.length)], RC, 0.12)); if (SN) { const c = Math.cos(rot), s = Math.sin(rot); box(g, x - c * 0.35, y + 1.67, z - s * 0.35, 2.1, 0.08, 1.5, rot, [0.95, 0.96, 0.99]); } };
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the buildings: lodges and chalets (timber, coloured walls, bands of windows; steep roofs, snow on them in a snowy world), blocks, sheds, huts ---- */
    let nBld = 0;
    {
      const RB = rng(S.seed * 7 + 2), roofSnow = [0.93, 0.95, 0.99];
      const lowHigh = (b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9; for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = vrGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
      const roofOf = () => (SN ? vary(roofSnow, RB, 0.03) : vary(S.bld.roofs[Math.floor(RB() * S.bld.roofs.length)], RB, 0.1));
      for (const b of blds) {
        const g = scen.get(b.x, b.z), [lo, hi] = lowHigh(b);
        if (b.kind === 2) { const col = vary([0.6, 0.62, 0.6], RB, 0.12); box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 0.3 + 4.2, b.W, b.ang, col, null, true); gable(g, b.x, hi + 3.9, b.z, b.L + 0.6, b.W + 0.6, Math.min(b.L, b.W) * 0.18, b.ang, roofOf(), col); }
        else if (b.kind === 3) { const wd = vary([0.5, 0.36, 0.22], RB, 0.12); box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 0.3 + 2.5, b.W, b.ang, wd, null, true); gable(g, b.x, hi + 2.2, b.z, b.L + 0.6, b.W + 0.6, Math.min(b.L, b.W) * 0.45, b.ang, roofOf(), wd); }
        else {
          const fl = b.kind === 1 ? clamp(Math.round((b.hgt || 12) / 2.9), 3, 5) : b.hgt ? clamp(Math.round(b.hgt / 2.9), 1, 5) : b.L * b.W > 220 ? 3 + (RB() < 0.4 ? 1 : 0) : 2 + (RB() < 0.5 ? 1 : 0), wall = vary(S.bld.walls[Math.floor(RB() * S.bld.walls.length)], RB, 0.1);
          lodge(g, fac.get(b.x, b.z), b.x, lo, hi, b.z, b.ang, b.L, b.W, fl, { wall, wall2: vary(wall, RB, 0.1), roof: roofOf(), trim: [0.3, 0.24, 0.18], flat: b.kind === 1 && b.L * b.W > 500 });
        }
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++;
      }
    }

    /* ---- START: gantry with the start lights, the timing hut, pennants along the grid, the road closed behind it; the checkpoints; FINISH ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const ts = T.def.leftHand ? 1 : -1, [hx, hz] = onSide(sStart - 5, ts, 3.2), hy = vrGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut, on the side away from the traffic's kerb
      if (!excluded(hx, hz) && !vrStubAt(hx, hz, 1)) { box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.86, 0.84, 0.78], [0.4, 0.28, 0.18], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true);
        gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.1, T.hd[i], SN ? [0.93, 0.95, 0.99] : [0.22, 0.32, 0.26], [0.86, 0.84, 0.78]); exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]); }
      const pc = [[0.84, 0.14, 0.14], [0.98, 0.8, 0.1], [0.95, 0.95, 0.95], [0.14, 0.26, 0.6]];
      for (let s = Math.max(8, sStart - 120), k = 0; s < sStart + 50; s += 12, k++) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3); if (excluded(px, pz) || vrStubAt(px, pz, 1)) continue;   // pennants on poles
        const g = scen.get(px, pz), py = vrGround(px, pz); cyl(g, px, py - 0.2, pz, 0.05, 5.2, 5, [0.9, 0.9, 0.92]);
        const tri = (yy, c) => { const a = [px, py + yy, pz], b = [px, py + yy - 1.0, pz], cc = [px + T.tx[ii] * 1.6, py + yy - 0.5, pz + T.tz[ii] * 1.6]; g.triO(a, b, cc, c, [px - T.nx[ii], py + yy, pz - T.nz[ii]]); g.triO(a, cc, b, c, [px + T.nx[ii], py + yy, pz + T.nz[ii]]); };
        tri(4.9, pc[(k + (side > 0 ? 1 : 0)) % 4]); }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete barriers across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, -ts, 1.6), by = vrGround(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        if (!excluded(bx, bz) && !vrStubAt(bx, bz, 1)) { const gb = scen.get(bx, bz); for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
          bannerQ(bx, by + 1.5, bz, -T.nx[bi] * -ts, -T.nz[bi] * -ts, 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); } }
    }
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.55, 0.12, 0.12]));
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4); if (vrStubAt(px, pz, 1) || excluded(px, pz)) continue; const py = vrGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road drawn: concrete barriers across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
    }

    /* ---- the car parks: cars (snow on their roofs in a snowy world) ---- */
    for (const p of pulls) {
      const RC = rng(S.seed * 7 + 3 + p.i), hh = T.hd[p.i], c = Math.cos(hh), sn = Math.sin(hh), n = Math.min(10, Math.floor(p.r / 2.4));
      for (let k = 0; k < n; k++) { if (RC() < 0.35) continue; const a = (k % 5 - 2) * 5, b = (k < 5 ? -1 : 1) * 3.2, px = p.x - sn * b + c * a, pz = p.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || excluded(px, pz) && Math.hypot(px - p.x, pz - p.z) > p.r) continue; parked(scen.get(px, pz), px, vrGround(px, pz), pz, hh + PI / 2 + (RC() < 0.5 ? 0 : PI), RC); }
    }

    /* ---- the lifts ---- */
    const lines = [], chairs = [];
    let nLift = 0, nTower = 0;
    if (S.lifts) {
      const steel = [0.56, 0.58, 0.6], dark = [0.2, 0.21, 0.22], cab = new GB();
      for (const L of def.lifts || []) {
        const LN = liftLine(L, vrGround), K = LN.K, near = (x, z) => vrDist(x, z) < 230;
        if (!LN.towers.some(t => near(t.x, t.z))) continue; nLift++;
        if (L[0] === 'carpet') {   // a moving carpet: a low belt with its canopy rails, along the line
          const t0 = LN.towers[0], t1 = LN.towers[LN.towers.length - 1], rot = Math.atan2(t1.z - t0.z, t1.x - t0.x), len = Math.hypot(t1.x - t0.x, t1.z - t0.z);
          for (let s = 0; s < len; s += 4) { const x = t0.x + Math.cos(rot) * s, z = t0.z + Math.sin(rot) * s, y = vrGround(x, z), g = scen.get(x, z); box(g, x, y - 0.1, z, 4.1, 0.38, 1.2, rot, [0.2, 0.21, 0.22]); ouRod(g, [x, y + 0.3, z - 0.75], [x, y + 1.0, z - 0.75], 0.03, [0.7, 0.72, 0.74], 3); }
          for (let s = 0; s < len; s += 3) exclPush(t0.x + Math.cos(rot) * s, t0.z + Math.sin(rot) * s, 2.5); continue;
        }
        for (let k = 0; k < LN.towers.length; k++) {
          const t = LN.towers[k], nx2 = LN.towers[Math.min(LN.towers.length - 1, k + 1)], pv = LN.towers[Math.max(0, k - 1)], rot = Math.atan2(nx2.z - pv.z, nx2.x - pv.x);
          if (!near(t.x, t.z)) continue; const g = scen.get(t.x, t.z);
          if (t.end) {   // a station: the shed, the bull wheel under its frame, snow on the roof
            const bk = k === 0 ? -1 : 1, sx = t.x + Math.cos(rot) * 3.2 * bk, sz = t.z + Math.sin(rot) * 3.2 * bk;
            box(g, sx, t.y - 0.4, sz, 7, 3.6, 5.2, rot, [0.62, 0.56, 0.44], null, true); gable(g, sx, t.y + 3.2, sz, 7.6, 5.8, 1.4, rot, SN ? [0.93, 0.95, 0.99] : [0.36, 0.4, 0.36], [0.62, 0.56, 0.44]);
            box(g, t.x, t.y, t.z, 0.8, t.top - t.y - 0.2, 0.8, rot, steel); cyl(g, t.x, t.top - 0.2, t.z, K.gw, 0.3, 12, dark, dark); exclPush(sx, sz, 7);
          } else {   // a tower: the column, its cross arm, the sheave trains at both ends of the arm
            box(g, t.x, t.y - 0.3, t.z, 0.55, t.top - t.y + 0.3, 0.55, rot, steel); box(g, t.x, t.top, t.z, 0.35, 0.3, K.gw * 2 + 0.6, rot, steel);
            for (const sd of [-1, 1]) box(g, t.x - Math.sin(rot) * K.gw * sd, t.top - 0.25, t.z + Math.cos(rot) * K.gw * sd, 1.6, 0.22, 0.2, rot, dark);
            nTower++; exclPush(t.x, t.z, 2.5);
          }
        }
        if (!K.gap) continue;
        const pt = [0, 0, 0, 0], pq = [0, 0, 0, 0];   // the cables: both lines, in 6 m pieces, only where they are near the road
        for (const side of [-1, 1]) for (let s = 0; s < LN.len - 0.1; s += 6) { const s2 = Math.min(LN.len, s + 6); liftAt(LN, s, side, pt); liftAt(LN, s2, side, pq); if (!near(pt[0], pt[2]) && !near(pq[0], pq[2])) continue; ouRod(cab, [pt[0], pt[1], pt[2]], [pq[0], pq[1], pq[2]], 0.05, dark, 3); }
        lines.push(LN);
        // the chairs only on the stretch of the line near the road (the camera sees no farther), going round within it: out of sight at its ends
        let sA = 1e9, sB = -1e9; for (let s = 0; s <= LN.len; s += 5) { liftAt(LN, s, 1, pt); if (near(pt[0], pt[2])) { sA = Math.min(sA, s); sB = Math.max(sB, s); } }
        if (sB - sA < K.gap) continue; LN.sA = sA; LN.sB = sB;
        const n = Math.floor((sB - sA) / K.gap);
        for (const side of [-1, 1]) for (let k = 0; k < n; k++) chairs.push({ LN, side, s0: (k + (side > 0 ? 0 : 0.5)) * K.gap });
      }
      addM(cab, lMat, true);
    }
    // the chairs (gondola cabins, T-bars) moving: one instanced mesh per kind of carrier, World.update moves them (out.dyn.ext)
    const movers = [];
    {
      const groups = new Map(); for (const c of chairs) { const rd = c.LN.kind === 'chair' && c.side > 0 && rpHash(Math.round(c.s0), c.LN.towers.length) < 0.7 ? 1 + (Math.round(c.s0 / c.LN.K.gap) % 2) : 0;   // (most chairs going up carry skiers)
        const k = c.LN.kind + '/' + (c.LN.kind === 'chair' ? c.LN.seats : '') + '/' + rd; let L = groups.get(k); if (!L) groups.set(k, L = []); c.rd = rd; L.push(c); }
      for (const [, list] of groups) { const LN = list[0].LN, g = chairGeo(LN.kind, LN.seats, list[0].rd);
        const im = new THREE.InstancedMesh(g, matV, list.length); im.castShadow = true; im.receiveShadow = false; im.frustumCulled = false; root.add(im);
        const cc = new THREE.Color(); for (let k = 0; k < list.length; k++) { cc.setRGB(1, 1, 1); im.setColorAt(k, cc); }
        movers.push({ im, list }); }
    }
    // the ski area's kit by the road (a ski world, S.skiers): snow groomers parked by the lifts' bottom stations, snow guns (fan guns on their
    // stands, tall lances) along the runs beside the road
    let nGroom = 0, nGun = 0;
    if (S.skiers && S.lifts) {
      const RK = rng(S.seed * 7 + 8), red = [0.8, 0.13, 0.1], dark = [0.13, 0.13, 0.15], grey = [0.56, 0.58, 0.6];
      for (const LN of lines) { if (nGroom >= 3) break; const t0 = LN.towers[0], t1 = LN.towers[1] || t0; if (vrDist(t0.x, t0.z) > 110) continue;
        const rot = Math.atan2(t1.z - t0.z, t1.x - t0.x) + PI / 2 + (RK() - 0.5), d = 13 + RK() * 6, x = t0.x + Math.cos(rot) * d, z = t0.z + Math.sin(rot) * d;
        if (vrNear(x, z).dd < 6 || excluded(x, z) || vrSlope(x, z) > 0.35) continue; const y = vrGround(x, z), g = scen.get(x, z), c = Math.cos(rot), s = Math.sin(rot), P2 = (u, v) => [x + c * u - s * v, z + s * u + c * v];
        for (const sd of [-1, 1]) { const [px, pz] = P2(0, sd * 1.25); box(g, px, y, pz, 4.4, 0.8, 0.75, rot, dark); }   // the tracks
        box(g, x, y + 0.7, z, 4.0, 1.0, 2.2, rot, red); { const [px, pz] = P2(0.4, 0); box(g, px, y + 1.7, pz, 1.8, 1.15, 1.9, rot, [0.16, 0.2, 0.26], red); }   // the body, the cab
        { const [px, pz] = P2(2.75, 0); box(g, px, y + 0.15, pz, 0.3, 0.95, 4.1, rot, grey); } { const [px, pz] = P2(-2.6, 0); box(g, px, y + 0.25, pz, 1.1, 0.45, 3.6, rot, grey); }   // the blade, the tiller
        exclPush(x, z, 4.5); nGroom++; }
      for (let s0 = 40; s0 < T.len - 40 && nGun < 14; s0 += 55) for (const side of [-1, 1]) {
        if (nGun >= 14 || RK() < 0.35) continue; let spot = null; for (let o = 12; o <= 40; o += 4) { const [x, z] = onSide(s0, side, o); if (isRun(x, z) && !excluded(x, z) && vrNear(x, z).dd > 8) { spot = [x, z]; break; } }
        if (!spot) continue; const [x, z] = spot, y = vrGround(x, z), g = scen.get(x, z), rot = RK() * TAU, c = Math.cos(rot), s = Math.sin(rot);
        if (RK() < 0.55) { cyl(g, x, y - 0.1, z, 0.12, 1.5, 6, grey, grey); box(g, x, y + 1.3, z, 1.2, 0.95, 0.95, rot, [0.95, 0.76, 0.12]); box(g, x + c * 0.62, y + 1.38, z + s * 0.62, 0.06, 0.8, 0.8, rot, dark); }   // a fan gun
        else { const h = 6 + RK() * 2, tx = x + c * h * 0.45, tz = z + s * h * 0.45; ouRod(g, [x, y - 0.2, z], [tx, y + h, tz], 0.07, grey, 5); box(g, tx, y + h - 0.1, tz, 0.3, 0.3, 0.3, rot, dark); }   // a lance
        exclPush(x, z, 2); nGun++; }
    }
    const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), tmp = [0, 0, 0, 0];
    const moveChairs = (t) => { for (const M of movers) { const L = M.list; for (let k = 0; k < L.length; k++) { const c = L[k], LN = c.LN, len = LN.sB - LN.sA, s = LN.sA + ((c.s0 + t * LN.K.v * c.side) % len + len) % len;
      liftAt(LN, s, c.side, tmp); eu.set(0, -tmp[3] + (c.side > 0 ? 0 : PI), 0); qt.setFromEuler(eu); v3.set(tmp[0], tmp[1], tmp[2]); m4.compose(v3, qt, one); M.im.setMatrixAt(k, m4); }
      M.im.instanceMatrix.needsUpdate = true; } };

    /* ---- guardrails where the ground falls away and round the outside of the sharper bends (not in the village), snow poles (S.poles) just past the
       barrier line, white guide posts on the verge (knockable) ---- */
    let nRail = 0, nPole = 0;
    {
      const need = [new Uint8Array(N), new Uint8Array(N)], poleSpots = [], postSpots = [];
      if (S.rails) { for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
        for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
          for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d); if (vrGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } } }
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), steel = [0.8, 0.82, 0.84], steelB = [0.56, 0.58, 0.6], postC = [0.56, 0.57, 0.6];
      const nearPad = (i) => { for (const p of pulls) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 6) return true; return false; };
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || nearPad(i) || vrLCf(T.px[i], T.pz[i], 3) > 0.5) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        stubRails(nd, side); nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]), mv = SB.mouthV[side > 0 ? 1 : 0][i];
          if (nd[i] && nd[i + 1]) { const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino); if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); } }
          if (S.poles && i % S.poles.every === (side > 0 ? 0 : 7) && i > 4 && i < iE - 4 && !nearPad(i) && !mv && vrLCf(T.px[i], T.pz[i], 3) < 0.5) poleSpots.push([i, side]);
          if (S.posts && i % 25 === (side > 0 ? 3 : 15) && i > 4 && i < iE - 4 && !nearPad(i) && !mv) postSpots.push([i, side]);
        }
      }
      out.propR = 150; out.propFloor = propFloorTable(null, (i, side) => vp[side > 0 ? 1 : 0][i]);
      const sA = sStart + 30, sB = sFin - 30;
      out.propStats = roadsideProps(out.props, { spots: postSpots, postEdge: [1.0, 1.4], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
        floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
      if (S.poles) { const PO = S.poles; for (const [i, side] of poleSpots) {   // the snow poles: tall, coloured with dark bands
        const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y0 = Math.min(T.hy[i], vrGround(x, z)) - 0.15, g = scen.get(x, z), H = PO.h;
        for (let b = 0; b < 6; b++) box(g, x, y0 + H * b / 6, z, 0.09, H / 6, 0.09, T.hd[i], b === 5 || b === 3 ? PO.band : PO.col, null, true); nPole++; } }
    }
    out.stubStats = stubProps({ scen, out, root, gH: vrGround, loc: { closed: S.boards.closed, gate: S.boards.gate }, posts: 'none' });

    /* ---- the curve signs: 90 m before each bend over 70 degrees, on the kerb side (left where they drive on the left), facing the cars coming ---- */
    let nSign = 0;
    if (S.signs) for (const [d, , dir, deg] of def.bends || []) {
      if (deg < 70 || d < 40) continue; const sd = T.def.leftHand ? -1 : 1, [px, pz, ii] = onSide(sStart + d - 90, sd, 0.9); if (excluded(px, pz) || vrStubAt(px, pz, 1.5)) continue;
      const py = vrGround(px, pz), g = scen.get(px, pz), u0 = S.signs === 'triangle' ? (dir > 0 ? 2 : 3) / 8 : (dir > 0 ? 0 : 1) / 8;
      box(g, px, py - 0.2, pz, 0.08, 2.5, 0.08, T.hd[ii], [0.6, 0.61, 0.63]); bannerQ(px, py + 1.55, pz, -T.tx[ii], -T.tz[ii], 0.95, 0.95, 1 / 8, 2 / 8, u0, u0 + 1 / 8); exclPush(px, pz, 1.5); nSign++;
    }

    /* ---- spectators: the start and the finish, the checkpoints, a few groups along the road ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: SN ? 0 : 0.25, flag: 0.12, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 60, sStart + 60, sd, { rows: 2, dens: 0.55, label: 'GO start' }); run(sFin - 70, sFin + 12, sd, { rows: 2, dens: 0.55, label: 'GO finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 20, s0 + 16, side, { rows: 2, dens: 0.5, label: 'GO cp' }); });
      for (const [d, , dir, deg] of def.bends || []) if (deg > 100) run(sStart + d - 18, sStart + d + 18, -dir, { rows: 2, dens: 0.4, flag: 0.18, label: 'GO bend' });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the ski runs by the road: skiers (some standing in groups, some gliding down the fall line: World.update), safety nets where a run comes
       down to the road ---- */
    const skiMov = []; let nSki = 0, nNet = 0;
    if (S.nets) {
      const net = [0.96, 0.42, 0.08];
      for (const side of [-1, 1]) { let run = 0;
        for (let i = 0; i < N - 1; i++) { const [x, z] = onSide(i * T.ds, side, 1.8 + 6); const on = isRun(x, z) && !SB.mouthV[side > 0 ? 1 : 0][i] && i > 3 && i < iE - 3; run = on ? run + 1 : 0;
          if (!on || run < 2) continue; const [ax, az, ia] = onSide(i * T.ds, side, 1.9), [bx, bz, ib] = onSide((i + 1) * T.ds, side, 1.9), ay = vrGround(ax, az), by = vrGround(bx, bz), g = scen.get(ax, az);
          const A = [ax, ay + 0.05, az], B = [bx, by + 0.05, bz], C = [bx, by + 1.3, bz], D = [ax, ay + 1.3, az]; g.quadO(A, B, C, D, net, [T.px[ia], ay, T.pz[ia]]); g.quadO(A, B, C, D, [0.8, 0.34, 0.06], [ax + (ax - T.px[ia]), ay, az + (az - T.pz[ia])]);
          if (i % 2 === 0) ouRod(g, [ax, ay - 0.2, az], [ax, ay + 1.45, az], 0.035, [0.3, 0.3, 0.32], 4); nNet++; } }
    }
    const skier = S.skiers ? new IChunks(skierGeo(), matV, 600) : null;
    if (S.skiers) {
      const RS = rng(S.seed * 7 + 5), jk = [[0.86, 0.12, 0.12], [0.12, 0.3, 0.7], [0.95, 0.75, 0.1], [0.1, 0.1, 0.12], [0.2, 0.62, 0.36], [0.95, 0.95, 0.95], [0.9, 0.4, 0.62], [0.36, 0.7, 0.88]];
      let tries = 0; const nMax = Math.round(S.skiers * dens);
      while (nSki < nMax && tries++ < nMax * 60) {
        const s = RS() * T.len, side = RS() < 0.5 ? -1 : 1, [x, z] = onSide(s, side, 5 + Math.pow(RS(), 1.3) * 60); if (!isRun(x, z) || excluded(x, z) || vrNear(x, z).dd < 4) continue;
        const y = vrGround(x, z), sl = vrSlope(x, z); if (sl > 0.75) continue;
        const gx = vrGround(x + 2, z) - vrGround(x - 2, z), gz = vrGround(x, z + 2) - vrGround(x, z - 2), fall = Math.atan2(-gz, -gx), col = jk[Math.floor(RS() * jk.length)];
        if (RS() < 0.4 && sl > 0.08) skiMov.push({ x, z, fall, v: 3 + RS() * 5, ph: RS() * 40, len: 25 + RS() * 30, col });   // (a moving one: its own instance below)
        else skier.add(x, y, z, -fall + (RS() - 0.5) * 1.2, 1, 1, col);
        nSki++;
      }
      skier.addTo(root, true);
    }
    let skiIm = null;
    if (skiMov.length) { skiIm = new THREE.InstancedMesh(skierGeo(), matV, skiMov.length); skiIm.castShadow = true; skiIm.frustumCulled = false; const cc = new THREE.Color(); skiMov.forEach((m, k) => { cc.setRGB(m.col[0], m.col[1], m.col[2]); skiIm.setColorAt(k, cc); }); root.add(skiIm); }
    const moveSkiers = (t) => { if (!skiIm) return; for (let k = 0; k < skiMov.length; k++) { const m = skiMov[k], u = ((t * m.v + m.ph) % m.len), x = m.x + Math.cos(m.fall) * (u - m.len / 2), z = m.z + Math.sin(m.fall) * (u - m.len / 2), y = vrGround(x, z);
      eu.set(0, -m.fall + 0.35 * Math.sin(t * 1.6 + m.ph), 0); qt.setFromEuler(eu); v3.set(x, y, z); m4.compose(v3, qt, one); skiIm.setMatrixAt(k, m4); } skiIm.instanceMatrix.needsUpdate = true; };

    /* ---- the trees by the land cover (instanced per 96 m chunk): none on the runs, the water, the plots, the road ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut), TK = S.trees.kinds;
    const tk = TK.map(k => new IChunks(treeGeo(k, snowy && SN > 0), tMatT, 96));
    let nTrees = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(60000 * dens), RT = rng(S.seed * 7 + 6), SP = 5 / Math.sqrt(dens), TR = S.trees;
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > S.tileR) continue;
          if (hd > 90 && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;
          const c = vrLC(x, z), p = c === 1 ? TR.forest : c === 2 ? TR.forest * 0.25 : c === 0 ? TR.open : c === 3 ? TR.open * 1.2 : 0;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < TR.near) continue; if (nn.i >= 0 && nn.dd < 6 && r2 < 0.3) continue;
          if (excluded(x, z) || vrWater(x, z).e > -4 || vrSlope(x, z) > 1.2) continue;
          const sp = Math.floor(r3 * TK.length), far = hd > 90 ? 1.12 : 1, hgt = TR.h[0] + r4 * (TR.h[1] - TR.h[0]), wid = hgt * (TK[sp] === 'fir' ? 0.42 + r2 * 0.1 : TK[sp] === 'gum' ? 0.9 + r2 * 0.3 : 0.75 + r2 * 0.25);
          tk[sp].add(x, vrGround(x, z) - 0.15, z, r1 * 70, wid * far, hgt * far, [0.92 + r2 * 0.16, 0.94 + r4 * 0.12, 0.92 + r3 * 0.14]);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);

    /* ---- the rock: grey boulders at the foot of the cuts and tors on the steep slopes beside the road (snow on their tops) ---- */
    if (S.rocks) {
      const RV = rng(S.seed * 7 + 7), grey = [[0.6, 0.6, 0.58], [0.56, 0.55, 0.52], [0.64, 0.63, 0.6], [0.52, 0.52, 0.5]];
      API.ROCK_SMOOTH = false;
      for (let s = 10; s < T.len - 10; s += 8) for (const side of [-1, 1]) {
        if (RV() > 0.3) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 30, [x, z] = onSide(s, side, o), sz = 0.4 + RV() * 1.2; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || isRun(x, z)) continue;
        const y = vrGround(x, z), sl = vrSlope(x, z); if (sl < 0.35 && vrLC(x, z) !== 4) continue;
        const g = scen.get(x, z), rot = RV() * TAU; rock(g, x, y + sz * 0.3, z, sz * 1.25, sz, sz, rot, vary(grey[Math.floor(RV() * grey.length)], RV, 0.1), RV, 0.28);
        if (SN) rock(g, x, y + sz * 0.62, z, sz * 1.0, sz * 0.32, sz * 0.8, rot, [0.94, 0.95, 0.99], RV, 0.2);
      }
    }

    /* ---- the animals (S.animals: [{ kind, n }]): small groups beside the road; the birds circle over it (World.update) ---- */
    const birds = []; let nAnimal = 0;
    for (const A of S.animals || []) {
      const RA = rng(S.seed * 7 + 11 + A.kind.length), geo = animalGeo(A.kind), fly = !AN[A.kind] || !AN[A.kind][3];
      if (fly) { const im = new THREE.InstancedMesh(geo, matV, A.n); im.castShadow = true; im.frustumCulled = false; root.add(im);
        const list = []; for (let k = 0; k < A.n; k++) { const i = T.idx(RA() * T.len); list.push({ cx: T.px[i] + (RA() - 0.5) * 60, cz: T.pz[i] + (RA() - 0.5) * 60, cy: T.hy[i] + 25 + RA() * 25, r: 20 + RA() * 25, v: 0.15 + RA() * 0.1, ph: RA() * TAU }); }
        birds.push({ im, list, k: A.kind === 'condor' ? 1 : 0.45 }); nAnimal += A.n; continue; }
      const ic = new IChunks(geo, matV, 128); let n = 0, tries = 0;
      while (n < A.n && tries++ < A.n * 40) { const s = RA() * T.len, side = RA() < 0.5 ? -1 : 1, [x0, z0] = onSide(s, side, 2 + RA() * 18), herd = 1 + Math.floor(RA() * 4);
        for (let q = 0; q < herd && n < A.n; q++) { const x = x0 + (RA() - 0.5) * 6, z = z0 + (RA() - 0.5) * 6; if (vrNear(x, z).dd < 1 || excluded(x, z) || vrSlope(x, z) > 0.9 || vrWater(x, z).e > -2) continue;
          const sc = 0.85 + RA() * 0.3; ic.add(x, vrGround(x, z), z, RA() * TAU, sc, sc, [0.9 + RA() * 0.2, 0.9 + RA() * 0.2, 0.9 + RA() * 0.2]); n++; } }
      ic.addTo(root, true); nAnimal += n;
    }
    const moveBirds = (t) => { for (const B of birds) { for (let k = 0; k < B.list.length; k++) { const b = B.list[k], a = b.ph + t * b.v, x = b.cx + Math.cos(a) * b.r, z = b.cz + Math.sin(a) * b.r;
      eu.set(Math.sin(t * 2 + b.ph) * 0.15, -a - PI / 2, -0.3); qt.setFromEuler(eu); v3.set(x, b.cy, z); m4.compose(v3, qt, v3.clone().setScalar(B.k * 1.6)); B.im.setMatrixAt(k, m4); } B.im.instanceMatrix.needsUpdate = true; } };

    /* ---- the track's own things ---- */
    const ctx = { out, root, scen, fac, R, P, S, excluded, exclPush, onSide, bannerQ, gCol, gColAt, pulls, blds, CR, isRun, lines };
    if (typeof S.extra === 'function') S.extra(ctx);

    /* ---- finish the meshes; the moving things ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fac.addTo(sceneryGroup, ouCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas(S.boards, cpAlt), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    crowdFinish(CR, root, out);
    moveChairs(0); moveSkiers(0); moveBirds(0);
    out.dyn.ext = (t) => { moveChairs(t); moveSkiers(t); moveBirds(t); };
    out.stats = { trees: nTrees, tiles: nTile, farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), poles: nPole + out.propStats.posts, lifts: nLift, towers: nTower, chairs: chairs.length,
      skiers: nSki, nets: nNet, signs: nSign, animals: nAnimal, groomers: nGroom, guns: nGun, pulls: pulls.length, sideRoads: out.stubStats.n };   // (read by the tests)
    return out;
  }

  // a lodge or a chalet (fl storeys): a concrete base on the slope, walls with bands of windows (the facade map), balconies along the long side, a
  // steep roof, a chimney (as Mount Hotham's)
  function lodge(g, fac, x, y0, y1, z, rot, L, D, fl, o) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (u, v, y) => [x + c * u - s * v, y, z + s * u + c * v], yb = y1 + 0.3, H = fl * 2.9;
    box(g, x, y0 - 0.5, z, L + 0.3, yb - y0 + 0.5, D + 0.3, rot, [0.58, 0.57, 0.55], null, true);
    const cs = [[-L / 2, -D / 2], [L / 2, -D / 2], [L / 2, D / 2], [-L / 2, D / 2]];
    for (let e = 0; e < 4; e++) { const [u0, v0] = cs[e], [u1, v1] = cs[(e + 1) % 4], bays = Math.max(1, Math.round(Math.hypot(u1 - u0, v1 - v0) / 3.2));
      fac.quadO(P(u0, v0, yb), P(u1, v1, yb), P(u1, v1, yb + H), P(u0, v0, yb + H), o.wall, [x, yb + H / 2, z], [[0, 0], [bays, 0], [bays, fl], [0, fl]]); }
    if (fl >= 2 && L > 9) for (let f = 1; f < fl; f++) box(g, x + (-s) * (D / 2 + 0.7), yb + f * 2.9 - 0.15, z + c * (D / 2 + 0.7), L * 0.86, 0.15, 1.4, rot, o.trim, null, true);
    const rh = Math.min(D, L) * (o.flat ? 0.12 : 0.42);
    gable(g, x, yb + H, z, L + 1.2, D + 1.4, rh, rot, o.roof, o.wall2 || o.wall);
    box(g, x, yb + H - 0.3, z, L + 0.1, 0.3, D + 0.1, rot, o.trim, null, true);
    if (!o.flat) { const [cx, , cz] = P(L * 0.28, D * 0.12, 0); box(g, cx, yb + H, cz, 0.7, rh + 0.9, 0.7, rot, [0.5, 0.48, 0.46], null, true); }
  }

  World.gore = { build, treeGeo, animalGeo, skierGeo, chairGeo, liftLine, liftAt, gCol: (x, z, h, ny, dd) => gCol(x, z, h, ny, dd).slice() };
})();
