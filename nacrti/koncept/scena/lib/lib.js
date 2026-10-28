// PR: props for the concept pictures of the garage (run inside the garage page: THREE, Garage3D, Core, __garage exist).
// Everything is built into Garage3D.scene (the real room, light and car are the picture's background) and removed by PR.reset().
// World coordinates: the turntable's middle is (0,0,0), the floor y = 0, the car faces +x, its left/right sides are +-z. The default
// camera stands at +x +z looking at the car (PR.cam). Colours are hex numbers (0xrrggbb) or [r,g,b] 0..1.
(() => {
  const T = THREE, G3 = Garage3D, sc = G3.scene, TXG = G3._dbg.TX.glow;
  const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
  const P3 = (a) => a && a.isVector3 ? a.clone() : V(a[0], a[1], a[2]);
  const PR = window.PR = { objs: [], V, P3, T };
  const add = (o, parent) => { (parent || sc).add(o); if (!parent) PR.objs.push(o); return o; };
  PR.add = add;
  PR.group = () => add(new T.Group());
  // ---- materials (cached) ----
  const MC = {};
  PR.mat = (col, o = {}) => { const k = 'p' + col + JSON.stringify(o); return MC[k] || (MC[k] = new T.MeshPhongMaterial(Object.assign({ color: col, shininess: 40, specular: 0x333333 }, o))); };
  PR.lam = (col, o = {}) => { const k = 'l' + col + JSON.stringify(o); return MC[k] || (MC[k] = new T.MeshLambertMaterial(Object.assign({ color: col }, o))); };
  PR.glow = (col, k = 2) => new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k) });   // (over 1: it blooms)
  PR.glass = (col = 0x9fd6ff, op = 0.18) => new T.MeshPhongMaterial({ color: col, transparent: true, opacity: op, shininess: 120, specular: 0xffffff, depthWrite: false, side: T.DoubleSide });
  // ---- geometry helpers: all take the group g to add to ----
  const sh = (o) => { o.castShadow = o.receiveShadow = true; return o; };
  PR.box = (g, w, h, d, x, y, z, m, ry = 0, rx = 0, rz = 0) => { const o = sh(new T.Mesh(new T.BoxGeometry(w, h, d), m)); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; };
  PR.cyl = (g, rT, rB, h, x, y, z, m, seg = 16, rx = 0, rz = 0) => { const o = sh(new T.Mesh(new T.CylinderGeometry(rT, rB, h, seg), m)); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); g.add(o); return o; };
  PR.sph = (g, r, x, y, z, m, seg = 14, sx = 1, sy = 1, sz = 1) => { const o = sh(new T.Mesh(new T.SphereGeometry(r, seg, seg - 4), m)); o.position.set(x, y, z); o.scale.set(sx, sy, sz); g.add(o); return o; };
  // a round bar from a to b (r at a, r2 at b)
  PR.bone = (g, a, b, r, m, seg = 10, r2) => { a = P3(a); b = P3(b); const d = b.clone().sub(a), L = d.length(); if (L < 1e-5) return null; const o = sh(new T.Mesh(new T.CylinderGeometry(r2 == null ? r : r2, r, L, seg), m)); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); g.add(o); return o; };
  // a flat bar from a to b: w wide, h high (its up axis `up`)
  PR.sbox = (g, a, b, w, h, m, up = V(0, 1, 0)) => { a = P3(a); b = P3(b); const L = a.distanceTo(b); if (L < 1e-5) return null; const o = sh(new T.Mesh(new T.BoxGeometry(w, h, L), m)); o.position.copy(a).add(b).multiplyScalar(0.5); o.up.copy(up); o.lookAt(b); g.add(o); return o; };
  // two-bone IK: the elbow between a and b (lengths l1, l2), bending towards `hint`
  PR.ik2 = (a, b, l1, l2, hint) => { a = P3(a); b = P3(b); const d = b.clone().sub(a); let L = d.length(); L = Math.min(L, l1 + l2 - 1e-3); L = Math.max(L, Math.abs(l1 - l2) + 1e-3); const dir = d.normalize(), x = (L * L + l1 * l1 - l2 * l2) / (2 * L), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
    const hp = P3(hint).sub(dir.clone().multiplyScalar(P3(hint).dot(dir))); if (hp.lengthSq() < 1e-6) hp.set(0, 1, 0).sub(dir.clone().multiplyScalar(dir.y)); hp.normalize();
    return a.clone().addScaledVector(dir, x).addScaledVector(hp, h); };
  PR.reach = (a, b, l1, l2) => Math.min(P3(a).distanceTo(P3(b)), l1 + l2 - 1e-3);   // how far a limb reaches towards b
  // ---- soft things: sprites (mist, glows, labels) ----
  const spriteMat = (col, op, additive, map) => new T.SpriteMaterial({ map: map || TXG, color: col, transparent: true, depthWrite: false, opacity: op, blending: additive ? T.AdditiveBlending : T.NormalBlending });
  PR.spr = (g, p, s, col, op = 0.5, additive = false, map) => { const o = new T.Sprite(spriteMat(col, op, additive, map)); o.position.copy(P3(p)); o.scale.setScalar(s); o.renderOrder = 12; (g || sc).add(o); if (!g) PR.objs.push(o); return o; };
  // a cone of mist from a towards b (n puffs growing along it): water (white-blue) or paint (its colour)
  PR.mist = (a, b, col, o = {}) => { a = P3(a); b = P3(b); const n = o.n || 36, r0 = o.r0 || 0.03, r1 = o.r1 || 0.3, op = o.op == null ? 0.3 : o.op, g = new T.Group(); let s = o.seed || 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const d = b.clone().sub(a), L = d.length(), u = d.clone().normalize(), s1 = new T.Vector3().crossVectors(u, V(0, 1, 0.01)).normalize(), s2 = new T.Vector3().crossVectors(u, s1);
    for (let i = 0; i < n; i++) { const t = Math.pow(R(), 0.8), r = lerp(r0, r1, t), p = a.clone().addScaledVector(u, t * L).addScaledVector(s1, (R() - 0.5) * 2 * r * 0.8).addScaledVector(s2, (R() - 0.5) * 2 * r * 0.8); PR.spr(g, p, r * (1.2 + R()), col, op * (0.4 + 0.6 * R()), !!o.additive); }
    add(g); return g; };
  const lerp = (a, b, t) => a + (b - a) * t; PR.lerp = lerp;
  // a straight water jet: bright streaks and drops from a to b
  PR.jet = (a, b, o = {}) => { a = P3(a); b = P3(b); const g = new T.Group(), n = o.n || 14, col = o.col || 0xcfeaff; let s = o.seed || 3; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const d = b.clone().sub(a), L = d.length();
    for (let i = 0; i < n; i++) { const t0 = R() * 0.7, t1 = Math.min(1, t0 + 0.15 + R() * 0.3), j = () => V((R() - 0.5), (R() - 0.5), (R() - 0.5)).multiplyScalar(0.06 * (t0 + 0.3) * (o.spread || 1));
      const p = a.clone().addScaledVector(d, t0).add(j()), q = a.clone().addScaledVector(d, t1).add(j()); PR.bone(g, p, q, 0.012 + R() * 0.01, new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(1.3), transparent: true, opacity: 0.7 + 0.25 * R() }), 5); }
    for (let i = 0; i < 16; i++) { const t = 0.75 + R() * 0.55, p = a.clone().addScaledVector(d, t).add(V((R() - 0.5) * 0.35, (R() - 0.5) * 0.3 + 0.05, (R() - 0.5) * 0.35)); PR.sph(g, 0.012 + R() * 0.014, p.x, p.y, p.z, new T.MeshBasicMaterial({ color: 0xeaf6ff }), 6); }
    PR.mist(b, b.clone().addScaledVector(d.clone().normalize(), 0.25), 0xe8f4ff, { n: 22, r0: 0.06, r1: 0.3, op: 0.45, seed: 11 + (o.seed || 0) });   // (the splash where it hits)
    add(g); return g; };
  PR.beam = (a, b, col, w = 0.02, op = 0.7) => { const g = new T.Group(); const m = new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(1.6), transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false }); PR.bone(g, a, b, w, m, 6); add(g); return g; };
  // a text label (a floating plate): canvas text on a sprite
  PR.label = (p, text, o = {}) => { const c = document.createElement('canvas'), w = o.w || 420, h = o.h || 110; c.width = w; c.height = h; const x = c.getContext('2d');
    x.fillStyle = o.bg || 'rgba(8,16,30,0.82)'; x.strokeStyle = o.col || '#6cc8f7'; x.lineWidth = 6; const r = 18; x.beginPath(); x.moveTo(r, 3); x.lineTo(w - r, 3); x.quadraticCurveTo(w - 3, 3, w - 3, r); x.lineTo(w - 3, h - r); x.quadraticCurveTo(w - 3, h - 3, w - r, h - 3); x.lineTo(r, h - 3); x.quadraticCurveTo(3, h - 3, 3, h - r); x.lineTo(3, r); x.quadraticCurveTo(3, 3, r, 3); x.fill(); x.stroke();
    x.fillStyle = o.fg || '#ffffff'; x.font = (o.font || 'italic 900 44px') + ' Roboto, Arial, sans-serif'; x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillText(text, w / 2, h / 2 + 2, w - 30);
    const t = new T.CanvasTexture(c); const s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.position.copy(P3(p)); s.scale.set((o.s || 1) * w / 300, (o.s || 1) * h / 300, 1); s.renderOrder = 30; add(s); return s; };
  // ---- the car ----
  PR.car = () => G3.cur;
  PR.cars = () => { const c = G3.cur, a = [c]; c.root.children.forEach(x => { if (x.userData && x.userData.cv && x.userData.cv !== c) a.push(x.userData.cv); }); return a; };
  PR.raise = (h) => { for (const c of PR.cars()) { c.v.grp.position.y = h; if (c.contact) c.contact.visible = h < 0.03; if (c.v.blob) c.v.blob.visible = h < 0.03; } PR.liftH = h; };
  PR.kit = () => G3.cur.kit;
  // the soft shadow on the floor under a raised car
  PR.floorShadow = (o = {}) => { const K = G3.cur.kit, g = PR.group(), len = (K.front - K.rear), m = new T.MeshBasicMaterial({ map: G3._dbg.TX.under, transparent: true, depthWrite: false, opacity: o.op == null ? 0.75 : o.op }); const p = new T.Mesh(new T.PlaneGeometry(len * 1.25, K.hw * 2 * 1.45), m); p.rotation.x = -Math.PI / 2; p.position.set((K.front + K.rear) / 2, 0.02, 0); p.renderOrder = 3; g.add(p); return g; };
  // the car's colour / wear straight away (no show): PR.setCar({ color, stripe, clean, body, engine })
  PR.setCar = (o) => { const s = Object.assign({}, G3.cur.spec); if (o.color != null) s.color = o.color; if (o.stripe != null) s.stripe = o.stripe; s.cond = Object.assign({}, s.cond, { clean: o.clean != null ? o.clean : 1, body: o.body != null ? o.body : 1, engine: o.engine != null ? o.engine : 1 }); G3.show(s); __garage.advance(0.05); return G3.cur; };
  PR.dirt = (v) => { const c = G3.cur; if (c.v.dirtU) c.v.dirtU.value = v; };   // 0 clean .. 0.75 filthy (a whole-car value: mid-way pictures)
  PR.scratch = (v) => { const c = G3.cur; if (c.v.scrU) c.v.scrU.value = v; };    // 0 none .. 1 many
  // the real paint show, run to the middle of its sweep and frozen: the old colour on one side of a plane, the new on the other. Needs a FRESH page
  // (frame option fresh: true): the show's queue never finishes. split: { x } or { y, up: true } (the new colour below y when up)
  PR.paintSplit = async (color, stripe, o = {}) => {
    G3.paint(color, stripe); await new Promise(r => setTimeout(r, 0));
    __garage.advance(1.1 + 0.6 + 0.8);
    const cv = G3.cur, nw = cv.root.children.find(c => c.userData && c.userData.cv && c.userData.cv !== cv).userData.cv;
    G3._dbg.tasks.length = 0; PR.dummy = false;
    const arch = cv.v.grp.children.find(c => c.userData && c.userData.noz); if (arch) arch.visible = false;
    cv.root.parent.rotation.y = 0;
    PR.splitCars = { old: cv, nw };
    PR.setSplit(o);
    return { old: cv, nw };
  };
  PR.setSplit = (o) => { const { old, nw } = PR.splitCars;
    if (o.y != null) { old.clip.set(V(0, 1, 0), -o.y); nw.clip.set(V(0, -1, 0), o.y); }   // (the new colour BELOW y)
    else { old.clip.set(V(-1, 0, 0), o.x); nw.clip.set(V(1, 0, 0), -o.x); } };             // (the new colour BEHIND x: x larger = more still old... see PR.split notes)
  // ---- the camera: yaw round the car (0 = from +z, 0.55 = the garage's default), pitch up, dist away, the look-at point ----
  PR.cam = (yaw = 0.55, pitch = 0.16, dist = 7, tx = 0, ty = 0.7, tz = 0, fov = 33) => { const r = G3._dbg.rig; Object.assign(r, { yaw, pitch, dist, tx, ty, tz, fov }); G3._dbg.user.yaw = 0; G3._dbg.user.vy = 0; };
  // ---- the two-post lift: where it always stands, and the car on it at height h ----
  PR.lift = (h = 0, o = {}) => {
    const car = G3.cur, K = car.kit, g = PR.group(), len = K.front - K.rear, mx = (K.front + K.rear) / 2 - (o.dx != null ? o.dx : 0.12), pz = K.hw + (o.gap != null ? o.gap : 0.66), H = o.H || 3.2, sill = Math.max(0.16, K.bottom + 0.02);
    const BL = PR.mat(o.col || 0x1f46c8, { shininess: 80, specular: 0x7a96ff }), BL2 = PR.mat(0x3b66ee, { shininess: 60 }), DK = PR.mat(0x1b1d22, { shininess: 30 }), YL = PR.mat(0xf2c230, { shininess: 30 }), ST = PR.mat(0x9aa1ab, { shininess: 100, specular: 0xffffff }), RB = PR.lam(0x101113), WH = PR.mat(0xe9eef5);
    const ay = h + sill - 0.095;   // the arms' height: their pads touch the sills
    for (const s of [-1, 1]) {
      PR.box(g, 1.2, 0.05, 0.66, mx, 0.025, s * pz, DK);                                   // the base plate
      for (const e of [-1, 1]) PR.box(g, 1.2, 0.052, 0.07, mx, 0.026, s * pz + e * 0.3, YL);  // (yellow edges)
      PR.box(g, 0.34, 0.5, 0.24, mx, 0.3, s * pz, DK);                                      // the foot
      PR.box(g, 0.28, H, 0.19, mx, 0.05 + H / 2 + 0.2, s * pz, BL);                         // the column
      PR.box(g, 0.1, H - 1.1, 0.006, mx, 0.7 + (H - 1.1) / 2, s * (pz - 0.097), BL2);      // (a lighter strip on its inner face)
      PR.box(g, 0.2, 0.34, 0.006, mx, 1.35, s * (pz - 0.097), WH);                          // (a blank label)
      PR.box(g, 0.31, 0.06, 0.22, mx, H + 0.28, s * pz, DK);                                // the cap
      PR.box(g, 0.05, H * 0.55, 0.05, mx + 0.19, 0.4 + H * 0.275, s * pz, DK);              // the hydraulic hose cover
      // the carriage and its two swing arms to the sills
      PR.box(g, 0.48, 0.52, 0.34, mx, ay + 0.06, s * pz, ST);
      PR.box(g, 0.5, 0.1, 0.36, mx, ay + 0.34, s * pz, DK);
      for (const sx of [-1, 1]) {
        const padX = mx + sx * (sx > 0 ? len * 0.2 : len * 0.21), padZ = s * (K.hw - 0.24), a0 = V(mx + sx * 0.1, ay, s * (pz - 0.2)), a1 = V(mx + sx * 0.3, ay, s * (pz - 0.62)), a2 = V(padX, ay, padZ);
        PR.sbox(g, a0, a1, 0.12, 0.085, ST); PR.sbox(g, a1, a2, 0.1, 0.075, ST); PR.sph(g, 0.065, a1.x, ay, a1.z, DK, 10);
        PR.cyl(g, 0.085, 0.085, 0.06, padX, ay + 0.07, padZ, RB, 18); PR.cyl(g, 0.03, 0.03, 0.08, padX, ay + 0.03, padZ, ST, 8);
      }
    }
    PR.raise(h);
    return g;
  };
  // ---- people: a mechanic (low-poly, in the team's navy overalls) ----
  // o: x, z (feet), ry (facing: 0 = +z, pi/2 = +x), crouch 0..1, lean (rad forward), hands: [left, right] world targets (or null), look: target, hold: [fnLeft, fnRight] (hand, dir -> adds a tool)
  PR.person = (o) => {
    const g = PR.group(), S = o.suit != null ? o.suit : 0x1b2b5c, AC = o.accent != null ? o.accent : 0xf5c84c, SK = o.skin != null ? o.skin : 0xd9a98a, CAP = o.cap != null ? o.cap : 0x1b2b5c;
    const mS = PR.mat(S, { shininess: 12, specular: 0x222222 }), mA = PR.lam(AC), mK = PR.mat(SK, { shininess: 14 }), mB = PR.lam(0x16171a), mG = PR.lam(o.glove != null ? o.glove : 0x2a2d33), mC = PR.mat(CAP, { shininess: 14 }), mW = PR.lam(0xf4f4f0), mE = PR.lam(0x15110d);
    const f = V(Math.sin(o.ry || 0), 0, Math.cos(o.ry || 0)), r = V(Math.cos(o.ry || 0), 0, -Math.sin(o.ry || 0)), up = V(0, 1, 0), cr = o.crouch || 0, lean = o.lean || 0, sc_ = o.scale || 1.04;
    const hipY = lerp(0.95, 0.5, cr) * sc_, base = V(o.x || 0, 0, o.z || 0);
    const P = base.clone().add(V(0, hipY, 0)).addScaledVector(f, o.hipFwd != null ? o.hipFwd : -0.3 * cr);
    const tdir = up.clone().multiplyScalar(Math.cos(lean)).addScaledVector(f, Math.sin(lean)), S0 = P.clone().addScaledVector(tdir, 0.54 * sc_);
    // legs (thick, slightly bent), boots
    const hipsW = 0.105 * sc_; const L1 = 0.47 * sc_, L2 = 0.47 * sc_;
    for (const sd of [-1, 1]) { const hp = P.clone().addScaledVector(r, sd * hipsW), ft = base.clone().addScaledVector(r, sd * 0.14 * sc_).addScaledVector(f, (o.stride || 0) * -sd * 0.2 * sc_).add(V(0, 0.08, 0)); if (o.kneel && sd > 0) ft.copy(base).addScaledVector(r, 0.12).addScaledVector(f, -0.38).add(V(0, 0.08, 0));
      const kn = PR.ik2(hp, ft, L1, L2, f.clone().addScaledVector(up, 0.05)); PR.bone(g, hp, kn, 0.095 * sc_, mS, 10, 0.08 * sc_); PR.bone(g, kn, ft, 0.08 * sc_, mS, 10, 0.062 * sc_); PR.sph(g, 0.082 * sc_, kn.x, kn.y, kn.z, mS, 8);
      const stripe = PR.bone(g, hp.clone().lerp(kn, 0.2).addScaledVector(r, sd * 0.08 * sc_), kn.clone().addScaledVector(r, sd * 0.07 * sc_), 0.014, mA, 5);
      PR.box(g, 0.12 * sc_, 0.1 * sc_, 0.3 * sc_, ft.x + f.x * 0.07, 0.05, ft.z + f.z * 0.07, mB, o.ry || 0); }
    // torso: hips, chest, belt, collar, a zip
    PR.bone(g, P, S0, 0.175 * sc_, mS, 12, 0.215 * sc_); PR.sph(g, 0.185 * sc_, P.x, P.y, P.z, mS, 10, 1.08, 0.78, 0.92);
    const wst = P.clone().addScaledVector(tdir, 0.15 * sc_); PR.bone(g, wst.clone().addScaledVector(tdir, -0.022), wst.clone().addScaledVector(tdir, 0.022), 0.187 * sc_, mA, 12);
    const zp = S0.clone().addScaledVector(f, 0.205 * sc_); PR.bone(g, P.clone().addScaledVector(tdir, 0.1).addScaledVector(f, 0.19 * sc_), zp.clone().addScaledVector(tdir, -0.02), 0.012, mW, 5);
    // head: skin, ears, eyes, a cap with a brim and a gold band
    const nk = S0.clone().addScaledVector(tdir, 0.06 * sc_), look = o.look ? P3(o.look).sub(nk).normalize() : f.clone(), hd = nk.clone().addScaledVector(up, 0.18 * sc_).addScaledVector(look, 0.02);
    const lr = new T.Vector3().crossVectors(up, look).normalize();
    PR.cyl(g, 0.055 * sc_, 0.062 * sc_, 0.12 * sc_, nk.x, nk.y + 0.02, nk.z, mK, 8); PR.cyl(g, 0.09 * sc_, 0.1 * sc_, 0.03 * sc_, nk.x, nk.y - 0.015, nk.z, mW, 12);
    PR.sph(g, 0.125 * sc_, hd.x, hd.y, hd.z, mK, 14, 0.97, 1.08, 1);
    for (const sd of [-1, 1]) { const e = hd.clone().addScaledVector(look, 0.108 * sc_).addScaledVector(lr, sd * 0.045 * sc_).add(V(0, 0.015, 0)); PR.sph(g, 0.014 * sc_, e.x, e.y, e.z, mE, 6); const ear = hd.clone().addScaledVector(lr, sd * 0.12 * sc_); PR.sph(g, 0.03 * sc_, ear.x, ear.y, ear.z, mK, 6); }
    const nz = hd.clone().addScaledVector(look, 0.123 * sc_).add(V(0, -0.012, 0)); PR.sph(g, 0.02 * sc_, nz.x, nz.y, nz.z, mK, 6);
    const cp = new T.Mesh(new T.SphereGeometry(0.138 * sc_, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), mC); sh(cp); cp.position.copy(hd).add(V(0, 0.025 * sc_, 0)); cp.scale.set(1, 0.95, 1.02); g.add(cp);
    const bp = hd.clone().addScaledVector(look, 0.13 * sc_).add(V(0, 0.03 * sc_, 0)); const br = PR.box(g, 0.2 * sc_, 0.016, 0.11 * sc_, bp.x, bp.y, bp.z, mC); br.lookAt(bp.clone().add(look));
    const band = new T.Mesh(new T.TorusGeometry(0.139 * sc_, 0.011, 6, 20), mA); band.position.copy(hd).add(V(0, 0.026 * sc_, 0)); band.rotation.x = Math.PI / 2; g.add(band);
    // arms: shoulders, sleeves with a gold ring, gloves
    const AL = 0.32 * sc_, AR = 0.3 * sc_;
    for (let i = 0; i < 2; i++) { const sd = i === 0 ? -1 : 1, sh_ = S0.clone().addScaledVector(r, sd * 0.215 * sc_).addScaledVector(tdir, -0.03);
      let hand = o.hands && o.hands[i] ? P3(o.hands[i]) : sh_.clone().addScaledVector(r, sd * 0.11).addScaledVector(up, -0.52 * sc_).addScaledVector(f, 0.06);
      const dh = hand.clone().sub(sh_); if (dh.length() > AL + AR - 0.01) hand = sh_.clone().addScaledVector(dh.normalize(), AL + AR - 0.01);
      const el = PR.ik2(sh_, hand, AL, AR, r.clone().multiplyScalar(sd * 0.55).addScaledVector(up, -0.7).addScaledVector(f, -0.25));
      PR.bone(g, sh_, el, 0.068 * sc_, mS, 10, 0.06 * sc_); PR.bone(g, el, hand, 0.056 * sc_, mS, 10, 0.05 * sc_); PR.sph(g, 0.075 * sc_, sh_.x, sh_.y, sh_.z, mS, 10); PR.sph(g, 0.06 * sc_, el.x, el.y, el.z, mS, 8);
      const q = el.clone().lerp(hand, 0.62), q2 = el.clone().lerp(hand, 0.7); PR.bone(g, q, q2, 0.058 * sc_, mA, 10);
      PR.sph(g, 0.058 * sc_, hand.x, hand.y, hand.z, mG, 8);
      if (o.hold && o.hold[i]) o.hold[i](hand, hand.clone().sub(el).normalize(), g); }
    return g;
  };
  // ---- tools a hand can hold: (hand, dir, g) => adds to g ----
  PR.tools = {
    lance: (len = 0.9, col = 0xc8ccd2) => (h, d, g) => { const e = h.clone().addScaledVector(d, len); PR.bone(g, h.clone().addScaledVector(d, -0.08), e, 0.018, PR.mat(col, { shininess: 100 }), 6); PR.bone(g, e, e.clone().addScaledVector(d, 0.06), 0.03, PR.mat(0xd8302a), 6); g.userData.tip = e; },
    spongeMitt: (h, d, g) => { PR.sph(g, 0.085, h.x + d.x * 0.07, h.y + d.y * 0.07, h.z + d.z * 0.07, PR.lam(0xf2e58a), 8, 1.3, 0.7, 1); },
    polisher: (h, d, g) => { const e = h.clone().addScaledVector(d, 0.2); PR.sph(g, 0.07, h.x, h.y, h.z, PR.mat(0xc8372d), 8, 1, 1, 1.4); PR.bone(g, h, e, 0.05, PR.mat(0xc8372d), 8); PR.cyl(g, 0.11, 0.11, 0.04, e.x + d.x * 0.03, e.y + d.y * 0.03, e.z + d.z * 0.03, PR.lam(0xf6e9a0), 14).quaternion.setFromUnitVectors(V(0, 1, 0), d); },
    wrench: (h, d, g) => { const e = h.clone().addScaledVector(d, 0.42); PR.bone(g, h, e, 0.014, PR.mat(0xb4bbc4, { shininess: 100 }), 6); PR.sph(g, 0.034, e.x, e.y, e.z, PR.mat(0xb4bbc4, { shininess: 100 }), 6); },
    torch: (h, d, g) => { const e = h.clone().addScaledVector(d, 0.18); PR.bone(g, h, e, 0.03, PR.mat(0x2a2d33), 8); PR.spr(g, e.clone().addScaledVector(d, 0.05), 0.35, 0xfff0c0, 0.8, true); },
    squeegee: (h, d, g, col = 0x2a8fe0) => { const c = h.clone().addScaledVector(d, 0.04); const o = PR.box(g, 0.2, 0.012, 0.08, c.x, c.y, c.z, PR.mat(col)); o.lookAt(c.clone().add(d)); },
    clip: (h, d, g) => { PR.box(g, 0.2, 0.01, 0.28, h.x + d.x * 0.1, h.y + d.y * 0.1, h.z + d.z * 0.1, PR.lam(0x6b4a2b)); PR.box(g, 0.17, 0.012, 0.24, h.x + d.x * 0.1, h.y + d.y * 0.1 + 0.008, h.z + d.z * 0.1, PR.lam(0xf4f4f0)); },
  };
  // ---- robot arm hanging from a ceiling trolley: base (the mounting point), target (the tool's tip), tool ('washer'|'polisher'|'scanner'|'sprayer'|'wrench'|'camera'|none) ----
  PR.arm = (o) => {
    const g = PR.group(), WHT = PR.mat(o.col != null ? o.col : 0xe9edf2, { shininess: 70, specular: 0x888888 }), NV = PR.mat(0x1b2b5c, { shininess: 60 }), DK = PR.mat(0x23262c), LED = PR.glow(o.led != null ? o.led : 0x47c6ff, 2.2);
    const th = o.th || 1, base = P3(o.base), tip = P3(o.target), dir = o.dir ? P3(o.dir).normalize() : tip.clone().sub(base).normalize(), len = o.toolLen != null ? o.toolLen : 0.32, wr = tip.clone().addScaledVector(dir, -len), sh0 = base.clone().add(V(0, -0.38, 0)), l1 = o.l1 || 1.25, l2 = o.l2 || 1.2;
    // the trolley and the mount
    PR.box(g, 0.7, 0.16, 0.5, base.x, base.y + 0.02, base.z, DK); PR.cyl(g, 0.19, 0.22, 0.28, base.x, base.y - 0.16, base.z, NV, 18);
    PR.sph(g, 0.17, sh0.x, sh0.y, sh0.z, WHT, 14);
    const el = PR.ik2(sh0, wr, l1, l2, o.hint || V(0, 0.6, 0).add(sh0.clone().sub(wr).setY(0).normalize()));
    for (const [a, b, r] of [[sh0, el, 0.105 * th], [el, wr, 0.085 * th]]) { PR.bone(g, a, b, r, WHT, 14, r * 0.92); const mid = a.clone().lerp(b, 0.5); PR.bone(g, mid.clone().addScaledVector(b.clone().sub(a).normalize(), -0.07), mid.clone().addScaledVector(b.clone().sub(a).normalize(), 0.07), r * 1.08, NV, 14); }
    for (const p of [el, wr]) { PR.sph(g, 0.125, p.x, p.y, p.z, WHT, 14); const q = PR.sph(g, 0.128, p.x, p.y, p.z, LED, 14, 1, 0.12, 1); }
    PR.bone(g, wr, tip, 0.06, DK, 10, 0.045);
    const tl = o.tool; g.userData.tip = tip; g.userData.dir = dir;
    if (tl === 'washer') { PR.bone(g, tip, tip.clone().addScaledVector(dir, 0.1), 0.03, PR.mat(0xd8302a), 8); }
    else if (tl === 'polisher') { const c = tip.clone().addScaledVector(dir, 0.03); const d = PR.cyl(g, 0.17, 0.17, 0.06, c.x, c.y, c.z, PR.lam(0xf6e9a0), 20); d.quaternion.setFromUnitVectors(V(0, 1, 0), dir); PR.cyl(g, 0.11, 0.11, 0.1, tip.x - dir.x * 0.07, tip.y - dir.y * 0.07, tip.z - dir.z * 0.07, PR.mat(0xc8372d), 14).quaternion.setFromUnitVectors(V(0, 1, 0), dir); }
    else if (tl === 'scanner') { const c = tip.clone().addScaledVector(dir, 0.06); const b = PR.box(g, 0.34, 0.1, 0.1, c.x, c.y, c.z, PR.mat(0x2a2d33)); b.lookAt(c.clone().add(dir)); PR.sph(g, 0.035, c.x + dir.x * 0.06, c.y + dir.y * 0.06, c.z + dir.z * 0.06, PR.glow(0x7dffb0, 2.5), 8); }
    else if (tl === 'sprayer') { const c = tip.clone().addScaledVector(dir, 0.1); PR.bone(g, tip, c, 0.05, PR.mat(0xc8d0d8, { shininess: 100 }), 10, 0.035); PR.bone(g, c, c.clone().addScaledVector(dir, 0.06), 0.03, PR.mat(0x2a2d33), 8); PR.box(g, 0.08, 0.1, 0.1, tip.x - dir.x * 0.02, tip.y + 0.05, tip.z - dir.z * 0.02, PR.mat(0x2a8fe0)); }
    else if (tl === 'wrench') { PR.bone(g, tip, tip.clone().addScaledVector(dir, 0.3), 0.04, PR.mat(0x2a2d33), 8); PR.cyl(g, 0.07, 0.07, 0.12, tip.x + dir.x * 0.34, tip.y + dir.y * 0.34, tip.z + dir.z * 0.34, PR.mat(0xb4bbc4, { shininess: 100 }), 10).quaternion.setFromUnitVectors(V(0, 1, 0), dir); }
    else if (tl === 'camera') { const c = tip.clone().addScaledVector(dir, 0.08); const b = PR.box(g, 0.22, 0.16, 0.16, c.x, c.y, c.z, PR.mat(0x2a2d33)); b.lookAt(c.clone().add(dir)); PR.sph(g, 0.06, c.x + dir.x * 0.1, c.y + dir.y * 0.1, c.z + dir.z * 0.1, PR.glow(0xff4a3a, 2.2), 10); }
    return g;
  };
  // a gantry on rails under the ceiling: two rails along x at z = +-zr, a beam across, returns the beam's centre at x
  PR.gantry = (xs = 0, o = {}) => { xs = [].concat(xs); const g = PR.group(), zr = o.zr || 2.3, y = o.y || 3.95, x0 = o.x0 || -5.2, x1 = o.x1 || 5.2, ST = PR.mat(0x6b7480, { shininess: 80 }), NV = PR.mat(0x1b2b5c), WHT = PR.mat(0xe9edf2);
    for (const s of [-1, 1]) { PR.box(g, x1 - x0, 0.12, 0.18, (x0 + x1) / 2, y + 0.3, s * zr, ST); for (const hx of [x0 + 0.4, x1 - 0.4]) PR.box(g, 0.1, 0.5, 0.1, hx, y + 0.05, s * zr, ST); for (const x of xs) PR.box(g, 0.5, 0.2, 0.3, x, y + 0.2, s * zr, NV); }
    for (const x of xs) PR.box(g, 0.26, 0.2, zr * 2, x, y + 0.04, 0, WHT);   // the beams across
    return g; };
  // a small camera-drone: o.p (position), o.tilt (rad), o.tool: 'nozzle' | 'pad' | 'laser' | 'cam'; o.col (its LEDs)
  PR.drone = (o) => { const g = PR.group(), p = P3(o.p), WH = PR.mat(0xeef2f7, { shininess: 80 }), DKm = PR.mat(0x23262c), LED = PR.glow(o.col != null ? o.col : 0x47c6ff, 2.4), s = o.s || 1;
    const b = new T.Group(); b.position.copy(p); b.rotation.set(o.tilt || 0, o.ry || 0, o.roll || 0); g.add(b);
    PR.cyl(b, 0.2 * s, 0.17 * s, 0.1 * s, 0, 0, 0, WH, 20); PR.cyl(b, 0.12 * s, 0.12 * s, 0.03 * s, 0, 0.07 * s, 0, DKm, 16); PR.sph(b, 0.04 * s, 0, 0.09 * s, 0, LED, 8);
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, ax = Math.cos(a) * 0.3 * s, az = Math.sin(a) * 0.3 * s; PR.bone(b, V(Math.cos(a) * 0.15 * s, 0, Math.sin(a) * 0.15 * s), V(ax, 0.01 * s, az), 0.016 * s, DKm, 6); PR.cyl(b, 0.02 * s, 0.02 * s, 0.05 * s, ax, 0.03 * s, az, DKm, 8);
      const rot = new T.Mesh(new T.CylinderGeometry(0.16 * s, 0.16 * s, 0.006, 24), new T.MeshBasicMaterial({ color: 0xcfe3ff, transparent: true, opacity: 0.14, depthWrite: false })); rot.position.set(ax, 0.062 * s, az); b.add(rot);
      const rg = new T.Mesh(new T.TorusGeometry(0.16 * s, 0.006 * s, 6, 24), LED); rg.rotation.x = Math.PI / 2; rg.position.set(ax, 0.062 * s, az); b.add(rg); }
    const ring = new T.Mesh(new T.TorusGeometry(0.17 * s, 0.012 * s, 8, 24), LED); ring.rotation.x = Math.PI / 2; ring.position.y = -0.055 * s; b.add(ring);
    PR.spr(b, V(0, -0.06 * s, 0), 0.55 * s, o.col != null ? o.col : 0x47c6ff, 0.45, true);
    const tl = o.tool;
    if (tl === 'nozzle') { PR.bone(b, V(0, -0.05 * s, 0.05 * s), V(0, -0.16 * s, 0.14 * s), 0.02 * s, DKm, 6); }
    else if (tl === 'pad') { PR.bone(b, V(0, -0.05 * s, 0), V(0, -0.16 * s, 0), 0.02 * s, DKm, 6); PR.cyl(b, 0.12 * s, 0.12 * s, 0.03 * s, 0, -0.18 * s, 0, PR.lam(0xf6e9a0), 18); }
    else if (tl === 'laser') { PR.bone(b, V(0, -0.05 * s, 0), V(0, -0.12 * s, 0), 0.025 * s, DKm, 6); PR.sph(b, 0.025 * s, 0, -0.13 * s, 0, PR.glow(0x7dffb0, 2.6), 8); }
    else if (tl === 'cam') { PR.box(b, 0.1 * s, 0.07 * s, 0.1 * s, 0, -0.1 * s, 0.05 * s, DKm); PR.sph(b, 0.025 * s, 0, -0.1 * s, 0.11 * s, PR.glow(0xff4a3a, 2.4), 8); }
    return g; };
  // ---- the car's skin: where the body is (world coords; update after raising the car) ----
  PR.top = (x, z) => { const c = G3.cur; c.v.grp.updateMatrixWorld(true); return c.probe.top(x, z); };
  PR.side = (x, y, sd) => { const c = G3.cur; c.v.grp.updateMatrixWorld(true); return c.probe.side(x, y, sd); };
  // foam: soft white bubbles on the car's upper surfaces (n clusters over the area x0..x1, |z| <= zw)
  PR.foam = (n, x0, x1, zw, o = {}) => { const im = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), PR.lam(o.col || 0xf4f8ff), n * 4), m = new T.Matrix4(); let s = o.seed || 5; const R = () => (s = (s * 16807) % 2147483647) / 2147483647; let k = 0;
    for (let i = 0; i < n; i++) { const x = lerp(x0, x1, R()), z = (R() - 0.5) * 2 * zw, y = PR.top(x, z); if (y == null) continue;
      for (let j = 0; j < 4; j++) { const r = 0.04 + R() * 0.07; m.compose(V(x + (R() - 0.5) * 0.14, y + r * 0.5, z + (R() - 0.5) * 0.14), new T.Quaternion(), V(r, r * 0.85, r)); im.setMatrixAt(k++, m); } }
    im.count = k; im.castShadow = false; add(im); return im; };
  // glints (stars) at points: sparkles on clean paint
  PR.sparkle = (pts, s = 0.35, col = 0xffffff) => { const g = PR.group(); for (const p of pts) PR.spr(g, p, s * (0.6 + 0.8 * Math.random()), col, 0.95, true, G3._dbg.TX.star); return g; };
  PR.sparkleCar = (n = 14, s = 0.34, seed = 9) => { let q = seed; const R = () => (q = (q * 16807) % 2147483647) / 2147483647, K = PR.kit(), pts = []; for (let i = 0; i < n * 3 && pts.length < n; i++) { const x = lerp(K.rear + 0.3, K.front - 0.3, R()), z = (R() - 0.5) * K.hw * 1.6, y = PR.top(x, z); if (y != null) pts.push(V(x, y + 0.04, z)); } return PR.sparkle(pts, s); };
  // a ring marker (a hotspot): flat sprite ring
  let ringTex = null;
  PR.marker = (p, col = 0xff5a4a, s = 0.28) => { if (!ringTex) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.strokeStyle = '#fff'; x.lineWidth = 9; x.beginPath(); x.arc(64, 64, 46, 0, 7); x.stroke(); x.lineWidth = 5; x.beginPath(); x.moveTo(64, 4); x.lineTo(64, 28); x.moveTo(64, 100); x.lineTo(64, 124); x.moveTo(4, 64); x.lineTo(28, 64); x.moveTo(100, 64); x.lineTo(124, 64); x.stroke(); ringTex = new T.CanvasTexture(c); }
    return PR.spr(null, p, s, col, 0.95, true, ringTex); };
  // a scanning sheet standing across the car at x (a light plane in the y-z plane): grid lines and a bright leading edge
  PR.scanSheet = (x, y0, y1, zw, col = 0x6cc8f7, o = {}) => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.92, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
    g.globalCompositeOperation = 'destination-in'; const gy = g.createLinearGradient(0, 0, 0, 128); gy.addColorStop(0, 'rgba(0,0,0,0.2)'); gy.addColorStop(0.5, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0.2)'); g.fillStyle = gy; g.fillRect(0, 0, 256, 128); g.globalCompositeOperation = 'source-over'; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5; for (let i = 1; i < 16; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, 128); g.stroke(); } for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 16); g.lineTo(256, i * 16); g.stroke(); }
    const m = new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), color: new T.Color(col).multiplyScalar(1.5), transparent: true, opacity: o.op == null ? 0.65 : o.op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }), p = new T.Mesh(new T.PlaneGeometry(o.len || 0.9, y1 - y0), m); p.rotation.y = -Math.PI / 2 * 0 + Math.PI / 2; p.scale.set(1, 1, 1);
    const q = new T.Mesh(new T.PlaneGeometry(zw * 2, y1 - y0), m); q.rotation.y = Math.PI / 2; q.position.set(x, (y0 + y1) / 2, 0); q.scale.x = 1; add(q); return q; };
  // smoke: dark or light puffs rising from p
  PR.smoke = (p, n = 10, col = 0x2a2a2e, h = 0.8, o = {}) => { const g = PR.group(); let s = o.seed || 4; const R = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < n; i++) { const t = i / n; PR.spr(g, P3(p).add(V((R() - 0.5) * 0.3 * (1 + t), t * h, (R() - 0.5) * 0.3 * (1 + t))), 0.25 + t * 0.55, col, o.op == null ? 0.42 * (1 - t * 0.6) : o.op * (1 - t * 0.6), false); } return g; };
  // oil / water drip: a thin falling streak with a drop
  PR.drip = (p, len = 0.4, col = 0x1a1208) => { const g = PR.group(), m = new T.MeshBasicMaterial({ color: col }); PR.bone(g, P3(p), P3(p).add(V(0, -len, 0)), 0.008, m, 5); PR.sph(g, 0.022, p[0] != null ? p[0] : p.x, (p[1] != null ? p[1] : p.y) - len, p[2] != null ? p[2] : p.z, PR.mat(col, { shininess: 120 }), 8, 1, 1.3, 1); return g; };
  // a screen on a stand (a diagnostic cart): p = the floor point below it, w x h metres, ry = facing, draw(ctx, cw, ch) paints it
  PR.screen = (p, w, h, ry, draw, o = {}) => { const g = PR.group(); g.position.set(p[0], 0, p[2]); g.rotation.y = ry; const cw = 512, ch = Math.round(512 * h / w), c = document.createElement('canvas'); c.width = cw; c.height = ch; const x = c.getContext('2d'); draw(x, cw, ch);
    const y0 = o.y != null ? o.y : 1.35, DK = PR.mat(0x23262c), BL = PR.mat(0x1b2b5c);
    PR.box(g, 0.7, 0.07, 0.55, 0, 0.12, 0, DK); PR.cyl(g, 0.05, 0.05, y0 - 0.15, 0, 0.12 + (y0 - 0.15) / 2, 0, BL, 10); for (const sx of [-1, 1]) for (const sz of [-1, 1]) PR.cyl(g, 0.045, 0.045, 0.06, sx * 0.3, 0.05, sz * 0.22, PR.lam(0x111214), 10);
    PR.box(g, w + 0.06, h + 0.06, 0.06, 0, y0 + h / 2, 0, DK); const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), color: new T.Color(1.15, 1.15, 1.15) })); m.position.set(0, y0 + h / 2, 0.032); g.add(m); return g; };
  // a hose / cable: a tube through points
  PR.tube = (pts, r = 0.025, col = 0x2f6b3a, seg = 48) => { const g = PR.group(), c = new T.CatmullRomCurve3(pts.map(P3)); const o = sh(new T.Mesh(new T.TubeGeometry(c, seg, r, 8, false), PR.lam(col))); g.add(o); return g; };
  PR.bucket = (x, z, col = 0x2a8fe0, foam = true) => { const g = PR.group(); PR.cyl(g, 0.17, 0.13, 0.3, x, 0.15, z, PR.mat(col, { shininess: 60 }), 16); if (foam) for (let i = 0; i < 7; i++) PR.sph(g, 0.06 + 0.03 * (i % 3), x + Math.cos(i * 1.7) * 0.1, 0.34 + 0.02 * (i % 2), z + Math.sin(i * 1.7) * 0.1, PR.lam(0xf4f8ff), 8); return g; };
  PR.faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
  // ---- the render loop: make the picture ----
  PR.reset = () => { for (const o of PR.objs) { sc.remove(o); o.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material && x.material.map && x.material.map.isCanvasTexture) x.material.map.dispose(); }); } PR.objs = []; PR.liftH = 0; const c = G3.cur; if (c) { for (const k of PR.cars()) { k.v.grp.position.y = 0; if (k.contact) k.contact.visible = true; if (k.v.blob) k.v.blob.visible = true; } } };
  PR.render = (t = 0.45) => { if (!PR.dummy) { G3._dbg.tasks.push({ g: (function* () { while (true) yield; })(), res() {}, done: false }); PR.dummy = true; } __garage.advance(t); __garage.advance(0.05); };
})();
