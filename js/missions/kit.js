/* Special missions (js/missions.js) · the shared kit (MisKit): what more than one mission uses, so each takes it from here instead of
   writing it again (docs/misije.md, Sistem misij).
     MisKit.truckModel(base, over): the player's vehicle as a clone of a model (Core.MODELS: never changed) with its own numbers (vLim ...).
     MisKit.fireTruck(run): the fire engine C · Avtolestev (slike-predlogi blender/modeli/v2.glb, 8.4 x 2.5 x 3.4 m) of simple bodies on the
       player's own view (its body hidden, the physics its own): the cab, the body with its shutters, three axles, the turntable at the back
       and the ladder of five sections over the cab with its basket at the tip, the blue lamps flashing (~8 draw calls). Its ladder: lift
       (0..1.4 rad), ext (0..1: 7.2 to 33.6 m), yaw (rad, from forward); tip(): the basket in the world; nozzle(): where the water leaves.
     MisKit.fire(run, max, { per, spread }): flames (one Points draw: the spots set with spot(i, x, y, z, size); size 0 is out; per flames a
       spot, spread over spread x its size), smoke over them (one more).
     MisKit.jet(run): the water's stream from a point to a point (one Points draw) and its splash; set(from, to, on).
     MisKit.aim(run, o): the finger's aim on the screen (drag anywhere over the game) and the GASI button held; a ring where the water goes;
       o.plane 'v' (a wall facing the camera through o.focus) or 'g' (the ground at o.focus's height). on(true) shows it, the driving
       controls hidden (o.drive: kept, the pad over the upper part of the screen only, GASI over the pedals: aimed while driving); point: the world point aimed at; spray: GASI held.
     MisKit.hold(car, on): the parked car held still (locked, no reverse) every step while the crew works; hold(car, false) lets it go.
   All of it is the run's own (run.add): out of the scene and freed when the run ends. Loadable without a browser (the tests: no THREE,
   the logic only). */
