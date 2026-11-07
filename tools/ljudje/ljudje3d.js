/* Predlogi »Ljudje ob progi«: nov model človeka (ločene noge in roke s komolci, oblačila po vlogah) in elementi okoli njih
   (avtodom, prikolica, šotori, ogenj, žar, TV, hiška, gradbeni oder, maršalska postaja, gasilsko vozilo, vhod s policijo, boksi).
   Samo za slike predlogov: THREE r128 (globalni), ploskovno senčenje kot v igri. window.LJ */
(function () {
  const TAU = Math.PI * 2;
  /* ---------------- materiali in geometrije ---------------- */
  const MC = new Map();
  const lam = (c, o) => { const k = 'l' + c + (o ? JSON.stringify(o) : ''); let m = MC.get(k); if (!m) MC.set(k, m = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}))); return m; };
  const bas = (c, o) => { const k = 'b' + c + (o ? JSON.stringify(o) : ''); let m = MC.get(k); if (!m) MC.set(k, m = new THREE.MeshBasicMaterial(Object.assign({ color: c }, o || {}))); return m; };
  const GC = new Map();
  const gBox = (w, h, d) => { const k = 'b' + w + ',' + h + ',' + d; let g = GC.get(k); if (!g) GC.set(k, g = new THREE.BoxGeometry(w, h, d)); return g; };
  const flat = (g) => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; };
  const gCyl = (rt, rb, h, seg) => { const k = 'c' + rt + ',' + rb + ',' + h + ',' + seg; let g = GC.get(k); if (!g) GC.set(k, g = flat(new THREE.CylinderGeometry(rt, rb, h, seg))); return g; };
  const gSph = (r, ws, hs, half) => { const k = 's' + r + ',' + ws + ',' + hs + ',' + half; let g = GC.get(k); if (!g) GC.set(k, g = flat(new THREE.SphereGeometry(r, ws, hs, 0, TAU, 0, half ? Math.PI / 2 : Math.PI))); return g; };
  // tapered box: bottom w x d, top wt x dt, height h; origin at the bottom centre
  const gTBox = (wb, wt, h, db, dt) => { const k = 't' + [wb, wt, h, db, dt]; let g = GC.get(k); if (g) return g;
    g = new THREE.BoxGeometry(1, 1, 1); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const top = p.getY(i) > 0; p.setXYZ(i, p.getX(i) * (top ? wt : wb), p.getY(i) * h + h / 2, p.getZ(i) * (top ? dt : db)); }
    g.computeVertexNormals(); GC.set(k, g); return g; };
  function mesh(g, m, x, y, z, o) {
    const e = new THREE.Mesh(g, m); e.position.set(x || 0, y || 0, z || 0);
    if (o) { if (o.rx) e.rotation.x = o.rx; if (o.ry) e.rotation.y = o.ry; if (o.rz) e.rotation.z = o.rz; if (o.order) e.rotation.order = o.order; if (o.s) e.scale.set(o.s[0], o.s[1], o.s[2]); }
    e.castShadow = !(o && o.noCast); e.receiveShadow = true; return e;
  }
  const M = (c, o) => (o && o.basic ? bas(c, o.mat) : lam(c, o && o.mat));
  const box = (w, h, d, c, x, y, z, o) => mesh(gBox(w, h, d), M(c, o), x, y, z, o);
  const tbox = (wb, wt, h, db, dt, c, x, y, z, o) => mesh(gTBox(wb, wt, h, db, dt), M(c, o), x, y, z, o);
  const cyl = (rt, rb, h, seg, c, x, y, z, o) => mesh(gCyl(rt, rb, h, seg), M(c, o), x, y, z, o);
  const sph = (r, ws, hs, c, x, y, z, o) => mesh(gSph(r, ws, hs, o && o.half), M(c, o), x, y, z, o);
  const grp = (...ch) => { const g = new THREE.Group(); for (const c of ch) if (c) g.add(c); return g; };
  const at = (o, x, y, z, ry) => { o.position.set(x, y, z); if (ry) o.rotation.y = ry; return o; };
  // a box between two points (rails, pipes, ropes)
  function bar(a, b, t, c, o) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
    const e = mesh(gBox(t, L, t), M(c, o), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    e.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L)); return e;
  }
  let rs = 1; const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; }; const seed = (s) => { rs = s; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];

  // canvas textures (TV picture, pit board, signs)
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
  const tvTex = () => canvasTex(256, 144, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#79a9d6'); g.addColorStop(0.42, '#cfe2f2'); g.addColorStop(0.43, '#4f7f3a'); g.addColorStop(1, '#335d27'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#4e545c'; x.beginPath(); x.moveTo(30, h); x.lineTo(120, 62); x.lineTo(150, 62); x.lineTo(240, h); x.fill();
    x.fillStyle = '#d8262a'; x.fillRect(118, 92, 36, 16); x.fillStyle = '#111'; x.fillRect(120, 104, 8, 6); x.fillRect(144, 104, 8, 6);
    x.fillStyle = 'rgba(10,12,18,.8)'; x.fillRect(6, 6, 64, 54); x.fillStyle = '#fff'; x.font = 'bold 11px Arial'; ['1   #12', '2   #7', '3   #31'].forEach((t, k) => x.fillText(t, 10, 20 + k * 15));
    x.fillStyle = '#d8262a'; x.fillRect(206, 8, 42, 18); x.fillStyle = '#fff'; x.fillText('LIVE', 213, 21);
  });
  const boardTex = (lines) => canvasTex(160, 128, (x, w, h) => { x.fillStyle = '#111317'; x.fillRect(0, 0, w, h); x.fillStyle = '#f2f2f2'; x.font = 'bold 34px Arial'; x.textAlign = 'center'; lines.forEach((t, k) => { x.fillStyle = k === 0 ? '#ffd23a' : '#f2f2f2'; x.fillText(t, w / 2, 36 + k * 40); }); });
  const signTex = (txt, bg, fg) => canvasTex(256, 64, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = '900 34px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 2, w - 12); });
  const texMat = (t, o) => new THREE.MeshLambertMaterial(Object.assign({ map: t }, o || {}));

  // a soft round puff for smoke and the fire's glow
  let puffT = null;
  const puffTex = () => puffT || (puffT = canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }));
  function smoke(n, h, col, op, spread) {   // a column of puffs: rising, growing, fading
    const g = new THREE.Group();
    for (let k = 0; k < n; k++) { const f = k / (n - 1), s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), color: col, transparent: true, opacity: op * (1 - f * 0.75), depthWrite: false, fog: true }));
      const sz = 0.5 + f * (spread || 2.2); s.scale.set(sz, sz, 1); s.position.set(Math.sin(k * 1.7) * 0.15 * f * 3 + f * 0.9, 0.3 + f * h, Math.cos(k * 2.3) * 0.12 * f * 3); g.add(s); }
    return g;
  }
  function glow(r, col, op) { const s = new THREE.Mesh(new THREE.CircleGeometry(r, 16), new THREE.MeshBasicMaterial({ map: puffTex(), color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })); s.rotation.x = -Math.PI / 2; s.position.y = 0.03; return s; }

  /* ---------------- človek ----------------
     1,78 m, obrnjen proti lokalni +z (levo +x). Sklepi: boki (višina, nagib), trup, glava, rame (z: vstran, x: naprej), komolci, kolki, kolena.
     o: shirt, pants, skin, hair ('short' | 'long' | 'bald' | 'pony'), hat ('cap' | 'helmet' | 'hard' | 'beanie' | 'police' | 'fire'), hatCol, long (rokavi),
     shorts, vest (barva odsevnega jopiča), stripes, shoes, gloves, scale, kid */
  const SKIN = [0xf1c9a5, 0xe0ac87, 0xc68b62, 0x8d5a3b, 0x5e3b26];
  const HAIR = [0x2a1d14, 0x4a2f1c, 0x7a5532, 0xb08850, 0x8a8a88, 0x15110e];
  const SHIRT = [0xd23a2c, 0x2f63c9, 0xf0c22e, 0xefefea, 0x2f9a48, 0xf07a1c, 0x262a33, 0x8a3b8c, 0x22848f, 0xb8bcc4, 0x7c4a2e, 0x31406e];
  const PANTS = [0x2f3f63, 0x1d1f25, 0x5b5040, 0x47494f, 0x6a6f78, 0x3a4a3a];
  function person(o) {
    o = o || {};
    const skin = o.skin != null ? o.skin : pick(SKIN), shirt = o.shirt != null ? o.shirt : pick(SHIRT), pants = o.pants != null ? o.pants : pick(PANTS);
    const hair = o.hairCol != null ? o.hairCol : pick(HAIR), shoes = o.shoes != null ? o.shoes : 0x24262b, long = !!o.long, hands = o.gloves != null ? o.gloves : skin;
    const root = new THREE.Group(), P = { root, o, sh: [], el: [], hand: [], hp: [], kn: [] };
    root.scale.setScalar((o.scale || 0.97) * (o.kid ? 0.62 : 1));
    const hips = P.hips = new THREE.Group(); hips.position.y = 0.92; root.add(hips);
    hips.add(box(0.33, 0.18, 0.2, pants, 0, 0, 0));
    const torso = P.torso = new THREE.Group(); torso.position.y = 0.06; hips.add(torso);
    torso.add(tbox(0.31, 0.41, 0.5, 0.2, 0.225, shirt, 0, -0.02, 0));
    if (o.vest != null) {   // a high-visibility vest over the shirt, two reflective bands
      torso.add(tbox(0.335, 0.43, 0.4, 0.225, 0.245, o.vest, 0, 0.04, 0));
      for (const y of [0.13, 0.27]) torso.add(tbox(0.345, 0.345 + (0.43 - 0.335) * (y + 0.035) / 0.4, 0.04, 0.235, 0.25, o.stripes != null ? o.stripes : 0xd9dde2, 0, y, 0, { mat: { emissive: 0x222222 } }));
    }
    if (o.belt) torso.add(box(0.33, 0.05, 0.215, o.belt, 0, 0.0, 0));
    torso.add(box(0.1, 0.08, 0.1, skin, 0, 0.53, 0));
    const head = P.head = new THREE.Group(); head.position.y = 0.56; torso.add(head);
    if (o.kid) head.scale.setScalar(1.22);
    head.add(tbox(0.19, 0.175, 0.23, 0.21, 0.2, skin, 0, 0, 0));
    const hs = o.hat ? null : (o.hair || pick(['short', 'short', 'short', 'long', 'bald', 'pony']));
    if (hs && hs !== 'bald') { head.add(box(0.205, 0.06, 0.215, hair, 0, 0.235, -0.005)); head.add(box(0.2, hs === 'long' ? 0.3 : 0.14, 0.045, hair, 0, hs === 'long' ? 0.1 : 0.165, -0.1));
      if (hs === 'pony') head.add(box(0.06, 0.16, 0.06, hair, 0, 0.12, -0.14)); }
    if (hs === 'bald') head.add(box(0.2, 0.05, 0.05, hair, 0, 0.12, -0.1));
    const hc = o.hatCol != null ? o.hatCol : pick(SHIRT);
    if (o.hat === 'cap') { head.add(box(0.205, 0.07, 0.22, hc, 0, 0.25, -0.005)); head.add(box(0.17, 0.02, 0.12, hc, 0, 0.225, 0.155)); }
    else if (o.hat === 'beanie') head.add(box(0.21, 0.11, 0.225, hc, 0, 0.225, -0.005));
    else if (o.hat === 'helmet' || o.hat === 'hard' || o.hat === 'fire') { head.add(sph(0.14, 8, 4, hc, 0, 0.16, 0, { half: true, s: [1, 0.85, 1.08] }));
      if (o.hat !== 'helmet') head.add(cyl(o.hat === 'fire' ? 0.2 : 0.165, o.hat === 'fire' ? 0.2 : 0.165, 0.02, 10, hc, 0, 0.165, o.hat === 'fire' ? -0.02 : 0.02));
      if (o.hat === 'fire') head.add(box(0.2, 0.06, 0.02, 0xd9dde2, 0, 0.21, 0.13)); }
    else if (o.hat === 'police') { head.add(cyl(0.125, 0.115, 0.08, 10, hc, 0, 0.255, 0)); head.add(cyl(0.135, 0.135, 0.02, 10, hc, 0, 0.3, 0)); head.add(box(0.17, 0.02, 0.1, 0x111111, 0, 0.22, 0.14)); head.add(box(0.25, 0.03, 0.25, 0xd9c35a, 0, 0.235, 0, { s: [0.95, 1, 0.95] })); }
    for (const sd of [1, -1]) {   // arms: shoulder, elbow, hand (attach point)
      const sh = new THREE.Group(); sh.position.set(sd * 0.245, 0.45, 0); torso.add(sh); sh.rotation.order = 'ZXY';
      if (long) sh.add(box(0.105, 0.3, 0.11, shirt, 0, -0.14, 0));
      else { sh.add(box(0.115, 0.13, 0.12, shirt, 0, -0.06, 0)); sh.add(box(0.088, 0.19, 0.095, skin, 0, -0.2, 0)); }
      if (o.vest != null && long) sh.add(box(0.11, 0.03, 0.115, o.stripes != null ? o.stripes : 0xd9dde2, 0, -0.2, 0));
      const el = new THREE.Group(); el.position.y = -0.29; sh.add(el);
      el.add(box(0.09, 0.24, 0.095, long ? shirt : skin, 0, -0.12, 0)); el.add(box(0.08, 0.09, 0.06, hands, 0, -0.285, 0));
      const hd = new THREE.Group(); hd.position.y = -0.3; el.add(hd);
      P.sh.push(sh); P.el.push(el); P.hand.push(hd);
    }
    for (const sd of [1, -1]) {   // legs: hip, knee
      const hp = new THREE.Group(); hp.position.set(sd * 0.09, -0.05, 0); hips.add(hp);
      hp.add(box(0.15, 0.43, 0.17, pants, 0, -0.2, 0));
      const kn = new THREE.Group(); kn.position.y = -0.41; hp.add(kn);
      kn.add(box(0.125, 0.38, 0.135, o.shorts ? skin : pants, 0, -0.19, 0)); kn.add(box(0.115, 0.09, 0.27, shoes, 0, -0.415, 0.045));
      P.hp.push(hp); P.kn.push(kn);
    }
    pose(P, 'stand');
    return P;
  }
  // items in a hand (the hand's local frame: the arm points down -y, the palm faces inwards, forwards is +z)
  function item(kind, o) {
    o = o || {};
    if (kind === 'phone') return grp(box(0.075, 0.14, 0.012, 0x15171c, 0, -0.05, 0.02));
    if (kind === 'cup') return grp(cyl(0.042, 0.036, 0.11, 7, o.c || 0xf2f2ee, 0, -0.03, 0.04));
    if (kind === 'can') return grp(cyl(0.033, 0.033, 0.12, 7, o.c || 0xc8c9cc, 0, -0.03, 0.04));
    if (kind === 'bottle') return grp(cyl(0.035, 0.038, 0.2, 7, o.c || 0x2f6b2a, 0, -0.04, 0.04), cyl(0.012, 0.02, 0.07, 6, o.c || 0x2f6b2a, 0, 0.09, 0.04));
    if (kind === 'tongs') return grp(bar([0, 0, 0.02], [0, -0.05, 0.4], 0.02, 0xb9bec6));
    if (kind === 'stick') return grp(bar([0, 0.05, 0.02], [0, -0.25, 1.05], 0.022, 0x8a6a45), cyl(0.024, 0.024, 0.12, 6, 0x9c4a2a, 0, -0.23, 1.0, { rx: 1.3 }));
    if (kind === 'flag') { const g = grp(cyl(0.015, 0.015, 1.5, 5, 0xdedede, 0, 0.55, 0.03)); const cs = o.cols || [0x15171c, 0xd8262a, 0xf2c21a];
      cs.forEach((c, k) => g.add(box(0.012, 0.6 / cs.length, 0.9, c, 0, 1.2 - k * 0.6 / cs.length, 0.48, { rz: 0 }))); return g; }
    if (kind === 'mflag') { const g = grp(cyl(0.013, 0.013, 0.9, 5, 0x5c4630, 0, 0.3, 0.03)); g.add(box(0.012, 0.5, 0.65, o.c || 0xf5d21a, 0, 0.55, 0.36)); if (o.c2) g.add(box(0.014, 0.25, 0.65, o.c2, 0, 0.675, 0.36)); return g; }
    if (kind === 'broom') return grp(bar([0, 0.25, 0.02], [0, -0.85, 0.32], 0.028, 0xa07a4a), box(0.42, 0.07, 0.1, 0x3a3027, 0, -0.9, 0.34, { rx: 0.27 }));
    if (kind === 'axe') return grp(bar([0, 0.1, 0.02], [0, -0.62, 0.1], 0.035, 0x9a7546), box(0.04, 0.15, 0.2, 0x8f949b, 0, -0.62, 0.17));
    if (kind === 'camera') return grp(box(0.14, 0.11, 0.11, 0x1b1d22, 0, 0.0, 0.08), cyl(0.05, 0.055, 0.4, 8, o.c || 0xd9dbd7, 0, 0.0, 0.33, { rx: Math.PI / 2 }));
    if (kind === 'ext') return grp(cyl(0.08, 0.08, 0.48, 8, 0xc81f1a, 0, -0.27, 0.03), cyl(0.03, 0.03, 0.06, 6, 0x111111, 0, -0.01, 0.03));
    if (kind === 'radio') return grp(box(0.06, 0.15, 0.04, 0x15171c, 0, -0.02, 0.03), cyl(0.008, 0.008, 0.12, 4, 0x15171c, 0.02, 0.1, 0.03));
    if (kind === 'tire') return grp(cyl(0.33, 0.33, 0.27, 12, 0x17181b, 0, -0.08, 0.3, { rz: Math.PI / 2 }), cyl(0.2, 0.2, 0.28, 10, 0x9ea3aa, 0, -0.08, 0.3, { rz: Math.PI / 2 }));
    if (kind === 'board') { const m = texMat(boardTex(o.lines || ['P3', 'L 4', '+1.2'])); const g = grp(bar([0, 0.05, 0.02], [0, 0.1, 1.2], 0.03, 0x9ea3aa)); const b = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), m); b.position.set(0, 0.32, 1.3); b.rotation.set(0, -Math.PI / 2, 0); g.add(b); return g; }
    if (kind === 'baton') return grp(cyl(0.02, 0.02, 0.45, 5, 0xf2f2f2, 0, -0.03, 0.2, { rx: 1.4 }), cyl(0.021, 0.021, 0.1, 5, 0xd8262a, 0, -0.04, 0.38, { rx: 1.4 }));
    if (kind === 'plate') return grp(cyl(0.12, 0.1, 0.02, 9, 0xf4f4f0, 0, -0.04, 0.13), cyl(0.025, 0.025, 0.14, 6, 0x9c4a2a, 0, -0.025, 0.13, { rz: Math.PI / 2 }));
    if (kind === 'ball') return grp(sph(0.11, 6, 4, 0xf4f4f0, 0, -0.12, 0.05));
    if (kind === 'wood') return grp(cyl(0.07, 0.07, 0.55, 6, 0x7a5a3a, 0, -0.08, 0.15, { rz: Math.PI / 2 }));
    if (kind === 'crate') return grp(box(0.42, 0.28, 0.32, o.c || 0xe0b020, 0, -0.12, 0.22));
    if (kind === 'horn') return grp(cyl(0.035, 0.035, 0.16, 6, 0xd8262a, 0, 0.0, 0.05), cyl(0.07, 0.02, 0.18, 8, 0xf2f2f2, 0, 0.16, 0.05));
    if (kind === 'hose') return grp(cyl(0.035, 0.035, 0.5, 6, 0x9a9da3, 0, -0.05, 0.25, { rx: 1.45 }), cyl(0.04, 0.03, 0.12, 6, 0xc81f1a, 0, -0.06, 0.52, { rx: 1.45 }));
    if (kind === 'clip') return grp(box(0.22, 0.3, 0.02, 0x8f6a3c, 0, -0.06, 0.08, { rx: 0.8 }), box(0.18, 0.24, 0.022, 0xf4f4f0, 0, -0.06, 0.081, { rx: 0.8 }));
    if (kind === 'bag') return grp(box(0.32, 0.3, 0.14, o.c || 0x2a3d6b, 0, -0.22, 0.02));
    if (kind === 'wrench') return grp(box(0.03, 0.03, 0.3, 0xb9bec6, 0, -0.04, 0.15));
    if (kind === 'gun') return grp(box(0.07, 0.16, 0.1, 0x111111, 0, -0.05, 0.04), cyl(0.04, 0.04, 0.22, 6, 0xd8262a, 0, 0.0, 0.18, { rx: Math.PI / 2 }));
    return grp();
  }
  function hold(P, side, kind, o) { const it = item(kind, o); P.hand[side].add(it); return it; }   // side 0 left, 1 right

  /* ---------------- poze ----------------
     sh: rama [vstran, naprej] (z: + navzven, x: naprej), el: komolec (+ pokrči naprej), hp: kolk (+ noga naprej), kn: koleno (+ pokrči nazaj),
     hy: višina bokov, lean: trup naprej, look: glava levo/desno, tw: trup okoli navpične osi */
  function setJ(P, J) {
    const s = (a, i, d) => (a ? a[i] : d);
    for (let i = 0; i < 2; i++) {
      const sd = i === 0 ? 1 : -1, sh = P.sh[i];
      sh.rotation.z = sd * s(J.shz, i, 0.07); sh.rotation.x = -s(J.shx, i, 0); sh.rotation.y = sd * s(J.shy, i, 0);
      P.el[i].rotation.x = -s(J.el, i, 0.08); P.el[i].rotation.y = 0;
      P.hp[i].rotation.x = -s(J.hp, i, 0); P.hp[i].rotation.z = sd * s(J.hpz, i, 0);
      P.kn[i].rotation.x = s(J.kn, i, 0);
    }
    P.hips.position.y = J.hy != null ? J.hy : 0.92; P.hips.position.z = J.hz || 0; P.hips.rotation.x = J.hrx || 0;
    P.torso.rotation.x = J.lean || 0; P.torso.rotation.y = J.tw || 0; P.torso.rotation.z = J.tz || 0;
    P.head.rotation.y = J.look || 0; P.head.rotation.x = J.nod || 0;
    P.root.position.y = P.y0 + (J.dy || 0);
  }
  function pose(P, name, t) {
    t = t || 0; if (P.y0 == null) P.y0 = P.root.position.y;
    const s = Math.sin(t), c = Math.cos(t);
    const J = {
      stand: { shz: [0.07, 0.09] },
      relax: { shz: [0.1, 0.12], el: [0.25, 0.3], hpz: [0.05, 0.05] },
      walk: { hp: [0.42 * s, -0.42 * s], kn: [Math.max(0, -s) * 0.7 + 0.1, Math.max(0, s) * 0.7 + 0.1], shx: [-0.35 * s, 0.35 * s], el: [0.35, 0.35], lean: 0.05, hy: 0.9 },
      run: { hp: [0.85 * s, -0.85 * s], kn: [0.25 + Math.max(0, -s) * 1.5, 0.25 + Math.max(0, s) * 1.5], shx: [-0.75 * s, 0.75 * s], shz: [0.12, 0.12], el: [1.45, 1.45], lean: 0.32, hy: 0.86, dy: 0.06 },
      cheer: { shz: [2.55 + 0.1 * s, 2.6 - 0.1 * s], shx: [0.25, 0.25], el: [0.25, 0.3], dy: 0.04 * Math.max(0, s) },
      jump: { shz: [2.75, 2.7], shx: [0.15, 0.15], el: [0.15, 0.2], hp: [0.35, 0.1], kn: [0.6, 0.3], dy: 0.22 },
      wave: { shz: [0.1, 2.35 + 0.25 * s], shx: [0, 0.2], el: [0.2, 0.55] },
      wave2: { shz: [2.3 + 0.25 * s, 0.1], shx: [0.2, 0], el: [0.55, 0.2] },
      point: { shz: [0.1, 1.45], shx: [0, 0.35], el: [0.1, 0.05] },
      phone: { shz: [0.25, 0.25], shx: [1.25, 1.25], el: [1.1, 1.1], shy: [-0.35, -0.35], nod: 0.1 },
      phoneUp: { shz: [0.3, 0.3], shx: [1.75, 1.75], el: [0.65, 0.65], shy: [-0.3, -0.3] },
      fence: { shz: [0.18, 0.18], shx: [0.95, 0.95], el: [1.35, 1.35], lean: 0.32, hy: 0.9 },
      fenceWave: { shz: [0.18, 2.4 + 0.25 * s], shx: [0.95, 0.2], el: [1.35, 0.5], lean: 0.2, hy: 0.91 },
      sit: { hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: -0.08, shz: [0.12, 0.12], shx: [0.35, 0.35], el: [0.9, 0.9] },
      sitDrink: { hy: 0.5, hp: [1.5, 1.45], kn: [1.45, 1.5], lean: -0.1, shz: [0.12, 0.2], shx: [0.35, 0.55], el: [0.9, 2.2] },
      sitLean: { hy: 0.5, hp: [1.45, 1.55], kn: [1.4, 1.45], lean: 0.25, shz: [0.1, 0.1], shx: [0.75, 0.75], el: [1.0, 1.0] },
      sitStick: { hy: 0.5, hp: [1.5, 1.5], kn: [1.45, 1.45], lean: 0.12, shz: [0.15, 0.1], shx: [0.4, 1.1], el: [0.9, 0.3] },
      sitGround: { hy: 0.14, hp: [1.45, 1.45], kn: [0.25, 0.25], lean: -0.15, shz: [0.2, 0.2], shx: [-0.45, -0.45], el: [0.1, 0.1] },
      sofa: { hy: 0.5, hp: [1.45, 1.45], kn: [1.4, 1.4], lean: -0.22, shz: [0.15, 0.15], shx: [0.25, 0.25], el: [1.0, 1.0] },
      squat: { hy: 0.5, hp: [1.75, 1.75], kn: [2.1, 2.1], lean: 0.45, shx: [1.5, 1.5], shz: [0.08, 0.08], el: [0.05, 0.05], hz: -0.15 },
      kneel: { hy: 0.52, hp: [1.45, -0.15], kn: [1.5, 1.6], lean: 0.12, shx: [1.2, 1.2], el: [1.2, 1.2], shy: [-0.3, -0.3], hz: -0.05 },
      crouchCam: { hy: 0.55, hp: [1.6, 0.1], kn: [1.9, 1.75], lean: 0.25, shx: [1.35, 1.35], el: [1.35, 1.35], shy: [-0.3, -0.3], hz: -0.1 },
      jack0: { shz: [2.75, 2.75], hpz: [0.32, 0.32], dy: 0.05 },
      jack1: { shz: [0.15, 0.15], hpz: [0.02, 0.02] },
      stretch: { shz: [2.9, 2.9], tz: 0.3, hpz: [0.15, 0.15] },
      grill: { shz: [0.2, 0.15], shx: [0.25, 0.95], el: [0.6, 0.65], lean: 0.12, shy: [0, -0.1] },
      sweep: { shz: [0.1, 0.1], shx: [0.75, 0.45], el: [0.6, 0.35], lean: 0.28, hy: 0.88 },
      chopUp: { shz: [0.15, 0.15], shx: [2.6, 2.6], el: [0.5, 0.5], lean: -0.1, shy: [-0.3, -0.3], hpz: [0.12, 0.12] },
      chopDown: { shz: [0.1, 0.1], shx: [0.9, 0.9], el: [0.15, 0.15], lean: 0.5, shy: [-0.3, -0.3], hpz: [0.12, 0.12], hy: 0.88 },
      carry: { shz: [0.1, 0.1], shx: [0.75, 0.75], el: [1.05, 1.05], shy: [-0.3, -0.3], lean: -0.05 },
      carryWalk: { hp: [0.4 * s, -0.4 * s], kn: [Math.max(0, -s) * 0.7 + 0.1, Math.max(0, s) * 0.7 + 0.1], shz: [0.1, 0.1], shx: [0.75, 0.75], el: [1.05, 1.05], shy: [-0.3, -0.3], hy: 0.9 },
      push: { hp: [0.45, -0.35], kn: [0.2, 0.6], shz: [0.1, 0.1], shx: [1.05, 1.05], el: [0.5, 0.5], lean: 0.32, hy: 0.88 },
      arms: { shz: [0.22, 0.22], shx: [0.55, 0.55], el: [1.95, 1.95], shy: [-0.75, -0.75] },
      hips: { shz: [0.55, 0.55], shx: [-0.15, -0.15], el: [1.4, 1.4], shy: [0.6, 0.6] },
      drink: { shz: [0.1, 0.2], shx: [0, 0.55], el: [0.1, 2.25] },
      talk: { shz: [0.1, 0.18], shx: [0.15, 0.6], el: [0.35, 1.35], look: 0.2 },
      radio: { shz: [0.1, 0.2], shx: [0.1, 0.5], el: [0.2, 2.35], look: 0 },
      thumbs: { shz: [0.1, 0.3], shx: [0, 0.85], el: [0.1, 1.35] },
      flagWave: { shz: [0.12, 2.0 + 0.4 * s], shx: [0.3, 0.6], el: [0.4, 0.45], lean: 0.05 },
      flagHold: { shz: [0.1, 0.5], shx: [0.0, 1.0], el: [0.1, 0.4] },
      direct: { shz: [1.45, 0.25], shx: [0.15, 0.4], el: [0.05, 1.1] },
      cam: { shz: [0.15, 0.2], shx: [1.25, 1.2], el: [1.3, 1.35], shy: [-0.35, -0.3] },
      pushup0: { hy: 0.92, hrx: 0, shx: [1.55, 1.55], shz: [0.25, 0.25], el: [0.1, 0.1] },
      boardOut: { shz: [0.2, 0.25], shx: [1.2, 1.35], el: [0.2, 0.25], lean: 0.35, hy: 0.9 },
      lieBack: { hy: 0.12, hrx: -1.45, hp: [1.45, 1.45], kn: [0.05, 0.05], shz: [0.3, 0.3], el: [0.2, 0.2] },
      hang: { shz: [2.9, 2.9], shx: [0.15, 0.15], el: [0.55, 0.55], hp: [0.2, 0.25], kn: [0.6, 0.7] },
      lie: { shz: [0.35, 0.2], shx: [-0.2, 2.4], el: [0.3, 1.6], hp: [0.05, 0.25], kn: [0.05, 0.5] },
      bend: { lean: 0.95, hy: 0.89, shx: [1.1, 1.15], shz: [0.1, 0.1], el: [0.3, 0.35], hz: -0.08 },
    }[name] || {};
    setJ(P, J); P.poseName = name;
    return P;
  }
  // a person placed at (x, z) of a parent frame, facing yaw (0: +z)
  function put(parent, P, x, y, z, yaw) { P.root.position.set(x, y, z); P.root.rotation.y = yaw || 0; P.y0 = y; parent.add(P.root); setJ(P, {}); return P; }

  /* ---------------- elementi ---------------- */
  const WHITE = 0xf1f0ea, DARKG = 0x20252c, TYRE = 0x16171a;
  const wheel = (r, w, x, y, z) => grp(cyl(r, r, w, 10, TYRE, x, y, z, { rx: Math.PI / 2 }), cyl(r * 0.55, r * 0.55, w + 0.02, 8, 0xb9bec6, x, y, z, { rx: Math.PI / 2 }));
  function motorhome(col) {   // along x (front +x), door side +z; awning out over +z
    const g = new THREE.Group();
    g.add(box(6.2, 2.45, 2.35, WHITE, -0.45, 1.68, 0)); g.add(box(6.24, 0.3, 2.39, col, -0.45, 1.05, 0)); g.add(box(6.24, 0.1, 2.39, col, -0.45, 1.3, 0));
    g.add(box(1.3, 1.25, 2.3, WHITE, 3.25, 1.05, 0)); g.add(box(1.25, 0.82, 2.36, WHITE, 2.95, 2.5, 0));   // cab and the alcove over it
    g.add(box(0.06, 0.62, 2.0, 0x2a3440, 3.92, 1.45, 0, { rz: -0.35 })); g.add(box(0.5, 0.45, 0.04, 0x2a3440, 3.3, 1.42, 1.17)); g.add(box(0.5, 0.45, 0.04, 0x2a3440, 3.3, 1.42, -1.17));
    g.add(box(0.3, 0.35, 2.2, DARKG, 3.95, 0.55, 0)); g.add(box(0.1, 0.12, 0.35, 0xf6f2dc, 3.92, 0.72, 0.85, { basic: true })); g.add(box(0.1, 0.12, 0.35, 0xf6f2dc, 3.92, 0.72, -0.85, { basic: true }));
    for (const [x, w] of [[1.4, 1.0], [-1.6, 1.3], [-3.0, 0.8]]) g.add(box(w, 0.6, 0.04, 0x2a3440, x, 2.05, 1.19));
    g.add(box(0.72, 1.85, 0.04, 0xdadad4, 0.0, 1.4, 1.19)); g.add(box(0.4, 0.35, 0.05, 0x2a3440, 0.0, 1.95, 1.2));
    g.add(box(0.85, 0.28, 0.65, 0xdcdcd6, -1.6, 3.05, 0)); g.add(box(0.6, 0.12, 0.6, 0x9aa0a8, 1.1, 2.97, 0.4));
    for (const x of [2.55, -2.2]) for (const z of [1.08, -1.08]) g.add(wheel(0.38, 0.26, x, 0.38, z));
    // the awning: roller, striped canopy sloping out and down, two legs; a mat under it
    g.add(cyl(0.08, 0.08, 4.2, 6, 0xdcdcd6, -0.8, 2.85, 1.24, { rz: Math.PI / 2 }));
    const stripes = 6; for (let k = 0; k < stripes; k++) g.add(box(4.2 / stripes, 0.04, 2.5, k % 2 ? 0xf2efe6 : col, -0.8 - 2.1 + (k + 0.5) * 4.2 / stripes, 2.62, 2.45, { rx: 0.18 }));
    g.add(box(4.2, 0.18, 0.04, col, -0.8, 2.36, 3.68));
    for (const x of [-2.75, 1.15]) g.add(cyl(0.025, 0.025, 2.36, 5, 0xc9ccd2, x, 1.18, 3.62));
    g.add(box(3.6, 0.02, 2.2, 0x4f6b55, -0.8, 0.02, 2.5, { noCast: true }));
    g.add(bar([-3.56, 0.2, 0.7], [-3.56, 2.9, 0.7], 0.04, 0xa9adb3)); g.add(bar([-3.56, 0.2, 0.35], [-3.56, 2.9, 0.35], 0.04, 0xa9adb3));
    return g;
  }
  function car(col, o) {   // a simple hatchback along x (front +x)
    o = o || {}; const g = new THREE.Group(), L = o.L || 4.2;
    g.add(box(L, 0.62, 1.78, col, 0, 0.62, 0)); g.add(box(L * 0.52, 0.56, 1.6, col, -L * 0.08, 1.2, 0));
    g.add(box(L * 0.5, 0.42, 1.62, 0x27313c, -L * 0.08, 1.2, 0, { s: [1.01, 1, 1] })); g.add(box(0.05, 0.45, 1.45, 0x27313c, L * 0.2, 1.15, 0, { rz: -0.6 }));
    for (const x of [L * 0.32, -L * 0.32]) for (const z of [0.82, -0.82]) g.add(wheel(0.33, 0.22, x, 0.33, z));
    g.add(box(0.06, 0.12, 0.3, 0xf6f2dc, L / 2, 0.75, 0.6, { basic: true })); g.add(box(0.06, 0.12, 0.3, 0xf6f2dc, L / 2, 0.75, -0.6, { basic: true }));
    g.add(box(0.06, 0.12, 0.25, 0xb01515, -L / 2, 0.78, 0.65)); g.add(box(0.06, 0.12, 0.25, 0xb01515, -L / 2, 0.78, -0.65));
    if (o.bar) { g.add(box(0.3, 0.12, 1.2, 0x15171c, -0.1, 1.53, 0)); g.add(box(0.28, 0.1, 0.5, o.bar, -0.1, 1.62, 0.3, { basic: true })); g.add(box(0.28, 0.1, 0.5, o.bar2 || o.bar, -0.1, 1.62, -0.3, { basic: true })); }
    if (o.stripe) g.add(box(L + 0.02, 0.16, 1.8, o.stripe, 0, 0.7, 0));
    return g;
  }
  function caravan(col) {   // along x (drawbar +x), door +z
    const g = new THREE.Group();
    g.add(box(4.6, 1.95, 2.2, 0xf3f2ec, 0, 1.4, 0)); g.add(tbox(2.2, 1.6, 0.6, 1.95, 1.4, 0xf3f2ec, 2.55, 1.4 - 0.97, 0, { rz: Math.PI / 2, s: [1, 1, 1] }));
    g.add(box(4.62, 0.22, 2.22, col, 0, 0.75, 0)); g.add(box(4.62, 0.08, 2.22, col, 0, 0.95, 0));
    g.add(box(1.4, 0.55, 0.04, 0x2a3440, -1.0, 1.65, 1.11)); g.add(box(0.9, 0.55, 0.04, 0x2a3440, 1.2, 1.65, 1.11)); g.add(box(0.04, 0.5, 1.5, 0x2a3440, 2.75, 1.6, 0));
    g.add(box(0.62, 1.7, 0.04, 0xdcdcd4, 0.25, 1.3, 1.12)); g.add(box(0.55, 0.12, 0.6, 0x9aa0a8, -0.6, 2.42, 0));
    g.add(wheel(0.33, 0.22, -0.2, 0.33, 1.13)); g.add(wheel(0.33, 0.22, -0.2, 0.33, -1.13));
    g.add(bar([2.3, 0.45, 0.8], [3.6, 0.4, 0.05], 0.08, 0x2c2f35)); g.add(bar([2.3, 0.45, -0.8], [3.6, 0.4, -0.05], 0.08, 0x2c2f35)); g.add(cyl(0.05, 0.05, 0.45, 6, 0x2c2f35, 3.3, 0.22, 0));
    return g;
  }
  function tentDome(col, r) { r = r || 1.35; const g = new THREE.Group(); g.add(sph(r, 7, 3, col, 0, 0, 0, { half: true, s: [1, 0.78, 1.15] })); g.add(box(0.7, 0.75, 0.05, 0x2b2f36, 0, 0.38, r * 1.12, { rx: -0.35 })); return g; }
  function tentRidge(col) { const g = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-1.0, 0); sh.lineTo(1.0, 0); sh.lineTo(0, 1.3); sh.lineTo(-1.0, 0);
    const geo = flat(new THREE.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: false })); const m = new THREE.Mesh(geo, lam(col)); m.position.z = -1.2; m.castShadow = m.receiveShadow = true; g.add(m);
    const d = new THREE.Shape(); d.moveTo(-0.45, 0); d.lineTo(0.45, 0); d.lineTo(0, 0.9); const dm = new THREE.Mesh(new THREE.ShapeGeometry(d), lam(0x2b2f36)); dm.position.z = 1.21; g.add(dm); return g; }
  function gazebo(col, w) { w = w || 3; const g = new THREE.Group(), h = w / 2;
    for (const [x, z] of [[h, h], [h, -h], [-h, h], [-h, -h]]) g.add(cyl(0.03, 0.03, 2.1, 5, 0xd2d5da, x, 1.05, z));
    g.add(cyl(0.02, w * 0.71, 0.75, 4, col, 0, 2.47, 0, { ry: Math.PI / 4 }));
    for (const [x, z, rw, rd] of [[0, h, w, 0.03], [0, -h, w, 0.03], [h, 0, 0.03, w], [-h, 0, 0.03, w]]) g.add(box(rw, 0.25, rd, col, x, 2.0, z));
    return g; }
  function campfire() {
    const g = new THREE.Group();
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; g.add(mesh(flat(new THREE.DodecahedronGeometry(0.16, 0)), lam(k % 2 ? 0x8b8d90 : 0x6f7276), Math.cos(a) * 0.62, 0.08, Math.sin(a) * 0.62, { s: [1.2, 0.7, 1] })); }
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; g.add(bar([Math.cos(a) * 0.45, 0.05, Math.sin(a) * 0.45], [Math.cos(a) * 0.05, 0.42, Math.sin(a) * 0.05], 0.09, 0x5a3c24)); }
    g.add(cyl(0.38, 0.4, 0.04, 9, 0x24201c, 0, 0.02, 0, { noCast: true }));
    for (const [x, z, h, r, c] of [[0, 0, 0.85, 0.22, 0xff7a1a], [0.12, 0.06, 0.6, 0.15, 0xffb030], [-0.1, -0.05, 0.55, 0.14, 0xffd23a], [0.02, -0.12, 0.42, 0.12, 0xfff0a0]]) g.add(cyl(0.0, r, h, 5, c, x, 0.25 + h / 2, z, { basic: true, noCast: true }));
    g.add(glow(2.4, 0xff8a30, 0.55));
    const sm = smoke(9, 7, 0x8c8f94, 0.55, 3.2); sm.position.y = 0.6; g.add(sm);
    return g;
  }
  function logBench(L) { const g = new THREE.Group(); g.add(cyl(0.19, 0.2, L || 1.7, 7, 0x6b4a2e, 0, 0.19, 0, { rz: Math.PI / 2 })); g.add(cyl(0.16, 0.16, (L || 1.7) + 0.02, 7, 0xb08a5a, 0, 0.19, 0, { rz: Math.PI / 2, s: [1, 1, 1] })); return g; }
  function grillKettle() { const g = new THREE.Group();
    g.add(sph(0.3, 8, 3, 0x1b1c1f, 0, 0.78, 0, { half: true, rx: Math.PI }));
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; g.add(bar([Math.cos(a) * 0.22, 0.6, Math.sin(a) * 0.22], [Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36], 0.03, 0x2a2b2f)); }
    g.add(cyl(0.29, 0.29, 0.02, 10, 0x7a7d82, 0, 0.79, 0)); for (let k = -2; k <= 2; k++) g.add(cyl(0.028, 0.028, 0.18, 6, 0x9c3a22, k * 0.09, 0.82, 0.02, { rx: Math.PI / 2 }));
    const lid = sph(0.3, 8, 3, 0x1b1c1f, 0.32, 0.86, -0.16, { half: true, rz: -1.4 }); g.add(lid);
    const sm = smoke(7, 4.5, 0xb9bcc0, 0.6, 2.0); sm.position.y = 0.8; g.add(sm); return g; }
  function table(w, d, o) { w = w || 1.2; d = d || 0.7; o = o || {}; const g = new THREE.Group();
    g.add(box(w, 0.04, d, o.top || 0xe8e6de, 0, 0.72, 0)); for (const [x, z] of [[w / 2 - 0.06, d / 2 - 0.06], [-(w / 2 - 0.06), d / 2 - 0.06], [w / 2 - 0.06, -(d / 2 - 0.06)], [-(w / 2 - 0.06), -(d / 2 - 0.06)]]) g.add(cyl(0.015, 0.015, 0.72, 4, 0xa8acb2, x, 0.36, z));
    if (o.things !== false) { g.add(cyl(0.035, 0.038, 0.24, 6, 0x2f6b2a, -0.3, 0.86, 0.1)); g.add(cyl(0.035, 0.038, 0.24, 6, 0x6b3f1a, -0.2, 0.86, -0.12)); g.add(cyl(0.12, 0.1, 0.02, 9, 0xf4f4f0, 0.15, 0.75, 0.05)); g.add(cyl(0.12, 0.1, 0.02, 9, 0xf4f4f0, 0.42, 0.75, -0.1)); g.add(cyl(0.04, 0.04, 0.18, 6, 0xc8201c, 0.0, 0.83, -0.2)); g.add(cyl(0.16, 0.1, 0.1, 9, 0xe9c46a, 0.3, 0.79, 0.18)); }
    return g; }
  function chair(col) { const g = new THREE.Group();
    g.add(box(0.5, 0.05, 0.46, col, 0, 0.44, 0)); g.add(box(0.5, 0.55, 0.05, col, 0, 0.74, -0.25, { rx: -0.18 }));
    for (const [x, z] of [[0.23, 0.2], [-0.23, 0.2], [0.23, -0.2], [-0.23, -0.2]]) g.add(bar([x, 0, z], [x * 0.95, 0.44, -z * 0.7], 0.025, 0x2a2c31));
    for (const x of [0.27, -0.27]) g.add(box(0.05, 0.04, 0.42, 0x2a2c31, x, 0.62, 0)); return g; }
  const cooler = (col) => grp(box(0.62, 0.36, 0.4, col || 0x2f63c9, 0, 0.18, 0), box(0.64, 0.07, 0.42, WHITE, 0, 0.39, 0));
  function crates(n, cols) { const g = new THREE.Group(); cols = cols || [0xe0b020, 0xc8201c, 0x2f7a3a, 0x6b4a2e]; for (let k = 0; k < n; k++) g.add(box(0.42, 0.3, 0.32, cols[k % cols.length], (k % 2) * 0.44, 0.15 + Math.floor(k / 2) * 0.31, 0)); return g; }
  function tvSet() { const g = new THREE.Group();
    g.add(crates(2, [0x6b4a2e, 0x6b4a2e])); g.children[0].position.x = -0.22;
    g.add(box(1.25, 0.75, 0.08, 0x111214, 0, 0.32 + 0.38 + 0.3, 0)); const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.65), new THREE.MeshBasicMaterial({ map: tvTex() })); scr.position.set(0, 1.0, 0.045); g.add(scr);
    g.add(box(0.3, 0.06, 0.2, 0x111214, 0, 0.62, 0)); return g; }
  function sofa(col) { const g = new THREE.Group();
    g.add(box(1.9, 0.42, 0.85, col, 0, 0.21, 0)); g.add(box(1.9, 0.55, 0.22, col, 0, 0.62, -0.32)); for (const x of [0.86, -0.86]) g.add(box(0.2, 0.62, 0.86, col, x, 0.31, 0));
    for (const x of [-0.45, 0.45]) g.add(box(0.82, 0.1, 0.62, col + 0x0a0a0a > 0xffffff ? col : col + 0x080808, x, 0.46, 0.08)); return g; }
  const generator = () => grp(box(0.62, 0.42, 0.45, 0xd8262a, 0, 0.21, 0), box(0.66, 0.04, 0.49, 0x2a2c31, 0, 0.44, 0), cyl(0.06, 0.06, 0.12, 6, 0x2a2c31, 0.2, 0.5, 0.1));
  function satDish() { const g = new THREE.Group(); g.add(cyl(0.03, 0.03, 1.4, 5, 0x9aa0a8, 0, 0.7, 0)); g.add(cyl(0.38, 0.06, 0.12, 10, 0xe9e9e4, 0, 1.45, 0.12, { rx: 1.1 })); return g; }
  const mat = (col) => box(1.75, 0.012, 0.6, col, 0, 0.006, 0, { noCast: true });
  const boombox = () => grp(box(0.46, 0.26, 0.16, 0x23262c, 0, 0.13, 0), cyl(0.07, 0.07, 0.02, 9, 0x5b6068, -0.13, 0.13, 0.08, { rx: Math.PI / 2 }), cyl(0.07, 0.07, 0.02, 9, 0x5b6068, 0.13, 0.13, 0.08, { rx: Math.PI / 2 }));
  // a small house: walls along x (w) and z (d), the road side +z; finn: red boards with white corners
  function house(o) {
    o = o || {}; const g = new THREE.Group(), w = o.w || 6.4, d = o.d || 5, h = o.h || 2.9, wc = o.wall || 0x9b2c22, tc = o.trim || 0xf2f0ea, rc = o.roof || 0x2b2d31;
    g.add(box(w, 0.35, d, 0x6f6a62, 0, 0.17, 0)); g.add(box(w, h, d, wc, 0, 0.35 + h / 2, 0));
    for (const [x, z] of [[w / 2, d / 2], [-w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]]) g.add(box(0.16, h, 0.16, tc, x, 0.35 + h / 2, z));
    const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.45, 0); sh.lineTo(d / 2 + 0.45, 0); sh.lineTo(0, d * 0.42); sh.lineTo(-d / 2 - 0.45, 0);
    const rg = flat(new THREE.ExtrudeGeometry(sh, { depth: w + 0.7, bevelEnabled: false })); const rf = new THREE.Mesh(rg, lam(rc)); rf.rotation.y = Math.PI / 2; rf.position.set(-w / 2 - 0.35, 0.35 + h, 0); rf.castShadow = rf.receiveShadow = true; g.add(rf);
    const gs = new THREE.Shape(); gs.moveTo(-d / 2, 0); gs.lineTo(d / 2, 0); gs.lineTo(0, d * 0.38); const gg = new THREE.ShapeGeometry(gs);
    for (const x of [w / 2 + 0.01, -w / 2 - 0.01]) { const gm = new THREE.Mesh(gg, lam(wc)); gm.rotation.y = Math.PI / 2; gm.position.set(x, 0.35 + h, 0); g.add(gm); }
    for (const x of o.win || [-1.8, 1.6]) { g.add(box(1.15, 1.05, 0.08, tc, x, 0.35 + h * 0.55, d / 2 + 0.02)); g.add(box(0.95, 0.85, 0.09, o.glass || 0x34404c, x, 0.35 + h * 0.55, d / 2 + 0.02)); g.add(box(0.06, 0.85, 0.1, tc, x, 0.35 + h * 0.55, d / 2 + 0.02)); }
    g.add(box(0.95, 2.0, 0.08, o.door || 0x6b4a2e, -0.1, 0.35 + 1.0, d / 2 + 0.03)); g.add(box(1.6, 0.08, 1.2, rc, -0.1, 0.35 + 2.25, d / 2 + 0.55, { rx: 0.15 })); g.add(box(1.4, 0.2, 1.1, 0x8a8478, -0.1, 0.1, d / 2 + 0.55));
    if (o.chimney !== false) { g.add(box(0.5, 1.6, 0.5, o.chimCol || 0x6f6a62, w * 0.25, 0.35 + h + d * 0.25, -d * 0.12)); const sm = smoke(7, 6, 0xc9ccd0, 0.5, 2.6); sm.position.set(w * 0.25, 0.35 + h + d * 0.25 + 0.8, -d * 0.12); g.add(sm); }
    return g;
  }
  function picketFence(L, col, o) { o = o || {}; const g = new THREE.Group(), n = Math.round(L / 0.16); col = col || 0xf2f0ea;
    g.add(box(L, 0.07, 0.04, col, 0, 0.35, 0)); g.add(box(L, 0.07, 0.04, col, 0, 0.8, 0));
    if (o.posts) for (let x = -L / 2; x <= L / 2 + 0.01; x += 2) g.add(box(0.1, 1.1, 0.1, col, x, 0.55, -0.04));
    else for (let k = 0; k <= n; k++) g.add(box(0.07, 1.0, 0.025, col, -L / 2 + k * L / n, 0.5, 0.03));
    return g; }
  function clothesline(L) { const g = new THREE.Group(); L = L || 5;
    for (const x of [-L / 2, L / 2]) { g.add(box(0.08, 1.9, 0.08, 0x9aa0a8, x, 0.95, 0)); g.add(box(0.06, 0.06, 0.8, 0x9aa0a8, x, 1.85, 0)); }
    for (const z of [-0.3, 0.3]) g.add(bar([-L / 2, 1.85, z], [L / 2, 1.85, z], 0.012, 0xdedede));
    const cols = [0xf2f2f2, 0x2f63c9, 0xd23a2c, 0xf0c22e, 0xf2f2f2, 0x8acbe8, 0xe85a9a, 0x2f9a48];
    for (let k = 0; k < 9; k++) { const x = -L / 2 + 0.4 + k * (L - 0.8) / 8, z = k % 2 ? 0.3 : -0.3, big = k % 3 === 0; g.add(box(big ? 0.75 : 0.45, big ? 0.55 : 0.6, 0.015, cols[k % cols.length], x, 1.85 - (big ? 0.3 : 0.32), z)); }
    return g; }
  function woodpile(L) { const g = new THREE.Group(); L = L || 2.2; const n = Math.round(L / 0.24);
    for (let r = 0; r < 4; r++) for (let k = 0; k < n - (r % 2); k++) { const x = -L / 2 + 0.12 + k * 0.24 + (r % 2) * 0.12; g.add(cyl(0.11, 0.11, 0.7, 6, k % 3 ? 0xb08a5a : 0xa07a4a, x, 0.12 + r * 0.205, 0, { rx: Math.PI / 2 })); }
    g.add(box(L + 0.2, 0.06, 0.85, 0x4a4c50, 0, 0.98, 0, { rz: 0.06 })); return g; }
  const chopBlock = () => grp(cyl(0.25, 0.27, 0.45, 8, 0x8a6a45, 0, 0.225, 0), cyl(0.23, 0.23, 0.02, 8, 0xc2a070, 0, 0.455, 0));
  function bench(col) { const g = new THREE.Group(); col = col || 0x8a6a45; g.add(box(1.5, 0.06, 0.38, col, 0, 0.45, 0)); g.add(box(1.5, 0.3, 0.05, col, 0, 0.72, -0.18, { rx: -0.15 })); for (const x of [0.65, -0.65]) g.add(box(0.06, 0.45, 0.38, 0x3a3027, x, 0.22, 0)); return g; }
  function swing() { const g = new THREE.Group(), wd = 0x8a6a45;
    for (const x of [-1.1, 1.1]) { g.add(bar([x, 0, -0.7], [x, 2.2, 0], 0.09, wd)); g.add(bar([x, 0, 0.7], [x, 2.2, 0], 0.09, wd)); }
    g.add(box(2.4, 0.1, 0.1, wd, 0, 2.22, 0)); for (const x of [-0.25, 0.25]) g.add(bar([x, 2.2, 0], [x, 0.55, 0.15], 0.015, 0xdedede)); g.add(box(0.6, 0.05, 0.22, 0xd23a2c, 0, 0.53, 0.16)); return g; }
  function dog(col) { const g = new THREE.Group(); col = col || 0x6b4a2e;
    g.add(box(0.24, 0.24, 0.62, col, 0, 0.45, 0)); g.add(box(0.2, 0.2, 0.24, col, 0, 0.62, 0.38)); g.add(box(0.12, 0.1, 0.12, 0x2a1d14, 0, 0.57, 0.53)); g.add(box(0.06, 0.1, 0.04, 0x2a1d14, 0.08, 0.76, 0.33)); g.add(box(0.06, 0.1, 0.04, 0x2a1d14, -0.08, 0.76, 0.33));
    for (const [x, z] of [[0.08, 0.22], [-0.08, 0.22], [0.08, -0.22], [-0.08, -0.22]]) g.add(box(0.07, 0.34, 0.07, col, x, 0.17, z)); g.add(bar([0, 0.5, -0.3], [0, 0.72, -0.5], 0.05, col)); return g; }
  // a scaffold tower (gradbeni oder): two decks, ladder, a sofa on top, flags and a banner facing +z (the road)
  function scaffold(o) {
    o = o || {}; const g = new THREE.Group(), W = o.w || 3.2, D = o.d || 2.2, H = [2.2, 4.4], st = 0xa9adb3, wd = 0xb08a5a;
    for (const [x, z] of [[W / 2, D / 2], [-W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2]]) g.add(cyl(0.035, 0.035, 5.5, 5, st, x, 2.75, z));
    for (const y of H) { g.add(box(W + 0.1, 0.07, D + 0.1, wd, 0, y, 0)); for (const z of [D / 2, -D / 2]) g.add(cyl(0.025, 0.025, W, 4, st, 0, y + 1.0, z, { rz: Math.PI / 2 })); for (const x of [W / 2, -W / 2]) g.add(cyl(0.025, 0.025, D, 4, st, x, y + 1.0, 0, { rx: Math.PI / 2 })); }
    for (const z of [D / 2, -D / 2]) { g.add(bar([-W / 2, 0.1, z], [W / 2, H[0], z], 0.04, st)); g.add(bar([W / 2, H[0], z], [-W / 2, H[1], z], 0.04, st)); }
    for (let y = 0.3; y < H[1]; y += 0.32) g.add(box(0.5, 0.04, 0.04, 0x8f949b, -W / 2 - 0.3, y, -D / 2 + 0.3)); for (const x of [-W / 2 - 0.05, -W / 2 - 0.55]) g.add(box(0.05, H[1] + 0.9, 0.05, 0x8f949b, x, (H[1] + 0.9) / 2, -D / 2 + 0.3));
    const s = sofa(o.sofa || 0x5c6e3a); s.position.set(0.2, H[1] + 0.04, -0.3); g.add(s);
    g.add(crates(3)); g.children[g.children.length - 1].position.set(-1.2, H[1] + 0.04, -0.6);
    const ban = o.banner || [0x15171c, 0xd8262a, 0xf2c21a]; ban.forEach((c, k) => g.add(box(W, 0.32, 0.03, c, 0, H[1] + 0.85 - k * 0.32 - 0.1 - 0.4, D / 2 + 0.06)));
    for (const [x, cols] of [[W / 2, [0x15171c, 0xd8262a, 0xf2c21a]], [-W / 2, [0xd8262a, 0xf2f2f2, 0x1f4aa8]]]) { g.add(cyl(0.025, 0.025, 2.2, 4, 0xdedede, x, H[1] + 1.1 + 1.1, D / 2)); cols.forEach((c, k) => g.add(box(1.0, 0.22, 0.02, c, x + (x > 0 ? 0.5 : -0.5), H[1] + 2.0 - k * 0.22, D / 2))); }
    return g;
  }
  // a temporary grandstand along x (the front +z, rows climbing to -z); n rows; seats as coloured strips
  function stand(L, n, o) {
    o = o || {}; const g = new THREE.Group(), rise = 0.42, dep = 0.85, st = 0x9aa0a8, seat = o.seat || 0x2f63c9;
    for (let r = 0; r < n; r++) { const y = 0.6 + r * rise, z = -r * dep; g.add(box(L, 0.08, dep, 0xb9bdc4, 0, y, z)); g.add(box(L, 0.18, 0.35, r % 4 === 1 ? 0xd8262a : seat, 0, y + 0.13, z - 0.12)); }
    for (let x = -L / 2; x <= L / 2 + 0.01; x += 4) { g.add(bar([x, 0, 0.3], [x, 0.6 + n * rise, -n * dep + 0.3], 0.1, st)); g.add(box(0.1, 0.6 + n * rise, 0.1, st, x, (0.6 + n * rise) / 2, -n * dep + 0.3)); }
    g.add(box(L, 1.0, 0.06, 0xdcdcd6, 0, 0.5 + n * rise + 0.6, -n * dep + 0.35)); g.add(box(L, 0.04, 0.04, st, 0, 1.6, 0.42));
    for (const x of [-L / 2 + 0.6, L / 2 - 0.6]) for (let r = 0; r < n; r++) g.add(box(1.0, 0.04, dep * 0.9, 0xc9ccd2, x, 0.4 + r * rise, -r * dep + 0.05));
    return g;
  }
  function seated(g, P, x, y, z) { put(g, P, x, y, z, 0); return P; }
  // marshal post: hut, flag stand, extinguishers, absorbent sacks, broom, stool
  function marshalPost(o) {
    o = o || {}; const g = new THREE.Group();
    g.add(box(2.4, 2.3, 2.2, 0xf1f0ea, 0, 1.15, 0)); g.add(box(2.8, 0.12, 2.6, 0x2f343c, 0, 2.36, 0)); g.add(box(1.7, 0.6, 0.04, 0x2a3440, 0, 1.45, 1.11));
    g.add(box(0.7, 0.32, 0.03, 0x111214, 0.6, 2.05, 1.12)); for (const x of [0.48, 0.72]) g.add(box(0.14, 0.14, 0.03, 0xffb31a, x, 2.05, 1.13, { basic: true }));
    const nt = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), texMat(signTex(o.num || '128', '#f2f2ee', '#111'))); nt.position.set(-0.5, 2.05, 1.115); g.add(nt);
    g.add(box(0.5, 1.0, 0.25, 0x6a6f78, 1.6, 0.5, 0.8)); [0xf5d21a, 0x1f63d8, 0xf2f2f2, 0x2a9a3a, 0xd8262a].forEach((c, k) => { g.add(cyl(0.012, 0.012, 1.2, 4, 0x5c4630, 1.45 + k * 0.08, 1.15, 0.8)); g.add(box(0.012, 0.32, 0.45, c, 1.45 + k * 0.08, 1.55, 0.8 + 0.22)); });
    for (const x of [-1.5, -1.75]) g.add(item('ext').translateX(x).translateY(0.5).translateZ(0.9));
    for (let k = 0; k < 3; k++) g.add(box(0.5, 0.25, 0.35, 0xf2f2ee, -0.6 + k * 0.52, 0.13, 1.6, { ry: k * 0.3 }));
    g.add(cyl(0.18, 0.18, 0.04, 8, 0x2a2c31, 1.0, 0.5, 1.7)); g.add(cyl(0.02, 0.02, 0.5, 4, 0x2a2c31, 1.0, 0.25, 1.7));
    return g;
  }
  function fireTruck() {   // along x (front +x)
    const g = new THREE.Group(), red = 0xc8201c;
    g.add(box(2.1, 2.5, 2.5, red, 3.0, 1.55, 0)); g.add(box(0.06, 0.9, 2.2, 0x26303a, 4.06, 2.05, 0)); g.add(box(0.9, 0.8, 0.04, 0x26303a, 3.4, 2.05, 1.26)); g.add(box(0.9, 0.8, 0.04, 0x26303a, 3.4, 2.05, -1.26));
    g.add(box(5.4, 2.6, 2.5, red, -0.8, 1.6, 0)); for (let k = 0; k < 4; k++) for (const z of [1.26, -1.26]) g.add(box(1.15, 1.6, 0.04, 0xb01a16, -2.9 + k * 1.3, 1.5, z));
    g.add(box(7.6, 0.18, 2.54, 0xf2f2ee, 0.25, 0.95, 0)); g.add(box(7.62, 0.06, 2.55, 0xf5d21a, 0.25, 1.06, 0));
    g.add(box(0.35, 0.18, 1.8, 0x15171c, 3.0, 2.9, 0)); for (const z of [0.5, -0.5]) g.add(box(0.33, 0.14, 0.6, 0x2f6bff, 3.0, 3.0, z, { basic: true }));
    for (const z of [0.55, -0.55]) g.add(box(5.6, 0.07, 0.07, 0xc9ccd2, -0.8, 3.1, z)); for (let x = -3.4; x < 1.9; x += 0.45) g.add(box(0.06, 0.06, 1.1, 0xc9ccd2, x, 3.1, 0));
    g.add(cyl(0.45, 0.45, 1.6, 10, 0x9a9da3, -3.6, 1.6, 0, { rx: Math.PI / 2 }));
    for (const x of [2.9, -1.9]) for (const z of [1.1, -1.1]) g.add(wheel(0.5, 0.36, x, 0.5, z));
    g.add(box(0.12, 0.3, 2.3, 0xc9ccd2, 4.1, 0.6, 0)); return g;
  }
  function gate(o) {   // a gate along x: the booth at -x, the barrier across a lane, fence panels to both sides
    o = o || {}; const g = new THREE.Group();
    g.add(box(1.8, 2.4, 1.6, 0xe9e8e2, -3.2, 1.2, 0)); g.add(box(2.1, 0.12, 1.9, 0x2f343c, -3.2, 2.46, 0)); g.add(box(1.3, 0.6, 0.04, 0x2a3440, -3.2, 1.55, 0.81)); g.add(box(0.04, 0.6, 1.0, 0x2a3440, -2.29, 1.55, 0));
    g.add(box(0.3, 1.0, 0.3, 0xd8d8d2, -2.0, 0.5, 0.5)); for (let k = 0; k < 8; k++) g.add(box(0.5, 0.1, 0.1, k % 2 ? 0xd8262a : 0xf2f2f2, -1.65 + k * 0.5, 0.95, 0.5));
    for (const x of [-7.5, -5.5, 3.0, 5.0, 7.0]) { g.add(box(2.0, 1.9, 0.04, 0xb9bdc4, x, 1.05, 0.0, { mat: { transparent: true, opacity: 0.55 } })); g.add(box(2.02, 0.05, 0.06, 0x9aa0a8, x, 2.0, 0)); g.add(box(0.06, 2.0, 0.3, 0x9aa0a8, x - 1.0, 1.0, 0)); }
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), texMat(signTex(o.sign || 'ENTRANCE · GATE 3', '#1d5f2c', '#fff'))); sg.position.set(0.5, 3.1, 0.06); g.add(sg); g.add(box(0.12, 3.4, 0.12, 0x9aa0a8, -0.9, 1.7, 0)); g.add(box(0.12, 3.4, 0.12, 0x9aa0a8, 1.9, 1.7, 0)); g.add(box(2.9, 0.1, 0.1, 0x9aa0a8, 0.5, 3.45, 0));
    return g;
  }
  function policeBike() { const g = new THREE.Group(); g.add(cyl(0.32, 0.32, 0.12, 10, TYRE, 0.75, 0.32, 0, { rx: Math.PI / 2 })); g.add(cyl(0.32, 0.32, 0.14, 10, TYRE, -0.72, 0.32, 0, { rx: Math.PI / 2 }));
    g.add(box(1.1, 0.42, 0.34, 0xf2f2f2, 0, 0.72, 0)); g.add(box(0.5, 0.3, 0.5, 0x1f4aa8, 0.55, 0.92, 0)); g.add(box(0.06, 0.45, 0.42, 0x8fb0c8, 0.78, 1.25, 0, { rz: -0.3, mat: { transparent: true, opacity: 0.6 } }));
    g.add(box(0.5, 0.35, 0.65, 0xf2f2f2, -0.65, 0.75, 0)); g.add(box(0.12, 0.08, 0.2, 0x2f6bff, -0.85, 1.0, 0, { basic: true })); g.add(box(0.75, 0.12, 0.3, 0x15171c, -0.15, 0.98, 0)); return g; }
  function foodTruck(col) {   // a van along x with its serving hatch on +z
    const g = new THREE.Group(); col = col || 0xf0c22e;
    g.add(box(4.6, 2.3, 2.2, col, -0.3, 1.5, 0)); g.add(box(1.4, 1.5, 2.1, col, 2.5, 1.1, 0)); g.add(box(0.06, 0.6, 1.8, 0x27313c, 3.2, 1.55, 0, { rz: -0.35 }));
    g.add(box(2.8, 1.0, 0.05, 0x2a2c31, -0.6, 1.75, 1.11)); g.add(box(2.9, 0.06, 1.0, col, -0.6, 2.62, 1.55, { rx: -0.35 })); g.add(box(2.8, 0.1, 0.45, 0xc9ccd2, -0.6, 1.2, 1.3));
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), texMat(signTex('FOOD · DRINKS', '#1b1d22', '#ffd23a'))); sg.position.set(-0.6, 2.42, 1.115); g.add(sg);
    g.add(cyl(0.08, 0.08, 0.6, 6, 0x9aa0a8, -1.8, 2.95, 0.5)); const sm = smoke(6, 4, 0xc9ccd0, 0.5, 2); sm.position.set(-1.8, 3.2, 0.5); g.add(sm);
    for (const x of [1.9, -1.9]) for (const z of [1.0, -1.0]) g.add(wheel(0.36, 0.24, x, 0.36, z)); return g; }
  const highTable = (col) => grp(cyl(0.38, 0.38, 0.04, 10, col || 0xf2f2ee, 0, 1.08, 0), cyl(0.035, 0.035, 1.06, 5, 0x9aa0a8, 0, 0.53, 0), cyl(0.28, 0.3, 0.04, 8, 0x9aa0a8, 0, 0.02, 0), cyl(0.036, 0.036, 0.16, 6, 0xc8c9cc, 0.1, 1.18, 0.05));
  // the pits: a low pit wall with a fence along x (the track +z), a stack of tyres, a trolley, a tool chest, the team truck behind
  function pitWall(L) { const g = new THREE.Group(); g.add(box(L, 1.05, 0.5, 0xd8d8d2, 0, 0.52, 0)); for (let x = -L / 2; x < L / 2; x += 2.5) g.add(box(2.4, 0.4, 0.52, (Math.round(x / 2.5) % 2) ? 0xd8262a : 0xf2f2f2, x + 1.25, 0.82, 0)); return g; }
  function tyreStack(n, col) { const g = new THREE.Group(); for (let k = 0; k < n; k++) { g.add(cyl(0.33, 0.33, 0.27, 12, TYRE, 0, 0.14 + k * 0.28, 0)); g.add(cyl(0.2, 0.2, 0.28, 10, col || 0xd8262a, 0, 0.14 + k * 0.28, 0, { s: [1, 0.3, 1] })); } return g; }
  function warmers(col) { const g = new THREE.Group(); for (let k = 0; k < 4; k++) g.add(cyl(0.34, 0.34, 0.3, 12, col, (k % 2) * 0.72, 0.34 + Math.floor(k / 2) * 0.0, Math.floor(k / 2) * 0.75, { rx: Math.PI / 2 })); return g; }
  const toolChest = (col) => grp(box(0.9, 1.1, 0.55, col || 0xd8262a, 0, 0.62, 0), ...[0.4, 0.62, 0.84, 1.0].map(y => box(0.92, 0.03, 0.56, 0x2a2c31, 0, y, 0)), ...[[0.35, 0.2], [-0.35, 0.2], [0.35, -0.2], [-0.35, -0.2]].map(([x, z]) => cyl(0.05, 0.05, 0.04, 6, 0x15171c, x, 0.05, z, { rx: Math.PI / 2 })));
  function teamTruck(col) { const g = new THREE.Group(); g.add(box(12, 3.4, 2.5, 0xe9e8e2, 0, 2.0, 0)); g.add(box(12.02, 0.9, 2.52, col, 0, 2.3, 0)); g.add(box(12.02, 0.12, 2.52, 0x15171c, 0, 1.75, 0));
    for (const x of [-4.4, -3.2, 3.6, 4.8]) for (const z of [1.1, -1.1]) g.add(wheel(0.5, 0.35, x, 0.5, z));
    for (let k = 0; k < 5; k++) g.add(box(10, 0.04, 2.6 / 5, k % 2 ? 0xf2f2f2 : col, 0, 3.4 - 0.08 * k, 1.25 + 2.6 / 5 * (k + 0.5), { rx: 0.06 }));
    for (const x of [-4.8, 4.8]) g.add(cyl(0.03, 0.03, 3.1, 5, 0xc9ccd2, x, 1.55, 3.8)); return g; }

  /* ---------------- postavitev v igri ---------------- */
  // a frame beside the track: s along it, side (+1 right, -1 left), b: metres beyond the barrier. Axes: a along the track (+ ahead), b away from
  // the road. Returns world x, z, the ground height and helpers (local -> world)
  function frame(s, side) {
    const g = window.__game, T = g.race.track, i = T.idx(((s % T.len) + T.len) % T.len), bar = side > 0 ? T.br[i] : T.bl[i];
    const tx = T.tx[i], tz = T.tz[i], nx = T.nx[i] * side, nz = T.nz[i] * side, px = T.px[i], pz = T.pz[i], gH = Render.world.groundH;
    const F = { i, s, side, bar, tx, tz, nx, nz, px, pz, hy: T.hy ? T.hy[i] : 0,
      w: (a, b) => [px + tx * a + nx * (bar + b), pz + tz * a + nz * (bar + b)],
      y: (a, b) => { const [x, z] = F.w(a, b); const h = gH(x, z); return Number.isFinite(h) ? h : F.hy; },
      // yaw (THREE rotation.y) of a local facing direction: (da along, db away); 0 faces +z
      yaw: (da, db) => { const dx = tx * da + nx * db, dz = tz * da + nz * db; return Math.atan2(dx, dz); },
      // yaw for an object whose own +x should point along (da, db)
      yawX: (da, db) => { const dx = tx * da + nx * db, dz = tz * da + nz * db; return Math.atan2(-dz, dx); },
    };
    return F;
  }
  function place(root, F, o, a, b, yaw, sink) { const [x, z] = F.w(a, b); o.position.set(x, F.y(a, b) - (sink || 0), z); if (yaw != null) o.rotation.y = yaw; root.add(o); return o; }
  function placeP(root, F, P, a, b, yaw, dy) { const [x, z] = F.w(a, b); return put(root, P, x, F.y(a, b) + (dy || 0), z, yaw); }
  // clear the instanced trees and bushes around (x, z) circles, hide the old roadside crowd
  function clearAround(circles) {
    let n = 0; const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
    Render.scene.traverse(o => { if (!o.isInstancedMesh || o.name === 'crowd' || o.userData.lj) return; let ch = false;
      for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, m4); m4.decompose(p, q, s); p.applyMatrix4(o.matrixWorld);
        for (const [cx, cz, r] of circles) if ((p.x - cx) ** 2 + (p.z - cz) ** 2 < r * r) { o.setMatrixAt(k, Z); ch = true; n++; break; } }
      if (ch) o.instanceMatrix.needsUpdate = true; });
    return n;
  }
  function hideCrowd(v) { const c = Render.world.root.getObjectByName('crowds'); if (c) c.visible = !v; }


  // collapse the merged scenery (tents, cars, flags, huts) inside the circles: triangles whose corners all stand above the ground there
  // (not the terrain, the road or anything near the barrier: bMin, the frame's distance beyond the barrier)
  function clearProps(circles, F, bMin) {
    const gH = Render.world.groundH, v = new THREE.Vector3(); let n = 0;
    const inC = (x, z) => { for (const [cx, cz, r] of circles) if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true; return false; };
    const bOf = (x, z) => (x - F.px) * F.nx + (z - F.pz) * F.nz - F.bar;
    Render.scene.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.userData.lj || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
      let p = o.parent, mine = false; while (p) { if (p.userData && p.userData.lj) { mine = true; break; } if (p.name === 'crowds') { mine = true; break; } p = p.parent; } if (mine) return;
      const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const c = g.boundingSphere.center.clone().applyMatrix4(o.matrixWorld), r = g.boundingSphere.radius;
      let near = false; for (const [cx, cz, rr] of circles) if ((c.x - cx) ** 2 + (c.z - cz) ** 2 < (r + rr) ** 2) near = true; if (!near) return;
      const P = g.attributes.position, N = P.count, ok = new Uint8Array(N);
      for (let i = 0; i < N; i++) { v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); const h = gH(v.x, v.z); ok[i] = inC(v.x, v.z) && bOf(v.x, v.z) > bMin && Number.isFinite(h) && v.y > h + 0.22 ? 1 : 0; }
      if (g.index) { const I = g.index.array; let ch = false; for (let t = 0; t < I.length; t += 3) if (ok[I[t]] && ok[I[t + 1]] && ok[I[t + 2]]) { I[t + 1] = I[t]; I[t + 2] = I[t]; ch = true; n++; } if (ch) g.index.needsUpdate = true; }
      else { let ch = false; for (let t = 0; t + 2 < N; t += 3) if (ok[t] && ok[t + 1] && ok[t + 2]) { for (const k of [t + 1, t + 2]) P.setXYZ(k, P.getX(t), P.getY(t), P.getZ(t)); ch = true; n++; } if (ch) P.needsUpdate = true; }
    });
    return n;
  }
  // a camera tower: four posts, a deck at 3 m with a rail, a ladder, an umbrella; the camera on its tripod faces +z
  function camTower(col) {
    const g = new THREE.Group(), H = 3.0, st = 0xa9adb3;
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.add(cyl(0.035, 0.035, H + 1.1, 5, st, x, (H + 1.1) / 2, z));
    g.add(box(2.1, 0.07, 2.1, 0xb08a5a, 0, H, 0)); for (const z of [1, -1]) g.add(cyl(0.025, 0.025, 2, 4, st, 0, H + 1.0, z, { rz: Math.PI / 2 })); for (const x of [1, -1]) g.add(cyl(0.025, 0.025, 2, 4, st, x, H + 1.0, 0, { rx: Math.PI / 2 }));
    for (let y = 0.3; y < H; y += 0.32) g.add(box(0.5, 0.04, 0.04, 0x8f949b, -1.3, y, -0.6)); for (const x of [-1.05, -1.55]) g.add(box(0.05, H + 0.9, 0.05, 0x8f949b, x, (H + 0.9) / 2, -0.6));
    g.add(cyl(0.02, 0.02, 2.2, 4, 0xdedede, 0.7, H + 1.1, -0.6)); g.add(cyl(0.05, 1.3, 0.45, 8, col || 0xf2f2f2, 0.7, H + 2.2, -0.6));
    const cam = new THREE.Group(); cam.position.set(0, H + 0.04, 0.35); g.add(cam);
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; cam.add(bar([Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35], [0, 1.25, 0], 0.03, 0x2a2c31)); }
    const head = new THREE.Group(); head.position.y = 1.3; cam.add(head);
    head.add(box(0.28, 0.3, 0.5, 0x1b1d22, 0, 0.05, 0)); head.add(cyl(0.11, 0.12, 0.45, 8, 0x2a2c31, 0, 0.05, 0.45, { rx: Math.PI / 2 })); head.add(box(0.2, 0.15, 0.04, 0x6a8fb0, 0.2, 0.18, -0.2, { basic: true }));
    g.userData.camHead = head; return g;
  }
  const bag = (col) => grp(box(0.45, 0.3, 0.28, col || 0x23262c, 0, 0.15, 0), box(0.47, 0.04, 0.3, 0x15171c, 0, 0.3, 0));
  const stool = () => grp(cyl(0.17, 0.17, 0.04, 8, 0x2a2c31, 0, 0.48, 0), ...[0, 1, 2].map(k => bar([Math.cos(k * 2.1) * 0.15, 0, Math.sin(k * 2.1) * 0.15], [0, 0.47, 0], 0.025, 0x5b6068)));
  const trolley = () => grp(box(1.1, 0.06, 0.6, 0x9aa0a8, 0, 0.32, 0), ...[[0.45, 0.25], [-0.45, 0.25], [0.45, -0.25], [-0.45, -0.25]].map(([x, z]) => cyl(0.08, 0.08, 0.05, 8, 0x15171c, x, 0.08, z, { rx: Math.PI / 2 })), bar([-0.55, 0.32, 0.28], [-0.75, 1.0, 0.28], 0.03, 0x9aa0a8), bar([-0.55, 0.32, -0.28], [-0.75, 1.0, -0.28], 0.03, 0x9aa0a8), cyl(0.33, 0.33, 0.27, 12, 0x16171a, 0.2, 0.5, 0, { s: [1, 1, 1] }));
  function headItem(P, kind, o) { const it = item(kind, o); it.position.set(0, 0.12, 0.14); P.head.add(it); return it; }


  /* ---------------- več elementov (želja uporabnika: »elementi so super, še jih dodaj«) ---------------- */
  function parasol(col, col2) { const g = new THREE.Group(); g.add(cyl(0.025, 0.025, 2.3, 5, 0xdedede, 0, 1.15, 0));
    for (let k = 0; k < 8; k++) { const c = new THREE.Mesh(flat(new THREE.ConeGeometry(1.32, 0.38, 1, 1, true, k / 8 * TAU, TAU / 8)), lam(k % 2 ? (col2 || 0xf2f2ee) : col, { side: THREE.DoubleSide })); c.position.y = 2.42; c.castShadow = true; g.add(c); }
    return g; }
  function flagPole(cols, h) { h = h || 6; const g = new THREE.Group(); g.add(cyl(0.04, 0.05, h, 5, 0xdedede, 0, h / 2, 0)); cols = cols || [0x15171c, 0xd8262a, 0xf2c21a];
    cols.forEach((c, k) => g.add(box(1.5, 0.95 / cols.length, 0.02, c, 0.78, h - 0.25 - (k + 0.5) * 0.95 / cols.length, 0))); return g; }
  function bike(col) { const g = new THREE.Group(); col = col || 0x2f63c9;
    for (const x of [0.55, -0.55]) { g.add(cyl(0.34, 0.34, 0.04, 12, 0x15171c, x, 0.34, 0, { rx: Math.PI / 2 })); g.add(cyl(0.29, 0.29, 0.045, 12, 0xc9ccd2, x, 0.34, 0, { rx: Math.PI / 2, s: [1, 1, 1] })); }
    g.add(bar([-0.55, 0.34, 0], [-0.05, 0.36, 0], 0.04, col)); g.add(bar([-0.05, 0.36, 0], [0.45, 0.8, 0], 0.04, col)); g.add(bar([-0.55, 0.34, 0], [-0.15, 0.82, 0], 0.04, col)); g.add(bar([-0.15, 0.82, 0], [0.45, 0.8, 0], 0.04, col)); g.add(bar([-0.05, 0.36, 0], [-0.15, 0.82, 0], 0.04, col));
    g.add(bar([0.45, 0.8, 0], [0.55, 0.34, 0], 0.035, col)); g.add(box(0.22, 0.05, 0.1, 0x15171c, -0.17, 0.88, 0)); g.add(box(0.04, 0.04, 0.5, 0x2a2c31, 0.42, 0.98, 0)); return g; }
  function hammock(L) { L = L || 3.2; const g = new THREE.Group(), wd = 0x7a5a3a;
    for (const x of [-L / 2, L / 2]) g.add(cyl(0.08, 0.09, 1.9, 6, wd, x, 0.95, 0));
    const n = 6, pts = []; for (let k = 0; k <= n; k++) pts.push([-L / 2 + 0.3 + k * (L - 0.6) / n, 1.45 - Math.sin(k / n * Math.PI) * 0.6]);
    for (let k = 0; k < n; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; g.add(box(Math.hypot(x1 - x0, y1 - y0) + 0.02, 0.03, 0.85, k % 2 ? 0xe85a2a : 0xf0c22e, (x0 + x1) / 2, (y0 + y1) / 2, 0, { rz: Math.atan2(y1 - y0, x1 - x0) })); }
    g.add(bar([-L / 2, 1.75, 0], [pts[0][0], pts[0][1], 0], 0.02, 0xdedede)); g.add(bar([L / 2, 1.75, 0], [pts[n][0], pts[n][1], 0], 0.02, 0xdedede)); return g; }
  const kidPool = (col) => grp(cyl(1.1, 1.1, 0.3, 14, col || 0x2f8fe0, 0, 0.15, 0), cyl(0.92, 0.92, 0.31, 14, 0x8fd8f0, 0, 0.16, 0, { basic: false }));
  function stringLights(L, h) { const g = new THREE.Group(), cols = [0xffd23a, 0xff5a3a, 0x5ad86a, 0x5ab0ff, 0xff8ad8]; g.add(bar([-L / 2, h, 0], [L / 2, h, 0], 0.01, 0x2a2c31));
    for (let k = 0; k <= Math.round(L / 0.4); k++) { const x = -L / 2 + k * 0.4, y = h - Math.sin(k / Math.round(L / 0.4) * Math.PI) * 0.18; g.add(sph(0.05, 5, 3, cols[k % cols.length], x, y - 0.06, 0, { basic: true, noCast: true })); } return g; }
  const gasBottle = () => grp(cyl(0.15, 0.15, 0.55, 8, 0x8a8f98, 0, 0.3, 0), cyl(0.05, 0.05, 0.1, 6, 0x5b6068, 0, 0.62, 0));
  const trashBag = () => grp(sph(0.28, 6, 4, 0x15171c, 0, 0.26, 0, { s: [1, 0.9, 1] }), cyl(0.03, 0.06, 0.12, 5, 0x15171c, 0, 0.55, 0));
  const bin = (col) => grp(cyl(0.3, 0.27, 0.95, 8, col || 0x2f7a3a, 0, 0.48, 0), cyl(0.32, 0.32, 0.06, 8, 0x2a2c31, 0, 0.97, 0));
  function portaloo(col) { const g = new THREE.Group(); col = col || 0x2f63c9; g.add(box(1.15, 2.2, 1.15, col, 0, 1.1, 0)); g.add(box(1.25, 0.1, 1.25, 0xf2f2f2, 0, 2.25, 0)); g.add(box(0.8, 1.9, 0.03, 0xd9dde2, 0, 1.05, 0.59)); g.add(box(0.1, 0.06, 0.04, 0x2a9a3a, 0.25, 1.3, 0.61, { basic: true })); return g; }
  function beerSet(L) { L = L || 2.2; const g = new THREE.Group(), wd = 0xb08a5a;
    g.add(box(L, 0.04, 0.5, wd, 0, 0.76, 0)); for (const x of [L / 2 - 0.25, -L / 2 + 0.25]) { g.add(bar([x, 0, -0.2], [x, 0.74, 0.2], 0.03, 0x5b6068)); g.add(bar([x, 0, 0.2], [x, 0.74, -0.2], 0.03, 0x5b6068)); }
    for (const z of [0.58, -0.58]) { g.add(box(L, 0.04, 0.25, wd, 0, 0.47, z)); for (const x of [L / 2 - 0.25, -L / 2 + 0.25]) g.add(box(0.04, 0.45, 0.22, 0x5b6068, x, 0.23, z)); }
    for (const x of [-0.6, -0.1, 0.5]) g.add(cyl(0.04, 0.035, 0.16, 6, 0xf0c22e, x, 0.86, 0.05)); return g; }
  function van(col, col2) {   // a boxy minibus (two-tone), front +x
    const g = new THREE.Group(); col = col || 0xd8262a; col2 = col2 || 0xf2f2ee;
    g.add(box(4.4, 1.0, 1.85, col, 0, 0.85, 0)); g.add(box(4.4, 0.95, 1.85, col2, 0, 1.82, 0)); g.add(box(4.3, 0.12, 1.75, col2, 0, 2.35, 0));
    g.add(box(0.05, 0.62, 1.6, 0x27313c, 2.21, 1.82, 0)); for (const x of [1.0, -0.2, -1.4]) for (const z of [0.93, -0.93]) g.add(box(0.95, 0.5, 0.03, 0x27313c, x, 1.85, z));
    for (const x of [1.45, -1.45]) for (const z of [0.85, -0.85]) g.add(wheel(0.34, 0.22, x, 0.34, z));
    g.add(box(0.06, 0.14, 0.3, 0xf6f2dc, 2.21, 0.95, 0.65, { basic: true })); g.add(box(0.06, 0.14, 0.3, 0xf6f2dc, 2.21, 0.95, -0.65, { basic: true })); return g; }
  function tractor(col) {   // front +x
    const g = new THREE.Group(); col = col || 0xd8262a;
    g.add(box(2.0, 0.7, 0.9, col, 0.5, 1.05, 0)); g.add(box(1.1, 1.4, 1.1, col, -0.65, 1.5, 0)); g.add(box(1.0, 0.9, 1.05, 0x27313c, -0.65, 1.85, 0, { s: [1.02, 1, 1.02] })); g.add(box(1.25, 0.08, 1.25, col, -0.65, 2.3, 0));
    g.add(cyl(0.05, 0.05, 0.8, 5, 0x2a2c31, 1.1, 1.75, 0.25)); g.add(cyl(0.72, 0.72, 0.45, 12, TYRE, -0.75, 0.72, 0.75, { rx: Math.PI / 2 })); g.add(cyl(0.72, 0.72, 0.45, 12, TYRE, -0.75, 0.72, -0.75, { rx: Math.PI / 2 }));
    g.add(cyl(0.42, 0.42, 0.3, 10, TYRE, 1.15, 0.42, 0.62, { rx: Math.PI / 2 })); g.add(cyl(0.42, 0.42, 0.3, 10, TYRE, 1.15, 0.42, -0.62, { rx: Math.PI / 2 }));
    for (const z of [0.75, -0.75]) g.add(cyl(0.4, 0.4, 0.47, 10, 0xd8c34a, -0.75, 0.72, z, { rx: Math.PI / 2 })); return g; }
  function trampoline() { const g = new THREE.Group(); g.add(cyl(1.6, 1.6, 0.1, 16, 0x2f63c9, 0, 0.82, 0)); g.add(cyl(1.35, 1.35, 0.12, 16, 0x15171c, 0, 0.83, 0));
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; g.add(cyl(0.03, 0.03, 0.82, 4, 0x9aa0a8, Math.cos(a) * 1.5, 0.41, Math.sin(a) * 1.5)); g.add(cyl(0.02, 0.02, 1.6, 4, 0x9aa0a8, Math.cos(a) * 1.58, 1.6, Math.sin(a) * 1.58)); }
    const net = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.58, 1.5, 16, 1, true), lam(0x15171c, { transparent: true, opacity: 0.25, side: THREE.DoubleSide })); net.position.y = 1.62; g.add(net); return g; }
  function bigScreen(tex) { const g = new THREE.Group(); for (const x of [-2.4, 2.4]) g.add(box(0.3, 6.4, 0.3, 0x9aa0a8, x, 3.2, 0)); g.add(box(5.2, 3.0, 0.3, 0x15171c, 0, 4.6, 0));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.7), new THREE.MeshBasicMaterial({ map: tex || tvTex() })); scr.position.set(0, 4.6, 0.16); g.add(scr); g.add(box(5.6, 0.2, 1.2, 0x9aa0a8, 0, 0.1, 0)); return g; }
  function quad(col) { const g = new THREE.Group(); col = col || 0xf07a1c;
    for (const x of [0.6, -0.6]) for (const z of [0.5, -0.5]) g.add(cyl(0.3, 0.3, 0.26, 10, TYRE, x, 0.3, z, { rx: Math.PI / 2 }));
    g.add(box(1.5, 0.35, 0.75, col, 0, 0.62, 0)); g.add(box(0.5, 0.15, 0.85, col, 0.62, 0.75, 0)); g.add(box(0.45, 0.15, 0.85, col, -0.6, 0.78, 0)); g.add(box(0.5, 0.12, 0.4, 0x15171c, -0.1, 0.86, 0));
    g.add(box(0.05, 0.05, 0.75, 0x2a2c31, 0.42, 1.05, 0)); g.add(bar([0.32, 0.8, 0], [0.42, 1.05, 0], 0.05, 0x2a2c31)); return g; }
  function scooter(col) { const g = new THREE.Group(); col = col || 0x1f63d8; g.add(cyl(0.22, 0.22, 0.1, 10, TYRE, 0.55, 0.22, 0, { rx: Math.PI / 2 })); g.add(cyl(0.22, 0.22, 0.1, 10, TYRE, -0.5, 0.22, 0, { rx: Math.PI / 2 }));
    g.add(box(0.75, 0.12, 0.32, col, 0, 0.32, 0)); g.add(box(0.45, 0.35, 0.34, col, -0.4, 0.55, 0)); g.add(box(0.4, 0.1, 0.3, 0x15171c, -0.35, 0.78, 0)); g.add(bar([0.5, 0.3, 0], [0.42, 1.0, 0], 0.06, col)); g.add(box(0.05, 0.05, 0.6, 0x2a2c31, 0.42, 1.0, 0)); return g; }
  const cone = () => grp(box(0.36, 0.04, 0.36, 0x15171c, 0, 0.02, 0), cyl(0.03, 0.15, 0.6, 8, 0xf07a1c, 0, 0.32, 0), cyl(0.085, 0.11, 0.1, 8, 0xf2f2f2, 0, 0.33, 0));
  function fanBanner(cols, L) { const g = new THREE.Group(); L = L || 4; cols = cols || [0x15171c, 0xd8262a, 0xf2c21a]; cols.forEach((c, k) => g.add(box(L, 0.9 / cols.length, 0.02, c, 0, 1.9 - (k + 0.5) * 0.9 / cols.length, 0))); return g; }
  function mower(col) { const g = new THREE.Group(); col = col || 0xd8262a; g.add(box(0.55, 0.22, 0.45, col, 0, 0.22, 0)); for (const [x, z] of [[0.22, 0.24], [-0.22, 0.24], [0.22, -0.24], [-0.22, -0.24]]) g.add(cyl(0.09, 0.09, 0.05, 8, TYRE, x, 0.09, z, { rx: Math.PI / 2 }));
    g.add(bar([-0.25, 0.3, 0.18], [-0.75, 0.95, 0.18], 0.03, 0x2a2c31)); g.add(bar([-0.25, 0.3, -0.18], [-0.75, 0.95, -0.18], 0.03, 0x2a2c31)); g.add(box(0.04, 0.04, 0.4, 0x2a2c31, -0.75, 0.95, 0)); return g; }
  function wheelbarrow(col) { const g = new THREE.Group(); col = col || 0x2f9a48; g.add(tbox(0.55, 0.75, 0.32, 0.45, 0.6, col, 0, 0.32, 0, { rz: 0 })); g.add(cyl(0.18, 0.18, 0.06, 8, TYRE, 0.55, 0.18, 0, { rx: Math.PI / 2 }));
    for (const z of [0.22, -0.22]) { g.add(bar([0.55, 0.18, 0], [-0.75, 0.55, z], 0.035, 0x6b4a2e)); g.add(bar([-0.2, 0.0, z * 0.9], [-0.2, 0.34, z * 0.9], 0.03, 0x2a2c31)); } return g; }
  function fridge() { return grp(box(0.6, 1.4, 0.6, 0xf2f2ee, 0, 0.7, 0), box(0.02, 0.5, 0.04, 0x9aa0a8, 0.22, 0.95, 0.31)); }
  function pullBar() { const g = new THREE.Group(); for (const x of [-0.7, 0.7]) g.add(cyl(0.05, 0.05, 2.4, 6, 0x5b6068, x, 1.2, 0)); g.add(cyl(0.03, 0.03, 1.5, 6, 0xc9ccd2, 0, 2.3, 0, { rz: Math.PI / 2 })); return g; }
  const dumbbell = () => grp(cyl(0.02, 0.02, 0.3, 5, 0x5b6068, 0, 0.06, 0, { rz: Math.PI / 2 }), cyl(0.06, 0.06, 0.06, 8, 0x15171c, 0.13, 0.06, 0, { rz: Math.PI / 2 }), cyl(0.06, 0.06, 0.06, 8, 0x15171c, -0.13, 0.06, 0, { rz: Math.PI / 2 }));
  function beanBag(col) { return grp(sph(0.45, 7, 4, col || 0xd8262a, 0, 0.25, 0, { s: [1.1, 0.6, 1.1] })); }
  function mailbox() { return grp(box(0.08, 1.1, 0.08, 0x6b4a2e, 0, 0.55, 0), box(0.3, 0.25, 0.45, 0x2f63c9, 0, 1.2, 0)); }
  function flowerBed(L) { const g = new THREE.Group(); L = L || 2; g.add(box(L, 0.15, 0.6, 0x5a3c24, 0, 0.07, 0, { noCast: true })); const cols = [0xd8262a, 0xf0c22e, 0xe85a9a, 0xf2f2f2, 0x8a3b8c];
    for (let k = 0; k < Math.round(L * 5); k++) g.add(sph(0.07, 5, 3, cols[k % cols.length], -L / 2 + 0.1 + k * 0.2, 0.22, (k % 3 - 1) * 0.15, { noCast: true })); return g; }
  function shed(col) { const g = new THREE.Group(); col = col || 0x9b2c22; g.add(box(2.4, 2.1, 2.0, col, 0, 1.05, 0)); g.add(box(2.7, 0.1, 2.3, 0x2b2d31, 0, 2.2, 0, { rz: 0.12 })); g.add(box(0.8, 1.7, 0.04, 0x6b4a2e, 0.3, 0.85, 1.01)); for (const x of [-1.2, 1.2]) g.add(box(0.1, 2.1, 0.1, 0xf2f0ea, x, 1.05, 1.0)); return g; }
  // the pit wall stand (gantry): a roofed desk on the wall with monitors and stools; the engineers sit at it facing +z (the track)
  function pitStand(col, L) { L = L || 4.5; const g = new THREE.Group(); col = col || 0x1f63d8;
    g.add(box(L, 0.08, 1.4, 0x5b6068, 0, 1.05, 0)); g.add(box(L, 0.75, 0.5, 0x2a2c31, 0, 1.45, 0.45)); for (let k = 0; k < 4; k++) g.add(box(0.7, 0.45, 0.05, 0x111214, -L / 2 + 0.7 + k * (L - 1.4) / 3, 2.1, 0.55, { rx: -0.2 }));
    for (let k = 0; k < 4; k++) g.add(box(0.62, 0.36, 0.02, 0x4a7fb8, -L / 2 + 0.7 + k * (L - 1.4) / 3, 2.1, 0.58, { rx: -0.2, basic: true }));
    for (const x of [-L / 2 + 0.1, L / 2 - 0.1]) for (const z of [0.6, -0.6]) g.add(box(0.08, 2.6, 0.08, 0x9aa0a8, x, 1.3, z)); g.add(box(L + 0.3, 0.12, 1.8, col, 0, 2.65, 0.1)); g.add(box(L + 0.32, 0.3, 0.05, 0xf2f2f2, 0, 2.5, 1.0));
    for (let k = 0; k < 4; k++) g.add(stoolHigh(-L / 2 + 0.7 + k * (L - 1.4) / 3, -0.2)); return g; }
  function stoolHigh(x, z) { return grp(cyl(0.2, 0.2, 0.05, 8, 0x15171c, x, 1.72, z), cyl(0.03, 0.03, 0.62, 4, 0x9aa0a8, x, 1.4, z)); }
  function mediaVan() { const g = van(0xf2f2ee, 0xf2f2ee); g.add(cyl(0.03, 0.03, 0.7, 5, 0x9aa0a8, -1.0, 2.75, 0)); g.add(cyl(0.6, 0.08, 0.15, 10, 0xe9e9e4, -1.0, 3.15, 0, { rx: 1.0 })); g.add(box(4.42, 0.12, 1.87, 0x1f63d8, 0, 1.3, 0)); return g; }
  function hoseLine(L) { const g = new THREE.Group(); let prev = [0, 0.05, 0]; for (let k = 1; k <= 8; k++) { const p = [k * L / 8, 0.05, Math.sin(k * 1.3) * 0.5]; g.add(bar(prev, p, 0.07, 0xd9c35a, { noCast: true })); prev = p; } return g; }
  function heras(L) { const g = new THREE.Group(); for (let x = -L / 2; x < L / 2 - 0.1; x += 3.4) { g.add(box(3.3, 1.9, 0.03, 0xb9bdc4, x + 1.7, 1.0, 0, { mat: { transparent: true, opacity: 0.5 } })); g.add(box(3.3, 0.05, 0.05, 0x9aa0a8, x + 1.7, 1.95, 0)); g.add(box(0.6, 0.12, 0.25, 0x6a6f78, x, 0.06, 0)); } return g; }


  /* ---------------- živali (po državah) ----------------
     A generic four-legged animal along +z (head forward), feet at y = 0. o: L (body length), H (shoulder height), W (body width), col, belly, legs, head,
     neck (length), nk (neck angle: 0 level .. 1.2 up), hs (head size), snout, ears, tail ('short' | 'long' | 'bushy' | 'tuft' | 'none'), tailCol, horns ('roe' |
     'stag' | 'moose' | 'hook' | 'ibex' | 'curl' | 'cow'), rump (a white rump patch), graze (head down to the grass), hump, mane */
  function beast(o) {
    const g = new THREE.Group(), L = o.L, H = o.H, W = o.W || L * 0.38, lt = o.lt || W * 0.28, col = o.col, legs = o.legs || col, hc = o.head || col;
    const by = H + (o.bh || W * 0.5) / 2 - 0.02, bh = o.bh || W * 0.95;
    g.add(tbox(W, W * 0.9, bh, L, L * 0.96, col, 0, H - 0.02, 0, { rx: Math.PI / 2, s: [1, 1, 1] }));   // (a tapered box lying along z)
    g.children[g.children.length - 1].rotation.x = 0; g.children[g.children.length - 1].position.y = H - 0.02;
    if (o.belly) g.add(box(W * 0.8, 0.04, L * 0.7, o.belly, 0, H - 0.03, 0));
    if (o.rump) g.add(box(W * 0.85, bh * 0.6, 0.04, o.rump, 0, H + bh * 0.4, -L / 2 - 0.01));
    if (o.hump) g.add(sph(W * 0.62, 7, 4, o.humpCol || col, 0, H + bh * 0.95, L * 0.22, { half: true, s: [1, 1, 1.4] }));
    if (o.mane) g.add(box(W * 0.35, bh * 0.5, L * 0.45, o.mane, 0, H + bh + 0.02, L * 0.2));
    for (const [x, z] of [[W / 2 - lt / 2, L / 2 - lt], [-(W / 2 - lt / 2), L / 2 - lt], [W / 2 - lt / 2, -L / 2 + lt], [-(W / 2 - lt / 2), -L / 2 + lt]]) {
      g.add(box(lt, H, lt * 1.1, legs, x, H / 2, z)); g.add(box(lt * 1.05, 0.06, lt * 1.2, o.hoof || 0x2a221c, x, 0.03, z + 0.01)); }
    // neck and head: the neck from the front of the body up (nk) or down to the grass (graze)
    const nl = o.neck != null ? o.neck : L * 0.45, ang = o.graze ? -0.75 : (o.nk != null ? o.nk : 0.8), hs = o.hs || W * 0.75;
    const n0 = [0, H + bh * 0.62, L / 2 - 0.05], n1 = [0, n0[1] + Math.sin(ang) * nl, n0[2] + Math.cos(ang) * nl];
    if (nl > 0.05) g.add(bar(n0, n1, W * 0.42, o.neckCol || col));
    const head = new THREE.Group(); head.position.set(n1[0], n1[1], n1[2]); head.rotation.x = o.graze ? 0.9 : (o.headTilt || 0.25); g.add(head);
    head.add(box(hs * 0.7, hs * 0.72, hs, hc, 0, 0, hs * 0.25)); head.add(box(hs * 0.5, hs * 0.45, (o.snout || 0.6) * hs, o.snoutCol || hc, 0, -hs * 0.1, hs * 0.65 + (o.snout || 0.6) * hs * 0.3));
    head.add(box(hs * 0.22, hs * 0.18, 0.03, o.nose || 0x15110e, 0, -hs * 0.05, hs * 0.7 + (o.snout || 0.6) * hs * 0.8));
    const ear = o.ears || 0.35; for (const sd of [1, -1]) head.add(box(hs * 0.14, hs * ear, hs * 0.08, o.earCol || hc, sd * hs * 0.3, hs * 0.38 + hs * ear / 2, hs * 0.05, { rz: -sd * 0.35 }));
    const hn = o.horns, hcol = o.hornCol || 0x6b5a44;
    if (hn === 'roe') for (const sd of [1, -1]) { head.add(bar([sd * hs * 0.15, hs * 0.35, hs * 0.2], [sd * hs * 0.2, hs * 0.9, hs * 0.15], 0.035, hcol)); head.add(bar([sd * hs * 0.18, hs * 0.65, hs * 0.18], [sd * hs * 0.2, hs * 0.75, hs * 0.38], 0.03, hcol)); }
    if (hn === 'stag') for (const sd of [1, -1]) { const b0 = [sd * hs * 0.18, hs * 0.35, hs * 0.15], b1 = [sd * hs * 0.75, hs * 1.4, -hs * 0.25], b2 = [sd * hs * 0.95, hs * 2.1, -hs * 0.05];
      head.add(bar(b0, b1, 0.05, hcol)); head.add(bar(b1, b2, 0.045, hcol)); head.add(bar([sd * hs * 0.4, hs * 0.75, 0], [sd * hs * 0.45, hs * 0.85, hs * 0.5], 0.04, hcol)); head.add(bar(b1, [sd * hs * 0.75, hs * 1.6, hs * 0.35], 0.04, hcol)); head.add(bar(b2, [sd * hs * 1.25, hs * 2.3, -hs * 0.2], 0.035, hcol)); }
    if (hn === 'moose') for (const sd of [1, -1]) { head.add(bar([sd * hs * 0.2, hs * 0.35, 0], [sd * hs * 0.75, hs * 0.55, -hs * 0.05], 0.06, 0xb9a27c)); head.add(box(hs * 0.85, 0.05, hs * 0.75, 0xb9a27c, sd * hs * 1.05, hs * 0.7, -hs * 0.05, { rz: sd * 0.35 })); }
    if (hn === 'hook') for (const sd of [1, -1]) { head.add(bar([sd * hs * 0.12, hs * 0.38, hs * 0.2], [sd * hs * 0.14, hs * 0.8, hs * 0.2], 0.03, 0x15110e)); head.add(bar([sd * hs * 0.14, hs * 0.8, hs * 0.2], [sd * hs * 0.14, hs * 0.75, 0.0], 0.028, 0x15110e)); }
    if (hn === 'ibex') for (const sd of [1, -1]) { head.add(bar([sd * hs * 0.13, hs * 0.38, hs * 0.2], [sd * hs * 0.18, hs * 1.0, -hs * 0.2], 0.06, hcol)); head.add(bar([sd * hs * 0.18, hs * 1.0, -hs * 0.2], [sd * hs * 0.2, hs * 1.2, -hs * 0.8], 0.05, hcol)); }
    if (hn === 'curl') for (const sd of [1, -1]) { head.add(bar([sd * hs * 0.2, hs * 0.38, hs * 0.1], [sd * hs * 0.55, hs * 0.5, -hs * 0.25], 0.08, 0xb9a27c)); head.add(bar([sd * hs * 0.55, hs * 0.5, -hs * 0.25], [sd * hs * 0.55, hs * 0.0, -hs * 0.15], 0.075, 0xb9a27c)); head.add(bar([sd * hs * 0.55, hs * 0.0, -hs * 0.15], [sd * hs * 0.5, hs * 0.05, hs * 0.25], 0.07, 0xb9a27c)); }
    if (hn === 'cow') for (const sd of [1, -1]) head.add(bar([sd * hs * 0.3, hs * 0.38, hs * 0.1], [sd * hs * 0.6, hs * 0.55, hs * 0.2], 0.04, 0xe9e2cf));
    if (o.dewlap) head.add(box(hs * 0.12, hs * 0.5, hs * 0.2, col, 0, -hs * 0.55, hs * 0.2));
    const tl = o.tail || 'short', tc = o.tailCol || col, t0 = [0, H + bh * 0.75, -L / 2];
    if (tl === 'short') g.add(bar(t0, [0, H + bh * 0.5, -L / 2 - 0.12], 0.06, tc));
    else if (tl === 'long') g.add(bar(t0, [0, H * 0.45, -L / 2 - 0.25], 0.06, tc));
    else if (tl === 'bushy') { g.add(bar(t0, [0, H * 0.75, -L / 2 - L * 0.6], W * 0.4, tc)); if (o.tip) g.add(box(W * 0.42, W * 0.42, 0.12, o.tip, 0, H * 0.72, -L / 2 - L * 0.62)); }
    else if (tl === 'tuft') { g.add(bar(t0, [0, H * 0.6, -L / 2 - 0.05], 0.04, tc)); g.add(box(0.1, 0.18, 0.1, o.tip || 0x15110e, 0, H * 0.55, -L / 2 - 0.06)); }
    else if (tl === 'curly') g.add(sph(0.06, 5, 3, tc, 0, H + bh * 0.8, -L / 2 - 0.03));
    return g;
  }
  // a kangaroo (upright, the big tail on the ground) and an emu; a wombat; birds sitting (cockatoos), a monkey (sitting), a bear
  function kangaroo(o) { o = o || {}; const g = new THREE.Group(), c = o.col || 0xa8754a, cb = o.belly || 0xd8b48a, s = o.s || 1;
    g.add(box(0.36, 0.22, 0.6, c, 0, 0.11, 0.05)); for (const sd of [1, -1]) { g.add(box(0.12, 0.35, 0.3, c, sd * 0.16, 0.3, -0.05, { rx: 0.5 })); }
    g.add(tbox(0.38, 0.26, 0.7, 0.36, 0.24, c, 0, 0.32, -0.08, { rx: -0.35 })); g.add(box(0.22, 0.4, 0.04, cb, 0, 0.6, 0.06, { rx: -0.35 }));
    g.add(box(0.2, 0.22, 0.32, c, 0, 1.08, 0.14)); g.add(box(0.12, 0.12, 0.16, c, 0, 1.04, 0.34)); for (const sd of [1, -1]) g.add(box(0.06, 0.18, 0.05, c, sd * 0.07, 1.27, 0.08, { rz: -sd * 0.2 }));
    for (const sd of [1, -1]) g.add(bar([sd * 0.12, 0.8, 0.12], [sd * 0.1, 0.6, 0.3], 0.05, c));
    g.add(bar([0, 0.25, -0.35], [0, 0.05, -1.15], 0.13, c)); g.scale.setScalar(s); return g; }
  function emu() { const g = new THREE.Group(), c = 0x5a4a3c; g.add(sph(0.38, 7, 4, c, 0, 1.0, 0, { s: [0.8, 0.8, 1.15] }));
    for (const sd of [1, -1]) { g.add(bar([sd * 0.1, 0.85, 0], [sd * 0.12, 0.42, 0.05], 0.06, 0x7a6a58)); g.add(bar([sd * 0.12, 0.42, 0.05], [sd * 0.12, 0.02, -0.02], 0.045, 0x7a6a58)); g.add(box(0.1, 0.03, 0.16, 0x4a3e32, sd * 0.12, 0.015, 0.03)); }
    g.add(bar([0, 1.15, 0.28], [0, 1.7, 0.42], 0.08, 0x6a7a8a)); g.add(box(0.12, 0.12, 0.18, 0x3a3a3a, 0, 1.74, 0.48)); g.add(box(0.05, 0.04, 0.1, 0x2a2420, 0, 1.72, 0.6)); return g; }
  function wombat() { const g = new THREE.Group(), c = 0x7a6a5a; g.add(sph(0.3, 7, 4, c, 0, 0.3, 0, { s: [0.9, 0.75, 1.3] })); g.add(box(0.26, 0.22, 0.22, c, 0, 0.32, 0.38)); g.add(box(0.14, 0.1, 0.06, 0x2a2420, 0, 0.3, 0.5));
    for (const [x, z] of [[0.15, 0.2], [-0.15, 0.2], [0.15, -0.2], [-0.15, -0.2]]) g.add(box(0.1, 0.14, 0.1, c, x, 0.07, z)); return g; }
  function bird(col, crest) { const g = new THREE.Group(); g.add(sph(0.12, 6, 3, col || 0xf2f2ee, 0, 0.14, 0, { s: [0.8, 1.0, 1.3] })); g.add(sph(0.07, 5, 3, col || 0xf2f2ee, 0, 0.27, 0.08)); g.add(box(0.04, 0.04, 0.06, 0x2a2420, 0, 0.26, 0.15));
    if (crest) g.add(box(0.03, 0.1, 0.06, crest, 0, 0.35, 0.05, { rx: -0.4 })); g.add(box(0.06, 0.03, 0.14, col || 0xf2f2ee, 0, 0.1, -0.15)); return g; }
  function bear(col) { const g = new THREE.Group(), c = col || 0x5a3c26; g.add(tbox(0.75, 0.7, 0.75, 1.5, 1.3, c, 0, 0.45, 0)); g.add(sph(0.38, 7, 4, c, 0, 1.0, 0.35, { half: true }));
    for (const [x, z] of [[0.25, 0.5], [-0.25, 0.5], [0.25, -0.5], [-0.25, -0.5]]) g.add(box(0.22, 0.5, 0.25, c, x, 0.25, z)); g.add(box(0.42, 0.4, 0.4, c, 0, 0.9, 0.85)); g.add(box(0.22, 0.2, 0.22, 0x8a6a4a, 0, 0.82, 1.1));
    for (const sd of [1, -1]) g.add(box(0.12, 0.12, 0.06, c, sd * 0.17, 1.14, 0.8)); g.add(box(0.08, 0.06, 0.04, 0x15110e, 0, 0.86, 1.22)); return g; }
  function monkey(col, face) { const g = new THREE.Group(), c = col || 0x8a7a6a; g.add(sph(0.2, 6, 4, c, 0, 0.3, 0, { s: [1, 1.3, 0.9] })); g.add(sph(0.13, 6, 4, c, 0, 0.62, 0.03)); g.add(box(0.14, 0.12, 0.05, face || 0xd86a5a, 0, 0.6, 0.15));
    for (const sd of [1, -1]) { g.add(bar([sd * 0.15, 0.42, 0.05], [sd * 0.12, 0.1, 0.22], 0.06, c)); g.add(box(0.1, 0.1, 0.28, c, sd * 0.12, 0.06, 0.12)); } g.add(bar([0, 0.18, -0.15], [0, 0.05, -0.55], 0.04, c)); return g; }
  // the species by kind (also used to say which country gets which)
  const SPECIES = {
    roe: () => beast({ L: 0.95, H: 0.62, W: 0.3, col: 0x9a5a32, belly: 0xc8a888, rump: 0xf0ece4, legs: 0x8a5a3a, neck: 0.38, nk: 1.0, hs: 0.2, snout: 0.6, ears: 0.55, horns: 'roe', tail: 'none' }),
    roeF: () => beast({ L: 0.9, H: 0.6, W: 0.28, col: 0x9a5a32, belly: 0xc8a888, rump: 0xf0ece4, legs: 0x8a5a3a, neck: 0.36, nk: 0.9, hs: 0.19, ears: 0.6, tail: 'none', graze: true }),
    stag: () => beast({ L: 1.6, H: 1.0, W: 0.5, col: 0x7a4a2a, neckCol: 0x5a3a24, legs: 0x5a3a24, rump: 0xd8c09a, neck: 0.6, nk: 1.05, hs: 0.32, snout: 0.7, ears: 0.5, horns: 'stag', tail: 'short' }),
    hind: () => beast({ L: 1.45, H: 0.95, W: 0.45, col: 0x8a5a32, legs: 0x6a4a2a, rump: 0xd8c09a, neck: 0.55, nk: 0.5, hs: 0.3, ears: 0.55, tail: 'short', graze: true }),
    boar: () => beast({ L: 1.25, H: 0.42, W: 0.42, bh: 0.5, col: 0x3a322c, legs: 0x2a241f, neck: 0.12, nk: 0.1, hs: 0.36, snout: 1.0, snoutCol: 0x2a241f, nose: 0x8a6a5a, ears: 0.3, tail: 'tuft', mane: 0x2a241f }),
    piglet: () => { const p = beast({ L: 0.5, H: 0.2, W: 0.2, bh: 0.2, col: 0x8a6a4a, neck: 0.04, nk: 0.1, hs: 0.16, snout: 0.9, ears: 0.3, tail: 'short' }); p.add(box(0.21, 0.04, 0.48, 0xd8c09a, 0, 0.36, 0)); return p; },
    fox: () => beast({ L: 0.7, H: 0.38, W: 0.2, bh: 0.22, col: 0xd86a24, belly: 0xf2ece4, legs: 0x2a221c, neck: 0.18, nk: 0.6, hs: 0.17, snout: 0.9, snoutCol: 0xd86a24, ears: 0.7, earCol: 0x2a221c, tail: 'bushy', tip: 0xf2f0ea }),
    hare: () => beast({ L: 0.48, H: 0.2, W: 0.22, bh: 0.26, col: 0x8a7258, neck: 0.08, nk: 1.0, hs: 0.15, snout: 0.5, ears: 1.3, tail: 'curly', tailCol: 0xf2f0ea }),
    moose: () => beast({ L: 2.1, H: 1.35, W: 0.62, bh: 0.75, col: 0x3a2a1e, legs: 0x8a7a68, neck: 0.55, nk: 0.45, hs: 0.42, snout: 1.0, ears: 0.45, horns: 'moose', dewlap: true, tail: 'short', hump: true }),
    reindeer: () => beast({ L: 1.5, H: 0.9, W: 0.45, col: 0x7a6a5a, neckCol: 0xe9e2cf, legs: 0x6a5a4a, neck: 0.5, nk: 0.7, hs: 0.3, ears: 0.4, horns: 'stag', hornCol: 0xb9a27c, tail: 'short', rump: 0xe9e2cf }),
    chamois: () => beast({ L: 1.05, H: 0.62, W: 0.32, col: 0x5a4632, head: 0xe9e2cf, legs: 0x3a2e24, neck: 0.3, nk: 0.9, hs: 0.2, ears: 0.5, horns: 'hook', tail: 'short' }),
    ibex: () => beast({ L: 1.25, H: 0.72, W: 0.4, col: 0x8a7a64, legs: 0x5a4a3a, neck: 0.3, nk: 0.8, hs: 0.24, ears: 0.4, horns: 'ibex', hornCol: 0x7a6a54, tail: 'short' }),
    cow: () => beast({ L: 1.9, H: 0.9, W: 0.62, bh: 0.65, col: 0xf2efe6, legs: 0xe9e2cf, neck: 0.25, nk: 0.2, hs: 0.36, snout: 0.7, snoutCol: 0xe8b8a8, ears: 0.3, horns: 'cow', tail: 'long', graze: true, belly: 0x5a3a24 }),
    cowB: () => beast({ L: 1.9, H: 0.9, W: 0.62, bh: 0.65, col: 0x8a5a3a, legs: 0x7a4a2a, neck: 0.25, nk: 0.2, hs: 0.36, snout: 0.7, ears: 0.3, horns: 'cow', tail: 'long' }),
    sheep: () => beast({ L: 1.0, H: 0.48, W: 0.5, bh: 0.5, col: 0xe9e4d6, legs: 0x2a241f, head: 0x2a241f, neck: 0.15, nk: 0.3, hs: 0.2, ears: 0.3, tail: 'short', graze: true }),
    bighorn: () => beast({ L: 1.25, H: 0.78, W: 0.42, col: 0x7a5a3a, legs: 0x6a4a2a, rump: 0xe9e2cf, neck: 0.3, nk: 0.7, hs: 0.26, ears: 0.35, horns: 'curl', tail: 'short' }),
    bison: () => beast({ L: 2.4, H: 1.0, W: 0.85, bh: 0.9, col: 0x4a3222, humpCol: 0x3a2618, legs: 0x2a1c12, neck: 0.15, nk: -0.2, hs: 0.5, snout: 0.5, ears: 0.25, horns: 'cow', tail: 'tuft', hump: true, mane: 0x2a1c12 }),
    elk: () => beast({ L: 1.75, H: 1.15, W: 0.55, col: 0x8a6a4a, neckCol: 0x4a3222, legs: 0x4a3222, rump: 0xd8c09a, neck: 0.65, nk: 0.95, hs: 0.34, snout: 0.7, ears: 0.5, horns: 'stag', tail: 'short' }),
    coyote: () => beast({ L: 0.75, H: 0.45, W: 0.22, bh: 0.24, col: 0xa88a64, belly: 0xd8c8a8, neck: 0.2, nk: 0.6, hs: 0.18, snout: 0.9, ears: 0.6, tail: 'bushy', tip: 0x2a221c }),
    capybara: () => beast({ L: 1.0, H: 0.32, W: 0.45, bh: 0.48, col: 0x8a5a3a, neck: 0.08, nk: 0.2, hs: 0.3, snout: 0.9, ears: 0.2, tail: 'none' }),
    guanaco: () => beast({ L: 1.2, H: 0.9, W: 0.38, col: 0xb07a4a, belly: 0xe9e2cf, head: 0x8a8a8a, neck: 0.75, nk: 1.25, hs: 0.2, snout: 0.8, ears: 0.6, tail: 'short' }),
    camel: () => beast({ L: 2.0, H: 1.3, W: 0.6, bh: 0.6, col: 0xc89a64, neck: 0.85, nk: 0.55, hs: 0.3, snout: 0.9, ears: 0.25, tail: 'tuft', hump: true }),
    donkey: () => beast({ L: 1.3, H: 0.8, W: 0.42, col: 0x8a8278, belly: 0xd8d2c8, neck: 0.4, nk: 0.8, hs: 0.3, snout: 0.8, snoutCol: 0xd8d2c8, ears: 1.0, tail: 'tuft', mane: 0x3a342e }),
    horse: () => beast({ L: 1.9, H: 1.15, W: 0.55, col: 0x6a3e22, legs: 0x3a2214, neck: 0.75, nk: 0.85, hs: 0.3, snout: 1.0, ears: 0.4, tail: 'long', tailCol: 0x2a1a10, mane: 0x2a1a10 }),
    buffalo: () => beast({ L: 2.1, H: 0.85, W: 0.75, bh: 0.75, col: 0x3a3a3c, neck: 0.2, nk: 0.1, hs: 0.42, snout: 0.6, ears: 0.3, horns: 'curl', tail: 'tuft' }),
    sika: () => beast({ L: 1.25, H: 0.8, W: 0.38, col: 0x8a5a32, belly: 0xe9e2cf, rump: 0xf2f0ea, neck: 0.45, nk: 1.0, hs: 0.26, ears: 0.55, horns: 'roe', tail: 'short' }),
    kangaroo: () => kangaroo(), joey: () => kangaroo({ s: 0.6, col: 0xb8855a }), emu, wombat,
    cockatoo: () => bird(0xf2f2ee, 0xf2d21a), galah: () => bird(0xe88aa0), magpie: () => bird(0x15171c),
    bear, blackbear: () => bear(0x1d1a18), macaque: () => monkey(0x8a7a6a, 0xd86a5a), baboon: () => monkey(0x7a6a4a, 0x3a2e24), langur: () => monkey(0x9a9a92, 0x2a2a2a),
  };
  function animal(kind) { const f = SPECIES[kind]; const a = f ? f() : quad({ L: 1, H: 0.6, col: 0x8a6a4a }); a.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); a.userData.kind = kind; return a; }

  /* ---------------- elementi v gozdu ---------------- */
  // a hunting stand (preža / Hochsitz): four legs, a cabin with a roof, a ladder; the window faces +z
  function huntStand(o) { o = o || {}; const g = new THREE.Group(), wd = 0x7a5a3a, H = o.h || 3.4;
    for (const [x, z] of [[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]) g.add(bar([x * 1.3, 0, z * 1.3], [x, H, z], 0.12, wd));
    g.add(box(1.7, 0.1, 1.7, 0x8a6a45, 0, H, 0)); g.add(box(1.6, 1.0, 1.6, 0x8a6a45, 0, H + 0.55, 0)); g.add(box(1.0, 0.35, 0.06, 0x2a2420, 0, H + 0.85, 0.8));
    g.add(box(2.0, 0.1, 2.0, 0x3a3a3c, 0, H + 1.25, 0, { rx: 0.18 })); for (const sd of [1, -1]) g.add(bar([sd * 0.25, 0, 1.9], [sd * 0.25, H, 0.85], 0.06, wd)); for (let y = 0.4; y < H; y += 0.4) g.add(box(0.5, 0.05, 0.05, wd, 0, y, 1.9 - y / H * 1.05)); return g; }
  function feedRack() { const g = new THREE.Group(), wd = 0x7a5a3a; for (const [x, z] of [[1, 0.6], [-1, 0.6], [1, -0.6], [-1, -0.6]]) g.add(box(0.1, 1.6, 0.1, wd, x, 0.8, z));
    g.add(tbox(1.6, 1.8, 0.7, 0.4, 1.0, 0xc8b070, 0, 0.6, 0)); g.add(box(2.4, 0.08, 1.6, 0x5a4632, 0, 1.75, 0.35, { rx: 0.35 })); g.add(box(2.4, 0.08, 1.6, 0x5a4632, 0, 1.75, -0.35, { rx: -0.35 })); return g; }
  function logPile(L, n) { const g = new THREE.Group(); L = L || 5; n = n || 3; const cols = [0x9a7a54, 0x8a6a45, 0xa88a5a];
    for (let r = 0; r < n; r++) for (let k = 0; k < 4 - (r > 1 ? 1 : 0); k++) { const z = (k - 1.5 + r * 0.5) * 0.42; const m = cyl(0.21, 0.21, L - r * 0.4, 7, cols[(r + k) % 3], 0, 0.21 + r * 0.38, z, { rz: Math.PI / 2 }); g.add(m); g.add(cyl(0.19, 0.19, L - r * 0.4 + 0.02, 7, 0xd8b88a, 0, 0.21 + r * 0.38, z, { rz: Math.PI / 2, s: [1, 1, 1] })); }
    return g; }
  function fallenTree(L) { const g = new THREE.Group(); L = L || 7; g.add(cyl(0.22, 0.32, L, 7, 0x6b5a48, L / 2, 0.28, 0, { rz: Math.PI / 2 })); g.add(cyl(0.3, 0.3, 0.02, 7, 0xb89a6a, 0.01, 0.28, 0, { rz: Math.PI / 2 }));
    for (let k = 0; k < 4; k++) g.add(bar([L * (0.4 + k * 0.15), 0.35, 0], [L * (0.45 + k * 0.15), 0.9, (k % 2 ? 1 : -1) * 0.7], 0.06, 0x5a4a3a));
    g.add(mesh(flat(new THREE.DodecahedronGeometry(0.5, 0)), lam(0x5a4632), -0.2, 0.3, 0, { s: [0.7, 0.9, 1.3] })); return g; }
  const stump = () => grp(cyl(0.3, 0.38, 0.45, 8, 0x6b5a48, 0, 0.22, 0), cyl(0.28, 0.28, 0.02, 8, 0xc8a878, 0, 0.455, 0));
  function cabin(col, roof) { const g = new THREE.Group(); col = col || 0x7a5a3a;
    g.add(box(4.2, 2.4, 3.4, col, 0, 1.2, 0)); for (let y = 0.25; y < 2.4; y += 0.3) g.add(box(4.25, 0.04, 3.45, 0x5a4026, 0, y, 0));
    const sh = new THREE.Shape(); sh.moveTo(-2.1, 0); sh.lineTo(2.1, 0); sh.lineTo(0, 1.5); const rg = flat(new THREE.ExtrudeGeometry(sh, { depth: 5.0, bevelEnabled: false })); const rf = new THREE.Mesh(rg, lam(roof || 0x3a3a3c)); rf.position.set(0, 2.4, -2.5); rf.castShadow = rf.receiveShadow = true; g.add(rf);
    g.add(box(0.9, 1.8, 0.06, 0x3a2a1a, -0.8, 0.9, 1.72)); g.add(box(0.8, 0.6, 0.06, 0x2a3440, 1.0, 1.4, 1.72)); g.add(box(0.45, 1.4, 0.45, 0x6f6a62, 1.3, 3.0, -0.6));
    const sm = smoke(5, 4, 0xc9ccd0, 0.45, 2); sm.position.set(1.3, 3.7, -0.6); g.add(sm); return g; }
  function beehive() { const g = new THREE.Group(), cols = [0xd8262a, 0xf0c22e, 0x2f63c9, 0x2f9a48, 0xf2f2ee, 0xe85a2a];   // a painted bee house (čebelnjak)
    g.add(box(3.2, 1.5, 1.2, 0x7a5a3a, 0, 0.75, 0)); for (let k = 0; k < 6; k++) for (let r = 0; r < 2; r++) g.add(box(0.48, 0.55, 0.04, cols[(k + r * 3) % 6], -1.3 + k * 0.52, 0.45 + r * 0.62, 0.62));
    g.add(box(3.6, 0.1, 1.8, 0x8a3a24, 0, 1.6, 0.1, { rx: -0.15 })); for (const x of [-1.6, 1.6]) g.add(box(0.12, 1.6, 0.12, 0x5a4026, x, 0.8, 0.6)); return g; }
  function hayrack() { const g = new THREE.Group(), wd = 0x6b5034;   // a Slovenian hayrack (kozolec): posts, slats with hay, a roof
    for (const x of [-3, -1, 1, 3]) g.add(box(0.2, 4.0, 0.2, wd, x, 2.0, 0)); for (let y = 0.6; y < 3.6; y += 0.4) g.add(box(6.4, 0.06, 0.08, wd, 0, y, 0));
    g.add(box(6.0, 1.6, 0.25, 0xc8b070, 0, 1.4, 0.05)); g.add(box(7.0, 0.1, 1.6, 0x8a3a24, 0, 4.15, 0.4, { rx: 0.4 })); g.add(box(7.0, 0.1, 1.6, 0x8a3a24, 0, 4.15, -0.4, { rx: -0.4 })); return g; }
  function waterTank(col) { const g = new THREE.Group(); g.add(cyl(1.3, 1.3, 2.2, 14, col || 0xb9bdc4, 0, 1.4, 0)); for (let y = 0.5; y < 2.4; y += 0.25) g.add(cyl(1.32, 1.32, 0.04, 14, 0x9aa0a8, 0, y, 0));
    g.add(cyl(0.2, 1.35, 0.35, 14, col || 0xb9bdc4, 0, 2.65, 0)); g.add(box(1.2, 0.3, 1.2, 0x8a8478, 0, 0.15, 0)); return g; }
  function windpump() { const g = new THREE.Group(), st = 0x9aa0a8;   // an outback windmill
    for (const [x, z] of [[0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9]]) g.add(bar([x, 0, z], [x * 0.2, 8, z * 0.2], 0.08, st)); for (let y = 2; y < 8; y += 2) g.add(box(1.8 - y * 0.18, 0.05, 0.05, st, 0, y, 0.9 - y * 0.09));
    const rotor = new THREE.Group(); rotor.position.set(0, 8.4, 0.3); g.add(rotor); for (let k = 0; k < 14; k++) { const b = box(0.28, 1.3, 0.03, 0xdcdcd6, 0, 0.9, 0); const p = new THREE.Group(); p.add(b); p.rotation.z = k / 14 * TAU; rotor.add(p); }
    g.add(box(0.3, 0.3, 1.6, st, 0, 8.4, -0.6)); g.add(box(0.04, 1.0, 1.4, 0xdcdcd6, 0, 8.4, -1.5)); return g; }
  function vending() { return grp(box(1.0, 1.85, 0.75, 0xd8262a, 0, 0.93, 0), box(0.85, 1.1, 0.04, 0xf2f2ee, 0, 1.15, 0.38, { basic: true }), box(0.8, 0.12, 0.05, 0x15171c, 0, 0.35, 0.39)); }
  function torii(col) { const g = new THREE.Group(); col = col || 0xd8432a; for (const x of [-1.4, 1.4]) g.add(cyl(0.14, 0.16, 3.2, 8, col, x, 1.6, 0)); g.add(box(4.0, 0.22, 0.32, 0x15171c, 0, 3.3, 0)); g.add(box(3.4, 0.15, 0.22, col, 0, 2.7, 0)); return g; }
  function stoneLantern() { return grp(box(0.5, 0.15, 0.5, 0x9a9a92, 0, 0.07, 0), cyl(0.1, 0.12, 0.7, 6, 0x9a9a92, 0, 0.5, 0), box(0.45, 0.35, 0.45, 0x9a9a92, 0, 1.0, 0), cyl(0.0, 0.42, 0.3, 4, 0x8a8a82, 0, 1.33, 0, { ry: Math.PI / 4 })); }
  function cactus(h) { h = h || 2.4; const g = new THREE.Group(), c = 0x4a7a3a; g.add(cyl(0.2, 0.22, h, 8, c, 0, h / 2, 0)); g.add(cyl(0.13, 0.13, 0.7, 7, c, 0.42, h * 0.55, 0)); g.add(bar([0.15, h * 0.4, 0], [0.42, h * 0.4, 0], 0.18, c)); g.add(cyl(0.12, 0.12, 0.6, 7, c, -0.38, h * 0.62, 0)); g.add(bar([-0.15, h * 0.48, 0], [-0.38, h * 0.48, 0], 0.16, c)); return g; }
  function mushroomRing() { const g = new THREE.Group(); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; g.add(cyl(0.03, 0.03, 0.12, 5, 0xf2f0ea, Math.cos(a) * 0.6, 0.06, Math.sin(a) * 0.6)); g.add(sph(0.08, 6, 3, 0xc8201c, Math.cos(a) * 0.6, 0.12, Math.sin(a) * 0.6, { half: true })); } return g; }
  function signPost(col) { const g = new THREE.Group(); g.add(box(0.1, 2.0, 0.1, 0x7a5a3a, 0, 1.0, 0)); g.add(box(0.9, 0.2, 0.04, col || 0xf2d21a, 0.35, 1.7, 0)); g.add(box(0.8, 0.2, 0.04, col || 0xf2d21a, -0.3, 1.4, 0.0, { ry: 0.6 })); return g; }

  window.LJ = { person, pose, put, hold, item, setJ, seed, rnd, pick, box, tbox, cyl, sph, bar, grp, at, lam, bas, smoke, glow, canvasTex, signTex, texMat, boardTex,
    motorhome, car, caravan, tentDome, tentRidge, gazebo, campfire, logBench, grillKettle, table, chair, cooler, crates, tvSet, sofa, generator, satDish, mat, boombox,
    house, picketFence, clothesline, woodpile, chopBlock, bench, swing, dog, scaffold, stand, seated, marshalPost, fireTruck, gate, policeBike, foodTruck, highTable,
    pitWall, tyreStack, warmers, toolChest, teamTruck, wheel, frame, place, placeP, clearAround, hideCrowd, clearProps, camTower, bag, stool, trolley, headItem, parasol, flagPole, bike, hammock, kidPool, stringLights, gasBottle, trashBag, bin, portaloo, beerSet, van, tractor, trampoline, bigScreen, quad, scooter, cone, fanBanner, mower, wheelbarrow, fridge, pullBar, dumbbell, beanBag, mailbox, flowerBed, shed, pitStand, mediaVan, hoseLine, heras, beast, animal, SPECIES, huntStand, feedRack, logPile, fallenTree, stump, cabin, beehive, hayrack, waterTank, windpump, vending, torii, stoneLantern, cactus, mushroomRing, signPost, SHIRT, PANTS, SKIN, HAIR };
})();
