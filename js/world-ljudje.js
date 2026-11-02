/* People by the track (the user's wishes, 1. 11. 2026, docs/ljudje-predlogi.md: »veliko manj« people, most of them at the circuits, in the
   grandstands and as the staff; along the long roads groups of 2-10 who do their own thing before the car comes and run to the fence to watch it
   pass; »za ljudi si vzemi čas in dobro naredi različne elemente na različna mesta«). World.people(o) runs at the end of every build, after
   World.life (finish in js/world.js). Each scene stands beyond the barrier where the chase camera sees it coming: its things are built once with
   THREE and baked into one vertex-coloured mesh and one unlit mesh (the fire, the lights, the screens); its people are one mesh posed on the CPU
   (their joints from poseJ) only while the scene is near the camera and in its view. They follow the car the camera follows: ~2.8 s before it
   comes they leave what they do and run (~5 m/s) to the fence, cheer with their heads turned after it, and ~4 s after it has passed walk back;
   the staff do not run, they work and watch. The trees, the old crowd's figures and the glades' things where a scene stands are taken out. No
   textures, no writing, no names (CLAUDE.md). World.update with no car: every scene in its first pose (the world test's fingerprint). */
(function () {
  if (typeof World === 'undefined') return;
  const TAU = Math.PI * 2;

  /* ---------------- the kit (THREE, only while building: everything is baked into arrays) ---------------- */
  const MC = new Map(), GC = new Map();
  const lam = (c) => { let m = MC.get(c); if (!m) MC.set(c, m = new THREE.MeshLambertMaterial({ color: c })); return m; };
  const bas = (c) => { const k = -1 - c; let m = MC.get(k); if (!m) MC.set(k, m = new THREE.MeshBasicMaterial({ color: c })); return m; };
  const gBox = (w, h, d) => { const k = 'b' + w + ',' + h + ',' + d; let g = GC.get(k); if (!g) GC.set(k, g = new THREE.BoxGeometry(w, h, d)); return g; };
  const gCyl = (rt, rb, h, n) => { const k = 'c' + rt + ',' + rb + ',' + h + ',' + n; let g = GC.get(k); if (!g) GC.set(k, g = new THREE.CylinderGeometry(rt, rb, h, n)); return g; };
  const gSph = (r, w, h, half) => { const k = 's' + r + ',' + w + ',' + h + ',' + half; let g = GC.get(k); if (!g) GC.set(k, g = new THREE.SphereGeometry(r, w, h, 0, TAU, 0, half ? Math.PI / 2 : Math.PI)); return g; };
  const gTBox = (wb, wt, h, db, dt) => { const k = 't' + [wb, wt, h, db, dt]; let g = GC.get(k); if (g) return g;   // a tapered box, its origin at the bottom
    g = new THREE.BoxGeometry(1, 1, 1); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const top = p.getY(i) > 0; p.setXYZ(i, p.getX(i) * (top ? wt : wb), p.getY(i) * h + h / 2, p.getZ(i) * (top ? dt : db)); }
    GC.set(k, g); return g; };
  function mesh(g, mt, x, y, z, o) {
    const e = new THREE.Mesh(g, mt); e.position.set(x || 0, y || 0, z || 0);
    if (o) { if (o.rx) e.rotation.x = o.rx; if (o.ry) e.rotation.y = o.ry; if (o.rz) e.rotation.z = o.rz; if (o.order) e.rotation.order = o.order; if (o.s) e.scale.set(o.s[0], o.s[1], o.s[2]); }
    return e;
  }
  const M = (c, o) => (o && o.basic ? bas(c) : lam(c));
  const box = (w, h, d, c, x, y, z, o) => mesh(gBox(w, h, d), M(c, o), x, y, z, o);
  const tbox = (wb, wt, h, db, dt, c, x, y, z, o) => mesh(gTBox(wb, wt, h, db, dt), M(c, o), x, y, z, o);
  const cyl = (rt, rb, h, n, c, x, y, z, o) => mesh(gCyl(rt, rb, h, n), M(c, o), x, y, z, o);
  const sph = (r, w, h, c, x, y, z, o) => mesh(gSph(r, w, h, o && o.half), M(c, o), x, y, z, o);
  const grp = (...ch) => { const g = new THREE.Group(); for (const c of ch) if (c) g.add(c); return g; };
  const UP = new THREE.Vector3(0, 1, 0);
  function bar(a, b, t, c, o) {   // a box from a to b (rails, legs, ropes)
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
    const e = mesh(gBox(t, L, t), M(c, o), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); e.quaternion.setFromUnitVectors(UP, new THREE.Vector3(dx / L, dy / L, dz / L)); return e;
  }
  let rs = 1; const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; }, seed = (s) => { rs = (Math.abs(s | 0) % 2147483646) + 1; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  // where smoke rises (a grill, a campfire, a chimney): a marker, its puffs drawn by the scene's smoke (smokeStep)
  function smoke(n, h, col, op, spread) { const o = new THREE.Object3D(); o.userData.smoke = { n: Math.min(6, n), h, col, op, spread: spread || 2.2 }; return o; }

  /* ---------------- baking: a model's triangles into arrays ---------------- */
  // L: the lit triangles (P positions, N normals, C colours), U: the unlit ones (MeshBasic parts: flames, lamps, screens; P, C), each in the frame of
  // `base` (a Matrix4; null: as the model stands); faces looking straight down are dropped (no camera sees them), degenerate ones too
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _mw = new THREE.Matrix4(), _inv = new THREE.Matrix4();
  function bake(g, base, L, U) {
    g.updateMatrixWorld(true); if (base) _inv.copy(base).invert();
    g.traverse(m => {
      if (!m.isMesh || !m.visible) return;
      const geo = m.geometry, pa = geo.attributes.position, ix = geo.index, n = ix ? ix.count : pa.count, col = m.material.color, D = m.material.isMeshBasicMaterial ? U : L;
      if (!D) return;
      _mw.copy(m.matrixWorld); if (base) _mw.premultiply(_inv);
      const fl = _mw.determinant() < 0;   // (a mirrored part: its triangles turned the other way)
      for (let t = 0; t + 2 < n; t += 3) {
        const k1 = fl ? t + 2 : t + 1, k2 = fl ? t + 1 : t + 2;
        _a.fromBufferAttribute(pa, ix ? ix.getX(t) : t).applyMatrix4(_mw); _b.fromBufferAttribute(pa, ix ? ix.getX(k1) : k1).applyMatrix4(_mw); _c.fromBufferAttribute(pa, ix ? ix.getX(k2) : k2).applyMatrix4(_mw);
        const ux = _b.x - _a.x, uy = _b.y - _a.y, uz = _b.z - _a.z, vx = _c.x - _a.x, vy = _c.y - _a.y, vz = _c.z - _a.z;
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz); if (l < 1e-7) continue;
        nx /= l; ny /= l; nz /= l; if (ny < -0.97) continue;
        D.P.push(_a.x, _a.y, _a.z, _b.x, _b.y, _b.z, _c.x, _c.y, _c.z);
        if (D.N) D.N.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
        D.C.push(col.r, col.g, col.b, col.r, col.g, col.b, col.r, col.g, col.b);
      }
    });
  }

  /* ---------------- the person ----------------
     1.78 m, facing local +z (its left +x), as in tools/ljudje/ljudje3d.js: hips (height, tilt), torso, head, shoulders (z: out to the side, x:
     forwards), elbows, hips' joints, knees. o: shirt, pants, skin, hair ('short' | 'long' | 'bald' | 'pony'), hat ('cap' | 'helmet' | 'hard' |
     'beanie' | 'police' | 'fire'), hatCol, long (sleeves), shorts, vest (a high-visibility vest's colour), stripes, belt, shoes, gloves, scale, kid.
     The joints are THREE groups: only their matrices are used, the figure is baked per joint (rig) and drawn as one mesh per scene */
  const SKIN = [0xf1c9a5, 0xe0ac87, 0xc68b62, 0x8d5a3b, 0x5e3b26];
  const HAIR = [0x2a1d14, 0x4a2f1c, 0x7a5532, 0xb08850, 0x8a8a88, 0x15110e];
  const SHIRT = [0xd23a2c, 0x2f63c9, 0xf0c22e, 0xefefea, 0x2f9a48, 0xf07a1c, 0x262a33, 0x8a3b8c, 0x22848f, 0xb8bcc4, 0x7c4a2e, 0x31406e];
  const PANTS = [0x2f3f63, 0x1d1f25, 0x5b5040, 0x47494f, 0x6a6f78, 0x3a4a3a];
  function person(o) {
    o = o || {};
    const skin = o.skin != null ? o.skin : pick(SKIN), shirt = o.shirt != null ? o.shirt : pick(SHIRT), pants = o.pants != null ? o.pants : pick(PANTS);
    const hair = o.hairCol != null ? o.hairCol : pick(HAIR), shoes = o.shoes != null ? o.shoes : 0x24262b, long = !!o.long, hands = o.gloves != null ? o.gloves : skin;
    const root = new THREE.Group(), P = { root, o, sh: [], el: [], hand: [], hp: [], kn: [] }, lite = !!o.lite;
    P.sc = (o.scale || 0.97) * (o.kid ? 0.62 : 1);
    const hips = P.hips = new THREE.Group(); hips.position.y = 0.92; root.add(hips);
    if (!lite) hips.add(box(0.33, 0.18, 0.2, pants, 0, 0, 0));   // (lite: the grandstand's crowd, fewer parts)
    const torso = P.torso = new THREE.Group(); torso.position.y = 0.06; hips.add(torso);
    torso.add(tbox(0.31, 0.41, 0.5, 0.2, 0.225, shirt, 0, -0.02, 0));
    if (o.vest != null) {   // a high-visibility vest over the shirt, two reflective bands
      torso.add(tbox(0.335, 0.43, 0.4, 0.225, 0.245, o.vest, 0, 0.04, 0));
      if (!lite) for (const y of [0.13, 0.27]) torso.add(tbox(0.345, 0.345 + (0.43 - 0.335) * (y + 0.035) / 0.4, 0.04, 0.235, 0.25, o.stripes != null ? o.stripes : 0xd9dde2, 0, y, 0));
    }
    if (o.belt) torso.add(box(0.33, 0.05, 0.215, o.belt, 0, 0.0, 0));
    if (!lite) torso.add(box(0.1, 0.08, 0.1, skin, 0, 0.53, 0));
    const head = P.head = new THREE.Group(); head.position.y = 0.56; torso.add(head);
    if (o.kid) head.scale.setScalar(1.22);
    head.add(tbox(0.19, 0.175, 0.23, 0.21, 0.2, skin, 0, 0, 0));
    const hs = o.hat ? null : (o.hair || pick(['short', 'short', 'short', 'long', 'bald', 'pony']));
    if (hs && hs !== 'bald') { head.add(box(0.205, 0.06, 0.215, hair, 0, 0.235, -0.005)); if (!lite) head.add(box(0.2, hs === 'long' ? 0.3 : 0.14, 0.045, hair, 0, hs === 'long' ? 0.1 : 0.165, -0.1));
      if (hs === 'pony' && !lite) head.add(box(0.06, 0.16, 0.06, hair, 0, 0.12, -0.14)); }
    const hc = o.hatCol != null ? o.hatCol : pick(SHIRT);
    if (o.hat === 'cap') { head.add(box(0.205, 0.07, 0.22, hc, 0, 0.25, -0.005)); head.add(box(0.17, 0.02, 0.12, hc, 0, 0.225, 0.155)); }
    else if (o.hat === 'beanie') head.add(box(0.21, 0.11, 0.225, hc, 0, 0.225, -0.005));
    else if (o.hat === 'helmet' || o.hat === 'hard' || o.hat === 'fire') { head.add(sph(0.14, 6, 3, hc, 0, 0.16, 0, { half: true, s: [1, 0.85, 1.08] }));
      if (o.hat !== 'helmet') head.add(cyl(o.hat === 'fire' ? 0.2 : 0.165, o.hat === 'fire' ? 0.2 : 0.165, 0.02, 8, hc, 0, 0.165, o.hat === 'fire' ? -0.02 : 0.02));
      if (o.hat === 'fire') head.add(box(0.2, 0.06, 0.02, 0xd9dde2, 0, 0.21, 0.13)); }
    else if (o.hat === 'police') { head.add(cyl(0.125, 0.115, 0.08, 8, hc, 0, 0.255, 0)); head.add(cyl(0.135, 0.135, 0.02, 8, hc, 0, 0.3, 0)); head.add(box(0.17, 0.02, 0.1, 0x111111, 0, 0.22, 0.14)); }
    for (const sd of [1, -1]) {   // arms: shoulder, elbow, hand (where things are held)
      const sh = new THREE.Group(); sh.position.set(sd * 0.245, 0.45, 0); torso.add(sh); sh.rotation.order = 'ZXY';
      if (long || lite) sh.add(box(0.105, 0.3, 0.11, long ? shirt : skin, 0, -0.14, 0));
      else { sh.add(box(0.115, 0.13, 0.12, shirt, 0, -0.06, 0)); sh.add(box(0.088, 0.19, 0.095, skin, 0, -0.2, 0)); }
      const el = new THREE.Group(); el.position.y = -0.29; sh.add(el);
      el.add(box(0.09, 0.24, 0.095, long ? shirt : skin, 0, -0.12, 0)); if (!lite) el.add(box(0.08, 0.09, 0.06, hands, 0, -0.285, 0));
      const hd = new THREE.Group(); hd.position.y = -0.3; el.add(hd);
      P.sh.push(sh); P.el.push(el); P.hand.push(hd);
    }
    for (const sd of [1, -1]) {   // legs: hip, knee
      const hp = new THREE.Group(); hp.position.set(sd * 0.09, -0.05, 0); hips.add(hp);
      hp.add(box(0.15, 0.43, 0.17, pants, 0, -0.2, 0));
      const kn = new THREE.Group(); kn.position.y = -0.41; hp.add(kn);
      kn.add(box(0.125, 0.38, 0.135, o.shorts ? skin : pants, 0, -0.19, 0)); if (!lite) kn.add(box(0.115, 0.09, 0.27, shoes, 0, -0.415, 0.045));
      P.hp.push(hp); P.kn.push(kn);
    }
    return P;
  }
  // things in a hand (the hand's frame: the arm points down -y, the palm faces in, forwards is +z)
  function item(kind, o) {
    o = o || {};
    if (kind === 'phone') return grp(box(0.075, 0.14, 0.012, 0x15171c, 0, -0.05, 0.02));
    if (kind === 'cup') return grp(cyl(0.042, 0.036, 0.11, 6, o.c || 0xf2f2ee, 0, -0.03, 0.04));
    if (kind === 'can') return grp(cyl(0.033, 0.033, 0.12, 6, o.c || 0xc8c9cc, 0, -0.03, 0.04));
    if (kind === 'bottle') return grp(cyl(0.035, 0.038, 0.2, 6, o.c || 0x2f6b2a, 0, -0.04, 0.04), cyl(0.012, 0.02, 0.07, 5, o.c || 0x2f6b2a, 0, 0.09, 0.04));
    if (kind === 'tongs') return grp(bar([0, 0, 0.02], [0, -0.05, 0.4], 0.02, 0xb9bec6));
    if (kind === 'stick') return grp(bar([0, 0.05, 0.02], [0, -0.25, 1.05], 0.022, 0x8a6a45), cyl(0.024, 0.024, 0.12, 5, 0x9c4a2a, 0, -0.23, 1.0, { rx: 1.3 }));
    if (kind === 'flag') { const g = grp(cyl(0.015, 0.015, 1.5, 4, 0xdedede, 0, 0.55, 0.03)); const cs = o.cols || [0x15171c, 0xd8262a, 0xf2c21a];
      cs.forEach((c, k) => g.add(box(0.012, 0.6 / cs.length, 0.9, c, 0, 1.2 - k * 0.6 / cs.length, 0.48))); return g; }
    if (kind === 'mflag') { const g = grp(cyl(0.013, 0.013, 0.9, 4, 0x5c4630, 0, 0.3, 0.03)); g.add(box(0.012, 0.5, 0.65, o.c || 0xf5d21a, 0, 0.55, 0.36)); return g; }
    if (kind === 'broom') return grp(bar([0, 0.25, 0.02], [0, -0.85, 0.32], 0.028, 0xa07a4a), box(0.42, 0.07, 0.1, 0x3a3027, 0, -0.9, 0.34, { rx: 0.27 }));
    if (kind === 'axe') return grp(bar([0, 0.1, 0.02], [0, -0.62, 0.1], 0.035, 0x9a7546), box(0.04, 0.15, 0.2, 0x8f949b, 0, -0.62, 0.17));
    if (kind === 'camera') return grp(box(0.14, 0.11, 0.11, 0x1b1d22, 0, 0.0, 0.08), cyl(0.05, 0.055, 0.4, 6, o.c || 0xd9dbd7, 0, 0.0, 0.33, { rx: Math.PI / 2 }));
    if (kind === 'ext') return grp(cyl(0.08, 0.08, 0.48, 6, 0xc81f1a, 0, -0.27, 0.03), cyl(0.03, 0.03, 0.06, 5, 0x111111, 0, -0.01, 0.03));
    if (kind === 'radio') return grp(box(0.06, 0.15, 0.04, 0x15171c, 0, -0.02, 0.03), cyl(0.008, 0.008, 0.12, 4, 0x15171c, 0.02, 0.1, 0.03));
    if (kind === 'tire') return grp(cyl(0.33, 0.33, 0.27, 10, 0x17181b, 0, -0.08, 0.3, { rz: Math.PI / 2 }), cyl(0.2, 0.2, 0.28, 8, 0x9ea3aa, 0, -0.08, 0.3, { rz: Math.PI / 2 }));
    if (kind === 'board') {   // the pit board: a dark plate on a pole with three light bars (no writing)
      const g = grp(bar([0, 0.05, 0.02], [0, 0.1, 1.2], 0.03, 0x9ea3aa), box(0.03, 0.5, 0.62, 0x111317, 0, 0.32, 1.3));
      for (let k = 0; k < 3; k++) g.add(box(0.035, 0.07, k ? 0.4 : 0.26, k ? 0xf2f2f2 : 0xffd23a, 0, 0.47 - k * 0.14, 1.3, { basic: true }));
      return g; }
    if (kind === 'baton') return grp(cyl(0.02, 0.02, 0.45, 4, 0xf2f2f2, 0, -0.03, 0.2, { rx: 1.4 }), cyl(0.021, 0.021, 0.1, 4, 0xd8262a, 0, -0.04, 0.38, { rx: 1.4 }));
    if (kind === 'plate') return grp(cyl(0.12, 0.1, 0.02, 8, 0xf4f4f0, 0, -0.04, 0.13), cyl(0.025, 0.025, 0.14, 5, 0x9c4a2a, 0, -0.025, 0.13, { rz: Math.PI / 2 }));
    if (kind === 'wood') return grp(cyl(0.07, 0.07, 0.55, 5, 0x7a5a3a, 0, -0.08, 0.15, { rz: Math.PI / 2 }));
    if (kind === 'crate') return grp(box(0.42, 0.28, 0.32, o.c || 0xe0b020, 0, -0.12, 0.22));
    if (kind === 'horn') return grp(cyl(0.035, 0.035, 0.16, 5, 0xd8262a, 0, 0.0, 0.05), cyl(0.07, 0.02, 0.18, 6, 0xf2f2f2, 0, 0.16, 0.05));
    if (kind === 'clip') return grp(box(0.22, 0.3, 0.02, 0x8f6a3c, 0, -0.06, 0.08, { rx: 0.8 }), box(0.18, 0.24, 0.022, 0xf4f4f0, 0, -0.06, 0.081, { rx: 0.8 }));
    if (kind === 'bag') return grp(box(0.32, 0.3, 0.14, o.c || 0x2a3d6b, 0, -0.22, 0.02));
    if (kind === 'wrench') return grp(box(0.03, 0.03, 0.3, 0xb9bec6, 0, -0.04, 0.15));
    if (kind === 'gun') return grp(box(0.07, 0.16, 0.1, 0x111111, 0, -0.05, 0.04), cyl(0.04, 0.04, 0.22, 5, 0xd8262a, 0, 0.0, 0.18, { rx: Math.PI / 2 }));
    return grp();
  }
  // the figure baked per joint, at rest (every joint at 0): parts { b: the joint's index in P.J, P, N, C (Float32Array, in the joint's frame), k: a held
  // thing's key ('L:' / 'R:' hand, 'H:' head + its kind and options; shown only while held) or null }
  function rig(P, items) {
    const J = P.J = [P.root, P.hips, P.torso, P.head, P.sh[0], P.el[0], P.hand[0], P.sh[1], P.el[1], P.hand[1], P.hp[0], P.kn[0], P.hp[1], P.kn[1]];
    for (const key of items) {   // the things it ever holds: each on its hand (or head)
      const i1 = key.indexOf(':'), i2 = key.indexOf(':', i1 + 1), w = key.slice(0, i1), kind = i2 < 0 ? key.slice(i1 + 1) : key.slice(i1 + 1, i2), oj = i2 < 0 ? null : key.slice(i2 + 1);
      const it = item(kind, oj ? JSON.parse(oj) : null); it.userData.item = key;
      if (w === 'H') { it.position.set(0, 0.12, 0.14); P.head.add(it); } else P.hand[w === 'L' ? 0 : 1].add(it);
    }
    P.root.updateMatrixWorld(true);
    P.parts = []; P.nv = 0;
    J.forEach((j, bi) => {
      const L = { P: [], N: [], C: [] }, its = [];
      for (const ch of j.children) { if (J.includes(ch)) continue; if (ch.userData.item) its.push(ch); else bake(ch, j.matrixWorld, L, L); }
      const add = (D, k) => { if (!D.P.length) return; P.parts.push({ b: bi, P: new Float32Array(D.P), N: new Float32Array(D.N), C: new Float32Array(D.C), k }); P.nv += D.P.length / 3; };
      add(L, null);
      for (const it of its) { const D = { P: [], N: [], C: [] }; bake(it, j.matrixWorld, D, D); add(D, it.userData.item); }
      for (const ch of j.children.slice()) if (!J.includes(ch)) j.remove(ch);   // (only the joints stay)
    });
    return P;
  }
  const keyOf = (h, w) => (w || (h[1] === 0 ? 'L' : 'R')) + ':' + h[0] + (h[2] ? ':' + JSON.stringify(h[2]) : '');   // [kind, hand (0 left, 1 right), options]

  /* ---------------- poses ----------------
     shz: shoulder [out to the side], shx: [forwards], shy: twist, el: elbow (+ bent forwards), hp: hip (+ leg forwards), hpz: leg out, kn: knee (+
     bent back), hy: the hips' height, hz: the hips forwards, hrx: the hips tipped, lean: the torso forwards, tw: the torso turned, tz: tilted sideways,
     look / nod: the head, dy: the whole figure up. t: the motion's phase (radians) */
  function poseJ(name, t) {
    const s = Math.sin(t || 0);
    switch (name) {
      case 'stand': return { shz: [0.07, 0.09] };
      case 'relax': return { shz: [0.1, 0.12], el: [0.25, 0.3], hpz: [0.05, 0.05] };
      case 'walk': return { hp: [0.42 * s, -0.42 * s], kn: [Math.max(0, -s) * 0.7 + 0.1, Math.max(0, s) * 0.7 + 0.1], shx: [-0.35 * s, 0.35 * s], el: [0.35, 0.35], lean: 0.05, hy: 0.9 };
      case 'run': return { hp: [0.85 * s, -0.85 * s], kn: [0.25 + Math.max(0, -s) * 1.5, 0.25 + Math.max(0, s) * 1.5], shx: [-0.75 * s, 0.75 * s], shz: [0.12, 0.12], el: [1.45, 1.45], lean: 0.32, hy: 0.86, dy: 0.04 + 0.05 * Math.abs(s) };
      case 'cheer': return { shz: [2.55 + 0.1 * s, 2.6 - 0.1 * s], shx: [0.25, 0.25], el: [0.25, 0.3], dy: 0.04 * Math.max(0, s) };
      case 'jump': return { shz: [2.75, 2.7], shx: [0.15, 0.15], el: [0.15, 0.2], hp: [0.35 * Math.abs(s), 0.1], kn: [0.6 * Math.abs(s), 0.3 * Math.abs(s)], dy: 0.24 * Math.abs(s) };
      case 'wave': return { shz: [0.1, 2.35 + 0.25 * s], shx: [0, 0.2], el: [0.2, 0.55] };
      case 'wave2': return { shz: [2.3 + 0.25 * s, 0.1], shx: [0.2, 0], el: [0.55, 0.2] };
      case 'point': return { shz: [0.1, 1.45], shx: [0, 0.35], el: [0.1, 0.05] };
      case 'phone': return { shz: [0.25, 0.25], shx: [1.25, 1.25], el: [1.1, 1.1], shy: [-0.35, -0.35], nod: 0.1 };
      case 'phoneUp': return { shz: [0.3, 0.3], shx: [1.75, 1.75], el: [0.65, 0.65], shy: [-0.3, -0.3] };
      case 'fence': return { shz: [0.18, 0.18], shx: [0.95, 0.95], el: [1.35, 1.35], lean: 0.32, hy: 0.9 };
      case 'fenceWave': return { shz: [0.18, 2.4 + 0.25 * s], shx: [0.95, 0.2], el: [1.35, 0.5], lean: 0.2, hy: 0.91 };
      case 'sit': return { hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: -0.08, shz: [0.12, 0.12], shx: [0.35, 0.35], el: [0.9, 0.9] };
      case 'sitDrink': return { hy: 0.5, hp: [1.5, 1.45], kn: [1.45, 1.5], lean: -0.1, shz: [0.12, 0.2], shx: [0.35, 0.55], el: [0.9, 2.2] };
      case 'sitLean': return { hy: 0.5, hp: [1.45, 1.55], kn: [1.4, 1.45], lean: 0.25, shz: [0.1, 0.1], shx: [0.75, 0.75], el: [1.0, 1.0] };
      case 'sitStick': return { hy: 0.5, hp: [1.5, 1.5], kn: [1.45, 1.45], lean: 0.12, shz: [0.15, 0.1], shx: [0.4, 1.1 + 0.08 * s], el: [0.9, 0.3] };
      case 'sitGround': return { hy: 0.14, hp: [1.45, 1.45], kn: [0.25, 0.25], lean: -0.15, shz: [0.2, 0.2], shx: [-0.45, -0.45], el: [0.1, 0.1] };
      case 'sofa': return { hy: 0.5, hp: [1.45, 1.45], kn: [1.4, 1.4], lean: -0.22, shz: [0.15, 0.15], shx: [0.25, 0.25], el: [1.0, 1.0] };
      case 'squat': return { hy: 0.5, hp: [1.75, 1.75], kn: [2.1, 2.1], lean: 0.45, shx: [1.5, 1.5], shz: [0.08, 0.08], el: [0.05, 0.05], hz: -0.15 };
      case 'kneel': return { hy: 0.52, hp: [1.45, -0.15], kn: [1.5, 1.6], lean: 0.12, shx: [1.2, 1.2], el: [1.2, 1.2], shy: [-0.3, -0.3], hz: -0.05 };
      case 'crouchCam': return { hy: 0.55, hp: [1.6, 0.1], kn: [1.9, 1.75], lean: 0.25, shx: [1.35, 1.35], el: [1.35, 1.35], shy: [-0.3, -0.3], hz: -0.1 };
      case 'jack0': return { shz: [2.75, 2.75], hpz: [0.32, 0.32], dy: 0.05 };
      case 'jack1': return { shz: [0.15, 0.15], hpz: [0.02, 0.02] };
      case 'stretch': return { shz: [2.9, 2.9], tz: 0.3 * s, hpz: [0.15, 0.15] };
      case 'grill': return { shz: [0.2, 0.15], shx: [0.25, 0.95 + 0.15 * s], el: [0.6, 0.65 - 0.2 * s], lean: 0.12, shy: [0, -0.1] };
      case 'sweep': return { shz: [0.1, 0.1], shx: [0.75 + 0.25 * s, 0.45 + 0.25 * s], el: [0.6, 0.35], lean: 0.28, hy: 0.88, tw: 0.15 * s };
      case 'chopUp': return { shz: [0.15, 0.15], shx: [2.6, 2.6], el: [0.5, 0.5], lean: -0.1, shy: [-0.3, -0.3], hpz: [0.12, 0.12] };
      case 'chopDown': return { shz: [0.1, 0.1], shx: [0.9, 0.9], el: [0.15, 0.15], lean: 0.5, shy: [-0.3, -0.3], hpz: [0.12, 0.12], hy: 0.88 };
      case 'carry': return { shz: [0.1, 0.1], shx: [0.75, 0.75], el: [1.05, 1.05], shy: [-0.3, -0.3], lean: -0.05 };
      case 'carryWalk': return { hp: [0.4 * s, -0.4 * s], kn: [Math.max(0, -s) * 0.7 + 0.1, Math.max(0, s) * 0.7 + 0.1], shz: [0.1, 0.1], shx: [0.75, 0.75], el: [1.05, 1.05], shy: [-0.3, -0.3], hy: 0.9 };
      case 'push': return { hp: [0.45, -0.35], kn: [0.2, 0.6], shz: [0.1, 0.1], shx: [1.05, 1.05], el: [0.5, 0.5], lean: 0.32, hy: 0.88 };
      case 'arms': return { shz: [0.22, 0.22], shx: [0.55, 0.55], el: [1.95, 1.95], shy: [-0.75, -0.75] };
      case 'hips': return { shz: [0.55, 0.55], shx: [-0.15, -0.15], el: [1.4, 1.4], shy: [0.6, 0.6] };
      case 'drink': return { shz: [0.1, 0.2], shx: [0, 0.55], el: [0.1, 2.25] };
      case 'talk': return { shz: [0.1, 0.18], shx: [0.15, 0.6 + 0.15 * s], el: [0.35, 1.35 - 0.25 * s], look: 0.2 };
      case 'radio': return { shz: [0.1, 0.2], shx: [0.1, 0.5], el: [0.2, 2.35] };
      case 'thumbs': return { shz: [0.1, 0.3], shx: [0, 0.85], el: [0.1, 1.35] };
      case 'flagWave': return { shz: [0.12, 2.0 + 0.4 * s], shx: [0.3, 0.6], el: [0.4, 0.45], lean: 0.05 };
      case 'flagHold': return { shz: [0.1, 0.5], shx: [0.0, 1.0], el: [0.1, 0.4] };
      case 'direct': return { shz: [1.45, 0.25], shx: [0.15, 0.4], el: [0.05 + 0.5 * Math.max(0, s), 1.1] };
      case 'cam': return { shz: [0.15, 0.2], shx: [1.25, 1.2], el: [1.3, 1.35], shy: [-0.35, -0.3] };
      case 'boardOut': return { shz: [0.2, 0.25], shx: [1.2, 1.35], el: [0.2, 0.25], lean: 0.35, hy: 0.9 };
      case 'hang': return { shz: [2.9, 2.9], shx: [0.15, 0.15], el: [0.55 + 1.2 * (0.5 - 0.5 * Math.cos(t || 0)), 0.55 + 1.2 * (0.5 - 0.5 * Math.cos(t || 0))], hp: [0.2, 0.25], kn: [0.6, 0.7], dy: 0.38 * (0.5 - 0.5 * Math.cos(t || 0)) };
      case 'lie': return { shz: [0.35, 0.2], shx: [-0.2, 2.4], el: [0.3, 1.6], hp: [0.05, 0.25], kn: [0.05, 0.5] };
      case 'bend': return { lean: 0.95, hy: 0.89, shx: [1.1, 1.15], shz: [0.1, 0.1], el: [0.3, 0.35], hz: -0.08 };
      case 'fixHood': return { lean: 0.75, hy: 0.9, shx: [1.3 + 0.1 * s, 1.25 - 0.1 * s], shz: [0.15, 0.15], el: [0.6, 0.7], hz: -0.05 };
      default: return {};
    }
  }
  // how a pose of what they do moves on its own (act): another pose to swing to (alt) and how often (hz), or the pose's own motion at a rate
  // (rate: radians a second); others breathe (fidget: the head and the torso a little)
  const MOTION = {
    jack0: { alt: 'jack1', hz: 1.4 }, squat: { alt: 'stand', hz: 0.45 }, chopUp: { alt: 'chopDown', hz: 0.55, snap: true }, sitDrink: { alt: 'sit', hz: 0.12 },
    grill: { rate: 2.2 }, sweep: { rate: 3.0 }, stretch: { rate: 1.1 }, hang: { rate: 2.6 }, talk: { rate: 2.4 }, sitStick: { rate: 1.3 }, direct: { rate: 2.6 },
    cheer: { rate: 1.6 }, jump: { rate: 5.2 }, walk: { rate: 4.5 }, carryWalk: { rate: 4.5 }, fixHood: { rate: 1.6 }, flagWave: { rate: 1.2 },
  };
  const RATE = { cheer: 6.5, jump: 6.0, wave: 7.5, wave2: 7.5, fenceWave: 7.5, flagWave: 6.5, stretch: 2.0, talk: 2.4 };   // (at the fence)
  const DEF = { shz: 0.07, el: 0.08, hy: 0.92 };
  const jv = (J, k, i) => { const a = J[k]; if (a == null) return k === 'shz' ? (i ? 0.09 : 0.07) : DEF[k] || 0; return i == null ? a : a[i]; };
  function mixJ(A, B, f) {   // two poses blended (f 0: A, 1: B)
    if (f <= 0) return A; if (f >= 1) return B;
    const J = {};
    for (const k of ['shz', 'shx', 'shy', 'el', 'hp', 'hpz', 'kn']) J[k] = [jv(A, k, 0) + (jv(B, k, 0) - jv(A, k, 0)) * f, jv(A, k, 1) + (jv(B, k, 1) - jv(A, k, 1)) * f];
    for (const k of ['hy', 'hz', 'hrx', 'lean', 'tw', 'tz', 'look', 'nod', 'dy']) J[k] = jv(A, k) + (jv(B, k) - jv(A, k)) * f;
    return J;
  }
  function setJ(P, J) {
    for (let i = 0; i < 2; i++) {
      const sd = i === 0 ? 1 : -1, sh = P.sh[i];
      sh.rotation.z = sd * jv(J, 'shz', i); sh.rotation.x = -jv(J, 'shx', i); sh.rotation.y = sd * jv(J, 'shy', i);
      P.el[i].rotation.x = -jv(J, 'el', i);
      P.hp[i].rotation.x = -jv(J, 'hp', i); P.hp[i].rotation.z = sd * jv(J, 'hpz', i);
      P.kn[i].rotation.x = jv(J, 'kn', i);
    }
    P.hips.position.y = jv(J, 'hy'); P.hips.position.z = jv(J, 'hz'); P.hips.rotation.x = jv(J, 'hrx');
    P.torso.rotation.x = jv(J, 'lean'); P.torso.rotation.y = jv(J, 'tw'); P.torso.rotation.z = jv(J, 'tz');
    P.head.rotation.y = jv(J, 'look'); P.head.rotation.x = jv(J, 'nod');
  }
  /* ---------------- the things (as in tools/ljudje/ljudje3d.js; no textures and no writing: the screens show coloured blocks) ---------------- */
  const WHITE = 0xf1f0ea, DARKG = 0x20252c, TYRE = 0x16171a;
  const wheel = (r, w, x, y, z) => grp(cyl(r, r, w, 9, TYRE, x, y, z, { rx: Math.PI / 2 }), cyl(r * 0.55, r * 0.55, w + 0.02, 6, 0xb9bec6, x, y, z, { rx: Math.PI / 2 }));
  // a picture on a screen (the race on TV: sky, grass, the road, a car), unlit; w x h, facing +z
  function picture(w, h, z) {
    return grp(box(w, h * 0.42, 0.01, 0x8fbbe0, 0, h * 0.29, z, { basic: true }), box(w, h * 0.58, 0.01, 0x46803a, 0, -h * 0.21, z, { basic: true }),
      box(w * 0.36, h * 0.5, 0.012, 0x5a6068, 0, -h * 0.25, z + 0.002, { basic: true }), box(w * 0.14, h * 0.12, 0.014, 0xd8262a, 0, -h * 0.22, z + 0.004, { basic: true }),
      box(w * 0.22, h * 0.3, 0.014, 0x1a1d24, -w * 0.36, h * 0.3, z + 0.003, { basic: true }));
  }
  function motorhome(col) {   // along x (front +x), door side +z; awning out over +z
    const g = new THREE.Group();
    g.add(box(6.2, 2.45, 2.35, WHITE, -0.45, 1.68, 0)); g.add(box(6.24, 0.3, 2.39, col, -0.45, 1.05, 0)); g.add(box(6.24, 0.1, 2.39, col, -0.45, 1.3, 0));
    g.add(box(1.3, 1.25, 2.3, WHITE, 3.25, 1.05, 0)); g.add(box(1.25, 0.82, 2.36, WHITE, 2.95, 2.5, 0));
    g.add(box(0.06, 0.62, 2.0, 0x2a3440, 3.92, 1.45, 0, { rz: -0.35 })); g.add(box(0.5, 0.45, 0.04, 0x2a3440, 3.3, 1.42, 1.17)); g.add(box(0.5, 0.45, 0.04, 0x2a3440, 3.3, 1.42, -1.17));
    g.add(box(0.3, 0.35, 2.2, DARKG, 3.95, 0.55, 0)); g.add(box(0.1, 0.12, 0.35, 0xf6f2dc, 3.92, 0.72, 0.85, { basic: true })); g.add(box(0.1, 0.12, 0.35, 0xf6f2dc, 3.92, 0.72, -0.85, { basic: true }));
    for (const [x, w] of [[1.4, 1.0], [-1.6, 1.3], [-3.0, 0.8]]) g.add(box(w, 0.6, 0.04, 0x2a3440, x, 2.05, 1.19));
    g.add(box(0.72, 1.85, 0.04, 0xdadad4, 0.0, 1.4, 1.19)); g.add(box(0.85, 0.28, 0.65, 0xdcdcd6, -1.6, 3.05, 0)); g.add(box(0.6, 0.12, 0.6, 0x9aa0a8, 1.1, 2.97, 0.4));
    for (const x of [2.55, -2.2]) for (const z of [1.08, -1.08]) g.add(wheel(0.38, 0.26, x, 0.38, z));
    g.add(cyl(0.08, 0.08, 4.2, 6, 0xdcdcd6, -0.8, 2.85, 1.24, { rz: Math.PI / 2 }));   // the awning: roller, striped canopy, two legs; a mat under it
    for (let k = 0; k < 6; k++) g.add(box(0.7, 0.04, 2.5, k % 2 ? 0xf2efe6 : col, -0.8 - 2.1 + (k + 0.5) * 0.7, 2.62, 2.45, { rx: 0.18 }));
    g.add(box(4.2, 0.18, 0.04, col, -0.8, 2.36, 3.68)); for (const x of [-2.75, 1.15]) g.add(cyl(0.025, 0.025, 2.36, 4, 0xc9ccd2, x, 1.18, 3.62));
    g.add(box(3.6, 0.02, 2.2, 0x4f6b55, -0.8, 0.02, 2.5));
    return g;
  }
  function car(col, o) {   // a hatchback along x (front +x); o.bar: a light bar (police, the doctor), o.stripe
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
    g.add(box(4.6, 1.95, 2.2, 0xf3f2ec, 0, 1.4, 0)); g.add(tbox(2.2, 1.6, 0.6, 1.95, 1.4, 0xf3f2ec, 2.55, 1.4 - 0.97, 0, { rz: Math.PI / 2 }));
    g.add(box(4.62, 0.22, 2.22, col, 0, 0.75, 0)); g.add(box(4.62, 0.08, 2.22, col, 0, 0.95, 0));
    g.add(box(1.4, 0.55, 0.04, 0x2a3440, -1.0, 1.65, 1.11)); g.add(box(0.9, 0.55, 0.04, 0x2a3440, 1.2, 1.65, 1.11)); g.add(box(0.04, 0.5, 1.5, 0x2a3440, 2.75, 1.6, 0));
    g.add(box(0.62, 1.7, 0.04, 0xdcdcd4, 0.25, 1.3, 1.12)); g.add(box(0.55, 0.12, 0.6, 0x9aa0a8, -0.6, 2.42, 0));
    g.add(wheel(0.33, 0.22, -0.2, 0.33, 1.13)); g.add(wheel(0.33, 0.22, -0.2, 0.33, -1.13));
    g.add(bar([2.3, 0.45, 0.8], [3.6, 0.4, 0.05], 0.08, 0x2c2f35)); g.add(bar([2.3, 0.45, -0.8], [3.6, 0.4, -0.05], 0.08, 0x2c2f35));
    return g;
  }
  function tentDome(col, r) { r = r || 1.35; const g = new THREE.Group(); g.add(sph(r, 7, 3, col, 0, 0, 0, { half: true, s: [1, 0.78, 1.15] })); g.add(box(0.7, 0.75, 0.05, 0x2b2f36, 0, 0.38, r * 1.12, { rx: -0.35 })); return g; }
  function tentRidge(col) { const g = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-1.0, 0); sh.lineTo(1.0, 0); sh.lineTo(0, 1.3); sh.lineTo(-1.0, 0);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: false }), lam(col)); m.position.z = -1.2; g.add(m);
    const d = new THREE.Shape(); d.moveTo(-0.45, 0); d.lineTo(0.45, 0); d.lineTo(0, 0.9); const dm = new THREE.Mesh(new THREE.ShapeGeometry(d), lam(0x2b2f36)); dm.position.z = 1.21; g.add(dm); return g; }
  function gazebo(col, w) { w = w || 3; const g = new THREE.Group(), h = w / 2;
    for (const [x, z] of [[h, h], [h, -h], [-h, h], [-h, -h]]) g.add(cyl(0.03, 0.03, 2.1, 4, 0xd2d5da, x, 1.05, z));
    g.add(cyl(0.02, w * 0.71, 0.75, 4, col, 0, 2.47, 0, { ry: Math.PI / 4 }));
    for (const [x, z, rw, rd] of [[0, h, w, 0.03], [0, -h, w, 0.03], [h, 0, 0.03, w], [-h, 0, 0.03, w]]) g.add(box(rw, 0.25, rd, col, x, 2.0, z));
    return g; }
  function campfire() {
    const g = new THREE.Group();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.add(box(0.26, 0.16, 0.22, k % 2 ? 0x8b8d90 : 0x6f7276, Math.cos(a) * 0.62, 0.08, Math.sin(a) * 0.62, { ry: -a })); }
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; g.add(bar([Math.cos(a) * 0.45, 0.05, Math.sin(a) * 0.45], [Math.cos(a) * 0.05, 0.42, Math.sin(a) * 0.05], 0.09, 0x5a3c24)); }
    g.add(cyl(0.38, 0.4, 0.04, 8, 0x24201c, 0, 0.02, 0));
    for (const [x, z, h, r, c] of [[0, 0, 0.85, 0.22, 0xff7a1a], [0.12, 0.06, 0.6, 0.15, 0xffb030], [-0.1, -0.05, 0.55, 0.14, 0xffd23a], [0.02, -0.12, 0.42, 0.12, 0xfff0a0]]) g.add(cyl(0.0, r, h, 5, c, x, 0.25 + h / 2, z, { basic: true }));
    g.add(cyl(0.9, 0.9, 0.01, 10, 0x6a4a22, 0, 0.012, 0, { basic: true }));   // (the fire's glow on the grass: a warm disc)
    const sm = smoke(6, 7, 0x8c8f94, 0.55, 3.2); sm.position.y = 0.6; g.add(sm);
    return g;
  }
  function logBench(L) { const g = new THREE.Group(); g.add(cyl(0.19, 0.2, L || 1.7, 7, 0x6b4a2e, 0, 0.19, 0, { rz: Math.PI / 2 })); g.add(cyl(0.16, 0.16, (L || 1.7) + 0.02, 7, 0xb08a5a, 0, 0.19, 0, { rz: Math.PI / 2 })); return g; }
  function grillKettle() { const g = new THREE.Group();
    g.add(sph(0.3, 7, 3, 0x1b1c1f, 0, 0.78, 0, { half: true, rx: Math.PI }));
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; g.add(bar([Math.cos(a) * 0.22, 0.6, Math.sin(a) * 0.22], [Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36], 0.03, 0x2a2b2f)); }
    g.add(cyl(0.29, 0.29, 0.02, 9, 0x7a7d82, 0, 0.79, 0)); for (let k = -2; k <= 2; k++) g.add(cyl(0.028, 0.028, 0.18, 5, 0x9c3a22, k * 0.09, 0.82, 0.02, { rx: Math.PI / 2 }));
    g.add(sph(0.3, 7, 3, 0x1b1c1f, 0.32, 0.86, -0.16, { half: true, rz: -1.4 }));
    const sm = smoke(5, 4.5, 0xb9bcc0, 0.6, 2.0); sm.position.y = 0.8; g.add(sm); return g; }
  function table(w, d, o) { w = w || 1.2; d = d || 0.7; o = o || {}; const g = new THREE.Group();
    g.add(box(w, 0.04, d, o.top || 0xe8e6de, 0, 0.72, 0)); for (const [x, z] of [[w / 2 - 0.06, d / 2 - 0.06], [-(w / 2 - 0.06), d / 2 - 0.06], [w / 2 - 0.06, -(d / 2 - 0.06)], [-(w / 2 - 0.06), -(d / 2 - 0.06)]]) g.add(cyl(0.015, 0.015, 0.72, 4, 0xa8acb2, x, 0.36, z));
    if (o.things !== false) { g.add(cyl(0.035, 0.038, 0.24, 5, 0x2f6b2a, -0.3, 0.86, 0.1)); g.add(cyl(0.035, 0.038, 0.24, 5, 0x6b3f1a, -0.2, 0.86, -0.12)); g.add(cyl(0.12, 0.1, 0.02, 8, 0xf4f4f0, 0.15, 0.75, 0.05)); g.add(cyl(0.12, 0.1, 0.02, 8, 0xf4f4f0, 0.42, 0.75, -0.1)); g.add(cyl(0.16, 0.1, 0.1, 8, 0xe9c46a, 0.3, 0.79, 0.18)); }
    return g; }
  function chair(col) { const g = new THREE.Group();
    g.add(box(0.5, 0.05, 0.46, col, 0, 0.44, 0)); g.add(box(0.5, 0.55, 0.05, col, 0, 0.74, -0.25, { rx: -0.18 }));
    for (const [x, z] of [[0.23, 0.2], [-0.23, 0.2], [0.23, -0.2], [-0.23, -0.2]]) g.add(bar([x, 0, z], [x * 0.95, 0.44, -z * 0.7], 0.025, 0x2a2c31));
    return g; }
  const cooler = (col) => grp(box(0.62, 0.36, 0.4, col || 0x2f63c9, 0, 0.18, 0), box(0.64, 0.07, 0.42, WHITE, 0, 0.39, 0));
  function crates(n, cols) { const g = new THREE.Group(); cols = cols || [0xe0b020, 0xc8201c, 0x2f7a3a, 0x6b4a2e]; for (let k = 0; k < n; k++) g.add(box(0.42, 0.3, 0.32, cols[k % cols.length], (k % 2) * 0.44, 0.15 + Math.floor(k / 2) * 0.31, 0)); return g; }
  function tvSet() { const g = new THREE.Group(), c = crates(2, [0x6b4a2e, 0x6b4a2e]); c.position.x = -0.22; g.add(c);
    g.add(box(1.25, 0.75, 0.08, 0x111214, 0, 1.0, 0)); const p = picture(1.15, 0.65, 0.045); p.position.y = 1.0; g.add(p);
    g.add(box(0.3, 0.06, 0.2, 0x111214, 0, 0.62, 0)); return g; }
  function sofa(col) { const g = new THREE.Group();
    g.add(box(1.9, 0.42, 0.85, col, 0, 0.21, 0)); g.add(box(1.9, 0.55, 0.22, col, 0, 0.62, -0.32)); for (const x of [0.86, -0.86]) g.add(box(0.2, 0.62, 0.86, col, x, 0.31, 0));
    for (const x of [-0.45, 0.45]) g.add(box(0.82, 0.1, 0.62, col + 0x080808 > 0xffffff ? col : col + 0x080808, x, 0.46, 0.08)); return g; }
  const generator = () => grp(box(0.62, 0.42, 0.45, 0xd8262a, 0, 0.21, 0), box(0.66, 0.04, 0.49, 0x2a2c31, 0, 0.44, 0), cyl(0.06, 0.06, 0.12, 5, 0x2a2c31, 0.2, 0.5, 0.1));
  function satDish() { const g = new THREE.Group(); g.add(cyl(0.03, 0.03, 1.4, 4, 0x9aa0a8, 0, 0.7, 0)); g.add(cyl(0.38, 0.06, 0.12, 9, 0xe9e9e4, 0, 1.45, 0.12, { rx: 1.1 })); return g; }
  const mat = (col) => box(1.75, 0.012, 0.6, col, 0, 0.006, 0);
  const boombox = () => grp(box(0.46, 0.26, 0.16, 0x23262c, 0, 0.13, 0), cyl(0.07, 0.07, 0.02, 8, 0x5b6068, -0.13, 0.13, 0.08, { rx: Math.PI / 2 }), cyl(0.07, 0.07, 0.02, 8, 0x5b6068, 0.13, 0.13, 0.08, { rx: Math.PI / 2 }));
  // a small house: walls along x (w) and z (d), the road side +z
  function house(o) {
    o = o || {}; const g = new THREE.Group(), w = o.w || 6.4, d = o.d || 5, h = o.h || 2.9, wc = o.wall || 0x9b2c22, tc = o.trim || 0xf2f0ea, rc = o.roof || 0x2b2d31;
    g.add(box(w, 0.35, d, 0x6f6a62, 0, 0.17, 0)); g.add(box(w, h, d, wc, 0, 0.35 + h / 2, 0));
    for (const [x, z] of [[w / 2, d / 2], [-w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]]) g.add(box(0.16, h, 0.16, tc, x, 0.35 + h / 2, z));
    const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.45, 0); sh.lineTo(d / 2 + 0.45, 0); sh.lineTo(0, d * 0.42); sh.lineTo(-d / 2 - 0.45, 0);
    const rf = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: w + 0.7, bevelEnabled: false }), lam(rc)); rf.rotation.y = Math.PI / 2; rf.position.set(-w / 2 - 0.35, 0.35 + h, 0); g.add(rf);
    const gs = new THREE.Shape(); gs.moveTo(-d / 2, 0); gs.lineTo(d / 2, 0); gs.lineTo(0, d * 0.38); const gg = new THREE.ShapeGeometry(gs);
    for (const [x, ry] of [[w / 2 + 0.01, Math.PI / 2], [-w / 2 - 0.01, -Math.PI / 2]]) { const gm = new THREE.Mesh(gg, lam(wc)); gm.rotation.y = ry; gm.position.set(x, 0.35 + h, 0); g.add(gm); }
    for (const x of o.win || [-1.8, 1.6]) { g.add(box(1.15, 1.05, 0.08, tc, x, 0.35 + h * 0.55, d / 2 + 0.02)); g.add(box(0.95, 0.85, 0.09, o.glass || 0x34404c, x, 0.35 + h * 0.55, d / 2 + 0.02)); }
    g.add(box(0.95, 2.0, 0.08, o.door || 0x6b4a2e, -0.1, 0.35 + 1.0, d / 2 + 0.03)); g.add(box(1.6, 0.08, 1.2, rc, -0.1, 0.35 + 2.25, d / 2 + 0.55, { rx: 0.15 }));
    if (o.chimney !== false) { g.add(box(0.5, 1.6, 0.5, o.chimCol || 0x6f6a62, w * 0.25, 0.35 + h + d * 0.25, -d * 0.12)); const sm = smoke(5, 6, 0xc9ccd0, 0.5, 2.6); sm.position.set(w * 0.25, 0.35 + h + d * 0.25 + 0.8, -d * 0.12); g.add(sm); }
    return g;
  }
  function picketFence(L, col, o) { o = o || {}; const g = new THREE.Group(), n = Math.round(L / 0.24); col = col || 0xf2f0ea;
    g.add(box(L, 0.07, 0.04, col, 0, 0.35, 0)); g.add(box(L, 0.07, 0.04, col, 0, 0.8, 0));
    if (o.posts) for (let x = -L / 2; x <= L / 2 + 0.01; x += 2) g.add(box(0.1, 1.1, 0.1, col, x, 0.55, -0.04));
    else for (let k = 0; k <= n; k++) g.add(box(0.08, 1.0, 0.025, col, -L / 2 + k * L / n, 0.5, 0.03));
    return g; }
  function clothesline(L) { const g = new THREE.Group(); L = L || 5;
    for (const x of [-L / 2, L / 2]) { g.add(box(0.08, 1.9, 0.08, 0x9aa0a8, x, 0.95, 0)); g.add(box(0.06, 0.06, 0.8, 0x9aa0a8, x, 1.85, 0)); }
    for (const z of [-0.3, 0.3]) g.add(bar([-L / 2, 1.85, z], [L / 2, 1.85, z], 0.012, 0xdedede));
    const cols = [0xf2f2f2, 0x2f63c9, 0xd23a2c, 0xf0c22e, 0xf2f2f2, 0x8acbe8, 0xe85a9a, 0x2f9a48];
    for (let k = 0; k < 9; k++) { const x = -L / 2 + 0.4 + k * (L - 0.8) / 8, z = k % 2 ? 0.3 : -0.3, big = k % 3 === 0; g.add(box(big ? 0.75 : 0.45, big ? 0.55 : 0.6, 0.015, cols[k % cols.length], x, 1.85 - (big ? 0.3 : 0.32), z)); }
    return g; }
  function woodpile(L) { const g = new THREE.Group(); L = L || 2.2; const n = Math.round(L / 0.24);
    for (let r = 0; r < 4; r++) for (let k = 0; k < n - (r % 2); k++) { const x = -L / 2 + 0.12 + k * 0.24 + (r % 2) * 0.12; g.add(cyl(0.11, 0.11, 0.7, 5, k % 3 ? 0xb08a5a : 0xa07a4a, x, 0.12 + r * 0.205, 0, { rx: Math.PI / 2 })); }
    g.add(box(L + 0.2, 0.06, 0.85, 0x4a4c50, 0, 0.98, 0, { rz: 0.06 })); return g; }
  const chopBlock = () => grp(cyl(0.25, 0.27, 0.45, 7, 0x8a6a45, 0, 0.225, 0), cyl(0.23, 0.23, 0.02, 7, 0xc2a070, 0, 0.455, 0));
  function bench(col) { const g = new THREE.Group(); col = col || 0x8a6a45; g.add(box(1.5, 0.06, 0.38, col, 0, 0.45, 0)); g.add(box(1.5, 0.3, 0.05, col, 0, 0.72, -0.18, { rx: -0.15 })); for (const x of [0.65, -0.65]) g.add(box(0.06, 0.45, 0.38, 0x3a3027, x, 0.22, 0)); return g; }
  function dog(col) { const g = new THREE.Group(); col = col || 0x6b4a2e;
    g.add(box(0.24, 0.24, 0.62, col, 0, 0.45, 0)); g.add(box(0.2, 0.2, 0.24, col, 0, 0.62, 0.38)); g.add(box(0.12, 0.1, 0.12, 0x2a1d14, 0, 0.57, 0.53)); g.add(box(0.06, 0.1, 0.04, 0x2a1d14, 0.08, 0.76, 0.33)); g.add(box(0.06, 0.1, 0.04, 0x2a1d14, -0.08, 0.76, 0.33));
    for (const [x, z] of [[0.08, 0.22], [-0.08, 0.22], [0.08, -0.22], [-0.08, -0.22]]) g.add(box(0.07, 0.34, 0.07, col, x, 0.17, z)); g.add(bar([0, 0.5, -0.3], [0, 0.72, -0.5], 0.05, col)); return g; }
  // a scaffold tower (gradbeni oder): two decks, a ladder, a sofa on top, a banner and flags facing +z (the road)
  function scaffold(o) {
    o = o || {}; const g = new THREE.Group(), W = o.w || 3.2, D = o.d || 2.2, H = [2.2, 4.4], st = 0xa9adb3, wd = 0xb08a5a;
    for (const [x, z] of [[W / 2, D / 2], [-W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2]]) g.add(cyl(0.035, 0.035, 5.5, 4, st, x, 2.75, z));
    for (const y of H) { g.add(box(W + 0.1, 0.07, D + 0.1, wd, 0, y, 0)); for (const z of [D / 2, -D / 2]) g.add(cyl(0.025, 0.025, W, 4, st, 0, y + 1.0, z, { rz: Math.PI / 2 })); for (const x of [W / 2, -W / 2]) g.add(cyl(0.025, 0.025, D, 4, st, x, y + 1.0, 0, { rx: Math.PI / 2 })); }
    for (const z of [D / 2, -D / 2]) { g.add(bar([-W / 2, 0.1, z], [W / 2, H[0], z], 0.04, st)); g.add(bar([W / 2, H[0], z], [-W / 2, H[1], z], 0.04, st)); }
    for (let y = 0.3; y < H[1]; y += 0.32) g.add(box(0.5, 0.04, 0.04, 0x8f949b, -W / 2 - 0.3, y, -D / 2 + 0.3)); for (const x of [-W / 2 - 0.05, -W / 2 - 0.55]) g.add(box(0.05, H[1] + 0.9, 0.05, 0x8f949b, x, (H[1] + 0.9) / 2, -D / 2 + 0.3));
    const s = sofa(o.sofa || 0x5c6e3a); s.position.set(0.2, H[1] + 0.04, -0.3); g.add(s);
    const c = crates(3); c.position.set(-1.2, H[1] + 0.04, -0.6); g.add(c);
    const ban = o.banner || [0x15171c, 0xd8262a, 0xf2c21a]; ban.forEach((cc, k) => g.add(box(W, 0.32, 0.03, cc, 0, H[1] + 0.85 - k * 0.32 - 0.1 - 0.4, D / 2 + 0.06)));
    for (const [x, cols] of [[W / 2, o.flagA || ban], [-W / 2, o.flagB || ban]]) { g.add(cyl(0.025, 0.025, 2.2, 4, 0xdedede, x, H[1] + 1.1 + 1.1, D / 2)); cols.forEach((cc, k) => g.add(box(1.0, 0.66 / cols.length, 0.02, cc, x + (x > 0 ? 0.5 : -0.5), H[1] + 2.1 - (k + 0.5) * 0.66 / cols.length, D / 2))); }
    return g;
  }
  // a temporary grandstand along x (the front +z, the rows climbing to -z); n rows; the seats as coloured strips
  function stand(L, n, o) {
    o = o || {}; const g = new THREE.Group(), rise = 0.42, dep = 0.85, st = 0x9aa0a8, seat = o.seat || 0x2f63c9;
    for (let r = 0; r < n; r++) { const y = 0.6 + r * rise, z = -r * dep; g.add(box(L, 0.08, dep, 0xb9bdc4, 0, y, z)); g.add(box(L, 0.18, 0.35, r % 4 === 1 ? (o.seat2 || 0xd8262a) : seat, 0, y + 0.13, z - 0.12)); }
    for (let x = -L / 2; x <= L / 2 + 0.01; x += 4) { g.add(bar([x, 0, 0.3], [x, 0.6 + n * rise, -n * dep + 0.3], 0.1, st)); g.add(box(0.1, 0.6 + n * rise, 0.1, st, x, (0.6 + n * rise) / 2, -n * dep + 0.3)); }
    g.add(box(L, 1.0, 0.06, 0xdcdcd6, 0, 0.5 + n * rise + 0.6, -n * dep + 0.35)); g.add(box(L, 0.04, 0.04, st, 0, 1.6, 0.42));
    for (const x of [-L / 2 + 0.6, L / 2 - 0.6]) for (let r = 0; r < n; r++) g.add(box(1.0, 0.04, dep * 0.9, 0xc9ccd2, x, 0.4 + r * rise, -r * dep + 0.05));
    return g;
  }
  // a marshal post: the hut (its number board plain), the flag stand, extinguishers, absorbent sacks, a stool
  function marshalPost() {
    const g = new THREE.Group();
    g.add(box(2.4, 2.3, 2.2, 0xf1f0ea, 0, 1.15, 0)); g.add(box(2.8, 0.12, 2.6, 0x2f343c, 0, 2.36, 0)); g.add(box(1.7, 0.6, 0.04, 0x2a3440, 0, 1.45, 1.11));
    g.add(box(0.7, 0.32, 0.03, 0x111214, 0.6, 2.05, 1.12)); for (const x of [0.48, 0.72]) g.add(box(0.14, 0.14, 0.03, 0xffb31a, x, 2.05, 1.13, { basic: true }));
    g.add(box(0.6, 0.3, 0.03, 0xf2f2ee, -0.5, 2.05, 1.12)); g.add(box(0.36, 0.06, 0.032, 0x15171c, -0.5, 2.05, 1.122));
    g.add(box(0.5, 1.0, 0.25, 0x6a6f78, 1.6, 0.5, 0.8)); [0xf5d21a, 0x1f63d8, 0xf2f2f2, 0x2a9a3a, 0xd8262a].forEach((c, k) => { g.add(cyl(0.012, 0.012, 1.2, 3, 0x5c4630, 1.45 + k * 0.08, 1.15, 0.8)); g.add(box(0.012, 0.32, 0.45, c, 1.45 + k * 0.08, 1.55, 0.8 + 0.22)); });
    for (const x of [-1.5, -1.75]) { const e = item('ext'); e.position.set(x, 0.5, 0.9); g.add(e); }
    for (let k = 0; k < 3; k++) g.add(box(0.5, 0.25, 0.35, 0xf2f2ee, -0.6 + k * 0.52, 0.13, 1.6, { ry: k * 0.3 }));
    g.add(cyl(0.18, 0.18, 0.04, 7, 0x2a2c31, 1.0, 0.5, 1.7)); g.add(cyl(0.02, 0.02, 0.5, 3, 0x2a2c31, 1.0, 0.25, 1.7));
    return g;
  }
  function fireTruck() {   // along x (front +x)
    const g = new THREE.Group(), red = 0xc8201c;
    g.add(box(2.1, 2.5, 2.5, red, 3.0, 1.55, 0)); g.add(box(0.06, 0.9, 2.2, 0x26303a, 4.06, 2.05, 0)); g.add(box(0.9, 0.8, 0.04, 0x26303a, 3.4, 2.05, 1.26)); g.add(box(0.9, 0.8, 0.04, 0x26303a, 3.4, 2.05, -1.26));
    g.add(box(5.4, 2.6, 2.5, red, -0.8, 1.6, 0)); for (let k = 0; k < 4; k++) for (const z of [1.26, -1.26]) g.add(box(1.15, 1.6, 0.04, 0xb01a16, -2.9 + k * 1.3, 1.5, z));
    g.add(box(7.6, 0.18, 2.54, 0xf2f2ee, 0.25, 0.95, 0)); g.add(box(7.62, 0.06, 2.55, 0xf5d21a, 0.25, 1.06, 0));
    g.add(box(0.35, 0.18, 1.8, 0x15171c, 3.0, 2.9, 0)); for (const z of [0.5, -0.5]) g.add(box(0.33, 0.14, 0.6, 0x2f6bff, 3.0, 3.0, z, { basic: true }));
    for (const z of [0.55, -0.55]) g.add(box(5.6, 0.07, 0.07, 0xc9ccd2, -0.8, 3.1, z)); for (let x = -3.4; x < 1.9; x += 0.9) g.add(box(0.06, 0.06, 1.1, 0xc9ccd2, x, 3.1, 0));
    g.add(cyl(0.45, 0.45, 1.6, 9, 0x9a9da3, -3.6, 1.6, 0, { rx: Math.PI / 2 }));
    for (const x of [2.9, -1.9]) for (const z of [1.1, -1.1]) g.add(wheel(0.5, 0.36, x, 0.5, z));
    g.add(box(0.12, 0.3, 2.3, 0xc9ccd2, 4.1, 0.6, 0)); return g;
  }
  function ambulance() {   // a white van with a green band and blue lamps (front +x)
    const g = van(0xf2f2ee, 0xf2f2ee); g.add(box(4.42, 0.22, 1.87, 0x2a9a3a, 0, 1.2, 0)); g.add(box(0.3, 0.1, 1.2, 0x15171c, 1.6, 2.45, 0));
    for (const z of [0.35, -0.35]) g.add(box(0.28, 0.1, 0.4, 0x2f6bff, 1.6, 2.53, z, { basic: true })); return g; }
  // a wire fence panel (heras): a frame, three wires, its foot blocks; along x
  function heras(L) { const g = new THREE.Group(); for (let x = -L / 2; x < L / 2 - 0.1; x += 3.4) { const cx = x + 1.7;
      for (const y of [0.05, 1.95]) g.add(box(3.3, 0.05, 0.05, 0x9aa0a8, cx, y, 0)); for (const dx of [-1.65, 1.65]) g.add(box(0.05, 1.9, 0.05, 0x9aa0a8, cx + dx, 1.0, 0));
      for (const y of [0.6, 1.0, 1.4]) g.add(box(3.3, 0.015, 0.015, 0xb9bdc4, cx, y, 0)); g.add(box(0.6, 0.12, 0.25, 0x6a6f78, x, 0.06, 0)); } return g; }
  function gate() {   // an entrance along x: the booth at -x, the barrier across a lane, fence panels to both sides, a plain green board over it
    const g = new THREE.Group();
    g.add(box(1.8, 2.4, 1.6, 0xe9e8e2, -3.2, 1.2, 0)); g.add(box(2.1, 0.12, 1.9, 0x2f343c, -3.2, 2.46, 0)); g.add(box(1.3, 0.6, 0.04, 0x2a3440, -3.2, 1.55, 0.81)); g.add(box(0.04, 0.6, 1.0, 0x2a3440, -2.29, 1.55, 0));
    g.add(box(0.3, 1.0, 0.3, 0xd8d8d2, -2.0, 0.5, 0.5)); for (let k = 0; k < 8; k++) g.add(box(0.5, 0.1, 0.1, k % 2 ? 0xd8262a : 0xf2f2f2, -1.65 + k * 0.5, 0.95, 0.5));
    for (const x of [-6.5, 4.0]) { const h = heras(4); h.position.x = x; g.add(h); }
    g.add(box(2.6, 0.65, 0.05, 0x1d5f2c, 0.5, 3.1, 0.06)); g.add(box(2.2, 0.08, 0.055, 0xf2f2f2, 0.5, 3.1, 0.062));
    g.add(box(0.12, 3.4, 0.12, 0x9aa0a8, -0.9, 1.7, 0)); g.add(box(0.12, 3.4, 0.12, 0x9aa0a8, 1.9, 1.7, 0)); g.add(box(2.9, 0.1, 0.1, 0x9aa0a8, 0.5, 3.45, 0));
    return g;
  }
  function policeBike() { const g = new THREE.Group(); g.add(cyl(0.32, 0.32, 0.12, 9, TYRE, 0.75, 0.32, 0, { rx: Math.PI / 2 })); g.add(cyl(0.32, 0.32, 0.14, 9, TYRE, -0.72, 0.32, 0, { rx: Math.PI / 2 }));
    g.add(box(1.1, 0.42, 0.34, 0xf2f2f2, 0, 0.72, 0)); g.add(box(0.5, 0.3, 0.5, 0x1f4aa8, 0.55, 0.92, 0)); g.add(box(0.06, 0.45, 0.42, 0x8fa8bc, 0.78, 1.25, 0, { rz: -0.3 }));
    g.add(box(0.5, 0.35, 0.65, 0xf2f2f2, -0.65, 0.75, 0)); g.add(box(0.12, 0.08, 0.2, 0x2f6bff, -0.85, 1.0, 0, { basic: true })); g.add(box(0.75, 0.12, 0.3, 0x15171c, -0.15, 0.98, 0)); return g; }
  function foodTruck(col) {   // a van along x, its serving hatch on +z (a plain board over it)
    const g = new THREE.Group(); col = col || 0xf0c22e;
    g.add(box(4.6, 2.3, 2.2, col, -0.3, 1.5, 0)); g.add(box(1.4, 1.5, 2.1, col, 2.5, 1.1, 0)); g.add(box(0.06, 0.6, 1.8, 0x27313c, 3.2, 1.55, 0, { rz: -0.35 }));
    g.add(box(2.8, 1.0, 0.05, 0x2a2c31, -0.6, 1.75, 1.11)); g.add(box(2.9, 0.06, 1.0, col, -0.6, 2.62, 1.55, { rx: -0.35 })); g.add(box(2.8, 0.1, 0.45, 0xc9ccd2, -0.6, 1.2, 1.3));
    g.add(box(2.2, 0.42, 0.03, 0x1b1d22, -0.6, 2.42, 1.115)); for (let k = 0; k < 4; k++) g.add(box(0.36, 0.2, 0.032, [0xffd23a, 0xd8262a, 0xffd23a, 0xf2f2f2][k], -1.35 + k * 0.5, 2.42, 1.117, { basic: true }));
    g.add(cyl(0.08, 0.08, 0.6, 5, 0x9aa0a8, -1.8, 2.95, 0.5)); const sm = smoke(4, 4, 0xc9ccd0, 0.5, 2); sm.position.set(-1.8, 3.2, 0.5); g.add(sm);
    for (const x of [1.9, -1.9]) for (const z of [1.0, -1.0]) g.add(wheel(0.36, 0.24, x, 0.36, z)); return g; }
  const highTable = (col) => grp(cyl(0.38, 0.38, 0.04, 9, col || 0xf2f2ee, 0, 1.08, 0), cyl(0.035, 0.035, 1.06, 4, 0x9aa0a8, 0, 0.53, 0), cyl(0.28, 0.3, 0.04, 7, 0x9aa0a8, 0, 0.02, 0), cyl(0.036, 0.036, 0.16, 5, 0xc8c9cc, 0.1, 1.18, 0.05));
  function tyreStack(n, col) { const g = new THREE.Group(); for (let k = 0; k < n; k++) { g.add(cyl(0.33, 0.33, 0.27, 10, TYRE, 0, 0.14 + k * 0.28, 0)); g.add(cyl(0.2, 0.2, 0.28, 8, col || 0xd8262a, 0, 0.14 + k * 0.28, 0, { s: [1, 0.3, 1] })); } return g; }
  function warmers(col) { const g = new THREE.Group(); for (let k = 0; k < 4; k++) g.add(cyl(0.34, 0.34, 0.3, 10, col, (k % 2) * 0.72, 0.34, Math.floor(k / 2) * 0.75, { rx: Math.PI / 2 })); return g; }
  const toolChest = (col) => grp(box(0.9, 1.1, 0.55, col || 0xd8262a, 0, 0.62, 0), ...[0.4, 0.62, 0.84, 1.0].map(y => box(0.92, 0.03, 0.56, 0x2a2c31, 0, y, 0)));
  function camTower(col) {   // a camera tower: four posts, a deck at 3 m with a rail, a ladder, an umbrella (the camera on its tripod: a moving part, camHead)
    const g = new THREE.Group(), H = 3.0, st = 0xa9adb3;
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.add(cyl(0.035, 0.035, H + 1.1, 4, st, x, (H + 1.1) / 2, z));
    g.add(box(2.1, 0.07, 2.1, 0xb08a5a, 0, H, 0)); for (const z of [1, -1]) g.add(cyl(0.025, 0.025, 2, 4, st, 0, H + 1.0, z, { rz: Math.PI / 2 })); for (const x of [1, -1]) g.add(cyl(0.025, 0.025, 2, 4, st, x, H + 1.0, 0, { rx: Math.PI / 2 }));
    for (let y = 0.3; y < H; y += 0.32) g.add(box(0.5, 0.04, 0.04, 0x8f949b, -1.3, y, -0.6)); for (const x of [-1.05, -1.55]) g.add(box(0.05, H + 0.9, 0.05, 0x8f949b, x, (H + 0.9) / 2, -0.6));
    g.add(cyl(0.02, 0.02, 2.2, 4, 0xdedede, 0.7, H + 1.1, -0.6)); g.add(cyl(0.05, 1.3, 0.45, 8, col || 0xf2f2f2, 0.7, H + 2.2, -0.6));
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; g.add(bar([Math.cos(a) * 0.35, H + 0.04, 0.35 + Math.sin(a) * 0.35], [0, H + 1.29, 0.35], 0.03, 0x2a2c31)); }
    return g;
  }
  const camHead = () => grp(box(0.28, 0.3, 0.5, 0x1b1d22, 0, 0.05, 0), cyl(0.11, 0.12, 0.45, 7, 0x2a2c31, 0, 0.05, 0.45, { rx: Math.PI / 2 }), box(0.2, 0.15, 0.04, 0x6a8fb0, 0.2, 0.18, -0.2, { basic: true }));
  const bag = (col) => grp(box(0.45, 0.3, 0.28, col || 0x23262c, 0, 0.15, 0), box(0.47, 0.04, 0.3, 0x15171c, 0, 0.3, 0));
  const stool = () => grp(cyl(0.17, 0.17, 0.04, 7, 0x2a2c31, 0, 0.48, 0), ...[0, 1, 2].map(k => bar([Math.cos(k * 2.1) * 0.15, 0, Math.sin(k * 2.1) * 0.15], [0, 0.47, 0], 0.025, 0x5b6068)));
  const trolley = () => grp(box(1.1, 0.06, 0.6, 0x9aa0a8, 0, 0.32, 0), bar([-0.55, 0.32, 0.28], [-0.75, 1.0, 0.28], 0.03, 0x9aa0a8), bar([-0.55, 0.32, -0.28], [-0.75, 1.0, -0.28], 0.03, 0x9aa0a8), cyl(0.33, 0.33, 0.27, 10, 0x16171a, 0.2, 0.5, 0));
  function parasol(col, col2) { const g = new THREE.Group(); g.add(cyl(0.025, 0.025, 2.3, 4, 0xdedede, 0, 1.15, 0));
    for (let k = 0; k < 8; k++) g.add(new THREE.Mesh(new THREE.ConeGeometry(1.32, 0.38, 1, 1, true, k / 8 * TAU, TAU / 8), lam(k % 2 ? (col2 || 0xf2f2ee) : col)).translateY(2.42));
    return g; }
  function flagPole(cols, h) { h = h || 6; const g = new THREE.Group(); g.add(cyl(0.04, 0.05, h, 4, 0xdedede, 0, h / 2, 0)); cols = cols || [0x15171c, 0xd8262a, 0xf2c21a];
    if (cols.vert) cols.forEach((c, k) => g.add(box(1.5 / cols.length, 0.95, 0.02, c, 0.03 + (k + 0.5) * 1.5 / cols.length, h - 0.25 - 0.475, 0)));   // (a flag of vertical stripes: Belgium, Canada)
    else cols.forEach((c, k) => g.add(box(1.5, 0.95 / cols.length, 0.02, c, 0.78, h - 0.25 - (k + 0.5) * 0.95 / cols.length, 0))); return g; }
  function bike(col) { const g = new THREE.Group(); col = col || 0x2f63c9;
    for (const x of [0.55, -0.55]) g.add(cyl(0.34, 0.34, 0.04, 10, 0x15171c, x, 0.34, 0, { rx: Math.PI / 2 }));
    g.add(bar([-0.55, 0.34, 0], [-0.05, 0.36, 0], 0.04, col)); g.add(bar([-0.05, 0.36, 0], [0.45, 0.8, 0], 0.04, col)); g.add(bar([-0.55, 0.34, 0], [-0.15, 0.82, 0], 0.04, col)); g.add(bar([-0.15, 0.82, 0], [0.45, 0.8, 0], 0.04, col)); g.add(bar([-0.05, 0.36, 0], [-0.15, 0.82, 0], 0.04, col));
    g.add(bar([0.45, 0.8, 0], [0.55, 0.34, 0], 0.035, col)); g.add(box(0.22, 0.05, 0.1, 0x15171c, -0.17, 0.88, 0)); g.add(box(0.04, 0.04, 0.5, 0x2a2c31, 0.42, 0.98, 0)); return g; }
  function hammock(L) { L = L || 3.2; const g = new THREE.Group(), wd = 0x7a5a3a;
    for (const x of [-L / 2, L / 2]) g.add(cyl(0.08, 0.09, 1.9, 5, wd, x, 0.95, 0));
    const n = 6, pts = []; for (let k = 0; k <= n; k++) pts.push([-L / 2 + 0.3 + k * (L - 0.6) / n, 1.45 - Math.sin(k / n * Math.PI) * 0.6]);
    for (let k = 0; k < n; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; g.add(box(Math.hypot(x1 - x0, y1 - y0) + 0.02, 0.03, 0.85, k % 2 ? 0xe85a2a : 0xf0c22e, (x0 + x1) / 2, (y0 + y1) / 2, 0, { rz: Math.atan2(y1 - y0, x1 - x0) })); }
    g.add(bar([-L / 2, 1.75, 0], [pts[0][0], pts[0][1], 0], 0.02, 0xdedede)); g.add(bar([L / 2, 1.75, 0], [pts[n][0], pts[n][1], 0], 0.02, 0xdedede)); return g; }
  const kidPool = (col) => grp(cyl(1.1, 1.1, 0.3, 12, col || 0x2f8fe0, 0, 0.15, 0), cyl(0.92, 0.92, 0.31, 12, 0x8fd8f0, 0, 0.16, 0));
  function stringLights(L, h) { const g = new THREE.Group(), cols = [0xffd23a, 0xff5a3a, 0x5ad86a, 0x5ab0ff, 0xff8ad8]; g.add(bar([-L / 2, h, 0], [L / 2, h, 0], 0.01, 0x2a2c31));
    const n = Math.round(L / 0.4); for (let k = 0; k <= n; k++) { const x = -L / 2 + k * 0.4, y = h - Math.sin(k / n * Math.PI) * 0.18; g.add(box(0.08, 0.08, 0.08, cols[k % cols.length], x, y - 0.06, 0, { basic: true })); } return g; }
  const gasBottle = () => grp(cyl(0.15, 0.15, 0.55, 7, 0x8a8f98, 0, 0.3, 0), cyl(0.05, 0.05, 0.1, 5, 0x5b6068, 0, 0.62, 0));
  const trashBag = () => grp(sph(0.28, 6, 3, 0x15171c, 0, 0.26, 0, { s: [1, 0.9, 1] }));
  const bin = (col) => grp(cyl(0.3, 0.27, 0.95, 7, col || 0x2f7a3a, 0, 0.48, 0), cyl(0.32, 0.32, 0.06, 7, 0x2a2c31, 0, 0.97, 0));
  function portaloo(col) { const g = new THREE.Group(); col = col || 0x2f63c9; g.add(box(1.15, 2.2, 1.15, col, 0, 1.1, 0)); g.add(box(1.25, 0.1, 1.25, 0xf2f2f2, 0, 2.25, 0)); g.add(box(0.8, 1.9, 0.03, 0xd9dde2, 0, 1.05, 0.59)); g.add(box(0.1, 0.06, 0.04, 0x2a9a3a, 0.25, 1.3, 0.61, { basic: true })); return g; }
  function beerSet(L) { L = L || 2.2; const g = new THREE.Group(), wd = 0xb08a5a;
    g.add(box(L, 0.04, 0.5, wd, 0, 0.76, 0)); for (const x of [L / 2 - 0.25, -L / 2 + 0.25]) { g.add(bar([x, 0, -0.2], [x, 0.74, 0.2], 0.03, 0x5b6068)); g.add(bar([x, 0, 0.2], [x, 0.74, -0.2], 0.03, 0x5b6068)); }
    for (const z of [0.58, -0.58]) { g.add(box(L, 0.04, 0.25, wd, 0, 0.47, z)); for (const x of [L / 2 - 0.25, -L / 2 + 0.25]) g.add(box(0.04, 0.45, 0.22, 0x5b6068, x, 0.23, z)); }
    for (const x of [-0.6, -0.1, 0.5]) g.add(cyl(0.04, 0.035, 0.16, 5, 0xf0c22e, x, 0.86, 0.05)); return g; }
  function van(col, col2) {   // a boxy minibus (two-tone), front +x
    const g = new THREE.Group(); col = col || 0xd8262a; col2 = col2 || 0xf2f2ee;
    g.add(box(4.4, 1.0, 1.85, col, 0, 0.85, 0)); g.add(box(4.4, 0.95, 1.85, col2, 0, 1.82, 0)); g.add(box(4.3, 0.12, 1.75, col2, 0, 2.35, 0));
    g.add(box(0.05, 0.62, 1.6, 0x27313c, 2.21, 1.82, 0)); for (const x of [1.0, -0.2, -1.4]) for (const z of [0.93, -0.93]) g.add(box(0.95, 0.5, 0.03, 0x27313c, x, 1.85, z));
    for (const x of [1.45, -1.45]) for (const z of [0.85, -0.85]) g.add(wheel(0.34, 0.22, x, 0.34, z));
    g.add(box(0.06, 0.14, 0.3, 0xf6f2dc, 2.21, 0.95, 0.65, { basic: true })); g.add(box(0.06, 0.14, 0.3, 0xf6f2dc, 2.21, 0.95, -0.65, { basic: true })); return g; }
  function tractor(col) {   // front +x
    const g = new THREE.Group(); col = col || 0xd8262a;
    g.add(box(2.0, 0.7, 0.9, col, 0.5, 1.05, 0)); g.add(box(1.1, 1.4, 1.1, col, -0.65, 1.5, 0)); g.add(box(1.0, 0.9, 1.05, 0x27313c, -0.65, 1.85, 0, { s: [1.02, 1, 1.02] })); g.add(box(1.25, 0.08, 1.25, col, -0.65, 2.3, 0));
    g.add(cyl(0.05, 0.05, 0.8, 4, 0x2a2c31, 1.1, 1.75, 0.25)); g.add(cyl(0.72, 0.72, 0.45, 11, TYRE, -0.75, 0.72, 0.75, { rx: Math.PI / 2 })); g.add(cyl(0.72, 0.72, 0.45, 11, TYRE, -0.75, 0.72, -0.75, { rx: Math.PI / 2 }));
    g.add(cyl(0.42, 0.42, 0.3, 9, TYRE, 1.15, 0.42, 0.62, { rx: Math.PI / 2 })); g.add(cyl(0.42, 0.42, 0.3, 9, TYRE, 1.15, 0.42, -0.62, { rx: Math.PI / 2 }));
    for (const z of [0.75, -0.75]) g.add(cyl(0.4, 0.4, 0.47, 9, 0xd8c34a, -0.75, 0.72, z, { rx: Math.PI / 2 })); return g; }
  function trampoline() { const g = new THREE.Group(); g.add(cyl(1.6, 1.6, 0.1, 14, 0x2f63c9, 0, 0.82, 0)); g.add(cyl(1.35, 1.35, 0.12, 14, 0x15171c, 0, 0.83, 0));
    const P = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; P.push([Math.cos(a) * 1.58, Math.sin(a) * 1.58]); g.add(cyl(0.03, 0.03, 0.82, 4, 0x9aa0a8, Math.cos(a) * 1.5, 0.41, Math.sin(a) * 1.5)); g.add(cyl(0.02, 0.02, 1.6, 4, 0x9aa0a8, Math.cos(a) * 1.58, 1.6, Math.sin(a) * 1.58)); }
    for (let k = 0; k < 6; k++) { const a = P[k], b = P[(k + 1) % 6]; g.add(bar([a[0], 2.4, a[1]], [b[0], 2.4, b[1]], 0.03, 0x2a2c31)); }   // (the net's top ring: the net itself would be see-through)
    return g; }
  function bigScreen() { const g = new THREE.Group(); for (const x of [-2.4, 2.4]) g.add(box(0.3, 6.4, 0.3, 0x9aa0a8, x, 3.2, 0)); g.add(box(5.2, 3.0, 0.3, 0x15171c, 0, 4.6, 0));
    const p = picture(4.8, 2.7, 0.16); p.position.y = 4.6; g.add(p); g.add(box(5.6, 0.2, 1.2, 0x9aa0a8, 0, 0.1, 0)); return g; }
  function quad(col) { const g = new THREE.Group(); col = col || 0xf07a1c;
    for (const x of [0.6, -0.6]) for (const z of [0.5, -0.5]) g.add(cyl(0.3, 0.3, 0.26, 9, TYRE, x, 0.3, z, { rx: Math.PI / 2 }));
    g.add(box(1.5, 0.35, 0.75, col, 0, 0.62, 0)); g.add(box(0.5, 0.15, 0.85, col, 0.62, 0.75, 0)); g.add(box(0.45, 0.15, 0.85, col, -0.6, 0.78, 0)); g.add(box(0.5, 0.12, 0.4, 0x15171c, -0.1, 0.86, 0));
    g.add(box(0.05, 0.05, 0.75, 0x2a2c31, 0.42, 1.05, 0)); g.add(bar([0.32, 0.8, 0], [0.42, 1.05, 0], 0.05, 0x2a2c31)); return g; }
  function scooter(col) { const g = new THREE.Group(); col = col || 0x1f63d8; g.add(cyl(0.22, 0.22, 0.1, 9, TYRE, 0.55, 0.22, 0, { rx: Math.PI / 2 })); g.add(cyl(0.22, 0.22, 0.1, 9, TYRE, -0.5, 0.22, 0, { rx: Math.PI / 2 }));
    g.add(box(0.75, 0.12, 0.32, col, 0, 0.32, 0)); g.add(box(0.45, 0.35, 0.34, col, -0.4, 0.55, 0)); g.add(box(0.4, 0.1, 0.3, 0x15171c, -0.35, 0.78, 0)); g.add(bar([0.5, 0.3, 0], [0.42, 1.0, 0], 0.06, col)); g.add(box(0.05, 0.05, 0.6, 0x2a2c31, 0.42, 1.0, 0)); return g; }
  const cone = () => grp(box(0.36, 0.04, 0.36, 0x15171c, 0, 0.02, 0), cyl(0.03, 0.15, 0.6, 7, 0xf07a1c, 0, 0.32, 0), cyl(0.085, 0.11, 0.1, 7, 0xf2f2f2, 0, 0.33, 0));
  function fanBanner(cols, L) { const g = new THREE.Group(); L = L || 4; cols = cols || [0x15171c, 0xd8262a, 0xf2c21a];
    if (cols.vert) cols.forEach((c, k) => g.add(box(L / cols.length, 0.9, 0.02, c, -L / 2 + (k + 0.5) * L / cols.length, 1.45, 0)));
    else cols.forEach((c, k) => g.add(box(L, 0.9 / cols.length, 0.02, c, 0, 1.9 - (k + 0.5) * 0.9 / cols.length, 0))); return g; }
  function wheelbarrow(col) { const g = new THREE.Group(); col = col || 0x2f9a48; g.add(tbox(0.55, 0.75, 0.32, 0.45, 0.6, col, 0, 0.32, 0)); g.add(cyl(0.18, 0.18, 0.06, 8, TYRE, 0.55, 0.18, 0, { rx: Math.PI / 2 }));
    for (const z of [0.22, -0.22]) { g.add(bar([0.55, 0.18, 0], [-0.75, 0.55, z], 0.035, 0x6b4a2e)); g.add(bar([-0.2, 0.0, z * 0.9], [-0.2, 0.34, z * 0.9], 0.03, 0x2a2c31)); } return g; }
  const fridge = () => grp(box(0.6, 1.4, 0.6, 0xf2f2ee, 0, 0.7, 0), box(0.02, 0.5, 0.04, 0x9aa0a8, 0.22, 0.95, 0.31));
  function pullBar() { const g = new THREE.Group(); for (const x of [-0.7, 0.7]) g.add(cyl(0.05, 0.05, 2.4, 5, 0x5b6068, x, 1.2, 0)); g.add(cyl(0.03, 0.03, 1.5, 5, 0xc9ccd2, 0, 2.3, 0, { rz: Math.PI / 2 })); return g; }
  const dumbbell = () => grp(cyl(0.02, 0.02, 0.3, 4, 0x5b6068, 0, 0.06, 0, { rz: Math.PI / 2 }), cyl(0.06, 0.06, 0.06, 7, 0x15171c, 0.13, 0.06, 0, { rz: Math.PI / 2 }), cyl(0.06, 0.06, 0.06, 7, 0x15171c, -0.13, 0.06, 0, { rz: Math.PI / 2 }));
  const beanBag = (col) => grp(sph(0.45, 7, 3, col || 0xd8262a, 0, 0.25, 0, { s: [1.1, 0.6, 1.1] }));
  const mailbox = () => grp(box(0.08, 1.1, 0.08, 0x6b4a2e, 0, 0.55, 0), box(0.3, 0.25, 0.45, 0x2f63c9, 0, 1.2, 0));
  function flowerBed(L) { const g = new THREE.Group(); L = L || 2; g.add(box(L, 0.15, 0.6, 0x5a3c24, 0, 0.07, 0)); const cols = [0xd8262a, 0xf0c22e, 0xe85a9a, 0xf2f2f2, 0x8a3b8c];
    for (let k = 0; k < Math.round(L * 3); k++) g.add(box(0.12, 0.1, 0.12, cols[k % cols.length], -L / 2 + 0.15 + k * 0.33, 0.22, (k % 3 - 1) * 0.15)); return g; }
  function shed(col) { const g = new THREE.Group(); col = col || 0x9b2c22; g.add(box(2.4, 2.1, 2.0, col, 0, 1.05, 0)); g.add(box(2.7, 0.1, 2.3, 0x2b2d31, 0, 2.2, 0, { rz: 0.12 })); g.add(box(0.8, 1.7, 0.04, 0x6b4a2e, 0.3, 0.85, 1.01)); for (const x of [-1.2, 1.2]) g.add(box(0.1, 2.1, 0.1, 0xf2f0ea, x, 1.05, 1.0)); return g; }
  // the pit wall stand: a roofed desk on the wall with monitors and stools; the engineers sit at it facing +z (the track)
  function pitStand(col, L) { L = L || 4.5; const g = new THREE.Group(); col = col || 0x1f63d8;
    g.add(box(L, 0.08, 1.4, 0x5b6068, 0, 1.05, 0)); g.add(box(L, 0.75, 0.5, 0x2a2c31, 0, 1.45, 0.45)); for (let k = 0; k < 4; k++) g.add(box(0.7, 0.45, 0.05, 0x111214, -L / 2 + 0.7 + k * (L - 1.4) / 3, 2.1, 0.55, { rx: -0.2 }));
    for (let k = 0; k < 4; k++) g.add(box(0.62, 0.36, 0.02, 0x4a7fb8, -L / 2 + 0.7 + k * (L - 1.4) / 3, 2.1, 0.58, { rx: -0.2, basic: true }));
    for (const x of [-L / 2 + 0.1, L / 2 - 0.1]) for (const z of [0.6, -0.6]) g.add(box(0.08, 2.6, 0.08, 0x9aa0a8, x, 1.3, z)); g.add(box(L + 0.3, 0.12, 1.8, col, 0, 2.65, 0.1)); g.add(box(L + 0.32, 0.3, 0.05, 0xf2f2f2, 0, 2.5, 1.0));
    for (let k = 0; k < 4; k++) { const x = -L / 2 + 0.7 + k * (L - 1.4) / 3; g.add(cyl(0.2, 0.2, 0.05, 7, 0x15171c, x, 1.72, -0.2)); g.add(cyl(0.03, 0.03, 0.62, 4, 0x9aa0a8, x, 1.4, -0.2)); }
    return g; }
  function mediaVan() { const g = van(0xf2f2ee, 0xf2f2ee); g.add(cyl(0.03, 0.03, 0.7, 4, 0x9aa0a8, -1.0, 2.75, 0)); g.add(cyl(0.6, 0.08, 0.15, 9, 0xe9e9e4, -1.0, 3.15, 0, { rx: 1.0 })); g.add(box(4.42, 0.12, 1.87, 0x1f63d8, 0, 1.3, 0)); return g; }
  function hoseLine(L) { const g = new THREE.Group(); let prev = [0, 0.05, 0]; for (let k = 1; k <= 8; k++) { const p = [k * L / 8, 0.05, Math.sin(k * 1.3) * 0.5]; g.add(bar(prev, p, 0.07, 0xd9c35a)); prev = p; } return g; }
  const strip = (L, D, col) => box(L, 0.03, D, col || 0x6f6a62, 0, 0.015, 0);
  const L = { motorhome, car, caravan, tentDome, tentRidge, gazebo, campfire, logBench, grillKettle, table, chair, cooler, crates, tvSet, sofa, generator, satDish, mat,
    boombox, house, picketFence, clothesline, woodpile, chopBlock, bench, dog, scaffold, stand, marshalPost, fireTruck, ambulance, heras, gate, policeBike, foodTruck,
    highTable, tyreStack, warmers, toolChest, camTower, camHead, bag, stool, trolley, parasol, flagPole, bike, hammock, kidPool, stringLights, gasBottle, trashBag, bin,
    portaloo, beerSet, van, tractor, trampoline, bigScreen, quad, scooter, cone, fanBanner, wheelbarrow, fridge, pullBar, dumbbell, beanBag, mailbox, flowerBed, shed,
    pitStand, mediaVan, hoseLine, strip, item, box, cyl, sph, grp };

  /* ---------------- the scenes ----------------
     A scene's frame (frame): a along the track (+ ahead), b from the barrier away from the road (0: the barrier, + beyond it). Each is a group of
     2-10 people (the user's wish) with its things round them. A person's states (as in tools/ljudje/prizori.js): act (what it does before the car
     comes: a, b, pose, t, face ('road' | [da, db]), hold [[kind, hand 0 left | 1 right, options]], head [[kind]], y (over the ground), on (a thing's
     key: a, b, y in its frame, yaw), look ('car' | radians), rx (lying)); run: false (it stays: the staff, the one asleep), { f, pose, t, hold } (it
     runs to the fence: f its speed share; pose 'walk': it walks), or { a, b, pose, ... } (it goes to a place of its own first); fence: where it
     watches the car pass, and how; zac: the moment it hears the car; bliza: what changes at its own place as the car comes; mimo: at its place as
     the car passes. clear: the circles [a, b, r] where the trees and the old crowd are taken out. */
  const S = {};
  const DE = [0x15171c, 0xd8262a, 0xf2c21a];   // (flags: Germany; others below by the track's country, FLAGS)

  /* 1 · Žar pred avtodomom (Nürburg, the straight before Schwedenkreuz) */
  S.zar = { seed: 11, clear: [[0, 6.5, 12], [-15, 6, 7]],
    build(C, F, K) {
      C.prop(L.motorhome(0x2f63c9), 0, 8.4, [0, -1]);
      C.prop(L.stringLights(4.0, 2.3), -0.8, 4.75, [0, -1]);
      C.prop(L.table(1.3, 0.75), -0.7, 5.7, [1, 0]);
      C.prop(L.chair(0xd8262a), -1.65, 5.7, [1, 0]); C.prop(L.chair(0x2f9a48), 0.25, 5.7, [-1, 0]); C.prop(L.chair(0xf0c22e), -0.7, 6.55, [0, -1]);
      C.prop(L.grillKettle(), 3.4, 4.6); C.prop(L.gasBottle(), 4.1, 5.2); C.prop(L.cooler(0xd8262a), 1.6, 6.9); C.prop(L.crates(3), -3.3, 7.0, [0, -1]);
      C.prop(L.flagPole(K.flag, 6), -5.4, 4.2); C.prop(L.bike(0x22848f), 4.4, 7.5, [1, 0]); C.prop(L.trashBag(), -4.3, 8.5);
      C.prop(L.kidPool(), 6.6, 3.8); C.prop(L.grp(L.sph(0.11, 6, 3, 0xf4f4f0, 0, 0.11, 0)), 5.2, 3.0);
      C.man({ shirt: 0xd23a2c, pants: 0x2f3f63, vest: 0xf2f2ee, stripes: 0xf2f2ee, hat: 'cap', hatCol: 0xf2f2ee }, { act: { a: 3.4, b: 5.35, pose: 'grill', hold: [['tongs', 1]] }, fence: { a: 2.4, b: 0.9, pose: 'wave', t: 1.2, hold: [['tongs', 1]] }, run: { f: 0.45 } });
      C.man({ shirt: 0x2f63c9, pants: 0x47494f }, { act: { a: -1.65, b: 5.7, pose: 'sitDrink', face: [1, 0], hold: [['can', 1]] }, fence: { a: 0.7, b: 0.9, pose: 'cheer', t: 0.6, hold: [['can', 1]] }, run: { f: 0.58 } });
      C.man({ shirt: 0xf0c22e, pants: 0x1d1f25, hair: 'pony' }, { act: { a: 0.25, b: 5.7, pose: 'sitLean', face: [-1, 0] }, fence: { a: -0.8, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.5 } });
      C.man({ shirt: 0x8a3b8c, pants: 0x2f3f63, hair: 'long' }, { act: { a: -0.7, b: 6.55, pose: 'sit', face: [0, -1] }, fence: { a: -2.3, b: 1.0, pose: 'wave2', t: 0.4 }, run: { f: 0.45 } });
      C.man({ kid: true, shirt: 0xf07a1c, pants: 0x2f63c9, shorts: true }, { act: { a: 6.6, b: 3.8, y: 0.06, pose: 'sitGround', face: [-1, -0.3] }, fence: { a: 1.5, b: 0.85, pose: 'jump' }, run: { f: 0.85 }, kid: true });
    } };

  /* 2 · Ogenj na travi (Nürburg, the woods before Adenauer Forst) */
  S.ogenj = { seed: 21, clear: [[0, 7, 13], [-15, 6, 7]],
    build(C, F, K) {
      C.prop(L.campfire(), 0, 6.2);
      C.prop(L.logBench(1.8), 0, 7.9, [0, -1]); C.prop(L.logBench(1.6), -1.75, 6.3, [1, 0]); C.prop(L.logBench(1.6), 1.8, 6.1, [1, 0]);
      C.prop(L.tentDome(0xf07a1c), -5.6, 10.6, [0.4, -1]); C.prop(L.tentDome(0x2f9a48, 1.2), 5.2, 10.8, [-0.3, -1]); C.prop(L.tentRidge(0x2f63c9), 8.0, 6.6, [-1, 0]);
      C.prop(L.hammock(3.2), -6.2, 4.6, [0, -1], 'ham');
      const wood = L.woodpile(1.4); wood.scale.set(1, 0.6, 0.8); C.prop(wood, -3.8, 8.6, [0, -1]); C.prop(L.chopBlock(), -3.2, 4.6);
      C.prop(L.cooler(0x2f9a48), -2.4, 9.4); C.prop(L.crates(2, [0xc8201c, 0xc8201c]), 3.4, 9.2); C.prop(L.bike(0xd8262a), 2.8, 10.6, [1, 0]); C.prop(L.flagPole(K.flag2 || K.flag, 5.5), 4.4, 3.4);
      C.man({ shirt: 0x2f9a48, pants: 0x47494f, hat: 'beanie', hatCol: 0xd23a2c, long: true }, { act: { a: -0.55, b: 7.9, pose: 'sitStick', face: [0, -1], hold: [['stick', 1]] }, fence: { a: -0.6, b: 0.9, pose: 'wave', t: 0.5, hold: [['stick', 1]] }, run: { f: 0.55 } });
      C.man({ shirt: 0xd23a2c, pants: 0x2f3f63, long: true }, { act: { a: 0.6, b: 7.9, pose: 'sitStick', face: [-0.2, -1], hold: [['stick', 1]] }, fence: { a: 0.6, b: 0.9, pose: 'cheer', t: 1.7, hold: [['stick', 1]] }, run: { f: 0.6 } });
      C.man({ shirt: 0x31406e, pants: 0x5b5040, hair: 'long', long: true }, { act: { a: -1.75, b: 6.4, pose: 'sitStick', face: [1, 0], hold: [['stick', 1]] }, fence: { a: -1.8, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.5 } });
      C.man({ shirt: 0x7c4a2e, pants: 0x1d1f25, hat: 'cap', hatCol: 0x262a33, long: true }, { act: { a: 3.0, b: 8.0, pose: 'carry', face: [-1, -0.3], hold: [['wood', 1]] }, fence: { a: 1.9, b: 0.9, pose: 'wave2', t: 1.0 }, run: { f: 0.45, hold: [] } });
      C.man({ shirt: 0xf0c22e, pants: 0x2f3f63, hair: 'pony' }, { act: { a: 1.8, b: 6.1, pose: 'sitDrink', face: [-1, 0.1], hold: [['bottle', 1]] }, fence: { a: 3.0, b: 0.95, pose: 'jump', hold: [['bottle', 1]] }, run: { f: 0.62 } });
      C.man({ shirt: 0x5b5040, pants: 0x262a33, hair: 'short' }, { act: { a: -5.3, b: 4.6, y: 1.0, pose: 'lie', rx: -1.5, face: [1, 0], still: true }, run: false });   // (asleep in the hammock: he does not wake up)
    } };

  /* 3 · Telovadba ob prikolici (Nürburg, Döttinger Höhe) */
  S.telo = { seed: 31, clear: [[0, 7, 13], [-15, 6, 7]],
    build(C, F, K) {
      const cv = L.caravan(0xd8262a), cr = L.car(0x7c8a99); cr.position.set(6.4, 0, 0); cv.add(cr); C.prop(cv, -1.5, 10.4, [0, -1]);
      for (const [a, col] of [[-3.2, 0x8a3b8c], [-0.6, 0x22848f], [2.0, 0xf07a1c]]) C.prop(L.grp(L.mat(col)), a, 5.0, [1, 0]);
      for (const [a, b] of [[-2.4, 6.2], [-2.1, 6.3], [1.2, 6.1]]) C.prop(L.dumbbell(), a, b, [1, 0]);
      C.prop(L.pullBar(), 5.6, 6.6, [0, -1]); C.prop(L.boombox(), 3.8, 7.4, [-0.5, -1]); C.prop(L.cooler(0x2f63c9), -5.6, 7.6); C.prop(L.chair(0x2f63c9), -6.4, 6.4, [0.5, -1]); C.prop(L.parasol(0x2f9a48), -6.2, 6.8);
      C.prop(L.flagPole(K.flag2 || K.flag, 5.5), 8.0, 4.0);
      C.man({ shirt: 0xd23a2c, pants: 0x1d1f25, shorts: true, hair: 'short' }, { act: { a: -3.2, b: 5.0, pose: 'jack0' }, fence: { a: -2.2, b: 0.9, pose: 'jump' }, run: { f: 0.6 } });
      C.man({ shirt: 0x22848f, pants: 0x262a33, hair: 'pony' }, { act: { a: -0.6, b: 5.0, pose: 'squat' }, fence: { a: -0.6, b: 0.9, pose: 'cheer', t: 0.2 }, run: { f: 0.55 } });
      C.man({ shirt: 0xf0c22e, pants: 0x31406e, shorts: true }, { act: { a: 2.0, b: 5.0, pose: 'stretch' }, fence: { a: 0.9, b: 0.9, pose: 'jack0' }, run: { f: 0.5 } });
      C.man({ shirt: 0x262a33, pants: 0x47494f, shorts: true, hair: 'bald' }, { act: { a: 5.6, b: 6.6, y: 0.42, pose: 'hang', face: [0, -1] }, fence: { a: 2.4, b: 0.95, pose: 'wave', t: 0.9 }, run: { f: 0.45 } });
      C.man({ shirt: 0xefefea, pants: 0x2f3f63, hat: 'cap', hatCol: 0x2f63c9 }, { act: { a: -6.4, b: 6.4, pose: 'sitDrink', face: [0.5, -1], hold: [['bottle', 1, { c: 0x8acbe8 }]] }, fence: { a: -3.6, b: 1.0, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.55 } });
    } };

  /* 4 · Dirka na televiziji pod šotorom (Nürburg, the straight before Schwalbenschwanz) */
  S.tv = { seed: 41, clear: [[0, 7, 13], [-15, 6, 7]],
    build(C, F, K) {
      C.prop(L.gazebo(0x2f63c9, 3.6), 0, 5.8); C.prop(L.stringLights(3.6, 2.05), 0, 4.0, [0, -1]);
      C.prop(L.tvSet(), 0, 4.3, [0, 1]); C.prop(L.sofa(0x7c4a2e), 0, 7.1, [0, -1]); C.prop(L.chair(0xd8262a), 1.95, 6.2, [-0.5, -1]); C.prop(L.beanBag(0xf0c22e), -1.95, 6.2);
      C.prop(L.fridge(), 2.9, 7.6, [0, -1]); C.prop(L.generator(), 4.4, 8.4, [0, -1]); C.prop(L.satDish(), -3.0, 7.8, [0.2, -1]); C.prop(L.crates(3, [0xe0b020, 0xe0b020, 0xc8201c]), -3.4, 5.2);
      C.prop(L.tentDome(0xd8262a), -6.4, 10.4, [0.3, -1]); C.prop(L.van(0x2f9a48, 0xf2f2ee), 6.8, 10.8, [0, -1]); C.prop(L.portaloo(0x2f9a48), -8.5, 7.0); C.prop(L.flagPole(K.flag, 6), 4.6, 3.6);
      C.man({ shirt: 0xd23a2c, pants: 0x2f3f63, hat: 'cap', hatCol: 0xd23a2c }, { act: { a: -0.62, b: 7.05, pose: 'sofa', face: [0, -1] }, fence: { a: -0.9, b: 0.9, pose: 'cheer', t: 1.2 }, run: { f: 0.52 } });
      C.man({ shirt: 0x262a33, pants: 0x47494f, hair: 'bald' }, { act: { a: 0.05, b: 7.05, pose: 'sofa', face: [0, -1], hold: [['can', 1]] }, bliza: { look: -0.9 }, mimo: { look: -1.0, tw: -0.2 }, run: false });   // (the lazy one stays on the sofa)
      C.man({ shirt: 0x2f9a48, pants: 0x1d1f25, hair: 'long' }, { act: { a: 0.7, b: 7.05, pose: 'sofa', face: [0, -1] }, fence: { a: 0.6, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.46 } });
      C.man({ shirt: 0xf0c22e, pants: 0x2f3f63 }, { act: { a: 1.95, b: 6.2, pose: 'sitDrink', face: [-0.5, -1], hold: [['can', 1]] }, fence: { a: 1.9, b: 0.9, pose: 'wave', t: 0.3, hold: [['can', 1]] }, run: { f: 0.6 } });
      C.man({ shirt: 0x8a3b8c, pants: 0x5b5040, hat: 'beanie', hatCol: 0x2f63c9 }, { act: { a: -1.95, b: 6.25, y: -0.08, pose: 'sitGround', face: [0.4, -1] }, fence: { a: -2.4, b: 0.95, pose: 'jump' }, run: { f: 0.62 } });
      C.man({ shirt: 0x22848f, pants: 0x262a33, hair: 'pony' }, { act: { a: 2.9, b: 7.1, pose: 'bend', face: [0, 1] }, fence: { a: 3.3, b: 0.95, pose: 'wave2', t: 0.7 }, run: { f: 0.5 } });
    } };

  /* 5 · Hiša ob cesti (Ouninpohja, the yellow house: it stands 16 m from the centre line, 12 m along the road and 8 m deep, so here a in [-6, 6],
     b in [16 - bar - 4, 16 - bar + 4]; the family's yard beside it, the garden fence along the road in front) */
  S.hisa = { seed: 51, clear: [[12, 5, 7], [-11, 4, 6], [0, -1, 6]],
    build(C, F) {
      const front = 16 - F.bar - 4, fb = front - 3.1;
      C.prop(L.picketFence(33, 0xf2f0ea), 1.5, fb, [0, -1]); C.prop(L.mailbox(), -15.8, fb - 0.6);
      C.prop(L.flowerBed(3), 3.6, front - 0.45, [0, -1]); C.prop(L.bench(0x7c5a3a), -2.2, front - 0.75, [0, -1]); C.prop(L.bike(0xd8262a), 6.6, front - 0.5, [1, 0]);
      C.prop(L.clothesline(4.6), 13.0, front + 0.6, [0, -1]); C.prop(L.trampoline(), 11.6, front + 4.6);
      C.prop(L.woodpile(2.4), -10.6, front + 2.6, [1, 0]); C.prop(L.chopBlock(), -9.2, front - 0.4); C.prop(L.wheelbarrow(0x2f9a48), -8.0, front + 1.6, [1, 0]);
      C.prop(L.tractor(0xd8262a), -14.6, front + 3.2, [1, 0]);
      C.pet(L.dog(0x5c3a22), { act: { a: 1.8, b: front - 1.2, face: [1, -0.3] }, fence: { a: 6.6, b: fb + 0.6, face: [1, -0.2] }, run: { f: 1.1 } });
      C.man({ shirt: 0x7c4a2e, pants: 0x31406e, long: true, hat: 'cap', hatCol: 0x262a33 }, { act: { a: -9.2, b: front + 0.2, pose: 'chopUp', face: [0, -1], hold: [['axe', 1]] }, fence: { a: -3.4, b: fb + 0.5, pose: 'wave', t: 0.6 }, run: { f: 0.45, pose: 'walk', hold: [] } });
      C.man({ shirt: 0xb8bcc4, pants: 0x6a6f78, long: true, hat: 'beanie', hatCol: 0x8a3b8c, scale: 0.92 }, { act: { a: -2.2, b: front - 0.7, pose: 'sit', face: [0, -1] }, fence: { a: -1.8, b: fb + 0.5, pose: 'wave2', t: 0.2 }, run: { f: 0.4, pose: 'walk' } });
      C.man({ shirt: 0x2f63c9, pants: 0x2f3f63, hair: 'pony' }, { act: { a: 13.0, b: front + 1.2, pose: 'cheer', t: 0, face: [0, -1] }, fence: { a: 2.8, b: fb + 0.5, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.5, pose: 'walk' } });
      C.man({ kid: true, shirt: 0xd23a2c, pants: 0x2f63c9, shorts: true }, { act: { a: 11.6, b: front + 4.6, y: 0.88, pose: 'jump', face: [0, -1] }, fence: { a: 4.2, b: fb + 0.45, pose: 'jump' }, run: { f: 0.8 }, kid: true });
      C.man({ kid: true, shirt: 0xf0c22e, pants: 0x31406e, shorts: true, hair: 'pony', scale: 1.15 }, { act: { a: 10.0, b: front + 2.6, pose: 'cheer', t: 0.4, face: [0.6, 1] }, fence: { a: 5.4, b: fb + 0.45, pose: 'wave', t: 1.3 }, run: { f: 0.7 }, kid: true });
    } };

  /* 6 · Oder iz gradbenih odrov (Nürburg, Quiddelbacher Höhe) */
  S.oder = { seed: 61, clear: [[0, 6.5, 12], [-15, 6, 9], [-26, 8, 7]],
    build(C, F, K) {
      C.prop(L.scaffold({ banner: K.flag, flagA: K.flag, flagB: K.flag2 || K.flag }), 0, 4.6, [0, -1], 'sc');
      C.prop(L.beerSet(2.2), 4.6, 5.6, [1, 0]); C.prop(L.portaloo(0x2f63c9), -6.0, 8.6); C.prop(L.bin(), -4.7, 8.8);
      C.prop(L.flagPole(K.flag2 || K.flag, 6.5), -3.6, 2.6); C.prop(L.flagPole(K.flag, 6.5), 3.6, 2.4);
      const ban = L.fanBanner(K.flag, 4.5); ban.add(L.box(0.06, 2.0, 0.06, 0x9aa0a8, -2.25, 1.0, 0)); ban.add(L.box(0.06, 2.0, 0.06, 0x9aa0a8, 2.25, 1.0, 0)); C.prop(ban, 0, 0.55, [0, -1]);
      C.prop(L.tentDome(0xf0c22e), -6.2, 11.5, [0.3, -1]); C.prop(L.car(0xb8bcc4), 6.5, 11.2, [0, -1]);
      const H = 4.48;
      C.man({ shirt: 0x15171c, pants: 0x2f3f63, hat: 'cap', hatCol: 0xd8262a }, { act: { on: 'sc', a: -0.4, b: -0.3, y: H, pose: 'sofa' }, run: { on: 'sc', a: -0.4, b: 0.3, y: H, pose: 'cheer' }, fence: { on: 'sc', a: -0.45, b: 0.5, y: H, pose: 'jump' } });
      C.man({ shirt: 0xd8262a, pants: 0x1d1f25 }, { act: { on: 'sc', a: 0.2, b: -0.3, y: H, pose: 'sofa', hold: [['can', 1]] }, run: { on: 'sc', a: 0.3, b: 0.4, y: H, pose: 'stand', hold: [['can', 1]] }, fence: { on: 'sc', a: 0.35, b: 0.55, y: H, pose: 'wave', t: 1.0, hold: [['horn', 1]] } });
      C.man({ shirt: 0xf0c22e, pants: 0x2f3f63, hair: 'long' }, { act: { on: 'sc', a: 0.8, b: -0.3, y: H, pose: 'sofa' }, run: { on: 'sc', a: 1.05, b: 0.35, y: H, pose: 'phone', hold: [['phone', 1]] }, fence: { on: 'sc', a: 1.15, b: 0.5, y: H, pose: 'cheer', t: 0.8 } });
      C.man({ shirt: 0xefefea, pants: 0x47494f, hat: 'cap', hatCol: 0x15171c }, { act: { on: 'sc', a: -1.15, b: 0.7, y: H, pose: 'flagHold', hold: [['flag', 1, { cols: K.flag }]] }, run: { on: 'sc', a: -1.15, b: 0.7, y: H, pose: 'flagWave', t: 0.5, hold: [['flag', 1, { cols: K.flag }]] }, fence: { on: 'sc', a: -1.15, b: 0.7, y: H, pose: 'flagWave', t: 2.2, hold: [['flag', 1, { cols: K.flag }]] } });
      C.man({ shirt: 0x2f9a48, pants: 0x1d1f25 }, { act: { a: 4.6, b: 5.0, pose: 'sitDrink', face: [0, 1], hold: [['can', 1]] }, fence: { a: 2.6, b: 0.9, pose: 'cheer', t: 0.3 }, run: { f: 0.55 } });
      C.man({ shirt: 0x31406e, pants: 0x5b5040, hair: 'pony' }, { act: { a: 4.6, b: 6.2, pose: 'sit', face: [0, -1] }, fence: { a: 3.7, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.48 } });
      C.man({ shirt: 0xf07a1c, pants: 0x2f3f63, hat: 'cap', hatCol: 0x2f63c9 }, { act: { a: -2.6, b: 7.6, pose: 'carryWalk', t: 0.8, face: [0.3, -1], hold: [['crate', 1, { c: 0xe0b020 }]] }, fence: { a: -2.0, b: 0.9, pose: 'wave2', t: 1.6 }, run: { f: 0.5, hold: [] } });
    } };

  /* 7 · Tribuna z valom (Bathurst, the straight before the last corner): friends in groups of 2-10 with empty seats between them; the ones by the
     car stand up as it comes and sit down behind it (the wave goes with it) */
  S.tribuna = { seed: 71, clear: [[0, 5, 15]], stand: true,
    build(C, F, K) {
      const Ls = 20, n = 5; C.prop(L.stand(Ls, n, { seat: K.seat || 0x1f63d8 }), 0, 3.2, [0, -1], 'st');
      C.prop(L.bigScreen(), 14.8, 2.4, [-0.5, -1]); C.prop(L.portaloo(0x2f63c9), 13.0, 9.5); C.prop(L.portaloo(0x2f63c9), 14.3, 9.5); C.prop(L.bin(), 11.7, 9.8);
      for (const a of [-10, -5, 0, 5, 10]) C.prop(L.flagPole(Math.abs(a) % 10 ? K.flag : [0xf2f2f2, K.flag[0]], 4), a, 3.2 + n * 0.85 + 0.6);
      const R = rnd, cols = SHIRT; C.seats = [];
      for (let r = 0; r < n; r++) { let x = -Ls / 2 + 1.4 + R() * 1.2;
        while (x <= Ls / 2 - 1.4) { const g = 2 + Math.floor(Math.pow(R(), 2.2) * 9), team = cols[Math.floor(R() * cols.length)];
          for (let k = 0; k < g && x <= Ls / 2 - 1.4; k++, x += 0.62) { const P = C.man({ lite: true, shirt: R() < 0.5 ? team : cols[Math.floor(R() * cols.length)], hat: R() < 0.3 ? 'cap' : null, scale: 0.93 + R() * 0.08 }, null);
            P.seat = { x, r, y: 0.6 + r * 0.42 + 0.22 - 0.5 + 0.02, z: -r * 0.85 - 0.1, k: R() }; C.seats.push(P); }
          x += 0.62 * (2 + Math.floor(R() * 7)); } }
    } };

  /* 8 · Fotografi in TV kamera (Spa, before Eau Rouge) */
  S.foto = { seed: 81, clear: [[0, 6, 12]],
    build(C, F) {
      C.prop(L.camTower(0xf2f2f2), 2.6, 3.6, [0, -1], 'tw'); C.mover(L.camHead(), 'tw', 0, 4.34, 0.35, 'cam');
      C.prop(L.mediaVan(), -6.5, 8.6, [0, -1]); C.prop(L.gazebo(0x262a33, 2.6), -1.6, 6.8); C.prop(L.table(1.0, 0.6, { things: false }), -1.6, 6.8, [0, -1]);
      C.prop(L.grp(L.box(0.34, 0.03, 0.24, 0x2a2c31, 0, 0.75, 0), L.box(0.34, 0.22, 0.02, 0x4a7fb8, 0, 0.87, -0.1, { basic: true, rx: -0.3 })), -1.75, 6.8, [0, -1]);
      C.prop(L.bag(0x23262c), -3.2, 3.9); C.prop(L.bag(0x5b5040), -2.6, 4.3, 0.5); C.prop(L.stool(), -4.4, 4.4); C.prop(L.cone(), -0.3, 0.8); C.prop(L.cone(), 5.2, 0.8);
      const vest = { shirt: 0x2a2c31, pants: 0x3a4a3a, vest: 0xd9c35a, stripes: 0x8a7a3a, long: true };
      C.man(Object.assign({ hat: 'cap', hatCol: 0x15171c }, vest), { act: { a: -4.4, b: 4.4, pose: 'sit', face: [0.5, -1], head: [['camera']] }, run: { f: 0.62, pose: 'walk' }, fence: { a: -2.4, b: 0.85, pose: 'crouchCam', head: [['camera']], look: 'car' } });
      C.man(Object.assign({}, vest, { hair: 'pony' }), { act: { a: -2.4, b: 5.4, pose: 'drink', face: [0.7, -1], hold: [['cup', 1]] }, run: { f: 0.6, pose: 'walk' }, fence: { a: -0.6, b: 0.85, pose: 'kneel', head: [['camera']], look: 'car' } });
      C.man(Object.assign({}, vest, { hat: 'beanie', hatCol: 0x31406e }), { act: { a: -1.1, b: 7.3, pose: 'talk', face: [-1, 0] }, run: { f: 0.55 }, fence: { a: 5.6, b: 0.9, pose: 'cam', head: [['camera']], look: 'car' } });
      C.man({ shirt: 0x15171c, pants: 0x1d1f25, hat: 'cap', hatCol: 0x15171c, long: true }, { act: { on: 'tw', a: 0.0, b: -0.55, y: 3.04, pose: 'relax', cam: true }, run: false, fence: { on: 'tw', a: 0.0, b: -0.5, y: 3.04, pose: 'cam', cam: true } });
      C.man({ shirt: 0xf2f2ee, pants: 0x262a33, long: true, hat: 'cap', hatCol: 0x1f63d8 }, { act: { a: -4.6, b: 6.6, pose: 'talk', face: [1, 0.2] }, run: false, fence: { a: -4.6, b: 6.6, pose: 'arms', face: [1, 0.2], look: 'car' } });
    } };

  /* 9 · Maršali na postaji (Spa, Kemmel) */
  S.marsali = { seed: 91, clear: [[0, 4.5, 10]],
    build(C, F) {
      C.prop(L.marshalPost(), 0, 3.4, [0, -1]);
      C.prop(L.quad(0xf07a1c), 4.6, 4.8, [1, -0.2]); C.prop(L.box(1.2, 0.5, 0.9, 0x6a6f78, 0, 0.45, 0), 6.4, 5.0, [1, -0.2]); C.prop(L.parasol(0xf07a1c, 0xf2f2ee), -2.8, 3.4);
      C.prop(L.bin(0x2f63c9), -4.2, 4.6); for (const [a, b] of [[7.4, 3.4], [7.8, 3.6], [8.2, 3.3]]) C.prop(L.cone(), a, b); C.prop(L.tyreStack(3, 0x15171c), -5.2, 2.6);
      const ORA = { shirt: 0xf07a1c, pants: 0xf07a1c, long: true, belt: 0xd9dde2, hat: 'cap', hatCol: 0xf07a1c };
      C.man(Object.assign({}, ORA), { act: { a: 1.0, b: 1.6, pose: 'sitDrink', face: [-0.3, -1], hold: [['radio', 1]] }, bliza: { pose: 'radio' }, run: false, fence: { a: 1.0, b: 1.2, pose: 'radio', hold: [['radio', 1]], look: 'car' } });
      C.man(Object.assign({}, ORA, { hat: null, hair: 'short' }), { act: { a: 6.5, b: 0.8, pose: 'sweep', face: [1, -0.2], hold: [['broom', 1]] }, run: { a: 4.4, b: 1.6, pose: 'walk', face: [-1, 0.6], hold: [['broom', 1]] }, fence: { a: 3.5, b: 1.5, pose: 'stand', hold: [['ext', 1]], look: 'car' } });
      C.man(Object.assign({}, ORA, { hat: null, hair: 'pony' }), { act: { a: -2.8, b: 3.4, pose: 'sit', face: [0.6, -1], hold: [['clip', 1]] }, run: { a: -1.1, b: 0.9, pose: 'flagHold', face: [0, -1], hold: [['mflag', 1, { c: 0xf5d21a }]] }, fence: { a: -1.1, b: 0.85, pose: 'flagHold', hold: [['mflag', 1, { c: 0xf5d21a }]], look: 'car' } });
      C.man(Object.assign({}, ORA, { hatCol: 0xf2f2f2 }), { act: { a: 4.4, b: 4.2, pose: 'arms', face: [-1, -0.3] }, run: { a: 4.0, b: 2.6, pose: 'walk', face: [-0.6, -1] }, fence: { a: -3.4, b: 1.3, pose: 'flagHold', hold: [['mflag', 1, { c: 0x1f63d8 }]], look: 'car' } });
    } };

  /* 10 · Gasilci in reševalci (Spa, before Blanchimont) */
  S.gasilci = { seed: 101, clear: [[0, 6, 13], [-11, 6, 6]],
    build(C, F) {
      C.prop(L.grp(L.strip(30, 4.4)), -3.5, 6.6, [0, -1]);
      C.prop(L.fireTruck(), 1.0, 6.6, [0, -1]); C.prop(L.car(0xf2f2f2, { bar: 0x2f6bff, stripe: 0xd8262a, L: 4.8 }), -8.4, 6.6, [0, -1]);
      C.prop(L.hoseLine(5), -3.0, 3.6, [0, -1]); C.prop(L.item('ext'), 4.6, 4.2); C.prop(L.item('ext'), 4.9, 4.4); for (const a of [-1.5, 6.8, 7.4]) C.prop(L.cone(), a, 1.2);
      C.prop(L.gazebo(0xf2f2f2, 3.0), -14.5, 5.6); C.prop(L.box(1.9, 0.5, 0.6, 0xd8262a, 0, 0.55, 0), -14.5, 5.6, [1, 0]); C.prop(L.chair(0x2f63c9), -13.4, 4.4, [0, -1]);
      const FF = { shirt: 0x2c2f38, pants: 0x2c2f38, long: true, hat: 'fire', hatCol: 0xd8262a, vest: 0x2c2f38, stripes: 0xe8d84a };
      C.man(Object.assign({}, FF), { act: { a: 2.6, b: 4.85, pose: 'sitDrink', face: [0, -1], hold: [['cup', 1]] }, run: { a: 2.6, b: 4.2, pose: 'stand', hold: [['cup', 1]], look: 'car' }, fence: { a: 2.4, b: 2.8, pose: 'thumbs', look: 'car' } });
      C.man(Object.assign({}, FF, { hatCol: 0xf2f2f2 }), { act: { a: -2.6, b: 4.9, pose: 'bend', face: [0, 1] }, run: { a: -2.6, b: 4.4, pose: 'arms', face: [0, -1] }, fence: { a: -1.6, b: 2.2, pose: 'arms', look: 'car' } });
      C.man(Object.assign({}, FF), { act: { a: -5.6, b: 4.1, pose: 'talk', face: [1, 0] }, run: { a: -5.4, b: 3.7, pose: 'talk', face: [0, -1] }, fence: { a: -4.4, b: 2.0, pose: 'wave', t: 0.8, look: 'car' } });
      C.man({ shirt: 0xf2f2f2, pants: 0x1f2c48, vest: 0x2a9a3a, stripes: 0xf2f2f2 }, { act: { a: -4.5, b: 4.1, pose: 'stand', face: [-1, 0], hold: [['clip', 1]] }, run: { a: -4.4, b: 3.5, pose: 'stand', face: [0, -1], hold: [['clip', 1]] }, fence: { a: -3.4, b: 2.2, pose: 'stand', hold: [['clip', 1]], look: 'car' } });
      C.man({ shirt: 0xf2f2f2, pants: 0x1f2c48, vest: 0x2a9a3a, stripes: 0xf2f2f2, hair: 'pony' }, { act: { a: -13.4, b: 4.4, pose: 'sit', face: [0, -1] }, run: { a: -13.0, b: 3.4, pose: 'walk', face: [0.4, -1] }, fence: { a: -11.6, b: 2.0, pose: 'wave2', t: 0.5, look: 'car' } });
    } };

  /* 11 · Vhod: varnostniki, policija, hrana (Spa, the finish straight before La Source) */
  S.vhod = { seed: 111, clear: [[0, 8, 15]],
    build(C, F, K) {
      C.prop(L.gate(), 1.0, 10.0, [0, -1]);
      for (const a of [-1.6, 3.6]) C.prop(L.flagPole(K.flag, 5.5), a, 9.4);
      C.prop(L.car(0xf2f2f2, { bar: 0x2f6bff, stripe: 0x1f4aa8 }), 8.0, 12.6, [0, -1]); C.prop(L.policeBike(), 6.2, 8.6, [1, -0.3]); for (const a of [4.6, 5.4]) C.prop(L.cone(), a, 7.4);
      C.prop(L.foodTruck(0xf0c22e), -8.2, 6.6, [0, -1]); C.prop(L.highTable(), -3.4, 4.2); C.prop(L.highTable(0xd8262a), -1.2, 5.4); C.prop(L.parasol(0xd8262a), -3.4, 4.2);
      C.prop(L.portaloo(0x2f63c9), -14.2, 9.6); C.prop(L.portaloo(0x2f63c9), -15.5, 9.6); C.prop(L.bin(), -5.3, 5.3); C.prop(L.bin(0xd8262a), -12.0, 4.6);
      const SEC = { shirt: 0x15171c, pants: 0x15171c, vest: 0xf5e21a, stripes: 0xc9ccd2 }, POL = { shirt: 0x1f2c48, pants: 0x1f2c48, long: true, hat: 'police', hatCol: 0x1f2c48, vest: 0xd9f02a };
      C.man(Object.assign({ hair: 'bald' }, SEC), { act: { a: -0.4, b: 9.7, pose: 'hips', face: [0, 1] }, run: false, fence: { a: -0.4, b: 9.5, pose: 'arms', look: 'car' } });
      C.man({ shirt: 0xd23a2c, pants: 0x2f3f63, hat: 'cap', hatCol: 0xd23a2c }, { act: { a: -0.4, b: 10.6, pose: 'carry', face: [0, -1], hold: [['bag', 1, { c: 0x2a3d6b }]] }, run: { a: -0.3, b: 9.0, pose: 'walk', face: [0, -1], hold: [['bag', 1, { c: 0x2a3d6b }]] }, fence: { a: 0.6, b: 0.9, pose: 'cheer', t: 0.5 } });
      C.man(Object.assign({}, POL), { act: { a: 3.6, b: 8.0, pose: 'direct', face: [-1, -0.2], hold: [['baton', 1]] }, run: false, fence: { a: 3.6, b: 8.0, pose: 'wave', t: 0.4, look: 'car' } });
      C.man(Object.assign({}, POL, { hat: null, hair: 'short' }), { act: { a: 6.3, b: 11.2, pose: 'arms', face: [0, -1] }, run: false, fence: { a: 6.3, b: 11.2, pose: 'arms', look: 'car' } });
      C.man({ shirt: 0xf2f2ee, pants: 0x262a33, vest: 0xd8262a, stripes: 0xd8262a, hat: 'cap', hatCol: 0xf2f2ee }, { act: { a: -8.8, b: 7.0, y: 0.25, pose: 'grill', face: [0, -1], hold: [['tongs', 1]] }, run: false, fence: { a: -8.8, b: 7.0, y: 0.25, pose: 'wave', t: 0.5, look: 'car' } });
      C.man({ shirt: 0x2f9a48, pants: 0x47494f }, { act: { a: -8.8, b: 4.9, pose: 'stand', face: [0, 1] }, run: { f: 0.5 }, fence: { a: -5.0, b: 0.9, pose: 'cheer', t: 1.0 } });
      C.man({ shirt: 0x8a3b8c, pants: 0x2f3f63, hair: 'long' }, { act: { a: -8.6, b: 4.1, pose: 'phone', face: [0, 1], hold: [['phone', 1]] }, run: { f: 0.42, pose: 'walk' }, fence: { a: -3.6, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] } });
      C.man({ shirt: 0xf0c22e, pants: 0x1d1f25, hat: 'cap', hatCol: 0x2f63c9 }, { act: { a: -3.4, b: 3.7, pose: 'drink', face: [0, 1], hold: [['cup', 1, { c: 0xd8262a }]] }, fence: { a: -2.2, b: 0.9, pose: 'wave', t: 1.4, hold: [['cup', 1, { c: 0xd8262a }]] }, run: { f: 0.6 } });
      C.man({ shirt: 0x22848f, pants: 0x5b5040 }, { act: { a: -1.2, b: 4.8, pose: 'talk', face: [-1, -0.4], hold: [['cup', 1]] }, fence: { a: -1.0, b: 0.9, pose: 'cheer', t: 2.0, hold: [['cup', 1]] }, run: { f: 0.55 } });
    } };

  /* 12 · Mehaniki v boksih (Bathurst, the pit wall on the finish straight) */
  S.boksi = { seed: 121, clear: [],
    build(C, F, K) {
      const col = K.team || 0x1f63d8, TEAM = { shirt: col, pants: col, long: true, belt: 0xf2f2f2, hat: 'cap', hatCol: 0x15171c, gloves: 0x15171c };
      C.prop(L.pitStand(col, 4.5), -6.0, 1.2, [0, -1], 'ps');
      C.prop(L.tyreStack(4, 0xd8262a), -0.9, 1.7); C.prop(L.tyreStack(3, 0xd8262a), -0.2, 1.9); C.prop(L.warmers(col), 2.4, 1.6, [1, 0]); C.prop(L.toolChest(col), 5.2, 1.5, [0, -1]);
      C.prop(L.scooter(col), 7.4, 1.8, [1, 0]);
      C.man(Object.assign({}, TEAM), { act: { a: 0.6, b: 1.5, pose: 'talk', face: [0, -1], hold: [['radio', 1]] }, bliza: { pose: 'stand', look: 'car' }, run: false, fence: { a: 0.6, b: 0.8, pose: 'boardOut', look: 'car', hold: [['board', 1]] } });
      C.man(Object.assign({}, TEAM), { act: { a: 1.7, b: 2.2, pose: 'arms', face: [-1, 0] }, fence: { a: 2.0, b: 0.85, pose: 'fenceWave', t: 0.6 }, run: { f: 0.55 } });
      C.man(Object.assign({}, TEAM, { hat: null }), { act: { a: -2.6, b: 2.3, pose: 'carryWalk', t: 0.5, face: [1, 0], hold: [['tire', 1]] }, fence: { a: -1.0, b: 0.85, pose: 'cheer', t: 1.0 }, run: { f: 0.6, hold: [] } });
      C.man(Object.assign({}, TEAM), { act: { a: 3.6, b: 2.0, pose: 'kneel', face: [-1, 0] }, fence: { a: 3.4, b: 0.85, pose: 'fence' }, run: { f: 0.5 } });
      const ENG = { shirt: 0xf2f2f2, pants: 0x1f2c48, long: true, hat: 'cap', hatCol: col };
      for (const [x, k] of [[-1.6, 0], [-0.05, 1], [1.5, 2]]) C.man(Object.assign({}, ENG), { act: { on: 'ps', a: x, b: -0.25, y: 1.25, pose: 'sitLean' }, run: false, fence: { on: 'ps', a: x, b: -0.25, y: 1.25, pose: k === 1 ? 'thumbs' : 'sitLean', look: 'car' } });
    } };
  /* ---------------- more scenes for the other tracks (the user's wish: »različne elemente na različna mesta«): their colours are drawn per
     scene (TENT, CARS ...), so the same kind is never twice the same; K: the track's country (flags, the houses' look) ---------------- */
  const TENT = [0xf07a1c, 0x2f9a48, 0x2f63c9, 0xd8262a, 0xf0c22e, 0x8a3b8c, 0x22848f], CARS = [0xb8bcc4, 0x2f3f63, 0x7c8a99, 0xd8d8d2, 0x8a2a24, 0x2f5a3a, 0x1d1f25, 0xc8b070];
  const CHAIR = [0xd8262a, 0x2f9a48, 0xf0c22e, 0x2f63c9, 0x15171c, 0xf07a1c], JERSEY = [0xd8262a, 0xf0c22e, 0x22848f, 0xf07a1c, 0x2f63c9, 0x8a3b8c, 0x2f9a48, 0xefefea];
  const stove = () => grp(box(0.5, 0.12, 0.3, 0x5b6068, 0, 0.06, 0), cyl(0.12, 0.11, 0.14, 7, 0x9aa0a8, -0.12, 0.19, 0), cyl(0.11, 0.1, 0.16, 7, 0x2a2c31, 0.13, 0.2, 0));
  const blanket = (c1, c2) => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) g.add(box(0.6, 0.012, 0.6, (i + j) % 2 ? c1 : c2, -0.9 + i * 0.6, 0.006, -0.6 + j * 0.6)); return g; };
  const basket = () => grp(box(0.45, 0.26, 0.3, 0xb08a5a, 0, 0.13, 0), bar([-0.18, 0.26, 0], [0, 0.42, 0], 0.025, 0x8a6a45), bar([0.18, 0.26, 0], [0, 0.42, 0], 0.025, 0x8a6a45));
  const ladder = () => { const g = new THREE.Group(); for (const x of [-0.25, 0.25]) { g.add(bar([x, 0, 0.45], [x, 1.5, 0.05], 0.05, 0x9aa0a8)); g.add(bar([x, 0, -0.4], [x, 1.5, 0.0], 0.05, 0x9aa0a8)); }
    for (let k = 1; k <= 4; k++) g.add(box(0.55, 0.04, 0.16, 0x9aa0a8, 0, k * 0.34, 0.45 - k * 0.1)); g.add(box(0.6, 0.05, 0.3, 0x5b6068, 0, 1.5, 0.03)); return g; };
  const tape = (L) => { const g = new THREE.Group(), n = Math.max(2, Math.round(L / 3)); for (let k = 0; k <= n; k++) g.add(cyl(0.025, 0.025, 1.0, 4, 0xdedede, -L / 2 + k * L / n, 0.5, 0));
    for (let k = 0; k < Math.round(L / 0.5); k++) g.add(box(0.5, 0.06, 0.01, k % 2 ? 0xf2f2f2 : 0xd8262a, -L / 2 + 0.25 + k * 0.5, 0.92, 0)); return g; };
  const board = (c) => grp(box(0.08, 1.6, 0.08, 0x9aa0a8, 0, 0.8, 0), box(0.62, 0.62, 0.03, c || 0x1f4aa8, 0, 1.75, 0.03), box(0.3, 0.3, 0.035, 0xf2f2f2, 0, 1.75, 0.035));   // a plain sign board (no writing)
  const swingSet = () => { const g = new THREE.Group(), wd = 0x8a6a45; for (const x of [-1.1, 1.1]) { g.add(bar([x, 0, -0.7], [x, 2.2, 0], 0.09, wd)); g.add(bar([x, 0, 0.7], [x, 2.2, 0], 0.09, wd)); }
    g.add(box(2.4, 0.1, 0.1, wd, 0, 2.22, 0)); for (const x of [-0.25, 0.25]) g.add(bar([x, 2.2, 0], [x, 0.55, 0], 0.015, 0xdedede)); g.add(box(0.6, 0.05, 0.22, 0xd23a2c, 0, 0.53, 0)); return g; };
  // the houses' look by the country: wall, trim, roof, door
  const HOUSES = { alp: { wall: 0xf2efe6, trim: 0x6b4a2e, roof: 0x5a3a2a, door: 0x6b4a2e }, fin: { wall: 0x9b2c22, trim: 0xf2f0ea, roof: 0x2b2d31, door: 0x2f4a3a },
    usa: { wall: 0xe8e4d8, trim: 0xf6f6f2, roof: 0x4a4c50, door: 0x2f4a6a }, aus: { wall: 0xe6dcc0, trim: 0xf2f2ee, roof: 0x8a2a24, door: 0x2f5a3a },
    jpn: { wall: 0xcfc6b4, trim: 0x3a3632, roof: 0x3a4048, door: 0x5a4a3a }, sud: { wall: 0xe8c86a, trim: 0xf2f2ee, roof: 0x9a4a2a, door: 0x2f63c9 }, rus: { wall: 0x7a5a3a, trim: 0x2f63c9, roof: 0x4a5a4a, door: 0x5a3a24 } };

  /* 13 · Kamp s prikolico (a caravan, its awning, tents, cooking, cards at the table) */
  S.kamp = { seed: 131, clear: [[0, 7, 13], [-12, 6, 7]],
    build(C, F, K) {
      C.prop(L.caravan(pick(TENT)), -2.2, 9.8, [0, -1]); C.prop(L.gazebo(pick(TENT), 3.0), -2.2, 6.6); C.prop(L.car(pick(CARS)), 5.6, 10.4, [0, -1]);
      C.prop(L.tentDome(pick(TENT)), 6.6, 5.4, [-0.4, -1]); C.prop(L.tentDome(pick(TENT), 1.15), -8.4, 6.0, [0.4, -1]);
      C.prop(L.table(1.2, 0.7), -2.6, 6.4, [1, 0]); C.prop(L.chair(pick(CHAIR)), -3.5, 6.4, [1, 0]); C.prop(L.chair(pick(CHAIR)), -1.7, 6.4, [-1, 0]); C.prop(L.chair(pick(CHAIR)), 1.2, 4.6, [0.3, -1]);
      C.prop(stove(), -0.5, 7.9); C.prop(L.cooler(pick(TENT)), 0.3, 8.3); C.prop(L.gasBottle(), -0.2, 8.6); C.prop(L.stringLights(3.0, 2.15), -2.2, 5.1, [0, -1]);
      C.prop(L.flagPole(K.flag, 5.5), 2.6, 3.0); C.prop(L.bike(pick(TENT)), 3.6, 8.6, [1, 0]); C.prop(L.trashBag(), -5.6, 9.2);
      C.man({ shirt: pick(SHIRT), pants: pick(PANTS), hat: 'cap', hatCol: pick(SHIRT) }, { act: { a: -0.5, b: 7.5, pose: 'grill', face: [0, 1], hold: [['tongs', 1]] }, fence: { a: -0.4, b: 0.9, pose: 'wave', t: 0.4, hold: [['tongs', 1]] }, run: { f: 0.5 } });
      C.man({ shirt: pick(SHIRT), pants: pick(PANTS) }, { act: { a: -3.5, b: 6.4, pose: 'sitLean', face: [1, 0] }, fence: { a: -1.6, b: 0.9, pose: 'cheer', t: 0.8 }, run: { f: 0.55 } });
      C.man({ shirt: pick(SHIRT), pants: pick(PANTS), hair: 'long' }, { act: { a: -1.7, b: 6.4, pose: 'sitLean', face: [-1, 0] }, fence: { a: -2.8, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.5 } });
      C.man({ shirt: pick(SHIRT), pants: pick(PANTS), hair: 'bald' }, { act: { a: 1.2, b: 4.6, pose: 'sit', face: [0.3, -1], hold: [['clip', 1]] }, bliza: { look: 'car' }, run: false });   // (reading: he only looks up)
      C.man({ kid: true, shirt: pick(SHIRT), pants: pick(PANTS), shorts: true }, { act: { a: 3.0, b: 6.2, pose: 'jump', face: [-1, 0] }, fence: { a: 1.0, b: 0.85, pose: 'jump' }, run: { f: 0.85 }, kid: true });
    } };

  /* 14 · Piknik (a family on a blanket by its car, the children with a ball) */
  S.piknik = { seed: 141, clear: [[0, 6, 11]],
    build(C, F, K) {
      const c1 = pick([0xd8262a, 0x2f63c9, 0x2f9a48]); C.prop(blanket(c1, 0xf2f0ea), -0.8, 5.4, [0, -1]); C.prop(basket(), -1.6, 5.2); C.prop(L.cooler(pick(TENT)), 0.4, 6.1);
      C.prop(L.grp(L.cyl(0.12, 0.1, 0.02, 8, 0xf4f4f0, 0, 0.02, 0), L.cyl(0.12, 0.1, 0.02, 8, 0xf4f4f0, 0.35, 0.02, 0.2)), -0.6, 5.0); C.prop(L.parasol(pick(TENT), 0xf2f2ee), -2.6, 6.0);
      C.prop(L.car(pick(CARS)), 1.0, 10.2, [1, 0]); C.prop(L.chair(pick(CHAIR)), 1.6, 6.8, [-0.4, -1]); C.prop(L.grp(L.sph(0.12, 6, 3, pick([0xf2f2f2, 0xd8262a, 0xf0c22e]), 0, 0.12, 0)), 4.4, 4.0);
      C.man({ shirt: pick(SHIRT), pants: pick(PANTS) }, { act: { a: -1.4, b: 5.8, pose: 'sitGround', face: [0.3, -1] }, fence: { a: -1.2, b: 0.9, pose: 'wave', t: 0.2 }, run: { f: 0.45 } });
      C.man({ shirt: pick(SHIRT), pants: pick(PANTS), hair: 'long' }, { act: { a: -0.2, b: 5.6, pose: 'sitGround', face: [-0.4, -1], hold: [['cup', 1]] }, fence: { a: 0.0, b: 0.9, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.42, pose: 'walk' } });
      C.man({ shirt: pick([0xb8bcc4, 0x8a3b8c, 0x31406e]), pants: pick(PANTS), hair: 'short', hairCol: 0xc8c8c4, scale: 0.92 }, { act: { a: 1.6, b: 6.8, pose: 'sit', face: [-0.4, -1] }, bliza: { look: 'car' }, mimo: { look: 'car' }, run: false, fence: { a: 1.6, b: 6.8, pose: 'wave2', t: 0.4, face: [-0.4, -1], look: 'car' } });
      C.man({ kid: true, shirt: pick(SHIRT), pants: pick(PANTS), shorts: true }, { act: { a: 3.6, b: 3.4, pose: 'jump', face: [1, 0.3] }, fence: { a: 2.0, b: 0.85, pose: 'jump' }, run: { f: 0.85 }, kid: true });
      C.man({ kid: true, shirt: pick(SHIRT), pants: pick(PANTS), shorts: true, hair: 'pony', scale: 1.1 }, { act: { a: 5.4, b: 4.4, pose: 'cheer', t: 0.6, face: [-1, -0.3] }, fence: { a: 3.0, b: 0.85, pose: 'wave', t: 1.1 }, run: { f: 0.75 }, kid: true });
    } };

  /* 15 · Kolesarji na počitku (cyclists resting on a pass: bikes, bottles, helmets) */
  S.kolesarji = { seed: 151, clear: [[0, 4.5, 10]],
    build(C, F, K) {
      for (const [a, b, d] of [[-3.0, 2.4, [1, 0.2]], [-1.6, 2.6, [1, -0.1]], [2.6, 2.3, [1, 0]], [4.0, 2.5, [1, 0.15]]]) C.prop(L.bike(pick(JERSEY)), a, b, d);
      C.prop(L.cooler(0xf2f2f2), 0.6, 4.4); C.prop(L.bag(pick([0x15171c, 0x2f63c9])), -0.8, 4.8);
      const rider = (o) => Object.assign({ shirt: pick(JERSEY), pants: 0x15171c, shorts: true, hat: 'helmet', hatCol: pick(JERSEY) }, o);
      C.man(rider(), { act: { a: -2.2, b: 3.6, pose: 'drink', face: [0.6, -1], hold: [['bottle', 1, { c: 0x8acbe8 }]] }, fence: { a: -2.0, b: 0.9, pose: 'cheer', t: 0.5 }, run: { f: 0.45, pose: 'walk' } });
      C.man(rider(), { act: { a: -0.6, b: 3.8, pose: 'talk', face: [-1, -0.2] }, fence: { a: -0.4, b: 0.9, pose: 'wave', t: 0.9 }, run: { f: 0.45, pose: 'walk' } });
      C.man(rider(), { act: { a: 1.0, b: 3.4, pose: 'stretch', face: [0, -1] }, fence: { a: 1.0, b: 0.9, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.45, pose: 'walk' } });
      C.man(rider(), { act: { a: 3.2, b: 3.1, pose: 'bend', face: [0, 1] }, fence: { a: 2.4, b: 0.9, pose: 'wave2', t: 0.3 }, run: { f: 0.45, pose: 'walk' } });
    } };

  /* 16 · Fotografi na bregu (photographers at a corner without a tower: the ladder, the bags) */
  S.foto2 = { seed: 161, clear: [[0, 5, 10]],
    build(C, F) {
      C.prop(ladder(), 1.6, 3.6, [0, -1], 'ld'); C.prop(L.bag(0x23262c), -1.4, 3.4); C.prop(L.bag(0x5b5040), -0.8, 3.8, 0.6); C.prop(L.stool(), -2.6, 4.2); C.prop(L.parasol(0x262a33, 0x262a33), -2.6, 4.6);
      C.prop(L.scooter(pick([0x15171c, 0xd8262a, 0xb8bcc4])), 4.4, 5.2, [1, -0.3]);
      const vest = { shirt: 0x2a2c31, pants: 0x3a4a3a, vest: 0xd9c35a, stripes: 0x8a7a3a, long: true };
      C.man(Object.assign({ hat: 'cap', hatCol: 0x15171c }, vest), { act: { on: 'ld', a: 0, b: 0.05, y: 1.52, pose: 'sit', head: [['camera']] }, run: false, fence: { on: 'ld', a: 0, b: 0.15, y: 1.52, pose: 'cam', head: [['camera']], look: 'car' } });
      C.man(Object.assign({}, vest, { hair: 'pony' }), { act: { a: -2.6, b: 4.2, pose: 'sit', face: [0.5, -1], hold: [['clip', 1]] }, run: { f: 0.6, pose: 'walk' }, fence: { a: -1.2, b: 0.85, pose: 'kneel', head: [['camera']], look: 'car' } });
      C.man(Object.assign({}, vest, { hat: 'beanie', hatCol: 0x31406e }), { act: { a: -0.4, b: 5.2, pose: 'drink', face: [-0.5, -1], hold: [['cup', 1]] }, run: { f: 0.55 }, fence: { a: 0.2, b: 0.9, pose: 'crouchCam', head: [['camera']], look: 'car' } });
    } };

  /* 17 · Redarji ob traku (a rally stage's marshals at the tape, a radio point's plain board, two fans) */
  S.reli = { seed: 171, clear: [[0, 5, 11]],
    build(C, F, K) {
      C.prop(tape(16), 0, 2.4, [0, -1]); C.prop(L.gazebo(0xf07a1c, 2.6), -3.6, 6.0); C.prop(L.table(1.0, 0.6, { things: false }), -3.6, 6.0, [0, -1]); C.prop(L.item('radio'), -3.6, 6.0);
      C.prop(board(0x1f4aa8), 2.8, 3.0); C.prop(L.car(pick(CARS), { stripe: 0xf07a1c }), 3.2, 8.4, [1, 0]); C.prop(L.chair(0x15171c), -4.4, 6.6, [0, -1]);
      const MAR = { shirt: 0x262a33, pants: 0x2f3f63, vest: 0xf07a1c, stripes: 0xd9dde2, long: true };
      C.man(Object.assign({ hat: 'cap', hatCol: 0xf07a1c }, MAR), { act: { a: -3.6, b: 5.4, pose: 'radio', face: [0, -1], hold: [['radio', 1]] }, run: false, fence: { a: -3.6, b: 5.4, pose: 'radio', hold: [['radio', 1]], look: 'car' } });
      C.man(Object.assign({}, MAR), { act: { a: -0.6, b: 3.1, pose: 'arms', face: [0, -1] }, run: false, fence: { a: -0.6, b: 3.0, pose: 'hips', look: 'car' } });
      C.man(Object.assign({}, MAR, { hair: 'pony' }), { act: { a: 1.8, b: 3.4, pose: 'stand', face: [0.3, -1], hold: [['clip', 1]] }, run: false, fence: { a: 1.8, b: 3.1, pose: 'stand', hold: [['clip', 1]], look: 'car' } });
      C.man({ shirt: pick(SHIRT), pants: pick(PANTS), hat: 'beanie', hatCol: pick(SHIRT) }, { act: { a: -6.4, b: 6.8, pose: 'talk', face: [1, 0] }, fence: { a: -5.0, b: 2.9, pose: 'cheer', t: 0.6 }, run: { f: 0.55 } });
      C.man({ shirt: pick(SHIRT), pants: pick(PANTS) }, { act: { a: -5.6, b: 7.4, pose: 'phone', face: [-1, -0.2], hold: [['phone', 1]] }, fence: { a: -6.2, b: 2.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.5 } });
    } };

  /* 18 · Družina pri svoji hiši (a house of the country's look, the garden fence along the road, wood, washing, the children, the dog) */
  S.hisa2 = { seed: 181, clear: [[0, 9, 14], [-12, 6, 7], [12, 6, 7]],
    build(C, F, K) {
      const H = HOUSES[K.house || 'alp'] || HOUSES.alp, fb = 2.4;
      C.prop(L.house({ w: 7.2, d: 5.4, h: 2.8, wall: H.wall, trim: H.trim, roof: H.roof, door: H.door }), 0, 12.2, [0, -1]);
      C.prop(L.picketFence(26, K.fence || 0xf2f0ea), 0, fb, [0, -1]); C.prop(L.mailbox(), -11.2, fb - 0.5);
      C.prop(L.flowerBed(2.6), 2.8, 9.0, [0, -1]); C.prop(L.bench(0x7c5a3a), -2.6, 8.9, [0, -1]); C.prop(L.clothesline(4.2), 8.4, 7.6, [0, -1]);
      C.prop(L.woodpile(2.2), -8.6, 9.6, [1, 0]); C.prop(L.chopBlock(), -7.2, 7.2); C.prop(swingSet(), 7.4, 11.6, [0, -1]); C.prop(L.bike(pick(TENT)), 4.6, 8.7, [1, 0]);
      C.pet(L.dog(pick([0x5c3a22, 0x2a221c, 0xc8a878])), { act: { a: 1.4, b: 7.6, face: [1, -0.3] }, fence: { a: 4.4, b: fb + 0.6, face: [1, -0.2] }, run: { f: 1.1 } });
      C.man({ shirt: pick(SHIRT), pants: pick(PANTS), long: true, hat: 'cap', hatCol: pick(SHIRT) }, { act: { a: -7.2, b: 7.6, pose: 'chopUp', face: [0, -1], hold: [['axe', 1]] }, fence: { a: -3.0, b: fb + 0.5, pose: 'wave', t: 0.6 }, run: { f: 0.45, pose: 'walk', hold: [] } });
      C.man({ shirt: pick([0xb8bcc4, 0x7c4a2e, 0x31406e]), pants: pick(PANTS), long: true, hairCol: 0xc8c8c4, hair: 'short', scale: 0.92 }, { act: { a: -2.6, b: 8.8, pose: 'sit', face: [0, -1] }, fence: { a: -1.6, b: fb + 0.5, pose: 'wave2', t: 0.2 }, run: { f: 0.4, pose: 'walk' } });
      C.man({ shirt: pick(SHIRT), pants: pick(PANTS), hair: 'pony' }, { act: { a: 8.4, b: 8.2, pose: 'cheer', t: 0, face: [0, -1] }, fence: { a: 2.6, b: fb + 0.5, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.5, pose: 'walk' } });
      C.man({ kid: true, shirt: pick(SHIRT), pants: pick(PANTS), shorts: true }, { act: { a: 7.4, b: 11.4, y: 0.1, pose: 'sit', face: [0, -1] }, fence: { a: 3.8, b: fb + 0.45, pose: 'jump' }, run: { f: 0.8 }, kid: true });
      C.man({ kid: true, shirt: pick(SHIRT), pants: pick(PANTS), shorts: true, hair: 'pony', scale: 1.15 }, { act: { a: 5.0, b: 6.2, pose: 'jump', face: [-0.6, 1] }, fence: { a: 5.2, b: fb + 0.45, pose: 'wave', t: 1.3 }, run: { f: 0.7 }, kid: true });
    } };

  /* ---------------- building a scene ---------------- */
  // the frame beside the track at s on a side (+1 right, -1 left): w(a, b) world x, z; y(a, b) the ground; yaw(da, db) THREE's rotation.y of a facing
  function frame(T, gH, s, side) {
    const i = T.idx(((s % T.len) + T.len) % T.len), bar = side > 0 ? T.br[i] : T.bl[i];
    const tx = T.tx[i], tz = T.tz[i], nx = T.nx[i] * side, nz = T.nz[i] * side, px = T.px[i], pz = T.pz[i];
    const F = { i, s, side, bar, tx, tz, nx, nz, px, pz, hy: T.hy ? T.hy[i] : 0,
      w: (a, b) => [px + tx * a + nx * (bar + b), pz + tz * a + nz * (bar + b)],
      y: (a, b) => { const h = gH(px + tx * a + nx * (bar + b), pz + tz * a + nz * (bar + b)); return Number.isFinite(h) ? h : F.hy; },
      yaw: (da, db) => Math.atan2(tx * da + nx * db, tz * da + nz * db) };
    return F;
  }
  function ctxOf(F) {
    const C = { F, people: [], pets: [], movers: [], groups: {}, L: { P: [], N: [], C: [] }, U: { P: [], C: [] }, smoke: [] };
    C.yawOf = (dir) => dir == null ? F.yaw(0, -1) : typeof dir === 'number' ? F.yaw(0, -1) + dir : F.yaw(dir[0], dir[1]);
    C.prop = (o, a, b, dir, key, sink) => {
      const [x, z] = F.w(a, b), yaw = C.yawOf(dir); o.position.set(x, F.y(a, b) - (sink || 0), z); o.rotation.y = yaw; o.updateMatrixWorld(true);
      bake(o, null, C.L, C.U);
      o.traverse(m => { if (m.userData.smoke) { _a.setFromMatrixPosition(m.matrixWorld); C.smoke.push(Object.assign({ x: _a.x, y: _a.y, z: _a.z }, m.userData.smoke)); } });
      if (key) C.groups[key] = { m: o.matrixWorld.clone(), yaw };
      return o;
    };
    C.man = (look, st) => { const P = person(look); P.st = st; C.people.push(P); return P; };
    C.pet = (model, st) => { C.pets.push({ model, st }); };
    C.mover = (model, on, x, y, z, key) => { C.movers.push({ model, on, x, y, z, key }); };
    return C;
  }
  // a rigid moving thing (a dog, a camera's head): one joint, its model baked in that joint's frame
  function rigid(model) {
    const root = new THREE.Group(), D = { P: [], N: [], C: [] }; bake(model, null, D, D);
    return { root, J: [root], sc: 1, nv: D.P.length / 3, parts: [{ b: 0, P: new Float32Array(D.P), N: new Float32Array(D.N), C: new Float32Array(D.C), k: null }] };
  }
  function itemsOf(st) {
    const keys = new Set();
    for (const k of ['act', 'run', 'fence', 'zac', 'bliza', 'mimo']) { const s = st[k]; if (!s || typeof s !== 'object') continue;
      for (const h of s.hold || []) keys.add(keyOf(h)); for (const h of s.head || []) keys.add(keyOf(h, 'H')); }
    return keys;
  }
  const showOf = (s) => { const k = new Set(); if (s) { for (const h of s.hold || []) k.add(keyOf(h)); for (const h of s.head || []) k.add(keyOf(h, 'H')); } return k; };

  /* ---------------- a person's day: what it does, the way to the fence and back (functions of time: posed only when seen) ---------------- */
  const WARN = 2.8, BACK = 4, WALK = 1.45, FENCE_T = 1.8;
  const STRIDE = { run: 2.4, walk: 4.5, carryWalk: 4.5 };   // (the stride's radians per metre)
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x, wrapA = (a) => a - TAU * Math.round(a / TAU);
  const at0 = (s) => s.on ? { on: s.on, a: s.a, b: s.b, y: s.y || 0 } : { a: s.a, b: s.b, y: s.y || 0 };
  function moveSeg(segs, from, to, t, v, pose, hold) {   // a walk or a run from one place to another (on the ground, or on the same thing)
    const same = (from.on || null) === (to.on || null), d = same ? Math.hypot(to.a - from.a, to.b - from.b) : 0, dur = same ? Math.max(0.25, d / v) : 0.01;
    segs.push({ t0: t, t1: t + dur, mv: { from, to, d, pose, hold: showOf({ hold: hold || [] }) } }); return t + dur;
  }
  // at the alert: the way out (each person its reaction time d0 and its speed v)
  function planOut(p, al) {
    const st = p.st, A = st.act, R = st.run, Fe = st.fence, segs = [], t1 = al + p.d0;
    segs.push({ t0: al, t1, s: Object.assign({}, A, st.zac || st.bliza || {}) });
    if (R === false || (!R && !Fe)) {   // it stays (the staff, the lazy one): what changes at its place as the car comes, then the fence state there
      const B = Object.assign({}, A, st.bliza || {}), tf = al + FENCE_T;
      segs.push({ t0: t1, t1: tf, s: B });
      if (Fe) { const f = at0(Fe), a = at0(A); const t2 = (f.on || null) === (a.on || null) && Math.hypot(f.a - a.a, f.b - a.b) > 0.3 ? moveSeg(segs, a, f, tf, WALK, 'walk', Fe.hold) : tf; segs.push({ t0: t2, t1: 1e9, s: Fe, fence: true }); }
      else segs.push({ t0: tf, t1: 1e9, s: Object.assign({}, B, st.mimo || {}), fence: true });
      return segs;
    }
    let cur = at0(A), t = t1;
    if (R && R.a != null) {   // a place of its own first (staff to the edge, the scaffold's railing), at a walk unless it says otherwise
      const r = at0(R); t = moveSeg(segs, cur, r, t, R.pose === 'run' ? p.v : WALK, R.pose === 'run' ? 'run' : 'walk', R.hold || A.hold);
      const tf = Math.max(t, al + FENCE_T); segs.push({ t0: t, t1: tf, s: R }); cur = r; t = tf;
    }
    if (Fe) { const f = at0(Fe), pose = R && R.pose === 'walk' ? 'walk' : R && R.a != null ? 'walk' : 'run';
      t = moveSeg(segs, cur, f, t, pose === 'run' ? p.v : WALK, pose, R && R.hold != null ? R.hold : (Fe.hold || [])); segs.push({ t0: t, t1: 1e9, s: Fe, fence: true }); }
    return segs;
  }
  // ~4 s after the car has passed: back to what it was doing, at a walk (from wherever it is now)
  function planBack(p, Sc, t) {
    const now = segAt(p, Sc, t), A = p.st.act, from = now.mv ? lerpPlace(now.mv, clamp((t - now.t0) / (now.t1 - now.t0), 0, 1)) : at0(now.s), segs = [];
    const tb = t + p.bd; segs.push({ t0: t, t1: tb, s: now.mv ? Object.assign({}, now.mv.to, { pose: 'stand' }) : now.s, fence: !!now.fence });
    const t2 = moveSeg(segs, from, at0(A), tb, WALK, A.hold && A.hold.length && A.pose === 'carryWalk' ? 'carryWalk' : 'walk', A.hold);
    segs.push({ t0: t2, t1: 1e9, s: A, act: true });
    p.segs = segs; return t2;
  }
  const lerpPlace = (mv, f) => ({ on: mv.to.on, a: mv.from.a + (mv.to.a - mv.from.a) * f, b: mv.from.b + (mv.to.b - mv.from.b) * f, y: mv.from.y + (mv.to.y - mv.from.y) * f });
  const ACT = { t0: 0, t1: 1e9, act: true };
  function segAt(p, Sc, t) {
    if (Sc.al < 0 || !p.segs) { ACT.s = p.st.act; return ACT; }
    const sg = p.segs; let k = 0; while (k < sg.length - 1 && t >= sg[k].t1) k++;
    return sg[k];
  }

  /* ---------------- posing: the joints from the state, the figure's vertices into the scene's mesh ---------------- */
  // a place in the scene: on the ground (the frame) or on a thing (its matrix); its world position into out, returns the frame's yaw there
  function placeOf(Sc, pl, out) {
    if (pl.on) { const G = Sc.groups[pl.on]; out.set(pl.a, pl.y || 0, pl.b).applyMatrix4(G.m); return G.yaw; }
    const F = Sc.F, [x, z] = F.w(pl.a, pl.b); out.set(x, F.y(pl.a, pl.b) + (pl.y || 0), z); return 0;
  }
  const _w = new THREE.Vector3(), _q = new THREE.Vector3();
  function poseOne(Sc, p, t, car) {
    const P = p.P, sg = segAt(p, Sc, t), F = Sc.F;
    let pose, pt = 0, J, yaw, look = null, rx = 0, show;
    if (sg.mv) {   // walking or running
      const f = clamp((t - sg.t0) / Math.max(1e-3, sg.t1 - sg.t0), 0, 1), mv = sg.mv, pl = lerpPlace(mv, f);
      const gy = placeOf(Sc, pl, _w), da = mv.to.a - mv.from.a, db = mv.to.b - mv.from.b;
      yaw = pl.on ? gy + Math.atan2(da, db) : (Math.abs(da) + Math.abs(db) > 1e-3 ? F.yaw(da, db) : F.yaw(0, -1));
      pose = mv.pose; pt = f * mv.d * (STRIDE[pose] || 4) + p.ph * TAU; J = poseJ(pose, pt); show = mv.hold;
    } else {
      const s = sg.s, gy = placeOf(Sc, s, _w);
      if (s.cam && Sc.movers.length) {   // the cameraman on the tower: behind the camera, turning with it
        const Mv = Sc.movers[0], G = Sc.groups[Mv.on]; _q.set(Mv.x, Mv.y, Mv.z).applyMatrix4(G.m); const cy = Mv.yaw;
        _w.x = _q.x - Math.sin(cy) * 0.85; _w.z = _q.z - Math.cos(cy) * 0.85; yaw = cy;
      } else if (s.on) yaw = gy + (s.yaw || 0);
      else { const fc = s.face == null || s.face === 'road' ? null : s.face; yaw = fc ? F.yaw(fc[0], fc[1]) : F.yaw(0, -1); }
      pose = s.pose || 'stand'; rx = s.rx || 0; show = sg === ACT ? (p.actShow || (p.actShow = showOf(s))) : (sg.show || (sg.show = showOf(s)));
      if (sg.act && !s.still) {   // what it does: its own motion, or a breath
        const m = MOTION[pose], tt = t + p.ph * 17;
        if (m && m.alt) { let u = 0.5 - 0.5 * Math.cos((tt * m.hz) * TAU); if (m.snap) u = u * u * (3 - 2 * u); J = mixJ(poseJ(pose, s.t || 0), poseJ(m.alt, 0), u); }
        else if (m && (pose === 'walk' || pose === 'carryWalk')) {   // pacing back and forth along its facing (carrying a crate, a tyre)
          const fc = s.face && s.face !== 'road' ? s.face : [1, 0], L0 = Math.hypot(fc[0], fc[1]) || 1, ux = fc[0] / L0, uz = fc[1] / L0, per = 6.4, u = ((tt / per) % 1 + 1) % 1, tri = u < 0.5 ? u * 4 - 1 : 3 - u * 4, d = tri * 1.6;
          const pl = { a: s.a + ux * d, b: s.b + uz * d, y: s.y || 0 }; placeOf(Sc, pl, _w); yaw = u < 0.5 ? F.yaw(ux, uz) : F.yaw(-ux, -uz); J = poseJ(pose, tt * 3.2);
        }
        else if (m) J = poseJ(pose, (s.t || 0) + tt * m.rate);
        else { J = poseJ(pose, s.t || 0); J.look = (J.look || 0) + 0.35 * Math.sin(tt * 0.37) * Math.sin(tt * 0.11 + 1.3); J.lean = (J.lean || 0) + 0.02 * Math.sin(tt * 0.6); }
      } else J = poseJ(pose, (s.t || 0) + (t - sg.t0) * (RATE[pose] || 0) + (s.still ? 0 : p.ph * TAU));
      look = s.look != null ? s.look : sg.fence && car ? 'car' : null;
      if (sg.fence && car && !s.on && !s.face) {   // at the fence: turned a little towards the car (the head the rest of the way)
        const d = wrapA(Math.atan2(car.x - _w.x, car.z - _w.z) - yaw); yaw += clamp(d * 0.3, -0.45, 0.45);
      }
    }
    P.root.position.set(_w.x, _w.y + (J.dy || 0) * P.sc, _w.z); P.root.rotation.set(rx, yaw, 0, 'YXZ'); P.root.scale.setScalar(P.sc);
    setJ(P, J);
    if (look === 'car' && car) { const d = wrapA(Math.atan2(car.x - _w.x, car.z - _w.z) - yaw); P.torso.rotation.y += clamp(d * 0.35, -0.5, 0.5); P.head.rotation.y = clamp(d - P.torso.rotation.y, -1.1, 1.1); }
    else if (typeof look === 'number') P.head.rotation.y = look;
    if (sg.s && sg.s.tw) P.torso.rotation.y += sg.s.tw;
    P.root.updateMatrixWorld(true);
    write(P, show, Sc.pos, Sc.nor);
  }
  function write(P, show, pos, nor) {   // the joints' matrices on the baked parts
    for (const pt of P.parts) {
      const o = pt.o, p = pt.P, n = pt.N, L = p.length;
      if (pt.k && !(show && show.has(pt.k))) { pos.fill(0, o, o + L); continue; }   // (not held now: nothing drawn)
      const e = P.J[pt.b].matrixWorld.elements;
      for (let i = 0; i < L; i += 3) {
        const x = p[i], y = p[i + 1], z = p[i + 2], a = n[i], b = n[i + 1], c = n[i + 2];
        pos[o + i] = e[0] * x + e[4] * y + e[8] * z + e[12]; pos[o + i + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; pos[o + i + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        nor[o + i] = e[0] * a + e[4] * b + e[8] * c; nor[o + i + 1] = e[1] * a + e[5] * b + e[9] * c; nor[o + i + 2] = e[2] * a + e[6] * b + e[10] * c;
      }
    }
  }
  // a pet (the dog): out to the fence with the people, along it as the car passes, back; a little bounce while it runs
  function posePet(Sc, p, t, car) {
    const sg = segAt(p, Sc, t), F = Sc.F; let yaw, dy = 0;
    if (sg.mv) { const f = clamp((t - sg.t0) / Math.max(1e-3, sg.t1 - sg.t0), 0, 1), pl = lerpPlace(sg.mv, f); placeOf(Sc, pl, _w); yaw = F.yaw(sg.mv.to.a - sg.mv.from.a, sg.mv.to.b - sg.mv.from.b) || 0; dy = 0.07 * Math.abs(Math.sin(f * sg.mv.d * 3.2)); }
    else { const s = sg.s; let pl = s;
      if (sg.fence && Sc.pass >= 0) { const u = clamp((t - Sc.pass) / 2.2, 0, 1); pl = { a: s.a + u * 3.5, b: s.b }; dy = u < 1 ? 0.07 * Math.abs(Math.sin(u * 14)) : 0; }   // (along the fence after the car)
      else if (sg.fence) dy = 0.05 * Math.abs(Math.sin(t * 9));   // (barking, jumping at the fence)
      placeOf(Sc, pl, _w); const fc = s.face || [0, -1]; yaw = F.yaw(fc[0], fc[1]); }
    const P = p.P; P.root.position.set(_w.x, _w.y + dy, _w.z); P.root.rotation.set(0, yaw, 0); P.root.updateMatrixWorld(true); write(P, null, Sc.pos, Sc.nor);
  }
  // a moving camera's head on its tower: it pans slowly before the car comes, then follows it
  function poseMover(Sc, Mv, t, car) {
    const G = Sc.groups[Mv.on]; _q.set(Mv.x, Mv.y, Mv.z).applyMatrix4(G.m);
    let yaw = G.yaw + 0.5 * Math.sin(t * 0.23) + 0.3;
    if (car && Sc.al >= 0 && Math.hypot(car.x - _q.x, car.z - _q.z) < 160) yaw = Math.atan2(car.x - _q.x, car.z - _q.z);
    Mv.yaw = yaw; const P = Mv.P; P.root.position.copy(_q); P.root.rotation.set(0, yaw, 0); P.root.updateMatrixWorld(true); write(P, null, Sc.pos, Sc.nor);
  }
  // the grandstand's wave: the people by the car stand up as it comes (the wave goes with it), sit down behind it; heads to the car
  function poseStand(Sc, t, car, fixed) {
    const G = Sc.groups.st, dt = clamp(t - (Sc.ts == null ? t : Sc.ts), 0, 0.2); Sc.ts = t;
    const carA = car && Sc.da != null ? -Sc.da : -1e9;
    for (const p of Sc.people) {
      const P = p.P, st = P.seat, ax = st.x * Sc.sgn, dA = ax - carA + (st.k - 0.5) * 2, want = !fixed && dA > -4 && dA < 11 ? 1 : 0;
      const f0 = p.up || 0, f = p.up = want ? Math.min(1, f0 + dt * 3.2) : Math.max(0, f0 - dt * 1.6);
      const sig = f > 0 ? -1 : (car && carA > -60 && carA < Sc.len + 30 ? 1 : 0);
      if (!fixed && sig === p.sig && sig >= 0) continue; p.sig = sig;   // (still: not posed again)
      const up = poseJ(st.k < 0.55 ? 'cheer' : st.k < 0.75 ? 'jump' : st.k < 0.9 ? 'wave' : 'phoneUp', t * 6.5 + st.k * 9), sit = poseJ(st.k < 0.6 ? 'sit' : st.k < 0.8 ? 'sitDrink' : 'sitLean');
      const J = mixJ(sit, up, f); _w.set(st.x, st.y + 0.42 * f, st.z + 0.05 * f).applyMatrix4(G.m);
      P.root.position.set(_w.x, _w.y + (J.dy || 0) * P.sc, _w.z); P.root.rotation.set(0, G.yaw, 0); P.root.scale.setScalar(P.sc); setJ(P, J);
      if (sig === 1 && car) { const d = wrapA(Math.atan2(car.x - _w.x, car.z - _w.z) - G.yaw); P.head.rotation.y = clamp(d, -1.1, 1.1); }
      P.root.updateMatrixWorld(true); write(P, null, Sc.pos, Sc.nor);
    }
  }
  function poseScene(Sc, t, car, fixed) {
    for (const Mv of Sc.movers) poseMover(Sc, Mv, t, car);
    if (Sc.stand) poseStand(Sc, t, car, fixed);
    else for (const p of Sc.people) poseOne(Sc, p, t, car);
    for (const p of Sc.pets) posePet(Sc, p, t, car);
    const g = Sc.ppl.geometry; g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
  }
  function alert(Sc, t) {
    Sc.arm = false; Sc.al = t; Sc.pass = -1; Sc.back = -1; Sc.done = 1e9;
    if (!Sc.stand) for (const p of Sc.people.concat(Sc.pets)) p.segs = planOut(p, t);
  }
  function goBack(Sc, t) { Sc.back = t; let done = t; if (!Sc.stand) for (const p of Sc.people.concat(Sc.pets)) done = Math.max(done, planBack(p, Sc, t)); Sc.done = done + 0.5; }
  function reset(Sc) { Sc.arm = true; Sc.al = Sc.pass = Sc.back = -1; Sc.done = -1; Sc.da = null; Sc.ts = null; for (const p of Sc.people.concat(Sc.pets)) { p.segs = null; p.up = 0; p.sig = null; } }

  /* ---------------- smoke: soft puffs rising from the grills, the campfires, the chimneys (one instanced mesh per world, drawn only with a scene near) ---------------- */
  let puffG = null;
  const puffGeo = () => {   // a soft round puff: an icosahedron with a sphere's normals (smooth shading)
    if (puffG) return puffG; const g = new THREE.IcosahedronGeometry(1, 0), P = g.attributes.position, N = g.attributes.normal;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), l = Math.hypot(x, y, z) || 1; N.setXYZ(i, x / l, y / l + 0.35, z / l); }
    return (puffG = g); };
  const _m4 = new THREE.Matrix4(), _s3 = new THREE.Vector3(), _qq = new THREE.Quaternion(), _p3 = new THREE.Vector3();
  function smokeStep(W, t, fixed) {
    const M = W.smoke; if (!M) return;
    let any = false;
    for (const Sc of W.scenes) for (const e of Sc.smoke) {
      const on = fixed || Sc.on;
      for (let k = 0; k < e.n; k++) {
        const ph = ((t * 0.22 + k / e.n + e.ph) % 1 + 1) % 1, s = on ? (0.3 + ph * e.spread * 0.55) * (1 - ph * ph * ph) : 0;
        _p3.set(e.x + W.wx * ph * 2.2 + Math.sin(k * 1.7) * 0.15, e.y + ph * e.h, e.z + W.wz * ph * 2.2); _s3.set(s, s, s); _m4.compose(_p3, _qq, _s3); M.setMatrixAt(e.i + k, _m4);
      }
      any = any || on;
    }
    M.instanceMatrix.needsUpdate = true; M.visible = any;
  }

  /* ---------------- the ground where a scene stands: the trees and plants, the old crowd's figures, the glades' things taken out ---------------- */
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  function clearAll(o, circles, A) {
    if (!circles.length) return 0;
    const cell = new Map(), C = 24; for (const c of circles) for (let a = Math.floor((c[0] - c[2]) / C); a <= Math.floor((c[0] + c[2]) / C); a++) for (let b = Math.floor((c[1] - c[2]) / C); b <= Math.floor((c[1] + c[2]) / C); b++) { const k = a + ',' + b; let L = cell.get(k); if (!L) cell.set(k, L = []); L.push(c); }
    const inside = (x, z) => { const L = cell.get(Math.floor(x / C) + ',' + Math.floor(z / C)); if (L) for (const c of L) if ((x - c[0]) ** 2 + (z - c[1]) ** 2 < c[2] * c[2]) return true; return false; };
    const m4 = new THREE.Matrix4(), w4 = new THREE.Matrix4(); let n = 0;
    // the instanced plants and rocks: those on the vegetation list (o.cull), and any other instanced mesh whose shape is mostly green (a world's own
    // forest, as World.life reads it), and the old crowd's figures; not the posts, poles or boards a world may instance
    const veg = new Set((o.cull || []).map(e => e.m)), green = (m) => { const ca = m.geometry.attributes.color; if (!ca) return false; let r = 0, g = 0, b = 0; for (let k = 0; k < ca.count; k++) { r += ca.getX(k); g += ca.getY(k); b += ca.getZ(k); } return g > r * 1.08 && g > b * 1.08; };
    o.root.updateMatrixWorld(true);
    o.root.traverse(m => {
      if (m.userData.lj) return;
      if (m.isInstancedMesh && (m.name === 'crowd' || veg.has(m) || green(m))) {   // the instances inside (beyond the barrier) scaled to nothing
        const id = m.matrixWorld.equals(IDENT); let ch = false;
        for (let k = 0; k < m.count; k++) { m.getMatrixAt(k, m4); const e = id ? m4.elements : w4.multiplyMatrices(m.matrixWorld, m4).elements, x = e[12], z = e[14];
          if (e[0] === 0 && e[5] === 0) continue; if (!inside(x, z) || A.clearance(x, z) < 0.5) continue; m.setMatrixAt(k, ZERO); ch = true; n++; }
        if (ch) m.instanceMatrix.needsUpdate = true;
      } else if (m.isMesh && ((m.name === 'life' && m.matrixWorld.equals(IDENT)) || (m.parent && m.parent.name === 'crowds' && m.material && m.material.blending === THREE.MultiplyBlending))) {   // the glades' merged things and animals (in world space: not a live animal's own mesh, its shape shared by its kind), the crowd's shade on the grass
        const g = m.geometry, P = g.attributes.position; if (!P || g.index) return; let ch = false;
        for (let t = 0; t + 2 < P.count; t += 3) { const x = P.getX(t), z = P.getZ(t); if (!inside(x, z) || !inside(P.getX(t + 1), P.getZ(t + 1)) || !inside(P.getX(t + 2), P.getZ(t + 2)) || A.clearance(x, z) < 0.5) continue;
          P.setXYZ(t + 1, x, P.getY(t), z); P.setXYZ(t + 2, x, P.getY(t), z); ch = true; n++; }
        if (ch) P.needsUpdate = true;
      }
    });
    // the live animals (js/world-zivali.js, World.lifeStep places them every frame): one whose way touches a scene's ground out of the world (its
    // own mesh off and out of the list the step places)
    const L = o.dyn && o.dyn.life;
    if (L && Array.isArray(L.live)) L.live = L.live.filter(a => {
      const walk = a.mode === 'walk', ex = walk ? a.x0 + Math.sin(a.yaw0) * a.L : a.x0, ez = walk ? a.z0 + Math.cos(a.yaw0) * a.L : a.z0;
      if (!inside(a.cx, a.cz) && !inside(a.x0, a.z0) && !inside(ex, ez)) return true;
      if (a.m && a.m.parent) a.m.parent.remove(a.m); n++; const st = o.lifeStats; if (st) { st.live--; st.animals--; } return false;   // (the life's count as it stands: its live ones are the meshes left)
    });
    return n;
  }
  const IDENT = new THREE.Matrix4();
  function roomSide(T, s) { let l = 0, r = 0; for (let d = -30; d <= 30; d += 6) { const i = T.idx((((s + d) % T.len) + T.len) % T.len); l += T.bl[i]; r += T.br[i]; } return r > l ? 1 : -1; }
  /* ---------------- every frame (World.update): the followed car's way to each scene, the scenes near the camera posed ---------------- */
  const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _sp = new THREE.Sphere(), _cv = new THREE.Vector3();
  const SUMMER = new Set(['piknik', 'kolesarji']);   // (the scenes of a summer's day: out of the world under snow)
  function step(W, t, car, cam) {
    if (!car) {   // no car (the world test): every scene in its first pose, as built
      for (const Sc of W.scenes) { reset(Sc); Sc.on = false; Sc.grp.visible = true; Sc.ppl.visible = true; poseScene(Sc, 0, null, true); }
      W.root.visible = true; smokeStep(W, 0, true); W.cs = null; W.lt = 0; return;
    }
    // a special mission (js/missions.js, Missions.run): not a race day (a flood, a fire, a rescue), so none of these out; back when it is over
    const mis = typeof Missions !== 'undefined' && !!Missions.run; W.root.visible = !mis; if (mis) { W.cs = null; return; }
    const T = W.T, dt = t - W.lt, winter = W.o.seasonKey === 'winter'; W.lt = t;   // (winter: the world under snow, js/render.js seasonWorld)
    if (dt < -0.5) for (const Sc of W.scenes) reset(Sc);   // (time went back: a new race)
    // the followed car along the road: where (s) and how fast (from its way since the last frame: also in a replay)
    const q = T.query(car.x, car.z, W.hint, W.q); W.hint = q.i; const cs = q.s;
    if (W.cs != null && dt > 1e-4 && dt < 0.5) { let ds = cs - W.cs; if (!T.open) ds -= T.len * Math.round(ds / T.len); W.v += (clamp(ds / dt, -120, 160) - W.v) * Math.min(1, dt * 5); }
    else if (dt >= 0.5 || W.cs == null) W.v = Math.hypot(car.vx || 0, car.vz || 0);
    W.cs = cs; W.frame++;
    if (cam) { _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm); }
    const cp = cam ? cam.position : null;
    for (const Sc of W.scenes) {
      if (winter && SUMMER.has(Sc.name)) { Sc.grp.visible = false; Sc.on = false; continue; }   // (no picnic blanket or resting cyclists in the snow)
      let da = Sc.s0 - cs; if (!T.open) da -= T.len * Math.round(da / T.len);
      Sc.da = da; const eta = W.v > 2 ? da / W.v : 1e9;
      if (Sc.arm) { if (da > -4 && da < 700 && eta < WARN) alert(Sc, t); }
      else if (Sc.al >= 0) {
        if (Sc.pass < 0 && da < -3) Sc.pass = t;
        if (Sc.back < 0 && ((Sc.pass >= 0 && t > Sc.pass + BACK) || t > Sc.al + 16)) goBack(Sc, t);
        if (Sc.back >= 0 && t > Sc.done) { Sc.al = -1; for (const p of Sc.people.concat(Sc.pets)) p.segs = null; }   // (all back at what they were doing)
      } else if (da > 160 || da < -120) Sc.arm = true;   // (the car far away again: the next time it comes)
      const dc = cp ? Math.hypot(cp.x - Sc.cx, cp.z - Sc.cz) : 0;
      Sc.grp.visible = dc < W.rShow; Sc.ppl.visible = dc < W.rPpl;
      Sc.on = dc < W.rPose && (!cam || _fr.intersectsSphere(_sp.set(_cv.set(Sc.cx, Sc.cy, Sc.cz), Sc.r)));
      if (Sc.on && (dc < 80 || ((W.frame + Sc.k) & 1) === 0)) poseScene(Sc, t, car, false);   // (farther than 80 m: every other frame)
    }
    smokeStep(W, t, false);
  }

  /* ---------------- where: the scenes of each real track [scene, metres after the start line, side (+1 right, -1 left), options] ---------------- */
  // (the 12 proposals' places from the pictures; the others found by tools/ljudje/mesta.mjs --plan: a straight before, the barrier near, flat ground,
  // no other road, building or stand there; a circuit's pit wall added by itself: def.pit)
  const SITES = {
    baldy: [['piknik', 2080, -1], ['foto2', 4704, 1], ['kolesarji', 6248, -1]],
    bangsaen: [['tribuna', 528, 1], ['marsali', 1472, 1], ['gasilci', 3376, 1]],
    bathurst: [['boksi', 70, -1], ['zar', 640, -1], ['gasilci', 1104, 1], ['vhod', 1976, -1], ['marsali', 2784, -1], ['foto', 4456, 1], ['oder', 4984, -1], ['tribuna', 5790, 1]],
    beartooth: [['piknik', 1696, -1]],
    bigsur: [['piknik', 56, 1], ['foto2', 1984, 1], ['kolesarji', 3664, 1]],
    caracoles: [['kamp', 40, 1], ['piknik', 6152, 1], ['foto2', 10488, 1]],
    chapman: [['piknik', 352, 1]],
    cpalace: [['marsali', 96, -1], ['foto2', 1064, 1], ['piknik', 1424, 1], ['vhod', 2912, 1]],
    greatalpine: [['foto2', 2096, 1], ['piknik', 4992, -1], ['kamp', 6728, 1]],
    harju: [['reli', 392, 1], ['oder', 1464, 1], ['foto2', 2144, 1]],
    hotham: [['foto2', 832, 1], ['kamp', 2840, 1], ['piknik', 7608, -1]],
    katu: [['ogenj', 720, 1], ['kamp', 4544, -1]],
    longford: [['piknik', 288, -1], ['marsali', 1784, 1], ['hisa2', 2384, 1], ['zar', 5336, 1], ['foto2', 6488, -1]],
    marrakesh: [['gasilci', 80, 1], ['tribuna', 1112, 1], ['marsali', 1560, -1]],
    maunakea: [['foto2', 136, -1], ['kamp', 3472, -1]],
    medvode: [['foto2', 96, 1], ['piknik', 1664, 1], ['hisa2', 2896, 1], ['kolesarji', 4336, -1]],
    moki: [['kamp', 264, -1], ['foto2', 4880, 1]],
    monterey: [['foto', 944, -1], ['marsali', 1440, 1], ['gasilci', 1904, -1], ['oder', 2288, 1], ['tribuna', 3160, -1], ['zar', 3560, 1]],
    montreal: [['gasilci', 136, 1], ['foto', 1736, 1], ['marsali', 2520, -1], ['tribuna', 4064, 1]],
    mulholland: [['piknik', 136, 1], ['foto2', 2264, -1]],
    newcastle: [['tribuna', 144, -1], ['marsali', 720, -1], ['gasilci', 1976, -1]],
    nring: [['oder', 1950, 1], ['zar', 3300, -1], ['tv', 4720, 1], ['ogenj', 5640, -1], ['foto2', 7672, 1], ['gasilci', 8424, -1], ['ogenj', 9832, -1], ['oder', 11088, 1], ['piknik', 12392, -1], ['zar', 14624, -1], ['tv', 16350, -1], ['kamp', 17168, -1], ['telo', 18450, -1], ['marsali', 19976, -1]],
    ouninpohja: [['hisa2', 1064, 1], ['hisa', 2240, -1], ['ogenj', 3336, 1], ['foto2', 4808, 1], ['reli', 6096, 1], ['oder', 7320, 1], ['reli', 8648, -1], ['kamp', 9568, -1]],
    palomar: [['foto2', 152, 1], ['kolesarji', 1480, 1], ['piknik', 4720, -1]],
    pikes: [['foto2', 4672, 1]],
    pikesg: [['foto2', 3824, 1]],
    rastro: [['piknik', 4432, -1]],
    rbring: [['vhod', 216, -1], ['gasilci', 896, -1], ['marsali', 1704, -1], ['zar', 2488, -1], ['oder', 3112, 1], ['foto', 3560, 1]],
    rio: [['gasilci', 2224, -1], ['tribuna', 2664, -1], ['marsali', 4040, -1]],
    riverside: [['zar', 464, -1], ['marsali', 4112, 1], ['tribuna', 4568, -1], ['foto2', 5144, 1]],
    sani: [['foto2', 1328, -1], ['kamp', 4920, -1]],
    spa: [['vhod', 170, -1], ['foto', 870, -1], ['marsali', 1360, 1], ['ogenj', 1864, 1], ['tribuna', 4280, 1], ['gasilci', 5560, 1], ['zar', 6288, 1]],
    suzuka: [['tribuna', 118, 1], ['vhod', 806, -1], ['foto', 2022, 1], ['gasilci', 4070, -1], ['marsali', 5078, 1]],
    toronto: [['gasilci', 112, -1], ['tribuna', 752, 1], ['marsali', 1128, 1]],
    townsville: [['marsali', 88, -1], ['gasilci', 504, 1], ['vhod', 888, -1], ['tribuna', 2176, 1]],
    troisrivieres: [['marsali', 144, -1], ['tribuna', 1432, -1], ['vhod', 1960, -1]],
    uncompahgre: [['kamp', 600, -1], ['ogenj', 2720, 1]],
    vrsic: [['kolesarji', 648, -1], ['kamp', 1576, -1], ['piknik', 2560, 1], ['kolesarji', 7800, -1], ['foto2', 12248, -1]],
  };
  // the fans' flags by the track's country (horizontal stripes, no emblems): Germany, Belgium (as stripes), Australia's green and gold, Finland
  const vert = (a) => Object.assign(a, { vert: true });
  const AU = { flag: [0x0f7a3a, 0xf2c21a, 0x0f7a3a], house: 'aus' }, US = { flag: [0xb22234, 0xf2f2f2, 0x3c3b6e], house: 'usa' }, CA = { flag: vert([0xd8262a, 0xf2f2f2, 0xd8262a]), house: 'usa' };
  const SI = { flag: [0xf2f2f2, 0x1f4aa8, 0xd8262a], house: 'alp' }, FI = { flag: [0xf2f2f2, 0x1f4aa8, 0xf2f2f2], house: 'fin' }, JP = { flag: [0xf2f2f2, 0xd8262a, 0xf2f2f2], house: 'jpn' };
  const BR = { flag: [0x009c3b, 0xffdf00, 0x009c3b], house: 'sud' }, ZA = { flag: [0x007a4d, 0xffb612, 0xde3831], house: 'sud' };
  const FLAGS = {
    nring: { flag: DE, flag2: [0xd8262a, 0xf2f2f2, 0x1f4aa8], house: 'alp' }, spa: { flag: vert([0x15171c, 0xf2c21a, 0xd8262a]), team: 0xd8262a, house: 'alp' },
    rbring: { flag: [0xd8262a, 0xf2f2f2, 0xd8262a], house: 'alp' }, cpalace: { flag: [0xf2f2f2, 0xd8262a, 0xf2f2f2], house: 'alp' },
    bathurst: Object.assign({ seat: 0x1f63d8, team: 0x1f63d8 }, AU), greatalpine: AU, hotham: AU, longford: AU, newcastle: AU, townsville: AU,
    vrsic: SI, medvode: SI, ouninpohja: FI, harju: FI, iroha: JP, suzuka: Object.assign({ team: 0xd8262a }, JP), tianmen: { flag: [0xde2910, 0xffde00, 0xde2910], house: 'jpn' },
    baldy: US, beartooth: US, bigsur: US, detroit: US, maunakea: US, moki: US, monterey: US, mulholland: US, palomar: US, pikes: US, pikesg: US, riverside: US, uncompahgre: US,
    montreal: CA, toronto: CA, troisrivieres: CA, rastro: BR, rio: BR, caracoles: { flag: [0xf2f2f2, 0xf2f2f2, 0xd52b1e], house: 'sud' }, chapman: ZA, sani: ZA,
    katu: { flag: [0xf2f2f2, 0x1c3f94, 0xd8262a], house: 'rus' }, marrakesh: { flag: [0xc1272d, 0x006233, 0xc1272d], house: 'sud' },
    bangsaen: { flag: [0xa51931, 0xf4f5f8, 0x2d2a4a, 0xf4f5f8, 0xa51931], house: 'sud' },
  };
  const geoOf = (D) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(D.P, 3)); if (D.N) g.setAttribute('normal', new THREE.Float32BufferAttribute(D.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(D.C, 3)); g.attributes.color.noSeason = true; g.computeBoundingSphere(); return g; };   // (noSeason: the season's paint (js/render.js seasonWorld) leaves their colours: no snow-white faces, no autumn leaves on a green shirt)

  World.people = function (o) {
    const A = World.api, T = A.T, def = T && T.def;
    if (!def || def.test || !o || !o.root || typeof o.groundH !== 'function') return null;
    const list = (SITES[def.id] || []).slice();
    if (def.pit && !list.some(e => e[0] === 'boksi')) list.push(['boksi', def.pit[3], Math.sign(def.pit[0]) || 1]);   // (a circuit's pit wall: the player's team opposite its box, the board over the wall)
    if (!list.length) return null;
    const t0 = performance.now(), LOD = A.LOD, gH = o.groundH, K0 = FLAGS[def.id] || {}, hsh = Math.abs([...def.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7));
    const W = { T, scenes: [], frame: 0, wx: 0.8, wz: 0.6, smoke: null, q: {}, hint: -1, cs: null, v: 0, lt: 0,
      rShow: LOD.tier >= 2 ? 650 : LOD.tier === 1 ? 420 : 280, rPpl: LOD.tier >= 2 ? 240 : LOD.tier === 1 ? 170 : 120, rPose: LOD.tier >= 2 ? 200 : LOD.tier === 1 ? 150 : 110 };
    const matL = new THREE.MeshLambertMaterial({ vertexColors: true }), matU = new THREE.MeshBasicMaterial({ vertexColors: true });
    const root = new THREE.Group(); root.name = 'people'; root.userData.lj = true; o.root.add(root); W.root = root; W.o = o;
    const circles = [], stats = { scenes: [], people: 0, verts: 0, propVerts: 0 };
    let nPuff = 0;
    list.forEach(([name, at, side, opt], si) => {
      const d = S[name]; if (!d) return;
      const s = T.startS + at; if (T.open && (s < 0 || s > T.len)) return;
      const sd = side === 'room' ? roomSide(T, s) : side, F = frame(T, gH, s, sd), K = Object.assign({ flag: DE }, K0, opt || {});
      seed(1000 + (d.seed || 5) * 7919 + hsh + si * 31);
      const C = ctxOf(F); d.build(C, F, K);
      const Sc = { name, F, s0: s, side: sd, groups: C.groups, people: [], pets: [], movers: [], smoke: [], stand: !!d.stand, k: si, on: false };
      const rec = (P, st) => { const kid = !!(st && st.kid), f = st && st.run && st.run.f || 0.55;
        return { P, st, d0: kid ? 0.08 + rnd() * 0.2 : 0.2 + rnd() * 0.85, v: (3.4 + 4 * f) * (kid ? 0.92 : 1), bd: rnd() * 1.4, ph: rnd(), segs: null }; };
      for (const P of C.people) { rig(P, P.st ? itemsOf(P.st) : new Set()); Sc.people.push(rec(P, P.st)); }
      for (const pt of C.pets) Sc.pets.push(rec(rigid(pt.model), pt.st));
      for (const mv of C.movers) Sc.movers.push({ P: rigid(mv.model), on: mv.on, x: mv.x, y: mv.y, z: mv.z, yaw: 0 });
      reset(Sc);
      // the people's mesh: every figure's parts one after the other (their colours fixed, their places written when posed)
      const all = Sc.people.map(p => p.P).concat(Sc.pets.map(p => p.P), Sc.movers.map(m => m.P));
      let nv = 0; for (const P of all) for (const pt of P.parts) { pt.o = nv * 3; nv += pt.P.length / 3; }
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
      for (const P of all) for (const pt of P.parts) col.set(pt.C, pt.o);
      const [cx, cz] = F.w(0, 6), cy = F.y(0, 6) + 2, r = d.r || 24;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.attributes.color.noSeason = true;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), r);
      const ppl = new THREE.Mesh(g, matL); ppl.castShadow = true; ppl.receiveShadow = true; ppl.matrixAutoUpdate = false; ppl.name = 'people';
      const grp = new THREE.Group(); grp.name = 'scene'; grp.userData.scene = name; root.add(grp);
      let pv = 0;
      if (C.L.P.length) { const m = new THREE.Mesh(geoOf(C.L), matL); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'sceneThings'; grp.add(m); pv += C.L.P.length / 3; }
      if (C.U.P.length) { const m = new THREE.Mesh(geoOf(C.U), matU); m.matrixAutoUpdate = false; m.name = 'sceneLamps'; grp.add(m); pv += C.U.P.length / 3; }
      grp.add(ppl);
      Object.assign(Sc, { grp, ppl, pos, nor, cx, cy, cz, r });
      if (Sc.stand) { const G = C.groups.st; Sc.sgn = Math.sign(G.m.elements[0] * F.tx + G.m.elements[2] * F.tz) || 1; Sc.len = 20; }
      for (const e of C.smoke) { e.i = nPuff; e.ph = rnd(); nPuff += e.n; Sc.smoke.push(e); }
      for (const [a, b, rr] of d.clear || []) { const [x, z] = F.w(a, b); circles.push([x, z, rr]); }
      W.scenes.push(Sc);
      stats.scenes.push({ name, at, side: sd, s: Math.round(s), people: Sc.people.length, pets: Sc.pets.length, verts: nv, propVerts: pv });
      stats.people += Sc.people.length; stats.verts += nv; stats.propVerts += pv;
    });
    if (!W.scenes.length) return null;
    if (nPuff) {   // the smoke of every scene of this world: one instanced mesh (ROAD DECAL ORDER: blended over the road's decals, as Longford's)
      const M = W.smoke = new THREE.InstancedMesh(puffGeo(), new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.32, depthWrite: false }), nPuff);
      const c = new THREE.Color(); for (const Sc of W.scenes) for (const e of Sc.smoke) { c.setHex(e.col); for (let k = 0; k < e.n; k++) M.setColorAt(e.i + k, c); } M.instanceColor.noSeason = true;
      M.frustumCulled = false; M.renderOrder = 4; M.name = 'sceneSmoke'; root.add(M);
    }
    const t1 = performance.now(); stats.cleared = clearAll(o, circles, A); stats.ms = Math.round(performance.now() - t0); stats.msClear = Math.round(performance.now() - t1);
    o.dyn.people = (t, car, cam) => step(W, t, car, cam);
    step(W, 0, null, null);
    o.peopleStats = stats; o.peopleW = W;
    return stats;
  };
  World.peopleSites = SITES;   // (for the tests and the docs)
})();