const MisKit = (function () {
  'use strict';
  const has3 = () => typeof THREE !== 'undefined';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function truckModel(id, over) {
    const M = typeof Core !== 'undefined' ? Core.MODELS.find(m => m.id === id) : null;
    return M ? Object.assign({}, M, over) : null;
  }

  // many boxes and cylinders as one mesh: each part's vertices coloured, in one geometry (one draw call)
  function merged(parts) {
    let n = 0; const gs = parts.map(p => { const g = p.g.index ? p.g.toNonIndexed() : p.g; g.applyMatrix4(p.m); n += g.attributes.position.count; return [g, p.c]; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
    let o = 0;
    for (const [g, hex] of gs) {
      c.setHex(hex); const P = g.attributes.position.array, N = g.attributes.normal.array;
      pos.set(P, o * 3); nor.set(N, o * 3);
      for (let k = 0; k < g.attributes.position.count; k++) { col[(o + k) * 3] = c.r; col[(o + k) * 3 + 1] = c.g; col[(o + k) * 3 + 2] = c.b; }
      o += g.attributes.position.count; g.dispose();
    }
    const G = new THREE.BufferGeometry();
    G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('color', new THREE.BufferAttribute(col, 3));
    G.computeBoundingSphere();
    return G;
  }
  // a part list: box(x, y, z, lx, ly, lz, colour) by its centre (x forward, y up, z to the side); cyl(x, y, z, r, w, colour) across the car
  function parts() {
    const L = [], m = () => new THREE.Matrix4();
    return { L,
      box(x, y, z, lx, ly, lz, c, ry) { const M = m(); if (ry) M.makeRotationY(ry); M.setPosition(x, y, z); L.push({ g: new THREE.BoxGeometry(lx, ly, lz), m: M, c }); },
      cyl(x, y, z, r, w, c, seg) { const M = m().makeRotationX(Math.PI / 2); M.setPosition(x, y, z); L.push({ g: new THREE.CylinderGeometry(r, r, w, seg || 12), m: M, c }); },
      disc(x, y, z, r, h, c) { const M = m(); M.setPosition(x, y, z); L.push({ g: new THREE.CylinderGeometry(r, r, h, 18), m: M, c }); },
      mesh(mat) { return new THREE.Mesh(merged(L), mat); } };
  }

  /* ---------------- the fire engine C · Avtolestev ---------------- */
  const RED = 0xc4161c, DRED = 0x8e0e12, BLK = 0x1b1d21, GRY = 0x9aa1a8, SIL = 0xd5dade, GLS = 0x1d2733, YEL = 0xe2c12b, WH = 0xeef1f4;
  const LAD = { piv: [-2.9, 3.25], sec: 5, L0: 7.2, step: 6.6, wid: [0.94, 0.84, 0.74, 0.64, 0.54] };   // (the ladder: its pivot on the turntable, five sections; out in full 7.2 + 4 x 6.6 = 33.6 m)
  function fireTruck(run) {
    const P = run.P, R = typeof Render !== 'undefined' ? Render : null, v = R && R.viewOf ? R.viewOf(P) : null;
    const T = { lift: 0, ext: 0, yaw: 0, flash: 0, v };
    // the basket's point from the physics (the car's place and heading, the ladder's angles), not the drawn truck: the same in a test's
    // fast run as on the screen (the drawn one may lag a frame); the body's tilt on the slope (roll, pitch) and its height from the view
    T.tipAt = () => {
      const c = Math.cos(T.lift), s = Math.sin(T.lift), L = LAD.L0 + T.ext * LAD.step * (LAD.sec - 1);
      const ax = 0.2 + c * L - s * 0.15 + 0.5, ay = LAD.piv[1] - 2.76 + s * L + c * 0.15 + 0.6;   // (the arm, along the ladder, the basket up from its floor; level)
      const x = LAD.piv[0] + ax * Math.cos(T.yaw), y = 2.76 + ay, z = -ax * Math.sin(T.yaw);
      const G = v && v.grp, rr = G ? G.rotation.x : 0, pp = G ? G.rotation.z : 0, y0 = G ? G.position.y : (P.y || 0);
      const y1 = y * Math.cos(rr) - z * Math.sin(rr), z1 = y * Math.sin(rr) + z * Math.cos(rr), x2 = x * Math.cos(pp) - y1 * Math.sin(pp), y2 = x * Math.sin(pp) + y1 * Math.cos(pp);   // (the view's order YZX: the roll, the pitch, then the heading)
      const ch = Math.cos(P.h), sh = Math.sin(P.h);
      return { x: P.x + x2 * ch - z1 * sh, y: y0 + y2, z: P.z + x2 * sh + z1 * ch };
    };
    // the turntable's angle that points the ladder at a world point (x, z): from the turntable itself (behind the truck's middle), from the physics
    T.yawTo = (x, z) => { const ch = Math.cos(P.h), sh = Math.sin(P.h), dx = x - (P.x + LAD.piv[0] * ch), dz = z - (P.z + LAD.piv[0] * sh); return Math.atan2(-(-dx * sh + dz * ch), dx * ch + dz * sh); };
    if (!has3() || !v) return Object.assign(T, { step() {}, tip: () => null, nozzle: () => null, len: () => LAD.L0 + T.ext * LAD.step * (LAD.sec - 1) });
    // the physics' own body out of sight (its wheels too: the truck's six are its own)
    for (const o of [v.body, v.tail, v.dec].concat(v.wf || [], v.wr || [])) if (o) o.visible = false;
    if (v.marker) v.marker.visible = false;
    const lam = new THREE.MeshLambertMaterial({ vertexColors: true });
    const g = new THREE.Group(); g.name = 'misTruck';
    const B = parts();
    // the chassis, the cab (cab-over, its windscreen and side glass), the bumper, the body with the shutters, the stripe
    B.box(0.1, 0.78, 0, 8.0, 0.42, 2.0, BLK);
    B.box(3.32, 1.95, 0, 1.75, 2.1, 2.5, RED);
    B.box(4.2, 2.35, 0, 0.04, 0.9, 2.2, GLS); B.box(3.55, 2.4, 1.26, 1.1, 0.75, 0.03, GLS); B.box(3.55, 2.4, -1.26, 1.1, 0.75, 0.03, GLS);
    B.box(4.28, 0.72, 0, 0.2, 0.42, 2.5, BLK); B.box(4.22, 1.15, 0, 0.06, 0.32, 1.8, 0x2a2d33);
    B.box(4.25, 1.1, 0.95, 0.05, 0.18, 0.34, 0xfff4cc); B.box(4.25, 1.1, -0.95, 0.05, 0.18, 0.34, 0xfff4cc);
    B.box(-0.95, 1.68, 0, 6.4, 1.55, 2.5, RED);
    for (const sd of [-1, 1]) { B.box(0.95, 1.65, sd * 1.255, 1.3, 1.25, 0.02, GRY); B.box(-0.6, 1.65, sd * 1.255, 1.3, 1.25, 0.02, GRY); B.box(3.32, 1.42, sd * 1.255, 1.75, 0.1, 0.02, YEL); }
    B.box(-4.16, 1.68, 0, 0.04, 1.4, 2.3, DRED); B.box(-4.2, 0.62, 0, 0.18, 0.2, 2.4, BLK);
    B.box(-4.19, 1.05, 1.0, 0.04, 0.22, 0.3, 0xff3a2a); B.box(-4.19, 1.05, -1.0, 0.04, 0.22, 0.3, 0xff3a2a);
    B.box(-0.95, 2.48, 0, 6.2, 0.06, 2.3, 0x7a1014);   // (the roof of the body, a shade darker: seen from the camera above)
    // the six wheels (front, the tandem at the back), the turntable's base
    for (const x of [2.6, -1.6, -2.95]) for (const sd of [-1, 1]) { B.cyl(x, 0.55, sd * 1.05, 0.55, 0.42, BLK); B.cyl(x, 0.55, sd * 1.27, 0.3, 0.02, GRY); }
    B.disc(LAD.piv[0], 2.62, 0, 1.0, 0.28, BLK);
    const body = B.mesh(lam); body.castShadow = true; g.add(body);
    // the blue lamps: the bar over the cab, two at the back; one side, then the other
    const on = new THREE.MeshBasicMaterial({ color: 0x4a8cff }), off = new THREE.MeshLambertMaterial({ color: 0x1a2d5a });
    const lampA = parts(), lampB = parts();
    lampA.box(3.6, 3.07, 0.5, 0.32, 0.16, 0.8, 0); lampB.box(3.6, 3.07, -0.5, 0.32, 0.16, 0.8, 0);
    lampA.box(-4.12, 2.42, 1.08, 0.12, 0.2, 0.2, 0); lampB.box(-4.12, 2.42, -1.08, 0.12, 0.2, 0.2, 0);
    const la = new THREE.Mesh(merged(lampA.L), on), lb = new THREE.Mesh(merged(lampB.L), off); g.add(la, lb);
    // the turntable (turns: yaw), on it the ladder's foot and the ladder (lifts: lift; its sections slide out: ext), the basket at its tip kept level
    const turn = new THREE.Group(); turn.position.set(LAD.piv[0], 2.76, 0); g.add(turn);
    const F = parts(); F.box(0.1, 0.3, 0, 1.3, 0.6, 1.2, RED); F.box(0.55, 0.62, 0.45, 0.5, 0.2, 0.2, DRED);
    turn.add(F.mesh(lam));
    const arm = new THREE.Group(); arm.position.set(0.2, LAD.piv[1] - 2.76, 0); turn.add(arm);
    const secs = [];
    for (let k = 0; k < LAD.sec; k++) {
      const S = parts(), w = LAD.wid[k], len = k ? LAD.step + 0.13 : LAD.L0, x0 = 0;
      for (const sd of [-1, 1]) { S.box(x0 + len / 2, 0.1 + k * 0.06, sd * w / 2, len, 0.16, 0.06, SIL); S.box(x0 + len / 2, 0.24 + k * 0.06, sd * w / 2, len, 0.04, 0.04, 0xb8bfc6); }
      for (let r = 0.3; r < len - 0.1; r += 0.42) S.box(x0 + r, 0.1 + k * 0.06, 0, 0.05, 0.04, w, 0xc3c9cf);
      const m = S.mesh(lam); m.castShadow = k === 0; (k ? secs[k - 1] : arm).add(m); secs.push(m);
    }
    const bk = new THREE.Group(), K = parts();
    K.box(0.5, 0.05, 0, 1.0, 0.1, 1.4, GRY); K.box(0.5, 0.55, 0.68, 1.0, 1.0, 0.04, GRY); K.box(0.5, 0.55, -0.68, 1.0, 1.0, 0.04, GRY); K.box(0.98, 0.55, 0, 0.04, 1.0, 1.4, 0xb0b6bc); K.box(0.02, 0.55, 0, 0.04, 1.0, 1.4, 0xb0b6bc);
    K.box(0.5, 1.07, 0, 1.06, 0.06, 1.46, 0x5f666e); K.box(1.05, 0.9, 0, 0.3, 0.12, 0.12, 0x30353c);
    bk.add(K.mesh(lam)); secs[LAD.sec - 1].add(bk);
    v.bodyG.add(g);
    // the lamps for the night's glow: where the truck has them
    if (v.lights && v.lights.length >= 4) { v.lights[0].set(4.26, 1.1, -0.95); v.lights[1].set(4.26, 1.1, 0.95); v.lights[2].set(-4.21, 1.05, -1.0); v.lights[3].set(-4.21, 1.05, 1.0); }
    const _v = new THREE.Vector3();
    const len = () => LAD.L0 + T.ext * LAD.step * (LAD.sec - 1);
    function pose() {
      turn.rotation.y = T.yaw; arm.rotation.z = T.lift;
      const d = T.ext * LAD.step; for (let k = 1; k < LAD.sec; k++) secs[k].position.x = d;
      bk.position.set(LAD.L0, 0.15, 0); bk.rotation.z = -T.lift;
    }
    pose();
    run.add(new THREE.Group());   // (the run's own: the truck itself lives on the view, taken off at the end below)
    const props = run.props; props[props.length - 1].userData.misUndo = () => { v.bodyG.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); [lam, on, off].forEach(m => m.dispose()); for (const o of [v.body, v.tail, v.dec].concat(v.wf || [], v.wr || [])) if (o) o.visible = true; };
    return Object.assign(T, { g, turn, arm, secs, basket: bk, len,
      step(dt, lit) {
        T.lift = clamp(T.lift, 0, 1.4); T.ext = clamp(T.ext, 0, 1); pose();
        T.flash += dt; const a = lit !== false && (T.flash * 2.2) % 1 < 0.5; la.material = a ? on : off; lb.material = a || lit === false ? off : on;
      },
      tip() { bk.updateWorldMatrix(true, false); return bk.localToWorld(_v.set(0.5, 0.6, 0)).clone(); },
      nozzle() { bk.updateWorldMatrix(true, false); return bk.localToWorld(_v.set(1.15, 0.9, 0)).clone(); },
    });
  }

  /* ---------------- flames and smoke: Points, one draw each ---------------- */
  const PT_VS = `attribute float aSize; attribute float aSeed; uniform float uT; uniform float uScale; uniform float uRise; uniform float uGrow; uniform float uRate; varying float vA; varying float vH;
void main() { float ph = fract(uT * uRate + aSeed); vec3 p = position; p.y += ph * aSize * uRise; p.x += sin(aSeed * 40.0 + uT) * ph * aSize * 0.25; p.z += cos(aSeed * 31.0 + uT * 0.8) * ph * aSize * 0.25;
  vA = (1.0 - ph) * smoothstep(0.0, 0.12, ph); vH = ph; vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * (1.0 + uGrow * ph) * (1.0 - 0.35 * ph * (1.0 - uGrow)) * uScale / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }`;
  const FL_FS = `varying float vA; varying float vH; void main() { vec2 q = gl_PointCoord * 2.0 - 1.0; q.x /= 0.28 + 0.72 * gl_PointCoord.y; float d = dot(q, q); if (d > 1.0) discard;
  float k = (1.0 - d); vec3 c = mix(vec3(1.0, 0.93, 0.6), vec3(1.0, 0.36, 0.04), clamp(vH * 1.5 + d * 0.7, 0.0, 1.0)); gl_FragColor = vec4(c, clamp(k * 1.6, 0.0, 1.0) * vA); }`;
  const SM_FS = `uniform vec3 uCol; uniform float uOp; varying float vA; varying float vH; void main() { vec2 q = gl_PointCoord * 2.0 - 1.0; float d = dot(q, q); if (d > 1.0) discard;
  gl_FragColor = vec4(uCol * (1.0 - 0.25 * vH), (1.0 - d) * vA * uOp); }`;
  function scaleNow() { const c = Render.camera, el = document.getElementById('gl'); const h = el ? el.height : (typeof innerHeight !== 'undefined' ? innerHeight : 800); return h / (2 * Math.tan(c.fov * Math.PI / 360)); }
  function points(max, per, fs, over, uni) {
    const n = max * per, pos = new Float32Array(n * 3), sz = new Float32Array(n), sd = new Float32Array(n);
    for (let k = 0; k < n; k++) sd[k] = ((k % per) / per + ((k * 0.618) % 1) * 0.15) % 1;
    const G = new THREE.BufferGeometry();
    G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('aSize', new THREE.BufferAttribute(sz, 1)); G.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
    const M = new THREE.ShaderMaterial(Object.assign({ uniforms: Object.assign({ uT: { value: 0 }, uScale: { value: 600 }, uRise: { value: 1.1 }, uGrow: { value: 0 }, uRate: { value: 1.3 } }, uni), vertexShader: PT_VS, fragmentShader: fs, transparent: true, depthWrite: false }, over));
    const P = new THREE.Points(G, M); P.frustumCulled = false; P.renderOrder = 3;
    return { P, G, M, pos, sz, n, per };
  }
  function fire(run, max, opt) {
    opt = Object.assign({ per: 6, spread: 1 }, opt);
    const F = { n: max, spots: new Array(max).fill(null), step() {}, spot(i, x, y, z, s) { F.spots[i] = s > 0 ? [x, y, z, s] : null; } };
    if (!has3() || typeof Render === 'undefined' || !Render.camera) return F;
    const fl = points(max, opt.per, FL_FS, {}, {});
    const sm = points(max, 4, SM_FS, {}, { uRise: { value: 2.6 }, uGrow: { value: 1.6 }, uRate: { value: 0.22 }, uCol: { value: new THREE.Color(0x3a3a3f) }, uOp: { value: 0.85 } });
    run.add(fl.P); run.add(sm.P);
    let t = 0;
    F.smoke = sm; F.flames = fl;
    F.spot = (i, x, y, z, s) => {
      F.spots[i] = s > 0 ? [x, y, z, s] : null;
      for (const [o, k0, f] of [[fl, i * fl.per, 1], [sm, i * sm.per, 1.6]]) for (let k = 0; k < o.per; k++) {
        const j = k0 + k, a = (k / o.per) * 6.283 + i, r = s * 0.35 * opt.spread * (k % 2 ? 1 : 0.5 + 0.25 * (k % 3));
        o.pos[j * 3] = x + Math.cos(a) * r; o.pos[j * 3 + 1] = y + (o === sm ? s * 0.4 : 0); o.pos[j * 3 + 2] = z + Math.sin(a) * r; o.sz[j] = s > 0 ? s * f : 0;
      }
      fl.G.attributes.position.needsUpdate = fl.G.attributes.aSize.needsUpdate = true; sm.G.attributes.position.needsUpdate = sm.G.attributes.aSize.needsUpdate = true;
    };
    F.step = (dt) => { t += dt; const s = scaleNow(); fl.M.uniforms.uT.value = t; sm.M.uniforms.uT.value = t; fl.M.uniforms.uScale.value = sm.M.uniforms.uScale.value = s; };
    return F;
  }

  /* ---------------- the water's stream ---------------- */
  const JET_FS = `varying float vA; varying float vH; void main() { vec2 q = gl_PointCoord * 2.0 - 1.0; float d = dot(q, q); if (d > 1.0) discard; gl_FragColor = vec4(0.86, 0.94, 1.0, (1.0 - d) * 0.85); }`;
  const JN = 70, SPL = 12;
  function jet(run) {
    const J = { on: false, from: null, to: null, set(f, t, on) { J.from = f; J.to = t; J.on = !!on; }, step() {} };
    if (!has3() || typeof Render === 'undefined' || !Render.camera) return J;
    const o = points(JN + SPL, 1, JET_FS, {}, {}); run.add(o.P);
    o.M.uniforms.uRise.value = 0; o.M.uniforms.uRate.value = 0;
    let t = 0;
    J.step = (dt) => {
      t += dt; o.M.uniforms.uScale.value = scaleNow();
      const on = J.on && J.from && J.to; o.P.visible = !!on; if (!on) return;
      const A = J.from, B = J.to, d = Math.hypot(B.x - A.x, B.z - A.z), hy = Math.max(A.y, B.y) + 1.5 + d * 0.18;
      for (let k = 0; k < JN; k++) {
        const u = ((k / JN) + t * 1.6) % 1, a = 1 - u, y = a * a * A.y + 2 * a * u * hy + u * u * B.y, sp = 0.15 + u * 0.6;
        o.pos[k * 3] = A.x + (B.x - A.x) * u + Math.sin(k * 12.9 + t * 9) * sp * 0.4; o.pos[k * 3 + 1] = y + Math.cos(k * 7.1 + t * 7) * sp * 0.3; o.pos[k * 3 + 2] = A.z + (B.z - A.z) * u + Math.cos(k * 3.7 + t * 8) * sp * 0.4;
        o.sz[k] = 0.35 + u * 0.7;
      }
      for (let k = 0; k < SPL; k++) { const j = JN + k, u = ((k / SPL) + t * 2.2) % 1, a = k * 2.4; o.pos[j * 3] = B.x + Math.cos(a) * u * 2; o.pos[j * 3 + 1] = B.y + Math.sin(u * 3.1) * 1.2; o.pos[j * 3 + 2] = B.z + Math.sin(a) * u * 2; o.sz[j] = 1.2 * (1 - u); }
      o.G.attributes.position.needsUpdate = o.G.attributes.aSize.needsUpdate = true;
    };
    return J;
  }

  /* ---------------- the finger's aim and the GASI button ---------------- */
  function aim(run, o) {
    const A = { point: null, spray: false, shown: false, sx: 0.5, sy: 0.42, o: Object.assign({ plane: 'v', focus: null, label: 'GASI' }, o), on() {}, step() {} };
    if (typeof document === 'undefined' || !has3()) return A;
    const hud = document.getElementById('hud'); if (!hud) return A;
    const pad = document.createElement('div'); pad.id = 'mis-aim'; pad.innerHTML = '<i class="ring"></i><button class="gasi" type="button">' + (typeof Lang !== 'undefined' ? Lang.tr(A.o.label) : A.o.label) + '</button>';
    document.body.appendChild(pad);
    const ring = pad.querySelector('.ring'), btn = pad.querySelector('.gasi');
    let drag = null;
    const at = (e) => { A.sx = clamp(e.clientX / innerWidth, 0, 1); A.sy = clamp(e.clientY / innerHeight, 0, 1); };
    pad.addEventListener('pointerdown', (e) => { if (e.target === btn) return; drag = e.pointerId; A.touched = true; at(e); e.preventDefault(); });
    pad.addEventListener('pointermove', (e) => { if (drag === e.pointerId) { at(e); e.preventDefault(); } });
    const up = (e) => { if (drag === e.pointerId) drag = null; };
    pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
    btn.addEventListener('pointerdown', (e) => { A.spray = true; btn.classList.add('on'); e.preventDefault(); e.stopPropagation(); });
    const off = () => { A.spray = false; btn.classList.remove('on'); };
    btn.addEventListener('pointerup', off); btn.addEventListener('pointercancel', off); btn.addEventListener('pointerleave', off);
    const touch = document.getElementById('touch');
    A.on = (show) => {
      show = !!show; if (show === A.shown) return; A.shown = show; pad.classList.toggle('on', show); pad.classList.toggle('drive', !!A.o.drive);
      if (!A.o.drive) { if (touch) touch.classList.toggle('mis-hide', show); document.body.classList.toggle('mis-aiming', show); }
      if (!show) off(); else A.touched = false;
      if (show && !A.o.drive && typeof Input !== 'undefined' && Input.reset) Input.reset();
    };
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), pl = new THREE.Plane(), hit = new THREE.Vector3(), n = new THREE.Vector3();
    A.step = () => {
      if (!A.shown) return;
      const C = Render.camera, f = A.o.focus; if (!C || !f) return;
      if (!A.touched && !A.o.drive && A.toFocus) A.toFocus();   // (until the finger first moves it: on the fire, as the camera settles)
      ndc.set(A.sx * 2 - 1, -(A.sy * 2 - 1)); ray.setFromCamera(ndc, C);
      if (A.o.plane === 'g') n.set(0, 1, 0); else { C.getWorldDirection(n); n.y = 0; n.normalize().negate(); }
      pl.setFromNormalAndCoplanarPoint(n, f);
      if (ray.ray.intersectPlane(pl, hit)) { A.point = hit.clone(); }
      // the ring where the water goes
      if (A.point) { const p = A.point.clone().project(C); ring.style.left = ((p.x + 1) / 2 * 100).toFixed(2) + '%'; ring.style.top = ((1 - p.y) / 2 * 100).toFixed(2) + '%'; ring.classList.toggle('on', p.z < 1); }
    };
    // (the aim's start: on the focus, before the finger moves)
    A.toFocus = () => { const C = Render.camera, f = A.o.focus; if (!C || !f) return; const p = f.clone().project(C); A.sx = clamp((p.x + 1) / 2, 0, 1); A.sy = clamp((1 - p.y) / 2, 0, 1); };
    run.add(new THREE.Group()); run.props[run.props.length - 1].userData.misUndo = () => { pad.remove(); if (touch) touch.classList.remove('mis-hide'); document.body.classList.remove('mis-aiming'); };
    return A;
  }

  /* ---------------- places along the road, a house ---------------- */
  // a point off the road's centre line at s (off > 0 on the side of the normal), the ground's height there, the road's heading
  function at(T, s, off) {
    const i = T.idx(s), x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off, W = typeof Render !== 'undefined' && Render.world;
    const gh = W && W.groundH ? W.groundH(x, z) : NaN, y = Number.isFinite(gh) ? gh : (T.hy ? T.hy[i] : 0);
    return { x, z, y, i, ry: Math.atan2(-T.tz[i], T.tx[i]), ty: T.hy ? T.hy[i] : 0 };
  }
  // a gable roof's prism: its ridge along x, L long, W wide, H high (flat faces)
  function prism(L, W, H) {
    const a = L / 2, b = W / 2, v = [];
    const q = (p0, p1, p2, p3) => v.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3);
    v.push(a, 0, -b, a, H, 0, a, 0, b); v.push(-a, 0, b, -a, H, 0, -a, 0, -b);
    q([-a, 0, b], [a, 0, b], [a, H, 0], [-a, H, 0]); q([a, 0, -b], [-a, 0, -b], [-a, H, 0], [a, H, 0]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  }
  // a house of one floor and a gable roof (L along its ridge, W deep): its walls and roof one mesh (charred by burn(f), 0..1), its windows
  // a second (lit orange while it burns); facing the road (ry: the road's heading)
  function house(run, p, o) {
    o = Object.assign({ L: 10, W: 7.5, H: 3.2, roof: 0xa8432c, wall: 0xeae4d8, ry: 0 }, o);
    const H = { g: null, burn() {}, fl: [] };
    // (the flames' places: on the roof and in the windows, in the house's own frame, then in the world)
    const loc = [[-o.L * 0.3, o.H + 2.9, 0], [o.L * 0.15, o.H + 3.0, 0], [o.L * 0.36, o.H + 1.9, o.W * 0.25], [-o.L * 0.05, o.H * 0.5, o.W / 2 + 0.2], [o.L * 0.3, o.H * 0.5, -o.W / 2 - 0.2], [-o.L * 0.4, o.H * 0.5, o.W / 2 + 0.2]];
    const c = Math.cos(o.ry), sn = Math.sin(o.ry);
    H.fl = loc.map(([x, y, z]) => [p.x + x * c + z * sn, p.y + y, p.z - x * sn + z * c]);
    H.center = { x: p.x, y: p.y + o.H * 0.8, z: p.z };
    if (!has3()) return H;
    const B = parts();
    B.box(0, o.H / 2 - 0.4, 0, o.L, o.H + 0.8, o.W, o.wall);
    { const M = new THREE.Matrix4().makeTranslation(0, o.H + 0.4, 0); B.L.push({ g: prism(o.L + 0.8, o.W + 1.0, 2.6), m: M, c: o.roof }); }
    B.box(o.L * 0.3, o.H + 2.2, -o.W * 0.15, 0.6, 1.8, 0.6, 0x8a8178);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true }), body = B.mesh(mat); body.castShadow = true;
    const W = parts();
    for (const sd of [-1, 1]) for (const x of [-0.3, 0.05, 0.32]) W.box(x * o.L, o.H * 0.5, sd * (o.W / 2 + 0.02), 1.1, 1.1, 0.04, 0xffffff);
    W.box(-o.L * 0.12, o.H * 0.3, o.W / 2 + 0.02, 1.0, 2.0, 0.04, 0x55392a);
    const wm = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0x2a3440 }), win = W.mesh(wm);
    const g = new THREE.Group(); g.add(body, win); g.position.set(p.x, p.y, p.z); g.rotation.y = o.ry; run.add(g);
    H.g = g; H.mat = mat; H.win = wm;
    const lit = new THREE.Color(0xff9a3a), dark = new THREE.Color(0x2a3440);
    H.burn = (f, fire) => { const k = 1 - 0.75 * clamp(f, 0, 1); mat.color.setRGB(k, k * 0.97, k * 0.94); wm.color.copy(dark).lerp(lit, clamp(fire, 0, 1)); };
    return H;
  }

  // the parked truck held still while the crew works (the run's step, after the race's)
  function hold(c, on) { if (on === false) { c.locked = false; return; } c.locked = true; c.vx = 0; c.vz = 0; c.w = 0; c.inThr = 0; c.inBrk = 0; }

  return { truckModel, fireTruck, fire, jet, aim, hold, at, house, prism, merged, parts, LAD };
})();
/* ---------------- the water (group 3: missions 19, 35, 37, 48) ----------------
     MisKit.water(run, o): a plane of water (one draw: a flood, the tide, a river up its banks) round o.x, o.z, o.size m square, at o.y;
       set(y) moves it; o.col, o.op its colour and how much it hides (muddy brown for a flood, blue-green for the sea).
     MisKit.wade(P, depth, dt, o): the water on a car: the deeper the slower (o.drag), from o.slip m of it the car slides (its grip in
       the water: the current o.cur [x, z] m/s pushes it); returns the depth's share 0..1 (1: o.deep m, the car stopped).
     MisKit.boat(run, o): a vessel on the water of its own (no physics of the race: it moves on its own numbers, o.vmax m/s, o.acc, o.turn),
       steered with the player's controls while on(true); the camera behind it as behind the car (Render.setShot); o.wet(x, z): may it be
       there (false: it stops, e.g. on the beach); o.mesh its look; o.wave(x, z, t): the waves' height under it.
     MisKit.skin(run, P, build): the player's car drawn as another vehicle of simple bodies (build(B): B.box / B.cyl / B.disc as for parts(),
       x forward, y up, z to the side), its own body hidden; the group returned (more can be added to it: people on the back ...).
     MisKit.crowd(run, max): people of simple bodies (two draws for all: InstancedMesh), put(k, x, y, z, ry, col) or hide(k).
     MisKit.tags(run): labels over places in the world (DOM, #mis-tags): set([{ x, y, z, html, cls }]).
     MisKit.button(run, label): a big button over the pedals (#mis-btn): show(on), take() true once for each press. */
