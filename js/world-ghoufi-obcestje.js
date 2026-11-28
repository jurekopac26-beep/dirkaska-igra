/* =========================================================================
   WORLD — Ghoufi, Alžirija: the roadside from OpenStreetMap (obcestje). What the map has near this road beyond what js/world-ghoufi.js
   already draws (the river, the palms of the orchard, the viewpoint). Data: © OpenStreetMap contributors, ODbL 1.0, read through the
   OpenStreetMap API on 24. 11. 2026 and laid in the track's metres with the importer's projection (tools/proga-uvoz.mjs, origin
   35.054359, 6.165256: x east, z south). Heights only from the game's terrain (Copernicus DEM). No names, signs or inscriptions.
   Drawn (each on OSM's line, nothing moved):
   - way 1130863921, natural=cliff (23 nodes, 1075 m): the rock rim of the canyon below the road, 41-140 m from it on its canyon side.
     A band of layered rock on the line, its face on the way's right (OSM: a cliff's foot is on the right of its direction; here the river's
     side). The DEM smooths the canyon, so the band is as high as the game's slope gives it (assumed: a crest 0.5-1.7 m over the ground,
     a face stepped once, 3.5-6.5 m out);
   - way 1130916934, waterway=stream, intermittent=yes (the 29 nodes within 300 m of the road, of 47): the dry bed of a side wadi that
     meets the river below the start. Pale gravel on the ground, no water (assumed: 4 m wide, OSM gives no width);
   - way 1130916932, power=line (5 nodes, 635 m): a power line on the plateau, 96-410 m from the road, ending beside the run-out. A mast
     at each node of the way and three wires between them (assumed: the masts' shape and their 20 m, OSM has no tags on the nodes and
     no voltage);
   - way 1130863924, amenity=parking (117 m round) with way 1130863923, barrier=retaining_wall (61 m) on its lower edge: the car park
     beyond the road's far end, 113-150 m past the last point of the run-out (assumed: bare gravel, OSM gives no surface; a wall of the
     local stone 0.5 m thick). No cars, no people.
   Not drawn: way 1014038882 (highway=service, 137 m and more behind the grid, out of the chase camera's view); the second cliff
   (way 1130863922) and the cliffs, orchard, hostel and streets of the far bank (150 m and more past the end or across the canyon); the
   road itself (way 308263161) is the track.
   Beside the road itself (the second pass, 24. 11. 2026): OSM has nothing mapped between the asphalt and 40 m from it but the viewpoint
   (node 3135560243) - no fence, wall, path, sign or terrace - so nothing of that kind is invented. What stands there comes from the
   heights (Copernicus DEM: where the ground is steep), the land cover (ESA WorldCover, through World.api.vrLC) and the public
   descriptions of the place (the canyon of the Abiod river cut in soft, layered sandstone; rock ledges and platforms on its rim, the
   "balconies"; abandoned stone houses and terraced gardens in cascades below the road; few fences):
   - layered sandstone ledges where the DEM's slope is steep, on both sides beyond the barrier line: bands of rock along the contour,
     light tops, faces stepped once, fallen blocks below them (assumed: every size and place, only the rock and its layering are
     from the sources);
   - flat rock pavement and pale gravel on the ground between the verge and the barrier line and beyond it (flat, nothing to hit);
   - dry cushion shrubs and straw tussocks by the land cover (assumed: generic, no species - no source names the plants by the road);
   - broken dry-stone walls on the canyon's side along the stretch of the village (assumed: their places and sizes; the sources tell of
     stonework, terraced gardens and ruins, not where each wall stands);
   - a trodden footpath from the road to OSM's viewpoint (assumed: OSM maps no path).
   The physics is untouched: everything that stands up is at least 0.8 m beyond the barrier line (where a car cannot come), what lies
   within it is flat on the ground, and nothing is added to the barriers or the collision lists. No tree or rock of the world moves
   (nothing new is pushed to keepOut, the world's random sequence is as it was).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.gore || !World.ext || typeof World.ext.ghoufi !== 'function') return;
  const API = World.api, { clamp, vrGround } = API;

  // ---- the data: flat x, z lists in the track's metres, in OSM's node order ----
  const CLIFF = [-340.6, 631.4, -356.8, 578.3, -362.6, 514.5, -339.6, 454.6, -311.3, 410.7, -282.4, 382.5, -195.8, 329.4, -136.5, 327.4, -83.7, 338.1, -49.4, 341.5,
    -18.6, 334.7, 64.1, 365.9, 138, 411.7, 171.8, 435.1, 206, 436.1, 213.8, 415.6, 209.4, 380, 199.4, 364.4, 177.9, 325.7, 141.4, 274.5, 121.8, 237.5, 119.6, 222.2, 125.5, 196.1];
  const STREAM = [-272.1, -365.4, -277.5, -323.9, -258.4, -308.4, -240.8, -300.1, -212.4, -275.7, -163, -281.1, -153.2, -270.4, -151.7, -239.2, -128.7, -221.7, -113.1, -209,
    -93.7, -203.4, -89.6, -181.9, -92.5, -164.4, -92, -146.4, -85.4, -134.4, -56.5, -132.5, -39.6, -122.5, -18.6, -106.2, -2.2, -75.5, 12, -66.5, 32.3, -81.1, 45, -87.9, 69, -84.7,
    82.7, -70.1, 91.5, -55.3, 110.8, -31.2, 115.5, -23.9, 122.1, -12.9, 134, 9.3];
  const LINE = [-489.9, -315.7, -478.1, -254.8, -465.4, -115.9, -449.8, 23.4, -412.1, 314.3];
  const PARK = [-394.5, 498.9, -384.9, 508.7, -385.6, 520.8, -415.5, 530.6, -429.4, 520.1, -414.8, 513.8, -398.4, 505];
  const WALL = [-429.4, 520.1, -415.5, 530.6, -385.6, 520.8, -384.9, 508.7];
  const ROCK = [0.63, 0.5, 0.36], ROCK_D = [0.5, 0.39, 0.28], ROCK_L = [0.71, 0.59, 0.45], BED = [0.69, 0.64, 0.55], PAD = [0.62, 0.56, 0.46];
  const STEEL = [0.63, 0.65, 0.67], STEEL_D = [0.5, 0.52, 0.54], WIRE = [0.24, 0.24, 0.26];
  const BED_HW = 2, MAST_H = 20;
  const CO = World.ghoufiObcestje = { keepOut, extra, stats: null };

  // ---- helpers (no rng: the world's own random sequence stays as it was) ----
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z, s) => { const u = x / s, v = z / s, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1); return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv; };
  const tone = (c, x, z, k) => { const f = 1 - k / 2 + k * patch(x + 300, z - 170, 7); return [c[0] * f, c[1] * f, c[2] * f]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const resample = (L, step) => {   // a flat x, z list -> points at most step m apart, its corners kept
    const out = [L[0], L[1]];
    for (let q = 0; q + 3 < L.length; q += 2) {
      const ax = L[q], az = L[q + 1], bx = L[q + 2], bz = L[q + 3], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
      for (let t = 1; t <= m; t++) out.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
    }
    return out;
  };
  const normals = (Q) => {   // per point the unit normal to the way's right (x east, z south: seen from above)
    const n = Q.length / 2, F = [];
    const segN = (j) => { const dx = Q[2 * j + 2] - Q[2 * j], dz = Q[2 * j + 3] - Q[2 * j + 1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
    for (let k = 0; k < n; k++) { const a = k > 0 ? segN(k - 1) : null, b = k < n - 1 ? segN(k) : null, m = a && b ? [a[0] + b[0], a[1] + b[1]] : (a || b), l = Math.hypot(m[0], m[1]) || 1; F.push([m[0] / l, m[1] / l]); }
    return F;
  };
  // the car park's outline across at z: [x0, x1] (its shape has one stretch per z) or null
  const parkAt = (z) => {
    let x0 = 1e9, x1 = -1e9; const n = PARK.length / 2;
    for (let k = 0; k < n; k++) { const ax = PARK[2 * k], az = PARK[2 * k + 1], bx = PARK[2 * ((k + 1) % n)], bz = PARK[2 * ((k + 1) % n) + 1];
      if ((az - z) * (bz - z) > 0 || az === bz) continue; const x = ax + (bx - ax) * (z - az) / (bz - az); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    return x1 - x0 > 0.5 ? [x0, x1] : null;
  };
  const CLIFF_Q = resample(CLIFF, 3), CLIFF_N = normals(CLIFF_Q), STREAM_Q = resample(STREAM, 3), STREAM_N = normals(STREAM_Q), WALL_Q = resample(WALL, 2.5);

  // ---- no trees (nor rocks) on what is drawn here: gore.build calls this before it plants them ----
  function keepOut(push) {
    for (let k = 0; k < CLIFF_Q.length; k += 2) { const f = CLIFF_N[k / 2]; push(CLIFF_Q[k] + f[0] * 2.5, CLIFF_Q[k + 1] + f[1] * 2.5, 6); }
    for (let k = 0; k < STREAM_Q.length; k += 2) push(STREAM_Q[k], STREAM_Q[k + 1], BED_HW + 1.6);
    for (let k = 0; k < LINE.length; k += 2) push(LINE[k], LINE[k + 1], 3);
    for (let z = 500; z <= 530; z += 3) { const a = parkAt(z); if (a) for (let x = a[0]; x <= a[1] + 1.5; x += 3) push(Math.min(x, a[1]), z, 2.6); }
    for (let k = 0; k < WALL_Q.length; k += 2) push(WALL_Q[k], WALL_Q[k + 1], 1.8);
  }

  // ---- the meshes: gore.build calls this (ctx: its scenery chunks, root and the rest) after the track's own extra ----
  function extra(ctx) {
    const st = CO.stats = { cliffM: 0, streamM: 0, masts: 0, spans: 0, parkM2: 0, wallM: 0, meshes: 0, ledges: 0, ledgeM: 0, blocks: 0, plates: 0, gravel: 0, shrubs: 0, tufts: 0, wallRuinM: 0, pathM: 0 };
    if (!ctx || !ctx.scen || !ctx.root) return;
    const { scen, root, P } = ctx, gH = vrGround, TL = API.VRC * API.VRT;
    // the terrain under a point: 1 its full tiles (5 m cells, vrGround exactly their surface), 2 the coarse ring, 0 none
    const tile = (x, z) => (P && P.G && typeof API.vrTileOn === 'function' && API.vrTileOn(Math.floor((x - P.G.x0) / TL), Math.floor((z - P.G.z0) / TL))) || 0;
    const gCol = (x, z) => (typeof ctx.gColAt === 'function' ? ctx.gColAt(x, z) : [0.5, 0.46, 0.34]);
    cliff(scen, gH, tile, gCol, st);
    const g = new API.GB(true);
    stream(g, gH, tile, gCol, st);
    park(g, scen, gH, tile, gCol, st);
    roadside(g, ctx, gH, tile, gCol, st);
    if (!g.empty) {
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ map: API.vrGritTex(), vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); st.meshes++;
    }
    powerLine(scen, gH, tile, st);
  }

  /* ======== beside the road: ledges, pavement, shrubs, walls, the viewpoint's path (see the head of the file) ======== */
  const SAND = [[0.74, 0.6, 0.42], [0.68, 0.53, 0.36], [0.6, 0.45, 0.31], [0.78, 0.66, 0.48], [0.66, 0.47, 0.33]];   // (the strata: ochre, tan, rust)
  const SHRUB = [[0.43, 0.45, 0.27], [0.5, 0.48, 0.3], [0.37, 0.41, 0.26], [0.56, 0.52, 0.33]], STRAW = [[0.74, 0.65, 0.4], [0.68, 0.6, 0.37], [0.8, 0.72, 0.47]];
  const PLATE = [0.73, 0.63, 0.48], GRAVEL = [0.7, 0.63, 0.52], PATH = [0.75, 0.67, 0.53], WALLC = [0.7, 0.57, 0.4], WALLT = [0.78, 0.66, 0.49];
  function roadside(g, ctx, gH, tile, gCol, st) {
    const T = API.T, { scen } = ctx, box = API.box, N = T.N;
    if (!T || !T.px || !T.bl || !T.br) return;
    const excl = (x, z) => (typeof ctx.excluded === 'function' && ctx.excluded(x, z)) || (ctx.pulls || []).some((p) => Math.hypot(x - p.x, z - p.z) < p.r + 1.5);
    // the nearest point of the road: d from its centre line, m beyond the barrier line of that side (under 0: where a car can come)
    const near = (x, z) => { let b = 1e18, bi = 0; for (let i = 0; i < N; i++) { const dx = x - T.px[i], dz = z - T.pz[i], d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } }
      const d = Math.sqrt(b), sd = (x - T.px[bi]) * T.nx[bi] + (z - T.pz[bi]) * T.nz[bi]; return { d, m: d - (sd > 0 ? T.br[bi] : T.bl[bi]), i: bi }; };
    const fall = (x, z) => { const gx = gH(x + 1.5, z) - gH(x - 1.5, z), gz = gH(x, z + 1.5) - gH(x, z - 1.5), l = Math.hypot(gx, gz); return l < 0.02 ? null : [-gx / l, -gz / l, l / 3]; };
    const lc = (x, z) => (typeof API.vrLC === 'function' ? API.vrLC(x, z) : 0), shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const VERGE = (T.hw || 3.4) + 3.4 + 0.7;   // (the verge strip's own mesh ends 6.8 m from the centre line: the ground's patches start past it)
    // a flat patch on the ground: a 3 x 3 grid, its middle the colour, its rim the ground's own
    const blot = (x, z, rx, rz, rot, col) => {
      const c = Math.cos(rot), s = Math.sin(rot), V = [];
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const px = x + a * rx * c - b * rz * s, pz = z + a * rx * s + b * rz * c; if (tile(px, pz) !== 1) return false;
        V.push({ p: [px, gH(px, pz) + 0.05, pz], c: a || b ? gCol(px, pz) : col, u: [px / 10, -pz / 10] }); }
      for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) { const q = [V[b * 3 + a], V[b * 3 + a + 1], V[b * 3 + a + 4], V[b * 3 + a + 3]]; g.quadUp(q[0].p, q[1].p, q[2].p, q[3].p, q.map((v) => v.c), q.map((v) => v.u)); }
      return true;
    };
    // a plate of bare rock flush with the ground: a four-cornered slab, its corners jittered
    const plate = (x, z, r, rot, col, k) => {
      const P4 = [];
      for (let q = 0; q < 4; q++) { const a = rot + q * Math.PI / 2 + (hash(k, 31 + q) - 0.5) * 0.5, rr = r * (0.75 + 0.5 * hash(k, 41 + q)), px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr; if (tile(px, pz) !== 1) return false;
        P4.push({ p: [px, gH(px, pz) + 0.06, pz], u: [px / 6, -pz / 6] }); }
      g.quadUp(P4[0].p, P4[1].p, P4[2].p, P4[3].p, [col, col, col, col], P4.map((v) => v.u)); return true;
    };

    /* the ledges: bands of layered rock along the contour where the DEM is steep (seeds per 6 m of the road and side, outwards from the
       barrier line; the steeper the likelier). A band is traced both ways along the contour, 2.5 m a step, and built as the canyon's
       rim is: a top flush with the ground uphill, a lip, a face stepped once (the strata), the foot in the ground below; blocks
       broken off it lie under it. No two bands within ~4 m (a 3 m grid of taken cells) */
    const taken = new Set(), cell = (x, z) => Math.floor(x / 3) + ':' + Math.floor(z / 3);
    const free = (x, z, own) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const c = cell(x + a * 3, z + b * 3); if (taken.has(c) && !(own && own.has(c))) return false; } return true; };
    for (let i = 2; i < N - 2; i += 3) for (const side of [-1, 1]) {
      const bar = side > 0 ? T.br[i] : T.bl[i];
      for (let q = 0, d = bar + 3 + 3 * hash(i, side + 5); d < bar + 38 && q < 7; q++, d += 4.5 + 3.5 * hash(i * 9 + q, side + 6)) {
        const k = i * 16 + q + (side > 0 ? 8000 : 0), x0 = T.px[i] + T.nx[i] * side * d, z0 = T.pz[i] + T.nz[i] * side * d;
        if (!tile(x0, z0)) continue;
        const sl0 = API.vrSlope(x0, z0);
        if (sl0 < 0.26 || hash(k, 2) > clamp((sl0 - 0.18) * 1.5, lc(x0, z0) === 4 ? 0.4 : 0.25, 0.9) || !free(x0, z0)) continue;
        const D = 1.5 + 2.3 * hash(k, 4), h0 = gH(x0, z0), own = new Set(), pts = [];
        const okAt = (x, z) => tile(x, z) && API.vrSlope(x, z) >= 0.2 && near(x, z).m >= 1 + D + 1.4 && !excl(x, z) && free(x, z, own);
        const f0 = fall(x0, z0); if (!f0 || !okAt(x0, z0)) continue;
        pts.push({ x: x0, z: z0, f: f0 }); own.add(cell(x0, z0));
        for (const dir of [1, -1]) {
          let x = x0, z = z0, f = f0;
          for (let n = 0, nm = 2 + Math.floor(hash(k, 9 + dir) * 7); n < nm; n++) {
            let nx = x - f[1] * dir * 2.5, nz = z + f[0] * dir * 2.5; const f1 = fall(nx, nz); if (!f1) break;
            const e = clamp((gH(nx, nz) - h0) / Math.max(0.2, f1[2]), -1.2, 1.2); nx += f1[0] * e; nz += f1[1] * e;   // (back onto the contour)
            if (!okAt(nx, nz)) break;
            x = nx; z = nz; f = fall(x, z) || f1; own.add(cell(x, z));
            if (dir > 0) pts.push({ x, z, f }); else pts.unshift({ x, z, f });
          }
        }
        if (pts.length < 3) continue;
        for (const c of own) taken.add(c);
        const cA = SAND[Math.floor(hash(k, 10) * SAND.length)], cB = SAND[Math.floor(hash(k, 11) * SAND.length)], rise = 0.12 + 0.4 * hash(k, 12), np = pts.length;
        let prev = null;
        for (let a = 0; a < np; a++) {
          const { x, z, f } = pts[a], end = sm(Math.min(a, np - 1 - a) / 1.6), e2 = Math.min(1, end * 1.5), Da = D * (0.2 + 0.8 * end) * (0.65 + 0.7 * patch(x, z, 6));   // (the ends run out into the ground)
          const g0 = (o) => gH(x + f[0] * o, z + f[1] * o), at = (o, y) => { const gy = g0(o) - 0.06; return [x + f[0] * o, gy + (y - gy) * e2, z + f[1] * o]; };
          const yc = gH(x, z) + rise * end, yl = yc - 0.08 - 0.12 * patch(x - 60, z, 5), yf = g0(Da + 1.5) - 0.45, h = Math.max(0.3, yl - yf);
          const row = { x, z, p: [at(-1.3, g0(-1.3) - 0.3), at(-0.3, yc), at(Da, yl), at(Da + 0.1, yl - h * 0.42), at(Da + 0.55, yl - h * 0.46), at(Da + 0.7, yl - h * 0.86), at(Da + 1.5, yf)], ins: [x - f[0], yf - 4, z - f[1]] };
          if (prev) {
            const mx = (x + prev.x) / 2, mz = (z + prev.z) / 2, gg = scen.get(mx, mz), gc = gCol(mx, mz);
            const slb = (0.86 + 0.2 * hash(k * 31 + a, 7)) * (hash(k * 31 + a, 13) < 0.2 ? 0.84 : 1), S1 = (c, m) => { const v = mix(c, gc, m); return [v[0] * slb, v[1] * slb, v[2] * slb]; };
            const cols = [mix(gc, cA, 0.35), S1(tone(mix(cA, ROCK_L, 0.4), mx, mz, 0.16), 0.38), S1(tone(shade(cA, 0.86), mx, mz, 0.18), 0.12), S1(tone(mix(cB, ROCK_L, 0.3), mx + 40, mz, 0.12), 0.2), S1(tone(shade(cB, 0.74), mx, mz + 40, 0.18), 0.1), mix(shade(cB, 0.8), gc, 0.5)];
            const ins = [(row.ins[0] + prev.ins[0]) / 2, Math.min(row.ins[1], prev.ins[1]), (row.ins[2] + prev.ins[2]) / 2];
            for (let j = 0; j < 6; j++) gg.quadO(prev.p[j], prev.p[j + 1], row.p[j + 1], row.p[j], cols[j], ins);
            st.ledgeM += Math.hypot(x - prev.x, z - prev.z);
          }
          prev = row;
          // (a block or two broken off, below the foot)
          for (let b = 0, nb = Math.floor(hash(k * 31 + a, 30) * 1.7); b < nb; b++) {
            const o = Da + 1.8 + 2.6 * hash(k * 31 + a, 32 + b), w = (hash(k * 31 + a, 36 + b) - 0.5) * 2.4, bx = x + f[0] * o - f[1] * w, bz = z + f[1] * o + f[0] * w, sz = 0.22 + 0.42 * hash(k * 31 + a, 40 + b);
            if (!tile(bx, bz) || near(bx, bz).m < 0.8 + sz || excl(bx, bz)) continue;
            const c = mix(cB, gCol(bx, bz), 0.3);
            box(scen.get(bx, bz), bx, gH(bx, bz) - 0.25, bz, sz * (1 + 0.8 * hash(k, 48 + b)), 0.25 + sz * 0.5, sz, hash(k * 31 + a, 52 + b) * 6.28, tone(shade(c, 0.8), bx, bz, 0.14), tone(mix(c, ROCK_L, 0.3), bx, bz, 0.1), true); st.blocks++;
          }
        }
        st.ledges++;
      }
    }
    st.ledgeM = Math.round(st.ledgeM);

    /* the ground: plates of bare rock (in groups, the joints between them the ground itself) and pale gravel, from the verge outwards */
    for (let i = 1; i < N - 1; i++) for (const side of [-1, 1]) for (let q = 0; q < 2; q++) {
      const k = i * 8 + q + (side > 0 ? 40000 : 30000), bar = side > 0 ? T.br[i] : T.bl[i], d = VERGE + 0.8 + Math.pow(hash(k, 1), 1.4) * (bar + 14 - VERGE), j = (hash(k, 2) - 0.5) * 2;
      const x = T.px[i] + T.nx[i] * side * d - T.nz[i] * j, z = T.pz[i] + T.nz[i] * side * d + T.nx[i] * j;
      if (hash(k, 3) > 0.5 || near(x, z).d < VERGE + 1.6 || excl(x, z) || API.vrSlope(x, z) > 0.7) continue;
      if (hash(k, 4) < 0.55) {
        const n = 2 + Math.floor(hash(k, 5) * 4), rot = hash(k, 6) * 3.14;
        for (let a = 0; a < n; a++) { const r = 0.55 + 0.6 * hash(k, 60 + a), ang = rot + a * 2.4, o = a ? 0.9 + 0.5 * a : 0, px = x + Math.cos(ang) * o, pz = z + Math.sin(ang) * o;
          if (near(px, pz).d < VERGE + r || excl(px, pz)) continue;
          if (plate(px, pz, r, rot + hash(k, 70 + a), mix(tone(mix(PLATE, SAND[Math.floor(hash(k, 80 + a) * SAND.length)], 0.3), px, pz, 0.14), gCol(px, pz), 0.4), k * 7 + a)) st.plates++; }
      } else if (blot(x, z, 0.9 + 1.5 * hash(k, 7), 0.7 + 1.1 * hash(k, 8), hash(k, 9) * 3.14, tone(GRAVEL, x, z, 0.12))) st.gravel++;
    }

    /* the plants: cushion shrubs and straw tussocks beyond the barrier line, denser where the land cover is not bare */
    const R = API.rng(35054);
    for (let i = 1; i < N - 1; i++) for (const side of [-1, 1]) for (let q = 0; q < 3; q++) {
      const k = i * 8 + q + (side > 0 ? 60000 : 50000), bar = side > 0 ? T.br[i] : T.bl[i], d = bar + 0.9 + Math.pow(hash(k, 1), 1.3) * 33, j = (hash(k, 2) - 0.5) * 2;
      const x = T.px[i] + T.nx[i] * side * d - T.nz[i] * j, z = T.pz[i] + T.nz[i] * side * d + T.nx[i] * j;
      if (!tile(x, z)) continue;
      const c = lc(x, z), pr = (c === 4 ? 0.3 : c === 3 ? 0.34 : 0.66) * (0.4 + 1.2 * patch(x + 500, z, 22));
      if (hash(k, 3) > pr || API.vrSlope(x, z) > 1.1) continue;
      const r = 0.36 + 0.62 * hash(k, 4);
      if (near(x, z).m < 0.8 + r || excl(x, z)) continue;
      const y = gH(x, z), gg = scen.get(x, z);
      if (hash(k, 5) < 0.45) { API.ico(gg, x, y + r * 0.22, z, r, 0.6, tone(SHRUB[Math.floor(hash(k, 6) * SHRUB.length)], x, z, 0.2), R, 0.3); st.shrubs++; }
      else { const cs = STRAW[Math.floor(hash(k, 6) * STRAW.length)]; API.cone(gg, x, y - 0.05, z, r * 0.7, 0.4 + r * 0.75, 5, shade(cs, 0.72), cs, hash(k, 7) * 6.28); st.tufts++; }
    }

    /* the dry-stone walls: broken runs along the contour on the canyon's side (the left) beside the stretch of the village */
    for (let s = T.startS + 96; s < T.startS + 404; s += 9) {
      const i = T.idx(s), k = 70000 + i; if (hash(k, 1) > 0.62) continue;
      const d = T.bl[i] + 2.2 + 6 * hash(k, 2), x0 = T.px[i] - T.nx[i] * d, z0 = T.pz[i] - T.nz[i] * d, f = fall(x0, z0);
      let dx = f ? -f[1] : -T.nz[i], dz = f ? f[0] : T.nx[i], x = x0, z = z0; const n = 2 + Math.floor(hash(k, 3) * 3);
      for (let a = 0; a < n; a++) {
        const L = 2.2 + 1.6 * hash(k, 10 + a), bx = x + dx * L, bz = z + dz * L, mx = (x + bx) / 2, mz = (z + bz) / 2;
        const gap = hash(k, 20 + a) < 0.22, h = (a === 0 || a === n - 1 ? 0.3 : 0.5) + 0.45 * hash(k, 30 + a);
        if (!gap && tile(mx, mz) && near(mx, mz).m > 0.8 + L * 0.55 && !excl(mx, mz)) {
          const lo = Math.min(gH(x, z), gH(bx, bz), gH(mx, mz)) - 0.5, hi = Math.max(gH(x, z), gH(bx, bz)) + h;
          box(scen.get(mx, mz), mx, lo, mz, L + 0.08, hi - lo, 0.6, Math.atan2(dz, dx), tone(WALLC, mx, mz, 0.2), tone(WALLT, mx, mz, 0.14), true); st.wallRuinM += L;
        }
        x = bx; z = bz; const f2 = fall(x, z); if (f2) { const t = hash(k, 40 + a) - 0.5; dx = -f2[1] + f2[0] * t * 0.3; dz = f2[0] + f2[1] * t * 0.3; const l = Math.hypot(dx, dz); dx /= l; dz /= l; }
      }
    }
    st.wallRuinM = Math.round(st.wallRuinM);

    /* the footpath to the viewpoint (OSM node 3135560243): trodden pale earth from the verge to the terrace */
    { const VX = 52.7, VZ = 242.2, nr = near(VX, VZ), i = nr.i, ux = (VX - T.px[i]) / nr.d, uz = (VZ - T.pz[i]) / nr.d;
      for (let o = VERGE + 1; o < nr.d - 2.5; o += 1.5) { const w = Math.sin(o * 0.7) * 0.35, x = T.px[i] + ux * o - uz * w, z = T.pz[i] + uz * o + ux * w;
        if (blot(x, z, 1.25, 1.05, Math.atan2(uz, ux), tone(PATH, x, z, 0.08))) st.pathM += 1.5; }
      st.pathM = Math.round(st.pathM); }
  }

  // the canyon's rock rim: per 3 m of the line a row across it (a hem flush with the ground above, the crest, its lip, the upper face,
  // a step, the lower face, the foot in the ground below), the rows joined with flat faces: layered rock, lighter on its tops
  function cliff(scen, gH, tile, gCol, st) {
    const Q = CLIFF_Q, n = Q.length / 2;
    let prev = null;
    for (let k = 0; k < n; k++) {
      const x = Q[2 * k], z = Q[2 * k + 1], f = CLIFF_N[k], on = tile(x, z);
      if (!on) { prev = null; continue; }
      const end = sm(Math.min(k, n - 1 - k) / 4), D = 3.5 + 3 * patch(x, z, 11), rise = (0.5 + 1.2 * patch(x + 90, z + 40, 8)) * end, sink = on === 1 ? 0.2 : 0.8;
      const at = (o, y) => [x + f[0] * o, y, z + f[1] * o], g0 = (o) => gH(x + f[0] * o, z + f[1] * o);
      const yc = gH(x, z) + rise, yl = yc - 0.15 - 0.25 * patch(x - 60, z, 5), yf = g0(D + 2.4) - 1 - sink, h = Math.max(0.4, yl - yf);
      const row = { x, z,
        p: [at(-2.8, g0(-2.8) - sink), at(-0.5, yc), at(D, yl), at(D + 0.15, yl - h * 0.4), at(D + 1, yl - h * 0.44), at(D + 1.2, yl - h * 0.82), at(D + 2.4, yf)],
        ins: [x - f[0] * 1.5, yf - 4, z - f[1] * 1.5] };
      if (prev) {
        const mx = (x + prev.x) / 2, mz = (z + prev.z) / 2, g = scen.get(mx, mz), gc = gCol(mx, mz);
        // (slabs: each 3 m of the ledge its own shade, every few a darker joint)
        const sl = (0.84 + 0.22 * hash(k, 7)) * (hash(k, 13) < 0.22 ? 0.82 : 1), slab = (c) => [c[0] * sl, c[1] * sl, c[2] * sl];
        const cols = [mix(gc, slab(ROCK), 0.5), slab(tone(ROCK_L, mx, mz, 0.14)), slab(tone(ROCK, mx, mz, 0.2)), slab(tone(ROCK_L, mx + 40, mz, 0.12)), slab(tone(ROCK_D, mx, mz + 40, 0.2)), mix(tone(ROCK_D, mx, mz, 0.1), gc, 0.4)];
        const ins = [(row.ins[0] + prev.ins[0]) / 2, Math.min(row.ins[1], prev.ins[1]), (row.ins[2] + prev.ins[2]) / 2];
        for (let j = 0; j < 6; j++) g.quadO(prev.p[j], prev.p[j + 1], row.p[j + 1], row.p[j], cols[j], ins);
        st.cliffM += Math.hypot(x - prev.x, z - prev.z);
      }
      prev = row;
    }
    st.cliffM = Math.round(st.cliffM);
  }
  function sm(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  // the dry bed of the wadi: a ribbon of pale gravel on the ground, its outer 1.4 m going over into the ground's own colour; only over the
  // full terrain tiles (the coarse ring's cells would cover it)
  function stream(g, gH, tile, gCol, st) {
    const Q = STREAM_Q, n = Q.length / 2, OF = [-BED_HW - 1.4, -BED_HW, -0.7, 0.7, BED_HW, BED_HW + 1.4];
    let prev = null;
    for (let k = 0; k < n; k++) {
      const x = Q[2 * k], z = Q[2 * k + 1], f = STREAM_N[k], w = 0.75 + 0.5 * patch(x, z, 14);
      const row = OF.map((o, j) => { const px = x + f[0] * o * w, pz = z + f[1] * o * w, edge = j === 0 || j === OF.length - 1;
        return { p: [px, gH(px, pz) + 0.1, pz], c: edge ? gCol(px, pz) : tone(BED, px, pz, 0.16), u: [px / 10, -pz / 10], ok: tile(px, pz) === 1 }; });
      row.x = x; row.z = z; row.ok = row.every((v) => v.ok);
      if (prev && prev.ok && row.ok) {
        for (let j = 0; j + 1 < OF.length; j++) g.quadUp(prev[j].p, prev[j + 1].p, row[j + 1].p, row[j].p, [prev[j].c, prev[j + 1].c, row[j + 1].c, row[j].c], [prev[j].u, prev[j + 1].u, row[j + 1].u, row[j].u]);
        st.streamM += Math.hypot(x - prev.x, z - prev.z);
      }
      prev = row;
    }
    st.streamM = Math.round(st.streamM);
  }

  // the car park: bare gravel on the ground inside OSM's outline (rows across every 2 m), and the retaining wall on its lower edge
  function park(g, scen, gH, tile, gCol, st) {
    const NB = 8, rowAt = (z) => {
      const a = parkAt(z); if (!a) return null;
      const xs = [a[0] - 1.2]; for (let j = 0; j <= NB; j++) xs.push(a[0] + (a[1] - a[0]) * j / NB); xs.push(a[1] + 1.2);
      const r = xs.map((x, j) => ({ p: [x, gH(x, z) + 0.12, z], c: j === 0 || j === NB + 2 ? gCol(x, z) : tone(PAD, x, z, 0.14), u: [x / 10, -z / 10], ok: tile(x, z) === 1 }));
      r.w = a[1] - a[0]; r.ok = r.every((v) => v.ok); return r;
    };
    let prev = null;
    for (let z = 499.4; z <= 530.4; z += 2) {
      const row = rowAt(z);
      if (prev && row && prev.ok && row.ok) {
        for (let j = 0; j + 1 < row.length; j++) g.quadUp(prev[j].p, prev[j + 1].p, row[j + 1].p, row[j].p, [prev[j].c, prev[j + 1].c, row[j + 1].c, row[j].c], [prev[j].u, prev[j + 1].u, row[j + 1].u, row[j].u]);
        st.parkM2 += (prev.w + row.w);
      }
      prev = row;
    }
    st.parkM2 = Math.round(st.parkM2);
    const Q = WALL_Q, box = API.box;
    for (let k = 0; k + 3 < Q.length; k += 2) {
      const ax = Q[k], az = Q[k + 1], bx = Q[k + 2], bz = Q[k + 3], L = Math.hypot(bx - ax, bz - az), x = (ax + bx) / 2, z = (az + bz) / 2, nx = -(bz - az) / L, nz = (bx - ax) / L;
      if (!tile(x, z)) continue;
      const ys = [gH(ax, az), gH(bx, bz), gH(x + nx * 1.2, z + nz * 1.2), gH(x - nx * 1.2, z - nz * 1.2)], lo = Math.min.apply(null, ys) - 0.8, hi = Math.max.apply(null, ys) + 0.45;
      box(scen.get(x, z), x, lo, z, L + 0.1, hi - lo, 0.5, Math.atan2(bz - az, bx - ax), tone(ROCK, x, z, 0.16), tone(ROCK_L, x, z, 0.1), true);
      st.wallM += L;
    }
    st.wallM = Math.round(st.wallM);
  }

  // the power line: a tapered steel mast with two cross-arms at each node of the way that stands on the game's terrain, three wires
  // (thin ribbons, sagging 2 % of the span, never under 6 m over the ground) between two masts that both stand
  function powerLine(scen, gH, tile, st) {
    const n = LINE.length / 2, box = API.box, cyl = API.cyl, M = [];
    for (let k = 0; k < n; k++) {
      const x = LINE[2 * k], z = LINE[2 * k + 1];
      if (!tile(x, z)) { M.push(null); continue; }
      const a = Math.max(0, k - 1), b = Math.min(n - 1, k + 1), dx = LINE[2 * b] - LINE[2 * a], dz = LINE[2 * b + 1] - LINE[2 * a + 1], l = Math.hypot(dx, dz) || 1;
      const px = -dz / l, pz = dx / l, y = gH(x, z), g = scen.get(x, z), rot = Math.atan2(pz, px);
      cyl(g, x, y - 0.6, z, 1.1, MAST_H + 0.6, 4, STEEL_D, STEEL, 0.22);
      box(g, x, y + MAST_H - 4.2, z, 6.4, 0.22, 0.22, rot, STEEL, STEEL);
      box(g, x, y + MAST_H - 1.2, z, 4.2, 0.2, 0.2, rot, STEEL, STEEL);
      // where the three wires hang: the lower arm's two tips and one tip of the upper arm
      M.push([[x - px * 3.1, y + MAST_H - 4.3, z - pz * 3.1], [x + px * 3.1, y + MAST_H - 4.3, z + pz * 3.1], [x + px * 2, y + MAST_H - 1.3, z + pz * 2]]);
      st.masts++;
    }
    for (let k = 0; k + 1 < n; k++) {
      const A = M[k], B = M[k + 1]; if (!A || !B) continue;
      for (let w = 0; w < 3; w++) {
        const a = A[w], b = B[w], L = Math.hypot(b[0] - a[0], b[2] - a[2]), m = Math.max(4, Math.ceil(L / 12)), sag = L * 0.02;
        let p0 = a;
        for (let q = 1; q <= m; q++) {
          const t = q / m, x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t, p1 = q === m ? b : [x, Math.max(a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), gH(x, z) + 6), z];
          const g = scen.get((p0[0] + p1[0]) / 2, (p0[2] + p1[2]) / 2), u0 = [p0[0], p0[1] + 0.12, p0[2]], u1 = [p1[0], p1[1] + 0.12, p1[2]];
          g.tri(p0, p1, u1, WIRE); g.tri(p0, u1, u0, WIRE); g.tri(p0, u1, p1, WIRE); g.tri(p0, u0, u1, WIRE);
          p0 = p1;
        }
      }
      st.spans++;
    }
  }

  // ---- the hook: World.ext.ghoufi runs as before, with gore.build handed this file's keepOut and extra after its own ----
  const ext = World.ext, baseExt = ext.ghoufi;
  ext.ghoufi = function (scene, tex, opts) {
    const gore = World.gore, build = gore.build;
    gore.build = function (sc, tx, op, S) {
      gore.build = build;
      const S2 = Object.assign({}, S, {
        keepOut: (push) => { if (typeof S.keepOut === 'function') S.keepOut(push); keepOut(push); },
        extra: (ctx) => { const r = typeof S.extra === 'function' ? S.extra(ctx) : undefined; extra(ctx); return r; },
      });
      return build.call(this, sc, tx, op, S2);
    };
    try { return baseExt.apply(this, arguments); } finally { gore.build = build; }
  };
})();
