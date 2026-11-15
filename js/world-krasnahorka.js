/* =========================================================================
   WORLD — Krásna Hôrka, Slovaška (theme 'krasnahorka'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra. Made by tools/nova-proga.mjs (the style from tools/predogled/proge.json).
   The castle on the hill at the top (Matej, 15. 11. 2026: "grad naredi podrobno po resnični obliki ... kot cel grad (strehe, stolpi), samo od
   zunaj"): its walls after the castle's outline in OpenStreetMap (ways 112611305 and the buildings in it), its height after the hill's peak
   (485 m), whole as before the fire of 2012, from outside only: white walls, dark shingle roofs, round bastions, the main tower, the chapel with
   its apse, the gate tower at the end of the road. No inscriptions, statues, coats of arms or ornaments. The surface model (Copernicus DSM) has
   the castle's roofs in it: the hilltop is levelled under it first (S.pads), the castle's own buildings left out of the import's (S.bldOmit),
   no trees on the hill (S.excl).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  const CX = -516, CZ = 331;   // (the castle's middle, in the track's metres)
  // the castle's outer wall (OSM way 112611305, in the track's metres: x east, z south)
  const RING = [[-565.5, 299.4], [-563.9, 298.3], [-562.5, 297.8], [-560.9, 297.7], [-559.5, 298], [-558.2, 298.7], [-556.7, 300.1], [-535.6, 297.3], [-488.5, 295.6],
    [-487.9, 294.1], [-487, 292.5], [-485.8, 291.4], [-484.2, 290.6], [-483.2, 290.3], [-481.3, 290.2], [-480.7, 291.3], [-477.8, 291.5], [-475.7, 292.8], [-474, 295.1],
    [-473.2, 297.9], [-473.6, 301.2], [-475.2, 303.5], [-465.4, 315.7], [-464.3, 315.6], [-464.1, 316.8], [-465.1, 317.1], [-467.3, 326.3], [-473, 337.5], [-479.1, 353.5],
    [-488.5, 360.6], [-488.1, 361.4], [-494.8, 371.8], [-528.7, 357.3], [-550.1, 341.3], [-556.1, 334.3], [-551.6, 331.7], [-560.3, 309.1], [-560.8, 309.3], [-561.8, 309.3],
    [-563.3, 309], [-564.6, 308.3], [-566.1, 306.9], [-566.6, 306.1], [-567.2, 304.1], [-567.1, 302.6], [-566.9, 301.4]];
  const T0 = 35;   // (the top of the castle's terrace: the hill's peak, 485 m, is about 32.7)
  const WALL = [0.86, 0.84, 0.78], WALL2 = [0.8, 0.78, 0.72], STONE = [0.55, 0.52, 0.47], STONE2 = [0.44, 0.42, 0.38], ROOF = [0.3, 0.27, 0.25], ROOF2 = [0.26, 0.24, 0.23],
    WIN = [0.15, 0.14, 0.13], GATE = [0.1, 0.09, 0.09];
  // the wings (the spines of the buildings in OSM): the points, the width, the eave
  const WINGS = [
    [[[-556, 300.8], [-507, 300]], 6, 45],   // north
    [[[-556.1, 307.5], [-547.4, 330.1]], 8.5, 45],   // west
    [[[-530.5, 300], [-530, 320]], 9, 47],   // the upper castle's palace
    [[[-508.5, 300], [-506, 334]], 7, 44],
    [[[-541, 324.5], [-512, 340.5]], 8, 43],
    [[[-549.5, 337.6], [-527.4, 354.3], [-497, 366.5]], 7, 41],   // south
    [[[-490, 299.5], [-478.5, 305.5], [-470.5, 317], [-472.5, 327.5], [-477.5, 339], [-483.5, 352.5]], 6, 40],   // the lower castle along the east wall
  ];

  function castle(ctx) {
    const { box, cyl, cone, gable } = World.api, gH = ctx.out.groundH, g = ctx.scen.get(CX, CZ);
    // the terrace: the outer wall from the hill up to T0 (stone, darker at its foot), its top, a parapet round it
    let A = 0; for (let i = 0; i < RING.length; i++) { const p = RING[i], q = RING[(i + 1) % RING.length]; A += p[0] * q[1] - q[0] * p[1]; }
    const sg = A > 0 ? 1 : -1;
    for (let i = 0; i < RING.length; i++) {
      const p = RING[i], q = RING[(i + 1) % RING.length], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz) || 1;
      const nx = -dz / L * sg, nz = dx / L * sg, mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2;   // (n: inward)
      const yp = gH(p[0], p[1]) - 1.5, yq = gH(q[0], q[1]) - 1.5;
      g.quadO([p[0], yp, p[1]], [q[0], yq, q[1]], [q[0], T0, q[1]], [p[0], T0, p[1]], STONE, [mx + nx, (T0 + yp) / 2, mz + nz], null, [STONE2, STONE2, STONE, STONE]);
      if (L > 0.8) {   // the parapet (higher along the lower castle's east side: its curtain wall)
        const hi = mx > -505 ? 4.5 : 1.3;
        box(g, mx + nx * 0.35, T0, mz + nz * 0.35, L + 0.5, hi, 0.7, Math.atan2(dz, dx), WALL2, STONE, true);
      }
    }
    const tri = THREE.ShapeUtils.triangulateShape(RING.map(p => new THREE.Vector2(p[0], p[1])), []), up = [STONE, STONE, STONE];
    for (const [a, b, c] of tri) g.triUp([RING[a][0], T0, RING[a][1]], [RING[b][0], T0, RING[b][1]], [RING[c][0], T0, RING[c][1]], up);

    // a wing: white walls from the terrace to the eave, rows of dark windows on both long sides, a steep roof
    const wing = (pts, w, ye) => {
      for (let i = 0; i + 1 < pts.length; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), rot = Math.atan2(dz, dx), ux = dx / L, uz = dz / L;
        const cx = (ax + bx) / 2, cz = (az + bz) / 2, hgt = ye - T0;
        box(g, cx, T0, cz, L + w * 0.9, hgt, w, rot, WALL, WALL, true);
        gable(g, cx, ye, cz, L + w * 0.9 + 0.8, w + 1, w * 0.6, rot, i % 2 ? ROOF2 : ROOF, WALL);
        for (const sd of [-1, 1]) {   // (the windows: every 3.2 m, a floor every 3 m from 2.4 m over the terrace)
          const ox = -uz * sd * (w / 2 + 0.04), oz = ux * sd * (w / 2 + 0.04), inn = [cx, (T0 + ye) / 2, cz];
          for (let y = T0 + 2.4; y + 1.6 < ye - 0.8; y += 3) for (let t = -L / 2 + 1.6; t <= L / 2 - 1.2; t += 3.2) {
            const px = cx + ux * t + ox, pz = cz + uz * t + oz, hx = ux * 0.55, hz = uz * 0.55;
            g.quadO([px - hx, y, pz - hz], [px + hx, y, pz + hz], [px + hx, y + 1.6, pz + hz], [px - hx, y + 1.6, pz - hz], WIN, inn);
          }
        }
      }
    };
    for (const [pts, w, ye] of WINGS) wing(pts, w, ye);

    // the main tower on the peak: square, a pyramid roof
    box(g, -521, T0, 319, 7.5, 56 - T0, 7.5, 0, WALL, WALL, true);
    for (const [ox, oz] of [[0, -3.79], [0, 3.79], [-3.79, 0], [3.79, 0]]) for (let y = 47; y < 55; y += 3.5) {
      const vx = oz ? 0.45 : 0, vz = ox ? 0.45 : 0, px = -521 + ox, pz = 319 + oz;
      g.quadO([px - vx, y, pz - vz], [px + vx, y, pz + vz], [px + vx, y + 1.4, pz + vz], [px - vx, y + 1.4, pz - vz], WIN, [-521, y, 319]);
    }
    cone(g, -521, 56, 319, 7.5 / Math.SQRT2 + 0.5, 10, 4, ROOF, ROOF2, Math.PI / 4);
    box(g, -521, 66, 319, 0.25, 1.6, 0.25, 0, ROOF2);   // (the finial)

    // the chapel: its nave across the south of the upper castle, the apse to the east, a turret on the ridge
    const cr = Math.atan2(6.5, 14.9), ccx = -504, ccz = 347.25;
    box(g, ccx, T0, ccz, 16, 43 - T0, 12.5, cr, WALL, WALL, true);
    gable(g, ccx, 43, ccz, 16.8, 13.5, 7, cr, ROOF, WALL);
    cyl(g, -496.5, T0, 350.5, 6, 43 - T0, 10, WALL);
    cone(g, -496.5, 43, 350.5, 6.6, 5.5, 10, ROOF, ROOF2, 0);
    for (let k = 0; k < 3; k++) { const a = cr - 0.9 + k * 0.9, px = -496.5 + Math.cos(a) * 6.04, pz = 350.5 + Math.sin(a) * 6.04, vx = -Math.sin(a) * 0.5, vz = Math.cos(a) * 0.5;   // (tall windows of the apse)
      g.quadO([px - vx, 37, pz - vz], [px + vx, 37, pz + vz], [px + vx, 41, pz + vz], [px - vx, 41, pz - vz], WIN, [-496.5, 39, 350.5]); }
    box(g, ccx, 47, ccz, 1.8, 4.5, 1.8, cr, WALL);
    cone(g, ccx, 51.5, ccz, 1.6, 4.5, 8, ROOF, ROOF2, 0);

    // the round bastions (from the hill, over the terrace) and their cone roofs
    for (const [x, z, r, top, rh] of [[-561.8, 303.5, 5.5, 43, 6.5], [-479.8, 296.5, 7, 41, 7.5], [-553.5, 336, 3.5, 42, 5]]) {
      const y0 = gH(x, z) - 1.5;
      cyl(g, x, y0, z, r, T0 - y0, 12, STONE);
      cyl(g, x, T0, z, r, top - T0, 12, WALL);
      cone(g, x, top, z, r + 0.6, rh, 12, ROOF, ROOF2, 0);
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3, px = x + Math.cos(a) * (r + 0.04), pz = z + Math.sin(a) * (r + 0.04), vx = -Math.sin(a) * 0.4, vz = Math.cos(a) * 0.4;
        g.quadO([px - vx, top - 3, pz - vz], [px + vx, top - 3, pz + vz], [px + vx, top - 1.8, pz + vz], [px - vx, top - 1.8, pz - vz], WIN, [x, top - 2, z]); }
    }

    // the gate tower at the end of the road: the gateway dark, facing out
    const gr = Math.atan2(371.8 - 361.4, -494.8 + 488.1), gx = -492.5, gz = 365.5, gy0 = gH(gx, gz) - 1.5;
    box(g, gx, gy0, gz, 7, 44 - gy0, 6, gr, WALL, WALL, true);
    cone(g, gx, 44, gz, 5.2, 7, 4, ROOF, ROOF2, gr + Math.PI / 4);
    const ux = Math.cos(gr), uz = Math.sin(gr);
    let ox = -uz, oz = ux; if ((gx - CX) * ox + (gz - CZ) * oz < 0) { ox = -ox; oz = -oz; }   // (o: out of the castle)
    const fx = gx + ox * 3.05, fz = gz + oz * 3.05, ry = gH(fx + ox * 2, fz + oz * 2);
    g.quadO([fx - ux * 1.8, ry - 0.3, fz - uz * 1.8], [fx + ux * 1.8, ry - 0.3, fz + uz * 1.8], [fx + ux * 1.8, ry + 4.2, fz + uz * 1.8], [fx - ux * 1.8, ry + 4.2, fz - uz * 1.8], GATE, [gx, ry + 2, gz]);
    for (const t of [-1.8, 0, 1.8]) { const px = fx + ux * t, pz = fz + uz * t;
      g.quadO([px - ux * 0.4, 39, pz - uz * 0.4], [px + ux * 0.4, 39, pz + uz * 0.4], [px + ux * 0.4, 40.4, pz + uz * 0.4], [px - ux * 0.4, 40.4, pz - uz * 0.4], WIN, [gx, 40, gz]); }
  }

  World.ext.krasnahorka = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1717, snow: 'none',
    road: { line: 'none' },
    trees: { kinds: ['broad'], forest: 0.14 },
    skiers: 0, nets: false, snowbanks: false,
    animals: [],
    rails: false, fans: 0.3,
    pads: () => [{ x: -512, z: 324, r: 38, b: 24, h: 32.5 }, { x: -464, z: 336, r: 12, b: 16, h: 31.5 }, { x: -456, z: 305, r: 10, b: 14, h: 31 }],
    excl: [[CX, CZ, 60]],
    bldOmit: (x, z) => Math.hypot(x - CX, z - CZ) < 58 && Math.hypot(x + 472.2, z - 366) > 1,   // (the castle's own; the small chapel below the gate stays)
    extra: castle,
  });
})();
