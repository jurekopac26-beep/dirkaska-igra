
  /* ================= STY: a sketch of a stylised kit (soft cartoon trees, bevelled stones, stumps, logs, mushrooms, flowers) =================
     Prototype only (scratchpad): window.__STY = { pal, flat, outline, props } switches Vršič's trees, bushes and stones to it. */
  let STYV = null; const STY_ASPH = [0.4, 0.38, 0.35];
  function styOn() { STYV = (typeof window !== 'undefined' && window.__STY) || null; return !!STYV; }
  // a transform: scale, then a tilt about the local z axis, then the yaw, then the offset
  function sXf(x, y, z, yaw, sx, sy, sz, tilt) { return { x, y, z, yc: Math.cos(yaw || 0), ys: Math.sin(yaw || 0), sx: sx || 1, sy: sy || sx || 1, sz: sz || sx || 1, tc: Math.cos(tilt || 0), ts: Math.sin(tilt || 0) }; }
  function sP(X, x, y, z) { x *= X.sx; y *= X.sy; z *= X.sz; const x2 = x * X.tc - y * X.ts, y2 = x * X.ts + y * X.tc; return [X.x + x2 * X.yc - z * X.ys, X.y + y2, X.z + x2 * X.ys + z * X.yc]; }
  function sN(X, x, y, z) { x /= X.sx; y /= X.sy; z /= X.sz; const x2 = x * X.tc - y * X.ts, y2 = x * X.ts + y * X.tc, nx = x2 * X.yc - z * X.ys, nz = x2 * X.ys + z * X.yc, l = Math.hypot(nx, y2, nz) || 1; return [nx / l, y2 / l, nz / l]; }
  function sTri(g, a, b, c, na, nb, nc, ca, cb, cc) {   // a triangle facing the way its vertex normals point (flat: faceted)
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    if (fx * fx + fy * fy + fz * fz < 1e-14) return;
    const sw = fx * (na[0] + nb[0] + nc[0]) + fy * (na[1] + nb[1] + nc[1]) + fz * (na[2] + nb[2] + nc[2]) < 0;
    if (sw) { const t = b; b = c; c = t; const tn = nb; nb = nc; nc = tn; const tc = cb; cb = cc; cc = tc; }
    if (STYV && STYV.flat) g.tri(a, b, c, ca, cb, cc); else g.triN(a, b, c, na, nb, nc, ca, cb, cc);
  }
  const sMul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const sMix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // a surface of revolution: prof [[r, y, colour], ...] from the bottom up; n sides; jit: a little unevenness of the rings
  function sLathe(g, X, prof, n, rot0, R, jit) {
    const m = prof.length, V = [], N = [], C = [];
    for (let k = 0; k < m; k++) {
      const p0 = prof[Math.max(0, k - 1)], p1 = prof[Math.min(m - 1, k + 1)];
      let nr = p1[1] - p0[1], ny = -(p1[0] - p0[0]); const l = Math.hypot(nr, ny) || 1; nr /= l; ny /= l;
      const r = prof[k][0], y = prof[k][1], rv = [], nv = [];
      for (let j = 0; j < n; j++) { const a = (rot0 || 0) + j / n * TAU, kk = jit && r > 0 ? 1 + (R() - 0.5) * jit : 1;
        rv.push(sP(X, Math.cos(a) * r * kk, y, Math.sin(a) * r * kk)); nv.push(sN(X, Math.cos(a) * nr, ny, Math.sin(a) * nr)); }
      V.push(rv); N.push(nv); C.push(prof[k][2]);
    }
    for (let k = 0; k < m - 1; k++) for (let j = 0; j < n; j++) { const j1 = (j + 1) % n;
      if (prof[k][0] > 0) sTri(g, V[k][j], V[k][j1], V[k + 1][j], N[k][j], N[k][j1], N[k + 1][j], C[k], C[k], C[k + 1]);
      if (prof[k + 1][0] > 0) sTri(g, V[k][j1], V[k + 1][j1], V[k + 1][j], N[k][j1], N[k + 1][j1], N[k + 1][j], C[k], C[k + 1], C[k + 1]); }
  }
  // an ellipsoid's profile (radius r, half height ry, centre y0), dark below and light on top (lo, hi), squashed flat underneath (flat 0..1)
  function sSph(r, ry, y0, m, col, lo, hi, flat) {
    const out = [];
    for (let k = 0; k <= m; k++) { const t = -Math.PI / 2 + k / m * Math.PI, s = Math.sin(t), f = s < 0 ? 1 - (flat || 0) : 1;
      out.push([k === 0 || k === m ? 0 : Math.cos(t) * r, y0 + s * ry * f, sMul(col, lo + (hi - lo) * (s * 0.5 + 0.5))]); }
    return out;
  }
  // a rounded box (superellipsoid, e: 0.2 square .. 1 round)
  function sRBox(g, X, rx, ry, rz, e, col, lo, hi, nu, nv) {
    nu = nu || 12; nv = nv || 8;
    const f = (w, p) => Math.sign(w) * Math.pow(Math.abs(w), p), V = [], N = [], C = [];
    for (let k = 0; k <= nv; k++) { const v = -Math.PI / 2 + k / nv * Math.PI, cv = Math.cos(v), sv = Math.sin(v), rv = [], nn = [];
      for (let j = 0; j < nu; j++) { const u = j / nu * TAU, cu = Math.cos(u), su = Math.sin(u);
        rv.push(sP(X, rx * f(cv, e) * f(cu, e), ry * f(sv, e), rz * f(cv, e) * f(su, e)));
        nn.push(k === 0 ? sN(X, 0, -1, 0) : k === nv ? sN(X, 0, 1, 0) : sN(X, f(cv, 2 - e) * f(cu, 2 - e) / rx, f(sv, 2 - e) / ry, f(cv, 2 - e) * f(su, 2 - e) / rz)); }
      V.push(rv); N.push(nn); C.push(sMul(col, lo + (hi - lo) * (f(sv, e) * 0.5 + 0.5))); }
    for (let k = 0; k < nv; k++) for (let j = 0; j < nu; j++) { const j1 = (j + 1) % nu;
      sTri(g, V[k][j], V[k][j1], V[k + 1][j], N[k][j], N[k][j1], N[k + 1][j], C[k], C[k], C[k + 1]);
      sTri(g, V[k][j1], V[k + 1][j1], V[k + 1][j], N[k][j1], N[k + 1][j1], N[k + 1][j], C[k], C[k + 1], C[k + 1]); }
  }
  // a little leaf bump on a crown: a flattened dome sitting on the surface at direction (a, e) from (cx, cy, cz), radii (rx, ry, rz) of the crown
  function sBump(g, cx, cy, cz, rx, ry, rz, a, e, r, col) {
    const px = cx + Math.cos(a) * Math.cos(e) * rx * 0.97, py = cy + Math.sin(e) * ry * 0.97, pz = cz + Math.sin(a) * Math.cos(e) * rz * 0.97;
    const X = sXf(px, py, pz, a, r, r * 0.55, r, -(Math.PI / 2 - e));
    sLathe(g, X, [[1, -0.3, sMul(col, 0.9)], [0.95, 0.15, col], [0.6, 0.7, sMul(col, 1.08)], [0, 1, sMul(col, 1.12)]], 6, 0);
  }
  // the outline (toon): every triangle again, pushed out along its normals, turned inside out and dark
  function sOutline(g, n0, w, col) {
    const P = g.P, Nn = g.N, n1 = P.length / 3;
    for (let v = n0; v < n1; v += 3) {
      const q = (k) => [P[k * 3] + Nn[k * 3] * w, P[k * 3 + 1] + Nn[k * 3 + 1] * w, P[k * 3 + 2] + Nn[k * 3 + 2] * w], m = (k) => [-Nn[k * 3], -Nn[k * 3 + 1], -Nn[k * 3 + 2]];
      g.triN(q(v), q(v + 2), q(v + 1), m(v), m(v + 2), m(v + 1), col, col, col);
    }
  }
  /* ---- the palettes: the base colours of each species for the season ---- */
  function styPal() {
    const p = (STYV && STYV.pal) || 'ref', au = VRS !== 'summer';
    if (p === 'alpine') return { spr: [0.07, 0.24, 0.13], sprT: [0.13, 0.34, 0.18], lar: au ? [0.86, 0.56, 0.12] : [0.32, 0.5, 0.16], bee: au ? [0.78, 0.36, 0.1] : [0.22, 0.4, 0.12], dome: au ? [0.62, 0.26, 0.1] : [0.17, 0.34, 0.12], box: au ? [0.85, 0.66, 0.18] : [0.42, 0.52, 0.16], bir: au ? [0.9, 0.72, 0.2] : [0.38, 0.55, 0.16], dwf: [0.12, 0.26, 0.11], col: [0.14, 0.32, 0.16],
      trunk: [0.36, 0.24, 0.15], bush: au ? [0.66, 0.4, 0.14] : [0.26, 0.42, 0.13], berry: [0.75, 0.18, 0.1], rock: [0.74, 0.73, 0.69], snow: [0.94, 0.96, 1] };
    if (p === 'after') return { spr: [0.04, 0.34, 0.17], sprT: [0.1, 0.5, 0.24], lar: au ? [0.8, 0.55, 0.1] : [0.38, 0.56, 0.1], bee: au ? [0.78, 0.4, 0.08] : [0.18, 0.6, 0.07], dome: [0.07, 0.42, 0.11], box: au ? [0.85, 0.7, 0.1] : [0.5, 0.66, 0.09], bir: [0.32, 0.66, 0.09], dwf: [0.09, 0.38, 0.11], col: [0.07, 0.48, 0.16],
      trunk: [0.34, 0.21, 0.11], bush: [0.22, 0.54, 0.07], berry: [0.85, 0.3, 0.1], rock: [0.68, 0.7, 0.62], snow: [0.94, 0.96, 1] };
    if (p === 'itw') return { spr: [0.1, 0.28, 0.12], sprT: [0.2, 0.42, 0.16], lar: [0.14, 0.32, 0.1], bee: [0.2, 0.42, 0.12], dome: [0.16, 0.36, 0.1], box: [0.26, 0.46, 0.12], bir: [0.26, 0.46, 0.12], dwf: [0.18, 0.36, 0.12], col: [0.08, 0.26, 0.12],
      trunk: [0.42, 0.3, 0.22], bush: [0.2, 0.42, 0.12], berry: [0.95, 0.42, 0.62], rock: [0.92, 0.81, 0.67], snow: [0.95, 0.97, 1] };
    if (p === 'gh') return { spr: [0.04, 0.3, 0.24], sprT: [0.18, 0.56, 0.34], lar: [0.3, 0.52, 0.1], bee: [0.17, 0.45, 0.1], dome: [0.12, 0.4, 0.1], box: [0.26, 0.5, 0.08], bir: [0.36, 0.6, 0.1], dwf: [0.1, 0.36, 0.12], col: [0.12, 0.42, 0.14],
      trunk: [0.36, 0.24, 0.16], bush: [0.2, 0.5, 0.1], berry: [0.95, 0.9, 0.85], rock: [0.8, 0.8, 0.76], snow: [0.95, 0.97, 1] };
    if (p === 'adr') return { spr: [0.08, 0.28, 0.12], sprT: [0.16, 0.42, 0.18], lar: [0.18, 0.36, 0.12], bee: [0.4, 0.46, 0.3], dome: [0.3, 0.38, 0.22], box: [0.4, 0.46, 0.3], bir: [0.4, 0.46, 0.3], dwf: [0.2, 0.34, 0.12], col: [0.08, 0.28, 0.12],
      trunk: [0.4, 0.34, 0.28], bush: [0.32, 0.4, 0.2], berry: [0.62, 0.42, 0.85], rock: [0.93, 0.92, 0.88], snow: [0.95, 0.97, 1] };
    if (p === 'pastel') return { spr: [0.38, 0.72, 0.58], sprT: [0.55, 0.85, 0.7], lar: au ? [0.98, 0.78, 0.5] : [0.82, 0.86, 0.52], bee: au ? [0.98, 0.66, 0.52] : [0.6, 0.86, 0.5], dome: [0.98, 0.66, 0.74], box: au ? [0.99, 0.86, 0.55] : [0.99, 0.88, 0.6], bir: [0.72, 0.9, 0.6], dwf: [0.42, 0.68, 0.5], col: [0.5, 0.8, 0.62],
      trunk: [0.62, 0.45, 0.4], bush: [0.55, 0.82, 0.55], berry: [0.98, 0.55, 0.6], rock: [0.86, 0.84, 0.92], snow: [0.98, 0.98, 1] };
    return { spr: [0.03, 0.46, 0.2], sprT: [0.1, 0.66, 0.3], lar: au ? [0.95, 0.62, 0.06] : [0.56, 0.66, 0.06], bee: au ? [0.95, 0.42, 0.04] : [0.26, 0.78, 0.04], dome: au ? [0.8, 0.26, 0.05] : [0.05, 0.56, 0.1], box: au ? [0.98, 0.8, 0.06] : [0.8, 0.82, 0.04], bir: au ? [0.98, 0.86, 0.14] : [0.42, 0.86, 0.06], dwf: [0.08, 0.46, 0.12], col: [0.08, 0.6, 0.18],
      trunk: [0.44, 0.24, 0.1], bush: au ? [0.86, 0.46, 0.06] : [0.36, 0.76, 0.05], berry: [1, 0.44, 0.04], rock: [0.86, 0.85, 0.81], snow: [0.95, 0.97, 1] };
  }
  /* ---- the trees (unit: height 1, about ±0.45 wide; the instances scale and tint them) ----
     0 spruce (smooth tiers), 1 larch (soft stacked discs), 2 beech (a round crown with leaf bumps), 3 dwarf pine (a mound of blobs), 4 birch (a white trunk,
     rounded-box crowns), 5-7 the spruce, the larch and the dwarf pine under snow, 8 a tree of two stacked domes, 9 a big box tree, 10 a tall column */
  function styTrunk(g, h, r, col, birch) {
    const X = sXf(0, 0, 0), dk = [0.12, 0.12, 0.12], wh = [0.92, 0.91, 0.86];
    if (birch) sLathe(g, X, [[r * 1.5, -0.02, wh], [r, 0.06, wh], [r, h * 0.25, dk], [r * 0.95, h * 0.3, wh], [r * 0.9, h * 0.55, wh], [r * 0.85, h * 0.6, dk], [r * 0.8, h * 0.65, wh], [r * 0.7, h, wh]], 5, 0);
    else sLathe(g, X, [[r * 2.1, -0.02, sMul(col, 0.8)], [r * 1.3, 0.04, col], [r, 0.12, col], [r * 0.85, h, sMul(col, 1.1)]], 6, 0.3);
  }
  function styTreeGeo(kind) {
    if (STYV && (STYV.pal === 'gh' || STYV.pal === 'adr')) return styGhTree(kind);
    if (STYV && STYV.cards) return styCardTree(kind);
    if (STYV && STYV.pal === 'itw') return styItwTree(kind);
    const g = new GB(), R = rng(9640 + kind), C = styPal(), snow = C.snow, flat = STYV && STYV.flat, nS = flat ? 6 : 10;
    const tier = (y, r, h, col, top, sn) => sLathe(g, sXf(0, y, 0), [[r * 0.35, 0, sMul(col, 0.55)], [r * 0.95, 0.02, sMul(col, 0.8)], [r, 0.07, sMul(col, 0.9)], [r * 0.9, h * 0.16, sn ? snow : col], [r * 0.5, h * 0.55, sn ? snow : sMul(top, 1)], [r * 0.12, h * 0.92, sn ? snow : top], [0, h, sn ? snow : top]], nS, R() * TAU);
    if (kind === 0 || kind === 5) {   // spruce: three soft tiers on a short trunk
      styTrunk(g, 0.2, 0.035, C.trunk);
      const sn = kind === 5;
      tier(0.1, 0.46, 0.42, C.spr, C.sprT, sn); tier(0.38, 0.36, 0.36, sMul(C.spr, 1.08), C.sprT, sn); tier(0.62, 0.25, 0.38, sMul(C.spr, 1.15), C.sprT, sn);
    } else if (kind === 1 || kind === 6) {   // larch: soft stacked discs getting smaller, a thin top
      styTrunk(g, 0.35, 0.03, C.trunk);
      const sn = kind === 6, col = C.lar;
      [[0.14, 0.45], [0.33, 0.38], [0.5, 0.3], [0.66, 0.22], [0.8, 0.14]].forEach(([y, r], k) => {
        const c = sMul(col, 0.92 + k * 0.05);
        sLathe(g, sXf(0, y, 0), [[0, -0.02, sMul(c, 0.6)], [r * 0.8, 0, sMul(c, 0.7)], [r, 0.04, sMul(c, 0.85)], [r * 0.96, 0.08, sn ? snow : c], [r * 0.7, 0.13, sn ? snow : sMul(c, 1.08)], [0, 0.16, sn ? snow : sMul(c, 1.12)]], nS, R() * TAU); });
      sLathe(g, sXf(0, 0.92, 0), [[0.05, 0, col], [0, 0.1, col]], 5, 0);
    } else if (kind === 2) {   // beech: a big round crown with leaf bumps round its shoulders
      styTrunk(g, 0.45, 0.05, C.trunk);
      const cy = 0.66, rr = 0.46, ry = 0.34;
      sLathe(g, sXf(0, 0, 0), sSph(rr, ry, cy, flat ? 5 : 9, C.bee, 0.68, 1.12, 0.25), flat ? 8 : 16, R() * TAU, R, 0.04);
      for (let k = 0; k < 9; k++) sBump(g, 0, cy, 0, rr, ry, rr, k / 9 * TAU + R() * 0.4, (R() - 0.3) * 0.9, 0.07 + R() * 0.03, sMul(C.bee, 1.05 + R() * 0.12));
    } else if (kind === 3 || kind === 7) {   // dwarf pine: a low mound of soft blobs
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + R(), d = k ? 0.26 : 0, r = k ? 0.26 : 0.34;
        sLathe(g, sXf(Math.cos(a) * d, 0, Math.sin(a) * d), sSph(r, r * 1.3, 0.35 - d * 0.4, 5, vary(C.dwf, R, 0.25), 0.7, 1.15, 0.6), 8, R() * TAU); }
      if (kind === 7) sLathe(g, sXf(0, 0, 0), sSph(0.3, 0.12, 0.72, 4, snow, 0.95, 1.05, 0.5), 8, 0);
    } else if (kind === 4) {   // birch: a white trunk, crowns of rounded boxes
      styTrunk(g, 0.62, 0.035, C.trunk, true);
      sRBox(g, sXf(0.04, 0.68, 0, R()), 0.3, 0.17, 0.26, 0.35, C.bir, 0.7, 1.15, flat ? 8 : 12, flat ? 6 : 8);
      sRBox(g, sXf(-0.2, 0.55, 0.12, R()), 0.17, 0.12, 0.16, 0.35, sMul(C.bir, 0.95), 0.7, 1.15, 10, 6);
      for (let k = 0; k < 5; k++) sBump(g, 0.04, 0.68, 0, 0.3, 0.17, 0.26, k / 5 * TAU + R(), (R() - 0.2) * 0.6, 0.045, sMul(C.bir, 1.12));
    } else if (kind === 8) {   // two stacked domes
      styTrunk(g, 0.35, 0.05, C.trunk);
      sLathe(g, sXf(0, 0, 0), sSph(0.46, 0.25, 0.5, flat ? 5 : 6, C.dome, 0.66, 1.08, 0.4), nS + 2, R() * TAU);
      sLathe(g, sXf(0.03, 0, 0.02), sSph(0.32, 0.22, 0.78, flat ? 5 : 6, sMul(C.dome, 1.1), 0.75, 1.15, 0.3), nS + 2, R() * TAU);
      for (let k = 0; k < 7; k++) sBump(g, 0, 0.5, 0, 0.46, 0.25, 0.46, k / 7 * TAU + R() * 0.5, R() * 0.3, 0.06, sMul(C.dome, 1.15));
    } else if (kind === 9) {   // a big box tree: a rounded cuboid crown, a second one at its side
      styTrunk(g, 0.42, 0.055, C.trunk);
      sRBox(g, sXf(0.03, 0.66, 0, R() * 0.6), 0.36, 0.26, 0.32, 0.3, C.box, 0.68, 1.12, flat ? 8 : 14, flat ? 6 : 10);
      sRBox(g, sXf(-0.3, 0.6, 0.06, R()), 0.14, 0.15, 0.16, 0.3, sMul(C.box, 0.94), 0.7, 1.12, 10, 6);
      for (let k = 0; k < 6; k++) sBump(g, 0.03, 0.66, 0, 0.36, 0.26, 0.32, k / 6 * TAU + R(), 0.3 + R() * 0.4, 0.05, sMul(C.box, 1.12));
    } else {   // a tall column (an ellipsoid on a thin trunk)
      styTrunk(g, 0.2, 0.03, C.trunk);
      sLathe(g, sXf(0, 0, 0), [[0, 0.1, sMul(C.col, 0.6)], [0.3, 0.24, sMul(C.col, 0.75)], [0.42, 0.45, sMul(C.col, 0.9)], [0.36, 0.72, C.col], [0.18, 0.92, sMul(C.col, 1.1)], [0, 1, sMul(C.col, 1.15)]], nS, R() * TAU);
    }
    if (STYV && STYV.outline) sOutline(g, 0, 0.012, [0.05, 0.06, 0.05]);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  const STY_KINDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  function styPick(kind, sp, x, z, r2, r3, r4, hgt, wid, lc) {   // the stylised forest's species and tint for a spot the Vršič forest picked
    const h = rpHash(Math.round(x * 3.1), Math.round(z * 2.7)), t = [0.9 + r2 * 0.2, 0.9 + r4 * 0.18, 0.88 + r3 * 0.2];
    let k = kind, w = wid, y = hgt;
    if (kind === 2) { k = h < 0.42 ? 2 : h < 0.72 ? 8 : 9; w = wid * 1.05; }
    else if (kind === 4 && lc === 3 && h < 0.5) k = 10;
    else if (kind === 0 && lc === 3 && h < 0.4) { k = 10; w = wid * 0.8; }
    if (k === 3 || k === 7) { y = hgt * 1.3; }
    w *= k === 3 || k === 7 ? 0.9 : 0.78; y *= 0.92;
    return { k, w, h: y, c: t };
  }
  /* ---- the stones: bevelled limestone (a few big flat faces, light chamfers on the edges, faceted), alone or in a group ---- */
  function styStone(g, x, y, z, sx, sy, sz, rot, col, R, lean) {
    if (STYV && STYV.v2 && !STYV.__kit) { const keep = ROCK_SMOOTH; ROCK_SMOOTH = true; rock(g, x, y + sy * 0.25, z, sx, sy * 0.8, sz, rot, [0.9 * (0.95 + R() * 0.1), 0.78, 0.64], R, 0.25, 0.75); ROCK_SMOOTH = keep; return; }
    if (STYV && STYV.pal === 'itw') col = [col[0] * 1.08, col[1] * 0.97, col[2] * 0.84];
    const n = 5 + Math.floor(R() * 3), ang = [], rad = [];
    for (let k = 0; k < n; k++) { ang.push((k + (R() - 0.5) * 0.6) / n * TAU); rad.push(0.8 + R() * 0.35); }
    const lx = lean ? (R() - 0.5) * lean : 0, lz = lean ? (R() - 0.5) * lean : 0, tilt = (R() - 0.5) * 0.25;
    const ring = (yy, f) => ang.map((a, k) => { const u = yy; return [Math.cos(a) * rad[k] * f + lx * u, yy + (k % 2 ? tilt * u * 0.3 : 0), Math.sin(a) * rad[k] * f + lz * u]; });
    const L = [[ring(-0.15, 0.86), 0.62], [ring(0.05, 1.0), 0.78], [ring(0.72, 0.93), 0.92], [ring(0.88, 0.7), 1.18], [ring(0.95, 0.5), 1.08]];
    const c = Math.cos(rot), s = Math.sin(rot), W = (p) => [x + (p[0] * sx) * c - (p[2] * sz) * s, y + p[1] * sy, z + (p[0] * sx) * s + (p[2] * sz) * c];
    const fs = STYV && STYV.flat; const keep = STYV.flat; STYV.flat = true;   // (the stones always faceted)
    for (let q = 0; q < L.length - 1; q++) for (let k = 0; k < n; k++) { const j = (k + 1) % n, a = W(L[q][0][k]), b = W(L[q][0][j]), cc = W(L[q + 1][0][j]), d = W(L[q + 1][0][k]);
      const up = [0, 0, 0], c0 = sMul(col, L[q][1]), c1 = sMul(col, L[q + 1][1]), o = [a[0] - x, 0, a[2] - z];
      sTri(g, a, b, cc, o, o, o, c0, c0, c1); sTri(g, a, cc, d, o, o, o, c0, c1, c1); }
    const top = L[L.length - 1][0], ctr = W([lx * 0.95, 0.98, lz * 0.95]), ct = sMul(col, 1.12), upn = [0, 1, 0];
    for (let k = 0; k < n; k++) sTri(g, W(top[k]), W(top[(k + 1) % n]), ctr, upn, upn, upn, ct, ct, sMul(col, 1.05));
    STYV.flat = keep;
    if (STYV.outline) sOutline(g, g.P.length / 3 - (L.length - 1) * n * 6 - n * 3, 0.06, [0.06, 0.06, 0.06]);
  }
  function styStones(g, x, y, z, r, R, col, gnd) {   // a group of one big stone and a few smaller ones round it
    if (STYV && STYV.v2) return styItwRock(g, x, y, z, r, R);
    const big = 0.6 + R() * 0.6;
    styStone(g, x, y, z, r, r * (big + (R() < 0.3 ? 0.8 : 0)), r * (0.75 + R() * 0.3), R() * TAU, vary(col, R, 0.08), R, 0.4);
    const m = 1 + Math.floor(R() * 3);
    for (let k = 0; k < m; k++) { const a = R() * TAU, d = r * (0.9 + R() * 0.5), q = r * (0.3 + R() * 0.35), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
      styStone(g, px, gnd(px, pz), pz, q, q * (0.7 + R() * 0.8), q * (0.8 + R() * 0.3), R() * TAU, vary(col, R, 0.12), R, 0.3); }
  }
  /* ---- the small things ---- */
  function styBush(g, x, y, z, s, R, col, berry) {   // a soft bush of two or three blobs, orange berries on it
    if (STYV && STYV.cards && STY_CARDS) return styCardBush(x, y, z, s * 1.1, R);
    if (STYV && STYV.v2) return styItwBush(g, x, y, z, s, R);
    const n = 2 + Math.floor(R() * 2), C = styPal(); col = col || C.bush;
    for (let k = 0; k < n; k++) { const a = R() * TAU, d = k ? s * 0.55 : 0, r = s * (k ? 0.6 : 0.85), cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, cy = y + r * 0.55;
      sLathe(g, sXf(cx, 0, cz), sSph(r, r * 0.85, cy, 5, vary(col, R, 0.12), 0.7, 1.15, 0.5), 8, R() * TAU);
      if (berry) for (let q = 0; q < 5; q++) { const aa = R() * TAU, ee = R() * 1.1; sLathe(g, sXf(cx + Math.cos(aa) * Math.cos(ee) * r * 0.98, cy + Math.sin(ee) * r * 0.85 * 0.98, cz + Math.sin(aa) * Math.cos(ee) * r * 0.98), sSph(0.09 * s + 0.05, 0.08 * s + 0.04, 0, 2, C.berry, 0.9, 1.1), 4, 0); } }
  }
  function styStump(g, x, y, z, r, R) {
    const C = styPal(), bark = vary(C.trunk, R, 0.1), wood = [0.93, 0.68, 0.48], h = r * (0.9 + R() * 0.5), X = sXf(x, y, z, R() * TAU);
    sLathe(g, X, [[r * 1.45, -0.1, sMul(bark, 0.75)], [r * 1.2, r * 0.15, bark], [r, r * 0.4, bark], [r, h, sMul(bark, 1.08)], [r * 0.92, h + 0.02, wood], [r * 0.6, h + 0.05, sMul(wood, 0.9)], [r * 0.5, h + 0.05, wood], [0, h + 0.06, sMul(wood, 1.05)]], 7, 0, R, 0.12);
  }
  function styLog(g, x, y, z, L, r, rot, R) {   // a fallen trunk lying across the slope, light rings at both ends
    const C = styPal(), bark = vary(C.trunk, R, 0.1), wood = [0.93, 0.68, 0.48], X = sXf(x, y + r * 0.85, z, rot, 1, 1, 1, Math.PI / 2);
    sLathe(g, X, [[0, -L / 2 - 0.02, wood], [r * 0.55, -L / 2 - 0.02, sMul(wood, 0.92)], [r * 0.9, -L / 2, wood], [r, -L / 2 + 0.05, bark], [r, L / 2 - 0.05, sMul(bark, 1.06)], [r * 0.9, L / 2, wood], [r * 0.55, L / 2 + 0.02, sMul(wood, 0.92)], [0, L / 2 + 0.02, wood]], 7, 0);
    if (R() < 0.6) { const X2 = sXf(x + Math.cos(rot) * L * 0.15, y + r * 1.5, z + Math.sin(rot) * L * 0.15, rot + 1.2, 1, 1, 1, 0.6); sLathe(g, X2, [[r * 0.45, 0, bark], [r * 0.35, r * 2.2, bark], [r * 0.32, r * 2.25, wood], [0, r * 2.26, wood]], 5, 0); }
  }
  function styMush(g, x, y, z, s, R) {   // a mushroom (an orange cap or a brown cep) on a cream stem, sometimes a small one beside it
    const orange = R() < 0.55, cap = orange ? [0.98, 0.45, 0.08] : [0.5, 0.3, 0.14], stem = [0.95, 0.9, 0.78];
    const one = (px, pz, k) => { const py = y, h = s * k * (orange ? 1.5 : 0.9), r = s * k * (orange ? 0.75 : 0.65);
      sLathe(g, sXf(px, py, pz), [[r * 0.32, 0, stem], [r * 0.24, h * 0.6, stem], [r * 0.26, h, stem]], 6, 0);
      sLathe(g, sXf(px, py + h * 0.92, pz), [[r * 0.25, 0, sMul(stem, 0.9)], [r * 0.95, 0.02 * k, sMul(cap, 0.8)], [r, r * 0.25, cap], [r * 0.7, r * 0.6, sMul(cap, 1.08)], [0, r * 0.75, sMul(cap, 1.12)]], 8, 0); };
    one(x, z, 1); if (R() < 0.6) one(x + s * 0.7, z + s * 0.3, 0.5);
  }
  function styFlower(g, x, y, z, s, R) {   // a daisy (pink petals round a yellow middle, on two leaves) or a purple bell in a rosette
    const leaf = [0.3, 0.72, 0.08], up = [0, 1, 0];
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + R(), p = (d, h) => [x + Math.cos(a) * d * s, y + h * s, z + Math.sin(a) * d * s], q = (d, w) => [x + Math.cos(a) * d * s - Math.sin(a) * w * s, y + 0.12 * s, z + Math.sin(a) * d * s + Math.cos(a) * w * s];
      sTri(g, p(0, 0.05), q(0.45, 0.16), p(0.9, 0.18), up, up, up, sMul(leaf, 0.8), leaf, sMul(leaf, 1.15)); sTri(g, p(0, 0.05), p(0.9, 0.18), q(0.45, -0.16), up, up, up, sMul(leaf, 0.8), sMul(leaf, 1.15), leaf); }
    if (R() < 0.6) {
      const pink = [0.98, 0.55, 0.62], c = [x, y + 0.6 * s, z], m = 16;
      sLathe(g, sXf(x, y, z), [[0.05 * s, 0, leaf], [0.04 * s, 0.6 * s, leaf]], 4, 0);
      for (let k = 0; k < m; k++) { const a0 = k / m * TAU, a1 = (k + 1) / m * TAU, r0 = (k % 2 ? 0.28 : 0.5) * s, r1 = ((k + 1) % 2 ? 0.28 : 0.5) * s;
        sTri(g, c, [x + Math.cos(a0) * r0, y + 0.6 * s, z + Math.sin(a0) * r0], [x + Math.cos(a1) * r1, y + 0.6 * s, z + Math.sin(a1) * r1], up, up, up, sMul(pink, 0.9), pink, pink); }
      sLathe(g, sXf(x, y + 0.6 * s, z), sSph(0.13 * s, 0.07 * s, 0, 3, [1, 0.85, 0.15], 0.9, 1.1), 6, 0);
    } else {
      const pur = [0.62, 0.3, 0.85];
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + R(), px = x + Math.cos(a) * 0.12 * s, pz = z + Math.sin(a) * 0.12 * s, h = (0.45 + R() * 0.25) * s;
        sLathe(g, sXf(px, y, pz), [[0.03 * s, 0, leaf], [0.025 * s, h, leaf]], 3, 0);
        sLathe(g, sXf(px, y + h, pz), sSph(0.12 * s, 0.17 * s, 0.1 * s, 3, pur, 0.75, 1.15), 6, 0); }
    }
  }
  function styTuft(g, x, y, z, s, R, col) {   // a tuft of grass blades (both faces)
    col = col || [0.3, 0.78, 0.1]; const n = 4 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) { const a = R() * TAU, lean = 0.2 + R() * 0.25, h = s * (0.6 + R() * 0.5), w = s * 0.07, bx = x + (R() - 0.5) * s * 0.3, bz = z + (R() - 0.5) * s * 0.3;
      const p0 = [bx - Math.sin(a) * w, y, bz + Math.cos(a) * w], p1 = [bx + Math.sin(a) * w, y, bz - Math.cos(a) * w], t = [bx + Math.cos(a) * lean * h, y + h, bz + Math.sin(a) * lean * h], n1 = [Math.cos(a), 0.5, Math.sin(a)], n2 = [-Math.cos(a), 0.5, -Math.sin(a)];
      g.triN(p0, p1, t, n1, n1, n1, sMul(col, 0.7), sMul(col, 0.7), sMul(col, 1.2)); g.triN(p0, t, p1, n2, n2, n2, sMul(col, 0.7), sMul(col, 1.2), sMul(col, 0.7)); }
  }
  function styFern(g, x, y, z, s, R) {   // a leafy plant: six broad leaves arching out (as the yellow-green one in the reference)
    const col = VRS === 'summer' ? [0.72, 0.82, 0.08] : [0.95, 0.68, 0.1], up = [0, 1, 0];
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R() * 0.3, ca = Math.cos(a), sa = Math.sin(a), P = (d, w, h) => [x + (ca * d - sa * w) * s, y + h * s, z + (sa * d + ca * w) * s];
      const b = P(0, 0, 0.1), m1 = P(0.35, 0.16, 0.4), m2 = P(0.35, -0.16, 0.4), t = P(0.75, 0, 0.18), mid = P(0.4, 0, 0.46);
      for (const [p, q] of [[b, m1], [m1, t], [t, m2], [m2, b]]) sTri(g, p, q, mid, up, up, up, sMul(col, 0.8), col, sMul(col, 1.15)); }
  }
  function styLily(g, x, y, z, s, R) {   // a lily pad with its notch on the water
    const col = [0.12, 0.62, 0.16], up = [0, 1, 0], a0 = R() * TAU, m = 12, c = [x, y + 0.04, z];
    for (let k = 0; k < m; k++) { if (k === 0) continue; const a = a0 + k / m * TAU, b = a0 + (k + 1) / m * TAU;
      sTri(g, c, [x + Math.cos(a) * s, y, z + Math.sin(a) * s], [x + Math.cos(b) * s, y, z + Math.sin(b) * s], up, up, up, sMul(col, 1.1), col, col); }
  }
  function styCattail(g, x, y, z, s, R) {
    const st = [0.32, 0.6, 0.12], br = [0.45, 0.26, 0.12];
    for (let k = 0; k < 3; k++) { const px = x + (R() - 0.5) * s * 0.6, pz = z + (R() - 0.5) * s * 0.6, h = s * (1.4 + R() * 0.8);
      sLathe(g, sXf(px, y, pz), [[0.03 * s, 0, st], [0.02 * s, h, st]], 3, 0);
      sLathe(g, sXf(px, y + h * 0.72, pz), [[0.05 * s, 0, br], [0.08 * s, 0.05 * s, br], [0.08 * s, h * 0.22, br], [0, h * 0.25, br]], 5, 0); }
    styTuft(g, x, y, z, s * 1.2, R, st);
  }
  /* ---- the ground: brighter, more saturated colours ---- */
  function styGround(c, x, z) {
    if (STYV && STYV.pal === 'itw') return STYV.v2 ? styItwGround2(c, x, z) : styItwGround(c, x, z);
    if (STYV && (STYV.pal === 'gh' || STYV.pal === 'adr')) return styGhGround(c);
    const p = (STYV && STYV.pal) || 'ref', l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15;
    const sat = p === 'alpine' ? 1.15 : p === 'pastel' ? 1.2 : p === 'after' ? 1.45 : STYV.outline ? 1.7 : 1.65, bri = p === 'alpine' ? 1.0 : p === 'pastel' ? 1.12 : p === 'after' ? 1.0 : 1.14;
    if (p === 'after') { c[0] = c[0] * 0.85; c[1] = c[1] * 1.05 + 0.02; c[2] *= 0.75; }
    for (let k = 0; k < 3; k++) c[k] = Math.max(0, (l + (c[k] - l) * sat) * bri);
    if (p === 'ref' && VRS === 'summer') { c[0] *= 0.88; c[1] *= 1.1; c[2] *= 0.72; }
    if (p === 'pastel') for (let k = 0; k < 3; k++) c[k] = c[k] * 0.7 + 0.3 * [0.95, 0.97, 0.9][k];
  }
  /* ---- the verges and the scatter of small things near the road (buildVrsic calls these) ---- */
  function styVerge(g, x, y, z, A, r, R, snowy) {
    const C = styPal(), lim = STYV.props == null ? 1 : STYV.props;
    if (snowy > 0.5) { if (r < 0.15) styStones(g, x, y, z, 0.6 + R() * 0.6, R, C.rock, vrGround); return; }
    if (r < 0.2 * lim) styBush(g, x, y, z, 0.8 + R() * 0.7, R, vary(C.bush, R, 0.15), R() < 0.5);
    else if (r < 0.34 * lim) styTuft(g, x, y, z, 0.7 + R() * 0.5, R, A > 1450 ? [0.55, 0.7, 0.15] : null);
    else if (r < 0.4 * lim && A < 1500) styFlower(g, x, y, z, 0.9 + R() * 0.5, R);
  }
  // an animal in the soft style (kind 0 a roe deer, 1 a chamois, 2 a fox), standing at (x, y, z) facing rot; s: its size (1: a deer's)
  function styAnimal(g, x, y, z, rot, s, R, kind) {
    const col = kind === 0 ? [0.62, 0.38, 0.18] : kind === 1 ? [0.36, 0.27, 0.2] : [0.92, 0.42, 0.08], dk = sMul(col, 0.55), wh = [0.95, 0.92, 0.85], blk = [0.12, 0.1, 0.09];
    const c = Math.cos(rot), sn = Math.sin(rot), P = (u, h, v) => [x + (c * u - sn * v) * s, y + h * s, z + (sn * u + c * v) * s];
    const L = kind === 2 ? 0.75 : 1.1, hgt = kind === 2 ? 0.32 : kind === 1 ? 0.62 : 0.72, br = kind === 2 ? 0.16 : 0.24;
    const lay = (u, h, v, len, rad, cl, yaw, tilt) => sLathe(g, sXf(...P(u, h, v), rot + (yaw || 0), s, s, s, tilt == null ? -Math.PI / 2 : tilt), [[0, -len / 2, sMul(cl, 0.8)], [rad * 0.8, -len * 0.42, sMul(cl, 0.85)], [rad, -len * 0.1, cl], [rad, len * 0.15, cl], [rad * 0.75, len * 0.42, sMul(cl, 1.05)], [0, len / 2, sMul(cl, 1.08)]], 7, 0);
    lay(0, hgt + br * 0.6, 0, L, br, col);   // the body
    for (const [u, v] of [[L * 0.32, 0.1], [L * 0.32, -0.1], [-L * 0.3, 0.1], [-L * 0.3, -0.1]]) sLathe(g, sXf(...P(u, 0, v), 0, s), [[0.045, 0, blk], [0.04, 0.08, dk], [0.05, hgt * 0.6, col], [0.065, hgt + br * 0.4, col]], 4, 0);
    const nx = L * 0.5, ny = hgt + br * 1.3;   // the neck and the head
    sLathe(g, sXf(...P(nx * 0.85, hgt + br * 0.7, 0), rot, s, s, s, -0.45), [[br * 0.6, 0, col], [br * 0.45, br * 2.2, col]], 6, 0);
    lay(nx + 0.08, ny + br * 0.7, 0, kind === 2 ? 0.34 : 0.32, kind === 2 ? 0.1 : 0.11, kind === 2 ? col : sMul(col, 1.05));
    if (kind === 2) { sLathe(g, sXf(...P(nx + 0.27, ny + br * 0.6, 0), rot, s, s, s, -Math.PI / 2), [[0.05, 0, wh], [0, 0.1, blk]], 5, 0); lay(-L * 0.62, hgt + br * 0.5, 0, 0.5, 0.1, col, 0, -2.0); sLathe(g, sXf(...P(-L * 0.85, hgt + 0.02, 0), rot, s), sSph(0.07, 0.07, 0, 3, wh, 0.9, 1.1), 5, 0); }
    else sLathe(g, sXf(...P(-L * 0.5, hgt + br * 0.9, 0), 0, s), sSph(0.08, 0.08, 0, 3, kind === 0 ? wh : blk, 0.9, 1.1), 5, 0);
    for (const v of [-0.06, 0.06]) {   // ears; antlers (deer) or the small hooked horns (chamois)
      sLathe(g, sXf(...P(nx + 0.02, ny + br * 0.95, v * (kind === 2 ? 1.2 : 1.6)), rot, s), [[0.04, 0, kind === 2 ? blk : col], [0, kind === 2 ? 0.12 : 0.1, kind === 2 ? blk : col]], 4, 0);
      if (kind === 0) { sLathe(g, sXf(...P(nx + 0.06, ny + br * 1.05, v), rot, s, s, s, v > 0 ? 0.25 : -0.25), [[0.018, 0, [0.75, 0.66, 0.5]], [0.012, 0.28, [0.85, 0.78, 0.62]], [0, 0.3, wh]], 4, 0); }
      if (kind === 1) sLathe(g, sXf(...P(nx + 0.08, ny + br * 1.1, v * 0.8), rot, s, s, s, 0.35), [[0.02, 0, blk], [0.012, 0.16, blk], [0, 0.18, blk]], 4, 0);
    }
  }
  function styOvergrow(scen, blds) {   // After Words: the road and the houses taken back by plants
    const R = rng(5150), C = styPal(), w = T.w;
    for (let s = 3; s < T.len - 3; s += 1.6) { const i = T.idx(s), nb = T.nx[i], nz = T.nz[i];
      for (let q = 0; q < 2; q++) { const o = (R() - 0.5) * 2 * (w + 0.5), ao = Math.abs(o), p = ao > w - 1.1 ? 0.75 : ao < 0.45 ? 0.35 : 0.06; if (R() > p) continue;
        const x = T.px[i] + nb * o, z = T.pz[i] + nz * o, y = T.hy[i] + 0.02, g = scen.get(x, z), r = R(); if (ao < w - 1.1 && r >= 0.62) continue;
        if (r < 0.5) styTuft(g, x, y, z, 1.0 + R() * 0.9, R, R() < 0.5 ? [0.3, 0.6, 0.1] : [0.5, 0.62, 0.16]);
        else if (r < 0.62) styFlower(g, x, y, z, 0.9 + R() * 0.5, R);
        else if (r < 0.86 || ao < w - 1.1) styBush(g, x, y, z, 0.7 + R() * 0.7, R, vary(C.bush, R, 0.2), R() < 0.3);
        else { const h = 1.6 + R() * 2.4; sLathe(g, sXf(x, y, z), [[0.06, 0, C.trunk], [0.04, h * 0.4, C.trunk]], 4, 0); sLathe(g, sXf(x, y, z), sSph(h * 0.32, h * 0.32, h * 0.7, 5, vary(C.bee, R, 0.15), 0.7, 1.12, 0.3), 8, R() * TAU); } } }
    for (let s = 60; s < T.len - 60; s += 260 + R() * 200) { const i = T.idx(s), o = (R() - 0.5) * w, x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;   // a tree fallen across the road now and then
      styLog(scen.get(x, z), x, T.hy[i] + 0.02, z, w * 1.3, 0.35, T.hd[i] + Math.PI / 2 + (R() - 0.5) * 0.7, R); }
    for (const s0 of STYV.animalsAt || []) { const n = 2 + Math.floor(R() * 2), A = T.hy[T.idx(T.startS + s0)] + VR.D.base, kind = A > 1250 ? 1 : 0;   // a group just ahead of where the pictures are taken
      for (let k = 0; k < n; k++) { const i = T.idx(T.startS + s0 + 16 + k * 2.5), o = -1.5 + k * 1.6 + (R() - 0.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        styAnimal(scen.get(x, z), x, T.hy[i] + 0.02, z, T.hd[i] + Math.PI / 2 + (R() - 0.5) * 0.9, 1.6, R, k === n - 1 && R() < 0.4 ? 2 : kind); } }
    for (let s = 40; s < T.len - 40; s += 90 + R() * 120) {   // animals: alone or in twos and threes, beside the road or crossing it
      const n = 1 + Math.floor(R() * 3), side = R() < 0.5 ? -1 : 1, onRoad = R() < 0.35, i0 = T.idx(s), A = T.hy[i0] + VR.D.base, kind = A > 1250 ? (R() < 0.75 ? 1 : 2) : (R() < 0.7 ? 0 : 2);
      for (let k = 0; k < n; k++) { const i = T.idx(s + (R() - 0.5) * 8), o = onRoad ? (R() - 0.5) * 2 * (w - 0.8) : side * ((side > 0 ? T.br[i] : T.bl[i]) + 1.5 + R() * 8), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        if (!onRoad && vrNear(x, z).dd < 0.5) continue; const y = onRoad ? T.hy[i] + 0.02 : vrGround(x, z);
        styAnimal(scen.get(x, z), x, y, z, T.hd[i] + (onRoad ? Math.PI / 2 * (R() < 0.5 ? 1 : -1) : R() * TAU) + (R() - 0.5) * 0.6, kind === 2 ? 1.3 : 1.6, R, kind); } }
    for (const b of blds) {   // ivy up the walls, bushes round the foot, moss and saplings on the roofs
      const y0 = vrGround(b.x, b.z), c = Math.cos(b.ang), sn = Math.sin(b.ang), H = b.kind === 4 ? 7.5 : b.kind === 3 ? 3.5 : 6.5, P = (u, v) => [b.x + c * u - sn * v, b.z + sn * u + c * v];
      const per = 2 * (b.L + b.W), n = Math.max(6, Math.round(per / 1.6));
      for (let k = 0; k < n; k++) { let t = k / n * per, u, v; if (t < b.L) { u = t - b.L / 2; v = -b.W / 2; } else if ((t -= b.L) < b.W) { u = b.L / 2; v = t - b.W / 2; } else if ((t -= b.W) < b.L) { u = b.L / 2 - t; v = b.W / 2; } else { t -= b.L; u = -b.L / 2; v = b.W / 2 - t; }
        const [x, z] = P(u * 1.04, v * 1.04), g = scen.get(x, z), ivy = R() < 0.55, hh = ivy ? H * (0.4 + R() * 0.7) : 1.2;
        const along = Math.abs(v) > Math.abs(u) * b.W / Math.max(1, b.L) ? b.ang : b.ang + Math.PI / 2;
        if (ivy) sLathe(g, sXf(x, 0, z, along, 1.5 + R(), 1, 0.45), sSph(1, hh * 0.55, y0 + hh * 0.5, 5, vary([0.12, 0.42, 0.1], R, 0.25), 0.7, 1.15, 0), 9, 0, R, 0.25);
        else styBush(g, x, y0, z, 0.9 + R() * 0.9, R, vary(C.bush, R, 0.2), R() < 0.3); }
      for (let k = 0; k < Math.round(b.L * b.W / 22) + 1; k++) { const [x, z] = P((R() - 0.5) * b.L * 0.8, (R() - 0.5) * b.W * 0.8), g = scen.get(x, z), r0 = 1 + R() * 1.6;
        sLathe(g, sXf(x, 0, z), sSph(r0, r0 * 0.45, y0 + H + 0.8 + R() * 1.4, 4, vary([0.24, 0.5, 0.1], R, 0.25), 0.7, 1.15, 0.6), 8, R() * TAU); }
    }
  }
  function styScatter(scen, excluded, onSide) {   // stumps, logs, mushrooms, ferns and stones beside the road; lily pads and cattails on the lakes
    const R = rng(9911), C = styPal(), lim = STYV.props == null ? 1 : STYV.props;
    for (let s = 6; s < T.len - 6; s += 4.5) for (const side of [-1, 1]) {
      if (R() > 0.55 * lim) continue;
      const o = 2.5 + Math.pow(R(), 1.4) * 22, [x, z, i] = onSide(s, side, o);
      const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 1.6) continue; if (excluded(x, z) || vrWater(x, z).e > -2) continue;
      const y = vrGround(x, z), A = y + VR.D.base, lc = vrLC(x, z), g = scen.get(x, z), r = R(), snowy = vrSnow(x, z, A, 0.9);
      if (snowy > 0.5) { if (r < 0.3) styStones(g, x, y, z, 0.5 + R() * 0.9, R, C.rock, vrGround); continue; }
      if (lc === 4 || A > 1500 || vrSlope(x, z) > 0.7) { if (r < 0.55) styStones(g, x, y, z, 0.6 + R() * 1.2, R, C.rock, vrGround); else if (r < 0.7) styTuft(g, x, y, z, 0.8, R, [0.55, 0.7, 0.15]); else if (r < 0.8 && A < 1600) styFlower(g, x, y, z, 1, R); continue; }
      if (lc === 1 || lc === 2) {   // the forest floor
        if (r < 0.16) styStump(g, x, y, z, 0.35 + R() * 0.3, R);
        else if (r < 0.26) styLog(g, x, y, z, 3 + R() * 3, 0.28 + R() * 0.15, R() * TAU, R);
        else if (r < 0.46) styMush(g, x, y, z, 0.35 + R() * 0.25, R);
        else if (r < 0.66) styFern(g, x, y, z, 1.2 + R() * 0.8, R);
        else if (r < 0.78) styStones(g, x, y, z, 0.5 + R() * 0.7, R, C.rock, vrGround);
        else styBush(g, x, y, z, 0.7 + R() * 0.6, R, null, R() < 0.5);
      } else {   // meadows, gardens
        if (r < 0.4) styFlower(g, x, y, z, 0.9 + R() * 0.6, R);
        else if (r < 0.6) styTuft(g, x, y, z, 0.8 + R() * 0.4, R);
        else if (r < 0.72) styBush(g, x, y, z, 0.8 + R() * 0.6, R, null, true);
        else if (r < 0.8) styMush(g, x, y, z, 0.3 + R() * 0.2, R);
        else if (r < 0.9) styStones(g, x, y, z, 0.5 + R() * 0.6, R, C.rock, vrGround);
      }
    }
    for (const L of VR.lakes) {   // lily pads inside the shore, cattails along it
      for (let k = 0; k < 900; k++) { const x = L.x0 + R() * (L.x1 - L.x0), z = L.z0 + R() * (L.z1 - L.z0), e = vrWater(x, z).e;
        if (e > 1.5 && e < 14 && R() < 0.5) styLily(scen.get(x, z), x, L.h + 0.06, z, 0.8 + R() * 0.7, R);
        else if (e > -2.5 && e < 0.5) { const y = vrGround(x, z); styCattail(scen.get(x, z), x, Math.max(y, L.h), z, 1 + R() * 0.5, R); } }
    }
  }
  /* ---- the road: worn asphalt in one long map (the whole width, 72 m along): grain, bleached and damp patches, yellow edge lines and the white
     dashed centre line painted in, darker repair patches, potholes in a ring of alligator cracks, fine cracks; its bump from the same picture ---- */
  let styRoadT = null;
  function styRoadTex(w) {
    if (styRoadT && styRoadT.w === w) return styRoadT;
    const W = 1024, H = 4096, LEN = 72, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), R = rng(4242);
    const U = (o) => (o + w) / (2 * w) * W, V = (s) => s / LEN * H, pxm = W / (2 * w);   // (metres across to px; along: 56.9 px a metre)
    const img = x.createImageData(W, H), d = img.data, n1 = valueNoise2(901, 9), n2 = valueNoise2(902, 2.2), n3 = valueNoise2(903, 0.5);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const o = (j * W + i) * 4, mx = i / pxm, mz = j / H * LEN;
      const nz = (f, a, b) => f(a, b) * (1 - b / LEN) + f(a, b - LEN) * (b / LEN), m = nz(n1, mx, mz) * 0.5 + nz(n2, mx, mz) * 0.35 + n3(mx * 3, mz * 3) * 0.15, k = 0.78 + m * 0.34 + (R() - 0.5) * 0.22 + (R() < 0.03 ? 0.25 : 0);
      d[o] = 96 * k; d[o + 1] = 90 * k; d[o + 2] = 84 * k; d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    const blob = (cx, cy, rx, ry, col, a, n) => { for (let q = 0; q < (n || 7); q++) { const px = cx + (R() - 0.5) * rx, py = cy + (R() - 0.5) * ry, r = (0.35 + R() * 0.5) * Math.max(rx, ry) * 0.5;
      const gd = x.createRadialGradient(px, py, 0, px, py, r); gd.addColorStop(0, `rgba(${col},${a})`); gd.addColorStop(0.6, `rgba(${col},${a * 0.6})`); gd.addColorStop(1, `rgba(${col},0)`); x.fillStyle = gd; x.beginPath(); x.ellipse(px, py, r, r * (0.6 + R() * 0.6), R() * 3, 0, TAU); x.fill(); } };
    // the bleached, dusty patches (blue-grey, as in the reference), more of them along the crown of the road, and damp brown stains
    const smear = (px, py, n, sz, col, a) => { let ang = Math.PI / 2 + (R() - 0.5) * 1.2; for (let q = 0; q < n; q++) { ang += (R() - 0.5) * 1.1; px += Math.cos(ang) * sz * 0.5; py += Math.sin(ang) * sz * 0.9;
        const r = sz * (0.5 + R()), gd = x.createRadialGradient(px, py, 0, px, py, r); gd.addColorStop(0, `rgba(${col},${a})`); gd.addColorStop(1, `rgba(${col},0)`); x.fillStyle = gd; x.beginPath(); x.ellipse(px, py, r, r * (0.5 + R() * 0.8), R() * 3, 0, TAU); x.fill(); } };
    for (let k = 0; k < 30; k++) { const o = (R() < 0.5 ? (R() - 0.5) * 1.4 : (R() - 0.5) * 2 * (w - 0.7)); smear(U(o), V(R() * LEN), 10 + R() * 18, 18 + R() * 26, R() < 0.75 ? '150,160,178' : '178,170,156', 0.07 + R() * 0.06); }
    for (let k = 0; k < 10; k++) smear(U((R() - 0.5) * 1.2), V(R() * LEN), 8, 16, '78,62,44', 0.1);
    // the lines: yellow at the edges (worn, broken where the paint flaked), the white dashes in the middle (4 m, 8 m gaps)
    const paint = (o0, o1, s0, s1, col) => { const a = U(o0), b = U(o1); for (let s = s0; s < s1; s += 0.05) { if (R() < 0.04) continue; x.fillStyle = `rgba(${col},${0.7 + R() * 0.3})`; x.fillRect(a + (R() - 0.5) * 1.5, V(s), b - a + (R() - 0.5) * 1.5, V(0.06) + 1); }
      for (let q = 0; q < (s1 - s0) * 6; q++) { x.fillStyle = 'rgba(70,66,60,0.55)'; const px = a + R() * (b - a), py = V(s0 + R() * (s1 - s0)); x.fillRect(px, py, 2 + R() * 4, 2 + R() * 5); } };
    paint(-(w - 0.25), -(w - 0.45), 0, LEN, '236,204,96'); paint(w - 0.45, w - 0.25, 0, LEN, '236,204,96');
    for (let s = 0; s < LEN; s += 12) paint(-0.07, 0.07, s, s + 4, '236,234,226');
    // repairs: rectangles of newer, darker asphalt with a black sealed seam
    for (let k = 0; k < 6; k++) { const o = (R() - 0.5) * 2 * (w - 1.4), s = R() * (LEN - 4), pw = (0.7 + R() * 1.1) * pxm, ph = (0.8 + R() * 1.6) * 57, cx = U(o), cy = V(s);
      x.save(); x.translate(cx, cy); x.rotate((R() - 0.5) * 0.08); x.fillStyle = 'rgba(44,38,33,0.92)'; x.fillRect(-pw / 2, -ph / 2, pw, ph);
      for (let q = 0; q < 300; q++) { x.fillStyle = R() < 0.5 ? 'rgba(90,82,74,0.5)' : 'rgba(20,18,16,0.5)'; x.fillRect(-pw / 2 + R() * pw, -ph / 2 + R() * ph, 2, 2); }
      x.strokeStyle = 'rgba(16,14,12,0.9)'; x.lineWidth = 3; x.strokeRect(-pw / 2, -ph / 2, pw, ph); x.restore(); }
    // fine cracks: wandering dark lines with branches, a long one along the middle
    const crack = (px, py, len, ang, wd) => { x.strokeStyle = 'rgba(22,19,17,0.85)'; x.lineWidth = wd; x.beginPath(); x.moveTo(px, py);
      for (let q = 0; q < len; q++) { ang += (R() - 0.5) * 0.9; px += Math.cos(ang) * 6; py += Math.sin(ang) * 6; x.lineTo(px, py); if (R() < 0.08 && wd > 1) { x.stroke(); crack(px, py, len * 0.4, ang + (R() < 0.5 ? 1 : -1), wd * 0.6); x.strokeStyle = 'rgba(22,19,17,0.85)'; x.lineWidth = wd; x.beginPath(); x.moveTo(px, py); } }
      x.stroke(); x.strokeStyle = 'rgba(200,196,188,0.25)'; };
    for (let k = 0; k < 26; k++) crack(R() * W, R() * H, 10 + R() * 30, R() * TAU, 1.5 + R() * 1.5);
    for (let k = 0; k < 5; k++) crack(U((R() - 0.5) * 0.6), R() * H, 60, Math.PI / 2, 2);
    // potholes: a ring of alligator cracks (small dark-edged plates), the hole itself lighter brown grit with a rim of water glinting blue-white
    for (let k = 0; k < 4; k++) { const o = (R() < 0.5 ? -1 : 1) * (0.8 + R() * (w - 2.2)), s = 4 + R() * (LEN - 8), cx = U(o), cy = V(s), rx = (0.45 + R() * 0.35) * pxm, ry = (0.5 + R() * 0.5) * 57;
      for (let q = 0; q < 70; q++) { const a = R() * TAU, rr = 1.05 + R() * 0.7, px = cx + Math.cos(a) * rx * rr, py = cy + Math.sin(a) * ry * rr, sz = 7 + R() * 10;
        x.fillStyle = `rgba(${70 + R() * 20},${60 + R() * 15},${52 + R() * 12},0.95)`; x.strokeStyle = 'rgba(14,12,10,0.95)'; x.lineWidth = 2; x.beginPath();
        for (let e = 0; e < 5; e++) { const b = e / 5 * TAU + R() * 0.5, l = sz * (0.6 + R() * 0.5); e ? x.lineTo(px + Math.cos(b) * l, py + Math.sin(b) * l) : x.moveTo(px + Math.cos(b) * l, py + Math.sin(b) * l); } x.closePath(); x.fill(); x.stroke(); }
      x.fillStyle = 'rgb(112,94,74)'; x.beginPath(); for (let e = 0; e < 14; e++) { const b = e / 14 * TAU, l = 0.85 + R() * 0.25; e ? x.lineTo(cx + Math.cos(b) * rx * l, cy + Math.sin(b) * ry * l) : x.moveTo(cx + Math.cos(b) * rx * l, cy + Math.sin(b) * ry * l); } x.closePath(); x.fill();
      for (let q = 0; q < 220; q++) { x.fillStyle = R() < 0.5 ? 'rgba(150,130,104,0.7)' : 'rgba(70,58,46,0.7)'; x.fillRect(cx + (R() - 0.5) * rx * 1.6, cy + (R() - 0.5) * ry * 1.6, 3, 3); }
      x.strokeStyle = 'rgba(190,214,236,0.85)'; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, rx * 0.95, ry * 0.95, 0, R() * 3, R() * 3 + 2.4); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    return (styRoadT = { w, t });
  }
  function styRoadMat(w) { const t = STYV.road ? styRoad2(w, STYV.road) : styRoadTex(w).t; return new THREE.MeshPhongMaterial({ map: t, bumpMap: STYV.road === 'flat' ? null : t, bumpScale: 0.035, shininess: 6, specular: 0x1a1816, vertexColors: true }); }
  /* ---- three road proposals (STYV.road: 'real' worn as in the reference, 'toon' clean cartoon, 'patch' an old patched mountain road) ---- */
  function styPNoise(seed, cx, cz) {   // value noise periodic in u and v (0..1), cx x cz cells
    const r = rng(seed), g = new Float32Array(cx * cz); for (let i = 0; i < g.length; i++) g[i] = r();
    return (u, v) => { const x = u * cx, z = v * cz, xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, a = ((xi % cx) + cx) % cx, b = ((zi % cz) + cz) % cz, a1 = (a + 1) % cx, b1 = (b + 1) % cz;
      const s = xf * xf * (3 - 2 * xf), t = zf * zf * (3 - 2 * zf); return (g[b * cx + a] * (1 - s) + g[b * cx + a1] * s) * (1 - t) + (g[b1 * cx + a] * (1 - s) + g[b1 * cx + a1] * s) * t; };
  }
  function styFbm(seed, cx, cz, oct) { const L = []; for (let k = 0; k < oct; k++) L.push(styPNoise(seed + k * 31, cx << k, cz << k)); return (u, v) => { let s = 0, a = 0.5, n = 0; for (const f of L) { s += f(u, v) * a; n += a; a *= 0.5; } return s / n; }; }
  function styRoad2(w, kind) {
    const W = 1024, H = 4096, LEN = 72, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); let R = rng(kind === 'toon' ? 515 : kind === 'patch' ? 616 : 414);
    const U = (o) => (o + w) / (2 * w) * W, V = (s) => s / LEN * H, pxm = W / (2 * w), pzm = H / LEN, cz = (cx) => Math.round(cx * LEN / (2 * w));
    const img = x.createImageData(W, H), d = img.data, sst = (a, b, t) => { t = Math.min(1, Math.max(0, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
    const big = styFbm(11, 2, cz(2), 5), wa = styFbm(12, 3, cz(3), 3), wb = styFbm(13, 3, cz(3), 3), fine = styFbm(14, 24, cz(24), 3), st = styFbm(15, 4, cz(4), 4), edgeN = styFbm(16, 6, cz(6), 3);
    for (let j = 0; j < H; j++) { const v = j / H; for (let i = 0; i < W; i++) { const u = i / W, o = (j * W + i) * 4, om = u * 2 * w - w, ed = w - Math.abs(om);
      let r, g, b;
      if (kind === 'flat') {   // After Words, painted in one colour: the surface flat, the grass creeping in along a soft wavy edge (one green)
        const fv = STYV.fv || 1, bc = fv === 1 ? [96, 94, 90] : fv === 2 ? [72, 78, 92] : [158, 142, 116], gc = fv === 1 ? [104, 156, 56] : fv === 2 ? [92, 140, 60] : [118, 156, 60];
        const edge = fv === 3 ? 0.18 + edgeN(u, v) * 0.35 : 0.3 + edgeN(u, v) * (fv === 2 ? 1.3 : 0.9);
        if (ed < edge) { r = gc[0]; g = gc[1]; b = gc[2]; } else if (ed < edge + 0.06) { r = gc[0] * 0.82; g = gc[1] * 0.82; b = gc[2] * 0.82; } else { r = bc[0]; g = bc[1]; b = bc[2]; }
      } else if (kind === 'toon') {   // flat colour, a gentle large-scale shade, dust towards the edges (tv: three versions)
        const tv = STYV.tv || 0, bc = tv === 7 ? [118, 112, 104] : tv === 1 ? [60, 67, 86] : tv === 2 || tv === 5 ? [110, 105, 100] : tv === 4 ? [132, 127, 119] : tv === 6 ? [104, 103, 102] : tv === 3 ? [90, 92, 99] : [74, 78, 88];
        const k = (0.94 + big(u, v) * 0.12) * (tv === 1 ? 1 + 0.09 * Math.exp(-om * om / 5) : 1); r = bc[0] * k; g = bc[1] * k; b = bc[2] * k;
        const du = sst(tv === 7 ? 1.6 : 1.2, 0.2, ed) * (tv === 2 ? 0.8 : tv === 7 ? 1 : 0.5), dc = tv === 7 ? [190, 162, 124] : [150, 140, 122], dk = tv === 7 ? 0.75 * sst(0.3, 0.6, edgeN(u, v) + 0.25) : 0.4; r += (dc[0] - r) * du * dk; g += (dc[1] - g) * du * dk; b += (dc[2] - b) * du * dk;
        if (tv === 3 && ed < 0.16) { r = 30; g = 30; b = 36; }
        if (tv === 3) { const tr = Math.min(Math.abs(om - 1.7), Math.abs(om + 1.7)); const hl = Math.exp(-tr * tr / 0.08) * (0.5 + 0.5 * Math.sin(v * 40 + u * 3)) * 0.12; r += 255 * hl * 0.5; g += 255 * hl * 0.5; b += 255 * hl * 0.55; }
        if ((tv === 2 || tv === 4 || tv === 5) && R() < 0.004) { r += 60; g += 58; b += 54; }
        if (tv === 5) { const ln = Math.abs(om) - w / 2, tr = Math.min(Math.abs(ln - 0.75), Math.abs(ln + 0.75)), dk = Math.exp(-tr * tr / 0.09) * 0.13; r *= 1 - dk; g *= 1 - dk; b *= 1 - dk * 0.9; const cl = Math.exp(-ln * ln / 0.12) * 0.06; r *= 1 + cl; g *= 1 + cl; b *= 1 + cl; }
        if (tv === 6 || tv === 7) { const pg = 0.006 + 0.09 * sst(1.4, 0.1, ed) * sst(0.4, 0.7, edgeN(u, v)); if (R() < pg) { const k2 = 0.8 + R() * 0.5; r = 186 * k2; g = 170 * k2; b = 140 * k2; } else if (R() < 0.005) { r -= 30; g -= 30; b -= 30; } }
      } else {
        const gr = R(), k = 0.8 + fine(u, v) * 0.32 + (gr - 0.5) * 0.24 + (gr > 0.975 ? 0.3 : 0) - (gr < 0.02 ? 0.25 : 0);
        r = (kind === 'patch' ? 92 : 86) * k; g = (kind === 'patch' ? 86 : 81) * k; b = (kind === 'patch' ? 78 : 76) * k;
        // bleached, weathered patches (blue-grey with a lighter rim where the water dried), more of them along the crown of the road
        const q = big(u + (wa(u, v) - 0.5) * 0.25, v + (wb(u, v) - 0.5) * 0.02) + 0.09 * Math.exp(-om * om / 1.6) - (kind === 'patch' ? 0.05 : 0);
        const m = sst(0.55, 0.6, q), rim = sst(0.53, 0.56, q) * (1 - sst(0.565, 0.6, q));
        const pc = 0.55 + fine(u * 1.7, v * 1.7) * 0.5; r += (146 * pc - r) * m * 0.62 + rim * 38; g += (154 * pc - g) * m * 0.62 + rim * 40; b += (166 * pc - b) * m * 0.62 + rim * 44;
        // damp brown stains
        const sd = sst(0.66, 0.74, st(u, v)); r += (64 - r) * sd * 0.5; g += (52 - g) * sd * 0.5; b += (40 - b) * sd * 0.5;
        if (kind === 'after') {   // years without traffic: moss in the dips, grass creeping in from both sides, dirt washed over it
          const mo = sst(0.56, 0.66, st(u * 1.3 + 0.3, v * 1.3)), mk = 0.75 + fine(u * 2, v * 2) * 0.5; r += (70 * mk - r) * mo * 0.85; g += (98 * mk - g) * mo * 0.85; b += (40 * mk - b) * mo * 0.85;
          const e = sst(0.25 + edgeN(u, v) * 1.9, 0, ed), gk = 0.7 + fine(u * 3, v * 3) * 0.6; r += (84 * gk - r) * e; g += (128 * gk - g) * e; b += (38 * gk - b) * e;
          r *= 0.92; g *= 0.95; b *= 0.88; }
        if (kind === 'patch') {   // the crumbling edges: dust and grit from the shoulder
          const e = sst(0.25 + edgeN(u, v) * 0.9, 0, ed); r += (132 - r) * e * 0.8; g += (116 - g) * e * 0.8; b += (94 - b) * e * 0.8; }
      }
      d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255; } }
    x.putImageData(img, 0, 0);
    if (kind === 'flat') {   // crisp, faded paint; a few bold green cracks (fv 1), tufts at the edges (fv 2), faded yellow edge lines and a few leaves (fv 3)
      const fv = STYV.fv || 1, worn = styFbm(17, 4, cz(4), 3), gc = fv === 1 ? 'rgb(104,156,56)' : fv === 2 ? 'rgb(92,140,60)' : 'rgb(118,156,60)';
      const pnt = (o0, o1, s0, s1, col) => { const a = U(o0), b = U(o1); for (let s = s0; s < s1; s += 0.25) { if (worn((a + b) / 2 / W, s / LEN) < 0.4) continue; x.fillStyle = col; x.fillRect(a, V(s), b - a, V(0.25) + 1); } };
      if (fv === 1) for (let s = 0; s < LEN; s += 12) pnt(-0.09, 0.09, s, s + 4, 'rgba(238,236,228,0.62)');
      if (fv === 3) { pnt(-(w - 0.25), -(w - 0.42), 0, LEN, 'rgba(226,196,92,0.6)'); pnt(w - 0.42, w - 0.25, 0, LEN, 'rgba(226,196,92,0.6)'); }
      const gcrack = (px, py, len, ang, wd) => { x.strokeStyle = gc; x.lineWidth = wd; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(px, py); for (let q = 0; q < len; q++) { ang += (R() - 0.5) * 0.5; px += Math.cos(ang) * 9; py += Math.sin(ang) * 10; x.lineTo(px, py); } x.stroke(); };
      if (fv === 1) for (let k = 0; k < 9; k++) gcrack(R() * W, R() * H, 8 + R() * 14, R() * TAU, 9);
      if (fv === 2) for (let k = 0; k < 70; k++) { const sd = R() < 0.5 ? -1 : 1, px = U(sd * (w - 0.9 - R() * 0.6)), py = R() * H; x.fillStyle = gc; x.beginPath(); for (let e = 0; e < 3; e++) { const a = -Math.PI / 2 + (e - 1) * 0.5; x.moveTo(px + (e - 1) * 6, py + 10); x.lineTo(px + Math.cos(a) * 22 + (e - 1) * 4, py + Math.sin(a) * 26); x.lineTo(px + (e - 1) * 6 + 7, py + 10); } x.fill(); }
      if (fv === 3) for (let k = 0; k < 40; k++) { const sd = R() < 0.5 ? -1 : 1, px = U(sd * (w - 0.5 - Math.pow(R(), 2) * 2.5)), py = R() * H; x.fillStyle = ['rgb(214,128,48)', 'rgb(196,92,40)', 'rgb(222,176,64)'][Math.floor(R() * 3)]; x.beginPath(); x.ellipse(px, py, 7, 4, R() * 3, 0, TAU); x.fill(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
    }
    // the lines
    const worn = styFbm(17, 4, cz(4), 3);
    const paint = (o0, o1, s0, s1, col, wear) => { const a = U(o0), b = U(o1); for (let s = s0; s < s1; s += 0.04) { const k = worn((a + b) / 2 / W, s / LEN); if (wear && k < wear) continue; const al = kind === 'toon' ? 1 : Math.min(1, 0.55 + (k - (wear || 0)) * 2.5);
        x.fillStyle = `rgba(${col},${al.toFixed(2)})`; x.fillRect(a + (kind === 'toon' ? 0 : (R() - 0.5) * 1.5), V(s), b - a, V(0.05) + 1); }
      if (kind !== 'toon') for (let q = 0; q < (s1 - s0) * 8; q++) { x.fillStyle = 'rgba(70,64,58,0.5)'; x.fillRect(a + R() * (b - a), V(s0 + R() * (s1 - s0)), 1 + R() * 3, 1 + R() * 4); } };
    const tvv = STYV.tv || 0, yel = kind === 'toon' ? (tvv === 2 || tvv >= 4 ? '248,248,244' : '250,206,60') : kind === 'after' ? '196,176,104' : '232,200,96', wear = kind === 'patch' ? 0.42 : kind === 'real' ? 0.3 : kind === 'after' ? 0.55 : 0;
    const ei = kind === 'toon' && tvv === 3 ? 0.3 : 0.22, ew = kind === 'toon' && tvv === 1 ? 0.26 : 0.2;
    if (kind === 'toon' && tvv === 5) { x.fillStyle = 'rgb(40,38,36)'; x.fillRect(U(-(w - ei)) - 4, 0, U(-(w - ei - ew)) - U(-(w - ei)) + 8, H); x.fillRect(U(w - ei - ew) - 4, 0, U(w - ei) - U(w - ei - ew) + 8, H); for (let s = 0; s < LEN; s += 12) x.fillRect(U(-0.08) - 4, V(s) - 4, U(0.08) - U(-0.08) + 8, V(4) + 8); } paint(-(w - ei), -(w - ei - ew), 0, LEN, yel, wear); paint(w - ei - ew, w - ei, 0, LEN, yel, wear);
    for (let s = 0; s < LEN; s += 12) paint(-0.08, 0.08, s, s + 4, kind === 'toon' && tvv === 6 && (s / 12) % 3 === 1 ? '238,236,228' : kind === 'toon' ? '250,250,246' : kind === 'after' ? '196,194,182' : '232,230,222', kind === 'patch' ? 0.5 : kind === 'real' ? 0.25 : kind === 'after' ? 0.55 : 0);
    // repairs: rectangles of newer asphalt (many on the old mountain road, overlapping), their seams sealed in black
    const nRep = kind === 'patch' ? 16 : kind === 'real' ? 5 : kind === 'after' ? 3 : 4;
    for (let k = 0; k < nRep; k++) { const o = (R() - 0.5) * 2 * (w - 1.2), s = R() * (LEN - 5), pw = (0.6 + R() * (kind === 'patch' ? 2.4 : 1.2)) * pxm, ph = (0.7 + R() * (kind === 'patch' ? 4 : 1.8)) * pzm, tone = kind === 'patch' ? 0.55 + R() * 0.55 : 0.6;
      x.save(); x.translate(U(o), V(s)); x.rotate((R() - 0.5) * 0.06);
      if (kind === 'toon') { const tv = STYV.tv || 0; x.fillStyle = tv === 7 ? 'rgb(100,95,88)' : tv === 1 ? 'rgb(48,54,72)' : tv === 4 ? 'rgb(112,106,100)' : tv === 5 ? 'rgb(92,88,84)' : tv === 6 ? 'rgb(120,118,114)' : tv === 2 ? 'rgb(128,122,115)' : tv === 3 ? 'rgb(76,78,86)' : 'rgb(58,61,70)'; x.beginPath(); x.roundRect(-pw / 2, -ph / 2, pw, ph, 10); x.fill();
        x.strokeStyle = tv === 2 || tv >= 4 ? 'rgba(60,54,50,0.95)' : tv === 3 ? 'rgba(20,20,24,1)' : 'rgba(120,124,136,0.9)'; x.lineWidth = tv === 3 ? 5 : 3; x.stroke();
        if (tv === 3) { x.save(); x.clip(); x.strokeStyle = 'rgba(20,20,24,0.5)'; x.lineWidth = 2; for (let h = -ph; h < pw + ph; h += 12) { x.beginPath(); x.moveTo(-pw / 2 + h, -ph / 2); x.lineTo(-pw / 2 + h - ph, ph / 2); x.stroke(); } x.restore(); }
        x.restore(); continue; }
      x.fillStyle = `rgba(${Math.round(70 * tone)},${Math.round(64 * tone)},${Math.round(58 * tone)},0.94)`; x.beginPath();
      const pts = [[-pw / 2, -ph / 2], [pw / 2, -ph / 2], [pw / 2, ph / 2], [-pw / 2, ph / 2]].map(([a, b]) => [a + (R() - 0.5) * 8, b + (R() - 0.5) * 8]); pts.forEach(([a, b], q) => q ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill();
      for (let q = 0; q < pw * ph / 60; q++) { x.fillStyle = R() < 0.5 ? 'rgba(120,112,104,0.35)' : 'rgba(18,16,14,0.35)'; x.fillRect(-pw / 2 + R() * pw, -ph / 2 + R() * ph, 2, 2); }
      x.strokeStyle = 'rgba(14,12,11,0.92)'; x.lineWidth = kind === 'patch' ? 5 : 3; x.stroke(); x.strokeStyle = 'rgba(160,156,150,0.18)'; x.lineWidth = 1; x.stroke(); x.restore(); }
    // cracks: wandering, branching (toon: few, bold, with a light lip); the old road: long black bands of crack sealant
    const crack = (px, py, len, ang, wd, col) => { x.strokeStyle = col; x.lineWidth = wd; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(px, py); const pts = [[px, py]];
      for (let q = 0; q < len; q++) { ang += (R() - 0.5) * 0.8; px += Math.cos(ang) * 6; py += Math.sin(ang) * 7; x.lineTo(px, py); pts.push([px, py]); } x.stroke();
      if (wd > 1.2 && len > 8) for (let q = 0; q < 2; q++) { const p = pts[Math.floor(R() * pts.length)]; crack(p[0], p[1], len * 0.35, ang + (R() < 0.5 ? 1.2 : -1.2), wd * 0.6, col); } return pts; };
    if (kind === 'toon') { const tv = STYV.tv || 0; for (let k = 0; k < 10; k++) { const px = U((R() - 0.5) * 2 * (w - 1)), py = R() * H, ln = 6 + R() * 6, an = R() * TAU, sd = Math.floor(R() * 1e6);
      const draw = (wd, col, dy) => { const keep = R; let st = sd; R = () => { st = (st * 16807) % 2147483647; return st / 2147483647; }; x.save(); x.translate(0, dy); crack(px, py, ln, an, wd, col); x.restore(); R = keep; };
      if (tv === 4 && k > 5) continue; const warm = tv === 2 || tv >= 4;
      if (tv !== 3) draw(tv === 4 ? 4 : 5, warm ? 'rgba(170,164,156,0.9)' : 'rgba(150,154,166,0.8)', 2); draw(tv === 3 ? 6 : tv === 4 ? 3 : 4, warm ? 'rgba(52,44,40,0.95)' : 'rgba(30,32,40,0.95)', 0); }
      if (tv === 5) for (let k = 0; k < 40; k++) { const px = U((R() < 0.5 ? -1 : 1) * w / 2 + (R() - 0.5) * 0.5), py = R() * H; x.fillStyle = 'rgba(40,36,34,0.35)'; x.beginPath(); x.ellipse(px, py, 4 + R() * 8, 6 + R() * 12, 0, 0, TAU); x.fill(); } }
    else if (kind === 'after') {   // the cracks gone green: weeds and grass along them, dead leaves blown into drifts
      for (let k = 0; k < 60; k++) { const px = R() * W, py = R() * H, ln = 8 + R() * 30, an = R() * TAU, s0 = R; const st0 = R(); 
        const save = [px, py]; crack(px, py, ln, an, 5 + R() * 3, 'rgba(78,128,36,0.85)'); }
      for (let k = 0; k < 40; k++) crack(R() * W, R() * H, 8 + R() * 22, R() * TAU, 1.6, 'rgba(24,20,16,0.8)');
      for (let k = 0; k < 5; k++) crack(U((R() - 0.5) * 0.5), R() * H, 60, Math.PI / 2, 6, 'rgba(84,134,40,0.85)');
      for (let k = 0; k < 4200; k++) { const ed = R() < 0.6, o = ed ? (R() < 0.5 ? -1 : 1) * (w - Math.pow(R(), 2) * 2.2) : (R() - 0.5) * 2 * w, px = U(o), py = R() * H, cc = [[150, 92, 40], [176, 128, 46], [112, 74, 38], [196, 160, 70], [96, 110, 40]][Math.floor(R() * 5)];
        x.fillStyle = `rgba(${cc},${(0.6 + R() * 0.4).toFixed(2)})`; x.beginPath(); x.ellipse(px, py, 2 + R() * 4, 1.5 + R() * 3, R() * 3, 0, TAU); x.fill(); } }
    else { for (let k = 0; k < (kind === 'patch' ? 30 : 40); k++) crack(R() * W, R() * H, 8 + R() * 26, R() * TAU, 1.4 + R() * 1.2, 'rgba(20,17,15,0.85)');
      if (kind === 'patch') for (let k = 0; k < 9; k++) crack(R() * W, R() * H, 30 + R() * 50, R() < 0.5 ? Math.PI / 2 : R() * TAU, 7 + R() * 4, 'rgba(10,9,9,0.88)');
      for (let k = 0; k < 4; k++) crack(U((R() - 0.5) * 0.5), R() * H, 50, Math.PI / 2, 2.2, 'rgba(20,17,15,0.85)'); }
    // potholes
    const nPot = kind === 'toon' ? 2 : kind === 'patch' ? 3 : kind === 'after' ? 6 : 4;
    for (let k = 0; k < nPot; k++) { const o = (R() < 0.5 ? -1 : 1) * (0.9 + R() * (w - 2.4)), s = 5 + R() * (LEN - 10), cx = U(o), cy = V(s), rx = (0.4 + R() * 0.35) * pxm, ry = (0.5 + R() * 0.5) * pzm, sh = styPNoise(700 + k, 12, 1);
      const rad = (a) => 0.8 + sh(a / TAU, 0.5) * 0.45;
      if (kind === 'toon') { x.fillStyle = 'rgb(40,40,48)'; x.beginPath(); for (let e = 0; e <= 24; e++) { const a = e / 24 * TAU, l = rad(a); e ? x.lineTo(cx + Math.cos(a) * rx * l, cy + Math.sin(a) * ry * l) : x.moveTo(cx + Math.cos(a) * rx * l, cy + Math.sin(a) * ry * l); } x.fill();
        x.strokeStyle = 'rgb(130,134,146)'; x.lineWidth = 4; x.stroke(); x.fillStyle = 'rgb(92,80,66)'; x.beginPath(); x.ellipse(cx + 3, cy + 5, rx * 0.55, ry * 0.5, 0, 0, TAU); x.fill(); continue; }
      // alligator cracks round it (Voronoi plates in a ring), then the hole: brown grit, a dark rim on the sunny side, water glinting
      const bx0 = Math.floor(cx - rx * 2), by0 = Math.floor(cy - ry * 2), bw = Math.ceil(rx * 4), bh = Math.ceil(ry * 4), id = x.getImageData(bx0, by0, bw, bh), dd = id.data, P = [];
      for (let q = 0; q < 46; q++) { const a = R() * TAU, l = 0.6 + R() * 1.4; P.push([cx + Math.cos(a) * rx * l - bx0, cy + Math.sin(a) * ry * l - by0, 0.75 + R() * 0.35]); }
      for (let jj = 0; jj < bh; jj++) for (let ii = 0; ii < bw; ii++) { const dx = (ii + bx0 - cx) / rx, dy = (jj + by0 - cy) / ry, rr = Math.hypot(dx, dy), a = Math.atan2(dy, dx), l = rad(a), q = (jj * bw + ii) * 4;
        if (rr < l) { const t = rr / l, gr2 = R(); let k2 = (0.75 + gr2 * 0.5) * (t > 0.82 ? 0.55 + (dy > 0 ? 0.25 : 0) : 1); dd[q] = 116 * k2; dd[q + 1] = 98 * k2; dd[q + 2] = 78 * k2;
          if (kind === 'after' && t < 0.8 && sh((a + 2) / TAU, 0.7) > 0.4) { dd[q] = 70 * k2; dd[q + 1] = 120 * k2; dd[q + 2] = 34 * k2; }
          if (t < 0.55 && sh((a + 1) / TAU, 0.2) > 0.55) { dd[q] = dd[q] * 0.5 + 70; dd[q + 1] = dd[q + 1] * 0.5 + 84; dd[q + 2] = dd[q + 2] * 0.5 + 104; } continue; }
        if (rr > l * 1.9) continue;
        let d1 = 1e9, d2 = 1e9, c1 = 1; for (const p of P) { const e = Math.hypot(ii - p[0], jj - p[1]); if (e < d1) { d2 = d1; d1 = e; c1 = p[2]; } else if (e < d2) d2 = e; }
        const fade = sst(l * 1.9, l * 1.2, rr);
        if (d2 - d1 < 2.2) { dd[q] = dd[q] * (1 - 0.85 * fade) + 12 * fade; dd[q + 1] = dd[q + 1] * (1 - 0.85 * fade) + 10 * fade; dd[q + 2] = dd[q + 2] * (1 - 0.85 * fade) + 9 * fade; }
        else { const k3 = 1 + (c1 - 1) * fade - 0.12 * fade; dd[q] *= k3; dd[q + 1] *= k3; dd[q + 2] *= k3; } }
      x.putImageData(id, bx0, by0);
      x.strokeStyle = 'rgba(205,224,240,0.8)'; x.lineWidth = 2; x.beginPath(); x.ellipse(cx, cy, rx * 0.85, ry * 0.85, 0, 0.3 + R(), 1.6 + R()); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  }

  /* ---- what happens when a car drives over a bush or a stone (presentation): phase 0 before, 1 the moment of the hit, 2 after ---- */
  function styCrashFx(px, py, pz, hd, kind, phase, seed) {
    STYV = window.__STY; const R = rng(seed || 77), C = styPal(), g = new GB(), grp = new THREE.Group(), fx = Math.sin(hd), fz = Math.cos(hd);
    const tx = T.tx ? null : null; const fw = (d, side) => [px + Math.cos(hd) * 0 + d * dirX + side * nX, pz + d * dirZ + side * nZ];
    var dirX, dirZ, nX, nZ;
    { const i = T.nearestIdx(px, pz); dirX = T.tx[i]; dirZ = T.tz[i]; nX = T.nx[i]; nZ = T.nz[i]; }
    const leafC = [C.bush, sMul(C.bush, 1.25), [0.62, 0.8, 0.1], [0.18, 0.5, 0.06]], up = [0, 1, 0];
    const leaf = (x, y, z, s, col, a, t) => { const ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(t), st = Math.sin(t), P = (u, v) => [x + (ca * u - sa * v * ct) * s, y + v * st * s, z + (sa * u + ca * v * ct) * s];
      const n = [-sa * st, ct, ca * st]; sTri(g, P(-0.5, 0), P(0, 0.35), P(0.5, 0), n, n, n, sMul(col, 0.85), col, sMul(col, 1.1)); sTri(g, P(-0.5, 0), P(0.5, 0), P(0, -0.35), n, n, n, sMul(col, 0.85), sMul(col, 1.1), col);
      sTri(g, P(-0.5, 0), P(0.5, 0), P(0, 0.35), [-n[0], -n[1], -n[2]], [-n[0], -n[1], -n[2]], [-n[0], -n[1], -n[2]], sMul(col, 0.7), sMul(col, 0.8), col); };
    if (kind === 'bush') {
      if (phase === 0) styBush(g, px, py, pz, 1.4, R, null, true);
      else if (phase === 1) {   // squashed under the bumper and bent forward, a burst of leaves, twigs and berries
        for (let k = 0; k < 3; k++) { const [x, z] = fw(0.6 + k * 0.5, (R() - 0.5) * 1.2); sLathe(g, sXf(x, 0, z, hd, 1, 1, 1, 0), sSph(1.2 - k * 0.2, 0.45, py + 0.35, 5, vary(C.bush, R, 0.15), 0.7, 1.1, 0.6), 8, R() * TAU); }
        for (let k = 0; k < 170; k++) { const d = (R() - 0.2) * 6, sd = (R() - 0.5) * 5, [x, z] = fw(d, sd), y = py + 0.3 + Math.pow(R(), 0.7) * 3.2 * (1 - Math.abs(sd) / 5); leaf(x, y, z, 0.28 + R() * 0.2, leafC[Math.floor(R() * 4)], R() * TAU, R() * 3); }
        for (let k = 0; k < 10; k++) { const [x, z] = fw(R() * 4, (R() - 0.5) * 3); sLathe(g, sXf(x, py + 0.5 + R() * 2, z, R() * TAU, 1, 1, 1, R() * 3), [[0.03, -0.35, C.trunk], [0.02, 0.35, C.trunk]], 4, 0); }
        for (let k = 0; k < 14; k++) { const [x, z] = fw(R() * 5 - 1, (R() - 0.5) * 3.5); sLathe(g, sXf(x, 0, z), sSph(0.08, 0.08, py + 0.4 + R() * 2.2, 3, C.berry, 0.9, 1.15), 5, 0); }
      } else {   // flattened: low crushed clumps, broken twigs, the leaves strewn along the car's way, green smears where the tyres went through
        for (let k = 0; k < 4; k++) { const [x, z] = fw((R() - 0.3) * 1.6, (R() - 0.5) * 2.2); sLathe(g, sXf(x, 0, z, R() * TAU, 1.3, 1, 0.8), sSph(0.55 + R() * 0.35, 0.18, py + 0.12, 4, vary(sMul(C.bush, 0.85), R, 0.15), 0.7, 1.05, 0.6), 7, R() * TAU); }
        for (let k = 0; k < 160; k++) { const d = Math.pow(R(), 1.5) * 12 - 1, sd = (R() - 0.5) * (2.5 + d * 0.25), [x, z] = fw(d, sd); leaf(x, py + 0.03 + R() * 0.03, z, 0.25 + R() * 0.2, leafC[Math.floor(R() * 4)], R() * TAU, 0.05); }
        for (let k = 0; k < 9; k++) { const [x, z] = fw(R() * 5 - 1, (R() - 0.5) * 2.5); sLathe(g, sXf(x, py + 0.05, z, R() * TAU, 1, 1, 1, Math.PI / 2), [[0.03, -0.4, C.trunk], [0.02, 0.4, C.trunk]], 4, 0); }
        for (const sd of [-0.8, 0.8]) for (let k = 0; k < 10; k++) { const [x, z] = fw(1 + k * 0.9, sd + (R() - 0.5) * 0.1), c = sMul([0.25, 0.5, 0.08], 0.9 - k * 0.05); leaf(x, py + 0.025, z, 0.5, c, Math.atan2(dirZ, dirX), 0); }
      }
    } else if (kind === 'bush3') {   // three bushes across the lane at once
      const offs = [-1.3, 0.1, 1.4];
      if (phase === 0) offs.forEach((o, k) => { const [x, z] = fw(k * 0.7, o); styBush(g, x, py, z, 1.1 + R() * 0.3, R, vary(C.bush, R, 0.15), k !== 1); });
      else if (phase === 1) {
        offs.forEach((o, k) => { const [x, z] = fw(0.9 + k * 0.4, o * 1.15); sLathe(g, sXf(x, 0, z, hd, 1.1, 1, 0.8), sSph(0.9, 0.35, py + 0.28, 5, vary(C.bush, R, 0.15), 0.7, 1.1, 0.6), 8, R() * TAU); });
        for (let k = 0; k < 420; k++) { const d = (R() - 0.25) * 7, sd = (R() - 0.5) * 7, [x, z] = fw(d, sd), y = py + 0.3 + Math.pow(R(), 0.7) * 3.6 * (1 - Math.abs(sd) / 7); leaf(x, y, z, 0.28 + R() * 0.22, leafC[Math.floor(R() * 4)], R() * TAU, R() * 3); }
        for (let k = 0; k < 24; k++) { const [x, z] = fw(R() * 5, (R() - 0.5) * 5); sLathe(g, sXf(x, py + 0.5 + R() * 2.4, z, R() * TAU, 1, 1, 1, R() * 3), [[0.03, -0.35, C.trunk], [0.02, 0.35, C.trunk]], 4, 0); }
        for (let k = 0; k < 30; k++) { const [x, z] = fw(R() * 6 - 1, (R() - 0.5) * 5); sLathe(g, sXf(x, 0, z), sSph(0.08, 0.08, py + 0.4 + R() * 2.4, 3, C.berry, 0.9, 1.15), 5, 0); }
      } else {
        offs.forEach((o, k) => { for (let q = 0; q < 3; q++) { const [x, z] = fw(k * 0.6 + (R() - 0.3) * 1.4, o + (R() - 0.5) * 1.2); sLathe(g, sXf(x, 0, z, R() * TAU, 1.3, 1, 0.8), sSph(0.45 + R() * 0.3, 0.16, py + 0.1, 4, vary(sMul(C.bush, 0.85), R, 0.15), 0.7, 1.05, 0.6), 7, R() * TAU); } });
        for (let k = 0; k < 380; k++) { const d = Math.pow(R(), 1.4) * 15 - 1, sd = (R() - 0.5) * (4.5 + d * 0.25), [x, z] = fw(d, sd); leaf(x, py + 0.03 + R() * 0.03, z, 0.25 + R() * 0.2, leafC[Math.floor(R() * 4)], R() * TAU, 0.05); }
        for (let k = 0; k < 20; k++) { const [x, z] = fw(R() * 6 - 1, (R() - 0.5) * 4.5); sLathe(g, sXf(x, py + 0.05, z, R() * TAU, 1, 1, 1, Math.PI / 2), [[0.03, -0.4, C.trunk], [0.02, 0.4, C.trunk]], 4, 0); }
      }
    } else if (kind === 'stone3') {   // three ways a stone breaks (v: 1 a few big chunks, 2 crumbles to grit, 3 splits in two); phase 1 the hit, 2 the car driving on over the pieces
      const stoneC = C.rock, v = seed % 10, dustM = (o) => new THREE.MeshLambertMaterial({ color: 0xd8d2c4, transparent: true, opacity: o, depthWrite: false });
      const puff = (n, d0, d1, sd, rr, op) => { const dm = dustM(op); for (let k = 0; k < n; k++) { const [x, z] = fw(d0 + R() * (d1 - d0), (R() - 0.5) * sd), r0 = rr * (0.6 + R() * 0.8), m = new THREE.Mesh(new THREE.SphereGeometry(r0, 10, 8), dm); m.position.set(x, py + r0 * 0.6, z); m.scale.y = 0.65; grp.add(m); } };
      const sparks = (n) => { const spk = new THREE.MeshBasicMaterial({ color: 0xffd04a }); for (let k = 0; k < n; k++) { const [x, z] = fw(R() * 1.6 - 0.2, (R() - 0.5) * 2), m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.3 + R() * 0.4), spk); m.position.set(x, py + 0.15 + R() * 0.9, z); m.rotation.set(R() * 3, R() * 3, R() * 3); grp.add(m); } };
      const chip = (n, d0, d1, sd, q0, q1, air) => { for (let k = 0; k < n; k++) { const [x, z] = fw(d0 + R() * (d1 - d0), (R() - 0.5) * sd), q = q0 + R() * (q1 - q0); styStone(g, x, py - 0.02 + (air ? R() * air : 0), z, q, q * (0.7 + R() * 0.5), q * (0.8 + R() * 0.3), R() * TAU, vary(stoneC, R, 0.12), R, air ? 0.4 : 0); } };
      if (v === 1) {
        if (phase === 1) { [[1.4, -0.8, 0.45, 0.6], [1.9, 0.7, 0.4, 0.4], [0.9, 1.2, 0.35, 0.8], [2.6, 0.1, 0.3, 0.3]].forEach(([d, sd, q, h]) => { const [x, z] = fw(d, sd); styStone(g, x, py + h, z, q, q * 1.1, q * 0.9, R() * TAU, vary(stoneC, R, 0.08), R, 0.5); }); chip(14, 0, 2.5, 2.5, 0.05, 0.12, 1.2); puff(5, 0, 1.8, 2, 0.5, 0.3); }
        else { [[4.5, -1.9, 0.45], [5.2, 1.8, 0.4], [3.4, 2.4, 0.35], [6.5, 0.4, 0.3]].forEach(([d, sd, q]) => { const [x, z] = fw(d, sd); styStone(g, x, py - q * 0.15, z, q, q * 0.9, q * 0.9, R() * TAU, vary(stoneC, R, 0.08), R, 0.4); }); chip(16, -3, 4, 3, 0.05, 0.12, 0); puff(3, -3.5, -1.5, 2, 0.5, 0.18); }
      } else if (v === 2) {
        if (phase === 1) { chip(80, -0.3, 3.2, 3.2, 0.04, 0.1, 1.4); puff(12, -0.3, 2.6, 3.2, 0.7, 0.36); }
        else { chip(120, -4, 5, 3.6, 0.04, 0.09, 0); puff(7, -5, -1, 2.4, 0.6, 0.26); }
      } else {
        if (phase === 1) { for (const sd of [-1, 1]) { const [x, z] = fw(1.0, sd * 0.75); styStone(g, x, py + 0.15, z, 0.5, 0.85, 0.32, hd + sd * 0.4, vary(stoneC, R, 0.06), R, 0.2); } sparks(26); chip(10, 0.3, 1.8, 1.4, 0.05, 0.1, 0.9); puff(4, 0.2, 1.6, 1.4, 0.45, 0.25); }
        else { for (const sd of [-1, 1]) { const [x, z] = fw(0.6, sd * 2.0); styStone(g, x, py - 0.08, z, 0.5, 0.8, 0.32, hd + sd * 0.9, vary(stoneC, R, 0.06), R, 0.2); } chip(14, -3, 2, 2.2, 0.05, 0.1, 0); }
      }
    } else if (kind === 'stone2') {   // a stone the car just drives over: it rocks and is shoved on a little, a puff of grit, the car slowed a touch
      const stoneC = C.rock;
      if (phase === 1) { const [x, z] = fw(0.9, 1.0); styStone(g, x, py - 0.12, z, 0.75, 0.75, 0.65, 0.4, stoneC, R, 0.3);
        for (let k = 0; k < 18; k++) { const [x2, z2] = fw(R() * 1.5 - 0.5, (R() - 0.5) * 1.6); styStone(g, x2, py + R() * 0.5, z2, 0.05 + R() * 0.05, 0.06, 0.05, R() * TAU, vary(stoneC, R, 0.15), R, 0); }
        const dust = new THREE.MeshLambertMaterial({ color: 0xd8d2c4, transparent: true, opacity: 0.28, depthWrite: false });
        for (let k = 0; k < 5; k++) { const [x2, z2] = fw(-0.5 - R() * 1.5, (R() - 0.5) * 1.8), r0 = 0.35 + R() * 0.4, m = new THREE.Mesh(new THREE.SphereGeometry(r0, 10, 8), dust); m.position.set(x2, py + r0 * 0.6, z2); m.scale.y = 0.6; grp.add(m); }
      } else { const [x, z] = fw(2.2, 1.1); styStone(g, x, py - 0.12, z, 0.75, 0.75, 0.65, 1.3, stoneC, R, 0.3);
        for (let k = 0; k < 4; k++) { const [x0, z0] = fw(0.2 + k * 0.08, -0.25 + k * 0.15), [x1, z1] = fw(2.0, 0.6 + k * 0.15), cc = [0.8, 0.78, 0.74]; sTri(g, [x0, py + 0.025, z0], [x1, py + 0.025, z1], [x1 + 0.05, py + 0.025, z1 + 0.05], up, up, up, cc, cc, cc); }
        for (let k = 0; k < 12; k++) { const [x2, z2] = fw(R() * 3, (R() - 0.5) * 2); styStone(g, x2, py - 0.02, z2, 0.04 + R() * 0.05, 0.05, 0.05, R() * TAU, vary(stoneC, R, 0.15), R, 0); } }
    } else {
      const stoneC = C.rock;
      if (phase === 0) styStone(g, px, py - 0.1, pz, 0.8, 0.9, 0.7, R() * TAU, stoneC, R, 0.3);
      else if (phase === 1) {   // the stone bursts into faceted chunks, grit and sparks fly, a cloud of dust
        for (let k = 0; k < 11; k++) { const a = (R() - 0.5) * 2.4, d = 0.5 + R() * 3, [x, z] = fw(Math.cos(a) * d + 0.8, Math.sin(a) * d * 1.3), q = 0.18 + R() * 0.3, y = py + 0.3 + R() * 2.4;
          styStone(g, x, y, z, q, q * (0.8 + R() * 0.6), q * (0.7 + R() * 0.4), R() * TAU, vary(stoneC, R, 0.1), R, 0.6); }
        for (let k = 0; k < 40; k++) { const [x, z] = fw(R() * 4 - 0.5, (R() - 0.5) * 3.5); styStone(g, x, py + R() * 1.6, z, 0.05 + R() * 0.06, 0.06, 0.05, R() * TAU, vary(stoneC, R, 0.15), R, 0); }
        const dust = new THREE.MeshLambertMaterial({ color: 0xd8d2c4, transparent: true, opacity: 0.38, depthWrite: false });
        for (let k = 0; k < 14; k++) { const [x, z] = fw(R() * 2.5 - 0.3, (R() - 0.5) * 3), r0 = 0.5 + R() * 0.9, m = new THREE.Mesh(new THREE.SphereGeometry(r0, 10, 8), dust); m.position.set(x, py + r0 * 0.7 + R() * 0.8, z); m.scale.y = 0.75; grp.add(m); }
        const spk = new THREE.MeshBasicMaterial({ color: 0xffd04a });
        for (let k = 0; k < 22; k++) { const [x, z] = fw(R() * 2 - 0.4, (R() - 0.5) * 2.4), m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.3 + R() * 0.4), spk); m.position.set(x, py + 0.2 + R() * 1.2, z); m.rotation.set(R() * 3, R() * 3, R() * 3); grp.add(m); }
      } else {   // the chunks lie strewn over the road and the verge, a pale scar where the stone stood, scuffs where the car went over, a last haze of dust
        for (let k = 0; k < 10; k++) { const a = (R() - 0.5) * 2.2, d = 0.8 + Math.pow(R(), 0.8) * 6, [x, z] = fw(Math.cos(a) * d, Math.sin(a) * d * 1.2), q = 0.16 + R() * 0.28;
          styStone(g, x, py - q * 0.15, z, q, q * (0.6 + R() * 0.4), q * (0.7 + R() * 0.4), R() * TAU, vary(stoneC, R, 0.1), R, 0.3); }
        for (let k = 0; k < 60; k++) { const [x, z] = fw(Math.pow(R(), 1.3) * 8 - 0.5, (R() - 0.5) * 3.2); styStone(g, x, py - 0.02, z, 0.05 + R() * 0.07, 0.07, 0.06, R() * TAU, vary(stoneC, R, 0.15), R, 0); }
        const [sx, sz] = fw(0, 0); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, b = (k + 1) / 12 * TAU, c0 = [0.72, 0.68, 0.6]; sTri(g, [sx, py + 0.022, sz], [sx + Math.cos(a) * 0.9, py + 0.022, sz + Math.sin(a) * 0.75], [sx + Math.cos(b) * 0.9, py + 0.022, sz + Math.sin(b) * 0.75], up, up, up, c0, sMul(c0, 0.8), sMul(c0, 0.8)); }
        for (const sd of [-0.75, 0.75]) for (let k = 0; k < 7; k++) { const [x0, z0] = fw(0.5 + k * 1.1, sd), [x1, z1] = fw(1.5 + k * 1.1, sd + 0.05), w2 = 0.12, cc = [0.82, 0.8, 0.76]; sTri(g, [x0 - nX * w2, py + 0.024, z0 - nZ * w2], [x1 - nX * w2, py + 0.024, z1 - nZ * w2], [x1 + nX * w2, py + 0.024, z1 + nZ * w2], up, up, up, cc, cc, cc); sTri(g, [x0 - nX * w2, py + 0.024, z0 - nZ * w2], [x1 + nX * w2, py + 0.024, z1 + nZ * w2], [x0 + nX * w2, py + 0.024, z0 + nZ * w2], up, up, up, cc, cc, cc); }
        const dust = new THREE.MeshLambertMaterial({ color: 0xd8d2c4, transparent: true, opacity: 0.16, depthWrite: false });
        for (let k = 0; k < 6; k++) { const [x, z] = fw(R() * 4, (R() - 0.5) * 3), r0 = 0.9 + R() * 1.1, m = new THREE.Mesh(new THREE.SphereGeometry(r0, 10, 8), dust); m.position.set(x, py + r0 * 0.5, z); m.scale.y = 0.5; grp.add(m); }
      }
    }
    const m = new THREE.Mesh(g.geometry(), new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x000000, shininess: 2 })); m.castShadow = true; m.receiveShadow = true; grp.add(m);
    return grp;
  }

  /* ---- After Words in any world (the cities): everything taken back by plants. A height picture from above finds the roofs and the walls;
     the roofs vanish under soft green mounds and trees, green curtains hang down the walls, trees, bushes, cacti and grass fill the ground
     between, the road is the old overgrown road; every material of the world turns green-grey ---- */
  function styCactus(g, x, y, z, s, R) {
    const col = [0.26, 0.6, 0.22], dk = sMul(col, 0.7), k = R();
    if (k < 0.45) {   // a saguaro: a ribbed column with one or two arms bent up
      const h = s * (2.2 + R() * 1.4), r = s * 0.28, rib = (rr, hh) => [[rr * 0.9, 0, dk], [rr, hh * 0.1, col], [rr, hh * 0.85, sMul(col, 1.08)], [rr * 0.7, hh * 0.97, sMul(col, 1.12)], [0, hh, sMul(col, 1.15)]];
      sLathe(g, sXf(x, y, z), rib(r, h), 8, 0);
      for (let a = 0; a < 1 + Math.floor(R() * 2); a++) { const an = R() * TAU, hy = h * (0.35 + R() * 0.25), ca = Math.cos(an), sa = Math.sin(an), ar = r * 0.7;
        sLathe(g, sXf(x + ca * r * 1.6, y + hy, z + sa * r * 1.6, an, 1, 1, 1, -Math.PI / 2), rib(ar, r * 1.8), 6, 0);
        sLathe(g, sXf(x + ca * r * 3.2, y + hy - ar * 0.2, z + sa * r * 3.2), rib(ar, h * 0.45), 6, 0); }
    } else if (k < 0.75) {   // a barrel cactus: a ribbed ball, a crown of yellow flowers
      sLathe(g, sXf(x, 0, z), sSph(s * 0.5, s * 0.45, y + s * 0.4, 5, col, 0.75, 1.1, 0.4), 10, 0);
      for (let q = 0; q < 5; q++) { const a = q / 5 * TAU; sLathe(g, sXf(x + Math.cos(a) * s * 0.12, y + s * 0.82, z + Math.sin(a) * s * 0.12), sSph(s * 0.08, s * 0.06, 0, 2, [1, 0.8, 0.2], 0.9, 1.1), 5, 0); }
    } else {   // a prickly pear: flat pads one on another
      const pad = (px, py, pz, a, sc) => sLathe(g, sXf(px, py, pz, a, sc, sc, sc * 0.3), sSph(0.45, 0.55, 0.55, 4, vary(col, R, 0.12), 0.75, 1.12, 0), 8, 0);
      pad(x, y, z, R() * TAU, s); pad(x + s * 0.3, y + s * 0.9, z, R() * TAU, s * 0.8); pad(x - s * 0.3, y + s * 0.85, z + s * 0.1, R() * TAU, s * 0.75);
    }
  }
  let styHRR = null, styTreeCache = {};
  function styCity(o) {
    STYV = window.__STY || {}; const R = rng(o.seed || 1), C = styPal(), W = Render.world, N = o.n || 256, rad = o.r, cell = 2 * rad / N, w = T.w;
    const grp = new THREE.Group(); grp.name = 'styCity';
    // 1. the height of every place seen from above (the world without its trees and props), into a little picture
    if (!styHRR) styHRR = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
    const rr = styHRR; rr.setPixelRatio(1); rr.setSize(N, N, false);
    const rt = new THREE.WebGLRenderTarget(N, N), cam = new THREE.OrthographicCamera(-rad, rad, rad, -rad, 1, 5000); cam.position.set(o.x, 2500, o.z); cam.up.set(0, 0, -1); cam.lookAt(o.x, 0, o.z); cam.updateMatrixWorld();
    const hm = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: 'varying float vY; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'varying float vY; void main() { float h = clamp((vY + 500.0) / 3000.0, 0.0, 0.9999); vec4 e = fract(vec4(1.0, 255.0, 65025.0, 16581375.0) * h); e -= e.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0); gl_FragColor = e; }' });
    const hidden = []; W.root.traverse(q => { if ((q.isInstancedMesh || q.isPoints || q.isLine || q.name === 'crowds' || q.name === 'styCity' || (q.material && q.material.transparent)) && q.visible) { q.visible = false; hidden.push(q); } });
    const tmp = new THREE.Scene(), par = W.root.parent; tmp.overrideMaterial = hm; tmp.add(W.root); rr.setRenderTarget(rt); rr.setClearColor(0x000000, 0); rr.clear(); rr.render(tmp, cam); rr.setRenderTarget(null); par.add(W.root);
    for (const q of hidden) q.visible = true;
    const buf = new Uint8Array(N * N * 4); rr.readRenderTargetPixels(rt, 0, 0, N, N, buf); rt.dispose(); hm.dispose();
    const H = new Float32Array(N * N), right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), upv = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    for (let k = 0; k < N * N; k++) { const a = buf[k * 4] / 255, b = buf[k * 4 + 1] / 255, c = buf[k * 4 + 2] / 255, d = buf[k * 4 + 3] / 255, h = a + b / 255 + c / 65025 + d / 16581375; H[k] = h <= 0 ? NaN : h * 3000 - 500; }
    const XZ = (i, j) => { const nx = (i + 0.5) / N * 2 - 1, ny = (j + 0.5) / N * 2 - 1; return [o.x + right.x * nx * rad + upv.x * ny * rad, o.z + right.z * nx * rad + upv.z * ny * rad]; };
    // 2. the ground under it all (a broad minimum), the road (the distance to the centre line)
    const G = new Float32Array(N * N), T2 = new Float32Array(N * N), kk = Math.max(2, Math.round(16 / cell));
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let m = 1e9; for (let a = Math.max(0, i - kk); a <= Math.min(N - 1, i + kk); a++) { const h = H[j * N + a]; if (h < m) m = h; } T2[j * N + i] = m; }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let m = 1e9; for (let b = Math.max(0, j - kk); b <= Math.min(N - 1, j + kk); b++) { const h = T2[b * N + i]; if (h < m) m = h; } G[j * N + i] = m; }
    const D = new Float32Array(N * N).fill(1e9), toIJ = (x, z) => { const dx = x - o.x, dz = z - o.z; return [Math.floor(((dx * right.x + dz * right.z) / rad + 1) / 2 * N), Math.floor(((dx * upv.x + dz * upv.z) / rad + 1) / 2 * N)]; };
    const onR = [];
    for (let i = 0; i < T.N; i++) { const dx = T.px[i] - o.x, dz = T.pz[i] - o.z; if (Math.abs(dx) > rad + 20 || Math.abs(dz) > rad + 20) continue; onR.push(i);
      const [ci, cj] = toIJ(T.px[i], T.pz[i]), rc = Math.ceil((w + 6) / cell);
      for (let b = cj - rc; b <= cj + rc; b++) for (let a = ci - rc; a <= ci + rc; a++) { if (a < 0 || b < 0 || a >= N || b >= N) continue; const [x, z] = XZ(a, b), d = Math.hypot(x - T.px[i], z - T.pz[i]); if (d < D[b * N + a]) D[b * N + a] = d; } }
    // 3. the old road, overgrown, laid over the real one
    const rd = new GB(true), tex = styRoad2(w, STYV.road || 'after');
    for (let q = 0; q + 1 < onR.length; q++) { const i = onR[q], j = onR[q + 1]; if (j !== i + 1) continue;
      const hy = (k) => { const [a, b] = toIJ(T.px[k], T.pz[k]); const h = a >= 0 && b >= 0 && a < N && b < N ? H[b * N + a] : NaN; return (h === h ? h : (T.hy ? T.hy[k] : 0)) + 0.05; };
      const yi = hy(i), yj = hy(j), P = (k, of, y) => [T.px[k] + T.nx[k] * of, y, T.pz[k] + T.nz[k] * of];
      rd.quadUp(P(i, -w, yi), P(i, w, yi), P(j, w, yj), P(j, -w, yj), [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]], [[0, i * T.ds / 72], [1, i * T.ds / 72], [1, j * T.ds / 72], [0, j * T.ds / 72]]); }
    if (!rd.empty) { const m = new THREE.Mesh(rd.geometry(), new THREE.MeshPhongMaterial({ map: tex, bumpMap: tex, bumpScale: 0.03, vertexColors: true, shininess: 4, specular: 0x111111, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); m.receiveShadow = true; grp.add(m); }
    if (o.roadOnly) return grp;
    if (o.mode === 'itw') {   // the reference's look in a town: on the free ground by the road, flower pots, maquis bushes, agaves, café parasols; iron lamps along the road
      const cut = window.__styCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } }; if (STYV.cards) STY_CARDS = new Chunks(110, true);
      const ch2 = new Map(), gA = (x, z) => { const k = Math.floor(x / 60) + ',' + Math.floor(z / 60); let g = ch2.get(k); if (!g) ch2.set(k, g = new GB(true)); return g; };
      for (let j = 0; j < N; j += 2) for (let i = 0; i < N; i += 2) { const k = j * N + i, h = H[k]; if (!(h === h)) continue; const rel = h - G[k], d = D[k]; if (rel > 0.7 || d < w + 1.2 || d > w + 14) continue;
        const [x, z] = XZ(i, j), g = gA(x, z), r = R();
        if (r < 0.05) styPot(g, x, h, z, 1.1 + R() * 0.4, R); else if (r < (STYV.cards ? 0.12 : 0.085)) styItwBush(g, x, h, z, 0.8 + R() * 0.7, R); else if (r < 0.095) styAgave(g, x, h, z, 0.9, R); else if (r < 0.1) styParasol(g, x, h, z, R); }
      for (let q = 0; q < onR.length; q += Math.max(1, Math.round(26 / T.ds))) { const i = onR[q]; for (const sd of [-1, 1]) { const o2 = sd * (w + 2.4), x = T.px[i] + T.nx[i] * o2, z = T.pz[i] + T.nz[i] * o2, [a, b] = toIJ(x, z);
        if (a < 0 || b < 0 || a >= N || b >= N) continue; const h = H[b * N + a]; if (!(h === h) || h - G[b * N + a] > 0.7) continue; styLamp(gA(x, z), x, h, z); } }
      const pm2 = ouCutMat(new THREE.MeshLambertMaterial({ map: styKitAtlas(), vertexColors: true }), cut);
      for (const g of ch2.values()) { if (g.empty) continue; const m = new THREE.Mesh(g.geometry(), pm2); m.castShadow = true; m.receiveShadow = true; grp.add(m); }
      if (STY_CARDS) { const cm = ouCutMat(styCardMat(), cut), dm = styCardDepth(); STY_CARDS.addTo(grp, cm, true, true); grp.traverse(o => { if (o.material === cm) o.customDepthMaterial = dm; }); STY_CARDS = null; }
      return grp;
    }
    // 4. the plants
    const ch = new Map(), gAt = (x, z) => { const k = Math.floor(x / 60) + ',' + Math.floor(z / 60); let g = ch.get(k); if (!g) ch.set(k, g = new GB()); return g; };
    const trees = {}, addTree = (k, x, y, z, s, wid, col) => { (trees[k] = trees[k] || []).push([x, y, z, R() * TAU, wid, s, col]); };
    const greens = [[0.16, 0.5, 0.08], [0.24, 0.62, 0.1], [0.1, 0.42, 0.12], [0.36, 0.6, 0.1], [0.2, 0.55, 0.16]];
    const st = o.stride || 2; let hMin = 1e9; for (let k = 0; k < N * N; k++) if (H[k] === H[k] && H[k] < hMin) hMin = H[k];
    const sea = (T.def && (T.def.sea || T.def.theme === 'monaco' || T.def.theme === 'rio' || T.def.theme === 'bangsaen')) ? hMin + 0.8 : -1e9;
    const cut = window.__styCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };
    for (let j = 0; j < N; j += st) for (let i = 0; i < N; i += st) {
      const a = Math.min(N - 1, i + Math.floor(R() * st)), b = Math.min(N - 1, j + Math.floor(R() * st)), k = b * N + a, h = H[k]; if (!(h === h)) continue;
      const [x, z] = XZ(a, b), gr = G[k], rel = h - gr, d = D[k], r = R(); if (h < sea) continue;
      if (d < w - 1.1) { if (r < 0.05 * (o.dens || 1)) styTuft(gAt(x, z), x, h + 0.04, z, 0.7 + R() * 0.5, R); continue; }
      if (d < w + 0.6) { if (r < 0.5) { if (R() < 0.45) styBush(gAt(x, z), x, h, z, 0.6 + R() * 0.7, R, vary(C.bush, R, 0.2), R() < 0.3); else styTuft(gAt(x, z), x, h + 0.04, z, 0.9 + R() * 0.7, R); } continue; }
      if (rel > 2.2) {   // a roof: a soft green mound over it, now and then a tree; a curtain of green down to the ground where the wall is
        const lt = o.light ? 0.3 : 1;
        if (r < 0.75 * lt) { const g = gAt(x, z), rr2 = (1.6 + R() * 1.4) * Math.max(1, cell * st / 2.5); sLathe(g, sXf(x, 0, z, R() * TAU, 1, 1, 1), sSph(rr2, rr2 * 0.3, h + rr2 * 0.05, 4, vary(greens[Math.floor(R() * 5)], R, 0.2), 0.7, 1.12, 0.6), 8, R() * TAU, R, 0.15); }
        else if (r < 0.85) styBush(gAt(x, z), x, h, z, 0.8 + R() * 0.8, R, vary(C.bush, R, 0.2), R() < 0.3);
        if (R() < 0.015 * lt) addTree([2, 8, 9, 0][Math.floor(R() * 4)], x, h - 0.3, z, 7 + R() * 7, 6 + R() * 5, [0.9 + R() * 0.2, 0.95 + R() * 0.1, 0.9]);
        let lo = null; for (const [da, db] of [[st * 2, 0], [-st * 2, 0], [0, st * 2], [0, -st * 2]]) { const a2 = a + da, b2 = b + db; if (a2 < 0 || b2 < 0 || a2 >= N || b2 >= N) continue; const h2 = H[b2 * N + a2]; if (h2 === h2 && h - h2 > 2.2 && (!lo || h2 < lo[2])) lo = [da, db, h2]; }
        if (lo && R() < 0.75 * lt) { const [x2, z2] = XZ(a + lo[0] / 2, b + lo[1] / 2), hh = h - lo[2], an = Math.atan2(z2 - z, x2 - x), g = gAt(x2, z2);
          sLathe(g, sXf(x2, 0, z2, an + Math.PI / 2, 1.6 + R() * 0.8, 1, 0.55), sSph(1.4, hh / 2 + 0.6, lo[2] + hh / 2, 5, vary(greens[Math.floor(R() * 5)], R, 0.2), 0.62, 1.12, 0), 9, 0, R, 0.15); }
        continue; }
      // the ground between the houses: woods and thickets
      const nearR = d < w + 12;
      if (!nearR && r < 0.08) addTree([2, 8, 9, 0, 4][Math.floor(R() * 5)], x, h - 0.15, z, 6 + R() * 7, 5 + R() * 5, [0.9 + R() * 0.2, 0.95 + R() * 0.1, 0.9]);
      else if (r < (nearR ? 0.4 : 0.38)) styBush(gAt(x, z), x, h, z, 0.8 + R() * 1.1, R, vary(C.bush, R, 0.2), R() < 0.3);
      else if (r < (nearR ? 0.58 : 0.48) && o.cacti) styCactus(gAt(x, z), x, h, z, 0.8 + R() * 0.7, R);
      else if (r < 0.66) styTuft(gAt(x, z), x, h + 0.04, z, 0.9 + R() * 0.6, R);
      else if (r < 0.72) styFlower(gAt(x, z), x, h, z, 0.9 + R() * 0.4, R);
    }
    const pm = ouCutMat(new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x000000, shininess: 2 }), cut);
    for (const g of ch.values()) { if (g.empty) continue; const m = new THREE.Mesh(g.geometry(), pm); m.castShadow = true; m.receiveShadow = true; grp.add(m); }
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3(), c4 = new THREE.Color();
    for (const k in trees) { const L = trees[k], geo = styTreeCache[k] || (styTreeCache[k] = styTreeGeo(+k)), im = new THREE.InstancedMesh(geo, pm, L.length);
      L.forEach(([x, y, z, rot, wd, s], t) => { e4.set(0, rot, 0); q4.setFromEuler(e4); v4.set(x, y, z); s4.set(wd, s, wd); m4.compose(v4, q4, s4); im.setMatrixAt(t, m4); c4.setRGB(L[t][6][0], L[t][6][1], L[t][6][2]); im.setColorAt(t, c4); });
      im.castShadow = true; im.receiveShadow = true; grp.add(im); }
    // 5. the world itself: green-grey, the crowds gone
    if (!W.__styTint) { W.__styTint = true; const seen = new Set(); W.root.traverse(q => { if (q.name === 'crowds') q.visible = false; if (!q.isMesh || q.parent && q.parent.name === 'styCity') return;
      for (const mt of Array.isArray(q.material) ? q.material : [q.material]) { if (!mt || seen.has(mt) || !mt.color) continue; seen.add(mt); mt.color.multiply(new THREE.Color(o.tint ? o.tint[0] : 0.6, o.tint ? o.tint[1] : 0.82, o.tint ? o.tint[2] : 0.5)); } }); }
    return grp;
  }
  function styTop(o) {   // the whole map from above (the world and the overlay), straight down; returns a PNG data URL
    const rr = styHRR || (styHRR = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true })); rr.setPixelRatio(1); rr.setSize(o.px, o.px, false); rr.shadowMap.enabled = false;
    const sc = Render.scene, fog = sc.fog; sc.fog = null;
    const cam = new THREE.OrthographicCamera(-o.r, o.r, o.r, -o.r, 1, 6000); cam.position.set(o.x, 3000, o.z + (o.tilt || 0)); cam.up.set(0, 0, -1); cam.lookAt(o.x, 0, o.z); cam.updateMatrixWorld();
    rr.setClearColor(0x2a4a2a, 1); rr.render(sc, cam); sc.fog = fog; return rr.domElement.toDataURL('image/png');
  }

  /* ================= road works kit, 100 years on (signs, barricades, barriers, barrels, cones, guardrail, arrow board, toilets, tyres), wooden fences
     (a palisade of sharpened logs, a three-rail fence) and a camp (thatched tepee, lean-to, fire pit, wood pile). One atlas, one material ================= */
  let styKA = null;
  function styKitAtlas() {
    if (styKA) return styKA;
    const S = 256, c = document.createElement('canvas'); c.width = c.height = 4 * S; const x = c.getContext('2d'), R = rng(8181);
    const cell = (k, f) => { const ox = (k % 4) * S, oy = Math.floor(k / 4) * S; x.save(); x.beginPath(); x.rect(ox, oy, S, S); x.clip(); x.translate(ox, oy); f(); x.restore(); };
    const age = (rust, moss, fade) => {   // fade, rust drips and peeled paint, dirt and moss at the foot
      x.fillStyle = `rgba(236,228,206,${fade})`; x.fillRect(0, 0, S, S);
      for (let k = 0; k < 14 * rust; k++) { const px = R() * S, py = R() * S * 0.6, l = 30 + R() * 120, wd = 2 + R() * 6, gd = x.createLinearGradient(0, py, 0, py + l); gd.addColorStop(0, 'rgba(120,58,22,0.75)'); gd.addColorStop(1, 'rgba(120,58,22,0)'); x.fillStyle = gd; x.fillRect(px, py, wd, l); }
      for (let k = 0; k < 9 * rust; k++) { const px = R() * S, py = R() * S, r = 6 + R() * 26; x.fillStyle = R() < 0.5 ? 'rgba(126,66,30,0.85)' : 'rgba(150,140,128,0.85)'; x.beginPath(); for (let e = 0; e < 9; e++) { const a = e / 9 * TAU, l = r * (0.5 + R() * 0.6); e ? x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l) : x.moveTo(px + Math.cos(a) * l, py + Math.sin(a) * l); } x.fill(); }
      for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(${R() < 0.5 ? '40,30,20' : '230,220,200'},${(R() * 0.18).toFixed(2)})`; x.fillRect(R() * S, R() * S, 2, 2); }
      const gd = x.createLinearGradient(0, S * 0.55, 0, S); gd.addColorStop(0, 'rgba(70,58,40,0)'); gd.addColorStop(1, 'rgba(70,58,40,0.55)'); x.fillStyle = gd; x.fillRect(0, 0, S, S);
      for (let k = 0; k < 30 * moss; k++) { const px = R() * S, py = S - Math.pow(R(), 2) * S * 0.6, r = 4 + R() * 16; x.fillStyle = `rgba(${60 + R() * 40},${110 + R() * 50},${30 + R() * 20},${0.5 + R() * 0.4})`; x.beginPath(); x.ellipse(px, py, r, r * 0.7, R() * 3, 0, TAU); x.fill(); } };
    const diamond = (sym) => { x.fillStyle = '#e5793a'; x.beginPath(); x.moveTo(S / 2, 4); x.lineTo(S - 4, S / 2); x.lineTo(S / 2, S - 4); x.lineTo(4, S / 2); x.closePath(); x.fill(); x.strokeStyle = '#1a1a1a'; x.lineWidth = 7; x.beginPath(); x.moveTo(S / 2, 16); x.lineTo(S - 16, S / 2); x.lineTo(S / 2, S - 16); x.lineTo(16, S / 2); x.closePath(); x.stroke(); x.fillStyle = '#1a1a1a'; x.strokeStyle = '#1a1a1a'; sym(); };
    const arrow = (cx, y0, y1, up) => { x.lineWidth = 14; x.beginPath(); x.moveTo(cx, y0); x.lineTo(cx, y1); x.stroke(); const t = up ? y0 : y1, d = up ? 1 : -1; x.beginPath(); x.moveTo(cx, t - d * 6); x.lineTo(cx - 20, t + d * 26); x.lineTo(cx + 20, t + d * 26); x.closePath(); x.fill(); };
    cell(0, () => { diamond(() => { arrow(104, 70, 186, true); arrow(152, 70, 186, false); }); age(1, 0.6, 0.28); });
    cell(1, () => { diamond(() => { x.beginPath(); x.arc(118, 78, 12, 0, TAU); x.fill(); x.lineWidth = 12; x.beginPath(); x.moveTo(118, 92); x.lineTo(126, 140); x.lineTo(108, 182); x.moveTo(126, 140); x.lineTo(146, 180); x.moveTo(116, 104); x.lineTo(150, 126); x.lineTo(160, 160); x.stroke(); x.beginPath(); x.moveTo(150, 168); x.lineTo(176, 178); x.lineTo(160, 186); x.closePath(); x.fill(); }); age(1, 0.6, 0.3); });
    cell(2, () => { diamond(() => { x.lineWidth = 15; x.beginPath(); x.moveTo(110, 190); x.lineTo(110, 130); x.quadraticCurveTo(110, 96, 146, 96); x.stroke(); x.beginPath(); x.moveTo(176, 96); x.lineTo(142, 72); x.lineTo(142, 120); x.closePath(); x.fill(); }); age(1.2, 0.5, 0.3); });
    const chev = (bg, fg) => { x.fillStyle = bg; x.fillRect(0, 0, S, S); x.fillStyle = fg; for (let k = 0; k < 3; k++) { const ox = 40 + k * 66; x.beginPath(); x.moveTo(ox + 50, 40); x.lineTo(ox + 18, 128); x.lineTo(ox + 50, 216); x.lineTo(ox + 26, 216); x.lineTo(ox - 6, 128); x.lineTo(ox + 26, 40); x.closePath(); x.fill(); } };
    cell(3, () => { chev('#e0b72a', '#1a1a1a'); age(1, 0.5, 0.3); });
    cell(4, () => { chev('#c43a2c', '#efe9dc'); age(1, 0.5, 0.3); });
    const stripes = (a, b) => { x.fillStyle = a; x.fillRect(0, 0, S, S); x.fillStyle = b; for (let k = -S; k < S * 2; k += 64) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 32, 0); x.lineTo(k + 32 - S, S); x.lineTo(k - S, S); x.closePath(); x.fill(); } };
    cell(5, () => { stripes('#e46b2e', '#eee8dc'); age(1, 0.6, 0.3); });
    cell(6, () => { stripes('#1c1c1c', '#e3b928'); age(1, 0.6, 0.25); });
    cell(7, () => { stripes('#c3352b', '#eee8dc'); age(1, 0.6, 0.3); });
    const water = (col) => { x.fillStyle = col; x.fillRect(0, 0, S, S); for (let k = 0; k < 4; k++) { x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(20 + k * 60, 70, 34, 120); x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(20 + k * 60, 70, 34, 10); } x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, 200, S, 56); };
    cell(8, () => { water('#e2662c'); age(0.4, 1, 0.32); });
    cell(9, () => { water('#e9e6dc'); age(0.4, 1.2, 0.12); });
    cell(10, () => { water('#e3b82c'); age(0.4, 1, 0.3); });
    const barrel = (col) => { x.fillStyle = col; x.fillRect(0, 0, S, S); for (const y of [50, 128, 206]) { x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(0, y, S, 8); x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(0, y - 4, S, 4); } };
    cell(11, () => { barrel('#4f6a34'); age(2.2, 0.6, 0.12); });
    cell(12, () => { barrel('#2f5c9c'); age(1, 0.6, 0.3); });
    cell(13, () => { x.fillStyle = '#18181a'; x.fillRect(0, 0, S, S); const on = [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [4, 1], [3, 0], [4, 3], [3, 4]];
      for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) { const lit = on.some(([a, b]) => a === i && b === j), br = R() < 0.3; x.fillStyle = lit && !br ? '#b98a2a' : br ? '#0c0c0c' : '#3a3630'; x.beginPath(); x.arc(30 + i * 33, 50 + j * 38, 11, 0, TAU); x.fill(); } age(0.8, 0.4, 0.08); });
    cell(14, () => { x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, S, S); for (let k = 0; k < 1500; k++) { x.fillStyle = `rgba(${R() < 0.5 ? '90,80,70' : '255,255,255'},${(R() * 0.12).toFixed(2)})`; x.fillRect(R() * S, R() * S, 3, 3); } });
    cell(15, () => { x.fillStyle = '#6e6a64'; x.fillRect(0, 0, S, S); age(2.6, 0.3, 0); for (let k = 0; k < 60; k++) { x.fillStyle = `rgba(150,74,30,${(0.3 + R() * 0.4).toFixed(2)})`; x.beginPath(); x.arc(R() * S, R() * S, 4 + R() * 18, 0, TAU); x.fill(); } });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (styKA = t);
  }
  const KC = (k, m) => { const u0 = (k % 4) / 4, v1 = 1 - Math.floor(k / 4) / 4, e = (m == null ? 0.004 : m); return { u0: u0 + e, u1: u0 + 0.25 - e, v0: v1 - 0.25 + e, v1: v1 - e }; };
  const KW = () => { const c = KC(14); return [(c.u0 + c.u1) / 2, (c.v0 + c.v1) / 2]; };
  function kQuad(g, a, b, c, d, k, sh, flipU) {   // a textured quad (a: bottom left, b: bottom right, c: top right, d: top left) on atlas cell k; both faces (the back in rusty metal)
    const C = KC(k), B = KC(15), col = [sh, sh, sh], u0 = flipU ? C.u1 : C.u0, u1 = flipU ? C.u0 : C.u1;
    const nx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]), l = Math.hypot(nx, ny, nz) || 1, n = [nx / l, ny / l, nz / l], m = [-n[0], -n[1], -n[2]];
    g.triN(a, b, c, n, n, n, col, col, col, [u0, C.v0], [u1, C.v0], [u1, C.v1]); g.triN(a, c, d, n, n, n, col, col, col, [u0, C.v0], [u1, C.v1], [u0, C.v1]);
    const o = 0.006, A = [a[0] - n[0] * o, a[1] - n[1] * o, a[2] - n[2] * o], Bb = [b[0] - n[0] * o, b[1] - n[1] * o, b[2] - n[2] * o], Cc = [c[0] - n[0] * o, c[1] - n[1] * o, c[2] - n[2] * o], D = [d[0] - n[0] * o, d[1] - n[1] * o, d[2] - n[2] * o], bc = sMul(col, 0.8);
    g.triN(A, Cc, Bb, m, m, m, bc, bc, bc, [B.u0, B.v0], [B.u1, B.v1], [B.u1, B.v0]); g.triN(A, D, Cc, m, m, m, bc, bc, bc, [B.u0, B.v0], [B.u0, B.v1], [B.u1, B.v1]);
  }
  function kBox(g, X, sx, sy, sz, kFront, kSide, col) {   // a box in the frame X (centre of its foot at the origin), its long faces on cell kFront, the rest kSide (or white, tinted col)
    const P = (u, v, w) => sP(X, u, v, w), h = [sx / 2, sz / 2], q = [[-h[0], -h[1]], [h[0], -h[1]], [h[0], h[1]], [-h[0], h[1]]], W = KW(), cw = col || [1, 1, 1];
    const face = (a, b, c, d, k, nn) => { const n = sN(X, ...nn), C = k == null ? null : KC(k), cc = k == null ? cw : [1, 1, 1], sh = 0.75 + 0.25 * Math.max(0, n[1]) + 0.1 * n[0], cl = sMul(cc, sh);
      const uv = C ? [[C.u0, C.v0], [C.u1, C.v0], [C.u1, C.v1], [C.u0, C.v1]] : [W, W, W, W]; g.triN(a, b, c, n, n, n, cl, cl, cl, uv[0], uv[1], uv[2]); g.triN(a, c, d, n, n, n, cl, cl, cl, uv[0], uv[2], uv[3]); };
    face(P(-h[0], 0, h[1]), P(h[0], 0, h[1]), P(h[0], sy, h[1]), P(-h[0], sy, h[1]), kFront, [0, 0, 1]);
    face(P(h[0], 0, -h[1]), P(-h[0], 0, -h[1]), P(-h[0], sy, -h[1]), P(h[0], sy, -h[1]), kFront, [0, 0, -1]);
    face(P(h[0], 0, h[1]), P(h[0], 0, -h[1]), P(h[0], sy, -h[1]), P(h[0], sy, h[1]), kSide, [1, 0, 0]);
    face(P(-h[0], 0, -h[1]), P(-h[0], 0, h[1]), P(-h[0], sy, h[1]), P(-h[0], sy, -h[1]), kSide, [-1, 0, 0]);
    face(P(-h[0], sy, h[1]), P(h[0], sy, h[1]), P(h[0], sy, -h[1]), P(-h[0], sy, -h[1]), kSide, [0, 1, 0]);
  }
  function kCyl(g, X, r, h, n, k, col, top) {   // a cylinder in the frame X (foot at the origin) wrapped in cell k (or white tinted col), a lid
    const C = k == null ? null : KC(k), W = KW(), cw = col || [1, 1, 1], tc = top || sMul(cw, 0.8);
    for (let j = 0; j < n; j++) { const a0 = j / n * TAU, a1 = (j + 1) / n * TAU, p = (a, y) => sP(X, Math.cos(a) * r, y, Math.sin(a) * r), nn = (a) => sN(X, Math.cos(a), 0, Math.sin(a));
      const s0 = 0.78 + 0.22 * Math.max(0, nn(a0)[1] + 0.5 * nn(a0)[0]), s1 = 0.78 + 0.22 * Math.max(0, nn(a1)[1] + 0.5 * nn(a1)[0]), c0 = C ? [s0, s0, s0] : sMul(cw, s0), c1 = C ? [s1, s1, s1] : sMul(cw, s1);
      const u0 = C ? C.u0 + (C.u1 - C.u0) * j / n : W[0], u1 = C ? C.u0 + (C.u1 - C.u0) * (j + 1) / n : W[0], vb = C ? C.v0 : W[1], vt = C ? C.v1 : W[1];
      g.triN(p(a0, 0), p(a1, 0), p(a1, h), nn(a0), nn(a1), nn(a1), c0, c1, c1, [u0, vb], [u1, vb], [u1, vt]); g.triN(p(a0, 0), p(a1, h), p(a0, h), nn(a0), nn(a1), nn(a0), c0, c1, c0, [u0, vb], [u1, vt], [u0, vt]);
      const up = sN(X, 0, 1, 0); g.triN(sP(X, 0, h, 0), p(a1, h), p(a0, h), up, up, up, tc, tc, tc, W, W, W); }
  }
  // the overgrowth on a thing: a few climbing blobs of ivy, tufts at its foot
  function kVine(g, x, y, z, h, R, n) { const W = KW(); g.dUV = W; for (let k = 0; k < (n || 3); k++) { const a = R() * TAU, d = 0.15 + R() * 0.25, yy = y + R() * h; sLathe(g, sXf(x + Math.cos(a) * d, 0, z + Math.sin(a) * d), sSph(0.18 + R() * 0.2, 0.16 + R() * 0.2, yy, 3, vary([0.16, 0.48, 0.1], R, 0.3), 0.7, 1.15, 0.2), 6, R() * TAU); } }
  function kTufts(g, x, y, z, R, n, sp) { g.dUV = KW(); for (let k = 0; k < (n || 3); k++) styTuft(g, x + (R() - 0.5) * (sp || 1.2), y, z + (R() - 0.5) * (sp || 1.2), 0.6 + R() * 0.6, R); }
  /* the pieces (age: 0 new, 1 a hundred years) */
  function kSignStand(g, x, y, z, rot, k, R, age) {   // a diamond sign on a folding stand (fallen flat now and then)
    const fallen = age && R() < 0.3, lean = age ? (R() - 0.5) * 0.5 : 0, X = sXf(x, y, z, rot, 1, 1, 1, fallen ? Math.PI / 2 - 0.05 : lean), s = 0.62, cy = fallen ? 0.12 : 1.05, W = KW(); g.dUV = W;
    const P = (u, v) => sP(X, u, v, 0.05);
    kQuad(g, P(0, cy - s), P(s, cy), P(0, cy + s), P(-s, cy), k, age ? 0.88 : 1);
    if (!fallen) { for (const sd of [-1, 1]) sLathe(g, sXf(...sP(X, sd * 0.3, 0, 0), rot, 1, 1, 1, sd * 0.25 + lean), [[0.025, 0, [0.4, 0.37, 0.33]], [0.02, 0.9, [0.45, 0.42, 0.38]]], 4, 0);
      sLathe(g, sXf(...sP(X, 0, 0, -0.4), rot, 1, 1, 1, lean), [[0.02, 0, [0.4, 0.37, 0.33]], [0.02, 0.8, [0.45, 0.42, 0.38]]], 4, 0);
      if (R() < 0.6) sLathe(g, sXf(...sP(X, 0.55, cy + 0.65, 0.05), rot, 1, 1, 1, 0.3), [[0.012, 0, [0.4, 0.4, 0.4]], [0.01, 0.4, [0.4, 0.4, 0.4]]], 3, 0); }
    if (age) { kVine(g, x, y, z, fallen ? 0.2 : 1.2, R, fallen ? 4 : 3); kTufts(g, x, y, z, R, 3, 1.6); }
  }
  function kChevron(g, x, y, z, rot, k, R, age) { const lean = age ? (R() - 0.5) * 0.6 : 0, X = sXf(x, y, z, rot, 1, 1, 1, lean), W = KW(); g.dUV = W;
    sLathe(g, sXf(x, y, z, rot, 1, 1, 1, lean), [[0.04, 0, [0.42, 0.38, 0.33]], [0.035, 1.2, [0.48, 0.44, 0.38]]], 5, 0);
    kQuad(g, sP(X, -0.4, 0.75, 0.05), sP(X, 0.4, 0.75, 0.05), sP(X, 0.4, 1.45, 0.05), sP(X, -0.4, 1.45, 0.05), k, 0.95);
    if (age) { kVine(g, x, y, z, 1, R, 2); kTufts(g, x, y, z, R, 2); } }
  function kBarricade(g, x, y, z, rot, k, R, age) {   // an A-frame barricade: two boards in stripes on two frames, a lamp on top (tipped over now and then)
    const down = age && R() < 0.3, X = sXf(x, y, z, rot, 1, 1, 1, down ? Math.PI / 2 - 0.1 : (age ? (R() - 0.5) * 0.2 : 0)), W = KW(); g.dUV = W;
    for (const u of [-0.75, 0.75]) for (const sd of [-1, 1]) sLathe(g, sXf(...sP(X, u, 0, sd * 0.25), rot, 1, 1, 1, 0), [[0.03, 0, [0.3, 0.3, 0.3]], [0.03, 1.05, [0.34, 0.34, 0.34]]], 4, 0);
    for (const y0 of [0.45, 0.82]) kBox(g, sXf(...sP(X, 0, y0, 0), rot, 1, 1, 1, down ? Math.PI / 2 - 0.1 : 0), 1.7, 0.22, 0.05, k, null, [0.85, 0.83, 0.78]);
    if (!down && R() < 0.7) { g.dUV = W; sLathe(g, sXf(...sP(X, -0.7, 1.05, 0)), sSph(0.09, 0.09, 0.1, 3, age ? [0.6, 0.45, 0.2] : [1, 0.7, 0.15], 0.8, 1.1), 6, 0); }
    if (age) { kVine(g, x, y, z, 0.9, R, 3); kTufts(g, x, y, z, R, 3, 2); }
  }
  function kWater(g, x, y, z, rot, k, R, age) { const X = sXf(x, y - (age ? 0.08 : 0), z, rot, 1, 1, 1, age ? (R() - 0.5) * 0.12 : 0);
    kBox(g, X, 1.8, 0.95, 0.5, k, k); kBox(g, sXf(...sP(X, 0, 0, 0), rot), 1.85, 0.18, 0.62, k, k);
    if (age) { g.dUV = KW(); for (let q = 0; q < 3; q++) { const [px, py, pz] = sP(X, (R() - 0.5) * 1.4, 0.96, 0); sLathe(g, sXf(px, 0, pz, rot, 1, 1, 0.6), sSph(0.3 + R() * 0.25, 0.12, py, 3, vary([0.22, 0.52, 0.1], R, 0.3), 0.8, 1.15, 0.5), 6, 0); } kTufts(g, x, y, z, R, 4, 2); } }
  function kBarrel(g, x, y, z, R, age, k) { const tip = age && R() < 0.35, X = tip ? sXf(x, y + 0.3, z, R() * TAU, 1, 1, 1, Math.PI / 2) : sXf(x, y, z, R() * TAU, 1, 1, 1, age ? (R() - 0.5) * 0.1 : 0);
    kCyl(g, tip ? sXf(x, y + 0.3, z, X.yc ? Math.atan2(X.ys, X.yc) : 0, 1, 1, 1, Math.PI / 2) : X, 0.3, 0.88, 10, k, null, [0.3, 0.26, 0.22]); if (tip) { const W = KW(); g.dUV = W; }
    if (age) { kVine(g, x, y, z, tip ? 0.4 : 0.8, R, 2); kTufts(g, x, y, z, R, 2); } }
  function kDrum(g, x, y, z, R, age) { const tip = age && R() < 0.4, yaw = R() * TAU, X = tip ? sXf(x, y + 0.42, z, yaw, 1, 1, 1, Math.PI / 2) : sXf(x, y, z, yaw), W = KW(); g.dUV = W;
    const o = age ? [0.82, 0.48, 0.3] : [0.95, 0.42, 0.12], wh = age ? [0.82, 0.8, 0.74] : [0.97, 0.96, 0.92];
    sLathe(g, tip ? sXf(x, y + 0.42, z, yaw, 1, 1, 1, Math.PI / 2) : X, [[0.4, 0, [0.15, 0.15, 0.15]], [0.42, 0.06, [0.18, 0.18, 0.18]], [0.33, 0.08, o], [0.32, 0.25, o], [0.315, 0.27, wh], [0.31, 0.42, wh], [0.305, 0.44, o], [0.3, 0.6, o], [0.295, 0.62, wh], [0.29, 0.78, wh], [0.285, 0.8, o], [0.27, 0.95, o], [0.2, 1.0, sMul(o, 0.9)], [0, 1.0, sMul(o, 0.9)]], 10, 0);
    if (age) { kVine(g, x, y, z, 0.8, R, 2); kTufts(g, x, y, z, R, 2); } }
  function kCone(g, x, y, z, R, age) { const tip = age && R() < 0.5, yaw = R() * TAU, W = KW(); g.dUV = W; const o = age ? [0.85, 0.5, 0.36] : [1, 0.42, 0.1], wh = age ? [0.8, 0.78, 0.72] : [0.97, 0.97, 0.94];
    const X = tip ? sXf(x, y + 0.14, z, yaw, 1, 1, 1, Math.PI / 2 - 0.35) : sXf(x, y, z, yaw);
    sLathe(g, X, [[0.2, 0, [0.15, 0.15, 0.15]], [0.2, 0.04, [0.15, 0.15, 0.15]], [0.13, 0.05, o], [0.1, 0.3, o], [0.095, 0.32, wh], [0.075, 0.46, wh], [0.07, 0.48, o], [0.03, 0.68, o], [0, 0.7, o]], 8, 0); if (age) kTufts(g, x, y, z, R, 1, 0.5); }
  function kRail(g, i0, i1, side, off, R, age) {   // a W-beam guardrail on posts (rusted, sagging, bent and broken here and there)
    const W = KW(), B = KC(15); let prev = null;
    for (let i = i0; i <= i1; i += Math.max(1, Math.round(2 / T.ds))) { const o = side * off, x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = gH(x, z), sag = age ? -R() * 0.25 : 0, lean = age ? (R() - 0.5) * 0.4 : 0;
      g.dUV = W; sLathe(g, sXf(x, y, z, T.hd[i], 1, 1, 1, lean), [[0.06, -0.1, [0.4, 0.38, 0.35]], [0.06, 0.75 + sag, [0.46, 0.43, 0.4]]], 4, 0);
      const top = [x + T.nx[i] * side * 0.12, y + 0.72 + sag, z + T.nz[i] * side * 0.12];
      if (prev && !(age && R() < 0.08)) { const a = [prev[0], prev[1] - 0.32, prev[2]], b = [top[0], top[1] - 0.32, top[2]], c = [top[0], top[1], top[2]], d = [prev[0], prev[1], prev[2]], sh = 0.9;
        g.triN(a, b, c, [T.nx[i] * side, 0, T.nz[i] * side], [T.nx[i] * side, 0, T.nz[i] * side], [T.nx[i] * side, 0, T.nz[i] * side], [sh, sh, sh], [sh, sh, sh], [sh, sh, sh], [B.u0, B.v0], [B.u1, B.v0], [B.u1, B.v1]);
        g.triN(a, c, d, [T.nx[i] * side, 0, T.nz[i] * side], [T.nx[i] * side, 0, T.nz[i] * side], [T.nx[i] * side, 0, T.nz[i] * side], [sh, sh, sh], [sh, sh, sh], [sh, sh, sh], [B.u0, B.v0], [B.u1, B.v1], [B.u0, B.v1]);
        g.triN(a, c, b, [-T.nx[i] * side, 0, -T.nz[i] * side], [-T.nx[i] * side, 0, -T.nz[i] * side], [-T.nx[i] * side, 0, -T.nz[i] * side], [0.7, 0.7, 0.7], [0.7, 0.7, 0.7], [0.7, 0.7, 0.7], [B.u0, B.v0], [B.u1, B.v1], [B.u1, B.v0]);
        g.triN(a, d, c, [-T.nx[i] * side, 0, -T.nz[i] * side], [-T.nx[i] * side, 0, -T.nz[i] * side], [-T.nx[i] * side, 0, -T.nz[i] * side], [0.7, 0.7, 0.7], [0.7, 0.7, 0.7], [0.7, 0.7, 0.7], [B.u0, B.v0], [B.u0, B.v1], [B.u1, B.v1]); }
      prev = top; if (age && R() < 0.35) { kVine(g, x, y, z, 0.7, R, 2); kTufts(g, x, y, z, R, 2); } }
  }
  function kArrowBoard(g, x, y, z, rot, k, R, age) {   // an arrow board on its trailer: rusty frame, flat tyres, the panel on a mast
    const X = sXf(x, y, z, rot, 1, 1, 1, age ? 0.08 : 0), col = age ? [0.5, 0.36, 0.26] : [k === 0 ? 0.2 : 0.95, k === 0 ? 0.35 : 0.4, k === 0 ? 0.8 : 0.15], W = KW(); g.dUV = W;
    kBox(g, sXf(...sP(X, 0, 0.35, 0), rot, 1, 1, 1, age ? 0.08 : 0), 1.8, 0.25, 1.2, null, null, col);
    for (const sd of [-1, 1]) kCyl(g, sXf(...sP(X, 0, 0.3, sd * 0.7), rot, 1, age ? 0.6 : 1, 1, Math.PI / 2), 0.3, 0.2, 8, null, [0.12, 0.12, 0.12]);
    kBox(g, sXf(...sP(X, 1.1, 0.35, 0), rot), 0.9, 0.08, 0.08, null, null, col);
    sLathe(g, sXf(...sP(X, -0.4, 0.5, 0), rot), [[0.05, 0, col], [0.05, 1.6, col]], 4, 0);
    const P = (u, v) => sP(X, -0.35, v, u); kQuad(g, P(0.9, 1.45), P(-0.9, 1.45), P(-0.9, 2.55), P(0.9, 2.55), 13, 0.95);
    if (age) { kVine(g, x, y, z, 1.6, R, 5); kTufts(g, x, y, z, R, 5, 2.5); }
  }
  function kToilet(g, x, y, z, rot, R, age, col) {   // a portable toilet: faded walls, a rounded white roof, the door ajar
    const X = sXf(x, y, z, rot, 1, 1, 1, age ? (R() - 0.5) * 0.15 : 0), c = age ? sMix(col, [0.6, 0.62, 0.55], 0.45) : col, W = KW(); g.dUV = W;
    kBox(g, X, 1.1, 2.15, 1.1, null, null, c);
    sLathe(g, sXf(...sP(X, 0, 2.15, 0), rot, 1, 1, 1), [[0.62, 0, [0.85, 0.84, 0.8]], [0.6, 0.1, [0.88, 0.87, 0.83]], [0.4, 0.25, [0.9, 0.9, 0.86]], [0, 0.3, [0.92, 0.92, 0.88]]], 8, Math.PI / 8);
    kBox(g, sXf(...sP(X, 0.55, 0.05, 0.75), rot + (age ? 0.9 : 0.15)), 0.9, 1.9, 0.05, null, null, sMul(c, 0.9));
    if (age) { kVine(g, x, y, z, 2.2, R, 7); kTufts(g, x, y, z, R, 5, 2); }
  }
  function kTyres(g, x, y, z, R, age) { const n = 2 + Math.floor(R() * 3), W = KW(); g.dUV = W;
    for (let k = 0; k < n; k++) { const ring = [[0.3, 0, [0.1, 0.1, 0.1]], [0.42, 0.02, [0.12, 0.12, 0.12]], [0.45, 0.13, [0.15, 0.15, 0.15]], [0.42, 0.24, [0.13, 0.13, 0.13]], [0.3, 0.26, [0.1, 0.1, 0.1]], [0.26, 0.13, [0.06, 0.06, 0.06]], [0.3, 0, [0.1, 0.1, 0.1]]];
      sLathe(g, sXf(x + (R() - 0.5) * 0.08, y + k * 0.26, z + (R() - 0.5) * 0.08, R()), ring, 10, 0); }
    if (age) { styTuft(g, x, y + n * 0.26 - 0.2, z, 1, R); kTufts(g, x, y, z, R, 3, 1.6); }
  }
  // the fences: a palisade of sharpened logs (light cut tips, binding rails; age: gaps, leaning and fallen logs, ivy) and a three-rail wooden fence
  function kPalisade(g, i0, i1, side, off, R, age) {
    const W = KW(); g.dUV = W; let s = i0 * T.ds;
    while (s < i1 * T.ds) { const i = T.idx(s), dr = 0.16 + R() * 0.05, o = side * (off + (R() - 0.5) * 0.06), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = gH(x, z), h = 2.2 + R() * 0.8;
      s += dr * 2.05; if (age && R() < 0.12) continue;
      const fallen = age && R() < 0.08, lean = age ? (R() - 0.5) * 0.25 : (R() - 0.5) * 0.04, bark = vary([0.42, 0.29, 0.18], R, 0.15), cut = age ? [0.55, 0.45, 0.32] : [0.93, 0.78, 0.55];
      const X = fallen ? sXf(x - T.nx[i] * side * 1.3, y + dr, z - T.nz[i] * side * 1.3, T.hd[i] + Math.PI / 2, 1, 1, 1, Math.PI / 2 * side) : sXf(x, y - 0.2, z, R() * TAU, 1, 1, 1, lean);
      sLathe(g, X, [[dr, 0, sMul(bark, 0.8)], [dr, h * 0.85, bark], [dr * 0.97, h * 0.86, cut], [dr * 0.35, h * 0.98, sMul(cut, 1.04)], [0, h, cut]], 6, R() * TAU); }
    for (const yy of [0.7, 1.7]) { let prev = null; for (let i = i0; i <= i1; i += Math.max(1, Math.round(2.4 / T.ds))) { const o = side * (off - 0.22), p = [T.px[i] + T.nx[i] * o, gH(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) + yy + (age ? (R() - 0.5) * 0.3 : 0), T.pz[i] + T.nz[i] * o];
      if (prev && !(age && R() < 0.25)) { const dx = p[0] - prev[0], dz = p[2] - prev[2], L = Math.hypot(dx, dz); sLathe(g, sXf((p[0] + prev[0]) / 2, (p[1] + prev[1]) / 2, (p[2] + prev[2]) / 2, Math.atan2(dz, dx), 1, 1, 1, Math.PI / 2), [[0.06, -L / 2, [0.45, 0.32, 0.2]], [0.06, L / 2, [0.48, 0.34, 0.22]]], 5, 0); }
      prev = p; } }
    if (age) for (let i = i0; i <= i1; i += Math.max(1, Math.round(1.5 / T.ds))) { if (R() > 0.6) continue; const o = side * (off - 0.4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = gH(x, z); kVine(g, x, y, z, 2.2, R, 3); kTufts(g, x, y, z, R, 3, 1.4); }
  }
  function kRailFence(g, i0, i1, side, off, R, age) {
    const W = KW(); g.dUV = W; const wood = age ? [0.5, 0.44, 0.34] : [0.78, 0.55, 0.3]; let prev = null;
    for (let i = i0; i <= i1; i += Math.max(1, Math.round(2.6 / T.ds))) { const o = side * off, x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = gH(x, z), lean = age ? (R() - 0.5) * 0.3 : 0, sh = vary(wood, R, 0.1);
      kBox(g, sXf(x, y - 0.1, z, T.hd[i], 1, 1, 1, lean), 0.16, 1.45, 0.16, null, null, sMul(sh, 0.92));
      const cur = [x, y, z]; if (prev) for (const yy of [0.4, 0.8, 1.2]) { if (age && R() < 0.2) continue; const drop = age && R() < 0.15, dx = cur[0] - prev[0], dz = cur[2] - prev[2], L = Math.hypot(dx, dz), mx = (cur[0] + prev[0]) / 2, mz = (cur[2] + prev[2]) / 2, my = (cur[1] + prev[1]) / 2 + yy;
        kBox(g, sXf(mx, drop ? my - yy * 0.6 : my, mz, Math.atan2(dz, dx), 1, 1, 1, drop ? (R() < 0.5 ? 0.5 : -0.5) : 0), L + 0.1, 0.13, 0.07, null, null, vary(wood, R, 0.12)); }
      prev = cur; if (age && R() < 0.4) { kVine(g, x, y, z, 1.2, R, 2); kTufts(g, x, y, z, R, 3, 1.6); } }
  }
  function kCamp(g, x, y, z, rot, R, age) {   // a thatched tepee, a lean-to, a fire pit, a wood pile, a stump with an axe
    const W = KW(); g.dUV = W; const P = (u, v) => [x + Math.cos(rot) * u - Math.sin(rot) * v, z + Math.sin(rot) * u + Math.cos(rot) * v], straw = [0.72, 0.56, 0.26], fern = [0.42, 0.56, 0.18], wood = [0.48, 0.34, 0.2];
    { const [px, pz] = P(0, 0), py = gH(px, pz); sLathe(g, sXf(px, py, pz), [[2.1, 0, sMul(straw, 0.7)], [1.9, 0.3, straw], [1.2, 1.6, sMul(straw, 1.05)], [0.5, 2.6, sMul(straw, 1.1)], [0.15, 3.0, sMul(straw, 1.12)], [0, 3.05, straw]], 9, R() * TAU, R, 0.08);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R() * 0.3; sLathe(g, sXf(px + Math.cos(a) * 0.1, py + 2.7, pz + Math.sin(a) * 0.1, a, 1, 1, 1, 0.25), [[0.04, 0, wood], [0.025, 1.0, wood]], 4, 0); }
      const [dx, dz] = P(0, 2.0); kBox(g, sXf(dx, py, dz, rot), 0.8, 1.2, 0.05, null, null, [0.12, 0.1, 0.08]); }
    { const [px, pz] = P(5.2, 0.5), py = gH(px, pz), X = sXf(px, py, pz, rot + 0.4, 1, 1, 1, 0);
      for (const u of [-1.5, 1.5]) { sLathe(g, sXf(...sP(X, u, 0, -1.3), 0), [[0.07, 0, wood], [0.06, 2.0, wood]], 5, 0); sLathe(g, sXf(...sP(X, u, 0, 1.3), 0), [[0.07, 0, wood], [0.06, 0.6, wood]], 5, 0); }
      sLathe(g, sXf(...sP(X, 0, 2.0, -1.3), rot + 0.4, 1, 1, 1, Math.PI / 2), [[0.07, -1.8, wood], [0.07, 1.8, wood]], 5, 0);
      const n = [0, 0.86, 0.5]; for (let q = 0; q < 12; q++) { const u0 = -1.6 + q * 0.27, a = sP(X, u0, 0.5, 1.4), b = sP(X, u0 + 0.32, 0.5, 1.4), c = sP(X, u0 + 0.32, 2.05, -1.35), d = sP(X, u0, 2.05, -1.35), cl = vary(q % 3 ? fern : straw, R, 0.2), nn = sN(X, 0, 0.86, 0.5); g.triN(a, b, c, nn, nn, nn, sMul(cl, 0.8), sMul(cl, 0.8), cl); g.triN(a, c, d, nn, nn, nn, sMul(cl, 0.8), cl, cl); g.triN(a, c, b, [-nn[0], -nn[1], -nn[2]], [-nn[0], -nn[1], -nn[2]], [-nn[0], -nn[1], -nn[2]], sMul(cl, 0.5), sMul(cl, 0.5), sMul(cl, 0.5)); g.triN(a, d, c, [-nn[0], -nn[1], -nn[2]], [-nn[0], -nn[1], -nn[2]], [-nn[0], -nn[1], -nn[2]], sMul(cl, 0.5), sMul(cl, 0.5), sMul(cl, 0.5)); } }
    { const [px, pz] = P(2.6, 3.4), py = gH(px, pz); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; styStone(g, px + Math.cos(a) * 0.65, py - 0.05, pz + Math.sin(a) * 0.65, 0.2, 0.22, 0.18, a, [0.6, 0.6, 0.56], R, 0); }
      g.dUV = W; for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; sLathe(g, sXf(px, py + 0.15, pz, a, 1, 1, 1, 1.2), [[0.05, -0.45, [0.2, 0.15, 0.1]], [0.04, 0.45, [0.3, 0.2, 0.12]]], 4, 0); }
      sLathe(g, sXf(px, 0, pz), sSph(0.3, 0.05, py + 0.02, 2, age ? [0.3, 0.3, 0.3] : [0.12, 0.1, 0.1], 0.9, 1.1), 6, 0); }
    { const [px, pz] = P(-3.2, 3), py = gH(px, pz); for (let r = 0; r < 4; r++) for (let k = 0; k < 4 - (r >> 1); k++) { g.dUV = W; const [lx, lz] = P(-3.2 + (k - 1.5) * 0.36 + (r % 2) * 0.18, 3); sLathe(g, sXf(lx, py + 0.17 + r * 0.32, lz, rot, 1, 1, 1, Math.PI / 2), [[0, -0.8, [0.88, 0.72, 0.5]], [0.16, -0.8, [0.86, 0.7, 0.48]], [0.17, -0.78, wood], [0.17, 0.78, wood], [0.16, 0.8, [0.86, 0.7, 0.48]], [0, 0.8, [0.88, 0.72, 0.5]]], 6, R()); } }
    { const [px, pz] = P(-2, -2.8), py = gH(px, pz); styStump(g, px, py, pz, 0.35, R); g.dUV = W; sLathe(g, sXf(px + 0.1, py + 0.75, pz, rot, 1, 1, 1, 0.5), [[0.025, 0, wood], [0.02, 0.7, wood]], 4, 0); kBox(g, sXf(px - 0.02, py + 0.62, pz, rot, 1, 1, 1, 0.5), 0.2, 0.12, 0.03, null, null, [0.45, 0.45, 0.47]); }
    if (age) for (let k = 0; k < 14; k++) { const [px, pz] = P((R() - 0.5) * 12, (R() - 0.5) * 10); kTufts(g, px, gH(px, pz), pz, R, 2, 1); }
  }
  let gH = (x, z) => 0;
  function styKit(o) {   // o: { i (centre sample), len (m), signs, fence: 'palisade' | 'rail', camp, age }
    STYV = window.__STY || {}; const W = Render.world; gH = (x, z) => (W.groundH ? W.groundH(x, z) : T.hy[T.nearestIdx(x, z)]) ;
    const R = rng(o.seed || 5), g = new GB(true), age = o.age ? 1 : 0, iC = o.i, n = Math.round((o.len || 120) / T.ds), i0 = Math.max(0, iC - Math.round(n * 0.3)), i1 = Math.min(T.N - 1, iC + n), w = T.w;
    const bar = (i, sd) => ((sd > 0 ? T.br : T.bl) || [])[i] || w + 2.5, at = (s, sd, extra) => { const i = T.idx(s), of = sd * extra; return [T.px[i] + T.nx[i] * of, T.pz[i] + T.nz[i] * of, i]; };
    const sC = iC * T.ds, fy = (i) => Math.atan2(T.tx[i], -T.tz[i]) + (STYV.flipSigns ? Math.PI : 0), ay = (i) => Math.atan2(T.tz[i], T.tx[i]);
    if (o.signs) {
      for (let k = 0; k < 4; k++) { const [x, z, i] = at(sC - 6 + k * 14, 1, w + 1.4); kSignStand(g, x, gH(x, z), z, fy(i), [0, 1, 2, 0][k], R, age); }
      for (let k = 0; k < 6; k++) { const [x, z, i] = at(sC + 52 + k * 5, -1, w + 1.0); kChevron(g, x, gH(x, z), z, fy(i), k % 2 ? 3 : 4, R, age); }
      for (let k = 0; k < 7; k++) { const of = w - 0.6 - k * 0.42, [x, z, i] = at(sC + 30 + k * 2.2, 1, of); if (k % 2) kDrum(g, x, gH(x, z), z, R, age); else kBarricade(g, x, gH(x, z), z, fy(i) + 0.3, [5, 6, 7][k % 3], R, age); }
      for (let k = 0; k < 6; k++) { const [x, z, i] = at(sC + 46 + k * 2, 1, w * 0.45); kWater(g, x, gH(x, z) + 0.02, z, ay(i), [8, 9, 10][k % 3], R, age); }
      for (let k = 0; k < 10; k++) { const [x, z] = at(sC + 20 + R() * 40, R() < 0.5 ? 1 : -1, R() * (w + 1)); kCone(g, x, gH(x, z), z, R, age); }
      { const [x, z, i] = at(sC + 24, 1, w + 2.2); kArrowBoard(g, x, gH(x, z), z, ay(i) + Math.PI, 1, R, age); }
      for (let k = 0; k < 4; k++) { const [x, z] = at(sC + 62 + k * 1.3, 1, w + 3 + R()); kBarrel(g, x, gH(x, z), z, R, age, k % 2 ? 11 : 12); }
      for (let k = 0; k < 3; k++) { const [x, z, i] = at(sC + 76 + k * 1.4, 1, w + 4.5); kToilet(g, x, gH(x, z), z, ay(i) + Math.PI / 2, R, age, [[0.22, 0.45, 0.8], [0.25, 0.55, 0.3], [0.75, 0.7, 0.25]][k]); }
      for (let k = 0; k < 3; k++) { const [x, z] = at(sC + 66 + k * 1.2, -1, w + 2.5 + R() * 2); kTyres(g, x, gH(x, z), z, R, age); }
      kRail(g, T.idx(sC + 80), T.idx(sC + 150), -1, w + 0.9, R, age);
    }
    if (o.fence) for (const sd of [-1, 1]) (o.fence === 'palisade' ? kPalisade : kRailFence)(g, i0, i1, sd, Math.max(bar(iC, sd) + (o.fence === 'palisade' ? 2.2 : 1.2), w + 2), R, age);
    if (o.camp) { let side = o.camp, best = -1;
      if (o.camp === 'auto') for (const sd of [-1, 1]) { let sc = 0; for (let q = -6; q <= 6; q += 2) for (let e = 8; e <= 18; e += 5) { const [x, z] = at(sC + 22 + q, sd, Math.max(bar(iC, sd), w) + e); if (typeof vrLC === 'function' && VR && vrLC(x, z) === 0 && vrSlope(x, z) < 0.3) sc++; } if (sc > best) { best = sc; side = sd; } }
      const [x, z, i] = at(sC + 22, side, Math.max(bar(iC, side), w) + 11); kCamp(g, x, gH(x, z), z, T.hd[i], R, age); }
    const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ map: styKitAtlas(), vertexColors: true })); m.castShadow = true; m.receiveShadow = true;
    const grp = new THREE.Group(); grp.name = 'styKit'; grp.add(m); return grp;
  }

  /* ---- instead of the spectators: hayracks (kozolci) on the meadows, sheep and cows on the pastures behind a wooden fence, roe deer in the woods,
     chamois and marmots up by the pass; the animals stand where the crowds stood ---- */
  function styKozolec(g, x, y, z, rot, R, n) {   // a single hayrack: a row of posts, slats between them, hay drying on the lower half, a gable roof
    const L = n * 2.6, c = Math.cos(rot), s = Math.sin(rot), wood = vary([0.44, 0.3, 0.18], R, 0.1), hay = [0.78, 0.7, 0.32], P = (u) => [x + c * u, z + s * u];
    for (let k = 0; k <= n; k++) { const [px, pz] = P(-L / 2 + k * 2.6); box(g, px, y - 0.3, pz, 0.3, 5.6, 0.3, rot, wood, null, true); }
    for (let q = 0; q < 10; q++) { const yy = y + 0.6 + q * 0.42, [px, pz] = P(0); box(g, px, yy, pz, L, 0.07, 0.1, rot, sMul(wood, 1.08), null, false); }
    for (let k = 0; k < n; k++) { if (R() < 0.25) continue; const [px, pz] = P(-L / 2 + 1.3 + k * 2.6), h = 1.6 + R() * 1.8; box(g, px, y + 0.55, pz, 2.4, h, 0.32, rot, vary(hay, R, 0.12), sMul(hay, 1.1), true); }
    gable(g, x, y + 5.3, z, L + 1.6, 2.4, 1.3, rot, [0.5, 0.28, 0.16], wood);
  }
  function styAnimal2(g, x, y, z, rot, R, kind) {   // 3 sheep, 4 cow, 5 marmot (the deer, the chamois and the fox: styAnimal)
    const c = Math.cos(rot), sn = Math.sin(rot), P = (u, h, v) => [x + c * u - sn * v, y + h, z + sn * u + c * v];
    if (kind === 3) { const wool = vary([0.94, 0.92, 0.86], R, 0.05), dk = [0.15, 0.13, 0.12];
      sLathe(g, sXf(...P(0, 0, 0), rot, 1, 1, 1, 0), sSph(0.42, 0.34, 0.62, 4, wool, 0.78, 1.1, 0.2), 8, 0); sLathe(g, sXf(...P(0.42, 0, 0), rot, 1, 1, 1, 0), sSph(0.32, 0.3, 0.68, 4, wool, 0.8, 1.1, 0.2), 8, 0);
      sLathe(g, sXf(...P(0.78, 0.72, 0), rot, 1, 1, 1, -Math.PI / 2 + 0.3), [[0, -0.14, dk], [0.11, -0.08, dk], [0.12, 0.06, dk], [0, 0.14, dk]], 6, 0);
      for (const [u, v] of [[0.45, 0.14], [0.45, -0.14], [-0.2, 0.14], [-0.2, -0.14]]) sLathe(g, sXf(...P(u, 0, v)), [[0.04, 0, dk], [0.035, 0.38, dk]], 4, 0);
    } else if (kind === 4) { const base = R() < 0.5 ? [0.62, 0.42, 0.24] : [0.86, 0.84, 0.8], pat = [0.3, 0.2, 0.14], dk = [0.2, 0.16, 0.12];
      kBox(g, sXf(...P(0, 0.75, 0), rot), 1.9, 0.75, 0.75, null, null, base); kBox(g, sXf(...P(-0.3, 1.0, 0.39), rot), 0.7, 0.4, 0.02, null, null, pat);
      kBox(g, sXf(...P(1.15, 0.95, 0), rot, 1, 1, 1, -0.3), 0.5, 0.45, 0.42, null, null, base); kBox(g, sXf(...P(1.42, 0.98, 0), rot), 0.2, 0.25, 0.32, null, null, [0.85, 0.7, 0.68]);
      for (const v of [-0.22, 0.22]) sLathe(g, sXf(...P(1.1, 1.4, v), rot, 1, 1, 1, v > 0 ? 0.6 : -0.6), [[0.03, 0, [0.9, 0.86, 0.75]], [0, 0.18, [0.9, 0.86, 0.75]]], 4, 0);
      for (const [u, v] of [[0.75, 0.26], [0.75, -0.26], [-0.75, 0.26], [-0.75, -0.26]]) kBox(g, sXf(...P(u, 0, v), rot), 0.16, 0.78, 0.16, null, null, dk);
      sLathe(g, sXf(...P(-0.95, 0.4, 0), rot, 1, 1, 1, 0.2), [[0.025, 0, dk], [0.02, 0.9, dk]], 4, 0);
      sLathe(g, sXf(...P(0.9, 0.62, 0)), sSph(0.08, 0.08, 0, 2, [0.85, 0.7, 0.2], 0.9, 1.1), 5, 0);   // the bell
    } else { const fur = vary([0.55, 0.42, 0.28], R, 0.08);   // a marmot standing up on its hind legs
      sLathe(g, sXf(...P(0, 0, 0)), [[0.16, 0, sMul(fur, 0.8)], [0.2, 0.12, fur], [0.17, 0.32, fur], [0.11, 0.44, sMul(fur, 1.05)], [0.12, 0.5, fur], [0.08, 0.6, sMul(fur, 1.1)], [0, 0.63, fur]], 7, 0); }
  }
  function styFarm(scen, excluded, onSide, circ) {
    const R = rng(4411), W = Render.world, w = T.w, base = VR.D.base;
    // where the crowds stood: their spots on a 24 m grid, one group of animals each (sheep or cows low down, deer in the woods, chamois and marmots high up)
    const spots = new Map(); for (const e of circ || []) { const key = Math.floor(e.x / 24) + ',' + Math.floor(e.z / 24); if (!spots.has(key)) spots.set(key, [e.x, e.z]); }
    let nA = 0;
    for (const [x0, z0] of spots.values()) { const i = T.nearestIdx(x0, z0), A = T.hy[i] + base, lc = vrLC(x0, z0), sd = (x0 - T.px[i]) * T.nx[i] + (z0 - T.pz[i]) * T.nz[i] > 0 ? 1 : -1;
      const kind = A > 1450 ? (R() < 0.6 ? 1 : 5) : lc === 1 ? 0 : (R() < 0.55 ? 3 : 4), n = kind === 4 ? 1 + Math.floor(R() * 2) : kind === 5 ? 2 + Math.floor(R() * 2) : 2 + Math.floor(R() * 3);
      for (let k = 0; k < n; k++) { const off = (sd > 0 ? T.br[i] : T.bl[i]) + 3 + R() * 6, j = T.idx(i * T.ds + (R() - 0.5) * 14), x = T.px[j] + T.nx[j] * sd * off, z = T.pz[j] + T.nz[j] * sd * off; if (vrWater(x, z).e > -2) continue;
        const y = vrGround(x, z), g = scen.get(x, z), rot = R() * TAU; if (kind <= 2) styAnimal(g, x, y, z, rot, kind === 2 ? 1.2 : 1.5, R, kind); else styAnimal2(g, x, y, z, rot, R, kind); nA++; } }
    if (STYV.keep) return { animals: nA, kozolci: 0, fence: 0, dense: 0, ks: [] };
    // hayracks on the open meadows of the valley, beside the road; a wooden fence along the pastures where the animals graze
    let nK = 0, lastK = -1e9; const ks = [];
    if (STYV.v2) for (let s = 20; s < T.len - 20; s += 9) { const i = T.idx(s), A = T.hy[i] + base; if (A > 1100 || s - lastK < 120) continue;
      for (const sd of [-1, 1]) { const off = (sd > 0 ? T.br[i] : T.bl[i]) + 14 + R() * 8, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off, lc = vrLC(x, z);
        if ((lc !== 0 && lc !== 3) || excluded(x, z) || vrWater(x, z).e > -8 || vrSlope(x, z) > 0.3) continue;
        styItwVines(scen.get(x, z), x, z, Math.atan2(T.tz[i], T.tx[i]), 16 + R() * 10, 9 + R() * 6, R); { const gx = T.px[i] + T.nx[i] * sd * (off - 8.5), gz = T.pz[i] + T.nz[i] * sd * (off - 8.5); styGate(scen.get(gx, gz), gx, vrGround(gx, gz), gz, Math.atan2(T.tz[i], T.tx[i]), R); const bx = gx + T.tx[i] * 4, bz = gz + T.tz[i] * 4; styBarrels(scen.get(bx, bz), bx, vrGround(bx, bz), bz, R); } nK++; lastK = s; ks.push(s); break; } }
    for (let s = 20; s < T.len - 20; s += 9) { const i = T.idx(s), A = T.hy[i] + base; if (STYV.pal === 'itw' || A > 1150 || s - lastK < 90) continue;
      for (const sd of [-1, 1]) { const off = (sd > 0 ? T.br[i] : T.bl[i]) + 8 + R() * 8, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off; const lc = vrLC(x, z);
        if (lc !== 0 && lc !== 3) continue; if (excluded(x, z) || vrWater(x, z).e > -4 || vrSlope(x, z) > 0.25) continue;
        styKozolec(scen.get(x, z), x, vrGround(x, z), z, Math.atan2(T.tz[i], T.tx[i]) + (R() - 0.5) * 0.5, R, 3 + Math.floor(R() * 3)); nK++; lastK = s; ks.push(s); break; } }
    let run = 0;
    for (let s = 20; s < T.len - 20; s += 2.6) { const i = T.idx(s), A = T.hy[i] + base;
      for (const sd of [-1, 1]) { const off = (sd > 0 ? T.br[i] : T.bl[i]) + 2.2, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off, lc = vrLC(x + T.nx[i] * sd * 8, z + T.nz[i] * sd * 8);
        const ok = A < 1300 && (lc === 0 || lc === 3) && vrNear(x, z).dd > 0.8 && !excluded(x, z) && vrWater(x, z).e < -3 && vrSlope(x, z) < 0.5; if (!ok) continue;
        if (STYV.pal === 'itw') { if (run % 6 === 0) styItwWall(scen.get(x, z), i, T.idx(s + 15.6), sd, 2.2, R); run++; continue; }
        const g = scen.get(x, z), y = vrGround(x, z), wood = vary([0.78, 0.55, 0.3], R, 0.08);
        kBox(g, sXf(x, y - 0.1, z, Math.atan2(T.tz[i], T.tx[i])), 0.16, 1.45, 0.16, null, null, sMul(wood, 0.92));
        const j = T.idx(s + 2.6), x2 = T.px[j] + T.nx[j] * sd * ((sd > 0 ? T.br[j] : T.bl[j]) + 2.2), z2 = T.pz[j] + T.nz[j] * sd * ((sd > 0 ? T.br[j] : T.bl[j]) + 2.2), y2 = vrGround(x2, z2), dx = x2 - x, dz = z2 - z, L = Math.hypot(dx, dz);
        for (const yy of [0.4, 0.8, 1.2]) kBox(g, sXf((x + x2) / 2, (y + y2) / 2 + yy, (z + z2) / 2, Math.atan2(dz, dx)), L + 0.1, 0.13, 0.07, null, null, vary(wood, R, 0.1)); run++; } }
    // a dense band of plants and stones right along the road: bushes, stone groups, flowers and grass, two things every 1.8 m on each side
    const C = styPal(); let nD = 0;
    for (let s = 6; s < T.len - 6; s += 1.8) for (const sd of [-1, 1]) for (let q = 0; q < 2; q++) {
      const i = T.idx(s + (R() - 0.5) * 1.6), bar = sd > 0 ? T.br[i] : T.bl[i], off = bar + 0.6 + Math.pow(R(), 1.3) * 7, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off;
      if (vrNear(x, z).dd < 0.6 || excluded(x, z) || vrWater(x, z).e > -2) continue;
      const y = vrGround(x, z), A = y + base, g = scen.get(x, z), r = R(), snowy = vrSnow(x, z, A, 0.9);
      if (snowy > 0.5 || A > 1500 || vrLC(x, z) === 4) { if (r < 0.55) styStones(g, x, y, z, 0.6 + R() * 0.9, R, C.rock, vrGround); else if (r < 0.8) styTuft(g, x, y, z, 1.1, R, [0.55, 0.7, 0.15]); }
      else if (r < 0.42) styBush(g, x, y, z, 1.0 + R() * 0.9, R, vary(C.bush, R, 0.18), R() < 0.45);
      else if (r < 0.6) styStones(g, x, y, z, 0.55 + R() * 0.8, R, C.rock, vrGround);
      else if (r < 0.78) { for (let k = 0; k < 3; k++) styFlower(g, x + (R() - 0.5) * 1.2, y, z + (R() - 0.5) * 1.2, (STYV.v2 ? 0.6 : 1.1) + R() * 0.3, R); }
      else styTuft(g, x, y, z, 1.2 + R() * 0.5, R);
      nD++; }
    return { animals: nA, kozolci: nK, fence: run, dense: nD, ks };
  }

  function styZone(i0, i1) {   // the band where everything can be knocked down: from the road's edge to the fence line (translucent yellow), the fence line in red
    const g = new GB(false, true), gl = new GB(false, true), up = [0, 1, 0], y = (i, o, sd) => vrGround(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) + 0.08;
    for (let i = Math.max(0, i0); i < Math.min(T.N - 1, i1); i++) { const j = i + 1;
      for (const sd of [-1, 1]) { const bi = (sd > 0 ? T.br[i] : T.bl[i]), bj = (sd > 0 ? T.br[j] : T.bl[j]), a0 = T.w + 0.1, fi = bi + 2.2, fj = bj + 2.2;
        const P = (k, o) => [T.px[k] + T.nx[k] * sd * o, (o < T.w + 0.7 ? T.hy[k] + 0.06 : y(k, o, sd)), T.pz[k] + T.nz[k] * sd * o], c = [1, 0.85, 0.1, 0.32], cr = [0.95, 0.12, 0.1, 0.9];
        g.quadUp(P(i, a0), P(i, fi), P(j, fj), P(j, a0), [c, c, c, c]); gl.quadUp(P(i, fi - 0.12), P(i, fi + 0.12), P(j, fj + 0.12), P(j, fj - 0.12), [cr, cr, cr, cr]); } }
    const grp = new THREE.Group();
    const m = new THREE.Mesh(g.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); grp.add(m);
    const m2 = new THREE.Mesh(gl.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false })); grp.add(m2);
    return grp;
  }

  /* ---- two painterly looks after the cozy Ghibli-like games: 'gh' (lush: cauliflower crowns dark below and sunlit yellow-green on top, deep teal
     spruces, a saturated yellow-green meadow) and 'adr' (the Adriatic: umbrella pines, cypresses, grey-green olives, dry golden grass, white stone) ---- */
  function styGhTree(kind) {
    const g = new GB(), R = rng(7700 + kind), adr = STYV.pal === 'adr', puffs = (cx, cy, cz, R0, n, col, lo, hi, sy) => {
      puff(g, cx, cy, cz, R0, sy || 0.85, col, R, 0.12, lo, hi, true);
      for (let k = 0; k < n; k++) { const a = k / n * TAU + R() * 0.4, e = (R() - 0.25) * 1.0, d = R0 * (0.75 + R() * 0.2), r = R0 * (0.42 + R() * 0.18);
        puff(g, cx + Math.cos(a) * Math.cos(e) * d, cy + Math.sin(e) * d * (sy || 0.85), cz + Math.sin(a) * Math.cos(e) * d, r, 0.9, vary(col, R, 0.12), R, 0.15, lo, hi, false); } };
    const trunk = [0.36, 0.24, 0.16];
    if (!adr) {
      if (kind === 0 || kind === 5) { styTrunk(g, 0.15, 0.03, trunk); const c = [0.04, 0.3, 0.24], t = [0.18, 0.56, 0.34]; ROCK_SMOOTH = true;
        [[0.06, 0.4, 0.36], [0.32, 0.31, 0.32], [0.55, 0.22, 0.3], [0.74, 0.12, 0.26]].forEach(([y, r, h], k) => starCone(g, 0, y, 0, r, h, 7, kind === 5 ? [0.92, 0.95, 1] : sMul(c, 1 + k * 0.08), t, k * 0.7, 0.04)); ROCK_SMOOTH = false; }
      else if (kind === 1 || kind === 6 || kind === 10) { styTrunk(g, 0.2, 0.03, trunk); for (let k = 0; k < 5; k++) puff(g, (R() - 0.5) * 0.05, 0.28 + k * 0.15, (R() - 0.5) * 0.05, 0.2 - k * 0.025, 0.9, kind === 10 ? [0.12, 0.42, 0.14] : [0.3, 0.52, 0.1], R, 0.12, 0.45, 1.4, true); }
      else if (kind === 3 || kind === 7) puffs(0, 0.3, 0, 0.3, 5, [0.1, 0.36, 0.12], 0.45, 1.3, 0.75);
      else if (kind === 4) { styTrunk(g, 0.55, 0.03, trunk, true); puffs(0.02, 0.68, 0, 0.2, 5, [0.36, 0.6, 0.1], 0.5, 1.45); }
      else { styTrunk(g, 0.42, 0.05, trunk); puffs(0, 0.66, 0, 0.3, 9, kind === 8 ? [0.12, 0.4, 0.1] : kind === 9 ? [0.26, 0.5, 0.08] : [0.17, 0.45, 0.1], 0.42, 1.45); }
    } else {
      if (kind === 0 || kind === 5 || kind === 4 || kind === 10) {   // cypress: a tall narrow dark flame
        styTrunk(g, 0.08, 0.025, trunk); sLathe(g, sXf(0, 0, 0), [[0, 0.04, [0.04, 0.16, 0.08]], [0.13, 0.12, [0.06, 0.22, 0.1]], [0.17, 0.35, [0.08, 0.28, 0.12]], [0.15, 0.6, [0.1, 0.33, 0.14]], [0.09, 0.85, [0.13, 0.38, 0.16]], [0, 1, [0.16, 0.42, 0.18]]], 9, 0, R, 0.12); }
      else if (kind === 1 || kind === 6) {   // umbrella pine: a tall bare leaning trunk, a wide flat crown
        sLathe(g, sXf(0, 0, 0, R() * TAU, 1, 1, 1, 0.08), [[0.05, 0, sMul(trunk, 0.8)], [0.035, 0.75, trunk], [0.03, 0.82, trunk]], 6, 0);
        for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.4, d = k ? 0.26 + R() * 0.08 : 0; puff(g, 0.06 + Math.cos(a) * d, 0.84 + R() * 0.05, Math.sin(a) * d, k ? 0.17 : 0.22, 0.42, vary([0.18, 0.36, 0.12], R, 0.12), R, 0.12, 0.45, 1.35, true); } }
      else if (kind === 3 || kind === 7) puffs(0, 0.25, 0, 0.28, 5, [0.2, 0.34, 0.12], 0.5, 1.2, 0.7);   // maquis
      else { sLathe(g, sXf(0, 0, 0, R() * TAU, 1, 1, 1, 0.15), [[0.07, 0, [0.4, 0.36, 0.3]], [0.05, 0.35, [0.45, 0.4, 0.34]], [0.06, 0.45, [0.42, 0.38, 0.32]]], 6, 0);   // olive / holm oak: grey-green
        puffs(0.05, 0.62, 0, 0.3, 8, kind === 8 ? [0.3, 0.38, 0.22] : [0.4, 0.46, 0.3], 0.5, 1.3, 0.75); }
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function styGhGround(c) {
    const p = STYV.pal, l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15;
    if (p === 'gh') { for (let k = 0; k < 3; k++) c[k] = Math.max(0, (l + (c[k] - l) * 1.6) * 1.12); c[0] *= 0.95; c[1] *= 1.12; c[2] *= 0.55; return; }
    const green = Math.max(0, Math.min(1, (c[1] - c[0]) * 6));   // 'adr': the green grass dried golden, the stone whiter
    const gold = [0.86 * l * 1.7, 0.72 * l * 1.7, 0.38 * l * 1.7]; for (let k = 0; k < 3; k++) c[k] = c[k] + (gold[k] - c[k]) * green * 0.7;
    if (l > 0.6) for (let k = 0; k < 3; k++) c[k] = c[k] + (0.96 - c[k]) * 0.4;
  }

  /* ---- 'itw': a warm, sunlit Mediterranean look after the cozy adventure in the reference video (today's world): peach-white limestone, golden dry grass
     with green patches and wildflowers, pines and umbrella pines with clumpy dark crowns, slender cypresses, round holm oaks, bushes with pink blossom,
     terracotta roofs over cream walls, low dry-stone walls along the pastures ---- */
  function styItwTree(kind) {
    const g = new GB(), R = rng(8800 + kind), trunk = [0.42, 0.3, 0.22];
    const clump = (cx, cy, cz, r, sy, col) => puff(g, cx, cy, cz, r, sy, vary(STYV.v2 ? [col[0] * 1.15, col[1] * 1.05, col[2] * 0.8] : col, R, 0.1), R, 0.14, STYV.v2 ? 0.42 : 0.42, STYV.v2 ? 1.5 : 1.38, true);
    if (kind === 4 || kind === 10) {   // cypress
      styTrunk(g, 0.06, 0.02, trunk); sLathe(g, sXf(0, 0, 0), [[0, 0.03, [0.05, 0.17, 0.08]], [0.11, 0.1, [0.07, 0.22, 0.1]], [0.15, 0.33, [0.09, 0.28, 0.12]], [0.13, 0.62, [0.11, 0.33, 0.14]], [0.07, 0.88, [0.15, 0.4, 0.17]], [0, 1, [0.2, 0.46, 0.2]]], 9, 0, R, 0.14);
    } else if (kind === 1 || kind === 6) {   // umbrella pine: a tall leaning trunk forking into a wide flat crown
      const lean = 0.12 + R() * 0.1; sLathe(g, sXf(0, 0, 0, 0, 1, 1, 1, lean), [[0.05, 0, sMul(trunk, 0.8)], [0.035, 0.7, trunk], [0.028, 0.8, trunk]], 6, 0);
      const ox = -Math.sin(lean) * 0.75; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + R() * 0.4, d = k ? 0.24 + R() * 0.1 : 0; clump(ox + Math.cos(a) * d, 0.82 + R() * 0.06, Math.sin(a) * d, k ? 0.16 : 0.22, 0.45, [0.14, 0.32, 0.1]); }
    } else if (kind === 0 || kind === 5) {   // pine: a slender bending trunk, crown in a few flattened clumps at different heights
      sLathe(g, sXf(0, 0, 0, R() * TAU, 1, 1, 1, 0.06), [[0.04, 0, sMul(trunk, 0.8)], [0.025, 0.85, trunk]], 6, 0);
      for (let k = 0; k < 6; k++) { const y = 0.42 + k * 0.1, a = R() * TAU, d = (0.2 - k * 0.02) * (0.6 + R() * 0.6); clump(Math.cos(a) * d, y, Math.sin(a) * d, 0.23 - k * 0.018, 0.6, [0.1, 0.28, 0.12]); }
      clump(0, 0.95, 0, 0.09, 0.7, [0.12, 0.32, 0.13]);
    } else if (kind === 3 || kind === 7) {   // maquis shrub
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + R(), d = k ? 0.25 : 0; clump(Math.cos(a) * d, 0.3, Math.sin(a) * d, k ? 0.24 : 0.3, 0.75, [0.18, 0.36, 0.12]); }
    } else {   // holm oak / broadleaf: a short trunk, a round crown of clumps
      sLathe(g, sXf(0, 0, 0, R() * TAU, 1, 1, 1, 0.08), [[0.06, 0, sMul(trunk, 0.85)], [0.045, 0.42, trunk]], 6, 0);
      const col = STYV.v2 ? (kind === 8 ? [0.12, 0.26, 0.08] : kind === 9 ? [0.18, 0.32, 0.09] : [0.14, 0.29, 0.09]) : kind === 8 ? [0.16, 0.36, 0.1] : kind === 9 ? [0.26, 0.46, 0.12] : [0.2, 0.42, 0.12];
      clump(0, 0.64, 0, 0.3, 0.8, col); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + R() * 0.4, e = (R() - 0.2) * 0.9; clump(Math.cos(a) * Math.cos(e) * 0.26, 0.64 + Math.sin(e) * 0.22, Math.sin(a) * Math.cos(e) * 0.26, 0.15 + R() * 0.06, 0.85, col); }
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function styItwGround(c, x, z) {
    const l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15, sat = Math.abs(c[1] - c[0]) + Math.abs(c[1] - c[2]);
    if (l > 0.62 && sat < 0.12) { const k = l * 1.08; c[0] = 0.94 * k; c[1] = 0.83 * k; c[2] = 0.69 * k; return; }   // limestone, peach-white
    for (let q = 0; q < 3; q++) c[q] = Math.max(0, (l + (c[q] - l) * 1.35) * 1.1);
    const dry = VR ? sstep(0.45, 0.7, VR.n2(x * 0.9, z * 0.9)) * 0.75 + 0.08 * VR.n4(x, z) : 0.4, gold = [0.74, 0.64, 0.36];
    for (let q = 0; q < 3; q++) c[q] = c[q] + (gold[q] * (0.9 + l * 0.3) - c[q]) * dry * 0.6;
    c[0] *= 1.02; c[1] *= 1.04; c[2] *= 0.8;
  }
  function styItwWall(g, i0, i1, sd, off, R) {   // a low dry-stone wall along the road
    let prev = null;
    for (let i = i0; i <= i1; i += Math.max(1, Math.round(2.2 / T.ds))) { const o = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + off), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = vrGround(x, z);
      if (prev) { const dx = x - prev[0], dz = z - prev[2], L = Math.hypot(dx, dz); g.dUV = KW(); kBox(g, sXf((x + prev[0]) / 2, (y + prev[1]) / 2 - 0.1, (z + prev[2]) / 2, Math.atan2(dz, dx)), L + 0.15, 0.85, 0.55, null, null, vary([0.86, 0.76, 0.62], R, 0.08));
        for (let q = 0; q < 3; q++) { const t = R(), px = prev[0] + dx * t, pz = prev[2] + dz * t; styStone(g, px, (y + prev[1]) / 2 + 0.6, pz, 0.22 + R() * 0.12, 0.2, 0.2, R() * TAU, vary([0.9, 0.8, 0.66], R, 0.1), R, 0.2); } }
      prev = [x, y, z]; }
  }

  /* ---- 'itw' v2: closer to the reference (seen from above: warm sandy-tan ground with golden grass, green only in patches and in clumps of dark
     maquis and pines; smooth peach limestone boulders; dirt-dust road edges; vineyards in rows by the houses) ---- */
  function styItwGround2(c, x, z) {
    const l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15, sat = Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
    const rk = sstep(0.56, 0.7, l) * sstep(0.16, 0.06, sat);
    const fo = vrLCf(x, z, 1), sc = vrLCf(x, z, 2), se = vrLCf(x, z, 3);
    const n1 = VR.n2(x * 0.8, z * 0.8), n2 = VR.n4(x, z), n3 = VR.n6(x, z), n4 = VR.n3(x * 1.3, z * 1.3);
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    let o = mix([0.5, 0.56, 0.26], [0.78, 0.68, 0.42], Math.min(1, Math.max(0, sstep(0.3, 0.6, n1) * 0.95 + (n3 - 0.5) * 0.3)));   // yellow-green grass .. golden dry grass
    o = mix(o, [0.4, 0.46, 0.22], sstep(0.62, 0.8, n2) * 0.45);                   // lush patches
    o = mix(o, [0.84, 0.72, 0.56], sstep(0.58, 0.78, n4) * 0.35 * (1 - fo * 0.6));  // bare sandy earth
    o = mix(o, [0.5, 0.48, 0.28], fo * 0.6);                                        // under the pines: grass with needles
    o = mix(o, [0.46, 0.44, 0.26], sc * 0.7);                                      // maquis ground
    o = mix(o, [0.42, 0.55, 0.2], se * 0.55);                                      // gardens
    const k = 0.95 + (n3 - 0.5) * 0.18; o = [o[0] * k * 1.03, o[1] * k, o[2] * k * 0.92];
    o = mix(o, [0.9 * (0.88 + 0.25 * n3), 0.77 * (0.88 + 0.25 * n3), 0.63 * (0.88 + 0.25 * n3)], rk);   // limestone, peach
    c[0] = o[0]; c[1] = o[1]; c[2] = o[2];
  }
  function styItwBush(g, x, y, z, s, R) {   // a clump of dark maquis (now and then an oleander in pink or a lavender)
    if (STYV && STYV.cards && STY_CARDS && R() < 0.8) return styCardBush(x, y, z, s * 1.1, R);
    const t = R(), col = t < 0.7 ? [0.2, 0.3, 0.13] : t < 0.85 ? [0.22, 0.34, 0.14] : [0.26, 0.34, 0.2];
    if (t > 0.9) return styAgave(g, x, y, z, s * 1.1, R);
    const n = 2 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) { const a = R() * TAU, d = k ? s * 0.5 : 0, r = s * (k ? 0.55 : 0.75); puff(g, x + Math.cos(a) * d, y + r * 0.6, z + Math.sin(a) * d, r, 0.8, vary(col, R, 0.15), R, 0.15, 0.45, 1.4, false); }
    if (t >= 0.7 && t < 0.85) for (let k = 0; k < 7; k++) { const a = R() * TAU, e = R() * 1.2, r = s * 0.7; puff(g, x + Math.cos(a) * Math.cos(e) * r, y + s * 0.5 + Math.sin(e) * r * 0.8, z + Math.sin(a) * Math.cos(e) * r, s * 0.13, 1, [0.95, 0.42, 0.6], R, 0.2, 0.85, 1.15, false); }
    if (t >= 0.85) for (let k = 0; k < 9; k++) { const a = R() * TAU, d = R() * s * 0.8; sLathe(g, sXf(x + Math.cos(a) * d, y, z + Math.sin(a) * d), [[0.04, 0, [0.3, 0.4, 0.2]], [0.05, s * 0.9, [0.55, 0.4, 0.75]], [0, s * 1.1, [0.62, 0.45, 0.82]]], 4, 0); }
  }
  function styItwRock(g, x, y, z, s, R, col) {   // smooth peach boulders, half sunk, sometimes stacked
    const keep = ROCK_SMOOTH; ROCK_SMOOTH = true; const c = vary(col || [0.9, 0.78, 0.64], R, 0.08);
    rock(g, x, y + s * 0.18, z, s * (1 + R() * 0.4), s * (0.6 + R() * 0.4), s * (0.8 + R() * 0.3), R() * TAU, c, R, 0.25, 0.75);
    if (s > 0.9 && R() < 0.5) rock(g, x + (R() - 0.5) * s, y + s * 0.75, z + (R() - 0.5) * s, s * 0.6, s * 0.45, s * 0.55, R() * TAU, sMul(c, 1.04), R, 0.25, 0.8);
    for (let k = 0; k < 1 + Math.floor(R() * 3); k++) { const a = R() * TAU, d = s * (1.1 + R() * 0.6), q = s * (0.25 + R() * 0.25), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; rock(g, px, vrGround(px, pz) + q * 0.1, pz, q, q * 0.7, q * 0.9, R() * TAU, vary(c, R, 0.1), R, 0.3, 0.75); }
    ROCK_SMOOTH = keep;
  }
  function styItwVines(g, x, z, rot, L, W, R) {   // a vineyard: rows of vines on posts
    const c = Math.cos(rot), s = Math.sin(rot);
    for (let v = -W / 2; v <= W / 2; v += 1.9) { for (let u = -L / 2; u <= L / 2; u += 0.85) { const px = x + c * u - s * v, pz = z + s * u + c * v, py = vrGround(px, pz);
        puff(g, px, py + 0.75, pz, 0.42, 1.05, vary([0.24, 0.44, 0.12], R, 0.15), R, 0.2, 0.5, 1.35, false); }
      for (const u of [-L / 2 - 0.4, L / 2 + 0.4]) { const px = x + c * u - s * v, pz = z + s * u + c * v; sLathe(g, sXf(px, vrGround(px, pz), pz), [[0.05, 0, [0.42, 0.32, 0.22]], [0.04, 1.4, [0.46, 0.35, 0.24]]], 4, 0); } }
  }

  /* ---- the reference game's props: iron street lamps, wooden signposts with arrow boards, agaves, terracotta pots with geraniums, a villa's gate,
     wine barrels, café parasols with tables, a windsock, tall limestone spires ---- */
  function styLamp(g, x, y, z) {
    const iron = [0.12, 0.12, 0.13], glass = [1, 0.9, 0.62];
    sLathe(g, sXf(x, y, z), [[0.16, 0, iron], [0.14, 0.25, iron], [0.07, 0.35, iron], [0.055, 3.3, iron], [0.08, 3.4, iron]], 6, 0);
    sLathe(g, sXf(x, y + 3.4, z), [[0.1, 0, iron], [0.17, 0.12, glass], [0.19, 0.45, glass], [0.24, 0.5, iron], [0.08, 0.68, iron], [0.03, 0.8, iron]], 6, Math.PI / 6);
  }
  function styGuidepost(g, x, y, z, rot, R) {
    const wood = [0.42, 0.3, 0.2], board = [0.92, 0.86, 0.68], ink = [0.25, 0.2, 0.15];
    kBox(g, sXf(x, y, z, rot), 0.14, 2.6, 0.14, null, null, wood);
    for (const [h, dir] of [[2.15, 1], [1.75, -1]]) { const c = Math.cos(rot), s = Math.sin(rot), cx = x + c * dir * 0.55, cz = z + s * dir * 0.55;
      kBox(g, sXf(cx, y + h, cz, rot), 1.0, 0.3, 0.05, null, null, board); kBox(g, sXf(cx, y + h + 0.11, cz, rot), 0.7, 0.05, 0.06, null, null, ink);
      const tx = x + c * dir * 1.2, tz = z + s * dir * 1.2, up = [0, 0, 0]; g.dUV = KW(); sTri(g, [x + c * dir * 1.05 - s * 0.03, y + h + 0.3, z + s * dir * 1.05 + c * 0.03], [tx - s * 0.03, y + h + 0.15, tz + c * 0.03], [x + c * dir * 1.05 - s * 0.03, y + h, z + s * dir * 1.05 + c * 0.03], [-s, 0, c], [-s, 0, c], [-s, 0, c], board, board, board); }
    if (R() < 0.6) styLamp(g, x, y + 2.5, z);
  }
  function styAgave(g, x, y, z, s, R) {   // a blue-green rosette of long pointed leaves
    const n = 11 + Math.floor(R() * 5), col = vary([0.4, 0.55, 0.5], R, 0.1);
    for (let k = 0; k < n; k++) { const a = k / n * TAU + R() * 0.3, up = 0.35 + (k % 3) * 0.3 + R() * 0.2, L = s * (0.9 + R() * 0.4), w = s * 0.12, ca = Math.cos(a), sa = Math.sin(a);
      const b0 = [x - sa * w, y + 0.05, z + ca * w], b1 = [x + sa * w, y + 0.05, z - ca * w], m = [x + ca * L * 0.55, y + L * Math.sin(up) * 0.75, z + sa * L * 0.55], t = [x + ca * L * Math.cos(up * 0.6), y + L * Math.sin(up) * 0.95, z + sa * L * Math.cos(up * 0.6)], n0 = [ca * 0.3, 1, sa * 0.3];
      sTri(g, b0, m, t, n0, n0, n0, sMul(col, 0.7), col, sMul(col, 1.25)); sTri(g, b1, t, m, n0, n0, n0, sMul(col, 0.7), sMul(col, 1.25), col); sTri(g, b0, b1, m, n0, n0, n0, sMul(col, 0.7), sMul(col, 0.7), col); }
  }
  function styPot(g, x, y, z, s, R) {   // a terracotta pot with geraniums
    const tc = vary([0.74, 0.42, 0.28], R, 0.08); sLathe(g, sXf(x, y, z), [[0.18 * s, 0, sMul(tc, 0.8)], [0.24 * s, 0.35 * s, tc], [0.28 * s, 0.42 * s, sMul(tc, 1.1)], [0.22 * s, 0.44 * s, sMul(tc, 0.6)]], 8, 0);
    puff(g, x, y + 0.6 * s, z, 0.32 * s, 0.75, [0.18, 0.4, 0.12], R, 0.2, 0.5, 1.3, false);
    for (let k = 0; k < 6; k++) { const a = R() * TAU, d = R() * 0.25 * s; puff(g, x + Math.cos(a) * d, y + 0.8 * s + R() * 0.12 * s, z + Math.sin(a) * d, 0.07 * s, 1, R() < 0.7 ? [0.9, 0.16, 0.18] : [0.95, 0.5, 0.65], R, 0.2, 0.85, 1.15, false); }
  }
  function styGate(g, x, y, z, rot, R) {   // a villa's gate: two plastered pillars, an arch, a small tiled roof
    const wall = [0.9, 0.8, 0.64], c = Math.cos(rot), s = Math.sin(rot);
    for (const u of [-1.9, 1.9]) { kBox(g, sXf(x + c * u, y - 0.2, z + s * u, rot), 0.8, 3.2, 0.8, null, null, wall); kBox(g, sXf(x + c * u, y + 3.0, z + s * u, rot), 1.0, 0.25, 1.0, null, null, sMul(wall, 0.92)); }
    for (let k = 0; k < 9; k++) { const t0 = k / 9 * Math.PI, t1 = (k + 1) / 9 * Math.PI, u0 = -Math.cos(t0) * 1.5, u1 = -Math.cos(t1) * 1.5, h0 = 2.8 + Math.sin(t0) * 0.9, h1 = 2.8 + Math.sin(t1) * 0.9, um = (u0 + u1) / 2, hm = (h0 + h1) / 2;
      kBox(g, sXf(x + c * um, y + hm - 0.15, z + s * um, rot + Math.atan2(h1 - h0, u1 - u0) * 0, 1, 1, 1, Math.atan2(h1 - h0, u1 - u0)), Math.hypot(u1 - u0, h1 - h0) + 0.05, 0.35, 0.7, null, null, wall); }
    gable(g, x, y + 3.6, z, 4.8, 1.3, 0.5, rot, [0.6, 0.36, 0.25], wall);
  }
  function styBarrels(g, x, y, z, R) {
    const wood = [0.5, 0.32, 0.18], hoop = [0.2, 0.18, 0.16], n = 2 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) { const lying = R() < 0.5, a = R() * TAU, px = x + Math.cos(a) * k * 0.6, pz = z + Math.sin(a) * k * 0.6, X = lying ? sXf(px, y + 0.38, pz, R() * TAU, 1, 1, 1, Math.PI / 2) : sXf(px, y, pz);
      sLathe(g, X, [[0, lying ? -0.5 : 0, sMul(wood, 0.7)], [0.32, lying ? -0.5 : 0, hoop], [0.36, lying ? -0.3 : 0.2, wood], [0.4, lying ? 0 : 0.5, sMul(wood, 1.1)], [0.36, lying ? 0.3 : 0.8, wood], [0.32, lying ? 0.5 : 1.0, hoop], [0, lying ? 0.5 : 1.0, sMul(wood, 0.8)]], 10, 0); }
  }
  function styParasol(g, x, y, z, R) {   // a café parasol over a round table and two chairs
    const cl = R() < 0.5 ? [0.92, 0.88, 0.76] : [0.3, 0.5, 0.36], iron = [0.15, 0.15, 0.16];
    sLathe(g, sXf(x, y, z), [[0.03, 0, iron], [0.03, 2.3, iron]], 4, 0);
    sLathe(g, sXf(x, y + 2.0, z), [[1.3, 0, sMul(cl, 0.85)], [1.0, 0.25, cl], [0.4, 0.5, sMul(cl, 1.05)], [0, 0.58, cl]], 8, 0);
    sLathe(g, sXf(x, y, z), [[0.05, 0, iron], [0.04, 0.72, iron], [0.38, 0.74, [0.85, 0.82, 0.76]], [0, 0.77, [0.88, 0.86, 0.8]]], 8, 0);
    for (const a of [0, Math.PI]) { const px = x + Math.cos(a) * 0.7, pz = z + Math.sin(a) * 0.7; kBox(g, sXf(px, y, pz, a), 0.42, 0.45, 0.42, null, null, iron); kBox(g, sXf(px + Math.cos(a) * 0.2, y + 0.45, pz + Math.sin(a) * 0.2, a), 0.05, 0.45, 0.42, null, null, iron); }
  }
  function styWindsock(g, x, y, z, rot) {
    sLathe(g, sXf(x, y, z), [[0.06, 0, [0.85, 0.85, 0.85]], [0.04, 5.2, [0.9, 0.9, 0.9]]], 5, 0);
    const parts = [[0, 0.3, [0.92, 0.2, 0.15]], [0.45, 0.27, [0.95, 0.95, 0.92]], [0.9, 0.24, [0.92, 0.2, 0.15]], [1.35, 0.2, [0.95, 0.95, 0.92]], [1.8, 0.16, [0.92, 0.2, 0.15]]];
    const X = sXf(x, y + 5.0, z, rot, 1, 1, 1, -Math.PI / 2 + 0.25); sLathe(g, X, parts.map(([h, r, c]) => [r, h, c]).concat([[0, 1.85, [0.9, 0.2, 0.15]]]), 8, 0);
  }
  function stySpire(g, x, y, z, h, R) {   // a tall limestone needle, layered, a few shrubs clinging to it
    const keep = ROCK_SMOOTH; ROCK_SMOOTH = true; let yy = y - 1, r = h * 0.22;
    for (let k = 0; k < 5; k++) { const hh = h / 5 * (1.05 + R() * 0.2), c = vary([0.9, 0.76, 0.62], R, 0.07); rock(g, x + (R() - 0.5) * r * 0.3, yy + hh * 0.45, z + (R() - 0.5) * r * 0.3, r * (1 - k * 0.12), hh * 0.95, r * (0.85 - k * 0.1), R() * TAU, c, R, 0.18, 0.7); yy += hh * 0.85; r *= 0.86; }
    ROCK_SMOOTH = keep;
    for (let k = 0; k < 4; k++) puff(g, x + (R() - 0.5) * h * 0.25, y + h * (0.3 + R() * 0.65), z + (R() - 0.5) * h * 0.25, 0.9 + R() * 1.2, 0.7, [0.18, 0.3, 0.12], R, 0.2, 0.5, 1.4, false);
    puff(g, x, yy + 0.5, z, r * 0.9, 0.5, [0.2, 0.32, 0.12], R, 0.2, 0.5, 1.4, false);
  }
  function styItwProps(scen, excluded, blds) {
    const R = rng(3131), base = VR.D.base; let n = 0;
    // street lamps through the village and past the houses, a signpost now and then, a windsock on the open meadows, tall rock needles on the slopes
    for (let s = 10, k = 0; s < T.len - 10; s += 32, k++) { const i = T.idx(s), sd = k % 2 ? 1 : -1, bar = sd > 0 ? T.br[i] : T.bl[i], off = bar + 0.9, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off;
      if (vrLCf(x, z, 3) < 0.3 && T.hy[i] + base > 1000) continue; if (vrNear(x, z).dd < 0.4 || vrWater(x, z).e > -1) continue; styLamp(scen.get(x, z), x, vrGround(x, z), z); n++; }
    for (let s = 120; s < T.len - 60; s += 260 + R() * 160) { const i = T.idx(s), sd = R() < 0.5 ? -1 : 1, off = (sd > 0 ? T.br[i] : T.bl[i]) + 1.4, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off;
      if (vrNear(x, z).dd < 0.5) continue; styGuidepost(scen.get(x, z), x, vrGround(x, z), z, Math.atan2(T.tz[i], T.tx[i]), R); n++; }
    for (let s = 300; s < T.len - 60; s += 900 + R() * 500) { const i = T.idx(s), sd = R() < 0.5 ? -1 : 1, off = (sd > 0 ? T.br[i] : T.bl[i]) + 10, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off;
      if (vrLC(x, z) !== 0 || excluded(x, z)) continue; styWindsock(scen.get(x, z), x, vrGround(x, z), z, R() * TAU); n++; }
    for (let s = 200; s < T.len - 100; s += 180 + R() * 220) { const i = T.idx(s), sd = R() < 0.5 ? -1 : 1, off = (sd > 0 ? T.br[i] : T.bl[i]) + 30 + R() * 70, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off;
      if (excluded(x, z) || vrWater(x, z).e > -5 || vrNear(x, z).dd < 18 || vrDist(x, z) > 250) continue; stySpire(scen.get(x, z), x, vrGround(x, z), z, 14 + R() * 22, R); n++; }
    // by the houses: pots with geraniums at the door, barrels, a parasol and a table, a gate before the bigger ones
    for (const b of blds) { if (b.kind === 3 || b.kind === 2) continue; const c = Math.cos(b.ang), s = Math.sin(b.ang), P = (u, v) => [b.x + c * u - s * v, b.z + s * u + c * v];
      for (let k = 0; k < 3; k++) { const [x, z] = P((R() - 0.5) * b.L * 0.8, (R() < 0.5 ? -1 : 1) * (b.W / 2 + 0.5)); styPot(scen.get(x, z), x, vrGround(x, z), z, 1 + R() * 0.4, R); }
      if (R() < 0.4) { const [x, z] = P(b.L / 2 + 1.5, (R() - 0.5) * b.W); styBarrels(scen.get(x, z), x, vrGround(x, z), z, R); }
      if (R() < 0.35) { const [x, z] = P((R() - 0.5) * b.L * 0.5, -(b.W / 2 + 3.2)); if (!excluded(x, z) || true) styParasol(scen.get(x, z), x, vrGround(x, z), z, R); }
      n++; }
    return n;
  }

  /* ---- the reference look on a coast (Big Sur's world): the colours, the trees, the maquis, a sea of deep blue going turquoise at the shore,
     the reference's props along the road (lamps, signposts, agaves, peach boulders) ---- */
  function styCoastCol(c, A) {
    const l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15, sat = Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
    if (A < 0.2) { c[0] = 0.62; c[1] = 0.66; c[2] = 0.52; return; }   // the sea floor, seen through the turquoise shallows
    const rock = sstep(0.17, 0.07, sat) * sstep(0.32, 0.5, l);
    let r = c[0], g = c[1], b = c[2];
    r = r * 1.04 + 0.02; g = g * 1.04; b = b * 0.85;   // warmer
    { const gr = (1 - sstep(0.17, 0.07, sat) * sstep(0.32, 0.5, l)) * 0.45, n = VR.n4(c[0] * 0 + 0, 0); r += (0.5 - r) * gr; g += (0.53 - g) * gr; b += (0.26 - b) * gr; }
    const pr = [0.88 * (0.8 + l * 0.5), 0.74 * (0.8 + l * 0.5), 0.6 * (0.8 + l * 0.5)]; r += (pr[0] - r) * rock * 0.85; g += (pr[1] - g) * rock * 0.85; b += (pr[2] - b) * rock * 0.85;   // peach limestone
    c[0] = r; c[1] = g; c[2] = b;
  }
  function styCoastScatter(scen, gnd, excluded, y0) {
    const R = rng(6262), w = T.w; let n = 0;
    for (let s = 6; s < T.len - 6; s += 2.2) for (const sd of [-1, 1]) {
      const i = T.idx(s + (R() - 0.5) * 2), bar = sd > 0 ? T.br[i] : T.bl[i], off = bar + 0.5 + Math.pow(R(), 1.3) * 8, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off;
      if (vrNear(x, z).dd < 0.5 || (excluded && excluded(x, z))) continue; const y = gnd(x, z); if (y < y0 + 1.5) continue;
      const g = scen.get(x, z), r = R();
      if (r < 0.38) styItwBush(g, x, y, z, 0.9 + R() * 0.9, R); else if (r < 0.55) styItwRock(g, x, y, z, 0.5 + R() * 0.8, R); else if (r < 0.63) styAgave(g, x, y, z, 0.9 + R() * 0.5, R);
      else if (r < 0.78) { for (let k = 0; k < 3; k++) styFlower(g, x + (R() - 0.5), y, z + (R() - 0.5), 1 + R() * 0.4, R); } else styTuft(g, x, y, z, 1.1, R, [0.62, 0.6, 0.3]);
      n++; }
    for (let s = 6; s < T.len - 6; s += 3) for (const sd of [-1, 1]) { const i = T.idx(s + (R() - 0.5) * 3), off = (sd > 0 ? T.br[i] : T.bl[i]) + 8 + R() * 45, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off;
      if (R() > 0.55) continue; const y = gnd(x, z); if (y < y0 + 2) continue; const g = scen.get(x, z), r = R();
      if (r < 0.7) styItwBush(g, x, y, z, 1.4 + R() * 1.6, R); else if (r < 0.85) styItwRock(g, x, y, z, 0.8 + R() * 1.4, R); else styAgave(g, x, y, z, 1.1, R); n++; }
    for (let s = 10, k = 0; s < T.len - 10; s += 45, k++) { const i = T.idx(s), sd = k % 2 ? 1 : -1, off = (sd > 0 ? T.br[i] : T.bl[i]) + 0.9, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off; const y = gnd(x, z); if (y < y0 + 1.5) continue; styLamp(scen.get(x, z), x, y, z); }
    for (let s = 150; s < T.len - 60; s += 300 + R() * 200) { const i = T.idx(s), sd = R() < 0.5 ? -1 : 1, off = (sd > 0 ? T.br[i] : T.bl[i]) + 1.4, x = T.px[i] + T.nx[i] * sd * off, z = T.pz[i] + T.nz[i] * sd * off, y = gnd(x, z); if (y < y0 + 1.5) continue; styGuidepost(scen.get(x, z), x, y, z, Math.atan2(T.tz[i], T.tx[i]), R); }
    return n;
  }

  function styAnimalLowGeo(kind) {   // the same animals for a phone: a body and a head (icosahedra), the legs as two thin boxes, ~180 vertices
    const g = new GB(), R = rng(70 + kind), keep = ROCK_SMOOTH; ROCK_SMOOTH = true;
    const C = kind === 3 ? [[0.94, 0.92, 0.86], [0.15, 0.13, 0.12], 0.45, 0.62, 1.0] : kind === 4 ? [[0.62, 0.42, 0.24], [0.2, 0.16, 0.12], 0.6, 0.9, 1.25] : kind === 1 ? [[0.36, 0.27, 0.2], [0.12, 0.1, 0.09], 0.4, 0.7, 0.95] : [[0.62, 0.38, 0.18], [0.3, 0.2, 0.12], 0.4, 0.75, 1.0];
    const [body, dark, r, h, L] = C;
    ico(g, 0, h, 0, r, 0.75, body, R, 0.1); g.P.length && 0;
    const P0 = g.P.length / 3; for (let k = P0 - 60; k < P0; k++) g.P[k * 3] *= L / (r * 1.4);   // (stretched along x)
    ico(g, L * 0.62, h + r * 0.45, 0, r * 0.42, 0.9, kind === 3 ? dark : body, R, 0.1);
    box(g, L * 0.35, 0, 0, 0.12, h - r * 0.4, r * 0.9, 0, dark, null, true); box(g, -L * 0.35, 0, 0, 0.12, h - r * 0.4, r * 0.9, 0, dark, null, true);
    ROCK_SMOOTH = keep; const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function styAnimalGeo(kind) { const g = new GB(); if (kind <= 2) styAnimal(g, 0, 0, 0, 0, kind === 2 ? 1.3 : 1.6, rng(50 + kind), kind); else styAnimal2(g, 0, 0, 0, 0, rng(50 + kind), kind); const geo = g.geometry(); geo.computeBoundingSphere(); return geo; }
  /* ---- the reference's houses: a peach stone plinth, plastered walls in cream, ochre, peach or pale pink, tall windows with open shutters
     (green, teal, blue or brown) and a stone sill, flower boxes with red geraniums, an arched wooden door, a small iron balcony upstairs, a low
     terracotta roof with deep eaves, sometimes a pergola with a vine on the garden side ---- */
  const ITW_WALLS = [[0.94, 0.86, 0.7], [0.92, 0.76, 0.56], [0.95, 0.8, 0.66], [0.93, 0.74, 0.68], [0.96, 0.9, 0.74], [0.86, 0.68, 0.48]];
  const ITW_SHUT = [[0.24, 0.46, 0.32], [0.2, 0.48, 0.5], [0.26, 0.38, 0.56], [0.42, 0.28, 0.18]];
  function styItwHouse(g, x, y0, y1, z, rot, L, D, fl, R) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (u, v) => [x + c * u - s * v, z + s * u + c * v], yb = y1 + 0.5, fh = 3.0, H = fl * fh;
    const wall = vary(ITW_WALLS[Math.floor(R() * ITW_WALLS.length)], R, 0.04), sh = ITW_SHUT[Math.floor(R() * ITW_SHUT.length)], stone = [0.84, 0.72, 0.58], dark = [0.16, 0.15, 0.17], iron = [0.14, 0.14, 0.15];
    box(g, x, y0 - 0.5, z, L + 0.3, yb - y0 + 0.5, D + 0.3, rot, stone, null, true);   // the plinth
    box(g, x, yb, z, L, H, D, rot, wall, sMul(wall, 1.05), true);                       // the plastered walls
    box(g, x, yb + H - 0.32, z, L + 0.12, 0.32, D + 0.12, rot, sMul(wall, 0.86), null, true);   // a cornice under the eaves
    const geran = () => R() < 0.75 ? [0.9, 0.16, 0.18] : [0.96, 0.5, 0.66];
    const facade = (len, vOut, rr, door) => {   // the windows on one face (len along it, vOut: its distance from the centre, rr: its turn)
      const n = Math.max(1, Math.round(len / 3.1)), cc = Math.cos(rr), ss = Math.sin(rr), Q = (u, v) => [x + cc * u - ss * v, z + ss * u + cc * v];
      for (let f = 0; f < fl; f++) for (let k = 0; k < n; k++) {
        const u = (k + 0.5 - n / 2) * (len / n), y = yb + f * fh + 0.95, isDoor = door && f === 0 && k === Math.floor(n / 2);
        if (isDoor) { const [dx, dz] = Q(u, vOut + 0.04); box(g, dx, yb - 0.02, dz, 1.3, 2.35, 0.1, rr, [0.42, 0.27, 0.16], null, true); const [ax, az] = Q(u, vOut + 0.05); box(g, ax, yb + 2.33, az, 1.5, 0.22, 0.12, rr, stone, null, true);
          if (!(STYV && STYV.keep)) { const [px, pz] = Q(u + 1.2, vOut + 0.5); styPot(g, px, yb, pz, 1.2, R); const [qx, qz] = Q(u - 1.2, vOut + 0.5); styPot(g, qx, yb, qz, 1.0, R); } continue; }
        const [wx, wz] = Q(u, vOut + 0.03); box(g, wx, y, wz, 0.95, 1.45, 0.08, rr, dark, null, true);           // the glass
        const [fx, fz] = Q(u, vOut + 0.05); box(g, fx, y - 0.12, fz, 1.15, 0.12, 0.2, rr, stone, null, true);   // the sill
        for (const sd of [-1, 1]) { const [hx, hz] = Q(u + sd * 0.78, vOut + 0.07); box(g, hx, y, hz, 0.48, 1.45, 0.06, rr, vary(sh, R, 0.06), null, true); }   // the open shutters
        if (f > 0 && R() < 0.45) { const [bx, bz] = Q(u, vOut + 0.22); box(g, bx, y - 0.02, bz, 0.95, 0.24, 0.26, rr, [0.6, 0.36, 0.24], null, true);   // a flower box
          for (let q = 0; q < 5; q++) puff(g, bx + cc * (q - 2) * 0.18, y + 0.3, bz + ss * (q - 2) * 0.18, 0.14, 0.9, q % 2 ? [0.2, 0.42, 0.14] : geran(), R, 0.2, 0.75, 1.2, false); }
        if (f === 1 && k === Math.floor(n / 2) && R() < 0.55) { const [bx, bz] = Q(u, vOut + 0.55); box(g, bx, y - 0.95 - 0.12, bz, 1.6, 0.14, 1.0, rr, stone, null, false);   // a small balcony
          const [rx, rz] = Q(u, vOut + 1.02); box(g, rx, y - 0.95, rz, 1.6, 0.9, 0.05, rr, iron, null, true); }
      }
    };
    facade(L, D / 2, rot, true); facade(L, D / 2, rot + Math.PI, false); facade(D, L / 2, rot + Math.PI / 2, false); facade(D, L / 2, rot - Math.PI / 2, false);
    const roof = vary([[0.76, 0.42, 0.28], [0.7, 0.38, 0.26], [0.8, 0.48, 0.32]][Math.floor(R() * 3)], R, 0.05);
    gable(g, x, yb + H, z, L + 1.4, D + 1.4, Math.min(L, D) * 0.2, rot, roof, wall);
    if (R() < 0.45 && !(STYV && STYV.keep)) {   // a pergola with a vine on one long side
      const [px, pz] = P(0, -(D / 2 + 1.8)), wood = [0.46, 0.32, 0.2];
      for (const u of [-L * 0.35, L * 0.35]) { const [qx, qz] = P(u, -(D / 2 + 3.2)); box(g, qx, yb - 0.05, qz, 0.18, 2.6, 0.18, rot, wood, null, true); }
      box(g, px, yb + 2.5, pz, L * 0.8, 0.14, 3.4, rot, wood, null, false);
      for (let q = 0; q < 7; q++) { const [vx, vz] = P((R() - 0.5) * L * 0.7, -(D / 2 + 1.0 + R() * 2.4)); puff(g, vx, yb + 2.75, vz, 0.6 + R() * 0.4, 0.45, vary([0.26, 0.44, 0.14], R, 0.15), R, 0.2, 0.5, 1.35, false); }
      const [tx, tz] = P(L * 0.1, -(D / 2 + 1.8)); styParasol(g, tx, yb, tz, R);
    }
  }
  // Jasna's lakes in the reference's water: clear turquoise over the pale shallows, a deep teal-blue farther out, the sky mirrored in patches
  const ITW_LAKE = { deep: [0.05, 0.36, 0.5], shal: [0.28, 0.74, 0.72], sky: [0.62, 0.8, 0.92] };
  // the ground's painted look: the grit map replaced by soft brush strokes (the same mean, so the colours stay)
  let styBrushT = null;
  function styBrushTex(mean) {
    if (styBrushT) return styBrushT;
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), R = rng(3535), m = Math.round(mean * 255);
    x.fillStyle = `rgb(${m},${m},0)`; x.fillRect(0, 0, S, S);
    for (let k = 0; k < 9000; k++) { const px = R() * S, py = R() * S, len = 5 + R() * 12, wd = 1 + R() * 1.8, a = -Math.PI / 2 + (R() - 0.5) * 1.2, v = Math.max(0, Math.min(255, Math.round(m * (0.8 + R() * 0.38)))), al = (0.35 + R() * 0.4).toFixed(2);
      x.strokeStyle = `rgba(${v},${v},0,${al})`; x.lineWidth = wd; x.lineCap = 'round';
      for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) { x.beginPath(); x.moveTo(px + ox, py + oy); x.quadraticCurveTo(px + ox + Math.cos(a) * len * 0.5 + 3, py + oy + Math.sin(a) * len * 0.5, px + ox + Math.cos(a) * len, py + oy + Math.sin(a) * len); x.stroke(); } }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return (styBrushT = t);
  }

  /* ---- trees and bushes after the reference (Into the Wind): the foliage in clumps of leaf cards (an alpha-cut painted leaf atlas: broadleaf,
     pine needles, cypress scales, olive leaves; the bark in the fourth cell), the cards' normals bent out from the clump's centre (soft, round light),
     darker inside and below, sunlit yellow-green at the top; the trunks bent and forked, the branches out to the clumps ---- */
  let styLeafT = null, STY_CARDS = null;
  function styLeafTex() {
    if (styLeafT) return styLeafT;
    const S = 1024, H = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), R = rng(2468);
    const cellO = (k) => [(k % 2) * H, Math.floor(k / 2) * H];
    const clumpMask = (cx, cy, rad, pts) => { const out = []; for (let q = 0; q < pts; q++) { const a = R() * TAU, d = Math.sqrt(R()) * rad; out.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9]); } return out; };
    const shade = (base, t, j) => base.map((v, i) => Math.max(0, Math.min(255, Math.round(v * (0.55 + 0.75 * t) + (j || 0)))));
    // 0: a broadleaf clump: many small rounded leaves, darker at the bottom right, lit at the top left
    { const [ox, oy] = cellO(0), cx = ox + H / 2, cy = oy + H / 2;
      for (const [px, py] of clumpMask(cx, cy, H * 0.42, 1100)) { const t = Math.max(0, Math.min(1, 0.55 - (px - cx) / H * 0.6 - (py - cy) / H * 1.1 + (R() - 0.5) * 0.35)), col = shade([92, 140, 52], t, (R() - 0.5) * 14), a = R() * TAU, l = 9 + R() * 9;
        x.fillStyle = `rgb(${col})`; x.beginPath(); x.ellipse(px, py, l, l * 0.55, a, 0, TAU); x.fill(); x.strokeStyle = `rgba(30,50,20,0.35)`; x.lineWidth = 1.2; x.beginPath(); x.moveTo(px - Math.cos(a) * l * 0.8, py - Math.sin(a) * l * 0.8); x.lineTo(px + Math.cos(a) * l * 0.8, py + Math.sin(a) * l * 0.8); x.stroke(); } }
    // 1: pine needles: tufts of radiating needles, dark green with lighter tips
    { const [ox, oy] = cellO(1), cx = ox + H / 2, cy = oy + H / 2;
      for (const [px, py] of clumpMask(cx, cy, H * 0.38, 150)) { const t0 = Math.max(0, Math.min(1, 0.5 - (py - cy) / H * 1.2 + (R() - 0.5) * 0.3)), n = 22 + Math.floor(R() * 12);
        for (let q = 0; q < n; q++) { const a = R() * TAU, l = 14 + R() * 26, col = shade([52, 96, 46], t0 * 0.8 + R() * 0.25, 0); x.strokeStyle = `rgb(${col})`; x.lineWidth = 2 + R() * 1.6; x.lineCap = 'round';
          x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l * 0.75); x.stroke(); } } }
    // 2: cypress scales / olive: tight upward sprays, deep green (the olive's silver comes from the vertex tint)
    { const [ox, oy] = cellO(2), cx = ox + H / 2, cy = oy + H / 2;
      for (const [px, py] of clumpMask(cx, cy, H * 0.42, 900)) { const t = Math.max(0, Math.min(1, 0.5 - (px - cx) / H * 0.5 - (py - cy) / H * 0.9 + (R() - 0.5) * 0.3)), col = shade([62, 104, 58], t, (R() - 0.5) * 12), a = -Math.PI / 2 + (R() - 0.5) * 1.4, l = 7 + R() * 9;
        x.fillStyle = `rgb(${col})`; x.beginPath(); x.ellipse(px, py, l, l * 0.38, a, 0, TAU); x.fill(); } }
    // 3: bark: grey-brown with dark vertical fissures and light ridges (opaque)
    { const [ox, oy] = cellO(3); x.fillStyle = 'rgb(122,100,84)'; x.fillRect(ox, oy, H, H);
      for (let q = 0; q < 900; q++) { const px = ox + R() * H, py = oy + R() * H, l = 10 + R() * 40; x.strokeStyle = R() < 0.5 ? 'rgba(60,40,30,0.55)' : 'rgba(170,140,112,0.45)'; x.lineWidth = 1.5 + R() * 3; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (R() - 0.5) * 6, py + l); x.stroke(); } }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (styLeafT = t);
  }
  const LEAF = (k) => { const u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.5; return [u0 + 0.004, v1 - 0.5 + 0.004, u0 + 0.496, v1 - 0.004]; };
  function styCardMat() { return new THREE.MeshLambertMaterial({ map: styLeafTex(), vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }); }
  function styCardDepth() { return new THREE.MeshDepthMaterial({ map: styLeafTex(), alphaTest: 0.5, depthPacking: THREE.RGBADepthPacking }); }
  // a clump: n cards round (cx, cy, cz), radius r (squashed vertically by sy), on leaf cell k; lo / hi: the light inside and on top
  function styClump(g, cx, cy, cz, r, sy, n, k, R, tint, lo, hi) {
    n = Math.round(n * 1.35);
    const [u0, v0, u1, v1] = LEAF(k); tint = tint || [1, 1, 1]; lo = lo == null ? 0.55 : lo; hi = (hi == null ? 1.3 : hi) * 1.1;
    for (let q = 0; q < n; q++) {
      let dx = R() * 2 - 1, dy = R() * 1.6 - 0.5, dz = R() * 2 - 1; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      const d = r * (0.3 + R() * 0.5), px = cx + dx * d, py = cy + dy * d * sy, pz = cz + dz * d, s = r * (1.0 + R() * 0.55);
      // the card faces roughly outward, turned at random about that
      let ax = -dz, az = dx; const al = Math.hypot(ax, az) || 1; ax /= al; az /= al; const tw = R() * TAU, ca = Math.cos(tw), sa = Math.sin(tw);
      const ux = ax * ca, uy = sa * 0.9, uz = az * ca, vx = dy * az * 0 - (ax * sa) * 0.6, vy = ca, vz = -(az * sa) * 0.6;
      const P = (a, b) => [px + (ux * a + vx * b) * s, py + (uy * a + vy * b) * s * Math.max(0.6, sy), pz + (uz * a + vz * b) * s];
      const corners = [P(-0.5, -0.5), P(0.5, -0.5), P(0.5, 0.5), P(-0.5, 0.5)], uvs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
      const N = corners.map(p => { let nx = p[0] - cx, ny = (p[1] - cy) / Math.max(0.4, sy) + r * 0.35, nz = p[2] - cz; const l = Math.hypot(nx, ny, nz) || 1; return [nx / l, ny / l, nz / l]; });
      const C = corners.map(p => { const t = Math.max(0, Math.min(1, ((p[1] - cy) / (r * sy) * 0.5 + 0.5) * 0.7 + 0.3 * (Math.hypot(p[0] - cx, p[2] - cz) / r))), kk = lo + (hi - lo) * t; return [tint[0] * kk, tint[1] * kk, tint[2] * kk]; });
      g.triN(corners[0], corners[1], corners[2], N[0], N[1], N[2], C[0], C[1], C[2], uvs[0], uvs[1], uvs[2]);
      g.triN(corners[0], corners[2], corners[3], N[0], N[2], N[3], C[0], C[2], C[3], uvs[0], uvs[2], uvs[3]);
    }
  }
  function styTube(g, p0, p1, r0, r1, col, n) {   // a bark-textured tube from p0 to p1
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], L = Math.hypot(dx, dy, dz), yaw = Math.atan2(dz, dx), tilt = -Math.atan2(Math.hypot(dx, dz), dy);
    const X = sXf(p0[0], p0[1], p0[2], yaw, 1, 1, 1, tilt), [u0, v0, u1, v1] = LEAF(3); n = n || 5;
    for (let j = 0; j < n; j++) { const a0 = j / n * TAU, a1 = (j + 1) / n * TAU, Q = (a, y, r) => sP(X, Math.cos(a) * r, y, Math.sin(a) * r), Nn = (a) => sN(X, Math.cos(a), 0, Math.sin(a));
      const c0 = sMul(col, 0.75 + 0.3 * Math.max(0, Math.cos(a0 - 2.4))), c1 = sMul(col, 0.75 + 0.3 * Math.max(0, Math.cos(a1 - 2.4))), uA = u0 + (u1 - u0) * j / n, uB = u0 + (u1 - u0) * (j + 1) / n;
      g.triN(Q(a0, 0, r0), Q(a1, 0, r0), Q(a1, L, r1), Nn(a0), Nn(a1), Nn(a1), c0, c1, c1, [uA, v0], [uB, v0], [uB, v1]);
      g.triN(Q(a0, 0, r0), Q(a1, L, r1), Q(a0, L, r1), Nn(a0), Nn(a1), Nn(a0), c0, c1, c0, [uA, v0], [uB, v1], [uA, v1]); }
  }
  function styBranchTo(g, from, to, r0, r1, col, R) {   // a bent limb: two segments with a kink
    const m = [(from[0] + to[0]) / 2 + (R() - 0.5) * 0.06, (from[1] + to[1]) / 2 + 0.03, (from[2] + to[2]) / 2 + (R() - 0.5) * 0.06];
    styTube(g, from, m, r0, (r0 + r1) / 2, col, 5); styTube(g, m, to, (r0 + r1) / 2, r1, col, 4);
  }
  function styCardTree(kind) {
    const g = new GB(true), R = rng(9100 + kind), bark = [0.78, 0.68, 0.6];
    const trunk = (pts, r0, r1) => { r0 *= 0.7; r1 *= 0.7; for (let q = 0; q + 1 < pts.length; q++) styTube(g, pts[q], pts[q + 1], r0 + (r1 - r0) * q / (pts.length - 1), r0 + (r1 - r0) * (q + 1) / (pts.length - 1), bark, 6); };
    if (kind === 4 || kind === 10) {   // cypress: a tall narrow flame of scale sprays
      trunk([[0, 0, 0], [0, 0.2, 0]], 0.025, 0.02);
      for (let q = 0; q < 9; q++) { const y = 0.1 + q * 0.1, r = 0.15 * Math.sin(Math.min(1, (y + 0.05) / 0.98) * Math.PI) * (q < 2 ? 0.8 : 1) + 0.03; styClump(g, (R() - 0.5) * 0.02, y, (R() - 0.5) * 0.02, r, 1.2, 9, 2, R, [0.82, 0.92, 0.82], 0.5, 1.2); }
    } else if (kind === 1 || kind === 6) {   // stone pine: a tall leaning trunk forking into an umbrella of needle clumps
      const lean = 0.1 + R() * 0.08, top = [Math.sin(lean) * 0.55, 0.66, 0.02]; trunk([[0, 0, 0], [top[0] * 0.4, 0.3, 0], top], 0.04, 0.026);
      for (let q = 0; q < 6; q++) { const a = q / 6 * TAU + R() * 0.4, d = 0.18 + R() * 0.12, end = [top[0] + Math.cos(a) * d, 0.8 + R() * 0.05, top[2] + Math.sin(a) * d]; styBranchTo(g, top, end, 0.018, 0.008, bark, R); styClump(g, end[0], end[1] + 0.02, end[2], 0.2 + R() * 0.05, 0.45, 14, 1, R, [1, 1, 1], 0.5, 1.35); }
      styClump(g, top[0], 0.86, top[2], 0.17, 0.4, 14, 1, R, [1.05, 1.05, 1], 0.55, 1.4);
    } else if (kind === 0 || kind === 5) {   // Aleppo pine: a slender bending trunk, limbs up to irregular clumps of needles at several heights
      const pts = [[0, 0, 0]]; let px = 0, pz = 0; for (let q = 1; q <= 4; q++) { px += (R() - 0.5) * 0.06; pz += (R() - 0.5) * 0.06; pts.push([px, q * 0.2, pz]); } trunk(pts, 0.032, 0.012);
      for (let q = 0; q < 6; q++) { const y = 0.38 + q * 0.09 + R() * 0.04, base = [px * y / 0.8, y, pz * y / 0.8], a = R() * TAU, d = 0.1 + R() * 0.12 * (1 - q / 7), end = [base[0] + Math.cos(a) * d, y + 0.06, base[2] + Math.sin(a) * d];
        styBranchTo(g, base, end, 0.012, 0.006, bark, R); styClump(g, end[0], end[1], end[2], 0.16 - q * 0.01, 0.6, 12, 1, R, [1, 1, 1], 0.5, 1.35); }
      styClump(g, px, 0.86, pz, 0.1, 0.75, 10, 1, R, [1.05, 1.05, 1], 0.55, 1.4);
    } else if (kind === 3 || kind === 7) {   // a bush: a few leafy clumps on the ground
      for (let q = 0; q < 5; q++) { const a = q / 5 * TAU + R(), d = q ? 0.36 + R() * 0.1 : 0; styClump(g, Math.cos(a) * d, 0.42 + (q ? 0 : 0.12), Math.sin(a) * d, q ? 0.36 : 0.46, 0.75, 16, 0, R, [0.85, 0.95, 0.85], 0.45, 1.25); }
    } else if (kind === 8) {   // olive: a short gnarled trunk, a rounded crown of grey-green leaves
      trunk([[0, 0, 0], [0.04, 0.18, 0.02], [-0.02, 0.36, 0.03]], 0.06, 0.035);
      for (let q = 0; q < 6; q++) { const a = q / 6 * TAU + R() * 0.5, d = q ? 0.2 + R() * 0.06 : 0, end = [Math.cos(a) * d, 0.52 + R() * 0.1, Math.sin(a) * d]; if (q) styBranchTo(g, [-0.02, 0.36, 0.03], end, 0.022, 0.01, bark, R); styClump(g, end[0], end[1], end[2], 0.2, 0.65, 15, 2, R, [1.05, 1.08, 1.0], 0.55, 1.35); }
    } else {   // a broadleaf (holm oak, chestnut): a trunk forking into limbs, a round crown of leafy clumps
      const top = [(R() - 0.5) * 0.04, 0.34, (R() - 0.5) * 0.04]; trunk([[0, 0, 0], [top[0] * 0.5, 0.18, top[2] * 0.5], top], 0.05, 0.035);
      const tint = kind === 9 ? [1.08, 1.1, 0.95] : kind === 2 ? [0.95, 1, 0.92] : [1, 1, 1];
      for (let q = 0; q < 9; q++) { const a = q / 8 * TAU + R() * 0.5, e = q === 8 ? 1.2 : (R() - 0.1) * 0.9, d = q === 8 ? 0.05 : 0.22 + R() * 0.06, end = [Math.cos(a) * Math.cos(e) * d, 0.62 + Math.sin(e) * 0.2, Math.sin(a) * Math.cos(e) * d];
        if (q < 8) styBranchTo(g, top, end, 0.025, 0.01, bark, R); styClump(g, end[0], end[1], end[2], 0.19 + R() * 0.04, 0.75, 14, 0, R, tint, 0.45, 1.3); }
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function styCardBush(x, y, z, s, R, flowers) {   // a bush of leaf cards into the card chunks (blossom as small puffs, pink or white)
    const g = STY_CARDS.get(x, z), n = 2 + Math.floor(R() * 3), tint = R() < 0.3 ? [0.75, 0.88, 0.7] : [0.88, 0.98, 0.85];
    for (let q = 0; q < n; q++) { const a = R() * TAU, d = q ? s * 0.5 : 0, r = s * (q ? 0.5 : 0.65); styClump(g, x + Math.cos(a) * d, y + r * 0.75, z + Math.sin(a) * d, r, 0.8, 9, R() < 0.25 ? 2 : 0, R, tint, 0.45, 1.25); }
    if (flowers) { const W = LEAF(3); g.dUV = [W[0] + 0.01, W[1] + 0.01]; }
  }

  // keep mode: the game's own thing is made as before (the same random draws, so everything else stays where it was), into a scratch builder;
  // its size and place are read from it and the new design drawn there instead
  function styKeep(g, kind, fn) {
    if (!(styOn() && STYV.keep)) return fn(g);
    const d = new GB(); fn(d); styKeepAfter(g, d, kind);
  }
  function styKeepAfter(g, d, kind) {
    const P = d.P; if (!P.length) return;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9; for (let k = 0; k < P.length; k += 3) { x0 = Math.min(x0, P[k]); x1 = Math.max(x1, P[k]); y0 = Math.min(y0, P[k + 1]); y1 = Math.max(y1, P[k + 1]); z0 = Math.min(z0, P[k + 2]); z1 = Math.max(z1, P[k + 2]); }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = Math.max(x1 - x0, z1 - z0), R = rng((Math.round(cx * 7) * 73856093) ^ (Math.round(cz * 7) * 19349663));
    if (kind === 'bush' && STYV.cards && STY_CARDS) styCardBush(cx, y0 - 0.1, cz, w * 0.6, R);
    else if (kind === 'rock') { const keep = ROCK_SMOOTH; ROCK_SMOOTH = true; rock(g, cx, y0 + (y1 - y0) * 0.4, cz, (x1 - x0) * 0.5, (y1 - y0) * 0.85, (z1 - z0) * 0.5, R() * TAU, [0.9 * (0.95 + R() * 0.1), 0.78, 0.64], R, 0.22, 0.75); ROCK_SMOOTH = keep; }
  }
  // Monaco in keep mode: its palms and hillside trees are noted (not drawn) and come back here in the new design, instanced
  let STY_MC = null;
  function styPalmGeo() {
    const g = new GB(true), R = rng(4040), bark = [0.8, 0.68, 0.56];
    styTube(g, [0, 0, 0], [0.02, 0.5, 0], 0.035, 0.03, bark, 6); styTube(g, [0.02, 0.5, 0], [0.06, 0.95, 0], 0.03, 0.026, bark, 6);
    const [u0, v0, u1, v1] = LEAF(0);
    for (let k = 0; k < 11; k++) { const a = k / 11 * TAU + R() * 0.3, L = 0.32 + R() * 0.08, ca = Math.cos(a), sa = Math.sin(a);
      for (let q = 0; q < 4; q++) { const t0 = q / 4, t1 = (q + 1) / 4, P = (t, w) => [0.06 + ca * L * t - sa * w, 0.95 + 0.06 * t - 0.22 * t * t, ca * w + sa * L * t], wd = 0.07 * (1 - t0 * 0.6), n = [0, 1, 0], col = sMul([0.85, 1.0, 0.8], 0.7 + 0.5 * (1 - t0));
        g.triN(P(t0, -wd), P(t1, -wd * 0.8), P(t1, wd * 0.8), n, n, n, col, col, col, [u0, v0], [u1, v0], [u1, v1]); g.triN(P(t0, -wd), P(t1, wd * 0.8), P(t0, wd), n, n, n, col, col, col, [u0, v0], [u1, v1], [u0, v1]); } }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function styMcCards() {
    if (!STY_MC) return null; const grp = new THREE.Group(), mat = styCardMat(), dm = styCardDepth(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    const put = (geo, L, wid) => { if (!L.length) return; const im = new THREE.InstancedMesh(geo, mat, L.length); L.forEach(([x, y, z, h, r], k) => { e.set(0, r, 0); q.setFromEuler(e); v.set(x, y, z); sc.set(h * wid, h, h * wid); m4.compose(v, q, sc); im.setMatrixAt(k, m4); }); im.castShadow = true; im.receiveShadow = true; im.customDepthMaterial = dm; im.frustumCulled = false; grp.add(im); };
    if (STY_MC.pines) { put(styCardTree(2), STY_MC.trees.filter((_, k) => k % 4), 1.35); put(styCardTree(8), STY_MC.trees.filter((_, k) => !(k % 4)), 1.3); put(styCardTree(0), STY_MC.pines, 1.15); put(styCardTree(4), STY_MC.cyp, 0.85); }
    else { put(styPalmGeo(), STY_MC.palms, 1); put(styCardTree(2), STY_MC.trees.filter((_, k) => k % 3), 0.75); put(styCardTree(1), STY_MC.trees.filter((_, k) => !(k % 3)), 0.8); }
    STY_MC = null; return grp;
  }
  if (typeof window !== 'undefined') window.__STYK = { mcCards: styMcCards, lakes: () => (VR ? VR.lakes.map(L => ({ cx: L.cx, cz: L.cz, h: L.h, area: L.area })) : []), animalGeo: styAnimalGeo, animalLowGeo: styAnimalLowGeo, crash: styCrashFx, city: styCity, top: styTop, kit: styKit, zone: styZone };
