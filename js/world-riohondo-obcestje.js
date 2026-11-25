/* =====================================================================================================================================
   WORLD — Termas de Río Hondo, Argentina: what stands by the circuit on the plain (grafika ob progi), from OpenStreetMap, on
   js/world-riohondo.js (the builder's hook LK.extra wrapped: what is here is laid out first, so the monte's trees and the crowds keep
   clear of it, then js/world-riohondo.js's own parts: the service roads, the lake, the horizon).
   Drawn: the mobile phone mast north-west of the circuit (OSM n4046808828, man_made=mast, tower:type=communication, 185 m from the
     track): a slender triangular lattice mast held by three sets of guy wires, three panel antennas at its top; the weather radar
     south-east of the circuit (OSM n10860838021, man_made=tower, tower:type=radar, 163 m from the track): a square lattice tower with a
     platform as wide as the dome and the white dome of the radar on it; the three residential streets by the circuit (OSM highway=residential w170936293,
     w341878325, w692872515), as OSM runs them, earth (no surface tag: assumed unpaved, like the one residential street OSM tags here).
     Sizes (OSM has no height, width or material here: assumed): the mast 30 m, its faces 0.6 m, galvanised steel, its guys anchored
     18 m out at 120 degrees; the radar's tower 24 m, 3.2 m wide at its foot and 2.4 m at the top, its dome 8 m across; the streets 6 m.
   Kept open (docs/realizem.md: only from sources): no street within 15 m of the track (its run-offs and lawns: the builder's own); the
     ground round the foot of the mast and the tower (no trees, no people).
   Not drawn: the houses along the streets, their fences and gates (another time); the operator's name and the radar's network's name
     (no names, docs: Pravna varnost).
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-23; metres, origin = the start line, x east, z south
   (tools/riohondo/riohondo.json's lat0/lon0); tools/obcestje/riohondo.data.json.
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.riohondo;
  if (!LK || typeof LK.extra !== 'function') return;

  const STREETS = [   // x, z, ... (OSM w170936293, w341878325, w692872515)
    [191.9, 283.5, 430.6, 337.1, 513.9, 351.3, 544.1, 353.0, 557.5, 352.3, 569.3, 350.5, 602.7, 341.9, 628.8, 331.5, 649.5, 319.9, 687.3, 293.2, 729.4, 259.0, 829.3, 168.6],
    [705.2, 85.4, 262.8, -10.7, 257.7, -10.2, 253.7, -6.0, 250.5, 5.5, 191.9, 283.5, 167.0, 403.6, 150.8, 491.3],
    [542.1, 285.9, 523.1, 283.2, 206.2, 215.7]
  ];
  const MAST = [152.3, 315.1], RADAR = [1027.7, -1038.5];
  const GALV = [0.68, 0.7, 0.72], GALV_D = [0.56, 0.58, 0.6], GUY = [0.42, 0.43, 0.44], WHITE = [0.97, 0.97, 0.96], PANEL = [0.9, 0.9, 0.88];
  const EARTH = [0.9, 0.82, 0.74], SW = 3;   // (the streets: pale grey-brown earth on the sand texture; half their width)
  const hash = (i, j) => { let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  // a square beam from a to b in any direction (a leg, a brace, a guy): its four sides
  function beam(g, a, b, r, col) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1; d[0] /= L; d[1] /= L; d[2] /= L;
    let u = Math.abs(d[1]) < 0.9 ? [-d[2], 0, d[0]] : [1, 0, 0];   // (across: horizontal for the guys and braces, x for the legs)
    const ul = Math.hypot(u[0], u[1], u[2]); u = u.map(e => e / ul);
    const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const P = (p, s, t) => [p[0] + (u[0] * s + v[0] * t) * r, p[1] + (u[1] * s + v[1] * t) * r, p[2] + (u[2] * s + v[2] * t) * r];
    for (const [s0, t0, s1, t1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) g.quadO(P(a, s0, t0), P(a, s1, t1), P(b, s1, t1), P(b, s0, t0), col, mid);
  }

  // a lattice of n legs from y0 to y0 + h, its corners at radius r0 at the foot and r1 at the top: the legs, a ring every 'step' metres
  // and a diagonal brace on each face between the rings (zig-zag)
  function lattice(g, x, y0, z, n, r0, r1, h, step, rot, rLeg, rBr, col) {
    const C = (k, y) => { const t = (y - y0) / h, r = r0 + (r1 - r0) * t, a = rot + k / n * Math.PI * 2; return [x + Math.cos(a) * r, y, z + Math.sin(a) * r]; };
    for (let k = 0; k < n; k++) beam(g, C(k, y0 - 0.3), C(k, y0 + h), rLeg, col);
    const m = Math.max(1, Math.round(h / step));
    for (let i = 0; i <= m; i++) {
      const y = y0 + h * i / m, yn = y0 + h * (i + 1) / m;
      for (let k = 0; k < n; k++) {
        beam(g, C(k, y), C((k + 1) % n, y), rBr, col);
        if (i < m) { const zz = (i + k) % 2; beam(g, C(zz ? k : (k + 1) % n, y), C(zz ? (k + 1) % n : k, yn), rBr, col); }
      }
    }
    return C;
  }

  const base = LK.extra;
  LK.extra = function (o) { const mine = lay(o); const st = base(o) || {}; st.roadside = mine; return st; };

  function lay(o) {
    const { root, scen, exclPush, excluded, CR, tex } = o, { RB, box, cyl, nrGround, nrNear } = A;
    const st = { streets: 0, streetM: 0, mast: 0, radar: 0, meshes: 0 };
    const past = (x, z, m) => { const n = nrNear(x, z); return n.i < 0 || n.dd >= m; };
    const later = [], keep = (x, z, r) => later.push(x, z, r), free = (x, z) => !(excluded && excluded(x, z));
    const TILE = 240, tiles = new Map();
    const rbAt = (x, z) => { const key = Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let rb = tiles.get(key); if (!rb) tiles.set(key, rb = new RB(true)); return rb; };

    // the streets: an earth ribbon on the ground, cut where it comes within 15 m of the track
    for (const W of STREETS) {
      const pts = [], U = 3;
      for (let q = 0; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 2.5));
        for (let t = q > 0 ? 1 : 0; t <= m; t++) pts.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
      }
      let prev = null, pi = -1, prb = null, along = 0, pAl = 0;
      for (let k = 0; k < pts.length; k += 2) {
        const x = pts[k], z = pts[k + 1];
        if (k) along += Math.hypot(x - pts[k - 2], z - pts[k - 1]);
        if (!past(x, z, 15) || !free(x, z)) { prev = null; continue; }
        const k0 = Math.max(0, k - 2), k1 = Math.min(pts.length - 2, k + 2), dx = pts[k1] - pts[k0], dz = pts[k1 + 1] - pts[k0 + 1], dl = Math.hypot(dx, dz) || 1;
        const nx = -dz / dl, nz = dx / dl, f = 0.92 + 0.14 * hash(Math.round(x / 4), Math.round(z / 4)), c = EARTH.map(v => v * f);
        const row = [-SW, SW].map(e => [x + nx * e, nrGround(x + nx * e, z + nz * e) + 0.1, z + nz * e]);
        const cols = [c, c], uvs = [[-SW / U, along / U], [SW / U, along / U]], rb = rbAt(x, z);
        if (prev && rb !== prb) pi = rb.row(prev[0], prev[1], prev[2]);
        const r = rb.row(row, cols, uvs);
        if (prev) { rb.link(pi, r, 0, 1); st.streetM += along - pAl; } else st.streets++;
        prev = [row, cols, uvs]; pi = r; prb = rb; pAl = along; keep(x, z, SW + 1);
        const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 70) CR.avoid(x, z, SW + 0.5);
      }
    }

    // the mast: a triangular lattice, 30 m, guyed at 10, 20 and 28 m to three anchors 18 m out; three panel antennas at the top
    {
      const [x, z] = MAST, g = scen.get(x, z), y = nrGround(x, z), H = 30, rc = 0.6 / Math.sqrt(3), rot = 0.35;
      box(g, x, y - 0.3, z, 1.4, 0.5, 1.4, rot, [0.74, 0.73, 0.7], [0.78, 0.77, 0.74], true);   // (the concrete footing)
      lattice(g, x, y + 0.2, z, 3, rc, rc, H, 1.2, rot, 0.04, 0.015, GALV);
      for (let k = 0; k < 3; k++) {
        const a = rot + k / 3 * Math.PI * 2 + Math.PI / 3, ax = x + Math.cos(a) * 18, az = z + Math.sin(a) * 18, ay = nrGround(ax, az);
        box(g, ax, ay - 0.3, az, 0.8, 0.5, 0.8, a, [0.74, 0.73, 0.7], [0.78, 0.77, 0.74], true);   // (the guy's anchor block)
        for (const hh of [10, 20, 28]) beam(g, [ax, ay + 0.2, az], [x + Math.cos(a) * rc, y + 0.2 + hh, z + Math.sin(a) * rc], 0.012, GUY);
        CR.avoid(ax, az, 2.5); keep(ax, az, 2.5);
        for (let t = 0.3; t < 1; t += 0.3) keep(x + (ax - x) * t, z + (az - z) * t, 2);   // (no tree in the guys)
        const pa = rot + k / 3 * Math.PI * 2, px = x + Math.cos(pa) * (rc + 0.25), pz = z + Math.sin(pa) * (rc + 0.25);
        box(g, px, y + H - 2.2, pz, 0.12, 1.6, 0.35, pa, PANEL, PANEL, false);   // (a panel antenna on its pipe)
        beam(g, [x + Math.cos(pa) * rc, y + H - 1.8, z + Math.sin(pa) * rc], [px, y + H - 1.8, pz], 0.02, GALV_D);
      }
      cyl(g, x, y + 0.2 + H, z, 0.03, 1.6, 4, GALV_D);   // (the lightning rod)
      keep(x, z, 4); CR.avoid(x, z, 4); st.mast = 1;
    }

    // the weather radar: a square lattice tower, 24 m, a platform with a rail round it, the white dome (8 m) on it
    {
      const [x, z] = RADAR, g = scen.get(x, z), y = nrGround(x, z), H = 24, r0 = 3.2 / Math.SQRT2, r1 = 2.4 / Math.SQRT2, rot = Math.PI / 4;
      for (let k = 0; k < 4; k++) { const a = rot + k * Math.PI / 2; box(g, x + Math.cos(a) * r0, y - 0.3, z + Math.sin(a) * r0, 0.7, 0.5, 0.7, 0, [0.74, 0.73, 0.7], [0.78, 0.77, 0.74], true); }
      lattice(g, x, y + 0.2, z, 4, r0, r1, H, 3, rot, 0.08, 0.035, GALV);
      const yp = y + 0.2 + H;
      box(g, x, yp, z, 8.4, 0.3, 8.4, 0, GALV_D, [0.6, 0.61, 0.62], false);   // (the platform, the dome's width)
      for (const [ax, az, bx, bz] of [[-4.2, -4.2, 4.2, -4.2], [4.2, -4.2, 4.2, 4.2], [4.2, 4.2, -4.2, 4.2], [-4.2, 4.2, -4.2, -4.2]]) {
        beam(g, [x + ax, yp + 1.4, z + az], [x + bx, yp + 1.4, z + bz], 0.025, GALV); beam(g, [x + ax, yp + 0.3, z + az], [x + ax, yp + 1.4, z + az], 0.025, GALV);
      }
      // the dome: a sphere 8 m across cut a little below its middle, on a short white plinth; bands of 14 sides
      const R = 4, yc = yp + 0.3 + 0.6 + R * 0.55, N = 7;
      cyl(g, x, yp + 0.3, z, R * 0.8, 0.6, 14, WHITE);
      for (let i = 0; i < N; i++) {
        const t0 = -0.55 + (1.55 * i) / N, t1 = -0.55 + (1.55 * (i + 1)) / N, a0 = Math.asin(Math.max(-1, Math.min(1, t0))), a1 = Math.asin(Math.max(-1, Math.min(1, t1)));
        const ra = R * Math.cos(a0), rb = R * Math.cos(a1), ya = yc + R * Math.sin(a0), yb = yc + R * Math.sin(a1), sh = 0.9 + 0.1 * (i / N);
        cyl(g, x, ya, z, ra, yb - ya, 14, WHITE.map(v => v * sh), i === N - 1 ? WHITE : null, rb);
      }
      keep(x, z, 5); CR.avoid(x, z, 5); st.radar = 1;
    }

    for (let k = 0; k < later.length; k += 3) exclPush(later[k], later[k + 1], later[k + 2]);
    if (tiles.size) {
      const mat = new THREE.MeshLambertMaterial({ map: tex.sand, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
      for (const rb of tiles.values()) { if (rb.empty) continue; const m = new THREE.Mesh(rb.geometry(), mat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'roadside-streets'; root.add(m); st.meshes++; }
    }
    return st;
  }
})();
