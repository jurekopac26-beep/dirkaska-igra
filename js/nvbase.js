// NEW VERSION · TEST 1: the south of the small circuit's infield as the user chose it in the pictures (15.–22. 10.): the rescue base where the old
// construction site was (all asphalt up to the circuit, low red-white kerbs along its edge, a big H painted in it with old drift marks round it, the
// station REŠEVANJE with three ambulances, a windsock and floodlights, the chosen helicopter parked on the H: one big rotor and a tail, red with a
// white cross, its back ramp down), the way to the boxes along its east side (a new player's way from the driving school to the garages), and east
// of that way the big parking lot (bays in pairs of rows, lamps on the line between them) round the driving school's practice area, up to the
// roads; only dashed lines between the way and the lot or the base. Built by js/newmap.js hub4G instead of the old site (H3.BASEM), before the
// still meshes are merged (js/nvbake.js). Loaded with the new map (js/game.js nvStart).
const NVBase = (function () {
  'use strict';
  // the way to the boxes (from where the box's lane meets road 2 to the start straight) and its half width; the H; the station
  const ROUTE = [[-41.5, 41], [-40, 50], [-38.5, 58], [-36.5, 65], [-33, 72], [-27, 80], [-21, 87], [-15.5, 93], [-10.5, 100], [-8.2, 110], [-7.6, 122], [-7.4, 134], [-7.4, 149]], RW = 3.5;
  const HP = { x: -95, z: 95 }, ST = { x: -62, z: 70 };
  const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const segD = (P, x, z) => { let b = 1e9; for (let i = 1; i < P.length; i++) { const [ax, az] = P[i - 1], [bx, bz] = P[i], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); b = Math.min(b, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return b; };
  const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let R = null, built = null;

  // the shapes everything else needs (known before the ways are drawn, for the cars' asphalt, js/newmap.js surfGrid): the way, the base's apron, the lot
  function plan(MK) {
    const H3 = MK.H3, T = MK.T(), w = T.w, TL = H3.TL;
    const cv = new THREE.CatmullRomCurve3(ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'), RP = cv.getSpacedPoints(Math.round(cv.getLength() / 0.5)).map(v => [v.x, v.z]);
    // the way's x at z (it runs north to south), the base's edge west of it
    const laneX = (z) => { let best = null; for (let i = 1; i < RP.length; i++) { const [ax, az] = RP[i - 1], [bx, bz] = RP[i]; if ((az - z) * (bz - z) <= 0 && az !== bz) { const x = ax + (bx - ax) * (z - az) / (bz - az); if (best === null || x > -80) best = x; } } return best === null ? -25 : best; };
    const westEdge = (z) => laneX(z) - RW;
    // the apron: the old site's polygon west of the way; along the way its own edge (those points marked 1: no kerb there, a dashed line)
    const SPo = H3.sitePoly, apron = []; { const sd = (p) => p[0] - westEdge(p[1]); let exitZ = null;
      for (let i = 0; i < SPo.length; i++) { const a = SPo[i], b = SPo[(i + 1) % SPo.length], sa = sd(a), sb = sd(b); if (sa < 0) apron.push([a[0], a[1], 0]);
        if ((sa < 0) !== (sb < 0)) { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2, p = [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m]; if ((sd(p) < 0) === (sa < 0)) lo = m; else hi = m; } const q = [a[0] + (b[0] - a[0]) * lo, a[1] + (b[1] - a[1]) * lo, 1];
          if (sa < 0) { apron.push(q); exitZ = q[1]; } else { if (exitZ !== null) { const n = Math.ceil(Math.abs(q[1] - exitZ)); for (let k = 1; k < n; k++) { const z = exitZ + (q[1] - exitZ) * k / n; apron.push([westEdge(z), z, 1]); } } apron.push(q); exitZ = null; } } } }
    const AP = apron.map(p => [p[0], p[1]]), inApron = (x, z) => inPoly(AP, x, z);
    // the lot: either side of the way but not on the base's apron (everything there paved, the pictures), south of road 2 (under its kerb and strip,
    // which hide the lot's edge, js/nvedge.js), inside the circuit short of its edge, up to the garages along the start straight, not on the driving
    // school's practice area nor the HOME lot (they are drawn by their own)
    const jump = H3.net.find(e => e.id === 'jump'), JP = jump ? jump.P : [], JHW = jump ? jump.hw : 6.2;
    const GAR = [-146.8, -105.8, -64.8, 38, 88];   // (the garages along the start straight, z 139.9: cross, street, circuit, HOME, multi; js/nvmenu.js floors)
    const PAD = H3.PAD, inPad = (x, z, m = 0.4) => x > PAD[0] - m && x < PAD[1] + m && z > PAD[2] - m && z < PAD[3] + m;
    const southJ = (x, z) => { for (let i = 1; i < JP.length; i++) { const [ax, az] = JP[i - 1], [bx, bz] = JP[i]; if ((ax - x) * (bx - x) <= 0 && ax !== bx) return z > az + (bz - az) * (x - ax) / (bx - ax); } return true; };   // (south of road 2: north of it the park)
    const lotIn = (x, z) => z > 40 && z < 143 && southJ(x, z) && Math.abs(x - laneX(z)) > RW - 0.05 && !inApron(x, z) && TL.inLoop(x, z) && TL.dist(x, z, 30) > w + 3.2 && segD(JP, x, z) > JHW + 1.0 && !GAR.some(gx => Math.abs(x - gx) < 11.5 && z > 131.5)
      && !inPad(x, z, -0.1) && !(x > 23.3 && x < 52 && z > 122 && z < 131) && !(typeof NVPark !== 'undefined' && NVPark.inPark(x, z));   // (the HOME lot's lane: its own)
    let lb = [1e9, -1e9, 1e9, -1e9]; for (let x = -200; x <= 175; x += 2) for (let z = 40; z <= 140; z += 2) if (lotIn(x, z)) lb = [Math.min(lb[0], x - 2), Math.max(lb[1], x + 2), Math.min(lb[2], z - 2), Math.max(lb[3], z + 2)];
    let ab = [1e9, -1e9, 1e9, -1e9]; for (const [x, z] of AP) ab = [Math.min(ab[0], x), Math.max(ab[1], x), Math.min(ab[2], z), Math.max(ab[3], z)];
    R = { RP, laneX, westEdge, apron, AP, inApron, lotIn, inPad, lotBB: lb, apBB: ab };
    // the cars' asphalt: the way as a paved way of the net, the apron and the lot as paved areas
    MK.netAdd('route0', ROUTE, RW, 'asph'); (H3.paveFns = H3.paveFns || []).push({ bb: ab, inside: inApron }, { bb: lb, inside: lotIn });
    return R;
  }

  function build(MK) {
    if (!R) plan(MK);
    const H3 = MK.H3, gy = (x, z) => H3.ground(x, z), tx = Tex.all(), own = [];
    const MC = new Map(), mkey = (p, c, o) => p + c + JSON.stringify(o, (k, v) => v && v.isTexture ? 'tex' + v.id : v);
    const L = (c, o = {}) => { const k = mkey('L', c, o); let m = MC.get(k); if (!m) MC.set(k, m = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o))); return m; };
    const PH = L;   // (no shine: the merger joins every one-colour Lambert of a cell into one draw, js/nvbake.js)
    const BAS = (c, o = {}) => { const k = mkey('B', c, o); let m = MC.get(k); if (!m) MC.set(k, m = new THREE.MeshBasicMaterial(Object.assign({ color: c }, o))); return m; };
    const put = (m, cast = true) => { m.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = true; } }); MK.add(m); own.push(m); return m; };
    const flat = (g, m, ro) => { const me = new THREE.Mesh(g, m); me.receiveShadow = true; if (ro) me.renderOrder = ro; MK.add(me); own.push(me); return me; };
    const tex = (w, h, f) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t; };
    const geo = (pos, idx, uv) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; };
    const asph = tx.asphalt; asph.wrapS = asph.wrapT = THREE.RepeatWrapping;
    const ASPH = L(0x8c8a92, { map: asph, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), WL = BAS(0xf4f4f0, { polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }), YL = BAS(0xf2c12e, { polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 });
    // a paved area on a grid (S m), its edge snapped onto the line where it stops (as the park's grass, js/nvpark.js)
    const sheet = (inside, bb, S, dy, m) => { const X0 = bb[0], Z0 = bb[2], NX = Math.ceil((bb[1] - X0) / S), NZ = Math.ceil((bb[3] - Z0) / S), IN = new Uint8Array((NX + 1) * (NZ + 1)), pos = [], uv = [], idx = [], vid = new Map();
      for (let a = 0; a <= NX; a++) for (let b = 0; b <= NZ; b++) IN[a * (NZ + 1) + b] = inside(X0 + a * S, Z0 + b * S) ? 1 : 0;
      const vert = (a, b, na, nb) => { const key = a + ',' + b + ',' + na + ',' + nb; if (vid.has(key)) return vid.get(key); let x = X0 + a * S, z = Z0 + b * S;
        if (!IN[a * (NZ + 1) + b]) { let lo = 0, hi = 1; const xi = X0 + na * S, zi = Z0 + nb * S; for (let k = 0; k < 10; k++) { const t = (lo + hi) / 2; if (inside(xi + (x - xi) * t, zi + (z - zi) * t)) lo = t; else hi = t; } x = xi + (x - xi) * lo; z = zi + (z - zi) * lo; }
        const v = pos.length / 3; pos.push(x, gy(x, z) + dy, z); uv.push(x / 7, z / 7); vid.set(key, v); return v; };
      for (let a = 0; a < NX; a++) for (let b = 0; b < NZ; b++) { const C4 = [[a, b], [a + 1, b], [a + 1, b + 1], [a, b + 1]], ins = C4.map(([p, q]) => IN[p * (NZ + 1) + q]); if (!(ins[0] || ins[1] || ins[2] || ins[3])) continue;
        const pick = (k) => { if (ins[k]) return vert(C4[k][0], C4[k][1], C4[k][0], C4[k][1]); for (const d of [1, 3, 2]) { const q = (k + d) % 4; if (ins[q]) return vert(C4[k][0], C4[k][1], C4[q][0], C4[q][1]); } return 0; };
        const v = [0, 1, 2, 3].map(pick); idx.push(v[0], v[2], v[1], v[0], v[3], v[2]); }
      return flat(geo(pos, idx, uv), m, 2); };
    // a strip along a polyline (w m wide, dy over the ground); dashes: on / off metres
    const strip = (P, w, dy, m, on = 0, off = 0) => { const pos = [], idx = []; let acc = 0;
      for (let i = 1; i < P.length; i++) { const [ax, az] = P[i - 1], [bx, bz] = P[i], l = Math.hypot(bx - ax, bz - az); if (l < 1e-4) continue; const nx = -(bz - az) / l * w / 2, nz = (bx - ax) / l * w / 2;
        let t = 0; while (t < l) { const ph = on ? (acc % (on + off)) : 0, isOn = !on || ph < on, step = on ? Math.min(l - t, isOn ? on - ph : on + off - ph) : l - t;
          if (isOn) { const x0 = ax + (bx - ax) * t / l, z0 = az + (bz - az) * t / l, x1 = ax + (bx - ax) * (t + step) / l, z1 = az + (bz - az) * (t + step) / l, q = pos.length / 3;
            pos.push(x0 + nx, gy(x0, z0) + dy, z0 + nz, x1 + nx, gy(x1, z1) + dy, z1 + nz, x1 - nx, gy(x1, z1) + dy, z1 - nz, x0 - nx, gy(x0, z0) + dy, z0 - nz); idx.push(q, q + 1, q + 2, q, q + 2, q + 3); }   // (facing up)
          t += step; acc += step; } }
      return pos.length ? flat(geo(pos, idx), m, 4) : null; };
    const off = (P, d) => P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [p[0] - (b[1] - a[1]) / l * d, p[1] + (b[0] - a[0]) / l * d]; });
    const B = (par, w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); par.add(o); return o; };
    const C = (par, r0, r1, h, m, x = 0, y = 0, z = 0, seg = 12) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); o.position.set(x, y, z); par.add(o); return o; };
    const sign = (par, text, w, h, x, y, z, ry, bg, fg) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), L(0xffffff, { map: tex(512, Math.round(512 * h / w), (c, W2, H2) => { c.fillStyle = bg; c.fillRect(0, 0, W2, H2); c.fillStyle = fg; c.font = 'bold ' + Math.round(H2 * 0.62) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W2 / 2, H2 / 2 + 2); }) })); s.position.set(x, y, z); s.rotation.y = ry || 0; par.add(s); return s; };

    // ---- the way to the boxes: its asphalt, a dashed white line along both edges (only dashes between it and the base or the lot)
    const RP = R.RP; strip(RP, RW * 2, 0.1, ASPH); for (const s of [-1, 1]) strip(off(RP, s * (RW - 0.25)).slice(8, -8), 0.3, 0.13, WL, 3, 2.5);
    // ---- the base: the apron (flat, its own level; the circuit's kerb along its edge there, js/nvedge.js)
    const AP = R.apron, y0 = (() => { const v = R.AP.map(([x, z]) => gy(x, z)).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; })();
    { const sh = new THREE.Shape(R.AP.map(([x, z]) => new THREE.Vector2(x, z))), g = new THREE.ShapeGeometry(sh, 4), pa = g.attributes.position, uvA = new Float32Array(pa.count * 2);
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getY(i); pa.setXYZ(i, x, y0 + 0.08, z); uvA[2 * i] = x / 7; uvA[2 * i + 1] = z / 7; } g.setAttribute('uv', new THREE.BufferAttribute(uvA, 2)); g.computeVertexNormals();
      if (g.attributes.normal.getY(0) < 0) { const I = g.index; for (let i = 0; i < I.count; i += 3) { const t = I.getX(i + 1); I.setX(i + 1, I.getX(i + 2)); I.setX(i + 2, t); } g.computeVertexNormals(); } flat(g, ASPH, 2); }
    // the H painted in the asphalt (a white ring, a big H, a yellow dashed ring), old drift marks round it, a yellow dashed line to it from the way
    const HY = y0 + 0.08;
    { const hT = tex(512, 512, (c, w, h) => { c.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2; c.strokeStyle = '#f4f4f0'; c.lineWidth = 13; c.beginPath(); c.arc(cx, cy, w * 0.4, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = '#f2c12e'; c.lineWidth = 7; c.setLineDash([23, 15]); c.beginPath(); c.arc(cx, cy, w * 0.475, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#f4f4f0'; const hw = w * 0.17, hh = w * 0.25, bar = w * 0.07; c.fillRect(cx - hw, cy - hh, bar, hh * 2); c.fillRect(cx + hw - bar, cy - hh, bar, hh * 2); c.fillRect(cx - hw, cy - bar / 2, hw * 2, bar); });
      const dT = tex(512, 512, (c, w, h) => { c.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2; let sd = 7; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; c.lineCap = 'round';
        for (let k = 0; k < 9; k++) { const R0 = w * (0.3 + r() * 0.17), e = 0.85 + r() * 0.25, a0 = r() * 6.28, a1 = a0 + 1.5 + r() * 4, ox = (r() - 0.5) * w * 0.06, oy = (r() - 0.5) * w * 0.06; for (const o of [-4.5, 4.5]) { c.strokeStyle = 'rgba(20,20,22,' + (0.18 + r() * 0.2).toFixed(2) + ')'; c.lineWidth = 3 + r() * 2; c.beginPath(); for (let t = a0; t <= a1; t += 0.03) { const x = cx + ox + Math.cos(t) * (R0 + o), y = cy + oy + Math.sin(t) * (R0 + o) * e; if (t === a0) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); } } });
      const disc = (r, t, f, ro, rz) => flat(new THREE.CircleGeometry(r, 48).rotateZ(rz).rotateX(-Math.PI / 2).translate(HP.x, HY + 0.02, HP.z), L(0xffffff, { map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: f, polygonOffsetUnits: f }), ro);
      disc(30, dT, -7, 5, 0); disc(12.5, hT, -8, 6, Math.PI / 2); strip([[R.westEdge(HP.z) - 1, HP.z], [HP.x + 13.5, HP.z]], 0.35, 0.14, YL, 3, 2); }
    // the station: white, a red band, three garage doors to the south, a red cross on its roof; its ambulances in front; a windsock, floodlights
    { const S = new THREE.Group(), WHT = PH(0xf4f4f0), RED = PH(0xd8282a), GL = PH(0x2a3a52); S.position.set(ST.x, y0, ST.z);
      B(S, 28, 0.5, 13, L(0x8c8a86), 0, 0, 0); B(S, 26, 6, 11, WHT, 0, 3.2, 0); B(S, 26.1, 0.9, 11.1, RED, 0, 5.4, 0); B(S, 26.6, 0.4, 11.6, L(0x5a6066), 0, 6.4, 0);
      for (let k = 0; k < 3; k++) B(S, 5.2, 3.4, 0.1, L(0xd8dce2), -8 + k * 7, 1.9, 5.55); B(S, 4.0, 1.2, 0.1, GL, 10, 4.1, 5.55); sign(S, 'REŠEVANJE', 10, 1.5, 2.5, 5.4, 5.62, 0, '#d8282a', '#ffffff');
      B(S, 8, 0.12, 2.2, RED, 0, 6.66, 0); B(S, 2.2, 0.12, 8, RED, 0, 6.66, 0); put(S);
      for (let k = 0; k < 3; k++) { const a = new THREE.Group(); a.position.set(-70 + k * 7, y0 + 0.08, 81); a.rotation.y = -Math.PI / 2; B(a, 4.2, 1.1, 1.8, WHT, 0, 0.75, 0); B(a, 2.2, 0.75, 1.65, WHT, -0.2, 1.65, 0); B(a, 4.25, 0.25, 1.85, RED, 0, 0.95, 0); B(a, 0.5, 0.18, 1.2, PH(0x2a5ab8), -0.2, 2.1, 0);
        for (const [x, z] of [[1.3, 0.85], [1.3, -0.85], [-1.3, 0.85], [-1.3, -0.85]]) C(a, 0.38, 0.38, 0.3, L(0x26262a), x, 0.38, z, 10).rotation.x = Math.PI / 2; put(a); }
      const STEEL = PH(0x9aa0a8); { const ws = new THREE.Group(); ws.position.set(-132, gy(-132, 112), 112); C(ws, 0.07, 0.09, 6, STEEL, 0, 3, 0, 6); const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.18, 2.6, 10, 1, true), L(0xffffff, { side: THREE.DoubleSide, map: tex(128, 32, (c, w, h) => { for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? '#f4f4f0' : '#ff6a10'; c.fillRect(k * w / 5, 0, w / 5 + 1, h); } }) })); sock.rotation.z = Math.PI / 2 - 0.25; sock.position.set(1.35, 5.75, 0); ws.add(sock); ws.rotation.y = 0.8; put(ws); }
      for (const [x, z] of [[-122, 70], [-40, 118], [-150, 118], [-100, 120]]) { const lp = new THREE.Group(); lp.position.set(x, gy(x, z), z); C(lp, 0.09, 0.12, 8, STEEL, 0, 4, 0, 6); B(lp, 1.2, 0.4, 0.6, L(0x26262a), 0, 8.1, 0); put(lp); } }
    // the helicopter on the H: one big rotor and a tail, red with a white cross, its back ramp down (drive in at the back), the nose shut
    const heli = helicopter(); heli.G.position.set(HP.x, HY, HP.z); heli.G.rotation.set(0, -Math.PI, 0); put(heli.G);

    // ---- the lot: its asphalt up to the roads, bays (2.5 by 5 m) in pairs of rows back to back, 6.5 m aisles, a line between the pairs, lamps on it
    const LB = R.lotBB; sheet(R.lotIn, LB, 3, 0.05, ASPH);
    // along road 2 (its edge, its kerb and its strip, js/nvedge.js) the lot behind a low kerb of red and white blocks (the pictures' fence 5)
    { const JP = (H3.net.find(e => e.id === 'jump') || {}).P || [], hw = (H3.net.find(e => e.id === 'jump') || {}).hw || 6.2, TLc = H3.TL, red = [], ri = [], wht = [], wi = []; let acc = 0;
      const Q = off(JP, hw + 2.3), Qo = off(JP, hw + 2.75), side = (P, I, a, b, c, d, y0, y1) => { const q = P.length / 3; P.push(a[0], gy(a[0], a[1]) + y0, a[1], b[0], gy(b[0], b[1]) + y0, b[1], c[0], gy(c[0], c[1]) + y1, c[1], d[0], gy(d[0], d[1]) + y1, d[1]); I.push(q, q + 1, q + 2, q, q + 2, q + 3, q, q + 2, q + 1, q, q + 3, q + 2); };
      for (let i = 1; i < Q.length; i++) { const l = Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]), m = [(Q[i][0] + Qo[i][0]) / 2, (Q[i][1] + Qo[i][1]) / 2]; acc += l;
        if (!R.lotIn(m[0] + (Qo[i][0] - Q[i][0]) * 1.5, m[1] + (Qo[i][1] - Q[i][1]) * 1.5) || (TLc && TLc.dist(m[0], m[1], 20) < MK.T().w + 3)) continue;
        const [P, I] = Math.floor(acc / 1.2) % 2 ? [wht, wi] : [red, ri]; side(P, I, Q[i - 1], Q[i], Qo[i], Qo[i - 1], 0.16, 0.16); side(P, I, Q[i - 1], Q[i], Q[i], Q[i - 1], 0.05, 0.16); }
      if (ri.length) flat(geo(red, ri), L(0xd8282a), 3); if (wi.length) flat(geo(wht, wi), L(0xf4f4f0), 3); }
    { const lines = [], li = [], mid = [], mi = [], lamps = [], BW = 2.5, BD = 5, AIS = 6.5, PER = 2 * BD + AIS, x0 = Math.ceil(LB[0] / BW) * BW, fits = (x, za, zb) => R.lotIn(x, za - 0.8) && R.lotIn(x, zb + 0.8) && R.lotIn(x + BW, za - 0.8) && R.lotIn(x + BW, zb + 0.8) && R.lotIn(x - 1.0, (za + zb) / 2) && R.lotIn(x + BW + 1.0, (za + zb) / 2);
      const quad = (P, I, xa, za, xb, zb, dy) => { const q = P.length / 3; P.push(xa, gy(xa, za) + dy, za, xb, gy(xb, za) + dy, za, xb, gy(xb, zb) + dy, zb, xa, gy(xa, zb) + dy, zb); I.push(q, q + 2, q + 1, q, q + 3, q + 2); };
      for (let zr = LB[2] + AIS; zr + 2 * BD < LB[3]; zr += PER) { const zm = zr + BD; for (const [za, zb] of [[zr, zm], [zm, zm + BD]]) { let run = null; const flush = () => { if (!run) return; const [xs, xe] = run;
            for (let x = xs; x <= xe + 1e-6; x += BW) quad(lines, li, x - 0.06, za, x + 0.06, zb, 0.09); if (za === zr) { quad(mid, mi, xs - 0.06, zm - 0.06, xe + 0.06, zm + 0.06, 0.09); for (let x = xs; x <= xe + 1e-6; x += BW) if ((Math.round(x / BW) % 6 + 6) % 6 === 3 && x > xs && x < xe) lamps.push([x, zm]); lamps.push([xs - 0.9, zm], [xe + 0.9, zm]); } run = null; };
          for (let x = x0; x < LB[1]; x += BW) { if (fits(x, zr, zm + BD)) run = run ? [run[0], x + BW] : [x, x + BW]; else flush(); } flush(); } }
      if (li.length) flat(geo(lines, li), WL, 4); if (mi.length) flat(geo(mid, mi), WL, 4);
      const STEEL = PH(0x9aa0a8), HEAD = L(0xfff6d8); for (const [x, z] of lamps) { const lp = new THREE.Group(); lp.position.set(x, gy(x, z), z); C(lp, 0.08, 0.11, 6.5, STEEL, 0, 3.25, 0, 6); B(lp, 1.6, 0.18, 0.4, STEEL, 0, 6.5, 0); for (const s of [-1, 1]) B(lp, 0.5, 0.12, 0.35, HEAD, s * 0.75, 6.4, 0); put(lp); }
      built = { lamps: lamps.length, bays: li.length / 6 }; }
    built = Object.assign(built || {}, { own, heli, y0, apron: AP.length });
    return built;
  }

  // the helicopter (the pictures' heli4/heli8, version 2): a rounded shell with the cargo bay through it, the cockpit on the roof's front, sponsons
  // with wheels, a ramp at each end (the back one down, the front one shut), one big eight-bladed rotor, the tail boom high over the back ramp with
  // its fin and the tail rotor. Red with a dark band, a white cross and REŠEVANJE on its sides. Its nose along +x, the bay's floor 1.25 m up
  function helicopter(sc = { base: 0xd42a2a, band: 0x2a2e34, band2: 0xf2c12e, cross: 0xf4f4f0 }) {
    const v = { x0: -6.0, x1: 5.4, W: 4.3, H: 3.7, r: 1.0, bayW: 3.4, bayH: 2.8, ck: { x0: 1.2, x1: 4.6, w: 3.1, h: 1.5 } }, G = new THREE.Group();
    const L = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o)), PHm = L;   // (Lambert: merged with the rest while it stands still)
    const BODY = PHm(sc.base), BAND = PHm(sc.band), BAND2 = PHm(sc.band2), DARK = L(0x26262a), GREY = PHm(0x8a9098), GLS = L(0x182634), FLOOR = L(0x4a4e54), TIP = PHm(0xf2c12e), WH = L(0xf4f4f0);
    const Mh = (g, m, x, y, z, par = G) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); par.add(o); return o; };
    const B = (par, w, h, d, m, x = 0, y = 0, z = 0) => Mh(new THREE.BoxGeometry(w, h, d), m, x, y, z, par);
    const C = (par, r0, r1, h, m, x = 0, y = 0, z = 0, seg = 12) => Mh(new THREE.CylinderGeometry(r0, r1, h, seg), m, x, y, z, par);
    const ROD = (par, a, b, r, m, seg = 6, r2) => { const A = new THREE.Vector3(...a), E = new THREE.Vector3(...b), l = A.distanceTo(E); const o = new THREE.Mesh(new THREE.CylinderGeometry(r2 === undefined ? r : r2, r, l, seg), m); o.position.copy(A).add(E).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), E.clone().sub(A).normalize()); par.add(o); return o; };
    const rr = (w, h, r) => { const s = new THREE.Shape(), x0 = -w / 2; s.moveTo(x0 + r, 0); s.lineTo(x0 + w - r, 0); s.quadraticCurveTo(x0 + w, 0, x0 + w, r); s.lineTo(x0 + w, h - r); s.quadraticCurveTo(x0 + w, h, x0 + w - r, h); s.lineTo(x0 + r, h); s.quadraticCurveTo(x0, h, x0, h - r); s.lineTo(x0, r); s.quadraticCurveTo(x0, 0, x0 + r, 0); return s; };
    const bay = (w, h, y0, rt = 0.45) => { const p = new THREE.Path(), x0 = -w / 2; p.moveTo(x0, y0); p.lineTo(x0 + w, y0); p.lineTo(x0 + w, y0 + h - rt); p.quadraticCurveTo(x0 + w, y0 + h, x0 + w - rt, y0 + h); p.lineTo(x0 + rt, y0 + h); p.quadraticCurveTo(x0, y0 + h, x0, y0 + h - rt); p.lineTo(x0, y0); return p; };
    const ext = (shape, x0, len, m, y) => { const g = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false, curveSegments: 6 }); g.rotateY(Math.PI / 2); g.translate(x0, y, 0); g.computeVertexNormals(); return Mh(g, m, 0, 0, 0); };
    const belly = 0.85, fl = 0.4, len = v.x1 - v.x0, xm = (v.x0 + v.x1) / 2, hw = v.W / 2, ytop = belly + v.H, yfl = belly + fl;
    { const s = rr(v.W, v.H, v.r); s.holes.push(bay(v.bayW, v.bayH, fl)); ext(s, v.x0, len, BODY, belly); }
    B(G, len - 0.08, 0.06, v.bayW - 0.06, FLOOR, xm, yfl + 0.03, 0); for (const s of [-1, 1]) B(G, len - 0.05, v.bayH - 0.5, 0.03, L(0xb8bcc2), xm, yfl + v.bayH / 2 - 0.05, s * (v.bayW / 2 - 0.03));
    for (const s of [-1, 1]) { const zs = s * (hw + 0.006); B(G, len - 0.15, 0.42, 0.02, BAND, xm, belly + 1.55, zs); B(G, len - 0.15, 0.08, 0.02, BAND2, xm, belly + 1.84, zs);
      for (let x = v.x0 + 1.5; x < v.x1 - 0.9; x += 1.5) B(G, 0.66, 0.52, 0.03, GLS, x, belly + 2.35, s * (hw + 0.015));
      B(G, 1.62, 0.47, 0.02, WH, v.x0 + 0.75, belly + 2.35, s * (hw + 0.02)); B(G, 0.47, 1.62, 0.02, WH, v.x0 + 0.75, belly + 2.35, s * (hw + 0.02)); }
    { const t = (() => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 70; const c = cv.getContext('2d'); c.fillStyle = '#2a2e34'; c.fillRect(0, 0, 512, 70); c.fillStyle = '#ffffff'; c.font = 'bold 46px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('REŠEVANJE', 256, 37); return new THREE.CanvasTexture(cv); })();
      for (const s of [-1, 1]) { const p = Mh(new THREE.PlaneGeometry(3.4, 0.46), L(0xffffff, { map: t }), v.x0 + 3.0, belly + 1.05, s * (hw + 0.02)); p.rotation.y = s > 0 ? 0 : Math.PI; } }
    for (const s of [-1, 1]) { const zs = s * (hw + 0.32), sl = len - 2.0; B(G, sl, 0.8, 0.66, BODY, xm, belly + 0.32, zs); B(G, sl, 0.1, 0.67, BAND, xm, belly + 0.6, zs);
      for (const x of [v.x0 + 1.6, v.x1 - 1.6]) { C(G, 0.48, 0.48, 0.34, L(0x151515), x, 0.48, zs, 12).rotation.x = Math.PI / 2; ROD(G, [x, 0.48, zs], [x, belly + 0.15, zs], 0.09, GREY); } }
    { const c = v.ck, yc = ytop - 0.22; ext(rr(c.w, c.h, 0.5), c.x0, c.x1 - c.x0, BODY, yc); const n = Mh(new THREE.SphereGeometry(1, 14, 10, Math.PI / 2, Math.PI), BODY, c.x1, yc + c.h / 2, 0); n.scale.set(1.25, c.h / 2, c.w / 2);
      const ws = Mh(new THREE.SphereGeometry(1, 14, 6, Math.PI / 2, Math.PI, Math.PI * 0.16, Math.PI * 0.33), GLS, c.x1, yc + c.h / 2, 0); ws.scale.set(1.27, c.h / 2 + 0.015, c.w / 2 + 0.015);
      for (const s of [-1, 1]) B(G, 1.7, 0.56, 0.02, GLS, c.x1 - 0.95, yc + c.h * 0.64, s * (c.w / 2 + 0.01)); B(G, c.x1 - c.x0, 0.22, c.w + 0.02, BAND, (c.x0 + c.x1) / 2, yc + 0.22, 0); }
    // the ramps: hinged on the floor's edge; the back one down to the ground, the front one shut
    const ramp = (xh, dir, down) => { const g = new THREE.Group(); g.position.set(xh, yfl, 0); G.add(g); const Lr = 3.65, A = Math.asin(yfl / Lr);
      B(g, Lr, 0.16, v.bayW - 0.12, GREY, dir * Lr / 2, -0.08, 0); for (const s of [-1, 1]) B(g, Lr, 0.28, 0.08, BODY, dir * Lr / 2, 0.06, s * (v.bayW / 2 - 0.1)); B(g, 0.32, 0.17, v.bayW - 0.12, TIP, dir * (Lr - 0.16), -0.07, 0);
      g.rotation.z = down ? (dir < 0 ? A : -A) : dir * Math.PI / 2; g.userData = { A, Lr, dir }; return g; };
    const RR = ramp(v.x0, -1, true), RF = ramp(v.x1, 1, false);
    // the nose: two doors (shut)
    for (const s of [-1, 1]) { const q = Mh(new THREE.SphereGeometry(1, 12, 10, s > 0 ? Math.PI / 2 : Math.PI, Math.PI / 2), BODY, v.x1, belly + v.H / 2, 0); q.scale.set(1.9, v.H / 2 - 0.02, hw - 0.02); }
    // the rotor head, eight blades with painted tips; the engines over the roof
    B(G, 5.4, 0.95, 2.7, BODY, -0.7, ytop + 0.45, 0); for (const s of [-1, 1]) { const e = C(G, 0.44, 0.5, 4.4, GREY, -0.4, ytop + 0.85, s * 1.0, 10); e.rotation.z = Math.PI / 2; } C(G, 0.3, 0.4, 1.6, GREY, -0.6, ytop + 1.5, 0, 10);
    const RO = new THREE.Group(); RO.position.set(-0.6, ytop + 2.35, 0); G.add(RO); C(RO, 0.36, 0.42, 0.5, GREY, 0, 0, 0, 10);
    for (let k = 0; k < 8; k++) { const p = new THREE.Group(); p.rotation.y = 0.2 + k * Math.PI / 4; RO.add(p); B(p, 9.9, 0.08, 0.66, DARK, 1.2 + 9.9 / 2, -0.06, 0); B(p, 0.6, 0.085, 0.67, TIP, 10.65, -0.15, 0); }
    // the tail boom over the back ramp (red and white bands near its end), the fin, the stabiliser, the tail rotor (five blades) on its left
    const a = [v.x0 + 1.4, ytop - 0.15, 0], e = [v.x0 - 9.2, ytop + 0.55, 0]; ROD(G, a, e, 0.66, BODY, 12, 0.36);
    for (let k = 0; k < 4; k++) { const t0 = 0.74 + k * 0.05, t1 = t0 + 0.05, P = (t) => a.map((u, i) => u + (e[i] - u) * t); ROD(G, P(t0), P(t1), 0.67 - 0.3 * t1 + 0.015, k % 2 ? WH : PHm(0xd8282a), 12, 0.67 - 0.3 * t0 + 0.015); }
    { const s = new THREE.Shape([[0, 0], [-1.3, 0], [-2.3, 3.0], [-1.2, 3.0]].map(([x, y]) => new THREE.Vector2(x, y))), g = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false }); g.translate(0, 0, -0.1); Mh(g, BODY, e[0] + 0.9, e[1] - 0.2, 0); }
    B(G, 1.5, 0.12, 3.4, BODY, e[0] + 0.6, e[1] - 0.1, 0);
    const TR = new THREE.Group(); TR.position.set(e[0] - 0.55, e[1] + 1.9, -0.32); TR.rotation.x = Math.PI / 2; G.add(TR); C(TR, 0.16, 0.16, 0.3, GREY, 0, 0, 0, 8); for (let k = 0; k < 5; k++) { const p = new THREE.Group(); p.rotation.y = k * 2 * Math.PI / 5; TR.add(p); B(p, 2.1, 0.05, 0.28, DARK, 1.15, 0, 0); }
    G.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { G, RR, RF, RO, TR, v };
  }
  return { ROUTE, RW, HP, ST, plan, build, helicopter, get R() { return R; }, get built() { return built; } };
})();
