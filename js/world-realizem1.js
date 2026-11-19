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

    // the road's samples hashed (12 m cells), for the legs below: a slope comes down onto a lower leg, it does not go through it
    const HC = 12, hash = new Map(), hk = (a, b) => (a + 4096) * 8192 + (b + 4096);
    for (let j = 0; j < N; j++) { const k = hk(Math.floor(T.px[j] / HC), Math.floor(T.pz[j] / HC)); let L = hash.get(k); if (!L) hash.set(k, L = []); L.push(j); }
    // a lower leg beside the point (x, z) at the height yA: { j, lat, cut: true } in its corridor (its barrier + 2 m) above it; { j, lat, cut: false }
    // within 10 m of that, the point down at its level (the pit between two legs, the terrain there at a third one's level, is filled up to it)
    const lowLeg = (i, x, z, yA, o) => { const cx = Math.floor(x / HC), cz = Math.floor(z / HC); let best = null;
      for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = hash.get(hk(a, b)); if (!L) continue;
        for (const j of L) { if (T.hy[j] > T.hy[i] - 1 || Math.abs(j - i) * ds < 1.3 * Math.hypot(T.px[j] - T.px[i], T.pz[j] - T.pz[i]) + 4) continue;   // (not the own leg: a sample whose road from here is about as long as the straight line)
          const dx = x - T.px[j], dz = z - T.pz[j], al = dx * T.tx[j] + dz * T.tz[j]; if (Math.abs(al) > ds * 0.75) continue;
          const lt = dx * T.nx[j] + dz * T.nz[j], lim = (lt > 0 ? T.br[j] : T.bl[j]) + 2;
          if (Math.abs(lt) < lim && yA > T.hy[j] - 0.3) return { j, lat: lt, cut: true };
          if (Math.abs(lt) < lim + 10 && yA <= T.hy[j] - 0.05 && (!best || T.hy[j] > T.hy[best.j])) best = { j, lat: lt, cut: false }; } }
      return best; };
    const latTo = (j, x, z) => (x - T.px[j]) * T.nx[j] + (z - T.pz[j]) * T.nz[j];
    // the slope from the wall's foot (oW, yW) down at m (vertical to horizontal): to where it meets the ground (land 0); or onto a leg below, a cut
    // face at its corridor down to its level (land 1), or down at its level near it (land 2); over a pit, then on at that level to the leg's wall (oE)
    // the wall's foot: battered back 8 cm a metre, but never out over a lower leg (its barrier, the blocks' back face 0.57 m out, and 0.4 m more)
    const inLow = (i, x, z, yF) => { const cx = Math.floor(x / HC), cz = Math.floor(z / HC);
      for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = hash.get(hk(a, b)); if (!L) continue;
        for (const j of L) { if (T.hy[j] > T.hy[i] - 1 || yF < T.hy[j] - 0.3 || Math.abs(j - i) * ds < 1.3 * Math.hypot(T.px[j] - T.px[i], T.pz[j] - T.pz[i]) + 4) continue;
          const dx = x - T.px[j], dz = z - T.pz[j]; if (Math.abs(dx * T.tx[j] + dz * T.tz[j]) > ds * 0.75) continue;
          const lt = dx * T.nx[j] + dz * T.nz[j]; if (Math.abs(lt) < (lt > 0 ? T.br[j] : T.bl[j]) + 1) return true; } }
      return false; };
    const footO = (i, side, hw) => { const bar = barOf(i, side), o0 = bar + 0.3 + 0.08 * hw, yF = T.hy[i] - 0.04 - hw, inC = (o) => { const q = side * o; return inLow(i, T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q, yF); };
      if (!inC(o0)) return o0; let lo = bar + 0.3, hi = o0; if (inC(lo)) return lo;
      for (let k = 0; k < 6; k++) { const mid = (lo + hi) / 2; if (inC(mid)) hi = mid; else lo = mid; }
      return lo; };
    const march = (i, side, hw, m) => { const bar = barOf(i, side), oW = footO(i, side, hw), yW = -0.04 - hw, at = (o) => { const q = side * o; return [T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q]; };
      if (gAt(i, side, oW) >= yW - 0.05) return { oW, yW, hw, m, full: true };
      let prev = oW;
      for (let k = 1; k <= 130; k++) { const o = oW + k * 0.75, ys = yW - (o - oW) * m;
        if (ys <= gAt(i, side, o)) { let lo = prev, hi = o; for (let it = 0; it < 6; it++) { const mid = (lo + hi) / 2; if (yW - (mid - oW) * m <= gAt(i, side, mid)) hi = mid; else lo = mid; } return { oW, yW, hw, m, oM: hi, land: 0 }; }
        const [x, z] = at(o), L = lowLeg(i, x, z, T.hy[i] + ys, o);
        if (L) { const j = L.j, yB = T.hy[j] - T.hy[i] - 0.05, lim = (L.lat > 0 ? T.br[j] : T.bl[j]) + 2, inside = (oo) => { const [a, b] = at(oo); return Math.abs(latTo(j, a, b)) < lim; };
          let oM = o, yL = ys, land = 2;
          if (L.cut) { let lo = prev, hi = o; for (let it = 0; it < 5; it++) { const mid = (lo + hi) / 2; if (inside(mid)) hi = mid; else lo = mid; } oM = hi; yL = yW - (oM - oW) * m; land = 1; }
          else { oM = Math.max(oW + 0.2, oW + (yW - yB) / m); yL = yB; }
          // over a pit (the ground well under the leg's level): on, flat at its level, to its wall (its barrier + 0.32 m) where the slope runs towards it
          let oE = 0; if (gAt(i, side, oM + 0.5) < yB - 0.4) { const r = -Math.sign(L.lat) * side * (T.nx[i] * T.nx[j] + T.nz[i] * T.nz[j]);
            if (r > 0.25) oE = Math.max(oM + 0.4, o + Math.min(16, (Math.abs(L.lat) - (lim - 2 + 0.32)) / r)); }
          return { oW, yW, hw, m, oM, yL, yB, land, oE }; }
        prev = o; }
      return null; };
    // the cost of a profile: the walls' height (a cut face a little more), the steeper slope a little more; the plain wall down to the floor is the last resort
    const cost = (r, H) => !r ? 1e9 : r.full ? H + 0.3 : r.hw + (r.land === 1 ? 1.3 * Math.max(0, r.yL - r.yB) : 0) + 1.5 * (r.m - 0.9);
    const TRY = [[0, 0.9], [0, 1.25], [3, 1.25], [0, 1.7], [3, 1.7], [7, 1.7], [0, 2.3], [7, 2.3], [14, 2.3]];
    const wall = [[], []];
    let nFull = 0, nLand = 0, nBig = 0;
    for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0, W = isWall[si], hwA = new Float32Array(N), mA = new Float32Array(N), HA = new Float32Array(N);
      for (let i = 0; i < N; i++) { if (!W[i]) continue;
        const H = -gAt(i, side, barOf(i, side) + 0.45), q = side * barOf(i, side), nz = P.c4(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q);
        const hw0 = clamp(1.8 + 0.18 * H, 2.5, 6.5) + (nz - 0.5) * 1.2; HA[i] = H; hwA[i] = H + 0.3; mA[i] = 2.3;
        let best = H + 0.3;
        for (const [add, m] of TRY) { const hw = hw0 + add; if (hw >= H + 0.3 || hw + 1.5 * (m - 0.9) >= best) continue;
          const r = march(i, side, hw, m), c = cost(r, H); if (c < best) { best = c; hwA[i] = hw; mA[i] = m; } } }
      // smoothed along each run of wall (the most of the neighbours', then their mean: never below what each sample needs)
      const filt = (A) => { const mx = new Float32Array(N), o = new Float32Array(N);
        for (let i = 0; i < N; i++) if (W[i]) { let v = A[i]; for (let k = 1; k <= 3; k++) { if (i - k >= 0 && W[i - k]) v = Math.max(v, A[i - k]); if (i + k < N && W[i + k]) v = Math.max(v, A[i + k]); } mx[i] = v; }
        for (let i = 0; i < N; i++) if (W[i]) { let s = mx[i], c = 1; for (let k = 1; k <= 3; k++) { if (i - k >= 0 && W[i - k]) { s += mx[i - k]; c++; } if (i + k < N && W[i + k]) { s += mx[i + k]; c++; } } o[i] = s / c; }
        return o; };
      const hwS = filt(hwA), mS = filt(mA);
      for (let i = 0; i < N; i++) { if (!W[i]) continue;
        const hw = Math.min(hwS[i], HA[i] + 0.3), r = march(i, side, hw, mS[i]) || { oW: footO(i, side, HA[i] + 0.3), yW: -0.34 - HA[i], hw: HA[i] + 0.3, m: 2.3, full: true };
        if (r.full) { nFull++; if (HA[i] > 6) nBig++; } else if (r.land) nLand++;
        wall[si][i] = r; } }

    // the profiles (offset from the road's centre, height above it), 8 points: 0 the wall's top, 1 its foot, 2-4 the slope, 5 where it ends, 6-7 on:
    // under the ground; or the cut face's foot (land 1), and over a pit the level ground on to the leg below
    const prof = (i, side) => { const r = wall[side > 0 ? 1 : 0][i], bar = barOf(i, side), p = [[bar + 0.3, -0.04], [r.oW, r.yW]];
      if (r.full) { for (let k = 0; k < 5; k++) p.push([r.oW, r.yW]); p.push([r.oW + 0.4, gAt(i, side, r.oW + 0.4) - 0.4]); return p; }
      const L = r.oM - r.oW, yE = r.land ? r.yL : gAt(i, side, r.oM) - 0.05;
      for (const f of [0.2, 0.6, 0.6]) {   // (3 and 4 the same point: three bands of slope, the first, at the wall's foot, narrow)
        const o = r.oW + L * f, q = side * o, b = (P.n4(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - 0.5) * 0.6 * Math.min(1, L / 6);
        p.push([o, lerp(r.yW, yE, f) + b]); }
      p.push([r.oM, yE]);
      const o6 = r.oM + (r.land === 1 ? 0.3 : 0.4); p.push([o6, r.land === 1 || r.oE ? r.yB : gAt(i, side, o6) - 0.35]);
      const o7 = r.oE ? Math.max(r.oE, o6 + 0.1) : o6 + 0.5; p.push([o7, r.oE ? r.yB : gAt(i, side, o7) - 0.35]);
      return p; };
    // beside the end of a run of wall: the old face's corners, then under the ground at the wall's offsets (the slope runs out into the terrain)
    const profEnd = (i, side, ref) => { const [r1, r2] = rows(i, side), p = [r1, r2]; for (let k = 2; k < 8; k++) p.push([ref[k][0], gAt(i, side, ref[k][0]) - 0.3]); return p; };
    const lc = API.vrLCf || (() => 0);
    const wallCol = (x, z, i, si, foot) => { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si);
      if (!foot) return [0.74 * q, 0.73 * q, 0.7 * q];
      const moss = sstep(0.5, 0.8, P.c3(x, z)) * 0.6; return [lerp(0.56, 0.4, moss) * q, lerp(0.56, 0.46, moss) * q, lerp(0.52, 0.32, moss) * q]; };
    const slopeCol = (x, z, m, t) => { const c1 = P.c1(x, z), f = P.n4(x, z), sh = lc(x, z, 1), fld = lc(x, z, 4);
      let R = lerp(0.27, 0.37, Math.max(sh, 0.35)), G = lerp(0.33, 0.43, Math.max(sh, 0.35)), B = lerp(0.17, 0.22, Math.max(sh, 0.35));
      R = lerp(R, 0.47, fld * 0.5); G = lerp(G, 0.5, fld * 0.5); B = lerp(B, 0.27, fld * 0.5);
      const lit = sstep(0.55, 0.85, c1) * 0.5; R = lerp(R, 0.34, lit); G = lerp(G, 0.37, lit); B = lerp(B, 0.19, lit);
      R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.09; B += (f - 0.5) * 0.05;
      const rk = Math.max(clamp(sstep(1.3, 2.3, m) * 0.8 + sstep(0.6, 0.85, P.c2(x, z)) * 0.45, 0, 0.85), lc(x, z, 2) * 0.8);
      if (rk > 0) { const k = 0.8 + 0.25 * P.n2(x * 0.6, z * 0.6); R = lerp(R, 0.66 * k, rk); G = lerp(G, 0.65 * k, rk); B = lerp(B, 0.61 * k, rk); }
      if (t < 0.18) { const g = (0.18 - t) / 0.18 * 0.55; R = lerp(R, 0.5, g); G = lerp(G, 0.48, g); B = lerp(B, 0.43, g); }
      return [R, G, B]; };

    // the meshes: ~200 samples a chunk, both sides; the walls and cut faces (their own map), the slopes (the road's grit map, world uv)
    const wMap = new THREE.CanvasTexture(tmWallCanvas()); wMap.wrapS = wMap.wrapT = THREE.RepeatWrapping; wMap.anisotropy = 4;
    if (out.ownTex) out.ownTex.push(wMap);
    const wMat = new THREE.MeshLambertMaterial({ map: wMap, vertexColors: true });
    const sTop = [new Float32Array(N), new Float32Array(N)];
    for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0; for (let i = 1; i < N; i++) { const a = Pt(i - 1, side * (barOf(i - 1, side) + 0.3), 0), b = Pt(i, side * (barOf(i, side) + 0.3), 0); sTop[si][i] = sTop[si][i - 1] + Math.hypot(b[0] - a[0], b[2] - a[2]); } }
    const wuv = (p) => [p[0] / 10, -p[2] / 10];
    const fl = [];   // the slopes' cross-sections for the camera's floor: [x, y, z] per profile point, per sample and side
    let verts = 0;
    const add = (g, mat) => { if (g.empty) return; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = false; m.matrixAutoUpdate = false; m.updateMatrix(); out.root.add(m); verts += m.geometry.attributes.position.count; };
    const end6 = (r) => r && (r.full || r.oE);   // (the last band: the plain wall's skirt, the level ground over a pit; else under the ground, left out)
    const near0 = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 0.03;
    for (let c0 = 0; c0 < N - 1; c0 += 200) {
      const gw = new GB(true), gs = new GB(true);
      for (let i = c0; i < Math.min(c0 + 200, N - 1); i++) for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, W = isWall[si], j = i + 1; if (!W[i] && !W[j]) continue;
        let pi = W[i] ? prof(i, side) : null, pj = W[j] ? prof(j, side) : null;
        if (!pi) pi = profEnd(i, side, pj); if (!pj) pj = profEnd(j, side, pi);
        const A = pi.map(([o, y]) => Pt(i, side * o, y)), B = pj.map(([o, y]) => Pt(j, side * o, y));
        const ri = W[i] ? wall[si][i] : null, rj = W[j] ? wall[si][j] : null, yIn = Math.min(pi[1][1], pj[1][1]), u0 = sTop[si][i] / 4, u1 = sTop[si][j] / 4;
        const wq = (k, inside) => gw.quadO(A[k], A[k + 1], B[k + 1], B[k], null, inside, [[u0, -A[k][1] / 4], [u0, -A[k + 1][1] / 4], [u1, -B[k + 1][1] / 4], [u1, -B[k][1] / 4]],
          [wallCol(A[k][0], A[k][2], i, si, false), wallCol(A[k + 1][0], A[k + 1][2], i, si, true), wallCol(B[k + 1][0], B[k + 1][2], j, si, true), wallCol(B[k][0], B[k][2], j, si, false)]);
        // the wall's face, out from under the road
        wq(0, Pt(i, side * (barOf(i, side) - 2), yIn * 0.5));
        // the slope, the cut face onto the leg below (both ends landing so), the ground on
        const inS = Pt(i, side * (barOf(i, side) - 2), yIn - 30), mi = ri ? ri.m : 2.3, mj = rj ? rj.m : 2.3;
        const cs = (p, m, k) => slopeCol(p[0], p[2], m, (k - 1) / 4);
        // a step in the slope's reach (a fill over a gully beside one that met the ground short of it): the long one's cross-section zipped to
        // the short one's, run on under the ground out to the long one's reach: the fill's end face, not a band from toe to toe over the gully
        if (ri && rj && !ri.full && !rj.full && !(ri.land === 1 && rj.land === 1) && Math.abs(pi[7][0] - pj[7][0]) > 6) {
          const iL = pi[7][0] > pj[7][0], nL = iL ? i : j, nS = iL ? j : i, mL = iL ? mi : mj, mS = iL ? mj : mi;
          const QA = (iL ? pi : pj).slice(1), QB = (iL ? pj : pi).slice(1), oS = QB[6][0], oL = QA[6][0], n = Math.ceil((oL - oS) / 2.5);
          for (let t = 1; t <= n; t++) { const o = oS + (oL - oS) * t / n; QB.push([o, gAt(nS, side, o) - 0.4]); }
          const VA = QA.map(([o, y]) => Pt(nL, side * o, y)), VB = QB.map(([o, y]) => Pt(nS, side * o, y));
          const cA = VA.map((p, k) => cs(p, mL, k + 1)), cB = VB.map((p, k) => cs(p, mS, Math.min(k + 1, 7)));
          const tr = (p, q, r, cp, cq, cr, ins) => { if (!near0(p, q) && !near0(q, r) && !near0(p, r)) gs.triO(p, q, r, cp, ins, cq, cr, wuv(p), wuv(q), wuv(r)); };
          for (let a = 0, b = 0; a < 6 || b < VB.length - 1;) {   // (inside: under the long one's point, towards the road)
            const ins = Pt(nL, side * (QA[a][0] - 2), QA[a][1] - 2);
            if (b >= VB.length - 1 || (a < 6 && QA[a + 1][0] <= QB[b + 1][0])) { tr(VA[a], VA[a + 1], VB[b], cA[a], cA[a + 1], cB[b], ins); a++; }
            else { tr(VA[a], VB[b + 1], VB[b], cA[a], cB[b + 1], cB[b], ins); b++; }
          }
        } else for (let k = 1; k < 7; k++) {
          if ((near0(A[k], A[k + 1]) && near0(B[k], B[k + 1])) || (k === 6 && !end6(ri) && !end6(rj))) continue;
          if (k === 5 && ri && rj && ri.land === 1 && rj.land === 1) { wq(5, Pt(i, side * (barOf(i, side) - 2), Math.min(pi[5][1], pj[5][1]) + 30)); continue; }
          gs.quadO(A[k], A[k + 1], B[k + 1], B[k], null, inS, [wuv(A[k]), wuv(A[k + 1]), wuv(B[k + 1]), wuv(B[k])], [cs(A[k], mi, k), cs(A[k + 1], mi, k + 1), cs(B[k + 1], mj, k + 1), cs(B[k], mj, k)]);
        }
        if (ri && !ri.full) fl.push(A);
      }
      add(gw, wMat); add(gs, gMat);
    }
    out.rz1.walls = isWall[0].reduce((s, v) => s + v, 0) + isWall[1].reduce((s, v) => s + v, 0);
    out.rz1.full = nFull; out.rz1.big = nBig; out.rz1.land = nLand; out.rz1.verts = verts;

    // the camera's floor: the slopes rasterised on a 1.5 m grid (the highest of each cell), so the chase camera stays out of them
    if (fl.length && out.camFloor) {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (const A of fl) for (const p of A) { x0 = Math.min(x0, p[0]); z0 = Math.min(z0, p[2]); x1 = Math.max(x1, p[0]); z1 = Math.max(z1, p[2]); }
      const C = 1.5, nx = Math.ceil((x1 - x0) / C) + 3, nz = Math.ceil((z1 - z0) / C) + 3;
      if (nx * nz < 6e6) {
        const F = new Float32Array(nx * nz).fill(-1e9), gx0 = x0 - C, gz0 = z0 - C;
        const put = (x, y, z) => { const a = Math.round((x - gx0) / C), b = Math.round((z - gz0) / C), k = b * nx + a; if (a >= 0 && b >= 0 && a < nx && b < nz && F[k] < y) F[k] = y; };
        for (const A of fl) for (let k = 1; k < 7; k++) { const a = A[k], b = A[k + 1], L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.ceil(L / 0.7));
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
