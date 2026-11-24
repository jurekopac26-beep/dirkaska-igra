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
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caCar, caGH, caGround, caH, caSlope, caTileOn, clamp, cone, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl,
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
          for (let k = 0; k < 2; k++) { const px = kx + T.nx[i] * ox * (2.6 + k * 0.8) + cs * (k - 0.5) * 1.4, pz = kz + T.nz[i] * ox * (2.6 + k * 0.8) + sn * (k - 0.5) * 1.4; c.person(px, pz, Math.atan2(px - kx, kz - pz), true, Math.hypot(px - v.x, pz - v.z) < v.r - 0.3 ? y + 0.05 : null); }   // (its customers, on the terrace's floor)
          c.exclPush(kx, kz, 3); c.marks.stall = [kx, kz]; n++;
        }
        return n;
      },
    },
    // Sans Souci (the Seychelles, Mahé): the island's rainforest to the road's edge (tall trees with broad crowns high up, tree ferns and the
    // undergrowth; coconut palms and bananas by the houses), the grey granite in rounded boulders among the trees (rocks.boulders) and in the
    // bare domes of the peaks beyond (far), the red earth where it shows; the village's houses in their colours, pastel walls under iron roofs
    // painted red, green, blue or left grey (house.roofs); the asphalt with a dashed white centre line, concrete parapets on the drops (black
    // and white blocks round the hairpin), the concrete bridge over the stream; the boards in English (only places and plain words); the
    // buses' stops (def.stops), the village's lanes and drives up to the houses (def.lanes), the trailhead to the Morne Seychellois past the
    // finish (def.marks: trail)
    sanssouci: {
      seed: 7533, dust: [0.52, 0.42, 0.34],
      pal: { grass: [0.35, 0.5, 0.21], dry: [0.45, 0.55, 0.25], soil: [0.56, 0.37, 0.26], shrub: [0.26, 0.4, 0.16], tree: [0.19, 0.31, 0.13],
        field: [0.4, 0.53, 0.22], field2: [0.47, 0.56, 0.26], wall: [0.6, 0.58, 0.55], built: [0.5, 0.49, 0.44], bare: [0.6, 0.58, 0.54],
        rock: [0.6, 0.58, 0.55], rock2: [0.44, 0.43, 0.41], path: [0.56, 0.41, 0.31], verge: [0.44, 0.42, 0.34], karst: 0 },
      far: (A, sl, q) => { const rk = Math.min(1, sstep(0.55, 1.05, sl) * 0.85), lo = 1 - sstep(40, 200, A);   // (the forest dark on the mountains, lighter by the coast; the granite's domes grey on the steep)
        let c = [0.19 + q * 0.04, 0.3 + q * 0.04, 0.14 + q * 0.03]; c = [lerp(c[0], 0.3, lo * 0.5), lerp(c[1], 0.41, lo * 0.5), lerp(c[2], 0.21, lo * 0.5)];
        return [lerp(c[0], 0.56 + q * 0.05, rk), lerp(c[1], 0.55 + q * 0.05, rk), lerp(c[2], 0.52 + q * 0.04, rk)]; },
      lines: { centre: [0.92, 0.92, 0.88], dash: [3, 6] },
      para: { stone: [0.72, 0.71, 0.68], top: [0.86, 0.86, 0.84], hp: [0.13, 0.13, 0.14], back: [0.6, 0.6, 0.58], wall: [0.6, 0.59, 0.56], cope: [0.75, 0.74, 0.71] },
      rocks: { main: [[0.62, 0.6, 0.57], [0.68, 0.65, 0.61], [0.56, 0.55, 0.53], [0.71, 0.67, 0.62]], alt: [[0.4, 0.39, 0.37], [0.47, 0.45, 0.42]], karst: 0, crag: 0.85, boulders: 1 },
      kinds: ['rain', 'palm', 'fern', 'banana', 'shrub'],
      mix: { 0: [0.1, [0.12, 0.3, 0.08, 0.25, 0.25]], 1: [0.42, [0.64, 0.05, 0.19, 0.02, 0.1]], 2: [0.3, [0.12, 0.05, 0.22, 0.06, 0.55]], 3: [0.07, [0.15, 0.4, 0, 0.35, 0.1]],
        4: [0.01, [0, 0, 0.3, 0, 0.7]], 5: [0, [0, 0, 0, 0, 1]], 6: [0.25, [0.04, 0.22, 0, 0.6, 0.14]] },
      house: { cols: [[0.93, 0.86, 0.6], [0.72, 0.85, 0.7], [0.92, 0.76, 0.72], [0.74, 0.84, 0.9], [0.93, 0.92, 0.88], [0.95, 0.8, 0.55]], roof: [0.58, 0.2, 0.16],
        roofs: [[0.6, 0.2, 0.16], [0.22, 0.42, 0.26], [0.55, 0.56, 0.58], [0.2, 0.34, 0.56], [0.66, 0.26, 0.18]], flat: [0.62, 0.6, 0.56], gable: 0.9, tall: 0.12 },
      words: { start: 'START', finish: 'FINISH', fin: 'SANS SOUCI', title: 'SANS SOUCI · MAHÉ', sub: 'VICTORIA · PORT GLAUD', cp: ['#1d4f8f', '#fcd856'], finBg: '#1f6b3a', ban: ['#d62828', '#fcd856'] },
      boards: [['VICTORIA', '#1f6b3a'], ['PORT GLAUD', '#1f6b3a'], ['SANS SOUCI', '#1f6b3a'], ['VIEWPOINT', '#6b4a22'], ['DANGEROUS BENDS', '#f2f0ea'], ['SLOW', '#f2f0ea'],
        ['MORNE SEYCHELLOIS', '#6b4a22'], ['MORNE BLANC', '#1f6b3a']],
      // the signs (krAtlas2's boards by number): they drive on the left, so each stands on the left of the cars it is for (side -1 for the cars
      // going up, +1 for those coming down): Victoria behind the start for the cars going down, the bends' warning before the hairpin, the
      // village's name and slow into it (the buses' turning point), the viewpoint's board where the track to it leaves the road (~848 m, left:
      // the viewpoint itself ~80 m off the road, def.views), Port Glaud and Morne Blanc ahead past the finish, the national park's name by the
      // trailhead
      signs: (c) => { c.signAt(c.sStart - 60, 1, 0); if (c.cv[0]) c.signAt(c.sStart + c.cv[0][0] - 100, -1, 4);
        c.signAt(c.sStart + 420, -1, 2); c.signAt(c.sStart + 505, -1, 5); c.signAt(c.sStart + 803, -1, 3);
        c.signAt(c.sFin + 70, 1, 6); c.signAt(c.sFin + 110, -1, 1); c.signAt(c.sFin + 175, -1, 7); },
    },
    // Banaue (the Philippines, Ifugao): the rice terraces of the Ifugao on the slope below the road (terr: the slope cut into level paddies
    // along its contours, flooded silver, muddy or green with the rice, the walls of earth grown over with grass between them, a dike along
    // each), the woods of broadleaved trees and a few pines above it, bananas and ferns by the houses; the hamlet's houses of concrete in their
    // colours under iron roofs (grey, rusty, green, blue, red; house.roofs); the concrete road in its slabs (lines.concrete: krConcTex, a joint
    // across every 4 m) with a yellow centre line, low concrete parapets on the drops (yellow blocks round the hairpin); the boards in English
    // (only places and plain words); the viewpoints over the terraces beside the road (viewR: the map's up to 40 m off the road), a souvenir
    // stall by each and an Ifugao house (a bale) by the first (extras)
    banaue: {
      seed: 8641, dust: [0.5, 0.45, 0.37],
      pal: { grass: [0.37, 0.51, 0.21], dry: [0.47, 0.54, 0.27], soil: [0.5, 0.38, 0.26], shrub: [0.27, 0.4, 0.17], tree: [0.19, 0.31, 0.13],
        field: [0.42, 0.55, 0.23], field2: [0.55, 0.6, 0.55], wall: [0.31, 0.41, 0.18], built: [0.54, 0.52, 0.48], bare: [0.55, 0.5, 0.42],
        rock: [0.55, 0.53, 0.5], rock2: [0.42, 0.41, 0.38], path: [0.52, 0.44, 0.34], verge: [0.45, 0.44, 0.35], karst: 0,
        fband: 1.0 },   // (the fields' bands along the contours closer: the terraces beyond the reach of their own steps, fading where the grid can't draw them)
      far: (A, sl, q) => { const rk = Math.min(1, sstep(0.75, 1.25, sl) * 0.55), t = sstep(1450, 1150, A) * sstep(0.75, 0.35, sl);   // (the woods dark on the ridges, the terraces' lighter greens down the valleys' gentler slopes)
        let c = [0.2 + q * 0.04, 0.31 + q * 0.04, 0.15 + q * 0.03]; c = [lerp(c[0], 0.38 + q * 0.05, t * 0.8), lerp(c[1], 0.47 + q * 0.04, t * 0.8), lerp(c[2], 0.26 + q * 0.03, t * 0.8)];
        return [lerp(c[0], 0.47 + q * 0.04, rk), lerp(c[1], 0.47 + q * 0.04, rk), lerp(c[2], 0.42 + q * 0.03, rk)]; },
      lines: { centre: [0.93, 0.75, 0.16], edge: [0.9, 0.9, 0.86], concrete: true },
      para: { stone: [0.74, 0.73, 0.7], top: [0.86, 0.85, 0.82], hp: [0.93, 0.77, 0.15], back: [0.62, 0.61, 0.58], wall: [0.6, 0.59, 0.56], cope: [0.75, 0.74, 0.71] },
      rocks: { main: [[0.52, 0.5, 0.47], [0.58, 0.56, 0.52], [0.47, 0.46, 0.44], [0.62, 0.6, 0.55]], alt: [[0.4, 0.37, 0.33], [0.45, 0.41, 0.36]], karst: 0, crag: 1.15 },
      kinds: ['broad', 'rain', 'pine', 'shrub', 'tuft', 'banana', 'fern'],
      mix: { 0: [0.1, [0.12, 0.04, 0.03, 0.3, 0.38, 0.08, 0.05]], 1: [0.42, [0.42, 0.25, 0.12, 0.12, 0, 0.02, 0.07]], 2: [0.3, [0.1, 0.03, 0.03, 0.6, 0.12, 0.05, 0.07]],
        3: [0.07, [0.15, 0, 0, 0.15, 0.1, 0.5, 0.1]], 4: [0.01, [0, 0, 0, 0.7, 0.3, 0, 0]], 5: [0, [0, 0, 0, 1, 0, 0, 0]], 6: [0.05, [0.05, 0, 0, 0.25, 0.5, 0.15, 0.05]] },
      house: { cols: [[0.8, 0.79, 0.74], [0.9, 0.86, 0.72], [0.74, 0.84, 0.72], [0.9, 0.79, 0.76], [0.76, 0.84, 0.9], [0.93, 0.92, 0.88]], roof: [0.5, 0.3, 0.2],
        roofs: [[0.5, 0.3, 0.2], [0.24, 0.42, 0.3], [0.25, 0.36, 0.55], [0.62, 0.22, 0.18], [0.56, 0.57, 0.58]], flat: [0.6, 0.59, 0.56], gable: 0.7, tall: 0.35 },
      words: { start: 'START', finish: 'FINISH', fin: 'BANAUE', title: 'BANAUE · IFUGAO', sub: 'BONTOC · BANAUE', cp: ['#0038a8', '#fcd116'], finBg: '#1f6b3a', ban: ['#ce1126', '#fcd116'] },
      boards: [['BANAUE', '#1f6b3a'], ['BONTOC', '#1f6b3a'], ['RICE TERRACES', '#6b4a22'], ['VIEWPOINT', '#6b4a22'], ['DANGEROUS CURVES', '#f2f0ea'], ['SLOW DOWN', '#f2f0ea'],
        ['MAYOYAO', '#1f6b3a'], ['HUNGDUAN', '#1f6b3a']],
      // the signs (krAtlas2's boards by number): they drive on the right (side +1 for the cars of the race, -1 for those coming the other way):
      // Bontoc behind the start for the cars going north, the terraces' board after the start, slow before the hamlet, the viewpoint's board
      // before each, the bends' warning before the hairpin, Banaue, Mayoyao and Hungduan ahead past the finish (the roads from the town)
      signs: (c) => { c.signAt(c.sStart - 60, -1, 1); c.signAt(c.sStart + 35, 1, 2); c.signAt(c.sStart + 215, 1, 5);
        for (const v of c.views) c.signAt(v.i * c.ds - 45, v.sd || 1, 3);
        if (c.cv[0]) c.signAt(c.sStart + c.cv[0][0] - 110, 1, 4);
        c.signAt(c.sFin + 70, 1, 0); c.signAt(c.sFin + 120, 1, 6); c.signAt(c.sFin + 165, 1, 7); },
      viewR: 40,
      // the terraces (buildKratke: the rice terraces): a step every dh m of height, from d0 m beyond the barrier (full d0 + 6 on), within reach
      // m of the road (and 25 m more fading out), on slopes from flat (full at 2.5 flat) up to slope (gone 0.35 steeper), the dikes lip m over
      // the paddy and dikeW wide; each paddy's colour on its patch m along its band (paddy: [share, colour]: the
      // flooded ones the sky's silver, the muddy, the young rice, the rice grown, ripening), the walls' grass and the dikes'
      terr: { dh: 2.1, d0: 6, reach: 125, slope: 1.0, flat: 0.05, patch: 14, lip: 0.3, dikeW: 0.5,
        paddy: [[0.17, [0.58, 0.65, 0.68]], [0.08, [0.45, 0.39, 0.3]], [0.36, [0.46, 0.62, 0.24]], [0.31, [0.36, 0.5, 0.19]], [0.08, [0.62, 0.6, 0.3]]],
        wall: [0.35, 0.42, 0.21], dike: [0.45, 0.55, 0.26] },
      // at each viewpoint a souvenir stall at the terrace's far end along the road (a kiosk of planks under an iron roof, woven cloths in their
      // reds and blacks hung along its front, a table of carvings), by the first an Ifugao house (a bale: a box of dark wood on four posts,
      // each under its round guard, a tall pyramid of thatch over it) at the near end; generic, no names or words
      extras: (c) => {
        let n = 0;
        c.views.forEach((v, kv) => {
          const i = v.i, hd = T.hd[i], cs = Math.cos(hd), sn = Math.sin(hd), y = v.h, ox = (v.x - T.px[i]) * T.nx[i] + (v.z - T.pz[i]) * T.nz[i] > 0 ? 1 : -1, nx = T.nx[i] * ox, nz = T.nz[i] * ox;
          const kx = v.x + cs * (v.r - 1.7), kz = v.z + sn * (v.r - 1.7), g = c.scen.get(kx, kz), wd = [0.46, 0.33, 0.21], wd2 = [0.38, 0.27, 0.17], roofC = [0.55, 0.56, 0.58];
          box(g, kx, y - 0.4, kz, 2.2, 2.75, 2.0, hd, wd, wd2);   // the kiosk
          box(g, kx - nx * 0.25, y + 2.35, kz - nz * 0.25, 2.8, 0.08, 2.9, hd, roofC, roofC);   // its roof, over the counter towards the road
          for (const u of [-1.3, 1.3]) cyl(g, kx + cs * u - nx * 1.55, y - 0.05, kz + sn * u - nz * 1.55, 0.05, 2.4, 4, wd2);
          const tc = [[0.66, 0.12, 0.1], [0.1, 0.09, 0.09], [0.86, 0.84, 0.78], [0.62, 0.16, 0.12]];
          for (let q = 0; q < 4; q++) { const u = -0.85 + q * 0.56, px = kx + cs * u - nx * 1.06, pz = kz + sn * u - nz * 1.06; box(g, px, y + 0.85, pz, 0.46, 1.25, 0.04, hd, tc[(q + kv) % 4], tc[(q + kv) % 4]); }   // (the cloths)
          box(g, kx - nx * 1.45, y, kz - nz * 1.45, 1.9, 0.8, 0.6, hd, wd2, [0.56, 0.42, 0.28]);   // the table
          c.exclPush(kx, kz, 2.4); c.CR.block(kx - nx * 0.5, kz - nz * 0.5, 2.6, 3.4, hd); n++;
          if (kv === 0) {   // the bale
            const bx = v.x - cs * (v.r - 2.3), bz = v.z - sn * (v.r - 2.3), gb = c.scen.get(bx, bz), post = [0.22, 0.16, 0.11], wood = [0.29, 0.2, 0.13], th = [0.52, 0.44, 0.31], th2 = [0.44, 0.37, 0.26];
            for (const [a, b] of [[-1.05, -1.05], [1.05, -1.05], [1.05, 1.05], [-1.05, 1.05]]) { const px = bx + a * cs - b * sn, pz = bz + a * sn + b * cs;
              cyl(gb, px, y - 0.2, pz, 0.12, 1.75, 6, post, null, 0.1); cyl(gb, px, y + 1.5, pz, 0.34, 0.08, 8, wood, wood); }   // (the posts, the rats' guards)
            box(gb, bx, y + 1.62, bz, 2.7, 1.15, 2.7, hd, wood, wood);
            cone(gb, bx, y + 2.15, bz, 2.85, 3.2, 4, th, th2, hd + Math.PI / 4);
            c.exclPush(bx, bz, 2.8); c.CR.block(bx, bz, 3.6, 3.6, hd); n++;
          }
        });
        return n;
      },
    },
    // Atitlán (Guatemala, Sololá): the southern edge of the town on the slope above the lake, then the woods down the slope: the houses of
    // concrete blocks, bare grey or painted in their colours, under iron sheets sloping one way (grey, rusty), the old red tiles or a flat
    // roof with its black water tank (house; extras: more where the land is built over and the map has none), their yards of maize with
    // avocados and cypresses; the hospital's long pavilions (the map's, generic: no name; the board HOSPITAL by the road), the restaurant by
    // the road with its tables out under parasols (def.eat), the football pitch of earth and the basketball court (def.pitches), the power
    // line on its steel lattice towers over the road (def.power); below the town the forest of pines with cypresses and oaks; the asphalt
    // with a double yellow centre line and white edge lines, low concrete parapets on the drops (yellow blocks round the hairpins); the boards
    // in Spanish (only places and plain words); the lake and its three volcanoes ahead on the horizon (far; farWet: the lake's deep blue)
    atitlan: {
      seed: 9157, dust: [0.5, 0.44, 0.36],
      pal: { grass: [0.4, 0.49, 0.23], dry: [0.53, 0.52, 0.3], soil: [0.45, 0.35, 0.25], shrub: [0.28, 0.38, 0.17], tree: [0.17, 0.27, 0.13],
        field: [0.48, 0.5, 0.27], field2: [0.55, 0.48, 0.31], wall: [0.38, 0.42, 0.22], built: [0.5, 0.46, 0.38], bare: [0.52, 0.46, 0.38],
        rock: [0.47, 0.45, 0.42], rock2: [0.36, 0.35, 0.33], path: [0.47, 0.37, 0.27], verge: [0.44, 0.41, 0.33], karst: 0 },
      far: (A, sl, q) => { const rk = Math.min(1, sstep(0.8, 1.3, sl) * 0.5), fld = sstep(0.45, 0.2, sl) * sstep(1650, 1850, A) * sstep(2900, 2500, A), top = sstep(2850, 3300, A);
        let c = [0.17 + q * 0.04, 0.27 + q * 0.04, 0.14 + q * 0.03];   // (the woods of pines and oaks on the slopes)
        c = [lerp(c[0], 0.42 + q * 0.06, fld * 0.7), lerp(c[1], 0.45 + q * 0.05, fld * 0.7), lerp(c[2], 0.27 + q * 0.04, fld * 0.7)];   // (the maize on the gentler ground of the plateau and the shores)
        c = [lerp(c[0], 0.31, top * 0.55), lerp(c[1], 0.32, top * 0.55), lerp(c[2], 0.27, top * 0.55)];   // (the volcanoes' tops: scrub, grass and ash)
        return [lerp(c[0], 0.42 + q * 0.04, rk), lerp(c[1], 0.4 + q * 0.04, rk), lerp(c[2], 0.36 + q * 0.03, rk)]; },   // (the crater's walls round the lake)
      farWet: [0.1, 0.24, 0.37],
      lines: { centre: [0.93, 0.76, 0.16], edge: [0.9, 0.9, 0.86], double: true },
      para: { stone: [0.72, 0.71, 0.68], top: [0.85, 0.84, 0.81], hp: [0.93, 0.77, 0.15], back: [0.6, 0.6, 0.57], wall: [0.58, 0.57, 0.54], cope: [0.74, 0.73, 0.7] },
      rocks: { main: [[0.42, 0.4, 0.38], [0.48, 0.46, 0.43], [0.37, 0.36, 0.34], [0.52, 0.5, 0.46]], alt: [[0.62, 0.58, 0.52], [0.56, 0.53, 0.48]], karst: 0, crag: 1.0 },
      kinds: ['pine', 'cypress', 'broad', 'shrub', 'tuft', 'maize'],
      mix: { 0: [0.16, [0.06, 0.05, 0.05, 0.16, 0.28, 0.4]], 1: [0.44, [0.58, 0.14, 0.14, 0.1, 0.04, 0]], 2: [0.3, [0.1, 0.05, 0.1, 0.55, 0.2, 0]],
        3: [0.15, [0.03, 0.1, 0.17, 0.15, 0.05, 0.5]], 4: [0.01, [0, 0, 0, 0.7, 0.3, 0]], 5: [0, [0, 0, 0, 1, 0, 0]], 6: [0.35, [0.01, 0.02, 0.01, 0.06, 0.1, 0.8]] },
      tint: { maize: [1.1, 1.0, 0.86] },   // (the maize of November, drying before the harvest)
      house: { cols: [[0.92, 0.91, 0.87], [0.92, 0.85, 0.66], [0.42, 0.72, 0.7], [0.9, 0.62, 0.5], [0.93, 0.8, 0.36], [0.58, 0.74, 0.86], [0.88, 0.6, 0.66], [0.6, 0.76, 0.52]],
        roof: [0.56, 0.57, 0.58], roofs: [[0.56, 0.57, 0.58], [0.5, 0.33, 0.22], [0.6, 0.29, 0.2], [0.45, 0.47, 0.5], [0.62, 0.62, 0.6]], flat: [0.6, 0.59, 0.56], gable: 0.55, tall: 0.3 },
      words: { start: 'SALIDA', finish: 'META', fin: 'ATITLÁN', title: 'SOLOLÁ · ATITLÁN', sub: 'SOLOLÁ · PANAJACHEL', cp: ['#3d86c6', '#ffffff'], finBg: '#1f6b3a', ban: ['#3d86c6', '#ffffff'] },
      boards: [['SOLOLÁ', '#1f6b3a'], ['PANAJACHEL', '#1f6b3a'], ['LAGO DE ATITLÁN', '#6b4a22'], ['HOSPITAL', '#1d4f9c'], ['CURVA PELIGROSA', '#f2f0ea'], ['DESPACIO', '#f2f0ea'],
        ['SAN JORGE LA LAGUNA', '#1f6b3a'], ['SAN ANDRÉS SEMETABAJ', '#1f6b3a']],
      // the signs (krAtlas2's boards by number): they drive on the right (side +1 for the cars of the race, -1 for those coming the other way):
      // Sololá and San Jorge behind the start for the cars going up, the hospital's board before the start, the bends' warning before the
      // first hairpin, slow through the town, the lake's board where the woods begin, Panajachel and San Andrés ahead past the finish
      signs: (c) => { c.signAt(c.sStart - 60, -1, 0); c.signAt(c.sStart - 110, -1, 6); c.signAt(c.sStart - 35, 1, 3);
        if (c.cv[0]) c.signAt(c.sStart + c.cv[0][0] - 60, 1, 4); c.signAt(c.sStart + 215, 1, 5); c.signAt(c.sStart + 525, 1, 2);
        c.signAt(c.sFin + 70, 1, 1); c.signAt(c.sFin + 120, 1, 7); },
      // the town's own (extras; their own random numbers): the pitches (def.pitches: the football pitch of earth with its white lines and
      // goals, the basketball court of concrete with a hoop at each end, on the ground as it lies), the restaurant's tables under their
      // parasols between its house and the road (def.eat), the power line's steel lattice towers (def.power: three cross arms a side for its
      // two circuits) with the wires sagging between them, kept 7 m over the ground; then the town's houses where the land is built over
      // (lc 3) and the map has none: in rows along the road on both sides, the first from 4.5 m beyond the barrier (the run-off kept clear),
      // each turned to the road, a door and a window on its face to it; clear of all that stands before them (the map's houses and the
      // hospital's grounds round its halls, the lanes, the paths, the pitches, the towers, the plots and the gantries), of the other legs of
      // the road, of the steep and of the woods. All generic, no names or words
      extras: (c) => {
        let n = 0; const R = c.R, def = T.def, PI = Math.PI, rod = API.ouRod, VG = API.VR.G, Lt = VRC * VRT;
        const tileOn = (x, z, near) => { const ti = Math.floor((x - VG.x0) / Lt), tj = Math.floor((z - VG.z0) / Lt); if (ti < 0 || tj < 0 || ti >= VG.ntx || tj >= VG.ntz) return false; const o = caTileOn(ti, tj); return near ? o === 1 : !!o; };
        const gAt = (x, z) => { const nn = vrNear(x, z); return nn.i >= 0 && nn.dd < 0.5 ? Math.max(caGround(x, z), T.hy[nn.i]) : caGround(x, z); };   // (the ground, or the road over it)
        const white = [0.94, 0.94, 0.92];
        // -- the pitches: the smallest box round each outline (a side along one of its edges), a little inside it
        const dr = new GB(), dY = 0.05, lineY = 0.085;
        const strip = (x0, z0, x1, z1, hw, col) => { const L = Math.hypot(x1 - x0, z1 - z0), m = Math.max(1, Math.ceil(L / 3)), px = -(z1 - z0) / L * hw, pz = (x1 - x0) / L * hw;
          for (let k = 0; k < m; k++) { const a = k / m, b = (k + 1) / m, ax = lerp(x0, x1, a), az = lerp(z0, z1, a), bx = lerp(x0, x1, b), bz = lerp(z0, z1, b);
            const A = [ax + px, caGround(ax + px, az + pz) + lineY, az + pz], B = [ax - px, caGround(ax - px, az - pz) + lineY, az - pz], C = [bx - px, caGround(bx - px, bz - pz) + lineY, bz - pz], D = [bx + px, caGround(bx + px, bz + pz) + lineY, bz + pz];
            dr.quadUp(A, B, C, D, [col, col, col, col]); } };
        for (const p of def.pitches || []) {
          const sp = p[0], Q = []; for (let k = 1; k + 1 < p.length; k += 2) Q.push([p[k], p[k + 1]]);
          if (Q.length > 3 && Math.hypot(Q[0][0] - Q[Q.length - 1][0], Q[0][1] - Q[Q.length - 1][1]) < 0.5) Q.pop();
          if (Q.length < 3) continue;
          let bb = null;
          for (let k = 0; k < Q.length; k++) { const [ax, az] = Q[k], [bx, bz] = Q[(k + 1) % Q.length], a = Math.atan2(bz - az, bx - ax), ux = Math.cos(a), uz = Math.sin(a);
            let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of Q) { const u = x * ux + z * uz, v = -x * uz + z * ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
            const ar = (u1 - u0) * (v1 - v0); if (!bb || ar < bb.ar) bb = { ar, a, u: (u0 + u1) / 2, v: (v0 + v1) / 2, L: u1 - u0, W: v1 - v0 }; }
          const cx = bb.u * Math.cos(bb.a) - bb.v * Math.sin(bb.a), cz = bb.u * Math.sin(bb.a) + bb.v * Math.cos(bb.a);
          let a = bb.a, L = bb.L, W = bb.W; if (W > L) { a += PI / 2; [L, W] = [W, L]; }
          if (sp === 2) { L = Math.min(L * 0.92, 28); W = Math.min(W * 0.9, 15); } else { L = Math.min(L * 0.9, 100); W = Math.min(W * 0.9, L * 0.66); }
          const ux = Math.cos(a), uz = Math.sin(a), at = (u, v) => [cx + ux * u - uz * v, cz + uz * u + ux * v];
          const free = (l, w) => ![[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]].some(([su, sv]) => { const [x, z] = at(su * l / 2, sv * w / 2); return !tileOn(x, z, true) || vrNear(x, z).dd < 2 || c.excluded(x, z); });
          const f = [1, 0.88, 0.76, 0.64].find(f => free(L * f, W * f)); if (!f) continue;   // (smaller round its middle where a corner falls on something)
          L *= f; W *= f;
          // the surface: earth (the football pitch, worn bare in the goalmouths and down the middle) or concrete (the court), a little uneven
          const nu = Math.ceil(L / 3), nv = Math.ceil(W / 3), base = sp === 2 ? [0.6, 0.6, 0.57] : [0.56, 0.45, 0.33], V = [];
          for (let j = 0; j <= nv; j++) { const row = []; for (let k = 0; k <= nu; k++) { const u = -L / 2 + k * L / nu, v = -W / 2 + j * W / nv, [x, z] = at(u, v), q = 0.94 + 0.1 * rpHash(k + 31 * j, 47), wear = sp === 2 ? 0 : Math.exp(-(v * v) / (W * W * 0.02)) * (0.35 + 0.65 * sstep(L * 0.3, L * 0.5, Math.abs(u)));
            row.push([[x, caGround(x, z) + dY, z], [base[0] * q * (1 + wear * 0.1), base[1] * q * (1 + wear * 0.06), base[2] * q]]); } V.push(row); }
          for (let j = 0; j < nv; j++) for (let k = 0; k < nu; k++) { const A = V[j][k], B = V[j][k + 1], C = V[j + 1][k + 1], D = V[j + 1][k]; dr.quadUp(A[0], B[0], C[0], D[0], [A[1], B[1], C[1], D[1]]); }
          const ln = (u0, v0, u1, v1) => { const [x0, z0] = at(u0, v0), [x1, z1] = at(u1, v1); strip(x0, z0, x1, z1, 0.06, white); };
          ln(-L / 2, -W / 2, L / 2, -W / 2); ln(-L / 2, W / 2, L / 2, W / 2); ln(-L / 2, -W / 2, -L / 2, W / 2); ln(L / 2, -W / 2, L / 2, W / 2); ln(0, -W / 2, 0, W / 2);
          const rc = sp === 2 ? 1.8 : Math.min(7, W * 0.16); for (let k = 0; k < 12; k++) { const t0 = k / 12 * TAU, t1 = (k + 1) / 12 * TAU; ln(Math.cos(t0) * rc, Math.sin(t0) * rc, Math.cos(t1) * rc, Math.sin(t1) * rc); }
          const g = c.scen.get(cx, cz);
          for (const e of [-1, 1]) {
            if (sp === 2) {   // the basketball court: the keys, a hoop on a post at each end (the post behind the line, the board over it)
              const kw = 2.45, kl = 5.8; ln(e * L / 2, -kw, e * (L / 2 - kl), -kw); ln(e * L / 2, kw, e * (L / 2 - kl), kw); ln(e * (L / 2 - kl), -kw, e * (L / 2 - kl), kw);
              const [px, pz] = at(e * (L / 2 + 0.9), 0), [bx, bz] = at(e * (L / 2 - 1.2), 0), gy = caGround(px, pz), by = caGround(bx, bz);
              cyl(g, px, gy - 0.3, pz, 0.08, 3.65, 6, [0.32, 0.34, 0.36]); box(g, (px + bx) / 2, gy + 3.2, (pz + bz) / 2, 2.1, 0.1, 0.1, a, [0.32, 0.34, 0.36]);
              box(g, bx, by + 2.9, bz, 0.06, 1.05, 1.8, a, white, white); box(g, bx - ux * e * 0.3, by + 3.05, bz - uz * e * 0.3, 0.45, 0.03, 0.45, a, [0.86, 0.36, 0.12]);
            } else {   // the football pitch: the penalty areas, a goal at each end (two posts and the bar, white)
              const pw = Math.min(W * 0.3, 20), pl = Math.min(L * 0.15, 16); ln(e * L / 2, -pw, e * (L / 2 - pl), -pw); ln(e * L / 2, pw, e * (L / 2 - pl), pw); ln(e * (L / 2 - pl), -pw, e * (L / 2 - pl), pw);
              const gw = Math.min(7.3, W * 0.17), gh = gw > 5 ? 2.44 : 2.0;
              for (const sv of [-1, 1]) { const [px, pz] = at(e * L / 2, sv * gw / 2), gy = caGround(px, pz); box(g, px, gy - 0.3, pz, 0.12, gh + 0.36, 0.12, a, white, white); }
              const [mx, mz] = at(e * L / 2, 0), my = Math.max(caGround(...at(e * L / 2, -gw / 2)), caGround(...at(e * L / 2, gw / 2)));
              box(g, mx, my + gh - 0.06, mz, 0.12, 0.12, gw + 0.12, a, white, white);
            }
          }
          for (let t = -L / 2 + W / 2; t <= L / 2 - W / 2 + 0.01; t += Math.max(1, W / 2)) { const [x, z] = at(t, 0); c.exclPush(x, z, W * 0.72 + 1.5); }
          c.CR.block(cx, cz, L + 3, W + 3, a); n++;
        }
        if (!dr.empty) { const m = new THREE.Mesh(dr.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }));
          m.receiveShadow = true; m.matrixAutoUpdate = false; c.root.add(m); }
        // -- the restaurant: its house the map's nearest to def.eat's point; three tables under parasols between it and the road, two of its people
        for (const [ex, ez] of def.eat || []) {
          let b = null, bd = 4; for (const q of def.bld || []) { const d = Math.hypot(q[0] - ex, q[1] - ez); if (d < bd) { bd = d; b = q; } }
          const nn = b ? vrNear(b[0], b[1]) : null; if (!nn || nn.i < 0) continue;
          const i = nn.i, sd = (b[0] - T.px[i]) * T.nx[i] + (b[1] - T.pz[i]) * T.nz[i] >= 0 ? 1 : -1, tx = -T.nx[i] * sd, tz = -T.nz[i] * sd, ca = Math.cos(b[4]), sa = Math.sin(b[4]);
          const hx = Math.abs(ca * tx + sa * tz) * Math.min(34, b[2]) / 2 + Math.abs(-sa * tx + ca * tz) * Math.min(20, b[3]) / 2;   // (its half depth towards the road)
          const pc = [[0.82, 0.2, 0.16], [0.94, 0.93, 0.9], [0.2, 0.46, 0.3]];
          for (let k = -1; k <= 1; k++) {
            const o = hx + 2.9 + (k === 0 ? 0.5 : 0), x = b[0] + tx * o + T.tx[i] * k * 3.1, z = b[1] + tz * o + T.tz[i] * k * 3.1;
            if (vrNear(x, z).dd < 1.6) continue;
            const g = c.scen.get(x, z), y = caGround(x, z), tc = [0.93, 0.93, 0.9];
            cyl(g, x, y - 0.1, z, 0.06, 0.85, 4, tc); cyl(g, x, y + 0.72, z, 0.5, 0.05, 10, tc, tc);   // the table
            cyl(g, x, y + 0.75, z, 0.03, 1.5, 4, [0.4, 0.4, 0.42]); cone(g, x, y + 2.05, z, 1.4, 0.5, 8, pc[k + 1], pc[k + 1], 0);   // its parasol
            c.exclPush(x, z, 1.8); c.CR.block(x, z, 2.6, 2.6, T.hd[i]); n++;
            if (k !== 0) c.person(x + T.tx[i] * k * 1.1, z + T.tz[i] * k * 1.1, Math.atan2(k * T.tx[i], -k * T.tz[i]), true);
          }
        }
        // -- the power line: a lattice tower at each of its points on the terrain (none on the road), its arms across the line; the wires between two
        const st = [0.6, 0.62, 0.63], ins = [0.52, 0.45, 0.4], wireC = [0.2, 0.2, 0.21], H0 = 15, Ht = 25, b0 = 2.3, b1 = 0.75, bt = 0.5, C4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        const half = (h) => h <= H0 ? lerp(b0, b1, h / H0) : lerp(b1, bt, (h - H0) / (Ht - H0));
        for (const p of def.power || []) {
          const TW = []; for (let k = 1; k + 1 < p.length; k += 2) TW.push([p[k], p[k + 1]]);
          const tips = TW.map(([x, z], k) => {
            if (!tileOn(x, z, false) || vrNear(x, z).dd < 4 || c.excluded(x, z)) return null;
            const A = TW[Math.max(0, k - 1)], B = TW[Math.min(TW.length - 1, k + 1)], d = Math.atan2(B[1] - A[1], B[0] - A[0]), ux = Math.cos(d), uz = Math.sin(d), px = -uz, pz = ux;   // (u along the line, v across it)
            const foot = C4.map(([su, sv]) => [x + (ux * su + px * sv) * b0, z + (uz * su + pz * sv) * b0]), y0 = Math.max(...foot.map(([fx, fz]) => caGround(fx, fz)));
            const at = (u, v, h) => [x + ux * u + px * v, y0 + h, z + uz * u + pz * v], g = c.scen.get(x, z);
            C4.forEach(([su, sv], q) => { const [fx, fz] = foot[q]; rod(g, [fx, caGround(fx, fz) - 0.5, fz], at(su * b1, sv * b1, H0), 0.08, st, 4); rod(g, at(su * b1, sv * b1, H0), at(su * bt, sv * bt, Ht), 0.06, st, 4); });
            const HS = [1.4, 5, 10, H0, 18.5, 22, Ht];
            for (let q = 0; q < HS.length; q++) { const h = HS[q], hb = half(h);
              for (let e = 0; e < 4; e++) { const [au, av] = C4[e], [bu, bv] = C4[(e + 1) % 4]; rod(g, at(au * hb, av * hb, h), at(bu * hb, bv * hb, h), 0.04, st, 3);
                if (q > 0) { const h2 = HS[q - 1], hb2 = half(h2); rod(g, at(au * hb2, av * hb2, h2), at(bu * hb, bv * hb, h), 0.035, st, 3); if (h <= H0) rod(g, at(bu * hb2, bv * hb2, h2), at(au * hb, av * hb, h), 0.035, st, 3); } } }
            const out = [];
            for (const [h, len] of [[16.2, 3.2], [19.6, 3.9], [23, 3.2]]) { const hb = half(h); for (const sv of [-1, 1]) {
              const tip = at(0, sv * (hb + len), h); rod(g, at(-hb, sv * hb, h), tip, 0.045, st, 3); rod(g, at(hb, sv * hb, h), tip, 0.045, st, 3); rod(g, at(0, sv * hb, h + 1.3), tip, 0.035, st, 3);
              cyl(g, tip[0], tip[1] - 1.5, tip[2], 0.09, 1.5, 6, ins, ins); out.push([tip[0], tip[1] - 1.5, tip[2]]); } }
            rod(g, at(-bt, 0, Ht), at(0, 0, Ht + 2.2), 0.045, st, 3); rod(g, at(bt, 0, Ht), at(0, 0, Ht + 2.2), 0.045, st, 3); out.push(at(0, 0, Ht + 2.2));   // (the peak: the earth wire's)
            c.exclPush(x, z, 4.5); c.CR.block(x, z, 5.5, 5.5, d); n++;
            return out;
          });
          for (let k = 0; k + 1 < TW.length; k++) { const A = tips[k], B = tips[k + 1]; if (!A || !B) continue;
            const span = Math.hypot(TW[k + 1][0] - TW[k][0], TW[k + 1][1] - TW[k][1]), m = Math.max(6, Math.round(span / 14)), g = c.scen.get((TW[k][0] + TW[k + 1][0]) / 2, (TW[k][1] + TW[k + 1][1]) / 2);
            for (let wv = 0; wv < A.length; wv++) {
              const a = A[wv], b = B[wv], yAt = (f, sg) => lerp(a[1], b[1], f) - sg * 4 * f * (1 - f); let sag = span * 0.026, mc = 1e9;
              for (let q = 1; q < m; q++) { const f = q / m; mc = Math.min(mc, yAt(f, sag) - gAt(lerp(a[0], b[0], f), lerp(a[2], b[2], f))); }
              if (mc < 7) sag = Math.max(0.8, sag - (7 - mc));   // (7 m over the ground and the road at least)
              let pv = a; for (let q = 1; q <= m; q++) { const f = q / m, pt = [lerp(a[0], b[0], f), yAt(f, sag), lerp(a[2], b[2], f)]; rod(g, pv, pt, wv === A.length - 1 ? 0.022 : 0.032, wireC, 3); pv = pt; }
            }
          }
        }
        // -- the town's houses
        const HC = LK.house, KB = (def.bld || []).filter(b => b[6] === 2).map(b => [b[0], b[1], Math.min(34, Math.max(b[2], b[3])) / 2 + 9]);
        const block = [[0.6, 0.59, 0.56], [0.66, 0.65, 0.61], [0.55, 0.54, 0.51]], sheet = [[0.56, 0.57, 0.58], [0.5, 0.33, 0.22], [0.62, 0.62, 0.6], [0.43, 0.46, 0.5]], tile = [0.6, 0.29, 0.2];
        const doorC = [[0.24, 0.2, 0.17], [0.3, 0.32, 0.36], [0.42, 0.18, 0.14]], glass = [0.2, 0.23, 0.27], tank = [0.1, 0.1, 0.11];
        for (const side of [-1, 1]) for (const [o0, pr] of [[4.5, 0.62], [18, 0.48], [32, 0.36], [46, 0.26]]) {
          for (let s = 6; s < T.len - 6;) {
            const L = 6 + R() * 5, W = 5.5 + R() * 3.5, gap = 1.2 + R() * 6, r = R(), oj = R() * 2.5, aj = (R() - 0.5) * 0.12, sm = s + L / 2; s += L + gap;
            if (r > pr) continue;
            const [x, z, i] = c.onSide(sm, side, o0 + oj + W / 2); if (vrLC(x, z) !== 3) continue;
            const ang = T.hd[i] + aj, ca = Math.cos(ang), sa = Math.sin(ang);
            let ok = true, lo = 1e9, hi = -1e9;
            for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) { const px = x + ca * su * L / 2 - sa * sv * W / 2, pz = z + sa * su * L / 2 + ca * sv * W / 2;
              if (vrNear(px, pz).dd < 3 || c.excluded(px, pz) || pathD(px, pz) < 1.2 || !tileOn(px, pz, true) || vrLC(px, pz) === 1) { ok = false; break; }
              const h = caGround(px, pz); lo = Math.min(lo, h); hi = Math.max(hi, h); }
            if (!ok || hi - lo > 3.5 || KB.some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br + W / 2)) continue;
            const g = c.scen.get(x, z), two = R() < HC.tall, H = two ? 5.6 : 2.8 + R() * 0.4, bare = R() < 0.35, rk = R(), du = (R() - 0.5) * L * 0.4;
            const col = bare ? vary(block[Math.floor(R() * block.length)], R, 0.03) : vary(HC.cols[Math.floor(R() * HC.cols.length)], R, 0.05), top = hi + H;
            box(g, x, lo - 0.4, z, L, top - lo + 0.4, W, ang, col, col);
            const P = (u, v, h) => [x + ca * u - sa * v, top + h, z + sa * u + ca * v], inn = [x, top - 1, z];
            if (rk < 0.45) {   // iron sheets sloping one way (its high side to the road or away), the walls' ends up under it
              const rise = 0.5 + W * 0.08, oh = 0.35, hs = R() < 0.5 ? 1 : -1, rc = vary(sheet[Math.floor(R() * sheet.length)], R, 0.05), hv = (v) => rise * (1 + hs * v / (W / 2)) / 2;
              const U = L / 2 + oh, V = W / 2 + oh, rcd = rc.map(v => v * 0.7);
              g.quadO(P(-U, -V, hv(-V) + 0.12), P(U, -V, hv(-V) + 0.12), P(U, V, hv(V) + 0.12), P(-U, V, hv(V) + 0.12), rc, [x, top - 3, z]);
              g.quadO(P(-U, -V, hv(-V) + 0.04), P(U, -V, hv(-V) + 0.04), P(U, V, hv(V) + 0.04), P(-U, V, hv(V) + 0.04), rcd, [x, top + 3, z]);
              for (const su of [-1, 1]) g.triO(P(su * L / 2, -W / 2, 0), P(su * L / 2, W / 2, 0), P(su * L / 2, hs * W / 2, rise), col, inn);
              g.quadO(P(-L / 2, hs * W / 2, 0), P(L / 2, hs * W / 2, 0), P(L / 2, hs * W / 2, rise), P(-L / 2, hs * W / 2, rise), col, inn);
            } else if (rk < 0.65) gable(g, x, top, z, L + 0.5, W + 0.5, Math.min(W * 0.4, 2.2), ang, vary(tile, R, 0.05), col);   // the old red tiles
            else {   // a flat roof of concrete, a black water tank on it now and then
              box(g, x, top, z, L + 0.2, 0.2, W + 0.2, ang, HC.flat, HC.flat);
              if (R() < 0.6) { const u = (R() - 0.5) * L * 0.5, v = (R() - 0.5) * W * 0.5, [tx, , tz] = P(u, v, 0); cyl(g, tx, top + 0.2, tz, 0.6, 1.2, 8, tank, tank); }
            }
            // the door and a window on its face to the road
            const fs = -side * (T.nx[i] * -sa + T.nz[i] * ca) >= 0 ? 1 : -1, fx = x - sa * fs * (W / 2 + 0.01), fz = z + ca * fs * (W / 2 + 0.01), fy = caGround(fx, fz);
            box(g, fx + ca * du, fy - 0.1, fz + sa * du, 1.0, 2.2, 0.1, ang, doorC[Math.floor(R() * doorC.length)]);
            const wu = du > 0 ? du - 2.2 : du + 2.2; box(g, fx + ca * wu, fy + 0.95, fz + sa * wu, 1.4, 1.05, 0.1, ang, glass);
            if (two) { box(g, fx + ca * du, fy + 3.7, fz + sa * du, 1.4, 1.05, 0.1, ang, glass); box(g, fx + ca * wu, fy + 3.7, fz + sa * wu, 1.4, 1.05, 0.1, ang, glass); }
            const lw = Math.max(L, W), sw2 = Math.min(L, W), al = L >= W ? ang : ang + PI / 2, nc = Math.ceil(lw / sw2 - 1e-6);
            for (let k = 0; k < nc; k++) { const t = nc > 1 ? -lw / 2 + sw2 / 2 + k * (lw - sw2) / (nc - 1) : 0; c.exclPush(x + Math.cos(al) * t, z + Math.sin(al) * t, 0.71 * sw2 + 1); }
            c.CR.block(x, z, L + 1, W + 1, ang); n++;
          }
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
    rain: { h: [10, 10], w: [0.66, 0, 0.18], c: [0.9, 0.16, 0.94, 0.12, 0.9], tree: true },   // (the rainforest's trees)
    palm: { h: [8, 9], w: [0.5, 0, 0.25], c: [0.95, 0.1, 0.97, 0.06, 0.94], tree: true },   // (coconut palms)
    fern: { h: [2.4, 3.2], w: [0.95, 0, 0.6], c: [0.92, 0.14, 0.96, 0.08, 0.9], shade: true },   // (tree ferns)
    banana: { h: [2.6, 1.6], w: [0.95, 0, 0.5], c: [0.94, 0.12, 0.97, 0.08, 0.9], near: 110, shade: true },
    cypress: { h: [8, 9], w: [0.34, 0, 0.12], c: [0.94, 0.1, 0.96, 0.08, 0.95], tree: true },   // (the highlands' cypresses: tall narrow spires)
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
    if (fd > 0) { const fbd = C.fband, band = 0.5 + 0.5 * Math.sin(A / (fbd || 2.2) + P.c3(x, z) * 3), wall = sstep(0.82, 0.96, band) * 0.8 * (fbd ? sstep(330, 220, vrDist(x, z)) * sstep(0.68, 0.88, ny) : 1);   // (fband: closer bands, gone where the grid's 5 m and 10 m can't draw them: far out, on the steep)
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
  let kCTex = null;
  function krConcTex() {   // the concrete road (lines.concrete: Banaue's) in place of the asphalt: its slabs light grey, a fine grain, faint stains and a few
    // hairline cracks, a joint across it every 4 m (the road's uv: a repeat every 8 m along v); made once and kept, as the boards' atlases
    if (kCTex) return kCTex;
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(8642);
    x.fillStyle = '#bebbb2'; x.fillRect(0, 0, S, S);
    for (let q = 0; q < 7000; q++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'; x.fillRect(r() * S, r() * S, 1 + r() * 1.5, 1 + r() * 1.5); }
    for (let q = 0; q < 16; q++) { x.fillStyle = r() < 0.7 ? 'rgba(46,42,36,0.06)' : 'rgba(255,255,255,0.06)'; x.beginPath(); x.ellipse(r() * S, r() * S, 10 + r() * 34, 6 + r() * 20, r() * 3, 0, TAU); x.fill(); }
    x.strokeStyle = 'rgba(52,49,44,0.45)'; x.lineWidth = 1;
    for (let q = 0; q < 5; q++) { let px = r() * S, py = r() * S; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r() - 0.5) * 30; py += (r() - 0.3) * 14; x.lineTo(px, py); } x.stroke(); }
    x.fillStyle = 'rgba(48,46,42,0.8)'; for (const v of [0, S / 2]) x.fillRect(0, v, S, 2);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return (kCTex = t);
  }
  function krTreeGeo(kind) {   // unit plants (height 1; the instances scale and tint them): broad a broadleaved tree (a short trunk, a round crown of
    // a few blobs), pine (a tall trunk, tiers of dark needles), shrub (a rounded mound), tuft (a tuft of grass, straw-tipped blades), maize (a
    // clump of four stalks with long drooping leaves and the tassels on top), cypress (a tall narrow spire)
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
    } else if (kind === 'rain') {   // (a rainforest tree: a tall straight pale trunk, two limbs, a broad flattened crown of a few blobs high up)
      API.ROCK_SMOOTH = true; const bk = [0.56, 0.53, 0.47], cs = [[0.2, 0.33, 0.14], [0.25, 0.38, 0.17], [0.18, 0.3, 0.13], [0.28, 0.41, 0.19]];
      cyl(g, 0, -0.02, 0, 0.026, 0.68, 5, bk, null, 0.016);
      cyl(g, 0.06, 0.5, 0.02, 0.012, 0.22, 4, bk, null, 0.008); cyl(g, -0.05, 0.52, -0.03, 0.012, 0.2, 4, bk, null, 0.008);
      ico(g, 0, 0.8, 0, 0.36, 0.42, cs[0], R, 0.3); ico(g, 0.24, 0.74, 0.08, 0.24, 0.5, cs[1], R, 0.3); ico(g, -0.22, 0.75, -0.1, 0.25, 0.48, cs[2], R, 0.3); ico(g, 0.06, 0.9, -0.2, 0.2, 0.5, cs[3], R, 0.3);
    } else if (kind === 'palm') {   // (a coconut palm: a slender trunk leaning a little and curving up, a crown of long arching fronds, its nuts)
      API.ROCK_SMOOTH = true; const bk = [0.55, 0.5, 0.42], fc = [[0.3, 0.45, 0.17], [0.35, 0.49, 0.2]], ft = [0.5, 0.52, 0.26];
      cyl(g, 0, -0.02, 0, 0.03, 0.34, 5, bk, null, 0.026); cyl(g, 0.05, 0.31, 0, 0.026, 0.32, 5, bk, null, 0.023); cyl(g, 0.12, 0.6, 0, 0.023, 0.33, 5, bk, null, 0.02);
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + R() * 0.4; frond(0.16, 0.92, 0, a, 0.62 + R() * 0.14, 0.05, 0.16 + R() * 0.08, 0.06, fc[k % 2], ft); }
      ico(g, 0.16, 0.89, 0, 0.05, 1, [0.4, 0.34, 0.18], R, 0.2);
    } else if (kind === 'fern') {   // (a tree fern: a thin dark trunk, a rosette of long fronds arching out from its top)
      API.ROCK_SMOOTH = true; const bk = [0.3, 0.25, 0.19], fc = [[0.3, 0.5, 0.18], [0.36, 0.55, 0.21]], ft = [0.42, 0.56, 0.24];
      cyl(g, 0, -0.02, 0, 0.05, 0.62, 4, bk, null, 0.04);
      for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + R() * 0.3; frond(0, 0.6, 0, a, 0.5 + R() * 0.1, 0.16, 0.34, 0.08, fc[k % 2], ft); }
    } else if (kind === 'cypress') {   // (a cypress: a short trunk, a tall narrow spire of dark blue-green in two tiers, the upper a little turned)
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.022, 0.16, 4, [0.36, 0.29, 0.23], null, 0.016);
      cone(g, 0, 0.08, 0, 0.32, 0.6, 7, [0.17, 0.28, 0.19], [0.2, 0.31, 0.21], 0); cone(g, 0, 0.4, 0, 0.24, 0.6, 7, [0.18, 0.3, 0.2], [0.22, 0.34, 0.23], 0.45);
    } else if (kind === 'banana') {   // (a clump of bananas: three soft stems, each with a few long broad leaves arching out)
      const sc = [0.42, 0.5, 0.26], lc = [[0.36, 0.55, 0.2], [0.42, 0.58, 0.24]], tp = [0.5, 0.55, 0.28];
      for (let q = 0; q < 3; q++) { const a0 = q / 3 * TAU + R() * 0.8, r0 = 0.06 + R() * 0.1, cx = Math.cos(a0) * r0, cz = Math.sin(a0) * r0, h = 0.5 + R() * 0.2;
        cyl(g, cx, 0, cz, 0.04, h, 4, sc, null, 0.03);
        for (let k = 0; k < 4; k++) { const a = a0 + k * 1.6 + R() * 0.5; frond(cx, h, cz, a, 0.48 + R() * 0.1, 0.25, 0.32, 0.11, lc[k % 2], tp); } }
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
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (crowds, plots, signs) for the plants and the rocks, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };

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

    /* ---- the level plots: the viewpoints (def.views, the look's viewAt: on the road itself in the map, so each one a terrace beside it, on the
       side the ground falls the more), the cars' park past the finish (on the side the ground lies nearer the road's height), the landmarks'
       (def.marks, below). One beside the road is tried where it is wanted, then 10, 20 and 30 m along the road either way, on the other side,
       then smaller, until the terrain can lie level all over it (padFit: caH with the plot in, the ground's ceiling under the road around and
       the banks between the legs of the hairpins never more than 0.2 m below its level, no leg of the road across it) ---- */
    const padFit = (p) => {   // how far the terrain falls short of the plot's level at most (its middle, 6 points half out, 12 round its rim); -1e9: a road across it
      P.pads.push(p); let mn = 1e9;
      for (let k = 0; k < 19; k++) { const a = k < 12 ? k * PI / 6 : k * PI / 3, f = k < 12 ? 0.97 : k < 18 ? 0.55 : 0, x = p.x + Math.cos(a) * p.r * f, z = p.z + Math.sin(a) * p.r * f;
        if (vrNear(x, z).dd < 0.3) { mn = -1e9; break; } mn = Math.min(mn, caH(x, z) - p.h); }
      P.pads.pop(); return mn; };
    const DS = [0, 10, -10, 20, -20, 30, -30];
    const plotBeside = (i0, pref, r, o0, hb, b, sideFirst, sLo, sHi) => {   // the first place that fits (sideFirst: every place on the preferred side before the other's), else the best
      let best = null;
      for (const f of [1, 0.75, 0.5]) for (let k = 0; k < 2 * DS.length; k++) {
        const d = DS[sideFirst ? k % DS.length : k >> 1], sd = (sideFirst ? k < DS.length : !(k & 1)) ? pref : -pref, s1 = i0 * T.ds + d; if (d && (s1 < sLo || s1 > sHi)) continue;
        const i = d ? T.idx(s1) : i0, rr = r * f, o = (sd > 0 ? T.br[i] : T.bl[i]) + rr + o0, p = { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r: rr, b, h: T.hy[i] - hb, i, sd }, q = padFit(p);
        if (q >= -0.2) return p; if (!best || q > best.q) best = { p, q }; }
      return best.p; };
    const views = [];
    { const VW = (def.views || []).concat((LK.viewAt || []).map(([d, r]) => { const i = T.idx(sStart + d); return [T.px[i], T.pz[i], r]; }));
      for (const [x, z, rv] of VW) { const n = vrNear(x, z); if (n.i < 0 || n.dd > (LK.viewR || 25)) continue; const i = n.i, s = i * T.ds; if (s < sStart + 20 || s > T.len - 30) continue;   // (and past the finish: Mã Pí Lèng's viewpoint)
        if (n.dd > w + 1.5 && !LK.viewR) { const pad = { x, z, r: 6, b: 8, h: T.hy[i] - 0.15, i }, q = padFit(pad); if (q < -0.2 && q > -1e8) pad.h += q; P.pads.push(pad); views.push(pad); continue; }   // (off the road: where the map has it, down to the ground's ceiling)
        const gd = (sd) => vrFar(T.px[i] + T.nx[i] * sd * 14, T.pz[i] + T.nz[i] * sd * 14) - T.hy[i];
        const pad = plotBeside(i, gd(1) < gd(-1) ? 1 : -1, rv || 5, 0.8, 0.15, 8, true, sStart + 20, T.len - 30); P.pads.push(pad); views.push(pad); } }
    const iF = T.idx(sFin + 60), gdF = (sd) => Math.abs(vrFar(T.px[iF] + T.nx[iF] * sd * 12, T.pz[iF] + T.nz[iF] * sd * 12) - T.hy[iF]);
    const padF = plotBeside(iF, gdF(1) < gdF(-1) ? 1 : -1, 12, 1, 0.25, 14, false, sFin + 25, T.len - 20); P.pads.push(padF);
    for (const p of views) exclPush(p.x, p.z, p.r + 2);
    exclPush(padF.x, padF.z, padF.r + 4);
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const hutAt = onSide(sStart - 5, -1, 3.2), banAt = onSide(sStart + 16, 1, 1.6), brdAt = onSide(sFin + 18, padF.sd, 3.2);   // (the timing hut, the race's banner, the board at the finish: drawn below, kept clear from here on)
    exclPush(hutAt[0], hutAt[1], 5); exclPush(banAt[0], banAt[1], 4.5); exclPush(brdAt[0], brdAt[1], 5);

    /* ---- the houses' places (def.bld [x, z, length, width, angle, height, kind]: OpenStreetMap's footprints within 450 m, generic: the game
       names none; drawn below): only where the terrain is drawn under them, at most 34 x 20 m (as the passes'); one reaching into the barrier's
       verge (the game's road is wider than the real one) pulled back from the road, up to 5 m and clear of the others, or else made shallower
       from the road's side; none with its middle on the road, nor on a slope falling more than 12 m under it; the plants, the rocks and the
       landmarks kept out of them ---- */
    const bPts = (b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang), o = []; for (let a = -1; a <= 1; a++) for (let e = -1; e <= 1; e++) o.push([b.x + c * a * b.L / 2 - s * e * b.W / 2, b.z + s * a * b.L / 2 + c * e * b.W / 2]); return o; };   // (its corners, its edges' middles, its middle)
    const B = []; let nBldMoved = 0, nBldOut = 0;
    {
      const G = P.G, Lt = VRC * VRT;
      const clearOf = (b) => { let m = 1e9; for (const [px, pz] of bPts(b)) m = Math.min(m, vrNear(px, pz).dd); return m; };   // (the least distance beyond a barrier under it)
      const apart = (a, b) => { for (const t of [a.ang, a.ang + PI / 2, b.ang, b.ang + PI / 2]) { const ux = Math.cos(t), uz = Math.sin(t), pa = bPts(a).map(([px, pz]) => px * ux + pz * uz), pb = bPts(b).map(([px, pz]) => px * ux + pz * uz);
        if (Math.max(...pa) <= Math.min(...pb) + 0.05 || Math.max(...pb) <= Math.min(...pa) + 0.05) return true; } return false; };   // (an axis between the two footprints)
      for (const [x, z, L0, W0, ang, h0, kind] of def.bld || []) {
        const ti = Math.floor((x - G.x0) / Lt), tj = Math.floor((z - G.z0) / Lt); if (ti < 0 || tj < 0 || ti >= G.ntx || tj >= G.ntz || !caTileOn(ti, tj)) continue;
        B.push({ x, z, L: Math.min(Math.max(4, L0), 34), W: Math.min(Math.max(3.5, W0), 20), ang, h0, kind: kind | 0 }); }
      for (const b of B) {
        if (clearOf(b) >= 0.8) continue;
        const n = vrNear(b.x, b.z), i = n.i; if (i < 0) { b.out = true; continue; }
        const lat = (b.x - T.px[i]) * T.nx[i] + (b.z - T.pz[i]) * T.nz[i], sd = lat >= 0 ? 1 : -1, ux = T.nx[i] * sd, uz = T.nz[i] * sd;
        if (Math.abs(lat) < w + 1) { b.out = true; continue; }
        let m = Object.assign({}, b), moved = 0;   // pulled back from the road
        for (let k = 0; k < 12 && moved < 5; k++) { const c0 = clearOf(m); if (c0 >= 1) break; const d = Math.min(5 - moved, Math.max(0.25, 1.1 - c0)); m.x += ux * d; m.z += uz * d; moved += d; }
        if (clearOf(m) >= 0.8 && B.every(o => o === b || o.out || apart(m, o))) { Object.assign(b, { x: m.x, z: m.z }); b.moved = true; continue; }
        const c = Math.cos(b.ang), s = Math.sin(b.ang), aL = c * ux + s * uz, aW = -s * ux + c * uz, byL = Math.abs(aL) >= Math.abs(aW), k0 = byL ? 'L' : 'W', mn = byL ? 4 : 3.5;
        const ax = byL ? [c, s] : [-s, c], sg = (byL ? aL : aW) > 0 ? 1 : -1;   // (shallower: its side across the road shortened from the road's end, the far end kept)
        m = Object.assign({}, b);
        while (clearOf(m) < 0.8 && m[k0] - 0.5 >= mn) { m[k0] -= 0.5; m.x += ax[0] * sg * 0.25; m.z += ax[1] * sg * 0.25; }
        if (clearOf(m) >= 0.8) { Object.assign(b, { x: m.x, z: m.z, L: m.L, W: m.W }); b.moved = true; } else b.out = true;
      }
      for (const b of B) {
        if (b.out) { nBldOut++; continue; }
        let lo = 1e9, hi = -1e9; for (const [px, pz] of bPts(b)) { const h = caH(px, pz); lo = Math.min(lo, h); hi = Math.max(hi, h); }   // (the ground's fall under it: caH, the terrain's grid not filled before the plots are all in)
        if (hi - lo > 12 || views.some(v => bPts(b).some(([px, pz]) => Math.hypot(px - v.x, pz - v.z) < v.r + 1.5))) { b.out = true; nBldOut++; continue; }   // (and none on a viewpoint's terrace)
        const { x, z, L, W, ang } = b, lw = Math.max(L, W), sw2 = Math.min(L, W), al = L >= W ? ang : ang + PI / 2, nc = Math.ceil(lw / sw2 - 1e-6);   // (circles along its long side: the plants, the rocks and the landmarks clear of it)
        for (let k = 0; k < nc; k++) { const t = nc > 1 ? -lw / 2 + sw2 / 2 + k * (lw - sw2) / (nc - 1) : 0; exclPush(x + Math.cos(al) * t, z + Math.sin(al) * t, 0.71 * sw2 + 1); }
        if (b.moved) nBldMoved++;
      }
    }

    // the landmarks' plots (def.marks, drawn below; set back to clear the barrier, the café's with its terrace on the far side): each level, a
    // little wider than the building, at the ground's height under its middle, lowered as far as the road's ceiling or a bank asks; its edge
    // blended into the slope over at most the gap to the plots before it (a later plot's edge would tilt theirs). A landmark is placed only
    // clear of all that stands before it (the plots, the gantries, the timing hut, the banner, the board at the finish, the houses, the
    // landmarks before it): none is left out once its plot is levelled
    const MK = { monument: [4.5, 5.4, 0], shrine: [2.5, 2.8, 0], museum: [7, 7.3, 0], cafe: [5.5, 6.4, 1.75], trail: [2.2, 2.6, 0] };   // [the clearance as ever, the plot's level radius, its middle that much farther out]
    const nearArch = (x, z) => [sStart, sFin].concat(T.cpS).some(s0 => { const i = T.idx(s0); return Math.hypot(x - T.px[i], z - T.pz[i]) < Math.max(T.bl[i], T.br[i]) + 6.9; });   // (the gantries' exclusions, pushed below)
    const marks = [];
    for (const [mx, mz, kind] of def.marks || []) {
      const K = MK[kind], n = vrNear(mx, mz); if (!K || n.i < 0) continue;   // (only the kinds drawn below)
      const i = n.i, sd = (mx - T.px[i]) * T.nx[i] + (mz - T.pz[i]) * T.nz[i] >= 0 ? 1 : -1, bar = sd > 0 ? T.br[i] : T.bl[i], r = K[0], d0 = Math.abs((mx - T.px[i]) * T.nx[i] + (mz - T.pz[i]) * T.nz[i]);
      const o = Math.max(bar + r + 1.5, d0), x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o;
      if (excluded(x, z) || nearArch(x, z) || marks.some(q => Math.hypot(x - q.x, z - q.z) < q.r + 1.5)) continue;   // (the landmarks' own exclusions pushed as they are drawn)
      const cx = x + T.nx[i] * sd * K[2], cz = z + T.nz[i] * sd * K[2];
      let b = 6; for (const q of P.pads) b = Math.min(b, Math.hypot(cx - q.x, cz - q.z) - q.r - K[1] - 0.3);
      let pad = { x: cx, z: cz, r: K[1], b: Math.max(2, b), h: caH(cx, cz) }; const f = padFit(pad);
      if (f > -1e8) { if (f < -0.2) pad.h += f; P.pads.push(pad); } else pad = null;   // (a road across it: none, the building on the slope as it lies)
      marks.push({ x, z, i, sd, kind, r, pad });
    }
    out.marks = {}; if (views.length) out.marks.view = [views[0].x, views[0].z];   // (where the landmarks stand: the tests look for them)

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
       holds the road (its face out over the drop); by a leg below, the wall's coping, then the bank; on the bridges (def.bridges [from, to],
       metres after the start line: vrPrep digs the stream's gully under the longer ones) the deck out to its concrete parapets (120 m chunks,
       culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: LK.lines.concrete ? krConcTex() : tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    if (LK.lines.concrete) aMat.userData.wear = true;   // (the concrete: darker in the rain, the sun's glint on it, as the asphalt: Render applyRoad, asphaltLook)
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true }), sMat = new THREE.MeshLambertMaterial({ map: tex.makadam, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.45, onBr = new Uint8Array(N), deck = [0.64, 0.63, 0.6];
    for (const [a, b] of def.bridges || []) for (let s = sStart + a - 3; s <= sStart + b + 3; s += T.ds / 2) onBr[T.idx(s)] = 1;
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      if (onBr[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];   // (the deck out past its parapet, its edge beam)
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
          if (onBr[i]) return k < 3 ? deck : [0.52, 0.51, 0.49];
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
            const sc = onBr[i] ? deck : kc; gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [sc, sc, sc, sc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);   // (the gravel shoulder; the deck's on a bridge)
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6) && !bk[si][i]) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face: out, over the drop)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
            const bi = bk[si][i], bj = bk[si][j];   // the wall down to the leg below: its battered face from the coping to the shelf, the shelf out to the lower barrier
            if (bi && bj && !onBr[i] && !onBr[j]) { const top = (q, b2) => Pt(q, side * b2.p[0][0], b2.p[0][1]), foot = (q, b2) => Pt(q, side * b2.p[1][0], b2.p[1][1]), A = top(i, bi), B = top(j, bj), C = foot(j, bj), D = foot(i, bi);
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

    /* ---- the village's lanes and drives (def.lanes [width, dirt, x, z, ...]: OpenStreetMap's, from the road out): a strip of concrete (dirt:
       of earth) on the ground every ~1.5 m from the asphalt's edge out to 70 m beyond the barrier: on the verge as it lies, over the ditch a
       slab from the verge's end to the ground beyond it, then on the ground (an edge that would lie on the asphalt drawn at the shoulder's
       edge instead: the mouth widens along the road); the plants, the rocks and the signs kept off the whole lane, the parapets and the posts
       open where it leaves the road (laneM: the mouths, below). One mesh, drawn over the ground (polygonOffset) ---- */
    const laneM = []; let nLane = 0;
    if ((def.lanes || []).length) {
      const gL = new GB(true), con = [0.56, 0.55, 0.52], dirtC = LK.pal.path, RL = rng(LK.seed + 80);
      const vAtQ = (q, o) => { for (let k = 0; k + 1 < q.length; k++) if (o <= q[k + 1][0]) { const t = clamp((o - q[k][0]) / Math.max(1e-3, q[k + 1][0] - q[k][0]), 0, 1); return q[k][1] + (q[k + 1][1] - q[k][1]) * t; } return q[q.length - 1][1]; };
      const edgeAt = (x, z) => {   // [x, y, z, on the road?, i, side] of one edge of the lane
        const n = vrNear(x, z), i = n.i, dd = n.dd; if (i < 0) return [x, caGround(x, z) + 0.05, z, false, -1, 0, 1e9];
        const lat = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], o = Math.abs(lat), side = lat > 0 ? 1 : -1, q = vp[side > 0 ? 1 : 0][i], e0 = q[0][0], e1 = q[1][0], e4 = q[4][0];
        if (o < e0) { const ox = T.px[i] + T.nx[i] * side * e0, oz = T.pz[i] + T.nz[i] * side * e0; return [ox, T.hy[i] + q[0][1] + 0.05, oz, true, i, side, dd]; }
        if (o >= e4) return [x, caGround(x, z) + 0.05, z, false, i, side, dd];
        const t = clamp((o - e1) / Math.max(0.1, e4 - e1), 0, 1), slab = o > e1 ? q[1][1] + (q[4][1] - q[1][1]) * t : -1e9;
        return [x, T.hy[i] + Math.max(slab, vAtQ(q, o)) + 0.05, z, false, i, side, dd]; };
      for (const Ln of def.lanes) {
        const hw = Ln[0] / 2, c0 = Ln[1] ? dirtC : con, P0 = []; for (let k = 2; k + 1 < Ln.length; k += 2) P0.push([Ln[k], Ln[k + 1]]); if (P0.length < 2) continue;
        const S = []; for (let k = 0; k + 1 < P0.length; k++) { const [ax, az] = P0[k], [bx, bz] = P0[k + 1], d = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(d / 1.5)); for (let q = 0; q < m; q++) S.push([ax + (bx - ax) * q / m, az + (bz - az) * q / m]); }
        S.push(P0[P0.length - 1]);
        for (let k = 0; k < S.length; k += 2) exclPush(S[k][0], S[k][1], hw + 0.7);
        let prev = null;
        for (let k = 0; k < S.length; k++) {
          const [x, z] = S[k], a = S[Math.max(0, k - 1)], b = S[Math.min(S.length - 1, k + 1)], dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, px = -(b[1] - a[1]) / dl * hw, pz = (b[0] - a[0]) / dl * hw;
          const A = edgeAt(x + px, z + pz), Bq = edgeAt(x - px, z - pz), road = A[3] && Bq[3], far = Math.min(A[6], Bq[6]) > 70;
          if (road || far) { prev = null; continue; }
          { const n = vrNear(x, z), i = n.i; if (i >= 0) { const lat = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], si = lat > 0 ? 1 : 0;   // (across the parapets' line: a mouth)
            if (Math.abs(lat) < (si ? T.br[i] : T.bl[i]) + 2.5) laneM.push([si, i, hw]); } }
          const q = 0.93 + 0.1 * RL(), col = [c0[0] * q, c0[1] * q, c0[2] * q], cur = [A, Bq, col];
          if (prev) { const [pA, pB, pc] = prev; gL.quadUp([pA[0], pA[1], pA[2]], [pB[0], pB[1], pB[2]], [Bq[0], Bq[1], Bq[2]], [A[0], A[1], A[2]], [pc, pc, col, col], [[pA[0] / 4, -pA[2] / 4], [pB[0] / 4, -pB[2] / 4], [Bq[0] / 4, -Bq[2] / 4], [A[0] / 4, -A[2] / 4]]); nLane++; }
          prev = cur;
        }
      }
      if (!gL.empty) { const m = new THREE.Mesh(gL.geometry(), new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }));
        m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ledg = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the race's boards, ban2: the signs; ledg: the canyon's ledges, no shadow)
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

    /* ---- the houses (placed above): walls in the look's colours (LK.house), a tiled gable roof or a flat concrete one; by their kind (def.bld's
       last: 0 a house, 1 a temple, a shrine or a church, 2 a shop, a school or a hall) the temples whitewashed, taller, under a steeper gable,
       the halls a little taller under a flat roof. The walls from under the lowest ground to the highest; the people kept out of them (one
       mesh) ---- */
    let nBld = 0;
    {
      const RB = rng(LK.seed + 20), gh = new GB(), HS = LK.house;
      for (const b of B) {
        if (b.out) continue;
        let lo = 1e9, hi = -1e9; for (const [px, pz] of bPts(b)) { const h = caGround(px, pz); lo = Math.min(lo, h); hi = Math.max(hi, h); }
        const { x, z, L, W, ang, h0, kind } = b, tmpl = kind === 1, hall = kind === 2;
        const col = tmpl ? vary([0.92, 0.9, 0.85], RB, 0.04) : vary(HS.cols[Math.floor(RB() * HS.cols.length)], RB, 0.05), H = h0 > 0 ? clamp(h0, 2.6, 12) : tmpl ? 5.6 : hall ? 4.2 : RB() < HS.tall ? 5.8 : 3.0;
        box(gh, x, lo - 1.2, z, L, hi - lo + H + 1.2, W, ang, col, col);
        if (tmpl || (!hall && RB() < HS.gable)) gable(gh, x, hi + H, z, L + 0.5, W + 0.5, tmpl ? Math.min(W * 0.6, 4) : Math.min(W * 0.42, 2.4), ang, vary(HS.roofs ? HS.roofs[Math.floor(RB() * HS.roofs.length)] : HS.roof, RB, 0.05), col);   // (the look's roofs: one of its colours each)
        else box(gh, x, hi + H, z, L + 0.3, 0.22, W + 0.3, ang, HS.flat, HS.flat);
        CR.block(x, z, L + 1, W + 1, ang); nBld++;
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
      const [hx, hz] = hutAt, hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut: plastered white, a flat roof (kept clear above)
      box(gh, hx, hy - 0.4, hz, 4.0, 3.1, 2.8, T.hd[i], [0.9, 0.89, 0.85], [0.58, 0.57, 0.54]); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.26, 0.3], null, true);
      CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = banAt, by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); }
    }

    /* ---- the checkpoints: a blue gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.12, 0.3, 0.56]));

    /* ---- the finish: chequered gantry, the board of the place, the cars' park with cars, people about; the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const sdP = padF.sd, [sx, sz, si] = brdAt, sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the board: on posts, leaning back (kept clear above)
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.3, 0.3, 0.3]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.3, 0.3, 0.3]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.38, 0.37, 0.35], [0.5, 0.49, 0.46]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh), fq = Math.min(1, padF.r / 12);   // (two rows of four, a little towards the road: within the plot's level part, the 5 m mesh bending towards the slope round its last 3 m)
      for (let k = 0; k < 10; k++) { const a = ((k % 5) - 2) * 4.6 * fq, b = ((k < 5 ? -3.8 : 3.8) - 1) * fq * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || k === 2 || k === 7) continue;
        parkOn(caCar, caGround, 4.4, scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[k % carCols.length], R, 0.2)); }
      for (let k = 0; k < 8; k++) { const px = padF.x + (R() - 0.5) * 22 * fq, pz = padF.z + (R() - 0.5) * 22 * fq; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }   // (people about, on the plot as it is)
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
        { const fl = LK.pal.path, fe = [fl[0] * 0.9, fl[1] * 0.9, fl[2] * 0.9];   // the terrace's floor of gravel, level where the 5 m mesh bends down towards the drop round its rim, its edge down to the ground
          for (let k = 0; k < 16; k++) { const A = at(k / 16 * TAU, rr - 0.2, y + 0.04), B = at((k + 1) / 16 * TAU, rr - 0.2, y + 0.04);
            g.triO([v.x, y + 0.04, v.z], A, B, fl, [v.x, y - 5, v.z]);
            g.quadO(A, B, [B[0], Math.min(caGround(B[0], B[2]), y) - 0.3, B[2]], [A[0], Math.min(caGround(A[0], A[2]), y) - 0.3, A[2]], fe, [v.x, y + 0.04, v.z]); } }
        for (let k = 0; k < 16; k++) { const a = oa - 1.35 + 2.7 * k / 16, b = oa - 1.35 + 2.7 * (k + 1) / 16, am = (a + b) / 2, mx = v.x + Math.cos(am) * rr, mz = v.z + Math.sin(am) * rr; if (vrNear(mx, mz).dd < 1.2) continue;
          const q = 0.9 + 0.16 * rpHash(k, 91 + kv), fc = [st[0] * q, st[1] * q, st[2] * q], inn = at(am, rr, y + 0.1), lo = Math.min(caGround(mx, mz), y) - 1.2;
          g.quadO(at(a, rr - 0.25, y - 0.3), at(b, rr - 0.25, y - 0.3), at(b, rr - 0.25, y + 0.6), at(a, rr - 0.25, y + 0.6), fc, inn);
          g.quadO(at(a, rr + 0.25, lo), at(b, rr + 0.25, lo), at(b, rr + 0.25, y + 0.6), at(a, rr + 0.25, y + 0.6), fc, inn);
          g.quadO(at(a, rr - 0.25, y + 0.6), at(b, rr - 0.25, y + 0.6), at(b, rr + 0.25, y + 0.6), at(a, rr + 0.25, y + 0.6), top, inn); }
        for (let k = 0; k < 3; k++) { const a = oa + (R() - 0.5) * 1.6, d = rr - 1 - R(); const px = v.x + Math.cos(a) * d, pz = v.z + Math.sin(a) * d; if (vrNear(px, pz).dd < 1.5) continue;
          crowdPut(CR, px, y + 0.05, pz, Math.cos(a), Math.sin(a), { col: fans[Math.floor(R() * fans.length)], staff: true }, 1); }   // (the view's own visitors, not the race's spectators: kept on a real road as its crew are, fewFans)
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
    let nMarks = 0, nBoards = 0, nKarst = 0, nLedge = 0, nX = 0, nGranite = 0;
    {
      const gm = new GB(), RM = rng(LK.seed + 40);
      for (const { x, z, i, sd, kind, r, pad } of marks) {   // (placed with their plots above, clear of all that stands before them)
        const hd = T.hd[i], c = Math.cos(hd), s = Math.sin(hd);
        const under = (L, W, v0) => { let lo = 1e9, hi = -1e9;   // the terrain mesh under a footprint (L along the road, W across, its middle v0 out): its corners, its edges' middles and its middle
          for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const u = a * L / 2, v = sd * v0 + b * W / 2, h = caGround(x + u * c - v * s, z + u * s + v * c); lo = Math.min(lo, h); hi = Math.max(hi, h); }
          return [lo, hi]; };
        let y0 = pad ? pad.h : null;
        if (y0 == null) { let lo = 1e9, hi = -1e9; for (const [a, b] of [[-r, -r], [r, -r], [r, r], [-r, r], [0, 0]]) { const h = caGround(x + a * 0.7, z + b * 0.7); lo = Math.min(lo, h); hi = Math.max(hi, h); } y0 = Math.max(lo, hi - 1.6); }   // (no plot: cut into the slope, its outer edge on a footing)
        if (kind === 'monument') {   // (the plinth's top at least 0.15 m out of the ground all round, its foot under it)
          const st = [0.6, 0.6, 0.58], st2 = [0.7, 0.69, 0.66], wh = [0.92, 0.92, 0.9], [lo, hi] = under(7, 7, 0), y = Math.max(y0, hi - 0.25), yb = Math.min(y - 2.5, lo - 0.15);
          box(gm, x, yb, z, 7, y + 0.4 - yb, 7, hd, st, st2); box(gm, x, y + 0.4, z, 4.6, 0.6, 4.6, hd, st2, st2); box(gm, x, y + 1.0, z, 3, 0.6, 3, hd, st2, st2);
          box(gm, x, y + 1.6, z, 1.25, 8.4, 1.25, hd, wh, wh); cone(gm, x, y + 10.0, z, 0.9, 1.3, 4, wh, wh, hd + Math.PI / 4);
        } else if (kind === 'shrine') {
          const red = [0.66, 0.16, 0.12], roofC = [0.36, 0.3, 0.27], wall = [0.84, 0.8, 0.7], [lo, hi] = under(3.2, 3.2, 0), y = Math.max(y0, hi - 0.15), yb = Math.min(y - 2, lo - 0.15);
          box(gm, x, yb, z, 3.2, y + 0.3 - yb, 3.2, hd, [0.58, 0.58, 0.56], [0.62, 0.62, 0.6]); box(gm, x, y + 0.3, z, 1.8, 1.4, 1.4, hd, wall, wall);
          for (const [a, b] of [[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]]) box(gm, x + a * c - b * s, y + 0.3, z + a * s + b * c, 0.18, 2.0, 0.18, hd, red, red);
          gable(gm, x, y + 2.3, z, 3.4, 3.4, 1.0, hd, roofC, red);
        } else if (kind === 'trail') {   // the trailhead: the trails' map board under a little roof on two posts facing the road (generic: a blank panel, no words), stone
          // steps up from it into the forest
          const wd = [0.4, 0.28, 0.17], pn = [0.84, 0.82, 0.74], st = [0.56, 0.55, 0.52], [lo, hi] = under(2.4, 1.2, 0), y = Math.max(y0, hi - 0.2);
          for (const u of [-0.95, 0.95]) box(gm, x + u * c, lo - 0.3, z + u * s, 0.12, y - lo + 2.55, 0.12, hd, wd, wd);
          box(gm, x, y + 0.85, z, 1.95, 1.1, 0.08, hd, wd, wd); box(gm, x - T.nx[i] * sd * 0.05, y + 0.9, z - T.nz[i] * sd * 0.05, 1.75, 0.95, 0.02, hd, pn, pn);
          gable(gm, x, y + 2.2, z, 2.5, 0.95, 0.35, hd, [0.38, 0.24, 0.17], wd);
          for (let k = 0; k < 5; k++) { const v = 1.4 + k * 0.75, px = x + T.nx[i] * sd * v + c * 1.5, pz = z + T.nz[i] * sd * v + s * 1.5, gy = caGround(px, pz);
            box(gm, px, gy - 0.35, pz, 1.3, 0.47, 0.62, hd, st, [st[0] * 1.08, st[1] * 1.08, st[2] * 1.08]); }
        } else {   // the museum, the café
          const big = kind === 'museum', Lb = big ? 12 : 8, Wb = big ? 6.5 : 5.5, H = big ? 4.2 : 3.2, col = vary(big ? [0.86, 0.84, 0.78] : [0.9, 0.86, 0.72], RM, 0.04);
          const [lo, hi] = under(Lb, Wb, 0), vt = Wb / 2 + 1.8, [loT, hiT] = big ? [lo, hi] : under(Lb, 3.4, vt);
          const y = Math.max(y0, hi - 1.6, big ? -1e9 : hiT - 0.05), yb = Math.min(y - 2.2, lo - 0.15);   // (the walls' foot under the ground all round; the café's terrace out of it)
          box(gm, x, yb, z, Lb, y + H - yb, Wb, hd, col, col);
          if (big) gable(gm, x, y + H, z, Lb + 0.8, Wb + 0.8, 2.0, hd, [0.36, 0.33, 0.32], col);
          else { box(gm, x, y + H, z, Lb + 0.4, 0.25, Wb + 0.4, hd, [0.58, 0.56, 0.52], [0.58, 0.56, 0.52]);
            const tx = x + T.nx[i] * sd * vt, tz = z + T.nz[i] * sd * vt, dk = [0.5, 0.4, 0.3], tb = Math.min(y - 2.4, loT - 0.15);   // the terrace on the far side from the road, its railing
            box(gm, tx, tb, tz, Lb, y + 0.1 - tb, 3.4, hd, [0.6, 0.6, 0.58], dk);
            box(gm, tx + T.nx[i] * sd * 1.65, y + 0.1, tz + T.nz[i] * sd * 1.65, Lb, 0.95, 0.08, hd, dk, dk); }
          for (let k = 0; k < (big ? 3 : 4); k++) { const a = RM() * TAU, d = r + 1 + RM() * 2, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (vrNear(px, pz).dd < 1.5 || excluded(px, pz)) continue; person(px, pz, RM() * TAU); }
        }
        exclPush(x, z, r + 1.5); CR.block(x, z, 2 * r, 2 * r, hd); nMarks++;
      }
      for (const [mx, mz] of def.boards || []) {   // the information boards (def.boards): a blank panel in a wooden frame on two posts, facing the road (generic: no text, no names)
        const n = vrNear(mx, mz); if (n.i < 0) continue;
        const i = n.i, lat = (mx - T.px[i]) * T.nx[i] + (mz - T.pz[i]) * T.nz[i], sd = lat >= 0 ? 1 : -1, back = Math.max(0, (sd > 0 ? T.br[i] : T.bl[i]) + 1.2 - Math.abs(lat));   // (where the map has it, or pushed out to 1.2 m beyond the barrier)
        const x = mx + T.nx[i] * sd * back, z = mz + T.nz[i] * sd * back; if (excluded(x, z) || vrNear(x, z).dd < 0.8) continue;   // (none in the verge of another leg)
        const hd = T.hd[i], g = scen.get(x, z), wd = [0.36, 0.26, 0.16], fc = [0.86, 0.84, 0.76], ends = [-0.62, 0.62].map(u => [x + T.tx[i] * u, z + T.tz[i] * u]), gy = ends.map(([px, pz]) => caGround(px, pz)), y = Math.max(gy[0], gy[1]);
        ends.forEach(([px, pz], k) => box(g, px, gy[k] - 0.25, pz, 0.08, y + 2.0 - gy[k], 0.08, hd, wd));   // (each post into the ground where it stands)
        box(g, x, y + 0.85, z, 1.4, 0.9, 0.07, hd, wd, wd); box(g, x - T.nx[i] * sd * 0.04, y + 0.9, z - T.nz[i] * sd * 0.04, 1.28, 0.8, 0.02, hd, fc, fc);   // (the frame, the panel on its face to the road)
        exclPush(x, z, 1.6); CR.avoid(x, z, 1.0); nBoards++;
      }
      addM(gm, lMat, true);
    }
    if (LK.extras) { const RX = rng(LK.seed + 60);   // (the look's own pieces: their own random numbers, the others' unchanged)
      nX = LK.extras({ scen, R: RX, onSide, excluded, exclPush, CR, views, sStart, sFin, marks: out.marks, root, person: (x, z, ro, own, y) => crowdPut(CR, x, y == null ? caGround(x, z) : y, z, -Math.sin(ro), Math.cos(ro), { col: fans[Math.floor(RX() * fans.length)], staff: !!own }, 1) }); }   // (own: the place's own people, not spectators; y: on a floor)

    /* ---- the low parapets where the ground falls away and round the outside of the bends (LK.para: the face, the top, its blocks round the
       hairpins in the warning colour; the ends of each run shut), a concrete one on the bridges, a marker post every ~50 m where there is none
       (knockable where it fits: krProps); chevrons on the outside of each hairpin ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)], hp = new Uint8Array(N);
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) { need[sd][k] = 1; hp[k] = 1; } }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), white = LK.para.hp, stone = LK.para.stone, back = LK.para.back;
      const mouth = [new Uint8Array(N), new Uint8Array(N)];   // the mouths of the plots beside the road (the viewpoints' terraces, the lay-bys, the cars' park): open, no post in them
      for (const p of P.pads) if (p.sd) { const si = p.sd > 0 ? 1 : 0, bar = p.sd > 0 ? T.br : T.bl, n = Math.ceil((p.r + 8) / T.ds);
        for (let j = Math.max(0, p.i - n); j <= Math.min(N - 1, p.i + n); j++) { const dx = p.x - T.px[j], dz = p.z - T.pz[j], al = dx * T.tx[j] + dz * T.tz[j], lat = (dx * T.nx[j] + dz * T.nz[j]) * p.sd;
          if (Math.abs(al) < p.r + 1 && lat > 0 && lat < bar[j] + p.r + 3) mouth[si][j] = 1; } }
      for (const [si, i, hw] of laneM) { const n = Math.ceil((hw + 1.5) / T.ds); for (let j = Math.max(0, i - n); j <= Math.min(N - 1, i + n); j++) mouth[si][j] = 1; }   // (and the lanes', def.lanes)
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || bk[si][i] || onBr[i]) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N; i++) if (mouth[si][i] || onBr[i]) nd[i] = 0;   // (once the gaps are filled: the mouths stay open, the bridges have their own)
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.15 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          if (onBr[i] && onBr[i + 1]) {   // the bridge: a concrete parapet (its face, its back, its top; its ends shut)
            const g = scen.get(T.px[i], T.pz[i]), a = Q(i, -0.1, -0.05), b = Q(i + 1, -0.1, -0.05), c = Q(i + 1, 0.95, -0.05), d = Q(i, 0.95, -0.05), a2 = Q(i, -0.1, 0.4), b2 = Q(i + 1, -0.1, 0.4), c2 = Q(i + 1, 0.95, 0.4), d2 = Q(i, 0.95, 0.4), inn = Q(i, 0.4, 0.18);
            g.quadO(a, b, c, d, [0.68, 0.67, 0.64], inn); g.quadO(a2, b2, c2, d2, [0.6, 0.59, 0.56], inn); g.quadO(d, c, c2, d2, [0.76, 0.74, 0.7], inn);
            if (!onBr[i - 1]) g.quadO(a, a2, d2, d, [0.64, 0.63, 0.6], Q(i + 1, 0.4, 0.18)); if (!onBr[i + 2]) g.quadO(b, b2, c2, c, [0.64, 0.63, 0.6], inn);
          } else if (nd[i] && nd[i + 1]) {   // the parapet: its face to the road in stones of a shade each, its top (whitewashed in 2 m blocks round the hairpins), the back
            const g = scen.get(T.px[i], T.pz[i]), blk = Math.floor(i * T.ds / 2), q = 0.9 + 0.16 * rpHash(blk, 83 + si), fc = [stone[0] * q, stone[1] * q, stone[2] * q];
            const tc = hp[i] && blk % 2 ? white : LK.para.top;
            const a = Q(i, -0.2), b = Q(i + 1, -0.2), c = Q(i + 1, 0.6), d = Q(i, 0.6);
            const a2 = Q(i, -0.6, 0.5), b2 = Q(i + 1, -0.6, 0.5), c2 = Q(i + 1, 0.6, 0.5), d2 = Q(i, 0.6, 0.5), inn = Q(i, 0.2, 0.25);
            g.quadO(a, b, c, d, fc, inn); g.quadO(a2, b2, c2, d2, back, inn); g.quadO(d, c, c2, d2, tc, inn);
            if (!nd[i - 1]) g.quadO(a, a2, d2, d, fc, Q(i + 1, 0.2, 0.25)); if (!nd[i + 2]) g.quadO(b, b2, c2, c, fc, inn);   // (where the run starts and ends: its end shut, no hollow towards the cars)
          } else if (!nd[i] && !mouth[si][i] && !onBr[i] && i % 25 === 0 && i > 2 && i < iE - 2 && !bk[si][i]) mkPosts.push([i, side]);
        }
      }
      const kp = krProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      const vAt = (q, o) => { for (let k = 0; k + 1 < q.length; k++) if (o <= q[k + 1][0]) { const t = clamp((o - q[k][0]) / Math.max(1e-3, q[k + 1][0] - q[k][0]), 0, 1); return q[k][1] + (q[k + 1][1] - q[k][1]) * t; } return q[q.length - 1][1]; };   // (the verge's height above the road at o, on its profile)
      for (const sp of mkPosts) { if (kp.has(sp)) continue;   // (its foot in the verge: down on the ditch's floor or the ground, whichever lies lower; on a retaining wall's coping, back from its edge)
        const [i, side] = sp, q = vp[side > 0 ? 1 : 0][i], wl = q[2][1] < -2.6, op = (side > 0 ? T.br[i] : T.bl[i]) + (wl ? 0.24 : 0.42), o = side * op, p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        const f = (wl ? vAt(q, op) : Math.min(vAt(q, op), caGround(p[0], p[2]) - T.hy[i])) - 0.08;
        box(g, p[0], p[1] + f, p[2], 0.13, 1.0 - f, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.76, 0.12, 0.1], null, true);
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

    /* ---- the buses' stops (def.stops [d, side, , shelter]: OpenStreetMap's, each on the side of the road of the buses it serves): the blue
       board with the white bus on a pole by the asphalt's edge and a bench by it (both knockable: Render.propGeometry 'bsign', 'bench'); where
       the map has a shelter and the barrier lies near the road, a shelter beyond it, out of the cars' way (a concrete back and sides under a
       flat roof, the bench inside), someone waiting in it (the place's own people, not spectators: kept as the crews are, fewFans) ---- */
    let nStops = 0;
    if ((def.stops || []).length) {
      const RS = rng(LK.seed + 90), wallC = [0.88, 0.86, 0.78], roofC = [0.42, 0.47, 0.5];
      const atW = (s, side, o) => { const i = T.idx(s), q = side * (w + o); return [T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q, i]; };
      for (const [d, side, , shelter] of def.stops) {
        const s0 = sStart + d; if (s0 < 10 || s0 > T.len - 10) continue;
        const [bx, bz, bi] = atW(s0 - 4, side, 1.0);
        if (!excluded(bx, bz)) { out.props.push({ kind: 'bsign', x: bx, z: bz, yaw: T.hd[bi], col: 0, i: bi }); exclPush(bx, bz, 1.2); CR.avoid(bx, bz, 0.6); }
        const i = T.idx(s0), bar = side > 0 ? T.br[i] : T.bl[i], hd = T.hd[i], nx = T.nx[i] * side, nz = T.nz[i] * side;
        if (shelter && bar < w + 8) {
          const [hx, hz] = onSide(s0, side, 1.7), gy = caGround(hx, hz), g = scen.get(hx, hz); let lo = gy, hi = gy;
          for (const [u, v] of [[-2, -1], [2, -1], [2, 1], [-2, 1]]) { const h = caGround(hx + T.tx[i] * u + nx * v, hz + T.tz[i] * u + nz * v); lo = Math.min(lo, h); hi = Math.max(hi, h); }
          const y = hi + 0.05;
          box(g, hx, lo - 0.4, hz, 4.0, y - lo + 0.55, 2.0, hd, [0.6, 0.6, 0.58], [0.64, 0.64, 0.62]);   // (its floor, on a footing down to the ground)
          box(g, hx + nx * 0.85, y + 0.15, hz + nz * 0.85, 3.8, 2.2, 0.16, hd, wallC, wallC);   // (the back, away from the road)
          for (const u of [-1.85, 1.85]) box(g, hx + T.tx[i] * u + nx * 0.25, y + 0.15, hz + T.tz[i] * u + nz * 0.25, 0.16, 2.2, 1.3, hd, wallC, wallC);
          box(g, hx + nx * 0.15, y + 2.35, hz + nz * 0.15, 4.3, 0.14, 2.3, hd, roofC, roofC);
          const kx = hx + nx * 0.45, kz = hz + nz * 0.45; out.props.push({ kind: 'bench', x: kx, z: kz, yaw: hd, col: 0, i });
          const np = 1 + (RS() < 0.5 ? 1 : 0); for (let k = 0; k < np; k++) { const u = (k - 0.5) * 1.1 + (RS() - 0.5) * 0.4, px = hx + T.tx[i] * u - nx * 0.2, pz = hz + T.tz[i] * u - nz * 0.2;
            crowdPut(CR, px, y + 0.15, pz, -nx, -nz, { col: fans[Math.floor(RS() * fans.length)], staff: true }, 1); }
          exclPush(hx, hz, 2.8); CR.block(hx, hz, 4.4, 2.4, hd);
        } else { const [cx, cz, ci] = atW(s0 + 1, side, 1.5); if (!excluded(cx, cz)) { out.props.push({ kind: 'bench', x: cx, z: cz, yaw: T.hd[ci], col: 0, i: ci }); exclPush(cx, cz, 1.4); CR.avoid(cx, cz, 0.8); } }
        nStops++;
      }
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

    /* ---- the rice terraces (LK.terr: Banaue's): on the fields (lc 6) beyond the verge the slope cut into level paddies along its contours,
       one every dh m of height. Built on the terrain's own 5 m mesh (the near tiles, each cell's two triangles as caGround reads them): the
       ground g at each vertex, each triangle cut along the levels m dh (the contours) into the pieces of its bands; each piece level at its
       band's top ((k + 1) dh: the paddy filled up to the height of its upper edge, never under the ground), at each contour the wall up to
       the next level (its face down the slope) and the dike along its top (a bevel back down onto the paddy above it). How much of that shows
       (tf: the fields' share of the land cover, beyond d0 m past the barrier, within the reach, not on the steep nor on the flat (flat: the
       wide floors of a gentle slope), not on a plot, a lane or under a house: the exclusions; sharpened, mostly 0 or 1: a narrow edge where
       the floors lean) blends the steps into the ground at each vertex (y = g + (level - g) tf) and the paddies' colours into the ground's
       (krCol). Each paddy's colour by its band and its patch (patch m): flooded (the sky's silver), muddy, the young rice, the rice grown,
       ripening; the walls grassy, the dikes lighter. Their own 110 m chunks just over the ground (polygonOffset) in the ground's own
       material (pkGroundMat: its grit, the walls' projected sideways by their 'steep'; the flooded paddies' grit 6 times wider, smoother), no
       shadow of their own; TG keeps tf at each vertex (tfG: the plants and the rocks keep off the paddies) ---- */
    let nTerr = 0, nTerrW = 0, TG = null;
    const tfG = (x, z) => { const G = P.G, gx = (x - G.x0) / VRC, gz = (z - G.z0) / VRC, i = Math.floor(gx), j = Math.floor(gz); if (i < 0 || j < 0 || i >= G.nx - 1 || j >= G.nz - 1) return 0;
      const u = gx - i, v = gz - j, k = j * G.nx + i; return TG[k] * (1 - u) * (1 - v) + TG[k + 1] * u * (1 - v) + TG[k + G.nx] * (1 - u) * v + TG[k + G.nx + 1] * u * v; };
    if (LK.terr) {
      const TR = LK.terr, G = P.G, NX = G.nx, dh = TR.dh, rA = LOD.radius(TR.reach), rB = rA + 25, terr = new Chunks(110, true);
      TG = new Float32Array(G.nx * G.nz); const CG = new Float32Array(G.nx * G.nz * 3), cDone = new Uint8Array(G.nx * G.nz);
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {   // the weight at each vertex of the near tiles
        if (!G.on[tj * G.ntx + ti]) continue;
        for (let j = tj * VRT; j <= Math.min(G.nz - 1, (tj + 1) * VRT); j++) for (let i = ti * VRT; i <= Math.min(NX - 1, (ti + 1) * VRT); i++) {
          const k = j * NX + i, x = G.x0 + i * VRC, z = G.z0 + j * VRC; caGH(i, j); const d = vrDist(x, z); if (d > rB) continue;
          const lc = vrLCf(x, z, 6), dd = G.dd[k]; if (lc <= 0.3 || dd <= TR.d0 || excluded(x, z)) continue;
          const sl = Math.hypot(caGH(i + 1, j) - caGH(i - 1, j), caGH(i, j + 1) - caGH(i, j - 1)) / (2 * VRC);
          TG[k] = sstep(0.3, 0.7, sstep(0.3, 0.7, lc) * sstep(TR.d0, TR.d0 + 6, dd) * sstep(rB, rA, d) * sstep(TR.slope + 0.35, TR.slope, sl) * (TR.flat ? sstep(TR.flat, TR.flat * 2.5, sl) : 1)); }
      }
      const vert = (i, j) => {   // [x, g, z, tf, the ground's colour r, g, b] at the mesh's vertex (i, j)
        const k = j * NX + i, x = G.x0 + i * VRC, z = G.z0 + j * VRC, g = caGH(i, j);
        if (!cDone[k]) { cDone[k] = 1; const nx = -(caGH(i + 1, j) - caGH(i - 1, j)) / (2 * VRC), nz = -(caGH(i, j + 1) - caGH(i, j - 1)) / (2 * VRC), c = krCol(x, z, g, 1 / Math.hypot(nx, 1, nz), G.dd[k]);
          CG[k * 3] = c[0]; CG[k * 3 + 1] = c[1]; CG[k * 3 + 2] = c[2]; }
        return [x, g, z, TG[k], CG[k * 3], CG[k * 3 + 1], CG[k * 3 + 2]]; };
      const lv = (a, b, t) => { const o = new Array(7); for (let q = 0; q < 7; q++) o[q] = a[q] + (b[q] - a[q]) * t; return o; };
      const clip = (poly, L, up) => {   // the part of a convex polygon with its ground above the level L (up) or below it
        const o = [];
        for (let q = 0; q < poly.length; q++) { const a = poly[q], b = poly[(q + 1) % poly.length], ia = up ? a[1] >= L : a[1] <= L, ib = up ? b[1] >= L : b[1] <= L;
          if (ia) o.push(a); if (ia !== ib) o.push(lv(a, b, (L - a[1]) / (b[1] - a[1]))); }
        return o; };
      const PD = TR.paddy, pdSum = PD.reduce((s, p) => s + p[0], 0);
      const PS = TR.patch || 22, pCol = (k, x, z) => { const pu = Math.floor((x * 0.62 + z * 0.78) / PS), pv = Math.floor((x * 0.78 - z * 0.62) / PS); let h = rpHash(k * 131 + pu * 7 + pv * 977, 113) * pdSum, q = 0;
        while (q < PD.length - 1 && (h -= PD[q][0]) > 0) q++;
        const c = PD[q][1], e = 0.93 + 0.12 * rpHash(k * 31 + pu * 3 + pv * 5, 117); return [c[0] * e, c[1] * e, c[2] * e, q === 0 ? 60 : 10]; };
      const mixC = (v, c, f) => { const t = sstep(0.12, 0.4, f); return [lerp(v[4], c[0], t), lerp(v[5], c[1], t), lerp(v[6], c[2], t)]; };
      const uvT = (a, s) => [a[0] / s, -a[2] / s];   // (the ground's top-down UVs: the grit every 10 m; the flooded paddies' smoother, every 60 m)
      const triU = (g, a, b, c, ca, cb, cc, s = 10) => {   // a triangle facing up
        if ((b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]) >= 0) g.tri(a, b, c, ca, cb, cc, uvT(a, s), uvT(b, s), uvT(c, s)); else g.tri(a, c, b, ca, cc, cb, uvT(a, s), uvT(c, s), uvT(b, s)); };
      const triH = (g, a, b, c, ca, cb, cc, dx, dz) => {   // a triangle facing the horizontal (dx, dz)
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        if ((uy * vz - uz * vy) * dx + (ux * vy - uy * vx) * dz > 0) g.tri(a, b, c, ca, cb, cc, uvT(a, 10), uvT(b, 10), uvT(c, 10)); else g.tri(a, c, b, ca, cc, cb, uvT(a, 10), uvT(c, 10), uvT(b, 10)); };
      const piece = (g, tri) => {
        let lo = 1e9, hi = -1e9; for (const v of tri) { lo = Math.min(lo, v[1]); hi = Math.max(hi, v[1]); }
        if (tri[0][3] + tri[1][3] + tri[2][3] <= 0) return;
        const x0 = tri[0][0], z0 = tri[0][2], ex = tri[1][0] - x0, ez = tri[1][2] - z0, fx = tri[2][0] - x0, fz = tri[2][2] - z0, eg = tri[1][1] - tri[0][1], fg = tri[2][1] - tri[0][1], det = ex * fz - fx * ez;
        let ux = (eg * fz - fg * ez) / det, uz = (ex * fg - fx * eg) / det; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;   // (uphill)
        for (let k = Math.floor(lo / dh); k * dh < hi; k++) {   // the paddies: the triangle's part in each band, level at its top
          const poly = clip(clip(tri, k * dh, true), (k + 1) * dh, false); if (poly.length < 3) continue;
          let cx = 0, cz = 0; for (const v of poly) { cx += v[0]; cz += v[2]; } const pc = pCol(k, cx / poly.length, cz / poly.length), yk = (k + 1) * dh;
          const P3 = poly.map(v => [v[0], v[1] + (yk - v[1]) * v[3], v[2]]), C3 = poly.map(v => mixC(v, pc, v[3]));
          for (let q = 1; q + 1 < poly.length; q++) triU(g, P3[0], P3[q], P3[q + 1], C3[0], C3[q], C3[q + 1], pc[3]);
          nTerr++;
        }
        for (let m = Math.floor(lo / dh) + 1; m * dh <= hi; m++) {   // the walls: along each contour across the triangle, from the paddy below up to the dike's top
          const L = m * dh, pts = [];
          for (let q = 0; q < 3; q++) { const a = tri[q], b = tri[(q + 1) % 3]; if ((a[1] < L) !== (b[1] < L)) pts.push(lv(a, b, (L - a[1]) / (b[1] - a[1]))); }
          if (pts.length !== 2 || pts[0][3] + pts[1][3] <= 0.02) continue;
          const [p, q] = pts, wc = TR.wall, e = 0.9 + 0.16 * rpHash(m * 17 + Math.floor(p[0] / 9) * 5 + Math.floor(p[2] / 9) * 101, 119), cw = [wc[0] * e, wc[1] * e, wc[2] * e];
          const pb = [p[0], L, p[2]], qb = [q[0], L, q[2]], pt = [p[0], L + (dh + TR.lip) * p[3], p[2]], qt = [q[0], L + (dh + TR.lip) * q[3], q[2]];
          const cp = mixC(p, cw, p[3]), cq = mixC(q, cw, q[3]), dp = mixC(p, TR.dike, p[3]), dq = mixC(q, TR.dike, q[3]);
          triH(g, pb, qb, qt, cp, cq, cq, -ux, -uz); triH(g, pb, qt, pt, cp, cq, cp, -ux, -uz);
          const pi = [p[0] + ux * TR.dikeW, L + dh * p[3] - 0.02, p[2] + uz * TR.dikeW], qi = [q[0] + ux * TR.dikeW, L + dh * q[3] - 0.02, q[2] + uz * TR.dikeW];   // (the dike: its top back onto the paddy above)
          triU(g, pt, qt, qi, dp, dq, dq); triU(g, pt, qi, pi, dp, dq, dp);
          nTerrW++;
        }
      };
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        for (let j = tj * VRT; j < Math.min(G.nz - 1, (tj + 1) * VRT); j++) for (let i = ti * VRT; i < Math.min(NX - 1, (ti + 1) * VRT); i++) {
          const k = j * NX + i; if (TG[k] + TG[k + 1] + TG[k + NX] + TG[k + NX + 1] <= 0) continue;
          const g = terr.get(G.x0 + (i + 0.5) * VRC, G.z0 + (j + 0.5) * VRC), a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1);
          piece(g, [a, c, b]); piece(g, [b, c, d]);   // (the mesh's two triangles: split on the cell's anti-diagonal, as krTileGeo)
        }
      }
      const tMt = pkGroundMat(); Object.assign(tMt, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });   // (the ground's own material: its grit, the walls' projected sideways)
      for (const g of terr.map.values()) { if (g.empty) continue; const geo = g.geometry(), N = geo.attributes.normal.array, st = new Float32Array(N.length / 3);
        for (let q = 0; q < st.length; q++) st[q] = sstep(0.78, 0.5, N[q * 3 + 1]);
        geo.setAttribute('steep', new THREE.BufferAttribute(st, 1)); const m = new THREE.Mesh(geo, tMt); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); }
    }

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
          if (excluded(x, z) || pathD(x, z) < 1.2 || (TG && tfG(x, z) > 0.25)) continue;   // (none on the terraces' paddies)
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
      const RW = rng(LK.seed + 50), dark = LK.rocks.main, tuff = LK.rocks.alt, NUL = new GB();   // (NUL: never drawn)
      const rockC = () => (RW() < 0.9 ? dark[Math.floor(RW() * dark.length)] : tuff[Math.floor(RW() * tuff.length)]);
      const rockFit = (x, z, dy, rx, ry, rz, rot, jit, flat) => {   // where rockOn puts a rock's open foot and its top: [the foot (below the ground all round: on a slope deeper on the
        // downhill side; its ring 0.86 of the radii, up to jit / 2 more, its heights jit * 0.15 * ry either way), the top (dy + its top's share of ry over the ground under its middle)]
        const c = Math.cos(rot), s = Math.sin(rot), fr = 0.86 * (1 + jit / 2), fl = flat == null ? 0.6 : flat, g0 = caGround(x, z); let lo = g0;
        for (let k = 0; k < 12; k++) { const a = k * PI / 6, lx = Math.cos(a) * rx * fr, lz = Math.sin(a) * rz * fr; lo = Math.min(lo, caGround(x + lx * c - lz * s, z + lx * s + lz * c)); }
        return [Math.min(g0 + dy - 0.4 * ry, lo - 0.04 - 0.225 * jit * ry), g0 + dy + fl * ry]; };
      const rockOn = (g, x, z, dy, rx, ry, rz, rot, col, r_, jit, flat, cap) => {   // a rock (rock()) from its foot (rockFit) up to its top, stretched to keep it, up to cap times its height (or half again)
        const fl = flat == null ? 0.6 : flat, [yb, yt] = rockFit(x, z, dy, rx, ry, rz, rot, jit, flat), ry2 = Math.min((cap || 1.5) * ry, (yt - yb) / (fl + 0.4));
        rock(g, x, yb + 0.4 * ry2, z, rx, ry2, rz, rot, col, r_, jit, flat); };
      if (LK.rocks.karst) for (let s = 4; s < T.len - 4; s += 2.6) for (const side of [-1, 1]) {   // the karst: limestone boulders and knobs in the grass and the fields, more of them farther out
        if (RW() > 0.55 * LK.rocks.karst) continue; const o = 2.5 + Math.pow(RW(), 1.3) * 90, [x, z] = onSide(s, side, o), sz = 0.3 + Math.pow(RW(), 2) * 2.2;
        if (vrNear(x, z).dd < sz + 0.8 || excluded(x, z) || vrDist(x, z) > LOD.cap(100)) continue; const c = vrLC(x, z); if (c === 5 || c === 3) continue;
        rockOn(scen.get(x, z), x, z, sz * 0.15, sz * (1 + RW() * 0.6), sz * (0.8 + RW() * 0.9), sz, RW() * TAU, vary(rockC(), RW, 0.06), RW, 0.4);
      }
      if (LK.rocks.karst) for (let s = 6; s < T.len - 6; s += 3.4) for (const side of [-1, 1]) {   // the karst's pinnacles: clumps of grey limestone knobs taller than wide, where its patches show through the grass (the ground's own grey, pal.karst)
        const o = 3 + Math.pow(RW(), 1.15) * 62, [x, z] = onSide(s, side, o), k = sstep(0.56, 0.8, P.c2(x * 2.6 + 311, z * 2.6));
        if (RW() > k * 0.95 * LK.rocks.karst || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue; const c = vrLC(x, z); if (c === 5 || c === 3 || (c === 6 && RW() < 0.7)) continue;
        const g = scen.get(x, z), b0 = vary(rockC(), RW, 0.05), m = 2 + Math.floor(RW() * 3);
        for (let q = 0; q < m; q++) { const r0 = 0.45 + RW() * 0.8, qx = x + (RW() - 0.5) * 5, qz = z + (RW() - 0.5) * 5, hh = r0 * (1.6 + RW() * 1.8);
          if (vrNear(qx, qz).dd < r0 + 1.2) continue;
          const off = excluded(qx, qz);   // (a knob on a plot, a terrace, the start's ground: built into nothing, its random numbers taken all the same, so the karst after it stays as it was)
          rockOn(off ? NUL : g, qx, qz, hh * 0.35, r0, hh, r0 * (0.7 + RW() * 0.4), RW() * TAU, vary(b0, RW, 0.06), RW, 0.45); if (!off) nKarst++; }
      }
      API.ROCK_SMOOTH = false;
      if (LK.rocks.ledges) for (let s = 8; s < T.len - 8; s += 4.5) for (const side of [-1, 1]) {   // the canyon's beds: long low ledges of rock along the contours of the steep slopes (the harder strata standing out of the scree;
        // each keeps its top over the ground: where its foot down the slope would stretch it to more than twice its height, shorter and shallower, up to 4 times, else none; in their
        // own chunks (ledg) that cast no shadow: on the steep slopes the sun's shadow of a ledge's buried foot fell far down the slope, an outline with no rock to it)
        if (RW() > 0.6 * LK.rocks.ledges) continue;
        const o = 4 + Math.pow(RW(), 1.25) * 70, [x, z] = onSide(s, side, o), m = 1 + Math.floor(RW() * 3), b0 = vary(rockC(), RW, 0.05).map(v => v * 0.96);
        if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(90) || vrLC(x, z) === 5) continue;
        const grad = (px, pz) => [caGround(px + 1.5, pz) - caGround(px - 1.5, pz), caGround(px, pz + 1.5) - caGround(px, pz - 1.5)];
        const [gx, gz] = grad(x, z); if (Math.hypot(gx, gz) / 3 < 0.5) continue;
        const h0 = caGround(x, z); let ux = -gz, uz = gx, cx = x, cz = z;
        for (let q = 0; q < m; q++) {   // (a run of them along the same bed: each along the contour where it lies, the next on from its end along the same bed's height)
          const L = 5 + RW() * 8, hh = 0.55 + RW() * 0.8, dp = 1.0 + RW() * 0.8, gap = 0.5 + RW() * 2;
          const along = (px, pz) => { const [ax, az] = grad(px, pz), l = Math.hypot(ax, az) || 1; let vx = -az / l, vz = ax / l; if (vx * ux + vz * uz < 0) { vx = -vx; vz = -vz; } return [vx, vz, ax / 3, az / 3]; };
          let [vx, vz] = along(cx, cz), qx = cx + vx * L / 2, qz = cz + vz * L / 2;
          { const [, , ax, az] = along(qx, qz), gl = Math.max(0.2, Math.hypot(ax, az)), e = clamp((h0 - caGround(qx, qz)) / gl, -3, 3); qx += ax / gl * e; qz += az / gl * e; }   // (back onto the bed's height, up to 3 m across the slope)
          [vx, vz] = along(qx, qz); ux = vx; uz = vz; cx = qx + vx * (L / 2 + gap); cz = qz + vz * (L / 2 + gap);
          if (vrNear(qx, qz).dd < L / 2 + 2.5 || excluded(qx, qz)) continue;
          const rot = Math.atan2(vz, vx), col = vary(b0, RW, 0.04); let l = L / 2, d = dp, fit = false;
          for (let t = 0; t < 5 && !fit; t++) { if (t) { l *= 0.75; d *= 0.7; } const [yb, yt] = rockFit(qx, qz, hh * 0.2, l, hh, d, rot, 0.25, 0.5); fit = yt - yb <= 0.9 * 2 * hh; }
          rockOn(fit ? ledg.get(qx, qz) : NUL, qx, qz, hh * 0.2, l, hh, d, rot, col, RW, 0.25, 0.5, 2); if (fit) nLedge++; }   // (none: built into nothing, its random numbers taken all the same, so the rocks after it stay as they were)
      }
      if (LK.rocks.scree) for (let s = 6; s < T.len - 6; s += 2.2) for (const side of [-1, 1]) {   // the scree: stones strewn down the slopes near the road
        if (RW() > LK.rocks.scree) continue; const o = 2.5 + Math.pow(RW(), 1.4) * 45, [x, z] = onSide(s, side, o), sz = 0.16 + Math.pow(RW(), 2) * 0.55;
        if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrLC(x, z) === 5 || caSlope(x, z) < 0.3) continue;
        rockOn(scen.get(x, z), x, z, sz * 0.2, sz * 1.3, sz * 0.8, sz, RW() * TAU, vary(rockC(), RW, 0.1), RW, 0.35);
      }
      for (let s = 6; s < T.len - 6; s += 4.2) for (const side of [-1, 1]) {   // stones beside the road
        if (RW() > 0.4) continue; const o = 1.8 + Math.pow(RW(), 1.6) * 34, [x, z] = onSide(s, side, o), sz = 0.18 + RW() * 0.45;
        if (vrNear(x, z).dd < sz + 0.5 || excluded(x, z) || vrLC(x, z) === 6 || (TG && tfG(x, z) > 0.2)) continue;
        rockOn(scen.get(x, z), x, z, sz * 0.2, sz * 1.3, sz, sz, RW() * TAU, vary(rockC(), RW, 0.08), RW, 0.35);
      }
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {   // blocks at the foot of the cuts
        if (RW() > 0.32) continue;
        const o = 1.6 + Math.pow(RW(), 1.5) * 30, [x, z] = onSide(s, side, o), sz = 0.5 + RW() * 1.3; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        if (caSlope(x, z) < 0.4 || (TG && tfG(x, z) > 0.2)) continue;
        rockOn(scen.get(x, z), x, z, sz * 0.3, sz * 1.2, sz, sz, RW() * TAU, vary(rockC(), RW, 0.1), RW, 0.3);
      }
      const crag = (x, z, n, rMax) => { const g = scen.get(x, z), b0 = vary(rockC(), RW, 0.06);
        for (let q = 0; q < n; q++) { const r0 = 1.1 + RW() * rMax, qx = x + (RW() - 0.5) * 10, qz = z + (RW() - 0.5) * 10; if (vrNear(qx, qz).dd < r0 + 1 || excluded(qx, qz)) continue;
          rockOn(g, qx, qz, r0 * 0.35, r0, r0 * (0.9 + RW() * 0.9), r0 * (0.7 + RW() * 0.4), RW() * TAU, vary(b0, RW, 0.07), RW, 0.35); } };
      for (let s = 16; s < T.len - 16; s += 12) for (const side of [-1, 1]) {   // crags where the slope is steep
        if (RW() < 0.6) continue;
        const [x, z] = onSide(s, side, 12 + RW() * 120); if (excluded(x, z) || vrNear(x, z).dd < 10 || vrDist(x, z) > LOD.cap(110) || (TG && tfG(x, z) > 0.2)) continue;
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
      if (LK.rocks.boulders) {   // the granite (Mahé's): rounded grey boulders among the trees and on the slopes, half sunk in the ground, a few of them huge, more where the
        // slope is steep, now and then a second one leaning on a big one (their own random numbers: the rocks before them as they were)
        const RG = rng(LK.seed + 70), rs0 = API.ROCK_SMOOTH, gc = () => vary(RG() < 0.88 ? dark[Math.floor(RG() * dark.length)] : tuff[Math.floor(RG() * tuff.length)], RG, 0.05);
        API.ROCK_SMOOTH = true;
        for (let s = 6; s < T.len - 6; s += 3.2) for (const side of [-1, 1]) {
          if (RG() > 0.45 * LK.rocks.boulders) continue;
          const o = 2 + Math.pow(RG(), 1.35) * 58, [x, z] = onSide(s, side, o), big = RG(), r0 = 0.5 + Math.pow(big, 2.4) * 3.4, sl = caSlope(x, z);
          if (RG() > 0.35 + sl * 0.9 || vrNear(x, z).dd < r0 + 0.8 || excluded(x, z) || vrDist(x, z) > LOD.cap(110)) continue;
          const c = vrLC(x, z); if (c === 5 || (c === 3 && RG() < 0.7)) continue;
          const g = scen.get(x, z), rot = RG() * TAU;
          rockOn(g, x, z, -r0 * 0.12, r0 * (0.95 + RG() * 0.5), r0 * (0.55 + RG() * 0.3), r0 * (0.8 + RG() * 0.35), rot, gc(), RG, 0.16, 0.55); nGranite++;
          if (big > 0.7 && RG() < 0.55) { const a = rot + (RG() - 0.5) * 2, r1 = r0 * (0.35 + RG() * 0.3), qx = x + Math.cos(a) * r0 * 1.1, qz = z + Math.sin(a) * r0 * 1.1;
            if (vrNear(qx, qz).dd > r1 + 0.8 && !excluded(qx, qz)) { rockOn(g, qx, qz, 0, r1 * 1.1, r1 * 0.7, r1, RG() * TAU, gc(), RG, 0.18, 0.55); nGranite++; } }
        }
        API.ROCK_SMOOTH = rs0;
      }
    }

    /* ---- the view beyond the corridor (def.farDem: the hills and the valleys round; irFar, World.update moves it with the camera); finish
       the meshes ---- */
    const FAR = API.irFar ? API.irFar(LK.far, LK.farWet) : null; if (FAR) { FAR.th = 4; FAR.mesh.visible = false; root.add(FAR.mesh); out.dyn.irFar = FAR; }   // (hidden until the first World.update; th: moved on again once the camera is 4 m on, as Mount Baldy's, not every frame: the lines of sight to the hills hardly change)
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true); ledg.addTo(sceneryGroup, matV, false, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: krAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: krAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, shrubs: nShrubs, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), walls: nWall, views: views.length, marks: nMarks, boards: nBoards, karst: nKarst, far: !!FAR };   // (read by the tests)
    if (LK.rocks.ledges) out.stats.ledges = nLedge; if (LK.extras) out.stats.extras = nX; if ((def.bld || []).length) Object.assign(out.stats, { bldMoved: nBldMoved, bldOut: nBldOut });
    if (LK.terr) Object.assign(out.stats, { terr: nTerr, terrWalls: nTerrW });
    if (LK.rocks.boulders) out.stats.granite = nGranite; if ((def.lanes || []).length) out.stats.lanes = nLane; if ((def.stops || []).length) out.stats.stops = nStops;
    return out;
  }


  // the roads of this builder: each its own theme (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.keep('VR', 'mapileng');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.mapileng = (scene, tex, opts) => buildKratke(scene, tex, opts, KR.mapileng);
  World.keep('VR', 'mujib');
  World.ext.mujib = (scene, tex, opts) => buildKratke(scene, tex, opts, KR.mujib);
  World.keep('VR', 'sanssouci');
  World.ext.sanssouci = (scene, tex, opts) => buildKratke(scene, tex, opts, KR.sanssouci);
  World.keep('VR', 'banaue');
  World.ext.banaue = (scene, tex, opts) => buildKratke(scene, tex, opts, KR.banaue);
  World.keep('VR', 'atitlan');
  World.ext.atitlan = (scene, tex, opts) => buildKratke(scene, tex, opts, KR.atitlan);
})();
