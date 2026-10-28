(() => {
  // (pictures only) the glass footbridge the user chose (glass-page.js), its version 1 (the glass tube) again, over road 2 from the driving school's lot north into the park by the toy shop, with better
  // glass: tinted, shining, reflecting the sky (a small sky cube as its environment), steel frames, a timber floor, light strips. Three versions
  // (window.__GLB(k), k = 0..2); a paved path from the north foot to the toy shop's forecourt. Each version is a few merged meshes (one per material).
  const H = window.__H3, sc = Render.scene, TX = Tex.all(), out = {};
  const BX = 58, BZ = 48.2, g0 = H.ground(BX, BZ), DECK = 6.0, ZN = -11, ZS = 11, RUN = 11, gN = H.ground(BX, BZ + ZN - RUN), gS = H.ground(BX, BZ + ZS + RUN);
  const L = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o)), Y = new THREE.Vector3(0, 1, 0);
  // one version: parts gathered per material, merged at the end
  const mkV = () => { const parts = new Map(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const put = (mat, geo, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { e.set(rx, ry, rz); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz)); geo.applyMatrix4(m4); if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(geo); };
    const bx = (mat, x, y, z, sx, sy, sz, rx, ry, rz) => put(mat, new THREE.BoxGeometry(sx, sy, sz), x, y, z, rx, ry, rz);
    const rod = (mat, a, b, r, seg = 6) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length(); if (len < 1e-4) return; const geo = new THREE.CylinderGeometry(r, r, len, seg, 1); q.setFromUnitVectors(Y, d.normalize()); m4.compose(A.add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)); geo.applyMatrix4(m4); if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(geo); };
    const done = () => { const G = new THREE.Group(); for (const [mat, geos] of parts) { const pos = [], nrm = [], idx = []; let off = 0; for (const g of geos) { const gi = g.index ? g : null, P = g.attributes.position, N = g.attributes.normal; for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nrm.push(N.getX(i), N.getY(i), N.getZ(i)); } if (gi) { const I = g.index; for (let i = 0; i < I.count; i++) idx.push(I.getX(i) + off); } else for (let i = 0; i < P.count; i++) idx.push(i + off); off += P.count; g.dispose(); }
        const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); bg.setIndex(idx); const me = new THREE.Mesh(bg, mat); me.castShadow = !mat.transparent; me.receiveShadow = true; G.add(me); } return G; };
    return { put, bx, rod, done }; };
  // stairs straight on in line with the bridge: from the deck's end down to the ground, steps, two stringers, handrails on posts
  const stairs = (V, mStep, mSide, mRail, zEnd, dir, w, gEnd) => { const n = 34, h = (DECK - (gEnd - g0)) / n, r = RUN / n; for (let k = 0; k < n; k++) V.bx(mStep, 0, DECK - (k + 1) * h + h / 2 - 0.02, zEnd + dir * (k + 0.5) * r, w, 0.1, r + 0.06);
    const sl = Math.atan2(DECK - (gEnd - g0), RUN); for (const sx of [-1, 1]) { V.bx(mSide, sx * (w / 2 + 0.06), DECK / 2 + (gEnd - g0) / 2 - 0.2, zEnd + dir * RUN / 2, 0.12, 0.38, Math.hypot(RUN, DECK) + 0.3, dir * sl, 0, 0);
      V.rod(mRail, [sx * (w / 2 + 0.06), DECK + 1.0, zEnd], [sx * (w / 2 + 0.06), gEnd - g0 + 1.0, zEnd + dir * RUN], 0.04); for (let k = 0; k <= 4; k++) { const t = k / 4, zz = zEnd + dir * RUN * t, yy = DECK - (DECK - (gEnd - g0)) * t; V.rod(mRail, [sx * (w / 2 + 0.06), yy, zz], [sx * (w / 2 + 0.06), yy + 1.0, zz], 0.035, 5); } } };
  const piers = (V, m, zs, xs, w, top) => { for (const z of zs) for (const x of xs) V.bx(m, x, top / 2, z, w, top, w); };
  const railings = (V, m, x, z0, z1, y, posts = 1.5) => { V.rod(m, [x, y + 1.05, z0], [x, y + 1.05, z1], 0.045); V.rod(m, [x, y + 0.55, z0], [x, y + 0.55, z1], 0.025); for (let z = z0; z <= z1 + 1e-6; z += posts) V.rod(m, [x, y, z], [x, y + 1.05, z], 0.03, 5); };
  // the sky round the bridge for its glass to reflect: a small cube of gradient pictures (sky, horizon, the green below)
  const skyCube = (() => { const face = (top) => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const g = c.createLinearGradient(0, 0, 0, 64); if (top === 1) { g.addColorStop(0, '#7fa8d8'); g.addColorStop(1, '#a9c6e8'); } else if (top === -1) { g.addColorStop(0, '#5a7a4a'); g.addColorStop(1, '#4a6a3e'); } else { g.addColorStop(0, '#8fb2de'); g.addColorStop(0.5, '#dfe9f2'); g.addColorStop(0.56, '#9aa88a'); g.addColorStop(1, '#5a7a4a'); } c.fillStyle = g; c.fillRect(0, 0, 64, 64); return cv; };
    const t = new THREE.CubeTexture([face(0), face(0), face(1), face(-1), face(0), face(0)]); t.needsUpdate = true; return t; })();
  const glass = (tint, op) => new THREE.MeshPhongMaterial({ color: tint, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, shininess: 140, specular: 0xffffff, envMap: skyCube, reflectivity: 0.55, combine: THREE.MixOperation });
  const steel = (c, sh = 70) => new THREE.MeshPhongMaterial({ color: c, shininess: sh, specular: 0x555555 }), wood = new THREE.MeshPhongMaterial({ color: 0xb48a58, shininess: 12, specular: 0x222222 }), led = new THREE.MeshBasicMaterial({ color: 0x9ff4ff });
  const V = [], NS = [[ZN - 2.6, gN], [ZS + 2.6, gS]];

  // the user: "Naredi most steklena cev vendar v 3 verzijah s popravljenimi stopnicami, saj zdaj ne vodijo do začetka na vrhu mostu". The same glass tube
  // over the road in all three; the stairs end where the deck begins: 1 a spiral in a glass tower, its last step at the landing that runs on into the tube
  // (no floor across its top any more); 2 straight stairs on in line with the deck, the tube going on over them down to the ground; 3 a glass tower with
  // two flights and a half landing (U), the top landing straight into the tube, a glass lift beside it
  const tube = (v, Gl, W, z0, z1, y0f, y1f, hw, hWall, every = 2.2) => { const R = hw, n = 20, prof = [[-hw, 0], [-hw, hWall]]; for (let k = 1; k < n; k++) { const a = Math.PI - Math.PI * k / n; prof.push([R * Math.cos(a), hWall + R * Math.sin(a)]); } prof.push([hw, hWall]); prof.push([hw, 0]);
    const pos = [], idx = []; prof.forEach(([x, y]) => { pos.push(x, y + y0f, z0, x, y + y1f, z1); }); for (let k = 0; k < prof.length - 1; k++) { const q = k * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); v.put(Gl, geo, 0, 0, 0);
    const L = Math.abs(z1 - z0), m = Math.max(1, Math.round(L / every)); for (let j = 0; j <= m; j++) { const t = j / m, z = z0 + (z1 - z0) * t, yo = y0f + (y1f - y0f) * t; for (let k = 0; k < prof.length - 1; k++) v.rod(W, [prof[k][0], prof[k][1] + yo, z], [prof[k + 1][0], prof[k + 1][1] + yo, z], 0.06, 5); }
    for (const k of [1, prof.length - 2, (prof.length - 1) >> 1]) v.rod(W, [prof[k][0], prof[k][1] + y0f, z0], [prof[k][0], prof[k][1] + y1f, z1], 0.05, 5); for (const sx of [-1, 1]) v.rod(W, [sx * (hw - 0.08), y0f + 1.0, z0], [sx * (hw - 0.08), y1f + 1.0, z1], 0.035, 5); };
  const deck = (v, D, w, hw) => { v.bx(D, 0, DECK - 0.32, 0, w + 0.4, 0.55, ZS - ZN + 0.2); v.bx(wood, 0, DECK - 0.02, 0, w, 0.06, ZS - ZN); for (const sx of [-1, 1]) v.bx(led, sx * (hw - 0.12), DECK + 0.03, 0, 0.06, 0.03, ZS - ZN - 0.4); };
  const Vs = [];
  // 1. the spiral, mended: a landing across the tower's deck side at the deck's height (the tube runs on into it); the spiral's last step beside the landing,
  //    coming up on the far side; the door at the bottom on the tower's west side; the floor bands only round the glass
  { const v = mkV(), Gl = glass(0xa8dcef, 0.3), Gt = glass(0x9cd2ea, 0.34), W = steel(0xf4f6f8, 90), D = steel(0x50565c, 40), w = 3.2, hw = w / 2, hWall = 1.15;
    deck(v, D, w, hw); tube(v, Gl, W, ZN, ZS, DECK, DECK, hw, hWall);
    for (const [zc, gE] of NS) { const y0 = gE - g0, hT = DECK + 3.4 - y0, dir = zc < 0 ? 1 : -1; v.bx(Gt, 0, y0 + hT / 2, zc, 5.2, hT, 5.2); for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.bx(W, sx * 2.6, y0 + hT / 2, zc + sz * 2.6, 0.2, hT, 0.2); v.bx(W, 0, y0 + hT + 0.12, zc, 5.7, 0.28, 5.7); v.bx(Gt, 0, y0 + hT + 0.3, zc, 5.2, 0.06, 5.2);
      for (let k = 1; k <= 2; k++) { const yb = y0 + k * (DECK - y0) / 2; for (const sz of [-1, 1]) v.bx(W, 0, yb, zc + sz * 2.6, 5.25, 0.14, 0.12); for (const sx of [-1, 1]) v.bx(W, sx * 2.6, yb, zc, 0.12, 0.14, 5.25); }
      // the landing (the deck's half of the tower) and its glass balustrade along the stairwell
      v.bx(D, 0, DECK - 0.12, zc + dir * 1.4, 5.0, 0.2, 2.4); v.bx(wood, 0, DECK - 0.02, zc + dir * 1.4, 5.0, 0.06, 2.4); v.bx(Gt, 0, DECK + 0.55, zc + dir * 0.22, 2.4, 1.1, 0.04); v.rod(W, [-1.2, DECK + 1.1, zc + dir * 0.22], [1.2, DECK + 1.1, zc + dir * 0.22], 0.04, 6);
      // the spiral: 30 steps, one and a half turns; the last one at angle 0 (east), beside the landing's edge, the turn coming up through the far half
      const n = 30, dA = 3 * Math.PI / n; for (let k = 0; k < n; k++) { const a = -dir * (n - 1 - k) * dA, y = y0 + (DECK - y0) * (k + 1) / n - 0.05; v.bx(D, 1.25 * Math.cos(a), y, zc - dir * 0.0 + 1.25 * Math.sin(a), 1.7, 0.1, 0.55, 0, -a, 0); }
      v.bx(D, 0, y0 + (DECK - y0) / 2, zc, 0.3, DECK - y0, 0.3); { const pts = []; for (let k = 0; k <= 40; k++) { const t = k / 40, a = -dir * (n - 1) * dA * (1 - t), y = y0 + 1.0 + (DECK - y0) * t; pts.push([2.1 * Math.cos(a), y, zc + 2.1 * Math.sin(a)]); } for (let k = 0; k < 40; k++) v.rod(W, pts[k], pts[k + 1], 0.035, 5); }
      // the door at the bottom (west), a frame and a sill
      v.bx(W, -2.62, y0 + 1.15, zc, 0.12, 2.3, 1.5); v.bx(steel(0x3c4146, 30), -2.66, y0 + 1.15, zc, 0.06, 2.1, 1.25); }
    piers(v, W, [-8.5, 10.6], [0], 0.9, DECK - 0.6); Vs.push(v.done()); }
  // 2. straight stairs on in line with the deck, the tube over them down to the ground; a small glass porch at the foot
  { const v = mkV(), Gl = glass(0xa8dcef, 0.3), W = steel(0xf4f6f8, 90), D = steel(0x50565c, 40), w = 3.2, hw = w / 2, hWall = 1.15;
    deck(v, D, w, hw); tube(v, Gl, W, ZN, ZS, DECK, DECK, hw, hWall);
    for (const [zc, gE] of NS) { const y0 = gE - g0, dir = zc < 0 ? -1 : 1, zE = dir < 0 ? ZN : ZS, zF = zE + dir * RUN, n = 34, h = (DECK - y0) / n, r = RUN / n;
      for (let k = 0; k < n; k++) v.bx(D, 0, DECK - (k + 1) * h + h / 2 - 0.02, zE + dir * (k + 0.5) * r, w - 0.2, 0.1, r + 0.06);
      const sl = Math.atan2(DECK - y0, RUN); for (const sx of [-1, 1]) v.bx(D, sx * (hw - 0.04), (DECK + y0) / 2 - 0.25, zE + dir * RUN / 2, 0.14, 0.4, Math.hypot(RUN, DECK - y0) + 0.3, dir * sl, 0, 0);
      tube(v, Gl, W, zE, zF, DECK, y0, hw, hWall, 2.2); v.bx(wood, 0, y0 + 0.03, zF + dir * 1.2, w + 0.6, 0.06, 2.4); v.bx(Gl, 0, y0 + hWall + hw + 0.3, zF + dir * 1.2, w + 0.8, 0.05, 2.6); for (const sx of [-1, 1]) v.rod(W, [sx * (hw + 0.3), y0, zF + dir * 2.3], [sx * (hw + 0.3), y0 + hWall + hw + 0.3, zF + dir * 2.3], 0.06, 6);
      v.bx(W, 0, (DECK + y0) / 2 - 1.2, zE + dir * RUN * 0.55, 0.5, DECK - y0 - 2.4 > 0.5 ? (DECK - y0) / 2 : 0.5, 0.5); }
    piers(v, W, [-8.5, 10.6], [0], 0.9, DECK - 0.6); Vs.push(v.done()); }
  // 3. a glass tower each end with two flights and a half landing (U): up along the outer wall, back along the inner one, the top landing straight
  //    into the tube; a glass lift on the tower's outer side
  { const v = mkV(), Gl = glass(0xa8dcef, 0.3), Gt = glass(0x9cd2ea, 0.32), W = steel(0xf4f6f8, 90), D = steel(0x50565c, 40), w = 3.2, hw = w / 2, hWall = 1.15, TX0 = 6.4, TZ0 = 5.6;
    deck(v, D, w, hw); tube(v, Gl, W, ZN, ZS, DECK, DECK, hw, hWall);
    for (const [zc0, gE] of NS) { const y0 = gE - g0, dir = zc0 < 0 ? 1 : -1, zc = zc0 - dir * 0.4, hT = DECK + 3.2 - y0, hm = (DECK - y0) / 2, zo = zc - dir * 1.5, zi = zc + dir * 0.1;
      v.bx(Gt, 0, y0 + hT / 2, zc, TX0, hT, TZ0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.bx(W, sx * TX0 / 2, y0 + hT / 2, zc + sz * TZ0 / 2, 0.2, hT, 0.2); v.bx(W, 0, y0 + hT + 0.12, zc, TX0 + 0.5, 0.28, TZ0 + 0.5); v.bx(Gt, 0, y0 + hT + 0.3, zc, TX0, 0.06, TZ0);
      // flight 1 (outer wall, west to east), the half landing (east), flight 2 (inner side, east to west), the top landing (west to the tube's mouth)
      const n1 = 14, f1x0 = -2.3, f1x1 = 1.7; for (let k = 0; k < n1; k++) { const t = (k + 0.5) / n1; v.bx(D, f1x0 + (f1x1 - f1x0) * t, y0 + hm * (k + 1) / n1 - 0.05, zo, (f1x1 - f1x0) / n1 + 0.04, 0.1, 1.5); }
      v.bx(D, 2.45, y0 + hm - 0.1, zc - dir * 0.7, 1.5, 0.2, 3.1); for (let k = 0; k < n1; k++) { const t = (k + 0.5) / n1; v.bx(D, f1x1 - (f1x1 - f1x0) * t, y0 + hm + hm * (k + 1) / n1 - 0.05, zi, (f1x1 - f1x0) / n1 + 0.04, 0.1, 1.5); }
      v.bx(D, -0.3, DECK - 0.12, zc + dir * 1.9, TX0 - 0.4, 0.2, 1.8); v.bx(wood, -0.3, DECK - 0.02, zc + dir * 1.9, TX0 - 0.4, 0.06, 1.8); v.bx(D, -2.65, DECK - 0.12, zi, 1.1, 0.2, 1.5);
      for (const [a, b] of [[[f1x0, y0 + 1.0, zo + dir * 0.78], [f1x1, y0 + hm + 1.0, zo + dir * 0.78]], [[f1x1, y0 + hm + 1.0, zi - dir * 0.78], [f1x0, DECK + 1.0, zi - dir * 0.78]]]) v.rod(W, a, b, 0.035, 5);
      v.bx(Gt, f1x1 - 2, y0 + hm + 0.6 + hm / 2, zi - dir * 0.78, 4.0, 1.1, 0.03); v.bx(Gt, 0.4, DECK + 0.55, zc + dir * 0.98, 3.0, 1.1, 0.03);
      // the lift: a glass shaft on the outer side, its cabin waiting at the top
      const zl = zc - dir * (TZ0 / 2 + 1.0), hL = DECK + 2.6 - y0; v.bx(Gt, 1.6, y0 + hL / 2, zl, 1.8, hL, 1.8); for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.bx(W, 1.6 + sx * 0.9, y0 + hL / 2, zl + sz * 0.9, 0.12, hL, 0.12); v.bx(W, 1.6, y0 + hL + 0.1, zl, 2.1, 0.2, 2.1);
      v.bx(steel(0xc8ccd0, 90), 1.6, DECK + 1.1, zl, 1.4, 2.2, 1.4); v.bx(D, 1.6, DECK - 0.12, zc - dir * (TZ0 / 2 + 0.25), 1.6, 0.2, 0.6); }
    piers(v, W, [-8.5, 10.6], [0], 0.9, DECK - 0.6); Vs.push(v.done()); }
  const V2 = Vs; V.length = 0; V.push(...V2); if (window.__GLB) window.__GLB(-1); if (window.__GLB2G) window.__GLB2G.forEach(G => G.parent && G.parent.remove(G)); window.__GLB2G = V;
  // set in the world; the park's things in the way go; a paved path from the north foot to the toy shop's forecourt
  V.forEach((G, k) => { G.position.set(BX, g0, BZ); G.visible = k === 0; G.traverse(o => { o.userData.keep = true; }); sc.add(G); });
  { const box = new THREE.Box3(), c = new THREE.Vector3(); let n = 0; sc.children.filter(o => o.userData.lp && o.visible && !o.isInstancedMesh).forEach(o => { box.setFromObject(o); if (box.isEmpty()) return; box.getCenter(c); if (box.max.x - box.min.x > 16) return; const inFoot = c.x > BX - 5.5 && c.x < BX + 5.5 && c.z > BZ + ZN - RUN - 4.5 && c.z < BZ + ZN + 1, onPath = c.x > BX - 2 && c.x < 71 && c.z > 23 && c.z < 31; if (inFoot || onPath) { o.visible = false; n++; } }); out.cleared = n;
    const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), z0 = new THREE.Matrix4().makeScale(0, 0, 0); sc.children.filter(o => o.userData.lp && o.isInstancedMesh).forEach(o => { let ch = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); v3.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); if ((v3.x > BX - 4 && v3.x < BX + 4 && v3.z > BZ + ZN - RUN - 3.5 && v3.z < BZ + ZN + 1) || (v3.x > BX - 2 && v3.x < 71 && v3.z > 24 && v3.z < 30)) { o.setMatrixAt(i, z0); ch++; } } if (ch) { o.instanceMatrix.needsUpdate = true; out.inst = (out.inst || 0) + ch; } }); }
  { const pv = TX.paving ? TX.paving.clone() : null; if (pv) { pv.wrapS = pv.wrapT = THREE.RepeatWrapping; pv.needsUpdate = true; } const A = [BX, BZ + ZN - RUN + 0.2], B2 = [70.2, 27.9], dx = B2[0] - A[0], dz = B2[1] - A[1], len = Math.hypot(dx, dz), nx = -dz / len, nz = dx / len, hw = 1.4, pos = [], uv = [], idx = [], n = Math.ceil(len / 1.5);
    for (let k = 0; k <= n; k++) { const t = k / n, x = A[0] + dx * t, z = A[1] + dz * t; for (const s of [-1, 1]) { const px = x + nx * s * hw, pz = z + nz * s * hw; pos.push(px, H.ground(px, pz) + 0.105, pz); uv.push(px / 3, pz / 3); } if (k) { const q = (k - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
    { const x = A[0], z = A[1]; const q0 = pos.length / 3; for (const [ox, oz] of [[-2.2, -2.2], [2.2, -2.2], [2.2, 1.4], [-2.2, 1.4]]) { pos.push(x + ox, H.ground(x + ox, z + oz) + 0.105, z + oz); uv.push((x + ox) / 3, (z + oz) / 3); } idx.push(q0, q0 + 2, q0 + 1, q0, q0 + 3, q0 + 2); }
    { const x = BX, z = BZ + ZS + RUN - 0.2; const q0 = pos.length / 3; for (const [ox, oz] of [[-2.2, -1.4], [2.2, -1.4], [2.2, 2.2], [-2.2, 2.2]]) { pos.push(x + ox, H.ground(x + ox, z + oz) + 0.105, z + oz); uv.push((x + ox) / 3, (z + oz) / 3); } idx.push(q0, q0 + 2, q0 + 1, q0, q0 + 3, q0 + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); if (g.attributes.normal.getY(0) < 0) { const I = g.index; for (let t = 0; t < I.count; t += 3) { const q = I.getX(t + 1); I.setX(t + 1, I.getX(t + 2)); I.setX(t + 2, q); } g.computeVertexNormals(); }
    const me = new THREE.Mesh(g, L(0xe8e2d6, { map: pv, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); me.receiveShadow = true; me.userData.keep = true; sc.add(me); }
  window.__GLB2 = (k) => { V.forEach((G, i) => { G.visible = i === k; }); if (window.__GLB) for (let i = 0; i < 3; i++) {} return k; };
  out.g = [+g0.toFixed(2), +gN.toFixed(2), +gS.toFixed(2)]; out.meshes = V.map(G => G.children.length); return JSON.stringify(out); })()