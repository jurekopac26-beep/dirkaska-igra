/* =========================================================================
   WORLD — Stavrovouni, Cyprus (docs/proge/stavrovouni.md): the climb up the lone, dry limestone hill above the plain of Larnaca to the
   monastery on its top, built by the shared world of the mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its own
   (PL_LOOK.stavrovouni) and its own landmark (L.pre, L.extra): the monastery's buildings (OpenStreetMap's footprints near the summit, in place of
   the shared builder's huts): whitewashed walls of stone on a plinth, low gable roofs of terracotta tiles, the church's drum and dome and a
   small bell tower, a stone wall round the summit's courtyard. Lower down the shared builder's stone huts (the villages by the start), the dry
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

  /* ---- the monastery, after the rest of the road is built ---- */
  LOOK.extra = function ({ scen, out }) {
    const G = (x, z) => caGround(x, z);
    const st = { buildings: 0, windows: 0, domes: 0, towers: 0, walls: 0 };
    const RB = rng(LOOK.seed + 21), WALL = [[0.93, 0.91, 0.86], [0.9, 0.87, 0.8], [0.86, 0.8, 0.7], [0.95, 0.94, 0.9]];
    const stone = [0.74, 0.68, 0.58], dark = [0.2, 0.18, 0.16];
    let church = null;
    for (const b of MONA) {
      const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang), d = vrDist(b.x, b.z); let lo = 1e9, hi = -1e9;
      for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const yq = G(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, yq); hi = Math.max(hi, yq); }
      const area = b.L * b.W, fl = b.h > 0 ? clamp(Math.round(b.h / 3.4), 1, 3) : area > 250 ? 2 : 1, H = fl * 3.4;
      const wc = vary(WALL[Math.floor(RB() * WALL.length)], RB, 0.03), rc = vary(LOOK.roofs[Math.floor(RB() * LOOK.roofs.length)], RB, 0.04);
      box(g, b.x, lo - 0.6, b.z, b.L + 0.3, hi - lo + 1.0, b.W + 0.3, b.ang, stone, null, true);   // (the stone plinth down the slope)
      box(g, b.x, hi + 0.4, b.z, b.L, H - 0.4, b.W, b.ang, wc, wc, true);
      // the roof: low gables of terracotta along the longer side, a little overhang
      const along = b.L >= b.W, rl = along ? b.L : b.W, rd = along ? b.W : b.L, ra = along ? b.ang : b.ang + Math.PI / 2;
      gable(g, b.x, hi + H, b.z, rl + 0.5, rd + 0.6, Math.min(2.4, rd * 0.22), ra, rc, wc);
      if (d < 140) {   // (the small dark windows, the arched door's dark of those near the road)
        const n = Math.max(1, Math.min(5, Math.floor(b.L / 3.4)));
        for (let f = 0; f < fl; f++) for (const sd of [-1, 1]) for (let q = 0; q < n; q++) { const u = (q - (n - 1) / 2) * b.L / n, v = sd * (b.W / 2 + 0.03);
          box(g, b.x + c * u - s * v, hi + 1.3 + f * 3.4, b.z + s * u + c * v, 0.7, 1.1, 0.07, b.ang, dark, null, true); st.windows++; }
      }
      if (!church && area > 60 && area < 400) church = { b, y: hi + H, wc };   // (the church: the first middling building nearest the summit's finish)
      st.buildings++;
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
    // the courtyard's wall: a low stone wall round the summit's buildings (their hull, a few metres out), broken where the road comes in
    if (MONA.length >= 3) {
      const pts = MONA.slice(0, 6).map(b => [b.x, b.z]), cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      const R = Math.min(48, Math.max(...pts.map(p => Math.hypot(p[0] - cx, p[1] - cz))) + 12), n = 36;
      for (let k = 0; k < n; k++) {
        const a = (k + 0.5) / n * Math.PI * 2, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, near = vrDist(x, z);
        if (near < 7) continue;
        const y = G(x, z); box(scen.get(x, z), x, y - 0.4, z, 2 * Math.PI * R / n + 0.1, 2.0, 0.6, Math.PI / 2 - a, stone, [0.8, 0.75, 0.66]); st.walls++;
      }
    }
    out.stavrovouni = st;   // (what was built: the tests)
  };

  World.ext.stavrovouni = (scene, tex, opts) => { API.TEX = tex; return API.buildPrelaz(scene, tex, opts, LOOK); };
})();
