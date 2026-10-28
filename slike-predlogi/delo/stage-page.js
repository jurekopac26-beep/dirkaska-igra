(() => {
  // (pictures only) the user: the park's ramp off the lane, onto the meadow, made to look like a stage: the same shape (up 1.5 m over 6 m, a 5 m top,
  // down over 6 m, 6.5 m wide), so it still works as a jump, but dressed (a skirt round its sides, a stage floor, its slopes as stairs or carpet) and
  // covered with things that hide what it was; to jump it the player has to knock all of them down first. Three looks (window.__STAGE(k)):
  // 0 a concert stage, 1 a flower show, 2 a circus. A short asphalt run-up from the lane to it, the old ramp on the lane gone.
  const H = window.__H3, sc = Render.scene, out = {}, gnd = (x, z) => H.ground(x, z); sc.updateMatrixWorld(true);
  const matOf = (o) => Array.isArray(o.material) ? o.material[0] : o.material;
  // the old ramp away (its group, or its triangles if it was baked in with others)
  { const R = H.hillRamp; if (R) R.visible = false; let ch = 0; sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.userData.keep || o.userData.lp) return; const m = matOf(o); if (!m || (m.map && !(m.map.image && m.map.image.width === 256 && m.map.image.height === 32))) return; const g = o.geometry, P = g && g.attributes.position; if (!P) return; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < 50 || bb.min.x > 60 || bb.max.z < -68 || bb.min.z > -48) return;
      const e = o.matrixWorld.elements, I = g.index, n = I ? I.count : P.count, ix = (k) => I ? I.getX(k) : k; let c2 = 0;
      for (let t = 0; t < n; t += 3) { let x = 0, y = 0, z = 0; for (let q = 0; q < 3; q++) { const i = ix(t + q); x += (P.getX(i) * e[0] + P.getY(i) * e[4] + P.getZ(i) * e[8] + e[12]) / 3; y += (P.getX(i) * e[1] + P.getY(i) * e[5] + P.getZ(i) * e[9] + e[13]) / 3; z += (P.getX(i) * e[2] + P.getY(i) * e[6] + P.getZ(i) * e[10] + e[14]) / 3; }
        if (!isFinite(x + y + z) || Math.abs(x - 55) > 3.6 || Math.abs(z + 58) > 9.0 || y < gnd(x, z) + 0.12) continue; if (I) { I.setX(t + 1, I.getX(t)); I.setX(t + 2, I.getX(t)); } else for (const q of [t + 1, t + 2]) P.setXYZ(q, P.getX(t), P.getY(t), P.getZ(t)); c2++; }
      if (c2) { if (I) I.needsUpdate = true; P.needsUpdate = true; ch += c2; } }); out.oldFold = ch; }
  // the new place: on the meadow east of the lane, between the kids' train and the planes, along x (the run-up from the lane at x 57)
  const CX = window.__STAGEAT ? window.__STAGEAT[0] : 77, CZ = window.__STAGEAT ? window.__STAGEAT[1] : -55, HD = 0, ux = Math.cos(HD), uz = Math.sin(HD), vx = -uz, vz = ux, y0 = gnd(CX, CZ);
  const W = 6.5, Lh = 8.5, Tp = 2.5, Hh = 1.5, yOn = (u) => Hh * Math.max(0, Math.min(1, (Lh - Math.abs(u)) / (Lh - Tp)));
  const W3 = (u, v, y) => [CX + ux * u + vx * v, y0 + y, CZ + uz * u + vz * v];
  // the spot cleared: trees, stalls and the like standing where the stage and its run-up go (and 2 m round)
  { const inR = (x, z) => { const u = (x - CX) * ux + (z - CZ) * uz, v = (x - CX) * vx + (z - CZ) * vz; return u > -Lh - 15 && u < Lh + 3 && Math.abs(v) < W / 2 + 2.5; }; let ch = 0;
    sc.traverse(o => { if (!o.isMesh || o.userData.keep) return; const g = o.geometry, P = g && g.attributes.position; if (!P) return;
      if (o.isInstancedMesh) { const M4 = new THREE.Matrix4(), V = new THREE.Vector3(), Z = new THREE.Matrix4().makeScale(0, 0, 0); let c3 = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); V.setFromMatrixPosition(M4).applyMatrix4(o.matrixWorld); if (inR(V.x, V.z) && V.y > gnd(V.x, V.z) - 0.5) { o.setMatrixAt(i, Z); c3++; } } if (c3) { o.instanceMatrix.needsUpdate = true; ch += c3; } return; }
      if (!g.boundingSphere) g.computeBoundingSphere(); const c = g.boundingSphere.center.clone().applyMatrix4(o.matrixWorld); if (g.boundingSphere.radius < 12) { if (inR(c.x, c.z) && c.y > gnd(c.x, c.z) + 0.2) { o.visible = false; ch++; } return; }
      if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < CX - 25 || bb.min.x > CX + 14 || bb.max.z < CZ - 9 || bb.min.z > CZ + 9) return;
      const e = o.matrixWorld.elements, I = g.index, n = I ? I.count : P.count, ix = (k) => I ? I.getX(k) : k; let c2 = 0;
      for (let t = 0; t < n; t += 3) { let x = 0, y = 0, z = 0; for (let q = 0; q < 3; q++) { const i = ix(t + q); x += (P.getX(i) * e[0] + P.getY(i) * e[4] + P.getZ(i) * e[8] + e[12]) / 3; y += (P.getX(i) * e[1] + P.getY(i) * e[5] + P.getZ(i) * e[9] + e[13]) / 3; z += (P.getX(i) * e[2] + P.getY(i) * e[6] + P.getZ(i) * e[10] + e[14]) / 3; } if (!isFinite(x + y + z) || !inR(x, z) || y < gnd(x, z) + 0.3) continue; if (I) { I.setX(t + 1, I.getX(t)); I.setX(t + 2, I.getX(t)); } else for (const q of [t + 1, t + 2]) P.setXYZ(q, P.getX(t), P.getY(t), P.getZ(t)); c2++; }
      if (c2) { if (I) I.needsUpdate = true; P.needsUpdate = true; ch += c2; } }); out.spot = ch; }
  const L = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o)), PH = (c, o = {}) => new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 50 }, o));
  const tex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t; };
  const stripes = (c1, c2, n, vert) => tex(128, 128, (c, w, h) => { for (let k = 0; k < n; k++) { c.fillStyle = k % 2 ? c2 : c1; if (vert) c.fillRect(k * w / n, 0, w / n + 1, h); else c.fillRect(0, k * h / n, w, h / n + 1); } });
  const planks = (base, dark) => tex(256, 256, (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h); for (let k = 0; k < 16; k++) { c.fillStyle = dark; c.fillRect(0, k * 16, w, 1.5); for (let j = 0; j < 3; j++) c.fillRect(((k * 53 + j * 97) % 256), k * 16, 1.5, 16); } });
  // the run-up: asphalt from the lane to the ramp's foot, 6.5 m wide, its edges white
  if (window.__STROOT) sc.remove(window.__STROOT); const ROOT = new THREE.Group(); ROOT.userData.keep = true; sc.add(ROOT); window.__STROOT = ROOT;
  // (a ribbon over the meadow's own heights, in the lanes' asphalt: a flat plane had the grass coming through it)
  { const u0 = -Lh - 13.5, u1 = -Lh + 0.3, AS = Tex.all().asphalt, rib = (v0, v1, nv, dy, mat) => { const NU = 26, pos = [], uv = [], idx = [];
      for (let i = 0; i <= NU; i++) for (let j = 0; j <= nv; j++) { const u = u0 + (u1 - u0) * i / NU, v = v0 + (v1 - v0) * j / nv, x = CX + ux * u + vx * v, z = CZ + uz * u + vz * v; pos.push(x, gnd(x, z) + dy, z); uv.push(x / 7, z / 7); if (i < NU && j < nv) { const k = i * (nv + 1) + j; idx.push(k, k + 1, k + nv + 1, k + 1, k + nv + 2, k + nv + 1); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; ROOT.add(m); return m; };
    rib(-(W + 0.6) / 2, (W + 0.6) / 2, 4, 0.13, L(0x8c8a92, { map: AS, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    for (const sv of [-1, 1]) rib(sv * W / 2 - 0.07, sv * W / 2 + 0.07, 1, 0.14, L(0xf2f2ee, { polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 })); }
  // the ramp itself, the same shape, and its dress per look: floor, slopes, skirt
  const V = [{ name: 'koncertni oder', floor: () => L(0xffffff, { map: planks('#2a2a2e', '#141416') }), slope: () => L(0xffffff, { map: stripes('#2c2c30', '#3c3c42', 12, false) }), skirt: () => L(0x16161a), trim: 0xc8ccd2 },
    { name: 'cvetlični oder', floor: () => L(0xffffff, { map: planks('#c89a62', '#9a7448') }), slope: () => L(0x4f9a3a), skirt: () => L(0x2f6a2a), trim: 0xf4f4f0 },
    { name: 'cirkuški oder', floor: () => L(0xffffff, { map: stripes('#d8282a', '#f2c12e', 10, true) }), slope: () => L(0xb8282a), skirt: () => L(0xffffff, { map: stripes('#d8282a', '#f4f4f0', 14, true) }), trim: 0xf2c12e }];
  const GS = V.map((v, vi) => { const G = new THREE.Group(); G.userData.keep = true; ROOT.add(G);
    const frame = new THREE.Group(); const c0 = W3(0, 0, 0); frame.position.set(c0[0], c0[1], c0[2]); frame.rotation.y = -HD; G.add(frame);
    const sh = new THREE.Shape([new THREE.Vector2(-Lh, 0), new THREE.Vector2(-Tp, Hh), new THREE.Vector2(Tp, Hh), new THREE.Vector2(Lh, 0)]), geo = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false }); geo.translate(0, 0, -W / 2);
    const body = new THREE.Mesh(geo, v.skirt()); body.castShadow = true; body.receiveShadow = true; frame.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(2 * Tp, 0.06, W + 0.1), v.floor()); top.position.set(0, Hh + 0.03, 0); top.receiveShadow = true; frame.add(top);
    for (const sg of [-1, 1]) { const len = Math.hypot(Lh - Tp, Hh), ang = Math.atan2(Hh, Lh - Tp), sl = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, W + 0.1), v.slope()); sl.position.set(sg * (Tp + Lh) / 2, Hh / 2 + 0.03, 0); sl.rotation.z = -sg * ang; sl.receiveShadow = true; frame.add(sl);
      if (vi === 0) for (let k = 1; k < 6; k++) { const u = sg * (Tp + (Lh - Tp) * k / 6), st = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, W), L(0xc8ccd2)); st.position.set(u, yOn(u) + 0.06, 0); frame.add(st); } }
    for (const sv of [-1, 1]) { const tr = new THREE.Mesh(new THREE.BoxGeometry(2 * Tp, 0.12, 0.12), L(v.trim)); tr.position.set(0, Hh + 0.02, sv * (W / 2 + 0.02)); frame.add(tr); }
    // the things on it: [u, v, kind, scale]; heights from the ramp's surface
    const T = [], put = (u, v2, k, s = 1, r = 0) => T.push([u, v2, k, s, r]);
    if (vi === 0) { put(0.6, 0, 'drums'); for (const sv of [-1, 1]) { put(1.6, sv * 2.5, 'speaker', 1.15); put(1.6, sv * 2.5, 'speaker2', 1.0); put(-1.9, sv * 2.2, 'amp'); put(-2.2, sv * 0.9, 'monitor'); put(2.3, sv * 3.2, 'truss'); }
      put(-1.0, -1.2, 'mic'); put(-1.0, 1.2, 'mic'); put(-0.4, 0, 'mic'); put(1.0, -1.6, 'keys'); put(2.3, 0, 'banner');
      for (const sg of [-1, 1]) for (const [f, sv, k] of [[0.25, -2.2, 'case'], [0.3, 1.9, 'case2'], [0.55, -0.6, 'reel'], [0.6, 2.4, 'chair'], [0.75, 0.8, 'case'], [0.85, -2.6, 'chair'], [0.45, 0.2, 'case2']]) put(sg * (Tp + (Lh - Tp) * f), sv, k, 1, sg); }
    if (vi === 1) { put(0, 0, 'fountain'); put(2.2, 0, 'arch'); for (const sv of [-1, 1]) { put(-1.6, sv * 2.4, 'bench'); put(1.2, sv * 2.6, 'lantern'); put(-0.6, sv * 2.7, 'pot', 1.2); put(1.9, sv * 1.6, 'pot', 0.9); }
      for (const sg of [-1, 1]) for (let k = 0; k < 6; k++) { const f = 0.12 + k * 0.15; put(sg * (Tp + (Lh - Tp) * f), -2.75, 'planter'); put(sg * (Tp + (Lh - Tp) * f), 2.75, 'planter'); if (k % 2 === 0) put(sg * (Tp + (Lh - Tp) * f), (k - 2) * 0.6, 'pot', 1.0); }
      put(-5.2, 0.4, 'gnome'); put(5.4, -0.6, 'gnome'); put(-4, -1.2, 'table'); }
    if (vi === 2) { put(0, 0, 'canopy'); put(0, 0, 'drumped', 1.2); for (const sv of [-1, 1]) { put(-1.6, sv * 2.0, 'drumped', 0.9); put(1.6, sv * 2.2, 'hoop'); put(-0.6, sv * 2.8, 'ball', 0.9); } put(1.4, 0, 'podium'); put(-1.8, 0, 'cannon');
      for (const sg of [-1, 1]) for (const [f, sv, k] of [[0.2, -1.8, 'ball'], [0.35, 1.6, 'crate'], [0.5, -0.4, 'barrelC'], [0.65, 2.3, 'crate'], [0.8, -2.4, 'barrelC'], [0.9, 0.9, 'ball'], [0.45, 2.6, 'pins']]) put(sg * (Tp + (Lh - Tp) * f), sv, k, 1, sg); }
    const BX = (g, w, h, d, m, x, y, z) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
    const CY = (g, r1, r2, h, m, x, y, z, seg = 12) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
    const SPH = (g, r, m, x, y, z) => { const me = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), m); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
    const FL = [0xe63946, 0xffd34d, 0xff8ad8, 0xffffff, 0xc86bff, 0xff8a2a];
    const MAKE = { drums: (g) => { CY(g, 0.38, 0.38, 0.5, L(0xd8282a), 0, 0.3, 0, 16).rotation.x = Math.PI / 2; for (const [x, z] of [[-0.5, 0.4], [-0.5, -0.4], [0.2, 0.6]]) CY(g, 0.2, 0.2, 0.25, L(0xd8282a), x, 0.65, z); for (const [x, z] of [[-0.7, 0.8], [0.4, -0.8]]) { CY(g, 0.015, 0.015, 1.1, L(0x9aa0a8), x, 0.55, z, 5); CY(g, 0.28, 0.28, 0.02, PH(0xd8b04a), x, 1.1, z, 16); } },
      speaker: (g, s) => { BX(g, 0.8 * s, 1.1 * s, 0.7, L(0x141416), 0, 0.55 * s, 0); for (const y of [0.3, 0.75]) CY(g, 0.22 * s, 0.22 * s, 0.04, L(0x3a3a40), -0.36 * s, y * s, 0, 14).rotation.z = Math.PI / 2; }, speaker2: (g, s) => { BX(g, 0.7 * s, 0.6 * s, 0.6, L(0x1c1c20), 0, 1.25 * s + 0.3, 0); },
      amp: (g) => { BX(g, 0.7, 0.55, 0.35, L(0x222226), 0, 0.28, 0); BX(g, 0.66, 0.08, 0.33, L(0xd8b04a), 0, 0.52, 0); }, monitor: (g) => { const m = BX(g, 0.5, 0.35, 0.8, L(0x1a1a1e), 0, 0.18, 0); m.rotation.z = 0.5; },
      mic: (g) => { CY(g, 0.2, 0.2, 0.03, L(0x222226), 0, 0.02, 0); CY(g, 0.015, 0.015, 1.5, L(0x9aa0a8), 0, 0.76, 0, 5); CY(g, 0.03, 0.02, 0.18, L(0x222226), -0.05, 1.55, 0, 6); },
      keys: (g) => { for (const z of [-0.4, 0.4]) BX(g, 0.04, 0.8, 0.04, L(0x9aa0a8), 0, 0.4, z); BX(g, 0.35, 0.08, 1.1, L(0x141416), 0, 0.84, 0); BX(g, 0.15, 0.01, 1.0, L(0xf4f4f0), -0.08, 0.885, 0); },
      truss: (g) => { const tm = L(0xc8ccd2); BX(g, 0.3, 4.6, 0.3, tm, 0, 2.3, 0); for (let y = 0.4; y < 4.4; y += 0.6) BX(g, 0.32, 0.04, 0.32, tm, 0, y, 0); CY(g, 0.18, 0.12, 0.35, L(0x141416), -0.25, 4.0, 0).rotation.z = 0.6; CY(g, 0.18, 0.12, 0.35, L(0x141416), -0.25, 3.3, 0).rotation.z = 0.6; },
      banner: (g) => { BX(g, 0.3, 0.3, 6.7, L(0xc8ccd2), 0, 4.6, 0); const b = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 0.9), L(0xffffff, { map: stripes('#2a7ad8', '#f2c12e', 8, true), side: THREE.DoubleSide })); b.position.set(0.02, 4.05, 0); b.rotation.y = Math.PI / 2; g.add(b); },
      case: (g) => { BX(g, 0.8, 0.5, 0.6, PH(0xb8bcc2), 0, 0.25, 0); BX(g, 0.82, 0.05, 0.62, L(0x2a2a2e), 0, 0.5, 0); }, case2: (g) => { BX(g, 0.6, 0.8, 0.5, PH(0x2a2a2e), 0, 0.4, 0); BX(g, 0.62, 0.05, 0.52, PH(0xb8bcc2), 0, 0.8, 0); },
      reel: (g) => { const r = CY(g, 0.4, 0.4, 0.4, L(0x8a5a34), 0, 0.4, 0, 14); r.rotation.x = Math.PI / 2; CY(g, 0.28, 0.28, 0.42, L(0xd8282a), 0, 0.4, 0, 12).rotation.x = Math.PI / 2; },
      chair: (g) => { const m = L(0xd8282a); BX(g, 0.45, 0.05, 0.45, m, 0, 0.45, 0); BX(g, 0.05, 0.45, 0.45, m, -0.2, 0.7, 0); for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) BX(g, 0.04, 0.45, 0.04, L(0x2a2a2e), x, 0.22, z); },
      fountain: (g) => { CY(g, 1.3, 1.4, 0.45, L(0xd8d4cc), 0, 0.22, 0, 20); CY(g, 1.15, 1.15, 0.05, L(0x4aa0d8), 0, 0.43, 0, 20); CY(g, 0.15, 0.2, 0.9, L(0xd8d4cc), 0, 0.85, 0); CY(g, 0.5, 0.35, 0.18, L(0xd8d4cc), 0, 1.35, 0, 16); },
      arch: (g) => { const m = L(0xf4f4f0); for (const z of [-2.6, 2.6]) BX(g, 0.18, 2.6, 0.18, m, 0, 1.3, z); const a = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.1, 6, 24, Math.PI), m); a.position.set(0, 2.6, 0); a.rotation.y = Math.PI / 2; g.add(a); for (let k = 0; k < 16; k++) { const t = k / 15 * Math.PI; SPH(g, 0.22, L(FL[k % FL.length]), 0, 2.6 + Math.sin(t) * 2.6, Math.cos(t) * 2.6); } },
      bench: (g) => { BX(g, 0.5, 0.06, 1.6, L(0xa8744a), 0, 0.45, 0); BX(g, 0.06, 0.4, 1.6, L(0xa8744a), -0.24, 0.7, 0); for (const z of [-0.7, 0.7]) BX(g, 0.45, 0.45, 0.06, L(0x2a2a2e), 0, 0.22, z); },
      lantern: (g) => { CY(g, 0.05, 0.06, 2.4, L(0x2a2a2e), 0, 1.2, 0, 6); BX(g, 0.3, 0.4, 0.3, L(0xfff2b8, { emissive: 0x6a5a20 }), 0, 2.5, 0); },
      pot: (g, s) => { CY(g, 0.32 * s, 0.24 * s, 0.45 * s, L(0xc0663a), 0, 0.22 * s, 0); for (let k = 0; k < 5; k++) SPH(g, 0.13 * s, L(FL[k % FL.length]), Math.cos(k * 1.3) * 0.16 * s, 0.5 * s + (k % 2) * 0.1, Math.sin(k * 1.3) * 0.16 * s); SPH(g, 0.22 * s, L(0x3f8a34), 0, 0.42 * s, 0); },
      planter: (g) => { BX(g, 1.0, 0.4, 0.4, L(0x8a5a34), 0, 0.2, 0); for (let k = 0; k < 4; k++) SPH(g, 0.14, L(FL[(k + 2) % FL.length]), -0.36 + k * 0.24, 0.48, 0); },
      gnome: (g) => { CY(g, 0.18, 0.22, 0.4, L(0x2a7ad8), 0, 0.2, 0); SPH(g, 0.14, L(0xf2c8a8), 0, 0.5, 0); const h2 = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 10), L(0xd8282a)); h2.position.set(0, 0.78, 0); g.add(h2); },
      table: (g) => { CY(g, 0.6, 0.6, 0.06, L(0xf4f4f0), 0, 0.75, 0, 16); CY(g, 0.05, 0.05, 0.75, L(0x2a2a2e), 0, 0.37, 0, 6); },
      canopy: (g) => { const m = L(0xf2c12e); for (const [x, z] of [[-2.3, -3.1], [2.3, -3.1], [-2.3, 3.1], [2.3, 3.1]]) CY(g, 0.07, 0.07, 3.4, m, x, 1.7, z, 6); const rf = new THREE.Mesh(new THREE.ConeGeometry(4.0, 1.6, 4, 1), L(0xffffff, { map: stripes('#d8282a', '#f4f4f0', 16, true) })); rf.position.set(0, 4.2, 0); rf.rotation.y = Math.PI / 4; rf.scale.set(0.85, 1, 1.1); rf.castShadow = true; g.add(rf); },
      drumped: (g, s) => { CY(g, 0.5 * s, 0.55 * s, 0.7 * s, L(0xffffff, { map: stripes('#2a5ab8', '#f4f4f0', 12, true) }), 0, 0.35 * s, 0, 16); CY(g, 0.52 * s, 0.52 * s, 0.05, L(0xd8282a), 0, 0.72 * s, 0, 16); },
      hoop: (g) => { CY(g, 0.05, 0.05, 1.4, L(0x9aa0a8), 0, 0.7, 0, 6); const h2 = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 6, 20), L(0xff8a2a)); h2.position.set(0, 1.9, 0); h2.rotation.y = Math.PI / 2; g.add(h2); },
      ball: (g, s) => { const b = SPH(g, 0.45 * s, L(0xffffff, { map: stripes('#d8282a', '#f2c12e', 8, true) }), 0, 0.45 * s, 0); },
      podium: (g) => { CY(g, 0.6, 0.7, 1.0, L(0xd8282a), 0, 0.5, 0, 6); CY(g, 0.62, 0.62, 0.06, L(0xf2c12e), 0, 1.02, 0, 6); },
      cannon: (g) => { const b = CY(g, 0.28, 0.36, 2.0, L(0x2a5ab8), 0, 0.9, 0, 14); b.rotation.z = -0.9; for (const z of [-0.45, 0.45]) { const w = CY(g, 0.4, 0.4, 0.1, L(0xd8282a), 0.1, 0.4, z, 14); w.rotation.x = Math.PI / 2; } },
      crate: (g) => { BX(g, 0.7, 0.7, 0.7, L(0xb88a4a), 0, 0.35, 0); BX(g, 0.5, 0.5, 0.5, L(0xc89a5a), 0, 0.95, 0); },
      barrelC: (g) => { CY(g, 0.32, 0.32, 0.85, L(0xffffff, { map: stripes('#d8282a', '#f4f4f0', 6, false) }), 0, 0.43, 0, 14); },
      pins: (g) => { for (let k = 0; k < 3; k++) { CY(g, 0.05, 0.09, 0.45, L(0xf4f4f0), (k - 1) * 0.22, 0.23, 0, 8); SPH(g, 0.06, L(0xd8282a), (k - 1) * 0.22, 0.5, 0); } } };
    let cnt = 0; for (const [u, v2, k, s, r] of T) { const g = new THREE.Group(), base = yOn(u), slope = Math.abs(u) > Tp && Math.abs(u) < Lh ? Math.atan2(Hh, Lh - Tp) * Math.sign(u) : 0; g.position.set(u, base + 0.06, v2); g.rotation.z = -slope; if (MAKE[k]) MAKE[k](g, s); frame.add(g); cnt++; }
    G.traverse(o => { o.userData.keep = true; }); G.visible = vi === 0; out['n' + vi] = cnt; return G; });
  window.__STAGE = (k) => { GS.forEach((G, i) => { G.visible = i === k; }); return V[k].name; };
  window.__STAGEI = { CX, CZ, HD, y0, W, Lh };
  return JSON.stringify(out); })()
