/* ===================================================================================================================================
   WORLD — Tapini, Papua New Guinea: the roadside, laid over the gore world js/world-tapini.js builds
   -----------------------------------------------------------------------------------------------------------------------------------
   Sources (read 24. 11. 2026):
     OpenStreetMap, bbox 146.950, -8.432, 146.967, -8.417: by this stretch it has only the road itself (w404374087, w1386953680:
     highway=secondary, surface=dirt), the river in the valley (w1386953679, waterway=river) and one isolated dwelling
     (n14139962953). No fence, sign, marker post, power line, path, culvert or building is mapped at the road, so none is drawn.
     Copernicus GLO-30 (the track's own def.dem, 32 m grid): the lines the water runs down the slope on. Followed downhill from 70 m
     up the slope every 6 m of the road, the lines gather into four hollows, which reach the road 112, 164, 296 and 432 m from the
     start (7 to 11 of the lines each).
   Drawn: those four washes: a bed of gravel and stones about 2 to 4 m wide down the last 40 m or so of the slope to the road, wider
     at its foot, and on from the far edge of the road some 25 m down the drop; no trees on it. Where they are is the height
     model's; how they look (width, stones) is assumed: neither source says.
   Not drawn: anything across the road itself (a culvert or a ford: no source says which), the river (208 to 300 m from the road and
     some 150 m below it: past where this world's ground is drawn) and the dwelling (600 m away).
   How: World.ext.tapini is wrapped; while it runs, World.gore.build gets this file's keepOut (no trees on the washes) and extra (the
     meshes: one see-through mesh for the beds, the stones in the world's own scenery chunks) after its own. Everything is beyond
     the barrier line (2 m past it at the nearest), nothing collides: driving, physics and def.hills are unchanged; js/world-tapini.js
     and js/tracks/tapini.js are not changed.
   Data: © OpenStreetMap contributors, ODbL 1.0; Copernicus DEM GLO-30 (README.md, »Zasluge«)
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.gore || !World.ext || typeof World.ext.tapini !== 'function') return;
  const API = World.api, { GB, clamp, rock, vrGround, vrNear } = API;

  // ---- the data: x east, z south, metres from the track's origin; flat x, z lists running downhill ----
  // up: down the slope to the road (its left); dn: from the road's far edge down the drop
  const WASHES = [
    { up: [92.8, -80.6, 94.6, -77.1, 96, -73.3, 97, -69.4, 97.8, -65.5, 98.3, -61.5, 98.6, -57.6, 99, -53.6, 99.3, -49.6, 99.7, -45.6, 100.2, -41.6, 100.7, -37.7],
      dn: [99.8, -30, 100.6, -26.1, 101.4, -22.2, 102.3, -18.3, 103.2, -14.4, 104.1, -10.5, 105.2, -6.6, 106.2, -2.8] },   // 112 m
    { up: [148.4, -75.2, 148.6, -71.2, 148.9, -67.3, 149.2, -63.3, 149.4, -59.3, 149.6, -55.3, 149.9, -51.3, 150.1, -47.3, 150.3, -43.3, 150.5, -39.3, 150.8, -35.3, 151, -31.3],
      dn: [151.9, -23.9, 152, -19.9, 152, -15.9, 151.9, -11.9, 151.7, -7.9, 151.5, -3.9, 151.2, 0.1, 150.8, 4.1] },   // 164 m
    { up: [215.1, -112.9, 218.4, -110.5, 221.6, -108.1, 224.9, -105.9, 228.4, -104.1, 232, -102.3, 235.7, -100.7, 239.3, -99.1, 243, -97.5, 246.7, -95.9, 250.4, -94.4, 254.1, -93],
      dn: [261.3, -92.5, 265.1, -91.2, 268.9, -90, 272.8, -88.9, 276.6, -87.8, 280.5, -86.9, 284.4, -86.1, 288.4, -85.3] },   // 296 m
    { up: [187.8, -185.5, 191.1, -187.8, 194.6, -189.7, 198.1, -191.8, 201.1, -194.4, 203.8, -197.3, 206.4, -200.4, 209, -203.4, 211.6, -206.4, 214.2, -209.4, 216.9, -212.5, 219.5, -215.5],
      dn: [225.9, -220.3, 228.6, -223.3, 231.4, -226.2, 234.4, -228.8, 237.5, -231.3, 240.6, -233.9, 243.7, -236.4, 246.8, -238.9] } ];   // 432 m
  const STEP = 1.25, CLEAR = 2.0, FADE = 7, EDGE = 0.7;   // rows apart; metres kept past the barrier line; the far ends' fade; the soft edge
  const BED = [0.66, 0.53, 0.4], WET = [0.43, 0.34, 0.27], STONE = [[0.6, 0.57, 0.52], [0.55, 0.5, 0.44], [0.66, 0.61, 0.53], [0.5, 0.47, 0.43]];
  const CO = World.tapiniObcestje = { keepOut, extra, stats: null };

  // ---- helpers (their own numbers: the world's random sequence stays as it was) ----
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const sm = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const resample = (L, step) => {
    const out = [L[0], L[1]];
    for (let q = 0; q + 3 < L.length; q += 2) {
      const ax = L[q], az = L[q + 1], bx = L[q + 2], bz = L[q + 3], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
      for (let t = 1; t <= m; t++) out.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
    }
    return out;
  };
  // a wash's rows: the points STEP apart that are CLEAR past the barrier line, each with its normal, its metres from the road's end
  // of the part (r) and from its far end (f), and its half width (wider at the road, where the slope eases and the wash spreads)
  const rowsOf = (L, toRoad, gi) => {
    const Q = resample(L, STEP), n = Q.length / 2, T = API.T, R = [];
    for (let k = 0; k < n; k++) {
      const x = Q[2 * k], z = Q[2 * k + 1], nr = vrNear(x, z);
      if (nr.i >= 0 && nr.d < (nr.lat > 0 ? T.br[nr.i] : T.bl[nr.i]) + CLEAR) continue;
      const a = Math.max(0, k - 1), b = Math.min(n - 1, k + 1), dx = Q[2 * b] - Q[2 * a], dz = Q[2 * b + 1] - Q[2 * a + 1], l = Math.hypot(dx, dz) || 1;
      R.push({ x, z, nx: -dz / l, nz: dx / l, tx: dx / l, tz: dz / l });
    }
    const m = R.length;
    for (let k = 0; k < m; k++) {
      const r = (toRoad ? m - 1 - k : k) * STEP, f = (toRoad ? k : m - 1 - k) * STEP, w = hash(gi * 31 + (toRoad ? 0 : 7), k >> 2);
      R[k].r = r; R[k].f = f; R[k].hw = 0.6 + 0.55 * w + (toRoad ? 1.0 * (1 - sm(r / 12)) : 0.4 * (1 - sm(r / 6)));
      const mz = 0.55 * Math.sin(r / 4.3 + gi * 1.7) * sm(r / 5); R[k].x += R[k].nx * mz; R[k].z += R[k].nz * mz;   // (the bed wanders a little)
    }
    return R;
  };
  const parts = () => { const P = []; WASHES.forEach((W, gi) => { P.push(rowsOf(W.up, true, gi)); P.push(rowsOf(W.dn, false, gi)); }); return P; };

  // ---- no trees on the washes: gore.build calls this before it plants them ----
  function keepOut(push) {
    for (const R of parts()) for (let k = 0; k < R.length; k += 2) push(R[k].x, R[k].z, R[k].hw + 1.6);
  }

  // ---- the meshes: gore.build calls this after its own extra ----
  function extra(ctx) {
    const st = CO.stats = { washes: 0, rows: 0, stones: 0, meshes: 0, metres: 0 };
    if (!ctx || !ctx.scen || !ctx.root) return;
    const g = new GB(true, true), OF = [-1, -1, -0.28, 0.28, 1, 1], AX = [0, 1, 1, 1, 1, 0];
    let seed = 90210; const rnd = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
    const stone = (x, z, s, col) => {
      const nr = vrNear(x, z), T = API.T; if (nr.i >= 0 && nr.d < (nr.lat > 0 ? T.br[nr.i] : T.bl[nr.i]) + CLEAR - 0.4 + s) return;
      const c = STONE[col % STONE.length], k = 0.9 + 0.2 * rnd();
      rock(ctx.scen.get(x, z), x, vrGround(x, z) + s * 0.22, z, s * (1 + 0.5 * rnd()), s * 0.75, s * (0.75 + 0.4 * rnd()), rnd() * 6.283, [c[0] * k, c[1] * k, c[2] * k], rnd, 0.3);
      st.stones++;
    };
    parts().forEach((R, pi) => {
      if (R.length < 3) return;
      if (pi % 2 === 0) st.washes++;
      st.metres += (R.length - 1) * STEP;
      let prev = null;
      for (let k = 0; k < R.length; k++) {
        const p = R[k], aL = sm(p.f / FADE) * sm((p.r + 1.5) / 3), tn = 0.94 + 0.12 * hash(Math.round(p.x), Math.round(p.z)), row = { p: [], c: [], u: [] };
        for (let q = 0; q < OF.length; q++) {
          const o = OF[q] * p.hw + (q === 0 ? -EDGE : q === OF.length - 1 ? EDGE : 0), x = p.x + p.nx * o, z = p.z + p.nz * o, col = q === 2 || q === 3 ? WET : BED;
          row.p.push([x, vrGround(x, z) + 0.08, z]); row.c.push([col[0] * tn, col[1] * tn, col[2] * tn, AX[q] * aL]); row.u.push([o / 3, (p.r + pi * 17) / 3]);
        }
        if (prev) for (let q = 0; q + 1 < OF.length; q++) g.quadUp(prev.p[q], row.p[q], row.p[q + 1], prev.p[q + 1], [prev.c[q], row.c[q], row.c[q + 1], prev.c[q + 1]], [prev.u[q], row.u[q], row.u[q + 1], prev.u[q + 1]]);
        prev = row; st.rows++;
        // the stones: small ones in the bed every 5th row, one on a bank every 4th, a boulder now and then
        if (k % 5 === 0 && p.f > 2) stone(p.x + p.nx * (rnd() - 0.5) * 1.6 * p.hw + p.tx * (rnd() - 0.5), p.z + p.nz * (rnd() - 0.5) * 1.6 * p.hw + p.tz * (rnd() - 0.5), 0.2 + 0.2 * rnd(), k);
        if (k % 4 === 1 && p.f > 3) { const sd = rnd() < 0.5 ? -1 : 1, o = sd * (p.hw + 0.2 + 0.7 * rnd()); stone(p.x + p.nx * o, p.z + p.nz * o, 0.3 + 0.3 * rnd(), k + 1); }
        if (k % 11 === 5 && p.f > 5) { const sd = rnd() < 0.5 ? -1 : 1, o = sd * (p.hw + 0.5 + 0.9 * rnd()); stone(p.x + p.nx * o, p.z + p.nz * o, 0.6 + 0.45 * rnd(), k + 2); }
      }
      // at the road: what the water leaves where the slope eases (above the road) and the first of the drop (below it)
      const e = pi % 2 === 0 ? R[R.length - 1] : R[0];
      for (let j = 0; j < (pi % 2 === 0 ? 5 : 3); j++) { const a = rnd() * 6.283, d = 0.6 + rnd() * (e.hw + 0.8); stone(e.x + Math.cos(a) * d, e.z + Math.sin(a) * d, 0.2 + 0.32 * rnd(), j); }
    });
    if (g.empty) return;
    const grit = typeof API.vrGritTex === 'function' ? API.vrGritTex() : null;
    const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ map: grit, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'roadside-washes'; m.renderOrder = 1;
    ctx.root.add(m); st.meshes++;
  }

  // ---- the hook: World.ext.tapini builds through World.gore.build; for that one call its settings get keepOut and extra ----
  const ext = World.ext, baseExt = ext.tapini;
  ext.tapini = function (scene, tex, opts) {
    const gore = World.gore, build = gore.build;
    gore.build = function (sc, tx, op, S) {
      gore.build = build;
      const S2 = Object.assign({}, S, {
        keepOut: (push) => { if (typeof S.keepOut === 'function') S.keepOut(push); keepOut(push); },
        extra: (c) => { const r = typeof S.extra === 'function' ? S.extra(c) : undefined; extra(c); return r; },
      });
      return build.call(this, sc, tx, op, S2);
    };
    try { return baseExt.apply(this, arguments); } finally { gore.build = build; }
  };
})();
