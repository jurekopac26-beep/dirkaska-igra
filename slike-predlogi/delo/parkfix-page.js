(() => {
  // (pictures only) the user: "fix the irregularities": the park's crude rides made properly: the pirate ship (was a dark box on two poles) a swinging
  // ship on an A-frame, the pendulum (loose sticks) a ride with legs, an arm and a ring of seats, the drop tower (a plain blue box) a tower with a
  // seat ring and a top; the leftover box and post at the motocross start by the ring road gone
  const H = window.__H3, sc = Render.scene, out = {}; sc.updateMatrixWorld(true);
  if (window.__PFROOT) sc.remove(window.__PFROOT); const ROOT = new THREE.Group(); ROOT.userData.keep = true; sc.add(ROOT); window.__PFROOT = ROOT;
  const gnd = (x, z) => H.ground(x, z), L = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o)), PH = (c, o = {}) => new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 60 }, o));
  const LAD = [15.95, -10.77], LADA = 4.049, NIH = [-8.2, -214.24], NIHA = -3.002, PAD = [3.79, -229.53];
  // the old ones hidden: the park's own top-level groups standing at those spots
  { let n = 0; for (const o of sc.children) { if (!o.userData || !o.userData.lp || o.userData.keep) continue; const p = new THREE.Vector3(); o.getWorldPosition(p); for (const [x, z, r] of [[LAD[0], LAD[1], 3], [NIH[0], NIH[1], 3], [PAD[0], PAD[1], 3]]) if (Math.hypot(p.x - x, p.z - z) < r) { o.visible = false; n++; } } out.hidden = n; }
  const box = (g, w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.rotation.set(rx, ry, rz); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
  const cyl = (g, r1, r2, h, m, x, y, z, seg = 12) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  const rod = (g, a, b, r, m) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), m); me.position.copy(A.clone().add(B).multiplyScalar(0.5)); me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); me.castShadow = true; g.add(me); return me; };
  const tex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t; };
  // 1. the pirate ship: two A-frames 11 m high, the pivot beam, the ship (a real hull: keel, bow and stern raised, rails, benches) on four arms,
  //    swung 28 degrees, a mast with a striped sail and a black flag, a deck to board it
  { const g = new THREE.Group(); g.position.set(LAD[0], gnd(LAD[0], LAD[1]), LAD[1]); g.rotation.y = -LADA; ROOT.add(g); const ST = PH(0x5a5e66), WOOD = L(0x7a4a26), DARK = L(0x3a2414), GOLD = PH(0xd8b04a);
    const PV = 11.0; for (const sx of [-6.2, 6.2]) { rod(g, [sx, 0, -4.5], [sx, PV, 0], 0.32, ST); rod(g, [sx, 0, 4.5], [sx, PV, 0], 0.32, ST); rod(g, [sx, 2.5, -3.5], [sx, 2.5, 3.5], 0.16, ST); }
    cyl(g, 0.45, 0.45, 13.0, ST, 0, PV, 0).rotation.z = Math.PI / 2; box(g, 12.0, 0.5, 9.5, L(0xb9b5ad), 0, 0.25, 0);
    const sw = new THREE.Group(); sw.position.set(0, PV, 0); sw.rotation.x = 0; sw.rotation.z = 0; g.add(sw); const ang = 0.49; sw.rotation.set(ang, 0, 0);
    for (const sx of [-4.2, 4.2]) for (const sz of [-1]) { rod(sw, [sx * 0.35, 0, 0], [sx, -7.2, 0], 0.18, ST); }
    // the hull: a stretched shape (long in x), deeper in the middle, raised bow and stern
    const sh = new THREE.Shape(); sh.moveTo(-7.5, 1.2); sh.quadraticCurveTo(-7.2, -0.6, -4.5, -1.3); sh.lineTo(4.5, -1.3); sh.quadraticCurveTo(7.2, -0.6, 7.8, 1.6); sh.lineTo(-7.5, 1.6); const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 3.4, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 2 }), WOOD); hull.position.set(0, -8.6, -1.7); hull.castShadow = true; sw.add(hull);
    box(sw, 14.6, 0.12, 3.6, DARK, 0, -7.0, 0); for (const sz of [-1.85, 1.85]) box(sw, 14.4, 0.25, 0.12, GOLD, 0, -6.95, sz); for (let k = -5; k <= 5; k += 2) box(sw, 0.5, 0.5, 3.2, L(0xd8282a), k, -6.65, 0);
    cyl(sw, 0.16, 0.2, 7.5, WOOD, 0, -3.2, 0); const sail = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.6), L(0xffffff, { map: tex(64, 64, (c, w, h) => { for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#1c1c1e' : '#f4f4f0'; c.fillRect(0, k * h / 6, w, h / 6 + 1); } }), side: THREE.DoubleSide })); sail.position.set(0, -2.8, 0.1); sail.rotation.y = Math.PI / 2; sw.add(sail);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), L(0x1c1c1e, { side: THREE.DoubleSide })); fl.position.set(0.7, 0.75, 0); fl.rotation.y = 0; sw.add(fl);
    for (const sx of [-7.8, 7.9]) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.4, 8), GOLD); f.position.set(sx, -7.2, 0); f.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2; sw.add(f); }
    g.traverse(o => { o.userData.keep = true; }); out.ship = 1; }
  // 2. the pendulum: two A-frame legs 17 m, the arm swung 62 degrees, a ring of 16 seats spinning at its end, a boarding platform
  { const g = new THREE.Group(); g.position.set(NIH[0], gnd(NIH[0], NIH[1]), NIH[1]); g.rotation.y = -NIHA; ROOT.add(g); const ST = PH(0xf4f4f0), RD = PH(0xd8282a), YL = PH(0xf2c12e), PV = 16.5;
    for (const sz of [-3.4, 3.4]) { rod(g, [-5.5, 0, sz], [0, PV, sz * 0.4], 0.45, ST); rod(g, [5.5, 0, sz], [0, PV, sz * 0.4], 0.45, ST); }
    cyl(g, 0.7, 0.7, 3.4, RD, 0, PV, 0).rotation.x = Math.PI / 2; box(g, 10, 0.6, 10, L(0xb9b5ad), 0, 0.3, 0);
    const arm = new THREE.Group(); arm.position.set(0, PV, 0); arm.rotation.z = 1.08; g.add(arm); box(arm, 1.0, 13.5, 1.0, RD, 0, -6.75, 0); box(arm, 0.6, 3.0, 0.6, YL, 0, 1.5, 0); box(arm, 2.6, 2.6, 2.6, PH(0x3a3e44), 0, 3.2, 0);
    const ring = new THREE.Group(); ring.position.set(0, -14.2, 0); arm.add(ring); const rr = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.35, 8, 32), YL); rr.rotation.x = Math.PI / 2; rr.castShadow = true; ring.add(rr); cyl(ring, 3.0, 3.0, 0.4, RD, 0, 0.1, 0, 24);
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, s = box(ring, 0.6, 0.9, 0.7, PH([0x2a5ab8, 0xf2c12e][k % 2]), Math.cos(a) * 3.4, 0.4, Math.sin(a) * 3.4); s.rotation.y = -a; } g.traverse(o => { o.userData.keep = true; }); out.pendulum = 1; }
  // 3. the drop tower: a white and blue lattice-looking mast 36 m, a ring of seats part way up (riders' legs hanging), a lit cap, a fenced base
  { const g = new THREE.Group(); g.position.set(PAD[0], gnd(PAD[0], PAD[1]), PAD[1]); ROOT.add(g); const Hh = 36, BL = PH(0x2a5ab8), WH = PH(0xf4f4f0);
    for (let y = 0; y < Hh; y += 3) cyl(g, 0.95, 0.95, 3, (y / 3) % 2 ? BL : WH, 0, y + 1.5, 0, 12); for (let y = 1.5; y < Hh; y += 1.5) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 4, 16), PH(0x9aa0a8)); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
    const cap = cyl(g, 2.0, 1.4, 2.2, PH(0xd8282a), 0, Hh + 1.1, 0, 16); const lt = cyl(g, 2.05, 2.05, 0.3, new THREE.MeshBasicMaterial({ color: 0xffe08a }), 0, Hh + 0.2, 0, 16);
    const seat = new THREE.Group(); seat.position.y = 21; g.add(seat); cyl(seat, 3.4, 3.4, 1.0, PH(0xff8a2a), 0, 0, 0, 24); for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, x = Math.cos(a) * 3.3, z = Math.sin(a) * 3.3; const b = box(seat, 0.55, 0.9, 0.5, PH(0x1c1c1e), x, 0.2, z); b.rotation.y = -a; for (const o2 of [-0.12, 0.12]) { const lg = box(seat, 0.12, 0.8, 0.12, L(0x2a3a6a), Math.cos(a) * 3.55 - Math.sin(a) * o2, -0.7, Math.sin(a) * 3.55 + Math.cos(a) * o2); } }
    box(g, 12, 0.5, 12, L(0xb9b5ad), 0, 0.25, 0); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; box(g, 0.08, 1.1, 0.08, PH(0x9aa0a8), Math.cos(a) * 5.6, 1.05, Math.sin(a) * 5.6); } const fr = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.05, 4, 48), PH(0x9aa0a8)); fr.rotation.x = Math.PI / 2; fr.position.y = 1.55; g.add(fr);
    g.traverse(o => { o.userData.keep = true; }); out.tower = 1; }
  // 4. at the motocross start by the ring road: whatever stands there off the asphalt (the old start's box and post) folded
  { const NP = H.roads.nord.P2.map(p => [p.x, p.z]), NHW = H.roads.nord.wd / 2, dN = (x, z) => { let b = 1e9; for (let i = 1; i < NP.length; i++) { const [ax, az] = NP[i - 1], [bx, bz] = NP[i], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); b = Math.min(b, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return b - NHW; };
    let ch = 0; sc.traverse(o => { if (!o.isMesh || o.userData.keep || o.userData.mx3) return; const g = o.geometry, P = g && g.attributes.position; if (!P) return;
      if (o.isInstancedMesh) { const M4 = new THREE.Matrix4(), V = new THREE.Vector3(), Z = new THREE.Matrix4().makeScale(0, 0, 0); let c3 = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); V.setFromMatrixPosition(M4).applyMatrix4(o.matrixWorld); if (V.x > -312 && V.x < -289 && V.z > -250 && V.z < -226 && dN(V.x, V.z) > 0.4 && V.y > gnd(V.x, V.z) + 0.2) { o.setMatrixAt(i, Z); c3++; } } if (c3) { o.instanceMatrix.needsUpdate = true; ch += c3; } return; }
      if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < -312 || bb.min.x > -289 || bb.max.z < -250 || bb.min.z > -226) return;
      const e = o.matrixWorld.elements, I = g.index, n = I ? I.count : P.count, ix = (k) => I ? I.getX(k) : k; let c2 = 0;
      for (let t = 0; t < n; t += 3) { let x = 0, y = 0, z = 0, yM = -1e9; for (let q = 0; q < 3; q++) { const i = ix(t + q), vy = P.getX(i) * e[1] + P.getY(i) * e[5] + P.getZ(i) * e[9] + e[13]; x += (P.getX(i) * e[0] + P.getY(i) * e[4] + P.getZ(i) * e[8] + e[12]) / 3; y += vy / 3; yM = Math.max(yM, vy); z += (P.getX(i) * e[2] + P.getY(i) * e[6] + P.getZ(i) * e[10] + e[14]) / 3; }
        if (!isFinite(x + y + z) || x < -312 || x > -289 || z < -250 || z > -226 || dN(x, z) < 0.4 || yM < gnd(x, z) + 0.3 || y > gnd(x, z) + 8) continue; if (I) { I.setX(t + 1, I.getX(t)); I.setX(t + 2, I.getX(t)); } else for (const q of [t + 1, t + 2]) P.setXYZ(q, P.getX(t), P.getY(t), P.getZ(t)); c2++; }
      if (c2) { if (I) I.needsUpdate = true; P.needsUpdate = true; ch += c2; } }); out.mxLeft = ch; }
  return JSON.stringify(out); })()
