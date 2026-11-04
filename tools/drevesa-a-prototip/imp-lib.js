
  /* ================= IMP: five improvements to the current look, one switch each (window.__STY = { keep: true, only: { edge, road, grass, trees, ao } }) ================= */
  function styF(k) { if (!styOn()) return false; const o = STYV.only; return !o || !!o[k]; }
  let IMP_AO = null;   // x, y, z, r for every tree, bush and stone (the soft contact shadows)
  function impAoBox(P, n0, kind) {
    if (!IMP_AO || P.length <= n0) return;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, z0 = 1e9, z1 = -1e9; for (let k = n0; k < P.length; k += 3) { x0 = Math.min(x0, P[k]); x1 = Math.max(x1, P[k]); y0 = Math.min(y0, P[k + 1]); z0 = Math.min(z0, P[k + 2]); z1 = Math.max(z1, P[k + 2]); }
    IMP_AO.push((x0 + x1) / 2, y0, (z0 + z1) / 2, Math.max(x1 - x0, z1 - z0) * (kind === 'rock' ? 0.85 : 0.8), kind === 'rock' ? 0.8 : 1);
  }
  function impKeep(g, kind, fn) {   // the game's bush or stone, as before or (switched on) in the new design at the same place and size
    if (kind === 'bush' && styF('trees') && !impCards()) { const d = new GB(); fn(d); const P = d.P; let x0 = 1e9, x1 = -1e9, y0 = 1e9, z0 = 1e9, z1 = -1e9; for (let k = 0; k < P.length; k += 3) { x0 = Math.min(x0, P[k]); x1 = Math.max(x1, P[k]); y0 = Math.min(y0, P[k + 1]); z0 = Math.min(z0, P[k + 2]); z1 = Math.max(z1, P[k + 2]); }
      impBushSolid(g, (x0 + x1) / 2, y0, (z0 + z1) / 2, Math.max(x1 - x0, z1 - z0), rng(Math.round(x0 * 13 + z0 * 7))); return; }
    const swap = kind === 'bush' ? styF('trees') && STY_CARDS : styF('rocks');
    if (swap) { const d = new GB(); fn(d); styKeepAfter(g, d, kind); impAoBox(d.P, 0, kind); return; }
    const n0 = g.P.length; fn(g); impAoBox(g.P, n0, kind);
  }
  function impGround(c, x, z, h) {   // the vivid meadow (as picked), the land's shape shaded in: hollows darker and lusher, crests lighter and drier
    const l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15, sat = (STYV && STYV.gSat) || 1.35, bri = (STYV && STYV.gBri) || 1.04; for (let k = 0; k < 3; k++) c[k] = Math.max(0, (l + (c[k] - l) * sat) * bri);
    if (VRS === 'summer') { c[0] *= 0.92; c[1] *= 1.05; c[2] *= 0.8; }
    const e = 10, hm = (vrGround(x + e, z) + vrGround(x - e, z) + vrGround(x, z + e) + vrGround(x, z - e)) / 4, cv = Math.max(-1, Math.min(1, (hm - vrGround(x, z)) / 1.2));
    const k = 1 - 0.26 * Math.max(0, cv) + 0.14 * Math.max(0, -cv);
    c[0] *= k * (cv > 0 ? 0.94 : 1 + 0.06 * -cv); c[1] *= k; c[2] *= k * (cv > 0 ? 1.04 : 1 - 0.08 * -cv);
  }
  let impAoT = null;
  function impAoMesh(root) {   // one instanced draw: a soft dark disc on the ground under every tree, bush and stone, tilted to the slope
    if (!IMP_AO || !IMP_AO.length) return null;
    if (!impAoT) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gd = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gd.addColorStop(0, 'rgba(255,255,255,1)'); gd.addColorStop(0.4, 'rgba(255,255,255,0.7)'); gd.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gd; x.fillRect(0, 0, 64, 64); impAoT = new THREE.CanvasTexture(c); }
    const mat = new THREE.MeshBasicMaterial({ color: 0x0c1a08, alphaMap: impAoT, transparent: true, opacity: (STYV && STYV.aoK) || 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const geo = new THREE.PlaneGeometry(2, 2); geo.rotateX(-Math.PI / 2);
    const n = IMP_AO.length / 5, im = new THREE.InstancedMesh(geo, mat, n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), nv = new THREE.Vector3(), p = new THREE.Vector3(), s = new THREE.Vector3();
    for (let k = 0; k < n; k++) { const x0 = IMP_AO[k * 5], z0 = IMP_AO[k * 5 + 2], r = IMP_AO[k * 5 + 3] * IMP_AO[k * 5 + 4], d = Math.max(0.6, r * 0.6);
      nv.set(vrGround(x0 - d, z0) - vrGround(x0 + d, z0), 2 * d, vrGround(x0, z0 - d) - vrGround(x0, z0 + d)).normalize(); q.setFromUnitVectors(up, nv);
      m.compose(p.set(x0, vrGround(x0, z0) + 0.08, z0), q, s.set(r, 1, r)); im.setMatrixAt(k, m); }
    im.frustumCulled = false; im.renderOrder = 1; im.name = 'impAO'; root.add(im); return im;
  }
  // Vršič's own trees (spruce, larch, beech, dwarf pine, birch) drawn the reference's way: leaf cards in clumps, few and large (light on a phone)
  const IMP_W = [0.969, 0.031];   // a white patch in the leaf atlas (the bark cell's corner): the opaque cores take their colour from the vertices
  function impCore(g, prof, n, R) { const d = g.dUV; g.dUV = IMP_W; sLathe(g, sXf(0, 0, 0), prof, n || 7, R() * TAU, R, 0.12); g.dUV = d; }
  function impSkirt(g, y, r, droop, n, rot, tint, lo, hi, R) {   // one tier of a conifer: n needle cards fanned out from the trunk, the tips drooping
    const [u0, v0, u1, v1] = LEAF(1);
    for (let q = 0; q < n; q++) { const a = rot + q / n * TAU + (R() - 0.5) * 0.35, ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca, w = r * (0.85 + R() * 0.25), L = r * (1.0 + R() * 0.18);
      const P = (rad, dy, sd) => [ca * rad + px * sd, y + dy, sa * rad + pz * sd];
      const a0 = P(-r * 0.12, droop * 0.3, -w * 0.5), a1 = P(-r * 0.12, droop * 0.3, w * 0.5), b1 = P(L, -droop, w * 0.5), b0 = P(L, -droop, -w * 0.5);
      const nl = Math.hypot(ca * 0.5, 0.86, sa * 0.5), nI = [0, 1, 0], nO = [ca * 0.5 / nl, 0.86 / nl, sa * 0.5 / nl], cI = sMul(tint, lo), cO = sMul(tint, hi);
      g.triN(a0, a1, b1, nI, nI, nO, cI, cI, cO, [u0, v0], [u1, v0], [u1, v1]); g.triN(a0, b1, b0, nI, nO, nO, cI, cO, cO, [u0, v0], [u1, v1], [u0, v1]); }
  }
  function styCardAlpine(kind) {
    const g = new GB(true), R = rng(9300 + kind), bark = [0.66, 0.54, 0.46];
    const trunk = (pts, r0, r1, col) => { for (let q = 0; q + 1 < pts.length; q++) styTube(g, pts[q], pts[q + 1], r0 + (r1 - r0) * q / (pts.length - 1), r0 + (r1 - r0) * (q + 1) / (pts.length - 1), col || bark, 5); };
    const L = STYV && STYV.lite ? 0.7 : 1, Dn = !!(STYV && STYV.trv === 'D');
    if (kind === 0 || kind === 5 || kind === 1 || kind === 6) {   // spruce, larch: a trunk, tiers of drooping needle cards fanned out round it, narrowing to a spire
      const lar = kind === 1 || kind === 6, tiers = (lar ? 6 : 7) + (Dn ? 2 : 0), tint = lar ? [1.1, 1.26, 0.9] : [0.48, 0.68, 0.6];
      trunk([[0, 0, 0], [0, 0.3, 0]], 0.03, 0.022);
      for (let t = 0; t < tiers; t++) { const f = t / (tiers - 1), y = 0.1 + f * 0.7, r = (lar ? 0.27 : 0.33) * (1 - f * 0.84);
        impSkirt(g, y, r * (Dn ? 1.08 : 1), r * 0.38, (f > 0.75 ? 5 : 6) + (Dn ? 2 : 0), t * 0.55 + R() * 0.3, tint, 0.32 + f * 0.12, 1.15 + f * 0.15 + (Dn ? 0.22 : 0), R); }
      const [u0, v0, u1, v1] = LEAF(1); for (let q = 0; q < 2; q++) { const a = q * Math.PI / 2, ca = Math.cos(a) * 0.05, sa = Math.sin(a) * 0.05, c0 = sMul(tint, 0.6), c1 = sMul(tint, 1.3);   // the spire: two crossed upright cards
        g.triN([-ca, 0.76, -sa], [ca, 0.76, sa], [ca, 0.96, sa], [0, 1, 0], [0, 1, 0], [0, 1, 0], c0, c0, c1, [u0, v0], [u1, v0], [u1, v1]); g.triN([-ca, 0.76, -sa], [ca, 0.96, sa], [-ca, 0.96, -sa], [0, 1, 0], [0, 1, 0], [0, 1, 0], c0, c1, c1, [u0, v0], [u1, v1], [u0, v1]); }
    } else if (kind === 2) {   // beech: a smooth grey trunk forking into a broad crown of leafy clumps
      const top = [0, 0.36, 0]; trunk([[0, 0, 0], top], 0.045, 0.032, [0.74, 0.74, 0.7]); impCore(g, sSph(0.24, 0.17, 0.62, 3, [0.1, 0.2, 0.06], 0.6, 1.2, 0.3), 6, R);
      for (let q = 0; q < (Dn ? 9 : 7); q++) { const a = q / 6 * TAU + R() * 0.5, e = q === 6 || q === 8 ? 1.3 : (R() - 0.1) * 0.8, d = q === 6 ? 0.04 : 0.2 + R() * 0.06, end = [Math.cos(a) * Math.cos(e) * d, 0.6 + Math.sin(e) * 0.18, Math.sin(a) * Math.cos(e) * d];
        styClump(g, end[0], end[1], end[2], 0.21 + R() * 0.04, 0.75, Math.round((Dn ? 7 : 5) * L), 0, R, [0.86, 0.98, 0.78], 0.42, Dn ? 1.5 : 1.25); }
    } else if (kind === 3 || kind === 7) {   // dwarf pine: a low mound of needle clumps
      impCore(g, sSph(0.5, 0.33, 0.3, 3, [0.06, 0.13, 0.06], 0.6, 1.2, 0.6), 6, R);
      for (let q = 0; q < 5; q++) { const a = q / 5 * TAU + R(), d = q ? 0.32 : 0; styClump(g, Math.cos(a) * d, 0.42 + (q ? 0 : 0.1), Math.sin(a) * d, q ? 0.32 : 0.4, 0.7, Math.round((Dn ? 6 : 4) * L), 1, R, [0.62, 0.76, 0.62], 0.4, Dn ? 1.4 : 1.2); }
    } else {   // birch: a slim white trunk, a light crown of a few small clumps
      trunk([[0, 0, 0], [0.02, 0.35, 0], [0, 0.62, 0.01]], 0.022, 0.012, [0.95, 0.94, 0.9]); impCore(g, sSph(0.13, 0.17, 0.68, 3, [0.16, 0.28, 0.08], 0.6, 1.2, 0.2), 6, R);
      for (let q = 0; q < 5; q++) { const a = q / 4 * TAU + R() * 0.6, d = q === 4 ? 0 : 0.1 + R() * 0.04; styClump(g, Math.cos(a) * d, 0.6 + (q === 4 ? 0.16 : R() * 0.12), Math.sin(a) * d, 0.15, 0.9, Math.round((Dn ? 6 : 4) * L), 0, R, [1.08, 1.18, 0.86], 0.5, Dn ? 1.5 : 1.3); }
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  /* ---- five tree versions (STYV.trv): A soft round, B toy, C broccoli clusters, D dense leaf cards, E sharp pastel facets; none: the leaf cards of picture 3 ---- */
  function impCards() { return !(STYV && STYV.trv) || STYV.trv === 'D'; }
  function impHemi(g, cx, cy, cz, r, sy, col, R, lo, hi) {   // a puff without its underside (never seen from the game's cameras): about half the vertices
    const M = ICO0, V = M.V.map(v => { const k = 1 + (R() - 0.5) * 0.14; return [cx + v[0] * r * k, cy + v[1] * r * sy * k, cz + v[2] * r * k]; }), inn = [cx, cy, cz];
    const sc = (v) => { const t = v[1] * 0.5 + 0.5, k = lo + (hi - lo) * t * t; return [col[0] * k * (1 + 0.1 * t), col[1] * k, col[2] * k * (1 - 0.18 * t)]; };
    const nn = (v) => { const x = v[0], y = v[1] / sy + 0.25, z = v[2], l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
    const C = M.V.map(sc), Nn = M.V.map(nn);
    for (const [a, b, c] of M.F) { if (M.V[a][1] + M.V[b][1] + M.V[c][1] < -0.1) continue; g.triON(V[a], V[b], V[c], Nn[a], Nn[b], Nn[c], inn, C[a], C[b], C[c]); }
  }
  function impTier(g, y0, y1, r, n, cb, cm, ct, rot) {   // a cone without its floor: rim, a ring part way up, the tip (smooth unless STYV.flat)
    sLathe(g, sXf(0, 0, 0), [[r, y0, cb], [r * 0.52, y0 + (y1 - y0) * 0.45, cm], [0, y1, ct]], n, rot || 0);
  }
  function impTrunk(g, h, r, col, n) { sLathe(g, sXf(0, 0, 0), [[r, -0.02, sMul(col, 0.8)], [r * 0.8, h, col]], n || 5, 0); }
  function impTreeGeo(kind) {
    const v = STYV.trv; if (!v || v === 'D') return styCardAlpine(kind);
    const g = new GB(), R = rng(9500 + kind * 7 + v.charCodeAt(0)), sp = kind === 0 || kind === 5, lar = kind === 1 || kind === 6, dw = kind === 3 || kind === 7, bir = kind === 4, bee = kind === 2;
    const flat0 = STYV.flat; if (v === 'E') STYV.flat = true;
    const bark = [0.4, 0.29, 0.2];
    if (v === 'A') {   // soft and round: smooth tiers and puffs, dark under, warm light on top
      if (sp || lar) { impTrunk(g, 0.2, 0.03, bark); const c = sp ? [[0.04, 0.13, 0.08], [0.08, 0.24, 0.13], [0.2, 0.42, 0.2]] : [[0.16, 0.3, 0.08], [0.3, 0.48, 0.14], [0.52, 0.7, 0.26]], T = sp ? 3 : 4;
        for (let t = 0; t < T; t++) { const f = t / T, y0 = 0.1 + f * 0.62, r = (sp ? 0.32 : 0.26) * (1 - f * 0.7); impTier(g, y0, y0 + (sp ? 0.42 : 0.32) * (1 - f * 0.35), r, 7, sMul(c[0], 1 + f * 0.3), sMul(c[1], 1 + f * 0.2), c[2], t * 0.5); } }
      else if (bee) { impTrunk(g, 0.42, 0.04, [0.56, 0.54, 0.5]); puff(g, 0, 0.64, 0, 0.3, 0.78, [0.18, 0.38, 0.1], R, 0.1, 0.42, 1.45, false); for (let q = 0; q < 3; q++) { const a = q / 3 * TAU + 0.4; puff(g, Math.cos(a) * 0.2, 0.56, Math.sin(a) * 0.2, 0.19, 0.8, vary([0.18, 0.38, 0.1], R, 0.1), R, 0.1, 0.42, 1.4, false); } }
      else if (dw) { for (let q = 0; q < 3; q++) { const a = q / 3 * TAU; puff(g, Math.cos(a) * 0.25, 0.35, Math.sin(a) * 0.25, 0.36, 0.7, [0.08, 0.22, 0.09], R, 0.1, 0.45, 1.35, false); } }
      else { impTrunk(g, 0.62, 0.02, [0.92, 0.9, 0.86]); puff(g, 0, 0.72, 0, 0.17, 1.3, [0.3, 0.5, 0.12], R, 0.1, 0.5, 1.45, false); puff(g, 0.06, 0.56, 0.03, 0.12, 1.1, [0.3, 0.5, 0.12], R, 0.1, 0.5, 1.4, false); }
    } else if (v === 'B') {   // toy: one simple smooth shape each (a cone, a ball on a stick, a capsule), candy greens
      if (sp || lar) { impTrunk(g, 0.16, 0.035, bark, 4); impTier(g, 0.12, 1.0, sp ? 0.3 : 0.24, 8, sp ? [0.05, 0.25, 0.18] : [0.24, 0.46, 0.12], sp ? [0.1, 0.4, 0.27] : [0.4, 0.64, 0.2], sp ? [0.26, 0.6, 0.38] : [0.66, 0.84, 0.36]); }
      else if (bee) { impTrunk(g, 0.42, 0.04, [0.5, 0.36, 0.24], 5); puff(g, 0, 0.64, 0, 0.34, 0.86, [0.28, 0.56, 0.12], R, 0.0, 0.4, 1.5, false); }
      else if (dw) puff(g, 0, 0.3, 0, 0.5, 0.6, [0.1, 0.32, 0.16], R, 0.0, 0.45, 1.4, false);
      else { impTrunk(g, 0.5, 0.025, [0.94, 0.92, 0.88], 4); puff(g, 0, 0.72, 0, 0.16, 1.6, [0.5, 0.7, 0.14], R, 0.0, 0.5, 1.5, false); }
    } else if (v === 'C') {   // broccoli: crowns of many small rounded clusters
      const hp = (x, y, z, r, col) => impHemi(g, x, y, z, r, 0.85, vary(col, R, 0.1), R, 0.42, 1.4);
      if (sp || lar) { impTrunk(g, 0.25, 0.03, bark); const col = sp ? [0.06, 0.2, 0.1] : [0.28, 0.46, 0.12], L = [[4, 0.22, 0.2, 0.14], [3, 0.42, 0.15, 0.12], [3, 0.6, 0.1, 0.1], [1, 0.8, 0, 0.09]];
        L.forEach(([n, y, d, r], t) => { for (let q = 0; q < n; q++) { const a = q / n * TAU + t * 0.7; hp(Math.cos(a) * d * (sp ? 1.15 : 1), y, Math.sin(a) * d * (sp ? 1.15 : 1), r * (sp ? 1.2 : 1), sMul(col, 1 + t * 0.15)); } }); }
      else if (bee) { impTrunk(g, 0.44, 0.04, [0.56, 0.54, 0.5]); for (let q = 0; q < 8; q++) { const a = q / 7 * TAU, d = q === 7 ? 0 : 0.2, y = q === 7 ? 0.74 : 0.6 + (q % 2) * 0.06; hp(Math.cos(a) * d, y, Math.sin(a) * d, 0.15, [0.2, 0.4, 0.1]); } }
      else if (dw) { for (let q = 0; q < 5; q++) { const a = q / 4 * TAU, d = q === 4 ? 0 : 0.3; hp(Math.cos(a) * d, q === 4 ? 0.45 : 0.32, Math.sin(a) * d, 0.27, [0.08, 0.22, 0.09]); } }
      else { impTrunk(g, 0.6, 0.02, [0.92, 0.9, 0.86]); for (let q = 0; q < 4; q++) { const a = q / 3 * TAU, d = q === 3 ? 0 : 0.08; hp(Math.cos(a) * d, q === 3 ? 0.8 : 0.66, Math.sin(a) * d, 0.1, [0.32, 0.52, 0.12]); } }
    } else {   // E: sharp facets in pastel colours (flat shaded)
      if (sp || lar) { impTrunk(g, 0.16, 0.035, bark, 4); const c = sp ? [[0.2, 0.42, 0.4], [0.3, 0.56, 0.48], [0.46, 0.72, 0.58]] : [[0.5, 0.64, 0.3], [0.62, 0.76, 0.36], [0.78, 0.88, 0.48]];
        for (let t = 0; t < 3; t++) { const f = t / 3, y0 = 0.12 + f * 0.56; impTier(g, y0, y0 + 0.4 * (1 - f * 0.3), (sp ? 0.31 : 0.25) * (1 - f * 0.62), 5, c[0], c[1], c[2], t * 0.6); } }
      else if (bee) { impTrunk(g, 0.4, 0.04, [0.6, 0.48, 0.38], 4); const rs = ROCK_SMOOTH; ROCK_SMOOTH = false; ico(g, 0, 0.64, 0, 0.32, 0.8, [0.56, 0.74, 0.36], R, 0.3); ico(g, 0.16, 0.52, 0.1, 0.18, 0.9, [0.5, 0.7, 0.34], R, 0.3); ROCK_SMOOTH = rs; }
      else if (dw) { const rs = ROCK_SMOOTH; ROCK_SMOOTH = false; ico(g, 0, 0.3, 0, 0.5, 0.6, [0.32, 0.52, 0.4], R, 0.3); ROCK_SMOOTH = rs; }
      else { impTrunk(g, 0.5, 0.025, [0.94, 0.92, 0.88], 4); const rs = ROCK_SMOOTH; ROCK_SMOOTH = false; ico(g, 0, 0.72, 0, 0.16, 1.5, [0.8, 0.86, 0.46], R, 0.25); ROCK_SMOOTH = rs; }
    }
    STYV.flat = flat0;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function impBushSolid(g, x, y0, z, w, R) {   // the verge bushes in the same version's style
    const v = STYV.trv, s = w * 0.5;
    if (v === 'A') { for (let q = 0; q < 3; q++) { const a = q / 3 * TAU + R(); puff(g, x + Math.cos(a) * s * 0.4, y0 + s * 0.45, z + Math.sin(a) * s * 0.4, s * 0.6, 0.8, vary([0.2, 0.4, 0.12], R, 0.12), R, 0.1, 0.45, 1.35, false); } }
    else if (v === 'B') puff(g, x, y0 + s * 0.4, z, s * 0.75, 0.75, vary([0.26, 0.52, 0.14], R, 0.1), R, 0.0, 0.45, 1.45, false);
    else if (v === 'C') { for (let q = 0; q < 4; q++) { const a = q / 3 * TAU, d = q === 3 ? 0 : s * 0.4; impHemi(g, x + Math.cos(a) * d, y0 + s * (q === 3 ? 0.5 : 0.35), z + Math.sin(a) * d, s * 0.45, 0.85, vary([0.2, 0.4, 0.1], R, 0.1), R, 0.45, 1.4); } }
    else { const rs = ROCK_SMOOTH; ROCK_SMOOTH = false; ico(g, x, y0 + s * 0.4, z, s * 0.7, 0.7, vary([0.46, 0.66, 0.36], R, 0.08), R, 0.3); ROCK_SMOOTH = rs; }
  }