Object.assign(MisKit, (function () {
  'use strict';
  const has3 = () => typeof THREE !== 'undefined', hasDoc = () => typeof document !== 'undefined';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const tr = (s) => (typeof Lang !== 'undefined' && Lang.tr ? Lang.tr(s) : s);
  // the run's own DOM: taken off when the run ends
  function undo(run, fn) { if (!has3()) return; const g = new THREE.Group(); g.userData.misUndo = fn; run.add(g); }

  function water(run, o) {
    o = Object.assign({ x: 0, z: 0, size: 2000, y: 0, col: 0x6b5a3e, op: 0.88, shine: 30 }, o);
    const W = { y: o.y, mesh: null, set(y) { W.y = y; if (W.mesh) W.mesh.position.y = y; } };
    if (!has3()) return W;
    const g = new THREE.PlaneGeometry(o.size, o.size); g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshPhongMaterial({ color: o.col, specular: 0x8a8a80, shininess: o.shine, transparent: o.op < 1, opacity: o.op, depthWrite: true });
    const mesh = new THREE.Mesh(g, m); mesh.position.set(o.x, o.y, o.z); mesh.receiveShadow = true; mesh.renderOrder = 1;
    run.add(mesh); W.mesh = mesh;
    return W;
  }

  function wade(P, depth, dt, o) {
    o = Object.assign({ drag: 1.6, slip: 0.35, deep: 1.1, cur: null }, o);
    if (!(depth > 0)) return 0;
    const k = clamp(depth / o.deep, 0, 1), v = Math.hypot(P.vx, P.vz);
    // the water holds the car back: more the deeper and the faster (a wave in front of it)
    const f = Math.exp(-dt * (o.drag * k + 0.04 * v * k));
    P.vx *= f; P.vz *= f; if (P.w) P.w *= Math.exp(-dt * 2 * k);
    // over the wheels' hubs: the current takes it along, the car slides
    if (depth > o.slip && o.cur) { const s = clamp((depth - o.slip) / (o.deep - o.slip), 0, 1); P.vx += o.cur[0] * s * dt * 1.2; P.vz += o.cur[1] * s * dt * 1.2; }
    if (k >= 1) { P.vx *= Math.exp(-dt * 4); P.vz *= Math.exp(-dt * 4); }
    return k;
  }

  function boat(run, o) {
    o = Object.assign({ vmax: 16, acc: 5, brake: 7, turn: 1.4, drag: 0.35, wet: () => true, wave: () => 0, mesh: null, D: [30, 20] }, o);
    const B = { x: o.x || 0, z: o.z || 0, h: o.h || 0, v: 0, y: o.y || 0, on: false, t: 0, hs: o.h || 0, shot: null, stuck: false,
      // where it is now: the boat's own frame for its mesh
      place(x, z, h) { B.x = x; B.z = z; B.h = h; B.hs = h; B.v = 0; },
      go(on) {
        on = !!on; if (on === B.on) return; B.on = on;
        if (o.mesh) o.mesh.visible = on || !!o.keep;
        if (hasDoc()) document.body.classList.toggle('mis-boat', on);   // (the parked car's speed and corner notes off the HUD while the vessel is driven)
        if (typeof Render !== 'undefined' && Render.setShot) { if (on) { B.shot = { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, fov: 58, fogD: 40, near: 0.5, noCut: true }; B.cam(1); Render.setShot(B.shot); } else { Render.setShot(null); B.shot = null; } }
      },
      // a step: steer -1..1, thr, brk 0..1
      step(dt, steer, thr, brk) {
        B.t += dt;
        if (B.on) {
          const a = thr * o.acc - brk * (B.v > 0 ? o.brake : o.acc * 0.4) - o.drag * B.v - 0.02 * B.v * Math.abs(B.v);
          B.v = clamp(B.v + a * dt, -o.vmax * 0.25, o.vmax);
          B.h += steer * o.turn * clamp(Math.abs(B.v) / 4, 0, 1) * Math.sign(B.v || 1) * dt;
          const nx = B.x + Math.cos(B.h) * B.v * dt, nz = B.z + Math.sin(B.h) * B.v * dt;
          if (o.wet(nx, nz)) { B.x = nx; B.z = nz; B.stuck = false; } else { B.v *= 0.3; B.stuck = true; }
        }
        const w = o.wave(B.x, B.z, B.t);
        B.y = (o.y || 0) + w;
        if (o.mesh) {
          o.mesh.position.set(B.x, B.y, B.z); o.mesh.rotation.set(0, -B.h, 0);
          // its pitch over the waves: the slope of the water under it, nose up at speed
          const ahead = o.wave(B.x + Math.cos(B.h) * 1.5, B.z + Math.sin(B.h) * 1.5, B.t) - o.wave(B.x - Math.cos(B.h) * 1.5, B.z - Math.sin(B.h) * 1.5, B.t);
          o.mesh.rotation.z = Math.atan2(ahead, 3) + clamp(B.v / o.vmax, 0, 1) * 0.08; o.mesh.rotation.order = 'YZX';
        }
        if (B.on && B.shot) B.cam(dt);
      },
      // the camera behind it, as behind the car (upright: higher and further back)
      cam(dt) {
        const C = typeof Render !== 'undefined' ? Render.camera : null, S = B.shot; if (!C || !S) return;
        const up = C.aspect < 1, uc = Render.cam || {}, D = (up ? o.D[0] : o.D[1]) * (uc.userZoom || 1), pitch = (up ? 0.98 : 0.9) * (1 - (uc.userTilt || 0)), a0 = up ? 9 : 6;
        B.hs += Math.atan2(Math.sin(B.h - B.hs), Math.cos(B.h - B.hs)) * (1 - Math.exp(-dt * 3));
        const fx = Math.cos(B.hs), fz = Math.sin(B.hs), tx = B.x + fx * a0, tz = B.z + fz * a0, ty = (o.y || 0);
        S.tx = tx; S.ty = ty; S.tz = tz; S.px = tx - fx * D * Math.cos(pitch); S.pz = tz - fz * D * Math.cos(pitch); S.py = ty + D * Math.sin(pitch);
        S.fov = up ? 58 : 46; S.fogD = D; S.gy = ty;
      },
      get speed() { return Math.abs(B.v); },
    };
    if (o.mesh) { o.mesh.visible = !!o.keep; run.add(o.mesh); }
    undo(run, () => { if (B.on && typeof Render !== 'undefined' && Render.setShot) Render.setShot(null); B.on = false; if (hasDoc()) document.body.classList.remove('mis-boat'); });
    return B;
  }

  // the player's car as another vehicle of simple bodies on its own view (the physics its own)
  function skin(run, P, build) {
    const R = typeof Render !== 'undefined' ? Render : null, v = R && R.viewOf ? R.viewOf(P) : null;
    if (!has3() || !v || !MisKit.parts) return null;
    const hide = [v.body, v.tail, v.dec].concat(v.wf || [], v.wr || []);
    for (const x of hide) if (x) x.visible = false;
    if (v.marker) v.marker.visible = false;
    const B = MisKit.parts(); build(B);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true }), mesh = B.mesh(mat); mesh.castShadow = true;
    const g = new THREE.Group(); g.name = 'misSkin'; g.add(mesh); v.bodyG.add(g);
    undo(run, () => { v.bodyG.remove(g); g.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material && x.material !== mat) [].concat(x.material).forEach(m => m.dispose()); }); mat.dispose(); for (const x of hide) if (x) x.visible = true; });
    return g;
  }

  // people: a body and a head each, all of them two draws; put(k, ...) shows the k-th there, hide(k)
  function crowd(run, max) {
    const C = { n: max, put() {}, hide() {}, g: null };
    if (!has3()) return C;
    const bodyG = new THREE.BoxGeometry(0.5, 1.15, 0.32); bodyG.translate(0, 0.58 + 0.3, 0);
    const headG = new THREE.BoxGeometry(0.26, 0.28, 0.26); headG.translate(0, 1.68, 0);
    const bm = new THREE.MeshLambertMaterial({ color: 0xffffff }), hm = new THREE.MeshLambertMaterial({ color: 0xd9a77e });
    const body = new THREE.InstancedMesh(bodyG, bm, max), head = new THREE.InstancedMesh(headG, hm, max);
    const g = new THREE.Group(); g.add(body, head); body.castShadow = true;
    const M = new THREE.Matrix4(), Z = new THREE.Matrix4().makeScale(0, 0, 0), col = new THREE.Color();
    for (let k = 0; k < max; k++) { body.setMatrixAt(k, Z); head.setMatrixAt(k, Z); body.setColorAt(k, col.setHex(0x3a6fd0)); }
    C.put = (k, x, y, z, ry, c) => { M.makeRotationY(ry || 0); M.setPosition(x, y, z); body.setMatrixAt(k, M); head.setMatrixAt(k, M); if (c != null) { body.setColorAt(k, col.setHex(c)); body.instanceColor.needsUpdate = true; } body.instanceMatrix.needsUpdate = true; head.instanceMatrix.needsUpdate = true; };
    C.hide = (k) => { body.setMatrixAt(k, Z); head.setMatrixAt(k, Z); body.instanceMatrix.needsUpdate = true; head.instanceMatrix.needsUpdate = true; };
    body.frustumCulled = false; head.frustumCulled = false;
    run.add(g); C.g = g;
    return C;
  }

  // labels over places in the world: a list each frame
  function tags(run) {
    const T = { set() {} };
    if (!hasDoc() || !has3()) return T;
    const el = document.createElement('div'); el.id = 'mis-tags'; el.className = 'on'; document.body.appendChild(el);
    const v = new THREE.Vector3(); let last = '';
    T.set = (list) => {
      const C = Render.camera; if (!C) return;
      let html = '';
      for (const t of list || []) { v.set(t.x, t.y, t.z).project(C); if (v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) continue;
        html += '<i class="' + (t.cls || '') + '" style="left:' + ((v.x + 1) * 50).toFixed(2) + '%;top:' + ((1 - v.y) * 50).toFixed(2) + '%">' + t.html + '</i>'; }
      if (html !== last) { el.innerHTML = html; last = html; }
    };
    undo(run, () => el.remove());
    return T;
  }

  // a big button over the pedals: one press, one take()
  function button(run, label) {
    const K = { n: 0, shown: false, show() {}, take() { if (K.n > 0) { K.n = 0; return true; } return false; }, label() {} };
    if (!hasDoc() || !has3()) return K;
    const b = document.createElement('button'); b.id = 'mis-btn'; b.type = 'button'; b.textContent = tr(label); document.body.appendChild(b);
    b.addEventListener('pointerdown', (e) => { K.n++; b.classList.add('on'); e.preventDefault(); e.stopPropagation(); });
    const off = () => b.classList.remove('on'); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    K.show = (on) => { on = !!on; if (on === K.shown) return; K.shown = on; b.classList.toggle('on-show', on); if (!on) K.n = 0; };
    K.label = (s) => { const t = tr(s); if (b.textContent !== t) b.textContent = t; };
    K.el = b;
    undo(run, () => b.remove());
    return K;
  }

  return { water, wade, boat, skin, crowd, tags, button };
})());
/* ---------------- the snow (group 4: missions 30, 33, 53) ----------------
     MisKit.snowTex(kind): a canvas texture: 'ribs' (the groomed snow's fine ribs along the travel), 'fresh' (untouched powder, lumpy).
     MisKit.band(run, max, o): a band on the ground (one draw, room for max cross-sections): add(x, y, z, ax, az) the next cross-section
       (its centre, its half-width along ax, az), cut() ends the band (the next add starts a new one); o.tex, o.rep (the texture's metres
       along), o.across (its repeats across), o.col, o.order. The groomed trail behind the snowcat, the tracks of chains.
     MisKit.cover(run, T, s0, s1, o): a band over the road from s0 to s1 (one draw), o.w its half-width past the road's edge, o.lift m over
       the road, o.tex (default the fresh snow), o.step m a cross-section; its cross-sections' s in .s (for a mission to change their look).
     MisKit.piles(run, T, s0, s1, o): snow heaped along the road's edges (one draw: lumps every o.every m, o.side 1 / -1 / 0 both, o.off m past
       the edge, o.h m high, o.skip(s) none there); returns the mesh (or null).
     MisKit.block(P, o): a thing standing on the road as a box the car bumps into (o.x, o.z, o.h its heading, o.L long, o.W wide): the car
       pushed out of it, its speed into it taken away; returns the speed it came in with (m/s, 0: no touch). */
