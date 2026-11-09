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
  const HATX = {};   // (more hats, World.peopleKit: name -> (its colour, the look) -> a group on the head, its frame the head's: the top at 0.235)
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
    else if (HATX[o.hat]) head.add(HATX[o.hat](hc, o));
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
  // things in a hand (the hand's frame: the arm points down -y, the palm faces in, forwards is +z); ITEMX: more of them (World.peopleKit)
  const ITEMX = {};
  function item(kind, o) {
    o = o || {};
    if (ITEMX[kind]) return ITEMX[kind](o);
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
    // the grandstands' food (the user, 3. 11. 2026: »na tribunah … je hrano, pije pijačo«) and the vendors' boxes and trays
    if (kind === 'hotdog') return grp(box(0.075, 0.05, 0.2, 0xd9a35a, 0, -0.02, 0.06), box(0.032, 0.032, 0.25, 0xa8432a, 0, 0.012, 0.06));   // (the bun, the sausage)
    if (kind === 'burger') return grp(cyl(0.065, 0.065, 0.035, 7, 0xc98a45, 0, -0.035, 0.06), cyl(0.068, 0.068, 0.02, 7, 0x5a3220, 0, -0.008, 0.06), cyl(0.065, 0.06, 0.04, 7, 0xd29a50, 0, 0.022, 0.06));
    if (kind === 'icecream') return grp(cyl(0.032, 0.006, 0.12, 6, 0xd8b075, 0, -0.03, 0.05), sph(0.038, 6, 4, o.c || 0xf0b8c8, 0, 0.045, 0.05));
    if (kind === 'popcorn') return grp(box(0.1, 0.13, 0.08, 0xd8262a, 0, -0.03, 0.06), box(0.104, 0.04, 0.084, 0xf2f2ee, 0, -0.03, 0.06), box(0.09, 0.04, 0.07, 0xf5e08a, 0, 0.055, 0.06));
    if (kind === 'tray') { const g = grp(box(0.52, 0.035, 0.34, 0xf2f2ee, 0, -0.1, 0.24)); for (let k = 0; k < 6; k++) g.add(cyl(0.035, 0.03, 0.1, 5, k % 2 ? 0xe8c33a : 0xf4f4f0, -0.17 + (k % 3) * 0.17, -0.035, 0.16 + Math.floor(k / 3) * 0.15)); return g; }
    if (kind === 'icebox') return grp(box(0.46, 0.3, 0.3, 0xf2f2ee, 0, -0.14, 0.24), box(0.48, 0.05, 0.32, 0x2f63c9, 0, 0.03, 0.24));   // (the ice cream seller's: white, its blue lid)
    if (kind === 'hotbox') return grp(box(0.46, 0.3, 0.3, 0xb9bec6, 0, -0.14, 0.24), box(0.47, 0.07, 0.31, 0xd8262a, 0, -0.08, 0.24));   // (the hot dog seller's: steel, a red band)
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
      // sitting on a stand's seat with something to do: eating (the right hand at the mouth), on the phone (at the ear), reading it (both hands at
      // the chest), a little flag up, filming the road
      case 'sitEat': return { hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: -0.04, shz: [0.12, 0.16], shx: [0.35, 0.72], el: [0.9, 2.05], shy: [0, -0.3] };
      case 'sitPhone': return { hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: -0.06, shz: [0.12, 0.2], shx: [0.35, 0.45], el: [0.9, 2.35] };
      case 'sitText': return { hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: 0.14, shz: [0.25, 0.25], shx: [1.1, 1.1], el: [1.15, 1.15], shy: [-0.35, -0.35], nod: 0.28 };
      case 'sitFlag': return { hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: -0.05, shz: [0.12, 0.45], shx: [0.35, 1.05], el: [0.9, 0.45] };
      case 'sitFilm': return { hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: 0.05, shz: [0.3, 0.3], shx: [1.6, 1.6], el: [0.75, 0.75], shy: [-0.3, -0.3] };
      default: return POSEX[name] ? POSEX[name](t, s) : {};
    }
  }
  const POSEX = {};   // (more poses, World.peopleKit: name -> (t, sin t) -> the joints)
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
  const WARN = 2.8, BACK = 4, WALK = 1.45, FENCE_T = 1.8, TURN_T = 0.8, LEG_T = 0.15, ARR_T = 0.3;
  const STRIDE = { run: 2.4, walk: 4.5, carryWalk: 4.5 };   // (the stride's radians per metre)
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x, wrapA = (a) => a - TAU * Math.round(a / TAU);
  const at0 = (s) => s.on ? { on: s.on, a: s.a, b: s.b, y: s.y || 0 } : { a: s.a, b: s.b, y: s.y || 0 };
  function moveSeg(segs, from, to, t, v, pose, hold, G, th) {   // a walk or a run from one place to another (on the ground, or on the same thing); on the ground round the scene's things (G: wayGrid)
    const same = (from.on || null) === (to.on || null); if (!same) return t;   // (from a thing onto the ground or back, the same place: at once, never part of the way in one frame and part in the other)
    const sh = showOf({ hold: hold || [] }), way = route(G, from, to) || [from, to];
    let d0 = 0, th0 = th == null ? null : th, thP = null;   // (th: the angle it faced as it set off, the frame's or on a thing its own; each leg's own angle, and the one it starts from: turned in LEG_T, not at once)
    for (let k = 1; k < way.length; k++) {
      const f = way[k - 1], q = way[k], d = Math.hypot(q.a - f.a, q.b - f.b), dur = d > 1e-3 ? Math.max(way.length > 2 ? 0.05 : 0.25, d / v) : 0.25;   // (a hop down off its thing, or up onto it: a quarter of a second)
      const own = d > 1e-3 ? (from.on ? Math.atan2(q.a - f.a, q.b - f.b) : Math.atan2(q.b - f.b, q.a - f.a)) : thP != null ? thP : th0;   // (on a thing its yaw as poseOne has it; a hop on the spot: the way it went)
      const mv = { from: f, to: q, d, d0, pose, hold: sh, th: own, th0 }; segs.push({ t0: t, t1: t + dur, mv });
      if (own != null) { const u = th0 == null ? 1 : Math.min(1, dur / LEG_T); th0 = th0 == null ? own : th0 + wrapA(own - th0) * u * u * (3 - 2 * u); }   // (where the turn has got by the leg's end)
      mv.ae = th0; thP = own; t += dur; d0 += d;
    }
    return t;
  }
  const thOf = (s) => s.cam ? null : s.on ? s.yaw || 0 : s.face && s.face !== 'road' ? Math.atan2(s.face[1], s.face[0]) : -Math.PI / 2;   // (none for the cameraman behind his camera: it turns with it)
  const after = (segs, sg) => { const L = segs[segs.length - 1]; if (L && L.mv && L.mv.ae != null) sg.aa = L.mv.ae; segs.push(sg); };   // (a state after a walk: turned to its facing from the way it came, ARR_T)   // (a state's facing as a frame angle: none for one on a thing)
  const legAng = (mv, t, t0) => { if (mv.th0 == null) return mv.th; const u = clamp((t - t0) / LEG_T, 0, 1); return mv.th0 + wrapA(mv.th - mv.th0) * u * u * (3 - 2 * u); };
  const legYaw = (F, mv, t, t0) => { const th = legAng(mv, t, t0); return F.yaw(Math.cos(th), Math.sin(th)); };
  // ways round the scene's things: what stands at body height (its baked things cut at 0.45, 0.9 and 1.35 m over the ground; a part all within
  // 0.25–1.75 m all of it: a table's top, a seat, a chair's back) in 0.2 m cells over the scene's ground, widened by half a body; a way whose
  // straight line crosses it goes round on the grid (A*, its corners cut where the line is clear). The first and the last 0.6 m of a way are
  // free (getting up from one's own chair, leaning on the fence by a banner); under a tent's or an awning's roof is free (higher)
  const WG = { c: 0.2, a0: -24, b0: -2, na: 240, nb: 100, r: 0.25, end: 0.6, esc: 1.6, cuts: [0.45, 0.9, 1.35] };   // (esc: from one's own place among the chairs and the table out the shortest way, then round)
  function wayGrid(F, Ds) {
    const { c, a0, b0, na, nb } = WG, raw = new Uint8Array(na * nb);
    const put = (a, b) => { const i = Math.floor((a - a0) / c), j = Math.floor((b - b0) / c); if (i >= 0 && j >= 0 && i < na && j < nb) raw[j * na + i] = 1; };
    const line = (a1, b1, a2, b2) => { const n = Math.max(1, Math.ceil(Math.hypot(a2 - a1, b2 - b1) / (c * 0.5))); for (let k = 0; k <= n; k++) put(a1 + (a2 - a1) * k / n, b1 + (b2 - b1) * k / n); };
    const A = [0, 0, 0], B = [0, 0, 0], Y = [0, 0, 0], q = [];
    for (let di = 0; di < Ds.length; di++) { const P = Ds[di] && Ds[di].P, unlit = di === 1; if (!P) continue;   // (Ds: the lit things, the unlit ones: a fire's flames, its footprint all of it)
      for (let t = 0; t + 8 < P.length; t += 9) {
        let lo = 1e9, hi = -1e9;
        for (let k = 0; k < 3; k++) { const dx = P[t + 3 * k] - F.px, dz = P[t + 3 * k + 2] - F.pz; A[k] = dx * F.tx + dz * F.tz; B[k] = dx * F.nx + dz * F.nz - F.bar; Y[k] = P[t + 3 * k + 1]; if (Y[k] < lo) lo = Y[k]; if (Y[k] > hi) hi = Y[k]; }
        const am = (A[0] + A[1] + A[2]) / 3, bm = (B[0] + B[1] + B[2]) / 3; if (am < a0 - 3 || am > a0 + na * c + 3 || bm < b0 - 3 || bm > b0 + nb * c + 3) continue;
        const g = F.y(am, bm); if (hi < (unlit ? g + 0.1 : g + 0.3) || lo > g + 1.7) continue;
        if ((lo >= g + 0.25 && hi <= g + 1.75) || unlit) {   // all of it at body height (or a flame): its edges and its inside
          line(A[0], B[0], A[1], B[1]); line(A[1], B[1], A[2], B[2]); line(A[2], B[2], A[0], B[0]);
          const ia = Math.min(A[0], A[1], A[2]), xa = Math.max(A[0], A[1], A[2]), ib = Math.min(B[0], B[1], B[2]), xb = Math.max(B[0], B[1], B[2]);
          for (let a = Math.ceil(ia / c) * c; a < xa; a += c) for (let b = Math.ceil(ib / c) * c; b < xb; b += c) {
            const s0 = (A[1] - A[0]) * (b - B[0]) - (B[1] - B[0]) * (a - A[0]), s1 = (A[2] - A[1]) * (b - B[1]) - (B[2] - B[1]) * (a - A[1]), s2 = (A[0] - A[2]) * (b - B[2]) - (B[0] - B[2]) * (a - A[2]);
            if ((s0 >= 0 && s1 >= 0 && s2 >= 0) || (s0 <= 0 && s1 <= 0 && s2 <= 0)) put(a, b); }
          continue;
        }
        for (const h0 of WG.cuts) {   // a taller one (a wall, a van's side, a pole): where it cuts these heights
          const h = g + h0; q.length = 0;
          for (let k = 0; k < 3; k++) { const k2 = (k + 1) % 3, d1 = Y[k] - h, d2 = Y[k2] - h; if ((d1 < 0) !== (d2 < 0)) { const f = d1 / (d1 - d2); q.push(A[k] + (A[k2] - A[k]) * f, B[k] + (B[k2] - B[k]) * f); } }
          if (q.length >= 4) line(q[0], q[1], q[2], q[3]);
        }
      } }
    const R = Math.ceil(WG.r / c), G = new Uint8Array(na * nb); let any = false;   // (2: the thing itself; 1: within half a body of it)
    for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) if (raw[j * na + i]) { any = true; G[j * na + i] = 2;
      for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) { const ii = i + di, jj = j + dj, k = jj * na + ii; if (di * di + dj * dj <= R * R && ii >= 0 && jj >= 0 && ii < na && jj < nb && !G[k]) G[k] = 1; } }
    if (!any) return null;
    // the open ground in regions (side by side, as a way goes: no corner cutting): a way between two places of one region is always found;
    // the biggest is the open ground round the scene's things (a garden behind its fence, a pool's water inside its wall: regions of their own)
    const lab = new Int32Array(na * nb), st = []; let nl = 0, big = 0, bigN = 0;
    for (let k0 = 0; k0 < na * nb; k0++) if (!G[k0] && !lab[k0]) { lab[k0] = ++nl; st.push(k0); let n = 0;
      while (st.length) { const k = st.pop(), i = k % na; n++;
        if (i > 0 && !G[k - 1] && !lab[k - 1]) { lab[k - 1] = nl; st.push(k - 1); } if (i < na - 1 && !G[k + 1] && !lab[k + 1]) { lab[k + 1] = nl; st.push(k + 1); }
        if (k >= na && !G[k - na] && !lab[k - na]) { lab[k - na] = nl; st.push(k - na); } if (k + na < na * nb && !G[k + na] && !lab[k + na]) { lab[k + na] = nl; st.push(k + na); } }
      if (n > bigN) { bigN = n; big = nl; } }
    G.lab = lab; G.big = big; return G;
  }
  // the open regions a place reaches (over its own first 0.6 m, and by a thing within 1.6 m: getting up from its chair), and the nearest open
  // cell of a region (out of one's own thing, straight: the pool, the trampoline, the hatch of its food truck)
  const TB = { gen: new Uint32Array(WG.na * WG.nb), n: 0, q: [] };
  function touches(G, e) {
    const { c, a0, b0, na, nb } = WG, out = [], gen = ++TB.n, q = TB.q, i0 = Math.floor((e.a - a0) / c), j0 = Math.floor((e.b - b0) / c); q.length = 0;
    if (i0 < 0 || j0 < 0 || i0 >= na || j0 >= nb) return out;
    q.push(j0 * na + i0); TB.gen[q[0]] = gen;
    for (let h = 0; h < q.length; h++) { const k = q[h], i = k % na, j = (k - i) / na, g = G[k];
      if (!g) { if (!out.includes(G.lab[k])) out.push(G.lab[k]); continue; }
      const d = Math.hypot(a0 + (i + 0.5) * c - e.a, b0 + (j + 0.5) * c - e.b); if (!(d < WG.end || (g === 1 && d <= WG.esc))) continue;
      for (const n of [i > 0 ? k - 1 : -1, i < na - 1 ? k + 1 : -1, j > 0 ? k - na : -1, j < nb - 1 ? k + na : -1]) if (n >= 0 && TB.gen[n] !== gen) { TB.gen[n] = gen; q.push(n); } }
    return out;
  }
  function exitTo(G, e, l, o) {   // (o: where the way goes on to: of the open cells just round its thing, the one on the way there)
    const { c, a0, b0, na, nb } = WG, gen = ++TB.n, q = TB.q, i0 = Math.floor((e.a - a0) / c), j0 = Math.floor((e.b - b0) / c), R = Math.ceil(3 / c), X = []; q.length = 0;
    if (i0 < 0 || j0 < 0 || i0 >= na || j0 >= nb) return null;
    q.push(j0 * na + i0); TB.gen[q[0]] = gen;
    for (let h = 0; h < q.length; h++) { const k = q[h], i = k % na, j = (k - i) / na;   // (over its thing and what is shut in with it; the region's cells round it: the ways out)
      for (const [n, ok] of [[k - 1, i > 0], [k + 1, i < na - 1], [k - na, j > 0], [k + na, j < nb - 1]]) { if (!ok || TB.gen[n] === gen || Math.abs(n % na - i0) > R || Math.abs(Math.floor(n / na) - j0) > R) continue;
        TB.gen[n] = gen; if (!G[n] && G.lab[n] === l) X.push(n); else q.push(n); } }
    if (!X.length) return null;
    const pt = (k) => ({ a: a0 + (k % na + 0.5) * c, b: b0 + (Math.floor(k / na) + 0.5) * c }), d = X.map(k => { const x = pt(k); return Math.hypot(x.a - e.a, x.b - e.b); }), dm = Math.min(...d);
    let best = null, bc = 1e9; X.forEach((k, m) => { if (d[m] > dm + 0.45) return; const x = pt(k), cost = d[m] + Math.hypot(o.a - x.a, o.b - x.b); if (cost < bc) { bc = cost; best = x; } });   // (no farther than the nearest by half a metre)
    return best;
  }
  const wayBlocked = (G, a, b, f, t) => { const i = Math.floor((a - WG.a0) / WG.c), j = Math.floor((b - WG.b0) / WG.c); if (i < 0 || j < 0 || i >= WG.na || j >= WG.nb) return 0;
    const g = G[j * WG.na + i], e2 = WG.end * WG.end; return !g || (a - f.a) * (a - f.a) + (b - f.b) * (b - f.b) < e2 || (a - t.a) * (a - t.a) + (b - t.b) * (b - t.b) < e2 ? 0 : g; };   // (0 free, 1 by a thing, 2 a thing)
  const cellB = (G, k, f, t) => { const g = G[k]; if (!g) return 0; const i = k % WG.na, x = WG.a0 + (i + 0.5) * WG.c, y = WG.b0 + ((k - i) / WG.na + 0.5) * WG.c, e2 = WG.end * WG.end;   // (the same for a cell)
    return (x - f.a) * (x - f.a) + (y - f.b) * (y - f.b) < e2 || (x - t.a) * (x - t.a) + (y - t.b) * (y - t.b) < e2 ? 0 : g; };
  const wayClear = (G, p, q, f, t) => { const n = Math.max(1, Math.ceil(Math.hypot(q.a - p.a, q.b - p.b) / (WG.c * 0.5)));   // (a straight line: by no thing, but in its first and last 0.6 m)
    for (let k = 0; k <= n; k++) if (wayBlocked(G, p.a + (q.a - p.a) * k / n, p.b + (q.b - p.b) * k / n, f, t)) return false; return true; };
  const wayClearS = (G, p, q, f, t) => { const n = Math.max(1, Math.ceil(Math.hypot(q.a - p.a, q.b - p.b) / (WG.c * 0.5))), e2 = WG.esc * WG.esc;   // (as the A* may go: by a thing near the ends too, getting up from its chair)
    for (let k = 0; k <= n; k++) { const a = p.a + (q.a - p.a) * k / n, b = p.b + (q.b - p.b) * k / n, g = wayBlocked(G, a, b, f, t);
      if (g === 2 || (g === 1 && (a - f.a) * (a - f.a) + (b - f.b) * (b - f.b) > e2 && (a - t.a) * (a - t.a) + (b - t.b) * (b - t.b) > e2)) return false; }
    return true; };
  const AS = { g: new Float32Array(WG.na * WG.nb), came: new Int32Array(WG.na * WG.nb), gen: new Uint32Array(WG.na * WG.nb), n: 0, hk: [], hf: [] };
  function route(G, from, to) {   // [from, …corners, to] round the scene's things, or null (no grid, the straight line clear, or no way: straight then)
    if (!G || from.on || to.on) return null;
    const M = G.memo || (G.memo = new Map()), key = from.a + ',' + from.b + '>' + to.a + ',' + to.b;   // (kept: a scene's people go the same ways each time; found at the load, addScene)
    let w = M.get(key); if (w === undefined) { w = route1(G, from, to); if (M.size < 256) M.set(key, w); }
    return w;
  }
  function route1(G, from, to) {
    if (wayClearS(G, from, to, from, to)) return null;
    const Lf = touches(G, from), Lt = touches(G, to); let a = from, b = to, pre = [], post = [];
    if (!Lf.some(l => Lt.includes(l))) {   // one of them shut in by its own thing: out of it into the open ground first, straight (on its height till out of it, then a hop down: off the trampoline)
      if (!Lf.includes(G.big)) { const x = exitTo(G, from, G.big, to); if (!x) return null; a = { a: x.a, b: x.b, y: 0 }; pre = (from.y || 0) > 0.05 ? [from, { a: x.a, b: x.b, y: from.y }] : [from]; }
      if (!Lt.includes(G.big)) { const x = exitTo(G, to, G.big, a); if (!x) return null; b = { a: x.a, b: x.b, y: 0 }; post = (to.y || 0) > 0.05 ? [{ a: x.a, b: x.b, y: to.y }, to] : [to]; }
    }
    const w = wayClearS(G, a, b, a, b) ? [a, b] : routeOn(G, a, b); if (!w) return null;
    return pre.length || post.length ? pre.concat(w, post) : w;
  }
  function routeOn(G, from, to) {
    const { c, a0, b0, na, nb } = WG, ci = (a) => Math.max(0, Math.min(na - 1, Math.floor((a - a0) / c))), cj = (b) => Math.max(0, Math.min(nb - 1, Math.floor((b - b0) / c)));
    const s = cj(from.b) * na + ci(from.a), e = cj(to.b) * na + ci(to.a), ei = e % na, ej = (e - ei) / na, gen = ++AS.n, hk = AS.hk, hf = AS.hf, e2 = WG.esc * WG.esc; hk.length = hf.length = 0;
    const cx = (k) => a0 + (k % na + 0.5) * c, cz = (k) => b0 + (Math.floor(k / na) + 0.5) * c;
    const hgt = (k) => { const di = Math.abs(k % na - ei), dj = Math.abs(Math.floor(k / na) - ej); return Math.max(di, dj) + 0.414 * Math.min(di, dj); };
    const push = (k, f) => { let i = hk.length; hk.push(k); hf.push(f); while (i > 0) { const pi = (i - 1) >> 1; if (hf[pi] <= f) break; hk[i] = hk[pi]; hf[i] = hf[pi]; i = pi; } hk[i] = k; hf[i] = f; };
    const pop = () => { const k = hk[0], lk = hk.pop(), lf = hf.pop(); if (hk.length) { let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i, mf = lf; if (l < hk.length && hf[l] < mf) { m = l; mf = hf[l]; } if (r < hk.length && hf[r] < mf) m = r; if (m === i) break; hk[i] = hk[m]; hf[i] = hf[m]; i = m; } hk[i] = lk; hf[i] = lf; } return k; };
    AS.gen[s] = gen; AS.g[s] = 0; AS.came[s] = -1; push(s, hgt(s));
    let found = false, steps = 0;
    while (hk.length && steps++ < 5000) {   // (a way round is found in a few hundred; no way: given up, straight)
      const k = pop(); if (k === e) { found = true; break; }
      const i = k % na, j = (k - i) / na, gk = AS.g[k];
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= na || jj >= nb) continue;
        const n = jj * na + ii, cost = di && dj ? 1.414 : 1;
        const wb = cellB(G, n, from, to);
        if (wb) { const x = cx(n), y = cz(n); if (wb === 2 || ((x - from.a) * (x - from.a) + (y - from.b) * (y - from.b) > e2 && (x - to.a) * (x - to.a) + (y - to.b) * (y - to.b) > e2)) continue; }   // (by a thing: only near the two ends; through it never)
        else if (di && dj && (cellB(G, j * na + ii, from, to) || cellB(G, jj * na + i, from, to))) continue;   // (not through a corner)
        const gn = gk + cost; if (AS.gen[n] === gen && AS.g[n] <= gn) continue;
        AS.gen[n] = gen; AS.g[n] = gn; AS.came[n] = k; push(n, gn + hgt(n)); } }
    if (!found) return null;
    const cells = []; for (let k = e; k !== -1 && k !== s; k = AS.came[k]) cells.push(k); cells.reverse();
    const pts = cells.map(k => ({ a: cx(k), b: cz(k) })); pts[pts.length - 1] = to;
    const way = [from]; let cur = from, last = null;   // (its corners cut: on along the cells while they are in a straight line from the last corner)
    for (let k = 0; k < pts.length; k++) {
      if (wayClearS(G, cur, pts[k], from, to)) { last = pts[k]; continue; }
      if (last) { way.push(last); cur = last; last = null; k--; continue; }   // (a corner where the line was last clear; the cell again from it)
      way.push(pts[k]); cur = pts[k];
    }
    if (way[way.length - 1] !== to) way.push(to);
    const L = way.reduce((s2, p, k) => k ? s2 + Math.hypot(p.a - way[k - 1].a, p.b - way[k - 1].b) : 0, 0); let acc = 0;
    return way.map((p, k) => { if (k) acc += Math.hypot(p.a - way[k - 1].a, p.b - way[k - 1].b); return p === from || p === to ? p : { a: p.a, b: p.b, y: from.y + (to.y - from.y) * acc / (L || 1) }; });
  }
  // pacing back and forth along its facing, ±1.6 m (poseOne): the first quarter of each half a turn on the spot at the end it reached (what it
  // holds goes round with it: the dog on its leash walks round it, not across), then the walk to the other end; its place at a time tt
  const PACE = { per: 7.2, turn: 0.25, d: 1.6 };
  function pace(s, tt) {
    const fc = s.face && s.face !== 'road' ? s.face : [1, 0], L0 = Math.hypot(fc[0], fc[1]) || 1, ux = fc[0] / L0, uz = fc[1] / L0;
    const u = ((tt / PACE.per) % 1 + 1) % 1, back = u >= 0.5, h = back ? u * 2 - 1 : u * 2, w = Math.max(0, (h - PACE.turn) / (1 - PACE.turn)), d = (back ? 1 - 2 * w : 2 * w - 1) * PACE.d;
    return { a: s.a + ux * d, b: s.b + uz * d, ux, uz, back, turn: Math.min(1, h / PACE.turn) };
  }
  const pacing = (s) => !s.still && (s.pose === 'walk' || s.pose === 'carryWalk') && !!MOTION[s.pose];
  // at the alert: the way out (each person its reaction time d0 and its speed v); a pacer from where it is then, not its pacing's middle
  function planOut(p, al) {
    const st = p.st, R = st.run, Fe = st.fence, segs = [], t1 = al + p.d0;
    const pc = pacing(st.act) ? pace(st.act, al + p.ph * 17 + (p.po || 0)) : null;   // (a pacer: where it is then, facing the way it walks then)
    const A = pc ? Object.assign({}, st.act, { a: pc.a, b: pc.b, face: (pc.turn >= 0.5) !== pc.back ? [pc.ux, pc.uz] : [-pc.ux, -pc.uz] }) : st.act;
    const turn = (s) => pc ? Object.assign(s, { ff: pc.back ? [pc.ux, pc.uz] : [-pc.ux, -pc.uz], fk: pc.turn * pc.turn * (3 - 2 * pc.turn), tf: al }) : s;   // (and turning from its facing then to the stop's: poseOne)
    segs.push({ t0: al, t1, s: turn(Object.assign({}, A, st.zac || st.bliza || {})) });
    if (R === false || (!R && !Fe)) {   // it stays (the staff, the lazy one): what changes at its place as the car comes, then the fence state there
      const B = turn(Object.assign({}, A, st.bliza || {})), tf = al + FENCE_T;
      segs.push({ t0: t1, t1: tf, s: B });
      if (Fe) { const f = at0(Fe), a = at0(A); const t2 = (f.on || null) === (a.on || null) && Math.hypot(f.a - a.a, f.b - a.b) > 0.3 ? moveSeg(segs, a, f, tf, WALK, 'walk', Fe.hold, p.G, thOf(B)) : tf; after(segs, { t0: t2, t1: 1e9, s: Fe, fence: true }); }
      else segs.push({ t0: tf, t1: 1e9, s: Object.assign({}, B, st.mimo || {}), fence: true });
      return segs;
    }
    let cur = at0(A), t = t1, th = thOf(segs[0].s);
    if (R && R.a != null) {   // a place of its own first (staff to the edge, the scaffold's railing), at a walk unless it says otherwise
      const r = at0(R); t = moveSeg(segs, cur, r, t, R.pose === 'run' ? p.v : WALK, R.pose === 'run' ? 'run' : 'walk', R.hold || A.hold, p.G, th);
      const tf = Math.max(t, al + FENCE_T); after(segs, { t0: t, t1: tf, s: R }); cur = r; t = tf; th = thOf(R);
    }
    if (Fe) { const f = at0(Fe), pose = R && R.pose === 'walk' ? 'walk' : R && R.a != null ? 'walk' : 'run';
      t = moveSeg(segs, cur, f, t, pose === 'run' ? p.v : WALK, pose, R && R.hold != null ? R.hold : (Fe.hold || []), p.G, th); after(segs, { t0: t, t1: 1e9, s: Fe, fence: true }); }
    return segs;
  }
  // ~4 s after the car has passed: back to what it was doing, at a walk (from wherever it is now)
  function planBack(p, Sc, t) {
    const now = segAt(p, Sc, t), A = p.st.act, from = now.mv ? lerpPlace(now.mv, clamp((t - now.t0) / (now.t1 - now.t0), 0, 1)) : at0(now.s), segs = [];
    const tb = t + p.bd, mv0 = now.mv, da = mv0 ? mv0.to.a - mv0.from.a : 0, db = mv0 ? mv0.to.b - mv0.from.b : 0;   // (still on its way: it stops where it is, facing the way it went, what it holds in its hands)
    segs.push(mv0 ? { t0: t, t1: tb, s: Object.assign({}, from, { pose: 'stand', face: Math.abs(da) + Math.abs(db) > 1e-3 ? [da, db] : null }), show: mv0.hold, fence: !!now.fence } : { t0: t, t1: tb, s: now.s, fence: !!now.fence });
    const t2 = moveSeg(segs, from, at0(A), tb, WALK, A.hold && A.hold.length && A.pose === 'carryWalk' ? 'carryWalk' : 'walk', A.hold, p.G, thOf(segs[0].s));
    if (pacing(A)) {   // a pacer: its pacing on from its middle (where it got to), walking on the way it came, not where the pacing's clock had it
      const fc = A.face && A.face !== 'road' ? A.face : [1, 0], mv = segs[segs.length - 1].mv, fwd = !mv || (mv.to.a - mv.from.a) * fc[0] + (mv.to.b - mv.from.b) * fc[1] >= 0;
      p.po = ((fwd ? 0 : 0.5) + 0.5 * (PACE.turn + 0.5 * (1 - PACE.turn))) * PACE.per - (t2 + p.ph * 17);
    }
    after(segs, { t0: t2, t1: 1e9, s: A, act: true });
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
    let pose, pt = 0, J, yaw, look = null, rx = 0, show, tl = 0;
    if (sg.mv) {   // walking or running
      const f = clamp((t - sg.t0) / Math.max(1e-3, sg.t1 - sg.t0), 0, 1), mv = sg.mv, pl = lerpPlace(mv, f);
      const gy = placeOf(Sc, pl, _w), da = mv.to.a - mv.from.a, db = mv.to.b - mv.from.b;
      yaw = mv.th != null ? (pl.on ? gy + legAng(mv, t, sg.t0) : legYaw(F, mv, t, sg.t0)) : pl.on ? gy + Math.atan2(da, db) : (Math.abs(da) + Math.abs(db) > 1e-3 ? F.yaw(da, db) : F.yaw(0, -1));   // (eased at the way's corners)
      pose = mv.pose; pt = ((mv.d0 || 0) + f * mv.d) * (STRIDE[pose] || 4) + p.ph * TAU; J = poseJ(pose, pt); show = mv.hold;
    } else {
      const s = sg.s, gy = placeOf(Sc, s, _w);
      if (s.cam && Sc.movers.length) {   // the cameraman on the tower: behind the camera, turning with it
        const Mv = Sc.movers[0], G = Sc.groups[Mv.on]; _q.set(Mv.x, Mv.y, Mv.z).applyMatrix4(G.m); const cy = Mv.yaw;
        _w.x = _q.x - Math.sin(cy) * 0.85; _w.z = _q.z - Math.cos(cy) * 0.85; yaw = cy;
      } else if (s.on) { yaw = gy + (s.yaw || 0); if (sg.aa != null && t - sg.t0 < ARR_T) { const u = clamp((t - sg.t0) / ARR_T, 0, 1); tl = wrapA(yaw - gy - sg.aa) * (1 - u * u * (3 - 2 * u)); yaw -= tl; } }   // (on its thing: come from a walk on it, turned)
      else { const fc = s.face == null || s.face === 'road' ? null : s.face; yaw = fc ? F.yaw(fc[0], fc[1]) : F.yaw(0, -1);
        if (s.ff && t - s.tf < TURN_T) { const u = clamp((t - s.tf) / TURN_T, 0, 1); tl = wrapA(yaw - F.yaw(s.ff[0], s.ff[1]) - Math.PI * s.fk) * (1 - u * u * (3 - 2 * u)); yaw -= tl; }   // (a pacer stopping: turning to it from the way it walked, planOut; tl: the turn still to go)
        else if (sg.aa != null && t - sg.t0 < ARR_T) { const u = clamp((t - sg.t0) / ARR_T, 0, 1); tl = wrapA(yaw - F.yaw(Math.cos(sg.aa), Math.sin(sg.aa))) * (1 - u * u * (3 - 2 * u)); yaw -= tl; } }   // (come from a walk: turned to its facing from the way it came)
      pose = s.pose || 'stand'; rx = s.rx || 0; show = sg === ACT ? (p.actShow || (p.actShow = showOf(s))) : (sg.show || (sg.show = showOf(s)));
      if (sg.act && !s.still) {   // what it does: its own motion, or a breath
        const m = MOTION[pose], tt = t + p.ph * 17 + (p.po || 0);   // (p.po: a pacer's clock set back on its return, planBack)
        if (m && m.alt) { let u = 0.5 - 0.5 * Math.cos((tt * m.hz) * TAU); if (m.snap) u = u * u * (3 - 2 * u); J = mixJ(poseJ(pose, s.t || 0), poseJ(m.alt, 0), u); }
        else if (m && (pose === 'walk' || pose === 'carryWalk')) {   // pacing back and forth along its facing (carrying a crate, a tyre, the dog on its leash)
          const pc = pace(s, tt), k = pc.turn * pc.turn * (3 - 2 * pc.turn); placeOf(Sc, { a: pc.a, b: pc.b, y: s.y || 0 }, _w);
          yaw = (pc.back ? F.yaw(pc.ux, pc.uz) : F.yaw(-pc.ux, -pc.uz)) + Math.PI * k; J = poseJ(pose, tt * 4.6);   // (turning round from the way it came)
        }
        else if (m) J = poseJ(pose, (s.t || 0) + tt * m.rate);
        else { J = poseJ(pose, s.t || 0); J.look = (J.look || 0) + 0.35 * Math.sin(tt * 0.37) * Math.sin(tt * 0.11 + 1.3); J.lean = (J.lean || 0) + 0.02 * Math.sin(tt * 0.6); }
      } else J = poseJ(pose, (s.t || 0) + (t - sg.t0) * (RATE[pose] || 0) + (s.still ? 0 : p.ph * TAU));
      look = s.look != null ? s.look : sg.fence && car ? 'car' : null;
      if (sg.fence && car && !s.on && !s.face) {   // at the fence: turned a little towards the car (the head the rest of the way)
        const d = wrapA(Math.atan2(car.x - _w.x, car.z - _w.z) - yaw); yaw += clamp(d * 0.3, -0.45, 0.45);
      }
    }
    J = umbrella(p, J, show, pose);
    P.root.position.set(_w.x, _w.y + (J.dy || 0) * P.sc, _w.z); P.root.rotation.set(rx, yaw, 0, 'YXZ'); P.root.scale.setScalar(P.sc);
    setJ(P, J);
    if (look === 'car' && car) { const d = wrapA(Math.atan2(car.x - _w.x, car.z - _w.z) - yaw - tl) + tl; P.torso.rotation.y += clamp(d * 0.35, -0.5, 0.5); P.head.rotation.y = clamp(d - P.torso.rotation.y, -1.1, 1.1); }
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
    if (sg.mv) { const f = clamp((t - sg.t0) / Math.max(1e-3, sg.t1 - sg.t0), 0, 1), pl = lerpPlace(sg.mv, f); placeOf(Sc, pl, _w); yaw = sg.mv.th != null && !pl.on ? legYaw(F, sg.mv, t, sg.t0) : F.yaw(sg.mv.to.a - sg.mv.from.a, sg.mv.to.b - sg.mv.from.b) || 0; dy = 0.07 * Math.abs(Math.sin(f * sg.mv.d * 3.2)); }
    else { const s = sg.s; let pl = s;
      const stay = p.st && p.st.run === false;   // (one that stays by its master: it barks as the car comes, then lies quiet; no run along the fence)
      if (sg.fence && Sc.pass >= 0 && !stay) { const u = clamp((t - Sc.pass) / 2.2, 0, 1); pl = { a: s.a + u * 3.5, b: s.b }; dy = u < 1 ? 0.07 * Math.abs(Math.sin(u * 14)) : 0; }   // (along the fence after the car)
      else if (sg.fence && !(stay && Sc.pass >= 0)) dy = 0.05 * Math.abs(Math.sin(t * 9));   // (barking, jumping at the fence)
      placeOf(Sc, pl, _w); const fc = s.face || [0, -1]; yaw = F.yaw(fc[0], fc[1]);
      if (sg.aa != null && !s.on && t - sg.t0 < ARR_T) { const u = clamp((t - sg.t0) / ARR_T, 0, 1), y0 = F.yaw(Math.cos(sg.aa), Math.sin(sg.aa)); yaw = y0 + wrapA(yaw - y0) * u * u * (3 - 2 * u); } }
    const P = p.P; P.root.position.set(_w.x, _w.y + dy, _w.z); P.root.rotation.set(0, yaw, 0); P.root.updateMatrixWorld(true); write(P, null, Sc.pos, Sc.nor);
  }
  // a moving camera's head on its tower: it pans slowly before the car comes, then follows it
  function poseMover(Sc, Mv, t, car) {
    const G = Sc.groups[Mv.on]; _q.set(Mv.x, Mv.y, Mv.z).applyMatrix4(G.m);
    let yaw = G.yaw + 0.5 * Math.sin(t * 0.23) + 0.3;
    if (car && Sc.al >= 0 && Math.hypot(car.x - _q.x, car.z - _q.z) < 160) yaw = Math.atan2(car.x - _q.x, car.z - _q.z);
    Mv.yaw = yaw; const P = Mv.P; P.root.position.copy(_q); P.root.rotation.set(0, yaw, 0); P.root.updateMatrixWorld(true); write(P, null, Sc.pos, Sc.nor);
  }
  // the umbrellas in the rain (the user, 3. 11. 2026: »ko pada dež naj ima večina … marele«): most of the fans and the people on the stands (not
  // under a roof, not the staff: p.um) hold one up in the left hand while it rains (Render.raining: not in the snow) and the hand is free; one
  // instanced mesh for the world (W.umb), only the posed scenes' people near (step)
  let WET = false;
  const hash32 = (a) => { let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; };   // (a well-mixed integer hash: who of a scene holds one)
  const UMB_COLS = [0x1b1d22, 0x15306b, 0xb2222a, 0x1f63d8, 0x1d6b3a, 0xe8b417, 0xf2f2ee, 0x6a2f8a, 0xe0602a, 0x2a8a8a, 0x1b1d22, 0x15306b];
  const TWO_HANDS = new Set(['carry', 'carryWalk', 'push', 'cam', 'phone', 'phoneUp', 'sitText', 'sitFilm', 'crouchCam', 'boardOut', 'chopUp', 'chopDown', 'sweep', 'fixHood', 'hang']);   // (both hands busy: no umbrella then)
  const BUSY_HANDS = new Set(['glasba', 'radio', 'karte', 'nogomet', 'navijaci', 'zmaj', 'kotlicek', 'selfie', 'plaza', 'badminton', 'lestve', 'motoristi']);   // (js/world-ljudje2.js's groups: their hands at their guitar, cards, drum, ladle, racket …: no umbrella; js/world-ljudje3.js adds its own)
  const STAFF_SCENES = new Set(['marsali', 'gasilci', 'boksi', 'foto', 'foto2', 'tv', 'reli', 'resevalci', 'odvoz', 'delavci', 'tvekipa', 'sodniki', 'varnost']);   // (the staff's scenes: rain gear, no umbrellas)
  function umbrella(p, J, show, pose) {   // its left arm up holding the umbrella (p.uh: held now)
    p.uh = false;
    if (!WET || !p.um || TWO_HANDS.has(pose)) return J;
    if (show) for (const k of show) if (k[0] === 'L') return J;   // (something else in that hand)
    const O = Object.assign({}, J), two = (k, v) => { O[k] = [v, jv(J, k, 1)]; };
    two('shz', 0.2); two('shx', 0.9); two('el', 1.45); two('shy', 0.15); p.uh = true; return O;
  }
  function umbGeo() {   // the canopy (8 panels, 1 m across, its rim 0.86 m over the hand) and the shaft, white and dark (the instance its colour)
    const P = [], C = [], N = [], add = (a, b, c, k) => { P.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) C.push(k, k, k);
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; for (let i = 0; i < 3; i++) N.push(nx / l, ny / l, nz / l); };
    for (let k = 0; k < 8; k++) { const a0 = k / 8 * TAU, a1 = (k + 1) / 8 * TAU; add([0, 1.02, 0], [Math.sin(a0) * 0.5, 0.86, Math.cos(a0) * 0.5], [Math.sin(a1) * 0.5, 0.86, Math.cos(a1) * 0.5], 1); }
    for (let k = 0; k < 3; k++) { const a0 = k / 3 * TAU, a1 = (k + 1) / 3 * TAU, r = 0.012, p0 = [Math.sin(a0) * r, -0.06, Math.cos(a0) * r], p1 = [Math.sin(a1) * r, -0.06, Math.cos(a1) * r];
      add(p0, p1, [p1[0], 1.02, p1[2]], 0.18); add(p0, [p1[0], 1.02, p1[2]], [p0[0], 1.02, p0[2]], 0.18); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.attributes.color.noSeason = true; return g;
  }
  const _um = new THREE.Matrix4(), _uq = new THREE.Quaternion(), _ue = new THREE.Euler(), _us = new THREE.Vector3(), _up = new THREE.Vector3(), _uc = new THREE.Color();
  function umbStep(W) {
    const M = W.umb; if (!M) return; let n = 0;
    if (WET) for (const Sc of W.scenes) { if (!Sc.posed || !Sc.ppl.visible || !Sc.grp.visible) continue;
      for (const p of Sc.people) { if (!p.uh || n >= M.um) continue; const P = p.P, e = P.hand[0].matrixWorld.elements;
        _up.set(e[12], e[13], e[14]); _ue.set(-0.2, P.root.rotation.y, 0, 'YXZ'); _uq.setFromEuler(_ue); _us.setScalar(P.sc); _um.compose(_up, _uq, _us); M.setMatrixAt(n, _um);
        M.setColorAt(n, _uc.setHex(UMB_COLS[p.uk])); n++; } }
    M.count = n; M.visible = n > 0; if (n) { M.instanceMatrix.needsUpdate = true; M.instanceColor.needsUpdate = true; }
  }
  // the grandstand's wave: the people by the car stand up as it comes (the wave goes with it), sit down behind it; heads to the car; what they do
  // sitting (P.seat.pose: eating, drinking, on the phone …, their things in their hands); the walkers on their ways (poseWalker)
  function poseStand(Sc, t, car, fixed) {
    const G = Sc.groups.st, dt = clamp(t - (Sc.ts == null ? t : Sc.ts), 0, 0.2); Sc.ts = t;
    const carA = car && Sc.da != null ? -Sc.da : -1e9;
    for (const p of Sc.people) {
      const P = p.P, st = P.seat; if (!st) { if (P.fix) poseCam(Sc, p, fixed ? 0 : t, car); else poseWalker(Sc, p, fixed ? 0 : t, car); continue; }
      const f = standUp(Sc, p, carA, dt, fixed);
      const sig = f > 0 ? -1 : (car && carA > -60 && carA < Sc.len + 30 ? 1 : 0);
      if (!fixed && sig === p.sig && sig >= 0 && p.wet === WET) continue; p.sig = sig; p.wet = WET;   // (still: not posed again; the rain's start or end: all again)
      const up = poseJ(st.up || (st.k < 0.55 ? 'cheer' : st.k < 0.75 ? 'jump' : st.k < 0.9 ? 'wave' : 'phoneUp'), t * 6.5 + st.k * 9), sit = poseJ(st.pose || (st.k < 0.65 ? 'sit' : 'sitLean'));
      const J = umbrella(p, mixJ(sit, up, f), null, f > 0.5 ? (st.up || '') : (st.pose || 'sit')); _w.set(st.x, st.y + (Sc.lift != null ? Sc.lift : 0.42) * f, st.z + (Sc.fwd != null ? Sc.fwd : 0.05) * f).applyMatrix4(G.m);   // (Bathurst's stand: up on the bench; the others' stands: a step forward, off it)
      P.root.position.set(_w.x, _w.y + (J.dy || 0) * P.sc, _w.z); P.root.rotation.set(0, G.yaw, 0); P.root.scale.setScalar(P.sc); setJ(P, J);
      if (sig === 1 && car) { const d = wrapA(Math.atan2(car.x - _w.x, car.z - _w.z) - G.yaw); P.head.rotation.y = clamp(d, -1.1, 1.1); }
      P.root.updateMatrixWorld(true); write(P, P.show || null, Sc.pos, Sc.nor);
    }
  }
  // a walker on a stand (P.walk): along its way and back, stopping now and then (a vendor to sell, facing the seats), a while at either end
  function walkAt(w, t) {   // its distance along the way at time t, whether it moves, which way
    let u = ((t + w.ph * w.per) % w.per + w.per) % w.per, back = false;
    if (u >= w.leg + w.wait) { u -= w.leg + w.wait; back = true; }
    if (u >= w.leg) return { d: back ? 0 : w.L, mv: false, back };
    const k = Math.floor(u / w.cyc), r = u - k * w.cyc, d = Math.min(w.L, k * w.stop + Math.min(r * w.v, w.stop));
    return { d: back ? w.L - d : d, mv: r * w.v < w.stop && d < w.L, back };
  }
  // the TV cameraman on his platform under the roof: his camera on his shoulder, panning slowly, following the car when it is near
  function poseCam(Sc, p, t, car) {
    const P = p.P, F = P.fix; let yaw = F.yaw + 0.6 * Math.sin(t * 0.21 + p.ph * 6);
    if (car && Math.hypot(car.x - F.x, car.z - F.z) < 220) yaw = Math.atan2(car.x - F.x, car.z - F.z);
    P.root.position.set(F.x, F.y, F.z); P.root.rotation.set(0, yaw, 0); P.root.scale.setScalar(P.sc); setJ(P, poseJ('cam'));
    P.root.updateMatrixWorld(true); write(P, P.show || null, Sc.pos, Sc.nor);
  }
  function poseWalker(Sc, p, t, car) {
    const P = p.P, w = P.walk, { d, mv, back } = walkAt(w, t), c = w.cum, n = c.length;
    let i = 1; while (i < n - 1 && c[i] < d) i++;
    const a = w.pts[i - 1], b = w.pts[i], f = clamp((d - c[i - 1]) / ((c[i] - c[i - 1]) || 1), 0, 1);
    _w.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
    let dx = b[0] - a[0], dz = b[2] - a[2]; if (Math.hypot(dx, dz) < 0.05) { dx = w.dir[0]; dz = w.dir[1]; }
    if (back) { dx = -dx; dz = -dz; }
    const yaw = !mv && w.face ? Math.atan2(w.face[0], w.face[1]) : Math.atan2(dx, dz);
    const pose = mv ? (w.carry ? 'carryWalk' : 'walk') : (w.carry ? 'carry' : 'stand'), J = umbrella(p, poseJ(pose, mv ? d * STRIDE.walk + p.ph * TAU : 0), null, pose);
    P.root.position.copy(_w); P.root.rotation.set(0, yaw, 0); P.root.scale.setScalar(P.sc); setJ(P, J);
    if (!mv && car) { const dh = wrapA(Math.atan2(car.x - _w.x, car.z - _w.z) - yaw); P.head.rotation.y = clamp(dh, -1.0, 1.0); }
    P.root.updateMatrixWorld(true); write(P, P.show || null, Sc.pos, Sc.nor);
  }
  function poseScene(Sc, t, car, fixed) {
    Sc.posed = true;
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
        const g = m.geometry, P = g.attributes.position, AL = g.attributes.aL, AM = g.attributes.aM; if (!P || g.index) return; let ch = false;
        for (let t = 0; t + 2 < P.count; t += 3) {
          if (AM && AM.getX(t) >= 50) {   // (an animal of the herds, js/world-zivali.js: its vertices in its own frame, its place aL: all of it out where it stands inside)
            const x = AL.getX(t), z = AL.getZ(t); if (!inside(x, z) || A.clearance(x, z) < 0.5) continue;
            P.setXYZ(t + 1, P.getX(t), P.getY(t), P.getZ(t)); P.setXYZ(t + 2, P.getX(t), P.getY(t), P.getZ(t)); ch = true; n++; continue;
          }
          const x = P.getX(t), z = P.getZ(t); if (!inside(x, z) || !inside(P.getX(t + 1), P.getZ(t + 1)) || !inside(P.getX(t + 2), P.getZ(t + 2)) || A.clearance(x, z) < 0.5) continue;
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
  const SUMMER = new Set(['piknik', 'kolesarji', 'plaza', 'badminton', 'nogomet', 'karte', 'glasba', 'zmaj', 'motoristi']);   // (the scenes of a summer's day: out of the world under snow; js/world-ljudje2.js's too, js/world-ljudje3.js adds its own)
  // what a scene does as the followed car comes (it at cs along the road, v fast): ready for it (arm), out to the fence (alert), the car past, back
  function react(Sc, T, t, cs, v) {
    let da = Sc.s0 - cs; if (!T.open) da -= T.len * Math.round(da / T.len);
    Sc.da = da; const eta = v > 2 ? da / v : 1e9;
    if (Sc.arm) { if (da > -4 && da < 700 && eta < WARN) alert(Sc, t); }
    else if (Sc.al >= 0) {
      if (Sc.pass < 0 && da < -3) Sc.pass = t;
      if (Sc.back < 0 && ((Sc.pass >= 0 && t > Sc.pass + BACK) || t > Sc.al + 16)) goBack(Sc, t);
      if (Sc.back >= 0 && t > Sc.done) { Sc.al = -1; for (const p of Sc.people.concat(Sc.pets)) p.segs = null; }   // (all back at what they were doing)
    } else if (da > 160 || da < -120) Sc.arm = true;   // (the car far away again: the next time it comes)
  }
  // a seat's person up for the car (p.up 0..1: up as it comes, down after it; carA where the car is along the stand)
  function standUp(Sc, p, carA, dt, fixed) {
    const st = p.P.seat, dA = st.x * Sc.sgn - carA + (st.k - 0.5) * 2, want = !fixed && dA > -4 && dA < 11 ? 1 : 0, f0 = p.up || 0;
    return (p.up = want ? Math.min(1, f0 + dt * 3.2) : Math.max(0, f0 - dt * 1.6));
  }
  // a replay's timeline (the user, 4. 11. 2026: »gledalci naj se premikajo v časovnici nazaj tako kot jaz z avtomobilom«): every scene at t as
  // the race had it there, the same however the replay got to t: from a reset, the scenes' logic over the recording from a whole RS_GRID s
  // at least RESIM s before t (the car followed, rp.k, where rp.at has it, RS_DT apart; the same start for nearby times: the same story),
  // the stands' people up or down as the last 1.2 s left them
  const RESIM = 45, RS_GRID = 30, RS_DT = 0.1, _ra = { x: 0, z: 0, v: 0 };
  function resim(W, t, rp, winter) {
    const T = W.T, t0 = Math.max(rp.t0, Math.floor((t - RESIM) / RS_GRID) * RS_GRID), n = Math.max(0, Math.ceil((t - t0) / RS_DT - 1e-6));
    for (const Sc of W.scenes) { reset(Sc); for (const p of Sc.people.concat(Sc.pets)) p.po = 0; }
    W.cs = null; W.hint = -1; let lt = t0;   // (the car's place found afresh: it may be far from where it was)
    for (let k = 0; k <= n; k++) {
      const tt = k === n ? t : t0 + k * RS_DT, d = tt - lt; rp.at(tt, _ra);
      const q = T.query(_ra.x, _ra.z, W.hint, W.q); W.hint = q.i; const cs = q.s;
      if (W.cs == null) W.v = _ra.v;
      else if (d > 1e-4) { let ds = cs - W.cs; if (!T.open) ds -= T.len * Math.round(ds / T.len); W.v += (clamp(ds / d, -120, 160) - W.v) * Math.min(1, d * 5); }
      W.cs = cs; lt = tt;
      for (const Sc of W.scenes) {
        if (winter && SUMMER.has(Sc.name)) continue;
        react(Sc, T, tt, cs, W.v);
        if (Sc.stand && tt > t - 1.2) for (const p of Sc.people) if (p.P.seat) standUp(Sc, p, -Sc.da, d, false);
      }
    }
    for (const Sc of W.scenes) Sc.ts = t;
  }
  function step(W, t, car, cam, rp) {
    if (!car) {   // no car (the world test): every scene in its first pose, as built (dry: no umbrellas)
      WET = false; for (const Sc of W.scenes) { reset(Sc); Sc.on = false; Sc.grp.visible = true; Sc.ppl.visible = true; poseScene(Sc, 0, null, true); }
      W.root.visible = true; smokeStep(W, 0, true); if (W.umb) { W.umb.count = 0; W.umb.visible = false; } W.cs = null; W.lt = 0; return;
    }
    // a special mission (js/missions.js, Missions.run): not a race day (a flood, a fire, a rescue), so none of these out; back when it is over
    const mis = typeof Missions !== 'undefined' && !!Missions.run; W.root.visible = !mis; if (mis) { W.cs = null; return; }
    const T = W.T, winter = W.o.seasonKey === 'winter';   // (winter: the world under snow, js/render.js seasonWorld)
    // a replay (rp, js/game.js replayFrame): the scenes on its timeline. Its start, a jump on it (back, a seek, a frame back) or another car
    // followed: every scene as the race had it at t (resim); out of a replay, back in the race: every scene as at a new race's start
    if (rp ? W.rk !== rp.k || t < W.lt - 1e-3 || t > W.lt + 0.5 : W.rk != null) {
      if (rp) resim(W, t, rp, winter); else { for (const Sc of W.scenes) reset(Sc); W.cs = null; }
      W.rk = rp ? rp.k : null; W.lt = t;
    }
    const dt = t - W.lt; W.lt = t;
    const wet = typeof Render !== 'undefined' && !!Render.raining && !winter;   // (the rain falling, not snow: umbrellas up)
    if (wet !== WET) { WET = wet; for (const Sc of W.scenes) for (const p of Sc.people) p.sig = null; }
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
      react(Sc, T, t, cs, W.v);
      const dc = cp ? Math.hypot(cp.x - Sc.cx, cp.z - Sc.cz) : 0;
      Sc.grp.visible = dc < W.rShow; Sc.ppl.visible = dc < W.rPpl;
      Sc.on = dc < W.rPose && (!cam || _fr.intersectsSphere(_sp.set(_cv.set(Sc.cx, Sc.cy, Sc.cz), Sc.r)));
      if (Sc.on && (dc < 80 || ((W.frame + Sc.k) & 1) === 0)) poseScene(Sc, t, car, false);   // (farther than 80 m: every other frame)
    }
    smokeStep(W, t, false); umbStep(W);
  }

  /* ---------------- where: the scenes of each real track [scene, metres after the start line, side (+1 right, -1 left), options] ---------------- */
  // (the 12 proposals' places from the pictures; the others found by tools/ljudje/mesta.mjs --plan: a straight before, the barrier near, flat ground,
  // no other road, building or stand there; a circuit's pit wall added by itself: def.pit)
  const SITES = {
    bathurst: [['boksi', 70, -1], ['zar', 640, -1], ['gasilci', 1104, 1], ['vhod', 1976, -1], ['marsali', 2784, -1], ['foto', 4456, 1], ['oder', 4984, -1], ['tribuna', 5790, 1]],
    caracoles: [['kamp', 40, 1], ['piknik', 6152, 1], ['foto2', 10488, 1]],
    cpalace: [['marsali', 96, -1], ['gasilci', 600, -1], ['foto2', 1064, 1], ['piknik', 1424, 1], ['vhod', 2912, 1]],
    harju: [['reli', 392, 1], ['oder', 1464, 1], ['foto2', 2144, 1]],
    katu: [['ogenj', 720, 1], ['kamp', 4544, -1]],
    marrakesh: [['gasilci', 80, 1], ['marsali', 480, 1], ['tribuna', 1112, 1], ['marsali', 1560, -1], ['foto', 2320, 1]],
    medvode: [['foto2', 96, 1], ['piknik', 1664, 1], ['hisa2', 2896, 1], ['kolesarji', 4336, -1]],
    montreal: [['gasilci', 136, 1], ['foto', 1736, 1], ['marsali', 2520, -1], ['marsali', 3232, -1], ['tribuna', 4064, 1]],
    nring: [['oder', 1950, 1], ['zar', 3300, -1], ['tv', 4720, 1], ['ogenj', 5640, -1], ['foto2', 7672, 1], ['gasilci', 8424, -1], ['ogenj', 9832, -1], ['oder', 11088, 1], ['piknik', 12392, -1], ['zar', 14624, -1], ['tv', 16350, -1], ['kamp', 17168, -1], ['telo', 18450, -1], ['marsali', 19976, -1]],
    pikes: [['foto2', 4672, 1]],
    pikesg: [['foto2', 3824, 1]],
    rastro: [['piknik', 4432, -1]],
    rbring: [['vhod', 216, -1], ['gasilci', 896, -1], ['marsali', 1704, -1], ['zar', 2488, -1], ['oder', 3112, 1], ['foto', 3560, 1]],
    spa: [['vhod', 170, -1], ['foto', 870, -1], ['marsali', 1360, 1], ['ogenj', 1864, 1], ['tribuna', 4280, 1], ['gasilci', 5560, 1], ['zar', 6288, 1]],
    suzuka: [['tribuna', 118, 1], ['vhod', 806, -1], ['foto', 2022, 1], ['gasilci', 4070, -1], ['marsali', 5078, 1]],
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

  /* ---------------- the grandstands' people (the user, 2. 11. 2026: »naj bodo na vseh tribunah v igri taki gledalci, ampak ker veliko
     gledalcev porabi veliko grafike naredi da so tribune bolj prazne in le nekaj gledalcev«): the world's own stands (their painted crowd,
     World's crowdStands) get empty seats (Tex.crowdSeats) and a few people of these figures on them, friends in groups of 2-6 with empty
     seats between; their seats read off the stands' tiers (the crowd picture's layout: 32 seats across a tier's 12 m, a tier a row of the
     picture); each stretch of a stand a scene of its own (posed near the camera; the wave as on Bathurst's stand). STANDS: the share of the
     seats taken, the most people on a track (by the tier), on a stretch, a stretch's length ---------------- */
  const STANDS = { share: 0.05, most: [60, 240, 400], per: 24, len: 40, walk: [6, 14, 24] };   // (NIZKA: 60 at most, the phone's budget; walk: the most walkers on a track's stands)
  // what the people on the stands do while they wait (the user, 3. 11. 2026: »… pije pijačo, je hrano, snema, telefonira«): the share, the pose
  // sitting, the things in the hand (one of them); the others sit or lean forwards
  const SEAT_ACTS = [[0.1, 'sitEat', ['hotdog', 'burger', 'icecream', 'popcorn']], [0.14, 'sitDrink', ['cup', 'can', 'bottle']], [0.06, 'sitPhone', ['phone']],
    [0.08, 'sitText', ['phone']], [0.05, 'sitFlag', ['mflag']], [0.05, 'sitFilm', ['phone']]];
  function roofed(feet, x, y, z) {   // under a stand's roof (its copied triangles over it)? (no umbrella there in the rain)
    for (const f of feet) { if (!f.rv || x < f.bb[0] || x > f.bb[1] || z < f.bb[2] || z > f.bb[3]) continue; const R = f.rv;
      for (let i = 0; i + 2 < R.length; i += 3) { const a = R[i], b = R[i + 1], c = R[i + 2]; if (Math.min(a[1], b[1], c[1]) < y + 1.2) continue;
        const d = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]); if (Math.abs(d) < 1e-9) continue;
        const w1 = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / d, w2 = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / d; if (w1 >= 0 && w2 >= 0 && w1 + w2 <= 1) return true; } }
    return false;
  }
  const isStand = (m) => m.isMesh && !m.isInstancedMesh && m.visible && m.material && !Array.isArray(m.material) && m.material.userData && m.material.userData.stand && m.geometry && m.geometry.attributes.uv;
  const hasStands = (o) => { let n = 0; o.root.traverse(m => { if (isStand(m)) n++; }); return n > 0; };
  const STAND_EMPTY_FS = ['#ifdef USE_MAP',   // (the stand's picture per tier as crowdStands lays it, the seats empty: nobody jumps, no flags)
    'float crT = floor(vUv.y / uCV.y + 1e-4), crL = clamp((vUv.y - crT * uCV.y) / uCV.z, 0.0, 1.0);',
    'vec4 texelColor = texture2D( map, vec2(vUv.x * uCV.x, mod(crT, 8.0) / 8.0 + crL / 8.0) );',
    'texelColor = mapTexelToLinear( texelColor );', 'diffuseColor *= texelColor;', '#endif'].join('\n');
  // the stands made three-dimensional and as they are (the user, 2. 11. 2026: »popravi tribune da bodo bolj 3d«, »ljudje sedijo in stojijo v
  // zraku«; then »posodobi povsod še dodatno tribune … naj bodo dobro narejene v dobri grafiki … čim bolj podobno kot v resnici«): over each
  // stand's crowd surface (its picture's tiers: v bands of the pitch, u along it) a row of the stand per tier: a riser where the surface is
  // raked, the tread, and on it a row of bucket seats (each its own in the kit's picture, Tex.standKit: the back, the seat), the painted
  // surface hidden. A stand (a part of the surface with all its tiers, or the parts of a stepped one, a tier each, joined where one's back
  // meets the next one's front) is cut into blocks of about BLOCK m by aisles: their steps halved (yellow edges), a handrail up the middle; its
  // seats in its colours (one, or by blocks, bands or a stripe); at its ends a wall a metre over the steps (concrete; a temporary stand on the
  // street circuits: its scaffolding and a railing). The seats every SEAT_W along a block (the people's: the tread's height, under the seat's
  // middle). A steep one (a wall of people) keeps its surface with empty seats painted (Tex.crowdSeats), nobody on it
  const SEAT_W = 0.55, BENCH = { back: 0.06, depth: 0.42, h: 0.44, rest: 0.4 }, BLOCK = 15, AISLE = 1.2, KIT = Tex.STAND_KIT;
  const STAND_TEMP = new Set(['newcastle', 'toronto', 'townsville', 'montreal', 'detroit', 'bangsaen', 'troisrivieres', 'monterey', 'marrakesh', 'riverside']);   // (put up for the race, or bleachers: on scaffolding)
  const STAND_BENCH = { longford: 'wood', cpalace: 'wood', riverside: 'wood', monterey: 'alu', troisrivieres: 'alu' };   // (benches, not seats: the period stands' of timber, the bleachers' of aluminium)
  const BENCH_COL = { wood: [0.6, 0.46, 0.3], alu: [0.8, 0.82, 0.85] }, DECK_COL = { wood: [0.62, 0.52, 0.4], alu: [0.72, 0.74, 0.77] };
  const SEAT_COLS = [[0.12, 0.28, 0.6], [0.64, 0.12, 0.11], [0.46, 0.48, 0.52], [0.1, 0.42, 0.22], [0.88, 0.4, 0.07], [0.86, 0.66, 0.08], [0.84, 0.84, 0.82], [0.18, 0.52, 0.78]];   // blue, red, grey, green, orange, yellow, white, sky
  const ST_CONC = [0.6, 0.6, 0.62], ST_DECK = [0.7, 0.72, 0.75], ST_STEEL = [0.64, 0.66, 0.7], ST_RAIL = [0.8, 0.81, 0.83], NOSEAT = [0, 0, 0];
  const kv = (band, f) => 1 - (band[0] + 0.5 + Math.max(0, Math.min(1, f)) * (band[1] - band[0] - 1)) / KIT.H;   // (a band's v: f 0 its top row, 1 its bottom)
  const kq = (band, u0, u1, f0, f1) => [[u0, kv(band, f0)], [u1, kv(band, f0)], [u1, kv(band, f1)], [u0, kv(band, f1)]];   // (a quad a b c d: a-b at f0, d-c at f1)
  class SB {   // a stand's geometry, non-indexed with flat normals: per vertex the concrete's colour (the seasons paint it), the seat's own (aSeat), the kit's uv
    constructor() { this.P = []; this.N = []; this.C = []; this.S = []; this.U = []; }
    get empty() { return !this.P.length; }
    tri(a, b, c, col, seat, ua, ub, uc, n) {
      this.P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); this.U.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
      for (let k = 0; k < 3; k++) { this.N.push(n[0], n[1], n[2]); this.C.push(col[0], col[1], col[2]); this.S.push(seat[0], seat[1], seat[2]); }
    }
    quad(a, b, c, d, out, col, seat, uv) {   // a b c d around, facing out (a direction)
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz); if (!(l > 1e-9)) return;
      nx /= l; ny /= l; nz /= l; seat = seat || NOSEAT;
      if (nx * out[0] + ny * out[1] + nz * out[2] < 0) { const n = [-nx, -ny, -nz]; this.tri(a, c, b, col, seat, uv[0], uv[2], uv[1], n); this.tri(a, d, c, col, seat, uv[0], uv[3], uv[2], n); }
      else { const n = [nx, ny, nz]; this.tri(a, b, c, col, seat, uv[0], uv[1], uv[2], n); this.tri(a, c, d, col, seat, uv[0], uv[2], uv[3], n); }
    }
    bar(p0, p1, w, h, col) {   // a rail from p0 to p1: its two sides and its top (w wide, h deep)
      const dx = p1[0] - p0[0], dz = p1[2] - p0[2], L = Math.hypot(dx, dz) || 1, sx = -dz / L * w / 2, sz = dx / L * w / 2, U = kq(KIT.rail, 0, 1, 0, 1);
      const a = [p0[0] - sx, p0[1], p0[2] - sz], b = [p1[0] - sx, p1[1], p1[2] - sz], c = [p1[0] + sx, p1[1], p1[2] + sz], d = [p0[0] + sx, p0[1], p0[2] + sz];
      this.quad(a, b, c, d, [0, 1, 0], col, null, U);
      for (const [q0, q1, s] of [[a, b, -1], [d, c, 1]]) this.quad(q0, q1, [q1[0], q1[1] - h, q1[2]], [q0[0], q0[1] - h, q0[2]], [s * sx, 0, s * sz], col, null, U);
    }
    beam(p0, p1, w, h0, h1, col) {   // a beam hanging from p0 to p1 (h0 deep at p0, h1 at p1): its two sides and its underside
      const dx = p1[0] - p0[0], dz = p1[2] - p0[2], L = Math.hypot(dx, dz) || 1, sx = -dz / L * w / 2, sz = dx / L * w / 2, U = kq(KIT.rail, 0, 1, 0, 1), lo = (q, h) => [q[0], q[1] - h, q[2]];
      const a = [p0[0] - sx, p0[1], p0[2] - sz], b = [p1[0] - sx, p1[1], p1[2] - sz], c = [p1[0] + sx, p1[1], p1[2] + sz], d = [p0[0] + sx, p0[1], p0[2] + sz];
      this.quad(lo(a, h0), lo(b, h1), lo(c, h1), lo(d, h0), [0, -1, 0], col, null, U);
      this.quad(a, b, lo(b, h1), lo(a, h0), [-sx, 0, -sz], col, null, U); this.quad(d, c, lo(c, h1), lo(d, h0), [sx, 0, sz], col, null, U);
    }
    post(p, h, w, f, col) {   // an upright, from p up h: its faces to the front and back (f), w wide
      const sx = -f[1] * w / 2, sz = f[0] * w / 2, U = kq(KIT.rail, 0, 1, 0, 1), a = [p[0] - sx, p[1], p[2] - sz], b = [p[0] + sx, p[1], p[2] + sz];
      for (const s of [1, -1]) this.quad(a, b, [b[0], b[1] + h, b[2]], [a[0], a[1] + h, a[2]], [s * f[0], 0, s * f[1]], col, null, U);
    }
    geometry() {
      const g = new THREE.BufferGeometry(), F = (a, n) => new THREE.Float32BufferAttribute(a, n);
      g.setAttribute('position', F(this.P, 3)); g.setAttribute('normal', F(this.N, 3)); g.setAttribute('color', F(this.C, 3)); g.setAttribute('aSeat', F(this.S, 3)); g.setAttribute('uv', F(this.U, 2));
      g.computeBoundingSphere(); return g;
    }
  }
  function standMat() {   // the kit: red its light and shade, green the seat's colour over the concrete's, blue the yellow paint
    const M = new THREE.MeshLambertMaterial({ vertexColors: true, map: Tex.standKit() });
    M.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aSeat;\nvarying vec3 vSeat;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSeat = aSeat;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSeat;').replace('#include <map_fragment>', 'vec4 stK = texture2D( map, vUv );')
        .replace('#include <color_fragment>', 'diffuseColor.rgb *= mix( mix( vColor, vSeat, stK.g ), vec3( 0.92, 0.72, 0.1 ), stK.b ) * stK.r;');
    };
    M.customProgramCacheKey = () => 'standKit'; return M;
  }
  // the stands' roofs as they are (profiled metal sheets, a rib every half metre, a joint every two): over the world's own roofs (what faces up
  // over a stand's footprint, 1.5-14 m over its top tread, in the world's vertex-coloured meshes) a copy 5 cm up in the stands' meshes, in the
  // kit's picture (their colours kept: the seasons still paint them; the world's own still casts the shadow)
  const inPoly = (P, x, z) => { let c = false; for (let a = 0, b = P.length - 1; a < P.length; b = a++) { const [xa, za] = P[a], [xb, zb] = P[b]; if ((za > z) !== (zb > z) && x < (xb - xa) * (z - za) / (zb - za) + xa) c = !c; } return c; };
  function worldStatics(o) {   // the world's own vertex-coloured meshes (its buildings, stands, walls: world space, not indexed), not the people's
    const ms = [], skip = (m) => m.userData && m.userData.lj;
    const walk = (m) => { if (skip(m)) return; if (m.isMesh && !m.isInstancedMesh && m.visible) {
        const M = m.material, g = m.geometry, A = g && g.attributes;
        if (M && !Array.isArray(M) && M.isMeshLambertMaterial && M.vertexColors && !M.map && !M.transparent && !(M.userData && M.userData.stand) && A && A.position && A.normal && A.color && A.color.itemSize === 3 && !g.index && !A.aSway && Object.keys(A).every(k => ['position', 'normal', 'color', 'uv'].includes(k))) {
          m.updateMatrixWorld(true); if (m.matrixWorld.equals(IDENT)) ms.push(m); } }
      for (const c of m.children) walk(c); };
    walk(o.root); return ms;
  }
  function standRoofs(o, feet, sbAt, ms) {
    if (!feet.length) return 0;
    let n = 0; const UV = kv(KIT.roof, 0.5);
    for (const m of ms) {
      const g = m.geometry, P = g.attributes.position.array, N = g.attributes.normal.array, C = g.attributes.color.array, nt = P.length / 9;
      if (!g.boundingBox) g.computeBoundingBox(); const bx = g.boundingBox;
      const fs = feet.filter(f => !(bx.max.x < f.bb[0] || bx.min.x > f.bb[1] || bx.max.z < f.bb[2] || bx.min.z > f.bb[3])); if (!fs.length) continue;
      let k = 0;
      for (let t = 0; t < nt; t++) {
        const o9 = t * 9, dn = N[o9 + 1] < -0.6; if (N[o9 + 1] < 0.6 && !dn) continue;   // (its top, or its underside: seen from the road under it)
        const cx = (P[o9] + P[o9 + 3] + P[o9 + 6]) / 3, cz = (P[o9 + 2] + P[o9 + 5] + P[o9 + 8]) / 3, ylo = Math.min(P[o9 + 1], P[o9 + 4], P[o9 + 7]);
        const f = fs.find(f => cx >= f.bb[0] && cx <= f.bb[1] && cz >= f.bb[2] && cz <= f.bb[3] && ylo > f.top + 1.5 && ylo < f.top + 14 && inPoly(f.poly, cx, cz)); if (!f) continue;
        k++;
        const up = (q) => [P[q] + N[o9] * 0.05, P[q + 1] + N[o9 + 1] * 0.05, P[q + 2] + N[o9 + 2] * 0.05], a = up(o9), b = up(o9 + 3), c = up(o9 + 6), u = (p) => [(p[0] * f.tx + p[2] * f.tz) / 4, UV];
        if (dn) (f.rb || (f.rb = [])).push(a, b, c); else (f.rv || (f.rv = [])).push(a, b, c);   // (the roof's corners: its front edge, its trusses and the beams under it, standAround)
        sbAt(cx, cz).tri(a, b, c, [C[o9], C[o9 + 1], C[o9 + 2]], NOSEAT, u(a), u(b), u(c), [N[o9], N[o9 + 1], N[o9 + 2]]);
      }
      n += k;
    }
    return n;
  }
  /* ---- around a stand (the user, 3. 11. 2026: »izboljšaj tudi vse elemente okoli tribun«, »naredi še okoli tribun poti, ki peljejo do tribun,
     sedaj je tam trava«, »če ima tribuna streho … še bolj detajlne, predvsem streho in sprednji del tribun, ki je viden«, »zbriši smreke in
     drevesa pred tribunami«): a paved concourse along its back and round its ends, a path off to an entrance gate (turnstiles under a frame
     with the stand's letter, a ticket booth), its entrances in the back wall, kiosks with striped awnings, toilets, bins and lamp posts on the
     concourse, stairs up at its back corners, its letter on a sign at either end, the strip in front of it paved; a roof's front edge (its
     fascia with floodlights) and trusses over the roof; the trees in front of it, on its concourse and its path cleared (circles for
     clearAll). AR: the concourse's width, the path's width and length, the spacing of kiosks, lamp posts, bins and doors ---- */
  const AR = { apron: 6.5, path: 3, gate: 26, kiosk: 34, lamp: 22, bin: 13, door: 20 };
  const AR_COL = { kiosk: [[0.82, 0.18, 0.14], [0.13, 0.34, 0.66], [0.1, 0.48, 0.28], [0.9, 0.6, 0.1]], lamp: [0.3, 0.32, 0.35], steel: [0.66, 0.68, 0.72], dark: [0.16, 0.18, 0.21],
    sign: [0.1, 0.22, 0.48], white: [0.96, 0.96, 0.94], warm: [1, 0.95, 0.8], pave: [0.8, 0.79, 0.76], booth: [0.86, 0.85, 0.82], clad: [0.72, 0.75, 0.79], boards: [0.56, 0.43, 0.3] };
  function standAround(o, A, feet, sbAt, tier, def, circles, ms) {
    if (!feet.length) return;
    const gH = o.groundH, T = A.T, q = {}, gr = (x, z, y) => { const h = gH(x, z); return Number.isFinite(h) ? h : y; }, temp = STAND_TEMP.has(def.id), up = [0, 1, 0];
    const PLU = kq(KIT.plain, 0, 1, 0.5, 0.5), clear = (x, z, r) => circles.push([x, z, r]);
    // a box (no bottom) at (x, y0, z): w along (tx, tz), d across, h high; plain faces, or a band on its front (+across: (-tz, tx))
    const boxA = (x, y0, z, w, d, h, tx, tz, col, front) => {
      const gb = sbAt(x, z), ax = tx * w / 2, az = tz * w / 2, bx = -tz * d / 2, bz = tx * d / 2, c = (sa, sb, y) => [x + ax * sa + bx * sb, y, z + az * sa + bz * sb], y1 = y0 + h;
      gb.quad(c(-1, -1, y1), c(1, -1, y1), c(1, 1, y1), c(-1, 1, y1), up, col, null, PLU);
      gb.quad(c(-1, 1, y0), c(1, 1, y0), c(1, 1, y1), c(-1, 1, y1), [-tz, 0, tx], col, front ? front.seat : null, front ? kq(front.band, front.u0 || 0, front.u1 || 1, 1, 0) : PLU);
      gb.quad(c(1, -1, y0), c(-1, -1, y0), c(-1, -1, y1), c(1, -1, y1), [tz, 0, -tx], col, null, PLU);
      gb.quad(c(1, 1, y0), c(1, -1, y0), c(1, -1, y1), c(1, 1, y1), [tx, 0, tz], col, null, PLU);
      gb.quad(c(-1, -1, y0), c(-1, 1, y0), c(-1, 1, y1), c(-1, -1, y1), [-tx, 0, -tz], col, null, PLU);
    };
    // a kiosk's lit sign round its top (h high): white, front and back its picture in the middle in its colour (the kit's picto: a drink, an
    // ice cream, a hot dog, a burger)
    const signBox = (x, y0, z, w, d, h, tx, tz, col, kind) => {
      const gb = sbAt(x, z), ax = tx / 2, az = tz / 2, bx = -tz * d / 2, bz = tx * d / 2, c = (sa, sb, y) => [x + ax * sa + bx * sb, y, z + az * sa + bz * sb], y1 = y0 + h, pw = h * 2, U = kq(KIT.picto, kind / 4 + 0.004, (kind + 1) / 4 - 0.004, 0.97, 0.03);
      for (const sb of [1, -1]) { const o = [-tz * sb, 0, tx * sb], L = -w * sb, R = w * sb, m0 = -pw * sb, m1 = pw * sb;   // (from its left to its right, as seen)
        for (const [p0, p1, uv] of [[L, m0, null], [m0, m1, U], [m1, R, null]]) gb.quad(c(p0, sb, y0), c(p1, sb, y0), c(p1, sb, y1), c(p0, sb, y1), o, uv ? col : AR_COL.white, uv ? AR_COL.white : null, uv || PLU); }
      gb.quad(c(w, 1, y0), c(w, -1, y0), c(w, -1, y1), c(w, 1, y1), [tx, 0, tz], AR_COL.white, null, PLU); gb.quad(c(-w, -1, y0), c(-w, 1, y0), c(-w, 1, y1), c(-w, -1, y1), [-tx, 0, -tz], AR_COL.white, null, PLU);
    };
    // the stand's letter on a sign facing (nx, nz), its bottom middle at (x, y0, z), w wide and h high (its viewer's right from its facing: never
    // mirrored, whichever way the stand runs)
    const glyph = (x, y0, z, nx, nz, w, h, k) => { const rx = nz * w / 2, rz = -nx * w / 2, u0 = (k % 4) / 4, f0 = k >= 4 ? 0.5 : 0;
      sbAt(x, z).quad([x - rx, y0, z - rz], [x + rx, y0, z + rz], [x + rx, y0 + h, z + rz], [x - rx, y0 + h, z - rz], [nx, 0, nz], AR_COL.sign, AR_COL.white, kq(KIT.glyph, u0 + 0.004, u0 + 0.246, f0 + 0.49, f0 + 0.01)); };
    // a prop of the people's (L) baked into the stands' meshes, standing on the ground at (x, z) turned by yaw
    const D = { P: [], N: [], C: [] }, bakeAt = (g, x, z, yaw) => {
      g.position.set(x, gr(x, z, 0), z); g.rotation.y = yaw; D.P.length = D.N.length = D.C.length = 0; bake(g, null, D, null);
      const gb = sbAt(x, z); for (let t = 0; t < D.P.length; t += 9) gb.tri([D.P[t], D.P[t + 1], D.P[t + 2]], [D.P[t + 3], D.P[t + 4], D.P[t + 5]], [D.P[t + 6], D.P[t + 7], D.P[t + 8]], [D.C[t], D.C[t + 1], D.C[t + 2]], NOSEAT, PLU[0], PLU[1], PLU[2], [D.N[t], D.N[t + 1], D.N[t + 2]]);
    };
    // a paved way on the ground along a line (2D points), w wide on it (its slabs along it), the trees on it cleared
    const way = (L, w, col) => {
      if (L.length < 2) return; const P = [L[0]];
      for (let k = 1; k < L.length; k++) { const a = L[k - 1], b = L[k], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2.5)); for (let j = 1; j <= n; j++) P.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); }
      let prev = null, d = 0;
      for (let k = 0; k < P.length; k++) {
        const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / tl * w / 2, nz = (b[0] - a[0]) / tl * w / 2, p = P[k];
        const l = [p[0] + nx, 0, p[1] + nz], r = [p[0] - nx, 0, p[1] - nz]; l[1] = gr(l[0], l[2], 0) + 0.07; r[1] = gr(r[0], r[2], 0) + 0.07;
        if (k) d += Math.hypot(p[0] - P[k - 1][0], p[1] - P[k - 1][1]);
        if (prev) sbAt(p[0], p[1]).quad(prev.l, prev.r, r, l, up, col, null, [[prev.d / 4, kv(KIT.pave, 0)], [prev.d / 4, kv(KIT.pave, 1)], [d / 4, kv(KIT.pave, 1)], [d / 4, kv(KIT.pave, 0)]]);
        prev = { l, r, d }; if (k % 2 === 0) clear(p[0], p[1], w / 2 + 1.5);
      }
    };
    // the stands' letters by their order along the track from the start
    for (const f of feet) { let cx = 0, cz = 0; for (const e of f.fr3) { cx += e.p[0]; cz += e.p[2]; } f.cx = cx / f.fr3.length; f.cz = cz / f.fr3.length; T.query(f.cx, f.cz, -1, q); f.s = ((q.s - (T.startS || 0)) % T.len + T.len) % T.len; }
    feet.slice().sort((a, b) => a.s - b.s).forEach((f, k) => { f.letter = k % 8; });
    const rc = new THREE.Raycaster();
    // what the world has standing (its buildings, walls, fences, water: not the trees, not the people), its boxes in the world: a kiosk, the
    // toilets, the gate only where none of it is over the ground (rays down at the middle and four corners)
    const solids = [], DOWN = new THREE.Vector3(0, -1, 0); o.root.updateMatrixWorld(true);
    const onGround = (m) => { for (let p = m; p; p = p.parent) if (p === o.ground) return true; return false; };   // (the ground's own pieces: its mesh may stand a little over groundH)
    o.root.traverse(m => { if (!m.isMesh || m.isInstancedMesh || !m.visible || (m.userData && m.userData.lj) || !m.geometry || !m.geometry.attributes.position || (o.ground && onGround(m))) return; const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox.clone().applyMatrix4(m.matrixWorld); if (b.max.x - b.min.x > 300 && b.max.z - b.min.z > 300) return; solids.push({ m, b }); });   // (not the ground's big pieces: under the rays' reach, and many triangles)
    let near2 = [];
    const free = (x, z, r) => { for (const [dx, dz] of [[0, 0], [r, r], [r, -r], [-r, r], [-r, -r]]) { const g0 = gr(x + dx, z + dz, 0); rc.set(new THREE.Vector3(x + dx, g0 + 30, z + dz), DOWN); rc.far = 29.65; if (rc.intersectObjects(near2, false).length) return false; } return true; };
    for (const f of feet) {
      if (f.fr3.length < 2 || f.bk3.length < 2) continue;
      near2 = solids.filter(({ b }) => !(b.max.x < f.bb[0] - 40 || b.min.x > f.bb[1] + 40 || b.max.z < f.bb[2] - 40 || b.min.z > f.bb[3] + 40)).map(e => e.m);
      let nx = 0, nz = 0; for (const e of f.fr3) { nx += e.f[0]; nz += e.f[1]; } const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;   // (towards the road)
      const tx = f.tx, tz = f.tz, B = f.bk3, Fr = f.fr3, len = Math.hypot(Fr[Fr.length - 1].p[0] - Fr[0].p[0], Fr[Fr.length - 1].p[2] - Fr[0].p[2]);
      const near = ms.filter(m => { const bb = m.geometry.boundingBox || (m.geometry.computeBoundingBox(), m.geometry.boundingBox); return !(bb.max.x < f.bb[0] - 10 || bb.min.x > f.bb[1] + 10 || bb.max.z < f.bb[2] - 10 || bb.min.z > f.bb[3] + 10); });
      // the back wall's outer face (a ray from 6 m behind the back row towards the road, under the top tread): how far behind the back row it is
      // (a temporary stand: none (no wall of its own), no rays)
      const offs = []; let hi = 0; if (!temp) for (let k = 0; k < Math.min(8, B.length); k++) { const e = B[Math.round(k * (B.length - 1) / Math.max(1, Math.min(8, B.length) - 1))], g0 = gr(e.p[0], e.p[2], e.p[1] - 3);
        rc.set(new THREE.Vector3(e.p[0] - e.f[0] * 6, Math.min(e.p[1] - 0.4, g0 + 1.6), e.p[2] - e.f[1] * 6), new THREE.Vector3(e.f[0], 0, e.f[1])); rc.far = 6.6;
        const h = rc.intersectObjects(near, false)[0]; if (h) offs.push(6 - h.distance);
        if (h && e.p[1] - 1.2 > g0 + 2.6) { rc.set(new THREE.Vector3(e.p[0] - e.f[0] * 6, e.p[1] - 1.2, e.p[2] - e.f[1] * 6), new THREE.Vector3(e.f[0], 0, e.f[1])); const h2 = rc.intersectObjects(near, false)[0]; if (h2 && Math.abs(h2.distance - h.distance) < 0.3) hi++; } }   // (the same face higher up: a wall that stands)
      offs.sort((a, b) => a - b); (f.at || (f.at = {})).wall = [offs.length, hi, Math.min(8, B.length)]; const wall = !temp && offs.length >= Math.min(8, B.length) * 0.6 ? Math.max(0, offs[offs.length >> 1]) : null, wo = (wall != null ? wall : 0.3) + 0.05, clad = wall != null && hi >= 2 && hi >= offs.length * 0.6;
      // its floodlights, lit in the evening and at night (js/render-vecer.js): under a roof's front edge (below), where it has none on masts along its back
      const lampAt = (x, y, z, ax, az, roof) => (o.standLamps || (o.standLamps = [])).push(x, y, z, ax, az, roof);
      for (const e of B) lampAt(e.p[0] - e.f[0] * wo, e.p[1], e.p[2] - e.f[1] * wo, nx, nz, 0);
      // the concourse: along the back (the wall's face out to AR.apron), on past the ends; the ends' strips from the front to the back
      // (a small stand, a street circuit's few rows of 20 m: its front, its ends' signs and its roof only, not a concourse of its own)
      let blen = 0; for (let k = 1; k < B.length; k++) if (!B[k].gap) blen += Math.hypot(B[k].p[0] - B[k - 1].p[0], B[k].p[2] - B[k - 1].p[2]);   // (not across a gap between its pieces)
      const big = blen >= 24 && f.nrows >= 4, back = B.map(e => [e.p[0] - e.f[0] * (wo + AR.apron / 2), e.p[2] - e.f[1] * (wo + AR.apron / 2)]), b0 = back[0], b1 = back[back.length - 1];
      if (big) { let piece = [b0[0] - tx * 5, b0[1] - tz * 5]; piece = [piece]; for (let k = 0; k < back.length; k++) { if (k && B[k].gap) { way(piece, AR.apron, AR_COL.pave); piece = []; } piece.push(back[k]); }
        piece.push([b1[0] + tx * 5, b1[1] + tz * 5]); way(piece, AR.apron, AR_COL.pave); }
      if (big) for (const [e, s] of [[B[0], -1], [B[B.length - 1], 1]]) {   // paths off its ends, out and away from the road (as far as they keep clear of it)
        const l = Math.hypot(e.f[0], e.f[1]) || 1, fx = e.f[0] / l, fz = e.f[1] / l, ox = (tx * s - fx) * 0.7071, oz = (tz * s - fz) * 0.7071, x0 = e.p[0] - fx * (wo + AR.apron / 2) + tx * s * 5, z0 = e.p[2] - fz * (wo + AR.apron / 2) + tz * s * 5, pts = [[x0, z0]];
        for (let d = 2; d <= 22; d += 2) { const x = x0 + ox * d, z = z0 + oz * d; if (A.clearance(x, z) < 5) break; pts.push([x, z]); }
        if (pts.length > 4) way(pts, AR.path, AR_COL.pave);
      }
      if (big) for (const [e0, e1, s] of [[Fr[0], B[0], -1], [Fr[Fr.length - 1], B[B.length - 1], 1]]) {   // (from in front of it, not past the barrier: at most a metre off it)
        let d = 1.5; while (d > -1 && A.clearance(e0.p[0] + tx * s * 2.6 + e0.f[0] * d, e0.p[2] + tz * s * 2.6 + e0.f[1] * d) < 1.0) d -= 0.5;
        way([[e0.p[0] + tx * s * 2.6 + e0.f[0] * d, e0.p[2] + tz * s * 2.6 + e0.f[1] * d], [e1.p[0] + tx * s * 2.6 - e1.f[0] * wo, e1.p[2] + tz * s * 2.6 - e1.f[1] * wo]], 4, AR_COL.pave); }
      // the strip in front: paved from the stand's front to a metre off the barrier (the vendors' walkway)
      { let prev = null, d = 0;
        for (let k = 0; k < Fr.length; k++) {
          const e = Fr[k]; let gap = 0; for (let s = 0.5; s <= 14; s += 0.5) { if (A.clearance(e.p[0] + e.f[0] * s, e.p[2] + e.f[1] * s) < 1.0) break; gap = s; }
          if (k) d += Math.hypot(e.p[0] - Fr[k - 1].p[0], e.p[2] - Fr[k - 1].p[2]);
          const cur = gap >= 1.0 ? { i: [e.p[0] + e.f[0] * 0.1, 0, e.p[2] + e.f[1] * 0.1], o: [e.p[0] + e.f[0] * gap, 0, e.p[2] + e.f[1] * gap], d } : null;
          if (cur) { cur.i[1] = gr(cur.i[0], cur.i[2], 0) + 0.07; cur.o[1] = gr(cur.o[0], cur.o[2], 0) + 0.07; clear((cur.i[0] + cur.o[0]) / 2, (cur.i[2] + cur.o[2]) / 2, gap / 2 + 1.5); }
          if (cur && prev && !e.gap) sbAt(e.p[0], e.p[2]).quad(prev.i, cur.i, cur.o, prev.o, up, AR_COL.pave, null, [[prev.d / 4, kv(KIT.pave, 0)], [cur.d / 4, kv(KIT.pave, 0)], [cur.d / 4, kv(KIT.pave, 1)], [prev.d / 4, kv(KIT.pave, 1)]]);
          if (k && !e.gap) { const a = Fr[k - 1], l = Math.hypot(e.p[0] - a.p[0], e.p[2] - a.p[2]);   // (the trees in front of it gone: every 4 m along its front, to the barrier)
            for (let t = 2; t < l; t += 4) { const w = t / l, x = a.p[0] + (e.p[0] - a.p[0]) * w, z = a.p[2] + (e.p[2] - a.p[2]) * w, fx = a.f[0] + (e.f[0] - a.f[0]) * w, fz = a.f[1] + (e.f[1] - a.f[1]) * w;
              let g2 = 0; for (let q2 = 1; q2 <= 14; q2 += 1) { if (A.clearance(x + fx * q2, z + fz * q2) < 0.5) break; g2 = q2; } if (g2 >= 1) clear(x + fx * g2 / 2, z + fz * g2 / 2, g2 / 2 + 2.5); } }
          prev = cur;
        } }
      // the walkway in front (the vendors', standsOf): 0.9 m off the first row's front, its longest stretch clear of the fence (at most 60 m)
      { const pts = [];
        for (let k = 1; k < Fr.length; k++) { const a = Fr[k - 1], b = Fr[k], l = Math.hypot(b.p[0] - a.p[0], b.p[2] - a.p[2]), n = Math.max(1, Math.ceil(l / 2)); if (b.gap) { pts.push(null); continue; }
          for (let j = k === 1 ? 0 : 1; j <= n; j++) { const w = j / n, fx = a.f[0] + (b.f[0] - a.f[0]) * w, fz = a.f[1] + (b.f[1] - a.f[1]) * w, x = a.p[0] + (b.p[0] - a.p[0]) * w + fx * 0.9, z = a.p[2] + (b.p[2] - a.p[2]) * w + fz * 0.9, g0 = gH(x, z);
            pts.push(Number.isFinite(g0) && A.clearance(x, z) >= 1.0 && Math.abs(g0 - (a.p[1] + (b.p[1] - a.p[1]) * w)) < 0.8 ? [x, g0 + 0.07, z] : null); } }
        let best = [], cur = []; for (const p of pts.concat([null])) { if (p) cur.push(p); else { if (cur.length > best.length) best = cur; cur = []; } }
        if (best.length >= 6) { const m = Math.min(best.length, 31), k0 = (best.length - m) >> 1; f.gang = best.slice(k0, k0 + m); } }
      // along the concourse: the doors in the wall, kiosks (facing the wall), bins and lamp posts on its outer edge, toilets at the far end
      const along = (dist) => {   // a point on the back line at a distance from its start (not across a gap), its outward direction, the wall's own direction there (tx, tz: a curved stand's)
        let acc = 0; for (let k = 1; k < B.length; k++) { const a = B[k - 1], b = B[k]; if (b.gap) continue; const l = Math.hypot(b.p[0] - a.p[0], b.p[2] - a.p[2]); if (acc + l >= dist || k === B.length - 1) { const w = Math.min(1, Math.max(0, (dist - acc) / (l || 1))), lt = l || 1;
          return { x: a.p[0] + (b.p[0] - a.p[0]) * w, y: a.p[1] + (b.p[1] - a.p[1]) * w, z: a.p[2] + (b.p[2] - a.p[2]) * w, fx: a.f[0] + (b.f[0] - a.f[0]) * w, fz: a.f[1] + (b.f[1] - a.f[1]) * w, tx: l > 0.05 ? (b.p[0] - a.p[0]) / lt : tx, tz: l > 0.05 ? (b.p[2] - a.p[2]) / lt : tz, joint: !!b.joint }; } acc += l; }
        const e = B[0]; return { x: e.p[0], y: e.p[1], z: e.p[2], fx: e.f[0], fz: e.f[1], tx, tz }; };
      if (clad && big) {   // the back wall clad in profiled sheets (a light metal; a period stand's in boards) up to under the last row, along its top a band in the stand's colour
        let d = 0;
        for (let k = 1; k < B.length; k++) {
          const a = B[k - 1], b = B[k], l = Math.hypot(b.p[0] - a.p[0], b.p[2] - a.p[2]); if (l < 0.05 || b.gap || b.joint) continue;
          const W = (e) => { const fl = Math.hypot(e.f[0], e.f[1]) || 1; return [e.p[0] - e.f[0] / fl * (wall + 0.02), e.p[2] - e.f[1] / fl * (wall + 0.02)]; };
          const wa = W(a), wb = W(b), ga = gr(wa[0], wa[1], a.p[1] - 3), gb2 = gr(wb[0], wb[1], b.p[1] - 3), ta = a.p[1] - 0.5, tb = b.p[1] - 0.5;
          if (ta - ga > 2.5 && tb - gb2 > 2.5) {
            const out = [-(a.f[0] + b.f[0]) / 2, 0, -(a.f[1] + b.f[1]) / 2], g = sbAt(wa[0], wa[1]);
            g.quad([wa[0], ga, wa[1]], [wb[0], gb2, wb[1]], [wb[0], tb - 0.8, wb[1]], [wa[0], ta - 0.8, wa[1]], out, f.bench === 'wood' ? AR_COL.boards : AR_COL.clad, null, [[d / 8, kv(KIT.clad, 1)], [(d + l) / 8, kv(KIT.clad, 1)], [(d + l) / 8, kv(KIT.clad, 0)], [d / 8, kv(KIT.clad, 0)]]);
            g.quad([wa[0], ta - 0.8, wa[1]], [wb[0], tb - 0.8, wb[1]], [wb[0], tb, wb[1]], [wa[0], ta, wa[1]], out, f.col, null, kq(KIT.riser, d / 4, (d + l) / 4, 1, 0));
          }
          d += l;
        }
      }
      if (big && wall != null) for (let d0 = 8; d0 < blen - 6; d0 += AR.door) {   // the entrances: a dark way in, its frame, 2.8 m high, on the wall's face; the stand's letter over it
        const p = along(d0); if (p.joint) continue;   // (no door in the step between two pieces)
        const l = Math.hypot(p.fx, p.fz) || 1, fx = p.fx / l, fz = p.fz / l, w0 = wall + 0.03, g0 = gr(p.x - fx * w0, p.z - fz * w0, p.y - 3), at = (s, y) => [p.x - fx * w0 + p.tx * s, y, p.z - fz * w0 + p.tz * s];
        sbAt(p.x, p.z).quad(at(-2, g0), at(2, g0), at(2, g0 + 2.8), at(-2, g0 + 2.8), [-fx, 0, -fz], AR_COL.white, AR_COL.white, kq(KIT.door, 0, 1, 1, 0.05));
        if (clad && p.y - 1.4 > g0 + 4.4) glyph(p.x - fx * (w0 + 0.01), g0 + 3.1, p.z - fz * (w0 + 0.01), -fx, -fz, 1.2, 1.2, f.letter);
      }
      if (big) for (let d1 = Math.min(14, blen / 2), k = 0; d1 < blen - 4; d1 += AR.kiosk) {   // the kiosks: drinks, ice cream, hot dogs, burgers in turn (where there is room)
        const o0 = wo + AR.apron - 1.2, d0 = [0, 4, -4, 8, -8].map(e => d1 + e).find(d => d > 2 && d < blen - 2 && (() => { const p = along(d), l = Math.hypot(p.fx, p.fz) || 1; return free(p.x - p.fx / l * o0, p.z - p.fz / l * o0, 1.8); })()); if (d0 == null) continue;
        const p = along(d0), l = Math.hypot(p.fx, p.fz) || 1, fx = p.fx / l, fz = p.fz / l, x = p.x - fx * o0, z = p.z - fz * o0, g0 = gr(x, z, p.y - 3), kk = k++, col = AR_COL.kiosk[(f.letter + kk) % 4];
        boxA(x, g0, z, 2.6, 2.2, 2.5, fz, -fx, col, { band: KIT.shutter, seat: AR_COL.warm, u0: 0, u1: 0.5 });
        signBox(x, g0 + 2.5, z, 2.6, 2.2, 0.55, fz, -fx, col, (f.letter * 3 + kk) % 4); boxA(x, g0 + 3.05, z, 3.0, 2.6, 0.14, fz, -fx, AR_COL.dark);
        const ax = fz * 1.35, az = -fx * 1.35, e0 = [x + fx * 1.1, g0 + 2.5, z + fz * 1.1], e1 = [x + fx * 2.0, g0 + 2.15, z + fz * 2.0];   // (its awning over the window)
        sbAt(x, z).quad([e0[0] - ax, e0[1], e0[2] - az], [e0[0] + ax, e0[1], e0[2] + az], [e1[0] + ax, e1[1], e1[2] + az], [e1[0] - ax, e1[1], e1[2] - az], [fx * 0.4, 1, fz * 0.4], AR_COL.white, col, kq(KIT.awning, 0, 0.66, 0, 1));
        clear(x, z, 3); (f.at || (f.at = {})).kiosk = f.at.kiosk || [x, g0, z, fx, fz];
      }
      if (big) for (let d0 = AR.bin / 2; d0 < blen; d0 += AR.bin) { const p = along(d0), l = Math.hypot(p.fx, p.fz) || 1, o0 = wo + AR.apron - 0.4; bakeAt(L.bin(), p.x - p.fx / l * o0, p.z - p.fz / l * o0, Math.atan2(p.fx, p.fz)); }
      if (big) for (let d0 = 4; d0 < blen + 2; d0 += AR.lamp) {   // the lamp posts: a pole, its head over the concourse
        const p = along(Math.min(d0, blen)), l = Math.hypot(p.fx, p.fz) || 1, fx = p.fx / l, fz = p.fz / l, o0 = wo + AR.apron + 0.3, x = p.x - fx * o0, z = p.z - fz * o0, g0 = gr(x, z, p.y - 3);
        sbAt(x, z).post([x, g0, z], 6.2, 0.14, [fx, fz], AR_COL.lamp); boxA(x + fx * 0.45, g0 + 6.0, z + fz * 0.45, 0.35, 1.1, 0.18, fz, -fx, AR_COL.lamp);
      }
      if (big) { const o0 = wo + AR.apron + 1.0, dT = [6, 10, 14, 18].map(e => blen - e).find(d => d > 2 && (() => { const p = along(d), l = Math.hypot(p.fx, p.fz) || 1; return free(p.x - p.fx / l * o0, p.z - p.fz / l * o0, 2.4); })());   // the toilets: a row of three, facing the concourse
        const p = along(dT != null ? dT : blen - 6), l = Math.hypot(p.fx, p.fz) || 1, fx = p.fx / l, fz = p.fz / l;
        if (dT != null) { for (let k = -1; k <= 1; k++) bakeAt(L.portaloo(0x2f63c9), p.x - fx * o0 + p.tx * k * 1.35, p.z - fz * o0 + p.tz * k * 1.35, Math.atan2(fx, fz)); clear(p.x - fx * o0, p.z - fz * o0, 3.5); } }
      // the path off the middle of the concourse to its gate, as long as it keeps clear of the road
      if (big) { const p = along(blen / 2), l = Math.hypot(p.fx, p.fz) || 1, fx = p.fx / l, fz = p.fz / l, s0 = wo + AR.apron, pts = [[p.x - fx * s0, p.z - fz * s0]]; let s = s0;
        while (s < s0 + AR.gate) { s += 2; const x = p.x - fx * s, z = p.z - fz * s; if (A.clearance(x, z) < 4 || !free(x, z, 2.6)) break; pts.push([x, z]); }
        if (pts.length > 5) {
          way(pts, AR.path, AR_COL.pave);
          const [gx, gz] = pts[pts.length - 1], g0 = gr(gx, gz, p.y - 3), ax = -fz, az = fx;   // (across the path)
          for (const sd of [-1, 1]) boxA(gx + ax * sd * 2.3, g0, gz + az * sd * 2.3, 0.34, 0.34, 3.4, ax, az, AR_COL.sign);   // its pillars, the beam with the letter
          boxA(gx, g0 + 3.4, gz, 4.94, 0.36, 0.62, ax, az, AR_COL.sign);
          glyph(gx - fx * 0.19, g0 + 3.36, gz - fz * 0.19, -fx, -fz, 1.1, 1.1, f.letter);   // (its face to those coming along the path)
          for (let k2 = -1; k2 <= 1; k2++) boxA(gx + ax * k2 * 1.2, g0, gz + az * k2 * 1.2, 0.25, 0.9, 1.0, ax, az, AR_COL.steel);   // the turnstiles
          const bxp = gx + ax * 4.2, bzp = gz + az * 4.2; boxA(bxp, g0, bzp, 1.8, 1.6, 2.4, -fz, fx, AR_COL.booth, { band: KIT.shutter, seat: AR_COL.warm, u0: 0, u1: 0.35 });   // the ticket booth, its roof
          boxA(bxp, g0 + 2.4, bzp, 2.2, 2.0, 0.12, -fz, fx, AR_COL.dark);
          clear(gx, gz, 6); (f.at || (f.at = {})).gate = [gx, g0, gz, fx, fz];
        } }
      // the stairs up at its back corners, along the wall (where it has one and is tall: its own direction at the corner): from the ground at
      // the corner up along the wall to a landing 2.5 m under the top row, a door into the stand there, the flight on a stringer and posts, a
      // railing over it
      if (big && wall != null) for (const [k0, s] of [[0, 1], [B.length - 1, -1]]) {
        const e = B[k0], l = Math.hypot(e.f[0], e.f[1]) || 1, fx = e.f[0] / l, fz = e.f[1] / l, c0 = [e.p[0] - fx * (wall + 0.05), e.p[2] - fz * (wall + 0.05)], g0 = gr(c0[0], c0[1], e.p[1] - 3), h = e.p[1] - 2.5 - g0;
        if (h < 2.4) continue;
        const n = Math.ceil(h / 0.18), run = n * 0.29, LD = 1.6; if (run + LD > blen * 0.45) continue;
        const e2 = B[k0 + s], tl = e2 ? Math.hypot(e2.p[0] - e.p[0], e2.p[2] - e.p[2]) : 0, dx = tl > 0.05 ? (e2.p[0] - e.p[0]) / tl : tx * s, dz = tl > 0.05 ? (e2.p[2] - e.p[2]) / tl : tz * s, w = 1.4, P0 = (a, o2, y) => [c0[0] + dx * a - fx * o2, y, c0[1] + dz * a - fz * o2];   // (a: along the wall from the corner inwards; o2: out from the wall)
        const gb = sbAt(c0[0], c0[1]), R = kq(KIT.riser, 0, 0.35, 1, 0), TA = kq(KIT.aisle, 0, 0.35, 0, 0.98);
        if (tier > 0) for (let i = 0; i < n; i++) { const a0 = i * 0.29, a1 = a0 + 0.29, y0 = g0 + i * (h / n), y1 = y0 + h / n;
            gb.quad(P0(a0, 0, y0), P0(a0, w, y0), P0(a0, w, y1), P0(a0, 0, y1), [-dx, 0, -dz], ST_CONC, null, R);
            gb.quad(P0(a0, 0, y1), P0(a0, w, y1), P0(a1, w, y1), P0(a1, 0, y1), up, ST_CONC, null, TA); }
        else gb.quad(P0(0, 0, g0), P0(0, w, g0), P0(run, w, g0 + h), P0(run, 0, g0 + h), [-dx, 1, -dz], ST_CONC, null, TA);
        // its outer side: a stringer under the flight and the landing (0.35 m deep), posts down to the ground every 3 m and under the landing
        gb.quad(P0(0, w + 0.01, g0 - 0.35), P0(run, w + 0.01, g0 + h - 0.35), P0(run, w + 0.01, g0 + h + 0.02), P0(0, w + 0.01, g0 + 0.02), [-fx, 0, -fz], ST_CONC, null, kq(KIT.riser, 0, run / 2, 1, 0));
        gb.quad(P0(run, w + 0.01, g0 + h - 0.35), P0(run + LD, w + 0.01, g0 + h - 0.35), P0(run + LD, w + 0.01, g0 + h + 0.02), P0(run, w + 0.01, g0 + h + 0.02), [-fx, 0, -fz], ST_CONC, null, kq(KIT.riser, 0, LD / 2, 1, 0));
        for (const a of [...Array(Math.max(0, Math.floor((run - 1) / 3))).keys()].map(i => 2.5 + i * 3).concat([run + LD - 0.15])) { const y = g0 + Math.min(1, a / run) * h - 0.35; if (y - g0 < 0.5) continue;
          const pp = P0(a, w - 0.12, 0); boxA(pp[0], g0, pp[2], 0.2, 0.2, y - g0, dx, dz, ST_CONC); }
        gb.quad(P0(run, 0, g0 + h), P0(run, w, g0 + h), P0(run + LD, w, g0 + h), P0(run + LD, 0, g0 + h), up, ST_CONC, null, kq(KIT.tread, 0, 0.35, 0, 0.98));   // (the landing)
        gb.quad(P0(run + LD, 0, g0), P0(run + LD, w, g0), P0(run + LD, w, g0 + h), P0(run + LD, 0, g0 + h), [dx, 0, dz], ST_CONC, null, R);
        if (tier > 0) { gb.bar(P0(0, w, g0 + 1.0), P0(run, w, g0 + h + 1.0), 0.06, 0.06, ST_RAIL); gb.bar(P0(run, w, g0 + h + 1.0), P0(run + LD, w, g0 + h + 1.0), 0.06, 0.06, ST_RAIL); }
        gb.quad(P0(run + 0.2, -0.03, g0 + h), P0(run + LD - 0.2, -0.03, g0 + h), P0(run + LD - 0.2, -0.03, g0 + h + 2.3), P0(run + 0.2, -0.03, g0 + h + 2.3), [-fx, 0, -fz], AR_COL.white, AR_COL.white, kq(KIT.door, 0.33, 0.67, 1, 0.05));   // (its door)
        clear(c0[0] + dx * run / 2 - fx * 1, c0[1] + dz * run / 2 - fz * 1, run / 2 + 2); (f.at || (f.at = {})).stairs = [c0[0], g0, c0[1], fx, fz, dx, dz];
      }
      // its letter on a sign at either end, over the end wall near the front (seen by the cars coming)
      for (const [e, s] of [[Fr[0], -1], [Fr[Fr.length - 1], 1]]) {
        if (feet.some(g => g !== f && g.fr3.length > 1 && [g.fr3[0], g.fr3[g.fr3.length - 1]].some(q => Math.hypot(q.p[0] - e.p[0], q.p[2] - e.p[2]) < 5))) continue;   // (a stand in pieces: no sign where two meet)
        const l = Math.hypot(e.f[0], e.f[1]) || 1, fx = e.f[0] / l, fz = e.f[1] / l, cx = e.p[0] - fx * 2.2 + tx * s * 0.15, cz = e.p[2] - fz * 2.2 + tz * s * 0.15, y0 = e.p[1] + 2.4;
        const at = (a, y) => [cx - fx * a, y, cz - fz * a], gb = sbAt(cx, cz);
        glyph(cx, y0, cz, tx * s, tz * s, 1.8, 1.8, f.letter);
        gb.quad(at(0.9, y0), at(-0.9, y0), at(-0.9, y0 + 1.8), at(0.9, y0 + 1.8), [-tx * s, 0, -tz * s], AR_COL.sign, null, PLU);
        gb.post([cx, e.p[1] + 0.9, cz], 1.55, 0.12, [tx * s, tz * s], AR_COL.lamp); }
      // the roof: its front edge a fascia with floodlights under it; trusses over it every 10 m (from Srednja)
      for (const RV of f.rvs || (f.rv ? [f.rv] : [])) if (RV.length > 9) {   // (a stand in pieces: each piece's roof on its own)
        const bins = new Map(); for (const v of RV) { const t = v[0] * tx + v[2] * tz, nn = v[0] * nx + v[2] * nz, b = Math.round(t / 2); let e = bins.get(b); if (!e) bins.set(b, e = { t, fr: v, fn: nn, bk: v, bn: nn });
          if (nn > e.fn) { e.fr = v; e.fn = nn; } if (nn < e.bn) { e.bk = v; e.bn = nn; } }
        const L2 = [...bins.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1]);
        let d = 0;
        for (let k = 1; k < L2.length; k++) { const a = L2[k - 1].fr, b = L2[k].fr, l = Math.hypot(b[0] - a[0], b[2] - a[2]); if (l > 4 || l < 0.05) continue; d += l;
          const at = (p, y) => [p[0] + nx * 0.09, y, p[2] + nz * 0.09];
          sbAt(a[0], a[2]).quad(at(a, a[1] - 0.72), at(b, b[1] - 0.72), at(b, b[1] + 0.04), at(a, a[1] + 0.04), [nx, 0, nz], AR_COL.dark, AR_COL.warm, kq(KIT.fascia, (d - l) / 4, d / 4, 1, 0));
          lampAt(a[0] + nx * 0.3, a[1] - 0.55, a[2] + nz * 0.3, nx, nz, 1); }
        if (tier > 0) for (let k = 2; k < L2.length - 1; k += 5) { const e = L2[k], pf = e.fr, pb = e.bk; if (e.fn - e.bn < 3) continue;
          const gb = sbAt(pf[0], pf[2]), lift = (p, h) => [p[0], p[1] + h, p[2]], mixP = (w, h0, h1) => [pb[0] + (pf[0] - pb[0]) * w, pb[1] + (pf[1] - pb[1]) * w + h0 + (h1 - h0) * w, pb[2] + (pf[2] - pb[2]) * w];
          gb.bar(lift(pb, 1.7), lift(pf, 0.28), 0.14, 0.12, AR_COL.white); gb.bar(lift(pb, 0.12), lift(pf, 0.12), 0.12, 0.1, AR_COL.white);
          for (const w of [0, 1 / 3, 2 / 3]) { const lo = mixP(w, 0.12, 0.12), hi = mixP(w, 1.7, 0.28); gb.post(lo, hi[1] - lo[1], 0.1, [nx, nz], AR_COL.white); }   // (its uprights: posts, faced to the road)
          for (const [w0, w1] of [[0, 1 / 3], [1 / 3, 2 / 3], [2 / 3, 1]]) gb.bar(mixP(w0, 1.7, 0.28), mixP(w1, 0.12, 0.12), 0.08, 0.08, AR_COL.white); }
      }
      // under the roof (seen from the road): a beam from its back to its front every 10 m, deep at the back, thin at the front (where the
      // underside cuts the plane across the stand there: any roof's own triangles)
      if (tier > 0) for (const R of f.rbs || (f.rb ? [f.rb] : [])) if (R.length >= 3) {
        let t0 = 1e9, t1 = -1e9; for (const v of R) { const t = v[0] * tx + v[2] * tz; t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
        for (let tk = t0 + 3; tk < t1 - 1.5; tk += 10) {
          let lo = null, hi2 = null;
          for (let i = 0; i + 2 < R.length; i += 3) for (const [a, b] of [[R[i], R[i + 1]], [R[i + 1], R[i + 2]], [R[i + 2], R[i]]]) {
            const da = a[0] * tx + a[2] * tz - tk, db = b[0] * tx + b[2] * tz - tk; if ((da > 0) === (db > 0) || da === db) continue;
            const w = da / (da - db), p = [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w], n2 = p[0] * nx + p[2] * nz;
            if (!lo || n2 < lo.n) lo = { p, n: n2 }; if (!hi2 || n2 > hi2.n) hi2 = { p, n: n2 };
          }
          if (!lo || hi2.n - lo.n < 3) continue;
          const pb = [lo.p[0] + nx * 0.2, lo.p[1] - 0.01, lo.p[2] + nz * 0.2], pf = [hi2.p[0] - nx * 0.25, hi2.p[1] - 0.01, hi2.p[2] - nz * 0.25];
          sbAt(pf[0], pf[2]).beam(pb, pf, 0.24, Math.min(0.9, (hi2.n - lo.n) * 0.07), 0.2, AR_COL.white);
        }
      }
      // the front: a handrail a metre over the first row's tread, on its front edge, an upright every 2.5 m (from Srednja)
      if (tier > 0) { const rcol = f.bench === 'wood' ? DECK_COL.wood : ST_RAIL;
        for (let k = 1; k < Fr.length; k++) {
          const a = Fr[k - 1], b = Fr[k], l = Math.hypot(b.p[0] - a.p[0], b.p[2] - a.p[2]); if (l < 0.05 || b.gap || b.joint) continue;
          const at = (e, y) => [e.p[0] + e.f[0] * 0.06, y, e.p[2] + e.f[1] * 0.06], A0 = at(a, a.y2 + 1.0), B0 = at(b, b.y2 + 1.0), g = sbAt(A0[0], A0[2]), n = Math.max(1, Math.round(l / 2.5));
          g.bar(A0, B0, 0.06, 0.06, rcol);
          for (let j = k === 1 ? 0 : 1; j <= n; j++) { const w = j / n; g.post([A0[0] + (B0[0] - A0[0]) * w, a.y2 + (b.y2 - a.y2) * w, A0[2] + (B0[2] - A0[2]) * w], 0.98, 0.05, [a.f[0], a.f[1]], rcol); }
        } }
      // the fans' flags hung over the front handrail of a stand whose first row the road sees over its barrier (f.flags 'rail', standBuild;
      // another's over a higher row's seats), one in 12-24 m
      if (f.flags === 'rail') { const FLc = FLAGS[def.id] || {}, cols = (FLc.flag || [0xf2f2f2, 0xd8262a, 0xf2f2f2]).map(hexC), vert = !!(FLc.flag && FLc.flag.vert), team = FLc.team != null ? hexC(FLc.team) : null;
        let acc = 0, next = 6 + (f.letter * 5) % 9, kk = 0;
        for (let k = 1; k < Fr.length; k++) {
          const a = Fr[k - 1], b = Fr[k], l = Math.hypot(b.p[0] - a.p[0], b.p[2] - a.p[2]); if (l < 0.05 || b.gap || b.joint || !a.rail || !b.rail) { acc += l; if (next < acc) next = acc + 2; continue; }
          while (next < acc + l) {
            const w = (next - acc) / l, x = a.p[0] + (b.p[0] - a.p[0]) * w, z = a.p[2] + (b.p[2] - a.p[2]) * w, y2 = a.y2 + (b.y2 - a.y2) * w, fx = a.f[0], fz = a.f[1], h = ((kk * 7919 + f.letter * 131 + Math.round(x)) % 97 + 97) % 97 / 97, W2 = 0.65 + h * 0.25, top = y2 + (tier > 0 ? 0.98 : 0.6), H = 0.8 + h * 0.2;
            const c3 = team && h < 0.3 ? [team, [0.96, 0.96, 0.94], team] : cols, at = (s2, y) => [x + fx * 0.11 - fz * s2 * W2, y, z + fz * 0.11 + fx * s2 * W2], gb = sbAt(x, z), n3 = c3.length;   // (s2 +1: the left as seen from the road)
            for (let i = 0; i < n3; i++) { if (vert) gb.quad(at(1 - 2 * i / n3, top - H), at(1 - 2 * (i + 1) / n3, top - H), at(1 - 2 * (i + 1) / n3, top), at(1 - 2 * i / n3, top), [fx, 0, fz], c3[i], null, PLU);
              else gb.quad(at(-1, top - H * (i + 1) / n3), at(1, top - H * (i + 1) / n3), at(1, top - H * i / n3), at(-1, top - H * i / n3), [fx, 0, fz], c3[i], null, PLU); }
            if (!kk) (f.at || (f.at = {})).flag = [x, y2, z, fx, fz];   // (the first, for the tools)
            next += 12 + h * 12; kk++;
          }
          acc += l;
        }
        if (kk) f.at.flag.push(kk); }
      // a TV camera's platform hung under the roof's front edge in its middle (a big stand with a roof, from Srednja): its floor, a railing, its
      // hangers; its cameraman one of the stand's people (standsOf: f.at.tvcam)
      if (tier > 0 && big && f.rv && f.rv.length > 9) {
        let best = null; for (const v of f.rv) { const t = v[0] * tx + v[2] * tz, c0 = (f.cx * tx + f.cz * tz), nn = v[0] * nx + v[2] * nz; if (Math.abs(t - c0) > 6) continue; if (!best || nn > best.nn) best = { v, nn }; }
        if (best) { const v = best.v, y0 = v[1] - 2.9, X = v[0] + nx * 0.4, Z = v[2] + nz * 0.4;
          if (y0 > f.low + 2.6) {
            boxA(X, y0 - 0.12, Z, 2.2, 1.6, 0.12, tx, tz, ST_STEEL);   // (its floor)
            const gb = sbAt(X, Z), P2 = (a, b2, y) => [X + tx * a + nx * b2, y, Z + tz * a + nz * b2];
            gb.bar(P2(-1.1, 0.8, y0 + 1.0), P2(1.1, 0.8, y0 + 1.0), 0.05, 0.05, ST_RAIL); gb.bar(P2(-1.1, -0.8, y0 + 1.0), P2(-1.1, 0.8, y0 + 1.0), 0.05, 0.05, ST_RAIL); gb.bar(P2(1.1, -0.8, y0 + 1.0), P2(1.1, 0.8, y0 + 1.0), 0.05, 0.05, ST_RAIL);
            for (const [a, b2] of [[-1.1, 0.8], [1.1, 0.8], [-1.1, -0.8], [1.1, -0.8]]) gb.post(P2(a, b2, y0), b2 < 0 ? 2.85 : 1.0, 0.06, [nx, nz], ST_STEEL);   // (the railing's posts at its front; at its back its hangers up into the roof)
            (f.at || (f.at = {})).tvcam = [X, y0, Z, Math.atan2(nx, nz)];
          } } }
    }
  }
  const hexC = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
  // a stand in pieces (Spa's grandstands are blocks of ~20 m end to end, Štajerska's pieces ~31 m with 3 m between): the pieces whose fronts meet (the next one's first station within
  // 4 m of this one's last, facing the same way, their first rows within 3 m of height) one stand for its surroundings (standAround: its
  // concourse, kiosks, toilets, gate, stairs, doors, its TV platform), its walkers and the tools; each piece's rows, seats and flags as built
  function mergeChains(feet) {
    if (feet.length < 2) return;
    const H = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
    // a list of stations turned round: each one's gap flag (the piece before it not on the stand) moved with its piece
    const turn = (L) => { const g = L.map(e => !!e.gap), n = L.length; L.reverse(); for (let j = n - 1; j >= 1; j--) L[j].gap = g[n - j]; if (n) L[0].gap = false; };
    const dir = (L) => [L[L.length - 1].p[0] - L[0].p[0], L[L.length - 1].p[2] - L[0].p[2]];
    const info = feet.map(f => { let x = 0, z = 0; for (const e of f.fr3) { x += e.f[0]; z += e.f[1]; } const l = Math.hypot(x, z) || 1; return { f, nx: x / l, nz: z / l }; }).filter(I => I.f.fr3.length > 1 && I.f.bk3.length > 1);
    const flip = (I) => { turn(I.f.fr3); turn(I.f.bk3); I.f.tx = -I.f.tx; I.f.tz = -I.f.tz; };
    const used = new Set();
    for (const I0 of info) {
      if (used.has(I0)) continue; used.add(I0); const chain = [I0];
      for (const fwd of [true, false]) for (;;) {   // (on from its last station, then back from its first)
        const end = fwd ? chain[chain.length - 1] : chain[0], e = fwd ? end.f.fr3[end.f.fr3.length - 1] : end.f.fr3[0]; let best = null, bd = 4, bf = false;
        for (const J of info) { if (used.has(J) || J.nx * end.nx + J.nz * end.nz < 0.8 || Math.abs(J.f.low - end.f.low) > 3) continue;
          const a = H(fwd ? J.f.fr3[0].p : J.f.fr3[J.f.fr3.length - 1].p, e.p), b = H(fwd ? J.f.fr3[J.f.fr3.length - 1].p : J.f.fr3[0].p, e.p);
          if (a < bd) { bd = a; best = J; bf = false; } if (b < bd) { bd = b; best = J; bf = true; } }
        if (!best) break; used.add(best); if (bf) flip(best); fwd ? chain.push(best) : chain.unshift(best);
      }
      if (chain.length < 2) continue;
      const C = chain.map(c => c.f), f = C[0];
      for (const g of C) { const a = dir(g.fr3), b = dir(g.bk3); if (a[0] * b[0] + a[1] * b[1] < 0) turn(g.bk3); }   // (each piece's back the same way round as its front)
      const cat = (key) => { const out = []; for (const g of C) g[key].forEach((e, k) => out.push(k === 0 && out.length ? Object.assign({}, e, { gap: false, joint: true }) : e)); return out; };   // (joint: the step from one piece's last station to the next's first: paved over, no wall, rail or door on it)
      const fr = cat('fr3'), bk = cat('bk3'), P = fr.map(e => [e.p[0] + e.f[0] * 3, e.p[2] + e.f[1] * 3]), Bp = bk.map(e => [e.p[0] - e.f[0] * 1.5, e.p[2] - e.f[1] * 1.5]);
      const ext = (L) => { const a = L[0], b = L[1], c = L[L.length - 2], d = L[L.length - 1], la = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, ld = Math.hypot(d[0] - c[0], d[1] - c[1]) || 1;
        return [[a[0] + (a[0] - b[0]) / la * 1.5, a[1] + (a[1] - b[1]) / la * 1.5], ...L, [d[0] + (d[0] - c[0]) / ld * 1.5, d[1] + (d[1] - c[1]) / ld * 1.5]]; };
      const t0 = fr[0].p, t1 = fr[fr.length - 1].p, tl = Math.hypot(t1[0] - t0[0], t1[2] - t0[2]) || 1, fl = C.find(g => g.at && g.at.flag);
      Object.assign(f, { fr3: fr, bk3: bk, poly: ext(P).concat(ext(Bp).reverse()), tx: (t1[0] - t0[0]) / tl, tz: (t1[2] - t0[2]) / tl, pieces: C.length,
        bb: [Math.min(...C.map(g => g.bb[0])), Math.max(...C.map(g => g.bb[1])), Math.min(...C.map(g => g.bb[2])), Math.max(...C.map(g => g.bb[3]))],
        top: Math.max(...C.map(g => g.top)), low: Math.min(...C.map(g => g.low)), nrows: Math.max(...C.map(g => g.nrows)), flags: C.some(g => g.flags === 'rail') ? 'rail' : null,
        at: fl ? { flag: fl.at.flag, flagRow: fl.at.flagRow } : undefined,
        rvs: C.map(g => g.rv).filter(Boolean), rbs: C.map(g => g.rb).filter(Boolean), rv: C.some(g => g.rv) ? [].concat(...C.map(g => g.rv || [])) : undefined, rb: C.some(g => g.rb) ? [].concat(...C.map(g => g.rb || [])) : undefined });   // (the roofs: each piece's own for its fascia, trusses and beams)
      for (const g of C.slice(1)) feet.splice(feet.indexOf(g), 1);
    }
  }
  function standBuild(o, A, hsh, def, circles) {
    const t0 = performance.now(), seats = [], flat = new Map(), cells = new Map(), feet = [], standWays = [], temp = STAND_TEMP.has(def.id), tier = A.LOD.tier, gH = o.groundH;
    const sbAt = (x, z) => { const k = Math.floor(x / 128) + ',' + Math.floor(z / 128); let g = cells.get(k); if (!g) cells.set(k, g = new SB()); return g; };   // (128 m pieces: only those in view drawn)
    const FLU = kq(KIT.plain, 0, 1, 0.5, 0.5), bench = STAND_BENCH[def.id] || null, conc = bench ? DECK_COL[bench] : temp ? ST_DECK : ST_CONC, wall = bench === 'wood' ? DECK_COL.wood : ST_CONC, H2 = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]), tq = {}, trackD = (p) => { A.T.query(p[0], p[2], -1, tq); return Math.abs(tq.d); };
    o.root.updateMatrixWorld(true);
    let mid = 0;
    o.root.traverse(m => {
      if (!isStand(m)) return;
      const M = m.material, g = m.geometry, uv = g.attributes.uv, Pa = g.attributes.position, cv = M.userData.crowdUV || [1, 1 / 16, 1 / 16], pit = cv[1];
      let keep = false, built = false; mid++;
      const e = m.matrixWorld.elements, I = g.index ? g.index.array : null, n = I ? I.length : Pa.count, BU = 0.05;
      // the parts of the surface (two stands across the road share their uvs; a stepped stand's tiers are a part each): its triangles joined where they share a corner
      const tris = [], par = new Map(), find = (k) => { let r = k; while (par.get(r) !== r) r = par.get(r); let c = k; while (c !== r) { const nx = par.get(c); par.set(c, r); c = nx; } return r; };
      const key = (q) => Math.round(q.x * 50) + ',' + Math.round(q.y * 50) + ',' + Math.round(q.z * 50);
      for (let t = 0; t + 2 < n; t += 3) {
        const T = [0, 1, 2].map(j => { const k = I ? I[t + j] : t + j, x = Pa.getX(k), y = Pa.getY(k), z = Pa.getZ(k);
          return { u: uv.getX(k), v: uv.getY(k), x: e[0] * x + e[4] * y + e[8] * z + e[12], y: e[1] * x + e[5] * y + e[9] * z + e[13], z: e[2] * x + e[6] * y + e[10] * z + e[14] }; });
        const den = (T[1].v - T[2].v) * (T[0].u - T[2].u) + (T[2].u - T[1].u) * (T[0].v - T[2].v); if (Math.abs(den) < 1e-12) continue;
        const ks = T.map(key); for (const k of ks) if (!par.has(k)) par.set(k, k); const r0 = find(ks[0]); for (const k of ks.slice(1)) { const r = find(k); if (r !== r0) par.set(r, r0); }
        tris.push({ T, den, k: ks[0] });
      }
      const isl = new Map(); for (const tr of tris) { const r = find(tr.k); let L = isl.get(r); if (!L) isl.set(r, L = []); L.push(tr); }
      // each part: p(u, v) on it, its u stations, its rows (a tier each: from its front vf to its back vb)
      const parts = [];
      for (const list of isl.values()) {
        const buckets = new Map(), us = []; let vmin = 1e9, vmax = -1e9;
        for (const rec of list) { const T = rec.T, u0 = Math.min(T[0].u, T[1].u, T[2].u), u1 = Math.max(T[0].u, T[1].u, T[2].u);
          for (let bk = Math.floor(u0 / BU); bk <= Math.floor(u1 / BU); bk++) { let L = buckets.get(bk); if (!L) buckets.set(bk, L = []); L.push(rec); }
          for (const q of T) { us.push(q.u); vmin = Math.min(vmin, q.v); vmax = Math.max(vmax, q.v); } }
        const P = (u, v, tol) => { const L = buckets.get(Math.floor(u / BU)); if (!L) return null;
          for (const { T, den } of L) { const w1 = ((T[1].v - T[2].v) * (u - T[2].u) + (T[2].u - T[1].u) * (v - T[2].v)) / den, w2 = ((T[2].v - T[0].v) * (u - T[2].u) + (T[0].u - T[2].u) * (v - T[2].v)) / den, w3 = 1 - w1 - w2;
            if (w1 < -tol || w2 < -tol || w3 < -tol) continue; return [T[0].x * w1 + T[1].x * w2 + T[2].x * w3, T[0].y * w1 + T[1].y * w2 + T[2].y * w3, T[0].z * w1 + T[1].z * w2 + T[2].z * w3]; }
          return null; };
        const Q = (u, v) => P(u, v, 1e-5) || P(u, v, 0.06);
        us.sort((x, y) => x - y); const U0 = []; for (const u of us) if (!U0.length || u - U0[U0.length - 1] > 1e-4) U0.push(u);
        if (U0.length < 2) continue;
        // its stations where it bends (a straight stretch one piece: the stations between dropped where every point of them is within 4 cm of the line)
        const vS = [vmin, (vmin + vmax) / 2, vmax], U = [U0[0]];
        const straight = (i, j) => { for (let k = i; k < j; k++) if (!Q((U0[k] + U0[k + 1]) / 2, vS[1])) return false;
          for (let k = i + 1; k < j; k++) for (const v of vS) { const a = Q(U0[i], v), b = Q(U0[j], v), p = Q(U0[k], v); if (!a || !b || !p) return false;
            const t = (U0[k] - U0[i]) / (U0[j] - U0[i]); if (Math.hypot(a[0] + (b[0] - a[0]) * t - p[0], a[1] + (b[1] - a[1]) * t - p[1], a[2] + (b[2] - a[2]) * t - p[2]) > 0.04) return false; }
          return true; };
        for (let i = 0; i < U0.length - 1;) { let j = i + 1; while (j + 1 < U0.length && j - i < 40 && straight(i, j + 1)) j++; U.push(U0[j]); i = j; }
        // steep? (the rise over the run of a tier, along the middle of the surface): a wall of people, kept painted
        let rise = 0, run = 0; const va = vmin + (vmax - vmin) * 0.25, vz = vmin + (vmax - vmin) * 0.75;   // (a part may be one tier alone: stepped already)
        for (let j = 0; j + 1 < U0.length; j++) { const um = (U0[j] + U0[j + 1]) / 2, a0 = Q(um, va), a1 = Q(um, vz); if (a0 && a1) { rise += Math.abs(a1[1] - a0[1]); run += H2(a1, a0); } }
        if (!(run > 0) || rise / run > 1.6) { keep = true; continue; }
        let um = null; for (let j = 0; j + 1 < U.length && um == null; j++) { const c = (U[j] + U[j + 1]) / 2; if (Q(c, (vmin + vmax) / 2)) um = c; }
        if (um == null) continue;
        const part = { Q, U, rows: [], id: parts.length };
        for (let t = Math.floor(vmin / pit + 1e-4); t <= Math.floor(vmax / pit - 1e-4) && t < 400; t++) {
          const vf = Math.max(t * pit, vmin), vb = Math.min((t + 1) * pit, vmax); if (vb - vf < pit * 0.4) continue;   // (a sliver of a tier: none)
          const F = Q(um, vf), B = Q(um, vb); if (!F || !B) continue;
          const flat = Math.abs(B[1] - F[1]) < 0.03, flip = flat ? trackD(B) < trackD(F) - 0.05 : B[1] < F[1];   // (its front: the lower edge, or a flat tier's nearer the road: a stand's v may run either way)
          part.rows.push(flip ? { part, t, vf: vb, vb: vf, y: F[1], flat, F: B, B: F, uA: U[0], uB: U[U.length - 1] } : { part, t, vf, vb, y: B[1], flat, F, B, uA: U[0], uB: U[U.length - 1] });
        }
        if (part.rows.length) parts.push(part);
      }
      if (!parts.length) { if (keep) flat.set(M, cv); return; }
      built = true;
      // the stands: a part's rows together; parts joined where a row's back meets another's front, higher (the tiers of a stepped stand)
      const sp = parts.map((p, i) => i), sf = (i) => { while (sp[i] !== i) i = sp[i] = sp[sp[i]]; return i; };
      for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
        const a = parts[i], b = parts[j], lo = Math.max(a.U[0], b.U[0]), hi = Math.min(a.U[a.U.length - 1], b.U[b.U.length - 1]);
        if (hi - lo < 0.3 * Math.min(a.U[a.U.length - 1] - a.U[0], b.U[b.U.length - 1] - b.U[0])) continue;
        const uo = (lo + hi) / 2;
        const meets = (p, q) => p.rows.some(r => q.rows.some(s => { if (s.y <= r.y) return false; const rb = p.Q(uo, r.vb), sf2 = q.Q(uo, s.vf); return rb && sf2 && H2(rb, sf2) < 1.3 && sf2[1] - rb[1] < 1.6; }));
        if (meets(a, b) || meets(b, a)) sp[sf(i)] = sf(j);
      }
      const stands = new Map(); for (let i = 0; i < parts.length; i++) { const r = sf(i); let L = stands.get(r); if (!L) stands.set(r, L = []); L.push(parts[i]); }
      let si = 0;
      for (const sparts of stands.values()) {
        si++;
        const rows0 = [].concat(...sparts.map(p => p.rows)).sort((a, b) => a.y - b.y), rows = [];
        rows0.forEach((r, i) => {   // a deep flat tier (a stepped stand's) cut into rows of about 0.85 m, each a step up towards the next tier's height
          const dep = H2(r.F, r.B), nx = rows0[i + 1], pv = rows0[i - 1], ok = (d) => d > 0.2 && d < 1.6, rise = nx && ok(nx.y - r.y) ? nx.y - r.y : pv && ok(r.y - pv.y) ? r.y - pv.y : 0.45;
          const n = r.flat && dep >= 1.35 ? Math.min(4, Math.round(dep / 0.85)) : 1;
          for (let k = 0; k < n; k++) rows.push(Object.assign({}, r, { vf: r.vf + (r.vb - r.vf) * k / n, vb: r.vf + (r.vb - r.vf) * (k + 1) / n, dy: k * rise / n, dyP: k ? (k - 1) * rise / n : null, t: r.t * 8 + k, yb: r.y + k * rise / n }));
        });
        const uA = Math.min(...rows.map(r => r.uA)), uB = Math.max(...rows.map(r => r.uB));
        const R0 = rows[Math.floor(rows.length / 2)], len = (() => { let L = 0, q = null; for (const u of R0.part.U) { const p = R0.part.Q(u, R0.vb); if (p && q) L += H2(p, q); q = p; } return L; })();
        if (!(len > 1)) continue;
        // its aisles (in u: the same for all its rows) and its colours
        const nB = len < 9 ? 1 : Math.max(1, Math.round(len / BLOCK)), hw = AISLE / 2 * (uB - uA) / len, aisles = [];
        for (let k = 1; k < nB; k++) { const c = uA + (uB - uA) * k / nB; aisles.push([c - hw, c + hw, c]); }
        const hs = (hsh * 7 + mid * 131 + si * 17) % 9973, c1 = SEAT_COLS[hs % 6], c2 = SEAT_COLS[(hs % 6 + 1 + (hs >> 3) % 7) % SEAT_COLS.length], scheme = (hs >> 5) % 5;
        const frontC = c1.map(v => v * 0.62), colOf = (ri, blk) => bench ? BENCH_COL[bench] : scheme === 1 && blk % 2 ? c2 : scheme === 2 && ri >= rows.length * 0.6 ? c2 : scheme === 3 && ri % 6 === 5 ? c2 : c1;   // (one colour; by blocks; the upper rows; a stripe; a bench its timber or aluminium)
        const nAisle = (u) => aisles.findIndex(a => u > a[0] && u < a[1]);
        // the fans' flags (FLAGS: the track's country's stripes, now and then a team's colours; no writing), seen from the road over its barrier:
        // a stand whose first row is 1.4 m over the ground in front has them over its front handrail (standAround); another over the seats of
        // its first row 2.1 m up (its third at least, not its last) and every fifth above it, draped over their backs, three to five seats each,
        // one in 10-22 m (nobody in them)
        let flagMode = null, flagRow = -1, flagAt = null, nFlags = 0;
        { const r0 = rows[0], P0 = r0.part; let gf = null;
          for (const w of [0.5, 0.3, 0.7, 0.15, 0.85]) { const u = r0.uA + (r0.uB - r0.uA) * w, F = P0.Q(u, r0.vf), B = P0.Q(u, r0.vb); if (!F || !B) continue; const l = H2(F, B) || 1, g = gH(F[0] + (F[0] - B[0]) / l * 3, F[2] + (F[2] - B[2]) / l * 3); if (Number.isFinite(g)) { gf = g; break; } }
          if (gf != null && rows.length >= 3) {
            if (r0.yb - gf >= 1.4) flagMode = 'rail';
            else for (let r = 2; r <= rows.length - 2; r++) if (rows[r].yb - gf >= 2.1) { flagMode = 'row'; flagRow = r; break; }
          } }
        const aisleRec = new Map();   // (the treads drawn in each aisle where its handrail runs, for the walkers' ways: aisleRec)
        rows.forEach((row, ri) => {
          const { part, vf, vb } = row, Q = part.Q, U = part.U, prev = ri > 0 ? rows[ri - 1] : null, Qb = (u) => { const p = Q(u, vb); return p && [p[0], p[1] + row.dy, p[2]]; };   // (Qb: the back edge, the row's tread)
          const yPrev = (u, F) => row.flat ? (row.dyP != null ? F[1] + row.dyP : prev && prev.yb < row.yb - 0.05 ? prev.yb : null) : F[1];   // (the tread in front of its riser)
          // the back edge's length along u (the seats' places), each block's seats (centred, whole ones)
          const D = [0]; for (let j = 1; j < U.length; j++) { const a = Q(U[j - 1], vb), b = Q(U[j], vb); D.push(D[j - 1] + (a && b ? H2(a, b) : (U[j] - U[j - 1]) * len / (uB - uA))); }
          const dAt = (u) => { let j = 0; while (j < U.length - 2 && U[j + 1] < u) j++; return D[j] + (D[j + 1] - D[j]) * (u - U[j]) / ((U[j + 1] - U[j]) || 1); };
          const uAt = (d) => { let j = 0; while (j < U.length - 2 && D[j + 1] < d) j++; return U[j] + (U[j + 1] - U[j]) * (d - D[j]) / ((D[j + 1] - D[j]) || 1); };
          const cuts = [row.uA]; for (const a of aisles) if (a[0] > row.uA && a[1] < row.uB) cuts.push(a[0], a[1]); cuts.push(row.uB);
          const blocks = []; for (let k = 0; k + 1 < cuts.length; k += 2) {
            const dA = dAt(cuts[k]), dB = dAt(cuts[k + 1]), nS = Math.floor((dB - dA - 0.1) / SEAT_W); if (nS < 1) continue;
            const d0 = dA + (dB - dA - nS * SEAT_W) / 2; blocks.push({ k: k / 2, d0, d1: d0 + nS * SEAT_W, u0: uAt(d0), u1: uAt(d0 + nS * SEAT_W), nS, col: colOf(ri, k / 2) });
          }
          const bad = [];   // (the twisted pieces: no seats there)
          for (let j = 0; j + 1 < U.length; j++) {
            const ua = U[j], ub = U[j + 1]; if (!Q((ua + ub) / 2, (vf + vb) / 2)) continue;   // (a gap between two stands)
            const FL0 = Q(ua, vf), FR0 = Q(ub, vf), BL0 = Q(ua, vb), BR0 = Q(ub, vb); if (!FL0 || !FR0 || !BL0 || !BR0) continue;
            const fv = [FR0[0] - FL0[0], FR0[2] - FL0[2]], bv = [BR0[0] - BL0[0], BR0[2] - BL0[2]], lf = Math.hypot(...fv), lb = Math.hypot(...bv);
            if (lf > 0.05 && lb > 0.05 && (fv[0] * bv[0] + fv[1] * bv[1]) < 0.5 * lf * lb) { bad.push([ua, ub]); continue; }   // (a twisted piece where the stand turns a sharp corner: none)
            // the pieces between the aisles' edges
            const cs = [ua]; for (const a of aisles) for (const c of [a[0], a[1]]) if (c > ua + 1e-6 && c < ub - 1e-6) cs.push(c); cs.push(ub); cs.sort((x, y) => x - y);
            for (let k = 0; k + 1 < cs.length; k++) {
              const a = cs[k], b = cs[k + 1], ai = nAisle((a + b) / 2), FL = Q(a, vf), FR = Q(b, vf), BL = Qb(a), BR = Qb(b); if (!FL || !FR || !BL || !BR) continue;
              const fx = (FL[0] + FR[0] - BL[0] - BR[0]) / 2, fz = (FL[2] + FR[2] - BL[2] - BR[2]) / 2, dep = Math.hypot(fx, fz); if (dep < 0.2) continue;
              const nx = fx / dep, nz = fz / dep, FLu = [FL[0], BL[1], FL[2]], FRu = [FR[0], BR[1], FR[2]], gb = sbAt((FL[0] + BR[0]) / 2, (FL[2] + BR[2]) / 2);
              const ul = dAt(a) / 2, ur = dAt(b) / 2, up = [0, 1, 0], fw = [nx, 0, nz];
              const FB = row.flat ? (row.dyP != null ? [FL[0], FL[1] + row.dyP, FL[2]] : null) : FL, FBR = FB && [FR[0], FB[1] + (row.flat ? 0 : FR[1] - FL[1]), FR[2]];
              if (FB && BL[1] - FB[1] > 0.03) gb.quad(FB, FBR, FRu, FLu, fw, ri === 0 && !bench ? frontC : conc, null, kq(KIT.riser, ul, ur, 1, 0));   // (the riser: none on a stepped stand's own; the first row's in the stand's colour, darker: its front seen from the road)
              gb.quad(FLu, FRu, BR, BL, up, conc, null, kq(ai >= 0 && bench !== 'wood' ? KIT.aisle : bench ? KIT.deck : KIT.tread, ul, ur, 0, 0.98));   // (the tread; an aisle's with its yellow edge; a deck of planks)
              if (ai >= 0) {   // an aisle: a step between each two (yellow edged), on the tread in front
                const yp = yPrev(a, FL), hs = !(tier === 0 || yp == null || BL[1] - yp < 0.25), uc = aisles[ai][2];   // (none at NIZKA)
                if (uc >= a - 1e-6 && uc <= b + 1e-6) { const w = (uc - a) / ((b - a) || 1), L3 = (p, q) => [p[0] + (q[0] - p[0]) * w, p[1] + (q[1] - p[1]) * w, p[2] + (q[2] - p[2]) * w], tl = H2(FRu, FLu) || 1;   // (the tread at the handrail's line, the row's way across, its half-step if drawn)
                  aisleRec.set(ai + '|' + ri, { F: L3(FLu, FRu), B: L3(BL, BR), y: BL[1], nx, nz, ax: (FRu[0] - FLu[0]) / tl, az: (FRu[2] - FLu[2]) / tl, hs: hs ? { yh: (yp + BL[1]) / 2, d2: Math.min(0.42, dep * 0.5) } : null }); }
                if (!hs) continue;
                const yh = (yp + BL[1]) / 2, d2 = Math.min(0.42, dep * 0.5), at = (p, y) => [p[0] + nx * d2, y, p[2] + nz * d2];
                gb.quad(at(FLu, yh), at(FRu, yh), [FR[0], yh, FR[2]], [FL[0], yh, FL[2]], up, conc, null, kq(KIT.aisle, ul, ur, 0, 0.98));
                gb.quad(at(FL, yp), at(FR, yp), at(FR, yh), at(FL, yh), fw, conc, null, kq(KIT.riser, ul, ur, 1, 0));
                continue;
              }
              if (dep < 0.62) continue;
              // the seats on its back part, facing the front: the seat, its back (none at NIZKA: the phone's budget)
              for (const B of blocks) {
                const s0 = Math.max(a, B.u0), s1 = Math.min(b, B.u1); if (s1 - s0 < 1e-6) continue;
                const L0 = Qb(s0), L1 = Qb(s1); if (!L0 || !L1) continue;
                const t0 = (dAt(s0) - B.d0) / (4 * SEAT_W), t1 = (dAt(s1) - B.d0) / (4 * SEAT_W), at = (p, d, h) => [p[0] + nx * d, p[1] + h, p[2] + nz * d];
                if (bench) { gb.quad(at(L0, BENCH.back, BENCH.h), at(L1, BENCH.back, BENCH.h), at(L1, BENCH.back + BENCH.depth, BENCH.h), at(L0, BENCH.back + BENCH.depth, BENCH.h), up, conc, B.col, kq(KIT.bench, dAt(s0) / 2, dAt(s1) / 2, 0, 1)); continue; }   // (a bench: its planks, no back)
                gb.quad(at(L0, BENCH.back, BENCH.h), at(L1, BENCH.back, BENCH.h), at(L1, BENCH.back + BENCH.depth, BENCH.h), at(L0, BENCH.back + BENCH.depth, BENCH.h), up, conc, B.col, kq(KIT.pan, t0, t1, 0, 1));
                if (tier > 0) gb.quad(at(L0, BENCH.back, BENCH.h - 0.02), at(L1, BENCH.back, BENCH.h - 0.02), at(L1, BENCH.back - 0.05, BENCH.h + BENCH.rest), at(L0, BENCH.back - 0.05, BENCH.h + BENCH.rest), fw, conc, B.col, kq(KIT.back, t0, t1, 1, 0));
              }
            }
          }
          // the fans' flags over this row's seats (flagRow): each draped over three seats' backs, down to their seats, over them and down their
          // fronts (d forward of the row's back edge, h up from its tread); its stripes from the left as seen from the road
          const taken = flagRow >= 0 && ri >= flagRow && (ri - flagRow) % 5 === 0 && ri <= rows.length - 2 ? new Set() : null;
          if (taken) { let next = 4 + (si * 5 + mid * 3 + ri * 7) % 11;
            // (no seat backs: at Nizka, or a bench: from the seat on; the stripes of a flag with horizontal ones over the parts the road sees, the
            // seat's flat part in the colour of the stripe it joins: from below it is not seen)
            const PR = tier === 0 || bench ? [[0.06, 0.47], [0.5, 0.47], [0.53, 0.12]] : [[0.02, 0.89], [0.1, 0.47], [0.5, 0.47], [0.53, 0.12]], cum = [0]; for (let k = 1; k < PR.length; k++) cum.push(cum[k - 1] + Math.hypot(PR[k][0] - PR[k - 1][0], PR[k][1] - PR[k - 1][1]));
            const segs = []; for (let k = 1; k < PR.length; k++) segs.push([cum[k - 1], cum[k], Math.abs(PR[k][1] - PR[k - 1][1]) < 0.05]);
            const Lv = segs.reduce((a, g) => a + (g[2] ? 0 : g[1] - g[0]), 0);
            const LT = cum[cum.length - 1], c0 = FLAGS[def.id] || {}, cols = (c0.flag || [0xf2f2f2, 0xd8262a, 0xf2f2f2]).map(hexC), vert = !!(c0.flag && c0.flag.vert), team = c0.team != null ? hexC(c0.team) : null;
            for (const B of blocks) {
              if (next < B.d0 + 0.6) next = B.d0 + 0.6;
              while (next < B.d1 - 0.6) {
                const h = (((nFlags * 7919 + si * 131 + mid * 17 + ri * 29 + Math.round(next * 10)) % 97) + 97) % 97 / 97, nW = Math.min(B.nS, h > 0.75 ? 5 : h > 0.4 ? 4 : 3);
                next += 10 + h * 12; if (nW < 3) break;
                const q = Math.max(0, Math.min(B.nS - nW, Math.floor((next - 10 - h * 12 - B.d0) / SEAT_W) - (nW >> 1)));
                const uL = uAt(B.d0 + q * SEAT_W + 0.04), uR = uAt(B.d0 + (q + nW) * SEAT_W - 0.04), um = (uL + uR) / 2;
                if (bad.some(([a, b]) => uR > a && uL < b)) continue;
                const L0 = Qb(uL), L1 = Qb(uR), F = Q(um, vf), Bk = Q(um, vb); if (!L0 || !L1 || !F || !Bk) continue;
                const wl = H2(L0, L1); if (wl < nW * SEAT_W * 0.75 || wl > nW * SEAT_W * 1.3) continue;
                const l = H2(F, Bk) || 1, nx = (F[0] - Bk[0]) / l, nz = (F[2] - Bk[2]) / l, gb = sbAt((L0[0] + L1[0]) / 2, (L0[2] + L1[2]) / 2);
                const flip = (L0[0] - L1[0]) * -nz + (L0[2] - L1[2]) * nx < 0;   // (L0 on the right as seen from the road: the stripes from L1)
                const at = (w, s) => { let k = 1; while (k < PR.length - 1 && cum[k] < s) k++; const t = (s - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1), d = PR[k - 1][0] + (PR[k][0] - PR[k - 1][0]) * t, hh = PR[k - 1][1] + (PR[k][1] - PR[k - 1][1]) * t;
                  return [L0[0] + (L1[0] - L0[0]) * w + nx * d, L0[1] + (L1[1] - L0[1]) * w + hh, L0[2] + (L1[2] - L0[2]) * w + nz * d]; };
                const piece = (w0, w1, s0, s1, col) => { const ss = [s0]; for (const c of cum) if (c > s0 + 1e-6 && c < s1 - 1e-6) ss.push(c); ss.push(s1);
                  for (let k = 0; k + 1 < ss.length; k++) { const A0 = at(0.5, ss[k]), B0 = at(0.5, ss[k + 1]), dd = (B0[0] - A0[0]) * nx + (B0[2] - A0[2]) * nz, dh = B0[1] - A0[1];
                    gb.quad(at(w0, ss[k + 1]), at(w1, ss[k + 1]), at(w1, ss[k]), at(w0, ss[k]), [-dh * nx, dd, -dh * nz], col, null, FLU); } };
                const c3 = team && h < 0.3 ? [team, [0.96, 0.96, 0.94], team] : cols, n3 = c3.length;
                if (!vert) { let acc = 0; for (const [s0, s1, flat] of segs) { if (flat) { piece(0, 1, s0, s1, c3[Math.min(n3 - 1, Math.floor(acc / Lv * n3 + 1e-6))]); continue; }
                    const L = s1 - s0; for (let i = 0; i < n3; i++) { const a = Math.max(Lv * i / n3, acc), b = Math.min(Lv * (i + 1) / n3, acc + L); if (b > a + 1e-6) piece(0, 1, s0 + a - acc, s0 + b - acc, c3[i]); } acc += L; } }
                else for (let i = 0; i < n3; i++) { if (flip) piece(1 - (i + 1) / n3, 1 - i / n3, 0, LT, c3[i]); else piece(i / n3, (i + 1) / n3, 0, LT, c3[i]); }
                for (let k = q; k < q + nW; k++) taken.add(B.k * 1000 + k);
                if (!nFlags) flagAt = [(L0[0] + L1[0]) / 2, row.yb, (L0[2] + L1[2]) / 2, nx, nz];
                nFlags++;
              }
            } }
          // the people's seats (their places worked out only for those who sit, seatAt: the stands have tens of thousands)
          const ctx = { uAt, Qb, Q, vf, bad }, mk = m.id + '/' + si + '/' + part.id;
          for (const B of blocks) for (let q = 0; q < B.nS; q++) if (!taken || !taken.has(B.k * 1000 + q)) seats.push({ row: row.t, k: B.k * 1000 + q, m: mk, c: ctx, d: B.d0 + (q + 0.5) * SEAT_W });
          // its ends: a wall a metre over the tread, down to the ground (a temporary stand's: its scaffolding, a railing over it)
          for (const [ue, s] of [[row.uA, -1], [row.uB, 1]]) {
            const F = Q(ue, vf), B = Qb(ue), um2 = ue - s * Math.min(0.5, (uB - uA) * 0.02); if (!F || !B) continue;
            const Fi = Q(um2, (vf + vb) / 2), Mid = Q(ue, (vf + vb) / 2); if (!Fi || !Mid) continue;
            const tl = H2(Fi, Mid) || 1, ox = (Mid[0] - Fi[0]) / tl, oz = (Mid[2] - Fi[2]) / tl, y = B[1], top = y + 1.0, gb = sbAt(B[0], B[2]);
            const off = (p, d, yy) => [p[0] + ox * d, yy, p[2] + oz * d], gr = (p) => { const h = gH(p[0], p[2]); return Number.isFinite(h) ? Math.min(h, y - 0.05) : y - 3; }, gF = gr(F), gBk = gr(B);
            const fx = F[0] - B[0], fz = F[2] - B[2], fl = Math.hypot(fx, fz) || 1, fw = [fx / fl, 0, fz / fl], dd = fl / 2;
            const yp = ri > 0 ? rows[ri - 1].yb : null, out = [ox, 0, oz], inn = [-ox, 0, -oz];
            if (!temp) {
              gb.quad(off(F, 0.04, gF), off(B, 0.04, gBk), off(B, 0.04, top), off(F, 0.04, top), out, wall, null, kq(KIT.riser, 0, dd, 1, 0));
              if (tier > 0) { gb.quad(off(F, -0.14, y), off(B, -0.14, y), off(B, -0.14, top), off(F, -0.14, top), inn, wall, null, kq(KIT.riser, 0, dd, 1, 0));   // (its inside, its top: none at NIZKA)
                gb.quad(off(F, 0.04, top), off(B, 0.04, top), off(B, -0.14, top), off(F, -0.14, top), [0, 1, 0], wall, null, kq(KIT.plain, 0, 1, 0, 1)); }
              const fb = yp != null && yp + 1.0 < top - 0.02 ? yp + 1.0 : yp == null ? gF : null;   // (its front: the step over the row in front, or the first row's from the ground)
              if (fb != null) gb.quad(off(F, 0.04, fb), off(F, -0.14, fb), off(F, -0.14, top), off(F, 0.04, top), fw, wall, null, kq(KIT.riser, 0, 0.1, 1, 0));
            } else {
              // the scaffolding seen through (lifts of 1.25 m from the tread down), the railing on top: two rails and the posts
              const lifts = Math.max(1, Math.min(tier > 0 ? 8 : 1, Math.ceil((y - Math.min(gF, gBk)) / 1.25)));
              for (let k = 0; k < lifts; k++) {
                const y1 = y - k * 1.25, last = k === lifts - 1, yF0 = last ? gF : Math.max(gF, y1 - 1.25), yB0 = last ? gBk : Math.max(gBk, y1 - 1.25); if (y1 - Math.max(yF0, yB0) < 0.05 && !last) break;
                gb.quad(off(F, 0.04, yF0), off(B, 0.04, yB0), off(B, 0.04, y1), off(F, 0.04, y1), out, ST_STEEL, null, [[0, kv(KIT.scaf, last ? Math.min(1, (y1 - yF0) / 1.25) : 1)], [fl / 2.5, kv(KIT.scaf, last ? Math.min(1, (y1 - yB0) / 1.25) : 1)], [fl / 2.5, kv(KIT.scaf, 0)], [0, kv(KIT.scaf, 0)]]);
              }
              if (tier > 0) { gb.bar(off(F, 0.04, top), off(B, 0.04, top), 0.05, 0.05, ST_RAIL); gb.bar(off(F, 0.04, y + 0.52), off(B, 0.04, y + 0.52), 0.04, 0.04, ST_RAIL); gb.post(off(B, 0.04, y), 1.0, 0.05, [fw[0], fw[2]], ST_RAIL); }
            }
          }
        });
        // its footprint (the first row's front, the last row's back; a roof may reach 3 m past the front and 1.5 m past the back and the ends) and its top tread
        { const r0 = rows[0], r1 = rows[rows.length - 1], fr = [], bk = [];
          for (const u of r0.part.U) { const F = r0.part.Q(u, r0.vf), B = r0.part.Q(u, r0.vb); if (F && B) { const l = H2(F, B) || 1; fr.push([F[0] + (F[0] - B[0]) / l * 3, F[2] + (F[2] - B[2]) / l * 3]); } }
          for (const u of r1.part.U) { const F = r1.part.Q(u, r1.vf), B = r1.part.Q(u, r1.vb); if (F && B) { const l = H2(F, B) || 1; bk.push([B[0] - (F[0] - B[0]) / l * 1.5, B[2] - (F[2] - B[2]) / l * 1.5]); } }
          if (fr.length > 1 && bk.length > 1) {
            const ext = (L) => { const a = L[0], b = L[1], c = L[L.length - 2], d = L[L.length - 1], la = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, ld = Math.hypot(d[0] - c[0], d[1] - c[1]) || 1;
              return [[a[0] + (a[0] - b[0]) / la * 1.5, a[1] + (a[1] - b[1]) / la * 1.5], ...L, [d[0] + (d[0] - c[0]) / ld * 1.5, d[1] + (d[1] - c[1]) / ld * 1.5]]; };
            const poly = ext(fr).concat(ext(bk).reverse()), xs = poly.map(p => p[0]), zs = poly.map(p => p[1]), t0 = fr[0], t1 = fr[fr.length - 1], tl = Math.hypot(t1[0] - t0[0], t1[1] - t0[1]) || 1;
            const fr3 = [], bk3 = [], gapOf = (r, u, pu) => pu != null && !r.part.Q((u + pu) / 2, (r.vf + r.vb) / 2);   // (gap: the piece before this station is not on the stand)
            { let pu = null; for (const u of r0.part.U) { const F = r0.part.Q(u, r0.vf), B = r0.part.Q(u, r0.vb); if (F && B) { const l = H2(F, B) || 1; fr3.push({ p: [F[0], r0.flat ? F[1] + (r0.dyP != null ? r0.dyP : 0) : F[1], F[2]], f: [(F[0] - B[0]) / l, (F[2] - B[2]) / l], y2: B[1] + r0.dy, gap: gapOf(r0, u, pu) }); pu = u; } } }   // (y2: the first row's tread)
            { let pu = null; for (const u of r1.part.U) { const F = r1.part.Q(u, r1.vf), B = r1.part.Q(u, r1.vb); if (F && B) { const l = H2(F, B) || 1; bk3.push({ p: [B[0], B[1] + r1.dy, B[2]], f: [(F[0] - B[0]) / l, (F[2] - B[2]) / l], gap: gapOf(r1, u, pu) }); pu = u; } } }
            if (flagMode === 'rail') for (const e of fr3) e.rail = true;   // (its flags over the front handrail: standAround, by the station, a stand in pieces each its own)
            feet.push({ poly, bb: [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)], top: Math.max(...rows.map(r => r.yb)), tx: (t1[0] - t0[0]) / tl, tz: (t1[1] - t0[1]) / tl, fr3, bk3, nrows: rows.length, low: rows[0].yb, col: c1, bench, flags: flagMode, at: flagAt ? { flag: flagAt.concat(nFlags), flagRow } : undefined });
          } }
        // the aisles' ways up for the walkers (standsOf), 0.3 m beside the handrail, over the treads and half-steps as drawn (aisleRec): from just
        // behind the first row's front (not through the railing in front) up each riser (its half-step where there is one) to the top row's
        // back; the longest run of rows with their aisle's tread drawn, at least three
        { const ways = [];
          aisles.forEach((a, ai) => {
            let run = [], best = [];   // (a run: each row's tread where the last one's ends, up at most a step (two with a half-step) of 0.35 m)
            const joins = (q, r) => H2(q.B, r.F) < 0.35 && r.y - q.y >= -0.02 && r.y - q.y <= (r.hs ? 0.7 : 0.35) && (!r.hs || (r.hs.yh >= q.y - 0.02 && r.hs.yh <= r.y + 0.02));   // (its half-step between the two)
            for (let ri = 0; ri <= rows.length; ri++) { const r = ri < rows.length ? aisleRec.get(ai + '|' + ri) : null;
              if (r && (!run.length || joins(run[run.length - 1], r))) { run.push(r); continue; }
              if (run.length > best.length) best = run; run = r ? [r] : []; }
            if (best.length < 3) return;
            const pts = [], side = ai % 2 ? 0.4 : -0.4;   // (0.4 m to one side of the handrail, in metres along the row)
            best.forEach((r, k) => {
              const P = (d, y) => [r.F[0] + r.nx * d + r.ax * side, y, r.F[2] + r.nz * d + r.az * side], yp = k ? best[k - 1].y : r.y;   // (up a riser on the step in front of it: at its height where the riser is)
              if (!k) pts.push(P(-0.15, r.y));
              else if (r.hs) pts.push(P(r.hs.d2 + 0.12, yp), P(r.hs.d2 - 0.02, r.hs.yh), P(0.12, r.hs.yh), P(-0.02, r.y));
              else pts.push(P(0.12, yp), P(-0.02, r.y));
              if (k === best.length - 1) pts.push([r.B[0] + r.nx * 0.25 + r.ax * side, r.y, r.B[2] + r.nz * 0.25 + r.az * side]);
            });
            ways.push(pts);
          });
          if (ways.length) standWays.push(ways); }
        // the handrails up the aisles' middles (on the rows' front edges, 0.95 m over them; an upright every other row)
        if (tier > 0) for (const a of aisles) {
          let q = null, k = 0;
          for (const row of rows) {
            const F = row.part.Q(a[2], row.vf), B0 = row.part.Q(a[2], row.vb), B = B0 && [B0[0], B0[1] + row.dy, B0[2]]; if (!F || !B) { q = null; continue; }
            const p = [F[0], B[1] + 0.95, F[2]], gb = sbAt(F[0], F[2]), fl = H2(F, B) || 1, f = [(F[0] - B[0]) / fl, (F[2] - B[2]) / fl];
            if (q && H2(p, q) < 2.5) gb.bar(q, p, 0.05, 0.05, ST_RAIL);
            if (k++ % 2 === 0) gb.post([F[0], B[1], F[2]], 0.95, 0.05, f, ST_RAIL);
            q = p;
          }
        }
      }
      if (keep && !built) flat.set(M, cv); else if (built) { m.visible = false; if (keep) flat.set(M, cv); }
    });
    const t1 = performance.now(), ms = worldStatics(o); standRoofs(o, feet, sbAt, ms); const t2 = performance.now();   // (each piece's roof over its own top tread: before the pieces are joined)
    mergeChains(feet);
    for (const ws of standWays) { const f = feet.find(f => ws[0].some(p => inPoly(f.poly, p[0], p[2]))); if (f) f.ways = (f.ways || []).concat(ws); }   // (each stand's aisles' ways)
    standAround(o, A, feet, sbAt, tier, def, circles, ms); const t3 = performance.now();
    const mat = standMat(), meshes = [];
    for (const gb of cells.values()) { if (gb.empty) continue; const mm = new THREE.Mesh(gb.geometry(), mat); mm.castShadow = false; mm.receiveShadow = true; mm.matrixAutoUpdate = false; mm.updateMatrix(); mm.name = 'standSteps'; meshes.push(mm); }
    return { seats, flat, meshes, feet, msT: [Math.round(t1 - t0), Math.round(t2 - t1), Math.round(t3 - t2), Math.round(performance.now() - t3)] };
  }
  function seatAt(st) {   // a seat's place: the feet on the tread, under the middle of the seat (false: none there)
    const { uAt, Qb, Q, vf, bad } = st.c, u = uAt(st.d), Bp = Qb(u), Fp = Q(u, vf); st.c = null;
    if (!Bp || !Fp || bad.some(b => u >= b[0] && u <= b[1])) return false;
    const fx = Fp[0] - Bp[0], fz = Fp[2] - Bp[2], dep = Math.hypot(fx, fz); if (dep < 0.62) return false;
    const nx = fx / dep, nz = fz / dep, w = BENCH.back + BENCH.depth / 2;
    st.x = Bp[0] + nx * w; st.y = Bp[1]; st.z = Bp[2] + nz * w; st.fx = nx; st.fz = nz; return true;
  }
  function standsOf(o, T, gH, LOD, hsh, si0, addScene, stats, circles) {
    const A = World.api, ts = performance.now(), { seats, flat, meshes, feet, msT } = A.ownRnd(() => standBuild(o, A, hsh, T.def, circles)); stats.msStands = Math.round(performance.now() - ts); stats.msStandParts = msT;
    stats.standFeet = feet.map(f => ({ poly: f.poly, top: f.top, tx: f.tx, tz: f.tz, at: f.at || null }));   // (for the tools and tests: each stand's footprint, where its kiosk, gate and stairs are)
    for (const mm of meshes) { o.root.add(mm); const bs = mm.geometry.boundingSphere; if (o.cull) o.cull.push({ m: mm, x: bs.center.x, z: bs.center.z, r: bs.radius }); }
    // the steep ones' pictures: their seats empty (nobody on them)
    let ms = 0; for (const [M, cv] of flat) {
      A.ownRnd(() => { M.map = Tex.crowdSeats(hsh % 997 + ms++ * 31); });
      const uCV = { value: new THREE.Vector3(cv[0], cv[1], cv[2]) };
      M.onBeforeCompile = (sh) => { sh.uniforms.uCV = uCV; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uCV;').replace('#include <map_fragment>', STAND_EMPTY_FS); };
      M.customProgramCacheKey = () => 'standSeats'; M.needsUpdate = true; M.userData.seats = true;
    }
    stats.standMeshes = meshes.length; if (!seats.length) return 0;
    // who sits: along each tier now and then a group of friends (2-6), empty seats between; the most for the tier
    seed(4441 + hsh); const R = rnd, rows = new Map();
    for (const st of seats) { const key = st.m + '|' + st.row; let L = rows.get(key); if (!L) rows.set(key, L = []); L.push(st); }
    const most = STANDS.most[Math.min(2, LOD.tier)], share = Math.min(STANDS.share, most / seats.length), gap = 2.2 / share, groups = [];
    for (const L of rows.values()) { L.sort((a, b) => a.k - b.k);
      for (let i = Math.floor(R() * gap); i < L.length; i += Math.max(2, Math.round(gap * (0.4 + R() * 1.2)))) {
        const g = 2 + Math.floor(Math.pow(R(), 1.5) * 5), G = []; for (let q = 0; q < g && i < L.length; q++, i++) { if (q && L[i].k !== L[i - 1].k + 1) break; G.push(L[i]); } if (G.length) groups.push(G); } }
    let nt = 0; for (const G of groups) nt += G.length;
    while (nt > most && groups.length) { const G = groups.splice(Math.floor(R() * groups.length), 1)[0]; nt -= G.length; }   // (no more than the most: whole groups left out)
    const taken = [].concat(...groups).filter(seatAt);
    // the stretches: by the place along the road, each its own scene
    const q = {}; for (const st of taken) { T.query(st.x, st.z, -1, q); st.s = q.s; st.d = q.d; }
    taken.sort((a, b) => a.s - b.s);
    const segs = []; for (let i = 0; i < taken.length;) { let k = i + 1; while (k < taken.length && k - i < STANDS.per && taken[k].s - taken[i].s < STANDS.len) k++; segs.push({ seg: taken.slice(i, k), walk: [] }); i = k; }
    for (const g of segs) { let x = 0, y = 0, z = 0; for (const st of g.seg) { x += st.x; y += st.y; z += st.z; } const N = g.seg.length; g.c = [x / N, y / N, z / N]; }
    // the walkers (the user, 3. 11. 2026: »na tribunah naj se kakšen posameznik tudi sprehaja ali prodaja sladoled, hot dog«): on each stand a
    // vendor up and down its front walkway (ice cream or hot dogs in a box on a strap), from Srednja one with a tray of drinks up and down an
    // aisle and people going up and down the aisles (with a drink, food, a phone); each with the stretch nearest it (its people's mesh)
    const R2 = rnd; seed(6007 + hsh); let wn = 0; const wMax = STANDS.walk[Math.min(2, LOD.tier)], dS = (f) => { const L = T.len, d = ((f.s || 0) % L + L) % L; return T.open ? d : Math.min(d, L - d); };
    feet.map((f, fi) => [f, fi]).sort((a, b) => dS(a[0]) - dS(b[0])).forEach(([f, fi]) => {   // (the stands by the start first: the most of them, by the tier)
      const list = [];
      if (f.gang) list.push({ pts: f.gang, kind: fi % 2 ? 'hotbox' : 'icebox', vendor: true, v: 0.55, stop: 7, stopT: 3.5 });
      const ways = (f.ways || []).slice(), take = () => ways.length ? ways.splice(Math.floor(R2() * ways.length), 1)[0] : null;
      if (LOD.tier > 0) { const w = take(); if (w) list.push({ pts: w, kind: 'tray', vendor: true, v: 0.42, stop: 3, stopT: 4 }); }
      let flen = 0; for (let k = 1; k < f.fr3.length; k++) flen += Math.hypot(f.fr3[k].p[0] - f.fr3[k - 1].p[0], f.fr3[k].p[2] - f.fr3[k - 1].p[2]);   // (a long stand (in pieces): more)
      for (let k = LOD.tier > 0 ? 2 + Math.floor(flen / 70) : 1; k > 0; k--) { const w = take(); if (w) list.push({ pts: w, kind: ['cup', 'can', 'phone', 'hotdog', 'popcorn', null][Math.floor(R2() * 6)], v: 0.55 + R2() * 0.2, stop: 1e9, stopT: 0 }); }
      if (f.at && f.at.tvcam) list.unshift({ pts: [f.at.tvcam.slice(0, 3)], fix: f.at.tvcam, kind: null });   // (the TV cameraman on his platform)
      for (const wk of list) {
        if (wn >= wMax && !wk.fix) break;
        const m = wk.pts[wk.pts.length >> 1]; let best = null, bd = 70;
        for (const g of segs) { const d = Math.hypot(g.c[0] - m[0], g.c[2] - m[2]); if (d < bd) { bd = d; best = g; } }
        if (best) { best.walk.push(wk); wn++; }
      }
    });
    let j = 0, n = 0;
    for (const { seg, walk } of segs) {
      let sx = 0, sz = 0, sy = 0, fx = 0, fz = 0, ss = 0, dd = 0; for (const st of seg) { sx += st.x; sy += st.y; sz += st.z; fx += st.fx; fz += st.fz; ss += st.s; dd += st.d; }
      const N = seg.length, s0 = ss / N, sd = dd >= 0 ? 1 : -1, F = frame(T, gH, s0, sd), C = ctxOf(F);
      const X = new THREE.Vector3(F.tx, 0, F.tz).normalize(), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(-X.z, 0, X.x); if (Z.x * fx + Z.z * fz < 0) Z.negate();
      const O = new THREE.Vector3(F.px, 0, F.pz), yaw = Math.atan2(fx, fz), m4 = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(O);
      C.groups.st = { m: m4, yaw }; C.len = Math.max(8, seg[N - 1].s - seg[0].s); C.seats = [];
      seed(5113 + hsh + j * 97);
      let r = 0; const cx = sx / N, cy = sy / N, cz = sz / N; for (const st of seg) r = Math.max(r, Math.hypot(st.x - cx, st.y - cy, st.z - cz));
      for (const st of seg) {
        const team = SHIRT[Math.floor(rnd() * SHIRT.length)], P = C.man({ lite: true, shirt: rnd() < 0.5 ? team : SHIRT[Math.floor(rnd() * SHIRT.length)], hat: rnd() < 0.3 ? 'cap' : null, scale: 0.93 + rnd() * 0.08 }, null);
        const dx = st.x - O.x, dz = st.z - O.z;
        P.seat = { x: dx * X.x + dz * X.z, r: st.row, y: st.y, z: dx * Z.x + dz * Z.z, k: rnd() }; C.seats.push(P);
        // what it does while it waits (SEAT_ACTS: the share, the pose, the things in its hand), under a roof or not (an umbrella in the rain)
        let u = rnd(); const a = SEAT_ACTS.find(e => (u -= e[0]) < 0);
        if (a) { P.seat.pose = a[1]; const it = a[2][Math.floor(rnd() * a[2].length)]; P.items = ['R:' + it + (it === 'mflag' ? ':' + JSON.stringify({ c: pick(SHIRT) }) : it === 'icecream' ? ':' + JSON.stringify({ c: pick([0xf0b8c8, 0xf5e6c8, 0x8a5a3c, 0xb8e0a0]) }) : '')]; P.show = new Set(P.items); P.seat.up = it === 'phone' ? 'phoneUp' : it === 'mflag' ? 'wave' : null; }
        P.roof = roofed(feet, st.x, st.y, st.z);
      }
      for (const wk of walk) {   // the walkers (full figures: hands and shoes; a vendor in its white shirt and cap); the TV cameraman
        if (wk.fix) { const P = C.man({ shirt: 0x1b1d22, pants: 0x2a2f3a, vest: 0xf2c21a, stripes: 0xd9dde2 }, null); P.fix = { x: wk.fix[0], y: wk.fix[1], z: wk.fix[2], yaw: wk.fix[3] }; P.items = ['H:camera']; P.show = new Set(P.items); P.roof = true;
          r = Math.max(r, Math.hypot(wk.fix[0] - cx, wk.fix[1] - cy, wk.fix[2] - cz)); continue; }
        const P = C.man(wk.vendor ? { shirt: 0xf2f2ee, pants: 0x2a2f3a, hat: 'cap', hatCol: wk.kind === 'hotbox' ? 0xd8262a : 0x2f63c9 } : { shirt: pick(SHIRT), hat: rnd() < 0.3 ? 'cap' : null }, null);
        const cum = [0]; for (let k = 1; k < wk.pts.length; k++) { const a = wk.pts[k - 1], b = wk.pts[k]; cum.push(cum[k - 1] + Math.hypot(b[0] - a[0], (b[1] - a[1]) * 1.5, b[2] - a[2])); }
        const L = cum[cum.length - 1], cyc = wk.stop / wk.v + wk.stopT, leg = L / wk.v + Math.floor(L / wk.stop) * wk.stopT, wait = wk.vendor ? 5 : 2 + rnd() * 3;
        const e0 = wk.pts[0], e1 = wk.pts[wk.pts.length - 1], fl = Math.hypot(e1[0] - e0[0], e1[2] - e0[2]) || 1;
        P.walk = { pts: wk.pts, cum, L, v: wk.v, stop: wk.stop, cyc, leg, wait, per: 2 * (leg + wait), ph: rnd(), carry: !!wk.vendor, face: wk.vendor && wk.kind !== 'tray' ? [-fx, -fz] : null, dir: [(e1[0] - e0[0]) / fl, (e1[2] - e0[2]) / fl] };
        if (wk.kind) { P.items = ['R:' + wk.kind]; P.show = new Set(P.items); }
        for (const p of wk.pts) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cy, p[2] - cz));
        P.roof = roofed(feet, wk.pts[wk.pts.length >> 1][0], wk.pts[wk.pts.length >> 1][1], wk.pts[wk.pts.length >> 1][2]) || !!wk.vendor;   // (a vendor's hands are full: no umbrella)
      }
      const Sc = addScene('tribune', F, s0, sd, { stand: true }, C, si0 + j, Math.round(s0 - (T.startS || 0)), [cx, cy + 1, cz, r + 3]); Sc.lift = 0; Sc.fwd = 0.45; j++; n += N + walk.length;
    }
    stats.standWalkers = wn;
    stats.standSeats = seats.length; stats.standPeople = n; stats.standScenes = j;
    return n;
  }
  World.people = function (o) {
    const A = World.api, T = A.T, def = T && T.def;
    if (!def || def.test || !o || !o.root || typeof o.groundH !== 'function') return null;
    const list = (SITES[def.id] || []).slice();
    // (no scene at the player's box on a circuit: its world builds the team stands on the pit wall's strip, the renderer seats the engineer and the crews)
    if (!list.length && !(STANDS && hasStands(o))) return null;
    const t0 = performance.now(), LOD = A.LOD, gH = o.groundH, K0 = FLAGS[def.id] || {}, hsh = Math.abs([...def.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7));
    const W = { T, scenes: [], frame: 0, wx: 0.8, wz: 0.6, smoke: null, q: {}, hint: -1, cs: null, v: 0, lt: 0,
      rShow: LOD.tier >= 2 ? 650 : LOD.tier === 1 ? 420 : 280, rPpl: LOD.tier >= 2 ? 240 : LOD.tier === 1 ? 170 : 120, rPose: LOD.tier >= 2 ? 200 : LOD.tier === 1 ? 150 : 110 };
    const matL = new THREE.MeshLambertMaterial({ vertexColors: true }), matU = new THREE.MeshBasicMaterial({ vertexColors: true });
    const root = new THREE.Group(); root.name = 'people'; root.userData.lj = true; o.root.add(root); W.root = root; W.o = o;
    const circles = [], stats = { scenes: [], people: 0, verts: 0, propVerts: 0 };
    let nPuff = 0;
    // one scene into the world: its things baked, its people (one mesh, posed when near), its frame; d: its kind (S), C: its build
    const addScene = (name, F, s, sd, d, C, si, at, box) => {
      const Sc = { name, F, s0: s, side: sd, groups: C.groups, people: [], pets: [], movers: [], smoke: [], stand: !!d.stand, k: si, on: false };
      const rec = (P, st) => { const kid = !!(st && st.kid), f = st && st.run && st.run.f || 0.55;
        return { P, st, d0: kid ? 0.08 + rnd() * 0.2 : 0.2 + rnd() * 0.85, v: (3.4 + 4 * f) * (kid ? 0.92 : 1), bd: rnd() * 1.4, ph: rnd(), segs: null }; };
      for (const P of C.people) { rig(P, P.st ? itemsOf(P.st) : new Set(P.items || [])); Sc.people.push(rec(P, P.st)); }
      Sc.people.forEach((p, i) => { const h = hash32(si * 1009 + i * 31 + 7), st = p.st, staff = st && (st.run === false || (st.run && st.run.a != null));   // (an umbrella in the rain: 3 in 4, not under a roof, not the staff)
        p.um = h % 1000 < 750 && !p.P.roof && !staff && !STAFF_SCENES.has(name) && !BUSY_HANDS.has(name); p.uk = (h >>> 10) % UMB_COLS.length; });
      for (const pt of C.pets) Sc.pets.push(rec(rigid(pt.model), pt.st));
      for (const mv of C.movers) Sc.movers.push({ P: rigid(mv.model), on: mv.on, x: mv.x, y: mv.y, z: mv.z, yaw: 0 });
      if (!Sc.stand) { const tg = performance.now(); Sc.G = wayGrid(F, [C.L, C.U]); for (const p of Sc.people.concat(Sc.pets)) p.G = Sc.G;   // (the ways round its things)
        if (Sc.G) { Sc.al = 0; for (const p of Sc.people) if (p.st && p.st.act && !pacing(p.st.act)) { p.segs = planOut(p, 0); planBack(p, Sc, 30); } }   // (found now, at the load, not as the car comes: route keeps them; a pacer's way out starts where it is then)
        stats.msWays = (stats.msWays || 0) + performance.now() - tg; }
      reset(Sc);
      // the people's mesh: every figure's parts one after the other (their colours fixed, their places written when posed)
      const all = Sc.people.map(p => p.P).concat(Sc.pets.map(p => p.P), Sc.movers.map(m => m.P));
      let nv = 0; for (const P of all) for (const pt of P.parts) { pt.o = nv * 3; nv += pt.P.length / 3; }
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
      for (const P of all) for (const pt of P.parts) col.set(pt.C, pt.o);
      const cb = C.cb != null ? C.cb : 6, [cx, cz] = box ? [box[0], box[2]] : F.w(0, cb), cy = box ? box[1] : F.y(0, cb) + 2, r = box ? box[3] : d.r || 24;   // (C.cb: its middle farther from the road)
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
      if (Sc.stand) { const G = C.groups.st; Sc.sgn = Math.sign(G.m.elements[0] * F.tx + G.m.elements[2] * F.tz) || 1; Sc.len = C.len || 20; }
      for (const e of C.smoke) { e.i = nPuff; e.ph = rnd(); nPuff += e.n; Sc.smoke.push(e); }
      for (const [a, b, rr] of C.clear || d.clear || []) { const [x, z] = F.w(a, b); circles.push([x, z, rr]); }   // (C.clear: a build's own, where its place moves its things: the anglers at a lake's real shore)
      W.scenes.push(Sc);
      stats.scenes.push({ name, at, side: sd, s: Math.round(s), people: Sc.people.length, pets: Sc.pets.length, verts: nv, propVerts: pv });
      stats.people += Sc.people.length; stats.verts += nv; stats.propVerts += pv;
      return Sc;
    };
    list.forEach(([name, at, side, opt], si) => {
      const d = S[name]; if (!d) return;
      const s = T.startS + at; if (T.open && (s < 0 || s > T.len)) return;
      const sd = side === 'room' ? roomSide(T, s) : side, F = frame(T, gH, s, sd), K = Object.assign({ flag: DE }, K0, opt || {});
      seed(1000 + (d.seed || 5) * 7919 + hsh + si * 31);
      const C = ctxOf(F); d.build(C, F, K);
      addScene(name, F, s, sd, d, C, si, at);
    });
    if (STANDS) standsOf(o, T, gH, LOD, hsh, list.length, addScene, stats, circles);
    if (!W.scenes.length) return null;
    if (nPuff) {   // the smoke of every scene of this world: one instanced mesh (ROAD DECAL ORDER: blended over the road's decals, as Longford's)
      const M = W.smoke = new THREE.InstancedMesh(puffGeo(), new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.32, depthWrite: false }), nPuff);
      const c = new THREE.Color(); for (const Sc of W.scenes) for (const e of Sc.smoke) { c.setHex(e.col); for (let k = 0; k < e.n; k++) M.setColorAt(e.i + k, c); } M.instanceColor.noSeason = true;
      M.frustumCulled = false; M.renderOrder = 4; M.name = 'sceneSmoke'; root.add(M);
    }
    { let nu = 0; for (const Sc of W.scenes) for (const p of Sc.people) if (p.um) nu++;   // the umbrellas: as many as hold one (only the posed scenes' near drawn)
      if (nu) { const M = W.umb = new THREE.InstancedMesh(umbGeo(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), nu); M.um = nu;
        M.setColorAt(0, new THREE.Color(1, 1, 1)); M.instanceColor.noSeason = true; M.count = 0; M.visible = false; M.frustumCulled = false; M.castShadow = false; M.receiveShadow = true; M.name = 'umbrellas'; root.add(M); }
      stats.umbrellas = nu; }
    const t1 = performance.now(); stats.cleared = clearAll(o, circles, A); stats.ms = Math.round(performance.now() - t0); stats.msClear = Math.round(performance.now() - t1);
    o.dyn.people = (t, car, cam, rp) => step(W, t, car, cam, rp);
    step(W, 0, null, null);
    o.peopleStats = stats; o.peopleW = W;
    return stats;
  };
  World.peopleSites = SITES;   // (for the tests and the docs)
  // the ground of a track's scenes before they are built ([x, z, r]: their kinds' clear circles), for a world that merges its own verge into
  // its chunks (shrubs, tufts, rocks: clearAll takes out only the instanced ones) to keep it free there: Vršič (its exclusion circles)
  World.peopleGround = function (T) {
    const def = T && T.def, out = []; if (!def || def.test) return out;
    for (const [name, at, side] of SITES[def.id] || []) {
      const d = S[name]; if (!d) continue;
      const s = T.startS + at; if (T.open && (s < 0 || s > T.len)) continue;
      const F = frame(T, () => 0, s, side === 'room' ? roomSide(T, s) : side);
      for (const [a, b, r] of d.clear && d.clear.length ? d.clear : [[0, 7, 13]]) { const [x, z] = F.w(a, b); out.push([x, z, r]); }
    }
    return out;
  };
  // the kit for more scene types in files of their own (js/world-ljudje2.js, js/world-ljudje3.js): the scenes, the props, more hand things, hats and poses, the motions, the
  // places, the scene's own random numbers (seeded per scene by World.people: a scene's build uses rnd and pick only), the palettes
  World.peopleKit = { S, L, ITEMX, POSEX, MOTION, RATE, SITES, FLAGS, STAFF_SCENES, HATX, SUMMER, BUSY_HANDS, rnd, pick, seed, box, cyl, sph, grp, bar, item, pal: { SKIN, HAIR, SHIRT, PANTS } };
})();
