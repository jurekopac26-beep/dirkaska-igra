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
  let built = null;

  function build(MK) {
    const H3 = MK.H3, T = MK.T(), TL = H3.TL, gy = (x, z) => H3.ground(x, z), tx = Tex.all(), own = [];
    const rd = (x, z) => Math.min(Math.abs(T.query(x, z).d) - T.w, TL ? TL.dist(x, z, 30) - T.w : 1e9), inG = (x, z) => inPark(x, z) && rd(x, z) > 3.5, inGg = (x, z) => inPark(x, z) && rd(x, z) > 1.55;
    MK.clearWorld(inG, -99);   // (the World's things in the park: trees, signs, tyres)
    const MC = new Map(), mkey = (p, c, o) => p + c + JSON.stringify(o, (k, v) => v && v.isTexture ? 'tex' + v.id : v);
    const L = (c, o = {}) => { const k = mkey('L', c, o); let m = MC.get(k); if (!m) MC.set(k, m = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o))); return m; };   // (one material per colour and look: the still meshes merge by it, js/nvbake.js)
    const put = (m, cast = true) => { m.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = true; } }); MK.add(m); own.push(m); return m; };
    const at = (m, x, z, y = 0, ry = 0) => { m.position.set(x, gy(x, z) + y, z); m.rotation.y = ry; return put(m); };
    const flat = (g, m) => { const me = new THREE.Mesh(g, m); me.receiveShadow = true; MK.add(me); own.push(me); return me; };
    // the ground: the park's grass on a 3 m grid, its edge snapped onto the line where it stops (smooth along the circuit and the ring road)
    { const xs = PARK.map(p => p[0]), zs = PARK.map(p => p[1]), X0 = Math.min(...xs) - 2, Z0 = Math.min(...zs) - 2, S = 3, NX = Math.ceil((Math.max(...xs) + 2 - X0) / S), NZ = Math.ceil((Math.max(...zs) + 2 - Z0) / S), IN = new Uint8Array((NX + 1) * (NZ + 1)), pos = [], uv = [], idx = [], vid = new Map();
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
    let ko = 0; for (const P of LP) for (let i = 2; i < P.length - 2; i += 3) for (const s of [-1, 1]) { const a = P[i - 1], b = P[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, off = 3.25 + 1.4 + rnd() * 1.5, x = P[i].x + nx * s * off, z = P[i].z + nz * s * off; if (!inPark(x, z)) continue;
      const k = ORDER[ko++ % ORDER.length], g = new THREE.Group(); mk[k](g); if (rd(x, z) < 1.5) continue; g.position.set(x, gy(x, z) + 0.1, z); g.rotation.y = Math.atan2(-dz, dx) + (s > 0 ? Math.PI : 0); put(g); items.push({ g, k, x, z }); }
    for (const [x, z] of [[20, -110], [88, -150], [14, -160], [92, -40]]) { const g = new THREE.Group(); mk.inflat(g); g.position.set(x, gy(x, z), z); put(g); items.push({ g, k: 'inflat', x, z }); }
    // trees and people (on the plazas and the lanes), clear of the lanes, the rides and the volcano's foot (its place: NVPark.volcano)
    { let sd = 21; const r3 = () => (sd = (sd * 16807) % 2147483647) / 2147483647, nearLane = (x, z) => LP.some(P => P.some(p => (p.x - x) ** 2 + (p.z - z) ** 2 < 36));
      const RIDES = [J.KOLO, J.VRT, J.VRT_O, J.SKOD, J.VER, J.LET, J.PAD_T, J.NIH, J.HISA, J.LAD], nearRide = (x, z) => RIDES.some(p => (p[0] - x) ** 2 + (p[1] - z) ** 2 < 120) || ((x - VC.x) / (VC.rx + 6)) ** 2 + ((z - VC.z) / (VC.rz + 6)) ** 2 < 1 || Object.values(J.PL).some(([px, pz, R]) => (px - x) ** 2 + (pz - z) ** 2 < (R + 3) ** 2);
      const TC = [0x4f8a34, 0x5f9a3a, 0x3f7a2e, 0x6aa040]; let nt = 0; for (let t = 0; t < 2500 && nt < 140; t++) { const x = -20 + r3() * 140, z = -240 + r3() * 270, h = 1.5 + r3(), s = 1.6 + r3() * 1.2; if (!inPark(x, z) || nearLane(x, z) || nearRide(x, z) || rd(x, z) < 1.5) continue;
        at(new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), L(TC[nt % 4], { flatShading: true })), x, z, h + 1.6); at(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, h + 0.6, 4, 1, true), L(0x6a4a2a)), x, z, (h + 0.6) / 2); nt++; }
      const GP = { body: new THREE.CylinderGeometry(0.2, 0.24, 0.9, 5), legs: new THREE.CylinderGeometry(0.17, 0.17, 0.5, 5, 1, true), head: new THREE.IcosahedronGeometry(0.17, 0) };
      const PC2 = [0xe8452c, 0x2a7ad8, 0xf2c12e, 0x3fbf6a, 0xc86bff, 0xff8a2a, 0xf4f4f0, 0x2a2622]; for (let k = 0; k < 160; k++) { let x, z;
        if (k < 90) { const [px, pz, R] = J.PL[['F', 'C', 'A'][k % 3]], a = r3() * 6.28, rr = R - 3.5 + (r3() - 0.5) * 2.5; x = px + Math.cos(a) * rr; z = pz + Math.sin(a) * rr; } else { const P = LP[k % LP.length], p = P[Math.floor(r3() * P.length)]; x = p.x + (r3() - 0.5) * 7.5; z = p.z + (r3() - 0.5) * 7.5; }
        const g = new THREE.Group(), c = PC2[Math.floor(r3() * 8)]; g.add(PM(GP.body, L(c), 0, 0.95, 0)); g.add(PM(GP.legs, L(0x2a3a5a), 0, 0.25, 0)); g.add(PM(GP.head, L(0xe0b89a), 0, 1.55, 0));
        if (rd(x, z) < 1.5) continue; g.position.set(x, gy(x, z), z); put(g, false); } }
    built = { LP: LP.map(P => P.map(p => [p.x, p.z])), items, own, rides: own.filter(o => o.userData.ride) };
    return built;
  }
  // the volcano's place (the old mine train's mountain, the pictures' volcano-page.js): the trees and people keep off its foot
  const VC = { x: 83, z: -188.5, rx: 15, rz: 17 };
  return { build, inPark, PARK, J, VC, get built() { return built; } };
})();
