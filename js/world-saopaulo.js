/* =========================================================================
   WORLD · SÃO PAULO (theme 'saopaulo') — the circuit in Interlagos on the Red Bull Ring's builder (World.rbLook: its RB_LOOK entry), the
   district round it in a function of its own (spCity): the houses and blocks of OpenStreetMap at their heights (terracotta roofs, flat
   slabs with blue water tanks, painted plaster, a window every 3 m), the streets with their lanes (asphalt, raised pavements, Brazilian
   markings: yellow between the directions, white between lanes, zebra crossings, stop lines), the junctions with their traffic lights on
   mast arms, the bus shelters, concrete utility poles with street lamps and their wires, the swimming pools, the football pitches, the lake
   in the circuit's grounds, tropical trees (fig and mango crowns, queen palms, jacarandas in bloom), the pit lane on the left of the main
   straight with the pit building, a few towers of the city farther out. Only place names (São Paulo, Interlagos, Brasil); no names of the
   circuit, of people, races or sponsors. The streets lie outside the circuit's walls: their furniture is scenery; the knockable street
   furniture of the circuit itself stands at the mouths of the pit lane (Core's props: a pit exit light, bollards, signs).
   ========================================================================= */
(function () {
  'use strict';
  const { clamp, lerp, sstep } = Core;
  const TAU = Math.PI * 2;

  /* ---- the look on the Red Bull Ring's builder: text boards, fans and flags, colours ---- */
  const SP_BAN = [['SÃO PAULO', '#0d5a2e', '#ffd21a', '#ffd21a'], ['START · CHEGADA', '#16181c', '#fff', '#ffd21a'], ['A', '#123a8a', '#fff', '#ffd21a'], ['B', '#123a8a', '#fff', '#ffd21a'],
    ['C', '#123a8a', '#fff', '#ffd21a'], ['D', '#123a8a', '#fff', '#ffd21a'], ['M', '#123a8a', '#fff', '#ffd21a'], ['INTERLAGOS', '#123a8a', '#fff', '#ffd21a'], ['BRASIL', '#0d5a2e', '#ffd21a', '#123a8a'],
    ['DRS', '#101114', '#fff', '#39c84a']];
  const SP_AT = { num: 0, brake: 15, ban: 18, rbr: 18, spielberg: 25 };   // atlas cells: the turn numbers 1-15, the braking boards, the banners
  const SP_SHIRTS = [[0.98, 0.84, 0.1], [0.05, 0.55, 0.25], [0.12, 0.25, 0.65], [0.95, 0.95, 0.93], [0.86, 0.12, 0.14], [0.12, 0.12, 0.14], [0.98, 0.84, 0.1], [0.05, 0.55, 0.25],
    [0.98, 0.55, 0.12], [0.35, 0.6, 0.85], [0.98, 0.84, 0.1], [0.6, 0.15, 0.4]];   // the fans: yellow and green, blue, white, team colours
  World.rbLook('saopaulo', {
    ban: SP_BAN, at: SP_AT, nums: 15, numCol: ['#123a8a', '#fff', '#ffd21a'], shirts: SP_SHIRTS, smoke: false, camps: 0, trees: 'nr', ownTrees: true, carParks: false, farm: null, air: false,
    seC: [1.32, 1.0, 1.5],   // (the yards between the houses: concrete and packed earth, the grass picture greyed)
    fl: { br: [[0.0, 0.6, 0.27], [1, 0.84, 0.08], [0.1, 0.2, 0.62]], by: [[1, 0.84, 0.08], [0.0, 0.6, 0.27]], bw: [[0.95, 0.95, 0.94], [0.1, 0.2, 0.62]] },   // (plain colours: green-yellow-blue, yellow-green, white-blue)
    flags: { stand: [{ br: 0.5, by: 0.3, bw: 0.2 }, { br: 0.4, by: 0.4, bw: 0.2 }], ga: { br: 0.5, by: 0.4, bw: 0.1 }, camp: { br: 1 }, pole: 'br', podium: 'br' },
    vid: [['B', -1], ['M', -1]], poles: [-560, 260, 1], runoff: ['INTERLAGOS', 'SÃO PAULO', 'BRASIL'], straight: [-600, 280, 1],
    tvSkip: [1, 4, 6, 12, 14], recov: [0, 3, 9], photo: [0, 3, 9, 11], jets: null,
    screen: { name: ['SÃO PAULO', 'INTERLAGOS'], km: '4,309 km', sub: '15 zavojev', fans: ['#ffd21a', '#0d9a46', '#123a8a', '#f4f4f0', '#e2202c', '#ffd21a', '#0d9a46'], glow: '255,210,40' },
    colMod: (P) => (x, z, c) => {   // the grass of the circuit's grounds: deep green after the rains, patches of the red earth (terra roxa) where it is worn;
      // the city's ground (SPU: round the houses and along the streets) concrete, paving and packed earth
      const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.9 + (n - 0.5) * 0.16 + (m - 0.5) * 0.1, u = spUrban(x, z);
      if (u > 0) { const q = P.n4(x, z), t = [1.55 + (q - 0.5) * 0.3, 1.04 + (q - 0.5) * 0.2, 1.85 + (m - 0.5) * 0.3], f = u * 0.85; c[0] = lerp(c[0], c[0] * t[0], f); c[1] = lerp(c[1], c[1] * t[1], f); c[2] = lerp(c[2], c[2] * t[2], f); }
      c[0] *= k * 0.95; c[1] *= k * 1.04; c[2] *= k * 0.86;
      const red = sstep(0.78, 0.9, P.n1(x * 1.4 - 210, z * 1.4 + 75)) * 0.35;
      c[0] = lerp(c[0], c[0] * 1.3 + 0.06, red); c[1] = lerp(c[1], c[1] * 0.74, red); c[2] = lerp(c[2], c[2] * 0.62, red);
    },
    prep: spPrep, extra: spCity,
  });

  /* ---- the city's data (def.city: base64 polylines, int16 start and int8 steps of 0.25 m) ---- */
  function dec(b64) {
    const s = atob(b64), n = s.length, u = new Uint8Array(n); for (let k = 0; k < n; k++) u[k] = s.charCodeAt(k);
    const v = new DataView(u.buffer), out = []; let o = 0;
    while (o < n) {
      const m = v.getUint16(o, true); let x = v.getInt16(o + 2, true), z = v.getInt16(o + 4, true); o += 6;
      const P = new Float32Array(m * 2); P[0] = x * 0.25; P[1] = z * 0.25;
      for (let k = 1; k < m; k++) { let dx = v.getInt8(o), dz; if (dx === -128) { dx = v.getInt16(o + 1, true); dz = v.getInt16(o + 3, true); o += 5; } else { dz = v.getInt8(o + 1); o += 2; } x += dx; z += dz; P[k * 2] = x * 0.25; P[k * 2 + 1] = z * 0.25; }
      out.push(P);
    }
    return out;
  }
  const u8 = (b64) => { const s = atob(b64), a = new Uint8Array(s.length); for (let k = 0; k < s.length; k++) a[k] = s.charCodeAt(k); return a; };
  const pairs = (P) => { const o = []; for (let k = 0; k < P.length; k += 2) o.push([P[k], P[k + 1]]); return o; };
  let SPC = null;   // the decoded city of the last build (spPrep, spCity)
  let SPU = null;   // the city's ground: 8 m cells round the houses and along the streets (spCity fills it before the terrain is coloured)
  function spUrban(x, z) {
    const U = SPU; if (!U) return 0; const fx = (x - U.x0) / 8 - 0.5, fz = (z - U.z0) / 8 - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const at = (a, b) => (a < 0 || b < 0 || a >= U.nx || b >= U.nz ? 0 : U.m[b * U.nx + a]);
    return ((at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v) / 255;
  }

  // before any height is taken: the lake basin in the circuit's grounds (the ground under it below the water, its level from the model)
  function spPrep(P, K) {
    const C = K.T.def.city;
    SPC = { lakes: dec(C.water).map(pairs).filter(p => p.length > 3).map(poly => {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9, mx = 0, mz = 0; for (const [x, z] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); mx += x; mz += z; }
      mx /= poly.length; mz /= poly.length; let lv = 1e9; for (const [x, z] of poly) lv = Math.min(lv, K.nrDem(x, z));
      return { poly, b: [x0, x1, z0, z1], lvl: lv - 0.6 }; }) };
    const pad0 = P.pad;
    P.pad = (x, z, h) => { h = pad0(x, z, h);
      for (const L of SPC.lakes) { const b = L.b; if (x < b[0] - 30 || x > b[1] + 30 || z < b[2] - 30 || z > b[3] + 30) continue;
        const d = K.polyDist(L.poly, x, z), ins = K.inPoly(L.poly, x, z);
        if (ins) h = Math.min(h, L.lvl - 0.4 - Math.min(2.5, d * 0.25)); else h = lerp(Math.min(h, L.lvl + 0.35 + d * 0.12), h, sstep(4, 26, d)); }
      return h; };
  }

  /* ---- a wall picture: one bay of 3 x 3 m (one floor), plaster with a window (its frame, the glass, a sill); the vertex colours paint
     the plaster; the roofs and slabs take the plain plaster at its corner (uv 0.03) ---- */
  function spWallTex() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 64);
    for (let k = 0; k < 220; k++) { const v = 228 + Math.floor(Math.random() * 27); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(Math.random() * 64, Math.random() * 64, 2, 2); }   // (the plaster's grain)
    x.fillStyle = '#d6d6d6'; x.fillRect(17, 15, 30, 27);                       // the frame
    x.fillStyle = '#3c4652'; x.fillRect(19, 17, 26, 23);                       // the glass
    x.fillStyle = '#6b7784'; x.fillRect(19, 17, 26, 6);                        // (the sky in it)
    x.fillStyle = '#2b323a'; x.fillRect(31, 17, 2, 23);                        // the mullion
    x.fillStyle = '#c8c8c8'; x.fillRect(15, 42, 34, 3);                        // the sill
    x.fillStyle = '#e4e4e4'; x.fillRect(0, 60, 64, 4);                         // the floor band
    for (let k = 0; k < 4; k++) x.fillRect(0, 0, 3, 3);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  const UV0 = [0.02, 0.98];   // (plain plaster: the top left corner of the picture)

  // the minimum-area rectangle round a footprint (rotating calipers over the hull's edges): its centre, axes and half sizes
  function minRect(P) {
    let best = null;
    for (let k = 0; k < P.length; k++) {
      const a = P[k], b = P[(k + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.5) continue;
      const ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
      for (const p of P) { const u = p[0] * ux + p[1] * uz, v = -p[0] * uz + p[1] * ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      const A = (u1 - u0) * (v1 - v0); if (!best || A < best.A) best = { A, ux, uz, cu: (u0 + u1) / 2, cv: (v0 + v1) / 2, hu: (u1 - u0) / 2, hv: (v1 - v0) / 2 };
    }
    if (!best) return null;
    const r = best; r.cx = r.cu * r.ux - r.cv * r.uz; r.cz = r.cu * r.uz + r.cv * r.ux; return r;
  }
  const polyArea = (P) => { let a = 0; for (let k = 0; k < P.length; k++) { const p = P[k], q = P[(k + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };

  // the walls' paint: whitewash and cream mostly, pastels, ochre, now and then the bare orange blocks of a house still being built
  const SP_WALL = [[0.94, 0.93, 0.89], [0.95, 0.91, 0.8], [0.93, 0.86, 0.7], [0.96, 0.84, 0.74], [0.85, 0.9, 0.94], [0.86, 0.92, 0.84], [0.93, 0.8, 0.62],
    [0.98, 0.94, 0.72], [0.9, 0.78, 0.8], [0.82, 0.84, 0.86], [0.94, 0.93, 0.89], [0.95, 0.91, 0.8]];
  const SP_BRICK = [0.78, 0.44, 0.3], SP_TILE = [[0.72, 0.36, 0.22], [0.66, 0.31, 0.2], [0.78, 0.42, 0.26], [0.6, 0.3, 0.22], [0.7, 0.4, 0.3]], SP_SLAB = [[0.66, 0.65, 0.62], [0.56, 0.55, 0.53], [0.72, 0.71, 0.68]];

  // one building: the walls (a window every 3 m on every floor), the roof: a hipped or gabled terracotta roof on a house of a simple shape,
  // else a flat slab (a blue water tank on many), a metal roof on a hall; a round tank; the pit building its own colours
  function spBuilding(K, g, P, h, kind, R, o) {
    const n = P.length, area = polyArea(P); let yb = 1e9, ya = -1e9, cx = 0, cz = 0;
    for (const [x, z] of P) { const y = K.nrGround(x, z); yb = Math.min(yb, y); ya = Math.max(ya, y); cx += x; cz += z; }
    cx /= n; cz /= n; yb -= 0.5;
    const top = Math.max(yb + 0.5 + h, ya + 2.6), H = top - yb, r = R();
    const big = area > 700 || kind === 2, tall = h > 11, pit = o && o.pit;
    let wc = pit ? [0.93, 0.93, 0.92] : big ? [0.82, 0.83, 0.84] : r < 0.07 && !tall ? SP_BRICK : SP_WALL[Math.floor(R() * SP_WALL.length)];
    wc = K.vary(wc, R, 0.08);
    if (kind === 5) {   // a round water tank on stilts of concrete
      let rr = 0; for (const [x, z] of P) rr = Math.max(rr, Math.hypot(x - cx, z - cz)); K.cyl(g, cx, yb, cz, rr * 0.92, H, 12, [0.78, 0.78, 0.76], [0.7, 0.7, 0.68]); return 1;
    }
    let u = 0;
    for (let k = 0; k < n; k++) {   // the walls, facing out
      const a = P[k], b = P[(k + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.05) continue;
      const v0 = (top - yb) / 3, uv = [[u / 3, v0], [(u + l) / 3, v0], [(u + l) / 3, 0], [u / 3, 0]];
      g.quadO([a[0], yb, a[1]], [b[0], yb, b[1]], [b[0], top, b[1]], [a[0], top, a[1]], wc, [cx, (yb + top) / 2, cz], uv.map(q => [q[0], 1 - q[1]]));
      u += l;
    }
    const roofUp = [cx, top - 30, cz];
    const rect = minRect(P), simple = rect && !big && !tall && kind === 0 && area < 450 && polyArea(P) > 0.86 * rect.A, pitched = simple && r > 0.3;
    if (pitched) {   // terracotta: hipped if squarish, else gabled; eaves 0.35 m out
      const tc = K.vary(SP_TILE[Math.floor(R() * SP_TILE.length)], R, 0.1), L2 = rect.hu + 0.35, W2 = rect.hv + 0.35, ux = rect.ux, uz = rect.uz, vx = -uz, vz = ux;
      const long = L2 >= W2, al = long ? [ux, uz] : [vx, vz], ac = long ? [vx, vz] : [ux, uz], A = long ? L2 : W2, B = long ? W2 : L2, rh = B * 0.42, y0 = top - 0.05, y1 = y0 + rh;
      const Q = (s, t, y) => [rect.cx + al[0] * s + ac[0] * t, y, rect.cz + al[1] * s + ac[1] * t], hip = A < B * 1.5 ? B : 0.0, ra = Math.max(0, A - (hip ? B * 0.9 : 0));
      const e = [Q(-A, -B, y0), Q(A, -B, y0), Q(A, B, y0), Q(-A, B, y0)], r0 = Q(-ra, 0, y1), r1 = Q(ra, 0, y1), inn = [rect.cx, y0 - 3, rect.cz], ts = K.vary(tc, R, 0.06);
      g.quadO(e[0], e[1], r1, r0, tc, inn, [UV0, UV0, UV0, UV0]); g.quadO(e[3], e[2], r1, r0, ts, inn, [UV0, UV0, UV0, UV0]);
      if (hip) { g.triO(e[0], e[3], r0, tc, inn, null, null, UV0, UV0, UV0); g.triO(e[1], e[2], r1, ts, inn, null, null, UV0, UV0, UV0); }
      else { g.triO(e[0], e[3], r0, wc, inn, null, null, UV0, UV0, UV0); g.triO(e[1], e[2], r1, wc, inn, null, null, UV0, UV0, UV0); }   // (the gable ends: the wall's paint)
      g.quadO(e[0], e[1], e[2], e[3], [0.35, 0.3, 0.28], [rect.cx, y0 + 5, rect.cz], [UV0, UV0, UV0, UV0]);   // (the eaves' underside)
      return 2;
    }
    // a flat roof: the slab (its parapet's top a little lighter), metal on the halls, the pit building white
    const sc = pit ? [0.9, 0.9, 0.9] : big ? K.vary([0.74, 0.76, 0.78], R, 0.08) : K.vary(SP_SLAB[Math.floor(R() * SP_SLAB.length)], R, 0.12);
    const con = P.map(([x, z]) => new THREE.Vector2(x, z));
    for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(con, [])) g.triO([P[a][0], top, P[a][1]], [P[b][0], top, P[b][1]], [P[c][0], top, P[c][1]], sc, roofUp, null, null, UV0, UV0, UV0);
    if (!big && !pit && R() < 0.55) {   // the blue fibreglass water tank (a caixa d'água) on its stand, and a little box over the stairs
      const tx = lerp(cx, P[0][0], 0.45), tz = lerp(cz, P[0][1], 0.45), rr = 0.75;
      K.box(g, tx, top, tz, 1.6, 0.5, 1.6, 0, [0.7, 0.7, 0.68]); K.cyl(g, tx, top + 0.5, tz, rr, 0.85, 8, [0.18, 0.38, 0.7], [0.22, 0.45, 0.78], rr * 0.85);
      if (R() < 0.4) K.box(g, cx, top, cz, 2.2, 2.2, 2.6, Math.atan2(P[1][1] - P[0][1], P[1][0] - P[0][0]), wc, sc);
    } else if (big && !pit && R() < 0.6) {   // a hall's roof: ridges of the metal sheets, a few skylights
      for (let k = 1; k < 4; k++) K.box(g, lerp(P[0][0], P[2 % n][0], k / 4), top, lerp(P[0][1], P[2 % n][1], k / 4), 2.4, 0.08, 1.2, Math.atan2(P[1][1] - P[0][1], P[1][0] - P[0][0]), [0.86, 0.9, 0.92]);
    }
    return 3;
  }

  /* ---- the streets: classes 0 trunk, 1 primary, 2 secondary, 3 tertiary, 4 residential, 5 service, 6 footway, 7 steps, 8 link; flags 1 one-way,
     2 bridge, 4 roundabout, 8 a crossing footway, 16 parking aisle, 32 driveway ---- */
  function roadHW(cl, lanes, ow) {   // the carriageway's half width (as the data's junction radii)
    if (cl === 6 || cl === 7) return 0;
    if (cl === 5) return 2.25;
    let n = lanes || (cl <= 1 ? 3 : 2) * (ow ? 1 : 2); if (cl === 4 && !lanes) n = 2; if (cl === 8 && !lanes) n = 1;
    return n * 3.2 / 2;
  }
  // every street as samples every ~4 m: position, its normal (to the right of its direction), the ground's height there
  function roadSamples(K, P) {
    const pts = [];
    for (let k = 0; k + 1 < P.length / 2; k++) {
      const ax = P[k * 2], az = P[k * 2 + 1], bx = P[k * 2 + 2], bz = P[k * 2 + 3], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 4));
      for (let j = k ? 1 : 0; j <= n; j++) { const t = j / n; pts.push({ x: lerp(ax, bx, t), z: lerp(az, bz, t) }); }
    }
    for (let k = 0; k < pts.length; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, p = pts[k];
      p.tx = dx / l; p.tz = dz / l; p.nx = -dz / l; p.nz = dx / l; p.y = K.nrGround(p.x, p.z);
    }
    for (let k = 0; k < pts.length; k++) pts[k].s = k ? pts[k - 1].s + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].z - pts[k - 1].z) : 0;
    return pts;
  }

  /* ---- unit models (instanced): the Brazilian traffic light on its mast arm (the arm along +x), a pedestrian light, a concrete utility
     pole with its crossarm and the street lamp's arm (+x towards the street), a bus shelter (its open side towards -z... the street: +x),
     a litter bin, the trees ---- */
  function unitGeo(K, kind) {
    const g = new K.GB(), gr = [0.42, 0.43, 0.45], bk = [0.07, 0.07, 0.08], con = [0.72, 0.71, 0.68];
    if (kind === 'signal') {   // the pole and its arm over the street, two heads hung from the arm, the near one on the pole (red lit; lenses towards -z... both ways)
      K.cyl(g, 0, -0.3, 0, 0.12, 6.4, 8, gr, gr, 0.1); K.box(g, 2.6, 5.75, 0, 5.4, 0.16, 0.16, 0, gr, gr); K.box(g, 1.0, 5.2, 0, 2.0, 0.08, 0.08, -0.45, gr, gr);
      const lens = [[1, 0.16, 0.1], [0.42, 0.33, 0.06], [0.06, 0.28, 0.12]], head = (x, y) => { K.box(g, x, y, 0, 0.38, 1.05, 0.32, 0, bk, bk);
        for (let k = 0; k < 3; k++) for (const sz of [-1, 1]) K.box(g, x, y + 0.74 - k * 0.32, sz * 0.165, 0.22, 0.22, 0.02, 0, lens[k], lens[k]); };
      head(4.9, 4.55); head(3.1, 4.55); head(0.3, 2.3);
      K.box(g, -0.28, 2.0, 0, 0.32, 0.62, 0.3, 0, bk, bk); K.box(g, -0.28, 2.32, 0.155, 0.22, 0.2, 0.01, 0, [0.95, 0.2, 0.1], [0.95, 0.2, 0.1]); K.box(g, -0.28, 2.08, 0.155, 0.22, 0.2, 0.01, 0, [0.2, 0.25, 0.22], [0.2, 0.25, 0.22]);
    } else if (kind === 'pole' || kind === 'xfmr') {   // a tapered concrete pole (9.5 m), its crossarm, the lamp on its arm over the street; a transformer drum on some
      const cw = [0.5, 0.45, 0.4]; K.cyl(g, 0, -0.3, 0, 0.17, 9.8, 4, con, null, 0.09); K.box(g, 0, 8.6, 0, 0.12, 0.12, 2.0, 0, cw, cw, true);
      K.box(g, 1.0, 7.0, 0, 2.0, 0.08, 0.08, 0.18, gr, gr, true); K.box(g, 2.05, 7.0, 0, 0.62, 0.14, 0.28, 0, [1, 0.95, 0.8], [0.36, 0.37, 0.39]);
      if (kind === 'xfmr') K.cyl(g, -0.45, 5.6, 0, 0.36, 1.1, 6, [0.6, 0.62, 0.62], [0.5, 0.52, 0.52]);
    } else if (kind === 'shelter') {   // the bus shelter: a steel frame, a glass back, a roof, a bench, the stop's pole at its end (the street on +x)
      const st = [0.34, 0.36, 0.4], gl = [0.55, 0.68, 0.74];
      for (const z of [-1.9, 1.9]) for (const x of [-0.6, 0.6]) K.box(g, x, 0, z, 0.08, 2.5, 0.08, 0, st, st);
      K.box(g, 0.05, 2.5, 0, 1.9, 0.12, 4.3, 0, [0.9, 0.9, 0.9], [0.86, 0.87, 0.9]); K.box(g, -0.62, 0.3, 0, 0.04, 1.9, 3.8, 0, gl, gl);
      K.box(g, -0.35, 0.45, 0, 0.4, 0.06, 3.0, 0, [0.62, 0.5, 0.38], [0.62, 0.5, 0.38]);
      K.box(g, 0.8, 0, 2.6, 0.08, 2.9, 0.08, 0, st, st); K.box(g, 0.8, 2.4, 2.6, 0.06, 0.5, 0.5, 0, [0.15, 0.35, 0.7], [0.15, 0.35, 0.7]);
    } else if (kind === 'bin') {   // the orange litter bin on its post
      K.box(g, 0, 0, 0, 0.06, 0.9, 0.06, 0, gr, gr); K.cyl(g, 0, 0.55, 0, 0.24, 0.5, 8, [0.95, 0.5, 0.1], [0.15, 0.15, 0.15], 0.21);
    } else if (kind === 'sign') {   // a generic regulatory plate on a grey post
      K.box(g, 0, 0, 0, 0.07, 2.6, 0.07, 0, gr, gr); K.box(g, 0, 2.05, 0, 0.05, 0.6, 0.6, 0, [0.82, 0.12, 0.1], [0.82, 0.12, 0.1]); K.box(g, 0, 2.12, 0, 0.056, 0.46, 0.46, 0, [0.96, 0.96, 0.94], null);
    } else if (kind === 'stop') {   // the stop sign: a red octagon with a white rim on a post (no text: the shape says it), both ways
      K.box(g, 0, 0, 0, 0.07, 2.2, 0.07, 0, gr, gr);
      for (const [r, x, c] of [[0.4, 0.045, [0.95, 0.95, 0.93]], [0.35, 0.05, [0.82, 0.1, 0.1]]]) for (let k = 0; k < 8; k++) { const a0 = (k + 0.5) / 8 * TAU, a1 = (k + 1.5) / 8 * TAU;
        for (const sx of [x, -x]) g.triO([sx, 2.55, 0], [sx, 2.55 + Math.cos(a0) * r, Math.sin(a0) * r], [sx, 2.55 + Math.cos(a1) * r, Math.sin(a1) * r], c, [-sx * 5, 2.55, 0]); }
    } else if (kind === 'hydrant') { const rd = [0.82, 0.12, 0.08], yl = [0.95, 0.78, 0.12]; K.cyl(g, 0, 0, 0, 0.13, 0.62, 7, rd, yl, 0.11); K.box(g, 0, 0.35, 0, 0.38, 0.09, 0.09, 0, yl, yl); }
    else if (kind === 'cabinet') { K.box(g, 0, 0, 0, 0.5, 1.3, 0.8, 0, [0.62, 0.64, 0.6], [0.55, 0.57, 0.55]); }
    return g;
  }
  // a unit model copied into a chunk's geometry: turned by rot about y (its local +x then along (cos rot, -sin rot)), moved to (x, y, z)
  function stamp(g, U, x, y, z, rot) {
    const c = Math.cos(rot), s = Math.sin(rot), P = U.P, N = U.N, C = U.C;
    for (let k = 0; k < P.length; k += 3) { const px = P[k], pz = P[k + 2], nx = N[k], nz = N[k + 2];
      g.P.push(x + px * c + pz * s, y + P[k + 1], z - px * s + pz * c); g.N.push(nx * c + nz * s, N[k + 1], -nx * s + nz * c); g.C.push(C[k], C[k + 1], C[k + 2]); if (g.U) g.U.push(UV0[0], UV0[1]); }
  }
  function spTreeGeo(K, kind) {   // unit trees (1 m: instances scale them): 0 a fig or mango (a dense round crown), 1 a queen palm, 2 a jacaranda in bloom, 3 a small street tree
    const g = new K.GB(), R = K.rng(910 + kind), bk = [0.42, 0.34, 0.26];
    if (kind === 1) {   // a slim grey trunk, a head of drooping fronds
      K.cyl(g, 0, -0.02, 0, 0.022, 0.86, 5, [0.6, 0.57, 0.52], null, 0.017);
      const fr = [0.32, 0.5, 0.2], frD = [0.24, 0.4, 0.16];
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + R() * 0.3, c = Math.cos(a), s = Math.sin(a), L = 0.3 + R() * 0.08, y0 = 0.86;
        const tip = [c * L, y0 - 0.12 - R() * 0.06, s * L], mid = [c * L * 0.5, y0 + 0.05, s * L * 0.5], w = 0.06, px = -s * w, pz = c * w;
        g.triO([0, y0, 0], [mid[0] + px, mid[1], mid[2] + pz], tip, k % 2 ? fr : frD, [0, y0 - 1, 0]); g.triO([0, y0, 0], tip, [mid[0] - px, mid[1], mid[2] - pz], k % 2 ? frD : fr, [0, y0 - 1, 0]); }
    } else {
      const lf = kind === 2 ? [0.52, 0.42, 0.72] : kind === 3 ? [0.3, 0.46, 0.22] : [0.2, 0.36, 0.16], lfD = kind === 2 ? [0.4, 0.34, 0.58] : [0.16, 0.3, 0.13];
      K.cyl(g, 0, -0.02, 0, 0.04, 0.42, 5, bk, null, 0.03);
      const cl = kind === 0 ? [[0, 0.62, 0, 0.36], [0.2, 0.55, 0.1, 0.24], [-0.18, 0.56, -0.1, 0.25], [0.04, 0.78, -0.14, 0.22]] : kind === 2 ? [[0, 0.66, 0, 0.3], [0.2, 0.6, 0.12, 0.22], [-0.2, 0.62, -0.1, 0.2]] : [[0, 0.64, 0, 0.3], [0.1, 0.78, 0.06, 0.2]];
      cl.forEach(([x, y, z, r], k) => K.ico(g, x, y, z, r, 0.72, k % 2 ? lfD : lf, R, 0.25));
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  function spCity(PK, K) {
    const { root, out, exclPush, excluded } = PK; out.spRange = [root.children.length, 0]; const T = K.T, def = T.def, C = def.city, R = K.rng(4309), st = { buildings: 0, pitched: 0, roads: 0, crossings: 0, signals: 0, shelters: 0, poles: 0, trees: 0, pools: 0 };
    const addMesh = (geo, mat, cast, recv) => { const m = new THREE.Mesh(geo, mat); m.castShadow = !!cast; m.receiveShadow = recv !== false; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); return m; };
    const dd = (x, z) => { const n = K.nrNear(x, z); return n.i >= 0 ? n.dd : 99; };   // metres past the circuit's barriers (99: far)
    const pit = (def.pitPath || []).map(([x, z]) => [x, z]), pitD = (x, z) => { let d = 1e9; for (let k = 0; k + 1 < pit.length; k++) { const a = pit[k], b = pit[k + 1], vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz || 1, t = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / l2, 0, 1); d = Math.min(d, Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t)); } return d; };
    // the junctions (data: x, z, the widest half width meeting there), hashed in 32 m cells
    const J = C.jn, jh = new Map(), JC = 32, jk = (a, b) => a * 4096 + b;
    for (let k = 0; k < J.length; k += 3) { const a = Math.floor(J[k] / JC), b = Math.floor(J[k + 1] / JC); for (let i = a - 1; i <= a + 1; i++) for (let j = b - 1; j <= b + 1; j++) { const key = jk(i, j); let L = jh.get(key); if (!L) jh.set(key, L = []); L.push(k); } }
    const inJ = (x, z, extra) => { const L = jh.get(jk(Math.floor(x / JC), Math.floor(z / JC))); if (!L) return false; for (const k of L) if (Math.hypot(x - J[k], z - J[k + 1]) < J[k + 2] + extra) return true; return false; };

    /* ---- the buildings (256 m chunks, one material: the wall picture, vertex colours) ---- */
    const wallTex = PK.ownTex(spWallTex()), bMat = new THREE.MeshLambertMaterial({ map: wallTex, vertexColors: true });
    const bCh = new K.Chunks(256, true), bget = (x, z) => { const g = bCh.get(x, z); g.dUV = UV0; return g; };
    const bl = [], rr0 = (P, cx, cz) => { let r = 0; for (const [x, z] of P) r = Math.max(r, Math.hypot(x - cx, z - cz)); return r; };   // (the houses' centres and radii: the lot walls look for them)
    { const polys = dec(C.bld.p), kinds = u8(C.bld.k), hts = u8(C.bld.h);
      polys.forEach((Pf, k) => {
        const P = pairs(Pf), kind = kinds[k], h = hts[k] / 2; if (P.length < 3) return;
        let cx = 0, cz = 0, near = 99; for (const [x, z] of P) { cx += x; cz += z; near = Math.min(near, dd(x, z)); }
        cx /= P.length; cz /= P.length;
        if (near < 2.5 || (kind === 3 && near < 60)) return;   // (not on the circuit; its grandstands are the builder's)
        const pd = pitD(cx, cz), isPit = pd < 45 && polyArea(P) > 600;
        if (!isPit && P.some(([x, z]) => pitD(x, z) < 4.5)) return;   // (the pit lane is drawn: nothing on it)
        const r = spBuilding(K, bget(cx, cz), P, isPit ? clamp(h, 8, 10) : h, kind, R, { pit: isPit });
        bl.push(cx, cz, rr0(P, cx, cz));
        st.buildings++; if (r === 2) st.pitched++;
        let rr = 0; for (const [x, z] of P) rr = Math.max(rr, Math.hypot(x - cx, z - cz)); exclPush(cx, cz, rr + 1);
      });
      // a few towers of the city farther out (their footprints' boxes, OSM heights): the skyline over the roofs
      const TW = C.tower; for (let k = 0; k < TW.length; k += 5) { const [x, z, w, d, h] = TW.slice(k, k + 5), y = K.nrGround(x, z) - 1, g = bget(x, z), c = K.vary([0.86, 0.85, 0.82], R, 0.1);
        const P = [[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2]]; spBuilding(K, g, P, h, 1, R, null); }
    }

    /* ---- the streets: the carriageway (asphalt, its edges each at the ground's height there), the raised pavements with their kerbs
       (not across the junctions), the markings: yellow between the two directions (a double line on the avenues), white between lanes
       of one direction (dashed), none in the junctions ---- */
    const aMat = out.asphaltMat, lMat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const rCh = new K.Chunks(256, true), mk = new K.Chunks(256), RA = C.road.a, roads = dec(C.road.p), Rd = [];
    const asph = [0.78, 0.78, 0.8], walkC = [0.86, 0.84, 0.8], walkD = [0.76, 0.74, 0.7], kerbC = [0.66, 0.65, 0.62], yel = [0.98, 0.78, 0.12], whi = [0.95, 0.95, 0.93];
    roads.forEach((Pf, k) => {
      const cl = RA[k * 3], lanes = RA[k * 3 + 1], fl = RA[k * 3 + 2]; if (cl === 6 || cl === 7 || (fl & 48)) return;
      const ow = !!(fl & 1), hw = roadHW(cl, lanes, ow), S = roadSamples(K, Pf); if (S.length < 2) return;
      let near = 99; for (let q = 0; q < S.length; q += 3) near = Math.min(near, dd(S[q].x, S[q].z)); if (near < 1.5) return;   // (nothing over the circuit)
      const rank = (8 - Math.min(cl, 5)) * 0.008 + (k % 3) * 0.002, walk = cl <= 4 || cl === 8 ? (cl <= 2 ? 3.0 : 2.4) : 0, dual = ow && cl <= 2, outerOnly = dual;
      Rd.push({ cl, hw, ow, S, lanes: lanes || Math.round(hw * 2 / 3.2) });
      for (let q = 0; q + 1 < S.length; q++) {
        const a = S[q], b = S[q + 1], g = rCh.get(a.x, a.z), Y = (p, o) => K.nrGround(p.x + p.nx * o, p.z + p.nz * o) + 0.1 + rank;
        const A0 = [a.x - a.nx * hw, Y(a, -hw), a.z - a.nz * hw], A1 = [a.x + a.nx * hw, Y(a, hw), a.z + a.nz * hw], B1 = [b.x + b.nx * hw, Y(b, hw), b.z + b.nz * hw], B0 = [b.x - b.nx * hw, Y(b, -hw), b.z - b.nz * hw];
        const uv = (p) => [p[0] / 8, -p[2] / 8], sh = 0.92 + 0.08 * K.crH(Math.floor(a.x / 9), Math.floor(a.z / 9), 5), cc = [asph[0] * sh, asph[1] * sh, asph[2] * sh];
        g.quadUp(A0, A1, B1, B0, [cc, cc, cc, cc], [uv(A0), uv(A1), uv(B1), uv(B0)]);
        if (walk) for (const sd of outerOnly ? [1] : [-1, 1]) {   // the pavement: 0.15 m over the street, the kerb's face down to it
          if (inJ(a.x, a.z, walk + 1.5) || inJ(b.x, b.z, walk + 1.5)) continue;
          const o0 = sd * hw, o1 = sd * (hw + walk), P0 = [a.x + a.nx * o0, Y(a, o0) + 0.15, a.z + a.nz * o0], P1 = [a.x + a.nx * o1, Y(a, o1) + 0.15, a.z + a.nz * o1], Q1 = [b.x + b.nx * o1, Y(b, o1) + 0.15, b.z + b.nz * o1], Q0 = [b.x + b.nx * o0, Y(b, o0) + 0.15, b.z + b.nz * o0];
          const wc = (Math.floor(a.s / 6) % 2) ? walkC : walkD;
          g.quadUp(P0, P1, Q1, Q0, [wc, wc, wc, wc], [uv(P0), uv(P1), uv(Q1), uv(Q0)]);
          const F0 = [P0[0], P0[1] - 0.17, P0[2]], F1 = [Q0[0], Q0[1] - 0.17, Q0[2]];
          g.quadO(F0, F1, Q0, P0, kerbC, [a.x + a.nx * (o0 + sd * 3), P0[1] - 1, a.z + a.nz * (o0 + sd * 3)], [[0.02, 0.98], [0.02, 0.98], [0.02, 0.98], [0.02, 0.98]]);
        }
        if (dual) { if (!inJ(a.x, a.z, 3) && !inJ(b.x, b.z, 3)) {   // the median on the left of a dual carriageway: a kerbed strip of grass
          const o0 = -hw, o1 = -hw - 1.2, gc = [0.42, 0.55, 0.3], P0 = [a.x + a.nx * o0, Y(a, o0) + 0.16, a.z + a.nz * o0], P1 = [a.x + a.nx * o1, Y(a, o1) + 0.16, a.z + a.nz * o1], Q1 = [b.x + b.nx * o1, Y(b, o1) + 0.16, b.z + b.nz * o1], Q0 = [b.x + b.nx * o0, Y(b, o0) + 0.16, b.z + b.nz * o0];
          g.quadUp(P1, P0, Q0, Q1, [gc, gc, gc, gc], [[0.02, 0.98], [0.02, 0.98], [0.02, 0.98], [0.02, 0.98]]); } }
        // the markings (3 cm over the street), not in the junctions
        if (cl === 5 || inJ(a.x, a.z, 4) || inJ(b.x, b.z, 4)) continue;
        const gm = mk.get(a.x, a.z), line = (o, w2, col, dash) => { if (dash && Math.floor(a.s / 4) % 2) return;
          const L0 = [a.x + a.nx * (o - w2), Y(a, o) + 0.03, a.z + a.nz * (o - w2)], L1 = [a.x + a.nx * (o + w2), Y(a, o) + 0.03, a.z + a.nz * (o + w2)], M1 = [b.x + b.nx * (o + w2), Y(b, o) + 0.03, b.z + b.nz * (o + w2)], M0 = [b.x + b.nx * (o - w2), Y(b, o) + 0.03, b.z + b.nz * (o - w2)];
          gm.quadUp(L0, L1, M1, M0, [col, col, col, col]); };
        const n = Math.max(1, Math.round(hw * 2 / 3.2));
        if (!ow && cl <= 4) { if (cl <= 3) { line(-0.12, 0.06, yel, false); line(0.12, 0.06, yel, false); } else line(0, 0.06, yel, true); }   // between the directions
        const per = ow ? n : Math.floor(n / 2);   // lanes of one direction: white dashes between them
        for (let l = 1; l < per; l++) { const o = ow ? -hw + l * 2 * hw / n : hw - l * hw / per; line(o, 0.06, whi, true); if (!ow) line(-o, 0.06, whi, true); }
      }
      st.roads++;
    });
    for (const g of rCh.map.values()) if (!g.empty) addMesh(g.geometry(), aMat, false);
    { const P = PK.P, U = SPU = { x0: P.x0, z0: P.z0, nx: Math.ceil((P.x1 - P.x0) / 8), nz: Math.ceil((P.z1 - P.z0) / 8) }; U.m = new Uint8Array(U.nx * U.nz);   // the city's ground
      const mark = (x, z, r) => { for (let i = Math.floor((x - r - U.x0) / 8); i <= Math.floor((x + r - U.x0) / 8); i++) for (let j = Math.floor((z - r - U.z0) / 8); j <= Math.floor((z + r - U.z0) / 8); j++) {
        if (i < 0 || j < 0 || i >= U.nx || j >= U.nz) continue; const d = Math.hypot(U.x0 + (i + 0.5) * 8 - x, U.z0 + (j + 0.5) * 8 - z), v = Math.round(255 * clamp((r - d) / 6 + 0.5, 0, 1)); if (v > U.m[j * U.nx + i]) U.m[j * U.nx + i] = v; } };
      for (let k = 0; k < bl.length; k += 3) if (dd(bl[k], bl[k + 1]) > 8) mark(bl[k], bl[k + 1], bl[k + 2] + 7);
      for (const r of Rd) if (r.cl !== 5) for (let q = 0; q < r.S.length; q += 2) if (dd(r.S[q].x, r.S[q].z) > 8) mark(r.S[q].x, r.S[q].z, r.hw + 7); }
    // the lot walls (muros): along the residential streets, at the back of the pavement wherever a house stands behind it, 1.8-2.4 m of
    // painted block wall (now and then a gate's gap); one indexed ribbon per 256 m (front, top, back)
    { const bh = new Map(), BH = 24, bk = (a, b) => a * 4096 + b;
      for (let k = 0; k < bl.length; k += 3) { const a = Math.floor(bl[k] / BH), b = Math.floor(bl[k + 1] / BH), key = bk(a, b); let L = bh.get(key); if (!L) bh.set(key, L = []); L.push(k); }
      const behind = (x, z) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = bh.get(bk(Math.floor(x / BH) + i, Math.floor(z / BH) + j)); if (L) for (const k of L) if (Math.hypot(x - bl[k], z - bl[k + 1]) < bl[k + 2] + 4) return true; } return false; };
      const wc = new Map(), WCH = 256, wget = (x, z) => { const key = Math.floor(x / WCH) + ',' + Math.floor(z / WCH); let g = wc.get(key); if (!g) wc.set(key, g = new K.RB(true)); return g; };
      for (const r of Rd) { if (r.cl < 3 || r.cl === 5) continue; const walk = r.cl <= 2 ? 3.0 : 2.4;
        for (const sd of r.ow && r.cl <= 2 ? [1] : [-1, 1]) {
          let prev = null, col = null, H = 2;
          for (let q = 0; q < r.S.length; q++) {
            const p = r.S[q], o = sd * (r.hw + walk + 0.15), x = p.x + p.nx * o, z = p.z + p.nz * o, bx = x + p.nx * sd * 5, bz = z + p.nz * sd * 5;
            const on = !inJ(x, z, walk + 2) && behind(bx, bz) && dd(x, z) > 4 && K.crH(Math.floor(p.s / 9), q, r.cl) > 0.08;
            if (!on) { prev = null; continue; }
            if (!prev) { col = K.vary(SP_WALL[Math.floor(R() * SP_WALL.length)], R, 0.1); H = 1.8 + R() * 0.6; }
            const g = wget(x, z), y = K.nrGround(x, z) + 0.1, ox = p.nx * sd * 0.18, oz = p.nz * sd * 0.18, top = [col[0] * 0.85, col[1] * 0.85, col[2] * 0.85], uv = [UV0, UV0];
            const row = g.row([[x, y, z], [x, y + H, z], [x, y + H, z], [x + ox, y + H, z + oz], [x + ox, y + H, z + oz], [x + ox, y, z + oz]], [col, col, top, top, col, col], [UV0, UV0, UV0, UV0, UV0, UV0]);
            if (prev != null && prev.g === g) { if (sd > 0) { g.link(prev.r, row, 0, 1); g.link(prev.r, row, 2, 3); g.link(prev.r, row, 4, 5); } else { g.link(row, prev.r, 0, 1); g.link(row, prev.r, 2, 3); g.link(row, prev.r, 4, 5); } }
            prev = { g, r: row };
          } } }
      const wm = new THREE.MeshLambertMaterial({ map: wallTex, vertexColors: true, side: THREE.DoubleSide });
      for (const g of wc.values()) if (!g.empty) addMesh(g.geometry(), wm, false); }

    /* ---- the crossings (OSM crossing nodes): zebra stripes across the street the node lies on (0.4 m stripes along the traffic, 4 m long)
       and the stop lines before them at the traffic lights; the junctions' furniture ---- */
    const nearRoad = (x, z, maxD) => { let best = null, bd = maxD; for (const r of Rd) { if (r.cl === 5) continue; const S = r.S;
      for (let q = 0; q < S.length; q++) { const d = Math.hypot(S[q].x - x, S[q].z - z); if (d < bd) { bd = d; best = { r, q, d }; } } } return best; };
    const N = C.node, UG = {}, put = (kind, x, y, z, rot) => stamp(bget(x, z), UG[kind] || (UG[kind] = unitGeo(K, kind)), x, y, z, rot);   // (the furniture in the buildings' chunks: no draws of its own)
    const rotTo = (ax, az) => Math.atan2(-az, ax);   // (an instance's local +x along (ax, az))
    const zebra = (r, q, w) => {   // stripes across the whole carriageway at sample q of street r
      const p = r.S[q], g = mk.get(p.x, p.z), hw = r.hw;
      for (let o = -hw + 0.3; o < hw - 0.2; o += 0.9) { const y = K.nrGround(p.x + p.nx * o, p.z + p.nz * o) + 0.2, Q = (a, b) => [p.x + p.tx * a + p.nx * (o + b), y, p.z + p.tz * a + p.nz * (o + b)];
        g.quadUp(Q(-w / 2, 0), Q(-w / 2, 0.42), Q(w / 2, 0.42), Q(w / 2, 0), [whi, whi, whi, whi]); }
    };
    const stopLine = (r, q, sd) => { const p = r.S[q], g = mk.get(p.x, p.z), o0 = r.ow ? -r.hw : 0, o1 = r.hw, y = p.y + 0.2, Q = (a, b) => [p.x + p.tx * a + p.nx * b, y, p.z + p.tz * a + p.nz * b];
      g.quadUp(Q(-0.25 * sd, o0), Q(-0.25 * sd, o1), Q(0.25 * sd, o1), Q(0.25 * sd, o0), [whi, whi, whi, whi]); };
    for (let k = 0; k < N.length; k += 3) {
      const code = N[k], x = N[k + 1], z = N[k + 2]; if (dd(x, z) < 2) continue;
      if (code === 1) { const f = nearRoad(x, z, 7); if (f && !(f.r.cl === 4 && R() < 0.4)) { zebra(f.r, f.q, f.r.cl <= 2 ? 4 : 3); st.crossings++; } }
      else if (code === 0) {   // a traffic light: for each way in along the street through it, a mast arm from the right-hand kerb over the lanes, a stop line before it
        const f = nearRoad(x, z, 9); if (!f) continue; const r = f.r, S = r.S;
        for (const sd of r.ow ? [1] : [1, -1]) {   // (sd: the traffic's direction along the street's samples)
          const q = clamp(f.q - sd * 2, 0, S.length - 1), p = S[q], tx = p.tx * sd, tz = p.tz * sd, rx = -tz, rz = tx, o = r.hw + (r.cl <= 4 ? 0.8 : 0.6);
          const px = p.x + rx * o, pz = p.z + rz * o; if (dd(px, pz) < 3) continue;
          put('signal', px, K.nrGround(px, pz) + 0.15, pz, rotTo(-rx, -rz)); st.signals++;
          stopLine(r, clamp(q - sd, 0, S.length - 1), sd);
          if (R() < 0.7) put('cabinet', px + tx * -1.5 + rx * 0.6, K.nrGround(px, pz) + 0.15, pz + tz * -1.5 + rz * 0.6, rotTo(tx, tz));
          put('sign', px - tx * 6 + rx * 0.2, K.nrGround(px, pz) + 0.15, pz - tz * 6 + rz * 0.2, rotTo(tx, tz));
        }
        zebra(r, f.q, r.cl <= 2 ? 4 : 3);
      } else if (code === 2) {   // a bus stop: the shelter on the pavement, its open side to the street
        const f = nearRoad(x, z, 14); if (!f) continue; const p = f.r.S[f.q], sx = Math.sign((x - p.x) * p.nx + (z - p.z) * p.nz) || 1, o = f.r.hw + 1.4, bx = p.x + p.nx * sx * o, bz = p.z + p.nz * sx * o;
        if (dd(bx, bz) < 3 || excluded(bx, bz)) continue;
        put('shelter', bx, K.nrGround(bx, bz) + 0.15, bz, rotTo(-p.nx * sx, -p.nz * sx)); put('bin', bx + p.tx * 3.2, K.nrGround(bx, bz) + 0.15, bz + p.tz * 3.2, 0); st.shelters++;
      } else if (code === 5) put('hydrant', x, K.nrGround(x, z), z, 0);
    }
    // at the junctions without lights: a stop sign on the minor streets' corners (some), a hydrant now and then
    for (let k = 0; k < J.length; k += 3) { const x = J[k], z = J[k + 1], hw = J[k + 2]; if (hw > 3.4 || dd(x, z) < 6 || R() > 0.35) continue;
      const f = nearRoad(x, z, 4); if (!f || f.r.cl < 4) continue; const S = f.r.S, q = clamp(f.q + (f.q > 2 ? -3 : 3), 0, S.length - 1), p = S[q], sd = q < f.q ? 1 : -1, rx = -p.tz * sd, rz = p.tx * sd, o = f.r.hw + 0.9;
      const sx = p.x + rx * o, sz = p.z + rz * o; if (excluded(sx, sz)) continue; put('stop', sx, K.nrGround(sx, sz) + 0.15, sz, rotTo(p.tx * sd, p.tz * sd)); stopLine(f.r, q, sd);
      if (R() < 0.3) put('hydrant', sx + p.tx * sd * -1.2, K.nrGround(sx, sz) + 0.15, sz + p.tz * sd * -1.2, 0); }
    // the utility poles along the streets (every ~34 m on one side, the lamp's arm over the street), the wires between them; bins on some
    const wires = [], wcol = [];
    for (const r of Rd) { if (r.cl === 5) continue;
      const S = r.S, side = (Math.round(S[0].x + S[0].z) & 1) ? 1 : -1, o = r.hw + (r.cl <= 4 ? 0.5 : 0.8); let prev = null, lastS = -1e9;
      for (let q = 0; q < S.length; q++) { const p = S[q]; if (p.s - lastS < 38 || inJ(p.x, p.z, 3)) continue;
        const x = p.x + p.nx * side * o, z = p.z + p.nz * side * o; if (dd(x, z) < 4 || excluded(x, z)) continue; lastS = p.s;
        const y = K.nrGround(x, z) + 0.15; put(R() < 0.12 ? 'xfmr' : 'pole', x, y, z, rotTo(-p.nx * side, -p.nz * side)); st.poles++;
        if (R() < 0.12) put('bin', x + p.tx * 0.6, y, z + p.tz * 0.6, 0);
        if (prev && Math.hypot(x - prev[0], z - prev[2]) < 48) for (const [h, w] of [[8.68, -0.9], [8.68, 0.9], [7.45, 0]]) {   // three wires, sagging
          const a = [prev[0] - p.nx * side * w * 0, prev[1] + h, prev[2]], b = [x, y + h, z], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.6, (a[2] + b[2]) / 2];
          wires.push(...a, ...m, ...m, ...b); }
        prev = [x, y, z];
      } }
    if (wires.length) { const gw = new THREE.BufferGeometry(); gw.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3));
      const lm = new THREE.LineSegments(gw, new THREE.LineBasicMaterial({ color: 0x3a3a3c, fog: true })); lm.matrixAutoUpdate = false; root.add(lm); }
    for (const g of mk.map.values()) if (!g.empty) addMesh(g.geometry(), lMat, false);

    /* ---- water: the swimming pools in the yards (blue, a pale rim), the lake in the circuit's grounds (the builder's water, its shore band) ---- */
    { const gp = new K.GB(), blue = [0.25, 0.62, 0.86], rim = [0.9, 0.9, 0.86];
      for (const Pf of dec(C.pool)) { const P = pairs(Pf); if (P.length < 3) continue; let y = 1e9, cx = 0, cz = 0; for (const [x, z] of P) { y = Math.min(y, K.nrGround(x, z)); cx += x; cz += z; }
        cx /= P.length; cz /= P.length; if (dd(cx, cz) < 3) continue; y += 0.12;
        const con = P.map(([x, z]) => new THREE.Vector2(x, z)), sh = P.map(([x, z]) => [cx + (x - cx) * 1.15 + Math.sign(x - cx) * 0.3, cz + (z - cz) * 1.15 + Math.sign(z - cz) * 0.3]);
        for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(con, [])) { gp.triO([sh[a][0], y, sh[a][1]], [sh[b][0], y, sh[b][1]], [sh[c][0], y, sh[c][1]], rim, [cx, y - 5, cz]); gp.triO([P[a][0], y + 0.03, P[a][1]], [P[b][0], y + 0.03, P[b][1]], [P[c][0], y + 0.03, P[c][1]], blue, [cx, y - 5, cz]); }
        st.pools++; }
      if (!gp.empty) addMesh(gp.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x0a2a40 }), false); }
    if (SPC && SPC.lakes.length) {
      const gw = new K.GB(true), wc = [1, 1, 1], bands = [];
      for (const L of SPC.lakes) { const con = L.poly.map(([x, z]) => new THREE.Vector2(x, z)), uv = (p) => [p[0] / 16, -p[1] / 16];
        for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(con, [])) { const Q = (p) => [p[0], L.lvl, p[1]]; gw.triO(Q(L.poly[a]), Q(L.poly[b]), Q(L.poly[c]), wc, [L.poly[a][0], L.lvl - 5, L.poly[a][1]], wc, wc, uv(L.poly[a]), uv(L.poly[b]), uv(L.poly[c])); }
        for (const [x, z] of L.poly) exclPush(x, z, 3);
        bands.push(K.shoreBand(L.b[0] - 8, L.b[2] - 8, L.b[1] + 8, L.b[3] + 8, L.lvl + 0.015, (x, z) => (K.inPoly(L.poly, x, z) ? 1 : -1) * K.polyDist(L.poly, x, z), 16)); }
      const WO = { len: 0.9, amp: 0.5, refl: 0.5, land: 0.8, shal: 0.5, lap: 0.4, surf: 0 }, wm = addMesh(gw.geometry(), K.waterMat(PK.tex, Object.assign({ color: 0x51705e }, WO)), false);
      out.dyn.water = PK.tex.water; K.addShore(root, K.mergeBands(bands), wm.material, WO);
    }

    /* ---- the green: parks and pitches (the football pitches of the district: grass or the red earth of a várzea pitch, white lines) ---- */
    { const gg = new K.GB(), PKS = dec(C.park.p), PKK = C.park.k;
      PKS.forEach((Pf, k) => { if (PKK[k] !== 1) return; const P = pairs(Pf); if (P.length < 3) return; const rect = minRect(P); if (!rect || rect.hu * rect.hv < 60) return;
        let cx = rect.cx, cz = rect.cz; if (dd(cx, cz) < 3) return; const y = K.nrGround(cx, cz) + 0.09, earth = K.crH(Math.floor(cx), Math.floor(cz), 7) < 0.45, col = earth ? [0.68, 0.38, 0.24] : [0.36, 0.56, 0.26];
        const Q = (a, b, dy) => [cx + rect.ux * a - rect.uz * b, y + (dy || 0), cz + rect.uz * a + rect.ux * b];
        gg.quadUp(Q(-rect.hu, -rect.hv), Q(rect.hu, -rect.hv), Q(rect.hu, rect.hv), Q(-rect.hu, rect.hv), [col, col, col, col]);
        const lw = 0.12, wl = [0.95, 0.95, 0.92], hu = rect.hu - 1, hv = rect.hv - 1;
        for (const [a0, b0, a1, b1] of [[-hu, -hv, hu, -hv + lw], [-hu, hv - lw, hu, hv], [-hu, -hv, -hu + lw, hv], [hu - lw, -hv, hu, hv], [-lw / 2, -hv, lw / 2, hv]]) gg.quadUp(Q(a0, b0, 0.02), Q(a1, b0, 0.02), Q(a1, b1, 0.02), Q(a0, b1, 0.02), [wl, wl, wl, wl]);
        for (const sd of [-1, 1]) { const gx = sd * (hu - 0.1); for (const b of [-2.5, 2.5]) K.box(gg, cx + rect.ux * gx - rect.uz * b, y, cz + rect.uz * gx + rect.ux * b, 0.1, 2.2, 0.1, 0, [0.96, 0.96, 0.96]);
          const P1 = Q(gx, -2.5, 2.2), P2 = Q(gx, 2.5, 2.2); K.box(gg, (P1[0] + P2[0]) / 2, y + 2.15, (P1[2] + P2[2]) / 2, 0.1, 0.1, 5.1, Math.atan2(rect.uz, rect.ux), [0.96, 0.96, 0.96]); }
        exclPush(cx, cz, Math.min(rect.hu, rect.hv)); });
      if (!gg.empty) addMesh(gg.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), false); }

    /* ---- the trees: the OSM trees and tree rows, the street trees on the pavements, the land cover's woods and the circuit's grounds
       (figs and mangos, queen palms, jacarandas in bloom, small street trees); none on a street ---- */
    const RM = new Set(), RMC = 4, rmk = (a, b) => a * 8192 + b;   // the streets' footprint in 4 m cells
    for (const r of Rd) for (const p of r.S) { const e = r.hw + 3; for (let o = -e; o <= e; o += 2) { const x = p.x + p.nx * o, z = p.z + p.nz * o; RM.add(rmk(Math.floor(x / RMC), Math.floor(z / RMC))); } }
    const onRoad = (x, z) => RM.has(rmk(Math.floor(x / RMC), Math.floor(z / RMC)));
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true }), TG = [0, 1, 2, 3].map(k => new K.IChunks(spTreeGeo(K, k), tMat, 512));
    const plant = (x, z, sp, sc) => {
      if (dd(x, z) < 4 || excluded(x, z) || onRoad(x, z) || pitD(x, z) < 6) return false;
      const h = (sp === 0 ? 9 + R() * 7 : sp === 1 ? 9 + R() * 6 : sp === 2 ? 7 + R() * 4 : 4 + R() * 2.5) * (sc || 1), w = h * (sp === 1 ? 0.95 : sp === 2 ? 1.05 : 0.95 + R() * 0.2), cv = 0.86 + R() * 0.26;
      TG[sp].add(x, K.nrGround(x, z) - 0.1, z, R() * TAU, w, h, [cv * (0.94 + R() * 0.12), cv, cv * (0.94 + R() * 0.12)]); st.trees++; return true; };
    const pick = () => { const u = R(); return u < 0.45 ? 0 : u < 0.7 ? 1 : u < 0.82 ? 2 : 3; };
    for (let k = 0; k < C.tree.length; k += 2) plant(C.tree[k], C.tree[k + 1], pick());
    for (const Pf of dec(C.trow)) for (let k = 0; k + 3 < Pf.length; k += 2) { const ax = Pf[k], az = Pf[k + 1], bx = Pf[k + 2], bz = Pf[k + 3], l = Math.hypot(bx - ax, bz - az), sp = R() < 0.5 ? 1 : 0;
      for (let t = 0; t < l; t += 8) plant(lerp(ax, bx, t / l), lerp(az, bz, t / l), sp); }
    for (const r of Rd) { if (r.cl < 3 || r.cl > 4) continue; for (const p of r.S) { if (R() > 0.06) continue; const sd = R() < 0.5 ? -1 : 1, o = r.hw + 1.6; plant(p.x + p.nx * sd * o, p.z + p.nz * sd * o, R() < 0.75 ? 3 : 2, 0.9); } }
    { const L = def.lc, A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';   // the woods of the land cover: 2-3 trees in a 16 m cell
      for (let j = 0; j < L.nz; j++) for (let i = 0; i < L.nx; i++) { const x = L.x0 + (i + 0.5) * L.cell, z = L.z0 + (j + 0.5) * L.cell;
        if (K.nrLC(x, z) !== 1 || K.nrDist(x, z) > 330) continue;
        for (let n = 0; n < 3; n++) plant(x + (R() - 0.5) * 15, z + (R() - 0.5) * 15, R() < 0.7 ? 0 : R() < 0.5 ? 1 : 2); } }
    for (const t of TG) t.addTo(root, true);
    for (const g of bCh.map.values()) { if (g.empty) continue; addMesh(g.geometry(), bMat, true); }   // (the buildings with the street furniture)

    /* ---- the pit lane on the left of the main straight (OSM): asphalt, white lines along both edges, the concrete apron beyond it ---- */
    if (pit.length > 1) {
      const P2 = []; for (const [x, z] of pit) P2.push(x, z); const S = roadSamples(K, Float32Array.from(P2)), g = new K.GB(true), gm = new K.GB(), hw = 3.6, cc = [0.82, 0.82, 0.84], ap = [0.86, 0.86, 0.83];
      const Y = (p, o) => { const x = p.x + p.nx * o, z = p.z + p.nz * o, n = K.nrNear(x, z); return (n.i >= 0 && n.d < 40 ? Math.max(K.nrGround(x, z), n.hn - 0.3) : K.nrGround(x, z)) + 0.08; };
      for (let q = 0; q + 1 < S.length; q++) { const a = S[q], b = S[q + 1], uv = (p) => [p[0] / 8, -p[2] / 8];
        const pts = (o0, o1, dy) => [[a.x + a.nx * o0, Y(a, o0) + dy, a.z + a.nz * o0], [a.x + a.nx * o1, Y(a, o1) + dy, a.z + a.nz * o1], [b.x + b.nx * o1, Y(b, o1) + dy, b.z + b.nz * o1], [b.x + b.nx * o0, Y(b, o0) + dy, b.z + b.nz * o0]];
        const A = pts(-hw, hw, 0); g.quadUp(A[0], A[1], A[2], A[3], [cc, cc, cc, cc], A.map(uv));
        for (const o of [-hw + 0.25, hw - 0.25]) { const M = pts(o - 0.1, o + 0.1, 0.03); gm.quadUp(M[0], M[1], M[2], M[3], [whi, whi, whi, whi]); }
        if (q % 3 === 0) { const M = pts(-0.1, 0.1, 0.03); gm.quadUp(M[0], M[1], M[2], M[3], [whi, whi, whi, whi]); }
        const sd = -1, Bq = pts(sd * hw, sd * (hw + 8), -0.01); if (dd(Bq[1][0], Bq[1][2]) > 3) g.quadUp(Bq[0], Bq[1], Bq[2], Bq[3], [ap, ap, ap, ap], Bq.map(uv));   // the apron on the garages' side (the lane's left: away from the track)
        exclPush(a.x, a.z, hw + 2);
      }
      addMesh(g.geometry(), out.asphaltMat, false); addMesh(gm.geometry(), lMat, false);
    }

    /* ---- the circuit's own street furniture, knockable (Core's props): the pit entry's bollards on the painted nose between the track and
       the lane and its sign, the pit exit's light at the end of the pit wall and the bollards along its blend line ---- */
    if (pit.length > 1) {
      const L = T.len, sAt = (d) => (((T.startS + d) % L) + L) % L, w = T.w;
      const PD = []; for (let k = 0; k + 1 < pit.length; k++) { const [ax, az] = pit[k], [bx, bz] = pit[k + 1], l = Math.hypot(bx - ax, bz - az); for (let t = 0; t < l; t += 1) PD.push([ax + (bx - ax) * t / l, az + (bz - az) * t / l]); }   // (the lane every metre)
      const laneOff = (d) => { const i = T.idx(sAt(d)); let best = 1e9; for (const [x, z] of PD) { const dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i]; if (Math.abs(al) > 1) continue; const lat = -(dx * T.nx[i] + dz * T.nz[i]); if (lat > 0) best = Math.min(best, lat); } return best; };   // (the lane's centre to the left of the track)
      const at = (d, o) => { const i = T.idx(sAt(d)); return [T.px[i] - T.nx[i] * o, T.pz[i] - T.nz[i] * o, T.hd[i], i]; };
      const put2 = (kind, d, o, yaw) => { const [x, z, h, i] = at(d, o); if (o > T.bl[i] - 0.6) return; out.props.push({ kind, x, z, yaw: h + (yaw || 0), col: 0, i }); };
      for (let d = -334; d <= -290; d += 6) { const lo = laneOff(d), gap = lo - 3.6 - w; if (gap > 1.2 && lo < 200) put2('bollard', d, w + gap / 2, 0); }
      put2('sign', -440, w + 3.2, Math.PI / 2);
      { const lo = laneOff(766); if (lo < 200) put2('signal', 766, w + (lo - 3.6 - w) / 2, -Math.PI / 2); }
      for (let d = 782; d <= 822; d += 8) { const lo = laneOff(d), gap = lo - 3.6 - w; if (gap > 1.2 && lo < 200) put2('bollard', d, w + gap / 2, 0); }
    }

    out.spRange[1] = root.children.length;
    return { trees: st.trees, buildings: st.buildings, pitched: st.pitched, roads: st.roads, crossings: st.crossings, signals: st.signals, shelters: st.shelters, poles: st.poles, pools: st.pools };
  }
})();
