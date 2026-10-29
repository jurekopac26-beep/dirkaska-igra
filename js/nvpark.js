// NEW VERSION · TEST 1: the north of the small circuit's infield as the user chose it in the pictures (lunapark 1, 13.–22. 10.): a park of grass
// (cut 1.55 m short of the circuit and the ring road) with three lanes of asphalt (6.5 m) from the lane by the SE lot north to three round plazas,
// each with a fountain on a lawn and trees round it; the rides by the lanes (the big wheel, two carousels, the cups, the swing tower, the drop tower,
// the pendulum, the boat swing, the dark ride's house, the little train ring), a pond with pedal boats, stalls and benches along the lanes, bouncy
// castles, trees, people. Built by js/newmap.js hub4G over the infield (its old gravel ways there are not made, H3.PARK), before the still meshes
// are merged (js/nvbake.js). Loaded with the new map (js/game.js nvStart).
const NVPark = (function () {
  'use strict';
  // where the park lies (the infield north of the big lot), what stands in it (from the pictures' lunapark 1, lp3d/build3e.js)
  const PARK = [[-24, -238], [6, -246], [70, -224], [112, -212], [116, -150], [112, -40], [108, 30], [60, 34], [20, 26], [-4, -6], [4, -60], [-10, -120], [-26, -190]];
  const J = { PL: { F: [38, -28, 15], C: [58, -140, 14], A: [22, -210, 12] }, KOLO: [5.5, -28, 8], VRT_O: [86.47, -4.57], VRT: [35.25, -120.91], LAD: [15.95, -10.77, 4.05, 16],
    VLAK_O: [72, -31, 9, 16], LET: [77.29, -69.84], SKOD: [80.98, -125.64], VER: [39.53, -163.64], AVT: [82.4, -111.6, 12, 6.8], NIH: [-8.2, -214.24, -3.0], PAD_T: [3.79, -229.53],
    HISA: [24.17, -185.14, 16, 10.5, -0.09],
    LAKE: [[30.5, -78.5], [36, -81.5], [41.5, -78.5], [43, -71], [40.5, -63.5], [35, -56], [28, -54.5], [24, -60], [27, -70.5]],
    LANES: [[[77, 27], [76.5, 14], [72, 3], [62, -7], [50, -17], [38, -28]], [[38, -28], [45, -44], [55.5, -63], [62, -83], [64, -101], [66, -115], [63.5, -128], [58, -140]],
      [[58, -140], [56.5, -156], [51.5, -167], [49.5, -178], [47.5, -189], [40, -198.5], [31, -205], [22, -210]]] };
  const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const inPark = (x, z) => inPoly(PARK, x, z);
  // the toy shop by road 2 and the glass footbridge over it (their feet, the path between): nothing of the park's stands there
  const TOY = { x: 77, z: 33.4 }, GLB = { x: 58, z: 48.2 }, plot = (x, z) => (x > TOY.x - 8 && x < TOY.x + 8 && z > TOY.z - 8.4 && z < TOY.z + 4.6) || (x > GLB.x - 5.5 && x < GLB.x + 5.5 && z > GLB.z - 26.5 && z < GLB.z - 10) || (x > GLB.x - 2 && x < 71 && z > 23 && z < 31);
  let built = null, volc = null, vt = 0;

  function build(MK) {
    const H3 = MK.H3, T = MK.T(), TL = H3.TL, gy = (x, z) => H3.ground(x, z), tx = Tex.all(), own = [];
    const inP = (x, z) => inPark(x, z) && (!H3.inside || H3.inside(x, z));   // (the park within the circuit's infield: its outline reaches past the circuit's west side)
    const rd = (x, z) => Math.min(Math.abs(T.query(x, z).d) - T.w, TL ? TL.dist(x, z, 30) - T.w : 1e9), inG = (x, z) => inP(x, z) && rd(x, z) > 3.5, inGg = (x, z) => inP(x, z) && rd(x, z) > 1.55;
    MK.clearWorld(inG, -99);   // (the World's things in the park: trees, signs, tyres)
    const MC = new Map(), mkey = (p, c, o) => p + c + JSON.stringify(o, (k, v) => v && v.isTexture ? 'tex' + v.id : v);
    const L = (c, o = {}) => { const k = mkey('L', c, o); let m = MC.get(k); if (!m) MC.set(k, m = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o))); return m; };   // (one material per colour and look: the still meshes merge by it, js/nvbake.js)
    const put = (m, cast = true) => { m.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = true; } }); MK.add(m); own.push(m); return m; };
    const at = (m, x, z, y = 0, ry = 0) => { m.position.set(x, gy(x, z) + y, z); m.rotation.y = ry; return put(m); };
    const flat = (g, m) => { const me = new THREE.Mesh(g, m); me.receiveShadow = true; MK.add(me); own.push(me); return me; };
    // the ground: the park's grass on a 3 m grid, its edge snapped onto the line where it stops (smooth along the circuit and the ring road); not where
    // the whole infield is grass already (js/newmap.js, H3.inGrass)
    if (!H3.inGrass) { const xs = PARK.map(p => p[0]), zs = PARK.map(p => p[1]), X0 = Math.min(...xs) - 2, Z0 = Math.min(...zs) - 2, S = 3, NX = Math.ceil((Math.max(...xs) + 2 - X0) / S), NZ = Math.ceil((Math.max(...zs) + 2 - Z0) / S), IN = new Uint8Array((NX + 1) * (NZ + 1)), pos = [], uv = [], idx = [], vid = new Map();
      for (let a = 0; a <= NX; a++) for (let b = 0; b <= NZ; b++) IN[a * (NZ + 1) + b] = inGg(X0 + a * S, Z0 + b * S) ? 1 : 0;
      const vert = (a, b, na, nb) => { const key = a + ',' + b + ',' + na + ',' + nb; if (vid.has(key)) return vid.get(key); let x = X0 + a * S, z = Z0 + b * S;
        if (!IN[a * (NZ + 1) + b]) { let lo = 0, hi = 1; const xi = X0 + na * S, zi = Z0 + nb * S; for (let k = 0; k < 10; k++) { const m = (lo + hi) / 2; if (inGg(xi + (x - xi) * m, zi + (z - zi) * m)) lo = m; else hi = m; } x = xi + (x - xi) * lo; z = zi + (z - zi) * lo; }
        const v = pos.length / 3; pos.push(x, gy(x, z) + 0.06, z); uv.push(x / 14, z / 14); vid.set(key, v); return v; };
      for (let a = 0; a < NX; a++) for (let b = 0; b < NZ; b++) { const C4 = [[a, b], [a + 1, b], [a + 1, b + 1], [a, b + 1]], ins = C4.map(([p, q]) => IN[p * (NZ + 1) + q]); if (!(ins[0] || ins[1] || ins[2] || ins[3])) continue;
        const pick = (k) => { if (ins[k]) return vert(C4[k][0], C4[k][1], C4[k][0], C4[k][1]); for (const d of [1, 3, 2]) { const m = (k + d) % 4; if (ins[m]) return vert(C4[k][0], C4[k][1], C4[m][0], C4[m][1]); } return 0; };
        const v = [0, 1, 2, 3].map(pick); idx.push(v[0], v[2], v[1], v[0], v[3], v[2]); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const gt = tx.grass; gt.wrapS = gt.wrapT = THREE.RepeatWrapping; flat(g, L(0xbfe0a0, { map: gt, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); }
    // the lanes and the plazas' rings: asphalt 6.5 m wide, 0.1 m over the ground
    const lane = (pts, w = 6.5) => { const cv = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z))), n = Math.max(4, Math.round(cv.getLength() / 1.5)), P = cv.getSpacedPoints(n), pos = [], uv = [], idx = [];
      P.forEach((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n, i + 1)], tx2 = b.x - a.x, tz2 = b.z - a.z, l = Math.hypot(tx2, tz2) || 1, nx = -tz2 / l, nz = tx2 / l;
        for (const s of [-1, 1]) { const x = p.x + nx * s * w / 2, z = p.z + nz * s * w / 2; pos.push(x, gy(x, z) + 0.1, z); uv.push(x / 7, z / 7); } if (i) { const q = (i - 1) * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      flat(g, L(0x8c8a92, { map: tx.asphalt, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); return P; };
    const LP = J.LANES.map(p => lane(p));
    // the plazas: a ring of lane round a lawn with a fountain and trees
    for (const k of ['F', 'C', 'A']) { const [x, z, R] = J.PL[k], ring = []; for (let q = 0; q <= 48; q++) { const a = q / 48 * 6.283; ring.push([x + R * Math.cos(a), z + R * Math.sin(a)]); } lane(ring);
      at(new THREE.Mesh(new THREE.CylinderGeometry(R - 5, R - 4.6, 0.5, 24), L(0x7aa84a)), x, z, 0.25); at(new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 0.7, 20), L(0xd8d4c8)), x, z, 0.5); at(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.1, 20), L(0x4aa0d8)), x, z, 0.85);
      for (let t = 0; t < 8; t++) { const a = t / 8 * 6.283, px = x + Math.cos(a) * (R - 6), pz = z + Math.sin(a) * (R - 6); at(new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), L(0x4f8a34)), px, pz, 2.6); at(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2, 6), L(0x6a4a2a)), px, pz, 1); } }
    const SC = new Map(), STR = (c1, c2, n = 12) => SC.get(c1 + c2 + n) || SC.set(c1 + c2 + n, STR0(c1, c2, n)).get(c1 + c2 + n);
    const STR0 = (c1, c2, n) => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 8; const x = cv.getContext('2d'); for (let k = 0; k < n; k++) { x.fillStyle = k % 2 ? c1 : c2; x.fillRect(k * 128 / n, 0, 128 / n, 8); } return new THREE.CanvasTexture(cv); };
    // the big wheel: two rims with their spokes, twelve gondolas, the legs
    { const [cx, cz, r] = J.KOLO, g = new THREE.Group(); for (const s of [-0.9, 0.9]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.2, 4, 28), L(0xf4f4f0)); t.position.z = s; g.add(t);
        for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283, sp = new THREE.Mesh(new THREE.BoxGeometry(0.1, r, 0.1), L(0xf4f4f0)); sp.position.set(Math.cos(a) * r / 2, Math.sin(a) * r / 2, s); sp.rotation.z = a - Math.PI / 2; g.add(sp); } }
      const CC = [0xe8452c, 0x2a7ad8, 0xf2c12e, 0x3fbf6a, 0xc86bff, 0xff8a2a]; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283, cb = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.4), L(CC[k % 6])); cb.position.set(Math.cos(a) * r, Math.sin(a) * r - 0.8, 0); g.add(cb); }
      for (const s of [-1, 1]) { const lg = new THREE.Mesh(new THREE.BoxGeometry(0.4, r + 2.5, 0.4), L(0x9aa0a8)); lg.position.set(s * 4, -(r + 2.5) / 2 + 0.4, 0); lg.rotation.z = s * 0.35; g.add(lg); }
      at(g, cx, cz, r + 2, Math.PI / 2); }
    const carousel = (x, z, r, c1, c2) => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.5, 16), L(0xe8dcc0))); const rf = new THREE.Mesh(new THREE.ConeGeometry(r + 0.6, 2.4, 16, 1), L(0xffffff, { map: STR(c1, c2, 16) })); rf.position.y = 4.6; g.add(rf);
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 10), L(0xf2c12e)); p.position.y = 2.2; g.add(p);
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283, h = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.4), L([0xf4f4f0, 0x8a5a3a, 0x2a2622][k % 3])); h.position.set(Math.cos(a) * (r - 1), 1.2 + (k % 2) * 0.4, Math.sin(a) * (r - 1)); h.rotation.y = -a; g.add(h);
        const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 4), L(0xf2c12e)); pl.position.set(Math.cos(a) * (r - 1), 1.9, Math.sin(a) * (r - 1)); g.add(pl); } return at(g, x, z, 0.25); };
    carousel(J.VRT_O[0], J.VRT_O[1], 4.3, '#3fbf6a', '#f4f4f0'); carousel(J.VRT[0], J.VRT[1], 7.2, '#e8452c', '#f4f4f0');
    // the cups on their disc
    { const g = new THREE.Group(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283, c = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.0, 1.1, 10), L([0xff6aa8, 0x6ab8ff, 0xffd34d, 0x8ae06a, 0xc86bff, 0xff8a2a][k])); c.position.set(Math.cos(a) * 3.6, 0.8, Math.sin(a) * 3.6); g.add(c); }
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 0.3, 16), L(0xd8d4f0))); at(g, J.SKOD[0], J.SKOD[1], 0.15); }
    // the swing tower: a post, a striped top, fourteen seats on their chains
    { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 9, 10), L(0xd8d4cc)); p.position.y = 4.5; g.add(p); const t = new THREE.Mesh(new THREE.ConeGeometry(3.5, 1.6, 16), L(0xffffff, { map: STR('#2a7ad8', '#f2c12e', 12) })); t.position.y = 9.4; g.add(t);
      for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283, s = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.6), L(0xe8452c)); s.position.set(Math.cos(a) * 6.5, 4.5, Math.sin(a) * 6.5); g.add(s); const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.4, 3), L(0x8a8e92)); ch.position.set(Math.cos(a) * 5.3, 6.6, Math.sin(a) * 5.3); ch.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); g.add(ch); }
      at(g, J.VER[0], J.VER[1]); }
    // the dark ride's hall, its striped roof
    { const [x, z, w, d] = J.AVT; at(new THREE.Mesh(new THREE.BoxGeometry(w, 3.2, d), L(0x2a3a5a)), x, z, 1.6); at(new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.3, d + 1), L(0xffffff, { map: STR('#e8452c', '#f4f4f0', 10) })), x, z, 3.4); }
    // the boat swing: two A-frames 11 m high, the pivot beam, a real hull (keel, bow and stern raised, rails, benches) on four arms, swung 28 degrees,
    // a mast with a striped sail and a black flag, a deck to board it
    const PH = (c, o = {}) => { const k = mkey('P', c, o); let m = MC.get(k); if (!m) MC.set(k, m = new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 60 }, o))); return m; };
    const bx = (g, w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.rotation.set(rx, ry, rz); g.add(me); return me; };
    const cy = (g, r1, r2, h, m, x, y, z, seg = 12) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); me.position.set(x, y, z); g.add(me); return me; };
    const rod = (g, a, b, r, m) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), m); me.position.copy(A.clone().add(B).multiplyScalar(0.5)); me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(me); return me; };
    const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t; };
    { const [x, z, a] = J.LAD, g = new THREE.Group(), ST = PH(0x5a5e66), WOOD = L(0x7a4a26), DARK = L(0x3a2414), GOLD = PH(0xd8b04a), PV = 11.0;
      for (const sx of [-6.2, 6.2]) { rod(g, [sx, 0, -4.5], [sx, PV, 0], 0.32, ST); rod(g, [sx, 0, 4.5], [sx, PV, 0], 0.32, ST); rod(g, [sx, 2.5, -3.5], [sx, 2.5, 3.5], 0.16, ST); }
      cy(g, 0.45, 0.45, 13.0, ST, 0, PV, 0).rotation.z = Math.PI / 2; bx(g, 12.0, 0.5, 9.5, L(0xb9b5ad), 0, 0.25, 0);
      const sw = new THREE.Group(); sw.position.set(0, PV, 0); sw.rotation.set(0.49, 0, 0); g.add(sw); for (const sx of [-4.2, 4.2]) rod(sw, [sx * 0.35, 0, 0], [sx, -7.2, 0], 0.18, ST);
      const sh = new THREE.Shape(); sh.moveTo(-7.5, 1.2); sh.quadraticCurveTo(-7.2, -0.6, -4.5, -1.3); sh.lineTo(4.5, -1.3); sh.quadraticCurveTo(7.2, -0.6, 7.8, 1.6); sh.lineTo(-7.5, 1.6);
      const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 3.4, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 2 }), WOOD); hull.position.set(0, -8.6, -1.7); sw.add(hull);
      bx(sw, 14.6, 0.12, 3.6, DARK, 0, -7.0, 0); for (const sz of [-1.85, 1.85]) bx(sw, 14.4, 0.25, 0.12, GOLD, 0, -6.95, sz); for (let k = -5; k <= 5; k += 2) bx(sw, 0.5, 0.5, 3.2, L(0xd8282a), k, -6.65, 0);
      cy(sw, 0.16, 0.2, 7.5, WOOD, 0, -3.2, 0); const sail = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.6), L(0xffffff, { map: canvasTex(64, 64, (c, w, h) => { for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#1c1c1e' : '#f4f4f0'; c.fillRect(0, k * h / 6, w, h / 6 + 1); } }), side: THREE.DoubleSide })); sail.position.set(0, -2.8, 0.1); sail.rotation.y = Math.PI / 2; sw.add(sail);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), L(0x1c1c1e, { side: THREE.DoubleSide })); fl.position.set(0.7, 0.75, 0); sw.add(fl);
      for (const sx of [-7.8, 7.9]) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.4, 8), GOLD); f.position.set(sx, -7.2, 0); f.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2; sw.add(f); }
      g.userData.ride = 'ship'; at(g, x, z, 0, -a); }
    // the little train's ring: rails on a low oval (0.35 m up, over the grass), four wagons
    { const [cx, cz, rx, rz] = J.VLAK_O, pts = []; for (let k = 0; k <= 40; k++) { const a = k / 40 * 6.283; pts.push(new THREE.Vector3(cx + rx * Math.cos(a), 0, cz + rz * Math.sin(a))); } for (const p of pts) p.y = gy(p.x, p.z) + 0.55;
      put(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 80, 0.12, 4, true), L(0x6a5038)));
      for (let k = 0; k < 4; k++) { const a = 0.4 + k * 0.28; at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.0), L([0xd8282a, 0xf2c12e, 0x2a7ad8, 0x3fbf6a][k])), cx + rx * Math.cos(a), cz + rz * Math.sin(a), 1.05, -a - Math.PI / 2); } }
    // the flyer: six arms round a post, a car on each
    { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 5, 8), L(0xd8d4cc)); p.position.y = 2.5; g.add(p);
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283, arm = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.15, 0.15), L(0x9aa0a8)); arm.position.set(Math.cos(a) * 2.75, 4.4, Math.sin(a) * 2.75); arm.rotation.y = -a; g.add(arm);
        const pl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.4), L([0xe8452c, 0x2a7ad8, 0xf2c12e][k % 3])); pl.position.set(Math.cos(a) * 5.6, 3.6, Math.sin(a) * 5.6); pl.rotation.y = -a; g.add(pl); } at(g, J.LET[0], J.LET[1]); }
    // the pond with its pedal boats
    { const sh = new THREE.Shape(J.LAKE.map(([x, z]) => new THREE.Vector2(x, -z))), g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, gy(P.getX(i), P.getZ(i)) + 0.18);
      flat(g, L(0x3f8fd0, { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); for (const [x, z, c] of [[33, -63, 0xf4f4f0], [36, -73.5, 0xe63946], [28, -66, 0x3a86ff], [35, -78, 0xf4f4f0]]) at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.0), L(c)), x, z, 0.4); }
    // the pendulum: two A-frame legs 17 m, the arm swung 62 degrees, a ring of 16 seats at its end, a boarding platform
    { const g = new THREE.Group(), ST = PH(0xf4f4f0), RD = PH(0xd8282a), YL = PH(0xf2c12e), PV = 16.5;
      for (const sz of [-3.4, 3.4]) { rod(g, [-5.5, 0, sz], [0, PV, sz * 0.4], 0.45, ST); rod(g, [5.5, 0, sz], [0, PV, sz * 0.4], 0.45, ST); }
      cy(g, 0.7, 0.7, 3.4, RD, 0, PV, 0).rotation.x = Math.PI / 2; bx(g, 10, 0.6, 10, L(0xb9b5ad), 0, 0.3, 0);
      const arm = new THREE.Group(); arm.position.set(0, PV, 0); arm.rotation.z = 1.08; g.add(arm); bx(arm, 1.0, 13.5, 1.0, RD, 0, -6.75, 0); bx(arm, 0.6, 3.0, 0.6, YL, 0, 1.5, 0); bx(arm, 2.6, 2.6, 2.6, PH(0x3a3e44), 0, 3.2, 0);
      const ring = new THREE.Group(); ring.position.set(0, -14.2, 0); arm.add(ring); const rr = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.35, 6, 24), YL); rr.rotation.x = Math.PI / 2; ring.add(rr); cy(ring, 3.0, 3.0, 0.4, RD, 0, 0.1, 0, 24);
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; bx(ring, 0.6, 0.9, 0.7, PH([0x2a5ab8, 0xf2c12e][k % 2]), Math.cos(a) * 3.4, 0.4, Math.sin(a) * 3.4).rotation.y = -a; }
      g.userData.ride = 'pendulum'; at(g, J.NIH[0], J.NIH[1], 0, -J.NIH[2]); }
    // the drop tower: a white and blue mast 36 m, a ring of seats part way up (the riders' legs hanging), a lit cap, a fenced base
    { const g = new THREE.Group(), Hh = 36, BL = PH(0x2a5ab8), WH = PH(0xf4f4f0);
      for (let y = 0; y < Hh; y += 3) cy(g, 0.95, 0.95, 3, (y / 3) % 2 ? BL : WH, 0, y + 1.5, 0, 8); for (let y = 3; y < Hh; y += 3) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 3, 12), PH(0x9aa0a8)); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
      cy(g, 2.0, 1.4, 2.2, PH(0xd8282a), 0, Hh + 1.1, 0, 16); cy(g, 2.05, 2.05, 0.3, new THREE.MeshBasicMaterial({ color: 0xffe08a }), 0, Hh + 0.2, 0, 16);
      const seat = new THREE.Group(); seat.position.y = 21; g.add(seat); cy(seat, 3.4, 3.4, 1.0, PH(0xff8a2a), 0, 0, 0, 24);
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; bx(seat, 0.55, 0.9, 0.5, PH(0x1c1c1e), Math.cos(a) * 3.3, 0.2, Math.sin(a) * 3.3).rotation.y = -a; for (const o2 of [-0.12, 0.12]) bx(seat, 0.12, 0.8, 0.12, L(0x2a3a6a), Math.cos(a) * 3.55 - Math.sin(a) * o2, -0.7, Math.sin(a) * 3.55 + Math.cos(a) * o2); }
      bx(g, 12, 0.5, 12, L(0xb9b5ad), 0, 0.25, 0); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; bx(g, 0.08, 1.1, 0.08, PH(0x9aa0a8), Math.cos(a) * 5.6, 1.05, Math.sin(a) * 5.6); } const fr = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.05, 3, 32), PH(0x9aa0a8)); fr.rotation.x = Math.PI / 2; fr.position.y = 1.55; g.add(fr);
      g.userData.ride = 'tower'; at(g, J.PAD_T[0], J.PAD_T[1]); }
    // the dark ride's house
    { const [x, z, w, d, a] = J.HISA; at(new THREE.Mesh(new THREE.BoxGeometry(w, 6, d), L(0x3a2a3a)), x, z, 3, -a); at(new THREE.Mesh(new THREE.ConeGeometry(w * 0.6, 4, 4), L(0x1a1a22)), x, z, 8, -a + Math.PI / 4); }
    // along every lane, both sides, 2-4 m off its edge: stalls, crates, barrels, balloons, bins, benches, cones, lamps, barriers; four bouncy castles
    const items = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const PM = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; }, PC = [0xe8452c, 0x2a7ad8, 0xf2c12e, 0x3fbf6a, 0xc86bff, 0xff8a2a];
    const mk = { stall: (g) => { g.add(PM(new THREE.BoxGeometry(2.6, 1.1, 1.8), L(0xf0ece2), 0, 0.55, 0)); const a = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.12, 2.2), L(0xffffff, { map: STR(['#e8452c', '#2a7ad8', '#3fbf6a'][Math.floor(rnd() * 3)], '#f4f4f0', 8) })); a.position.y = 2.2; a.rotation.x = 0.15; g.add(a); for (const s of [-1.3, 1.3]) g.add(PM(new THREE.BoxGeometry(0.08, 2.2, 0.08), L(0xf4f4f0), s, 1.1, -0.9)); },
      crate: (g) => { for (const [u, v, h] of [[0, 0, 0], [0.9, 0.1, 0], [0.45, 0, 0.8]].slice(0, 1 + Math.floor(rnd() * 3))) g.add(PM(new THREE.BoxGeometry(0.8, 0.8, 0.8), L(0xb08046), u, 0.4 + h, v)); },
      barrel: (g) => { const c = [0xc8281e, 0x2a5ab8, 0xe8b43a][Math.floor(rnd() * 3)]; for (const [u, v] of [[0, 0], [0.75, 0.2], [0.3, 0.7]].slice(0, 1 + Math.floor(rnd() * 3))) g.add(PM(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 10), L(c), u, 0.45, v)); },
      balloons: (g) => { g.add(PM(new THREE.BoxGeometry(1, 0.8, 0.7), L(0xf4f4f0), 0, 0.4, 0)); for (let k = 0; k < 8; k++) { const a = k * 0.8, b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), L(PC[k % 6])); b.position.set(Math.cos(a) * 0.5, 2.2 + (k % 3) * 0.3, Math.sin(a) * 0.5); g.add(b); } },
      bin: (g) => g.add(PM(new THREE.CylinderGeometry(0.3, 0.26, 0.9, 8), L(0x3f8a4a), 0, 0.45, 0)),
      bench: (g) => { g.add(PM(new THREE.BoxGeometry(1.8, 0.1, 0.5), L(0x9a6a3a), 0, 0.45, 0)); g.add(PM(new THREE.BoxGeometry(1.8, 0.4, 0.08), L(0x9a6a3a), 0, 0.75, 0.22)); },
      cones: (g) => { for (let k = 0; k < 4; k++) g.add(PM(new THREE.ConeGeometry(0.22, 0.7, 8), L(0xff7a1a), k * 0.9 - 1.3, 0.35, 0)); },
      inflat: (g) => { const c = PC[Math.floor(rnd() * 6)]; g.add(PM(new THREE.BoxGeometry(4.5, 1.6, 4.5), L(c), 0, 0.8, 0)); for (const [u, v] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { g.add(PM(new THREE.CylinderGeometry(0.55, 0.55, 3, 10), L(0xf2c12e), u, 1.5, v)); g.add(PM(new THREE.ConeGeometry(0.6, 0.9, 10), L(0xe8452c), u, 3.4, v)); } },
      barrier: (g) => { for (let k = 0; k < 3; k++) g.add(PM(new THREE.BoxGeometry(1.9, 0.8, 0.5), L(k % 2 ? 0xf4f4f0 : 0xd8282a), k * 2 - 2, 0.4, 0)); },
      lamp: (g) => { g.add(PM(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 6), L(0x2a2d30), 0, 1.8, 0)); g.add(PM(new THREE.SphereGeometry(0.28, 8, 6), L(0xfff4c8, { emissive: 0x806a30 }), 0, 3.7, 0)); } };
    const ORDER = ['stall', 'crate', 'barrel', 'balloons', 'bin', 'bench', 'cones', 'stall', 'lamp', 'barrier', 'crate', 'bench', 'barrel', 'bin'];
    let ko = 0; for (const P of LP) for (let i = 2; i < P.length - 2; i += 3) for (const s of [-1, 1]) { const a = P[i - 1], b = P[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, off = 3.25 + 1.4 + rnd() * 1.5, x = P[i].x + nx * s * off, z = P[i].z + nz * s * off; if (!inP(x, z)) continue;
      const k = ORDER[ko++ % ORDER.length], g = new THREE.Group(); mk[k](g); if (rd(x, z) < 1.5 || plot(x, z)) continue; g.position.set(x, gy(x, z) + 0.1, z); g.rotation.y = Math.atan2(-dz, dx) + (s > 0 ? Math.PI : 0); put(g); items.push({ g, k, x, z }); }
    for (const [x, z] of [[20, -110], [88, -150], [14, -160], [92, -40]]) { const g = new THREE.Group(); mk.inflat(g); g.position.set(x, gy(x, z), z); put(g); items.push({ g, k: 'inflat', x, z }); }
    // the toy shop at the end of the lane by road 2 (the pictures' toy-page.js, the gift box the user chose): pink walls, a red lid with a yellow ribbon
    // and bow, a door and two windows under a striped awning, the sign (a bear and TOYS), a striped ball and a toy car by the door; a paved forecourt
    // from the lane's end to its door. Solid (H3.solids)
    const pave = tx.paving ? (() => { const t = tx.paving.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; return t; })() : null, PV = L(pave ? 0xece4d8 : 0xc8c0b4, { map: pave, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const S = H3.solids || (H3.solids = []);
    { const { x: CX, z: CZ } = TOY, G = new THREE.Group(), B = (w, h, d, c, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? L(c) : c); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); G.add(m); return m; };
      const stripes = (c1, n) => STR(c1, '#ffffff', n), signT = canvasTex(512, 128, (c, w, h) => { c.fillStyle = '#d83a3a'; c.fillRect(0, 0, w, h); c.lineWidth = 10; c.strokeStyle = '#ffffff'; c.strokeRect(5, 5, w - 10, h - 10);
        c.fillStyle = '#a0663a'; for (const [x, y, r] of [[50, 38, 15], [94, 38, 15], [72, 70, 33]]) { c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); } c.fillStyle = '#e8c090'; c.beginPath(); c.arc(72, 80, 14, 0, 6.3); c.fill(); c.fillStyle = '#222'; for (const [x, y, r] of [[60, 62, 4.5], [84, 62, 4.5], [72, 75, 5]]) { c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); }
        const cols = ['#e63946', '#ffd34d', '#3a86ff', '#2bb673']; c.font = 'bold 86px sans-serif'; c.textBaseline = 'middle'; let x = 132; for (let k = 0; k < 4; k++) { c.lineWidth = 10; c.strokeStyle = '#ffffff'; c.strokeText('TOYS'[k], x, 68); c.fillStyle = cols[k]; c.fillText('TOYS'[k], x, 68); x += c.measureText('TOYS'[k]).width + 10; } });
      B(12, 4.8, 7.6, 0xf7c6d0, 0, 2.4, 0); B(12.8, 0.7, 8.4, 0xd83a3a, 0, 5.15, 0); B(12.9, 0.76, 1.3, 0xffd84a, 0, 5.15, 0); B(1.3, 0.76, 8.5, 0xffd84a, 0, 5.15, 0); for (const s of [-1, 1]) B(0.06, 4.8, 1.3, 0xffd84a, s * 6.02, 2.4, 0);
      const tor = new THREE.TorusGeometry(1.15, 0.36, 6, 16); for (const s of [-1, 1]) { const m = new THREE.Mesh(tor, L(0xffd84a)); m.position.set(s * 1.05, 5.95, 0); m.rotation.order = 'YXZ'; m.rotation.set(-1.05, s * 0.5, 0); G.add(m); }
      { const m = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), L(0xffc21a)); m.position.set(0, 5.75, 0); G.add(m); } for (const s of [-1, 1]) B(0.55, 0.1, 1.9, 0xffd84a, s * 0.55, 5.55, 1.0, 0, s * 0.35, 0);
      B(1.8, 2.6, 0.12, 0x8a5a32, 0, 1.3, -3.86); for (const x of [-3.6, 3.6]) { B(3.35, 2.05, 0.06, 0xffffff, x, 1.75, -3.82); B(3.1, 1.8, 0.08, 0x9ad4f0, x, 1.75, -3.87); }
      B(12, 0.12, 1.9, L(0xffffff, { map: stripes('#e63946', 12) }), 0, 3.2, -4.7, 0.35); { const s = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), L(0xffffff, { map: signT })); s.position.set(0, 4.2, -3.92); s.rotation.y = Math.PI; G.add(s); B(4.6, 1.3, 0.1, 0xffffff, 0, 4.2, -3.84); }
      { const b = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), L(0xffffff, { map: stripes('#e63946', 6) })); b.position.set(-5.4, 0.9, -5.6); G.add(b); } B(1.3, 0.55, 2.2, 0xe63946, 5.2, 0.55, -5.4); B(1.1, 0.5, 1.1, 0x9ad4f0, 5.2, 1.05, -5.3);
      for (const [a, b] of [[-0.6, -0.7], [0.6, -0.7], [-0.6, 0.7], [0.6, 0.7]]) { const w2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10), L(0x222222)); w2.position.set(5.2 + a, 0.3, -5.4 + b); w2.rotation.z = Math.PI / 2; G.add(w2); }
      at(G, CX, CZ); { const g = new THREE.PlaneGeometry(14.4, 3.8, 7, 2); g.rotateX(-Math.PI / 2); const P = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < P.count; i++) { const x = P.getX(i) + CX, z = P.getZ(i) + CZ - 5.5; P.setXYZ(i, x, gy(x, z) + 0.105, z); uv.setXY(i, x / 2.4, z / 2.4); } g.computeVertexNormals(); flat(g, PV); }
      S.push({ ax: CX - 2.2, az: CZ, bx: CX + 2.2, bz: CZ, r: 3.9 }); }
    // the glass footbridge over road 2 from the lot into the park by the toy shop (the pictures' glass2-page.js, the user's version 1: a glass tube on
    // a timber deck 6 m up, a glass tower at each end with a spiral stair, light strips); a paved path from its north foot to the toy shop. Its parts
    // merged per material; the towers and the piers solid
    { const BX = GLB.x, BZ = GLB.z, g0 = gy(BX, BZ), DECK = 6.0, ZN = -11, ZS = 11, RUN = 11, gN = gy(BX, BZ + ZN - RUN), gS = gy(BX, BZ + ZS + RUN), Y = new THREE.Vector3(0, 1, 0);
      const parts = new Map(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      const put2 = (mat, geo, x, y, z, rx = 0, ry = 0, rz = 0) => { e.set(rx, ry, rz); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)); geo.applyMatrix4(m4); if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(geo.index ? geo.toNonIndexed() : geo); };
      const bx = (mat, x, y, z, sx, sy, sz, rx, ry, rz) => put2(mat, new THREE.BoxGeometry(sx, sy, sz), x, y, z, rx, ry, rz);
      const rod = (mat, a, b, r, seg = 5) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), len = d.length(); if (len < 1e-4) return; const geo = new THREE.CylinderGeometry(r, r, len, seg, 1, true); q.setFromUnitVectors(Y, d.normalize()); m4.compose(A.add(Bv).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)); geo.applyMatrix4(m4); if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(geo.toNonIndexed()); };
      const sky = (() => { const face = (top) => { const cv = document.createElement('canvas'); cv.width = cv.height = 32; const c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 32); if (top === 1) { g.addColorStop(0, '#7fa8d8'); g.addColorStop(1, '#a9c6e8'); } else if (top === -1) { g.addColorStop(0, '#5a7a4a'); g.addColorStop(1, '#4a6a3e'); } else { g.addColorStop(0, '#8fb2de'); g.addColorStop(0.5, '#dfe9f2'); g.addColorStop(0.56, '#9aa88a'); g.addColorStop(1, '#5a7a4a'); } c.fillStyle = g; c.fillRect(0, 0, 32, 32); return cv; };
        const t = new THREE.CubeTexture([face(0), face(0), face(1), face(-1), face(0), face(0)]); t.needsUpdate = true; return t; })();
      const glass = (tint, op) => new THREE.MeshPhongMaterial({ color: tint, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, shininess: 140, specular: 0xffffff, envMap: sky, reflectivity: 0.55, combine: THREE.MixOperation });
      const Gl = glass(0xa8dcef, 0.3), Gt = glass(0x9cd2ea, 0.34), W = PH(0xf4f6f8), D = PH(0x50565c), WOOD = L(0xb48a58), LED = new THREE.MeshBasicMaterial({ color: 0x9ff4ff }), w = 3.2, hw = w / 2, hWall = 1.15;
      // the deck and the tube (a wall up to 1.15 m, then a half circle), its steel rings every 2.2 m
      bx(D, 0, DECK - 0.32, 0, w + 0.4, 0.55, ZS - ZN + 0.2); bx(WOOD, 0, DECK - 0.02, 0, w, 0.06, ZS - ZN); for (const sx of [-1, 1]) bx(LED, sx * (hw - 0.12), DECK + 0.03, 0, 0.06, 0.03, ZS - ZN - 0.4);
      { const n = 12, prof = [[-hw, 0], [-hw, hWall]]; for (let k = 1; k < n; k++) { const a = Math.PI - Math.PI * k / n; prof.push([hw * Math.cos(a), hWall + hw * Math.sin(a)]); } prof.push([hw, hWall], [hw, 0]);
        const pos = [], idx = []; prof.forEach(([x, y]) => pos.push(x, y + DECK, ZN, x, y + DECK, ZS)); for (let k = 0; k < prof.length - 1; k++) { const b = k * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg.setIndex(idx); tg.computeVertexNormals(); put2(Gl, tg, 0, 0, 0);
        const m = Math.round((ZS - ZN) / 2.2); for (let j = 0; j <= m; j++) { const z = ZN + (ZS - ZN) * j / m; for (let k = 0; k < prof.length - 1; k++) rod(W, [prof[k][0], prof[k][1] + DECK, z], [prof[k + 1][0], prof[k + 1][1] + DECK, z], 0.06); }
        for (const k of [1, prof.length - 2, (prof.length - 1) >> 1]) rod(W, [prof[k][0], prof[k][1] + DECK, ZN], [prof[k][0], prof[k][1] + DECK, ZS], 0.05); for (const sx of [-1, 1]) rod(W, [sx * (hw - 0.08), DECK + 1.0, ZN], [sx * (hw - 0.08), DECK + 1.0, ZS], 0.035); }
      // a glass tower at each end: four steel corners, bands, a roof; a landing at the deck's height, the spiral (30 steps, one and a half turns) up to it, a door at the foot
      for (const [zc, gE] of [[ZN - 2.6, gN], [ZS + 2.6, gS]]) { const y0 = gE - g0, hT = DECK + 3.4 - y0, dir = zc < 0 ? 1 : -1; bx(Gt, 0, y0 + hT / 2, zc, 5.2, hT, 5.2); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(W, sx * 2.6, y0 + hT / 2, zc + sz * 2.6, 0.2, hT, 0.2); bx(W, 0, y0 + hT + 0.12, zc, 5.7, 0.28, 5.7); bx(Gt, 0, y0 + hT + 0.3, zc, 5.2, 0.06, 5.2);
        for (let k = 1; k <= 2; k++) { const yb = y0 + k * (DECK - y0) / 2; for (const sz of [-1, 1]) bx(W, 0, yb, zc + sz * 2.6, 5.25, 0.14, 0.12); for (const sx of [-1, 1]) bx(W, sx * 2.6, yb, zc, 0.12, 0.14, 5.25); }
        bx(D, 0, DECK - 0.12, zc + dir * 1.4, 5.0, 0.2, 2.4); bx(WOOD, 0, DECK - 0.02, zc + dir * 1.4, 5.0, 0.06, 2.4); bx(Gt, 0, DECK + 0.55, zc + dir * 0.22, 2.4, 1.1, 0.04); rod(W, [-1.2, DECK + 1.1, zc + dir * 0.22], [1.2, DECK + 1.1, zc + dir * 0.22], 0.04);
        const n = 30, dA = 3 * Math.PI / n; for (let k = 0; k < n; k++) { const a = -dir * (n - 1 - k) * dA, y = y0 + (DECK - y0) * (k + 1) / n - 0.05; bx(D, 1.25 * Math.cos(a), y, zc + 1.25 * Math.sin(a), 1.7, 0.1, 0.55, 0, -a, 0); }
        bx(D, 0, y0 + (DECK - y0) / 2, zc, 0.3, DECK - y0, 0.3); { const pts = []; for (let k = 0; k <= 24; k++) { const t = k / 24, a = -dir * (n - 1) * dA * (1 - t), y = y0 + 1.0 + (DECK - y0) * t; pts.push([2.1 * Math.cos(a), y, zc + 2.1 * Math.sin(a)]); } for (let k = 0; k < 24; k++) rod(W, pts[k], pts[k + 1], 0.035); }
        bx(W, -2.62, y0 + 1.15, zc, 0.12, 2.3, 1.5); bx(PH(0x3c4146), -2.66, y0 + 1.15, zc, 0.06, 2.1, 1.25); S.push({ ax: BX, az: BZ + zc, bx: BX, bz: BZ + zc, r: 2.75 }); }
      for (const z of [-8.5, 10.6]) { bx(W, 0, (DECK - 0.6) / 2, z, 0.9, DECK - 0.6, 0.9); S.push({ ax: BX, az: BZ + z, bx: BX, bz: BZ + z, r: 0.55 }); }
      const G = new THREE.Group(); for (const [mat, geos] of parts) { const pos = [], nrm = []; for (const gg of geos) { const P = gg.attributes.position, Nn = gg.attributes.normal; for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nrm.push(Nn.getX(i), Nn.getY(i), Nn.getZ(i)); } gg.dispose(); }
        const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); const me = new THREE.Mesh(bg, mat); me.castShadow = !mat.transparent; me.receiveShadow = true; G.add(me); }
      G.position.set(BX, g0, BZ); MK.add(G); own.push(G);
      // the paved path from its north foot to the toy shop's forecourt, a pad at each foot
      { const A = [BX, BZ + ZN - RUN + 0.2], B2 = [70.2, 27.9], dx = B2[0] - A[0], dz = B2[1] - A[1], len = Math.hypot(dx, dz), nx = -dz / len, nz = dx / len, pos = [], uv = [], idx = [], n = Math.ceil(len / 1.5);
        for (let k = 0; k <= n; k++) { const t = k / n, x = A[0] + dx * t, z = A[1] + dz * t; for (const s of [-1, 1]) { const px = x + nx * s * 1.4, pz = z + nz * s * 1.4; pos.push(px, gy(px, pz) + 0.105, pz); uv.push(px / 3, pz / 3); } if (k) { const b = (k - 1) * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
        for (const [x, z, oz0, oz1] of [[A[0], A[1], -2.2, 1.4], [BX, BZ + ZS + RUN - 0.2, -1.4, 2.2]]) { const b = pos.length / 3; for (const [ox, oz] of [[-2.2, oz0], [2.2, oz0], [2.2, oz1], [-2.2, oz1]]) { pos.push(x + ox, gy(x + ox, z + oz) + 0.105, z + oz); uv.push((x + ox) / 3, (z + oz) / 3); } idx.push(b, b + 2, b + 1, b, b + 3, b + 2); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); if (g.attributes.normal.getY(0) < 0) { const I = g.index; for (let t = 0; t < I.count; t += 3) { const v = I.getX(t + 1); I.setX(t + 1, I.getX(t + 2)); I.setX(t + 2, v); } g.computeVertexNormals(); } flat(g, PV); } }
    // the volcano (the old mine train's mountain made one, the pictures' volcano-page.js; the user: no smoke, only the lava moves, lava-page.js):
    // a cone of 128 x 44 points from its foot to a jagged rim and down into the crater, sharp ridges and gullies, bands of rock by height (dark
    // basalt, rust, ochre ash), darker and redder near the top; a lava lake in the crater; five flows down the flanks from the rim's notches (a dark
    // crust, the orange body, a bright core; one splits in two, two end in pools at the foot); glowing cracks; boulders; the ground round it
    // ash-dark; burnt stumps. What moves (NVPark.tick): the lava slides down the flows and the cracks (one texture a kind, each flow its own
    // phase), the lake and the pools turn slowly, their hot spots swell and shrink, bubbles rise and burst, the glow over the crater flickers (a
    // sprite: no light of its own, which every material on a phone would pay for). Solid: the car stops at its foot (H3.solids, js/nvwalls.js).
    { const { x: CX, z: CZ, rx: RX, rz: RZ, hv: HV } = VC, G0 = gy(CX, CZ), NA = 128, NR = 44, sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      let sv = 11; const rv = () => (sv = (sv * 16807) % 2147483647) / 2147483647;
      const ridge = (a, t) => { const r1 = 1 - Math.abs(Math.sin(7 * a + 0.6 + 1.5 * t)), r2 = 1 - Math.abs(Math.sin(13 * a + 2.1 - 2 * t)); return 0.07 * (r1 * r1 - 0.4) + 0.04 * (r2 * r2 - 0.4); };
      const noise = (a, t) => 0.09 * Math.sin(5 * a + 1.3) + 0.06 * Math.sin(9 * a - t * 3) + 0.04 * Math.sin(17 * a + 2.1) + 0.03 * Math.sin(29 * a + t * 7) + ridge(a, t) + 0.02 * Math.sin(53 * a + t * 11);
      const rimN = (a) => 0.6 * Math.sin(3 * a + 0.4) + 0.4 * Math.sin(8 * a + 1.9) + 0.3 * Math.sin(15 * a);
      const prof = (t, a) => t < 0.86 ? HV * Math.pow(t / 0.86, 1.25) * (0.94 + 0.06 * t) + (t > 0.78 ? rimN(a) * sst(0.78, 0.86, t) : 0) : HV + rimN(a) - (t - 0.86) / 0.14 * 4.8;
      const rad = (t) => t < 0.86 ? 1 - 0.78 * Math.pow(t / 0.86, 0.85) : 0.22 - (t - 0.86) / 0.14 * 0.16;
      const sXZ = (a, t) => { const r = rad(t) * (1 + noise(a, t) * (t < 0.86 ? 1 : 0.3)); return [CX + Math.cos(a) * RX * r * 1.35, CZ + Math.sin(a) * RZ * r * 1.35]; };
      const sY = (a, t) => G0 + prof(t, a) * (1 + 0.5 * noise(a, t) * (t < 0.86 ? 1 : 0.3));
      const nearLn = (x, z, d) => LP.some(P => P.some(p => (p.x - x) ** 2 + (p.z - z) ** 2 < d * d)), clear = (x, z, d) => inP(x, z) && rd(x, z) > 4 && !nearLn(x, z, d);
      // the cone: its facets flat (each triangle its own normal: the rock's edges), the foot sunk into the ground
      { const BAS = [0.17, 0.15, 0.145], RUST = [0.33, 0.17, 0.11], ASH = [0.37, 0.31, 0.23], TOP = [0.11, 0.09, 0.09], pos = [], col = [], idx = [];
        for (let j = 0; j <= NR; j++) { const t = j / NR; for (let i = 0; i <= NA; i++) { const a = i / NA * Math.PI * 2, [x, z] = sXZ(a, t); pos.push(x, j ? sY(a, t) : Math.min(G0, gy(x, z)) - 0.6, z);
            const hg = prof(t, a), band = 0.5 + 0.5 * Math.sin(hg * 0.85 + 2.0 * Math.sin(3 * a)), k = sst(0.45, 0.86, t), sh = 1 + 1.6 * ridge(a, t) + 0.08 * (rv() - 0.5);
            const c = t > 0.86 ? [0.16 + 0.1 * (1 - (t - 0.86) / 0.14), 0.07, 0.05] : [0, 1, 2].map(q => ((band > 0.62 ? RUST[q] : band < 0.3 ? ASH[q] : BAS[q]) * (1 - k) + TOP[q] * k) * sh); col.push(c[0], c[1], c[2]); } }
        for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i; idx.push(a, a + NA + 1, a + 1, a + 1, a + NA + 1, a + NA + 2); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
        const g2 = g.toNonIndexed(); g2.computeVertexNormals(); put(new THREE.Mesh(g2, new THREE.MeshLambertMaterial({ vertexColors: true }))); }
      // the lava's textures, drawn once, seamless along v: the body (glowing streaks along the flow, dark crust plates riding on it), the core, the lake
      let sd = 1234567; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      const cvTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
      const wrapY = (c, h, f) => { for (const dy of [-h, 0, h]) { c.save(); c.translate(0, dy); f(); c.restore(); } }, poly = (c, pts) => { c.beginPath(); pts.forEach(([px, py], q) => q ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); };
      const TB = cvTex(64, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#5a1206'); g.addColorStop(0.5, '#c2380c'); g.addColorStop(1, '#5a1206'); c.fillStyle = g; c.fillRect(0, 0, w, h);
        for (let k = 0; k < 70; k++) { const x = w * (0.15 + rnd() * 0.7), y = rnd() * h, l = 18 + rnd() * 60, r = 2 + rnd() * 6, cl = rnd() < 0.5 ? 'rgba(255,150,40,0.55)' : 'rgba(255,214,90,0.45)'; wrapY(c, h, () => { c.fillStyle = cl; c.beginPath(); c.ellipse(x, y, r, l / 2, 0, 0, Math.PI * 2); c.fill(); }); }
        for (let k = 0; k < 26; k++) { const x = w * (0.1 + rnd() * 0.8), y = rnd() * h, s = 5 + rnd() * 11, n = 5 + Math.floor(rnd() * 3), pts = []; for (let q = 0; q < n; q++) { const a = q / n * Math.PI * 2, rr = s * (0.6 + rnd() * 0.5); pts.push([x + Math.cos(a) * rr * 0.8, y + Math.sin(a) * rr * 1.3]); }
          const cl = rnd() < 0.5 ? 'rgba(40,14,8,0.85)' : 'rgba(70,22,10,0.8)'; wrapY(c, h, () => { c.fillStyle = cl; poly(c, pts); c.fill(); c.strokeStyle = 'rgba(255,120,30,0.6)'; c.lineWidth = 1.2; c.stroke(); }); } });
      const TC = cvTex(32, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#e05a10'); g.addColorStop(0.5, '#ffd25a'); g.addColorStop(1, '#e05a10'); c.fillStyle = g; c.fillRect(0, 0, w, h);
        for (let k = 0; k < 60; k++) { const x = w * (0.2 + rnd() * 0.6), y = rnd() * h, l = 14 + rnd() * 50, r = 1.5 + rnd() * 4, cl = rnd() < 0.5 ? 'rgba(255,250,200,0.6)' : 'rgba(255,120,20,0.5)'; wrapY(c, h, () => { c.fillStyle = cl; c.beginPath(); c.ellipse(x, y, r, l / 2, 0, 0, Math.PI * 2); c.fill(); }); } });
      const TL = cvTex(256, 256, (c, w, h) => { c.fillStyle = '#d2440e'; c.fillRect(0, 0, w, h); const both = (f) => { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { c.save(); c.translate(dx, dy); f(); c.restore(); } };
        for (let k = 0; k < 90; k++) { const x = rnd() * w, y = rnd() * h, r = 6 + rnd() * 22, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,236,140,0.85)'); g.addColorStop(1, 'rgba(255,140,30,0)'); both(() => { c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); }); }
        for (let k = 0; k < 40; k++) { const x = rnd() * w, y = rnd() * h, s = 8 + rnd() * 18, pts = []; for (let q = 0; q < 6; q++) { const a = q / 6 * Math.PI * 2 + rnd() * 0.4, rr = s * (0.6 + rnd() * 0.5); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
          both(() => { c.fillStyle = 'rgba(46,16,8,0.9)'; poly(c, pts); c.fill(); c.strokeStyle = 'rgba(255,170,60,0.7)'; c.lineWidth = 2; c.stroke(); }); } });
      TL.repeat.set(0.09, 0.09); TL.center.set(0.5, 0.5);
      const MB = new THREE.MeshBasicMaterial({ map: TB, side: THREE.DoubleSide }), MC2 = new THREE.MeshBasicMaterial({ map: TC, side: THREE.DoubleSide, vertexColors: true }), ML = new THREE.MeshBasicMaterial({ map: TL });
      const CRUST = L(0x3a1a10, { emissive: 0x401006, side: THREE.DoubleSide }), HOT = new THREE.MeshBasicMaterial({ color: 0xffb03a }), BUB = new THREE.MeshBasicMaterial({ color: 0xfff0a0 });
      // the flows and the cracks: ribbons on the cone (u across, v down along it, 3 m to a repeat of the texture), by kind into one mesh each
      const bucket = () => ({ pos: [], uv: [], col: [], idx: [] }), BK = { crust: bucket(), body: bucket(), core: bucket() };
      const ribbon = (b, P, w0, w1, dy, ph = 0, tint = null) => { const v0 = b.pos.length / 3; let acc = 0, px = 0, pz = 0;
        P.forEach(([a, t], s) => { const [x, z] = sXZ(a, t), y = sY(a, t), f = s / (P.length - 1), w = w0 + (w1 - w0) * f, tx = -Math.sin(a), tz = Math.cos(a); if (s) acc += Math.hypot(x - px, z - pz); px = x; pz = z;
          b.pos.push(x + tx * w, y + dy, z + tz * w, x - tx * w, y + dy, z - tz * w); b.uv.push(0, acc / 3 + ph, 1, acc / 3 + ph); if (tint) b.col.push(...tint, ...tint); if (s) { const q = v0 + (s - 1) * 2; b.idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } }); };
      const WHITE = [1, 1, 1], HOTT = [1, 0.95, 0.75], flows = [[0.6, 1.5, 0.95, 1], [1.9, 1.1, 0.7, 0], [2.9, 1.7, 0.98, 1], [4.3, 1.3, 0.85, 0], [5.4, 1.0, 0.6, 0]], pools = [];
      const flowPts = (a0, len, wob) => { const P = []; let a = a0; for (let s = 0; s <= 70; s++) { const t = 0.85 - s / 70 * len * 0.85; a += 0.012 * Math.sin(s * 0.35 + a0 * 3) * wob + 0.004; P.push([a, Math.max(0.004, t)]); } return P; };
      flows.forEach(([a0, w, len, pl], fi) => { const P = flowPts(a0, len, 1 + fi * 0.3), ph = rnd(); ribbon(BK.crust, P, w * 0.9, w * 2.0, 0.1); ribbon(BK.body, P, w * 0.55, w * 1.25, 0.16, ph); ribbon(BK.core, P, w * 0.18, w * 0.45, 0.2, ph, WHITE); ribbon(BK.core, P.slice(0, 30), w * 0.08, w * 0.16, 0.23, ph + 0.5, HOTT);
        if (fi === 2) { const Q = flowPts(a0 + 0.25, len * 0.55, 2.0).slice(28); ribbon(BK.crust, Q, w * 0.6, w * 1.2, 0.1); ribbon(BK.body, Q, w * 0.35, w * 0.8, 0.16, ph + 0.3); }
        if (pl) { const [a, t] = P[P.length - 1], [x, z] = sXZ(a, t); pools.push([x + Math.cos(a) * 2.5, z + Math.sin(a) * 2.5, 3.0]); } });
      for (let k = 0; k < 12; k++) { const a0 = rv() * 6.283, t0 = 0.45 + rv() * 0.35, P = []; let a = a0, t = t0; for (let s = 0; s < 9; s++) { P.push([a, t]); a += (rv() - 0.5) * 0.05; t -= 0.012 + rv() * 0.01; } if (k % 3) ribbon(BK.body, P, 0.12, 0.06, 0.12, rnd()); else ribbon(BK.core, P, 0.12, 0.06, 0.12, rnd(), WHITE); }
      for (const [k, m] of [['crust', CRUST], ['body', MB], ['core', MC2]]) { const b = BK[k], g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3)); if (k !== 'crust') g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2)); if (b.col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3)); g.setIndex(b.idx); g.computeVertexNormals(); flat(g, m); }
      // the crater's lake, the pools at the foot (a crust ring round each): one turning texture
      const yLake = G0 + HV - 4.4, disc = (r, f) => { const sh = new THREE.Shape(); for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2, rr = r * f(a); k ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); return g; };
      { const g = disc(RX * 0.22 * 1.25, (a) => 1 + 0.08 * Math.sin(5 * a) + 0.05 * Math.sin(11 * a + 1)); g.translate(CX, yLake, CZ); flat(g, ML); }
      for (const [x, z, r] of pools) { const f = (a) => 1 + 0.18 * Math.sin(3 * a + x) + 0.1 * Math.sin(7 * a), y = gy(x, z) + 0.12, gc = disc(r * 1.35, f), gl = disc(r, f); gc.translate(x, y - 0.02, z); gl.translate(x, y, z); flat(gc, CRUST); flat(gl, ML); }
      // the hot spots on the lake and the pools, the bubbles: instances moved each frame (not merged, js/nvbake.js: dyn)
      const SP = [[1.2, -0.8, 1.6], [-1.5, 1.0, 1.1], [0.2, 1.8, 0.8], [-0.6, -1.9, 0.9], [2.4, 1.2, 0.6]].map(([dx, dz, r]) => [CX + dx, yLake + 0.03, CZ + dz, r]).concat(pools.map(([x, z, r]) => [x + 0.3, gy(x, z) + 0.14, z - 0.2, r * 0.45]));
      const BU = [[0.8, 0.4, 0.5], [-1.0, -0.6, 0.4], [1.9, -1.4, 0.35], [-2.2, 1.6, 0.45], [0.1, -2.6, 0.3], [2.6, 2.0, 0.3]].map(([dx, dz, r]) => [CX + dx, yLake, CZ + dz, r]);
      const inst = (geo, mat, list) => { const im = new THREE.InstancedMesh(geo, mat, list.length); im.position.set(CX, G0, CZ); im.userData.dyn = true; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, HV / 2, 0), RX * 2.2); MK.add(im); own.push(im); return im; };
      const gs = new THREE.CircleGeometry(1, 14); gs.rotateX(-Math.PI / 2); const imS = inst(gs, HOT, SP), imB = inst(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), BUB, BU);
      // the glow over the crater (additive, no light), the ground round the foot ash-dark and fading out, the boulders, the burnt stumps
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: cvTex(64, 64, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,150,60,1)'); g.addColorStop(0.45, 'rgba(255,90,30,0.45)'); g.addColorStop(1, 'rgba(255,60,20,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 }));
      glow.scale.set(RX * 1.1, RX * 0.7, 1); glow.position.set(CX, yLake + 3.5, CZ); glow.raycast = () => {};   // (a ray through the scene passes it: a sprite needs the camera for that)
      MK.add(glow); own.push(glow);
      { const pos = [], col = [], idx = [], NAr = 96; for (let j = 0; j <= 6; j++) { const f = 1.0 + j / 6 * 0.55; for (let i = 0; i <= NAr; i++) { const a = i / NAr * Math.PI * 2, w5 = 1 + 0.06 * Math.sin(5 * a), x = CX + Math.cos(a) * RX * 1.35 * f * w5, z = CZ + Math.sin(a) * RZ * 1.35 * f * w5;
            pos.push(x, gy(x, z) + 0.05, z); col.push(0.16, 0.14, 0.13, 0.85 * (1 - j / 6) * (inP(x, z) ? Math.max(0, Math.min(1, (rd(x, z) - 2) / 4)) : 0)); } }
        for (let j = 0; j < 6; j++) for (let i = 0; i < NAr; i++) { const a = j * (NAr + 1) + i; idx.push(a, a + NAr + 1, a + 1, a + 1, a + NAr + 1, a + NAr + 2); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx); g.computeVertexNormals();
        if (g.attributes.normal.getY(0) < 0) { const I = g.index; for (let t = 0; t < I.count; t += 3) { const q = I.getX(t + 1); I.setX(t + 1, I.getX(t + 2)); I.setX(t + 2, q); } g.computeVertexNormals(); }
        const ash = flat(g, new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); ash.renderOrder = 2; }
      { const RG = new THREE.DodecahedronGeometry(1, 0), RM = [0x262220, 0x302a26, 0x3a302a].map(c => L(c));
        for (let k = 0; k < 110; k++) { const a = rv() * 6.283, onS = k < 75, t = onS ? 0.04 + rv() * 0.55 : 0, f = 1.35 + rv() * 0.35, [sx, sz] = onS ? sXZ(a, t) : [CX + Math.cos(a) * RX * f, CZ + Math.sin(a) * RZ * f], s = onS ? 0.3 + rv() * 0.9 : 0.3 + rv() * 0.7, sz2 = 0.8 + rv() * 0.4, r3 = [rv() * 3, rv() * 3, rv() * 3];
          if (!onS && !clear(sx, sz, 7.5)) continue; const m = new THREE.Mesh(RG, k % 11 === 0 ? CRUST : RM[k % 3]); m.position.set(sx, (onS ? sY(a, t) : gy(sx, sz)) + s * 0.3, sz); m.scale.set(s, s * 0.7, s * sz2); m.rotation.set(...r3); put(m); }
        for (let k = 0; k < 10; k++) { const a = rv() * 6.283, f = 1.36 + rv() * 0.12, x = CX + Math.cos(a) * RX * 1.35 * f, z = CZ + Math.sin(a) * RZ * 1.35 * f, h = 1.2 + rv() * 2.5, lean = (rv() - 0.5) * 0.4; if (!clear(x, z, 8)) continue;
          const st = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, h, 6), L(0x1c1614)); st.position.set(x, gy(x, z) + h / 2, z); st.rotation.z = lean; put(st); } }
      // solid: its foot (where the rock is 0.3 m up) as a closed line the car stops at
      { const S = H3.solids || (H3.solids = []), N = 48; let p0 = sXZ(0, 0.03); for (let k = 1; k <= N; k++) { const p1 = sXZ(k / N * Math.PI * 2, 0.03); S.push({ ax: p0[0], az: p0[1], bx: p1[0], bz: p1[1], r: 0.2 }); p0 = p1; } }
      // the little train's track round the volcano (the pictures' volcano-page.js): along the circuit's bend east and south of the volcano, 10.5 m in
      // from the circuit's middle, and back round its west side past the station by lane 3; 2.4 m between the rails, sleepers; a portal where it passes
      // under the flank. The station (a platform at the wagon's deck, a ramp up from the lane, a roof, its sign) and the train (a locomotive, a flat
      // wagon for a car) on it; both solid. The park's stands where the station is go
      { const CP = []; for (let i = 0; i < T.N; i += 2) CP.push([T.px[i], T.pz[i]]);
        const onB = CP.map(([x, z]) => Math.hypot(x - CX, z - CZ) < 52 && (x > CX + 10 || z < CZ - 22)); let best = [0, 0];
        for (let i = 0; i < CP.length; i++) { if (!onB[i]) continue; let j = i; while (j + 1 < CP.length && onB[j + 1]) j++; if (j - i > best[1] - best[0]) best = [i, j]; i = j; }
        const BEND = CP.slice(best[0] + 3, best[1] - 3), OFF = 10.5, BO = [];
        BEND.forEach(([x, z], i) => { const a = BEND[Math.max(0, i - 1)], b = BEND[Math.min(BEND.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1; let nx = -tz / l, nz = tx / l; if ((CX - x) * nx + (CZ - z) * nz < 0) { nx = -nx; nz = -nz; } if (i % 3 === 0) BO.push([x + nx * OFF, z + nz * OFF]); });
        if (BO.length > 3) {
          const angOf = ([x, z]) => Math.atan2((z - CZ) / RZ, (x - CX) / RX), aS = angOf(BO[0]), aE = angOf(BO[BO.length - 1]); let da = aS - aE; while (da <= 0) da += Math.PI * 2; if (Math.cos(aE + da / 2) > 0) da -= Math.PI * 2;   // (round the west, past the station)
          const ARC = []; for (let k = 1; k < 14; k++) { const a = aE + da * k / 14; ARC.push([CX + Math.cos(a) * RX * 1.77, CZ + Math.sin(a) * RZ * 1.77]); }
          const tc = new THREE.CatmullRomCurve3(BO.concat(ARC).map(([x, z]) => new THREE.Vector3(x, gy(x, z) + 0.25, z)), true), NS = 300, RL = PH(0x5a5e62);
          for (const s2 of [-1.2, 1.2]) { const off = []; for (let i = 0; i <= NS; i++) { const u = i / NS, p = tc.getPointAt(u), t = tc.getTangentAt(u), l = Math.hypot(t.x, t.z) || 1; off.push(new THREE.Vector3(p.x - t.z / l * s2, p.y, p.z + t.x / l * s2)); } put(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(off, true), NS, 0.09, 4, true), RL), false); }
          { const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.14, 3.2), L(0x5a3a24), NS), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Yv = new THREE.Vector3(0, 1, 0); for (let i = 0; i < NS; i++) { const u = i / NS, p = tc.getPointAt(u), t = tc.getTangentAt(u); q.setFromAxisAngle(Yv, -Math.atan2(t.z, t.x)); m4.compose(new THREE.Vector3(p.x, p.y - 0.12, p.z), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); } im.receiveShadow = true; MK.add(im); own.push(im); }
          // a portal at each end of the stretch under the flank (where the rock over it is 3.6 m or more)
          const coneH = (x, z) => { const rn = Math.hypot((x - CX) / (RX * 1.35), (z - CZ) / (RZ * 1.35)); if (rn >= 1) return 0; const q = Math.pow(Math.max(0, (1 - rn) / 0.78), 1 / 0.85); return q >= 1 ? HV : HV * Math.pow(q, 1.25) * (0.94 + 0.06 * q * 0.86); };
          { let prev = coneH(tc.getPointAt(0).x, tc.getPointAt(0).z) > 3.6; for (let i = 1; i <= 400; i++) { const u = i / 400, p = tc.getPointAt(u), now = coneH(p.x, p.z) > 3.6; if (now === prev) continue; prev = now; const t = tc.getTangentAt(u), g = new THREE.Group();
              const arch = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.9, 6, 14, Math.PI), L(0x3a3634)); arch.position.y = 1.0; g.add(arch); const dark = new THREE.Mesh(new THREE.CircleGeometry(3.0, 14, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0a0806 })); dark.position.set(0, 1.0, -0.2); g.add(dark);
              const low = new THREE.Mesh(new THREE.BoxGeometry(6, 1.0, 0.4), new THREE.MeshBasicMaterial({ color: 0x0a0806 })); low.position.set(0, 0.5, -0.2); g.add(low); at(g, p.x, p.z, 0, -Math.atan2(t.z, t.x) + Math.PI / 2); } }
          // the station at the track's west end, on the lane's side
          let uSt = 0.5; { let bx = 1e9; for (let i = 0; i < 200; i++) { const p = tc.getPointAt(i / 200); if (p.x < bx) { bx = p.x; uSt = i / 200; } } }
          const ST = tc.getPointAt(uSt), stT = tc.getTangentAt(uSt), hd = Math.atan2(stT.z, stT.x), nx = -stT.z, nz = stT.x, sx = ST.x - nx * 3.6, sz = ST.z - nz * 3.6, deckH = ST.y - gy(ST.x, ST.z) + 1.25;
          { const g = new THREE.Group(), b = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), L(c)); m.position.set(x, y, z); g.add(m); return m; };
            b(16, deckH, 3.4, 0xb9b5ad, 0, deckH / 2, 0); b(16, 0.04, 0.3, 0xf2c12e, 0, deckH + 0.02, 1.55); const rp = b(12, 0.3, 3.4, 0xa8a49c, -13.8, deckH / 2 - 0.1, 0); rp.rotation.z = Math.atan2(deckH, 12);
            for (const x of [-7, 0, 7]) b(0.3, 4.2, 0.3, 0x8a2a1a, x, deckH + 2.1, -1.5); b(17, 0.3, 5.2, 0x3a2a24, 0, deckH + 4.3, 0.6);
            const sg = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.3), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (c, w, h) => { c.fillStyle = '#3a2a24'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffb03a'; c.font = 'bold 60px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('VOLCANO TRAIN', w / 2, 50); }), side: THREE.DoubleSide })); sg.position.set(0, deckH + 5.1, 3.2); g.add(sg);
            at(g, sx, sz, 0, -hd); const cx2 = Math.cos(hd), sz2 = Math.sin(hd); S.push({ ax: sx - cx2 * 19, az: sz - sz2 * 19, bx: sx + cx2 * 7, bz: sz + sz2 * 7, r: 1.8 });
            for (const it of items) if (Math.hypot(it.x - sx, it.z - sz) < 22 && Math.abs((it.x - sx) * -sz2 + (it.z - sz) * cx2) < 4 && ((it.x - sx) * cx2 + (it.z - sz) * sz2) > -21 && ((it.x - sx) * cx2 + (it.z - sz) * sz2) < 9) { it.g.parent && it.g.parent.remove(it.g); it.gone = true; } }
          // the train standing on its track: a red locomotive and a flat wagon with yellow side rails and a red gate
          { const loco = new THREE.Group(), wagon = new THREE.Group(), b = (g, w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), L(c)); m.position.set(x, y, z); g.add(m); return m; }, cyl = (g, r, h, c, x, y, z, rx, rz) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), L(c)); m.position.set(x, y, z); m.rotation.set(rx || 0, 0, rz || 0); g.add(m); return m; };
            b(loco, 6.0, 0.6, 2.6, 0x1c1c1e, 0, 0.6, 0); cyl(loco, 1.05, 4.0, 0x8a1a12, 0.6, 1.85, 0, 0, Math.PI / 2); b(loco, 2.0, 2.4, 2.6, 0x8a1a12, -2.0, 2.1, 0); b(loco, 2.3, 0.2, 2.9, 0x1c1c1e, -2.0, 3.4, 0); cyl(loco, 0.4, 1.3, 0x1c1c1e, 2.0, 3.2, 0);
            for (const x of [-2, 0, 2]) for (const s of [-1.3, 1.3]) cyl(loco, 0.55, 0.2, 0x2a2a2e, x, 0.55, s, Math.PI / 2);
            b(wagon, 7.2, 0.35, 2.9, 0x3a3e44, 0, 1.0, 0); b(wagon, 7.2, 0.06, 2.8, 0x8a8e94, 0, 1.2, 0); for (const s of [-1, 1]) b(wagon, 7.2, 0.45, 0.1, 0xf2c12e, 0, 1.45, s * 1.42); b(wagon, 0.1, 0.6, 2.8, 0xd8282a, -3.55, 1.5, 0);
            for (const x of [-2.5, 2.5]) for (const s of [-1.3, 1.3]) cyl(wagon, 0.45, 0.2, 0x2a2a2e, x, 0.45, s, Math.PI / 2);
            const L2 = tc.getLength(), place = (g, u) => { u = ((u % 1) + 1) % 1; const p = tc.getPointAt(u), t = tc.getTangentAt(u); g.position.set(p.x, p.y + 0.05, p.z); g.rotation.y = -Math.atan2(t.z, t.x); put(g); return p; };
            const pL = place(loco, 0.62), pW = place(wagon, 0.62 - 8.2 / L2); S.push({ ax: pL.x, az: pL.z, bx: pW.x, bz: pW.z, r: 1.6 }); } } }
      // what moves, t in seconds
      const ph = SP.map(() => rnd() * 6.28), pb = BU.map(() => rnd()), _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), g0 = glow.material.opacity;
      volc = { x: CX, z: CZ, imS, imB, anim(t) {
        TB.offset.y = -((t * 0.11) % 1); TC.offset.y = -((t * 0.2) % 1); TL.rotation = t * 0.035; TL.offset.set(Math.sin(t * 0.07) * 0.6, Math.cos(t * 0.05) * 0.6);
        SP.forEach(([x, y, z, r], i) => { const k = r * (1 + 0.18 * Math.sin(t * 1.3 + ph[i]) + 0.08 * Math.sin(t * 3.1 + ph[i] * 2)); imS.setMatrixAt(i, _m.compose(_p.set(x - CX, y - G0, z - CZ), _q, _s.set(k, 1, k))); });
        BU.forEach(([x, y, z, r], i) => { const q = ((t / 2.4 + pb[i]) % 1 + 1) % 1, sw = q < 0.85 ? Math.sin(q / 0.85 * Math.PI * 0.5) : 0, on = q < 0.85 ? 1 : 0; imB.setMatrixAt(i, _m.compose(_p.set(x - CX, y - G0, z - CZ), _q, _s.set(r * (0.4 + 0.8 * sw) * on, r * (0.2 + 1.1 * sw) * on, r * (0.4 + 0.8 * sw) * on))); });
        imS.instanceMatrix.needsUpdate = imB.instanceMatrix.needsUpdate = true; glow.material.opacity = g0 * (0.9 + 0.08 * Math.sin(t * 2.7) + 0.05 * Math.sin(t * 6.1 + 1)); } };
      volc.anim(0); }
    // trees and people (on the plazas and the lanes), clear of the lanes, the rides and the volcano's ash
    { let sd = 21; const r3 = () => (sd = (sd * 16807) % 2147483647) / 2147483647, nearLane = (x, z) => LP.some(P => P.some(p => (p.x - x) ** 2 + (p.z - z) ** 2 < 36));
      const RIDES = [J.KOLO, J.VRT, J.VRT_O, J.SKOD, J.VER, J.LET, J.PAD_T, J.NIH, J.HISA, J.LAD], nearRide = (x, z) => RIDES.some(p => (p[0] - x) ** 2 + (p[1] - z) ** 2 < 120) || ((x - VC.x) / (VC.rx * 2.1)) ** 2 + ((z - VC.z) / (VC.rz * 2.1)) ** 2 < 1 || Object.values(J.PL).some(([px, pz, R]) => (px - x) ** 2 + (pz - z) ** 2 < (R + 3) ** 2) || plot(x, z);
      const TC = [0x4f8a34, 0x5f9a3a, 0x3f7a2e, 0x6aa040]; let nt = 0; for (let t = 0; t < 2500 && nt < 70; t++) {   // (as many as in the pictures' park)
        const x = -20 + r3() * 140, z = -240 + r3() * 270, h = 1.5 + r3(), s = 1.6 + r3() * 1.2; if (!inPark(x, z) || nearLane(x, z) || nearRide(x, z) || rd(x, z) < 1.5) continue;   // (the trees also past the circuit's west side, on the meadow there)
       
        at(new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), L(TC[nt % 4], { flatShading: true })), x, z, h + 1.6); at(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, h + 0.6, 4, 1, true), L(0x6a4a2a)), x, z, (h + 0.6) / 2); nt++; }
      const GP = { body: new THREE.CylinderGeometry(0.2, 0.24, 0.9, 5), legs: new THREE.CylinderGeometry(0.17, 0.17, 0.5, 5, 1, true), head: new THREE.IcosahedronGeometry(0.17, 0) };
      const PC2 = [0xe8452c, 0x2a7ad8, 0xf2c12e, 0x3fbf6a, 0xc86bff, 0xff8a2a, 0xf4f4f0, 0x2a2622]; for (let k = 0; k < 160; k++) { let x, z;
        if (k < 90) { const [px, pz, R] = J.PL[['F', 'C', 'A'][k % 3]], a = r3() * 6.28, rr = R - 3.5 + (r3() - 0.5) * 2.5; x = px + Math.cos(a) * rr; z = pz + Math.sin(a) * rr; } else { const P = LP[k % LP.length], p = P[Math.floor(r3() * P.length)]; x = p.x + (r3() - 0.5) * 7.5; z = p.z + (r3() - 0.5) * 7.5; }
        const g = new THREE.Group(), c = PC2[Math.floor(r3() * 8)]; g.add(PM(GP.body, L(c), 0, 0.95, 0)); g.add(PM(GP.legs, L(0x2a3a5a), 0, 0.25, 0)); g.add(PM(GP.head, L(0xe0b89a), 0, 1.55, 0));
        if (rd(x, z) < 1.5 || plot(x, z)) continue; g.position.set(x, gy(x, z), z); put(g, false); } }
    built = { LP: LP.map(P => P.map(p => [p.x, p.z])), items, own, rides: own.filter(o => o.userData.ride), volc };
    return built;
  }
  // the volcano's place (the old mine train's mountain, the pictures' volcano-page.js): its middle, its half widths (x, z) before its foot's
  // 1.35, its height
  const VC = { x: 83, z: -188.5, rx: 15, rz: 17, hv: 22 };
  // each step of the race (js/game.js): the lava moves (its instances only near the car)
  function tick(dt, car) { if (!volc) return; vt += dt; if (car && (car.x - volc.x) ** 2 + (car.z - volc.z) ** 2 > 350 * 350) return; volc.anim(vt); }
  return { build, tick, inPark, PARK, J, VC, get built() { return built; } };
})();
