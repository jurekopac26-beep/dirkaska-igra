/* =========================================================================
   WORLD — Viñales, Kuba (theme 'vinales'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra. Made by tools/nova-proga.mjs (the style from tools/predogled/proge.json).
   The landmark is the mogotes, the steep limestone towers of the valley: all of it in mogotes() below, one replaceable function (a model from
   assets/landmarks/ can take its place: S.extra and S.clear are all the builder knows of it). No mural, no inscriptions, no names.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore || !World.api) return;
  const API = World.api;

  /* ---------------- the mogotes ----------------
     [x, z, r, top]: the towers' centres and radii (metres, the track's flat world: x east, z south from the start) and their tops (metres above the
     sea), measured from Copernicus GLO-30 along the race: the massif on the east side from ~47 % to ~88 % of the race (its foot 28-45 m from
     the road's centre; three towers by the road itself, their foot ~14 m from the centre at ~51, ~61 and ~68 %, as the chase camera sees
     ~25 m to the side), the lower one on the west side from ~58 % to ~80 %; the first 600 m (the main road and the valley floor) have none. A tower: near-vertical walls of grey limestone streaked dark, with
     green on the ledges and a rounded top under forest. */
  const MOGOTES = [[21, -472, 13, 193], [141, -462, 34, 226], [61, -482, 34, 228], [21, -492, 10, 193], [111, -512, 34, 252], [21, -512, 12, 232],
    [51, -542, 34, 252], [141, -562, 34, 285], [2, -549, 15, 248], [91, -592, 34, 272], [1, -582, 12, 243], [31, -612, 34, 254], [-9, -602, 11, 243],
    [61, -662, 34, 268], [-19, -632, 14, 230], [-219, -562, 34, 186], [-29, -652, 12, 228], [1, -682, 34, 259], [-48, -668, 15, 239], [-219, -622, 34, 183],
    [31, -732, 34, 270], [-49, -702, 13, 223], [-29, -742, 34, 256], [41, -792, 34, 270], [-69, -732, 10, 222], [-19, -802, 34, 253], [-98, -754, 13, 190],
    [-219, -682, 34, 193], [-79, -802, 34, 212], [-19, -862, 34, 243], [-279, -682, 34, 215], [-219, -742, 34, 201], [-79, -862, 34, 217], [-279, -742, 34, 212],
    [-219, -792, 21, 172], [-269, -802, 34, 183], [-99, -922, 34, 182], [-329, -802, 34, 174], [-119, -982, 34, 176], [-129, -1042, 34, 177]];
  const TS = [0, 0.14, 0.3, 0.46, 0.6, 0.71, 0.8, 0.88, 0.94, 0.98];   // the rings' heights (share of the tower's height)
  const NS = 14;   // sides
  const ROCK = [0.8, 0.79, 0.73], STREAK = [0.5, 0.49, 0.45], GREEN = [0.22, 0.34, 0.15], GREEN2 = [0.32, 0.42, 0.2], FOOT = [0.36, 0.38, 0.24];
  const prof = (t) => (t < 0.6 ? 1 + 0.05 * Math.sin(Math.PI * t / 0.6) : Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.6) / 0.4, 2))) * 0.97 + 0.03);

  function mogotes(ctx) {
    const { scen, P } = ctx, { vrGround, sstep, lerp, TAU, rpHash } = API, base = P.D.base;
    let n = 0;
    MOGOTES.forEach(([cx, cz, r, top], m) => {
      const ph = [rpHash(m, 1) * TAU, rpHash(m, 2) * TAU, rpHash(m, 3) * TAU], ang = (a) => 1 + 0.12 * Math.sin(a * 2 + ph[0]) + 0.08 * Math.sin(a * 3 + ph[1]) + 0.05 * Math.sin(a * 5 + ph[2]);
      let y0 = 1e9; for (let i = 0; i < NS; i++) { const a = i / NS * TAU; y0 = Math.min(y0, vrGround(cx + Math.cos(a) * r, cz + Math.sin(a) * r)); }
      y0 -= 4; const h = Math.max(20, top - base - y0);
      // the grid of points (ring k, side i) and the apex
      const V = TS.map((t, k) => { const y = y0 + h * t, f = prof(t); return Array.from({ length: NS }, (_, i) => { const a = i / NS * TAU, rr = r * f * ang(a) * (1 + (k > 0 ? (rpHash(m * 31 + k, i) - 0.5) * 0.1 : 0));
        return [cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr]; }); });
      const apex = [cx, y0 + h, cz], K = TS.length;
      const pt = (k, i) => (k >= K ? apex : V[k][((i % NS) + NS) % NS]);
      const nrm = (k, i) => {   // smooth normal: across the ring and up the wall
        const a = pt(k, i - 1), b = pt(k, i + 1), u = pt(Math.min(k + 1, K), i), d = pt(Math.max(k - 1, 0), i);
        const tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2], vx = u[0] - d[0], vy = u[1] - d[1], vz = u[2] - d[2];
        let nx = ty * vz - tz * vy, ny = tz * vx - tx * vz, nz = tx * vy - ty * vx; const p = pt(k, i);
        if (nx * (p[0] - cx) + nz * (p[2] - cz) < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const l = Math.hypot(nx, ny, nz) || 1; return [nx / l, ny / l, nz / l]; };
      const col = (k, i, ny) => {   // limestone with dark streaks down the wall, green on the ledges, the forest on the top, the foot in scrub
        const t = k >= K ? 1 : TS[k], s = rpHash(m * 17 + i, 5), dark = sstep(0.55, 0.85, s) * 0.8;
        let c = [lerp(ROCK[0], STREAK[0], dark), lerp(ROCK[1], STREAK[1], dark), lerp(ROCK[2], STREAK[2], dark)];
        const g = Math.max(sstep(0.3, 0.6, ny), sstep(0.6, 0.72, t), rpHash(m * 13 + k, i) < 0.3 ? 0.8 : 0), gc = rpHash(m, i + k) < 0.5 ? GREEN : GREEN2;
        c = [lerp(c[0], gc[0], g), lerp(c[1], gc[1], g), lerp(c[2], gc[2], g)];
        if (k === 0) c = [lerp(c[0], FOOT[0], 0.7), lerp(c[1], FOOT[1], 0.7), lerp(c[2], FOOT[2], 0.7)];
        const v = 0.92 + rpHash(m * 7 + k, i * 3) * 0.14; return [c[0] * v, c[1] * v, c[2] * v]; };
      const N = [], C = [];
      for (let k = 0; k <= K; k++) { N[k] = []; C[k] = []; for (let i = 0; i < NS; i++) { N[k][i] = k >= K ? [0, 1, 0] : nrm(k, i); C[k][i] = col(k, i, N[k][i][1]); } }
      const g = scen.get(cx, cz), inn = [cx, y0 + h * 0.4, cz];
      for (let k = 0; k < K; k++) for (let i = 0; i < NS; i++) {
        const j = (i + 1) % NS;
        if (k + 1 < K) { g.triON(pt(k, i), pt(k + 1, i), pt(k + 1, j), N[k][i], N[k + 1][i], N[k + 1][j], inn, C[k][i], C[k + 1][i], C[k + 1][j]);
          g.triON(pt(k, i), pt(k + 1, j), pt(k, j), N[k][i], N[k + 1][j], N[k][j], inn, C[k][i], C[k + 1][j], C[k][j]); }
        else g.triON(pt(k, i), apex, pt(k, j), N[k][i], [0, 1, 0], N[k][j], inn, C[k][i], C[K][0], C[k][j]);
      }
      n++;
    });
    ctx.out.mogotes = n;   // (out.stats is made after S.extra)
  }

  World.ext.vinales = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1717, snow: 'none',
    road: { line: 'white' },
    trees: { kinds: ['broad', 'palm'], forest: 0.2 },
    skiers: 0, nets: false, snowbanks: false, lifts: false,
    animals: [],
    clear: MOGOTES.map(([x, z, r]) => [x, z, r * 0.95]),
    extra: mogotes,
  });
})();
