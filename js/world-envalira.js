/* =========================================================================
   WORLD — Envalira, Andora (theme 'envalira'): the ice circuit at 2,370 m under the Port d'Envalira (2,408 m), above Pas de la Casa, its own parts on
   the shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.envalira) goes on API.rbLook;
   World.ext.envalira builds it with World.ext.rbring. The track: docs/proge/envalira.md (data: tools/envalira/).
   Its own parts: snow all round it in every season (out.forceSeason: the render paints the world in winter), the banks of ploughed snow
   along both edges of the ice instead of walls (LK.allWall, LK.wallLook), the road's ice pale blue-white, the few buildings by it (def.sk.bld:
   OpenStreetMap) under snow; no trees (above the tree line), hardly anyone watching; the Andorran flag on the podium. Round it, as OSM has
   them (def.sk: road, park, pist, pow, can, side; tools/envalira/osm-okolica.json): the CG-2 pass road, the service roads, the car parks,
   the pistes' marker poles, the 110 kV line and the lighter ones on lattice towers, the two fuel canopies (plain, no firm's colours), the
   ring's side loops under snow; and as on a race day: floodlights on the outside, race control on the building by the start, pit doors
   in the next one, one small wooden stand (8 people), three marshal posts with yellow flags, a snowcat. Only place names on its boards
   (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { box, cyl, lerp, nrGround, rng } = API;
  // the text boards: place names only (the pass, the village below it, the country), the start line's
  const EV_BAN = [['ENVALIRA', '#1d3f8e', '#fff', '#f2c21a'], ['PORT D\'ENVALIRA', '#1d3f8e', '#fff', '#d0103a'], ['START', '#16181c', '#fff', '#d0103a'], ['ANDORRA', '#d0103a', '#fff', '#f2c21a'],
    ['PAS DE LA CASA', '#1d3f8e', '#fff', '#f2c21a'], ['GRAU ROIG', '#1d3f8e', '#fff', '#d0103a'], ['CANILLO', '#245a8a', '#fff', '#fff'], ['PIRINEUS', '#245a8a', '#fff', '#f2c21a']];
  const EV_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const EV_SHIRTS = [[0.86, 0.14, 0.18], [0.95, 0.95, 0.93], [0.2, 0.36, 0.72], [0.95, 0.78, 0.12], [0.3, 0.6, 0.86], [0.92, 0.45, 0.12], [0.62, 0.64, 0.68], [0.8, 0.2, 0.5]];   // (ski jackets: bright)
  const AD = { grid: [[0, 8 / 25, 17 / 25, 1], [0, 1], [[[0.07, 0.24, 0.62], [0.98, 0.82, 0.08], [0.82, 0.06, 0.2]]]] };   // the Andorran flag: blue, yellow (a little wider), red, the blue at the pole
  // the banks of ploughed snow along the ice (LK.wallLook): white with a blue shade at the foot, a little higher in the corners' outsides
  const SNOW = [[0.78, 0.82, 0.9], [0.9, 0.92, 0.97], [0.95, 0.96, 0.99], [0.99, 0.99, 1], [0.96, 0.97, 1]];
  // the road's ice: pale blue-white, worn darker where the cars run (the tint of the asphalt's material: the render leaves the road's
  // materials alone in every season)
  const ICE = [2.0, 2.2, 2.55];   // (over the asphalt's dark picture: brighter than 1)

  // a thin square beam from A to B (r: its half-width), its four sides facing away from its axis (as js/world-gudauri-obcestje.js)
  function beam(g, A, B, r, col) {
    const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], L = Math.hypot(dx, dy, dz) || 1, ex = dx / L, ey = dy / L, ez = dz / L;
    let ux = -ez, uy = 0, uz = ex; if (Math.hypot(ux, uz) < 0.1) { ux = 0; uy = ez; uz = -ey; }
    const l = Math.hypot(ux, uy, uz); ux /= l; uy /= l; uz /= l;
    const vx = ey * uz - ez * uy, vy = ez * ux - ex * uz, vz = ex * uy - ey * ux, M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
    const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => [(ux * a + vx * b) * r, (uy * a + vy * b) * r, (uz * a + vz * b) * r]);
    for (let k = 0; k < 4; k++) { const p = C[k], q = C[(k + 1) % 4];
      g.quadO([A[0] + p[0], A[1] + p[1], A[2] + p[2]], [B[0] + p[0], B[1] + p[1], B[2] + p[2]], [B[0] + q[0], B[1] + q[1], B[2] + q[2]], [A[0] + q[0], A[1] + q[1], A[2] + q[2]], col, M); }
  }
  const pairs = (a, o = 0) => { const P = []; for (let k = o; k + 1 < a.length; k += 2) P.push([a[k], a[k + 1]]); return P; };
  // the colours by the ring (no logos, no firms' colours: the fuel stations plain white and grey)
  const C = { road: [0.3, 0.31, 0.33], line: [0.92, 0.92, 0.9], packed: [0.8, 0.82, 0.86], side: [0.86, 0.9, 0.96], bank: [0.96, 0.97, 1.0],
    steel: [0.56, 0.58, 0.61], wire: [0.36, 0.37, 0.4], conc: [0.7, 0.7, 0.68], white: [0.93, 0.93, 0.92], glass: [0.42, 0.56, 0.68],
    door: [0.74, 0.76, 0.8], hut: [0.94, 0.94, 0.92], orange: [0.95, 0.48, 0.1], cat: [0.84, 0.16, 0.14], track: [0.36, 0.37, 0.4], wood: [0.62, 0.52, 0.4],
    pist: [[0.2, 0.62, 0.3], [0.12, 0.36, 0.82], [0.84, 0.12, 0.14], [0.2, 0.2, 0.22]], lamp: [1.0, 0.98, 0.88], yellow: [0.98, 0.84, 0.1] };

  // LK.extra: what stands by the circuit, after OpenStreetMap (def.sk: tools/envalira/build.py), in a race day's order of things:
  // the buildings (OSM outlines as boxes under snow), the pass road (CG-2) ploughed between its banks, the service roads and the car parks of
  // packed snow, the ring's other ways under snow (closed by its banks), the pistes' marker poles, the 110 kV line and the lighter lines on
  // their lattice towers, the fuel stations' roofs over their pumps, the ring's floodlights (lit=yes), race control and the pits in its
  // buildings, a small stand with few people, the marshals' posts, a snowcat. All into the scenery's chunks (no draws of their own).
  function evExtra({ scen, exclPush, excluded, CR }) {
    const T = API.T, sk = T.def.sk || {}, R = rng(7231), st = { buildings: 0, road: 0, park: 0, side: 0, piste: 0, tower: 0, wire: 0, canopy: 0, flood: 0, stand: 0, people: 0, post: 0, cat: 0 };
    const dm = T.def.dem || { x0: -1e4, z0: -1e4, nx: 1e3, nz: 1e3, cell: 20 }, inDem = (x, z) => x > dm.x0 + 8 && z > dm.z0 + 8 && x < dm.x0 + dm.nx * dm.cell - 8 && z < dm.z0 + dm.nz * dm.cell - 8;
    const N = T.N, ringD = (x, z) => { let b = 1e9; for (let i = 0; i < N; i += 2) { const d = (x - T.px[i]) ** 2 + (z - T.pz[i]) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
    let mx = 0, mz = 0; for (let i = 0; i < N; i++) { mx += T.px[i] / N; mz += T.pz[i] / N; }
    const gy = (x, z) => nrGround(x, z), keep = (x, z, r) => { exclPush(x, z, r); CR.avoid(x, z, r); };
    const foot = (x, z, L, W, rot) => { const c = Math.cos(rot), s = Math.sin(rot); let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]]) y = Math.min(y, gy(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2)); return y; };
    const up = (A, B, Cc, D, col) => scen.get((A[0] + Cc[0]) / 2, (A[2] + Cc[2]) / 2).quadUp(A, B, Cc, D, [col, col, col, col]);
    const free = (x, z) => ringD(x, z) > 8.6;   // (beyond the ring's banks of snow)

    // the buildings: boxes on their lowest corner, roofs under snow
    const b6 = sk.bld || [], WALL = [[0.88, 0.86, 0.82], [0.62, 0.58, 0.52], [0.72, 0.66, 0.58], [0.8, 0.8, 0.8]], ROOF = [0.94, 0.95, 0.98], BL = [];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, y = foot(x, z, L, W, rot);
      box(scen.get(x, z), x, y - 0.6, z, L, h + 0.6, W, rot, WALL[Math.floor(R() * WALL.length)], ROOF, true);
      keep(x, z, Math.hypot(L, W) / 2 + 2); BL.push({ x, z, L, W, rot, y, h, d: ringD(x, z) }); st.buildings++;
    }

    // a ribbon along a line (w wide, lift over the ground; its cells within the ring's banks left out), with a bank of ploughed snow along each
    // edge (bank: its height) and lines (lines: the edges' and the middle's dashes)
    function ribbon(pts, w, col, lift, bank, lines) {
      const Q = [];   // (the line cut to 5 m steps)
      for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 5)); for (let j = 0; j < n; j++) Q.push([lerp(ax, bx, j / n), lerp(az, bz, j / n)]); }
      Q.push(pts[pts.length - 1]); let n = 0;
      const at = (j, o, l) => { const a = Q[Math.max(0, j - 1)], b = Q[Math.min(Q.length - 1, j + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, x = Q[j][0] - (b[1] - a[1]) / L * o, z = Q[j][1] + (b[0] - a[0]) / L * o; return [x, gy(x, z) + l, z]; };
      for (let j = 0; j + 1 < Q.length; j++) {
        const cx = (Q[j][0] + Q[j + 1][0]) / 2, cz = (Q[j][1] + Q[j + 1][1]) / 2;
        if (!inDem(cx, cz) || ringD(cx, cz) < 7.6 + w / 2) continue;
        const hw = w / 2; up(at(j, -hw, lift), at(j + 1, -hw, lift), at(j + 1, hw, lift), at(j, hw, lift), col); n++;
        if (bank) for (const sd of [-1, 1]) {   // (the bank: up from the edge to its top 1 m out, down to the snow 2.4 m out)
          const e = sd * hw, t = sd * (hw + 1.0), f = sd * (hw + 2.4), A = at(j, e, lift), B = at(j + 1, e, lift), Ct = at(j, t, bank), Dt = at(j + 1, t, bank), Ef = at(j, f, 0), Ff = at(j + 1, f, 0);
          if (sd > 0) { up(A, B, Dt, Ct, C.bank); up(Ct, Dt, Ff, Ef, C.bank); } else { up(Ct, Dt, B, A, C.bank); up(Ef, Ff, Dt, Ct, C.bank); }
        }
        if (lines) { for (const sd of [-1, 1]) { const o = sd * (hw - 0.35); up(at(j, o - 0.07, lift + 0.012), at(j + 1, o - 0.07, lift + 0.012), at(j + 1, o + 0.07, lift + 0.012), at(j, o + 0.07, lift + 0.012), C.line); }
          if (lines > 1 && j % 2 === 0) up(at(j, -0.07, lift + 0.012), at(j + 1, -0.07, lift + 0.012), at(j + 1, 0.07, lift + 0.012), at(j, 0.07, lift + 0.012), C.line); }
      }
      return n;
    }
    for (const r of sk.road || []) {   // the pass road (kind 0: asphalt, ploughed, its lines) and the service roads, the driveways (packed snow)
      const kind = r[0], w = r[1] / 10, P = pairs(r, 2);
      st.road += kind === 0 ? ribbon(P, w, C.road, 0.08, 1.1, 2) : ribbon(P, w, C.packed, 0.06, kind === 1 ? 0.7 : 0, 0);
    }
    for (const sd of sk.side || []) st.side += ribbon(pairs(sd), 10, C.side, 0.05, 0, 0);   // the ring's other ways: under snow, its banks across them
    for (const pk of sk.park || []) {   // the car parks: packed snow on 4 m cells, banks of ploughed snow at their edges
      const poly = pairs(pk); let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of poly) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
      for (let x = x0; x < x1; x += 4) for (let z = z0; z < z1; z += 4) {
        if (!API.inPoly(poly, x + 2, z + 2) || !free(x + 2, z + 2)) continue;
        up([x, gy(x, z) + 0.05, z], [x, gy(x, z + 4) + 0.05, z + 4], [x + 4, gy(x + 4, z + 4) + 0.05, z + 4], [x + 4, gy(x + 4, z) + 0.05, z], C.packed); st.park++;
      }
      st.park += ribbon(poly.concat([poly[0]]), 0.01, C.packed, 0.04, 0.9, 0);
    }

    // the pistes: marker poles (1.8 m, the piste's colour by its difficulty: green, blue, red, black) along an area's edge every 22 m, along
    // a line's both sides 12 m out every 30 m
    for (const p of sk.pist || []) {
      const col = C.pist[p[0]] || C.pist[1], area = p[1], P = pairs(p, 2), step = area ? 22 : 30; let run = 0;
      for (let k = 0; k + 1 < P.length; k++) {
        const [ax, az] = P[k], [bx, bz] = P[k + 1], L = Math.hypot(bx - ax, bz - az) || 1;
        for (let d = (step - run) % step; d < L; d += step) {
          const x = lerp(ax, bx, d / L), z = lerp(az, bz, d / L), nx = -(bz - az) / L, nz = (bx - ax) / L;
          for (const o of area ? [0] : [-12, 12]) { const px = x + nx * o, pz = z + nz * o; if (!inDem(px, pz) || !free(px, pz) || excluded(px, pz)) continue;
            const g = scen.get(px, pz), y = gy(px, pz) - 0.2; cyl(g, px, y, pz, 0.035, 2.0, 4, col, col); cyl(g, px, y + 1.55, pz, 0.045, 0.3, 4, C.orange, C.orange); st.piste++; }
        }
        run = (run + L) % step;
      }
    }

    // the power lines: the 110 kV line (kind 0: 3 cables on a lattice tower of 26 m, the arms across the line) and the lighter lines
    // (kind 1: towers of 14 m); the cables sag between the towers
    for (const ln of sk.pow || []) {
      const kind = ln[0], P = pairs(ln, 1), H = kind ? 14 : 26, b0 = kind ? 1.4 : 2.8, b1 = kind ? 0.45 : 0.8;
      const ATT = kind ? [[-2.6, H - 1.2], [2.6, H - 1.2], [0, H + 0.2]] : [[-4.2, H - 2.6], [-5.2, H - 8.6], [5.2, H - 8.6]];
      const tops = [];
      P.forEach(([x, z], k) => {
        const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, cx = -uz, cz = ux;
        const y = gy(x, z) - 0.3, g = scen.get(x, z), show = inDem(x, z);
        tops.push(ATT.map(([o, h]) => [x + cx * o, y + h - 1.6, z + cz * o]));
        if (!show) return;
        const NP = 5, lv = (j) => { const t = j / NP, r = lerp(b0, b1, Math.pow(t, 0.8)), hh = t * (ATT[1][1] + 0.6); return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([p, q]) => [x + (ux * p + cx * q) * r, y + hh, z + (uz * p + cz * q) * r]); };
        for (let j = 0; j < NP; j++) { const A = lv(j), B = lv(j + 1); for (let q = 0; q < 4; q++) { beam(g, A[q], B[q], kind ? 0.06 : 0.1, C.steel); beam(g, B[q], B[(q + 1) % 4], 0.04, C.steel); beam(g, A[q], B[(q + 1) % 4], 0.035, C.steel); } }
        const T0 = lv(NP); beam(g, [x, T0[0][1], z], [x, y + H + 0.6, z], kind ? 0.12 : 0.2, C.steel);   // (the peak over the top arm)
        for (const [o, h] of ATT) if (o) { beam(g, [x, y + h, z], [x + cx * o, y + h, z + cz * o], kind ? 0.08 : 0.12, C.steel); beam(g, [x + cx * o, y + h, z + cz * o], [x + cx * o, y + h - 1.6, z + cz * o], 0.07, C.white); }
        keep(x, z, b0 + 2); st.tower++;
      });
      for (let k = 0; k + 1 < tops.length; k++) for (let c = 0; c < ATT.length; c++) {
        const A = tops[k][c], B = tops[k + 1][c], span = Math.hypot(B[0] - A[0], B[2] - A[2]), sag = 0.03 * span, n = 10;
        if (!inDem(A[0], A[2]) && !inDem(B[0], B[2])) continue;
        for (let j = 0; j < n; j++) { const t0 = j / n, t1 = (j + 1) / n, p = (t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t) - 4 * sag * t * (1 - t), lerp(A[2], B[2], t)], P0 = p(t0), P1 = p(t1);
          if (inDem(P0[0], P0[2])) beam(scen.get(P0[0], P0[2]), P0, P1, 0.035, C.wire); }
        st.wire++;
      }
    }

    // the fuel stations: the roof on its columns (5 m up), under it two islands with two pumps each (plain, no firm's colours)
    for (const [x, z, L, W, deg] of sk.can || []) {
      const rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot), y = foot(x, z, L, W, rot), g = scen.get(x, z), P = (u, v) => [x + u * c - v * s, z + u * s + v * c];
      box(g, x, y + 4.9, z, L, 0.7, W, rot, C.white, ROOF, false);
      for (const u of [-0.32, 0.32]) for (const v of [-0.3, 0.3]) { const [px, pz] = P(u * L, v * W); cyl(g, px, y - 0.3, pz, 0.22, 5.3, 6, C.conc, C.conc); }
      for (const v of [-0.22, 0.22]) { const [ix, iz] = P(0, v * W); box(g, ix, y - 0.2, iz, L * 0.44, 0.38, 1.2, rot, C.conc, C.conc, true);
        for (const u of [-0.12, 0.12]) { const [px, pz] = P(u * L, v * W); box(g, px, y + 0.15, pz, 0.6, 1.75, 0.45, rot, C.white, C.white, true); box(g, px, y + 1.2, pz, 0.62, 0.38, 0.47, rot, C.glass, C.glass, true); } }
      keep(x, z, Math.hypot(L, W) / 2 + 1); st.canopy++;
    }

    // the ring's floodlights (OSM lit=yes): a mast of 13 m on the ring's outside every 60 m, 11 m from its middle, its lamps turned to the ice
    const ds = T.ds || 1, out = (i) => { const sx = T.px[i] + T.nx[i] * 3, sz = T.pz[i] + T.nz[i] * 3; return Math.hypot(sx - mx, sz - mz) > Math.hypot(T.px[i] - mx, T.pz[i] - mz) ? 1 : -1; };
    const step = Math.max(1, Math.round(60 / ds)), spots = [];
    for (let i = Math.round(12 / ds); i < N; i += step) {
      const sd = out(i), x = T.px[i] + T.nx[i] * sd * 11, z = T.pz[i] + T.nz[i] * sd * 11;
      if (excluded(x, z) || ringD(x, z) < 10) continue;
      const g = scen.get(x, z), y = gy(x, z) - 0.3, hx = -T.nx[i] * sd, hz = -T.nz[i] * sd;
      cyl(g, x, y, z, 0.2, 13.6, 6, C.steel, C.steel, 0.11);
      box(g, x + hx * 0.5, y + 13.2, z + hz * 0.5, 0.5, 0.9, 2.2, Math.atan2(hz, hx), C.steel, C.steel, false);
      box(g, x + hx * 0.78, y + 13.25, z + hz * 0.78, 0.08, 0.7, 2.0, Math.atan2(hz, hx), C.lamp, C.lamp, false);
      keep(x, z, 1.6); spots.push(i); st.flood++;
    }

    // race control and timing in the building nearest the start line (a glazed room on its roof, a mast), the pits in the next one (doors
    // along its face to the ring)
    const byD = BL.slice().sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
    if (byD[0]) { const b = byD[0], g = scen.get(b.x, b.z), top = b.y + b.h;
      box(g, b.x, top, b.z, Math.min(5, b.L * 0.5), 2.6, Math.min(4, b.W * 0.6), b.rot, C.glass, ROOF, true);
      box(g, b.x, top + 2.6, b.z, Math.min(5.6, b.L * 0.55), 0.25, Math.min(4.6, b.W * 0.65), b.rot, C.white, ROOF, true);
      cyl(g, b.x + Math.cos(b.rot) * 1.8, top + 2.85, b.z + Math.sin(b.rot) * 1.8, 0.05, 4.0, 4, C.steel, C.steel); st.control = 1; }
    const pit = BL.filter((b) => b !== byD[0] && b.L >= 12).sort((a, b) => a.d - b.d)[0];
    if (pit) { const c = Math.cos(pit.rot), s = Math.sin(pit.rot), nx = -s, nz = c, sd = ringD(pit.x + nx * pit.W, pit.z + nz * pit.W) < ringD(pit.x - nx * pit.W, pit.z - nz * pit.W) ? 1 : -1, g = scen.get(pit.x, pit.z);
      const n = Math.max(2, Math.floor(pit.L / 4.6)); for (let k = 0; k < n; k++) { const u = (k + 0.5 - n / 2) * pit.L / n, x = pit.x + c * u + nx * sd * (pit.W / 2 + 0.04), z = pit.z + s * u + nz * sd * (pit.W / 2 + 0.04);
        box(g, x, pit.y + 0.6, z, pit.L / n - 0.8, Math.min(3.4, pit.h - 0.4), 0.1, pit.rot, C.door, C.door, true); } st.pits = n; }

    // a small stand by the straight (scaffold and boards, 3 rows) on its outside, 15 m from the ring's middle, with a few people on it
    { const i = Math.round(45 / ds) % N, sd = out(i), x = T.px[i] + T.nx[i] * sd * 15, z = T.pz[i] + T.nz[i] * sd * 15, rot = Math.atan2(T.tz[i], T.tx[i]);
      if (!excluded(x, z)) { const g = scen.get(x, z), y = foot(x, z, 9, 4, rot), c = Math.cos(rot), s = Math.sin(rot), ox = T.nx[i] * sd, oz = T.nz[i] * sd;
        for (let r = 0; r < 3; r++) { const o = -1.2 + r * 1.2, bx = x + ox * o, bz = z + oz * o; box(g, bx, y + 0.45 * (r + 1), bz, 9, 0.12, 1.1, rot, C.wood, ROOF, false);
          for (const u of [-4.3, 0, 4.3]) cyl(g, bx + c * u, y - 0.2, bz + s * u, 0.05, 0.45 * (r + 1) + 0.2, 4, C.steel, C.steel); }
        box(g, x + ox * 1.9, y + 1.35, z + oz * 1.9, 9.2, 1.0, 0.08, rot, C.steel, C.steel, true);
        if (API.crowdPut) for (let k = 0; k < 8; k++) { const r = k % 3, u = -3.6 + k * 1.0 + R() * 0.3, o = -1.2 + r * 1.2, px = x + c * u + ox * o, pz = z + s * u + oz * o;
          if (API.crowdPut(CR, px, y + 0.45 * (r + 1) + 0.06, pz, -ox, -oz, { shirts: EV_SHIRTS, pose: 0 }, r)) st.people++; }
        keep(x, z, 6.5); st.stand = 1; } }

    // the marshals' posts: a hut (white, an orange stripe), a pole with a yellow flag, at a quarter of the lap each on the outside; a snowcat
    // parked by the large car park (its blade before it)
    for (const f of [0.22, 0.47, 0.72]) { const i = Math.round(f * N) % N, sd = out(i), x = T.px[i] + T.nx[i] * sd * 12.5, z = T.pz[i] + T.nz[i] * sd * 12.5;
      if (excluded(x, z)) continue; const g = scen.get(x, z), y = gy(x, z) - 0.2, rot = Math.atan2(T.tz[i], T.tx[i]);
      box(g, x, y, z, 2.2, 2.4, 1.8, rot, C.hut, ROOF, true); box(g, x, y + 1.5, z, 2.24, 0.3, 1.84, rot, C.orange, C.orange, true);
      const px = x + Math.cos(rot) * 1.6, pz = z + Math.sin(rot) * 1.6; cyl(g, px, y, pz, 0.04, 3.2, 4, C.steel, C.steel);
      box(g, px + Math.cos(rot) * 0.45, y + 2.75, pz + Math.sin(rot) * 0.45, 0.9, 0.6, 0.02, rot, C.yellow, C.yellow, true);
      keep(x, z, 2.6); st.post++; }
    { const pk = (sk.park || []).map(pairs).sort((a, b) => b.length - a.length)[0];
      if (pk) { let best = null; for (const [x, z] of pk) { const d = ringD(x, z); if (d > 14 && (!best || d < best[2])) best = [x, z, d]; }
        if (best) { const [x, z] = best, rot = Math.atan2(mz - z, mx - x), c = Math.cos(rot), s = Math.sin(rot), g = scen.get(x, z), y = foot(x, z, 6, 4, rot);
          for (const v of [-1.35, 1.35]) box(g, x - s * v, y, z + c * v, 4.8, 0.9, 1.1, rot, C.track, C.track, true);
          box(g, x, y + 0.8, z, 4.2, 0.9, 2.4, rot, C.cat, C.cat, true); box(g, x - c * 0.6, y + 1.7, z - s * 0.6, 1.9, 1.3, 2.2, rot, C.glass, C.cat, true);
          box(g, x + c * 3.0, y, z + s * 3.0, 0.3, 1.1, 4.4, rot, C.yellow, C.yellow, true); keep(x, z, 4.5); st.cat = 1; } } }
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    envalira: { ban: EV_BAN, at: EV_AT, nums: 0, shirts: EV_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.0, 1.0, 1.02], gravel: true, noVid: true, noAds: true,
      vg: [0.98, 0.99, 1.0], edge: [1.0, 1.0, 1.02], mow: 1e-3, ck: 2,   // (mow: no mowing stripes on the snow; ck: the short circuit much in view: bigger chunks, fewer draws)
      woods: { n: 1, geo: (k) => API.hjTreeGeo(1, k > 0), cr: [0.26, 0.33, 0.3], p: [0, 0, 0, 0], pick: () => [1, 6, 3] },   // (above the tree line: none)
      extra: evExtra, fl: { ad: AD },
      flags: { stand: [{ ad: 1 }], ga: { ad: 1 }, camp: { ad: 1 }, pole: 'ad', podium: 'ad' },
      vid: [], poles: [0, 0, -1], runoff: [], straight: [-8, 8, -1], fence: { sides: [], col: [1, 1, 1], top: 2 },
      allWall: true, wallLook: () => ({ c: SNOW, h: 1.0 }),
      farm: { wall: [0.88, 0.86, 0.82], roof: [0.94, 0.95, 0.98], end: [0.86, 0.84, 0.8], barn: [0.6, 0.56, 0.5], barnRoof: [0.94, 0.95, 0.98], barnEnd: [0.58, 0.54, 0.48] },
      tvSkip: [], recov: [], photo: [], jets: [[0.97, 0.97, 0.97], [0.97, 0.97, 0.97], [0.97, 0.97, 0.97]], air: false,
      colMod: (P) => (x, z, c) => {   // the snow over the pass: white, a blue shade in the hollows' noise, wind-blown ridges a little brighter
        const n = P.n5(x * 0.4 + 300, z * 0.4 - 120), m = P.n3(x * 1.4 - 80, z * 1.4 + 60), v = 0.94 + (n - 0.5) * 0.08 + (m - 0.5) * 0.05;
        c[0] = lerp(c[0], 0.93 * v, 0.85); c[1] = lerp(c[1], 0.95 * v, 0.85); c[2] = lerp(c[2], 1.0 * v, 0.85);
      } },
  });
  World.keep('NR', 'envalira');   // (its grids kept between its builds; World.build frees the others')
  World.ext.envalira = (scene, tex, opts) => {
    const out = World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
    if (out) {
      out.forceSeason = 'winter';   // (snow all year: js/render.js seasonWorld)
      if (out.asphaltMat && out.asphaltMat.color) out.asphaltMat.color.setRGB(ICE[0], ICE[1], ICE[2]);
    }
    return out;
  };
})();
