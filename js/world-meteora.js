/* =========================================================================
   WORLD — Meteora, Greece (docs/proge/meteora.md): the road from the village of Kastraki up between the sandstone and conglomerate pillars
   above the plain of Thessaly, past the monasteries on the rock tops, to the end of the road below the last of them. Built by the shared world
   of the mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its own (PL_LOOK.meteora) and its own landmarks (L.pre, L.extra):
   - the pillars: on the land cover's rock cells (def.lc class 4: ESA WorldCover's bare rock and the model's steep slopes, tools/proga) away
     from the road, steep, rounded columns of grey conglomerate, darker streaks down them, from the lowest ground round them up to a little
     above the model's highest point there (Copernicus DEM GLO-30's 30 m cells round off the narrow tops);
   - the monasteries: OpenStreetMap's footprints away from the village (more than ~1.5 km along the road from the start), in place of the
     shared builder's huts: walls of pale stone and ochre plaster on a plinth, low gables of red tiles, small dark windows, one small dome on
     the largest building of each group;
   - in Kastraki the shared builder's houses with red tiled roofs, the oak scrub and the plane trees (forest 'med').
   Steel barriers and low stone walls on the drop side; the car cannot fall (no def.drops). Places from OpenStreetMap (ODbL 1.0); all generic:
   no names, letters, signs or symbols
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { box, caGround, clamp, cyl, rng, vary, vrDist, vrLC } = API;
  const gable = World.gable;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ---- the look: Meteora at the end of summer: the dry grass of the slopes, the dark green of the oak scrub and the plane trees, the grey
     and buff conglomerate of the pillars streaked darker where the rain runs down; the plain's haze in the distance ---- */
  const LOOK = API.PL_LOOK.meteora = {
    seed: 6230, board: 'METEORA', sub: 'GREECE', banner: ['KASTRAKI · END OF THE ROAD', '254 M → 504 M · 5.9 KM'],
    grass: [0.6, 0.56, 0.4], grassDry: [0.68, 0.61, 0.45], grassLush: [0.44, 0.48, 0.3], shrub: [0.26, 0.33, 0.2],
    rock: [0.6, 0.58, 0.54], rockWarm: [0.66, 0.6, 0.5], lichen: [0.52, 0.52, 0.46], scree: [0.62, 0.59, 0.53],
    bank: [0.6, 0.54, 0.42], flowers: 0.12,
    sat: 0.5, satV: 1.08, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.62, 0.6, 0.56], [0.68, 0.64, 0.58], [0.55, 0.54, 0.51], [0.7, 0.63, 0.52], [0.6, 0.56, 0.5], [0.74, 0.7, 0.63]],   // (the conglomerate: grey, buff, ochre where weathered)
    centre: [0.95, 0.95, 0.92], dash: [3, 9], solidNear: 40,
    chev: ['#16161a', '#f2c418'], warn: 'tri', rail: 'steel', shoulder: [0.62, 0.58, 0.48], hills: 1,
    fans: [[0.95, 0.95, 0.94], [0.12, 0.34, 0.68], [0.84, 0.48, 0.12], [0.62, 0.12, 0.12], [0.2, 0.42, 0.3], [0.78, 0.7, 0.55], [0.4, 0.42, 0.46], [0.55, 0.5, 0.42]],
    cars: [[0.94, 0.94, 0.93], [0.78, 0.79, 0.8], [0.62, 0.64, 0.66], [0.72, 0.18, 0.14], [0.72, 0.66, 0.55], [0.22, 0.38, 0.62]],
    roofs: [[0.66, 0.3, 0.2], [0.6, 0.27, 0.18], [0.72, 0.38, 0.26]],   // (the red tiles of Thessaly)
    sheep: 0, portal: 0, forest: 'med', treeline: 9000, shrubR: 110,
    // (the far view: the plain of Thessaly to the south, the Pindus foothills to the north and west, oak woods on them, no snow in summer)
    far: { lo: [0.56, 0.54, 0.4], hi: [0.6, 0.58, 0.5], dw: [0.32, 0.38, 0.24], snow: 9000, tree: [900, 500], fc: [0.24, 0.32, 0.18], dwb: [0, 150, 900, 700], rk: [500, 800], wet: [0.14, 0.34, 0.5] },
  };

  let MONA = [];   // (the monasteries' buildings: OpenStreetMap's footprints away from the village, taken from the shared builder)
  const VILLAGE = 1500;   // (metres along the road from the start: Kastraki's houses; beyond it the monasteries')

  /* ---- before the terrain: the monasteries' buildings taken from the shared builder's huts (L.extra builds them), the village's left to it ---- */
  LOOK.pre = function ({ blds }) {
    const i0 = T.idx(T.startS);
    MONA = [];
    for (let k = blds.length - 1; k >= 0; k--) {
      const b = blds[k]; let bi = 0, bd = 1e18;
      for (let i = 0; i < T.N; i += 2) { const d = (T.px[i] - b.x) ** 2 + (T.pz[i] - b.z) ** 2; if (d < bd) { bd = d; bi = i; } }
      if ((bi - i0) * T.ds > VILLAGE) MONA.push(blds.splice(k, 1)[0]);
    }
  };

  /* ---- the pillars and the monasteries, after the rest of the road is built ---- */
  LOOK.extra = function ({ scen, out }) {
    const G = (x, z) => caGround(x, z);
    const st = { pillars: 0, buildings: 0, windows: 0, domes: 0 };
    const def = T.def, L = def.lc, R = rng(LOOK.seed + 33);

    // the pillars: the rock cells' local tops on a 48 m grid, at least 35 m from the road and 25 m from any monastery
    if (L) {
      const cand = new Map();
      for (let j = 0; j < L.nz; j++) for (let i = 0; i < L.nx; i++) {
        const x = L.x0 + (i + 0.5) * L.cell, z = L.z0 + (j + 0.5) * L.cell;
        if (vrLC(x, z) !== 4) continue;
        if (vrDist(x, z) < 35 || MONA.some(b => Math.hypot(b.x - x, b.z - z) < 25)) continue;
        const y = G(x, z), key = Math.floor(x / 48) + ',' + Math.floor(z / 48), o = cand.get(key);
        if (!o || y > o.y) cand.set(key, { x, z, y });
      }
      const tops = [...cand.values()].sort((a, b) => b.y - a.y).slice(0, 48);
      const RC = LOOK.rockCols, streak = [0.42, 0.41, 0.38];
      for (const p of tops) {
        const r = 9 + R() * 9, sides = 10;
        let lo = p.y; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; lo = Math.min(lo, G(p.x + Math.cos(a) * r * 1.6, p.z + Math.sin(a) * r * 1.6)); }
        const top = p.y + 6 + R() * 6, H = top - lo + 2;
        if (H < 10) continue;
        const g = scen.get(p.x, p.z), col = vary(RC[Math.floor(R() * RC.length)], R, 0.04);
        // the column: three stacked drums, the sides nearly sheer, a little narrower to the top; then the rounded cap
        const h1 = H * 0.45, h2 = H * 0.35, h3 = H * 0.2;
        cyl(g, p.x, lo - 2, p.z, r * 1.12, h1, sides, col, null, r * 1.04);
        cyl(g, p.x, lo - 2 + h1, p.z, r * 1.04, h2, sides, vary(col, R, 0.03), null, r * 0.98);
        cyl(g, p.x, lo - 2 + h1 + h2, p.z, r * 0.98, h3, sides, col, null, r * 0.9);
        cyl(g, p.x, lo - 2 + H, p.z, r * 0.9, r * 0.22, sides, col, vary(col, R, 0.05), r * 0.62);
        cyl(g, p.x, lo - 2 + H + r * 0.22, p.z, r * 0.62, r * 0.12, sides, col, col, r * 0.2);
        // the darker streaks where the rain runs down (thin slabs on the face)
        for (let k = 0; k < 3; k++) {
          const a = R() * Math.PI * 2, hh = H * (0.4 + R() * 0.4);
          box(g, p.x + Math.cos(a) * (r * 1.0 + 0.05), lo - 2 + H - hh / 2 - 1, p.z + Math.sin(a) * (r * 1.0 + 0.05), 1.2 + R() * 1.6, hh, 0.12, Math.PI / 2 - a, streak);
        }
        st.pillars++;
      }
    }

    // the monasteries: pale stone and ochre walls on a plinth, low gables of red tiles, small dark windows near the road
    const WALL = [[0.86, 0.82, 0.74], [0.8, 0.74, 0.62], [0.74, 0.66, 0.52], [0.9, 0.88, 0.82]];
    const stone = [0.62, 0.58, 0.5], dark = [0.2, 0.18, 0.16], groups = [];
    for (const b of MONA) {
      const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang), d = vrDist(b.x, b.z); let lo = 1e9, hi = -1e9;
      for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const yq = G(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, yq); hi = Math.max(hi, yq); }
      const area = b.L * b.W, fl = b.h > 0 ? clamp(Math.round(b.h / 3.4), 1, 3) : area > 250 ? 2 : 1, H = fl * 3.4;
      const wc = vary(WALL[Math.floor(R() * WALL.length)], R, 0.03), rc = vary(LOOK.roofs[Math.floor(R() * LOOK.roofs.length)], R, 0.04);
      box(g, b.x, lo - 0.6, b.z, b.L + 0.3, hi - lo + 1.0, b.W + 0.3, b.ang, stone, null, true);   // (the stone plinth down the slope)
      box(g, b.x, hi + 0.4, b.z, b.L, H - 0.4, b.W, b.ang, wc, wc, true);
      const along = b.L >= b.W, rl = along ? b.L : b.W, rd = along ? b.W : b.L, ra = along ? b.ang : b.ang + Math.PI / 2;
      gable(g, b.x, hi + H, b.z, rl + 0.5, rd + 0.6, Math.min(2.4, rd * 0.22), ra, rc, wc);
      if (d < 140) {
        const n = Math.max(1, Math.min(5, Math.floor(b.L / 3.4)));
        for (let f = 0; f < fl; f++) for (const sd of [-1, 1]) for (let q = 0; q < n; q++) { const u = (q - (n - 1) / 2) * b.L / n, v = sd * (b.W / 2 + 0.03);
          box(g, b.x + c * u - s * v, hi + 1.3 + f * 3.4, b.z + s * u + c * v, 0.7, 1.1, 0.07, b.ang, dark, null, true); st.windows++; }
      }
      // (the groups: buildings within 60 m of each other are one monastery; its largest middling one gets the dome)
      let gr = groups.find(o => Math.hypot(o.x - b.x, o.z - b.z) < 60);
      if (!gr) groups.push(gr = { x: b.x, z: b.z, best: null });
      if (area > 50 && area < 500 && (!gr.best || area > gr.best.area)) gr.best = { b, area, y: hi + H, wc };
      st.buildings++;
    }
    for (const gr of groups) {   // one small dome on a drum (a stack of shrinking rings of red tiles) per monastery
      if (!gr.best) continue;
      const { b, y, wc } = gr.best, g = scen.get(b.x, b.z), r = clamp(Math.min(b.L, b.W) * 0.25, 1.6, 2.8), rc = LOOK.roofs[0];
      cyl(g, b.x, y + 0.4, b.z, r, 2.0, 12, wc, wc);
      const N = 5;
      for (let k = 0; k < N; k++) { const a0 = k / N * Math.PI / 2, a1 = (k + 1) / N * Math.PI / 2;
        cyl(g, b.x, y + 2.4 + Math.sin(a0) * r, b.z, r * Math.cos(a0) + 0.1, (Math.sin(a1) - Math.sin(a0)) * r + 0.02, 12, rc, rc, r * Math.cos(a1) + 0.1); }
      st.domes++;
    }
    out.meteora = st;   // (what was built: the tests)
  };

  World.ext.meteora = (scene, tex, opts) => { API.TEX = tex; return API.buildPrelaz(scene, tex, opts, LOOK); };
})();
