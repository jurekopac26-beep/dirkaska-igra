/* =========================================================================
   WORLD — realizem, skupina 1 (Nürburg, Pikes Peak, Tianmen; docs/realizem.md): what the chase camera sees of these real tracks (the
   horizon, the road, its edges, the ground), on top of their own worlds: World.ext.nring, .pikes and .tianmen wrapped as
   js/world-aguascalientes.js wraps the shared builder, loaded after them (index.html). Sources: OSM and the public elevation models only.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const API = World.api;

  /* ================= TIANMEN: the retaining walls under the stacked legs =================
     Where a leg runs above another, the terrain beside it (caH's blend down to the leg below) lies flat at the lower leg's height right up
     to the upper one's barrier, so its wall stood straight down to that floor: up to 126 m of bare face. The real mountain (the elevation
     model) falls between the legs as a steep forested slope; a wall holds only the road's edge. So: a cast-concrete retaining wall (battered
     1:12) as high as the leg needs, then the fill slope below it, scrub and forest floor with the rock showing on the steepest of it, down to
     where it meets the ground; never over the leg below (its corridor), else the wall goes on down. The old face is taken out of the road's
     meshes (its two triangles per sample and side, found by their exact corners); the camera stays above the new slope (camFloor). */
  const tmBase = World.ext.tianmen;
  if (tmBase) World.ext.tianmen = (scene, tex, opts, api) => {
    const out = tmBase(scene, tex, opts, api);
    try { tmWalls(out, (api && api.T) || API.T); } catch (e) { console.error('realizem1 (tianmen):', e); }
    return out;
  };

  let wallCanvas = null;
  // a cast-concrete face, 4 x 4 m at 64 px to the metre: the formwork's lifts level every metre (a dark joint, the slurry's paler band under
  // it), its panels' joints every 2 m, the tie holes, a weep hole in every other lift with the dark stain of its water below it, the rain's
  // streaks down the face; grey, a touch warm (the vertex colours darken it to the stained concrete of the road's walls)
  function tmWallCanvas() {
    if (wallCanvas) return wallCanvas;
    const S = 256, R = API.rng(7310), v = new Float32Array(S * S), col = new Float32Array(S);
    for (let k = 0; k < 30; k++) { const x0 = Math.floor(R() * S), wd = 1 + Math.floor(R() * 6), a = 0.03 + R() * 0.09;
      for (let dx = -wd; dx <= wd; dx++) col[(x0 + dx + S) % S] += a * (1 - Math.abs(dx) / (wd + 1)); }
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let t = 0.84 + (R() - 0.5) * 0.08 + 0.025 * Math.sin(x * 0.21 + y * 0.03) * Math.sin(y * 0.17);
      const ly = y % 64, lx = x % 128;
      if (ly === 0) t -= 0.17; else if (ly === 1) t -= 0.08; else if (ly < 12) t += 0.03 * (1 - ly / 12);
      if (lx === 0) t -= 0.12; else if (lx === 1 || lx === 127) t -= 0.05;
      t -= col[x] * (0.75 + 0.25 * Math.sin(y * 0.045 + x * 0.7));
      v[y * S + x] = t;
    }
    const dot = (cx, cy, r, a) => { for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const d = Math.hypot(x - cx, y - cy); if (d < r + 1) v[((y + S) % S) * S + ((x + S) % S)] -= a * Math.min(1, r + 1 - d); } };
    for (let ly = 0; ly < 4; ly++) for (let k = 0; k < 6; k++) dot(21 + k * 42.7, ly * 64 + 32, 1.6, 0.16);   // (the tie holes)
    for (const [hx, hy] of [[64, 44], [192, 172]]) {   // the weep holes and their stains
      dot(hx, hy, 4.2, 0.5);
      for (let y = hy + 4; y < hy + 90; y++) { const f = 1 - (y - hy - 4) / 86, wd = 2 + 4 * f;
        for (let x = Math.floor(hx - wd); x <= hx + wd; x++) v[(y % S) * S + ((x + S) % S)] -= 0.2 * f * (1 - Math.abs(x - hx) / (wd + 1)); }
    }
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), id = g.createImageData(S, S), d = id.data;
    for (let k = 0; k < S * S; k++) { const t = Math.max(0, Math.min(1, v[k])); d[k * 4] = 255 * t; d[k * 4 + 1] = 255 * t * 0.985; d[k * 4 + 2] = 255 * t * 0.94; d[k * 4 + 3] = 255; }
    g.putImageData(id, 0, 0);
    return (wallCanvas = c);
  }

  function tmWalls(out, T) {
    const { GB, clamp, lerp, sstep, rpHash } = API, P = API.VR, gH = out.groundH, N = T.N, def = T.def, ds = T.ds, w = T.w, sw = 0.5;
    if (!out.root || !gH || !P) return;
    // the samples on the loop's bridge, as the builder marks them (the deck has its own profile)
    const onBr = new Uint8Array(N);
    if (def.loopBridge) for (let s = T.startS + def.loopBridge[0]; s <= T.startS + def.loopBridge[1]; s += ds / 2) onBr[T.idx(s)] = 1;
    const barOf = (i, side) => side > 0 ? T.br[i] : T.bl[i];
    // (the builder's own arithmetic, step for step, so the points come out to the same floats as its vertices)
    const gAt = (i, side, o) => { const y = T.hy[i], q = side * o; return gH(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const isWall = [-1, 1].map(side => { const a = new Uint8Array(N); for (let i = 0; i < N; i++) a[i] = !onBr[i] && gAt(i, side, barOf(i, side) + 0.45) < -2.6 ? 1 : 0; return a; });
    // the old face's corners (rows 1 and 2 of the verge's profile) of every sample beside a wall, as the builder makes them
    const rows = (i, side) => { const bar = barOf(i, side);
      if (isWall[side > 0 ? 1 : 0][i]) return [[bar + 0.3, -0.04], [bar + 0.42, gAt(i, side, bar + 0.42) - 0.08]];
      const o1 = Math.max(w + sw + 0.6, bar - 0.7); return [[o1, Math.max(-0.12, gAt(i, side, o1) + 0.05)], [bar + 0.45, Math.min(-0.42, gAt(i, side, bar + 0.45) - 0.25)]]; };
    const key = (p) => Math.fround(p[0]) + ',' + Math.fround(p[1]) + ',' + Math.fround(p[2]);
    const face = new Set(); let segs = 0;
    for (const side of [-1, 1]) { const W = isWall[side > 0 ? 1 : 0];
      for (let i = 0; i < N - 1; i++) { if (!W[i] && !W[i + 1]) continue; segs++;
        for (const j of [i, i + 1]) for (const [o, y] of rows(j, side)) face.add(key(Pt(j, side * o, y))); } }
    if (!segs) return;
    // take the old faces out of the road's meshes: the triangles with all three corners on those rows
    let removed = 0, gMat = null;
    out.root.traverse((m) => {
      if (!m.isMesh || !m.geometry || m.geometry.index || !m.geometry.attributes.uv || m.material === out.asphaltMat) return;
      const mt = m.material; if (!mt || !mt.isMeshLambertMaterial || !mt.map || !mt.vertexColors) return;
      const g = m.geometry, pa = g.attributes.position.array, n = pa.length / 9, keep = new Uint8Array(n); let drop = 0;
      for (let t = 0; t < n; t++) { let all = true;
        for (let v = 0; v < 3 && all; v++) { const b = t * 9 + v * 3; if (!face.has(pa[b] + ',' + pa[b + 1] + ',' + pa[b + 2])) all = false; }
        keep[t] = all ? 0 : 1; if (all) drop++; }
      if (!drop) return;
      removed += drop; gMat = gMat || mt;
      for (const name of Object.keys(g.attributes)) { const at = g.attributes[name], s = at.itemSize, src = at.array, dst = new src.constructor((n - drop) * 3 * s);
        let o = 0; for (let t = 0; t < n; t++) if (keep[t]) { dst.set(src.subarray(t * 3 * s, (t + 1) * 3 * s), o); o += 3 * s; }
        g.setAttribute(name, new THREE.BufferAttribute(dst, s)); }
      g.computeBoundingSphere();
    });
    out.rz1 = { segs, removed };
    if (!gMat) return;   // (nothing matched: the builder changed; leave its walls be)

    // the road's samples hashed (8 m cells), for the legs nearby: a slope may not come up through a leg below it
    const HC = 8, hash = new Map(), hk = (a, b) => (a + 4096) * 8192 + (b + 4096);
    for (let j = 0; j < N; j++) { const k = hk(Math.floor(T.px[j] / HC), Math.floor(T.pz[j] / HC)); let L = hash.get(k); if (!L) hash.set(k, L = []); L.push(j); }
    const blocked = (i, x, z, yA, o) => { const cx = Math.floor(x / HC), cz = Math.floor(z / HC);
      for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = hash.get(hk(a, b)); if (!L) continue;
        for (const j of L) { if (Math.abs(j - i) * ds < 2 * o + 10 || T.hy[j] > T.hy[i] - 1) continue;
          const dx = x - T.px[j], dz = z - T.pz[j], al = dx * T.tx[j] + dz * T.tz[j]; if (Math.abs(al) > ds * 0.75) continue;
          const lt = dx * T.nx[j] + dz * T.nz[j]; if (Math.abs(lt) < (lt > 0 ? T.br[j] : T.bl[j]) + 2 && yA > T.hy[j] - 0.3) return true; } }
      return false; };
    // the slope from the wall's foot (oW, yW) down at m (vertical to horizontal) to the ground: where it meets it, or null where it would bury a leg
    const march = (i, side, hw, m, check) => { const bar = barOf(i, side), oW = bar + 0.3 + 0.08 * hw, yW = -0.04 - hw;
      if (gAt(i, side, oW) >= yW - 0.05) return { oW, yW, oM: oW, full: true };
      let prev = oW;
      for (let k = 1; k <= 130; k++) { const o = oW + k * 0.75, ys = yW - (o - oW) * m;
        if (ys <= gAt(i, side, o)) { let lo = prev, hi = o; for (let it = 0; it < 6; it++) { const mid = (lo + hi) / 2; if (yW - (mid - oW) * m <= gAt(i, side, mid)) hi = mid; else lo = mid; } return { oW, yW, oM: hi, full: false }; }
        if (check) { const q = side * o; if (blocked(i, T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q, T.hy[i] + ys, o)) return null; }
        prev = o; }
      return null; };
    const TRY = [[0, 0.9], [0, 1.25], [3, 1.25], [0, 1.7], [3, 1.7], [7, 1.7], [0, 2.3], [7, 2.3], [14, 2.3], [24, 2.3]];
    const wall = [[], []];
    let nFull = 0;
    for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0, W = isWall[si], hwA = new Float32Array(N), mA = new Float32Array(N), HA = new Float32Array(N);
      for (let i = 0; i < N; i++) { if (!W[i]) continue;
        const H = -gAt(i, side, barOf(i, side) + 0.45), q = side * barOf(i, side), nz = P.c4(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q);
        const hw0 = clamp(1.8 + 0.18 * H, 2.5, 6.5) + (nz - 0.5) * 1.2; HA[i] = H; hwA[i] = H + 0.3; mA[i] = 2.3;
        if (hw0 >= H + 0.3) continue;
        for (const [add, m] of TRY) { const hw = hw0 + add; if (hw >= H + 0.3) break; if (march(i, side, hw, m, true)) { hwA[i] = hw; mA[i] = m; break; } } }
      // smoothed along each run of wall (the most of the neighbours', then their mean: never below what each sample needs)
      const filt = (A) => { const mx = new Float32Array(N), o = new Float32Array(N);
        for (let i = 0; i < N; i++) if (W[i]) { let v = A[i]; for (let k = 1; k <= 3; k++) { if (i - k >= 0 && W[i - k]) v = Math.max(v, A[i - k]); if (i + k < N && W[i + k]) v = Math.max(v, A[i + k]); } mx[i] = v; }
        for (let i = 0; i < N; i++) if (W[i]) { let s = mx[i], c = 1; for (let k = 1; k <= 3; k++) { if (i - k >= 0 && W[i - k]) { s += mx[i - k]; c++; } if (i + k < N && W[i + k]) { s += mx[i + k]; c++; } } o[i] = s / c; }
        return o; };
      const hwS = filt(hwA), mS = filt(mA);
      for (let i = 0; i < N; i++) { if (!W[i]) continue;
        const hw = Math.min(hwS[i], HA[i] + 0.3), r = march(i, side, hw, mS[i], false) || { oW: barOf(i, side) + 0.3 + 0.08 * (HA[i] + 0.3), yW: -0.34 - HA[i], full: true };
        if (r.full) nFull++;
        wall[si][i] = Object.assign(r, { m: mS[i] }); } }

    // the profiles (offset from the road's centre, height above it): 0 the wall's top, 1 its foot, 2-4 the slope, 5 where it meets the ground, 6 under it
    const prof = (i, side) => { const r = wall[side > 0 ? 1 : 0][i], bar = barOf(i, side), p = [[bar + 0.3, -0.04], [r.oW, r.yW]];
      if (r.full) { for (let k = 0; k < 4; k++) p.push([r.oW, r.yW]); p.push([r.oW + 0.4, gAt(i, side, r.oW + 0.4) - 0.4]); return p; }
      const L = r.oM - r.oW;
      for (const f of [0.25, 0.5, 0.75]) { const o = r.oW + L * f, q = side * o, b = (P.n4(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - 0.5) * 0.6 * Math.min(1, L / 6);
        p.push([o, r.yW - L * f * r.m + b]); }
      p.push([r.oM, gAt(i, side, r.oM) - 0.05]); p.push([r.oM + 0.8, gAt(i, side, r.oM + 0.8) - 0.35]); return p; };
    // beside the end of a run of wall: the old face's corners, then under the ground at the wall's offsets (the slope runs out into the terrain)
    const profEnd = (i, side, ref) => { const [r1, r2] = rows(i, side), p = [r1, r2]; for (let k = 2; k < 7; k++) p.push([ref[k][0], gAt(i, side, ref[k][0]) - 0.3]); return p; };

    // colours: the wall (paler at the coping, stained and damp at the foot, moss in the damp spots); the slope (tmCol's ground: scrub and grass
    // where the land cover has them, the forest floor and its litter, limestone where it is steepest, a gritty band under the wall)
    const lc = API.vrLCf || (() => 0);
    const wallCol = (x, z, i, si, foot) => { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si);
      if (!foot) return [0.74 * q, 0.73 * q, 0.7 * q];
      const moss = sstep(0.5, 0.8, P.c3(x, z)) * 0.6; return [lerp(0.56, 0.4, moss) * q, lerp(0.56, 0.46, moss) * q, lerp(0.52, 0.32, moss) * q]; };
    const slopeCol = (x, z, m, t) => { const c1 = P.c1(x, z), f = P.n4(x, z), sh = lc(x, z, 1), fld = lc(x, z, 4);
      let R = lerp(0.27, 0.37, Math.max(sh, 0.35)), G = lerp(0.33, 0.43, Math.max(sh, 0.35)), B = lerp(0.17, 0.22, Math.max(sh, 0.35));
      R = lerp(R, 0.47, fld * 0.5); G = lerp(G, 0.5, fld * 0.5); B = lerp(B, 0.27, fld * 0.5);
      const lit = sstep(0.55, 0.85, c1) * 0.5; R = lerp(R, 0.34, lit); G = lerp(G, 0.37, lit); B = lerp(B, 0.19, lit);
      R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.09; B += (f - 0.5) * 0.05;
      const rk = clamp(sstep(1.3, 2.3, m) * 0.8 + sstep(0.6, 0.85, P.c2(x, z)) * 0.45, 0, 0.85);
      if (rk > 0) { const k = 0.8 + 0.25 * P.n2(x * 0.6, z * 0.6); R = lerp(R, 0.66 * k, rk); G = lerp(G, 0.65 * k, rk); B = lerp(B, 0.61 * k, rk); }
      if (t < 0.18) { const g = (0.18 - t) / 0.18 * 0.55; R = lerp(R, 0.5, g); G = lerp(G, 0.48, g); B = lerp(B, 0.43, g); }
      return [R, G, B]; };

    // the meshes: ~200 samples a chunk, both sides; the walls (their own map), the slopes (the road's grit map, world uv)
    const wMap = new THREE.CanvasTexture(tmWallCanvas()); wMap.wrapS = wMap.wrapT = THREE.RepeatWrapping; wMap.anisotropy = 4;
    if (out.ownTex) out.ownTex.push(wMap);
    const wMat = new THREE.MeshLambertMaterial({ map: wMap, vertexColors: true });
    const sTop = [new Float32Array(N), new Float32Array(N)];
    for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0; for (let i = 1; i < N; i++) { const a = Pt(i - 1, side * (barOf(i - 1, side) + 0.3), 0), b = Pt(i, side * (barOf(i, side) + 0.3), 0); sTop[si][i] = sTop[si][i - 1] + Math.hypot(b[0] - a[0], b[2] - a[2]); } }
    const wuv = (p) => [p[0] / 10, -p[2] / 10];
    const fl = [];   // the slopes' cross-sections for the camera's floor: [x, y, z] per profile point, per sample and side
    let verts = 0;
    const add = (g, mat) => { if (g.empty) return; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = false; m.matrixAutoUpdate = false; m.updateMatrix(); out.root.add(m); verts += m.geometry.attributes.position.count; };
    for (let c0 = 0; c0 < N - 1; c0 += 200) {
      const gw = new GB(true), gs = new GB(true);
      for (let i = c0; i < Math.min(c0 + 200, N - 1); i++) for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, W = isWall[si], j = i + 1; if (!W[i] && !W[j]) continue;
        let pi = W[i] ? prof(i, side) : null, pj = W[j] ? prof(j, side) : null;
        if (!pi) pi = profEnd(i, side, pj); if (!pj) pj = profEnd(j, side, pi);
        const A = pi.map(([o, y]) => Pt(i, side * o, y)), B = pj.map(([o, y]) => Pt(j, side * o, y));
        const yIn = Math.min(pi[1][1], pj[1][1]);
        // the wall's face, out from under the road
        const cA0 = wallCol(A[0][0], A[0][2], i, si, false), cA1 = wallCol(A[1][0], A[1][2], i, si, true), cB0 = wallCol(B[0][0], B[0][2], j, si, false), cB1 = wallCol(B[1][0], B[1][2], j, si, true);
        const u0 = sTop[si][i] / 4, u1 = sTop[si][j] / 4;
        gw.quadO(A[0], A[1], B[1], B[0], null, Pt(i, side * (barOf(i, side) - 2), yIn * 0.5), [[u0, -A[0][1] / 4], [u0, -A[1][1] / 4], [u1, -B[1][1] / 4], [u1, -B[0][1] / 4]], [cA0, cA1, cB1, cB0]);
        // the slope
        const inS = Pt(i, side * (barOf(i, side) - 2), yIn - 30), ri = wall[si][i], rj = wall[si][j], mi = ri ? ri.m : 2.3, mj = rj ? rj.m : 2.3;
        const cs = (p, m, k) => slopeCol(p[0], p[2], m, (k - 1) / 4);
        for (let k = 1; k < 6; k++) {
          const a = A[k], b = A[k + 1], c = B[k + 1], d = B[k];
          if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.02 && Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2]) < 0.02) continue;
          gs.quadO(a, b, c, d, null, inS, [wuv(a), wuv(b), wuv(c), wuv(d)], [cs(a, mi, k), cs(b, mi, k + 1), cs(c, mj, k + 1), cs(d, mj, k)]);
        }
        if (W[i] && !ri.full) fl.push(A);
      }
      add(gw, wMat); add(gs, gMat);
    }
    out.rz1.walls = isWall[0].reduce((s, v) => s + v, 0) + isWall[1].reduce((s, v) => s + v, 0);
    out.rz1.full = nFull; out.rz1.verts = verts;

    // the camera's floor: the slopes rasterised on a 1.5 m grid (the highest of each cell), so the chase camera stays out of them
    if (fl.length && out.camFloor) {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (const A of fl) for (const p of A) { x0 = Math.min(x0, p[0]); z0 = Math.min(z0, p[2]); x1 = Math.max(x1, p[0]); z1 = Math.max(z1, p[2]); }
      const C = 1.5, nx = Math.ceil((x1 - x0) / C) + 3, nz = Math.ceil((z1 - z0) / C) + 3;
      if (nx * nz < 6e6) {
        const F = new Float32Array(nx * nz).fill(-1e9), gx0 = x0 - C, gz0 = z0 - C;
        const put = (x, y, z) => { const a = Math.round((x - gx0) / C), b = Math.round((z - gz0) / C), k = b * nx + a; if (a >= 0 && b >= 0 && a < nx && b < nz && F[k] < y) F[k] = y; };
        for (const A of fl) for (let k = 1; k < 5; k++) { const a = A[k], b = A[k + 1], L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.ceil(L / 0.7));
          for (let s = 0; s <= n; s++) { const t = s / n; put(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); } }
        const base = out.camFloor;
        out.camFloor = (x, z) => { const h = base(x, z), gx = (x - gx0) / C, gz = (z - gz0) / C, a = Math.floor(gx), b = Math.floor(gz);
          if (a < 0 || b < 0 || a >= nx - 1 || b >= nz - 1) return h;
          const u = gx - a, v = gz - b, f00 = Math.max(F[b * nx + a], h), f10 = Math.max(F[b * nx + a + 1], h), f01 = Math.max(F[(b + 1) * nx + a], h), f11 = Math.max(F[(b + 1) * nx + a + 1], h);
          return Math.max(h, (f00 * (1 - u) + f10 * u) * (1 - v) + (f01 * (1 - u) + f11 * u) * v); };
      }
    }
  }
})();
