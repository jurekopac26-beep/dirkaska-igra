/* =========================================================================
   WORLD — Bang Saen (theme 'bangsaen'): its own builder (World.ext.bangsaen), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, NRT, RB, TAU, addShore, atS, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdRun, crowdUV, cyl, gable,
    ico, inPoly, lerp, nrDem, nrDist, nrGH, nrGround, nrLC, nrLCf, nrLump, nrNear, nrPrep, nrTileGeo, nrTileOn, propFloorTable, rng, shoreBand,
    sstep, valueNoise2, vary, waterMat, waterline, wrapS, pitJunction, pitKerbs, pitOpen, pitRoadAt
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= BANG SAEN (theme 'bangsaen'): the street circuit of the seaside town on the Gulf of Thailand =================
     The Nordschleife's corridor terrain (nrPrep: def.dem, def.lc) under a town of its own: the buildings' real footprints (def.bs.bld) with
     shophouse rows filling the built-up land between them, the streets round the track (def.bs.st), the junctions the track meets
     (def.bs.jn): their mouths inside the barriers paved as the street they are, with zebra crossings, stop lines and the street furniture
     the cars knock over (Core's shared street furniture: traffic signals on poles and on mast arms, signs, bollards, bins, hydrants, cabinets, lamps); the
     beach (sand, casuarinas and palms, sunshades and deckchairs, food stalls), the sea to the horizon, the far hills (def.bs.far: Khao Sam
     Muk), concrete walls with debris fences, the pit lane on the beach side, grandstands, power poles with their bundles of cables, spirit
     houses, motorbikes parked by the shops, a temple at the hairpin. Only geographic names, generic signs, no brands. */
  const BGS_A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function bgsInts(str) {   // zigzag varints, 5 bits a character (bit 5: more follows)
    const out = []; let u = 0, sh = 0;
    for (let k = 0; k < str.length; k++) { const c = BGS_A64.indexOf(str[k]); u += (c & 31) * Math.pow(2, sh); sh += 5; if (!(c & 32)) { out.push(u % 2 ? -(u + 1) / 2 : u / 2); u = 0; sh = 0; } }
    return out;
  }
  function bgsDecode(B) {   // the buildings ([h, kind, [[x, z], ...]]), the streets ([w, cls, [[x, z], ...]]), the coast ([[x, z], ...])
    const rd = (str, n) => { const a = bgsInts(str), L = []; let p = 0;
      for (let k = 0; k < n; k++) { const h = a[p++] / 2, kd = a[p++], m = a[p++], pts = []; let x = 0, z = 0; for (let q = 0; q < m; q++) { x += a[p++]; z += a[p++]; pts.push([x / 2, z / 2]); } L.push([h, kd, pts]); }
      return L; };
    const c = bgsInts(B.coast), coast = []; let x = 0, z = 0; for (let k = 0; k < c.length; k += 2) { x += c[k]; z += c[k + 1]; coast.push([x / 2, z / 2]); }
    return { bld: rd(B.bld, B.nb), st: rd(B.st, B.ns), coast };
  }
  function bgsTreeGeo(kind) {   // unit trees (height 1): 0 a coconut palm, 1 a casuarina, 2 a rain tree (wide, flat crown), 3 a far palm, 4 a far round crown, 5 a shrub
    const g = new GB(), R = rng(880 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const tr = [0.52, 0.44, 0.34], lf = [0.3, 0.52, 0.2], lfD = [0.22, 0.42, 0.16];
    if (kind === 0 || kind === 3) {   // the palm: a thin curved trunk, a crown of drooping fronds
      const lean = 0.08;
      cyl(g, 0, -0.02, 0, 0.025, 0.5, kind ? 4 : 5, tr, null, 0.021); cyl(g, lean * 0.5, 0.48, 0, 0.021, 0.48, kind ? 4 : 5, [0.58, 0.5, 0.38], null, 0.018);
      const n = kind ? 5 : 8, tx = lean, ty = 0.95;
      for (let k = 0; k < n; k++) { const a = k / n * TAU + R() * 0.3, L = 0.24 + R() * 0.06, w = 0.045, c = k % 2 ? lf : lfD;
        const mid = [tx + Math.cos(a) * L * 0.5, ty + 0.05, Math.sin(a) * L * 0.5], tip = [tx + Math.cos(a) * L, ty - 0.12 - R() * 0.06, Math.sin(a) * L];
        const pl = [mid[0] - Math.sin(a) * w, mid[1], mid[2] + Math.cos(a) * w], pr = [mid[0] + Math.sin(a) * w, mid[1], mid[2] - Math.cos(a) * w], base = [tx, ty, 0];
        g.triO(base, pl, mid, c, [tx, ty - 1, 0]); g.triO(base, mid, pr, c, [tx, ty - 1, 0]); g.triO(pl, tip, mid, c, [tx, ty - 1, 0]); g.triO(mid, tip, pr, c, [tx, ty - 1, 0]); }
    } else if (kind === 1) {   // casuarina: a slender trunk, a narrow, wispy grey-green crown in tiers
      const cs = [0.32, 0.42, 0.3];
      cyl(g, 0, -0.02, 0, 0.022, 0.55, 5, [0.38, 0.3, 0.24], null, 0.016);
      for (const [y, r] of [[0.3, 0.2], [0.5, 0.17], [0.68, 0.13], [0.84, 0.08]]) cone(g, 0, y, 0, r, 0.26, 7, vary(cs, R, 0.12), [0.4, 0.5, 0.36], R() * TAU);
    } else if (kind === 2 || kind === 4) {   // rain tree: a short trunk, a wide umbrella of soft lumps
      if (kind === 2) { cyl(g, 0, -0.02, 0, 0.05, 0.42, 5, [0.36, 0.3, 0.24], null, 0.04); ico(g, 0, 0.66, 0, 0.42, 0.55, [0.24, 0.42, 0.16], R, 0.22); nrLump(g, 0.2, 0.7, 0.12, 0.26, 0.6, [0.27, 0.46, 0.18], R, 0.2); nrLump(g, -0.18, 0.72, -0.14, 0.24, 0.6, [0.22, 0.4, 0.15], R, 0.2); }
      else ico(g, 0, 0.6, 0, 0.42, 0.62, [0.24, 0.42, 0.17], R, 0.25);
    } else { ico(g, 0, 0.45, 0, 0.5, 0.8, [0.26, 0.45, 0.18], R, 0.25); }   // a shrub (sunk into the ground)
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function bgsShopTex() {   // the shophouses' ground floors (one 4 m bay a tile): a roller shutter half up, the shop's dark inside, a coloured sign board above
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#d9d2c2'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#2a2826'; x.fillRect(8, 46, 112, 82);                       // the open front
    x.fillStyle = '#8f9396'; x.fillRect(8, 46, 112, 30); x.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 48; y < 76; y += 4) x.fillRect(8, y, 112, 1);   // the shutter, half up
    x.fillStyle = '#5a4a3a'; x.fillRect(18, 96, 40, 32); x.fillStyle = '#6d7f8a'; x.fillRect(70, 88, 40, 40);   // a counter, a fridge
    x.fillStyle = '#ffffff'; x.fillRect(0, 10, 128, 30); x.fillStyle = 'rgba(0,0,0,0.15)'; x.fillRect(0, 38, 128, 2);   // the sign board (its colour: the vertex colour's... white here, tinted by the bay)
    x.fillStyle = 'rgba(0,0,0,0.35)'; for (let k = 0; k < 4; k++) x.fillRect(16 + k * 26, 20, 18, 10);   // (generic shapes, no letters)
    x.fillStyle = '#bdb6a6'; x.fillRect(0, 0, 4, 128); x.fillRect(124, 0, 4, 128);   // the columns
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; return t;
  }
  function bgsGroundTex() {   // the ground under the vertex colours (256 px = 14 m, tileable): a neutral dusty grey with flecks
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(9061), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(9062, 40), n2 = valueNoise2(9063, 9), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, k = 0.78 + wr(n1, i, j) * 0.16 + wr(n2, i, j) * 0.1 + (r() - 0.5) * 0.12;
      d[o] = Math.min(255, 196 * k); d[o + 1] = Math.min(255, 192 * k); d[o + 2] = Math.min(255, 184 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 500; k++) { const px = r() * S, py = r() * S, g = 80 + r() * 60; x.fillStyle = `rgba(${g},${g + 8},${g - 10},0.35)`; x.fillRect(px, py, 1 + r() * 2, 1 + r() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  function buildBangsaen(scene, tex, opts) {
    const R = rng(3740), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def, L = T.len, BSD = def.bs;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [], ownMarks: true };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };
    const sAt = (d) => (((sStart + d) % L) + L) % L;
    const hyS = (s) => T.elevAt(wrapS(s)).y;
    const PD = def.pit, D = bgsDecode(BSD), SEA = BSD.seaY;
    nrPrep();
    const P = API.NR, G = P.G;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const W1 = [1, 1, 1];
    // the coast: signed distance (+ on the sea), from the polyline (closed round the west by the grid's edge)
    const CO = D.coast, CH = 48, chash = new Map();
    for (let k = 0; k + 1 < CO.length; k++) { const a = CO[k], b = CO[k + 1], x0 = Math.floor(Math.min(a[0], b[0]) / CH), x1 = Math.floor(Math.max(a[0], b[0]) / CH), z0 = Math.floor(Math.min(a[1], b[1]) / CH), z1 = Math.floor(Math.max(a[1], b[1]) / CH);
      for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const kk = i + ',' + j; let Lc = chash.get(kk); if (!Lc) chash.set(kk, Lc = []); Lc.push(k); } }
    const coastD = (x, z) => {   // metres to the coast (up to ~150), + on the sea side (the sea lies west of the coast as it runs north-west)
      let bd = 1e9, bs = 1; const i0 = Math.floor(x / CH), j0 = Math.floor(z / CH);
      for (let r = 0; r <= 3 && bd > r * CH - CH; r++) for (let i = i0 - r; i <= i0 + r; i++) for (let j = j0 - r; j <= j0 + r; j++) { if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r) continue; const Lc = chash.get(i + ',' + j); if (!Lc) continue;
        for (const k of Lc) { const a = CO[k], b = CO[k + 1], vx = b[0] - a[0], vz = b[1] - a[1], t = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz || 1), 0, 1), dx = x - a[0] - vx * t, dz = z - a[1] - vz * t, d = Math.hypot(dx, dz);
          if (d < bd) { bd = d; bs = (vx * dz - vz * dx) > 0 ? -1 : 1; } } }
      return bd > 1e8 ? null : bd * bs; };
    const seaSide = (() => { const mid = CO[CO.length >> 1], k = CO.length >> 1, nx = -(CO[k + 1][1] - mid[1]), nz = CO[k + 1][0] - mid[0], l = Math.hypot(nx, nz) || 1;
      return nrDem(mid[0] + nx / l * 120, mid[1] + nz / l * 120) < nrDem(mid[0] - nx / l * 120, mid[1] - nz / l * 120) ? 1 : -1; })();   // (+1: the sea on the side of the polyline's left normal, where coastD is -)
    const seaD = (x, z) => { const c = coastD(x, z); return c === null ? (nrDem(x, z) < SEA + 0.5 ? 200 : -200) : c * -seaSide; };   // + on the sea (far from the coast: the terrain says which)
    // ---- what stands where: an occupancy grid (2 m cells) for the buildings, the streets and the track's barriers, so nothing overlaps
    const OC = 2, ox0 = P.x0, oz0 = P.z0, onx = Math.ceil((P.x1 - P.x0) / OC), onz = Math.ceil((P.z1 - P.z0) / OC), occ = new Uint8Array(onx * onz);   // 1 street, 2 building, 3 track, 4 beach/sea, 5 kept clear
    const ocK = (x, z) => { const i = Math.floor((x - ox0) / OC), j = Math.floor((z - oz0) / OC); return i < 0 || j < 0 || i >= onx || j >= onz ? -1 : j * onx + i; };
    const ocGet = (x, z) => { const k = ocK(x, z); return k < 0 ? 9 : occ[k]; };
    const ocSet = (x, z, v) => { const k = ocK(x, z); if (k >= 0 && (!occ[k] || v === 3)) occ[k] = v; };
    const ocDisc = (x, z, r, v) => { for (let a = -r; a <= r; a += OC * 0.7) for (let b = -r; b <= r; b += OC * 0.7) if (a * a + b * b <= r * r) ocSet(x + a, z + b, v); };
    for (let i = 0; i < N; i++) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i]; for (let o = 0; o <= bar + 4; o += 1.2) { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o; ocSet(x, z, 3); } }
    for (let j = 0; j < onz; j++) for (let i = 0; i < onx; i++) { const x = ox0 + (i + 0.5) * OC, z = oz0 + (j + 0.5) * OC; if (seaD(x, z) > -14 && !occ[j * onx + i]) occ[j * onx + i] = 4; }
    if (PD) for (let q = PD[1] - 30; q < PD[2] + 30; q += 1) for (let o = T.w; o < 52; o += 1.2) { const [x, z] = atSf(sAt(q), o); ocSet(x, z, 5); }   // (the pit lane, the garages, the paddock behind)
    out.stats = {};
    // ---- the ground's colours (a neutral picture: the colours are all here): lawns and weeds, the shade of the trees, the dusty concrete of the town, the sand by the sea
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), se = nrLCf(x, z, 3), tr = nrLCf(x, z, 1), sd = clamp((seaD(x, z) + 62) / 50, 0, 1);
      let r = 0.6 + (m - 0.5) * 0.12, g = 0.72 + (m - 0.5) * 0.1 + (q - 0.5) * 0.06, b = 0.42 + (q - 0.5) * 0.06;
      r = lerp(r, 0.46, tr * 0.6); g = lerp(g, 0.58, tr * 0.6); b = lerp(b, 0.34, tr * 0.6);
      const k = 0.98 + (q - 0.5) * 0.14 + (m - 0.5) * 0.1; r = lerp(r, 0.92 * k, se * 0.85); g = lerp(g, 0.89 * k, se * 0.85); b = lerp(b, 0.83 * k, se * 0.85);
      r = lerp(r, 1.12, sd); g = lerp(g, 1.04, sd); b = lerp(b, 0.84, sd);
      if (dd < 4) { const t = sstep(4, 0.5, dd); r = lerp(r, 0.9, t); g = lerp(g, 0.88, t); b = lerp(b, 0.84, t); }
      o[0] = r; o[1] = g; o[2] = b; return o; };
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(bgsGroundTex()), vertexColors: true });
    const tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the road: asphalt (a little patched and worn, darker on the racing line), white edge lines and the lane line, kerbs in the corners ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true }), pvMat = new THREE.MeshLambertMaterial({ map: tex.paving, vertexColors: true });
    const kerb = [new Uint8Array(N), new Uint8Array(N)];
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) if (side * k > 0) kerb[side > 0 ? 1 : 0][i] = 1; }   // (the street circuit: kerbs on the insides only)
    pitKerbs(kerb);   // (none on the pit lane's side where it joins the circuit)
    const RCH = 256, offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8, secT = new Float32Array(N);
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 40 + Math.floor(crH(k, 3, 37) * 60), t = 0.9 + crH(k, 5, 37) * 0.14; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const shade = (i, o) => { const rl = T.rl[i]; let k = (0.86 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.9) k -= 0.04; return [k, k, k * 1.02]; };
    const wide = (i, side) => (side > 0 ? T.br[i] : T.bl[i]) - w > 4.2;   // (a junction's mouth or a run-off: paved as a street)
    for (let c0 = 0; c0 < N; c0 += RCH) {
      const gr = new RB(true), gl = new RB(), gk = new RB(true), gv = new RB(true), gm = new RB(true);
      let pr = -1, pl = -1, pc = -1; const pk = [-1, -1], pv = [-1, -1], pm = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + RCH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v]));
        if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const wl = [0.94, 0.94, 0.9], l = gl.row([Pt(i, -w + 0.15, 0.034), Pt(i, -w + 0.3, 0.034), Pt(i, w - 0.3, 0.034), Pt(i, w - 0.15, 0.034)], [wl, wl, wl, wl]);
        if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        const dash = ((ii * ds) % 12) < 4, lc = gl.row([Pt(i, -0.07, 0.034), Pt(i, 0.07, 0.034)], [wl, wl]);   // the lane line: 4 m dashes, 8 m gaps (a two-lane carriageway)
        if (pc >= 0 && dash && Math.abs(dS(i * ds)) > 14) gl.link(pc, lc, 0, 1); pc = lc;
        for (const side of [-1, 1]) {
          const si = side > 0 ? 1 : 0, bar = side > 0 ? T.br[i] : T.bl[i];
          if (kerb[si][i]) {
            const cw = T.curbW, pf = [[w - 0.02, 0.035], [w + 0.14, 0.078], [w + cw - 0.12, 0.085], [w + cw + 0.02, 0.03]], vv = ii * ds / 2;
            const sh = [0.84, 1, 1, 0.78].map(k => [k, k, k]), us = [0, 0.1, 0.92, 1], o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
            const rk = gk.row(o.map(k => Pt(i, side * pf[k][0], pf[k][1])), o.map(k => sh[k]), o.map(k => [us[k], vv]));
            if (pk[si] >= 0) gk.link(pk[si], rk, 0, 3); pk[si] = rk;
          } else pk[si] = -1;
          // the verge from the edge to the wall: the pavement (Thai kerbs painted black and white), in a junction's mouth (and where the pit lane joins) the street's asphalt
          const inner = w + (kerb[si][i] ? T.curbW : 0.02), wd = wide(i, side) || (side > 0 && !!def.pit && pitOpen(i)), pave = [0.86, 0.86, 0.84], blk = Math.floor(ii * ds / 1.0) % 2 ? [0.12, 0.12, 0.13] : [0.95, 0.95, 0.93];
          const ord = (a) => side > 0 ? a : a.slice().reverse();
          if (wd) { const pts = ord([Pt(i, side * inner, 0.022), Pt(i, side * (bar + 0.15), 0.022)]), rr = gm.row(pts, [[0.98, 0.98, 1], [0.98, 0.98, 1]], pts.map(p => [p[0] / 8, -p[2] / 8])); if (pm[si] >= 0) gm.link(pm[si], rr, 0, 1); pm[si] = rr; pv[si] = -1; }
          else { const o3 = [inner, inner + (kerb[si][i] ? 0.02 : 0.32), inner + (kerb[si][i] ? 0.03 : 0.34), bar + 0.15], cl = [kerb[si][i] ? pave : blk, kerb[si][i] ? pave : blk, pave, pave], hh = [0.024, 0.024, 0.026, 0.026];
            const pts = ord(o3.map((o, k) => Pt(i, side * o, hh[k]))), cols = ord(cl), rr = gv.row(pts, cols, pts.map(p => [p[0] / 3, -p[2] / 3]));
            if (pv[si] >= 0) { gv.link(pv[si], rr, 0, 1); gv.link(pv[si], rr, 2, 3); gv.link(pv[si], rr, 1, 2); } pv[si] = rr; pm[si] = -1; }
        }
      }
      addM(gr, aMat); addM(gl, lMat); addM(gk, cMat); addM(gv, pvMat); addM(gm, aMat);
    }
    // the chequered start / finish line and the grid boxes
    {
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, HYp = (p) => T.hy[p[3]], wh = [0.93, 0.93, 0.9];
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) {
        const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 2.6;
        const p0 = atSf(sb, lat - 1.4), p1 = atSf(sb, lat + 1.4), p2 = atSf(sb + 0.35, lat + 1.4), p3 = atSf(sb + 0.35, lat - 1.4);
        gw.quadUp([p0[0], HYp(p0) + 0.037, p0[1]], [p1[0], HYp(p1) + 0.037, p1[1]], [p2[0], HYp(p2) + 0.037, p2[1]], [p3[0], HYp(p3) + 0.037, p3[1]], [wh, wh, wh, wh]);
      }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- the barriers: concrete walls the whole way round (open only where the pit lane leaves and joins), the debris fence on them, the
       game's own advertising boards on the walls ---- */
    const side2 = (side) => (side > 0 ? 1 : 0), conc = [0.8, 0.8, 0.78], concD = [0.64, 0.64, 0.62];
    const wallAt = (i, side) => !(side > 0 && PD && (pitOpen(i) || (() => { const p = T.pitAt(i * ds); return p && p.gap; })()));   // (pitOpen: the deceleration and acceleration lanes too)
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const wallRow = (gr, i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.12), o2 = side * (bar + 0.5);
      let p = [Pt(i, o, -0.4), Pt(i, o, 0.1), Pt(i, o, 1.0), Pt(i, o, 1.1), Pt(i, o2, 1.1)], c = [concD, conc, conc, [0.9, 0.9, 0.88], [0.84, 0.84, 0.82]];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); } return gr.row(p, c); };
    for (let c0 = 0; c0 < N; c0 += RCH) {
      const gr = new RB();
      for (const side of [-1, 1]) { let prev = -1;
        for (let ii = c0; ii <= Math.min(c0 + RCH, N); ii++) { const i = ii % N; if (!wallAt(i, side)) { prev = -1; continue; } const r = wallRow(gr, i, side); if (prev >= 0) gr.link(prev, r, 0, 4); prev = r; } }
      addM(gr, rMat, true);
    }
    { const sb = new Chunks(256, true);   // the boards (tex.sponsors: the game's own brands)
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 3) {
        const j = (i + 2) % N; if (!wallAt(i, side) || !wallAt(j, side) || wide(i, side) || wide(j, side)) continue;
        if (crH(i, side, 71) < 0.35) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, bar = side > 0 ? T.br : T.bl, o = (q) => side * (bar[q] + 0.1);
        const A = Pt(i, o(i), 0.14), B = Pt(j, o(j), 0.14), C = Pt(j, o(j), 0.96), Dd = Pt(i, o(i), 0.96), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        sb.get(A[0], A[2]).quadO(A, B, C, Dd, W1, Pt(i, side * (bar[i] + 2), 0.5), [[uL, v1 - 0.25], [uR, v1 - 0.25], [uR, v1], [uL, v1]]); }
      sb.addTo(root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true); }
    const scen = new Chunks(256), fenceG = new GB(true);
    for (const side of [-1, 1]) { const bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) { const j = (i + 1) % N; if (!wallAt(i, side) || !wallAt(j, side)) { acc += ds; continue; }
        const Q = (q, y) => { const o = side * (bar[q] + 0.3); return [T.px[q] + T.nx[q] * o, T.hy[q] + y, T.pz[q] + T.nz[q] * o]; };
        const u0 = acc / 2.5, u1 = (acc + ds) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        fenceG.quadO(Q(i, 1.1), Q(j, 1.1), Q(j, 3.6), Q(i, 3.6), W1, ins, [[u0, 0], [u1, 0], [u1, 1.0], [u0, 1.0]]);
        if (i % 2 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] + 1.0, p[2], 0.08, 2.65, 0.08, T.hd[i], [0.55, 0.56, 0.58]); }
        acc += ds; } }

    /* ---- the pit lane on the beach side (Core.Track.pitAt): the lane and its lines, the apron, the crews' boxes (the renderer's mechanics:
       out.pitBoxes, the player's out.pitBox), a row of temporary pit garages (white marquees), the paddock's tents behind ---- */
    let nBoxes = 0;
    const TEAM = [[0.12, 0.16, 0.36], [0.85, 0.12, 0.14], [0.16, 0.46, 0.3], [0.96, 0.52, 0.1], [0.94, 0.94, 0.92], [0.14, 0.14, 0.16], [0.16, 0.36, 0.8], [0.1, 0.62, 0.72], [0.96, 0.78, 0.12], [0.5, 0.2, 0.6]];
    if (PD) {
      const gl = new GB(true), gp = new GB(), one = [1, 1, 1], wl = [0.95, 0.95, 0.94], apC = [0.8, 0.81, 0.78], [pq0, pq1] = def.pitRow || [PD[1] + 80, PD[1] + 200];
      const at = (s, o, y) => { const [x, z] = atSf(s, o); return [x, hyS(s) + y, z]; };
      for (let q = PD[1]; q < PD[2]; q += 2) {
        const s0 = sStart + q, s1 = s0 + 2, pi = T.pitAt(s0), pj = T.pitAt(s1); if (!pi || !pj) continue;
        const A = at(s0, pi.br + 0.4, 0.023), Bq = at(s0, pi.o + 3.5, 0.023), C = at(s1, pj.o + 3.5, 0.023), Dd = at(s1, pj.br + 0.4, 0.023);   // (from the pit wall out: the lane's asphalt)
        gl.quadUp(A, Bq, C, Dd, [one, one, one, one], [[A[0] / 8, -A[2] / 8], [Bq[0] / 8, -Bq[2] / 8], [C[0] / 8, -C[2] / 8], [Dd[0] / 8, -Dd[2] / 8]]);
        gp.quadUp(at(s0, pi.o + 3.18, 0.033), at(s0, pi.o + 3.36, 0.033), at(s1, pj.o + 3.36, 0.033), at(s1, pj.o + 3.18, 0.033), [wl, wl, wl, wl]);
        if (((q / 2) | 0) % 2 === 0) gp.quadUp(at(s0, pi.o - 3.36, 0.033), at(s0, pi.o - 3.18, 0.033), at(s1, pj.o - 3.18, 0.033), at(s1, pj.o - 3.36, 0.033), [wl, wl, wl, wl]);
        if (pi.t > 0.999 && pj.t > 0.999) gp.quadUp(at(s0, pi.o + 3.5, 0.022), at(s0, pi.o + 11.5, 0.022), at(s1, pj.o + 11.5, 0.022), at(s1, pj.o + 3.5, 0.022), [apC, apC, apC, apC]);
      }
      pitJunction(gl, gp, hyS);   // the deceleration and acceleration lanes, the gores (in the lane's meshes)
      const kbox = (g, s0, a, wo, y, sx, sy, sz, col, top, nb) => { const [x, z, hd] = atSf(s0 + a, wo); box(g, x, hyS(s0 + a) + y, z, sx, sy, sz, hd, col, top, nb); };
      const kcyl = (g, s0, a, wo, y, r, h, n, col, top) => { const [x, z] = atSf(s0 + a, wo); cyl(g, x, hyS(s0 + a) + y, z, r, h, n, col, top); };
      for (let q = pq0, k = 0; q <= pq1; q += 10, k++) { const s0 = sStart + q, i = T.idx(s0), p = T.pitAt(s0); if (!p || p.t < 0.999) continue;
        const tx = T.tx[i], tz = T.tz[i], base = p.o + 3.5, hd = T.hd[i];
        { const L0 = at(s0 - 0.09, base, 0.034), L1 = at(s0 + 0.09, base, 0.034), L2 = at(s0 + 0.09, base + 8, 0.034), L3 = at(s0 - 0.09, base + 8, 0.034); gp.quadUp(L0, L1, L2, L3, [wl, wl, wl, wl]); }
        if (nBoxes >= 13) continue; nBoxes++;
        const tc = TEAM[k % TEAM.length], cx = T.px[i] + T.nx[i] * (base + 4.2) + tx * 5, cz = T.pz[i] + T.nz[i] * (base + 4.2) + tz * 5;
        const mine = PD[3] != null && Math.abs(q + 5 - PD[3]) < 1, yb = hyS(s0 + 5), g = scen.get(cx, cz);
        if (mine) { const sb = s0 + 5, bp = T.bayPose(PD[3]);   // (the car stops in its box on the apron, parked straight in front of the garage: Core's BAY)
          out.pitBox = { s: sb, x: cx, z: cz, hd, tx, tz, nx: T.nx[i], nz: T.nz[i], lane: p.o, wallO: p.wall, apron0: base, garage0: base + 8, stop: atSf(sb, bp.o), stopO: bp.o, stopA: bp.a }; }
        else { kbox(g, s0, 1.6, base + 6.8, 0, 1.1, 0.95, 0.6, [0.2, 0.21, 0.24], [0.1, 0.1, 0.11]); for (const ta of [7.2, 8.0]) kcyl(g, s0, ta, base + 7, 0, 0.34, 1.0, 8, [0.12, 0.12, 0.13], tc); }
        kbox(g, s0, 5, p.wall + 0.75, 0.96, 2.4, 0.06, 0.9, [0.3, 0.31, 0.34], [0.36, 0.37, 0.4]); kbox(g, s0, 5, p.wall + 0.8, 2.4, 2.6, 0.07, 1.4, [0.22, 0.23, 0.26], tc);   // the crew's stand on the wall
        for (const la of [-1.1, 1.1]) kbox(g, s0, 5 + la, p.wall + 0.8, 0, 0.07, 2.4, 0.07, [0.22, 0.22, 0.24], null, true);
        const oc = atSf(s0 + 5, 0);
        (out.pitBoxes = out.pitBoxes || []).push({ k, s: s0 + 5, ox: oc[0], oz: oc[1], tx, tz, nx: T.nx[i], nz: T.nz[i], hd, base, lane: p.o, wall: p.wall, team: tc, mine, y: yb });
        out.pitBoxes[out.pitBoxes.length - 1].gar = { band: [base + 7.95, 2.5, 3.0, 4.8], wall: [base + 8, 0.02, 2.47, 4.3] }; }   // (its marquee below, for the renderer's team colours: the band along the eaves, the closed front's door)
      { const pbs = out.pitBoxes; T.pitStands = null; if (pbs && pbs.length) T.pitStands = [dS(pbs[0].s) - 1.35, dS(pbs[pbs.length - 1].s) + 1.35]; }
      for (const [q0, dq] of [[PD[1] + 30, 4], [PD[2] - 26, -4]]) for (let k = 0; k < 3; k++) {   // knockable cones on the noses
        const s = sStart + q0 + k * dq, i = T.idx(s), p = T.pitAt(s); if (!p) continue; const o = (T.br[i] + 0.9 + p.o - 3.5) / 2; if (o < T.br[i] + 0.5 || o > p.o - 4) continue;
        const [x, z] = atS(s, o); out.props.push({ kind: 'cone', x, z, yaw: R() * TAU, col: 0, i }); }
      addM(gl, aMat); addM(gp, lMat);
      // the pit garages: white marquees with peaked roofs, a team's colour along the eaves, open towards the lane; the paddock tents behind
      const tg = new GB();
      for (let q = pq0 - 40; q < pq1 + 40; q += 10) { const s0 = sStart + q, p = T.pitAt(s0 + 5); if (!p || p.t < 0.999) continue;
        const f0 = p.o + 11.5, k = Math.round((q - pq0) / 10), tc = TEAM[((k % TEAM.length) + TEAM.length) % TEAM.length], [x, z, hd] = atSf(s0 + 5, f0 + 4), y = hyS(s0 + 5);
        box(tg, x, y, z, 9.6, 3.0, 8, hd, [0.95, 0.95, 0.94], null, true); gable(tg, x, y + 3.0, z, 9.8, 8.2, 1.5, hd + Math.PI / 2, [0.97, 0.97, 0.96], [0.95, 0.95, 0.94]);
        kbox(tg, s0, 5, f0 - 0.02, 2.5, 9.6, 0.5, 0.06, tc); kbox(tg, s0, 5, f0 + 0.05, 0.02, 8.6, 2.45, 0.05, [0.16, 0.16, 0.18]);   // (the open front: its dark inside)
        if (k % 3 === 0) { const [px2, pz2] = atSf(s0 + 5, f0 + 18); box(tg, px2, y, pz2, 6, 2.6, 6, hd, [0.95, 0.95, 0.94], null, true); cone(tg, px2, y + 2.6, pz2, 4.3, 1.6, 4, [0.96, 0.96, 0.95], null, Math.PI / 4 + hd); } }
      addM(tg, matV, true);
    }

    /* ---- grandstands: steel scaffold stands behind the fence, tiers with a seated crowd, the covered one by the pits under a white roof ---- */
    const crowdTex = ownTex(API.rbCrowdTex(false)), cg = new GB(true), sg = new GB();
    let nStands = 0;
    for (const [sa, sb, side, rows, roof] of def.stands || []) {
      nStands++;
      for (let d = sa; d < sb; d += 4) {
        const s0 = sAt(d), s1 = sAt(Math.min(sb, d + 4)), i0 = T.idx(s0), i1 = T.idx(s1), b0 = (side > 0 ? T.br[i0] : T.bl[i0]) + 3.2, b1 = (side > 0 ? T.br[i1] : T.bl[i1]) + 3.2;
        const Q = (i, o, y) => [T.px[i] + T.nx[i] * side * o, T.hy[i] + y, T.pz[i] + T.nz[i] * side * o];
        for (let r = 0; r < rows; r++) {
          const o0a = b0 + r * 0.9, o0b = b1 + r * 0.9, y = 0.6 + r * 0.55, ins = Q(i0, o0a + 6, y - 3);
          cg.quadO(Q(i0, o0a, y - 0.4), Q(i1, o0b, y - 0.4), Q(i1, o0b + 0.9, y + 0.45), Q(i0, o0a + 0.9, y + 0.45), W1, Q(i0, o0a + 3, y - 2), [[d / 6, r * 0.25], [(d + 4) / 6, r * 0.25], [(d + 4) / 6, r * 0.25 + 0.25], [d / 6, r * 0.25 + 0.25]]);   // the crowd on a tier (sloped: seen from above), facing the road
        }
        const top = 0.6 + rows * 0.55, back = rows * 0.9;
        sg.quadO(Q(i0, b0 + back, -0.4), Q(i1, b1 + back, -0.4), Q(i1, b1 + back, top + 0.6), Q(i0, b0 + back, top + 0.6), [0.36, 0.38, 0.42], Q(i0, b0, top / 2));   // the back
        if (((d - sa) / 4 | 0) % 2 === 0) for (const o of [b0 - 0.2, b0 + back]) { const p = Q(i0, o, 0); box(scen.get(p[0], p[2]), p[0], p[1] - 0.3, p[2], 0.12, top + 0.3, 0.12, T.hd[i0], [0.5, 0.52, 0.55]); }
        if (roof) { sg.quadO(Q(i0, b0 - 0.6, top + 3), Q(i1, b1 - 0.6, top + 3), Q(i1, b1 + back + 0.6, top + 3.6), Q(i0, b0 + back + 0.6, top + 3.6), [0.93, 0.93, 0.92], Q(i0, b0 + back / 2, 0));
          if (((d - sa) / 4 | 0) % 3 === 0) { const p = Q(i0, b0 - 0.4, 0); box(scen.get(p[0], p[2]), p[0], p[1], p[2], 0.15, top + 3, 0.15, T.hd[i0], [0.7, 0.7, 0.72]); } }
        for (let o = b0 - 1; o < b0 + back + 2; o += 2) { const p = Q(i0, o, 0); ocSet(p[0], p[2], 5); }
      }
    }
    addM(cg, crowdUV(new THREE.MeshLambertMaterial({ map: crowdTex, vertexColors: true }), 1, 0.25, 0.25)); addM(sg, matV, true);
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.9 });
    const crowdPts = [];
    {
      const M = { first: 1.2, gap: 1.0, below: 3, above: 6, sit: 0.2, flag: 0.06, maxSlope: 0.9, excluded: (x, z) => ocGet(x, z) === 2 };
      const run = (d0, d1, side, o) => crowdRun(CR, sStart + d0, sStart + d1, side, Object.assign({}, M, o));
      for (const [a, b, sd] of def.ga || []) { run(a, b, sd, { rows: 4, dens: 0.6, clump: 0.6, label: 'BS ga' }); for (let d = a; d < b; d += 20) { const [x, z] = atS(sAt(d), sd * ((sd > 0 ? T.br[T.idx(sAt(d))] : T.bl[T.idx(sAt(d))]) + 3)); crowdPts.push(x, z, 0.8); } }
      for (const [a, b, sd] of def.stands || []) for (let d = a; d < b; d += 20) { const [x, z] = atS(sAt(d), sd * ((sd > 0 ? T.br[T.idx(sAt(d))] : T.bl[T.idx(sAt(d))]) + 6)); crowdPts.push(x, z, 1); }
      for (const sd of [-1, 1]) run(200, L - 300, sd, { rows: 1, dens: 0.05, clump: 0.95, strip: false, label: 'BS groups' });
    }

    /* ---- the streets round the track: asphalt ribbons on the ground (cut off at the barriers: the mouths inside them are the track's),
       the main roads' lane lines, a strip of pavement along the busier ones ---- */
    const gS = new Chunks(384, true), gSl = new Chunks(384), gSp = new Chunks(384, true);
    const inTrack = (x, z) => { const n = nrNear(x, z); return n.i >= 0 && n.dd < 0.6; };
    for (const [wd, cls, pts] of D.st) {
      const hw = wd / 2, main = cls === 2 || cls === 3 || cls === 4, cs = cls === 1 ? [1.04, 1.04, 1.06] : cls === 5 ? [1.2, 1.05, 0.85] : [0.92, 0.92, 0.95];
      // resample every 3 m
      const Q = []; for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l / 3)); for (let q = 0; q < n; q++) Q.push([a[0] + (b[0] - a[0]) * q / n, a[1] + (b[1] - a[1]) * q / n]); }
      Q.push(pts[pts.length - 1]);
      let prev = null;
      for (let k = 0; k < Q.length; k++) {
        const a = Q[Math.max(0, k - 1)], b = Q[Math.min(Q.length - 1, k + 1)], tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1, nx = -tz / tl, nz = tx / tl, [x, z] = Q[k];
        for (let o = -hw; o <= hw + 0.01; o += Math.max(1, hw / 2)) ocSet(x + nx * o, z + nz * o, 1);
        if (inTrack(x, z) || inTrack(x + nx * hw, z + nz * hw) || inTrack(x - nx * hw, z - nz * hw) || seaD(x, z) > -3) { prev = null; continue; }
        const y = (xx, zz) => nrGround(xx, zz) + 0.05, L0 = [x - nx * hw, 0, z - nz * hw], R0 = [x + nx * hw, 0, z + nz * hw]; L0[1] = y(L0[0], L0[2]); R0[1] = y(R0[0], R0[2]);
        if (prev) { const g = gS.get(x, z), uv = (p) => [p[0] / 8, -p[2] / 8]; g.quadUp(prev[0], prev[1], R0, L0, [cs, cs, cs, cs], [uv(prev[0]), uv(prev[1]), uv(R0), uv(L0)]);
          if (main && k % 4 < 2) { const wl = [0.94, 0.94, 0.9], c0 = [prev[2][0], prev[2][1] + 0.02, prev[2][2]], c1 = [x, y(x, z) + 0.02, z]; gSl.get(x, z).quadUp([c0[0] - nx * 0.07, c0[1], c0[2] - nz * 0.07], [c0[0] + nx * 0.07, c0[1], c0[2] + nz * 0.07], [c1[0] + nx * 0.07, c1[1], c1[2] + nz * 0.07], [c1[0] - nx * 0.07, c1[1], c1[2] - nz * 0.07], [wl, wl, wl, wl]); }
          if (main) for (const sd of [-1, 1]) { const o0 = hw, o1 = hw + 2.2, pc = [0.86, 0.85, 0.82], A = [prev[2][0] + prev[3][0] * sd * o0, 0, prev[2][2] + prev[3][1] * sd * o0], B2 = [prev[2][0] + prev[3][0] * sd * o1, 0, prev[2][2] + prev[3][1] * sd * o1], C = [x + nx * sd * o1, 0, z + nz * sd * o1], Dd = [x + nx * sd * o0, 0, z + nz * sd * o0];
            for (const p of [A, B2, C, Dd]) { p[1] = nrGround(p[0], p[2]) + 0.12; ocSet(p[0], p[2], 1); } if (![A, B2, C, Dd].some(p => inTrack(p[0], p[2]))) gSp.get(x, z).quadUp(A, B2, C, Dd, [pc, pc, pc, pc], [[A[0] / 3, -A[2] / 3], [B2[0] / 3, -B2[2] / 3], [C[0] / 3, -C[2] / 3], [Dd[0] / 3, -Dd[2] / 3]]); } }
        prev = [L0, R0, [x, 0, z], [nx, nz]];
      }
    }
    gS.addTo(root, aMat, false, true); gSl.addTo(root, lMat, false, true);
    // the pavement along the track behind the walls (where there is town: not the beach side)
    { const gp2 = gSp, pc = [0.84, 0.83, 0.8];
      for (const side of [-1, 1]) for (let i = 0; i < N; i += 2) { const j = (i + 2) % N, bi = (side > 0 ? T.br[i] : T.bl[i]), bj = (side > 0 ? T.br[j] : T.bl[j]);
        const xi = T.px[i] + T.nx[i] * side * (bi + 3), zi = T.pz[i] + T.nz[i] * side * (bi + 3); if (seaD(xi, zi) > -60 || (side > 0 && PD && (T.pitAt(i * ds) || T.pitAt(j * ds)))) continue;
        if (Math.abs(bi - bj) > 1.5 || wide(i, side)) continue;
        const q = (k, o) => { const x = T.px[k] + T.nx[k] * side * o, z = T.pz[k] + T.nz[k] * side * o; return [x, Math.max(nrGround(x, z), T.hy[k] - 0.25) + 0.06, z]; };
        const A = q(i, bi + 0.45), B2 = q(i, bi + 3.4), C = q(j, bj + 3.4), Dd = q(j, bj + 0.45), uv = (p) => [p[0] / 3, -p[2] / 3];
        gp2.get(A[0], A[2]).quadUp(A, B2, C, Dd, [pc, pc, pc, pc], [uv(A), uv(B2), uv(C), uv(Dd)]);
        for (let o = bi; o < bi + 3.6; o += 1) { const [x, z] = atS(i * ds, side * o); ocSet(x, z, 5); } }
      gSp.addTo(root, pvMat, false, true); }

    /* ---- the buildings: the real footprints (concrete, painted in Thai pastels; flat roofs with parapets and water tanks, the houses under
       hipped tile roofs) and rows of shophouses filling the built-up land along the streets where the data has none ---- */
    const facMat = new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), shopT = ownTex(bgsShopTex()), shopMat = new THREE.MeshLambertMaterial({ map: shopT, vertexColors: true });
    const fac = new Chunks(160, true), shop = new Chunks(256, true), roofs = new Chunks(256);
    const PAL = [[0.97, 0.95, 0.9], [0.98, 0.92, 0.78], [0.95, 0.86, 0.72], [0.92, 0.95, 0.93], [0.86, 0.92, 0.96], [0.98, 0.86, 0.84], [0.88, 0.88, 0.86], [0.96, 0.96, 0.82], [0.8, 0.92, 0.84]];
    const SIGN = [[0.9, 0.2, 0.18], [0.15, 0.4, 0.8], [0.98, 0.78, 0.15], [0.2, 0.62, 0.3], [0.95, 0.5, 0.1], [0.96, 0.96, 0.95], [0.6, 0.15, 0.5]];
    const TILE = [[0.72, 0.3, 0.18], [0.6, 0.24, 0.16], [0.5, 0.36, 0.3], [0.32, 0.36, 0.42]];
    const tanks = roofs;
    let nBld = 0, nShop = 0;
    const wallsOf = (pts, y0, H, col, shopFront, seed) => {   // the walls of a footprint (y0 its foot): the ground floor a shop where it faces a street, the floors above windows
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length, fl = Math.max(1, Math.round(H / 3.3)), inside = [cx, y0 + H / 2, cz];
      for (let k = 0; k < pts.length; k++) {
        const a = pts[k], b = pts[(k + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.4) continue;
        const bays = Math.max(1, Math.round(len / 4)), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, ex = (b[1] - a[1]) / len, ez = -(b[0] - a[0]) / len;
        const out1 = ((mx + ex - cx) * ex + (mz + ez - cz) * ez) > 0 ? 1 : -1, fx = mx + ex * out1 * 5, fz = mz + ez * out1 * 5;   // (5 m out in front of this wall)
        const front = shopFront && fl >= 2 && len > 3 && ocGet(fx, fz) === 1;
        const g = (front ? shop : fac).get(cx, cz), y1 = front ? y0 + 3.6 : y0;
        if (front) g.quadO([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], vary(SIGN[Math.floor(crH(seed, k, 3) * SIGN.length)], R, 0.1), inside, [[0, 0], [bays, 0], [bays, 1], [0, 1]]);
        fac.get(cx, cz).quadO([a[0], y1, a[1]], [b[0], y1, b[1]], [b[0], y0 + H, b[1]], [a[0], y0 + H, a[1]], col, inside, [[0, 0], [bays, 0], [bays, Math.max(1, (H - (y1 - y0)) / 3.3)], [0, Math.max(1, (H - (y1 - y0)) / 3.3)]]);
      }
      return [cx, cz];
    };
    const flatRoof = (pts, y, col, cx, cz, seed) => {   // a flat roof (a fan of triangles: the footprints are near convex) with a parapet, now and then a water tank
      const g = roofs.get(cx, cz), rc = col.map(v => v * 0.78);
      for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; g.triO([cx, y, cz], [a[0], y, a[1]], [b[0], y, b[1]], rc, [cx, y - 5, cz]);
        g.quadO([a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + 0.6, b[1]], [a[0], y + 0.6, a[1]], col.map(v => v * 0.92), [cx, y, cz]); }
      if (crH(seed, 1, 9) < 0.45) { const t = tanks.get(cx, cz); cyl(t, cx + (crH(seed, 2, 9) - 0.5) * 2, y, cz + (crH(seed, 3, 9) - 0.5) * 2, 0.55, 1.3, 8, crH(seed, 4, 9) < 0.5 ? [0.18, 0.32, 0.62] : [0.82, 0.82, 0.84]); }
    };
    const placeBld = (pts, H, kind, seed) => {
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      let y0 = 1e9; for (const p of pts) y0 = Math.min(y0, nrGround(p[0], p[1])); y0 -= 0.2;
      const col = vary(PAL[Math.floor(crH(seed, 0, 5) * PAL.length)], R, 0.06);
      wallsOf(pts, y0, H, col, kind !== 2, seed);
      if (kind === 1 && pts.length >= 4) {   // a house: a hipped roof over its oriented box
        let bl = 0, ba = 0; for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > bl) { bl = l; ba = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
        let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; const c = Math.cos(ba), s = Math.sin(ba); for (const p of pts) { const u = (p[0] - cx) * c + (p[1] - cz) * s, v = -(p[0] - cx) * s + (p[1] - cz) * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
        const ux = cx + c * (u0 + u1) / 2 - s * (v0 + v1) / 2, uz = cz + s * (u0 + u1) / 2 + c * (v0 + v1) / 2;
        gable(roofs.get(cx, cz), ux, y0 + H, uz, u1 - u0 + 1, v1 - v0 + 1, Math.min(3, (v1 - v0) * 0.35), ba, TILE[Math.floor(crH(seed, 6, 5) * TILE.length)], col);
      } else flatRoof(pts, y0 + H, col, cx, cz, seed);
      CR.block(cx, cz, 6, 6, 0); nBld++;
    };
    D.bld.forEach(([H, kind, pts], n) => {
      if (pts.some(p => { const o = ocGet(p[0], p[1]); return o === 3 || o === 5 || o === 4; }) || seaD(...pts[0]) > -10) return;
      placeBld(pts, H, kind, n + 1);
      // mark it taken
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      for (let x = x0; x <= x1; x += 1.5) for (let z = z0; z <= z1; z += 1.5) if (inPoly(pts, x, z)) { const k = ocK(x, z); if (k >= 0 && occ[k] !== 3) occ[k] = 2; }
    });
    // the shophouse rows: 4 m units along the streets (and the track) in the built-up land, 2-4 floors, a run of 3-7 alike
    const FILL = (x, z, tx, tz, side, run) => {   // one unit: front at (x, z) on the street's edge, deep into the side
      const nx = -tz * side, nz = tx * side, dep = 9 + crH(x, z, 2) * 5, W = 4.1, pts = [[x - tx * W / 2, z - tz * W / 2], [x + tx * W / 2, z + tz * W / 2], [x + tx * W / 2 + nx * dep, z + tz * W / 2 + nz * dep], [x - tx * W / 2 + nx * dep, z - tz * W / 2 + nz * dep]];
      for (const [u, v] of [[0.1, 0.5], [0.9, 0.5], [0.1, dep - 0.5], [0.9, dep - 0.5], [0.5, dep / 2]]) { const px2 = pts[0][0] + tx * W * u + nx * v, pz2 = pts[0][1] + tz * W * u + nz * v; if (ocGet(px2, pz2) || nrLCf(px2, pz2, 3) < 0.3) return false; }
      const H = run.f * 3.3 + 0.6, y0 = Math.min(...pts.map(p => nrGround(p[0], p[1]))) - 0.2, cx = x + nx * dep / 2, cz = z + nz * dep / 2;
      // the front (shop below, the floors above with their windows), the side walls only at a run's ends, the roof with a parapet
      const g = shop.get(cx, cz), inside = [cx, y0 + H / 2, cz], a = pts[0], b = pts[1];
      g.quadO([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y0 + 3.6, b[1]], [a[0], y0 + 3.6, a[1]], run.sign[run.n % run.sign.length], inside, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      fac.get(cx, cz).quadO([a[0], y0 + 3.6, a[1]], [b[0], y0 + 3.6, b[1]], [b[0], y0 + H, b[1]], [a[0], y0 + H, a[1]], run.col, inside, [[0, 0], [1, 0], [1, run.f - 0.1], [0, run.f - 0.1]]);
      for (const [p, q] of [[pts[1], pts[2]], [pts[3], pts[0]]]) fac.get(cx, cz).quadO([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y0 + H, q[1]], [p[0], y0 + H, p[1]], run.col.map(v => v * 0.9), inside, [[0, 0], [2, 0], [2, run.f], [0, run.f]]);
      flatRoof(pts, y0 + H, run.col, cx, cz, Math.floor(x * 7 + z * 13));
      { const ax = tx * (W / 2 - 0.1), az = tz * (W / 2 - 0.1), y = y0 + 3.55; roofs.get(cx, cz).quadUp([x - ax, y, z - az], [x + ax, y, z + az], [x + ax - nx * 1.2, y - 0.25, z + az - nz * 1.2], [x - ax - nx * 1.2, y - 0.25, z - az - nz * 1.2], [run.awn, run.awn, run.awn, run.awn]); }   // the canopy over the shop front
      for (const [u, v] of [[0, 0], [W, 0], [0, dep], [W, dep], [W / 2, dep / 2], [0, dep / 2], [W, dep / 2]]) { const k = ocK(pts[0][0] + tx * u + nx * v, pts[0][1] + tz * u + nz * v); if (k >= 0 && !occ[k]) occ[k] = 2; }
      run.n++; nShop++; CR.block(cx, cz, W, dep, Math.atan2(tz, tx));
      return true;
    };
    const newRun = (x, z) => ({ n: 0, f: 2 + Math.floor(crH(x, z, 7) * 2.6), col: vary(PAL[Math.floor(crH(x, z, 8) * PAL.length)], R, 0.05), awn: SIGN[Math.floor(crH(x, z, 9) * SIGN.length)].map(v => v * 0.85),
      sign: [0, 1, 2].map(k => vary(SIGN[Math.floor(crH(x + k, z, 10) * SIGN.length)], R, 0.08)), left: 3 + Math.floor(crH(x, z, 11) * 5) });
    const rowsAlong = (Q, hw, maxD) => {   // Q: [[x, z], ...] a street's points 1 m apart
      for (const side of [-1, 1]) { let run = null, acc = 0;
        for (let k = 1; k + 1 < Q.length; k++) { acc += 1; if (acc < 4.15) continue; acc = 0;
          const [x0, z0] = Q[k - 1], [x1, z1] = Q[k + 1], tl = Math.hypot(x1 - x0, z1 - z0) || 1, tx = (x1 - x0) / tl, tz = (z1 - z0) / tl, [x, z] = Q[k];
          if (nrDist(x, z) > maxD) { run = null; continue; }
          const fx = x - tz * side * (hw + 1.6), fz = z + tx * side * (hw + 1.6);
          if (!run || run.left <= 0) run = newRun(fx, fz);
          if (FILL(fx, fz, tx, tz, side, run)) run.left--; else run = null; } } };
    for (const [wd, cls, pts] of D.st) { if (cls === 1 || cls === 5) continue;
      const Q = []; for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(l)); for (let q = 0; q < n; q++) Q.push([a[0] + (b[0] - a[0]) * q / n, a[1] + (b[1] - a[1]) * q / n]); }
      rowsAlong(Q, wd / 2 + 0.2, 340); }
    { const Q = []; for (let i = 0; i < N; i++) Q.push([T.px[i], T.pz[i]]); }   // (the track's own frontage: along its pavement, below)
    for (const side of [-1, 1]) { let run = null;
      for (let d = 0; d < L; d += 4.15) { const s = sAt(d), i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i]; if (wide(i, side)) { run = null; continue; }
        const [x, z] = atSf(s, side * (bar + 3.6)), tx = T.tx[i], tz = T.tz[i];
        if (!run || run.left <= 0) run = newRun(x, z); if (FILL(x, z, side > 0 ? tx : -tx, side > 0 ? tz : -tz, 1, run)) run.left--; else run = null; } }
    fac.addTo(root, facMat, true, true); shop.addTo(root, shopMat, false, true); roofs.addTo(root, matV, false, true);
    out.stats.buildings = nBld; out.stats.shophouses = nShop;

    /* ---- the junctions: the side streets' mouths inside the barriers (zebra crossings, stop lines; across the track at the traffic lights),
       and their street furniture, all of it knockable (Core's loose props) ---- */
    const gz = new GB(), zw = [0.95, 0.95, 0.93];
    const zebraAcross = (s, hw, depth) => {   // stripes across the track at s (along the road, 0.5 m wide, 0.5 m apart), depth m long
      for (let o = -w + 0.4; o < w - 0.4; o += 1.0) { const A = atSf(s, o), B2 = atSf(s, o + 0.5), C = atSf(s + depth, o + 0.5), Dd = atSf(s + depth, o), y = hyS(s) + 0.036;
        gz.quadUp([A[0], y, A[1]], [B2[0], y, B2[1]], [C[0], y, C[1]], [Dd[0], y, Dd[1]], [zw, zw, zw, zw]); } };
    const prop = (kind, x, z, yaw, i) => out.props.push({ kind, x, z, yaw, col: 0, i });
    const inside = (s, o) => { const i = T.idx(s), bar = o > 0 ? T.br[i] : T.bl[i]; return Math.abs(o) > w + 0.5 && Math.abs(o) < bar - 0.45; };
    let nJ = 0;
    for (const [d, side, ang, sw, kind] of BSD.jn) {
      if (!kind) continue;
      const s = sAt(d), i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], hd = T.hd[i], fwd = hd, back = hd + Math.PI, out2 = Math.atan2(T.nz[i] * side, T.nx[i] * side);
      const hw = sw / 2, mouth = bar - w;
      if (mouth < 3) continue; nJ++;
      // the zebra across the side street's mouth (stripes along the street), its stop line further in
      if (mouth > 4) { for (let a = -hw + 0.3; a < hw - 0.3; a += 1.0) { const o0 = side * (w + 1.2), o1 = side * (w + 4.2), A = atSf(s + a, o0), B2 = atSf(s + a + 0.5, o0), C = atSf(s + a + 0.5, o1), Dd = atSf(s + a, o1), y = hyS(s) + 0.036;
          gz.quadUp([A[0], y, A[1]], [B2[0], y, B2[1]], [C[0], y, C[1]], [Dd[0], y, Dd[1]], [zw, zw, zw, zw]); }
        if (mouth > 6) { const o0 = side * (w + 5), o1 = side * (w + 5.4), A = atSf(s - hw, o0), B2 = atSf(s + hw, o0), C = atSf(s + hw, o1), Dd = atSf(s - hw, o1), y = hyS(s) + 0.036; gz.quadUp([A[0], y, A[1]], [B2[0], y, B2[1]], [C[0], y, C[1]], [Dd[0], y, Dd[1]], [zw, zw, zw, zw]); } }
      const put = (kindP, a, o, yaw) => { const ss = s + a, oo = side * o; if (!inside(ss, oo)) return false; const [x, z] = atSf(ss, oo); prop(kindP, x, z, yaw, T.idx(ss)); return true; };
      if (kind === 2) {   // traffic lights at both corners (one for the track, one for the side street), the controller's cabinet, a lamp, a hydrant, bollards, a sign, a bin
        zebraAcross(s - hw - 9, w, 4);
        put('signalm', -hw - 1.6, w + 0.9, out2 + Math.PI); put('signal', hw + 1.6, w + 0.9, out2 + Math.PI);   // (the shared street furniture: +x towards the road, the mast arm over it)
        put('cabinet', -hw - 3.6, w + 1.1, hd); put('lamp', hw + 4.5, w + 0.8, out2 + Math.PI); put('hydrant', -hw - 5.5, w + 0.9, 0);
        for (let k = 0; k < 3; k++) { put('bollard', -hw - 0.6 + 0, w + 1.0 + k * 1.2, 0); put('bollard', hw + 0.6, w + 1.0 + k * 1.2, 0); }
        put('sign', hw + 2.8, w + 1.6, back); put('bin', -hw - 2.4, w + 2.6, 0); put('sign', -hw - 1.2, w + 4.2, out2);
      } else {   // a soi: a warning sign, bollards on its corners, a bin
        put('sign', -hw - 0.9, w + 0.9, back); put('bollard', -hw - 0.3, w + 1.1, 0); put('bollard', hw + 0.3, w + 1.1, 0); put('bollard', hw + 0.3, w + 2.3, 0);
        if (crH(d, side, 4) < 0.6) put('bin', hw + 1.4, w + 1.5, 0);
      }
    }
    addM(gz, lMat);
    out.stats.junctions = nJ;
    // the street lamps along the track behind the walls, and on the median of Sai 2 (solid scenery)
    { const lg = scen;
      for (let d = 15; d < L; d += 32) { const s = sAt(d), i = T.idx(s), side = d > 670 && d < 2165 ? 1 : -1, bar = side > 0 ? T.br[i] : T.bl[i]; if (wide(i, side)) continue;
        const [x, z] = atSf(s, side * (bar + (side > 0 ? 1.6 : 1.0))), y = nrGround(x, z), fx = -T.nx[i] * side, fz = -T.nz[i] * side, g = lg.get(x, z);
        cyl(g, x, y, z, 0.11, 9, 6, [0.62, 0.63, 0.66], null, 0.07); box(g, x + fx * 1.1, y + 8.8, z + fz * 1.1, 0.12, 0.1, 2.2, Math.atan2(fz, fx) + Math.PI / 2, [0.62, 0.63, 0.66]);
        box(g, x + fx * 2.1, y + 8.65, z + fz * 2.1, 0.32, 0.18, 0.7, Math.atan2(fz, fx) + Math.PI / 2, [0.36, 0.37, 0.4], [0.98, 0.95, 0.86]);
        if (side > 0) { box(g, x - fx * 1.1, y + 8.8, z - fz * 1.1, 0.12, 0.1, 2.2, Math.atan2(fz, fx) + Math.PI / 2, [0.62, 0.63, 0.66]); box(g, x - fx * 2.1, y + 8.65, z - fz * 2.1, 0.32, 0.18, 0.7, Math.atan2(fz, fx) + Math.PI / 2, [0.36, 0.37, 0.4]); }
      } }

    /* ---- the power poles behind the walls on the town's side, the bundles of cables sagging from pole to pole (lines), a transformer now and then ---- */
    const cab = [];
    { let prev = null;
      for (let d = 8; d < L + 8; d += 34) { const s = sAt(d), i = T.idx(s), side = -1, bar = T.bl[i];
        if (wide(i, side) || (d > 2165 && d < 2245)) { prev = null; continue; }
        const [x, z] = atSf(s, side * (bar + 2.2)), y = nrGround(x, z), g = scen.get(x, z), hd = T.hd[i];
        cyl(g, x, y - 0.3, z, 0.16, 10.3, 6, [0.72, 0.72, 0.7], null, 0.11);
        for (const h of [8.6, 9.4]) box(g, x, y + h, z, 0.12, 0.12, 1.8, hd, [0.6, 0.6, 0.6]);
        if (crH(d, 1, 33) < 0.18) { cyl(g, x + T.nx[i] * side * 0.4, y + 6.4, z + T.nz[i] * side * 0.4, 0.42, 1.3, 8, [0.5, 0.52, 0.54], [0.4, 0.42, 0.44]); }
        const tops = []; for (let k = 0; k < 7; k++) { const h = k < 3 ? 9.4 : k < 5 ? 8.6 : 7.6 - (k - 5) * 0.5, a = k < 3 ? (k - 1) * 0.8 : k < 5 ? (k - 3.5) * 1.1 : 0.2; tops.push([x + Math.cos(hd + Math.PI / 2) * a, y + h, z + Math.sin(hd + Math.PI / 2) * a]); }
        if (prev) for (let k = 0; k < 7; k++) { const A = prev[k], B2 = tops[k], sag = 0.7 + k * 0.12; let pa = A; for (let q = 1; q <= 6; q++) { const t = q / 6, pb = [A[0] + (B2[0] - A[0]) * t, A[1] + (B2[1] - A[1]) * t - sag * 4 * t * (1 - t), A[2] + (B2[2] - A[2]) * t]; cab.push(...pa, ...pb); pa = pb; } }
        prev = tops; }
      // and along the side streets near the track: poles every 30 m, the same bundles
      for (const [wd, cls, pts] of D.st) { if (cls === 1 || cls === 5) continue; let acc = 0, pv = null;
        for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / (l || 1), tz = (b[1] - a[1]) / (l || 1);
          for (let t = 0; t < l; t += 2) { acc += 2; if (acc < 30) continue; acc = 0;
            const x = a[0] + tx * t - tz * (wd / 2 + 1.2), z = a[1] + tz * t + tx * (wd / 2 + 1.2); if (nrDist(x, z) > 260 || inTrack(x, z) || ocGet(x, z) === 2) { pv = null; continue; }
            const y = nrGround(x, z); cyl(scen.get(x, z), x, y - 0.3, z, 0.15, 9.8, 5, [0.72, 0.72, 0.7], null, 0.11);
            const tp = [0, 1, 2, 3].map(q => [x - tz * (q - 1.5) * 0.4, y + 8.8 - (q % 2) * 0.6, z + tx * (q - 1.5) * 0.4]);
            if (pv) for (let q = 0; q < 4; q++) { const A = pv[q], B2 = tp[q]; let pa = A; for (let m = 1; m <= 5; m++) { const u = m / 5, pb = [A[0] + (B2[0] - A[0]) * u, A[1] + (B2[1] - A[1]) * u - 0.8 * 4 * u * (1 - u), A[2] + (B2[2] - A[2]) * u]; cab.push(...pa, ...pb); pa = pb; } }
            pv = tp; } } }
      const cg2 = new THREE.BufferGeometry(); cg2.setAttribute('position', new THREE.Float32BufferAttribute(cab, 3)); cg2.computeBoundingSphere();
      const cl = new THREE.LineSegments(cg2, new THREE.LineBasicMaterial({ color: 0x1b1c1e })); cl.matrixAutoUpdate = false; root.add(cl); out.stats.cables = cab.length / 6; }

    /* ---- the life of the street behind the walls: spirit houses on their posts, motorbikes parked in rows by the shops, cars in the side streets,
       plastic water barriers closing the side streets, a bus shelter ---- */
    { let nSp = 0, nMb = 0;
      const MB = [[0.85, 0.12, 0.12], [0.12, 0.14, 0.16], [0.92, 0.92, 0.9], [0.18, 0.36, 0.72], [0.6, 0.62, 0.66], [0.95, 0.6, 0.12]];
      const moto = (g, x, z, rot, c) => { const y = nrGround(x, z), cs = Math.cos(rot), sn = Math.sin(rot);
        box(g, x, y, z, 1.6, 0.55, 0.12, rot, [0.06, 0.06, 0.07], null, true); box(g, x, y + 0.3, z, 1.4, 0.42, 0.36, rot, c, [0.08, 0.08, 0.09], true);   // (wheels, the body and its dark seat on top)
        box(g, x + cs * 0.6, y + 0.7, z + sn * 0.6, 0.12, 0.4, 0.6, rot, [0.15, 0.15, 0.16], null, true); };
      const spirit = (g, x, z, rot) => { const y = nrGround(x, z); box(g, x, y, z, 0.35, 1.3, 0.35, rot, [0.92, 0.9, 0.84]); box(g, x, y + 1.3, z, 1.0, 0.1, 0.9, rot, [0.85, 0.65, 0.2]);
        box(g, x, y + 1.4, z, 0.7, 0.55, 0.55, rot, [0.95, 0.92, 0.85]); gable(g, x, y + 1.95, z, 0.95, 0.75, 0.45, rot, [0.82, 0.18, 0.12], [0.95, 0.72, 0.2]);
        cone(g, x, y + 2.4, z, 0.05, 0.3, 4, [0.95, 0.75, 0.2], null, 0); for (const a of [-0.6, 0.6]) box(g, x + Math.cos(rot) * a, y + 1.4, z + Math.sin(rot) * a, 0.14, 0.2, 0.1, rot, [0.9, 0.3, 0.5]); };   // (garlands)
      for (const side of [-1, 1]) for (let d = 10; d < L; d += 9) { const s = sAt(d), i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i]; if (wide(i, side) || (side > 0 && PD && T.pitAt(s))) continue;
        const r = crH(d, side, 41), [x, z] = atSf(s, side * (bar + 2.4)); if (ocGet(x, z) === 2 || seaD(x, z) > -40 || inTrack(x, z)) continue;
        const g = scen.get(x, z), hd = T.hd[i];
        if (r < 0.2) { const n = 2 + Math.floor(crH(d, side, 42) * 3); for (let k = 0; k < n; k++) { const [mx, mz] = atSf(s + k * 0.95, side * (bar + 2.3)); if (pitRoadAt(mx, mz, 1)) continue; moto(g, mx, mz, hd + side * 1.2, MB[Math.floor(crH(d + k, side, 43) * MB.length)]); nMb++; } }   // (none on the pit road's junction)
        else if (r < 0.4) { spirit(g, x, z, hd + (side > 0 ? -Math.PI / 2 : Math.PI / 2)); nSp++; }
      }
      // plastic water barriers (red and white) across each side street a little behind the wall, cars parked behind them
      const CARS = [[0.92, 0.92, 0.92], [0.2, 0.2, 0.22], [0.62, 0.64, 0.68], [0.75, 0.12, 0.12], [0.2, 0.32, 0.6], [0.95, 0.95, 0.95]];
      for (const [d, side, ang, sw, kind] of BSD.jn) { if (!kind) continue; const s = sAt(d), i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i];
        for (let a = -sw / 2; a <= sw / 2; a += 1.1) { const [x, z] = atSf(s + a, side * (bar + 3.5)); if (inTrack(x, z)) continue; const y = nrGround(x, z); box(scen.get(x, z), x, y, z, 1.0, 0.8, 0.45, T.hd[i], Math.round(a) % 2 ? [0.85, 0.12, 0.1] : [0.95, 0.95, 0.94]); }
        for (let k = 0; k < 3; k++) { const [x, z] = atSf(s + (k % 2 ? 1.6 : -1.6), side * (bar + 9 + k * 6)); if (inTrack(x, z) || ocGet(x, z) === 2) continue; const y = nrGround(x, z), c = CARS[Math.floor(crH(d, k, 47) * CARS.length)], rot = out2rot(i, side);
          const g = scen.get(x, z), cs = Math.cos(rot), sn = Math.sin(rot); box(g, x, y + 0.25, z, 4.3, 0.75, 1.75, rot, c, c); box(g, x - cs * 0.2, y + 1.0, z - sn * 0.2, 2.3, 0.55, 1.6, rot, [0.18, 0.22, 0.28], c); } }
      function out2rot(i, side) { return Math.atan2(T.nz[i] * side, T.nx[i] * side); }
      out.stats.spirit = nSp; out.stats.motorbikes = nMb; }

    /* ---- the temples (simplified, generic): a white hall on a terrace under tiers of orange roofs with green edges, gold at the ridges; one
       by the hairpin, one off Sai 2 ---- */
    for (const [tx0, tz0, rot0] of BSD.temples || []) {
      let x = tx0, z = tz0; for (let k = 0; k < 30 && (ocGet(x, z) === 3 || ocGet(x, z) === 1); k++) { x += (R() - 0.5) * 12; z += (R() - 0.5) * 12; }
      const y = nrGround(x, z), g = scen.get(x, z), rot = rot0 || 0, cs = Math.cos(rot), sn = Math.sin(rot), OR = [0.9, 0.42, 0.12], GR = [0.16, 0.42, 0.3], GD = [0.95, 0.75, 0.2], WH = [0.96, 0.95, 0.92];
      box(g, x, y - 0.5, z, 20, 1.6, 12, rot, [0.86, 0.84, 0.8]); box(g, x, y + 1.1, z, 16, 5.4, 8.5, rot, WH, WH);
      for (let k = 0; k < 4; k++) { const sc = 1 - k * 0.12; box(g, x, y + 6.5 + k * 2.1, z, 18.5 * sc, 0.3, 11 * sc, rot, GR, GR); gable(g, x, y + 6.8 + k * 2.1, z, 18 * sc, 10.5 * sc, 3.6 * sc, rot, k % 2 ? [0.82, 0.28, 0.1] : OR, GD); }
      for (const a of [-9.4, 9.4]) cone(g, x + cs * a, y + 15.5, z + sn * a, 0.25, 2.4, 5, GD, GD, 0);   // (the finials at the ridge's ends)
      for (const a of [-6, -2, 2, 6]) for (const b of [-4.6, 4.6]) cyl(g, x + cs * a - sn * b, y + 1.1, z + sn * a + cs * b, 0.35, 5.4, 6, WH, WH);
      box(g, x - sn * 9, y + 1.1, z + cs * 9, 2.4, 9, 2.4, rot, WH, GD); cone(g, x - sn * 9, y + 10.1, z + cs * 9, 1.4, 6, 8, GD, GD, 0);   // a small chedi beside it
      ocDisc(x, z, 13, 2); CR.block(x, z, 20, 13, rot);
    }

    /* ---- the trees: coconut palms and casuarinas on the beach (sunshades and deckchairs under them), palms along the beach road, rain trees
       where the land cover has trees, shrubs on Sai 2's median ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true }), TG = [0, 1, 2, 5].map(bgsTreeGeo), TF = [3, 4].map(bgsTreeGeo);
    const tk = TG.map(gq => new IChunks(gq, tMat, 192)), tf = TF.map(gq => new IChunks(gq, tMat, 640));
    let nTrees = 0; const maxT = Math.round(9000 * dens);
    const treeOk = (x, z, r) => { if (inTrack(x, z)) return false; const n = nrNear(x, z); if (n.i >= 0 && n.dd < r) return false; const o = ocGet(x, z); return o === 0 || o === 4; };
    {
      const Lt = NRC * NRT;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { if (!G.on[tj * G.ntx + ti]) continue; const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 5.5) for (let xx = xa; xx < xa + Lt; xx += 5.5) { if (nTrees >= maxT) break;
          const x = xx + (R() - 0.5) * 4.6, z = zz + (R() - 0.5) * 4.6, r1 = R(), r2 = R(), sd = seaD(x, z), rd = nrDist(x, z);
          if (sd > -6 || rd > 330) continue;
          const beach = sd > -48, cl = nrLC(x, z), far = rd > 55;
          const p = beach ? 0.24 : cl === 1 ? 0.5 : cl === 0 ? 0.06 : 0.02;
          if (r1 > p || !treeOk(x, z, beach ? 1.5 : rd < 40 ? 7 : 3) || nrGround(x, z) < SEA + 0.4) continue;
          const y = nrGround(x, z), cv = 0.86 + R() * 0.26, col = [cv * (0.95 + R() * 0.1), cv, cv * (0.94 + R() * 0.1)];
          let sp, hgt;
          if (beach) { sp = r2 < 0.55 ? 1 : 0; hgt = sp ? 11 + R() * 7 : 9 + R() * 6; } else { sp = r2 < (rd < 45 ? 0.7 : 0.18) ? 0 : 2; hgt = sp === 0 ? 10 + R() * 6 : 8 + R() * 6; }
          if (far) (sp === 0 ? tf[0] : tf[1]).add(x, y - 0.1, z, R() * TAU, hgt * (sp === 2 ? 1.2 : 0.75), hgt, col);
          else tk[sp].add(x, y - 0.1, z, R() * TAU, sp === 2 ? hgt * 1.05 : sp === 1 ? hgt * 0.7 : hgt, hgt, col);
          nTrees++; } }
      // palms along the beach side of the beach road (behind the wall, on the promenade), shrubs on Sai 2's median
      for (let d = 0; d < L; d += 13) { const s = sAt(d), i = T.idx(s);
        if (seaD(...atS(s, 0)) > -110 && !(PD && T.pitAt(s))) { const [x, z] = atSf(s, T.br[i] + 4 + R() * 2); if (treeOk(x, z, 1.5)) { const h = 8 + R() * 5; tk[0].add(x, nrGround(x, z) - 0.1, z, R() * TAU, h, h, [1, 1, 1]); nTrees++; } }
        if (d > 680 && d < 2160 && crH(d, 2, 51) < 0.7) { const [x, z] = atSf(s, T.br[i] + 1.4); const h = 1.2 + R() * 0.8; tk[3].add(x, nrGround(x, z) - 0.2, z, R() * TAU, h * 1.4, h, [1, 1, 1]); }
      }
    }
    for (const t of tk) t.addTo(root, true); for (const t of tf) t.addTo(root, false);
    out.stats.trees = nTrees;
    // the beach: sunshades in rows and deckchairs under them, a few food carts and vendors' tents on the promenade
    { const bg = scen, UC = [[0.9, 0.2, 0.16], [0.2, 0.45, 0.85], [0.98, 0.75, 0.15], [0.25, 0.62, 0.3], [0.95, 0.5, 0.65], [0.95, 0.95, 0.93]]; let nU = 0;
      for (let d = 0; d < L; d += 7) { const s = sAt(d), i = T.idx(s), [cx, cz] = atS(s, 0); if (seaD(cx, cz) < -120) continue;
        for (let o = T.br[i] + 12; o < T.br[i] + 90; o += 7) { const [x, z] = atSf(s + (R() - 0.5) * 3, o), sd = seaD(x, z); if (sd < -42 || sd > -9 || ocGet(x, z) === 5 || ocGet(x, z) === 2 || inTrack(x, z)) continue;
          if (R() > 0.55) continue; const y = nrGround(x, z), g = bg.get(x, z), c = UC[Math.floor(R() * UC.length)];
          cyl(g, x, y, z, 0.04, 2.3, 4, [0.85, 0.85, 0.85]); cone(g, x, y + 1.85, z, 1.4, 0.55, 8, c, [0.95, 0.95, 0.93], R());
          for (const a of [-0.7, 0.7]) { const hx = x + T.tx[i] * a, hz = z + T.tz[i] * a; box(g, hx, y + 0.15, hz, 0.6, 0.25, 1.8, T.hd[i] + Math.PI / 2, [0.95, 0.95, 0.92], [0.2, 0.42, 0.75]); }
          nU++; } }
      for (let d = 0; d < L; d += 45) { const s = sAt(d), i = T.idx(s), [x, z] = atSf(s, T.br[i] + 7); if (seaD(x, z) < -60 || seaD(x, z) > -12 || ocGet(x, z) === 5 || inTrack(x, z) || (PD && T.pitAt(s))) continue;
        const y = nrGround(x, z), g = bg.get(x, z), hd = T.hd[i], c = UC[Math.floor(R() * UC.length)];
        box(g, x, y + 0.3, z, 1.8, 0.9, 1.0, hd, [0.7, 0.72, 0.75], [0.85, 0.85, 0.86]); for (const a of [-0.6, 0.6]) box(g, x + T.tx[i] * a, y, z + T.tz[i] * a, 0.12, 0.6, 0.12, hd, [0.1, 0.1, 0.1]);   // a food cart, its umbrella
        cyl(g, x, y + 1.2, z, 0.03, 1.2, 4, [0.8, 0.8, 0.8]); cone(g, x, y + 2.1, z, 1.3, 0.5, 8, c, c, 0);
        if (crH(d, 3, 61) < 0.5) { const [x2, z2] = atSf(s + 5, T.br[i] + 8); const y2 = nrGround(x2, z2); box(g, x2, y2, z2, 3, 2.2, 3, hd, [0.95, 0.95, 0.93], null, true); gable(g, x2, y2 + 2.2, z2, 3.2, 3.2, 0.9, hd, c, c); } }
      out.stats.sunshades = nU; }

    /* ---- the sea out to the horizon, the shore band along the beach (foam), the far land: the hills (Khao Sam Muk) and the town beyond ---- */
    {
      const WO = { len: 2.4, amp: 1.2, refl: 0.38, shal: 0.75, lap: 1, surf: 0.8 }, g = new THREE.PlaneGeometry(9000, 9000, 1, 1).rotateX(-Math.PI / 2);
      const sea = new THREE.Mesh(g, waterMat(tex, Object.assign({ color: 0x6fa8c4 }, WO))); sea.position.set((P.x0 + P.x1) / 2 - 3000, SEA, (P.z0 + P.z1) / 2); sea.receiveShadow = true; sea.matrixAutoUpdate = false; sea.updateMatrix(); root.add(sea); out.dyn.water = tex.water;
      const i0 = 0, i1 = G.nx - 1, j0 = 0, j1 = G.nz - 1;
      addShore(root, shoreBand(G.x0, G.z0, G.x0 + i1 * NRC, G.z0 + j1 * NRC, SEA + 0.015, waterline(nrGH, G.x0, G.z0, NRC, i0, i1, j0, j1, SEA), 22, { F: 4 }), sea.material, WO);
      // the far land (def.bs.far, 64 m cells) where the corridor's terrain does not reach, a little lower so its edge hides under the near tiles
      const F = BSD.far, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(j * n + i) * F.step, gf = new GB();
      const colF = (h, x, z) => { const t = clamp(h / 30, 0, 1), k = 0.9 + crH(Math.floor(x / 64), Math.floor(z / 64), 3) * 0.15; return h < SEA + 0.6 ? [0.86, 0.8, 0.62] : [lerp(0.36, 0.2, t) * k, lerp(0.42, 0.34, t) * k, lerp(0.3, 0.2, t) * k]; };
      for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) {
        const x = F.x0 + (i + 0.5) * F.cell, z = F.z0 + (j + 0.5) * F.cell; if (nrDist(x, z) < 520 && x > P.x0 && x < P.x1 && z > P.z0 && z < P.z1) continue;
        const q = (a, b) => { const xx = F.x0 + a * F.cell, zz = F.z0 + b * F.cell, h = H(a, b) - 0.6; return [xx, h, zz]; };
        const A = q(i, j), B2 = q(i + 1, j), C = q(i + 1, j + 1), Dd = q(i, j + 1); if (Math.max(A[1], B2[1], C[1], Dd[1]) < SEA - 0.2) continue;
        gf.quadUp(A, B2, C, Dd, [colF(A[1], A[0], A[2]), colF(B2[1], B2[0], B2[2]), colF(C[1], C[0], C[2]), colF(Dd[1], Dd[0], Dd[2])]);
      }
      const fm = addM(gf, matV); if (fm) fm.castShadow = false;
      // the far town: low blocks on the flat land beyond the corridor (one instanced box; roofs light), trees as dark lumps on the hills
      const bxg = (() => { const b = new GB(); box(b, 0, 0, 0, 1, 1, 1, 0, [0.9, 0.88, 0.84], [0.72, 0.66, 0.6]); return b.geometry(); })(), fb = new IChunks(bxg, matV, 512), RF = rng(3741);
      for (let k = 0; k < 1500; k++) { const x = F.x0 + RF() * (n - 1) * F.cell, z = F.z0 + RF() * (n - 1) * F.cell; if (nrDist(x, z) < 560) continue;
        const gi = Math.floor((x - F.x0) / F.cell), gj = Math.floor((z - F.z0) / F.cell), h = H(gi, gj); if (h < SEA + 1.2 || h > 12) continue;
        const hh = 5 + RF() * RF() * 26, c = 0.85 + RF() * 0.2; fb.add(x, h - 1, z, RF() * TAU, 10 + RF() * 14, hh, [c, c * 0.98, c * 0.95]); }
      fb.addTo(root, false);
      const th = new IChunks(TF[1], tMat, 512);
      for (let k = 0; k < 900; k++) { const x = F.x0 + RF() * (n - 1) * F.cell, z = F.z0 + RF() * (n - 1) * F.cell; if (nrDist(x, z) < 560) continue;
        const gi = Math.floor((x - F.x0) / F.cell), gj = Math.floor((z - F.z0) / F.cell), h = H(gi, gj); if (h < 10) continue; th.add(x, h - 1, z, RF() * TAU, 16, 13, [0.8, 0.85, 0.8]); }
      th.addTo(root, false);
    }

    /* ---- the piers at Laem Thaen (their real outlines): a concrete deck on piles over the water, its railings and lamps, a pavilion with a
       stepped orange roof; long-tail fishing boats (painted hulls, a canopy, garlands on the bow) moored off the cape and drawn up on the sand;
       Thai flags along the beach road; songthaews and tuk-tuks parked in the side streets; blue direction boards over the road (no words) ---- */
    { const pg = scen, dk = [0.78, 0.77, 0.74], pl = [0.6, 0.6, 0.58], yD = SEA + 1.6;
      for (const [kind, pts] of BSD.piers || []) {
        if (kind === 'P') { const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length;
          for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1]; pg.get(cx, cz).triO([cx, yD, cz], [a[0], yD, a[1]], [b[0], yD, b[1]], dk, [cx, yD - 3, cz]);
            pg.get(cx, cz).quadO([a[0], yD - 0.5, a[1]], [b[0], yD - 0.5, b[1]], [b[0], yD, b[1]], [a[0], yD, a[1]], pl, [cx, yD, cz]);
            const l = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let t = 0; t < l; t += 6) { const x = a[0] + (b[0] - a[0]) * t / l, z = a[1] + (b[1] - a[1]) * t / l; cyl(pg.get(x, z), x, SEA - 2, z, 0.25, 3.6, 5, pl); box(pg.get(x, z), x, yD, z, 0.12, 1.0, 0.12, 0, [0.9, 0.9, 0.88]); } }
          const g = pg.get(cx, cz); box(g, cx, yD, cz, 10, 3.2, 8, 0.52, [0.95, 0.94, 0.9], null, true); for (let q = 0; q < 2; q++) gable(g, cx, yD + 3.2 + q * 1.3, cz, 12 - q * 3, 9.5 - q * 2.5, 2.2 - q * 0.6, 0.52, q ? [0.82, 0.28, 0.1] : [0.9, 0.42, 0.12], [0.95, 0.75, 0.2]);   // the pavilion (sala)
          ocDisc(cx, cz, 30, 5); }
        else for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l, nx = -uz * 2.2, nz = ux * 2.2, g = pg.get((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
          g.quadUp([a[0] - nx, yD, a[1] - nz], [a[0] + nx, yD, a[1] + nz], [b[0] + nx, yD, b[1] + nz], [b[0] - nx, yD, b[1] - nz], [dk, dk, dk, dk]);
          for (let t = 0; t < l; t += 5) { const x = a[0] + ux * t, z = a[1] + uz * t; for (const sd of [-1, 1]) { cyl(g, x + nx * sd, SEA - 2, z + nz * sd, 0.2, 3.5, 5, pl); box(g, x + nx * sd, yD, z + nz * sd, 0.1, 1.0, 0.1, 0, [0.9, 0.9, 0.88]); }
            if (t % 20 === 0) { cyl(g, x + nx, yD, z + nz, 0.07, 4.5, 5, [0.62, 0.63, 0.66]); box(g, x + nx * 0.8, yD + 4.4, z + nz * 0.8, 0.3, 0.2, 0.3, 0, [0.98, 0.95, 0.85]); } }
          for (const sd of [-1, 1]) g.quadO([a[0] + nx * sd, yD + 0.95, a[1] + nz * sd], [b[0] + nx * sd, yD + 0.95, b[1] + nz * sd], [b[0] + nx * sd, yD + 1.05, b[1] + nz * sd], [a[0] + nx * sd, yD + 1.05, a[1] + nz * sd], [0.9, 0.9, 0.88], [(a[0] + b[0]) / 2, yD + 1, (a[1] + b[1]) / 2]); }
      }
      // the boats: one instanced long-tail boat (hull, a canopy on posts, the engine's long shaft astern), tinted per boat
      const bgq = (() => { const g = new GB(), H = [1, 1, 1], C = [0.95, 0.93, 0.88];
        g.quadO([-4.5, 0.2, 0], [0, 0, -0.9], [0, 0.85, -1.0], [-5.0, 1.15, 0], H, [0, 0.5, 0]); g.quadO([-4.5, 0.2, 0], [0, 0, 0.9], [0, 0.85, 1.0], [-5.0, 1.15, 0], H, [0, 0.5, 0]);
        g.quadO([0, 0, -0.9], [4, 0.1, -0.7], [4, 0.85, -0.8], [0, 0.85, -1.0], H, [0, 0.5, 0]); g.quadO([0, 0, 0.9], [4, 0.1, 0.7], [4, 0.85, 0.8], [0, 0.85, 1.0], H, [0, 0.5, 0]);
        g.quadO([4, 0.1, -0.7], [4, 0.1, 0.7], [4, 0.85, 0.8], [4, 0.85, -0.8], H, [0, 0.5, 0]);
        g.quadUp([-4.5, 0.6, 0], [0, 0.6, 0.85], [4, 0.6, 0.7], [0, 0.6, -0.85], [[0.5, 0.36, 0.22], [0.5, 0.36, 0.22], [0.5, 0.36, 0.22], [0.5, 0.36, 0.22]]);
        g.quadUp([-0.5, 2.0, -1.0], [-0.5, 2.0, 1.0], [2.8, 2.0, 1.0], [2.8, 2.0, -1.0], [C, C, C, C]);
        for (const [x, z] of [[-0.4, -0.8], [-0.4, 0.8], [2.7, -0.8], [2.7, 0.8]]) box(g, x, 0.6, z, 0.08, 1.4, 0.08, 0, [0.4, 0.3, 0.2]);
        box(g, 4.6, 0.7, 0, 3.2, 0.08, 0.08, 0.12, [0.25, 0.25, 0.27]); box(g, 3.9, 0.85, 0, 0.6, 0.4, 0.4, 0, [0.3, 0.3, 0.32]);
        for (const [x, y] of [[-5.0, 1.12], [-4.8, 1.0]]) box(g, x, y, 0, 0.12, 0.12, 0.3, 0, [0.95, 0.3, 0.5]);
        const geo = g.geometry(); geo.computeBoundingSphere(); return geo; })();
      const boats = new IChunks(bgq, matV, 640), RB2 = rng(3742), HC = [[0.2, 0.42, 0.75], [0.15, 0.55, 0.45], [0.85, 0.2, 0.18], [0.95, 0.75, 0.2], [0.92, 0.92, 0.9], [0.4, 0.62, 0.85]]; let nBoat = 0;
      for (let k = 0; k < 900 && nBoat < 46; k++) { const p = CO[Math.floor(RB2() * CO.length)], ox = (RB2() - 0.5) * 300, oz = (RB2() - 0.5) * 300, x = p[0] + ox, z = p[1] + oz, sd = seaD(x, z);
        if (z > -500 || nrDist(x, z) > 900) continue;   // (off the cape: the north end)
        const beachB = sd > -14 && sd < -6 && nBoat % 4 === 3, water = sd > 25 && sd < 260 && nrGround(x, z) < SEA - 0.6;
        if (!beachB && !water) continue;
        const y = water ? SEA - 0.25 : nrGround(x, z) - 0.1; boats.add(x, y, z, RB2() * TAU, 1, 1, HC[Math.floor(RB2() * HC.length)]); nBoat++; }
      boats.addTo(root, true); out.stats.boats = nBoat;
      // Thai flags (red, white, blue, white, red) on poles along the beach road behind the wall and at the big junctions
      const flag = (x, z, rot) => { const y = nrGround(x, z), g = scen.get(x, z), cs = Math.cos(rot), sn = Math.sin(rot); cyl(g, x, y, z, 0.05, 6.5, 5, [0.88, 0.88, 0.9]);
        const st = [[0.8, 0.1, 0.14], [0.95, 0.95, 0.94], [0.12, 0.18, 0.5], [0.12, 0.18, 0.5], [0.95, 0.95, 0.94], [0.8, 0.1, 0.14]];
        for (let k = 0; k < 6; k++) { const y0 = y + 6.3 - (k + 1) * 0.2, y1 = y0 + 0.2, A = [x, y0, z], B2 = [x + cs * 1.8, y0, z + sn * 1.8]; g.quadO(A, B2, [B2[0], y1, B2[2]], [x, y1, z], st[k], [x - sn, y0, z + cs]); g.quadO(A, B2, [B2[0], y1, B2[2]], [x, y1, z], st[k], [x + sn, y0, z - cs]); } };
      for (let d = -140; d < 340; d += 30) { const s = sAt(d), i = T.idx(s), [x, z] = atSf(s, -(T.bl[i] + 1.4)); if (!inTrack(x, z) && ocGet(x, z) !== 2) flag(x, z, T.hd[i] + 0.4); }
      for (const [d, side, , , kind] of BSD.jn) if (kind === 2) { const s = sAt(d + 12), i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i]; if (wide(i, side)) continue; const [x, z] = atSf(s, side * (bar + 1.2)); if (!inTrack(x, z)) flag(x, z, T.hd[i] + 0.4); }
      // songthaews (a pick-up with a roofed bench bed) and tuk-tuks parked along the side streets behind their closures
      const ST = [[0.2, 0.4, 0.8], [0.85, 0.2, 0.18], [0.95, 0.85, 0.2], [0.25, 0.6, 0.35], [0.92, 0.92, 0.9]];
      for (const [d, side, , , kind] of BSD.jn) { if (!kind) continue; const s = sAt(d), i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], rot = Math.atan2(T.nz[i] * side, T.nx[i] * side), cs = Math.cos(rot), sn = Math.sin(rot);
        for (let k = 0; k < 2; k++) { const [x, z] = atSf(s + (k ? -2.2 : 2.2), side * (bar + 26 + k * 7)); if (inTrack(x, z) || ocGet(x, z) === 2) continue; const y = nrGround(x, z), g = scen.get(x, z), c = ST[Math.floor(crH(d, k, 91) * ST.length)];
          if ((d + k) % 3) { box(g, x + cs * 1.4, y + 0.3, z + sn * 1.4, 1.8, 1.2, 1.8, rot, c, c); box(g, x - cs * 1.0, y + 0.3, z - sn * 1.0, 3.0, 0.7, 1.8, rot, c, c); box(g, x - cs * 1.0, y + 2.0, z - sn * 1.0, 3.2, 0.12, 1.9, rot, c, c);   // a songthaew
            for (const sd2 of [-1, 1]) box(g, x - cs * 1.0 - sn * sd2 * 0.88, y + 1.0, z - sn * 1.0 + cs * sd2 * 0.88, 3.0, 1.0, 0.06, rot, [0.25, 0.25, 0.27]); }
          else { box(g, x, y + 0.2, z, 2.6, 0.7, 1.3, rot, c, c); box(g, x - cs * 0.3, y + 1.6, z - sn * 0.3, 2.2, 0.1, 1.4, rot, [0.12, 0.3, 0.6], [0.12, 0.3, 0.6]); for (const a of [0.8, -1.1]) box(g, x + cs * a, y + 0.9, z + sn * a, 0.08, 0.8, 1.2, rot, [0.3, 0.3, 0.32]); } } }   // a tuk-tuk
      // blue direction boards on gantries over the road before Turn 3 and before the hairpin (white arrows, no words)
      for (const d of [560, 2090]) { const s = sAt(d), i = T.idx(s), hd = T.hd[i], bl = T.bl[i] + 1.0, br = T.br[i] + 1.0, [xl, zl] = atSf(s, -bl), [xr, zr] = atSf(s, br), y = T.hy[i], g = scen.get(xl, zl);
        for (const [x, z] of [[xl, zl], [xr, zr]]) cyl(g, x, y - 0.3, z, 0.18, 7.3, 6, [0.62, 0.63, 0.66]);
        const [mx, mz] = atSf(s, (br - bl) / 2); box(g, mx, y + 6.6, mz, 0.2, 0.3, bl + br, hd, [0.62, 0.63, 0.66]);
        const fx = -T.tx[i], fz = -T.tz[i], bw = Math.min(9, (bl + br) * 0.7), ux = T.nx[i], uz = T.nz[i], o = [mx + fx * 0.15, mz + fz * 0.15], BL = [0.1, 0.3, 0.68], WH = [0.95, 0.95, 0.94];
        g.quadO([o[0] - ux * bw / 2, y + 5.0, o[1] - uz * bw / 2], [o[0] + ux * bw / 2, y + 5.0, o[1] + uz * bw / 2], [o[0] + ux * bw / 2, y + 7.4, o[1] + uz * bw / 2], [o[0] - ux * bw / 2, y + 7.4, o[1] - uz * bw / 2], BL, [mx - fx, y + 6, mz - fz]);
        g.quadO([o[0] - ux * bw / 2, y + 5.0, o[1] - uz * bw / 2], [o[0] + ux * bw / 2, y + 5.0, o[1] + uz * bw / 2], [o[0] + ux * bw / 2, y + 7.4, o[1] + uz * bw / 2], [o[0] - ux * bw / 2, y + 7.4, o[1] - uz * bw / 2], [0.55, 0.56, 0.58], [mx + fx, y + 6, mz + fz]);
        const q = [o[0] + fx * 0.03, o[1] + fz * 0.03];
        for (const a of [-bw / 4, bw / 4]) { const cx = q[0] + ux * a, cz = q[1] + uz * a; g.quadO([cx - ux * 0.12, y + 5.4, cz - uz * 0.12], [cx + ux * 0.12, y + 5.4, cz + uz * 0.12], [cx + ux * 0.12, y + 6.6, cz + uz * 0.12], [cx - ux * 0.12, y + 6.6, cz - uz * 0.12], WH, [mx - fx, y + 6, mz - fz]);
          g.triO([cx - ux * 0.45, y + 6.5, cz - uz * 0.45], [cx + ux * 0.45, y + 6.5, cz + uz * 0.45], [cx, y + 7.1, cz], WH, [mx - fx, y + 6, mz - fz]); } }
    }

    /* ---- the terrain tiles, the scenery chunks, the fence, the crowds ---- */
    let nTiles = 0;
    { const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      G.col = G.cov = P.edge = null; }
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    addM(fenceG, fMat);
    crowdFinish(CR, root, out);
    out.crowdPts = Float32Array.from(crowdPts);
    out.propR = 140;
    out.propFloor = propFloorTable(null, () => [[w, 0.02], [w + 13, 0.02]]);
    Object.assign(out.stats, { tiles: nTiles, stands: nStands, boxes: nBoxes, props: out.props.length });
    return out;
  }

  World.ext.bangsaen = (scene, tex, opts) => buildBangsaen(scene, tex, opts);
})();
