/* =========================================================================
   WORLD — Trebević, Bosnia and Herzegovina (docs/proge/trebevic.md): the climb from Dolovi on the south-eastern edge of Sarajevo up the
   forested north slope of Trebević past the Vidikovac viewpoint to the ruin of Draguljac on the ridge, built by the shared world of the
   mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its own (PL_LOOK.trebevic) and its own landmarks (L.pre, L.extra): the old
   concrete bobsleigh track in the forest beside the road (its pieces near the road, from OpenStreetMap's lines: the trough of its finish, its
   double bend, its start), the footbridge over the road, the viewpoint's lay-by, the old quarry's pale limestone face and the low broken
   walls of the ruin on the ridge. The houses are the shared builder's (OpenStreetMap's footprints) under red tiles; the gondola's rope is the
   shared builder's (def.cables). Two narrow lanes, right-hand traffic, the white centre line; the steel guardrails are the shared builder's;
   the car cannot fall (no def.drops). Places from OpenStreetMap (ODbL 1.0); all generic: no names, letters or signs
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { TAU, box, caGround, clamp, rng, vary } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ---- the look: Trebević in early summer (Sentinel-2, 2 July 2025): the dense beech and fir forest of the north slope, the meadows of the
     ridge, pale grey limestone in the cuttings and the quarry, the brown forest earth in the banks; the haze over the Sarajevo basin ---- */
  const LOOK = API.PL_LOOK.trebevic = {
    seed: 4318, board: 'TREBEVIĆ', sub: 'BOSNA I HERCEGOVINA', banner: ['DOLOVI · DRAGULJAC', '813 M → 1114 M · 4.3 KM'],
    grass: [0.34, 0.5, 0.22], grassDry: [0.5, 0.52, 0.3], grassLush: [0.24, 0.46, 0.16], shrub: [0.16, 0.3, 0.12],
    rock: [0.62, 0.61, 0.58], rockWarm: [0.66, 0.62, 0.54], lichen: [0.5, 0.52, 0.46], scree: [0.7, 0.68, 0.64],
    sat: 0.6, satV: 1.2, snowLine: 9000, snowC: [1.0, 1.02, 1.06], bank: [0.42, 0.34, 0.26],   // (the banks: the brown earth of the forest)
    rockCols: [[0.64, 0.63, 0.6], [0.7, 0.68, 0.64], [0.56, 0.55, 0.52], [0.66, 0.6, 0.52], [0.6, 0.6, 0.58], [0.74, 0.72, 0.68]],   // (limestone)
    centre: [0.95, 0.95, 0.92], dash: [3, 9], solidNear: 70,   // (white centre line, World.cesta's default)
    chev: ['#1c1c1c', '#f2d21a'], warn: 'tri', rail: 'steel', shoulder: [0.5, 0.46, 0.4],
    fans: [[0.84, 0.14, 0.14], [0.12, 0.3, 0.62], [0.98, 0.84, 0.12], [0.2, 0.5, 0.32], [0.95, 0.95, 0.95], [0.95, 0.5, 0.14], [0.4, 0.66, 0.82], [0.55, 0.62, 0.7]],
    cars: [[0.9, 0.9, 0.88], [0.62, 0.64, 0.66], [0.2, 0.36, 0.62], [0.66, 0.14, 0.12], [0.78, 0.74, 0.64], [0.36, 0.56, 0.74]],   // (no black or very dark cars)
    roofs: [[0.62, 0.26, 0.18], [0.56, 0.3, 0.22], [0.48, 0.24, 0.2], [0.54, 0.56, 0.58], [0.4, 0.3, 0.26]],   // (red and brown tiles, some sheet metal)
    sheep: 0, portal: 0, far: { lo: [0.16, 0.3, 0.14], hi: [0.4, 0.46, 0.34], dw: [0.12, 0.24, 0.1], snow: 9000 },
  };

  const marks = [];   // (the build under way: [what, x, z, the road's heading, the side, the road's index])
  const VIEW_S = 2862, BRIDGE_S = 2053;   // (metres from the start line: the Vidikovac lay-by; the footbridge over the road)
  // the old bobsleigh track near the road, OpenStreetMap's lines in the track's metres (x east, z as the track's points): its finish (the
  // straight trough that ends by the road at ~1.6 km), its double bend (~2.1 km), its start (~2.5 km)
  const BOB = [
    { pts: [-457.0, 843.1, -446.2, 843.7, -325.2, 849.9], bank: 0 },
    { pts: [-179.7, 1170.0, -189.5, 1170.3, -196.6, 1166.3, -202.0, 1158.2, -203.4, 1149.0, -202.5, 1143.5], bank: 1 },
    { pts: [199.1, 1068.2, 134.3, 1078.3, 118.0, 1080.9, 98.8, 1083.0], bank: 0 },
  ];
  // the ruin of Draguljac on the ridge and the old quarry below the viewpoint: their outlines from OpenStreetMap
  const RUIN = [684.4, 998.0, 690.0, 991.7, 722.0, 1004.4, 699.5, 1028.9, 690.5, 1024.6, 684.4, 998.0];
  const QUARRY = [526.9, 1028.8, 520.9, 1040.8, 523.8, 1048.8, 530.4, 1055.0, 546.3, 1061.9, 563.1, 1057.2, 569.4, 1051.8, 572.7, 1044.5, 572.4, 1034.3, 558.6, 1024.1, 545.2, 1020.6, 534.2, 1023.2, 526.9, 1028.8];

  // a place beside the road at s metres from the start line, o metres beyond the barrier on the side sd (+1 the right): [x, z, heading, sd, i]
  function atS(s, sd, o) {
    const i = T.idx(T.startS + s), bar = sd > 0 ? T.br[i] : T.bl[i], d = sd * (bar + o);
    return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i], sd, i];
  }
  // the distance from (x, z) to the road's centre line (the nearest of its points)
  function roadDist(x, z) { let b = 1e9; for (let i = 0; i < T.px.length; i += 2) { const d = Math.hypot(T.px[i] - x, T.pz[i] - z); if (d < b) b = d; } return b; }
  // walk an outline in steps of about st metres: f(x, z, heading)
  function walk(pts, st, f) {
    for (let k = 0; k + 3 < pts.length; k += 2) {
      const ax = pts[k], az = pts[k + 1], bx = pts[k + 2], bz = pts[k + 3], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / st)), hd = Math.atan2(bz - az, bx - ax);
      for (let q = 0; q < n; q++) { const t = (q + 0.5) / n; f(ax + (bx - ax) * t, az + (bz - az) * t, hd, L / n); }
    }
  }

  /* ---- before the terrain: the viewpoint's level plot on the side the ground falls away ---- */
  LOOK.pre = function ({ P, exclPush }) {
    marks.length = 0;
    const D = P.D, dem = (x, z) => { const i = clamp(Math.round((x - D.x0) / D.cell), 0, D.nx - 1), j = clamp(Math.round((z - D.z0) / D.cell), 0, D.nz - 1); return P.dem[j * D.nx + i]; };
    const low = [-1, 1].map(sd => { const [x, z] = atS(VIEW_S, sd, 30); return dem(x, z); }), sd = low[0] < low[1] ? -1 : 1;
    const [x, z, hd, , i] = atS(VIEW_S, sd, 4.5);
    P.pads.push({ x, z, r: 6, b: 8, h: T.hy[i] - 0.25 }); exclPush(x, z, 8); marks.push(['view', x, z, hd, sd, i]);
    { const [bx, bz, bh, , bi] = atS(BRIDGE_S, 1, 0); marks.push(['bridge', bx, bz, bh, 1, bi]); }
    // the ruin and the quarry keep the forest off them
    for (const pts of [RUIN, QUARRY]) walk(pts, 8, (x2, z2) => exclPush(x2, z2, 6));
  };

  /* ---- the landmarks, after the rest of the road is built ---- */
  LOOK.extra = function ({ scen, out, excluded }) {
    const G = (x, z) => caGround(x, z), R = rng(LOOK.seed + 17);
    const st = { views: 0, bob: 0, bridges: 0, ruin: 0, quarry: 0 };
    const stone = [0.6, 0.58, 0.54], stoneT = [0.68, 0.66, 0.62], conc = [0.66, 0.66, 0.64], concT = [0.76, 0.76, 0.74], lime = [0.74, 0.73, 0.7];
    for (const [what, x, z, hd, sd, i] of marks) {
      const g = scen.get(x, z), c = Math.cos(hd), s = Math.sin(hd), nx = -s * sd, nz = c * sd;   // (nx, nz: the way from the road out to it)
      if (what === 'view') {   // the viewpoint: a paved lay-by beside the road, a low wall of limestone blocks on its outer edge
        const yy = T.hy[i] - 0.25;
        for (let k = -3; k <= 3; k++) { const u = k * 1.6, px = x + c * u + nx * 4.4, pz = z + s * u + nz * 4.4, gy = Math.min(yy, G(px, pz));
          box(g, px, gy - 0.6, pz, 1.7, yy - gy + 1.3, 0.5, hd, stone, stoneT); }
        st.views++;
      } else if (what === 'bridge') {   // the footbridge: two concrete piers beyond the barriers, a deck ~5.6 m over the road, its railings
        const yr = T.hy[i], half = Math.max(T.br[i], T.bl[i]) + 1.6, span = half * 2 + 1.2, top = yr + 5.6;
        for (const q of [-1, 1]) { const px = T.px[i] + T.nx[i] * q * half, pz = T.pz[i] + T.nz[i] * q * half, gy = G(px, pz);
          box(g, px, Math.min(gy, yr) - 0.5, pz, 1.2, top - Math.min(gy, yr) + 0.5, 1.6, hd, conc, concT); }
        const nh = Math.atan2(T.nz[i], T.nx[i]);   // (the deck across the road)
        box(g, T.px[i], top, T.pz[i], span, 0.45, 2.0, nh, conc, concT);
        for (const q of [-1, 1]) box(g, T.px[i] + c * q * 0.95, top + 0.45, T.pz[i] + s * q * 0.95, span, 1.0, 0.08, nh, [0.5, 0.52, 0.54]);
        st.bridges++;
      }
      out.marks[what] = (out.marks[what] || 0) + 1;
    }

    // the bobsleigh track: a concrete trough (its floor, its two walls; the walls of the double bend higher, its outer wall tilted in), on the
    // ground of the forest, its pieces that cross the road's corridor left out
    for (const b of BOB) walk(b.pts, 3, (x, z, hd, len) => {
      if (roadDist(x, z) < 9 || excluded(x, z) && roadDist(x, z) < 14) return;
      const g = scen.get(x, z), gy = G(x, z), c = Math.cos(hd), s = Math.sin(hd), wall = b.bank ? 1.6 : 0.9;
      box(g, x, gy - 0.3, z, len + 0.05, 0.45, 1.8, hd, conc, concT);
      for (const q of [-1, 1]) box(g, x - s * q * 1.05, gy - 0.3, z + c * q * 1.05, len + 0.05, wall + 0.3 + (b.bank && q > 0 ? 0.5 : 0), 0.22, hd, vary(conc, R, 0.06), concT);
      st.bob++;
    });

    // the ruin of Draguljac: low broken walls of grey limestone along its outline, a corner standing higher
    walk(RUIN, 2.2, (x, z, hd, len) => {
      if (R() < 0.18) return;   // (the gaps of the fallen wall)
      const g = scen.get(x, z), gy = G(x, z), h = 1.2 + R() * 2.4 + (R() < 0.08 ? 2.5 : 0);
      box(g, x, gy - 0.4, z, len + 0.1, h + 0.4, 1.1, hd, vary(stone, R, 0.1), stoneT); st.ruin++;
    });

    // the old quarry: its pale limestone face, blocks of different heights round the pit, a few loose blocks on its floor
    walk(QUARRY, 3, (x, z, hd, len) => {
      const g = scen.get(x, z), gy = G(x, z), h = 3 + R() * 6;
      box(g, x, gy - 1, z, len + 0.6, h + 1, 2.4 + R() * 2, hd + (R() - 0.5) * 0.3, vary(lime, R, 0.08), vary([0.56, 0.6, 0.48], R, 0.08)); st.quarry++;
    });
    { const cx = 548, cz = 1041, g = scen.get(cx, cz);
      for (let k = 0; k < 7; k++) { const a = R() * TAU, r = R() * 12, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, w = 0.8 + R() * 1.6;
        box(g, x, G(x, z) - 0.2, z, w, w * (0.6 + R() * 0.5), w * (0.7 + R() * 0.6), R() * TAU, vary(lime, R, 0.1)); } }
    out.trebevic = st;   // (what was built: the tests)
  };

  World.ext.trebevic = (scene, tex, opts) => { API.TEX = tex; return API.buildPrelaz(scene, tex, opts, LOOK); };
})();
