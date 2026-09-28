/* =========================================================================
   WORLD — builds static scene geometry for the track and its surroundings
   ========================================================================= */
const World = (function () {
  'use strict';
  const { clamp, lerp, sstep, rng } = Core;
  const TAU = Math.PI * 2;

  /* ---------------- geometry builder (non-indexed, flat normals) -------- */
  class GB {
    constructor(uv, alpha) { this.P = []; this.N = []; this.C = []; this.U = uv ? [] : null; this.A = !!alpha; }
    tri(a, b, c, ca, cb, cc, ua, ub, uc) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      this.P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      this.N.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
      cb = cb || ca; cc = cc || ca;
      if (this.A) this.C.push(ca[0], ca[1], ca[2], ca[3], cb[0], cb[1], cb[2], cb[3], cc[0], cc[1], cc[2], cc[3]);
      else this.C.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]);
      if (this.U) this.U.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
    }
    // outward-oriented triangle: flips winding if its normal points toward 'inside'
    triO(a, b, c, col, inside, cb, cc, ua, ub, uc) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const cx = (a[0] + b[0] + c[0]) / 3 - inside[0], cy = (a[1] + b[1] + c[1]) / 3 - inside[1], cz = (a[2] + b[2] + c[2]) / 3 - inside[2];
      if (nx * cx + ny * cy + nz * cz < 0) this.tri(a, c, b, col, cc, cb, ua, uc, ub);
      else this.tri(a, b, c, col, cb, cc, ua, ub, uc);
    }
    quadO(a, b, c, d, col, inside, uvs, cols) {
      if (cols) { this.triO(a, b, c, cols[0], inside, cols[1], cols[2], uvs && uvs[0], uvs && uvs[1], uvs && uvs[2]); this.triO(a, c, d, cols[0], inside, cols[2], cols[3], uvs && uvs[0], uvs && uvs[2], uvs && uvs[3]); }
      else { this.triO(a, b, c, col, inside, col, col, uvs && uvs[0], uvs && uvs[1], uvs && uvs[2]); this.triO(a, c, d, col, inside, col, col, uvs && uvs[0], uvs && uvs[2], uvs && uvs[3]); }
    }
    // triangle with its own vertex normals (smooth, rounded shading for boulders, firs, bales); triON orients it outward like triO
    triN(a, b, c, na, nb, nc, ca, cb, cc, ua, ub, uc) {
      this.P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      this.N.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2]);
      cb = cb || ca; cc = cc || ca;
      if (this.A) this.C.push(ca[0], ca[1], ca[2], ca[3], cb[0], cb[1], cb[2], cb[3], cc[0], cc[1], cc[2], cc[3]);
      else this.C.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]);
      if (this.U) this.U.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
    }
    triON(a, b, c, na, nb, nc, inside, ca, cb, cc, ua, ub, uc) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const cx = (a[0] + b[0] + c[0]) / 3 - inside[0], cy = (a[1] + b[1] + c[1]) / 3 - inside[1], cz = (a[2] + b[2] + c[2]) / 3 - inside[2];
      if (nx * cx + ny * cy + nz * cz < 0) this.triN(a, c, b, na, nc, nb, ca, cc, cb, ua, uc, ub); else this.triN(a, b, c, na, nb, nc, ca, cb, cc, ua, ub, uc);
    }
    quadON(a, b, c, d, na, nb, nc, nd, inside, ca, cb, cc, cd, uvs) {
      this.triON(a, b, c, na, nb, nc, inside, ca, cb, cc, uvs && uvs[0], uvs && uvs[1], uvs && uvs[2]);
      this.triON(a, c, d, na, nc, nd, inside, ca, cc, cd, uvs && uvs[0], uvs && uvs[2], uvs && uvs[3]);
    }
    // up-facing quad (ribbons)
    quadUp(a, b, c, d, cols, uvs) {
      const inside = [(a[0] + c[0]) / 2, Math.min(a[1], b[1], c[1], d[1]) - 5, (a[2] + c[2]) / 2];
      this.quadO(a, b, c, d, cols[0], inside, uvs, cols);
    }
    get empty() { return this.P.length === 0; }
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, this.A ? 4 : 3));
      if (this.U) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
      g.computeBoundingSphere();
      return g;
    }
  }
  class Chunks {
    constructor(size, uv) { this.size = size; this.map = new Map(); this.uv = !!uv; }
    get(x, z) { const k = Math.floor(x / this.size) + ',' + Math.floor(z / this.size); let g = this.map.get(k); if (!g) { g = new GB(this.uv); this.map.set(k, g); } return g; }
    addTo(group, mat, cast, recv) { for (const g of this.map.values()) { if (g.empty) continue; const m = new THREE.Mesh(g.geometry(), mat); m.castShadow = cast; m.receiveShadow = recv; m.matrixAutoUpdate = false; m.updateMatrix(); group.add(m); } }
  }

  /* ---------------- primitives ---------------- */
  const vary = (c, r, amt) => { const k = 1 + (r() - 0.5) * amt; return [c[0] * k, c[1] * k, c[2] * k]; };
  const hex = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
  function box(g, cx, cy, cz, sx, sy, sz, rot, col, colTop, noBottom) {
    const c = Math.cos(rot), s = Math.sin(rot), hx = sx / 2, hz = sz / 2;
    const P = (lx, ly, lz) => [cx + lx * c - lz * s, cy + ly, cz + lx * s + lz * c];
    const v = [P(-hx, 0, -hz), P(hx, 0, -hz), P(hx, sy, -hz), P(-hx, sy, -hz), P(-hx, 0, hz), P(hx, 0, hz), P(hx, sy, hz), P(-hx, sy, hz)];
    const inn = [cx, cy + sy / 2, cz];
    const ct = colTop || col;
    g.quadO(v[1], v[2], v[6], v[5], col, inn); g.quadO(v[0], v[4], v[7], v[3], col, inn);
    g.quadO(v[3], v[7], v[6], v[2], ct, inn);
    if (!noBottom) g.quadO(v[0], v[1], v[5], v[4], col, inn);
    g.quadO(v[4], v[5], v[6], v[7], col, inn); g.quadO(v[1], v[0], v[3], v[2], col, inn);
  }
  function cone(g, cx, cy, cz, r, h, sides, col, colTip, rot) {
    const apex = [cx, cy + h, cz], inn = [cx, cy + h * 0.3, cz], L = Math.hypot(r, h) || 1, ny = r / L, nh = h / L;
    for (let i = 0; i < sides; i++) {
      const a0 = rot + i / sides * TAU, a1 = rot + (i + 1) / sides * TAU;
      const p0 = [cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r];
      if (ROCK_SMOOTH) { const am = (a0 + a1) / 2; g.triON(p0, apex, p1, [Math.cos(a0) * nh, ny, Math.sin(a0) * nh], [Math.cos(am) * nh, ny, Math.sin(am) * nh], [Math.cos(a1) * nh, ny, Math.sin(a1) * nh], inn, col, colTip, col); }   // smooth (forest)
      else g.triO(p0, apex, p1, col, inn, colTip, col);
    }
  }
  function starCone(g, cx, cy, cz, r, h, n, col, colTip, rot, droop) {   // jagged fir tier: n drooping branch tips around an inner ring (2n faces, flat shaded)
    const apex = [cx, cy + h, cz], inn = [cx, cy + h * 0.3, cz], m = 2 * n, pts = [];
    for (let k = 0; k < m; k++) { const a = rot + k / m * TAU, tip = k % 2 === 0, rr = tip ? r : r * 0.58; pts.push([cx + Math.cos(a) * rr, cy + (tip ? -droop : h * 0.12), cz + Math.sin(a) * rr]); }
    if (ROCK_SMOOTH) {   // soft shading: normals lean out from the trunk (no hard facets on the branches)
      const nn = (p) => { const dx = p[0] - cx, dz = p[2] - cz, l = Math.hypot(dx, dz) || 1, x = dx / l * 0.8, z = dz / l * 0.8, y = 0.6, L = Math.hypot(x, y, z); return [x / L, y / L, z / L]; }, up = [0, 1, 0];
      for (let k = 0; k < m; k++) { const a = pts[k], b = pts[(k + 1) % m]; g.triON(a, b, apex, nn(a), nn(b), up, inn, col, col, colTip); }
      return; }
    for (let k = 0; k < m; k++) g.triO(pts[k], pts[(k + 1) % m], apex, col, inn, col, colTip);
  }
  function cyl(g, cx, cy, cz, r, h, sides, col, colTop, r2) {
    const rt = r2 == null ? r : r2, inn = [cx, cy + h / 2, cz];
    for (let i = 0; i < sides; i++) {
      const a0 = i / sides * TAU, a1 = (i + 1) / sides * TAU;
      const b0 = [cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r], b1 = [cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r];
      const t0 = [cx + Math.cos(a0) * rt, cy + h, cz + Math.sin(a0) * rt], t1 = [cx + Math.cos(a1) * rt, cy + h, cz + Math.sin(a1) * rt];
      g.quadO(b0, t0, t1, b1, col, inn);
      if (colTop) g.triO([cx, cy + h, cz], t1, t0, colTop, inn);
    }
  }
  function tyreStack(g, cx, cy, cz, h, col, r) {   // one column of painted tyres (18 faces): 6 sides, the dark hole shaded into the top with vertex colours
    r = r || 0.33; const inn = [cx, cy + h / 2, cz], top = [cx, cy + h, cz], dark = [0.07, 0.07, 0.08], rim = [col[0] * 0.92, col[1] * 0.92, col[2] * 0.92], low = [col[0] * 0.62, col[1] * 0.62, col[2] * 0.66], below = [cx, cy - 1, cz];
    for (let i = 0; i < 6; i++) { const a0 = i / 6 * TAU, a1 = (i + 1) / 6 * TAU, b0 = [cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r], b1 = [cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r], t0 = [b0[0], cy + h, b0[2]], t1 = [b1[0], cy + h, b1[2]];
      g.quadO(b0, t0, t1, b1, col, inn, null, [low, col, col, low]); g.triO(top, t1, t0, dark, below, rim, rim); }
  }
  function tyreCol(g, cx, cy, cz, h, r, col, rot) {   // a column of three fat painted tyres (24 faces): 8 sides with the tyre texture, a ring with a dark hole on top
    const n = 8, a0r = rot || 0, top = [cx, cy + h, cz], below = [cx, cy - 1, cz], inn = [cx, cy + h / 2, cz];
    for (let k = 0; k < n; k++) { const a0 = a0r + k / n * TAU, a1 = a0r + (k + 1) / n * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const b0 = [cx + c0 * r, cy, cz + s0 * r], b1 = [cx + c1 * r, cy, cz + s1 * r], t0 = [b0[0], cy + h, b0[2]], t1 = [b1[0], cy + h, b1[2]], u0 = k / n * 2, u1 = (k + 1) / n * 2;
      g.quadO(b0, t0, t1, b1, col, inn, [[u0, 0.5], [u0, 0.998], [u1, 0.998], [u1, 0.5]]);
      g.triO(top, t1, t0, col, below, col, col, [0.5, 0.25], [0.5 + 0.49 * c1, 0.25 + 0.245 * s1], [0.5 + 0.49 * c0, 0.25 + 0.245 * s0]); }
  }
  const ICO_T = (1 + Math.sqrt(5)) / 2;
  const ICO_V = [[-1, ICO_T, 0], [1, ICO_T, 0], [-1, -ICO_T, 0], [1, -ICO_T, 0], [0, -1, ICO_T], [0, 1, ICO_T], [0, -1, -ICO_T], [0, 1, -ICO_T], [ICO_T, 0, -1], [ICO_T, 0, 1], [-ICO_T, 0, -1], [-ICO_T, 0, 1]].map(v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; });
  const ICO_F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  function ico(g, cx, cy, cz, r, sy, col, r_, jit) {
    const vs = ICO_V.map(v => { const k = 1 + (r_() - 0.5) * jit; return [cx + v[0] * r * k, cy + v[1] * r * sy * k, cz + v[2] * r * k]; });
    const inn = [cx, cy, cz];
    if (ROCK_SMOOTH) {   // soft, rounded shading (bushes and small stones on the forest circuit)
      const sc = (p) => { const k = 0.82 + 0.3 * ((p[1] - cy) / (r * sy) * 0.5 + 0.5); return [col[0] * k, col[1] * k, col[2] * k]; };
      const nn = (p) => { const x = (p[0] - cx) / r, y = (p[1] - cy) / (r * sy * sy), z = (p[2] - cz) / r, l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
      for (const f of ICO_F) { const a = vs[f[0]], b = vs[f[1]], c = vs[f[2]]; g.triON(a, b, c, nn(a), nn(b), nn(c), inn, sc(a), sc(b), sc(c)); }
      return; }
    for (const f of ICO_F) {
      const a = vs[f[0]], b = vs[f[1]], c = vs[f[2]];
      const shade = 0.82 + 0.3 * (((a[1] + b[1] + c[1]) / 3 - cy) / (r * sy) * 0.5 + 0.5);
      g.triO(a, b, c, [col[0] * shade, col[1] * shade, col[2] * shade], inn);
    }
  }
  const ICO1 = (() => {   // icosphere subdivided once (42 vertices, 80 faces)
    const V = ICO_V.map(v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }), F = [], mid = new Map();
    const m = (a, b) => { const k = a < b ? a + ',' + b : b + ',' + a; if (mid.has(k)) return mid.get(k); const p = V[a], q = V[b], x = p[0] + q[0], y = p[1] + q[1], z = p[2] + q[2], l = Math.hypot(x, y, z); V.push([x / l, y / l, z / l]); mid.set(k, V.length - 1); return V.length - 1; };
    for (const [a, b, c] of ICO_F) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); F.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    return { V, F };
  })();
  function rock(g, cx, cy, cz, rx, ry, rz, rot, col, r_, jit, flat) {   // chunky boulder (33 faces): 7-sided, bulging middle, chamfered flat top (cy = centre height)
    const c = Math.cos(rot), s = Math.sin(rot), yb = cy - 0.4 * ry, yt = cy + (flat == null ? 0.6 : flat) * ry, ym = yb + (yt - yb) * 0.52, n = 7;
    const ring = (y, f) => { const out = []; for (let k = 0; k < n; k++) { const a = (k + (r_() - 0.5) * 0.5) / n * Math.PI * 2, kk = f * (1 + (r_() - 0.5) * jit), lx = Math.cos(a) * rx * kk, lz = Math.sin(a) * rz * kk; out.push([cx + lx * c - lz * s, y + (r_() - 0.5) * jit * ry * 0.3, cz + lx * s + lz * c]); } return out; };
    const B = ring(yb, 0.86), M = ring(ym, 1.0), U = ring(yt, 0.6), inn = [cx, (yb + yt) / 2, cz], sh = (k) => [col[0] * k, col[1] * k, col[2] * k];
    if (ROCK_SMOOTH) {   // rounded, smooth-shaded boulders (as in the reference): normals of the enclosing ellipsoid, darker at the foot
      const yc = (yb + yt) / 2, rh = (rx + rz) / 2, ryh = Math.max(0.3, (yt - yb) / 2), top = [cx, yt + ry * 0.12, cz];
      const N = (p) => { const x = (p[0] - cx) / (rh * rh), y = (p[1] - yc) / (ryh * ryh), z = (p[2] - cz) / (rh * rh), l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
      const cB = sh(0.8), cM = sh(1.0), cU = sh(1.08), cT = sh(1.12);
      for (let k = 0; k < n; k++) { const j = (k + 1) % n;
        g.quadON(B[k], B[j], M[j], M[k], N(B[k]), N(B[j]), N(M[j]), N(M[k]), inn, cB, cB, cM, cM);
        g.quadON(M[k], M[j], U[j], U[k], N(M[k]), N(M[j]), N(U[j]), N(U[k]), inn, cM, cM, cU, cU);
        g.triON(U[k], U[j], top, N(U[k]), N(U[j]), [0, 1, 0], [cx, yb - 5, cz], cU, cU, cT); }   // a gently domed top instead of a flat cap
      return; }
    for (let k = 0; k < n; k++) { const j = (k + 1) % n; g.quadO(B[k], B[j], M[j], M[k], sh(0.84), inn); g.quadO(M[k], M[j], U[j], U[k], sh(0.98), inn); }
    for (let k = 1; k < n - 1; k++) g.triO(U[0], U[k], U[k + 1], sh(1.1), [cx, yb - 5, cz]);
  }
  let ROCK_SMOOTH = false;
  function gable(g, cx, cy, cz, L, D, h, rot, col, colEnd) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const P = (lx, ly, lz) => [cx + lx * c - lz * s, cy + ly, cz + lx * s + lz * c];
    const b0 = P(-L / 2, 0, -D / 2), b1 = P(L / 2, 0, -D / 2), b2 = P(L / 2, 0, D / 2), b3 = P(-L / 2, 0, D / 2), r0 = P(-L / 2, h, 0), r1 = P(L / 2, h, 0);
    const inn = [cx, cy + h * 0.3, cz];
    // the far slope a shade lighter or darker: the same every time the track is built (hashed from where the roof stands)
    const hr = rng((Math.round(cx * 10) * 73856093) ^ (Math.round(cz * 10) * 19349663) ^ (Math.round(cy * 10) * 83492791));
    g.quadO(b0, r0, r1, b1, col, inn); g.quadO(b3, b2, r1, r0, vary(col, hr, 0.08), inn);
    g.triO(b0, b3, r0, colEnd || col, inn); g.triO(b1, r1, b2, colEnd || col, inn);
    // underside (overhang visible from low angles is rare) skipped
  }

  /* ---------------- helpers on track ---------------- */
  let T = null;
  let hash = null, HC = 32;
  function buildHash() {
    hash = new Map();
    for (let i = 0; i < T.N; i++) {
      const k = Math.floor(T.px[i] / HC) + ',' + Math.floor(T.pz[i] / HC);
      let a = hash.get(k); if (!a) { a = []; hash.set(k, a); } a.push(i);
    }
  }
  const _nr = { i: -1, dist: 999, lat: 0, bar: 0 };
  function nearest(x, z) {
    const cx = Math.floor(x / HC), cz = Math.floor(z / HC);
    let bi = -1, bd = 1e18;
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
      const arr = hash.get((cx + a) + ',' + (cz + b)); if (!arr) continue;
      for (const i of arr) { const dx = x - T.px[i], dz = z - T.pz[i]; const d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } }
    }
    _nr.i = bi;
    if (bi < 0) { _nr.dist = 999; _nr.lat = 999; _nr.bar = 0; return _nr; }
    _nr.dist = Math.sqrt(bd);
    _nr.lat = (x - T.px[bi]) * T.nx[bi] + (z - T.pz[bi]) * T.nz[bi];
    _nr.bar = _nr.lat > 0 ? T.br[bi] : T.bl[bi];
    return _nr;
  }
  // clearance beyond the barrier (negative = inside corridor)
  function clearance(x, z) { const n = nearest(x, z); if (n.i < 0) return 999; return Math.abs(n.lat) - n.bar; }
  function atS(s, lat) { const i = T.idx(s); return [T.px[i] + T.nx[i] * lat, T.pz[i] + T.nz[i] * lat, T.hd[i], i]; }
  function atSf(s, lat) {   // like atS, but interpolated between samples (for markings narrower than the 2 m sample spacing)
    const L = T.len, f = (((s % L) + L) % L) / T.ds, i = Math.floor(f) % T.N, j = (i + 1) % T.N, t = f - Math.floor(f);
    const x = T.px[i] + (T.px[j] - T.px[i]) * t, z = T.pz[i] + (T.pz[j] - T.pz[i]) * t, nx = T.nx[i] + (T.nx[j] - T.nx[i]) * t, nz = T.nz[i] + (T.nz[j] - T.nz[i]) * t;
    return [x + nx * lat, z + nz * lat, T.hd[i], t < 0.5 ? i : j];
  }
  function wrapS(s) { const L = T.len; return ((s % L) + L) % L; }

  /* ---------------- knockable safety-tyre walls and roadside posts (stebrički): the same rules on every track ----------------
     Short red/white 'tstack' walls (5-9 stacks, 1-2 staggered rows) on the outside of the corner exits and at the apexes of the
     tightest bends, and a 'post' every o.post[0..1] m along both verges. Everything stands on the verge:
     w + kerb + rh + 0.3 <= |d| <= bar - rh - 0.15 (skipped where that leaves less than 0.4 m), clear of the other props, the start
     grid, gravel traps (posts) and the asphalt of any other leg. The jitter comes from a hash of the sample index, never from the
     builders' R() (an extra R() call would re-roll all the later scenery). Options: post [min, max] spacing (m) or spots [[i, side]],
     postEdge [a, b] m past the asphalt edge, postCol(i), exits / apexes: how many corner walls (sharpest corners first), wallEdge [a, b],
     stacks [min, max], rows2: share of walls with a second row, maxLat: cap on |d|, floor(q): the verge's height (propFloorTable; then
     only level ground), skip(i, side, x, z, rh): true = not here.
     Returns { posts, stacks, spots } (spots: the o.spots entries that got a post). */
  function rpHash(a, b) { let h = Math.imul(a ^ 0x5bd1e995, 0x9e3779b1) ^ Math.imul((b + 0x7f4a7c15) | 0, 0x85ebca77); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
  function roadsideProps(list, o) {
    const N = T.N, w = T.w, L = T.len, ds = T.ds, CELL = 8, grid = new Map(), res = { posts: 0, stacks: 0, spots: new Set(), nSpots: o.spots ? o.spots.length : 0 };   // (world.propStats, for the tests)
    const RHK = { cone: 0.28, pylon: 0.36, tyre: 0.43, bale: 0.62, crate: 0.5, tstack: 0.43, bstack: 0.9, post: 0.14 };
    const put = (x, z, r) => { const k = Math.floor(x / CELL) + ',' + Math.floor(z / CELL); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(x, z, r); };
    const free = (x, z, r) => { const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);   // clear of every prop already placed (r + its keep-out radius)
      for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const A = grid.get(a + ',' + b); if (A) for (let k = 0; k < A.length; k += 3) if ((A[k] - x) ** 2 + (A[k + 1] - z) ** 2 < (A[k + 2] + r) ** 2) return false; }
      return true; };
    for (const it of list) put(it.x, it.z, (RHK[it.kind] || 0.6) + 0.4);
    const onGrid = (s) => { if (T.open) return false; let d = s - T.startS; d = ((d % L) + L) % L; return d > L - 112 || d < 12; };   // the start grid
    const band = (i, side, rh) => { const bar = side > 0 ? T.br[i] : T.bl[i]; return [w + (T.curb[i] ? T.curbW : 0) + rh + 0.3, Math.min(bar - rh - 0.15, o.maxLat || 1e9)]; };
    const fits = (i, side, x, z, rh) => {   // also on the verge of the nearest road sample (not on another leg's asphalt, not behind its barrier), and the track's own tests
      const n = nearest(x, z), a = Math.abs(n.lat);
      if (n.i < 0 || a < w + rh + 0.25 || a > n.bar - rh - 0.1) return false;
      if (o.floor) { const d = Math.abs((x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]), f0 = o.floor({ i, d: side * (d - rh) }, true), f1 = o.floor({ i, d: side * (d + rh) }, true);
        if (Math.abs(f0 - f1) > 0.15 || f0 + f1 < -1.4) return false; }   // level ground under it (where the verge isn't at road height), not down in a dip
      return !(o.skip && o.skip(i, side, x, z, rh));
    };
    const add = (kind, x, z, yaw, col, i, r) => { list.push({ kind, x, z, yaw, col, i }); put(x, z, r); };
    // tyre walls: the sharpest corners first
    const cs = T.corners.filter(c => c.sev >= 2).sort((a, b) => b.sev - a.sev || b.angle - a.angle || a.i0 - b.i0);
    const wall = (c, apex) => {
      const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, side = apex ? c.dir : -c.dir, sm = ((c.i0 + i1c) / 2) * ds;
      const n = Math.round(lerp(o.stacks[0], o.stacks[1], rpHash(c.i0, apex ? 21 : 22))), gap = 0.95, e = lerp(o.wallEdge[0], o.wallEdge[1], rpHash(c.i0, 23));
      for (const shift of apex ? [0, -4, 4] : [0, 8, 16, 24]) {   // (slide it along if it doesn't fit)
        const s0 = apex ? sm - (n - 1) * gap / 2 + shift : (i1c + 3) * ds + rpHash(c.i0, 24) * 6 + shift, P = [];
        const step = (s, lat, g) => { let st = g; for (let it = 0; it < 3; it++) { const a = atSf(s, side * lat), b = atSf(s + st, side * lat), dd = Math.hypot(b[0] - a[0], b[1] - a[1]); if (dd > 1e-3) st *= g / dd; } return st; };   // (the step along s that puts the next one g metres on: shorter on the outside of a bend, longer on the inside)
        for (let k = 0, s = s0; k < n; k++) {
          if ((T.open && (s < 2 || s > L - 2)) || onGrid(s)) break;
          const i = T.idx(s), [lo, hi] = band(i, side, 0.43); if (hi - lo < 0.4) break;
          const lat = clamp(w + e, lo, hi), [x, z, hd, ii] = atSf(s, side * lat);
          if (!fits(ii, side, x, z, 0.43) || !free(x, z, 0.35)) break;
          P.push({ x, z, hd, ii, k, lat, s }); s += step(s, lat, gap);
        }
        if (P.length < n) continue;
        const P2 = [];   // a second, staggered row behind the first where there is room
        if (rpHash(c.i0, 25) < o.rows2) for (const p of P) { if (p.k === n - 1) break; const lat = p.lat + 0.86, s = p.s + step(p.s, lat, gap / 2), i = T.idx(s), [, hi] = band(i, side, 0.43); if (lat > hi) continue;
          const [x, z, hd, ii] = atSf(s, side * lat); if (fits(ii, side, x, z, 0.43) && free(x, z, 0.35)) P2.push({ x, z, hd, ii, k: p.k }); }
        for (const p of P) add('tstack', p.x, p.z, p.hd + p.k * 0.7, (p.k >> 1) % 2, p.ii, 0.8);
        for (const p of P2) add('tstack', p.x, p.z, p.hd + p.k * 0.7 + 0.35, ((p.k + 1) >> 1) % 2, p.ii, 0.8);
        res.stacks += P.length + P2.length; return true;
      }
      return false;
    };
    let nEx = 0, nAp = 0;
    for (const c of cs) { if (nEx < (o.exits || 0) && wall(c, false)) nEx++; if (c.sev >= 3 && nAp < (o.apexes || 0) && wall(c, true)) nAp++; }
    // roadside posts
    const post = (s, side, k) => {
      const i = T.idx(s), gv = side > 0 ? T.gravR : T.gravL; if ((gv && gv[i]) || onGrid(s)) return false;
      const [lo, hi] = band(i, side, 0.14); if (hi - lo < 0.4) return false;
      const lat = clamp(w + lerp(o.postEdge[0], o.postEdge[1], rpHash(k, side + 31)), lo, hi), [x, z, hd, ii] = atSf(s, side * lat);
      if (!fits(ii, side, x, z, 0.14) || !free(x, z, 0.6)) return false;
      add('post', x, z, hd, o.postCol ? o.postCol(ii) : 0, ii, 0.5); res.posts++; return true;
    };
    if (o.spots) o.spots.forEach((sp, k) => { if (post(sp[0] * ds, sp[1], sp[0] * 2 + (sp[1] > 0 ? 1 : 0))) res.spots.add(sp); });
    else if (o.post) for (const side of [-1, 1]) {
      const s0 = T.open ? 2 : T.startS + 14, s1 = T.open ? L - 2 : T.startS + L - 114;
      for (let s = s0 + (side > 0 ? o.post[0] * 0.5 : 0), k = 0; s < s1; k++) { post(s, side, k * 2 + (side > 0 ? 1 : 0)); s += lerp(o.post[0], o.post[1], rpHash(k, side + 41)); }
    }
    return res;
  }
  // the circuits of the generic builder (Bakreni gozd already has plenty: a light top-up there). Skipped: excluded spots, uneven ground,
  // the Monaco tunnel and the inside of the Fairmont hairpin (a planted island), the pit lane
  const RP_THEME = {
    lake:      { post: [64, 80], postEdge: [1.0, 1.6], exits: 3, apexes: 0, wallEdge: [2.5, 3.0], stacks: [5, 7], rows2: 0.4 },
    city:      { post: [80, 100], postEdge: [0.9, 1.4], exits: 2, apexes: 0, wallEdge: [2.3, 2.8], stacks: [5, 7], rows2: 0.3 },
    mountain:  { post: [52, 66], postEdge: [0.9, 1.4], exits: 4, apexes: 0, wallEdge: [2.5, 3.0], stacks: [5, 7], rows2: 0.4 },
    ljubljana: { post: [52, 66], postEdge: [0.9, 1.4], exits: 4, apexes: 1, wallEdge: [2.3, 2.8], stacks: [5, 8], rows2: 0.4 },
    monaco:    { post: [46, 60], postEdge: [0.8, 1.2], exits: 6, apexes: 1, wallEdge: [2.2, 2.7], stacks: [5, 8], rows2: 0.3 },
    forest:    { post: [190, 240], postEdge: [0.9, 1.3], exits: 0, apexes: 0, wallEdge: [2.5, 3.0], stacks: [5, 6], rows2: 0 },
  };
  // the verge's real height beyond the asphalt edge, relative to the road (per sample and side, every 0.5 m out to 12 m): the knockable
  // props stand and land on it (Core: Race.setProps(list, floor)). vis(x, z, i, side, o): the visible ground height there, or
  // prof(i, side): the verge's cross-section [[offset, height above the road], ...] (the corridor builders' own verge ribbons).
  // opt.cap(i, side, o): the table's ceiling there (default 0.3 above the road); opt.ex = { f(x, z, ry), on }: where the table can't follow
  // the visible surface (steps at an angle to the track: a deck's edge, the water's edge, a planter), on[a * 2 + side (0 left, 1 right)]
  // marks the segment a..a+1 and the knocked props use f (the surface's absolute height at their own spot, q.x/q.z from Track.query;
  // ry: the road's). floor(q, near): between two samples the rows are blended by q.t; near (or a q without a/t): the nearest sample's row
  // only, which is what the placement test sees (roadsideProps.fits) and where the standing props start (Race.setProps). On the asphalt:
  // 0, or the banking's tilt (Track.bankAt: the Karussell)
  const _pfb = { dy: 0, sl: 0 };
  function propFloorTable(vis, prof, opt) {
    const N = T.N, w = T.w, NE = 25, tab = new Float32Array(N * 2 * NE), cap = opt && opt.cap, EX = opt && opt.ex, TT = T, open = T.open, bank = !!T.bank;
    for (let i = 0; i < N; i++) for (let sd = 0; sd < 2; sd++) { const side = sd ? 1 : -1, ry = T.hasElev ? T.hy[i] : 0, P = prof ? prof(i, side) : null;
      for (let k = 0, m = 0; k < NE; k++) { const o = w + k * 0.5; let y;
        if (P) { while (m < P.length - 2 && P[m + 1][0] < o) m++; const a = P[m], b = P[m + 1]; y = a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); }
        else y = vis(T.px[i] + T.nx[i] * side * o, T.pz[i] + T.nz[i] * side * o, i, side, o) - ry;
        tab[(i * 2 + sd) * NE + k] = Math.min(cap ? cap(i, side, o) : 0.3, y); } }
    return (q, near) => { const e = Math.abs(q.d) - w; if (!(e > 0)) return bank && q.s >= 0 ? TT.bankAt(q.s, q.d, _pfb).dy : 0;
      const f = Math.min(e * 2, NE - 1.001), k = Math.floor(f), u = f - k, sd = q.d > 0 ? 1 : 0;
      if (near || !(q.t >= 0) || !(q.a >= 0 && q.a < N)) { const b = ((q.i >= 0 && q.i < N ? q.i : 0) * 2 + sd) * NE + k; return tab[b] + (tab[b + 1] - tab[b]) * u; }
      const a = q.a; if (EX && EX.on[a * 2 + sd] && q.x !== undefined) { const ry = TT.hasElev ? TT.elevAt(q.s).y : 0; return EX.f(q.x, q.z, ry) - ry; }
      const a1 = a + 1 < N ? a + 1 : open ? a : 0, b = (a * 2 + sd) * NE + k, c = (a1 * 2 + sd) * NE + k, y0 = tab[b] + (tab[b + 1] - tab[b]) * u;
      return y0 + (tab[c] + (tab[c + 1] - tab[c]) * u - y0) * q.t; };
  }
  function trackPropsGeneric(out, excluded, island, decks, slabs) {
    const o = RP_THEME[THEME]; if (!o) return null;
    const tu = T.def.tunnel, L = T.len, roadY = (i) => (T.hasElev ? T.hy[i] : 0);
    // the visible ground: the GROUND mesh (its vertices exactly as built above, triangles a,c,b and b,c,d), on the mountain the dirt shoulder
    // above it. Monaco's and the mountain's ground mesh dips under the road edge, so their verge lies up to ~0.9 m below the road: the props
    // get a floor there (they stand and land on the verge). Elsewhere the verge is at road height; spots where it isn't are skipped.
    const B = out.bounds, cell = THEME === 'mountain' ? 6 : 8, drop = THEME === 'monaco' ? 1.0 : THEME === 'mountain' ? 0.8 : 0, mk = T.def.roadSurface === 'makadam';
    const vc = new Map(), vh = (a, b) => { const key = a * 65536 + b; let h = vc.get(key); if (h !== undefined) return h;
      const x = B.minX + a * cell, z = B.minZ + b * cell; h = groundH(x, z); if (drop) { const nn = nearest(x, z); if (nn.i >= 0) h -= drop * (1 - sstep(T.w + 0.3, T.w + 3.5, Math.abs(nn.lat))); } vc.set(key, h); return h; };
    const meshY = (x, z) => { const fx = (x - B.minX) / cell, fz = (z - B.minZ) / cell, a = Math.floor(fx), b = Math.floor(fz), u = fx - a, v = fz - b;
      const hb = vh(a + 1, b), hc = vh(a, b + 1); if (u + v <= 1) { const ha = vh(a, b); return ha + (hb - ha) * u + (hc - ha) * v; } const hd = vh(a + 1, b + 1); return hd + (hc - hd) * (1 - u) + (hb - hd) * (1 - v); };
    const vis = (x, z, i, side, off) => { let y = meshY(x, z); if (THEME === 'mountain' && off <= T.w + 2.2) {   // (the shoulder starts at the gravel road's wavy edge)
      const ew = T.w + (mk ? 0.26 * Math.sin(i * 0.37 + side * 1.7) * Math.sin(i * 0.113 + side) + 0.13 * Math.sin(i * 1.31 + side * 2.3) : 0);
      y = Math.max(y, roadY(i) + 0.02 - 1.02 * clamp((off - ew) / (T.w + 2.2 - ew), 0, 1)); } return y; };
    // (+ the red/white kerbs: drawn 0.045..0.085 m above the road from w to w + curbW; a sharp band over the table, not in it, so the
    // 0.5 m interpolation doesn't ramp the verge up to them and the placement test (it stays clear of the kerbs) sees the same floor)
    const kerbs = (f) => (q, near) => { const v = f(q, near), e = Math.abs(q.d) - T.w, a = q.a >= 0 && q.a < T.N ? q.a : q.i >= 0 && q.i < T.N ? q.i : 0;   // (a: the segment a..a+1 its kerb quad is drawn on)
      return e > 0 && e <= T.curbW && T.curb[a] && T.curb[(a + 1) % T.N] ? Math.max(v, 0.045 + 0.04 * e / T.curbW) : v; };   // (drop / Ljubljana: never the forest, whose outside kerbs differ)
    // ex(f, near, far): the exact floor f(x, z, ry) on the segments where some lateral point of either end row satisfies near(x, z) (all of
    // them without near; far(i): no point of row i can) (propFloorTable opt.ex)
    const ex = (f, near, far) => { const N = T.N, on = new Uint8Array(N * 2), hit = new Uint8Array(N * 2);
      for (let i = 0; i < N; i++) if (!(far && far(i))) for (let sd = 0; sd < 2; sd++) { const side = sd ? 1 : -1;
        for (let k = 0; k < 25; k++) { const o = side * (T.w + k * 0.5); if (!near || near(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o)) { hit[i * 2 + sd] = 1; break; } } }
      for (let i = 0; i < N; i++) for (let sd = 0; sd < 2; sd++) { const j = i + 1 < N ? i + 1 : T.open ? i : 0; on[i * 2 + sd] = hit[i * 2 + sd] | hit[j * 2 + sd]; }
      return { f, on }; };
    const boxes = (L) => { const A = new Float64Array((L || []).length * 7); (L || []).forEach(([cx, cz, hl, hw, r, top], k) => A.set([cx, cz, hl, hw, Math.cos(r), Math.sin(r), top], k * 7));
      return (x, z, m) => { let y = -1e9; for (let k = 0; k < A.length; k += 7) { const dx = x - A[k], dz = z - A[k + 1], hl = A[k + 2] + m, hw = A[k + 3] + m;   // top of the highest box [x, z, half length,
        if (dx * dx + dz * dz <= hl * hl + hw * hw && Math.abs(dx * A[k + 4] + dz * A[k + 5]) < hl && Math.abs(dz * A[k + 4] - dx * A[k + 5]) < hw) y = Math.max(y, A[k + 6]); }   //  half width, rot, top] under (x, z), m: grown by m
        return y; }; };
    let exM = null;
    if (THEME === 'monaco') {   // Monaco: the ground mesh itself (steep where it drops to the harbour and into the terrace cut into the verge of the
      // Fairmont's high road in, MC_TER), and the planter on the hairpin's island (24-sided, top yr + 0.6, in a kerb ring 0.9 m wide)
      const I = island, yr = I && T.hy ? T.hy[I.i] : 0, sg = TAU / 24, c24 = Math.cos(sg / 2);
      const planter = (x, z) => { if (!I) return -1e9; const dx = x - I.cx, dz = z - I.cz, r = Math.hypot(dx, dz); if (r > I.rI + 1) return -1e9;
        let a = Math.atan2(dz, dx); a -= (Math.floor(a / sg) + 0.5) * sg; const re = r * Math.cos(a) / c24;
        return re <= I.rI ? yr + 0.6 : re <= I.rI + 0.9 ? yr + 0.16 - 0.11 * (re - I.rI) / 0.9 : -1e9; };
      exM = ex((x, z, ry) => Math.max(Math.min(meshY(x, z), ry + 0.3), planter(x, z)));
    }
    const fl = drop ? (out.propFloor = kerbs(propFloorTable(vis, null, { ex: exM }))) : null;
    if (THEME === 'ljubljana' && RIVER) {   // only for the knocked props (they are still placed on level verge only): the banks of the Ljubljanica
      // slope down inside the barrier, with the water (y -1.25) where its surface is drawn; the circuit's bridges: the deck, barrier to barrier.
      // Near the river, the decks and the footbridges the floor is exact: the water out to RW / 2 - 0.4 from the river's centre line, the
      // terrain mesh in the strip between it and the bank, the deck slabs and footbridges to their ends
      const N = T.N, onW = new Uint8Array(N); for (let i = 0; i < N; i++) onW[i] = distRiver(T.px[i], T.pz[i]) < RW / 2 + 2.5 ? 1 : 0;
      const onDeck = (i) => onW[(i + N - 1) % N] || onW[i] || onW[(i + 1) % N];
      const inDeck = boxes(decks), inSlab = boxes(slabs), deck = (x, z) => inDeck(x, z, 0);   // (+ the footbridges)
      const reach = T.w + 12.5, exL = ex((x, z, ry) => { let y = Math.min(meshY(x, z), ry + 0.3); if (distRiver(x, z) < RW / 2 - 0.4) y = Math.max(y, -1.25); return Math.max(y, deck(x, z), inSlab(x, z, 0)); },
        (x, z) => distRiver(x, z) < RW / 2 + 3 || inDeck(x, z, 1.5) > -1e9 || inSlab(x, z, 1.5) > -1e9,
        (i) => distRiver(T.px[i], T.pz[i]) > RW / 2 + 3 + reach && inDeck(T.px[i], T.pz[i], 1.5 + reach) === -1e9 && inSlab(T.px[i], T.pz[i], 1.5 + reach) === -1e9);
      out.propFloor = kerbs(propFloorTable((x, z, i) => onDeck(i) ? 0 : Math.max(deck(x, z), distRiver(x, z) < RW / 2 - 0.4 ? Math.max(meshY(x, z), -1.25) : meshY(x, z)), null, { ex: exL }));
    }
    return out.propStats = roadsideProps(out.props, Object.assign({}, o, { floor: fl, skip: (i, side, x, z, rh) => {
      const s = i * T.ds, d = Math.abs((x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]);
      if (excluded(x, z)) return true;
      if (!fl) for (const e of [-rh, 0, rh]) { const o2 = d + e; if (Math.abs(vis(T.px[i] + T.nx[i] * side * o2, T.pz[i] + T.nz[i] * side * o2, i, side, o2) - roadY(i)) > 0.1) return true; }
      if (tu && s > tu[0] * L - 25 && s < tu[1] * L + 20) return true;
      if (island && side === island.sg) { const d = Math.abs(s - island.s); if (Math.min(d, L - d) < 45) return true; }
      return !!(T.def.pit && (T.pitAt(s) || T.pitAt(s + 25) || T.pitAt(s - 25)));
    } }));
  }
  // Pikes Peak: its marker posts become knockable where they fit (spots: [[i, side]] where buildPikes wanted one; the orange snow poles up
  // high too), tyre walls at the hairpin exits. Only within w + 2 (farther out the verge falls away from the road), on level verge; the
  // start and summit areas keep their fixed posts. The props stand on the verge's own height. Drawn out to 150 m (a long open view).
  function pikesProps(out, spots) {
    out.propR = 150;
    const sA = T.startS + 60, sB = T.finishS - 40, w = T.w;
    out.propFloor = propFloorTable(null, (i, side) => {   // (buildPikes' verge: the gravel strip, then the dusty verge lifted onto the ground where it rises)
      const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o; return [o, Math.max(h, pkGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.05 - y)]; };
      return [[w, 0.012], [w + 0.9, -0.02], lift(Math.max(w + 1.5, bar - 2.5), -0.02 - 0.2 * (1 - 2.5 / Math.max(2.6, bar - w - 0.9))), lift(bar, -0.22), lift(bar + 1.4, -0.62)]; });
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.3, 1.7], postCol: (i) => (T.hy[i] > 330 ? 1 : 0), exits: 6, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }
  // the Nordschleife: posts every 55-75 m, tyre walls at the corner exits, 1.8-2.4 m past the edge (the verge is narrow). Not on the
  // T13 start/finish straight (walls and fences), the bridges, the Karussell bowl and its banked approach, nor on a sloping verge.
  // The props stand on the verge's own height (a little below the road; lifted where the ground rises). Drawn out to 150 m.
  function nringProps(out, t13, onBridge, inKar) {
    out.propR = 150;
    const w = T.w;
    out.propFloor = propFloorTable(null, (i, side) => {   // (buildNring's verge rows: grass a little below the road, lifted onto the ground where it rises; the banking)
      const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i] + nrBankY(i, side * w), lift = (o, h) => { const q = side * o; return [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y)]; };
      return [[w, 0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)].map(([o, h]) => [o, h + nrBankY(i, side * o)]); },
      { cap: (i, side, o) => 0.3 + Math.max(0, nrBankY(i, side * o)) });   // (the ceiling rides up with the banked outer verge of the Karussell)
    const N = T.N, banked = (i) => { if (!T.bank) return false; for (let d = -14; d <= 14; d += 2) if (T.bank[(i + d + N) % N] > 0) return true; return false; };
    return out.propStats = roadsideProps(out.props, { post: [55, 75], postEdge: [1.8, 2.4], exits: 24, apexes: 3, wallEdge: [1.8, 2.4], stacks: [5, 7], rows2: 0.25,
      floor: out.propFloor, skip: (i) => t13(i) || onBridge(i) || inKar(i) || banked(i) });
  }

  let THEME = 'lake', SEA = null, RIVER = null, RW = 26, CASTLE = null;
  function distRiver(x, z) {   // distance to the river centre line (polyline)
    let best = 1e9;
    for (let k = 0; k < RIVER.length - 1; k++) {
      const [ax, az] = RIVER[k], [bx, bz] = RIVER[k + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)), ex = ax + dx * t - x, ez = az + dz * t - z;
      best = Math.min(best, ex * ex + ez * ez);
    }
    return Math.sqrt(best);
  }
  /* ---------------- lake ---------------- */
  const LAKE = { cx: -96, cz: 96, rx: 80, rz: 50 };
  const ISL = { x: -104, z: 92, r: 10 };
  function lakeEdge(th) { return 1 + 0.11 * Math.sin(3 * th + 1.1) + 0.07 * Math.sin(5 * th + 2.3) + 0.04 * Math.sin(8 * th); }
  function lakeSD(x, z) { // approx signed distance in meters (negative inside)
    if (THEME !== 'lake') return 1e4;
    const dx = (x - LAKE.cx) / LAKE.rx, dz = (z - LAKE.cz) / LAKE.rz;
    const r = Math.hypot(dx, dz), th = Math.atan2(dz, dx);
    return (r - lakeEdge(th)) * Math.min(LAKE.rx, LAKE.rz);
  }
  let hillN = null, mtnN = null, mtnN2 = null, mtnPeak = null, MF = null;
  function mfSample(arr, x, z) {   // bilinear lookup in the precomputed mountain field
    const f = MF; let gx = (x - f.x0) / f.cell, gz = (z - f.z0) / f.cell;
    gx = clamp(gx, 0, f.nx - 1.001); gz = clamp(gz, 0, f.nz - 1.001);
    const i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = f.nx;
    const a = arr[j * W + i], b = arr[j * W + i + 1], c = arr[(j + 1) * W + i], d = arr[(j + 1) * W + i + 1];
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }
  // Mountain terrain: the road is cut into rolling forested hills. Near the road the ground sits at
  // road height (a flat shelf a car can run onto); farther out it climbs into hills and tall peaks.
  function mountainH(x, z) {
    if (!T.hy) return 0;
    const n = nearest(x, z);
    const fb = MF ? mfSample(MF.hb, x, z) : 0;               // smooth average of nearby road heights
    let base, dist;
    if (n.i >= 0) {                                           // near the road: exact road height, easing into the smooth field
      dist = Math.max(0, Math.abs(n.lat) - n.bar);
      base = lerp(T.hy[n.i], fb, sstep(6, 45, dist));
    } else {                                                  // beyond the hash search radius: field only (no drop to 0)
      dist = MF ? Math.max(0, mfSample(MF.hd, x, z) - (T.w + 6)) : 200;
      base = fb;
    }
    const roll = mtnN(x, z) * 0.62 + mtnN2(x, z) * 0.38;    // 0..1 rolling relief
    const peak = Math.max(0, mtnPeak(x, z) - 0.5) / 0.5;    // sparse peak mask 0..1
    const hills = (6 + 42 * roll) * sstep(3, 58, dist) + peak * peak * 150 * sstep(70, 190, dist);
    return base + hills;
  }
  // ---- Monaco terrain: follows the circuit (Beau Rivage climbs to the Casino at ~40 m), keeps rising inland,
  // drops into Port Hercule and the sea (water plane at y = 0), and the Rock of Monaco-Ville stands ~55 m high south of the port.
  // (metres, origin Sainte-Dévote, x east, z south)
  const MC_WATER = [[145.4,79.8],[300.6,78.2],[447.7,79.8],[496.7,76.5],[545.7,68.4],[619.2,63.5],[692.8,53.7],[766.3,35.7],[833.3,7.9],[892.1,-28.0],[950.9,-68.9],[999.9,-108.1],[1042.4,-145.7],[1071.8,-178.4],[1084.9,-214.3],[1117.6,-263.3],[1182.9,-328.7],[1967.2,-328.7],[1967.2,1109.2],[-810.4,1109.2],[-810.4,733.4],[-124.2,725.2],[366.0,700.7],[464.0,619.0],[398.7,540.6],[218.9,504.6],[88.2,488.3],[58.8,471.9],[53.9,431.1],[42.5,400.0],[31.0,360.8],[22.9,324.9],[18.0,292.2],[26.1,256.3],[34.3,207.2],[47.4,161.5],[57.2,132.1],[70.3,109.2],[91.5,92.9]];   // harbour + sea, traced from the circuit map (the quay runs right behind the barriers)
  const MC_ROCK = { x0: -124.2, x1: 447.7, z0: 501.3, z1: 703.9, h: 55 };
  let MC_TER = null;   // terrace under the Fairmont hairpin's retaining wall (set per build)
  function inPoly(poly, x, z) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
  function polyDist(poly, x, z) { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const ax = poly[j][0], az = poly[j][1], vx = poly[i][0] - ax, vz = poly[i][1] - az, l2 = vx * vx + vz * vz || 1; const t = clamp(((x - ax) * vx + (z - az) * vz) / l2, 0, 1); d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return d; }
  function monacoH(x, z) {
    const r = MC_ROCK, inRock = x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
    if (!inRock && inPoly(MC_WATER, x, z)) return -0.6 - 5 * sstep(0, 14, polyDist(MC_WATER, x, z));   // harbour / sea floor
    const n = nearest(x, z), fb = MF ? mfSample(MF.hb, x, z) : 0;
    let base, dist;
    if (n.i >= 0) { dist = Math.max(0, Math.abs(n.lat) - n.bar); base = lerp(T.hy[n.i], fb, sstep(4, 40, dist)); }
    else { dist = MF ? Math.max(0, mfSample(MF.hd, x, z) - (T.w + 6)) : 200; base = fb; }
    let h = Math.max(1.4, base);                                                   // quays stand above the water
    const coastD = polyDist(MC_WATER, x, z);
    h += sstep(25, 260, dist) * sstep(20, 200, coastD) * (16 + 34 * sstep(-80, -650, z));   // the hillside behind keeps climbing inland
    if (x > r.x0 - 30 && x < r.x1 + 30 && z > r.z0 - 30 && z < r.z1 + 30) {       // the Rock: flat top, steep cliffs
      const e = Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z);
      h = Math.max(h, r.h * sstep(-4, 20, e));
    }
    // below the Fairmont hairpin's retaining wall: a terrace at the level of the road out, so the high road in stands on a real stone wall
    if (MC_TER && Math.hypot(x - MC_TER.x, z - MC_TER.z) < MC_TER.r) h = Math.min(h, MC_TER.h);
    return h;
  }
  // forest circuit: flat around the road, low rocky mounds under the boulder formations, a grassy hill in the bottom of the V,
  // and the lake to the north (its bed drops away below the water plane right behind the rocky shore)
  function forestRockH(x, z, c) {
    const fd = T && T.def; if (!fd || !fd.rocks) return 0;
    let h = 0; for (const [rx, rz, rr] of fd.rocks) { const d = Math.hypot(x - rx, z - rz); if (d < rr * 1.7) h = Math.max(h, (1.8 + rr * 0.2) * sstep(rr * 1.7, rr * 0.35, d)); }
    return h * sstep(5, 16, c);
  }
  function forestH(x, z) {
    const fd = T && T.def; if (!fd || !fd.rocks) return 0;
    const c = clearance(x, z);
    let h = forestRockH(x, z, c);
    if (fd.hill) for (const [hx, hz, hr, hh] of fd.hill) { const d = Math.hypot(x - hx, z - hz); if (d < hr) h = Math.max(h, hh * sstep(hr, hr * 0.2, d) * sstep(3, 13, c)); }
    if (fd.lake && inPoly(fd.lake, x, z)) h = Math.min(h, -0.4 - 4.5 * sstep(0, 10, polyDist(fd.lake, x, z)));
    return h;
  }
  const lakeFO = (x, z) => { const fd = T && T.def; return !!(fd && fd.lake && inPoly(fd.lake, x, z)); };
  const shoreFO = (x, z) => { const fd = T && T.def; return fd && fd.lake ? polyDist(fd.lake, x, z) * (inPoly(fd.lake, x, z) ? -1 : 1) : 1e4; };   // signed distance to the lake shore (negative in the water)
  function groundH(x, z) {
    if (THEME === 'city') return SEA && z > SEA.z + 8 ? -2.4 * sstep(SEA.z + 8, SEA.z + 26, z) : 0;
    if (THEME === 'ljubljana') {
      const dr = RIVER ? distRiver(x, z) : 1e9; let h = dr < RW / 2 + 1 ? -3.2 * sstep(RW / 2 + 1, RW / 2 - 1.5, dr) : 0;
      if (CASTLE) { const ex = (x - 200) / 165, ez = (z - 250) / 160, f = 1 - (ex * ex + ez * ez);
        if (f > 0) h += 62 * Math.pow(f, 1.5) * sstep(12, 48, clearance(x, z)) * sstep(RW / 2 + 5, RW / 2 + 28, dr); }
      return h;
    }
    if (THEME === 'mountain') return mountainH(x, z);
    if (THEME === 'monaco') return monacoH(x, z);
    if (THEME === 'forest') return forestH(x, z);
    let h = 0;
    const sd = lakeSD(x, z);
    if (sd < 2) h = -1.7 * sstep(-1, 7, -sd);
    const di = Math.hypot(x - ISL.x, z - ISL.z);
    if (di < ISL.r + 8) h = Math.max(h, lerp(-1.7, 0.9, sstep(ISL.r + 7, ISL.r - 3, di)));
    if (sd > 8) {
      const c = clearance(x, z);
      if (c > 40) h += hillN(x, z) * 10 * sstep(40, 110, c);
    }
    return h;
  }
  function valueNoise2(seed, scale) {
    const r = rng(seed), P = 64, g = new Float32Array(P * P); for (let i = 0; i < g.length; i++) g[i] = r();
    return (x, z) => {
      x /= scale; z /= scale; const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
      const I = (a, b) => g[(((b % P) + P) % P) * P + (((a % P) + P) % P)];
      const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
      return lerp(lerp(I(xi, zi), I(xi + 1, zi), u), lerp(I(xi, zi + 1), I(xi + 1, zi + 1), u), v);
    };
  }

  /* ---------------- BUILD ---------------- */
  function build(scene, track, tex, opts) {
    T = track; THEME = (track.def && track.def.theme) || 'lake'; ROCK_SMOOTH = THEME === 'forest'; SEA = (track.def && track.def.sea) || null; RIVER = track.def.river || null; RW = track.def.riverW || 26; CASTLE = track.def.castle || null; buildHash();
    if (THEME !== 'nring') NR = null;                              // free the last Nordschleife build's grids
    if (THEME === 'pikes') return buildPikes(scene, tex, opts);   // open mountain road: its own corridor builder (below)
    PK = null;                                                     // free the last Pikes build's grids (only that world's groundH used them)
    if (THEME === 'nring') return buildNring(scene, tex, opts);   // the 20.7 km Nordschleife: its own corridor builder (below)
    const R = rng(4242);
    hillN = valueNoise2(77, 60);
    mtnN = valueNoise2(83, 130); mtnN2 = valueNoise2(91, 55); mtnPeak = valueNoise2(97, 220);
    const macro = valueNoise2(5, 45), forestN = valueNoise2(9, 70), typeN = valueNoise2(13, 55);
    const dens = opts.density || 1;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH, props: [], ownTex: [] };   // props: loose trackside objects the cars can knock over (simulated by Core, drawn by Render)
    const ownTex = (t) => { out.ownTex.push(t); return t; };   // textures made for this build only: Render frees them with the scenery

    // bounds
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (let i = 0; i < T.N; i++) { minX = Math.min(minX, T.px[i]); maxX = Math.max(maxX, T.px[i]); minZ = Math.min(minZ, T.pz[i]); maxZ = Math.max(maxZ, T.pz[i]); }
    const B = { minX: minX - 170, maxX: maxX + 170, minZ: minZ - 170, maxZ: maxZ + 170 };
    out.bounds = B;
    MF = null; MC_TER = null;
    if (THEME === 'monaco') {   // the Fairmont hairpin: sharpest bend around lap fraction 0.39 (from the start line)
      const s0h = (T.startS + 0.389 * T.len) % T.len; let ia = T.idx(s0h), bk = 0;
      for (let d = -20; d <= 20; d += 2) { const i = T.idx(s0h + d); if (Math.abs(T.k[i]) > bk) { bk = Math.abs(T.k[i]); ia = i; } }
      const iIn = T.idx(ia * T.ds - 34), iOut = T.idx(ia * T.ds + 34), mx = (T.px[iIn] + T.px[iOut]) / 2, mz = (T.pz[iIn] + T.pz[iOut]) / 2;
      MC_TER = { x: mx, z: mz, r: Math.hypot(T.px[iIn] - T.px[iOut], T.pz[iIn] - T.pz[iOut]) * 0.3, h: (T.hy ? T.hy[iOut] : 0) - 0.5, apex: ia };
    }
    if (THEME === 'mountain' || THEME === 'monaco') {
      const cell = 6, x0 = B.minX - 30, z0 = B.minZ - 30;
      const nx = Math.ceil((B.maxX - B.minX + 60) / cell) + 1, nz = Math.ceil((B.maxZ - B.minZ + 60) / cell) + 1;
      const hb = new Float32Array(nx * nz), hd = new Float32Array(nx * nz);
      const sx = [], sz = [], sy = [];
      for (let i = 0; i < T.N; i += 3) { sx.push(T.px[i]); sz.push(T.pz[i]); sy.push(T.hy[i]); }
      const M = sx.length;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const x = x0 + i * cell, z = z0 + j * cell;
        let ws = 0, hs = 0, dmin = 1e18;
        for (let k = 0; k < M; k++) { const dx = x - sx[k], dz = z - sz[k], d2 = dx * dx + dz * dz; if (d2 < dmin) dmin = d2; const wq = 1 / (d2 + 900), w2 = wq * wq; ws += w2; hs += w2 * sy[k]; }
        hb[j * nx + i] = hs / ws; hd[j * nx + i] = Math.sqrt(dmin);
      }
      MF = { x0, z0, cell, nx, nz, hb, hd };
    }

    const matV = new THREE.MeshLambertMaterial({ vertexColors: true });
    out.matV = matV;

    /* ---- key positions ---- */
    const sStart = T.startS;
    // exclusion zones for trees: list of {x,z,r} circles and rect checks
    const excl = [];
    const exclRect = []; // oriented rects {x,z,hx,hz,rot}
    const inRect = (x, z, r) => { const dx = x - r.x, dz = z - r.z; const c = Math.cos(-r.rot), s = Math.sin(-r.rot); const lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) < r.hx && Math.abs(lz) < r.hz; };
    const exclF = [];   // extra exclusion tests (functions of x, z)
    const decks = [];   // Ljubljana's footbridges [x, z, half length, half width, rot, top]: the knocked props land on them (trackPropsGeneric)
    const slabs = [];   // the deck slabs of the circuit's own bridges over the Ljubljanica (the same form): the knocked props' exact floor at their ends
    const excluded = (x, z) => { for (const e of excl) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; for (const r of exclRect) if (inRect(x, z, r)) return true; for (const f of exclF) if (f(x, z)) return true; return false; };

    /* ================= GROUND ================= */
    {
      const cell = THEME === 'mountain' ? 6 : 8;
      const nx = Math.ceil((B.maxX - B.minX) / cell), nz = Math.ceil((B.maxZ - B.minZ) / cell);
      const pos = new Float32Array((nx + 1) * (nz + 1) * 3), col = new Float32Array((nx + 1) * (nz + 1) * 3), uv = new Float32Array((nx + 1) * (nz + 1) * 2);
      let k = 0;
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
        const x = B.minX + i * cell, z = B.minZ + j * cell;
        let h = groundH(x, z);
        if (THEME === 'mountain' || THEME === 'monaco') { const nn = nearest(x, z); if (nn.i >= 0) h -= (THEME === 'monaco' ? 1.0 : 0.8) * (1 - sstep(T.w + 0.3, T.w + 3.5, Math.abs(nn.lat))); }
        pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
        const us = THEME === 'city' || THEME === 'ljubljana' || THEME === 'monaco' ? 7 : 14; uv[k * 2] = x / us; uv[k * 2 + 1] = -z / us;
        let m = 0.86 + macro(x, z) * 0.28;
        let r = m, g = m, b = m;
        const c = clearance(x, z);
        if (c > 6) { const f = forestN(x, z); if (f > 0.5) { const d = sstep(0.5, 0.7, f) * 0.18; r -= d; g -= d * 0.8; b -= d; } }
        if (c < 3 && c > -40) { r *= 1.03; g *= 1.05; b *= 1.0; } // well kept verge
        const sd = lakeSD(x, z);
        if (sd < 5 && sd > -8) { const t = sstep(5, 0, sd) * sstep(-8, -2, sd); r = lerp(r, 2.3, t); g = lerp(g, 1.36, t); b = lerp(b, 2.2, t); }
        if (h < -0.5) { r *= 0.55; g *= 0.62; b *= 0.8; }
        if (THEME === 'city') { r *= 0.8; g *= 0.76; b *= 0.7; }
        if (THEME === 'forest') { const fd = T.def; r *= 0.8; g *= 0.84; b *= 1.46;   // sea-green lawns: teal in the shade, pale green in the sun (measured from the reference)
          if (fd.river) { let dm = 1e9; for (let k = 0; k < fd.river.length - 1; k++) { const [ax, az] = fd.river[k], [bx, bz] = fd.river[k + 1], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1); dm = Math.min(dm, Math.hypot(x - ax - vx * t, z - az - vz * t)); }
            const t = sstep(8, 4.5, dm); r = lerp(r, 1.5, t); g = lerp(g, 1.26, t); b = lerp(b, 1.36, t); }
          const hr = forestRockH(x, z, c);
          if (hr > 0.3) { const t = sstep(0.3, 3, hr) * 0.6; r = lerp(r, 1.4, t); g = lerp(g, 1.15, t); b = lerp(b, 1.35, t); }
          const sh = shoreFO(x, z);
          if (sh < 9) { const t = sstep(9, 2, sh); r = lerp(r, 1.3, t); g = lerp(g, 1.12, t); b = lerp(b, 1.2, t); }   // pale rock along the shore
          if (sh < 0) { const t = sstep(0, -6, sh); r = lerp(r, 0.3, t); g = lerp(g, 0.36, t); b = lerp(b, 0.62, t); } }   // lake bed
        if (THEME === 'monaco') { r *= 0.86; g *= 0.8; b *= 0.72; if (h < -0.3) { r *= 0.6; g *= 0.7; b *= 0.8; } }
        if (THEME === 'ljubljana') { r *= 0.8; g *= 0.77; b *= 0.72; if (h > 1.5) { const t = sstep(1.5, 6, h); r = lerp(r, 0.36, t); g = lerp(g, 0.5, t); b = lerp(b, 0.26, t); } }
        if (THEME === 'mountain') {
          const nb = macro(x, z);
          r = 0.34 + nb * 0.12; g = 0.44 + nb * 0.12; b = 0.24 + nb * 0.08;   // alpine green
          const rock = sstep(30, 62, h), snow = sstep(74, 115, h);
          r = lerp(r, 0.5, rock); g = lerp(g, 0.48, rock); b = lerp(b, 0.44, rock);   // rocky grey-green
          r = lerp(r, 1.25, snow); g = lerp(g, 1.3, snow); b = lerp(b, 1.35, snow);    // pale/snow caps
          if (c < 4 && c > -80) { r = lerp(r, 0.52, 0.55); g = lerp(g, 0.43, 0.55); b = lerp(b, 0.3, 0.55); } // dirt verge by the road
        }
        col[k * 3] = r; col[k * 3 + 1] = g; col[k * 3 + 2] = b;
        k++;
      }
      const idx = [];
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      const mat = new THREE.MeshLambertMaterial({ map: THEME === 'city' || THEME === 'ljubljana' || THEME === 'monaco' ? tex.paving : tex.grass, vertexColors: true });
      const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
      out.ground = m;
    }

    /* ================= TRACK SURFACE ================= */
    const N = T.N, w = T.w;
    const HYi = (i) => (T.hy ? T.hy[i] : 0);            // road surface height at sample i
    const P = (i, o, y) => [T.px[i] + T.nx[i] * o, HYi(i) + y, T.pz[i] + T.nz[i] * o];
    const HY = (p) => (T.hy ? T.hy[p[3]] : 0);          // height at an atS() result (uses its sample index)
    const makadam = T.def.roadSurface === 'makadam';
    const tileL = makadam ? 6 : 8;                                   // texture tile size (m)
    const rep = T.len / Math.round(T.len / tileL); // texture repeat length (seamless)
    // gravel roads get an irregular, wavy edge instead of a ruler-straight line (visual only, ±0.4 m)
    const edgeW = (i, side) => w + (makadam ? 0.26 * Math.sin(i * 0.37 + side * 1.7) * Math.sin(i * 0.113 + side) + 0.13 * Math.sin(i * 1.31 + side * 2.3) : 0);
    {
      const g = new GB(true);
      const offs = makadam ? Array.from({ length: 15 }, (_, k) => -w + 2 * w * k / 14) : [-w, -w * 0.75, -w * 0.5, -w * 0.25, 0, w * 0.25, w * 0.5, w * 0.75, w];
      const shade = (i, o) => {
        const rl = T.rl[i];
        let k = 1 - 0.2 * Math.exp(-((o - rl) * (o - rl)) / 5.5);
        k -= Math.abs(o) > w * 0.9 ? 0.04 : 0;
        return [k, k, k * 1.01];
      };
      // makadam: compacted, darker driven line; loose lighter gravel elsewhere; patches and damp spots along the road
      const shadeM = (i, o) => {
        const rl = T.rl[i], rut = Math.exp(-((o - rl) * (o - rl)) / 7.5);
        const pat = 0.94 + 0.08 * Math.sin(i * 0.071 + o * 0.35) * Math.sin(i * 0.023 + 1.3) + 0.05 * Math.sin(i * 0.53 + o * 1.1);
        const damp = Math.max(0, Math.sin(i * 0.047 + 0.6) * Math.sin(i * 0.019 + o * 0.21) - 0.72) * 1.6;   // occasional darker wet patches
        let k = pat * (1.05 - 0.3 * rut) * (1 - damp * 0.35);
        const e = sstep(w - 1.6, w, Math.abs(o));
        k *= 1 + 0.07 * e;                                            // loose berm of gravel at the edges
        const r = k * (1 + 0.05 * rut), gg = k * (1 - 0.015 * rut), b = k * (1 - 0.08 * rut);   // driven line: darker, browner
        return Math.abs(o) >= w - 1e-6 ? [r * 0.9, gg * 0.97, b * 0.78] : [r, gg, b];   // grassy tint right at the edge
      };
      const off = (i, o) => (makadam && Math.abs(o) >= w - 1e-6 ? Math.sign(o) * edgeW(i, Math.sign(o)) : o);
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        const v0 = i * T.ds / rep, v1 = (i + 1) * T.ds / rep;
        for (let c = 0; c < offs.length - 1; c++) {
          const o0 = offs[c], o1 = offs[c + 1];
          const a = P(i, off(i, o0), 0.02), b = P(i, off(i, o1), 0.02), cc = P(j, off(j, o1), 0.02), d = P(j, off(j, o0), 0.02);
          const sh = makadam ? shadeM : shade;
          g.quadUp(a, b, cc, d, [sh(i, o0), sh(i, o1), sh(j, o1), sh(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]);
        }
      }
      const mat = makadam
        ? new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.045, shininess: 7, specular: 0x1c1813, vertexColors: true })
        : new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true });
      if (THEME === 'forest') mat.color.setRGB(0.87, 0.89, 1.0);   // a touch more mauve, like the reference
      const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
      out.asphaltMat = mat;
    }
    if (THEME === 'mountain') {   // road shoulders: dirt embankment from the road edge down into the terrain
      const g = new GB(true);
      for (const side of [-1, 1]) for (let i = 0; i < N; i++) {
        const j = (i + 1) % N, v0 = i * T.ds / rep, v1 = (i + 1) * T.ds / rep;
        const ei = edgeW(i, side), ej = edgeW(j, side);
        const a = P(i, side * ei, 0.02), b = P(i, side * (w + 2.2), -1.0), c = P(j, side * (w + 2.2), -1.0), d = P(j, side * ej, 0.02);
        g.quadO(a, b, c, d, [0.72, 0.72, 0.62], P(i, side * (w + 1.1), -4), [[0, v0], [0.37, v0], [0.37, v1], [0, v1]]);
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
    }
    if (THEME === 'ljubljana' || THEME === 'monaco') {   // city street: dashed centre line
      const g = new GB(), wc = [0.93, 0.93, 0.9];
      for (let s0 = 0; s0 < T.len - 3.2; s0 += 9) {
        let dS = Math.abs(s0 - T.startS); dS = Math.min(dS, T.len - dS); if (dS < 8) continue;
        if (THEME === 'forest') { let km = 0; for (let d = -8; d <= 8; d += 4) km = Math.max(km, Math.abs(T.k[T.idx(s0 + d)])); if (km < 0.014) continue; }   // forest: dashes only through the corners, as in the reference
        const a = atS(s0, -0.13), b = atS(s0, 0.13), c = atS(s0 + 3, 0.13), d = atS(s0 + 3, -0.13);
        g.quadUp([a[0], HY(a) + 0.036, a[1]], [b[0], HY(b) + 0.036, b[1]], [c[0], HY(c) + 0.036, c[1]], [d[0], HY(d) + 0.036, d[1]], [wc, wc, wc, wc]);
      }
      if (THEME === 'monaco') {   // everyday street markings: zebra crossings where the public roads cross (it is a normal town road outside race week)
        for (const f of [0.035, 0.07, 0.17, 0.25, 0.34, 0.47, 0.76, 0.84, 0.9]) {
          const sc = (T.startS + f * T.len) % T.len;
          for (let o = -w + 0.9; o < w - 0.7; o += 1.15) { const a = atS(sc - 1.6, o), b = atS(sc - 1.6, o + 0.55), c = atS(sc + 1.6, o + 0.55), d = atS(sc + 1.6, o);
            g.quadUp([a[0], HY(a) + 0.037, a[1]], [b[0], HY(b) + 0.037, b[1]], [c[0], HY(c) + 0.037, c[1]], [d[0], HY(d) + 0.037, d[1]], [wc, wc, wc, wc]); }
          for (const off of [-3.2, 3.2]) { const a = atS(sc + off - 0.15, -w + 0.4), b = atS(sc + off - 0.15, w - 0.4), c = atS(sc + off + 0.15, w - 0.4), d = atS(sc + off + 0.15, -w + 0.4);   // stop lines either side
            g.quadUp([a[0], HY(a) + 0.037, a[1]], [b[0], HY(b) + 0.037, b[1]], [c[0], HY(c) + 0.037, c[1]], [d[0], HY(d) + 0.037, d[1]], [wc, wc, wc, wc]); }
        }
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
    }
    // edge lines (painted lines only on sealed roads, not on makadam; the forest circuit has none, as in the reference)
    if (!makadam && THEME !== 'forest') {
      const g = new GB();
      const white = [0.95, 0.95, 0.93];
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        for (const [o0, o1] of [[w - 0.55, w - 0.25], [-(w - 0.25), -(w - 0.55)]]) {
          g.quadUp(P(i, o0, 0.035), P(i, o1, 0.035), P(j, o1, 0.035), P(j, o0, 0.035), [white, white, white, white]);
        }
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
    }
    // curbs
    {
      const g = new GB(true);
      const cw = T.curbW;
      const wc = [1, 1, 1];
      for (const side of [-1, 1]) {
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N;
          if (!T.curb[i] || !T.curb[j]) continue;
          if (THEME === 'forest' && side * T.k[i] < 0 && Math.abs(T.k[i]) < 0.035) continue;   // forest: kerbs on the inside, outside only in hairpins
          const o0 = side * w, o1 = side * (w + cw);
          const v0 = i * T.ds / 3, v1 = (i + 1) * T.ds / 3;
          const a = P(i, o0, 0.045), b = P(i, o1, 0.085), c = P(j, o1, 0.085), d = P(j, o0, 0.045);
          g.quadUp(a, b, c, d, [wc, wc, wc, wc], [[0, v0], [1, v0], [1, v1], [0, v1]]);
          // outer lip
          const e = P(i, o1, 0.0), f = P(j, o1, 0.0);
          g.quadO(b, e, f, c, [0.6, 0.6, 0.6], P(i, side * (w + cw * 0.3), -1), [[1, v0], [1, v0], [1, v1], [1, v1]]);
        }
      }
      const mat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true });
      const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
    }
    // gravel traps
    {
      const g = new GB(true);
      for (const side of [-1, 1]) {
        const flag = side > 0 ? T.gravR : T.gravL, bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N;
          if (!flag[i] && !flag[j]) continue;
          const fi = flag[i] ? 1 : 0, fj = flag[j] ? 1 : 0;
          const inI = w + (T.curb[i] ? T.curbW : 0.35), inJ = w + (T.curb[j] ? T.curbW : 0.35);
          const outI = lerp(inI + 0.1, bar[i] - 0.7, fi), outJ = lerp(inJ + 0.1, bar[j] - 0.7, fj);
          const a = P(i, side * inI, 0.016), b = P(i, side * outI, 0.016), c = P(j, side * outJ, 0.016), d = P(j, side * inJ, 0.016);
          const uvp = (p) => [p[0] / 10, -p[2] / 10];
          const col = [1, 1, 1];
          g.quadUp(a, b, c, d, [col, col, col, col], [uvp(a), uvp(b), uvp(c), uvp(d)]);
        }
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ map: tex.gravel, vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
    }
    // start line + grid slots
    {
      const g = new GB(true);
      const i0 = T.startIdx;
      const s0 = T.startS;
      const a = atS(s0 - 0.8, -w), b = atS(s0 - 0.8, w), c = atS(s0 + 0.8, w), d = atS(s0 + 0.8, -w);
      const col = [1, 1, 1];
      const uM = Math.round(w * 2 / 0.8) / 16;   // two rows of 0.8 m squares right across the road (the texture holds 16 x 4 squares)
      g.quadUp([a[0], HY(a) + 0.04, a[1]], [b[0], HY(b) + 0.04, b[1]], [c[0], HY(c) + 0.04, c[1]], [d[0], HY(d) + 0.04, d[1]], [col, col, col, col], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      const mat = new THREE.MeshLambertMaterial({ map: tex.checker });
      tex.checker.repeat.set(1, 1);
      root.add(new THREE.Mesh(g.geometry(), mat));
      const gw = new GB();
      const wh = [0.93, 0.93, 0.9];
      for (let k = 1; k <= 14; k++) {
        const sb = s0 - 9 - (k - 1) * 7.5 + 2.6;
        const lat = (k % 2 === 1 ? -1 : 1) * 3.4;
        const p0 = atSf(sb, lat - 1.5), p1 = atSf(sb, lat + 1.5), p2 = atSf(sb + 0.35, lat + 1.5), p3 = atSf(sb + 0.35, lat - 1.5);
        gw.quadUp([p0[0], HY(p0) + 0.037, p0[1]], [p1[0], HY(p1) + 0.037, p1[1]], [p2[0], HY(p2) + 0.037, p2[1]], [p3[0], HY(p3) + 0.037, p3[1]], [wh, wh, wh, wh]);
        const q0 = atSf(sb - 1.6, lat - 1.5), q1 = atSf(sb + 0.35, lat - 1.5), q2 = atSf(sb + 0.35, lat - 1.25), q3 = atSf(sb - 1.6, lat - 1.25);
        gw.quadUp([q0[0], HY(q0) + 0.037, q0[1]], [q1[0], HY(q1) + 0.037, q1[1]], [q2[0], HY(q2) + 0.037, q2[1]], [q3[0], HY(q3) + 0.037, q3[1]], [wh, wh, wh, wh]);
      }
      root.add(new THREE.Mesh(gw.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })));
      void i0;
    }

    let SKIPBAR = null, MC_ISLAND = null, FO_NOFENCE = null, foPit = null, FO_TYRES = null;
    if (THEME === 'forest') {
      const fd = T.def, pit = fd.pit || [15.5, -238, 80];
      const dS = (i) => { let d = i * T.ds - sStart; if (d > T.len / 2) d -= T.len; if (d < -T.len / 2) d += T.len; return d; };
      // pit lane beside the straight (on its outside): centre offset, tapering in to the circuit edge at both ends
      foPit = (i) => T.pitAt(i * T.ds);   // (the same lane the cars drive in: Core.Track.pitAt)
      SKIPBAR = (side, i) => { if (side < 0) return false; const p = foPit(i); return !!p && p.gap; };   // no barrier where the lane leaves / rejoins the circuit (you drive in and out there)
      const iNear = (px, pz) => { let bi = 0, bd = 1e9; for (let k = 0; k < N; k++) { const dd = (T.px[k] - px) ** 2 + (T.pz[k] - pz) ** 2; if (dd < bd) { bd = dd; bi = k; } } return bi; };
      const st2 = fd.stand2 ? [dS(iNear(...fd.stand2[0])), dS(iNear(...fd.stand2[1]))].sort((a, b) => a - b) : null;
      FO_TYRES = [new Uint8Array(N), new Uint8Array(N)];   // [left, right]: outside of every corner of severity >= 2, and the inside of the lakeside top-left corner
      const iTL = iNear(4, 6);
      for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, out = -c.dir, inTL = ((iTL - c.i0 + N) % N) <= (i1c - c.i0);
        for (let k = c.i0 - 8; k <= i1c + 8; k++) { const ii = ((k % N) + N) % N; if (Math.abs(T.k[ii]) < 0.006 && (k < c.i0 || k > i1c)) continue; FO_TYRES[out > 0 ? 1 : 0][ii] = 1; if (inTL && c.sev >= 3) FO_TYRES[out > 0 ? 0 : 1][ii] = 1; } }
      FO_NOFENCE = (side, i) => { const d = dS(i);
        if (side > 0) return !!foPit(i);                                                  // the pit wall is a bare rail
        return (d > -110 && d < -19) || (st2 && d > st2[0] - 4 && d < st2[1] + 4); };      // the stands carry their own catch fence
    }
    if (THEME === 'monaco') {   // Fairmont hairpin: the inside is a planted island ringed by kerbs, not a barrier
      const bi = MC_TER ? MC_TER.apex : 0;
      const k = T.k[bi], Rr = 1 / Math.max(1e-3, Math.abs(k)), sg = k > 0 ? 1 : -1, cx = T.px[bi] + T.nx[bi] * sg * Rr, cz = T.pz[bi] + T.nz[bi] * sg * Rr;
      const rI = clamp(Rr - w - 0.9, 2.5, 9);
      MC_ISLAND = { i: bi, s: bi * T.ds, sg, Rr, cx, cz, rI };
      const near = (i) => { let d = Math.abs(i * T.ds - MC_ISLAND.s); d = Math.min(d, T.len - d); return d < 28; };
      SKIPBAR = (side, i) => side === sg && near(i);
      const inner = sg > 0 ? T.br : T.bl;   // walls on the island's planter edge (so nobody drives across it)
      for (let i = 0; i < N; i++) if (near(i)) { const d = Math.hypot(T.px[i] - cx, T.pz[i] - cz) - rI; if (d > w + 0.3 && d < inner[i]) inner[i] = d; }
    }
    /* ================= BARRIERS ================= */
    const scen = new Chunks(110);        // vertex-colored static scenery
    const texTires = new GB(true), texSpons = new GB(true), texFence = new GB(true), texCrowd = new GB(true);
    const tyreCh = new Chunks(110, true), FO_TR = [0.88, 0.33, 0.24], FO_TW = [0.95, 0.95, 0.94];   // painted tyres (textured, in chunks so the unseen ones are culled)
    if (THEME !== 'mountain') {
      const dStart = (i) => { let d = i * T.ds - sStart; if (d > T.len / 2) d -= T.len; if (d < -T.len / 2) d += T.len; return d; };
      for (const side of [-1, 1]) {
        const bar = side > 0 ? T.br : T.bl, grav = side > 0 ? T.gravR : T.gravL;
        const type = new Uint8Array(N); // 0 armco, 1 concrete, 2 tires
        for (let i = 0; i < N; i++) {
          const ds = dStart(i);
          if (ds > -200 && ds < 215) type[i] = 1;
          else { let gv = 0; for (let d = -4; d <= 4; d++) gv |= grav[(i + d + N) % N]; type[i] = gv ? 2 : 0; }
          if (THEME === 'ljubljana') type[i] = 1;
          if (THEME === 'monaco') type[i] = 0;
          if (THEME === 'forest') type[i] = FO_TYRES && FO_TYRES[side > 0 ? 1 : 0][i] ? 2 : 0;   // armco + catch fence, tyre walls only round the outside of the real corners (as in the reference)
        }
        const Q = (i, extra, y) => { const o = side * (bar[i] + 0.25 + extra); return [T.px[i] + T.nx[i] * o, y + HYi(i), T.pz[i] + T.nz[i] * o]; };
        const inward = (i) => Q(i, 3, 0.5);  // point behind the barrier (away from track)
        const outward = (i) => Q(i, -3, 0.5); // point on track side
        let lenAcc = 0, sponsorAcc = 0, fenceAcc = 0;
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N, t = type[i];
          const segL = Math.hypot(T.px[j] - T.px[i], T.pz[j] - T.pz[i]);
          if (SKIPBAR && SKIPBAR(side, i)) { lenAcc += segL; continue; }
          const g = scen.get(T.px[i] + T.nx[i] * side * bar[i], T.pz[i] + T.nz[i] * side * bar[i]);
          if (t === 0) { // armco
            const rail = [0.8, 0.82, 0.85], railD = [0.55, 0.57, 0.6];
            g.quadO(Q(i, 0, 0.45), Q(j, 0, 0.45), Q(j, 0, 0.78), Q(i, 0, 0.78), rail, inward(i));
            g.quadO(Q(i, 0.02, 0.45), Q(j, 0.02, 0.45), Q(j, 0.02, 0.78), Q(i, 0.02, 0.78), railD, outward(i));
            g.quadO(Q(i, 0, 0.78), Q(j, 0, 0.78), Q(j, 0.12, 0.8), Q(i, 0.12, 0.8), [0.9, 0.9, 0.92], [Q(i, 0.06, -3)[0], -3, Q(i, 0.06, -3)[2]]);
            if (i % 2 === 0) { const p = Q(i, 0.12, 0); box(g, p[0], p[1], p[2], 0.14, 0.8, 0.14, T.hd[i], THEME === 'forest' ? [0.3, 0.26, 0.28] : [0.42, 0.43, 0.46]); }
            if (THEME === 'forest' && !(FO_NOFENCE && FO_NOFENCE(side, i))) {   // light chain-link catch fence right behind the rail, as everywhere in the reference
              const fu0 = lenAcc / 2.5, fu1 = (lenAcc + segL) / 2.5;
              texFence.quadO(Q(i, 0.45, 0.8), Q(j, 0.45, 0.8), Q(j, 0.45, 3.0), Q(i, 0.45, 3.0), [1, 1, 1], inward(i), [[fu0, 0], [fu1, 0], [fu1, 0.9], [fu0, 0.9]]);
              if (i % 3 === 0) { const pp = Q(i, 0.5, 0); box(g, pp[0], pp[1], pp[2], 0.1, 3.1, 0.1, T.hd[i], [0.62, 0.63, 0.66]); }
            }
            if (THEME === 'monaco') {   // Monaco: double armco under a tall catch fence the whole way round
              g.quadO(Q(i, 0, 0.1), Q(j, 0, 0.1), Q(j, 0, 0.42), Q(i, 0, 0.42), [0.7, 0.72, 0.75], inward(i));
              const fu0 = lenAcc / 2.5, fu1 = (lenAcc + segL) / 2.5;
              texFence.quadO(Q(i, 0.2, 0.8), Q(j, 0.2, 0.8), Q(j, 0.2, 3.6), Q(i, 0.2, 3.6), [1, 1, 1], inward(i), [[fu0, 0], [fu1, 0], [fu1, 1.15], [fu0, 1.15]]);
              if (i % 3 === 0) { const p = Q(i, 0.25, 0); box(g, p[0], p[1], p[2], 0.1, 3.8, 0.1, T.hd[i], [0.35, 0.36, 0.38]); }
            }
          } else if (t === 1) { // concrete wall with painted top band
            const hgt = 1.05, top = ((i >> 1) % 2) ? [0.85, 0.16, 0.14] : [0.95, 0.95, 0.93];
            const wall = [0.78, 0.78, 0.76];
            g.quadO(Q(i, 0, 0), Q(j, 0, 0), Q(j, 0, hgt * 0.72), Q(i, 0, hgt * 0.72), wall, inward(i));
            g.quadO(Q(i, 0, hgt * 0.72), Q(j, 0, hgt * 0.72), Q(j, 0, hgt), Q(i, 0, hgt), top, inward(i));
            g.quadO(Q(i, 0, hgt), Q(j, 0, hgt), Q(j, 0.4, hgt), Q(i, 0.4, hgt), [0.86, 0.86, 0.84], [Q(i, 0.2, -3)[0], -3, Q(i, 0.2, -3)[2]]);
            g.quadO(Q(i, 0.4, 0), Q(j, 0.4, 0), Q(j, 0.4, hgt), Q(i, 0.4, hgt), [0.6, 0.6, 0.58], outward(i));
            if (THEME === 'ljubljana') {   // catch fence above the blocks
              const fu0 = lenAcc / 2.5, fu1 = (lenAcc + segL) / 2.5;
              texFence.quadO(Q(i, 0.25, hgt), Q(j, 0.25, hgt), Q(j, 0.25, 3.7), Q(i, 0.25, 3.7), [1, 1, 1], inward(i), [[fu0, 0], [fu1, 0], [fu1, 1.05], [fu0, 1.05]]);
              if (i % 3 === 0) { const pp = Q(i, 0.3, 0); box(g, pp[0], 0, pp[2], 0.12, 3.8, 0.12, T.hd[i], [0.35, 0.36, 0.38]); }
            }
          } else if (THEME === 'forest') { // tyre wall as in the reference: columns of three painted tyres (red and white in pairs), armco and mesh fence behind
            const SP = 0.88, gt = tyreCh.get(T.px[i] + T.nx[i] * side * bar[i], T.pz[i] + T.nz[i] * side * bar[i]);
            for (const [row, off] of [[0, 0.2], [1, 0.95]]) {   // two staggered rows of fat painted tyres, three high, red and white in pairs (as in the reference)
              const a = Q(i, off, 0), b = Q(j, off, 0);
              for (let m = Math.ceil(lenAcc / SP - 0.5 * row); (m + 0.5 * row) * SP < lenAcc + segL; m++) { const t2 = ((m + 0.5 * row) * SP - lenAcc) / segL, x = a[0] + (b[0] - a[0]) * t2, z = a[2] + (b[2] - a[2]) * t2, y = a[1] + (b[1] - a[1]) * t2;
                tyreCol(gt, x, y, z, 0.78, 0.43, ((m + row) >> 1) % 2 ? FO_TW : FO_TR, m * 0.7); } }
            g.quadO(Q(i, 1.5, 0.32), Q(j, 1.5, 0.32), Q(j, 1.5, 0.72), Q(i, 1.5, 0.72), [0.72, 0.73, 0.76], inward(i));
            const fu0 = lenAcc / 2.5, fu1 = (lenAcc + segL) / 2.5;
            texFence.quadO(Q(i, 1.8, 0.72), Q(j, 1.8, 0.72), Q(j, 1.8, 3.2), Q(i, 1.8, 3.2), [1, 1, 1], inward(i), [[fu0, 0], [fu1, 0], [fu1, 1.0], [fu0, 1.0]]);
            if (i % 3 === 0) { const pp = Q(i, 1.85, 0); box(g, pp[0], pp[1], pp[2], 0.12, 3.3, 0.12, T.hd[i], [0.35, 0.36, 0.38]); }
          } else { // tire wall
            const u0 = lenAcc / 3, u1 = (lenAcc + segL) / 3;
            const fv0 = THEME === 'forest' ? 0.52 : 0.02;
            texTires.quadO(Q(i, 0, 0), Q(j, 0, 0), Q(j, 0, 0.95), Q(i, 0, 0.95), [1, 1, 1], inward(i), [[u0, fv0], [u1, fv0], [u1, 0.98], [u0, 0.98]]);
            if (THEME === 'forest') texTires.quadO(Q(i, 0, 0.95), Q(j, 0, 0.95), Q(j, 0.95, 0.95), Q(i, 0.95, 0.95), [1, 1, 1], [T.px[i], -5, T.pz[i]], [[u0, 0.02], [u1, 0.02], [u1, 0.48], [u0, 0.48]]);   // tyre tops, seen from above
            g.quadO(Q(i, 0, 0.95), Q(j, 0, 0.95), Q(j, 0.75, 0.95), Q(i, 0.75, 0.95), [0.1, 0.1, 0.11], [Q(i, 0.3, -3)[0], -3, Q(i, 0.3, -3)[2]]);
            // catch fence
            fenceAcc += segL;
            const fu0 = (lenAcc) / 2.5, fu1 = (lenAcc + segL) / 2.5;
            texFence.quadO(Q(i, 1.4, 0.95), Q(j, 1.4, 0.95), Q(j, 1.4, 4.0), Q(i, 1.4, 4.0), [1, 1, 1], inward(i), [[fu0, 0], [fu1, 0], [fu1, 1.25], [fu0, 1.25]]);
            if (i % 3 === 0) { const p = Q(i, 1.45, 0); box(g, p[0], p[1], p[2], 0.12, 4.1, 0.12, T.hd[i], [0.3, 0.31, 0.33]); }
          }
          // sponsor boards
          sponsorAcc += segL;
          if ((t === 1 || (t === 2 && THEME !== 'forest') || THEME === 'monaco') && sponsorAcc > 9 && type[j] === t) {
            sponsorAcc = 0;
            const k = Math.floor(R() * 8);
            const u0 = (k % 2) * 0.5, u1 = u0 + 0.5, vTop = 1 - Math.floor(k / 2) * 0.25, vBot = vTop - 0.25;
            const i2 = (i + 2) % N;
            const extra = t === 2 ? -0.35 : -0.03;
            const y0 = t === 2 ? 0.1 : 0.12, y1 = t === 2 ? 0.95 : 0.74;
            const A = Q(i, extra, y0), Bp = Q(i2, extra, y0), Cp = Q(i2, extra, y1), D = Q(i, extra, y1);
            // reading direction: right side barrier reads against track direction
            const uv = side > 0 ? [[u1, vBot], [u0, vBot], [u0, vTop], [u1, vTop]] : [[u0, vBot], [u1, vBot], [u1, vTop], [u0, vTop]];
            texSpons.quadO(A, Bp, Cp, D, [1, 1, 1], inward(i), uv);
            if (t === 2) { // board also facing up-ish back
              texSpons.quadO(D, Cp, Q(i2, extra + 0.08, y1), Q(i, extra + 0.08, y1), [0.3, 0.3, 0.3], [A[0], -5, A[2]], [[u0, vTop], [u1, vTop], [u1, vTop], [u0, vTop]]);
            }
          }
          lenAcc += segL;
        }
      }
    }

    /* ================= START GANTRY ================= */
    if (THEME !== 'forest') {   // (the forest circuit has only the painted chequered line, as in the reference)
      const [x, z, h, i] = atS(sStart, 0);
      const gy = (T.hy ? T.hy[i] : 0);
      const g = scen.get(x, z);
      const span = Math.max(T.bl[i], T.br[i]) + 1.2;
      const nx = T.nx[i], nz = T.nz[i];
      const gray = [0.2, 0.22, 0.26];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy, z + nz * span * sd, 0.8, 7.6, 0.8, h, gray);
      box(g, x, gy + 6.4, z, 1.1, 1.3, span * 2 + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      // light panel
      box(g, x, gy + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [];
      const lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) {
        const o = (k - 2) * 1.0;
        const m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 }));
        m.position.set(x + nx * o, gy + 7.95, z + nz * o);
        root.add(m); lights.push(m);
      }
      out.dyn.lights = lights;
      // banner on gantry
      const u0 = 0, u1 = 0.5, vTop = 1 - 3 * 0.25, vBot = vTop - 0.25;
      const tx = T.tx[i], tz = T.tz[i];
      const half = span - 1.5;
      for (const f of [-1, 1]) {
        const cx = x + tx * 0.56 * f, cz = z + tz * 0.56 * f;
        const A = [cx - nx * half, gy + 6.45, cz - nz * half], Bp = [cx + nx * half, gy + 6.45, cz + nz * half], C = [cx + nx * half, gy + 7.65, cz + nz * half], D = [cx - nx * half, gy + 7.65, cz - nz * half];
        texSpons.quadO(A, Bp, C, D, [1, 1, 1], [x, 7, z], f < 0 ? [[u0, vBot], [u1, vBot], [u1, vTop], [u0, vTop]] : [[u1, vBot], [u0, vBot], [u0, vTop], [u1, vTop]]);
      }
    }

    /* ================= GRANDSTANDS (outside of main straight = left side) ================= */
    const sNear = (px, pz) => { let bi = 0, bd = 1e9; for (let i = 0; i < N; i++) { const d = Math.hypot(T.px[i] - px, T.pz[i] - pz); if (d < bd) { bd = d; bi = i; } } return bi * T.ds; };
    const standSpecs = THEME === 'forest' ? [] : THEME === 'mountain' || THEME === 'monaco' ? [] : THEME === 'ljubljana' ? [[sStart - 20, sStart + 85]] : [[sStart - 150, sStart - 40], [sStart - 25, sStart + 95]];
    for (const [sa, sb] of standSpecs) {
      const sm = (sa + sb) / 2, L = sb - sa;
      const im = T.idx(sm);
      const b0 = T.bl[im] + 3.2;
      const hd = T.hd[im];
      const tiers = 7;
      for (let k = 0; k < tiers; k++) {
        const lat = -(b0 + k * 1.55 + 0.8);
        const [x, z] = atS(sm, lat);
        const g = scen.get(x, z);
        const hgt = 0.6 + k * 0.72;
        box(g, x, 0, z, L, hgt, 1.55, hd, [0.62, 0.63, 0.66], [0.5, 0.52, 0.56]);
        // crowd strip on top of tier (textured)
        const a = atS(sa, lat - 0.7), bq = atS(sb, lat - 0.7), c = atS(sb, lat + 0.55), d = atS(sa, lat + 0.55);
        const y = hgt + 0.02;
        texCrowd.quadUp([a[0], y, a[1]], [bq[0], y, bq[1]], [c[0], y, c[1]], [d[0], y, d[1]], [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]], [[0, k * 0.14], [L / 12, k * 0.14], [L / 12, k * 0.14 + 0.13], [0, k * 0.14 + 0.13]]);
      }
      // back wall + roof + pillars
      const backLat = -(b0 + tiers * 1.55 + 1.2);
      const [bx, bz] = atS(sm, backLat);
      const g = scen.get(bx, bz);
      box(g, bx, 0, bz, L, 6.2, 0.6, hd, [0.55, 0.56, 0.6]);
      for (let s = sa; s <= sb + 0.1; s += 15) { const [px, pz] = atS(s, backLat + 0.2); box(g, px, 0, pz, 0.4, 8.6, 0.4, hd, [0.85, 0.86, 0.88]); }
      if (THEME === 'forest') for (let s0 = sa; s0 < sb - 4; s0 += 8) {   // yellow sponsor boards along the front of the open stand
        const a = atS(s0, -(b0 - 0.4)), b = atS(s0 + 7.6, -(b0 - 0.4)), g = scen.get(a[0], a[1]), yc = [0.98, 0.78, 0.18];
        g.quadO([a[0], 0.2, a[1]], [b[0], 0.2, b[1]], [b[0], 1.3, b[1]], [a[0], 1.3, a[1]], yc, [T.px[im], 0.7, T.pz[im]]);
        g.quadO([a[0], 0.62, a[1]], [b[0], 0.62, b[1]], [b[0], 0.88, b[1]], [a[0], 0.88, a[1]], [0.85, 0.2, 0.15], [T.px[im], 0.7, T.pz[im]]); }
      // cantilever roof over the upper tiers only, striped panels: crowd stays visible from above
      const roofD = tiers * 1.55 * 0.45 + 1.4;
      const roofLat = backLat + roofD / 2 - 0.2;
      let stripe = 0;
      for (let s0 = sa - 1; s0 < sb + 1 && THEME !== 'forest'; s0 += 6, stripe++) {   // (forest: open stands, as in the reference)
        const segL = Math.min(6, sb + 1 - s0);
        const [sx0, sz0] = atS(s0 + segL / 2, roofLat);
        const top = stripe % 2 ? [0.94, 0.95, 0.96] : [0.2, 0.45, 0.8];
        box(scen.get(sx0, sz0), sx0, 8.6, sz0, segL + 0.02, 0.35, roofD, hd, [0.8, 0.82, 0.86], top);
      }
      const [rx, rz] = atS(sm, -(b0 + tiers * 1.55 * 0.5 + 0.4));
      exclRect.push({ x: rx, z: rz, hx: L / 2 + 6, hz: tiers * 1.55 / 2 + 8, rot: hd });
    }

    /* ================= PIT BUILDING (inside of main straight = right side) ================= */
    if (THEME === 'lake') {
      const sa = sStart - 95, sb = sStart + 60, sm = (sa + sb) / 2, L = sb - sa;
      const im = T.idx(sm), hd = T.hd[im];
      const b0 = T.br[im];
      // pit lane asphalt
      const g0 = new GB(true);
      for (let s = sa - 30; s < sb + 30; s += 2) {
        const a = atS(s, b0 + 0.6), bq = atS(s, b0 + 12.5), c = atS(s + 2, b0 + 12.5), d = atS(s + 2, b0 + 0.6);
        const cc = [0.92, 0.92, 0.94];
        g0.quadUp([a[0], 0.02, a[1]], [bq[0], 0.02, bq[1]], [c[0], 0.02, c[1]], [d[0], 0.02, d[1]], [cc, cc, cc, cc], [[a[0] / 8, a[1] / 8], [bq[0] / 8, bq[1] / 8], [c[0] / 8, c[1] / 8], [d[0] / 8, d[1] / 8]]);
      }
      const pm = new THREE.Mesh(g0.geometry(), out.asphaltMat); pm.receiveShadow = true; root.add(pm);
      // pit lane line
      const gl = scen.get(...atS(sm, b0 + 6).slice(0, 2));
      for (let s = sa - 30; s < sb + 30; s += 2) { const a = atS(s, b0 + 6.3), bq = atS(s, b0 + 6.6), c = atS(s + 2, b0 + 6.6), d = atS(s + 2, b0 + 6.3); const cc = [0.95, 0.85, 0.2]; gl.quadUp([a[0], 0.03, a[1]], [bq[0], 0.03, bq[1]], [c[0], 0.03, c[1]], [d[0], 0.03, d[1]], [cc, cc, cc, cc]); }
      const lat = b0 + 13 + 7;
      const [x, z] = atS(sm, lat);
      const g = scen.get(x, z);
      box(g, x, 0, z, L, 3.6, 14, hd, [0.93, 0.93, 0.92]);
      box(g, x, 3.6, z, L, 2.6, 13, hd, [0.16, 0.24, 0.34], [0.2, 0.28, 0.38]); // glass upper floor
      box(g, x, 6.2, z, L + 1, 0.5, 15, hd, [0.95, 0.95, 0.96], [0.88, 0.89, 0.9]);
      const [sx2, sz2] = atS(sm, lat - 7.6);
      box(g, sx2, 6.25, sz2, L + 1, 0.55, 0.3, hd, [0.85, 0.12, 0.12]);
      // garages
      const nG = 12;
      for (let k = 0; k < nG; k++) {
        const s = sa + (k + 0.5) * L / nG;
        const [gx, gz] = atS(s, lat - 7.05);
        box(g, gx, 0, gz, L / nG * 0.72, 3.0, 0.2, hd, [0.18, 0.19, 0.22]);
        const [fx, fz] = atS(s, lat - 7.25);
        const teamCol = hex([0xe8e8ee, 0x1c5fd6, 0xf2c230, 0x2fa84f, 0xd81f45, 0xf07a1a][k % 6]);
        box(g, fx, 3.05, fz, L / nG * 0.72, 0.45, 0.2, hd, teamCol);
      }
      // control tower
      const [tx, tz] = atS(sb + 12, lat - 2);
      box(g, tx, 0, tz, 9, 14, 9, hd, [0.9, 0.9, 0.9]);
      box(g, tx, 14, tz, 10, 3, 10, hd, [0.14, 0.22, 0.32]);
      box(g, tx, 17, tz, 11, 0.5, 11, hd, [0.85, 0.12, 0.12], [0.93, 0.93, 0.95]);
      exclRect.push({ x, z, hx: L / 2 + 30, hz: 16, rot: hd });
      // paddock trucks & parking behind
      for (let k = 0; k < 9; k++) {
        const s = sa + 8 + k * 16;
        const [px, pz] = atS(s, lat + 14);
        if (lakeSD(px, pz) < 10) continue;
        const colr = hex(Core.DRIVER_NAMES && [0xe8e8ee, 0x1c5fd6, 0xf2c230, 0x2fa84f, 0xd81f45, 0xf07a1a, 0x9a2bd8, 0x19b7c7, 0x3b3fa8][k]);
        box(g, px, 0.4, pz, 12, 3.4, 2.5, hd, colr, [0.92, 0.92, 0.94]);
        const [cx2, cz2] = atS(s + 7.5, lat + 14);
        box(g, cx2, 0.4, cz2, 2.6, 2.8, 2.5, hd, [0.25, 0.26, 0.3]);
      }
      const carCols = [[0.8, 0.1, 0.1], [0.1, 0.3, 0.8], [0.9, 0.9, 0.9], [0.15, 0.15, 0.17], [0.9, 0.75, 0.1], [0.2, 0.6, 0.3], [0.6, 0.6, 0.65]];
      for (let row = 0; row < 3; row++) for (let k = 0; k < 22; k++) {
        if (R() < 0.25) continue;
        const s = sa + 4 + k * 5.2;
        const [px, pz] = atS(s, lat + 24 + row * 7);
        if (lakeSD(px, pz) < 6 || clearance(px, pz) < 5) continue;
        const cc = carCols[Math.floor(R() * carCols.length)];
        box(g, px, 0, pz, 4.1, 0.75, 1.75, hd + Math.PI / 2, cc);
        box(g, px, 0.75, pz, 2.1, 0.55, 1.5, hd + Math.PI / 2, [0.12, 0.16, 0.22], cc);
        excl.push({ x: px, z: pz, r: 4 });
      }
    }

    /* ================= LAKE ================= */
    if (THEME === 'lake') {
      const wg = new THREE.BufferGeometry();
      const pts = [LAKE.cx, -0.4, LAKE.cz], uvs = [LAKE.cx / 22, -LAKE.cz / 22], idx = [];
      const M = 96;
      for (let k = 0; k <= M; k++) {
        const th = k / M * TAU; const r = lakeEdge(th) * 1.08;
        const x = LAKE.cx + Math.cos(th) * LAKE.rx * r, z = LAKE.cz + Math.sin(th) * LAKE.rz * r;
        pts.push(x, -0.4, z); uvs.push(x / 22, -z / 22);
        if (k > 0) idx.push(0, k + 1, k);
      }
      wg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      wg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      wg.setIndex(idx); wg.computeVertexNormals();
      // ensure normals up
      const nrm = wg.getAttribute('normal'); for (let k = 0; k < nrm.count; k++) nrm.setXYZ(k, 0, 1, 0);
      const wmat = new THREE.MeshPhongMaterial({ color: 0xffffff, map: tex.water, specular: 0x9fd8ff, shininess: 90, transparent: true, opacity: 0.93 });
      const wm = new THREE.Mesh(wg, wmat); wm.receiveShadow = true; root.add(wm);
      out.dyn.water = tex.water;
      excl.push({ x: LAKE.cx, z: LAKE.cz, r: 0 });
      // island church
      const g = scen.get(ISL.x, ISL.z);
      const hy = 0.85;
      const rot = 0.35;
      box(g, ISL.x, hy, ISL.z, 9, 4.6, 5.2, rot, [0.96, 0.95, 0.9]);
      gable(g, ISL.x, hy + 4.6, ISL.z, 9.6, 6.0, 2.8, rot, [0.72, 0.24, 0.16], [0.96, 0.95, 0.9]);
      const c = Math.cos(rot), s = Math.sin(rot);
      const tx = ISL.x - c * 5.6, tz = ISL.z - s * 5.6;
      box(g, tx, hy, tz, 2.8, 12, 2.8, rot, [0.97, 0.96, 0.92]);
      box(g, tx, hy + 9.2, tz, 2.9, 0.4, 2.9, rot, [0.6, 0.55, 0.5]);
      cone(g, tx, hy + 12, tz, 2.1, 5.2, 4, [0.25, 0.27, 0.3], [0.3, 0.32, 0.35], rot + Math.PI / 4);
      box(g, ISL.x + c * 5.2, hy, ISL.z + s * 5.2, 2.2, 3.2, 3.4, rot, [0.94, 0.93, 0.88]);
      for (let k = 0; k < 7; k++) {
        const a = R() * TAU, r = 5.5 + R() * 3;
        const px = ISL.x + Math.cos(a) * r, pz = ISL.z + Math.sin(a) * r;
        if (Math.hypot(px - tx, pz - tz) < 3) continue;
        const hgt = 5 + R() * 4;
        box(g, px, hy - 0.3, pz, 0.35, hgt * 0.45, 0.35, 0, [0.4, 0.28, 0.18]);
        ico(g, px, hy + hgt * 0.62, pz, 1.8 + R() * 0.8, 1.15, vary([0.3, 0.55, 0.22], R, 0.2), R, 0.25);
      }
      // pier on south shore
      const [px0, pz0] = [LAKE.cx + 10, LAKE.cz + LAKE.rz * lakeEdge(Math.PI / 2 + 0.2) * 0.98];
      const gp = scen.get(px0, pz0);
      box(gp, px0, -0.1, pz0 - 6, 2.4, 0.35, 16, 0, [0.55, 0.4, 0.26], [0.62, 0.46, 0.3]);
      // swans (static)
      for (let k = 0; k < 7; k++) {
        const a = R() * TAU, r = 0.35 + R() * 0.5;
        const px = LAKE.cx + Math.cos(a) * LAKE.rx * r, pz = LAKE.cz + Math.sin(a) * LAKE.rz * r;
        if (Math.hypot(px - ISL.x, pz - ISL.z) < ISL.r + 4) continue;
        const gs = scen.get(px, pz); const ro = R() * TAU;
        box(gs, px, -0.45, pz, 1.0, 0.45, 0.55, ro, [0.97, 0.97, 0.97]);
        const hx = px + Math.cos(ro) * 0.45, hz = pz + Math.sin(ro) * 0.45;
        box(gs, hx, -0.1, hz, 0.12, 0.65, 0.12, ro, [0.97, 0.97, 0.97]);
        box(gs, hx + Math.cos(ro) * 0.12, 0.5, hz + Math.sin(ro) * 0.12, 0.28, 0.12, 0.12, ro, [0.95, 0.5, 0.1]);
      }
      // pletna boats (dynamic)
      const boats = [];
      for (let k = 0; k < 3; k++) {
        const bg = new GB();
        box(bg, 0, -0.5, 0, 7.5, 0.7, 1.9, 0, [0.5, 0.33, 0.2], [0.6, 0.42, 0.26]);
        box(bg, 3.9, -0.5, 0, 0.9, 0.85, 1.2, 0, [0.5, 0.33, 0.2]);
        for (const px of [-2, 2]) for (const pz of [-0.8, 0.8]) box(bg, px, 0.1, pz, 0.08, 1.4, 0.08, 0, [0.9, 0.9, 0.9]);
        const canopy = k % 2 ? [0.85, 0.15, 0.15] : [0.95, 0.95, 0.92];
        box(bg, 0, 1.45, 0, 4.8, 0.12, 2.1, 0, canopy, k % 2 ? [0.95, 0.95, 0.92] : [0.85, 0.15, 0.15]);
        const m = new THREE.Mesh(bg.geometry(), matV); m.castShadow = true; root.add(m);
        boats.push({ m, a: k * 2.1, sp: 0.018 + k * 0.004, r: 0.62 + k * 0.1 });
      }
      out.dyn.boats = boats; out.dyn.lake = LAKE;
      excl.push({ x: ISL.x, z: ISL.z, r: ISL.r + 30 });
    }

    /* ================= SPONSOR BRIDGE ================= */
    if (THEME !== 'mountain' && THEME !== 'monaco' && THEME !== 'forest') {   // (none over the forest circuit, as in the reference)
      // find straight section far from start
      let bestI = -1, bestScore = -1;
      for (let i = 0; i < N; i++) {
        let d = Math.abs(i * T.ds - sStart); d = Math.min(d, T.len - d);
        if (d < 420) continue;
        let mk = 0; for (let o = -14; o <= 14; o++) mk = Math.max(mk, Math.abs(T.k[(i + o + N) % N]));
        if (mk > 1 / 400) continue;
        const sc = d + 2000 * (1 / 400 - mk);
        if (sc > bestScore) { bestScore = sc; bestI = i; }
      }
      if (bestI >= 0) {
        const i = bestI, x = T.px[i], z = T.pz[i], h = T.hd[i];
        const nx = T.nx[i], nz = T.nz[i];
        const g = scen.get(x, z);
        const L1 = T.bl[i] + 1.8, L2 = T.br[i] + 1.8;
        box(g, x - nx * L1, 0, z - nz * L1, 2.4, 9.4, 2.4, h, [0.9, 0.9, 0.92]);
        box(g, x + nx * L2, 0, z + nz * L2, 2.4, 9.4, 2.4, h, [0.9, 0.9, 0.92]);
        const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2;
        box(g, cx, 6.6, cz, 2.6, 2.0, L1 + L2 + 2.4, h, [0.12, 0.13, 0.16], THEME === 'ljubljana' ? [0.8, 0.12, 0.15] : [0.95, 0.8, 0.12]);
        const half = (L1 + L2) / 2 - 1.2;
        const tx = T.tx[i], tz = T.tz[i];
        const k = 2, u0 = (k % 2) * 0.5, u1 = u0 + 0.5, vTop = 1 - Math.floor(k / 2) * 0.25, vBot = vTop - 0.25;
        for (const f of [-1, 1]) {
          const bx = cx + tx * 1.32 * f, bz = cz + tz * 1.32 * f;
          const A = [bx - nx * half, 6.75, bz - nz * half], Bp = [bx + nx * half, 6.75, bz + nz * half], C = [bx + nx * half, 8.45, bz + nz * half], D = [bx - nx * half, 8.45, bz - nz * half];
          texSpons.quadO(A, Bp, C, D, [1, 1, 1], [cx, 7.5, cz], f < 0 ? [[u0, vBot], [u1, vBot], [u1, vTop], [u0, vTop]] : [[u1, vBot], [u0, vBot], [u0, vTop], [u1, vTop]]);
        }
        out.bridgeIdx = i;
      }
    }

    /* ================= SPECTATORS: the instanced crowd layer (crowdCtx / crowdRun), fed by the corner crowds below and by runs per theme ================= */
    const CR = (() => { const cell = THEME === 'mountain' ? 6 : 8;
      return crowdCtx({ grid: { arr: out.ground.geometry.attributes.position.array, x0: B.minX, z0: B.minZ, cell, nx: Math.ceil((B.maxX - B.minX) / cell) + 1, nz: Math.ceil((B.maxZ - B.minZ) / cell) + 1 },
        near: clearance, excluded,
        water: (x, z) => lakeSD(x, z) < 3 || (RIVER && distRiver(x, z) < RW / 2 + 2) || (THEME === 'forest' && shoreFO(x, z) < 2.5) || groundH(x, z) < (THEME === 'monaco' ? 1.0 : -0.3) || (THEME !== 'monaco' && CR.gH(x, z) < -0.3) }); })();   // (the mesh sags between its 8 m vertices towards a river bed)
    exclF.push(CR.exclTest);   // trees and rocks placed later keep clear of the crowds
    const crFirst = (i, side) => {   // front row offset beyond the barrier: clear of the rail, the wall, or the catch fence behind a tyre wall
      if (THEME === 'mountain') return 3.0;
      if (THEME === 'ljubljana') return 1.05;   // the pavement between the catch fence (bar + 0.5) and the house fronts (bar + 3.5)
      if (THEME === 'monaco') return 1.0;
      if (THEME === 'forest') return FO_TYRES && FO_TYRES[side > 0 ? 1 : 0][i] ? 2.6 : 1.4;
      let d = i * T.ds - sStart; if (d > T.len / 2) d -= T.len; if (d < -T.len / 2) d += T.len; if (d > -200 && d < 215) return 1.2;   // concrete wall
      const grav = side > 0 ? T.gravR : T.gravL; for (let k = -4; k <= 4; k++) if (grav[(i + k + N) % N]) return 2.4;   // tyre wall, fence at bar + 1.65
      return 1.2;   // armco
    };
    const crRun = (d0, d1, side, o) => crowdRun(CR, sStart + d0, sStart + d1, side, Object.assign({ first: crFirst }, o));   // (distances from the start line)
    if (THEME !== 'forest') { const [, , , gi] = atS(sStart, 0), span = Math.max(T.bl[gi], T.br[gi]) + 1.2; for (const sd of [-1, 1]) CR.avoid(T.px[gi] + T.nx[gi] * span * sd, T.pz[gi] + T.nz[gi] * span * sd, 1.1); }   // start gantry posts
    if (out.bridgeIdx != null) { const i = out.bridgeIdx; CR.avoid(T.px[i] - T.nx[i] * (T.bl[i] + 1.8), T.pz[i] - T.nz[i] * (T.bl[i] + 1.8), 1.9); CR.avoid(T.px[i] + T.nx[i] * (T.br[i] + 1.8), T.pz[i] + T.nz[i] * (T.br[i] + 1.8), 1.9); }   // sponsor bridge pillars

    /* ================= CROWDS at corners ================= */
    if (THEME !== 'mountain' && THEME !== 'monaco' && THEME !== 'forest') {
      const shirt = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.2, 0.7, 0.3], [1, 0.55, 0.1], [0.9, 0.35, 0.65], [0.5, 0.3, 0.85], [0.12, 0.12, 0.14]];
      const spots = T.corners.filter(c => c.sev >= 2);
      for (const c of spots) {
        const side = -c.dir; // outside
        const bar = side > 0 ? T.br : T.bl;
        const len = Math.min(70, Math.max(30, c.angle / Math.max(1e-3, c.maxk) * 0.8));
        for (let s = c.s0 - 10; s < c.s0 + len; s += 0.9) {
          const i = T.idx(s);
          for (let row = 0; row < 4; row++) {
            if (R() < 0.3 + row * 0.12) continue;
            const lat = side * (bar[i] + (T.gravL[i] || T.gravR[i] ? 3.4 : 2.4) + row * 0.95 + (R() - 0.5) * 0.4);
            const sj = s + (R() - 0.5) * 0.6, [x, z] = atS(sj, lat);
            if (clearance(x, z) < 1.5 || excluded(x, z) || lakeSD(x, z) < 3 || (RIVER && distRiver(x, z) < RW / 2 + 2)) continue;
            const sc = shirt[Math.floor(R() * shirt.length)]; R();   // (the old figure's skin draw: keeps the random sequence of the later scenery)
            const ii = T.idx(sj), lk = 0.3 * (0.2 + crH(x, z, 12));   // (the exclusion circles below keep these spots 1.2 m apart)
            if (CR.gH(x, z) > -0.3) crowdPut(CR, x, CR.gH(x, z), z, -side * T.nx[ii] - T.tx[ii] * lk, -side * T.nz[ii] - T.tz[ii] * lk, { col: sc }, row);   // (not down the river bank)
            excl.push({ x, z, r: 1.2 });
          }
          if (R() < 0.05) { // flag
            const [x, z] = atS(s, side * (bar[i] + 7.2));
            if (clearance(x, z) > 1 && !excluded(x, z)) {
              const g = scen.get(x, z);
              box(g, x, 0, z, 0.08, 4.2, 0.08, 0, [0.8, 0.8, 0.8]);
              const fc = shirt[Math.floor(R() * 6)];
              box(g, x + 0.7, 3.2, z, 1.4, 0.9, 0.04, T.hd[i], fc);
            }
          }
        }
        // marshal post
        const [mx, mz] = atS(c.s0 + 6, side * (bar[T.idx(c.s0 + 6)] + 1.6));
        if (clearance(mx, mz) > 0.5) { const g = scen.get(mx, mz); box(g, mx, 0, mz, 1.6, 2.2, 1.6, T.hd[T.idx(c.s0)], [0.95, 0.5, 0.1], [0.9, 0.9, 0.9]); CR.avoid(mx, mz, 1.4); }
      }
    }

    /* ================= VILLAGE HOUSES & KOZOLEC ================= */
    const houses = [];
    if (THEME === 'lake') {
      const cands = [];
      for (let k = 0; k < 900; k++) {
        const x = lerp(B.minX + 30, B.maxX - 30, R()), z = lerp(B.minZ + 30, B.maxZ - 30, R());
        const c = clearance(x, z);
        if (c < 26 || c > 95) continue;
        if (lakeSD(x, z) < 14 || excluded(x, z)) continue;
        const v = forestN(x + 300, z - 200);
        if (v < 0.5) continue;
        cands.push([x, z]);
      }
      const roofs = [[0.62, 0.2, 0.14], [0.36, 0.22, 0.16], [0.3, 0.3, 0.34], [0.7, 0.3, 0.16]];
      for (const [x, z] of cands) {
        if (houses.length >= 16) break;
        if (houses.some(h => Math.hypot(h[0] - x, h[1] - z) < 20)) continue;
        const n = nearest(x, z); const rot = (n.i >= 0 ? T.hd[n.i] : 0) + (R() < 0.5 ? 0 : Math.PI / 2) + (R() - 0.5) * 0.3;
        const g = scen.get(x, z);
        const L = 9 + R() * 4, D = 7 + R() * 2.5;
        const y0 = groundH(x, z) - 0.3;
        box(g, x, y0, z, L, 3.4, D, rot, [0.95, 0.94, 0.9]);
        box(g, x, y0 + 3.4, z, L, 2.4, D, rot, [0.5, 0.33, 0.2]);
        gable(g, x, y0 + 5.8, z, L + 1.6, D + 1.8, 3.2 + R() * 0.8, rot, roofs[Math.floor(R() * roofs.length)], [0.5, 0.33, 0.2]);
        // balcony with flowers
        const c = Math.cos(rot), s = Math.sin(rot);
        const bx = x - s * (D / 2 + 0.6), bz = z + c * (D / 2 + 0.6);
        box(g, bx, y0 + 3.3, bz, L * 0.8, 0.9, 1.1, rot, [0.45, 0.3, 0.18]);
        for (let f = 0; f < 6; f++) { const o = (f / 5 - 0.5) * L * 0.7; box(g, bx + c * o, y0 + 4.2, bz + s * o, 0.5, 0.3, 0.4, rot, [0.9, 0.12, 0.15], [0.95, 0.2, 0.25]); }
        box(g, x + c * L * 0.25, y0 + 7.5, z + s * L * 0.25, 0.7, 2.2, 0.7, rot, [0.6, 0.58, 0.55]);
        houses.push([x, z]);
        excl.push({ x, z, r: Math.max(L, D) * 0.8 + 3 });
      }
      // kozolec (Slovenian hayrack) + hay bales in the right infield field
      let kx = 150, kz = 112;
      for (let t = 0; t < 40 && (clearance(kx, kz) < 28 || lakeSD(kx, kz) < 10); t++) { kx = 110 + R() * 110; kz = 60 + R() * 110; }
      for (let n = 0; n < 2; n++) {
        const x = kx + n * 16, z = kz + n * 9, rot = 0.2;
        if (clearance(x, z) < 22) continue;
        const g = scen.get(x, z);
        const c = Math.cos(rot), s = Math.sin(rot);
        const L = 14;
        for (let p = 0; p < 5; p++) { const o = (p / 4 - 0.5) * L; box(g, x + c * o, 0, z + s * o, 0.4, 6.2, 0.4, rot, [0.42, 0.29, 0.18]); }
        for (let r = 0; r < 7; r++) box(g, x, 0.9 + r * 0.72, z, L, 0.12, 0.16, rot, [0.52, 0.38, 0.22]);
        for (let r = 0; r < 4; r++) box(g, x - s * 0.02, 1.0 + r * 0.72, z + c * 0.02, L * 0.9, 0.45, 0.3, rot, [0.78, 0.7, 0.35]);
        gable(g, x, 6.2, z, L + 1.8, 3.2, 1.6, rot, [0.36, 0.26, 0.18]);
        excl.push({ x, z, r: 10 });
        for (let b = 0; b < 5; b++) {
          const bx = x + (R() - 0.5) * 26, bz = z + 10 + R() * 10;
          if (clearance(bx, bz) < 6) continue;
          cyl(g, bx, 0, bz, 0.8, 1.2, 8, [0.95, 0.95, 0.93], [0.9, 0.9, 0.88]);
          excl.push({ x: bx, z: bz, r: 2 });
        }
      }
      excl.push({ x: kx + 10, z: kz + 10, r: 34 });
    }
    if (THEME === 'lake') {   // spectators: the insides of both hairpins and of the long right-hander, the straights, around the stands and the pits
      crRun(968, 1098, -1, { rows: 5, dens: 0.8, sit: 0.3, label: 'hairpin 968 in' }); crRun(1262, 1352, 1, { rows: 5, dens: 0.8, sit: 0.3, label: 'hairpin 1262 in' });
      crRun(810, 952, 1, { rows: 4, dens: 0.72, sit: 0.2, label: '810 in' });
      for (const sd of [-1, 1]) { crRun(580, 760, sd, { rows: 3, dens: 0.5, label: 'straight 580' }); crRun(1100, 1260, sd, { rows: 3, dens: 0.5, label: 'straight 1100' }); }
      crRun(1520, 1640, 1, { rows: 3, dens: 0.62, label: '1520 R' });
      crRun(95, 235, -1, { rows: 4, dens: 0.62, label: 'after stands L' }); crRun(-270, -155, -1, { rows: 3, dens: 0.55, label: 'before stands L' }); crRun(70, 235, 1, { rows: 3, dens: 0.5, label: 'past pits R' });
      crRun(236, 320, 1, { rows: 3, dens: 0.6, label: '240 in' }); crRun(360, 470, -1, { rows: 3, dens: 0.55, label: '366 in' });
    }

    /* ================= TREES ================= */
    if (THEME === 'lake') {
      const step = 6.2 / Math.sqrt(dens);
      const pineC = [0.17, 0.34, 0.18], decC = [0.3, 0.52, 0.2], birchC = [0.46, 0.64, 0.28];
      const autumn = [[0.86, 0.52, 0.12], [0.93, 0.72, 0.16], [0.72, 0.3, 0.12]];
      for (let z = B.minZ; z < B.maxZ; z += step) {
        for (let x = B.minX; x < B.maxX; x += step) {
          const px = x + (R() - 0.5) * step * 0.9, pz = z + (R() - 0.5) * step * 0.9;
          const c = clearance(px, pz);
          if (c < 2.5 || c > 150) continue;
          if (lakeSD(px, pz) < 4) continue;
          if (excluded(px, pz)) continue;
          const f = forestN(px, pz);
          let p = sstep(0.36, 0.62, f);
          if (c < 10) p *= 0.35;
          if (c > 110) p = Math.max(p, 0.5);
          if (R() > p) continue;
          const g = scen.get(px, pz);
          const y0 = groundH(px, pz) - 0.2;
          const tn = typeN(px, pz);
          const hgt = 8 + R() * 7;
          if (tn < 0.55) { // pine
            box(g, px, y0, pz, 0.4, hgt * 0.3, 0.4, R(), [0.36, 0.25, 0.16]);
            const col = vary(pineC, R, 0.22);
            const rr = hgt * (0.26 + R() * 0.06);
            const rot = R() * TAU;
            cone(g, px, y0 + hgt * 0.16, pz, rr, hgt * 0.44, 7, col, [col[0] * 1.2, col[1] * 1.2, col[2] * 1.2], rot);
            cone(g, px, y0 + hgt * 0.4, pz, rr * 0.76, hgt * 0.38, 7, vary(col, R, 0.08), [col[0] * 1.25, col[1] * 1.25, col[2] * 1.25], rot + 0.4);
            cone(g, px, y0 + hgt * 0.62, pz, rr * 0.5, hgt * 0.38, 6, vary(col, R, 0.08), [col[0] * 1.3, col[1] * 1.3, col[2] * 1.3], rot + 0.8);
          } else if (tn < 0.8 || R() < 0.5) { // deciduous
            const au = R() < 0.07;
            const col = au ? autumn[Math.floor(R() * 3)] : vary(decC, R, 0.25);
            box(g, px, y0, pz, 0.45, hgt * 0.45, 0.45, R(), [0.38, 0.27, 0.17]);
            const r0 = hgt * (0.22 + R() * 0.06);
            ico(g, px, y0 + hgt * 0.62, pz, r0, 0.85, col, R, 0.3);
            ico(g, px + (R() - 0.5) * r0, y0 + hgt * 0.78, pz + (R() - 0.5) * r0, r0 * 0.72, 0.9, vary(col, R, 0.1), R, 0.3);
          } else { // birch
            box(g, px, y0, pz, 0.28, hgt * 0.6, 0.28, R(), [0.9, 0.9, 0.86]);
            ico(g, px, y0 + hgt * 0.7, pz, hgt * 0.16, 1.2, vary(birchC, R, 0.2), R, 0.3);
          }
        }
      }
    }

    /* ================= COASTAL CITY (Riviera) ================= */
    if (THEME === 'city') {
      const seaZ = SEA ? SEA.z : 1e9;
      // sea + beach
      {
        const x0 = B.minX - 260, x1 = B.maxX + 260, z0 = seaZ + 12, z1 = B.maxZ + 340;
        const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, -0.3, (z0 + z1) / 2);
        const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / 22, uv.getY(i) * (z1 - z0) / 22);
        const sea = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ map: tex.water, color: 0x7fc2e8, shininess: 70, specular: 0x6f8faf }));
        sea.receiveShadow = true; root.add(sea); out.dyn.water = tex.water;
        const bg = new THREE.PlaneGeometry(x1 - x0, 18); bg.rotateX(-Math.PI / 2); bg.translate((x0 + x1) / 2, 0.04, seaZ + 5);
        const buv = bg.attributes.uv; for (let i = 0; i < buv.count; i++) buv.setXY(i, buv.getX(i) * (x1 - x0) / 9, buv.getY(i) * 2);
        const beach = new THREE.Mesh(bg, new THREE.MeshLambertMaterial({ map: tex.sand })); beach.receiveShadow = true; root.add(beach);
      }
      const palm = (x, z, h) => {
        const g = scen.get(x, z), lean = (R() - 0.5) * 0.9, la = R() * TAU;
        const tx = x + Math.cos(la) * lean, tz = z + Math.sin(la) * lean;
        cyl(g, x, 0, z, 0.32, h * 0.55, 6, [0.5, 0.38, 0.24], null, 0.27);
        cyl(g, (x + tx) / 2, h * 0.55, (z + tz) / 2, 0.27, h * 0.45, 6, [0.56, 0.43, 0.28], null, 0.22);
        const top = [tx, h, tz], below = [tx, h - 4, tz];
        const n = 8 + Math.floor(R() * 3), a0 = R() * TAU;
        for (let k = 0; k < n; k++) {
          const a = a0 + k / n * TAU, L = 3.2 + R() * 1.2, droop = 1.1 + R() * 0.9, w = 0.5;
          const mid = [tx + Math.cos(a) * L * 0.55, h + 0.35, tz + Math.sin(a) * L * 0.55];
          const tip = [tx + Math.cos(a) * L, h - droop, tz + Math.sin(a) * L];
          const pl = [mid[0] - Math.sin(a) * w, mid[1], mid[2] + Math.cos(a) * w], pr = [mid[0] + Math.sin(a) * w, mid[1], mid[2] - Math.cos(a) * w];
          const col = k % 2 ? [0.26, 0.52, 0.2] : [0.34, 0.62, 0.24];
          g.triO(top, pl, mid, col, below); g.triO(top, mid, pr, col, below);
          g.triO(pl, tip, mid, col, below); g.triO(mid, tip, pr, col, below);
        }
      };
      // promenade along the sea: low sea wall, palms and street lamps
      for (let x = B.minX - 60; x < B.maxX + 60; x += 13) {
        const z = seaZ - 4;
        if (clearance(x, z) < 3 || excluded(x, z)) continue;
        palm(x + (R() - 0.5) * 2, z + (R() - 0.5) * 1.5, 7 + R() * 3);
        const g = scen.get(x + 6.5, z);
        cyl(g, x + 6.5, 0, z + 1.5, 0.09, 4.6, 5, [0.2, 0.22, 0.24]);
        box(g, x + 6.5, 4.6, z + 1.2, 0.25, 0.2, 0.9, 0, [0.95, 0.92, 0.75]);
        excl.push({ x, z, r: 3 });
      }
      box(scen.get(0, seaZ - 1), (B.minX + B.maxX) / 2, 0, seaZ - 1.2, B.maxX - B.minX + 520, 0.7, 0.6, 0, [0.9, 0.87, 0.8]);
      // Mediterranean buildings with window facades
      const fac = new GB(true);
      const pal = [[0.97, 0.9, 0.75], [0.95, 0.8, 0.55], [0.9, 0.62, 0.45], [0.98, 0.97, 0.94], [0.96, 0.87, 0.64], [0.84, 0.9, 0.96], [0.95, 0.74, 0.68], [0.93, 0.93, 0.8]];
      const placed = [];
      for (let k = 0; k < 7000 && placed.length < 260; k++) {
        const x = lerp(B.minX - 40, B.maxX + 40, R()), z = lerp(B.minZ - 40, seaZ - 30, R());
        const W = 11 + R() * 13, D = 10 + R() * 10, rad = Math.hypot(W, D) / 2;
        const c = clearance(x, z);
        if (c < rad * 0.55 + 2.5 || excluded(x, z)) continue;
        if (placed.some(p => Math.hypot(p[0] - x, p[1] - z) < (p[2] + rad) * 0.86)) continue;
        const ni = nearest(x, z).i, rot = ni >= 0 ? T.hd[ni] + (R() < 0.5 ? 0 : Math.PI / 2) : R() * TAU;
        const floors = 2 + Math.floor(R() * (c > 40 ? 6 : 4)), H = floors * 3.1 + 0.9;
        const col = pal[Math.floor(R() * pal.length)];
        const cr = Math.cos(rot), sr = Math.sin(rot);
        const P = (u, v, y) => [x + u * cr - v * sr, y, z + u * sr + v * cr];
        const cs = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]];
        const inside = [x, H / 2, z];
        for (let e = 0; e < 4; e++) {
          const [u0, v0] = cs[e], [u1, v1] = cs[(e + 1) % 4];
          const len = Math.hypot(u1 - u0, v1 - v0), bays = Math.max(2, Math.round(len / 3.4));
          fac.quadO(P(u0, v0, 0), P(u1, v1, 0), P(u1, v1, H), P(u0, v0, H), col, inside, [[0, 0], [bays, 0], [bays, floors], [0, floors]]);
        }
        const g = scen.get(x, z);
        if (R() < 0.35) gable(g, x, H, z, W + 0.8, D + 0.8, 2.2 + R() * 1.2, rot, [0.78, 0.36, 0.22], col);
        else {
          box(g, x, H, z, W, 0.5, D, rot, col.map(v => v * 0.86), col.map(v => v * 0.9));
          box(g, x + (R() - 0.5) * W * 0.5, H + 0.5, z + (R() - 0.5) * D * 0.5, 2.4, 1.6, 2.4, rot, [0.86, 0.84, 0.8]);
          if (R() < 0.5) box(g, x + (R() - 0.5) * W * 0.6, H + 0.5, z + (R() - 0.5) * D * 0.6, 1.2, 0.9, 1.8, rot, [0.7, 0.72, 0.74]);
        }
        placed.push([x, z, rad]); CR.block(x, z, W, D, rot);
        excl.push({ x, z, r: rad + 2 });
      }
      { const fm = new THREE.Mesh(fac.geometry(), new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true })); fm.castShadow = true; fm.receiveShadow = true; root.add(fm); }
      // palms in the town (squares, verges)
      for (let k = 0; k < 900; k++) {
        const x = lerp(B.minX - 30, B.maxX + 30, R()), z = lerp(B.minZ - 30, seaZ - 12, R());
        const c = clearance(x, z);
        if (c < 3 || c > 45 || excluded(x, z)) continue;
        if (R() < 0.25) continue;
        palm(x, z, 6 + R() * 4); excl.push({ x, z, r: 4 });
      }
      // yachts in the bay
      for (let k = 0; k < 22; k++) {
        const x = lerp(B.minX - 120, B.maxX + 120, R()), z = seaZ + 30 + R() * 130, rot = (R() - 0.5) * 0.6;
        const g = scen.get(x, z), L = 7 + R() * 7;
        box(g, x, -0.25, z, L, 1.1, L * 0.33, rot, [0.96, 0.96, 0.97], [0.88, 0.8, 0.66]);
        box(g, x - Math.cos(rot) * L * 0.1, 0.85, z - Math.sin(rot) * L * 0.1, L * 0.4, 0.9, L * 0.22, rot, [0.98, 0.98, 0.98], [0.9, 0.9, 0.92]);
        if (R() < 0.6) cyl(g, x, 0.85, z, 0.07, L * 0.95, 4, [0.85, 0.85, 0.88]);
      }
      // spectators: the seafront promenade along the start straight (between the barrier and the sea wall), the insides of the hairpins and corners
      crRun(-156, 172, 1, { first: 1.5, rows: 5, gap: 1.05, dens: 0.8, clump: 0.4, label: 'promenade' }); crRun(96, 180, -1, { rows: 3, dens: 0.6, label: 'start L' });
      crRun(1010, 1092, -1, { rows: 4, dens: 0.8, label: 'hairpin 1014 in' }); crRun(682, 730, -1, { rows: 4, dens: 0.8, label: 'hairpin 688 in' });
      crRun(410, 528, -1, { rows: 4, dens: 0.7, label: '414 in' }); crRun(870, 984, -1, { rows: 4, dens: 0.7, label: '874 in' });
      crRun(200, 272, -1, { rows: 3, dens: 0.6, label: '224 in' }); crRun(560, 664, 1, { rows: 3, dens: 0.55, label: '574 in' }); crRun(730, 790, 1, { rows: 3, dens: 0.6, label: '742 in' });
      crRun(1092, 1150, -1, { rows: 3, dens: 0.55, label: '1092 L' }); crRun(300, 400, -1, { rows: 2, dens: 0.45, label: '300 L' });
    }

    /* ================= MOUNTAIN RALLY (Gorski reli) ================= */
    if (THEME === 'mountain') {
      const pineC = [0.14, 0.3, 0.16], firC = [0.17, 0.36, 0.2], larchC = [0.4, 0.55, 0.24];
      const rockC = [0.5, 0.49, 0.47], rockD = [0.4, 0.39, 0.38];
      // ===== landmarks first, so the forest and rocks keep clear of them =====
      const fans = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.2, 0.7, 0.3], [1, 0.55, 0.1], [0.15, 0.5, 0.55], [0.7, 0.2, 0.5]];
      const person = (s, side, extra, x, z, row) => { const sc = fans[Math.floor(R() * fans.length)]; R(); crowdAt(CR, s, side, extra, x, z, { col: sc, flag: 0.08 }, row, (a, b) => !excluded(a, b)); };   // (two draws, as the old merged figure)
      const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
      // hilltop church (cerkvica) on the highest open spot away from the road
      {
        let best = null;
        for (let k = 0; k < 900; k++) {
          const x = lerp(B.minX + 60, B.maxX - 60, R()), z = lerp(B.minZ + 60, B.maxZ - 60, R());
          const c = clearance(x, z); if (c < 40 || c > 150) continue;
          const y = groundH(x, z); if (!best || y > best[2]) best = [x, z, y];
        }
        if (best) {
          const [x, z, y] = best, g = scen.get(x, z), rot = R() * TAU, white = [0.96, 0.95, 0.9], roof = [0.72, 0.24, 0.16];
          const c = Math.cos(rot), sn = Math.sin(rot), tx = x - c * 6.8, tz = z - sn * 6.8;
          box(g, x, y - 1, z, 11, 6.5, 6.5, rot, white);                              // nave (base sunk into the slope)
          gable(g, x, y + 5.5, z, 11.6, 7.2, 3.4, rot, roof, white);
          box(g, x + c * 5.9, y - 1, z + sn * 5.9, 2.4, 4.2, 3.8, rot, white);        // apse
          box(g, tx, y - 1, tz, 3.6, 15, 3.6, rot, white);                              // bell tower
          cone(g, tx, y + 14, tz, 2.9, 6, 4, roof, [0.5, 0.16, 0.1], rot + Math.PI / 4);
          excl.push({ x, z, r: 16 });
        }
      }
      // alpine chalets: white stone ground floor, wooden upper floor with balcony, dark roof, chimney
      for (let k = 0, n = 0; k < 1600 && n < 9; k++) {
        const x = lerp(B.minX + 40, B.maxX - 40, R()), z = lerp(B.minZ + 40, B.maxZ - 40, R());
        const c = clearance(x, z); if (c < 16 || c > 70 || excluded(x, z)) continue;
        const y = groundH(x, z);
        const ni = nearest(x, z).i, rot = (ni >= 0 ? T.hd[ni] : 0) + (R() < 0.5 ? 0 : Math.PI / 2);
        const g = scen.get(x, z), L = 9 + R() * 3, D = 7 + R() * 2, cr = Math.cos(rot), sr = Math.sin(rot);
        box(g, x, y - 1.2, z, L, 3.8, D, rot, [0.93, 0.91, 0.85]);
        box(g, x, y + 2.6, z, L, 2.6, D, rot, [0.52, 0.34, 0.2]);
        gable(g, x, y + 5.2, z, L + 1.6, D + 1.8, 2.6 + R() * 0.8, rot, [0.3, 0.2, 0.16], [0.52, 0.34, 0.2]);
        box(g, x - sr * (D / 2 + 0.6), y + 2.7, z + cr * (D / 2 + 0.6), L * 0.8, 0.9, 1.1, rot, [0.45, 0.3, 0.18]);   // balcony
        box(g, x + cr * L * 0.25, y + 5.6, z + sr * L * 0.25, 0.7, 2.2, 0.7, rot, [0.6, 0.58, 0.55]);                // chimney
        excl.push({ x, z, r: Math.max(L, D) * 0.8 + 4 }); n++;
      }
      // kozolec (Slovenian hayrack) with drying hay
      for (let k = 0, n = 0; k < 900 && n < 2; k++) {
        const x = lerp(B.minX + 40, B.maxX - 40, R()), z = lerp(B.minZ + 40, B.maxZ - 40, R());
        const c = clearance(x, z); if (c < 14 || c > 50 || excluded(x, z)) continue;
        const y = groundH(x, z), rot = R() * TAU, cr = Math.cos(rot), sr = Math.sin(rot), g = scen.get(x, z), wood = [0.5, 0.35, 0.2];
        for (let q = 0; q < 5; q++) { const o = (q - 2) * 3; box(g, x + cr * o, y - 0.5, z + sr * o, 0.35, 5.5, 0.35, rot, wood); }
        for (let r2 = 0; r2 < 4; r2++) box(g, x, y + 0.9 + r2 * 1.05, z, 12.6, 0.14, 0.16, rot, [0.58, 0.42, 0.24]);
        box(g, x, y + 1.3, z, 11.6, 2.6, 0.1, rot, [0.84, 0.74, 0.4]);    // hay hung on the rack
        gable(g, x, y + 5, z, 13.8, 2.6, 1.4, rot, [0.38, 0.26, 0.16], wood);
        excl.push({ x, z, r: 9 }); n++;
      }
      // every jump: spectators on both banks + a yellow warning board 40 m before it
      for (const b of (T.def.bumps || [])) {
        const s0 = (((b.at % 1) + 1) % 1) * T.len;
        for (const side of [-1, 1]) {
          for (let s = s0 - 16; s < s0 + 16; s += 1.0) {
            for (let row = 0; row < 3; row++) {
              if (R() < 0.35 + row * 0.15) continue;
              const ex = 2.6 + row * 1.1 + (R() - 0.5) * 0.4, [x, z] = onSide(s, side, ex);
              if (excluded(x, z)) continue;
              person(s, side, ex, x, z, row);
            }
          }
          for (const d of [-10, 0, 10]) { const [x, z] = onSide(s0 + d, side, 4); excl.push({ x, z, r: 7 }); }
        }
        const [x, z, i] = onSide(s0 - 40, 1, 0.6), y = groundH(x, z), g = scen.get(x, z);
        box(g, x, y, z, 0.12, 1.6, 0.12, T.hd[i], [0.4, 0.4, 0.42]);
        box(g, x, y + 1.3, z, 0.1, 1.1, 1.6, T.hd[i], [0.98, 0.8, 0.1]);
        box(g, x - T.tx[i] * 0.07, y + 1.55, z - T.tz[i] * 0.07, 0.04, 0.6, 0.2, T.hd[i], [0.1, 0.1, 0.1]);   // "!"
        box(g, x - T.tx[i] * 0.07, y + 1.38, z - T.tz[i] * 0.07, 0.04, 0.12, 0.2, T.hd[i], [0.1, 0.1, 0.1]);
      }
      // start/finish: crowd behind both edges + flag poles
      for (let s = sStart - 50; s < sStart + 30; s += 1.1) {
        for (const side of [-1, 1]) for (let row = 0; row < 3; row++) {
          if (R() < 0.4 + row * 0.12) continue;
          const ex = 3.2 + row * 1.1 + (R() - 0.5) * 0.4, [x, z] = onSide(s, side, ex);
          if (excluded(x, z)) continue;
          person(s, side, ex, x, z, row);
        }
      }
      for (let s = sStart - 70; s < sStart + 70; s += 9) {
        for (const side of [-1, 1]) {
          const [x, z, i] = onSide(s, side, 1.8); if (excluded(x, z)) continue;
          const y = groundH(x, z), g = scen.get(x, z);
          cyl(g, x, y, z, 0.06, 5.2, 5, [0.85, 0.85, 0.88]);
          box(g, x + T.tx[i] * 0.55, y + 4.1, z + T.tz[i] * 0.55, 1.1, 0.8, 0.04, T.hd[i], fans[Math.floor(R() * fans.length)]);
        }
      }
      for (const side of [-1, 1]) for (let s = sStart - 50; s < sStart + 30; s += 12) { const [x, z] = onSide(s, side, 4.5); excl.push({ x, z, r: 6 }); }
      // spectators on the banks above the road: under both banner arches and over the crest, round the bends before the first arch, the insides of 788 and 1389
      { const M = { gap: 1.1, maxSlope: 0.5, below: 1.0, sit: 0.25, flag: 0.08 }, L = T.len;
        for (const sd of [-1, 1]) { crRun(L * 0.3 - 34, L * 0.3 + 30, sd, Object.assign({ rows: 3, dens: 0.66, label: 'arch 1' }, M)); crRun(L * 0.62 - 60, L * 0.62 + 44, sd, Object.assign({ rows: 3, dens: 0.6, label: 'arch 2 crest' }, M)); }
        crRun(496, 542, 1, Object.assign({ rows: 3, dens: 0.6, label: '500 out' }, M)); crRun(574, 640, 1, Object.assign({ rows: 3, dens: 0.62, label: '578 out' }, M));
        crRun(780, 834, 1, Object.assign({ rows: 2, dens: 0.55, label: '788 in' }, M)); crRun(1382, 1436, -1, Object.assign({ rows: 2, dens: 0.55, label: '1389 in' }, M)); }
      // --- dense alpine forest on the slopes ---
      const step = 5.0 / Math.sqrt(dens);
      for (let z = B.minZ; z < B.maxZ; z += step) {
        for (let x = B.minX; x < B.maxX; x += step) {
          const px = x + (R() - 0.5) * step * 0.9, pz = z + (R() - 0.5) * step * 0.9;
          const c = clearance(px, pz);
          if (c < 3 || excluded(px, pz)) continue;
          const f = forestN(px, pz);
          let p = sstep(0.2, 0.52, f);
          if (c < 10) p *= 0.7;                 // slightly thinner right by the road
          if (c > 120) p = Math.max(p, 0.7);    // thick forest up the slopes
          const y0 = groundH(px, pz);
          if (y0 > 96) p *= sstep(120, 96, y0); // treeline: fewer trees near the peaks
          if (R() > p) continue;
          const g = scen.get(px, pz);
          const tn = typeN(px, pz);
          const hgt = 9 + R() * 9;
          if (tn < 0.72) { // spruce/fir (tall narrow conifer)
            box(g, px, y0 - 0.2, pz, 0.4, hgt * 0.28, 0.4, R(), [0.34, 0.24, 0.15]);
            const col = vary(tn < 0.4 ? pineC : firC, R, 0.2);
            const rr = hgt * (0.2 + R() * 0.05), rot = R() * TAU;
            cone(g, px, y0 + hgt * 0.12, pz, rr, hgt * 0.4, 7, col, [col[0] * 1.2, col[1] * 1.2, col[2] * 1.2], rot);
            cone(g, px, y0 + hgt * 0.36, pz, rr * 0.78, hgt * 0.38, 7, vary(col, R, 0.08), [col[0] * 1.25, col[1] * 1.25, col[2] * 1.25], rot + 0.5);
            cone(g, px, y0 + hgt * 0.6, pz, rr * 0.5, hgt * 0.4, 6, vary(col, R, 0.08), [col[0] * 1.3, col[1] * 1.3, col[2] * 1.3], rot + 1.0);
          } else { // larch (rounder, lighter)
            box(g, px, y0 - 0.2, pz, 0.4, hgt * 0.4, 0.4, R(), [0.4, 0.3, 0.18]);
            const col = vary(larchC, R, 0.22), r0 = hgt * (0.22 + R() * 0.06);
            ico(g, px, y0 + hgt * 0.6, pz, r0, 0.95, col, R, 0.32);
            ico(g, px + (R() - 0.5) * r0, y0 + hgt * 0.8, pz + (R() - 0.5) * r0, r0 * 0.7, 1.0, vary(col, R, 0.1), R, 0.3);
          }
          if (R() < 0.4) excl.push({ x: px, z: pz, r: 2 });
        }
      }
      // --- roadside understory: bushes, ferns, small rocks right behind the fence (always in camera view) ---
      {
        const bushC = [[0.2, 0.36, 0.14], [0.26, 0.42, 0.16], [0.3, 0.4, 0.12]], fernC = [0.34, 0.52, 0.18], rockC = [0.52, 0.5, 0.47];
        for (const side of [-1, 1]) {
          for (let s0 = 0; s0 < T.len; s0 += 2.6) {
            if (R() > 0.55) continue;
            const i = T.idx(s0), bar = side > 0 ? T.br[i] : T.bl[i];
            const o = side * (bar + 1.2 + R() * 8.5);
            const px = T.px[i] + T.nx[i] * o + (R() - 0.5) * 1.5, pz = T.pz[i] + T.nz[i] * o + (R() - 0.5) * 1.5;
            if (clearance(px, pz) < 0.8 || excluded(px, pz)) continue;
            const y0 = groundH(px, pz), g = scen.get(px, pz), t = R();
            if (t < 0.55) { const r0 = 0.7 + R() * 0.9; ico(g, px, y0 + r0 * 0.55, pz, r0, 0.8, vary(bushC[Math.floor(R() * 3)], R, 0.15), R, 0.3); if (R() < 0.5) ico(g, px + (R() - 0.5) * r0 * 1.6, y0 + r0 * 0.4, pz + (R() - 0.5) * r0 * 1.6, r0 * 0.65, 0.8, vary(bushC[0], R, 0.15), R, 0.3); }
            else if (t < 0.82) { for (let f = 0; f < 4; f++) cone(g, px + (R() - 0.5) * 1.1, y0, pz + (R() - 0.5) * 1.1, 0.35 + R() * 0.25, 0.7 + R() * 0.5, 5, vary(fernC, R, 0.15), [0.42, 0.6, 0.22], R() * TAU); }
            else { const r0 = 0.35 + R() * 0.55; ico(g, px, y0 + r0 * 0.3, pz, r0, 0.7, vary(rockC, R, 0.12), R, 0.35); }
          }
        }
      }
      // --- grass tufts and loose stones right along the gravel road edges ---
      {
        const tuftC = [[0.36, 0.55, 0.2], [0.46, 0.6, 0.22], [0.58, 0.62, 0.28]], stoneC = [0.62, 0.58, 0.52];
        for (const side of [-1, 1]) {
          for (let s0 = 0; s0 < T.len; s0 += 1.3) {
            if (R() > 0.6) continue;
            const i = T.idx(s0), e = edgeW(i, side), o = e + 0.05 + R() * 1.7, t = (o - e) / Math.max(0.5, w + 2.2 - e);
            const px = T.px[i] + T.nx[i] * side * o + (R() - 0.5) * 0.8, pz = T.pz[i] + T.nz[i] * side * o + (R() - 0.5) * 0.8;
            const y0 = HYi(i) + 0.02 - Math.min(1, t) * 1.02, g = scen.get(px, pz);
            if (R() < 0.8) { const col = tuftC[Math.floor(R() * 3)], nb = 3 + Math.floor(R() * 3); for (let q = 0; q < nb; q++) cone(g, px + (R() - 0.5) * 0.5, y0, pz + (R() - 0.5) * 0.5, 0.07 + R() * 0.07, 0.3 + R() * 0.45, 4, vary(col, R, 0.12), [col[0] * 1.25, col[1] * 1.2, col[2] * 1.1], R() * TAU); }
            else ico(g, px, y0 + 0.06, pz, 0.12 + R() * 0.2, 0.6, vary(stoneC, R, 0.12), R, 0.35);
          }
        }
      }
      // --- boulders & rock outcrops (scattered + clusters near the road) ---
      for (let k = 0; k < 520 / 1; k++) {
        const px = lerp(B.minX, B.maxX, R()), pz = lerp(B.minZ, B.maxZ, R());
        const c = clearance(px, pz);
        if (c < 3.5 || excluded(px, pz)) continue;
        if (R() > 0.5) continue;
        const g = scen.get(px, pz), y0 = groundH(px, pz);
        const s = 0.8 + R() * (c < 20 ? 2.2 : 4.5);
        const col = vary(R() < 0.5 ? rockC : rockD, R, 0.12);
        ico(g, px, y0 + s * 0.2, pz, s, 0.7 + R() * 0.3, col, R, 0.5);
        if (R() < 0.4) ico(g, px + (R() - 0.5) * s * 2, y0 + s * 0.1, pz + (R() - 0.5) * s * 2, s * 0.6, 0.7, vary(col, R, 0.1), R, 0.5);
      }
      // --- rally edge marker poles (red/white) along both sides ---
      const HYs = (i) => (T.hy ? T.hy[i] : 0);
      for (let s = 0; s < T.len; s += 13) {
        const i = T.idx(s);
        for (const side of [-1, 1]) {
          const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.4);
          const px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o;
          if (excluded(px, pz)) continue;
          const g = scen.get(px, pz), y = HYs(i);
          box(g, px, y, pz, 0.12, 1.05, 0.12, T.hd[i], [0.9, 0.9, 0.9]);
          box(g, px, y + 0.62, pz, 0.13, 0.22, 0.13, T.hd[i], [0.85, 0.15, 0.12]); // red band
        }
      }
      // --- wooden guardrail on the outside of the faster corners ---
      for (const cor of T.corners.filter(c => c.sev >= 2)) {
        const side = -cor.dir;
        const bar = side > 0 ? T.br : T.bl;
        const len = Math.min(90, Math.max(40, cor.angle / Math.max(1e-3, cor.maxk) * 0.9));
        let prev = null;
        for (let s = cor.s0 - 12; s < cor.s0 + len; s += 4.5) {
          const i = T.idx(s), o = side * (bar[i] + 0.7);
          const px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o, y = HYs(i);
          if (excluded(px, pz)) { prev = null; continue; }
          const g = scen.get(px, pz);
          box(g, px, y, pz, 0.16, 1.0, 0.16, T.hd[i], [0.45, 0.32, 0.2]); // post
          if (prev) { // rail plank between posts
            const mx = (px + prev[0]) / 2, mz = (pz + prev[1]) / 2, dx = px - prev[0], dz = pz - prev[1];
            const L = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
            box(scen.get(mx, mz), mx, (y + prev[2]) / 2 + 0.72, mz, L, 0.18, 0.08, ang, [0.55, 0.4, 0.26]);
          }
          prev = [px, pz, y];
        }
      }
      // --- hay bales stacked at the inside of the two tightest corners ---
      const tight = T.corners.slice().sort((a, b) => b.maxk - a.maxk).slice(0, 2);
      for (const cor of tight) {
        const side = cor.dir; // inside
        const bar = side > 0 ? T.br : T.bl;
        for (let s = cor.s0; s < cor.s0 + 16; s += 2.2) {
          const i = T.idx(s), o = side * (bar[i] + 1.2);
          const px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o, y = HYs(i);
          if (excluded(px, pz)) continue;
          const g = scen.get(px, pz), col = vary([0.86, 0.74, 0.36], R, 0.1);
          box(g, px, y, pz, 1.6, 0.9, 0.9, T.hd[i], col, [0.7, 0.6, 0.3]);
          if (R() < 0.5) box(g, px, y + 0.9, pz, 1.6, 0.85, 0.9, T.hd[i], vary(col, R, 0.08), [0.7, 0.6, 0.3]);
          excl.push({ x: px, z: pz, r: 1.6 });
        }
      }
      // --- spectator clusters at a few corners (on the terrain, above the road) ---
      const shirt = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.2, 0.7, 0.3], [1, 0.55, 0.1], [0.15, 0.5, 0.55], [0.7, 0.2, 0.5]];
      CR.busy = true;   // (these clusters ignore the new crowds' tree exclusions, so the random sequence of the later scenery stays as it was)
      for (const cor of T.corners.filter(c => c.sev >= 2).slice(0, 4)) {
        const side = -cor.dir, bar = side > 0 ? T.br : T.bl;
        for (let s = cor.s0 - 6; s < cor.s0 + 28; s += 1.1) {
          const i = T.idx(s);
          for (let row = 0; row < 3; row++) {
            if (R() < 0.45 + row * 0.12) continue;
            const ex = 3.2 + row * 1.2 + (R() - 0.5) * 0.5, o = side * (bar[i] + ex);
            const px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o;
            if (clearance(px, pz) < 1.5 || excluded(px, pz)) continue;
            const sc = shirt[Math.floor(R() * shirt.length)]; R();   // (two draws, as the old merged figure)
            crowdAt(CR, s, side, ex, px, pz, { col: sc }, row, (a, b) => clearance(a, b) >= 1.5 && !excluded(a, b));
          }
        }
      }
      CR.busy = false;
      // --- banner arches over the road (start + one on the ridge) ---
      const arch = (s, col) => {
        const i = T.idx(s), span = Math.max(T.bl[i], T.br[i]) + 1.6, nx = T.nx[i], nz = T.nz[i], h = T.hd[i], y = HYs(i);
        const g = scen.get(T.px[i], T.pz[i]);
        for (const sd of [-1, 1]) { const bx = T.px[i] + nx * span * sd, bz = T.pz[i] + nz * span * sd; box(g, bx, y, bz, 0.7, 6.2, 0.7, h, [0.4, 0.28, 0.18], [0.3, 0.2, 0.12]); }
        box(g, T.px[i], y + 5.9, T.pz[i], 0.5, 0.6, span * 2 + 0.7, h, [0.35, 0.24, 0.15]);       // top beam
        box(g, T.px[i], y + 4.7, T.pz[i], 0.3, 1.2, span * 2 - 0.4, h, col, vary(col, R, 0.1));    // banner
      };
      arch(T.startS + T.len * 0.3, [0.8, 0.16, 0.14]);
      arch(T.startS + T.len * 0.62, [0.15, 0.4, 0.7]);
      // --- timing hut + tents near the start ---
      {
        const i = T.idx(sStart - 22), o = -( (T.bl[i]) + 5), px = T.px[i] + T.nx[i] * o, pz = T.pz[i] + T.nz[i] * o, y = groundH(px, pz), h = T.hd[i];
        const g = scen.get(px, pz);
        box(g, px, y, pz, 5, 2.6, 3.2, h, [0.9, 0.88, 0.82], [0.6, 0.3, 0.2]);
        gable(g, px, y + 2.6, pz, 5.4, 3.6, 1.3, h, [0.55, 0.28, 0.18], [0.9, 0.88, 0.82]);
        for (let t = 0; t < 3; t++) {
          const oo = -((T.bl[i]) + 10 + t * 5), tx = T.px[i] + T.nx[i] * oo + (R() - 0.5) * 3, tz = T.pz[i] + T.nz[i] * oo + (R() - 0.5) * 3, ty = groundH(tx, tz);
          const tc = shirt[t % shirt.length], gg = scen.get(tx, tz);
          box(gg, tx, ty, tz, 3, 1.8, 2.4, h, [0.92, 0.92, 0.9]);
          gable(gg, tx, ty + 1.8, tz, 3.4, 2.8, 0.9, h, tc, tc);
        }
      }
    }

    /* ================= LJUBLJANA (real layout: origin Triple Bridge, x east, z south) ================= */
    if (THEME === 'ljubljana') {
      const RWh = RW / 2, gH = groundH, fac = new GB(true), ban = new GB(true);
      const stoneC = [0.8, 0.77, 0.7], whiteStone = [0.93, 0.92, 0.88], bronze = [0.3, 0.52, 0.44], copper = [0.4, 0.64, 0.54], tile = [0.68, 0.33, 0.21];
      const tri2 = (g, a, b, c, col) => {   // double-sided triangle (wings, flags)
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1, m = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
        g.triO(a, b, c, col, [m[0] - nx / l, m[1] - ny / l, m[2] - nz / l]); g.triO(a, c, b, col, [m[0] + nx / l, m[1] + ny / l, m[2] + nz / l]);
      };
      const facadeBox = (x, z, W, D, H, rot, col) => {   // walls with the window/shutter texture
        const cr = Math.cos(rot), sr = Math.sin(rot), P = (u, v, y) => [x + u * cr - v * sr, y, z + u * sr + v * cr];
        const cs = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]], floors = Math.max(1, Math.round(H / 3.2)), y0 = gH(x, z) - 0.2;
        for (let e = 0; e < 4; e++) { const [u0, v0] = cs[e], [u1, v1] = cs[(e + 1) % 4], bays = Math.max(2, Math.round(Math.hypot(u1 - u0, v1 - v0) / 3.3)); fac.quadO(P(u0, v0, y0), P(u1, v1, y0), P(u1, v1, y0 + H), P(u0, v0, y0 + H), col, [x, y0 + H / 2, z], [[0, 0], [bays, 0], [bays, floors], [0, floors]]); }
        return y0;
      };
      const dragon = (g, x, y, z, rot, sc) => {   // Ljubljana dragon in green bronze: haunches, raised neck, open jaws, spread wings, curled tail
        const cr = Math.cos(rot), sr = Math.sin(rot), P = (u, v, w) => [x + (u * cr - w * sr) * sc, y + v * sc, z + (u * sr + w * cr) * sc];
        const bx = (u, v, w, lu, lv, lw, col) => { const p = P(u, v, w); box(g, p[0], p[1], p[2], lu * sc, lv * sc, lw * sc, rot, col); };
        bx(0, 0, 0, 1.6, 0.9, 0.8, bronze); bx(0.55, 0.8, 0, 0.45, 1.1, 0.45, bronze); bx(0.85, 1.75, 0, 0.85, 0.42, 0.4, bronze);
        bx(1.2, 1.55, 0, 0.4, 0.16, 0.3, [0.2, 0.36, 0.3]); bx(-1.0, 0.1, 0, 0.9, 0.35, 0.35, bronze); bx(-1.35, 0.35, 0.2, 0.35, 0.55, 0.3, bronze);
        for (const sd of [-1, 1]) { bx(0.45, 0, sd * 0.32, 0.35, 0.5, 0.25, [0.24, 0.42, 0.36]); tri2(g, P(-0.1, 0.85, sd * 0.35), P(-0.95, 2.5, sd * 1.25), P(0.5, 1.95, sd * 1.0), bronze); tri2(g, P(-0.1, 0.85, sd * 0.35), P(-0.6, 1.3, sd * 0.95), P(-0.95, 2.5, sd * 1.25), [0.26, 0.46, 0.38]); }
      };
      // ---- landmarks (reserved first so the city fills in around them) ----
      excl.push({ x: -5, z: -26, r: 20 });                                        // Prešernov trg stays an open square
      exclRect.push({ x: -150, z: 88, hx: 54, hz: 46, rot: 0 });                  // Zvezda park, Kongresni trg
      { const x = -20, z = -97, g = scen.get(x, z), pink = [0.87, 0.45, 0.43], y0 = gH(x, z);   // Franciscan Church of the Annunciation
        box(g, x, y0, z, 17, 17, 34, 0, pink, pink); gable(g, x, y0 + 17, z, 34.4, 17.6, 6.5, Math.PI / 2, [0.55, 0.28, 0.22], pink);
        const fz = z + 17.05; for (const px of [-7.6, -3, 3, 7.6]) box(g, x + px, y0, fz, 0.9, 16.2, 0.35, 0, [0.97, 0.94, 0.89]);
        box(g, x, y0 + 16, fz, 17.8, 0.8, 0.55, 0, [0.97, 0.94, 0.89]); box(g, x, y0, fz, 3.4, 5.4, 0.45, 0, [0.34, 0.22, 0.18]);
        box(g, x + 11.5, y0, z - 8, 5.5, 31, 5.5, 0, pink, pink); cone(g, x + 11.5, y0 + 31, z - 8, 3.7, 7.5, 8, copper, [0.5, 0.72, 0.62], 0.4);
        excl.push({ x, z, r: 22 }); }
      { const x = -13, z = -34, g = scen.get(x, z), r = 0.3;                      // Prešeren Monument
        box(g, x, 0, z, 6, 0.35, 6, r, [0.78, 0.76, 0.72]); box(g, x, 0.35, z, 4, 0.35, 4, r, [0.82, 0.8, 0.76]); box(g, x, 0.7, z, 1.7, 3.4, 1.4, r, [0.88, 0.86, 0.82]);
        box(g, x, 4.1, z, 0.75, 1.75, 0.55, r, [0.25, 0.34, 0.3]); ico(g, x, 6.1, z, 0.28, 1, [0.25, 0.34, 0.3], R, 0); box(g, x - 0.25, 5.1, z - 0.5, 0.55, 1.9, 0.45, r, [0.28, 0.38, 0.33]);
        excl.push({ x, z, r: 7 }); }
      { const x = 36, z = 125, g = scen.get(x, z), c = [0.94, 0.9, 0.8];          // Town Hall on Mestni trg, clock tower
        const y0 = facadeBox(x, z, 16, 24, 17, 0, c); box(g, x, y0 + 17, z, 16.4, 0.5, 24.4, 0, c.map(v => v * 0.85)); gable(g, x, y0 + 17.5, z, 24.4, 16.4, 5, Math.PI / 2, tile, c);
        box(g, x - 8.3, y0, z, 0.6, 4.2, 20, 0, [0.6, 0.58, 0.54]); box(g, x - 4, y0 + 22, z, 4, 8, 4, 0, c, c); cone(g, x - 4, y0 + 30, z, 3, 3.5, 4, copper, [0.5, 0.72, 0.62], Math.PI / 4);
        box(g, x - 6.05, y0 + 25, z, 0.12, 1.6, 1.6, 0, [0.98, 0.97, 0.9]); excl.push({ x, z, r: 15 }); }
      { const x = 28, z = 101, g = scen.get(x, z);                                // Robba Fountain (the three Carniolan rivers)
        cyl(g, x, 0, z, 2.6, 0.7, 12, [0.9, 0.88, 0.84]); cyl(g, x, 0.7, z, 2.2, 0.05, 12, [0.4, 0.62, 0.72]); box(g, x, 0.7, z, 1.2, 1.6, 1.2, 0.5, [0.92, 0.9, 0.86]);
        cone(g, x, 2.3, z, 0.7, 8.5, 4, [0.94, 0.92, 0.88], [0.97, 0.96, 0.92], 0.5); excl.push({ x, z, r: 4 }); }
      { const x = 168, z = 48, g = scen.get(x, z), c = [0.93, 0.89, 0.78];        // St Nicholas's Cathedral: twin towers + dome
        const y0 = facadeBox(x, z, 40, 18, 19, 0, c); gable(g, x, y0 + 19.2, z, 40.5, 18.5, 6, 0, [0.6, 0.3, 0.2], c);
        for (const sd of [-1, 1]) { box(g, x - 22, y0, z + sd * 6.5, 6, 30, 6, 0, c, c); ico(g, x - 22, y0 + 32.5, z + sd * 6.5, 3.4, 1.25, copper, R, 0); cone(g, x - 22, y0 + 34.6, z + sd * 6.5, 0.6, 3, 6, copper, [0.6, 0.8, 0.7], 0); }
        cyl(g, x + 4, y0 + 19, z, 6, 5, 10, c); ico(g, x + 4, y0 + 24.5, z, 6.4, 0.85, copper, R, 0); cone(g, x + 4, y0 + 29.6, z, 1, 4, 6, copper, [0.6, 0.8, 0.7], 0);
        excl.push({ x, z, r: 28 }); }
      { const x = -150, z = 192, g = scen.get(x, z), c = [0.94, 0.85, 0.6];      // University of Ljubljana (green copper roof, corner turrets)
        const y0 = facadeBox(x, z, 58, 38, 19, 0, c); box(g, x, y0 + 19, z, 58.6, 0.6, 38.6, 0, c.map(v => v * 0.85)); gable(g, x, y0 + 19.6, z, 58.6, 38.6, 7, 0, copper, c);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cyl(g, x + sx * 28, y0 + 19.6, z + sz * 18, 3, 4, 8, c); cone(g, x + sx * 28, y0 + 23.6, z + sz * 18, 3.4, 5, 8, copper, [0.55, 0.78, 0.68], 0); }
        excl.push({ x, z, r: 36 }); }
      { const x = -255, z = 184, g = scen.get(x, z), c = [0.95, 0.91, 0.8];      // Slovenian Philharmonic
        const y0 = facadeBox(x, z, 32, 22, 16, 0, c); gable(g, x, y0 + 16, z, 32.6, 22.6, 5, 0, [0.4, 0.4, 0.44], c);
        for (let k = -3; k <= 3; k++) cyl(g, x + k * 3.6, y0, z - 11.3, 0.45, 12, 8, [0.97, 0.95, 0.9]); excl.push({ x, z, r: 20 }); }
      { const x = -228, z = -177, g = scen.get(x, z), c = [0.9, 0.88, 0.82];     // Nebotičnik (1933 skyscraper)
        const y0 = facadeBox(x, z, 17, 17, 62, 0.1, c); box(g, x, y0 + 62, z, 17.4, 0.6, 17.4, 0.1, c.map(v => v * 0.85)); box(g, x, y0 + 62.6, z, 11, 5, 11, 0.1, c, [0.3, 0.3, 0.32]);
        cyl(g, x, y0 + 67.6, z, 3.5, 3, 12, [0.92, 0.9, 0.84], [0.35, 0.36, 0.4]); excl.push({ x, z, r: 14 }); }
      if (CASTLE) { const [x, z] = CASTLE, y0 = gH(x, z) - 0.6, g = scen.get(x, z), c = [0.84, 0.8, 0.72], rot = 0.35, cr = Math.cos(rot), sr = Math.sin(rot);
        const P = (u, v) => [x + u * cr - v * sr, z + u * sr + v * cr], W = 70, D = 46;             // Ljubljana Castle on its hill
        for (const [u, v, isX] of [[0, -D / 2, 1], [0, D / 2, 1], [-W / 2, 0, 0], [W / 2, 0, 0]]) { const p = P(u, v); box(g, p[0], y0, p[1], isX ? W : 2.2, 10, isX ? 2.2 : D, rot, c, [0.7, 0.67, 0.6]); }
        for (const [u, v, bw, bd, bh] of [[-15, -12, 34, 14, 14], [18, 9, 24, 16, 12], [-20, 12, 18, 12, 11]]) { const p = P(u, v); box(g, p[0], y0, p[1], bw, bh, bd, rot, c, c); gable(g, p[0], y0 + bh, p[1], bw + 0.6, bd + 0.6, 4.5, rot, tile, c); }
        for (const [u, v] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) { const p = P(u, v); cyl(g, p[0], y0, p[1], 4, 13, 10, c); cone(g, p[0], y0 + 13, p[1], 4.6, 5, 10, tile, [0.8, 0.45, 0.3], 0); }
        const p = P(22, -10); box(g, p[0], y0, p[1], 7, 30, 7, rot, c, c); box(g, p[0], y0 + 30, p[1], 8.2, 1.2, 8.2, rot, [0.7, 0.67, 0.6]); cyl(g, p[0], y0 + 31, p[1], 0.12, 9, 5, [0.3, 0.3, 0.32]);
        for (const [col, dy] of [[[0.98, 0.98, 0.98], 0], [[0.12, 0.3, 0.72], -1], [[0.85, 0.12, 0.15], -2]]) { const Y = y0 + 39.2 + dy; tri2(g, [p[0], Y, p[1]], [p[0] + 4.2, Y, p[1]], [p[0] + 4.2, Y + 1, p[1]], col); tri2(g, [p[0], Y, p[1]], [p[0] + 4.2, Y + 1, p[1]], [p[0], Y + 1, p[1]], col); }
        excl.push({ x, z, r: 48 }); }
      // ---- the Ljubljanica: emerald water, stone embankments with parapets, willows, café terraces ----
      let rs = [], nrm = null;
      if (RIVER) {
        for (let k = 0; k < RIVER.length - 1; k++) { const [x0, z0] = RIVER[k], [x1, z1] = RIVER[k + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 4)); for (let q = 0; q < n; q++) rs.push([x0 + (x1 - x0) * q / n, z0 + (z1 - z0) * q / n]); }
        rs.push(RIVER[RIVER.length - 1]);
        nrm = (k) => { const a = rs[Math.max(0, k - 1)], b = rs[Math.min(rs.length - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
        const wg = new GB(true), W = RWh - 0.4, wc = [1, 1, 1], uv = (q) => [q[0] / 16, -q[2] / 16];
        for (let k = 0; k < rs.length - 1; k++) {
          const [x0, z0] = rs[k], [x1, z1] = rs[k + 1], n0 = nrm(k), n1 = nrm(k + 1);
          const a = [x0 + n0[0] * W, -1.25, z0 + n0[1] * W], b = [x1 + n1[0] * W, -1.25, z1 + n1[1] * W], c = [x1 - n1[0] * W, -1.25, z1 - n1[1] * W], d = [x0 - n0[0] * W, -1.25, z0 - n0[1] * W];
          wg.quadUp(a, b, c, d, [wc, wc, wc, wc], [uv(a), uv(b), uv(c), uv(d)]);
          for (const sd of [-1, 1]) {
            const p0 = [x0 + n0[0] * RWh * sd, z0 + n0[1] * RWh * sd], p1 = [x1 + n1[0] * RWh * sd, z1 + n1[1] * RWh * sd], mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
            if (clearance(mx, mz) < 1.2) continue;                                   // under a track bridge the deck covers it
            const g = scen.get(mx, mz), st = ((k >> 1) % 2) ? stoneC : [0.76, 0.73, 0.66];
            g.quadO([p0[0], -3.2, p0[1]], [p1[0], -3.2, p1[1]], [p1[0], 0.12, p1[1]], [p0[0], 0.12, p0[1]], st, [mx + n0[0] * sd * 3, -1, mz + n0[1] * sd * 3]);
            if (clearance(mx + n0[0] * sd * 0.8, mz + n0[1] * sd * 0.8) > 1.5) box(g, mx + n0[0] * sd * 0.35, 0, mz + n0[1] * sd * 0.35, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.05, 0.95, 0.45, Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), [0.88, 0.86, 0.8], [0.93, 0.92, 0.88]);
          }
        }
        const water = new THREE.Mesh(wg.geometry(), new THREE.MeshPhongMaterial({ map: tex.water, color: 0x43a07f, shininess: 80, specular: 0x557766, vertexColors: true }));
        water.receiveShadow = true; root.add(water); out.dyn.water = tex.water;
        // Plečnik's colonnade along the Central Market bank (south bank between the Triple and Dragon bridges)
        for (let k = 0; k < rs.length - 1; k++) {
          const [x0, z0] = rs[k]; if (x0 < 28 || x0 > 232) continue;
          const n0 = nrm(k), sd = n0[1] > 0 ? 1 : -1, ox = n0[0] * sd, oz = n0[1] * sd, bx0 = x0 + ox * (RWh + 1.8), bz0 = z0 + oz * (RWh + 1.8);
          if (clearance(bx0 + ox * 6.5, bz0 + oz * 6.5) < 1) continue;
          const [x1, z1] = rs[k + 1], ang = Math.atan2(z1 - z0, x1 - x0), Lk = Math.hypot(x1 - x0, z1 - z0), g = scen.get(bx0, bz0), c = [0.9, 0.87, 0.8];
          cyl(g, bx0, 0, bz0, 0.32, 5, 8, [0.94, 0.92, 0.87]); box(g, bx0 + ox * 3, 5, bz0 + oz * 3, Lk + 0.05, 1.3, 7.2, ang, c, [0.64, 0.33, 0.22]); box(g, bx0 + ox * 6.3, 0, bz0 + oz * 6.3, Lk + 0.05, 5, 0.6, ang, c);
          excl.push({ x: bx0 + ox * 3, z: bz0 + oz * 3, r: 4 });
        }
        // willows and plane trees on the embankments; café terraces on Cankarjevo nabrežje (west bank)
        for (let k = 2; k < rs.length - 2; k += 3) {
          const [x0, z0] = rs[k], n0 = nrm(k);
          for (const sd of [-1, 1]) {
            const px = x0 + n0[0] * sd * (RWh + 3.2), pz = z0 + n0[1] * sd * (RWh + 3.2);
            if (clearance(px, pz) < 2.5 || excluded(px, pz) || gH(px, pz) > 1) continue;
            const g = scen.get(px, pz);
            if (R() < 0.5) { cyl(g, px, 0, pz, 0.35, 3.2, 6, [0.42, 0.34, 0.24]); const lc = vary([0.52, 0.7, 0.3], R, 0.12);
              ico(g, px - n0[0] * sd * 1.2, 5.2, pz - n0[1] * sd * 1.2, 4.2, 1.15, lc, R, 0.3); ico(g, px - n0[0] * sd * 2.6, 3.4, pz - n0[1] * sd * 2.6, 2.8, 1.4, vary(lc, R, 0.1), R, 0.3); }
            else if (R() < 0.6) { cyl(g, px, 0, pz, 0.3, 4, 6, [0.5, 0.45, 0.36]); ico(g, px, 7, pz, 3.6 + R() * 1.2, 0.9, vary([0.3, 0.5, 0.22], R, 0.12), R, 0.3); }
            excl.push({ x: px, z: pz, r: 3 });
          }
        }
        for (let k = 0; k < rs.length; k++) {
          const [x0, z0] = rs[k]; if (z0 < 40 || z0 > 280 || x0 > 10) continue;
          const n0 = nrm(k), sd = n0[0] > 0 ? -1 : 1;
          for (const off of [5.5, 9.5]) {
            const px = x0 + n0[0] * sd * (RWh + off), pz = z0 + n0[1] * sd * (RWh + off);
            if (clearance(px, pz) < 2.5 || excluded(px, pz) || R() < 0.25) continue;
            const g = scen.get(px, pz); cyl(g, px, 0, pz, 0.05, 2.3, 4, [0.3, 0.3, 0.32]); cone(g, px, 2.05, pz, 1.55, 0.55, 8, [0.97, 0.96, 0.93], [1, 1, 0.98], 0); cyl(g, px + 0.9, 0, pz, 0.4, 0.75, 6, [0.25, 0.24, 0.22]);
          }
        }
        // ---- bridges ----
        { const along = [14 / 42.4, 40 / 42.4], across = [-along[1], along[0]];              // Triple Bridge: centre bridge + two footbridges splaying towards Prešernov trg
          for (const [o0, o1, wd] of [[0, 0, 10], [-9, -15, 5], [9, 15, 5]]) {
            const pA = [-along[0] * 20 + across[0] * o1, -along[1] * 20 + across[1] * o1], pB = [along[0] * 20 + across[0] * o0, along[1] * 20 + across[1] * o0];
            const mx = (pA[0] + pB[0]) / 2, mz = (pA[1] + pB[1]) / 2, a2 = Math.atan2(pB[1] - pA[1], pB[0] - pA[0]), Ld = Math.hypot(pB[0] - pA[0], pB[1] - pA[1]), g = scen.get(mx, mz);
            box(g, mx, -0.6, mz, Ld, 0.66, wd, a2, [0.9, 0.89, 0.85], [0.8, 0.79, 0.76]); box(g, mx, -3.2, mz, Ld * 0.3, 2.6, wd * 0.9, a2, [0.86, 0.85, 0.8]); decks.push([mx, mz, Ld / 2, wd / 2, a2, 0.06]);
            for (const sd of [-1, 1]) {
              const ex = -Math.sin(a2) * sd * (wd / 2 - 0.2), ez = Math.cos(a2) * sd * (wd / 2 - 0.2);
              box(g, mx + ex, 0, mz + ez, Ld, 0.15, 0.3, a2, whiteStone); box(g, mx + ex, 0.85, mz + ez, Ld, 0.14, 0.34, a2, whiteStone);
              for (let t = -Ld / 2 + 0.6; t < Ld / 2; t += 0.75) box(g, mx + ex + Math.cos(a2) * t, 0.15, mz + ez + Math.sin(a2) * t, 0.16, 0.7, 0.16, a2, [0.96, 0.95, 0.9]);
              for (let t = -Ld / 2 + 4; t < Ld / 2; t += 9) { const lx = mx + ex + Math.cos(a2) * t, lz = mz + ez + Math.sin(a2) * t; cyl(g, lx, 0.99, lz, 0.1, 2.8, 6, [0.2, 0.2, 0.22]); ico(g, lx, 4.05, lz, 0.34, 1, [0.99, 0.98, 0.92], R, 0); }
            }
            excl.push({ x: mx, z: mz, r: 18 });
          } }
        { const cx = 185, cz = -52, a2 = Math.atan2(0.958, 0.287), Ld = 36, g = scen.get(cx, cz);       // Butchers' Bridge (modern footbridge, glass sides)
          box(g, cx, -0.5, cz, Ld, 0.5, 7, a2, [0.3, 0.31, 0.33], [0.72, 0.7, 0.66]); decks.push([cx, cz, Ld / 2, 3.5, a2, 0]);
          for (const sd of [-1, 1]) box(g, cx - Math.sin(a2) * sd * 3.3, 0, cz + Math.cos(a2) * sd * 3.3, Ld, 1.1, 0.12, a2, [0.62, 0.78, 0.82]);
          excl.push({ x: cx, z: cz, r: 16 }); }
        // where the circuit itself crosses the river: deck + stone faces; dragons on the Dragon Bridge, columns on the Cobblers' Bridge
        const spans = []; let cur = null;
        for (let i = 0; i < N; i++) { const onW = distRiver(T.px[i], T.pz[i]) < RWh + 2.5; if (onW) { if (!cur) { cur = { a: i, b: i }; spans.push(cur); } else cur.b = i; } else cur = null; }
        for (const br of spans) {
          const mid = (br.a + br.b) >> 1, isDragon = Math.hypot(T.px[mid] - 324, T.pz[mid] + 97) < 60;
          for (let i = br.a - 1; i <= br.b + 1; i++) {
            const k = (i + N) % N, g = scen.get(T.px[k], T.pz[k]), w0 = Math.max(T.bl[k], T.br[k]) + 1.2;
            const P = (j, o) => [T.px[j] + T.nx[j] * o, T.pz[j] + T.nz[j] * o], len = (o) => { const e = P(k, o), a = P((k + N - 1) % N, o), b = P((k + 1) % N, o);   // (one slab per sample, long enough to meet
              return Math.max(T.ds, Math.hypot(e[0] - a[0], e[1] - a[1]), Math.hypot(e[0] - b[0], e[1] - b[1])) + 0.15; };                           //  its neighbours on the outside of the bend too)
            const Ld = Math.max(len(-w0), len(w0)); box(g, T.px[k], -1.35, T.pz[k], Ld, 1.33, w0 * 2, T.hd[k], [0.72, 0.7, 0.66]); slabs.push([T.px[k], T.pz[k], Ld / 2, w0, T.hd[k], -0.02]);
            for (const sd of [-1, 1]) { const o = sd * ((sd > 0 ? T.br[k] : T.bl[k]) + 0.9); box(g, T.px[k] + T.nx[k] * o, -3.2, T.pz[k] + T.nz[k] * o, len(o), 4.3, 0.8, T.hd[k], isDragon ? [0.86, 0.85, 0.82] : whiteStone); }
          }
          const ends = [br.a - 2, br.b + 2];
          for (const e of ends) for (const sd of [-1, 1]) {
            const k = (e + N) % N, o = sd * ((sd > 0 ? T.br[k] : T.bl[k]) + 2.6), x = T.px[k] + T.nx[k] * o, z = T.pz[k] + T.nz[k] * o, g = scen.get(x, z);
            if (isDragon) { box(g, x, 0, z, 2.6, 3.4, 2.6, T.hd[k], [0.82, 0.8, 0.74], [0.88, 0.86, 0.8]); dragon(g, x, 3.4, z, T.hd[k] + (e === ends[0] ? Math.PI : 0) + sd * 0.4, 1.3); }
            else { cyl(g, x, 0, z, 0.38, 3.8, 8, whiteStone); ico(g, x, 4.15, z, 0.48, 1, whiteStone, R, 0); }
            excl.push({ x, z, r: 3 });
          }
          for (let i = br.a; i <= br.b; i += isDragon ? 3 : 2) for (const sd of [-1, 1]) {
            const k = (i + N) % N, o = sd * ((sd > 0 ? T.br[k] : T.bl[k]) + 0.9), x = T.px[k] + T.nx[k] * o, z = T.pz[k] + T.nz[k] * o, g = scen.get(x, z);
            if (isDragon) { cyl(g, x, 1.1, z, 0.1, 4.2, 6, [0.22, 0.4, 0.34]); ico(g, x, 5.5, z, 0.32, 1, [0.97, 0.95, 0.86], R, 0); }
            else { cyl(g, x, 1.1, z, 0.22, 2.6, 8, whiteStone); ico(g, x, 3.95, z, 0.3, 1, whiteStone, R, 0); }
          }
        }
      }
      // ---- Zvezda park on Kongresni trg: star-shaped lawns, big trees, fountain ----
      { const cx = -150, cz = 88, hx = 52, hz = 44, pg = scen.get(cx, cz), gr = [0.42, 0.6, 0.28];
        const C = [[cx - hx, cz - hz], [cx + hx, cz - hz], [cx + hx, cz + hz], [cx - hx, cz + hz]];
        for (let e = 0; e < 4; e++) { const a = C[e], b = C[(e + 1) % 4], L2 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, 0.05, p[1] + (q[1] - p[1]) * t], ctr = [cx, cz], mab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          pg.triO(L2(a, ctr, 0.09), L2(b, ctr, 0.09), L2(ctr, mab, 0.2), gr, [cx, -5, cz]); }
        cyl(pg, cx, 0, cz, 4.5, 0.6, 14, [0.86, 0.84, 0.8]); cyl(pg, cx, 0.6, cz, 3.9, 0.05, 14, [0.4, 0.62, 0.72]);
        for (let k = 0; k < 80; k++) {
          const u = (R() * 2 - 1) * 0.95, v = (R() * 2 - 1) * 0.95; if (Math.abs(Math.abs(u) - Math.abs(v)) < 0.14 || Math.hypot(u, v) < 0.22) continue;
          const px = cx + u * hx, pz = cz + v * hz, g = scen.get(px, pz); cyl(g, px, 0, pz, 0.35, 4.5, 6, [0.46, 0.4, 0.3]); ico(g, px, 7.6, pz, 3.8 + R() * 1.4, 0.9, vary([0.28, 0.48, 0.2], R, 0.12), R, 0.3);
        } }
      // ---- the city: continuous frontage along the circuit, then the blocks behind ----
      const pal = [[0.95, 0.85, 0.58], [0.96, 0.91, 0.8], [0.8, 0.87, 0.74], [0.94, 0.72, 0.62], [0.87, 0.87, 0.85], [0.97, 0.96, 0.92], [0.8, 0.86, 0.92], [0.93, 0.8, 0.66]];
      const placed = [];
      const tryBuilding = (x, z, W, D, rot, H) => {
        const rad = Math.hypot(W, D) / 2;
        if (excluded(x, z) || (RIVER && distRiver(x, z) < RWh + 3 + rad * 0.6) || gH(x, z) > 1.5) return false;
        if (clearance(x, z) < rad * 0.55 + 2.5 || placed.some(q => Math.hypot(q[0] - x, q[1] - z) < (q[2] + rad) * 0.78)) return false;
        const col = pal[Math.floor(R() * pal.length)], y0 = facadeBox(x, z, W, D, H, rot, col), g = scen.get(x, z), rk = R();
        gable(g, x, y0 + H, z, W + 0.6, D + 0.6, Math.min(W, D) * 0.32, rot, rk < 0.78 ? vary(tile, R, 0.08) : rk < 0.93 ? [0.36, 0.37, 0.41] : copper, col);
        box(g, x, y0 + H - 0.35, z, W + 0.3, 0.35, D + 0.3, rot, col.map(v => v * 0.82));
        placed.push([x, z, rad]); excl.push({ x, z, r: rad * 0.8 }); CR.block(x, z, W, D, rot); return true;
      };
      for (const side of [-1, 1]) for (let s0 = 0; s0 < T.len;) {
        const W = 11 + R() * 9, D = 13 + R() * 7, H = 3.2 * (3 + Math.floor(R() * 3)) + 1, i = T.idx(s0), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 3.5 + D / 2);
        tryBuilding(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, W, D, T.hd[i], H); s0 += W + 1;
      }
      for (let k = 0; k < 7000 && placed.length < 430; k++) {
        const x = lerp(B.minX, B.maxX, R()), z = lerp(B.minZ, B.maxZ, R()), W = 12 + R() * 12, D = 12 + R() * 10, ni = nearest(x, z).i;
        tryBuilding(x, z, W, D, ni >= 0 ? T.hd[ni] : (R() < 0.5 ? 0.12 : 0.12 + Math.PI / 2), 3.2 * (3 + Math.floor(R() * 3)) + 1);
      }
      // ---- castle hill forest ----
      for (let x = 30; x < 370; x += 6) for (let z = 85; z < 415; z += 6) {
        const px = x + (R() - 0.5) * 5, pz = z + (R() - 0.5) * 5, h0 = gH(px, pz);
        if (h0 < 3 || R() < 0.22 || (CASTLE && Math.hypot(px - CASTLE[0], pz - CASTLE[1]) < 46) || excluded(px, pz)) continue;
        const g = scen.get(px, pz), hgt = 8 + R() * 6;
        cyl(g, px, h0 - 0.3, pz, 0.32, hgt * 0.45, 5, [0.42, 0.34, 0.24]);
        if (R() < 0.18) cone(g, px, h0 + hgt * 0.3, pz, hgt * 0.24, hgt * 0.75, 7, vary([0.18, 0.34, 0.2], R, 0.1), [0.24, 0.42, 0.26], R() * TAU);
        else ico(g, px, h0 + hgt * 0.72, pz, hgt * 0.34, 0.9, vary([0.3, 0.5, 0.22], R, 0.14), R, 0.32);
      }
      // ---- street dressing: lamp posts with red/black dragon banners (billboards face the camera) ----
      { let n = 0, side = 1;
        for (let s0 = 6; s0 < T.len; s0 += 26) {
          const i = T.idx(s0), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 1.3), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; side = -side;
          if (excluded(x, z) || (RIVER && distRiver(x, z) < RWh + 1)) continue;
          const g = scen.get(x, z); cyl(g, x, 0, z, 0.09, 7.2, 6, [0.16, 0.17, 0.18]); box(g, x, 7.2, z, 0.32, 0.32, 0.32, 0, [0.92, 0.9, 0.82]); CR.avoid(x, z, 0.7);
          const u0 = (n++ % 2) * 0.5, u1 = u0 + 0.5, a = [x - 0.55, 2.6, z + 0.2], b = [x + 0.55, 2.6, z + 0.2], c = [x + 0.55, 6.4, z + 0.2], d = [x - 0.55, 6.4, z + 0.2];
          ban.quadO(a, b, c, d, [1, 1, 1], [x, 4.5, z - 3], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]); ban.quadO(b, a, d, c, [0.8, 0.8, 0.8], [x, 4.5, z + 3], [[u1, 0], [u0, 0], [u0, 1], [u1, 1]]);
        } }
      // spectators on the pavements (two rows between the catch fence and the house fronts): the open squares and the corners, a few everywhere else
      { const M = { rows: 2, gap: 1.0, clump: 0.6 };
        for (const [a, b2, sd, dn] of [[210, 444, 1, 0.72], [630, 822, 1, 0.72], [1100, 1146, -1, 0.8], [1200, 1246, 1, 0.8], [1676, 1738, 1, 0.8], [1712, 1750, -1, 0.8], [1826, 1868, -1, 0.8],
          [100, 138, 1, 0.7], [244, 290, 1, 0.7], [520, 566, 1, 0.7], [506, 580, -1, 0.6], [780, 840, -1, 0.6], [950, 1010, 1, 0.6], [950, 1010, -1, 0.6], [1076, 1130, 1, 0.65], [1170, 1230, -1, 0.65], [1416, 1500, -1, 0.7], [1416, 1500, 1, 0.55]])
          crRun(a, b2, sd, Object.assign({ dens: dn, label: 'LJ ' + a + (sd > 0 ? 'R' : 'L') }, M));
        for (const sd of [-1, 1]) crRun(0, T.len, sd, Object.assign({ dens: 0.2, label: 'LJ pavement ' + (sd > 0 ? 'R' : 'L') }, M));
        const sq = excl.find(e => e.x === -5 && e.z === -26), exSq = (x, z) => excl.some(e => e !== sq && (x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) || exclRect.some(r => inRect(x, z, r)) || exclF.some(f => f(x, z));
        crRun(1686, 1732, 1, { rows: 7, gap: 1.0, first: 2.1, dens: 0.72, clump: 0.5, excluded: exSq, label: 'LJ Presernov trg' }); }   // the crowd spills onto the open square (kept free of houses)
      { const fm = new THREE.Mesh(fac.geometry(), new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true })); fm.castShadow = true; fm.receiveShadow = true; root.add(fm); }
      { const bm = new THREE.Mesh(ban.geometry(), new THREE.MeshLambertMaterial({ map: tex.bannerLJ, vertexColors: true })); bm.castShadow = true; root.add(bm); }
    }

    /* ================= FOREST (circuit from a stylised top-down racer: V with a tongue, rocks, firs, tyre walls) ================= */
    if (THEME === 'forest') {
      const fd = T.def;
      // ---- the raised lawn in the bottom of the V (as in the reference): a flat grass terrace behind a curved concrete retaining wall
      //      with a rope fence along its edge; objects placed on it stand on its top ----
      const PL = fd.plateau ? (() => { const pts = [], S0 = T.startS, P0 = fd.plateau;
        for (let q = P0.s0; q <= P0.s1 + 0.1; q += 5) { const [x, z] = atSf(S0 + q, -(T.bl[T.idx(S0 + q)] + P0.off)); pts.push([x, z]); }
        return { pts, h: P0.h }; })() : null;
      const platH = (x, z) => PL && inPoly(PL.pts, x, z) ? PL.h : 0;
      const gH = (x, z) => groundH(x, z) + platH(x, z);
      if (PL) { const gt = new GB(true), gw = new GB(), n = PL.pts.length, h = PL.h, cx = PL.pts.reduce((a, p) => a + p[0], 0) / n, cz = PL.pts.reduce((a, p) => a + p[1], 0) / n;
        const tris = THREE.ShapeUtils.triangulateShape(PL.pts.map(p => new THREE.Vector2(p[0], p[1])), []), gc = [0.8 * 0.95, 0.84 * 0.95, 1.46 * 0.95];
        for (const [a, b, c] of tris) { const A = PL.pts[a], Bq = PL.pts[b], C = PL.pts[c]; gt.triO([A[0], h, A[1]], [Bq[0], h, Bq[1]], [C[0], h, C[1]], gc, [cx, h - 5, cz], gc, gc, [A[0] / 14, -A[1] / 14], [Bq[0] / 14, -Bq[1] / 14], [C[0] / 14, -C[1] / 14]); }
        const wallC = [0.5, 0.52, 0.56], wallT = [0.72, 0.73, 0.75], wallB = [0.36, 0.38, 0.43];
        for (let k = 0; k < n; k++) { const A = PL.pts[k], Bq = PL.pts[(k + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz) || 1, ox = -dz / L, oz = dx / L;
          const mx = (A[0] + Bq[0]) / 2, mz = (A[1] + Bq[1]) / 2, s1 = inPoly(PL.pts, mx + ox * 0.5, mz + oz * 0.5) ? 1 : -1, ix = ox * s1, iz = oz * s1;   // (ix, iz) points into the terrace
          gw.quadO([A[0], -0.3, A[1]], [Bq[0], -0.3, Bq[1]], [Bq[0], h, Bq[1]], [A[0], h, A[1]], wallC, [mx + ix * 3, h * 0.5, mz + iz * 3], null, [wallB, wallB, wallC, wallC]);   // the retaining wall
          gw.quadUp([A[0], h + 0.03, A[1]], [Bq[0], h + 0.03, Bq[1]], [Bq[0] + ix * 0.45, h + 0.03, Bq[1] + iz * 0.45], [A[0] + ix * 0.45, h + 0.03, A[1] + iz * 0.45], [wallT, wallT, wallT, wallT]); }   // pale coping on top
        const mt = new THREE.Mesh(gt.geometry(), new THREE.MeshLambertMaterial({ map: tex.grass, vertexColors: true })); mt.receiveShadow = true; mt.matrixAutoUpdate = false; root.add(mt);
        const mw = new THREE.Mesh(gw.geometry(), matV); mw.receiveShadow = true; mw.castShadow = true; mw.matrixAutoUpdate = false; root.add(mw);
        { let prev = null, acc = 0; const wc = [0.46, 0.3, 0.19], rc = [0.66, 0.54, 0.38];   // rope fence along the top edge on the road side (every edge but the closing one)
          for (let k = 0; k < n - 1; k++) { const A = PL.pts[k], Bq = PL.pts[k + 1], L = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]), ox = -(Bq[1] - A[1]) / L, oz = (Bq[0] - A[0]) / L, s1 = inPoly(PL.pts, (A[0] + Bq[0]) / 2 + ox * 0.5, (A[1] + Bq[1]) / 2 + oz * 0.5) ? 1 : -1;
            for (let t = acc; t < L; t += 3.2) { const f = t / L, x = A[0] + (Bq[0] - A[0]) * f + ox * s1 * 1.1, z = A[1] + (Bq[1] - A[1]) * f + oz * s1 * 1.1, g = scen.get(x, z);
              box(g, x, h, z, 0.18, 1.05, 0.18, 0, wc, [0.52, 0.35, 0.22]);
              if (prev) { const Y = (tt) => h + 0.92 - 0.26 * 4 * tt * (1 - tt), p3 = [0, 1 / 3, 2 / 3, 1].map(tt => [prev[0] + (x - prev[0]) * tt, Y(tt), prev[1] + (z - prev[1]) * tt]);
                for (let q = 0; q < 3; q++) { const a1 = p3[q], b1 = p3[q + 1]; g.quadO(a1, b1, [b1[0], b1[1] + 0.07, b1[2]], [a1[0], a1[1] + 0.07, a1[2]], rc, [x + ox * s1, h, z + oz * s1]); g.quadO(b1, a1, [a1[0], a1[1] + 0.07, a1[2]], [b1[0], b1[1] + 0.07, b1[2]], rc, [x - ox * s1, h, z - oz * s1]); } }
              prev = [x, z]; acc = t + 3.2 - L; } } }
        exclF.push((x, z) => inPoly(PL.pts, x, z) && polyDist(PL.pts, x, z) < 3.2);   // keep the edge of the terrace clear
      }
      const pineCs = [[0.17, 0.43, 0.42], [0.15, 0.4, 0.4], [0.2, 0.47, 0.44], [0.22, 0.5, 0.43], [0.16, 0.42, 0.44]];   // teal-green firs: dark teal in shade, fresh green where the low sun catches them (measured from the reference)
      // firs as in the reference: tall and slim, four drooping jagged tiers, sunlit tips green, shaded sides teal (soft shading).
      // Far from the circuit (more than 80 m beyond the barriers, small and hazy on screen) a cheaper two-tier fir with the same silhouette.
      let firCount = 0, firFar = 0; const fir = (x, z, hgt, yb) => { firCount++;
        const far = clearance(x, z) > 80, g = scen.get(x, z), y0 = yb != null ? yb : gH(x, z), col = vary(pineCs[Math.floor(R() * pineCs.length)], R, 0.08), rr = hgt * (0.17 + R() * 0.03), rot = R() * TAU, lit = (k) => [col[0] * k * 1.2, col[1] * k * 1.1, col[2] * k * 0.82];
        if (far) { firFar++; R(); R(); R();   // (same number of random draws as a near fir)
          starCone(g, x, y0 + hgt * 0.1, z, rr * 1.05, hgt * 0.4, 5, col, lit(1.32), rot, hgt * 0.05);
          starCone(g, x, y0 + hgt * 0.4, z, rr * 0.7, hgt * 0.34, 4, col, lit(1.42), rot + 0.6, hgt * 0.04);
          cone(g, x, y0 + hgt * 0.62, z, rr * 0.36, hgt * 0.38, 4, col, lit(1.5), rot + 1.2); return; }
        box(g, x, y0 - 0.2, z, 0.36, hgt * 0.2, 0.36, rot, [0.33, 0.22, 0.16], null, true);
        const c2 = vary(col, R, 0.05), c3 = vary(col, R, 0.05), c4 = vary(col, R, 0.05);
        starCone(g, x, y0 + hgt * 0.1, z, rr, hgt * 0.26, 6, col, lit(1.28), rot, hgt * 0.045);
        starCone(g, x, y0 + hgt * 0.26, z, rr * 0.84, hgt * 0.25, 6, c2, lit(1.34), rot + 0.5, hgt * 0.04);
        starCone(g, x, y0 + hgt * 0.42, z, rr * 0.66, hgt * 0.24, 5, c3, lit(1.4), rot + 1.0, hgt * 0.035);
        starCone(g, x, y0 + hgt * 0.57, z, rr * 0.48, hgt * 0.22, 4, c4, lit(1.46), rot + 1.5, hgt * 0.03);
        cone(g, x, y0 + hgt * 0.7, z, rr * 0.3, hgt * 0.32, 5, c4, lit(1.52), rot + 2.0); };
      const boulder = (x, z, r, sy) => { const g = scen.get(x, z), y0 = gH(x, z), col = vary([0.58, 0.64, 0.54], R, 0.05);
        if (r > 1.6) rock(g, x, y0 + r * sy * 0.36, z, r * (0.9 + R() * 0.4), r * sy, r * (0.8 + R() * 0.3), R() * TAU, col, R, 0.22); else ico(g, x, y0 + r * sy * 0.4, z, r, sy, col, R, 0.38); };
      const slab = (x, z, r) => { const g = scen.get(x, z), y0 = gH(x, z) - 0.4, rot = R() * TAU, h = r * (0.8 + R() * 0.9), c1 = vary([0.6, 0.65, 0.54], R, 0.05);   // blocky sandstone with a chamfered top
        box(g, x, y0, z, r * 1.7, h, r * 1.3, rot, c1, c1.map(v => v * 1.08)); box(g, x + (R() - 0.5) * r * 0.3, y0 + h, z + (R() - 0.5) * r * 0.3, r * 1.25, r * 0.35, r * 0.9, rot + 0.15, c1.map(v => v * 1.03), c1.map(v => v * 1.12)); };
      const sNearF = (px, pz) => { let bi = 0, bd = 1e9; for (let i = 0; i < N; i++) { const d = Math.hypot(T.px[i] - px, T.pz[i] - pz); if (d < bd) { bd = d; bi = i; } } return bi * T.ds; };
      const fAt = (px, pz) => ((sNearF(px, pz) - T.startS) % T.len + T.len) % T.len / T.len;   // lap fraction from the start line
      const sAt = (px, pz) => sNearF(px, pz);                                                     // track distance of the nearest sample
      if (fd.lake) exclF.push((x, z) => shoreFO(x, z) < 2.5);                                     // nothing generic in (or right at the edge of) the lake
      // ---- the farm east of the right leg (field, garden, barn, round tower): its footprint is kept free of trees and rocks ----
      // (the field follows the road: a strip from 4.5 m to 58 m beyond the barrier along the upper right leg; the yard and buildings sit north-east of it)
      const FARM = fd.farm ? (() => { const [fx, fz] = fd.farm, sa = sNearF(328, 150), sb = sNearF(335, 40);
        return { sa, sb, o0: 4.5, o1: 58, garden: { x0: fx - 6, x1: fx + 24, z0: fz - 88, z1: fz - 52 },
          barn: [fx + 34, fz - 30], tower: [fx + 12, fz - 44], shed: [fx + 2, fz - 38], yard: { x0: fx - 12, x1: fx + 46, z0: fz - 94, z1: fz - 14 } }; })() : null;
      const inField = (x, z, m) => { const n = nearest(x, z); if (n.i < 0 || n.lat <= 0) return false; const sq = n.i * T.ds; return sq >= FARM.sa - m && sq <= FARM.sb + m && n.lat > T.br[n.i] + FARM.o0 - m && n.lat < T.br[n.i] + FARM.o1 + m; };
      if (FARM) exclF.push((x, z) => inField(x, z, 3) || (x > FARM.yard.x0 && x < FARM.yard.x1 && z > FARM.yard.z0 && z < FARM.yard.z1));
      if (foPit) exclF.push((x, z) => { const n = nearest(x, z); if (n.i < 0) return false; const p = foPit(n.i); return !!p && n.lat > 0 && n.lat < p.o + 3.5 + 9 + 9; });   // pit lane, apron and garages
      // ---- grandstands as in the reference: short open blocks, raked rows packed with spectators (lots of straw hats), white frame,
      //      yellow sponsor boards front and back, loudspeaker poles, a see-through catch fence in front ----
      const SHIRTS = [[0.78, 0.24, 0.2], [0.26, 0.36, 0.6], [0.92, 0.9, 0.86], [0.2, 0.2, 0.23], [0.56, 0.44, 0.34], [0.36, 0.5, 0.36], [0.72, 0.56, 0.4], [0.86, 0.62, 0.32], [0.46, 0.32, 0.5], [0.62, 0.66, 0.72], [0.92, 0.9, 0.86], [0.3, 0.26, 0.24]];   // muted, like the reference crowd
      const SKIN = [[0.95, 0.76, 0.6], [0.86, 0.62, 0.45], [0.62, 0.42, 0.28], [0.98, 0.84, 0.7]], HAIR = [[0.18, 0.12, 0.08], [0.1, 0.08, 0.07], [0.62, 0.45, 0.22], [0.36, 0.22, 0.12], [0.8, 0.78, 0.74]];
      const spectator = (g, x, y, z, rot) => { if (R() < 0.07) return;
        const sh = SHIRTS[Math.floor(R() * SHIRTS.length)], sk = SKIN[Math.floor(R() * SKIN.length)], X = x + (R() - 0.5) * 0.14, Z = z + (R() - 0.5) * 0.14;
        box(g, X, y, Z, 0.54, 0.62, 0.46, rot, sh, sh, true);
        if (R() < 0.4) { const hc = R() < 0.85 ? vary([0.93, 0.84, 0.63], R, 0.05) : (R() < 0.5 ? [0.84, 0.18, 0.15] : [0.2, 0.34, 0.75]); box(g, X, y + 0.62, Z, 0.34, 0.3, 0.34, rot, sk, hc, true); box(g, X, y + 0.9, Z, 0.68, 0.08, 0.68, rot, hc, hc, true); }
        else box(g, X, y + 0.62, Z, 0.36, 0.36, 0.36, rot, sk, HAIR[Math.floor(R() * HAIR.length)], true); };
      let crowdG = null; const crowdMeshes = [];
      const flushCrowd = () => { if (crowdG && !crowdG.empty) { const m = new THREE.Mesh(crowdG.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = false; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); crowdMeshes.push(m); } crowdG = new GB(); };
      const standBlock = (sa, sb, side, rows) => {
        const sm = (sa + sb) / 2, im = T.idx(sm), hd = T.hd[im], L = sb - sa, bar = side > 0 ? T.br[im] : T.bl[im];
        const b0 = bar + 2.8, rowD = 0.8, rowH = 0.46, baseH = 1.1, P = (s1, d) => atS(s1, side * d);
        const [gx, gz] = P(sm, b0 + 3), g = scen.get(gx, gz), white = [0.92, 0.92, 0.94], seat = [0.72, 0.17, 0.15];   // red seats (they show between the fans, as in the reference)
        { const [x, z] = P(sm, b0 - 0.15); box(g, x, 0, z, L, baseH + 0.25, 0.3, hd, white, white); }
        for (let k = 0; k < rows; k++) { const [x, z] = P(sm, b0 + (k + 0.5) * rowD); box(g, x, 0, z, L, baseH + k * rowH, rowD, hd, [0.56, 0.57, 0.62], seat);
          const y = baseH + k * rowH + 0.015, A = P(sa, b0 + k * rowD + 0.05), Bq = P(sb, b0 + k * rowD + 0.05), C = P(sb, b0 + (k + 1) * rowD - 0.05), D = P(sa, b0 + (k + 1) * rowD - 0.05);   // packed crowd underneath the figures
          texCrowd.quadUp([A[0], y, A[1]], [Bq[0], y, Bq[1]], [C[0], y, C[1]], [D[0], y, D[1]], [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]], [[0, k * 0.14], [L / 10, k * 0.14], [L / 10, k * 0.14 + 0.13], [0, k * 0.14 + 0.13]]); }
        const topH = baseH + rows * rowH, backD = b0 + rows * rowD + 0.15;
        { const [x, z] = P(sm, backD); box(g, x, 0, z, L + 0.3, topH + 2.4, 0.3, hd, white, white); }
        for (const s1 of [sa - 0.15, sb + 0.15]) for (let q = 0; q < 3; q++) { const d0 = b0 - 0.3 + q * rows * rowD / 3, dd = backD - d0 + 0.15, [x, z] = P(s1, d0 + dd / 2); box(g, x, 0, z, 0.3, baseH + (q + 1) * rows * rowH / 3 + 0.7, dd, hd, white, white); }
        for (let k = 0; k < rows; k++) for (let s1 = sa + 0.55 + (k % 2) * 0.6, q = 0; s1 < sb - 0.35; s1 += 0.6, q++) { if (Math.abs(s1 - sm) < 0.75 || (q % 2 === 1 && R() < 0.85)) continue; /* figures in a loose checkerboard over the packed-crowd texture */ const [x, z] = P(s1, b0 + (k + 0.55) * rowD); spectator(crowdG, x, baseH + k * rowH, z, hd); }
        const flip = side > 0, behind = (s1, d, y) => { const [x, z] = P(s1, d); return [x, y, z]; };
        for (let s0 = sa + 0.3, q = 0; s0 < sb - 3.5; s0 += 4.1, q++) {   // yellow boards along the front wall
          const slot = [0, 2, 3, 6][q % 4], u0 = (slot % 2) * 0.5, u1 = u0 + 0.5, vT = 1 - Math.floor(slot / 2) * 0.25, vB = vT - 0.25, d = b0 - 0.32;
          const [ax, az] = P(s0, d), [bx, bz] = P(s0 + 3.9, d);
          texSpons.quadO([ax, 0.2, az], [bx, 0.2, bz], [bx, 1.15, bz], [ax, 1.15, az], [1, 1, 1], behind(s0 + 2, d + 2, 0.7), flip ? [[u1, vB], [u0, vB], [u0, vT], [u1, vT]] : [[u0, vB], [u1, vB], [u1, vT], [u0, vT]]); }
        for (let s0 = sa + 0.5, q = 0; s0 < sb - 4.5; s0 += 5.4, q++) {   // and along the top of the back wall
          const slot = [3, 1, 0, 2][q % 4], u0 = (slot % 2) * 0.5, u1 = u0 + 0.5, vT = 1 - Math.floor(slot / 2) * 0.25, vB = vT - 0.25, d = backD - 0.17;
          const [ax, az] = P(s0, d), [bx, bz] = P(s0 + 5.1, d);
          texSpons.quadO([ax, topH + 0.95, az], [bx, topH + 0.95, bz], [bx, topH + 2.25, bz], [ax, topH + 2.25, az], [1, 1, 1], behind(s0 + 2.5, d + 2, topH + 1.5), flip ? [[u1, vB], [u0, vB], [u0, vT], [u1, vT]] : [[u0, vB], [u1, vB], [u1, vT], [u0, vT]]); }
        for (let s1 = sa + 2; s1 < sb; s1 += 11) { const [x, z] = P(s1, b0 - 1.2);   // loudspeaker and lamp poles in front of the stand
          cyl(g, x, 0, z, 0.08, 6.4, 6, white); box(g, x, 6.2, z, 0.55, 0.28, 0.35, hd, white, [0.98, 0.95, 0.8]);
          for (const o of [-0.3, 0.3]) { const [hx, hz] = P(s1 + o, b0 - 1.0); box(g, hx, 5.5, hz, 0.28, 0.28, 0.42, hd + o * 1.4, [0.95, 0.95, 0.95]); } }
        for (let s1 = sa - 4; s1 < sb + 4; s1 += 2) { const i = T.idx(s1), j = T.idx(s1 + 2), bi = side > 0 ? T.br : T.bl, Q = (k, y) => [T.px[k] + T.nx[k] * side * (bi[k] + 0.35), y, T.pz[k] + T.nz[k] * side * (bi[k] + 0.35)];   // see-through catch fence
          const fu0 = s1 / 2.5, fu1 = (s1 + 2) / 2.5; texFence.quadO(Q(i, 0.95), Q(j, 0.95), Q(j, 3.5), Q(i, 3.5), [1, 1, 1], [T.px[i], 2, T.pz[i]], [[fu0, 0], [fu1, 0], [fu1, 1.0], [fu0, 1.0]]);
          if (((s1 - sa + 4) / 2 | 0) % 2 === 0) { const q = Q(i, 0); box(g, q[0], 0, q[2], 0.1, 3.6, 0.1, 0, [0.62, 0.63, 0.66]); } }
        const [cx, cz] = P(sm, b0 + rows * rowD / 2); exclRect.push({ x: cx, z: cz, hx: L / 2 + 3, hz: rows * rowD / 2 + 4, rot: hd });
      };
      { const S0 = T.startS; flushCrowd(); standBlock(S0 - 106, S0 - 81, -1, 7); standBlock(S0 - 77, S0 - 52, -1, 7); standBlock(S0 - 48, S0 - 23, -1, 7); flushCrowd();
        if (fd.stand2) { const a = sNearF(...fd.stand2[0]), b = sNearF(...fd.stand2[1]), s0 = Math.min(a, b), s1 = Math.max(a, b), mid = (s0 + s1) / 2;
          standBlock(s0, mid - 2, -1, 5); standBlock(mid + 2, s1, -1, 5); flushCrowd(); } }
      // ---- the big heap of boulders right after the finish line, between the straight and the tongue (as in the reference) ----
      { const S0 = T.startS;
        for (let s1 = S0 + 6; s1 < S0 + 62; s1 += 3.8) for (let layer = 0; layer < 2; layer++) {   // a low heap of big rounded boulders (not a cliff)
          const i = T.idx(s1 + (R() - 0.5) * 3), d = T.bl[i] + 6.6 + layer * 4.6 + R() * 2, x = T.px[i] - T.nx[i] * d, z = T.pz[i] - T.nz[i] * d, r = 2.4 + R() * 1.9 + layer * 0.4;
          if (clearance(x, z) < r * 0.8 + 1.2 || excluded(x, z)) continue; const g = scen.get(x, z), y0 = gH(x, z);
          rock(g, x, y0 + r * 0.32 + layer * 0.5, z, r * (1.05 + R() * 0.3), r * (0.62 + R() * 0.25), r * (0.85 + R() * 0.2), R() * TAU, vary([0.6, 0.66, 0.56], R, 0.05), R, 0.2, 0.8);
          if (R() < 0.35) rock(g, x + (R() - 0.5) * 2, y0 + r * 1.1 + layer * 0.9, z + (R() - 0.5) * 2, r * 0.65, r * 0.5, r * 0.6, R() * TAU, vary([0.64, 0.71, 0.6], R, 0.05), R, 0.2); }
        { let prev = null; const g0 = scen.get(T.px[T.idx(S0 + 36)], T.pz[T.idx(S0 + 36)]);   // wooden posts with a sagging rope between the catch fence and the boulders
          for (let s1 = S0 + 10; s1 < S0 + 64; s1 += 3.2) { const i = T.idx(s1), o = T.bl[i] + 2.3, x = T.px[i] - T.nx[i] * o, z = T.pz[i] - T.nz[i] * o, wc = [0.46, 0.3, 0.19], rc = [0.66, 0.54, 0.38];
            box(g0, x, 0, z, 0.2, 1.1, 0.2, T.hd[i], wc, [0.52, 0.35, 0.22]);
            if (prev) { const Y = (t) => 0.95 - 0.28 * 4 * t * (1 - t), p3 = [0, 1 / 3, 2 / 3, 1].map(t => [prev[0] + (x - prev[0]) * t, Y(t), prev[1] + (z - prev[1]) * t]);
              for (let k = 0; k < 3; k++) { const a1 = p3[k], b1 = p3[k + 1]; g0.quadO(a1, b1, [b1[0], b1[1] + 0.07, b1[2]], [a1[0], a1[1] + 0.07, a1[2]], rc, [T.px[i], 0.5, T.pz[i]]); g0.quadO(b1, a1, [a1[0], a1[1] + 0.07, a1[2]], [b1[0], b1[1] + 0.07, b1[2]], rc, [2 * x - T.px[i], 0.5, 2 * z - T.pz[i]]); } }
            prev = [x, z]; }
          for (const [ds, dl] of [[62, 1.6], [63.6, 1.9], [62.8, 2.9]]) { const i = T.idx(S0 + ds), o = T.bl[i] + dl, x = T.px[i] - T.nx[i] * o, z = T.pz[i] - T.nz[i] * o;   // straw bales at the end
            box(g0, x, 0, z, 1.3, 0.85, 0.9, T.hd[i] + 0.2, [0.8, 0.62, 0.3], [0.88, 0.72, 0.38]); } }
        const i0 = T.idx(S0 + 34), d0 = T.bl[i0] + 10; exclRect.push({ x: T.px[i0] - T.nx[i0] * d0, z: T.pz[i0] - T.nz[i0] * d0, hx: 32, hz: 9, rot: T.hd[i0] }); }
      // ---- the lake north of the circuit: dark blue water (the low sun glitters on it) behind a ridge of big pale boulders with firs ----
      if (fd.lake) {
        const wx0 = B.minX - 260, wx1 = B.maxX + 260, wz0 = B.minZ - 260; let wz1 = -1e9; for (const [, pz] of fd.lake) wz1 = Math.max(wz1, pz); wz1 += 10;
        const wg = new THREE.PlaneGeometry(wx1 - wx0, wz1 - wz0, 1, 1); wg.rotateX(-Math.PI / 2); wg.translate((wx0 + wx1) / 2, -1.25, (wz0 + wz1) / 2);
        const uvA = wg.getAttribute('uv'), pA = wg.getAttribute('position'); for (let k = 0; k < uvA.count; k++) uvA.setXY(k, pA.getX(k) / 26, -pA.getZ(k) / 26);
        const wm = new THREE.Mesh(wg, new THREE.MeshLambertMaterial({ map: tex.water, color: 0x86677a }));
        wm.receiveShadow = true; wm.matrixAutoUpdate = false; wm.updateMatrix(); root.add(wm); out.dyn.water = tex.water;
        const L = fd.lake, stoneC = [0.62, 0.67, 0.58];
        for (let e = 0; e < L.length; e++) { const [ax, az] = L[e], [bx, bz] = L[(e + 1) % L.length], len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
          for (let q = 0; q < len; q += 5.5 + R() * 3) { const px0 = ax + ux * q, pz0 = az + uz * q;
            if (px0 < B.minX - 40 || px0 > B.maxX + 40 || pz0 < B.minZ - 40 || pz0 > B.maxZ + 40) continue;
            const c0 = clearance(px0, pz0); if (c0 > 95) continue;                                  // only the shore the camera can see
            for (let layer = 0; layer < 2; layer++) {                                                 // a band of boulders: one row half in the water, one on the bank
              const inl = layer === 0 ? -2 + R() * 3 : 3 + R() * 6, x = px0 + uz * inl + (R() - 0.5) * 2, z = pz0 - ux * inl + (R() - 0.5) * 2;   // (the polygon runs clockwise on the map: (uz, -ux) points inland)
              const c = clearance(x, z), r = 3 + R() * 3.4 + (layer ? 0.8 : 0); if (c < r + 5) continue;
              const g = scen.get(x, z), y0 = layer === 0 ? -1.4 : gH(x, z);
              rock(g, x, y0 + r * 0.32, z, r * (1 + R() * 0.4), r * (0.55 + R() * 0.35), r * (0.8 + R() * 0.3), R() * TAU, vary(stoneC, R, 0.05), R, 0.18, 0.75);
              if (layer === 1 && R() < 0.3) rock(g, x + (R() - 0.5) * r, y0 + r * 0.8, z + (R() - 0.5) * r, r * 0.6, r * 0.45, r * 0.55, R() * TAU, vary(stoneC, R, 0.05), R, 0.2); }
            if (R() < 0.55) { const inl = 6 + R() * 8, x = px0 + uz * inl, z = pz0 - ux * inl; if (clearance(x, z) > 7 && !excluded(x, z)) fir(x, z, 9 + R() * 7); } } }
      }
      // ---- tall rock walls (cliffs) with firs on top: round the top-left corner, the ridge on the right leg, behind the top road ----
      const cliff = (x, z, r, h) => { const g = scen.get(x, z), y0 = gH(x, z) - 0.5, n = 4 + Math.floor(R() * 3);
        for (let k = 0; k < n; k++) { const a = R() * TAU, d = R() * r * 0.45, rr = r * (0.38 + R() * 0.22), sy = (h * (0.6 + R() * 0.5)) / (rr * 1.6);
          rock(g, x + Math.cos(a) * d, y0 + rr * sy * 0.7, z + Math.sin(a) * d, rr * (1 + R() * 0.3), rr * sy, rr * (0.85 + R() * 0.3), R() * TAU, vary([0.6, 0.65, 0.55], R, 0.05), R, 0.18, 0.7); }
        if (R() < 0.75) fir(x + (R() - 0.5) * r * 0.5, z + (R() - 0.5) * r * 0.5, 7 + R() * 5, y0 + h * 0.8); };
      const cliffRow = (fa, fb, side, d0, d1, h) => { if (fb < fa) fb += 1;
        for (let q = fa * T.len; q < fb * T.len; q += 9 + R() * 4) { const i = T.idx((T.startS + q) % T.len), bar = side > 0 ? T.br[i] : T.bl[i], d = bar + d0 + R() * (d1 - d0), x = T.px[i] + T.nx[i] * side * d, z = T.pz[i] + T.nz[i] * side * d, r = 7 + R() * 5;
          if (clearance(x, z) < r * 0.6 + 4 || excluded(x, z)) continue; cliff(x, z, r, h * (0.7 + R() * 0.5)); excl.push({ x, z, r: r * 0.8 }); } };
      // a big grey rock mass filling the infield of the rock bulb, right behind the inner kerb (as in the reference)
      { let cxs = 0, czs = 0, nb = 0; for (const [px2, pz2] of [[378, -6], [379, -32], [359, -53], [331, -50], [315, -32], [313, -6]]) { cxs += px2; czs += pz2; nb++; }
        const bx0 = cxs / nb, bz0 = czs / nb;
        for (let k = 0; k < 16; k++) { const a = R() * TAU, d = Math.sqrt(R()) * 11, x = bx0 + Math.cos(a) * d, z = bz0 + Math.sin(a) * d, r = 2.8 + R() * 2.6, c = clearance(x, z);
          if (c < r * 0.7 + 0.8) continue; const g = scen.get(x, z), y0 = gH(x, z), hh = Math.min(2.2, c * 0.25);
          rock(g, x, y0 + r * 0.45 + (k > 9 ? hh : 0), z, r * (1 + R() * 0.3), r * (0.8 + R() * 0.4), r * (0.85 + R() * 0.25), R() * TAU, vary([0.55, 0.64, 0.6], R, 0.05), R, 0.2); }
        fir(bx0 + 3, bz0 - 2, 10); excl.push({ x: bx0, z: bz0, r: 12 }); }
      cliffRow(fAt(49, -48), fAt(20, 18), 1, 7, 13, 18);     // outside of the top-left corner: a tall rock wall dropping into the lake
      cliffRow(fAt(277, 263), fAt(328, 146), 1, 19, 26, 9);  // beyond the dry creek on the right leg
      // ---- rock formations: big flat-shaded boulders heaped on low mounds, a few firs growing between them ----
      for (const [rx, rz, rr] of fd.rocks) {
        const n = 4 + Math.round(rr / 2.2);
        for (let k = 0; k < n; k++) { const a = R() * TAU, d = Math.sqrt(R()) * rr * 0.85, x = rx + Math.cos(a) * d, z = rz + Math.sin(a) * d, r = 2.4 + R() * rr * 0.34;
          if (clearance(x, z) < r + 2) continue; if (R() < 0.55) slab(x, z, r * 0.8); else boulder(x, z, r, 0.55 + R() * 0.45); }
        for (let k = 0; k < 2 + rr / 6; k++) { const a = R() * TAU, d = rr * (0.4 + R() * 0.7), x = rx + Math.cos(a) * d, z = rz + Math.sin(a) * d; if (clearance(x, z) > 6) fir(x, z, 9 + R() * 6); }
        excl.push({ x: rx, z: rz, r: rr });
      }
      // scattered single boulders along the verges (as in the video, right behind the tyres)
      for (let k = 0; k < 90; k++) { const i = Math.floor(R() * N), side = R() < 0.5 ? -1 : 1, bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 3 + R() * 10), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        if (clearance(x, z) > 3 && !excluded(x, z)) { const r = 1.2 + R() * 2.6; boulder(x, z, r, 0.6 + R() * 0.4); excl.push({ x, z, r: r + 1 }); } }
      // ---- the farm (as in the reference): a ploughed field of long orange ridges behind a red wooden fence and a plank walkway,
      //      a vegetable garden, a round wooden tower with a blue top and a white balcony, a brown barn with white trim, an open shed ----
      if (FARM) { const F = FARM, soil = [0.46, 0.3, 0.23], ridgeS = [0.52, 0.33, 0.24], ridgeT = [0.68, 0.44, 0.31], wood = [0.5, 0.31, 0.19], dkWood = [0.36, 0.22, 0.15], white = [0.93, 0.92, 0.9];
        const gf = new GB(), quadFlat = (x0, z0, x1, z1, y, col) => gf.quadUp([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [col, col, col, col]);
        const FP = (sq, o) => { const i = T.idx(sq), oo = T.br[i] + o; return [T.px[i] + T.nx[i] * oo, T.pz[i] + T.nz[i] * oo]; };
        const hutS = F.sa + (F.sb - F.sa) * 0.42, hutO = 34, [hutX, hutZ] = FP(hutS, hutO);
        for (let q = F.sa; q < F.sb; q += 2) { const A = FP(q, F.o0), Bq = FP(q, F.o1), C = FP(q + 2, F.o1), D = FP(q + 2, F.o0);   // the field
          gf.quadUp([A[0], 0.03, A[1]], [Bq[0], 0.03, Bq[1]], [C[0], 0.03, C[1]], [D[0], 0.03, D[1]], [soil, soil, soil, soil]);
          for (let o = F.o0 + 2.2; o < F.o1 - 1; o += 3.3) {                                                     // ridges running along the circuit
            if (Math.abs(o - hutO) < 6 && Math.abs(q - hutS) < 8) continue;
            const a0 = FP(q, o - 0.85), a1 = FP(q, o + 0.85), b0 = FP(q + 2, o - 0.85), b1 = FP(q + 2, o + 0.85), m0 = FP(q, o), m1 = FP(q + 2, o);
            gf.quadO([a0[0], 0.03, a0[1]], [b0[0], 0.03, b0[1]], [m1[0], 0.44, m1[1]], [m0[0], 0.44, m0[1]], ridgeS, [m0[0], -2, m0[1]], null, [ridgeS, ridgeS, ridgeT, ridgeT]);
            gf.quadO([m0[0], 0.44, m0[1]], [m1[0], 0.44, m1[1]], [b1[0], 0.03, b1[1]], [a1[0], 0.03, a1[1]], ridgeS, [m0[0], -2, m0[1]], null, [ridgeT, ridgeT, ridgeS, ridgeS]); } }
        quadFlat(F.yard.x0, F.yard.z0, F.yard.x1, F.yard.z1, 0.028, [0.6, 0.37, 0.24]);                         // farmyard: bare orange soil
        const mf = new THREE.Mesh(gf.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); mf.receiveShadow = true; mf.matrixAutoUpdate = false; root.add(mf);
        { const g = scen.get(hutX, hutZ);                                                                       // small wooden hut in the corner of the field
          box(g, hutX, 0, hutZ, 5, 3, 4.2, 0.05, dkWood, dkWood); gable(g, hutX, 3, hutZ, 5.6, 4.8, 1.5, 0.05, [0.3, 0.22, 0.2], dkWood);
          box(g, hutX - 2.52, 1.2, hutZ, 0.05, 0.9, 1.2, 0.05, [0.95, 0.85, 0.55]);
          for (const [bx, bz] of [[4, 5], [5.3, 5.4], [4.6, 6.6], [-4.5, 7]]) box(g, hutX + bx, 0, hutZ + bz, 1.3, 0.85, 0.9, R() * 0.6, [0.8, 0.62, 0.3], [0.9, 0.74, 0.4]); }
        { const [bx, bz] = F.barn, g = scen.get(bx, bz), rot = 0.08;                                          // barn
          box(g, bx, 0, bz, 7.5, 5.6, 11, rot, wood, wood); gable(g, bx, 5.6, bz, 11.8, 8.4, 3.4, rot + Math.PI / 2, [0.33, 0.22, 0.2], wood);
          const c = Math.cos(rot), sn = Math.sin(rot), Pb = (lx, lz) => [bx + lx * c - lz * sn, bz + lx * sn + lz * c];
          for (const [lx, lz] of [[-3.75, -5.5], [3.75, -5.5], [3.75, 5.5], [-3.75, 5.5]]) { const [x, z] = Pb(lx, lz); box(g, x, 0, z, 0.35, 5.7, 0.35, rot, white); }
          { const [x, z] = Pb(-3.8, 0); box(g, x, 0, z, 0.12, 3.6, 3.6, rot, white); box(g, x - 0.04, 0.15, z, 0.1, 3.3, 3.2, rot, [0.4, 0.24, 0.16]); }   // white-framed doors
          box(g, bx, 5.45, bz, 7.8, 0.3, 11.3, rot, white);
          const [ax, az] = Pb(0, 7.6); box(g, ax, 0, az, 5, 3.4, 4.2, rot, wood, wood); gable(g, ax, 3.4, az, 5.6, 4.8, 1.6, rot, [0.33, 0.22, 0.2], wood); }
        { const [tx, tz] = F.tower, g = scen.get(tx, tz);                                                     // round tower: wooden base, blue top, white balcony
          cyl(g, tx, 0, tz, 2.7, 7, 10, wood, [0.45, 0.28, 0.18]); cyl(g, tx, 7, tz, 3.4, 0.22, 12, white); cyl(g, tx, 7.2, tz, 2.4, 3, 10, [0.27, 0.42, 0.74], [0.3, 0.45, 0.76]);
          for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, a2 = (k + 1) / 12 * TAU, px = tx + Math.cos(a) * 3.25, pz = tz + Math.sin(a) * 3.25, qx = tx + Math.cos(a2) * 3.25, qz = tz + Math.sin(a2) * 3.25;
            box(g, px, 7.2, pz, 0.1, 0.9, 0.1, 0, white); box(g, (px + qx) / 2, 8.05, (pz + qz) / 2, 1.72, 0.1, 0.1, Math.atan2(qz - pz, qx - px), white); }
          cone(g, tx, 10.2, tz, 3.1, 3.4, 10, [0.46, 0.22, 0.16], [0.52, 0.26, 0.18], 0); box(g, tx - 3, 0, tz, 2.4, 1.2, 1.4, 0, dkWood); }
        { const [sx, sz] = F.shed, g = scen.get(sx, sz);                                                      // open shed with a grey corrugated roof
          for (const lx of [-7, 0, 7]) for (const lz of [-2.6, 2.6]) box(g, sx + lx, 0, sz + lz, 0.22, 2.9, 0.22, 0, dkWood);
          gable(g, sx, 2.9, sz, 16, 6.4, 0.9, 0, [0.6, 0.61, 0.64], [0.5, 0.5, 0.53]);
          box(g, sx - 3, 0, sz, 3, 1.1, 2, 0.2, [0.8, 0.62, 0.3], [0.9, 0.74, 0.4]); cyl(g, sx + 4, 0, sz + 1, 0.45, 1.1, 8, [0.2, 0.45, 0.75]); }
        { const G = F.garden, g = scen.get((G.x0 + G.x1) / 2, (G.z0 + G.z1) / 2);                              // vegetable garden: rows of round bushes
          for (let z = G.z0 + 3; z < G.z1 - 1; z += 4.2) for (let x = G.x0 + 2; x < G.x1 - 1; x += 3.2) ico(g, x + (R() - 0.5) * 0.5, 0.75, z + (R() - 0.5) * 0.5, 1.05 + R() * 0.25, 0.85, vary([0.27, 0.5, 0.22], R, 0.12), R, 0.2); }
        // plank walkway and red wooden fence between the circuit and the farm
        { const s0 = F.sa, s1 = sAt(380, -34), gw = new GB(); let n = 0, prev = null;
          for (let q = s0; q < s1; q += 1.0, n++) { const i = T.idx(q), j = T.idx(q + 1), o1 = T.br[i] + 1.5, o2 = T.br[i] + 4.2, oj1 = T.br[j] + 1.5, oj2 = T.br[j] + 4.2;
            const A = [T.px[i] + T.nx[i] * o1, 0.06, T.pz[i] + T.nz[i] * o1], Bq = [T.px[i] + T.nx[i] * o2, 0.06, T.pz[i] + T.nz[i] * o2], C = [T.px[j] + T.nx[j] * oj2, 0.06, T.pz[j] + T.nz[j] * oj2], D = [T.px[j] + T.nx[j] * oj1, 0.06, T.pz[j] + T.nz[j] * oj1];
            const pc = n % 2 ? [0.55, 0.36, 0.22] : [0.5, 0.32, 0.2]; gw.quadUp(A, Bq, C, D, [pc, pc, pc, pc]);
            if (n % 3 === 0) { const x = T.px[i] + T.nx[i] * (o2 + 0.3), z = T.pz[i] + T.nz[i] * (o2 + 0.3), g = scen.get(x, z), rc = [0.55, 0.19, 0.14];
              box(g, x, 0, z, 0.17, 1.25, 0.17, T.hd[i], rc);
              if (prev) for (const hy of [0.5, 1.0]) { g.quadO([prev[0], hy, prev[1]], [x, hy, z], [x, hy + 0.14, z], [prev[0], hy + 0.14, prev[1]], rc, [T.px[i], hy, T.pz[i]]); g.quadO([x, hy, z], [prev[0], hy, prev[1]], [prev[0], hy + 0.14, prev[1]], [x, hy + 0.14, z], [0.42, 0.15, 0.12], [2 * x - T.px[i], hy, 2 * z - T.pz[i]]); }
              prev = [x, z]; } }
          const m = new THREE.Mesh(gw.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
      }
      // ---- dry creek (as in the reference): a pale winding sandy bed with a darker rim, east of the right leg beyond the mown lawn ----
      let creekD = null;
      if (fd.river) { const rv = fd.river, pts = [];
        for (let k = 0; k < rv.length - 1; k++) { const [ax, az] = rv[k], [bx, bz] = rv[k + 1], L2 = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L2 / 2));
          for (let q = 0; q < n; q++) { const t = q / n; pts.push([ax + (bx - ax) * t, az + (bz - az) * t]); } }
        pts.push(rv[rv.length - 1]);
        const P2 = pts.map((p, k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, wv = 1.6 * Math.sin(k * 0.21) + 0.7 * Math.sin(k * 0.57 + 1);
          return [p[0] - dz / l * wv, p[1] + dx / l * wv, -dz / l, dx / l, 2.3 + 0.5 * Math.sin(k * 0.33 + 2)]; });
        const gc = new GB(), bed = [0.66, 0.57, 0.53], rim = [0.5, 0.43, 0.4];
        for (let k = 0; k < P2.length - 1; k++) { const a = P2[k], b = P2[k + 1];
          const E = (p, o, y) => [p[0] + p[2] * o, y, p[1] + p[3] * o];
          gc.quadUp(E(a, -a[4], 0.035), E(a, a[4], 0.035), E(b, b[4], 0.035), E(b, -b[4], 0.035), [bed, bed, bed, bed]);
          for (const sd of [-1, 1]) { const o0 = sd * a[4], o1 = sd * (a[4] + 0.9), p0 = sd * b[4], p1 = sd * (b[4] + 0.9);
            if (sd < 0) gc.quadUp(E(a, o1, 0.03), E(a, o0, 0.03), E(b, p0, 0.03), E(b, p1, 0.03), [rim, rim, rim, rim]); else gc.quadUp(E(a, o0, 0.03), E(a, o1, 0.03), E(b, p1, 0.03), E(b, p0, 0.03), [rim, rim, rim, rim]);
            if (R() < 0.35) { const o = sd * (a[4] + 0.4 + R() * 0.6), x = a[0] + a[2] * o, z = a[1] + a[3] * o; ico(scen.get(x, z), x, 0.12, z, 0.3 + R() * 0.35, 0.6, vary([0.72, 0.68, 0.62], R, 0.06), R, 0.3); } } }
        const mc = new THREE.Mesh(gc.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); mc.receiveShadow = true; mc.matrixAutoUpdate = false; root.add(mc);
        const xs = P2.map(p => p[0]), zs = P2.map(p => p[1]), bb = [Math.min(...xs) - 8, Math.max(...xs) + 8, Math.min(...zs) - 8, Math.max(...zs) + 8];
        creekD = (x, z) => { if (x < bb[0] || x > bb[1] || z < bb[2] || z > bb[3]) return 1e9; let d = 1e9; for (let k = 0; k < P2.length; k += 2) d = Math.min(d, (x - P2[k][0]) ** 2 + (z - P2[k][1]) ** 2); return Math.sqrt(d); };
        exclF.push((x, z) => creekD(x, z) < 4.5); }
      // ---- knockable traffic cones: a short row on the asphalt through the apex of every hairpin, well outside the racing line
      //      (as in the reference, the cars swing past on the inside), one more on the kerb at each end; marshals at the big corners ----
      const prop = (kind, x, z, yaw, col) => out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0 });
      for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, inner = c.dir;
        { let za = null, zb = null;   // (hairpins: up to four on the road and two on the kerb; the quicker corners: three on the road, as at the S in the reference)
          for (let k = c.i0 - 4; k <= i1c + 4; k++) { const ii = ((k % N) + N) % N; if (T.rl[ii] * inner >= 3.9) { if (za == null) za = k; zb = k; } }
          if (za != null) { const s0 = za * T.ds, s1 = zb * T.ds, n = c.sev >= 3 ? clamp(Math.floor((s1 - s0) / 3.6) + 1, 2, 4) : 3, st = (s1 - s0) / (n - 1);
            for (let q = 0; q < n; q++) { const [x, z, hd] = atSf(s0 + q * st, inner * 0.7); prop('cone', x, z, hd + R() * 0.6); }
            if (c.sev >= 3) for (const se of [s0 - 3, s1 + 3]) { const [x, z, hd] = atSf(se, inner * (w + 0.45)); prop('cone', x, z, hd); } } }
        for (let k = 0; k < 2; k++) { const i = T.idx(c.s0 + k * 7), side = -c.dir, bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 1.6), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, g = scen.get(x, z);
          box(g, x, 0, z, 0.5, 1.25, 0.35, T.hd[i], [0.98, 0.5, 0.1]); box(g, x, 1.25, z, 0.32, 0.32, 0.32, T.hd[i], [0.96, 0.96, 0.96]); } }
      // ---- big billboards on two wooden posts, tilted back and turned to the oncoming cars (placed as in the reference) ----
      { const gb = new GB(true), gpost = new GB();
        const board = (px, pz, side, out, along, slot, hw, hh) => { const i0 = T.idx(sAt(px, pz) + along), bar = side > 0 ? T.br[i0] : T.bl[i0], o = side * (bar + out), x = T.px[i0] + T.nx[i0] * o, z = T.pz[i0] + T.nz[i0] * o;
          let fx = -side * T.nx[i0] - T.tx[i0] * 0.7, fz = -side * T.nz[i0] - T.tz[i0] * 0.7; const fl = Math.hypot(fx, fz); fx /= fl; fz /= fl;   // faces the circuit and the cars coming towards it
          const ux = fz, uz = -fx, y0 = 2.0, tilt = 0.38, top = [-fx * hh * Math.sin(tilt), hh * Math.cos(tilt), -fz * hh * Math.sin(tilt)];
          const A = [x - ux * hw, y0, z - uz * hw], Bq = [x + ux * hw, y0, z + uz * hw], C = [Bq[0] + top[0], y0 + top[1], Bq[2] + top[2]], D = [A[0] + top[0], y0 + top[1], A[2] + top[2]];
          const u0 = (slot % 2) * 0.5, vT = 1 - Math.floor(slot / 2) * 0.5, inside = [x - fx * 2, y0 + hh / 2, z - fz * 2];
          gb.quadO(A, Bq, C, D, [1, 1, 1], inside, [[u0, vT - 0.5], [u0 + 0.5, vT - 0.5], [u0 + 0.5, vT], [u0, vT]]);
          const bk = (p) => [p[0] - fx * 0.12, p[1], p[2] - fz * 0.12];   // plain backing
          gpost.quadO(bk(Bq), bk(A), bk(D), bk(C), [0.86, 0.85, 0.82], [x + fx * 2, y0 + hh / 2, z + fz * 2]);
          for (const q of [-hw * 0.62, hw * 0.62]) box(gpost, x + ux * q - fx * 0.3, 0, z + uz * q - fz * 0.3, 0.3, y0 + hh * 0.7, 0.3, Math.atan2(uz, ux), [0.48, 0.33, 0.22]);
          excl.push({ x, z, r: hw + 1.5 }); };
        board(193, 101, 1, 3.4, 0, 0, 4.2, 3.9);      // DOBRI DNEVI and NA ZDRAVJE beside the tongue, opposite its grandstand
        board(193, 101, 1, 3.9, 14, 1, 4.2, 3.9);
        board(301, 221, 1, 22, -4, 2, 4.2, 3.6);        // two GROM boards beyond the dry creek on the right leg
        board(301, 221, 1, 23.5, 10, 2, 4.2, 3.6);
        board(327, 116, -1, 4.5, 0, 3, 2.4, 2.4);     // OPRIJEM sign inside the S of the right leg
        board(165, -18, 1, 3.6, 0, 0, 4.2, 3.9);        // DOBRI DNEVI again at the top of the tongue
        const mb = new THREE.Mesh(gb.geometry(), new THREE.MeshLambertMaterial({ map: tex.boardsFO, vertexColors: true })); mb.castShadow = true; mb.receiveShadow = true; root.add(mb);
        const mp = new THREE.Mesh(gpost.geometry(), matV); mp.castShadow = true; mp.receiveShadow = true; root.add(mp); }
      // ---- orange-brown dirt shoulders along both edges of the whole circuit (the look of the reference track) ----
      { const gs = new GB(), sAtStart = T.startS;
        for (const side of [-1, 1]) for (let q = 0; q < T.len; q += 2) {
          const i = T.idx(q), j = T.idx(q + 2), bar = side > 0 ? T.br : T.bl, o1 = w + 0.02, wd = (T.k[i] * side < 0 && Math.abs(T.k[i]) > 0.015) ? 3.4 : 1.7, o2i = Math.min(w + wd, bar[i] - 0.5), o2j = Math.min(w + wd, bar[j] - 0.5);
          if (o2i <= o1 + 0.3) continue;
          const P = (k, o) => [T.px[k] + T.nx[k] * o * side, 0.012, T.pz[k] + T.nz[k] * o * side], col = vary([0.58, 0.39, 0.31], R, 0.04);
          gs.quadUp(P(i, o1), P(j, o1), P(j, o2j), P(i, o2i), [col, col, col, col]);
        }
        const m = new THREE.Mesh(gs.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
      // ---- knockable straw-bale stacks (two bales with one on top) at the entry and exit of every corner, on the outside just in front of the barrier ----
      for (const c of T.corners) { const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1;
        for (const at of [c.i0 - 6, i1c + 6]) { const i = ((at % N) + N) % N, side = -c.dir, bar = side > 0 ? T.br[i] : T.bl[i], [x, z] = atS(i * T.ds, side * (bar - 1.15));
          prop('bstack', x, z, T.hd[i] + (R() - 0.5) * 0.12); R(); R(); } }
      // ---- pit lane (as in the reference): an asphalt lane on the outside of the straight behind a bare rail on a grass strip,
      //      a pale concrete apron with painted boxes where the crews stand in rows, a row of garages behind ----
      if (foPit) { const fdp = fd.pit || [15.5, -238, 80], gl = new GB(true), gp = new GB();
        const at = (k, o, y) => [T.px[k] + T.nx[k] * o, y, T.pz[k] + T.nz[k] * o], conc = [0.74, 0.78, 0.7], wl = [0.95, 0.95, 0.94], one = [1, 1, 1];
        for (let q = fdp[1]; q < fdp[2]; q += 2) {
          const i = T.idx(T.startS + q), j = T.idx(T.startS + q + 2), pi = foPit(i), pj = foPit(j); if (!pi || !pj) continue;
          const a0 = pi.o - 3.5, a1 = pi.o + 3.5, b0 = pj.o - 3.5, b1 = pj.o + 3.5, A = at(i, a0, 0.024), Bq = at(i, a1, 0.024), C = at(j, b1, 0.024), D = at(j, b0, 0.024);
          gl.quadUp(A, Bq, C, D, [one, one, one, one], [[A[0] / 8, -A[2] / 8], [Bq[0] / 8, -Bq[2] / 8], [C[0] / 8, -C[2] / 8], [D[0] / 8, -D[2] / 8]]);
          gp.quadUp(at(i, a1 - 0.32, 0.033), at(i, a1 - 0.14, 0.033), at(j, b1 - 0.14, 0.033), at(j, b1 - 0.32, 0.033), [wl, wl, wl, wl]);                        // solid line on the outer edge
          if (((q / 2) | 0) % 2 === 0) gp.quadUp(at(i, a0 + 0.14, 0.033), at(i, a0 + 0.32, 0.033), at(j, b0 + 0.32, 0.033), at(j, b0 + 0.14, 0.033), [wl, wl, wl, wl]);   // dashed inner line
          if (pi.t > 0.999 && pj.t > 0.999) gp.quadUp(at(i, a1, 0.022), at(i, a1 + 9, 0.022), at(j, b1 + 9, 0.022), at(j, b1, 0.022), [conc, conc, conc, conc]); }  // concrete apron
        const TEAM = [[0.85, 0.16, 0.13], [0.16, 0.36, 0.8], [0.95, 0.95, 0.94], [0.18, 0.62, 0.3], [0.96, 0.72, 0.12], [0.14, 0.14, 0.16], [0.95, 0.45, 0.1], [0.5, 0.26, 0.7], [0.1, 0.62, 0.72], [0.85, 0.2, 0.5], [0.4, 0.42, 0.46], [0.2, 0.3, 0.55], [0.7, 0.1, 0.1]];
        // ---- garage and box dressing (no random draws here: the scenery after it stays the same). a = metres along from the box start, w = lateral ----
        const kbox = (g, s0, a, w, y, sx, sy, sz, col, top, nb) => { const [x, z, hd] = atSf(s0 + a, w); box(g, x, y, z, sx, sy, sz, hd, col, top, nb); };
        const kcyl = (g, s0, a, w, y, r, h, n, col, top) => { const [x, z] = atSf(s0 + a, w); cyl(g, x, y, z, r, h, n, col, top); };
        const kface = (g, s0, a0, a1, w, y0, y1, col, dir) => { const [x0, z0] = atSf(s0 + a0, w), [x1, z1] = atSf(s0 + a1, w), [xb, zb] = atSf(s0 + (a0 + a1) / 2, w - (dir || -1) * 0.2);   // a flat panel facing the lane (dir -1) or away from it (+1): drawer lines, screens
          g.quadO([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], col, [xb, (y0 + y1) / 2, zb]); };
        const CAB = [[0.78, 0.14, 0.12], [0.2, 0.21, 0.24], [0.15, 0.3, 0.62], [0.12, 0.12, 0.13]], CMP = [[0.86, 0.14, 0.12], [0.95, 0.8, 0.14], [0.92, 0.92, 0.9]], BLK = [0.13, 0.13, 0.15], SIL = [0.66, 0.68, 0.72], SCR = [0.16, 0.24, 0.38];
        const blankets = (g, s0, a, w, y, n, h, cmp) => {   // a stack of n tyres in warming blankets, each banded in the compound colour
          kcyl(g, s0, a, w, y, 0.36, n * h, 8, BLK, [0.17, 0.17, 0.19]); for (let l = 0; l < n; l++) kcyl(g, s0, a, w, y + (l + 0.42) * h, 0.366, h * 0.16, 8, cmp); };
        const cabinet = (g, s0, a, w, sx, sy, sz, col) => {   // a roll cab on a dark plinth (the casters), silver drawer lines on the face toward the lane
          kbox(g, s0, a, w, 0, sx * 0.94, 0.1, sz * 0.9, [0.08, 0.08, 0.09], null, true); kbox(g, s0, a, w, 0.1, sx, sy, sz, col, [0.1, 0.1, 0.11]);
          for (let d = 0; d < 4; d++) { const y = 0.1 + sy * (0.22 + d * 0.2); kface(g, s0, a - sx * 0.43, a + sx * 0.43, w - sz / 2 - 0.004, y, y + 0.025, SIL); } };
        const forestPitKit = (g, s0, k, base, wv, mine) => {   // per crew box (g: its scenery chunk): a roll cab, tyre sets on a trolley, a monitor cart and an air-line reel on the apron, the team's stand on the pit wall
          const h = (k * 7 + 3) % 4, cmp = CMP[k % 3], mc = mine ? 9.35 : 3.4;   // (the player's apron is kept clear: his crew runs across it)
          if (!mine) { cabinet(g, s0, 1.6, base + 7.6, 1.15, 0.95, 0.62, CAB[h]);
            kbox(g, s0, 7.6, base + 7.5, 0.06, 1.75, 0.12, 0.9, [0.2, 0.2, 0.22]);                                                   // tyre trolley ...
            for (const ta of [7.18, 8.02]) blankets(g, s0, ta, base + 7.5, 0.18, 2, 0.5, cmp); }                                  // ... with a set of four in blankets
          kbox(g, s0, mc, base + 8.25, 0, 0.62, 0.95, 0.5, [0.22, 0.23, 0.26], [0.12, 0.12, 0.13]); kbox(g, s0, mc, base + 8.3, 0.95, 0.06, 0.38, 0.06, [0.15, 0.15, 0.16], null, true);   // monitor cart ...
          kbox(g, s0, mc, base + 8.28, 1.33, 1.2, 0.4, 0.05, [0.07, 0.07, 0.08]); for (const ma of [-0.3, 0.3]) kface(g, s0, mc + ma - 0.26, mc + ma + 0.26, base + 8.25, 1.37, 1.7, SCR);   // ... two screens toward the lane
          kbox(g, s0, 0.75, base + 8.75, 0, 0.3, 1.1, 0.3, [0.3, 0.31, 0.34], null, true); kcyl(g, s0, 0.75, base + 8.75, 1.1, 0.3, 0.22, 10, [0.8, 0.15, 0.12], [0.85, 0.2, 0.16]);   // air-line reel on a post
          for (const [a0, w0, a1, w1] of [[0.75, base + 8.5, 1.4, base + 6.2], [1.4, base + 6.2, 2.6, base + 5.4]]) {   // and its hose on the concrete
            const [x0, z0] = atSf(s0 + a0, w0), [x1, z1] = atSf(s0 + a1, w1); box(g, (x0 + x1) / 2, 0.022, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0), 0.035, 0.035, Math.atan2(z1 - z0, x1 - x0), [0.1, 0.1, 0.11], null, true); }
          // the stand in the grass strip behind the rail: a desk with screens toward the stools, a roof
          kbox(g, s0, 5, wv + 0.72, 0.96, 2.5, 0.06, 1.0, [0.3, 0.31, 0.34], [0.36, 0.37, 0.4]);
          for (const la of [-1.18, 1.18]) for (const lw of [0.28, 1.16]) kbox(g, s0, 5 + la, wv + lw, 0, 0.07, 0.96, 0.07, [0.22, 0.22, 0.24], null, true);
          kbox(g, s0, 5, wv + 0.34, 1.02, 2.1, 0.4, 0.05, [0.07, 0.07, 0.08]); for (const ma of [-0.7, 0, 0.7]) kface(g, s0, 5 + ma - 0.3, 5 + ma + 0.3, wv + 0.368, 1.05, 1.39, SCR, 1);
          for (const pa of [-1.2, 1.2]) kbox(g, s0, 5 + pa, wv + 0.2, 0, 0.08, 2.5, 0.08, [0.25, 0.26, 0.28], null, true);
          kbox(g, s0, 5, wv + 0.8, 2.5, 2.7, 0.07, 1.55, [0.22, 0.23, 0.26], [0.3, 0.31, 0.35]);
          for (const sa of [-0.62, 0.62]) kcyl(g, s0, 5 + sa, wv + 1.5, 0, 0.17, 0.48, 7, [0.14, 0.14, 0.16], [0.2, 0.2, 0.22]); };   // stools (the engineers are the renderer's)
        const forestGarages = () => {   // one garage per box, open at the front: floor, cabinets, tyre sets and a screen inside, strip lights, a coloured band over the door
          const WH = [0.9, 0.89, 0.87], WT = [0.74, 0.74, 0.76];
          for (let q = -152; q < 50; q += 10) { const s0 = T.startS + q, pc = T.pitAt(s0 + 5); if (!pc || pc.t < 0.999) continue;
            const k = ((q + 152) / 10) | 0, o = pc.o + 3.5 + 9 + 3.6, ik = T.idx(s0 + 1), g = scen.get(T.px[ik] + T.nx[ik] * o, T.pz[ik] + T.nz[ik] * o), f0 = o - 3.6, b0 = o + 3.6;   // (the chunks the old garages were in)
            kbox(g, s0, 5, o, 4.0, 10.02, 0.4, 7.2, WH, WT);                                                   // roof
            kbox(g, s0, 5, b0 - 0.15, 0, 10.02, 4.0, 0.3, WH, null, true);                                     // back wall
            for (const sd of [-1, 1]) { kbox(g, s0, 5 + sd * 4.885, o, 0, 0.25, 4.0, 7.2, WH, null, true); kbox(g, s0, 5 + sd * 4.56, f0 + 0.15, 0, 0.9, 3.3, 0.3, WH, null, true); }   // side walls, front pillars
            kbox(g, s0, 5, f0 + 0.15, 3.3, 10.02, 0.7, 0.3, WH);                                               // header over the door
            kbox(g, s0, 5, f0 - 0.02, 3.45, 9.4, 0.5, 0.05, TEAM[k % TEAM.length]);                           // coloured band
            kbox(g, s0, 5, o, 0, 9.52, 0.03, 6.9, [0.44, 0.46, 0.49], [0.52, 0.54, 0.57], true);              // epoxy floor
            kface(g, s0, 0.25, 9.75, b0 - 0.302, 0.03, 1.28, [0.3, 0.31, 0.35]);                               // darker panel on the back wall
            kbox(g, s0, 5, b0 - 0.33, 1.7, 1.5, 0.85, 0.04, [0.07, 0.07, 0.08], null, true); kface(g, s0, 4.31, 5.69, b0 - 0.352, 1.75, 2.5, SCR);   // timing screen
            for (const ca of [1.3, 2.5, 7.5, 8.7]) cabinet(g, s0, ca, b0 - 0.64, 1.15, 1.0, 0.6, [0.2, 0.21, 0.24]);
            for (const ta of [0.85, 9.15]) blankets(g, s0, ta, o - 0.6, 0.03, 3, 0.46, CMP[(k + (ta > 5 ? 1 : 0)) % 3]);
            for (const la of [-1.9, 1.9]) kbox(g, s0, 5 + la, o, 3.92, 0.28, 0.07, 5.8, [0.98, 0.98, 0.94]); } };
        let box0 = 0;
        for (let q = -152, k = 0; q <= 44; q += 10, k++) { const i = T.idx(T.startS + q), p = foPit(i); if (!p || p.t < 0.999) continue;
          const tx = T.tx[i], tz = T.tz[i], base = p.o + 3.5, hd = T.hd[i];
          { const L0 = atSf(T.startS + q - 0.09, base), L1 = atSf(T.startS + q + 0.09, base), L2 = atSf(T.startS + q + 0.09, base + 9), L3 = atSf(T.startS + q - 0.09, base + 9);   // box divider line
            gp.quadUp([L0[0], 0.034, L0[1]], [L1[0], 0.034, L1[1]], [L2[0], 0.034, L2[1]], [L3[0], 0.034, L3[1]], [wl, wl, wl, wl]); }
          if (box0++ >= 13) continue;                                                                   // a crew for each of the 13 cars
          const tc = TEAM[k % TEAM.length], cx = T.px[i] + T.nx[i] * (base + 4.2) + tx * 5, cz = T.pz[i] + T.nz[i] * (base + 4.2) + tz * 5;
          const mine = fdp[3] != null && Math.abs(q + 5 - fdp[3]) < 1;                                 // the player's box: its crew is animated by the renderer
          if (mine) { const sb = T.startS + q + 5, yc = [0.98, 0.82, 0.12];
            out.pitBox = { s: sb, x: cx, z: cz, hd, tx, tz, nx: T.nx[i], nz: T.nz[i], lane: p.o, wallO: p.wall, apron0: base, garage0: base + 9, stop: atSf(sb, p.o) };
            for (const [d0, d1, l0, l1] of [[-3.2, 3.2, p.o - 2.6, p.o - 2.35], [-3.2, 3.2, p.o + 2.35, p.o + 2.6], [-3.2, -2.95, p.o - 2.6, p.o + 2.6], [2.95, 3.2, p.o - 2.6, p.o + 2.6]]) {   // yellow stop box on the lane
              const A = atSf(sb + d0, l0), Bq = atSf(sb + d1, l0), Cq = atSf(sb + d1, l1), D = atSf(sb + d0, l1);
              gp.quadUp([A[0], 0.036, A[1]], [Bq[0], 0.036, Bq[1]], [Cq[0], 0.036, Cq[1]], [D[0], 0.036, D[1]], [yc, yc, yc, yc]); } }
          for (let r = 0; r < 2; r++) for (let m = 0; m < 4; m++) { if (R() < 0.12 || mine) continue; R(); R(); }   // (the draws of the old static crews stay, so the scenery after them is unchanged; the crews are the renderer's now)
          forestPitKit(scen.get(cx, cz), T.startS + q, k, base, p.wall, mine);
          const oc = atSf(T.startS + q + 5, 0);   // for the renderer's crews: the box centre on the centre line, the box frame
          (out.pitBoxes = out.pitBoxes || []).push({ k, s: T.startS + q + 5, ox: oc[0], oz: oc[1], tx, tz, nx: T.nx[i], nz: T.nz[i], hd, base, lane: p.o, wall: p.wall, team: tc, mine }); }
        forestGarages();
        { const pbs = out.pitBoxes; T.pitStands = null;   // the stands on the grass strip (2.7 m roofs over the box centres, forestPitKit): Core keeps the player's car off it
          if (pbs && pbs.length) { const L = T.len, dS = (s) => { let d = s - T.startS; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };
            T.pitStands = [dS(pbs[0].s) - 1.35, dS(pbs[pbs.length - 1].s) + 1.35];
            const kt = [0.86, 0.86, 0.83], kf = [0.66, 0.67, 0.64];   // and a low concrete kerb along that limit (pitAt().inner: the lane's edge, eased in from the rail)
            for (let q = T.pitStands[0] - 28; q < T.pitStands[1] + 28; q += 2) {
              const i = T.idx(T.startS + q), j = T.idx(T.startS + q + 2), pi = foPit(i), pj = foPit(j); if (!pi || !pj || pi.gap || pj.gap) continue;
              const ai = pi.inner, aj = pj.inner; if (ai - pi.wall < 0.15 && aj - pj.wall < 0.15) continue;
              gp.quadUp(at(i, ai - 0.15, 0.1), at(i, ai, 0.1), at(j, aj, 0.1), at(j, aj - 0.15, 0.1), [kt, kt, kt, kt]);
              gp.quadO(at(i, ai, 0.02), at(j, aj, 0.02), at(j, aj, 0.1), at(i, ai, 0.1), kf, at(i, ai - 1, 0.05));
              gp.quadO(at(j, aj - 0.15, 0), at(i, ai - 0.15, 0), at(i, ai - 0.15, 0.1), at(j, aj - 0.15, 0.1), kf, at(i, ai + 1, 0.05)); } } }
        for (const [q0, dq] of [[fdp[1] + 30, 4], [fdp[2] - 26, -4]]) for (let k = 0; k < 3; k++) {   // knockable cones on the noses where the pit lane leaves and rejoins
          const i = T.idx(T.startS + q0 + k * dq), p = foPit(i); if (!p) continue; const o = (T.br[i] + 0.9 + p.o - 3.5) / 2; if (o < T.br[i] + 0.5 || o > p.o - 4) continue;
          const [x, z] = atS(T.startS + q0 + k * dq, o); prop('cone', x, z, R() * TAU); }
        { const sE = T.startS + fdp[1] + 20, pE = T.pitAt(sE);   // the sign at the pit entry: BOKSI with an arrow, and the 80 km/h limit
          if (pE) { const [x, z] = atSf(sE, pE.lout + 3.4), i = T.idx(sE), g = scen.get(x, z);
            const c2 = document.createElement('canvas'); c2.width = 256; c2.height = 160; const x2 = c2.getContext('2d');
            x2.fillStyle = '#1f3f8c'; x2.fillRect(0, 0, 256, 160); x2.strokeStyle = '#f4f1ec'; x2.lineWidth = 7; x2.strokeRect(5, 5, 246, 150);
            x2.fillStyle = '#f4f1ec'; x2.font = '900 50px "Russo One", "Arial Black", Arial, sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText('BOKSI', 96, 52);
            x2.beginPath(); x2.moveTo(186, 30); x2.lineTo(232, 52); x2.lineTo(186, 74); x2.lineTo(186, 62); x2.lineTo(166, 62); x2.lineTo(166, 42); x2.lineTo(186, 42); x2.closePath(); x2.fill();
            x2.fillStyle = '#f4f1ec'; x2.beginPath(); x2.arc(128, 116, 34, 0, Math.PI * 2); x2.fill(); x2.strokeStyle = '#c8261f'; x2.lineWidth = 9; x2.beginPath(); x2.arc(128, 116, 29, 0, Math.PI * 2); x2.stroke();
            x2.fillStyle = '#16171a'; x2.font = '900 32px "Russo One", "Arial Black", Arial, sans-serif'; x2.fillText('80', 128, 118);
            let fx = -T.tx[i] - T.nx[i] * 0.45, fz = -T.tz[i] - T.nz[i] * 0.45; const fl = Math.hypot(fx, fz); fx /= fl; fz /= fl;
            const bm = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshLambertMaterial({ map: ownTex(new THREE.CanvasTexture(c2)) }));
            bm.position.set(x + fx * 0.14, 3.1, z + fz * 0.14); bm.rotation.set(-0.12, Math.atan2(fx, fz), 0, 'YXZ'); bm.castShadow = true; root.add(bm);
            box(g, x, 1.8, z, 4.4, 2.8, 0.2, Math.atan2(-fx, fz), [0.86, 0.85, 0.82], [0.86, 0.85, 0.82]);
            for (const q2 of [-1.6, 1.6]) box(g, x + fz * q2, 0, z - fx * q2, 0.22, 2.0, 0.22, 0, [0.62, 0.63, 0.66]);
            excl.push({ x, z, r: 3.5 }); } }
        const ml = new THREE.Mesh(gl.geometry(), out.asphaltMat); ml.receiveShadow = true; ml.matrixAutoUpdate = false; root.add(ml);
        const mpit = new THREE.Mesh(gp.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); mpit.receiveShadow = true; mpit.matrixAutoUpdate = false; root.add(mpit);
      }
      // ---- taller rock masses: a second layer of boulders on the bigger formations ----
      for (const [rx, rz, rr] of fd.rocks) { if (rr < 14) continue; for (let k = 0; k < 3; k++) { const a = R() * TAU, d = R() * rr * 0.4, x = rx + Math.cos(a) * d, z = rz + Math.sin(a) * d, r = 3.5 + R() * rr * 0.25;
        if (clearance(x, z) > r + 4) { const g = scen.get(x, z), y0 = gH(x, z); rock(g, x, y0 + r * 1.1, z, r * 1.1, r * 0.8, r, R() * TAU, vary([0.58, 0.64, 0.54], R, 0.05), R, 0.2); } } }
      // ---- stone drainage channels curving through the grass inside the bigger corners ----
      { const gd = new GB();
        for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, inner = c.dir, span = (i1c - c.i0) * T.ds;
          for (let q = -span * 0.1; q < span * 1.1; q += 1.5) { const i = T.idx(c.i0 * T.ds + q), j = T.idx(c.i0 * T.ds + q + 1.5), bar = inner > 0 ? T.br : T.bl, o = inner * (bar[i] + 4.5), oj = inner * (bar[j] + 4.5);
            const a = [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o], b = [T.px[j] + T.nx[j] * oj, T.pz[j] + T.nz[j] * oj];
            if (clearance(a[0], a[1]) < 2 || excluded(a[0], a[1])) continue;
            const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, px2 = -dz / l * 0.55, pz2 = dx / l * 0.55, gc = vary([0.5, 0.54, 0.56], R, 0.05), dc = [0.27, 0.3, 0.36];   // grey stone channel, dark water line
            gd.quadUp([a[0] - px2 * 1.6, 0.02, a[1] - pz2 * 1.6], [b[0] - px2 * 1.6, 0.02, b[1] - pz2 * 1.6], [b[0] + px2 * 1.6, 0.02, b[1] + pz2 * 1.6], [a[0] + px2 * 1.6, 0.02, a[1] + pz2 * 1.6], [gc, gc, gc, gc]);
            gd.quadUp([a[0] - px2 * 0.6, 0.025, a[1] - pz2 * 0.6], [b[0] - px2 * 0.6, 0.025, b[1] - pz2 * 0.6], [b[0] + px2 * 0.6, 0.025, b[1] + pz2 * 0.6], [a[0] + px2 * 0.6, 0.025, a[1] + pz2 * 0.6], [dc, dc, dc, dc]); } }
        const m = new THREE.Mesh(gd.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
      // ---- mowing stripes on the lawns beside the circuit ----
      { const gm = new GB(), dk = [0.86, 0.86, 0.86];
        for (const side of [-1, 1]) for (let q = 0; q < T.len; q += 2) { const i = T.idx(q), j = T.idx(q + 2), bar = side > 0 ? T.br : T.bl;
          for (let band = 0; band < 4; band++) { const o1 = bar[i] + 2 + band * 6, o2 = o1 + 3, P = (k, o) => [T.px[k] + T.nx[k] * o * side, 0.008, T.pz[k] + T.nz[k] * o * side];
            const a = P(i, o1), b = P(j, o1), c = P(j, o2), d = P(i, o2); if (clearance(a[0], a[2]) < 1 || clearance(c[0], c[2]) < 1 || excluded(a[0], a[2]) || excluded(c[0], c[2]) || gH(a[0], a[2]) > 0.2) continue;
            gm.quadUp(a, b, c, d, [dk, dk, dk, dk], [[a[0] / 14, -a[2] / 14], [b[0] / 14, -b[2] / 14], [c[0] / 14, -c[2] / 14], [d[0] / 14, -d[2] / 14]]); } }
        const m = new THREE.Mesh(gm.geometry(), new THREE.MeshLambertMaterial({ map: tex.grass, vertexColors: true, color: new THREE.Color(0.77, 0.81, 1.41) })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }   // darker bands of the same sea-green as the lawn
      // ---- wooden posts with a sagging rope curving through the infield of the big corners (as in the reference) ----
      for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, inner = c.dir, s0c = c.i0 * T.ds, span = (i1c - c.i0) * T.ds; let prev = null;
        for (let q = -4; q <= span + 4; q += 3.2) { const i = T.idx(s0c + q), bar = inner > 0 ? T.br[i] : T.bl[i], o = inner * (bar + 2.4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          if (clearance(x, z) < 1 || excluded(x, z)) { prev = null; continue; } const g = scen.get(x, z), wc = [0.46, 0.3, 0.19], rc = [0.66, 0.54, 0.38];
          box(g, x, 0, z, 0.18, 1.1, 0.18, T.hd[i], wc, [0.52, 0.35, 0.22]);
          if (prev) { const Y = (t) => 0.95 - 0.28 * 4 * t * (1 - t), pts3 = [0, 1 / 3, 2 / 3, 1].map(t => [prev[0] + (x - prev[0]) * t, Y(t), prev[1] + (z - prev[1]) * t]);
            for (let k = 0; k < 3; k++) { const a1 = pts3[k], b1 = pts3[k + 1]; g.quadO(a1, b1, [b1[0], b1[1] + 0.07, b1[2]], [a1[0], a1[1] + 0.07, a1[2]], rc, [T.px[i], 0.5, T.pz[i]]); g.quadO(b1, a1, [a1[0], a1[1] + 0.07, a1[2]], [b1[0], b1[1] + 0.07, b1[2]], rc, [2 * x - T.px[i], 0.5, 2 * z - T.pz[i]]); } }
          prev = [x, z]; } }
      // ---- right leg (as in the reference): a long red/white kerb along the outside edge from the V hairpin up to the S ----
      { const gk = new GB(true), cw = T.curbW, wc = [1, 1, 1], P = (k, o, y) => [T.px[k] + T.nx[k] * o, y, T.pz[k] + T.nz[k] * o], sa = sAt(270, 274), sb = sAt(328, 150);
        for (let q = sa; q < sb; q += 2) { const i = T.idx(q), j = T.idx(q + 2); if (T.curb[i]) continue;
          const v0 = (q - sa) / 9, v1 = (q - sa + 2) / 9; gk.quadUp(P(i, w, 0.045), P(i, w + cw, 0.085), P(j, w + cw, 0.085), P(j, w, 0.045), [wc, wc, wc, wc], [[0, v0], [1, v0], [1, v1], [0, v1]]); }
        const km = new THREE.Mesh(gk.geometry(), new THREE.MeshLambertMaterial({ map: tex.curbRWB, vertexColors: true })); km.receiveShadow = true; km.matrixAutoUpdate = false; root.add(km); }   // red / white / blue
      // ---- white edge lines along the asphalt wherever there is no kerb ----
      { const gl = new GB(), wc = [0.93, 0.92, 0.94];
        for (const side of [-1, 1]) for (let q = 0; q < T.len - 1; q += 2) { const i = T.idx(q), j = T.idx(q + 2); if (T.curb[i] && T.curb[j]) continue;   // a solid line right at the edge of the asphalt, as in the reference
          const P = (k, o) => [T.px[k] + T.nx[k] * o * side, 0.036, T.pz[k] + T.nz[k] * o * side];
          gl.quadUp(P(i, w - 0.34), P(j, w - 0.34), P(j, w - 0.12), P(i, w - 0.12), [wc, wc, wc, wc]); }
        const m = new THREE.Mesh(gl.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
      // ---- short walls of red/white tyres on the inside of the apex of the big corners ----
      for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, inner = c.dir, sm = ((c.i0 + i1c) / 2) * T.ds;
        for (let k = -4; k <= 4; k++) { const i = T.idx(sm + k * 0.99), bar = inner > 0 ? T.br[i] : T.bl[i], o = inner * Math.min(bar - 0.55, w + 3.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          if (clearance(x, z) < -bar + w + 2) continue;
          prop('tstack', x, z, T.hd[i] + k * 0.7, ((k + 6) >> 1) % 2 ? 1 : 0); }   // knockable spare-tyre stacks, red and white in pairs
        if (c.sev === 2) { const i = T.idx(sm + 6), [x, z] = atS(i * T.ds, inner * (w + T.curbW + 1.4)); if (clearance(x, z) < -1.2) prop('crate', x, z, R() * TAU); } }   // a wooden crate by the apex
      // ---- cliffs: big stacked boulders with firs on top at the formations right beside the circuit ----
      for (const [rx, rz, rr] of fd.rocks) { if (rr > 12) continue;
        for (let k = 0; k < 5; k++) { const a = R() * TAU, d = R() * rr * 0.5, x = rx + Math.cos(a) * d, z = rz + Math.sin(a) * d, r = 3 + R() * 3.5;
          if (clearance(x, z) < r + 3) continue; const g = scen.get(x, z), y0 = gH(x, z); rock(g, x, y0 + r * 0.8 + (k > 2 ? r * 0.9 : 0), z, r * 1.1, r * (1.0 + R() * 0.3), r, R() * TAU, vary([0.58, 0.64, 0.54], R, 0.05), R, 0.2); }
        for (let k = 0; k < 2; k++) { const a = R() * TAU, x = rx + Math.cos(a) * rr * 0.3, z = rz + Math.sin(a) * rr * 0.3; if (clearance(x, z) > 7) fir(x, z, 7 + R() * 5); } }
      // ---- red/white striped marker pylons on the apex of the hairpins ----
      for (const c of T.corners) { if (c.sev < 3) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, i = T.idx(((c.i0 + i1c) / 2) * T.ds), o = c.dir * (w + T.curbW + 0.55), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        prop('pylon', x, z, 0); }   // knockable
      // ---- little ferns and star-shaped plants dotted over the grass near the circuit ----
      { const fern = (g, x, z, sz) => { const y = gH(x, z) + 0.02, n = 5, a0 = R() * TAU, col = vary([0.27, 0.47, 0.25], R, 0.1);
          for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU, ex = x + Math.cos(a) * sz, ez = z + Math.sin(a) * sz, px2 = -Math.sin(a) * sz * 0.28, pz2 = Math.cos(a) * sz * 0.28;
            g.triO([x + px2, y, z + pz2], [ex, y + sz * 0.45, ez], [x - px2, y, z - pz2], col, [x, y - 1, z]); } };
        for (let k = 0; k < 420; k++) { const i = Math.floor(R() * N), side = R() < 0.5 ? -1 : 1, bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 1.5 + R() * 16), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          if (clearance(x, z) < 1 || excluded(x, z)) continue; fern(scen.get(x, z), x, z, 0.5 + R() * 0.5); } }
      // ---- spectators (muted clothes, as in the reference): on the raised lawn above the V hairpin (inside its rope fence), round the hairpins,
      //      through the S bends; behind tyre walls the front row stands behind the catch fence ----
      { const M = { shirts: SHIRTS, sit: 0.2 };
        if (PL) { const plEx = (x, z) => { if (!inPoly(PL.pts, x, z)) return true; const d = polyDist(PL.pts, x, z); return d < 2.2 || (d >= 3.2 && excluded(x, z)); };   // (the edge rule in exclF keeps generic scenery 3.2 m off the edge)
          const po = fd.plateau.off; crRun(fd.plateau.s0 + 4, fd.plateau.s1 - 4, -1, Object.assign({}, M, { first: po + 2.3, rows: 3, gap: 1.0, dens: 0.62, gH: (x, z) => PL.h, excluded: plEx, above: 4, maxSlope: 9, label: 'plateau' }));
          crRun(100, 168, -1, Object.assign({}, M, { first: po + 5.3, rows: 2, gap: 1.0, dens: 0.6, gH: (x, z) => PL.h, excluded: plEx, above: 4, maxSlope: 9, label: 'plateau V' })); }
        for (const [a, b2, sd, rw, dn] of [[460, 610, 1, 3, 0.7], [470, 600, -1, 2, 0.55], [756, 850, -1, 3, 0.75], [764, 846, 1, 2, 0.6], [1026, 1114, 1, 3, 0.7], [1030, 1110, -1, 2, 0.6],
          [1224, 1296, 1, 3, 0.72], [1228, 1292, -1, 2, 0.6], [612, 750, -1, 2, 0.5], [612, 750, 1, 2, 0.5], [362, 420, 1, 2, 0.5], [362, 420, -1, 2, 0.5], [1300, 1352, -1, 2, 0.55], [1300, 1352, 1, 2, 0.5], [900, 1000, -1, 2, 0.4]])
          crRun(a, b2, sd, Object.assign({ rows: rw, dens: dn, label: 'FO ' + a + (sd > 0 ? 'R' : 'L') }, M)); }
      // ---- the fir forest: dense everywhere except a mown verge along the circuit ----
      const step = 5.2 / Math.sqrt(dens);
      for (let z = B.minZ - 60; z < B.maxZ + 60; z += step) for (let x = B.minX - 60; x < B.maxX + 60; x += step) {
        const px = x + (R() - 0.5) * step * 0.9, pz = z + (R() - 0.5) * step * 0.9, c = clearance(px, pz);
        const fN = forestN(px, pz), lawn = 5 + 11 * (1 - sstep(0.35, 0.6, fN));   // the firs come close to the fences in places, as in the reference
        if (c < lawn || excluded(px, pz)) continue;
        let p = 0.45 + 0.5 * sstep(0.35, 0.6, fN); if (c > 30) p = Math.max(p, 0.85); if (c < lawn + 6) p *= 0.6;
        if (R() > p) continue;
        if (R() < 0.08 && c < 30) { const g = scen.get(px, pz); ico(g, px, gH(px, pz) + 2.2, pz, 2.2 + R(), 0.9, vary([0.24, 0.46, 0.2], R, 0.15), R, 0.3); }   // occasional round bush/tree
        else fir(px, pz, 10 + R() * 9);
      }
      out.firCount = firCount + ' far ' + firFar;
      // low bushes on the verges
      for (let k = 0; k < 160; k++) { const i = Math.floor(R() * N), side = R() < 0.5 ? -1 : 1, bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 2 + R() * 4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        if (clearance(x, z) > 1.5 && !excluded(x, z)) ico(scen.get(x, z), x, gH(x, z) + 0.5, z, 0.7 + R() * 0.6, 0.75, vary([0.2, 0.42, 0.2], R, 0.15), R, 0.3); }
    }

    /* ================= KNOCKABLE PROPS on the other circuits: marker pylons, cones, spare tyres, straw bales ================= */
    if (THEME === 'lake' || THEME === 'city' || THEME === 'mountain') {
      const prop = (kind, x, z, yaw, col) => out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0 });
      const cw = T.curbW || 1.5;
      for (const c of T.corners) { if (c.sev < 2) continue;
        const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, inner = c.dir, sm = ((c.i0 + i1c) / 2) * T.ds, im = T.idx(sm), barIn = inner > 0 ? T.br[im] : T.bl[im], barOut = inner > 0 ? T.bl[im] : T.br[im];
        if (THEME === 'mountain') {   // rally stage: two straw-bale stacks on the inside of the apex, a cone at either end
          for (const ds of [-2.4, 2.4]) { const [x, z, hd] = atSf(sm + ds, inner * Math.min(barIn - 1.2, w + 1.9)); prop('bstack', x, z, hd); }
          for (const ds of [-9, 9]) { const [x, z, hd] = atSf(sm + ds, inner * Math.min(barIn - 0.6, w + 0.8)); prop('cone', x, z, hd); }
          continue; }
        if (barIn > w + cw + 1.7) { const [x, z] = atSf(sm, inner * (w + cw + 1.05)); prop('pylon', x, z, 0); }   // striped marker post just behind the kerb at the apex
        if (c.sev >= 3) { let za = null, zb = null;                                                              // cones on the asphalt through the hairpin apex, off the racing line
          for (let k = c.i0 - 4; k <= i1c + 4; k++) { const ii = ((k % N) + N) % N; if (T.rl[ii] * inner >= w - 2.8) { if (za == null) za = k; zb = k; } }
          if (za != null && zb > za) { const s0 = za * T.ds, s1 = zb * T.ds, n = clamp(Math.floor((s1 - s0) / 4) + 1, 2, 4), st = (s1 - s0) / (n - 1);
            for (let q = 0; q < n; q++) { const [x, z, hd] = atSf(s0 + q * st, inner * (w - 1.4)); prop('cone', x, z, hd); } } }
        if (barOut > w + cw + 3) for (let k = 0; k < 4; k++) { const [x, z, hd] = atSf(sm + 10 + k * 1.0, -inner * (barOut - 0.6)); prop('tstack', x, z, hd + k * 0.6, (k >> 1) % 2); }   // spare tyres in front of the outer barrier
      }
    }
    trackPropsGeneric(out, excluded, MC_ISLAND, decks, slabs);   // + safety-tyre walls and roadside posts on every circuit (see roadsideProps)
    // solid scenery built inside a barrier line (box footprint lx by lz at x, z, rot): the knocked props stop at its face, not in it
    // (out.propFloor.inset[i * 2 + side (0 left, 1 right)]: how far in from the barrier, per sample; Core propStep)
    const propSolid = (x, z, lx, lz, rot) => { const F = out.propFloor; if (!F) return;
      const I = F.inset || (F.inset = new Float32Array(T.N * 2)), c = Math.cos(rot), sn = Math.sin(rot), nu = Math.ceil(lx / 0.25), nv = Math.ceil(lz / 0.25), q = {};
      T.query(x, z, -1, q); const h = q.i; if (Math.abs(q.d) - Math.hypot(lx, lz) / 2 > Math.max(q.bl, q.br)) return;   // (nowhere near the barrier)
      for (let a = 0; a <= nu; a++) for (let b = 0; b <= nv; b++) { const u = (a / nu - 0.5) * lx, v = (b / nv - 0.5) * lz;
        T.query(x + u * c - v * sn, z + u * sn + v * c, h, q); const d = Math.abs(q.d), bar = q.d > 0 ? q.br : q.bl, k = q.i * 2 + (q.d > 0 ? 1 : 0);
        if (d > T.w && d < bar) I[k] = Math.max(I[k], bar - d); } };

    /* ================= MONACO (real circuit layout; origin Sainte-Dévote, x east, z south) ================= */
    if (THEME === 'monaco') {
      const gH = groundH, fac = new GB(true), facB = new GB(true), tun = new GB();
      const sF = (f) => ((T.startS + f * T.len) % T.len + T.len) % T.len;   // track distance at a lap fraction measured from the start line
      const cream = [0.95, 0.9, 0.78], white = [0.96, 0.95, 0.92], copper = [0.42, 0.66, 0.56], tile = [0.72, 0.36, 0.22], red = [0.81, 0.07, 0.15];
      const facadeBox = (x, z, W, D, H, rot, col, y0in, bal) => {   // walls with the window/shutter (or balcony) texture; returns base height
        const cr = Math.cos(rot), sr = Math.sin(rot), P = (u, v, y) => [x + u * cr - v * sr, y, z + u * sr + v * cr];
        const cs = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]], floors = Math.max(1, Math.round(H / 3.1)), y0 = y0in != null ? y0in : gH(x, z) - 0.3;
        for (let e = 0; e < 4; e++) { const [u0, v0] = cs[e], [u1, v1] = cs[(e + 1) % 4], bays = Math.max(2, Math.round(Math.hypot(u1 - u0, v1 - v0) / 3.3)); (bal ? facB : fac).quadO(P(u0, v0, y0), P(u1, v1, y0), P(u1, v1, y0 + H), P(u0, v0, y0 + H), col, [x, y0 + H / 2, z], [[0, 0], [bays, 0], [bays, floors], [0, floors]]); }
        return y0;
      };
      const tri2 = (g, a, b, c, col) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1, m = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]; g.triO(a, b, c, col, [m[0] - nx / l, m[1] - ny / l, m[2] - nz / l]); g.triO(a, c, b, col, [m[0] + nx / l, m[1] + ny / l, m[2] + nz / l]); };
      const palm = (x, z, h) => { const g = scen.get(x, z), y = gH(x, z), la = R() * TAU, tx = x + Math.cos(la) * 0.6, tz = z + Math.sin(la) * 0.6;
        cyl(g, x, y, z, 0.3, h * 0.6, 6, [0.52, 0.4, 0.26], null, 0.26); cyl(g, (x + tx) / 2, y + h * 0.6, (z + tz) / 2, 0.26, h * 0.4, 6, [0.56, 0.44, 0.28], null, 0.2);
        const top = [tx, y + h, tz], below = [tx, y + h - 4, tz], n = 9, a0 = R() * TAU;
        for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU, L = 3.4 + R(), dr = 1.2 + R() * 0.8, w = 0.5, mid = [tx + Math.cos(a) * L * 0.55, y + h + 0.3, tz + Math.sin(a) * L * 0.55], tip = [tx + Math.cos(a) * L, y + h - dr, tz + Math.sin(a) * L];
          const pl = [mid[0] - Math.sin(a) * w, mid[1], mid[2] + Math.cos(a) * w], pr = [mid[0] + Math.sin(a) * w, mid[1], mid[2] - Math.cos(a) * w], col = k % 2 ? [0.25, 0.5, 0.2] : [0.33, 0.6, 0.24];
          g.triO(top, pl, mid, col, below); g.triO(top, mid, pr, col, below); g.triO(pl, tip, mid, col, below); g.triO(mid, tip, pr, col, below); }
        excl.push({ x, z, r: 3 }); };
      const flag = (x, z, h) => { const g = scen.get(x, z), y = gH(x, z); cyl(g, x, y, z, 0.07, h, 5, [0.85, 0.85, 0.88]);
        tri2(g, [x, y + h - 0.2, z], [x + 2.2, y + h - 0.2, z + 0.3], [x + 2.2, y + h - 0.9, z + 0.3], red); tri2(g, [x, y + h - 0.2, z], [x + 2.2, y + h - 0.9, z + 0.3], [x, y + h - 0.9, z], red);
        tri2(g, [x, y + h - 0.9, z], [x + 2.2, y + h - 0.9, z + 0.3], [x + 2.2, y + h - 1.6, z + 0.3], white); tri2(g, [x, y + h - 0.9, z], [x + 2.2, y + h - 1.6, z + 0.3], [x, y + h - 1.6, z], white); };
      const stand = (ax, az, bx, bz, rows, roofCol, open) => {   // temporary grandstand facing the circuit, tiers climb away from it (open = no roof, as along the harbour)
        const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, mx = (ax + bx) / 2, mz = (az + bz) / 2;
        let nx = -uz, nz = ux; const q = nearest(mx, mz); if (q.i >= 0 && (T.px[q.i] - mx) * nx + (T.pz[q.i] - mz) * nz > 0) { nx = -nx; nz = -nz; }   // n points away from the track
        const g = scen.get(mx, mz), y0 = gH(mx, mz) - 0.2, rot = Math.atan2(uz, ux);
        for (let r2 = 0; r2 < rows; r2++) { const o = 1.2 + r2 * 1.1, cx = mx + nx * o, cz = mz + nz * o, yy = y0 + r2 * 0.55;
          box(g, cx, y0, cz, L, (r2 + 1) * 0.55, 1.1, rot, [0.62, 0.63, 0.66], [0.72, 0.73, 0.75]);
          const A = [ax + nx * (o - 0.5), yy + 0.56, az + nz * (o - 0.5)], Bp = [bx + nx * (o - 0.5), yy + 0.56, bz + nz * (o - 0.5)], C = [bx + nx * (o + 0.45), yy + 1.2, bz + nz * (o + 0.45)], D = [ax + nx * (o + 0.45), yy + 1.2, az + nz * (o + 0.45)];
          texCrowd.quadO(A, Bp, C, D, [1, 1, 1], [mx + nx * (o + 3), yy - 2, mz + nz * (o + 3)], [[0, r2 * 0.25], [L / 6, r2 * 0.25], [L / 6, r2 * 0.25 + 0.25], [0, r2 * 0.25 + 0.25]]); }
        const back = 1.2 + rows * 1.1, cx = mx + nx * back, cz = mz + nz * back;
        box(g, cx, y0, cz, L, rows * 0.55 + (open ? 1.3 : 3.2), 0.4, rot, [0.5, 0.52, 0.56]);
        if (!open) box(g, mx + nx * (back - rows * 0.55), y0 + rows * 0.55 + 3.0, mz + nz * (back - rows * 0.55), L + 1, 0.25, rows * 1.1 + 1.6, rot, roofCol || white, roofCol || white);
        { const nb = Math.max(1, Math.round(L / 9)), flip = ((bx - ax) * -nz + (bz - az) * nx) < 0;   // sponsor boards on the stand's front, readable from the track
          for (let q = 0; q < nb; q++) { const t0 = q / nb, t1 = (q + 1) / nb, slot = (q + Math.floor(Math.abs(mx) + Math.abs(mz))) % 8, u0 = (slot % 2) * 0.5, u1 = u0 + 0.5, vT = 1 - Math.floor(slot / 2) * 0.25, vB = vT - 0.25;
            const A = [ax + (bx - ax) * t0 + nx * 0.9, y0 + 0.2, az + (bz - az) * t0 + nz * 0.9], Bq = [ax + (bx - ax) * t1 + nx * 0.9, y0 + 0.2, az + (bz - az) * t1 + nz * 0.9];
            texSpons.quadO(A, Bq, [Bq[0], y0 + 1.2, Bq[2]], [A[0], y0 + 1.2, A[2]], [1, 1, 1], [mx + nx * 4, y0 + 0.6, mz + nz * 4], flip ? [[u1, vB], [u0, vB], [u0, vT], [u1, vT]] : [[u0, vB], [u1, vB], [u1, vT], [u0, vT]]); } }
        exclRect.push({ x: mx + nx * back / 2, z: mz + nz * back / 2, hx: L / 2 + 2, hz: back / 2 + 2, rot });
      };
      // ---- the harbour: jetties with lighthouses, pontoons, yachts from day-boats to superyachts ----
      const yacht = (x, z, L, rot) => { const cr = Math.cos(rot), sr = Math.sin(rot), W0 = L * (L > 40 ? 0.17 : 0.3), rk = MC_ROCK;
        for (const [tu, tv] of [[-0.5, 0], [0.5, 0], [0, 0.5], [0, -0.5], [0, 0], [-0.5, 0.5], [0.5, -0.5]]) { const px = x + cr * L * tu - sr * W0 * tv, pz = z + sr * L * tu + cr * W0 * tv;
          if (!inPoly(MC_WATER, px, pz) || (px > rk.x0 && px < rk.x1 && pz > rk.z0 && pz < rk.z1) || clearance(px, pz) < 3) return; }
        yacht0(x, z, L, rot); };
      const yacht0 = (x, z, L, rot) => { const g = scen.get(x, z), cr = Math.cos(rot), sr = Math.sin(rot), W = L * (L > 40 ? 0.17 : 0.3), big = L > 40;
        const hull = R() < 0.16 ? [0.09, 0.15, 0.3] : R() < 0.1 ? [0.15, 0.15, 0.17] : [0.97, 0.97, 0.98];
        box(g, x, -0.6, z, L, 1.5 + L * 0.03, W, rot, hull, [0.86, 0.76, 0.6]);
        const bowx = x + cr * L * 0.5, bowz = z + sr * L * 0.5; tri2(g, [bowx, 0.9 + L * 0.03, bowz - cr * 0 + (-sr) * (W / 2)], [bowx + cr * L * 0.12, 0.9 + L * 0.03, bowz + sr * L * 0.12], [bowx + sr * (W / 2), 0.9 + L * 0.03, bowz - cr * (W / 2)], [0.86, 0.76, 0.6]);
        const dy = 0.9 + L * 0.03; box(g, x - cr * L * 0.06, dy, z - sr * L * 0.06, L * 0.52, 1.3 + L * 0.02, W * 0.78, rot, [0.98, 0.98, 0.98], [0.93, 0.93, 0.95]);
        box(g, x - cr * L * 0.02, dy + 0.5, z - sr * L * 0.02, L * 0.46, 0.5, W * 0.8, rot, [0.12, 0.16, 0.22]);
        if (big) { const uy = dy + 1.3 + L * 0.02; box(g, x - cr * L * 0.1, uy, z - sr * L * 0.1, L * 0.32, 1.4, W * 0.62, rot, [0.98, 0.98, 0.98], [0.9, 0.9, 0.92]); box(g, x - cr * L * 0.08, uy + 0.45, z - sr * L * 0.08, L * 0.3, 0.55, W * 0.64, rot, [0.12, 0.16, 0.22]);
          box(g, x - cr * L * 0.14, uy + 1.4, z - sr * L * 0.14, L * 0.16, 1.1, W * 0.5, rot, [0.98, 0.98, 0.98], [0.3, 0.32, 0.36]); cyl(g, x - cr * L * 0.08, uy + 2.5, z - sr * L * 0.08, 0.2, 4.5, 5, [0.9, 0.9, 0.9]); ico(g, x - cr * L * 0.08 + sr * 1.2, uy + 5.2, z - sr * L * 0.08 - cr * 1.2, 0.9, 1, [0.97, 0.97, 0.97], R, 0); }
        else if (R() < 0.35) cyl(g, x, dy, z, 0.08, L * 0.9, 4, [0.88, 0.88, 0.9]);
      };
      { const g = scen.get(600, 200);   // north jetty (towards the harbour mouth) and the south jetty off the Rock, each with a lighthouse
        const jetty = (ax, az, bx, bz, lh) => { const L = Math.hypot(bx - ax, bz - az), rot = Math.atan2(bz - az, bx - ax); box(g, (ax + bx) / 2, -1, (az + bz) / 2, L, 3.2, 11, rot, [0.78, 0.76, 0.7], [0.82, 0.8, 0.74]);
          cyl(g, bx, 2.2, bz, 1.6, 9, 8, lh, [0.95, 0.95, 0.95]); cyl(g, bx, 11.2, bz, 1.1, 1.4, 8, [0.2, 0.22, 0.26]); };
        jetty(833.3, 17.7, 823.5, 213.8, [0.2, 0.55, 0.3]); jetty(594.7, 246.5, 1117.6, 181.1, red); jetty(460.8, 619.0, 570.2, 455.6, white);
        }
      for (const [x0, z0, x1, z1] of [[36, 207, 206, 207], [20, 292, 200, 292], [37, 380, 200, 380], [230, 81, 230, 200], [350, 81, 350, 200], [470, 80, 470, 190], [600, 67, 600, 170]]) {
        const L = Math.hypot(x1 - x0, z1 - z0), rot = Math.atan2(z1 - z0, x1 - x0), g = scen.get((x0 + x1) / 2, (z0 + z1) / 2);
        box(g, (x0 + x1) / 2, -0.2, (z0 + z1) / 2, L, 0.55, 3.4, rot, [0.55, 0.52, 0.47], [0.6, 0.56, 0.5]);
        const ux = (x1 - x0) / L, uz = (z1 - z0) / L;
        for (let t = 8; t < L - 4; t += 8 + R() * 6) for (const sd of [-1, 1]) { if (R() < 0.18) continue; const Ly = 11 + R() * R() * 26, o = sd * (1.7 + Ly * 0.5 + 0.4);
          yacht(x0 + ux * t - uz * o, z0 + uz * t + ux * o, Ly, Math.atan2(ux * sd, -uz * sd) + Math.PI / 2 * 0); }
      }
      for (let k = 0; k < 9; k++) yacht(660 + k * 51, 208 - k * 6.1, 45 + R() * 40, -0.12);        // superyachts along the north jetty
      for (let k = 0; k < 7; k++) yacht(104 + k * 44, 455 + k * 7, 38 + R() * 30, 0.16);                    // and along the quay under the Rock
      for (let k = 0; k < 16; k++) { const a = R() * TAU, d = 120 + R() * 380; yacht(1300 + Math.cos(a) * d * 0.7, 330 + Math.sin(a) * d * 0.5, 20 + R() * 45, R() * TAU); }   // anchored in the bay
      // ---- Sainte-Dévote church in the ravine at turn 1 ----
      { const [x, z] = [-45.7, -26.4], g = scen.get(x, z), y0 = gH(x, z) - 0.3, rot = 0.6;
        box(g, x, y0, z, 22, 9, 12, rot, cream, cream); gable(g, x, y0 + 9, z, 22.4, 12.4, 4, rot, tile, cream);
        const tx = x + Math.cos(rot) * 12, tz = z + Math.sin(rot) * 12; box(g, tx, y0, tz, 5, 17, 5, rot, cream, cream); cone(g, tx, y0 + 17, tz, 3.4, 4, 4, tile, [0.8, 0.45, 0.3], rot + Math.PI / 4);
        excl.push({ x, z, r: 18 }); }
      // ---- Place du Casino: the Casino, Hôtel de Paris, Café de Paris, Hôtel Hermitage, the round lawn, gardens ----
      { const [x, z] = [741.8, -139.1], g = scen.get(x, z), y0 = facadeBox(x, z, 80, 46, 18, 0, [0.93, 0.86, 0.7]);
        box(g, x, y0 + 18, z, 80.4, 1.2, 46.4, 0, [0.85, 0.78, 0.62], [0.36, 0.5, 0.46]); gable(g, x, y0 + 19.2, z, 78, 40, 5, 0, copper, [0.85, 0.78, 0.62]);
        for (const sx of [-1, 1]) { const tx = x + sx * 30, tz = z - 20; box(g, tx, y0, tz, 9, 28, 9, 0, [0.95, 0.88, 0.72], [0.95, 0.88, 0.72]); ico(g, tx, y0 + 30.5, tz, 5, 1.1, copper, R, 0); cone(g, tx, y0 + 34.5, tz, 1, 4, 6, [0.8, 0.7, 0.4], [0.9, 0.8, 0.45], 0); }
        box(g, x, y0 + 18, z - 23.5, 22, 7, 2, 0, [0.97, 0.9, 0.74]); ico(g, x, y0 + 26, z - 21, 3, 1, [0.85, 0.72, 0.35], R, 0);   // sculpted attic + gilded group
        box(g, x, y0, z + 30, 90, 1.4, 16, 0, [0.9, 0.88, 0.82], [0.88, 0.86, 0.8]);                                                   // sea terraces
        excl.push({ x, z, r: 52 }); }
      { const [x, z] = [745.1, -178.4], g = scen.get(x, z), y = gH(x, z);                                                                   // the round lawn with its fountain
        cyl(g, x, y - 0.1, z, 13, 0.35, 20, [0.36, 0.58, 0.26], [0.4, 0.64, 0.28]); cyl(g, x, y + 0.25, z, 3.2, 0.6, 14, [0.9, 0.88, 0.84]); cyl(g, x, y + 0.85, z, 2.6, 0.05, 14, [0.45, 0.68, 0.82]); cone(g, x, y + 0.9, z, 0.5, 3, 6, [0.85, 0.9, 0.95], [0.9, 0.95, 1], 0);
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; palm(x + Math.cos(a) * 9.5, z + Math.sin(a) * 9.5, 7 + R() * 2); } excl.push({ x, z, r: 16 }); }
      { const [x, z] = [705.8, -96.7], g = scen.get(x, z), y0 = facadeBox(x, z, 44, 38, 22, 0, white);                                    // Hôtel de Paris, corner rotunda with a copper dome
        box(g, x, y0 + 22, z, 44.4, 0.8, 38.4, 0, [0.85, 0.84, 0.8], [0.4, 0.42, 0.46]); cyl(g, x - 20, y0, z - 17, 6, 25, 12, white); ico(g, x - 20, y0 + 26.5, z - 17, 6.2, 0.9, copper, R, 0); excl.push({ x, z, r: 32 }); }
      { const [x, z] = [833.3, -186.5], g = scen.get(x, z), y0 = facadeBox(x, z, 34, 24, 11, 0, [0.95, 0.9, 0.8]);                         // Café de Paris with red awnings
        box(g, x, y0 + 11, z, 34.4, 0.8, 24.4, 0, [0.8, 0.78, 0.72], [0.6, 0.62, 0.66]); for (let k = -2; k <= 2; k++) box(g, x + k * 6.5, y0 + 3.2, z - 13.2, 5, 0.3, 2.4, 0, red, red); excl.push({ x, z, r: 22 }); }
      { const [x, z] = [656.8, -34.6], g = scen.get(x, z), y0 = facadeBox(x, z, 58, 32, 24, 0.15, [0.95, 0.84, 0.76]);                     // Hôtel Hermitage, glass cupola
        box(g, x, y0 + 24, z, 58.4, 0.8, 32.4, 0.15, [0.85, 0.76, 0.7], [0.45, 0.45, 0.5]); ico(g, x + 10, y0 + 25, z, 6, 0.55, [0.62, 0.76, 0.82], R, 0); excl.push({ x, z, r: 36 }); }
      for (let k = 0; k < 44; k++) { const x = 660 + R() * 163, z = -296 + R() * 62; if (clearance(x, z) > 4 && !excluded(x, z)) (R() < 0.6 ? palm(x, z, 7 + R() * 4) : ico(scen.get(x, z), x, gH(x, z) + 3, z, 2.6 + R(), 1, vary([0.24, 0.45, 0.2], R, 0.15), R, 0.2)); }   // Boulingrins gardens
      for (const [fx, fz] of [[709.1, -227.4], [758.1, -237.2], [807.1, -247.0], [679.7, -204.5]]) if (clearance(fx, fz) > 3) flag(fx, fz, 9);
      // ---- the Fairmont hotel above the hairpin, built over the tunnel; fades with the tunnel roof when you are inside ----
      { const [x, z] = [973.8, -103.2], rot = Math.atan2(114, -142), L = 150, D = 72, y0 = 16, H = 24, cr = Math.cos(rot), sr = Math.sin(rot);
        box(tun, x, y0, z, L, H, D, rot, [0.94, 0.93, 0.9], [0.8, 0.8, 0.8]);
        for (let f = 1; f < 7; f++) box(tun, x, y0 + f * 3.4 - 1.2, z, L + 0.3, 1.1, D + 0.3, rot, [0.25, 0.3, 0.38]);          // window bands
        box(tun, x - cr * 30, y0 + H, z - sr * 30, 26, 0.4, 14, rot, [0.4, 0.75, 0.9], [0.4, 0.75, 0.9]);                      // rooftop pool
        box(tun, x, 0, z, L * 0.9, y0, D * 0.4, rot, [0.7, 0.7, 0.68], [0.75, 0.75, 0.72]);                                     // piers down to the sea road
        exclRect.push({ x, z, hx: L / 2 + 4, hz: D / 2 + 4, rot }); }
      // ---- the tunnel: walls, roof and lights over the sea road (roof fades out while you drive through) ----
      { const tu = T.def.tunnel || [0.54, 0.69], s0 = tu[0] * T.len, s1 = tu[1] * T.len;
        for (let s = s0; s < s1; s += 2) { const i = T.idx(s), j = T.idx(s + 2), y = HYi(i), yj = HYi(j);
          const Lw = (k, o, yy) => [T.px[k] + T.nx[k] * o, yy, T.pz[k] + T.nz[k] * o];
          const oL = -(T.bl[i] + 0.6), oR = T.br[i] + 0.6, oLj = -(T.bl[j] + 0.6), oRj = T.br[j] + 0.6;
          tun.quadO(Lw(i, oL, y), Lw(j, oLj, yj), Lw(j, oLj, yj + 6.4), Lw(i, oL, y + 6.4), [0.72, 0.72, 0.7], Lw(i, oL - 3, y + 3));
          tun.quadO(Lw(i, oR, y), Lw(j, oRj, yj), Lw(j, oRj, yj + 6.4), Lw(i, oR, y + 6.4), [0.72, 0.72, 0.7], Lw(i, oR + 3, y + 3));
          tun.quadO(Lw(i, oL - 1, y + 6.4), Lw(j, oLj - 1, yj + 6.4), Lw(j, oRj + 1, yj + 6.4), Lw(i, oR + 1, y + 6.4), [0.55, 0.55, 0.53], Lw(i, 0, y + 3));
          tun.quadO(Lw(i, oL - 1, y + 7.2), Lw(j, oLj - 1, yj + 7.2), Lw(j, oRj + 1, yj + 7.2), Lw(i, oR + 1, y + 7.2), [0.5, 0.5, 0.48], Lw(i, 0, y + 3));
          if (((s - s0) / 2 | 0) % 6 === 0) box(tun, T.px[i], y + 6.1, T.pz[i], 1.4, 0.25, 3.2, T.hd[i], [1, 0.9, 0.6], [1, 0.9, 0.6]); } }
      // ---- the swimming pool, the pits ----
      { const [x, z] = [-31.0, 246.5], g = scen.get(x, z), y = gH(x, z);
        box(g, x, y - 0.2, z, 30, 0.3, 64, 0, [0.9, 0.9, 0.88], [0.92, 0.92, 0.9]); box(g, x, y, z, 21, 0.14, 50, 0, [0.3, 0.7, 0.86], [0.34, 0.74, 0.9]);
        box(g, x + 12, y, z - 20, 3, 5, 3, 0, white, white); box(g, x + 12, y + 5, z - 22, 2, 0.3, 5, 0, white, white); excl.push({ x, z, r: 34 }); }
      { for (let zz = 96; zz < 390; zz += 9) { const x = -66, g = scen.get(x, zz), y = gH(x, zz); box(g, x, y, zz, 8, 4.2, 8.2, 0, [0.9, 0.9, 0.9], [0.8, 0.8, 0.82]); box(g, x - 4.05, y, zz, 0.2, 3.2, 6.2, 0, [0.15, 0.17, 0.2]); } exclRect.push({ x: -66, z: 243, hx: 6, hz: 150, rot: 0 }); }
      // ---- the Rock: Prince's Palace, the Cathedral, the Oceanographic Museum on the cliff, the old town, gardens ----
      { const [x, z] = [-42.5, 578.1], g = scen.get(x, z), y0 = gH(x, z) - 0.4, c = [0.94, 0.86, 0.68], rot = 0.08;
        box(g, x, y0, z, 86, 14, 58, rot, c, c); gable(g, x + 10, y0 + 14, z + 8, 60, 34, 6, rot, tile, c);
        for (const [u, v] of [[-43, -29], [43, -29], [-43, 29], [43, 29]]) { const px = x + u, pz = z + v; cyl(g, px, y0, pz, 5, 19, 10, c); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; box(g, px + Math.cos(a) * 4.4, y0 + 19, pz + Math.sin(a) * 4.4, 1.2, 1.2, 1.2, a, c); } }
        for (let k = -8; k <= 8; k++) box(g, x + k * 5, y0 + 14, z - 29.3, 2, 1.4, 1, rot, c);   // crenellations towards the Place du Palais
        flag(x, z - 5, 24); excl.push({ x, z, r: 60 }); }
      { const [x, z] = [169.9, 610.8], g = scen.get(x, z), y0 = gH(x, z) - 0.4, c = [0.96, 0.95, 0.9];                                       // Cathedral (white stone)
        box(g, x, y0, z, 44, 18, 20, 0, c, c); gable(g, x, y0 + 18, z, 44.4, 20.4, 6, 0, [0.6, 0.6, 0.62], c); cyl(g, x + 24, y0, z, 10, 16, 14, c); ico(g, x + 24, y0 + 16, z, 10.2, 0.6, [0.62, 0.62, 0.64], R, 0);
        box(g, x - 25, y0, z - 6, 7, 30, 7, 0, c, c); cone(g, x - 25, y0 + 30, z - 6, 4.8, 5, 4, [0.6, 0.6, 0.62], c, Math.PI / 4); excl.push({ x, z, r: 36 }); }
      { const [x, z] = [382.3, 684.3], g = scen.get(x, z), y0 = gH(x, z) - 30, c = [0.97, 0.96, 0.92];                                     // Oceanographic Museum, rising from the cliff face
        box(g, x, y0, z, 110, 38, 26, -0.05, c, c); box(g, x, y0 + 38, z - 2, 70, 6, 18, -0.05, c, [0.7, 0.7, 0.72]); ico(g, x, y0 + 44, z - 2, 8, 0.7, [0.72, 0.7, 0.66], R, 0);
        for (let k = -5; k <= 5; k++) cyl(g, x + k * 9, y0 + 20, z - 13.4, 0.7, 16, 8, c); excl.push({ x, z, r: 60 }); }
      // ---- the city: La Condamine, Monte-Carlo towers, the inner hillside, the old town on the Rock, Larvotto ----
      const zones = [
        { x0: -420, x1: -104, z0: -130, z1: 520, pal: 'condamine', n: 200 },   // La Condamine behind Boulevard Albert Ier
        { x0: -80, x1: 600, z0: -340, z1: -34, pal: 'mc', n: 240 },            // Monte-Carlo above Beau Rivage
        { x0: 90, x1: 600, z0: 8, z1: 50, pal: 'mc', n: 60 },                  // between Beau Rivage and the harbour road
        { x0: 595, x1: 920, z0: -214, z1: 14, pal: 'mc', n: 70 },              // around the Casino, inside the loop
        { x0: 530, x1: 1150, z0: -480, z1: -255, pal: 'mc', n: 160 },          // Monte-Carlo above the Casino and Mirabeau
        { x0: 1080, x1: 1480, z0: -460, z1: -200, pal: 'mc', n: 80 },          // Larvotto beyond Portier
        { x0: -110, x1: 430, z0: 520, z1: 690, pal: 'rock', n: 130 },          // Monaco-Ville on the Rock
        { x0: -480, x1: -130, z0: 520, z1: 780, pal: 'condamine', n: 60 },     // Fontvieille
      ];
      const PAL = { condamine: [[0.96, 0.86, 0.66], [0.93, 0.74, 0.58], [0.97, 0.92, 0.8], [0.9, 0.66, 0.54], [0.95, 0.9, 0.72]],
                    mc: [[0.97, 0.96, 0.93], [0.95, 0.92, 0.85], [0.9, 0.86, 0.78], [0.96, 0.9, 0.8], [0.85, 0.83, 0.8]],
                    rock: [[0.96, 0.84, 0.64], [0.94, 0.72, 0.6], [0.97, 0.92, 0.78], [0.92, 0.8, 0.7]] };
      const placed = [];
      { const tu = T.def.tunnel || [0.54, 0.69], awn = [[0.8, 0.12, 0.15], [0.1, 0.35, 0.6], [0.2, 0.45, 0.25], [0.9, 0.7, 0.2], [0.95, 0.95, 0.93]];
        for (const side of [-1, 1]) for (let q = 0; q < T.len; q += 19 + R() * 7) {
          if (q > tu[0] * T.len - 25 && q < tu[1] * T.len + 25) continue;
          const i = T.idx(q), bar = side > 0 ? T.br[i] : T.bl[i], W = 15 + R() * 9, D = 11 + R() * 7, o = side * (bar + 3.8 + D / 2), rot = T.hd[i];
          const x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, rad = Math.hypot(W, D) / 2;
          if (excluded(x, z) || gH(x, z) < 0.8) continue;
          const cr0 = Math.cos(rot), sr0 = Math.sin(rot); let bad = false;
          for (const [u, v] of [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]]) { const px = x + u * cr0 - v * sr0, pz = z + u * sr0 + v * cr0; if (clearance(px, pz) < 2.5 || gH(px, pz) < 0.8 || excluded(px, pz)) { bad = true; break; } }
          if (bad || placed.some(p => Math.hypot(p[0] - x, p[1] - z) < (p[2] + rad) * 0.8)) continue;
          const monte = z < -60 || x > 400, pal = monte ? PAL.mc : PAL.condamine, col = pal[Math.floor(R() * pal.length)], H = 10 + R() * 12, y0 = facadeBox(x, z, W, D, H, rot, col, null, monte && R() < 0.7), g = scen.get(x, z);
          if (!monte || R() < 0.4) gable(g, x, y0 + H, z, W + 0.6, D + 0.6, 2.4 + R(), rot, tile, col); else box(g, x, y0 + H, z, W, 0.6, D, rot, col.map(v => v * 0.86), [0.72, 0.72, 0.7]);
          const fx = x - side * T.nx[i] * (D / 2 + 0.6), fz = z - side * T.nz[i] * (D / 2 + 0.6);
          if (R() < 0.7) { const ac = awn[Math.floor(R() * awn.length)]; for (let b2 = -W / 2 + 2.5; b2 < W / 2 - 1.5; b2 += 4.2) box(g, fx + cr0 * b2, y0 + 3.1, fz + sr0 * b2, 3.4, 0.25, 1.4, rot, ac, ac); }
          placed.push([x, z, rad]); excl.push({ x, z, r: rad + 1 }); CR.block(x, z, W, D, rot);
        } }
      for (const Z of zones) {
        let made = 0;
        for (let k = 0; k < Z.n * 30 && made < Z.n; k++) {
          const x = Z.x0 + R() * (Z.x1 - Z.x0), z = Z.z0 + R() * (Z.z1 - Z.z0), W = 14 + R() * 18, D = 12 + R() * 14, rad = Math.hypot(W, D) / 2;
          const c = clearance(x, z);
          if (c < rad * 0.5 + 2 || excluded(x, z)) continue;
          const y = gH(x, z); if (y < 0.8) continue;                                            // not in the water
          if (placed.some(p => Math.hypot(p[0] - x, p[1] - z) < (p[2] + rad) * 0.84)) continue;
          const ni = nearest(x, z).i, rot = ni >= 0 ? T.hd[ni] + (R() < 0.5 ? 0 : Math.PI / 2) : (R() - 0.5) * 0.6;
          { const cr0 = Math.cos(rot), sr0 = Math.sin(rot); let bad = false; for (const [u, v] of [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]]) { const px = x + u * cr0 - v * sr0, pz = z + u * sr0 + v * cr0; if (clearance(px, pz) < 2.5 || gH(px, pz) < 0.8) { bad = true; break; } } if (bad) continue; }
          const maxH = Math.min(Z.pal === 'mc' ? 72 : Z.pal === 'rock' ? 14 : 30, 9 + Math.max(0, c) * (Z.pal === 'mc' ? 0.55 : 0.3));   // low next to the circuit, towers further back
          const H = Math.max(8, Math.min(maxH, (Z.pal === 'mc' ? 14 + R() * R() * 60 : 10 + R() * 16)));
          const col = PAL[Z.pal][Math.floor(R() * PAL[Z.pal].length)], y0 = facadeBox(x, z, W, D, H, rot, col, null, Z.pal === 'mc' && R() < 0.75), g = scen.get(x, z);
          if (Z.pal !== 'mc' || H < 22) gable(g, x, y0 + H, z, W + 0.6, D + 0.6, 2.4 + R(), rot, tile, col);
          else { box(g, x, y0 + H, z, W, 0.6, D, rot, col.map(v => v * 0.86), [0.72, 0.72, 0.7]); if (R() < 0.5) box(g, x + (R() - 0.5) * W * 0.4, y0 + H + 0.6, z + (R() - 0.5) * D * 0.4, W * 0.35, 2.6, D * 0.35, rot, [0.9, 0.9, 0.88], [0.4, 0.62, 0.78]); }
          placed.push([x, z, rad]); excl.push({ x, z, r: rad + 1.5 }); CR.block(x, z, W, D, rot); made++;
        }
      }
      { const fm = new THREE.Mesh(fac.geometry(), new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true })); fm.castShadow = true; fm.receiveShadow = true; root.add(fm); }
      if (!facB.empty) { const fb = new THREE.Mesh(facB.geometry(), new THREE.MeshLambertMaterial({ map: tex.facadeBal, vertexColors: true })); fb.castShadow = true; fb.receiveShadow = true; root.add(fb); }
      // ---- greenery: palms along the port and the boulevards, trees on the hillsides and the Rock's gardens ----
      for (let k = 0; k < 2600; k++) {
        const x = -500 + R() * 2000, z = -560 + R() * 1400, c = clearance(x, z); if (c < 2.5 || excluded(x, z)) continue;
        const y = gH(x, z); if (y < 0.8) continue;
        const nearTrack = c < 16, onRockEdge = x > MC_ROCK.x0 - 20 && x < MC_ROCK.x1 + 20 && z > MC_ROCK.z0 - 20 && z < MC_ROCK.z1 + 20 && y > 8 && y < 50;
        if (nearTrack && R() < 0.5) palm(x, z, 7 + R() * 4);
        else if ((onRockEdge || c > 60) && R() < 0.45) { const g = scen.get(x, z); cyl(g, x, y, z, 0.3, 2.5, 5, [0.4, 0.3, 0.2]); ico(g, x, y + 3.6, z, 2.4 + R() * 1.6, 0.9, vary([0.22, 0.42, 0.18], R, 0.18), R, 0.25); excl.push({ x, z, r: 2 }); }
      }
      // ---- street furniture just behind the barriers: palms and cast-iron lamp posts, both sides of the whole lap ----
      { const tu = T.def.tunnel || [0.54, 0.69];
        for (const side of [-1, 1]) for (let s0 = 0, k = 0; s0 < T.len; s0 += 17 + R() * 6, k++) {
          if (s0 > tu[0] * T.len - 20 && s0 < tu[1] * T.len + 20) continue;
          const i = T.idx(s0), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 2.2 + R() * 1.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
          if (excluded(x, z) || clearance(x, z) < 1.5 || gH(x, z) < 0.8) continue;
          if (k % 2 === 0) palm(x, z, 7.5 + R() * 3);
          else { const g = scen.get(x, z), y = gH(x, z); cyl(g, x, y, z, 0.12, 5.2, 6, [0.16, 0.2, 0.18]); box(g, x, y + 5.2, z, 0.5, 0.7, 0.5, 0, [0.95, 0.92, 0.75], [0.2, 0.22, 0.2]); excl.push({ x, z, r: 1.5 }); }
        } }
      // ================= details from the reference photos =================
      const orange = [0.98, 0.45, 0.1], blueRoof = [0.18, 0.4, 0.78];
      const seg = (g, p0, p1, w, col) => {   // square beam between two points (crane booms, scaffold braces)
        const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2]; let ux = -dz, uz = dx; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
        let vx = dy * uz, vy = dz * ux - dx * uz, vz = -dy * ux; const vl = Math.hypot(vx, vy, vz) || 1; vx /= vl; vy /= vl; vz /= vl;
        const h = w / 2, C = (p, a, b) => [p[0] + ux * a * h + vx * b * h, p[1] + vy * b * h, p[2] + uz * a * h + vz * b * h], mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2];
        for (const [a0, b0, a1, b1] of [[1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1], [-1, 1, 1, 1]]) g.quadO(C(p0, a0, b0), C(p0, a1, b1), C(p1, a1, b1), C(p1, a0, b0), col, mid); };
      const stonePine = (x, z, h) => { if (clearance(x, z) < 8.5 || gH(x, z) < 0.8) return; const g = scen.get(x, z), y = gH(x, z), cx = x + (R() - 0.5) * 1.6, cz = z + (R() - 0.5) * 1.6;   // umbrella pine: tall bare trunk, wide flat crown
        seg(g, [x, y, z], [cx, y + h * 0.8, cz], 0.6, [0.45, 0.33, 0.24]);
        ico(g, cx, y + h * 0.84, cz, 5.4 + R() * 1.6, 0.4, vary([0.2, 0.36, 0.16], R, 0.12), R, 0.25);
        ico(g, cx + (R() - 0.5) * 3, y + h * 0.93, cz + (R() - 0.5) * 3, 3.6, 0.45, vary([0.25, 0.43, 0.19], R, 0.12), R, 0.25); excl.push({ x, z, r: 4 }); };
      const crane = (x, z, rot, boom, ang) => {   // mobile TV crane: white truck on outriggers, red telescopic boom, camera hanging from the tip
        const g = scen.get(x, z), y = gH(x, z), cr = Math.cos(rot), sr = Math.sin(rot);
        box(g, x, y, z, 12, 2.2, 3, rot, [0.93, 0.93, 0.93], [0.85, 0.85, 0.87]); propSolid(x, z, 12, 3, rot); box(g, x + cr * 5.2, y + 2.2, z + sr * 5.2, 2.4, 2.2, 2.8, rot, [0.95, 0.95, 0.95], [0.3, 0.35, 0.42]);
        for (const a of [-1, 1]) for (const b of [-1, 1]) { const px = x + cr * a * 4.5 - sr * b * 3.4, pz = z + sr * a * 4.5 + cr * b * 3.4; seg(g, [x + cr * a * 4.5, y + 1, z + sr * a * 4.5], [px, y + 0.3, pz], 0.35, [0.85, 0.85, 0.85]); box(g, px, y, pz, 0.9, 0.35, 0.9, rot, [0.2, 0.2, 0.22]); }
        box(g, x - cr * 2, y + 2.2, z - sr * 2, 3.2, 1.4, 3.2, rot, red, red);
        const b0 = [x - cr * 2, y + 3.6, z - sr * 2], ca = Math.cos(ang), sa = Math.sin(ang), at = (t) => [b0[0] + cr * ca * boom * t, b0[1] + sa * boom * t, b0[2] + sr * ca * boom * t];
        for (let k = 0; k < 4; k++) seg(g, at(k / 4), at((k + 1) / 4 + 0.02), 1.15 - k * 0.2, red);
        const tip = at(1); seg(g, tip, [tip[0], tip[1] - 9, tip[2]], 0.08, [0.15, 0.15, 0.15]); box(g, tip[0], tip[1] - 10.3, tip[2], 1.1, 1.2, 1.6, rot, [0.12, 0.12, 0.14]);
        excl.push({ x, z, r: 9 }); };
      const sAt = (x, z) => { let bi = 0, bd = 1e9; for (let i = 0; i < T.N; i++) { const d = Math.hypot(T.px[i] - x, T.pz[i] - z); if (d < bd) { bd = d; bi = i; } } return bi * T.ds; };
      // Fairmont hairpin island (from the photo): low stone planter, green shrubs and small palms, red/white kerb ring flush with the road
      if (MC_ISLAND) { const { cx, cz, rI } = MC_ISLAND, g = scen.get(cx, cz), y = gH(cx, cz), yr = HYi(MC_ISLAND.i);
        for (let q = 0; q < 24; q++) { const a0 = q / 24 * TAU, a1 = (q + 1) / 24 * TAU, P = (a, r, yy) => [cx + Math.cos(a) * r, yy, cz + Math.sin(a) * r], c2 = q % 2 ? [0.96, 0.96, 0.96] : [0.86, 0.12, 0.14];
          g.quadO(P(a0, rI + 0.9, yr + 0.05), P(a1, rI + 0.9, yr + 0.05), P(a1, rI, yr + 0.16), P(a0, rI, yr + 0.16), c2, [cx, yr - 3, cz]); }
        cyl(g, cx, Math.min(y, yr) - 0.5, cz, rI, yr - Math.min(y, yr) + 1.1, 24, [0.8, 0.76, 0.68], [0.32, 0.5, 0.24]);
        for (let q = 0; q < 14; q++) { const a = R() * TAU, r = Math.sqrt(R()) * rI * 0.82; ico(g, cx + Math.cos(a) * r, yr + 1.1, cz + Math.sin(a) * r, 0.7 + R() * 0.7, 0.85, vary([0.2, 0.44, 0.18], R, 0.15), R, 0.3); }
        palm(cx + rI * 0.3, cz - rI * 0.2, 5.5); palm(cx - rI * 0.35, cz + rI * 0.3, 4.8); }
      // high road in, low road out: stone retaining wall along the inside of the road into the hairpin
      { const sA = MC_ISLAND ? MC_ISLAND.s : sAt(707, -304), sg = MC_ISLAND ? MC_ISLAND.sg : -1, g = scen.get(700, -340);
        for (let s1 = sA - 74; s1 < sA - 26; s1 += 2) { const i = T.idx(s1), j = T.idx(s1 + 2), yi = HYi(i), yj = HYi(j), P = (kk, oo, yy) => [T.px[kk] + T.nx[kk] * oo, yy, T.pz[kk] + T.nz[kk] * oo], col = vary([0.8, 0.74, 0.64], R, 0.05);
          const ob = sg < 0 ? -(T.bl[i] + 0.55) : (T.br[i] + 0.55), obj = sg < 0 ? -(T.bl[j] + 0.55) : (T.br[j] + 0.55), sgn = Math.sign(ob);
          g.quadO(P(i, ob, yi + 1.0), P(j, obj, yj + 1.0), P(j, obj, yi - 9), P(i, ob, yi - 9), col, P(i, ob - sgn * 3, yi));
          g.quadO(P(i, ob, yi + 1.0), P(j, obj, yj + 1.0), P(j, obj + sgn * 0.6, yj + 1.0), P(i, ob + sgn * 0.6, yi + 1.0), [0.86, 0.82, 0.74], P(i, ob, yi - 3)); } }
      // the tall residential tower and the pink building with blue balconies next to the hairpin
      { const [x, z] = [1011.4, -282.9], g = scen.get(x, z), y0 = facadeBox(x, z, 24, 22, 66, 0.3, [0.9, 0.82, 0.72]); box(g, x, y0 + 66, z, 24.4, 1.2, 22.4, 0.3, [0.8, 0.74, 0.66], [0.55, 0.55, 0.56]);
        for (let f = 1; f < 21; f++) box(g, x, y0 + f * 3.15, z, 24.8, 0.25, 22.8, 0.3, [0.95, 0.93, 0.9]); excl.push({ x, z, r: 18 }); }
      { const [x, z] = [892.1, -152.2], g = scen.get(x, z), y0 = facadeBox(x, z, 34, 20, 24, 0.1, [0.93, 0.74, 0.7]); box(g, x, y0 + 24, z, 34.4, 0.8, 20.4, 0.1, [0.8, 0.66, 0.62], [0.5, 0.52, 0.55]);
        for (let f = 1; f < 8; f++) box(g, x, y0 + f * 3.1 - 0.4, z - 10.4, 32, 0.35, 1.4, 0.1, [0.28, 0.5, 0.78], [0.3, 0.52, 0.8]); excl.push({ x, z, r: 20 }); }
      // spectators on the balconies of the pink building at the hairpin
      { const [x, z] = [892.1, -152.2], rot = 0.1, cr = Math.cos(rot), sr = Math.sin(rot), g = scen.get(x, z), y0 = gH(x, z) - 0.3, shirts = [[0.9, 0.2, 0.15], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.96, 0.8, 0.2], [0.2, 0.6, 0.3], [0.1, 0.1, 0.12]];
        for (let f = 1; f < 8; f++) for (let k = -14; k <= 14; k += 1.6) { if (R() < 0.45) continue; const px = x + cr * k + sr * 11, pz = z + sr * k - cr * 11.0, yy = y0 + f * 3.1 - 0.05;
          box(g, px, yy, pz, 0.45, 1.05, 0.3, rot, shirts[Math.floor(R() * shirts.length)]); box(g, px, yy + 1.05, pz, 0.28, 0.28, 0.28, rot, [0.93, 0.76, 0.6]); } }
      // orange/black energy-absorbing blocks around the outside of the hairpin exit
      if (MC_ISLAND) { const sA = MC_ISLAND.s, side = -MC_ISLAND.sg;
        for (let s1 = sA - 18, q = 0; s1 < sA + 34; s1 += 2.1, q++) { const i = T.idx(s1), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar - 0.45), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, g = scen.get(x, z);
          box(g, x, HYi(i), z, 2.0, 1.2, 0.9, T.hd[i], q % 2 ? [0.12, 0.12, 0.13] : [0.98, 0.45, 0.08], q % 2 ? [0.2, 0.2, 0.22] : [1, 0.55, 0.15]); propSolid(x, z, 2.0, 0.9, T.hd[i]); } }
      // a second big billboard above the hairpin
      { const [x, z] = [1009.8, -135.9], g = scen.get(x, z), y = gH(x, z), rot = 1.5, cr = Math.cos(rot), sr = Math.sin(rot), hw = 8;
        for (const o of [-hw + 1, hw - 1]) box(g, x + cr * o, y, z + sr * o, 0.5, 5, 0.5, rot, [0.2, 0.2, 0.22]);
        texSpons.quadO([x - cr * hw, y + 5, z - sr * hw], [x + cr * hw, y + 5, z + sr * hw], [x + cr * hw, y + 8.4, z + sr * hw], [x - cr * hw, y + 8.4, z - sr * hw], [1, 1, 1], [x + sr * 3, y + 6, z - cr * 3], [[0.5, 0.25], [1, 0.25], [1, 0.5], [0.5, 0.5]]); }
      // La Rascasse: the bar-restaurant on the corner, red awnings and a terrace
      { const [x, z] = [14.7, 507.9], rot = 0.05; if (clearance(x, z) > 9 && gH(x, z) > 0.8) { const g = scen.get(x, z), y0 = facadeBox(x, z, 22, 12, 7, rot, [0.96, 0.9, 0.8]);
          box(g, x, y0 + 7, z, 22.4, 0.5, 12.4, rot, [0.8, 0.76, 0.7], [0.75, 0.72, 0.68]); for (let k = -9; k <= 9; k += 4.5) box(g, x + k, y0 + 3, z - 6.8, 3.8, 0.25, 1.8, rot, red, red);
          for (let k = -8; k <= 8; k += 4) { cyl(g, x + k, y0, z - 10, 0.06, 2.4, 4, [0.85, 0.85, 0.85]); cone(g, x + k, y0 + 2.3, z - 10, 1.6, 0.6, 8, white, white, 0); }
          excl.push({ x, z, r: 14 }); } }
      // TV cranes like the ones over the hairpin, the pool and the Casino
      crane(990.1, -145.7, -2.2, 34, 1.0); crane(-29.4, 161.5, 0.4, 30, 0.95); crane(725.5, -255.2, 2.6, 28, 1.05); crane(88.2, -50.9, 2.9, 26, 1.0);
      // umbrella pines along the harbour boulevards (pool section, Tabac quay, Boulevard Albert Ier)
      const pinesAlong = (fa, fb, side, off) => { for (let q = fa * T.len; q < fb * T.len; q += 15 + R() * 5) { const i = T.idx((T.startS + q) % T.len), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + off), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; if (!excluded(x, z)) stonePine(x, z, 11 + R() * 3); } };
      pinesAlong(0.78, 0.88, 1, 9); pinesAlong(0.66, 0.75, 1, 9); pinesAlong(0.925, 1.06, -1, 9);   // pool side of the swimming-pool section, Tabac, Boulevard Albert Ier
      // yachts moored stern-to right along the quays, as in the photos (bows pointing into the harbour)
      const lerpTab = (tab, v) => { if (v <= tab[0][0]) return tab[0][1]; for (let k = 0; k < tab.length - 1; k++) if (v <= tab[k + 1][0]) { const t = (v - tab[k][0]) / (tab[k + 1][0] - tab[k][0]); return tab[k][1] + (tab[k + 1][1] - tab[k][1]) * t; } return tab[tab.length - 1][1]; };
      const quayW = [[109.2, 70.3], [132.1, 57.2], [161.5, 47.4], [207.2, 34.3], [256.3, 26.1], [292.2, 18], [324.9, 22.9], [360.8, 31], [400, 42.5], [431, 53.9], [471.9, 58.8]], quayN = [[91.5, 92.9], [145.4, 79.8], [300.6, 78.2], [447.7, 79.8], [496.7, 76.5], [545.7, 68.4], [619.2, 63.5], [692.8, 53.7], [766.3, 35.7]];
      for (let z = 112; z < 470; z += 9.5 + R() * 3) { if ([207, 292, 380].some(p => Math.abs(p - z) < 11)) continue; const L = 20 + R() * 32; yacht(lerpTab(quayW, z) + 1.5 + L / 2, z, L, 0); }        // stern-to all along the pool section
      for (let x = 100; x < 762; x += 9.5 + R() * 3) { if ([230, 350, 470, 600].some(p => Math.abs(p - x) < 11)) continue; const L = 18 + R() * 30; yacht(x, lerpTab(quayN, x) + 1.5 + L / 2, L, Math.PI / 2); }   // and along Tabac to the chicane
      // cruise ships anchored in the bay
      const cruise = (x, z, L, rot) => { const g = scen.get(x, z), W = L * 0.13, cr = Math.cos(rot), sr = Math.sin(rot);
        box(g, x, -3, z, L, 11, W, rot, [0.96, 0.96, 0.97], [0.66, 0.58, 0.48]);
        for (let d = 0; d < 5; d++) { const Ld = L * (0.78 - d * 0.08); box(g, x - cr * L * 0.05, 8 + d * 2.8, z - sr * L * 0.05, Ld, 2.8, W * 0.9, rot, [0.97, 0.97, 0.98], [0.95, 0.95, 0.96]); box(g, x - cr * L * 0.05, 8.9 + d * 2.8, z - sr * L * 0.05, Ld + 0.2, 0.9, W * 0.92, rot, [0.2, 0.26, 0.34]); }
        box(g, x - cr * L * 0.22, 22, z - sr * L * 0.22, W * 0.55, 8, W * 0.42, rot, [0.93, 0.93, 0.95], [0.12, 0.12, 0.15]); };
      cruise(1281.0, 390.2, 250, -0.3); cruise(1509.7, 128.8, 210, 0.15); cruise(1411.7, 651.7, 280, -0.1);
      // Yacht Club de Monaco: stacked decks like a liner, twin masts, at the east end of the harbour
      { const [x, z] = [679.7, 92.9], g = scen.get(x, z), y = 1.2;
        for (let d = 0; d < 6; d++) { const r = 17 - d * 1.7; cyl(g, x, y + d * 3.6, z, r, 3, 20, [0.97, 0.97, 0.98], [0.92, 0.92, 0.93]); cyl(g, x, y + d * 3.6 + 3, z, r + 0.7, 0.6, 20, [0.22, 0.28, 0.36]); }
        for (const o of [-4, 4]) cyl(g, x + o, y + 21.6, z, 0.28, 24, 5, [0.96, 0.96, 0.96]); excl.push({ x, z, r: 20 }); }
      // overhead sponsor gantries across the circuit (pool section, Tabac, the start)
      const gantry = (sq, slot) => { const i = T.idx(sq), x = T.px[i], z = T.pz[i], y = HYi(i), nx = T.nx[i], nz = T.nz[i], tx = T.tx[i], tz = T.tz[i], L1 = T.bl[i] + 1.3, L2 = T.br[i] + 1.3, g = scen.get(x, z);
        box(g, x - nx * L1, y, z - nz * L1, 0.9, 8.4, 0.9, T.hd[i], [0.2, 0.22, 0.26]); box(g, x + nx * L2, y, z + nz * L2, 0.9, 8.4, 0.9, T.hd[i], [0.2, 0.22, 0.26]); CR.avoid(x - nx * L1, z - nz * L1, 1.1); CR.avoid(x + nx * L2, z + nz * L2, 1.1);
        const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2, span = L1 + L2; box(g, cx, y + 6.6, cz, 1.4, 2.0, span + 0.9, T.hd[i], [0.12, 0.13, 0.16], [0.2, 0.22, 0.26]);
        const u0 = (slot % 2) * 0.5, u1 = u0 + 0.5, vTop = 1 - Math.floor(slot / 2) * 0.25, vBot = vTop - 0.25, half = span / 2 - 0.4;
        for (const f of [-1, 1]) { const bx = cx + tx * 0.72 * f, bz = cz + tz * 0.72 * f;
          texSpons.quadO([bx - nx * half, y + 6.7, bz - nz * half], [bx + nx * half, y + 6.7, bz + nz * half], [bx + nx * half, y + 8.5, bz + nz * half], [bx - nx * half, y + 8.5, bz - nz * half], [1, 1, 1], [cx, y + 7.5, cz], f < 0 ? [[u0, vBot], [u1, vBot], [u1, vTop], [u0, vTop]] : [[u1, vBot], [u0, vBot], [u0, vTop], [u1, vTop]]); } };
      gantry(sF(0.81), 4); gantry(sF(0.70), 1); gantry(sF(0.03), 6);
      // big MONACO billboard above the hairpin, like in the photo
      { const [x, z] = [921.5, -266.6], g = scen.get(x, z), y = gH(x, z), rot = 0.2, cr = Math.cos(rot), sr = Math.sin(rot), hw = 9;
        for (const o of [-hw + 1, hw - 1]) box(g, x + cr * o, y, z + sr * o, 0.5, 4.2, 0.5, rot, [0.2, 0.2, 0.22]);
        texSpons.quadO([x - cr * hw, y + 4, z - sr * hw], [x + cr * hw, y + 4, z + sr * hw], [x + cr * hw, y + 7, z + sr * hw], [x - cr * hw, y + 7, z - sr * hw], [1, 1, 1], [x + sr * 3, y + 5, z - cr * 3], [[0, 0.75], [0.5, 0.75], [0.5, 1], [0, 1]]); }
      // distance boards before the braking zones (150 / 100 / 50 m)
      { const boardTex = {}; const bt = (n) => boardTex[n] || (boardTex[n] = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x2 = c.getContext('2d'); x2.fillStyle = '#fff'; x2.fillRect(0, 0, 64, 64); x2.strokeStyle = '#111'; x2.lineWidth = 5; x2.strokeRect(3, 3, 58, 58); x2.fillStyle = '#111'; x2.font = '900 30px Arial, sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText(String(n), 32, 34); return ownTex(new THREE.CanvasTexture(c)); })());
        for (const fc of [0.068, 0.362, 0.641, 0.884]) { const sC = sF(fc);
          for (const d of [150, 100, 50]) { const sq = sC - d - 12; const i = T.idx(sq), side = T.br[i] < T.bl[i] ? 1 : -1, o = side * ((side > 0 ? T.br[i] : T.bl[i]) - 0.2);
            const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: bt(d) })); m.position.set(T.px[i] + T.nx[i] * o, HYi(i) + 2.0, T.pz[i] + T.nz[i] * o); m.rotation.y = Math.atan2(-T.tx[i], -T.tz[i]); root.add(m);
            const g = scen.get(m.position.x, m.position.z); box(g, m.position.x, HYi(i), m.position.z, 0.12, 1.4, 0.12, 0, [0.3, 0.3, 0.32]); } } }
      // marshals in orange behind the barriers at the big corners
      for (const c of T.corners) { if (c.sev < 2) continue; for (let k = 0; k < 3; k++) { const i = T.idx(c.s0 + k * 6 - 4), side = -c.dir, bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 1.4 + k * 0.4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, g = scen.get(x, z), y = gH(x, z);
        box(g, x, y, z, 0.5, 1.25, 0.35, T.hd[i], orange); box(g, x, y + 1.25, z, 0.32, 0.32, 0.32, T.hd[i], [0.96, 0.96, 0.96]); } }
      // ---- grandstands: Boulevard Albert Ier, the harbour quay at Tabac, along the pool, Casino square, Rascasse, Sainte Dévote, the hairpin ----
      stand(-117.6, 104, -117.6, 243, 11, blueRoof); stand(-117.6, 276, -117.6, 406, 10, red);          // Boulevard Albert Ier
      stand(-16, 212, -16, 282, 7, blueRoof, true); stand(-46, 292, -16, 292, 5, blueRoof, true);      // over the Rainier III pool
      stand(741.8, -250.3, 807.2, -260.1, 6, white); stand(14.7, -29.7, 80.1, -29.7, 6, white);        // Casino square, Sainte Dévote
      stand(880.7, -233.9, 885.6, -178.4, 7, red);                                                     // the hairpin, on scaffolding
      { const g = scen.get(870, -206); for (let z = -234; z <= -178; z += 3.2) for (const x of [872, 866, 860]) { const y = gH(x, z); seg(g, [x, y, z], [x, y + 9, z], 0.18, [0.62, 0.64, 0.68]); }
        for (let z = -234; z < -178; z += 6.4) seg(g, [872, gH(872, z), z], [872, gH(872, z) + 8, z + 3.2], 0.12, [0.62, 0.64, 0.68]); }
      // spectators on the pavements behind the catch fences (up to three rows before the house fronts): Sainte Dévote, Beau Rivage, Casino square,
      // Mirabeau, outside the hairpin, Portier, the chicane, Tabac, the pool, Rascasse, Anthony Noghès, Boulevard Albert Ier (not in the tunnel,
      // not on the pit side, not over the water; the stands and the street furniture keep their room)
      { const M = { rows: 3, gap: 0.95, clump: 0.55, flag: 0.07, shirts: [[0.95, 0.95, 0.93], [0.12, 0.16, 0.3], [0.84, 0.1, 0.14], [0.9, 0.84, 0.7], [0.55, 0.7, 0.86], [0.2, 0.2, 0.22], [0.96, 0.8, 0.2], [0.88, 0.5, 0.52], [0.3, 0.46, 0.34], [0.7, 0.72, 0.76]] };
        for (const [a, b2, sd, dn] of [[220, 282, -1, 0.8], [220, 282, 1, 0.6], [300, 700, -1, 0.5], [300, 700, 1, 0.5], [996, 1162, -1, 0.8], [996, 1090, 1, 0.75], [1160, 1226, -1, 0.8], [1160, 1226, 1, 0.8],
          [1264, 1330, 1, 0.8], [1340, 1500, -1, 0.65], [1340, 1500, 1, 0.65], [2100, 2176, -1, 0.75], [2100, 2176, 1, 0.75], [2250, 2420, -1, 0.7], [2250, 2420, 1, 0.7],
          [2490, 2810, -1, 0.62], [2490, 2810, 1, 0.62], [2910, 3000, -1, 0.8], [2910, 3000, 1, 0.8], [3012, 3100, -1, 0.75], [3012, 3100, 1, 0.75], [3100, 3556, -1, 0.55], [3100, 3556, 1, 0.5], [700, 996, -1, 0.3], [700, 996, 1, 0.3]])
          crRun(a, b2, sd, Object.assign({ dens: dn, label: 'MC ' + a + (sd > 0 ? 'R' : 'L') }, M)); }
      { const tm = new THREE.Mesh(tun.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); tm.castShadow = true; tm.receiveShadow = true; root.add(tm);
        const tu = T.def.tunnel || [0.54, 0.69]; out.dyn.tunnel = { mat: tm.material, s0: tu[0] * T.len, s1: tu[1] * T.len }; }
      // the Mediterranean and Port Hercule
      { const x0 = B.minX - 500, x1 = B.maxX + 700, z0 = B.minZ - 300, z1 = B.maxZ + 700, gw = new THREE.PlaneGeometry(x1 - x0, z1 - z0); gw.rotateX(-Math.PI / 2); gw.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
        const uv = gw.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / 24, uv.getY(i) * (z1 - z0) / 24);
        const sea = new THREE.Mesh(gw, new THREE.MeshPhongMaterial({ map: tex.water, color: 0x3f8fc4, shininess: 90, specular: 0x6f9fcf })); sea.receiveShadow = true; root.add(sea); out.dyn.water = tex.water; }
    }

    /* ---- finalize meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const addTex = (g, mat, cast) => { if (g.empty) return; const m = new THREE.Mesh(g.geometry(), mat); m.castShadow = !!cast; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); return m; };
    addTex(texTires, new THREE.MeshLambertMaterial({ map: THEME === 'forest' ? tex.tiresRW : tex.tires, vertexColors: true }), true);
    tyreCh.addTo(root, new THREE.MeshLambertMaterial({ map: tex.tyreTex, vertexColors: true }), true, true);
    addTex(texSpons, new THREE.MeshLambertMaterial({ map: THEME === 'ljubljana' ? tex.sponsorsLJ : THEME === 'monaco' ? tex.sponsorsMC : THEME === 'forest' ? tex.sponsorsFO : tex.sponsors, vertexColors: true }), false);
    addTex(texFence, THEME === 'forest' ? new THREE.MeshLambertMaterial({ map: tex.fenceFO, vertexColors: true, transparent: true, depthWrite: false, alphaTest: 0.02, side: THREE.DoubleSide })
      : new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, transparent: false }), false);
    addTex(texCrowd, new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), false);
    crowdFinish(CR, root, out);   // the instanced spectators and their ground strips
    return out;
  }

  /* ================= PIKES PEAK (theme 'pikes') =================
     An open 6.3 km mountain road (s = 0 at the bottom, T.len at the summit) that climbs ~440 m. Only a corridor around the road is built.
     Terrain: a height grid (5 m cells) cut into 100 m tiles. Near the road the height is blended from the nearby road samples (the ground
     sits at road height inside the barriers and slopes smoothly between stacked switchback legs); farther out it turns into a far field
     that rises west of the road (falls away on both sides along the ridge and at the summit), drops east into a valley with a reservoir,
     and falls away past both ends of the road. Hot loops live in these small functions (the big builder is not optimised by V8). */
  const PKC = 5, PKT = 20, PKHC = 32;          // terrain cell (m), tile size (cells), road-sample hash cell (m)
  let PK = null;                               // per-build data: sample hash, far-field grids, terrain height grid, pads, lake
  const PKN = { i: -1, d: 1e9, dd: 1e9, lat: 0, h: 0, hn: 0 };   // pkNear: nearest sample, its distance and lateral offset, distance beyond the barrier, blended and exact road height
  const PKCOL = [0, 0, 0];
  function pkPrep() {
    const N = T.N, M = 520; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    const P = PK = { bx0: x0, bx1: x1, bz0: z0, bz1: z1, pads: [], lk: null };
    x0 -= M; x1 += M; z0 -= M; z1 += M; P.x0 = x0; P.z0 = z0;
    // every 2nd road sample (and the last one) in a hash grid
    P.cx0 = Math.floor(x0 / PKHC); P.cz0 = Math.floor(z0 / PKHC); P.ncx = Math.floor(x1 / PKHC) - P.cx0 + 1; P.ncz = Math.floor(z1 / PKHC) - P.cz0 + 1; P.cells = new Array(P.ncx * P.ncz);
    const add = (i) => { const k = (Math.floor(T.pz[i] / PKHC) - P.cz0) * P.ncx + Math.floor(T.px[i] / PKHC) - P.cx0; (P.cells[k] || (P.cells[k] = [])).push(i); };
    for (let i = 0; i < N; i += 2) add(i); if ((N - 1) % 2) add(N - 1);
    // far-field trend: inverse-distance average of the road heights on a 16 m grid, and the distance to the road
    const tc = 16, tnx = Math.ceil((x1 - x0) / tc) + 1, tnz = Math.ceil((z1 - z0) / tc) + 1, th = new Float32Array(tnx * tnz), td = new Float32Array(tnx * tnz);
    const sx = [], sz = [], sy = []; for (let i = 0; i < N; i += 5) { sx.push(T.px[i]); sz.push(T.pz[i]); sy.push(T.hy[i]); }
    const S = sx.length;
    for (let j = 0; j < tnz; j++) for (let i = 0; i < tnx; i++) {
      const x = x0 + i * tc, z = z0 + j * tc; let ws = 0, hs = 0, dm = 1e18;
      for (let k = 0; k < S; k++) { const dx = x - sx[k], dz = z - sz[k], d2 = dx * dx + dz * dz; if (d2 < dm) dm = d2; const q = 1 / (d2 + 900), wq = q * q; ws += wq; hs += wq * sy[k]; }
      th[j * tnx + i] = hs / ws; td[j * tnx + i] = Math.sqrt(dm);
    }
    Object.assign(P, { tc, tnx, tnz, th, td });
    // mean road x per 10 m of z (the mountain's cross-slope is measured from it) and the cross-slope per band:
    // rising to the west (kW > 0) or falling (kW < 0: the ridge, the summit), falling to the east into the valley (kE)
    const nb = Math.ceil((z1 - z0) / 10) + 1, xs = new Float64Array(nb), xw = new Float64Array(nb), xc = new Float32Array(nb), kW = new Float32Array(nb), kE = new Float32Array(nb);
    for (let i = 0; i < N; i += 2) { const b = Math.round((T.pz[i] - z0) / 10); for (let q = Math.max(0, b - 6); q <= Math.min(nb - 1, b + 6); q++) { xs[q] += T.px[i]; xw[q]++; } }
    let first = -1; for (let q = 0; q < nb; q++) { if (xw[q] > 0) { xc[q] = xs[q] / xw[q]; if (first < 0) { first = q; for (let r = 0; r < q; r++) xc[r] = xc[q]; } } else if (first >= 0) xc[q] = xc[q - 1]; }
    for (let pass = 0; pass < 3; pass++) { const c2 = xc.slice(); for (let q = 0; q < nb; q++) { let s = 0, n = 0; for (let r = Math.max(0, q - 5); r <= Math.min(nb - 1, q + 5); r++) { s += c2[r]; n++; } xc[q] = s / n; } }
    const zAt = (s) => T.pz[T.idx(s)], zr0 = zAt(3950), zr1 = zAt(4850), zsm = zAt(5950);
    for (let q = 0; q < nb; q++) { const z = z0 + q * 10, rid = sstep(zr0 + 120, zr0 - 120, z) * sstep(zr1 - 120, zr1 + 120, z), sum = sstep(zsm + 80, zsm - 140, z);
      kW[q] = lerp(lerp(0.46, -0.32, rid), -0.3, sum); kE[q] = lerp(0.5, 0.36, sum); }
    Object.assign(P, { nb, xc, kW, kE });
    P.n1 = valueNoise2(301, 110); P.n2 = valueNoise2(302, 38); P.n3 = valueNoise2(303, 60); P.n4 = valueNoise2(304, 24);
    P.sx = T.px[0]; P.sz = T.pz[0]; P.stx = T.tx[0]; P.stz = T.tz[0]; P.ex = T.px[N - 1]; P.ez = T.pz[N - 1]; P.etx = T.tx[N - 1]; P.etz = T.tz[N - 1];
    // terrain height grid (filled lazily, NaN = not computed yet) and the distance beyond the nearest barrier at each vertex
    const G = P.G = { x0, z0 }; G.ntx = Math.ceil((x1 - x0) / (PKC * PKT)); G.ntz = Math.ceil((z1 - z0) / (PKC * PKT)); G.nx = G.ntx * PKT + 1; G.nz = G.ntz * PKT + 1;
    G.h = new Float32Array(G.nx * G.nz).fill(NaN); G.dd = new Float32Array(G.nx * G.nz); G.on = new Uint8Array(G.ntx * G.ntz);
    // the reservoir in the valley below the first hairpins (seen ahead when the road turns east), a little below the ground around it
    let il = T.idx(1600); for (let s = 1600; s < 1900; s += 4) if (T.px[T.idx(s)] > T.px[il]) il = T.idx(s);   // the east tip of the hairpin
    const lx = T.px[il] + 150, lz = T.pz[il] - 10;
    P.lk = { x: lx, z: lz, rx: 75, rz: 110, y: pkFar(lx, lz, 200) - 3 };
  }
  function pkTG(a, x, z) {   // bilinear lookup in a far-field grid
    const P = PK, gx = clamp((x - P.x0) / P.tc, 0, P.tnx - 1.001), gz = clamp((z - P.z0) / P.tc, 0, P.tnz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = P.tnx;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function pkNear(x, z) {   // Shepard blend of the road heights around (x, z): weights fall with the distance beyond each sample's barrier, so stacked legs blend smoothly
    const P = PK, cx = Math.floor(x / PKHC) - P.cx0, cz = Math.floor(z / PKHC) - P.cz0, ds = T.ds;
    let ws = 0, hs = 0, bd = 1e9, bi = -1, bl = 0, ba = 0, bdd = 1e9;
    for (let b = Math.max(0, cz - 2); b <= Math.min(P.ncz - 1, cz + 2); b++) for (let a = Math.max(0, cx - 2); a <= Math.min(P.ncx - 1, cx + 2); a++) {
      const L = P.cells[b * P.ncx + a]; if (!L) continue;
      for (let q = 0; q < L.length; q++) {
        const i = L[q], dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], lat = dx * T.nx[i] + dz * T.nz[i], ex = Math.max(0, Math.abs(al) - ds), d = Math.sqrt(lat * lat + ex * ex);
        if (d >= 64) continue;
        const dd = Math.max(0, d - (lat > 0 ? T.br[i] : T.bl[i])), k = 1 / (dd + 1.5), wq = k * k * k * k * (d < 48 ? 1 : sstep(64, 48, d));
        ws += wq; hs += wq * T.hy[i];
        if (d < bd) { bd = d; bi = i; bl = lat; ba = al; }
        if (dd < bdd) bdd = dd;
      }
    }
    PKN.i = bi; PKN.d = bd; PKN.dd = bdd; PKN.lat = bl;
    if (bi < 0) return PKN;
    PKN.h = hs / ws;
    const f = clamp(bi + ba / ds, 0, T.N - 1), i0 = Math.min(T.N - 2, Math.floor(f)); PKN.hn = T.hy[i0] + (T.hy[i0 + 1] - T.hy[i0]) * (f - i0);   // road height across from the point
    return PKN;
  }
  function pkFar(x, z, dd) {   // the mountain away from the road
    const P = PK; let f = pkTG(P.th, x, z);
    const hd = pkTG(P.td, x, z), q = clamp((z - P.z0) / 10, 0, P.nb - 1.001), q0 = Math.floor(q), t = q - q0;
    const xc = P.xc[q0] + (P.xc[q0 + 1] - P.xc[q0]) * t, kW = P.kW[q0] + (P.kW[q0 + 1] - P.kW[q0]) * t, kE = P.kE[q0] + (P.kE[q0 + 1] - P.kE[q0]) * t, e = hd * sstep(10, 70, hd);
    const up = kW > 0 ? 95 * (1 - Math.exp(-kW * e / 95)) : Math.max(-150, kW * e), dn = Math.min(170, kE * e), bw = 25 + 0.4 * e;
    f += lerp(-dn, up, sstep(xc + bw, xc - bw, x));   // west of the road's mean line the mountain rises (or falls away on the ridge and at the top), east it drops into the valley; blended across the line (no wall)
    f += (P.n1(x, z) * 30 + P.n2(x, z) * 12 - 17) * sstep(4, 70, dd);                       // knolls, gullies and outcrops
    const e1 = (x - P.ex) * P.etx + (z - P.ez) * P.etz; if (e1 > 45) f -= 0.55 * (e1 - 45);   // the summit is the top: the mountain falls away beyond the road's end
    const e0 = (P.sx - x) * P.stx + (P.sz - z) * P.stz; if (e0 > 45) f -= 0.3 * (e0 - 45);   // and into the valley below the start
    const L = P.lk;
    if (L) { const ex = (x - L.x) / L.rx, ez = (z - L.z) / L.rz, r = Math.sqrt(ex * ex + ez * ez);
      if (r < 1.7) f = lerp(L.y + (r - 1) * 12 - 4 * Math.max(0, 1 - r * r), f, sstep(1.15, 1.7, r)); }   // reservoir basin with a shore just above the water
    return f;
  }
  function pkH(x, z) {   // terrain height
    const n = pkNear(x, z), i = n.i, dd = n.dd, hn = n.hn; let h;
    if (i < 0) h = pkFar(x, z, 200);
    else { const hr = lerp(hn, n.h, sstep(0, 6, dd)) - 0.3; h = dd <= 1 ? hr : lerp(hr, pkFar(x, z, dd), sstep(1, 45, dd)); }
    const pads = PK.pads; for (let k = 0; k < pads.length; k++) { const p = pads[k], d = Math.hypot(x - p.x, z - p.z); const pb = p.b || 16; if (d < p.r + pb) h = lerp(p.h, h, sstep(p.r, p.r + pb, d)); }   // flat paddock / car park
    if (i >= 0 && dd < 6) h = Math.min(h, hn - 0.3 + 0.12 * dd * dd);   // never above the road inside the barriers, and only a gentle rise right behind them
    PKN.dd = i >= 0 ? dd : 999;
    return h;
  }
  function pkGH(i, j) {   // terrain height at grid vertex (i, j), computed once
    const G = PK.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = pkH(G.x0 + i * PKC, G.z0 + j * PKC); G.dd[k] = PKN.dd; }
    return h;
  }
  function pkGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = PK.G, gx = clamp((x - G.x0) / PKC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / PKC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = pkGH(i, j); return a + u * (pkGH(i + 1, j) - a) + v * (pkGH(i, j + 1) - a); }
    const d = pkGH(i + 1, j + 1); return d + (1 - u) * (pkGH(i, j + 1) - d) + (1 - v) * (pkGH(i + 1, j) - d);
  }
  function pkGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in pkTileGeo)
    const G = PK.G, gx = clamp((x - G.x0) / PKC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / PKC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = pkGH(ii, jj);
      const nx = (pkGH(ii + 1, jj) - pkGH(ii - 1, jj)) / (2 * PKC), nz = (pkGH(ii, jj + 1) - pkGH(ii, jj - 1)) / (2 * PKC), c = pkCol(G.x0 + ii * PKC, G.z0 + jj * PKC, h, 1 / Math.hypot(nx, 1, nz), G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function pkSlope(x, z) { const a = pkGround(x - 2.5, z), b = pkGround(x + 2.5, z), c = pkGround(x, z - 2.5), d = pkGround(x, z + 2.5); return Math.hypot(b - a, d - c) / 5; }
  function pkTreeline(x, z) { return 186 + 34 * (PK.n1(x * 1.7, z * 1.7) - 0.5); }   // ~45 % of the climb, ragged
  function pkCol(x, z, h, ny, dd) {   // ground colour: forest floor, then reddish granite gravel with olive grass, bare granite on steep slopes, snow fields near the top
    const P = PK, m = P.n3(x, z), tun = sstep(pkTreeline(x, z) - 14, pkTreeline(x, z) + 22, h);
    let r = 0.15 + m * 0.07, g = 0.21 + m * 0.07, b = 0.11 + m * 0.035;
    const gs = sstep(0.42, 0.75, P.n4(x, z)) * (1 - sstep(300, 420, h)) * 0.85;
    r = lerp(r, lerp(0.62 + m * 0.08, 0.5, gs), tun); g = lerp(g, lerp(0.43 + m * 0.05, 0.47, gs), tun); b = lerp(b, lerp(0.33 + m * 0.03, 0.27, gs), tun);
    const st = sstep(0.8, 0.6, ny) * 0.9;
    r = lerp(r, 0.62 + m * 0.06, st); g = lerp(g, 0.53 + m * 0.05, st); b = lerp(b, 0.48 + m * 0.04, st);
    if (h > 330) { const sn = sstep(330, 445, h), c = sstep(0.72 - 0.22 * sn, 0.8 - 0.22 * sn, P.n4(x * 0.8 + 50, z * 0.8)) * (1 - st * 0.7);
      r = lerp(r, 1.04, c); g = lerp(g, 1.06, c); b = lerp(b, 1.12, c); }
    if (dd < 3) { const t = sstep(3, 0, dd) * 0.3; r = lerp(r, 0.6, t); g = lerp(g, 0.5, t); b = lerp(b, 0.42, t); }   // dusty verge
    PKCOL[0] = r; PKCOL[1] = g; PKCOL[2] = b; return PKCOL;
  }
  function pkTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells; deep in the haze, but the top of a tall portrait view looks that far down into the valleys)
    const G = PK.G, L = PK.lk, x = G.x0 + (ti + 0.5) * PKT * PKC, z = G.z0 + (tj + 0.5) * PKT * PKC, d = pkTG(PK.td, x, z);
    if (d < 340) return 1;
    const ex = (x - L.x) / L.rx, ez = (z - L.z) / L.rz; if (ex * ex + ez * ez < 2.6) return 1;
    return d < 470 ? 2 : 0;
  }
  function pkTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex): indexed, normals from the shared grid (no seams between tiles)
    const G = PK.G, m = PKT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * PKT, j0 = tj * PKT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * PKC, z = G.z0 + j * PKC, h = pkGH(i, j);
      let nx = -(pkGH(i + st, j) - pkGH(i - st, j)) / (2 * PKC * st), nz = -(pkGH(i, j + st) - pkGH(i, j - st)) / (2 * PKC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = pkCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);   // 0 up to ~39 deg, 1 from 60 deg (the texture fades out there)
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('steep', new THREE.BufferAttribute(stp, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }
  let pkGTex = null, pkGMean = 0.9, pkATex = null, pkAKey = '';   // the ground and board textures are made once and reused by every Pikes build (the world teardown frees materials, not maps)
  function pkTex() {   // neutral grey grit for the ground (the vertex colours give the hue): mottled, with small light and dark stones; tileable
    if (pkGTex) return pkGTex;
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(515), n = valueNoise2(516, 2), n2 = valueNoise2(517, 1);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { let k = 0.8 + n(i, j) * 0.16 + n2(i, j) * 0.08 + (r() - 0.5) * 0.1; const o = (j * S + i) * 4; d[o] = d[o + 1] = d[o + 2] = clamp(k * 255, 0, 255); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 260; k++) { const px = r() * S, py = r() * S, rr = 0.6 + r() * 1.4; x.fillStyle = r() < 0.5 ? 'rgba(40,40,40,0.35)' : 'rgba(255,255,255,0.3)'; x.beginPath(); x.arc(px, py, rr, 0, TAU); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    let sum = 0; for (let o = 0; o < d.length; o += 4) sum += d[o]; pkGMean = sum / (S * S) / 255;   // steep faces fade to this (pkGroundMat; the few light and dark stones about cancel out)
    return (pkGTex = t);
  }
  function pkGroundMat() {   // terrain tiles: the grit map fades to its mean grey on steep faces (attribute 'steep'), where the top-down UVs would smear it into streaks
    const t = pkTex(), m = new THREE.MeshLambertMaterial({ map: t, vertexColors: true }), mean = pkGMean.toFixed(3);
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float steep;\nvarying float vSteep;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSteep = steep;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vSteep;').replace('#include <map_fragment>',
        '#ifdef USE_MAP\n  vec4 texelColor = mapTexelToLinear( texture2D( map, vUv ) );\n  diffuseColor *= mix( texelColor, vec4( vec3( ' + mean + ' ), 1.0 ), vSteep );\n#endif');
    };
    m.customProgramCacheKey = () => 'pkGround';
    return m;
  }
  function pkAtlas(cps) {   // text boards (8 rows of 1024 x 128): START, CILJ, CP1-CP4 with altitude, the summit sign, the paddock banner
    if (pkATex && pkAKey === cps.join('|')) return pkATex;
    if (pkATex) pkATex.dispose(); pkAKey = cps.join('|');
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 104, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(312, 142, 400, 100); txt('CILJ', 512, 196, 96, '#111', 380);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#d8261e'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      x.beginPath(); x.arc(90, y + 50, 30, 0, TAU); x.fill(); x.beginPath(); x.moveTo(64, y + 64); x.lineTo(116, y + 64); x.lineTo(90, y + 112); x.fill(); x.fillStyle = '#d8261e'; x.beginPath(); x.arc(90, y + 50, 12, 0, TAU); x.fill();
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#fff', 520); });
    x.fillStyle = '#5a3a22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#efe3c8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('PIKES PEAK SUMMIT', 512, 812, 58, '#f3ead6', 900); txt('14,115 FT  ·  4301 m', 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#1d4f9a'; x.fillRect(0, 896, 1024, 128); txt('VZPON NA PIKES PEAK', 512, 964, 84, '#fff', 960);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (pkATex = t);
  }
  function pkPine(g, x, y, z, h, col, R, far) {   // dark conifer: thin trunk (not on the far ones) + three stacked tiers (51-60 vertices)
    const rot = R() * TAU, rr = h * (0.24 + R() * 0.05), ct = [col[0] * 1.3, col[1] * 1.28, col[2] * 1.2];
    if (!far) cone(g, x, y - 0.3, z, h * 0.03 + 0.12, h * 0.3, 3, [0.3, 0.21, 0.14], null, rot);
    cone(g, x, y + h * 0.13, z, rr, h * 0.42, 6, col, ct, rot);
    cone(g, x, y + h * 0.37, z, rr * 0.76, h * 0.38, 6, vary(col, R, 0.08), ct, rot + 0.5);
    cone(g, x, y + h * 0.59, z, rr * 0.5, h * 0.41, 5, vary(col, R, 0.08), ct, rot + 1);
  }
  function pkForest(scen, R, dens, excluded) {   // conifer forest below the treeline, on a jittered grid over the corridor tiles
    const G = PK.G, P = PK, step = 6.6 / Math.sqrt(dens), L = PKT * PKC, maxT = Math.round(15500 * dens);
    const pineCs = [[0.09, 0.2, 0.11], [0.11, 0.24, 0.12], [0.08, 0.18, 0.1], [0.13, 0.26, 0.14], [0.1, 0.22, 0.14]];
    let n = 0;
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
      if (!G.on[tj * G.ntx + ti]) continue;
      const xa = G.x0 + ti * L, za = G.z0 + tj * L;
      for (let zz = za; zz < za + L - 0.01; zz += step) for (let xx = xa; xx < xa + L - 0.01; xx += step) {
        const x = xx + (R() - 0.5) * step * 0.9, z = zz + (R() - 0.5) * step * 0.9, r1 = R(), r2 = R();
        const hd = pkTG(P.td, x, z); if (hd > 205) continue;
        const y = pkGround(x, z), tl = pkTreeline(x, z); if (y > tl + 12) continue;
        const lx = (x - P.lk.x) / P.lk.rx, lz = (z - P.lk.z) / P.lk.rz; if (lx * lx + lz * lz < 1.3) continue;   // not in the reservoir
        let p = (0.35 + 0.6 * sstep(0.3, 0.62, P.n3(x * 1.3 + 100, z * 1.3))) * sstep(tl + 12, tl - 22, y);
        if (hd > 110) p *= 0.65;   // thinner far from the road (rarely in view)
        if (r1 > p) continue;
        const nn = pkNear(x, z); if (nn.i >= 0 && nn.dd < 3) continue;
        if (nn.i >= 0 && nn.dd < 8 && r2 < 0.2) continue;
        if (excluded(x, z) || pkSlope(x, z) > 0.95) continue;
        const hk = lerp(1, 0.45, sstep(tl - 45, tl + 8, y));   // stunted towards the treeline
        pkPine(scen.get(x, z), x, y, z, (7.5 + R() * 6) * hk, vary(pineCs[Math.floor(R() * pineCs.length)], R, 0.14), R, nn.i < 0 || nn.dd > 30);
        if (++n >= maxT) return n;
      }
    }
    return n;
  }

  /* ---- real-course landmarks: the Halfway Picnic Grounds, the Glen Cove Inn, the Bottomless Pit overlook ----
     (K: the build's shared bits, see buildPikes; own random stream, so the rest of the scenery stays where it was) */
  function pkLandmarks(K) {
    const R = rng(9101), { scen, excl, sStart } = K, gy = pkGround, tb = new GB(true), W1 = [1, 1, 1], PI = Math.PI;
    const wood = [0.47, 0.32, 0.19], woodD = [0.31, 0.21, 0.13], stone = [0.55, 0.52, 0.48], stoneT = [0.6, 0.57, 0.52], gravC = [0.33, 0.3, 0.26];
    const carC = [[0.86, 0.86, 0.87], [0.55, 0.13, 0.11], [0.17, 0.25, 0.43], [0.29, 0.31, 0.3], [0.7, 0.62, 0.45], [0.2, 0.37, 0.31]];
    // local frame beyond the barrier at road s on 'side' (interpolated between the samples): at(u, v) -> [x, z], u along the road, v out from the barrier line;
    // dir(a): unit direction a rad from the road's heading towards +v, rot(a): the box rotation that lines a box's length up with it, P(u, v, y): a 3D point
    const fr = (s, side) => { const q = crAt(s), bar = side > 0 ? q.br : q.bl, tx = q.tx, tz = q.tz, ox = q.nx * side, oz = q.nz * side, x0 = q.px + ox * bar, z0 = q.pz + oz * bar;
      const dir = (a) => [tx * Math.cos(a || 0) + ox * Math.sin(a || 0), tz * Math.cos(a || 0) + oz * Math.sin(a || 0)], at = (u, v) => [x0 + tx * u + ox * v, z0 + tz * u + oz * v];
      return { at, dir, rot: (a) => { const d = dir(a); return Math.atan2(d[1], d[0]); }, P: (u, v, y) => { const p = at(u, v); return [p[0], y, p[1]]; } }; };
    const lowest = (F, u, v, a, b) => { let m = 1e9; for (const [p, q] of [[-a, -b], [a, -b], [a, b], [-a, b], [0, 0]]) { const [x, z] = F.at(u + p, v + q); m = Math.min(m, gy(x, z)); } return m; };   // lowest ground under a footprint (half sizes a along u, b along v)
    const clear = (F, u, v, a, b) => { for (const [p, q] of [[-a, -b], [a, -b], [a, b], [-a, b], [0, -b], [0, b], [-a, 0], [a, 0], [0, 0]]) { const [x, z] = F.at(u + p, v + q); if (pkNear(x, z).dd < 1.5 || K.excluded(x, z)) return false; } return true; };   // off the road and clear of the other scenery
    const bx = (F, u, v, y, su, sy, sv, col, top, a) => { const [x, z] = F.at(u, v); box(scen.get(x, z), x, y, z, su, sy, sv, F.rot(a), col, top, true); };   // box in the frame (su along the direction a, bottom at y), in its own chunk
    const quad = (a, b, c, d, col, inn) => scen.get(a[0], a[2]).quadO(a, b, c, d, col, inn);
    const ex = (F, u, v, r) => { const [x, z] = F.at(u, v); excl.push({ x, z, r }); };   // trees and later crowds keep off
    const guy = (F, u, v, a, y) => { const [x, z] = F.at(u, v), [fx, fz] = F.dir(a); crowdPut(K.CR, x, y == null ? gy(x, z) : y, z, fx, fz, { col: K.fans[Math.floor(R() * K.fans.length)] }, 1); };   // a visitor facing a
    const car = (F, u, v, a) => { const [x, z] = F.at(u, v); K.carPk(x, z, F.rot(a), vary(carC[Math.floor(R() * carC.length)], R, 0.15)); };
    const gravel = (side, s0, s1, v0, v1, col) => {   // gravel pull-out laid on the ground (2 m grid, 6 cm up); its outer ring takes the ground's own colour, so the edge fades out
      const nu = Math.max(2, Math.round((s1 - s0) / 2)), nv = Math.max(2, Math.round((v1 - v0) / 2)), V = [];
      for (let b = 0; b <= nv; b++) for (let a = 0; a <= nu; a++) { const [x, z] = fr(s0 + (s1 - s0) * a / nu, side).at(0, v0 + (v1 - v0) * b / nv), k = 0.93 + R() * 0.12, gc = pkGCol(x, z);
        V.push([[x, gy(x, z) + 0.06, z], a && b && a < nu && b < nv ? [col[0] * k, col[1] * k, col[2] * k] : [gc[0] * pkGMean, gc[1] * pkGMean, gc[2] * pkGMean]]); }
      for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) { const p = V[b * (nu + 1) + a], q = V[b * (nu + 1) + a + 1], r = V[(b + 1) * (nu + 1) + a + 1], d = V[(b + 1) * (nu + 1) + a];
        scen.get(p[0][0], p[0][2]).quadUp(p[0], q[0], r[0], d[0], [p[1], q[1], r[1], d[1]]); }
    };
    const tq = (cx, cy, cz, fx, fz, W, H, r, tilt, rb) => {   // text board (bottom centre cx, cy, cz) facing (fx, fz), its top leaning back by tilt; r: atlas rect [x0, y0, x1, y1] (px) of the front, rb: of the back (else the front again, readable from behind)
      const ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), ux = fz, uz = -fx, kx = -fx * H * sa, ky = H * ca, kz = -fz * H * sa;
      for (const f of [1, -1]) { const q = f > 0 || !rb ? r : rb, u0 = q[0] / 1024, u1 = q[2] / 1024, v1 = 1 - q[1] / 1024, v0 = 1 - q[3] / 1024, hw = W / 2 * f, ox = fx * ca * 0.03 * f, oy = sa * 0.03 * f, oz = fz * ca * 0.03 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        tb.quadO(A, B, C, D, W1, [cx + kx / 2 - fx * ca * f, cy + ky / 2 - sa * f, cz + kz / 2 - fz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const sign = (F, u, v, a, W, H, r) => {   // brown sign facing a (rad from the road's heading; pi + ~0.35: the arriving cars, turned a little towards the road), leaning back so the high cameras read it; a short post under its bottom edge and a tall one behind its top edge at each end
      const [x, z] = F.at(u, v), [fx, fz] = F.dir(a), y = lowest(F, u, v, W / 2, 0.6), g = scen.get(x, z), tl = 0.6, h0 = 0.75, lx = H * Math.sin(tl) + 0.08, pc = [0.3, 0.2, 0.12];
      for (const o of [-W * 0.38, W * 0.38]) { const px = x + fz * o, pz = z - fx * o; box(g, px - fx * 0.08, y - 0.3, pz - fz * 0.08, 0.14, h0 + 0.3, 0.14, Math.atan2(fz, fx), pc, null, true); box(g, px - fx * lx, y - 0.3, pz - fz * lx, 0.14, h0 + H * Math.cos(tl) + 0.36, 0.14, Math.atan2(fz, fx), pc, null, true); }
      tq(x, y + h0, z, fx, fz, W, H, r, tl); ex(F, u, v, W / 2 + 1.5);
    };
    const table = (F, u, v, a, y) => {   // wooden picnic table: top, two benches, two legs and a bench bearer at each end (2 m long; a: its heading from the road's)
      y = y == null ? lowest(F, u, v, 1, 0.8) - 0.04 : y; const ca = Math.cos(a), sa = Math.sin(a), P = (p, q) => [u + p * ca - q * sa, v + p * sa + q * ca], c = vary(wood, R, 0.12);   // p along the table, q across
      bx(F, u, v, y + 0.7, 2.0, 0.07, 0.78, c, [c[0] * 1.15, c[1] * 1.15, c[2] * 1.12], a);
      for (const q of [-0.66, 0.66]) { const [pu, pv] = P(0, q); bx(F, pu, pv, y + 0.42, 2.0, 0.05, 0.3, c, null, a); }
      for (const p of [-0.72, 0.72]) { let [pu, pv] = P(p, 0); bx(F, pu, pv, y + 0.34, 0.08, 0.07, 1.62, woodD, null, a); for (const q of [-0.36, 0.36]) { [pu, pv] = P(p, q); bx(F, pu, pv, y, 0.08, 0.72, 0.09, woodD, null, a); } }
    };
    const pine = (F, u, v, h) => { const [x, z] = F.at(u, v); pkPine(scen.get(x, z), x, gy(x, z), z, h, vary([0.1, 0.22, 0.12], R, 0.14), R); };

    /* Halfway Picnic Grounds (in the pines, on the flatter side): the entry sign, a gravel pull-out with parked cars, picnic tables and grills, an open shelter */
    {
      const s0 = sStart + 1000, fl = (sd) => { const p = K.onSide(s0, sd, 14); return Math.abs(gy(p[0], p[1]) - T.hy[p[2]]); }, side = fl(1) <= fl(-1) ? 1 : -1, at = (d) => fr(s0 + d, side);
      sign(at(-30), 0, 3.1, PI + 0.35, 4.4, 1.1, [0, 0, 1024, 256]);
      gravel(side, s0 - 26, s0 - 4, 1.6, 8.4, gravC);
      for (const d of [-20.5, -17.3, -12.8]) { const F = at(d); if (clear(F, 0, 4.4, 1.1, 2.3)) car(F, 0, 4.4, PI / 2 + (R() - 0.5) * 0.12); }
      for (const [d, v, a] of [[2.5, 3.6, 0.25], [7.5, 6.9, -0.2], [0.4, 9.6, 0.1], [12.2, 3.3, -0.35], [-6, 12.2, 0.45]]) { const F = at(d); if (clear(F, 0, v, 1.3, 1.3)) table(F, 0, v, a); }
      for (const [d, v] of [[5.2, 2.3], [-2.6, 6.8]]) { const F = at(d), [x, z] = F.at(0, v), y = gy(x, z), g = scen.get(x, z); box(g, x, y - 0.1, z, 0.1, 0.92, 0.1, F.rot(), [0.2, 0.2, 0.21]); box(g, x, y + 0.8, z, 0.62, 0.16, 0.44, F.rot(0.4), [0.12, 0.12, 0.13]); }   // pedestal grills
      { const F = at(-8); bx(F, 0, 2.3, gy(...F.at(0, 2.3)) - 0.1, 0.85, 1.15, 0.7, [0.24, 0.31, 0.25], [0.3, 0.37, 0.31]); }   // bear-proof bin
      { const F = at(19), vs = 6.4;   // open shelter: concrete slab, six posts, eave beams, a shingle gable roof over two tables
        if (clear(F, 0, vs, 4.2, 2.9)) { const y = lowest(F, 0, vs, 3.7, 2.4), L = 7, D = 4.4, H = 2.45, [x, z] = F.at(0, vs);
          bx(F, 0, vs, y - 0.2, L + 0.5, 0.36, D + 0.5, [0.6, 0.59, 0.56]);
          for (const p of [-L / 2, 0, L / 2]) for (const q of [-D / 2, D / 2]) bx(F, p, vs + q, y + 0.1, 0.2, H, 0.2, wood);
          for (const q of [-D / 2, D / 2]) bx(F, 0, vs + q, y + H, L + 0.5, 0.24, 0.26, woodD);
          gable(scen.get(x, z), x, y + H + 0.22, z, L + 1.1, D + 1.4, 1.5, F.rot(), [0.27, 0.2, 0.15], wood);
          table(F, -1.7, vs, PI / 2, y + 0.16); table(F, 1.7, vs, PI / 2, y + 0.16); ex(F, 0, vs, 6.5); } }
      for (const [d, v, h] of [[-9, 15.5, 11], [5.5, 14, 12.5], [11.5, 13.5, 10], [28.5, 12, 11.5], [-25, 13, 9.5], [-14, 12.2, 8]]) pine(at(d), 0, v, h);
      guy(at(3.4), 0, 5.0, -PI / 2 + 0.4); guy(at(1.6), 0, 2.2, PI / 2); guy(at(-15.1), 0, 2.4, PI / 2 + 0.6); guy(at(17.6), 0, 5.1, 0.3); guy(at(20.5), 0, 7.4, PI + 0.2); guy(at(8.8), 0, 5.3, PI);
      ex(at(0), 0, 7, 18); ex(at(-14), 0, 5, 13);
    }

    /* Glen Cove Inn, on the outside of the hairpin just below the treeline (the mountain rises behind it, the car braking for the hairpin looks straight at it):
       a log lodge on a stone base, a green metal roof, a covered porch facing the road, a stone chimney, its sign; the gravel car park along the exit */
    const hp = T.corners.find(c => c.sev >= 3 && Math.abs((c.i0 + c.i1) / 2 * T.ds - sStart - 2681) < 40);
    if (hp) {
      const sm = (hp.i0 + hp.i1) / 2 * T.ds, side = -hp.dir, F = fr(sm, side), P = F.P, at = (d) => fr(sm + d, side), L = 13, D = 8, vF = 4.9, vc = vF + D / 2, [cx, cz] = F.at(0, vc);
      if (clear(F, 0, 7.7, L / 2 + 1.2, 5.6)) {
        const yf = Math.max(...[[-L / 2, vF - 2.8], [L / 2, vF - 2.8], [-L / 2, vF], [L / 2, vF]].map(([u, v]) => gy(...F.at(u, v)))) + 0.45, yb = lowest(F, 0, vc - 1.4, L / 2 + 1, D / 2 + 1.4) - 0.3;
        const logA = [0.5, 0.33, 0.19], logB = [0.43, 0.28, 0.16], y0 = yf + 3.42, h = 2.7, ov = 0.75, rfA = [0.2, 0.38, 0.28], rfB = [0.17, 0.33, 0.24], stC = [0.52, 0.5, 0.47], trim = [0.84, 0.79, 0.66], glass = [0.16, 0.2, 0.25];
        bx(F, 0, vc, yb, L + 0.5, yf - yb + 0.08, D + 0.5, stone, stoneT);   // stone base (dug into the slope at the back)
        bx(F, 0, vc, yf, L - 0.1, 3.2, D - 0.1, [0.74, 0.68, 0.56]);   // chinking between the logs
        for (let k = 0; k < 8; k++) { const y = yf + 0.06 + k * 0.4, c = k % 2 ? logA : logB;   // log walls: the side walls' logs half a log lower, all crossing at the corners
          for (const q of [-1, 1]) { bx(F, 0, vc + q * D / 2, y, L + 0.8, 0.34, 0.3, c); bx(F, q * L / 2, vc, y - 0.2, 0.3, 0.34, D + 0.8, vary(c, R, 0.06)); } }
        // green metal roof: sheets in two shades (the seams), closed gable ends
        const n = Math.round((L + 2 * ov) / 0.75), kk = h / (D / 2), ye = y0 - ov * kk, inn = P(0, vc, y0);
        for (let q = 0; q < n; q++) { const a = -L / 2 - ov + (L + 2 * ov) * q / n, b = -L / 2 - ov + (L + 2 * ov) * (q + 1) / n, c = q % 2 ? rfA : rfB;
          for (const sg of [-1, 1]) quad(P(a, vc + sg * (D / 2 + ov), ye), P(b, vc + sg * (D / 2 + ov), ye), P(b, vc, y0 + h), P(a, vc, y0 + h), c, inn); }
        for (const sg of [-1, 1]) scen.get(cx, cz).triO(P(sg * L / 2, vc - D / 2, y0 - 0.25), P(sg * L / 2, vc + D / 2, y0 - 0.25), P(sg * L / 2, vc, y0 + h - 0.06), logB, inn);
        // porch: stone-sided deck, posts, a railing, a lean-to roof under the eaves
        bx(F, 0, vF - 1.4, yb, L - 0.4, yf - yb, 2.8, stone, [0.52, 0.38, 0.24]);
        for (let k = 0; k < 5; k++) bx(F, -L / 2 + 0.5 + k * (L - 1) / 4, vF - 2.6, yf, 0.22, 2.3, 0.22, wood);
        for (const k of [0, 3]) bx(F, -L / 2 + 0.5 + (k + 0.5) * (L - 1) / 4, vF - 2.6, yf + 0.86, (L - 1) / 4, 0.09, 0.09, woodD);
        quad(P(-L / 2 - 0.1, vF - 2.95, yf + 2.3), P(L / 2 + 0.1, vF - 2.95, yf + 2.3), P(L / 2 + 0.1, vF, yf + 2.95), P(-L / 2 - 0.1, vF, yf + 2.95), rfA, P(0, vF - 1.4, yf));
        bx(F, 0, vF - 2.6, yf + 2.08, L - 0.5, 0.22, 0.2, woodD);
        // windows and the door on the front, a window in the far gable
        for (const u of [-4.7, -2.3, 2.3, 4.7]) { bx(F, u, vF - 0.17, yf + 0.75, 1.4, 1.25, 0.08, trim); bx(F, u, vF - 0.21, yf + 0.87, 1.1, 1.0, 0.06, glass); }
        bx(F, 0, vF - 0.17, yf, 1.4, 2.25, 0.08, trim); bx(F, 0, vF - 0.21, yf, 1.05, 2.05, 0.06, [0.36, 0.2, 0.12]);
        bx(F, -L / 2 - 0.17, vc, yf + 0.9, 0.08, 1.2, 1.3, trim); bx(F, -L / 2 - 0.21, vc, yf + 1.0, 0.06, 1.0, 1.05, glass);
        // stone chimney at the near gable end, up through the eaves
        bx(F, L / 2 + 0.6, vc, yb, 1.1, yf + 2.4 - yb, 2.0, stC, stC); bx(F, L / 2 + 0.52, vc, yf + 2.4, 0.84, y0 + h + 0.9 - yf - 2.4, 1.2, stC); bx(F, L / 2 + 0.52, vc, y0 + h + 0.9, 1.0, 0.14, 1.36, [0.3, 0.29, 0.28]);
        K.CR.block(cx, cz, L + 1.2, D + 0.8, F.rot());   // (no spectator inside)
        guy(F, -3.4, vF - 1.3, -PI / 2 + 0.3, yf); guy(F, 3.1, vF - 1.6, -PI / 2 - 0.5, yf); guy(F, 1.2, vF - 2.3, -PI / 2 + 0.2, yf);
        if (clear(F, -9.6, 2.2, 2.6, 0.5)) sign(F, -9.6, 2.2, -PI / 2 - 0.3, 4.4, 1.1, [0, 256, 1024, 512]);   // facing the cars braking for the hairpin
        ex(F, 0, vc - 1.2, 12);
      }
      // the car park along the exit, where the mountain is still flat enough
      gravel(side, sm + 29, sm + 63, 2.5, 8.8, gravC);
      for (const d of [34, 37.2, 40.4, 46.6, 49.8, 56]) { const Fc = at(d); if (clear(Fc, 0, 4.9, 1.1, 2.3)) car(Fc, 0, 4.9, PI / 2 + (R() - 0.5) * 0.12); }
      guy(at(43.6), 0, 3.0, -0.4); guy(at(44.2), 0, 4.2, -0.6); guy(at(31), 0, 5.5, PI - 0.3);
      ex(at(38), 0, 5, 9.5); ex(at(54), 0, 5, 9.5);
    }

    /* the Bottomless Pit overlook on the ridge, on the side where the ground falls away: a gravel pull-out, a low dry-stone wall along its edge,
       a coin telescope, an interpretive board, visitors looking out over the drop */
    {
      const s0 = sStart + 4462, lo = (sd) => { const p = K.onSide(sStart + 4466, sd, 20); return gy(p[0], p[1]) - T.hy[p[2]]; }, side = lo(1) <= lo(-1) ? 1 : -1, at = (d) => fr(s0 + d, side), wc = [0.56, 0.5, 0.46];
      gravel(side, s0 - 17, s0 + 15, 1.6, 6.8, [0.5, 0.45, 0.4]);
      for (let d = -15; d < 13;) { const l = 0.85 + R() * 0.5, F = at(d + l / 2), y = lowest(F, 0, 7.0, l / 2, 0.32);   // the wall: big blocks, then a course of smaller ones on top
        bx(F, 0, 7.0, y - 0.3, l, 0.72 + R() * 0.08, 0.66, vary(wc, R, 0.2), null, (R() - 0.5) * 0.08); d += l + 0.03; }
      for (let d = -14.7; d < 12.6;) { const l = 0.5 + R() * 0.45, F = at(d + l / 2), y = lowest(F, 0, 7.0, l / 2, 0.25);
        bx(F, 0, 7.0 + (R() - 0.5) * 0.08, y + 0.4, l, 0.24 + R() * 0.1, 0.5, vary(wc, R, 0.22), null, (R() - 0.5) * 0.2); d += l + 0.06 + R() * 0.1; }
      { const F = at(2.5), [x, z] = F.at(0, 5.9), y = gy(x, z), r = F.rot(PI / 2), [fx, fz] = F.dir(PI / 2), g = scen.get(x, z);   // coin telescope on a post, looking out
        box(g, x, y - 0.2, z, 0.7, 0.32, 0.7, r, [0.6, 0.6, 0.58]); cyl(g, x, y + 0.1, z, 0.07, 1.0, 6, [0.22, 0.3, 0.28]);
        box(g, x, y + 1.06, z, 0.6, 0.34, 0.38, r, [0.16, 0.5, 0.42], [0.2, 0.56, 0.47], false); box(g, x - fx * 0.34, y + 1.12, z - fz * 0.34, 0.1, 0.22, 0.42, r, [0.08, 0.08, 0.09]);
        box(g, x + fx * 0.33, y + 1.1, z + fz * 0.33, 0.08, 0.26, 0.34, r, [0.1, 0.12, 0.14]); }
      { const F = at(-3.5), [x, z] = F.at(0, 5.2), y = gy(x, z), [fx, fz] = F.dir(-PI / 2), g = scen.get(x, z);   // interpretive board on a stone plinth, a lectern read from the pull-out
        box(g, x - fx * 0.45, y - 0.3, z - fz * 0.45, 0.9, 0.7, 2.7, F.rot(PI / 2), stone, stoneT);
        for (const o of [-0.8, 0.8]) box(g, x + fz * o - fx * 0.45, y + 0.3, z - fx * o - fz * 0.45, 0.12, 0.84, 0.12, 0, woodD);
        tq(x, y + 0.8, z, fx, fz, 2.4, 1.2, [0, 512, 512, 768], 0.85, [512, 512, 1024, 640]); }
      for (const d of [-12.5, -7]) { const F = at(d); if (clear(F, 0, 3.7, 2.3, 1.1)) car(F, 0, 3.7, (R() - 0.5) * 0.06); }   // parked along the wall
      guy(at(5), 0, 6.1, PI / 2); guy(at(6.3), 0, 6.0, PI / 2 + 0.35); guy(at(9.4), 0, 6.1, PI / 2 - 0.2); guy(at(2.5), 0, 5.2, PI / 2); guy(at(-3.3), 0, 4.4, PI / 2);
      sign(fr(s0 - 40, -side), 0, 3.1, PI + 0.35, 4.4, 1.1, [512, 640, 1024, 768]);   // its name on the near side, where the chase camera still sees it
      ex(at(0), 0, 4, 17);
    }

    /* a small brown sign at the Devil's Playground (on the side where it stands closer to the road) */
    { const s0 = sStart + 4044, i = T.idx(s0), side = T.bl[i] <= T.br[i] ? -1 : 1; sign(fr(s0, side), 0, 3.1, PI + 0.35, 4.4, 1.1, [0, 768, 1024, 1024]); }

    /* the text boards: one canvas atlas (4 rows of 1024 x 256), one mesh */
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const c2 = cv.getContext('2d'), cream = '#efe3c6';
    const txt = (s, x, y, px, col, w) => { c2.fillStyle = col; c2.font = '700 ' + px + 'px Georgia, "Times New Roman", serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(s, x, y, w); };
    const plank = (x0, y0, w, h, col) => { c2.fillStyle = col; c2.fillRect(x0, y0, w, h); c2.strokeStyle = 'rgba(0,0,0,0.13)'; c2.lineWidth = 3;   // wood with a little grain
      for (let k = 0; k < 14; k++) { const y = y0 + R() * h; c2.beginPath(); c2.moveTo(x0, y); c2.bezierCurveTo(x0 + w * 0.3, y + (R() - 0.5) * 12, x0 + w * 0.7, y + (R() - 0.5) * 12, x0 + w, y + (R() - 0.5) * 8); c2.stroke(); } };
    const board = (y0) => { plank(0, y0, 1024, 256, '#5b3b21'); c2.strokeStyle = cream; c2.lineWidth = 10; c2.strokeRect(16, y0 + 16, 992, 224); };
    const ft = (m) => String(Math.round(m * 3.28084)).replace(/\B(?=(\d{3})+(?!\d))/g, ','), alt = (d) => Math.round(T.altAt ? T.altAt(T.hy[T.idx(sStart + d)]) : 0);
    board(0); c2.fillStyle = cream;   // HALFWAY PICNIC GROUNDS, with a picnic table pictogram
    c2.fillRect(62, 96, 150, 16); c2.fillRect(48, 140, 178, 12); for (const [a, b] of [[88, 150], [186, 124]]) { c2.beginPath(); c2.moveTo(a, 110); c2.lineTo(a + 12, 110); c2.lineTo(b + 12, 196); c2.lineTo(b, 196); c2.fill(); }
    txt('HALFWAY', 612, 96, 118, cream, 740); txt('PICNIC GROUNDS', 612, 186, 70, cream, 740);
    board(256); txt('GLEN COVE', 512, 256 + 104, 130, cream, 930); txt('INN  ·  GIFTS  ·  SNACKS', 512, 256 + 196, 50, cream, 860);
    plank(0, 512, 512, 256, '#3c2a1a'); c2.fillStyle = '#e8dcc0'; c2.fillRect(18, 530, 476, 220); c2.fillStyle = '#2f4a3a'; c2.fillRect(18, 530, 476, 60); txt('BOTTOMLESS PIT', 256, 562, 42, cream, 440);   // interpretive board
    c2.fillStyle = '#9cc2dc'; c2.fillRect(34, 604, 200, 130); c2.fillStyle = '#8a6a55'; c2.beginPath(); c2.moveTo(34, 734); c2.lineTo(34, 640); c2.lineTo(92, 626); c2.lineTo(118, 648); c2.lineTo(130, 724); c2.lineTo(150, 728); c2.lineTo(168, 650); c2.lineTo(234, 612); c2.lineTo(234, 734); c2.fill();
    c2.fillStyle = '#5d5048'; for (let k = 0; k < 6; k++) c2.fillRect(252, 612 + k * 18, k === 5 ? 120 : 220 - (k % 2) * 30, 8);
    txt(alt(4466) + ' m', 360, 730, 30, '#2f4a3a', 220);
    plank(512, 512, 512, 128, '#4a3220');   // the back of the interpretive board
    plank(512, 640, 512, 128, '#5b3b21'); c2.strokeStyle = cream; c2.lineWidth = 6; c2.strokeRect(520, 648, 496, 112); txt('BOTTOMLESS PIT', 768, 690, 58, cream, 470); txt('OVERLOOK  ·  ' + alt(4466) + ' m', 768, 738, 28, cream, 440);
    board(768); txt("DEVIL'S PLAYGROUND", 512, 768 + 100, 92, cream, 950); txt('ELEV. ' + ft(alt(4050)) + ' FT  ·  ' + alt(4050) + ' m', 512, 768 + 194, 48, cream, 860);
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; K.out.ownTex.push(tx);
    if (!tb.empty) { const m = new THREE.Mesh(tb.geometry(), new THREE.MeshLambertMaterial({ map: tx })); m.receiveShadow = true; m.matrixAutoUpdate = false; K.root.add(m); }
  }

  /* ---- the cog railway at the summit: the station beside the summit house, a train at the platform, the track down the east face ----
     (own random stream) */
  function pkCog(K) {
    const R = rng(9202), { scen, excl, sFin } = K, ic = T.idx(sFin + 62), hd = T.hd[ic] + Math.PI, tx = Math.cos(hd), tz = Math.sin(hd), nx = -tz, nz = tx, o = T.br[ic] + 3.8;
    // station frame: on the outside of the last bend, straight along the road's heading there (in view ahead while the cars brake); u runs down the line
    // (from the buffer stop by the car park towards the south), v to its right (towards the road); the platform is on the far side
    const at = (u, v) => [T.px[ic] + T.nx[ic] * o + tx * u + nx * v, T.pz[ic] + T.nz[ic] * o + tz * u + nz * v];
    const uB = -17, uP0 = -16.5, uP1 = 17, kS = uP1 - uB + 3;   // buffer stop, platform ends, the last level sample of the line
    // the line (1 m steps): straight and level through the station, then steered down the east face past the summit sign, parallel to the road
    // below it and slowly drifting away (in view while the cars climb the last straight); it ends where it would meet the road or another landmark
    const X = [], Z = [], Hd = [], sp = K.CR.sp;
    const blocked = (x, z) => { if (pkNear(x, z).dd < 1.5) return true;   // the road, a hard exclusion (huts, pads, car parks; crowd areas only where somebody stands), a spectator
      for (const e of excl) if (!K.crSoft.has(e) && (x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true;
      const cx = Math.floor(x / 0.8), cz = Math.floor(z / 0.8);
      for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { const L = sp.get((cx + a) + ',' + (cz + b)); if (L) for (let q = 0; q < L.length; q += 2) if ((x - L[q]) ** 2 + (z - L[q + 1]) ** 2 < 4) return true; }
      return false; };
    { let [x, z] = at(uB, 0), h = hd;
      for (let d = 0; d <= 150; d++) { const ex = -Math.sin(h) * 1.8, ez = Math.cos(h) * 1.8;
        if (d > kS && [0, 1, -1].some(a => blocked(x + ex * a, z + ez * a))) break;
        X.push(x); Z.push(z); Hd.push(h); if (d > kS) { const q = pkNear(x, z), j = T.idx(q.i * T.ds - 12), L = 27 + 0.12 * (d - kS), a = Math.atan2(T.pz[j] + T.nz[j] * L - z, T.px[j] + T.nx[j] * L - x);
          h += clamp(Math.atan2(Math.sin(a - h), Math.cos(a - h)), -1 / 30, 1 / 30); }
        x += Math.cos(h); z += Math.sin(h); } }
    // its height: level through the station, then the ground under the rails smoothed from above: dips are bridged, humps followed
    const n = X.length, gC = new Float32Array(n), gM = new Float32Array(n), Y = new Float32Array(n);
    for (let k = 0; k < n; k++) { const ex = -Math.sin(Hd[k]) * 0.6, ez = Math.cos(Hd[k]) * 0.6; gC[k] = pkGround(X[k], Z[k]); gM[k] = Math.max(gC[k], pkGround(X[k] + ex, Z[k] + ez), pkGround(X[k] - ex, Z[k] - ez)); }
    const avg = (A, k, W) => { let s = 0, c = 0; W = Math.min(W, n - 1 - k); for (let j = k - W; j <= k + W; j++) { s += A[j]; c++; } return s / c; };
    let lev = -1e9; for (let k = 0; k <= kS; k++) lev = Math.max(lev, gM[k] + 0.22);
    for (let k = 0; k < n; k++) Y[k] = k <= kS ? lev : gM[k] + 0.22;
    for (let pass = 0; pass < 14; pass++) { const Y2 = Y.slice(); for (let k = kS + 1; k < n; k++) Y[k] = Math.max(avg(Y2, k, 4), gM[k] + 0.22); }
    const yR = lev + 0.3, yP = yR + 0.4;   // rail top, platform top

    /* ---- the track: ballast on a low embankment, sleepers, two running rails and the raised rack rail between them ---- */
    const Pt = (k, o, y) => [X[k] - Math.sin(Hd[k]) * o, Y[k] + y, Z[k] + Math.cos(Hd[k]) * o];
    const bal = [0.5, 0.48, 0.46], emb = [0.56, 0.41, 0.33], tieC = [0.34, 0.28, 0.23], railC = [0.4, 0.39, 0.38], railT = [0.74, 0.74, 0.76], rackC = [0.28, 0.28, 0.3];
    const foot = (k, sd) => { const p = Pt(k, sd * (1.3 + 1.4 * Math.max(0.35, Y[k] - gC[k])), 0); p[1] = pkGround(p[0], p[2]) - 0.3; return p; };
    for (let k = 0; k + 1 < n; k += 2) { const j = Math.min(n - 1, k + 2), g = scen.get(X[k], Z[k]), a0 = Pt(k, -1.3, 0), a1 = Pt(k, 1.3, 0), b0 = Pt(j, -1.3, 0), b1 = Pt(j, 1.3, 0), inn = Pt(k + 1, 0, -2);
      const ec = vary(emb, R, 0.06); g.quadO(a0, a1, b1, b0, bal, inn); g.quadO(a0, b0, foot(j, -1), foot(k, -1), ec, inn); g.quadO(a1, foot(k, 1), foot(j, 1), b1, ec, inn);
      for (const [o, hw, y0, y1, c, ct] of [[-0.5, 0.05, 0.14, 0.3, railC, railT], [0.5, 0.05, 0.14, 0.3, railC, railT], [0, 0.09, 0.12, 0.4, rackC, railC]]) {
        const ri = Pt(k + 1, o, y0);
        g.quadO(Pt(k, o - hw, y1), Pt(k, o + hw, y1), Pt(j, o + hw, y1), Pt(j, o - hw, y1), ct, ri);
        for (const sd of [-1, 1]) g.quadO(Pt(k, o + sd * hw, y0), Pt(j, o + sd * hw, y0), Pt(j, o + sd * hw, y1), Pt(k, o + sd * hw, y1), c, ri); } }
    for (let k = 0; k < n; k++) { const g = scen.get(X[k], Z[k]), c = vary(tieC, R, 0.2), ca = Math.cos(Hd[k]) * 0.12, sa = Math.sin(Hd[k]) * 0.12, inn = Pt(k, 0, -0.5);   // sleepers (top and long sides)
      const q = (a, o, y) => { const p = Pt(k, o, y); return [p[0] + ca * a, p[1], p[2] + sa * a]; };
      g.quadO(q(-1, -1.05, 0.14), q(1, -1.05, 0.14), q(1, 1.05, 0.14), q(-1, 1.05, 0.14), c, inn); for (const a of [-1, 1]) g.quadO(q(a, -1.05, -0.03), q(a, 1.05, -0.03), q(a, 1.05, 0.14), q(a, -1.05, 0.14), c, inn); }

    /* ---- the station: a raised concrete platform beside the track, a slim canopy on posts, benches, steps up at the top end, a buffer stop ---- */
    const box2 = (u, v, y, su, sy, sv, col, colTop) => { const [x, z] = at(u, v); box(scen.get(x, z), x, y, z, su, sy, sv, hd, col, colTop, true); };   // a box in the station frame (u, v: centre; y: bottom)
    const gLow = (u0, u1, v0, v1) => { let m = 1e9; for (let u = u0; u <= u1 + 0.01; u += (u1 - u0) / 6) for (const v of [v0, (v0 + v1) / 2, v1]) { const [x, z] = at(u, v); m = Math.min(m, pkGround(x, z)); } return m - 0.3; };
    const conc = [0.62, 0.61, 0.58], concT = [0.76, 0.75, 0.72], steel = [0.3, 0.32, 0.34], uc = (uP0 + uP1) / 2, yb = gLow(uP0 - 2, uP1, -5.8, -1.65), uC0 = uB + 3, uC1 = uB + 31;
    box2(uc, -3.72, yb, uP1 - uP0, yP - yb, 4.15, conc, concT); box2(uc, -1.97, yP, uP1 - uP0 - 0.3, 0.02, 0.3, [0.95, 0.78, 0.15]);   // the slab, a yellow line along its edge
    for (let q = 0; q < 8; q++) { const h = yP - 0.25 * (q + 1); if (h > yb + 0.1) box2(uP0 - 0.2 - 0.4 * q, -3.75, yb, 0.4, h - yb, 3.4, conc, concT); }   // steps down at the top end
    for (let u = uP0 + 0.2; u <= uP1 - 0.1; u += 2.4) box2(u, -5.7, yP, 0.07, 1.05, 0.07, steel); box2(uc, -5.7, yP + 1.0, uP1 - uP0 - 0.3, 0.07, 0.08, steel);   // railing on the far side
    for (let u = uC0 + 0.6; u < uC1; u += 6.8) box2(u, -4.9, yP, 0.2, 3.5, 0.2, [0.2, 0.26, 0.24]);
    { const [x, z] = at((uC0 + uC1) / 2, -3.95); box2((uC0 + uC1) / 2, -3.95, yP + 3.42, uC1 - uC0, 0.14, 4.3, [0.2, 0.26, 0.24]); gable(scen.get(x, z), x, yP + 3.56, z, uC1 - uC0, 4.3, 0.4, hd, [0.24, 0.38, 0.31], [0.2, 0.26, 0.24]); }   // canopy: a low green roof
    for (let u = uC0 + 4; u < uC1 - 2; u += 6.8) box2(u, -5.1, yP, 1.8, 0.45, 0.45, [0.42, 0.3, 0.2]);   // benches
    for (let q = 0; q < 9; q++) { const [x, z] = at(uC0 + 1 + R() * (uC1 - uC0 - 2), -2.4 - R() * 2); crowdPut(K.CR, x, yP, z, nx, nz, { col: K.fans[Math.floor(R() * K.fans.length)] }, 1); }   // passengers on the platform, watching the cars
    { const yb2 = gLow(uB - 2, uB - 0.3, -1.5, 1.5); box2(uB - 1.3, 0, yb2, 1.4, yR + 0.3 - yb2, 3, conc, concT); box2(uB - 0.5, 0, yR - 0.2, 0.3, 1.1, 2.4, [0.86, 0.14, 0.1], [0.95, 0.95, 0.92]); }   // buffer stop

    /* ---- the train: two red railcars with a white window band, sloped cab ends, roof boxes (no pantograph: diesel) ---- */
    const red = [0.8, 0.13, 0.1], wht = [0.94, 0.93, 0.9], win = [0.12, 0.15, 0.2], roofC = [0.62, 0.14, 0.12], dark = [0.13, 0.13, 0.14];
    const car = (u0, dir) => {   // a 15 m railcar centred at u0, its cab (sloped end) towards dir
      const L = 7.5, F = (a, y, b) => { const [x, z] = at(u0 + a * dir, b); return [x, yR + y, z]; }, g = scen.get(...at(u0, 0));
      const layer = (poly, bw, col) => {   // a side profile (a, y) extruded across the car
        const ca = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length, inn = F(ca, cy, 0);
        for (const b of [-bw, bw]) for (let q = 1; q + 1 < poly.length; q++) g.triO(F(poly[0][0], poly[0][1], b), F(poly[q][0], poly[q][1], b), F(poly[q + 1][0], poly[q + 1][1], b), col, inn);
        for (let q = 0; q < poly.length; q++) { const p0 = poly[q], p1 = poly[(q + 1) % poly.length]; g.quadO(F(p0[0], p0[1], -bw), F(p1[0], p1[1], -bw), F(p1[0], p1[1], bw), F(p0[0], p0[1], bw), col, inn); }
      };
      layer([[-L, 0.95], [L - 0.15, 0.95], [L, 1.25], [L, 1.95], [-L, 1.95]], 1.35, red);
      layer([[-L, 1.95], [L, 1.95], [L - 0.5, 2.95], [-L, 2.95]], 1.35, wht);
      layer([[-L, 2.95], [L - 0.5, 2.95], [L - 0.75, 3.3], [-L, 3.3]], 1.35, red);
      layer([[-L + 0.1, 3.3], [L - 0.75, 3.3], [L - 1.0, 3.45], [-L + 0.1, 3.45]], 1.22, roofC);
      const inn = F(0, 2, 0);
      for (const b of [-1.37, 1.37]) for (let a = -L + 0.5; a < L - 1.5; a += 1.55) g.quadO(F(a, 2.1, b), F(a + 1.2, 2.1, b), F(a + 1.2, 2.8, b), F(a, 2.8, b), win, inn);   // side windows
      g.quadO(F(L - 0.05, 2.07, -1.1), F(L - 0.05, 2.07, 1.1), F(L - 0.44, 2.85, 1.1), F(L - 0.44, 2.85, -1.1), win, inn);   // windscreen
      for (const b of [-0.85, 0.85]) g.quadO(F(L + 0.02, 1.4, b - 0.14), F(L + 0.02, 1.4, b + 0.14), F(L + 0.02, 1.62, b + 0.14), F(L + 0.02, 1.62, b - 0.14), [1, 0.96, 0.78], inn);   // headlights
      for (const a of [-4.8, 4.8]) { const p = F(a, -0.08, 0); box(g, p[0], p[1], p[2], 2.8, 0.85, 2.0, hd, dark, null, true); }   // bogies
      { const p = F(0, 0.65, 0); box(g, p[0], p[1], p[2], 2 * L - 0.8, 0.32, 2.4, hd, [0.22, 0.22, 0.24], null, true); }
      for (const a of [-3.4, 2.2]) { const p = F(a, 3.42, 0); box(g, p[0], p[1], p[2], 2.4, 0.36, 1.5, hd, [0.46, 0.48, 0.5], [0.6, 0.62, 0.64], true); }   // roof boxes
      { const p = F(-0.6, 3.42, 0.55); box(g, p[0], p[1], p[2], 0.25, 0.55, 0.25, hd, dark, null, true); }   // exhaust
    };
    car(uB + 8.7, -1); car(uB + 24.3, 1);
    { const [x, z] = at(uB + 16.5, 0); box(scen.get(x, z), x, yR + 1.0, z, 0.7, 2.0, 1.7, hd, dark, null, true); }   // gangway between the cars

    /* ---- the station's name board hung under the lower end of the canopy, both faces (its own small canvas: one extra mesh) ---- */
    { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d'), cream = '#efe3c8', grn = '#1f4034';
      x.fillStyle = grn; x.fillRect(0, 0, 512, 128); x.strokeStyle = cream; x.lineWidth = 6; x.strokeRect(8, 8, 496, 112);
      x.fillStyle = cream; x.font = '900 74px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SUMMIT', 256, 68, 320);
      for (const gx of [62, 450]) { x.beginPath(); for (let k = 0; k < 48; k++) { const a = (k + 0.5) / 48 * TAU, r = k % 4 < 2 ? 36 : 27; x.lineTo(gx + Math.cos(a) * r, 64 + Math.sin(a) * r); }   // cog wheels
        x.closePath(); x.fill(); x.fillStyle = grn; x.beginPath(); x.arc(gx, 64, 11, 0, TAU); x.fill(); x.fillStyle = cream; }
      const t = new THREE.CanvasTexture(c); t.anisotropy = 4; K.out.ownTex.push(t);
      const gb = new GB(true), W1 = [1, 1, 1], ub = uC1 - 0.25, y0 = yP + 2.45, y1 = yP + 3.35, ym = (y0 + y1) / 2;
      for (const f of [-1, 1]) { const [ax, az] = at(ub + f * 0.05, -3.75 + 2 * f), [bx, bz] = at(ub + f * 0.05, -3.75 - 2 * f), [ix, iz] = at(ub - f, -3.75);   // (the text reads left to right from either side)
        gb.quadO([ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], W1, [ix, ym, iz], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
      const m = new THREE.Mesh(gb.geometry(), new THREE.MeshLambertMaterial({ map: t })); m.matrixAutoUpdate = false; m.receiveShadow = true; K.root.add(m);
      box2(ub, -3.75, y0 - 0.06, 0.08, y1 - y0 + 0.12, 4.12, dark); for (const v of [-2.3, -5.2]) box2(ub, v, y1, 0.05, 0.16, 0.05, dark); }

    /* ---- keep the trees, boulders and later crowds off it ---- */
    for (let u = uB - 3; u <= uP1 + 3; u += 6) { const [x, z] = at(u, -2.5); excl.push({ x, z, r: 6.5 }); }
    for (let k = kS; k < n; k += 5) excl.push({ x: X[k], z: Z[k], r: 3 + 1.4 * Math.max(0.35, Y[k] - gC[k]) });
  }

  /* ---- race day: marshal posts with flags at the corners, safety and recovery vehicles, photographers, sponsor banners,
     mile markers and altitude boards (own random stream; text boards on this build's own texture) */
  function pkRaceOps(K) {
  }

  /* ---- late-June snow: plowed banks behind the barriers high up (own random stream) ---- */
  function pkSnow(K) {
  }

  /* ---- moving things: the TV helicopter over the leading car, cloud shadows drifting across the mountain
     (built at the end of buildPikes; pkUpdate runs every frame from World.update) ---- */
  function pkSky(K) {
  }

  function pkUpdate(pk, t, car) {
  }

  function buildPikes(scene, tex, opts) {
    const R = rng(7311), N = T.N, w = T.w, dens = opts.density || 1;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: pkGround, camFloor: pkGround, props: [], ownTex: [] };
    pkPrep();
    const P = PK, iE = N - 1, sStart = T.startS, sFin = T.finishS;
    // flat ground: the paddock below the start, the car park at the summit (behind the road's end), the summit house's plot
    P.pads.push({ x: T.px[0] - T.tx[0] * 18, z: T.pz[0] - T.tz[0] * 18, r: 30, h: T.hy[0] - 0.3 });
    const padE = { x: T.px[iE] + T.tx[iE] * 30, z: T.pz[iE] + T.tz[iE] * 30, r: 28, b: 36, h: T.hy[iE] - 0.3 }; P.pads.push(padE);
    const padH = (() => { const i = T.idx(sFin + 44), lat = -(T.bl[i] + 4 + 7.5); return { i, lat, x: T.px[i] + T.nx[i] * lat, z: T.pz[i] + T.nz[i] * lat, r: 19, h: T.hy[i] - 0.3 }; })(); P.pads.push(padH);   // the summit house, left of the road after the line
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [];   // tree exclusion circles (landmarks, crowds)
    const excluded = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };

    /* ---- terrain tiles ---- */
    let nFar = 0;   // coarse outer tiles
    const gMat = new THREE.MeshLambertMaterial({ map: pkTex(), vertexColors: true }), tMat = pkGroundMat();   // verge ribbons / terrain tiles
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = pkTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;   // (G.on: the full tiles, which get the forest)
        const m = new THREE.Mesh(pkTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      // the reservoir far below in the valley
      const L = P.lk, wg = new THREE.CircleGeometry(1, 40); wg.rotateX(-Math.PI / 2); wg.scale(L.rx * 1.04, 1, L.rz * 1.04); wg.translate(L.x, L.y, L.z);
      const uvw = wg.attributes.uv; for (let k = 0; k < uvw.count; k++) uvw.setXY(k, uvw.getX(k) * L.rx / 12, uvw.getY(k) * L.rz / 12);
      const lake = new THREE.Mesh(wg, new THREE.MeshPhongMaterial({ map: tex.water, color: 0x3a7fc0, shininess: 80, specular: 0x6f9fcf })); lake.receiveShadow = true; lake.matrixAutoUpdate = false; lake.updateMatrix(); root.add(lake); out.dyn.water = tex.water;
    }

    /* ---- road: asphalt, double yellow centre line, white edge lines, a strip of gravel, then the verge (ground-coloured) out to the barriers (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.84 - 0.15 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.9) k -= 0.03; return [k, k, k * 1.02]; };
      const yel = [0.98, 0.74, 0.1], wht = [0.95, 0.95, 0.92], gc = [0.92, 0.84, 0.78], sw = 0.9;
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      // verge cross-section per sample and side: [offset, height above the road] from the gravel strip out past the barrier, lifted onto the ground where the slope starts to rise
      const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o, g = pkGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.05 - y; return [o, Math.max(h, g)]; };
        a.push([[w + sw, -0.02], lift(Math.max(w + sw + 0.6, bar - 2.5), -0.02 - 0.2 * (1 - 2.5 / Math.max(2.6, bar - w - sw))), lift(bar, -0.22), lift(bar + 1.4, -0.62)]); } return a; });
      // verge colours per cross-section point = the ground's there (dusty near the road; the outer edge takes the terrain mesh's colour there, snow patches included, so no seam)
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o, sl = k === 2 ? pkSlope(x, z) : 0; if (k === 3) return pkGCol(x, z); return pkCol(x, z, T.hy[i] + y, 1 / Math.sqrt(1 + sl * sl), Math.max(0, o - bar)).slice(); })); } return a; });
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const [o0, o1, col] of [[-0.27, -0.12, yel], [0.12, 0.27, yel], [-(w - 0.28), -(w - 0.5), wht], [w - 0.5, w - 0.28, wht]])
            gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [col, col, col, col]);
          for (const side of [-1, 1]) {
            const ci = vc[side > 0 ? 1 : 0][i], cj = vc[side > 0 ? 1 : 0][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            const qi = vp[side > 0 ? 1 : 0][i], qj = vp[side > 0 ? 1 : 0][j];
            for (let k = 0; k < 3; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // chequered start and finish lines, a white line at each checkpoint
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16;
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.04, W1 = [1, 1, 1];
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.038;
        gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), W1 = [1, 1, 1];
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.2, 0.7, 0.3], [1, 0.55, 0.1], [0.15, 0.5, 0.55], [0.7, 0.2, 0.5], [0.12, 0.14, 0.2]];
    const CR = crowdCtx({ gH: pkGround, near: (x, z) => pkNear(x, z).dd, excluded, maxSlope: 0.6 }), crSoft = new Set();   // spectators (instanced); crSoft: tree-only exclusions (crowds, gantries)
    const person = (x, z, ro) => { const sc = fans[Math.floor(R() * fans.length)]; R(); crowdPut(CR, x, pkGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: sc }, 1); };   // (two draws, as the old merged figure)
    const crowd = (sa, sb, side, rows, dens0, extra) => {   // spectators on the ground behind the barrier, facing the road
      for (let s = sa; s < sb; s += 1.1) for (let row = 0; row < rows; row++) { if (R() > dens0 - row * 0.12) continue;
        const ex = (extra || 2.6) + row * 1.1 + (R() - 0.5) * 0.4, [x, z] = onSide(s, side, ex); if (pkNear(x, z).dd < 1.2) continue;
        const sc = fans[Math.floor(R() * fans.length)]; R(); crowdAt(CR, s, side, ex, x, z, { col: sc }, row, (a, b) => pkNear(a, b).dd >= 1.2); }
      const [x, z] = onSide((sa + sb) / 2, side, 5), e = { x, z, r: (sb - sa) / 2 + 6 }; excl.push(e); crSoft.add(e);
    };
    const carPk = (x, z, rot, col) => { const g = scen.get(x, z), y = pkGround(x, z), c = Math.cos(rot), s = Math.sin(rot);   // parked car
      box(g, x, y + 0.25, z, 4.3, 0.8, 1.85, rot, col, null, true); box(g, x - c * 0.35, y + 1.05, z - s * 0.35, 2.3, 0.62, 1.62, rot, [0.16, 0.2, 0.26], col, true);
      for (const [a, b] of [[1.35, 0.8], [1.35, -0.8], [-1.35, 0.8], [-1.35, -0.8]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.66, 0.66, 0.24, rot, [0.08, 0.08, 0.09], null, true); };
    const tent = (x, z, rot, col) => { const g = scen.get(x, z), y = pkGround(x, z); box(g, x, y, z, 3.2, 2.0, 3.2, rot, [0.94, 0.94, 0.92], null, true); gable(g, x, y + 2.0, z, 3.5, 3.5, 1.0, rot, col, col); };
    const bannerQ = (cx, cy, cz, tx, tz, W, H, slot, tilt) => {   // double-sided text board (bottom centre cx, cy, cz), readable from both +t and -t; tilt (rad) leans its top towards +t (a lectern read from -t)
      const v1 = 1 - slot / 8, v0 = v1 - 1 / 8, ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        ban.quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[0, v0], [1, v0], [1, v1], [0, v1]]); }
    };
    const arch = (s, slot, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a text board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.5, z - nz * L1, 0.7, 7.3, 0.7, hd, postCol); box(g, x + nx * L2, y - 0.5, z + nz * L2, 0.7, 7.3, 0.7, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.6, 0.7, L1 + L2 + 0.7, hd, beamCol);
      bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 13.6, 1.7, slot);
      const e = { x, z, r: Math.max(L1, L2) + 6 }; excl.push(e); crSoft.add(e); return [x, y, z, i];
    };
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt ? T.altAt(T.hy[T.idx(s)]) : 0));

    /* ---- START: gantry with the start lights, timing hut, paddock with team tents, trailers, cars and spectators ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z);
      box(g, x, y + 6.8, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);   // light panel on top of the beam
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.35, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      // timing hut beside the line, flags along the start straight
      const [hx, hz] = onSide(sStart - 4, -1, 4.5), hy = pkGround(hx, hz), gh = scen.get(hx, hz);
      box(gh, hx, hy, hz, 4.2, 2.7, 3, T.hd[i], [0.92, 0.9, 0.84], [0.5, 0.3, 0.2], true); box(gh, hx, hy + 1.3, hz, 4.25, 0.9, 3.05, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.6, 3.4, 1.1, T.hd[i], [0.62, 0.2, 0.14], [0.92, 0.9, 0.84]);
      excl.push({ x: hx, z: hz, r: 6 });
      for (let s = 4; s < sStart + 60; s += 9) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.6), py = pkGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5.4, 5, [0.85, 0.85, 0.88]); box(gg, px + T.tx[ii] * 0.55, py + 4.2, pz + T.tz[ii] * 0.55, 1.1, 0.8, 0.05, T.hd[ii], fans[Math.floor(R() * fans.length)], null, true); }
      crowd(sStart - 4, sStart + 60, 1, 3, 0.7, 2.8); crowd(sStart + 6, sStart + 60, -1, 3, 0.65, 2.8);
      // the end of the road: concrete blocks across it (the cars cannot go past), the paddock behind
      const i0 = 0, e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];
      for (let o = -T.bl[i0]; o < T.br[i0]; o += 2.05) { const bx = e0[0] + T.nx[i0] * (o + 1), bz = e0[1] + T.nz[i0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[i0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      const pd = P.pads[0], hh = T.hd[0], ch = Math.cos(hh), sh = Math.sin(hh), at = (a, b) => [pd.x + ch * a - sh * b, pd.z + sh * a + ch * b];   // a: along the road, b: across
      const tcol = [[0.85, 0.16, 0.14], [0.15, 0.36, 0.8], [0.95, 0.75, 0.12], [0.2, 0.62, 0.3]];
      for (let k = 0; k < 4; k++) { const [tx, tz] = at(-10 + k * 1.2, -20 + k * 11); const gg = scen.get(tx, tz), ty = pkGround(tx, tz);   // team trailers
        box(gg, tx, ty + 0.4, tz, 12, 3.2, 2.5, hh, [0.93, 0.93, 0.95], null, true); box(gg, tx, ty + 1.6, tz, 12.05, 0.5, 2.55, hh, tcol[k], null, true); }
      for (let k = 0; k < 6; k++) { const [tx, tz] = at(-2 + (k % 2) * 5, -24 + Math.floor(k / 2) * 5.5); tent(tx, tz, hh, tcol[k % 4]); }
      for (let k = 0; k < 7; k++) { const [cx, cz] = at(-24 - (k % 2) * 6, -18 + k * 5.2); carPk(cx, cz, hh + Math.PI / 2, vary(fans[k % fans.length], R, 0.2)); }
      for (let k = 0; k < 26; k++) { const [px, pz] = at(-6 - R() * 16, -22 + R() * 44); if (pkNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      { const [bx, bz] = at(-30, 0), by = pkGround(bx, bz), gg = scen.get(bx, bz);   // paddock banner
        for (const o of [-6, 6]) box(gg, bx - sh * o, by, bz + ch * o, 0.3, 4.2, 0.3, 0, [0.3, 0.3, 0.33]);
        bannerQ(bx, by + 2.4, bz, ch, sh, 12, 1.5, 7); }
      excl.push({ x: pd.x, z: pd.z, r: pd.r + 12 });
    }

    /* ---- checkpoints: gantry with a red board "CPn  altitude" and a big red map pin on top ---- */
    T.cpS.forEach((s, k) => {
      const [x, y, z, i] = arch(s, 2 + k, [0.86, 0.86, 0.88], [0.8, 0.14, 0.12]), g = scen.get(x, z), red = [0.86, 0.12, 0.1];
      cone(g, x, y + 10.2, z, 1.5, -3.4, 10, red, red, 0);   // the pin: a cone point down, a ball on top, a white dot
      ico(g, x, y + 10.35, z, 1.75, 1, red, R, 0.02); ico(g, x, y + 11.75, z, 0.75, 0.55, [0.98, 0.98, 0.98], R, 0.02);
      const side = T.br[i] > T.bl[i] ? 1 : -1; crowd(s - 14, s + 10, side, 2, 0.55); crowd(s - 10, s + 6, -side, 1, 0.4);
    });

    /* ---- FINISH: chequered gantry and flags, then the summit: car park, visitor centre, summit sign ---- */
    {
      const [x, y, z, i] = arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 30; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.5), py = pkGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }   // chequered flags
      crowd(sFin - 40, sFin + 14, 1, 3, 0.6); crowd(sFin - 36, sFin + 10, -1, 2, 0.5);
      // end of the road: a row of granite boulders
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.2) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; rock(scen.get(bx, bz), bx, T.hy[iE] + 0.2, bz, 1.0, 0.8, 0.9, R() * TAU, vary([0.58, 0.5, 0.45], R, 0.1), R, 0.3); }
      // summit house beside the road (on its own flat pad, in view while the car brakes after the line): stone walls, a band of big windows facing the road, flat roof with an overhang
      { const { x: hx, z: hz, i: ih } = padH, hd = T.hd[ih], nx = T.nx[ih], nz = T.nz[ih], hy = pkGround(hx, hz) - 0.6, gg = scen.get(hx, hz), stone = [0.62, 0.55, 0.5];
        box(gg, hx, hy, hz, 34, 5.6, 15, hd, stone, null, true); box(gg, hx + nx * 7.55, hy + 1.6, hz + nz * 7.55, 31, 2.6, 0.2, hd, [0.2, 0.3, 0.4], null, true);
        box(gg, hx, hy + 5.6, hz, 36, 0.6, 17, hd, [0.36, 0.3, 0.26], [0.42, 0.4, 0.38], true);
        box(gg, hx - nx * 2.5, hy + 6.2, hz - nz * 2.5, 14, 2.4, 8, hd, stone, [0.4, 0.38, 0.36], true);
        excl.push({ x: hx, z: hz, r: 24 });
        for (let k = 0; k < 14; k++) { const a = (R() - 0.5) * 30, b = -padH.lat - T.bl[ih] - 1.2 - R() * 2.6, px = hx + T.tx[ih] * a + nx * b, pz = hz + T.tz[ih] * a + nz * b; if (pkNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); } }   // visitors in front of it
      // summit sign by the road just past the line: a board on posts leaning back, facing the arriving cars (readable from the high cameras)
      const [sx, sz, si] = onSide(sFin + 24, 1, 5.4), sy = pkGround(sx, sz), gs = scen.get(sx, sz), tl = 0.95, W2 = 9, H2 = W2 / 8;
      for (const o of [-3.8, 3.8]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.28, 1.3, 0.28, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.28, 1.25 + H2 * Math.cos(tl), 0.28, T.hd[si], [0.36, 0.24, 0.14]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.6, 0.65, W2 + 1.2, T.hd[si], [0.5, 0.46, 0.43], [0.58, 0.54, 0.5]);   // stone plinth
      bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, 6, tl);
      // parked cars and visitors on the summit car park
      const hh = T.hd[iE], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 10; k++) { const a = -14 + (k % 5) * 6.5, b = k < 5 ? -12 : -1, px = padE.x + c * b - sn * a, pz = padE.z + sn * b + c * a; if (pkNear(px, pz).dd < 1.5) continue; carPk(px, pz, hh + Math.PI / 2, vary(fans[(k * 3) % fans.length], R, 0.2)); }
      for (let k = 0; k < 24; k++) { const a = (R() - 0.5) * 36, b = (R() - 0.5) * 12, px = padE.x + c * b - sn * a, pz = padE.z + sn * b + c * a; if (pkNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      excl.push({ x: padE.x, z: padE.z, r: padE.r + 10 });
    }

    /* ---- spectators at the hairpins (uphill side), straw bales on their inside ---- */
    {
      const hp = T.corners.filter(c => c.sev >= 3);
      hp.forEach((c, k) => {
        const sm = (c.i0 + c.i1) / 2 * T.ds; if (sm < sStart + 80 || sm > sFin - 60) return;
        const inner = c.dir, [xi, zi] = onSide(sm, inner, 6), [xo, zo] = onSide(sm, -inner, 6), up = pkGround(xi, zi) > pkGround(xo, zo) ? inner : -inner;
        if (k % 2 === 0) crowd(sm - 14, sm + 14, up, 2, 0.5, 3);
        const im = T.idx(sm), barIn = inner > 0 ? T.br[im] : T.bl[im];
        for (const ds of [-2.4, 2.4]) { const [x, z, hd] = atSf(sm + ds, inner * Math.min(barIn - 0.9, w + 2.6)); out.props.push({ kind: 'bstack', x, z, yaw: hd, col: 0 }); }
      });
    }

    /* ---- guardrails on the outside of the bends and wherever the ground drops away, marker posts elsewhere ---- */
    let nRail = 0;   // (share of the road sides with a rail, for the tests)
    {
      const mkPosts = [];   // [i, side] where a marker post goes
      const need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 10); k <= Math.min(N - 1, c.i1 + 10); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];   // a drop: 2.8 m within 9 m of the barrier, or a fall-off farther out (a flat shelf, then the slope down to the leg below)
        for (const d of [5, 9, 14, 19, 25, 31]) { const o = side * (bar + d);
          if (pkGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 9 ? 2.8 : 2.8 + (d - 9) * 0.33)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 64), iS1 = T.idx(sFin - 44), steel = [0.78, 0.8, 0.82], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52];
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1) nd[i] = 0;   // start and summit areas stay open (crowds, car parks)
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 14) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }   // close short gaps
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 8) for (let k = i; k < j; k++) nd[k] = 0; i = j; }   // drop tiny bits
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          if (nd[i] && nd[i + 1]) {   // W-beam: a front and a back face, posts every 4 m
            const g = scen.get(T.px[i], T.pz[i]), a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.3, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.08, 0.13, T.hd[i], postC, null, true); }
          } else if (!nd[i] && i % 12 === 0 && i > 2) mkPosts.push([i, side]);   // a marker post (below)
        }
      }
      const kp = pikesProps(out, mkPosts).spots;   // knockable where they fit on the verge; the rest stay fixed beside the barrier line:
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]), tall = T.hy[i] > 330 ? 1.9 : 1;
        // white marker post with a black band and an orange reflector (taller snow poles near the top)
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2 * tall, 0.13, T.hd[i], tall > 1 ? [0.95, 0.5, 0.12] : [0.94, 0.94, 0.92], null, true);
        box(g, p[0], p[1] + 0.72 * tall, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
    }

    /* ---- the real course's landmarks and race-day details (each in its own function above, on its own random stream: R is not drawn from) ---- */
    const K = { root, out, tex, dens, N, w, P, scen, matV, excl, crSoft, excluded, onSide, carPk, tent, fans, CR, sStart, sFin, iE, padE, padH,
      mats: { tMat, gMat, aMat, lMat, sMat, matV },
      putPerson: (x, z, ro, col) => crowdPut(CR, x, pkGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col }, 1) };   // a spectator facing ro (no draws from R)
    pkLandmarks(K);
    pkCog(K);
    pkRaceOps(K);
    pkSnow(K);

    /* ---- more spectators (instanced, hashed: no draws from R): both sides of every hairpin, the insides of the forest bends, the "W's" ladder,
       more rows at the checkpoints, the start and the finish, small groups on the high side along the ridge; only where the ground is not below the road ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };   // huts, pads, car parks
      const M = { first: 2.8, gap: 1.05, below: 0.6, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.08, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, sStart + 70), Math.min(sb, sFin - 50), side, Object.assign({}, M, o));
      for (const c of T.corners) { if (c.sev < 3) continue; const sm = (c.i0 + c.i1) / 2 * T.ds; for (const sd of [-1, 1]) run(sm - 20, sm + 20, sd, { rows: 3, dens: 0.6, label: 'PK hairpin ' + Math.round(sm - sStart) }); }
      for (const d of [306, 546, 810, 1312, 1404]) { const c = T.corners.find(q => Math.abs(q.s0 - sStart - d) < 20); if (c) run(c.s0 - 8, c.s0 + 46, c.dir, { rows: 3, dens: 0.6, label: 'PK bend ' + d }); }
      for (const sd of [-1, 1]) run(sStart + 2640, sStart + 3400, sd, { rows: 2, dens: 0.2, clump: 0.8, label: "PK W's" });
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 26, s0 + 22, side, { first: 4.9, rows: 2, dens: 0.6, label: 'PK cp+' }); run(s0 - 22, s0 + 18, -side, { first: 3.8, rows: 2, dens: 0.5, label: 'PK cp-' }); });
      for (const sd of [-1, 1]) run(sStart + 3700, sStart + 4450, sd, { rows: 2, dens: 0.3, clump: 0.95, below: 0.2, label: 'PK ridge' });
      for (const sd of [-1, 1]) { crowdRun(CR, sStart + 60, sStart + 120, sd, Object.assign({}, M, { rows: 3, dens: 0.55, label: 'PK after start' })); crowdRun(CR, sFin - 90, sFin - 40, sd, Object.assign({}, M, { rows: 3, dens: 0.6, label: 'PK before finish' })); crowdRun(CR, sFin - 40, sFin + 12, sd, Object.assign({}, M, { first: 6.2, rows: 2, dens: 0.55, label: 'PK finish back' })); }
    }

    for (const e of CR.circ) excl.push(e);   // the trees, shrubs and boulders keep clear of the new crowds too

    /* ---- vegetation and rock ---- */
    const nTrees = pkForest(scen, R, dens, excluded);
    {
      const bushC = [[0.14, 0.28, 0.12], [0.2, 0.34, 0.14], [0.26, 0.36, 0.14]], tuftC = [[0.5, 0.5, 0.26], [0.58, 0.54, 0.3], [0.44, 0.46, 0.22]], graniteC = [[0.54, 0.44, 0.39], [0.48, 0.42, 0.39], [0.58, 0.48, 0.43]], greyC = [0.44, 0.43, 0.41];
      for (let s = 2; s < T.len - 2; s += 3.2) for (const side of [-1, 1]) {
        const i = T.idx(s), y0 = T.hy[i], tl = pkTreeline(T.px[i], T.pz[i]), above = y0 > tl, boulderPark = s > 5150 && s < 5980;
        const r = R();
        if (!above && r < 0.25) {   // shrubs and young firs right behind the barrier
          const [x, z] = onSide(s, side, 1.2 + R() * 7); if (pkNear(x, z).dd < 0.8 || excluded(x, z)) continue;
          const y = pkGround(x, z), g = scen.get(x, z);
          if (R() < 0.6) ico(g, x, y + 0.35, z, 0.7 + R() * 0.7, 0.75, vary(bushC[Math.floor(R() * 3)], R, 0.15), R, 0.3);
          else pkPine(g, x, y, z, 2.5 + R() * 3, vary([0.12, 0.26, 0.13], R, 0.12), R);
        } else if (above && r < 0.45) {   // alpine grass tufts along the verge
          const [x, z] = onSide(s, side, 0.6 + R() * 5); if (pkNear(x, z).dd < 0.3 || excluded(x, z)) continue;
          const y = pkGround(x, z), g = scen.get(x, z), col = tuftC[Math.floor(R() * 3)];
          for (let q = 0; q < 2; q++) cone(g, x + (R() - 0.5) * 0.6, y, z + (R() - 0.5) * 0.6, 0.12 + R() * 0.1, 0.35 + R() * 0.4, 4, vary(col, R, 0.12), [col[0] * 1.25, col[1] * 1.2, col[2] * 1.1], R() * TAU);
        }
        if ((above && R() < 0.34) || (boulderPark && R() < 0.5) || (!above && R() < 0.05)) {   // granite boulders, big ones in Boulder Park
          const o = 2 + Math.pow(R(), 1.6) * (boulderPark ? 40 : 70), [x, z] = onSide(s, side, o), sz = (boulderPark ? 0.9 + R() * 1.9 : 0.5 + R() * 1.3) * (o > 20 ? 1.3 : 1); if (pkNear(x, z).dd < sz + 0.5 || excluded(x, z)) continue;
          const y = pkGround(x, z), col = vary(above ? graniteC[Math.floor(R() * 3)] : greyC, R, 0.12), g = scen.get(x, z);
          ico(g, x, y + sz * 0.25, z, sz, 0.62 + R() * 0.3, col, R, 0.5);
          if (R() < 0.4) ico(g, x + (R() - 0.5) * sz * 2.2, y + sz * 0.1, z + (R() - 0.5) * sz * 2.2, sz * 0.6, 0.7, vary(col, R, 0.1), R, 0.5);
        }
      }
      // granite outcrops and crags where the slope is steep
      for (let s = 10; s < T.len - 10; s += 16) for (const side of [-1, 1]) {
        if (R() < 0.5) continue;
        const [x, z] = onSide(s, side, 10 + R() * 70); if (excluded(x, z) || pkNear(x, z).dd < 6) continue;
        const sl = pkSlope(x, z); if (sl < 0.55) continue;
        const y = pkGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(R() * 3), base = vary(graniteC[Math.floor(R() * 3)], R, 0.1);
        for (let q = 0; q < n; q++) { const r0 = 2.2 + R() * 3.5, qx = x + (R() - 0.5) * 7, qz = z + (R() - 0.5) * 7, qy = pkGround(qx, qz); if (pkNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.4, qz, r0, r0 * (0.8 + R() * 0.8), r0 * (0.7 + R() * 0.4), R() * TAU, vary(base, R, 0.08), R, 0.35); }
      }
    }

    /* ---- knockable props' kinds are Core's; finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: pkAtlas(cpAlt), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    crowdFinish(CR, root, out);

    pkSky(K);

    out.stats = { trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, rails: +(nRail / (2 * N)).toFixed(3) };   // (read by the tests)
    return out;
  }

  /* ================= NÜRBURGRING NORDSCHLEIFE (theme 'nring') =================
     The real 20.7 km loop through the Eifel forests (10k road samples). As for Pikes Peak only a corridor around the track is built.
     Terrain: an 8 m height grid in 256 m tiles; near the track it is the road's own height (blended from the nearby road samples),
     farther out the real terrain (def.dem, forest canopy removed) with a little noise. The OpenStreetMap land cover (def.lc) colours
     the ground and decides where the forest stands; the trees are instanced per 128 m chunk. Road, verges, kerbs, lines and guardrails
     are indexed ribbons. Hot loops live in these small functions (the big builder is not optimised by V8). */
  const NRC = 8, NRT = 32, NRHC = 32;          // terrain cell (m), tile size (cells), road-sample hash cell (m)
  let NR = null;                               // per-build data: sample hash, land cover, terrain grids
  const NRN = { i: -1, d: 1e9, dd: 1e9, lat: 0, h: 0, hn: 0 };   // nrNear: nearest sample, distance, distance beyond the barrier, blended and exact road height
  const NRCOL = [0, 0, 0];
  const NR_A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function nrPrep() {
    const def = T.def, N = T.N, M = 480;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    x0 -= M; x1 += M; z0 -= M; z1 += M;
    const P = NR = { x0, z0, x1, z1 };
    // every 2nd road sample in a hash grid
    P.cx0 = Math.floor(x0 / NRHC); P.cz0 = Math.floor(z0 / NRHC); P.ncx = Math.floor(x1 / NRHC) - P.cx0 + 1; P.ncz = Math.floor(z1 / NRHC) - P.cz0 + 1; P.cells = new Array(P.ncx * P.ncz);
    for (let i = 0; i < N; i += 2) { const k = (Math.floor(T.pz[i] / NRHC) - P.cz0) * P.ncx + Math.floor(T.px[i] / NRHC) - P.cx0; (P.cells[k] || (P.cells[k] = [])).push(i); }
    // land cover (0 open, 1 forest, 2 scrub, 3 settlement / car parks): 16 m cells, rows run-length coded
    const L = def.lc, lc = new Uint8Array(L.nx * L.nz);
    for (let p = 0, k = 0; k < lc.length;) { const v = NR_A64.indexOf(L.rle[p++]); let n = (v & 15) + 1; if ((v & 15) === 15) { let e; do { e = NR_A64.indexOf(L.rle[p++]); n += e; } while (e === 63); } lc.fill(v >> 4, k, Math.min(lc.length, k + n)); k += n; }
    P.lc = lc; P.L = L;
    // real terrain: 64 m grid, heights above 300 m a.s.l. (the same datum as the road)
    const D = def.dem, bin = atob(D.b64), dem = new Float32Array(D.nx * D.nz);
    for (let k = 0; k < dem.length; k++) dem[k] = D.lo + bin.charCodeAt(k) * D.step - 300;
    P.dem = dem; P.D = D;
    // distance to the road centre line on a 16 m grid (chamfer transform seeded with the road samples)
    const dc = 16, dnx = Math.ceil((x1 - x0) / dc) + 1, dnz = Math.ceil((z1 - z0) / dc) + 1, dist = new Float32Array(dnx * dnz).fill(1e9);
    for (let i = 0; i < N; i++) { const a = Math.round((T.px[i] - x0) / dc), b = Math.round((T.pz[i] - z0) / dc); dist[b * dnx + a] = 0; }
    nrChamfer(dist, dnx, dnz, dc);
    Object.assign(P, { dc, dnx, dnz, dist });
    P.n1 = valueNoise2(401, 90); P.n2 = valueNoise2(402, 30); P.n3 = valueNoise2(403, 55); P.n4 = valueNoise2(404, 14); P.n5 = valueNoise2(405, 160);
    // terrain height grid (filled lazily, NaN = not computed yet) and the distance beyond the nearest barrier at each vertex
    const G = P.G = { x0, z0 }; G.ntx = Math.ceil((x1 - x0) / (NRC * NRT)); G.ntz = Math.ceil((z1 - z0) / (NRC * NRT)); G.nx = G.ntx * NRT + 1; G.nz = G.ntz * NRT + 1;
    G.h = new Float32Array(G.nx * G.nz).fill(NaN); G.dd = new Float32Array(G.nx * G.nz); G.on = new Uint8Array(G.ntx * G.ntz);
  }
  function nrChamfer(d, nx, nz, c) {   // two-pass 3x3 chamfer distance transform (in place)
    const c2 = c * Math.SQRT2;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; let v = d[k];
      if (i > 0) v = Math.min(v, d[k - 1] + c); if (j > 0) { v = Math.min(v, d[k - nx] + c); if (i > 0) v = Math.min(v, d[k - nx - 1] + c2); if (i < nx - 1) v = Math.min(v, d[k - nx + 1] + c2); } d[k] = v; }
    for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i; let v = d[k];
      if (i < nx - 1) v = Math.min(v, d[k + 1] + c); if (j < nz - 1) { v = Math.min(v, d[k + nx] + c); if (i < nx - 1) v = Math.min(v, d[k + nx + 1] + c2); if (i > 0) v = Math.min(v, d[k + nx - 1] + c2); } d[k] = v; }
  }
  function nrDist(x, z) {   // distance to the road centre line (bilinear on the chamfer grid)
    const P = NR, gx = clamp((x - P.x0) / P.dc, 0, P.dnx - 1.001), gz = clamp((z - P.z0) / P.dc, 0, P.dnz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = P.dnx, a = P.dist;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function nrLC(x, z) {   // land cover class at (x, z)
    const L = NR.L, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell);
    return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? 0 : NR.lc[j * L.nx + i];
  }
  function nrLCf(x, z, c) {   // share of land cover class c around (x, z), bilinear over the cell centres (soft edges for the ground colours)
    const L = NR.L, lc = NR.lc, fx = (x - L.x0) / L.cell - 0.5, fz = (z - L.z0) / L.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const at = (a, b) => (a < 0 || b < 0 || a >= L.nx || b >= L.nz ? 0 : lc[b * L.nx + a] === c ? 1 : 0);
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v;
  }
  function nrDem(x, z) {   // real terrain height (bilinear on the 64 m grid)
    const P = NR, D = P.D, gx = clamp((x - D.x0) / D.cell, 0, D.nx - 1.001), gz = clamp((z - D.z0) / D.cell, 0, D.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = D.nx, a = P.dem;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function nrNear(x, z) {   // Shepard blend of the road heights around (x, z): weights fall with the distance beyond each sample's barrier
    const P = NR, cx = Math.floor(x / NRHC) - P.cx0, cz = Math.floor(z / NRHC) - P.cz0, ds = T.ds, N = T.N;
    let ws = 0, hs = 0, bd = 1e9, bi = -1, bl = 0, ba = 0, bdd = 1e9;
    for (let b = Math.max(0, cz - 2); b <= Math.min(P.ncz - 1, cz + 2); b++) for (let a = Math.max(0, cx - 2); a <= Math.min(P.ncx - 1, cx + 2); a++) {
      const Lc = P.cells[b * P.ncx + a]; if (!Lc) continue;
      for (let q = 0; q < Lc.length; q++) {
        const i = Lc[q], dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], lat = dx * T.nx[i] + dz * T.nz[i], ex = Math.max(0, Math.abs(al) - ds), d = Math.sqrt(lat * lat + ex * ex);
        if (d >= 64) continue;
        const dd = Math.max(0, d - (lat > 0 ? T.br[i] : T.bl[i])), k = 1 / (dd + 1.5), wq = k * k * k * k * (d < 48 ? 1 : sstep(64, 48, d));
        ws += wq; hs += wq * (T.hy[i] + nrBankY(i, lat));
        if (d < bd) { bd = d; bi = i; bl = lat; ba = al; }
        if (dd < bdd) bdd = dd;
      }
    }
    NRN.i = bi; NRN.d = bd; NRN.dd = bdd; NRN.lat = bl;
    if (bi < 0) return NRN;
    NRN.h = hs / ws;
    const f = bi + ba / ds, fi = Math.floor(f), i0 = ((fi % N) + N) % N, i1 = (i0 + 1) % N; NRN.hn = T.hy[i0] + (T.hy[i1] - T.hy[i0]) * (f - fi) + nrBankY(i0, bl);   // road height across from the point (the loop wraps; the banked edge)
    return NRN;
  }
  function nrBankY(i, o) { const b = T.bank ? T.bank[i] : 0; return b > 0 ? -b * clamp(o * T.bankSide[i], -T.w, T.w + 6) : 0; }   // banked corner: height offset at lateral offset o (as Track.bankAt)
  function nrFar(x, z) { const P = NR; return nrDem(x, z) + (P.n1(x, z) - 0.5) * 6 + (P.n2(x, z) - 0.5) * 2.2; }   // the landscape away from the road
  function nrH(x, z) {   // terrain height
    const n = nrNear(x, z), i = n.i, dd = n.dd, hn = n.hn; let h;
    if (i < 0) h = nrFar(x, z);
    else { const hr = lerp(hn, n.h, sstep(0, 6, dd)) - 0.3; h = dd <= 1 ? hr : lerp(hr, nrFar(x, z), sstep(2, 60, dd)); }
    if (i >= 0 && dd < 6) h = Math.min(h, hn - 0.3 + 0.12 * dd * dd);   // never above the road inside the barriers, only a gentle rise right behind them
    NRN.dd = i >= 0 ? dd : 999;
    return h;
  }
  function nrGH(i, j) {   // terrain height at grid vertex (i, j), computed once
    const G = NR.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = nrH(G.x0 + i * NRC, G.z0 + j * NRC); G.dd[k] = NRN.dd; }
    return h;
  }
  function nrGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles)
    const G = NR.G, gx = clamp((x - G.x0) / NRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / NRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = nrGH(i, j); return a + u * (nrGH(i + 1, j) - a) + v * (nrGH(i, j + 1) - a); }
    const d = nrGH(i + 1, j + 1); return d + (1 - u) * (nrGH(i, j + 1) - d) + (1 - v) * (nrGH(i + 1, j) - d);
  }
  function nrSlope(x, z) { const a = nrGround(x - 3, z), b = nrGround(x + 3, z), c = nrGround(x, z - 3), d = nrGround(x, z + 3); return Math.hypot(b - a, d - c) / 6; }
  function nrCol(x, z, ny, dd) {   // ground colour (multiplies the green grass map): meadow, dark forest floor, scrub, lawns and car parks by the villages, a mown verge
    const P = NR, m = P.n3(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3);
    let r = 1.0 + (m - 0.5) * 0.24 + (P.n4(x, z) - 0.5) * 0.12, g = 1.0 + (m - 0.5) * 0.16, b = 0.95 + (m - 0.5) * 0.2;
    const hay = sstep(0.55, 0.8, P.n5(x, z)) * 0.35; r += hay * 0.5; g += hay * 0.12; b -= hay * 0.1;   // some meadows are hay-coloured
    r = lerp(r, 0.52 + m * 0.1, fo); g = lerp(g, 0.5 + m * 0.08, fo); b = lerp(b, 0.42 + m * 0.06, fo);   // needles and leaf litter under the trees
    r = lerp(r, 0.8, sc * 0.6); g = lerp(g, 0.78, sc * 0.6); b = lerp(b, 0.62, sc * 0.6);
    r = lerp(r, 1.06, se * 0.7); g = lerp(g, 0.9, se * 0.7); b = lerp(b, 0.9, se * 0.7);
    const st = sstep(0.86, 0.66, ny) * 0.8; r = lerp(r, 1.05, st); g = lerp(g, 0.8, st); b = lerp(b, 0.62, st);   // bare earth on steep banks
    if (dd < 5) { const t = sstep(5, 0.5, dd); r = lerp(r, 1.02, t); g = lerp(g, 1.06, t); b = lerp(b, 0.96, t); }   // mown verge right behind the rails
    NRCOL[0] = r; NRCOL[1] = g; NRCOL[2] = b; return NRCOL;
  }
  function nrGCol(x, z) {   // the terrain mesh's vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in nrTileGeo)
    const G = NR.G, gx = clamp((x - G.x0) / NRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / NRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b;
      const nx = (nrGH(ii + 1, jj) - nrGH(ii - 1, jj)) / (2 * NRC), nz = (nrGH(ii, jj + 1) - nrGH(ii, jj - 1)) / (2 * NRC), c = nrCol(G.x0 + ii * NRC, G.z0 + jj * NRC, 1 / Math.hypot(nx, 1, nz), G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function nrTileOn(ti, tj) {   // 0: none, 1: full tile (8 m cells), 2: coarse outer ring (32 m cells, in the haze)
    const G = NR.G, L = NRC * NRT, x = G.x0 + (ti + 0.5) * L, z = G.z0 + (tj + 0.5) * L, d = nrDist(x, z);
    return d < 190 + L * 0.71 ? 1 : d < 330 + L * 0.71 ? 2 : 0;
  }
  function nrTileGeo(ti, tj, st) {   // one 256 m terrain tile (every st-th grid vertex): indexed, normals from the shared grid (no seams between tiles)
    const G = NR.G, m = NRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), i0 = ti * NRT, j0 = tj * NRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * NRC, z = G.z0 + j * NRC, h = nrGH(i, j);
      let nx = -(nrGH(i + st, j) - nrGH(i - st, j)) / (2 * NRC * st), nz = -(nrGH(i, j + st) - nrGH(i, j - st)) / (2 * NRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = nrCol(x, z, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 14; uv[k * 2 + 1] = -z / 14;
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }
  // indexed ribbon: rows of cross-section points, quads between two rows (shared vertices, smooth normals)
  class RB {
    constructor(uv) { this.P = []; this.C = []; this.U = uv ? [] : null; this.I = []; this.n = 0; }
    row(pts, cols, uvs) { const b = this.n; for (let k = 0; k < pts.length; k++) { const p = pts[k], c = cols[k]; this.P.push(p[0], p[1], p[2]); this.C.push(c[0], c[1], c[2]); if (this.U) this.U.push(uvs[k][0], uvs[k][1]); } this.n += pts.length; return b; }
    link(r0, r1, k0, k1) { for (let k = k0; k < k1; k++) { const a = r0 + k, b = a + 1, c = r1 + k + 1, d = r1 + k; this.I.push(a, b, d, b, c, d); } }   // (up-facing when the rows run left -> right and follow the road)
    get empty() { return this.I.length === 0; }
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
      if (this.U) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
      g.setIndex(this.I); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
    }
  }
  // instanced meshes per square chunk (three.js culls an InstancedMesh by its geometry's bounding sphere only: each chunk gets its own
  // geometry object sharing the base attributes, placed at the chunk centre with a sphere around all its instances)
  class IChunks {
    constructor(base, mat, size) { this.base = base; this.mat = mat; this.size = size || 256; this.map = new Map(); }
    add(x, y, z, rot, sxz, sy, col) { const k = Math.floor(x / this.size) + ',' + Math.floor(z / this.size); let L = this.map.get(k); if (!L) this.map.set(k, L = []); L.push(x, y, z, rot, sxz, sy, col ? col[0] : 1, col ? col[1] : 1, col ? col[2] : 1); }
    addTo(group, cast) {
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color(), bs = this.base.boundingSphere || (this.base.computeBoundingSphere(), this.base.boundingSphere);
      let n = 0;
      for (const L of this.map.values()) {
        const cnt = L.length / 9; let cx = 0, cz = 0, y0 = 1e9, y1 = -1e9, smax = 0;
        for (let k = 0; k < L.length; k += 9) { cx += L[k]; cz += L[k + 2]; y0 = Math.min(y0, L[k + 1]); y1 = Math.max(y1, L[k + 1]); smax = Math.max(smax, L[k + 4], L[k + 5]); }
        cx /= cnt; cz /= cnt;
        const g = new THREE.BufferGeometry(); for (const a in this.base.attributes) g.setAttribute(a, this.base.attributes[a]); if (this.base.index) g.setIndex(this.base.index);
        let r = 0; for (let k = 0; k < L.length; k += 9) r = Math.max(r, Math.hypot(L[k] - cx, L[k + 2] - cz));
        const ym = (y0 + y1) / 2; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, ym + bs.center.y * smax, 0), Math.hypot(r + bs.radius * smax, (y1 - y0) / 2 + bs.radius * smax));
        const im = new THREE.InstancedMesh(g, this.mat, cnt); im.frustumCulled = true; im.position.set(cx, 0, cz); im.updateMatrix(); im.matrixAutoUpdate = false; im.castShadow = !!cast; im.receiveShadow = true;   // (r128 turns culling off for instanced meshes)
        for (let k = 0, t = 0; k < L.length; k += 9, t++) {
          e.set(0, L[k + 3], 0); q.setFromEuler(e); v.set(L[k] - cx, L[k + 1], L[k + 2] - cz); s.set(L[k + 4], L[k + 5], L[k + 4]); m4.compose(v, q, s); im.setMatrixAt(t, m4);
          c.setRGB(L[k + 6], L[k + 7], L[k + 8]); im.setColorAt(t, c);
        }
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
        group.add(im); n += cnt;
      }
      return n;
    }
  }

  /* ================= SPECTATORS: an instanced crowd layer on IChunks, used by every world builder =================
     One figure is 168 index verts (112 vertices): legs, torso, head, two arms and a flag that stays folded away unless the figure waves one.
     Vertex attribute aPart = bone * 10 + colour group; per instance aCrowd = (pose + phase, variant). The shader tints only the shirt, caps and
     long sleeves with the instance colour; skin, trousers, hair and flags come from small palettes picked by the variant (a hash of the position).
     Poses: 0 standing, 1 cheering, 2 waving, 3 filming, 4 clapping, 5 flag, 6 sitting on the grass. The arms move with uTime; people within
     ~50 m of the followed car (uCar) throw their arms up and jump. No shadow casting (a vertex-animated caster would need its own depth
     material); a multiply-blended dark strip on the ground under the rows grounds them instead. */
  function crH(a, b, c) {   // position hash -> [0, 1) (no RNG draws, so the seeded scenery is not re-rolled)
    let h = Math.imul(Math.round(a * 16) | 0, 0x27d4eb2d) ^ Math.imul(Math.round(b * 16) | 0, 0x165667b1) ^ Math.imul(((Math.round(c * 16) | 0) + 0x3c6ef372) | 0, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function crNoise(u) { const i = Math.floor(u), f = u - i, a = crH(i, 0, 99), b = crH(i + 1, 0, 99); return a + (b - a) * f * f * (3 - 2 * f); }   // smooth 1D value noise (clumps along a run)
  const CR_SHIRTS = [[0.88, 0.16, 0.13], [0.95, 0.8, 0.18], [0.16, 0.4, 0.86], [0.94, 0.94, 0.92], [0.18, 0.62, 0.28], [0.98, 0.52, 0.1], [0.12, 0.13, 0.16], [0.6, 0.18, 0.5], [0.14, 0.5, 0.58], [0.82, 0.82, 0.84], [0.5, 0.32, 0.22], [0.2, 0.24, 0.42]];
  let crGeoC = null;
  function crowdGeo() {   // the figure (1.72 m, facing local +z), built once and shared by every world
    if (crGeoC) return crGeoC;
    const P = [], Nm = [], Cl = [], Pa = [], Ix = [], W1 = [1, 1, 1];
    const quad = (a, b, c, d, ins, part, col) => {   // flat quad facing away from 'ins'
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const flip = nx * ((a[0] + c[0]) / 2 - ins[0]) + ny * ((a[1] + c[1]) / 2 - ins[1]) + nz * ((a[2] + c[2]) / 2 - ins[2]) < 0, s = flip ? -1 : 1, k = P.length / 3;
      for (const p of flip ? [a, d, c, b] : [a, b, c, d]) { P.push(p[0], p[1], p[2]); Nm.push(nx * s, ny * s, nz * s); Cl.push(col[0], col[1], col[2]); Pa.push(part); }
      Ix.push(k, k + 1, k + 2, k, k + 2, k + 3);
    };
    const cub = (x0, x1, y0, y1, z0, z1, f) => {   // box faces px/nx/py/ny/pz/nz -> [part, colour]; missing faces are left out
      const ins = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], F = {
        px: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], nx: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]],
        py: [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], ny: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
        pz: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], nz: [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]] };
      for (const k in f) { const q = F[k]; quad(q[0], q[1], q[2], q[3], ins, f[k][0], f[k][1]); }
    };
    // bones: 0 body, 1 left arm, 2 right arm, 3 legs, 4 flag pole (in the right hand), 5 flag cloth; colour groups: 0 as modelled, 1 shirt,
    // 2 skin, 3 trousers, 4 hair / cap, 5 sleeve (shirt or bare arm), 6 / 7 the flag's two stripes
    cub(-0.17, 0.17, 0, 0.84, -0.11, 0.11, { px: [33, W1], nx: [33, W1], pz: [33, W1], nz: [33, W1], ny: [30, [0.12, 0.1, 0.09]] });   // legs, dark soles (seen when sitting)
    cub(-0.22, 0.22, 0.84, 1.42, -0.13, 0.13, { px: [1, W1], nx: [1, W1], pz: [1, W1], nz: [1, W1], py: [1, W1] });   // torso
    cub(-0.11, 0.11, 1.44, 1.7, -0.12, 0.12, { px: [2, W1], nx: [2, W1], pz: [2, W1], nz: [4, W1], py: [4, W1] });   // head: face and ears, hair (or a cap) on top and at the back
    for (const sd of [-1, 1]) { const b = sd < 0 ? 10 : 20, x0 = sd < 0 ? -0.32 : 0.22; cub(x0, x0 + 0.1, 0.8, 1.4, -0.06, 0.06, { px: [b + 5, W1], nx: [b + 5, W1], pz: [b + 5, W1], nz: [b + 5, W1], ny: [b + 2, W1] }); }   // arms, the hand at the end
    quad([0.26, 0.82, 0.09], [0.3, 0.82, 0.09], [0.3, -0.68, 0.09], [0.26, -0.68, 0.09], [0.28, 0, 0], 40, [0.84, 0.84, 0.86]);   // flag pole, one quad (mirrored to face the camera)
    for (const [y0, y1, cg] of [[-0.955, -0.68, 56], [-1.23, -0.955, 57]]) quad([0.3, y1, 0.09], [1.2, y1, 0.09], [1.2, y0, 0.09], [0.3, y0, 0.09], [0.75, y0, 0], cg, W1);   // the cloth: two stripes
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nm, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(Pa, 1)); g.setIndex(Ix);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.4, 0), 2.4);   // covers raised arms, the flag and a jump
    return (crGeoC = g);
  }
  const CR_VS_HEAD = [
    'attribute float aPart;', 'attribute vec2 aCrowd;', 'uniform float uTime;', 'uniform vec3 uCar;',
    'mat3 crRx(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }',
    'mat3 crRz(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }',
    'vec3 crP4(float i, vec3 a, vec3 b, vec3 c, vec3 d) { return i < 0.5 ? a : i < 1.5 ? b : i < 2.5 ? c : d; }'].join('\n');
  const CR_VS_COLOR = [   // replaces <color_vertex>: only the shirt, caps and long sleeves take the instance colour
    'float crBone = floor(aPart * 0.1 + 0.01), crCg = aPart - crBone * 10.0;',
    'float crPose = floor(aCrowd.x), crPh = fract(aCrowd.x) * 6.2832, crV = aCrowd.y;',
    '#ifdef USE_INSTANCING_COLOR', 'vec3 crShirt = instanceColor;', '#else', 'vec3 crShirt = vec3(1.0);', '#endif',
    'vec3 crSkin = crP4(mod(crV, 4.0), vec3(0.96, 0.78, 0.63), vec3(0.86, 0.63, 0.47), vec3(0.66, 0.45, 0.31), vec3(0.42, 0.29, 0.2));',
    'float crHa = mod(floor(crV / 16.0), 8.0), crFl = mod(floor(crV / 256.0), 4.0);',
    'vec3 crTint = vec3(1.0);',
    'if (crCg > 0.5 && crCg < 1.5) crTint = crShirt;',
    'else if (crCg > 1.5 && crCg < 2.5) crTint = crSkin;',
    'else if (crCg > 2.5 && crCg < 3.5) crTint = crP4(mod(floor(crV / 4.0), 4.0), vec3(0.19, 0.27, 0.44), vec3(0.1, 0.1, 0.12), vec3(0.5, 0.44, 0.33), vec3(0.33, 0.34, 0.37));',
    'else if (crCg > 3.5 && crCg < 4.5) crTint = crHa < 3.5 ? crP4(crHa, vec3(0.1, 0.08, 0.06), vec3(0.3, 0.19, 0.11), vec3(0.68, 0.52, 0.28), vec3(0.56, 0.55, 0.53)) : crHa < 4.5 ? vec3(0.05) : crHa < 5.5 ? crShirt : crHa < 6.5 ? vec3(0.94) : vec3(0.08, 0.1, 0.18);',
    'else if (crCg > 4.5 && crCg < 5.5) crTint = mod(floor(crV / 128.0), 2.0) > 0.5 ? crShirt : crSkin;',
    'else if (crCg > 5.5) crTint = crCg < 6.5 ? crP4(crFl, vec3(0.95), vec3(0.84, 0.1, 0.12), vec3(0.1, 0.33, 0.78), vec3(0.1, 0.5, 0.22)) : crP4(crFl, vec3(0.84, 0.1, 0.12), vec3(0.95), vec3(0.98, 0.8, 0.1), vec3(0.95));',
    'vColor = color * crTint;'].join('\n');
  const CR_VS_NORMAL = [   // after <beginnormal_vertex>: pose -> arm (or leg) rotation about its joint; the same matrix moves the vertex below
    '#include <beginnormal_vertex>',
    'vec3 crW = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;',
    'vec3 crFw = (modelMatrix * (instanceMatrix * vec4(0.0, 0.0, 1.0, 0.0))).xyz;',
    'float crMir = dot(cameraPosition - crW, crFw) < 0.0 ? 1.0 : 0.0;',   // seen from behind: mirror the flag so its one-sided quads face the camera
    'float crSit = abs(crPose - 6.0) < 0.5 ? 1.0 : 0.0;',
    'float crEx = (1.0 - smoothstep(14.0, 52.0, length(crW.xz - uCar.xz))) * step(0.28, fract(crPh * 2.713 + crV * 0.0171));',
    'float crT = uTime * (0.85 + 0.3 * fract(crPh * 3.7)) + crPh;',
    'float rL = 0.07, rR = 0.07, fL = 0.05, fR = 0.05;',   // r: raised sideways (0 down, pi up), f: raised forwards
    'if (crPose < 0.5) { rL = 0.07 + 0.05 * sin(crT * 0.9); rR = 0.07 + 0.05 * sin(crT * 0.8 + 1.3); }',
    'else if (crPose < 1.5) { rL = 2.5 + 0.3 * sin(crT * 7.0); rR = 2.5 + 0.3 * sin(crT * 7.0 + 0.7); fL = -0.3; fR = -0.3; }',
    'else if (crPose < 2.5) { rR = 2.3 + 0.45 * sin(crT * 6.0); fR = -0.2; }',
    'else if (crPose < 3.5) { rL = -0.32; rR = -0.32; fL = 1.35; fR = 1.35; }',
    'else if (crPose < 4.5) { rL = -0.2 + 0.18 * sin(crT * 10.0); rR = rL; fL = 0.95; fR = 0.95; }',
    'else if (crPose < 5.5) { rR = 2.8 + 0.14 * sin(crT * 2.4); fR = -0.12; rL = 0.1; }',
    'else { rL = 0.15; rR = 0.15; fL = 0.6; fR = 0.6; }',
    'if (crPose < 4.5 || crSit > 0.5) { float up = 2.55 + 0.35 * sin(uTime * 9.0 + crPh); rL = mix(rL, up, crEx); rR = mix(rR, up + 0.1, crEx); fL = mix(fL, -0.25, crEx); fR = mix(fR, -0.25, crEx); }',
    'mat3 crM = mat3(1.0); vec3 crPv = vec3(0.0);',
    'if (crBone > 0.5 && crBone < 1.5) { crM = crRx(-fL) * crRz(-rL); crPv = vec3(-0.27, 1.37, 0.0); }',
    'else if ((crBone > 1.5 && crBone < 2.5) || crBone > 3.5) { crM = crRx(-fR) * crRz(rR); crPv = vec3(0.27, 1.37, 0.0); }',
    'else if (crBone > 2.5 && crSit > 0.5) { crM = crRx(-1.5); crPv = vec3(0.0, 0.84, 0.0); }',
    'if (crBone > 3.5 && crMir > 0.5) objectNormal.z = -objectNormal.z;',
    'if (crBone < 4.5) objectNormal = crM * objectNormal;'].join('\n');
  const CR_VS_POS = [   // replaces <begin_vertex>
    'vec3 transformed = vec3(position);',
    'if (crBone > 4.5) {',   // the cloth hangs from the pole tip (which follows the hand) and flutters
    '  vec3 at = vec3(0.28, -0.68, 0.09), off = transformed - at;',
    '  off.z += sin(uTime * 7.0 - off.x * 6.0 + crPh) * 0.13 * off.x;',
    '  off.y -= 0.1 * off.x * (0.6 + 0.4 * sin(uTime * 3.1 + crPh));',
    '  if (crMir > 0.5) off.x = -off.x;',
    '  transformed = crPv + crM * (at - crPv) + off;',
    '} else {',
    '  if (crBone > 3.5 && crMir > 0.5) transformed.x = 0.56 - transformed.x;',
    '  transformed = crPv + crM * (transformed - crPv);',
    '}',
    'if (crBone > 3.5 && abs(crPose - 5.0) > 0.5) transformed = crPv;',   // no flag: fold it into the hand (degenerate, draws nothing)
    'if (crSit > 0.5) transformed += vec3(0.0, -0.71, -0.55);',   // sitting: down on the grass, moved back so the feet stay behind the fence
    'else transformed.y += crEx * max(0.0, sin(uTime * 8.0 + crPh)) * 0.16;'].join('\n');
  function crowdMat(U) {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = U.uTime; sh.uniforms.uCar = U.uCar;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + CR_VS_HEAD).replace('#include <color_vertex>', CR_VS_COLOR)
        .replace('#include <beginnormal_vertex>', CR_VS_NORMAL).replace('#include <begin_vertex>', CR_VS_POS);
    };
    m.customProgramCacheKey = () => 'crowd1';
    return m;
  }
  class CrowdChunks extends IChunks {   // IChunks plus a per-instance (pose + phase, variant) attribute
    constructor(U) { super(crowdGeo(), crowdMat(U), 128); this.aux = new Map(); }
    put(x, y, z, rot, sxz, sy, col, pose, variant) {
      this.add(x, y, z, rot, sxz, sy, col);
      const k = Math.floor(x / this.size) + ',' + Math.floor(z / this.size); let A = this.aux.get(k); if (!A) this.aux.set(k, A = []); A.push(pose, variant);
    }
    cull(bad) {   // drop the instances where bad(x, z) (e.g. inside a building placed after them)
      let n = 0;
      for (const [k, L] of [...this.map]) { const A = this.aux.get(k), L2 = [], A2 = [];
        for (let q = 0, t = 0; q < L.length; q += 9, t += 2) { if (bad(L[q], L[q + 2])) { n++; continue; } for (let e = 0; e < 9; e++) L2.push(L[q + e]); A2.push(A[t], A[t + 1]); }
        if (L2.length) { this.map.set(k, L2); this.aux.set(k, A2); } else { this.map.delete(k); this.aux.delete(k); } }
      return n;
    }
    addTo(group) {   // no shadow casting; every chunk mesh gets its aCrowd buffer (IChunks.addTo walks the chunks in map order)
      const c0 = group.children.length, n = super.addTo(group, false); let c = c0;
      for (const k of this.map.keys()) { const im = group.children[c++]; im.name = 'crowd'; im.geometry.setAttribute('aCrowd', new THREE.InstancedBufferAttribute(new Float32Array(this.aux.get(k)), 2)); }
      return n;
    }
  }
  // A placement context per world build. o: gH(x, z) ground height (or grid: the generic ground mesh), near(x, z) distance beyond the nearest
  // barrier (negative on the road), excluded(x, z), water(x, z), maxSlope, shirts. Runs keep their own tree-exclusion circles (exclTest).
  function crowdCtx(o) {
    const U = { uTime: { value: 0 }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };
    const C = Object.assign({ U, ppl: new CrowdChunks(U), strip: new Chunks(384), runs: 0, n: 0, busy: false, sp: new Map(), eh: new Map(), circ: [], blocks: [], avoidL: [], shirts: CR_SHIRTS, maxSlope: 0.6, log: [] }, o);
    if (C.grid && !C.gH) { const G = C.grid; C.gH = (x, z) => {   // height of the ground mesh surface (the same two triangles per cell)
      const gx = clamp((x - G.x0) / G.cell, 0, G.nx - 1.001), gz = clamp((z - G.z0) / G.cell, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, A = G.arr, Y = (a, b) => A[((j + b) * G.nx + i + a) * 3 + 1];
      return u + v <= 1 ? Y(0, 0) + u * (Y(1, 0) - Y(0, 0)) + v * (Y(0, 1) - Y(0, 0)) : Y(1, 1) + (1 - u) * (Y(0, 1) - Y(1, 1)) + (1 - v) * (Y(1, 0) - Y(1, 1)); }; }
    C.exclAdd = (x, z, r) => { const e = { x, z, r }; C.circ.push(e); for (let a = Math.floor((x - r) / 16); a <= Math.floor((x + r) / 16); a++) for (let b = Math.floor((z - r) / 16); b <= Math.floor((z + r) / 16); b++) { const k = a + ',' + b; let L = C.eh.get(k); if (!L) C.eh.set(k, L = []); L.push(e); } };
    C.exclTest = (x, z) => { if (C.busy) return false; const L = C.eh.get(Math.floor(x / 16) + ',' + Math.floor(z / 16)); if (!L) return false; for (const e of L) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };
    C.avoid = (x, z, r) => C.avoidL.push([x, z, r]);   // small obstacles that push no exclusion (lamp posts, marshal huts)
    C.block = (x, z, W, D, rot) => C.blocks.push({ x, z, c: Math.cos(rot), s: Math.sin(rot), hw: W / 2 + 0.3, hd: D / 2 + 0.3 });   // building footprints placed after the crowds
    return C;
  }
  function crFree(C, x, z) {   // nobody closer than 0.55 m, no small obstacle
    const cx = Math.floor(x / 0.8), cz = Math.floor(z / 0.8);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = C.sp.get((cx + a) + ',' + (cz + b)); if (L) for (let q = 0; q < L.length; q += 2) if ((x - L[q]) ** 2 + (z - L[q + 1]) ** 2 < 0.3) return false; }
    for (const [ax, az, r] of C.avoidL) if ((x - ax) ** 2 + (z - az) ** 2 < r * r) return false;
    return true;
  }
  // one spectator at (x, y, z) facing (fx, fz); o: sit (share sitting in the front row), flag (share with a flag), shirts; row 0 = front
  function crowdPut(C, x, y, z, fx, fz, o, row) {
    if (!crFree(C, x, z)) return false;
    const h = (k) => crH(x, z, k), fl = o && o.flag != null ? o.flag : 0.05, p = h(2);
    const pose = o && o.sit && row === 0 && h(1) < o.sit ? 6 : p < fl ? 5 : p < fl + 0.1 ? 1 : p < fl + 0.2 ? 2 : p < fl + 0.3 ? 3 : p < fl + 0.43 ? 4 : 0;
    const kid = h(3) < 0.04, sxz = kid ? 0.8 : 0.92 + 0.16 * h(4), sy = kid ? 0.7 : 0.9 + 0.2 * h(5);
    const pal = (o && o.shirts) || C.shirts, sc = (o && o.col) || pal[Math.floor(h(6) * pal.length)], k = 0.88 + 0.22 * h(7), sk = h(11);
    const variant = (sk < 0.42 ? 0 : sk < 0.72 ? 1 : sk < 0.9 ? 2 : 3) + 4 * Math.floor(h(10) * 256);
    C.ppl.put(x, y, z, Math.atan2(fx, fz) + (h(8) - 0.5) * 0.5, sxz, sy, [sc[0] * k, sc[1] * k, sc[2] * k], pose + h(9) * 0.998, variant);
    const key = Math.floor(x / 0.8) + ',' + Math.floor(z / 0.8); let L = C.sp.get(key); if (!L) C.sp.set(key, L = []); L.push(x, z);
    C.n++; return true;
  }
  // one spectator of an existing crowd loop at track distance s, 'extra' beyond the barrier on 'side': interpolated between the samples (the old
  // loops snap to the 2 m samples, so neighbours would stand inside each other); falls back to the loop's own spot (x0, z0) when ok(x, z) fails there
  function crowdAt(C, s, side, extra, x0, z0, o, row, ok) {
    const q = crAt(s); if (!q) return false;
    const off = (side > 0 ? q.br : q.bl) + extra, nx = q.nx, nz = q.nz, tx = q.tx, tz = q.tz; let x = q.px + nx * side * off, z = q.pz + nz * side * off;
    if (ok && !ok(x, z)) { x = x0; z = z0; }
    const lk = 0.3 * (0.2 + crH(x, z, 12));
    return crowdPut(C, x, C.gH(x, z), z, -side * nx - tx * lk, -side * nz - tz * lk, o, row);
  }
  const CRQ = { px: 0, pz: 0, nx: 0, nz: 0, tx: 0, tz: 0, bl: 0, br: 0, hy: 0, i: 0, i0: 0, i1: 0 };
  function crAt(s) {   // track frame at s, interpolated between the samples (the samples are 2 m apart); null past the ends of an open road
    const N = T.N, f = s / T.ds; let i0 = Math.floor(f); const t = f - i0;
    if (T.open) { if (i0 < 0 || i0 >= N - 1) return null; } else i0 = ((i0 % N) + N) % N;
    const i1 = T.open ? i0 + 1 : (i0 + 1) % N, L = (a) => a[i0] + (a[i1] - a[i0]) * t, q = CRQ;
    q.px = L(T.px); q.pz = L(T.pz); q.nx = L(T.nx); q.nz = L(T.nz); q.tx = L(T.tx); q.tz = L(T.tz); q.bl = L(T.bl); q.br = L(T.br); q.hy = T.hy ? L(T.hy) : 0; q.i = t < 0.5 ? i0 : i1; q.i0 = i0; q.i1 = i1;
    return q;
  }
  // the front row's offset at a crAt() frame: the barrier segment i0 -> i1 is drawn with i0's type (a tyre wall ending there) and the next one with i1's
  const crFirstQ = (first, q, side) => Math.max(first(q.i0, side), first(q.i1, side));
  // is (x, z) inside the band [centre line, barrier + first - 0.6] of a same-side barrier segment j -> j + 1 within 12 samples of i, or closer than
  // that across a sample's own strip (|along| < 0.55 ds, as clearance() measures it for the nearest sample)? On the inside of a tight bend the
  // neighbouring samples' bands fan in over the spot, and their barriers can stand farther out than the nearest sample's
  function crInBand(i, side, x, z, first) {
    const N = T.N, bar = side > 0 ? T.br : T.bl;
    for (let d = -12; d <= 12; d++) {
      let j = i + d; if (T.open) { if (j < 0 || j > N - 1) continue; } else j = ((j % N) + N) % N;
      const dx = x - T.px[j], dz = z - T.pz[j];
      if (Math.abs(dx * T.tx[j] + dz * T.tz[j]) < T.ds * 0.55 && side * (dx * T.nx[j] + dz * T.nz[j]) < bar[j] + Math.max(first(j, side), first(T.open ? Math.max(0, j - 1) : (j + N - 1) % N, side)) - 0.6) return true;
      if (T.open && j > N - 2) continue;
      const j1 = T.open ? j + 1 : (j + 1) % N, f = first(j, side) - 0.6, oa = side * (bar[j] + f), ob = side * (bar[j1] + f);
      const P = [T.px[j], T.pz[j], T.px[j1], T.pz[j1], T.px[j1] + T.nx[j1] * ob, T.pz[j1] + T.nz[j1] * ob, T.px[j] + T.nx[j] * oa, T.pz[j] + T.nz[j] * oa];
      let ins = false; for (let a = 0, b = 3; a < 4; b = a++) { const xa = P[a * 2], za = P[a * 2 + 1], xb = P[b * 2], zb = P[b * 2 + 1]; if ((za > z) !== (zb > z) && x < (xb - xa) * (z - za) / (zb - za) + xa) ins = !ins; }
      if (ins) return true;
    }
    return false;
  }
  // A crowd along s in [sa, sb) behind the barrier on one side (+1 right, -1 left), facing the road and turned a little towards the oncoming cars.
  // o: rows, dens (share of slots filled, less in the back rows), first (offset of the front row beyond the barrier: number or f(i, side)), gap (row
  // spacing), step, clump (0 even .. 1 in groups), sit, flag, below / above (allowed ground height relative to the road), maxSlope, minClear,
  // strip (dark ground strip; default on where dens >= 0.3), excl (tree exclusion, default on), keepBar (the exclusion stays this far off the barrier line), label.
  function crowdRun(C, sa, sb, side, o) {
    o = o || {};
    const rows = o.rows || 3, dens = o.dens == null ? 0.7 : o.dens, gap = o.gap || 0.95, step = o.step || 1.0, clump = o.clump == null ? 0.5 : o.clump;
    const fv = o.first == null ? 1.2 : o.first, first = typeof fv === 'function' ? fv : () => fv;
    const below = o.below == null ? 1.5 : o.below, above = o.above == null ? 6 : o.above, maxS = o.maxSlope == null ? C.maxSlope : o.maxSlope, look = o.look == null ? 0.3 : o.look;
    const gH = o.gH || C.gH, near = o.near || C.near, exc = o.excluded || C.excluded, seed = ++C.runs * 13.37, segs = new Map();
    let n = 0; C.busy = true;
    for (let s = sa; s < sb; s += step) for (let row = 0; row < rows; row++) {
      const keep = dens * (1 - clump + 2 * clump * crNoise(s / 7 + seed + side * 5.3)) - row * (o.rowFall == null ? 0.06 : o.rowFall);
      if (crH(s, row * 7 + side, seed) >= keep) continue;
      const sj = s + (crH(s, row, seed + 1) - 0.5) * step * 0.7, q = crAt(sj); if (!q) continue;
      const f0 = crFirstQ(first, q, side), off = (side > 0 ? q.br : q.bl) + f0 + row * gap + (crH(sj, row, seed + 2) - 0.5) * 0.36;
      const x = q.px + q.nx * side * off, z = q.pz + q.nz * side * off, ry = q.hy, tx = q.tx, tz = q.tz, nx = q.nx, nz = q.nz;
      if (near(x, z) < (o.minClear == null ? f0 - 0.6 : o.minClear) || !crFree(C, x, z)) continue;   // another part of the road (or its verge) too close; taken
      if (o.minClear == null && crInBand(q.i0, side, x, z, first)) continue;   // in front of a neighbouring segment's barrier / catch fence (bend insides)
      if ((C.water && C.water(x, z)) || (exc && exc(x, z))) continue;
      const y = gH(x, z); if (y < ry - below || y > ry + above) continue;
      if (maxS < 9) { const sl = Math.hypot(gH(x + 1, z) - gH(x - 1, z), gH(x, z + 1) - gH(x, z - 1)) / 2; if (sl > maxS) continue; }
      const lk = look * (0.2 + crH(x, z, 12));
      if (!crowdPut(C, x, y, z, -side * nx - tx * lk, -side * nz - tz * lk, o, row)) continue;
      n++; const k = Math.floor(sj / 2); segs.set(k, Math.max(segs.get(k) || 0, row + 1));
    }
    C.busy = false;
    if (n && (o.strip != null ? o.strip : dens >= 0.3)) crStrip(C, segs, side, first, gap, gH, near, o.dark == null ? 0.58 : o.dark);   // (none under thin, scattered crowds)
    if (n && o.excl !== false) {   // tree exclusion circles along the run, overlapping (keepBar: how far they stay off the barrier line)
      const depth = (rows - 1) * gap;
      for (const k of segs.keys()) { const q = crAt(k * 2 + 1); if (!q) continue; const f0 = crFirstQ(first, q, side), oc = f0 + depth / 2, r = Math.max(1.2, Math.min(depth / 2 + 2, oc - (o.keepBar == null ? 0.3 : o.keepBar)));
        if (k % Math.max(1, Math.floor(r / 2)) && segs.has(k - 1)) continue;
        const off = (side > 0 ? q.br : q.bl) + oc; C.exclAdd(q.px + q.nx * side * off, q.pz + q.nz * side * off, r); }
    }
    C.log.push((o.label || 'run') + ':' + n);
    return n;
  }
  function crStrip(C, segs, side, first, gap, gH, near, dark) {   // multiply-blended ground strip under the rows: dark under the people, fading out at the edges and ends
    const W1 = [1, 1, 1];
    for (const [k, rw] of segs) {
      const ends = (segs.has(k - 1) ? 0 : 1) + (segs.has(k + 1) ? 0 : 1), dk = 1 - (1 - dark) * (ends === 2 ? 0.45 : ends ? 0.75 : 1) * Math.min(1, 0.6 + 0.2 * rw), D = [dk, dk, dk];
      const pts = [];
      for (const s of [k * 2, k * 2 + 2]) { const q = crAt(s); if (!q) break; const f0 = crFirstQ(first, q, side), bar = side > 0 ? q.br : q.bl, lo = [bar + f0 - 0.7, bar + f0 - 0.15, bar + f0 + (rw - 1) * gap + 0.15, bar + f0 + (rw - 1) * gap + 0.9];
        pts.push(lo.map(o => { const x = q.px + q.nx * side * o, z = q.pz + q.nz * side * o; return [x, gH(x, z) + 0.05, z]; })); }
      if (pts.length < 2) continue;
      const [a, b] = pts; if (near(a[0][0], a[0][2]) < 0.2 || near(b[0][0], b[0][2]) < 0.2 || (C.water && (C.water(a[3][0], a[3][2]) || C.water(b[3][0], b[3][2])))) continue;
      const g = C.strip.get(a[1][0], a[1][2]);
      g.quadUp(a[0], b[0], b[1], a[1], [W1, W1, D, D]); g.quadUp(a[1], b[1], b[2], a[2], [D, D, D, D]); g.quadUp(a[2], b[2], b[3], a[3], [D, D, W1, W1]);
    }
  }
  function crowdFinish(C, root, out) {   // building footprints placed after the crowds hide nobody; the layer and the strips go into the world
    if (C.blocks.length) {
      const bh = new Map(); for (const b of C.blocks) { const r = Math.hypot(b.hw, b.hd); for (let a = Math.floor((b.x - r) / 32); a <= Math.floor((b.x + r) / 32); a++) for (let c = Math.floor((b.z - r) / 32); c <= Math.floor((b.z + r) / 32); c++) { const k = a + ',' + c; let L = bh.get(k); if (!L) bh.set(k, L = []); L.push(b); } }
      C.culled = C.ppl.cull((x, z) => { const L = bh.get(Math.floor(x / 32) + ',' + Math.floor(z / 32)); if (L) for (const b of L) { const dx = x - b.x, dz = z - b.z; if (Math.abs(dx * b.c + dz * b.s) < b.hw && Math.abs(-dx * b.s + dz * b.c) < b.hd) return true; } return false; });
    }
    const grp = new THREE.Group(); grp.name = 'crowds'; root.add(grp);
    const n = C.ppl.addTo(grp);
    C.strip.addTo(grp, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.MultiplyBlending, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }), false, false);
    out.dyn.crowd = C.U; out.crowdN = n; out.crowdLog = C.log;
    return n;
  }

  function nrTreeGeo(kind) {   // unit trees (height 1, instances scale them): 0 spruce, 1 beech, 2 young tree / bush
    const g = new GB(), R = rng(610 + kind);
    if (kind === 0) {   // spruce: thin trunk, four stacked tiers, dark
      cone(g, 0, -0.02, 0, 0.035, 0.3, 4, [0.3, 0.22, 0.15], null, 0);
      const col = [0.12, 0.25, 0.13], tip = [0.2, 0.36, 0.18];
      cone(g, 0, 0.12, 0, 0.27, 0.36, 7, col, tip, 0.2); cone(g, 0, 0.32, 0, 0.21, 0.32, 7, [col[0] * 1.05, col[1] * 1.05, col[2] * 1.05], tip, 0.6);
      cone(g, 0, 0.52, 0, 0.15, 0.3, 6, col, tip, 1.1); cone(g, 0, 0.72, 0, 0.09, 0.28, 5, col, tip, 0.3);
    } else if (kind === 1) {   // beech: grey trunk, a big round crown of two lumps
      cyl(g, 0, -0.02, 0, 0.04, 0.42, 4, [0.46, 0.44, 0.4], null, 0.03);
      ico(g, 0, 0.64, 0, 0.33, 0.92, [0.2, 0.36, 0.12], R, 0.3);
    } else {   // young tree / bush
      ico(g, 0, 0.35, 0, 0.45, 0.8, [0.25, 0.39, 0.15], R, 0.3);
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  let nrATex = null;
  function nrAtlas(names) {   // text boards (4 x 16 cells of 256 x 64): km 1-20, the corner names, banners
    if (nrATex) nrATex.dispose();
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 56, 256, 8); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 33, 240); };
    for (let k = 1; k <= 20; k++) cell(k - 1, '#f4f4f0', '#111', k + ' km', 44, '#111');
    names.forEach((n, k) => cell(20 + k, '#1d5f2c', '#fff', n.toUpperCase(), n.length > 14 ? 26 : 32, '#e8e8e0'));
    const B = 20 + names.length;
    cell(B, '#16181c', '#fff', 'START · ZIEL', 36); cell(B + 1, '#123f86', '#fff', 'NÜRBURGRING', 38); cell(B + 2, '#1a1a1a', '#6fdc3c', 'GRÜNE HÖLLE', 38); cell(B + 3, '#f2c21a', '#111', 'NORDSCHLEIFE', 36);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (nrATex = t);
  }
  const nrAUV = (k) => { const u0 = (k % 4) / 4, v1 = 1 - Math.floor(k / 4) / 16; return [u0, v1 - 1 / 16, u0 + 0.25, v1]; };

  function buildNring(scene, tex, opts) {
    const R = rng(9120), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true };
    nrPrep();
    const P = NR, G = P.G;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 64;   // tree exclusion circles (buildings, crowds, bridges), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const dS = (s) => { let d = s - sStart; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line along the lap
    const sAt = (d) => ((sStart + d) % T.len + T.len) % T.len;
    const nameD = (n) => { const f = T.names.find(q => q.n === n); return f ? f.d : null; };

    /* ---- terrain tiles ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: tex.grass, vertexColors: true });
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1;
        const m = new THREE.Mesh(nrTileGeo(ti, tj, on === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++;
      }
    }

    /* ---- the Karussell: the banked concrete bowl on the inside of the left-hander (lighter slabs on the inner half of the road) ---- */
    const kar = (() => { const d = nameD('Karussell'); if (d == null) return null; let i = T.idx(sAt(d)), a = i, b = i;
      for (let n = 0; n < 60 && T.k[(a - 1 + N) % N] < -1 / 70; n++) a = (a - 1 + N) % N;
      for (let n = 0; n < 60 && T.k[(b + 1) % N] < -1 / 70; n++) b = (b + 1) % N;
      return { a: (a - 6 + N) % N, b: (b + 4) % N }; })();
    const inKar = (i) => kar && (kar.a <= kar.b ? i >= kar.a && i <= kar.b : i >= kar.a || i <= kar.b);

    /* ---- road: asphalt, white edge lines, kerbs, grass verges out past the rails (256 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y + nrBankY(i, o), T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    // kerbs: inside of every bend, outside only in the tighter ones
    const kerb = [new Uint8Array(N), new Uint8Array(N)];
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) { const inside = side * k > 0; if (inside || Math.abs(k) > 1 / 55) kerb[side > 0 ? 1 : 0][i] = 1; } }
    const CH = 128, offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;
    const shade = (i, o) => { const rl = T.rl[i]; let k = 0.86 - 0.15 * Math.exp(-((o - rl) * (o - rl)) / 5); if (Math.abs(o) > w * 0.92) k -= 0.03;
      if (inKar(i) && o < 1.5) { const c = i % 2 ? 1.28 : 1.18; return [c, c * 0.99, c * 0.96]; }   // concrete slabs (the bowl)
      return [k, k, k * 1.02]; };
    const vergeRow = (i, side) => {   // cross-section beyond the road edge: [offset, height above the road], lifted onto the ground where it rises
      const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i] + nrBankY(i, side * w), lift = (o, h) => { const q = side * o, g = nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y; return [o, Math.max(h, g)]; };
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
    };
    const vg = [0.97, 1.05, 0.92];
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true), gl = new RB(), gv = new RB(true), gk = new RB(true);
      let pr = -1, pl = -1, pv = [-1, -1], pk = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v]));
        if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const wl = [0.94, 0.94, 0.9], l = gl.row([Pt(i, -w + 0.2, 0.034), Pt(i, -w + 0.5, 0.034), Pt(i, w - 0.5, 0.034), Pt(i, w - 0.2, 0.034)], [wl, wl, wl, wl]);
        if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        for (const side of [-1, 1]) {
          const si = side > 0 ? 1 : 0, vr = vergeRow(i, side), pts = vr.map(([o, h]) => Pt(i, side * o, h)), cols = vr.map(([o], k) => { const p = pts[k]; if (k < 3) return vg; const gc = nrGCol(p[0], p[2]); return k === 3 ? [lerp(vg[0], gc[0], 0.5), lerp(vg[1], gc[1], 0.5), lerp(vg[2], gc[2], 0.5)] : gc; });
          const ordered = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };   // rows run left -> right
          const rv = gv.row(ordered.p, ordered.c, ordered.p.map(p => [p[0] / 14, -p[2] / 14]));   // (the terrain tiles' grass scale: no seam)
          if (pv[si] >= 0) gv.link(pv[si], rv, 0, 4); pv[si] = rv;
          if (kerb[si][i]) {   // red/white kerb, raised a little towards its outer edge
            const kp = side > 0 ? [Pt(i, w - 0.02, 0.04), Pt(i, w + T.curbW, 0.085)] : [Pt(i, -(w + T.curbW), 0.085), Pt(i, -w + 0.02, 0.04)];
            const rk = gk.row(kp, [[1, 1, 1], [1, 1, 1]], side > 0 ? [[0, ii * ds / 3], [1, ii * ds / 3]] : [[1, ii * ds / 3], [0, ii * ds / 3]]);
            if (pk[si] >= 0) gk.link(pk[si], rk, 0, 1); pk[si] = rk;
          } else pk[si] = -1;
        }
      }
      addM(gr, aMat); addM(gl, lMat); addM(gv, gMat); addM(gk, cMat);
    }
    // chequered start / finish line and the grid boxes (13 cars, staggered)
    {
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wh = [0.93, 0.93, 0.9], HYp = (p) => T.hy[p[3]];
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) {
        const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.4;
        const p0 = atSf(sb, lat - 1.5), p1 = atSf(sb, lat + 1.5), p2 = atSf(sb + 0.35, lat + 1.5), p3 = atSf(sb + 0.35, lat - 1.5);
        gw.quadUp([p0[0], HYp(p0) + 0.037, p0[1]], [p1[0], HYp(p1) + 0.037, p1[1]], [p2[0], HYp(p2) + 0.037, p2[1]], [p3[0], HYp(p3) + 0.037, p3[1]], [wh, wh, wh, wh]);
        const q0 = atSf(sb - 1.6, lat - 1.5), q1 = atSf(sb + 0.35, lat - 1.5), q2 = atSf(sb + 0.35, lat - 1.25), q3 = atSf(sb - 1.6, lat - 1.25);
        gw.quadUp([q0[0], HYp(q0) + 0.037, q0[1]], [q1[0], HYp(q1) + 0.037, q1[1]], [q2[0], HYp(q2) + 0.037, q2[1]], [q3[0], HYp(q3) + 0.037, q3[1]], [wh, wh, wh, wh]);
      }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- barriers: double armco on posts nearly everywhere, concrete walls with catch fences along the T13 straight, concrete parapets on the bridges ---- */
    const bridgeI = (def.brO || []).map(([x, z]) => T.nearestIdx(x, z));
    const onBridge = (i) => { for (const b of bridgeI) { let d = Math.abs(i - b); d = Math.min(d, N - d); if (d * ds < 16) return true; } return false; };
    const t13 = (i) => { const d = dS(i * ds); return d > T.len - 230 || d < 170; };   // start / finish area
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.13, 1, 0.13, 0, [0.42, 0.43, 0.46], null, true); return g.geometry(); })();
    const posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
    const fence = [new Uint8Array(N), new Uint8Array(N)];   // catch fences (set below where the spectators stand)
    const kind = (i) => (onBridge(i) ? 2 : t13(i) ? 1 : 0);   // 0 armco, 1 wall + fence, 2 parapet
    const steel = [0.8, 0.82, 0.85], steelD = [0.5, 0.52, 0.56], conc = [0.72, 0.72, 0.7], concD = [0.6, 0.6, 0.58];
    const railRow = (gr, i, side, k) => {   // guardrail / wall cross-section at sample i (rows run so that the faces look at the road)
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.12), h = k === 1 ? 1.05 : 1.15;
      const o2 = side * (bar + (k === 0 ? 0.42 : 0.45));   // the top: the rail's back (a W-beam is ~0.3 m deep) / the wall's thickness, seen from the high cameras
      let p = k === 0 ? [Pt(i, o, 0.32), Pt(i, o, 0.6), Pt(i, o, 0.66), Pt(i, o, 0.95), Pt(i, o2, 0.95)] : [Pt(i, o, -0.4), Pt(i, o, 0.1), Pt(i, o, h - 0.1), Pt(i, o, h), Pt(i, o2, h)];
      let c = k === 0 ? [steel, steelD, steel, [0.9, 0.91, 0.93], [0.72, 0.74, 0.77]] : [concD, conc, conc, [0.84, 0.84, 0.82], [0.8, 0.8, 0.78]];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB();
      for (const side of [-1, 1]) {
        let prev = -1, pk = -1;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, k = kind(i);
          if (prev >= 0 && k !== pk) { gr.link(prev, railRow(gr, i, side, pk), 0, 4); prev = -1; }   // the old kind of barrier runs up to here, the new one starts here
          const r = railRow(gr, i, side, k); if (prev >= 0) gr.link(prev, r, 0, 4); prev = r; pk = k;
          if (k === 0 && ii % 2 === 0 && ii < c0 + CH) { const p = Pt(i, side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.24), 0); posts.add(p[0], p[1] - 0.35, p[2], T.hd[i], 1, 1.25); }
        }
      }
      addM(gr, rMat, true);
    }
    const nPosts = posts.addTo(root, true);
    nringProps(out, t13, onBridge, inKar);   // knockable tyre walls and roadside posts

    /* ---- scenery (vertex coloured, 128 m chunks) ---- */
    const scen = new Chunks(128), ban = new GB(true), crowdG = new GB(true), fenceG = new GB(true);
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.2, 0.7, 0.3], [1, 0.55, 0.1], [0.15, 0.5, 0.55], [0.7, 0.2, 0.5], [0.12, 0.14, 0.2]];
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.8 });   // spectators (instanced)
    const carPk = (x, z, rot, col) => { const g = scen.get(x, z), y = nrGround(x, z), c = Math.cos(rot), s = Math.sin(rot);
      box(g, x, y + 0.25, z, 4.3, 0.8, 1.85, rot, col, null, true); box(g, x - c * 0.35, y + 1.05, z - s * 0.35, 2.3, 0.62, 1.62, rot, [0.16, 0.2, 0.26], col, true);
      for (const [a, b] of [[1.35, 0.8], [1.35, -0.8], [-1.35, 0.8], [-1.35, -0.8]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.66, 0.66, 0.24, rot, [0.08, 0.08, 0.09], null, true); };
    const tent = (x, z, rot, col) => { const g = scen.get(x, z), y = nrGround(x, z); box(g, x, y, z, 3.2, 1.9, 3.2, rot, col, null, true); gable(g, x, y + 1.9, z, 3.5, 3.5, 1.0, rot, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], col); };
    const board = (cx, cy, cz, tx, tz, W, H, cellK) => {   // text board (bottom centre cx, cy, cz) facing -t (read by cars driving along +t), a dark back behind it
      const [u0, v0, u1, v1] = nrAUV(cellK), ux = tz, uz = -tx, hw = -W / 2, W1 = [1, 1, 1];   // (the text's left edge on the driver's left)
      const A = [cx - ux * hw, cy, cz - uz * hw], B = [cx + ux * hw, cy, cz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban.quadO(A, B, C, D, W1, [cx + tx, cy + H / 2, cz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      box(scen.get(cx, cz), cx + tx * 0.06, cy - 0.02, cz + tz * 0.06, 0.08, H + 0.04, W + 0.04, Math.atan2(tz, tx), [0.3, 0.31, 0.33], null, true);
    };
    const signPost = (s, side, extra, cellK, W, H, y0) => {   // a board on two posts beside the track, facing the traffic
      const [x, z, i] = onSide(s, side, extra), y = nrGround(x, z), g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i];
      for (const o of [-W / 2 + 0.2, W / 2 - 0.2]) box(g, x + nx * o + T.tx[i] * 0.16, y - 0.3, z + nz * o + T.tz[i] * 0.16, 0.1, y0 + H + 0.3, 0.1, T.hd[i], [0.55, 0.56, 0.58]);
      board(x, y + y0, z, T.tx[i], T.tz[i], W, H, cellK); exclPush(x, z, 3);
    };
    const roomSide = (s) => { let l = 0, r = 0; for (let d = -30; d <= 30; d += 6) { const i = T.idx(s + d); l += T.bl[i]; r += T.br[i]; } return r > l ? 1 : -1; };
    const nm = T.names.map(q => q.n);
    const atlas = nrAtlas(nm), BAN = 20 + nm.length;

    /* ---- START / FINISH at T13: gantry with the start lights, concrete walls and catch fences, flags, the T13 grandstand ---- */
    {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.8, 7.9, 0.8, h, gray);
      box(g, x, gy + 6.4, z, 1.1, 1.3, span * 2 + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, gy + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, gy + 7.95, z + nz * o); m.rotation.y = -h; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      board(x - T.tx[i] * 0.6, gy + 6.45, z - T.tz[i] * 0.6, T.tx[i], T.tz[i], span * 2 - 2, 1.2, BAN);
      exclPush(x, z, span + 6);
      for (let d = -220; d < 160; d += 14) for (const side of [-1, 1]) {   // flag poles behind the walls
        const [px, pz, ii] = onSide(sAt(d), side, 2.2), py = nrGround(px, pz), gg = scen.get(px, pz); CR.avoid(px, pz, 0.45);
        cyl(gg, px, py, pz, 0.06, 6, 5, [0.86, 0.86, 0.88]); box(gg, px + T.tx[ii] * 0.6, py + 4.8, pz + T.tz[ii] * 0.6, 1.2, 0.8, 0.05, T.hd[ii], fans[Math.floor(R() * fans.length)], null, true);
      }
    }
    for (let i = 0; i < N; i++) if (t13(i)) { fence[0][i] = 1; fence[1][i] = 1; }

    /* ---- buildings (OpenStreetMap footprints near the track) and the T13 grandstand ---- */
    let nBld = 0; const crB0 = excl.length;
    for (const [bx, bz, L, W, ang, H, k] of def.bld || []) {
      const ca = Math.cos(ang), sa = Math.sin(ang), corners = [[L / 2, W / 2], [L / 2, -W / 2], [-L / 2, W / 2], [-L / 2, -W / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      let clash = false, y0 = 1e9; for (const [cx, cz] of corners.concat([[bx, bz]])) { const n = nrNear(cx, cz); if (n.i >= 0 && n.dd < 1.5) clash = true; y0 = Math.min(y0, nrGround(cx, cz)); }
      if (clash) continue;
      const g = scen.get(bx, bz); nBld++; CR.block(bx, bz, L, W, ang);   // (nobody stands inside it)
      if (k === 2) {   // grandstand: tiers climbing away from the track, a crowd on every tier, roof on pillars
        const n = nrNear(bx, bz), i = n.i, tx0 = T.px[i] - bx, tz0 = T.pz[i] - bz, fa = (tx0 * -sa + tz0 * ca) > 0 ? 1 : -1;   // +1: the front faces the local +b axis
        const tiers = 9, dep = W / tiers;
        for (let t = 0; t < tiers; t++) { const b = fa * (W / 2 - (t + 0.5) * dep), cx = bx - sa * b, cz = bz + ca * b, hgt = 0.9 + t * 0.85;
          box(g, cx, y0, cz, L, hgt, dep, ang, [0.62, 0.63, 0.66], [0.52, 0.53, 0.57]);
          const b0 = b - fa * dep * 0.45, b1 = b + fa * dep * 0.1, yy = y0 + hgt + 0.02, A = [bx - ca * L / 2 - sa * b0, yy, bz - sa * L / 2 + ca * b0], B = [bx + ca * L / 2 - sa * b0, yy, bz + sa * L / 2 + ca * b0], C = [bx + ca * L / 2 - sa * b1, yy, bz + sa * L / 2 + ca * b1], D = [bx - ca * L / 2 - sa * b1, yy, bz - sa * L / 2 + ca * b1];
          crowdG.quadUp(A, B, C, D, [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]], [[0, t * 0.11], [L / 12, t * 0.11], [L / 12, t * 0.11 + 0.1], [0, t * 0.11 + 0.1]]); }
        const bb = -fa * (W / 2 + 0.3); box(g, bx - sa * bb, y0, bz + ca * bb, L, 9.6, 0.6, ang, [0.55, 0.56, 0.6]);
        for (let a = -L / 2; a <= L / 2 + 0.1; a += L / 8) { const px = bx + ca * a - sa * bb * 0.96, pz = bz + sa * a + ca * bb * 0.96; box(g, px, y0, pz, 0.45, 12.2, 0.45, ang, [0.86, 0.87, 0.9]); }
        const rb = -fa * (W / 2 - W * 0.3); for (let a = -L / 2, st = 0; a < L / 2 - 0.1; a += L / 12, st++) { const px = bx + ca * (a + L / 24) - sa * rb, pz = bz + sa * (a + L / 24) + ca * rb; box(g, px, y0 + 12.2, pz, L / 12 + 0.02, 0.4, W * 0.62, ang, [0.8, 0.82, 0.86], st % 2 ? [0.94, 0.95, 0.96] : [0.14, 0.4, 0.2]); }
        exclPush(bx, bz, Math.max(L, W) / 2 + 8);
      } else if (k === 1) {   // industrial hall: metal walls, flat roof
        const hh = H || 8 + R() * 3, wc = vary([0.62, 0.66, 0.7], R, 0.12);
        box(g, bx, y0 - 0.4, bz, L, hh + 0.4, W, ang, wc, [0.5, 0.52, 0.55]);
        exclPush(bx, bz, Math.max(L, W) / 2 + 4);
      } else {   // house: rendered walls, a pitched roof along the long side
        const hh = H || 5.6 + R() * 2.2, walls = [[0.93, 0.9, 0.84], [0.96, 0.95, 0.92], [0.86, 0.82, 0.74], [0.9, 0.86, 0.8]], roofs = [[0.32, 0.3, 0.32], [0.46, 0.22, 0.16], [0.24, 0.24, 0.27]];
        box(g, bx, y0 - 0.4, bz, L, hh + 0.4, W, ang, vary(walls[Math.floor(R() * walls.length)], R, 0.06), null, true);
        if (L * W < 1500) gable(g, bx, y0 + hh, bz, L + 0.6, W + 0.6, Math.min(4.2, W * 0.42), ang, roofs[Math.floor(R() * roofs.length)], [0.8, 0.78, 0.74]);
        else box(g, bx, y0 + hh, bz, L, 0.5, W, ang, [0.5, 0.5, 0.52]);
        exclPush(bx, bz, Math.max(L, W) / 2 + 3);
      }
    }

    const crB1 = excl.length;
    /* ---- bridges: the track on bridges over the roads (concrete parapets above), and two bridges over the track ---- */
    for (const [x, z] of def.brU || []) {
      const i = T.nearestIdx(x, z), hd = T.hd[i], cx = T.px[i], cz = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L = T.bl[i] + T.br[i] + 14, off = (T.br[i] - T.bl[i]) / 2, g = scen.get(cx, cz);
      const mx = cx + nx * off, mz = cz + nz * off;
      box(g, mx, y + 6.6, mz, 6.5, 1.1, L, hd, [0.64, 0.64, 0.62], [0.52, 0.5, 0.46]);   // deck (a forest road over the track)
      for (const f of [-1, 1]) box(g, mx + T.tx[i] * 3.1 * f, y + 7.7, mz + T.tz[i] * 3.1 * f, 0.25, 1.0, L, hd, [0.7, 0.7, 0.68]);   // parapets
      for (const sd of [-1, 1]) { const o = sd > 0 ? T.br[i] + 3 : -(T.bl[i] + 3), px = cx + nx * o, pz = cz + nz * o, gy = Math.min(nrGround(px, pz), y);   // abutments
        box(g, px, gy - 1, pz, 7, y + 6.6 - gy + 1, 4.5, hd, [0.6, 0.6, 0.58], [0.5, 0.5, 0.48]); }
      board(mx - T.tx[i] * 3.3, y + 6.62, mz - T.tz[i] * 3.3, T.tx[i], T.tz[i], Math.min(16, L - 4), 1.05, BAN + 1);
      exclPush(mx, mz, L / 2 + 6);
    }

    /* ---- marshal posts, km boards, corner-name boards ---- */
    for (let d = 260, k = 0; d < T.len - 250; d += 480, k++) {   // marshal post: a white hut with a flag pole
      const s = sAt(d), side = k % 2 ? roomSide(s) : -roomSide(s), [x, z, i] = onSide(s, side, 2.4), y = nrGround(x, z), g = scen.get(x, z);
      if (excluded(x, z)) continue;
      box(g, x, y - 0.2, z, 2.4, 2.5, 2.2, T.hd[i], [0.94, 0.94, 0.92], [0.9, 0.36, 0.12], true);
      box(g, x - T.nx[i] * side * 0.4, y + 1.1, z - T.nz[i] * side * 0.4, 1.6, 0.6, 2.25, T.hd[i], [0.2, 0.28, 0.36], null, true);   // window
      const fx = x + T.tx[i] * 1.8, fz = z + T.tz[i] * 1.8; cyl(g, fx, y, fz, 0.05, 4.2, 5, [0.85, 0.85, 0.87]); box(g, fx + T.tx[i] * 0.45, y + 3.4, fz + T.tz[i] * 0.45, 0.9, 0.6, 0.04, T.hd[i], [0.98, 0.84, 0.1], null, true);
      exclPush(x, z, 5);
    }
    for (let km = 1; km <= 20; km++) { const s = sAt(km * 1000); signPost(s, roomSide(s), 1.4, km - 1, 1.9, 0.48, 1.1); }
    T.names.forEach((q, k) => { const s = sAt(q.d - 55); signPost(s, roomSide(s), 1.6, 20 + k, 3.2, 0.8, 1.2); });

    /* ---- spectators, fans' tents and cars at the famous places, catch fences in front of them ---- */
    const FANS = { 'Brünnchen': 3, 'Pflanzgarten': 3, 'Karussell': 3, 'Wippermann': 2, 'Hohe Acht': 2, 'Adenauer Forst': 2, 'Breidscheid': 2, 'Flugplatz': 2, 'Hatzenbach': 2, 'Schwalbenschwanz': 2, 'Kesselchen': 1, 'Galgenkopf': 1, 'Eschbach': 1, 'Metzgesfeld': 1, 'Ex-Mühle': 1, 'Bergwerk': 1, 'Fuchsröhre': 1, 'Aremberg': 1, 'Klostertal': 1, 'Quiddelbacher Höhe': 1, 'Döttinger Höhe': 1 };
    const tcols = [[0.85, 0.16, 0.14], [0.15, 0.36, 0.8], [0.95, 0.75, 0.12], [0.2, 0.62, 0.3], [0.92, 0.92, 0.9], [0.55, 0.3, 0.7]];
    let nFans = 0; const crE0 = excl.length;
    for (const q of T.names) {
      const wgt = FANS[q.n]; if (!wgt) continue;
      const sm = sAt(q.d), side = roomSide(sm), half = 18 + wgt * 12;
      for (let s = sm - half; s < sm + half; s += 1.15) for (let row = 0; row < wgt; row++) {
        if (R() > 0.72 - row * 0.12) continue;
        const ex = 2.4 + row * 1.2 + (R() - 0.5) * 0.4, [x, z] = onSide(s, side, ex); if (nrNear(x, z).dd < 1.2 || nrSlope(x, z) > 0.8) continue;
        const sc = fans[Math.floor(R() * fans.length)]; R();   // (two draws, as the old merged figure)
        crowdAt(CR, s, side, ex, x, z, { col: sc, sit: 0.25, flag: 0.08 }, row, (a, b) => nrNear(a, b).dd >= 1.2 && nrSlope(a, b) <= 0.8); nFans++;
      }
      for (let ii = T.idx(sm - half - 6), n = 0; n < (2 * half + 12) / ds; n++, ii = (ii + 1) % N) fence[side > 0 ? 1 : 0][ii] = 1;
      if (wgt >= 2) for (let k = 0; k < wgt * 5; k++) {   // camping in the woods behind the crowd (the 24 h race tradition)
        const s = sm + (R() - 0.5) * half * 2, [x, z, i] = onSide(s, side, 9 + R() * 22); if (nrSlope(x, z) > 0.45) continue;
        if (R() < 0.55) tent(x, z, T.hd[i] + (R() - 0.5) * 0.6, tcols[Math.floor(R() * tcols.length)]); else carPk(x, z, T.hd[i] + (R() - 0.5) * 0.8, vary(fans[Math.floor(R() * fans.length)], R, 0.2));
      }
      const [ex, ez] = onSide(sm, side, 14); exclPush(ex, ez, half + 10);
    }
    /* ---- more spectators (instanced, hashed: no draws from R): the far side at the famous places, more rows at the big five, the places that had
       nobody, both sides of the T13 straight, groups along Döttinger Höhe and small groups everywhere; chain link in front of the bigger crowds ---- */
    {
      const fanE = new Set(excl.slice(crE0)), bldE = new Set(excl.slice(crB0, crB1));   // (the famous places' and the buildings' tree exclusions are large; the new crowds may stand inside them, the footprints are culled)
      const hard = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (const e of L) { if (fanE.has(e) || bldE.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 1.2, gap: 1.15, excluded: hard, below: 3, above: 8, sit: 0.3, flag: 0.07 };
      const run = (d0, d1, side, o, fc) => { const n = crowdRun(CR, sStart + d0, sStart + d1, side, Object.assign({}, M, o));
        if (n && fc) for (let ii = T.idx(sStart + d0 - 6), k = 0; k < (d1 - d0 + 12) / ds; k++, ii = (ii + 1) % N) fence[side > 0 ? 1 : 0][ii] = 1; return n; };
      const BIG = { 'Brünnchen': 1, 'Pflanzgarten': 1, 'Karussell': 1, 'Flugplatz': 1, 'Hatzenbach': 1 }, NEW = ['Hocheichen', 'Schwedenkreuz', 'Kallenhard', 'Wehrseifen', 'Eiskurve', 'Stefan-Bellof-S', 'Kleines Karussell', 'Antoniusbuche', 'Tiergarten', 'Hohenrain'];
      for (const q of T.names) {
        const wgt = FANS[q.n] || 0, sm = sAt(q.d), side = roomSide(sm), d = q.d;
        if (wgt) { const half = 18 + wgt * 12;
          run(d - half, d + half, -side, { rows: Math.min(3, wgt + 1), dens: 0.62, label: 'NR far ' + q.n }, true);
          if (BIG[q.n]) run(d - half - 24, d + half + 24, side, { first: 2.4 + wgt * 1.2, rows: 2, dens: 0.55, label: 'NR more ' + q.n }); }
        else if (NEW.includes(q.n)) { run(d - 46, d + 40, side, { rows: 3, dens: 0.66, label: 'NR ' + q.n }, true); run(d - 36, d + 30, -side, { rows: 2, dens: 0.5, label: 'NR far ' + q.n }, true); }
      }
      for (const sd of [-1, 1]) run(-220, 160, sd, { rows: 3, gap: 1.0, dens: 0.6, sit: 0, label: 'NR T13' });
      for (const sd of [-1, 1]) run(17900, 19600, sd, { rows: 2, dens: 0.3, clump: 0.85, label: 'NR Döttinger Höhe' });
      for (const sd of [-1, 1]) run(200, T.len - 250, sd, { rows: 2, dens: 0.06, clump: 0.95, strip: false, label: 'NR groups' });
      for (const e of CR.circ) exclPush(e.x, e.z, e.r);   // the forest keeps clear of them
    }
    // catch fences (chain link on posts) right behind the rails where the fences were asked for
    for (const side of [-1, 1]) {
      const fc = fence[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N, seg = ds; if (!fc[i] || !fc[j]) { acc += seg; continue; }
        const Q = (ii, y) => { const o = side * (bar[ii] + 0.55); return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + y + nrBankY(ii, o), T.pz[ii] + T.nz[ii] * o]; };
        const u0 = acc / 2.5, u1 = (acc + seg) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        fenceG.quadO(Q(i, 0.9), Q(j, 0.9), Q(j, 3.6), Q(i, 3.6), [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 1.1], [u0, 1.1]]);
        if (i % 3 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] - 0.2, p[2], 0.1, 3.8, 0.1, T.hd[i], [0.6, 0.61, 0.64]); }
        acc += seg;
      }
    }

    /* ---- the forest: spruce and beech where OpenStreetMap has woods, bushes on the scrub, lone trees on the meadows ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const tk = [new IChunks(nrTreeGeo(0), tMat, 128), new IChunks(nrTreeGeo(1), tMat, 128), new IChunks(nrTreeGeo(2), tMat, 128)];   // (small chunks: the view and the shadow box cull them well)
    let nTrees = 0;
    {
      const L = NRC * NRT, maxT = Math.round(150000 * dens);
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * L, za = G.z0 + tj * L;
        for (let zz = za; zz < za + L; zz += 6.2) for (let xx = xa; xx < xa + L; xx += 6.2) {
          const x = xx + (R() - 0.5) * 5.4, z = zz + (R() - 0.5) * 5.4, rd = nrDist(x, z), r1 = R(), r2 = R();
          if (rd > 250) continue;
          if (rd > 70 && ((Math.floor(xx / 6.2) + Math.floor(zz / 6.2)) & 1)) continue;   // farther out every other spot, bigger trees (a closed canopy from above)
          const cl = nrLC(x, z), far = rd > 70;
          const p = cl === 1 ? 0.92 : cl === 2 ? 0.45 : cl === 3 ? 0.035 : 0.018;
          if (r1 > p) continue;
          if (rd < 48) { const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 3.2) continue; if (nn.i >= 0 && nn.dd < 7 && r2 < 0.35) continue; }   // (farther out no tree can reach the barriers)
          if (excluded(x, z)) continue;
          const y = nrGround(x, z), sp = cl === 1 ? (P.n1(x * 2.2 + 500, z * 2.2) < 0.55 + (R() - 0.5) * 0.3 ? 0 : 1) : cl === 2 ? 2 : 1;
          const hgt = sp === 0 ? (10 + R() * 5.5) * (far ? 1.15 : 1) : sp === 1 ? (8.5 + R() * 4.5) * (far ? 1.2 : 1) : 1.6 + R() * 2.4, wid = hgt * (sp === 0 ? 1 : sp === 1 ? 0.95 + R() * 0.25 : 1.1);
          const cv = 0.86 + R() * 0.28; tk[sp].add(x, y - 0.1, z, R() * TAU, wid, hgt, [cv * (0.95 + R() * 0.1), cv, cv * (0.95 + R() * 0.1)]);
          nTrees++;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas })); if (bm) bm.castShadow = false;
    addM(crowdG, new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }));
    addM(fenceG, fMat);
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, posts: nPosts, buildings: nBld, fans: nFans };   // (read by the tests)
    return out;
  }

  function update(out, t, car) {
    if (!out) return;
    const d = out.dyn;
    if (d.crowd) { d.crowd.uTime.value = t % 1000; if (car) d.crowd.uCar.value.set(car.x, car.roadY || 0, car.z); }   // spectators: arm waving, cheering near the followed car
    if (d.water) { d.water.offset.x = (t * 0.012) % 1; d.water.offset.y = (t * 0.007) % 1; }
    if (d.pk) pkUpdate(d.pk, t, car);   // Pikes Peak: the TV helicopter, the cloud shadows
    if (d.boats) {
      const L = d.lake;
      for (const b of d.boats) {
        const a = b.a + t * b.sp;
        const x = L.cx + Math.cos(a) * L.rx * b.r, z = L.cz + Math.sin(a) * L.rz * b.r;
        b.m.position.set(x, Math.sin(t * 1.3 + b.a) * 0.05, z);
        const dx = -Math.sin(a) * L.rx, dz = Math.cos(a) * L.rz;
        b.m.rotation.y = -Math.atan2(dz, dx);
      }
    }
  }

  return { build, update, GB, box, cyl, cone, ico, gable, hex, vary };
})();

