// makete za vprašanje nm10-rampa (samo v strani, ne v kodi igre): window.__RM.show(k) postavi možnost k (1..4), __RM.clear() pobriše
window.__RM = (() => {
  const H = __H3, gr = (x, z) => H.ground(x, z);
  let G = null;
  const lam = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
  const tex = (w, h, draw, rep) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const HZ = lam(0xffffff, { map: tex(256, 32, (c, w, h) => { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#141414' : '#ffd34d'; c.fillRect(i * 16, 0, 16, h); } }) });
  const WOOD = lam(0xffffff, { map: tex(256, 256, (c, w, h) => { c.fillStyle = '#a5743f'; c.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { c.fillStyle = ['#a5743f', '#9a6a38', '#ae7c46', '#94653a'][i % 4]; c.fillRect(0, i * 32, w, 32); c.fillStyle = '#5e3c1c'; c.fillRect(0, i * 32, w, 2); for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(70,40,15,0.25)'; c.fillRect((i * 71 + k * 97) % w, i * 32 + 6 + k * 8, 60, 1); } c.fillStyle = '#4a2e14'; c.fillRect((i * 53) % w, i * 32, 2, 32); } }) });
  const ASPH = lam(0x4e5157), ASPH_S = lam(0x3a3c41), CONC = lam(0xbab6ae), CONC_S = lam(0x9d998f), WOOD_S = lam(0x7a4e26), POST = lam(0x5a3a1c), SKIRT = lam(0x9a1f22);
  const add = (m, cast = true) => { m.castShadow = cast; m.receiveShadow = true; G.add(m); return m; };
  // a ramp's profile along the heading hd from (x0, z0): pts [[s, h], ...] (h over the ground at s), W wide; the top's material by s (mats.top(s0, s1)),
  // the sides and the ends down to the ground
  function prof(x0, z0, hd, W, pts, mats) {
    const fx = Math.cos(hd), fz = Math.sin(hd), nx = -fz, nz = fx, P = [], N = [], UV = [], groups = [];
    const at = (s, v, h) => { const x = x0 + fx * s + nx * v, z = z0 + fz * s + nz * v; return [x, gr(x0 + fx * s, z0 + fz * s) + h, z]; };
    const tri = (a, b, c, ua, ub, uc, gi) => { P.push(...a, ...b, ...c); UV.push(...ua, ...ub, ...uc); groups.push(gi); };
    const quad = (a, b, c, d, ua, ub, uc, ud, gi) => { tri(a, b, c, ua, ub, uc, gi); tri(a, c, d, ua, uc, ud, gi); };
    const mi = [], ML = []; const mIdx = (m) => { let i = ML.indexOf(m); if (i < 0) { ML.push(m); i = ML.length - 1; } return i; };
    // densify the profile (the ground under it is not flat)
    const S = []; for (let i = 0; i < pts.length - 1; i++) { const [s0, h0] = pts[i], [s1, h1] = pts[i + 1], n = Math.max(1, Math.ceil((s1 - s0) / 0.5)); for (let k = 0; k < n; k++) { const t = k / n; S.push([s0 + (s1 - s0) * t, h0 + (h1 - h0) * (pts[i].curve ? Math.pow(t, pts[i].curve) : t)]); } } S.push(pts[pts.length - 1].slice(0, 2));
    let acc = 0;
    for (let i = 0; i < S.length - 1; i++) {
      const [s0, h0] = S[i], [s1, h1] = S[i + 1], L = Math.hypot(s1 - s0, h1 - h0), g = mIdx(mats.top((s0 + s1) / 2));
      const a = at(s0, -W / 2, h0), b = at(s0, W / 2, h0), c = at(s1, W / 2, h1), d = at(s1, -W / 2, h1);
      quad(a, b, c, d, [0, acc / 2], [W / 2, acc / 2], [W / 2, (acc + L) / 2], [0, (acc + L) / 2], g);
      const gs = mIdx(mats.side((s0 + s1) / 2));
      for (const v of [-W / 2, W / 2]) { const t0 = at(s0, v, h0), t1 = at(s1, v, h1), b0 = at(s0, v, -0.05), b1 = at(s1, v, -0.05);
        if (v > 0) quad(b0, b1, t1, t0, [s0 / 2, 0], [s1 / 2, 0], [s1 / 2, h1 / 2], [s0 / 2, h0 / 2], gs); else quad(b0, t0, t1, b1, [s0 / 2, 0], [s0 / 2, h0 / 2], [s1 / 2, h1 / 2], [s1 / 2, 0], gs); }
      acc += L;
    }
    for (const [s, h, sg] of [[S[0][0], S[0][1], -1], [S[S.length - 1][0], S[S.length - 1][1], 1]]) if (h > 0.02) { const gs = mIdx(mats.side(s)), a = at(s, -W / 2, -0.05), b = at(s, W / 2, -0.05), c = at(s, W / 2, h), d = at(s, -W / 2, h);
      if (sg < 0) quad(a, b, c, d, [0, 0], [W / 2, 0], [W / 2, h / 2], [0, h / 2], gs); else quad(a, d, c, b, [0, 0], [0, h / 2], [W / 2, h / 2], [W / 2, 0], gs); }
    // the triangles by material
    const order = groups.map((g, i) => [g, i]).sort((p, q) => p[0] - q[0]), P2 = [], UV2 = [], geo = new THREE.BufferGeometry(); let cur = -1, start = 0;
    order.forEach(([g, i], k) => { if (g !== cur) { if (cur >= 0) geo.addGroup(start, k * 3 - start, cur); cur = g; start = k * 3; } P2.push(...P.slice(i * 9, i * 9 + 9)); UV2.push(...UV.slice(i * 6, i * 6 + 6)); });
    geo.addGroup(start, order.length * 3 - start, cur);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV2, 2)); geo.computeVertexNormals();
    return add(new THREE.Mesh(geo, ML));
  }
  // a box in the ramp's frame: s along, v across, h over the ground at its middle
  function box(x0, z0, hd, s, v, h, sx, sy, sz, m, rz = 0) { const fx = Math.cos(hd), fz = Math.sin(hd), x = x0 + fx * s - fz * v, z = z0 + fz * s + fx * v, me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); me.position.set(x, gr(x, z) + h, z); me.rotation.set(0, -hd, rz, 'YXZ'); return add(me); }
  function put(x0, z0, hd, s, v, y, me) { const fx = Math.cos(hd), fz = Math.sin(hd), x = x0 + fx * s - fz * v, z = z0 + fz * s + fx * v; me.position.set(x, y, z); me.rotation.y = -hd + (me.userData.ry || 0); return add(me); }
  const hzStrip = (x0, z0, hd, s, v, y, len, wd, rz = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, wd), HZ.clone()); me.material.map = HZ.map.clone(); me.material.map.needsUpdate = true; me.material.map.repeat.set(len / 2, 1); const fx = Math.cos(hd), fz = Math.sin(hd), x = x0 + fx * s - fz * v, z = z0 + fz * s + fx * v; me.position.set(x, y, z); me.rotation.set(0, -hd, rz, 'YXZ'); return add(me, false); };
  const hzTop = (L) => (s) => s > L - 0.45 ? HZ : null;
  // the things the car knocks over
  const BOXM = lam(0xc9975b), TAPE = lam(0x8c6a3e), TYRE = lam(0x1b1b1d), CONE = lam(0xff6a12), WHITE = lam(0xf4f4f0), RED = lam(0xd8282a), BLUE = lam(0x2a5db0), YEL = lam(0xf2c418);
  function cardBox(x0, z0, hd, s, v, y, k = 0) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.85), BOXM); b.castShadow = b.receiveShadow = true; g.add(b); const t = new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.02, 0.14), TAPE); t.position.y = 0.33; g.add(t); g.userData.ry = k * 0.37; return put(x0, z0, hd, s, v, y + 0.325, g); }
  function tyres(x0, z0, hd, s, v, y, n = 3) { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.17, 8, 16), TYRE); t.rotation.x = Math.PI / 2; t.position.y = 0.17 + i * 0.33; t.castShadow = true; g.add(t); } return put(x0, z0, hd, s, v, y, g); }
  function cone(x0, z0, hd, s, v, y) { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.72, 12), CONE); c.position.y = 0.36; c.castShadow = true; g.add(c); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.12, 12), WHITE); b.position.y = 0.42; g.add(b); const ba = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.5), CONE); ba.position.y = 0.02; g.add(ba); return put(x0, z0, hd, s, v, y, g); }
  function barrel(x0, z0, hd, s, v, y, m) { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.92, 14), m); c.position.y = 0.46; c.castShadow = true; g.add(c); for (const yy of [0.25, 0.67]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.025, 4, 18), lam(0x222222)); r.rotation.x = Math.PI / 2; r.position.y = yy; g.add(r); } return put(x0, z0, hd, s, v, y, g); }
  function pin(x0, z0, hd, s, v, y) { const g = new THREE.Group(); const pts = [[0, 0], [0.2, 0.05], [0.3, 0.35], [0.28, 0.6], [0.16, 0.9], [0.13, 1.05], [0.17, 1.25], [0.14, 1.4], [0, 1.45]].map(([r, h]) => new THREE.Vector2(r * 1.25, h * 1.25)); const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), WHITE); b.castShadow = true; g.add(b); for (const yy of [1.08, 1.2]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.06, 14), RED); r.position.y = yy * 1.25 - 0.06; g.add(r); } return put(x0, z0, hd, s, v, y, g); }
  // 1 · an asphalt kicker on the park's lane (lane 2 from the fountain's plaza), landing straight on the lane
  function opt1() { const A = [45, -44], d = [0.484, -0.875], hd = Math.atan2(d[1], d[0]), x0 = A[0] + d[0] * 9, z0 = A[1] + d[1] * 9, W = 5.8, L = 5.2;
    const CHEV = lam(0xffffff, { map: tex(256, 256, (c, w, h) => { c.fillStyle = '#4e5157'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f4f4f0'; c.lineWidth = 22; c.lineJoin = 'miter'; for (const y0 of [0.42, 0.72]) { c.beginPath(); c.moveTo(w * 0.22, h * y0 + h * 0.16); c.lineTo(w * 0.5, h * y0 - h * 0.06); c.lineTo(w * 0.78, h * y0 + h * 0.16); c.stroke(); } }) });
    CHEV.map.wrapS = CHEV.map.wrapT = THREE.ClampToEdgeWrapping; CHEV.map.repeat.set(2 / W, 2 / (L * 1.02));
    prof(x0, z0, hd, W, [Object.assign([0, 0], { curve: 1.7 }), [L, 1.3]], { top: (s) => s > L - 0.45 ? HZ : CHEV, side: () => HZ });
    return { car: [A[0] + d[0] * 1, A[1] + d[1] * 1, hd] }; }
  // 2 · a wooden stunt ramp on the fountain's plaza F, a jump across a part of it onto a wooden landing ramp
  function opt2() { const x0 = 53, z0 = -20, hd = Math.PI, W = 4.4, L = 6, LS = 17, LE = 25;
    prof(x0, z0, hd, W, [Object.assign([0, 0], { curve: 1.5 }), [L, 1.6]], { top: (s) => s > L - 0.4 ? HZ : WOOD, side: () => WOOD_S });
    prof(x0, z0, hd, W, [[LS, 1.3], [LE, 0]], { top: (s) => s < LS + 0.4 ? HZ : WOOD, side: () => WOOD_S });
    for (const s of [1.6, 3.3, 5.0]) for (const v of [-W / 2 + 0.2, W / 2 - 0.2]) { const h = 1.6 * Math.pow(s / L, 1.5); box(x0, z0, hd, s, v, h / 2 + 0.0, 0.18, h, 0.18, POST); }
    for (const s of [LS + 1.2, LS + 3.6, LS + 6]) for (const v of [-W / 2 + 0.2, W / 2 - 0.2]) { const h = 1.3 * (1 - (s - LS) / (LE - LS)); box(x0, z0, hd, s, v, h / 2, 0.18, h, 0.18, POST); }
    for (const sg of [-1, 1]) { const me = box(x0, z0, hd, L * 0.55, sg * (W / 2 + 0.05), 0.55, L * 0.9, 0.08, 0.08, POST); me.rotation.set(0, -hd, Math.atan2(1.6, L) * 0.8, 'YXZ'); }
    // flags at the lip: red and white
    for (const v of [-W / 2 - 0.3, W / 2 + 0.3]) { box(x0, z0, hd, L, v, 1.4, 0.06, 2.8, 0.06, lam(0xdddddd)); box(x0, z0, hd, L + 0.35, v, 2.45, 0.7, 0.45, 0.03, v < 0 ? RED : WHITE); }
    return { car: [x0 + 8, z0, hd] }; }
  // 3 · a concrete ramp on the meadow east of the pond, the jump west over the pond onto a landing ramp on its far bank
  function opt3() { const x0 = 49.5, z0 = -60, hd = Math.PI, W = 6, L = 8, LS = 27, LE = 34;
    prof(x0, z0, hd, W, [Object.assign([0, 0], { curve: 1.3 }), [L, 2.0]], { top: (s) => s > L - 0.45 ? HZ : CONC, side: () => CONC_S });
    prof(x0, z0, hd, W, [[LS, 1.5], [LE, 0]], { top: (s) => s < LS + 0.45 ? HZ : CONC, side: () => CONC_S });
    return { car: [x0 + 6.5, z0, hd] }; }
  // 4 · a stage on the meadow by the lane (up a ramp, a wooden deck, down a ramp), the deck full of things the car knocks over
  function opt4() { const d = [0.484, -0.875], hd = Math.atan2(d[1], d[0]), c = [64, -57], x0 = c[0] - d[0] * 10, z0 = c[1] - d[1] * 10, W = 7, R = 5, D0 = R, D1 = 20 - R, HT = 1.2;
    prof(x0, z0, hd, W, [[0, 0], [R, HT], [D1, HT], [20, 0]], { top: (s) => (s > D0 - 0.4 && s < D0) || (s > D1 && s < D1 + 0.4) ? HZ : s >= D0 && s <= D1 ? WOOD : ASPH, side: (s) => s >= D0 && s <= D1 ? SKIRT : ASPH_S });
    const yAt = (s, v) => { const fx = Math.cos(hd), fz = Math.sin(hd); return gr(x0 + fx * s, z0 + fz * s) + HT; };
    // the stuff: a pyramid of boxes, tyre stacks at the corners, cones along the edges, barrels, six big pins at the far end
    let k = 0; for (const [s, v, l] of [[9.6, -1.3, 0], [9.6, -0.42, 0], [9.6, 0.46, 0], [9.6, 1.34, 0], [9.6, -0.86, 1], [9.6, 0.02, 1], [9.6, 0.9, 1], [9.6, -0.42, 2], [9.6, 0.46, 2], [9.6, 0.02, 3]]) cardBox(x0, z0, hd, s, v, yAt(s, v) + l * 0.66, k++);
    for (const [s, v] of [[5.8, -2.8], [5.8, 2.8], [14.2, -2.8], [14.2, 2.8]]) tyres(x0, z0, hd, s, v, yAt(s, v), 3);
    for (let s = 7.2; s <= 12.8; s += 1.4) for (const v of [-3.0, 3.0]) cone(x0, z0, hd, s, v, yAt(s, v));
    for (const [s, v, m] of [[7.4, -1.6, BLUE], [7.4, 1.6, RED], [11.8, -1.7, RED], [11.8, 1.7, BLUE], [7.4, 0, YEL]]) barrel(x0, z0, hd, s, v, yAt(s, v), m);
    for (const [s, v] of [[12.6, 0], [13.4, -0.55], [13.4, 0.55], [14.2, -1.1], [14.2, 0], [14.2, 1.1]]) pin(x0, z0, hd, s, v, yAt(s, v));
    return { car: [x0 - d[0] * 6, z0 - d[1] * 6, hd] }; }
  const OPT = { 1: opt1, 2: opt2, 3: opt3, 4: opt4 };
  return {
    clear() { if (G) { Render.scene.remove(G); G.traverse(o => { if (o.geometry) o.geometry.dispose(); }); G = null; } },
    show(k) { this.clear(); G = new THREE.Group(); G.name = 'rampMock'; Render.scene.add(G); const r = OPT[k](); this.last = r; return r; },
  };
})();
'rm ok'