Object.assign(MisKit, (function () {
  'use strict';
  const has3 = () => typeof THREE !== 'undefined' && typeof document !== 'undefined';
  const texs = {};
  function snowTex(kind) {
    if (!has3()) return null;
    if (texs[kind]) return texs[kind];
    const c = document.createElement('canvas'), n = 64; c.width = c.height = n; const g = c.getContext('2d');
    if (kind === 'ribs') {
      g.fillStyle = '#c3d0de'; g.fillRect(0, 0, n, n);
      for (let x = 0; x < n; x += 8) { g.fillStyle = '#8196ad'; g.fillRect(x, 0, 3, n); g.fillStyle = '#f4f8fc'; g.fillRect(x + 4, 0, 2, n); }
    } else {
      g.fillStyle = '#f1f5f9'; g.fillRect(0, 0, n, n);
      for (let k = 0; k < 90; k++) { const x = (k * 37) % n, y = (k * 53 + (k * k) % 17) % n, r = 2 + (k % 5); g.fillStyle = k % 3 ? 'rgba(170,186,204,.22)' : 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); }
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    return (texs[kind] = t);
  }
  function band(run, max, o) {
    o = Object.assign({ tex: null, rep: 2, across: 6, col: 0xffffff, order: 1 }, o);
    const B = { n: 0, add() {}, cut() {}, mesh: null };
    if (!has3()) return B;
    const pos = new Float32Array(max * 2 * 3), uv = new Float32Array(max * 2 * 2), idx = new Uint32Array((max - 1) * 6);
    const G = new THREE.BufferGeometry();
    const nor = new Float32Array(max * 2 * 3); for (let k = 1; k < nor.length; k += 3) nor[k] = 1;   // (lying flat: lit from above)
    G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); G.setIndex(new THREE.BufferAttribute(idx, 1));
    G.setDrawRange(0, 0);
    const M = new THREE.MeshLambertMaterial({ color: o.col, map: o.tex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const mesh = new THREE.Mesh(G, M); mesh.frustumCulled = false; mesh.renderOrder = o.order; mesh.receiveShadow = true;
    run.add(mesh); B.mesh = mesh;
    let open = false, lx = 0, lz = 0, v = 0, ni = 0;
    B.add = (x, y, z, ax, az) => {
      if (B.n >= max) return;
      const k = B.n;
      if (open) v += Math.hypot(x - lx, z - lz) / o.rep;
      pos.set([x - ax, y, z - az, x + ax, y, z + az], k * 6); uv.set([0, v, o.across, v], k * 4);
      if (open) { const a = (k - 1) * 2; idx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], ni); ni += 6; }
      lx = x; lz = z; open = true; B.n++;
      G.attributes.position.needsUpdate = G.attributes.uv.needsUpdate = G.index.needsUpdate = true;
      G.setDrawRange(0, ni);
    };
    B.cut = () => { open = false; };
    return B;
  }
  function cover(run, T, s0, s1, o) {
    o = Object.assign({ w: 0.4, lift: 0.05, step: 3, tex: null, col: 0xffffff, rep: 6, across: 3 }, o);
    const n = Math.max(2, Math.floor((s1 - s0) / o.step) + 1), C = { s: [], band: null };
    for (let k = 0; k < n; k++) C.s.push(s0 + k * o.step);
    if (!has3()) return C;
    const B = C.band = band(run, n, { tex: o.tex || snowTex('fresh'), rep: o.rep, across: o.across, col: o.col, order: 0 });
    for (const s of C.s) { const i = T.idx(s), w = T.wS(s) + o.w; B.add(T.px[i], T.hy[i] + o.lift, T.pz[i], T.nx[i] * w, T.nz[i] * w); }
    return C;
  }
  function piles(run, T, s0, s1, o) {
    o = Object.assign({ every: 4, side: 0, off: 0.6, h: 1.0, skip: null, col: 0xeef3f8 }, o);
    if (!has3() || !MisKit.parts) return null;
    const B = MisKit.parts(), W = typeof Render !== 'undefined' && Render.world, sides = o.side ? [o.side] : [-1, 1];
    let k = 0;
    for (let s = s0; s <= s1; s += o.every) {
      if (o.skip && o.skip(s)) continue;
      const i = T.idx(s);
      for (const sd of sides) {
        k++; const r = ((k * 0.6180339) % 1), off = T.wS(s) + o.off + r * 0.6, x = T.px[i] + T.nx[i] * off * sd, z = T.pz[i] + T.nz[i] * off * sd;
        const gh = W && W.groundH ? W.groundH(x, z) : NaN, y = Math.max(Number.isFinite(gh) ? gh : -1e9, T.hy[i]);
        const M = new THREE.Matrix4().compose(new THREE.Vector3(x, y + o.h * 0.15, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r * 6.28, 0)), new THREE.Vector3(o.every * (0.65 + 0.3 * r), o.h * (0.7 + 0.6 * ((k * 0.414) % 1)), 1.2 + r));
        B.L.push({ g: new THREE.IcosahedronGeometry(0.5, 0), m: M, c: o.col });
      }
    }
    if (!B.L.length) return null;
    const mesh = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); mesh.receiveShadow = true; run.add(mesh);
    return mesh;
  }
  function block(P, o) {
    const ch = Math.cos(o.h), sh = Math.sin(o.h), dx = P.x - o.x, dz = P.z - o.z;
    const lx = dx * ch + dz * sh, lz = -dx * sh + dz * ch, r = Math.max(1, (P.m && P.m.wid) || 2) / 2 + 0.2, hx = o.L / 2 + r, hz = o.W / 2 + r;
    if (Math.abs(lx) >= hx || Math.abs(lz) >= hz) return 0;
    const px = hx - Math.abs(lx), pz = hz - Math.abs(lz);
    let nx, nz, d;
    if (px < pz) { nx = Math.sign(lx) * ch; nz = Math.sign(lx) * sh; d = px; } else { nx = -Math.sign(lz) * sh; nz = Math.sign(lz) * ch; d = pz; }
    P.x += nx * d; P.z += nz * d;
    const vn = (P.vx || 0) * nx + (P.vz || 0) * nz;
    if (vn < 0) { P.vx -= vn * nx; P.vz -= vn * nz; return -vn; }
    return 0.01;
  }
  return { snowTex, band, cover, piles, block };
})());
if (typeof module !== 'undefined') module.exports = MisKit;
