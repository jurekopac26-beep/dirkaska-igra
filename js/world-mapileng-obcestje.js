/* =========================================================================
   OBCESTJE — Mã Pí Lèng, Vietnam (theme 'mapileng'): what OpenStreetMap shows within ~60 m of the road that the short roads' builder
   (js/world-kratke.js, buildKratke with KR.mapileng) does not draw yet. Its footpaths (the cliff path, the footway, the path below the
   start: def.paths) are there already; this adds, on the crest past the finish:
   - the paved square for people on foot beside the museum (w1570160262, highway=pedestrian, area): stone slabs laid on the ground;
   - the concrete side road down to the village below the crest (w455836279, highway=service, surface=concrete, motor_vehicle=destination):
     a 3.5 m concrete lane from the main road's verge to ~60 m from it;
   - the lift gate across that side road (n1911819409, barrier=lift_gate): two posts and a red and white arm, open (raised a little).
   Source: © OpenStreetMap contributors (ODbL), data of 23. 11. 2026, the main API (api.openstreetmap.org/api/0.6/map). Projected as the
   track's line (tools/mapileng/config.json: origin the start line 23.25038, 105.3895; x east, z south, metres; the fit to the line's own
   OpenStreetMap way: +0.2, -0.8 m), rounded to 0.1 m. Generic: no names, signs or the museum's own look. Nothing from photographs.
   KR.mapileng.extras calls World.mapilengObcestje.extra with the builder's context (scen, excluded, exclPush, CR).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { box, caGround, vrNear } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  // the paved square (w1570160262): its outline, x, z
  const SQUARE = [459.7, 56.0, 470.1, 65.6, 473.0, 68.3, 455.4, 85.1, 440.3, 92.2, 430.0, 93.4, 417.6, 86.5, 415.0, 80.5, 420.5, 74.1, 429.2, 69.8,
    436.7, 69.3, 446.9, 72.2, 449.5, 72.1];
  // the concrete side road (w455836279): its line from the junction, x, z
  const SIDE = [487.7, 74.5, 492.5, 101.6, 497.3, 113.4, 501.6, 125.1, 522.5, 187.7, 524.1, 193.7, 534.2, 242.0];
  const GATE = [492.5, 101.6];   // the lift gate (n1911819409), on the side road
  const SIDE_W = 3.5, REACH = 60;

  function inPoly(P, x, z) {
    let c = false; const n = P.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) { const xi = P[2 * i], zi = P[2 * i + 1], xj = P[2 * j], zj = P[2 * j + 1];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; }
    return c;
  }

  // the square: 2 m cells inside its outline, each a slab on the ground (a little above it; the joints darker by the slabs' own shade)
  function square(c) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, n = 0;
    for (let k = 0; k < SQUARE.length; k += 2) { x0 = Math.min(x0, SQUARE[k]); x1 = Math.max(x1, SQUARE[k]); z0 = Math.min(z0, SQUARE[k + 1]); z1 = Math.max(z1, SQUARE[k + 1]); }
    const S = 2, y = (x, z) => caGround(x, z) + 0.07;
    for (let x = Math.floor(x0 / S) * S; x < x1; x += S) for (let z = Math.floor(z0 / S) * S; z < z1; z += S) {
      const cx = x + S / 2, cz = z + S / 2; if (!inPoly(SQUARE, cx, cz) || vrNear(cx, cz).dd < 2) continue;
      const q = 0.62 + 0.06 * (((x / S) + (z / S)) & 1) + 0.03 * Math.sin(x * 1.7 + z * 2.3), col = [q, q * 0.98, q * 0.93];
      const a = [x + 0.05, y(x, z), z + 0.05], b = [x + S - 0.05, y(x + S, z), z + 0.05], d = [x + 0.05, y(x, z + S), z + S - 0.05], e = [x + S - 0.05, y(x + S, z + S), z + S - 0.05];
      c.scen.get(cx, cz).quadUp(a, b, e, d, [col, col, col, col]); n++;
    }
    return n;
  }

  // the side road: every ~2 m along its line, a concrete strip across it on the ground, from where it leaves the main road's verge to
  // REACH m from the road; the trees and the builder's own things kept off it (exclPush)
  function sideRoad(c) {
    let n = 0, prev = null;
    for (let k = 0; k + 3 < SIDE.length; k += 2) {
      const ax = SIDE[k], az = SIDE[k + 1], bx = SIDE[k + 2], bz = SIDE[k + 3], L = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / L, tz = (bz - az) / L, nx = -tz, nz = tx;
      for (let t = 0; t <= L; t += 2) {
        const x = ax + tx * t, z = az + tz * t, nr = vrNear(x, z);
        if (nr.dd < 0.6 || nr.dd > REACH) { prev = null; continue; }
        const h = SIDE_W / 2, l = [x - nx * h, caGround(x - nx * h, z - nz * h) + 0.06, z - nz * h], r = [x + nx * h, caGround(x + nx * h, z + nz * h) + 0.06, z + nz * h];
        if (prev) { const q = 0.66 + 0.02 * ((n >> 1) & 1), col = [q, q * 0.99, q * 0.95]; c.scen.get(x, z).quadUp(prev[0], prev[1], r, l, [col, col, col, col]); n++; }
        prev = [l, r]; c.exclPush(x, z, SIDE_W / 2 + 0.8);
      }
    }
    return n;
  }

  // the lift gate: a post each side of the side road, the arm from one across it (red and white bands), resting a little open
  function gate(c) {
    const [x, z] = GATE; if (vrNear(x, z).dd < 1 || c.excluded(x, z)) return 0;
    const ax = SIDE[2] - SIDE[0], az = SIDE[3] - SIDE[1], L = Math.hypot(ax, az), tx = ax / L, tz = az / L, nx = -tz, nz = tx, hd = Math.atan2(nz, nx);
    const g = c.scen.get(x, z), grey = [0.72, 0.72, 0.7], red = [0.78, 0.16, 0.13], white = [0.9, 0.9, 0.88];
    const p0 = [x - nx * (SIDE_W / 2 + 0.4), z - nz * (SIDE_W / 2 + 0.4)], p1 = [x + nx * (SIDE_W / 2 + 0.4), z + nz * (SIDE_W / 2 + 0.4)];
    for (const [px, pz] of [p0, p1]) box(g, px, caGround(px, pz) - 0.2, pz, 0.18, 1.25, 0.18, hd, grey, grey);
    const y0 = caGround(p0[0], p0[1]) + 0.95, seg = (SIDE_W + 0.8) / 6;
    for (let k = 0; k < 6; k++) { const u = (k + 0.5) * seg, px = p0[0] + nx * u, pz = p0[1] + nz * u;
      box(g, px, y0 + u * 0.12, pz, seg, 0.09, 0.09, hd, k & 1 ? white : red, k & 1 ? white : red); }
    c.exclPush(x, z, 3); c.CR.avoid(x, z, 2.5);
    return 1;
  }

  const stats = {};
  function extra(c) {
    stats.square = square(c); stats.side = sideRoad(c); stats.gate = gate(c);
    return stats.square + stats.side + stats.gate;
  }
  World.mapilengObcestje = { extra, stats, data: { SQUARE, SIDE, GATE } };
})();
