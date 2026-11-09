/* =========================================================================
   WORLD — Ngorongoro (theme 'ngorongoro'): its own builder (World.ext.ngorongoro). What it uses of World comes from World.api, as Santo
   Antão's: the helpers bound here once, the state that changes as API.<name>, the track being built (LOD, T) copied in at each build; Vršič's
   corridor (vrPrep) and Los Caracoles' terrain helpers (caH, caGround) read its def.dem and def.lc. The view beyond the corridor is its own
   (ngFar: the crater's walls and floor, Lake Magadi with its white soda shore and the flamingos' pink band, the herds on the floor), moved
   with the camera as Irohazaka's irFar, in a lighter haze (ngFarUpdate: the dry season's clear air over the floor). The animals by the road
   (ngLife: one instanced mesh a species, posed in the vertex shader as Pikes Peak's) graze, look up, walk, run off from a car coming close
   and cross the road only while no car is near it: they are never on the road when a car passes (out.dyn.ext gets the race's cars,
   World.update).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caGH, caGround, caSlope, caTileOn, clamp, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl,
    ico, lerp, ouCutMat, pkGroundMat, propFloorTable, rng, roadsideProps, rock, rpHash, sstep, valueNoise2, vary, vrDist, vrFar, vrGritTex, vrLC,
    vrLCf, vrNear, vrPrep
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });
  const PI = Math.PI, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  /* ================= NGORONGORO (theme 'ngorongoro') =================
     The one-way cobbled road down the western wall of the Ngorongoro crater (Tanzania), from the rim at Windy Gap past the ranger post and
     its barrier, round the one hairpin and down the open grassy wall to the crater's floor, on a clear afternoon of the dry season. A look of
     its own: the ground's colours (ngCol: the walls' tawny grass, straw where it is dry and fresher in the hollows, the red-brown volcanic
     soil, the darker shrubs, the rim's forest, the streams' green strips, the steep faces' grey-brown rock, the floor's paler short grass),
     the road of rough grey-brown setts with the red dust in the joints (ngSettTex), the murram of the rim road before the start, the plants
     (ngTreeGeo: the rim's round dark trees, umbrella acacias, candelabra euphorbias, shrubs, tufts of grass), the ranger post (def.gates,
     def.bld), the lay-by at Windy Gap with the safari vehicles (generic, no names on them), the round huts of the bomas on the slopes
     outside (def.huts, generic), the crater beyond the corridor and the animals. Only geographic names and plain Swahili words on the boards. */
  const SCOL = [0, 0, 0];
  let PA = null, ST = null, DU = [];   // the footpaths and steps, the streams (hashed polylines: segHash), the dusty plots (discs: [x, z, r])
  function segHash(list, C, pad) {   // polylines [[x, z, ...], ...] -> their points and a hash of their segments by C m cells (pad m round each)
    const xs = [], zs = [], H = new Map();
    for (const p of list || []) { const n = p.length / 2; if (n < 2) continue; const k0 = xs.length;
      for (let k = 0; k < n; k++) { xs.push(p[2 * k]); zs.push(p[2 * k + 1]); }
      for (let k = k0; k < k0 + n - 1; k++) { const a0 = Math.floor((Math.min(xs[k], xs[k + 1]) - pad) / C), a1 = Math.floor((Math.max(xs[k], xs[k + 1]) + pad) / C), b0 = Math.floor((Math.min(zs[k], zs[k + 1]) - pad) / C), b1 = Math.floor((Math.max(zs[k], zs[k + 1]) + pad) / C);
        for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) { const kk = a * 65536 + b; let L = H.get(kk); if (!L) H.set(kk, L = []); L.push(k); } }
      xs.push(NaN); zs.push(NaN); }   // (a gap between two lines: the segment across it is never hashed)
    return xs.length ? { x: Float32Array.from(xs), z: Float32Array.from(zs), H, C } : null;
  }
  function segD(S, x, z) {   // the distance to the nearest of the lines within about their pad (or 1e9)
    if (!S) return 1e9;
    const L = S.H.get(Math.floor(x / S.C) * 65536 + Math.floor(z / S.C)); if (!L) return 1e9;
    let best = 1e9;
    for (let q = 0; q < L.length; q++) { const k = L[q], ax = S.x[k], az = S.z[k], ux = S.x[k + 1] - ax, uz = S.z[k + 1] - az, ll = ux * ux + uz * uz || 1;
      const t = clamp(((x - ax) * ux + (z - az) * uz) / ll, 0, 1), dx = x - ax - ux * t, dz = z - az - uz * t, d = dx * dx + dz * dz; if (d < best) best = d; }
    return Math.sqrt(best);
  }
  function ngCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map): see above
    const P = API.VR, A = h + P.D.base, f = P.n4(x, z), q = P.c2(x, z), m = P.c1(x, z), s5 = P.c5(x * 1.3, z * 1.3);
    let R = 0.5, G = 0.5, B = 0.27;
    const dry = sstep(0.45, 0.8, m) * 0.6; R = lerp(R, 0.66, dry); G = lerp(G, 0.58, dry); B = lerp(B, 0.35, dry);   // (straw)
    const fr = sstep(0.55, 0.85, P.c3(x, z)) * 0.45; R = lerp(R, 0.38, fr); G = lerp(G, 0.48, fr); B = lerp(B, 0.22, fr);   // (fresh green)
    const fl = sstep(1880, 1830, A) * 0.7; R = lerp(R, 0.62, fl); G = lerp(G, 0.59, fl); B = lerp(B, 0.35, fl);   // (the floor's short grass)
    const soil = sstep(0.68, 0.88, q) * 0.4; R = lerp(R, 0.53, soil); G = lerp(G, 0.37, soil); B = lerp(B, 0.25, soil);   // (the red-brown soil)
    const sh = vrLCf(x, z, 2) * 0.7; R = lerp(R, 0.33, sh); G = lerp(G, 0.38, sh); B = lerp(B, 0.2, sh);
    const tr = vrLCf(x, z, 1) * 0.8; R = lerp(R, 0.22, tr); G = lerp(G, 0.3, tr); B = lerp(B, 0.15, tr);
    const wt = Math.max(vrLCf(x, z, 6), vrLCf(x, z, 5)) * 0.7; R = lerp(R, 0.3, wt); G = lerp(G, 0.43, wt); B = lerp(B, 0.21, wt);
    const bu = Math.max(vrLCf(x, z, 3), vrLCf(x, z, 4)) * 0.65; R = lerp(R, 0.58, bu); G = lerp(G, 0.49, bu); B = lerp(B, 0.38, bu);
    const sd = segD(ST, x, z); if (sd < 9) { const t = sstep(9, 2, sd) * 0.6; R = lerp(R, 0.3, t); G = lerp(G, 0.42, t); B = lerp(B, 0.2, t); }   // (the streams)
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.08; B += (f - 0.5) * 0.05;
    const st = sstep(0.72, 0.45, ny);
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 4.5 + P.c2(x * 0.4, z * 0.4) * 6), k = 0.86 + 0.16 * band, ledge = sstep(0.5, 0.75, s5) * 0.45 * sstep(0.3, 0.5, ny);
      R = lerp(R, lerp(0.45 * k, R, ledge), st); G = lerp(G, lerp(0.4 * k, G, ledge), st); B = lerp(B, lerp(0.34 * k, B, ledge), st); }
    for (let k = 0; k < DU.length; k++) { const u = DU[k], e = Math.hypot(x - u[0], z - u[1]); if (e < u[2]) { const t = sstep(u[2], u[2] * 0.6, e) * 0.8; R = lerp(R, 0.62, t); G = lerp(G, 0.5, t); B = lerp(B, 0.38, t); } }
    const pd = segD(PA, x, z); if (pd < 1.4) { const t = sstep(1.4, 0.4, pd) * 0.75; R = lerp(R, 0.6, t); G = lerp(G, 0.47, t); B = lerp(B, 0.35, t); }
    if (dd < 1.8) { const t = sstep(1.8, 0.2, dd) * 0.5; R = lerp(R, 0.56, t); G = lerp(G, 0.42, t); B = lerp(B, 0.31, t); }   // (the verge: trodden red dust)
    SCOL[0] = R; SCOL[1] = G; SCOL[2] = B; return SCOL;
  }
  function ngGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (as caGCol, coloured by ngCol)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = ngCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function ngTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by ngCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = ngCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? caTileOn(a, b) : 0);
      const fix = (k0, dk) => { for (let q = 1; q < m; q += 2) { const a = k0 + (q - 1) * dk, b = k0 + (q + 1) * dk; pos[(k0 + q * dk) * 3 + 1] = (pos[a * 3 + 1] + pos[b * 3 + 1]) / 2; } };
      if (nb(ti, tj - 1) === 2) fix(0, 1); if (nb(ti, tj + 1) === 2) fix(m * n, 1); if (nb(ti - 1, tj) === 2) fix(0, n); if (nb(ti + 1, tj) === 2) fix(m, n);
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('steep', new THREE.BufferAttribute(stp, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }

  /* ---- the view beyond the corridor (def.farDem: the real terrain on a 300 m grid over the crater and round it, its land cover in cls;
     def.far.lake: Lake Magadi's level). As Irohazaka's irFar (its program; ngFarUpdate moves it with the camera, the haze lighter), coloured by
     the land cover: the walls' tawny grass, the forest on the rim, the floor's paler grass and its swamps, the fields outside; the soda lake
     milky blue-grey, a pink band round its edge (the flamingos) and its shore white with the soda. On the floor the herds: a wedge for each
     animal (about its size, so a dot or two at those distances), dark wildebeest, grey zebras, black buffalo, 900 m and more from the road ---- */
  function ngFar(def) {
    const F = def.farDem; if (!F) return null;
    const nx = F.nx, nz = F.nz, n = nx * nz, b = atob(F.b64), base = API.VR.D.base, H = new Float32Array(n), wet = new Uint8Array(n), cls = new Uint8Array(n), dr = new Float32Array(n);
    const lo = F.lo != null ? F.lo : 400;
    for (let k = 0; k < n; k++) H[k] = lo + (b.charCodeAt(2 * k) * 256 + b.charCodeAt(2 * k + 1)) / 2 - base;
    for (let k = 0, p = 0, v = 0; k < F.lake.length; k++) { if (v) wet.fill(1, p, p + F.lake[k]); p += F.lake[k]; v ^= 1; }
    if (F.cls) for (let q = 0, p = 0; q < F.cls.length && p < n;) {   // (RLE: a character (class x 8 + run - 1); a run of 8 goes on in the next characters, 63 each and the rest)
      const v = A64.indexOf(F.cls[q++]); let L = (v & 7) + 1; if (L === 8) { let e; do { e = A64.indexOf(F.cls[q++]); L += e; } while (e === 63 && q < F.cls.length); }
      cls.fill(v >> 3, p, Math.min(n, p + L)); p += L; }
    const lk = def.far && def.far.lake, lakeA = lk ? lk[2] : -1e9; if (lk) for (let k = 0; k < n; k++) if (wet[k]) H[k] = lakeA - base;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell; let m = 1e18;
      for (let q = 0; q < T.N; q += 5) { const dx = x - T.px[q], dz = z - T.pz[q], d = dx * dx + dz * dz; if (d < m) m = d; } dr[j * nx + i] = Math.sqrt(m); }
    const W = (i, j) => wet[clamp(j, 0, nz - 1) * nx + clamp(i, 0, nx - 1)];
    const P0 = [], C = [], I = [], RIM = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, h = H[k], A = h + base, sl = Math.hypot(H[j * nx + Math.min(nx - 1, i + 1)] - H[j * nx + Math.max(0, i - 1)], H[Math.min(nz - 1, j + 1) * nx + i] - H[Math.max(0, j - 1) * nx + i]) / (2 * F.cell), q = rpHash(i, j) - 0.5;
      const wn = W(i - 1, j) + W(i + 1, j) + W(i, j - 1) + W(i, j + 1);
      let c;
      if (wet[k]) c = wn < 4 ? [0.84 + q * 0.04, 0.6, 0.62] : [0.6 + q * 0.04, 0.66 + q * 0.04, 0.7];
      else if (wn > 0 && lk && A < lakeA + 30) c = [0.86, 0.84, 0.78];
      else {
        const cl = cls[k], fl = sstep(1830, 1790, A), rim = sstep(2150, 2300, A) * 0.6;
        c = [lerp(0.53, 0.66, fl) + q * 0.06, lerp(0.5, 0.6, fl) + q * 0.05, lerp(0.29, 0.36, fl) + q * 0.03];
        c = [lerp(c[0], 0.4, rim), lerp(c[1], 0.46, rim), lerp(c[2], 0.24, rim)];
        if (cl === 1) c = fl > 0.5 ? [0.42 + q * 0.04, 0.48 + q * 0.04, 0.22] : [0.2 + q * 0.03, 0.3 + q * 0.04, 0.15];   // (the rim's forest; the floor's fever trees, yellow-green)
        else if (cl === 2) c = [0.36 + q * 0.04, 0.41 + q * 0.04, 0.22];
        else if (cl === 6 || cl === 5) c = [0.27 + q * 0.04, 0.42 + q * 0.05, 0.2];   // (the swamps; the small pools)
        else if (cl === 7) c = [0.56 + q * 0.06, 0.52 + q * 0.05, 0.32];
        else if (cl === 3 || cl === 4) c = [0.6 + q * 0.05, 0.53 + q * 0.04, 0.42];
        const rk = Math.min(1, sstep(0.45, 0.9, sl) * 0.8); c = [lerp(c[0], 0.42 + q * 0.06, rk), lerp(c[1], 0.38 + q * 0.04, rk), lerp(c[2], 0.32, rk)];
      }
      P0.push(F.x0 + i * F.cell, h, F.z0 + j * F.cell); C.push(c[0], c[1], c[2]); RIM.push(sstep(720, 470, dr[k]));   // (the ring round the corridor's hole in the haze, as the corridor's edge)
    }
    for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) { const a = j * nx + i, b2 = a + 1, c = a + nx, d = c + 1;
      if (Math.min(dr[a], dr[b2], dr[c], dr[d]) < 470) continue; I.push(a, c, b2, b2, c, d); }
    const fh = (x, z) => { const gx = clamp((x - F.x0) / F.cell, 0, nx - 1.001), gz = clamp((z - F.z0) / F.cell, 0, nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, k = j * nx + i;
      return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + nx] * (1 - u) + H[k + nx + 1] * u) * v; };
    const RH = rng(7311), spots = [];
    for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) { const k = j * nx + i, A = H[k] + base;
      if (wet[k] || cls[k] !== 0 || dr[k] < 900 || A > lakeA + 75 || W(i - 1, j) + W(i + 1, j) + W(i, j - 1) + W(i, j + 1) > 0) continue;
      if (Math.abs(H[k + 1] - H[k - 1]) + Math.abs(H[k + nx] - H[k - nx]) > 30) continue; spots.push(k); }
    let nHerd = 0, nSpeck = 0;
    const tri = (a, b2, c, cx, cy, cz) => { const ax = P0[a * 3], ay = P0[a * 3 + 1], az = P0[a * 3 + 2], ux = P0[b2 * 3] - ax, uy = P0[b2 * 3 + 1] - ay, uz = P0[b2 * 3 + 2] - az, vx = P0[c * 3] - ax, vy = P0[c * 3 + 1] - ay, vz = P0[c * 3 + 2] - az;
      const ox = uy * vz - uz * vy, oy = uz * vx - ux * vz, oz = ux * vy - uy * vx; if (ox * (ax - cx) + oy * (ay - cy) + oz * (az - cz) < 0) I.push(a, c, b2); else I.push(a, b2, c); };
    for (let hq = 0; hq < 18 && spots.length; hq++) {
      const k = spots[Math.floor(RH() * spots.length)], i = k % nx, j = (k - i) / nx, cx = F.x0 + i * F.cell + (RH() - 0.5) * F.cell, cz = F.z0 + j * F.cell + (RH() - 0.5) * F.cell;
      const kind = RH(), col = kind < 0.55 ? [0.16, 0.15, 0.14] : kind < 0.85 ? [0.46, 0.45, 0.43] : [0.1, 0.09, 0.09], m = 16 + Math.floor(RH() * 40), rr = 40 + RH() * 110, an = RH() * PI, rim = sstep(720, 470, dr[k]);
      for (let a = 0; a < m; a++) {
        const u = (RH() - 0.5) * 2 * rr, v = (RH() - 0.5) * rr * 0.6, x = cx + Math.cos(an) * u - Math.sin(an) * v, z = cz + Math.sin(an) * u + Math.cos(an) * v, y = fh(x, z) - 0.2, hd = RH() * TAU, co = Math.cos(hd), si = Math.sin(hd), cc = vary(col, RH, 0.12), v0 = P0.length / 3;
        for (const [lx, ly, lz] of [[-1.1, 0, -0.38], [1.1, 0, -0.38], [1.1, 0, 0.38], [-1.1, 0, 0.38], [-0.85, 1.45, 0], [0.95, 1.45, 0]]) { P0.push(x + lx * co - lz * si, y + ly, z + lx * si + lz * co); C.push(cc[0], cc[1], cc[2]); RIM.push(rim); }
        const my = y + 0.5; tri(v0, v0 + 1, v0 + 5, x, my, z); tri(v0, v0 + 5, v0 + 4, x, my, z); tri(v0 + 2, v0 + 3, v0 + 4, x, my, z); tri(v0 + 2, v0 + 4, v0 + 5, x, my, z); tri(v0 + 1, v0 + 2, v0 + 5, x, my, z); tri(v0 + 3, v0, v0 + 4, x, my, z);
        nSpeck++; }
      nHerd++; }
    const g = new THREE.BufferGeometry(), nv = P0.length / 3;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
    g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1)); g.setIndex(I); g.computeVertexNormals();
    const U = { uHz: { value: new THREE.Color(0xc8d6e2) } }, mt = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false });
    mt.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
    mt.customProgramCacheKey = () => 'irFar';   // (the same program as irFar's)
    const mesh = new THREE.Mesh(g, mt); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'ngFar';
    mesh.onBeforeRender = (r, sc) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); };
    return { mesh, P0: Float32Array.from(P0), rim: Float32Array.from(RIM), cx: 1e9, cy: 0, cz: 0, cf: 0, herds: nHerd, specks: nSpeck };
  }
  function ngFarUpdate(F, cam) {   // as irFarUpdate: each node drawn just inside the camera's far end, in its direction; the haze lighter (the floor 2-3 km off a
    F.mesh.visible = true;          // fifth in it, the far rim 15-20 km off about half); no camera: back to the nodes' own places (the world test's pose)
    const g = F.mesh.geometry, pa = g.attributes.position, ha = g.attributes.aHz;
    if (!cam) { if (F.cx !== 1e9) { pa.array.set(F.P0); ha.array.fill(0.5); pa.needsUpdate = ha.needsUpdate = true; F.cx = 1e9; } return; }
    const c = cam.position; if (Math.abs(c.x - F.cx) + Math.abs(c.y - F.cy) + Math.abs(c.z - F.cz) < 0.5 && cam.far === F.cf) return;
    F.cx = c.x; F.cy = c.y; F.cz = c.z; F.cf = cam.far;
    const p = pa.array, hz = ha.array, P0 = F.P0, R0 = cam.far - 70, R1 = cam.far - 6;
    for (let v = 0, k = 0; k < P0.length; v++, k += 3) { const dx = P0[k] - c.x, dy = P0[k + 1] - c.y, dz = P0[k + 2] - c.z, D = Math.max(1, Math.hypot(dx, dy, dz)), r = R0 + (R1 - R0) * (1 - Math.exp(-Math.max(0, D - 400) / 3000)), f = r / D;
      p[k] = c.x + dx * f; p[k + 1] = c.y + dy * f; p[k + 2] = c.z + dz * f; hz[v] = Math.max(F.rim[v], 0.14 + 0.5 * (1 - Math.exp(-Math.max(0, D - 500) / 7000))); }
    pa.needsUpdate = ha.needsUpdate = true;
  }

  // the road's setts: rough grey-brown blocks (~22 x 15 cm) in courses across the road, a shade each, the edges worn round (lit from one
  // side), the joints full of the red dust; 512 px = 2.4 m of road, tileable; made once and kept
  let ngSetT = null;
  function ngSettTex() {
    if (ngSetT) return ngSetT;
    const S = 512, NR = 16, RH = S / NR, Rr = rng(5301), rows = [];
    for (let j = 0; j < NR; j++) { const ws = []; let t = 0; while (t < S - 20) { const wv = 36 + Rr() * 22; ws.push(wv); t += wv; }
      const k = S / t, cum = [0]; let c = 0; for (const wv of ws) { c += wv * k; cum.push(c); } cum[cum.length - 1] = S;
      rows.push({ cum, off: Math.floor(Rr() * S), tone: ws.map(() => 0.8 + Rr() * 0.36), tint: ws.map(() => Rr() - 0.5) }); }
    const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), im = x.createImageData(S, S), d = im.data;
    for (let py = 0; py < S; py++) { const j = Math.floor(py / RH), r = rows[j], v = py - j * RH + 0.5;
      for (let px = 0; px < S; px++) { const u = (px + r.off) % S + 0.5; let k = 0; while (k < r.cum.length - 2 && r.cum[k + 1] <= u) k++;
        const w0 = r.cum[k + 1] - r.cum[k], lx = u - r.cum[k], e = Math.min(lx, w0 - lx, v, RH - v), o = (py * S + px) * 4;   // (e: the distance to the joint, px)
        let R, G, B;
        if (e < 2.2) { const q = 0.36 + (Rr() - 0.5) * 0.06; R = q * 1.25; G = q * 0.92; B = q * 0.72; }   // (the joint: the red dust)
        else { const fx = lx / w0, fy = v / RH, lit = (sstep(0.22, 0, fx) + sstep(0.25, 0, fy) - sstep(0.78, 1, fx) - sstep(0.75, 1, fy)) * 0.5, tn = r.tone[k];
          const q = tn * (0.47 + 0.09 * lit) * (0.86 + 0.14 * sstep(2.2, 6, e)) + (Rr() - 0.5) * 0.05, dust = Rr() < 0.04 ? 0.07 : 0;
          R = q * (1.04 + r.tint[k] * 0.08) + dust; G = q * 0.99 + dust * 0.5; B = q * (0.93 - r.tint[k] * 0.06); }
        d[o] = clamp(R * 255, 0, 255); d[o + 1] = clamp(G * 255, 0, 255); d[o + 2] = clamp(B * 255, 0, 255); d[o + 3] = 255; } }
    x.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return (ngSetT = t);
  }
  const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' m';   // (the boards: 2,083 m)
  let nATex = null, nAKey = '', nA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function ngAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): MWANZO (the start), MWISHO (the finish), CP1-CP4 with the altitude, the board at the finish, the race's banner
    const key = cps.join('|') + '|' + finA; if (nATex && nAKey === key) return nATex;
    if (nATex) nATex.dispose(); nAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('MWANZO', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(262, 142, 500, 100); txt('MWISHO', 512, 196, 92, '#111', 470);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#1e5a32'; x.fillRect(0, y, 1024, 128); x.fillStyle = '#f2c616'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#f2c616', 520); });
    x.fillStyle = '#5a3d22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#efe6cf'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('NGORONGORO', 512, 812, 58, '#f4ecd6', 900); txt(finA, 512, 862, 46, '#f4ecd6', 900);
    x.fillStyle = '#1e5a32'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#f2c616'; x.fillRect(0, 952, 1024, 6); x.fillStyle = '#111'; x.fillRect(0, 958, 1024, 6); x.fillStyle = '#2a8fd0'; x.fillRect(0, 1018, 1024, 6);
    txt('NGORONGORO', 512, 925, 52, '#fff', 980); txt('SENETO · WINDY GAP', 512, 992, 44, '#f2c616', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (nATex = t);
  }
  const NG_BOARDS = [['WINDY GAP', '#2c5a34'], ['SENETO', '#2c5a34'], ['NGORONGORO', '#5a3d22'], ['NJIA MOJA', '#f2f0ea'], ['PUNGUZA MWENDO', '#f2f0ea'], ['KARATU', '#2c5a34'], ['HATARI · WANYAMA', '#f2f0ea'], ['MAGADI', '#5a3d22']];
  function ngAtlas2() {   // the small signs: cells 30-31 the chevrons (white on red), cell 26 the animals' warning (a buffalo in a red triangle), cells 28-29 the
    // viewpoint's board (a picture of the crater: its rim, the floor, the lake; no words); rows 4-7, the place boards (two a row, 512 x 128)
    if (nA2Tex) return nA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (const [k, dir] of [[30, 1], [31, -1]]) {
      const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128; x.fillStyle = '#c8261c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f6f5f0';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    { const x0 = 256, y0 = 384;   // the animals' warning: a red triangle, white inside, a buffalo's black outline
      x.fillStyle = '#c8261c'; x.beginPath(); x.moveTo(x0 + 64, y0 + 6); x.lineTo(x0 + 124, y0 + 118); x.lineTo(x0 + 4, y0 + 118); x.closePath(); x.fill();
      x.fillStyle = '#f6f5f0'; x.beginPath(); x.moveTo(x0 + 64, y0 + 26); x.lineTo(x0 + 108, y0 + 108); x.lineTo(x0 + 20, y0 + 108); x.closePath(); x.fill();
      x.fillStyle = '#111'; x.beginPath(); x.ellipse(x0 + 60, y0 + 84, 22, 11, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(x0 + 84, y0 + 86, 8, 6, 0.4, 0, TAU); x.fill();
      x.fillRect(x0 + 42, y0 + 88, 4, 14); x.fillRect(x0 + 52, y0 + 90, 4, 12); x.fillRect(x0 + 66, y0 + 90, 4, 12); x.fillRect(x0 + 74, y0 + 88, 4, 14);
      x.lineWidth = 3; x.strokeStyle = '#111'; x.beginPath(); x.arc(x0 + 84, y0 + 80, 9, PI * 1.05, PI * 1.95); x.stroke(); }
    { const x0 = 512, y0 = 384, W = 256, H = 128;   // the viewpoint's board: the sky, the far rim, the floor, the lake with its pink edge, the near wall and the road
      x.fillStyle = '#5a3d22'; x.fillRect(x0, y0, W, H); x.fillStyle = '#dfe9ee'; x.fillRect(x0 + 8, y0 + 8, W - 16, H - 16);
      x.fillStyle = '#6f8a5a'; x.beginPath(); x.moveTo(x0 + 8, y0 + 44); x.quadraticCurveTo(x0 + 128, y0 + 30, x0 + 248, y0 + 46); x.lineTo(x0 + 248, y0 + 70); x.lineTo(x0 + 8, y0 + 70); x.closePath(); x.fill();
      x.fillStyle = '#b9b071'; x.fillRect(x0 + 8, y0 + 64, W - 16, 30);
      x.fillStyle = '#e7b8bd'; x.beginPath(); x.ellipse(x0 + 150, y0 + 76, 44, 9, 0, 0, TAU); x.fill(); x.fillStyle = '#c9d6dc'; x.beginPath(); x.ellipse(x0 + 150, y0 + 76, 38, 6.5, 0, 0, TAU); x.fill();
      x.fillStyle = '#7d8a4c'; x.beginPath(); x.moveTo(x0 + 8, y0 + 120); x.lineTo(x0 + 8, y0 + 78); x.quadraticCurveTo(x0 + 60, y0 + 96, x0 + 110, y0 + 120); x.closePath(); x.fill();
      x.strokeStyle = '#c8261c'; x.lineWidth = 4; x.beginPath(); x.moveTo(x0 + 18, y0 + 84); x.lineTo(x0 + 46, y0 + 92); x.lineTo(x0 + 30, y0 + 100); x.lineTo(x0 + 70, y0 + 112); x.stroke(); }
    NG_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, warn = bg === '#f2f0ea';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = warn ? '#c8261c' : '#f2f2ee'; x.lineWidth = warn ? 12 : 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, 52, warn ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (nA2Tex = t);
  }
  function ngTreeGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 a tree of the rim's forest (round dark crowns on a short trunk), 1 an
    // umbrella acacia (a wide flat crown on a leaning trunk), 2 a candelabra euphorbia (a thick stem branching into upright dull-green candles), 3 a
    // shrub (an olive mound), 4 a tuft of grass (blades with straw tips)
    const g = new GB(), R = rng(990 + kind), rs = API.ROCK_SMOOTH, frond = (cx, cy, cz, a, L, lift, droop, w, col, tip) => {
      const ux = Math.cos(a), uz = Math.sin(a), px = -uz * w, pz = ux * w, m = [cx + ux * L * 0.55, cy + lift, cz + uz * L * 0.55], e = [cx + ux * L, cy + lift - droop, cz + uz * L];
      const b = [cx, cy, cz], l1 = [m[0] + px, m[1], m[2] + pz], r1 = [m[0] - px, m[1], m[2] - pz], up = [cx, cy + 1, cz], dn = [cx, cy - 1, cz];
      g.triO(b, l1, m, col, dn, col, col); g.triO(b, m, l1, col, up, col, col); g.triO(b, m, r1, col, dn, col, col); g.triO(b, r1, m, col, up, col, col);
      g.triO(l1, e, m, col, dn, tip, col); g.triO(l1, m, e, col, up, col, tip); g.triO(m, e, r1, col, dn, tip, col); g.triO(m, r1, e, col, up, col, tip); };
    if (kind === 0) {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.04, 0.4, 4, [0.36, 0.31, 0.26], null, 0.03);
      const cs = [[0.2, 0.3, 0.15], [0.24, 0.33, 0.17], [0.18, 0.27, 0.14]];
      ico(g, 0, 0.62, 0, 0.32, 0.85, cs[0], R, 0.35); ico(g, 0.22, 0.52, 0.12, 0.24, 0.8, cs[1], R, 0.35); ico(g, -0.2, 0.55, -0.14, 0.24, 0.85, cs[2], R, 0.35); ico(g, 0.02, 0.82, 0.04, 0.2, 0.75, cs[1], R, 0.3);
    } else if (kind === 1) {
      API.ROCK_SMOOTH = true; cyl(g, 0, -0.02, 0, 0.03, 0.7, 4, [0.4, 0.33, 0.26], null, 0.022); cyl(g, 0.08, 0.5, 0.03, 0.018, 0.34, 3, [0.4, 0.33, 0.26], null, 0.01); cyl(g, -0.07, 0.48, -0.04, 0.016, 0.32, 3, [0.4, 0.33, 0.26], null, 0.01);
      ico(g, 0, 0.84, 0, 0.5, 0.22, [0.33, 0.42, 0.19], R, 0.2); ico(g, 0.2, 0.9, 0.1, 0.32, 0.24, [0.38, 0.46, 0.22], R, 0.2); ico(g, -0.24, 0.8, -0.12, 0.3, 0.22, [0.3, 0.39, 0.18], R, 0.2);
    } else if (kind === 2) {
      API.ROCK_SMOOTH = true; const sc = [0.34, 0.42, 0.27], sd = [0.3, 0.38, 0.24];
      cyl(g, 0, -0.02, 0, 0.07, 0.38, 6, [0.42, 0.4, 0.33], null, 0.06);
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.4, r = k ? 0.12 + R() * 0.14 : 0, x = Math.cos(a) * r, z = Math.sin(a) * r, y0 = 0.32 + R() * 0.08, hh = (k ? 0.45 : 0.62) + R() * 0.15;
        if (k) cyl(g, x * 0.5, y0 - 0.02, z * 0.5, 0.045, 0.06, 5, sd, null, 0.04);
        cyl(g, x, y0, z, 0.05, hh, 5, k % 2 ? sc : sd, null, 0.032); }
    } else if (kind === 3) {
      API.ROCK_SMOOTH = true; ico(g, 0, 0.42, 0, 0.52, 0.8, [0.33, 0.38, 0.2], R, 0.4); ico(g, 0.28, 0.32, 0.16, 0.32, 0.85, [0.37, 0.42, 0.22], R, 0.4); ico(g, -0.24, 0.3, -0.18, 0.3, 0.8, [0.3, 0.35, 0.19], R, 0.4);
    } else {
      const gc = [[0.52, 0.52, 0.28], [0.6, 0.57, 0.32]], gt = [0.76, 0.68, 0.44];
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.5; frond(0, 0, 0, a, 0.28 + R() * 0.12, 0.62, -0.3, 0.035, gc[k % 2], gt); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function ngSafari(g, x, y, z, rot, col) {   // a safari vehicle (generic: no make, no names on it): a long-wheelbase 4x4, its roof raised on posts for the game
    // viewing, a spare wheel at the back, a bull bar; its long side along rot
    const c = Math.cos(rot), s = Math.sin(rot), at = (u) => [x + u * c, z + u * s], dk = [0.1, 0.1, 0.11], win = [0.16, 0.19, 0.22], rf = [0.78, 0.73, 0.6];
    box(g, x, y + 0.42, z, 4.8, 0.92, 1.95, rot, col);
    { const [px, pz] = at(-0.35); box(g, px, y + 1.34, pz, 3.7, 0.72, 1.9, rot, win, col); for (const u of [-1.6, -0.2, 1.2]) { const [qx, qz] = at(-0.35 + u); box(g, qx, y + 1.34, qz, 0.1, 0.72, 1.92, rot, col); } }
    { const [px, pz] = at(-0.35); box(g, px, y + 2.42, pz, 3.5, 0.1, 1.95, rot, rf); for (const [u, v] of [[-1.6, -0.85], [-1.6, 0.85], [1.25, -0.85], [1.25, 0.85]]) box(g, px + u * c - v * s, y + 2.05, pz + u * s + v * c, 0.07, 0.38, 0.07, rot, dk); }
    for (const [u, v] of [[1.55, -0.92], [1.55, 0.92], [-1.55, -0.92], [-1.55, 0.92]]) box(g, x + u * c - v * s, y - 0.02, z + u * s + v * c, 0.82, 0.8, 0.32, rot, dk);
    { const [px, pz] = at(-2.52); box(g, px, y + 0.35, pz, 0.28, 0.8, 0.8, rot, dk); }
    { const [px, pz] = at(2.47); box(g, px, y + 0.2, pz, 0.14, 0.6, 1.8, rot, dk); }
  }

  /* ---- the animals: one instanced mesh a species, posed in the vertex shader (as Pikes Peak's). Model space: +x forward, y up, the feet on y = 0;
     each part a GB with the joint it turns about (attribute aPart: part, joint x, joint y): 0 the body, 1 the neck and the head (aPose x: yaw, y:
     pitch about its joint), 2 and 3 the legs in diagonal pairs (aPose z: their swing, opposite in 3; aPose w: folded up under the body, lying) ---- */
  const BLK = [0.07, 0.07, 0.075], WHT = [0.9, 0.89, 0.86];
  const mix = (a, b, f) => { f = clamp(f, 0, 1); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; };
  function egg(g, c, r, pit, n, m, col, band) {   // ellipsoid along its own x axis pitched by pit, n round, m bands pole to pole; col(u, v, w, j): the colour at a point of the
    // unit sphere (u forward, v up, w to the side; j its ring); band: one colour a band, col at the band's middle (crisp stripes)
    const cp = Math.cos(pit), sp = Math.sin(pit), V = [], cz = c[2] || 0;
    for (let j = 0; j <= m; j++) { const th = j / m * PI, row = [];
      for (let k = 0; k < (j === 0 || j === m ? 1 : n); k++) { const ph = k / n * TAU, u = Math.cos(th), v = Math.sin(th) * Math.cos(ph), w = Math.sin(th) * Math.sin(ph), x = u * r[0], y = v * r[1], a = u / r[0], b = v / r[1], d = w / r[2], l = Math.hypot(a, b, d) || 1;
        row.push({ p: [c[0] + x * cp - y * sp, c[1] + x * sp + y * cp, cz + w * r[2]], n: [(a * cp - b * sp) / l, (a * sp + b * cp) / l, d / l], c: col(u, v, w, j) }); }
      V.push(row); }
    const ctr = [c[0], c[1], cz], tri = (a, b, d, cc) => g.triON(a.p, b.p, d.p, a.n, b.n, d.n, ctr, cc || a.c, cc || b.c, cc || d.c);
    for (let j = 0; j < m; j++) { const A = V[j], B = V[j + 1], th = (j + 0.5) / m * PI;
      for (let k = 0; k < n; k++) { const k1 = (k + 1) % n, ph = (k + 0.5) / n * TAU, cc = band ? col(Math.cos(th), Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), j) : null;
        if (A.length === 1) tri(A[0], B[k], B[k1], cc); else if (B.length === 1) tri(A[k], A[k1], B[0], cc); else { tri(A[k], A[k1], B[k1], cc); tri(A[k], B[k1], B[k], cc); } } }
  }
  function tube(g, pts, rad, n, col, flat) {   // tapered tube through pts (n sides, radius rad[k], colour col(k) at ring k; flat: one colour a segment); a zero radius ends it in a point
    const rg = pts.map((p, k) => { const q = pts[Math.min(k + 1, pts.length - 1)], o = pts[Math.max(k - 1, 0)]; let tx = q[0] - o[0], ty = q[1] - o[1], tz = q[2] - o[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      const ul = Math.hypot(tx, ty) || 1, ux = ty / ul, uy = -tx / ul, vx = tz * tx / ul, vy = tz * ty / ul, vz = -(tx * tx + ty * ty) / ul, out = [];
      for (let j = 0; j < n; j++) { const a = j / n * TAU, c = Math.cos(a), s = Math.sin(a), nx = ux * c + vx * s, ny = uy * c + vy * s, nz = vz * s; out.push({ p: [p[0] + nx * rad[k], p[1] + ny * rad[k], p[2] + nz * rad[k]], n: [nx, ny, nz] }); }
      out.t = [tx, ty, tz]; return out; });
    for (let k = 1; k < pts.length; k++) { const A = rg[k - 1], B = rg[k], ca = col(k - 1), cb = flat ? ca : col(k), inn = [(pts[k - 1][0] + pts[k][0]) / 2, (pts[k - 1][1] + pts[k][1]) / 2, (pts[k - 1][2] + pts[k][2]) / 2];
      for (let j = 0; j < n; j++) { const a = A[j], b = A[(j + 1) % n], c = B[(j + 1) % n], d = B[j];
        if (rad[k] > 0) { g.triON(a.p, b.p, c.p, a.n, b.n, c.n, inn, ca, ca, cb); g.triON(a.p, c.p, d.p, a.n, c.n, d.n, inn, ca, cb, cb); } else g.triON(a.p, b.p, pts[k], a.n, b.n, B.t, inn, ca, ca, cb); } }
  }
  const line = (a, b, n) => { const o = []; for (let k = 0; k <= n; k++) { const f = k / n; o.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)]); } return o; };
  function legs(parts, list, top, len, r0, r1, col, striped) {   // four legs: [x, z, part] (2 / 3: the diagonal pairs); striped: the zebra's bands
    for (const [x, z, k] of list) { const g = new GB(), n = striped ? 6 : 2, pts = line([x, top, z], [x, 0, z], n), rad = pts.map((p, q) => lerp(r0, r1, q / n));
      tube(g, pts, rad, 4, striped ? (q) => (q % 2 ? BLK : WHT) : col, striped); parts.push([g, k, x, top]); }
  }
  const NG_SP = {   // the species: [their parts], size (m, the body's length: how far apart in a herd), walk and run (m/s), the radius a car alerts them in and the one they run off in (0: they do not run)
    gnu: { len: 2.0, walk: 1.3, run: 9, alert: 70, flee: 30, graze: 1.25, build() {
      const coat = [0.33, 0.33, 0.33], dark = [0.13, 0.12, 0.12], b = new GB(), h = new GB(), parts = [[b, 0, 0, 0], [h, 1, 0.62, 1.12]];
      egg(b, [0, 0.98], [0.72, 0.32, 0.27], -0.08, 7, 8, (u, v, w, j) => (v < -0.7 ? mix(coat, dark, 0.3) : j % 3 === 0 && u > 0 ? mix(coat, dark, 0.5) : coat), true);   // (the dark bands on the forequarters)
      egg(b, [0.38, 1.12], [0.36, 0.28, 0.25], 0, 6, 4, () => coat);
      tube(b, [[-0.66, 1.08, 0], [-0.8, 0.85, 0], [-0.84, 0.55, 0]], [0.05, 0.045, 0.07], 3, () => dark);
      tube(h, [[0.6, 1.12, 0], [0.82, 1.0, 0], [0.92, 0.86, 0]], [0.2, 0.15, 0.12], 5, () => coat);
      tube(h, [[0.66, 1.33, 0], [0.86, 1.16, 0], [0.98, 0.98, 0]], [0.035, 0.03, 0], 3, () => dark);   // (the mane)
      egg(h, [1.02, 0.8], [0.27, 0.11, 0.1], -1.05, 6, 4, (u) => (u > 0.4 ? dark : mix(coat, dark, 0.6)));   // (the long black face)
      tube(h, [[0.82, 0.86, 0], [0.86, 0.66, 0]], [0.06, 0], 3, () => dark);   // (the beard)
      for (const sd of [-1, 1]) tube(h, [[0.95, 0.98, sd * 0.06], [0.93, 1.04, sd * 0.2], [0.98, 1.16, sd * 0.24], [1.02, 1.2, sd * 0.18]], [0.04, 0.035, 0.025, 0], 3, () => [0.2, 0.19, 0.18]);
      legs(parts, [[0.42, -0.14, 2], [-0.46, 0.14, 2], [0.42, 0.14, 3], [-0.46, -0.14, 3]], 0.72, 0.72, 0.065, 0.035, (q) => (q ? dark : coat));
      return parts; } },
    zebra: { len: 2.1, walk: 1.3, run: 9, alert: 70, flee: 28, graze: 1.25, build() {
      const st = (j) => (j % 2 ? BLK : WHT), b = new GB(), h = new GB(), parts = [[b, 0, 0, 0], [h, 1, 0.55, 1.0]];
      egg(b, [0, 0.92], [0.7, 0.3, 0.25], 0, 7, 14, (u, v, w, j) => (v < -0.85 ? WHT : st(j)), true);
      tube(b, [[-0.66, 1.0, 0], [-0.78, 0.8, 0], [-0.8, 0.55, 0]], [0.04, 0.035, 0.05], 3, () => BLK);
      tube(h, line([0.52, 0.98, 0], [0.8, 1.26, 0], 6), [0.18, 0.17, 0.16, 0.15, 0.14, 0.13, 0.12], 6, st, true);
      tube(h, line([0.46, 1.14, 0], [0.8, 1.44, 0], 6), [0.04, 0.04, 0.035, 0.035, 0.03, 0.03, 0.02], 3, st, true);   // (the upright mane)
      egg(h, [0.96, 1.12], [0.28, 0.11, 0.1], -0.95, 6, 6, (u, v, w, j) => (u > 0.7 ? [0.12, 0.11, 0.1] : st(j)), true);
      for (const sd of [-1, 1]) tube(h, [[0.86, 1.3, sd * 0.06], [0.84, 1.44, sd * 0.09]], [0.035, 0], 3, () => WHT);
      legs(parts, [[0.4, -0.13, 2], [-0.44, 0.13, 2], [0.4, 0.13, 3], [-0.44, -0.13, 3]], 0.68, 0.68, 0.06, 0.035, null, true);
      return parts; } },
    buffalo: { len: 2.8, walk: 0.9, run: 0, alert: 80, flee: 0, graze: 1.0, build() {
      const coat = [0.13, 0.12, 0.115], hornC = [0.3, 0.28, 0.25], b = new GB(), h = new GB(), parts = [[b, 0, 0, 0], [h, 1, 0.75, 1.1]];
      egg(b, [0, 1.02], [0.95, 0.42, 0.38], 0, 7, 5, () => coat); egg(b, [0.42, 1.18], [0.48, 0.36, 0.35], 0, 6, 4, () => coat);
      tube(b, [[-0.9, 1.15, 0], [-1.0, 0.85, 0], [-1.0, 0.55, 0]], [0.05, 0.04, 0.06], 3, () => coat);
      egg(h, [0.85, 1.05], [0.25, 0.25, 0.22], 0, 5, 3, () => coat);
      egg(h, [1.02, 0.92], [0.32, 0.22, 0.2], -0.6, 6, 4, (u) => (u > 0.6 ? [0.2, 0.19, 0.18] : coat));
      egg(h, [1.0, 1.16], [0.16, 0.08, 0.2], 0, 5, 3, () => hornC);   // (the horns' boss)
      for (const sd of [-1, 1]) { tube(h, [[1.0, 1.15, sd * 0.12], [0.98, 1.08, sd * 0.36], [1.02, 0.96, sd * 0.48], [1.12, 1.06, sd * 0.56]], [0.07, 0.06, 0.04, 0], 3, () => hornC);
        egg(h, [0.94, 1.02, sd * 0.3], [0.08, 0.12, 0.04], 0, 4, 2, () => coat); }
      legs(parts, [[0.6, -0.2, 2], [-0.6, 0.2, 2], [0.6, 0.2, 3], [-0.6, -0.2, 3]], 0.7, 0.7, 0.1, 0.06, () => coat);
      return parts; } },
    gazelle: { len: 1.0, walk: 1.0, run: 11, alert: 80, flee: 45, graze: 1.2, build() {
      const tan = [0.74, 0.52, 0.31], hoof = [0.3, 0.22, 0.16], b = new GB(), h = new GB(), parts = [[b, 0, 0, 0], [h, 1, 0.28, 0.62]];
      egg(b, [0, 0.56], [0.38, 0.16, 0.13], 0, 6, 5, (u, v) => (v < -0.45 ? WHT : v < -0.12 ? BLK : u < -0.85 ? WHT : tan));   // (the black band along the side, the white belly)
      tube(b, [[-0.36, 0.6, 0], [-0.44, 0.5, 0]], [0.025, 0.02], 3, () => BLK);
      tube(h, [[0.28, 0.6, 0], [0.38, 0.72, 0], [0.44, 0.82, 0]], [0.06, 0.05, 0.045], 4, () => tan);
      egg(h, [0.52, 0.82], [0.13, 0.055, 0.05], -0.5, 5, 3, (u, v) => (u > 0.6 ? hoof : v > 0.2 ? tan : WHT));
      for (const sd of [-1, 1]) { tube(h, [[0.47, 0.88, sd * 0.025], [0.44, 0.98, sd * 0.035], [0.4, 1.06, sd * 0.03]], [0.012, 0.01, 0], 3, () => BLK); tube(h, [[0.46, 0.88, sd * 0.04], [0.43, 0.94, sd * 0.09]], [0.02, 0], 3, () => tan); }
      legs(parts, [[0.24, -0.06, 2], [-0.26, 0.06, 2], [0.24, 0.06, 3], [-0.26, -0.06, 3]], 0.46, 0.46, 0.022, 0.012, (q) => (q ? hoof : tan));
      return parts; } },
    warthog: { len: 1.3, walk: 0.8, run: 6, alert: 50, flee: 24, graze: 0.75, build() {
      const gry = [0.33, 0.3, 0.28], dk = [0.2, 0.18, 0.17], b = new GB(), h = new GB(), parts = [[b, 0, 0, 0], [h, 1, 0.42, 0.58]];
      egg(b, [0, 0.5], [0.55, 0.24, 0.21], 0.05, 6, 4, () => gry);
      tube(b, [[0.4, 0.74, 0], [0.0, 0.75, 0], [-0.35, 0.68, 0]], [0.04, 0.03, 0.02], 3, () => dk);   // (the mane)
      tube(b, [[-0.52, 0.56, 0], [-0.56, 0.8, 0], [-0.55, 0.98, 0]], [0.018, 0.015, 0.03], 3, () => dk);   // (the tail held up)
      egg(h, [0.66, 0.42], [0.26, 0.15, 0.13], -0.35, 6, 4, () => gry);
      for (const sd of [-1, 1]) { tube(h, [[0.8, 0.32, sd * 0.07], [0.88, 0.38, sd * 0.12], [0.88, 0.46, sd * 0.1]], [0.025, 0.02, 0], 3, () => [0.86, 0.82, 0.72]); egg(h, [0.7, 0.5, sd * 0.13], [0.05, 0.03, 0.03], 0, 4, 2, () => dk); }
      legs(parts, [[0.32, -0.12, 2], [-0.34, 0.12, 2], [0.32, 0.12, 3], [-0.34, -0.12, 3]], 0.34, 0.34, 0.05, 0.03, () => gry);
      return parts; } },
    hyena: { len: 1.4, walk: 1.6, run: 8, alert: 60, flee: 22, graze: 0.5, build() {
      const sand = [0.6, 0.5, 0.36], spot = [0.24, 0.19, 0.14], b = new GB(), h = new GB(), parts = [[b, 0, 0, 0], [h, 1, 0.45, 0.76]];
      egg(b, [0, 0.62], [0.55, 0.24, 0.2], 0.16, 7, 6, (u, v, w) => (rpHash(Math.round(u * 9 + 20), Math.round(w * 7 + v * 5 + 20)) < 0.3 ? spot : sand));   // (the back sloping from the shoulders, the spots)
      tube(b, [[-0.5, 0.56, 0], [-0.6, 0.4, 0]], [0.04, 0.03], 3, () => spot);
      tube(h, [[0.42, 0.74, 0], [0.6, 0.74, 0]], [0.16, 0.13], 5, () => sand);
      egg(h, [0.74, 0.7], [0.2, 0.13, 0.12], -0.3, 6, 4, (u) => (u > 0.55 ? spot : sand));
      for (const sd of [-1, 1]) egg(h, [0.66, 0.84, sd * 0.08], [0.04, 0.06, 0.02], 0, 4, 2, () => spot);
      for (const [x, z, k, top] of [[0.36, -0.12, 2, 0.66], [-0.36, 0.12, 2, 0.5], [0.36, 0.12, 3, 0.66], [-0.36, -0.12, 3, 0.5]]) { const g = new GB(); tube(g, [[x, top, z], [x, 0, z]], [0.06, 0.035], 4, (q) => (q ? spot : sand)); parts.push([g, k, x, top]); }
      return parts; } },
    lion: { len: 1.9, walk: 1.0, run: 0, alert: 60, flee: 0, graze: 0, build: () => ngLion(false) },
    lionM: { len: 2.1, walk: 1.0, run: 0, alert: 60, flee: 0, graze: 0, build: () => ngLion(true) },
    elephant: { len: 5.0, walk: 0.9, run: 0, alert: 70, flee: 0, graze: 0.5, build() {
      const gry = [0.44, 0.41, 0.39], dk = [0.34, 0.32, 0.3], ivory = [0.88, 0.84, 0.74], b = new GB(), h = new GB(), parts = [[b, 0, 0, 0], [h, 1, 1.35, 2.4]];
      egg(b, [0, 2.0], [1.55, 1.05, 0.95], 0, 8, 6, (u, v) => (v < -0.5 ? dk : gry));
      tube(b, [[-1.5, 2.3, 0], [-1.65, 1.6, 0], [-1.65, 1.0, 0]], [0.06, 0.04, 0.05], 3, () => dk);
      egg(h, [1.65, 2.55], [0.62, 0.68, 0.58], 0.1, 7, 5, () => gry);
      tube(h, [[2.15, 2.3, 0], [2.32, 1.8, 0], [2.36, 1.2, 0], [2.3, 0.6, 0], [2.36, 0.3, 0]], [0.26, 0.2, 0.15, 0.11, 0.09], 6, () => gry);   // (the trunk)
      for (const sd of [-1, 1]) { egg(h, [1.45, 2.55, sd * 0.62], [0.6, 0.72, 0.07], 0.15, 6, 4, () => mix(gry, dk, 0.4));   // (the wide flat ears)
        tube(h, [[2.0, 1.95, sd * 0.28], [2.35, 1.6, sd * 0.36], [2.62, 1.66, sd * 0.32]], [0.09, 0.07, 0], 4, () => ivory); }
      legs(parts, [[1.0, -0.5, 2], [-1.0, 0.5, 2], [1.0, 0.5, 3], [-1.0, -0.5, 3]], 1.4, 1.4, 0.34, 0.3, () => gry);
      return parts; } },
    ostrich: { len: 1.2, walk: 1.2, run: 9, alert: 80, flee: 40, graze: 1.4, build() {
      const bk = [0.1, 0.09, 0.09], pink = [0.78, 0.6, 0.55], b = new GB(), h = new GB(), parts = [[b, 0, 0, 0], [h, 1, 0.3, 1.38]];
      egg(b, [0, 1.25], [0.5, 0.34, 0.32], 0.1, 7, 5, (u) => (u < -0.75 ? WHT : bk));
      for (const sd of [-1, 1]) egg(b, [-0.05, 1.28, sd * 0.3], [0.32, 0.1, 0.05], -0.2, 5, 3, (u) => (u < -0.4 ? WHT : bk));
      tube(h, [[0.3, 1.38, 0], [0.38, 1.7, 0], [0.4, 2.0, 0], [0.42, 2.12, 0]], [0.08, 0.05, 0.04, 0.04], 4, () => pink);
      egg(h, [0.47, 2.15], [0.09, 0.055, 0.05], -0.1, 5, 3, (u) => (u > 0.6 ? [0.8, 0.62, 0.45] : pink));
      for (const [z, k] of [[-0.13, 2], [0.13, 3]]) { const g = new GB(); tube(g, [[0.02, 1.0, z], [0.06, 0.5, z], [0.04, 0.05, z]], [0.08, 0.04, 0.035], 4, () => pink); tube(g, [[0.04, 0.05, z], [0.18, 0.03, z]], [0.04, 0.02], 3, () => pink); parts.push([g, k, 0.02, 1.0]); }
      return parts; } },
    crane: { len: 0.8, walk: 0.6, run: 3, alert: 50, flee: 24, graze: 1.0, build() {
      const gr = [0.5, 0.5, 0.52], b = new GB(), h = new GB(), parts = [[b, 0, 0, 0], [h, 1, 0.18, 0.8]];
      egg(b, [0, 0.74], [0.3, 0.16, 0.15], 0.15, 6, 4, (u, v) => (u < -0.3 && v > 0 ? [0.82, 0.8, 0.74] : gr));
      tube(h, [[0.18, 0.8, 0], [0.24, 0.95, 0], [0.3, 1.06, 0]], [0.04, 0.03, 0.03], 4, () => gr);
      egg(h, [0.34, 1.08], [0.06, 0.05, 0.04], -0.2, 5, 3, (u, v, w) => (Math.abs(w) > 0.5 && u > -0.2 ? WHT : BLK));
      tube(h, [[0.39, 1.06, 0], [0.47, 1.04, 0]], [0.012, 0], 3, () => [0.2, 0.2, 0.2]);
      ico(h, 0.31, 1.13, 0, 0.06, 1.1, [0.86, 0.72, 0.36], rng(3), 0.3);   // (the golden crown)
      for (const [z, k] of [[-0.06, 2], [0.06, 3]]) { const g = new GB(); tube(g, [[0, 0.64, z], [0.01, 0.3, z], [0, 0.02, z]], [0.018, 0.012, 0.01], 3, () => BLK); parts.push([g, k, 0, 0.64]); }
      return parts; } }
  };
  function ngLion(male) {
    const tawny = [0.72, 0.56, 0.36], pale = [0.84, 0.74, 0.58], mane = [0.36, 0.25, 0.15], b = new GB(), h = new GB(), parts = [[b, 0, 0, 0], [h, 1, 0.6, 0.86]];
    egg(b, [0, 0.76], [0.74, 0.27, 0.24], 0, 7, 5, (u, v) => (v < -0.6 ? pale : tawny));
    tube(b, [[-0.72, 0.8, 0], [-0.98, 0.6, 0], [-1.12, 0.35, 0], [-1.16, 0.22, 0]], [0.04, 0.035, 0.03, 0.06], 3, (k) => (k === 3 ? [0.15, 0.11, 0.08] : tawny));   // (the tail's black tuft)
    tube(h, [[0.58, 0.84, 0], [0.76, 0.88, 0]], [0.19, 0.16], 5, () => tawny);
    egg(h, [0.9, 0.88], [0.22, 0.17, 0.16], -0.15, 6, 4, (u) => (u > 0.65 ? [0.86, 0.76, 0.62] : tawny));
    for (const sd of [-1, 1]) egg(h, [0.8, 1.04, sd * 0.1], [0.04, 0.05, 0.02], 0, 4, 2, () => tawny);
    if (male) egg(h, [0.7, 0.92], [0.3, 0.36, 0.33], 0.2, 7, 4, (u, v) => mix(mane, [0.5, 0.36, 0.2], v * 0.5 + 0.5));   // (the dark mane)
    legs(parts, [[0.48, -0.15, 2], [-0.48, 0.15, 2], [0.48, 0.15, 3], [-0.48, -0.15, 3]], 0.56, 0.56, 0.08, 0.055, () => tawny);
    return parts;
  }
  const NG_VS = 'attribute vec3 aPart;\nattribute vec4 aPose;\n' +
    'vec3 ngR(vec3 p, vec2 o, float yw, float pt) { p.xy -= o; float c = cos(yw), s = sin(yw); p.xz = vec2(c * p.x + s * p.z, c * p.z - s * p.x); c = cos(pt); s = sin(pt); p.xy = vec2(c * p.x - s * p.y, s * p.x + c * p.y); p.xy += o; return p; }\n' +
    'vec3 ngPose(vec3 p, float q) { float k = aPart.x; if (k < 0.5) return p;\n' +
    '  if (k > 1.5) { if (q > 0.5) p.y = aPart.z + (p.y - aPart.z) * (1.0 - aPose.w); return ngR(p, aPart.yz * q, 0.0, k < 2.5 ? aPose.z : -aPose.z); }\n' +
    '  return ngR(p, aPart.yz * q, aPose.x, aPose.y); }\n';
  function ngMesh(root, parts, cap, name) {   // [[GB, part, joint x, joint y]] -> the instanced mesh (cap instances; count and visibility set by ngLifeStep), its shadow posed the same way
    let nv = 0; for (const [g] of parts) nv += g.P.length / 3;
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), C = new Float32Array(nv * 3), J = new Float32Array(nv * 3); let o = 0;
    for (const [g, k, jx, jy] of parts) { P.set(g.P, o * 3); N.set(g.N, o * 3); C.set(g.C, o * 3); const n = g.P.length / 3; for (let q = o; q < o + n; q++) { J[q * 3] = k; J[q * 3 + 1] = jx; J[q * 3 + 2] = jy; } o += n; }
    const G = new THREE.BufferGeometry(), ap = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4); ap.setUsage(THREE.DynamicDrawUsage);
    G.setAttribute('position', new THREE.BufferAttribute(P, 3)); G.setAttribute('normal', new THREE.BufferAttribute(N, 3)); G.setAttribute('color', new THREE.BufferAttribute(C, 3)); G.setAttribute('aPart', new THREE.BufferAttribute(J, 3)); G.setAttribute('aPose', ap); G.computeBoundingSphere();
    const hook = (m, key) => { m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + NG_VS)
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n\tobjectNormal = ngPose(objectNormal, 0.0);').replace('#include <begin_vertex>', 'vec3 transformed = ngPose(vec3(position), 1.0);'); }; m.customProgramCacheKey = () => key; return m; };
    const mat = hook(new THREE.MeshLambertMaterial({ vertexColors: true }), 'ngLife'), dm = hook(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), 'ngLifeD');
    mat.addEventListener('dispose', () => dm.dispose());   // (the world's teardown frees the mesh's own material only)
    const im = new THREE.InstancedMesh(G, mat, cap); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.customDepthMaterial = dm;
    im.count = 0; im.visible = false; im.frustumCulled = false; im.matrixAutoUpdate = false; im.castShadow = im.receiveShadow = true; im.name = name; root.add(im); return im;
  }
  /* where the animals are (s: metres from the start line, the nearest spot that suits them within 60 m, else 150 m; e: how far beyond the
     barrier; kind: graze, cross (a herd that crosses the road), lie (lions resting by the road, the first one the male)): buffalo on the wall,
     a lone elephant bull where it eases, zebras crossing above the shoulder, then on the floor the wildebeest, zebras, a herd of wildebeest crossing, a warthog family,
     Thomson's gazelles, a pair of ostriches, two hyenas, a pride of lions in the grass by the road, crowned cranes by the stream; zebras past
     the finish */
  const NG_GROUPS = [
    ['buffalo', 3, 5, 560, 12, 36, 'graze'], ['elephant', 1, 1, 1160, 12, 30, 'graze'], ['zebra', 5, 8, 1290, 6, 16, 'cross'], ['buffalo', 2, 2, 1640, 12, 30, 'graze'],
    ['gnu', 12, 18, 1980, 10, 40, 'graze'], ['zebra', 6, 9, 2150, 10, 30, 'graze'], ['gnu', 8, 12, 2340, 6, 16, 'cross'], ['warthog', 3, 4, 2440, 6, 16, 'graze'],
    ['gazelle', 8, 12, 2560, 10, 30, 'graze'], ['ostrich', 2, 2, 2660, 18, 40, 'graze'], ['hyena', 2, 2, 2730, 8, 22, 'graze'], ['lion', 3, 4, 2830, 5, 12, 'lie'],
    ['crane', 2, 2, 2910, 10, 30, 'graze'], ['zebra', 6, 8, 3060, 10, 30, 'graze']
  ];
  function ngLife(K) {
    const { root, excluded, onSide, sStart } = K, R = rng(7411), w = T.w, gy = caGround, out = K.out;
    const roadOk = (x, z, m) => { const n = vrNear(x, z); return n.i < 0 || n.dd > m; };   // (beyond the barrier by m)
    const A = [], groups = [], used = [], cnt = {};
    const okAt = (x, z, slMax, m) => roadOk(x, z, m) && !excluded(x, z) && caSlope(x, z) < slMax;
    for (const [sp, n0, n1, s0, e0, e1, kind] of NG_GROUPS) {
      const S = NG_SP[sp], sc0 = sStart + s0; if (sc0 > T.len - 30) continue;
      const slMax = sp === 'buffalo' || sp === 'elephant' ? 0.7 : kind === 'lie' ? 0.32 : 0.55;
      const big = sp === 'buffalo' || sp === 'elephant', dhMax = kind === 'graze' ? (big ? 22 : 14) : 3;
      let best = null;
      for (const reach of [60, 150]) {   // (within 60 m of its place; none there: within 150 m)
        for (let s = Math.max(10, sc0 - reach); s <= Math.min(T.len - 20, sc0 + reach); s += 6) for (const side of [-1, 1]) for (let e = e0; e <= e1; e += Math.max(2, (e1 - e0) / 4)) {
          const [x, z, i] = onSide(s, side, e); if (!okAt(x, z, slMax, Math.min(8, e0 * 0.6)) || used.some(u => Math.hypot(u[0] - x, u[1] - z) < 45)) continue;
          const dh = gy(x, z) - T.hy[i]; if (Math.abs(dh) > dhMax) continue;
          let sc = -caSlope(x, z) * 3 - Math.abs(s - sc0) * 0.01 - Math.abs(dh) * 0.08 - e * 0.01;
          if (kind === 'cross') { const [x2, z2] = onSide(s, -side, e), dh2 = gy(x2, z2) - T.hy[i]; if (!okAt(x2, z2, slMax, e0 * 0.6) || Math.abs(dh2) > 3) continue;
            if (T.corners.some(c => c.sev >= 3 && s > c.i0 * T.ds - 40 && s < c.i1 * T.ds + 20)) continue; sc -= caSlope(x2, z2) * 3 + Math.abs(dh2) * 0.08; }   // (not in a hairpin-sharp bend: the cars see them coming)
          if (sp === 'crane') sc -= Math.min(60, segD(ST, x, z)) * 0.05;
          if (!best || sc > best.sc) best = { x, z, i, s, side, e, sc };
        }
        if (best) break;
      }
      if (!best) continue;
      used.push([best.x, best.z]);
      const n = n0 + Math.floor(R() * (n1 - n0 + 1)), i = best.i, tx = T.tx[i], tz = T.tz[i], ox = T.nx[i] * best.side, oz = T.nz[i] * best.side, rr = Math.max(4, S.len * Math.sqrt(n) * 1.6);
      const gr = { x: best.x, z: best.z, i, s: best.s, side: best.side, ox, oz, kind, a0: A.length, a1: 0, on: false, cs: 0, ct: 0, t0: 0 };
      for (let k = 0, tries = 0; k < n && tries < 120; tries++) {
        const spk = sp === 'lion' && k === 0 ? 'lionM' : sp, S2 = NG_SP[spk], u = (R() - 0.5) * 2 * rr, v = (R() - 0.5) * rr * (kind === 'graze' ? 0.8 : 0.5);
        let x = best.x + tx * u + ox * v, z = best.z + tz * u + oz * v;
        if (!okAt(x, z, slMax + 0.1, kind === 'lie' ? 2.5 : 1.5) || A.slice(gr.a0).some(a => Math.hypot(a.x - x, a.z - z) < (S2.len + a.len) * 0.6)) continue;
        let bx = 0, bz = 0;
        if (kind === 'cross') {   // (the spot across the road it goes to: the same distance out on the other side)
          const nn = vrNear(x, z); if (nn.i < 0) continue; const j = nn.i, lat = nn.lat, own = lat > 0 ? T.br[j] : T.bl[j], oth = lat > 0 ? T.bl[j] : T.br[j], ex = Math.abs(lat) - own, tl = -Math.sign(lat) * (oth + Math.max(2, ex));
          bx = x + T.nx[j] * (tl - lat); bz = z + T.nz[j] * (tl - lat);
          if (ex > 30 || !okAt(bx, bz, slMax + 0.1, 1.5)) continue; }
        const young = kind !== 'lie' && sp !== 'elephant' && R() < 0.15, sc = (young ? 0.62 : 0.92 + R() * 0.16), y = gy(x, z);
        const h0 = kind === 'cross' ? Math.atan2(bz - z, bx - x) + (R() - 0.5) * 0.6 : kind === 'lie' ? Math.atan2(-oz, -ox) + (R() - 0.5) * 2 : R() * TAU;
        A.push({ sp: spk, g: gr, len: S2.len * sc, x, y, z, h: h0, sc, hx: x, hz: z, hh: h0, bx, bz, st: kind === 'lie' ? 5 : 0, tS: 0, tn: R() * 6, hy: 0, hp: 0, ty: 0, sw: 0, ph: R() * TAU, tx: x, tz: z, spd: 0, fold: kind === 'lie' ? 0.82 : 0, dl: 0, pit: 0 });
        cnt[spk] = (cnt[spk] || 0) + 1; k++;
      }
      gr.a1 = A.length; if (gr.a1 > gr.a0) groups.push(gr);
    }
    const meshes = {}; for (const sp in cnt) meshes[sp] = ngMesh(root, NG_SP[sp].build(), cnt[sp], 'ng_' + sp);
    const L = { t: 0, r: rng(7419), A, groups, meshes, n: {}, carS: [], list: [], crossings: 0, fled: 0, hurried: 0 };   // (crossings, fled, hurried: counted for the tests)
    return { animals: A.length, groups: groups.length, species: Object.keys(cnt).length, crossers: groups.filter(g => g.kind === 'cross').length, L };
  }
  const _ngW = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  function ngPut(im, k, x, y, z, h, p, s, a, b, c, d) {   // instance k: at (x, y, z) facing h (model +x), pitched p (nose up), scaled s, pose (a, b, c, d)
    const E = im.instanceMatrix.array, Q = im.geometry.attributes.aPose.array, o = k * 16, ch = Math.cos(h), sh = Math.sin(h), cp = Math.cos(p) * s, sp = Math.sin(p) * s;
    E[o] = ch * cp; E[o + 1] = sp; E[o + 2] = sh * cp; E[o + 3] = 0; E[o + 4] = -ch * sp; E[o + 5] = Math.cos(p) * s; E[o + 6] = -sh * sp; E[o + 7] = 0;
    E[o + 8] = -sh * s; E[o + 9] = 0; E[o + 10] = ch * s; E[o + 11] = 0; E[o + 12] = x; E[o + 13] = y; E[o + 14] = z; E[o + 15] = 1;
    Q[k * 4] = a; Q[k * 4 + 1] = b; Q[k * 4 + 2] = c; Q[k * 4 + 3] = d;
  }
  function ngFin(im, n) { im.count = n; im.visible = n > 0; if (!n) return;   // (only the first n are sent to the GPU)
    const A = im.instanceMatrix, B = im.geometry.attributes.aPose; A.updateRange.offset = B.updateRange.offset = 0; A.updateRange.count = n * 16; B.updateRange.count = n * 4; A.needsUpdate = B.needsUpdate = true; }
  /* every frame: the groups within 280 m of the followed car are posed and drawn (the others wait where they were left). Each animal grazes (the
     head down, chewing), now and then looks up or takes a few steps; a car within its alert radius: the head up, watching it; within its flight
     radius (any car, not only the followed one): it turns and runs off away from the road, stops, watches, and later walks back. The lions lie in
     the grass and only turn their heads. A crossing herd: when the followed car comes into view (110-330 m before the crossing) and no car is on
     the 150 m before it, they cross one after another at a walk; a car coming within 95 m of the crossing: no one else starts and those on the
     road hurry off it to the nearer side (a run: 9 m/s over at most 6 m), so no car ever meets one on the road */
  function ngLifeStep(L, t, car, race) {   // (race: its cars and its traffic; none: the followed car alone)
    const dt = clamp(t - L.t, 0, 0.1); L.t = t;
    const A = L.A, r = L.r, w = T.w, ez = (v, g, k) => v + (g - v) * Math.min(1, dt * k);
    if (!car) { for (const sp in L.meshes) { L.meshes[sp].geometry.attributes.aPose.array.fill(0); ngFin(L.meshes[sp], 0); } return; }   // (the world test: none drawn, their poses cleared: the fingerprint does not depend on the frames before it)
    const cx = car.x, cz = car.z, list = L.list; list.length = 0;
    if (race && race.cars) { for (const c of race.cars) list.push(c); if (race.tf) for (const v of race.tf.veh) list.push(v); }
    if (!list.length) list.push(car);
    const sOf = (c) => { const n = vrNear(c.x, c.z); return n.i >= 0 ? n.i * T.ds : -1e9; };
    let haveS = false; const carS = L.carS;
    const needS = () => { if (haveS) return; haveS = true; carS.length = 0; for (const c of list) carS.push(sOf(c)); };
    const carOn = (s0, a, b) => { needS(); for (let k = 0; k < carS.length; k++) if (carS[k] > s0 - a && carS[k] < s0 + b) return true; return false; };
    const cS = sOf(car);
    for (const sp in L.n) L.n[sp] = 0;
    for (const gr of L.groups) {
      const gdx = gr.x - cx, gdz = gr.z - cz;
      if (gdx * gdx + gdz * gdz > 78400) {   // (out of range: those on the road go to the nearer side, the herd waits)
        if (gr.on) { gr.on = false; for (let k = gr.a0; k < gr.a1; k++) { const a = A[k]; if (a.st >= 6) { const nb = Math.hypot(a.x - a.bx, a.z - a.bz) < Math.hypot(a.x - a.hx, a.z - a.hz); if (nb) { const tx = a.hx, tz = a.hz; a.hx = a.bx; a.hz = a.bz; a.bx = tx; a.bz = tz; } a.x = a.hx; a.z = a.hz; a.y = caGround(a.x, a.z); a.st = 0; } } gr.cs = 0; }
        continue; }
      gr.on = true;
      if (gr.kind === 'cross') {   // the crossing herd
        if (gr.cs === 0 && t > gr.ct && cS > gr.s - 330 && cS < gr.s - 110 && !carOn(gr.s, 150, 15)) {
          gr.cs = 1; gr.t0 = t; L.crossings++; let q = 0; for (let k = gr.a0; k < gr.a1; k++) { const a = A[k]; a.st = 6; a.dl = q++ * (0.6 + r() * 0.5); a.tS = 0; a.spd = NG_SP[a.sp].walk * (1.25 + r() * 0.2); a.tx = a.bx; a.tz = a.bz; } }
        if (gr.cs === 1) {
          const danger = carOn(gr.s, 95, 8); let busy = 0;
          for (let k = gr.a0; k < gr.a1; k++) { const a = A[k]; if (a.st !== 6 && a.st !== 7) continue;
            const n = vrNear(a.x, a.z), lat = n.i >= 0 ? n.lat : 99, onRoad = n.i >= 0 && n.d < w + 2.5, started = t - gr.t0 > a.dl;
            if (a.st === 6 && danger) {
              if (!started && !onRoad) { a.st = 0; a.tx = a.x; a.tz = a.z; continue; }   // (not yet started: it stays)
              if (onRoad || Math.abs(lat) < w + 4) { const back = Math.hypot(a.x - a.hx, a.z - a.hz) < Math.hypot(a.x - a.bx, a.z - a.bz); a.st = 7; L.hurried++; a.spd = Math.max(8, NG_SP[a.sp].run); a.tx = back ? a.hx : a.bx; a.tz = back ? a.hz : a.bz; a.back = back; }
            }
            busy++; }
          if (!busy) { gr.cs = 0; gr.ct = t + 25 + r() * 20; for (let k = gr.a0; k < gr.a1; k++) { const a = A[k]; if (Math.hypot(a.x - a.bx, a.z - a.bz) < Math.hypot(a.x - a.hx, a.z - a.hz)) { const tx = a.hx, tz = a.hz; a.hx = a.bx; a.hz = a.bz; a.bx = tx; a.bz = tz; } } }
        }
      }
      for (let k = gr.a0; k < gr.a1; k++) {
        const a = A[k], S = NG_SP[a.sp];
        let near = 1e9, ndx = 0, ndz = 0;   // the nearest car
        for (let q = 0; q < list.length; q++) { const c = list[q], dx = c.x - a.x, dz = c.z - a.z, d = dx * dx + dz * dz; if (d < near) { near = d; ndx = dx; ndz = dz; } }
        near = Math.sqrt(near);
        let gP = -S.graze + 0.07 * Math.sin(t * 4.5 + a.ph), gY = 0.2 * Math.sin(t * 0.4 + a.ph), mv = 0;
        a.tS += dt;
        if (a.st <= 3 && S.flee && near < S.flee) {   // flight: away from the road, a little away from the car too
          const cl = Math.hypot(ndx, ndz) || 1, n = vrNear(a.x, a.z), sg = n.i >= 0 ? Math.sign(n.lat) || 1 : 1, ox = n.i >= 0 ? T.nx[n.i] * sg : -ndx / cl, oz = n.i >= 0 ? T.nz[n.i] * sg : -ndz / cl;
          const fx = ox * 0.8 - ndx / cl * 0.45, fz = oz * 0.8 - ndz / cl * 0.45, fl = Math.hypot(fx, fz) || 1, D = 12 + r() * 14;
          a.st = 4; a.tS = 0; a.spd = S.run * (0.85 + r() * 0.3); a.tx = a.x + fx / fl * D; a.tz = a.z + fz / fl * D; L.fled++;
        }
        if (a.st === 0 || a.st === 1) {   // grazing; looking up
          if (near < S.alert) { a.st = 3; a.tS = 0; }
          else { a.tn -= dt; if (a.tn <= 0) { const q = r(); if (a.st === 1 || q < 0.45) { a.st = a.st === 1 ? 0 : 1; a.tn = a.st ? 1.5 + r() * 2.5 : 4 + r() * 8; a.ty = (r() - 0.5) * 1.6; }
              else { const an = a.h + (r() - 0.5) * 2, d = 1.5 + r() * 3.5, tx = a.x + Math.cos(an) * d, tz = a.z + Math.sin(an) * d;
                if (Math.hypot(tx - a.hx, tz - a.hz) < 9 && roadClear(tx, tz) && caSlope(tx, tz) < 0.7) { a.st = 2; a.tx = tx; a.tz = tz; a.spd = S.walk * (0.8 + r() * 0.3); } else a.tn = 2; } }
            if (a.st === 1) { gP = 0.05; gY = a.ty; } }
        }
        if (a.st === 2 || a.st === 4 || a.st === 6 || a.st === 7) {   // walking, running off, crossing, hurrying off the road
          const go = a.st !== 6 || t - a.g.t0 > a.dl;
          if (go) { const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz), e = _ngW(Math.atan2(dz, dx) - a.h);
            a.h += e * Math.min(1, dt * (a.st >= 4 ? 7 : 2.5));
            if (d < 0.25) { a.x = a.tx; a.z = a.tz; a.st = a.st === 2 ? 0 : 3; a.tS = 0; a.tn = 3 + r() * 5; }
            else if (Math.abs(e) < (a.st >= 4 ? 1.2 : 0.5)) { const st = Math.min(d, a.spd * dt), nx = a.x + Math.cos(a.h) * st, nz = a.z + Math.sin(a.h) * st;
              if (a.st >= 6 || roadClear(nx, nz)) { a.x = nx; a.z = nz; mv = a.spd; } else { a.st = 3; a.tS = 0; } }
            gP = a.st >= 4 ? 0.12 : -0.25; gY = 0; }
          else if (near < S.alert) { gP = 0.08; gY = clamp(_ngW(Math.atan2(ndz, ndx) - a.h), -1.2, 1.2); }
        }
        if (a.st === 3) {   // watching the car; back to grazing (and home, if it ran) once it has gone
          gP = 0.08; gY = clamp(_ngW(Math.atan2(ndz, ndx) - a.h), -1.2, 1.2);
          if (Math.abs(_ngW(Math.atan2(ndz, ndx) - a.h)) > 1.3 && near < S.alert) a.h += _ngW(Math.atan2(ndz, ndx) - a.h) * Math.min(1, dt * 0.8);
          if (near > S.alert * 1.2 && a.tS > 3) { const far = Math.hypot(a.x - a.hx, a.z - a.hz); if (far > 3) { a.st = 2; a.tx = a.hx; a.tz = a.hz; a.spd = S.walk; } else { a.st = 0; a.tn = 2 + r() * 4; } }
        }
        if (a.st === 5) {   // lying: the head up, turned to a car within 60 m
          gP = 0.05 + 0.04 * Math.sin(t * 0.3 + a.ph); gY = near < 60 ? clamp(_ngW(Math.atan2(ndz, ndx) - a.h), -1.3, 1.3) : 0.5 * Math.sin(t * 0.13 + a.ph);
        }
        // the legs: their swing with the speed (a walk, a trot, a gallop); the body pitched with the slope under it
        if (mv > 0) { a.ph += dt * mv / Math.max(0.4, a.len * 0.55) * PI * 0.5; a.sw = ez(a.sw, mv > 3 ? 0.65 : 0.32, 6); } else a.sw = ez(a.sw, 0, 5);
        if (mv > 0 || !a.y) { const hl = a.len * 0.42, c0 = Math.cos(a.h) * hl, s0 = Math.sin(a.h) * hl, yf = caGround(a.x + c0, a.z + s0), yb = caGround(a.x - c0, a.z - s0);
          let y = Math.min(yf, yb, caGround(a.x, a.z)); a.pit = Math.atan2(yf - yb, 2 * hl);
          if (a.st >= 6) { const n = vrNear(a.x, a.z); if (n.i >= 0 && n.d < w + 1.5) y = Math.max(y, n.hn + 0.03); }   // (on the road: on its surface)
          a.y = y; }
        a.hp = ez(a.hp, gP, 2.6); a.hy = ez(a.hy, gY, 2.8);
        const hop = mv > 3 ? Math.abs(Math.sin(a.ph * 2)) * 0.06 * a.len : 0;
        const im = L.meshes[a.sp], n = L.n[a.sp] || 0; L.n[a.sp] = n + 1;
        ngPut(im, n, a.x, a.y - a.fold * 0.55 * a.sc * (a.sp === 'elephant' ? 2.5 : 1) + hop, a.z, a.h, a.pit * 0.8, a.sc, a.hy, a.hp, a.sw * Math.sin(a.ph), a.fold);
      }
    }
    for (const sp in L.meshes) ngFin(L.meshes[sp], L.n[sp] || 0);
    function roadClear(x, z) { const n = vrNear(x, z); return n.i < 0 || n.dd > 1.2; }
  }

  // the knockable roadside posts: white with a red top
  function ngProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }

  function buildNgorongoro(scene, tex, opts) {
    const R = rng(6211), N = T.N, w = T.w, dens = opts.density || 1, def = T.def;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.58, 0.44, 0.32] };
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS;
    P.c1 = valueNoise2(931, 150); P.c2 = valueNoise2(932, 64); P.c3 = valueNoise2(933, 90); P.c4 = valueNoise2(934, 120); P.c5 = valueNoise2(935, 26);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    PA = segHash([...(def.paths || []), ...(def.steps || [])], 16, 2); ST = segHash(def.streams || [], 24, 10); DU = [];
    // the level plots: the lay-by at Windy Gap (def.parks: beside the rim road before the start; its middle, a level dusty plot at the ground's
    // height there), the cars' park past the finish
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 14, h: T.hy[i] - 0.25, sd, i }; };
    let lay = null;
    { const p = (def.parks || [])[0];
      if (p) { let x = 0, z = 0; const n = p.length / 2 - 1; for (let k = 0; k < n; k++) { x += p[2 * k]; z += p[2 * k + 1]; } x /= n; z /= n;
        const nn = vrNear(x, z), i = nn.i >= 0 ? nn.i : 0, gap = nn.i >= 0 ? nn.d - (nn.lat > 0 ? T.br[i] : T.bl[i]) : 99;
        if (gap > 14) { lay = { x, z, r: 12, b: 10, h: vrFar(x, z) - 0.1, i, sd: nn.lat > 0 ? 1 : -1 }; }
        else { const sd = nn.lat > 0 ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + 13; lay = { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r: 12, b: 10, h: T.hy[i] - 0.15, i, sd }; }
        P.pads.push(lay); DU.push([lay.x, lay.z, lay.r + 4]); } }
    const padF = padBeside(sFin + 60, 12); P.pads.push(padF); DU.push([padF.x, padF.z, padF.r + 3]);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (crowds, plots, signs, buildings) for the plants, the rocks and the animals, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    if (lay) exclPush(lay.x, lay.z, lay.r + 4);
    exclPush(padF.x, padF.z, padF.r + 4);
    out.marks = {}; if (lay) out.marks.view = [lay.x, lay.z];   // (where the landmarks stand: the tests look for them)

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat();
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(ngTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the road: the setts (no lines on them), darker where the wheels polish them, a row of bigger stones along each edge, then the verge out
       to a ditch past the barrier line; where the ground falls far below, the dry-stone wall that holds the road (its face out over the drop); the
       rim road before the start the red-brown murram, ruts in it (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const setT = ngSettTex(), aMat = new THREE.MeshLambertMaterial({ map: setT, vertexColors: true }); aMat.userData.wear = true; out.asphaltMat = aMat;   // (wear: the rain darkens it as a road)
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.45, iSet = T.idx(sStart - 2);
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 2.4, kerbL = 3.8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.94 - 0.07 * Math.exp(-((o - rl - 0.9) * (o - rl - 0.9)) / 0.6) - 0.07 * Math.exp(-((o - rl + 0.9) * (o - rl + 0.9)) / 0.6); if (Math.abs(o) > w * 0.86) k -= 0.04;
        k *= 0.95 + 0.1 * P.n2(T.px[i] * 0.5 + o, T.pz[i] * 0.5); return [k, k, k * 1.02]; };
      const mur = (i, o) => { const rl = T.rl[i], k = (0.92 + 0.12 * P.n2(T.px[i] * 0.3 + o * 0.7, T.pz[i] * 0.3)) * (1 - 0.1 * Math.exp(-((o - rl - 0.9) ** 2) / 0.4) - 0.1 * Math.exp(-((o - rl + 0.9) ** 2) / 0.4)); return [0.62 * k, 0.47 * k, 0.35 * k]; };   // (the murram, the ruts darker)
      const kc = [1.1, 1.07, 1.03], wallC = [0.42, 0.39, 0.35], copeC = [0.55, 0.52, 0.47];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) {
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          const wl = vp[si][i][2][1] < -2.6; if (wl && (k === 1 || k === 2)) { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si); return k === 1 ? [copeC[0] * q, copeC[1] * q, copeC[2] * q] : [wallC[0] * 0.85 * q, wallC[1] * 0.85 * q, wallC[2] * 0.85 * q]; }
          if (k === 4) return ngGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return ngCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - w - sw - 0.4)).slice(); })); } return a; });   // (the dust by the edge stones; grass out to the barrier)
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gm = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / kerbL, s1 = j * T.ds / kerbL, set = i >= iSet;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1], a = Pt(i, o0, 0.02), b = Pt(i, o1, 0.02), cc = Pt(j, o1, 0.02), d = Pt(j, o0, 0.02);
            if (set) gr.quadUp(a, b, cc, d, [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]);
            else gm.quadUp(a, b, cc, d, [mur(i, o0), mur(i, o1), mur(j, o1), mur(j, o0)], [wuv(a), wuv(b), wuv(cc), wuv(d)]); }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            if (set) gr.quadUp(Pt(i, side * w, 0.03), Pt(i, side * (w + sw), 0.0), Pt(j, side * (w + sw), 0.0), Pt(j, side * w, 0.03), [kc, kc, kc, kc], [[0, s0], [sw / kerbL, s0], [sw / kerbL, s1], [0, s1]]);   // (the edge: the same stones, bigger)
            else { const a = Pt(i, side * w, 0.02), b = Pt(i, side * (w + sw), 0.0), cc = Pt(j, side * (w + sw), 0.0), d = Pt(j, side * w, 0.02), m0 = mur(i, side * w), m1 = mur(j, side * w); gm.quadUp(a, b, cc, d, [m0, m0, m1, m1], [wuv(a), wuv(b), wuv(cc), wuv(d)]); }
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6)) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face: out, over the drop)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        addM(gr, aMat); addM(gm, gMat); addM(gv, gMat);
      }
      const gq = new GB(true), gw2 = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wht = [0.94, 0.93, 0.88];   // chequered start and finish lines, a white line at each checkpoint
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw2.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw2, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.84, 0.16, 0.14], [0.95, 0.95, 0.94], [0.12, 0.46, 0.3], [0.97, 0.82, 0.1], [0.12, 0.26, 0.56], [0.62, 0.56, 0.42], [0.5, 0.32, 0.2], [0.12, 0.14, 0.2], [0.74, 0.18, 0.2], [0.46, 0.66, 0.86]];
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a place board of the second atlas: [v0, v1, u0, u1]
    const signAt = (s, side, k, o) => { const [bx, bz, bi] = onSide(s, side, o || 1.4); if (excluded(bx, bz)) return;   // a place board on a post, facing the cars
      const by = caGround(bx, bz), [v0, v1, u0, u1] = board(k); box(scen.get(bx, bz), bx, by - 0.2, bz, 0.1, 2.6, 0.1, T.hd[bi], [0.6, 0.61, 0.63]); bannerQ(bx, by + 1.7, bz, -T.tx[bi], -T.tz[bi], 3.2, 0.8, v0, v1, u0, u1, ban2); exclPush(bx, bz, 2); };
    const warnAt = (s, side) => { const [bx, bz, bi] = onSide(s, side, 1.2); if (excluded(bx, bz)) return;   // the animals' warning: a triangle on a post
      const by = caGround(bx, bz); box(scen.get(bx, bz), bx, by - 0.2, bz, 0.09, 2.3, 0.09, T.hd[bi], [0.6, 0.61, 0.63]); bannerQ(bx, by + 1.35, bz, -T.tx[bi], -T.tz[bi], 0.95, 0.95, 1 - 4 / 8, 1 - 3 / 8, 2 / 8, 3 / 8, ban2); exclPush(bx, bz, 1.6); };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, o) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), Object.assign({ col: fans[Math.floor(R() * fans.length)] }, o), 1);
    const safCols = [[0.78, 0.72, 0.56], [0.42, 0.44, 0.3], [0.9, 0.89, 0.85], [0.62, 0.58, 0.44], [0.3, 0.36, 0.26]];
    const clearOf = (x, z, r) => { const n = vrNear(x, z); if (n.i < 0) return [x, z]; const i = n.i, sg = Math.sign(n.lat) || 1, need = (sg > 0 ? T.br[i] : T.bl[i]) + r + 1; if (n.d >= need) return [x, z]; return [x + T.nx[i] * sg * (need - n.d), z + T.nz[i] * sg * (need - n.d)]; };   // (a building the map puts on the game's wider road: moved out beside it)
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- MWANZO (the start, where the descent road leaves the rim road): gantry with the start lights, the timing hut, the road closed behind ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 6, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut: whitewashed, a green iron roof
      box(gh, hx, hy - 0.4, hz, 4.0, 3.1, 2.8, T.hd[i], [0.9, 0.88, 0.82], [0.3, 0.42, 0.32]); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.26, 0.3], null, true);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
      signAt(sStart + 40, -1, 3);   // NJIA MOJA (one way)
      signAt(sStart - 70, 1, 5);   // KARATU (behind, for the cars on the rim road)
    }

    /* ---- the checkpoints: a green gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.12, 0.4, 0.22]));

    /* ---- MWISHO (on the crater's floor): chequered gantry, the board, the cars' park with safari vehicles, people about; the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 18, sdP, 3.2), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the board: on posts, leaning back
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.36, 0.3, 0.24]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.36, 0.3, 0.24]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.44, 0.38, 0.32], [0.52, 0.46, 0.38]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 5);
      signAt(sFin + 110, -sdP, 7);   // MAGADI ahead
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 6; k++) { const a = -10 + (k % 3) * 7, b = (k < 3 ? -4.2 : 4.2) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || k === 4) continue;
        ngSafari(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2 + (R() - 0.5) * 0.1, vary(safCols[k % safCols.length], R, 0.1)); }
      for (let k = 0; k < 7; k++) { const px = padF.x + (R() - 0.5) * 20, pz = padF.z + (R() - 0.5) * 20; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      out.marks.finish = [padF.x, padF.z];
    }

    /* ---- the ranger post (def.gates, def.bld, def.fences): the barrier's boom raised beside the road (red and white), the rangers' huts of stone
       with green iron roofs, the toilets' block, the post-and-wire fence (not across the road), two rangers; SENETO on a board ---- */
    let nBld = 0;
    {
      const gh = new GB(), wallC = [0.66, 0.6, 0.52], roofC = [0.28, 0.42, 0.3], RB = rng(6221);
      for (const [x0, z0, L0, W0, ang, kind] of def.bld || []) {
        const L = Math.max(4, L0), W = Math.max(3.4, W0), [x, z] = clearOf(x0, z0, Math.hypot(L, W) / 2); let lo = 1e9; const c = Math.cos(ang), s = Math.sin(ang);
        for (const [u, v] of [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2], [0, 0]]) lo = Math.min(lo, caGround(x + c * u - s * v, z + s * u + c * v));
        const col = vary(kind ? [0.86, 0.84, 0.78] : wallC, RB, 0.05);
        box(gh, x, lo - 1.0, z, L, 3.6, W, -ang, col, col); box(gh, x, lo + 2.6, z, L + 0.5, 0.18, W + 0.5, -ang, roofC, roofC);
        exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.block(x, z, L + 1, W + 1, -ang); nBld++;
      }
      addM(gh, lMat);
      for (const [gx, gz] of def.gates || []) {
        const n = vrNear(gx, gz); if (n.i < 0) continue; const i = n.i, side = 1, bar = T.br[i], px = T.px[i] + T.nx[i] * (bar + 0.6), pz = T.pz[i] + T.nz[i] * (bar + 0.6), py = caGround(px, pz), g = scen.get(px, pz);
        box(g, px, py - 0.2, pz, 0.4, 1.2, 0.4, T.hd[i], [0.86, 0.85, 0.8]);   // (the post with the boom's pivot)
        for (let k = 0; k < 6; k++) { const f = (k + 0.5) / 6, L = 7.6, ang = 1.25, u = -f * L * Math.cos(ang), y = py + 1.0 + f * L * Math.sin(ang), bx = px - T.nx[i] * side * u * 0 + T.tx[i] * u, bz = pz + T.tz[i] * u;
          box(g, bx, y - 0.08, bz, L / 6 * 0.98, 0.16, 0.16, T.hd[i] + PI / 2, k % 2 ? [0.86, 0.14, 0.12] : [0.95, 0.95, 0.93]); }   // (the boom, raised: red and white bands)
        exclPush(px, pz, 3); CR.avoid(px, pz, 1.2);
        for (let k = 0; k < 2; k++) { const [qx, qz] = onSide(i * T.ds + 6 + k * 3, -1, 1.6 + k); person(qx, qz, Math.atan2(T.nx[i], -T.nz[i]) + PI, { col: [0.36, 0.4, 0.26], staff: true }); }   // (two rangers in olive green)
        signAt(i * T.ds - 30, 1, 1);   // SENETO
      }
      for (const p of def.fences || []) { const g = new GB();   // (a post every 3 m, two wires; not on the road)
        for (let k = 0; k + 3 < p.length; k += 2) { const ax = p[k], az = p[k + 1], bx = p[k + 2], bz = p[k + 3], L = Math.hypot(bx - ax, bz - az), an = Math.atan2(bz - az, bx - ax);
          for (let t = 0; t < L; t += 3) { const x = ax + (bx - ax) * t / L, z = az + (bz - az) * t / L; if (!(vrNear(x, z).dd > 0.8)) continue; const y = caGround(x, z);
            box(g, x, y - 0.2, z, 0.1, 1.5, 0.1, -an, [0.42, 0.34, 0.24]); const x2 = x + Math.cos(an) * 1.5, z2 = z + Math.sin(an) * 1.5; if (vrNear(x2, z2).dd > 0.8) for (const hy of [0.6, 1.05]) box(g, x2, caGround(x2, z2) + hy, z2, 3, 0.03, 0.03, -an, [0.3, 0.3, 0.3]); } }
        if (!g.empty) addM(g, lMat); }
    }

    /* ---- the lay-by at Windy Gap (beside the rim road before the start, looking over the crater): a level dusty plot, safari vehicles parked
       facing the view, people at its edge looking out, the viewpoint's board with the crater's picture, WINDY GAP ---- */
    if (lay) {
      const out_ = [lay.x - T.px[lay.i], lay.z - T.pz[lay.i]], ol = Math.hypot(out_[0], out_[1]) || 1, fx = out_[0] / ol, fz = out_[1] / ol, ux = -fz, uz = fx, hd = Math.atan2(fz, fx), y = lay.h + 0.1;
      for (let k = 0; k < 4; k++) { const u = (k - 1.5) * 3.4, px = lay.x + ux * u - fx * 2, pz = lay.z + uz * u - fz * 2; if (vrNear(px, pz).dd < 1.5) continue;
        ngSafari(scen.get(px, pz), px, y, pz, hd + (R() - 0.5) * 0.15, vary(safCols[(k + 1) % safCols.length], R, 0.1)); }
      for (let k = 0; k < 6; k++) { const u = (R() - 0.5) * 16, px = lay.x + ux * u + fx * (7 + R() * 3), pz = lay.z + uz * u + fz * (7 + R() * 3); person(px, pz, Math.atan2(-fx, fz) + PI + (R() - 0.5), { col: fans[[5, 1, 6, 2, 9, 7][k]] }); }
      CR.block(lay.x, lay.z, 2 * lay.r, 2 * lay.r, 0);
      const g = scen.get(lay.x, lay.z), bx = lay.x + fx * (lay.r - 1), bz = lay.z + fz * (lay.r - 1);
      for (const o of [-0.75, 0.75]) box(g, bx + ux * o, y - 0.3, bz + uz * o, 0.1, 1.9, 0.1, -hd, [0.36, 0.26, 0.16]);
      bannerQ(bx, y + 0.65, bz, -fx, -fz, 1.8, 0.9, 1 - 4 / 8, 1 - 3 / 8, 4 / 8, 6 / 8, ban2, -0.15);
      signAt(lay.i * T.ds - 40, lay.sd, 0);   // WINDY GAP
    }

    /* ---- the bomas on the slopes outside the crater (def.huts: round huts of mud and dung, a low conical roof of thatch; generic), only where
       the terrain is drawn under them (one mesh) ---- */
    {
      const gb = new GB(), G = P.G, Lt = VRC * VRT, RB = rng(6231), wall = [0.5, 0.39, 0.29], roof = [0.52, 0.45, 0.32];
      for (const [x, z, sz] of def.huts || []) {
        const ti = Math.floor((x - G.x0) / Lt), tj = Math.floor((z - G.z0) / Lt); if (ti < 0 || tj < 0 || ti >= G.ntx || tj >= G.ntz || !caTileOn(ti, tj)) continue;
        const r = clamp(sz / 2, 1.6, 3.2), y = caGround(x, z);
        cyl(gb, x, y - 0.5, z, r, 2.2, 8, vary(wall, RB, 0.06)); cyl(gb, x, y + 1.6, z, r + 0.35, 1.3, 8, vary(roof, RB, 0.06), null, 0.05);
        exclPush(x, z, r + 1.5); nBld++;
      }
      addM(gb, lMat);
    }

    /* ---- the low dry-stone walls where the ground falls away and round the outside of the hairpin, a marker post every ~50 m where there is none
       (knockable where it fits: ngProps); chevrons on the outside of the hairpin; the boards ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)], hp = new Uint8Array(N);
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) { need[sd][k] = 1; hp[k] = 1; } }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), white = [0.9, 0.89, 0.85], stone = [0.44, 0.4, 0.35], back = [0.36, 0.33, 0.3];
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.15 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          if (nd[i] && nd[i + 1]) {
            const g = scen.get(T.px[i], T.pz[i]), blk = Math.floor(i * T.ds / 2), q = 0.9 + 0.16 * rpHash(blk, 83 + si), fc = [stone[0] * q, stone[1] * q, stone[2] * q];
            const tc = hp[i] && blk % 2 ? white : [stone[0] * q * 1.15, stone[1] * q * 1.15, stone[2] * q * 1.15];
            const a = Q(i, -0.2), b = Q(i + 1, -0.2), c = Q(i + 1, 0.55), d = Q(i, 0.55);
            const a2 = Q(i, -0.6, 0.5), b2 = Q(i + 1, -0.6, 0.5), c2 = Q(i + 1, 0.55, 0.5), d2 = Q(i, 0.55, 0.5), inn = Q(i, 0.2, 0.25);
            g.quadO(a, b, c, d, fc, inn); g.quadO(a2, b2, c2, d2, back, inn); g.quadO(d, c, c2, d2, tc, inn);
          } else if (!nd[i] && i % 25 === 0 && i > 2 && i < iE - 2) mkPosts.push([i, side]);
        }
      }
      const kp = ngProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.76, 0.12, 0.1], null, true);
      }
      (def.curves || []).forEach(([d, , turn]) => {   // three chevrons on the outside of the hairpin, facing the cars
        const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 6 && sStart + d <= q.i1 * T.ds + 6); if (!c || c.sev < 2) return;
        const out_ = -turn, cell = turn > 0 ? 30 : 31, u0 = (cell % 8) / 8, v1 = 1 - Math.floor(cell / 8) / 8;
        for (const o of [-10, 0, 10]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.9); if (excluded(cx, cz)) continue;
          const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
          bannerQ(cx, Math.max(cy, T.hy[ci]) + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2); CR.avoid(cx, cz, 0.6); }
        signAt(sStart + d - 110, 1, 4);   // PUNGUZA MWENDO before it
      });
      signAt(sStart + 120, 1, 2);   // NGORONGORO
      for (const s of [700, 1700, 2350]) warnAt(sStart + s, R() < 0.5 ? 1 : -1);   // the animals' warning
      signAt(sStart + 1720, -1, 6);   // HATARI · WANYAMA
    }

    /* ---- spectators, few (fewFans): the start and the finish, the checkpoints ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.1, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.1, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 40, sStart + 30, sd, { rows: 1, dens: 0.4, label: 'NG start' }); run(sFin - 40, sFin + 14, sd, { rows: 1, dens: 0.4, label: 'NG finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 12, s0 + 10, side, { rows: 1, dens: 0.35, label: 'NG cp' }); });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants (instanced per 96 m chunk): on the grassy walls tufts of grass near the road, a shrub now and then, euphorbias on the steep
       and rocky ground, an umbrella acacia low down; in the shrubland the shrubs and euphorbias; the rim's trees where the map has trees; tufts
       by the streams; none on the bare rock ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 3, 4].map(k => new IChunks(ngTreeGeo(k), tMatT, 96));
    let nTrees = 0, nShrubs = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(50000 * dens), RT = rng(4841), SP = 4 / Math.sqrt(dens), base = P.D.base;
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(240)) continue;
          const c = vrLC(x, z), sd = segD(ST, x, z), p = c === 1 ? 0.35 : c === 2 ? 0.26 : c === 0 ? (sd < 8 ? 0.2 : 0.06) : c >= 5 ? 0.12 : c === 3 ? 0.03 : 0.006;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.4) continue; if (nn.i >= 0 && nn.dd < 6 && r2 < 0.3) continue;
          if (excluded(x, z) || segD(PA, x, z) < 1.2) continue;
          const sl = caSlope(x, z); if (sl > 1.25 || (sl > 0.7 && r2 < (sl - 0.7) / 0.55)) continue;
          const y = caGround(x, z), low = y + base < 1950;
          const sp = c === 1 ? (r3 < 0.75 ? 0 : r3 < 0.9 ? 3 : 1) : c === 2 ? (r3 < 0.6 ? 3 : r3 < 0.75 ? 2 : r3 < 0.85 && low ? 1 : 4)
            : c === 0 ? (r3 < 0.72 ? 4 : r3 < 0.86 ? 3 : sl > 0.45 ? 2 : low && r3 > 0.97 ? 1 : 4) : (r3 < 0.7 ? 4 : 3);
          if (sp === 4 && hd > LOD.radius(70)) continue;
          let hgt, wid, col;
          if (sp === 0) { hgt = 8 + r4 * 6; wid = hgt * 0.9; col = [0.95 + r2 * 0.1, 1, 0.95]; }
          else if (sp === 1) { hgt = 5 + r4 * 4; wid = hgt * 1.35; col = [0.94 + r2 * 0.12, 1, 0.94]; }
          else if (sp === 2) { hgt = 3.5 + r4 * 3; wid = hgt * 0.75; col = [0.95 + r2 * 0.1, 1, 0.95]; nShrubs++; }
          else if (sp === 3) { hgt = 1.0 + r4 * 1.3; wid = 1.0 + r2 * 1.3; col = [0.92 + r3 * 0.16, 0.95 + r4 * 0.1, 0.9]; nShrubs++; }
          else { hgt = 0.35 + r4 * 0.4; wid = 0.6 + r2 * 0.5; col = sd < 8 ? [0.8, 0.98, 0.8] : [0.92 + r3 * 0.18, 0.95 + r4 * 0.1, 0.9]; nShrubs++; }
          tk[sp].add(x, y - 0.1, z, r1 * 70, wid, hgt, col);
          if (++nTrees >= maxT) break grid;
        }
      }
      for (const [x, z] of def.trees || []) { if (excluded(x, z) || vrNear(x, z).dd < 3) continue; tk[1].add(x, caGround(x, z) - 0.1, z, 1.3, 9, 7, [1, 1, 0.95]); nTrees++; }   // (the map's lone tree: an old acacia)
    }
    tk.forEach((t, k) => t.addTo(root, LOD.tier > 0 ? k !== 4 : k < 2));   // (NIZKA: only the trees cast shadows)

    /* ---- the stones and the rock: grey-brown volcanic stones on the grass by the road, blocks at the foot of the cuts, crags where the wall rises
       steep beside the road and along the map's cliffs (def.cliffs) ---- */
    {
      const RW = rng(4851), dark = [[0.4, 0.37, 0.33], [0.44, 0.4, 0.35], [0.36, 0.34, 0.31], [0.48, 0.44, 0.38]], red = [[0.48, 0.37, 0.3], [0.44, 0.34, 0.28]];
      const rockC = () => (RW() < 0.85 ? dark[Math.floor(RW() * dark.length)] : red[Math.floor(RW() * 2)]);
      API.ROCK_SMOOTH = false;
      for (let s = 6; s < T.len - 6; s += 4.6) for (const side of [-1, 1]) {
        if (RW() > 0.34) continue; const o = 1.8 + Math.pow(RW(), 1.6) * 34, [x, z] = onSide(s, side, o), sz = 0.18 + RW() * 0.45;
        if (vrNear(x, z).dd < sz + 0.5 || excluded(x, z)) continue;
        rock(scen.get(x, z), x, caGround(x, z) + sz * 0.2, z, sz * 1.3, sz, sz, RW() * TAU, vary(rockC(), RW, 0.08), RW, 0.35);
      }
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {
        if (RW() > 0.3) continue;
        const o = 1.6 + Math.pow(RW(), 1.5) * 30, [x, z] = onSide(s, side, o), sz = 0.5 + RW() * 1.3; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RW() * TAU, vary(rockC(), RW, 0.1), RW, 0.3);
      }
      const crag = (x, z, n, rMax) => { const g = scen.get(x, z), b0 = vary(rockC(), RW, 0.06);
        for (let q = 0; q < n; q++) { const r0 = 1.1 + RW() * rMax, qx = x + (RW() - 0.5) * 10, qz = z + (RW() - 0.5) * 10, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1 || excluded(qx, qz)) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0, r0 * (0.9 + RW() * 0.9), r0 * (0.7 + RW() * 0.4), RW() * TAU, vary(b0, RW, 0.07), RW, 0.35); } };
      for (let s = 16; s < T.len - 16; s += 12) for (const side of [-1, 1]) {
        if (RW() < 0.62) continue;
        const [x, z] = onSide(s, side, 12 + RW() * 120); if (excluded(x, z) || vrNear(x, z).dd < 10 || vrDist(x, z) > LOD.cap(110)) continue;
        if (caSlope(x, z) < 1.0) continue;
        crag(x, z, 1 + Math.floor(RW() * 3), 2.6);
      }
      for (const p of def.cliffs || []) for (let k = 0; k + 3 < p.length; k += 2) {
        const ax = p[k], az = p[k + 1], bx = p[k + 2], bz = p[k + 3], L = Math.hypot(bx - ax, bz - az);
        for (let t = 0; t < L; t += 12) { const x = ax + (bx - ax) * t / L, z = az + (bz - az) * t / L; if (vrDist(x, z) > LOD.cap(130) || vrNear(x, z).dd < 8) continue; crag(x, z, 2, 2.4); }
      }
    }

    /* ---- the animals by the road (ngLife; out.dyn.ext poses them every frame) ---- */
    const life = ngLife({ root, excluded, onSide, sStart, out });

    /* ---- the view beyond the corridor (ngFar; World.update moves it with the camera); finish the meshes ---- */
    const FAR = ngFar(def); if (FAR) { FAR.mesh.visible = false; FAR.upd = ngFarUpdate; root.add(FAR.mesh); out.dyn.irFar = FAR; }   // (hidden until the first World.update; moved by its own ngFarUpdate)
    out.dyn.ext = (t, car, cam, race) => ngLifeStep(life.L, t, car, race);
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: ngAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: ngAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, shrubs: nShrubs, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), lay: !!lay, far: !!FAR,
      herds: FAR ? FAR.herds : 0, specks: FAR ? FAR.specks : 0, animals: life.animals, groups: life.groups, species: life.species, crossers: life.crossers };   // (read by the tests)
    out.life = life.L;   // (the animals' state: the tests drive it)
    return out;
  }

  World.keep('VR', 'ngorongoro');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.ngorongoro = (scene, tex, opts) => buildNgorongoro(scene, tex, opts);
  API.ngLifeStep = ngLifeStep;   // (the tests: a step of the animals with cars of their own)
})();
