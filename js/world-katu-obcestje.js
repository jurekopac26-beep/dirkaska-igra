/* ===================================================================================================================================
   WORLD — Katu, Rusija: the roadside from OpenStreetMap (23. 11. 2026), laid into the scenery js/world-katu.js builds
   -----------------------------------------------------------------------------------------------------------------------------------
   The track's own data (js/tracks/katu.js) already has the map's buildings, fences, gates, car parks, viewpoints and toilets; added here
   what it lacks within ~60 m of the road: the footpaths (highway=path; 1.0 m of trodden earth, no width nor surface tagged) and the camp's
   outdoor shower (amenity=shower, node 8540465443: a post with a pipe and a head). The passing places are left out: they would widen the
   driving surface (driving and physics stay as they are).
   How: js/world-katu.js calls keepOut before it plants its woods, shrubs and rocks (nothing grows on the paths), and extra before it
   finishes the scenery's meshes: everything goes into the chunks that already exist (no draw call of its own), nothing knockable.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), 23. 11. 2026; the ways' ids in their rows
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, { box, cyl } = API;

  // x east, z south, metres from the track's origin (the start line)
  const PATHS = [   // highway=path: [OSM way, x, z, x, z, ...] (the parts within 60 m of the road)
    [286042191, -169.1, 48.2, -159.3, 46.7, -117.4, 29.7],
    [286039825, -96.9, -0.4, -59.7, -65.4],
    [286039825, -242.7, -884.4, -248, -887.4, -257.6, -895.8, -262.4, -897.8, -268.6, -898.5, -273.5, -899.9, -275.4, -901.3, -276.8, -902.7, -277.5, -908.5, -279, -911.5, -285.1, -916.3, -285.8, -920.8, -287.8, -923.8, -296.1, -924.4, -301.6, -923.1, -307.3, -923.8, -328.9, -933.9, -341.5, -935.1, -350.9, -945, -372.9, -945],
    [929372036, 979.9, -475, 977.3, -473.6, 976.3, -469, 972.4, -465.7, 972.4, -462.9, 970.8, -461.7, 968.7, -461.3, 966, -459.9, 962.7, -454.6, 958.7, -453, 952.2, -448.5, 946.2, -443.8, 942.7, -439.9, 938.2, -437.2, 927.3, -434.8],
    [934969456, 423.9, -78.5, 413.7, -85.4, 404.7, -93.9, 392.4, -110.7, 388.1, -125.3],
    [930118380, -485.8, -1494.7, -477.4, -1499, -452.7, -1505.5, -449.3, -1507, -442.4, -1511.2, -439.2, -1513.6, -433.7, -1519.3, -427.5, -1524, -416.3, -1527.5, -406.5, -1532.6, -390.1, -1545],
    [923250769, -182.2, -15, -177.5, -19.4, -170.7, -24.3, -162.4, -25.4, -146.2, -25.4, -139.4, -28.4, -126.9, -39, -121.3, -44.6, -111.5, -57.4, -99.8, -68.7, -93.7, -73.2, -82, -83.7, -78.8, -85.8],
  ];
  const SHOWER = [8540465443, 176.4, -1397.6];
  const HW = 0.5, EARTH = [0.47, 0.39, 0.29], POST = [0.62, 0.63, 0.64], HEAD = [0.72, 0.73, 0.74], BASE = [0.66, 0.63, 0.58];
  const CO = World.katuObcestje = { keepOut, extra, stats: null };

  const resample = (L, step) => {   // a flat x, z list -> points at most step m apart, its corners kept
    const out = [L[0], L[1]];
    for (let q = 0; q + 3 < L.length; q += 2) {
      const ax = L[q], az = L[q + 1], bx = L[q + 2], bz = L[q + 3], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
      for (let t = 1; t <= m; t++) out.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
    }
    return out;
  };
  // only the chunks that are already there (scen.get would start a new one: a new draw call)
  const chunkAt = (scen, x, z) => { const s = scen.size, i = Math.floor(x / s), j = Math.floor(z / s); return scen.map.get(i + ',' + j) || null; };
  // where a path may lie: off the road and its verge (beyond the barrier), out of the river
  const free = (o, x, z) => o.near(x, z).dd > 1.2 && o.riv(x, z) < -1;

  // ---- nothing grows on the paths: ctx { exclPush, near, riv } ----
  function keepOut(o) {
    if (!o || typeof o.exclPush !== 'function') return;
    for (const W of PATHS) { const Q = resample(W.slice(1), 2); for (let k = 0; k < Q.length; k += 2) if (free(o, Q[k], Q[k + 1])) o.exclPush(Q[k], Q[k + 1], 1.4); }
    o.exclPush(SHOWER[1], SHOWER[2], 2.5);
  }

  // ---- the meshes: ctx { scen, ground, near, riv } ----
  function extra(o) {
    const st = CO.stats = { paths: 0, pathM: 0, shower: 0, verts: 0 };
    if (!o || !o.scen || typeof o.ground !== 'function') return st;
    let v0 = 0; for (const g of o.scen.map.values()) v0 += g.P.length / 3;
    for (const W of PATHS) {
      const Q = resample(W.slice(1), 2.5), n = Q.length / 2; let drawn = false, prev = null;
      for (let k = 0; k < n; k++) {
        const x = Q[2 * k], z = Q[2 * k + 1];
        if (!free(o, x, z)) { prev = null; continue; }
        const a = k > 0 ? k - 1 : k, b = k < n - 1 ? k + 1 : k, dx = Q[2 * b] - Q[2 * a], dz = Q[2 * b + 1] - Q[2 * a + 1], l = Math.hypot(dx, dz) || 1;
        const nx = -dz / l, nz = dx / l, w = HW * (0.85 + 0.3 * Math.abs(Math.sin(x * 0.37 + z * 0.23)));
        const L = [x + nx * w, z + nz * w], R = [x - nx * w, z - nz * w];
        const row = { x, z, L: [L[0], o.ground(L[0], L[1]) + 0.05, L[1]], R: [R[0], o.ground(R[0], R[1]) + 0.05, R[1]] };
        if (prev) {
          const g = chunkAt(o.scen, (x + prev.x) / 2, (z + prev.z) / 2);
          if (g) { const f = 0.94 + 0.08 * Math.sin(x * 0.11 - z * 0.07), c = [EARTH[0] * f, EARTH[1] * f, EARTH[2] * f];
            g.quadUp(prev.L, row.L, row.R, prev.R, [c, c, c, c]); st.pathM += Math.hypot(x - prev.x, z - prev.z); drawn = true; }
        }
        prev = row;
      }
      if (drawn) st.paths++;
    }
    st.pathM = Math.round(st.pathM);
    { const [, x, z] = SHOWER, g = chunkAt(o.scen, x, z);   // a concrete pad, a post, the pipe out over it and the head
      if (g) { const y = o.ground(x, z);
        box(g, x, y - 0.1, z, 1.4, 0.18, 1.4, 0, BASE, BASE);
        cyl(g, x - 0.5, y, z, 0.05, 2.3, 6, POST, POST);
        box(g, x - 0.1, y + 2.22, z, 0.8, 0.06, 0.06, 0, POST, POST);
        cyl(g, x + 0.3, y + 2.08, z, 0.12, 0.12, 8, HEAD, HEAD, 0.04);
        st.shower = 1; } }
    for (const g of o.scen.map.values()) st.verts += g.P.length / 3; st.verts -= v0;
    return st;
  }
})();
