// WORLD — realizem 15: Buriram, Tajska (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps beside the lap and the circuit's own world (js/world-buriram.js) does not draw. Hooked by wrapping the look's
// extra (API.rbLook.buriram.extra): loaded right after the circuit's own world and before the shared builder (js/world-rbring.js).
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), the extract of 21. 11. 2026.
//  · the infield's walls (barrier=wall; ways 1327506912, 1327506913 and 1327506915, 399 m together): along the infield's ring service
//    road, on its inner side (the road runs between them and the main straight and the straight to the last corner; the lap at
//    2560-2820 m is on their other side), 29-75 m from the lap's centre line (the nearest 165 m before the finish line); open where a
//    service road of the circuit's own world crosses their line (OSM draws the ways 1327506908 and 1327506909 through the second wall),
//    and where OSM leaves a gap between two of them
// Not drawn again: the service roads, the pond, the wetlands, the main grandstand and the building behind the pits (js/world-buriram.js,
// def.sk), the stands (def.stands: OSM's bleachers and the three buildings under one roof), the side roads of package E (def.stranske,
// docs/realizem/paket-e.md: the walls keep off them).
// Not drawn at all, said in the pull request: the tunnel under the lap (way 1327506924: the ground is not cut), the drag strip (mapped
// as an approximate place and length), the karting track, the small circuit and the basins (all beyond 60 m).
// Assumed and said so in the pull request (OSM has only barrier=wall on the ways): the height (1.1 m), the thickness (0.3 m) and the
// plain concrete of the circuit's own walls (js/world-rbring.js); no boards, no paint, no names.
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, lk = API.rbLook && API.rbLook.buriram;
  if (!lk || !lk.extra) return;
  const { nrDist, nrGround, nrNear } = API;
  // the walls [x, z, ...] in OSM's order: metres from the finish line, x east, z south (the frame of js/tracks/buriram.js)
  const WALLS = [
    [162.0, 45.0, 183.1, 3.7, 195.4, -53.4],   // way 1327506912
    [197.4, -58.0, 208.7, -129.4, 207.7, -162.5],   // way 1327506913
    [209.7, -175.2, 195.9, -206.9, 186.6, -223.7, 174.3, -236.9, 147.1, -257.3, 73.3, -295.0]   // way 1327506915
  ];
  const H = 1.1, TH = 0.3, SVC = 2.5, GAP = 1, STEP = 4;   // (SVC: half the width js/world-buriram.js draws its service roads; GAP: free ground beside a road's asphalt)
  const FOOT = [0.62, 0.62, 0.6], CONC = [0.76, 0.76, 0.74], TOP = [0.88, 0.88, 0.86];   // (the builder's concrete walls)
  const segD = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
  const lineD = (L, x, z) => { let d = 1e9; for (let k = 2; k < L.length; k += 2) d = Math.min(d, segD(x, z, L[k - 2], L[k - 1], L[k], L[k + 1])); return d; };
  const turn = (ax, az, bx, bz, cx, cz) => (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
  const crosses = (A, B) => {   // (two polylines: one's segment through the other's)
    for (let i = 2; i < A.length; i += 2) for (let j = 2; j < B.length; j += 2) {
      const a = [A[i - 2], A[i - 1], A[i], A[i + 1]], b = [B[j - 2], B[j - 1], B[j], B[j + 1]];
      if (turn(...a, b[0], b[1]) * turn(...a, b[2], b[3]) < 0 && turn(...b, a[0], a[1]) * turn(...b, a[2], a[3]) < 0) return true;
    }
    return false;
  };

  const prev = lk.extra;
  lk.extra = (o) => {
    const st = prev(o) || {}, S = (API.T.def.sk || {}).svc || [], roads = [];
    for (let k = 0; k < S.length; k += 1 + 2 * S[k]) roads.push(S.slice(k + 1, k + 1 + 2 * S[k]));   // (def.sk.svc: [n, x0, z0, x1, z1, ...] per road)
    let runs = 0, metres = 0, tris = 0, gaps = 0;
    for (const W of WALLS) {
      const cum = [0]; for (let k = 2; k < W.length; k += 2) cum.push(cum[cum.length - 1] + Math.hypot(W[k] - W[k - 2], W[k + 1] - W[k - 1]));
      const len = cum[cum.length - 1], nS = cum.length - 1, thru = roads.filter((r) => crosses(r, W));
      const at = (t) => { let s = 0; while (s < nS - 1 && t > cum[s + 1]) s++; const u = (t - cum[s]) / (cum[s + 1] - cum[s]); return [W[s * 2] + (W[s * 2 + 2] - W[s * 2]) * u, W[s * 2 + 1] + (W[s * 2 + 3] - W[s * 2 + 1]) * u, s]; };
      const nor = (s) => { const dx = W[s * 2 + 2] - W[s * 2], dz = W[s * 2 + 3] - W[s * 2 + 1], l = Math.hypot(dx, dz); return [-dz / l, dx / l]; };
      // open: a crossing service road's asphalt and GAP beside it; a side road of package E (o.naCesti, when the build has them); never
      // within 3 m past the lap's barriers (the walls stand 29 m and more from the lap: a guard, should the lap's data change)
      const open = (t) => { const [x, z] = at(t), q = nrNear(x, z); return thru.some((r) => lineD(r, x, z) < SVC + GAP) || (!!o.naCesti && o.naCesti(x, z, GAP - 1.8)) || (q.i >= 0 && q.dd < 3); };
      const parts = []; let t0 = -1;
      for (let t = 0; ; t += 0.25) { const e = t >= len, op = e || open(t); if (!op && t0 < 0) t0 = t; if (op && t0 >= 0) { const t1 = e ? len : t - 0.25; if (t1 - t0 >= 2) parts.push([t0, t1]); t0 = -1; } if (e) break; }
      gaps += Math.max(0, parts.length - 1);
      for (const [a, b] of parts) {
        // stations: the part's ends, the way's nodes between them (mitred), and no more than STEP apart
        const br = [a]; for (let k = 1; k < nS; k++) if (cum[k] > a + 0.5 && cum[k] < b - 0.5) br.push(cum[k]); br.push(b);
        const P = [];
        for (let k = 1; k < br.length; k++) { const n = Math.ceil((br[k] - br[k - 1]) / STEP); for (let j = k === 1 ? 0 : 1; j <= n; j++) P.push([j === n ? br[k] : br[k - 1] + (br[k] - br[k - 1]) * j / n, j === n && k < br.length - 1]); }
        const Q = P.map(([t, node]) => {
          const [x, z, s] = at(t); let [nx, nz] = nor(s), w = TH / 2;
          if (node) { const m = nor(s + 1), mx = nx + m[0], mz = nz + m[1], l = Math.hypot(mx, mz); w /= (mx * nx + mz * nz) / l; nx = mx / l; nz = mz / l; }   // (a node: the mitre of its two segments)
          const y = nrGround(x, z);
          o.exclPush(x, z, 2.5); if (nrDist(x, z) < 60) o.CR.avoid(x, z, 1.5);   // no trees, no spectators
          return { x, z, y, l: [x + nx * w, z + nz * w], r: [x - nx * w, z - nz * w] };
        });
        const V = (q, e, h) => [e[0], q.y + h, e[1]];
        for (let k = 1; k < Q.length; k++) {
          const p = Q[k - 1], q = Q[k], g = o.scen.get((p.x + q.x) / 2, (p.z + q.z) / 2), inn = [(p.x + q.x) / 2, (p.y + q.y) / 2 + H / 2, (p.z + q.z) / 2];
          for (const e of ['l', 'r']) {   // both faces: the foot darker (0.4 m of it under the ground), then plain
            g.quadO(V(p, p[e], -0.4), V(q, q[e], -0.4), V(q, q[e], 0.1), V(p, p[e], 0.1), FOOT, inn, null, [FOOT, FOOT, CONC, CONC]);
            g.quadO(V(p, p[e], 0.1), V(q, q[e], 0.1), V(q, q[e], H), V(p, p[e], H), CONC, inn);
          }
          g.quadO(V(p, p.l, H), V(q, q.l, H), V(q, q.r, H), V(p, p.r, H), TOP, inn);
          tris += 10;
          for (const [c, on] of [[p, k === 1], [q, k === Q.length - 1]]) if (on) { g.quadO(V(c, c.l, -0.4), V(c, c.r, -0.4), V(c, c.r, H), V(c, c.l, H), CONC, inn); tris += 2; }   // (a part's ends)
        }
        runs++; metres += b - a;
      }
    }
    st.osmWalls = runs; st.osmGaps = gaps; st.osmMetres = Math.round(metres); st.osmTris = tris;
    return st;
  };
})();
