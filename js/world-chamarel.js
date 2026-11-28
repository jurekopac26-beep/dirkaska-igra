/* =========================================================================
   WORLD — Chamarel, Mauritius (docs/proge/chamarel.md): the climb from the coast above Case Noyale up the green wall of the south-western
   highlands to the plateau of Chamarel, built by the shared world of the mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its
   own (PL_LOOK.chamarel) and its own landmarks (L.pre, L.extra): the viewpoint at the top of the climb (a paved lay-by, a low parapet of dark
   basalt on the side the ground falls away to the coast), the sugar cane on the open ground round the village of Chamarel. The houses are the
   shared builder's (OpenStreetMap's footprints) under the corrugated iron of the look's roofs. The road: two narrow lanes, left-hand traffic
   (def.leftHand), the white centre line; the steel guardrails are the shared builder's; the car cannot fall (no def.drops). Places from
   OpenStreetMap (ODbL 1.0); all generic: no names, letters or signs
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { GB, IChunks, TAU, box, caGround, caSlope, clamp, rng, vary, vrNear } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ---- the look: the south-west of Mauritius in the dry season's end (Sentinel-2, 4 September 2025): the dense, dark-green forest of the
     slopes, the brighter green of the cane and the grass round the village, the red-brown volcanic earth in the banks and the cuttings, dark
     basalt; the trade-wind clouds over the plateau, the sea's haze below ---- */
  const LOOK = API.PL_LOOK.chamarel = {
    seed: 7810, board: 'CHAMAREL', sub: 'MAURITIUS', banner: ['CASE NOYALE · CHAMAREL', '34 M → 373 M · 5.0 KM'], trop: 1,
    grass: [0.3, 0.5, 0.18], grassDry: [0.46, 0.5, 0.26], grassLush: [0.2, 0.45, 0.14], shrub: [0.12, 0.28, 0.1],
    rock: [0.3, 0.29, 0.28], rockWarm: [0.5, 0.33, 0.24], lichen: [0.32, 0.34, 0.27], scree: [0.52, 0.36, 0.26],
    sat: 0.55, satV: 1.28, snowLine: 9000, snowC: [1.0, 1.02, 1.06], bank: [0.55, 0.32, 0.22],   // (the banks: the red-brown earth of the weathered basalt)
    rockCols: [[0.28, 0.28, 0.28], [0.34, 0.33, 0.32], [0.24, 0.24, 0.25], [0.5, 0.34, 0.26], [0.32, 0.31, 0.3], [0.44, 0.3, 0.24]],   // (basalt, reddened by the soil)
    centre: [0.95, 0.95, 0.92], dash: [3, 9], solidNear: 70,   // (white centre line, World.cesta's default: the country's markings not in its table (no source))
    chev: ['#1c1c1c', '#f2d21a'], warn: 'tri', rail: 'steel', shoulder: [0.52, 0.4, 0.32],
    fans: [[0.84, 0.14, 0.14], [0.12, 0.3, 0.62], [0.98, 0.84, 0.12], [0.2, 0.5, 0.32], [0.95, 0.95, 0.95], [0.95, 0.5, 0.14], [0.4, 0.66, 0.82], [0.55, 0.62, 0.7]],
    cars: [[0.9, 0.9, 0.88], [0.62, 0.64, 0.66], [0.2, 0.36, 0.62], [0.66, 0.14, 0.12], [0.78, 0.74, 0.64], [0.36, 0.56, 0.74]],   // (no black or very dark cars)
    roofs: [[0.54, 0.56, 0.58], [0.62, 0.24, 0.18], [0.24, 0.38, 0.52], [0.32, 0.46, 0.32], [0.74, 0.74, 0.72]],   // (corrugated iron: bare, red, blue, green; the flat concrete)
    sheep: 0, portal: 0, far: { lo: [0.14, 0.3, 0.12], hi: [0.26, 0.38, 0.22], dw: [0.1, 0.24, 0.1], snow: 9000 },
  };

  const marks = [];   // (the build under way: [what, x, z, the road's heading, the side, the road's index])
  const VIEW_S = 2900, CANE = [[3050, 3900], [4000, 4450]];   // (metres from the start line: the viewpoint; the stretches with the cane round the village)

  // a place beside the road at s metres from the start line, o metres beyond the barrier on the side sd (+1 the right): [x, z, heading, sd, i]
  function atS(s, sd, o) {
    const i = T.idx(T.startS + s), bar = sd > 0 ? T.br[i] : T.bl[i], d = sd * (bar + o);
    return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i], sd, i];
  }

  /* ---- before the terrain: the viewpoint's level plot on the side the ground falls away ---- */
  LOOK.pre = function ({ P, exclPush }) {
    marks.length = 0;
    const D = P.D, dem = (x, z) => { const i = clamp(Math.round((x - D.x0) / D.cell), 0, D.nx - 1), j = clamp(Math.round((z - D.z0) / D.cell), 0, D.nz - 1); return P.dem[j * D.nx + i]; };
    const low = [-1, 1].map(sd => { const [x, z] = atS(VIEW_S, sd, 30); return dem(x, z); }), sd = low[0] < low[1] ? -1 : 1;
    const [x, z, hd, , i] = atS(VIEW_S, sd, 4.5);
    P.pads.push({ x, z, r: 6, b: 8, h: T.hy[i] - 0.25 }); exclPush(x, z, 8); marks.push(['view', x, z, hd, sd, i]);
  };

  function caneGeo() {   // a clump of sugar cane, in metres: ~14 tall stalks, a little splayed, green below, the leaves paler at the tips (~170 faces)
    const g = new GB(), R = rng(7817);
    for (let k = 0; k < 14; k++) {
      const a = R() * TAU, r = 0.15 + R() * 0.5, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 2.4 + R() * 1.4, lean = (R() - 0.5) * 0.25;
      box(g, x, 0, z, 0.06, h, 0.06, a, vary([0.44, 0.52, 0.24], R, 0.06));
      box(g, x + lean, h - 0.2, z, 0.9 + R() * 0.5, 0.05, 0.16, a + 0.8, vary([0.36, 0.56, 0.2], R, 0.06), vary([0.58, 0.66, 0.32], R, 0.05));
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  /* ---- the viewpoint and the cane, after the rest of the road is built ---- */
  LOOK.extra = function ({ scen, root, out, P, excluded, matV }) {
    const G = (x, z) => caGround(x, z), dens = Math.min(1, LOD.dens != null ? LOD.dens : 1);
    const st = { views: 0, cane: 0 }, basalt = [0.3, 0.29, 0.28], basaltT = [0.38, 0.36, 0.34];
    for (const [what, x, z, hd, sd, i] of marks) {
      const g = scen.get(x, z), c = Math.cos(hd), s = Math.sin(hd), nx = -s * sd, nz = c * sd;   // (nx, nz: the way from the road out to it)
      if (what === 'view') {   // the viewpoint: a paved lay-by beside the road, a low parapet of dark basalt blocks on its outer edge
        const yy = T.hy[i] - 0.25;
        for (let k = -3; k <= 3; k++) { const u = k * 1.6, px = x + c * u + nx * 4.4, pz = z + s * u + nz * 4.4, gy = Math.min(yy, G(px, pz));
          box(g, px, gy - 0.6, pz, 1.7, yy - gy + 1.3, 0.5, hd, basalt, basaltT); }
        st.views++;
      }
      out.marks[what] = (out.marks[what] || 0) + 1;
    }

    // the sugar cane: clumps on the open ground (the land cover's grass and crops) a few metres off the road round the village, off the steep
    // slopes; instanced per 160 m chunk
    {
      const tc = new IChunks(caneGeo(), matV, 160), RT = rng(LOOK.seed + 61), L = P.L, maxC = Math.round(900 * dens);
      const lcAt = (x, z) => { const i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell); return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? -1 : P.lc[j * L.nx + i]; };
      for (const [a, b] of CANE) for (let s = a; s < b && st.cane < maxC; s += 4) {
        const i = T.idx(T.startS + s);
        for (const sd of [-1, 1]) {
          if (RT() > 0.55) continue;
          const o = (sd > 0 ? T.br[i] : T.bl[i]) + 5 + RT() * 45, x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o;
          if (lcAt(x, z) !== 0 || caSlope(x, z) > 0.3 || excluded(x, z)) continue;
          const n = vrNear(x, z); if (n.i >= 0 && n.dd < 4) continue;
          const r = RT(); tc.add(x, G(x, z) - 0.1, z, r * TAU, 0.9 + RT() * 0.3, 0.85 + r * 0.3, [0.92 + RT() * 0.12, 0.95 + RT() * 0.08, 0.9]); st.cane++;
        }
      }
      tc.addTo(root, true);
    }
    out.chamarel = st;   // (what was built: the tests)
  };

  World.ext.chamarel = (scene, tex, opts) => { API.TEX = tex; return API.buildPrelaz(scene, tex, opts, LOOK); };
})();
