/* WORLD — Kotor: its own world over the bay (docs/proge/kotor.md, »Zaliv in mesto spodaj«). The road's corridor stays the shared world of the passes
   (js/world-prelaz.js, PL_LOOK.kotor, untouched for the other passes): this file wraps its builder for Kotor alone and adds to the view
   beyond the corridor (def.farDem's mesh, irFar: one mesh, World.update moves it with the camera) what lies below the hairpins: the Bay of
   Kotor at 62.5 m (four times the far grid's 250 m), its sea flat at 0 m where the OpenStreetMap coastline puts it, and the towns on its
   shore (Kotor's old town inside its walls, Dobrota, Prčanj, Muo and Škaljari) from OpenStreetMap's footprints, each house a block
   of its own size and orientation with its terracotta roof (a flat grey one where OpenStreetMap says flat or the building is a block of
   flats, a hotel, a shop or a school), and the old town's walls up the hill. Heights: Copernicus DEM GLO-30 (a surface model: the houses
   stand on the lowest ground round them); the coastline, the footprints, the walls: OpenStreetMap (ODbL 1.0, read through its API
   28. 11. 2026); built by tools/proga/kotor-zaliv.py. No names, no lettering. Graphics only, into the far mesh (vertex colours: no
   texture, no new draw calls); the driving, the physics and def.hills untouched. */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.kotor || !World.api.buildPrelaz) return;
  const API = World.api, LK = API.PL_LOOK.kotor;

  // the bay's grid (tools/proga/kotor-zaliv.py): heights above the sea, 0.5 m steps from -50 m, big-endian uint16 in base64; wet: runs of
  // dry and wet nodes in row order (the sea: the coastline's side near the shore, the model's flat 0 m away from it)
  const BAY = /*BAY*/null;
  // the houses: 11 bytes each: x, z (0.5 m from the grid's corner), the ground (0.5 m from -50 m), uint16; the half length, half width
  // (0.25 m), the long side's angle (1/256 of a half turn), the height to the eaves (0.25 m), the roof (0-3 tiles, 4-5 flat)
  const HOUSES = /*HOUSES*/'';
  const WALLS = /*WALLS*/[];   // the town walls (OpenStreetMap barrier=city_wall), every ~12 m, the game's x, z

  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const hash = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const ROOF = [[0.66, 0.36, 0.24], [0.6, 0.31, 0.2], [0.7, 0.42, 0.29], [0.55, 0.35, 0.26], [0.6, 0.6, 0.58], [0.68, 0.67, 0.64]];
  const WALL = [[0.86, 0.83, 0.76], [0.8, 0.76, 0.68], [0.9, 0.88, 0.84], [0.76, 0.71, 0.62], [0.84, 0.78, 0.66]];   // (the Boka's limestone, the plaster)
  const SEA = [0.07, 0.25, 0.33];

  function bay(FAR, T, base, lo) {   // (lo: NIZKA, the phones' tier: the bay's grid every 125 m, no houses nor walls; its budget of CLAUDE.md)
    const D = T.def.farDem, g = FAR.mesh.geometry, B = BAY, nx = B.nx, nz = B.nz, n = nx * nz, X1 = B.x0 + (nx - 1) * B.cell, Z1 = B.z0 + (nz - 1) * B.cell;
    const cn = D.nx * D.nz, oldC = g.attributes.color.array, oldI = g.index.array, P = Array.from(FAR.P0), Cl = Array.from(oldC), R = Array.from(FAR.rim), I = [];
    const cwet = new Uint8Array(cn); for (let k = 0, p = 0, v = 0; k < (D.lake || []).length; k++) { if (v) cwet.fill(1, p, p + D.lake[k]); p += D.lake[k]; v ^= 1; }
    const inR = (k) => { const x = FAR.P0[3 * k], z = FAR.P0[3 * k + 2]; return x >= B.x0 - 1 && x <= X1 + 1 && z >= B.z0 - 1 && z <= Z1 + 1; };
    for (let t = 0; t < oldI.length; t += 3) { const a = oldI[t], b = oldI[t + 1], c = oldI[t + 2];   // (the far grid's own triangles over the bay: out)
      if (a < cn && b < cn && c < cn && inR(a) && inR(b) && inR(c)) continue; I.push(a, b, c); }
    // the chase camera is only ever on the road: a face turned away from every point of it is never seen, so it is left out
    const EYE = []; for (let q = 0, st = Math.max(1, Math.ceil(T.N / 140)); q < T.N; q += st) EYE.push(T.px[q], (T.hy ? T.hy[q] : 0) + 4, T.pz[q]);
    const seen = (nx_, ny_, nz_, x, y, z) => { for (let e = 0; e < EYE.length; e += 3) if (nx_ * (EYE[e] - x) + ny_ * (EYE[e + 1] - y) + nz_ * (EYE[e + 2] - z) > 0) return true; return false; };
    const tri = (a, b, c) => { const ax = P[3 * a], ay = P[3 * a + 1], az = P[3 * a + 2], ux = P[3 * b] - ax, uy = P[3 * b + 1] - ay, uz = P[3 * b + 2] - az, wx = P[3 * c] - ax, wy = P[3 * c + 1] - ay, wz = P[3 * c + 2] - az;
      if (seen(uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx, ax + (ux + wx) / 3, ay + (uy + wy) / 3, az + (uz + wz) / 3)) I.push(a, b, c); };
    const dr = (x, z) => { let m = 1e18; for (let q = 0; q < T.N; q += 5) { const dx = x - T.px[q], dz = z - T.pz[q], d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
    // the far grid's nodes round each of the bay's: its height (on the edge: the grid's own, no seam) and its colour (from its dry nodes only)
    const cy = (i, j) => FAR.P0[3 * (j * D.nx + i) + 1];
    const raw = atob(B.b64), H = new Float32Array(n), wet = new Uint8Array(n);
    for (let k = 0; k < n; k++) H[k] = -50 + (raw.charCodeAt(2 * k) * 256 + raw.charCodeAt(2 * k + 1)) / 2;
    for (let k = 0, p = 0, v = 0; k < B.wet.length; k++) { if (v) wet.fill(1, p, p + B.wet[k]); p += B.wet[k]; v ^= 1; }
    const cs = B.cell / D.cell, near = new Uint8Array((D.nx - 1) * (D.nz - 1)), cdr = new Float32Array(cn).fill(-1);
    const cdrAt = (i, j) => { const k = j * D.nx + i; if (cdr[k] < 0) cdr[k] = dr(D.x0 + i * D.cell, D.z0 + j * D.cell); return cdr[k]; };
    const v0 = P.length / 3, fy = new Float32Array(n);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, x = B.x0 + i * B.cell, z = B.z0 + j * B.cell, u = (x - D.x0) / D.cell, w = (z - D.z0) / D.cell;
      const ci = Math.min(D.nx - 2, Math.floor(u)), cj = Math.min(D.nz - 2, Math.floor(w)), fu = u - ci, fw = w - cj;
      let y = H[k] - base;
      if (i === 0 || j === 0 || i === nx - 1 || j === nz - 1) y = (cy(ci, cj) * (1 - fu) + cy(ci + 1, cj) * fu) * (1 - fw) + (cy(ci, cj + 1) * (1 - fu) + cy(ci + 1, cj + 1) * fu) * fw;
      fy[k] = y;
      let c0 = 0, c1 = 0, c2 = 0, sw = 0;
      for (const [di, dj, ww] of [[0, 0, (1 - fu) * (1 - fw)], [1, 0, fu * (1 - fw)], [0, 1, (1 - fu) * fw], [1, 1, fu * fw]]) { const q = (cj + dj) * D.nx + ci + di;
        if (cwet[q] || ww <= 0) continue; c0 += oldC[3 * q] * ww; c1 += oldC[3 * q + 1] * ww; c2 += oldC[3 * q + 2] * ww; sw += ww; }
      let c = sw > 0 ? [c0 / sw, c1 / sw, c2 / sw] : LK.far.lo.slice();
      const sl = Math.hypot(H[j * nx + Math.min(nx - 1, i + 1)] - H[j * nx + Math.max(0, i - 1)], H[Math.min(nz - 1, j + 1) * nx + i] - H[Math.max(0, j - 1) * nx + i]) / (2 * B.cell);
      const rk = sstep(0.55, 1.1, sl) * 0.55, q = hash(i, j) - 0.5;   // (the cliffs over the bay: the bare limestone; a little noise between the far grid's nodes)
      c = [c[0] + (LK.far.hi[0] - c[0]) * rk + q * 0.03, c[1] + (LK.far.hi[1] - c[1]) * rk + q * 0.03, c[2] + (LK.far.hi[2] - c[2]) * rk + q * 0.02];
      if (wet[k]) c = [0.3, 0.32, 0.3];   // (under the sea: hidden by it)
      P.push(x, y, z); Cl.push(c[0], c[1], c[2]); R.push(sstep(1400, 800, dr(x, z)));
    }
    const st = lo ? 2 : 1;
    for (let j = 0; j + st < nz; j += st) for (let i = 0; i + st < nx; i += st) {
      const ci = Math.floor((i + 0.5 * st) / cs + (B.x0 - D.x0) / D.cell), cj = Math.floor((j + 0.5 * st) / cs + (B.z0 - D.z0) / D.cell);
      if (Math.min(cdrAt(ci, cj), cdrAt(ci + 1, cj), cdrAt(ci, cj + 1), cdrAt(ci + 1, cj + 1)) < 470) continue;   // (the corridor's hole: as the far grid's own)
      const a = v0 + j * nx + i, b = a + st, c = a + st * nx, d = c + st, k = j * nx + i;
      if (wet[k] && wet[k + st] && wet[k + st * nx] && wet[k + st * nx + st]) continue;   // (all under the sea)
      tri(a, c, b); tri(b, c, d);
    }
    // the sea: flat at 0 m over every cell with a wet corner; the land under it sinks away from the shore, so the shoreline is where they cross
    const sv = new Int32Array(n).fill(-1), sea = -base;
    const sIdx = (i, j) => { const k = j * nx + i; if (sv[k] < 0) { const x = B.x0 + i * B.cell, z = B.z0 + j * B.cell, q = hash(j, i) - 0.5;
      sv[k] = P.length / 3; P.push(x, sea, z); Cl.push(SEA[0] + q * 0.015, SEA[1] + q * 0.02, SEA[2] + q * 0.02); R.push(sstep(1400, 800, dr(x, z))); } return sv[k]; };
    // (in strips along each row: a run of such cells is one quad)
    for (let j = 0; j + st < nz; j += st) for (let i = 0; i + st < nx;) { const wc = (i) => { const k = j * nx + i; return wet[k] || wet[k + st] || wet[k + st * nx] || wet[k + st * nx + st]; };
      if (!wc(i)) { i += st; continue; } let e = i + st; while (e + st < nx && wc(e)) e += st;
      const a = sIdx(i, j), b = sIdx(e, j), c = sIdx(i, j + st), d = sIdx(e, j + st); I.push(a, c, b, b, c, d); i = e; }
    const hAt = (x, z) => { const u = Math.min(nx - 1.001, Math.max(0, (x - B.x0) / B.cell)), w = Math.min(nz - 1.001, Math.max(0, (z - B.z0) / B.cell)), i = Math.floor(u), j = Math.floor(w), fu = u - i, fw = w - j, k = j * nx + i;
      return (fy[k] * (1 - fu) + fy[k + 1] * fu) * (1 - fw) + (fy[k + nx] * (1 - fu) + fy[k + nx + 1] * fu) * fw; };
    // a face out of the vertices given, turned to face 'out' (three.js: counter-clockwise from the front)
    const face = (ids, ox, oy, oz) => { const [a, b, c] = ids, ax = P[3 * a], ay = P[3 * a + 1], az = P[3 * a + 2], ux = P[3 * b] - ax, uy = P[3 * b + 1] - ay, uz = P[3 * b + 2] - az, wx = P[3 * c] - ax, wy = P[3 * c + 1] - ay, wz = P[3 * c + 2] - az;
      const s = (uy * wz - uz * wy) * ox + (uz * wx - ux * wz) * oy + (ux * wy - uy * wx) * oz; if (s >= 0) tri(a, b, c); else tri(a, c, b); if (ids.length === 4) face([a, c, ids[3]], ox, oy, oz); };
    const vtx = (x, y, z, c) => { P.push(x, y, z); Cl.push(c[0], c[1], c[2]); R.push(0); return P.length / 3 - 1; };
    // the houses
    const hb = lo ? '' : atob(HOUSES), u16 = (o) => hb.charCodeAt(o) * 256 + hb.charCodeAt(o + 1);
    for (let o = 0, h = 0; o + 11 <= hb.length; o += 11, h++) {
      const x = B.x0 + u16(o) / 2, z = B.z0 + u16(o + 2) / 2, y0 = -50 + u16(o + 4) / 2 - base, hl = hb.charCodeAt(o + 6) / 4, hw = hb.charCodeAt(o + 7) / 4, an = hb.charCodeAt(o + 8) / 256 * Math.PI, ht = hb.charCodeAt(o + 9) / 4, rf = hb.charCodeAt(o + 10);
      const ux = Math.cos(an), uz = Math.sin(an), vx = -uz, vz = ux, q = hash(h, 17), wc = WALL[Math.floor(q * WALL.length)], rc = ROOF[rf], yb = Math.min(y0, hAt(x, z)) - 1.5, yt = y0 + ht;
      const cr = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => [x + ux * hl * a + vx * hw * b, z + uz * hl * a + vz * hw * b]);
      const lo = cr.map(([cx, cz]) => vtx(cx, yb, cz, wc)), up = cr.map(([cx, cz]) => vtx(cx, yt, cz, wc));
      for (let s = 0; s < 4; s++) { const t = (s + 1) % 4, mx = (cr[s][0] + cr[t][0]) / 2 - x, mz = (cr[s][1] + cr[t][1]) / 2 - z; face([lo[s], lo[t], up[t], up[s]], mx, 0, mz); }
      const ev = cr.map(([cx, cz]) => vtx(cx, yt + (rf >= 4 ? 0.2 : 0), cz, rc));
      if (rf >= 4) { face([ev[0], ev[1], ev[2], ev[3]], 0, 1, 0); continue; }   // (a flat roof)
      const rise = hw * 0.55, rl = Math.max(0, hl - hw), r0 = vtx(x + ux * rl, yt + rise, z + uz * rl, rc), r1 = vtx(x - ux * rl, yt + rise, z - uz * rl, rc);
      face([ev[0], ev[1], r0], ux, 1, uz); face([ev[2], ev[3], r1], -ux, 1, -uz);   // (the hips at the ends)
      face([ev[3], ev[0], r0, r1], vx, 1, vz); face([ev[1], ev[2], r1, r0], -vx, 1, -vz);   // (the two long slopes)
    }
    // the town walls: 2 m thick, 6 m over the ground, up the hill
    for (const w of lo ? [] : WALLS) { let prev = null;
      for (let k = 0; k < w.length; k++) { const [x, z] = w[k], [ax, az] = w[Math.max(0, k - 1)], [bx, bz] = w[Math.min(w.length - 1, k + 1)], l = Math.hypot(bx - ax, bz - az) || 1, px = -(bz - az) / l, pz = (bx - ax) / l, y = hAt(x, z), c = WALL[(k >> 2) % 2 ? 1 : 3];
        const cur = [vtx(x + px, y - 2, z + pz, c), vtx(x + px, y + 6, z + pz, c), vtx(x - px, y + 6, z - pz, c), vtx(x - px, y - 2, z - pz, c)];
        if (prev) { face([prev[0], cur[0], cur[1], prev[1]], px, 0, pz); face([prev[1], cur[1], cur[2], prev[2]], 0, 1, 0); face([prev[2], cur[2], cur[3], prev[3]], -px, 0, -pz); }
        prev = cur; } }
    // only the vertices a face uses (the far grid's own all kept: its nodes by their places): each is moved every frame (irFarUpdate)
    const nv0 = P.length / 3, map = new Int32Array(nv0).fill(-1); for (let k = 0; k < v0; k++) map[k] = k;
    let nv = v0; for (const k of I) if (map[k] < 0) map[k] = nv++;
    for (let t = 0; t < I.length; t++) I[t] = map[I[t]];
    const P2 = new Float32Array(nv * 3), C2 = new Float32Array(nv * 3), R2 = new Float32Array(nv);
    for (let k = 0; k < nv0; k++) { const m = map[k]; if (m < 0) continue; for (let e = 0; e < 3; e++) { P2[3 * m + e] = P[3 * k + e]; C2[3 * m + e] = Cl[3 * k + e]; } R2[m] = R[k]; }
    const G = new THREE.BufferGeometry();
    G.setAttribute('position', new THREE.BufferAttribute(P2, 3)); G.setAttribute('color', new THREE.BufferAttribute(C2, 3));
    G.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1)); G.setIndex(nv > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1)); G.computeVertexNormals();
    g.dispose(); FAR.mesh.geometry = G; FAR.P0 = Float32Array.from(P2); FAR.rim = R2; FAR.cx = 1e9;
    return { verts: nv - cn, houses: hb.length / 11 };
  }

  World.ext.kotor = (scene, tex, opts) => {
    const out = API.buildPrelaz(scene, tex, opts, LK), FAR = out && out.dyn && out.dyn.irFar;
    if (FAR && BAY && API.T && API.T.def.farDem) { const s = bay(FAR, API.T, API.VR.D.base, opts && opts.tier === 0); if (out.stats) Object.assign(out.stats, { bayVerts: s.verts, bayHouses: s.houses }); }
    return out;
  };
})();
