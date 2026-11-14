/* =========================================================================
   WORLD — Jebel Hafeet, United Arab Emirates (docs/proge/hafit.md): the climb up the bare limestone ridge above the desert plain, built by the
   shared world of the mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its own (PL_LOOK.hafit) and its own landmarks (L.pre,
   L.extra): the tall street lamps along the whole climb on the median's side, the flat-roofed houses (OpenStreetMap's footprints, in place of
   the shared builder's huts), a few acacias low down on the gravel, the viewpoint high on the climb. The road: the uphill carriageway of the
   divided road, two lanes; the Emirates' markings (the left edge by the median yellow, the right edge white, the lane line white and dashed).
   The steel guardrails are the shared builder's; the car cannot fall (no def.drops). Places from OpenStreetMap (ODbL 1.0); all generic: no
   names, letters or signs
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { GB, IChunks, TAU, box, caGround, caSlope, clamp, cyl, rng, vary, vrDist, vrNear } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ---- the look: Jebel Hafeet in late autumn: the pale limestone of the ridge, beige, cream and grey, the brown scree and the gravel below, no
     forest, a few dry shrubs; the desert's haze in the distance ---- */
  const LOOK = API.PL_LOOK.hafit = {
    seed: 7210, board: 'JEBEL HAFEET', sub: 'UAE', banner: ['FOOT · SUMMIT', '376 M → 769 M · 4.8 KM'],
    grass: [0.6, 0.53, 0.41], grassDry: [0.66, 0.58, 0.45], grassLush: [0.5, 0.47, 0.33], shrub: [0.4, 0.38, 0.26],
    rock: [0.66, 0.6, 0.51], rockWarm: [0.72, 0.62, 0.48], lichen: [0.6, 0.56, 0.49], scree: [0.64, 0.56, 0.45],
    sat: 0.55, satV: 1.12, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.7, 0.64, 0.54], [0.76, 0.68, 0.56], [0.62, 0.58, 0.52], [0.78, 0.66, 0.5], [0.64, 0.55, 0.45], [0.72, 0.68, 0.61]],   // (the limestone: cream, beige, grey, the rust of the weathered faces)
    centre: [0.95, 0.95, 0.92], dash: [3, 9], solidNear: 40, edgeL: [0.95, 0.76, 0.12],   // (the lane line white, dashed 3 m / 9 m; the left edge by the median yellow)
    chev: ['#16161a', '#f2c418'], warn: 'tri', rail: 'steel', shoulder: [0.66, 0.6, 0.5],
    fans: [[0.95, 0.95, 0.94], [0.92, 0.9, 0.84], [0.3, 0.32, 0.36], [0.62, 0.12, 0.12], [0.18, 0.4, 0.3], [0.78, 0.7, 0.55], [0.2, 0.26, 0.5], [0.55, 0.5, 0.42]],
    cars: [[0.94, 0.94, 0.93], [0.78, 0.79, 0.8], [0.9, 0.9, 0.88], [0.16, 0.16, 0.18], [0.72, 0.66, 0.55], [0.5, 0.52, 0.55]],
    roofs: [[0.84, 0.8, 0.72], [0.78, 0.74, 0.67], [0.88, 0.85, 0.79]],   // (the flat roofs' concrete: the shared builder's huts are taken over)
    sheep: 0, portal: 0,
    // (the far view: the pale ridge, the gravel plains and the dunes' sand round it, no forest, no snow, no water)
    far: { lo: [0.7, 0.6, 0.46], hi: [0.7, 0.64, 0.55], dw: [0.66, 0.58, 0.44], snow: 9000, tree: [9500, 9400], fc: [0.56, 0.5, 0.38], dwb: [9000, 9100, 9800, 9700], rk: [120, 600] },
  };

  const marks = [];   // (the build under way: [what, x, z, the road's heading, the side, the road's index])
  let HOUSES = [], LC0 = null;   // (OpenStreetMap's buildings, taken from the shared builder; the land cover as the data has it)
  const VIEW_S = 3750, LAMP_GAP = 42;   // (metres from the start line: the viewpoint; the street lamps' spacing)

  // a place beside the road at s metres from the start line, o metres beyond the barrier on the side sd (+1 the right): [x, z, heading, sd, i]
  function atS(s, sd, o) {
    const i = T.idx(T.startS + s), bar = sd > 0 ? T.br[i] : T.bl[i], d = sd * (bar + o);
    return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i], sd, i];
  }

  /* ---- before the terrain: the forest and the snow of the land cover (there is none: noise in the data) left to the shrubs and the rock, the
     shared builder's huts taken over (the flat-roofed houses: L.extra), the viewpoint's level plot on the side the ground falls away ---- */
  LOOK.pre = function ({ P, exclPush, blds }) {
    marks.length = 0; HOUSES = blds.splice(0, blds.length);
    const lc = P.lc; LC0 = Uint8Array.from(lc);
    for (let k = 0; k < lc.length; k++) { if (lc[k] === 1) lc[k] = 2; else if (lc[k] === 6) lc[k] = 4; }
    const D = P.D, dem = (x, z) => { const i = clamp(Math.round((x - D.x0) / D.cell), 0, D.nx - 1), j = clamp(Math.round((z - D.z0) / D.cell), 0, D.nz - 1); return P.dem[j * D.nx + i]; };
    const low = [-1, 1].map(sd => { const [x, z] = atS(VIEW_S, sd, 30); return dem(x, z); }), sd = low[0] < low[1] ? -1 : 1;
    const [x, z, hd, , i] = atS(VIEW_S, sd, 4.5);
    P.pads.push({ x, z, r: 6, b: 8, h: T.hy[i] - 0.25 }); exclPush(x, z, 8); marks.push(['view', x, z, hd, sd, i]);
  };

  function lampGeo() {   // a street lamp of the climb, in metres, its arm along +x: a tapered grey pole ~10 m, a short arm, a flat head
    const g = new GB(), grey = [0.62, 0.63, 0.64], dark = [0.3, 0.31, 0.33];
    box(g, 0, -0.3, 0, 0.5, 0.5, 0.5, 0, [0.7, 0.68, 0.64]);
    cyl(g, 0, 0.2, 0, 0.11, 9.8, 6, grey, grey, 0.07);
    box(g, 0.9, 9.75, 0, 1.9, 0.1, 0.1, 0, grey);
    box(g, 1.9, 9.6, 0, 0.7, 0.16, 0.3, 0, dark, [0.92, 0.9, 0.82]);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function acaciaGeo() {   // an acacia of the gravel: a short forked trunk under a wide flat crown of grey-green (~80 faces)
    const b = new API.AB(), R = rng(7217), col = [0.38, 0.41, 0.25];
    API.aTrunk(b, 0, -0.02, 0, 0.04, 0.5, 5, [0.44, 0.38, 0.31]);
    for (const [x, y, z, r, sy] of [[0, 0.74, 0, 0.42, 0.32], [0.3, 0.68, 0.12, 0.3, 0.34], [-0.28, 0.7, -0.14, 0.32, 0.34], [0.06, 0.66, -0.3, 0.28, 0.36]])
      API.aPuff(b, x, y, z, r, sy, vary(col, R, 0.08), R, 0.3, 0.5, 1.1);
    return b.geometry();
  }

  /* ---- the landmarks, the houses, the lamps and the plants, after the rest of the road is built ---- */
  LOOK.extra = function ({ scen, root, out, P, excluded, matV }) {
    const G = (x, z) => caGround(x, z), dens = Math.min(1, LOD.dens != null ? LOD.dens : 1), sFin = T.finishS, y0 = T.hy[T.idx(T.startS)];
    const st = { houses: 0, windows: 0, tanks: 0, lamps: 0, acacias: 0, views: 0 };
    const lime = [0.88, 0.84, 0.76], stoneP = [0.7, 0.63, 0.52];
    const lcAt = (x, z) => { const L = P.L, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell); return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? 0 : LC0[j * L.nx + i]; };
    for (const [what, x, z, hd, sd, i] of marks) {
      const g = scen.get(x, z), c = Math.cos(hd), s = Math.sin(hd), nx = -s * sd, nz = c * sd;   // (nx, nz: the way from the road out to it)
      if (what === 'view') {   // the viewpoint: a paved lay-by beside the road, a low limestone parapet on its outer edge, a shade of two posts and a flat roof
        const yy = T.hy[i] - 0.25;
        for (let k = -3; k <= 3; k++) { const u = k * 1.6, px = x + c * u + nx * 4.4, pz = z + s * u + nz * 4.4;
          box(g, px, Math.min(yy, G(px, pz)) - 0.6, pz, 1.7, yy - Math.min(yy, G(px, pz)) + 1.4, 0.45, hd, lime, stoneP); }
        for (const u of [-1.8, 1.8]) box(g, x + c * u + nx * 1.5, yy, z + s * u + nz * 1.5, 0.14, 2.5, 0.14, hd, [0.5, 0.5, 0.52]);
        box(g, x + nx * 1.5, yy + 2.5, z + nz * 1.5, 4.4, 0.12, 2.6, hd, [0.86, 0.84, 0.78], [0.72, 0.7, 0.66]);
        st.views++;
      }
      out.marks[what] = (out.marks[what] || 0) + 1;
    }

    // the houses: OpenStreetMap's footprints, flat-roofed blocks of rendered concrete in sand and white on a plinth down the slope, a parapet
    // round the roof, a water tank on some, the small dark windows of those near the road
    {
      const RB = rng(LOOK.seed + 21), WALL = [[0.9, 0.86, 0.77], [0.94, 0.92, 0.87], [0.86, 0.78, 0.64], [0.88, 0.8, 0.66], [0.92, 0.9, 0.84]];
      for (const b of HOUSES) {
        const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang), d = vrDist(b.x, b.z); let lo = 1e9, hi = -1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const yq = G(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, yq); hi = Math.max(hi, yq); }
        const area = b.L * b.W, fl = b.h > 0 ? clamp(Math.round(b.h / 3.2), 1, 3) : area > 200 && RB() < 0.5 ? 2 : 1, H = fl * 3.2;
        const wc = vary(WALL[Math.floor(RB() * WALL.length)], RB, 0.03), rc = vary(LOOK.roofs[Math.floor(RB() * LOOK.roofs.length)], RB, 0.04);
        box(g, b.x, lo - 0.6, b.z, b.L + 0.2, hi - lo + 1.0, b.W + 0.2, b.ang, [0.66, 0.6, 0.5], null, true);
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

    // the street lamps: the whole climb is lit, a tall lamp every ~42 m just beyond the left barrier (the median's side), its arm over the road;
    // the acacias: sparse, low down on the gravel and the shrubs' cells, off the steep faces; instanced per 160 m chunk
    {
      const tl = new IChunks(lampGeo(), matV, 160), ta = new IChunks(acaciaGeo(), matV, 160), RT = rng(LOOK.seed + 61);
      for (let s = -60; s < sFin - T.startS + 120; s += LAMP_GAP) {
        const [x, z, , sd, i] = atS(s, -1, 0.9), n = vrNear(x, z);
        if (n.i >= 0 && n.dd < 1.2) continue;
        tl.add(x, G(x, z), z, Math.atan2(sd * T.nz[i], -sd * T.nx[i]), 1, 1, [1, 1, 1]); st.lamps++;   // (rotation.y a: +x to (cos a, -sin a), the arm toward the road)
      }
      const maxA = Math.round(300 * dens);
      for (let s = Math.max(6, T.startS - 150); s < Math.min(T.len - 6, sFin + 150) && st.acacias < maxA; s += 6) {
        const i = T.idx(s);
        for (const sd of [-1, 1]) {
          if (RT() > 0.1) continue;
          const o = (sd > 0 ? T.br[i] : T.bl[i]) + 4 + RT() * 60, x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o, y = G(x, z), c = lcAt(x, z);
          if (!(c === 0 || c === 2 || (c === 7 && RT() < 0.4)) || y > y0 + 140 || caSlope(x, z) > 0.45 || excluded(x, z)) continue;
          const n = vrNear(x, z); if (n.i >= 0 && n.dd < 3.5) continue;
          const r = RT(), h = 2.6 + r * 2.4; ta.add(x, y - 0.15, z, r * TAU, h * (1.3 + RT() * 0.3), h, [0.92 + r * 0.16, 0.95 + RT() * 0.08, 0.9]); st.acacias++;
        }
      }
      tl.addTo(root, true); ta.addTo(root, true);
    }
    out.hafit = st;   // (what was built: the tests)
  };

  World.ext.hafit = (scene, tex, opts) => { API.TEX = tex; return API.buildPrelaz(scene, tex, opts, LOOK); };
})();
