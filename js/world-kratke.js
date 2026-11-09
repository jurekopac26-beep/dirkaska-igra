/* =========================================================================
   WORLD — the short roads outside Europe (docs/nove-proge-1-0.md, Del 4; themes 'mapileng', 'mujib' ...): one builder (buildKratke) for the five,
   each with its own look (KR[theme] below), registered as World.ext[theme]. What it uses of World comes from World.api: the helpers bound here
   once, the state that changes as API.<name>, the track being built and its theme (LOD, T) copied in at each build. Built on Vršič's corridor
   (vrPrep and Los Caracoles' terrain helpers caH / caGround read the same forms: def.dem, def.lc), as Santo Antão and Dadès; the walls between
   the legs of the hairpins as the shared world of the passes builds them (js/world-prelaz.js: copied here, that file is not changed for these
   roads).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caCar, caGH, caGround, caSlope, caTileOn, clamp, cone, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl,
    gable, ico, lerp, ouCutMat, pkGroundMat, propFloorTable, rng, roadsideProps, rock, rpHash, sstep, valueNoise2, vary, vrDist, vrFar, vrGritTex, vrLC,
    vrLCf, vrNear, vrPrep, parkOn
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= THE SHORT ROADS OUTSIDE EUROPE =================
     One builder (buildKratke) for the short roads of docs/nove-proge-1-0.md (Del 4), each with its own look (KR[theme]): the ground's colours
     (pal: krCol), the far land's (far), the plants (kinds: krTreeGeo, KS; mix: their share on each land cover), the stones and the rock (rocks;
     karst: the limestone showing through the grass), the road's lines (lines), the parapets' and the walls' colours (para), the boards' words
     (words, boards: krAtlas, krAtlas2), its houses (house) and its own signs and spectators (signs, fans). Only geographic names on the boards;
     the landmarks by the road (def.marks: a memorial, a shrine, a museum, a café) generic, no names or signs of their own. */
  const KR = {
    // Mã Pí Lèng (Vietnam): the grey limestone of the karst plateau showing through the grass in patches and outcrops everywhere, maize in
    // the pockets of soil between the rocks with low walls of loose stones round the fields, shrubs and a few trees, the hazy karst peaks
    // beyond; the narrow asphalt with a dashed white centre line, low concrete parapets on the drops (red and white blocks round the
    // hairpins); the memorial to the road's builders (a white obelisk on a stepped plinth, a small shrine beside it), a little museum and a
    // café by the road
    mapileng: {
      seed: 5311, dust: [0.56, 0.52, 0.45],
      pal: { grass: [0.45, 0.52, 0.28], dry: [0.6, 0.58, 0.4], soil: [0.5, 0.42, 0.32], shrub: [0.3, 0.4, 0.2], tree: [0.22, 0.33, 0.17],
        field: [0.47, 0.56, 0.25], field2: [0.64, 0.6, 0.38], wall: [0.62, 0.62, 0.6], built: [0.6, 0.58, 0.54], bare: [0.6, 0.6, 0.58],
        rock: [0.64, 0.64, 0.62], rock2: [0.5, 0.51, 0.5], path: [0.56, 0.5, 0.4], verge: [0.5, 0.47, 0.41], karst: 0.75 },
      far: (A, sl, q) => { const rk = Math.min(1, sstep(0.42, 0.85, sl) * 0.75), wood = sstep(1250, 1600, A) * 0.4;
        let c = [0.41 + q * 0.05, 0.48 + q * 0.04, 0.3 + q * 0.03]; c = [lerp(c[0], 0.25, wood), lerp(c[1], 0.34, wood), lerp(c[2], 0.21, wood)];
        return [lerp(c[0], 0.6 + q * 0.06, rk), lerp(c[1], 0.6 + q * 0.05, rk), lerp(c[2], 0.57 + q * 0.04, rk)]; },
      lines: { centre: [0.93, 0.93, 0.89], dash: [3, 5] },
      para: { stone: [0.7, 0.7, 0.68], top: [0.86, 0.86, 0.84], hp: [0.8, 0.16, 0.13], back: [0.56, 0.56, 0.54], wall: [0.56, 0.56, 0.54], cope: [0.72, 0.72, 0.7] },
      rocks: { main: [[0.62, 0.62, 0.6], [0.68, 0.68, 0.65], [0.56, 0.57, 0.56], [0.72, 0.71, 0.68]], alt: [[0.47, 0.47, 0.46], [0.54, 0.52, 0.49]], karst: 1 },
      kinds: ['broad', 'pine', 'shrub', 'tuft', 'maize'],
      mix: { 0: [0.08, [0.07, 0.04, 0.3, 0.59, 0]], 1: [0.35, [0.55, 0.3, 0.15, 0, 0]], 2: [0.3, [0.1, 0.02, 0.7, 0.18, 0]], 3: [0.05, [0.6, 0, 0.4, 0, 0]],
        4: [0.008, [0, 0, 1, 0, 0]], 5: [0, [0, 0, 1, 0, 0]], 6: [0.55, [0.01, 0, 0.03, 0.06, 0.9]] },
      house: { cols: [[0.66, 0.56, 0.44], [0.72, 0.66, 0.56], [0.86, 0.85, 0.8]], roof: [0.34, 0.34, 0.36], flat: [0.56, 0.55, 0.52], gable: 0.85, tall: 0.15 },
      words: { start: 'XUẤT PHÁT', finish: 'VỀ ĐÍCH', fin: 'MÃ PÍ LÈNG', title: 'MÃ PÍ LÈNG', sub: 'ĐỒNG VĂN · QL4C', cp: ['#1f4f8f', '#f7d116'], finBg: '#1d4f9a', ban: ['#c8261c', '#f7d116'] },
      boards: [['ĐỒNG VĂN', '#1d4f9a'], ['MÈO VẠC', '#1d4f9a'], ['MÃ PÍ LÈNG', '#1d4f9a'], ['ĐIỂM NGẮM CẢNH', '#6b4a22'], ['ĐƯỜNG ĐÈO NGUY HIỂM', '#f2f0ea'], ['ĐI CHẬM', '#f2f0ea'], ['QL4C', '#1d4f9a'], ['LŨNG CÚ', '#1d4f9a']],
      // the signs (krAtlas2's boards by number): Đồng Văn and Lũng Cú behind the start for the cars coming down, the road's number after the
      // start, the dangerous pass road before the first hairpin, slow before the third, Mã Pí Lèng before the memorial, Mèo Vạc ahead past the
      // finish, the viewpoint's board before it
      signs: (c) => { c.signAt(c.sStart - 60, -1, 0); c.signAt(c.sStart - 110, -1, 7); c.signAt(c.sStart + 40, 1, 6);
        if (c.cv[0]) c.signAt(c.sStart + c.cv[0][0] - 110, 1, 4); if (c.cv[2]) c.signAt(c.sStart + c.cv[2][0] - 70, 1, 5);
        const q = c.names.find(n => n.n.startsWith('Spomenik')); if (q) c.signAt(c.sStart + q.d - 90, 1, 2);
        c.signAt(c.sFin + 110, -c.sdP, 1); for (const v of c.views) c.signAt(v.i * c.ds - 45, v.sd || 1, 3); },
      // a group of spectators by the memorial (the top of the climb)
      fans: (c) => { const q = c.names.find(n => n.n.startsWith('Spomenik')); if (q) c.run(c.sStart + q.d - 30, c.sStart + q.d + 10, -1, { rows: 1, dens: 0.35, clump: 0.9, label: 'KR memorial' }); },
    },
    // Wadi Mujib (Jordan): the canyon's bare slopes of pale limestone and marl in beds (pal.strata: bands of their colours by height; the
    // harder beds standing out of the scree as long low ledges along the contours: rocks.ledges), boulders, sparse grey-green shrubs and
    // tufts of dry grass, a few umbrella acacias; the dam's lake on the canyon's floor far below (far; def.far.lake); the asphalt with a dashed
    // white centre line, low walls of the local stone on the drops (yellow blocks round the hairpins); the boards in Arabic and English (only
    // places and plain words); a lay-by over the canyon (viewAt) with a tea stall, a Bedouin tent on a shelf below the road (extras)
    mujib: {
      seed: 6421, dust: [0.74, 0.65, 0.52],
      pal: { grass: [0.64, 0.55, 0.42], dry: [0.73, 0.62, 0.48], soil: [0.6, 0.46, 0.36], shrub: [0.5, 0.47, 0.36], tree: [0.38, 0.4, 0.26],
        field: [0.58, 0.5, 0.35], field2: [0.69, 0.6, 0.44], wall: [0.7, 0.63, 0.52], built: [0.69, 0.65, 0.58], bare: [0.76, 0.65, 0.54],
        rock: [0.79, 0.71, 0.59], rock2: [0.63, 0.53, 0.43], path: [0.73, 0.65, 0.53], verge: [0.69, 0.63, 0.53], karst: 0,
        patch: [0.52, 0.42, 0.34], patchK: 0.6, noise: 0.13,   // (the darker stony ground in patches: scree of the darker beds, the desert's varnish)
        strata: { per: 9, wav: 1.4, ny: [0.96, 0.76], all: 0.55, cols: [[0.9, 0.85, 0.74], [0.78, 0.69, 0.55], [0.66, 0.55, 0.42], [0.54, 0.42, 0.32], [0.67, 0.49, 0.37], [0.79, 0.76, 0.68], [0.84, 0.75, 0.6]] } },
      far: (A, sl, q) => { const rk = Math.min(1, sstep(0.3, 0.8, sl)), hi = sstep(700, 900, A) * (1 - rk);
        let c = [0.69 + q * 0.05, 0.61 + q * 0.04, 0.48 + q * 0.03];   // the canyon's pale slopes; the plateau's brown fields above the rim
        c = [lerp(c[0], 0.6 + q * 0.04, hi), lerp(c[1], 0.53 + q * 0.03, hi), lerp(c[2], 0.41 + q * 0.03, hi)];
        return [lerp(c[0], 0.79 + q * 0.04, rk * 0.6), lerp(c[1], 0.71 + q * 0.04, rk * 0.6), lerp(c[2], 0.59 + q * 0.03, rk * 0.6)]; },
      lines: { centre: [0.9, 0.88, 0.82], dash: [3, 6] },
      para: { stone: [0.73, 0.66, 0.55], top: [0.83, 0.78, 0.69], hp: [0.92, 0.77, 0.2], back: [0.63, 0.56, 0.47], wall: [0.69, 0.62, 0.51], cope: [0.81, 0.75, 0.65] },
      rocks: { main: [[0.77, 0.69, 0.57], [0.71, 0.63, 0.51], [0.83, 0.76, 0.64], [0.67, 0.58, 0.47]], alt: [[0.63, 0.47, 0.37], [0.57, 0.45, 0.36]], karst: 0, ledges: 1, scree: 0.4, crag: 0.7 },
      // the steep slopes between the legs of the hairpins cut into the rock: a face in its beds from the upper verge down to a shelf at the lower
      // leg's height (as the passes' walls, from a gentler drop and battered more: bank)
      bank: { ratio: 0.85, batter: 0.16, strata: true },
      kinds: ['acacia', 'shrub', 'tuft'],
      tint: { shrub: [1.42, 1.08, 1.42], tuft: [1.2, 1.06, 1.22] },   // (the shrubs grey-green, the grass straw)
      mix: { 0: [0.07, [0.02, 0.48, 0.5]], 1: [0.3, [0.7, 0.3, 0]], 2: [0.22, [0.04, 0.76, 0.2]], 3: [0.02, [0, 1, 0]], 4: [0.012, [0.006, 0.6, 0.394]],
        5: [0, [0, 1, 0]], 6: [0.03, [0, 0.4, 0.6]] },
      house: { cols: [[0.84, 0.78, 0.68], [0.78, 0.72, 0.62], [0.88, 0.85, 0.78]], roof: [0.5, 0.48, 0.45], flat: [0.76, 0.72, 0.64], gable: 0, tall: 0.2 },
      words: { start: 'START · انطلاق', finish: 'FINISH · النهاية', fin: 'وادي الموجب · WADI MUJIB', title: 'WADI MUJIB · وادي الموجب', sub: 'ذيبان · الكرك · DHIBAN · KARAK',
        cp: ['#1d4f8a', '#f4e7c4'], finBg: '#6b4a22', ban: ['#a8241c', '#f4e7c4'] },
      boards: [['الكرك\nKARAK', '#1d4f9a'], ['ذيبان\nDHIBAN', '#1d4f9a'], ['وادي الموجب\nWADI MUJIB', '#6b4a22'], ['مطل\nVIEWPOINT', '#6b4a22'],
        ['منعطفات خطرة\nDANGEROUS BENDS', '#f2f0ea'], ['خفف السرعة\nSLOW DOWN', '#f2f0ea'], ['مادبا\nMADABA', '#1d4f9a'], ['سد الموجب\nMUJIB DAM', '#6b4a22']],
      // the signs (krAtlas2's boards by number): Dhiban and Madaba behind the start for the cars going down, the canyon's name and the bends'
      // warning in the run-up, slow before the third hairpin, the viewpoint's board before the lay-by, Karak ahead past the finish and the
      // dam's board for the cars coming down
      signs: (c) => { c.signAt(c.sStart - 60, -1, 1); c.signAt(c.sStart - 125, -1, 6); c.signAt(c.sStart - 165, 1, 2); c.signAt(c.sStart - 28, 1, 4);
        if (c.cv[2]) c.signAt(c.sStart + c.cv[2][0] - 80, 1, 5);
        c.signAt(c.sFin + 110, -c.sdP, 0); c.signAt(c.sFin + 175, c.sdP, 7); for (const v of c.views) c.signAt(v.i * c.ds - 45, v.sd || 1, 3); },
      // the lay-by over the canyon: on the left before the fourth hairpin, where the ground falls away towards the lake (metres after the
      // start, its radius)
      viewAt: [[694, 8]],
      // a Bedouin tent on the levelest shelf a little below the road (its long black roof of goat hair on poles, the back and the ends walled,
      // the front open on a rug; a water tank, a pick-up), a tea stall on the lay-by (a whitewashed kiosk with a striped awning, a counter)
      extras: (c) => {
        let n = 0, best = null;
        for (let s = c.sStart - 190; s < c.sFin + 230; s += 5) for (const side of [-1, 1]) for (const o of [14, 19, 25, 32]) {
          const [x, z, i] = c.onSide(s, side, o); if (vrNear(x, z).dd < 11 || c.excluded(x, z) || Math.abs(caGround(x, z) - T.hy[i]) > 7) continue;
          let lo = 1e9, hi = -1e9; for (const [a, b] of [[-5.5, -3], [5.5, -3], [5.5, 3], [-5.5, 3], [0, 0]]) { const h = caGround(x + a, z + b); lo = Math.min(lo, h); hi = Math.max(hi, h); }
          if (!best || hi - lo < best.d) best = { x, z, i, d: hi - lo, lo, hi };
        }
        if (best && best.d < 2.6) {
          const { x, z, i } = best, hd = T.hd[i], g = c.scen.get(x, z), y = (best.lo + best.hi) / 2, cs = Math.cos(hd), sn = Math.sin(hd), L = 9, D = 4.4, H = 1.7;
          const at = (u, v) => [x + u * cs - v * sn, z + u * sn + v * cs], blk = [0.15, 0.13, 0.12], blk2 = [0.11, 0.1, 0.1], pole = [0.52, 0.44, 0.34];
          const toRoad = (T.px[i] - x) * T.nx[i] + (T.pz[i] - z) * T.nz[i] > 0 ? 1 : -1, back = -toRoad;   // (the open front faces the road)
          { const [bx, bz] = at(0, back * (D / 2 - 0.1)); box(g, bx, y - 1.4, bz, L, H + 1.4, 0.16, hd, blk, blk); }
          for (const u of [-L / 2 + 0.08, L / 2 - 0.08]) { const [ex, ez] = at(u, 0); box(g, ex, y - 1.4, ez, 0.16, H + 1.4, D, hd, blk, blk); }
          gable(g, x, y + H, z, L + 0.6, D + 0.7, 0.75, hd, blk2, blk);
          for (const u of [-3, 0, 3]) { const [px, pz] = at(u, toRoad * (D / 2 + 0.25)); cyl(g, px, y - 0.3, pz, 0.05, H + 0.75, 4, pole, null, 0.04); }
          { const [rx, rz] = at(0, toRoad * 0.6); box(g, rx, y - 0.25, rz, L - 1.2, 0.3, D - 1.6, hd, [0.55, 0.16, 0.12], [0.6, 0.2, 0.14]); }   // the rug inside
          { const [wx, wz] = at(L / 2 + 1.3, 0); cyl(g, wx, caGround(wx, wz) - 0.2, wz, 0.65, 1.4, 8, [0.12, 0.12, 0.13], [0.16, 0.16, 0.17]); }   // the water tank
          { const [px, pz] = at(-L / 2 - 3.2, toRoad * 1.2); parkOn(caCar, caGround, 4.4, g, px, caGround(px, pz), pz, hd, vary([0.9, 0.9, 0.88], c.R, 0.1)); }
          c.exclPush(x, z, 8); c.CR.block(x, z, L + 6, D + 4, hd); c.marks.tent = [x, z]; n++;
        }
        for (const v of c.views.slice(0, 1)) {   // the tea stall: a kiosk at the lay-by's far end along the road, its awning towards the view
          const i = v.i, cs = Math.cos(T.hd[i]), sn = Math.sin(T.hd[i]), kx = v.x + cs * (v.r - 2.6), kz = v.z + sn * (v.r - 2.6), g = c.scen.get(kx, kz), y = v.h;
          const ox = (v.x - T.px[i]) * T.nx[i] + (v.z - T.pz[i]) * T.nz[i] > 0 ? 1 : -1, wh = [0.88, 0.85, 0.78];
          box(g, kx, y - 0.4, kz, 2.4, 2.8, 2.2, T.hd[i], wh, [0.62, 0.6, 0.56]);
          const ax = kx + T.nx[i] * ox * 1.7, az = kz + T.nz[i] * ox * 1.7;
          box(g, ax, y + 2.15, az, 2.8, 0.08, 1.4, T.hd[i], [0.72, 0.2, 0.16], [0.86, 0.84, 0.78]);
          for (const u of [-1.3, 1.3]) cyl(g, ax + cs * u + T.nx[i] * ox * 0.6, y - 0.1, az + sn * u + T.nz[i] * ox * 0.6, 0.04, 2.3, 4, [0.4, 0.4, 0.42]);
          box(g, kx + T.nx[i] * ox * 1.3, y, kz + T.nz[i] * ox * 1.3, 2.0, 0.95, 0.5, T.hd[i], [0.5, 0.36, 0.24], [0.6, 0.46, 0.32]);   // the counter
          for (let k = 0; k < 2; k++) { const px = kx + T.nx[i] * ox * (2.6 + k * 0.8) + cs * (k - 0.5) * 1.4, pz = kz + T.nz[i] * ox * (2.6 + k * 0.8) + sn * (k - 0.5) * 1.4; c.person(px, pz, Math.atan2(px - kx, kz - pz)); }
          c.exclPush(kx, kz, 3); c.marks.stall = [kx, kz]; n++;
        }
        return n;
      },
    },
  };
  // the plants' kinds (krTreeGeo): h [base, + random] height (m), w [width over height, + m, + random m], c the instance's tint [r, + random,
  // g, + random, b], near: only within so many metres of the road (LOD.radius), tree: a tree (on NIZKA only the trees cast shadows), shade:
  // casts a shadow on the higher tiers
  const KS = {
    broad: { h: [7, 7], w: [0.95, 0, 0], c: [0.94, 0.12, 0.95, 0.1, 0.94], tree: true },
    pine: { h: [9, 8], w: [0.5, 0, 0], c: [0.95, 0.1, 0.97, 0.06, 0.95], tree: true },
    shrub: { h: [1.0, 1.2], w: [0, 1.0, 1.2], c: [0.92, 0.16, 0.95, 0.1, 0.9], shade: true },
    tuft: { h: [0.35, 0.35], w: [0, 0.6, 0.5], c: [0.92, 0.18, 0.95, 0.1, 0.9], near: 70 },
    maize: { h: [1.9, 0.6], w: [0.45, 0, 0.3], c: [0.94, 0.1, 0.96, 0.08, 0.92], near: 60, shade: true },
    acacia: { h: [3.4, 3.2], w: [1.35, 0, 0.8], c: [0.94, 0.12, 0.95, 0.1, 0.94], tree: true },
  };
  const SCOL = [0, 0, 0];
  let PA = null;   // the footpaths (def.paths, prepared at each build): { x, z: their points, H: a hash of their segments by PAC m cells }
  const PAC = 16;
  function pathD(x, z) {   // the distance to the nearest footpath within ~PAC m (or 1e9)
    if (!PA) return 1e9;
    const L = PA.H.get(Math.floor(x / PAC) * 65536 + Math.floor(z / PAC)); if (!L) return 1e9;
    let best = 1e9;
    for (let q = 0; q < L.length; q++) { const k = L[q], ax = PA.x[k], az = PA.z[k], ux = PA.x[k + 1] - ax, uz = PA.z[k + 1] - az, ll = ux * ux + uz * uz || 1;
      const t = clamp(((x - ax) * ux + (z - az) * uz) / ll, 0, 1), dx = x - ax - ux * t, dz = z - az - uz * t, d = dx * dx + dz * dz; if (d < best) best = d; }
    return Math.sqrt(best);
  }
  let LK = null;   // the look of the road being built (KR[theme])
  function krBand(A, x, z) {   // the colour of the bed at altitude A (the look's strata: a colour of its own for each band, a little wavy; darker at its foot)
    const S = LK.pal.strata, P = API.VR, u = A / S.per + (P.c2(x * 0.5, z * 0.5) - 0.5) * S.wav, k = Math.floor(u), fr = u - k, n = S.cols.length;
    const ca = S.cols[Math.floor(rpHash(k, 17) * n)], cb = S.cols[Math.floor(rpHash(k + 1, 17) * n)], t = sstep(0.8, 1, fr), sh = 0.86 + 0.18 * sstep(0, 0.7, fr);
    BCOL[0] = lerp(ca[0], cb[0], t) * sh; BCOL[1] = lerp(ca[1], cb[1], t) * sh; BCOL[2] = lerp(ca[2], cb[2], t) * sh; return BCOL;
  }
  const BCOL = [0, 0, 0];
  function krCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map), from the look's palette (LK.pal): the grass (lc 0) with patches of dry
    // grass and of bare soil, the shrubs (lc 2) and the trees (lc 1) darker, the fields (lc 6) in bands along the contours with their walls
    // between, the yards (lc 3) grey, the bare rock (lc 4); the limestone (pal.karst) showing through the grass in patches; on the steep faces
    // the rock's grey in bands, the grass hanging on in the ledges; the paths and the verge trodden
    const P = API.VR, C = LK.pal, A = h + P.D.base, f = P.n4(x, z), q = P.c2(x, z), m = P.c1(x, z), s5 = P.c5(x * 1.3, z * 1.3);
    let R = C.grass[0], G = C.grass[1], B = C.grass[2];
    const mix = (c, t) => { if (t > 0) { R = lerp(R, c[0], t); G = lerp(G, c[1], t); B = lerp(B, c[2], t); } };
    mix(C.dry, sstep(0.5, 0.82, m) * 0.5);
    mix(C.soil, sstep(0.66, 0.88, q) * 0.38);
    mix(C.shrub, vrLCf(x, z, 2) * 0.7);
    const tr = vrLCf(x, z, 1); mix(C.tree, tr * 0.75);
    const fd = vrLCf(x, z, 6) * 0.85;
    if (fd > 0) { const band = 0.5 + 0.5 * Math.sin(A / 2.2 + P.c3(x, z) * 3), wall = sstep(0.82, 0.96, band) * 0.8;
      const fr = lerp(C.field[0], C.field2[0], s5), fg = lerp(C.field[1], C.field2[1], s5), fb = lerp(C.field[2], C.field2[2], s5);
      R = lerp(R, lerp(fr, C.wall[0], wall), fd); G = lerp(G, lerp(fg, C.wall[1], wall), fd); B = lerp(B, lerp(fb, C.wall[2], wall), fd); }
    mix(C.built, vrLCf(x, z, 3) * 0.6);
    mix(C.bare, vrLCf(x, z, 4) * 0.8);
    if (C.karst) mix(C.rock, sstep(0.56, 0.8, P.c2(x * 2.6 + 311, z * 2.6)) * C.karst * (1 - fd) * (1 - tr * 0.6));
    if (C.patch) mix(C.patch, sstep(0.5, 0.78, P.c4(x * 1.8 + 77, z * 1.8)) * C.patchK * (1 - fd));   // (the limestone showing through the grass, in patches of ~10-25 m)
    const nz = C.noise || 0.08; R += (f - 0.5) * nz; G += (f - 0.5) * nz; B += (f - 0.5) * (C.noise ? nz * 0.62 : 0.05);
    const st = sstep(0.7, 0.42, ny) * (1 - 0.6 * fd);
    if (C.strata) {   // the canyon's beds: on the steep faces and (less) on the bare slopes, bands of the strata's colours by height (each band a colour of
      // its own, a little wavy), darker at their feet
      const S = C.strata, sb = Math.max(st, sstep(S.ny[0], S.ny[1], ny) * (S.all + (1 - S.all) * vrLCf(x, z, 4)) * (1 - fd));
      if (sb > 0) { const c = krBand(A, x, z); R = lerp(R, c[0], sb); G = lerp(G, c[1], sb); B = lerp(B, c[2], sb); }
    } else if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 5.5 + P.c2(x * 0.4, z * 0.4) * 6), alt = sstep(0.6, 0.9, band) * sstep(0.4, 0.7, P.c3(x, z)), k = 0.88 + 0.14 * band;
      const ledge = sstep(0.5, 0.75, s5) * 0.4 * sstep(0.3, 0.5, ny);
      const rr = lerp(lerp(C.rock[0], C.rock2[0], alt) * k, R, ledge), rg = lerp(lerp(C.rock[1], C.rock2[1], alt) * k, G, ledge), rb = lerp(lerp(C.rock[2], C.rock2[2], alt) * k, B, ledge);
      R = lerp(R, rr, st); G = lerp(G, rg, st); B = lerp(B, rb, st); }
    const pd = pathD(x, z); if (pd < 1.3) mix(C.path, sstep(1.3, 0.4, pd) * 0.7);
    if (dd < 1.8) mix(C.verge, sstep(1.8, 0.2, dd) * 0.45);
    SCOL[0] = R; SCOL[1] = G; SCOL[2] = B; return SCOL;
  }
  function krGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (as caGCol, coloured by krCol)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = krCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function krTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by krCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = krCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? caTileOn(a, b) : 0);
      const fix = (k0, dk) => { for (let q = 1; q < m; q += 2) { const a = k0 + (q - 1) * dk, b = k0 + (q + 1) * dk; pos[(k0 + q * dk) * 3 + 1] = (pos[a * 3 + 1] + pos[b * 3 + 1]) / 2; } };
      if (nb(ti, tj - 1) === 2) fix(0, 1); if (nb(ti, tj + 1) === 2) fix(m * n, 1); if (nb(ti - 1, tj) === 2) fix(0, n); if (nb(ti + 1, tj) === 2) fix(m, n);
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('steep', new THREE.BufferAttribute(stp, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }
  let kATex = null, kAKey = '', kA2Tex = null, kA2Key = '';   // (the board atlases, made once and reused while the same road is built again)
  function krAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): the start, the finish, CP1-CP4 with the altitude, the board at the finish, the race's banner
    const W = LK.words, key = LK.seed + '|' + cps.join('|') + '|' + finA; if (kATex && kAKey === key) return kATex;
    if (kATex) kATex.dispose(); kAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt(W.start, 512, 68, 96, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(232, 142, 560, 100); txt(W.finish, 512, 196, 88, '#111', 530);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = W.cp[0]; x.fillRect(0, y, 1024, 128); x.fillStyle = W.cp[1]; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, W.cp[1], 520); });
    x.fillStyle = W.finBg; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#eef0e6'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt(W.fin, 512, 812, 58, '#f2f4ea', 900); txt(finA, 512, 862, 46, '#f2f4ea', 900);
    x.fillStyle = W.ban[0]; x.fillRect(0, 896, 1024, 128); x.fillStyle = W.ban[1]; x.fillRect(0, 956, 1024, 8);
    txt(W.title, 512, 930, 52, '#fff', 980); txt(W.sub, 512, 994, 44, W.ban[1], 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (kATex = t);
  }
  function krAtlas2() {   // the small signs: cells 30-31 the chevrons (white on red, pointing the way the road turns), cells 28-29 the viewpoint's board (a
    // picture of the hills and the valley, no words); rows 4-7, the place boards (LK.boards, two a row, 512 x 128)
    if (kA2Tex && kA2Key === LK.seed) return kA2Tex;
    if (kA2Tex) kA2Tex.dispose(); kA2Key = LK.seed;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (const [k, dir] of [[30, 1], [31, -1]]) {
      const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128; x.fillStyle = '#c8261c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f6f5f0';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); }
    }
    { const x0 = 512, y0 = 384, W = 256, H = 128;   // the viewpoint's board: the sky, the hills in green, the valley, the road's line in red
      x.fillStyle = '#6b4a22'; x.fillRect(x0, y0, W, H); x.fillStyle = '#dfe9ee'; x.fillRect(x0 + 8, y0 + 8, W - 16, H - 16);
      for (const [cx, hw, hh, col] of [[60, 70, 62, '#7d9a5a'], [150, 80, 78, '#5f7f46'], [222, 52, 50, '#6f8d50']]) { x.fillStyle = col; x.beginPath(); x.moveTo(x0 + cx - hw, y0 + 112); x.lineTo(x0 + cx, y0 + 112 - hh); x.lineTo(x0 + cx + hw, y0 + 112); x.closePath(); x.fill(); }
      x.fillStyle = '#8a7a5a'; x.fillRect(x0 + 8, y0 + 108, W - 16, 12);
      x.strokeStyle = '#c8261c'; x.lineWidth = 4; x.beginPath(); x.moveTo(x0 + 30, y0 + 104); x.lineTo(x0 + 70, y0 + 80); x.lineTo(x0 + 110, y0 + 92); x.lineTo(x0 + 150, y0 + 64); x.lineTo(x0 + 186, y0 + 76); x.lineTo(x0 + 230, y0 + 52); x.stroke();
      x.fillStyle = '#f7d116'; x.beginPath(); x.arc(x0 + 186, y0 + 76, 6, 0, TAU); x.fill(); }
    LK.boards.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, warn = bg === '#f2f0ea', L = n.split('\n');
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = warn ? '#c8261c' : '#f2f2ee'; x.lineWidth = warn ? 12 : 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      if (L.length > 1) { txt(L[0], x0 + 256, y0 + 46, 44, warn ? '#16181c' : '#f2f2ee', 460); txt(L[1], x0 + 256, y0 + 92, 36, warn ? '#16181c' : '#f2f2ee', 460); }   // (two lines: the local script over the Latin)
      else txt(n, x0 + 256, y0 + 66, 52, warn ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (kA2Tex = t);
  }
  function krTreeGeo(kind) {   // unit plants (height 1; the instances scale and tint them): broad a broadleaved tree (a short trunk, a round crown of
    // a few blobs), pine (a tall trunk, tiers of dark needles), shrub (a rounded mound), tuft (a tuft of grass, straw-tipped blades), maize (a
    // clump of four stalks with long drooping leaves and the tassels on top)
    const g = new GB(), R = rng(1980 + kind.length * 7 + kind.charCodeAt(0)), rs = API.ROCK_SMOOTH, frond = (cx, cy, cz, a, L, lift, droop, w, col, tip) => {
      const ux = Math.cos(a), uz = Math.sin(a), px = -uz * w, pz = ux * w, m = [cx + ux * L * 0.55, cy + lift, cz + uz * L * 0.55], e = [cx + ux * L, cy + lift - droop, cz + uz * L];
      const b = [cx, cy, cz], l1 = [m[0] + px, m[1], m[2] + pz], r1 = [m[0] - px, m[1], m[2] - pz], up = [cx, cy + 1, cz], dn = [cx, cy - 1, cz];
      g.triO(b, l1, m, col, dn, col, col); g.triO(b, m, l1, col, up, col, col); g.triO(b, m, r1, col, dn, col, col); g.triO(b, r1, m, col, up, col, col);
      g.triO(l1, e, m, col, dn, tip, col); g.triO(l1, m, e, col, up, col, tip); g.triO(m, e, r1, col, dn, tip, col); g.triO(m, r1, e, col, up, col, tip); };
    if (kind === 'broad') {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.03, 0.42, 4, [0.36, 0.3, 0.24], null, 0.022);
      const cs = [[0.26, 0.38, 0.18], [0.3, 0.42, 0.2], [0.24, 0.35, 0.17]];
      ico(g, 0, 0.62, 0, 0.3, 0.9, cs[0], R, 0.3); ico(g, 0.2, 0.52, 0.1, 0.22, 0.85, cs[1], R, 0.3); ico(g, -0.18, 0.55, -0.12, 0.22, 0.9, cs[2], R, 0.3); ico(g, 0.03, 0.8, 0.04, 0.18, 0.8, cs[1], R, 0.3);
    } else if (kind === 'pine') {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.022, 0.4, 4, [0.38, 0.3, 0.24], null, 0.014);
      cone(g, 0, 0.22, 0, 0.26, 0.42, 6, [0.17, 0.27, 0.15], [0.2, 0.31, 0.17], 0); cone(g, 0, 0.45, 0, 0.2, 0.36, 6, [0.19, 0.3, 0.16], [0.22, 0.33, 0.18], 0); cone(g, 0, 0.66, 0, 0.13, 0.34, 6, [0.2, 0.32, 0.17], [0.24, 0.35, 0.19], 0);
    } else if (kind === 'shrub') {
      API.ROCK_SMOOTH = true; ico(g, 0, 0.42, 0, 0.52, 0.8, [0.3, 0.4, 0.2], R, 0.4); ico(g, 0.28, 0.32, 0.16, 0.32, 0.85, [0.35, 0.44, 0.22], R, 0.4); ico(g, -0.24, 0.3, -0.18, 0.3, 0.8, [0.27, 0.36, 0.19], R, 0.4);
    } else if (kind === 'tuft') {
      const gc = [[0.5, 0.52, 0.28], [0.58, 0.56, 0.32]], gt = [0.72, 0.66, 0.42];
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.5; frond(0, 0, 0, a, 0.28 + R() * 0.12, 0.62, -0.3, 0.035, gc[k % 2], gt); }
    } else if (kind === 'acacia') {   // (an umbrella thorn: a short trunk forking low into a few limbs, a wide flat crown of flattened blobs)
      API.ROCK_SMOOTH = true; const bk = [0.38, 0.32, 0.26], cs = [[0.36, 0.4, 0.22], [0.41, 0.44, 0.25], [0.33, 0.37, 0.2]];
      cyl(g, 0, -0.02, 0, 0.035, 0.34, 4, bk, null, 0.026);
      for (const [a, d] of [[0.3, 0.2], [2.4, 0.17], [4.3, 0.19]]) cyl(g, Math.cos(a) * d * 0.45, 0.28, Math.sin(a) * d * 0.45, 0.02, 0.48, 4, bk, null, 0.013);
      ico(g, 0, 0.8, 0, 0.44, 0.24, cs[0], R, 0.25); ico(g, 0.24, 0.76, 0.12, 0.25, 0.3, cs[1], R, 0.3); ico(g, -0.22, 0.77, -0.14, 0.27, 0.28, cs[2], R, 0.3); ico(g, 0.04, 0.87, -0.22, 0.21, 0.3, cs[1], R, 0.3);
    } else if (kind === 'maize') {
      const sc = [0.42, 0.52, 0.22], lc = [[0.36, 0.5, 0.2], [0.42, 0.55, 0.24]], tp = [0.62, 0.6, 0.34], ts = [0.78, 0.68, 0.4];
      for (let q = 0; q < 4; q++) { const a0 = q / 4 * TAU + R() * 0.8, r0 = 0.12 + R() * 0.16, cx = Math.cos(a0) * r0, cz = Math.sin(a0) * r0, h = 0.82 + R() * 0.18;
        cyl(g, cx, 0, cz, 0.012, h, 3, sc, null, 0.008);
        for (let k = 0; k < 3; k++) { const a = a0 + k * 2.3 + R() * 0.6; frond(cx, h * (0.32 + k * 0.17), cz, a, 0.28 + R() * 0.1, 0.06, 0.16, 0.03, lc[k % 2], tp); }
        frond(cx, h, cz, R() * TAU, 0.07, 0.1, -0.02, 0.012, ts, ts); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the knockable roadside posts: white with a red top
  function krProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }

  function buildKratke(scene, tex, opts, look) {
    LK = look;
    const R = rng(LK.seed), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: LK.dust };
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS;
    P.c1 = valueNoise2(921, 150); P.c2 = valueNoise2(922, 64); P.c3 = valueNoise2(923, 90); P.c4 = valueNoise2(924, 120); P.c5 = valueNoise2(925, 26);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the footpaths (def.paths: [x, z, ...]): their points and a hash of their segments
    PA = null;
    { const xs = [], zs = [], H = new Map();
      for (const p of def.paths || []) { const n = p.length / 2; if (n < 2) continue; const k0 = xs.length;
        for (let k = 0; k < n; k++) { xs.push(p[2 * k]); zs.push(p[2 * k + 1]); }
        for (let k = k0; k < k0 + n - 1; k++) { const a0 = Math.floor((Math.min(xs[k], xs[k + 1]) - 2) / PAC), a1 = Math.floor((Math.max(xs[k], xs[k + 1]) + 2) / PAC), b0 = Math.floor((Math.min(zs[k], zs[k + 1]) - 2) / PAC), b1 = Math.floor((Math.max(zs[k], zs[k + 1]) + 2) / PAC);
          for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) { const kk = a * 65536 + b; let L = H.get(kk); if (!L) H.set(kk, L = []); L.push(k); } }
        xs.push(NaN); zs.push(NaN); }   // (a gap between two paths: the segment across it is never hashed)
      if (xs.length) PA = { x: Float32Array.from(xs), z: Float32Array.from(zs), H }; }
    // the level plots: the viewpoints (def.views: on the saddle, on the road itself in the map, so each one a terrace beside it, the first on the side
    // the ground falls the more, the next on the other), the cars' park past the finish
    const views = [];
    { let sd0 = 0;
      const VW = (def.views || []).concat((LK.viewAt || []).map(([d, r]) => { const i = T.idx(sStart + d); return [T.px[i], T.pz[i], r]; }));
      for (const [x, z, rv] of VW) { const n = vrNear(x, z); if (n.i < 0 || n.dd > 25) continue; const i = n.i, s = i * T.ds; if (s < sStart + 20 || s > T.len - 30) continue;   // (and past the finish: Mã Pí Lèng's viewpoint)
        if (n.dd > w + 1.5) { const pad = { x, z, r: 6, b: 8, h: T.hy[i] - 0.15, i }; P.pads.push(pad); views.push(pad); continue; }
        const gd = (sd) => vrFar(T.px[i] + T.nx[i] * sd * 14, T.pz[i] + T.nz[i] * sd * 14) - T.hy[i];
        if (!sd0) sd0 = gd(1) < gd(-1) ? 1 : -1; else sd0 = -sd0;
        const r = rv || 5, o = (sd0 > 0 ? T.br[i] : T.bl[i]) + r + 0.8, pad = { x: T.px[i] + T.nx[i] * sd0 * o, z: T.pz[i] + T.nz[i] * sd0 * o, r, b: 8, h: T.hy[i] - 0.15, i, sd: sd0 };
        P.pads.push(pad); views.push(pad); } }
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 14, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 60, 12); P.pads.push(padF);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (crowds, plots, signs) for the plants and the rocks, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const p of views) exclPush(p.x, p.z, p.r + 2);
    exclPush(padF.x, padF.z, padF.r + 4);
    out.marks = {}; if (views.length) out.marks.view = [views[0].x, views[0].z];   // (where the landmarks stand: the tests look for them)

    /* ---- the retaining walls between the legs of the hairpins (as js/world-prelaz.js builds them): the game's road is wider than the real one
       (9 m against ~6 m), so where two legs lie close the lower one's barrier comes within a few metres of the upper one's and the climb between
       them falls in between: the terrain's 5 m grid could only draw that as a sheer face over jagged teeth. There a masonry wall stands under
       the upper verge's edge (bar + 0.42), battered 1 in 20, its foot on a level shelf at the lower leg's height; the terrain kept down to the
       shelf from under the upper verge out to the lower leg's barrier (API.caBank in caH). bk[si][i]: { p: [[offset, height above the road]
       top, foot], o1: where the shelf ends, hl: the lower leg's height } or null ---- */
    const BK = LK.bank || {}, bkReach = BK.reach || [1, 6, 12, 18], bkRatio = BK.ratio || 1.2, bkBatter = BK.batter || 0.05;   // (the look's own: Wadi Mujib's cuts in the rock)
    const BKC = 24, BKH = new Map(), bk = [-1, 1].map((side, si) => { const a = new Array(N).fill(null);
      for (let i = 0; i < N; i++) {
        const bar = side > 0 ? T.br[i] : T.bl[i], o0 = bar + 0.42, y = T.hy[i], at = (o) => [T.px[i] + T.nx[i] * side * o, T.pz[i] + T.nz[i] * side * o];
        const other = (o) => { const [x, z] = at(o), n = vrNear(x, z); return n.i >= 0 && Math.abs(n.i - i) * T.ds > 40 && T.hy[n.i] < y - 4 ? n : null; };
        if (!bkReach.some(d => { const n = other(o0 + d); return n && n.dd < 3; })) continue;
        let oL = -1, hl = 0;
        for (let o = o0; o < o0 + 26; o += 0.5) { const n = other(o); if (n && n.dd < 0.5) { oL = o; hl = T.hy[n.i]; break; } }
        const H = y - hl; if (oL < 0 || H / Math.max(0.5, oL - o0) < bkRatio) continue;
        const ob = Math.max(o0, Math.min(o0 + bkBatter * H, oL - 0.5)); a[i] = { p: [[o0, -0.08], [ob, -H - 0.6]], o1: Math.max(ob + 0.8, oL + 0.4), hl }; }
      for (let i = 1; i < N - 1; i++) if (a[i] && !a[i - 1] && !a[i + 1]) a[i] = null;
      for (let i = 0; i < N; i++) if (a[i]) { const o0 = a[i].p[0][0];
        for (const o of [o0 - 6, o0, a[i].o1]) { const k = Math.floor((T.px[i] + T.nx[i] * side * o) / BKC) * 65536 + Math.floor((T.pz[i] + T.nz[i] * side * o) / BKC);
          for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) { const kk = k + da * 65536 + db; let Lq = BKH.get(kk); if (!Lq) BKH.set(kk, Lq = []); if (Lq[Lq.length - 1] !== si * N + i) Lq.push(si * N + i); } } }
      return a; });
    const saBank = (x, z, h) => {
      const Lq = BKH.get(Math.floor(x / BKC) * 65536 + Math.floor(z / BKC));
      if (Lq) for (let q = 0; q < Lq.length; q++) { const si = Lq[q] >= N ? 1 : 0, i = Lq[q] - si * N, side = si ? 1 : -1, b = bk[si][i], dx = x - T.px[i], dz = z - T.pz[i];
        if (Math.abs(dx * T.tx[i] + dz * T.tz[i]) > T.ds * 0.75) continue;
        const o = (dx * T.nx[i] + dz * T.nz[i]) * side; if (o < b.p[0][0] - 6 || o > b.o1) continue;
        if (b.hl - 0.35 < h) h = b.hl - 0.35; }
      return h; };
    API.caBank = { T, f: saBank };

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat();
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(krTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the road: asphalt (tex.asphalt) with the look's lines (LK.lines: a dashed or solid centre line, double or single, the edge lines), a
       narrow gravel shoulder, then the verge out to a ditch past the barrier line; where the ground falls far below, the retaining wall that
       holds the road (its face out over the drop); by a leg below, the wall's coping, then the bank (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true }), sMat = new THREE.MeshLambertMaterial({ map: tex.makadam, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.45;
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (bk[side > 0 ? 1 : 0][i]) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, -0.08], [bar + 0.42, -0.08], [bar + 0.42, -0.08]];   // (a bank down to the leg below: the wall's coping, then the bank)
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    let nWall = 0;
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8, kerbL = 6, LN = LK.lines;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.88 - 0.07 * Math.exp(-((o - rl - 0.9) * (o - rl - 0.9)) / 0.6) - 0.07 * Math.exp(-((o - rl + 0.9) * (o - rl + 0.9)) / 0.6); if (Math.abs(o) > w * 0.86) k -= 0.04;
        k *= 0.95 + 0.1 * P.n2(T.px[i] * 0.5 + o, T.pz[i] * 0.5); return [k, k, k * 1.02]; };
      const kc = LK.pal.verge, wallC = LK.para.wall, copeC = LK.para.cope;
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (bk[si][i]) { const q = 0.92 + 0.12 * rpHash(i >> 2, 61 + si); return k < 2 ? [copeC[0] * q, copeC[1] * q, copeC[2] * q] : [wallC[0] * q, wallC[1] * q, wallC[2] * q]; }
          const wl = vp[si][i][2][1] < -2.6; if (wl && (k === 1 || k === 2)) { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si); return k === 1 ? [copeC[0] * q, copeC[1] * q, copeC[2] * q] : [wallC[0] * 0.85 * q, wallC[1] * 0.85 * q, wallC[2] * 0.85 * q]; }
          if (k === 4) return krGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return krCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gv = new GB(true), gw = new GB(true), gl = new GB(), gs = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / kerbL, s1 = j * T.ds / kerbL;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          const sm = (i + 0.5) * T.ds, pq = (a, b, col) => gl.quadUp(Pt(i, a, 0.036), Pt(i, b, 0.036), Pt(j, b, 0.036), Pt(j, a, 0.036), [col, col, col, col]);
          if (LN.edge) { pq(-(w - 0.3), -(w - 0.45), LN.edge); pq(w - 0.45, w - 0.3, LN.edge); }
          if (LN.centre && (!LN.dash || sm % (LN.dash[0] + LN.dash[1]) < LN.dash[0])) { if (LN.double) { pq(-0.21, -0.09, LN.centre); pq(0.09, 0.21, LN.centre); } else pq(-0.07, 0.07, LN.centre); }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [kc, kc, kc, kc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);   // (the gravel shoulder)
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6) && !bk[si][i]) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face: out, over the drop)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
            const bi = bk[si][i], bj = bk[si][j];   // the wall down to the leg below: its battered face from the coping to the shelf, the shelf out to the lower barrier
            if (bi && bj) { const top = (q, b2) => Pt(q, side * b2.p[0][0], b2.p[0][1]), foot = (q, b2) => Pt(q, side * b2.p[1][0], b2.p[1][1]), A = top(i, bi), B = top(j, bj), C = foot(j, bj), D = foot(i, bi);
              const q = 0.9 + 0.14 * rpHash(i >> 1, 71 + si), wc2 = [wallC[0] * q, wallC[1] * q, wallC[2] * q], dk = [wallC[0] * 0.78 * q, wallC[1] * 0.78 * q, wallC[2] * 0.78 * q];
              if (BK.strata) {   // a cut in the layered rock (the look's bank.strata): the face in rows between levels 1.6 m apart, each vertex the colour of its bed
                const base = P.D.base, inn = Pt(i, 0, -bi.p[1][1] * 0.2 - 1), lv = [0], ya = A[1], yd = D[1], yb = B[1], yc = C[1], hi = Math.max(ya, yb), lo2 = Math.min(yd, yc);
                for (let y = Math.floor(hi / 1.6) * 1.6; y > lo2; y -= 1.6) if (y < hi) lv.push(y); lv.push(-1e9);
                const ptI = (y) => { const t = y < -1e8 ? 1 : clamp((ya - y) / Math.max(0.01, ya - yd), 0, 1); return [A[0] + (D[0] - A[0]) * t, A[1] + (D[1] - A[1]) * t, A[2] + (D[2] - A[2]) * t]; };
                const ptJ = (y) => { const t = y < -1e8 ? 1 : clamp((yb - y) / Math.max(0.01, yb - yc), 0, 1); return [B[0] + (C[0] - B[0]) * t, B[1] + (C[1] - B[1]) * t, B[2] + (C[2] - B[2]) * t]; };
                const col = (p) => krBand(p[1] + base, p[0], p[2]).map(v => v * q * 0.94), fuv = (p) => [(p[0] + p[2]) / 8, p[1] / 8];
                let pi0 = A, pj0 = B, ci0 = col(A), cj0 = col(B);
                for (let k = 1; k < lv.length; k++) { const pi1 = ptI(lv[k]), pj1 = ptJ(lv[k]), ci1 = col(pi1), cj1 = col(pj1);
                  gw.quadO(pi0, pj0, pj1, pi1, null, inn, [fuv(pi0), fuv(pj0), fuv(pj1), fuv(pi1)], [ci0, cj0, cj1, ci1]); pi0 = pi1; pj0 = pj1; ci0 = ci1; cj0 = cj1; }
              } else gw.quadO(A, B, C, D, null, Pt(i, 0, -bi.p[1][1] * 0.2 - 1), [wuv(A), wuv(B), [B[0] / 10, -(B[2]) / 10 + 0.4], [A[0] / 10, -(A[2]) / 10 + 0.4]], [wc2, wc2, dk, dk]);
              const E = Pt(i, side * bi.o1, -(T.hy[i] - bi.hl) - 0.32), F = Pt(j, side * bj.o1, -(T.hy[j] - bj.hl) - 0.32), sc = [0.44, 0.4, 0.33];
              gw.quadUp(D, C, F, E, [sc, sc, sc, sc], [wuv(D), wuv(C), wuv(F), wuv(E)]); nWall++; }
          }
        }
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat); addM(gw, gMat);
      }
      const gq = new GB(true), gw2 = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wht = [0.94, 0.93, 0.88];   // chequered start and finish lines, a white line at each checkpoint
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw2.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw2, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.84, 0.16, 0.14], [0.95, 0.95, 0.94], [0.12, 0.26, 0.56], [0.97, 0.82, 0.1], [0.18, 0.46, 0.3], [0.5, 0.32, 0.2], [0.12, 0.14, 0.2], [0.86, 0.62, 0.42], [0.46, 0.66, 0.86], [0.7, 0.2, 0.36]];
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a place board of the second atlas: [v0, v1, u0, u1]
    const signAt = (s, side, k, o) => { const [bx, bz, bi] = onSide(s, side, o || 1.4); if (excluded(bx, bz)) return;   // a place board on a post, facing the cars
      const by = caGround(bx, bz), [v0, v1, u0, u1] = board(k); box(scen.get(bx, bz), bx, by - 0.2, bz, 0.1, 2.6, 0.1, T.hd[bi], [0.6, 0.61, 0.63]); bannerQ(bx, by + 1.7, bz, -T.tx[bi], -T.tz[bi], 3.2, 0.8, v0, v1, u0, u1, ban2); exclPush(bx, bz, 2); };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const carCols = [[0.9, 0.9, 0.88], [0.72, 0.12, 0.1], [0.62, 0.6, 0.56], [0.16, 0.16, 0.18], [0.82, 0.76, 0.62], [0.24, 0.36, 0.5], [0.95, 0.95, 0.94]];
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the houses (def.bld: OpenStreetMap's footprints within 450 m, generic: the game names none): walls in the look's colours (LK.house),
       a tiled gable roof or a flat concrete one; only where the terrain is drawn under them and clear of the road (one mesh) ---- */
    let nBld = 0;
    {
      const RB = rng(LK.seed + 20), G = P.G, Lt = VRC * VRT, gh = new GB(), HS = LK.house;
      for (const [x, z, L0, W0, ang, h0] of def.bld || []) {
        const ti = Math.floor((x - G.x0) / Lt), tj = Math.floor((z - G.z0) / Lt); if (ti < 0 || tj < 0 || ti >= G.ntx || tj >= G.ntz || !caTileOn(ti, tj)) continue;
        const L = Math.max(4, L0), W = Math.max(3.5, W0), c = Math.cos(ang), s = Math.sin(ang); let lo = 1e9, clear = true;
        for (const [u, v] of [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2], [0, 0]]) { const px = x + c * u - s * v, pz = z + s * u + c * v; lo = Math.min(lo, caGround(px, pz)); if (vrNear(px, pz).dd < 0.8) clear = false; }
        if (!clear) continue;
        const col = vary(HS.cols[Math.floor(RB() * HS.cols.length)], RB, 0.05), H = h0 > 0 ? clamp(h0, 2.6, 12) : RB() < HS.tall ? 5.8 : 3.0;
        box(gh, x, lo - 1.2, z, L, H + 1.2, W, -ang, col, col);
        if (RB() < HS.gable) gable(gh, x, lo + H, z, L + 0.5, W + 0.5, Math.min(W * 0.42, 2.4), -ang, vary(HS.roof, RB, 0.05), col);
        else box(gh, x, lo + H, z, L + 0.3, 0.22, W + 0.3, -ang, HS.flat, HS.flat);
        nBld++;
      }
      addM(gh, lMat);
    }

    /* ---- the start: gantry with the start lights, the timing hut, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut: plastered white, a flat roof
      box(gh, hx, hy - 0.4, hz, 4.0, 3.1, 2.8, T.hd[i], [0.9, 0.89, 0.85], [0.58, 0.57, 0.54]); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.26, 0.3], null, true);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }

    /* ---- the checkpoints: a blue gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.12, 0.3, 0.56]));

    /* ---- the finish: chequered gantry, the board of the place, the cars' park with cars, people about; the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 18, sdP, 3.2), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the board: on posts, leaning back
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.3, 0.3, 0.3]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.3, 0.3, 0.3]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.38, 0.37, 0.35], [0.5, 0.49, 0.46]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 5);
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 10; k++) { const a = -12 + (k % 5) * 6, b = (k < 5 ? -4.5 : 4.5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || k === 2 || k === 7) continue;
        parkOn(caCar, caGround, 4.4, scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[k % carCols.length], R, 0.2)); }
      for (let k = 0; k < 8; k++) { const px = padF.x + (R() - 0.5) * 22, pz = padF.z + (R() - 0.5) * 22; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      out.marks.finish = [padF.x, padF.z];
    }

    /* ---- the viewpoints (def.views): a level terrace beside the road, a low stone wall round its outer half with a light top, a few people
       looking out; on the first a board with a picture of the hills (no words) ---- */
    {
      const st = [0.38, 0.37, 0.35], top = [0.88, 0.87, 0.83];
      views.forEach((v, kv) => {
        const g = scen.get(v.x, v.z), y = v.h, rx = v.x - T.px[v.i], rz = v.z - T.pz[v.i], rl = Math.hypot(rx, rz) || 1, oa = Math.atan2(rz / rl, rx / rl), rr = v.r;
        const at = (a, r, yy) => [v.x + Math.cos(a) * r, yy, v.z + Math.sin(a) * r];   // the wall: one curve of 16 pieces, its inner face, its outer face down onto the slope, its top
        for (let k = 0; k < 16; k++) { const a = oa - 1.35 + 2.7 * k / 16, b = oa - 1.35 + 2.7 * (k + 1) / 16, am = (a + b) / 2, mx = v.x + Math.cos(am) * rr, mz = v.z + Math.sin(am) * rr; if (vrNear(mx, mz).dd < 1.2) continue;
          const q = 0.9 + 0.16 * rpHash(k, 91 + kv), fc = [st[0] * q, st[1] * q, st[2] * q], inn = at(am, rr, y + 0.1), lo = Math.min(caGround(mx, mz), y) - 1.2;
          g.quadO(at(a, rr - 0.25, y - 0.3), at(b, rr - 0.25, y - 0.3), at(b, rr - 0.25, y + 0.6), at(a, rr - 0.25, y + 0.6), fc, inn);
          g.quadO(at(a, rr + 0.25, lo), at(b, rr + 0.25, lo), at(b, rr + 0.25, y + 0.6), at(a, rr + 0.25, y + 0.6), fc, inn);
          g.quadO(at(a, rr - 0.25, y + 0.6), at(b, rr - 0.25, y + 0.6), at(b, rr + 0.25, y + 0.6), at(a, rr + 0.25, y + 0.6), top, inn); }
        for (let k = 0; k < 3; k++) { const a = oa + (R() - 0.5) * 1.6, d = rr - 1 - R(); const px = v.x + Math.cos(a) * d, pz = v.z + Math.sin(a) * d; if (vrNear(px, pz).dd < 1.5) continue;
          crowdPut(CR, px, y + 0.05, pz, Math.cos(a), Math.sin(a), { col: fans[Math.floor(R() * fans.length)] }, 1); }
        CR.block(v.x, v.z, 2 * rr, 2 * rr, 0);
        if (kv === 0) {   // the board: on two posts at the terrace's edge by the road, facing it
          const fx = -rx / rl, fz = -rz / rl, bx = v.x + fx * (rr - 1.2), bz = v.z + fz * (rr - 1.2), ux = -fz, uz = fx;
          for (const o of [-0.75, 0.75]) box(g, bx + ux * o, y - 0.2, bz + uz * o, 0.1, 1.9, 0.1, -oa, [0.36, 0.26, 0.16]);
          bannerQ(bx, y + 0.75, bz, fx, fz, 1.8, 0.9, 1 - 4 / 8, 1 - 3 / 8, 4 / 8, 6 / 8, ban2, -0.15);
        }
      });
    }

    /* ---- the landmarks by the road (def.marks [x, z, kind]; all generic, no names or signs of their own): the memorial (a white obelisk on a
       stepped plinth of grey stone), the shrine (a small altar under a tiled roof, red pillars), the museum (a low hall with a tiled roof), the
       café (a small house with a flat roof and a terrace with a railing); each where the map has it, set back to clear the barrier ---- */
    let nMarks = 0, nKarst = 0, nLedge = 0, nX = 0;
    {
      const gm = new GB(), RM = rng(LK.seed + 40);
      for (const [mx, mz, kind] of def.marks || []) {
        const n = vrNear(mx, mz); if (n.i < 0) continue;
        const i = n.i, sd = (mx - T.px[i]) * T.nx[i] + (mz - T.pz[i]) * T.nz[i] >= 0 ? 1 : -1, bar = sd > 0 ? T.br[i] : T.bl[i];
        const r = kind === 'museum' ? 7 : kind === 'cafe' ? 5.5 : kind === 'monument' ? 4.5 : 2.5, d0 = Math.abs((mx - T.px[i]) * T.nx[i] + (mz - T.pz[i]) * T.nz[i]);
        const o = Math.max(bar + r + 1.5, d0), x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o, hd = T.hd[i];
        if (excluded(x, z)) continue;
        let lo = 1e9, hi = -1e9; for (const [a, b] of [[-r, -r], [r, -r], [r, r], [-r, r], [0, 0]]) { const h = caGround(x + a * 0.7, z + b * 0.7); lo = Math.min(lo, h); hi = Math.max(hi, h); }
        const y = Math.max(lo, hi - 1.6);   // (a level plot: cut into the slope, its outer edge on a footing)
        if (kind === 'monument') {
          const st = [0.6, 0.6, 0.58], st2 = [0.7, 0.69, 0.66], wh = [0.92, 0.92, 0.9];
          box(gm, x, y - 2.5, z, 7, 2.9, 7, hd, st, st2); box(gm, x, y + 0.4, z, 4.6, 0.6, 4.6, hd, st2, st2); box(gm, x, y + 1.0, z, 3, 0.6, 3, hd, st2, st2);
          box(gm, x, y + 1.6, z, 1.25, 8.4, 1.25, hd, wh, wh); cone(gm, x, y + 10.0, z, 0.9, 1.3, 4, wh, wh, hd + Math.PI / 4);
        } else if (kind === 'shrine') {
          const red = [0.66, 0.16, 0.12], roofC = [0.36, 0.3, 0.27], wall = [0.84, 0.8, 0.7];
          box(gm, x, y - 2, z, 3.2, 2.3, 3.2, hd, [0.58, 0.58, 0.56], [0.62, 0.62, 0.6]); box(gm, x, y + 0.3, z, 1.8, 1.4, 1.4, hd, wall, wall);
          for (const [a, b] of [[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]]) { const c = Math.cos(hd), s = Math.sin(hd); box(gm, x + a * c - b * s, y + 0.3, z + a * s + b * c, 0.18, 2.0, 0.18, hd, red, red); }
          gable(gm, x, y + 2.3, z, 3.4, 3.4, 1.0, hd, roofC, red);
        } else if (kind === 'museum' || kind === 'cafe') {
          const big = kind === 'museum', Lb = big ? 12 : 8, Wb = big ? 6.5 : 5.5, H = big ? 4.2 : 3.2, col = vary(big ? [0.86, 0.84, 0.78] : [0.9, 0.86, 0.72], RM, 0.04);
          const rot = hd;
          box(gm, x, y - 2.2, z, Lb, H + 2.2, Wb, rot, col, col);
          if (big) gable(gm, x, y + H, z, Lb + 0.8, Wb + 0.8, 2.0, rot, [0.36, 0.33, 0.32], col);
          else { box(gm, x, y + H, z, Lb + 0.4, 0.25, Wb + 0.4, rot, [0.58, 0.56, 0.52], [0.58, 0.56, 0.52]);
            const tx = x + T.nx[i] * sd * (Wb / 2 + 1.8), tz = z + T.nz[i] * sd * (Wb / 2 + 1.8), dk = [0.5, 0.4, 0.3];   // the terrace on the far side from the road, its railing
            box(gm, tx, y - 2.4, tz, Lb, 2.5, 3.4, hd, [0.6, 0.6, 0.58], dk);
            box(gm, tx + T.nx[i] * sd * 1.65, y + 0.1, tz + T.nz[i] * sd * 1.65, Lb, 0.95, 0.08, hd, dk, dk); }
          for (let k = 0; k < (big ? 3 : 4); k++) { const a = RM() * TAU, d = r + 1 + RM() * 2, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (vrNear(px, pz).dd < 1.5 || excluded(px, pz)) continue; person(px, pz, RM() * TAU); }
        }
        exclPush(x, z, r + 1.5); CR.block(x, z, 2 * r, 2 * r, hd); nMarks++;
      }
      addM(gm, lMat, true);
    }
    if (LK.extras) { const RX = rng(LK.seed + 60);   // (the look's own pieces: their own random numbers, the others' unchanged)
      nX = LK.extras({ scen, R: RX, onSide, excluded, exclPush, CR, views, sStart, sFin, marks: out.marks, person: (x, z, ro) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: fans[Math.floor(RX() * fans.length)] }, 1) }); }

    /* ---- the low parapets where the ground falls away and round the outside of the bends (LK.para: the face, the top, its blocks round the
       hairpins in the warning colour), a marker post every ~50 m where there is none (knockable where it fits: krProps); chevrons on the outside
       of each hairpin ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)], hp = new Uint8Array(N);
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) { need[sd][k] = 1; hp[k] = 1; } }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), white = LK.para.hp, stone = LK.para.stone, back = LK.para.back;
      const nearPad = (i) => { for (const p of views) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 4) return true; return false; };
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || nearPad(i) || bk[si][i]) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.15 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          if (nd[i] && nd[i + 1]) {   // the parapet: its face to the road in stones of a shade each, its top (whitewashed in 2 m blocks round the hairpins), the back
            const g = scen.get(T.px[i], T.pz[i]), blk = Math.floor(i * T.ds / 2), q = 0.9 + 0.16 * rpHash(blk, 83 + si), fc = [stone[0] * q, stone[1] * q, stone[2] * q];
            const tc = hp[i] && blk % 2 ? white : LK.para.top;
            const a = Q(i, -0.2), b = Q(i + 1, -0.2), c = Q(i + 1, 0.6), d = Q(i, 0.6);
            const a2 = Q(i, -0.6, 0.5), b2 = Q(i + 1, -0.6, 0.5), c2 = Q(i + 1, 0.6, 0.5), d2 = Q(i, 0.6, 0.5), inn = Q(i, 0.2, 0.25);
            g.quadO(a, b, c, d, fc, inn); g.quadO(a2, b2, c2, d2, back, inn); g.quadO(d, c, c2, d2, tc, inn);
          } else if (!nd[i] && i % 25 === 0 && i > 2 && i < iE - 2 && !bk[si][i]) mkPosts.push([i, side]);
        }
      }
      const kp = krProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.76, 0.12, 0.1], null, true);
      }
      (def.curves || []).forEach(([d, , turn]) => {   // three chevrons on the outside of each hairpin, facing the cars
        const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 6 && sStart + d <= q.i1 * T.ds + 6); if (!c || c.sev < 2) return;
        const out_ = -turn, cell = turn > 0 ? 30 : 31, u0 = (cell % 8) / 8, v1 = 1 - Math.floor(cell / 8) / 8;
        for (const o of [-10, 0, 10]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.9); if (excluded(cx, cz)) continue;
          const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
          bannerQ(cx, Math.max(cy, T.hy[ci]) + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2); CR.avoid(cx, cz, 0.6); }
      });
      if (LK.signs) LK.signs({ signAt, sStart, sFin, cv: def.curves || [], names: T.names, sdP: padF.sd, views, ds: T.ds });
    }

    /* ---- spectators, few (fewFans): the start and the finish, the checkpoints, the insides of two hairpins, the look's own (LK.fans) ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.1, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.1, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 50, sStart + 40, sd, { rows: 2, dens: 0.45, label: 'KR start' }); run(sFin - 50, sFin + 14, sd, { rows: 2, dens: 0.45, label: 'KR finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 16, s0 + 14, side, { rows: 1, dens: 0.4, label: 'KR cp' }); });
      (def.curves || []).forEach(([d, , turn], k) => { if (k !== 1 && k !== 4) return; const sm = sStart + d; run(sm - 14, sm + 14, turn, { rows: 1, dens: 0.4, label: 'KR hairpin ' + (k + 1) }); });
      if (LK.fans) LK.fans({ run, sStart, names: T.names });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants (instanced per 96 m chunk): the look's kinds (LK.kinds: krTreeGeo, KS) and their mix on each land cover (LK.mix[lc]: the
       share of the 4 m grid's points planted, the weight of each kind); the small ones only near the road (KS.near) ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const KN = LK.kinds, tk = KN.map(k => new IChunks(krTreeGeo(k), tMatT, 96));
    let nTrees = 0, nShrubs = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(60000 * dens), RT = rng(LK.seed + 30), SP = 4 / Math.sqrt(dens);
      const pick = (wt, r) => { let t = 0; for (let k = 0; k < wt.length; k++) t += wt[k]; let a = r * t; for (let k = 0; k < wt.length; k++) { a -= wt[k]; if (a <= 0 && wt[k] > 0) return k; } return wt.length - 1; };
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(260)) continue;
          const M = LK.mix[vrLC(x, z)] || LK.mix[0]; if (r1 > M[0]) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.4) continue; if (nn.i >= 0 && nn.dd < 6 && r2 < 0.3) continue;
          if (excluded(x, z) || pathD(x, z) < 1.2) continue;
          const sl = caSlope(x, z); if (sl > 1.25 || (sl > 0.7 && r2 < (sl - 0.7) / 0.55)) continue;
          const sp = pick(M[1], r3), S = KS[KN[sp]];
          if (S.near && hd > LOD.radius(S.near)) continue;
          const hgt = S.h[0] + r4 * S.h[1], wid = hgt * S.w[0] + S.w[1] + r2 * S.w[2], col = [S.c[0] + r2 * S.c[1], S.c[2] + r4 * S.c[3], S.c[4]];
          const tn = LK.tint && LK.tint[KN[sp]]; if (tn) { col[0] *= tn[0]; col[1] *= tn[1]; col[2] *= tn[2]; }
          tk[sp].add(x, caGround(x, z) - 0.1, z, r1 * 70, wid, hgt, col);
          if (S.tree) nTrees++; else nShrubs++;
          if (nTrees + nShrubs >= maxT) break grid;
        }
      }
      const kb = KN.indexOf('broad');
      if (kb >= 0) for (const [x, z] of def.trees || []) { if (excluded(x, z) || vrNear(x, z).dd < 3) continue; tk[kb].add(x, caGround(x, z) - 0.1, z, 1.3, 8, 9, [1, 1, 0.95]); nTrees++; }   // (the map's lone trees)
    }
    tk.forEach((t, k) => { const S = KS[KN[k]]; t.addTo(root, S.tree || (LOD.tier > 0 && !!S.shade)); });   // (NIZKA: only the trees cast shadows)

    /* ---- the stones and the rock: stones strewn on the grass by the road, blocks at the foot of the cuts, crags where the slope rises steep
       beside the road, along the map's cliffs and on its bare rock (def.cliffs, def.rocks); the karst's limestone (LK.rocks.karst) ---- */
    {
      const RW = rng(LK.seed + 50), dark = LK.rocks.main, tuff = LK.rocks.alt;
      const rockC = () => (RW() < 0.9 ? dark[Math.floor(RW() * dark.length)] : tuff[Math.floor(RW() * tuff.length)]);
      if (LK.rocks.karst) for (let s = 4; s < T.len - 4; s += 2.6) for (const side of [-1, 1]) {   // the karst: limestone boulders and knobs in the grass and the fields, more of them farther out
        if (RW() > 0.55 * LK.rocks.karst) continue; const o = 2.5 + Math.pow(RW(), 1.3) * 90, [x, z] = onSide(s, side, o), sz = 0.3 + Math.pow(RW(), 2) * 2.2;
        if (vrNear(x, z).dd < sz + 0.8 || excluded(x, z) || vrDist(x, z) > LOD.cap(100)) continue; const c = vrLC(x, z); if (c === 5 || c === 3) continue;
        rock(scen.get(x, z), x, caGround(x, z) + sz * 0.15, z, sz * (1 + RW() * 0.6), sz * (0.8 + RW() * 0.9), sz, RW() * TAU, vary(rockC(), RW, 0.06), RW, 0.4);
      }
      if (LK.rocks.karst) for (let s = 6; s < T.len - 6; s += 3.4) for (const side of [-1, 1]) {   // the karst's pinnacles: clumps of grey limestone knobs taller than wide, where its patches show through the grass (the ground's own grey, pal.karst)
        const o = 3 + Math.pow(RW(), 1.15) * 62, [x, z] = onSide(s, side, o), k = sstep(0.56, 0.8, P.c2(x * 2.6 + 311, z * 2.6));
        if (RW() > k * 0.95 * LK.rocks.karst || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue; const c = vrLC(x, z); if (c === 5 || c === 3 || (c === 6 && RW() < 0.7)) continue;
        const g = scen.get(x, z), b0 = vary(rockC(), RW, 0.05), m = 2 + Math.floor(RW() * 3);
        for (let q = 0; q < m; q++) { const r0 = 0.45 + RW() * 0.8, qx = x + (RW() - 0.5) * 5, qz = z + (RW() - 0.5) * 5, hh = r0 * (1.6 + RW() * 1.8);
          if (vrNear(qx, qz).dd < r0 + 1.2) continue;
          rock(g, qx, caGround(qx, qz) + hh * 0.35, qz, r0, hh, r0 * (0.7 + RW() * 0.4), RW() * TAU, vary(b0, RW, 0.06), RW, 0.45); nKarst++; }
      }
      API.ROCK_SMOOTH = false;
      if (LK.rocks.ledges) for (let s = 8; s < T.len - 8; s += 4.5) for (const side of [-1, 1]) {   // the canyon's beds: long low ledges of rock along the contours of the steep slopes (the harder strata standing out of the scree)
        if (RW() > 0.6 * LK.rocks.ledges) continue;
        const o = 4 + Math.pow(RW(), 1.25) * 70, [x, z] = onSide(s, side, o), m = 1 + Math.floor(RW() * 3), b0 = vary(rockC(), RW, 0.05).map(v => v * 0.96);
        if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(90) || vrLC(x, z) === 5) continue;
        const gx = caGround(x + 1.5, z) - caGround(x - 1.5, z), gz = caGround(x, z + 1.5) - caGround(x, z - 1.5); if (Math.hypot(gx, gz) / 3 < 0.5) continue;
        const rot = Math.atan2(gz, gx) + PI / 2, ux = Math.cos(rot), uz = Math.sin(rot); let u = 0;
        for (let q = 0; q < m; q++) {   // (a run of them along the same bed: each on the ground where it lies, its length along the contour)
          const L = 5 + RW() * 8, hh = 0.55 + RW() * 0.8, dp = 1.0 + RW() * 0.8, qx = x + ux * (u + L / 2), qz = z + uz * (u + L / 2); u += L + 0.5 + RW() * 2;
          if (vrNear(qx, qz).dd < L / 2 + 2.5 || excluded(qx, qz)) continue;
          rock(scen.get(qx, qz), qx, caGround(qx, qz) + hh * 0.2, qz, L / 2, hh, dp, rot, vary(b0, RW, 0.04), RW, 0.25, 0.5); nLedge++; }
      }
      if (LK.rocks.scree) for (let s = 6; s < T.len - 6; s += 2.2) for (const side of [-1, 1]) {   // the scree: stones strewn down the slopes near the road
        if (RW() > LK.rocks.scree) continue; const o = 2.5 + Math.pow(RW(), 1.4) * 45, [x, z] = onSide(s, side, o), sz = 0.16 + Math.pow(RW(), 2) * 0.55;
        if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrLC(x, z) === 5 || caSlope(x, z) < 0.3) continue;
        rock(scen.get(x, z), x, caGround(x, z) + sz * 0.2, z, sz * 1.3, sz * 0.8, sz, RW() * TAU, vary(rockC(), RW, 0.1), RW, 0.35);
      }
      for (let s = 6; s < T.len - 6; s += 4.2) for (const side of [-1, 1]) {   // stones beside the road
        if (RW() > 0.4) continue; const o = 1.8 + Math.pow(RW(), 1.6) * 34, [x, z] = onSide(s, side, o), sz = 0.18 + RW() * 0.45;
        if (vrNear(x, z).dd < sz + 0.5 || excluded(x, z) || vrLC(x, z) === 6) continue;
        rock(scen.get(x, z), x, caGround(x, z) + sz * 0.2, z, sz * 1.3, sz, sz, RW() * TAU, vary(rockC(), RW, 0.08), RW, 0.35);
      }
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {   // blocks at the foot of the cuts
        if (RW() > 0.32) continue;
        const o = 1.6 + Math.pow(RW(), 1.5) * 30, [x, z] = onSide(s, side, o), sz = 0.5 + RW() * 1.3; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RW() * TAU, vary(rockC(), RW, 0.1), RW, 0.3);
      }
      const crag = (x, z, n, rMax) => { const g = scen.get(x, z), b0 = vary(rockC(), RW, 0.06);
        for (let q = 0; q < n; q++) { const r0 = 1.1 + RW() * rMax, qx = x + (RW() - 0.5) * 10, qz = z + (RW() - 0.5) * 10, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1 || excluded(qx, qz)) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0, r0 * (0.9 + RW() * 0.9), r0 * (0.7 + RW() * 0.4), RW() * TAU, vary(b0, RW, 0.07), RW, 0.35); } };
      for (let s = 16; s < T.len - 16; s += 12) for (const side of [-1, 1]) {   // crags where the slope is steep
        if (RW() < 0.6) continue;
        const [x, z] = onSide(s, side, 12 + RW() * 120); if (excluded(x, z) || vrNear(x, z).dd < 10 || vrDist(x, z) > LOD.cap(110)) continue;
        if (caSlope(x, z) < (LK.rocks.crag || 1.0)) continue;
        crag(x, z, 1 + Math.floor(RW() * 3), 2.6);
      }
      for (const p of def.cliffs || []) for (let k = 0; k + 3 < p.length; k += 2) {   // the map's cliffs: crags along them, every ~12 m
        const ax = p[k], az = p[k + 1], bx = p[k + 2], bz = p[k + 3], L = Math.hypot(bx - ax, bz - az);
        for (let t = 0; t < L; t += 12) { const x = ax + (bx - ax) * t / L, z = az + (bz - az) * t / L; if (vrDist(x, z) > LOD.cap(130) || vrNear(x, z).dd < 8) continue; crag(x, z, 2, 2.4); }
      }
      for (const p of def.rocks || []) {   // the map's bare rock: crags inside its outlines, on a 14 m grid
        let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let k = 0; k < p.length; k += 2) { x0 = Math.min(x0, p[k]); x1 = Math.max(x1, p[k]); z0 = Math.min(z0, p[k + 1]); z1 = Math.max(z1, p[k + 1]); }
        const inside = (x, z) => { let c = false; for (let a = 0, b = p.length - 2; a < p.length; b = a, a += 2) { const ya = p[a + 1], yb = p[b + 1]; if ((ya > z) !== (yb > z) && x < (p[b] - p[a]) * (z - ya) / (yb - ya) + p[a]) c = !c; } return c; };
        for (let z = z0 + 7; z < z1; z += 14) for (let x = x0 + 7; x < x1; x += 14) { if (!inside(x, z) || RW() < 0.65 || vrDist(x, z) > LOD.cap(130) || vrNear(x, z).dd < 8) continue; crag(x, z, 1 + Math.floor(RW() * 2), 2.4); }
      }
    }

    /* ---- the view beyond the corridor (def.farDem: the hills and the valleys round; irFar, World.update moves it with the camera); finish
       the meshes ---- */
    const FAR = API.irFar ? API.irFar(LK.far) : null; if (FAR) { FAR.mesh.visible = false; root.add(FAR.mesh); out.dyn.irFar = FAR; }   // (hidden until the first World.update)
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: krAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: krAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, shrubs: nShrubs, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), walls: nWall, views: views.length, marks: nMarks, karst: nKarst, far: !!FAR };   // (read by the tests)
    if (LK.rocks.ledges) out.stats.ledges = nLedge; if (LK.extras) out.stats.extras = nX;
    return out;
  }


  // the roads of this builder: each its own theme (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.keep('VR', 'mapileng');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.mapileng = (scene, tex, opts) => buildKratke(scene, tex, opts, KR.mapileng);
  World.keep('VR', 'mujib');
  World.ext.mujib = (scene, tex, opts) => buildKratke(scene, tex, opts, KR.mujib);
})();
