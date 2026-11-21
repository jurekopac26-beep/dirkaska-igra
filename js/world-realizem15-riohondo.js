// WORLD — realizem 15: Termas de Río Hondo, Argentina (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps beside the lap and the circuit's own world (js/world-riohondo.js) does not draw. Hooked by wrapping the look's
// extra (API.rbLook.riohondo.extra): loaded right after the circuit's own world and before the shared builder (js/world-rbring.js).
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), the extract of 21. 11. 2026.
//   · the circuit's old straight: the straight piece of the closed raceway way 170936090 between its nodes 1820455473 and 5353943402, 530 m
//     from the first corner (455 m after the finish line, where the lap turns right into its 840 m loop, way 261477878) to where the loop
//     comes back (1295 m). Plain asphalt on the ground outside the lap's barriers, whole: the driver looks along it into the first corner
//     and has it on the left, behind the guard rail, on the way out of the loop. It ends at the lap's own ground (its barriers and the
//     verge beyond them) at both ends, so the lap's barrier stands across it: the car cannot turn onto it. No trees and no spectators on it.
// Not drawn again: the service roads (OSM 385349330 to 385349333) are the circuit's own (def.sk.svc, js/world-riohondo.js); the side roads'
// package (`stranske`) has no rows for this circuit. Not drawn at all, said in the pull request: the longer pit lane of way 677314876 and
// the two grandstands' real places (ways 768690357, 768690358) need the track's file and the shared builder; a node without an outline
// 41 m from the lap; OSM has no other building, fence, wall, gate, tree or car park within 60 m of the lap.
// Assumed and said so in the pull request (OSM has neither on the way): the width (as the lap's) and the colour.
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, lk = API.rbLook && API.rbLook.riohondo;
  if (!lk || !lk.extra) return;
  const { RB, nrDist, nrGround, nrNear } = API;

  const LINK = [-273.37, -230.22, 158.87, -536.34];   // the two nodes [x, z, x, z]: m from the finish line, x east, z south
  const ASPHALT = [0.95, 0.95, 0.97], STEP = 3.5, COLS = 4, LIFT = 0.08, MIN = 0.4;   // (COLS: quads across; MIN: the narrowest part drawn, m)
  const VERGE = 2.9;   // a ribbon ends 0.3 m inside the outer edge of the lap's verge (rbVerge: 3.2 m beyond the barrier)

  const prev = lk.extra;
  lk.extra = (o) => {
    const st = prev(o) || {}, HW = API.T.w;
    const [ax, az, bx, bz] = LINK, D = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / D, uz = (bz - az) / D, nx = -uz, nz = ux;   // ((nx, nz): the straight's right)
    const at = (t, w) => [ax + ux * t + nx * w, az + uz * t + nz * w];   // t m along, w m across (+ right)
    const clear = (t, w) => { const p = at(t, w), q = nrNear(p[0], p[1]); return q.i < 0 || q.dd >= VERGE; };   // off the lap's own ground
    // what of the cross-section at t is off the lap's ground: [from, to] across; null when less than MIN m of it is
    const span = (t) => {
      const l = clear(t, -HW), r = clear(t, HW);
      if (l === r) return l && clear(t, 0) ? [-HW, HW] : null;
      let lo = l ? -HW : HW, hi = -lo;   // (lo: off the lap's ground, hi: on it)
      for (let k = 0; k < 10; k++) { const m = (lo + hi) / 2; if (clear(t, m)) lo = m; else hi = m; }
      return Math.abs(lo - (l ? -HW : HW)) < MIN ? null : l ? [-HW, lo] : [lo, HW];
    };
    const grade = (t) => { const s = span(t); return !s ? 0 : s[1] - s[0] > 2 * HW - 1e-6 ? 2 : 1; };   // nothing, a part, the whole width
    const last = (t0, t1, g) => { let lo = t0, hi = t1; for (let k = 0; k < 10; k++) { const m = (lo + hi) / 2; if (grade(m) >= g) lo = m; else hi = m; } return lo; };   // from t0 (of the grade) toward t1 (below it)
    // the cross-sections: every STEP m, and where the lap's ground begins to narrow the ribbon and where it ends it (it slants across both ends)
    const n = Math.ceil(D / STEP), ts = [0];
    for (let k = 1, g0 = grade(0); k <= n; k++) {
      const t0 = D * (k - 1) / n, t1 = D * k / n, g1 = grade(t1);
      for (const g of g1 > g0 ? [1, 2] : [2, 1]) if ((g0 >= g) !== (g1 >= g)) ts.push(g1 > g0 ? last(t1, t0, g) : last(t0, t1, g));
      ts.push(t1); g0 = g1;
    }
    const rb = new RB(true);
    let row0 = -1, t0 = 0, runs = 0, metres = 0;
    for (const t of ts) {
      const s = span(t);
      if (!s) { row0 = -1; continue; }
      const P = [], C = [], U = [];
      for (let j = 0; j <= COLS; j++) { const w = s[0] + (s[1] - s[0]) * j / COLS, p = at(t, w); P.push([p[0], nrGround(p[0], p[1]) + LIFT, p[1]]); C.push(ASPHALT); U.push([(w + HW) / 4, t / 4]); }
      const row = rb.row(P, C, U);
      if (row0 >= 0) { rb.link(row0, row, 0, COLS); metres += t - t0; } else runs++;
      row0 = row; t0 = t;
      const c = at(t, (s[0] + s[1]) / 2), r = (s[1] - s[0]) / 2 + 1.5;
      o.exclPush(c[0], c[1], r); if (nrDist(c[0], c[1]) < 60) o.CR.avoid(c[0], c[1], r);   // no trees, no spectators
    }
    st.osmRuns = runs; st.osmMetres = Math.round(metres); st.osmTris = rb.I.length / 3;
    if (rb.empty) return st;
    const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map: o.tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'osmWays'; o.root.add(m);
    return st;
  };
})();
