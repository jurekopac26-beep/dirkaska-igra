/* =========================================================================
   SETTINGS ANIMATIONS — the core (maketa): a tiny 3D on a canvas 2D (a ground plane with roads, boxes for the cars, balls and cones
   for the trees, shadows from one sun), the 2D pieces the scenes share (a phone, a thumb, the game's HUD bits) and the loop that draws
   the pictures over the settings. The scenes themselves are in anim-scenes.js (SetAnim.def(key, {...})).
   World: metres, x to the east, z to the north, y up. A heading h: 0 north, + to the right (clockwise seen from above).
   ========================================================================= */
window.SetAnim = (function () {
  'use strict';
  const TAU = Math.PI * 2, D2R = Math.PI / 180;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ease = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeOut = (t) => { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
  const back = (t) => { t = clamp(t, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };   // (an overshoot: things that pop in)
  const wrapPi = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  const lerpAng = (a, b, t) => a + wrapPi(b - a) * t;
  const fract = (x) => x - Math.floor(x);
  const hash = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);   // (a fixed random number for n)
  const tri = (x) => 1 - Math.abs(fract(x) * 2 - 1);

  /* ---------------- colours ---------------- */
  const PAL = {
    navy: '#0b192b', navy2: '#08121f', ink: '#05080d', card: '#101b2d', edge: 'rgba(120,150,205,.22)',
    grass: '#4c9a3a', grass2: '#55a442', grassD: '#3f8631', dirt: '#b39a6b', gravel: '#c9b58b', rock: '#8f8a80', rockD: '#6f6a62', snow: '#eef3f6',
    asphalt: '#4a505b', asphaltD: '#40454f', asphaltL: '#5a606b', line: '#f2f2ee', kerbR: '#e63b2e', kerbW: '#f6f6f1',
    curb: '#e63b2e', chalk: '#f6f6f1', gold: '#ffc629', lime: '#8cf046', cyan: '#3fd0ff', lcd: '#ffc629', muted: '#9fb0c3', lbl: '#9fb3d6',
    player: '#d81f2a', ghost: '#cfe4ff',
    rivals: ['#e8e8ee', '#1c5fd6', '#f2c230', '#2fa84f', '#f07a1a', '#9a2bd8', '#19b7c7', '#1a1a1f'],
    leaf: ['#2f7d32', '#3a8f3b', '#2a6e35', '#4a9a3e'], pine: ['#1f5e3a', '#24683f', '#1b5233']
  };
  const rgbCache = {};
  function rgb(hex) { let c = rgbCache[hex]; if (c) return c; const n = parseInt(hex.slice(1), 16); c = rgbCache[hex] = [n >> 16 & 255, n >> 8 & 255, n & 255]; return c; }
  const shadeCache = {};
  function shade(hex, k) {   // the colour lit by k (1: as it is; less: darker, more: lighter)
    const q = Math.round(k * 40), key = hex + q; let s = shadeCache[key]; if (s) return s;
    const c = rgb(hex), f = q / 40, m = (v) => Math.round(clamp(f <= 1 ? v * f : v + (255 - v) * (f - 1), 0, 255));
    return (shadeCache[key] = 'rgb(' + m(c[0]) + ',' + m(c[1]) + ',' + m(c[2]) + ')');
  }
  function mix(a, b, t) { const A = rgb(a), B = rgb(b), m = (i) => Math.round(lerp(A[i], B[i], t)); return 'rgb(' + m(0) + ',' + m(1) + ',' + m(2) + ')'; }
  function rgba(hex, a) { const c = rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* ---------------- the sun: from the south-west, high (the game's: behind the camera, to the left) ---------------- */
  const SUN = (() => { const v = [-0.8, 0.96, -0.7], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
  const SHX = -SUN[0] / SUN[1], SHZ = -SUN[2] / SUN[1];   // (a point h up casts its shadow h * SHX east, h * SHZ north of it)
  const lit = (nx, ny, nz) => 0.52 + 0.5 * Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2]);

  /* ---------------- the view: a camera looking at the ground ---------------- */
  const NEAR = 0.6;
  function View() { this.t = [0, 0, 0]; }
  // cam: { x, y, z, yaw, pitch, fov } (fov: vertical, degrees); the viewport: the rectangle of the canvas it fills
  View.prototype.set = function (cam, vx, vy, vw, vh) {
    this.vx = vx; this.vy = vy; this.vw = vw; this.vh = vh; this.cx = vx + vw / 2; this.cy = vy + vh / 2;
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    this.Rx = cy; this.Rz = -sy;                                   // right
    this.Ux = sy * sp; this.Uy = cp; this.Uz = cy * sp;            // up
    this.Dx = sy * cp; this.Dy = -sp; this.Dz = cy * cp;           // forward (into the screen)
    this.px = cam.x; this.py = cam.y; this.pz = cam.z;
    this.f = (vh / 2) / Math.tan(cam.fov * D2R / 2);
    this.cam = cam; return this;
  };
  View.prototype.cs = function (x, y, z, o) {
    const dx = x - this.px, dy = y - this.py, dz = z - this.pz;
    o[0] = dx * this.Rx + dz * this.Rz; o[1] = dx * this.Ux + dy * this.Uy + dz * this.Uz; o[2] = dx * this.Dx + dy * this.Dy + dz * this.Dz; return o;
  };
  View.prototype.p = function (x, y, z, o) {   // the screen point (o[0], o[1]), its depth o[2]; o[3] 0 when behind the camera
    this.cs(x, y, z, o); const zc = o[2];
    if (zc < NEAR) { o[3] = 0; return o; }
    o[0] = this.cx + this.f * o[0] / zc; o[1] = this.cy - this.f * o[1] / zc; o[3] = 1; return o;
  };
  View.prototype.depth = function (x, y, z) { return (x - this.px) * this.Dx + (y - this.py) * this.Dy + (z - this.pz) * this.Dz; };
  View.prototype.horizon = function () { const c = this.cam; return this.cy - this.f * Math.tan(c.pitch); };   // (the screen y of the horizon)
  // a camera looking at (tx, ty, tz) from dist away, along yaw, pitched down by pitch
  function camAt(tx, ty, tz, dist, yaw, pitch, fov) {
    const cp = Math.cos(pitch);
    return { x: tx - Math.sin(yaw) * cp * dist, y: ty + Math.sin(pitch) * dist, z: tz - Math.cos(yaw) * cp * dist, yaw, pitch, fov };
  }
  function camMix(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), yaw: lerpAng(a.yaw, b.yaw, t), pitch: lerp(a.pitch, b.pitch, t), fov: lerp(a.fov, b.fov, t) }; }

  /* ---------------- polygons in the world (clipped at the camera's near plane) ---------------- */
  const CA = new Float64Array(96), CB = new Float64Array(96), T3 = [0, 0, 0, 0];
  // pts: [x, y, z, x, y, z, ...]; fills (or, with stroke, strokes) the polygon; false when nothing of it is on screen
  function poly(g, V, pts, fill, stroke, lw) {
    const n = pts.length / 3; let m = 0, anyIn = false;
    for (let i = 0; i < n; i++) { V.cs(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], T3); CA[m++] = T3[0]; CA[m++] = T3[1]; CA[m++] = T3[2]; if (T3[2] >= NEAR) anyIn = true; }
    if (!anyIn) return false;
    let src = CA, cnt = n;
    if (!(function all() { for (let i = 0; i < n; i++) if (CA[i * 3 + 2] < NEAR) return false; return true; })()) {   // clip (Sutherland-Hodgman, one plane)
      let k = 0;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, az = CA[i * 3 + 2], bz = CA[j * 3 + 2], ain = az >= NEAR, bin = bz >= NEAR;
        if (ain) { CB[k++] = CA[i * 3]; CB[k++] = CA[i * 3 + 1]; CB[k++] = az; }
        if (ain !== bin) { const t = (NEAR - az) / (bz - az); CB[k++] = lerp(CA[i * 3], CA[j * 3], t); CB[k++] = lerp(CA[i * 3 + 1], CA[j * 3 + 1], t); CB[k++] = NEAR; }
      }
      src = CB; cnt = k / 3; if (cnt < 3) return false;
    }
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    g.beginPath();
    for (let i = 0; i < cnt; i++) {
      const z = src[i * 3 + 2], x = V.cx + V.f * src[i * 3] / z, y = V.cy - V.f * src[i * 3 + 1] / z;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    if (maxX < V.vx - 2 || minX > V.vx + V.vw + 2 || maxY < V.vy - 2 || minY > V.vy + V.vh + 2) return false;
    g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.stroke(); }
    return true;
  }
  const P4 = new Array(12), P8 = new Array(24);
  function quad(g, V, ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, fill) {
    P4[0] = ax; P4[1] = ay; P4[2] = az; P4[3] = bx; P4[4] = by; P4[5] = bz; P4[6] = cx; P4[7] = cy; P4[8] = cz; P4[9] = dx; P4[10] = dy; P4[11] = dz;
    return poly(g, V, P4, fill);
  }
  // a disc on the ground (or at height y): a circle of radius r as a polygon
  const DISC = []; for (let i = 0; i < 14; i++) DISC.push([Math.cos(i / 14 * TAU), Math.sin(i / 14 * TAU)]);
  function disc(g, V, x, y, z, r, fill, rz) {
    const a = []; rz = rz || r; for (const d of DISC) a.push(x + d[0] * r, y, z + d[1] * rz); return poly(g, V, a, fill);
  }

  /* ---------------- prisms: a car's body, a stand, a house (a bottom and a top outline, counter-clockwise from above) ---------------- */
  const PV = new Array(64);
  // B, T: [[x, y, z], ...] of the same length; col: the base colour (or {top, side, sides: [per face]}); alpha: see-through (the ghost)
  function prism(g, V, B, T, col, o) {
    const n = B.length, cam = V.cam, top = typeof col === 'string' ? col : col.top, side = typeof col === 'string' ? col : col.side;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, a = B[i], b = B[j], c = T[j], d = T[i];
      // the face's normal (outward for a counter-clockwise outline seen from above: (b - a) x up, tilted by the top's inset)
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const mx = (a[0] + b[0] + c[0] + d[0]) / 4, my = (a[1] + b[1] + c[1] + d[1]) / 4, mz = (a[2] + b[2] + c[2] + d[2]) / 4;
      if (nx * (cam.x - mx) + ny * (cam.y - my) + nz * (cam.z - mz) <= 0) continue;
      const base = col.sides && col.sides[i] ? col.sides[i] : side;
      quad(g, V, a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2], shade(base, lit(nx, ny, nz) * (o && o.k || 1)));
      if (o && o.face) o.face(i, a, b, c, d, nx, ny, nz);
    }
    if (cam.y > T[0][1]) {   // the top (seen from above)
      let k = 0; for (let i = 0; i < n; i++) { PV[k++] = T[i][0]; PV[k++] = T[i][1]; PV[k++] = T[i][2]; }
      PV.length = k; poly(g, V, PV, shade(top, lit(0, 1, 0) * (o && o.k || 1)));
    }
  }
  // an outline round (x, z) turned to h: points [[along, across], ...] (along: forward, across: to the right), at height y
  function outline(x, z, h, pts, y) {
    const c = Math.cos(h), s = Math.sin(h), out = [];
    for (const p of pts) out.push([x + s * p[0] + c * p[1], y, z + c * p[0] - s * p[1]]);
    return out;
  }
  const rect = (a0, a1, b) => [[a0, -b], [a0, b], [a1, b], [a1, -b]].reverse();   // (counter-clockwise from above: back-left, ... in this frame)
  // (the rectangle from along a0 (back) to a1 (front), across -b..b, counter-clockwise seen from above)
  function box(along0, along1, half) { return [[along0, -half], [along0, half], [along1, half], [along1, -half]]; }

  /* ---------------- a road: its centre line, sampled ---------------- */
  // from (x, z) heading h: straights ['s', length] and arcs ['a', radius, degrees (+ right)]
  function Path(x, z, h, segs, step) {
    step = step || 1.5;
    const X = [x], Z = [z], H = [h], K = [0], S = [0];
    let s = 0;
    const push = (k) => { X.push(x); Z.push(z); H.push(h); K.push(k); S.push(s); };
    for (const sg of segs) {
      if (sg[0] === 's') { const n = Math.max(1, Math.ceil(sg[1] / step)), d = sg[1] / n; for (let i = 0; i < n; i++) { x += Math.sin(h) * d; z += Math.cos(h) * d; s += d; push(0); } }
      else { const R = sg[1], A = sg[2] * D2R, L = Math.abs(A) * R, n = Math.max(2, Math.ceil(L / step)), da = A / n, d = L / n;
        for (let i = 0; i < n; i++) { h += da / 2; x += Math.sin(h) * d; z += Math.cos(h) * d; h += da / 2; s += d; push(Math.sign(A) / R); } }
    }
    this.x = X; this.z = Z; this.h = H; this.k = K; this.s = S; this.len = s; this.n = X.length;
    this.closed = Math.hypot(X[0] - x, Z[0] - z) < step * 1.5;
  }
  // the point s along (looped when the path is closed): {x, z, h, k}, d metres to the right of the centre line
  Path.prototype.at = function (s, d, o) {
    o = o || {}; const L = this.len, S = this.s;
    if (this.closed) { s %= L; if (s < 0) s += L; } else s = clamp(s, 0, L);
    let lo = 0, hi = this.n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    const t = S[hi] > S[lo] ? (s - S[lo]) / (S[hi] - S[lo]) : 0;
    const h = lerpAng(this.h[lo], this.h[hi], t); d = d || 0;
    o.x = lerp(this.x[lo], this.x[hi], t) + Math.cos(h) * d; o.z = lerp(this.z[lo], this.z[hi], t) - Math.sin(h) * d; o.h = h; o.k = this.k[hi]; o.s = s; return o;
  };
  // the road drawn on the ground: asphalt, kerbs on the bends, white edge lines; o: { w (width), kerbs, lines, col }
  function drawRoad(g, V, P, o) {
    const w = o.w || 10, hw = w / 2, n = P.n, col = o.col || PAL.asphalt;
    const X = P.x, Z = P.z, H = P.h, K = P.k;
    const ex = (i, d) => X[i] + Math.cos(H[i]) * d, ez = (i, d) => Z[i] - Math.sin(H[i]) * d;
    const strip = (d0, d1, fill, i0, i1) => {   // a band from d0 to d1 across, samples i0..i1, as one polygon
      const a = []; for (let i = i0; i <= i1; i++) a.push(ex(i, d0), 0, ez(i, d0));
      for (let i = i1; i >= i0; i--) a.push(ex(i, d1), 0, ez(i, d1));
      poly(g, V, a, fill);
    };
    const CH = 10, last = P.closed ? n - 1 : n - 1;
    if (o.shoulder) for (let i = 0; i < last; i += CH) strip(-hw - o.shoulder, hw + o.shoulder, o.shoulderCol || PAL.dirt, i, Math.min(last, i + CH));
    for (let i = 0; i < last; i += CH) strip(-hw, hw, col, i, Math.min(last, i + CH));
    if (o.kerbs !== false) for (let i = 0; i < last; i++) {   // kerbs: red and white blocks on the outside of a bend (and a narrow one inside)
      const k = K[i + 1]; if (Math.abs(k) < 1 / 70) continue;
      const out = k > 0 ? -1 : 1, c = (i & 1) ? PAL.kerbR : PAL.kerbW;
      quad(g, V, ex(i, out * hw), 0, ez(i, out * hw), ex(i + 1, out * hw), 0, ez(i + 1, out * hw), ex(i + 1, out * (hw + 1.1)), 0, ez(i + 1, out * (hw + 1.1)), ex(i, out * (hw + 1.1)), 0, ez(i, out * (hw + 1.1)), c);
      quad(g, V, ex(i, -out * hw), 0, ez(i, -out * hw), ex(i + 1, -out * hw), 0, ez(i + 1, -out * hw), ex(i + 1, -out * (hw + 0.7)), 0, ez(i + 1, -out * (hw + 0.7)), ex(i, -out * (hw + 0.7)), 0, ez(i, -out * (hw + 0.7)), c);
    }
    if (o.lines !== false) for (let i = 0; i < last; i += CH) { const j = Math.min(last, i + CH); strip(-hw + 0.25, -hw + 0.55, PAL.line, i, j); strip(hw - 0.55, hw - 0.25, PAL.line, i, j); }
    if (o.centre) for (let i = 0; i < last; i += 4) strip(-0.12, 0.12, o.centre, i, Math.min(last, i + 2));
  }
  // a band along the road from s0 to s1 (d0..d1 across): the racing line, a start line, tyre marks
  function band(g, V, P, s0, s1, d0, d1, fill, step) {
    step = step || 1.2; const a = [], q = {};
    for (let s = s0; s <= s1 + 1e-6; s += step) { P.at(Math.min(s, s1), d0, q); a.push(q.x, 0.02, q.z); }
    for (let s = s1; s >= s0 - 1e-6; s -= step) { P.at(Math.max(s, s0), d1, q); a.push(q.x, 0.02, q.z); }
    if (a.length >= 9) poly(g, V, a, fill);
  }

  /* ---------------- the ground: grass with mown stripes and tufts that show the motion ---------------- */
  function ground(g, V, o) {
    o = o || {};
    g.fillStyle = o.col || PAL.grass; g.fillRect(V.vx, V.vy, V.vw, V.vh);
    // the visible patch of ground (the screen's corners cast down to y = 0, near the camera if they miss the ground)
    const cam = V.cam; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const [sx, sy] of [[V.vx, V.vy], [V.vx + V.vw, V.vy], [V.vx, V.vy + V.vh], [V.vx + V.vw, V.vy + V.vh]]) {
      const rx = (sx - V.cx) / V.f, ry = -(sy - V.cy) / V.f;   // the ray in camera space (z = 1)
      let dx = rx * V.Rx + ry * V.Ux + V.Dx, dy = ry * V.Uy + V.Dy, dz = rx * V.Rz + ry * V.Uz + V.Dz;
      let t = dy < -0.02 ? -cam.y / dy : 240; t = Math.min(t, 240);
      const gx = cam.x + dx * t, gz = cam.z + dz * t; x0 = Math.min(x0, gx); x1 = Math.max(x1, gx); z0 = Math.min(z0, gz); z1 = Math.max(z1, gz);
    }
    x0 = Math.max(x0, cam.x - 240); x1 = Math.min(x1, cam.x + 240); z0 = Math.max(z0, cam.z - 240); z1 = Math.min(z1, cam.z + 240);
    if (o.stripes !== false) {   // mown stripes, 8 m wide, north-south
      const W = 8, c2 = o.col2 || PAL.grass2;
      for (let x = Math.floor(x0 / (2 * W)) * 2 * W; x < x1; x += 2 * W) quad(g, V, x, 0, z0, x + W, 0, z0, x + W, 0, z1, x, 0, z1, c2);
    }
    if (o.tufts !== false) {   // tufts on a 4 m grid, jittered
      const G = o.tuftGrid || 4.5, tc = o.tuftCol || PAL.grassD;
      g.fillStyle = tc;
      for (let x = Math.floor(x0 / G) * G; x < x1; x += G) for (let z = Math.floor(z0 / G) * G; z < z1; z += G) {
        const r = hash(x * 0.37 + z * 1.91); if (r > (o.tuftP || 0.55)) continue;
        const px = x + hash(x + z * 3.1) * G, pz = z + hash(z - x * 2.3) * G;
        V.p(px, 0, pz, T3); if (!T3[3]) continue;
        const s = V.f * 0.35 / T3[2]; if (s < 0.4) continue;
        g.fillRect(T3[0] - s, T3[1] - s * 0.5, s * 2, s);
      }
    }
  }
  // the sky over the horizon (a chase camera looking far): a gradient and far hills
  function sky(g, V, o) {
    const hy = V.horizon(); if (hy <= V.vy) return;
    const top = V.vy, gr = g.createLinearGradient(0, top, 0, hy);
    gr.addColorStop(0, (o && o.top) || '#5f9fe0'); gr.addColorStop(1, (o && o.bot) || '#cfe6f7');
    g.fillStyle = gr; g.fillRect(V.vx, top, V.vw, hy - top + 1);
    // far hills: a ridge just over the horizon, moving with the camera's heading
    const yaw = V.cam.yaw;
    g.fillStyle = (o && o.hill) || '#7aa6a0'; g.beginPath(); g.moveTo(V.vx, hy + 1);
    for (let x = 0; x <= V.vw; x += 6) { const a = yaw * 3 + (x - V.vw / 2) / V.f; g.lineTo(V.vx + x, hy - (6 + 7 * Math.sin(a * 5) + 4 * Math.sin(a * 13 + 1)) * V.vh / 300); }
    g.lineTo(V.vx + V.vw, hy + 1); g.fill();
  }

  /* ---------------- the cars ---------------- */
  // a car: { x, z, h, col, stripe, steer, dent (0..1: the front left crushed), ghost (0..1 see-through), lights, marker, scale, roll }
  const CAR = { len: 4.4, wid: 1.9 };
  const T_BODY_B = [[-2.2, -0.95], [-2.2, 0.95], [2.1, 0.95], [2.25, 0.6], [2.25, -0.6], [2.1, -0.95]];
  const T_BODY_T = [[-2.05, -0.86], [-2.05, 0.86], [1.85, 0.86], [2.05, 0.52], [2.05, -0.52], [1.85, -0.86]];
  const ccw = (pts) => pts.slice().reverse();   // (the outlines above run clockwise seen from above in this frame: reversed for prism())
  const BODY_B = ccw(T_BODY_B), BODY_T = ccw(T_BODY_T);
  const CAB_B = ccw([[-1.15, -0.8], [-1.15, 0.8], [0.75, 0.8], [0.75, -0.8]]), CAB_T = ccw([[-0.95, -0.66], [-0.95, 0.66], [0.25, 0.66], [0.25, -0.66]]);
  const WHEELS = [[1.35, -0.86, 1], [1.35, 0.86, 1], [-1.35, -0.86, 0], [-1.35, 0.86, 0]];
  function carParts(c) {   // the parts of a car in the world, each { d (its depth key point), draw }
    const sc = c.scale || 1, h = c.h, ch = Math.cos(h), sh = Math.sin(h);
    const W = (a, b, y) => [c.x + (sh * a + ch * b) * sc, y * sc + (c.y || 0), c.z + (ch * a - sh * b) * sc];
    const parts = [];
    const dent = c.dent || 0;
    const bodyB = BODY_B.map(p => W(p[0], p[1], 0.28)), bodyT = BODY_T.map((p, i) => {
      let a = p[0], b = p[1], y = 0.86;
      if (dent > 0 && a > 1.4 && b < 0) { a -= dent * 0.55; y -= dent * 0.22; }   // (the front left corner pushed in)
      return W(a, b, y);
    });
    if (dent > 0) for (const i of [0, 5]) { const p = BODY_B[i]; if (p[0] > 1.4 && p[1] < 0) bodyB[i] = W(p[0] - dent * 0.45, p[1] + dent * 0.12, 0.28); }
    const ghost = c.ghost || 0;
    parts.push({ y: 0.55, a: 0, b: 0, body: true, draw: (g, V) => prism(g, V, bodyB, bodyT, { top: c.col, side: c.col }, {
      face: c.lights ? (i, A, B, C, D) => { /* lamps drawn with the cabin */ } : null }) });
    parts.push({ y: 1.05, a: -0.2, b: 0, draw: (g, V) => {
      prism(g, V, CAB_B.map(p => W(p[0], p[1], 0.86)), CAB_T.map(p => W(p[0], p[1], 1.32)), { top: c.roof || c.col, side: '#1f2a37' });
      if (c.stripe !== false) {   // the stripe over the bonnet, the roof and the boot
        const s = c.stripeCol || '#f6f6f1';
        const q = (a0, a1, y) => { const A = W(a0, -0.2, y), B = W(a0, 0.2, y), C = W(a1, 0.2, y), D = W(a1, -0.2, y); quad(g, V, A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2], D[0], D[1], D[2], s); };
        q(0.3, 1.8 - dent * 0.4, 0.875); q(-0.9, 0.2, 1.335); q(-2.0, -1.2, 0.875);
      }
      if (c.wing !== false) { const A = W(-2.25, -0.95, 1.12), B = W(-2.25, 0.95, 1.12), C = W(-1.9, 0.95, 1.12), D = W(-1.9, -0.95, 1.12); quad(g, V, A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2], D[0], D[1], D[2], shade('#1a1f27', 1)); }
      if (c.num) { const p = W(0.95, 0, 0.88); V.p(p[0], p[1], p[2], T3); if (T3[3]) { const r = V.f * 0.33 * sc / T3[2]; g.fillStyle = '#fff'; g.beginPath(); g.arc(T3[0], T3[1], r, 0, TAU); g.fill(); } }
      if (c.brakeLights || c.lightsOn) { for (const b of [-0.62, 0.62]) { const p = W(-2.22, b, 0.66); V.p(p[0], p[1], p[2], T3); if (T3[3]) { const r = V.f * 0.2 * sc / T3[2]; g.fillStyle = c.brakeLights ? '#ff3b2e' : '#b02018'; g.beginPath(); g.arc(T3[0], T3[1], r, 0, TAU); g.fill(); if (c.brakeLights) { g.fillStyle = 'rgba(255,60,40,.35)'; g.beginPath(); g.arc(T3[0], T3[1], r * 2.6, 0, TAU); g.fill(); } } } }
      if (c.police) {   // the light bar on the roof: red and blue in turn
        const ph = Math.floor((c.t || 0) * 8) & 1;
        for (const [b, colA, colB] of [[-0.35, '#ff2a2a', '#2a6cff'], [0.35, '#2a6cff', '#ff2a2a']]) { const p = W(-0.35, b, 1.45); V.p(p[0], p[1], p[2], T3); if (T3[3]) { const r = V.f * 0.24 * sc / T3[2]; const cc = ph ? colA : colB; g.fillStyle = cc; g.beginPath(); g.arc(T3[0], T3[1], r, 0, TAU); g.fill(); g.fillStyle = rgba(cc === '#ff2a2a' ? '#ff2a2a' : '#2a6cff', 0.28); g.beginPath(); g.arc(T3[0], T3[1], r * 3.2, 0, TAU); g.fill(); } }
      }
    } });
    for (const [a, b, front] of WHEELS) {
      const st = front ? (c.steer || 0) : 0, flat = c.flat && c.flat[(a > 0 ? 0 : 2) + (b > 0 ? 1 : 0)];
      const cs = Math.cos(h + st), ss = Math.sin(h + st), ctr = W(a, b, 0);
      const Wl = (u, v, y) => [ctr[0] + (ss * u + cs * v) * sc, y * sc + (c.y || 0), ctr[2] + (cs * u - ss * v) * sc];
      const r = flat ? 0.22 : 0.33, half = 0.36;
      parts.push({ y: 0.3, a, b: b * 1.05, draw: (g, V) => {
        prism(g, V, ccw([[-half, -0.17], [-half, 0.17], [half, 0.17], [half, -0.17]]).map(p => Wl(p[0], p[1], 0)), ccw([[-half, -0.17], [-half, 0.17], [half, 0.17], [half, -0.17]]).map(p => Wl(p[0], p[1], r * 2)), { top: '#22262c', side: '#14171c' });
        if (c.glow && c.glow > 0) { const p = Wl(0, 0, 0.35); V.p(p[0], p[1], p[2], T3); if (T3[3]) { const rr = V.f * 0.42 * sc / T3[2], gg = g.createRadialGradient(T3[0], T3[1], 0, T3[0], T3[1], rr * 2.4); gg.addColorStop(0, 'rgba(255,170,60,' + (0.95 * c.glow) + ')'); gg.addColorStop(0.35, 'rgba(255,80,20,' + (0.6 * c.glow) + ')'); gg.addColorStop(1, 'rgba(255,40,0,0)'); g.fillStyle = gg; g.beginPath(); g.arc(T3[0], T3[1], rr * 2.4, 0, TAU); g.fill(); } }
      } });
    }
    return { parts, W };
  }
  function carShadow(g, V, c, alpha) {
    const sc = c.scale || 1, hgt = 1.25 * sc, pts = [];
    const h = c.h, ch = Math.cos(h), sh = Math.sin(h);
    for (const [a, b] of [[-2.25, -1.0], [-2.25, 1.0], [2.3, 1.0], [2.3, -1.0]]) {
      const x = c.x + (sh * a + ch * b) * sc, z = c.z + (ch * a - sh * b) * sc;
      pts.push([x, z], [x + SHX * hgt, z + SHZ * hgt]);
    }
    const hull = convexHull(pts), a = [];
    for (const p of hull) a.push(p[0], 0.01, p[1]);
    poly(g, V, a, 'rgba(0,0,0,' + (alpha == null ? 0.3 : alpha) + ')');
  }
  function convexHull(P) {
    P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of P) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop(); return lo.concat(up);
  }
  // the player's marker: the game's yellow triangle over the car
  function marker(g, V, c, t) {
    const sc = c.scale || 1; V.p(c.x, (4.2 + 0.25 * Math.sin((t || 0) * 5)) * sc, c.z, T3); if (!T3[3]) return;
    const s = V.f * 0.85 * sc / T3[2];
    g.fillStyle = '#ffc629'; g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = Math.max(1, s * 0.12);
    g.beginPath(); g.moveTo(T3[0] - s, T3[1] - s * 0.55); g.lineTo(T3[0] + s, T3[1] - s * 0.55); g.lineTo(T3[0], T3[1] + s * 0.75); g.closePath(); g.fill(); g.stroke();
  }

  /* ---------------- trees, rocks, stands, people, cones ---------------- */
  // a thing: { kind: 'tree' | 'pine' | 'rock' | 'stand' | 'cone' | 'tyres' | 'person' | 'flag' | 'house', x, z, s (size), c (colour), grow (0..1) }
  function thingShadow(g, V, o) {
    const s = (o.s || 1) * (o.grow == null ? 1 : o.grow); if (s <= 0.01) return;
    if (o.kind === 'tree') disc(g, V, o.x + SHX * 3.2 * s, 0.01, o.z + SHZ * 3.2 * s, 1.9 * s, 'rgba(0,0,0,.24)');
    else if (o.kind === 'pine') disc(g, V, o.x + SHX * 2.6 * s, 0.01, o.z + SHZ * 2.6 * s, 1.3 * s, 'rgba(0,0,0,.24)');
    else if (o.kind === 'house' || o.kind === 'stand') { /* their walls cast it: a box's shadow */
      const w = o.w || 8, d = o.d || 4, hgt = (o.hgt || 4) * s, pts = [];
      for (const [a, b] of [[-d / 2, -w / 2], [-d / 2, w / 2], [d / 2, w / 2], [d / 2, -w / 2]]) { const x = o.x + (Math.sin(o.h || 0) * a + Math.cos(o.h || 0) * b), z = o.z + (Math.cos(o.h || 0) * a - Math.sin(o.h || 0) * b); pts.push([x, z], [x + SHX * hgt, z + SHZ * hgt]); }
      const hl = convexHull(pts), a = []; for (const p of hl) a.push(p[0], 0.01, p[1]); poly(g, V, a, 'rgba(0,0,0,.24)');
    }
    else if (o.kind === 'rock') disc(g, V, o.x + SHX * 0.6 * s, 0.01, o.z + SHZ * 0.6 * s, 1.0 * s, 'rgba(0,0,0,.2)');
    else if (o.kind === 'person') disc(g, V, o.x + SHX * 0.9 * s, 0.01, o.z + SHZ * 0.9 * s, 0.35 * s, 'rgba(0,0,0,.2)');
  }
  const KINDS = {};   // (more kinds of things, from the scenes: KINDS[kind](g, V, o, t))
  function thing(g, V, o, t) {
    if (KINDS[o.kind]) return KINDS[o.kind](g, V, o, t);
    const s = (o.s || 1) * (o.grow == null ? 1 : o.grow); if (s <= 0.01) return;
    if (o.kind === 'tree' || o.kind === 'pine') {
      V.p(o.x, 0, o.z, T3); if (!T3[3]) return; const bx = T3[0], by = T3[1];
      if (o.kind === 'tree') {
        V.p(o.x, 3.2 * s, o.z, T3); if (!T3[3]) return;
        const r = V.f * 1.85 * s / T3[2], cx = T3[0], cy = T3[1];
        g.strokeStyle = '#5b3f26'; g.lineWidth = Math.max(1, V.f * 0.3 * s / T3[2]); g.beginPath(); g.moveTo(bx, by); g.lineTo(cx, cy); g.stroke();
        const col = o.c || PAL.leaf[0];
        g.fillStyle = shade(col, 0.82); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
        g.fillStyle = shade(col, 1.12); g.beginPath(); g.arc(cx - r * 0.22, cy - r * 0.24, r * 0.68, 0, TAU); g.fill();
        g.fillStyle = shade(col, 1.32); g.beginPath(); g.arc(cx - r * 0.36, cy - r * 0.4, r * 0.3, 0, TAU); g.fill();
      } else {
        V.p(o.x, 5.2 * s, o.z, T3); if (!T3[3]) return; const tx = T3[0], ty = T3[1];
        const r = V.f * 1.35 * s / Math.max(1, T3[2]), col = o.c || PAL.pine[0];
        g.fillStyle = shade(col, 0.8); g.beginPath(); g.moveTo(tx, ty); g.lineTo(bx + r, by - r * 0.25); g.lineTo(bx - r, by - r * 0.25); g.closePath(); g.fill();
        g.fillStyle = shade(col, 1.12); g.beginPath(); g.moveTo(tx, ty); g.lineTo(bx, by - r * 0.1); g.lineTo(bx - r, by - r * 0.25); g.closePath(); g.fill();
      }
    } else if (o.kind === 'rock') {
      const r = 0.9 * s, B = [], T = [];
      for (let i = 0; i < 6; i++) { const a = -i / 6 * TAU + (o.h || 0), rr = r * (0.75 + 0.35 * hash(o.x * 3 + i)); B.push([o.x + Math.cos(a) * rr, 0, o.z + Math.sin(a) * rr]); T.push([o.x + Math.cos(a) * rr * 0.55, r * 1.1, o.z + Math.sin(a) * rr * 0.55]); }
      prism(g, V, B, T, o.c || PAL.rock);
    } else if (o.kind === 'cone') {
      V.p(o.x, 0, o.z, T3); if (!T3[3]) return; const bx = T3[0], by = T3[1]; V.p(o.x, 0.75 * s, o.z, T3); const r = V.f * 0.3 * s / T3[2];
      g.fillStyle = '#ff7a1a'; g.beginPath(); g.moveTo(T3[0], T3[1]); g.lineTo(bx + r, by); g.lineTo(bx - r, by); g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.fillRect(bx - r * 0.5, lerp(by, T3[1], 0.45), r, Math.max(1, (by - T3[1]) * 0.16));
    } else if (o.kind === 'tyres') {
      for (let k = 0; k < 3; k++) { V.p(o.x + k * 0.9 * (o.dx || 1), 0.25 * s, o.z + k * 0.9 * (o.dz || 0), T3); if (!T3[3]) continue; const r = V.f * 0.45 * s / T3[2];
        g.fillStyle = '#1c1f24'; g.beginPath(); g.ellipse(T3[0], T3[1] - r * 0.4, r, r * 0.75, 0, 0, TAU); g.fill(); g.fillStyle = k & 1 ? '#e63b2e' : '#f6f6f1'; g.beginPath(); g.ellipse(T3[0], T3[1] - r * 0.55, r * 0.55, r * 0.38, 0, 0, TAU); g.fill(); }
    } else if (o.kind === 'person') {
      V.p(o.x, 0, o.z, T3); if (!T3[3]) return; const bx = T3[0], by = T3[1]; V.p(o.x, 1.7 * s, o.z, T3); if (!T3[3]) return; const r = V.f * 0.28 * s / T3[2];
      const bob = o.wave ? Math.sin((t || 0) * 9 + o.x) * r * 0.5 : 0;
      g.fillStyle = o.c || '#e8e8ee'; g.fillRect(bx - r * 0.75, T3[1] + r * 0.9, r * 1.5, by - T3[1] - r * 0.9);
      g.fillStyle = '#f1c9a5'; g.beginPath(); g.arc(T3[0], T3[1] + r * 0.4 + bob * 0.2, r * 0.62, 0, TAU); g.fill();
      if (o.wave) { g.strokeStyle = o.c || '#e8e8ee'; g.lineWidth = Math.max(1, r * 0.45); g.beginPath(); g.moveTo(T3[0] + r * 0.6, T3[1] + r * 1.2); g.lineTo(T3[0] + r * 1.1, T3[1] - r * 0.2 + bob); g.stroke(); }
    } else if (o.kind === 'flag') {
      V.p(o.x, 0, o.z, T3); if (!T3[3]) return; const bx = T3[0], by = T3[1]; V.p(o.x, 4 * s, o.z, T3); if (!T3[3]) return;
      g.strokeStyle = '#d9dde3'; g.lineWidth = Math.max(1, V.f * 0.08 / T3[2]); g.beginPath(); g.moveTo(bx, by); g.lineTo(T3[0], T3[1]); g.stroke();
      const fw = V.f * 1.4 * s / T3[2], fh = fw * 0.6, wv = Math.sin((t || 0) * 6 + o.x) * fh * 0.2;
      g.fillStyle = o.c || '#e63b2e'; g.beginPath(); g.moveTo(T3[0], T3[1]); g.quadraticCurveTo(T3[0] + fw * 0.5, T3[1] + wv, T3[0] + fw, T3[1] + wv * 0.5); g.lineTo(T3[0] + fw, T3[1] + fh + wv * 0.5); g.quadraticCurveTo(T3[0] + fw * 0.5, T3[1] + fh + wv, T3[0], T3[1] + fh); g.closePath(); g.fill();
    } else if (o.kind === 'house' || o.kind === 'stand') {
      const w = o.w || 8, d = o.d || 4, hgt = (o.hgt || 4) * s, h = o.h || 0;
      const B = outline(o.x, o.z, h, ccw(box(-d / 2, d / 2, w / 2)), 0), T = outline(o.x, o.z, h, ccw(box(-d / 2, d / 2, w / 2)), hgt);
      if (o.kind === 'house') prism(g, V, B, T, { top: o.roof || '#b5543c', side: o.c || '#e9e2d0' });
      else {   // a stand: a box with rows of people on its sloped top (drawn as rows of dots)
        const Tb = outline(o.x, o.z, h, ccw(box(-d / 2, d / 2 - d * 0.75, w / 2)), hgt);
        prism(g, V, B, T, { top: '#8b96a6', side: '#6c7686' });
        const n = o.crowd || 0;
        if (n > 0) for (let r = 0; r < 3; r++) for (let i = 0; i < 14; i++) {
          if (hash(i * 7 + r * 31 + o.x) > n) continue;
          const a = -d / 2 + 0.6 + r * (d - 1.2) / 2.2, b = -w / 2 + 0.5 + i * (w - 1) / 13;
          const P = outline(o.x, o.z, h, [[a, b]], hgt + 0.35)[0]; V.p(P[0], P[1] + (o.wave ? Math.max(0, Math.sin((t || 0) * 7 + i * 0.9 + r)) * 0.35 : 0), P[2], T3); if (!T3[3]) continue;
          const rr = V.f * 0.3 / T3[2]; g.fillStyle = PAL.rivals[(i * 3 + r) % PAL.rivals.length]; g.fillRect(T3[0] - rr, T3[1] - rr, rr * 2, rr * 2);
          g.fillStyle = '#f1c9a5'; g.fillRect(T3[0] - rr * 0.6, T3[1] - rr * 2.1, rr * 1.2, rr * 1.1);
        }
        void Tb;
      }
    }
  }

  /* ---------------- particles: smoke, sparks, bits, the air of a tyre ---------------- */
  function Particles() { this.a = []; }
  Particles.prototype.add = function (p) { this.a.push(p); if (this.a.length > 220) this.a.shift(); };
  Particles.prototype.step = function (dt) { const a = this.a; for (let i = a.length - 1; i >= 0; i--) { const p = a[i]; p.age += dt; if (p.age >= p.life) { a.splice(i, 1); continue; } p.x += (p.vx || 0) * dt; p.z += (p.vz || 0) * dt; p.y = (p.y || 0) + (p.vy || 0) * dt; if (p.g) p.vy -= p.g * dt; if (p.y < 0 && p.g) { p.y = 0; p.vy *= -0.3; } } };
  Particles.prototype.draw = function (g, V) {
    for (const p of this.a) {
      V.p(p.x, p.y || 0, p.z, T3); if (!T3[3]) continue;
      const k = p.age / p.life;
      if (p.kind === 'smoke') { const r = V.f * lerp(p.r0 || 0.6, p.r1 || 2.4, k) / T3[2]; g.fillStyle = 'rgba(' + (p.c || '232,232,232') + ',' + (0.42 * (1 - k)) + ')'; g.beginPath(); g.arc(T3[0], T3[1], r, 0, TAU); g.fill(); }
      else if (p.kind === 'spark') { const r = Math.max(1, V.f * 0.12 / T3[2]); g.fillStyle = k < 0.5 ? '#fff6c0' : '#ffb13b'; g.fillRect(T3[0] - r, T3[1] - r, r * 2, r * 2); }
      else if (p.kind === 'bit') { const r = V.f * 0.35 / T3[2]; g.save(); g.translate(T3[0], T3[1]); g.rotate(p.age * 9); g.fillStyle = p.c || '#d81f2a'; g.fillRect(-r, -r * 0.5, r * 2, r); g.restore(); }
      else if (p.kind === 'air') { const r = V.f * lerp(0.2, 1.4, k) / T3[2]; g.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - k)) + ')'; g.lineWidth = Math.max(1, r * 0.2); g.beginPath(); g.arc(T3[0], T3[1], r, 0, TAU); g.stroke(); }
    }
  };
  // tyre marks: two lines behind the rear wheels, kept as they were laid
  function Marks() { this.a = []; }
  Marks.prototype.add = function (c, alpha) {
    const h = c.h, ch = Math.cos(h), sh = Math.sin(h);
    const L = [c.x + sh * -1.35 + ch * -0.86, c.z + ch * -1.35 - sh * -0.86], R = [c.x + sh * -1.35 + ch * 0.86, c.z + ch * -1.35 - sh * 0.86];
    const last = this.a[this.a.length - 1];
    if (last && Math.hypot(last.L[0] - L[0], last.L[1] - L[1]) < 0.5) return;
    this.a.push({ L, R, a: alpha, gap: !last || last.end }); if (this.a.length > 400) this.a.shift();
  };
  Marks.prototype.cut = function () { const l = this.a[this.a.length - 1]; if (l) l.end = true; };
  Marks.prototype.draw = function (g, V, fade) {
    const a = this.a; fade = fade == null ? 1 : fade;
    for (let i = 1; i < a.length; i++) {
      const p = a[i - 1], q = a[i]; if (p.end) continue;
      const al = Math.min(p.a, q.a) * 0.6 * fade; if (al < 0.02) continue;
      const w = 0.22;
      for (const k of ['L', 'R']) quad(g, V, p[k][0] - w, 0.015, p[k][1], p[k][0] + w, 0.015, p[k][1], q[k][0] + w, 0.015, q[k][1], q[k][0] - w, 0.015, q[k][1], 'rgba(22,24,28,' + al.toFixed(3) + ')');
    }
  };

  /* ---------------- a scene in 3D: the ground, the road, shadows, then everything sorted far to near ---------------- */
  // o: { ground: {...}, roads: [{P, w, ...}], under (g, V) (drawn on the road: lines, marks), things: [...], cars: [...], over (g, V) (on top), t, shadows (0..1) }
  function scene(g, V, o) {
    if (o.sky) sky(g, V, o.sky);
    if (o.groundFn) o.groundFn(g, V); else ground(g, V, o.ground);
    if (o.sky) sky(g, V, o.sky);
    for (const r of o.roads || []) drawRoad(g, V, r.P, r);
    if (o.under) o.under(g, V);
    const shA = o.shadows == null ? 1 : o.shadows;
    if (shA > 0.01) {
      g.save(); g.globalAlpha = shA;
      if (o.softShadow) g.filter = 'blur(' + Math.max(1, V.vh / 110).toFixed(1) + 'px)';   // (a softer edge: Visoko)
      for (const th of o.things || []) thingShadow(g, V, th);
      for (const c of o.cars || []) if (!c.ghost && !c.noShadow) carShadow(g, V, c, 0.3);
      g.restore();
    }
    // everything standing: sorted by depth, the far first
    const items = [];
    for (const th of o.things || []) items.push({ d: V.depth(th.x, 1.5, th.z), th });
    for (const c of o.cars || []) {
      const { parts } = carParts(c);
      for (const p of parts) { const sc = c.scale || 1, ch = Math.cos(c.h), sh = Math.sin(c.h);
        items.push({ d: V.depth(c.x + (sh * p.a + ch * p.b) * sc, p.y * sc, c.z + (ch * p.a - sh * p.b) * sc) + (p.body ? 0.4 : 0), part: p, car: c }); }
    }
    items.sort((a, b) => b.d - a.d);
    for (const it of items) {
      if (it.th) thing(g, V, it.th, o.t);
      else if (it.car.ghost) { g.save(); g.globalAlpha = 1 - it.car.ghost * 0.62; it.part.draw(g, V); g.restore(); }
      else it.part.draw(g, V);
    }
    for (const c of o.cars || []) if (c.marker) marker(g, V, c, o.t);
    if (o.over) o.over(g, V);
  }

  /* ---------------- 2D pieces ---------------- */
  function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function studio(g, W, H, o) {   // the backdrop of a drawn (not 3D) picture: the night-navy garage with a soft light
    const gr = g.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.75);
    gr.addColorStop(0, (o && o.hi) || '#1d3654'); gr.addColorStop(1, (o && o.lo) || '#0a1525');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (!o || o.floor !== false) { g.fillStyle = 'rgba(255,255,255,.035)'; for (let i = 0; i < 9; i++) { const y = H * (0.66 + i * i * 0.012); if (y < H) g.fillRect(0, y, W, 1); } }
  }
  // a phone: centre (cx, cy), the body w x h (w > h: lying), turned by rot; screen(g, sw, sh) draws its picture (origin at the screen's top left)
  function phone(g, cx, cy, w, h, rot, screen, o) {
    g.save(); g.translate(cx, cy); if (rot) g.rotate(rot);
    const r = Math.min(w, h) * 0.16, bz = Math.min(w, h) * 0.06;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -w / 2 + 2, -h / 2 + 4, w, h, r); g.fill();
    const body = g.createLinearGradient(0, -h / 2, 0, h / 2); body.addColorStop(0, '#3a4351'); body.addColorStop(1, '#1b212b');
    g.fillStyle = body; rr(g, -w / 2, -h / 2, w, h, r); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1.2; g.stroke();
    const sw = w - bz * 2, sh = h - bz * 2;
    g.save(); rr(g, -sw / 2, -sh / 2, sw, sh, r * 0.6); g.clip();
    g.translate(-sw / 2, -sh / 2);
    if (o && o.upright != null) {   // the picture kept upright while the phone turns (rot) — the content's own size (o.cw, o.ch)
      g.translate(sw / 2, sh / 2); g.rotate(-rot + (o.upright || 0)); g.translate(-o.cw / 2, -o.ch / 2); screen(g, o.cw, o.ch);
    } else screen(g, sw, sh);
    g.restore();
    // the camera hole on the short side
    g.fillStyle = '#0b0e13'; const camX = w > h ? -w / 2 + bz * 0.5 : 0, camY = w > h ? 0 : -h / 2 + bz * 0.5; g.beginPath(); g.arc(camX, camY, bz * 0.28, 0, TAU); g.fill();
    g.restore();
  }
  // a thumb (a neutral glove grey), its tip at (x, y), pointing along ang (0: up), pressed (0..1: closer to the glass)
  function thumb(g, x, y, ang, s, pressed) {
    g.save(); g.translate(x, y); g.rotate(ang || 0); const k = 1 - 0.08 * (pressed || 0); g.scale(k, k);
    g.fillStyle = 'rgba(0,0,0,' + (0.25 + 0.15 * (1 - (pressed || 0))) + ')'; rr(g, -s * 0.36 + s * 0.12 * (1 - (pressed || 0)), -s * 0.12 + s * 0.16 * (1 - (pressed || 0)), s * 0.72, s * 1.6, s * 0.36); g.fill();
    const gr = g.createLinearGradient(-s * 0.4, 0, s * 0.4, 0); gr.addColorStop(0, '#c9d1dc'); gr.addColorStop(0.5, '#eef2f6'); gr.addColorStop(1, '#b7c0cc');
    g.fillStyle = gr; rr(g, -s * 0.36, -s * 0.2, s * 0.72, s * 1.7, s * 0.36); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; rr(g, -s * 0.22, -s * 0.12, s * 0.44, s * 0.42, s * 0.2); g.fill();   // (the nail)
    g.strokeStyle = 'rgba(40,50,64,.35)'; g.lineWidth = 1; rr(g, -s * 0.36, -s * 0.2, s * 0.72, s * 1.7, s * 0.36); g.stroke();
    g.restore();
    if (pressed > 0.5) { g.strokeStyle = 'rgba(255,255,255,' + (0.5 * pressed) + ')'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, s * 0.55, 0, TAU); g.stroke(); }
  }
  function text(g, s, x, y, o) {
    o = o || {}; g.font = (o.w || 800) + ' ' + (o.it === false ? '' : 'italic ') + (o.size || 12) + 'px ApexMenu, Roboto, system-ui, sans-serif';
    g.textAlign = o.al || 'center'; g.textBaseline = o.bl || 'middle';
    if (o.shadow) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillText(s, x + 1, y + 1.5); }
    g.fillStyle = o.col || '#fff'; g.fillText(s, x, y);
  }
  // the game's arrow sign for a corner (#h-note): sev 1 green, 2 yellow, 3 red; kind 'r1' 'l1' 'r3' 'l3'
  const NOTE_PATHS = {
    r1: 'M22 54 V36 Q22 20 38 20 H46 M38 11 L47 20 L38 29', l1: 'M42 54 V36 Q42 20 26 20 H18 M26 11 L17 20 L26 29',
    r3: 'M20 54 V28 Q20 12 32 12 Q44 12 44 28 V42 M35 34 L44 43 L53 34', l3: 'M44 54 V28 Q44 12 32 12 Q20 12 20 28 V42 M29 34 L20 43 L11 34',
    r2: 'M26 56 V40 Q26 24 42 15 M32 10 L43 14 L39 25', l2: 'M38 56 V40 Q38 24 22 15 M32 10 L21 14 L25 25'
  };
  const pathCache = {};
  const P2D = (d) => pathCache[d] || (pathCache[d] = new Path2D(d));
  function noteSign(g, cx, cy, size, kind, sev, alpha, scale) {
    if (alpha <= 0.01) return;
    g.save(); g.globalAlpha = alpha; g.translate(cx, cy); const s = size * (scale == null ? 1 : scale); g.scale(s / 64, s / 64);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -32, -29, 64, 64, 12); g.fill();
    g.fillStyle = sev === 3 ? '#e4402f' : sev === 2 ? '#f1b416' : '#3fae3a'; rr(g, -32, -32, 64, 64, 12); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 3; g.stroke();
    g.translate(-32, -32); g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(P2D(NOTE_PATHS[kind]));
    g.restore();
  }
  // the game's speedometer (green, yellow, red segments, a needle), f: 0..1
  function speedo(g, cx, cy, R, f, kmh) {
    const a0 = Math.PI * 5 / 6, a1 = Math.PI * 2, N = 16;
    g.lineCap = 'butt'; g.strokeStyle = 'rgba(8,11,16,.6)'; g.lineWidth = R * 0.34; g.beginPath(); g.arc(cx, cy, R, a0 - 0.06, a1 + 0.06); g.stroke();
    g.lineWidth = R * 0.2;
    for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 0.74) / N, on = t0 < f;
      g.strokeStyle = t0 < 0.6 ? (on ? '#5fd13a' : '#1d3319') : t0 < 0.82 ? (on ? '#f1c21b' : '#3a3214') : (on ? '#ee3b2b' : '#3d1a17');
      g.beginPath(); g.arc(cx, cy, R, a0 + (a1 - a0) * t0, a0 + (a1 - a0) * t1); g.stroke(); }
    const an = a0 + (a1 - a0) * f; g.strokeStyle = '#fff'; g.lineWidth = Math.max(1.5, R * 0.07); g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx + Math.cos(an) * R * 0.2, cy + Math.sin(an) * R * 0.2); g.lineTo(cx + Math.cos(an) * R * 1.08, cy + Math.sin(an) * R * 1.08); g.stroke();
    g.fillStyle = '#10151c'; g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R * 0.16, 0, TAU); g.fill(); g.stroke();
    if (kmh != null) text(g, String(Math.round(kmh)), cx + R * 0.05, cy + R * 0.62, { size: R * 0.62, col: PAL.lime, w: 900, shadow: true });
  }
  // a top-down car in 2D (the phone's screen, diagrams): centre, heading (0: up), length
  function car2d(g, x, y, ang, L, col, o) {
    o = o || {}; g.save(); g.translate(x, y); g.rotate(ang || 0); const w = L * 0.45;
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -w / 2 + L * 0.06, -L / 2 + L * 0.08, w, L, w * 0.3); g.fill();
    g.fillStyle = '#15181d'; for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const sa = o.steer && b < 0 ? o.steer : 0; g.save(); g.translate(a * w * 0.5, b * L * 0.3); g.rotate(sa); g.fillRect(-w * 0.13, -L * 0.1, w * 0.26, L * 0.2); g.restore(); }
    g.fillStyle = col; rr(g, -w / 2, -L / 2, w, L, w * 0.32); g.fill();
    g.fillStyle = '#1f2a37'; rr(g, -w * 0.38, -L * 0.14, w * 0.76, L * 0.42, w * 0.18); g.fill();
    g.fillStyle = col; rr(g, -w * 0.32, -L * 0.04, w * 0.64, L * 0.24, w * 0.12); g.fill();
    if (o.stripe !== false) { g.fillStyle = '#f6f6f1'; g.fillRect(-w * 0.08, -L * 0.5, w * 0.16, L); }
    if (o.wing !== false) { g.fillStyle = '#1a1f27'; g.fillRect(-w * 0.52, L * 0.42, w * 1.04, L * 0.08); }
    g.restore();
  }
  function arrowArc(g, cx, cy, r, a0, a1, col, lw, head) {   // a curved arrow from angle a0 to a1 (canvas angles)
    g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, r, a0, a1, a1 < a0); g.stroke();
    const ex = cx + Math.cos(a1) * r, ey = cy + Math.sin(a1) * r, dir = a1 + (a1 > a0 ? Math.PI / 2 : -Math.PI / 2), hs = head || lw * 2.6;
    g.fillStyle = col; g.beginPath(); g.moveTo(ex + Math.cos(dir) * hs, ey + Math.sin(dir) * hs); g.lineTo(ex + Math.cos(dir + 2.5) * hs, ey + Math.sin(dir + 2.5) * hs); g.lineTo(ex + Math.cos(dir - 2.5) * hs, ey + Math.sin(dir - 2.5) * hs); g.closePath(); g.fill();
  }
  function arrow(g, x0, y0, x1, y1, col, lw, hs) {
    const a = Math.atan2(y1 - y0, x1 - x0); hs = hs || lw * 2.4;
    g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - Math.cos(a) * hs * 0.6, y1 - Math.sin(a) * hs * 0.6); g.stroke();
    g.fillStyle = col; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - Math.cos(a - 0.5) * hs, y1 - Math.sin(a - 0.5) * hs); g.lineTo(x1 - Math.cos(a + 0.5) * hs, y1 - Math.sin(a + 0.5) * hs); g.closePath(); g.fill();
  }
  // "off": a diagonal slash over an icon
  function slash(g, cx, cy, r, alpha) { if (alpha <= 0.01) return; g.save(); g.globalAlpha = alpha; g.strokeStyle = '#0b192b'; g.lineWidth = r * 0.34; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - r * 0.75, cy - r * 0.75); g.lineTo(cx + r * 0.75 * alpha, cy + r * 0.75 * alpha); g.stroke(); g.strokeStyle = PAL.curb; g.lineWidth = r * 0.18; g.stroke(); g.restore(); }
  function pill(g, x, y, s, o) {   // a HUD pill (the failures', the radio's tag)
    o = o || {}; g.font = '800 italic ' + (o.size || 10) + 'px ApexMenu, Roboto, sans-serif'; const w = g.measureText(s).width + (o.size || 10) * 1.1, h = (o.size || 10) * 1.6;
    const X = o.al === 'right' ? x - w : o.al === 'center' ? x - w / 2 : x;
    g.fillStyle = o.bg || 'rgba(190,30,30,.85)'; rr(g, X, y - h / 2, w, h, h / 2); g.fill();
    text(g, s, X + w / 2, y + 0.5, { size: o.size || 10, col: o.col || '#fff', shadow: !o.col });
    return w;
  }

  // the version the pictures are drawn for: 'port' (the phone upright: the camera behind the car, the phone drawn upright) or 'land'
  // (the phone on its side: the isometric camera, the phone drawn lying)
  const orient = () => SetAnim.env && SetAnim.env.get && SetAnim.env.get('orient') === 'land' ? 'land' : 'port';
  // the phone the player holds in this version: lying (all of it) or upright (taller than the picture: its lower part, close up, unless
  // o.full); { land, cx, cy, w, h } for phone()
  function heldPhone(W, H, o) {
    o = o || {};
    if (orient() === 'land') { const w = Math.min(W * (o.wl || 0.62), H * (o.hl || 1.85)); return { land: true, cx: W * (o.x || 0.5), cy: H * (o.y || 0.5), w, h: w * 0.47 }; }
    if (o.full) { const h = Math.min(H * (o.hf || 0.92), W * 0.9 / 0.47), w = h * 0.47; return { land: false, cx: W * (o.x || 0.5), cy: H * (o.y || 0.5), w, h }; }
    const w = Math.min(W * (o.wp || 0.5), H * 0.98), h = w / 0.47;
    return { land: false, cx: W * (o.x || 0.5), cy: H * (o.yp || 0.97) - h / 2, w, h };
  }

  /* ---------------- the loop: the pictures on the page ---------------- */
  const defs = {};
  function def(key, d) { defs[key] = d; }
  const live = [];   // { el (canvas), key, d, S (its own state), v, prev, k0 (time of the change), vis }
  let dprCap = 2, raf = 0, t0 = performance.now(), frozen = null;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { for (const e of es) { const L = live.find(x => x.el === e.target); if (L) L.vis = e.isIntersecting; } kick(); }, { rootMargin: '60px' }) : null;
  function attach(el, key, value) {
    const d = defs[key]; if (!d) return null;
    const L = { el, key, d, S: {}, v: value, prev: value, kc: -1e9, vis: !io, g: el.getContext('2d'), w: 0, h: 0 };
    if (d.init) d.init(L.S);
    live.push(L); if (io) io.observe(el); kick(); return L;
  }
  function detach(el) { const i = live.findIndex(x => x.el === el); if (i >= 0) { if (io) io.unobserve(el); live.splice(i, 1); } }
  function change(el, value) {
    const L = live.find(x => x.el === el); if (!L || String(L.v) === String(value)) return;
    const now = clock();
    const k = L.kc > -1e8 ? clamp((now - L.kc) / (L.d.dur || 0.8), 0, 1) : 1;
    L.prev = k < 1 ? L.v : L.v; L.v = value; L.kc = now; L.from = k < 1 && L.lastP ? L.lastP : null;
    if (L.d.onChange) L.d.onChange(L.S, value, L.prev, now);
    kick();
  }
  function clock() { return frozen != null ? frozen : (performance.now() - t0) / 1000; }
  // the parameters of a picture: P(v) of its value, eased from the last ones over d.dur after a change
  function params(L, now) {
    const d = L.d, k = L.kc > -1e8 ? ease((now - L.kc) / (d.dur || 0.8)) : 1;
    const A = L.from || (d.P ? d.P(L.prev) : {}), B = d.P ? d.P(L.v) : {};
    const p = {}; for (const key in B) p[key] = typeof B[key] === 'number' && typeof A[key] === 'number' ? lerp(A[key], B[key], k) : (k < 0.5 ? A[key] : B[key]);
    p.k = k; L.lastP = p; return p;
  }
  function drawOne(L, now) {
    const el = L.el, dpr = Math.min(window.devicePixelRatio || 1, dprCap), cw = el.clientWidth, ch = el.clientHeight;
    if (!cw || !ch) return;
    const W = Math.round(cw * dpr), H = Math.round(ch * dpr);
    if (el.width !== W || el.height !== H) { el.width = W; el.height = H; }
    const g = L.g; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cw, ch);
    const p = params(L, now), st = { v: L.v, prev: L.prev, k: p.k, since: now - L.kc, dt: L.lastT != null ? clamp(now - L.lastT, 0, 0.1) : 0 };
    L.lastT = now;
    try { L.d.draw(g, cw, ch, now, p, st, L.S); } catch (e) { console.error(L.key, e); }
  }
  function frame() {
    raf = 0; if (frozen != null) return;   // (a still: drawAt drew each picture at its own time)
    const now = clock(); let any = false;
    for (const L of live) if (L.vis && L.el.isConnected) { drawOne(L, now); any = true; }
    if (any && frozen == null && !reduced()) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches && !window.__anim; } catch (_) { return false; } };
  // the pictures at a fixed time (the screenshots for the mockup): every attached picture drawn at time t, its changes done
  function freeze(t) { frozen = t; for (const L of live) { L.kc = -1e9; L.lastT = null; } for (const L of live) { if (L.d.init) { L.S = {}; L.d.init(L.S); } } }
  function drawAt(L, t, simulate) {   // (a still: the state run up to t in small steps, so the paths and the marks are there)
    if (simulate) { L.S = {}; if (L.d.init) L.d.init(L.S); L.lastT = null; for (let x = Math.max(0, t - simulate); x < t; x += 1 / 30) { frozen = x; drawOne(L, x); } }
    frozen = t; drawOne(L, t);
  }

  return {
    TAU, D2R, clamp, lerp, sstep, ease, easeOut, back, wrapPi, lerpAng, fract, hash, tri, PAL, shade, mix, rgba,
    View, camAt, camMix, kinds: KINDS, poly, quad, disc, prism, outline, box, ccw, Path, drawRoad, band, ground, sky, carParts, carShadow, marker, thing, thingShadow,
    Particles, Marks, scene, rr, studio, phone, thumb, text, noteSign, speedo, car2d, arrowArc, arrow, slash, pill, NOTE_PATHS, P2D, SHX, SHZ,
    orient, heldPhone, def, defs, attach, detach, change, clock, freeze, drawAt, live, kick, set dprCap(v) { dprCap = v; }
  };
})();
