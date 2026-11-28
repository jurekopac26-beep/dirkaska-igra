/* WORLD — Izoard: its own world south of the col (docs/proge/izoard.md, »Casse Déserte«). The road's corridor stays the shared world of the
   passes (js/world-prelaz.js, PL_LOOK.izoard, untouched for the other passes; js/world-izoard-obcestje.js's roadside as it is): this file
   wraps Izoard's builder alone and adds to the view beyond the corridor (def.farDem's mesh, irFar: one mesh, World.update moves it with
   the camera) what lies under the col's south side: the scree basin of the Casse Déserte and the slopes round it at 31.25 m (one eighth of
   the far grid's 250 m), coloured from the satellite (Sentinel-2, the track's own summer scene: the pale yellow-grey scree, the ochre
   cargneule, the larches lower down), with the needles of cargneule standing out of the scree on the bare rock (at random there: their
   places an approximation, their kind and size the place's own) and the road down the south side. Heights: Copernicus DEM GLO-30;
   the bare rock and the road: OpenStreetMap (ODbL 1.0, read through its API 28. 11. 2026); built by tools/proga/izoard-casse.py. No
   names, no lettering. Graphics only, into the far mesh (vertex colours: no texture, no new draw calls); the driving, the physics and
   def.hills untouched.
   And by the road under the col (s 3700 to the top), where the chase camera sees it: the scree strewn 9-70 m from the road, stones and
   a few blocks of the pale limestone and the yellowish cargneule, as many as the ground is bare there (8 m cells, Sentinel-2's NDVI from
   the same scene: SCREE); their places inside a cell at random (a hash), not on the road, its barriers, the car parks or what the shared
   world keeps clear (excluded); into the ground's chunks (scen.get: no new draw calls), fewer on the lowest graphics. */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.izoard || !World.api.buildPrelaz || !World.ext || !World.ext.izoard) return;
  const API = World.api, LK = API.PL_LOOK.izoard, PREV = World.ext.izoard;

  // the grid (tools/proga/izoard-casse.py): heights 0.5 m steps from lo, big-endian uint16 in base64; col: the satellite's colour, RGB 5-6-5
  const CASSE = /*CASSE*/null;
  const NEEDLES = /*NEEDLES*/[];   // the needles: [x, z, height, foot's radius] (game metres)
  const ROAD = /*ROAD*/[];         // the road down the south side, every ~15 m: runs of [x, z]
  const SCREE = /*SCREE*/[];       // the scree by the road under the col: 8 m cells [x, z, k], k 1-3 how bare (Sentinel-2's NDVI under 0.28, 0.21, 0.14)

  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const hash = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const CARG = [[0.76, 0.64, 0.46], [0.7, 0.58, 0.42], [0.8, 0.7, 0.54], [0.66, 0.6, 0.5]];   // (the cargneule: a yellowish, ochre dolomite breccia, weathered)
  const ASPH = [0.33, 0.33, 0.34];

  function casse(FAR, T, base, lo) {   // (lo: NIZKA, the phones' tier: the grid every 62.5 m, no needles; its budget of CLAUDE.md)
    const D = T.def.farDem, g = FAR.mesh.geometry, B = CASSE, nx = B.nx, nz = B.nz, n = nx * nz, X1 = B.x0 + (nx - 1) * B.cell, Z1 = B.z0 + (nz - 1) * B.cell;
    const cn = D.nx * D.nz, oldC = g.attributes.color.array, oldI = g.index.array, P = Array.from(FAR.P0), Cl = Array.from(oldC), R = Array.from(FAR.rim), I = [];
    const inR = (k) => { const x = FAR.P0[3 * k], z = FAR.P0[3 * k + 2]; return x >= B.x0 - 1 && x <= X1 + 1 && z >= B.z0 - 1 && z <= Z1 + 1; };
    for (let t = 0; t < oldI.length; t += 3) { const a = oldI[t], b = oldI[t + 1], c = oldI[t + 2];   // (the far grid's own triangles over the patch: out)
      if (a < cn && b < cn && c < cn && inR(a) && inR(b) && inR(c)) continue; I.push(a, b, c); }
    // the chase camera is only ever on the road: a face turned away from every point of it is never seen, so it is left out
    const EYE = []; for (let q = 0, st = Math.max(1, Math.ceil(T.N / 140)); q < T.N; q += st) EYE.push(T.px[q], (T.hy ? T.hy[q] : 0) + 4, T.pz[q]);
    const seen = (nx_, ny_, nz_, x, y, z) => { for (let e = 0; e < EYE.length; e += 3) if (nx_ * (EYE[e] - x) + ny_ * (EYE[e + 1] - y) + nz_ * (EYE[e + 2] - z) > 0) return true; return false; };
    const tri = (a, b, c) => { const ax = P[3 * a], ay = P[3 * a + 1], az = P[3 * a + 2], ux = P[3 * b] - ax, uy = P[3 * b + 1] - ay, uz = P[3 * b + 2] - az, wx = P[3 * c] - ax, wy = P[3 * c + 1] - ay, wz = P[3 * c + 2] - az;
      if (seen(uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx, ax + (ux + wx) / 3, ay + (uy + wy) / 3, az + (uz + wz) / 3)) I.push(a, b, c); };
    const dr = (x, z) => { let m = 1e18; for (let q = 0; q < T.N; q += 5) { const dx = x - T.px[q], dz = z - T.pz[q], d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
    const cy = (i, j) => FAR.P0[3 * (j * D.nx + i) + 1];
    const raw = atob(B.b64), cr = atob(B.col), H = new Float32Array(n), S = new Float32Array(3 * n);
    for (let k = 0; k < n; k++) { H[k] = B.lo + (raw.charCodeAt(2 * k) * 256 + raw.charCodeAt(2 * k + 1)) / 2 - base;
      const v = cr.charCodeAt(2 * k) * 256 + cr.charCodeAt(2 * k + 1); S[3 * k] = (v >> 11) / 31; S[3 * k + 1] = ((v >> 5) & 63) / 63; S[3 * k + 2] = (v & 31) / 31; }
    // the satellite's brightness to the far grid's: the ratio of their means over the far nodes inside the patch, each channel (no seam in tone)
    const cs = D.cell / B.cell, fi0 = Math.round((B.x0 - D.x0) / D.cell), fj0 = Math.round((B.z0 - D.z0) / D.cell), m0 = [0, 0, 0], m1 = [0, 0, 0];
    for (let j = 0; j < nz; j += cs) for (let i = 0; i < nx; i += cs) { const q = (fj0 + j / cs) * D.nx + fi0 + i / cs, k = j * nx + i; for (let e = 0; e < 3; e++) { m0[e] += oldC[3 * q + e]; m1[e] += S[3 * k + e]; } }
    const K = m0.map((v, e) => Math.min(1.6, Math.max(0.6, v / Math.max(1e-3, m1[e]))));
    const cdr = new Float32Array(cn).fill(-1), cdrAt = (i, j) => { const k = j * D.nx + i; if (cdr[k] < 0) cdr[k] = dr(D.x0 + i * D.cell, D.z0 + j * D.cell); return cdr[k]; };
    const v0 = P.length / 3, fy = new Float32Array(n);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, x = B.x0 + i * B.cell, z = B.z0 + j * B.cell, u = (x - D.x0) / D.cell, w = (z - D.z0) / D.cell;
      const ci = Math.min(D.nx - 2, Math.floor(u)), cj = Math.min(D.nz - 2, Math.floor(w)), fu = u - ci, fw = w - cj;
      const wts = [[0, 0, (1 - fu) * (1 - fw)], [1, 0, fu * (1 - fw)], [0, 1, (1 - fu) * fw], [1, 1, fu * fw]];
      let fh = 0; const fc = [0, 0, 0];
      for (const [di, dj, ww] of wts) { const q = (cj + dj) * D.nx + ci + di; fh += cy(ci + di, cj + dj) * ww; for (let e = 0; e < 3; e++) fc[e] += oldC[3 * q + e] * ww; }
      // (towards the patch's edge, the far grid's own height and colour: no seam; inside, the model's and the satellite's)
      const ed = sstep(0, 5, Math.min(i, j, nx - 1 - i, nz - 1 - j)), y = fh + (H[k] - fh) * ed, q = hash(i, j) - 0.5;
      fy[k] = y;
      const c = [0, 1, 2].map((e) => Math.min(1, fc[e] + (S[3 * k + e] * K[e] - fc[e]) * ed + q * 0.025));
      P.push(x, y, z); Cl.push(c[0], c[1], c[2]); R.push(sstep(1400, 800, dr(x, z)));
    }
    const st = lo ? 2 : 1;
    for (let j = 0; j + st < nz; j += st) for (let i = 0; i + st < nx; i += st) {
      const ci = Math.floor((i + 0.5 * st) / cs) + fi0, cj = Math.floor((j + 0.5 * st) / cs) + fj0;
      if (Math.min(cdrAt(ci, cj), cdrAt(ci + 1, cj), cdrAt(ci, cj + 1), cdrAt(ci + 1, cj + 1)) < 470) continue;   // (the corridor's hole: as the far grid's own)
      const a = v0 + j * nx + i, b = a + st, c = a + st * nx, d = c + st;
      tri(a, c, b); tri(b, c, d);
    }
    const hAt = (x, z) => { const u = Math.min(nx - 1.001, Math.max(0, (x - B.x0) / B.cell)), w = Math.min(nz - 1.001, Math.max(0, (z - B.z0) / B.cell)), i = Math.floor(u), j = Math.floor(w), fu = u - i, fw = w - j, k = j * nx + i;
      return (fy[k] * (1 - fu) + fy[k + 1] * fu) * (1 - fw) + (fy[k + nx] * (1 - fu) + fy[k + nx + 1] * fu) * fw; };
    const hole = (x, z) => { const ci = Math.floor((x - D.x0) / D.cell), cj = Math.floor((z - D.z0) / D.cell); return Math.min(cdrAt(ci, cj), cdrAt(ci + 1, cj), cdrAt(ci, cj + 1), cdrAt(ci + 1, cj + 1)) < 470; };
    // a face out of the vertices given, turned to face 'out' (three.js: counter-clockwise from the front)
    const face = (ids, ox, oy, oz) => { const [a, b, c] = ids, ax = P[3 * a], ay = P[3 * a + 1], az = P[3 * a + 2], ux = P[3 * b] - ax, uy = P[3 * b + 1] - ay, uz = P[3 * b + 2] - az, wx = P[3 * c] - ax, wy = P[3 * c + 1] - ay, wz = P[3 * c + 2] - az;
      const s = (uy * wz - uz * wy) * ox + (uz * wx - ux * wz) * oy + (ux * wy - uy * wx) * oz; if (s >= 0) tri(a, b, c); else tri(a, c, b); if (ids.length === 4) face([a, c, ids[3]], ox, oy, oz); };
    const vtx = (x, y, z, c, r) => { P.push(x, y, z); Cl.push(c[0], c[1], c[2]); R.push(r); return P.length / 3 - 1; };
    // the needles: a five-sided spire leaning a little, thickest at the foot, a cap of harder rock a little wider than the neck under it
    let nn = 0;
    for (const [x, z, h, r] of lo ? [] : NEEDLES) {
      if (hole(x, z)) continue;
      const q = hash(Math.round(x), Math.round(z)), c = CARG[Math.floor(q * CARG.length)], cd = c.map((v) => v * 0.82), y0 = hAt(x, z) - 2, rm = sstep(1400, 800, dr(x, z));
      const lx = (hash(nn, 3) - 0.5) * 0.25 * h, lz = (hash(nn, 5) - 0.5) * 0.25 * h, a0 = q * 6.28;
      const ring = (f, rr, cc) => { const o = []; for (let s = 0; s < 5; s++) { const an = a0 + s * 1.2566, j = 0.8 + 0.4 * hash(nn * 7 + s, Math.round(f * 10)); o.push(vtx(x + lx * f + Math.cos(an) * rr * j, y0 + (h + 2) * f, z + lz * f + Math.sin(an) * rr * j, cc, rm)); } return o; };
      const L = [ring(0, r, cd), ring(0.6, r * 0.45, c), ring(0.82, r * 0.6, c)], tip = vtx(x + lx, y0 + h + 2 + r * 0.3, z + lz, c, rm);
      for (let l = 0; l + 1 < L.length; l++) for (let s = 0; s < 5; s++) { const t = (s + 1) % 5, an = a0 + (s + 0.5) * 1.2566; face([L[l][s], L[l][t], L[l + 1][t], L[l + 1][s]], Math.cos(an), 0.2, Math.sin(an)); }
      for (let s = 0; s < 5; s++) { const an = a0 + (s + 0.5) * 1.2566; face([L[2][s], L[2][(s + 1) % 5], tip], Math.cos(an), 0.6, Math.sin(an)); }
      nn++;
    }
    // the road down the south side: 6 m of asphalt, laid a little over the 31 m model (a road cut into the slope sits higher than its mean)
    for (const run of ROAD) { let prev = null;
      for (let k = 0; k < run.length; k++) { const [x, z] = run[k], [ax, az] = run[Math.max(0, k - 1)], [bx, bz] = run[Math.min(run.length - 1, k + 1)], l = Math.hypot(bx - ax, bz - az) || 1, px = -(bz - az) / l * 3, pz = (bx - ax) / l * 3;
        if (hole(x, z)) { prev = null; continue; }
        const rm = sstep(1400, 800, dr(x, z)), cur = [vtx(x + px, hAt(x + px, z + pz) + 1.5, z + pz, ASPH, rm), vtx(x - px, hAt(x - px, z - pz) + 1.5, z - pz, ASPH, rm)];
        if (prev) face([prev[0], cur[0], cur[1], prev[1]], 0, 1, 0);
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
    return { verts: nv - v0, needles: nn };
  }

  // the scree by the road under the col (the last ~1.2 km): angular stones of the pale limestone and the cargneule strewn where the satellite
  // sees bare ground, more where it is barer; a few blocks among them. Into the scenery's chunks (no new draw calls), on the ground (caGround),
  // never on the road or by its barrier. Their places in a cell at random (hash): the satellite's 10 m pixel says only that it is bare there.
  const STONE = [[0.78, 0.76, 0.71], [0.72, 0.7, 0.66], [0.8, 0.74, 0.62], [0.68, 0.64, 0.57], [0.84, 0.81, 0.75]];
  const PER = [0, 3, 6, 10];
  function scree({ scen, excluded }, lo) {
    const T = API.T, { caGround, vrNear } = API, pads = (API.VR && API.VR.pads) || []; let n = 0, blk = 0;
    const clear = (x, z) => !(excluded && excluded(x, z)) && pads.every((p) => (x - p.x) ** 2 + (z - p.z) ** 2 > (Math.max(p.r, 16) + 3) ** 2);   // (the houses, the car parks with their cars and people)
    for (const [cx, cz, k] of SCREE) {
      const m = lo ? Math.ceil(PER[k] / 3) : PER[k];
      for (let e = 0; e < m; e++) {
        const h1 = hash(cx * 31 + e, cz * 17 - e), h2 = hash(cz + e * 7, cx - e * 13), x = cx + (h1 - 0.5) * 8, z = cz + (h2 - 0.5) * 8;
        const nr = vrNear(x, z); if (nr.i < 0 || !clear(x, z)) continue;
        if (Math.abs(nr.lat) < (nr.lat >= 0 ? T.br[nr.i] : T.bl[nr.i]) + 1.8) continue;   // (off the road, clear of its barrier)
        const q = hash(e * 101 + cx, cz * 3 + e), big = q < 0.12, r = big ? 0.9 + q * 9 : 0.18 + q * 0.75, ht = r * (big ? 0.85 : 0.6 + 0.4 * hash(e, cx + cz));
        const c0 = STONE[Math.floor(hash(cx + e, e * 5 + cz) * STONE.length)], c = c0.map((v) => v * (0.92 + 0.12 * h2)), cd = c.map((v) => v * 0.8);
        const g = scen.get(x, z), y = caGround(x, z) - 0.08 * r, a0 = h1 * 6.283, ns = big ? 6 : 4, ring = [];
        for (let s = 0; s < ns; s++) { const an = a0 + s * 6.283 / ns, j = 0.7 + 0.6 * hash(s + e, cx * s + cz); ring.push([x + Math.cos(an) * r * j, y, z + Math.sin(an) * r * j]); }
        const top = [x + (h2 - 0.5) * r * 0.5, y + ht, z + (h1 - 0.5) * r * 0.5], mid = [x, y + ht * 0.3, z];
        if (big) {   // (a block: a flat top of four of its corners, sides down to the ground)
          const up = ring.map(([px, , pz], s) => [x + (px - x) * 0.7, y + ht * (0.8 + 0.3 * hash(s, e + cx)), z + (pz - z) * 0.7]);
          for (let s = 0; s < ns; s++) { const t = (s + 1) % ns; g.quadO(ring[s], ring[t], up[t], up[s], cd, mid); }
          for (let s = 1; s + 1 < ns; s++) g.triO(up[0], up[s], up[s + 1], c, mid);
          blk++;
        } else for (let s = 0; s < ns; s++) g.triO(ring[s], ring[(s + 1) % ns], top, s & 1 ? c : cd, mid);
        n++;
      }
    }
    return { stones: n, blocks: blk };
  }
  let LO = false;   // (the phones' tier: a third of the stones; set by the builder below before the passes' world runs)
  const baseX = LK.extra;
  LK.extra = function (o) {
    const r = baseX ? baseX.call(this, o) : undefined;
    if (API.T && SCREE.length && o && o.scen) { const st = scree(o, LO); if (o.out) o.out.izoardScree = st; }
    return r;
  };

  World.ext.izoard = (scene, tex, opts) => {
    LO = !!(opts && opts.tier === 0);
    const out = PREV(scene, tex, opts), FAR = out && out.dyn && out.dyn.irFar;
    if (FAR && CASSE && API.T && API.T.def.farDem) { const s = casse(FAR, API.T, API.VR.D.base, opts && opts.tier === 0); if (out.stats) Object.assign(out.stats, { casseVerts: s.verts, casseNeedles: s.needles }); }
    return out;
  };
})();
