/* =========================================================================
   WORLD — Kildare, Irska: the roads around the circuit's grounds (obcestje) by OpenStreetMap, beyond the stretch the realism package
   draws within 66 m of the lap (PR #854, js/world-realizem15.js) and up to 250 m from it: the regional road (highway=secondary, way
   23568074: lanes=2, surface=asphalt) and 23 of the grounds' service roads (highway=service: one surface=unpaved, the others untagged),
   as ribbons laid on the ground with their true course (the OSM ways, simplified to 0.1 m) and the widths OSM gives (width=*, else
   lanes=* x the lane, else by the kind of road). Assumed and said so in the pull request: the lane 3.25 m on the regional road (6.5 m),
   the service road 3.6 m (as #854), pale gravel for the untagged ones (as #854) and earth for the unpaved one, the broken white centre
   line on the two-lane asphalt road (3 m of line, 9 m of gap, 0.1 m wide; OSM has no tag for the marking).
   A way cut 250 m from the lap fades into the ground over its last 20 m; one that goes on from #854's stretch starts 6 m before that one's
   cut, over its fade (without #854 it fades in there itself). Nothing is laid on the lap's own ground (its barriers and grass verge) or
   under the circuit's other raceways (they lie over the ground themselves); the trees and the crowds keep off the roads.
   Not drawn: the raceways (the lap and def.sk.race), the steps and the footbridge (the circuit's own), the ways beyond 250 m.
   No names anywhere: only OSM's way numbers.
   The data line is written by tools/kildare/obcestje.py: [OSM way, width in m, surface (0 asphalt, 1 pale gravel, 2 earth),
   centre line (1 broken white), start, end (0 the way's own end, 1 cut 250 m from the lap, 2 the join with #854), x0, z0, x1, z1, ...].
   Hooked by wrapping the look's extra (API.rbLook.kildare.extra): loaded after the circuit's own world (js/world-kildare.js) and before
   the shared builder (js/world-rbring.js), which calls it with the scenery's chunks before its crowds and trees. One draw.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«); x east and z south of the middle of the start line, in metres.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, lk = API.rbLook && API.rbLook.kildare;
  if (!lk || !lk.extra) return;
  const { GB, clamp, nrGround, nrGCol, nrDist, nrNear } = API;

  // the ways (tools/kildare/obcestje.py writes the next line)
  const WAYS = [[23568074,6.5,0,1,1,1,-121.9,-507.0,-113.8,-494.8,-91.8,-458.0,-42.8,-343.8,31.3,-175.4,103.9,-1.6,144.8,91.7,205.6,235.1],[38715379,3.6,1,0,0,2,31.3,-175.4,16.8,-170.9,-4.2,-164.7],[87185965,3.6,1,0,2,1,73.7,95.1,73.6,100.2,77.7,110.6,87.8,123.8,97.3,129.6,103.3,134.6,112.5,144.3,123.4,164.8,131.0,187.9,135.2,210.7,147.3,225.9,152.6,243.3,150.4,253.5,137.8,275.7,145.7,281.4,156.4,288.3],[87185977,3.6,1,0,1,0,18.2,351.5,35.8,338.3,58.1,321.2,78.5,310.4,97.5,305.3,123.5,299.4,130.0,292.2,137.8,275.7],[88611290,3.6,1,0,0,0,144.8,91.7,136.3,92.4,116.0,96.9,118.7,77.7],[88611291,3.6,1,0,0,2,103.9,-1.6,78.8,8.4,71.1,10.7],[88611294,3.6,1,0,0,0,-84.7,-325.0,-59.5,-338.4,-42.8,-343.8],[88611305,3.6,1,0,0,0,116.0,96.9,110.8,99.4,102.0,98.7,86.6,95.1,80.7,93.9,73.7,94.9],[265528121,3.6,1,0,0,0,77.9,153.8,97.5,140.2,103.3,134.6],[265528122,3.6,1,0,0,2,-147.6,-96.0,-153.2,-98.1],[265528123,3.6,1,0,2,0,-331.1,-49.8,-349.3,-45.0],[981347880,3.6,1,0,2,0,-162.6,-47.1,-162.7,-51.1,-147.6,-96.0],[1323583462,3.6,1,0,0,0,73.7,-73.9,45.7,-60.5,66.9,-13.1],[1323583464,3.6,1,0,1,0,238.0,183.2,218.3,181.2],[1323583466,3.6,1,0,0,0,135.2,210.7,132.3,226.6,123.6,243.9,121.4,254.9,123.6,265.3],[1323583467,3.6,1,0,0,0,-348.5,-182.0,-337.6,-172.3,-330.9,-170.7,-325.0,-173.0,-300.0,-198.6,-299.0,-205.1,-300.2,-210.1,-311.4,-220.2],[1323583471,3.6,1,0,0,2,-352.4,-154.7,-415.5,-96.7,-450.0,-64.4,-461.9,-52.3,-471.4,-36.1,-477.9,-12.2,-478.0,8.6,-474.0,25.8,-469.3,33.1,-459.2,41.7,-437.7,52.0,-427.2,54.1,-414.9,53.9,-378.2,42.5,-369.4,40.4],[1323583474,3.6,1,0,0,0,-346.2,-23.5,-352.0,-63.7],[1323583477,3.6,2,0,0,0,-157.2,-290.0,-134.5,-335.3,-132.2,-348.5,-134.2,-357.1,-144.1,-374.9,-208.6,-416.2],[1323583478,3.6,1,0,0,0,-89.8,-357.0,-104.9,-358.9,-120.6,-359.3,-132.2,-348.5,-148.3,-346.5],[1323583479,3.6,1,0,1,0,-171.9,-499.9,-171.5,-495.2,-167.0,-485.3,-148.6,-460.4,-126.6,-424.5,-96.2,-379.6,-93.6,-367.9,-79.4,-327.8],[1323583480,3.6,1,0,0,2,-79.4,-327.8,-70.6,-315.7,-66.4,-309.0],[1323583489,3.6,1,0,2,2,-156.3,-38.3,-145.5,-42.9,-94.0,-66.0],[1323583490,3.6,1,0,2,0,-133.2,-133.4,-136.4,-118.0,-134.7,-101.9,-132.8,-92.3,-132.0,-83.8,-145.5,-42.9]];

  const COL = [[0.95, 0.95, 0.97], [1.485, 1.406, 1.247], [1.2, 1.08, 0.86]];   // asphalt, pale gravel (as #854), earth
  const LIFT = [0.052, 0.044, 0.044];   // over the ground: above #854's ribbons (0.03 to 0.042), whose fades the joins cover
  const UVK = [8, 6, 6], LINE = [2.6, 2.6, 2.6], DLIFT = 0.012, DASH = 3, GAP = 9, DHW = 0.05;
  const YEL = [2.6 * 0.95, 2.6 * 0.74, 2.6 * 0.14], EDASH = 2, EGAP = 2, EHW = 0.06, EIN = 0.3;   // H2′: the yellow edge line (RRM 025), its middle EIN m in from the asphalt's edge
  const STEP = 3, FADE = [0, 20, 6], VERGE = 2.9;

  function sections(P, hw) {   // a way's cross sections: mitred at its bends, every STEP m between them
    const n = P.length, seg = [], cum = [0];
    for (let k = 0; k + 1 < n; k++) { const dx = P[k + 1][0] - P[k][0], dz = P[k + 1][1] - P[k][1], l = Math.hypot(dx, dz) || 1e-6; seg.push({ l, nx: -dz / l, nz: dx / l }); cum.push(cum[k] + l); }
    const J = [];
    for (let k = 0; k < n; k++) {
      const a = seg[Math.max(0, k - 1)], b = seg[Math.min(n - 2, k)]; let nx = a.nx + b.nx, nz = a.nz + b.nz; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
      const c0 = Math.max(0.625, nx * a.nx + nz * a.nz);
      J.push({ nx, nz, w: hw / c0, back: hw * Math.sqrt(Math.max(0, 1 - c0 * c0)) / c0 });
    }
    const S = [], put = (u, x, z, nx, nz, w) => S.push({ u, x, z, nx, nz, w });
    for (let k = 0; k < n; k++) {
      put(cum[k], P[k][0], P[k][1], J[k].nx, J[k].nz, J[k].w);
      if (k === n - 1) break;
      const s = seg[k], m = Math.max(1, Math.ceil(s.l / STEP));
      for (let q = 1; q < m; q++) {
        const d = s.l * q / m; if (d < J[k].back + 0.2 || d > s.l - J[k + 1].back - 0.2) continue;
        const t = d / s.l; put(cum[k] + d, P[k][0] + (P[k + 1][0] - P[k][0]) * t, P[k][1] + (P[k + 1][1] - P[k][1]) * t, s.nx, s.nz, hw);
      }
    }
    return { S, U: cum[n - 1], seg, cum };
  }

  const prev = lk.extra;
  lk.extra = o => {
    const st = prev(o) || {};
    const joined = st.osmRuns !== undefined;   // #854 drew its stretch: a join starts over its fade at full colour
    const onLap = (x, z) => { const q = nrNear(x, z); return q.i >= 0 && q.dd < VERGE; };   // the lap's barriers and its grass verge (rbVerge)
    const RW = [];   // the raceways' segments with the radius inside which a road ends (1 m inside the raceway's edge)
    for (const [sf, f] of ((API.T.def.sk || {}).race || [])) {
      const r = (API.kdRaceHW ? API.kdRaceHW(sf) : sf === 5 ? 4.5 : 4.1) - 1;
      for (let k = 0; k + 3 < f.length; k += 2) RW.push([f[k], f[k + 1], f[k + 2], f[k + 3], r]);
    }
    const onRace = (x, z) => {
      for (const [ax, az, bx, bz, r] of RW) { const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1); if ((x - ax - dx * t) ** 2 + (z - az - dz * t) ** 2 < r * r) return true; }
      return false;
    };
    const keep = (x, z, r) => { o.exclPush(x, z, r); if (nrDist(x, z) < 60) o.CR.avoid(x, z, r); };   // no trees, no spectators
    const g = new GB(true);
    const rob = World.cesta && World.cesta.oznake ? World.cesta.oznake(API.T, 'robRumena') : 0;   // H2′ gate (default 0)
    let ways = 0, metres = 0, dashes = 0, edges = 0;
    for (const w of WAYS) {
      const width = w[1], sf = w[2], cl = w[3], e0 = w[4], e1 = w[5], P = [];
      for (let k = 6; k + 1 < w.length; k += 2) P.push([w[k], w[k + 1]]);
      if (P.length < 2) continue;
      const hw = width / 2, base = COL[sf], lift = LIFT[sf], uk = UVK[sf], { S, U, seg, cum } = sections(P, hw);
      const f0 = e0 === 2 && joined ? 0 : FADE[e0], f1 = e1 === 2 && joined ? 0 : FADE[e1];
      const fade = u => { const v = clamp(Math.max(f0 ? 1 - u / f0 : 0, f1 ? 1 - (U - u) / f1 : 0), 0, 1); return v * v * (3 - 2 * v); };
      const tint = (c, x, z, t) => { if (t <= 0) return c; const gc = nrGCol(x, z); return [c[0] + (gc[0] * 1.2 - c[0]) * t, c[1] + (gc[1] * 1.2 - c[1]) * t, c[2] + (gc[2] * 1.2 - c[2]) * t]; };
      const NA = Math.max(2, Math.ceil(width / 3.5) + 1);
      const row = s => {   // NA points across: [x, y, z], colour, uv
        const t = fade(s.u), R = [];
        for (let i = 0; i < NA; i++) {
          const f = 1 - 2 * i / (NA - 1), x = s.x + s.nx * s.w * f, z = s.z + s.nz * s.w * f;
          R.push({ p: [x, nrGround(x, z) + lift, z], c: tint(base, x, z, t), uv: [x / uk, -z / uk] });
        }
        return R;
      };
      for (const s of S) s.ok = !onRace(s.x, s.z) && !onLap(s.x, s.z) && !onLap(s.x + s.nx * s.w, s.z + s.nz * s.w) && !onLap(s.x - s.nx * s.w, s.z - s.nz * s.w);
      let any = false;
      for (let k = 0; k + 1 < S.length; k++) {
        const a = S[k], b = S[k + 1];
        if (!a.ok || !b.ok) continue;
        const A = row(a), B = row(b);
        for (let i = 0; i + 1 < NA; i++) g.quadUp(A[i].p, A[i + 1].p, B[i + 1].p, B[i].p, [A[i].c, A[i + 1].c, B[i + 1].c, B[i].c], [A[i].uv, A[i + 1].uv, B[i + 1].uv, B[i].uv]);
        metres += b.u - a.u; any = true;
      }
      for (const s of S) if (s.ok) keep(s.x, s.z, hw + 1.5);
      if (any) ways++;
      if (!cl) continue;
      // the broken white centre line: dashes laid every 1.5 m, from the way's start
      const at = u => { let k = 0; while (k < seg.length - 1 && cum[k + 1] < u) k++; const s = seg[k], t = clamp((u - cum[k]) / s.l, 0, 1); return { x: P[k][0] + (P[k + 1][0] - P[k][0]) * t, z: P[k][1] + (P[k + 1][1] - P[k][1]) * t, nx: s.nx, nz: s.nz }; };
      const pt = (q, f) => { const x = q.x + q.nx * DHW * f, z = q.z + q.nz * DHW * f; return [x, nrGround(x, z) + lift + DLIFT, z]; };
      const good = q => !onRace(q.x, q.z) && !onLap(q.x, q.z);
      for (let u0 = GAP / 2; u0 + DASH <= U; u0 += DASH + GAP) {
        const m = Math.ceil(DASH / 1.5);
        for (let q = 0; q < m; q++) {
          const ua = u0 + DASH * q / m, ub = u0 + DASH * (q + 1) / m, qa = at(ua), qb = at(ub);
          if (!good(qa) || !good(qb)) continue;
          const ca = tint(LINE, qa.x, qa.z, fade(ua)), cb = tint(LINE, qb.x, qb.z, fade(ub));
          g.quadUp(pt(qa, 1), pt(qa, -1), pt(qb, -1), pt(qb, 1), [ca, ca, cb, cb]);
        }
        dashes++;
      }
      if (!rob) continue;
      // H2′: the broken yellow edge line on both sides (S.I. 205/2026, RRM 025), one quad a dash
      const ept = (q, off) => { const x = q.x + q.nx * off, z = q.z + q.nz * off; return [x, nrGround(x, z) + lift + DLIFT, z]; };
      const egood = (q, off) => { const x = q.x + q.nx * off, z = q.z + q.nz * off; return !onRace(x, z) && !onLap(x, z); };
      for (const sd of [1, -1]) {
        const mid = sd * (hw - EIN);
        for (let u0 = EGAP / 2; u0 + EDASH <= U; u0 += EDASH + EGAP) {
          const m = 1;   // (one piece: 2 m of chord on a road whose tightest bend here is some 100 m)
          for (let q = 0; q < m; q++) {
            const ua = u0 + EDASH * q / m, ub = u0 + EDASH * (q + 1) / m, qa = at(ua), qb = at(ub);
            if (!egood(qa, mid) || !egood(qb, mid)) continue;
            const ca = tint(YEL, qa.x, qa.z, fade(ua)), cb = tint(YEL, qb.x, qb.z, fade(ub));
            g.quadUp(ept(qa, mid + EHW), ept(qa, mid - EHW), ept(qb, mid - EHW), ept(qb, mid + EHW), [ca, ca, cb, cb]);
          }
          edges++;
        }
      }
    }
    st.obcestje = ways; st.obcestjeM = Math.round(metres); st.obcestjeDash = dashes; st.obcestjeRob = edges;
    if (!g.empty) {
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ map: o.tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'kdObcestje'; o.root.add(m);
    }
    return st;
  };
})();
