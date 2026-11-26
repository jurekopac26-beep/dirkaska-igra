/* =========================================================================
   WORLD — Stavrovouni, Cyprus (docs/proge/stavrovouni.md): the climb up the lone, dry limestone hill above the plain of Larnaca to the
   monastery on its top, built by the shared world of the mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its own
   (PL_LOOK.stavrovouni) and its own landmark (L.pre, L.extra): the monastery's buildings (OpenStreetMap's footprints near the summit, in place of
   the shared builder's huts): whitewashed walls of stone on a plinth, low gable roofs of terracotta tiles, the church's drum and dome and a
   small bell tower on OpenStreetMap's church, the main building drawn round its footprint with its two gates, the fence round the
   church's yard (plinth and railing). Lower down the shared builder's stone huts (the villages by the start), the dry
   scrub and the pines (Aleppo and Calabrian: forest 'med'). Steel guardrails in the hairpins; the car cannot fall (no def.drops). Places from
   OpenStreetMap (ODbL 1.0); all generic: no names, letters, signs or symbols
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { box, caGround, clamp, cyl, rng, vary, vrDist } = API;
  const gable = World.gable;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ---- the look: Stavrovouni in late autumn: the straw of the dry grass, the grey-green scrub (thyme, thorny burnet, lentisk), the pale
     chalk and limestone of the hill, the pines on its lower slopes; the plain's haze in the distance, the sea far to the south-east ---- */
  const LOOK = API.PL_LOOK.stavrovouni = {
    seed: 7310, board: 'STAVROVOUNI', sub: 'CYPRUS', banner: ['FOOT · SUMMIT', '325 M → 639 M · 4.5 KM'],
    grass: [0.62, 0.55, 0.4], grassDry: [0.7, 0.62, 0.45], grassLush: [0.5, 0.49, 0.33], shrub: [0.34, 0.36, 0.25],
    rock: [0.7, 0.66, 0.58], rockWarm: [0.74, 0.65, 0.52], lichen: [0.6, 0.58, 0.51], scree: [0.68, 0.63, 0.54],
    bank: [0.66, 0.57, 0.44], flowers: 0.15,
    sat: 0.45, satV: 1.1, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.74, 0.7, 0.62], [0.8, 0.76, 0.68], [0.66, 0.63, 0.57], [0.76, 0.67, 0.54], [0.68, 0.62, 0.52], [0.84, 0.81, 0.74]],   // (the chalk and the limestone: white, cream, pale grey, ochre where weathered)
    centre: [0.95, 0.95, 0.92], dash: [3, 9], solidNear: 40,
    chev: ['#16161a', '#f2c418'], warn: 'tri', rail: 'steel', shoulder: [0.66, 0.6, 0.5], hills: 1,
    fans: [[0.95, 0.95, 0.94], [0.12, 0.26, 0.62], [0.84, 0.48, 0.12], [0.62, 0.12, 0.12], [0.2, 0.42, 0.3], [0.78, 0.7, 0.55], [0.3, 0.32, 0.36], [0.55, 0.5, 0.42]],
    cars: [[0.94, 0.94, 0.93], [0.78, 0.79, 0.8], [0.62, 0.64, 0.66], [0.72, 0.18, 0.14], [0.72, 0.66, 0.55], [0.2, 0.32, 0.55]],
    roofs: [[0.7, 0.38, 0.26], [0.64, 0.33, 0.23], [0.74, 0.44, 0.3]],   // (the island's terracotta tiles)
    sheep: 0, portal: 0, forest: 'med', treeline: 9000, shrubR: 110,
    // (the far view: the dry hills and the plain round the hill, pines on the slopes, no snow, the sea to the south-east)
    far: { lo: [0.62, 0.56, 0.42], hi: [0.7, 0.65, 0.55], dw: [0.42, 0.42, 0.3], snow: 9000, tree: [700, 450], fc: [0.3, 0.34, 0.22], dwb: [0, 150, 900, 700], rk: [500, 800], wet: [0.14, 0.34, 0.5] },
  };

  let MONA = [];   // (the monastery's buildings: OpenStreetMap's footprints near the summit, taken from the shared builder)
  const MONA_R = 260;   // (metres from the finish: what belongs to the monastery)

  /* ---- before the terrain: the monastery's buildings taken from the shared builder's huts (L.extra builds them), the villages' left to it ---- */
  LOOK.pre = function ({ blds }) {
    const i = T.idx(T.finishS), fx = T.px[i], fz = T.pz[i];
    MONA = [];
    for (let k = blds.length - 1; k >= 0; k--) if (Math.hypot(blds[k].x - fx, blds[k].z - fz) < MONA_R) MONA.push(blds.splice(k, 1)[0]);
    MONA.sort((a, b) => Math.hypot(a.x - fx, a.z - fz) - Math.hypot(b.x - fx, b.z - fz));
  };

  /* ---- OpenStreetMap's monastery on the summit (ODbL; in the track's metres): the main building (way 83117584, a place of worship) as two
     blocks round its footprint (the shared list caps a building at 34 x 20 m), its two gates (barrier=gate on its outline), the church
     (building=church, way 83117602: the dome and the bell tower go on it, card proga-1092-stavrovouni-samostan, a) and the fence round the
     church's yard (barrier=fence, way 1489201556: a low stone plinth under a steel railing) ---- */
  const OSM_MAIN = [983.5, 1323.6], OSM_CHURCH = [1132.5, 1155.4];
  const OSM_BLOCKS = [[985.0, 1321.5, 61.2, 19.3, -0.238], [971.0, 1333.2, 20.9, 24.9, 1.233]];   // [x, z, length, width, angle]
  const OSM_GATES = [[981.1, 1310.5, -0.238], [956.7, 1336.1, 1.233]];   // [x, z, angle of the wall they are in]
  const OSM_FENCE = [[1121.6, 1162.8], [1118.4, 1157.2], [1123.1, 1152.7], [1131.8, 1148.0], [1136.7, 1147.5], [1142.9, 1148.4], [1145.1, 1152.9], [1139.0, 1159.9], [1126.0, 1169.9]];

  /* ---- the monastery, after the rest of the road is built ---- */
  LOOK.extra = function ({ scen, out }) {
    const G = (x, z) => caGround(x, z);
    const st = { buildings: 0, windows: 0, domes: 0, towers: 0, walls: 0, gates: 0, church: 0 };
    const RB = rng(LOOK.seed + 21), WALL = [[0.93, 0.91, 0.86], [0.9, 0.87, 0.8], [0.86, 0.8, 0.7], [0.95, 0.94, 0.9]];
    const stone = [0.74, 0.68, 0.58], dark = [0.2, 0.18, 0.16], steel = [0.56, 0.58, 0.6];
    const near = (b, p, r) => Math.hypot(b.x - p[0], b.z - p[1]) < r;
    // (the main building's blocks in place of its capped box; the church found by OpenStreetMap's footprint, not by its size)
    const parts = [];
    for (const b of MONA) {
      if (near(b, OSM_MAIN, 8)) { for (const [x, z, L, W, ang] of OSM_BLOCKS) parts.push({ x, z, L, W, ang, h: 0, main: true }); continue; }
      parts.push(b);
    }
    let church = null;
    for (const b of parts) {
      const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang), d = vrDist(b.x, b.z); let lo = 1e9, hi = -1e9;
      for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const yq = G(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, yq); hi = Math.max(hi, yq); }
      const area = b.L * b.W, fl = b.h > 0 ? clamp(Math.round(b.h / 3.4), 1, 3) : area > 250 ? 2 : 1, H = fl * 3.4;
      const wc = vary(WALL[Math.floor(RB() * WALL.length)], RB, 0.03), rc = vary(LOOK.roofs[Math.floor(RB() * LOOK.roofs.length)], RB, 0.04);
      box(g, b.x, lo - 0.6, b.z, b.L + 0.3, hi - lo + 1.0, b.W + 0.3, b.ang, stone, null, true);   // (the stone plinth down the slope)
      box(g, b.x, hi + 0.4, b.z, b.L, H - 0.4, b.W, b.ang, wc, wc, true);
      // the roof: low gables of terracotta along the longer side, a little overhang
      const along = b.L >= b.W, rl = along ? b.L : b.W, rd = along ? b.W : b.L, ra = along ? b.ang : b.ang + Math.PI / 2;
      gable(g, b.x, hi + H, b.z, rl + 0.5, rd + 0.6, Math.min(2.4, rd * 0.22), ra, rc, wc);
      if (d < 140) {   // (the small dark windows, those of the buildings near the road; the main building's outer walls only on the upper floor)
        const n = Math.max(1, Math.min(b.main ? 8 : 5, Math.floor(b.L / 3.4)));
        for (let f = b.main ? fl - 1 : 0; f < fl; f++) for (const sd of [-1, 1]) for (let q = 0; q < n; q++) { const u = (q - (n - 1) / 2) * b.L / n, v = sd * (b.W / 2 + 0.03);
          box(g, b.x + c * u - s * v, hi + 1.3 + f * 3.4, b.z + s * u + c * v, 0.7, 1.1, 0.07, b.ang, dark, null, true); st.windows++; }
      }
      if (!church && !b.main && near(b, OSM_CHURCH, 6)) { church = { b, y: hi + H, wc }; st.church = 1; }
      st.buildings++;
    }
    for (const [x, z, ang] of OSM_GATES) {   // the main building's two gates: dark arched openings in its outer wall
      const g = scen.get(x, z), y = G(x, z);
      box(g, x, y - 0.3, z, 3.0, 3.3, 0.9, ang, dark, null, true); box(g, x, y + 3.0, z, 3.6, 0.5, 1.0, ang, stone, stone, true); st.gates++;
    }
    if (church) {   // the church's drum and dome (a stack of shrinking rings, terracotta), the small bell tower by its end
      const { b, y, wc } = church, g = scen.get(b.x, b.z), r = clamp(Math.min(b.L, b.W) * 0.28, 1.8, 3.2), rc = LOOK.roofs[0];
      cyl(g, b.x, y + 0.4, b.z, r, 2.4, 12, wc, wc);
      const N = 5;
      for (let k = 0; k < N; k++) { const a0 = k / N * Math.PI / 2, a1 = (k + 1) / N * Math.PI / 2;
        cyl(g, b.x, y + 2.8 + Math.sin(a0) * r, b.z, r * Math.cos(a0) + 0.1, (Math.sin(a1) - Math.sin(a0)) * r + 0.02, 12, rc, rc, r * Math.cos(a1) + 0.1); }
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; box(g, b.x + Math.cos(a) * (r + 0.02), y + 1.3, b.z + Math.sin(a) * (r + 0.02), 0.35, 0.9, 0.06, Math.PI / 2 - a, dark); }
      st.domes++;
      const c = Math.cos(b.ang), s = Math.sin(b.ang), u = Math.max(b.L, b.W) / 2 + 1.2, tx = b.x + (b.L >= b.W ? c * u : -s * u), tz = b.z + (b.L >= b.W ? s * u : c * u), ty = G(tx, tz);
      box(g, tx, ty - 0.5, tz, 2.4, y - ty + 4.5, 2.4, b.ang, wc, wc);
      box(g, tx, y + 1.6, tz, 2.46, 1.4, 1.0, b.ang, dark); box(g, tx, y + 1.6, tz, 1.0, 1.4, 2.46, b.ang, dark);   // (the belfry's openings)
      gable(g, tx, y + 4.0, tz, 2.8, 2.8, 1.0, b.ang, rc, wc);
      st.towers++;
    }
    // the fence round the church's yard (OpenStreetMap's line): a low plinth of stone, steel posts and a rail on it, open where it meets the road
    for (let k = 0; k + 1 < OSM_FENCE.length; k++) {
      const [x0, z0] = OSM_FENCE[k], [x1, z1] = OSM_FENCE[k + 1], Ls = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0), n = Math.max(1, Math.round(Ls / 2.5));
      for (let q = 0; q < n; q++) {
        const t = (q + 0.5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
        if (vrDist(x, z) < 5) continue;
        const g = scen.get(x, z), y = G(x, z);
        box(g, x, y - 0.4, z, Ls / n + 0.05, 1.0, 0.4, ang, stone, [0.8, 0.75, 0.66], true);   // (the plinth, 0.6 m above the ground)
        box(g, x, y + 1.45, z, Ls / n + 0.05, 0.06, 0.06, ang, steel, steel, true);   // (the rail)
        const px = x - Math.cos(ang) * Ls / n / 2, pz = z - Math.sin(ang) * Ls / n / 2;
        box(g, px, y + 0.6, pz, 0.06, 0.9, 0.06, ang, steel, steel, true); st.walls++;
      }
    }
    out.stavrovouni = st;   // (what was built: the tests)
  };

  World.ext.stavrovouni = (scene, tex, opts) => { API.TEX = tex; return API.buildPrelaz(scene, tex, opts, LOOK); };
})();
