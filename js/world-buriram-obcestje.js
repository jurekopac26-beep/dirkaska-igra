/* =====================================================================================================================================
   WORLD — Buriram, Tajska: what lies by the road past the barriers (grafika ob progi), from OpenStreetMap, on js/world-buriram.js (the
   builder's hook LK.extra wrapped: what is here is laid out first, so the builder's trees and the crowds keep clear of it, then
   js/world-buriram.js's own parts).
   Drawn: the walls (OSM barrier=wall, 3, east of the paddock: by the main straight's end, along the east side and round to the south;
     no height or material in OSM: 2 m of concrete, 0.25 m thick, grey precast, assumed, as on Lusail).
   Kept open (docs/realizem.md: only from sources): nothing else within ~60 m of the road is in OSM that the track does not draw already.
   Not drawn again: the circuit's paved area, the barriers, the run-off and the grandstands (the builder's and js/world-buriram.js's), the
     service roads, the building, the pond and the marshes (js/tracks/buriram.js, def.sk); nothing within the barriers; no names of the
     circuit, its owners or its operators.
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-23; metres, origin = the finish line, x east, z south
   (tools/buriram/buriram.json's lat0/lon0).
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.buriram;
  if (!LK || typeof LK.extra !== 'function') return;

  // the walls: [x0, z0, x1, z1, ...] each
  const WALLS = [
    [162.02,44.97,183.05,3.69,195.37,-53.4],
    [197.42,-58,208.71,-129.36,207.67,-162.5],
    [209.73,-175.24,195.88,-206.85,186.64,-223.67,174.34,-236.92,147.14,-257.32,73.27,-295.04]];

  const base = LK.extra;
  LK.extra = function (o) { const mine = lay(o); const st = base(o) || {}; st.roadside = mine; return st; };

  function lay(o) {
    const { scen, exclPush: exPush, excluded, CR } = o, { nrGround, nrNear, box } = A;
    const st = { walls: 0, wallM: 0, wallSkip: 0, exHit: 0 };
    // the clearances of what is laid here are pushed at the end (as on Lusail), so that what is laid here does not take its own for another's
    const later = [], exclPush = (x, z, r) => { later.push(x, z, r); };
    const past = (x, z, m) => { const n = nrNear(x, z); return n.i < 0 || n.dd >= m; };
    const near = (x, z, m) => { const n = nrNear(x, z); return n.i >= 0 && n.dd < m; };

    // the walls: in pieces of up to 8 m, each from 0.3 m below the lowest ground under it to 2 m above the highest, 0.25 m thick; a piece that
    // would stand within 2 m past the barriers left out
    const WALL_C = [0.8, 0.8, 0.78], WALL_T = [0.86, 0.86, 0.84];
    for (const W of WALLS) {
      let drawn = false;
      for (let q = 0; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 8)), l = L / m, rot = Math.atan2(bz - az, bx - ax);
        for (let t = 0; t < m; t++) {
          const x0 = ax + (bx - ax) * t / m, z0 = az + (bz - az) * t / m, x1 = ax + (bx - ax) * (t + 1) / m, z1 = az + (bz - az) * (t + 1) / m, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
          if (!past(mx, mz, 2) || !past(x0, z0, 1.5) || !past(x1, z1, 1.5)) { st.wallSkip++; continue; }
          if (excluded(mx, mz) && near(mx, mz, 60)) st.exHit++;
          const g0 = nrGround(x0, z0), g1 = nrGround(x1, z1), gm = nrGround(mx, mz), lo = Math.min(g0, g1, gm) - 0.3, hi = Math.max(g0, g1, gm) + 2;
          box(scen.get(mx, mz), mx, lo, mz, l + 0.05, hi - lo, 0.25, rot, WALL_C, WALL_T, true);
          const n = Math.max(1, Math.round(l / 2.5));
          for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; exclPush(x, z, 1.6); if (near(x, z, 45)) CR.avoid(x, z, 0.9); }
          st.wallM += l; drawn = true;
        }
      }
      if (drawn) st.walls++;
    }

    for (let k = 0; k < later.length; k += 3) exPush(later[k], later[k + 1], later[k + 2]);
    st.wallM = Math.round(st.wallM);
    return st;
  }
})();
