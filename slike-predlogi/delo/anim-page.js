(() => {
  // (pictures only) the user: "na gradbišču naj bo čim več elementov, ki se premikajo: žerjav, bager, kamion, dvigalo ... v lunaparku naj se tudi
  // premikajo elementi". The site's machines (merged into the map's still meshes) taken out and built again with moving parts: the tower crane
  // (slewing, its trolley, the hook with a concrete bucket from the mixer to the building), the excavator (swing, boom, arm, bucket: digging the
  // pit, loading the truck), the dump truck (a loop on the site's north: loaded, to the spoil heap, tipping), the hoist cage on the building, the
  // mixer's drum, a wheel loader at the gravel heap, a roller, a scissor lift. The pit's floor dug earth (it showed the grass). The park's rides
  // turning, swinging, rising; the pirate ship swinging along its length (it hung across); the volcano's smoke rising, its bombs flying, its train
  // going round; the gondola's cabins. window.__ANIM(t): everything at time t (s); every loop is 16 s long (or 8), so a 16 s film runs round.
  const H = window.__H3, sc = Render.scene, out = {}; sc.updateMatrixWorld(true);
  if (window.__ANROOT) sc.remove(window.__ANROOT); const ROOT = new THREE.Group(); ROOT.userData.keep = true; sc.add(ROOT); window.__ANROOT = ROOT;
  const gnd = (x, z) => H.ground(x, z), L = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o)), PH = (c, o = {}) => new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 50 }, o));
  const TAU = Math.PI * 2, PER = 16, sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }, wrapT = (t, p) => ((t % p) + p) % p;
  // keyframes [[t, v], ...] (t from 0 to the loop's length, the first value again at the end): eased between them
  const kf = (K, t, p = PER) => { t = wrapT(t, p); for (let i = 0; i < K.length - 1; i++) if (t <= K[i + 1][0]) { const f = sst(K[i][0], K[i + 1][0], t), a = K[i][1], b = K[i + 1][1]; return Array.isArray(a) ? a.map((v, j) => v + (b[j] - v) * f) : a + (b - a) * f; } return K[K.length - 1][1]; };
  let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const Mh = (geo, m, x, y, z, par, sh = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = true; par.add(o); return o; };
  const B = (par, w, h, d, m, x = 0, y = 0, z = 0) => Mh(new THREE.BoxGeometry(w, h, d), m, x, y, z, par);
  const C = (par, r0, r1, h, m, x = 0, y = 0, z = 0, seg = 12) => Mh(new THREE.CylinderGeometry(r0, r1, h, seg), m, x, y, z, par);
  const G = (par, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); par.add(g); return g; };
  const ROD = (par, a, b, r, m, seg = 6) => { const A = new THREE.Vector3(a[0], a[1], a[2]), E = new THREE.Vector3(b[0], b[1], b[2]), l = A.distanceTo(E), o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg), m); o.position.copy(A).add(E).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), E.clone().sub(A).normalize()); o.castShadow = true; par.add(o); return o; };
  // a heading hd: the thing's +x along (cos hd, sin hd)
  const place = (g, x, z, hd, dy = 0) => { g.position.set(x, gnd(x, z) + dy, z); g.rotation.set(0, -hd, 0); };
  const WHEEL = (par, r, w, x, y, z, m) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14), m); o.rotation.x = Math.PI / 2; o.position.set(x, y, z); o.castShadow = true; par.add(o); return o; };
  const tex = (w, h, f) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const YEL = PH(0xf2b418), YEL2 = PH(0xf2c12e), DK = L(0x2a2a2a), DK2 = L(0x3a3a3a), GL = PH(0x1d2630, { shininess: 90 }), CON = L(0x9a9690), ORG = PH(0xff8a1f), WHT = PH(0xf4f4f0), BLU = PH(0x2a5ab8), RED = PH(0xd8282a);
  const SOIL = L(0x6e4a2c), STEEL = PH(0x9aa0a8), TYRE = L(0x161616), BED = PH(0xe8b018), GRAV = L(0x8e8a84);
  const latImg = tex(64, 64, (c) => { c.clearRect(0, 0, 64, 64); c.strokeStyle = '#f2c12e'; c.lineWidth = 8; c.strokeRect(4, 4, 56, 56); c.lineWidth = 6; c.beginPath(); c.moveTo(4, 60); c.lineTo(60, 4); c.stroke(); });
  const LAT = (rx, ry) => { const t = latImg.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide }); };

  // ---- the old machines out of the merged meshes (their triangles folded)
  const fold = (X0, X1, Z0, Z1, test) => { let ch = 0; sc.traverse(o => { if (!o.isMesh || o.userData.keep) return; for (let p = o.parent; p; p = p.parent) if (p.userData && p.userData.keep) return; const g = o.geometry, P = g && g.attributes.position; if (!P) return;
      if (o.isInstancedMesh) { const M4 = new THREE.Matrix4(), V = new THREE.Vector3(), Z = new THREE.Matrix4().makeScale(0, 0, 0); let c3 = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); V.setFromMatrixPosition(M4).applyMatrix4(o.matrixWorld); if (V.x > X0 && V.x < X1 && V.z > Z0 && V.z < Z1 && test(V.x, V.y + 0.3, V.z, V.y + 0.6, null)) { o.setMatrixAt(i, Z); c3++; } } if (c3) { o.instanceMatrix.needsUpdate = true; ch += c3; } return; }
      if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < X0 || bb.min.x > X1 || bb.max.z < Z0 || bb.min.z > Z1) return;
      const e = o.matrixWorld.elements, I = g.index, CA = g.attributes.color, n = I ? I.count : P.count, ix = (k) => I ? I.getX(k) : k; let c2 = 0;
      for (let t = 0; t < n; t += 3) { let x = 0, y = 0, z = 0, yM = -1e9; for (let q = 0; q < 3; q++) { const i = ix(t + q), px = P.getX(i), py = P.getY(i), pz = P.getZ(i), vy = px * e[1] + py * e[5] + pz * e[9] + e[13]; x += (px * e[0] + py * e[4] + pz * e[8] + e[12]) / 3; y += vy / 3; yM = Math.max(yM, vy); z += (px * e[2] + py * e[6] + pz * e[10] + e[14]) / 3; }
        if (!isFinite(x + y + z) || x < X0 || x > X1 || z < Z0 || z > Z1) continue; const i0 = ix(t), col = CA ? [CA.getX(i0), CA.getY(i0), CA.getZ(i0)] : null; if (!test(x, y, z, yM, col)) continue;
        if (I) { I.setX(t + 1, I.getX(t)); I.setX(t + 2, I.getX(t)); } else for (const q of [t + 1, t + 2]) P.setXYZ(q, P.getX(t), P.getY(t), P.getZ(t)); c2++; }
      if (c2) { if (I) I.needsUpdate = true; P.needsUpdate = true; ch += c2; } }); return ch; };
  const dark = (c) => c && c[0] < 0.1 && c[1] < 0.1 && c[2] < 0.1;
  if (!window.__ANFOLD) { window.__ANFOLD = 1;
    { const y0 = gnd(-66, 112), A = [-75.8, 118.0], E = [-37.0, 94.2], dSeg = (x, z) => { const dx = E[0] - A[0], dz = E[1] - A[1], t = Math.max(0, Math.min(1, ((x - A[0]) * dx + (z - A[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - A[0] - dx * t, z - A[1] - dz * t); };
      out.oldCrane = fold(-68, -64, 110, 114, (x, y, z, yM) => yM > y0 + 0.35 && y < y0 + 30) + fold(-80, -33, 90, 122, (x, y, z, yM) => y > y0 + 12.5 && y < y0 + 32 && dSeg(x, z) < 2.8); }
    { const y0 = gnd(-68.5, 103); out.oldExc = fold(-74.4, -65.8, 101.1, 104.9, (x, y, z, yM, c) => y > y0 - 0.1 && y < y0 + 6 && (yM > y0 + 0.35 || dark(c))); }
    { const y0 = gnd(-61, 109.5); out.oldDump = fold(-64.9, -57.3, 107.9, 111.1, (x, y, z, yM, c) => y > y0 - 0.1 && y < y0 + 4 && (yM > y0 + 0.35 || dark(c))); } }

  // ---- the pit's floor: dug earth with the machines' ruts (it showed the grass)
  { const X0 = -99.6, X1 = -72.4, Z0 = 86.4, Z1 = 103.6, rim = gnd(-86, 108.6), fl = gnd(-86, 95), deep = rim - fl > 0.8, S = 0.6, nx = Math.round((X1 - X0) / S), nz = Math.round((Z1 - Z0) / S), pos = [], uv = [], idx = [], ok = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = X0 + (X1 - X0) * i / nx, z = Z0 + (Z1 - Z0) * j / nz, y = gnd(x, z); pos.push(x, y + 0.05, z); uv.push(x / 9, z / 9); ok.push(!deep || y < rim - 0.6); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * (nx + 1) + i, q = [k, k + 1, k + nx + 1, k + nx + 2]; if (q.every(v => ok[v])) idx.push(q[0], q[2], q[1], q[1], q[2], q[3]); }
    const tx = tex(256, 256, (c, w, h) => { c.fillStyle = '#6a4630'; c.fillRect(0, 0, w, h); for (let k = 0; k < 2600; k++) { c.fillStyle = rnd() < 0.5 ? 'rgba(40,24,12,0.35)' : 'rgba(150,110,72,0.30)'; const r = 1 + rnd() * 3; c.fillRect(rnd() * w, rnd() * h, r, r); }
      c.strokeStyle = 'rgba(34,22,12,0.42)'; c.lineWidth = 7; for (const y0 of [64, 90, 166, 192]) { c.beginPath(); c.moveTo(0, y0); for (let x = 0; x <= w; x += 16) c.lineTo(x, y0 + 7 * Math.sin(x * 0.0245 * 1 + y0)); c.stroke(); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, L(0xffffff, { map: tx, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.receiveShadow = true; ROOT.add(m); out.pit = [+(rim - fl).toFixed(2), idx.length / 3];
    // a puddle in its low corner
    const pd = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20), PH(0x4a5a5a, { shininess: 120, transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); pd.rotation.x = -Math.PI / 2; pd.scale.set(1.5, 1, 1); pd.position.set(-95.5, gnd(-95.5, 90) + 0.08, 90); ROOT.add(pd); }

  // ---- the tower crane: same spot and height, slewing; the trolley and the hook carry a concrete bucket from the mixer to the building's floor
  const CR = { x: -66, z: 112, H: 24 };
  { const y0 = gnd(CR.x, CR.z), g = G(ROOT, CR.x, y0, CR.z); CR.y0 = y0; B(g, 3.2, 1.0, 3.2, CON, 0, 0.5, 0); B(g, 1.6, CR.H, 1.6, LAT(1, CR.H / 1.6), 0, 1 + CR.H / 2, 0);
    const sl = G(g, 0, 1 + CR.H, 0); CR.sl = sl; CR.ys = y0 + 1 + CR.H;
    B(sl, 2.4, 0.7, 2.4, YEL2, 0, 0.35, 0); const cab = G(sl, 1.4, 0.7, 1.6); B(cab, 1.7, 1.6, 1.4, YEL2, 0, 0.8, 0); B(cab, 1.72, 0.8, 1.42, GL, 0.05, 1.1, 0);
    for (const [a, b] of [[0.8, 0.8], [0.8, -0.8], [-0.8, 0.8], [-0.8, -0.8]]) ROD(sl, [a, 0.7, b], [0, 7.0, 0], 0.1, YEL2);
    B(sl, 33, 1.3, 1.3, LAT(26, 1), 17.3, 1.35, 0); B(sl, 12, 1.1, 1.8, LAT(10, 1), -6.4, 1.25, 0); B(sl, 11, 0.12, 1.0, DK2, -6.4, 1.84, 0);
    for (const k of [0, 1, 2]) B(sl, 0.75, 2.4, 2.0, CON, -9.4 - k * 0.8, 0.1, 0);
    ROD(sl, [0, 7.0, 0], [23, 2.0, 0], 0.05, DK); ROD(sl, [0, 7.0, 0], [-11.6, 1.8, 0], 0.05, DK); B(sl, 0.5, 0.5, 0.5, RED, 33.6, 2.2, 0);
    const tr = G(sl, 20, 0.55, 0); CR.tr = tr; B(tr, 1.3, 0.4, 1.5, DK2, 0, 0, 0);
    const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 4), DK); cb.castShadow = false; tr.add(cb); CR.cb = cb;
    const hk = G(sl, 20, -10, 0); CR.hk = hk; B(hk, 0.8, 0.7, 0.55, RED, 0, 0.35, 0); B(hk, 0.12, 0.45, 0.12, DK, 0, -0.2, 0);
    const bk = G(hk, 0, -2.6, 0); C(bk, 0.8, 0.45, 1.3, L(0x8a8e94), 0, 0.65, 0, 14); C(bk, 0.84, 0.84, 0.14, DK2, 0, 1.3, 0, 14); for (const a of [0, 2.1, 4.2]) ROD(bk, [Math.cos(a) * 0.75, 1.36, Math.sin(a) * 0.75], [0, 2.55, 0], 0.025, DK);
    // the two ends of its run: the bucket by the mixer's chute, the bucket on the building's half floor
    const P1 = [-41.6, 112], P2 = [-54.5, 98.5], th = (P) => Math.atan2(-(P[1] - CR.z), P[0] - CR.x), rr = (P) => Math.hypot(P[0] - CR.x, P[1] - CR.z);
    const lo1 = gnd(P1[0], P1[1]) + 0.25 + 2.6, lo2 = gnd(-50, 98) + 3.96 + 0.05 + 2.6, hi = y0 + 13; const t1 = th(P1), t2 = th(P2), r1 = rr(P1), r2 = rr(P2);
    CR.KT = [[0, t1], [2.6, t1], [7.6, t2], [11.4, t2], [15.0, t1], [16, t1]]; CR.KR = [[0, r1], [2.6, r1], [7.6, r2], [11.4, r2], [15.0, r1], [16, r1]];
    CR.KY = [[0, lo1], [1.2, lo1], [2.6, hi], [7.6, hi], [9.2, lo2], [10.4, lo2], [11.4, hi], [15.0, hi], [16, lo1]]; out.crane = [t1, t2, r1, r2].map(v => +v.toFixed(2)); }

  // ---- the excavator: on the pit's north edge, bigger than the old one; swings between the pit (digging) and the truck (loading)
  const EX = { x: -86, z: 108.6, S: 1.35 };
  { const g = G(ROOT); place(g, EX.x, EX.z, 0); g.scale.setScalar(EX.S); EX.g = g;
    for (const z of [-1.15, 1.15]) { B(g, 4.4, 0.85, 0.8, DK, 0, 0.42, z); for (let k = 0; k < 9; k++) B(g, 0.12, 0.88, 0.84, DK2, -2.0 + k * 0.5, 0.42, z); }
    B(g, 2.0, 0.3, 2.0, DK, 0, 0.95, 0); const up = G(g, 0, 1.1, 0); EX.up = up;
    B(up, 3.0, 1.1, 2.5, YEL, -0.2, 0.55, 0); B(up, 0.9, 1.1, 2.5, DK2, -1.95, 0.6, 0); B(up, 1.3, 0.5, 1.2, YEL, -0.9, 1.3, -0.55); C(up, 0.07, 0.07, 0.8, DK, -1.2, 1.9, -0.9, 6);
    B(up, 1.1, 1.5, 1.1, YEL, 0.75, 1.85, 0.62); B(up, 1.12, 0.85, 1.12, GL, 0.78, 2.05, 0.62);
    const bm = G(up, 1.15, 1.05, -0.3); EX.bm = bm; B(bm, 3.6, 0.55, 0.5, YEL, 1.8, 0, 0);
    const arm = G(bm, 3.6, 0, 0); EX.arm = arm; B(arm, 3.26, 0.42, 0.42, YEL, 1.63, 0, 0);
    const bk = G(arm, 3.26, 0, 0); EX.bk = bk; B(bk, 0.9, 0.75, 0.8, DK2, 0.35, -0.3, 0); B(bk, 0.16, 0.1, 0.84, STEEL, 0.82, -0.66, 0);
    const so = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), SOIL); so.scale.set(1.1, 0.6, 0.95); so.position.set(0.35, 0.08, 0); bk.add(so); EX.soil = so;
    const vP = (gnd(-86, 98) - gnd(EX.x, EX.z)) / EX.S;
    // the arm's tip by its two links from the boom's foot (1.15, 2.15): boom, arm angles; the bucket's own angle (w) against the level
    EX.ik = (u, v) => { const L1 = 3.6, L2 = 3.26, dx = u - 1.15, dy = v - 2.15, d = Math.min(L1 + L2 - 0.02, Math.hypot(dx, dy)), ca = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), al = -Math.acos(Math.max(-1, Math.min(1, ca))), be = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(al), L1 + L2 * Math.cos(al)); return [be, al]; };
    const PI2 = Math.PI / 2, uT = (113.5 - EX.z) / EX.S;
    // [u, v, swing, bucket]: swing pi/2 faces the pit (-z), -pi/2 the truck (+z)
    EX.K = [[0, [4.4, 3.4, PI2, 1.9]], [1.6, [uT + 0.3, 3.3, -PI2, 1.9]], [2.6, [uT + 0.3, 3.3, -PI2, -1.3]], [4.2, [4.4, 3.0, PI2, 0]], [5.6, [5.6, vP + 0.6, PI2, -0.6]], [7.0, [4.3, vP + 0.4, PI2, 0.6]],
      [8.0, [4.9, vP + 1.8, PI2, 1.4]], [9.2, [5.9, vP + 0.5, PI2, -0.4]], [10.8, [4.1, vP + 0.5, PI2, 0.9]], [12.4, [4.4, 3.4, PI2, 1.9]], [16, [4.4, 3.4, PI2, 1.9]]]; out.exc = [+vP.toFixed(2), +uT.toFixed(2)]; }

  // ---- the dump truck: a loop north of the pit (by the excavator, round the east end, the spoil heap by the north fence, round the west end)
  const TK = { zA: 113.5, zB: 121.5, xW: -107, xE: -79, R: 4 };
  { const g = G(ROOT); TK.g = g; B(g, 7.0, 0.35, 1.9, DK, 0, 0.95, 0); const cab = G(g, 2.55, 0, 0); B(cab, 1.9, 2.0, 2.4, ORG, 0, 2.1, 0); B(cab, 0.06, 0.85, 2.2, GL, 0.96, 2.55, 0); B(cab, 1.0, 0.7, 2.42, GL, 0.15, 2.5, 0); B(cab, 0.5, 0.12, 0.5, ORG, -0.3, 3.16, 0);
    for (const x of [2.55, -0.5, -1.85]) for (const z of [-1.05, 1.05]) WHEEL(g, 0.55, 0.45, x, 0.55, z, TYRE);
    const bp = G(g, -0.9, 1.15, -1.18); TK.bed = bp; const bd = G(bp, 0, 0, 1.18); B(bd, 4.6, 0.15, 2.3, BED, 0, 0.08, 0); for (const z of [-1.1, 1.1]) B(bd, 4.6, 1.1, 0.12, BED, 0, 0.7, z); B(bd, 0.15, 1.5, 2.3, BED, 2.35, 0.85, 0); B(bd, 0.15, 1.0, 2.3, BED, -2.35, 0.6, 0);
    const ld = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 8), SOIL); ld.scale.set(2.0, 0.55, 0.95); ld.position.set(0, 0.95, 0); ld.castShadow = true; bd.add(ld); TK.ld = ld;
    const LA = TK.xE - TK.xW, LC = Math.PI * TK.R; TK.Ltot = 2 * LA + 2 * LC;
    TK.at = (s) => { s = wrapT(s, TK.Ltot); if (s < LA) return [TK.xW + s, TK.zA, 0]; s -= LA; if (s < LC) { const a = -Math.PI / 2 + s / TK.R; return [TK.xE + TK.R * Math.cos(a), (TK.zA + TK.zB) / 2 + TK.R * Math.sin(a), a + Math.PI / 2]; } s -= LC;
      if (s < LA) return [TK.xE - s, TK.zB, Math.PI]; s -= LA; const a = Math.PI / 2 + s / TK.R; return [TK.xW + TK.R * Math.cos(a), (TK.zA + TK.zB) / 2 + TK.R * Math.sin(a), a + Math.PI / 2]; };
    const sL = EX.x + 0.9 - TK.xW, sT = LA + LC + (TK.xE - (-97)); TK.KS = [[0, sL], [4.0, sL], [8.5, sT], [11.0, sT], [15.0, sL + TK.Ltot], [16, sL + TK.Ltot]]; TK.KB = [[0, 0], [8.6, 0], [9.5, 0.9], [10.3, 0.9], [11.0, 0], [16, 0]];
    // the spoil heap beside the north side, where it tips
    const hp = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.35, 14), SOIL); hp.scale.set(1.5, 1, 0.8); hp.position.set(-97.2, gnd(-97.2, 124.6) + 0.6, 124.6); hp.castShadow = hp.receiveShadow = true; ROOT.add(hp);
    const hp2 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.9, 12), SOIL); hp2.position.set(-101.5, gnd(-101.5, 124.8) + 0.4, 124.8); hp2.castShadow = hp2.receiveShadow = true; ROOT.add(hp2); out.truck = [+sL.toFixed(1), +sT.toFixed(1), +TK.Ltot.toFixed(1)]; }

  // ---- the hoist on the building's east side: a mast and a cage going up to the top of the scaffold and down
  const HO = {};
  { const x = -40.6, z = 93.4, y0 = gnd(x, z), g = G(ROOT, x, y0, z); B(g, 1.7, 0.4, 1.7, CON, 0, 0.2, 0); B(g, 0.8, 13, 0.8, LAT(1, 13 / 0.8), 0, 6.9, 0); B(g, 1.1, 0.5, 1.1, YEL2, 0, 13.6, 0);
    const cg = G(g, 0, 0.4, 1.25); HO.cage = cg; B(cg, 1.5, 2.2, 1.5, PH(0xd8d8d0), 0, 1.1, 0); B(cg, 1.52, 0.6, 1.52, GL, 0, 1.55, 0); B(cg, 1.6, 0.12, 1.6, ORG, 0, 2.26, 0);
    // a second storey going up on the half floor (columns, rebar): the hoist and the crane have something to serve
    const fx = -50, fz = 98, fy = gnd(fx, fz) + 3.96; for (const xx of [-7, -2.33]) for (const zz of [-5, 0, 5]) { C(ROOT, 0.22, 0.22, 2.6, CON, fx + xx, fy + 1.3, fz + zz, 8); C(ROOT, 0.03, 0.03, 1.0, L(0x6a3a2a), fx + xx, fy + 3.1, fz + zz, 4); } }

  // ---- the mixer truck by the building, its drum turning; the crane's bucket filled at its chute
  const MX = {};
  { const g = G(ROOT); place(g, -36, 112, 0); MX.g = g; B(g, 7.4, 0.35, 1.9, DK, 0, 0.95, 0); const cab = G(g, 2.75, 0, 0); B(cab, 1.8, 2.0, 2.4, WHT, 0, 2.1, 0); B(cab, 0.06, 0.85, 2.2, GL, 0.91, 2.55, 0); B(cab, 1.82, 0.25, 2.42, BLU, 0, 1.25, 0);
    for (const x of [2.75, -1.0, -2.3]) for (const z of [-1.05, 1.05]) WHEEL(g, 0.55, 0.45, x, 0.55, z, TYRE);
    const dp = G(g, -0.9, 2.55, 0); dp.rotation.z = 0.14; const dr = G(dp); MX.dr = dr;
    const dt = tex(64, 16, (c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#e8452c' : '#f4f4f0'; c.fillRect(k * w / 8, 0, w / 8 + 1, h); } });
    const dg = new THREE.CylinderGeometry(1.1, 1.1, 3.6, 16, 1); dg.rotateZ(Math.PI / 2); Mh(dg, L(0xffffff, { map: dt }), 0, 0, 0, dr); const c1 = Mh(new THREE.ConeGeometry(1.1, 1.1, 16), WHT, -2.35, 0, 0, dr); c1.rotation.z = Math.PI / 2; const c2 = Mh(new THREE.ConeGeometry(1.1, 0.9, 16), WHT, 2.25, 0, 0, dr); c2.rotation.z = -Math.PI / 2;
    const ch = B(g, 1.4, 0.12, 0.5, STEEL, -4.2, 1.7, 0); ch.rotation.z = 0.35; B(g, 0.5, 1.6, 0.5, DK2, -3.5, 1.9, 0); }

  // ---- a wheel loader at the gravel heap in the west: into the heap, scoops, piles it higher
  const LD = {};
  { const hp = new THREE.Mesh(new THREE.ConeGeometry(3.3, 2.0, 16), GRAV); hp.position.set(-120, gnd(-120, 73.8) + 0.95, 73.8); hp.castShadow = hp.receiveShadow = true; ROOT.add(hp);
    const g = G(ROOT); LD.g = g; B(g, 2.6, 1.4, 2.0, YEL, -1.2, 1.25, 0); B(g, 2.0, 0.9, 1.6, YEL, 0.9, 1.05, 0); B(g, 1.4, 1.5, 1.5, YEL, -0.6, 2.6, 0); B(g, 1.42, 0.85, 1.52, GL, -0.55, 2.8, 0); B(g, 0.9, 0.2, 1.8, DK2, -2.4, 2.0, 0);
    for (const x of [-1.5, 1.1]) for (const z of [-1.05, 1.05]) WHEEL(g, 0.75, 0.55, x, 0.75, z, TYRE);
    const la = G(g, 0.4, 1.7, 0); LD.la = la; for (const z of [-0.75, 0.75]) B(la, 2.4, 0.25, 0.22, YEL, 1.2, 0, z);
    const bk = G(la, 2.4, 0, 0); LD.bk = bk; B(bk, 0.9, 0.8, 2.3, DK2, 0.4, -0.25, 0); const so = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), GRAV); so.scale.set(0.9, 0.5, 2.0); so.position.set(0.4, 0.15, 0); bk.add(so); LD.soil = so;
    // [z, arms, bucket] along x -120, facing the heap (-z)
    LD.K = [[0, [86, -0.35, 0]], [2.0, [80.2, -0.35, 0]], [3.0, [80.2, -0.1, 0.8]], [4.2, [81.2, 0.55, 0.8]], [5.0, [81.2, 0.55, -0.9]], [5.6, [81.2, 0.55, -0.9]], [7.2, [86, -0.35, 0]], [8, [86, -0.35, 0]]]; }

  // ---- a roller compacting a strip in the west, forwards and back (ribs on its drum show it turning)
  const RL = {};
  { const g = G(ROOT); RL.g = g; const dr = G(g, 1.5, 0.8, 0); RL.dr = dr; WHEEL(dr, 0.8, 2.1, 0, 0, 0, YEL); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; B(dr, 0.12, 0.12, 2.14, DK2, Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0); }
    B(g, 0.5, 0.8, 2.3, YEL, 1.5, 1.45, 0); B(g, 2.2, 1.2, 1.8, YEL, -0.6, 1.05, 0); for (const z of [-0.85, 0.85]) WHEEL(g, 0.6, 0.45, -1.0, 0.6, z, TYRE);
    for (const [x, z] of [[-1.3, -0.7], [-1.3, 0.7], [0.2, -0.7], [0.2, 0.7]]) B(g, 0.08, 1.6, 0.08, DK, x, 2.4, z); B(g, 1.8, 0.1, 1.7, YEL2, -0.55, 3.2, 0);
    RL.K = [[0, 104], [3.5, 117], [4.0, 117], [7.5, 104], [8, 104]];
    // the strip it rolls: a darker, smoother band
    const st = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 17), L(0x7a6a58, { transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); st.rotation.x = -Math.PI / 2; st.position.set(-131, gnd(-131, 110.5) + 0.07, 110.5); ROOT.add(st); }

  // ---- a scissor lift by the building's west wall: the platform going up and down
  const SL = {};
  { const x = -59.8, z = 98, g = G(ROOT); place(g, x, z, Math.PI / 2); SL.g = g; B(g, 2.4, 0.5, 1.2, ORG, 0, 0.45, 0); for (const xx of [-0.9, 0.9]) for (const zz of [-0.5, 0.5]) WHEEL(g, 0.2, 0.15, xx, 0.2, zz, TYRE);
    SL.bars = []; for (const zz of [-0.5, 0.5]) for (let k = 0; k < 3; k++) for (const s of [1, -1]) { const b = B(g, 2.0, 0.09, 0.09, DK2, 0, 1, zz); SL.bars.push([b, k, s]); }
    const pl = G(g, 0, 1, 0); SL.pl = pl; B(pl, 2.6, 0.14, 1.3, ORG, 0, 0, 0); for (const zz of [-0.62, 0.62]) B(pl, 2.6, 0.06, 0.06, YEL2, 0, 1.0, zz); for (const xx of [-1.27, 1.27]) B(pl, 0.06, 0.06, 1.3, YEL2, xx, 1.0, 0); for (const [xx, zz] of [[-1.27, -0.62], [1.27, -0.62], [-1.27, 0.62], [1.27, 0.62]]) B(pl, 0.05, 1.0, 0.05, YEL2, xx, 0.5, zz);
    SL.K = [[0, 0.4], [1.0, 0.4], [3.5, 4.6], [5.5, 4.6], [7.5, 0.4], [8, 0.4]]; }

  // ---- the park: the rides found where the park put them
  const lp = (x, z, r, f) => sc.children.filter(o => o.userData && o.userData.lp && o.visible && Math.hypot(o.position.x - x, o.position.z - z) < r && (!f || f(o)));
  const hasG = (o, T) => { let b = false; o.traverse(q => { if (q.geometry && q.geometry.type === T) b = true; }); return b; };
  const PK = {};
  { const w = lp(5.5, -28, 2, o => o.isGroup && hasG(o, 'TorusGeometry'))[0]; if (w) { const rim = new THREE.Group(); w.add(rim); const cabs = [];
      for (const c of w.children.slice()) { if (c === rim || !c.geometry) continue; const p = c.geometry.parameters || {}; if (c.geometry.type === 'TorusGeometry' || (c.geometry.type === 'BoxGeometry' && p.width === 0.1)) rim.attach(c); else if (c.geometry.type === 'BoxGeometry' && p.width === 1.3) cabs.push(c); }
      PK.wheel = { rim, cabs, r: 8 }; } out.wheel = !!w; }
  PK.car = [[86.47, -4.57], [35.25, -120.91]].map(([x, z]) => { const g = lp(x, z, 1.5, o => o.isGroup)[0]; if (!g) return null; return { g, ry: g.rotation.y, horses: g.children.filter(c => c.geometry && c.geometry.type === 'BoxGeometry' && c.geometry.parameters.width === 1.0).map(c => [c, c.position.y]) }; }).filter(Boolean);
  PK.spin = [[80.98, -125.64, 1], [39.53, -163.64, 7 / 14], [77.29, -69.84, 1]].map(([x, z, f]) => { const g = lp(x, z, 1.5, o => o.isGroup)[0]; return g ? { g, ry: g.rotation.y, f } : null; }).filter(Boolean);
  { const [cx, cz, rx, rz] = [72, -31, 9, 16]; PK.train = lp(cx, cz, 18, o => o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width === 1.6 && o.geometry.parameters.height === 1.0).map(o => [o, Math.atan2((o.position.z - cz) / rz, (o.position.x - cx) / rx)]); PK.tr0 = [cx, cz, rx, rz]; }
  PK.boats = lp(32, -70, 14, o => o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width === 1.6 && o.geometry.parameters.height === 0.5).map((o, k) => [o, o.position.x, o.position.z, k]);
  // the parkfix rides: the ship's swinging part turned to hang along its length (it hung across the frames), the pendulum, the drop tower's seats
  { const R = window.__PFROOT; if (R) for (const g of R.children) { const sub = g.children.filter(c => c.isGroup); for (const s of sub) { const y = s.position.y;
      if (Math.abs(y - 11) < 0.01) { if (!s.userData.along) { const inn = new THREE.Group(); inn.rotation.y = Math.PI / 2; inn.scale.setScalar(0.92); for (const c of s.children.slice()) inn.add(c); s.add(inn); let am = null;
        inn.children.forEach(c => { if (c.geometry && c.geometry.type === 'CylinderGeometry' && Math.abs(c.geometry.parameters.radiusTop - 0.18) < 0.001) { c.visible = false; am = c.material; } }); if (am) for (const sx of [-1.9, 1.9]) for (const sz of [-4.0, 4.0]) ROD(s, [sx, 0, 0], [sx, -6.45, sz], 0.18, am); s.userData.along = 1; } PK.ship = s; }
      else if (Math.abs(y - 16.5) < 0.01) { PK.arm = s; PK.ring = s.children.find(c => c.isGroup);
        if (!g.userData.legs) { let lm = null; g.children.forEach(c => { if (c.geometry && c.geometry.type === 'CylinderGeometry' && Math.abs(c.geometry.parameters.radiusTop - 0.45) < 0.001) { c.visible = false; lm = c.material; } }); if (lm) for (const sz of [-1, 1]) for (const sx of [-1, 1]) ROD(g, [sx * 7.5, 0, sz * 5.6], [0, 16.5, sz * 1.5], 0.45, lm); g.userData.legs = 1; } } else if (Math.abs(y - 21) < 0.01) PK.seat = s; } } }
  out.park = { car: PK.car.length, spin: PK.spin.length, train: PK.train.length, boats: PK.boats.length, ship: !!PK.ship, arm: !!PK.arm, ring: !!PK.ring, seat: !!PK.seat };

  // ---- everything at time t
  const VA = window.__VOLCA; out.volc = VA ? [VA.smoke.length, VA.vents.length, VA.bombs.length] : 0;
  window.__ANIM = (t) => {
    { const th = kf(CR.KT, t), r = kf(CR.KR, t), yh = kf(CR.KY, t) - CR.ys; CR.sl.rotation.y = th; CR.tr.position.x = r; CR.hk.position.set(r, yh, 0); const bot = yh + 0.7 - 0.55; CR.cb.position.y = (-0.2 + bot) / 2; CR.cb.scale.y = Math.max(0.05, -0.2 - bot); }
    { const [u, v, ps, w] = kf(EX.K, t), [be, al] = EX.ik(u, v); EX.up.rotation.y = ps; EX.bm.rotation.z = be; EX.arm.rotation.z = al; EX.bk.rotation.z = w - be - al; const tt = wrapT(t, PER); EX.soil.visible = tt >= 7.0 || tt < 2.2; }
    { const s = kf(TK.KS, t), [x, z, h] = TK.at(s), tt = wrapT(t, PER); place(TK.g, x, z, h); TK.bed.rotation.x = -kf(TK.KB, t); const tb = kf(TK.KB, t); TK.ld.visible = tt >= 2.0 && tt < 9.9; TK.ld.scale.set(2.0, 0.55 * sst(1.8, 2.8, tt) + 0.05, 0.95); TK.ld.position.z = -tb * 1.2; }
    HO.cage.position.y = kf([[0, 0.4], [1.5, 0.4], [4, 7.2], [5.5, 7.2], [8, 0.4]], t, 8);
    MX.dr.rotation.x = -wrapT(t, PER) / PER * 2 * TAU;
    { const [z, a, b] = kf(LD.K, t, 8), tt = wrapT(t, 8); place(LD.g, -120, z, -Math.PI / 2); LD.la.rotation.z = a; LD.bk.rotation.z = b; LD.soil.visible = tt >= 3.0 && tt < 5.0; }
    { const z = kf(RL.K, t, 8); place(RL.g, -131, z, Math.PI / 2); RL.dr.rotation.z = -(z - 104) / 0.8; }
    { const h = kf(SL.K, t, 8), hs = h / 3, Lb = 2.0, lx = Math.sqrt(Math.max(0.05, Lb * Lb - hs * hs)), an = Math.atan2(hs, lx); for (const [b, k, s] of SL.bars) { b.position.y = 0.7 + hs * (k + 0.5); b.rotation.z = s * an; } SL.pl.position.y = 0.75 + h; }
    // the park
    if (PK.wheel) { const W = PK.wheel, ph = wrapT(t, PER) / PER * (TAU / 2); W.rim.rotation.z = ph; W.cabs.forEach((c, k) => { const a = k / 12 * TAU + ph; c.position.set(Math.cos(a) * W.r, Math.sin(a) * W.r - 0.8, 0); }); }
    for (const c of PK.car) { c.g.rotation.y = c.ry - wrapT(t, PER) / PER * TAU; c.horses.forEach(([h, y0], k) => { h.position.y = y0 + 0.3 * Math.sin(wrapT(t, PER) / PER * TAU * 3 + k * 1.3); }); }
    for (const s of PK.spin) s.g.rotation.y = s.ry + wrapT(t, PER) / PER * TAU * s.f;
    { const [cx, cz, rx, rz] = PK.tr0, da = wrapT(t, PER) / PER * TAU; for (const [o, a0] of PK.train) { const a = a0 + da, x = cx + rx * Math.cos(a), z = cz + rz * Math.sin(a), hx = -rx * Math.sin(a), hz = rz * Math.cos(a); o.position.x = x; o.position.z = z; o.position.y = gnd(x, z) + 0.7; o.rotation.y = -Math.atan2(hz, hx); } }
    for (const [o, x0, z0, k] of PK.boats) { const a = wrapT(t, PER) / PER * TAU + k * 1.7, x = x0 + 1.3 * Math.cos(a), z = z0 + 1.3 * Math.sin(a); o.position.x = x; o.position.z = z; o.rotation.y = -Math.atan2(Math.cos(a), -Math.sin(a)); }
    if (PK.ship) PK.ship.rotation.set(0.85 * Math.sin(wrapT(t, 8) / 8 * TAU), 0, 0);
    if (PK.arm) PK.arm.rotation.z = 1.5 * Math.sin(wrapT(t, 8) / 8 * TAU); if (PK.ring) PK.ring.rotation.y = wrapT(t, PER) / PER * TAU;
    if (PK.seat) PK.seat.position.y = kf([[0, 2.2], [1.0, 2.2], [7.0, 32], [9.0, 32], [10.2, 9], [11.0, 2.2], [16, 2.2]], t);
    // the volcano: smoke rising and widening, steam from the vents, bombs on their arcs, the train round
    if (VA) { const tt = wrapT(t, PER), HM = 44 * 1.3 + 1.5;
      for (const s of VA.smoke) { const h = wrapT(s.h + tt / PER * HM, HM), r = 1.8 + h * 0.26; s.p.position.set(VA.CX + h * 0.42 + s.jx, VA.yLake + 3 + h, VA.CZ - h * 0.2 + s.jz); s.p.scale.setScalar(r / (1.8 + s.h * 0.26)); if (!s.ash && VA.mats) s.p.material = VA.mats[Math.min(4, Math.floor(h / 12))]; s.p.visible = h > 0.6; }
      for (const v of VA.vents) { const q = wrapT(v.q + tt / 4, 4); v.p.position.set(v.x + q * 0.4, v.y + 0.6 + q * 1.1, v.z - q * 0.2); v.p.scale.setScalar((0.5 + q * 0.35) / (0.5 + v.q * 0.35)); }
      for (const [k, b] of VA.bombs.entries()) { const T = 3.2, tau = wrapT(tt + k * 1.13, T), v0 = 11 + b.h * 0.3, rr = (3 + b.h * 0.9) * tau / T; b.b.position.set(VA.CX + Math.cos(b.a) * rr, VA.yLake + 1 + v0 * tau - 4.9 * tau * tau, VA.CZ + Math.sin(b.a) * rr); b.b.visible = b.b.position.y > VA.yLake + 0.5; } }
    if (window.__VOLC) window.__VOLC(wrapT(t, PER) / PER + 0.22);
    // the gondola: the two cabins shuttle (each waits at its station)
    if (window.__GOND) window.__GOND(kf([[0, 0.02], [2, 0.02], [8, 0.98], [10, 0.98], [16, 0.02]], t));
    return t; };
  // a fixed view the way the game's iso camera looks (centred on x, z)
  window.__ISOAT = (x, z) => { const gy0 = gnd(x, z), D = 57, pitch = 0.82; Render.camera.far = Math.max(Render.camera.far, 2000); Render.setShot({ px: x, py: gy0 + D * Math.sin(pitch), pz: z + D * Math.cos(pitch), tx: x, ty: gy0, tz: z, fov: 30, fogD: 600, gy: 0, near: 1 }); for (let k = 0; k < 2; k++) Render.frame(1 / 60, 1, __game.race.player, 'tv', {}); return 'iso'; };
  window.__CAMAT = (p, q, fov) => { Render.camera.far = Math.max(Render.camera.far, 2000); Render.setShot({ px: p[0], py: p[1], pz: p[2], tx: q[0], ty: q[1], tz: q[2], fov: fov || 50, fogD: 600, gy: 0, near: 0.5 }); if (Render.setDetailDist) Render.setDetailDist(1e5); for (let k = 0; k < 2; k++) Render.frame(1 / 60, 1, __game.race.player, 'tv', {}); return 'cam'; };
  window.__ANIM(0);
  return JSON.stringify(out); })()
