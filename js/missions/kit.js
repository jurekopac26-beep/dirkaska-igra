/* Special missions (js/missions.js) · the shared kit (MisKit): what more than one mission uses, so each takes it from here instead of
   writing it again (docs/misije.md, Sistem misij).
     MisKit.truckModel(base, over): the player's vehicle as a clone of a model (Core.MODELS: never changed) with its own numbers (vLim ...).
     MisKit.fireTruck(run): the fire engine C · Avtolestev (slike-predlogi blender/modeli/v2.glb, 8.4 x 2.5 x 3.4 m) of simple bodies on the
       player's own view (its body hidden, the physics its own): the cab, the body with its shutters, three axles, the turntable at the back
       and the ladder of five sections over the cab with its basket at the tip, the blue lamps flashing (~8 draw calls). Its ladder: lift
       (0..1.4 rad), ext (0..1: 7.2 to 33.6 m), yaw (rad, from forward); tip(): the basket in the world; nozzle(): where the water leaves.
     MisKit.fire(run, max): flames (one Points draw: the spots set with spot(i, x, y, z, size); size 0 is out), smoke over them (one more).
     MisKit.jet(run): the water's stream from a point to a point (one Points draw) and its splash; set(from, to, on).
     MisKit.aim(run, o): the finger's aim on the screen (drag anywhere over the game) and the GASI button held; a ring where the water goes;
       o.plane 'v' (a wall facing the camera through o.focus) or 'g' (the ground at o.focus's height). on(true) shows it, the driving
       controls hidden; point: the world point aimed at; spray: GASI held.
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
    if (!has3() || !v) return Object.assign(T, { step() {}, tip: () => null, nozzle: () => null, yawTo: (x, z) => Math.atan2(-(-(x - P.x) * Math.sin(P.h) + (z - P.z) * Math.cos(P.h)), (x - P.x) * Math.cos(P.h) + (z - P.z) * Math.sin(P.h)), len: () => LAD.L0 + T.ext * LAD.step * (LAD.sec - 1) });
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
      // the turntable's angle that points the ladder at a world point (x, z): from the turntable itself, not the truck's middle
      yawTo(x, z) { turn.updateWorldMatrix(true, false); turn.getWorldPosition(_v); const h = P.h, dx = x - _v.x, dz = z - _v.z; return Math.atan2(-(-dx * Math.sin(h) + dz * Math.cos(h)), dx * Math.cos(h) + dz * Math.sin(h)); },
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
  function fire(run, max) {
    const F = { n: max, spots: new Array(max).fill(null), step() {}, spot(i, x, y, z, s) { F.spots[i] = s > 0 ? [x, y, z, s] : null; } };
    if (!has3() || typeof Render === 'undefined' || !Render.camera) return F;
    const fl = points(max, 6, FL_FS, {}, {});
    const sm = points(max, 4, SM_FS, {}, { uRise: { value: 2.6 }, uGrow: { value: 1.6 }, uRate: { value: 0.22 }, uCol: { value: new THREE.Color(0x3a3a3f) }, uOp: { value: 0.85 } });
    run.add(fl.P); run.add(sm.P);
    let t = 0;
    F.smoke = sm; F.flames = fl;
    F.spot = (i, x, y, z, s) => {
      F.spots[i] = s > 0 ? [x, y, z, s] : null;
      for (const [o, k0, f] of [[fl, i * fl.per, 1], [sm, i * sm.per, 1.6]]) for (let k = 0; k < o.per; k++) {
        const j = k0 + k, a = (k / o.per) * 6.283, r = s * 0.35 * (k % 2 ? 1 : 0.5);
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
    pad.addEventListener('pointerdown', (e) => { if (e.target === btn) return; drag = e.pointerId; at(e); e.preventDefault(); });
    pad.addEventListener('pointermove', (e) => { if (drag === e.pointerId) { at(e); e.preventDefault(); } });
    const up = (e) => { if (drag === e.pointerId) drag = null; };
    pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
    btn.addEventListener('pointerdown', (e) => { A.spray = true; btn.classList.add('on'); e.preventDefault(); e.stopPropagation(); });
    const off = () => { A.spray = false; btn.classList.remove('on'); };
    btn.addEventListener('pointerup', off); btn.addEventListener('pointercancel', off); btn.addEventListener('pointerleave', off);
    const touch = document.getElementById('touch');
    A.on = (show) => {
      show = !!show; if (show === A.shown) return; A.shown = show; pad.classList.toggle('on', show);
      if (touch) touch.classList.toggle('mis-hide', show); document.body.classList.toggle('mis-aiming', show);
      if (!show) off();
      if (show && typeof Input !== 'undefined' && Input.reset) Input.reset();
    };
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), pl = new THREE.Plane(), hit = new THREE.Vector3(), n = new THREE.Vector3();
    A.step = () => {
      if (!A.shown) return;
      const C = Render.camera, f = A.o.focus; if (!C || !f) return;
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
if (typeof module !== 'undefined') module.exports = MisKit;
