/* =====================================================================================================================================
   WORLD — Harju, Finska: the roadside (grafika ob progi), from OpenStreetMap, added to js/world-harju.js's own town things (its def.scen:
   the lamps, benches, bus stops, traffic lights, bollards, bins, the fountain, statues, notice boards, post boxes, fences, hedges, walls).
   Laid out by the builder's hook API.hjRoadside (called after the town's things, before the crowds and the trees: the trees keep clear of
   it, the spectators step round it), in the builder's own scenery chunks (no draw calls of its own).
   Drawn, within ~60 m of the stage, where OSM has them:
     the traffic signs on their poles (OSM traffic_sign, the Finnish codes of the old numbering): 511 the pedestrian crossing (a blue
       square, a white triangle, a black walker), 423 the shared cycle and foot path and 421 the footway (blue discs, white symbols), 521
       the parking place (a blue square, a white P), 575 and 576 the pedestrian street and its end (a blue plate, white walkers; the end
       crossed out in red); the symbols simplified to a few shapes; each faces the traffic on its side of the nearest stretch of the stage
       (OSM has no direction tags here); plates 0.64 m (the normal size), their lower edge 2.2 m up (assumed: over a footway);
     the three flagpoles by the memorial (OSM man_made=flagpole: white, 10 m, no flag: height assumed, OSM has none);
     the gates (OSM barrier=gate, sliding_gate: on a fence along it, on a path across it, 2 m; galvanised bars 1.3 m high: assumed);
     the cycle racks (OSM amenity=bicycle_parking: hoops every 0.8 m along the area's longest side; covered=yes: a roof over them);
     the playground's two swings, the plain and the basket swing (OSM playground=swing, basketswing; the beam along the playground's
       longest side: assumed), the fire pit's ring of stones, the recycling point's three containers (OSM recycling: glass bottles,
       paper, scrap metal), the stone block (barrier=block, material=stone), the wooden bandstand without a roof (leisure=bandstand,
       surface=wood) and the outdoor seating's tables and chairs (leisure=outdoor_seating).
   Not drawn: the signs OSM puts on lamp posts and at the bus stops (their poles are js/world-harju.js's), the signs of uncertain form
     (Finnish 331–374, 417, 418, F21.1: no source at hand for their exact look), the clocks and the siren on the buildings' walls, the
     memorials (no form in OSM), the mural, the fitness stations (no equipment in OSM), the gantry, the motorcycle parking (only paint).
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-23; metres, x east, z south, from the track's lat0/lon0,
   shifted (-1.43, -0.69) m onto the town's grid (the median offset of OSM's 30 benches to js/tracks/harju.js's).
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, { box, cyl, ico, ouRod, TAU } = A;

  // signs: [kind, x, z]: 0 511, 1 423, 2 421, 3 521, 4 575, 5 576; flagpoles: x, z; gates: [sliding, x0, z0, x1, z1, ...]; cycle racks:
  // [covered, outline]; areas: [0 the bandstand's floor, 1 the outdoor seating, outline]; points: [0 fire pit, x, z], [1 recycling], [2 stone
  // block], [3 swing, x, z, rot], [4 basket swing, x, z, rot]
  const SIGNS = [4,-559.7,227.3,5,-560.0,228.1,4,-513.7,261.2,5,-514.8,260.8,3,-541.5,226.3,1,-514.9,266.2,1,-400.4,328.6,0,-462.2,441.4,1,-353.1,287.4,2,-446.9,431.9,0,-344.6,301.2,0,-466.1,435.7,0,-449.9,435.0,1,-465.4,451.6,0,-473.9,417.8,1,-388.3,328.2,0,-347.7,304.3,0,-456.9,431.0,0,-390.2,349.8,1,-467.0,409.8,0,-351.1,293.9,0,-343.2,321.4,1,-409.3,352.1,0,-337.4,314.7,1,-364.6,303.4,0,-387.3,360.3,1,-334.7,312.9];
  const FLAGS = [-498.7,410.6,-492.9,412.2,-494.6,406.2];
  const GATES = [[0,-268.3,-98.4,-270.2,-99.0],[0,-309.9,-211.0,-310.5,-212.9],[0,-293.9,-161.7,-294.3,-163.6],[0,-472.6,296.7,-471.6,295.0],[0,-627.6,239.5,-625.1,239.6,-622.8,239.8],[0,-568.0,372.5,-569.1,362.0],[0,-475.2,406.5,-472.4,407.6,-470.1,407.2],[1,-500.0,290.6,-506.0,287.2]];
  const RACKS = [[0,-227.6,-514.3,-229.0,-512.2,-217.0,-503.3,-215.5,-505.4],[1,-256.6,-407.6,-257.4,-404.1,-241.9,-400.0,-241.0,-403.6],[0,-492.3,365.2,-482.8,374.2,-465.0,355.1],[0,-512.9,390.2,-514.2,396.7,-511.8,397.1,-507.4,400.0,-501.6,406.5,-497.1,401.1,-506.4,392.1]];
  const AREAS = [[1,-282.2,-539.8,-280.0,-548.8,-284.7,-550.0,-285.4,-546.9,-284.2,-546.6,-285.0,-543.6,-286.2,-543.9,-286.9,-541.0],[0,-562.1,271.0,-564.9,279.0,-562.9,279.8,-560.3,280.9,-558.3,281.1,-556.4,280.4,-555.3,279.0,-554.5,277.3,-555.0,275.4,-555.3,274.7,-557.1,273.0]];
  const PTS = [1,-470.3,-7.5,0,-361.8,-39.1,2,-349.6,-472.6,3,-609.8,276.0,2.01,4,-607.9,272.8,2.01];

  const BLUE = [0.02, 0.3, 0.62], WHITE = [0.94, 0.94, 0.93], BLACK = [0.06, 0.06, 0.07], RED = [0.78, 0.1, 0.1], STEEL = [0.6, 0.61, 0.63], BACK = [0.52, 0.53, 0.55];
  const inPoly = (q, x, z) => { let c = false; for (let i = 0, j = q.length - 2; i < q.length; j = i, i += 2) { const xi = q[i], zi = q[i + 1], xj = q[j], zj = q[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const longest = (q) => { let b = -1, k0 = 0; for (let k = 0; k < q.length; k += 2) { const l = Math.hypot(q[(k + 2) % q.length] - q[k], q[(k + 3) % q.length] - q[k + 1]); if (l > b) { b = l; k0 = k; } } return [q[k0], q[k0 + 1], q[(k0 + 2) % q.length], q[(k0 + 3) % q.length]]; };

  function lay(o) {
    const { scen, T, WA, hjGround, hjNear, onBld, exclPush, CR } = o, R2 = A.rng(8131), st = { signs: 0, flags: 0, gates: 0, racks: 0, things: 0 };
    const free = (x, z, m) => { const n = hjNear(x, z); return !((n.i >= 0 && Math.abs(n.lat) < WA[n.i] + m) || onBld(x, z)); };

    // a sign plate's parts: u across (the viewer's right), v up from the plate's foot, w the size across, h up, d out of the face
    const sign = (k, x, z) => {
      const n = hjNear(x, z); if (n.i < 0 || !free(x, z, 0.3)) return;
      const i = n.i, s = n.lat > 0 ? -1 : 1, fx = T.tx[i] * s, fz = T.tz[i] * s, rx = fz, rz = -fx, rot = Math.atan2(rz, rx), y = hjGround(x, z), y0 = y + 2.2, g = scen.get(x, z);
      const el = (u, v, w, h, col, d = 0.02) => box(g, x + rx * u + fx * d, y0 + v, z + rz * u + fz * d, w, h, 0.012, rot, col);
      const P = (u, v, d) => [x + rx * u + fx * d, y0 + v, z + rz * u + fz * d];
      const disc = (cu, cv, r, col, d) => { const c = P(cu, cv, d), bh = P(cu, cv, d - 0.05); for (let q = 0; q < 16; q++) { const a0 = q / 16 * TAU, a1 = (q + 1) / 16 * TAU; g.triO(c, P(cu + Math.cos(a0) * r, cv + Math.sin(a0) * r, d), P(cu + Math.cos(a1) * r, cv + Math.sin(a1) * r, d), col, bh); } };
      const walker = (cu, cv, sc, col, d) => { el(cu, cv + 0.25 * sc, 0.07 * sc, 0.07 * sc, col, d); el(cu, cv + 0.11 * sc, 0.07 * sc, 0.13 * sc, col, d);   // head, body
        el(cu - 0.035 * sc, cv, 0.03 * sc, 0.12 * sc, col, d); el(cu + 0.04 * sc, cv, 0.03 * sc, 0.1 * sc, col, d); el(cu + 0.045 * sc, cv + 0.14 * sc, 0.1 * sc, 0.025 * sc, col, d); };   // legs apart, the arm forward
      cyl(g, x - fx * 0.05, y - 0.2, z - fz * 0.05, 0.03, 3.0 + (k >= 4 ? 0.3 : 0), 6, STEEL);   // (the pole behind the plate)
      if (k === 0 || k === 3) { box(g, x, y0, z, 0.64, 0.64, 0.02, rot, BLUE); box(g, x - fx * 0.012, y0, z - fz * 0.012, 0.64, 0.64, 0.012, rot, BACK);
        if (k === 0) { g.triO(P(-0.27, 0.07, 0.02), P(0.27, 0.07, 0.02), P(0, 0.55, 0.02), WHITE, P(0, 0.3, -0.05)); walker(0, 0.11, 0.95, BLACK, 0.03); }
        else { el(-0.08, 0.1, 0.09, 0.44, WHITE); el(0.03, 0.46, 0.18, 0.08, WHITE); el(0.03, 0.27, 0.18, 0.08, WHITE); el(0.14, 0.3, 0.08, 0.21, WHITE); } }   // the P
      else if (k <= 2) { disc(0, 0.32, 0.32, BLUE, 0.01); disc(0, 0.32, 0.32, BACK, -0.012);
        if (k === 1) { for (const u of [-0.11, 0.11]) { disc(u, 0.42, 0.075, WHITE, 0.02); disc(u, 0.42, 0.05, BLUE, 0.025); } el(0, 0.44, 0.22, 0.025, WHITE, 0.03); el(0.02, 0.5, 0.03, 0.05, WHITE, 0.03);   // the bicycle above,
          walker(0, 0.08, 0.8, WHITE, 0.02); }   // the walker below
        else { walker(-0.06, 0.12, 1.25, WHITE, 0.02); walker(0.12, 0.12, 0.8, WHITE, 0.02); } }   // a grown-up and a child
      else { box(g, x, y0, z, 0.64, 0.9, 0.02, rot, BLUE); box(g, x - fx * 0.012, y0, z - fz * 0.012, 0.64, 0.9, 0.012, rot, BACK);
        walker(-0.1, 0.22, 1.3, WHITE, 0.02); walker(0.14, 0.22, 0.85, WHITE, 0.02);
        if (k === 5) { const a = Math.atan2(0.8, 0.54); for (let q = -2; q <= 2; q++) { const t = q * 0.14; el(t * Math.cos(a) * 0.55, 0.45 + t * Math.sin(a) * 0.9 - 0.04, 0.16, 0.09, RED, 0.035); } } }   // the end: crossed out
      CR.avoid(x, z, 0.4); st.signs++;
    };
    for (let q = 0; q < SIGNS.length; q += 3) sign(SIGNS[q], SIGNS[q + 1], SIGNS[q + 2]);

    for (let q = 0; q < FLAGS.length; q += 2) { const x = FLAGS[q], z = FLAGS[q + 1]; if (!free(x, z, 1)) continue; const y = hjGround(x, z), g = scen.get(x, z);
      box(g, x, y - 0.2, z, 0.6, 0.3, 0.6, 0, [0.62, 0.61, 0.58]); cyl(g, x, y, z, 0.07, 10, 8, WHITE, WHITE, 0.04); ico(g, x, y + 10.08, z, 0.09, 1, [0.85, 0.72, 0.3], R2, 0);
      exclPush(x, z, 1.5); CR.avoid(x, z, 0.6); st.flags++; }

    for (const Gt of GATES) { const h = Gt[0] ? 1.6 : 1.3;
      for (let q = 1; q + 3 < Gt.length; q += 2) { const ax = Gt[q], az = Gt[q + 1], bx = Gt[q + 2], bz = Gt[q + 3], L = Math.hypot(bx - ax, bz - az); if (L < 0.2 || onBld((ax + bx) / 2, (az + bz) / 2)) continue;
        const g = scen.get(ax, az), ya = hjGround(ax, az), yb = hjGround(bx, bz);
        for (const [x, z, y] of [[ax, az, ya], [bx, bz, yb]]) cyl(g, x, y - 0.2, z, 0.05, h + 0.35, 6, STEEL);
        for (const v of [0.12, h - 0.05]) ouRod(g, [ax, ya + v, az], [bx, yb + v, bz], 0.03, STEEL, 4);
        const m = Math.max(2, Math.round(L / 0.2)); for (let t = 1; t < m; t++) { const f = t / m, x = ax + (bx - ax) * f, z = az + (bz - az) * f, y = ya + (yb - ya) * f; ouRod(g, [x, y + 0.12, z], [x, y + h - 0.05, z], 0.012, STEEL, 3); }
        CR.avoid((ax + bx) / 2, (az + bz) / 2, L / 2); }
      st.gates++; }

    for (const Rk of RACKS) { const q = Rk.slice(1), [ax, az, bx, bz] = longest(q), L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      let cx = 0, cz = 0; for (let k = 0; k < q.length; k += 2) { cx += q[k]; cz += q[k + 1]; } cx /= q.length / 2; cz /= q.length / 2;
      let nx = -uz, nz = ux; if ((cx - ax) * nx + (cz - az) * nz < 0) { nx = -nx; nz = -nz; }   // (inward)
      const off = Math.min(1.2, (cx - ax) * nx + (cz - az) * nz), ox = ax + nx * off, oz = az + nz * off, rot = Math.atan2(nz, nx); let any = 0;
      for (let s = 0.6; s < L - 0.4; s += 0.8) { const x = ox + ux * s, z = oz + uz * s; const n = hjNear(x, z); if (n.i >= 0 && Math.abs(n.lat) < WA[n.i] + 0.5) continue; const y = hjGround(x, z), g = scen.get(x, z);   // (the racks stand by the walls, in the buildings' margin: only the road is kept clear)
        const p0 = [x - nx * 0.35, y - 0.1, z - nz * 0.35], p1 = [x + nx * 0.35, y - 0.1, z + nz * 0.35];
        ouRod(g, p0, [p0[0], y + 0.8, p0[2]], 0.025, STEEL, 4); ouRod(g, p1, [p1[0], y + 0.8, p1[2]], 0.025, STEEL, 4); ouRod(g, [p0[0], y + 0.8, p0[2]], [p1[0], y + 0.8, p1[2]], 0.025, STEEL, 4); any++; }
      if (Rk[0] && any) { const mx = ox + ux * L / 2, mz = oz + uz * L / 2, y = hjGround(mx, mz), g = scen.get(mx, mz);
        box(g, mx, y + 2.3, mz, 2.4, 0.08, L, rot, [0.4, 0.42, 0.44], [0.48, 0.5, 0.52]);
        for (let s = 0.3; s <= L - 0.3 + 1e-6; s += Math.max(1, (L - 0.6) / Math.ceil((L - 0.6) / 3))) for (const e of [-1, 1]) { const x = ox + ux * s + nx * e * 1.0, z = oz + uz * s + nz * e * 1.0; cyl(g, x, hjGround(x, z) - 0.2, z, 0.05, 2.5, 6, STEEL); } }
      if (any) { exclPush(ox + ux * L / 2, oz + uz * L / 2, L / 2); st.racks++; } }

    for (const Ar of AREAS) { const q = Ar.slice(1); let cx = 0, cz = 0, ymin = 1e9; for (let k = 0; k < q.length; k += 2) { cx += q[k]; cz += q[k + 1]; ymin = Math.min(ymin, hjGround(q[k], q[k + 1])); } cx /= q.length / 2; cz /= q.length / 2;
      const g = scen.get(cx, cz);
      if (Ar[0] === 0) { const top = ymin + 0.45, W = [0.55, 0.4, 0.26], WT = [0.62, 0.47, 0.31], inn = [cx, top - 0.3, cz];   // the wooden floor: its sides down to the ground, its top
        for (let k = 0; k < q.length; k += 2) { const ax = q[k], az = q[k + 1], bx = q[(k + 2) % q.length], bz = q[(k + 3) % q.length];
          g.quadO([ax, ymin - 0.3, az], [bx, ymin - 0.3, bz], [bx, top, bz], [ax, top, az], W, inn); g.triO([cx, top, cz], [ax, top, az], [bx, top, bz], WT, [cx, top - 1, cz]); }
        exclPush(cx, cz, 5); CR.avoid(cx, cz, 5); }
      else { let xa = 1e9, xb = -1e9, za = 1e9, zb = -1e9; for (let k = 0; k < q.length; k += 2) { xa = Math.min(xa, q[k]); xb = Math.max(xb, q[k]); za = Math.min(za, q[k + 1]); zb = Math.max(zb, q[k + 1]); }
        for (let x = xa + 1; x < xb; x += 2.2) for (let z = za + 1; z < zb; z += 2.2) { if (!inPoly(q, x, z) || !free(x, z, 0.8)) continue; const y = hjGround(x, z);
          cyl(g, x, y - 0.1, z, 0.05, 0.8, 5, BLACK); cyl(g, x, y + 0.7, z, 0.35, 0.04, 10, [0.7, 0.7, 0.68]);
          for (const e of [-1, 1]) { box(g, x + e * 0.6, y, z, 0.42, 0.45, 0.42, 0, [0.3, 0.3, 0.31]); box(g, x + e * 0.8, y + 0.45, z, 0.04, 0.4, 0.42, 0, [0.3, 0.3, 0.31]); }
          CR.avoid(x, z, 1.1); st.things++; } } }

    for (let q = 0; q < PTS.length;) { const t = PTS[q], x = PTS[q + 1], z = PTS[q + 2], rot = t >= 3 ? PTS[q + 3] : 0; q += t >= 3 ? 4 : 3;
      if (!free(x, z, 1)) continue; const y = hjGround(x, z), g = scen.get(x, z), c = Math.cos(rot), s = Math.sin(rot);
      if (t === 0) { for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; ico(g, x + Math.cos(a) * 0.7, y + 0.05, z + Math.sin(a) * 0.7, 0.2, 0.7, [0.46, 0.45, 0.43], R2, 0.15); } exclPush(x, z, 1.5); }
      else if (t === 1) { for (const u of [-1.6, 0, 1.6]) box(g, x + u, y - 0.1, z, 1.4, 1.6, 1.4, 0, [0.42, 0.45, 0.44], [0.34, 0.36, 0.35]); exclPush(x, z, 3); CR.avoid(x, z, 2.6); }
      else if (t === 2) box(g, x, y - 0.1, z, 1.2, 0.7, 0.6, 0.4, [0.6, 0.56, 0.54], [0.66, 0.62, 0.6]);
      else { const H = 2.4, half = t === 3 ? 1.6 : 1.3;   // the A frames at the beam's ends, the beam, the seats on their chains
        for (const e of [-half, half]) { const ex = x + c * e, ez = z + s * e; for (const f of [-0.9, 0.9]) ouRod(g, [ex - s * f, y - 0.1, ez + c * f], [ex, y + H, ez], 0.045, STEEL, 5); }
        ouRod(g, [x - c * half, y + H, z - s * half], [x + c * half, y + H, z + s * half], 0.05, STEEL, 6);
        if (t === 3) for (const u of [-0.7, 0.7]) { const sx = x + c * u, sz = z + s * u; for (const e of [-0.2, 0.2]) ouRod(g, [sx + c * e, y + H, sz + s * e], [sx + c * e, y + 0.45, sz + s * e], 0.008, STEEL, 3); box(g, sx, y + 0.42, sz, 0.45, 0.05, 0.18, rot, BLACK); }
        else { for (const e of [-0.35, 0.35]) for (const f of [-0.35, 0.35]) ouRod(g, [x + c * e, y + H, z + s * e], [x + c * e - s * f, y + 0.55, z + s * e + c * f], 0.01, [0.3, 0.3, 0.3], 3); cyl(g, x, y + 0.5, z, 0.5, 0.08, 12, [0.2, 0.35, 0.6], [0.25, 0.45, 0.7]); }
        exclPush(x, z, half + 1.5); CR.avoid(x, z, half + 1); }
      st.things++; }
    return st;
  }

  A.hjRoadside = lay;
})();
