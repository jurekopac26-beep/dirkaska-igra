// Realizem 15 (partyslo c): Batangas, Filipini – what OpenStreetMap maps within 60 m of the circuit that js/world-batangas.js and
// js/world-rbring.js do not draw yet.
// Drawn: the secondary road outside the last corner (highway=secondary lanes=2 surface=asphalt w28397809): its segment passes 46.4 m from the
//   circuit's middle, its nodes are all 61 m or more away (tools/proga-podatki.py keeps a road by its nodes, so it left this one out); laid as
//   the service roads are, as far as 80 m from the circuit (where tools/proga-podatki.py clips the roads it keeps) and to its junction with
//   the service road w185557425. The two mouths of the private service road's underpass under the last corner (highway=service tunnel=yes
//   layer=-1 w185557424, 25 m long): the cutting's low concrete walls on both sides, the headwall across, the floor darkening to the tunnel.
// Kept open: the circuit, its run-offs and barriers: the outer mouth stops 1.5 m beyond the barrier (OSM's tunnel end is 10 m from the middle,
//   inside the barrier at 13.5 m), the inner one at OSM's tunnel end (3 m beyond the barrier). The road kept clear: of the fans' lots
//   (js/world-rbring.js lays them on the land cover's built-up cells: 4 of the 41 stood on it), of the trees and the people.
// Not drawn again: the circuit and its pit lane (w113961777, w185557426, w185557423: js/world-rbring.js), the service roads (w185557421,
//   w185557422, w185557425, w306992339: def.sk.svc in js/world-batangas.js), the 27 buildings (def.sk.bld).
// Not drawn at all: the link across the infield (w306992337: inside the barriers all its length), the residential street w889990273 and the
//   service road w1038679483 (61.7 m and 68.6 m away: farther than 60 m), the outlines of the sports centre and the resort (no names, no
//   signs), the three buildings by the main straight (the pit building and the grandstand stand there).
// Assumed: the road 7 m wide (2 lanes, no width= in OSM) and without lines (OSM maps none); the ground is not cut (the elevation model's
//   stays): the walls 0.9 m above the ground (the headwall 1 m), 0.3 m thick, the mouth 5 m wide (the service road's own width).
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.batangas;
  if (!LK || typeof LK.extra !== 'function') return;
  // x east, z south; m from the start line
  const ROAD = [[85.3, 49.1], [131.1, 16.0], [159.0, -4.2], [161.1, -5.7], [293.8, -101.1]];   // w28397809: from 80 m, nearest (46.4 m) at (227.4, -53.4), to the junction
  const TUN = [[193.5, -200.9, 1.5], [172.6, -187.0, 0]];   // w185557424's ends [x, z, the mouth's end: m beyond the barrier at least]: outside the corner, inside it
  const HW = 3.5, SVC = 2.5, COL = [0.9, 0.9, 0.92], DARK = [0.13, 0.13, 0.14], CONC = [0.64, 0.63, 0.6], TOP = [0.72, 0.71, 0.68];   // (COL: the service roads' asphalt)
  const base = LK.extra, bBase = LK.build;
  LK.extra = function (o) { const st = base(o) || {}; add(o, st); return st; };
  LK.build = function (o) { if (bBase) bBase(o); keepLots(o.exclPush); };

  // the lots off the road: js/world-rbring.js lays them before LK.extra, on the middles of the land cover's built-up cells where nothing is
  // excluded (campLot in js/world.js: up to 10.5 m from the middle); a keep-out of 0.5 m on each such middle 14 m or less from the road's
  function keepLots(exclPush) {
    const P = A.NR, LC = P && P.L; if (!LC || !P.lc || typeof exclPush !== 'function') return;
    const xs = ROAD.map(p => p[0]), zs = ROAD.map(p => p[1]), K = 14;
    const i0 = Math.max(0, Math.floor((Math.min(...xs) - K - LC.x0) / LC.cell)), i1 = Math.min(LC.nx - 1, Math.floor((Math.max(...xs) + K - LC.x0) / LC.cell));
    const j0 = Math.max(0, Math.floor((Math.min(...zs) - K - LC.z0) / LC.cell)), j1 = Math.min(LC.nz - 1, Math.floor((Math.max(...zs) + K - LC.z0) / LC.cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (P.lc[j * LC.nx + i] !== 3) continue;
      const x = LC.x0 + (i + 0.5) * LC.cell, z = LC.z0 + (j + 0.5) * LC.cell;
      if (dRoad(x, z) <= K) exclPush(x, z, 0.5);
    }
  }
  function dRoad(x, z) {
    let m = Infinity;
    for (let q = 0; q + 1 < ROAD.length; q++) {
      const [ax, az] = ROAD[q], [bx, bz] = ROAD[q + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      m = Math.min(m, Math.hypot(x - ax - t * dx, z - az - t * dz));
    }
    return m;
  }

  // a point every `step` m along a polyline, as js/world-batangas.js lays its service roads
  function dense(P, step) {
    const pts = [];
    for (let q = 0; q + 1 < P.length; q++) {
      const [ax, az] = P[q], [bx, bz] = P[q + 1], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
      for (let t = 0; t < m; t++) pts.push([ax + (bx - ax) * t / m, az + (bz - az) * t / m]);
    }
    pts.push(P[P.length - 1]);
    return pts;
  }
  // the service road (def.sk.svc: n, x, z, ...) that ends at (x, z), from its far end to there
  function way(S, x, z) {
    for (let k = 0; k < S.length;) {
      const n = S[k], p = []; for (let q = 0; q < n; q++) p.push([S[k + 1 + q * 2], S[k + 2 + q * 2]]); k += 1 + n * 2;
      if (n < 2) continue;
      if (Math.hypot(p[n - 1][0] - x, p[n - 1][1] - z) < 1) return p;
      if (Math.hypot(p[0][0] - x, p[0][1] - z) < 1) return p.reverse();
    }
    return null;
  }

  function add(o, st) {
    const { root, scen, exclPush, CR, tex } = o, { RB, nrGround, nrNear, box } = A, rb = new RB(true);
    const off = (n) => n.i < 0 || n.dd >= 4 + SVC;   // where js/world-batangas.js draws a service road (6.5 m beyond the barrier)
    const rowAt = (x, z, nx, nz, w, y0, c, along) => {
      const row = [-w, 0, w].map(f => { const px = x + nx * f, pz = z + nz * f; return [px, nrGround(px, pz) + y0, pz]; });
      return rb.row(row, [c, c, c], row.map((e, j) => [j * w / 4, along / 4]));
    };

    // the secondary road: 7 m of asphalt (a little below the service road where they meet)
    let pts = dense(ROAD, 4), prev = -1, along = 0, len = 0;
    for (let q = 0; q < pts.length; q++) {
      const [x, z] = pts[q], a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)], dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1;
      if (q) along += Math.hypot(x - pts[q - 1][0], z - pts[q - 1][1]);
      const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 4 + HW) { prev = -1; continue; }
      const r = rowAt(x, z, -dz / dl, dx / dl, HW, 0.05, COL, along);
      if (prev >= 0) { rb.link(prev, r, 0, 2); len += Math.hypot(x - pts[q - 1][0], z - pts[q - 1][1]); }
      prev = r;
      exclPush(x, z, HW + 1.5); if (nn.i >= 0 && nn.dd < 70) CR.avoid(x, z, HW + 0.5);   // (every 4 m: the trees off the asphalt's edges too)
    }
    st.secondary = Math.round(len);

    // the underpass's two mouths: from where the service road's strip ends to the tunnel (or 1.5 m short of the barrier)
    const S = ((A.T && A.T.def && A.T.def.sk) || {}).svc || [];
    let mouths = 0;
    for (const [tx, tz, stop] of TUN) {
      const P = way(S, tx, tz); if (!P) continue;
      pts = dense(P, 4);
      let j = pts.length - 1; while (j >= 0 && !off(nrNear(pts[j][0], pts[j][1]))) j--;
      if (j < 1 || j === pts.length - 1) continue;
      const M = [];   // the mouth's middle, a point a metre
      for (const p of dense(pts.slice(j), 1)) { const n = nrNear(p[0], p[1]); if (M.length && n.i >= 0 && n.dd < stop) break; M.push(p); }
      if (M.length < 3) continue;
      const tot = (M.length - 1) || 1;
      prev = -1;
      for (let i = 0; i < M.length; i++) {
        const [x, z] = M[i], a = i ? M[i - 1] : pts[j - 1], b = i ? M[Math.min(M.length - 1, i + 1)] : pts[j + 1], dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1;   // (the first row: the service road's last, as js/world-batangas.js lays it)
        const f = Math.pow(i / tot, 0.75), c = COL.map((v, k) => v + (DARK[k] - v) * f);
        const r = rowAt(x, z, -dz / dl, dx / dl, SVC, 0.08, c, i);
        if (prev >= 0) rb.link(prev, r, 0, 2);
        prev = r;
      }
      for (let i = 0; i + 1 < M.length; i += 2) {   // the walls, 2 m at a time
        const p = M[i], q = M[Math.min(M.length - 1, i + 2)], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz); if (L < 0.2) continue;
        const ux = dx / L, uz = dz / L, cx = (p[0] + q[0]) / 2, cz = (p[1] + q[1]) / 2, rot = Math.atan2(uz, ux);
        for (const sd of [-1, 1]) { const wx = cx - uz * sd * (SVC + 0.15), wz = cz + ux * sd * (SVC + 0.15); box(scen.get(wx, wz), wx, nrGround(wx, wz) - 0.4, wz, L + 0.04, 1.3, 0.3, rot, CONC, TOP, true); }
        exclPush(cx, cz, SVC + 1.5); CR.avoid(cx, cz, SVC + 0.5);
      }
      const h = M[M.length - 1], g = M[M.length - 2], dx = h[0] - g[0], dz = h[1] - g[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, cx = h[0] + ux * 0.15, cz = h[1] + uz * 0.15;
      box(scen.get(cx, cz), cx, nrGround(cx, cz) - 0.4, cz, 2 * (SVC + 0.3), 1.4, 0.3, Math.atan2(uz, ux) + Math.PI / 2, CONC, TOP, true);   // the headwall
      exclPush(h[0], h[1], SVC + 1.5); CR.avoid(h[0], h[1], SVC + 0.5);
      mouths++;
    }
    st.underpass = mouths;

    if (rb.empty) return;
    const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'batangas secondary road, underpass mouths'; root.add(m);
  }
})();
